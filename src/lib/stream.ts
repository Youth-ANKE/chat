/**
 * SSE stream reader — yields one JSON data line at a time.
 * Handles cases where TCP chunk boundaries split a data line.
 */
export async function* readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');

    // Last line may be incomplete — keep it in buffer for the next chunk
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        yield data;
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim().startsWith('data: ')) {
    const data = buffer.trim().slice(6);
    if (data !== '[DONE]') yield data;
  }
}

/**
 * Token Scheduler
 *
 * Problem: React 18 auto-batching merges multiple synchronous setState calls
 * into one re-render. So if 50 reasoning tokens arrive in one TCP chunk and we
 * call appendReasoning() 50 times synchronously, React collapses them into
 * ONE render — the user sees nothing until the final state.
 *
 * Solution: accumulate tokens as fast as they arrive, but flush to React
 * state at display refresh rate using a requestAnimationFrame loop. Between
 * each flush, we use setTimeout(0) to yield the event loop so React can
 * commit and the browser can paint.
 */
class TokenScheduler {
  private reasoningBuf: string[] = [];
  private contentBuf: string[] = [];
  private rafId: number | null = null;
  private onReasoning?: (chunk: string) => void;
  private onToken: (chunk: string) => void;
  private onDone: () => void;
  private aborted = false;

  constructor(
    onToken: (chunk: string) => void,
    onReasoning: ((chunk: string) => void) | undefined,
    onDone: () => void
  ) {
    this.onToken = onToken;
    this.onReasoning = onReasoning;
    this.onDone = onDone;
  }

  pushReasoning(chunk: string) {
    if (this.aborted) return;
    this.reasoningBuf.push(chunk);
    this.scheduleFlush();
  }

  pushContent(chunk: string) {
    if (this.aborted) return;
    this.contentBuf.push(chunk);
    this.scheduleFlush();
  }

  flush() {
    this.aborted = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    // Flush immediately
    if (this.reasoningBuf.length > 0) {
      this.onReasoning?.(this.reasoningBuf.join(''));
      this.reasoningBuf = [];
    }
    if (this.contentBuf.length > 0) {
      this.onToken(this.contentBuf.join(''));
      this.contentBuf = [];
    }
    this.onDone();
  }

  /** Schedule the next flush at the start of the next animation frame */
  private scheduleFlush() {
    if (this.rafId !== null) return; // already scheduled
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;

      const reasoning = this.reasoningBuf.length > 0 ? this.reasoningBuf.join('') : '';
      const content = this.contentBuf.length > 0 ? this.contentBuf.join('') : '';
      this.reasoningBuf = [];
      this.contentBuf = [];

      // Update React state
      if (reasoning) this.onReasoning?.(reasoning);
      if (content) this.onToken(content);

      // Yield the event loop with setTimeout(0) so React can commit
      // the state update and browser can paint before the next rAF.
      // Without this, React 18 batching collapses consecutive rAF
      // updates into one render.
      setTimeout(() => {
        // If more tokens arrived during this frame, schedule next flush
        if (this.reasoningBuf.length > 0 || this.contentBuf.length > 0) {
          this.scheduleFlush();
        }
      }, 0);
    });
  }
}

import type { APITokenUsage } from '../types';
import { DEFAULT_DEEPSEEK_MODEL } from '../types';

