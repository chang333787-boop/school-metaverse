// 🌊 바다 칸 할 거리(SEA4-1 · 사용자 10-17 '바다 상호작용이 별로 없는 거 같은데' · 이어받기 '바다 4칸' · docs/systems/town_cells.md §11)
//   칸 키트(CELLKIT-1)가 못 채운 바다·모래사장 칸(실측 가13·가14·나13·나14 = 할 일 0~1)에 바다다운 할 거리 일곱 갈래 — 실제 바닷가 생활·과학만 · 판타지 X · 실명 X · 어촌 = 앞선 지식(물때·표지)으로
//   모래 구멍 게(물때: 낮 썰물 = 엽낭게 · 밤 = 달랑게) · 물때선 쓰레기 고르기 · 물때 표 읽기 · 오리배 구명조끼 · 갈매기가 모인 곳 · 떠다니는 쓰레기 건지기 · 항로 표지 부표
//   E 한 번에 끝 X — 창 안에 본 것(구멍 둘레 · 물때 표 · 부표 그림 · 몸에 맞는지)을 같이 두고 아이가 고름 · 고른 것이 세상에 남음(주운 쓰레기가 사라짐 · 부표 사이로 지나가 봄)
//   위쪽 = 순수(칸 서명 → 줄) — 칸 키트 haveOf와 Node 하네스(town_cells.cjs)가 같이 씀 · 아래 = 게임(createSea4)
//   그리기 = 상자 인스턴스 하나(+ 밤 부표 불빛 인스턴스 하나 · 밤에 가까울 때만) · 새 Light X · 매 프레임 = 0.1초 거름 + 가까울 때만 움직임(게·갈매기·물에 뜬 것) · 새 객체 X
import { isLow, lowsOf, lowAt, tideLvl, TIDE_P, hm } from './town_shore.js?v=6';
export const SEA4_V = 1;
const T2 = (ko, en9) => [ko, en9];
const SAND = s => (s.land && s.land.sand) || 0, SWIMC = s => /오리배/.test(s.ar || '');   /* 오리배 바다 = 해수욕장 앞바다(수영 구역에 둘러싸여 배가 못 들어감 · 헤엄으로 감) */
// 줄(f 갈래 · need 칸 서명 · on(s) → 그날 판 E { s, rain, night }에 켜지나)
export const SEA4 = [
  { id: 'crab', f: '생', ic: '🦀', t: T2('모래 구멍 게', 'Sand crabs'), need: s => SAND(s) >= 20 && (s.sea >= 10 || SAND(s) >= 80), on: s => s.sea >= 10 ? () => true : E => !!E.night },   /* 물가 모래 = 낮 썰물 엽낭게 + 밤 달랑게 · 물에서 먼 모래 = 밤 달랑게만 */
  { id: 'wrack', f: '손', ic: '♻', t: T2('물때선 쓰레기 고르기', 'Sorting the tide line'), need: s => SAND(s) >= 20 && s.sea >= 10, on: () => E => !E.night },
  { id: 'tide', f: '사', ic: '🌊', t: T2('물때 표 읽기', 'Reading the tide table'), need: s => (/beach/.test(s.zs || '') || /오리배/.test(s.ar || '')) && SAND(s) >= 20 && s.sea >= 10, on: () => () => true },   /* 해수욕장·오리배 타는 곳 물때 표 */
  { id: 'vest', f: '사', ic: '🦆', t: T2('오리배 구명조끼', 'Life jacket for the duck boat'), need: s => /오리배/.test(s.ar || '') && SAND(s) >= 20, on: () => E => !E.night },
  { id: 'gull', f: '생', ic: '🐦', t: T2('갈매기가 모인 곳', 'Where the gulls gather'), need: s => s.sea >= 95 && !SWIMC(s), on: () => E => !E.night },
  { id: 'jelly', f: '생', ic: '🌊', t: T2('해파리 피하기', 'Steering clear of a jellyfish'), need: s => s.sea >= 95 && SWIMC(s), on: () => E => !E.night && (E.s === 1 || E.s === 2) },   /* 여름·가을 해수욕장 */
  { id: 'rope', f: '사', ic: '🏊', t: T2('수영 한계선 부표 줄', 'Swim-limit float line'), need: s => s.sea >= 95 && SWIMC(s), on: () => () => true },
  { id: 'drift', f: '손', ic: '♻', t: T2('떠다니는 쓰레기 건지기', 'Fishing out floating litter'), need: s => s.sea >= 95 && !(s.works || []).length, on: () => E => !E.night },
  { id: 'buoy', f: '사', ic: '⚓', t: T2('항로 표지 부표', 'Channel buoys'), need: s => s.sea >= 95 && !(s.works || []).length && !SWIMC(s), on: () => () => true },
];
export const seaLinesOf = s => (s && !s.school ? SEA4.filter(l => l.need(s)) : []);

// 고르기 물건(주워요 = 사람이 버린 것 · 둬요 = 바다에서 온 생물·자연물) · [이름, 주움?, 까닭 한 줄]
export const SEA4_BEACH = [[T2('스티로폼 부표 조각', 'Bit of a foam float'), 1, T2('잘게 부서지면 물고기와 새가 먹이인 줄 알고 삼켜요', 'Tiny bits look like food to fish and birds')],
  [T2('끊어진 그물 뭉치', 'Tangle of broken net'), 1, T2('버려진 그물에 바다 생물이 걸려요', 'Sea animals get caught in lost nets')],
  [T2('빈 페트병', 'Empty plastic bottle'), 1, T2('바다에서 오래 떠다니며 잘게 부서져요', 'It drifts for a long time and breaks into tiny bits')],
  [T2('엉킨 낚싯줄', 'Tangled fishing line'), 1, T2('새 다리나 날개에 감길 수 있어요', 'It can wrap around a bird’s legs or wings')],
  [T2('빈 고둥 껍데기', 'Empty sea-snail shell'), 0, T2('소라게가 집으로 써요 — 그대로 둬요', 'Hermit crabs use it as a home — leave it')],
  [T2('마른 해초 줄', 'Line of dry seaweed'), 0, T2('모래 속 작은 생물의 먹이이자 숨는 곳이에요', 'Food and shelter for tiny sand animals')],
  [T2('부서진 조개껍데기', 'Broken shells'), 0, T2('조개껍데기는 부서져 모래가 돼요', 'Shells break down and become sand')]];
export const SEA4_SEA = [[T2('스티로폼 부표', 'Foam float'), 1, T2('양식장에서 떨어져 나온 것 — 부서지기 전에 건져요', 'Came loose from a farm — scoop it before it crumbles')],
  [T2('빈 페트병', 'Empty plastic bottle'), 1, T2('바다에서 오래 떠다니며 잘게 부서져요', 'It drifts for a long time and breaks into tiny bits')],
  [T2('그물 조각', 'Piece of net'), 1, T2('떠다니는 그물에 물고기와 거북이 걸려요', 'Fish and turtles get caught in drifting nets')],
  [T2('떠다니는 해초 덩이', 'Raft of floating seaweed'), 0, T2('어린 물고기가 그 밑에 숨어 지내요', 'Young fish hide underneath it')],
  [T2('해파리', 'Jellyfish'), 0, T2('쏠 수 있어서 손대지 않아요 — 그대로 둬요', 'It can sting — don’t touch it')]];
