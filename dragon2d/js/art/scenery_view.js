/* 땅·소품 보기판 — ?p=village [&still=1 [&x=32&y=24]] · 장소: village forest hall cove arena forge dock nest beach under sea
   위: 엔진 장소 지도를 bakeChunk 로 굽고 소품을 그 위에(발 자리 y 차례 · 그물 지붕은 맨 위) 천천히 흘림 · 아래: 소품 전부 한 칸씩.
   actors.js 는 쓰지 않는다(키 1.55m 회색 막대만 눈금으로). */
import { bakeChunk, drawProp, PROP_SIZE, PROP_KINDS, TILE_KINDS } from './scenery.js';

/* ── 엔진 장소 지도 틀(world.js 에서 옮긴 시험용 복사) ── */
const KINDS = ['void', 'grass', 'grass2', 'path', 'stone', 'sand', 'snow', 'water', 'sea', 'deep', 'wood', 'arena', 'rockfloor', 'plank', 'wall', 'cliff'];
const K = Object.fromEntries(KINDS.map((k, i) => [k, i]));
/* 지도 짓기 손 */
function grid(w, h, base) {
  const t = new Uint8Array(w * h).fill(K[base]);
  const M = { w, h, t,
    set(x, y, k) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) t[y * w + x] = K[k]; },
    rect(x0, y0, x1, y1, k) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) M.set(x, y, k); },
    disc(cx, cy, rx, ry, k) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) M.set(x, y, k); },
    line(pts, r, k) { for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2); for (let j = 0; j <= n; j++) { const q = j / n; M.disc(ax + (bx - ax) * q, ay + (by - ay) * q, r, r, k); } } },
    ring(x0, y0, x1, y1, k, th = 1) { M.rect(x0, y0, x1, y0 + th, k); M.rect(x0, y1 - th, x1, y1, k); M.rect(x0, y0, x0 + th, y1, k); M.rect(x1 - th, y0, x1, y1, k); },
  };
  return M;
}
const rnd = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

