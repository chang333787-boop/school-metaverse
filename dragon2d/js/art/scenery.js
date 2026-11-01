/* 「버크의 드래곤 친구」 2D판 — 탑뷰 땅 굽기 + 소품 그림 (scenery.js) · 약속 = docs/dragon/art2d_contract.md v2 §2
   손그림 그림책 결: 종이 #f4ead2 · 먹선 #2b2118(끝이 둥근 손 선 · 굵기 조금씩) · 납작한 수채 칠 + 한 톤 그늘 · 칠이 선에서 살짝 비껴남.
   모든 흔들림은 '미리 정한 값'(타일 좌표·위치 해시)이라 매 프레임 안 바뀐다. 이미지 파일 0 · 외부 네트워크 0 · glow/shadowBlur/필터/화면 전체 합성 0.
   땅·건물은 낮(맑음) 색으로만 그린다 — 밤·안개·노을은 엔진이 화면 전체에 색 한 장을 덮는다. 그림자 타원은 엔진이 그린다(여기선 안 그림).

   ■ bakeChunk(map, cx, cy, N = 16, PX = 48) → 캔버스(N·PX 정사각)
       map = { w, h, kind(tx, ty) } · kind 이름: void grass grass2 path stone sand snow water sea deep wood arena rockfloor plank wall cliff (지도 밖 = 'void')
       이웃을 보고 굽는다: 높은 차례(눈 > 풀 > 풀2 > 바위 바닥 > 길 > 모래)가 낮은 쪽 가장자리를 들쭉날쭉 덮음 · 물가 = 땅쪽 둑 + 물쪽 거품 선 · 깊은 물 > 바다 > 물 경계 ·
       돌/판자/나무/경기장 바닥은 딱딱한 먹선 가장자리 · 'wall'·'cliff' = 남쪽이 열려 있으면 앞면(아래로 떨어지는 면), 아니면 머리(윗면) — 벽 둘레는 2~3칸 두께로 지으면 맨 아래 칸만 면이 된다.
       'wall' 은 남쪽 바닥이 arena/stone 이면 돌벽, 아니면 통나무 벽. 'cliff' 머리 = 풀 얹은 윗면, 면 위 가장자리 = 풀 턱.
       같은 칸은 늘 같게(씨앗 = 타일 좌표) · 가장자리 굴곡은 월드 좌표로 이어져 조각 이음이 안 보인다 · 한 조각(256칸)에 수십 ms(한 번만).
   ■ drawProp(ctx, kind, o, t) — ctx 는 발 자리(앞쪽 밑변 가운데)로 옮겨지고 1단위 = 1m · 위 = −y. 서 있는 부분은 위로, 윗면(지붕·탁자 윗면)은 그 위에 이어서 그림(땅 깊이 d 는 1:1 로 위쪽).
       house{w:6,d:4,burn,scorch,v:0..3,thatch} hall{w:11,d:5,burn,scorch} forge{w:7,d:4 | inside:1} tower well cart barrel{water} crate fence{len,v:1=세로} torch{lit} catapult{ang rad 0=동쪽 π/2=남쪽}
       tree{v} pine{v} broken_tree log{len,v:1} rock{w,h} reed cage{open} barricade{w} net_roof{w,d} shield_rack weapon_pile{n(0=빈 자리)} dock{w,d} ship{w,d} boat seastack{r} cloud{w,h · 기준 = 가운데}
       sand_line{len,v:1=세로(발 자리 = 아래 끝)} nip table{w} hearth{lit} book_stand fish_basket{n,eel} nest_rim{w} board bed anvil · 덤: bush lava_ball ember sheep
       집은 o.v(0~3)로 색·문 자리가 달라진다(안 주면 0). 불꽃은 torch{lit}·hearth{lit} 의 납작한 칠만 소품이 그리고, 나머지 불·김·연기는 엔진.
   ■ PROP_SIZE[kind] = [가로 m, 위쪽 높이 m, (아래쪽 m)] — 소품 대략 크기(보기판용) */

export const INK = '#2b2118';
export const PAPER = '#f4ead2';
/* ───────── 작은 도구 ───────── */
function h1(n) { n = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const RGBC = new Map();
function rgb(h) { let c = RGBC.get(h); if (!c) { const n = parseInt(h.slice(1), 16); c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; RGBC.set(h, c); } return c; }
function toHex(r, g, b) { r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b; return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1); }
function mix(a, b, t) { const A = rgb(a), B = rgb(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
const dk = (h, k) => mix(h, '#2e2748', k === undefined ? 0.22 : k);     /* 그늘 = 보랏빛 남색 쪽으로 */
const lt = (h, k) => mix(h, '#fff4d6', k === undefined ? 0.22 : k);
const q = (v, m) => Math.round(v * m);

/* ───────── 손 선 · 칠 (미리 정한 흔들림) ───────── */
const LW = 0.035;
/* 꺾은선을 잘게 쪼개 옆으로 살짝 흔든다. P = 평평한 [x,y,x,y…] */
function hand(P, seed, amp, step, closed) {
  const out = [], n = P.length >> 1, segs = closed ? n : n - 1; let idx = 0;
  for (let i = 0; i < segs; i++) {
    const ax = P[i * 2], ay = P[i * 2 + 1], j = (i + 1) % n, bx = P[j * 2], by = P[j * 2 + 1];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-6, k = Math.max(1, Math.round(L / step)), nx = -dy / L, ny = dx / L;
    for (let m = 0; m < k; m++) {
      const t = m / k, r = (h1(seed * 131 + idx++) * 2 - 1) * amp * (m === 0 ? 0.55 : 1);
      out.push(ax + dx * t + nx * r, ay + dy * t + ny * r);
    }
  }
  if (!closed) out.push(P[(n - 1) * 2], P[(n - 1) * 2 + 1]);
  return out;
}
function chaikin(P, closed, it) {
  for (let k = 0; k < it; k++) {
    const n = P.length >> 1, o = []; const segs = closed ? n : n - 1;
    if (!closed) o.push(P[0], P[1]);
    for (let i = 0; i < segs; i++) {
      const j = (i + 1) % n, ax = P[i * 2], ay = P[i * 2 + 1], bx = P[j * 2], by = P[j * 2 + 1];
      if (!closed && i === 0) o.push(ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25); else o.push(ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25);
      if (!closed && i === segs - 1) o.push(bx, by); else o.push(ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75);
    }
    P = o;
  }
  return P;
}
function pathFrom(P, closed) {
  const p = new Path2D(); p.moveTo(P[0], P[1]);
  for (let i = 2; i < P.length; i += 2) p.lineTo(P[i], P[i + 1]);
  if (closed) p.closePath(); return p;
}
/* 선을 두 토막 갈래로 나눠 굵기를 번갈아 다르게(손으로 누른 힘 차이) */
function chunks(P, closed, c) {
  const A = new Path2D(), B = new Path2D(), n = P.length >> 1, total = closed ? n + 1 : n;
  let cur = A, w = 0, cnt = 0; cur.moveTo(P[0], P[1]);
  for (let i = 1; i < total; i++) {
    const k = (i % n) * 2; cur.lineTo(P[k], P[k + 1]);
    if (++cnt >= c && i < total - 1) { cnt = 0; w ^= 1; cur = w ? B : A; cur.moveTo(P[k], P[k + 1]); }
  }
  return [A, B];
}
/* 그림 조각 모음 — 한 번 만들어 두고 매 프레임 fill/stroke 만 */
class Rec {
  constructor(seed) { this.s = (seed | 0) * 7919; this.ops = []; this.n = 0; }
  /* 다각형: fill(없으면 선만) · o={lw, amp, step, smooth, closed, shade:[[pts,fill]…], ink, ox, oy} */
  poly(pts, fill, o) {
    o = o || {}; const lw = o.lw === undefined ? LW : o.lw, closed = o.closed !== false, amp = o.amp === undefined ? 0.011 : o.amp, step = o.step || 0.3;
    const seed = this.s + (++this.n) * 17;
    let L = hand(pts, seed, amp, step, closed); if (o.smooth) L = chaikin(L, closed, 2);
    if (fill) {
      let F = hand(pts, seed + 777, amp * 1.7, step, closed); if (o.smooth) F = chaikin(F, closed, 2);
      const ox = o.ox !== undefined ? o.ox : (h1(seed) - 0.35) * 0.05, oy = o.oy !== undefined ? o.oy : (h1(seed + 5) - 0.3) * 0.05;
      for (let i = 0; i < F.length; i += 2) { F[i] += ox; F[i + 1] += oy; }
      this.ops.push({ fill, fp: pathFrom(F, true), la: null, lb: null });
      if (o.shade) for (let s = 0; s < o.shade.length; s++) {
        let S2 = hand(o.shade[s][0], seed + 31 + s, amp, step, true); if (o.smooth) S2 = chaikin(S2, true, 2);
        this.ops.push({ fill: o.shade[s][1], fp: pathFrom(S2, true), la: null, lb: null });
      }
    }
    if (lw > 0) { const ch = chunks(L, closed, 6); this.ops.push({ fill: null, fp: null, la: ch[0], lb: ch[1], lwA: lw * 1.2, lwB: lw * 0.8, ink: o.ink }); }
    return this;
  }
  rect(x0, y0, x1, y1, fill, o) { return this.poly([x0, y0, x1, y0, x1, y1, x0, y1], fill, o); }
  ell(cx, cy, rx, ry, fill, o) {
    const n = Math.max(8, Math.min(14, Math.round((rx + ry) * 9 + 6))), P = []; const ph = h1(this.s + this.n) * 6.28;
    for (let i = 0; i < n; i++) { const a = ph + i / n * 6.2832; P.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
    o = o || {}; if (o.smooth === undefined) o.smooth = true; return this.poly(P, fill, o);
  }
  /* 열린 선 여러 가닥 한 번에: segs = [[x0,y0,x1,y1,…], …] */
  lines(segs, o) {
    o = o || {}; const lw = o.lw === undefined ? LW * 0.7 : o.lw, A = new Path2D(), B = new Path2D(); const seed = this.s + (++this.n) * 17;
    for (let i = 0; i < segs.length; i++) {
      let L = hand(segs[i], seed + i * 3, o.amp === undefined ? 0.008 : o.amp, o.step || 0.35, false); if (o.smooth) L = chaikin(L, false, 2);
      const t = i & 1 ? B : A; t.moveTo(L[0], L[1]); for (let k = 2; k < L.length; k += 2) t.lineTo(L[k], L[k + 1]);
    }
    this.ops.push({ fill: null, fp: null, la: A, lb: B, lwA: lw * 1.2, lwB: lw * 0.8, ink: o.ink }); return this;
  }
  line(pts, o) { return this.lines([pts], o); }
  /* 짧은 빗금 (그늘 쪽 · 나무결 · 바위 결): x0,y0 에서 (dx,dy) 방향으로 n 줄, 줄마다 (sx,sy) 만큼 옮김 */
  hatch(x0, y0, dx, dy, sx, sy, n, o) {
    const segs = []; for (let i = 0; i < n; i++) { const j = (h1(this.s + this.n * 5 + i) - 0.5) * 0.06; segs.push([x0 + sx * i + j, y0 + sy * i, x0 + sx * i + dx + j, y0 + sy * i + dy]); }
    o = o || {}; o.lw = o.lw === undefined ? LW * 0.45 : o.lw; return this.lines(segs, o);
  }
  dots(list, r, ink) { const A = new Path2D(); for (let i = 0; i < list.length; i += 2) { A.moveTo(list[i], list[i + 1]); A.lineTo(list[i] + 0.004, list[i + 1]); } this.ops.push({ fill: null, fp: null, la: A, lb: null, lwA: r || 0.05, ink }); return this; }
}
function runRec(ctx, rec, col, ink, lwm) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; let lf = null, ls = null; const ops = rec.ops;
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op.fp) { const c = col(op.fill); if (c !== lf) { ctx.fillStyle = c; lf = c; } ctx.fill(op.fp); }
    if (op.la) {
      const ic = op.ink ? col(op.ink) : ink; if (ic !== ls) { ctx.strokeStyle = ic; ls = ic; }
      ctx.lineWidth = op.lwA * lwm; ctx.stroke(op.la);
      if (op.lb) { ctx.lineWidth = (op.lwB || op.lwA) * lwm; ctx.stroke(op.lb); }
    }
  }
}


/* 땅·건물은 낮(맑음) 색으로만 — 밤·안개·노을은 엔진이 화면에 색을 덮는다. '!rrggbb' = 불빛 칠(그대로) */
function tc(h) { return h.charCodeAt(0) === 33 ? '#' + h.slice(1) : h; }
/* ───────── 소품 정의 틀 ───────── */
const CACHE = new Map();
const DEF = {};
let IDN = 0;
const EMPTY = {};
function def(kind, size, draw) { DEF[kind] = { id: ++IDN, size, draw }; }
function use(ctx, id, key, build, o) {
  const k = id * 10000000 + key; let r = CACHE.get(k);
  if (r === undefined) { if (CACHE.size > 900) CACHE.clear(); r = build(o); CACHE.set(k, r); }
  runRec(ctx, r, tc, INK, 1);
}

/* ═════════ 소품 그림 (발 자리 = 앞쪽 밑변 가운데 · 1단위 = 1m · 위 = −y) ═════════ */
const WOOD = '#b0804f', WOODD = '#7b5236', STONE = '#9a958a', STONED = '#7d786f', IRON = '#5a626b', CLOTH = '#b5493f', CREAM = '#e8dcb8', LEAF = '#6f9a58';
const PLANK = ['#b0804f', '#c29a62', '#98704a', '#b88e5a'], ROOFC = ['#7a5a46', '#6d5444', '#835f48', '#62695f'];

function headCap(R, x, y, dir, s, col) {
  const P = [0, 0.1, 0.02, -0.12, 0.2, -0.2, 0.42, -0.17, 0.57, -0.05, 0.5, 0.05, 0.3, 0.07, 0.16, 0.15], pts = [];
  for (let i = 0; i < P.length; i += 2) pts.push(x + P[i] * s * dir, y + P[i + 1] * s);
  R.poly(pts, col || '#9a6a42', { lw: 0.026, amp: 0.005, step: 0.2 });
  R.poly([x + 0.08 * s * dir, y - 0.14 * s, x - 0.04 * s * dir, y - 0.5 * s, x + 0.22 * s * dir, y - 0.2 * s], dk(col || '#9a6a42', 0.25), { lw: 0.022, amp: 0.004 });
  R.poly([x + 0.2 * s * dir, y + 0.1 * s, x + 0.52 * s * dir, y + 0.06 * s, x + 0.44 * s * dir, y + 0.2 * s, x + 0.24 * s * dir, y + 0.24 * s], dk(col || '#9a6a42', 0.18), { lw: 0.022, amp: 0.004 });
  R.poly([x + 0.02 * s * dir, y - 0.1 * s, x - 0.16 * s * dir, y - 0.3 * s, x - 0.04 * s * dir, y - 0.02 * s], dk(col || '#9a6a42', 0.25), { lw: 0.02, amp: 0.004 });
  R.lines([[x + 0.46 * s * dir, y + 0.06 * s, x + 0.47 * s * dir, y + 0.12 * s], [x + 0.38 * s * dir, y + 0.07 * s, x + 0.39 * s * dir, y + 0.13 * s]], { lw: 0.014 * s, ink: '#f4ead2' });
  R.dots([x + 0.3 * s * dir, y - 0.09 * s], 0.045 * s);
}

function stoneRows(R, x0, x1, y0, y1, rh, seed) {   /* 돌담 줄눈 */
  const segs = []; let row = 0;
  for (let y = y1 + rh; y < y0 - 0.05; y += rh, row++) {
    segs.push([x0 + 0.03, y, x1 - 0.03, y]);
    const off = (row & 1) * rh * 0.7;
    for (let x = x0 + off + rh * 1.2 + h1(seed + row) * rh; x < x1 - 0.1; x += rh * 1.6 + h1(seed + row * 9 + x) * rh * 0.6) segs.push([x, y, x + (h1(row + x) - 0.5) * 0.04, Math.min(y0, y + rh)]);
  }
  R.lines(segs, { lw: 0.02 });
}

function treeRec(o) {
  const v = (o.v | 0) & 3, R = new Rec(61 + v), gc = ['#6f9a58', '#7ea85c', '#5f8e55', '#8fa95a'][v];
  R.poly([-0.33, 0, -0.2, -1.6, -0.12, -2.4, 0.12, -2.4, 0.2, -1.6, 0.36, 0], '#8b6240', { lw: 0.04, shade: [[[0.04, 0, 0.04, -2.4, 0.12, -2.4, 0.2, -1.6, 0.36, 0], dk('#8b6240', 0.25)]], amp: 0.015 });
  R.lines([[-0.1, -0.1, -0.08, -1.5], [0.08, -0.3, 0.05, -1.8]], { lw: 0.018 });
  R.line([0, -1.9, -0.7, -2.7], { lw: 0.05, ink: '#6b4a30' }); R.line([0.05, -1.7, 0.75, -2.5], { lw: 0.05, ink: '#6b4a30' });
  const bl = [[-1.2, -3.1, 1.2], [1.15, -3.0, 1.15], [0, -4.3, 1.45], [-0.55, -3.7, 1.3], [0.65, -3.8, 1.2]];
  for (const b of bl) R.ell(b[0], b[1], b[2], b[2] * 0.82, dk(gc, 0.22), { lw: 0.035, amp: 0.03, ox: 0.1, oy: 0.12 });
  for (const b of bl) R.ell(b[0] - 0.06, b[1] - 0.08, b[2] * 0.92, b[2] * 0.75, gc, { lw: 0, amp: 0.03 });
  R.ell(-0.5, -4.4, 0.55, 0.3, lt(gc, 0.25), { lw: 0, amp: 0.02 });
  R.hatch(-0.9, -3.0, 0.2, 0.18, 0.3, 0.0, 4);
  return R;
}

