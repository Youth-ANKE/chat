#!/usr/bin/env node

/**
 * Minimal API proxy server for local development without Vercel CLI.
 * Usage: node server.js
 * Vite will proxy /api/* → http://localhost:3000
 */

const http = require('http');

const PORT = process.env.API_PORT || 3000;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        resolve({});
      }
    });
  });
}

const VALID_MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'];

async function handleChat(req, res) {
  if (req.method !== 'POST') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }
  if (!DEEPSEEK_API_KEY) {
    return sendJSON(res, 500, { error: 'Missing DEEPSEEK_API_KEY in .env.local' });
  }

  const body = await readBody(req);
  const {
    messages,
    model = 'deepseek-v4-flash',
    temperature = 0.7,
    max_tokens = 4096,
    thinking = false,
    user_id,
    tools,
    top_p,
  } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return sendJSON(res, 400, { error: 'messages is required' });
  }

  const selectedModel = VALID_MODELS.includes(model) ? model : 'deepseek-v4-flash';
  const safeTemperature = Math.min(Math.max(Number(temperature) || 0.7, 0), 2);
  const safeMaxTokens = Math.min(Math.max(Number(max_tokens) || 4096, 1), 8192);

  const payload = JSON.stringify({
    model: selectedModel,
    messages,
    stream: true,
    stream_options: { include_usage: true },
    temperature: safeTemperature,
    max_tokens: safeMaxTokens,
    thinking: { type: thinking ? 'enabled' : 'disabled' },
    ...(user_id ? { user_id } : {}),
    ...(tools ? { tools } : {}),
    ...(top_p !== undefined ? { top_p } : {}),
  });

  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: payload,
  }).catch((err) => null);

  if (!upstream) {
    console.error('[proxy] 无法连接 DeepSeek API，请检查网络');
    return sendJSON(res, 502, { error: 'Cannot reach DeepSeek API' });
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    const statusMsg =
      upstream.status === 401 ? 'Invalid API key'
      : upstream.status === 429 ? 'Rate limited'
      : upstream.status === 402 ? 'Insufficient balance'
      : text;
    console.error(`[proxy] DeepSeek ${upstream.status}: ${statusMsg}`);
    return sendJSON(res, upstream.status, { error: 'DeepSeek API error', detail: statusMsg });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  for await (const chunk of readChunks(reader)) {
    res.write(chunk);
  }
  res.end();
}

async function* readChunks(reader) {
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

// ── Router ──────────────────────────────────────────────
const routes = {
  'POST /api/chat': handleChat,
  'OPTIONS /api/chat': (_req, res) => {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
  },
};

const server = http.createServer((req, res) => {
  const key = `${req.method} ${req.url}`;
  const handler = routes[key];
  if (handler) {
    return handler(req, res).catch((err) => {
      console.error('[proxy]', err.message);
      if (!res.headersSent) sendJSON(res, 500, { error: 'Internal error' });
      else res.end();
    });
  }
  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`  ✅ API 代理服务器已启动 → http://localhost:${PORT}`);
  console.log(`     模型: deepseek-v4-flash / deepseek-v4-pro`);
  console.log(`     Key: ${DEEPSEEK_API_KEY ? '✅ 已配置' : '❌ 未配置！请设置 DEEPSEEK_API_KEY'}\n`);
});