const COL = { hole: 0x6b5a44, crab: 0xd9c8a0, ghost: 0xf2ead8, foam: 0xf4f4ee, net: 0x2f8a6a, pet: 0x7fb6dc, line: 0x9ad0e6, shell: 0xe9dfcf, weed: 0x5e6b3a, jelly: 0xd8c8ee, tent: 0xeadff6, post: 0x8a6a48, board: 0x2f6fd0, vest: 0xf07a22, rack: 0x8a6a48, gull: 0xf7f7f2, wing: 0x8c949c, glint: 0xe8f4ff, red: 0xd6403a, green: 0x2f8a55, band: 0xf2f2ee };

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · lang() · cells() → [{ n, box, s }] · cell(x, z) · land(x, z) 걸어 설 마른 땅 · sea(x, z) 배가 다니는 물 · seaSd · gy · SEAY()
//   boat() → BOAT · harb() → 선착장 { x, z } · night() · busy() · inb() · root() · openP · closeP · esc · skUp · say(t, s, lv)
export function createSea4(A) {
  const T3 = A.T3, map = A.map, S = () => A.GAME.S, en = () => A.lang() === 'en', tx = a => a[en() ? 1 : 0];
  const ST = () => { let c = S().sea4; if (!c || typeof c !== 'object' || c.v !== SEA4_V) c = S().sea4 = { v: SEA4_V }; for (const k of ['done', 'n', 'said']) if (!c[k] || typeof c[k] !== 'object') c[k] = {}; return c; };
  const H = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), E4 = new T3.Euler(), V4 = new T3.Vector3(), S4 = new T3.Vector3(), C4 = new T3.Color();
  const SP = [], PT = []; let BOX = null, LIT = null, BG = null, BM = null, LG = null, LM = null, on = false, near = false, q = 0, ss = 0, t = 0, buildMs = 0, dayK = -1, gate = null;
  // ───────── 짓기 ─────────
  let RCH = new Set(); const rk = (x, z) => Math.round(x / 6) + ',' + Math.round(z / 6);
  // 선착장에서 배로 이어진 물(6m 칸 · 짓기 때 한 번) — 수영 구역 줄에 막힌 바다는 빠짐
  function reachMap() { RCH = new Set(); const H9 = A.harb(); if (!H9) return; const Q = [[Math.round(H9.x / 6), Math.round(H9.z / 6)]]; RCH.add(Q[0][0] + ',' + Q[0][1]);
    for (let h = 0; h < Q.length && h < 60000; h++) { const [i, j] = Q[h]; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (i + a) + ',' + (j + b); if (RCH.has(k) || !A.sea((i + a) * 6, (j + b) * 6)) continue; RCH.add(k); Q.push([i + a, j + b]); } } }
  function seaFrac(C9) { const [x0, z0, x1, z1] = C9.box; let n = 0; for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if (A.seaSd(x0 + (i + 0.5) * (x1 - x0) / 10, z0 + (j + 0.5) * (z1 - z0) / 10) < 0) n++; return n; }
  function scan(C9, ok, step) { const [x0, z0, x1, z1] = C9.box, o = []; for (let z = z0 + 3; z < z1 - 3; z += step) for (let x = x0 + 3; x < x1 - 3; x += step) if (A.cell(x, z) === C9.n && ok(x, z)) o.push([x, z]); return o; }
  const far = (x, z, L9, d) => L9.every(p => Math.hypot(p[0] - x, p[1] - z) >= d);
  function pickLand(C9, lo, hi, avoid, key) { const L9 = scan(C9, (x, z) => { const d = A.seaSd(x, z); return d >= lo && d <= hi && A.land(x, z); }, 2).filter(p => far(p[0], p[1], avoid, 11)); if (!L9.length) return null; L9.sort((a, b) => A.seaSd(a[0], a[1]) - A.seaSd(b[0], b[1])); const k = Math.min(L9.length, 8); return L9[H(C9.n + key) % k]; }
  function part(sp, k, x, y, z, sx, sy, sz, ry, col) { const p = { sp, k, x, y, z, sx, sy, sz, ry: ry || 0, col, ox: x, oz: z, hide: false }; PT.push(p); return p; }
  function init() { const t0 = performance.now(); clear(); if (!A.on()) return; on = true; const ALL = [];
    reachMap(); for (const C9 of A.cells()) { const s0 = C9.s; if (!s0 || s0.school) continue; const s = SAND(s0) >= 20 && s0.sea < 10 ? { ...s0, sea: seaFrac(C9) } : s0, L9 = seaLinesOf(s); if (!L9.length) continue; const used = [];   /* 모래 칸은 실제 물 비율로(자료 층과 마을 층의 모래·바다 경계가 조금 다름 — 가13) */
      for (const l of L9) { let sp = null;
        if (l.id === 'crab') { const p = s.sea >= 10 ? pickLand(C9, 2.5, 12, used, 'crab') : pickLand(C9, 6, 400, used, 'crab'); if (p) sp = { x: p[0], z: p[1], wet: s.sea >= 10 }; }
        else if (l.id === 'wrack') { const p = pickLand(C9, 5, 15, used, 'wrack'); if (p) sp = { x: p[0], z: p[1] }; }
        else if (l.id === 'tide') { const p = pickLand(C9, 12, 45, used, 'tide'); if (p) sp = { x: p[0], z: p[1] }; }
        else if (l.id === 'vest') { const p = pickLand(C9, 2.5, 9, used, 'vest'); if (p) sp = { x: p[0], z: p[1] }; }
        else { const sw = SWIMC(s), W9 = scan(C9, sw ? ((x, z) => A.swimOk(x, z)) : ((x, z) => A.sea(x, z) && RCH.has(rk(x, z))), sw ? 4 : 6).filter(p => far(p[0], p[1], used, sw ? 14 : 26)); if (l.id === 'rope') { const E9 = A.swimBuoys().filter(p => A.cell(p[0], p[1]) === C9.n && far(p[0], p[1], used, 14)); if (E9.length) { const p = E9[H(C9.n + 'rope') % E9.length]; sp = { x: p[0], z: p[1] }; } }   /* 해수욕장 헤엄치는 곳 바깥 끝에 이미 떠 있는 부표 줄(SWIM-1) 곁 — 새 부표 X */
          else if (W9.length) { if (l.id === 'gull') sp = { cand: W9, x: W9[0][0], z: W9[0][1] }; else { const p = W9[H(C9.n + l.id) % W9.length]; sp = { x: p[0], z: p[1] }; } } }
        if (!sp) continue; sp.swim = !!SWIMC(s) && !/crab|wrack|tide|vest/.test(l.id); sp.id = l.id; sp.n = C9.n; sp.l = l; sp.k = C9.n + ':' + l.id; sp.wet = !!sp.wet; used.push([sp.x, sp.z]); ALL.push(sp); } }
    for (const sp of ALL) build(sp);
    if (PT.length) mesh(); for (const sp of SP) hot(sp); day(true); buildMs = Math.round(performance.now() - t0); }
  // 자리마다 부분(상자) + E 자리
  function build(sp) { const { x, z } = sp, g = A.gy(x, z), y = A.SEAY(), ry = (H(sp.k) % 628) / 100; sp.parts = []; sp.d = 1e9; sp.st = ''; SP.push(sp); const P = (...a) => sp.parts.push(part(sp, ...a));
    if (sp.id === 'crab') { for (let i = 0; i < 4; i++) { const a = ry + i * 1.57 + 0.4, r = 0.8 + (i % 2) * 0.7; P('hole', x + Math.cos(a) * r, g + 0.012 + i * 0.002, z + Math.sin(a) * r, 0.16, 0.02, 0.16, a, COL.hole); for (let j = 0; j < 3; j++) { const b = a + j * 2.1; P('pellet', x + Math.cos(a) * r + Math.cos(b) * 0.24, g + 0.02, z + Math.sin(a) * r + Math.sin(b) * 0.24, 0.05, 0.04, 0.05, 0, COL.crab); } }
      for (let i = 0; i < 2; i++) P('crab', x + (i ? 0.6 : -0.5), g + 0.06, z + (i ? -0.3 : 0.4), 0.26, 0.1, 0.2, ry + i, COL.crab); }
    else if (sp.id === 'wrack') { const o = [[0, 0.3, 'foam'], [1.1, -0.2, 'net'], [-1.0, 0.1, 'pet'], [2.0, 0.2, 'shell'], [-1.9, -0.1, 'weed'], [0.5, -0.6, 'line']]; const c = Math.cos(ry), s9 = Math.sin(ry);
      for (const [u, v, k] of o) { const px = x + u * c - v * s9, pz = z + u * s9 + v * c, dim = k === 'weed' ? [1.2, 0.04, 0.22] : k === 'pet' ? [0.32, 0.12, 0.12] : k === 'net' ? [0.5, 0.14, 0.4] : k === 'shell' ? [0.16, 0.05, 0.14] : k === 'line' ? [0.4, 0.03, 0.3] : [0.34, 0.2, 0.26]; P(k, px, g + dim[1] / 2 + 0.01, pz, dim[0], dim[1], dim[2], ry + u, COL[k]); } }
    else if (sp.id === 'tide') { P('post', x - 0.55, g + 0.8, z, 0.12, 1.6, 0.12, ry, COL.post); P('post', x + 0.55, g + 0.8, z, 0.12, 1.6, 0.12, ry, COL.post); P('board', x, g + 1.45, z, 1.3, 0.8, 0.06, ry, COL.board); for (let i = 0; i < 3; i++) P('band', x - 0.3 + i * 0.3, g + 1.25 + (i % 2) * 0.22, z + 0.04, 0.22, 0.05, 0.02, ry, COL.band); }
    else if (sp.id === 'vest') { P('rack', x, g + 0.5, z, 1.6, 0.08, 0.08, ry, COL.rack); P('rack', x - 0.75, g + 0.25, z, 0.08, 0.5, 0.08, ry, COL.rack); P('rack', x + 0.75, g + 0.25, z, 0.08, 0.5, 0.08, ry, COL.rack); for (let i = 0; i < 3; i++) P('vest' + i, x - 0.5 + i * 0.5, g + 0.32 - (i === 1 ? 0.05 : 0), z + 0.06, i === 0 ? 0.42 : 0.32, i === 0 ? 0.42 : 0.34, 0.12, ry, COL.vest); }
    else if (sp.id === 'gull') { for (let i = 0; i < 5; i++) { P('gull', x, y + 7, z, 0.5, 0.12, 0.16, 0, COL.gull); P('wing', x, y + 7, z, 1.1, 0.04, 0.26, 0, COL.wing); } for (let i = 0; i < 4; i++) P('glint', x, y + 0.02, z, 0.6, 0.02, 0.14, i, COL.glint); }
    else if (sp.id === 'jelly') { for (let i = 0; i < 3; i++) { const a = ry + i * 2.1, px = x + Math.cos(a) * 2.2, pz = z + Math.sin(a) * 2.2; P('jelly', px, y - 0.12, pz, 0.55, 0.2, 0.55, a, COL.jelly); P('tent', px, y - 0.45, pz, 0.08, 0.45, 0.08, a, COL.tent); } }
    else if (sp.id === 'drift') { const o = [[0, 0, 'foam'], [2.2, 1.0, 'pet'], [-1.8, 1.4, 'net'], [1.2, -2.0, 'weed'], [-2.4, -1.2, 'jelly']]; for (const [u, v, k] of o) { const dim = k === 'weed' ? [1.4, 0.1, 0.9] : k === 'jelly' ? [0.5, 0.14, 0.5] : k === 'net' ? [0.8, 0.1, 0.6] : k === 'pet' ? [0.34, 0.14, 0.14] : [0.6, 0.3, 0.45]; P(k, x + u, y + 0.02 + dim[1] / 2 - 0.08, z + v, dim[0], dim[1], dim[2], u + v, COL[k]); } }
    else if (sp.id === 'buoy') { const Hb = A.harb(); let ux = 0, uz = -1; if (Hb) { const dx = Hb.x - x, dz = Hb.z - z, l = Math.hypot(dx, dz) || 1; ux = dx / l; uz = dz / l; } const rx = -uz, rz = ux, gap = 7; sp.u = [ux, uz]; sp.r = [rx, rz]; sp.ry = Math.atan2(ux, uz);
      for (const [sg, k] of [[1, 'red'], [-1, 'green']]) { const bx = x + rx * gap * sg, bz = z + rz * gap * sg; if (!A.sea(bx, bz)) sp.bad = 1; P(k, bx, y + 0.3, bz, 0.9, 1.2, 0.9, sp.ry, COL[k]); P('band', bx, y + 1.0, bz, 0.7, 0.18, 0.7, sp.ry, COL.band);
        if (k === 'red') P('red', bx, y + 1.35, bz, 0.5, 0.5, 0.5, sp.ry + 0.785, COL.red); else P('green', bx, y + 1.3, bz, 0.66, 0.4, 0.66, sp.ry, COL.green);   /* 오른쪽 표지 = 빨강 · 뾰족한 머리 / 왼쪽 표지 = 초록 · 납작한 머리 */
        sp[k] = [bx, bz]; } } }
  function mesh() { BG = new T3.BoxGeometry(1, 1, 1); BM = new T3.MeshLambertMaterial({ color: 0xffffff }); BOX = new T3.InstancedMesh(BG, BM, PT.length); BOX.userData.fx = 1; BOX.frustumCulled = false; BOX.matrixAutoUpdate = false; BOX.visible = false;
    for (let i = 0; i < PT.length; i++) { PT[i].i = i; BOX.setColorAt(i, C4.setHex(PT[i].col)); draw(PT[i]); } BOX.instanceMatrix.needsUpdate = true; if (BOX.instanceColor) BOX.instanceColor.needsUpdate = true; A.root().add(BOX);
    const nb = SP.filter(s => s.id === 'buoy').length * 2; if (nb) { LG = new T3.BoxGeometry(0.28, 0.28, 0.28); LM = new T3.MeshBasicMaterial({ color: 0xffffff }); LIT = new T3.InstancedMesh(LG, LM, nb); LIT.userData.fx = 1; LIT.frustumCulled = false; LIT.visible = false; let j = 0;   /* 밤 부표 불빛(MeshBasic · 새 Light X) */
      for (const sp of SP) if (sp.id === 'buoy') for (const k of ['red', 'green']) { sp['L' + k] = j; LIT.setColorAt(j, C4.setHex(k === 'red' ? 0xff5a4a : 0x5cff8a)); M4.compose(V4.set(sp[k][0], A.SEAY() + (k === 'red' ? 1.85 : 1.75), sp[k][1]), Q4.identity(), S4.set(1, 1, 1)); LIT.setMatrixAt(j++, M4); }
      if (LIT.instanceColor) LIT.instanceColor.needsUpdate = true; A.root().add(LIT); } }
  function draw(p) { if (p.hide) S4.set(0, 0, 0); else S4.set(p.sx, p.sy, p.sz); M4.compose(V4.set(p.x, p.y, p.z), Q4.setFromEuler(E4.set(p.rx || 0, p.ry, p.rz || 0)), S4); BOX.setMatrixAt(p.i, M4); }
  function hot(sp) { const sea = !/crab|wrack|tide|vest/.test(sp.id), y = sp.swim ? A.SEAY() : sea ? A.SEAY() + 0.64 : A.gy(sp.x, sp.z), [ex, ez] = sp.id === 'buoy' && A.sea(sp.x - sp.u[0] * 9, sp.z - sp.u[1] * 9) ? [sp.x - sp.u[0] * 9, sp.z - sp.u[1] * 9] : [sp.x, sp.z];   /* 부표 = 두 부표 앞(바다 쪽) 9m — 거기서 보고 고른 뒤 사이로 지나감 */
    sp.ex = ex; sp.ez = ez; sp.h = map.interact.add({ kind: 'game', x: ex, z: ez, y, r: sp.swim ? 6 : sea ? (sp.id === 'gull' ? 13 : 9) : 2.4, label: label(sp), use: () => use(sp) }); sp.sea = sea; if (A.enth) A.enth.push(sp.h); }
  function label(sp) { const e = en(), N = A.night() >= 1, lo = low();
    switch (sp.id) { case 'crab': return '🦀 ' + (N ? (e ? 'Crabs on the night beach' : '밤 모래밭 게 살펴보기') : sp.wet && lo ? (e ? 'Crab holes — look closely' : '모래 구멍 게 살펴보기') : (e ? 'Crab holes' : '모래 구멍 살펴보기'));
      case 'wrack': return '♻ ' + (e ? 'Sort the tide line' : '물때선에 밀려온 것 고르기'); case 'tide': return '🌊 ' + (e ? 'Read the tide table' : '물때 표 읽기'); case 'vest': return '🦆 ' + (e ? 'Pick a life jacket' : '오리배 구명조끼 고르기');
      case 'gull': return '🐦 ' + (e ? 'Why are the gulls here?' : '갈매기가 모인 곳 살펴보기'); case 'drift': return '♻ ' + (e ? 'Scoop floating litter' : '떠다니는 것 건지기'); case 'jelly': return '🌊 ' + (e ? 'A jellyfish nearby' : '해파리 살펴보기'); case 'rope': return '🏊 ' + (e ? 'The swim-limit floats' : '수영 한계선 부표 줄 보기'); case 'buoy': return '⚓ ' + (e ? 'Read the channel buoys' : (N ? '깜빡이는 부표 불빛 읽기' : '항로 표지 부표 읽기')); }
    return ''; }
  // ───────── 그날 · 물때 ─────────
  const low = () => isLow(S().day, S().min), jellyS = () => /summer|autumn/.test(A.season());
  const doneT = sp => ST().done[sp.k] === S().day;
  function day(force) { const d = S().day; if (!force && d === dayK) return; dayK = d; for (const sp of SP) if (sp.id === 'gull' && sp.cand) { const p = sp.cand[H(sp.k + ':' + d) % sp.cand.length]; sp.x = p[0]; sp.z = p[1]; if (sp.h) { sp.h.hot.x = sp.ex = p[0]; sp.h.hot.z = sp.ez = p[1]; } for (const pt of sp.parts) { pt.ox = pt.x = p[0]; pt.oz = pt.z = p[1]; } } paint(); }
  // 보일 것(1초마다 · 바뀔 때만 다시 그림): 게 = 물가 모래는 낮 썰물·밤, 먼 모래는 밤 · 쓰레기 = 오늘 고른 칸은 생물만 남음 · 갈매기 = 낮 · 조끼 = 고른 하나는 입고 감
  function paint() { if (!BOX) return; const N = A.night() >= 1, lo = low();
    for (const sp of SP) { const dn = doneT(sp); for (const p of sp.parts) { let h = false;
        if (sp.id === 'crab') h = (p.k === 'crab' && !(N || (sp.wet && lo))) || (!!sp.cl && /crab|pellet|hole/.test(p.k));   /* CLOSE-1: 가까이 보기 중엔 상자 게·구멍·경단 숨김(둥근 모양이 대신) */
        else if (sp.id === 'wrack') h = dn && !/shell|weed/.test(p.k);
        else if (sp.id === 'drift') h = dn && !/weed|jelly/.test(p.k);
        else if (sp.id === 'gull') h = N || ((p.k === 'glint') && dn);
        else if (sp.id === 'vest') h = dn && p.k === 'vest1';
        else if (sp.id === 'jelly') h = N || !jellyS();
        if (p.hide !== h) { p.hide = h; draw(p); } } }
    BOX.instanceMatrix.needsUpdate = true; }
  // ───────── 1초 칸 ─────────
  function sec() { if (!on || !BOX) return; day(false); const me = map.player.pos(), N = A.night() >= 1, inb = A.inb(); let nd = 1e9;
    for (const sp of SP) { sp.d = Math.hypot(sp.x - me.x, sp.z - me.z); nd = Math.min(nd, sp.d); const lb = label(sp); if (sp.h.hot.label !== lb) sp.h.hot.label = lb;
      const off = inb || (sp.swim ? !A.swim() : sp.sea ? !A.boat().on : A.boat().on) || (sp.id === 'jelly' && (N || !jellyS())) || ((sp.id === 'vest' || sp.id === 'wrack' || sp.id === 'gull' || sp.id === 'drift') && N) || (sp.id === 'crab' && !sp.wet && !N);   /* 물에서 먼 모래 = 밤 달랑게만 */ if (sp.h.hot.off !== off) sp.h.hot.off = off;
      if (!inb && sp.d < (sp.sea ? 70 : 14) && !off && !A.busy()) notice(sp, N); }
    near = !inb && nd < 260; if (BOX.visible !== near) BOX.visible = near; if (LIT) { const v = near && N; if (LIT.visible !== v) LIT.visible = v; }
    paint(); gateSec(me); }
  // 저절로 뜨는 한 줄(줄마다 하루 한 번 · 낮은 알림 = say(…, 1))
  function notice(sp, N) { const c = ST(), k = sp.id + (N ? 'n' : ''), d = S().day; if (c.said[k] === d) return; const e = en(); let t9 = '';
    if (sp.id === 'crab' && (N || (sp.wet && low()))) t9 = N ? (e ? '🦀 Something white darts across the sand and into a hole' : '🦀 하얀 무언가가 모래 위를 쏜살같이 달려 구멍으로 쏙') : (e ? '🦀 Little crabs pop in and out of holes in the wet sand' : '🦀 젖은 모래 구멍에서 작은 게가 들락날락해요');
    else if (sp.id === 'gull' && !N) t9 = e ? '🐦 Gulls are circling and diving at one spot' : '🐦 갈매기가 한곳에 모여 맴돌다 물로 내리꽂아요';
    else if (sp.id === 'jelly' && !N && jellyS()) t9 = e ? '🌊 Something see-through is floating nearby' : '🌊 가까이에 투명한 무언가가 둥실 떠 있어요';
    else if (sp.id === 'buoy') t9 = N ? (e ? '⚓ A red light and a green light blink on the sea' : '⚓ 바다 위에서 빨간 불과 초록 불이 깜빡여요') : (e ? '⚓ A red buoy and a green buoy stand in the water' : '⚓ 빨간 부표와 초록 부표가 나란히 떠 있어요');
    if (!t9) return; c.said[k] = d; A.GAME.mark(); A.say(t9, 3.2, 1); }
  // ───────── 마을 tick: 1초마다 sec · 0.1초 거름 — 가까운 움직이는 것만 ─────────
  function tick(dt) { if (!on) return; if ((ss += dt) >= 1) { ss = 0; sec(); } if (!near) return; if ((q += dt) < 0.1) return; t += q; q = 0; let ch = false; const N = A.night() >= 1, y0 = A.SEAY();
    for (const sp of SP) { if (sp.d > 140) continue;
      if (sp.id === 'crab') { let j = 0; for (const p of sp.parts) if (p.k === 'crab' && !p.hide) { const a = t * (N ? 2.4 : 0.9) + j * 2.3, run = N ? 1.6 : 0.5; p.x = p.ox + Math.sin(a) * run; p.z = p.oz + Math.cos(a * 0.7) * run * 0.5; p.ry = a; draw(p); ch = true; j++; } }
      else if (sp.id === 'gull' && !N) { let j = 0; for (let i = 0; i < sp.parts.length; i++) { const p = sp.parts[i]; if (p.hide) continue; if (p.k === 'gull' || p.k === 'wing') { const g = j >> 1, a = t * 0.6 + g * 1.26, r = 5 + (g % 2) * 2.5, dive = Math.max(0, Math.sin(t * 0.8 + g * 2.1)) ** 8 * 5; p.x = sp.x + Math.cos(a) * r; p.z = sp.z + Math.sin(a) * r; p.y = y0 + 7 + g * 0.6 - dive; p.ry = -a; p.rz = p.k === 'wing' ? Math.sin(t * 6 + g) * 0.35 : 0; draw(p); j++; } else if (p.k === 'glint') { const a = p.ry * 1.7 + t * 0.4; p.x = sp.x + Math.cos(a) * 2.2; p.z = sp.z + Math.sin(a * 1.3) * 2.2; p.sx = 0.6 * (0.6 + 0.4 * Math.abs(Math.sin(t * 3 + a))); draw(p); } } ch = true; }
      else if (sp.id === 'jelly') { let j = 0; for (const p of sp.parts) { if (p.hide) continue; const a = t * 0.15 + ((j / 2) | 0) * 2.1; p.x = p.ox + Math.sin(a) * 0.8; p.z = p.oz + Math.cos(a) * 0.8; if (p.k === 'jelly') p.sy = 0.2 * (0.8 + 0.2 * Math.sin(t * 2 + j)); draw(p); j++; } ch = true; }
      else if (sp.id === 'drift' || sp.id === 'buoy') { for (const p of sp.parts) { if (p.hide) continue; if (p.y0 == null) p.y0 = p.y; p.y = p.y0 + Math.sin(t * 1.3 + p.ox * 0.3) * 0.08; draw(p); } ch = true; } }
    if (ch) BOX.instanceMatrix.needsUpdate = true;
    if (LIT && LIT.visible) { for (const sp of SP) if (sp.id === 'buoy') for (const k of ['red', 'green']) { const j = sp['L' + k], ph = (t + (k === 'red' ? 0 : 1.6)) % 4, v = ph < 0.6 ? 1 : 0; M4.compose(V4.set(sp[k][0], y0 + (k === 'red' ? 1.85 : 1.75), sp[k][1]), Q4.identity(), S4.set(v, v, v)); LIT.setMatrixAt(j, M4); } LIT.instanceMatrix.needsUpdate = true; } }   /* 빨강·초록이 번갈아 깜빡(약 4초에 한 번) */
  // ───────── 해 보기(E) ─────────
  function reward(sp, k, first) { const c = ST(); c.n[sp.id] = (c.n[sp.id] || 0) + 1; A.GAME.mark(); A.skUp(k, first ? 2 : 1, 'kit:sea4' + sp.id); }
  const btn = (a, t9, sub) => '<button ' + (sub ? 'class="sub" ' : '') + 'data-a="' + a + '">' + A.esc(t9) + '</button>';
  const closeRow = () => '<div class="sm" data-m style="min-height:1.4em"></div><div class="row">' + btn('x', en() ? 'Close' : '닫기', 1) + '</div>';
  // 고르기 창 하나(물음 + 본 것 + 답 셋) — 맞으면 ok(), 틀리면 그 답의 까닭 한 줄(정답 말하지 않음)
  function ask(title, seen, qn, opts, ok) { const e = en(); const P = A.openP('<h3>' + A.esc(title) + '</h3>' + seen + '<div class="grp">' + A.esc(qn) + '</div><div class="row" style="flex-direction:column;align-items:stretch">' + opts.map((o, i) => btn('o' + i, tx(o[0]))).join('') + '</div>' + closeRow(), false, 'sea4');
    if (!P) return null; const msg = t9 => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t9; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const i = +String(b.dataset.a).slice(1), o = opts[i]; if (!o) return;
      if (o[1]) { for (const q9 of P.querySelectorAll('[data-a^="o"]')) q9.disabled = true; b.style.outline = '3px solid #2f8a55'; msg(tx(o[2])); map.sfx && map.sfx('ding'); setTimeout(() => ok && ok(P), 50); } else { b.disabled = true; msg(tx(o[2])); map.sfx && map.sfx('tick'); } }; return P; }
  const seen = L9 => '<div class="sm">' + L9.map(t9 => A.esc(t9)).join('<br>') + '</div>';
  function use(sp, cl) { if (A.busy() || A.inb()) return; const e = en(), N = A.night() >= 1, c = ST(), first = !c.n[sp.id];
    if (sp.id === 'crab') { const ef = !cl && A.efx && A.efx(); if (ef && ef.closeOn && ef.closeOn()) { ef.closeKey(); return; }
      if (ef && ef.closeCrab && (N || (sp.wet && low())) && ef.closeCrab({ holes: sp.parts.filter(p => p.k === 'hole').map(p => [p.x, A.gy(p.x, p.z), p.z]), pellets: sp.parts.filter(p => p.k === 'pellet').map(p => [p.x, A.gy(p.x, p.z), p.z]), night: N, hide: on => { sp.cl = !!on; paint(); }, show: () => use(sp, true) })) return;   /* CLOSE-1: 먼저 가까이 보기(구멍에서 게가 나옴 · 밤 = 구멍으로 쏙) → 고르기 창 */
      if (N) return ask(e ? '🦀 Crabs on the night beach' : '🦀 밤 모래밭의 게', seen(e ? ['A pale crab with long legs runs very fast over the dry sand.', 'When you step closer, it dives into a hole in a flash.'] : ['다리가 긴 하얀 게가 마른 모래 위를 아주 빨리 달려요.', '한 걸음 다가가면 눈 깜짝할 새 구멍으로 쏙 들어가요.']), e ? 'How can you watch it up close?' : '이 게(달랑게)를 가까이 보려면?',
        [[T2('뛰어가서 잡는다', 'Run and grab it'), 0, T2('발소리와 흔들림을 느끼고 더 빨리 숨어요', 'It feels the footsteps and hides even faster')], [T2('멀찍이 서서 가만히 기다린다', 'Stand back and wait quietly'), 1, T2('가만히 있으면 다시 나와 먹이를 찾아요. 달랑게는 낮엔 구멍에 있다가 밤에 나와요.', 'Stay still and it comes back out to feed. Ghost crabs hide by day and come out at night.')], [T2('구멍을 파 본다', 'Dig up the hole'), 0, T2('구멍은 게의 집이에요 — 무너지면 다시 파야 해요', 'The hole is its home — it would have to dig again')]], () => reward(sp, 'look', first));
      if (!(sp.wet && low())) { const L9 = lowsOf(S().day), m = S().min, nx = L9.find(w => w[0] > m && w[0] + 20 < 18 * 60), now9 = hm(m), opts = [];
        const good = nx ? hm(nx[0] + 20) : null, hi = hm(lowAt(S().day) + TIDE_P / 2), bad2 = hm(Math.min(1430, m + 15));
        if (good) opts.push([T2(good, good), 1, T2('물이 빠지는 썰물 때예요. 그때 오면 게들이 구멍 밖으로 나와요.', 'That is low tide. Come then and the crabs will be out.')]);
        opts.push([T2(hi, hi), 0, T2('그때는 물이 가장 많이 들어와요 — 물때 표를 봐요', 'That is high tide — check the tide table')]); if (bad2 !== hi) opts.push([T2(bad2, bad2), 0, T2('아직 물이 차 있을 때예요', 'The water will still be in')]);
        if (!good) opts.push([T2('내일 썰물 때', 'Tomorrow at low tide'), 1, T2('오늘은 낮 썰물이 끝났어요. 내일 썰물 때 와요.', 'Today’s daytime low tide is over. Come tomorrow at low tide.')]);
        opts.sort((a, b) => H(sp.k + tx(a[0])) - H(sp.k + tx(b[0])));
        return ask(e ? '🦀 Crab holes' : '🦀 모래 구멍', seen(e ? ['Small holes dot the sand, ringed with tiny round sand balls.', 'Sea water covers part of the sand — no crabs in sight. Now ' + now9 + '.', 'Low tide today: ' + (L9.map(w => hm(w[0]) + '~' + hm(w[1])).join(', ') || 'none in daytime')] : ['모래에 작은 구멍이 여럿, 둘레에 동그란 모래 알갱이가 잔뜩 있어요.', '바닷물이 모래를 덮어 게가 안 보여요. 지금 ' + now9 + '.', '오늘 썰물: ' + (L9.map(w => hm(w[0]) + '~' + hm(w[1])).join(', ') || '낮에는 없음')]), e ? 'When should you come back to see the crabs?' : '게를 보려면 언제 다시 올까요?', opts, () => reward(sp, 'look', first)); }
      return ask(e ? '🦀 Sand-bubbler crabs' : '🦀 엽낭게', seen(e ? ['Tiny crabs scoop wet sand into their mouths.', 'They spit it out as round sand balls and line them up around the hole.'] : ['작은 게가 젖은 모래를 집게로 떠서 입에 넣어요.', '그리고 동그랗게 뭉친 모래 알갱이를 뱉어 구멍 둘레에 늘어놓아요.']), e ? 'Why does it eat sand and spit it out?' : '게는 왜 모래를 먹었다 뱉을까요?',
        [[T2('모래 사이 작은 먹이만 걸러 먹으려고', 'To filter out tiny bits of food in the sand'), 1, T2('맞아요. 모래 속 작은 먹이만 먹고 남은 모래를 뭉쳐 내놓아요. 썰물 때만 볼 수 있어요.', 'Yes. It keeps the tiny food and spits out the clean sand. You only see it at low tide.')], [T2('구멍을 숨기려고', 'To hide the hole'), 0, T2('알갱이는 오히려 구멍 둘레에 잔뜩 쌓여 눈에 띄어요', 'The balls pile up around the hole and make it easier to spot')], [T2('놀이하려고', 'For fun'), 0, T2('게가 모래를 입에 넣는 모습을 다시 살펴봐요', 'Look again at how it puts sand into its mouth')]], () => reward(sp, 'look', first)); }
    if (sp.id === 'tide') { const d = S().day, m = S().min, L0 = lowAt(d), lows = [L0 - TIDE_P, L0, L0 + TIDE_P].filter(v => v >= 0 && v < 1440), highs = [L0 - TIDE_P / 2, L0 + TIDE_P / 2, L0 + TIDE_P * 1.5].filter(v => v >= 0 && v < 1440), dl = tideLvl(d, m + 10) - tideLvl(d, m), lv = tideLvl(d, m), still = lv > 0.93 || lv < 0.07, ans = still ? 2 : dl > 0 ? 0 : 1;
      const rows = e ? ['Now ' + hm(m), 'Low tide (water lowest): ' + lows.map(hm).join(', '), 'High tide (water highest): ' + highs.map(hm).join(', ')] : ['지금 ' + hm(m), '간조(물이 가장 빠짐): ' + lows.map(hm).join(', '), '만조(물이 가장 참): ' + highs.map(hm).join(', ')];
      const W = [T2('물이 들어오는 중이에요(밀물)', 'The tide is coming in (flood)'), T2('물이 빠지는 중이에요(썰물)', 'The tide is going out (ebb)'), T2('물이 거의 멈췄어요', 'The water has nearly stopped')];
      const why = [T2('모래밭 끝에 있다가 물이 들어오면 돌아갈 길이 잠길 수 있어요. 나가기 전에 물때 표부터 봐요.', 'Out on the sand, the rising water can cut you off. Check the table before you go.'), T2('물이 빠지는 동안 모래밭이 넓어져요. 다음 만조 전에는 돌아와요.', 'The beach gets wider as the water falls. Come back before the next high tide.'), T2('간조나 만조 바로 앞뒤에는 물이 잠깐 멈춘 듯 보여요.', 'Right around high or low tide the water seems to stop for a while.')];
      return ask('🌊 ' + (e ? 'Tide table' : '물때 표'), seen(rows), e ? 'Look at the times. What is the sea doing now?' : '시각을 견주어 봐요. 지금 바닷물은?', W.map((w, i) => [w, i === ans, i === ans ? why[i] : T2('지금 시각이 간조와 만조 사이 어디쯤인지 다시 봐요', 'Check where now sits between low and high tide')]), () => reward(sp, 'look', first)); }
    if (sp.id === 'vest') { if (doneT(sp)) { map.hud.toast(e ? '🦆 You already have a jacket that fits — have fun on the duck boat!' : '🦆 몸에 맞는 조끼를 벌써 입었어요 — 오리배 즐겁게!', 3); return; }
      return ask('🦆 ' + (e ? 'Life jackets' : '오리배 구명조끼'), seen(e ? ['Jacket A: when you pull the shoulders up, it rides up past your ears.', 'Jacket B: snug, and when you pull the shoulders up it stays put. It has a strap between the legs.', 'Jacket C: grown-up size, and one buckle strap is torn.'] : ['조끼 가: 입고 어깨를 위로 당기면 귀 위까지 쑥 올라와요.', '조끼 나: 몸에 꼭 맞고, 어깨를 당겨도 그대로예요. 다리 사이 끈이 있어요.', '조끼 다: 어른 크기이고 버클 끈 하나가 끊어졌어요.']), e ? 'Which one do you wear?' : '어느 조끼를 입을까요?',
        [[T2('조끼 가', 'Jacket A'), 0, T2('너무 크면 물에 빠졌을 때 조끼만 떠오르고 몸이 빠져나갈 수 있어요', 'Too big and it floats up while you slip out')], [T2('조끼 나', 'Jacket B'), 1, T2('몸에 맞아야 물에 떠도 얼굴이 물 밖에 있어요. 버클과 다리 끈까지 다 채워요.', 'A snug fit keeps your face above water. Fasten every buckle and the leg strap.')], [T2('조끼 다', 'Jacket C'), 0, T2('끈이 끊어지면 조끼가 몸에서 벗겨질 수 있어요', 'With a torn strap the jacket can come off')]],
        () => { ST().done[sp.k] = S().day; A.GAME.mark(); paint(); reward(sp, 'work', first); }); }
    if (sp.id === 'gull') return ask('🐦 ' + (e ? 'Gulls over the sea' : '갈매기가 모인 곳'), seen(e ? ['Many gulls circle over one spot and dive into the water.', 'The surface below them flickers silver.'] : ['갈매기 여러 마리가 한곳 위를 맴돌다 물로 내리꽂아요.', '그 아래 물낯이 은빛으로 반짝반짝해요.']), e ? 'Why did the gulls gather here?' : '갈매기는 왜 이곳에 모였을까요?',
      [[T2('물낯 가까이 작은 물고기 떼가 올라와서', 'A school of small fish came up near the surface'), 1, T2('맞아요. 반짝임은 물고기 떼예요. 바다에서 일하는 사람들도 새가 모인 곳을 보고 물고기 떼를 찾아요.', 'Yes — the silver flicker is the fish. People who fish also look for gathering birds to find fish.')], [T2('바람을 피하려고', 'To get out of the wind'), 0, T2('바람을 피하려면 물 위가 아니라 바위나 둑에 앉아요', 'To shelter from wind they sit on rocks or walls, not over open water')], [T2('물이 얕아 쉬려고', 'The water is shallow so they rest'), 0, T2('쉬는 새는 맴돌거나 내리꽂지 않아요', 'Resting birds don’t circle and dive')]],
      () => { ST().done[sp.k] = S().day; A.GAME.mark(); paint(); reward(sp, 'look', first); });
    if (sp.id === 'wrack' || sp.id === 'drift') return pickOpen(sp, first);
    if (sp.id === 'jelly') return ask('🌊 ' + (e ? 'Jellyfish' : '해파리'), seen(e ? ['A clear, round jellyfish floats in the water.', 'Thin tentacles hang down from its umbrella-shaped body.'] : ['투명하고 둥근 해파리가 물에 둥실 떠 있어요.', '우산 같은 몸 아래로 가는 촉수가 늘어져 있어요.']), e ? 'You meet it while swimming. What do you do?' : '헤엄치다 해파리를 만나면?',
      [[T2('손으로 밀어낸다', 'Push it away by hand'), 0, T2('촉수에 쏘일 수 있어요. 바닷가에 밀려온 해파리도 만지지 않아요.', 'The tentacles can sting — even a jellyfish washed up on the beach.')], [T2('천천히 멀리 돌아가고, 쏘이면 물 밖으로 나와 어른에게 알린다', 'Swim slowly around it, and if stung get out and tell an adult'), 1, T2('맞아요. 쏘인 곳은 맹물 말고 바닷물로 씻고 안전요원이나 어른에게 알려요.', 'Yes. Rinse a sting with sea water, not fresh water, and tell a lifeguard or adult.')], [T2('가까이 가서 자세히 본다', 'Swim up close for a better look'), 0, T2('촉수는 몸보다 길게 늘어져 있어 생각보다 멀리 닿아요', 'The tentacles hang longer than the body and reach farther than you think')]],
      () => { ST().done[sp.k] = S().day; A.GAME.mark(); reward(sp, 'look', first); });
    if (sp.id === 'rope') return N ? ask('🏊 ' + (e ? 'Night sea' : '밤바다'), seen(e ? ['The sea is dark. You can hardly see the float line.'] : ['밤바다가 깜깜해요. 부표 줄도 잘 보이지 않아요.']), e ? 'Is it all right to swim now?' : '지금 헤엄쳐도 될까요?',
      [[T2('잠깐은 괜찮다', 'Just for a bit'), 0, T2('어두우면 물에 빠진 사람을 아무도 못 봐요', 'In the dark nobody can see someone in trouble')], [T2('밤에는 물에 들어가지 않고 바닷가로 나간다', 'Don’t swim at night — get out onto the beach'), 1, T2('맞아요. 해수욕장은 밤에 물에 들어가지 않아요. 안전요원도 낮에만 지켜요.', 'Yes. Beaches close the water at night, and lifeguards watch only in the daytime.')], [T2('부표 줄 가까이에서만 헤엄친다', 'Swim only near the float line'), 0, T2('줄 가까이는 물이 가장 깊은 곳이에요', 'Near the line is where the water is deepest')]], () => reward(sp, 'look', first))
      : ask('🏊 ' + (e ? 'Swim-limit floats' : '수영 한계선'), seen(e ? ['A line of floats lies on the water.', 'Beyond the line, boats come and go and the water gets deep.'] : ['부표가 물 위에 줄지어 떠 있어요.', '줄 바깥에는 배가 다니고 물이 깊어져요.']), e ? 'Can you swim out past the line?' : '부표 줄 바깥으로 헤엄쳐 나가도 될까요?',
      [[T2('헤엄을 잘하면 괜찮다', 'Fine if you swim well'), 0, T2('줄 바깥은 깊고, 배에서는 헤엄치는 사람이 잘 안 보여요', 'It is deep out there, and people in boats can hardly see swimmers')], [T2('줄 안쪽에서만 헤엄친다', 'Swim only inside the line'), 1, T2('맞아요. 부표 줄은 헤엄칠 수 있는 곳의 끝이에요. 배도 이 줄 안으로는 들어오지 않아요.', 'Yes. The float line is the edge of the swimming area, and boats stay outside it.')], [T2('줄을 넘었다가 바로 돌아온다', 'Cross it and come right back'), 0, T2('잠깐이라도 줄 바깥은 배가 다니는 길이에요', 'Even for a moment, outside the line is where boats go')]], () => reward(sp, 'look', first));
    if (sp.id === 'buoy') { const P = ask('⚓ ' + (e ? 'Channel buoys' : '항로 표지 부표'), '<canvas class="twn-sea4" width="240" height="200" style="display:block;margin:4px auto;width:240px;height:200px"></canvas>' + seen(e ? ['You are heading back to the pier (the arrow).', N ? 'Ahead, a red light and a green light blink.' : 'Ahead float a red buoy with a pointed top and a green buoy with a flat top.'] : ['배가 선착장 쪽(화살표)으로 돌아가는 길이에요.', N ? '앞에 빨간 불과 초록 불이 깜빡여요.' : '앞에 머리가 뾰족한 빨간 부표와 머리가 납작한 초록 부표가 떠 있어요.']), e ? 'Which way should the boat go?' : '배는 어디로 지나가야 할까요?',
      [[T2('가: 초록 부표 바깥(왼쪽)', 'A: outside the green buoy (left)'), 0, T2('표지 바깥은 얕거나 바위가 있을 수 있어요', 'Outside the marks it may be shallow or rocky')], [T2('나: 두 부표 사이', 'B: between the two buoys'), 1, T2('맞아요. 우리나라 바다에서는 선착장 쪽으로 들어올 때 빨간 표지를 오른쪽, 초록 표지를 왼쪽에 두고 지나가요. 그 사이가 배가 다니는 길이에요. 이제 직접 지나가 봐요!', 'Yes. In Korean waters, heading in you keep the red mark on your right and the green on your left. Between them is the channel. Now sail through!')], [T2('다: 빨간 부표 바깥(오른쪽)', 'C: outside the red buoy (right)'), 0, T2('빨간 표지는 들어올 때 배의 오른쪽에 두어요', 'Heading in, the red mark stays on the boat’s right')]],
      () => { gate = { k: sp.k, t: performance.now(), s: null }; reward(sp, 'explore', first); });
      if (P) chart(P.querySelector('canvas.twn-sea4'), N); return P; } }
  // 부표 그림(위에서 본 것 · 위 = 선착장 쪽 · 배는 아래에서 위로) — 길 셋(가·나·다)
  function chart(cv, N) { if (!cv) return; const g = cv.getContext('2d'); g.fillStyle = N ? '#1c2f45' : '#5fa8c8'; g.fillRect(0, 0, 240, 200); g.fillStyle = N ? '#9fb3c8' : '#f2e6c4'; g.fillRect(0, 0, 240, 22); g.fillStyle = '#2b2622'; g.font = 'bold 13px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText(en() ? 'Pier' : '선착장', 120, 16);
    const by = (x, c, pt) => { if (N) { g.fillStyle = c; g.beginPath(); g.arc(x, 92, 9, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x, 92, 16, 0, 7); g.fill(); return; } g.fillStyle = c; g.fillRect(x - 9, 88, 18, 20); g.beginPath(); if (pt) { g.moveTo(x - 9, 88); g.lineTo(x, 70); g.lineTo(x + 9, 88); } else g.rect(x - 10, 80, 20, 8); g.fill(); };
    by(80, N ? '#5cff8a' : '#2f8a55', false); by(160, N ? '#ff5a4a' : '#d6403a', true);
    g.setLineDash([6, 5]); g.lineWidth = 3; g.strokeStyle = '#fff'; for (const [x, k] of [[40, 0], [120, 1], [200, 2]]) { g.beginPath(); g.moveTo(120, 186); g.quadraticCurveTo(x, 150, x, 44); g.stroke(); g.setLineDash([]); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - 7, 50); g.lineTo(x, 36); g.lineTo(x + 7, 50); g.fill(); g.setLineDash([6, 5]); g.fillStyle = '#2b2622'; g.fillText(en() ? 'ABC'[k] : '가나다'[k], x + (k === 1 ? 14 : 0), 132); }
    g.setLineDash([]); g.fillStyle = '#f4f0e6'; g.beginPath(); g.moveTo(112, 196); g.lineTo(120, 178); g.lineTo(128, 196); g.fill(); }
  // 주울까 둘까(물건 다섯 · 물건마다 고름 · 맞으면 까닭 한 줄 · 틀리면 '다시 봐요') — 다 고르면 주운 것이 세상에서 사라지고 생물·자연물만 남음(오늘)
  function pickOpen(sp, first) { const e = en(), d = S().day; if (doneT(sp)) { map.hud.toast(sp.id === 'wrack' ? (e ? '♻ Already sorted today — the next tide brings more' : '♻ 오늘은 다 골랐어요 — 다음 물때에 또 밀려와요') : (e ? '♻ Already cleared here today' : '♻ 오늘은 여기 다 건졌어요'), 3); return; }
    const POOL = sp.id === 'wrack' ? SEA4_BEACH : SEA4_SEA, L9 = POOL.slice().sort((a, b) => H(sp.k + d + a[0][0]) - H(sp.k + d + b[0][0])).slice(0, 5); if (!L9.some(q9 => q9[1])) L9[0] = POOL[0]; if (!L9.some(q9 => !q9[1])) L9[4] = POOL[POOL.length - 1];
    const left = new Set(L9.map((_, i) => i)); let bad = 0;
    const row = (q9, i) => '<div class="st" data-r="' + i + '"><span style="flex:1"><b>' + A.esc(tx(q9[0])) + '</b><div class="sm" data-w></div></span><button data-a="t' + i + '">' + (e ? 'Take' : '주워요') + '</button><button class="sub" data-a="l' + i + '">' + (e ? 'Leave' : '둬요') + '</button></div>';
    const P = A.openP('<h3>♻ ' + A.esc(sp.id === 'wrack' ? (e ? 'The tide line' : '물때선에 밀려온 것') : (e ? 'Floating by the boat' : '배 곁에 떠다니는 것')) + '</h3><div class="sm">' + A.esc(sp.id === 'wrack' ? (e ? 'The high tide left a line of things on the sand. Take what people threw away; leave what came from the sea.' : '밀물이 모래 위에 줄지어 남기고 간 것들이에요. 사람이 버린 것은 주워 가고, 바다에서 온 것은 그대로 둬요.') : (e ? 'Fish out what people threw away; leave what lives in the sea.' : '사람이 버린 것은 건져 가고, 바다에 사는 것은 그대로 둬요.')) + '</div>' + L9.map(row).join('') + closeRow(), false, 'sea4');
    if (!P) return; const msg = t9 => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t9; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.a; if (a === 'x') { A.closeP(); return; } const i = +a.slice(1), it = L9[i]; if (!it || !left.has(i)) return; const take = a[0] === 't';
      if (take !== !!it[1]) { bad++; msg(it[1] ? (e ? 'Look again — did this come from the sea, or from people?' : '다시 봐요 — 바다에서 온 것인가요, 사람이 만든 것인가요?') : (e ? 'Look again — is this something alive or from the sea?' : '다시 봐요 — 바다 생물이나 자연에서 온 것은 아닌가요?')); map.sfx && map.sfx('tick'); return; }
      left.delete(i); const r = P.querySelector('[data-r="' + i + '"]'); if (r) { for (const q9 of r.querySelectorAll('button')) q9.remove(); const w = r.querySelector('[data-w]'); if (w) w.textContent = (take ? (e ? 'Taken — ' : '주웠어요 — ') : (e ? 'Left — ' : '뒀어요 — ')) + tx(it[2]); } msg(''); map.sfx && map.sfx(take ? 'ding' : 'tick');
      if (!left.size) { ST().done[sp.k] = d; A.GAME.mark(); paint(); reward(sp, 'work', first); msg(sp.id === 'wrack' ? (e ? 'The sand is clean, and the shells and seaweed stay for the sand animals.' : '모래밭이 깨끗해졌어요. 조개껍데기와 해초는 모래 속 생물을 위해 남았어요.') : (e ? 'The sea is clearer here. The seaweed and jellyfish drift on.' : '이 바다가 깨끗해졌어요. 해초와 해파리는 그대로 흘러가요.')); } }; }
  // 부표 사이 지나가 보기(맞힌 뒤 3분 안 · 배로 · 1초마다): 선착장 쪽으로 두 부표 사이를 지나면 한 줄 · 바깥으로 지나면 다시 한 줄
  function gateSec(me) { if (!gate) return; if (performance.now() - gate.t > 180000) { gate = null; return; } const B = A.boat(); if (!B.on) return; const sp = SP.find(s => s.k === gate.k); if (!sp) { gate = null; return; }
    const dx = me.x - sp.x, dz = me.z - sp.z, al = dx * sp.u[0] + dz * sp.u[1], lat = dx * sp.r[0] + dz * sp.r[1], side = al > 0 ? 1 : -1; if (gate.s == null) { gate.s = side; gate.lat = lat; return; }
    if (side !== gate.s && Math.abs(al) < 12) { const e = en(), inb = Math.abs(lat) < 7 || Math.abs(gate.lat) < 7, inward = side > 0; gate.s = side; gate.lat = lat; if (!inward) return;
      if (inb) { A.say(e ? '⚓ Through the channel — red on your right, green on your left!' : '⚓ 표지 사이로 잘 지나왔어요 — 빨강은 오른쪽, 초록은 왼쪽!', 3.4, 1); map.sfx && map.sfx('done'); A.skUp('explore', 1, 'kit:sea4gate'); gate = null; }
      else A.say(e ? '⚓ That was outside the marks — try again between them' : '⚓ 표지 바깥으로 지났어요 — 두 부표 사이로 다시 지나가 봐요', 3, 1); } else { gate.s = side; gate.lat = lat; } }
  function clear() { if (BOX && BOX.parent) BOX.parent.remove(BOX); if (LIT && LIT.parent) LIT.parent.remove(LIT); for (const o of [BG, BM, LG, LM]) if (o) o.dispose(); for (const sp of SP) if (sp.h) sp.h.remove(); BOX = LIT = BG = BM = LG = LM = null; SP.length = 0; PT.length = 0; on = false; near = false; gate = null; dayK = -1; }
  function dispose() { clear(); }
  const info = () => ({ on, buildMs, parts: PT.length, vis: !!(BOX && BOX.visible), lit: !!(LIT && LIT.visible), spots: SP.map(s => ({ n: s.n, id: s.id, swim: !!s.swim, x: +s.x.toFixed(1), z: +s.z.toFixed(1), ex: +s.ex.toFixed(1), ez: +s.ez.toFixed(1), off: !!s.h.hot.off, label: s.h.hot.label, done: doneT(s), bad: !!s.bad, u: s.u ? s.u.map(v => +v.toFixed(2)) : null })), gate: gate ? { k: gate.k, s: gate.s } : null });
  return { init, sec, tick, dispose, info, use: k => { const sp = SP.find(s => s.k === k); if (sp) use(sp); return !!sp; }, st: () => ST(), seaOk: (x, z) => !!A.sea(x, z), landOk: (x, z) => !!A.land(x, z), harb: () => { const h = A.harb(); return h ? [h.x, h.z] : null; }, boatRef: () => A.boat() };   /* 시험 손잡이(town_sea4.cjs) */
}