/* 장소 — 지도 + 소품 [kind, x, y, o] + 자리 A */
const PLACES = {
  village() {
    const M = grid(64, 46, 'grass'), R = rnd(1656844137), P = [];
    M.rect(0, 33, 64, 35, 'sand'); M.rect(0, 35, 64, 46, 'sea'); M.rect(45, 33, 48, 42, 'plank');
    M.rect(0, 17, 64, 19, 'path'); M.rect(0, 28, 57, 30, 'path'); M.rect(23, 19, 27, 28, 'path'); M.rect(19, 20, 31, 27, 'stone');
    M.line([[31, 17], [32, 11], [32, 9]], 1.1, 'path'); M.line([[56, 29], [58, 31]], 1.2, 'stone'); M.rect(54, 29, 62, 33, 'stone'); M.line([[46, 29], [46.5, 33]], 1, 'path');
    for (const x of [9, 17, 41, 49]) P.push(['house', x, 16, { w: 6, d: 4 }]);
    P.push(['hall', 32, 9, { w: 11, d: 5 }]);
    P.push(['forge', 7, 27, { w: 7, d: 4 }]); for (const x of [15, 33, 41, 49]) P.push(['house', x, 27, { w: 6, d: 4 }]);
    P.push(['well', 25, 23.5, {}], ['tower', 59, 29, {}], ['catapult', 58.5, 32, { ang: 0 }]);
    for (const [x, y] of [[13, 19.6], [29, 19.6], [45, 19.6], [21, 30.4], [37, 30.4]]) P.push(['torch', x, y, { lit: 1 }]);
    P.push(['fence', 51, 21, { len: 6 }], ['fence', 51, 26, { len: 6 }], ['fence', 54, 26, { len: 5, v: 1 }], ['sheep', 51, 23.5, {}], ['sheep', 52.6, 24.8, {}], ['cart', 37, 21.5, {}], ['barrel', 30, 21, {}], ['crate', 20.2, 21, {}]);
    for (let i = 0; i < 26; i++) { const x = 1 + R() * 62, y = 1 + R() * 7; if (Math.abs(x - 32) > 7) P.push([R() < 0.5 ? 'pine' : 'tree', x, y, {}]); }
    for (let i = 0; i < 6; i++) P.push(['pine', 1 + R() * 2, 9 + i * 3.5, {}]);
    return { M, P, A: { forge: [7, 28.4], well: [25, 24.4], street: [25, 18], hall: [32, 10], dock: [46.5, 36], tower: [58.5, 31.2], pen: [51, 23.5], start: [10, 29] }, bounds: [0, 0, 64, 40] };
  },
  forest() {
    const M = grid(52, 30, 'grass2'), R = rnd(77), P = [];
    M.line([[0, 15], [10, 14], [20, 16], [30, 13.5], [40, 15], [52, 15]], 1.3, 'path'); M.disc(44, 15, 6, 5, 'grass');
    for (let i = 0; i < 70; i++) { const x = R() * 52, y = R() * 30; if (Math.abs(y - (15 + Math.sin(x * 0.3) * 1.2)) > 3.6 && Math.hypot(x - 44, (y - 15) * 1.2) > 6.5) P.push([R() < 0.65 ? 'pine' : 'tree', x, y, {}]); }
    P.push(['log', 18.5, 17.6, { len: 4, v: 1 }], ['log', 29, 16, { len: 4.4, v: 1 }], ['broken_tree', 13, 12.3, {}], ['rock', 36, 18.2, { w: 2, h: 1.2 }]);
    return { M, P, A: { start: [2, 15], clues: [[12, 14.2], [24, 15.3], [33, 13.9], [38.5, 15]], fury: [45, 15] }, bounds: [0, 0, 52, 30] };
  },
  hall() {
    const M = grid(30, 18, 'wood'), P = [];
    M.ring(0, 0, 30, 18, 'wall', 2); M.rect(13, 16, 17, 18, 'wood');
    for (const x of [5, 12, 19, 26]) P.push(['torch', x, 2.6, { lit: 1 }]);
    P.push(['table', 8, 7, { w: 7 }], ['table', 22, 7, { w: 7 }], ['table', 8, 12, { w: 7 }], ['table', 22, 12, { w: 7 }], ['hearth', 15, 10.5, {}], ['book_stand', 26.5, 14.5, {}]);
    return { M, P, A: { door: [15, 15.5], front: [15, 5], torches: [[5, 3.2], [12, 3.2], [19, 3.2], [26, 3.2]] }, bounds: [0, 0, 30, 18] };
  },
  cove() {
    const M = grid(40, 30, 'grass'), P = [];
    M.ring(0, 0, 40, 30, 'cliff', 3); M.rect(0, 13, 3, 17, 'grass'); M.disc(31, 14, 7.5, 9, 'sand'); M.disc(31, 14, 6.5, 8, 'water');
    P.push(['rock', 14, 12, { w: 2.2, h: 1.3 }], ['rock', 19, 19, { w: 2, h: 1.1 }], ['tree', 7, 6, {}], ['tree', 6, 23, {}], ['reed', 24.5, 9, {}], ['reed', 24.5, 20, {}]);
    return { M, P, A: { gate: [2, 15], mid: [18, 15], lake: [24, 15], rocks: [[14, 12], [19, 19]] }, bounds: [0, 0, 40, 30] };
  },
  arena() {
    const M = grid(30, 22, 'arena'), P = [];
    M.ring(0, 0, 30, 22, 'wall', 2); M.rect(13, 20, 17, 22, 'arena');
    for (const x of [8, 15, 22]) P.push(['cage', x, 4, { open: 0 }]);
    P.push(['net_roof', 15, 21, { w: 30, d: 22 }], ['shield_rack', 4, 18.5, {}]);
    return { M, P, A: { door: [15, 19], cages: [[8, 4.6], [15, 4.6], [22, 4.6]], mid: [15, 11] }, bounds: [0, 0, 30, 22] };
  },
  forge() {
    const M = grid(18, 12, 'wood'), P = [];
    M.ring(0, 0, 18, 12, 'wall', 2); M.rect(8, 10, 10, 12, 'wood');
    P.push(['forge', 5, 4, { inside: 1 }], ['_anvil', 9, 6.5, {}], ['shield_rack', 14, 3, {}], ['barrel', 15, 8, {}], ['weapon_pile', 3, 8.5, { n: 4 }]);
    return { M, P, A: { anvil: [9, 7.3], door: [9, 10] }, bounds: [0, 0, 18, 12] };
  },
  dock() {
    const M = grid(40, 44, 'sea'), P = [];
    M.rect(0, 0, 40, 9, 'grass'); M.rect(0, 9, 40, 12, 'sand'); M.rect(18, 12, 22, 27, 'plank'); M.rect(8, 12, 32, 14, 'plank');
    P.push(['house', 10, 6, { w: 6, d: 4 }], ['barrel', 23, 13, {}], ['crate', 9, 13.2, {}], ['fish_basket', 21.4, 25.6, { n: 0 }], ['ship', 30, 22, { w: 10, d: 3 }], ['seastack', 14, 38, { r: 1.6 }], ['seastack', 27, 39, { r: 1.9 }]);
    return { M, P, A: { pierEnd: [20, 26], shore: [20, 10], fishing: [20, 35] }, bounds: [0, 0, 40, 44] };
  },
  nest() {
    const M = grid(50, 30, 'rockfloor'), P = [];
    M.ring(0, 0, 50, 30, 'cliff', 2); M.disc(25, 17, 9, 7, 'deep'); M.rect(0, 5, 3, 9, 'rockfloor'); M.rect(47, 5, 50, 9, 'rockfloor');
    P.push(['rock', 10, 9, { w: 2.4, h: 1.6 }], ['rock', 21, 7.6, { w: 2.2, h: 1.4 }], ['rock', 31, 7.4, { w: 2.4, h: 1.6 }], ['rock', 40, 8.6, { w: 2.2, h: 1.4 }], ['nest_rim', 25, 10.5, { w: 14 }]);
    return { M, P, A: { start: [3, 7], exit: [48, 7], pit: [25, 17] }, bounds: [0, 0, 50, 30] };
  },
  beach() {
    const M = grid(50, 34, 'sand'), P = [];
    M.rect(0, 0, 50, 6, 'rockfloor'); M.rect(0, 27, 50, 34, 'sea');
    P.push(['ship', 10, 28, { w: 10, d: 3 }], ['ship', 38, 28.5, { w: 11, d: 3 }], ['rock', 18, 16, { w: 2.4, h: 1.5 }], ['rock', 33, 18, { w: 2.2, h: 1.4 }], ['weapon_pile', 25, 23, { n: 0 }]);
    return { M, P, A: { start: [25, 24], boss: [25, 4] }, bounds: [0, 0, 50, 34] };
  },
  under() {
    const M = grid(24, 18, 'deep'), P = [];
    M.rect(0, 15, 24, 18, 'sand');
    P.push(['rock', 3, 15.5, { w: 2.5, h: 1.4 }], ['rock', 21, 15.8, { w: 2.5, h: 1.6 }]);
    return { M, P, A: { start: [12, 3], chains: [[6, 12], [12, 13], [18, 12]] }, bounds: [0, 0, 24, 18], swim: 1 };
  },
  sea() { const M = grid(48, 48, 'sea'); return { M, P: [], A: {}, bounds: null, sky: 1, wrap: 1 }; },
};


