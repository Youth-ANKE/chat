/**
 * Ambient background music engine using Web Audio API – no dependencies.
 * Procedural chord + arpeggio loops that play quietly in the background.
 */

let musicCtx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let musicEnabledGlobal = false;
let musicMode: 'random' | 'sequential' | '5min' | '10min' = 'sequential';
let currentMusicVolume = 27; // 0–100, matches DEFAULT_SETTINGS
let currentTrackIndex = -1;
let currentTrackNodes: AudioNode[] = [];
let musicTimerId: number | null = null;
let fadeOutTimerId: number | null = null;
let musicUnlocked = false;

// Browsers block AudioContext until a user gesture; listen for the first one.
function unlockMusic() {
  if (musicUnlocked) return;
  // Create/resume inside the user gesture — Chrome allows this synchronously.
  if (!musicCtx) {
    musicCtx = new AudioContext();
  } else if (musicCtx.state === 'suspended') {
    musicCtx.resume();
  }
  musicUnlocked = true;
  document.removeEventListener('click', unlockMusic);
  document.removeEventListener('keydown', unlockMusic);
  document.removeEventListener('touchstart', unlockMusic);
}

function setupMusicUnlock() {
  document.addEventListener('click', unlockMusic);
  document.addEventListener('keydown', unlockMusic);
  document.addEventListener('touchstart', unlockMusic);
}
setupMusicUnlock();

// ── Track definitions ──

interface Track {
  name: string;
  chordRoots: number[];   // root frequencies of chord progression (A3=220, C4=261.63, etc.)
  chordType: 'major' | 'minor';
  bpm: number;
  pattern: 'arpeggio' | 'slowPad';
}

const TRACKS: Track[] = [
  {
    name: '星空',
    chordRoots: [261.63, 293.66, 329.63, 349.23], // C Dm Em F
    chordType: 'major',
    bpm: 60,
    pattern: 'arpeggio',
  },
  {
    name: '深海',
    chordRoots: [220, 261.63, 329.63, 246.94], // Am C Em B
    chordType: 'minor',
    bpm: 50,
    pattern: 'slowPad',
  },
  {
    name: '森林',
    chordRoots: [246.94, 174.61, 261.63, 196], // B F C G
    chordType: 'major',
    bpm: 55,
    pattern: 'arpeggio',
  },
  {
    name: '极光',
    chordRoots: [329.63, 246.94, 293.66, 261.63], // Em B Dm C
    chordType: 'minor',
    bpm: 45,
    pattern: 'slowPad',
  },
  {
    name: '浮云',
    chordRoots: [196, 293.66, 261.63, 220], // G D C Am
    chordType: 'major',
    bpm: 65,
    pattern: 'arpeggio',
  },
];

// ── Helpers ──

function ac(): AudioContext | null {
  if (!musicUnlocked) return null;
  if (!musicCtx) musicCtx = new AudioContext();
  if (musicCtx.state === 'suspended') musicCtx.resume();
  return musicCtx;
}

function getGain(): GainNode | null {
  if (!musicGain) {
    const a = ac();
    if (!a) return null;
    musicGain = a.createGain();
    musicGain.gain.value = (currentMusicVolume / 100) * 0.15;
    musicGain.connect(a.destination);
  }
  return musicGain;
}

function getChordFreqs(root: number, type: 'major' | 'minor'): number[] {
  if (type === 'major') {
    return [root, root * 5 / 4, root * 3 / 2, root * 2]; // root, maj3rd, p5th, octave
  }
  return [root, root * 6 / 5, root * 3 / 2, root * 2];   // root, min3rd, p5th, octave
}

// ── Track playback ──

function stopCurrentTrack() {
  for (const node of currentTrackNodes) {
    try {
      node.disconnect();
    } catch { /* ignore */ }
  }
  currentTrackNodes = [];
}

