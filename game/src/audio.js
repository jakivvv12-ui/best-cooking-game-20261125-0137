// audio.js — tiny WebAudio bleeps, synthesized at runtime. No audio files,
// no network, and silent until the player first interacts (browser policy).

let ctx = null;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep(freq, durMs, type, gain) {
  const ac = ensureAudio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain || 0.08, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + durMs / 1000);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + durMs / 1000);
}

export const sfx = {
  pick() { beep(520, 90, 'triangle', 0.06); },
  place() { beep(340, 110, 'triangle', 0.07); },
  sizzle() { beep(180, 200, 'sawtooth', 0.03); },
  serve() { beep(660, 120, 'sine', 0.09); setTimeout(() => beep(880, 160, 'sine', 0.09), 110); },
  wrong() { beep(160, 220, 'square', 0.05); },
  fail() { beep(220, 300, 'sawtooth', 0.06); setTimeout(() => beep(140, 380, 'sawtooth', 0.06), 180); },
  level() { [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 140, 'sine', 0.08), i * 120)); },
};
