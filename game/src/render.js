// render.js — every pixel of the kitchen, drawn on one canvas with plain
// shapes. No images, no fonts from the network, no external assets.

import { INGREDIENTS, ING_BY_ID, STATIONS, RECIPES, RECIPE_BY_ID, VIEW, MAX_MISSES } from './config.js';
import { orderPatienceLeft } from './state.js';
import { stationStatus } from './cooking.js';

const W = VIEW.w, H = VIEW.h;

// Geometry the input layer reuses (hit regions).
export const LAYOUT = {
  board: { x: 24, y: 96, w: 1232, h: 118 },
  ticketW: 296, ticketGap: 16,
  stations: { x: 24, y: 232, w: 250, h: 300 },
  plate: { x: 330, y: 232, w: 560, h: 300 },
  serve: { x: 946, y: 232, w: 310, h: 300 },
  counter: { x: 24, y: 548, w: 1232, h: 156 },
  binW: 128, binGap: 10,
};

// --- small drawing helpers -------------------------------------------------

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function pill(ctx, x, y, w, h, fill, stroke) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

// --- food art ---------------------------------------------------------------
// Each ingredient is a little flat drawing, centred at (x, y), sized ~s.

export function drawIngredient(ctx, id, x, y, s, cooked) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 64;
  if (id === 'roti') {
    ctx.fillStyle = '#e8b96a';
    ctx.beginPath(); ctx.ellipse(0, -6 * u, 30 * u, 16 * u, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#d9a44f';
    rr(ctx, -30 * u, -6 * u, 60 * u, 10 * u, 5 * u); ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const sx of [-16, 0, 16]) { ctx.beginPath(); ctx.arc(sx * u, -14 * u, 2.5 * u, 0, 7); ctx.fill(); }
  } else if (id === 'daging') {
    ctx.fillStyle = cooked ? '#7a3b22' : '#c65a4a';
    rr(ctx, -30 * u, -12 * u, 60 * u, 24 * u, 12 * u); ctx.fill();
    ctx.fillStyle = cooked ? '#5d2b17' : '#a03d2f';
    for (const sx of [-18, 0, 18]) { ctx.beginPath(); ctx.arc(sx * u, 0, 3 * u, 0, 7); ctx.fill(); }
  } else if (id === 'keju') {
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath(); ctx.moveTo(-28 * u, 10 * u); ctx.lineTo(28 * u, 10 * u); ctx.lineTo(0, -16 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8b93a';
    for (const [hx, hy] of [[-8, 2], [8, 0], [0, -6]]) { ctx.beginPath(); ctx.arc(hx * u, hy * u, 3 * u, 0, 7); ctx.fill(); }
  } else if (id === 'selada') {
    ctx.fillStyle = '#7ed957';
    for (const [ox, oy, r] of [[-18, 2, 14], [0, -4, 16], [18, 2, 14]]) {
      ctx.beginPath(); ctx.arc(ox * u, oy * u, r * u, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#4da32e';
    ctx.beginPath(); ctx.arc(-8 * u, 0, 3 * u, 0, 7); ctx.arc(10 * u, -2 * u, 3 * u, 0, 7); ctx.fill();
  } else if (id === 'tomat') {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(0, 0, 22 * u, 0, 7); ctx.fill();
    ctx.fillStyle = '#3f9e3f';
    ctx.beginPath(); ctx.moveTo(0, -20 * u); ctx.lineTo(-8 * u, -30 * u); ctx.lineTo(8 * u, -30 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff8a8a';
    ctx.beginPath(); ctx.arc(-8 * u, -8 * u, 5 * u, 0, 7); ctx.fill();
  } else if (id === 'kentang') {
    ctx.fillStyle = '#e33f2f';
    ctx.beginPath(); ctx.moveTo(-24 * u, -6 * u); ctx.lineTo(24 * u, -6 * u); ctx.lineTo(18 * u, 24 * u); ctx.lineTo(-18 * u, 24 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f5c542';
    for (const ox of [-16, -5, 6, 16]) { rr(ctx, (ox - 4) * u, -26 * u, 8 * u, 26 * u, 3 * u); ctx.fill(); }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 10 * u, 4 * u, 0, 7); ctx.fill();
  } else if (id === 'adonan') {
    ctx.fillStyle = '#f3e2c7';
    ctx.beginPath(); ctx.arc(0, 0, 26 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d9b98a'; ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.arc(0, 0, 18 * u, 0, 7); ctx.stroke();
  } else if (id === 'telur') {
    ctx.fillStyle = '#fff8e6';
    ctx.beginPath(); ctx.ellipse(0, 0, 28 * u, 20 * u, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffb703';
    ctx.beginPath(); ctx.arc(4 * u, 0, 11 * u, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffcf4d';
    ctx.beginPath(); ctx.arc(1 * u, -3 * u, 4 * u, 0, 7); ctx.fill();
  } else if (id === 'wortel') {
    ctx.fillStyle = '#ff8c42';
    ctx.beginPath(); ctx.moveTo(-14 * u, -12 * u); ctx.lineTo(14 * u, -12 * u); ctx.lineTo(0, 26 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3f9e3f';
    for (const ox of [-8, 0, 8]) { rr(ctx, (ox - 3) * u, -26 * u, 6 * u, 16 * u, 3 * u); ctx.fill(); }
  }
  ctx.restore();
}

function drawCustomerFace(ctx, x, y, r, mood) {
  // mood 0 = calm, 1 = worried, 2 = angry (patience running out)
  ctx.fillStyle = mood === 2 ? '#f2a65a' : '#f6c89f';
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#3b2a1a';
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.15, r * 0.09, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.09, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3b2a1a'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (mood === 0) { ctx.arc(x, y + r * 0.25, r * 0.35, 0.15 * Math.PI, 0.85 * Math.PI); }
  else if (mood === 1) { ctx.moveTo(x - r * 0.3, y + r * 0.45); ctx.lineTo(x + r * 0.3, y + r * 0.45); }
  else { ctx.arc(x, y + r * 0.6, r * 0.3, 1.15 * Math.PI, 1.85 * Math.PI); }
  ctx.stroke();
  // chef hat
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - r * 0.4, y - r * 0.85, r * 0.32, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.4, y - r * 0.85, r * 0.32, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - r * 0.95, r * 0.36, 0, 7); ctx.fill();
  rr(ctx, x - r * 0.7, y - r * 0.85, r * 1.4, r * 0.25, 4); ctx.fill();
}

// --- screens ----------------------------------------------------------------

function drawHeader(ctx, state) {
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, W, 84);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 80, W, 4);
  text(ctx, '🍳 ORDER UP!', 28, 34, 34, '#ffcf5c', 'left', 900);
  text(ctx, 'DAPUR KILAT', 28, 64, 15, '#cbb59a');
  const shiftFrac = state.shiftLeftMs / 150000;
  const mm = Math.floor(state.shiftLeftMs / 60000);
  const ss = String(Math.floor((state.shiftLeftMs % 60000) / 1000)).padStart(2, '0');
  text(ctx, `⏱ SHIFT ${mm}:${ss}`, 470, 30, 22, shiftFrac < 0.2 ? '#ff6b6b' : '#fff');
  rr(ctx, 470, 48, 240, 12, 6); ctx.fillStyle = '#4a3626'; ctx.fill();
  rr(ctx, 470, 48, 240 * shiftFrac, 12, 6); ctx.fillStyle = shiftFrac < 0.2 ? '#ff6b6b' : '#7ed957'; ctx.fill();
  text(ctx, `SKOR ${state.score.toLocaleString('id-ID')}`, 760, 30, 24, '#fff');
  text(ctx, state.combo > 1 ? `🔥 KOMBO x${state.combo}` : 'KOMBO —', 760, 62, 16, state.combo > 1 ? '#ff9f43' : '#8a7a68');
  text(ctx, `LEVEL ${state.level}  •  Tersaji ${state.served}`, 990, 30, 20, '#fff');
  let hearts = '';
  for (let i = 0; i < MAX_MISSES; i++) hearts += i < MAX_MISSES - state.missed ? '❤️' : '🖤';
  text(ctx, hearts, 990, 62, 20, '#fff');
}

function drawOrderBoard(ctx, state) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#33241a';
  rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
  ctx.strokeStyle = '#5a4128'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, '📋 PAPAN PESANAN', b.x + 16, b.y + 20, 15, '#ffcf5c');
  if (state.orders.length === 0) {
    text(ctx, 'Belum ada pesanan — bersiap!', b.x + 220, b.y + 64, 20, '#cbb59a');
    return;
  }
  state.orders.forEach((order, i) => {
    const x = b.x + 16 + i * (LAYOUT.ticketW + LAYOUT.ticketGap);
    const y = b.y + 36;
    const recipe = RECIPE_BY_ID[order.recipeId];
    const left = orderPatienceLeft(state, order);
    const frac = left / order.patienceMs;
    const mood = frac > 0.5 ? 0 : frac > 0.25 ? 1 : 2;
    const shake = state.now < state.shakeUntilMs ? (Math.sin(state.now / 30) * 3) : 0;
    ctx.save();
    ctx.translate(shake, 0);
    ctx.fillStyle = state.flashOrderId === order.id ? '#fff3c4' : '#fdf6e3';
    rr(ctx, x, y, LAYOUT.ticketW, 68, 10); ctx.fill();
    ctx.strokeStyle = frac < 0.25 ? '#ef4444' : '#d9c9a8'; ctx.lineWidth = 2; ctx.stroke();
    drawCustomerFace(ctx, x + 34, y + 30, 22, mood);
    text(ctx, recipe.name, x + 64, y + 18, 17, '#3b2a1a');
    text(ctx, `Rp ${recipe.price}`, x + 64, y + 42, 14, '#8a6d3b');
    recipe.needs.forEach((ing, j) => drawIngredient(ctx, ing, x + 210 + j * 26, y + 34, 34, true));
    rr(ctx, x + 64, y + 54, 220, 7, 3); ctx.fillStyle = '#e5d9bd'; ctx.fill();
    rr(ctx, x + 64, y + 54, 220 * frac, 7, 3); ctx.fillStyle = frac > 0.5 ? '#7ed957' : frac > 0.25 ? '#ffb703' : '#ef4444'; ctx.fill();
    ctx.restore();
  });
}

function drawStations(ctx, state) {
  const s = LAYOUT.stations;
  ctx.fillStyle = '#2e2118';
  rr(ctx, s.x, s.y, s.w, s.h, 14); ctx.fill();
  text(ctx, '🔥 AREA MASAK', s.x + 16, s.y + 22, 15, '#ffcf5c');
  STATIONS.forEach((st, i) => {
    const y = s.y + 44 + i * 84;
    const status = stationStatus(state, st.kind);
    ctx.fillStyle = '#4a3626';
    rr(ctx, s.x + 14, y, s.w - 28, 70, 10); ctx.fill();
    text(ctx, `${st.icon} ${st.name}`, s.x + 26, y + 18, 16, '#ffe9b0');
    if (!status) {
      text(ctx, 'kosong — klik bahan', s.x + 26, y + 46, 13, '#8a7a68');
    } else if (status.burned) {
      text(ctx, '🔥 GOSONG! Klik untuk buang', s.x + 26, y + 46, 13, '#ff6b6b');
    } else if (status.done) {
      text(ctx, '✅ MATANG — klik untuk ambil', s.x + 26, y + 46, 13, '#7ed957');
      drawIngredient(ctx, status.ing, s.x + s.w - 48, y + 35, 44, true);
    } else {
      rr(ctx, s.x + 26, y + 42, 150, 10, 5); ctx.fillStyle = '#241a12'; ctx.fill();
      rr(ctx, s.x + 26, y + 42, 150 * status.progress, 10, 5); ctx.fillStyle = '#ff9f43'; ctx.fill();
      text(ctx, `${Math.round(status.progress * 100)}%`, s.x + 186, y + 47, 13, '#ffb703');
      drawIngredient(ctx, status.ing, s.x + s.w - 48, y + 35, 40, false);
    }
  });
}

function drawPlate(ctx, state) {
  const p = LAYOUT.plate;
  ctx.fillStyle = '#2e2118';
  rr(ctx, p.x, p.y, p.w, p.h, 14); ctx.fill();
  text(ctx, '🍽️ PIRING RAKITAN', p.x + 16, p.y + 22, 15, '#ffcf5c');
  if (state.now < state.messageUntilMs && state.message) {
    text(ctx, state.message, p.x + 16, p.y + 46, 14, '#ffcf5c');
  } else {
    text(ctx, 'Klik piring / Spasi untuk menambah bahan', p.x + 16, p.y + 46, 13, '#8a7a68');
  }
  // the plate itself
  const cx = p.x + p.w / 2, cy = p.y + 190;
  ctx.fillStyle = '#fdf6e3';
  ctx.beginPath(); ctx.ellipse(cx, cy, 150, 42, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#d9c9a8'; ctx.lineWidth = 3; ctx.stroke();
  if (state.plate.length === 0) {
    text(ctx, 'Piring kosong', cx, cy - 4, 18, '#b8a88e');
  } else {
    // stack the dish bottom-to-top, newest on top
    state.plate.forEach((ing, i) => {
      const y = cy - 14 - i * 22;
      drawIngredient(ctx, ing, cx, y, 84, true);
    });
  }
  // hand
  if (state.hand) {
    text(ctx, 'Di tangan:', p.x + 16, p.y + 262, 14, '#cbb59a');
    drawIngredient(ctx, state.hand, p.x + 110, p.y + 262, 40, true);
    text(ctx, ING_BY_ID[state.hand].name, p.x + 140, p.y + 262, 15, '#fff');
  }
}

function drawServePanel(ctx, state) {
  const v = LAYOUT.serve;
  ctx.fillStyle = '#2e2118';
  rr(ctx, v.x, v.y, v.w, v.h, 14); ctx.fill();
  text(ctx, '🚀 SAJIKAN', v.x + 16, v.y + 22, 15, '#ffcf5c');
  // big serve button
  ctx.fillStyle = '#27ae60';
  rr(ctx, v.x + 16, v.y + 44, v.w - 32, 64, 12); ctx.fill();
  text(ctx, 'SAJIKAN  ⏎', v.x + v.w / 2, v.y + 76, 26, '#fff', 'center', 900);
  text(ctx, 'Sajikan ke pesanan yang cocok', v.x + 16, v.y + 128, 13, '#cbb59a');
  // trash
  ctx.fillStyle = '#7a3b22';
  rr(ctx, v.x + 16, v.y + 150, v.w - 32, 52, 10); ctx.fill();
  text(ctx, '🗑  BUANG PIRING  (Backspace)', v.x + v.w / 2, v.y + 176, 16, '#fff', 'center');
  // how to play
  text(ctx, 'Cara main:', v.x + 16, v.y + 228, 14, '#ffcf5c');
  text(ctx, '1. Klik bahan di counter (1–9)', v.x + 16, v.y + 250, 13, '#e8dcc8');
  text(ctx, '2. Daging/kentang/telur dimasak dulu', v.x + 16, v.y + 270, 13, '#e8dcc8');
  text(ctx, '3. Rakit di piring, sajikan cepat!', v.x + 16, v.y + 290, 13, '#e8dcc8');
}

function drawCounter(ctx, state) {
  const c = LAYOUT.counter;
  ctx.fillStyle = '#3a2a1a';
  rr(ctx, c.x, c.y, c.w, c.h, 14); ctx.fill();
  ctx.strokeStyle = '#5a4128'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, '🧺 COUNTER BAHAN — klik atau tekan 1–9', c.x + 16, c.y + 22, 15, '#ffcf5c');
  INGREDIENTS.forEach((ing, i) => {
    const x = c.x + 16 + i * (LAYOUT.binW + LAYOUT.binGap);
    const y = c.y + 40;
    const busy = ing.cook && state.stations[ing.cook];
    ctx.fillStyle = busy ? '#5a4632' : '#fdf6e3';
    rr(ctx, x, y, LAYOUT.binW, 100, 10); ctx.fill();
    drawIngredient(ctx, ing.id, x + LAYOUT.binW / 2, y + 38, 56, true);
    text(ctx, ing.name, x + LAYOUT.binW / 2, y + 76, 14, busy ? '#ffe9b0' : '#3b2a1a', 'center');
    text(ctx, `${i + 1}`, x + 8, y + 12, 12, busy ? '#ffcf5c' : '#8a6d3b');
    if (ing.cook) text(ctx, '🔥 dimasak', x + LAYOUT.binW / 2, y + 92, 11, '#b45309', 'center');
  });
}

function drawTitle(ctx, state) {
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, W, H);
  // warm kitchen backdrop stripes
  ctx.fillStyle = '#33241a';
  for (let i = 0; i < 6; i++) ctx.fillRect(0, 90 + i * 110, W, 46);
  text(ctx, '🍳', W / 2, 150, 90, '#fff', 'center');
  text(ctx, 'ORDER UP!', W / 2, 260, 84, '#ffcf5c', 'center', 900);
  text(ctx, '— DAPUR KILAT —', W / 2, 320, 30, '#fff', 'center');
  text(ctx, 'Pelanggan lapar, pesanan menumpuk. Masak cepat, sajikan tepat!', W / 2, 370, 22, '#e8dcc8', 'center');
  // sample dishes on display
  const dishes = ['burger', 'pizza', 'salad', 'fries'];
  dishes.forEach((id, i) => {
    const x = W / 2 - 270 + i * 180;
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath(); ctx.ellipse(x, 470, 70, 22, 0, 0, 7); ctx.fill();
    RECIPE_BY_ID[id].needs.slice(0, 3).forEach((ing, j) => drawIngredient(ctx, ing, x, 452 - j * 16, 56, true));
    text(ctx, RECIPE_BY_ID[id].name, x, 520, 15, '#ffe9b0', 'center');
  });
  pill(ctx, W / 2 - 180, 560, 360, 56, '#27ae60');
  text(ctx, '▶  MULAI MASAK  (Enter / klik)', W / 2, 588, 22, '#fff', 'center', 900);
  text(ctx, 'Keyboard 1–9 pilih bahan • Spasi rakit • Enter sajikan • Backspace buang', W / 2, 640, 15, '#cbb59a', 'center');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20, 12, 8, 0.88)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '🏁 ' + (state.missed >= MAX_MISSES ? 'DAPUR TUTUP!' : 'SHIFT SELESAI!'), W / 2, 170, 56, '#ffcf5c', 'center', 900);
  text(ctx, state.endReason, W / 2, 230, 22, '#e8dcc8', 'center');
  pill(ctx, W / 2 - 260, 280, 520, 110, '#33241a', '#5a4128');
  text(ctx, `SKOR AKHIR  ${state.score.toLocaleString('id-ID')}`, W / 2, 312, 30, '#fff', 'center', 900);
  text(ctx, `Pesanan tersaji: ${state.served}   •   Gagal: ${state.missed}   •   Level: ${state.level}`, W / 2, 352, 18, '#cbb59a', 'center');
  pill(ctx, W / 2 - 180, 440, 360, 56, '#27ae60');
  text(ctx, '↻  MAIN LAGI  (Enter / klik)', W / 2, 468, 22, '#fff', 'center', 900);
  text(ctx, 'Tip: sajikan saat timer pelanggan masih hijau untuk bonus waktu.', W / 2, 540, 15, '#cbb59a', 'center');
}