export interface StreamCallbacks {
  onToken: (content: string) => void;
  onReasoning?: (content: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  onUsage?: (usage: APITokenUsage) => void;
  /** Called before a retry attempt starts — the UI should clear stale partial content */
  onRetry?: () => void;
  signal?: AbortSignal;
}

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

/** Return true if the error is non-retryable (e.g. 4xx client error) */
function isNonRetryableError(response: Response): boolean {
  return response.status >= 400 && response.status < 500 && response.status !== 429;
}

/** Exponential backoff: 1s, 2s, 4s */
function retryDelay(attempt: number): number {
  return BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
}

export async function streamChat(
  params: {
    messages: { role: string; content: string; attachments?: { type: 'image' | 'text'; mimeType: string; data: string; name: string }[] }[];
    model?: string;
    temperature?: number;
    max_tokens?: number;
    thinking?: boolean;
    systemPrompt?: string;
    webSearch?: boolean;
    topP?: number;
    /** When false, buffer the entire response and deliver it all at once (no typewriter effect) */
    streamOutput?: boolean;
    /** Custom API base URL (for multi-provider support) */
    apiBase?: string;
    /** Custom API key */
    apiKey?: string;
    /** Custom user-defined tools (merged with web_search if enabled) */
    customTools?: { name: string; description: string; parameters: Record<string, unknown> }[];
  },
  callbacks: StreamCallbacks
): Promise<AbortController> {
  const controller = new AbortController();

  // Wire abort signal — external abort propagates to the controller
  if (callbacks.signal) {
    const onSignalAbort = () => {
      if (!controller.signal.aborted) controller.abort();
    };
    callbacks.signal.addEventListener('abort', onSignalAbort, { once: true });
  }

  // ── Build messages — convert attachments to multimodal format ──
  const apiMessages: Record<string, unknown>[] = [];
  for (const msg of params.messages) {
    if (msg.attachments && msg.attachments.length > 0) {
      const contentParts: Record<string, unknown>[] = [];

      const textFiles = msg.attachments.filter((a) => a.type === 'text');
      const imageFiles = msg.attachments.filter((a) => a.type === 'image');

      let textContent = msg.content;
      if (textFiles.length > 0) {
        textContent =
          textFiles
            .map((f) => `[文件: ${f.name}]\n\`\`\`\n${f.data}\n\`\`\``)
            .join('\n\n') +
          (msg.content ? '\n\n' + msg.content : '');
      }

      contentParts.push({ type: 'text', text: textContent });

      for (const img of imageFiles) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: img.data },
        });
      }

      apiMessages.push({ role: msg.role, content: contentParts });
    } else {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  if (params.systemPrompt) {
    apiMessages.unshift({ role: 'system', content: params.systemPrompt });
  }

  // ── Build API request body ──
  const body: Record<string, unknown> = {
    messages: apiMessages,
    model: params.model ?? DEFAULT_DEEPSEEK_MODEL,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 4096,
    thinking: params.thinking ?? false,
    stream_options: { include_usage: true },
  };

  if (params.topP !== undefined && params.topP < 1) {
    body.top_p = Math.round(params.topP * 100) / 100;
  }

  // Build tools array (web_search + custom tools)
  const tools: Record<string, unknown>[] = [];

  if (params.webSearch) {
    tools.push({
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for real-time information',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query',
            },
          },
          required: ['query'],
        },
      },
    });
  }

  if (params.customTools && params.customTools.length > 0) {
    for (const ct of params.customTools) {
      tools.push({
        type: 'function',
        function: {
          name: ct.name,
          description: ct.description,
          parameters: ct.parameters,
        },
      });
    }
  }

  if (tools.length > 0) {
    body.tools = tools;
  }

  const shouldStream = params.streamOutput !== false; // default: true
  let retryCount = 0;

  // ── Retry loop with exponential backoff ──
  while (true) {
    if (controller.signal.aborted) break;

    try {
      const apiEndpoint = params.apiBase ?? '/api/chat';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (params.apiKey) {
        headers['Authorization'] = `Bearer ${params.apiKey}`;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(120_000)]),
      });

      // Handle non-OK responses
      if (!response.ok) {
        // 429 (rate limit) → retryable
        if (response.status === 429 && retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = retryDelay(retryCount);
          console.warn(`[stream] 速率限制，${(delay / 1000).toFixed(0)}s 后重试 (${retryCount}/${MAX_RETRIES})`);
          await new Promise((r) => {
            const timeout = setTimeout(r, delay);
            // Abort during delay: clear timer and stop retrying
            controller.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });
          });
          if (controller.signal.aborted) break;
          continue;
        }

        // 4xx client errors → non-retryable
        if (isNonRetryableError(response)) {
          let detail = '';
          try {
            const text = await response.text();
            try {
              const err = JSON.parse(text);
              detail = (err as { detail?: string }).detail ?? '';
            } catch {
              detail = text;
            }
          } catch {
            /* ignore */
          }
          callbacks.onError(detail || `HTTP ${response.status}`);
          return controller;
        }

        // 5xx server errors → retryable
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = retryDelay(retryCount);
          console.warn(`[stream] 服务端错误 (${response.status})，${(delay / 1000).toFixed(0)}s 后重试 (${retryCount}/${MAX_RETRIES})`);
          await new Promise((r) => {
            const timeout = setTimeout(r, delay);
            controller.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });
          });
          if (controller.signal.aborted) break;
          continue;
        }

        let detail = '';
        try {
          detail = await response.text();
        } catch { /* ignore */ }
        callbacks.onError(detail || `HTTP ${response.status}`);
        return controller;
      }

      if (!response.body) {
        callbacks.onError('No response body');
        return controller;
      }

      const reader = response.body.getReader();

      // ── If this is a retry, tell the UI to clear stale content ──
      if (retryCount > 0) {
        callbacks.onRetry?.();
      }

      // ── Non-streaming mode: buffer everything, deliver all at once ──
      if (!shouldStream) {
        let totalReasoning = '';
        let totalContent = '';

        for await (const data of readSSEStream(reader)) {
          if (controller.signal.aborted) break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;

            if (parsed.usage) {
              callbacks.onUsage?.({
                prompt_tokens: parsed.usage.prompt_tokens ?? 0,
                completion_tokens: parsed.usage.completion_tokens ?? 0,
                total_tokens: parsed.usage.total_tokens ?? 0,
                prompt_cache_hit_tokens: parsed.usage.prompt_cache_hit_tokens,
                prompt_cache_miss_tokens: parsed.usage.prompt_cache_miss_tokens,
              });
              continue;
            }

            if (!delta) continue;

            if (delta.reasoning_content) {
              totalReasoning += delta.reasoning_content;
            }
            if (delta.content) {
              totalContent += delta.content;
            }
          } catch {
            // Skip unparseable chunks
          }
        }

        // Deliver the full response at once
        if (totalReasoning) callbacks.onReasoning?.(totalReasoning);
        if (totalContent) callbacks.onToken(totalContent);
        callbacks.onDone();
        return controller;
      }

      // ── Streaming mode: use TokenScheduler for smooth typewriter effect ──
      const scheduler = new TokenScheduler(
        callbacks.onToken,
        callbacks.onReasoning,
        callbacks.onDone
      );

      const onAbort = () => {
        scheduler.flush();
      };
      controller.signal.addEventListener('abort', onAbort, { once: true });

      for await (const data of readSSEStream(reader)) {
        if (controller.signal.aborted) break;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;

          // Extract usage data from the final SSE event (DeepSeek sends usage
          // at the end of the stream when include_usage is true)
          if (parsed.usage) {
            callbacks.onUsage?.({
              prompt_tokens: parsed.usage.prompt_tokens ?? 0,
              completion_tokens: parsed.usage.completion_tokens ?? 0,
              total_tokens: parsed.usage.total_tokens ?? 0,
              prompt_cache_hit_tokens: parsed.usage.prompt_cache_hit_tokens,
              prompt_cache_miss_tokens: parsed.usage.prompt_cache_miss_tokens,
            });
            continue;
          }

          if (!delta) continue;

          if (delta.reasoning_content) {
            scheduler.pushReasoning(delta.reasoning_content);
          }

          if (delta.content) {
            scheduler.pushContent(delta.content);
          }
        } catch {
          // Skip unparseable chunks
        }
      }

      // Final flush (handles remaining buffered tokens and calls onDone)
      scheduler.flush();
      controller.signal.removeEventListener('abort', onAbort);

      // Success — exit retry loop
      break;
    } catch (err: unknown) {
      // AbortError — user cancelled, not a real error
      if (err instanceof Error && err.name === 'AbortError') {
        callbacks.onDone();
        break;
      }

      // Network errors — retryable
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = retryDelay(retryCount);
        const reason = err instanceof Error ? err.message : 'Unknown';
        console.warn(`[stream] 网络错误: ${reason}，${(delay / 1000).toFixed(0)}s 后重试 (${retryCount}/${MAX_RETRIES})`);
        await new Promise((r) => {
          const timeout = setTimeout(r, delay);
          controller.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });
        });
        if (controller.signal.aborted) break;
        continue;
      }

      // Exhausted retries
      const reason = err instanceof Error ? err.message : 'Unknown error';
      callbacks.onError(`请求失败 (已重试${MAX_RETRIES}次): ${reason}`);
      break;
    }
  }

  return controller;
}
