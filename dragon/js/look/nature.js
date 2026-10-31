// 자연 짓기 — 안개 숲(places/forest.js)·코브(places/cove.js)가 같이 씀 · 결 = 시안 A(재질은 toon({vc})만 · 텍스처 0장)
// 원리: 나무·풀·바위·통나무는 원형을 몇 벌 깎아 두고(정점 노이즈로 손으로 깎은 듯), 땅 한 칸(청크)마다 행렬·크기·기울기·색 흔들기로 구워 한 메시에 합침
//   → 재질 하나 = 청크 하나에 그리기 한 번 · 먼 청크는 LOD 낮은 판(원뿔 나무·땅만) · 안개 끝 밖은 카메라 far가 잘라 냄
//   정점색으로 이끼·그을음·젖은 바위·흰 자작나무 얼룩 · 물은 불투명 셰이더(반사 X · 가장자리 밝게 · 작은 물결) · 매 프레임 new X
import * as THREE from 'three';
import { toon, U } from './kit.js?v=17';

export const TAU = Math.PI * 2;
const _c = new THREE.Color();
/* 색 = 선형 rgb 배열(three 정점색은 선형) */
export const C3 = (hex) => { _c.setHex(hex); return [_c.r, _c.g, _c.b]; };
export const mixc = (a, b, t, o = [0, 0, 0]) => { o[0] = a[0] + (b[0] - a[0]) * t; o[1] = a[1] + (b[1] - a[1]) * t; o[2] = a[2] + (b[2] - a[2]) * t; return o; };
export const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
/* 정수 해시 → 0~1 (짓기 때 정점마다 흔들기) */
export function hash(a, b = 0, c = 0) { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
/* 3D 값 노이즈(바위 깎기용) */
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const h = (i, j, k) => hash(xi + i, yi + j, zi + k);
  const x00 = h(0, 0, 0) + (h(1, 0, 0) - h(0, 0, 0)) * u, x10 = h(0, 1, 0) + (h(1, 1, 0) - h(0, 1, 0)) * u;
  const x01 = h(0, 0, 1) + (h(1, 0, 1) - h(0, 0, 1)) * u, x11 = h(0, 1, 1) + (h(1, 1, 1) - h(0, 1, 1)) * u;
  const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
}

/* ───────── 원형 짓개: 정점(위치·색) + 삼각형 → 부드러운 법선 ───────── */
export class Mesher {
  constructor() { this.p = []; this.c = []; this.i = []; this.nn = null; }
  get n() { return this.p.length / 3; }
  v(x, y, z, c) { this.p.push(x, y, z); this.c.push(c[0], c[1], c[2]); return this.p.length / 3 - 1; }
  vn(x, y, z, c, nx, ny, nz) { if (!this.nn) this.nn = []; this.nn.push(nx, ny, nz); return this.v(x, y, z, c); }   // 법선을 직접 줌(땅 조각끼리 이음매 없이)
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  done(paint) {                                     // paint(x,y,z, nx,ny,nz, col) = 법선을 보고 색을 고침(이끼 = 위를 보는 면)
    const pos = new Float32Array(this.p), col = new Float32Array(this.c), idx = new Uint32Array(this.i);
    let nor; if (this.nn && this.nn.length === this.p.length) nor = new Float32Array(this.nn); else { nor = new Float32Array(pos.length); smoothNormals(pos, idx, nor); }
    if (paint) { const o = [0, 0, 0]; for (let k = 0; k < pos.length; k += 3) { o[0] = col[k]; o[1] = col[k + 1]; o[2] = col[k + 2]; paint(pos[k], pos[k + 1], pos[k + 2], nor[k], nor[k + 1], nor[k + 2], o); col[k] = o[0]; col[k + 1] = o[1]; col[k + 2] = o[2]; } }
    return { pos, col, nor, idx, nv: pos.length / 3, nt: idx.length / 3 };
  }
}
export function smoothNormals(pos, idx, nor) {
  for (let k = 0; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2], e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
    const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
  }
  for (let k = 0; k < nor.length; k += 3) { const l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1; nor[k] /= l; nor[k + 1] /= l; nor[k + 2] /= l; }
}
/* 돌림 몸(Lathe) — prof = 위→아래 [r, y] · ring(k, j, a) → [rMul, yAdd, col] 로 정점마다 흔들기 · 이음매 없이 감음(법선 매끈) */
export function lathe(M, prof, seg, ring, rot = 0, cx = 0, cz = 0) {
  const base = M.n;
  for (let k = 0; k < prof.length; k++) for (let j = 0; j < seg; j++) {
    const a = rot + j / seg * TAU, R = ring(k, j, a), r = prof[k][0] * R[0];
    M.v(cx + Math.cos(a) * r, prof[k][1] + R[1], cz + Math.sin(a) * r, R[2]);
  }
  for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < seg; j++) {
    const j1 = (j + 1) % seg, A = base + k * seg + j, B = base + k * seg + j1, C = base + (k + 1) * seg + j1, D = base + (k + 1) * seg + j;
    M.quad(A, B, C, D);
  }
  return base;
}
/* 굽은 대롱(가지·자작나무 줄기·통나무) — pts = [[x,y,z,r,col]...] 아래→위 · sides 면 · 끝 막기 선택 */
export function tube(M, pts, sides, capEnd = false, capStart = false, twist = 0) {
  const base = M.n, T = new THREE.Vector3(), N = new THREE.Vector3(), Bv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3(1, 0, 0);
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k], q = pts[Math.min(pts.length - 1, k + 1)], o = pts[Math.max(0, k - 1)];
    T.set(q[0] - o[0], q[1] - o[1], q[2] - o[2]).normalize();
    N.crossVectors(Math.abs(T.y) > 0.9 ? side : up, T).normalize(); Bv.crossVectors(T, N);
    for (let j = 0; j < sides; j++) {
      const a = j / sides * TAU + twist, cs = Math.cos(a) * p[3], sn = Math.sin(a) * p[3];
      M.v(p[0] + N.x * cs + Bv.x * sn, p[1] + N.y * cs + Bv.y * sn, p[2] + N.z * cs + Bv.z * sn, typeof p[4] === 'function' ? p[4](j) : p[4]);
    }
  }
  for (let k = 0; k < pts.length - 1; k++) for (let j = 0; j < sides; j++) {
    const j1 = (j + 1) % sides, A = base + k * sides + j, B = base + k * sides + j1, C = base + (k + 1) * sides + j1, D = base + (k + 1) * sides + j;
    M.quad(A, B, C, D);
  }
  const cap = (k, col, flip) => { const p = pts[k], c = M.v(p[0], p[1], p[2], col); for (let j = 0; j < sides; j++) { const a = base + k * sides + j, b = base + k * sides + (j + 1) % sides; if (flip) M.tri(c, b, a); else M.tri(c, a, b); } };
  if (capEnd) cap(pts.length - 1, capEnd, false);
  if (capStart) cap(0, capStart, true);
  return base;
}
/* 이십면체 구(바위·잎 덩어리) — detail 0 = 12점 · 1 = 42점 */
const ICO = {};
export function ico(detail) {
  if (ICO[detail]) return ICO[detail];
  const t = (1 + Math.sqrt(5)) / 2;
  let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((v) => { const l = Math.hypot(...v); return v.map((x) => x / l); });
  let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let d = 0; d < detail; d++) {
    const mid = new Map(), F2 = [];
    const m = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mid.has(k)) return mid.get(k); const v = [(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2], l = Math.hypot(...v); V.push(v.map((x) => x / l)); mid.set(k, V.length - 1); return V.length - 1; };
    for (const [a, b, c] of F) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    F = F2;
  }
  return (ICO[detail] = { V, F });
}
/* 덩어리 하나 — 구를 노이즈로 흔들어 붙임 · f(v) → 반지름 배수 */
export function blob(M, cx, cy, cz, rx, ry, rz, detail, f, colf) {
  const { V, F } = ico(detail), base = M.n;
  for (const v of V) { const k = f ? f(v) : 1; M.v(cx + v[0] * rx * k, cy + v[1] * ry * k, cz + v[2] * rz * k, colf(v)); }
  for (const [a, b, c] of F) M.tri(base + a, base + b, base + c);   // 표 차례 = 바깥을 봄(반시계)
  return base;
}