function pineRec(o) {
  const v = (o.v | 0) & 3, R = new Rec(71 + v), gc = ['#4a6e4f', '#436a52', '#53754d', '#3f6350'][v];
  R.poly([-0.17, 0, -0.12, -1.0, 0.12, -1.0, 0.17, 0], '#7b5236', { lw: 0.035 });
  const tiers = [[-0.6, 1.25, 1.55], [-1.7, 1.0, 1.5], [-2.7, 0.78, 1.45], [-3.6, 0.55, 1.4]];
  for (let k = 0; k < tiers.length; k++) {
    const y = tiers[k][0], hw = tiers[k][1], hgt = tiers[k][2], P = [0, y - hgt];
    const n = 4; for (let i = 1; i <= n; i++) { const f = i / n; P.push(hw * f, y - hgt * (1 - f) + (i & 1 ? 0.05 : -0.1) + (h1(k * 9 + i) - 0.5) * 0.1); P.push(hw * f * 0.82, y - hgt * (1 - f) + 0.15); }
    P.push(hw * 0.5, y + 0.08, -hw * 0.5, y + 0.08);
    for (let i = n; i >= 1; i--) { const f = i / n; P.push(-hw * f * 0.82, y - hgt * (1 - f) + 0.15); P.push(-hw * f, y - hgt * (1 - f) + (i & 1 ? 0.05 : -0.1) + (h1(k * 9 + i + 40) - 0.5) * 0.1); }
    R.poly(P, gc, { lw: 0.035, amp: 0.012, step: 0.25, shade: [[[0.06, y - hgt, hw * 0.98, y - 0.2, hw * 0.5, y + 0.06, 0.06, y + 0.06], dk(gc, 0.3)]] });
  }
  R.hatch(-0.5, -2.3, 0.14, 0.12, 0.0, 0.5, 3);
  return R;
}

function brokenRec() {
  const R = new Rec(75);
  R.poly([-0.42, 0, -0.3, -1.3, -0.35, -2.3, -0.12, -2.0, -0.05, -2.9, 0.1, -2.1, 0.24, -2.45, 0.3, -1.3, 0.45, 0], '#4d3a30', { lw: 0.045, amp: 0.02, shade: [[[0.0, 0, 0.0, -2.1, 0.1, -2.1, 0.24, -2.45, 0.3, -1.3, 0.45, 0], '#2f2523']] });
  R.lines([[-0.12, -0.1, -0.1, -1.6], [0.1, -0.2, 0.12, -1.7]], { lw: 0.02, ink: '#251c1c' });
  R.poly([0.5, 0, 1.2, -0.12, 1.9, -0.35, 1.95, -0.1, 1.2, 0.0, 0.55, 0.1], '#4d3a30', { lw: 0.04, amp: 0.02 });
  R.line([-0.15, -1.0, -0.8, -1.5], { lw: 0.045, ink: '#4d3a30' });
  return R;
}

function rockRec(o) {
  const w = o.w || 1.6, h = o.h || 1.0, R = new Rec(79 + q(w, 5)), n = 9, P = [], hw = w / 2;
  for (let i = 0; i < n; i++) { const a = Math.PI + i * Math.PI / (n - 1); P.push(Math.cos(a) * hw * (0.92 + 0.1 * h1(i * 5 + q(w, 9))), Math.sin(a) * h * (0.82 + 0.28 * h1(i * 3 + 1 + q(h, 9)))); }
  P.push(hw * 0.92, 0.02, -hw * 0.9, 0.02);
  const mid = [0.05 * hw, -h * 0.95, hw * 0.75, -h * 0.55, hw * 0.92, 0, 0, 0];
  R.poly(P, '#9c968b', { lw: 0.04, amp: 0.015, step: 0.35, shade: [[mid, dk('#9c968b', 0.28)], [[-hw * 0.9, 0, -hw * 0.6, -h * 0.15, 0, -0.05, 0, 0], dk('#9c968b', 0.12)]] });
  R.lines([[-hw * 0.2, -h * 0.85, -hw * 0.05, -h * 0.5, hw * 0.1, -h * 0.4], [-hw * 0.55, -h * 0.4, -hw * 0.4, -h * 0.2]], { lw: 0.022 });
  R.poly([-hw * 0.55, -h * 0.62, -hw * 0.2, -h * 0.9, hw * 0.1, -h * 0.9, -hw * 0.2, -h * 0.65], '#7f9a62', { lw: 0, amp: 0.02, smooth: true });
  return R;
}

function crateRec() {
  const R = new Rec(48);
  R.rect(-0.45, 0, 0.45, -0.9, '#b58a56', { shade: [[[0.2, 0, 0.2, -0.9, 0.45, -0.9, 0.45, 0], dk('#b58a56', 0.2)]] });
  R.rect(-0.4, -0.05, 0.4, -0.85, null, { lw: 0.025 });
  R.lines([[-0.4, -0.05, 0.4, -0.85], [0.4, -0.05, -0.4, -0.85]], { lw: 0.03 });
  R.lines([[-0.45, -0.45, 0.45, -0.45]], { lw: 0.018 });
  return R;
}

function wellRec() {
  const R = new Rec(43);
  R.poly([-0.75, 0, -0.8, -0.85, 0.8, -0.85, 0.75, 0], STONE, { shade: [[[0.3, 0, 0.3, -0.85, 0.8, -0.85, 0.75, 0], dk(STONE, 0.22)]], amp: 0.016 });
  stoneRows(R, -0.78, 0.78, 0, -0.85, 0.26, 7);
  R.rect(-0.85, -0.95, 0.85, -0.85, STONED, { lw: 0.03 });
  R.rect(-0.74, -2.3, -0.62, -0.9, WOOD, { lw: 0.03 }); R.rect(0.62, -2.3, 0.74, -0.9, WOOD, { lw: 0.03 });
  R.poly([-1.0, -2.2, 0, -2.95, 1.0, -2.2, 0.9, -2.08, -0.9, -2.08], ROOFC[1], { lw: 0.032, shade: [[[0.05, -2.9, 1.0, -2.2, 0.35, -2.2], dk(ROOFC[1], 0.2)]] });
  R.line([-0.68, -1.75, 0.68, -1.75], { lw: 0.05, ink: WOODD }); R.line([0.68, -1.75, 0.9, -1.75, 0.9, -1.55], { lw: 0.03 });
  R.line([0, -1.75, 0, -1.2], { lw: 0.02 }); R.poly([-0.17, -1.2, 0.17, -1.2, 0.14, -0.98, -0.14, -0.98], WOOD, { lw: 0.025 });
  return R;
}

function cartRec() {
  const R = new Rec(45);
  R.line([-1.8, -0.55, -0.9, -0.62], { lw: 0.05, ink: WOODD }); R.line([-1.8, -0.5, -0.9, -0.5], { lw: 0.05, ink: WOODD });
  R.poly([-1.1, -0.65, -1.15, -1.3, -0.95, -1.3, -0.75, -0.65], '#c9a85a', { lw: 0.02 });
  R.poly([-1.0, -0.75, -1.0, -1.15, 1.0, -1.15, 1.0, -0.75], '#c9a85a', { lw: 0, amp: 0.03 });
  R.poly([-1.15, -0.55, -1.2, -1.0, 1.2, -1.0, 1.15, -0.55], WOOD, { shade: [[[0.4, -0.55, 0.4, -1.0, 1.2, -1.0, 1.15, -0.55], dk(WOOD, 0.2)]] });
  R.lines([[-0.6, -0.57, -0.6, -0.98], [0, -0.57, 0, -0.98], [0.6, -0.57, 0.6, -0.98]], { lw: 0.02 });
  R.ell(0, -0.52, 0.52, 0.52, '#8e6a44', { lw: 0.05, smooth: true });
  const sp = []; for (let i = 0; i < 8; i++) { const a = i * 0.785; sp.push([0, -0.52, Math.cos(a) * 0.5, -0.52 + Math.sin(a) * 0.5]); } R.lines(sp, { lw: 0.03 });
  R.ell(0, -0.52, 0.09, 0.09, WOODD, { lw: 0.03 });
  R.hatch(-1.05, -0.9, 0.2, -0.1, 0.18, -0.05, 5);
  return R;
}

function shieldRackRec() {
  const R = new Rec(97), cols = ['#b5493f', '#4f7a8f', '#d9b04a', '#6f9a58', '#b5493f'];
  R.line([-1.6, -0.1, -1.55, -1.35], { lw: 0.08, ink: WOODD }); R.line([1.6, -0.1, 1.55, -1.35], { lw: 0.08, ink: WOODD }); R.rect(-1.75, -1.5, 1.75, -1.3, WOOD, { lw: 0.035 }); R.rect(-1.75, -0.55, 1.75, -0.38, WOOD, { lw: 0.035 });
  for (let i = 0; i < 5; i++) { const x = -1.3 + i * 0.65; R.ell(x, -0.95, 0.31, 0.31, cols[i], { lw: 0.04 }); R.ell(x, -0.95, 0.1, 0.1, '#8a8f95', { lw: 0.03 }); R.lines([[x - 0.27, -0.95, x + 0.27, -0.95], [x, -1.22, x, -0.68]], { lw: 0.02 }); }
  return R;
}

function reedRec() {
  const R = new Rec(85), st = [];
  for (let i = 0; i < 6; i++) { const x = -0.35 + i * 0.14, hh = 1.2 + h1(i * 3) * 0.7, bend = (h1(i * 5 + 2) - 0.5) * 0.4; st.push([x, 0, x + bend * 0.3, -hh * 0.6, x + bend, -hh]); }
  R.lines(st, { lw: 0.03, ink: '#6f8a4e', smooth: true });
  for (let i = 1; i < 6; i += 2) { const s = st[i]; R.ell(s[4], s[5] + 0.12, 0.05, 0.14, '#6b4a30', { lw: 0.025 }); }
  const lf = []; for (let i = 0; i < 3; i++) lf.push([-0.2 + i * 0.2, -0.1, -0.5 + i * 0.5, -0.9 - i * 0.05]); R.lines(lf, { lw: 0.025, ink: '#7f9a62', smooth: true });
  return R;
}

function sheepRec() {
  const R = new Rec(113);
  R.lines([[-0.28, -0.35, -0.3, 0], [-0.1, -0.35, -0.1, 0], [0.22, -0.35, 0.22, 0], [0.4, -0.35, 0.4, 0]], { lw: 0.06, ink: '#3d3430' });
  R.poly([-0.55, -0.62, -0.45, -0.95, -0.15, -1.0, 0.1, -1.05, 0.4, -0.95, 0.55, -0.7, 0.5, -0.4, 0.2, -0.3, -0.25, -0.3, -0.5, -0.4], '#f1ead6', { lw: 0.035, smooth: true, amp: 0.02, shade: [[[0.0, -0.3, 0.15, -0.55, 0.52, -0.5, 0.5, -0.4, 0.2, -0.3], '#d5ccb4']] });
  R.poly([0.45, -0.85, 0.7, -0.88, 0.85, -0.7, 0.78, -0.55, 0.55, -0.56], '#4a403a', { lw: 0.03, smooth: true }); R.poly([0.5, -0.88, 0.42, -0.72, 0.56, -0.74], '#4a403a', { lw: 0.02 });
  R.dots([0.72, -0.74], 0.04, '#f4ead2');
  return R;
}

function bookStandRec() {
  const R = new Rec(117);
  R.poly([-0.28, 0, -0.18, -0.95, 0.18, -0.95, 0.28, 0], WOOD, { lw: 0.035, shade: [[[0.0, 0, 0.0, -0.95, 0.18, -0.95, 0.28, 0], dk(WOOD, 0.22)]] });
  R.poly([-0.55, -0.98, -0.5, -1.08, 0.55, -1.2, 0.6, -1.1], '#8e6a44', { lw: 0.035 });
  R.poly([-0.5, -1.1, -0.04, -1.2, -0.04, -1.55, -0.5, -1.42], '#f1e7c7', { lw: 0.03 }); R.poly([0.04, -1.2, 0.5, -1.1, 0.5, -1.42, 0.04, -1.55], '#e9dfba', { lw: 0.03 });
  R.lines([[-0.42, -1.2, -0.12, -1.26], [-0.42, -1.28, -0.12, -1.34], [-0.4, -1.35, -0.14, -1.4], [0.12, -1.27, 0.42, -1.2], [0.12, -1.35, 0.42, -1.28]], { lw: 0.014 });
  R.dots([0.28, -1.38], 0.06, '#b5493f');
  return R;
}

function bedRec() {
  const R = new Rec(119);
  R.rect(-1.25, -0.2, -1.1, 0, WOODD, { lw: 0.03 }); R.rect(1.1, -0.2, 1.25, 0, WOODD, { lw: 0.03 });
  R.poly([-1.3, -0.2, -1.3, -0.5, 1.3, -0.5, 1.3, -0.2], WOOD, { lw: 0.04, shade: [[[-1.3, -0.35, -1.3, -0.5, 1.3, -0.5, 1.3, -0.35], dk(WOOD, 0.2)]] });
  R.poly([-1.3, -0.5, -1.3, -1.25, -1.15, -1.25, -1.15, -0.5], WOOD, { lw: 0.035 }); R.ell(-1.22, -1.32, 0.1, 0.1, '#9a6a42', { lw: 0.03 });
  R.poly([-1.15, -0.5, -1.15, -0.7, 1.28, -0.7, 1.28, -0.5], '#d6c08a', { lw: 0.03, amp: 0.02 });
  R.poly([-0.2, -0.69, 1.25, -0.69, 1.3, -0.82, 1.1, -0.9, 0.7, -0.86, 0.3, -0.92, -0.2, -0.84], '#7e5c46', { lw: 0.035, amp: 0.02, shade: [[[0.5, -0.69, 1.25, -0.69, 1.3, -0.82, 1.1, -0.9, 0.7, -0.86], dk('#7e5c46', 0.25)]] });
  R.lines([[0.0, -0.76, 0.2, -0.8], [0.5, -0.74, 0.7, -0.8], [0.9, -0.74, 1.1, -0.8]], { lw: 0.02, ink: '#4d3a30' });
  R.poly([-1.1, -0.7, -1.0, -0.95, -0.4, -0.95, -0.3, -0.7], '#eadfbf', { lw: 0.03, smooth: true });
  return R;
}

function boardRec() {
  const R = new Rec(121);
  R.line([-0.7, 0, -0.7, -1.8], { lw: 0.1, ink: WOODD }); R.line([0.7, 0, 0.7, -1.8], { lw: 0.1, ink: WOODD });
  R.poly([-0.95, -1.1, -0.95, -2.15, 0.95, -2.15, 0.95, -1.1], '#a37448', { lw: 0.04, shade: [[[-0.95, -1.1, -0.95, -1.28, 0.95, -1.28, 0.95, -1.1], dk('#a37448', 0.2)]] });
  R.poly([-1.1, -2.15, 0, -2.6, 1.1, -2.15], ROOFC[0], { lw: 0.035 });
  R.poly([-0.8, -1.35, -0.8, -1.95, -0.2, -1.95, -0.2, -1.38], '#efe5c4', { lw: 0.022, amp: 0.008 });
  R.poly([0.05, -1.4, 0.05, -1.75, 0.5, -1.72, 0.5, -1.4], '#eadfbf', { lw: 0.022, amp: 0.008 });
  R.poly([0.2, -1.78, 0.2, -2.05, 0.7, -2.05, 0.7, -1.78], '#f1e7c7', { lw: 0.022, amp: 0.008 });
  R.lines([[-0.7, -1.5, -0.3, -1.52], [-0.7, -1.65, -0.3, -1.67], [-0.7, -1.8, -0.4, -1.8], [0.12, -1.5, 0.42, -1.5], [0.12, -1.62, 0.4, -1.6], [0.3, -1.9, 0.6, -1.9]], { lw: 0.014 });
  R.dots([-0.5, -1.92, 0.27, -1.43, 0.45, -2.02], 0.07, CLOTH);
  return R;
}

function anvilRec() {
  const R = new Rec(129);
  R.poly([-0.3, 0, -0.27, -0.55, 0.27, -0.55, 0.3, 0], '#8e6a44', { lw: 0.04, shade: [[[0.0, 0, 0.0, -0.55, 0.27, -0.55, 0.3, 0], dk('#8e6a44', 0.22)]] });
  R.ell(0, -0.55, 0.27, 0.05, '#a37448', { lw: 0.025 });
  R.poly([-0.28, -0.6, -0.2, -0.67, 0.2, -0.67, 0.3, -0.75, 0.34, -0.9, -0.24, -0.9, -0.55, -0.82, -0.62, -0.78, -0.5, -0.7], '#6b747d', { lw: 0.04, shade: [[[0.0, -0.67, 0.2, -0.67, 0.3, -0.75, 0.34, -0.9, 0.0, -0.9], '#555c64']], amp: 0.008 });
  return R;
}

