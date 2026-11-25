// main.js — bootstrap: build the state (or a deterministic shot), wire
// input, and run the frame loop. The game runs fully offline.

import { newGame, tick } from './state.js';
import { render } from './render.js';
import { handleClick, handleKey } from './input.js';
import { parseShot, setupShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const { shot, seed } = parseShot(window.location.search);
const state = shot ? setupShot(shot, seed) : newGame(seed || 1);
window.__game = state; // exposed for debugging and automated play-tests
const frozen = Boolean(shot); // screenshot mode: no timers advance

function toCanvasCoords(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

canvas.addEventListener('click', (event) => {
  const { x, y } = toCanvasCoords(event);
  handleClick(state, x, y);
});

canvas.addEventListener('touchstart', (event) => {
  event.preventDefault();
  const touch = event.touches[0];
  const { x, y } = toCanvasCoords(touch);
  handleClick(state, x, y);
}, { passive: false });

window.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key === 'Backspace') event.preventDefault();
  handleKey(state, event.key);
});

let lastMs = performance.now();
function frame(nowMs) {
  const dt = Math.min(100, nowMs - lastMs);
  lastMs = nowMs;
  if (!frozen) tick(state, dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}
render(ctx, state);
requestAnimationFrame(frame);
