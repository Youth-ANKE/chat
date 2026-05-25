/**
 * SSE stream reader with buffer handling.
 * Handles the case where chunks may split a data line in half.
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

    // Keep the last (potentially incomplete) line in buffer
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

  // Process remaining buffer
  if (buffer.trim().startsWith('data: ')) {
    const data = buffer.trim().slice(6);
    if (data !== '[DONE]') yield data;
  }
}

export interface StreamCallbacks {
  onToken: (content: string) => void;
  onReasoning?: (content: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}

export async function streamChat(
  params: {
    messages: { role: string; content: string }[];
    model?: string;
    temperature?: number;
    max_tokens?: number;
    thinking?: boolean;
    systemPrompt?: string;
  },
  callbacks: StreamCallbacks
): Promise<AbortController> {
  const controller = new AbortController();

  const messages = [...params.messages];
  if (params.systemPrompt) {
    messages.unshift({ role: 'system', content: params.systemPrompt });
  }

  if (callbacks.signal) {
    callbacks.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: params.model ?? 'deepseek-v4-flash',
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 4096,
        thinking: params.thinking ?? false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = '';
      try {
        const err = await response.json();
        detail = (err as { detail?: string }).detail ?? '';
      } catch {
        detail = await response.text();
      }
      callbacks.onError(detail || `HTTP ${response.status}`);
      return controller;
    }

    if (!response.body) {
      callbacks.onError('No response body');
      return controller;
    }

    const reader = response.body.getReader();
    let reasoningText = '';
    let contentText = '';

    for await (const data of readSSEStream(reader)) {
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;

        if (!delta) continue;

        // Handle reasoning / thinking content (DeepSeek V4 thinking mode)
        // DeepSeek API returns reasoning_content as a single string or streaming chunks
        if (delta.reasoning_content && callbacks.onReasoning) {
          callbacks.onReasoning(delta.reasoning_content);
          reasoningText += delta.reasoning_content;
        }

        // Handle regular content
        if (delta.content) {
          callbacks.onToken(delta.content);
          contentText += delta.content;
        }
      } catch {
        // Skip unparseable chunks
      }
    }

    // If thinking was enabled but only got reasoning with no content,
    // show the reasoning summary as content so user sees something useful
    if (params.thinking && !contentText && reasoningText.length > 0) {
      // The API only returned reasoning - this is expected for some models
      // Just finish; ThinkingBlock will display the reasoning content
      console.log('[stream] Got reasoning only:', reasoningText.length, 'chars');
    }

    callbacks.onDone();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      // User cancelled - not an error
      callbacks.onDone();
    } else {
      callbacks.onError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return controller;
}