function bushRec() {
  const R = new Rec(131);
  const bl = [[-0.4, -0.42, 0.42], [0.1, -0.55, 0.5], [0.5, -0.38, 0.38]];
  for (const b of bl) R.ell(b[0], b[1], b[2], b[2] * 0.85, dk('#6f9a58', 0.22), { lw: 0.035, amp: 0.02, ox: 0.06, oy: 0.07 });
  for (const b of bl) R.ell(b[0] - 0.03, b[1] - 0.05, b[2] * 0.9, b[2] * 0.75, '#6f9a58', { lw: 0, amp: 0.02 });
  R.dots([-0.3, -0.5, 0.1, -0.75, 0.45, -0.4, -0.05, -0.38], 0.07, '#b5493f');
  return R;
}

function towerRec() {
  const R = new Rec(41);
  R.poly([-1.1, 0, -0.55, -5.2, -0.3, -5.2, -0.8, 0], WOOD, { lw: 0.03 }); R.poly([1.1, 0, 0.55, -5.2, 0.3, -5.2, 0.8, 0], WOOD, { lw: 0.03 });
  R.lines([[-0.95, -1.2, 0.95, -2.5], [0.95, -1.2, -0.95, -2.5], [-0.78, -2.8, 0.78, -4.0], [0.78, -2.8, -0.78, -4.0]], { lw: 0.05, ink: WOODD });
  R.rect(-0.9, -2.7, 0.9, -2.6, WOOD, { lw: 0.025 }); R.rect(-0.75, -4.1, 0.75, -4.0, WOOD, { lw: 0.025 });
  R.poly([-1.2, -5.2, -1.2, -5.5, 1.2, -5.5, 1.2, -5.2], '#a37448', { lw: 0.035, shade: [[[-1.2, -5.35, -1.2, -5.5, 1.2, -5.5, 1.2, -5.35], dk('#a37448', 0.2)]] });
  R.poly([-1.1, -5.5, -1.1, -6.35, 1.1, -6.35, 1.1, -5.5], '#9a6e44', { lw: 0.03, shade: [[[0.5, -5.5, 0.5, -6.35, 1.1, -6.35, 1.1, -5.5], dk('#9a6e44', 0.2)]] });
  const rl = []; for (let x = -0.85; x < 1; x += 0.4) rl.push([x, -5.5, x, -6.3]); R.lines(rl, { lw: 0.02 });
  R.poly([-1.5, -6.3, 0, -7.7, 1.5, -6.3, 1.35, -6.15, -1.35, -6.15], ROOFC[0], { lw: 0.035, shade: [[[0.1, -7.5, 1.5, -6.3, 0.5, -6.3], dk(ROOFC[0], 0.2)]] });
  R.line([0, -7.7, 0, -8.5], { lw: 0.04 }); R.poly([0, -8.5, 0.55, -8.3, 0, -8.1], CLOTH, { lw: 0.025 });
  R.line([-0.6, -2.7, -0.6, -5.2], { lw: 0.02 });
  return R;
}

function lavaRec() {
  const R = new Rec(123);
  R.ell(0, -0.42, 0.42, 0.4, '#4a3a38', { lw: 0.045, smooth: true, amp: 0.025, shade: [[[0.1, -0.05, 0.38, -0.35, 0.28, -0.7, 0.05, -0.8, 0.2, -0.4], '#2f2523']] });
  R.poly([-0.3, -0.55, -0.12, -0.45, -0.02, -0.62, 0.12, -0.35, 0.05, -0.2, -0.1, -0.3, -0.22, -0.28], '!d8501f', { lw: 0, amp: 0.02, step: 0.12 });
  R.poly([-0.12, -0.5, 0, -0.45, 0.02, -0.55, -0.02, -0.38, -0.1, -0.38], '!f9c05a', { lw: 0, amp: 0.01, step: 0.1 });
  R.poly([0.1, -0.7, 0.22, -0.62, 0.3, -0.5, 0.2, -0.55], '!d8501f', { lw: 0, step: 0.1 });
  return R;
}

function emberRec() {
  const R = new Rec(125);
  R.poly([-0.17, 0, -0.2, -0.17, -0.07, -0.3, 0.12, -0.28, 0.2, -0.12, 0.15, 0], '#4a3a38', { lw: 0.03, amp: 0.01, step: 0.1 });
  R.poly([-0.08, -0.07, -0.02, -0.2, 0.08, -0.12, 0.02, -0.04], '!f08a3c', { lw: 0, step: 0.08 });
  return R;
}

function torchRec() {
  const R = new Rec(53);
  R.poly([-0.05, 0, -0.04, -1.6, 0.04, -1.6, 0.05, 0], WOODD, { lw: 0.03, amp: 0.005 });
  R.poly([-0.16, -1.55, -0.12, -1.85, 0.12, -1.85, 0.16, -1.55], IRON, { lw: 0.03 });
  R.lines([[-0.14, -1.7, 0.14, -1.7]], { lw: 0.02 });
  return R;
}

function barrelRec() {
  const R = new Rec(47);
  R.poly([-0.36, 0, -0.42, -0.35, -0.4, -0.7, -0.33, -1.0, 0.33, -1.0, 0.4, -0.7, 0.42, -0.35, 0.36, 0], '#a37448', { shade: [[[0.12, 0, 0.12, -1.0, 0.33, -1.0, 0.4, -0.7, 0.42, -0.35, 0.36, 0], dk('#a37448', 0.22)]], amp: 0.008 });
  R.lines([[-0.14, -0.02, -0.15, -0.98], [0.12, -0.02, 0.13, -0.98]], { lw: 0.018 });
  R.lines([[-0.4, -0.25, 0.4, -0.25], [-0.42, -0.78, 0.42, -0.78]], { lw: 0.05, ink: IRON });
  R.ell(0, -1.0, 0.33, 0.07, '#8b623c', { lw: 0.03 });
  return R;
}

function weaponPileRec(o) {
  const n = Math.max(1, Math.min(8, o.n === undefined ? 5 : Math.round(o.n))), R = new Rec(99), it = [
    () => { R.line([-0.6, -0.1, 0.15, -1.1], { lw: 0.06, ink: WOODD }); R.poly([0.0, -1.0, 0.35, -1.12, 0.45, -0.85, 0.25, -0.7, 0.08, -0.75], '#9aa3ab', { lw: 0.03 }); },
    () => { R.line([0.7, -0.1, -0.1, -0.95], { lw: 0.06, ink: WOODD }); R.poly([-0.28, -1.0, -0.62, -1.1, -0.65, -0.85, -0.45, -0.72, -0.15, -0.8], '#9aa3ab', { lw: 0.03 }); },
    () => { R.poly([-0.5, -0.1, -0.45, -0.25, 0.7, -0.5, 0.85, -0.38, 0.9, -0.3], '#c3c9ce', { lw: 0.03 }); R.line([-0.55, -0.25, -0.7, -0.15], { lw: 0.09, ink: WOODD }); },
    () => { R.line([-0.2, -0.1, 0.3, -0.75], { lw: 0.07, ink: WOODD }); R.rect(0.1, -0.95, 0.55, -0.62, '#7d868e', { lw: 0.035 }); },
    () => { R.ell(0.65, -0.28, 0.32, 0.32, '#4f7a8f', { lw: 0.04 }); R.ell(0.65, -0.28, 0.08, 0.08, '#8a8f95', { lw: 0.025 }); },
    () => { R.ell(-0.7, -0.2, 0.26, 0.2, '#6e6a62', { lw: 0.035 }); R.line([-0.7, -0.2, -0.2, -0.6], { lw: 0.05, ink: WOODD }); },
    () => { R.line([0.95, -0.05, 0.6, -0.9], { lw: 0.06, ink: WOODD }); R.poly([0.5, -0.85, 0.2, -1.0, 0.18, -0.78, 0.38, -0.66], '#9aa3ab', { lw: 0.03 }); },
    () => { R.poly([-0.9, -0.05, -0.2, -0.3, 0.2, -0.05], '#8e6a44', { lw: 0.035 }); },
  ];
  R.ell(0, -0.04, 1.2, 0.1, '#7d786f', { lw: 0, smooth: true });
  for (let i = 0; i < n; i++) it[i]();
  return R;
}

def('tree', [3.6, 5.8], (ctx, o, t, id) => use(ctx, id, (o.v | 0) & 3, treeRec, o));
def('pine', [2.9, 5.2], (ctx, o, t, id) => use(ctx, id, (o.v | 0) & 3, pineRec, o));
def('broken_tree', [3.4, 3.2], (ctx, o, t, id) => use(ctx, id, 1, brokenRec, o));
def('rock', [1.6, 1.1], (ctx, o, t, id) => use(ctx, id, q(o.w || 1.6, 10) * 100 + q(o.h || 1, 10), rockRec, o));
def('crate', [0.95, 0.95], (ctx, o, t, id) => use(ctx, id, 1, crateRec, o));
def('well', [2, 3], (ctx, o, t, id) => use(ctx, id, 1, wellRec, o));
def('cart', [3.2, 1.5], (ctx, o, t, id) => use(ctx, id, 1, cartRec, o));
def('shield_rack', [3.6, 1.6], (ctx, o, t, id) => use(ctx, id, 1, shieldRackRec, o));
def('reed', [1, 2], (ctx, o, t, id) => use(ctx, id, 1, reedRec, o));
def('sheep', [1.7, 1.2], (ctx, o, t, id) => use(ctx, id, 1, sheepRec, o));
def('book_stand', [1.2, 1.7], (ctx, o, t, id) => use(ctx, id, 1, bookStandRec, o));
def('bed', [2.8, 1.5], (ctx, o, t, id) => use(ctx, id, 1, bedRec, o));
def('board', [2.2, 2.7], (ctx, o, t, id) => use(ctx, id, 1, boardRec, o));
def('anvil', [1.3, 1], (ctx, o, t, id) => use(ctx, id, 1, anvilRec, o));
def('bush', [1.7, 1], (ctx, o, t, id) => use(ctx, id, 1, bushRec, o));
def('lava_ball', [1, 1], (ctx, o, t, id) => use(ctx, id, 1, lavaRec, o));
def('ember', [0.5, 0.4], (ctx, o, t, id) => use(ctx, id, 1, emberRec, o));
def('torch', [0.5, 2.5], (ctx, o, t, id) => {
  use(ctx, id, 1, torchRec, o);
  const lit = o.lit === undefined ? 1 : o.lit; if (lit <= 0.02) return;
  const fl = 1 + Math.sin(t * 9 + 1) * 0.07 + Math.sin(t * 5.3) * 0.05, hh = (0.5 + 0.35 * lit) * fl;
  ctx.fillStyle = '#c9501f'; ctx.strokeStyle = INK; ctx.lineWidth = 0.025; ctx.beginPath();
  ctx.moveTo(-0.13, -1.85); ctx.quadraticCurveTo(-0.2, -1.85 - hh * 0.5, -0.04, -1.85 - hh); ctx.quadraticCurveTo(0.02, -1.85 - hh * 0.55, 0.12, -1.85 - hh * 0.72); ctx.quadraticCurveTo(0.24, -1.85 - hh * 0.3, 0.13, -1.85); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f6a63c'; ctx.beginPath(); ctx.moveTo(-0.07, -1.87); ctx.quadraticCurveTo(-0.08, -1.87 - hh * 0.4, 0.01, -1.87 - hh * 0.62); ctx.quadraticCurveTo(0.1, -1.87 - hh * 0.3, 0.07, -1.87); ctx.fill();
  ctx.fillStyle = '#f9d77a'; ctx.beginPath(); ctx.moveTo(-0.03, -1.88); ctx.quadraticCurveTo(0, -1.88 - hh * 0.3, 0.03, -1.88); ctx.fill();
});


def('barrel', [0.9, 1.1], (ctx, o, t, id) => {
  use(ctx, id, 1, barrelRec, o);
  if (o.water) { ctx.fillStyle = '#6fb0c4'; ctx.beginPath(); ctx.ellipse(0, -1.0, 0.27, 0.05, 0, 0, 6.3); ctx.fill(); }
});
def('weapon_pile', [2.2, 1.3], (ctx, o, t, id) => { if (o.n === 0) return; use(ctx, id, o.n === undefined ? 5 : Math.round(o.n), weaponPileRec, o); });

/* ═════════ 탑뷰 소품 — 앞면(서 있는 모습) + 윗면(위에서 본 면) ═════════
   발 자리 = 앞쪽 밑변 가운데 · 땅 깊이 d 는 화면 위(−y)로 1:1 · 높이 H 만큼 더 위로 */
const WIN = '#ecd27e';
function bowl(R, x, y, r, c) { R.ell(x, y, r, r * 0.6, c, { lw: 0.022, amp: 0.004 }); }