/* ───────── 원형들(크기 = 실제 m) ───────── */
const FIR_TOP = C3(0x587a5c), FIR_MID = C3(0x3c5c48), FIR_RIM = C3(0x4f705a), FIR_UND = C3(0x1e3029), BARK = C3(0x45372d), BARK2 = C3(0x5d4b3b);
/* 전나무 — 줄기 + 층층 치마(위로 갈수록 작게) · 치마 끝은 각도마다 들쭉날쭉 · 층마다 돌림이 달라 복사 티가 덜 남 */
export function firGeo(seed, o = {}) {
  const H = o.h || 12, tiers = o.tiers || 4, seg = o.seg || 6, wide = o.wide || 1, M = new Mesher(), cc = [0, 0, 0];
  lathe(M, [[0.06, H * 0.9], [0.17, H * 0.45], [0.25, H * 0.08], [0.33, -1.0]], 5, (k, j) => { mixc(BARK, BARK2, hash(seed, k, j) * 0.8, cc); if (k >= 2 && hash(seed, j, 21) > 0.4) mixc(cc, MOSS, 0.45, cc); return [1 + (hash(seed, j, 7) - 0.5) * 0.2, 0, cc.slice()]; });
  for (let t = 0; t < tiers; t++) {
    const f = tiers > 1 ? t / (tiers - 1) : 1, yTop = H * (1.02 - f * 0.66), h = H * (0.27 + f * 0.1), R = H * (0.06 + 0.2 * Math.pow(f, 0.85)) * wide;
    const rot = hash(seed, t, 3) * TAU, dk = 1 - f * 0.18, bl = f * 0.06;
    const prof = [[0.05, yTop], [R * 0.5, yTop - h * 0.45], [R, yTop - h], [0.22, yTop - h * 0.6]];
    lathe(M, prof, seg, (k, j, a) => {
      const n = hash(seed * 31 + t, j, k), n2 = hash(seed, t * 13 + j, 5);
      if (k === 0) return [1, 0, mixc(FIR_TOP, FIR_RIM, 0.3).map((x) => x * dk)];
      if (k === 1) { mixc(FIR_MID, FIR_TOP, n * 0.35, cc); return [0.85 + n * 0.3, (n2 - 0.5) * h * 0.12, [cc[0] * dk, cc[1] * dk, cc[2] * dk + bl * 0.02]]; }
      if (k === 2) { mixc(FIR_RIM, FIR_TOP, n * 0.4, cc); return [0.78 + n * 0.42, -n2 * h * 0.16, [cc[0] * dk, cc[1] * dk, cc[2] * dk + bl * 0.03]]; }
      return [1, 0, FIR_UND];
    }, rot);
  }
  return M.done();
}
/* 먼 전나무(LOD) — 원뿔 둘 */
export function firFarGeo(o = {}) {
  const H = o.h || 12, M = new Mesher(), w = o.wide || 1;
  lathe(M, [[0.04, H], [H * 0.16 * w, H * 0.5], [0.2, H * 0.52]], 5, (k) => [1, 0, k === 0 ? FIR_TOP : k === 1 ? FIR_RIM : FIR_UND]);
  lathe(M, [[0.05, H * 0.66], [H * 0.25 * w, H * 0.06], [0.3, H * 0.1]], 5, (k) => [1, 0, k === 0 ? FIR_MID : k === 1 ? FIR_RIM : FIR_UND], 0.6);
  return M.done();
}
const BIRCH_W = C3(0xdcd6c6), BIRCH_D = C3(0x2a2723), BIRCH_B = C3(0x6d665c), LEAF_A = C3(0x86a04c), LEAF_B = C3(0xa8bc5e), LEAF_U = C3(0x4f6638);
/* 자작나무 — 흰 줄기(검은 얼룩) 살짝 휨 · 가는 가지 셋 · 잎 덩어리 넷~다섯(노랑 섞인 연두) */
export function birchGeo(seed, o = {}) {
  const H = o.h || 10, M = new Mesher(), bend = (hash(seed, 1) - 0.5) * 0.9, bz = (hash(seed, 2) - 0.5) * 0.6, pts = [];
  for (let k = 0; k <= 7; k++) {
    const f = k / 7, y = -0.6 + f * H * 0.86, r = 0.19 * (1 - f * 0.7) + 0.03;
    pts.push([Math.sin(f * 1.8) * bend, y, Math.sin(f * 1.5) * bz, r, (j) => (k === 0 ? BIRCH_B : hash(seed, k, j) > 0.7 ? BIRCH_D : mixc(BIRCH_W, BIRCH_B, k === 1 ? 0.5 : hash(seed, j, k * 3) * 0.15))]);
  }
  tube(M, pts, 5, BIRCH_W);
  for (let b = 0; b < (o.lite ? 2 : 3); b++) {
    const f = 0.5 + b * 0.13, a = hash(seed, b, 9) * TAU, L = 1.4 + hash(seed, b, 4) * 1.2, x0 = Math.sin(f * 1.8) * bend, y0 = -0.6 + f * H * 0.86, z0 = Math.sin(f * 1.5) * bz;
    tube(M, [[x0, y0, z0, 0.06, BIRCH_W], [x0 + Math.cos(a) * L * 0.5, y0 + L * 0.35, z0 + Math.sin(a) * L * 0.5, 0.04, BIRCH_W], [x0 + Math.cos(a) * L, y0 + L * 0.8, z0 + Math.sin(a) * L, 0.02, BIRCH_D]], 3);
  }
  const nb = o.lite ? 4 : 6, det = 1, top = -0.6 + H * 0.86;
  for (let b = 0; b < nb; b++) {
    const f = b / (nb - 1), a = hash(seed, b, 11) * TAU, d = (1 - f * 0.6) * (0.7 + hash(seed, b, 12) * 0.9), r = (1.05 + hash(seed, b, 13) * 0.75) * (1 - f * 0.25);
    const cy = top - H * 0.32 + f * H * 0.36 + (hash(seed, b, 14) - 0.5) * 0.6, k2 = (cy + 0.6) / (H * 0.86), cx = Math.sin(clamp(k2, 0, 1) * 1.8) * bend + Math.cos(a) * d, cz = Math.sin(clamp(k2, 0, 1) * 1.5) * bz + Math.sin(a) * d, sd = seed * 7 + b;
    blob(M, cx, cy, cz, r, r * 0.72, r, det, (v) => 0.7 + noise3(v[0] * 2.4 + sd, v[1] * 2.4, v[2] * 2.4) * 0.6, (v) => {
      const out = clamp(v[1] * 0.5 + (v[0] * Math.cos(a) + v[2] * Math.sin(a)) * 0.35 + 0.35, 0, 1);       // 덩어리 바깥 위쪽 = 밝게 · 안쪽 아래 = 어둡게
      return v[1] < -0.45 ? LEAF_U : mixc(mixc(LEAF_U, LEAF_A, 0.55 + out * 0.45), LEAF_B, out * out * 0.8 + (hash(sd, Math.round(v[0] * 5), Math.round(v[2] * 5)) - 0.5) * 0.2, [0, 0, 0]);
    });
  }
  return M.done();
}
export function birchFarGeo(o = {}) {
  const H = o.h || 10, M = new Mesher();
  tube(M, [[0, -0.5, 0, 0.18, BIRCH_W], [0, H * 0.7, 0, 0.08, BIRCH_W]], 4);
  blob(M, 0, H * 0.72, 0, 2.0, 2.3, 2.0, 1, (v) => 0.8 + noise3(v[0] * 2 + 3, v[1] * 2, v[2] * 2) * 0.4, (v) => (v[1] < -0.3 ? LEAF_U : mixc(LEAF_A, LEAF_B, clamp(v[1], 0, 1) * 0.6)));
  return M.done();
}
const DEAD = C3(0xbdb8aa), DEAD2 = C3(0x8e897c);
/* 고사목 — 하얗게 바랜 줄기 + 앙상한 가지(위로 꺾임) + 부러진 꼭대기 · 안개 속에서 밝은 실루엣 */
export function deadTreeGeo(seed, o = {}) {
  const H = o.h || 13, M = new Mesher(), pts = [];
  for (let k = 0; k <= 6; k++) { const f = k / 6; pts.push([Math.sin(f * 2.2 + seed) * 0.35, -0.8 + f * H, Math.cos(f * 1.7 + seed) * 0.25, 0.42 * (1 - f * 0.72) + 0.04, (j) => mixc(DEAD, DEAD2, hash(seed, k, j) * 0.7 + (k === 0 ? 0.3 : 0))]); }
  tube(M, pts, 6, C3(0xd8cfb4));
  const nb = o.branches || 6;
  for (let b = 0; b < nb; b++) {
    const f = 0.35 + b / nb * 0.55, a = b * 2.4 + hash(seed, b) * 1.2, L = (2.6 + hash(seed, b, 2) * 2.4) * (1 - f * 0.45), p = pts[Math.round(f * 6)];
    const x0 = p[0], y0 = p[1], z0 = p[2], ux = Math.cos(a), uz = Math.sin(a);
    tube(M, [[x0, y0, z0, 0.13 * (1 - f * 0.5), DEAD], [x0 + ux * L * 0.45, y0 + L * 0.18, z0 + uz * L * 0.45, 0.08, DEAD], [x0 + ux * L * 0.8, y0 + L * 0.55, z0 + uz * L * 0.8, 0.04, DEAD2], [x0 + ux * L, y0 + L * 0.95, z0 + uz * L, 0.015, DEAD2]], 3);
  }
  return M.done();
}
const ROCK_A = C3(0x7f7f76), ROCK_B = C3(0x66675f), ROCK_D = C3(0x4a4b46), MOSS = C3(0x5f7740), MOSS2 = C3(0x7a8f4c);
/* 바위 — 이십면체를 노이즈로 깎고 납작하게 · 위를 보는 면에 이끼 · 아래는 땅에 묻힘 */
export function rockGeo(seed, o = {}) {
  const M = new Mesher(), fl = o.flat ?? 0.7, moss = o.moss ?? 1, det = o.detail ?? 1, sharp = o.sharp ?? 0.55;
  blob(M, 0, 0, 0, 1, fl, 1, det, (v) => 0.72 + noise3(v[0] * 1.7 + seed * 3.1, v[1] * 1.7, v[2] * 1.7 + seed) * sharp + noise3(v[0] * 4 + seed, v[1] * 4, v[2] * 4) * 0.12, () => ROCK_A);
  return M.done((x, y, z, nx, ny, nz, c) => {
    const n = noise3(x * 2.3 + seed, y * 2.3, z * 2.3), base = mixc(ROCK_A, ROCK_B, n, c);
    if (y < -0.1) mixc(base, ROCK_D, Math.min(1, (-0.1 - y) * 2.2), c);
    const m = sstep(0.42, 0.8, ny + (n - 0.5) * 0.3) * moss; if (m > 0) { const mc = mixc(MOSS, MOSS2, noise3(x * 5, y * 5, z * 5 + seed)); mixc(c, mc, m, c); }
  });
}
const LOG_A = C3(0x4c3d31), LOG_B = C3(0x5f4d3c), WOOD = C3(0xc7a774), WOOD2 = C3(0x8a6c48);
/* 쓰러진 통나무 — +Z로 누운 대롱(살짝 처짐) · 위에 이끼 · 끝은 나이테 · rootEnd = 뿌리판(뽑힌 흙덩이) */
export function logGeo(seed, o = {}) {
  const L = o.len || 8, r = o.r || 0.45, M = new Mesher(), pts = [];
  for (let k = 0; k <= 4; k++) { const f = k / 4; pts.push([Math.sin(f * 3 + seed) * 0.12, r * 0.85 - Math.sin(f * Math.PI) * 0.12, f * L, r * (1 - f * 0.25) * (0.94 + hash(seed, k) * 0.12), (j) => mixc(LOG_A, LOG_B, hash(seed, k, j))]); }
  tube(M, pts, 7, WOOD, o.rootEnd ? false : WOOD);
  if (o.rootEnd) blob(M, pts[0][0], r * 0.9, -0.15, r * 2.6, r * 2.4, r * 0.7, 1, (v) => 0.75 + noise3(v[0] * 3 + seed, v[1] * 3, v[2]) * 0.5, (v) => (v[2] > 0.3 ? C3(0x3b2d22) : C3(0x4f3e2c)));
  return M.done((x, y, z, nx, ny, nz, c) => {
    if (Math.abs(nz) > 0.8 && (z < 0.05 || z > L - 0.6)) { const d = Math.hypot(x - (z < 1 ? pts[0][0] : pts[4][0]), y - r * 0.8); mixc(WOOD, WOOD2, sstep(r * 0.25, r * 0.9, d), c); return; }
    const m = sstep(0.35, 0.85, ny + (noise3(x * 3, y * 3, z * 0.8 + seed) - 0.5) * 0.5); if (m > 0) mixc(c, mixc(MOSS, MOSS2, noise3(z * 2, x, seed)), m * 0.9, c);
  });
}
/* 그루터기 · 부러진 나무 밑동 — broken이면 꼭대기가 들쭉날쭉한 생나무 빛(옅은 노랑) + 가시 같은 쪼개짐 */
export function stumpGeo(seed, o = {}) {
  const h = o.h || 0.8, r = o.r || 0.35, M = new Mesher(), br = !!o.broken, seg = 7;
  const prof = [[0.05, h + (br ? 0.25 : 0.02)], [1, h], [1, h - 0.12], [1, h * 0.5], [1.18, 0.12], [1.3, -0.7]];
  lathe(M, prof, seg, (k, j) => {
    if (k === 0) return [r, 0, br ? WOOD : C3(0xa88a60)];
    if (k === 1) { const jag = br ? (hash(seed, j) * 1.1 - 0.3) * (0.5 + h * 0.15) : 0; return [r * (br ? 0.86 + hash(seed, j, 4) * 0.18 : 1), jag, br ? WOOD : C3(0x8e7250)]; }
    if (k === 2) { const jag = br ? (hash(seed, j) * 1.1 - 0.3) * (0.5 + h * 0.15) * 0.6 : 0; return [r, jag, mixc(LOG_A, LOG_B, hash(seed, k, j))]; }
    return [r, 0, mixc(LOG_A, LOG_B, hash(seed, k, j))];
  });
  if (br) for (let s = 0; s < 4; s++) {                // 쪼개진 가시 — 두 면(얇은 판)
    const a = hash(seed, s, 8) * TAU, rr = r * 0.7, x = Math.cos(a) * rr, z = Math.sin(a) * rr, L = 0.5 + hash(seed, s, 9) * 0.9 + h * 0.2, w = 0.07;
    const tx = -Math.sin(a) * w, tz = Math.cos(a) * w, lean = 0.12;
    const p0 = M.v(x - tx, h - 0.1, z - tz, WOOD), p1 = M.v(x + tx, h - 0.1, z + tz, WOOD), p2 = M.v(x * (1 + lean), h + L, z * (1 + lean), C3(0xeadbb0));
    M.tri(p0, p1, p2); M.tri(p0, p2, p1);
  }
  return M.done();
}
/* 부러진 전나무 — 아래 치마 둘은 남고 줄기가 breakH에서 꺾여 들쭉날쭉한 생나무 속(옅은 노랑) + 쪼개진 가시 · 위는 없음(윗동은 따로 눕힘) */
export function brokenFirGeo(seed, breakH = 4, o = {}) {
  const H = o.h || 12, M = new Mesher(), seg = 6, r0 = 0.3, rb = 0.3 * (1 - breakH / H * 0.65), cc = [0, 0, 0];
  lathe(M, [[0.05, breakH + 0.3], [rb, breakH], [rb * 1.02, breakH * 0.6], [0.27, H * 0.08], [r0 + 0.04, -1.0]], 6, (k, j) => {
    if (k === 0) return [1, (hash(seed, j) - 0.5) * 0.4, WOOD];
    if (k === 1) return [0.85 + hash(seed, j, 4) * 0.25, (hash(seed, j, 2) - 0.3) * 0.9, hash(seed, j, 3) > 0.45 ? C3(0xe8d6a6) : WOOD];
    mixc(BARK, BARK2, hash(seed, k, j) * 0.8, cc); if (k >= 3 && hash(seed, j, 21) > 0.4) mixc(cc, MOSS, 0.45, cc); return [1, 0, cc.slice()];
  });
  for (let s = 0; s < 3; s++) {                         // 쪼개진 가시
    const a = hash(seed, s, 8) * TAU, x = Math.cos(a) * rb * 0.7, z = Math.sin(a) * rb * 0.7, L = 0.6 + hash(seed, s, 9) * 0.9, w = 0.07, tx = -Math.sin(a) * w, tz = Math.cos(a) * w;
    const p0 = M.v(x - tx, breakH - 0.15, z - tz, WOOD), p1 = M.v(x + tx, breakH - 0.15, z + tz, WOOD), p2 = M.v(x * 1.15, breakH + L, z * 1.15, C3(0xeadbb0));
    M.tri(p0, p1, p2); M.tri(p0, p2, p1);
  }
  const tiers = Math.max(1, Math.min(2, Math.floor(breakH / 2.2)));
  for (let t = 0; t < tiers; t++) {                     // 남은 아래 치마
    const yTop = Math.min(breakH - 0.5, H * (0.36 + t * 0.2)), h = H * 0.34, R = H * (0.25 - t * 0.05), rot = hash(seed, t, 3) * TAU;
    lathe(M, [[0.18, yTop], [R * 0.55, yTop - h * 0.45], [R, yTop - h], [0.22, yTop - h * 0.6]], seg, (k, j) => {
      const n = hash(seed * 31 + t, j, k);
      return k === 0 ? [1, 0, FIR_MID] : k === 1 ? [0.8 + n * 0.35, 0, mixc(FIR_MID, FIR_TOP, n * 0.3)] : k === 2 ? [0.72 + n * 0.45, -n * h * 0.18, mixc(FIR_RIM, FIR_UND, 0.2)] : [1, 0, FIR_UND];
    }, rot);
  }
  return M.done();
}
/* 쓰러진 나무(뿌리째) — 껍질 줄기 + 뽑혀 선 뿌리판(흙) + 끝쪽 짓눌린 치마 셋 · +Z로 누움 */
export function fallenFirGeo(seed, o = {}) {
  const L = o.len || 11, r = o.r || 0.32, M = new Mesher(), pts = [];
  for (let k = 0; k <= 5; k++) { const f = k / 5; pts.push([Math.sin(f * 2 + seed) * 0.15, r * 0.9 + f * 0.25, f * L, r * (1 - f * 0.75) + 0.03, (j) => mixc(LOG_A, LOG_B, hash(seed, k, j))]); }
  tube(M, pts, 6, WOOD, false);
  const RP = Math.max(1.5, r * 5);
  blob(M, 0, RP * 0.62, -0.25, RP, RP * 0.85, 0.45, 1, (v) => 0.66 + noise3(v[0] * 3 + seed, v[1] * 3, v[2]) * 0.7, (v) => (v[2] > 0.2 ? C3(0x3a2c21) : mixc(C3(0x4a3a2a), C3(0x5b6a3c), v[1] > 0.45 ? 0.55 : 0.05)));   // 뽑혀 선 뿌리판(흙)
  for (let q = 0; q < 6; q++) { const a = q / 6 * TAU + hash(seed, q, 40), l = RP * (0.9 + hash(seed, q, 41) * 0.5); tube(M, [[0, RP * 0.6, -0.3, 0.12, C3(0x3e3024)], [Math.cos(a) * l * 0.6, RP * 0.6 + Math.sin(a) * l * 0.6, -0.55, 0.07, C3(0x4a3a2a)], [Math.cos(a) * l, Math.max(0.05, RP * 0.6 + Math.sin(a) * l), -0.7, 0.025, C3(0x5a4834)]], 3); }
  for (let t = 0; t < 3; t++) {
    const zc = L * (0.52 + t * 0.16), R = (2.1 - t * 0.45) * (o.crown || 1), rot = hash(seed, t, 3) * TAU, base = M.n;
    for (let k = 0; k < 4; k++) for (let j = 0; j < 6; j++) {                           // 옆으로 누운 치마 — 아래쪽은 땅에 눌려 납작
      const a = rot + j / 6 * TAU, ring = [[0.15, 0], [R * 0.6, -0.7], [R, -1.5], [0.25, -1.0]][k], rr = ring[0] * (k === 2 ? 0.8 + hash(seed, t * 7 + j) * 0.4 : 1), sx = Math.cos(a) * rr, sy = Math.sin(a) * rr;
      M.v(sx, Math.max(0.05, r + sy * (sy < 0 ? 0.35 : 1)), zc + ring[1], k === 0 ? FIR_TOP : k === 1 ? FIR_MID : k === 2 ? FIR_RIM : FIR_UND);
    }
    for (let k = 0; k < 3; k++) for (let j = 0; j < 6; j++) { const j1 = (j + 1) % 6; M.quad(base + k * 6 + j, base + (k + 1) * 6 + j, base + (k + 1) * 6 + j1, base + k * 6 + j1); }
  }
  return M.done();
}
const CUSH_A = C3(0x3a5228), CUSH_B = C3(0x5f7a3a);
/* 이끼 방석 — 땅에 낮게 퍼진 둥근 이끼·토끼풀 덩어리(풀 포기보다 '땅이 살아 있음'을 싸게) */
export function cushionGeo(seed, o = {}) {
  const M = new Mesher(), A = o.a || CUSH_A, B = o.b || CUSH_B;
  blob(M, 0, -0.12, 0, 1, 0.55, 1, 1, (v) => 0.72 + noise3(v[0] * 3 + seed, v[1] * 3, v[2] * 3) * 0.5, (v) => mixc(A, B, clamp(v[1] * 0.8 + 0.2 + (hash(seed, Math.round(v[0] * 6), Math.round(v[2] * 6)) - 0.5) * 0.4, 0, 1), [0, 0, 0]));
  return M.done();
}
const FERN_A = C3(0x324b2a), FERN_B = C3(0x4f7a3a), FERN_C = C3(0x7ea554), FERN_X = C3(0x2a2a24), FERN_X2 = C3(0x55503f);
/* 고사리 덤불 — 잎줄기 일곱~여덟이 활처럼 휘어 처짐 · 잎줄기마다 작은 잎(세모)이 양옆으로 빗살처럼(생선뼈) · 위를 보는 한 면 · burnt = 그을려 검게 */
export function fernGeo(seed, o = {}) {
  const M = new Mesher(), n = o.fronds || 8, S = o.size || 1, burnt = !!o.burnt, NS = 6;
  const A = burnt ? FERN_X : FERN_A, B = burnt ? FERN_X2 : FERN_B, Cc = burnt ? FERN_X2 : FERN_C;
  for (let f = 0; f < n; f++) {
    const a = f / n * TAU + hash(seed, f) * 0.7, L = S * (0.7 + hash(seed, f, 2) * 0.45), rise = 0.42 + hash(seed, f, 3) * 0.3, ux = Math.cos(a), uz = Math.sin(a), px = -uz, pz = ux;
    const at = (t) => [ux * L * t, 0.04 + Math.sin(t * Math.PI * 0.8) * L * rise - t * t * L * 0.3, uz * L * t];
    for (let k = 0; k < NS; k++) {
      const t0 = 0.1 + k / NS * 0.88, t1 = t0 + 0.88 / NS, p0 = at(t0), p1 = at(t1), w = L * 0.24 * Math.sin(Math.PI * Math.min(1, t0 * 0.95 + 0.12)) + 0.02;
      const c = t0 < 0.5 ? mixc(A, B, t0 * 2) : mixc(B, Cc, (t0 - 0.5) * 2), ct = mixc(c, Cc, 0.35);
      for (const sd of [1, -1]) {                       // 잎 하나 = 줄기 두 점 + 바깥 끝(앞쪽으로 비스듬)
        const tx = (p0[0] + p1[0]) / 2 + px * sd * w + ux * L * 0.05, tz = (p0[2] + p1[2]) / 2 + pz * sd * w + uz * L * 0.05, ty = (p0[1] + p1[1]) / 2 - w * 0.3;
        const i0 = M.v(p0[0], p0[1] + 0.01, p0[2], c), i1 = M.v(p1[0], p1[1] + 0.01, p1[2], c), i2 = M.v(tx, ty, tz, ct);
        if (sd > 0) M.tri(i0, i2, i1); else M.tri(i0, i1, i2);
      }
    }
  }
  return M.done();
}
/* 풀 포기 — 잎 다섯~여덟(세모 하나씩 · 두 면) · col = [밑, 끝] */
export function grassGeo(seed, o = {}) {
  const M = new Mesher(), n = o.blades || 6, H = o.h || 0.45, W = o.w || 0.035, A = o.base || C3(0x47602e), B = o.tip || C3(0x9fb664);
  for (let k = 0; k < n; k++) {
    const a = hash(seed, k) * TAU, d = hash(seed, k, 2) * 0.12, x = Math.cos(a) * d, z = Math.sin(a) * d, h = H * (0.65 + hash(seed, k, 3) * 0.6), lean = 0.08 + hash(seed, k, 4) * 0.22;
    const px = -Math.sin(a) * W, pz = Math.cos(a) * W, tx = x + Math.cos(a) * h * lean, tz = z + Math.sin(a) * h * lean;
    const tipC = mixc(B, A, hash(seed, k, 5) * 0.3);
    const p0 = M.v(x - px, -0.05, z - pz, A), p1 = M.v(x + px, -0.05, z + pz, A), p2 = M.v(tx, h, tz, tipC);
    const q0 = M.v(x - px, -0.05, z - pz, A), q1 = M.v(x + px, -0.05, z + pz, A), q2 = M.v(tx, h, tz, tipC);
    M.tri(p0, p1, p2); M.tri(q0, q2, q1);
    if (o.seedHead && k % 2 === 0) { const s = 0.05, hc = o.seedHead; const s0 = M.v(tx - s, h - 0.02, tz, hc), s1 = M.v(tx, h + 0.1, tz, hc), s2 = M.v(tx + s, h - 0.02, tz, hc), s3 = M.v(tx, h - 0.02, tz + s, hc); M.tri(s0, s2, s1); M.tri(s0, s1, s2); M.tri(s3, s1, s0); M.tri(s3, s0, s1); }
  }
  return M.done();
}
/* 드래곤 풀 — 푸른빛 도는 덤불(잎이 넓고 키가 큼 · 끝에 옅은 하늘빛 씨앗) */
export function nipGeo(seed) {
  return grassGeo(seed, { blades: 11, h: 0.75, w: 0.06, base: C3(0x2f6a66), tip: C3(0x8fd8c8), seedHead: C3(0xd2f4ee) });
}
/* 찢긴 꼬리날개 조각 — 검은 가죽 부채꼴(살 셋 · 찢긴 가장자리 들쭉날쭉) · 두 면 · 땅에 비스듬히 기대 놓음 */
export function finGeo() {
  const M = new Mesher(), K = C3(0x141518), K2 = C3(0x23252a), RIB = C3(0x2c2e33), n = 7, S = 0.75;
  const ctr = [], top = [], bot = [];
  for (let k = 0; k <= n; k++) {
    const a = -0.9 + k / n * 1.8, tear = k === 0 || k === n ? 0.55 : 0.62 + hash(3, k) * 0.38, r = S * tear;
    top.push(M.v(Math.sin(a) * r, Math.cos(a * 1.3) * 0.04, Math.cos(a) * r, k % 3 === 0 ? RIB : (hash(k, 4) > 0.5 ? K : K2)));
    bot.push(M.v(Math.sin(a) * r, Math.cos(a * 1.3) * 0.04 - 0.01, Math.cos(a) * r, K));
  }
  const c0 = M.v(0, 0.03, 0, RIB), c1 = M.v(0, 0.02, 0, K);
  for (let k = 0; k < n; k++) { M.tri(c0, top[k + 1], top[k]); M.tri(c1, bot[k], bot[k + 1]); }
  ctr.push(c0);
  for (const k of [2, 5]) {                          // 살(가는 뼈대)
    const a = -0.9 + k / n * 1.8, r = S * 0.8;
    tube(M, [[0, 0.04, 0, 0.022, RIB], [Math.sin(a) * r, 0.06, Math.cos(a) * r, 0.012, RIB]], 3);
  }
  return M.done();
}

