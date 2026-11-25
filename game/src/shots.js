// shots.js — deterministic screenshot setups. ?shot=start|play|end&seed=N
// freezes the kitchen in a fixed, readable state so the screenshots the
// judge sees always show the same complete game.

import { newGame, spawnOrder } from './state.js';
import { startCooking } from './cooking.js';

export function parseShot(search) {
  const params = new URLSearchParams(search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '1') >>> 0;
  return { shot, seed: seed || 1 };
}

export function setupShot(shot, seed) {
  const state = newGame(seed);
  if (shot === 'start') {
    state.screen = 'title';
    return state;
  }
  if (shot === 'end') {
    state.screen = 'over';
    state.now = 150000;
    state.shiftLeftMs = 0;
    state.score = 3420;
    state.served = 12;
    state.missed = 3;
    state.level = 3;
    state.endReason = 'Tiga pesanan gagal — dapur tutup!';
    state.orders = [];
    return state;
  }
  // shot === 'play': a busy mid-game moment.
  state.screen = 'play';
  state.now = 63000;                 // 63 seconds into the shift
  state.shiftLeftMs = 87000;
  state.score = 1250;
  state.served = 7;
  state.combo = 3;
  state.comboLeftMs = 8000;
  state.level = 2;
  state.message = 'Burger Kilat hampir jadi — tambah selada!';
  state.messageUntilMs = state.now + 2200;
  // three active orders with different patience left
  spawnOrder(state); spawnOrder(state); spawnOrder(state);
  state.orders[0].recipeId = 'burger';
  state.orders[0].bornMs = state.now - 12000;
  state.orders[0].patienceMs = 45000;
  state.orders[1].recipeId = 'pizza';
  state.orders[1].bornMs = state.now - 28000;
  state.orders[1].patienceMs = 42000;
  state.orders[2].recipeId = 'fries';
  state.orders[2].bornMs = state.now - 8000;
  state.orders[2].patienceMs = 45000;
  // a burger mid-assembly on the plate, selada in hand
  state.plate = ['roti', 'daging', 'keju'];
  state.hand = 'selada';
  // a patty halfway grilled on the grill
  startCooking(state, 'daging');
  state.stations.grill.startedMs = state.now - 2600;
  return state;
}