/* 집 */
function hGeom(o, big) {
  const w = o.w || (big ? 11 : 6), d = o.d || (big ? 5 : 4), H = big ? 2.7 : 2.0, hw = w / 2, ew = hw + 0.38, rise = big ? 1.5 : 1.15;
  return { w, d, H, hw, ew, ewb: ew - 0.25, rise, yE: -H + 0.28, yR: -H - d / 2 - rise, yB: -H - d - 0.12 };
}
function shingles(R, G, th, big) {
  const { yR, yE, ew } = G, n = th ? 8 : 6, rr = (yE - yR) / (n + 0.6), segs = [];
  for (let k = 1; k <= n; k++) {
    const y = yR + k * rr;
    if (!th) { segs.push([-ew + 0.05, y, ew - 0.05, y]); for (let x = -ew + 0.3 + (k & 1) * 0.3; x < ew - 0.1; x += 0.6) segs.push([x, y, x, y - rr]); }
    else for (let x = -ew + 0.1; x < ew - 0.05; x += 0.32) segs.push([x, y - rr * 0.9, x + 0.1 + h1(x * 9 + k) * 0.06, y + 0.04]);
  }
  R.lines(segs, { lw: th ? 0.016 : 0.02, ink: th ? '#7a5e2c' : undefined });
}
function rowTone(R, G, rc, th) {      /* 기와 줄마다 살짝 다른 톤(납작한 칠) */
  const { yR, yE, ew } = G, n = th ? 8 : 6, rr = (yE - yR) / (n + 0.6);
  for (let k = 1; k <= n; k += 2) R.rect(-ew + 0.03, yR + k * rr, ew - 0.03, yR + (k + 1) * rr, dk(rc, 0.07), { lw: 0, amp: 0.004 });
}
function chimney(R, G, v) {
  const { yR, yE, ew } = G, x = [1.6, -1.8, 1.0, -1.4][v], y1 = yR + (yE - yR) * 0.62, y0 = y1 - 1.5;
  R.rect(x - 0.38, y0, x + 0.38, y1, '#8f897e', { lw: 0.04, shade: [[[x + 0.05, y0, x + 0.38, y0, x + 0.38, y1, x + 0.05, y1], dk('#8f897e', 0.22)]] }); stoneRows(R, x - 0.38, x + 0.38, y1, y0, 0.3, 4 + v);
  R.poly([x - 0.46, y0, x - 0.38, y0 - 0.34, x + 0.38, y0 - 0.34, x + 0.46, y0], '#a8a398', { lw: 0.035 }); R.rect(x - 0.24, y0 - 0.3, x + 0.24, y0 - 0.12, '#2a1e1b', { lw: 0.02 });
}
function houseRec(o) {
  const G = hGeom(o, false), { w, hw, ew, ewb, yE, yR, yB, H } = G, v = (o.v | 0) & 3, th = !!o.thatch, R = new Rec(11 + v);
  const wc = PLANK[v], rc = th ? '#c9a95c' : ROOFC[v];
  R.poly([-ewb, yB, ewb, yB, ew, yR, -ew, yR], dk(rc, 0.24), { lw: 0.035, step: 0.5, amp: 0.014 });
  R.rect(-hw - 0.06, -0.34, hw + 0.06, 0, STONE, { lw: 0.03 }); stoneRows(R, -hw - 0.06, hw + 0.06, 0, -0.34, 0.17, v + 3);
  R.poly([-hw, -0.32, -hw, -H, hw, -H, hw, -0.32], wc, { shade: [[[hw - 0.6, -0.32, hw - 0.6, -H, hw, -H, hw, -0.32], dk(wc, 0.2)], [[-hw, -0.32, -hw, -0.62, hw, -0.62, hw, -0.32], dk(wc, 0.12)]] });
  const pl = []; for (let x = -hw + 0.45; x < hw - 0.1; x += 0.5 + h1(v * 7 + x) * 0.05) pl.push([x, -0.34, x + (h1(x * 3) - 0.5) * 0.04, -H + 0.02]); R.lines(pl, { lw: 0.02 });
  const dx = [-0.1, 0.5, -0.42, 0.22][v] * hw;
  R.poly([dx - 0.46, -0.32, dx - 0.46, -1.2, dx - 0.33, -1.46, dx, -1.58, dx + 0.33, -1.46, dx + 0.46, -1.2, dx + 0.46, -0.32], '#5e3f2c', { lw: 0.04, shade: [[[dx + 0.14, -0.32, dx + 0.14, -1.54, dx + 0.33, -1.46, dx + 0.46, -1.2, dx + 0.46, -0.32], '#4b3224']] });
  R.lines([[dx - 0.44, -0.58, dx + 0.44, -0.6], [dx - 0.44, -1.08, dx + 0.44, -1.06]], { lw: 0.03, ink: '#3a2f2f' }); R.dots([dx + 0.28, -0.84], 0.07);
  for (const wx of [[hw * 0.62, -hw * 0.6, hw * 0.55, -hw * 0.65][v], [-hw * 0.62, hw * 0.6, -hw * 0.55, hw * 0.65][v]]) {
    if (Math.abs(wx - dx) < 1.0) continue;
    R.rect(wx - 0.32, -1.7, wx + 0.32, -1.08, WIN, { lw: 0.04, amp: 0.006 }); R.lines([[wx, -1.7, wx, -1.08], [wx - 0.32, -1.39, wx + 0.32, -1.39]], { lw: 0.025 });
    R.rect(wx - 0.56, -1.72, wx - 0.32, -1.06, dk(wc, 0.3), { lw: 0.025 }); R.rect(wx + 0.32, -1.72, wx + 0.56, -1.06, dk(wc, 0.3), { lw: 0.025 });
  }
  R.poly([-ew, yR, ew, yR, ew + 0.06, yE, -ew - 0.06, yE], rc, { lw: 0.04, step: 0.5, amp: 0.014, shade: [[[ew * 0.2, yR, ew, yR, ew + 0.06, yE, ew * 0.2, yE], dk(rc, th ? 0.12 : 0.18)]] });
  rowTone(R, G, rc, th);
  shingles(R, G, th, false);
  chimney(R, G, v);
  R.rect(-ew - 0.08, yE, ew + 0.08, yE + 0.17, dk(rc, 0.32), { lw: 0.03, amp: 0.006 });
  R.rect(-hw, yE + 0.17, hw, yE + 0.44, dk(wc, 0.42), { lw: 0, amp: 0 });
  R.line([-ew - 0.06, yR, ew + 0.06, yR], { lw: 0.1, ink: WOODD, amp: 0.006 });
  headCap(R, -ew - 0.02, yR - 0.04, -1, 0.95, '#9a6a42'); headCap(R, ew + 0.02, yR - 0.04, 1, 0.95, '#9a6a42');
  return R;
}
function burnRec(o) {
  const G = hGeom(o, !!o.big), { ew, ewb, yE, yR, yB } = G, b = q(o.burn, 6) / 6, R = new Rec(51);
  const ff = Math.min(1, b * 1.25), fd = (yE - yR) * ff, bd = (yR - yB) * Math.min(1, b * 3);
  const rag = (x0, x1, y, n, s) => { const P = []; for (let i = 0; i <= n; i++) P.push(x0 + (x1 - x0) * i / n, y + (h1(i * 5 + s) - 0.3) * 0.34 * (i & 1 ? 1 : 0.4)); return P; };
  { const fr = Math.min(1, b * 3), yBc = yR - (yR - yB) * fr, wBc = ew - (ew - ewb) * fr; R.poly([-ew, yR, ew, yR, wBc, yBc, -wBc, yBc], '#352a2b', { lw: 0.03, amp: 0.02, step: 0.5 }); }
  const fp = [-ew, yR, ew, yR]; const bot = rag(ew + 0.04 * ff, -ew - 0.04 * ff, yR + fd, 12, 7); fp.push(...bot);
  R.poly(fp, '#3a2d2d', { lw: 0.03, amp: 0.02, step: 0.3 });
  const ribs = []; for (let i = -3; i <= 3; i++) ribs.push([i * 0.9, yR + 0.04, i * 0.9 * 1.05, yR + fd - 0.06]); R.lines(ribs, { lw: 0.04, ink: '#1c1514' });
  const n = 4 + Math.round(b * 7); for (let i = 0; i < n; i++) {
    const cx = -ew * 0.9 + 1.8 * ew * 0.9 * (i + 0.5) / n, cy = yR + 0.3 + (fd - 0.3) * (0.3 + 0.7 * h1(i * 11 + 4)), s = 0.12 + 0.2 * h1(i * 7 + 1);
    R.poly([cx - s, cy, cx - s * 0.2, cy - s * 1.1, cx + s * 0.6, cy - s * 0.3, cx + s, cy + s * 0.3, cx, cy + s * 0.5], '!c4431f', { lw: 0, amp: 0.01 });
    R.poly([cx - s * 0.5, cy, cx, cy - s * 0.6, cx + s * 0.4, cy, cx, cy + s * 0.25], '!f08a3c', { lw: 0, amp: 0.006 });
  }
  if (b > 0.7) R.poly([-0.9, yR + fd * 0.5, -0.4, yR + fd * 0.3, 0.5, yR + fd * 0.35, 1.0, yR + fd * 0.65, 0, yR + fd * 0.85], '#1e1517', { lw: 0.02 });
  return R;
}
function scorchRec(o) {
  const G = hGeom(o, !!o.big), { w, hw, H } = G, v = (o.v | 0) & 3, s = q(o.scorch, 6) / 6, R = new Rec(61), dx = [-0.1, 0.5, -0.42, 0.22][v] * hw, k = 0.35 + 0.65 * s;
  R.poly([dx - 0.55 * k, -1.2, dx - 0.75 * k, -1.7, dx - 0.4 * k, -H + 0.2, dx + 0.1, -H + 0.1, dx + 0.65 * k, -H + 0.3, dx + 0.75 * k, -1.5, dx + 0.5 * k, -1.2], '#3a2d2a', { lw: 0, smooth: true, amp: 0.03 });
  R.poly([-hw, -0.32, -hw + 0.8 * k, -0.9 * k - 0.32, -hw + 1.6 * k, -0.5, -hw + 2 * k, -0.32], '#43352f', { lw: 0, amp: 0.03 });
  R.poly([hw, -0.32, hw - 0.7 * k, -1.0 * k - 0.32, hw - 1.3 * k, -0.32], '#43352f', { lw: 0, amp: 0.03 });
  return R;
}
def('house', [8.2, 8.6], (ctx, o, t, id) => {
  const w = o.w || 6, v = (o.v | 0) & 3, th = o.thatch ? 1 : 0, kw = q(w, 4) * 8 + q(o.d || 4, 2);
  use(ctx, id, ((kw * 4 + v) * 2 + th), houseRec, o);
  if (o.scorch > 0.02) use(ctx, id, 1000000 + kw * 100 + v * 10 + q(o.scorch, 6), scorchRec, o);
  if (o.burn > 0.02) use(ctx, id, 2000000 + kw * 100 + q(o.burn, 6), burnRec, o);
});

/* 큰 회관 */
function hallRec(o) {
  const G = hGeom(o, true), { w, hw, ew, ewb, yE, yR, yB, H } = G, R = new Rec(31), rc = '#6a4e3c', wc = '#946a44';
  R.poly([-ewb, yB, ewb, yB, ew, yR, -ew, yR], dk(rc, 0.24), { lw: 0.04, step: 0.5, amp: 0.014 });
  R.rect(-hw - 0.08, -0.4, hw + 0.08, 0, STONE, { lw: 0.03 }); stoneRows(R, -hw - 0.08, hw + 0.08, 0, -0.4, 0.2, 5);
  R.poly([-hw, -0.38, -hw, -H, hw, -H, hw, -0.38], wc, { shade: [[[hw - 0.9, -0.38, hw - 0.9, -H, hw, -H, hw, -0.38], dk(wc, 0.2)], [[-hw, -0.38, -hw, -0.7, hw, -0.7, hw, -0.38], dk(wc, 0.12)]] });
  const pl = []; for (let x = -hw + 0.5; x < hw - 0.1; x += 0.55) pl.push([x, -0.4, x + (h1(x * 3) - 0.5) * 0.04, -H + 0.02]); R.lines(pl, { lw: 0.02 });
  for (const x of [-hw, -hw * 0.5, hw * 0.5, hw]) R.rect(x - 0.18, -H, x + 0.18, -0.36, WOOD, { lw: 0.035, shade: [[[x + 0.02, -H, x + 0.18, -H, x + 0.18, -0.36, x + 0.02, -0.36], dk(WOOD, 0.22)]] });
  const cols = ['#b5493f', '#4f7a8f', '#d9b04a', '#6f9a58'];
  for (let i = 0; i < 4; i++) { const x = [-hw * 0.78, -hw * 0.3, hw * 0.3, hw * 0.78][i]; R.ell(x, -1.55, 0.42, 0.42, cols[i], { lw: 0.035 }); R.ell(x, -1.55, 0.09, 0.09, '#8a8f95', { lw: 0.025 }); R.lines([[x - 0.4, -1.55, x + 0.4, -1.55], [x, -1.95, x, -1.15]], { lw: 0.02 }); }
  R.poly([-ew, yR, ew, yR, ew + 0.06, yE, -ew - 0.06, yE], rc, { lw: 0.04, step: 0.5, amp: 0.014, shade: [[[ew * 0.2, yR, ew, yR, ew + 0.06, yE, ew * 0.2, yE], dk(rc, 0.18)]] });
  shingles(R, G, false, true);
  R.rect(-ew - 0.08, yE, ew + 0.08, yE + 0.18, dk(rc, 0.32), { lw: 0.03, amp: 0.006 }); R.rect(-hw, yE + 0.18, hw, yE + 0.46, dk(wc, 0.42), { lw: 0, amp: 0 });
  R.line([-ew - 0.06, yR, ew + 0.06, yR], { lw: 0.12, ink: WOODD, amp: 0.006 });
  headCap(R, -ew - 0.02, yR - 0.05, -1, 1.15, '#a07048'); headCap(R, ew + 0.02, yR - 0.05, 1, 1.15, '#a07048');
  /* 현관 박공 + 큰 문 */
  R.rect(-1.5, -2.5, 1.5, -0.4, '#8e6240', { lw: 0.045, shade: [[[0.6, -2.5, 1.5, -2.5, 1.5, -0.4, 0.6, -0.4], '#6e4d34']] });
  R.lines([[-0.7, -2.4, -0.7, -0.45], [0, -2.4, 0, -0.45], [0.7, -2.4, 0.7, -0.45]], { lw: 0.025 });
  R.lines([[-1.5, -0.95, 1.5, -0.95], [-1.5, -1.9, 1.5, -1.9]], { lw: 0.07, ink: IRON }); R.ell(-0.22, -1.4, 0.1, 0.1, null, { lw: 0.035 }); R.ell(0.22, -1.4, 0.1, 0.1, null, { lw: 0.035 });
  R.poly([-2.0, -2.5, 0, -4.1, 2.0, -2.5, 1.85, -2.35, -1.85, -2.35], '#7a5846', { lw: 0.045, shade: [[[0.1, -4.0, 2.0, -2.5, 0.5, -2.5], dk('#7a5846', 0.2)]] });
  R.line([-1.5, -2.55, 0, -3.95, 1.5, -2.55], { lw: 0.08, ink: WOODD, smooth: false });
  headCap(R, 0, -4.05, 1, 0.8, '#a07048');
  return R;
}
def('hall', [13.5, 10], (ctx, o, t, id) => {
  const w = o.w || 11, kw = q(w, 2) * 8 + q(o.d || 5, 2);
  use(ctx, id, kw, hallRec, o);
  if (o.scorch > 0.02) use(ctx, id, 1000000 + kw * 100 + q(o.scorch, 6), scorchRec, { w, d: o.d || 5, big: 1, scorch: o.scorch });
  if (o.burn > 0.02) use(ctx, id, 2000000 + kw * 100 + q(o.burn, 6), burnRec, { w, d: o.d || 5, big: 1, burn: o.burn });
});

/* 대장간: 밖(w,d) · 안(inside:1 — 북쪽 벽에 붙은 화덕) */
function forgeRec(o) {
  const R = new Rec(21);
  if (o.inside) {
    R.rect(-1.25, -2.4, 1.25, 0, '#8a857a', { lw: 0.045, shade: [[[0.55, -2.4, 1.25, -2.4, 1.25, 0, 0.55, 0], dk('#8a857a', 0.22)]] }); stoneRows(R, -1.25, 1.25, 0, -2.4, 0.34, 4);
    R.poly([-1.35, -2.4, -1.15, -3.45, 1.15, -3.45, 1.35, -2.4], '#a09a8d', { lw: 0.045, shade: [[[0.2, -3.45, 1.15, -3.45, 1.35, -2.4, 0.2, -2.4], dk('#a09a8d', 0.2)]] });
    R.poly([-0.55, -2.55, -0.55, -3.25, 0.55, -3.25, 0.55, -2.55], '#2a1e1b', { lw: 0.025 });
    R.rect(-0.5, -4.7, 0.5, -3.45, '#8a857a', { lw: 0.04 }); stoneRows(R, -0.5, 0.5, -3.45, -4.7, 0.34, 8);
    R.poly([-0.9, -0.12, -0.9, -1.05, -0.6, -1.4, 0.6, -1.4, 0.9, -1.05, 0.9, -0.12], '#241915', { lw: 0.04 });
    R.poly([-0.78, -0.16, -0.78, -0.95, -0.52, -1.22, 0.52, -1.22, 0.78, -0.95, 0.78, -0.16], '!c9501f', { lw: 0 }); R.poly([-0.55, -0.16, -0.5, -0.8, -0.28, -1.0, 0.28, -1.0, 0.5, -0.8, 0.55, -0.16], '!f08a3c', { lw: 0 }); R.poly([-0.3, -0.16, -0.2, -0.55, 0, -0.7, 0.2, -0.55, 0.3, -0.16], '!f9d27a', { lw: 0 });
    return R;
  }
  const w = o.w || 7, d = o.d || 4, hw = w / 2, H = 2.2, ew = hw + 0.38, rise = 0.9, yE = -H + 0.25, yR = -H - d / 2 - rise, yB = -H - d - 0.1, rc = '#6f5240';
  R.ell(-0.4, 0, 2.0, 0.16, '#e0a35e', { lw: 0, smooth: true });
  R.poly([-ew + 0.25, yB, ew - 0.5, yB, ew - 0.25, yR, -ew, yR], dk(rc, 0.24), { lw: 0.04, step: 0.5 });
  R.rect(-hw, -0.4, hw, 0, '#8f897e', { lw: 0.03 });
  R.poly([-hw, -0.38, -hw, -H, hw, -H, hw, -0.38], '#8f897e', { shade: [[[hw - 1.0, -0.38, hw - 1.0, -H, hw, -H, hw, -0.38], dk('#8f897e', 0.2)]] }); stoneRows(R, -hw, hw, -0.38, -H, 0.34, 8);
  R.poly([-1.75, -0.4, -1.75, -1.5, -1.3, -1.95, 1.3, -1.95, 1.75, -1.5, 1.75, -0.4], '#2a1e1b', { lw: 0.05 });
  R.poly([-1.3, -0.95, -1.0, -1.45, 1.0, -1.45, 1.3, -0.95, 1.3, -0.4, -1.3, -0.4], '#5a4a40', { lw: 0.03 });
  R.poly([-0.85, -0.44, -0.85, -1.05, -0.55, -1.3, 0.55, -1.3, 0.85, -1.05, 0.85, -0.44], '!c9501f', { lw: 0 }); R.poly([-0.55, -0.44, -0.5, -0.9, -0.25, -1.1, 0.25, -1.1, 0.5, -0.9, 0.55, -0.44], '!f08a3c', { lw: 0 }); R.poly([-0.3, -0.44, -0.15, -0.8, 0, -0.9, 0.15, -0.8, 0.3, -0.44], '!f9d27a', { lw: 0 });
  R.poly([-ew, yR, ew - 0.3, yR, ew - 0.24, yE, -ew - 0.05, yE], rc, { lw: 0.04, step: 0.5, shade: [[[ew * 0.2, yR, ew - 0.3, yR, ew - 0.24, yE, ew * 0.2, yE], dk(rc, 0.2)]] });
  const sh = []; for (let k = 1; k < 6; k++) { const y = yR + k * (yE - yR) / 6.6; sh.push([-ew + 0.05, y, ew - 0.35, y]); } R.lines(sh, { lw: 0.02 });
  R.rect(-ew - 0.05, yE, ew - 0.2, yE + 0.16, dk(rc, 0.32), { lw: 0.03 });
  R.rect(hw - 1.5, yR - 1.9, hw - 0.4, yR + 0.9, '#8f897e', { lw: 0.045, shade: [[[hw - 0.95, yR - 1.9, hw - 0.4, yR - 1.9, hw - 0.4, yR + 0.9, hw - 0.95, yR + 0.9], dk('#8f897e', 0.22)]] }); stoneRows(R, hw - 1.5, hw - 0.4, yR + 0.9, yR - 1.9, 0.34, 6);
  R.rect(hw - 1.6, yR - 2.1, hw - 0.3, yR - 1.9, STONED, { lw: 0.035 });
  R.line([-hw, -H + 0.6, -hw - 0.9, -H + 0.6, -hw - 0.9, -H + 1.1], { lw: 0.05 }); R.rect(-hw - 1.3, -H + 1.1, -hw - 0.5, -H + 1.7, WOOD, { lw: 0.035 }); R.poly([-hw - 1.05, -H + 1.25, -hw - 0.75, -H + 1.25, -hw - 0.75, -H + 1.35, -hw - 1.05, -H + 1.35], IRON, { lw: 0.02 });
  return R;
}
def('forge', [8.6, 8.4], (ctx, o, t, id) => use(ctx, id, o.inside ? 1 : 2 + q(o.w || 7, 2) * 8 + q(o.d || 4, 2) * 100, forgeRec, o));

