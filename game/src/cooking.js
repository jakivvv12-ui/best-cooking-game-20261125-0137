// cooking.js — the three cooking stations: grill, fryer and pan.
// An ingredient that needs cooking goes on its station, cooks over time,
// is picked up when ready, and burns if left too long.

import { STATIONS, ING_BY_ID } from './config.js';

export function stationFor(kind) {
  return STATIONS.find((s) => s.kind === kind);
}

// Put a raw ingredient on its station. Returns false when the station is busy.
export function startCooking(state, ingredientId) {
  const ing = ING_BY_ID[ingredientId];
  if (!ing || !ing.cook) return false;
  if (state.stations[ing.cook]) return false;
  state.stations[ing.cook] = { ing: ingredientId, startedMs: state.now };
  return true;
}

// Progress 0..1 (1 = perfectly cooked), and whether it has burned.
export function stationStatus(state, kind) {
  const slot = state.stations[kind];
  if (!slot) return null;
  const station = stationFor(kind);
  const elapsed = state.now - slot.startedMs;
  const done = elapsed >= station.cookMs;
  const burned = elapsed >= station.cookMs + station.burnMs;
  return { ...slot, progress: Math.min(1, elapsed / station.cookMs), done, burned, elapsed };
}

// Click a station: take the cooked ingredient into the hand, or throw a
// burned one away. Returns 'took' | 'burned' | 'busy' | 'empty'.
export function clickStation(state, kind) {
  const slot = state.stations[kind];
  if (!slot) return 'empty';
  const status = stationStatus(state, kind);
  if (status.burned) {
    state.stations[kind] = null;
    state.score = Math.max(0, state.score - 10);
    return 'burned';
  }
  if (!status.done) return 'busy';
  if (state.hand) return 'busy';
  state.hand = slot.ing;
  state.stations[kind] = null;
  return 'took';
}

// Pick an ingredient from the counter: raw ones go straight to the hand,
// cookable ones start cooking on their station.
export function pickIngredient(state, ingredientId) {
  const ing = ING_BY_ID[ingredientId];
  if (!ing) return 'none';
  if (ing.cook) {
    if (state.hand) return 'hands-full';
    if (state.stations[ing.cook]) return 'station-busy';
    startCooking(state, ingredientId);
    return 'cooking';
  }
  if (state.hand) return 'hands-full';
  state.hand = ingredientId;
  return 'took';
}
