// config.js — every tunable number, ingredient and recipe of ORDER UP!
// Nothing here is loaded from the network; all art is drawn on canvas.

// Ingredient ids, in counter order (keys 1-9 pick them).
export const INGREDIENTS = [
  { id: 'roti',    name: 'Roti',    color: '#e8b96a', dark: '#b98a3e', cook: null },
  { id: 'daging',  name: 'Daging',  color: '#c65a4a', dark: '#8e3527', cook: 'grill' },
  { id: 'keju',    name: 'Keju',    color: '#ffd94a', dark: '#d9a91f', cook: null },
  { id: 'selada',  name: 'Selada',  color: '#7ed957', dark: '#4da32e', cook: null },
  { id: 'tomat',   name: 'Tomat',   color: '#ef4444', dark: '#b91c1c', cook: null },
  { id: 'kentang', name: 'Kentang', color: '#f5c542', dark: '#c7931a', cook: 'fryer' },
  { id: 'adonan',  name: 'Adonan',  color: '#f3e2c7', dark: '#cbb28a', cook: null },
  { id: 'telur',   name: 'Telur',   color: '#fff3c4', dark: '#e8c96a', cook: 'pan' },
  { id: 'wortel',  name: 'Wortel',  color: '#ff8c42', dark: '#d96a1e', cook: null },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((g) => [g.id, g]));

// Cooking stations: one per cook kind. cookMs is time to perfectly cooked,
// burnMs is how much longer before it burns and must be thrown away.
export const STATIONS = [
  { kind: 'grill', name: 'PANGGANG', icon: '🔥', cookMs: 5000, burnMs: 7000, x: 40,  y: 300 },
  { kind: 'fryer', name: 'GORENG',   icon: '🍟', cookMs: 4000, burnMs: 6000, x: 40,  y: 420 },
  { kind: 'pan',   name: 'Wajan',    icon: '🍳', cookMs: 3000, burnMs: 5000, x: 40,  y: 540 },
];

// Recipes: the dishes customers order. `needs` lists ingredient ids in
// bottom-to-top plate order; cooked ids mean the cooked version.
export const RECIPES = [
  { id: 'burger',  name: 'Burger Kilat',  price: 120, needs: ['roti', 'daging', 'keju', 'selada'] },
  { id: 'salad',   name: 'Salad Segar',   price: 90,  needs: ['selada', 'tomat', 'keju'] },
  { id: 'pizza',   name: 'Pizza Mini',    price: 140, needs: ['adonan', 'keju', 'tomat'] },
  { id: 'fries',   name: 'Kentang Goreng', price: 70, needs: ['kentang', 'kentang'] },
  { id: 'soup',    name: 'Sup Tomat',     price: 110, needs: ['tomat', 'tomat', 'wortel'] },
  { id: 'sandwich',name: 'Sandwich Telur',price: 130, needs: ['roti', 'telur', 'selada'] },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Canvas and layout.
export const VIEW = { w: 1280, h: 720 };
export const SHIFT_MS = 150000;      // one work shift lasts 150 seconds
export const MAX_MISSES = 3;         // three failed orders end the shift
export const MAX_ORDERS = 4;         // tickets on the order board at once
export const ORDER_PATIENCE_MS = 45000;
export const SPAWN_EVERY_MS = 11000;
export const COMBO_WINDOW_MS = 12000;

// Scoring.
export const SCORE = { base: 100, timeBonusMax: 80, wrongServe: -25, burn: -10 };
