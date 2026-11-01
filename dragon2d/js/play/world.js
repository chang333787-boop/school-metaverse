// 장소 — 탑뷰 타일 땅(1m 칸) + 소품(벽처럼 막는 것 · 낮은 것은 점프로 넘음) + 이름 붙은 자리(A)
// 그리기: 땅 조각(구워 둔 캔버스) → 바닥에 붙은 소품 → 발 자리 y 차례(소품·배우·히컵) → 맨 위 덮개(그물 지붕) — 엔진(main)이 차례를 잇는다
// 길 찾기 없음: 갈 곳은 ▼(화면 밖이면 가장자리 화살표) · 장소는 작게
import { bakeChunk, drawProp } from '../art/scenery.js?v=1';

export const KINDS = ['void', 'grass', 'grass2', 'path', 'stone', 'sand', 'snow', 'water', 'sea', 'deep', 'wood', 'arena', 'rockfloor', 'plank', 'wall', 'cliff'];
const K = Object.fromEntries(KINDS.map((k, i) => [k, i]));
const SOLID = new Set([K.void, K.water, K.sea, K.deep, K.wall, K.cliff]);
const FLAT = new Set(['sand_line', 'nip', 'reed', '_clue', '_scale', '_fin', '_shield', '_knife', '_fish', 'dock', 'ember', '_ring']);
const OVER = new Set(['net_roof']);
/* 소품이 막는 자리(발 자리 기준 · [왼, 뒤(북), 오른, 앞]) · 다섯째 1 = 낮음(점프로 넘음) */
const BOX = {
  house: (o) => [-(o.w || 6) / 2, -(o.d || 4), (o.w || 6) / 2, 0], forge: (o) => o.inside ? [-1.2, -1, 1.2, 0] : [-3.5, -4, 3.5, 0], hall: (o) => [-(o.w || 10) / 2, -(o.d || 5), (o.w || 10) / 2, 0],
  tower: () => [-1.5, -2, 1.5, 0], well: () => [-0.8, -0.8, 0.8, 0.2], cart: () => [-1, -0.6, 1, 0.1], barrel: () => [-0.4, -0.5, 0.4, 0.1], crate: () => [-0.45, -0.7, 0.45, 0.1],
  fence: (o) => o.v ? [-0.12, -(o.len || 3), 0.12, 0] : [-(o.len || 3) / 2, -0.25, (o.len || 3) / 2, 0.05], torch: () => [-0.15, -0.2, 0.15, 0.05], catapult: () => [-1, -1, 1, 0.2],
  tree: () => [-0.45, -0.4, 0.45, 0.1], pine: () => [-0.4, -0.35, 0.4, 0.1], broken_tree: () => [-0.4, -0.35, 0.4, 0.1], log: (o) => o.v ? [-0.35, -(o.len || 2), 0.35, 0.05, 1] : [-(o.len || 2) / 2, -0.45, (o.len || 2) / 2, 0.05, 1],
  rock: (o) => [-(o.w || 2) / 2, -(o.w || 2) * 0.45, (o.w || 2) / 2, 0.05, (o.h || 1.4) < 0.7 ? 1 : 0], cage: () => [-2, -1.6, 2, 0], barricade: (o) => [-(o.w || 1.6) / 2, -0.4, (o.w || 1.6) / 2, 0.05],
  shield_rack: () => [-0.8, -0.35, 0.8, 0.05], weapon_pile: () => [-0.6, -0.5, 0.6, 0.1], ship: (o) => [-(o.w || 10) / 2, -(o.d || 3), (o.w || 10) / 2, 0], boat: () => [-1.5, -1, 1.5, 0],
  board: () => [-0.8, -0.25, 0.8, 0.05], table: (o) => [-(o.w || 4) / 2, -0.8, (o.w || 4) / 2, 0.05], bed: () => [-1, -2, 1, 0], book_stand: () => [-0.35, -0.3, 0.35, 0.05], anvil: () => [-0.5, -0.4, 0.5, 0.05], _anvil: () => [-0.5, -0.4, 0.5, 0.05],
  fish_basket: () => [-0.35, -0.3, 0.35, 0.05], sheep: () => [-0.5, -0.4, 0.5, 0.05], hearth: () => [-1.5, -1.2, 1.5, 0], nest_rim: (o) => [-(o.w || 3) / 2, -1, (o.w || 3) / 2, 0],
};

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
export const PLACES = {
  village() {
    const M = grid(64, 46, 'grass'), R = rnd(1656844137), P = [];
    M.rect(0, 33, 64, 35, 'sand'); M.rect(0, 35, 64, 46, 'sea'); M.rect(45, 33, 48, 42, 'plank');
    M.rect(0, 17, 64, 19, 'path'); M.rect(0, 28, 57, 30, 'path'); M.rect(23, 19, 27, 28, 'path'); M.rect(19, 20, 31, 27, 'stone');
    M.line([[31, 17], [32, 11], [32, 9]], 1.1, 'path'); M.line([[56, 29], [58, 31]], 1.2, 'stone'); M.rect(54, 29, 62, 33, 'stone'); M.line([[46, 29], [46.5, 33]], 1, 'path');
    [9, 17, 41, 49].forEach((x, i) => P.push(['house', x, 16, { w: 6, d: 4, v: i % 4 }]));
    P.push(['hall', 32, 9, { w: 11, d: 5 }]);
    P.push(['forge', 7, 27, { w: 7, d: 4 }]); [15, 33, 41, 49].forEach((x, i) => P.push(['house', x, 27, { w: 6, d: 4, v: (i + 2) % 4 }]));
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
    P.push(['table', 8, 7, { w: 7 }], ['table', 22, 7, { w: 7 }], ['table', 8, 12, { w: 7 }], ['table', 22, 12, { w: 7 }], ['hearth', 15, 10.5, { lit: 1 }], ['book_stand', 26.5, 14.5, {}]);
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

const CH = 16, PX = 48;
export function makePlace(name, time, opt = {}) {
  const def = (PLACES[name] || PLACES.village)(opt);
  const { M } = def;
  const W = {
    name, time, w: M.w, h: M.h, A: def.A, sky: !!def.sky, swim: !!def.swim, wrap: !!def.wrap, bounds: def.bounds, rects: [], chunks: new Map(), props: [],
  };
  W.kindAt = (tx, ty) => { if (W.wrap) { tx = ((tx % M.w) + M.w) % M.w; ty = ((ty % M.h) + M.h) % M.h; } else if (tx < 0 || ty < 0 || tx >= M.w || ty >= M.h) return 0; return M.t[ty * M.w + tx]; };
  W.map = { w: M.w, h: M.h, kind: (tx, ty) => KINDS[W.kindAt(tx, ty)] };
  W.setTile = (x, y, k) => { M.set(x, y, k); W.chunks.clear(); };
  /* 막힘 — 발 상자(가로 r · 세로 r×0.6)가 막는 타일·소품 상자에 닿나 · z(점프 높이)가 높으면 낮은 상자는 넘음 */
  W.blocked = (x, y, r = 0.3, z = 0) => {
    const ry = r * 0.6;
    for (let i = 0; i < 4; i++) {
      const k = W.kindAt(Math.floor(i & 1 ? x + r : x - r), Math.floor(i & 2 ? y + ry : y - ry));
      if (SOLID.has(k) && !(W.swim && k === K.deep)) return true;
    }
    for (const b of W.rects) if (!b.off && x + r > b[0] && x - r < b[2] && y + ry > b[1] && y - ry < b[3] && !(b[4] && z > 0.35)) return true;
    return false;
  };
  W.move = (P, nx, ny, r) => {
    if (W.blocked(P.x, P.y, r, P.z)) { P.x = nx; P.y = ny; return; }      /* 이미 낀 자리(낮은 통나무 위에 내려앉음 등) = 빠져나가게 */
    if (!W.blocked(nx, P.y, r, P.z)) P.x = nx;
    if (!W.blocked(P.x, ny, r, P.z)) P.y = ny;
  };
  W.walkable = (x, y) => !W.blocked(x, y, 0.3, 0);
  function mkProp(kind, x, y, o = {}) {
    const p = { kind, x, y, o: Object.assign({}, o), flat: FLAT.has(kind), over: OVER.has(kind) };
    const f = BOX[kind]; if (f && !o.nobox) { const b = f(p.o); p.box = [x + b[0], y + b[1], x + b[2], y + b[3], b[4] || 0]; W.rects.push(p.box); }
    return p;
  }
  W.prop = (kind, x, y, o = {}) => { const p = mkProp(kind, x, y, o); p.tmp = true; W.props.push(p); return p; };
  W.removeProp = (p) => { const i = W.props.indexOf(p); if (i >= 0) W.props.splice(i, 1); if (p.box) { const j = W.rects.indexOf(p.box); if (j >= 0) W.rects.splice(j, 1); } };
  W.dropTmp = () => { for (const p of W.props.filter((q) => q.tmp)) W.removeProp(p); };
  W.findProp = (kind, x, y) => { let best = null, bd = 1e9; for (const p of W.props) if (p.kind === kind) { const d = x == null ? 0 : Math.hypot(p.x - x, p.y - (y ?? p.y)); if (d < bd) { bd = d; best = p; } } return best; };
  for (const [kind, x, y, o] of def.P) W.props.push(mkProp(kind, x, y, o));
  return W;
}

/* 장소를 바꿀 때 조각을 미리 다 구움(덮개 아래 · 걷다가 새 조각을 굽느라 멈칫하지 않게) */
export function prebake(W) {
  const nx = Math.ceil(W.w / CH), ny = Math.ceil(W.h / CH);
  for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) { const key = cx + ',' + cy; if (!W.chunks.has(key)) W.chunks.set(key, bakeChunk(W.map, cx, cy, CH, PX)); }
}
/* 땅 — 보이는 조각만 굽고(처음 한 번) 그림 · 조각은 24개까지 기억 */
export function drawGround(W, V) {
  const ctx = V.ctx, S = V.S, x0 = Math.floor((V.cam.x - V.halfW()) / CH), x1 = Math.floor((V.cam.x + V.halfW()) / CH), y0 = Math.floor((V.cam.y - V.halfH()) / CH), y1 = Math.floor((V.cam.y + V.halfH()) / CH);
  V.reset(); ctx.fillStyle = '#1d2730'; ctx.fillRect(0, 0, V.W, V.H);
  const nx = Math.ceil(W.w / CH), ny = Math.ceil(W.h / CH);
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    let mx = cx, my = cy;
    if (W.wrap) { mx = ((cx % nx) + nx) % nx; my = ((cy % ny) + ny) % ny; }
    else if (cx < 0 || cy < 0 || cx >= nx || cy >= ny) continue;
    const key = mx + ',' + my; let c = W.chunks.get(key);
    if (!c) { c = bakeChunk(W.map, mx, my, CH, PX); W.chunks.set(key, c); if (W.chunks.size > 24) W.chunks.delete(W.chunks.keys().next().value); }
    ctx.drawImage(c, Math.floor(V.sx(cx * CH)), Math.floor(V.sy(cy * CH)), Math.ceil(CH * S) + 1, Math.ceil(CH * S) + 1);
  }
}
/* 소품 하나 — 엔진 쪽 작은 소품(_로 시작)은 여기서 */
const LOCAL = {
  _scale(ctx) { ln(ctx); ctx.fillStyle = '#4a4440'; ctx.beginPath(); ctx.moveTo(-0.2, -0.05); ctx.quadraticCurveTo(0, -0.42, 0.2, -0.05); ctx.quadraticCurveTo(0, 0.02, -0.2, -0.05); ctx.fill(); ctx.stroke(); },
  _fish(ctx, o) { ln(ctx); ctx.fillStyle = o.eel ? '#5a6a3a' : '#b7c2bf'; ctx.beginPath(); ctx.ellipse(0, -0.1, 0.3, 0.1, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0.28, -0.1); ctx.lineTo(0.42, -0.22); ctx.lineTo(0.42, 0.02); ctx.closePath(); ctx.fill(); ctx.stroke(); },
  _knife(ctx) { ln(ctx); ctx.fillStyle = '#cfd4d6'; ctx.beginPath(); ctx.moveTo(-0.3, -0.04); ctx.lineTo(0.2, -0.08); ctx.lineTo(0.28, -0.04); ctx.lineTo(-0.3, 0); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6a4a2e'; ctx.fillRect(-0.42, -0.06, 0.14, 0.07); },
  _shield(ctx) { ln(ctx); ctx.fillStyle = '#a2763e'; ctx.beginPath(); ctx.ellipse(0, -0.08, 0.45, 0.22, 0, 0, 7); ctx.fill(); ctx.stroke(); },
  _fin(ctx) { ln(ctx); ctx.fillStyle = '#2a2d33'; ctx.beginPath(); ctx.moveTo(-0.35, -0.05); ctx.quadraticCurveTo(0, -0.45, 0.4, -0.1); ctx.lineTo(0.1, -0.15); ctx.lineTo(0.15, -0.02); ctx.closePath(); ctx.fill(); ctx.stroke(); },
  _clue(ctx, o) { ln(ctx); ctx.fillStyle = o.n === '파인 땅' ? '#4a3a28' : '#3a3634'; if (o.n === '파인 땅') { for (const d of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(d, -0.1 + d * 0.2, 0.5, 0.1, 0.5, 0, 7); ctx.fill(); ctx.stroke(); } } else { ctx.beginPath(); ctx.ellipse(0, -0.05, 0.9, 0.35, 0, 0, 7); ctx.fill(); } },
  _anvil(ctx) { ln(ctx); ctx.fillStyle = '#5a5856'; ctx.beginPath(); ctx.moveTo(-0.55, -0.9); ctx.lineTo(0.6, -0.9); ctx.quadraticCurveTo(0.3, -0.75, 0.25, -0.6); ctx.lineTo(0.3, 0); ctx.lineTo(-0.3, 0); ctx.lineTo(-0.25, -0.6); ctx.quadraticCurveTo(-0.5, -0.75, -0.55, -0.9); ctx.fill(); ctx.stroke(); },
  _ring(ctx) { ctx.strokeStyle = '#8d8a82'; ctx.lineWidth = 0.08; ctx.beginPath(); ctx.ellipse(0, -0.2, 0.3, 0.2, 0, 0, 7); ctx.stroke(); },
};
function ln(ctx) { ctx.lineWidth = 0.035; ctx.strokeStyle = '#2b2118'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
export function drawPropAt(V, p, t) { V.at(p.x, p.y); if (p.kind.charCodeAt(0) === 95) LOCAL[p.kind](V.ctx, p.o, t); else drawProp(V.ctx, p.kind, p.o, t); }
