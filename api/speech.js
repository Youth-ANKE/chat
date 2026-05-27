export const config = {
  maxDuration: 30,
};

/**
 * Azure Cognitive Services Text-to-Speech proxy.
 * POST /api/speech
 * Body: { text: string, voice: string }
 * Returns audio/mpeg stream.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AZURE_TTS_KEY = process.env.AZURE_TTS_KEY;
  const AZURE_TTS_REGION = process.env.AZURE_TTS_REGION || 'eastasia';

  if (!AZURE_TTS_KEY) {
    return res.status(500).json({ error: 'Missing AZURE_TTS_KEY in environment' });
  }

  const { text, voice } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }

  const safeVoice = voice || 'zh-CN-XiaoheNeural';

  // Validate voice name to prevent SSRF / abuse
  const VALID_VOICES = [
    'zh-CN-XiaoheNeural',
    'zh-TW-HsiaoChenNeural',
    'zh-TW-HsiaoYuNeural',
    'zh-TW-YunJheNeural',
  ];
  const selectedVoice = VALID_VOICES.includes(safeVoice) ? safeVoice : 'zh-CN-XiaoheNeural';

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
    <voice name="${selectedVoice}">${escapeXml(text)}</voice>
  </speak>`;

  try {
    const upstream = await fetch(
      `https://${AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_TTS_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        },
        body: ssml,
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error(`[speech] Azure TTS ${upstream.status}: ${errText}`);
      return res.status(upstream.status).json({
        error: 'Azure TTS API error',
        detail: errText.substring(0, 200),
      });
    }

    const audioBuffer = await upstream.arrayBuffer();

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('[speech] proxy error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.end();
    }
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
