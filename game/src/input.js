// input.js — mouse, touch and keyboard. Every click lands on a hit region
// from render.js; keys mirror the same actions for keyboard-only play.

import { INGREDIENTS } from './config.js';
import {
  newGame, addHandToPlate, clearPlate, serveOrder, spawnOrder,
  setMessage, plateMatchesRecipe,
} from './state.js';
import { clickStation, pickIngredient } from './cooking.js';
import { hitRegions } from './render.js';
import { sfx, ensureAudio } from './audio.js';

function regionAt(state, x, y) {
  return hitRegions(state).find((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}

function startShift(state) {
  state.screen = 'play';
  spawnOrder(state);
  spawnOrder(state);
  sfx.level();
}

function restartShift(state) {
  const fresh = newGame((state.seed + 1) >>> 0);
  Object.assign(state, fresh);
  startShift(state);
}

export function serveBest(state) {
  const order = state.orders.find((o) => plateMatchesRecipe(state, o.recipeId));
  if (!order) {
    if (state.plate.length === 0) { setMessage(state, 'Piring masih kosong!'); return; }
    if (state.orders.length === 0) { setMessage(state, 'Tidak ada pesanan!'); return; }
    const result = serveOrder(state, state.orders[0].id);
    if (result === 'wrong') sfx.wrong();
    return;
  }
  const result = serveOrder(state, order.id);
  if (result === 'served') sfx.serve();
}

function pickById(state, id) {
  const result = pickIngredient(state, id);
  const name = INGREDIENTS.find((g) => g.id === id).name;
  if (result === 'took') sfx.pick();
  else if (result === 'cooking') { sfx.sizzle(); setMessage(state, `${name} sedang dimasak…`); }
  else if (result === 'hands-full') setMessage(state, 'Tangan penuh — taruh dulu di piring!');
  else if (result === 'station-busy') setMessage(state, 'Alat masak sedang dipakai!');
}

export function handleClick(state, x, y) {
  ensureAudio();
  const region = regionAt(state, x, y);
  if (!region) return;
  if (state.screen === 'title' && region.kind === 'start') { startShift(state); return; }
  if (state.screen === 'over' && region.kind === 'restart') { restartShift(state); return; }
  if (state.screen !== 'play') return;
  if (region.kind === 'ingredient') {
    pickById(state, region.id);
  } else if (region.kind === 'station') {
    const result = clickStation(state, region.id);
    if (result === 'took') sfx.pick();
    else if (result === 'burned') { sfx.fail(); setMessage(state, 'Gosong! Bahan dibuang (−10).'); }
    else if (result === 'busy') setMessage(state, 'Belum matang — sabar!');
  } else if (region.kind === 'plate') {
    if (addHandToPlate(state)) sfx.place();
    else setMessage(state, 'Ambil bahan dulu dari counter!');
  } else if (region.kind === 'serve') {
    serveBest(state);
  } else if (region.kind === 'trash') {
    clearPlate(state);
    setMessage(state, 'Piring dikosongkan.');
  } else if (region.kind === 'order') {
    const result = serveOrder(state, region.id);
    if (result === 'served') sfx.serve();
    else if (result === 'wrong') sfx.wrong();
  }
}

export function handleKey(state, key) {
  ensureAudio();
  if (state.screen === 'title' && (key === 'Enter' || key === ' ')) { startShift(state); return; }
  if (state.screen === 'over' && key === 'Enter') { restartShift(state); return; }
  if (state.screen !== 'play') return;
  if (key >= '1' && key <= '9') {
    const ing = INGREDIENTS[Number(key) - 1];
    if (ing) pickById(state, ing.id);
    return;
  }
  if (key === ' ') {
    if (addHandToPlate(state)) sfx.place();
    else setMessage(state, 'Ambil bahan dulu dari counter!');
  } else if (key === 'Enter') {
    serveBest(state);
  } else if (key === 'Backspace' || key === 'Delete') {
    clearPlate(state);
    setMessage(state, 'Piring dikosongkan.');
  }
}
