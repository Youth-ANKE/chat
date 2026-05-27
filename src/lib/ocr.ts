/**
 * OCR image recognition using a vision-capable model.
 * Sends the image to the API with a prompt to describe/extract text from the image.
 */

export interface OCRResult {
  /** Text extracted from the image */
  text: string;
  /** Whether text was actually found */
  hasText: boolean;
  /** Full model response (may include description beyond raw text) */
  fullResponse: string;
}

/**
 * Use a vision model to extract text from an image.
 * The image should be a base64 data URI.
 */
export async function extractTextFromImage(
  imageDataUri: string,
  model: string,
  apiBase?: string,
  apiKey?: string,
  authType: 'bearer' | 'api-key' = 'bearer',
): Promise<OCRResult> {
  const body = JSON.stringify({
    model,
    messages: [
      {
        role: 'system',
        content: '你是一个OCR助手。请从图片中提取所有可见的文字。如果图片中没有文字，请回复"NO_TEXT"。只输出提取的文字，不要添加额外解释。',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请提取这张图片中的所有文字：' },
          { type: 'image_url', image_url: { url: imageDataUri } },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0,
  });

  const endpoint = (apiBase && apiBase !== '/api/chat')
    ? `${apiBase}/chat/completions`
    : (apiBase ?? '/api/chat');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    if (authType === 'api-key') {
      headers['api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`OCR request failed: ${response.status}`);
  }

  const data = await response.json();
  const fullResponse = data.choices?.[0]?.message?.content ?? '';

  if (fullResponse === 'NO_TEXT' || fullResponse.trim().length === 0) {
    return { text: '', hasText: false, fullResponse };
  }

  return { text: fullResponse.trim(), hasText: true, fullResponse };
}