/* ───────── 높이 격자 — 걷기 높이 = 그려진 땅과 같은 삼각형 보간(전체 순회 X · O(1)) ───────── */
export function createGrid(x0, z0, step, nx, nz) {
  const h = new Float32Array(nx * nz), G = { x0, z0, step, nx, nz, h, inv: 1 / step };
  G.fill = (fn) => { for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) h[j * nx + i] = fn(x0 + i * step, z0 + j * step, i, j); return G; };
  G.get = (i, j) => h[clamp(j, 0, nz - 1) * nx + clamp(i, 0, nx - 1)];
  G.at = (x, z) => {
    let fx = (x - x0) * G.inv, fz = (z - z0) * G.inv;
    fx = fx < 0 ? 0 : fx > nx - 1.001 ? nx - 1.001 : fx; fz = fz < 0 ? 0 : fz > nz - 1.001 ? nz - 1.001 : fz;
    const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * nx + i;
    const a = h[k], b = h[k + 1], c = h[k + nx], d = h[k + nx + 1];
    return u + v <= 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v);   // 대각선 b–c(그린 땅과 같음)
  };
  G.normal = (i, j, o) => {                          // 가운데 차분 법선(청크 경계에서도 이어짐)
    const sx = G.get(i + 1, j) - G.get(i - 1, j), sz = G.get(i, j + 1) - G.get(i, j - 1), l = Math.hypot(sx, 2 * step, sz);
    o[0] = -sx / l; o[1] = 2 * step / l; o[2] = -sz / l; return o;
  };
  return G;
}

