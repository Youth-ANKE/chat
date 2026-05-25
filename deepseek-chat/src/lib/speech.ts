/**
 * Streaming Text-to-Speech using Web Speech API – no dependencies.
 * Accumulates streaming tokens, detects sentence boundaries,
 * and speaks complete sentences as they arrive.
 */

let textBuffer = '';
let speechEnabled = false;
let drainTimer: number | null = null;
let currentVoice: string | undefined;
let audioPlayQueue: HTMLAudioElement[] = [];

// ── Text sanitization ──

/** Remove markdown/code formatting and non-speakable symbols. */
function stripMarkdown(text: string): string {
  return text
    // Remove code blocks (``` ... ```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]*`/g, '')
    // Remove emojis and other unicode pictographic symbols
    .replace(/\p{Extended_Pictographic}/gu, '')
    // Remove remaining standalone emoji-related characters (variation selectors, ZWJ, etc.)
    .replace(/[\uFE0F\u200D\uFE0E]/g, '')
    // Remove headers (#, ##, ...)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers but keep content
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    // Remove list markers ( - , *  at line start)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // Remove numbered list markers
    .replace(/^\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove links [text](url) but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove stray formatting characters
    .replace(/^[>\s]*/gm, '')
    // Collapse multiple spaces left by removed emojis
    .replace(/\s{2,}/g, ' ')
    // Collapse multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Engine control ──

export function setSpeechEnabled(on: boolean) {
  speechEnabled = on;
  if (!on) {
    window.speechSynthesis.cancel();
    stopAzureAudio();
    textBuffer = '';
    if (drainTimer !== null) {
      clearTimeout(drainTimer);
      drainTimer = null;
    }
  }
}

export function setSpeechVoice(voiceURI?: string) {
  currentVoice = voiceURI;
  // Cancel any in-flight Azure TTS audio when switching voices
  stopAzureAudio();
}

// ── Streaming API ──

/**
 * Feed a chunk of text from the streaming response.
 * Sentences are spoken automatically when boundaries are detected.
 */
export function speakChunk(chunk: string) {
  if (!speechEnabled) return;
  textBuffer += chunk;

  // Debounce — wait briefly for more text before attempting to speak
  if (drainTimer !== null) clearTimeout(drainTimer);
  drainTimer = window.setTimeout(() => {
    drainTimer = null;
    tryDrain();
  }, 200);
}

/**
 * Flush any remaining text in the buffer — call when streaming is done.
 */
export function flushSpeech() {
  if (drainTimer !== null) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
  if (!speechEnabled) return;
  if (textBuffer.trim()) {
    speak(textBuffer.trim());
    textBuffer = '';
  }
}

/**
 * Immediately stop all TTS and clear buffer.
 */
export function stopSpeech() {
  window.speechSynthesis.cancel();
  stopAzureAudio();
  textBuffer = '';
  if (drainTimer !== null) {
    clearTimeout(drainTimer);
    drainTimer = null;
  }
}

// ── Internals ──

function tryDrain() {
  // Split on sentence boundaries, keep the delimiter attached
  const parts = textBuffer.split(/(?<=[。！？.!?\n])/);

  if (parts.length <= 1) return; // No sentence boundary yet

  // Speak all complete sentences except the last (may be incomplete)
  for (let i = 0; i < parts.length - 1; i++) {
    const sentence = parts[i].trim();
    if (sentence) speak(sentence);
  }

  textBuffer = parts[parts.length - 1];
}

function speak(text: string) {
  // Strip markdown/code formatting before speaking
  const clean = stripMarkdown(text);
  if (!clean) return;

  // Azure neural voices (via remote TTS API)
  if (currentVoice && currentVoice.startsWith('azure://')) {
    const voiceName = currentVoice.replace('azure://', '');
    speakAzure(clean, voiceName);
    return;
  }

  // Web Speech API (browser-built-in voices)
  const utt = new SpeechSynthesisUtterance(clean);
  utt.rate = 1.1;
  utt.pitch = 1.0;
  utt.volume = 0.9;

  if (currentVoice) {
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((v) => v.voiceURI === currentVoice);
    if (v) utt.voice = v;
  }

  window.speechSynthesis.speak(utt);
}

// Azure TTS: fetch audio from our API proxy and play using Audio element

function stopAzureAudio() {
  for (const el of audioPlayQueue) {
    el.pause();
    el.remove();
  }
  audioPlayQueue = [];
}

async function speakAzure(text: string, voiceName: string) {
  try {
    const resp = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: voiceName }),
    });

    if (!resp.ok) {
      console.error('[speech] Azure TTS failed', resp.status);
      return;
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 0.9;
    audio.playbackRate = 1.1;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      audioPlayQueue = audioPlayQueue.filter((el) => el !== audio);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      audioPlayQueue = audioPlayQueue.filter((el) => el !== audio);
    };

    audioPlayQueue.push(audio);
    audio.play().catch((err) => {
      console.warn('[speech] Azure audio play failed:', err);
    });
  } catch (err) {
    console.error('[speech] Azure TTS error:', err);
  }
}