/* 망루 — 서 있는 모습(위 지붕 면 더함) */
def('tower', [3, 8.6], (ctx, o, t, id) => use(ctx, id, 1, towerRec, o));

/* 볼라 발사기: ang(rad · 0 = 동쪽 · π/2 = 남쪽) */
function catBaseRec() {
  const R = new Rec(55);
  R.ell(-0.95, -0.4, 0.14, 0.42, '#6e4d2c', { lw: 0.045 }); R.ell(0.95, -0.4, 0.14, 0.42, '#6e4d2c', { lw: 0.045 });
  R.poly([-0.95, -0.2, -0.95, -0.9, 0.95, -0.9, 0.95, -0.2], WOOD, { lw: 0.04, shade: [[[-0.95, -0.2, -0.95, -0.38, 0.95, -0.38, 0.95, -0.2], dk(WOOD, 0.22)]] });
  R.lines([[-0.5, -0.88, -0.5, -0.22], [0, -0.88, 0, -0.22], [0.5, -0.88, 0.5, -0.22]], { lw: 0.018 });
  R.ell(0, -0.65, 0.2, 0.2, IRON, { lw: 0.035 });
  return R;
}
function catTubeRec() {
  const R = new Rec(56);
  R.poly([-0.55, -0.17, 1.55, -0.22, 1.65, 0, 1.55, 0.22, -0.55, 0.17], '#8e6a44', { lw: 0.04, shade: [[[-0.55, 0.02, 1.55, 0.02, 1.55, 0.22, -0.55, 0.17], dk('#8e6a44', 0.22)]] });
  R.lines([[0.2, -0.2, 0.2, 0.2], [0.85, -0.21, 0.85, 0.21], [1.4, -0.22, 1.4, 0.22]], { lw: 0.055, ink: IRON }); R.ell(1.62, 0, 0.07, 0.19, '#2a1e1b', { lw: 0.03 });
  return R;
}
def('catapult', [3, 2.6], (ctx, o, t, id) => {
  use(ctx, id, 1, catBaseRec, o);
  ctx.save(); ctx.translate(0, -0.65); ctx.rotate(o.ang === undefined ? 0 : o.ang); use(ctx, id, 2000001, catTubeRec, o); ctx.restore();
});

/* 울타리: len · v:1 = 세로(북쪽으로) */
function fenceRec(o) {
  const len = o.len || 3, R = new Rec(49), n = Math.max(2, Math.round(len / 0.95) + 1);
  if (!o.v) {
    const x0 = -len / 2;
    for (let i = 1; i >= 0; i--) { const y = -0.42 - i * 0.4, a = (h1(i + 3) - 0.5) * 0.05; R.poly([x0 - 0.1, y + a, x0 + len + 0.1, y - a, x0 + len + 0.1, y - a - 0.11, x0 - 0.1, y + a - 0.11], '#a37448', { lw: 0.028, amp: 0.006, shade: [[[x0, y + a, x0 + len, y - a, x0 + len, y - a - 0.04, x0, y + a - 0.04], dk('#a37448', 0.2)]] }); }
    for (let i = 0; i < n; i++) { const x = x0 + i * len / (n - 1), hg = 1.05 + (h1(i * 5 + 1) - 0.5) * 0.12, ln = (h1(i * 3 + 2) - 0.5) * 0.06; R.poly([x - 0.07, 0, x - 0.07 + ln, -hg + 0.08, x + ln, -hg - 0.04, x + 0.07 + ln, -hg + 0.08, x + 0.07, 0], '#936a45', { lw: 0.03, amp: 0.004, step: 0.2 }); }
  } else {
    R.line([0, -0.95, 0, -len - 0.95], { lw: 0.1, ink: '#a37448', amp: 0.006 }); R.line([0, -0.55, 0, -len - 0.55], { lw: 0.1, ink: '#8e6a44', amp: 0.006 });
    for (let i = n - 1; i >= 0; i--) { const y = -i * len / (n - 1), hg = 1.0 + (h1(i * 5 + 1) - 0.5) * 0.12; R.poly([-0.1, y, -0.1, y - hg + 0.08, 0, y - hg - 0.04, 0.1, y - hg + 0.08, 0.1, y], '#936a45', { lw: 0.03, amp: 0.004, step: 0.2, shade: [[[0.0, y, 0.0, y - hg - 0.04, 0.1, y - hg + 0.08, 0.1, y], dk('#936a45', 0.22)]] }); }
  }
  return R;
}
def('fence', [3.2, 1.3], (ctx, o, t, id) => use(ctx, id, q(o.len || 3, 4) * 2 + (o.v ? 1 : 0), fenceRec, o));

/* 통나무: len · v:1 = 세로로 누움 */
function logRec(o) {
  const len = o.len || 2, R = new Rec(77), r = 0.34;
  if (!o.v) {
    R.poly([-len / 2, -0.04, -len / 2, -r * 2 + 0.04, len / 2 - 0.1, -r * 2 + 0.02, len / 2 - 0.1, -0.02], '#8e6a44', { lw: 0.04, shade: [[[-len / 2, -0.04, -len / 2, -0.24, len / 2 - 0.1, -0.24, len / 2 - 0.1, -0.02], dk('#8e6a44', 0.25)]], amp: 0.012 });
    R.lines([[-len / 2 + 0.2, -0.45, -len / 2 + 0.8, -0.5], [-len / 2 + 1.0, -0.3, len / 2 - 0.4, -0.33]], { lw: 0.02 });
    R.ell(len / 2 - 0.1, -r, 0.17, r, '#c9a56a', { lw: 0.04 }); R.ell(len / 2 - 0.1, -r, 0.09, 0.2, null, { lw: 0.018 });
  } else {
    R.poly([-r, -r, -r, -len - r, r, -len - r, r, -r], '#8e6a44', { lw: 0.04, shade: [[[0.08, -r, 0.08, -len - r, r, -len - r, r, -r], dk('#8e6a44', 0.25)]], amp: 0.012 });
    R.lines([[-0.12, -0.6, -0.1, -len * 0.5], [0.1, -len * 0.6, 0.12, -len + 0.1]], { lw: 0.02 });
    R.ell(0, -r, r, r, '#c9a56a', { lw: 0.04 }); R.ell(0, -r, r * 0.55, r * 0.55, null, { lw: 0.018 }); R.ell(0, -r, 0.07, 0.07, null, { lw: 0.015 });
  }
  return R;
}
def('log', [2.6, 1.2], (ctx, o, t, id) => use(ctx, id, q(o.len || 2, 4) * 2 + (o.v ? 1 : 0), logRec, o));

/* 우리(드래곤 가두는 곳): 앞 = 쇠창살 문 · 위 = 돌 덮개 윗면 */
function cageFrameRec() {
  const R = new Rec(91);
  R.poly([-1.9, -1.6, -1.9, -3.4, 1.9, -3.4, 1.9, -1.6], '#a8a398', { lw: 0.045, shade: [[[-1.9, -1.6, -1.9, -1.9, 1.9, -1.9, 1.9, -1.6], dk('#a8a398', 0.2)]] }); stoneRows(R, -1.9, 1.9, -1.6, -3.4, 0.36, 3);
  R.poly([-2.0, -3.4, 2.0, -3.4, 2.0, -3.4 - 1.6, -2.0, -3.4 - 1.6], '#b3ada0', { lw: 0.045, shade: [[[0.5, -3.4, 2.0, -3.4, 2.0, -5.0, 0.5, -5.0], dk('#b3ada0', 0.14)]] });
  stoneRows(R, -2.0, 2.0, -3.4, -5.0, 0.5, 9);
  R.poly([-2.0, 0, -2.0, -3.4, -1.45, -3.4, -1.45, 0], '#a8a398', { lw: 0.045, shade: [[[-1.7, 0, -1.7, -3.4, -1.45, -3.4, -1.45, 0], dk('#a8a398', 0.22)]] }); stoneRows(R, -2.0, -1.45, 0, -3.4, 0.38, 2);
  R.poly([1.45, 0, 1.45, -3.4, 2.0, -3.4, 2.0, 0], '#a8a398', { lw: 0.045, shade: [[[1.75, 0, 1.75, -3.4, 2.0, -3.4, 2.0, 0], dk('#a8a398', 0.22)]] }); stoneRows(R, 1.45, 2.0, 0, -3.4, 0.38, 5);
  return R;
}
function cageBarsRec() {
  const R = new Rec(92), b = []; for (let x = -1.3; x <= 1.31; x += 0.26) b.push([x, 0, x, -2.0]);
  R.lines(b, { lw: 0.075, ink: IRON }); R.lines([[-1.45, -0.55, 1.45, -0.55], [-1.45, -1.3, 1.45, -1.3]], { lw: 0.08, ink: IRON }); R.dots([-1.3, -0.55, 1.3, -1.3], 0.11, '#3d444b');
  return R;
}
def('cage', [4.2, 5.2], (ctx, o, t, id) => {
  ctx.fillStyle = '#1c1517'; ctx.fillRect(-1.45, -2.05, 2.9, 2.05);
  ctx.save(); ctx.beginPath(); ctx.rect(-1.47, -2.07, 2.94, 2.1); ctx.clip(); ctx.translate(0, -(o.open || 0) * 1.9); use(ctx, id, 2000001, cageBarsRec, o); ctx.restore();
  use(ctx, id, 1, cageFrameRec, o);
});

/* 훈련장 쇠사슬 지붕 그물 — 맨 위에 덮는 선만 (발 자리 = 아래 가운데 · 위로 d 만큼) */
function netRoofRec(o) {
  const w = o.w || 30, d = o.d || 22, hw = w / 2, R = new Rec(95), sp = 2.6, segs = [], dots = [];
  for (let k = -Math.ceil(d / sp); k <= Math.ceil(w / sp); k++) {
    const x0 = -hw + k * sp;
    for (const s2 of [[x0, 0, x0 + d, -d], [x0, -d, x0 + d, 0]]) {
      const ax = s2[0], ay = s2[1], dxs = s2[2] - ax, dys = s2[3] - ay; let t0 = 0, t1 = 1;
      const cl = (p, q2) => { if (p === 0) return q2 >= 0; const r = q2 / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } return true; };
      if (cl(-dxs, ax + hw) && cl(dxs, hw - ax) && cl(-dys, ay + d) && cl(dys, -ay)) segs.push([ax + dxs * t0, ay + dys * t0, ax + dxs * t1, ay + dys * t1]);
    }
  }
  R.lines(segs, { lw: 0.028, ink: '#6a7178', amp: 0.01, step: 1.4 });
  R.poly([-hw, 0, hw, 0, hw, -d, -hw, -d], null, { lw: 0.1, ink: '#454c54', amp: 0.012, step: 1.5 });
  return R;
}
def('net_roof', [30, 22], (ctx, o, t, id) => use(ctx, id, q(o.w || 30, 2) * 1000 + q(o.d || 22, 2), netRoofRec, o));

/* 선착장 판자(위에서) · 배 · 작은 배 */
function dockRec(o) {
  const w = o.w || 6, d = o.d || 3, hw = w / 2, R = new Rec(101), pl = [];
  R.poly([-hw, 0.12, -hw, -d, hw, -d, hw, 0.12], '#a9825a', { lw: 0.045, amp: 0.008, shade: [[[-hw, 0.0, -hw, 0.12, hw, 0.12, hw, 0.0], '#6e5338']] });
  for (let y = -d + 0.4; y < 0; y += 0.4) pl.push([-hw, y, hw, y]); for (let y = -d, r = 0; y < 0; y += 0.4, r++) for (let x = -hw + 0.6 + (r & 1) * 0.8 + h1(r * 7) * 0.5; x < hw - 0.1; x += 1.6) pl.push([x, y, x, y + 0.4]);
  R.lines(pl, { lw: 0.022 });
  for (const [x, y] of [[-hw + 0.15, -d + 0.15], [hw - 0.15, -d + 0.15], [-hw + 0.15, -0.1], [hw - 0.15, -0.1]]) R.ell(x, y, 0.13, 0.11, '#6e5338', { lw: 0.035 });
  return R;
}
def('dock', [6, 3.2], (ctx, o, t, id) => use(ctx, id, q(o.w || 6, 3) * 100 + q(o.d || 3, 2), dockRec, o));
function shipRec(o) {
  const w = o.w || 10, d = o.d || 3, hw = w / 2, R = new Rec(103), by = -d - 0.5;
  const hull = [-hw - 0.2, by - 0.35, -hw + 0.7, by + 0.1, -hw * 0.5, by + 0.0, 0, by - 0.02, hw * 0.5, by + 0.0, hw - 0.6, by + 0.12, hw + 0.4, by - 0.3, hw - 0.1, -0.1, hw * 0.5, 0.22, -hw * 0.5, 0.22, -hw + 0.4, -0.05];
  R.poly(hull, '#8e6a44', { lw: 0.05, smooth: true, amp: 0.02, shade: [[[-hw * 0.6, -0.55, hw * 0.6, -0.55, hw * 0.5, 0.22, -hw * 0.5, 0.22], dk('#8e6a44', 0.25)]] });
  R.poly([-hw + 0.6, by + 0.25, -hw * 0.5, by + 0.22, hw * 0.5, by + 0.22, hw - 0.5, by + 0.28, hw - 0.9, -0.65, hw * 0.5, -0.6, -hw * 0.5, -0.6, -hw + 0.9, -0.65], '#c2a06a', { lw: 0.04, smooth: true, amp: 0.012 });
  const pl = []; for (let x = -hw + 1; x < hw - 0.8; x += 0.5) pl.push([x, by + 0.3, x + 0.02, -0.62]); R.lines(pl, { lw: 0.016 });
  R.line([-hw * 0.5, -0.55, 0, -0.5, hw * 0.5, -0.55], { lw: 0.025 });
  const cols = ['#b5493f', '#d9b04a', '#4f7a8f', '#e8dcb8'];
  for (let i = 0; i < 8; i++) { const x = -hw + 1.2 + (w - 2.4) * i / 7; R.ell(x, 0.0, 0.3, 0.3, cols[i & 3], { lw: 0.035 }); R.ell(x, 0.0, 0.07, 0.07, '#8a8f95', { lw: 0.02 }); }
  headCap(R, hw + 0.25, by - 0.3, 1, 1.5, '#9a6a42');
  R.poly([-hw - 0.2, by - 0.35, -hw - 0.45, by - 0.9, -hw - 0.05, by - 0.45], '#8e6a44', { lw: 0.03 });
  R.poly([-0.12, -d * 0.5 - 0.2, -0.1, -5.3, 0.1, -5.3, 0.12, -d * 0.5 - 0.2], '#a37448', { lw: 0.04, amp: 0.006 });
  R.line([-2.5, -5.0, 2.5, -5.0], { lw: 0.09, ink: WOODD });
  R.poly([-2.4, -5.0, -2.4, -4.62, 2.4, -4.62, 2.4, -5.0], CREAM, { lw: 0.035, amp: 0.012 }); R.lines([[-1.2, -5.0, -1.2, -4.62], [0, -5.0, 0, -4.62], [1.2, -5.0, 1.2, -4.62]], { lw: 0.025, ink: CLOTH });
  R.lines([[0, -5.3, hw + 0.2, by - 0.2], [0, -5.3, -hw, by - 0.2]], { lw: 0.018, ink: '#6b5a40' });
  R.poly([0.1, -5.3, 0.1, -5.5, 0.75, -5.38], CLOTH, { lw: 0.025 });
  return R;
}
def('ship', [11.5, 7, 0.4], (ctx, o, t, id) => { ctx.rotate(Math.sin(t * 0.9) * 0.006); use(ctx, id, q(o.w || 10, 2) * 100 + q(o.d || 3, 2), shipRec, o); });
function boatRec() {
  const R = new Rec(107);
  R.poly([-1.55, -0.55, -1.0, -1.05, 0, -1.12, 1.0, -1.05, 1.6, -0.55, 1.0, 0.1, 0, 0.2, -1.0, 0.1], '#9a7048', { lw: 0.045, smooth: true, shade: [[[-1.0, -0.2, 0, -0.1, 1.0, -0.2, 1.0, 0.1, 0, 0.2, -1.0, 0.1], dk('#9a7048', 0.25)]] });
  R.poly([-1.1, -0.55, -0.6, -0.9, 0.6, -0.9, 1.1, -0.55, 0.6, -0.2, -0.6, -0.2], '#c2a06a', { lw: 0.035, smooth: true });
  R.rect(-0.12, -0.9, 0.24, -0.2, WOOD, { lw: 0.03 }); R.line([-0.2, -0.55, 1.4, -1.5], { lw: 0.05, ink: WOODD }); R.poly([1.3, -1.5, 1.7, -1.62, 1.55, -1.3], WOOD, { lw: 0.03 });
  return R;
}
def('boat', [3.6, 2], (ctx, o, t, id) => { ctx.rotate(Math.sin(t * 1.1) * 0.02); use(ctx, id, 1, boatRec, o); });