/* 격자 흐리기(가로·세로 상자 흐림 pass번) — 길 바닥 높이가 갈래·빈터 경계에서 계단지지 않게 */
export function blurGrid(G, r, pass = 2) {
  const { nx, nz } = G, tmp = new Float32Array(nx * nz);
  for (let p = 0; p < pass; p++) for (const dir of [0, 1]) {
    const src = G.h, n1 = dir ? nz : nx, n2 = dir ? nx : nz;
    for (let b = 0; b < n2; b++) {
      let acc = 0, cnt = 0; const at = (a) => (dir ? a * nx + b : b * nx + a);
      for (let a = -r; a <= r; a++) if (a >= 0 && a < n1) { acc += src[at(a)]; cnt++; }
      for (let a = 0; a < n1; a++) { tmp[at(a)] = acc / cnt; const o = a - r, i = a + r + 1; if (o >= 0) { acc -= src[at(o)]; cnt--; } if (i < n1) { acc += src[at(i)]; cnt++; } }
    }
    G.h.set(tmp);
  }
  return G;
}

/* ───────── 청크 굽개 — put(원형, 행렬, 색배수, 'near'|'far'|'both') → build(group) ───────── */
class Buf {
  constructor() { this.p = new Float32Array(3 * 4096); this.n = new Float32Array(3 * 4096); this.c = new Float32Array(3 * 4096); this.i = new Uint32Array(6 * 4096); this.nv = 0; this.ni = 0; }
  room(v, i) {
    if ((this.nv + v) * 3 > this.p.length) { const L = Math.max(this.p.length * 2, (this.nv + v) * 3); for (const k of ['p', 'n', 'c']) { const a = new Float32Array(L); a.set(this[k]); this[k] = a; } }
    if (this.ni + i > this.i.length) { const a = new Uint32Array(Math.max(this.i.length * 2, this.ni + i)); a.set(this.i); this.i = a; }
  }
}
export function createBuilder({ x0, z0, size, nx, nz, far = 0 }) {
  const chunks = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) chunks.push({ i, j, cx: x0 + (i + 0.5) * size, cz: z0 + (j + 0.5) * size, near: new Buf(), far: far ? new Buf() : null });
  const pick = (x, z) => chunks[clamp(Math.floor((z - z0) / size), 0, nz - 1) * nx + clamp(Math.floor((x - x0) / size), 0, nx - 1)];
  const B = { chunks, size, far, tris: 0 };
  function into(buf, ch, g, m, tint, paint) {
    buf.room(g.nv, g.idx.length);
    const e = m.elements, P = buf.p, N = buf.n, Cc = buf.c, o = buf.nv * 3, cx = ch.cx, cz = ch.cz;
    /* 법선 = 역전치(크기가 축마다 달라도 맞게) */
    const a00 = e[0], a01 = e[4], a02 = e[8], a10 = e[1], a11 = e[5], a12 = e[9], a20 = e[2], a21 = e[6], a22 = e[10];
    const b01 = a22 * a11 - a12 * a21, b11 = -a22 * a10 + a12 * a20, b21 = a21 * a10 - a11 * a20, det = a00 * b01 + a01 * b11 + a02 * b21 || 1e-9, id = 1 / det;
    const n00 = b01 * id, n01 = b11 * id, n02 = b21 * id, n10 = (-a22 * a01 + a02 * a21) * id, n11 = (a22 * a00 - a02 * a20) * id, n12 = (-a21 * a00 + a01 * a20) * id, n20 = (a12 * a01 - a02 * a11) * id, n21 = (-a12 * a00 + a02 * a10) * id, n22 = (a11 * a00 - a01 * a10) * id;
    const tr = tint ? tint[0] : 1, tg = tint ? tint[1] : 1, tb = tint ? tint[2] : 1, pc = [0, 0, 0];
    for (let k = 0; k < g.nv; k++) {
      const q = k * 3, x = g.pos[q], y = g.pos[q + 1], z = g.pos[q + 2], nxx = g.nor[q], nyy = g.nor[q + 1], nzz = g.nor[q + 2];
      const wx = e[0] * x + e[4] * y + e[8] * z + e[12], wy = e[1] * x + e[5] * y + e[9] * z + e[13], wz = e[2] * x + e[6] * y + e[10] * z + e[14];
      P[o + q] = wx - cx; P[o + q + 1] = wy; P[o + q + 2] = wz - cz;
      let mx = n00 * nxx + n01 * nyy + n02 * nzz, my = n10 * nxx + n11 * nyy + n12 * nzz, mz = n20 * nxx + n21 * nyy + n22 * nzz;
      const l = Math.hypot(mx, my, mz) || 1; N[o + q] = mx / l; N[o + q + 1] = my / l; N[o + q + 2] = mz / l;
      pc[0] = g.col[q] * tr; pc[1] = g.col[q + 1] * tg; pc[2] = g.col[q + 2] * tb;
      if (paint) paint(wx, wy, wz, pc);
      Cc[o + q] = pc[0]; Cc[o + q + 1] = pc[1]; Cc[o + q + 2] = pc[2];
    }
    const I = buf.i, base = buf.nv; for (let k = 0; k < g.idx.length; k++) I[buf.ni + k] = g.idx[k] + base;
    buf.nv += g.nv; buf.ni += g.idx.length;
  }
  /* where: 'near'(가까운 판만) · 'far'(먼 판만) · 'both' · x,z = 이 물건이 속한 청크를 고르는 자리(기본 = 행렬 위치) */
  B.put = (g, m, tint, where = 'near', paint = null, x = m.elements[12], z = m.elements[14]) => {
    const ch = pick(x, z);
    if (where !== 'far') into(ch.near, ch, g, m, tint, paint);
    if (where !== 'near' && ch.far) into(ch.far, ch, g, m, tint, paint);
  };
  /* 땅 격자 — G(createGrid)의 칸 [i0,i1)×[j0,j1)을 청크마다 · colAt(x,y,z,i,j,out) 정점색 · skip(i,j) = 그 칸을 비움 · farStep = 먼 판에선 칸을 성기게 */
  B.ground = (G, colAt, skip = null, farStep = 2) => {
    const nrm = [0, 0, 0], cc = [0, 0, 0];
    for (const ch of chunks) {
      const bx0 = ch.cx - size / 2, bz0 = ch.cz - size / 2;
      const i0 = clamp(Math.round((bx0 - G.x0) / G.step), 0, G.nx - 1), i1 = clamp(Math.round((bx0 + size - G.x0) / G.step), 0, G.nx - 1);
      const j0 = clamp(Math.round((bz0 - G.z0) / G.step), 0, G.nz - 1), j1 = clamp(Math.round((bz0 + size - G.z0) / G.step), 0, G.nz - 1);
      if (i1 <= i0 || j1 <= j0) continue;
      for (const [buf, st] of [[ch.near, 1], [ch.far, farStep]]) {
        if (!buf) continue;
        const W = Math.ceil((i1 - i0) / st) + 1, Hh = Math.ceil((j1 - j0) / st) + 1;
        buf.room(W * Hh, W * Hh * 6);
        const base = buf.nv;
        for (let jj = 0; jj < Hh; jj++) for (let ii = 0; ii < W; ii++) {
          const i = Math.min(i1, i0 + ii * st), j = Math.min(j1, j0 + jj * st), x = G.x0 + i * G.step, z = G.z0 + j * G.step, y = G.get(i, j), q = buf.nv * 3;
          G.normal(i, j, nrm); colAt(x, y, z, i, j, cc);
          buf.p[q] = x - ch.cx; buf.p[q + 1] = y; buf.p[q + 2] = z - ch.cz; buf.n[q] = nrm[0]; buf.n[q + 1] = nrm[1]; buf.n[q + 2] = nrm[2]; buf.c[q] = cc[0]; buf.c[q + 1] = cc[1]; buf.c[q + 2] = cc[2];
          buf.nv++;
        }
        for (let jj = 0; jj < Hh - 1; jj++) for (let ii = 0; ii < W - 1; ii++) {
          if (skip && skip(i0 + ii * st, j0 + jj * st)) continue;
          const a = base + jj * W + ii, b = a + 1, c = a + W, d = c + 1, I = buf.i, k = buf.ni;
          I[k] = a; I[k + 1] = c; I[k + 2] = b; I[k + 3] = b; I[k + 4] = c; I[k + 5] = d; buf.ni += 6;
        }
        if (st > 1) {                                   // 성긴 판 = 가장자리에 1.5m 치마(옆 청크의 촘촘한 땅과 사이 틈을 가림)
          const edges = [[...Array(W).keys()].map((ii) => ii), [...Array(W).keys()].map((ii) => (Hh - 1) * W + W - 1 - ii), [...Array(Hh).keys()].map((jj) => (Hh - 1 - jj) * W), [...Array(Hh).keys()].map((jj) => jj * W + W - 1)];
          for (const E of edges) {
            buf.room(E.length, E.length * 12);
            const sb = buf.nv;
            for (const e of E) { const q0 = (base + e) * 3, q = buf.nv * 3; buf.p[q] = buf.p[q0]; buf.p[q + 1] = buf.p[q0 + 1] - 1.5; buf.p[q + 2] = buf.p[q0 + 2]; buf.n[q] = buf.n[q0]; buf.n[q + 1] = buf.n[q0 + 1]; buf.n[q + 2] = buf.n[q0 + 2]; buf.c[q] = buf.c[q0]; buf.c[q + 1] = buf.c[q0 + 1]; buf.c[q + 2] = buf.c[q0 + 2]; buf.nv++; }
            for (let k2 = 0; k2 < E.length - 1; k2++) { const a = base + E[k2], b = base + E[k2 + 1], c = sb + k2, d = sb + k2 + 1, I = buf.i, k = buf.ni; I[k] = a; I[k + 1] = c; I[k + 2] = b; I[k + 3] = b; I[k + 4] = c; I[k + 5] = d; I[k + 6] = a; I[k + 7] = b; I[k + 8] = c; I[k + 9] = b; I[k + 10] = d; I[k + 11] = c; buf.ni += 12; }
          }
        }
      }
    }
  };
  /* 굽기 뒤에 정점색을 한 번 더 고침(해 그늘 굽기 등) — fn(x,y,z, nx,ny,nz, col) */
  B.repaint = (fn) => {
    const c = [0, 0, 0];
    for (const ch of chunks) for (const buf of [ch.near, ch.far]) {
      if (!buf) continue;
      for (let k = 0; k < buf.nv; k++) { const q = k * 3; c[0] = buf.c[q]; c[1] = buf.c[q + 1]; c[2] = buf.c[q + 2]; fn(buf.p[q] + ch.cx, buf.p[q + 1], buf.p[q + 2] + ch.cz, buf.n[q], buf.n[q + 1], buf.n[q + 2], c); buf.c[q] = c[0]; buf.c[q + 1] = c[1]; buf.c[q + 2] = c[2]; }
    }
  };
  /* 만들기 — 청크 하나 = 메시 하나(가까운 판) · far면 THREE.LOD(가까움 → farDist 넘으면 먼 판) */
  B.build = (group, farDist = 110) => {
    const mat = toon({ vc: true }), out = [];
    const mk = (buf, ch) => {
      if (!buf || !buf.ni) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(buf.p.slice(0, buf.nv * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(buf.n.slice(0, buf.nv * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(buf.c.slice(0, buf.nv * 3), 3));
      g.setIndex(new THREE.BufferAttribute(buf.nv < 65535 ? new Uint16Array(buf.i.subarray(0, buf.ni)) : buf.i.slice(0, buf.ni), 1));
      g.computeBoundingSphere(); B.tris += buf.ni / 3;
      const m = new THREE.Mesh(g, mat); m.matrixAutoUpdate = false; return m;
    };
    for (const ch of chunks) {
      const a = mk(ch.near, ch), b = mk(ch.far, ch);
      ch.near = ch.far = null;                        // 짓기 버퍼는 버림(메모리)
      if (!a && !b) continue;
      let o;
      if (a && b) { o = new THREE.LOD(); o.addLevel(a, 0); o.addLevel(b, farDist); }
      else o = a || b;
      o.position.set(ch.cx, 0, ch.cz); o.updateMatrix(); o.updateMatrixWorld(true); o.matrixAutoUpdate = false;
      if (o.isLOD) for (const l of o.levels) { l.object.updateMatrixWorld(true); }
      group.add(o); out.push(o);
    }
    return out;
  };
  return B;
}

/* 행렬 짓기(짓기 때만 · 스크래치 재사용) — 자리·앞(yaw)·기울기(tx,tz)·크기 */
const _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler(), _p4 = new THREE.Vector3(), _s4 = new THREE.Vector3();
export function mat4(x, y, z, yaw = 0, sx = 1, sy = sx, sz = sx, tiltX = 0, tiltZ = 0) {
  _e4.set(tiltX, yaw, tiltZ, 'YXZ'); _q4.setFromEuler(_e4); _p4.set(x, y, z); _s4.set(sx, sy, sz);
  return _m4.compose(_p4, _q4, _s4);
}
/* 누운 것(쓰러진 나무 윗동) — 원형의 위(+Y)를 yaw 쪽 수평으로 눕힘 · lift = 끝 들림(라디안) */
export function matLay(x, y, z, yaw, s = 1, lift = 0.06, roll = 0) {
  _e4.set(Math.PI / 2 - lift, yaw, roll, 'YXZ'); _q4.setFromEuler(_e4); _p4.set(x, y, z); _s4.set(s, s, s);
  return _m4.compose(_p4, _q4, _s4);
}

/* ───────── 벽 선분 — 마칭 스퀘어(값 < 0 = 걸을 수 있음)로 경계선을 잘게 → 거의 곧은 이웃끼리 이어 붙임 ───────── */
export function contourWalls(val, x0, z0, step, nx, nz) {
  const segs = [], V = (i, j) => val[j * nx + i];
  const ip = (ax, az, va, bx, bz, vb) => { const t = va / (va - vb); return [ax + (bx - ax) * t, az + (bz - az) * t]; };
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = V(i, j), b = V(i + 1, j), c = V(i + 1, j + 1), d = V(i, j + 1);
    const k = (a >= 0 ? 1 : 0) | (b >= 0 ? 2 : 0) | (c >= 0 ? 4 : 0) | (d >= 0 ? 8 : 0);
    if (k === 0 || k === 15) continue;
    const x = x0 + i * step, z = z0 + j * step, s = step;
    const T = () => ip(x, z, a, x + s, z, b), R = () => ip(x + s, z, b, x + s, z + s, c), Bm = () => ip(x, z + s, d, x + s, z + s, c), L = () => ip(x, z, a, x, z + s, d);
    const add = (p, q) => segs.push([p[0], p[1], q[0], q[1]]);
    switch (k) {
      case 1: case 14: add(L(), T()); break;
      case 2: case 13: add(T(), R()); break;
      case 3: case 12: add(L(), R()); break;
      case 4: case 11: add(R(), Bm()); break;
      case 6: case 9: add(T(), Bm()); break;
      case 7: case 8: add(L(), Bm()); break;
      case 5: { const m = (a + b + c + d) / 4; if (m >= 0) { add(L(), Bm()); add(T(), R()); } else { add(L(), T()); add(R(), Bm()); } break; }
      case 10: { const m = (a + b + c + d) / 4; if (m >= 0) { add(L(), T()); add(R(), Bm()); } else { add(T(), R()); add(L(), Bm()); } break; }
    }
  }
  return joinSegs(segs);
}
/* 끝이 맞닿고 방향이 거의 같은 선분을 이어 개수를 줄임(충돌 칸이 가벼워짐) */
export function joinSegs(segs, maxLen = 4, cosMin = 0.995) {
  const key = (x, z) => Math.round(x * 100) + ',' + Math.round(z * 100), at = new Map();
  segs.forEach((s, k) => { for (const e of [0, 1]) { const kk = key(s[e * 2], s[e * 2 + 1]); let a = at.get(kk); if (!a) at.set(kk, a = []); a.push(k); } });
  const used = new Uint8Array(segs.length), out = [];
  for (let k = 0; k < segs.length; k++) {
    if (used[k]) continue; used[k] = 1;
    let [ax, az, bx, bz] = segs[k];
    for (let guard = 0; guard < 64; guard++) {         // b쪽으로 늘리기
      const cand = at.get(key(bx, bz)); let ext = false;
      if (cand) for (const q of cand) {
        if (used[q]) continue; const s = segs[q]; let nx, nz;
        if (key(s[0], s[1]) === key(bx, bz)) { nx = s[2]; nz = s[3]; } else { nx = s[0]; nz = s[1]; }
        const d1x = bx - ax, d1z = bz - az, d2x = nx - bx, d2z = nz - bz, l1 = Math.hypot(d1x, d1z), l2 = Math.hypot(d2x, d2z);
        if (l1 < 1e-6 || l2 < 1e-6 || (d1x * d2x + d1z * d2z) / (l1 * l2) < cosMin || Math.hypot(nx - ax, nz - az) > maxLen) continue;
        used[q] = 1; bx = nx; bz = nz; ext = true; break;
      }
      if (!ext) break;
    }
    if (Math.hypot(bx - ax, bz - az) > 1e-4) out.push([ax, az, bx, bz]);
  }
  return out;
}
/* 닫힌 꺾은선 → 벽 선분 */
export function loopWalls(pts, closed = true) {
  const out = []; for (let k = 0; k < pts.length - (closed ? 0 : 1); k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; out.push([a[0], a[1], b[0], b[1]]); }
  return out;
}
/* 점 → 꺾은선까지 거리(t = 몇 번째 마디 + 비율) */
export function polyDist(pts, x, z, out) {
  let best = 1e9, bt = 0;
  for (let k = 0; k < pts.length - 1; k++) {
    const ax = pts[k][0], az = pts[k][1], ex = pts[k + 1][0] - ax, ez = pts[k + 1][1] - az, L2 = ex * ex + ez * ez || 1e-9;
    let t = ((x - ax) * ex + (z - az) * ez) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const d = Math.hypot(x - ax - ex * t, z - az - ez * t); if (d < best) { best = d; bt = k + t; }
  }
  if (out) { out.d = best; out.t = bt; }
  return best;
}
/* 꺾은선 고르게 다시 뽑기(step m) — 길이 함께 */
export function resample(pts, step) {
  const out = [[pts[0][0], pts[0][1]]]; let carry = 0;
  for (let k = 0; k < pts.length - 1; k++) {
    const ax = pts[k][0], az = pts[k][1], bx = pts[k + 1][0], bz = pts[k + 1][1], L = Math.hypot(bx - ax, bz - az);
    let s = step - carry;
    while (s <= L) { out.push([ax + (bx - ax) * s / L, az + (bz - az) * s / L]); s += step; }
    carry = L - (s - step);
  }
  const l = pts[pts.length - 1]; if (Math.hypot(out[out.length - 1][0] - l[0], out[out.length - 1][1] - l[1]) > step * 0.3) out.push([l[0], l[1]]);
  return out;
}
export function polyLen(pts) { let L = 0; for (let k = 0; k < pts.length - 1; k++) L += Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); return L; }
/* 꺾은선 위 거리 s의 점과 방향 */
export function polyAt(pts, s, o = { x: 0, z: 0, dx: 0, dz: 1 }) {
  for (let k = 0; k < pts.length - 1; k++) {
    const ax = pts[k][0], az = pts[k][1], ex = pts[k + 1][0] - ax, ez = pts[k + 1][1] - az, L = Math.hypot(ex, ez);
    if (s <= L || k === pts.length - 2) { const t = clamp(s / (L || 1), 0, 1); o.x = ax + ex * t; o.z = az + ez * t; o.dx = ex / (L || 1); o.dz = ez / (L || 1); return o; }
    s -= L;
  }
  return o;
}