// ── Voice preview ──

/**
 * Speak a short sample text with a specific voice to preview it.
 * Interrupts any ongoing preview but NOT the main streaming TTS.
 */
let previewUtt: SpeechSynthesisUtterance | null = null;
export function previewVoice(voiceURI?: string) {
  // Cancel only preview, keep main TTS untouched if it's running
  if (previewUtt) {
    window.speechSynthesis.cancel();
    previewUtt = null;
  }

  const sample = voiceURI
    ? '你好，这是一段语音预览示例，用于测试当前选中的朗读声音效果。'
    : '你好，这是系统默认的朗读声音效果预览。';

  // Azure neural voice preview
  if (voiceURI && voiceURI.startsWith('azure://')) {
    const voiceName = voiceURI.replace('azure://', '');
    speakAzurePreview(sample, voiceName);
    return;
  }

  const utt = new SpeechSynthesisUtterance(sample);
  utt.rate = 1.0;
  utt.pitch = 1.0;
  utt.volume = 0.8;

  if (voiceURI) {
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((v) => v.voiceURI === voiceURI);
    if (v) utt.voice = v;
  }

  previewUtt = utt;
  utt.onend = () => { previewUtt = null; };
  window.speechSynthesis.speak(utt);
}

/** Azure neural voice preview (independent of main TTS queue) */
async function speakAzurePreview(text: string, voiceName: string) {
  try {
    const resp = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: voiceName }),
    });

    if (!resp.ok) {
      console.error('[speech] preview failed', resp.status);
      return;
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 0.8;
    audio.playbackRate = 1.0;
    audio.onended = () => URL.revokeObjectURL(url);
    audio.onerror = () => URL.revokeObjectURL(url);
    audio.play().catch((err) => console.warn('[speech] preview play failed:', err));
  } catch (err) {
    console.error('[speech] preview error:', err);
  }
}

// ── Voice discovery ──

export interface SpeechVoice {
  name: string;
  lang: string;
  voiceURI: string;
  /** Whether this is a remote Azure neural voice (requires API key) */
  azure?: boolean;
}

/**
 * Hardcoded Azure neural TTS voices.
 * These are NOT browser-built-in — they stream audio from Azure via our API proxy.
 */
export const AZURE_VOICES: SpeechVoice[] = [
  { name: '小何 — 台湾腔女声', lang: 'zh-TW', voiceURI: 'azure://zh-CN-XiaoheNeural', azure: true },
  { name: 'HsiaoChen — 台湾腔女声', lang: 'zh-TW', voiceURI: 'azure://zh-TW-HsiaoChenNeural', azure: true },
  { name: 'HsiaoYu — 台湾腔女声', lang: 'zh-TW', voiceURI: 'azure://zh-TW-HsiaoYuNeural', azure: true },
  { name: 'YunJhe — 台湾腔男声', lang: 'zh-TW', voiceURI: 'azure://zh-TW-YunJheNeural', azure: true },
];

/**
 * Get available voices (Chinese + English from browser, plus Azure neural voices).
 * NOTE: Chrome loads browser voices asynchronously — call this after 'voiceschanged' event.
 */
export function getAvailableVoices(): SpeechVoice[] {
  const browserVoices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith('zh') || v.lang.startsWith('en'))
    .map((v) => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }));

  return [...AZURE_VOICES, ...browserVoices];
}