// --- main entry -------------------------------------------------------------

export function render(ctx, state) {
  ctx.clearRect(0, 0, W, H);
  if (state.screen === 'title') { drawTitle(ctx, state); return; }
  if (state.screen === 'over') {
    drawHeader(ctx, state);
    drawOrderBoard(ctx, state);
    drawStations(ctx, state);
    drawPlate(ctx, state);
    drawServePanel(ctx, state);
    drawCounter(ctx, state);
    drawGameOver(ctx, state);
    return;
  }
  drawHeader(ctx, state);
  drawOrderBoard(ctx, state);
  drawStations(ctx, state);
  drawPlate(ctx, state);
  drawServePanel(ctx, state);
  drawCounter(ctx, state);
}

// Hit regions for mouse / touch input. Each: {kind, id, x, y, w, h}.
export function hitRegions(state) {
  const regions = [];
  if (state.screen === 'title') {
    regions.push({ kind: 'start', id: 'start', x: W / 2 - 180, y: 560, w: 360, h: 56 });
    return regions;
  }
  if (state.screen === 'over') {
    regions.push({ kind: 'restart', id: 'restart', x: W / 2 - 180, y: 440, w: 360, h: 56 });
    return regions;
  }
  state.orders.forEach((order, i) => {
    regions.push({
      kind: 'order', id: order.id,
      x: LAYOUT.board.x + 16 + i * (LAYOUT.ticketW + LAYOUT.ticketGap),
      y: LAYOUT.board.y + 36, w: LAYOUT.ticketW, h: 68,
    });
  });
  STATIONS.forEach((st) => {
    regions.push({
      kind: 'station', id: st.kind,
      x: LAYOUT.stations.x + 14, y: LAYOUT.stations.y + 44 + STATIONS.indexOf(st) * 84,
      w: LAYOUT.stations.w - 28, h: 70,
    });
  });
  regions.push({ kind: 'plate', id: 'plate', x: LAYOUT.plate.x, y: LAYOUT.plate.y, w: LAYOUT.plate.w, h: LAYOUT.plate.h });
  regions.push({ kind: 'serve', id: 'serve', x: LAYOUT.serve.x + 16, y: LAYOUT.serve.y + 44, w: LAYOUT.serve.w - 32, h: 64 });
  regions.push({ kind: 'trash', id: 'trash', x: LAYOUT.serve.x + 16, y: LAYOUT.serve.y + 150, w: LAYOUT.serve.w - 32, h: 52 });
  INGREDIENTS.forEach((ing, i) => {
    regions.push({
      kind: 'ingredient', id: ing.id,
      x: LAYOUT.counter.x + 16 + i * (LAYOUT.binW + LAYOUT.binGap),
      y: LAYOUT.counter.y + 40, w: LAYOUT.binW, h: 100,
    });
  });
  return regions;
}