/* ───────── 물 — 불투명 셰이더 하나(호수·개울 같이) · aD = 깊이(0 가장자리 ~ 1 깊음) · aF = 흐름(m/초) · 안개는 kit와 같은 식 ───────── */
const FOG_W = `
uniform vec3 uFogSun; uniform float uSunFog; uniform float uFogBase; uniform float uFogFall; uniform float uFogLow; uniform vec3 uSunDir;
vec3 drgFog(vec3 col, vec3 wp, float depth) {
  float f = smoothstep(fogNear, fogFar, depth);
  float h = exp(-max(wp.y - uFogBase, 0.0) * uFogFall);
  f = clamp(max(f, h * uFogLow * smoothstep(0.0, fogNear, depth)), 0.0, 1.0);
  float s = pow(max(dot(normalize(wp - cameraPosition), uSunDir), 0.0), 6.0) * uSunFog;
  return mix(col, mix(fogColor, uFogSun, s), f);
}`;
export function waterMat(o = {}) {
  const m = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      deep: { value: new THREE.Color(o.deep ?? 0x24453f) }, shallow: { value: new THREE.Color(o.shallow ?? 0x5a857a) }, edge: { value: new THREE.Color(o.edge ?? 0xb4c8bc) }, skyCol: { value: new THREE.Color(o.sky ?? 0xb4c2c6) },
    }]),
    vertexShader: `attribute float aD; attribute vec2 aF; varying float vD; varying vec2 vF; varying vec3 vW; varying float vFogDepth;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vD = aD; vF = aF; vec4 mv = viewMatrix * w; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uTime; uniform vec3 deep; uniform vec3 shallow; uniform vec3 edge; uniform vec3 skyCol;
      #include <fog_pars_fragment>
      ${FOG_W}
      varying float vD; varying vec2 vF; varying vec3 vW;
      void main(){
        vec2 p = vW.xz - vF * uTime;
        float r1 = sin(p.x * 1.3 + p.y * 0.5 + uTime * 1.1) * sin(p.y * 1.6 - p.x * 0.35 - uTime * 0.9);
        float r2 = sin(p.x * 3.7 - p.y * 2.9 + uTime * 2.1) * 0.5 + sin(p.y * 4.3 + p.x * 1.1 - uTime * 1.7) * 0.5;
        float rip = r1 * 0.6 + r2 * 0.4;
        vec3 c = mix(shallow, deep, smoothstep(0.0, 1.0, vD));
        vec3 v = normalize(cameraPosition - vW);
        float fr = pow(1.0 - clamp(v.y, 0.0, 1.0), 3.0);
        c = mix(c, skyCol, fr * 0.5 + 0.06);
        c += vec3(0.9, 0.95, 1.0) * smoothstep(0.62, 0.95, rip) * (0.05 + fr * 0.08);
        vec3 n = normalize(vec3(r1 * 0.07, 1.0, r2 * 0.07));
        c += uFogSun * smoothstep(0.965, 0.99, max(dot(reflect(-uSunDir, n), v), 0.0)) * 0.3;
        c = mix(edge, c, smoothstep(0.0, 0.2, vD + rip * 0.025));
        gl_FragColor = vec4(drgFog(c, vW, vFogDepth), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  Object.assign(m.uniforms, { uTime: U.uTime, uSunDir: U.uSunDir, uFogSun: U.uFogSun, uSunFog: U.uSunFog, uFogBase: U.uFogBase, uFogFall: U.uFogFall, uFogLow: U.uFogLow });
  return m;
}
/* 개울 띠 — pts = [[x,z]...] 위→아래(흐름 방향) · yAt(s) 물높이 · wAt(s) 반폭 · deepAt(x,z) 깊이 0~1 */
export function streamGeo(pts, yAt, wAt, speed = 0.8) {
  const P = [], D = [], F = [], I = [], L = polyLen(pts), n = Math.max(2, Math.ceil(L / 1.5)), o = {};
  for (let k = 0; k <= n; k++) {
    const s = k / n * L; polyAt(pts, s, o); const w = wAt(s), y = yAt(s), px = -o.dz, pz = o.dx;
    for (const e of [-1, -0.45, 0, 0.45, 1]) { P.push(o.x + px * w * e, y, o.z + pz * w * e); D.push(1 - Math.abs(e) ** 1.5); F.push(o.dx * speed, o.dz * speed); }
  }
  for (let k = 0; k < n; k++) for (let e = 0; e < 4; e++) { const a = k * 5 + e, b = a + 1, c = a + 5, d = c + 1; I.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 1)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 2)); g.setIndex(I); g.computeBoundingSphere();
  return g;
}
/* 호수 판 — 가운데(x,z) 반지름 r(+가장자리 넘침) · 물높이 y · bed(x,z) = 바닥 높이(깊이로 aD) */
export function lakeGeo(x, z, r, y, bed, rings = 9, seg = 56) {
  const P = [x, y, z], D = [1], F = [0, 0], I = [];
  for (let k = 1; k <= rings; k++) for (let j = 0; j < seg; j++) {
    const a = j / seg * TAU, rr = r * k / rings * 1.12, px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr;
    P.push(px, y, pz); D.push(clamp((y - bed(px, pz)) / 1.6, 0, 1)); F.push(-Math.sin(a) * 0.05, Math.cos(a) * 0.05);
  }
  for (let j = 0; j < seg; j++) I.push(0, 1 + (j + 1) % seg, 1 + j);
  for (let k = 1; k < rings; k++) for (let j = 0; j < seg; j++) { const a = 1 + (k - 1) * seg + j, b = 1 + (k - 1) * seg + (j + 1) % seg, c = 1 + k * seg + j, d = 1 + k * seg + (j + 1) % seg; I.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 1)); g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 2)); g.setIndex(I); g.computeBoundingSphere();
  return g;
}

/* ───────── 해 그늘 굽기 — 해 쪽으로 높이 격자를 따라가다 막히면 어둡게(그림자 지도 없이 · 때를 정해 지을 때 한 번) ───────── */
export function sunShade(occ, sunDir, o = {}) {        // occ = createGrid(가리는 높이) · 돌려줌 = (x,y,z) → 0(그늘)~1(햇빛)
  const sx = sunDir[0], sy = sunDir[1], sz = sunDir[2], hl = Math.hypot(sx, sz) || 1e-6, dx = sx / hl, dz = sz / hl, rise = sy / hl, step = o.step || 1.5, maxD = o.max || 220, soft = o.soft || 1.6, top = o.top ?? 60;
  return (x, y, z) => {
    let vis = 1;
    for (let d = step; d < maxD; d += step) {
      const ry = y + 0.4 + rise * d; if (ry > top) break;
      const h = occ.at(x + dx * d, z + dz * d), k = (ry - h) / soft;
      if (k < vis) { vis = k; if (vis <= 0) return 0; }
    }
    return clamp(vis, 0, 1);
  };
}

/* 캣멀롬 곡선(조절점을 지남) — step m마다 점 */
export function spline(ctrl, step = 1) {
  const out = [];
  for (let k = 0; k < ctrl.length - 1; k++) {
    const p0 = ctrl[Math.max(0, k - 1)], p1 = ctrl[k], p2 = ctrl[k + 1], p3 = ctrl[Math.min(ctrl.length - 1, k + 2)], n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const l = ctrl[ctrl.length - 1]; out.push([l[0], l[1]]);
  return out;
}
/* 거리 밭 — 꺾은선 둘레 margin m 안 칸만 칠함(칸 × 선 전체를 돌지 않음) · d = 거리 − 반폭 · v = 가장 가까운 점의 값(보간) · 칠하지 않은 칸 = margin */
export function distField(spec, lines, margin) {
  const { x0, z0, step, nx, nz } = spec, d = new Float32Array(nx * nz).fill(margin), v = new Float32Array(nx * nz), t = new Float32Array(nx * nz).fill(-1);
  lines.forEach((L, li) => {
    const P = L.pts;
    for (let k = 0; k < P.length - 1; k++) {
      const ax = P[k][0], az = P[k][1], ex = P[k + 1][0] - ax, ez = P[k + 1][1] - az, L2 = ex * ex + ez * ez || 1e-9, ha = L.hw ? L.hw[k] : 0, hb = L.hw ? L.hw[k + 1] : 0, va = L.val ? L.val[k] : 0, vb = L.val ? L.val[k + 1] : 0;
      const m = margin + Math.max(ha, hb);
      const i0 = Math.max(0, Math.floor((Math.min(ax, ax + ex) - m - x0) / step)), i1 = Math.min(nx - 1, Math.ceil((Math.max(ax, ax + ex) + m - x0) / step));
      const j0 = Math.max(0, Math.floor((Math.min(az, az + ez) - m - z0) / step)), j1 = Math.min(nz - 1, Math.ceil((Math.max(az, az + ez) + m - z0) / step));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const x = x0 + i * step, z = z0 + j * step; let u = ((x - ax) * ex + (z - az) * ez) / L2; u = u < 0 ? 0 : u > 1 ? 1 : u;
        const dd = Math.hypot(x - ax - ex * u, z - az - ez * u) - (ha + (hb - ha) * u), q = j * nx + i;
        if (dd < d[q]) { d[q] = dd; v[q] = va + (vb - va) * u; t[q] = li * 100000 + k + u; }
      }
    }
  });
  return { d, v, t };
}
const CHIP = C3(0xe2cf9c), CHIP2 = C3(0xb89a68);
/* 생나무 부스러기 — 부러진 밑동 둘레에 흩어진 옅은 조각(안개 속에서 눈길을 끄는 밝은 점) */
export function chipsGeo(seed, n = 12, R = 1.6) {
  const M = new Mesher();
  for (let k = 0; k < n; k++) {
    const a = hash(seed, k) * TAU, r = Math.sqrt(hash(seed, k, 2)) * R, x = Math.cos(a) * r, z = Math.sin(a) * r, L = 0.12 + hash(seed, k, 3) * 0.3, b = hash(seed, k, 4) * TAU, w = 0.04;
    const c = hash(seed, k, 5) > 0.4 ? CHIP : CHIP2, ux = Math.cos(b) * L, uz = Math.sin(b) * L, px = -Math.sin(b) * w, pz = Math.cos(b) * w;
    const p0 = M.v(x - ux, 0.03, z - uz, c), p1 = M.v(x + px, 0.06, z + pz, c), p2 = M.v(x + ux, 0.03, z + uz, c), p3 = M.v(x - px, 0.05, z - pz, c);
    M.tri(p0, p1, p2); M.tri(p0, p2, p3);
  }
  return M.done();
}
const CAP = C3(0xa8622e), CAP2 = C3(0xc98a48), GILL = C3(0xe6d6b0);
/* 버섯 무리 — 그루터기·통나무 밑의 작은 갈색 갓 셋~다섯(그림책 잔재미 · 숲 바닥 색 점) */
export function mushroomGeo(seed, n = 4) {
  const M = new Mesher();
  for (let k = 0; k < n; k++) {
    const a = hash(seed, k) * TAU, d = k ? 0.08 + hash(seed, k, 2) * 0.18 : 0, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 0.07 + hash(seed, k, 3) * 0.1, r = 0.04 + hash(seed, k, 4) * 0.05;
    tube(M, [[x, -0.02, z, r * 0.3, GILL], [x, h, z, r * 0.25, GILL]], 4);
    lathe(M, [[0.01, h + r * 0.8], [r * 0.7, h + r * 0.55], [r, h + 0.005], [0.02, h - 0.01]], 6, (kk) => [1, 0, kk === 0 ? CAP : kk === 1 ? mixc(CAP, CAP2, hash(seed, k, 5)) : kk === 2 ? CAP2 : GILL], 0, x, z);
  }
  return M.done();
}
const BUSH_A = C3(0x2f4527), BUSH_B = C3(0x4a6436), BUSH_U = C3(0x1d2a1a);
/* 덤불(빽빽한 떨기나무) — 낮고 넓은 잎 덩어리 둘~셋 · 길 가장자리를 '못 지나감'으로 읽히게 */
export function bushGeo(seed, o = {}) {
  const M = new Mesher(), n = o.n || 3;
  for (let b = 0; b < n; b++) {
    const a = hash(seed, b) * TAU, d = b ? 0.5 + hash(seed, b, 2) * 0.5 : 0, r = (b ? 0.7 : 1) * (0.85 + hash(seed, b, 3) * 0.3), sd = seed * 5 + b;
    blob(M, Math.cos(a) * d, r * 0.45, Math.sin(a) * d, r, r * 0.72, r, 1, (v) => 0.78 + noise3(v[0] * 2.6 + sd, v[1] * 2.6, v[2] * 2.6) * 0.45, (v) => (v[1] < -0.35 ? BUSH_U : mixc(BUSH_A, BUSH_B, clamp(v[1] * 0.7 + 0.3 + (hash(sd, Math.round(v[0] * 7), Math.round(v[2] * 7)) - 0.5) * 0.5, 0, 1))));
  }
  return M.done();
}

/* 짓는 동안 잠깐 숨 돌리기(크롬북에서 한 번에 오래 막히지 않게 — 덮개 그림이 멈추지 않음) */
export const breathe = () => new Promise((r) => setTimeout(r, 0));