function playTrack(index: number) {
  const a = ac();
  if (!a) return;
  stopCurrentTrack();
  const track = TRACKS[index];
  if (!track) return;

  const now = a.currentTime;
  const gain = getGain();
  if (!gain) return;
  const barDuration = 60 / track.bpm * 4; // 4 beats per bar
  const totalDuration = barDuration * track.chordRoots.length;

  if (track.pattern === 'arpeggio') {
    // Arpeggio pattern: play each chord note sequentially
    for (let ci = 0; ci < track.chordRoots.length; ci++) {
      const chordFreqs = getChordFreqs(track.chordRoots[ci], trackTypeForTrack(track, ci));
      const chordStart = now + ci * barDuration;
      const noteSpacing = barDuration / 4; // 4 notes per bar

      for (let ni = 0; ni < 4; ni++) {
        const freq = chordFreqs[ni % chordFreqs.length];
        const noteStart = chordStart + ni * noteSpacing;
        const noteDur = noteSpacing * 0.7; // staccato feel

        const osc = a.createOscillator();
        const g = a.createGain();
        osc.type = ni % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, noteStart);
        g.gain.linearRampToValueAtTime(0.06, noteStart + noteSpacing * 0.1);
        g.gain.linearRampToValueAtTime(0.01, noteStart + noteDur);
        osc.connect(g).connect(gain);
        osc.start(noteStart);
        osc.stop(noteStart + noteDur + 0.01);
        currentTrackNodes.push(osc, g);
      }

      // Soft bass pad under each chord
      const bassOsc = a.createOscillator();
      const bassG = a.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.value = track.chordRoots[ci] / 2; // one octave down
      bassG.gain.setValueAtTime(0, chordStart);
      bassG.gain.linearRampToValueAtTime(0.03, chordStart + 0.3);
      bassG.gain.linearRampToValueAtTime(0.02, chordStart + barDuration * 0.9);
      bassG.gain.linearRampToValueAtTime(0, chordStart + barDuration);
      bassOsc.connect(bassG).connect(gain);
      bassOsc.start(chordStart);
      bassOsc.stop(chordStart + barDuration + 0.01);
      currentTrackNodes.push(bassOsc, bassG);
    }
  } else {
    // Slow pad: sustained chords with gentle volume envelope
    for (let ci = 0; ci < track.chordRoots.length; ci++) {
      const chordFreqs = getChordFreqs(track.chordRoots[ci], trackTypeForTrack(track, ci));
      const chordStart = now + ci * barDuration;

      for (const freq of chordFreqs) {
        const osc = a.createOscillator();
        const g = a.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, chordStart);
        g.gain.linearRampToValueAtTime(0.04, chordStart + 0.5);
        g.gain.setValueAtTime(0.04, chordStart + barDuration * 0.7);
        g.gain.linearRampToValueAtTime(0, chordStart + barDuration);
        g.gain.linearRampToValueAtTime(0, chordStart + barDuration + 0.1);
        osc.connect(g).connect(gain);
        osc.start(chordStart);
        osc.stop(chordStart + barDuration + 0.15);
        currentTrackNodes.push(osc, g);
      }
    }
  }

  currentTrackIndex = index;

  // Schedule next track after this one ends (if mode is not manual)
  if (musicMode === 'random' || musicMode === 'sequential') {
    const timeoutMs = (totalDuration * 1000) + 500;
    setTimeout(() => {
      if (!musicEnabledGlobal) return;
      playNext();
    }, timeoutMs);
  }
}

function trackTypeForTrack(track: Track, _ci: number): 'major' | 'minor' {
  return track.chordType;
}

function playNext() {
  if (musicMode === 'random') {
    let next: number;
    do {
      next = Math.floor(Math.random() * TRACKS.length);
    } while (next === currentTrackIndex && TRACKS.length > 1);
    playTrack(next);
  } else {
    // sequential
    const next = (currentTrackIndex + 1) % TRACKS.length;
    playTrack(next);
  }
}

