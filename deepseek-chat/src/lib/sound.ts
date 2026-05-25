/**
 * Lightweight sound engine using Web Audio API – no external dependencies.
 * All sounds are synthesized in realtime (no audio files).
 */

let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  // Resume if suspended (autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function gainNode(val = 0.15): GainNode {
  const g = ac().createGain();
  g.gain.value = val;
  return g;
}

// ── helpers ──

function tone(
  freq: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  gain = 0.12,
  rampDown = true,
) {
  const osc = ac().createOscillator();
  const g = gainNode(gain);
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g).connect(ac().destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
  if (rampDown) g.gain.linearRampToValueAtTime(0.001, startTime + duration);
}

/** Quick noise burst for clicky sounds */
function clickNoise(startTime: number, duration = 0.04, vol = 0.06) {
  const bufferSize = ac().sampleRate * duration;
  const buf = ac().createBuffer(1, bufferSize, ac().sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }
  const src = ac().createBufferSource();
  src.buffer = buf;
  const g = gainNode(vol);
  src.connect(g).connect(ac().destination);
  src.start(startTime);
}

// ── public API ──

let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

// ════════════════════════════════════════
//  Sound Effects
// ════════════════════════════════════════

// ─── Startup & Boot ───

/** Gentle ascending arpeggio – page startup complete */
export function playStartup() {
  if (!enabled) return;
  const t = ac().currentTime;
  // Soft C-major arpeggio with slight echo feel
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    tone(freq, 'sine', t + i * 0.12, 0.35, 0.08);
    tone(freq * 2, 'sine', t + i * 0.12, 0.25, 0.03, false);
  });
  // Bass note
  tone(130.81, 'sine', t, 0.6, 0.05); // C3
}

/** Boot step tick – each line of the boot sequence */
export function playBootTick() {
  if (!enabled) return;
  const t = ac().currentTime;
  // Soft blip
  tone(1200 + Math.random() * 400, 'sine', t, 0.05, 0.06);
  clickNoise(t, 0.03, 0.02);
}

/** Boot ready – final "SYSTEM READY" chime */
export function playBootReady() {
  if (!enabled) return;
  const t = ac().currentTime;
  // Bright two-note arrival
  tone(783.99, 'sine', t, 0.12, 0.08);     // G5
  tone(1046.5, 'sine', t + 0.08, 0.18, 0.1); // C6
  tone(1568, 'triangle', t + 0.16, 0.14, 0.04); // G6 harmonic
}

// ─── Toggle / Switch ───

/** Crisp click – web-search / toggle feedback (on variant) */
export function playToggleOn() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(800, 'sine', t, 0.06, 0.1);
  tone(1200, 'sine', t + 0.02, 0.05, 0.06);
  clickNoise(t, 0.03, 0.02);
}

/** Soft click – toggle off */
export function playToggleOff() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(1200, 'sine', t, 0.04, 0.08);
  tone(600, 'sine', t + 0.02, 0.06, 0.07);
  clickNoise(t, 0.03, 0.015);
}

// ─── Theme ───

/** Airy shimmer – dark/light mode transition */
export function playThemeToggle() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(880, 'sine', t, 0.15, 0.06);
  tone(587.33, 'sine', t + 0.08, 0.25, 0.04); // D5
  tone(440, 'sine', t + 0.16, 0.35, 0.03);     // A4
}

// ─── Save / Confirm ───

/** Bright confirmation ding – save preset */
export function playSave() {
  if (!enabled) return;
  const t = ac().currentTime;
  // Two-note ascending bell
  tone(660, 'sine', t, 0.12, 0.15);
  tone(880, 'sine', t + 0.08, 0.2, 0.18);
  // Triangle-like harmonics
  tone(1320, 'triangle', t + 0.08, 0.15, 0.04);
  tone(1760, 'triangle', t + 0.1, 0.12, 0.03);
}

// ─── Button Clicks (general purpose) ───

/** Light tap – settings, panels, sidebar toggle, generic button press */
export function playClick() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(900, 'sine', t, 0.04, 0.07);
  clickNoise(t, 0.025, 0.025);
}

/** Send message – whoosh forward feel */
export function playSend() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(600, 'sine', t, 0.06, 0.09);
  tone(1000, 'sine', t + 0.03, 0.07, 0.07);
  tone(1400, 'sine', t + 0.06, 0.05, 0.04);
  clickNoise(t, 0.03, 0.02);
}

/** Stop / abort – short descending thud */
export function playStop() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(700, 'sine', t, 0.06, 0.1);
  tone(400, 'sine', t + 0.03, 0.08, 0.07);
  clickNoise(t, 0.04, 0.03);
}

/** Delete / clear – low ominous tone */
export function playDelete() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(300, 'sawtooth', t, 0.12, 0.06);
  tone(220, 'sawtooth', t + 0.05, 0.15, 0.04);
}

/** Export / download – ascending chirp */
export function playExport() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(500, 'sine', t, 0.06, 0.08);
  tone(750, 'sine', t + 0.04, 0.06, 0.09);
  tone(1000, 'sine', t + 0.08, 0.08, 0.11);
  clickNoise(t, 0.03, 0.02);
}

/** New session – fresh start chirp */
export function playNewSession() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(523.25, 'sine', t, 0.08, 0.07);   // C5
  tone(659.25, 'sine', t + 0.06, 0.1, 0.09); // E5
}

/** Regenerate – quick rewind feel */
export function playRegenerate() {
  if (!enabled) return;
  const t = ac().currentTime;
  tone(900, 'sine', t, 0.04, 0.07);
  tone(650, 'sine', t + 0.04, 0.06, 0.08);
  clickNoise(t + 0.02, 0.03, 0.02);
}
