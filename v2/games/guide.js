// 🧭 길잡이(GUIDE-2 · 10-05 사용자 '길잡이 ㄱ' — 창의 놀이 제안 ③ · 장소 = 운동장에 세운 '지도 마을'(학교 안은 복도 2.5m라 '북쪽으로 10m'가 벽에 막힘))
//   구조 = 🧭 길잡이(지도 — 기호·범례·방위표·축척 · 보물·함정이 보임) ↔ 🚶 탐험가(3인칭 — 보물·함정 안 보임 · 위 나침반 띠 · 바닥 흰 선 = 5m 칸)
//   참고: 오리엔티어링(지도·나침반으로 체크포인트 찾기 · 지도 기호와 범례) · Keep Talking and Nobody Explodes(한쪽만 설명서를 보고 말로 이끌기 — 판마다 역할 바꾸기)
//   4학년 사회 지도 단원과 이어짐: 방위(동서남북 — 방위표) · 기호와 범례 · 축척(1칸 = 5m)
//   한 판 60초: 보물 3개 · 함정 5개(밟으면 한 칸 뒤로 · −20) · 보물 +100 · 다 찾으면 남은 초 × 2 · 길잡이 말 = '북쪽으로 2칸(10m)!'(방위 → 칸 수 두 번 누르기 · 화살표·1~4)
//   혼자: 🚶 탐험가(길잡이 봇이 말해 줌) · 🧭 길잡이(내 말을 글자 그대로 따르는 탐험 로봇 — 길을 잘못 말하면 함정에 빠지거나 막힘)
//   친구와(방 놀이 🧭 — 선생님이 👥 창에서 고름): 둘씩 한 팀(홀수면 셋 = 탐험가 둘) · 판마다 역할 바꿈 · 팀마다 보물·함정이 따로(같은 마을)
export const meta = { id: 'guide', title: '길잡이', api: 1 };
import { createStandings } from '../js/standings.js?v=1';   // RANK-1: 친구 대결 팀 순위표(판마다 · 📊 칩 · B)

export const BAL = { count: 3, play: 60, end: 5, tre: 3, traps: 5, pickR: 1.9, trapR: 1.5, v: 3.2, tour: 10 };   // tour = 출발 → 보물 셋을 도는 길 상한(칸) — 시뮬레이션(60초): 보통 짝꿍 90%가 셋 다 · 느린 짝꿍 44%(평균 2.3개) · 처음 14%(1.6개) · 12칸이면 80·24·4%
const CELL = 5, COLS = 12, ROWS = 6, X0 = -34, Z0 = 1, GY = -1.35;   // 지도 마을 = 운동장 x −34~26 · z 1~31(서쪽 골대 x −35 · 동쪽 골대 x 26.8 사이 — 막힌 것 0)
const cx = c => X0 + c * CELL + CELL / 2, cz = r => Z0 + r * CELL + CELL / 2;
const cellOf = (x, z) => [Math.floor((x - X0) / CELL), Math.floor((z - Z0) / CELL)];
const inGrid = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS;
export const DIRS = [{ t: '북', a: '⬆', dc: 0, dr: -1 }, { t: '동', a: '➡', dc: 1, dr: 0 }, { t: '남', a: '⬇', dc: 0, dr: 1 }, { t: '서', a: '⬅', dc: -1, dr: 0 }];
const PHR = { 90: '✋ 멈춰!', 91: '👍 잘했어!', 92: '⚠ 함정 조심!', 93: '🎯 거의 다 왔어! 칸 가운데로 가요' };   // 93 = 길잡이 봇만(보물 칸 가장자리에 선 탐험가 — UX-1 GD-3)
export const msgText = n => (n >= 90 ? PHR[n] || '' : DIRS[Math.floor(n / 10)].t + '쪽으로 ' + (n % 10) + '칸(' + (n % 10) * CELL + 'm)!');
const jong = n => { const c = n.charCodeAt(n.length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 > 0; }, iga = n => n + (jong(n) ? '이' : '가');   // 받침 조사(UX-1 GD-16 · '학교이(가)' → '학교가')

// ---------- 지도 마을(고정) — 칸 [열 c(서→동 0~11), 줄 r(북→남 0~5)] ----------
export const LM = [
  { k: 'mount', n: '산', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], block: true },
  { k: 'forest', n: '숲', cells: [[9, 0], [10, 0]], block: true },
  { k: 'river', n: '강', cells: [[6, 0], [6, 2], [6, 3], [6, 5]], block: true },
  { k: 'bridge', n: '다리', cells: [[6, 1], [6, 4]] },
  { k: 'school', n: '학교', cells: [[2, 3]], block: true },
  { k: 'hospital', n: '병원', cells: [[9, 3]], block: true },
  { k: 'post', n: '우체국', cells: [[4, 1]], block: true },
  { k: 'fire', n: '소방서', cells: [[8, 5]], block: true },
  { k: 'orchard', n: '과수원', cells: [[10, 4], [11, 4], [10, 5], [11, 5]], block: true },
  { k: 'paddy', n: '논', cells: [[0, 4], [1, 4], [0, 5], [1, 5]] },
];
export const START = [3, 5];
const KEY = (c, r) => c + ',' + r;
const BLOCK = new Map(), BRIDGE = new Set();
for (const L of LM) for (const [c, r] of L.cells) { if (L.block) BLOCK.set(KEY(c, r), L); if (L.k === 'bridge') BRIDGE.add(KEY(c, r)); }
const BLKA = new Uint8Array(COLS * ROWS); for (const L of LM) if (L.block) for (const [c, r] of L.cells) BLKA[r * COLS + c] = 1;   // 매 프레임용(문자열 없이) — 길잡이 3D 화면 비켜 세우기
const blkAt = (x, z) => { const c = Math.floor((x - X0) / CELL), r = Math.floor((z - Z0) / CELL); return c >= 0 && c < COLS && r >= 0 && r < ROWS && BLKA[r * COLS + c] === 1; };

export function mulberry32(a) { a >>>= 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// 길(칸 BFS · 4방향 · 막힌 칸·함정 피함) — from/to = [c, r] → [[c, r]...](처음 칸 빼고) | null
export function path(from, to, traps) {
  const T = new Set((traps || []).map(q => KEY(q[0], q[1]))), prev = new Map([[KEY(from[0], from[1]), null]]), Q = [from];
  while (Q.length) { const [c, r] = Q.shift(); if (c === to[0] && r === to[1]) { const out = []; let k = KEY(c, r); while (prev.get(k)) { const [a, b] = k.split(',').map(Number); out.unshift([a, b]); k = prev.get(k); } return out; }
    for (const D of DIRS) { const c2 = c + D.dc, r2 = r + D.dr, k2 = KEY(c2, r2); if (!inGrid(c2, r2) || BLOCK.has(k2) || T.has(k2) || prev.has(k2)) continue; prev.set(k2, KEY(c, r)); Q.push([c2, r2]); } }
  return null;
}
// 판 배치(씨앗): 보물 3(출발에서 3칸 넘게 · 서로 2칸 넘게 · 하나는 강 동쪽) · 함정 5(출발 옆 · 다리 · 보물 아님 · 보물까지 길이 남게)
export function tourLen(tre, traps) {   // 출발 → 가까운 보물 차례로(칸 수)
  let at = START, len = 0; const got = new Set();
  for (let k = 0; k < tre.length; k++) { let best = null, bi = -1; tre.forEach((t, i) => { if (got.has(i)) return; const p = path(at, t, traps); if (p && (!best || p.length < best.length)) { best = p; bi = i; } }); if (!best) return 1e9; len += best.length; at = tre[bi]; got.add(bi); }
  return len;
}
export function makeLayout(seed, o = {}) {
  const rng = mulberry32(seed), free = [];
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) { const k = KEY(c, r); if (!BLOCK.has(k) && !BRIDGE.has(k) && !(c === START[0] && r === START[1])) free.push([c, r]); }
  const md = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  for (let g = 0; g < 900; g++) {
    const pick = n => free[Math.floor(rng() * free.length)], tre = [];
    let h = 0; while (tre.length < BAL.tre && h++ < 200) { const q = pick(); if (md(q, START) < 3 || tre.some(t => md(t, q) < 2)) continue; tre.push(q); }
    if (tre.length < BAL.tre || (o.river !== false && g < 300 && !tre.some(t => t[0] > 6))) continue;   // 하나는 강 건너(다리 찾기) — 300번 안에 안 되면 놓아줌
    const traps = []; h = 0; while (traps.length < BAL.traps && h++ < 300) { const q = pick(); if (md(q, START) < 2 || tre.some(t => md(t, q) < 1) || traps.some(t => md(t, q) < 1)) continue; traps.push(q); }
    if (traps.length < BAL.traps) continue;
    if (!tre.every(t => path(START, t, traps))) continue;
    if (tourLen(tre, traps) > (o.tour ?? BAL.tour)) continue;   // 셋을 도는 길이 길면 다시(60초 안에 — 시뮬레이션)
    return { tre, traps };
  }
  return { tre: [[8, 1], [3, 0], [10, 2]], traps: [] };
}
// 길잡이 봇 다음 말: 탐험가 칸 → 가장 가까운(길이 짧은) 남은 보물까지 길의 첫 직선 = [방위, 칸 수 ≤4, 목표 칸]
export function botCommand(at, tre, got, traps) {
  let best = null;
  tre.forEach((t, i) => { if (got.has(i)) return; const p = path(at, t, traps); if (p && (!best || p.length < best.length)) best = p; });
  if (!best || !best.length) return null;
  const d0 = DIRS.findIndex(D => D.dc === best[0][0] - at[0] && D.dr === best[0][1] - at[1]); let k = 1;
  while (k < best.length && k < 4 && best[k][0] - best[k - 1][0] === DIRS[d0].dc && best[k][1] - best[k - 1][1] === DIRS[d0].dr) k++;
  return { d: d0, k, to: best[k - 1] };
}

// =====================================================================================
// 시뮬레이션(개발용): simulate(판 수, { react, wrong, step }) — 길잡이 봇 + 사람 흉내 탐험가(말을 듣고 react초 뒤 출발 · wrong 확률로 방위를 헷갈림(반대·옆) · 칸마다 step초)
// =====================================================================================
export function simulate(rounds = 300, o = {}) {
  const react = o.react ?? 1.8, wrong = o.wrong ?? 0.12, step = o.step ?? (CELL / 4.2 + 0.25), think = o.think ?? 2.5, rng = Math.random;
  let all = 0, sumT = 0, sumF = 0, sumTrap = 0;
  for (let n = 0; n < rounds; n++) {
    const L = makeLayout(Math.floor(rng() * 1e9), o), got = new Set(); let at = START.slice(), t = 0, trap = 0;
    while (t < BAL.play && got.size < BAL.tre) {
      const cmd = botCommand(at, L.tre, got, L.traps); if (!cmd) break;
      t += think + react; let d = cmd.d; if (rng() < wrong) d = (d + (rng() < 0.5 ? 2 : rng() < 0.5 ? 1 : 3)) % 4;
      for (let s = 0; s < cmd.k && t < BAL.play; s++) { const c2 = at[0] + DIRS[d].dc, r2 = at[1] + DIRS[d].dr; if (!inGrid(c2, r2) || BLOCK.has(KEY(c2, r2))) break;
        t += step; if (L.traps.some(q => q[0] === c2 && q[1] === r2)) { trap++; t += 1; break; } at = [c2, r2]; const i = L.tre.findIndex(q => q[0] === c2 && q[1] === r2); if (i >= 0) got.add(i); }
    }
    if (got.size >= BAL.tre) { all++; sumT += t; } sumF += got.size; sumTrap += trap;
  }
  return { rounds, allFound: Math.round(all / rounds * 100) + '%', avgFound: +(sumF / rounds).toFixed(2), avgTimeIfAll: all ? +(sumT / all).toFixed(1) : null, trapsPer: +(sumTrap / rounds).toFixed(2) };
}

// =====================================================================================
// 놀이
// =====================================================================================
const MDB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse/match/';
const TEAMC = [0x3b82f6, 0xf08c00, 0x2f9e44, 0x9c36b5], TEAMCSS = ['#3b82f6', '#f08c00', '#2f9e44', '#9c36b5'], TEAMN = ['파랑', '주황', '초록', '보라'];
const seedOf = (t0, seq, team) => ((Math.floor(t0 / 7) ^ Math.imul(seq + 1, 2654435761) ^ Math.imul(team + 1, 40503)) >>> 0) % 1000000000;

