import { getValidModel, DEFAULT_MODEL } from './model-validation.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: 'Missing DEEPSEEK_API_KEY' });
  }

  const {
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.7,
    max_tokens = 4096,
    thinking = false,
    user_id,
    tools,
    top_p,
  } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages is required' });
  }

  const selectedModel = getValidModel(model);

  // Clamp parameters
  const safeTemperature = Math.min(Math.max(Number(temperature) || 0.7, 0), 2);
  const safeMaxTokens = Math.min(Math.max(Number(max_tokens) || 4096, 1), 8192);

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: safeTemperature,
        max_tokens: safeMaxTokens,
        thinking: {
          type: thinking ? 'enabled' : 'disabled',
        },
        ...(user_id ? { user_id } : {}),
        ...(tools ? { tools } : {}),
        ...(top_p !== undefined ? { top_p } : {}),
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      const status = upstream.status;
      const detail =
        status === 401
          ? 'Invalid API key'
          : status === 429
          ? 'Rate limited by DeepSeek'
          : status === 402
          ? 'Insufficient balance'
          : text;

      return res.status(status).json({
        error: 'DeepSeek API error',
        detail,
      });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } finally {
      reader.releaseLock();
    }

    res.end();
  } catch (error) {
    console.error('DeepSeek proxy error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.end();
    }
  }
}
