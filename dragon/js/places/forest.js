// 안개 숲(2장 ② 추적) — 계약 = docs/dragon/stage3_plan.md §2·§3 forest · 때 fog(기본) / overcast
// 숲은 걸을 수 있는 '짐승 길'(덤불 사이로 난 골짜기 길) 그물: 참 길 spawn → crash 약 190m · 갈림 셋(틀린 갈래는 30~35m 가다 막힘 · 막다른 곳엔 단서 없음)
// 단서(부러진 나무·파인 땅·그을음)는 길가에 붙여 놓아 안개(20~40m) 속에서 가까이 가야 보임 · 지도 큰 것(큰 전나무·갈라진 바위·개울·통나무·벼랑·고사목·바위 무더기)은 멀리서도 실루엣
// 정적인 것은 모두 청크 굽기(look/nature.js) — 그리기 = 보이는 청크 수 + 물 1 + 꼬리날개 조각 1
import * as THREE from 'three';
import { setTime, TIMES, toon } from '../look/kit.js?v=15';
import { createNoise } from '../core/noise.js?v=15';
import { createRng } from '../core/rng.js?v=15';
import * as NT from '../look/nature.js?v=15';

const { C3, mixc, sstep, clamp, hash, TAU, mat4, matLay } = NT;
/* 때마다 덮어쓸 안개(숲은 나무가 빽빽해 멀리 못 봄) — fog = 20~40m 시야 · overcast = 옅은 숲 안개 */
const OVER = { fog: { near: 3, far: 50, low: 0.3 }, overcast: { near: 28, far: 240, low: 0.26 } };

/* 길 조절점(위 = 남쪽 마을 쪽 +z · 아래 = 북쪽 −z) — 스폰 뒤로 15m 더 뻗음(돌아본 길이 막다른 벽으로 안 보이게) */
const TRUE_CTRL = [[7, 110], [5, 95], [1, 80], [-3, 62], [-20, 47], [-30, 32], [-30, 16], [-15, 1], [-6, -15], [-2, -26], [11, -43], [17, -56], [20, -68]];
const SPAWN_I = 1, FORK_I = [3, 6, 9];
const WRONG_CTRL = [
  [[-3, 62], [7, 55], [15, 47], [23, 39]],          // 갈림 A — 오른쪽(동쪽)으로 가다 덤불에 막힘
  [[-30, 16], [-39, 12], [-48, 7], [-55, 3]],       // 갈림 B — 서쪽 벼랑 밑에서 막힘
  [[-2, -26], [-10, -33], [-17, -42], [-21, -51]],  // 갈림 C — 북서쪽 빽빽한 숲에서 막힘
];
const CRASH = [20, -68], CRASH_R = 12.5;
const STREAM_CTRL = [[-59.5, 41], [-50, 37], [-40, 34], [-31, 31], [-22, 28], [-12, 25], [0, 21], [14, 22], [30, 28], [48, 36], [70, 44], [100, 52], [130, 58]];
const LAND = [
  { kind: 'bigtree', x: -10, z: 81, r: 2.5, label: '큰 전나무' },
  { kind: 'rock', x: -2, z: 49.5, r: 3.6, label: '갈라진 바위' },
  { kind: 'stream', x: 0, z: 0, r: 2, label: '개울' },          // 자리는 참 길과 만나는 곳으로 채움
  { kind: 'log', x: -39.5, z: 33.5, r: 7, label: '쓰러진 큰 통나무' },
  { kind: 'cliff', x: -64, z: 10, r: 26, label: '벼랑' },
  { kind: 'deadtree', x: -17.5, z: -8, r: 2, label: '하얀 고사목' },
  { kind: 'boulders', x: 12.5, z: -30, r: 3.8, label: '바위 무더기' },
];
/* 단서 — s = 참 길 위 거리(스폰부터) · side = 길 오른쪽(+1)/왼쪽(−1) · high = 높이 꺾임(앞쪽 = 드래곤이 우듬지를 스치며 내려옴) */
const CLUES = [
  { kind: 'broken', s: 25, side: 1, high: 1 }, { kind: 'scorch', s: 46, side: -1 }, { kind: 'broken', s: 67, side: 1, high: 1 },
  { kind: 'scorch', s: 86, side: -1 }, { kind: 'broken', s: 103, side: 1, high: 0.6 }, { kind: 'scorch', s: 121, side: 1 },
  { kind: 'broken', s: 152, side: -1, high: 0.3 }, { kind: 'furrow', s: 169, side: 0 }, { kind: 'broken', s: 175, side: 1, high: 0 }, { kind: 'furrow', s: 184, side: 0 },
];
const FIN_S = 178.5;