export default async function start(map, params = {}) {
  const THREE = map.three, NETM = params.mode === 'net';
  let dead = false;
  const cfg = { ...BAL };
  const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches || document.body.classList.contains('touch'); } catch (e) { return false; } })();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.max(0, Math.floor(s % 60))).padStart(2, '0');
  const hotOff = map.interact.enable(() => true, false);   // 학교 E 지점은 끔(운동장엔 없지만 — 걸음이 걸리지 않게)
  const mmWas = map.minimap.visible; map.minimap.hide();
  const arena = map.arena.set({ rect: [X0 - 1.5, Z0 - 1.5, X0 + COLS * CELL + 1.5, Z0 + ROWS * CELL + 1.5], msg: '🧭 길잡이 놀이는 지도 마을 안에서만 해요' });

  // ---------- 지도 마을 짓기(놀이 동안만 · 한 메시 + 바닥 선 한 메시 · 막힌 칸 = 충돌) ----------
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
  const GEOS = [], MATS = [], OBJ = [], COLS9 = [];
  const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 8, 1), CONE = new THREE.ConeGeometry(1, 1, 10, 1), SPH = new THREE.SphereGeometry(1, 10, 7), SPL = new THREE.SphereGeometry(1, 6, 4);
  function bake(parts) {
    const pos = [], nor = [], cl = [];
    for (const [geo, p, sc, hex, r] of parts) {
      const g = geo.index ? geo.toNonIndexed() : geo, Pa = g.attributes.position, Na = g.attributes.normal;
      _m4.compose(_v.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(...(r || [0, 0, 0]))), _s.set(sc[0], sc[1], sc[2])); _nm.getNormalMatrix(_m4); _c.set(hex);
      for (let i = 0; i < Pa.count; i++) { _v.fromBufferAttribute(Pa, i).applyMatrix4(_m4); pos.push(_v.x, _v.y, _v.z); _n.fromBufferAttribute(Na, i).applyMatrix3(_nm).normalize(); nor.push(_n.x, _n.y, _n.z); cl.push(_c.r, _c.g, _c.b); }
      if (g !== geo) g.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    GEOS.push(g); return g;
  }
  const lamV = () => { const m = new THREE.MeshLambertMaterial({ vertexColors: true }); MATS.push(m); return m; };
  const P9 = [], y0 = GY;
  const add = (geo, p, sc, hex, r) => P9.push([geo, p, sc, hex, r]);
  const R9 = mulberry32(20261005);
  for (const L of LM) {
    if (L.k === 'mount') { const x = (cx(0) + cx(1)) / 2, z = (cz(0) + cz(1)) / 2; add(CONE, [x - 1.2, y0 + 3, z + 0.8], [4.2, 6, 4.2], 0x6f9a52); add(CONE, [x + 2.2, y0 + 2.2, z - 1.6], [3.2, 4.4, 3.2], 0x7fa85e); add(CONE, [x - 1.2, y0 + 5.4, z + 0.8], [1.2, 1.3, 1.2], 0xf4f1e8); }
    for (const [c, r] of L.cells) {
      const x = cx(c), z = cz(r);
      if (L.k === 'forest') for (let i = 0; i < 4; i++) { const ox = (i % 2 ? 1.2 : -1.2) + (R9() - 0.5) * 0.6, oz = (i < 2 ? -1.2 : 1.2) + (R9() - 0.5) * 0.6, h = 3.2 + R9() * 1.2; add(CYL, [x + ox, y0 + 0.5, z + oz], [0.18, 1, 0.18], 0x7a5230); add(CONE, [x + ox, y0 + 1 + h / 2, z + oz], [1.05, h, 1.05], 0x2f7d4a); }
      else if (L.k === 'orchard') for (let i = 0; i < 4; i++) { const ox = i % 2 ? 1.25 : -1.25, oz = i < 2 ? -1.25 : 1.25; add(CYL, [x + ox, y0 + 0.6, z + oz], [0.15, 1.2, 0.15], 0x7a5230); add(SPH, [x + ox, y0 + 1.8, z + oz], [1.0, 0.9, 1.0], 0x5aa04a); for (let a = 0; a < 3; a++) add(SPL, [x + ox + Math.cos(a * 2.1) * 0.8, y0 + 1.75 + (a % 2) * 0.3, z + oz + Math.sin(a * 2.1) * 0.8], [0.16, 0.16, 0.16], 0xe03131); }
      else if (L.k === 'river') { add(BOX, [x, y0 + 0.04, z], [CELL - 0.1, 0.06, CELL], 0x4aa3df); add(BOX, [x - CELL / 2 + 0.2, y0 + 0.12, z], [0.4, 0.2, CELL], 0xb9a27c); add(BOX, [x + CELL / 2 - 0.2, y0 + 0.12, z], [0.4, 0.2, CELL], 0xb9a27c); }
      else if (L.k === 'bridge') { add(BOX, [x, y0 + 0.03, z], [CELL - 0.1, 0.05, CELL], 0x4aa3df); add(BOX, [x, y0 + 0.16, z], [CELL - 0.02, 0.2, 2.6], 0x9c6b3e); for (const s of [-1, 1]) { add(BOX, [x, y0 + 0.75, z + s * 1.25], [CELL - 0.3, 0.12, 0.12], 0x6b4524); for (let k = -2; k <= 2; k++) add(BOX, [x + k * 1.1, y0 + 0.45, z + s * 1.25], [0.12, 0.6, 0.12], 0x6b4524); } }
      else if (L.k === 'paddy') { add(BOX, [x, y0 + 0.03, z], [CELL - 0.3, 0.05, CELL - 0.3], 0x8fbf6a); for (let k = -2; k <= 2; k++) add(BOX, [x + k * 0.9, y0 + 0.1, z], [0.18, 0.12, CELL - 0.6], 0x5e9a3c); }
      else if (L.k === 'school') { add(BOX, [x, y0 + 1.4, z], [3.8, 2.8, 3.0], 0xf2e2b6); add(BOX, [x, y0 + 2.95, z], [4.0, 0.3, 3.2], 0xc0573c); add(BOX, [x, y0 + 0.75, z + 1.52], [0.9, 1.5, 0.06], 0x6b4524); add(CYL, [x + 1.6, y0 + 4.2, z + 1.2], [0.05, 2.6, 0.05], 0xdddddd); add(BOX, [x + 2.0, y0 + 5.1, z + 1.2], [0.8, 0.5, 0.05], 0xe03131); }
      else if (L.k === 'hospital') { add(BOX, [x, y0 + 1.6, z], [3.8, 3.2, 3.4], 0xf8f9fa); for (const [sx, sz, ry] of [[0, 1.73, 0], [0, -1.73, 0], [1.93, 0, Math.PI / 2], [-1.93, 0, Math.PI / 2]]) { add(BOX, [x + sx, y0 + 2.2, z + sz], [1.2, 0.36, 0.06], 0xe03131, [0, ry, 0]); add(BOX, [x + sx, y0 + 2.2, z + sz], [0.36, 1.2, 0.07], 0xe03131, [0, ry, 0]); } }
      else if (L.k === 'post') { add(BOX, [x, y0 + 1.3, z], [3.6, 2.6, 3.2], 0xf08c00); add(BOX, [x, y0 + 2.75, z], [3.8, 0.3, 3.4], 0x8a4b0f); add(BOX, [x, y0 + 1.6, z + 1.63], [1.4, 0.9, 0.06], 0xffffff); add(BOX, [x, y0 + 1.75, z + 1.66], [1.2, 0.08, 0.04], 0xc92a2a, [0, 0, 0.5]); add(BOX, [x, y0 + 1.75, z + 1.66], [1.2, 0.08, 0.04], 0xc92a2a, [0, 0, -0.5]); }
      else if (L.k === 'fire') { add(BOX, [x, y0 + 1.6, z], [3.8, 3.2, 3.4], 0xd6336c); add(BOX, [x, y0 + 0.9, z - 1.72], [2.4, 1.8, 0.06], 0xf1f3f5); for (let k = 0; k < 4; k++) add(BOX, [x, y0 + 0.3 + k * 0.42, z - 1.75], [2.3, 0.05, 0.05], 0xadb5bd); add(BOX, [x, y0 + 3.35, z], [1.0, 0.5, 1.0], 0xffd43b); }
    }
  }
  // 출발 깃발
  add(CYL, [cx(START[0]) + 1.6, y0 + 1.2, cz(START[1]) + 1.6], [0.05, 2.4, 0.05], 0xdddddd); add(BOX, [cx(START[0]) + 2.0, y0 + 2.15, cz(START[1]) + 1.6], [0.8, 0.5, 0.05], 0x2f9e44);
  const villMesh = new THREE.Mesh(bake(P9), lamV()); villMesh.matrixAutoUpdate = false; villMesh.updateMatrix(); map.add(villMesh); OBJ.push(villMesh);
  // 바닥 흰 선(5m 칸) — 운동장 위 2cm
  {
    const pos = [], W = 0.1, yl = GY + 0.025, q = (xa, za, xb, zb) => { pos.push(xa, yl, za, xb, yl, za, xb, yl, zb, xa, yl, za, xb, yl, zb, xa, yl, zb); };
    for (let c = 0; c <= COLS; c++) { const x = X0 + c * CELL; q(x - W, Z0, x + W, Z0 + ROWS * CELL); }
    for (let r = 0; r <= ROWS; r++) { const z = Z0 + r * CELL; q(X0, z - W, X0 + COLS * CELL, z + W); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); GEOS.push(g);
    const m = new THREE.MeshBasicMaterial({ color: 0xf7f3e8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); MATS.push(m);
    const o = new THREE.Mesh(g, m); o.renderOrder = 1; o.matrixAutoUpdate = false; map.add(o); OBJ.push(o);
  }
  // 막힌 칸 = 충돌(산·숲·강·건물·과수원 — 높이 1.8: 점프로 못 넘게)
  //   여러 칸짜리(산·숲·과수원)는 덩어리 하나로(칸마다 따로 두면 사이 0.8m 틈으로 산 속에 들어감) · 강은 칸마다 빈틈 없이(다리 칸만 지나감)
  for (const L of LM) { if (!L.block) continue; const boxes = L.k === 'river' ? L.cells.map(q => [q]) : [L.cells], m9 = L.k === 'river' ? 0 : 0.4;
    for (const cs of boxes) { const c0 = Math.min(...cs.map(q => q[0])), c1 = Math.max(...cs.map(q => q[0])), r0 = Math.min(...cs.map(q => q[1])), r1 = Math.max(...cs.map(q => q[1]));
      COLS9.push(map.collider.add({ x0: X0 + c0 * CELL + m9, x1: X0 + (c1 + 1) * CELL - m9, y0: GY - 0.2, y1: GY + 1.8, z0: Z0 + r0 * CELL + m9, z1: Z0 + (r1 + 1) * CELL - m9 })); } }
  [BOX, CYL, CONE, SPH, SPL].forEach(g => g.dispose());

  // ---------- 탐험가 로봇(남의 탐험가 · 혼자 길잡이의 탐험 로봇) + 보물 보석 + 함정 ✕ ----------
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), NB = 8;
  const SPH2 = new THREE.SphereGeometry(1, 12, 9), SPHS = new THREE.SphereGeometry(1, 8, 6), CYL2 = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
  const TB = 0xd6dee8;
  const bodyGeo = bake([[CYL2, [0, 0.37, 0], [0.15, 0.1, 0.13], 0x5a6270], [SPH2, [0, 0.55, 0], [0.19, 0.2, 0.16], TB], [SPH2, [0, 1.0, 0], [0.3, 0.28, 0.28], TB], [SPHS, [0, 1.0, 0.13], [0.23, 0.17, 0.16], 0x243249],
    [SPHS, [-0.085, 1.02, 0.28], [0.045, 0.058, 0.02], 0x9ff4ff], [SPHS, [0.085, 1.02, 0.28], [0.045, 0.058, 0.02], 0x9ff4ff], [CYL2, [0, 1.33, -0.02], [0.012, 0.1, 0.012], 0x9aa3ad], [SPHS, [0, 1.39, -0.02], [0.035, 0.035, 0.035], 0xffd23c]]);
  const bibGeo = bake([[SPH2, [0, 0.555, 0], [0.205, 0.17, 0.175], 0xffffff], [SPHS, [0, 1.1, -0.01], [0.31, 0.2, 0.3], 0xffffff]]);
  const legGeo = bake([[CYL2, [0, -0.15, 0], [0.068, 0.26, 0.068], 0x5a6270], [SPHS, [0, -0.3, 0.04], [0.085, 0.055, 0.12], 0xf6f6f2]]);
  [SPH2, SPHS, CYL2].forEach(g => g.dispose());
  const inst = (geo, n) => { const m = new THREE.InstancedMesh(geo, lamV(), n); m.frustumCulled = false; for (let i = 0; i < n; i++) { m.setMatrixAt(i, ZERO); m.setColorAt(i, _c.set(0xffffff)); } map.add(m); OBJ.push(m); return m; };
  const RB = { body: inst(bodyGeo, NB), bib: inst(bibGeo, NB), leg: inst(legGeo, NB * 2) };
  const gemGeo = new THREE.OctahedronGeometry(0.45, 0); GEOS.push(gemGeo); const gemMat = new THREE.MeshLambertMaterial({ color: 0xffd23c, emissive: 0x8a6500 }); MATS.push(gemMat);
  const GEM = new THREE.InstancedMesh(gemGeo, gemMat, 3 * 4); GEM.frustumCulled = false; for (let i = 0; i < GEM.count; i++) GEM.setMatrixAt(i, ZERO); map.add(GEM); OBJ.push(GEM);
  const xGeo = new THREE.BoxGeometry(2.6, 0.05, 0.38); GEOS.push(xGeo); const xMat = new THREE.MeshBasicMaterial({ color: 0xe03131, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); MATS.push(xMat);
  const XM = new THREE.InstancedMesh(xGeo, xMat, 2 * 5 * 4); XM.frustumCulled = false; for (let i = 0; i < XM.count; i++) XM.setMatrixAt(i, ZERO); map.add(XM); OBJ.push(XM);

  // ---------- 화면 조각(DOM) ----------
  const css = document.createElement('style'); css.textContent = `
.gd-panel{position:fixed;left:calc(10px + env(safe-area-inset-left));top:calc(58px + env(safe-area-inset-top));z-index:24;width:min(64vw,940px);box-sizing:border-box;padding:8px 10px 10px;border-radius:14px;background:#fbf6e6;color:#2b2b2b;border:3px solid #7a5c2e;box-shadow:0 8px 24px rgba(0,0,0,.3);font:700 14px/1.35 system-ui,-apple-system,"Malgun Gothic",sans-serif;display:none}
.gd-panel.on{display:block}
.gd-panel .hd{display:flex;gap:8px;align-items:center;justify-content:space-between;font-weight:900;margin-bottom:4px}
.gd-panel .hd .bot{flex:1;min-width:0;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#1d3557;border-radius:8px;padding:0 6px}
.gd-panel .hd .bot.fl{animation:gdfl 1s}
@keyframes gdfl{0%,60%{background:#ffd23c}100%{background:transparent}}
.gd-panel canvas{display:block;width:100%;height:auto;border-radius:8px;touch-action:none}
.gd-panel .lg{display:flex;flex-wrap:wrap;gap:4px 10px;margin:6px 0 2px;font-size:12px;font-weight:700;color:#4a3a1e}
.gd-panel .lg span{display:inline-flex;align-items:center;gap:3px}
.gd-panel .lg canvas{width:22px;height:22px;display:inline-block}
.gd-panel .ct{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px}
.gd-panel .ct .g{display:flex;gap:4px;align-items:center}
.gd-panel .ct .xg{display:none}
.gd-panel button{font:inherit;font-weight:800;border:0;border-radius:10px;padding:8px 10px;min-height:44px;min-width:44px;background:#ece3c8;color:#3b2f17;cursor:pointer}
.gd-panel button.on{background:#1d3557;color:#fff}
.gd-panel button.ph{background:#e6eef8;color:#1d3557;font-size:13px}
.gd-panel button.q{background:#f3e3e3;color:#7a1f1f}
@media (hover:hover){.gd-panel button:hover{filter:brightness(.94);box-shadow:inset 0 0 0 2px #7a5c2e}}
.gd-panel button:active{transform:translateY(1px)}
.gd-panel.pick:not(.wait) [data-k]{background:#fff3bf;animation:gdp 1s infinite}
@keyframes gdp{50%{box-shadow:0 0 0 3px #f2b705}}
.gd-panel.wait [data-k],.gd-panel.wait [data-p],.gd-panel.done [data-d],.gd-panel.done [data-k],.gd-panel.done [data-p]{opacity:.45}
.gd-panel .said{margin-top:4px;font-size:12px;color:#6b5a35;min-height:16px}
.hudAsk{z-index:46}
body.gd-guide #toast,body.gd-guide #hudBan{z-index:26}
body.gd-exp #toast{top:calc(176px + env(safe-area-inset-top))!important;z-index:25}
body.gd-exp.touch.small #toast{top:calc(136px + env(safe-area-inset-top))!important}
.gd-cmp{position:fixed;left:50%;top:calc(52px + env(safe-area-inset-top));transform:translateX(-50%);z-index:23;width:min(380px,80vw);height:30px;overflow:hidden;border-radius:10px;background:rgba(18,28,48,.82);border:2px solid rgba(255,255,255,.85);display:none;pointer-events:none}
.gd-cmp i{position:absolute;top:0;width:2px;height:10px;background:rgba(255,255,255,.55)}
.gd-cmp b{position:absolute;top:5px;transform:translateX(-50%);font:900 15px/1 system-ui,-apple-system,"Malgun Gothic",sans-serif;color:#fff}
.gd-cmp b.n{color:#ff6b6b}
.gd-cmp b.t{color:#1d3557;background:#ffd23c;border-radius:6px;padding:1px 5px;top:4px}
.gd-cmp em{position:absolute;top:4px;font:900 13px/20px system-ui,-apple-system,"Malgun Gothic",sans-serif;font-style:normal;color:#1d3557;background:#ffd23c;border-radius:8px;padding:0 6px;display:none;white-space:nowrap}
.gd-cmp em.l{left:4px}
.gd-cmp em.r{right:4px}
.gd-cmp u{position:absolute;left:50%;bottom:0;transform:translateX(-50%);border:7px solid transparent;border-bottom-color:#ffd23c;text-decoration:none}
.gd-say{position:fixed;left:50%;top:calc(92px + env(safe-area-inset-top));transform:translateX(-50%);z-index:23;max-width:min(560px,92vw);padding:10px 18px;border-radius:14px;background:rgba(29,53,87,.92);color:#fff;font:900 clamp(18px,3.4vw,28px)/1.3 system-ui,-apple-system,"Malgun Gothic",sans-serif;text-align:center;display:none;pointer-events:none;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.gd-say small{display:block;font-size:13px;font-weight:700;opacity:.8}
.gd-log{position:fixed;right:calc(12px + env(safe-area-inset-right));top:calc(150px + env(safe-area-inset-top));z-index:23;max-width:220px;padding:7px 10px;border-radius:12px;background:rgba(18,28,48,.78);color:#fff;font:700 13px/1.45 system-ui,-apple-system,"Malgun Gothic",sans-serif;display:none;pointer-events:none}
body.small .gd-panel{left:calc(4px + env(safe-area-inset-left));right:calc(4px + env(safe-area-inset-right));top:calc(36px + env(safe-area-inset-top));width:auto;padding:4px 6px;font-size:12px;grid-template-columns:auto 1fr;gap:3px 6px}
body.small .gd-panel.on{display:grid}
body.small .gd-panel .hd{grid-column:1 / span 2;margin:0}
body.small .gd-panel canvas{grid-column:1;grid-row:2;height:min(calc(100vh - 84px - env(safe-area-inset-top) - env(safe-area-inset-bottom)),calc((100vw - 250px) / 2));width:auto}
body.small .gd-panel .ct{grid-column:2;grid-row:2;margin:0;display:grid;grid-template-columns:repeat(12,1fr);gap:4px;align-content:start}
body.small .gd-panel .ct .g,body.small .gd-panel .ct .xg{display:contents}
body.small .gd-panel .lg,body.small .gd-panel .said{display:none}
body.small .gd-panel button{padding:2px 4px;min-height:44px;min-width:0;font-size:13px;line-height:1.15;white-space:normal;word-break:keep-all}
body.small .gd-panel [data-d="0"]{grid-area:1/5/2/9}
body.small .gd-panel [data-d="3"]{grid-area:2/1/3/5}
body.small .gd-panel [data-d="2"]{grid-area:2/5/3/9}
body.small .gd-panel [data-d="1"]{grid-area:2/9/3/13}
body.small .gd-panel [data-k]{grid-row:3;grid-column:span 3}
body.small .gd-panel [data-p]{grid-row:4;grid-column:span 4;font-size:12px}
body.small .gd-panel .xg button{grid-row:5;grid-column:span 6}
body.small .gd-panel.lgon .lg{display:flex;position:absolute;left:10px;bottom:10px;width:min(560px,calc(100% - 250px));box-sizing:border-box;z-index:1;margin:0;background:rgba(255,253,246,.96);border:2px solid #7a5c2e;border-radius:10px;padding:6px 8px;font-size:12px}
body.small .gd-panel .lg canvas{width:20px;height:20px;grid-column:auto;grid-row:auto}
body.small .gd-cmp{top:calc(44px + env(safe-area-inset-top));height:26px}
body.small .gd-say{top:calc(76px + env(safe-area-inset-top));font-size:16px;padding:7px 12px}
body.small .gd-log{display:none!important}
`; document.head.appendChild(css);
  const panel = document.createElement('div'); panel.className = 'gd-panel ttl-keep';
  panel.innerHTML = '<div class="hd"><span class="t">🧭 길잡이 지도</span><span class="bot"></span><span class="st"></span></div><canvas width="960" height="480"></canvas><div class="lg"></div>'
    + '<div class="ct"><div class="g dir">' + DIRS.map((D, i) => '<button data-d="' + i + '">' + D.a + ' ' + D.t + '</button>').join('') + '</div><div class="g">' + [1, 2, 3, 4].map(k => '<button data-k="' + k + '">' + k + '칸</button>').join('') + '</div>'
    + '<div class="g">' + [90, 92, 91].map(n => '<button class="ph" data-p="' + n + '">' + PHR[n] + '</button>').join('') + '</div>'
    + '<div class="g xg"><button data-lg="1">📖 기호</button><button class="q" data-q="1">⏹ 그만하기</button></div></div><div class="said"></div>';   // xg = 휴대폰만(지도가 화면을 덮어 ⏹ 칩·범례가 안 보임 — UX-1 GD-1·GD-12)
  panel.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });   // 단추가 포커스를 잡지 않게(키가 계속 먹고 Space가 단추를 다시 누르지 않게 — UX-1 GD-4)
  document.body.appendChild(panel);
  const mapCv = panel.querySelector('canvas'), mctx = mapCv.getContext('2d');
  const cmpEl = document.createElement('div'); cmpEl.className = 'gd-cmp'; document.body.appendChild(cmpEl);
  { let h = ''; for (let a = 0; a < 360; a += 15) h += '<i data-a="' + a + '"></i>'; for (const [a, t] of [[0, '북'], [90, '동'], [180, '남'], [270, '서']]) h += '<b data-a="' + a + '"' + (a === 0 ? ' class="n"' : '') + '>' + t + '</b>'; cmpEl.innerHTML = h + '<em class="l"></em><em class="r"></em><u></u>'; }   // em = 들은 방위가 띠 밖이면 '◀ 북' · '뒤로 돌아 북 ▶'(UX-1 GD-9)
  const cmpL = cmpEl.querySelector('em.l'), cmpR = cmpEl.querySelector('em.r');
  const sayEl = document.createElement('div'); sayEl.className = 'gd-say'; document.body.appendChild(sayEl);
  const logEl = document.createElement('div'); logEl.className = 'gd-log'; document.body.appendChild(logEl);
  let cardEl = null, cardT = 0;
  function card(html, sec = 3) {
    if (!cardEl) { cardEl = document.createElement('div'); cardEl.className = 'gd-card ttl-keep'; cardEl.style.cssText = 'position:fixed;left:50%;top:24%;transform:translateX(-50%);z-index:30;max-width:min(540px,92vw);box-sizing:border-box;padding:10px 16px;border-radius:14px;background:rgba(18,28,48,.92);color:#fff;font:700 clamp(14px,2.6vw,18px)/1.5 system-ui,-apple-system,"Malgun Gothic",sans-serif;text-align:center;pointer-events:none;box-shadow:0 6px 20px rgba(0,0,0,.3)'; document.body.appendChild(cardEl); }
    cardEl.innerHTML = html; cardEl.style.display = ''; clearTimeout(cardT); cardT = setTimeout(() => { if (cardEl) cardEl.style.display = 'none'; }, sec * 1000);
  }
  let chipK = {}; const chip = (k, t) => { if (chipK[k] === t) return; chipK[k] = t; map.hud.chip(k, t); };
  // 범례(지도와 같은 그림)
  {
    const lg = panel.querySelector('.lg'), items = [['mount', '산'], ['river', '강'], ['bridge', '다리'], ['forest', '숲'], ['orchard', '과수원'], ['paddy', '논'], ['school', '학교'], ['hospital', '병원'], ['post', '우체국'], ['fire', '소방서'], ['start', '출발'], ['tre', '보물'], ['trap', '함정'], ['me', '탐험가']];
    for (const [k, t] of items) { const s = document.createElement('span'), c = document.createElement('canvas'); c.width = 44; c.height = 44; const g = c.getContext('2d'); g.scale(44 / 40, 44 / 40); sym(g, k, 0, 0, 40, 1); s.appendChild(c); s.appendChild(document.createTextNode(t)); lg.appendChild(s); }
  }

  // ---------- 지도 그림(기호) ----------
  function sym(g, k, x, y, s, i) {   // 칸 하나(s px) 안에 기호 하나
    const m = s / 2, X = x + m, Y = y + m; g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    if (k === 'mount') { g.fillStyle = '#8c6239'; g.beginPath(); g.moveTo(x + s * 0.1, y + s * 0.85); g.lineTo(X, y + s * 0.15); g.lineTo(x + s * 0.9, y + s * 0.85); g.closePath(); g.fill(); g.fillStyle = '#f5f0e6'; g.beginPath(); g.moveTo(X - s * 0.13, y + s * 0.34); g.lineTo(X, y + s * 0.15); g.lineTo(X + s * 0.13, y + s * 0.34); g.closePath(); g.fill(); }
    else if (k === 'river') { g.fillStyle = '#74b9e8'; g.fillRect(x, y, s, s); g.strokeStyle = '#3d86c6'; g.lineWidth = Math.max(1.5, s * 0.05); for (let k2 = 0; k2 < 3; k2++) { const yy = y + s * (0.25 + k2 * 0.25); g.beginPath(); g.moveTo(x + s * 0.15, yy); g.quadraticCurveTo(X - s * 0.15, yy - s * 0.08, X, yy); g.quadraticCurveTo(X + s * 0.15, yy + s * 0.08, x + s * 0.85, yy); g.stroke(); } }
    else if (k === 'bridge') { g.fillStyle = '#74b9e8'; g.fillRect(x, y, s, s); g.fillStyle = '#9c6b3e'; g.fillRect(x, y + s * 0.3, s, s * 0.4); g.strokeStyle = '#4a3214'; g.lineWidth = Math.max(1.5, s * 0.05); g.beginPath(); g.moveTo(x, y + s * 0.3); g.lineTo(x + s, y + s * 0.3); g.moveTo(x, y + s * 0.7); g.lineTo(x + s, y + s * 0.7); g.stroke(); }
    else if (k === 'forest') { for (const [ox, oy] of [[0.3, 0.35], [0.7, 0.35], [0.5, 0.72]]) { g.fillStyle = '#2f7d4a'; g.beginPath(); g.moveTo(x + s * ox, y + s * (oy - 0.25)); g.lineTo(x + s * (ox + 0.16), y + s * (oy + 0.08)); g.lineTo(x + s * (ox - 0.16), y + s * (oy + 0.08)); g.closePath(); g.fill(); g.fillStyle = '#6b4524'; g.fillRect(x + s * (ox - 0.025), y + s * (oy + 0.08), s * 0.05, s * 0.1); } }
    else if (k === 'orchard') { for (const [ox, oy] of [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) { g.strokeStyle = '#3f8a3a'; g.lineWidth = Math.max(1.5, s * 0.06); g.beginPath(); g.arc(x + s * ox, y + s * oy, s * 0.13, 0, 6.283); g.stroke(); g.fillStyle = '#e03131'; g.beginPath(); g.arc(x + s * ox, y + s * oy, s * 0.04, 0, 6.283); g.fill(); } }
    else if (k === 'paddy') { g.fillStyle = '#d8ecc4'; g.fillRect(x + 1, y + 1, s - 2, s - 2); g.strokeStyle = '#4c8a2e'; g.lineWidth = Math.max(1.5, s * 0.05); for (const [ox, oy] of [[0.3, 0.32], [0.7, 0.32], [0.5, 0.7]]) { const px = x + s * ox, py = y + s * oy; g.beginPath(); g.moveTo(px - s * 0.09, py - s * 0.08); g.lineTo(px - s * 0.09, py + s * 0.06); g.moveTo(px + s * 0.09, py - s * 0.08); g.lineTo(px + s * 0.09, py + s * 0.06); g.moveTo(px - s * 0.14, py + s * 0.06); g.lineTo(px + s * 0.14, py + s * 0.06); g.stroke(); } }
    else if (k === 'school') { g.fillStyle = '#f2e2b6'; g.strokeStyle = '#6b4524'; g.lineWidth = Math.max(1.5, s * 0.04); g.fillRect(x + s * 0.2, y + s * 0.45, s * 0.6, s * 0.4); g.strokeRect(x + s * 0.2, y + s * 0.45, s * 0.6, s * 0.4); g.beginPath(); g.moveTo(X, y + s * 0.12); g.lineTo(X, y + s * 0.45); g.stroke(); g.fillStyle = '#e03131'; g.beginPath(); g.moveTo(X, y + s * 0.12); g.lineTo(X + s * 0.24, y + s * 0.2); g.lineTo(X, y + s * 0.28); g.closePath(); g.fill(); }
    else if (k === 'hospital') { g.fillStyle = '#fff'; g.strokeStyle = '#c92a2a'; g.lineWidth = Math.max(1.5, s * 0.04); g.beginPath(); g.arc(X, Y, s * 0.34, 0, 6.283); g.fill(); g.stroke(); g.fillStyle = '#e03131'; g.fillRect(X - s * 0.2, Y - s * 0.07, s * 0.4, s * 0.14); g.fillRect(X - s * 0.07, Y - s * 0.2, s * 0.14, s * 0.4); }
    else if (k === 'post') { g.fillStyle = '#fff'; g.strokeStyle = '#d9480f'; g.lineWidth = Math.max(1.5, s * 0.05); g.fillRect(x + s * 0.18, y + s * 0.3, s * 0.64, s * 0.42); g.strokeRect(x + s * 0.18, y + s * 0.3, s * 0.64, s * 0.42); g.beginPath(); g.moveTo(x + s * 0.18, y + s * 0.3); g.lineTo(X, y + s * 0.55); g.lineTo(x + s * 0.82, y + s * 0.3); g.stroke(); }
    else if (k === 'fire') { g.fillStyle = '#f76707'; g.beginPath(); g.moveTo(X, y + s * 0.12); g.quadraticCurveTo(x + s * 0.82, y + s * 0.5, X + s * 0.18, y + s * 0.82); g.quadraticCurveTo(X, y + s * 0.9, X - s * 0.18, y + s * 0.82); g.quadraticCurveTo(x + s * 0.18, y + s * 0.5, X, y + s * 0.12); g.fill(); g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(X, y + s * 0.62, s * 0.14, 0, 6.283); g.fill(); }
    else if (k === 'start') { g.strokeStyle = '#495057'; g.lineWidth = Math.max(1.5, s * 0.05); g.beginPath(); g.moveTo(x + s * 0.32, y + s * 0.85); g.lineTo(x + s * 0.32, y + s * 0.15); g.stroke(); g.fillStyle = '#2f9e44'; g.beginPath(); g.moveTo(x + s * 0.32, y + s * 0.15); g.lineTo(x + s * 0.8, y + s * 0.28); g.lineTo(x + s * 0.32, y + s * 0.42); g.closePath(); g.fill(); }
    else if (k === 'tre') { g.fillStyle = '#ffc61a'; if (i === 2) g.globalAlpha = 0.6; g.strokeStyle = '#9a6b00'; g.lineWidth = Math.max(1.2, s * 0.04); g.beginPath(); for (let a = 0; a < 10; a++) { const rr = a % 2 ? s * 0.16 : s * 0.38, an = -Math.PI / 2 + a * Math.PI / 5; g.lineTo(X + Math.cos(an) * rr, Y + Math.sin(an) * rr); } g.closePath(); g.fill(); g.stroke();
      if (i === 2) { g.globalAlpha = 1; g.fillStyle = '#2f9e44'; g.beginPath(); g.arc(X + s * 0.24, Y - s * 0.24, s * 0.15, 0, 6.283); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = Math.max(2, s * 0.05); g.beginPath(); g.moveTo(X + s * 0.17, Y - s * 0.24); g.lineTo(X + s * 0.22, Y - s * 0.18); g.lineTo(X + s * 0.31, Y - s * 0.31); g.stroke(); } }   // 찾은 보물 = 흐린 금색 + 초록 ✓(회색이면 '없어짐'으로 읽힘 — UX-1 GD-19)
    else if (k === 'trap') { g.strokeStyle = '#e03131'; g.lineWidth = Math.max(2, s * (i === 2 ? 0.14 : 0.08)); g.globalAlpha = i === 2 ? 1 : 0.85; g.beginPath(); g.moveTo(x + s * 0.25, y + s * 0.25); g.lineTo(x + s * 0.75, y + s * 0.75); g.moveTo(x + s * 0.75, y + s * 0.25); g.lineTo(x + s * 0.25, y + s * 0.75); g.stroke(); }
    else if (k === 'me') { g.fillStyle = '#3b82f6'; g.strokeStyle = '#fff'; g.lineWidth = Math.max(1.5, s * 0.05); g.beginPath(); g.moveTo(X, y + s * 0.15); g.lineTo(x + s * 0.78, y + s * 0.8); g.lineTo(X, y + s * 0.64); g.lineTo(x + s * 0.22, y + s * 0.8); g.closePath(); g.fill(); g.stroke(); }
    g.restore();
  }
  const ML = 0.15, MT = 0.15, MR = 1.35, MB = 0.6;   // 지도 여백(칸 단위) — 방위표는 오른쪽 · 축척은 아래(칸 위 기호를 가리지 않게)
  let PXK = 1; const fp = b => Math.round(Math.max(b * (mapCv.width / (COLS + ML + MR)), 13 * PXK));   // 지도 글자 = 화면에서 13px 아래로 안 내려감(캔버스 960 → 휴대폰 594px · UX-1 GD-12)
  const pxk = () => { if (mapCv.clientWidth > 0) PXK = mapCv.width / mapCv.clientWidth; };
  function drawMap() {
    const W = mapCv.width, H = mapCv.height, g = mctx, s = W / (COLS + ML + MR);
    const otx = (t, x, y) => { g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = '#fff'; g.strokeText(t, x, y); g.fillText(t, x, y); };   // 흰 테 글자
    g.fillStyle = '#efe4c4'; g.fillRect(0, 0, W, H);
    g.save(); g.translate(ML * s, MT * s); g.fillStyle = '#f6efd9'; g.fillRect(0, 0, COLS * s, ROWS * s);
    // 칸 선(5m) + 열 글자(A~L)·줄 번호(1~6)
    g.strokeStyle = '#d9cba6'; g.lineWidth = 1.5; for (let c = 0; c <= COLS; c++) { g.beginPath(); g.moveTo(c * s, 0); g.lineTo(c * s, ROWS * s); g.stroke(); } for (let r = 0; r <= ROWS; r++) { g.beginPath(); g.moveTo(0, r * s); g.lineTo(COLS * s, r * s); g.stroke(); }
    for (const L of LM) { if (L.k === 'mount') { sym(g, 'mount', 0, 0, s * 2, 0); continue; } for (const [c, r] of L.cells) sym(g, L.k, c * s, r * s, s, 0); }
    sym(g, 'start', START[0] * s, START[1] * s, s, 0);
    const S = R && R.lay; if (S) {
      S.traps.forEach((q, i) => { const rev = TR.has(i); if (ME.role === 'guide' || ME.role === 'watch' || rev) sym(g, 'trap', q[0] * s, q[1] * s, s, rev ? 2 : 1); });
      S.tre.forEach((q, i) => { if (ME.role === 'guide' || ME.role === 'watch' || GOT.has(i)) sym(g, 'tre', q[0] * s, q[1] * s, s, GOT.has(i) ? 2 : 1); if (!GOT.has(i) && (ME.role === 'guide' || ME.role === 'watch')) { g.fillStyle = '#5c4400'; g.font = '900 ' + fp(0.2) + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; otx(String(R.num ? R.num[i] : i + 1), q[0] * s + s / 2, q[1] * s + s * 0.54); g.textBaseline = 'alphabetic'; } });   // 번호 = 가까운 차례(UX-1 GD-5)
    }
    // 방위를 고르면 1~4칸이 어디인지 미리 보기(보여 주기만 — 보내는 말·점수 그대로 · UX-1 GD-7): 점선 칸 + 'n칸' · 막힘·마을 끝 = 빨간 막대 · 함정 칸 = 빨간 점선(로봇이 거기서 멈춤)
    if (ME.role === 'guide' && selD >= 0 && (phase === 'play' || phase === 'count')) {
      const fc = bot ? (bot.tx != null ? bot.nc : [bot.c, bot.r]) : (() => { const f = followTarget(); const q = f ? cellOf(f.x, f.z) : START.slice(); return [Math.max(0, Math.min(COLS - 1, q[0])), Math.max(0, Math.min(ROWS - 1, q[1]))]; })();
      const D = DIRS[selD], fsz = fp(0.2);
      for (let k = 1; k <= 4; k++) { const c = fc[0] + D.dc * k, r = fc[1] + D.dr * k;
        if (!inGrid(c, r) || BLOCK.has(KEY(c, r))) { const pc = c - D.dc, pr = r - D.dr; g.strokeStyle = '#e03131'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath();
          const in9 = -(D.dc || D.dr) * s * 0.07;   // QA-1: 앞 칸 쪽으로 조금 — 마을 끝 막대가 지도 테두리에 덮여 안 보이던 것
          if (D.dc) { const ex = Math.max(pc, c) * s + in9; g.moveTo(ex, r * s + s * 0.12); g.lineTo(ex, r * s + s * 0.88); } else { const ey = Math.max(pr, r) * s + in9; g.moveTo(c * s + s * 0.12, ey); g.lineTo(c * s + s * 0.88, ey); }
          g.stroke(); g.lineCap = 'butt'; break; }
        const trap = !!(S && S.traps.some(q => q[0] === c && q[1] === r)), col = trap ? '#e03131' : '#1d3557';
        g.setLineDash([10, 7]); g.strokeStyle = col; g.lineWidth = 4; g.strokeRect(c * s + 4, r * s + 4, s - 8, s - 8); g.setLineDash([]);
        g.font = '900 ' + fsz + 'px system-ui'; const lb = k + '칸', pw = g.measureText(lb).width + 10; g.fillStyle = col; g.fillRect(c * s + 5, r * s + 5, pw, fsz + 6); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(lb, c * s + 10, r * s + 8 + fsz / 2); g.textBaseline = 'alphabetic';
        if (trap) break; } }
    // 탐험가(우리 팀 = 파란 화살표 · 다른 팀 = 회색 점)
    for (const a of EXP) { const px = (a.x - X0) / CELL * s, pz = (a.z - Z0) / CELL * s;
      if (a.team === MYTEAM) { g.save(); g.translate(px, pz); g.rotate((a.h || 0) * Math.PI / 180); g.translate(-s * 0.25, -s * 0.25); sym(g, 'me', 0, 0, s * 0.5, 0); g.restore();
        g.fillStyle = '#1d3557'; g.font = '800 ' + fp(0.16) + 'px system-ui'; g.textAlign = 'center'; otx(a.name, px, pz + s * 0.46); }
      else { g.fillStyle = TEAMCSS[a.team % 4]; g.globalAlpha = 0.55; g.beginPath(); g.arc(px, pz, s * 0.1, 0, 6.283); g.fill(); g.globalAlpha = 1; } }
    // 🤖 탐험 로봇의 말 = 지도 위 말풍선 2.5초(길잡이가 보는 곳 · UX-1 GD-2)
    if (bot && bot.said && tNow - bot.saidT < 2.5) { const a = bot.a, px = (a.x - X0) / CELL * s, pz = (a.z - Z0) / CELL * s, fs = fp(0.2); g.font = '800 ' + fs + 'px system-ui'; const w = g.measureText(bot.said).width + 16, h = fs + 12;
      const bx = Math.min(Math.max(px - w / 2, 2), COLS * s - w - 2); let by = pz - s * 0.45 - h; if (by < 2) by = pz + s * 0.5;
      g.fillStyle = 'rgba(255,255,255,.95)'; g.strokeStyle = '#1d3557'; g.lineWidth = 2; g.fillRect(bx, by, w, h); g.strokeRect(bx, by, w, h); g.fillStyle = '#1d3557'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(bot.said, bx + 8, by + h / 2); g.textBaseline = 'alphabetic'; }
    g.strokeStyle = '#7a5c2e'; g.lineWidth = 3; g.strokeRect(0, 0, COLS * s, ROWS * s); g.restore();
    // 방위표(오른쪽 여백) · 축척(아래 여백)
    { const ox = (ML + COLS + MR / 2) * s, oy = (MT + 1.0) * s, fs = fp(0.17), rr = Math.min(s * 0.38, MR * s / 2 - fs * 1.15), off = rr + fs * 0.6; g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(ox, oy, rr + 6, 0, 6.283); g.fill(); g.strokeStyle = '#495057'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#e03131'; g.beginPath(); g.moveTo(ox, oy - rr); g.lineTo(ox + rr * 0.22, oy); g.lineTo(ox - rr * 0.22, oy); g.closePath(); g.fill(); g.fillStyle = '#495057'; g.beginPath(); g.moveTo(ox, oy + rr); g.lineTo(ox + rr * 0.22, oy); g.lineTo(ox - rr * 0.22, oy); g.closePath(); g.fill();
      g.font = '900 ' + fs + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c92a2a'; otx('북', ox, oy - off); g.fillStyle = '#343a40'; otx('남', ox, oy + off); otx('동', ox + off, oy); otx('서', ox - off, oy); g.textBaseline = 'alphabetic'; }
    { const bx = (ML + 0.1) * s, by = H - s * 0.14, f1 = fp(0.15), f2 = fp(0.17); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(bx - 6, by - f1 - 10, s * 2 + 12, f1 + 16); g.fillStyle = '#4a3a1e'; g.font = '800 ' + f2 + 'px system-ui'; g.textAlign = 'left'; otx('축척 · 1칸 = 5m', bx + s * 2 + f1 + 6, by); g.fillStyle = '#212529'; g.fillRect(bx, by - 4, s, 6); g.fillStyle = '#fff'; g.fillRect(bx + s, by - 4, s, 6); g.strokeStyle = '#212529'; g.lineWidth = 1.5; g.strokeRect(bx, by - 4, s * 2, 6);
      g.font = '800 ' + f1 + 'px system-ui'; g.textAlign = 'center'; g.fillStyle = '#212529'; otx('0', bx, by - 7); otx('5m', bx + s, by - 7); otx('10m', bx + s * 2, by - 7); }
  }

  // ---------- 하는 법(RB-2와 같은 틀 · 10-05 교사 '딱 보고 어떻게 하는 거지') + 지금 할 일(화면 위 줄) ----------
  const hcss = document.createElement('style'); hcss.textContent = `
.gd-how{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.55);font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif}
.gd-how .bx{width:min(560px,92vw);max-height:90vh;overflow:auto;box-sizing:border-box;padding:16px 18px;border-radius:18px;background:#fffdf6;color:#1d3557;border:3px solid #7a5c2e;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.gd-how h3{margin:0 0 10px;font-size:22px}
.gd-how .st{display:flex;gap:12px;align-items:center;margin:8px 0;padding:8px 10px;border-radius:12px;background:#f6efd9;font-size:17px;line-height:1.4}
.gd-how .st b.n{flex:none;width:46px;height:46px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 1px 4px rgba(0,0,0,.15)}
.gd-how .tip{margin-top:8px;padding:8px 10px;border-radius:10px;background:#fff3bf;font-size:15px;font-weight:700}
.gd-how button{display:block;margin:12px 0 0 auto;font:inherit;font-size:18px;font-weight:900;border:0;border-radius:12px;padding:10px 22px;min-height:44px;background:#1d3557;color:#fff;cursor:pointer}
.gd-how .auto{margin-top:10px;text-align:right;font-size:14px;color:#5a6b80;font-weight:700}
body.small .gd-how .bx{padding:10px 12px} body.small .gd-how h3{font-size:17px;margin-bottom:4px} body.small .gd-how .st{font-size:14px;margin:4px 0;padding:5px 8px} body.small .gd-how .st b.n{width:34px;height:34px;font-size:20px}
`; document.head.appendChild(hcss);
  const seenHow = new Set(); let howEl = null;
  function howHtml(role) {
    const st = (i, t) => '<div class="st"><b class="n">' + i + '</b><span>' + t + '</span></div>';
    return role === 'guide'
      ? '<h3>🧭 길잡이 하는 법</h3>' + st('🗺️', '지도에 <b>⭐ 보물 3개</b>와 <b>✕ 함정</b>이 보여요 — 탐험가 눈에는 하나도 안 보여요')
        + st('⬆️', '<b>방위</b>(⬆북 ➡동 ⬇남 ⬅서)를 누르고 → <b>칸 수</b>(1~4칸)를 누르면 말이 가요 · 1칸 = 5m') + st('💎', '탐험가가 보물 칸 <b>가운데</b>에 서면 💎! 함정(✕)은 피해서 길을 알려 줘요')
        + '<div class="tip">지도 위쪽이 <b>북쪽</b>(방위표) · 산·강·다리·학교 같은 기호(범례)로 "다리를 건너요"라고 말해도 좋아요</div>'
        + (coarse ? '' : '<div class="tip">⌨️ 키보드로도 돼요: 화살표 → 숫자 1~4 · Space = ✋ 멈춰</div>')
      : '<h3>🚶 탐험가 하는 법</h3>' + st('🧭', '<b>길잡이</b>가 "북쪽으로 2칸!"처럼 말해 줘요 — 보물·함정은 안 보여요')
        + st('⬆️', '화면 위 <b>나침반 띠</b>에서 <b>북</b>을 찾아 그쪽으로 · 바닥 <b>흰 선 한 칸 = 5m</b>') + st('💎', '보물 칸 <b>가운데</b>에 서면 💎 · 함정을 밟으면 💥 한 칸 뒤로')
        + '<div class="tip">' + (coarse ? '🎮 왼쪽 엄지 = 걷기 · 오른쪽 화면 끌기 = 둘러보기 · ' + cfg.play + '초 안에 보물 3개!' : '🎮 W A S D = 걷기(처음엔 W = 북쪽) · 화면을 한 번 누르면 마우스로 둘러봐요 · ' + cfg.play + '초 안에 보물 3개! · 지금 할 일은 화면 위 줄에 나와요') + '</div>';   // 조작 안내(UX-1 GD-11)
  }
  function howTo(role, wait) {
    howClose(); seenHow.add(role); document.exitPointerLock?.();
    howEl = document.createElement('div'); howEl.className = 'gd-how ttl-keep';
    howEl.innerHTML = '<div class="bx">' + howHtml(role) + (wait ? '<button type="button">▶ 시작!</button>' : '<div class="auto">⏱ 곧 시작해요 — 읽어 보세요</div>') + '</div>';
    for (const t of ['keydown', 'keyup']) howEl.addEventListener(t, e => e.stopPropagation());
    document.body.appendChild(howEl);
    if (!wait) return Promise.resolve();
    return new Promise(res => { const go = () => { removeEventListener('keydown', kk, true); howClose(); res(); }, kk = e => { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') { e.preventDefault(); e.stopPropagation(); go(); } };
      howEl.querySelector('button').addEventListener('click', e => { e.stopPropagation(); go(); }); addEventListener('keydown', kk, true); });
  }
  function howClose() { if (howEl) { howEl.remove(); howEl = null; } }
  let coachK = '', lastSaidT = -99, lastHeard = null;
  function coach() {
    let t = '';
    if (phase === 'count') t = ME.role === 'guide' ? '🧭 곧 시작 — ⭐1번(가장 가까운 보물)까지 길을 찾아 둬요' : ME.role === 'exp' ? '🚶 곧 시작 — 위 나침반 띠에서 북을 찾아 둬요' : '👀 구경';
    else if (phase === 'play') {
      if (GOT.size >= cfg.tre) t = '🎉 보물을 모두 찾았어요!';
      else if (ME.role === 'guide') { const going = bot ? bot.tx != null || bot.left > 0 : tNow - lastSaidT < 4;   // 혼자 = 로봇이 실제로 걷는 동안만 '가는 중'(막혀 멈췄는데 '가는 중'이던 것)
        t = selD >= 0 && (tNow - lastSaidT > 1 || !going) ? '이제 칸 수(1~4칸)를 눌러요 — "' + DIRS[selD].t + '쪽으로 ?칸"' : going ? (bot ? '🤖 탐험 로봇이 가는 중 — 지도를 보며 다음 말을 준비해요' : '🚶 탐험가가 가는 중 — 지도를 보며 다음 말을 준비해요') : '🧭 파란 화살표(탐험가) → 보물까지 길을 찾아 방위 → 칸 수를 눌러요'; }
      else if (ME.role === 'exp') t = lastHeard ? '🧭 노란 「' + lastHeard.dir + '」 쪽으로 돌고 → 흰 선 ' + lastHeard.k + '개 넘어 칸 가운데에!' : '🧭 길잡이 말을 기다려요 — 위 나침반 띠에서 북을 찾아 둬요';   // 말 전체는 말풍선·들은 말 목록에(UX-1 GD-9 — 휴대폰 목표 줄 길이)
      else t = '👀 구경 중 — 다음 판부터 같이 해요';
    } else if (phase === 'res') t = '🏁 끝 — 💎 ' + GOT.size + '/' + cfg.tre;
    if (t !== coachK) { coachK = t; map.hud.goal(t); }
  }

  // ---------- 상태 ----------
  //   R = 한 판 { seq, t0, round, rounds, teams: [[{kind, pid, name}...]...], lay(내 팀 배치) } · ME = { role: 'guide'|'exp'|'watch', team, slot }
  //   EXP = 탐험가들 { slot, team, kind me|remote|bot, pid, name, x, z, h, net… } · GOT/TR = 내 팀 찾은 보물·밟은 함정(번호)
  let R = null, ME = { role: null, team: -1 }, MYTEAM = -1, phase = 'off', tNow = -9, finT = null, res = null, matchEnd = false;
  let EXP = [], GOT = new Set(), TR = new Set(), score = 0, trapN = 0, LAYS = [], TGOT = [], TTR = [], TSC = [];
  let selD = -1, saidL = [], heardL = [], bot = null, gbot = null, SENT = new Set(), riverT = 0, riverSaid = -99;
  // UX-1(10-05 교사 편의성): 데스크톱 길잡이 = 3D 화면을 지도 오른쪽 빈 띠 가운데로(로봇이 지도에 가려지지 않게 · GD-6) — 지도 오른쪽 끝은 판을 열 때·창 크기가 바뀔 때만 잰다(매 프레임 X)
  let panelR = 0, camOff = 0; const panelRe = () => { panelR = panel.classList.contains('on') ? panel.getBoundingClientRect().right : 0; pxk(); };
  addEventListener('resize', panelRe);
  function offClear(fx, fz, o, rx, rz, d) { const px = fx - rx * o, pz = fz - rz * o; for (let j = 0; j <= 6; j++) if (blkAt(px - rz * d * j / 6, pz + rx * d * j / 6)) return false; return true; }   // 비켜 선 자리 + 그 뒤 카메라 길(d m)이 막힌 칸이 아닌지 · 바라보는 쪽 = (rz, −rx) → 뒤 = (−rz, rx)
  const helpEl = document.getElementById('help'); let help0 = null;   // 아래 안내 줄 = 길잡이 키(로봇인 척 helpSet과 같은 틀 · GD-11)
  function helpSet(on) { if (!helpEl) return; if (on) { if (help0 == null) help0 = helpEl.textContent; helpEl.textContent = '🧭 길잡이 키: 화살표(또는 W A S D) = 방위 → 숫자 1~4 = 칸 수 · Space = ✋ 멈춰 · 멈춤 P'; } else if (help0 != null) { helpEl.textContent = help0; help0 = null; } }
  // RANK-1(10-05 교사 '여러 판에 걸쳐 하는 것은 그 판 안에서 순위 비교'): 팀 순위표(친구와만) — 팀이 함께 점수를 내므로 줄 = 팀
  //   줄 'T'+팀 번호 { sc: [[그 판 점수, 그 판 길잡이, 💎]…], mem 이름들, pids } · 점수 = 판 점수 합(모든 팀이 같은 판 수 — 셋인 팀이 있으면 모두 3판)
  //   덤 x.per = 사람(pid) { n, gs: 길잡이 판 최고 점수, es: 탐험가로 찾은 💎 } → 🧭 최고 길잡이 · 🚶 보물왕
  const RK = !NETM ? null : createStandings(map, {
    id: 'gd', title: '길잡이', unit: '점', meTag: '우리 팀', nameH: '팀', rule: '점수 = 판마다 팀 점수(💎 하나 100 + 다 찾으면 남은 초 × 2 − 💥 함정 20)의 합',
    init: () => ({ sc: [], mem: '', pids: [] }), pts: r => r.sc.reduce((s, q) => s + (q ? q[0] : 0), 0),
    tie: (a, b) => b.sc.reduce((s, q) => s + (q ? q[2] : 0), 0) - a.sc.reduce((s, q) => s + (q ? q[2] : 0), 0),   // 같은 점수면 💎를 더 찾은 팀
    me: () => { for (const id in RKrows()) if (RKrows()[id].pids.includes(NM.pid)) return id; return null; },
    cols: () => { const done = Math.max(0, ...Object.values(RKrows()).map(r => r.sc.length)), n = Math.max(RK.x.rounds || 0, done), C = [{ h: '함께', f: r => esc(r.mem) }];
      for (let i = 0; i < n; i++) C.push({ h: (i + 1) + '판', f: r => r.sc[i] ? '<b>' + r.sc[i][0] + '</b><br><span style="font-size:12px;color:#5a6b80">🧭' + esc(r.sc[i][1]) + ' 💎' + r.sc[i][2] + '</span>' : (i < done ? '<span style="color:#8a97a8">-</span>' : '<span style="color:#8a97a8">⏳</span>') });
      return C; },
    progress: () => (R && R.rounds ? (R.round + 1) + '판 / ' + R.rounds + '판' : ''),
    turns: () => (R ? '🧭 이번 판 길잡이: ' + R.teams.map((tm, i) => '<span style="color:' + TEAMCSS[i % 4] + ';font-weight:900">' + TEAMN[i % 4] + '</span> ' + tm.filter(q => q.role === 'guide').map(q => q.kind === 'me' ? '<b>나</b>' : esc(q.name)).join('·')).join(' · ') + '<br><span style="font-size:12px">판마다 팀 안에서 길잡이가 바뀌어요</span>' : ''),
    foot: (L, x) => { const P = Object.values(x.per || {}), g = P.filter(q => q.g).sort((a, b) => b.gs - a.gs)[0], e = P.filter(q => q.es).sort((a, b) => b.es - a.es)[0];
      return '🧭 최고 길잡이 ' + (g ? '<b>' + esc(g.n) + '</b>(' + g.gs + '점)' : '-') + ' · 🚶 보물왕 ' + (e ? '<b>' + esc(e.n) + '</b>(💎 ' + e.es + ')' : '-'); },
  });
  const RKrows = () => (RK ? RK.rows : {});
  const clock = () => (NETM ? sNow() : Date.now());

  // ---------- 한 판 꾸리기 ----------
  function beginRound(r) {
    endRoundUI(); R = r; phase = 'count'; finT = null; res = null; chipK = {}; tNow = -cfg.count;
    LAYS = r.teams.map((tm, i) => makeLayout(r.seed ^ Math.imul(i + 1, 40503))); TGOT = r.teams.map(() => new Set()); TTR = r.teams.map(() => new Set()); TSC = r.teams.map(() => ({ s: 0, done: null }));
    MYTEAM = -1; ME = { role: 'watch', team: -1 }; EXP = [];
    r.teams.forEach((tm, ti) => tm.forEach((q, k) => { const role = k === r.round % tm.length ? 'guide' : 'exp'; q.role = role; q.team = ti;
      if (q.kind === 'me') { ME = { role, team: ti }; MYTEAM = ti; }
      if (role === 'exp') { const off = (EXP.filter(a => a.team === ti).length) * 1.2 - 0.6 * (tm.length - 2), sx = cx(START[0]) + (ti - (r.teams.length - 1) / 2) * 1.6 + off * 0.5, sz = cz(START[1]);
        EXP.push({ slot: q.slot, team: ti, kind: q.kind, pid: q.pid || null, name: q.name, x: sx, z: sz, y: GY, h: 0, walk: 0, ox: sx, oz: sz, net: null, nts: 0, nvx: 0, nvz: 0 }); } }));
    if (MYTEAM < 0) MYTEAM = 0;
    r.lay = LAYS[MYTEAM]; GOT = TGOT[MYTEAM]; TR = TTR[MYTEAM]; score = 0; trapN = 0; saidL = []; heardL = []; selD = -1; SENT = new Set(); riverT = 0; riverSaid = -99;
    paintBtns(); panel.classList.add('wait'); panel.classList.remove('done', 'lgon'); { const b = panel.querySelector('.hd .bot'); if (b) { b.textContent = ''; b.classList.remove('fl'); } }   // 지난 판 방위 단추가 켜진 채 남지 않게(GD-18)
    // 지도 번호 = 출발에서 가까운 차례(tourLen과 같은 동점 처리 · 보여 주기만 — 번호·사건·배치는 그대로 · UX-1 GD-5)
    { const ord = [], left = r.lay.tre.map((_, i) => i); let at = START; while (left.length) { let bi = left[0], bl = 1e9; for (const i of left) { const p = path(at, r.lay.tre[i], r.lay.traps), l = p ? p.length : 1e8; if (l < bl) { bl = l; bi = i; } } ord.push(bi); left.splice(left.indexOf(bi), 1); at = r.lay.tre[bi]; } r.num = r.lay.tre.map((_, i) => ord.indexOf(i) + 1); }
    const me = EXP.find(a => a.kind === 'me');
    map.player.freeze(true); map.player.run(true);
    if (ME.role === 'exp' && me) { map.player.show(true); map.player.teleport([me.x, GY + 0.02, me.z], { h: 0 }); panel.classList.remove('on'); cmpEl.style.display = 'block'; logEl.style.display = 'block'; map.player.freeMouse(false); }
    else { map.player.show(false); const f = followTarget(); map.player.teleport([f ? f.x : cx(START[0]), GY + 0.02, (f ? f.z : cz(START[1])) + 0], { h: 0 }); panel.classList.add('on'); cmpEl.style.display = 'none'; logEl.style.display = 'none'; map.player.freeMouse(true); if (ME.role === 'guide') helpSet(true); }
    document.body.classList.toggle('gd-guide', ME.role !== 'exp'); document.body.classList.toggle('gd-exp', ME.role === 'exp'); panelRe();   // 알림·배너가 지도·나침반 띠에 가려지지 않게(GD-2·GD-10)
    bot = null; gbot = null;
    if (!NETM) { if (ME.role === 'guide') bot = { a: EXP[0], c: START[0], r: START[1], left: 0, d: -1, tx: null, tz: null, wait: 0, said: '' }; else gbot = { cmd: null, t: 0, last: -9 }; }
    const myTeam = r.teams[MYTEAM] || [], gN = (myTeam.find(q => q.role === 'guide') || {}).name || '길잡이', eN = myTeam.filter(q => q.role === 'exp').map(q => q.kind === 'me' ? '나' : q.name).join(' · ');
    map.hud.goal(ME.role === 'guide' ? '🧭 길잡이 — 지도 보고 「' + (eN || '탐험가') + '」에게 길 알려 주기!' : ME.role === 'exp' ? '🚶 탐험가 — 「' + (myTeam.find(q => q.role === 'guide' && q.kind === 'me') ? '나' : gN) + '」의 말대로 보물 찾기!' : '👀 구경 — 다음 판부터 같이 해요');
    card('<div style="font-size:1.25em">' + (ME.role === 'guide' ? '🧭 이번 판은 <b>내가 길잡이</b>!' : ME.role === 'exp' ? '🚶 이번 판은 <b>내가 탐험가</b>!' : '👀 구경') + '</div>'
      + (r.rounds > 1 ? '<div style="opacity:.8;font-size:.85em">' + (r.round + 1) + ' / ' + r.rounds + '판' + (r.teams.length > 1 ? ' · ' + TEAMN[MYTEAM % 4] + ' 팀' : '') + '</div>' : ''), 2.5);
    coachK = ''; lastSaidT = -99; lastHeard = null; if (NETM && (ME.role === 'guide' || ME.role === 'exp') && !seenHow.has(ME.role)) howTo(ME.role, false);   // 친구와: 처음 맡는 역할이면 준비 시간 동안 하는 법
    chip('gd-role', ME.role === 'guide' ? '🧭 길잡이' : ME.role === 'exp' ? '🚶 탐험가' : '👀 구경');
    paintSaid(); drawMap();
  }
  function followTarget() { return EXP.find(a => a.team === MYTEAM) || EXP[0] || null; }
  function endRoundUI() { helpSet(false); document.body.classList.remove('gd-guide', 'gd-exp'); panel.classList.remove('on'); cmpEl.style.display = 'none'; sayEl.style.display = 'none'; logEl.style.display = 'none'; map.player.show(true); map.player.freeMouse(false); hideBodies(); for (let i = 0; i < GEM.count; i++) GEM.setMatrixAt(i, ZERO); for (let i = 0; i < XM.count; i++) XM.setMatrixAt(i, ZERO); GEM.instanceMatrix.needsUpdate = XM.instanceMatrix.needsUpdate = true; }
  function hideBodies() { for (let j = 0; j < NB; j++) { RB.body.setMatrixAt(j, ZERO); RB.bib.setMatrixAt(j, ZERO); RB.leg.setMatrixAt(j * 2, ZERO); RB.leg.setMatrixAt(j * 2 + 1, ZERO); } RB.body.instanceMatrix.needsUpdate = RB.bib.instanceMatrix.needsUpdate = RB.leg.instanceMatrix.needsUpdate = true; }

  // ---------- 🧭 길잡이 말(단추·키) ----------
  function sendDir(d) { if (ME.role !== 'guide' || (phase !== 'play' && phase !== 'count')) return; selD = d; paintBtns(); drawMap(); }   // 준비 3초에도 방위만 미리 골라 둠(이 화면만 — 보내는 것 없음 · GD-18)
  function sendK(k) { if (ME.role !== 'guide') return; if (phase === 'count') { map.hud.toast('⏱ 곧 시작해요 — 방위만 먼저 골라 둘 수 있어요', 1.6); return; } if (phase !== 'play') return; if (selD < 0) { map.hud.toast('먼저 방위(⬆북 ➡동 ⬇남 ⬅서)를 골라요', 1.8); return; } say(selD * 10 + k); }
  function say(n) { if (ME.role !== 'guide' || phase !== 'play') return; emit({ k: 'msg', by: R.mySlot ?? 0, who: MYTEAM, n }); map.tone(880, 0, 0.06, 'sine', 0.05); }
  function paintBtns() { panel.querySelectorAll('[data-d]').forEach(b => b.classList.toggle('on', +b.dataset.d === selD)); panel.classList.toggle('pick', selD >= 0); }
  function paintSaid() { const el = panel.querySelector('.said'); if (el) el.textContent = saidL.length ? '내가 한 말: ' + saidL.slice(-3).join(' → ') : '방위를 고른 뒤 칸 수를 누르면 탐험가에게 말이 가요(키: 화살표·WASD → 1~4 · Space = 멈춰)'; }
  panel.addEventListener('click', e => { e.stopPropagation(); if (panel.classList.contains('lgon') && e.target.closest('.lg')) { panel.classList.remove('lgon'); return; }   // 휴대폰 범례 = 누르면 닫힘
    const b = e.target.closest('button'); if (!b) return; b.blur();
    if (b.dataset.d != null) sendDir(+b.dataset.d); else if (b.dataset.k != null) sendK(+b.dataset.k); else if (b.dataset.p != null) say(+b.dataset.p);
    else if (b.dataset.lg != null) panel.classList.toggle('lgon');
    else if (b.dataset.q != null) { if (b.dataset.arm === '1') map.quit(); else { b.dataset.arm = '1'; b.textContent = '⏹ 한 번 더 누르면 그만'; setTimeout(() => { if (b.isConnected) { b.dataset.arm = ''; b.textContent = '⏹ 그만하기'; } }, 2500); } } });   // 휴대폰 ⏹ = 두 번 눌러야(친구와 할 때 엄지가 잘못 닿아 팀이 빠지지 않게 · GD-1)
  const keyH = e => { if (!R) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (ME.role === 'guide' && e.code === 'Space' && (!t || t === document.body || t === document.documentElement || panel.contains(t))) e.preventDefault();   // Space가 단추를 다시 누르지 않게(GD-4 — 다른 창의 단추는 그대로)
    if (e.repeat || ME.role !== 'guide') return;
    const dk = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 }[e.code], kk = { Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 4, Numpad1: 1, Numpad2: 2, Numpad3: 3, Numpad4: 4 }[e.code];
    if (phase === 'count' && !howEl) { if (dk != null) { e.preventDefault(); sendDir(dk); } else if (kk != null) { e.preventDefault(); sendK(kk); } return; }
    if (phase !== 'play') return;
    if (dk != null) { e.preventDefault(); sendDir(dk); } else if (kk != null) { e.preventDefault(); sendK(kk); } else if (e.code === 'Space') { e.preventDefault(); say(90); } };
  addEventListener('keydown', keyH);

  // ---------- 사건(친구 대결 = Firebase ev — 서버에서 돌아온 순서로 · 혼자 = 바로) ----------
  function emit(e) { if (NETM && NM.on) netEmit(e); else onEv(e); }
  function onEv(e) {
    if (!R) return; const ti = e.who | 0; if (!R.teams[ti]) return;
    const et = NETM && e.t ? (e.t - R.t0) / 1000 - cfg.count : tNow; if (et > cfg.play + 0.05 || et < -0.5) return;
    if (TSC[ti].done != null && et > TSC[ti].done + 0.05) return;
    if (e.k === 'msg') {
      const txt = msgText(e.n); if (!txt) return;
      if (ti === MYTEAM) { if (e.n < 90) { lastSaidT = Math.max(0, et); if (ME.role === 'guide') selD = -1, paintBtns(); lastHeard = { txt: txt.replace(/!$/, ''), dir: DIRS[Math.floor(e.n / 10)].t, k: e.n % 10, di: Math.floor(e.n / 10) }; }
        if (ME.role === 'guide') { saidL.push(txt.replace(/!$/, '')); paintSaid(); } else if (ME.role === 'exp') hear(txt); else if (ME.role === 'watch') { saidL.push(txt); } }
      if (bot && ti === MYTEAM && e.n < 90) botCmd(Math.floor(e.n / 10), e.n % 10); else if (bot && ti === MYTEAM && e.n === 90) { bot.left = 0; botSay('멈췄어요'); }
      else if (bot && ti === MYTEAM && e.n === 92) botSay('알겠어요! 그래도 저는 말한 대로만 가요'); else if (bot && ti === MYTEAM && e.n === 91) botSay('헤헤, 고마워요!');   // 로봇은 말 그대로만 — 함정을 스스로 피하지 않아요(GD-16)
    } else if (e.k === 'got') {
      const S = TGOT[ti]; if (S.has(e.n)) return; S.add(e.n); TSC[ti].s += 100;
      if (S.size >= cfg.tre) { TSC[ti].done = Math.max(0, et); TSC[ti].s += Math.max(0, Math.round((cfg.play - et) * 2)); }
      if (ti === MYTEAM) { score = TSC[ti].s; if (S.size < cfg.tre) map.hud.banner('💎 보물 ' + S.size + '/' + cfg.tre + '!', 1.3); map.tone(988, 0, 0.1, 'sine', 0.08); map.tone(1318, 0.1, 0.18, 'sine', 0.08); if (S.size >= cfg.tre) map.tone(1568, 0.3, 0.3, 'sine', 0.08); }
      if (R.teams.every((tm, i) => TSC[i].done != null) && finT == null) finT = Math.max(0, et);
    } else if (e.k === 'trp') {
      const S = TTR[ti]; if (!S.has(e.n)) S.add(e.n); TSC[ti].s -= 20; if (ti === MYTEAM) { trapN++; score = TSC[ti].s; map.hud.banner('💥 함정! 한 칸 뒤로', 1.3); map.tone(330, 0, 0.25, 'sawtooth', 0.06); }
    }
    drawMap();
  }
  function hear(txt) { heardL.push(txt); sayEl.innerHTML = '🧭 ' + esc(txt) + '<small>길잡이가 말했어요</small>'; sayEl.style.display = 'block'; clearTimeout(hear.t); hear.t = setTimeout(() => { sayEl.style.display = 'none'; }, 4200);
    logEl.innerHTML = '<div style="font-weight:900">🧭 들은 말</div>' + heardL.slice(-5).reverse().map((t, i) => '<div style="opacity:' + (i ? 0.7 : 1) + '">' + esc(t) + '</div>').join(''); map.tone(660, 0, 0.08, 'square', 0.05); map.tone(880, 0.09, 0.1, 'square', 0.05); }

  // ---------- 🚶 탐험가(나): 칸 판정 — 보물 줍기 · 함정 = 직전 칸 가운데로 ----------
  function meTick(dt) {
    const me = EXP.find(a => a.kind === 'me'); if (!me) return; const p = map.player.get(); const dx = p.x - me.x, dz = p.z - me.z;
    if (dx * dx + dz * dz > 0.0004) me.h = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360; me.x = p.x; me.z = p.z; me.y = p.y;
    if (phase !== 'play') return; checkCell(me);
    // 강가에 막혀 있으면 까닭을(강 = 보이지 않는 벽처럼 느껴짐 · 다리 = 2·5번째 줄 · UX-1 GD-10)
    const rx = Math.min(Math.abs(me.x - (X0 + 6 * CELL)), Math.abs(me.x - (X0 + 7 * CELL))), rr = Math.floor((me.z - Z0) / CELL);
    if (rx < 0.5 && rr >= 0 && rr < ROWS && rr !== 1 && rr !== 4) { if ((riverT += dt) > 0.7 && tNow - riverSaid > 8) { riverSaid = tNow; map.hud.toast('🌊 강은 못 건너요 — 다리로 건너요', 2.2); } } else riverT = 0;
  }
  function checkCell(a) {   // 내 화면 탐험가(사람) · 봇 = 혼자 놀이
    const [c, r] = cellOf(a.x, a.z), L = LAYS[a.team]; if (!L) return;
    L.tre.forEach((q, i) => { const key = a.team + ':' + i; if (!TGOT[a.team].has(i) && !SENT.has(key) && Math.hypot(a.x - cx(q[0]), a.z - cz(q[1])) < cfg.pickR) { SENT.add(key); emit({ k: 'got', by: a.slot, who: a.team, n: i }); } });   // 한 번만 보냄(서버에서 돌아오기 전에 매 프레임 또 보내지 않게)
    const ti = L.traps.findIndex(q => Math.hypot(a.x - cx(q[0]), a.z - cz(q[1])) < cfg.trapR);
    if (ti >= 0) { if (a.trapCd > 0) return; a.trapCd = 1.2; emit({ k: 'trp', by: a.slot, who: a.team, n: ti }); const b = a.cur || START; a.x = cx(b[0]); a.z = cz(b[1]); if (a.kind === 'me') map.player.teleport([a.x, GY + 0.02, a.z]); if (a.kind === 'bot' && bot) { bot.c = b[0]; bot.r = b[1]; bot.left = 0; bot.tx = null; botSay('으악, 함정이에요! 한 칸 뒤로 왔어요'); } return; }   // 함정 → 직전에 있던 안전한 칸 가운데로
    if (inGrid(c, r) && !L.traps.some(q => q[0] === c && q[1] === r) && !BLOCK.has(KEY(c, r))) { if (!a.cur || a.cur[0] !== c || a.cur[1] !== r) a.cur = [c, r]; }
  }

  // ---------- 🤖 탐험 로봇(혼자 길잡이 놀이): 내 말을 글자 그대로 — 칸 가운데에서 칸 가운데로 · 막히면 멈춤 · 함정이면 빠짐 ----------
  function botSay(t) { if (!bot) return; bot.said = t; bot.saidT = tNow; const el = panel.querySelector('.hd .bot'); if (el) { el.textContent = '🤖 ' + t; el.classList.remove('fl'); void el.offsetWidth; el.classList.add('fl'); } drawMap(); }   // 로봇 말 = 지도 머리 줄 + 지도 위 말풍선(알림은 지도 밑에 깔려 안 보였다 — UX-1 GD-2)
  function botCmd(d, k) { if (!bot) return; bot.d = d; bot.left = k; botSay(['알겠어요!', '출발!', '가요!'][Math.floor(Math.random() * 3)] + ' ' + DIRS[d].t + '쪽으로 ' + k + '칸'); }
  function botTick(dt) {
    const a = bot.a; if (a.trapCd > 0) a.trapCd -= dt;
    if (bot.tx == null) { if (bot.left <= 0) return; const c2 = bot.c + DIRS[bot.d].dc, r2 = bot.r + DIRS[bot.d].dr;
      if (!inGrid(c2, r2)) { bot.left = 0; botSay('더 갈 수 없어요 — 마을 끝이에요'); return; }
      const B = BLOCK.get(KEY(c2, r2)); if (B) { bot.left = 0; botSay('앞에 ' + iga(B.n) + ' 있어서 못 가요'); return; }
      bot.tx = cx(c2); bot.tz = cz(r2); bot.nc = [c2, r2]; bot.left--; }
    const dx = bot.tx - a.x, dz = bot.tz - a.z, d = Math.hypot(dx, dz), st = cfg.v * dt;
    if (d > 1e-3) a.h = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360;
    if (d <= st) { a.x = bot.tx; a.z = bot.tz; bot.c = bot.nc[0]; bot.r = bot.nc[1]; bot.tx = null; if (bot.left <= 0) botSay('도착! 다음은요?'); } else { a.x += dx / d * st; a.z += dz / d * st; }
    checkCell(a);
  }
  // ---------- 🧭 길잡이 봇(혼자 탐험가 놀이): 가장 가까운 보물까지 길의 첫 직선을 말함 · 도착하거나 길에서 벗어나면 다시 ----------
  function gbotTick(dt) {
    const me = EXP.find(a => a.kind === 'me'); if (!me || !me.cur) return; gbot.t -= dt; if (gbot.t > 0) return; gbot.t = 0.3;
    const at = me.cur, L = R.lay, c0 = gbot.cmd;
    { const ti = L.tre.findIndex(q => q[0] === at[0] && q[1] === at[1]); if (ti >= 0 && !GOT.has(ti)) { if (gbot.inK !== ti) { gbot.inK = ti; gbot.inT = tNow; } if (tNow - gbot.inT > 0.8 && tNow - (gbot.nudge ?? -9) > 3) { gbot.nudge = tNow; emit({ k: 'msg', by: 1, who: MYTEAM, n: 93 }); } return; } gbot.inK = -1; }   // 보물 칸 가장자리에 서서 못 주움 → 봇이 입을 닫던 것(GD-3) · 0.8초 머물면 '가운데로'(걸어 들어가는 중엔 조용) · 93 = 혼자 놀이 봇만
    const onLine = c0 && ((DIRS[c0.d].dc && at[1] === c0.from[1] && (at[0] - c0.from[0]) * DIRS[c0.d].dc >= 0 && (at[0] - c0.from[0]) * DIRS[c0.d].dc <= c0.k) || (DIRS[c0.d].dr && at[0] === c0.from[0] && (at[1] - c0.from[1]) * DIRS[c0.d].dr >= 0 && (at[1] - c0.from[1]) * DIRS[c0.d].dr <= c0.k));
    const arrived = c0 && at[0] === c0.to[0] && at[1] === c0.to[1];
    if (c0 && onLine && !arrived && tNow - c0.t < 9) return;
    if (c0 && !onLine && tNow - c0.t < 1.5) return;
    const nx = botCommand(at, L.tre, GOT, L.traps); if (!nx) return;
    if (c0 && !onLine && !arrived && Math.random() < 0.5) emit({ k: 'msg', by: 1, who: MYTEAM, n: 90 });
    gbot.cmd = { ...nx, from: at.slice(), t: tNow }; setTimeout(() => { if (!dead && R && phase === 'play') emit({ k: 'msg', by: 1, who: MYTEAM, n: nx.d * 10 + nx.k }); }, 500);
  }

  // ---------- 매 프레임 ----------
  let uiT = 0, mapT = 0;
  function tick(dt) {
    if (!R) return;
    const t = (clock() - R.t0) / 1000 - cfg.count; tNow = t;
    const endAt = finT != null ? finT : cfg.play, p = t < 0 ? 'count' : t < endAt ? 'play' : 'res';
    if (p !== phase) setPhase(p);
    if (ME.role === 'exp') { meTick(dt); const me = EXP.find(a => a.kind === 'me'); if (me && me.trapCd > 0) me.trapCd -= dt; }
    if (p === 'play' && bot) botTick(dt);
    if (p === 'play' && gbot) gbotTick(dt);
    for (const a of EXP) if (a.kind === 'remote') netActor(a, dt);
    if (ME.role !== 'exp') { const f = followTarget(); if (f) { let x = f.x, z = f.z, want = 0; const W = innerWidth;   // 길잡이·구경 화면 = 우리 팀 탐험가 뒤를 따라감(내 몸은 숨김)
        // 데스크톱: 숨은 나를 왼쪽으로 비켜 세워 로봇이 지도 오른쪽 빈 띠 가운데에 보이게(GD-6) — 비켜 선 자리나 그 뒤 카메라 길이 산·강·건물 칸이면 반만·안 비킴(카메라가 막혀 당겨지지 않게) · 비키는 양은 부드럽게
        if (panelR && !document.body.classList.contains('small') && W - panelR > 160) { const cam = map.camera; cam.getWorldDirection(_dir); const hl = Math.hypot(_dir.x, _dir.z) || 1, rx = -_dir.z / hl, rz = _dir.x / hl, pp = map.player.pos(), dist = Math.hypot(cam.position.x - pp.x, cam.position.z - pp.z) || 5.7, cd = Math.max(dist, 5),
            off = Math.min(4.5, (panelR / W) * dist * Math.tan(cam.fov * Math.PI / 360) * cam.aspect);
          const rise = cam.position.y - (GY + 1.32), um = rise > 0.58 ? 0.58 / rise : 1;   // 머리→카메라 선이 막힌 칸 높이(1.8m) 아래인 구간만 봄(보통 시점이면 머리 뒤 ≈1.9m · 낮게 보면 끝까지)
          for (let k = 1; k > 0.2; k -= 0.5) if (offClear(f.x, f.z, off * k, rx, rz, cd * um)) { want = off * k; break; }
          let nv = camOff + (want - camOff) * (1 - Math.exp(-6 * dt)); if (!offClear(f.x, f.z, nv, rx, rz, cd * um)) nv = want; camOff = nv;   // 부드럽게 가다가 막힌 자리를 지나면 바로 목표로
          x = Math.max(X0 - 1.2, Math.min(X0 + COLS * CELL + 1.2, f.x - rx * camOff)); z = Math.max(Z0 - 1.2, Math.min(Z0 + ROWS * CELL + 1.2, f.z - rz * camOff)); } else camOff = 0;
        map.player.teleport([x, GY + 0.02, z]); } }
    if (ME.role === 'exp') compassTick();
    draw(dt);
    if ((mapT -= dt) <= 0 && (ME.role !== 'exp')) { mapT = 0.1; drawMap(); }
    if ((uiT -= dt) <= 0) { uiT = 0.2; const S = TSC[MYTEAM] || { s: 0 };
      chip('gd-time', p === 'count' ? '⏱ 준비 ' + Math.ceil(-t) : p === 'play' ? '⏱ ' + fmt(Math.max(0, cfg.play - t)) : '🏁 끝');
      chip('gd-score', '💎 ' + GOT.size + '/' + cfg.tre + ' · 💥 ' + trapN + ' · ' + S.s + '점');   // QA-1: 💥 = 밟은 횟수(−20씩 — 점수·결과 카드와 같게 · 예전 = 함정 종류 수라 −300인데 💥 1)
      const st = panel.querySelector('.st'); if (st) st.textContent = (p === 'count' ? '⏱ 준비 ' + Math.ceil(-t) : p === 'play' ? '⏱ ' + fmt(Math.max(0, cfg.play - t)) : '🏁 끝') + ' · 💎 ' + GOT.size + '/' + cfg.tre + ' · ' + S.s + '점'; coach(); }   // 끝나면 시계를 멈춤(GD-17)
    if (NETM && NM.on) { netSend(dt); hostRun(t, endAt); }
    else if (p === 'res' && t > endAt + cfg.end && !matchEnd) { matchEnd = true; soloEnd(); }
  }
  function setPhase(p) {
    const was = phase; phase = p; if (p !== 'count') howClose();
    if (p === 'play') { panel.classList.remove('wait'); if (ME.role === 'exp') { map.player.freeze(false); map.hud.banner('🚶 출발!', 1.1); } /* QA-1: 길잡이는 시작 배너 없음 — 지도 가운데(보물)를 1.2초 가렸다 · 위 '지금 할 일' 줄이 같은 말 */ map.tone(784, 0, 0.14, 'square', 0.05); if (gbot) gbot.t = 0.4; }
    else if (p === 'res') { panel.classList.add('done'); panel.classList.remove('wait'); selD = -1; paintBtns(); { const b = panel.querySelector('.hd .bot'); if (b) b.textContent = ''; } roundResult(was); }   // 끝 = 단추 흐리게 · 로봇 말 지움(GD-18)
  }
  // 나침반 띠: 카메라가 보는 방향(북 = −z)을 가운데로 — 15°마다 눈금
  const _dir = new THREE.Vector3();
  function compassTick() {
    map.camera.getWorldDirection(_dir); const yaw = (Math.atan2(_dir.x, -_dir.z) * 180 / Math.PI + 360) % 360, W = cmpEl.clientWidth || 380, pxd = W / 180;
    for (const el of cmpEl.children) { if (!el.dataset || el.dataset.a == null) continue; let d = +el.dataset.a - yaw; while (d > 180) d -= 360; while (d < -180) d += 360; const vis = Math.abs(d) < (el.tagName === 'B' ? 84 : 92); el.style.display = vis ? 'block' : 'none'; if (vis) el.style.left = (W / 2 + d * pxd) + 'px'; }   // 글자는 84° 안에서만(띠 끝에서 반쯤 잘리지 않게)
    // 들은 방위 = 노란 글자 · 띠 밖이면 끝에 '◀ 북' / '뒤로 돌아 북 ▶'(어느 쪽으로 돌지 · UX-1 GD-9) — 글이 바뀔 때만 씀
    const ta = lastHeard && phase === 'play' ? lastHeard.di * 90 : -1;
    if (ta !== cmpEl._ta) { cmpEl._ta = ta; for (const el of cmpEl.querySelectorAll('b')) el.classList.toggle('t', +el.dataset.a === ta); }
    let side = '', txt = '';
    if (ta >= 0) { let d = ta - yaw; while (d > 180) d -= 360; while (d < -180) d += 360; const ad = Math.abs(d);
      if (ad >= 80) { side = d > 0 ? 'r' : 'l'; if (ad > 150 && cmpEl._side) side = cmpEl._side; const dir = lastHeard.dir, back = ad > 150 ? '뒤로 돌아 ' : ''; txt = side === 'r' ? back + dir + ' ▶' : '◀ ' + back + dir; } }   // 거의 뒤면 좌우가 흔들리지 않게 고른 쪽 그대로
    if (side !== cmpEl._side || txt !== cmpEl._tx) { cmpEl._tx = txt; cmpEl._side = side; cmpL.style.display = side === 'l' ? 'block' : 'none'; cmpR.style.display = side === 'r' ? 'block' : 'none'; if (side === 'l') cmpL.textContent = txt; else if (side === 'r') cmpR.textContent = txt; }
  }
  // 몸 그리기: 탐험가(나는 내 캐릭터 · 남·봇 = 장난감 로봇 팀 색) · 찾은 보석 · 드러난 함정 ✕
  function draw(dt) {
    for (let j = 0; j < NB; j++) { const a = EXP[j];
      if (!a || a.kind === 'me' || phase === 'off') { RB.body.setMatrixAt(j, ZERO); RB.bib.setMatrixAt(j, ZERO); RB.leg.setMatrixAt(j * 2, ZERO); RB.leg.setMatrixAt(j * 2 + 1, ZERO); continue; }
      const mv = Math.hypot(a.x - a.ox, a.z - a.oz); a.walk += Math.min(mv, 0.5) * 5.5; a.ox = a.x; a.oz = a.z;
      const yaw = Math.PI - (a.h || 0) * Math.PI / 180, sy = Math.sin(yaw), cyw = Math.cos(yaw), bob = mv > 0.004 ? Math.abs(Math.sin(a.walk)) * 0.035 : 0, yb = GY + 0.01 + bob;
      _q.setFromEuler(_e.set(0, yaw, 0)); _s.set(1, 1, 1); _v.set(a.x, yb, a.z); RB.body.setMatrixAt(j, _m4.compose(_v, _q, _s)); RB.bib.setMatrixAt(j, _m4); RB.bib.setColorAt(j, _c.set(TEAMC[a.team % 4]));
      const sw = mv > 0.004 ? Math.sin(a.walk) * 0.7 : 0;
      for (let s = 0; s < 2; s++) { const side = s ? 1 : -1, ox = 0.085 * side; _v.set(a.x + ox * cyw, yb + 0.34, a.z - ox * sy); _q.setFromEuler(_e.set(sw * side, yaw, 0)); RB.leg.setMatrixAt(j * 2 + s, _m4.compose(_v, _q, _s)); } }
    RB.body.instanceMatrix.needsUpdate = RB.bib.instanceMatrix.needsUpdate = RB.leg.instanceMatrix.needsUpdate = true; RB.bib.instanceColor.needsUpdate = true;
    const L = R && R.lay; let gi = 0, xi = 0;
    if (L) { const tt = performance.now() / 1000;
      L.tre.forEach((q, i) => { if (!GOT.has(i) || gi >= GEM.count) return; _q.setFromEuler(_e.set(0, tt * 2 + i, 0)); _s.set(1, 1.4, 1); _v.set(cx(q[0]), GY + 1.2 + Math.sin(tt * 3 + i) * 0.15, cz(q[1])); GEM.setMatrixAt(gi++, _m4.compose(_v, _q, _s)); });
      L.traps.forEach((q, i) => { if (!TR.has(i) || xi + 1 >= XM.count) return; for (const a of [0.785, -0.785]) { _q.setFromEuler(_e.set(0, a, 0)); _s.set(1, 1, 1); _v.set(cx(q[0]), GY + 0.04, cz(q[1])); XM.setMatrixAt(xi++, _m4.compose(_v, _q, _s)); } }); }
    for (let i = gi; i < GEM.count; i++) GEM.setMatrixAt(i, ZERO); for (let i = xi; i < XM.count; i++) XM.setMatrixAt(i, ZERO); GEM.instanceMatrix.needsUpdate = XM.instanceMatrix.needsUpdate = true;
  }

  // ---------- 판 결과 ----------
  function roundResult() {
    map.player.freeze(true); sayEl.style.display = 'none';
    const S = TSC[MYTEAM] || { s: 0 }, n = GOT.size;
    res = { found: n, score: S.s, traps: TR.size };
    if (RK && NM.on && R) RK.round(R.seq, R.round, (row, x) => {   // RANK-1: 이 판 팀 점수(판마다 한 번) + 사람별 덤(최고 길잡이·보물왕)
      x.rounds = R.rounds; const per = x.per || (x.per = {});
      for (const [ti, tm] of R.teams.entries()) { const r = row('T' + ti, TEAMN[ti % 4] + ' 팀'), g = tm.find(q => q.role === 'guide');
        r.mem = tm.map(q => q.name).join('·'); for (const q of tm) if (q.pid && !r.pids.includes(q.pid)) r.pids.push(q.pid);
        r.sc[R.round] = [TSC[ti].s, g ? g.name : '', TGOT[ti].size];
        for (const q of tm) if (q.kind !== 'bot' && q.pid) { const p = per[q.pid] || (per[q.pid] = { n: q.name, gs: 0, es: 0, g: 0 }); if (q.role === 'guide') { p.gs = Math.max(p.gs, TSC[ti].s); p.g++; } else p.es += TGOT[ti].size; } } });
    // 이번 판 팀 순위(둘째 판부터 — 첫 판은 아래 📊 합계와 같음)
    const rank = R.teams.length > 1 && (!RK || R.round > 0) ? '<br><span style="font-size:.9em">이번 판: ' + R.teams.map((tm, i) => i).sort((a, b) => TSC[b].s - TSC[a].s).map((i, k) => (k + 1) + '등 ' + TEAMN[i % 4] + ' ' + TSC[i].s + '점(💎' + TGOT[i].size + ')').join(' · ') + '</span>' : '';
    const bon = S.s - n * 100 + trapN * 20;   // 점수 풀이(보여 주기만 — 셈은 그대로 · GD-17)
    card('<div style="font-size:1.3em">' + (n >= cfg.tre ? '🎉 보물을 모두 찾았어요!' : '💎 보물 ' + n + '/' + cfg.tre) + '</div>' + '💎 ' + n + '개 ' + n * 100 + (bon > 0 ? ' + ⏱ 빨리 찾은 보너스 ' + bon : '') + (trapN ? ' − 💥 ' + trapN + '번 ' + trapN * 20 : '') + ' = ' + S.s + '점' + rank + (RK && NM.on ? RK.strip() : ''), cfg.end);
    if (n >= cfg.tre) { map.tone(523, 0, 0.15, 'sine', 0.1); map.tone(659, 0.15, 0.15, 'sine', 0.1); map.tone(784, 0.3, 0.3, 'sine', 0.1); }
    if (!NETM) { const k = ME.role === 'guide' ? 'bestGuide' : 'bestExp', b = map.store.get(k, 0); res.best = Math.max(b, S.s); res.newBest = S.s > b && S.s > 0; if (S.s > b) map.store.set(k, S.s); }
    drawMap();
  }
  const myName = () => (NETM ? NM.name : '나');

  // ---------- 혼자 ----------
  async function soloAsk() {
    let role = params.role === 'guide' || params.role === 'exp' ? params.role : null;
    if (!role) { const i = await map.hud.ask('🧭 길잡이 — 운동장 지도 마을에서 보물 찾기\n한 판 ' + cfg.play + '초 · 보물 3개 · 함정 5개 · 1칸 = 5m · 친구와 하려면 👥 함께하기 방의 🏠 대기실에서 방장이 🧭 길잡이를 골라요',
      ['🚶 탐험가 — 길잡이 봇의 말(방위·칸 수)을 듣고 보물 찾기', '🧭 길잡이 — 지도를 보고 탐험 로봇에게 길 알려 주기(로봇은 말 그대로 움직여요)']);
      if (i < 0 || dead) return; role = i === 1 ? 'guide' : 'exp'; }
    await howTo(role, true); if (dead) return;
    soloRound(role);
  }
  function soloRound(role) {
    matchEnd = false;
    const team = role === 'guide' ? [{ kind: 'me', name: '나', slot: 0 }, { kind: 'bot', name: '탐험 로봇', slot: 1 }] : [{ kind: 'bot', name: '길잡이 봇', slot: 1 }, { kind: 'me', name: '나', slot: 0 }];
    beginRound({ seq: 1, t0: Date.now() + 300, seed: Math.floor(Math.random() * 1e9), round: 0, rounds: 1, teams: [team], mySlot: 0 });
  }
  async function soloEnd() {
    const role = ME.role === 'guide' ? 'guide' : 'exp';
    const i = await map.hud.ask((res ? '💎 ' + res.found + '/' + cfg.tre + ' · ' + res.score + '점' + (res.newBest ? ' · 🏆 새 기록!' : res.best > 0 ? ' · 🏆 내 최고 ' + res.best + '점' : '') + (res.found === 0 ? '\n💡 ' + (role === 'guide' ? '방위 단추 → 칸 수 단추를 차례로 눌러 봐요' : '나침반 띠의 노란 글자를 가운데로 맞추고 걸어 봐요') : '') : '끝'), ['🔄 다시 하기', role === 'guide' ? '🚶 탐험가 해 보기' : '🧭 길잡이 해 보기', '🏠 그만하기']);
    if (dead) return; if (i === 0) soloRound(role); else if (i === 1) { const r2 = role === 'guide' ? 'exp' : 'guide'; if (!seenHow.has(r2)) { await howTo(r2, true); if (dead) return; } soloRound(r2); } else map.quit();
  }

  // =====================================================================================
  // 👥 친구와 — Firebase match/c<번호>(m.arena 'gd…') · 방 놀이(선생님이 👥 창에서 🧭 길잡이를 고르면 모두 이 대기실로)
  //   m { st, host, arena 'gd0', time = 판 수, goal = 판 번호, seq, t0 } — 팀 배치 씨앗 = t0·seq·팀 · p/<pid> { n, tm = 차례(0~) · 99 = 늦게 옴 }
  //   팀 = 차례대로 둘씩(홀수면 마지막 셋) · 판마다 팀 안에서 길잡이가 돌아감 · s/<pid> = 탐험가 [x, y, z, h, 0, 신호, ts, 왕복] · ev = msg(n 말 번호 · who 팀) · got(보물 n) · trp(함정 n)
  // =====================================================================================
  const roomLed = () => { const mp = window.SM_MP; return !!(NETM && mp && mp.roomGame && mp.roomGame() === 'guide_vs'); };   // ROOM-2: 방장이 🏠 대기실에서 고른 방 놀이
  const roomBack = (t, html, ms) => { const mp = window.SM_MP; if (!roomLed()) return false; if (mp.setLast) mp.setLast({ t, html }); setTimeout(() => { if (!dead) map.quit(); }, ms); return true; };   // 결과를 대기실로 넘기고 ms 뒤 모두 같이 나감
  const NM = { on: false, room: null, pid: null, name: '', host: false, es: null, D: {}, seen: new Set(), off: 0, seq: -1, st: null, sendT: 0, busyS: 0, offs: [], ui: null, beat: 0, beatN: 0, lastSend: 0, claim: false, seenAt: {}, adv: false, advSeq: null, lag: 0 };
  const nreq = (path, method = 'GET', data) => fetch(MDB + NM.room + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data), keepalive: true }).then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))));
  const sNow = () => Date.now() + NM.off;
  const ctlMatch = (seq, st) => { const mp = window.SM_MP, N = mp && mp.net(); if (N && N.ctl) N.ctl('match', { seq, st }); };
  const r2 = v => Math.round(v * 100) / 100;
  const isGD = m => !!m && /^gd/.test(m.arena || '');
  const busyMsg = m => (/^hs/.test(m.arena || '') ? '🙈 지금 이 방은 숨바꼭질 대작전 중이에요' : /^rb/.test(m.arena || '') ? '🤖 지금 이 방은 로봇인 척 중이에요' : '💦 지금 이 방은 물총 친구 대결 중이에요') + ' — 끝나면 다시 와요';
  function applyEvt(root, type, path, d) {
    const set = (r, p, v) => { if (!p.length) return v && typeof v === 'object' ? v : {}; let o = r; for (let i = 0; i < p.length - 1; i++) { if (!o[p[i]] || typeof o[p[i]] !== 'object') { if (v === null) return r; o[p[i]] = {}; } o = o[p[i]]; } if (v === null) delete o[p[p.length - 1]]; else o[p[p.length - 1]] = v; return r; };
    if (type === 'put') return set(root, path, d);
    if (d && typeof d === 'object') for (const k in d) root = set(root, [...path, ...k.split('/').filter(Boolean)], d[k]);
    return root;
  }
  async function netEnter() {
    const mp = window.SM_MP; if (!mp || !mp.room()) { map.hud.toast('👥 함께하기 방에 먼저 들어가요', 3); map.quit(); return; }
    const N = mp.net(); NM.on = true; NM.room = mp.room(); NM.pid = (N && N.id) || ('p' + Math.random().toString(36).slice(2, 10)); NM.name = (N && N.name) || '친구';
    NM.D = {}; NM.seen.clear(); NM.seq = -1; NM.st = null; NM.seenAt = {};
    if (N && N.hide) N.hide(true);
    lobbyDraw('불러오는 중…');
    let D0 = null;
    try {
      D0 = (await nreq('')) || {};
      const P = D0.p || {}, m = D0.m, live = m && m.st !== 'end' && P[m.host] && Object.keys(P).length;   /* QA-1(10-10): 끝난 경기(st end)는 진행 중이 아님 — 앞 방 놀이 자료가 남아(새로고침한 친구의 옛 자리가 방장으로 넘겨받음) 다음 놀이가 '지금 ○○ 중'이라며 못 들어가던 것 */
      if (live && !isGD(m)) { map.hud.toast(busyMsg(m), 4); NM.on = false; if (N && N.hide) N.hide(false); lobbyHide(); map.quit(); return; }
      const t1 = Date.now(), r = await nreq('/p/' + NM.pid, 'PUT', { n: NM.name, tm: 99, on: { '.sv': 'timestamp' } }), t2 = Date.now(); NM.off = r.on - (t1 + t2) / 2;
      if (!live) { const sq = ((m && m.seq) || 0) + 1; await nreq('/m', 'PUT', { st: 'lobby', host: NM.pid, arena: 'gd0', time: 0, goal: 0, seq: sq, t0: 0 }); ctlMatch(sq, 'globby'); }
    } catch (e) { map.hud.toast('😥 친구와 하기에 들어가지 못했어요 — 인터넷·방을 확인해 주세요', 4); NM.on = false; if (N && N.hide) N.hide(false); lobbyHide(); map.quit(); return; }
    if (dead || !NM.on) return;
    if (D0 && D0.ev) for (const id in D0.ev) NM.seen.add(id);
    NM.es = new EventSource(MDB + NM.room + '.json');
    const on = type => e => { let msg; try { msg = JSON.parse(e.data); } catch (er) { return; } if (!msg) return; NM.D = applyEvt(NM.D, type, (msg.path || '/').split('/').filter(Boolean), msg.data); netSync(); };
    NM.es.addEventListener('put', on('put')); NM.es.addEventListener('patch', on('patch'));
    addEventListener('pagehide', netBye); addEventListener('sm-room', netRoomGone);
    clearInterval(NM.beat); NM.beat = setInterval(() => { if (NM.on && performance.now() - NM.lastSend > 2500) netSend(0, true); }, 1500);
  }
  function netRoomGone(e) { if (!e.detail && NM.on && !dead) { map.hud.toast('🚪 방이 닫혀서 길잡이를 마쳤어요', 3); map.quit(); } }
  function netBye() { if (!NM.on) return; fetch(MDB + NM.room + '/p/' + NM.pid + '.json', { method: 'DELETE', keepalive: true }).catch(() => {}); fetch(MDB + NM.room + '/s/' + NM.pid + '.json', { method: 'DELETE', keepalive: true }).catch(() => {}); }
  function netLeave() {
    if (!NM.on) return; const P = NM.D.p || {}, rest = Object.keys(P).filter(id => id !== NM.pid).sort((a, b) => (P[a].on || 0) - (P[b].on || 0));
    if (!rest.length) nreq('', 'DELETE').catch(() => {}); else { netBye(); if (NM.host) nreq('/m/host', 'PUT', rest[0]).catch(() => {}); }
    if (NM.es) NM.es.close(); NM.es = null; NM.on = false; clearInterval(NM.beat); removeEventListener('pagehide', netBye); removeEventListener('sm-room', netRoomGone);
    const mp = window.SM_MP, N = mp && mp.net(); if (N && N.hide) N.hide(false); lobbyHide(); if (RK) RK.hide();
  }
  function toLobbyUI() { if (R) { R = null; endRoundUI(); phase = 'off'; } if (RK) RK.hide(); map.hud.goal(null); for (const k of ['gd-time', 'gd-score', 'gd-role']) map.hud.chip(k, null); chipK = {}; }
  function netSync() {
    const D = NM.D, m = D.m; if (!m || !NM.on || !isGD(m)) return;
    NM.host = m.host === NM.pid;
    const S = D.s || {}, now = performance.now();
    for (const id in S) if (S[id] !== NM.seenAt[id + '#']) { NM.seenAt[id + '#'] = S[id]; NM.seenAt[id] = now; }
    if (m.st === 'play' && m.seq !== NM.seq) roundFromNet(m);
    if (m.st !== NM.st) { const was = NM.st; NM.st = m.st; if (m.st === 'lobby') { toLobbyUI(); lobbyShow(); } else if (m.st === 'end' && was === 'play') finalBoard(); else if (m.st === 'play') lobbyHide(); }
    if (R) for (const a of EXP) if (a.kind === 'remote') { const v = S[a.pid]; if (v) netSet(a, v); }
    const Ev = D.ev || {}, nw = [];
    for (const id in Ev) { if (NM.seen.has(id)) continue; const e = Ev[id]; if (!e || typeof e.t !== 'number') continue; NM.seen.add(id); if (e.q === NM.seq) nw.push(e); }
    nw.sort((a, b) => a.t - b.t).forEach(onEv);
    hostCheck(m);
    if (NM.ui) lobbyDraw();
  }
  // 팀 = 차례대로 둘씩(홀수면 마지막 셋) · 8명까지
  function teamsFrom(P) {
    const ids = Object.keys(P).filter(id => P[id] && typeof P[id].tm === 'number' && P[id].tm !== 99).sort((a, b) => (P[a].tm % 100) - (P[b].tm % 100)).slice(0, 8);
    const T = []; for (let i = 0; i < ids.length; i += 2) T.push(ids.slice(i, i + 2)); if (T.length > 1 && T[T.length - 1].length === 1) T[T.length - 2].push(T.pop()[0]);
    let slot = 0; return T.map(tm => tm.map(id => ({ kind: id === NM.pid ? 'me' : 'remote', pid: id, name: String(P[id].n || '친구').slice(0, 8), slot: slot++ })));
  }
  function roundFromNet(m) {
    NM.seq = m.seq; const teams = teamsFrom(NM.D.p || {}); if (!teams.length || teams[0].length < 2) return;
    lobbyHide(); if (RK) RK.start(NM.room + '#' + (m.seq - (m.goal || 0)));   // RANK-1: 경기 번호 = seq − goal
    const mine = teams.flat().find(q => q.kind === 'me');
    beginRound({ seq: m.seq, t0: m.t0, seed: (Math.floor(m.t0 / 7) ^ Math.imul(m.seq + 1, 2654435761)) >>> 0, round: m.goal || 0, rounds: m.time || 2, teams, mySlot: mine ? mine.slot : 0 });
    const Ev = NM.D.ev || {};
    Object.keys(Ev).filter(id => Ev[id] && Ev[id].q === m.seq && !NM.seen.has(id)).sort((a, b) => (Ev[a].t || 0) - (Ev[b].t || 0)).forEach(id => { NM.seen.add(id); onEv(Ev[id]); });
  }
  function hostCheck(m) {
    const P = NM.D.p || {}, now = performance.now(); if (!P[NM.pid]) return;
    const quiet = (id, ms) => NM.seenAt[id] && now - NM.seenAt[id] > ms;
    if (m.host !== NM.pid && (!P[m.host] || quiet(m.host, 30000))) { const first = Object.keys(P).filter(id => id === NM.pid || !quiet(id, 30000)).sort((a, b) => (P[a].on || 0) - (P[b].on || 0))[0];
      if (first === NM.pid && !NM.claim) { NM.claim = true; nreq('/m/host', 'PUT', NM.pid).catch(() => {}).finally(() => { NM.claim = false; }); } }
    if (NM.host && m.st === 'play') for (const id in P) if (id !== NM.pid && quiet(id, 90000)) { nreq('/p/' + id, 'DELETE').catch(() => {}); delete NM.seenAt[id]; }
  }
  function netSet(a, v) {
    if (v === a.net) return; const ts = v[6] || 0, p = a.net, pts = a.nts || 0;
    if (p && ts && pts && ts <= pts) return;
    if (p && ts && pts && (v[0] - p[0]) ** 2 + (v[2] - p[2]) ** 2 < 64) { const g = Math.max(0.04, Math.min(1, (ts - pts) / 1000)); let vx = (v[0] - p[0]) / g, vz = (v[2] - p[2]) / g; const sp = Math.hypot(vx, vz); if (sp > 9) { vx *= 9 / sp; vz *= 9 / sp; } a.nvx = vx; a.nvz = vz; } else { a.nvx = 0; a.nvz = 0; }
    a.net = v; a.nts = ts; a.nt = performance.now();
  }
  function netActor(a, dt) {
    const v = a.net; if (!v) return; const up = (v[7] || 0) / 2000, age = Math.max(0, Math.min(0.6, a.nts ? (sNow() - a.nts) / 1000 + up : (performance.now() - a.nt) / 1000)), tx = v[0] + (a.nvx || 0) * age, tz = v[2] + (a.nvz || 0) * age;
    if ((tx - a.x) ** 2 + (tz - a.z) ** 2 > 64) { a.x = tx; a.z = tz; } else { const k = 1 - Math.exp(-14 * dt); a.x += (tx - a.x) * k; a.z += (tz - a.z) * k; }
    a.h = v[3];
  }
  function netEmit(e) { const id = 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), o = { k: e.k, q: NM.seq, t: { '.sv': 'timestamp' } }; for (const k of ['by', 'who', 'n']) if (typeof e[k] === 'number') o[k] = e[k];
    nreq('/ev/' + id, 'PUT', o).catch(() => { map.hud.toast('😥 보내지 못했어요 — 인터넷을 확인해 주세요', 2.5); }); }
  const NF = () => (NM.lag && NM.lag >= 300 ? 1 : 2);
  function netSend(dt, beat) {
    NM.sendT -= dt; const busy = R && ME.role === 'exp' && (phase === 'play' || phase === 'count');
    if ((NM.sendT <= 0 || beat) && NM.busyS < NF()) {
      NM.sendT = busy ? 0.1 : 2; NM.busyS++; const t1 = NM.lastSend = performance.now(), w1 = Date.now(), me = EXP.find(a => a.kind === 'me'), p = map.player.get();
      nreq('/s/' + NM.pid, 'PUT', [r2(me ? me.x : p.x), r2(GY), r2(me ? me.z : p.z), Math.round(me ? me.h : 0), 0, (NM.beatN = (NM.beatN + 1) % 100), { '.sv': 'timestamp' }, Math.min(5000, NM.lag || 0)])
        .then(r => { const rtt = performance.now() - t1; NM.lag = Math.round(NM.lag ? NM.lag * 0.7 + rtt * 0.3 : rtt); if (r && typeof r[6] === 'number') { NM.offs.push([rtt, r[6] - (w1 + rtt / 2)]); if (NM.offs.length > 24) NM.offs.shift(); let b = NM.offs[0]; for (const o of NM.offs) if (o[0] < b[0]) b = o; NM.off = b[1]; } })
        .catch(() => {}).finally(() => { NM.busyS--; });
    }
  }
  // 방장: 판 끝 → 다음 판(팀 안 길잡이 차례가 돌아감) → 판 수만큼 하면 끝
  function hostRun(t, endAt) {
    if (!NM.host || !R || NM.adv) return; const m = NM.D.m; if (!m || m.st !== 'play' || m.seq !== R.seq) return;
    if (t < endAt + cfg.end || NM.advSeq === R.seq) return;
    NM.adv = true; NM.advSeq = R.seq;
    const P = NM.D.p || {}, next = (m.goal || 0) + 1, rounds = m.time || 2;
    if (next >= rounds) { nreq('/m', 'PATCH', { st: 'end' }).catch(() => { NM.advSeq = null; }).finally(() => { NM.adv = false; setTimeout(() => { if (NM.on && NM.host && NM.D.m && NM.D.m.st === 'end') nreq('/m/st', 'PUT', 'lobby').catch(() => {}); }, 9000); }); ctlMatch(m.seq, 'end'); return; }
    const ids = Object.keys(P).filter(id => P[id] && typeof P[id].tm === 'number'), up = { 'm/seq': m.seq + 1, 'm/goal': next, 'm/t0': Math.round(sNow() + 4500) };   // 역할이 바뀌므로 준비 ≈7.5초
    let k = ids.filter(id => P[id].tm !== 99).length; for (const id of ids) if (P[id].tm === 99) up['p/' + id + '/tm'] = k++;   // 늦게 온 친구 = 다음 판부터(팀 끝에)
    nreq('', 'PATCH', up).catch(() => { NM.advSeq = null; }).finally(() => { NM.adv = false; });
    nreq('/ev', 'DELETE').catch(() => {});
  }
  async function hostStart() {
    const m = NM.D.m || {}, P = NM.D.p || {}, ids = Object.keys(P).filter(id => P[id]).sort((a, b) => (P[a].on || 0) - (P[b].on || 0)).slice(0, 8);
    if (ids.length < 2) { map.hud.toast('🧭 길잡이는 2명부터(둘씩 한 팀) — 혼자면 🧭 길잡이 연습', 3); return; }
    const big = ids.length % 2 && ids.length > 1 ? 3 : 2, rounds = big;   // 모두 한 번씩 길잡이(셋인 팀이 있으면 3판)
    const up = { 'm/st': 'play', 'm/seq': (m.seq || 0) + 1, 'm/goal': 0, 'm/time': rounds, 'm/t0': Math.round(sNow() + 7000), 'm/arena': 'gd0' };   // 첫 판 준비 ≈10초(하는 법 읽기)
    ids.forEach((id, k) => { up['p/' + id + '/tm'] = k; });
    await nreq('/ev', 'DELETE'); await nreq('', 'PATCH', up); ctlMatch((m.seq || 0) + 1, 'gcount');
  }
  function lobbyShow() { map.player.freeze(true); lobbyDraw(); }
  function lobbyHide() { if (NM.ui) { NM.ui.remove(); NM.ui = null; } }
  function lobbyDraw(msg) {
    if (!NM.ui) { NM.ui = document.createElement('div'); NM.ui.className = 'wg-lobby gd-lobby ttl-keep';
      NM.ui.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;width:min(470px,94vw);max-height:90vh;overflow:auto;box-sizing:border-box;pointer-events:auto;background:#fffdf6;color:#1d3557;border:3px solid #1d3557;border-radius:16px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.35);font:600 15px/1.45 system-ui,-apple-system,"Malgun Gothic",sans-serif';
      for (const t of ['keydown', 'keyup']) NM.ui.addEventListener(t, e => e.stopPropagation());
      NM.ui.addEventListener('click', lobbyClick); document.body.appendChild(NM.ui); document.exitPointerLock?.(); }
    const D = NM.D, m = D.m, P = D.p || {};
    if (!m || !isGD(m)) { NM.ui.innerHTML = '<b>🧭 길잡이 — 친구와</b><div style="margin-top:6px">' + (msg || '불러오는 중…') + '</div>'; return; }
    const bt = (a, t, on, x = '') => '<button data-w="' + a + '" style="font:inherit;font-weight:800;border:0;border-radius:9px;padding:6px 11px;cursor:pointer;' + (on ? 'background:#1d3557;color:#fff' : 'background:#e8edf3;color:#1d3557') + x + '">' + t + '</button>';
    const ids = Object.keys(P).filter(id => P[id]).sort((a, b) => (P[a].on || 0) - (P[b].on || 0)), hostN = NM.host ? '나' : P[m.host] ? esc(P[m.host].n) : '방장';
    const pairs = []; for (let i = 0; i < Math.min(8, ids.length); i += 2) pairs.push(ids.slice(i, i + 2)); if (pairs.length > 1 && pairs[pairs.length - 1].length === 1) pairs[pairs.length - 2].push(pairs.pop()[0]);
    let h = '<div style="font-weight:900;font-size:18px">🧭 길잡이 — 친구와</div>'
      + '<div style="margin-top:6px;font-size:14px;color:#1d3557;background:#f6efd9;border-radius:9px;padding:6px 8px">🧭 <b>길잡이</b>: 지도 보고 방위 → 칸 수(1칸 = 5m)<br>🚶 <b>탐험가</b>: 나침반 띠에서 방위를 찾고 흰 선 칸 세기 — 보물·함정은 안 보여요</div>'
      + '<div style="margin-top:6px;font-size:13px;color:#4a5b70">둘씩 한 팀(홀수면 셋) · 🧭 길잡이 = 지도 · 🚶 탐험가 = 운동장 지도 마을 · 판마다 역할 바꿈 · 한 판 ' + cfg.play + '초 · 보물 3 · 함정 5 · 팀마다 보물 자리가 달라요</div>'
      + '<div style="margin-top:8px;padding:7px 9px;border-radius:9px;background:#eef4ff">' + (pairs.length ? pairs.map((tm, i) => '<span style="color:' + TEAMCSS[i % 4] + ';font-weight:900">■ ' + TEAMN[i % 4] + '</span> ' + tm.map(id => (id === NM.pid ? '<b>' + esc(NM.name) + '(나)</b>' : esc(P[id].n))).join(' · ')).join('<br>') : '아직 아무도 없어요') + '</div>';
    if (!NM.lastBoard && RK && !NM.lbTry && m.st !== 'play') { NM.lbTry = true; NM.lastBoard = RK.last(NM.room + '#' + (m.seq - (m.goal || 0))); }   // 대기실에서 새로고침해도 지난 표(이 탭에 있으면)
    if (NM.lastBoard) h += NM.lastBoard;   // RANK-1: 지난 놀이 팀 순위표
    if (m.st === 'play') h += '<div style="margin-top:8px;font-weight:800">⏳ 놀이 중이에요 — 다음 판부터 같이 해요</div>';
    else if (roomLed()) h += '<div style="margin-top:10px;font-weight:800;color:#2b5a96">🏠 방장이 ▶ 시작했어요 — 친구들이 다 들어오면 곧 3·2·1</div>';
    else if (NM.host) h += '<div style="display:flex;gap:6px;justify-content:flex-end;align-items:center;margin-top:10px">' + (ids.length < 2 ? '<span style="font-size:13px;color:#b4232c">친구가 한 명 더 있어야 해요</span>' : '') + bt('start', '▶ 시작!', true, ';font-size:17px;padding:8px 18px') + '</div>';
    else h += '<div style="margin-top:10px">방장 ⭐' + hostN + '이(가) ▶ 시작을 누르면 모두 같이 시작해요</div>';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span style="font-size:12px;color:#5a6b80">방 ' + esc(NM.room.slice(1)) + '</span>' + bt('leave', '🚪 나가기') + '</div>';
    if (NM.ui.dataset.h !== h) { NM.ui.dataset.h = h; NM.ui.innerHTML = h; }
  }
  async function lobbyClick(e) { e.stopPropagation(); const b = e.target.closest('[data-w]'); if (!b || !NM.on) return; const w = b.dataset.w; try { if (w === 'start' && NM.host) await hostStart(); else if (w === 'leave') map.quit(); } catch (er) { map.hud.toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 2.5); } }
  function finalBoard() {
    toLobbyUI();
    // RANK-1: 끝 카드 = 팀 🥇🥈🥉 + 최고 길잡이·보물왕 · 대기실 = 지난 놀이 팀 순위표(판마다 점수·길잡이)
    RK.end(); NM.lastBoard = RK.lobby();
    card('<div style="font-size:1.35em">🏁 길잡이 끝!</div>' + RK.podium() + '<div style="margin-top:6px;font-size:.85em">' + RK.awards() + '</div>', 6);
    map.tone(523, 0, 0.15, 'sine', 0.1); map.tone(659, 0.15, 0.15, 'sine', 0.1); map.tone(784, 0.3, 0.3, 'sine', 0.1);
    if (!roomBack('🧭 길잡이', NM.lastBoard, 6500)) setTimeout(() => { if (NM.on && !dead) lobbyShow(); }, 2500);   // 지난 놀이 표 = lobbyDraw 안(다시 그려도 남게 — 예전엔 덧붙여서 대기실이 바뀌면 사라짐)
  }

  // ---------- 시작 ----------
  map.player.freeze(true);
  if (NETM) netEnter(); else soloAsk();
  return {
    tick,
    stop() { dead = true; removeEventListener('keydown', keyH); removeEventListener('resize', panelRe); if (RK) RK.stop(); clearTimeout(hear.t); howClose(); hcss.remove(); panel.remove(); cmpEl.remove(); sayEl.remove(); logEl.remove(); css.remove(); if (cardEl) { cardEl.remove(); cardEl = null; } clearTimeout(cardT);
      helpSet(false); document.body.classList.remove('gd-guide', 'gd-exp');
      hotOff.remove(); arena.remove(); for (const c of COLS9) c.remove(); map.player.show(true); map.player.freeMouse(false); if (mmWas) map.minimap.show(); netLeave();
      for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose(); },
    get state() { return R ? { phase, t: +tNow.toFixed(1), role: ME.role, team: MYTEAM, round: R.round, rounds: R.rounds, found: GOT.size, traps: TR.size, score: (TSC[MYTEAM] || {}).s, lay: R.lay, teams: R.teams.map((tm, i) => ({ n: tm.map(q => q.name + ':' + q.role), s: TSC[i].s, got: [...TGOT[i]] })), exp: EXP.map(a => ({ name: a.name, team: a.team, kind: a.kind, x: +a.x.toFixed(1), z: +a.z.toFixed(1), cur: a.cur })), res } : { phase: 'lobby', host: NM.host }; },
    get net() { return { on: NM.on, host: NM.host, room: NM.room, seq: NM.seq, st: NM.st, lag: NM.lag }; },
    say: n => say(n), dir: d => sendDir(d), dist: k => sendK(k), netStart: () => (NM.host ? hostStart() : null),
  };
}
