import type { ModelProvider, ProviderModel } from '../types';

/** Connection test result */
export interface ConnectionResult {
  ok: boolean;
  status?: number;
  error?: string;
  message?: string;
}

/** Fetched model list result */
export interface FetchedModelsResult {
  ok: boolean;
  models: ProviderModel[];
  error?: string;
}

/**
 * Normalise baseUrl: strip trailing slash, auto-append /v1 if missing
 * for APIs that expect it (OpenAI-compatible endpoints).
 */
function normaliseBaseUrl(baseUrl: string): string {
  let url = baseUrl.replace(/\/+$/, '');
  // If it already ends with /v1, keep as-is
  if (url.endsWith('/v1')) return url;
  // Auto-append /v1 for known hosts that expect it
  const needsV1 = /api\.(openai|deepseek|anthropic|googleapis|together\.xyz|groq|fireworks|mistral)\./i.test(url);
  if (needsV1) url += '/v1';
  return url;
}

/**
 * Build headers for an authenticated API request.
 * Falls back to no auth if key is empty (for local providers like Ollama).
 */
function buildHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

/**
 * Test connection to an OpenAI-compatible chat completions endpoint.
 * Sends a minimal ping request and checks the response.
 */
export async function testProviderConnection(
  provider: ModelProvider,
): Promise<ConnectionResult> {
  const baseUrl = normaliseBaseUrl(provider.baseUrl || '');
  const endpoint = `${baseUrl}/chat/completions`;

  // Use the first model as the test target
  const testModel = provider.models[0]?.id || 'gpt-3.5-turbo';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: buildHeaders(provider.apiKey),
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return { ok: true, status: response.status, message: '连接成功' };
    }

    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch { /* ignore */ }

    if (response.status === 401) {
      return { ok: false, status: 401, error: 'API Key 无效，请检查' };
    }
    if (response.status === 403) {
      return { ok: false, status: 403, error: '权限不足，请检查 API Key 或账户余额' };
    }
    if (response.status === 404) {
      return { ok: false, status: 404, error: `端点不存在: ${endpoint}` };
    }
    return { ok: false, status: response.status, error: errorBody.slice(0, 200) || `HTTP ${response.status}` };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { ok: false, error: '请求超时，请检查网络或 Base URL' };
    }
    // CORS errors show as TypeError "Failed to fetch"
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      return { ok: false, error: '网络错误：无法连接（可能是 CORS 限制，桌面版不受此影响）' };
    }
    return { ok: false, error: err.message || '未知错误' };
  }
}

/**
 * Fetch available models from an OpenAI-compatible /models endpoint.
 */
export async function fetchProviderModels(
  provider: ModelProvider,
): Promise<FetchedModelsResult> {
  const baseUrl = normaliseBaseUrl(provider.baseUrl || '');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const response = await fetch(`${baseUrl}/models`, {
      headers: buildHeaders(provider.apiKey),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorBody = '';
      try { errorBody = await response.text(); } catch { /* ignore */ }
      if (response.status === 401) {
        return { ok: false, models: [], error: 'API Key 无效' };
      }
      return { ok: false, models: [], error: errorBody.slice(0, 200) || `HTTP ${response.status}` };
    }

    const data = await response.json();

    // OpenAI-compatible format: { object: "list", data: [{ id: "...", ... }] }
    const rawModels: any[] = data?.data || data?.models || [];

    const merged: ProviderModel[] = [];
    for (const m of rawModels) {
      if (!m.id || typeof m.id !== 'string') continue;
      // Skip non-chat models (embedding, moderation, etc.)
      const idLower = m.id.toLowerCase();
      if (
        idLower.includes('embedding') ||
        idLower.includes('moderation') ||
        idLower.includes('dall-e') ||
        idLower.includes('whisper') ||
        idLower.includes('tts')
      ) continue;

      // Try to guess capabilities from model name
      const supportsVision =
        idLower.includes('vision') ||
        idLower.includes('gpt-4o') ||
        idLower.includes('gemini') ||
        idLower.includes('claude-3') ||
        idLower.includes('claude-4');
      const supportsThinking =
        idLower.includes('reasoning') ||
        idLower.includes('o1') ||
        idLower.includes('o3') ||
        idLower.includes('deepseek-r1');

      merged.push({
        id: m.id,
        name: m.id,
        maxTokens: 8192,
        supportsThinking,
        supportsVision,
        supportsTools: true,
      });
    }

    if (merged.length === 0) {
      return { ok: true, models: [], error: '未找到可用模型，请检查 API Key 权限' };
    }

    return { ok: true, models: merged };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { ok: false, models: [], error: '请求超时' };
    }
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      return { ok: false, models: [], error: '网络错误：无法连接' };
    }
    return { ok: false, models: [], error: err.message || '未知错误' };
  }
}
