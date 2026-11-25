// state.js — the whole game state: shift clock, orders, plate, hand,
// score, combo, level, misses. Pure logic; rendering lives in render.js.

import {
  ING_BY_ID, RECIPES, RECIPE_BY_ID, SHIFT_MS, MAX_MISSES, MAX_ORDERS,
  ORDER_PATIENCE_MS, SPAWN_EVERY_MS, COMBO_WINDOW_MS, SCORE,
} from './config.js';
import { mulberry32, pick } from './random.js';

export function newGame(seed) {
  return {
    seed,
    rng: mulberry32(seed),
    screen: 'title',            // title | play | over
    now: 0,                     // ms since the shift started (frozen in shots)
    shiftLeftMs: SHIFT_MS,
    orders: [],                 // {id, recipeId, bornMs, patienceMs, served}
    nextOrderId: 1,
    spawnInMs: 2500,
    plate: [],                  // ingredient ids stacked bottom-to-top
    hand: null,                 // ingredient id carried, or null
    stations: { grill: null, fryer: null, pan: null }, // {ing, startedMs} | null
    score: 0,
    served: 0,
    missed: 0,
    combo: 0,
    comboLeftMs: 0,
    level: 1,
    message: '',
    messageUntilMs: 0,
    shakeUntilMs: 0,
    flashOrderId: null,
    endReason: '',
  };
}

// --- orders ---------------------------------------------------------------

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  const recipe = pick(state.rng, RECIPES);
  const patience = Math.max(22000, ORDER_PATIENCE_MS - (state.level - 1) * 3000);
  state.orders.push({
    id: state.nextOrderId++,
    recipeId: recipe.id,
    bornMs: state.now,
    patienceMs: patience,
  });
}

export function orderPatienceLeft(state, order) {
  return Math.max(0, order.patienceMs - (state.now - order.bornMs));
}

// --- plate ----------------------------------------------------------------

export function plateMatchesRecipe(state, recipeId) {
  const recipe = RECIPE_BY_ID[recipeId];
  if (state.plate.length !== recipe.needs.length) return false;
  const plate = state.plate.slice().sort();
  const needs = recipe.needs.slice().sort();
  return plate.every((ing, i) => ing === needs[i]);
}

export function addHandToPlate(state) {
  if (!state.hand) return false;
  state.plate.push(state.hand);
  state.hand = null;
  return true;
}

export function clearPlate(state) {
  state.plate = [];
  state.hand = null;
}

// --- serving ---------------------------------------------------------------

export function serveOrder(state, orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return 'none';
  if (!plateMatchesRecipe(state, order.recipeId)) {
    state.score = Math.max(0, state.score + SCORE.wrongServe);
    state.combo = 0;
    state.shakeUntilMs = state.now + 350;
    setMessage(state, 'Salah resep! Cek papan pesanan.');
    return 'wrong';
  }
  const recipe = RECIPE_BY_ID[order.recipeId];
  const patienceFrac = orderPatienceLeft(state, order) / order.patienceMs;
  const timeBonus = Math.round(SCORE.timeBonusMax * patienceFrac);
  state.combo = state.comboLeftMs > 0 ? state.combo + 1 : 1;
  state.comboLeftMs = COMBO_WINDOW_MS;
  const gained = (SCORE.base + recipe.price + timeBonus) * (1 + 0.1 * (state.combo - 1));
  state.score += Math.round(gained);
  state.served += 1;
  state.level = 1 + Math.floor(state.served / 5);
  state.orders = state.orders.filter((o) => o.id !== orderId);
  state.plate = [];
  state.flashOrderId = orderId;
  setMessage(state, `Disajikan! +${Math.round(gained)} poin${state.combo > 1 ? ` (kombo x${state.combo})` : ''}`);
  return 'served';
}

// --- tick ------------------------------------------------------------------

export function setMessage(state, text) {
  state.message = text;
  state.messageUntilMs = state.now + 2200;
}

export function tick(state, dtMs) {
  if (state.screen !== 'play') return;
  state.now += dtMs;
  state.shiftLeftMs = Math.max(0, SHIFT_MS - state.now);

  // combo timer
  if (state.comboLeftMs > 0) {
    state.comboLeftMs -= dtMs;
    if (state.comboLeftMs <= 0) state.combo = 0;
  }

  // spawn new orders
  state.spawnInMs -= dtMs;
  if (state.spawnInMs <= 0) {
    spawnOrder(state);
    state.spawnInMs = Math.max(5000, SPAWN_EVERY_MS - (state.level - 1) * 900);
  }

  // orders whose patience ran out fail
  for (const order of state.orders.slice()) {
    if (orderPatienceLeft(state, order) <= 0) {
      state.orders = state.orders.filter((o) => o.id !== order.id);
      state.missed += 1;
      state.combo = 0;
      setMessage(state, `Pesanan ${RECIPE_BY_ID[order.recipeId].name} hangus! (${state.missed}/${MAX_MISSES})`);
      if (state.missed >= MAX_MISSES) {
        endShift(state, 'Tiga pesanan gagal — dapur tutup!');
        return;
      }
    }
  }

  if (state.shiftLeftMs <= 0) endShift(state, 'Shift selesai! Dapur Kilat tutup dengan bangga.');
}

export function endShift(state, reason) {
  state.screen = 'over';
  state.endReason = reason;
}

export function ingredientName(id) {
  return ING_BY_ID[id] ? ING_BY_ID[id].name : id;
}