/* 바다 돌기둥(위에서 본 머리 + 거품 테) */
function seastackRec(o) {
  const r = o.r || 1.2, R = new Rec(109 + q(r, 4)), P = [];
  const n = 14; for (let i = 0; i < n; i++) { const a = i / n * 6.2832, rr2 = r * (1.42 + (i & 1 ? 0.14 : -0.06) + 0.08 * Math.sin(i * 2.3)); P.push(Math.cos(a) * rr2, Math.sin(a) * rr2 * 0.82 + r * 0.1); }
  R.poly(P, '#f6f1e0', { lw: 0.035, smooth: true, amp: 0.02, ink: '#8fb2b6' });
  const P2 = []; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; P2.push(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.0 + r * 0.1); } R.poly(P2, '#cfe8ec', { lw: 0, smooth: true, amp: 0.03 });
  R.poly([-r, 0.1 * r, -r * 0.88, -0.5 * r, r * 0.88, -0.5 * r, r, 0.1 * r, r * 0.8, 0.5 * r, 0, 0.62 * r, -r * 0.8, 0.5 * r], '#6f6a60', { lw: 0.045, smooth: true, amp: 0.03, shade: [[[r * 0.2, 0.62 * r, r * 0.8, 0.5 * r, r, 0.1 * r, r * 0.9, -0.4 * r, r * 0.3, 0], dk('#6f6a60', 0.25)]] });
  R.poly([-r * 0.85, -0.5 * r, -r * 0.6, -r * 1.05, r * 0.1, -r * 1.2, r * 0.75, -r * 0.95, r * 0.9, -0.5 * r, r * 0.4, -0.2 * r, -r * 0.4, -0.22 * r], '#a39e93', { lw: 0.045, smooth: true, amp: 0.03, shade: [[[r * 0.2, -r * 1.15, r * 0.75, -r * 0.95, r * 0.9, -0.5 * r, r * 0.4, -0.2 * r, r * 0.2, -0.5 * r], dk('#a39e93', 0.2)]] });
  R.poly([-r * 0.5, -r * 0.8, -r * 0.2, -r * 1.0, r * 0.2, -r * 0.85, 0, -r * 0.62], '#7f9a62', { lw: 0, smooth: true, amp: 0.02 });
  R.lines([[-r * 0.1, -r * 0.4, r * 0.1, -r * 0.7], [r * 0.3, -r * 0.5, r * 0.45, -r * 0.85]], { lw: 0.025 });
  R.dots([r * 0.4, -r * 0.4, r * 0.5, -r * 0.55, -r * 0.45, -r * 0.35], 0.07, '#f4f0e6');
  return R;
}
def('seastack', [3.6, 3.6, 0], (ctx, o, t, id) => use(ctx, id, q(o.r || 1.2, 4), seastackRec, o));

/* 구름(위에서) — 둥근 덩이 겹침, 바깥 선만 */
function cloudRec(o) {
  const w = o.w || 6, h = o.h || 3.2, R = new Rec(111 + q(w, 3) + q(h, 5)), cs = [], m = Math.min(w, h), n = Math.max(5, Math.round((w + h) / 2.0));
  for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + 0.3; cs.push([Math.cos(a) * w * 0.3, Math.sin(a) * h * 0.28, m * (0.25 + 0.1 * h1(i * 5 + q(w, 7)))]); }
  cs.push([0, 0, m * 0.34], [-w * 0.15, -h * 0.08, m * 0.3], [w * 0.16, h * 0.06, m * 0.3]);
  for (const c of cs) R.ell(c[0], c[1], c[2], c[2] * 0.92, null, { lw: 0.1, ink: '#6b6a73', amp: 0.02 });
  for (const c of cs) R.ell(c[0], c[1], c[2], c[2] * 0.92, '#d8dcdd', { lw: 0, amp: 0.02 });
  for (const c of cs) R.ell(c[0] - 0.12, c[1] - 0.14, Math.max(0.1, c[2] - 0.13), Math.max(0.1, c[2] * 0.92 - 0.13), '#f7f3ea', { lw: 0, amp: 0.02 });
  return R;
}
def('cloud', [6, 3.2], (ctx, o, t, id) => use(ctx, id, q(o.w || 6, 4) * 1000 + q(o.h || 3.2, 4), cloudRec, o));

/* 모래 선 (바닥에 붙음) — len · v:1 = 세로(발 자리 = 아래 끝) · 아니면 가운데 기준 가로 */
function sandLineRec(o) {
  const len = o.len || 3, R = new Rec(87), N = Math.max(5, Math.round(len * 2.5)), P = [];
  for (let i = 0; i <= N; i++) { const u = i / N, wob = Math.sin(i * 1.4) * 0.04 + (h1(i * 3 + 1) - 0.5) * 0.04; P.push(o.v ? [wob, -len * u] : [-len / 2 + len * u, wob]); }
  const A = [], Bk = []; for (const p of P) { A.push(p[0] + (o.v ? -0.15 : 0), p[1] + (o.v ? 0 : -0.15)); Bk.push(p[0] + (o.v ? 0.15 : 0), p[1] + (o.v ? 0 : 0.15)); }
  const rev = []; for (let i = Bk.length - 2; i >= 0; i -= 2) rev.push(Bk[i], Bk[i + 1]);
  R.poly(A.concat(rev), '#dac590', { lw: 0, amp: 0.012, step: 0.4 });
  const fl = []; for (const p of P) fl.push(p[0], p[1]); R.line(fl, { lw: 0.075, ink: '#a3875a', smooth: true, step: 0.4 });
  const sA = [], sB = []; for (let i = 0; i < P.length; i++) { sA.push(A[i * 2], A[i * 2 + 1]); sB.push(Bk[i * 2], Bk[i * 2 + 1]); } R.line(sA, { lw: 0.03, ink: '#f4e8c6', smooth: true, step: 0.4 }); R.line(sB, { lw: 0.03, ink: '#f4e8c6', smooth: true, step: 0.4 });
  const dd = []; for (let i = 0; i < len * 4; i++) { const u = h1(i * 3 + 1); dd.push(o.v ? (h1(i * 7) - 0.5) * 0.5 : -len / 2 + len * u, o.v ? -len * u : (h1(i * 7) - 0.5) * 0.5); } R.dots(dd, 0.03, '#b79c68');
  return R;
}
def('sand_line', [3, 3, 0], (ctx, o, t, id) => use(ctx, id, q(o.len || 3, 4) * 2 + (o.v ? 1 : 0), sandLineRec, o));

/* 드래곤 풀(nip) — 낮은 풀 무더기 + 보랏빛 작은 꽃 */
function nipRec() {
  const R = new Rec(133);
  for (let i = 0; i < 9; i++) { const a = -2.6 + i * 0.4, l = 0.5 + h1(i * 3 + 1) * 0.3; R.poly([0, 0, Math.cos(a) * l * 0.5 - 0.06, -Math.abs(Math.sin(a)) * l * 0.55, Math.cos(a) * l, -Math.abs(Math.sin(a)) * l - 0.1, Math.cos(a) * l * 0.5 + 0.06, -Math.abs(Math.sin(a)) * l * 0.55], i & 1 ? '#8fb6a0' : '#7ba58d', { lw: 0.026, smooth: true, amp: 0.006, step: 0.2 }); }
  for (const [x, y] of [[-0.25, -0.55], [0.1, -0.7], [0.3, -0.5]]) { R.line([x * 0.4, -0.1, x, y], { lw: 0.02, ink: '#5f8a70' }); R.ell(x, y, 0.07, 0.07, '#9a7ec9', { lw: 0.022 }); }
  return R;
}
def('nip', [1.2, 1, 0], (ctx, o, t, id) => use(ctx, id, 1, nipRec, o));

/* 둥지 분화구 테두리 바위 */
function nestRimRec(o) {
  const w = o.w || 14, hw = w / 2, R = new Rec(135), n = Math.max(5, Math.round(w / 1.6));
  R.rect(-hw, -1.0, hw, -0.1, '#241818', { lw: 0, amp: 0.02 });
  const lv = []; for (let i = 0; i < n; i++) { const x = -hw + (i + 0.5) * w / n; lv.push([x - 0.2, -0.6, x, -0.8, x + 0.15, -0.5]); } R.lines(lv, { lw: 0.06, ink: '!d8501f', smooth: true });
  for (let i = 0; i < n; i++) {
    const x = -hw + (i + 0.5) * w / n, rw = 1.0 + h1(i * 5 + 3) * 0.8, rh = 0.8 + h1(i * 7 + 2) * 0.7;
    R.poly([x - rw / 2, 0, x - rw * 0.45, -rh * 0.7, x - rw * 0.1, -rh, x + rw * 0.3, -rh * 0.9, x + rw / 2, -rh * 0.35, x + rw * 0.45, 0], '#6e5755', { lw: 0.04, amp: 0.015, step: 0.4, shade: [[[x + rw * 0.05, 0, x + rw * 0.05, -rh * 0.98, x + rw * 0.3, -rh * 0.9, x + rw / 2, -rh * 0.35, x + rw * 0.45, 0], dk('#6e5755', 0.28)]] });
    R.lines([[x - rw * 0.2, -rh * 0.8, x - rw * 0.05, -rh * 0.4]], { lw: 0.02 });
  }
  return R;
}
def('nest_rim', [14, 2], (ctx, o, t, id) => use(ctx, id, q(o.w || 14, 2), nestRimRec, o));

/* 긴 탁자 · 화덕 · 생선 바구니 · 방책 */
function tableRec(o) {
  const w = o.w || 4, hw = w / 2, R = new Rec(137), th = 0.82;
  for (const x of [-hw + 0.15, hw - 0.15]) R.rect(x - 0.07, -th, x + 0.07, 0, '#7b5236', { lw: 0.03 });
  R.poly([-hw, -th + 0.02, -hw, -th - 0.1, hw, -th - 0.1, hw, -th + 0.02], '#8e6240', { lw: 0.035 });
  R.poly([-hw - 0.06, -th - 0.1, -hw - 0.06, -th - 1.0, hw + 0.06, -th - 1.0, hw + 0.06, -th - 0.1], '#b98f5c', { lw: 0.04, shade: [[[-hw - 0.06, -th - 0.1, -hw - 0.06, -th - 0.25, hw + 0.06, -th - 0.25, hw + 0.06, -th - 0.1], dk('#b98f5c', 0.18)]] });
  const g2 = []; for (let x = -hw + 0.7; x < hw; x += 0.7) g2.push([x, -th - 0.1, x, -th - 1.0]); R.lines(g2, { lw: 0.016 });
  R.lines([[-hw, -th - 0.55, hw, -th - 0.55]], { lw: 0.016 });
  const n = Math.max(2, Math.round(w / 1.8)); for (let i = 0; i < n; i++) { const x = -hw + (i + 0.5) * w / n; R.ell(x - 0.3, -th - 0.35, 0.13, 0.08, '#9a6a42', { lw: 0.022 }); R.ell(x + 0.1, -th - 0.7, 0.18, 0.1, '#e8dcb8', { lw: 0.022 }); R.ell(x + 0.4, -th - 0.4, 0.14, 0.1, '#c9a56a', { lw: 0.022 }); }
  return R;
}
def('table', [4.4, 2], (ctx, o, t, id) => use(ctx, id, q(o.w || 4, 2), tableRec, o));
function hearthRec() {
  const R = new Rec(127);
  R.poly([-1.5, 0, -1.5, -0.4, 1.5, -0.4, 1.5, 0], STONE, { lw: 0.045, shade: [[[0.3, 0, 0.3, -0.4, 1.5, -0.4, 1.5, 0], dk(STONE, 0.22)]] }); stoneRows(R, -1.5, 1.5, 0, -0.4, 0.2, 12);
  R.poly([-1.55, -0.4, -1.55, -1.3, 1.55, -1.3, 1.55, -0.4], '#9a958a', { lw: 0.045 });
  R.poly([-1.15, -0.55, -1.15, -1.15, 1.15, -1.15, 1.15, -0.55], '#2a1e1b', { lw: 0.035 });
  R.line([-0.9, -0.8, 0.9, -1.0], { lw: 0.16, ink: '#6e4a32' }); R.line([-0.9, -1.0, 0.9, -0.8], { lw: 0.16, ink: '#7b5236' });
  R.poly([-0.8, -0.65, -0.4, -0.9, 0.3, -0.85, 0.8, -0.65, 0.2, -0.6], '!d8501f', { lw: 0, step: 0.2 });
  return R;
}
def('hearth', [3.2, 2], (ctx, o, t, id) => {
  use(ctx, id, 1, hearthRec, o);
  const lit = o.lit === undefined ? 0 : o.lit; if (lit <= 0.02) return;
  const fl = 1 + Math.sin(t * 7) * 0.08, hh2 = 0.9 * lit * fl;
  const tg = (x, w, hg, c, ph) => { ctx.fillStyle = c; ctx.beginPath(); const sw = Math.sin(t * 6 + ph) * 0.05; ctx.moveTo(x - w, -0.85); ctx.quadraticCurveTo(x - w * 1.1 + sw, -0.85 - hg * 0.5, x + sw * 2, -0.85 - hg); ctx.quadraticCurveTo(x + w * 0.4, -0.85 - hg * 0.45, x + w, -0.85); ctx.closePath(); ctx.fill(); };
  tg(-0.5, 0.34, hh2 * 0.8, '#c9501f', 0); tg(0, 0.45, hh2, '#c9501f', 1.3); tg(0.55, 0.34, hh2 * 0.7, '#c9501f', 2.1); tg(0, 0.28, hh2 * 0.6, '#f08a3c', 0.6); tg(0, 0.14, hh2 * 0.32, '#f9d27a', 2.6);
});
function fishBasketRec(o) {
  const n = Math.max(0, Math.min(3, o.n === undefined ? 2 : o.n | 0)), R = new Rec(115);
  R.poly([-0.38, 0, -0.46, -0.45, 0.46, -0.45, 0.38, 0], '#b88e5a', { lw: 0.035, shade: [[[0.1, 0, 0.1, -0.45, 0.46, -0.45, 0.38, 0], dk('#b88e5a', 0.22)]] });
  const wv = []; for (let y = -0.1; y > -0.42; y -= 0.12) wv.push([-0.42, y, 0.42, y]); for (let x = -0.3; x < 0.4; x += 0.2) wv.push([x, -0.03, x * 1.1, -0.44]); R.lines(wv, { lw: 0.016 });
  R.ell(0, -0.47, 0.46, 0.14, '#a77f4f', { lw: 0.035 }); R.ell(0, -0.47, 0.34, 0.08, n || o.eel ? '#4a3a2a' : '#3a2a1c', { lw: 0.02 });
  if (o.eel) { R.line([-0.3, -0.5, -0.1, -0.7, 0.1, -0.52, 0.3, -0.75, 0.4, -0.6], { lw: 0.1, ink: '#4f5a3a', smooth: true }); R.dots([0.4, -0.62], 0.05, '#e8dcb8'); }
  for (let i = 0; i < n; i++) { const x = -0.22 + i * 0.22, a = -0.4 + i * 0.35; R.poly([x, -0.5, x + Math.sin(a) * 0.3, -0.9, x + Math.sin(a) * 0.5 + 0.12, -0.9 - 0.18, x + Math.sin(a) * 0.3 + 0.1, -0.78], i & 1 ? '#a9b8c2' : '#8fa6b5', { lw: 0.025, smooth: true }); }
  return R;
}
def('fish_basket', [1.1, 1.3], (ctx, o, t, id) => use(ctx, id, (o.n === undefined ? 2 : o.n | 0) * 2 + (o.eel ? 1 : 0), fishBasketRec, o));
function barricadeRec(o) {
  const w = o.w || 1.6, R = new Rec(93), n = Math.max(1, Math.round(w / 0.85));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n, s = 0.4;
    R.poly([x - s * 1.1, 0, x - s * 0.9, -0.1, x + s * 0.5, -1.35, x + s * 0.7, -1.2, x + s * 0.58, -1.52, x + s * 0.45, -1.4, x - s * 0.95, 0.0], '#a37448', { lw: 0.035, amp: 0.008 });
    R.poly([x + s * 1.1, 0, x + s * 0.9, -0.1, x - s * 0.5, -1.35, x - s * 0.7, -1.2, x - s * 0.58, -1.52, x - s * 0.45, -1.4, x + s * 0.95, 0.0], '#8e6a44', { lw: 0.035, amp: 0.008 });
    R.poly([x - 0.1, -1.7, x - 0.12, -0.05, x + 0.12, -0.05, x + 0.1, -1.7, x, -1.95], '#b58a56', { lw: 0.035, shade: [[[x, -1.95, x + 0.1, -1.7, x + 0.12, -0.05, x + 0.02, -0.05], dk('#b58a56', 0.22)]] });
  }
  R.line([-w / 2 + 0.1, -0.35, w / 2 - 0.1, -0.35], { lw: 0.04, ink: IRON });
  return R;
}
def('barricade', [2.2, 2.2], (ctx, o, t, id) => use(ctx, id, q(o.w || 1.6, 4), barricadeRec, o));

/* ═════════ 땅 굽기 — bakeChunk(map, cx, cy, N, PX) ═════════
   타일 하나 = 1m = PX 픽셀. 이웃을 보고: 풀↔흙 들쭉날쭉(높은 차례가 낮은 쪽 가장자리를 덮음) · 물가 거품 선 · 벽/절벽 = 앞면(아래로 떨어지는 면) + 머리(윗면).
   같은 칸은 늘 같게(씨앗 = 타일 좌표) · 가장자리 굴곡은 월드 좌표로 이어져 타일 이음이 안 보인다. */