const NAMES = Object.keys(PLACES);
const Q = new URLSearchParams(location.search);
const place = NAMES.includes(Q.get('p')) ? Q.get('p') : 'village', still = Q.get('still') === '1';
const W = 1366, H = 768, S = 70, CH = 16, PX = 48;
const elP = document.getElementById('p'), elMv = document.getElementById('mv'), info = document.getElementById('info');
for (const p of NAMES) elP.add(new Option(p, p)); elP.value = place; elMv.checked = !still;
elP.onchange = () => { const u = new URL(location.href); u.searchParams.set('p', elP.value); location.href = u; };

const def = PLACES[place](), M = def.M, kindAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= M.w || ty >= M.h) ? 0 : M.t[ty * M.w + tx];
const map = { w: M.w, h: M.h, kind: (tx, ty) => KINDS[kindAt(tx, ty)] };
const FLAT = new Set(['sand_line', 'nip', 'reed', 'dock', 'ember']), OVER = new Set(['net_roof']);
const props = def.P.map(([kind, x, y, o]) => ({ kind, x, y, o: o || {} }));
const sc = document.getElementById('scene'), g = sc.getContext('2d'), pc = document.getElementById('props'), pg = pc.getContext('2d');
const chunks = new Map(); let bakeMs = 0, bakeN = 0;
function chunk(cx, cy) { const k = cx + ',' + cy; let c = chunks.get(k); if (!c) { const t0 = performance.now(); c = bakeChunk(map, cx, cy, CH, PX); c.getContext('2d').getImageData(0, 0, 1, 1); bakeMs += performance.now() - t0; bakeN++; chunks.set(k, c); } return c; }