export async function buildPlace(ctx) {
  const { group, env } = ctx, opt = ctx.opt || {};
  const time = opt.time && TIMES[opt.time] ? opt.time : 'fog';
  setTime(env, time, OVER[time]);
  if (env.sea) env.sea.visible = false;
  const R = createRng(2010), N = createNoise(23), N2 = createNoise(71);
  const T0 = performance.now();

  /* ── 길 그물 ── */
  const truePts = NT.spline(TRUE_CTRL, 1);
  const spawnIdx = nearestIdx(truePts, TRUE_CTRL[SPAWN_I]);
  const pathPts = truePts.slice(spawnIdx);                       // 지도·단서용 = 스폰부터
  const pathLen = NT.polyLen(pathPts);
  const forks = FORK_I.map((i) => TRUE_CTRL[i]);
  const wrongPts = WRONG_CTRL.map((c) => NT.spline(c, 1));
  const base = (x, z) => 30 - z * 0.055 - x * 0.025 + (N.fbm(x * 0.011 + 5, z * 0.011 + 2, 4) - 0.5) * 14 + (N.v2(x * 0.06, z * 0.06) - 0.5) * 1.6;
  const cliffX = (z) => -61 + 2.5 * Math.sin(z * 0.09) + (N2.v2(z * 0.05, 7) - 0.5) * 4;
  const cliffH = (z) => 13 * sstep(-48, -28, z) * sstep(72, 52, z);
  const lift = (x, z) => { const r = Math.hypot(x + 10, z - 15); return sstep(112, 168, r) * 24 + cliffH(z) * sstep(cliffX(z) + 1.5, cliffX(z) - 2.5, x); };
  const hwTrue = truePts.map((p, k) => 4.0 + (N2.v2(k * 0.07, 3) - 0.5) * 1.8 + forkWiden(p, forks));
  const lines = [
    { pts: truePts, hw: hwTrue, val: truePts.map((p) => base(p[0], p[1])) },
    ...wrongPts.map((P, w) => ({ pts: P, hw: P.map((p, k) => (3.9 + (N2.v2(k * 0.08, 9 + w) - 0.5) * 1.4) * (1 - 0.18 * k / P.length) + forkWiden(p, forks)), val: P.map((p) => base(p[0], p[1])) })),
  ];
  /* 빈터(원) — 스폰 · 떨어진 자리 = 거리 밭에 원을 꺾은선 하나짜리로 넣음 */
  const circ = (x, z, r) => ({ pts: [[x, z], [x + 0.01, z]], hw: [r, r], val: [base(x, z), base(x, z)] });
  lines.push(circ(TRUE_CTRL[SPAWN_I][0], TRUE_CTRL[SPAWN_I][1], 6.2), circ(CRASH[0], CRASH[1], CRASH_R));

  /* 거리 밭(1m) — 걷는 곳 경계·둑·나무 밀도가 모두 이것을 봄 */
  const X0 = -168, S1 = 1, NX1 = 337, spec1 = { x0: X0, z0: X0, step: S1, nx: NX1, nz: NX1 };
  const F = NT.distField(spec1, lines, 30);
  const D = NT.createGrid(X0, X0, S1, NX1, NX1); D.h.set(F.d);
  const BC = NT.createGrid(X0, X0, S1, NX1, NX1); BC.h.set(F.v); NT.blurGrid(BC, 5, 2);   // 길 바닥 높이 = 가까운 길 점의 땅 높이를 흐려서(빈터·갈래 경계 계단 X)
  /* 개울 — 물높이는 아래로만(위에서 아래로 가며 가장 낮은 값) */
  const sPts = NT.spline(STREAM_CTRL, 1.5);
  const sBed = []; let lo = 1e9; for (const p of sPts) { lo = Math.min(lo, base(p[0], p[1]) + lift(p[0], p[1]) * 0.2 - 1.15); sBed.push(lo); }
  const cross = crossing(sPts, truePts);                          // 참 길과 개울이 만나는 곳 = 얕은 여울
  LAND[2].x = +cross[0].toFixed(1); LAND[2].z = +cross[1].toFixed(1);
  const SF = NT.distField(spec1, [{ pts: sPts, val: sBed }], 10);
  const SD = NT.createGrid(X0, X0, S1, NX1, NX1); SD.h.set(SF.d);
  const SB = NT.createGrid(X0, X0, S1, NX1, NX1); SB.h.set(SF.v);
  const fordK = (x, z) => sstep(9, 3, Math.hypot(x - cross[0], z - cross[1]));
  await NT.breathe();

  /* ── 땅 높이(1m 격자 · 걸음 높이도 이 격자) ── */
  const S2 = 1, NX2 = 337, TG = NT.createGrid(X0, X0, S2, NX2, NX2);
  const furrow = makeFurrow(pathPts, pathLen);                     // 파인 땅 고랑 — 가운데 홈은 땅에 파고(1m 격자) · 양옆 둑은 0.25m 격자로 더함
  const crashFront = Math.atan2(CRASH[0] - 11, CRASH[1] + 43);  // 드래곤이 온 방향(남남서 → 북북동)
  TG.fill((x, z) => {
    const b = base(x, z) + lift(x, z), d = D.at(x, z), inside = sstep(2.6, -1.2, d);
    const bank = d > 0 ? sstep(-0.5, 9, d) * (2.0 + 3.4 * N2.fbm(x * 0.04 + 9, z * 0.04, 3)) : 0;
    const out = d < 26 ? Math.max(b + bank, BC.at(x, z) + bank * 0.9) : b + bank;     // 길 밖은 늘 길보다 높게 = 움푹한 짐승 길(둑길처럼 솟지 않음)
    let h = out * (1 - inside) + (BC.at(x, z) - 0.15 + (N.v2(x * 0.15, z * 0.15) - 0.5) * 0.25) * inside;
    const ds = SD.at(x, z);
    if (ds < 7.5) { const fk = fordK(x, z), bed = SB.at(x, z) + fk * 0.28; h = Math.min(h, bed + (2.3 - fk * 1.3) * sstep(0.9, 3.9, ds) + Math.max(0, ds - 3.9) * 2.5); }
    const rc = Math.hypot(x - CRASH[0], z - CRASH[1]);
    if (rc < 11) h -= 2.8 * (1 - (rc / 11) ** 2) ** 2;
    if (rc < 18) { const a = Math.atan2(x - CRASH[0], z - CRASH[1]), fr = Math.cos(a - crashFront); h += 0.9 * Math.exp(-(((rc - 12) / 2.4) ** 2)) * (0.45 + 0.55 * Math.max(0, fr)); }
    return h + furrow.carve(x, z);
  });
  const height = (x, z) => TG.at(x, z) + furrow.bump(x, z);
  const yAt = (x, z) => +height(x, z).toFixed(3);
  await NT.breathe();

  /* ── 굽개 · 나무 그늘 격자(밑동 둘레 땅을 어둡게 = 떠 보이지 않음) ── */
  const B = NT.createBuilder({ x0: X0, z0: X0, size: 42, nx: 8, nz: 8, far: 1 });
  const AO = new Float32Array(NX2 * NX2), aoAdd = (x, z, r, k) => {
    const i0 = Math.max(0, Math.floor((x - r - X0) / S2)), i1 = Math.min(NX2 - 1, Math.ceil((x + r - X0) / S2)), j0 = Math.max(0, Math.floor((z - r - X0) / S2)), j1 = Math.min(NX2 - 1, Math.ceil((z + r - X0) / S2));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = X0 + i * S2 - x, dz = X0 + j * S2 - z, w = 1 - (dx * dx + dz * dz) / (r * r); if (w > 0) AO[j * NX2 + i] += w * k; }
  };
  const scorchSpots = [];                                         // { x, z, r } — 땅 색·물건 색을 검게
  const blockers = [], logBlock = (x0, z0, yaw, len, r, step = 1) => { for (let s = 0.5; s < len; s += step) { const x = x0 + Math.sin(yaw) * s, z = z0 + Math.cos(yaw) * s; if (D.at(x, z) < 0.6) blockers.push({ x: +x.toFixed(2), z: +z.toFixed(2), r }); } };
  const busy = [];                                                // 큰 것 자리(나무를 안 심음)
  const free = (x, z, r) => { for (const b of busy) if ((x - b[0]) ** 2 + (z - b[1]) ** 2 < (r + b[2]) ** 2) return false; return true; };

  /* 원형 — 같은 것 여러 벌(복사 티를 줄임) */
  const FIR = [0, 1, 2, 3, 4, 5].map((k) => NT.firGeo(100 + k, { h: 12, tiers: 4, seg: 6, wide: 0.88 + (k % 3) * 0.1 }));
  const FIR_MID = [0, 1].map((k) => NT.firGeo(200 + k, { h: 12, tiers: 3, seg: 5, wide: 0.95 }));
  const FIR_FAR = [NT.firFarGeo({ h: 12 }), NT.firFarGeo({ h: 12, wide: 0.85 })];
  const BIRCH = [0, 1, 2].map((k) => NT.birchGeo(300 + k, { h: 10, lite: true })), BIRCH_FAR = NT.birchFarGeo({ h: 10 });
  const ROCK = [0, 1, 2, 3, 4].map((k) => NT.rockGeo(400 + k, { flat: 0.55 + k * 0.07 })), PEB = [0, 1, 2].map((k) => NT.rockGeo(430 + k, { flat: 0.6, detail: 0 })), ROCK_BIG = [0, 1, 2].map((k) => NT.rockGeo(450 + k, { detail: 2, flat: 0.75, sharp: 0.6 }));
  const FERN = [0, 1, 2, 3].map((k) => NT.fernGeo(500 + k, { size: 1 })), FERN_X = [NT.fernGeo(520, { burnt: true }), NT.fernGeo(521, { burnt: true, size: 0.8 })];
  const GRASS = [0, 1, 2].map((k) => NT.grassGeo(600 + k, { blades: 8, h: 0.42 })), GRASS_Y = NT.grassGeo(610, { blades: 9, h: 0.55, tip: C3(0xb4b46a), base: C3(0x55603a) });
  const CUSH = [NT.cushionGeo(650), NT.cushionGeo(651, { a: C3(0x4a5e2e), b: C3(0x8a9a4a) }), NT.cushionGeo(652, { a: C3(0x3e5530), b: C3(0x67824a) })];
  const CLIFF = [0, 1, 2].map((k) => NT.rockGeo(470 + k, { detail: 2, flat: 0.95, sharp: 0.75, moss: 0.35 }));
  const FALLEN = [0, 1, 2].map((k) => NT.fallenFirGeo(480 + k, { len: 9 + k * 1.5, r: 0.28 + k * 0.04 }));
  const BUSH = [0, 1, 2].map((k) => NT.bushGeo(700 + k, { n: 2 + k % 2 }));
  const LOGS = [0, 1, 2].map((k) => NT.logGeo(800 + k, { len: 7 + k * 2.5, r: 0.38 + k * 0.08 }));
  const STUMP = [0, 1].map((k) => NT.stumpGeo(900 + k, { h: 0.7, r: 0.38 }));
  const DEADS = [NT.deadTreeGeo(960, { h: 8, branches: 4 }), NT.deadTreeGeo(961, { h: 10, branches: 5 })];
  const CHIPS = [NT.chipsGeo(1001), NT.chipsGeo(1002, 16, 2.2)], SHROOM = [NT.mushroomGeo(1101, 4), NT.mushroomGeo(1102, 3), NT.mushroomGeo(1103, 5)];
  const tintOf = (k, amt = 0.12, hueB = 0) => { const a = 1 + (hash(k, 1) - 0.5) * amt * 2, g = a * (1 + (hash(k, 2) - 0.5) * amt), b = a * (1 + (hash(k, 3) - 0.5) * amt + hueB); return [a, g, b]; };
  const scorchPaint = (cx, cz, r, yTop = 99) => (x, y, z, c) => { const d = Math.hypot(x - cx, z - cz); if (d < r && y < yTop) { const k = sstep(r, r * 0.25, d) * (0.75 + hash(Math.round(x * 4), Math.round(z * 4), Math.round(y * 4)) * 0.25); c[0] *= 1 - k * 0.86; c[1] *= 1 - k * 0.88; c[2] *= 1 - k * 0.86; } };

  const fir = (x, z, s, k, o = {}) => {
    const y = TG.at(x, z), yaw = hash(k, 7) * TAU, sy = s * (0.88 + hash(k, 8) * 0.3), tx = (hash(k, 9) - 0.5) * 0.07, tz = (hash(k, 10) - 0.5) * 0.07, tint = o.tint || tintOf(k, 0.1, (hash(k, 11) - 0.5) * 0.08);
    const m = mat4(x, y - 0.15, z, yaw, s, sy, s, tx, tz);
    B.put(o.mid ? FIR_MID[k % 2] : FIR[k % 6], m, tint, 'near', o.paint || null);
    B.put(FIR_FAR[k % 2], mat4(x, y - 0.15, z, yaw, s, sy, s, tx, tz), tint, 'far');
    aoAdd(x, z, 2.2 + s * 2.2, 0.55);
  };
  const birch = (x, z, s, k) => {
    const y = TG.at(x, z), yaw = hash(k, 7) * TAU, m = mat4(x, y - 0.1, z, yaw, s, s * (0.9 + hash(k, 8) * 0.25), s, (hash(k, 9) - 0.5) * 0.12, (hash(k, 10) - 0.5) * 0.12);
    B.put(BIRCH[k % 3], m, tintOf(k, 0.08), 'near'); B.put(BIRCH_FAR, mat4(x, y - 0.1, z, yaw, s, s, s), tintOf(k, 0.08), 'far'); aoAdd(x, z, 2.5 * s + 1, 0.35);
  };
  const rock = (x, z, r, k, o = {}) => {
    const y = TG.at(x, z), g = o.big ? ROCK_BIG[k % 3] : r < 0.5 ? PEB[k % 3] : ROCK[k % 5], m = mat4(x, y + (o.dy ?? -r * 0.18), z, hash(k, 3) * TAU, r * (0.85 + hash(k, 4) * 0.3), r * (o.sy || 1), r * (0.85 + hash(k, 5) * 0.3), (hash(k, 6) - 0.5) * 0.2, (hash(k, 7) - 0.5) * 0.2);
    B.put(g, m, o.tint || tintOf(k, 0.08), r > 1.3 ? 'both' : 'near', o.paint || null); aoAdd(x, z, r * 1.6, 0.4);
  };
  const fern = (x, z, s, k, burnt) => { B.put(burnt ? FERN_X[k % 2] : FERN[k % 4], mat4(x, TG.at(x, z) - 0.04, z, hash(k, 3) * TAU, s, s * (0.8 + hash(k, 4) * 0.4), s), burnt ? null : tintOf(k, 0.1, (hash(k, 5) - 0.5) * 0.06)); };
  const logAt = (x, z, yaw, k, s = 1, o = {}) => {
    const g = o.geo || LOGS[k % 3], y = TG.at(x, z), L = g === LOGS[0] ? 7 : g === LOGS[1] ? 9.5 : 12, ex = x + Math.sin(yaw) * L * s, ez = z + Math.cos(yaw) * L * s, y2 = TG.at(ex, ez);
    const tilt = Math.atan2(y2 - y, L * s);
    B.put(g, mat4(x, y - 0.12, z, yaw, s, s, s, -tilt, 0), tintOf(k, 0.08), 'both', o.paint || null);
    aoAdd((x + ex) / 2, (z + ez) / 2, L * s * 0.5 + 0.8, 0.25);
    if (o.block) logBlock(x, z, yaw, L * s, 0.45 * s);
    if (hash(k, 31) < 0.45) { const f = 0.2 + hash(k, 32) * 0.6, sx = x + Math.sin(yaw) * L * s * f + Math.cos(yaw) * 0.55 * s, sz = z + Math.cos(yaw) * L * s * f - Math.sin(yaw) * 0.55 * s; B.put(SHROOM[k % 3], mat4(sx, TG.at(sx, sz), sz, hash(k, 33) * TAU, 1.2), null, 'near'); }   // 통나무 밑 버섯
  };

  /* ── 큰 것(지도 표시) ── */
  const L = Object.fromEntries(LAND.map((l) => [l.kind, l]));
  {  // 큰 전나무 — 숲 지붕 위로 솟는 뾰족 실루엣 + 굵은 뿌리
    const { x, z } = L.bigtree, y = TG.at(x, z), g = NT.firGeo(77, { h: 12, tiers: 6, seg: 7, wide: 1.05 });
    B.put(g, mat4(x, y - 0.3, z, 0.4, 2.35, 2.45, 2.35), [0.92, 0.98, 1.0], 'both'); aoAdd(x, z, 9, 0.9); busy.push([x, z, 5]);
    const rootM = new NT.Mesher(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3, l = 2.4 + hash(k, 77) * 1.2; NT.tube(rootM, [[0, 1.0, 0, 0.55, C3(0x45372d)], [Math.cos(a) * l * 0.5, 0.35, Math.sin(a) * l * 0.5, 0.32, C3(0x4c3d31)], [Math.cos(a) * l, -0.25, Math.sin(a) * l, 0.12, C3(0x3a2e25)]], 5); }
    B.put(rootM.done(), mat4(x, y, z), null, 'near');
    blockers.push({ x, z, r: 1.4 });
  }
  {  // 갈라진 바위 — 큰 바위 두 쪽이 벌어져 틈에 어린 전나무
    const { x, z } = L.rock, y = TG.at(x, z), a = 0.7, ux = Math.cos(a), uz = Math.sin(a);
    for (const s of [-1, 1]) B.put(ROCK_BIG[s > 0 ? 0 : 1], mat4(x + ux * s * 1.75, y - 0.6, z + uz * s * 1.75, a + (s > 0 ? 0.2 : 3.3), 2.0, 2.6, 2.9, 0, s * 0.16), [0.98, 0.98, 0.95], 'both');
    B.put(FIR[2], mat4(x, y + 0.2, z, 1.1, 0.22, 0.26, 0.22), null, 'near');
    aoAdd(x, z, 6, 0.8); busy.push([x, z, 4.5]);
  }
  {  // 쓰러진 큰 통나무 — 개울을 가로질러 누움(뿌리판이 들려 있음)
    const { x, z } = L.log, yaw = 2.95, g = NT.logGeo(888, { len: 15, r: 0.85, rootEnd: true }), y = TG.at(x - Math.sin(yaw) * 7, z - Math.cos(yaw) * 7);
    B.put(g, mat4(x - Math.sin(yaw) * 7, y + 0.35, z - Math.cos(yaw) * 7, yaw, 1, 1, 1, -0.05, 0), null, 'both');
    busy.push([x, z, 7]); aoAdd(x, z, 8, 0.4);
  }
  {  // 벼랑 — 서쪽 높은 땅의 낯(큰 바위 판을 줄지어 세움 · 이끼는 위쪽에)
    for (let z = -44, k = 0; z < 70; z += 3.6 + hash(k, 1) * 1.6, k++) {
      const hc = cliffH(z); if (hc < 2) continue;
      const cx = cliffX(z), y = TG.at(cx + 3, z), w = 2.0 + hash(k, 2) * 1.3;
      B.put(CLIFF[k % 3], mat4(cx - 0.8, y + hc * 0.38, z, hash(k, 3) * TAU, w, hc * (0.72 + hash(k, 4) * 0.2), w * 0.8, 0, (hash(k, 5) - 0.5) * 0.1), tintOf(k, 0.06), 'both');
      if (k % 2) B.put(ROCK[k % 5], mat4(cx + 1.6, y - 0.1, z + 1, hash(k, 6) * TAU, 1.1 + hash(k, 7), 1, 1.2), null, 'near');
      busy.push([cx, z, 4]);
    }
  }
  {  // 하얀 고사목 — 밝은 앙상한 실루엣
    const { x, z } = L.deadtree, y = TG.at(x, z);
    B.put(NT.deadTreeGeo(55, { h: 14, branches: 7 }), mat4(x, y - 0.4, z, 0.6, 1.1), null, 'both'); aoAdd(x, z, 4, 0.5); busy.push([x, z, 4]);
  }
  {  // 바위 무더기 — 둥근 바위 여섯이 쌓임(하나는 위에 얹힘)
    const { x, z } = L.boulders, P = [[0, 0, 2.4], [2.6, 1.2, 1.9], [-2.3, 0.9, 1.7], [0.8, -2.4, 1.6], [-1.2, -1.9, 1.3], [1.4, 0.4, 1.4, 2.5]];
    P.forEach((p, k) => { const y = TG.at(x + p[0], z + p[1]); B.put(ROCK_BIG[k % 3], mat4(x + p[0], y + (p[3] || 0) - p[2] * 0.25, z + p[1], k * 1.7, p[2], p[2] * 0.85, p[2]), tintOf(k + 30, 0.07), 'both'); });
    aoAdd(x, z, 7, 0.9); busy.push([x, z, 5.5]);
  }
  busy.push([CRASH[0], CRASH[1], CRASH_R + 3]);
  await NT.breathe();

  /* ── 단서 ── */
  const o = {}, clueList = [];
  const sidePt = (s, side, off) => { NT.polyAt(pathPts, s, o); const px = -o.dz, pz = o.dx; return { x: o.x + px * side * off, z: o.z + pz * side * off, dx: o.dx, dz: o.dz, cx: o.x, cz: o.z }; };   // 오른쪽 = (−dz, dx)(걷기와 같음) · 안쪽(길 쪽) = side·(dz, −dx)
  const hwAt = (x, z) => -D.at(x, z);
  CLUES.forEach((c, n) => {
    const k = 3000 + n * 17;
    if (c.kind === 'broken') {
      const p0 = sidePt(c.s, c.side, 0), w = hwAt(p0.x, p0.z) + 1.1, p = sidePt(c.s, c.side, w), y = TG.at(p.x, p.z), h = 1.4 + c.high * 4.5;
      B.put(NT.brokenFirGeo(k, h), mat4(p.x, y - 0.1, p.z, hash(k, 1) * TAU, 1, 1, 1), tintOf(k, 0.08), 'both');
      const fy = Math.atan2(p.dx, p.dz) - c.side * (0.55 + hash(k, 2) * 0.3), top = 12 - h;          // 윗동은 드래곤이 간 쪽 + 바깥으로 쓰러짐
      B.put(FIR[(n * 5) % 6], matLay(p.x + Math.sin(fy) * 0.3, y + Math.min(h, 2.2) * 0.45, p.z + Math.cos(fy) * 0.3, fy, top / 12 * 0.95, 0.08 + c.high * 0.12, (hash(k, 3) - 0.5) * 0.6), null, 'both');
      B.put(CHIPS[n % 2], mat4(p.x - p.dx * 0.5, TG.at(p.x, p.z) - 0.02, p.z - p.dz * 0.5, hash(k, 4) * TAU), null, 'near');
      B.put(CHIPS[(n + 1) % 2], mat4(p0.x * 0.4 + p.x * 0.6, TG.at(p0.x * 0.4 + p.x * 0.6, p0.z * 0.4 + p.z * 0.6) - 0.02, p0.z * 0.4 + p.z * 0.6, hash(k, 5) * TAU, 0.7), null, 'near');
      if (c.high > 0.5) for (let b = 0; b < 3; b++) {                                                  // 우듬지에서 떨어진 가지
        const bx = p.x + c.side * (1.2 + b * 0.9) * p.dz + p.dx * (b - 1) * 1.6, bz = p.z - c.side * (1.2 + b * 0.9) * p.dx + p.dz * (b - 1) * 1.6, by = TG.at(bx, bz);
        const bm = new NT.Mesher(); NT.tube(bm, [[0, 0.06, 0, 0.05, C3(0x4a3b30)], [0.5, 0.12, 0.2, 0.035, C3(0x4a3b30)], [1.1, 0.08, 0.5, 0.02, C3(0x5d4b3b)]], 3);
        B.put(bm.done(), mat4(bx, by, bz, hash(k, 6 + b) * TAU), null, 'near');
        B.put(FERN[b % 4], mat4(bx + 0.6, by + 0.1, bz, hash(k, 9 + b) * TAU, 0.55, 0.45, 0.55, 1.2, 0.2), [0.85, 0.9, 0.8], 'near');   // 꺾여 누운 잔가지 잎
      }
      aoAdd(p.x, p.z, 2.4, 0.4);
      clueList.push({ kind: 'broken', x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +y.toFixed(2), yaw: +fy.toFixed(3) });
      busy.push([p.x, p.z, 2.2]);
    } else if (c.kind === 'scorch') {
      const p0 = sidePt(c.s, c.side, 0), w = hwAt(p0.x, p0.z), p = sidePt(c.s, c.side, w + 0.7), y = TG.at(p.x, p.z);
      scorchSpots.push({ x: p.x + c.side * p.dz * 1.4, z: p.z - c.side * p.dx * 1.4, r: 3.4 }, { x: p.x + c.side * p.dz * 2.6 + p.dx * 2.2, z: p.z - c.side * p.dx * 2.6 + p.dz * 2.2, r: 1.6 });
      const sp = scorchPaint(p.x + c.side * p.dz * 1.8, p.z - c.side * p.dx * 1.8, 3.6);
      if (n % 2) rock(p.x, p.z, 1.5, k, { paint: sp, sy: 0.95 });                                    // 그을린 바위(길 쪽 낯이 검게)
      else fir(p.x - c.side * p.dz * 0.4, p.z + c.side * p.dx * 0.4, 0.8, k, { paint: scorchPaint(p.x + c.side * p.dz * 2.2, p.z - c.side * p.dx * 2.2, 5.2, 5.5) });   // 밑동·아래 치마가 그을린 나무
      for (let f = 0; f < 7; f++) { const fx = p.x + c.side * p.dz * (0.8 + hash(k, f, 1) * 2.4) + p.dx * (hash(k, f, 2) - 0.5) * 4, fz = p.z - c.side * p.dx * (0.8 + hash(k, f, 1) * 2.4) + p.dz * (hash(k, f, 2) - 0.5) * 4; fern(fx, fz, 0.7 + hash(k, f) * 0.35, k + f, true); }
      for (let f = 0; f < 4; f++) { const bx = p.x + c.side * p.dz * (1 + f * 0.6) + p.dx * (f - 1.5), bz = p.z - c.side * p.dx * (1 + f * 0.6) + p.dz * (f - 1.5), bm = new NT.Mesher(), CH = C3(0x161412), a = hash(k, f, 3) * TAU, L = 0.8 + hash(k, f, 4) * 0.9; NT.tube(bm, [[0, 0.05, 0, 0.05, CH], [Math.cos(a) * L, 0.08, Math.sin(a) * L, 0.03, C3(0x2a2420)]], 4); B.put(bm.done(), mat4(bx, TG.at(bx, bz), bz), null, 'near'); }   // 숯이 된 잔가지
      clueList.push({ kind: 'scorch', x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +y.toFixed(2), yaw: +Math.atan2(c.side * p.dz, -c.side * p.dx).toFixed(3) });
      busy.push([p.x, p.z, 2]);
    } else {
      const p = sidePt(c.s, 0, 0), y = height(p.x, p.z);
      clueList.push({ kind: 'furrow', x: +p.x.toFixed(2), z: +p.z.toFixed(2), y: +y.toFixed(2), yaw: +Math.atan2(p.dx, p.dz).toFixed(3) });
    }
  });
  furrow.build(B, TG, scorchSpots);                               // 고랑 띠 + 흙덩이

  /* ── 떨어진 자리(crash) — 움푹 팬 땅 · 둘레로 쓰러진 나무 · 꺾인 밑동 · 그을음 · 볼라 끈이 걸린 바위 ── */
  const crashYaw = 1.75, CR = { x: CRASH[0] + 5.6, z: CRASH[1] - 3.6 };
  {
    const fwd = crashFront;
    [-1.55, -0.95, -0.35, 0.3, 0.9, 1.45, 2.2].forEach((da, k) => {           // 쓰러진 나무 — 바깥으로 누움(드래곤이 온 반대쪽은 비움 = 다가가는 길)
      const a = fwd + da, r0 = 9.5 + hash(k, 41) * 2, x = CRASH[0] + Math.sin(a) * r0, z = CRASH[1] + Math.cos(a) * r0, y = TG.at(x, z), s = 0.75 + hash(k, 42) * 0.3;
      const fa = a + (hash(k, 43) - 0.5) * 0.4, tl = 9 * s, ty = TG.at(x + Math.sin(fa) * tl * 0.75, z + Math.cos(fa) * tl * 0.75), pitch = -Math.atan2(ty - y, tl * 0.75);
      B.put(FALLEN[k % 3], mat4(x, y - 0.2, z, fa, s, s, s, pitch, (hash(k, 44) - 0.5) * 0.1), tintOf(k + 50, 0.08), 'both');   // 뿌리째 뽑혀 바깥으로 누운 나무(비탈 따라)
      logBlock(x, z, a, 9 * s, 0.6);
      aoAdd(x + Math.sin(a) * 4, z + Math.cos(a) * 4, 4, 0.3);
    });
    [[-0.5, 13.5], [0.6, 14], [1.9, 13], [-2.4, 12.5], [2.8, 15]].forEach(([da, r0], k) => {   // 꺾인 밑동
      const a = fwd + da, x = CRASH[0] + Math.sin(a) * r0, z = CRASH[1] + Math.cos(a) * r0;
      B.put(NT.stumpGeo(4200 + k, { h: 1.2 + hash(k, 45) * 2.2, r: 0.34, broken: true }), mat4(x, TG.at(x, z), z, hash(k, 46) * TAU), null, 'near');
      if (D.at(x, z) < 0.4) blockers.push({ x: +x.toFixed(2), z: +z.toFixed(2), r: 0.45 });
    });
    scorchSpots.push({ x: CRASH[0] + 1, z: CRASH[1] + 1.5, r: 5.5 }, { x: CRASH[0] - 4, z: CRASH[1] - 3, r: 2.4 }, { x: CR.x - 1.2, z: CR.z + 0.6, r: 2.2 });
    const y = TG.at(CR.x, CR.z);
    B.put(ROCK_BIG[1], mat4(CR.x, y - 0.4, CR.z, 0.9, 2.1, 1.9, 1.8), [0.95, 0.95, 0.92], 'both', scorchPaint(CR.x - 2.2, CR.z + 1.6, 2.6));
    blockers.push({ x: +CR.x.toFixed(2), z: +CR.z.toFixed(2), r: 1.9 });
    for (let k = 0; k < 9; k++) { const a = hash(k, 51) * TAU, r = 2 + hash(k, 52) * 8, x = CRASH[0] + Math.sin(a) * r, z = CRASH[1] + Math.cos(a) * r; B.put(ROCK[k % 5], mat4(x, TG.at(x, z) - 0.05, z, a, 0.28 + hash(k, 53) * 0.3, 0.25, 0.3), [0.6, 0.5, 0.42], 'near'); }   // 튄 흙덩이
    B.put(CHIPS[1], mat4(CRASH[0] - 2, TG.at(CRASH[0] - 2, CRASH[1] + 5) - 0.02, CRASH[1] + 5, 0.3, 1.6), null, 'near');
  }
  await NT.breathe();

  /* ── 숲 채우기 — 6m 칸마다 흔들어 한 그루(길 가장자리 = 빽빽 · 깊은 숲 = 성김) ── */
  let nTree = 0;
  const CELL = 6;
  for (let gz = X0 + 3; gz < -X0 - 2; gz += CELL) for (let gx = X0 + 3; gx < -X0 - 2; gx += CELL) {
    const k = ((gx + 500) * 1000 + gz + 500) | 0, x = gx + (hash(k, 1) - 0.5) * CELL * 0.9, z = gz + (hash(k, 2) - 0.5) * CELL * 0.9;
    const d = D.at(x, z), ds = SD.at(x, z), rr = Math.hypot(x + 10, z - 15);
    if (d < 1.4 || ds < 3.4 || rr > 172 || !free(x, z, 1.2)) continue;
    const p = d < 4 ? 0.85 : d < 22 ? 0.66 : 0.46; if (hash(k, 3) > p) continue;
    const nearStream = ds < 13, sp = hash(k, 4);
    if (sp < (nearStream ? 0.26 : 0.06)) birch(x, z, 0.75 + hash(k, 5) * 0.45, k);
    else if (sp > 0.975) B.put(DEADS[k % 2], mat4(x, TG.at(x, z) - 0.3, z, hash(k, 6) * TAU, 0.8 + hash(k, 7) * 0.4), null, 'both');
    else { const s = d < 4 ? 0.5 + hash(k, 5) * 0.4 : 0.78 + hash(k, 5) * 0.55; fir(x, z, s, k, { mid: d > 7 }); }
    nTree++;
  }
  /* 길 가장자리 띠 — 어린 전나무·덤불·고사리가 '여기는 못 지나감'을 그림으로 · 걷는 곳 안쪽 가장자리는 고사리가 살짝 넘어옴 */
  const edge = (pts, k0) => {
    for (let s = 0, k = k0; s < pts.length; s += 1, k++) {
      const p = pts[s], q = pts[Math.min(pts.length - 1, s + 1)], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1, px = dz / l, pz = -dx / l;
      for (const side of [-1, 1]) {
        const w = -D.at(p[0], p[1]);
        for (const [off, kind] of [[w - 0.6, 'f0'], [w + 0.7, 'f1'], [w + 2.2, 'b'], [w + 3.6, 't']]) {
          const kk = k * 7 + (side > 0 ? 3 : 0) + off * 10 | 0, x = p[0] + px * side * off + (hash(kk, 1) - 0.5) * 0.8, z = p[1] + pz * side * off + (hash(kk, 2) - 0.5) * 0.8;
          const d = D.at(x, z); if (SD.at(x, z) < 2.6 || !free(x, z, 0.5)) continue;
          if (kind === 'f0') { if (hash(kk, 3) < 0.45 && d > -1.2) fern(x, z, 0.7 + hash(kk, 4) * 0.4, kk); }
          else if (kind === 'f1') { if (hash(kk, 3) < 0.75 && d > 0) fern(x, z, 0.9 + hash(kk, 4) * 0.5, kk); }
          else if (kind === 'b') { if (s % 3 === 0 && hash(kk, 3) < 0.7 && d > 0.8) { B.put(BUSH[kk % 3], mat4(x, TG.at(x, z) - 0.15, z, hash(kk, 4) * TAU, 1.1 + hash(kk, 5) * 0.7, 0.9 + hash(kk, 6) * 0.5, 1.1 + hash(kk, 7) * 0.6), tintOf(kk, 0.1), 'near'); aoAdd(x, z, 2, 0.3); } }
          else if (s % 4 === (side > 0 ? 1 : 3) && d > 1.8 && hash(kk, 3) < 0.6) fir(x, z, 0.38 + hash(kk, 4) * 0.3, kk);
        }
      }
    }
  };
  edge(truePts, 10000); wrongPts.forEach((P, w) => edge(P, 20000 + w * 3000));
  /* 흩어진 것 — 고사리·풀·바위·통나무 */
  for (let k = 0; k < 5200; k++) {
    const x = X0 + 6 + hash(k, 91) * (-2 * X0 - 12), z = X0 + 6 + hash(k, 92) * (-2 * X0 - 12), d = D.at(x, z), ds = SD.at(x, z);
    if (ds < 2.4 || Math.hypot(x + 10, z - 15) > 168) continue;
    const r = hash(k, 93);
    if (d < -0.8) { if (r < 0.32 && free(x, z, 0.3)) B.put(r < 0.1 ? GRASS_Y : GRASS[k % 3], mat4(x, TG.at(x, z), z, hash(k, 94) * TAU, 0.8 + hash(k, 95) * 0.6), null, 'near'); else if (r > 0.985 && free(x, z, 0.4)) fern(x, z, 0.6, k); }
    else if (d < 26) { if (r < 0.26 && free(x, z, 0.5)) fern(x, z, 0.75 + hash(k, 95) * 0.55, k); else if (r > 0.9 && free(x, z, 0.8)) { const q = 0.45 + hash(k, 96) * 0.5; B.put(CUSH[k % 3], mat4(x, TG.at(x, z), z, hash(k, 97) * TAU, q, 1, q * 0.8), null, 'near'); } else if (r < 0.3 && free(x, z, 0.8)) rock(x, z, 0.45 + hash(k, 96) * 0.9, k); else if (r < 0.314 && d > 2 && free(x, z, 3)) logAt(x, z, hash(k, 97) * TAU, k, 0.8 + hash(k, 98) * 0.4); else if (r < 0.33 && free(x, z, 0.6)) { B.put(STUMP[k % 2], mat4(x, TG.at(x, z), z, hash(k, 97) * TAU, 0.8 + hash(k, 98) * 0.6), null, 'near'); if (hash(k, 99) < 0.5) B.put(SHROOM[k % 3], mat4(x + 0.45, TG.at(x + 0.45, z), z, hash(k, 98) * TAU, 1.1), null, 'near'); } }
    else if (r < 0.06 && free(x, z, 1)) rock(x, z, 0.8 + hash(k, 96) * 1.4, k);
  }
  /* 길 바닥 — 이끼·풀 포기(밟혀 낮음) · 걸을 때 발밑이 밋밋하지 않게 */
  [truePts, ...wrongPts].forEach((P2, w) => P2.forEach((p, k) => {
    for (let e = 0; e < 3; e++) {
      const kk = w * 100000 + k * 3 + e, a = hash(kk, 81) * TAU, r = Math.sqrt(hash(kk, 82)) * 4.2, x = p[0] + Math.cos(a) * r, z = p[1] + Math.sin(a) * r;
      if (D.at(x, z) > -0.4 || SD.at(x, z) < 2.2 || !free(x, z, 0.3)) continue;
      if (hash(kk, 87) < 0.3 && D.at(x, z) > -1.8) { const r = 0.35 + hash(kk, 88) * 0.45; B.put(CUSH[kk % 3], mat4(x, TG.at(x, z), z, hash(kk, 84) * TAU, r, 0.8 + hash(kk, 89) * 0.6, r * (0.7 + hash(kk, 90) * 0.5)), null, 'near'); continue; }
      B.put(hash(kk, 83) < 0.25 ? GRASS_Y : GRASS[kk % 3], mat4(x, TG.at(x, z), z, hash(kk, 84) * TAU, 0.6 + hash(kk, 85) * 0.5, 0.5 + hash(kk, 86) * 0.4, 0.6 + hash(kk, 85) * 0.5), null, 'near');
    }
  }));
  /* 개울가 — 이끼 바위 · 여울 디딤돌 */
  for (let k = 0; k < sPts.length; k += 2) {
    const p = sPts[k], q = sPts[Math.min(sPts.length - 1, k + 1)], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
    for (const side of [-1, 1]) if (hash(k, side + 5) < 0.4) { const off = 2.4 + hash(k, side + 7) * 1.2, x = p[0] + dz / l * side * off, z = p[1] - dx / l * side * off; if (D.at(x, z) > 0.5 || Math.hypot(x - cross[0], z - cross[1]) > 7) rock(x, z, 0.4 + hash(k, side + 9) * 0.5, k * 3 + side + 2, { sy: 0.8 }); }
  }
  {  // 디딤돌(여울 옆 · 걷는 데엔 걸리지 않음)
    const p = cross, i = nearestIdx(sPts, p), q = sPts[Math.min(sPts.length - 1, i + 1)], dx = q[0] - sPts[i][0], dz = q[1] - sPts[i][1], l = Math.hypot(dx, dz) || 1;
    for (let k = -2; k <= 2; k++) { const x = p[0] + dz / l * k * 0.9 + dx / l * 2.2, z = p[1] - dx / l * k * 0.9 + dz / l * 2.2; B.put(ROCK[k + 2], mat4(x, SB.at(x, z) + 0.22, z, k, 0.42, 0.3, 0.5), [0.9, 0.92, 0.88], 'near'); }
  }
  /* 걷는 곳 안의 큰 바위·나무 = 원기둥 장애물(나무·바위 뚫림 방지) */
  await NT.breathe();

  const fp = sidePt(FIN_S, 1, 1.1); fern(fp.x + 0.5, fp.z + 0.3, 0.6, 7777);   // 꼬리날개 조각이 걸린 고사리

  /* ── 땅 색(정점색) — 바늘잎 흙 · 이끼 · 길(밟힌 흙) · 개울가 젖은 흙 · 벼랑 바위 · 떨어진 자리 · 그을음 · 나무 그늘 ── */
  const LITTER = C3(0x8a6a3e), ASH = C3(0x6e6a62), NEEDLE = C3(0x5b4b39), NEEDLE2 = C3(0x4a3d2f), MOSSG = C3(0x55683c), MOSSG2 = C3(0x6b7c45), TRAIL = C3(0x5e4f3c), TRAIL2 = C3(0x6a6040), WET = C3(0x3b372b), ROCKC = C3(0x6f6f68), TORN = C3(0x3a2b1f), BLACK = C3(0x1b1815), GRASSC = C3(0x6e8044);
  const nrm = [0, 0, 0], t1 = [0, 0, 0];
  B.ground(TG, (x, y, z, i, j, c) => {
    const w = N.v2(x * 0.09, z * 0.09), w2 = N2.v2(x * 0.03 + 4, z * 0.03), d = D.at(x, z), ds = SD.at(x, z);
    const sp = hash(i, j, 5), w3 = N.v2(x * 0.35 + 7, z * 0.35);
    mixc(NEEDLE, NEEDLE2, w * 0.7 + w3 * 0.3, c); mixc(c, mixc(MOSSG, MOSSG2, w2, t1), sstep(0.35, 0.75, w2 + (w - 0.5) * 0.4), c);
    if (sp > 0.82) mixc(c, LITTER, (sp - 0.82) * 3.5, c); else if (sp < 0.1) mixc(c, NEEDLE2, 0.5, c);   // 낙엽·솔잎 점
    const tr = sstep(1.5, -1.5, d); if (tr > 0) mixc(c, mixc(TRAIL, GRASSC, sstep(0.25, 0.75, w3 * 0.6 + w * 0.4), t1), tr * 0.6, c);
    if (ds < 5) mixc(c, WET, sstep(5, 1.5, ds) * 0.75, c);
    TG.normal(i, j, nrm); const st = sstep(0.82, 0.62, nrm[1]); if (st > 0) mixc(c, ROCKC, st * 0.85, c);
    const rc = Math.hypot(x - CRASH[0], z - CRASH[1]); if (rc < 12) mixc(c, TORN, sstep(12, 5, rc) * 0.85, c);
    for (const s of scorchSpots) { const dd = Math.hypot(x - s.x, z - s.z); if (dd < s.r + 0.9) { if (dd > s.r * 0.85) mixc(c, ASH, sstep(s.r + 0.9, s.r, dd) * 0.5 * (0.6 + sp * 0.8), c); mixc(c, BLACK, sstep(s.r, s.r * 0.35, dd) * (0.78 + sp * 0.2), c); } }   // 검은 그을음 + 가장자리 잿빛
    const ao = Math.min(1, AO[j * NX2 + i]); c[0] *= 1 - ao * 0.42; c[1] *= 1 - ao * 0.4; c[2] *= 1 - ao * 0.36;
  }, null, 3);                                                    // 먼 판 = 3m 땅 + 가장자리 치마(틈 가림)
  const meshes = B.build(group, time === 'fog' ? 70 : 82);

  /* ── 개울 물 · 꼬리날개 조각 ── */
  const wm = NT.waterMat(time === 'fog' ? { deep: 0x2c3e3a, shallow: 0x52665e, edge: 0x9aa8a0, sky: TIMES.fog.mid } : { deep: 0x2a4440, shallow: 0x5a7a70, edge: 0xa8b8ae, sky: TIMES[time].mid });
  const sLen = NT.polyLen(sPts), sAcc = []; { let a = 0; sAcc.push(0); for (let k = 1; k < sPts.length; k++) { a += Math.hypot(sPts[k][0] - sPts[k - 1][0], sPts[k][1] - sPts[k - 1][1]); sAcc.push(a); } }
  const sBedAt = (s) => { let k = 0; while (k < sAcc.length - 2 && sAcc[k + 1] < s) k++; const u = clamp((s - sAcc[k]) / ((sAcc[k + 1] - sAcc[k]) || 1), 0, 1); return sBed[k] + (sBed[k + 1] - sBed[k]) * u; };
  const water = new THREE.Mesh(NT.streamGeo(sPts, (s) => sBedAt(s) + 0.4, () => 2.0, 0.9), wm);
  water.matrixAutoUpdate = false; group.add(water);
  const finM = new THREE.Mesh(toGeo(NT.finGeo()), toon({ vc: true }));
  const fy = TG.at(fp.x, fp.z);
  finM.position.set(fp.x, fy + 0.06, fp.z); finM.rotation.set(-0.28, 2.3, 0.18, 'YXZ'); finM.updateMatrix(); finM.matrixAutoUpdate = false; group.add(finM);

  /* ── 벽 선분(1m 마칭 스퀘어) · 경계 ── */
  const walls = NT.contourWalls(D.h, X0, X0, S1, NX1, NX1);
  /* 걷는 곳 안에 박힌 장애물(바위·큰 나무) — 위에서 넣은 것 + 바위 무더기 가장자리 */

  /* ── 이름 자리 · 목록 ── */
  const P = (x, z, yaw = 0) => ({ x: +x.toFixed(2), y: yAt(x, z), z: +z.toFixed(2), yaw: +yaw.toFixed(4) });
  const sp0 = TRUE_CTRL[SPAWN_I], sp1 = pathPts[8];
  const anchors = {
    spawn: P(sp0[0], sp0[1], Math.atan2(sp1[0] - sp0[0], sp1[1] - sp0[1])),
    crash: P(CRASH[0], CRASH[1], crashYaw),
    crash_rock: P(CR.x, CR.z, Math.atan2(CRASH[0] - CR.x, CRASH[1] - CR.z)),
    fin: Object.assign(P(fp.x, fp.z, Math.atan2(fp.dx, fp.dz)), { show: (on) => { finM.visible = !!on; } }),
  };
  const landmarks = LAND.map((l) => {
    const out = { kind: l.kind, x: l.x, z: l.z, r: l.r, label: l.label };
    if (l.kind === 'stream') out.pts = NT.resample(sPts, 6).map((p) => [+p[0].toFixed(1), +p[1].toFixed(1)]);
    if (l.kind === 'cliff') { out.pts = []; for (let z = -40; z <= 66; z += 6) out.pts.push([+cliffX(z).toFixed(1), z]); }
    return out;
  });
  const lists = {
    clues: clueList,
    landmarks,
    decoys: WRONG_CTRL.map((c) => { const e = c[c.length - 1]; return { x: e[0], y: yAt(e[0], e[1]), z: e[1] }; }),
    forks: forks.map((f, i) => ({ x: f[0], y: yAt(f[0], f[1]), z: f[1], i, s: +NT.polyLen(pathPts.slice(0, nearestIdx(pathPts, f) + 1)).toFixed(1) })),
  };
  const benchPts = NT.resample(pathPts, 1);
  const mapPath = NT.resample(pathPts, 4).map((p) => [+p[0].toFixed(1), +p[1].toFixed(1)]);
  const mapTrails = wrongPts.map((P2) => NT.resample(P2, 4).map((p) => [+p[0].toFixed(1), +p[1].toFixed(1)]));
  const tmpV = new THREE.Vector3();
  const info = { buildMs: Math.round(performance.now() - T0), trees: nTree, walls: walls.length, blockers: blockers.length, tris: Math.round(B.tris), chunks: meshes.length, pathLen: +pathLen.toFixed(1) };

  return {
    name: 'forest',
    group, height: (x, z) => height(x, z), blockers, walls,
    bound: { x: -15, z: 20, r: 112 },
    anchors, lists, info,
    fin: finM,
    mapSketch: () => ({ bounds: { x0: -72, x1: 44, z0: -84, z1: 112 }, north: '-z', path: mapPath, trails: mapTrails, landmarks, start: [anchors.spawn.x, anchors.spawn.z], end: [anchors.crash.x, anchors.crash.z] }),
    step() {},
    draw() {},
    dispose() { if (env.sea) env.sea.visible = true; },
    benchPath(t) {                                    // 60초 — 참 길을 스폰부터 떨어진 자리까지 걸음 높이로
      const s = clamp(t / 60, 0, 1) * (pathLen - 4), c = ctx.camera;
      NT.polyAt(benchPts, s, o); const x = o.x, z = o.z; NT.polyAt(benchPts, Math.min(pathLen, s + 7), o);
      c.position.set(x, height(x, z) + 2.3, z); tmpV.set(o.x, height(o.x, o.z) + 1.4, o.z); c.lookAt(tmpV);
    },
  };
}