const KD = {
  void: { c: '#1d2730', t: 4 }, deep: { c: '#356b7e', t: 1, z: 3 }, sea: { c: '#54a0b0', t: 1, z: 2 }, water: { c: '#74b4c8', t: 1, z: 1 },
  sand: { c: '#ead9a6', t: 0, z: 40 }, path: { c: '#d6b98c', t: 0, z: 50 }, rockfloor: { c: '#6e5e5a', t: 0, z: 60 }, grass2: { c: '#6f9650', t: 0, z: 70 }, grass: { c: '#8fb464', t: 0, z: 80 }, snow: { c: '#eff1ee', t: 0, z: 90 },
  stone: { c: '#bdb7a8', t: 2 }, arena: { c: '#aaa598', t: 2 }, wood: { c: '#b98f5c', t: 2 }, plank: { c: '#a77f4f', t: 2 },
  wall: { c: '#6e4c34', t: 3 }, cliff: { c: '#8f8c86', t: 3 },
};
const VAR = { grass: '#7ba357', grass2: '#5f8744', path: '#c9a878', sand: '#dcc68c', snow: '#e1e8ec', rockfloor: '#5f504d' };
function hh(a, b, s) { return h1((Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(s | 0, 83492791)) | 0); }
function vn(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hh(xi, yi, 5), b = hh(xi + 1, yi, 5), c = hh(xi, yi + 1, 5), d = hh(xi + 1, yi + 1, 5);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const rr = (a, b, s) => mulberry(hh(a, b, s) * 4294967296 | 0);
const ns = (w, l) => vn(w * 2.4, l * 4.9 + 13.1);
function blob(g, cx, cy, rx, ry, R, n) {
  n = n || 8; const P = [], ph = R() * 6.28;
  for (let i = 0; i < n; i++) { const a = ph + i / n * 6.2832, r = 0.86 + R() * 0.28; P.push(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r); }
  g.beginPath(); g.moveTo((P[0] + P[(n - 1) * 2]) / 2, (P[1] + P[(n - 1) * 2 + 1]) / 2);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; g.quadraticCurveTo(P[i * 2], P[i * 2 + 1], (P[i * 2] + P[j * 2]) / 2, (P[i * 2 + 1] + P[j * 2 + 1]) / 2); }
  g.closePath();
}
function smooth(g, P, move) {
  if (move) g.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length - 1; i++) g.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
  g.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
}
const sink = (c, b) => mix(INK, c, b === undefined ? 0.55 : b);    /* 땅 결용 옅은 먹 */

/* 가장자리 띠: dir 0 북 · 1 동 · 2 남 · 3 서 — 이웃 쪽 가장자리에서 타일 안으로 들쭉날쭉 */
function strip(g, tx, ty, dir, fill, line, base, amp, lw) {
  const O = [], I = [];
  for (let s = 0; s <= 8; s++) {
    const u = s / 8; let ox, oy, ix, iy, th;
    if (dir === 0) { ox = tx + u; oy = ty; th = base + amp * ns(ox, oy); ix = ox; iy = oy + th; }
    else if (dir === 2) { ox = tx + u; oy = ty + 1; th = base + amp * ns(ox, oy); ix = ox; iy = oy - th; }
    else if (dir === 1) { oy = ty + u; ox = tx + 1; th = base + amp * ns(oy, ox + 40); iy = oy; ix = ox - th; }
    else { oy = ty + u; ox = tx; th = base + amp * ns(oy, ox + 40); iy = oy; ix = ox + th; }
    O.push([ox, oy]); I.push([ix, iy]);
  }
  g.fillStyle = fill; g.beginPath(); g.moveTo(O[0][0], O[0][1]); g.lineTo(O[8][0], O[8][1]); const Ir = I.slice().reverse(); g.lineTo(Ir[0][0], Ir[0][1]); smooth(g, Ir, false); g.closePath(); g.fill();
  if (line) { g.strokeStyle = line; g.lineWidth = lw || 0.034; g.beginPath(); smooth(g, I, true); g.stroke(); }
}
function cornerBlob(g, tx, ty, dx, dy, fill, line) {
  const cx = tx + (dx > 0 ? 1 : 0), cy = ty + (dy > 0 ? 1 : 0), r = 0.2 + 0.1 * ns(cx + cy, cx - cy);
  g.fillStyle = fill; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, Math.atan2(dy > 0 ? -1 : 1, 0) * 0 + (dx > 0 ? (dy > 0 ? Math.PI : Math.PI / 2) : (dy > 0 ? Math.PI * 1.5 : 0)), (dx > 0 ? (dy > 0 ? Math.PI * 1.5 : Math.PI) : (dy > 0 ? Math.PI * 2 : Math.PI / 2))); g.closePath(); g.fill();
  if (line) { g.strokeStyle = line; g.lineWidth = 0.034; g.beginPath(); g.arc(cx, cy, r, (dx > 0 ? (dy > 0 ? Math.PI : Math.PI / 2) : (dy > 0 ? Math.PI * 1.5 : 0)), (dx > 0 ? (dy > 0 ? Math.PI * 1.5 : Math.PI) : (dy > 0 ? Math.PI * 2 : Math.PI / 2))); g.stroke(); }
}
/* 거품 선(물 타일 안 · 가장자리를 따라 물결) */
function foam(g, tx, ty, dir) {
  const wave = (off, amp, col, lw) => {
    const P = [];
    for (let s = 0; s <= 8; s++) {
      const u = s / 8, w = (dir % 2 === 0 ? tx : ty) + u, d = off + amp * (ns(w, (dir === 0 ? ty : dir === 2 ? ty + 1 : dir === 1 ? tx + 1 : tx) + 90) - 0.5) * 2;
      P.push(dir === 0 ? [tx + u, ty + d] : dir === 2 ? [tx + u, ty + 1 - d] : dir === 1 ? [tx + 1 - d, ty + u] : [tx + d, ty + u]);
    }
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); smooth(g, P, true); g.stroke();
  };
  wave(0.12, 0.05, '#f6f0dc', 0.07); wave(0.3, 0.06, '#bfe3ee', 0.035);
}
const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

/* 땅 결 */
const TEX = {
  grass(g, tx, ty, R, c, alt) {
    const dk1 = alt ? '#557a3e' : '#6a964a', lt1 = alt ? '#86aa62' : '#a6ca78';
    if (R() < 0.6) { g.fillStyle = mix(c, R() < 0.5 ? lt1 : dk1, 0.4); blob(g, tx + 0.2 + R() * 0.6, ty + 0.2 + R() * 0.6, 0.2 + R() * 0.2, 0.14 + R() * 0.14, R); g.fill(); }
    g.strokeStyle = dk1; g.lineWidth = 0.032; g.beginPath();
    const n = 3 + (R() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const x = tx + 0.12 + R() * 0.76, y = ty + 0.2 + R() * 0.7, l = (R() - 0.5) * 0.1;
      g.moveTo(x - 0.05, y); g.quadraticCurveTo(x - 0.05 + l, y - 0.07, x - 0.08 + l, y - 0.15); g.moveTo(x, y); g.quadraticCurveTo(x + l * 0.4, y - 0.08, x + l, y - 0.19); g.moveTo(x + 0.05, y); g.quadraticCurveTo(x + 0.05 + l, y - 0.07, x + 0.09 + l, y - 0.13);
    }
    g.stroke();
    if (!alt && R() < 0.16) { const fc = ['#f6efd8', '#ecc650', '#d1675a'][R() * 3 | 0], x = tx + 0.15 + R() * 0.7, y = ty + 0.2 + R() * 0.6; g.fillStyle = fc; g.beginPath(); g.arc(x, y, 0.04, 0, 6.3); g.fill(); g.fillStyle = '#e9b84a'; g.beginPath(); g.arc(x, y, 0.014, 0, 6.3); g.fill(); }
    if (alt && R() < 0.3) { g.fillStyle = '#9a7a45'; for (let i = 0; i < 3; i++) { blob(g, tx + R(), ty + R(), 0.05, 0.03, R, 5); g.fill(); } }
  },
  path(g, tx, ty, R, c) {
    g.fillStyle = sink(c, 0.7); for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(tx + R(), ty + R(), 0.014, 0, 6.3); g.fill(); }
    const n = 1 + (R() * 3 | 0);
    for (let i = 0; i < n; i++) { g.fillStyle = mix(c, R() < 0.5 ? '#f1e2c0' : '#a88d63', 0.5); g.strokeStyle = sink(c, 0.6); g.lineWidth = 0.022; blob(g, tx + 0.15 + R() * 0.7, ty + 0.15 + R() * 0.7, 0.05 + R() * 0.07, 0.04 + R() * 0.05, R, 6); g.fill(); g.stroke(); }
    if (R() < 0.3) { g.strokeStyle = mix(c, '#8a6d45', 0.4); g.lineWidth = 0.03; g.beginPath(); const y = ty + 0.3 + R() * 0.4; g.moveTo(tx + 0.1, y); g.quadraticCurveTo(tx + 0.5, y + (R() - 0.5) * 0.12, tx + 0.9, y); g.stroke(); }
  },
  sand(g, tx, ty, R, c) {
    for (let i = 0; i < 2 + (R() * 2 | 0); i++) { const x = tx + 0.1 + R() * 0.5, y = ty + 0.15 + R() * 0.7; g.strokeStyle = '#d3bd86'; g.lineWidth = 0.03; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 0.18, y - 0.06, x + 0.36, y); g.stroke(); g.strokeStyle = '#f7ecd0'; g.lineWidth = 0.022; g.beginPath(); g.moveTo(x, y + 0.045); g.quadraticCurveTo(x + 0.18, y - 0.015, x + 0.36, y + 0.045); g.stroke(); }
    g.fillStyle = '#cdb77f'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(tx + R(), ty + R(), 0.012, 0, 6.3); g.fill(); }
    if (R() < 0.07) { g.fillStyle = '#f8f0e2'; g.strokeStyle = sink(c, 0.6); g.lineWidth = 0.02; blob(g, tx + 0.2 + R() * 0.6, ty + 0.2 + R() * 0.6, 0.06, 0.04, R, 6); g.fill(); g.stroke(); }
  },
  snow(g, tx, ty, R, c) {
    if (R() < 0.6) { g.fillStyle = '#dbe2e6'; blob(g, tx + 0.2 + R() * 0.6, ty + 0.3 + R() * 0.5, 0.25, 0.1, R); g.fill(); }
    g.strokeStyle = '#c2ccd2'; g.lineWidth = 0.025; g.beginPath(); for (let i = 0; i < 2; i++) { const x = tx + R() * 0.8 + 0.1, y = ty + R() * 0.8 + 0.1; g.moveTo(x, y); g.lineTo(x + 0.1, y + 0.01); } g.stroke();
  },
  water(g, tx, ty, R) {
    for (let i = 0; i < 2; i++) { const x = tx + 0.25 + R() * 0.5, y = ty + 0.2 + R() * 0.6; g.strokeStyle = i ? '#5b9db4' : '#b0dbe7'; g.lineWidth = 0.04; g.beginPath(); g.moveTo(x - 0.14, y); g.quadraticCurveTo(x, y - 0.1, x + 0.14, y); g.stroke(); }
  },
  sea(g, tx, ty, R) {
    for (let i = 0; i < 2; i++) { const x = tx + 0.25 + R() * 0.5, y = ty + 0.2 + R() * 0.6; g.strokeStyle = i ? '#3f8696' : '#9ccfda'; g.lineWidth = 0.045; g.beginPath(); g.moveTo(x - 0.2, y); g.quadraticCurveTo(x - 0.1, y - 0.1, x, y); g.quadraticCurveTo(x + 0.1, y + 0.1, x + 0.2, y); g.stroke(); }
    if (R() < 0.1) { g.strokeStyle = '#eef6f2'; g.lineWidth = 0.05; g.beginPath(); const x = tx + 0.3 + R() * 0.3, y = ty + 0.3 + R() * 0.4; g.moveTo(x, y); g.lineTo(x + 0.2, y); g.stroke(); }
  },
  deep(g, tx, ty, R) {
    for (let i = 0; i < 2; i++) { const x = tx + 0.25 + R() * 0.5, y = ty + 0.2 + R() * 0.6; g.strokeStyle = i ? '#2a5a6c' : '#4a8498'; g.lineWidth = 0.045; g.beginPath(); g.moveTo(x - 0.2, y); g.quadraticCurveTo(x - 0.1, y - 0.09, x, y); g.quadraticCurveTo(x + 0.1, y + 0.09, x + 0.2, y); g.stroke(); }
  },
  abyss(g, tx, ty, R) {
    for (let i = 0; i < 2; i++) { const x = tx + 0.25 + R() * 0.5, y = ty + 0.2 + R() * 0.6; g.strokeStyle = i ? '#3d3036' : '#1d171a'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(x - 0.22, y); g.quadraticCurveTo(x - 0.1, y - 0.1, x, y); g.quadraticCurveTo(x + 0.1, y + 0.1, x + 0.22, y); g.stroke(); }
    if (R() < 0.1) { g.fillStyle = '#9a3d25'; g.beginPath(); g.arc(tx + 0.2 + R() * 0.6, ty + 0.2 + R() * 0.6, 0.025, 0, 6.3); g.fill(); }
  },
  stone(g, tx, ty, R, c) {
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const v = R(); g.fillStyle = mix(c, v < 0.5 ? '#6e675b' : '#f0eadb', 0.06 + v * 0.14); g.strokeStyle = sink(c, 0.5); g.lineWidth = 0.022;
      blob(g, tx + (i + 0.5) / 3 + (R() - 0.5) * 0.06, ty + (j + 0.5) / 3 + (R() - 0.5) * 0.06, 0.16, 0.15, R, 7); g.fill(); g.stroke();
    }
  },
  arena(g, tx, ty, R, c) {
    g.strokeStyle = sink(c, 0.35); g.lineWidth = 0.04; g.beginPath();
    if (tx % 2 === 0) { g.moveTo(tx + 0.02, ty); g.lineTo(tx + 0.02 + (hh(tx, ty, 8) - 0.5) * 0.04, ty + 1); }
    if (ty % 2 === 0) { g.moveTo(tx, ty + 0.02); g.lineTo(tx + 1, ty + 0.02 + (hh(tx, ty, 9) - 0.5) * 0.04); }
    g.stroke();
    if (R() < 0.5) { g.fillStyle = mix(c, '#7d776b', 0.25); blob(g, tx + 0.2 + R() * 0.6, ty + 0.2 + R() * 0.6, 0.22, 0.13, R); g.fill(); }
    g.strokeStyle = sink(c, 0.6); g.lineWidth = 0.022; g.beginPath(); for (let i = 0; i < 3; i++) { const x = tx + 0.1 + R() * 0.7, y = ty + 0.1 + R() * 0.8; g.moveTo(x, y); g.lineTo(x + 0.12, y + 0.03); } g.stroke();
    if (R() < 0.16) { g.beginPath(); const x = tx + 0.2 + R() * 0.4, y = ty + 0.2 + R() * 0.4; g.moveTo(x, y); g.lineTo(x + 0.14, y + 0.12); g.lineTo(x + 0.08, y + 0.26); g.lineTo(x + 0.24, y + 0.36); g.stroke(); }
  },
  rockfloor(g, tx, ty, R, c) {
    for (let i = 0; i < 3; i++) { const x = tx + 0.15 + R() * 0.6, y = ty + 0.15 + R() * 0.6, a = 0.14 + R() * 0.16; g.fillStyle = R() < 0.5 ? mix(c, '#a08a84', 0.3) : mix(c, '#2b2020', 0.3); g.strokeStyle = sink(c, 0.55); g.lineWidth = 0.022; g.beginPath(); g.moveTo(x, y); g.lineTo(x + a, y + a * 0.2); g.lineTo(x + a * 0.8, y + a * 0.85); g.lineTo(x - 0.02, y + a * 0.6); g.closePath(); g.fill(); g.stroke(); }
    if (R() < 0.16) { g.strokeStyle = '#b8442a'; g.lineWidth = 0.035; g.beginPath(); const x = tx + 0.15 + R() * 0.4, y = ty + 0.15 + R() * 0.4; g.moveTo(x, y); g.lineTo(x + 0.14, y + 0.1); g.lineTo(x + 0.1, y + 0.22); g.lineTo(x + 0.26, y + 0.32); g.stroke(); }
  },
  wood(g, tx, ty, R, c) {
    g.strokeStyle = sink(c, 0.3); g.lineWidth = 0.034; g.beginPath(); g.moveTo(tx, ty + 0.5); g.lineTo(tx + 1, ty + 0.5); g.moveTo(tx, ty); g.lineTo(tx + 1, ty); g.stroke();
    g.lineWidth = 0.028; g.beginPath();
    for (let k = 0; k < 2; k++) if (hh(tx, ty * 2 + k, 3) < 0.4) { const x = tx + 0.15 + hh(tx, ty * 2 + k, 4) * 0.7; g.moveTo(x, ty + k * 0.5); g.lineTo(x, ty + k * 0.5 + 0.5); }
    g.stroke(); g.strokeStyle = mix(c, '#7b5a35', 0.4); g.lineWidth = 0.016; g.beginPath();
    for (let k = 0; k < 3; k++) { const x = tx + R() * 0.6, y = ty + 0.08 + R() * 0.84; g.moveTo(x, y); g.quadraticCurveTo(x + 0.2, y + (R() - 0.5) * 0.03, x + 0.4, y); } g.stroke();
    if (R() < 0.3) { g.fillStyle = sink(c, 0.5); g.beginPath(); g.arc(tx + 0.1 + R() * 0.8, ty + 0.25 + (R() < 0.5 ? 0 : 0.5), 0.016, 0, 6.3); g.fill(); }
  },
  plank(g, tx, ty, R, c) {
    g.strokeStyle = sink(c, 0.28); g.lineWidth = 0.036; g.beginPath();
    for (let k = 0; k < 3; k++) { g.moveTo(tx, ty + k / 3); g.lineTo(tx + 1, ty + k / 3); }
    g.stroke(); g.lineWidth = 0.028; g.beginPath();
    for (let k = 0; k < 3; k++) if (hh(tx, ty * 3 + k, 4) < 0.35) { const x = tx + 0.15 + hh(tx, ty * 3 + k, 5) * 0.7; g.moveTo(x, ty + k / 3); g.lineTo(x, ty + (k + 1) / 3); }
    g.stroke(); g.strokeStyle = mix(c, '#6e4d2c', 0.4); g.lineWidth = 0.016; g.beginPath();
    for (let k = 0; k < 3; k++) { const x = tx + R() * 0.6, y = ty + (k + 0.5) / 3; g.moveTo(x, y); g.lineTo(x + 0.3, y + (R() - 0.5) * 0.02); } g.stroke();
    g.fillStyle = sink(c, 0.45); for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(tx + 0.06, ty + (k + 0.5) / 3, 0.014, 0, 6.3); g.fill(); g.beginPath(); g.arc(tx + 0.94, ty + (k + 0.5) / 3, 0.014, 0, 6.3); g.fill(); }
  },
};