/* 소품 표 */
const SHEET = [];
for (const k of PROP_KINDS) {
  if (k === 'house') SHEET.push(['house', k, { w: 6, d: 4 }], ['house v2 초가', k, { w: 6, d: 4, v: 2, thatch: 1 }], ['house burn .5', k, { w: 6, d: 4, v: 1, burn: 0.5, scorch: 0.5 }], ['house burn 1', k, { w: 6, d: 4, v: 3, burn: 1, scorch: 1 }]);
  else if (k === 'hall') SHEET.push(['hall', k, { w: 11, d: 5 }], ['hall burn .5', k, { w: 11, d: 5, burn: 0.5, scorch: 0.4 }]);
  else if (k === 'forge') SHEET.push(['forge 밖', k, { w: 7, d: 4 }], ['forge 안', k, { inside: 1 }]);
  else if (k === 'cage') SHEET.push(['cage 닫힘', k, { open: 0 }], ['cage 열림', k, { open: 0.85 }]);
  else if (k === 'torch') SHEET.push(['torch 켬', k, { lit: 1 }], ['torch 끔', k, { lit: 0 }]);
  else if (k === 'weapon_pile') SHEET.push(['weapon_pile 3', k, { n: 3 }], ['weapon_pile 8', k, { n: 8 }]);
  else if (k === 'catapult') SHEET.push(['catapult 동', k, { ang: 0 }], ['catapult 남', k, { ang: Math.PI / 2 }]);
  else if (k === 'fence') SHEET.push(['fence 가로', k, { len: 4 }], ['fence 세로', k, { len: 4, v: 1 }]);
  else if (k === 'log') SHEET.push(['log 가로', k, { len: 3 }], ['log 세로', k, { len: 3, v: 1 }]);
  else if (k === 'sand_line') SHEET.push(['sand_line 가로', k, { len: 3 }], ['sand_line 세로', k, { len: 3, v: 1 }]);
  else if (k === 'fish_basket') SHEET.push(['fish_basket 2', k, { n: 2 }], ['fish_basket 뱀장어', k, { n: 0, eel: 1 }]);
  else if (k === 'tree') SHEET.push(['tree 0', k, { v: 0 }], ['tree 2', k, { v: 2 }]);
  else if (k === 'pine') SHEET.push(['pine 0', k, { v: 0 }], ['pine 3', k, { v: 3 }]);
  else if (k === 'net_roof') SHEET.push(['net_roof(작게)', k, { w: 8, d: 5 }]);
  else if (k === 'barrel') SHEET.push(['barrel', k, {}], ['barrel 물', k, { water: 1 }]);
  else if (k === 'cloud') SHEET.push(['cloud', k, { w: 6, h: 3.2 }]);
  else if (k === 'seastack') SHEET.push(['seastack', k, { r: 1.2 }]);
  else if (k === 'dock') SHEET.push(['dock', k, { w: 6, d: 3 }]);
  else if (k === 'ship') SHEET.push(['ship', k, { w: 10, d: 3 }]);
  else if (k === 'table') SHEET.push(['table', k, { w: 5 }]);
  else if (k === 'hearth') SHEET.push(['hearth', k, { lit: 1 }]);
  else if (k === 'nest_rim') SHEET.push(['nest_rim', k, { w: 12 }]);
  else if (k === 'barricade') SHEET.push(['barricade', k, { w: 2.4 }]);
  else SHEET.push([k, k, {}]);
}
const CW = 222, CH2 = 236, COLS = 6; pc.height = Math.ceil(SHEET.length / COLS) * CH2 + 8;
const grassCv = bakeChunk({ w: 99, h: 99, kind: () => 'grass' }, 0, 0, CH, PX);
function sheetSize(it) {
  const sz = PROP_SIZE[it[1]] || [2, 2], o = it[2]; let w = sz[0], h = sz[1];
  if (o.w) w = Math.max(w, o.w + 1.2); if (o.len) { w = Math.max(w, o.v ? 1.5 : o.len + 0.5); h = Math.max(h, o.v ? o.len + 1.2 : 1.2); }
  if (it[1] === 'net_roof') { w = o.w || 30; h = o.d || 22; } if (it[1] === 'forge' && o.inside) { w = 3; h = 5; } if (it[1] === 'house') { w = 8.2; h = 8.6; }
  if (it[1] === 'cloud') { w = o.w; h = o.h; } return [w, h, sz[2] || 0];
}
function drawSheet(t) {
  pg.fillStyle = '#e9ddba'; pg.fillRect(0, 0, pc.width, pc.height); pg.font = '12px sans-serif'; pg.textAlign = 'center';
  SHEET.forEach((it, i) => {
    const cx0 = (i % COLS) * CW, cy0 = Math.floor(i / COLS) * CH2 + 4, sz = sheetSize(it), w = sz[0], h = sz[1];
    pg.save(); pg.beginPath(); pg.rect(cx0 + 4, cy0, CW - 8, CH2 - 10); pg.clip();
    pg.drawImage(grassCv, 0, 0, 480, 480, cx0 + 4, cy0, CW - 8, CH2 - 10);
    const sc2 = Math.min((CW - 36) / w, (CH2 - 70) / h, 56), gx = cx0 + CW / 2, gy = cy0 + 20 + (CH2 - 70) * 0.5 + h * sc2 * 0.5 + (it[1] === 'net_roof' ? 0 : 0);
    const top = it[1] === 'cloud' ? 0 : 0;
    pg.translate(gx, it[1] === 'cloud' ? cy0 + (CH2 - 30) * 0.5 : Math.min(gy, cy0 + CH2 - 48)); pg.scale(sc2, sc2);
    if (it[1] === 'net_roof') pg.translate(0, it[2].d * 0.5 + 0.0);
    drawProp(pg, it[1], it[2], t); pg.restore();
    pg.fillStyle = '#2b2118'; pg.fillText(it[0], cx0 + CW / 2, cy0 + CH2 - 18);
  });
}