function forkWiden(p, forks) { let w = 0; for (const f of forks) { const d = Math.hypot(p[0] - f[0], p[1] - f[1]); if (d < 9) w = Math.max(w, (1 - d / 9) * 1.6); } return w; }
function nearestIdx(pts, q) { let b = 0, bd = 1e9; pts.forEach((p, k) => { const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; if (d < bd) { bd = d; b = k; } }); return b; }
function crossing(A, Bp) { let best = 1e9, out = A[0]; for (const a of A) for (const b of Bp) { const d = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2; if (d < best) { best = d; out = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; } } return out; }
function toGeo(g) {
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(g.pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(g.nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(g.col, 3)); G.setIndex(new THREE.BufferAttribute(g.idx, 1)); G.computeBoundingSphere(); return G;
}

/* 파인 땅 고랑 — 참 길 끝 26m(떨어진 자리로 들어가는 길)을 따라 가운데는 검은 흙 · 양옆은 밀려 올라온 둑 */
function makeFurrow(pathPts, pathLen) {
  const s0 = pathLen - 27, s1 = pathLen - 6, o = {}, line = [];
  for (let s = s0; s <= s1; s += 0.8) { NT.polyAt(pathPts, s, o); const wig = Math.sin(s * 0.35) * 0.35 + 0.5; line.push([o.x - o.dz * wig, o.z + o.dx * wig]); }
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of line) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  x0 -= 3; x1 += 3; z0 -= 3; z1 += 3;
  const st = 0.25, nx = Math.ceil((x1 - x0) / st) + 1, nz = Math.ceil((z1 - z0) / st) + 1, G = NT.createGrid(x0, z0, st, nx, nz), q = {};
  const prof = (off, t) => { const w = 0.85 + 0.35 * Math.sin(t * Math.PI), a = Math.abs(off); return 0.5 * Math.exp(-(((a - w) / 0.32) ** 2)) * Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.5 + 0.2) - 0.06 * sstep(w * 0.7, 0, a); };
  G.fill((x, z) => { const d = NT.polyDist(line, x, z, q); if (d > 2.2) return 0; const t = q.t / (line.length - 1); return Math.max(0, prof(d, t)) * sstep(0, 0.06, t) * sstep(1, 0.88, t); });
  const C = NT.createGrid(x0, z0, st, nx, nz).fill((x, z) => { const d = NT.polyDist(line, x, z, q); if (d > 1.6) return 0; const t = q.t / (line.length - 1); return -0.6 * sstep(1.35, 0.2, d) * sstep(0, 0.12, t) * sstep(1, 0.85, t); });   // 가운데 홈(드래곤 배가 밀고 간 자리)
  return {
    carve: (x, z) => (x < x0 || x > x1 || z < z0 || z > z1 ? 0 : C.at(x, z)),
    bump: (x, z) => (x < x0 || x > x1 || z < z0 || z > z1 ? 0 : G.at(x, z)),
    build(B, TG) {                                    // 가로 9점 띠 · 0.6m마다
      const M = new NT.Mesher(), SOIL = C3(0x33261b), BERM = C3(0x56432f), FLECK = C3(0x5a6b3e), L = NT.polyLen(line), n = Math.ceil(L / 0.6), offs = [-1.9, -1.35, -0.95, -0.55, 0, 0.55, 0.95, 1.35, 1.9], pp = {};
      for (let k = 0; k <= n; k++) {
        NT.polyAt(line, k / n * L, pp); const t = k / n;
        for (const of of offs) {
          const x = pp.x - pp.dz * of, z = pp.z + pp.dx * of, a = Math.abs(of), edge = a > 1.8;
          const y = TG.at(x, z) + (edge ? -0.05 : G.at(x, z) + 0.03);
          const c = a < 0.6 ? SOIL : mixc(BERM, FLECK, hash(k, Math.round(of * 10)) > 0.7 ? 0.6 : 0.1);
          M.v(x, y, z, edge ? mixc(BERM, C3(0x5b4b39), 0.7) : t < 0.05 || t > 0.95 ? mixc(c, BERM, 0.5) : c);
        }
      }
      for (let k = 0; k < n; k++) for (let e = 0; e < 8; e++) { const a = k * 9 + e, b = a + 1, c = a + 9, d = c + 1; M.quad(a, b, d, c); }
      const g = M.done(); NT.polyAt(line, L / 2, pp);
      B.put(g, new THREE.Matrix4(), null, 'near', null, pp.x, pp.z);
      const CLOD = [0, 1, 2].map((q) => NT.rockGeo(4300 + q, { flat: 0.55, moss: 0.25, detail: 0 }));
      for (let k = 0; k < 18; k++) { const s = hash(k, 61) * L, side = hash(k, 62) > 0.5 ? 1 : -1; NT.polyAt(line, s, pp); const of = side * (0.7 + hash(k, 63) ** 2 * 2.4), x = pp.x - pp.dz * of + (hash(k, 65) - 0.5), z = pp.z + pp.dx * of + (hash(k, 66) - 0.5), r = 0.12 + hash(k, 64) ** 2 * 0.35; B.put(CLOD[k % 3], mat4(x, TG.at(x, z) + G.at(x, z) * 0.7 - r * 0.3, z, k, r, r * 0.8, r * 1.2), [0.52, 0.38, 0.27], 'near'); }   // 튄 흙덩이(갈색 · 들쭉날쭉)
    },
  };
}