// ── Public API ──

export type MusicMode = 'random' | 'sequential' | '5min' | '10min';

export function setMusicEnabled(on: boolean) {
  musicEnabledGlobal = on;
  if (on) {
    startMusic();
  } else {
    stopMusic();
  }
}

export function setMusicMode(mode: MusicMode) {
  musicMode = mode;
  if (musicTimerId !== null) {
    clearTimeout(musicTimerId);
    musicTimerId = null;
  }
  if (musicEnabledGlobal) {
    stopCurrentTrack();
    startMusic();
  }
}

/**
 * Set music volume. Maps 0–100 → gain 0–0.15.
 * Default is 27 → gain 0.04.
 */
export function setMusicVolume(vol: number) {
  const clipped = Math.max(0, Math.min(100, Math.round(vol)));
  currentMusicVolume = clipped;
  const gainValue = (clipped / 100) * 0.15; // 0% → 0, 100% → 0.15
  if (musicGain) {
    musicGain.gain.value = gainValue;
  } else {
    // If gain not yet created, set it up with the desired value
    const a = ac();
    if (a) {
      musicGain = a.createGain();
      musicGain.gain.value = gainValue;
      musicGain.connect(a.destination);
    }
  }
}

export function previewTrack(index: number) {
  // Preview: play a short clip of this track (3 seconds)
  const track = TRACKS[index];
  if (!track) return;

  const a = ac();
  if (!a) return;
  stopCurrentTrack();
  const now = a.currentTime;
  const gain = getGain();
  if (!gain) return;
  const barDuration = 60 / track.bpm * 4;

  for (let ci = 0; ci < Math.min(track.chordRoots.length, 2); ci++) {
    const chordFreqs = getChordFreqs(track.chordRoots[ci], track.chordType);
    const chordStart = now + ci * barDuration;
    const noteSpacing = barDuration / 4;

    for (let ni = 0; ni < 4; ni++) {
      const freq = chordFreqs[ni % chordFreqs.length];
      const noteStart = chordStart + ni * noteSpacing;
      const noteDur = noteSpacing * 0.7;

      const osc = a.createOscillator();
      const g = a.createGain();
      osc.type = ni % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, noteStart);
      g.gain.linearRampToValueAtTime(0.08, noteStart + noteSpacing * 0.1);
      g.gain.linearRampToValueAtTime(0.005, noteStart + noteDur);
      osc.connect(g).connect(gain);
      osc.start(noteStart);
      osc.stop(noteStart + noteDur + 0.01);
      currentTrackNodes.push(osc, g);
    }
  }
}

export function isMusicEnabled() {
  return musicEnabledGlobal;
}

// ── Internals ──

function startMusic() {
  if (!musicEnabledGlobal) return;

  // If timed mode
  if (musicMode === '5min') {
    playTrack(0);
    musicTimerId = window.setTimeout(() => {
      stopMusic();
    }, 5 * 60 * 1000);
    return;
  }
  if (musicMode === '10min') {
    playTrack(0);
    musicTimerId = window.setTimeout(() => {
      stopMusic();
    }, 10 * 60 * 1000);
    return;
  }

  // Random/sequential: start from first track or random
  if (musicMode === 'random') {
    playTrack(Math.floor(Math.random() * TRACKS.length));
  } else {
    playTrack(0);
  }
}

function stopMusic() {
  stopCurrentTrack();
  if (musicTimerId !== null) {
    clearTimeout(musicTimerId);
    musicTimerId = null;
  }
  if (fadeOutTimerId !== null) {
    clearTimeout(fadeOutTimerId);
    fadeOutTimerId = null;
  }
  musicEnabledGlobal = false;
}

export const MUSIC_TRACKS = TRACKS.map((t, i) => ({ index: i, name: t.name, pattern: t.pattern, bpm: t.bpm }));