/* 장면 */
const b = def.bounds || [0, 0, M.w, M.h]; let camX = Q.get('x') ? +Q.get('x') : Math.min(M.w - 10, 20), camY = Q.get('y') ? +Q.get('y') : Math.min(M.h - 6, 22), last = 0, dir = 1;
function person(x, y) { g.save(); g.translate(x, y); g.fillStyle = 'rgba(30,24,20,.26)'; g.beginPath(); g.ellipse(0, 0, 0.32 * S, 0.2 * S, 0, 0, 7); g.fill(); g.fillStyle = '#8c8f94'; g.strokeStyle = '#2b2118'; g.lineWidth = 2; g.beginPath(); g.roundRect(-0.2 * S, -1.25 * S, 0.4 * S, 1.25 * S, 0.12 * S); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -1.42 * S, 0.17 * S, 0, 7); g.fill(); g.stroke(); g.restore(); }
function frame(ms) {
  const t = ms / 1000, dt = Math.min(0.05, t - last); last = t;
  if (elMv.checked) { camX += dir * dt * 1.6; if (camX > M.w - 10 || camX < 10) dir = -dir; }
  const x0 = Math.floor((camX - W / 2 / S) / CH), x1 = Math.floor((camX + W / 2 / S) / CH), y0 = Math.floor((camY - H / 2 / S) / CH), y1 = Math.floor((camY + H / 2 / S) / CH);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#1d2730'; g.fillRect(0, 0, W, H);
  const sx = (x) => W / 2 + (x - camX) * S, sy = (y) => H / 2 + (y - camY) * S;
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { if (cx < 0 || cy < 0 || cx >= Math.ceil(M.w / CH) || cy >= Math.ceil(M.h / CH)) continue; g.drawImage(chunk(cx, cy), Math.floor(sx(cx * CH)), Math.floor(sy(cy * CH)), Math.ceil(CH * S) + 1, Math.ceil(CH * S) + 1); }
  const at = (p) => { g.setTransform(1, 0, 0, 1, 0, 0); g.translate(sx(p.x), sy(p.y)); g.scale(S, S); };
  const vis = (p) => Math.abs(p.x - camX) < W / 2 / S + 16 && Math.abs(p.y - camY) < H / 2 / S + 12;
  for (const p of props) if (FLAT.has(p.kind) && vis(p)) { at(p); drawProp(g, p.kind, p.o, t); }
  const items = props.filter(p => !FLAT.has(p.kind) && !OVER.has(p.kind) && vis(p)); items.push({ kind: '_me', x: camX, y: camY + 1.2, o: {} }); items.sort((a, b) => a.y - b.y);
  for (const p of items) { if (p.kind === '_me') { g.setTransform(1, 0, 0, 1, 0, 0); person(sx(p.x), sy(p.y)); } else { at(p); drawProp(g, p.kind, p.o, t); } }
  for (const p of props) if (OVER.has(p.kind) && vis(p)) { at(p); drawProp(g, p.kind, p.o, t); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  info.textContent = place + ' · 땅 조각 ' + bakeN + '개 · 굽기 ' + bakeMs.toFixed(0) + 'ms (' + (bakeMs / Math.max(1, bakeN)).toFixed(0) + 'ms/조각)';
  drawSheet(t);
  if (!still) requestAnimationFrame(frame);
}
window.SV = { bakeStats: () => ({ ms: bakeMs, n: bakeN }), place };
requestAnimationFrame(frame);