/* 벽(실내)·절벽: 앞면(남쪽이 열림) / 머리(윗면) */
function isOpen(k) { return k !== 'wall' && k !== 'cliff' && k !== 'void'; }
function wallFace(g, tx, ty, R, stone) {
  const c = stone ? '#8d887c' : '#6e4c34';
  g.fillStyle = c; g.fillRect(tx, ty, 1, 1);
  if (stone) {
    g.strokeStyle = sink(c, 0.4); g.lineWidth = 0.034; g.beginPath();
    for (let k = 1; k < 2; k++) { g.moveTo(tx, ty + 0.5 * k + 0.0); g.lineTo(tx + 1, ty + 0.5 * k); }
    for (let r = 0; r < 2; r++) { const x = tx + 0.2 + hh(tx, ty * 2 + r, 6) * 0.6 + (r & 1 ? 0.15 : 0); g.moveTo(x, ty + r * 0.5); g.lineTo(x, ty + r * 0.5 + 0.5); }
    g.stroke(); g.fillStyle = mix(c, '#cfc8b8', 0.12); g.fillRect(tx + 0.03, ty + 0.03, 0.4, 0.4);
  } else {
    g.fillStyle = mix(c, '#2a1d16', 0.12); for (let k = 0; k < 4; k += 2) g.fillRect(tx + k * 0.25, ty, 0.25, 1);
    g.strokeStyle = '#2a1d16'; g.lineWidth = 0.03; g.beginPath(); for (let k = 1; k < 4; k++) { g.moveTo(tx + k * 0.25, ty); g.lineTo(tx + k * 0.25, ty + 1); } g.stroke();
    g.strokeStyle = mix(c, '#2a1d16', 0.35); g.lineWidth = 0.02; g.beginPath(); for (let k = 0; k < 3; k++) { const x = tx + R() * 0.9 + 0.05, y = ty + 0.15 + R() * 0.5; g.moveTo(x, y); g.lineTo(x + 0.01, y + 0.25); } g.stroke();
  }
  g.fillStyle = mix(c, '#fff0d0', 0.18); g.fillRect(tx, ty, 1, 0.1);             /* 윗머리 빛 띠 */
  g.fillStyle = mix(c, '#1a120d', 0.45); g.fillRect(tx, ty + 0.88, 1, 0.12);      /* 아랫단(바닥 닿는 곳) */
  g.strokeStyle = INK; g.lineWidth = 0.05; g.beginPath(); g.moveTo(tx - 0.01, ty + 0.985); g.lineTo(tx + 1.01, ty + 0.985); g.stroke();
}
function wallStone(kd, tx, ty) {
  for (let r = 1; r <= 3; r++) for (const [dx, dy] of dirs) { const k = kd(tx + dx * r, ty + dy * r); if (k === 'arena' || k === 'stone') return true; if (k === 'wood' || k === 'plank') return false; }
  return false;
}
function wallHead(g, tx, ty, R, kd) {
  const st = wallStone(kd, tx, ty), c = st ? '#7d796e' : '#4b382b'; g.fillStyle = c; g.fillRect(tx, ty, 1, 1);
  g.strokeStyle = mix(c, '#1a120d', 0.5); g.lineWidth = 0.025; g.beginPath(); g.moveTo(tx, ty + 0.5); g.lineTo(tx + 1, ty + 0.5); const x = tx + 0.2 + R() * 0.6; g.moveTo(x, ty); g.lineTo(x, ty + 0.5); g.moveTo(x - 0.2, ty + 0.5); g.lineTo(x - 0.2, ty + 1); g.stroke();
  g.strokeStyle = INK; g.lineWidth = 0.045; g.beginPath();
  for (let d = 0; d < 4; d++) { const n = kd(tx + dirs[d][0], ty + dirs[d][1]); if (isOpen(n)) { if (d === 0) { g.moveTo(tx, ty + 0.02); g.lineTo(tx + 1, ty + 0.02); } else if (d === 1) { g.moveTo(tx + 0.98, ty); g.lineTo(tx + 0.98, ty + 1); } else if (d === 3) { g.moveTo(tx + 0.02, ty); g.lineTo(tx + 0.02, ty + 1); } } }
  g.stroke();
  g.strokeStyle = mix(c, '#fff0d0', 0.3); g.lineWidth = 0.03; g.beginPath(); for (let d = 0; d < 4; d++) { const n = kd(tx + dirs[d][0], ty + dirs[d][1]); if (isOpen(n) && d !== 2) { if (d === 0) { g.moveTo(tx, ty + 0.1); g.lineTo(tx + 1, ty + 0.1); } else if (d === 1) { g.moveTo(tx + 0.9, ty); g.lineTo(tx + 0.9, ty + 1); } else { g.moveTo(tx + 0.1, ty); g.lineTo(tx + 0.1, ty + 1); } } } g.stroke();
}
function cliffFace(g, tx, ty, R, kd) {
  const c = '#8f8c86'; g.fillStyle = c; g.fillRect(tx, ty, 1, 1);
  g.fillStyle = mix(c, '#3b3935', 0.16); g.fillRect(tx + 0.55, ty, 0.45, 1);
  g.strokeStyle = sink(c, 0.45); g.lineWidth = 0.028; g.beginPath();
  for (let k = 0; k < 5; k++) { const x = tx + 0.08 + k * 0.2 + (R() - 0.5) * 0.08, y = ty + R() * 0.3; g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 0.05, y + 0.4 + R() * 0.5); }
  g.stroke(); g.strokeStyle = sink(c, 0.55); g.lineWidth = 0.02; g.beginPath(); const y = ty + 0.35 + R() * 0.3; g.moveTo(tx + 0.05, y); g.lineTo(tx + 0.45, y + 0.04); g.moveTo(tx + 0.55, y - 0.15); g.lineTo(tx + 0.95, y - 0.1); g.stroke();
  if (isOpen(kd(tx, ty - 1)) === false && kd(tx, ty - 1) === 'cliff') {      /* 위 가장자리 풀 턱 */
    g.fillStyle = '#7da05a'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + 1, ty);
    for (let s = 8; s >= 0; s--) { const u = s / 8; g.lineTo(tx + u, ty + 0.14 + 0.1 * ns(tx + u, ty + 33)); } g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 0.03; g.beginPath(); for (let s = 0; s <= 8; s++) { const u = s / 8; const px = tx + u, py = ty + 0.14 + 0.1 * ns(px, ty + 33); if (s) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke();
  }
  g.fillStyle = mix(c, '#2b2824', 0.4); g.fillRect(tx, ty + 0.9, 1, 0.1);
  g.strokeStyle = INK; g.lineWidth = 0.05; g.beginPath(); g.moveTo(tx - 0.01, ty + 0.985); g.lineTo(tx + 1.01, ty + 0.985); g.stroke();
}
function cliffHead(g, tx, ty, R, kd) {
  const c = '#7da05a'; g.fillStyle = mix(c, '#6a8c4c', ns(tx * 0.3, ty * 0.3) * 0.6); g.fillRect(tx, ty, 1, 1);
  TEX.grass(g, tx, ty, R, c, true);
  if (R() < 0.28) { g.fillStyle = '#9b9892'; g.strokeStyle = sink('#9b9892', 0.5); g.lineWidth = 0.025; blob(g, tx + 0.25 + R() * 0.5, ty + 0.3 + R() * 0.4, 0.14, 0.1, R, 7); g.fill(); g.stroke(); }
  for (let d = 0; d < 4; d++) {
    const n = kd(tx + dirs[d][0], ty + dirs[d][1]); if (!isOpen(n)) continue;
    g.strokeStyle = INK; g.lineWidth = 0.045; g.fillStyle = '#6f6c66'; g.beginPath();
    const P = []; for (let s = 0; s <= 6; s++) { const u = s / 6, w = (d % 2 ? ty : tx) + u, off = 0.04 + 0.06 * ns(w, d * 17 + (d % 2 ? tx : ty)); P.push(d === 0 ? [tx + u, ty + off] : d === 2 ? [tx + u, ty + 1 - off] : d === 1 ? [tx + 1 - off, ty + u] : [tx + off, ty + u]); }
    smooth(g, P, true); g.stroke();
  }
}

export function bakeChunk(map, cx, cy, N, PX) {
  N = N || 16; PX = PX || 48;
  const c = document.createElement('canvas'); c.width = c.height = N * PX; const g = c.getContext('2d');
  g.scale(PX, PX); g.translate(-cx * N, -cy * N); g.lineCap = 'round'; g.lineJoin = 'round';
  const x0 = cx * N, y0 = cy * N, B = 2, M = N + 2 * B, K = new Array(M * M);
  for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) K[j * M + i] = map.kind(x0 + i - B, y0 + j - B) || 'void';
  const kd = (tx, ty) => { const i = tx - x0 + B, j = ty - y0 + B; return i >= 0 && j >= 0 && i < M && j < M ? K[j * M + i] : (map.kind(tx, ty) || 'void'); };
  const abyssCache = new Map(); const isAbyss = (tx, ty) => { const key = tx + ',' + ty; let r = abyssCache.get(key); if (r === undefined) { r = false; for (let dy = -4; dy <= 4 && !r; dy++) for (let dx = -4; dx <= 4; dx++) if (kd(tx + dx, ty + dy) === 'rockfloor') { r = true; break; } abyssCache.set(key, r); } return r; };
  const isFace = (tx, ty) => { const k = kd(tx, ty); return (k === 'wall' || k === 'cliff') && isOpen(kd(tx, ty + 1)); };
  const baseOf = (k, tx, ty) => { const d = KD[k] || KD.void; if (d.t === 0) return mix(d.c, VAR[k], ns(tx * 0.45, ty * 0.45) * 0.1); if (d.t === 2) return mix(d.c, '#2b2118', (hh(tx, ty, 2) - 0.5) * 0.025 + 0.012); return d.c; };
  /* 1) 바탕 · 2) 결 */
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const tx = x0 + i, ty = y0 + j, k = kd(tx, ty), d = KD[k] || KD.void; let col = baseOf(k, tx, ty);
    const ab = k === 'deep' && isAbyss(tx, ty); if (ab) col = '#2d2428';
    g.fillStyle = col; g.fillRect(tx, ty, 1, 1);
    g.save(); g.beginPath(); g.rect(tx, ty, 1, 1); g.clip();
    const R = rr(tx, ty, 1);
    if (k === 'grass') TEX.grass(g, tx, ty, R, col, false); else if (k === 'grass2') TEX.grass(g, tx, ty, R, col, true);
    else if (k === 'wall') { if (isFace(tx, ty)) wallFace(g, tx, ty, R, kd(tx, ty + 1) === 'arena' || kd(tx, ty + 1) === 'stone'); else wallHead(g, tx, ty, R, kd); }
    else if (k === 'cliff') { if (isFace(tx, ty)) cliffFace(g, tx, ty, R, kd); else cliffHead(g, tx, ty, R, kd); }
    else if (ab) TEX.abyss(g, tx, ty, R);
    else if (TEX[k]) TEX[k](g, tx, ty, R, col);
    g.restore();
  }
  /* 3) 가장자리 · 바닥에 드리운 벽 그림자 */
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const tx = x0 + i, ty = y0 + j, k = kd(tx, ty), d = KD[k]; if (!d || d.t === 3 || d.t === 4) {
      if (d && d.t === 3 && isFace(tx, ty)) { /* 면 아래 이음은 면이 그림 */ }
      continue;
    }
    g.save(); g.beginPath(); g.rect(tx, ty, 1, 1); g.clip();
    const own = baseOf(k, tx, ty);
    for (let s = 0; s < 4; s++) {
      const nk = kd(tx + dirs[s][0], ty + dirs[s][1]), nd = KD[nk]; if (!nd || nk === k) continue;
      if (d.t === 0) {                                               /* 부드러운 땅 */
        if (nd.t === 0 && nd.z > d.z) strip(g, tx, ty, s, mix(nd.c, VAR[nk], 0.2), INK, 0.1, 0.17, 0.034);
        else if (nd.t === 1) strip(g, tx, ty, s, mix(own, '#4a5560', 0.2), mix(INK, own, 0.15), 0.07, 0.1, 0.03);
        else if (nd.t === 2) { g.strokeStyle = INK; g.lineWidth = 0.04; g.beginPath(); g.moveTo(...(s === 0 ? [tx, ty] : s === 1 ? [tx + 1, ty] : s === 2 ? [tx + 1, ty + 1] : [tx, ty + 1])); g.lineTo(...(s === 0 ? [tx + 1, ty] : s === 1 ? [tx + 1, ty + 1] : s === 2 ? [tx, ty + 1] : [tx, ty])); g.stroke(); }
      } else if (d.t === 1) {                                        /* 물 */
        if (nd.t === 1 && nd.z > d.z) strip(g, tx, ty, s, nd.c, null, 0.16, 0.2, 0);
        else if (nd.t === 0 || nd.t === 2) { if (k === 'deep') { g.fillStyle = isAbyss(tx, ty) ? '#1a1417' : '#27566a'; g.beginPath(); if (s === 0) g.rect(tx, ty, 1, 0.16); else if (s === 2) g.rect(tx, ty + 0.84, 1, 0.16); else if (s === 1) g.rect(tx + 0.84, ty, 0.16, 1); else g.rect(tx, ty, 0.16, 1); g.fill(); } else foam(g, tx, ty, s); }
        else if (nd.t === 3 && (nk === 'cliff' || nk === 'wall')) foam(g, tx, ty, s);
      } else if (d.t === 2) {                                        /* 딱딱한 바닥 */
        if (nd.t === 3) continue;
        g.strokeStyle = INK; g.lineWidth = 0.045; g.beginPath();
        if (s === 0) { g.moveTo(tx, ty + 0.02); g.lineTo(tx + 1, ty + 0.02); } else if (s === 1) { g.moveTo(tx + 0.98, ty); g.lineTo(tx + 0.98, ty + 1); } else if (s === 2) { g.moveTo(tx, ty + 0.98); g.lineTo(tx + 1, ty + 0.98); } else { g.moveTo(tx + 0.02, ty); g.lineTo(tx + 0.02, ty + 1); }
        g.stroke();
      }
    }
    if (d.t === 0) for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {     /* 모서리 덩이 */
      const nk = kd(tx + dx, ty + dy), nd = KD[nk]; if (!nd || nd.t !== 0 || nd.z <= d.z) continue;
      const ax = KD[kd(tx + dx, ty)], ay = KD[kd(tx, ty + dy)];
      if ((ax && ax.t === 0 && ax.z > d.z) || (ay && ay.t === 0 && ay.z > d.z)) continue;
      cornerBlob(g, tx, ty, dx, dy, mix(nd.c, VAR[nk], 0.2), INK);
    }
    if (isFace(tx, ty - 1)) { g.fillStyle = 'rgba(30,22,16,0.28)'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + 1, ty); for (let s = 8; s >= 0; s--) { const u = s / 8; g.lineTo(tx + u, ty + 0.1 + 0.07 * ns(tx + u, ty + 61)); } g.closePath(); g.fill(); }
    g.restore();
  }
  return c;
}

export const PROP_KINDS = Object.keys(DEF);
export const PROP_SIZE = {}; for (const k of PROP_KINDS) PROP_SIZE[k] = DEF[k].size;
export const TILE_KINDS = Object.keys(KD);
export function drawProp(ctx, kind, o, t) {
  const d = DEF[kind]; if (!d) return;
  ctx.save(); d.draw(ctx, o || EMPTY, t || 0, d.id); ctx.restore();
}
