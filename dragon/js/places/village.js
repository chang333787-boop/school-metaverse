// 버크 마을(W1 · 단계 3) — 바다 위 가파른 비탈 끝 나무 마을 · 늘 새로 고쳐 짓는 집 · 앞이 트인 대장간 · 벼랑 끝 망루 · 선착장(큰 배 둘 + 고기잡이배)
//   큰 회관 정면(산을 파고 든 집) · 훈련장 가는 다리 · 숲 울타리 문 · 양 우리 — 계약 = docs/dragon/stage3_plan.md §2·§3 village
// 우리 섬 · 우리 배치(영화 화면을 베끼지 않음) · 때 overcast / sleet / night(횃불·창 켜짐) / dawn / day · variant 'charred' = 1장 뒤 아침(그을린 지붕 + 덧댄 새 판자)
// 걷기: height = 겹(계단·다리·선착장·망루 위) 먼저, 아니면 땅 격자(그린 삼각형과 같은 보간) · 벽 = 집·대장간·울타리 + '걸을 수 있는 칸' 등고선(절벽·둑·물가·산 밑)
import * as THREE from 'three';
import { setTime } from '../look/kit.js?v=15';
import { createNoise } from '../core/noise.js?v=15';
import { createProps, M4, PAL, ss, inPoly } from '../look/props.js?v=15';

const X0 = -150, Z0 = -150, CS = 2.0, NX = 146, NZ = 126;           // 땅 격자(마디) — x −150~140 · z −150~100
const capD = (x, z, ax, az, bx, bz) => { const ex = bx - ax, ez = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez))); return Math.hypot(x - ax - ex * t, z - az - ez * t); };
const segD = (x, z, s) => capD(x, z, s[0], s[1], s[2], s[3]);

/* 길(가운데 선 · 폭) — 광장에서 회관 계단 · 망루 · 대장간 → 선착장 길머리 · 서쪽 다리 · 히컵 집 → 양 우리 · 숲 문 · 남쪽 벼랑 망대 · 굽이굽이(곧은 바퀴살 X) */
const STREETS = [
  { w: 3.6, p: [[0, -48], [3, -39], [1, -29], [-2.5, -19], [1, -9], [0, 0]] },
  { w: 3.0, p: [[0, 0], [-5, 8], [-11, 16], [-20, 23], [-30, 29], [-40, 35]] },
  { w: 3.0, p: [[6, 4], [14, 8.5], [26, 10.5], [38, 9]] },
  { w: 2.8, p: [[-4, -3], [-14, -5], [-26, -10], [-41, -9], [-57, -13], [-75, -12]] },
  { w: 2.4, p: [[-2, -16], [-11, -19], [-20, -24], [-28, -33], [-36, -41], [-40, -46]] },
  { w: 2.6, p: [[1, -31], [13, -34], [26, -41], [40, -46], [54, -54], [65, -58], [72, -61]] },
  { w: 2.2, p: [[5, 9], [9, 18], [13, 27], [18, 35], [20, 41]] },
  { w: 2.0, p: [[-26, -10], [-30, 2], [-27, 13], [-20, 23]] },
  { w: 2.0, p: [[26, -41], [28, -26], [24, -12], [26, 10.5]] },
];
const SEGS = []; for (const s of STREETS) for (let i = 0; i < s.p.length - 1; i++) SEGS.push([s.p[i][0], s.p[i][1], s.p[i + 1][0], s.p[i + 1][1], s.w]);
const pal = (x, z) => (108 - 46) * (z + 90) - (-36 + 90) * (x - 46);   // 숲 울타리 A(46,−90) → B(108,−36) · < 0 = 숲 쪽(다른 장소)

/* 집 배치 — 히컵 집만 손으로, 나머지는 길을 따라 양옆에 씨앗 난수로 세움(겹침·길·해안·급경사·특별 구역을 피함 · 같은 집 복사 X) */
const SPECIAL = [{ id: 'hiccup', x: -33, z: -27, w: 6.2, d: 8.6, kind: 'log', roof: 'shingle', extras: ['wood', 'barrels'], shields: 1, two: true, hw2: 4.3, face: 4 }];
const KEEP = [{ x: 0, z: 0, r: 15 }, { x: 24, z: -2, hx: 9, hz: 8.5 }, { x: 0, z: -72, hx: 30, hz: 18 }, { x: 0, z: -56, hx: 7, hz: 11 }, { x: -46, z: 41, r: 18 }, { x: -44, z: -50, r: 10 },
  { x: 52, z: 15, hx: 15, hz: 11 }, { x: 70, z: 25, hx: 9, hz: 22 }, { x: -72, z: -12, r: 9 }, { x: 74, z: -60, r: 10 }, { x: 2, z: 44, hx: 26, hz: 6 }, { x: 31, z: 37.5, r: 6 }, { x: 10.5, z: 6.5, r: 4 }];

export async function buildPlace(ctx) {
  const { group, env, camera, rng, opt = {} } = ctx;
  const time = opt.time || 'overcast', charred = opt.variant === 'charred';
  const N = createNoise(31);

  /* ── 땅 높이 ── 섬(타원) − 남동 만(선착장) − 서쪽 물길(다리 아래) · 북쪽으로 오르막 · 회관 뒤는 산 */
  const coastD = (x, z) => {
    const rx = x < 0 ? 140 : 112, e = Math.hypot(x / rx, (z + 38) / 100);
    let d = (1 - e) * 95;
    d = Math.min(d, Math.hypot(x - 108, z - 24) - 36);
    d = Math.min(d, capD(x, z, -90, -72, -90, 45) - 8.5);
    return d + (N.fbm(x * 0.018 + 4, z * 0.018 - 2, 3) - 0.5) * 12 * (0.25 + 0.75 * ss(16, 40, Math.hypot(x - 74, z - 24)));
  };
  const plateau = (x, z) => {
    const up = Math.max(0, 52 - z);
    let h = 9 + up * 0.27 + Math.min(1, up / 30) * 0.0009 * x * x - Math.max(0, x - 30) * 0.1 * ss(-40, 10, z);
    const m = Math.max(0, -88 - z), raw = m * m * 0.09 + m * 1.4; h += 150 * (1 - Math.exp(-raw / 150)) + (m > 0 ? (N.fbm(x * 0.02 + 9, z * 0.02, 4) - 0.5) * m * 0.9 : 0);
    return h + (N.fbm(x * 0.022, z * 0.022, 3) - 0.5) * 3.2 + (N.v2(x * 0.08 + 2, z * 0.08) - 0.5) * 0.6;
  };
  const base = (x, z) => {
    const d = coastD(x, z), hp = plateau(x, z);
    let h = -7 + (hp + 7) * ss(-1, 6.5, d);
    if (d > -2 && d < 9) h += (N.v2(x * 0.21 + 3, z * 0.21 + h * 0.08) - 0.5) * 3.2 * Math.max(0, 1 - Math.abs(d - 3.5) / 5.5);   // 절벽이 들쭉날쭉
    const sd = capD(x, z, 72.5, 8, 69.5, 41) - 4.6 - (N.v2(x * 0.18 + 5, z * 0.18) - 0.5) * 4; if (sd < 3.5) { const sh = -7 + 9.8 * ss(3.5, 0.4, sd) + (N.v2(x * 0.7, z * 0.7) - 0.5) * 0.3, core = ss(0.6, -1.4, sd); h = Math.max(h, sh) * (1 - core) + sh * core; }   /* 선착장 바위 턱(높이 2.8) · 안쪽은 절벽 노이즈 없이 평평 */
    return h;
  };
  /* 집 세우기(길 따라) */
  const HOUSES = [], FP = [];
  const rectHit = (A, B, gap) => {               // 두 돌린 사각형이 gap 안으로 가까운지(분리축)
    const ax = [[Math.cos(A.yaw), -Math.sin(A.yaw)], [Math.sin(A.yaw), Math.cos(A.yaw)], [Math.cos(B.yaw), -Math.sin(B.yaw)], [Math.sin(B.yaw), Math.cos(B.yaw)]];
    for (const [ux, uz] of ax) { const pr = (R) => Math.abs(Math.cos(R.yaw) * ux - Math.sin(R.yaw) * uz) * R.hx + Math.abs(Math.sin(R.yaw) * ux + Math.cos(R.yaw) * uz) * R.hz; if (Math.abs((B.x - A.x) * ux + (B.z - A.z) * uz) > pr(A) + pr(B) + gap) return false; }
    return true;
  };
  const keepHit = (F) => KEEP.some((k) => k.r ? Math.hypot(F.x - k.x, F.z - k.z) < k.r + Math.max(F.hx, F.hz) : rectHit(F, { x: k.x, z: k.z, yaw: 0, hx: k.hx, hz: k.hz }, 0));
  const streetHit = (F, m) => { const c = Math.cos(F.yaw), s2 = Math.sin(F.yaw); for (const [a2, b2] of [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1], [0, 1], [0, -1], [1, 0], [-1, 0]]) { const x = F.x + a2 * F.hx * c + b2 * F.hz * s2, z = F.z - a2 * F.hx * s2 + b2 * F.hz * c; for (const sg of SEGS) if (segD(x, z, sg) < sg[4] / 2 + m) return true; } return false; };
  const slopeBad = (F) => { const c = Math.cos(F.yaw), s2 = Math.sin(F.yaw), h0 = base(F.x, F.z); let mx = 0; for (const [a2, b2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) mx = Math.max(mx, Math.abs(base(F.x + a2 * F.hx * c + b2 * F.hz * s2, F.z - a2 * F.hx * s2 + b2 * F.hz * c) - h0)); return mx; };
  const tryHouse = (H) => {
    const F = { x: H.x, z: H.z, yaw: H.yaw, hx: H.w / 2 + 0.9 + ((H.extras || []).includes('wood') ? 0.9 : 0), hz: H.d / 2 + 0.9 };
    if (!H.id) { if (coastD(H.x, H.z) < 11 + Math.max(H.w, H.d) / 2 || H.z < -84 || pal(H.x, H.z) < 700 || Math.hypot(H.x, H.z + 14) > 112 || keepHit(F) || streetHit(F, 0.9) || FP.some((G) => rectHit(F, G, 1.2))) return false;
      const sl = slopeBad(F); if (sl > 3.4) return false; if (sl > 1.7) H.stilts = rng() < 0.6; }
    HOUSES.push(H); FP.push(F); return true;
  };
  for (const H of SPECIAL) { let best = 1e9; for (const sg of SEGS) { const ex = sg[2] - sg[0], ez = sg[3] - sg[1], t = Math.max(0, Math.min(1, ((H.x - sg[0]) * ex + (H.z - sg[1]) * ez) / (ex * ex + ez * ez))), px = sg[0] + ex * t, pz = sg[1] + ez * t, d = Math.hypot(H.x - px, H.z - pz); if (d < best) { best = d; H.yaw = Math.atan2(px - H.x, pz - H.z); } } tryHouse(H); }
  for (const st of STREETS) {
    for (let i = 0; i < st.p.length - 1; i++) {
      const [ax, az] = st.p[i], [bx, bz] = st.p[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      for (let s0 = 4 + rng() * 4; s0 < L - 3; s0 += 8.5 + rng() * 4) for (const side of [-1, 1]) {
        if (rng() < 0.2) continue;
        const w = 5.6 + rng() * 2.0, d = 7.6 + rng() * 3.4, back = st.w / 2 + 1.8 + rng() * 1.6 + d / 2, nx = uz * side, nz = -ux * side;
        const H = { x: ax + ux * s0 + nx * back, z: az + uz * s0 + nz * back, yaw: Math.atan2(-nx, -nz) + (rng() - 0.5) * 0.24, w, d,
          kind: rng() < 0.55 ? 'log' : 'stave', roof: ['shingle', 'shingle', 'turf', 'paint', 'shingle', 'turf'][Math.floor(rng() * 6)], paint: [0x8a3d2d, 0x3f5a73, 0x93713a, 0x4c6347, 0x6e3b4a][Math.floor(rng() * 5)],
          extras: ['wood', 'barrels', 'crates', 'vent'].filter(() => rng() < 0.38), two: rng() < 0.16 };
        if (H.two) H.hw2 = 4.1 + rng() * 0.4; else H.hw = 2.5 + rng() * 0.6;
        tryHouse(H);
      }
    }
  }
  /* 뒷골목 집(길에서 한 걸음 들어간 자리 · 가까운 길을 봄) — 빈 풀밭을 채움 */
  for (let k = 0; k < 500 && HOUSES.length < 21; k++) {
    const x = -68 + rng() * 140, z = -80 + rng() * 118; let best = 1e9, yaw = 0;
    for (const sg of SEGS) { const ex = sg[2] - sg[0], ez = sg[3] - sg[1], t = Math.max(0, Math.min(1, ((x - sg[0]) * ex + (z - sg[1]) * ez) / (ex * ex + ez * ez))), px = sg[0] + ex * t, pz = sg[1] + ez * t, d = Math.hypot(x - px, z - pz); if (d < best) { best = d; yaw = Math.atan2(px - x, pz - z); } }
    if (best > 24) continue;
    const H = { x, z, yaw: yaw + (rng() - 0.5) * 0.4, w: 5.2 + rng() * 1.8, d: 7.2 + rng() * 2.8, kind: rng() < 0.5 ? 'log' : 'stave', roof: ['shingle', 'turf', 'shingle', 'paint'][Math.floor(rng() * 4)], paint: [0x8a3d2d, 0x3f5a73, 0x93713a, 0x6e3b4a][Math.floor(rng() * 4)], extras: ['wood', 'barrels', 'crates'].filter(() => rng() < 0.35), hw: 2.4 + rng() * 0.5 };
    tryHouse(H);
  }
  { let nb = 0, nr = 0; for (const H of HOUSES) { if (H.id) continue; const dc = Math.hypot(H.x, H.z); if (nb < 5 && dc < 42) { H.burn = 0.85 + rng() * 0.15; nb++; } else if (nr < 2 && dc > 30 && rng() < 0.3) { H.rebuild = true; nr++; } } }

  /* 평평하게 고른 자리(집터·광장·회관 마당·대장간) — 둘레는 soft m에 걸쳐 원래 땅으로 */
  const PADS = [{ x: 0, z: 0, r: 12, soft: 11, tilt: true }, { x: 0, z: -77, hx: 27, hz: 11, soft: 3.2, h: 47 }, { x: 24, z: -2, hx: 7.5, hz: 6.5, yaw: 0, soft: 8 }, { x: -44, z: -50, r: 8, soft: 7 }];
  for (const H of HOUSES) PADS.push({ x: H.x, z: H.z, hx: H.w / 2 + 1.2, hz: H.d / 2 + 1.4, yaw: H.yaw, soft: 5.5, house: H });
  /* 고른 높이 = 둘레 여덟 점 평균(가운데 한 점이면 둔덕·구덩이가 생김) */
  for (const p of PADS) if (p.h == null) { const R = p.r || Math.max(p.hx, p.hz); let s = base(p.x, p.z) * 2; for (let k = 0; k < 8; k++) s += base(p.x + Math.cos(k * 0.785) * R, p.z + Math.sin(k * 0.785) * R); p.h = s / 10; if (p.tilt) { p.gx = (base(p.x + R, p.z) - base(p.x - R, p.z)) / (2 * R) * 0.6; p.gz = (base(p.x, p.z + R) - base(p.x, p.z - R)) / (2 * R) * 0.6; } }
  const padK = (p, x, z) => {
    let d;
    if (p.r) d = Math.hypot(x - p.x, z - p.z) - p.r;
    else { const c = Math.cos(p.yaw || 0), s = Math.sin(p.yaw || 0), lx = (x - p.x) * c - (z - p.z) * s, lz = (x - p.x) * s + (z - p.z) * c, qx = Math.abs(lx) - p.hx, qz = Math.abs(lz) - p.hz; d = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0); }
    return ss(p.soft, 0, d);
  };
  const padH = (p, x, z) => (p.tilt ? p.h + (p.gx || 0) * (x - p.x) + (p.gz || 0) * (z - p.z) : p.h);
  /* 선착장 길(배 끄는 내리막 · 땅을 파 내려감) */
  const TR = [[38, 9, null], [52, 14, 12.5], [63, 20, 6.5], [71, 24.5, 2.9]];
  const trench = (x, z, h) => {
    let best = 1e9, th = 0;
    for (let i = 0; i < TR.length - 1; i++) {
      const [ax, az, ah0] = TR[i], [bx, bz, bh] = TR[i + 1], ex = bx - ax, ez = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez))), d = Math.hypot(x - ax - ex * t, z - az - ez * t);
      if (d < best) { best = d; const ah = ah0 ?? TR0H; th = ah + (bh - ah) * t; }
    }
    if (best > 8.5) return h;
    const k = ss(8, 3.6, best), road = th + (best > 3.6 ? (best - 3.6) * 0.15 : 0);   // 바닥 반폭 3.6m(격자 2m에서도 걸을 길이 남게)
    if (best < 3.6) return road;                                                   // 길 바닥은 늘 길 높이(낮은 데는 돋움 · 절벽 밑 물가 이음)
    return road < h ? h + (road - h) * k : h;
  };
  let TR0H = 0;
  const terrainH = (x, z) => {
    let h = base(x, z);
    for (let i = 0; i < PADS.length; i++) { const p = PADS[i]; if (Math.abs(x - p.x) > 40 || Math.abs(z - p.z) > 40) continue; const k = padK(p, x, z); if (k > 0) h += (padH(p, x, z) - h) * k; }
    return trench(x, z, h);
  };
  TR0H = base(38, 9); for (const p of PADS) if (Math.abs(p.x - 38) < 10 && Math.abs(p.z - 9) < 10) TR0H = p.h;

  /* 땅 격자 */
  const HG = new Float32Array(NX * NZ);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) HG[j * NX + i] = terrainH(X0 + i * CS, Z0 + j * CS);
  const gridH = (x, z) => {
    const fx = (x - X0) / CS, fz = (z - Z0) / CS, i = Math.max(0, Math.min(NX - 2, Math.floor(fx))), j = Math.max(0, Math.min(NZ - 2, Math.floor(fz))), u = Math.min(1, Math.max(0, fx - i)), v = Math.min(1, Math.max(0, fz - j));
    const a = HG[j * NX + i], b = HG[j * NX + i + 1], c = HG[(j + 1) * NX + i], d = HG[(j + 1) * NX + i + 1];
    return u + v <= 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v);
  };
  const P = createProps(rng, { seed: 41, chunk: 48, ground: gridH });
  P.frost = time === 'sleet' ? 0.55 : 0;
  const walls = [], blockers = [], LAYERS = [], anchors = {}, lists = { torches: [], npc: [], patched: [] };
  const ships = [], smokeSpots = [];                                 // 배(물결 따라 흔들림) · 굴뚝 연기 자리
  const TB = {}; let tLast = 0; const mk = (k) => { TB[k] = Math.round((P.tris - tLast) / 1000) + 'k'; tLast = P.tris; };   // 삼각형 나눠 세기(stats)
  const A = (name, x, z, yaw = 0, y) => { anchors[name] = { x, y: y ?? gridH(x, z), z, yaw }; };
  const addLayer = (L) => {
    const xs = [], zs = [];
    if (L.poly) for (const [x, z] of L.poly) { xs.push(x); zs.push(z); } else { xs.push(L.ax, L.bx); zs.push(L.az, L.bz); }
    const pad = (L.hw || 0) + 1; L.bx0 = Math.min(...xs) - pad; L.bx1 = Math.max(...xs) + pad; L.bz0 = Math.min(...zs) - pad; L.bz1 = Math.max(...zs) + pad;
    LAYERS.push(L); if (L.walls) walls.push(...L.walls); return L;
  };
  const height = (x, z) => {
    for (let i = 0; i < LAYERS.length; i++) { const L = LAYERS[i]; if (x < L.bx0 || x > L.bx1 || z < L.bz0 || z > L.bz1) continue; const h = P.layerH(L, x, z); if (h != null) return h; }
    return gridH(x, z);
  };

  /* ── 땅 그리기(청크마다 한 조각 · 정점색: 풀·길·바위 결·절벽 층·물가) ── */
  const streetD = (x, z) => { let d = 1e9; for (const s of SEGS) { if (Math.abs(x - s[0]) > 60 && Math.abs(x - s[2]) > 60) continue; const q = segD(x, z, s) - s[4] / 2; if (q < d) d = q; } return d; };
  const nrmAt = (i, j, out) => { const a = HG[j * NX + Math.max(0, i - 1)], b = HG[j * NX + Math.min(NX - 1, i + 1)], c = HG[Math.max(0, j - 1) * NX + i], d = HG[Math.min(NZ - 1, j + 1) * NX + i]; out.set(a - b, 2 * CS, c - d).normalize(); return out; };
  const nv = new THREE.Vector3(), cc = new THREE.Color(), c2 = new THREE.Color();
  const COL = new Float32Array(NX * NZ * 3), NOR = new Float32Array(NX * NZ * 3);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x = X0 + i * CS, z = Z0 + j * CS, k = j * NX + i, y = HG[k]; nrmAt(i, j, nv);
    const n1 = N.fbm(x * 0.05 + 7, z * 0.05, 3), n2 = N.v2(x * 0.31, z * 0.31), steep = 1 - ss(0.6, 0.86, nv.y);
    cc.setHex(PAL.grass[0]).lerp(c2.setHex(PAL.grass[1]), n1).lerp(c2.setHex(PAL.grass[3]), ss(0.55, 0.8, n2) * 0.5).lerp(c2.setHex(PAL.grass[2]), ss(0.4, 0.15, n1) * 0.6);
    const sd = streetD(x, z) + (n2 - 0.5) * 1.1;
    if (sd < 1.2) cc.lerp(c2.setHex(n1 > 0.5 ? PAL.dirt2 : PAL.dirt), ss(1.2, -0.4, sd) * 0.95);
    if (sd < -0.3 && N.v2(x * 0.4 + 30, z * 0.4) > 0.72) cc.lerp(c2.setHex(PAL.mud), 0.6);
    for (const p of PADS) { if (Math.abs(x - p.x) > 22 || Math.abs(z - p.z) > 22) continue; const q = padK(p, x, z); if (q > 0.3) cc.lerp(c2.setHex(p === PADS[2] ? 0x4a3c30 : p === PADS[0] ? PAL.dirt2 : 0x6f6a4a), (q - 0.3) * (p.house ? 0.45 : 0.85)); }
    if (Math.abs(x) < 26 && z < -65 && z > -89) cc.lerp(c2.setHex(0x8a877c), 0.55 * ss(-64, -67, z));                    // 회관 마당 돌바닥
    const tr = capD(x, z, 38, 9, 71, 24.5); if (tr < 3) cc.lerp(c2.setHex(PAL.dirt), ss(3, 1.5, tr) * 0.9);
    const strata = 0.85 + 0.15 * Math.sin(y * 1.7 + n1 * 4);
    if (steep > 0) cc.lerp(c2.setHex(n2 > 0.5 ? PAL.rock : PAL.rock2).multiplyScalar(strata), steep);
    if (y < 3.6 && steep < 0.6) cc.lerp(c2.setHex(n2 > 0.55 ? 0x8a8070 : n2 > 0.3 ? 0x6e6a60 : 0x5a5650), ss(3.6, 2.2, y) * 0.9);
    if (y < 2.2) cc.lerp(c2.setHex(0x4a4a44), ss(2.2, 0.4, y));
    if (y > 70) cc.lerp(c2.setHex(0x80807a), ss(70, 95, y) * 0.6);
    if (y > 118) cc.lerp(c2.setHex(0xe4e8ea), ss(118, 135, y + (n1 - 0.5) * 30) * (1 - steep * 0.6));
    if (time === 'sleet' && steep < 0.5 && y > 3) cc.lerp(c2.setHex(0xc8ced0), ss(0.45, 0.75, N.v2(x * 0.09 + 3, z * 0.09)) * 0.55);   // 진눈깨비 쌓인 얼룩
    cc.multiplyScalar(0.9 + n2 * 0.16);
    COL[k * 3] = cc.r; COL[k * 3 + 1] = cc.g; COL[k * 3 + 2] = cc.b; NOR[k * 3] = nv.x; NOR[k * 3 + 1] = nv.y; NOR[k * 3 + 2] = nv.z;
  }
  const TILE = 24;
  for (let tj = 0; tj < NZ - 1; tj += TILE) for (let ti = 0; ti < NX - 1; ti += TILE) {
    const pos = [], nor = [], col = [];
    const pushV = (i, j) => { const k = j * NX + i; pos.push(X0 + i * CS, HG[k], Z0 + j * CS); nor.push(NOR[k * 3], NOR[k * 3 + 1], NOR[k * 3 + 2]); col.push(COL[k * 3], COL[k * 3 + 1], COL[k * 3 + 2]); };
    for (let j = tj; j < Math.min(NZ - 1, tj + TILE); j++) for (let i = ti; i < Math.min(NX - 1, ti + TILE); i++) {
      const a = HG[j * NX + i], b = HG[j * NX + i + 1], c = HG[(j + 1) * NX + i], d = HG[(j + 1) * NX + i + 1];
      if (a < -3 && b < -3 && c < -3 && d < -3) continue;
      pushV(i, j); pushV(i, j + 1); pushV(i + 1, j); pushV(i + 1, j); pushV(i, j + 1); pushV(i + 1, j + 1);
    }
    if (!pos.length) continue;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    P.addRaw(g);
  }

  mk('땅');
  /* ── 큰 회관 정면(산을 파고 든 집) + 돌계단 + 화로 둘 ── */
  {
    const HZ = -76, Y = 47, w = 24, d = 18, hw = 7.2, M = M4(0, Y, HZ - d / 2, 0), Mx = (a, b, c, yy = 0, p = 0, r = 0) => new THREE.Matrix4().multiplyMatrices(M, M4(a, b, c, yy, p, r));
    P.plinth(M, w + 1.2, d + 1.0, 0.05, -2.5);
    const n = Math.round(w / 0.42);
    for (let i = 0; i < n; i++) { const lx = -w / 2 + (i + 0.5) * w / n; if (Math.abs(lx) < 2.6) continue; P.box(Mx(lx, hw / 2, d / 2), w / n - 0.02, hw, 0.16, P.pWood(P.vary(0x5e4430, 0.14)), { jit: 0.008 }); }
    for (const sx of [-1, 1]) for (let i = 0, m = Math.round(d / 0.42); i < m; i++) P.box(Mx(sx * w / 2, hw / 2, -d / 2 + (i + 0.5) * d / m), 0.16, hw, d / m - 0.02, P.pWood(P.vary(0x5a4130, 0.14)), { jit: 0.008 });
    for (const [cx, cz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const a = new THREE.Vector3(cx * w / 2, 0, cz * d / 2).applyMatrix4(M); P.log(a.x, a.y - 0.2, a.z, a.x, a.y + hw + 0.3, a.z, 0.38, 0x4a3527, { seg: 9 }); }
    for (const y of [0.3, hw - 0.25]) { const a = new THREE.Vector3(-w / 2 - 0.3, y, d / 2 + 0.12).applyMatrix4(M), b = new THREE.Vector3(w / 2 + 0.3, y, d / 2 + 0.12).applyMatrix4(M); P.beam(a.x, a.y, a.z, b.x, b.y, b.z, 0.36, 0.36, 0x4a3527); }
    const roof = P.roof(Mx(0, hw, 0), { w: w + 0.4, d, H: 12.5, ohE: 1.6, ohG: 1.2, sag: 0.6, up: 1.1, p: 1.5, kind: 'shingle', hex: [0x4a382d, 0x544034, 0x3e3129], t: 0.35, cu: 0.6, cell: 0.95, row: 0.75 });
    for (let i = 0, m = Math.round((w + 0.4) / 0.42); i < m; i++) { const lx = -(w + 0.4) / 2 + (i + 0.5) * (w + 0.4) / m, top = roof.at(lx, d / 2) - roof.t - 0.05; if (top < 0.2) continue; P.box(Mx(lx, hw + top / 2 - 0.1, d / 2 + 0.04), (w + 0.4) / m - 0.02, top + 0.2, 0.14, P.pWood(P.vary(0x654a35, 0.15)), { jit: 0.008 }); }
    P.gableDeco(Mx(0, hw, d / 2 + roof.L / 2 - d / 2 - 0.06), roof, 1, { k: 2.4, hex: 0x3e2c20 });
    P.shield(Mx(0, hw + 5.2, d / 2 + 0.25), 1.6, { cols: [0x9e3a2c, 0xc9a13d], pat: 2 });
    for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) P.shield(Mx(sx * (w / 2 + 0.2), 3.4 + (i % 2) * 0.25, d / 2 - 1.6 - i * 2.1, sx * Math.PI / 2), 0.6);
    /* 큰 두짝 문 + 깎은 문틀 + 처마 달린 현관 */
    for (const sx of [-1, 1]) P.door(Mx(sx * 1.25, 0, d / 2 + 0.1, 0), 2.4, 5.4, { hex: 0x553b29, frame: 0x3e2c20 });
    for (const sx of [-1, 1]) { const a = new THREE.Vector3(sx * 3.4, 0, d / 2 + 2.6).applyMatrix4(M); P.log(a.x, a.y - 0.2, a.z, a.x, a.y + 6.3, a.z, 0.3, 0x4a3527, { seg: 8 });
      for (let k = 0; k < 4; k++) P.put(new THREE.TorusGeometry(0.33, 0.06, 4, 10).rotateX(Math.PI / 2), M4(a.x, a.y + 1.2 + k * 1.3, a.z), P.pWood(0x3e2c20), { ao: false }); }
    P.roof(Mx(0, 6.1, d / 2 + 1.8, Math.PI / 2), { w: 2.6, d: 7.8, H: 1.3, ohE: 0.6, ohG: 0.4, sag: 0.1, up: 0.3, kind: 'shingle', hex: [0x4a382d, 0x544034], t: 0.2 });
    for (const sx of [-1, 1]) { const a = new THREE.Vector3(sx * 3.4, 6.1, d / 2 + 2.6).applyMatrix4(M), b = new THREE.Vector3(sx * 3.4, 6.1, d / 2 + 0.2).applyMatrix4(M); P.beam(a.x, a.y, a.z, b.x, b.y, b.z, 0.3, 0.3, 0x4a3527); }
    /* 현수막 둘 */
    for (const sx of [-1, 1]) P.cloth(1.6, 4.2, Mx(sx * 6.5 - 0.8, hw - 0.4, d / 2 + 0.3, 0, 0, 0), (c, lx, ly, lz, wx, wy) => { const b = ly < -3.4 || Math.abs(lx - 0.8) < 0.15; c.setHex(b ? PAL.yel : 0x7e2f25).multiplyScalar(0.9 + 0.1 * N.v2(wx, wy)); }, { amp: 0.05 });
    /* 회관 = 벽(정면 + 옆 · 뒤는 산) · 계단 · 마당 화로 */
    walls.push([-w / 2 - 0.6, HZ + 0.6, w / 2 + 0.6, HZ + 0.6], [-w / 2 - 0.6, HZ + 0.6, -w / 2 - 0.6, HZ - d], [w / 2 + 0.6, HZ + 0.6, w / 2 + 0.6, HZ - d]);
    blockers.push({ x: -3.4, z: HZ + 2.6, r: 0.4 }, { x: 3.4, z: HZ + 2.6, r: 0.4 });
    A('hall_door', 0, HZ + 3.6, Math.PI, Y);
    const st = P.stairs(0, gridH(0, -48.5) + 0.05, -48.5, 0, Y, -65.4, 8, { stone: true });
    addLayer(st); A('hall_stairs', 0, -46.2, Math.PI);
    lists.npc.push({ x: -2.8, z: -45.4, yaw: 0.6, kind: 'talk' }, { x: 2.6, z: -44.8, yaw: -2.4, kind: 'talk' }, { x: 5.5, z: -69, yaw: Math.PI, kind: 'idle' });
    for (const sx of [-1, 1]) {   // 계단 위 큰 화로(돌기둥 + 쇠 그릇)
      const x = sx * 6.2, z = -67.2; P.box(M4(x, Y + 0.7, z), 1.2, 1.4, 1.2, P.pStone(PAL.stone[0]), { sx: 2, sy: 2, sz: 2, flat: true, jit: 0.05, facet: true });
      P.put(new THREE.CylinderGeometry(0.9, 0.5, 0.6, 9, 1, true).translate(0, 0.3, 0), M4(x, Y + 1.4, z), P.pIron(), { mat: 'd', ao: false });
      const T = P.torch(group, x, Y + 1.25, z, { noPost: true, s: 0.01, flame: 1.7, glow: 9, op: 0.6 }); T.always = true; lists.torches.push(T);
      blockers.push({ x, z, r: 0.95 });
    }
    /* 마당 앞 돌 축대(계단 양옆) */
    for (let x = -27; x <= 27; x += 1.5) { if (Math.abs(x) < 5) continue; const z = -64.6 + Math.sin(x * 0.7) * 0.15, g = gridH(x, z + 1.6) - 0.6, top = Y + 0.45, hh = top - g; if (hh < 0.6) continue;
      P.box(M4(x, top - hh / 2, z, (rng() - 0.5) * 0.05), 1.55, hh, 1.1, P.pStone(P.pick(PAL.stone), { moss: 0.5 }), { sy: Math.max(1, Math.min(3, Math.round(hh / 1.2))), flat: true, jit: 0.07, facet: true }); }
  }

  mk('회관');
  /* ── 집들 ── */
  const housesOut = [];
  for (const H of HOUSES) {
    const pad = PADS.find((p) => p.house === H), floor = pad.h + (H.stilts ? 1.2 : 0.35);
    const r = P.house(group, { ...H, floor, char: charred ? H.burn || 0 : 0, rebuild: H.rebuild, hw: H.hw2 || H.hw });
    walls.push(...r.walls); housesOut.push({ H, r, floor });
    if (H.id === 'hiccup') A('house_hiccup', r.door.x, r.door.z, r.door.yaw);
  }
  /* 덧댄 새 판자 자리(1장 뒤) — 그을린 집 지붕·벽마다 둘 */
  for (const { H, r } of housesOut) {
    if (!H.burn) continue;
    for (const [lx, fz] of [[H.w * 0.22, 0.02], [-H.w * 0.18, -0.28]]) {
      const lz = fz * H.d, u = r.roof.uOf(lz), v = r.roof.vOf(lx, u), ly = (H.hw || 2.7) + r.roof.Y(u, v) + 0.06, p = new THREE.Vector3(lx, ly, lz).applyMatrix4(r.M);
      const slope = Math.atan2(r.roof.Y(u, Math.min(1, v + 0.05)) - r.roof.Y(u, v), r.roof.X(u, Math.min(1, v + 0.05)) - r.roof.X(u, v));
      lists.patched.push({ x: p.x, y: p.y, z: p.z, yaw: H.yaw, house: HOUSES.indexOf(H) });
      if (charred) for (let k = 0; k < 3; k++) {
        const M = new THREE.Matrix4().multiplyMatrices(r.M, M4(lx, ly + 0.02 + k * 0.03, lz - 0.6 + k * 0.6, 0, 0, Math.sign(lx) * slope + (rng() - 0.5) * 0.15));
        P.box(M, 1.6 + rng() * 0.5, 0.06, 0.32, P.pWood(P.vary(PAL.fresh, 0.15)), { ao: false });
      }
    }
  }

  mk('집');
  /* ── 대장간(앞이 트인 지붕 집 · 화로·모루·풀무·숫돌·도구 벽 · 뒷방 작업대) ── 로컬 +Z = 앞(광장 쪽 서쪽) */
  {
    const fx = 24, fz = -2, yaw = -Math.PI / 2, Y = PADS[2].h, w = 9.2, d = 12, hw = 3.4, M = M4(fx, Y, fz, yaw);
    const W = (a, b, c) => new THREE.Vector3(a, b, c).applyMatrix4(M), Mx = (a, b, c, yy = 0, p = 0, r = 0) => new THREE.Matrix4().multiplyMatrices(M, M4(a, b, c, yy, p, r));
    const wl = (ax, az, bx, bz) => { const a = W(ax, 0, az), b = W(bx, 0, bz); walls.push([a.x, a.z, b.x, b.z]); };
    P.plinth(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0, -d / 2)), w + 0.8, 0.9, 0.12, -1.2); for (const sx of [-1, 1]) P.plinth(new THREE.Matrix4().multiplyMatrices(M, M4(sx * w / 2, 0, -d * 0.19)), 0.8, d * 0.62 + 0.4, 0.12, -1.2);
    /* 뒷벽(아래 돌 + 위 통나무) · 옆벽(뒤 2/3만) · 앞 굵은 기둥 셋 */
    P.box(Mx(0, 0.75, -d / 2), w + 0.4, 1.5, 0.6, P.pStone(PAL.stone[1]), { sx: 6, sy: 2, flat: true, jit: 0.06, facet: true });
    for (let k = 0; k < 6; k++) { const y = 1.7 + k * 0.34, a = W(-w / 2 - 0.3, y, -d / 2), b = W(w / 2 + 0.3, y, -d / 2); P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.18, P.vary(0x5a3f2c, 0.12)); }
    for (const sx of [-1, 1]) for (let k = 0; k < 9; k++) { const y = 0.2 + k * 0.35, a = W(sx * w / 2, y, -d / 2 - 0.3), b = W(sx * w / 2, y, d * 0.12); P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.18, P.vary(0x5e4330, 0.12), { char: 0.15 }); }
    for (const lx of [-w / 2, 0.0, w / 2]) { const a = W(lx, 0, d / 2 - 0.2); P.log(a.x, a.y - 0.2, a.z, a.x, a.y + hw + 0.2, a.z, 0.26, 0x4a3527, { seg: 8 }); blockers.push({ x: a.x, z: a.z, r: 0.32 }); }
    for (const lx of [-w / 2, w / 2]) { const a = W(lx, 0, d * 0.12); P.log(a.x, a.y - 0.2, a.z, a.x, a.y + hw + 0.2, a.z, 0.22, 0x4a3527, { seg: 8 }); }
    { const a = W(-w / 2 - 0.4, hw, d / 2 - 0.2), b = W(w / 2 + 0.4, hw, d / 2 - 0.2); P.beam(a.x, a.y, a.z, b.x, b.y, b.z, 0.4, 0.4, 0x4a3527); }
    for (const sx of [-1, 1]) { const a = W(sx * w / 2, hw, -d / 2), b = W(sx * w / 2, hw, d / 2 - 0.2); P.beam(a.x, a.y, a.z, b.x, b.y, b.z, 0.3, 0.3, 0x4a3527); }
    const roof = P.roof(Mx(0, hw, 0), { w: w + 0.4, d, H: 4.6, ohE: 0.9, ohG: 0.8, sag: 0.3, up: 0.5, kind: 'shingle', hex: [0x3e3129, 0x4a382d, 0x342a24], t: 0.24, char: 0.25 });
    for (let i = 0, m = Math.round((w + 0.4) / 0.32); i < m; i++) { const lx = -(w + 0.4) / 2 + (i + 0.5) * (w + 0.4) / m, top = roof.at(lx, -d / 2) - roof.t - 0.04; if (top > 0.15) P.box(Mx(lx, hw + top / 2 - 0.05, -d / 2 - 0.02), (w + 0.4) / m - 0.015, top + 0.1, 0.1, P.pWood(P.vary(0x5a4130, 0.15)), { sy: 2 }); }
    for (let i = 0, m = Math.round((w + 0.4) / 0.32); i < m; i++) { const lx = -(w + 0.4) / 2 + (i + 0.5) * (w + 0.4) / m, top = roof.at(lx, d / 2) - roof.t - 0.04; if (top > 0.5) P.box(Mx(lx, hw + 0.2 + (top - 0.2) / 2, d / 2 - 0.15), (w + 0.4) / m - 0.015, top - 0.2, 0.1, P.pWood(P.vary(0x5a4130, 0.15)), { sy: 2 }); }
    P.gableDeco(Mx(0, hw, d / 2 + roof.L / 2 - d / 2 - 0.04), roof, 1, { k: 1.0 });
    P.gableDeco(Mx(0, hw, -(roof.L / 2) + 0.04, Math.PI), roof, 0, { k: 1.0 });
    /* 화로(돌 상자 + 쇠 갓 + 굴뚝) */
    const hx = -w / 2 + 1.6, hz = -d / 2 + 1.5;
    P.box(Mx(hx, 0.55, hz), 2.2, 1.1, 1.8, P.pStone(0x6a645c, { moss: 0 }), { sx: 3, sy: 2, sz: 3, flat: true, jit: 0.05, facet: true });
    P.box(Mx(hx, 1.12, hz + 0.1), 1.6, 0.06, 1.2, P.pFlat(0x2a1a14, 0.1), { ao: false });
    P.put(new THREE.CylinderGeometry(0.35, 1.1, 1.2, 4, 1, true).rotateY(Math.PI / 4), Mx(hx, 2.6, hz), P.pFlat(0x3a3330, 0.1), { mat: 'd', ao: false });
    P.box(Mx(hx, 4.6, hz - 0.3), 0.9, 4.0, 0.9, P.pStone(0x6a645c, { moss: 0.2 }), { sy: 5, flat: true, jit: 0.04, facet: true });
    const fp = W(hx, 1.15, hz + 0.1); P.fire(group, fp.x, fp.y, fp.z, 0.75, { glow: 7, op: 0.7, col: 0xff8a30 });
    blockers.push({ x: W(hx, 0, hz).x, z: W(hx, 0, hz).z, r: 1.35 });
    /* 모루 · 풀무 · 숫돌 · 담금 통 · 도구 벽 · 무기 걸이 */
    const an = W(-0.4, 0, -0.6); P.anvil(Mx(-0.4, 0, -0.6, 0.3)); blockers.push({ x: an.x, z: an.z, r: 0.5 });
    const bl = W(hx + 1.9, 0, hz + 0.1); P.bellows(Mx(hx + 1.5, 0, hz + 0.1, Math.PI)); blockers.push({ x: bl.x, z: bl.z, r: 0.7 });
    const gr = W(w / 2 - 1.4, 0, d / 2 - 2.6); P.grindstone(Mx(w / 2 - 1.4, 0, d / 2 - 2.6, 0)); blockers.push({ x: gr.x, z: gr.z, r: 0.6 });
    const qb = W(0.9, 0, -1.6); P.barrel(qb.x, Y, qb.z, { water: true, h: 0.8 }); blockers.push({ x: qb.x, z: qb.z, r: 0.45 });
    P.rack(Mx(-w / 2 + 0.35, 0.2, 1.4, Math.PI / 2), 3.2, { shields: 2 });
    { const a = W(-w / 2 + 0.4, 0, 1.4); blockers.push({ x: a.x, z: a.z, r: 0.3 }); const b = W(-w / 2 + 0.4, 0, -0.2); blockers.push({ x: b.x, z: b.z, r: 0.3 }); const c = W(-w / 2 + 0.4, 0, 3.0); blockers.push({ x: c.x, z: c.z, r: 0.3 }); }
    for (let k = 0; k < 7; k++) P.weapon(Mx(w / 2 - 0.25, 1.1 + (k % 2) * 0.15, -2.2 + k * 0.55, -Math.PI / 2, 0, 0.12), ['hammer', 'axe', 'sword', 'hammer', 'mace', 'axe', 'sword'][k]);
    P.box(Mx(w / 2 - 0.15, 1.5, -0.6), 0.06, 1.5, 4.4, P.pWood(0x6a4f37), { sz: 3 });
    for (let k = 0; k < 3; k++) { const s = W(w / 2 - 1.0, 0, -0.5 + k * 1.1); P.barrel(s.x, Y, s.z, { h: 0.7, r: 0.3 }); }
    { const a = W(w / 2 - 1.0, 0, 0.6); blockers.push({ x: a.x, z: a.z, r: 0.9 }); }
    /* 뒷방(오른쪽 뒤 · 히컵 작업대 · 설계도 붙일 벽) — 칸막이 + 문틈 */
    const rx0 = w / 2 - 3.8, rz1 = -d / 2 + 3.6;
    for (let i = 0, m = 12; i < m; i++) { const lz = -d / 2 + 0.3 + (i + 0.5) * (3.3 / m); P.box(Mx(rx0, 1.3, lz), 0.08, 2.6, 3.3 / m - 0.01, P.pWood(P.vary(0x6a4c34, 0.15))); }
    for (let i = 0, m = 10; i < m; i++) { const lx = rx0 + (i + 0.5) * (3.8 / m); if (lx > rx0 + 1.2 && lx < rx0 + 2.4) continue; P.box(Mx(lx, 1.3, rz1), 3.8 / m - 0.01, 2.6, 0.08, P.pWood(P.vary(0x6a4c34, 0.15))); }
    wl(rx0, -d / 2, rx0, rz1); wl(rx0, rz1, rx0 + 1.2, rz1); wl(rx0 + 2.4, rz1, w / 2, rz1);
    P.box(Mx(w / 2 - 0.7, 0.85, -d / 2 + 1.5), 1.0, 0.08, 2.2, P.pWood(0x7d5f42));
    for (const [a, b] of [[-0.4, -0.95], [0.4, -0.95], [-0.4, 0.95], [0.4, 0.95]]) { const p = W(w / 2 - 0.7 + a, 0, -d / 2 + 1.5 + b); P.log(p.x, p.y, p.z, p.x, p.y + 0.85, p.z, 0.05, 0x5a4230, { seg: 5, ls: 1 }); }
    { const b = W(w / 2 - 0.7, 0, -d / 2 + 1.5); blockers.push({ x: b.x, z: b.z, r: 0.75 }); }
    for (let k = 0; k < 4; k++) P.box(Mx(rx0 + 0.6 + k * 0.75, 1.75 + (k % 2) * 0.2, -d / 2 + 0.37, (rng() - 0.5) * 0.1), 0.55, 0.42, 0.01, P.pFlat(0xd9cdb0, 0.06), { ao: false });   // 벽에 붙인 그림 종이
    P.put(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 6).translate(0, 0.08, 0), Mx(w / 2 - 0.5, 0.89, -d / 2 + 0.7), P.pFlat(0xe6dcc0), { ao: false });
    const cnd = W(w / 2 - 0.5, 1.12, -d / 2 + 0.7); P.fire(group, cnd.x, cnd.y - 0.04, cnd.z, 0.12, { n: 1, glow: 1.4, op: 0.55, col: 0xffb060 });   /* 뒷방 촛불 */
    /* 대장간 벽(뒤 · 옆 뒤 · 앞 트임) */
    wl(-w / 2 - 0.35, -d / 2 - 0.35, w / 2 + 0.35, -d / 2 - 0.35); wl(-w / 2 - 0.35, -d / 2 - 0.35, -w / 2 - 0.35, d * 0.12 + 0.3); wl(w / 2 + 0.35, -d / 2 - 0.35, w / 2 + 0.35, d * 0.12 + 0.3);
    A('forge_front', W(0, 0, d / 2 + 2.0).x, W(0, 0, d / 2 + 2.0).z, yaw + Math.PI);
    A('forge_anvil', W(-0.4, 0, 0.35).x, W(-0.4, 0, 0.35).z, yaw + Math.PI);
    A('forge_bellows', W(hx + 2.0, 0, hz + 1.2).x, W(hx + 2.0, 0, hz + 1.2).z, yaw + Math.PI);
    A('forge_grind', W(w / 2 - 1.4, 0, d / 2 - 1.6).x, W(w / 2 - 1.4, 0, d / 2 - 1.6).z, yaw + Math.PI);
    A('forge_bench', W(w / 2 - 1.75, 0, -d / 2 + 1.5).x, W(w / 2 - 1.75, 0, -d / 2 + 1.5).z, yaw - Math.PI / 2);
    A('forge_wall', W(rx0 + 1.8, 0, -d / 2 + 1.4).x, W(rx0 + 1.8, 0, -d / 2 + 1.4).z, yaw + Math.PI);
    lists.npc.push({ x: W(hx + 0.6, 0, hz + 1.6).x, z: W(hx + 0.6, 0, hz + 1.6).z, yaw: yaw + Math.PI, kind: 'work' }, { x: W(0.6, 0, 0.4).x, z: W(0.6, 0, 0.4).z, yaw: yaw + Math.PI * 0.8, kind: 'work' });
    const cs = W(hx, 6.8, hz - 0.3); smokeSpots.push([cs.x, cs.y, cs.z]);   /* 대장간 굴뚝 연기 */
  }

  mk('대장간');
  /* ── 망루(남서 벼랑 끝) + 계단 ── */
  {
    const tx = -46, tz = 41, yaw = 2.55, top = gridH(tx, tz) + 9.6;
    const T = P.tower(group, tx, tz, yaw, { top, size: 4.6 });
    walls.push(...T.walls); blockers.push(...T.blockers);
    addLayer({ kind: 'flat', poly: T.poly, y: top });
    const hs = 2.3, a = T.W(0, 0, hs + 0.05), L = (top - gridH(a.x, a.z)) * 1.55, b = T.W(0, 0, hs + L);
    const st = P.stairs(b.x, gridH(b.x, b.z), b.z, a.x, top, a.z, 1.5, {});
    addLayer(st); lists.torches.push(T.torch);
    A('tower_base', T.W(0, 0, hs + L + 1.6).x, T.W(0, 0, hs + L + 1.6).z, yaw + Math.PI);
    A('tower_top', T.W(0.3, 0, -0.2).x, T.W(0.3, 0, -0.2).z, yaw + Math.PI, top);
    lists.npc.push({ x: T.W(2.6, 0, hs + L + 0.5).x, z: T.W(2.6, 0, hs + L + 0.5).z, yaw: yaw, kind: 'idle' });
  }

  mk('망루');
  /* ── 선착장 길(내리막 · 가로 통나무 + 울타리 + 횃불) · 바위 턱 · 판 둘 · 큰 배 둘 · 고기잡이배 ── */
  {
    for (let i = 0; i < TR.length - 1; i++) {
      const [ax, az] = TR[i], [bx, bz] = TR[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.floor(L / 1.1);
      for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, ux = (bx - ax) / L, uz = (bz - az) / L, h1 = gridH(x - uz * 1.4, z + ux * 1.4), h2 = gridH(x + uz * 1.4, z - ux * 1.4);
        if (Math.abs(h1 - h2) > 0.4 || i === 0 && t < 0.4) continue; P.log(x - uz * 1.4, h1 + 0.06, z + ux * 1.4, x + uz * 1.4, h2 + 0.06, z - ux * 1.4, 0.12, P.vary(0x5e4834, 0.18), { seg: 6, ls: 1, ao: false }); }
    }
    for (const sd of [-1, 1]) { const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10, i = Math.min(TR.length - 2, Math.floor(t * (TR.length - 1))), f = t * (TR.length - 1) - i, [ax, az] = TR[i], [bx, bz] = TR[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, x = ax + (bx - ax) * f, z = az + (bz - az) * f; pts.push([x - uz * 7.6 * sd, z + ux * 7.6 * sd]); }
      P.fence(pts.slice(1, 8), { hex: 0x5f4a38 }); }
    for (const [x, z] of [[44, 9.5], [58, 13.6], [66, 26.5]]) lists.torches.push(P.torch(group, x, gridH(x, z), z));
    /* 판(널판 길) */
    const DY = 3.15;
    const pa = P.pier(73.2, 15, 101, 15, 3.2, DY), pb = P.pier(72.3, 33, 95, 33.5, 3.2, DY);
    for (const q of [pa, pb]) { walls.push(...q.walls); addLayer({ kind: 'flat', poly: q.poly, y: DY }); }
    for (const [x, z] of [[97, 13.7], [90, 31.8]]) lists.torches.push(P.torch(group, x, DY, z, { h: 2.2 }));
    /* 생선 말리는 시렁 · 그물 · 통 */
    for (const [x, z, yw] of [[69.3, 19.5, -1.66], [68.6, 28.5, -1.66]]) {   /* 절벽 쪽으로 붙여 길을 막지 않게 */ const M = M4(x, gridH(x, z), z, yw); for (const sx of [-1.2, 1.2]) { const p = new THREE.Vector3(sx, 0, 0).applyMatrix4(M); P.log(p.x, p.y - 0.2, p.z, p.x, p.y + 1.9, p.z, 0.06, 0x5a4230, { seg: 5, ls: 1 }); }
      const a = new THREE.Vector3(-1.3, 1.8, 0).applyMatrix4(M), b = new THREE.Vector3(1.3, 1.8, 0).applyMatrix4(M); P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.04, 0x5a4230, { seg: 4, ls: 1 });
      for (let k = 0; k < 6; k++) { const FM = new THREE.Matrix4().multiplyMatrices(M, M4(-1.0 + k * 0.4, 1.5, 0, 0, 0, (rng() - 0.5) * 0.2)); P.put(new THREE.SphereGeometry(1, 6, 4).scale(0.07, 0.24, 0.03), FM, P.pFlat(k % 2 ? 0x8a9496 : 0x9a8a70, 0.15), { ao: false }); P.put(new THREE.ConeGeometry(0.07, 0.12, 3).scale(1, 1, 0.3), new THREE.Matrix4().multiplyMatrices(FM, M4(0, -0.27, 0)), P.pFlat(0x6a7072), { ao: false }); }
      blockers.push({ x, z, r: 1.3 }); }
    for (const [x, z] of [[72.5, 37.5], [73.6, 38.4], [72, 11.5]]) { P.barrel(x, gridH(x, z) - 0.05, z, { h: 0.85, r: 0.36 }); blockers.push({ x, z, r: 0.45 }); }
    P.crate(70.5, gridH(70.5, 36), 36, 0.8, 0.4); blockers.push({ x: 70.5, z: 36, r: 0.6 });
    /* 큰 배 둘 + 작은 고기잡이배(물결 따라 흔들림 = 따로 묶음) */
    ships.push(
      { name: 'ship1', x: 87.5, z: 10.2, yaw: Math.PI / 2, o: { L: 19, B: 4.6, D: 1.9, sheer: 1.5, head: true, shields: true, mast: true, mastH: 9.5, sailCols: [PAL.cloth, PAL.red], top: PAL.red } },
      { name: 'ship2', x: 84.5, z: 38.2, yaw: Math.PI / 2 + 0.06, o: { L: 17, B: 4.3, D: 1.8, sheer: 1.4, head: true, shields: true, mast: true, mastH: 8.8, sailCols: [PAL.cloth, PAL.blue], top: PAL.blue, billow: 0.25, sailH: 2.2 } },
      { name: 'boat', x: 79, z: 24.5, yaw: Math.PI / 2 - 0.15, o: { L: 6.4, B: 2.0, D: 0.85, sheer: 0.55, ns: 14, nt: 5, top: 0x6a5444, strake: [0x7a5e44, 0x6a5038] } },
    );
    const g0 = P.ground; P.ground = null;   // 배는 원점에서 지음(땅 그늘 X)
    for (const S of ships) {
      P.bin = S.name;
      const hm = P.hull(M4(0, 0, 0, 0), S.o);
      if (S.name === 'boat') { P.put(new THREE.TorusGeometry(0.4, 0.12, 5, 10).rotateX(Math.PI / 2).scale(1, 0.5, 1), M4(0, hm.dy + 0.15, -1.2), P.pFlat(0x8a7a5a, 0.2), { ao: false }); P.barrel(0.3, hm.dy, 1.2, { h: 0.5, r: 0.25 }); }
      else for (let k = 0; k < 5; k++) { const z = -4 + k * 2; const o = new THREE.Vector3(-1.1, hm.dy + 0.55, z); P.log(o.x, o.y, o.z, o.x + 2.2, o.y + 0.05, o.z + 0.2, 0.05, 0x7a5c40, { seg: 4, ls: 1, ao: false }); }
      P.bin = null; S.hm = hm; S.lift = Math.max(0.35, 0.55 - hm.dy);   // 갑판이 물 위 0.55m(바다 판이 배 안으로 안 보이게)
    }
    P.ground = g0;
    lists.npc.push({ x: 86, z: 13.4, yaw: Math.PI, kind: 'work' }, { x: 80, z: 31.6, yaw: 0, kind: 'work' }, { x: 71.6, z: 24, yaw: Math.PI / 2, kind: 'work' });
    A('dock_top', 39, 9, Math.PI / 2 + 0.3); A('dock_end', 99.4, 15, Math.PI / 2, DY); A('dock_ship', 88, 13.4, Math.PI, DY);
    /* 바닷가에 끌어올린 작은 배 하나(흔들리지 않음) */
    P.hull(M4(70.6, 2.95, 43.2, 2.4, 0.08, 0.12), { L: 5.4, B: 1.7, D: 0.7, sheer: 0.5, ns: 12, nt: 5, top: 0x5a4a3a, strake: [0x6a5038, 0x5e4834] });
    blockers.push({ x: 70.6, z: 43.2, r: 1.6 });
  }

  mk('선착장');
  /* ── 서쪽 다리(훈련장 가는 길) ── */
  {
    const ax = -73, az = -12, bx = -110, bz = -12.5, ay = gridH(ax, az), by = gridH(bx, bz);   // 양 끝을 땅 위 평평한 데까지
    const br = P.bridge(ax, ay + 0.05, az, bx, by + 0.05, bz, 2.4, { sag: 1.3 });
    addLayer(br);
    A('arena_bridge', bx - 1.5, bz, -Math.PI / 2);
    lists.torches.push(P.torch(group, ax + 1.5, gridH(ax + 1.5, az - 2.2), az - 2.2), P.torch(group, bx - 1.5, gridH(bx - 1.5, bz + 2.2), bz + 2.2));
    for (let k = 0; k < 3; k++) { const x = bx - 4 - k * 5.5, z = bz + Math.sin(k) * 1.5; P.log(x, gridH(x, z) - 0.3, z, x, gridH(x, z) + 1.2, z, 0.08, 0x5a4230, { seg: 5, ls: 1 }); }
  }

  mk('다리');
  /* ── 숲 울타리(뾰족 통나무 줄 + 문) ── */
  {
    const ax = 46, az = -90, bx = 108, bz = -36, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, gx = 77.5, gz = -63.0, gt = ((gx - ax) * ux + (gz - az) * uz);
    for (let s = 0.4; s < L; s += 0.46) {
      if (Math.abs(s - gt) < 2.3) continue;
      const x = ax + ux * s + (rng() - 0.5) * 0.06, z = az + uz * s + (rng() - 0.5) * 0.06, g = gridH(x, z), h = 3.4 + rng() * 0.6;
      P.log(x, g - 0.5, z, x, g + h, z, 0.22 + rng() * 0.03, P.vary(0x5e4834, 0.14), { seg: 5, ls: 1 });
      P.put(new THREE.ConeGeometry(0.22, 0.55, 5), M4(x, g + h + 0.27, z), P.pWood(0x6f5640), { ao: false });
    }
    for (const y of [1.2, 2.6]) for (const [s0, s1] of [[0.4, gt - 2.3], [gt + 2.3, L]]) { const a = [ax + ux * s0 - uz * 0.28, az + uz * s0 + ux * 0.28], b = [ax + ux * s1 - uz * 0.28, az + uz * s1 + ux * 0.28]; P.beam(a[0], gridH(a[0], a[1]) + y, a[1], b[0], gridH(b[0], b[1]) + y, b[1], 0.12, 0.2, 0x4f3c2e); }
    /* 문: 기둥 둘 + 문짝 둘(조금 열림) + 위 가로대 + 지붕 끝 장식 */
    const gy = gridH(gx, gz), yaw = Math.atan2(ux, uz);
    for (const sd of [-1, 1]) { const x = gx + ux * sd * 2.2, z = gz + uz * sd * 2.2; P.log(x, gy - 0.5, z, x, gy + 5.0, z, 0.3, 0x4a3527, { seg: 8 }); blockers.push({ x, z, r: 0.35 });
      const M = M4(x - ux * sd * 0.15, gy, z - uz * sd * 0.15, yaw + (sd > 0 ? Math.PI : 0)).multiply(M4(0, 0, 0, sd * 0.25 * (sd > 0 ? 1 : -1)));
      for (let k = 0; k < 6; k++) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0.2 + k * 0.33, 1.8, 0)), 0.31, 3.6, 0.12, P.pWood(P.vary(0x5e4834, 0.12)));
      for (const yy of [0.8, 2.8]) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(1.0, yy, 0.1)), 2.0, 0.16, 0.06, P.pIron()); }
    P.beam(gx - ux * 2.6, gy + 4.6, gz - uz * 2.6, gx + ux * 2.6, gy + 4.6, gz + uz * 2.6, 0.3, 0.34, 0x4a3527);
    P.shield(M4(gx - uz * 0.25, gy + 5.2, gz + ux * 0.25, yaw - Math.PI / 2), 0.55, { cols: [PAL.green, PAL.white], pat: 3 });
    walls.push([ax, az, gx - ux * 2.2, gz - uz * 2.2], [gx + ux * 2.2, gz + uz * 2.2, bx, bz], [gx - ux * 2.2, gz - uz * 2.2, gx + ux * 2.2, gz + uz * 2.2]);
    anchors.forest_gate = { x: gx - uz * 3.0, y: gridH(gx - uz * 3.0, gz + ux * 3.0), z: gz + ux * 3.0, yaw: Math.atan2(uz, -ux) };   // 마을 쪽(남서)에 서서 문을 봄
    lists.torches.push(P.torch(group, gx - uz * 1.4 + ux * 3.2, gridH(gx - uz * 1.4 + ux * 3.2, gz + ux * 1.4 + uz * 3.2), gz + ux * 1.4 + uz * 3.2));
  }

  mk('울타리');
  /* ── 양 우리(빈 우리 · 양은 팀 M) ── */
  { const r = P.sheepPen(-44, -50, 0.35, 12, 9); walls.push(...r.walls); A('sheep_pen', r.gate[0], r.gate[1], Math.PI + 0.35); lists.npc.push({ x: r.gate[0] + 1.5, z: r.gate[1] - 0.5, yaw: Math.PI, kind: 'work' }); }

  mk('양우리');
  /* ── 광장(돌로 두른 모닥불 · 통나무 의자 · 장터 차양 · 수레 · 통) ── */
  {
    const py = gridH(0, 0), G = gridH; A('plaza', 0, 6.5, Math.PI);   /* 광장은 비탈 따라 살짝 기움 → 물건마다 그 자리 땅 높이 */
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; P.blob(Math.cos(a) * 1.5, G(Math.cos(a) * 1.5, Math.sin(a) * 1.5) + 0.1, Math.sin(a) * 1.5, 0.38, PAL.stone[k % 4], { moss: 0.2, sy: 0.6 }); }
    lists.torches.push(P.torch(group, 0, py - 0.15, 0, { noPost: true, s: 0.01, flame: 1.8, glow: 9, op: 0.65 }));
    for (let k = 0; k < 4; k++) P.log(0.4, py + 0.05, 0, 1.3, py + 0.15, 0.4, 0.12, 0x4a3628, { seg: 6, ls: 1, ao: false });
    blockers.push({ x: 0, z: 0, r: 2.0 });
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4, x = Math.cos(a) * 4.6, z = Math.sin(a) * 4.6; P.log(x - Math.sin(a) * 1.3, G(x - Math.sin(a) * 1.3, z + Math.cos(a) * 1.3) + 0.25, z + Math.cos(a) * 1.3, x + Math.sin(a) * 1.3, G(x + Math.sin(a) * 1.3, z - Math.cos(a) * 1.3) + 0.25, z - Math.cos(a) * 1.3, 0.3, P.vary(0x6a4c34), { seg: 8, ls: 2 });
      blockers.push({ x, z, r: 0.5 }, { x: x - Math.sin(a) * 0.9, z: z + Math.cos(a) * 0.9, r: 0.45 }, { x: x + Math.sin(a) * 0.9, z: z - Math.cos(a) * 0.9, r: 0.45 }); }
    /* 장터 차양 둘 */
    for (const [x, z, yw, col] of [[-8.5, -6.5, 0.6, PAL.red], [9.2, -6.8, -0.7, PAL.blue]]) {
      const M = M4(x, G(x, z), z, yw);
      for (const [a, b] of [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]]) { const p = new THREE.Vector3(a, 0, b).applyMatrix4(M); P.log(p.x, p.y - 0.2, p.z, p.x, p.y + 2.3 - (b > 0 ? 0.3 : 0), p.z, 0.06, 0x5a4230, { seg: 5, ls: 1 }); }
      const cp = new THREE.PlaneGeometry(3.2, 2.2, 6, 4).rotateX(-Math.PI / 2 + 0.14), cpa = cp.attributes.position; for (let i = 0; i < cpa.count; i++) cpa.setY(i, cpa.getY(i) - 0.12 * Math.sin((cpa.getX(i) / 3.2 + 0.5) * Math.PI));
      P.put(cp, new THREE.Matrix4().multiplyMatrices(M, M4(0, 2.18, 0)), (c, lx, ly, lz, wx, wy, wz) => { c.setHex(Math.floor((lx + 1.6) / 0.53) % 2 ? col : PAL.cloth).multiplyScalar(0.9 + 0.1 * N.v2(wx, wz)); }, { mat: 'd', ao: false, flat: true });
      P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.45, -0.2)), 2.6, 0.9, 1.0, P.pWood(0x7a5a3c), { jit: 0.01 });
      for (let k = 0; k < 4; k++) P.blob(new THREE.Vector3(-0.9 + k * 0.6, 0, -0.2).applyMatrix4(M).x, G(x, z) + 0.98, new THREE.Vector3(-0.9 + k * 0.6, 0, -0.2).applyMatrix4(M).z, 0.22, [0x9aa0a0, 0x8a5a3a, 0xb59a52, 0x6a7a44][k], { moss: 0, sy: 0.6 });
      blockers.push({ x, z, r: 1.6 });
      lists.npc.push({ x: new THREE.Vector3(0, 0, -1.6).applyMatrix4(M).x, z: new THREE.Vector3(0, 0, -1.6).applyMatrix4(M).z, yaw: yw, kind: 'work' });
    }
    lists.npc.push({ x: -4.2, z: 3.8, yaw: 2.4, kind: 'talk' }, { x: -2.6, z: 5.2, yaw: 3.6, kind: 'talk' }, { x: 5.6, z: -1.6, yaw: -1.2, kind: 'talk' }, { x: 6.2, z: 2.6, yaw: -2.0, kind: 'idle' });
    /* 수레 */
    { const M = M4(10.5, G(10.5, 6.5), 6.5, 2.2, 0, -0.05); P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.9, 0)), 1.6, 0.12, 2.4, P.pWood(0x7a5a3c)); for (const sx of [-1, 1]) { P.box(new THREE.Matrix4().multiplyMatrices(M, M4(sx * 0.8, 1.15, 0)), 0.08, 0.45, 2.4, P.pWood(0x6a4c34)); P.put(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 12).rotateZ(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(M, M4(sx * 0.92, 0.55, 0.3)), P.pWood(0x4a3628), { flat: true }); }
      const a = new THREE.Vector3(0, 0.85, 1.2).applyMatrix4(M), b = new THREE.Vector3(0, 0.25, 3.0).applyMatrix4(M); P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.05, 0x5a4230, { seg: 4, ls: 1 }); blockers.push({ x: 10.5, z: 6.5, r: 1.5 });
      for (let k = 0; k < 3; k++) { const p = new THREE.Vector3(-0.4 + k * 0.4, 0, -0.5 + k * 0.4).applyMatrix4(M); P.barrel(p.x, G(10.5, 6.5) + 0.95, p.z, { h: 0.6, r: 0.25 }); } }
    for (const [x, z] of [[-11.2, 2.5], [-10.4, 3.6], [11.8, -2.8]]) { P.barrel(x, gridH(x, z) - 0.05, z); blockers.push({ x, z, r: 0.5 }); }
    /* 우물(깎은 돌 둘레 + 기둥 둘 + 작은 곡선 지붕 + 도르래 · 두레박) — 광장 북동 */
    { const wx = 7.2, wz = -12.2, wy = G(wx, wz), WM = M4(wx, wy, wz, 0.4);
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; P.box(new THREE.Matrix4().multiplyMatrices(WM, M4(Math.cos(a) * 1.05, 0.4, Math.sin(a) * 1.05, -a + Math.PI / 2)), 0.78, 0.8, 0.36, P.pStone(P.pick(PAL.stone), { moss: 0.5 }), { flat: true, jit: 0.04, facet: true }); }
      P.put(new THREE.CircleGeometry(0.85, 10).rotateX(-Math.PI / 2), new THREE.Matrix4().multiplyMatrices(WM, M4(0, 0.55, 0)), P.pFlat(0x1e2a30, 0.1), { ao: false });
      for (const sx of [-1, 1]) { const p = new THREE.Vector3(sx * 1.15, 0, 0).applyMatrix4(WM); P.log(p.x, wy - 0.2, p.z, p.x, wy + 2.4, p.z, 0.1, 0x5a4230, { seg: 6, ls: 1 }); }
      const a1 = new THREE.Vector3(-1.25, 2.0, 0).applyMatrix4(WM), b1 = new THREE.Vector3(1.25, 2.0, 0).applyMatrix4(WM); P.log(a1.x, a1.y, a1.z, b1.x, b1.y, b1.z, 0.07, 0x4a3628, { seg: 6, ls: 1 });
      P.roof(new THREE.Matrix4().multiplyMatrices(WM, M4(0, 2.35, 0, Math.PI / 2)), { w: 1.6, d: 2.6, H: 0.85, ohE: 0.35, ohG: 0.3, sag: 0.05, up: 0.18, kind: 'shingle', hex: PAL.shingle, t: 0.12, cell: 0.5, row: 0.4 });
      P.put(new THREE.CylinderGeometry(0.2, 0.17, 0.3, 8), new THREE.Matrix4().multiplyMatrices(WM, M4(0.15, 1.2, 0)), P.pWood(0x6a4c34), { ao: false });
      const r1 = new THREE.Vector3(0.15, 2.0, 0).applyMatrix4(WM), r2 = new THREE.Vector3(0.15, 1.36, 0).applyMatrix4(WM); P.log(r1.x, r1.y, r1.z, r2.x, r2.y, r2.z, 0.012, PAL.rope, { seg: 3, ls: 1, ao: false });
      blockers.push({ x: wx, z: wz, r: 1.5 }); }
    /* 장터 짐: 자루 · 건초 · 상자 더미 */
    for (const [x, z, k] of [[-11.5, -4.2, 0], [-10.6, -5.4, 1], [11.6, -5.0, 2], [12.4, -6.2, 0], [-6.4, -9.4, 1]]) {
      const y = G(x, z);
      if (k === 0) { P.crate(x, y - 0.05, z, 0.75, x * 0.3); P.crate(x + 0.15, y + 0.68, z - 0.1, 0.6, x * 0.5); }
      else if (k === 1) for (let q = 0; q < 3; q++) P.blob(x + (q - 1) * 0.45, y + 0.25, z + (q % 2) * 0.3, 0.32, 0xb39a6c, { moss: 0, sy: 0.75, rough: 0.25 });
      else P.blob(x, y + 0.4, z, 0.7, PAL.hay, { moss: 0, sy: 0.65, rough: 0.3 });
      blockers.push({ x, z, r: 0.8 });
    }
  }

  mk('광장');
  /* ── 남쪽 벼랑 위 망대(투석기 둘 · 볼라 발사기 하나 · 낮은 울타리) ── */
  {
    for (const [x, z, yw] of [[19, 41.5, 0.15], [-14, 43.5, -0.1]]) { P.catapult(M4(x, gridH(x, z), z, yw)); blockers.push({ x, z, r: 1.9 }, { x: x - Math.sin(yw) * 1.8, z: z - Math.cos(yw) * 1.8, r: 1.0 }); }
    { const x = 31, z = 37.5; P.bolaLauncher(M4(x, gridH(x, z), z, 0.5)); blockers.push({ x, z, r: 0.7 }); }
    const fp = []; for (let x = -34; x <= 44; x += 4) { let z = 30; for (; z < 62; z += 0.5) if (coastD(x, z) < 8.5) break; fp.push([x, z]); }
    walls.push(...P.fence(fp, { hex: 0x5f4a38 }));
    for (let k = 0; k < 5; k++) { const p = fp[k * 4 + 1]; lists.torches.push(P.torch(group, p[0], gridH(p[0], p[1] - 1.4), p[1] - 1.4)); }
  }

  mk('벼랑');
  /* ── 길가 횃불 · 깃발 ── */
  for (const [x, z] of [[2.6, -40], [-2.8, -26], [3.0, -14], [-12.5, 20], [-28, 31.5], [18, 11.8], [-28, -6.2], [-50, -14.6], [-18.5, -27], [24, -37.6], [48, -49], [-4.8, -56], [4.8, -56]]) lists.torches.push(P.torch(group, x, gridH(x, z), z));
  for (const [x, z, yw, cols] of [[-8, -48, 0.4, [PAL.red, PAL.yel]], [8, -48, -0.3, [PAL.blue, PAL.white]], [14, 2, 1.2, [PAL.red, PAL.cloth]], [-40, 37.5, 2, [PAL.green, PAL.white]], [66, 21, 2.6, [PAL.blue, PAL.yel]], [-72, -15.5, 0.4, [PAL.red, PAL.black]]]) P.flag(x, gridH(x, z), z, yw, { cols, h: 6.5 });

  mk('횃불깃발');
  /* ── 나무·바위·풀(인스턴스) ── 숲 울타리 너머는 빽빽, 마을 안은 듬성(길·집터 피함) */
  {
    const free = (x, z, m = 2.5) => { if (streetD(x, z) < m) return false; for (const p of PADS) if (padK(p, x, z) > 0.05 && Math.hypot(x - p.x, z - p.z) < 30) return false; for (const s of [[0, -57, 6, 9], [24, -2, 9, 9], [-46, 41, 9, 9], [-91, -12, 18, 4], [77, -63, 6, 6], [55, 17, 18, 10]]) if (Math.abs(x - s[0]) < s[2] && Math.abs(z - s[1]) < s[3]) return false; return true; };
    const pines = [], birch = [], rocks = [], rocks2 = [], grass = [];
    for (let i = 0; i < 2600 && pines.length < 150; i++) {
      const x = -140 + rng() * 270, z = -128 + rng() * 170, h = gridH(x, z), d = coastD(x, z);
      if (h < 4 || d < 7 || h > 108) continue;
      const forest = pal(x, z) < 0, mtn = z < -88, west = x < -99;
      const dens = forest ? 0.9 : mtn ? 0.32 : west ? 0.6 : 0.05 + 0.25 * ss(30, 70, Math.hypot(x - 10, z + 10));
      if (rng() > dens || !free(x, z, 4)) continue;
      const s = 0.75 + rng() * 0.6;
      if (!forest && !mtn && rng() < 0.22) birch.push({ x, y: h - 0.2, z, yaw: rng() * 6.28, s: s * 0.9, col: P.vary(0xffffff, 0.12) }); else pines.push({ x, y: h - 0.3, z, yaw: rng() * 6.28, s, sy: s * (0.85 + rng() * 0.35), col: P.vary(0xffffff, 0.1) });
      if (!forest) blockers.push({ x, z, r: 0.4 * s });
    }
    for (let i = 0; i < 900 && rocks.length + rocks2.length < 90; i++) {
      const x = -140 + rng() * 270, z = -110 + rng() * 170, h = gridH(x, z), d = coastD(x, z);
      if (h < 2.2 || h > 100) continue; const nearC = d > 4 && d < 11, s = nearC ? 1.4 + rng() * 2.4 : 0.5 + rng() * 1.1;
      if (!nearC && rng() > 0.25) continue; if (!free(x, z, 1.5 + s)) continue;
      (rng() < 0.5 ? rocks : rocks2).push({ x, y: h - s * 0.25, z, yaw: rng() * 6.28, s, sy: s * (0.6 + rng() * 0.5), col: P.vary(0xffffff, 0.12) });
      if (s > 0.7 && Math.hypot(x, z + 10) < 125) blockers.push({ x, z, r: s * 0.85 });
    }
    for (let i = 0; i < 6000 && grass.length < 800; i++) {
      const x = -90 + rng() * 180, z = -88 + rng() * 140, h = gridH(x, z);
      if (h < 3 || coastD(x, z) < 7 || !free(x, z, 1.2)) continue;
      grass.push({ x, y: h - 0.05, z, yaw: rng() * 6.28, s: 0.7 + rng() * 0.8, col: P.vary(0xffffff, 0.2) });
    }
    P.inst(P.pineGeo(5), 'o', pines, group); P.inst(P.birchGeo(), 'o', birch, group);
    P.inst(P.rockGeo(1, 0.7), 'o', rocks, group); P.inst(P.rockGeo(2, 0.95), 'o', rocks2, group);
    P.inst(P.grassGeo(), 'd', grass, group);
  }

  mk('자연');
  /* ── 먼 것(북쪽 산줄기 · 바다 돌기둥 · 서쪽 섬의 훈련장 그림자 · 먼 섬) — 그리기 몇 번 ── */
  {
    const g = new THREE.PlaneGeometry(900, 260, 52, 14).rotateX(-Math.PI / 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), k = (z + 130) / 260, ridge = Math.pow(Math.sin(Math.min(1, k * 1.25) * Math.PI), 0.7);
      p.setY(i, -20 + ridge * (120 + 170 * N.fbm(x * 0.006 + 2, z * 0.008, 4)) * (1 - ss(330, 450, Math.abs(x)) * 0.8)); }
    g.translate(0, 0, -330); g.computeVertexNormals();
    P.put(g, null, (c, lx, ly, lz, wx, wy, wz, nx, ny) => { c.setHex(PAL.rock2).lerp(new THREE.Color(PAL.pine), ss(60, 20, wy) * 0.8 * ny); if (wy > 150 + (N.v2(wx * 0.02, wz * 0.02) - 0.5) * 40) c.lerp(new THREE.Color(0xe8ecee), 0.9 * ss(0.4, 0.8, ny)); c.multiplyScalar(0.9 + 0.15 * N.v2(wx * 0.05, wz * 0.05)); }, { ao: false });
    const stackG = (() => { const prof = [[0.01, -8], [15, -8], [14.5, 2], [12.5, 10], [13.2, 18], [11.2, 26], [11.8, 34], [10.2, 42], [10.8, 50], [9.4, 58], [9.8, 62], [7, 65.5], [0.01, 66.5]].map(([r, y]) => new THREE.Vector2(r, y)); const lg = new THREE.LatheGeometry(prof, 12), pp = lg.attributes.position;
      for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), a = Math.atan2(z, x), ledge = 1 + 0.1 * Math.floor(Math.sin(y * 0.35 + a) * 2 + 2) / 4, k = (1 + (N.v2(a * 2.2 + 5, y * 0.07) - 0.5) * 0.7 + (N.v2(a * 6 + 1, y * 0.25) - 0.5) * 0.3) * ledge; pp.setXYZ(i, x * k, y + (N.v2(a * 3, y * 0.1) - 0.5) * 2, z * k); }
      return P.prep(lg, null, (c, lx, ly, lz) => { c.setHex(ly > 62 ? PAL.grass[2] : PAL.rock2).lerp(new THREE.Color(PAL.rock), N.v2(Math.atan2(lz, lx) * 3, ly * 0.2)); if (ly < 3) c.multiplyScalar(0.6); }, { ao: false }); })();
    const st = [];
    for (const [x, z, s, sy] of [[-150, 120, 0.8, 0.9], [-60, 150, 0.6, 1.2], [40, 175, 1.0, 0.8], [150, 110, 0.7, 1.1], [190, -20, 0.9, 1.4], [175, 60, 0.5, 0.7], [-190, 60, 0.7, 1.0], [120, 200, 1.2, 1.3], [-120, 190, 0.9, 0.6], [230, 140, 1.1, 1.0]]) st.push({ x, y: 0, z, yaw: rng() * 6.28, s, sy, col: P.vary(0xffffff, 0.1) });
    P.inst(stackG, 'o', st, group);
    /* 서쪽 섬 + 훈련장(돌 고리 + 쇠사슬 지붕 테) */
    P.blob(-235, -10, -35, 48, PAL.rock, { sy: 0.85, detail: 2, rough: 0.35, ao: false });
    const ar = new THREE.CylinderGeometry(27, 28, 9, 28, 1, true); P.put(ar, M4(-235, 31, -35), P.pStone(PAL.stone[1], { moss: 0 }), { mat: 'd', ao: false, flat: true });
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI, pts = []; for (let q = 0; q <= 12; q++) { const t = q / 12 * Math.PI; pts.push(new THREE.Vector3(-235 + Math.cos(a) * Math.cos(t) * 27, 35 + Math.sin(t) * 13, -35 + Math.sin(a) * Math.cos(t) * 27)); }
      P.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.35, 4), null, P.pFlat(0x3a3a3e), { ao: false }); }
    for (const [x, z, r] of [[-260, 130, 30], [260, -120, 40], [300, 60, 35]]) P.blob(x, -12, z, r, PAL.rock2, { sy: 0.7, detail: 2, rough: 0.4, ao: false });
  }

  mk('먼것');
  /* ── 걷기 벽: '걸을 수 있는 칸'(1m) 등고선 — 물·절벽·둑·산 밑·숲 울타리 너머·경계 밖은 막음 ── */
  const BOUND = { x: 0, z: -14, r: 126 };
  {
    const gx0 = -128, gz0 = -92, gs = 1, gw = 250, gd = 152, mask = new Uint8Array((gw + 1) * (gd + 1));
    const layerIn = (x, z) => { for (const L of LAYERS) { if (x < L.bx0 || x > L.bx1 || z < L.bz0 || z > L.bz1) continue;
      if (L.poly) { if (inPoly(L.poly, x, z) || inPoly(L.poly, x + 0.3, z) || inPoly(L.poly, x - 0.3, z) || inPoly(L.poly, x, z + 0.3) || inPoly(L.poly, x, z - 0.3)) return true; continue; }
      const px = x - L.ax, pz = z - L.az, t = (px * L.ux + pz * L.uz) / L.run, s = Math.abs(px * L.uz - pz * L.ux); if (t > -0.6 / L.run && t < 1 + 0.6 / L.run && s < L.hw + 0.3) return true; } return false; };
    for (let j = 0; j <= gd; j++) for (let i = 0; i <= gw; i++) {
      const x = gx0 + i * gs, z = gz0 + j * gs; let ok = 1;
      if (i === 0 || j === 0 || i === gw || j === gd || Math.hypot(x - BOUND.x, z - BOUND.z) > BOUND.r - 1) ok = 0;
      else if (layerIn(x, z)) ok = 1;
      else { const h = gridH(x, z); if (h < 1.4 || z < -89 || pal(x, z) < 0) ok = 0; else { const sx = (gridH(x + 0.6, z) - gridH(x - 0.6, z)) / 1.2, sz = (gridH(x, z + 0.6) - gridH(x, z - 0.6)) / 1.2; if (sx * sx + sz * sz > 1.0) ok = 0; } }
      mask[j * (gw + 1) + i] = ok;
    }
    walls.push(...contourWalls(mask, gw, gd, gx0, gz0, gs));
  }

  P.finish(group); P.finishFire(group);
  P.setWindows(false);
  const burnt = charred ? housesOut.filter((h) => h.H.burn).slice(0, 3).map(({ r, H }) => { const p = new THREE.Vector3(H.w * 0.15, (H.hw2 || H.hw || 2.7) + r.roof.Y(0.6, 0.3), H.d * 0.2).applyMatrix4(r.M); return [p.x, p.y, p.z]; }) : [];
  const smoke = P.smoke(group, burnt.concat(smokeSpots).concat(housesOut.filter((h) => (h.H.extras || []).includes('vent')).slice(0, 4).map(({ r, H }) => { const p = new THREE.Vector3(0, (H.hw2 || H.hw || 2.7) + r.roof.Y(0.5, 0) + 0.6, H.d * 0.15).applyMatrix4(r.M); return [p.x, p.y, p.z]; })));

  /* ── 때 ── */
  const night = time === 'night', dawn = time === 'dawn';
  setTime(env, time, time === 'night' ? { hI: 0.6, sunI: 0.42 } : undefined); env.sea.visible = true;
  lists.torches.forEach((T, i) => T.set(night || (dawn && i % 3 === 0) || !!T.always));   // 회관 화로는 늘 · 새벽엔 셋 중 하나
  P.setWindows(night || dawn);
  const precip = time === 'sleet' ? P.precip(group, 'sleet', 1600, 50) : null;

  /* 배가 물결 따라 흔들림 — kit 바다와 같은 물결 넷(카메라 거리 흐림 포함) · 매 프레임 new X */
  const WAVES = [[1.0, 0.3, 0.16, 62, 372, 868], [0.6, 1.0, 0.13, 31, 186, 434], [-0.4, 0.9, 0.1, 17, 102, 238], [0.9, -0.5, 0.08, 9, 54, 126]].map(([dx, dz, st, wl, f0, f1]) => { const l = Math.hypot(dx, dz); return { dx: dx / l, dz: dz / l, st, k: 6.28318 / wl, c: Math.sqrt(9.8 / (6.28318 / wl)), f0, f1 }; });
  const seaAmp = env.sea.material.uniforms.amp;
  const waveY = (x, z, t) => { let y = 0; const dc = Math.hypot(x - camera.position.x, z - camera.position.z); for (let i = 0; i < 4; i++) { const w = WAVES[i], a = w.st * seaAmp.value * (1 - ss(w.f0, w.f1, dc)) / w.k; y += a * Math.sin(w.k * (w.dx * x + w.dz * z - w.c * t)); } return y; };
  for (const S of ships) { const G = P.named[S.name]; G.position.set(S.x, 0, S.z); G.rotation.order = 'YXZ'; G.rotation.y = S.yaw; S.G = G; }

  let nearTick = 0;
  const place = {
    name: 'village', height, blockers, walls, bound: BOUND, anchors, lists, group,
    ground: gridH, time,
    step(dt, t) {
      P.stepCloth(t); P.stepFire(t); P.stepFlames(t); if (smoke) smoke.step(t);
      for (let i = 0; i < ships.length; i++) { const S = ships[i], G = S.G, L = S.o.L * 0.4;
        const y0 = waveY(S.x, S.z, t), yf = waveY(S.x + Math.sin(S.yaw) * L, S.z + Math.cos(S.yaw) * L, t), ys = waveY(S.x + Math.cos(S.yaw) * 1.8, S.z - Math.sin(S.yaw) * 1.8, t);
        G.position.y = y0 * 0.9 + S.lift; G.rotation.x = -Math.atan2(yf - y0, L) * 0.7; G.rotation.z = Math.atan2(ys - y0, 1.8) * 0.5; }
    },
    draw() { if (precip) precip.step(performance.now() / 1000, camera); if ((nearTick++ & 7) === 0) P.updateNear(camera, 72); },
    dispose() {},
    benchPath(t) {                                         // 60초: 광장 → 대장간 → 선착장 위 → 망루 → 서쪽 다리 → 회관 계단 → 하늘에서 한 바퀴
      const K = [[2, 25, 14, 0, 23, -4], [12, 25.5, 14, 24, 25, -2], [44, 24, 2, 80, 6, 22], [30, 30, 42, -46, 30, 40], [-54, 34, 6, -100, 32, -12], [-10, 40, -36, 0, 50, -76], [40, 70, -40, -10, 30, 0], [2, 25, 14, 0, 23, -4]];
      const k = Math.min(0.9999, t / 60) * (K.length - 1), i = Math.floor(k), f = k - i, s = f * f * (3 - 2 * f), a = K[i], b = K[i + 1];
      camera.position.set(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s);
      camera.lookAt(a[3] + (b[3] - a[3]) * s, a[4] + (b[4] - a[4]) * s, a[5] + (b[5] - a[5]) * s);
    },
    stats: () => ({ tris: Math.round(P.tris), pieces: P.pieces, walls: walls.length, blockers: blockers.length, houses: HOUSES.length, near: P.nearMeshes.length, parts: TB, burnt: HOUSES.filter((h) => h.burn).map((h) => [Math.round(h.x), Math.round(h.z)]) }),
  };
  return place;
}

/* 등고선 벽 — 마디 값 0/1 격자에서 경계 선분(마칭 스퀘어) → 이어 붙여 줄 → 더글러스–포이커로 줄임(0.35m) */
function contourWalls(M, gw, gd, x0, z0, s) {
  const W = gw + 1, v = (i, j) => M[j * W + i], segs = [];
  const eid = (i, j, h) => (h ? 'h' : 'v') + i + ',' + j;                 // h = (i,j)–(i+1,j) 가로 변 · v = (i,j)–(i,j+1) 세로 변
  const ep = (id) => { const h = id[0] === 'h', [i, j] = id.slice(1).split(',').map(Number); return h ? [x0 + (i + 0.5) * s, z0 + j * s] : [x0 + i * s, z0 + (j + 0.5) * s]; };
  for (let j = 0; j < gd; j++) for (let i = 0; i < gw; i++) {
    const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1), code = a | (b << 1) | (c << 2) | (d << 3);
    if (code === 0 || code === 15) continue;
    const B = eid(i, j, 1), R = eid(i + 1, j, 0), T = eid(i, j + 1, 1), L = eid(i, j, 0);
    const T2 = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[R, T]], 5: [[L, T], [B, R]], 6: [[B, T]], 7: [[L, T]], 8: [[T, L]], 9: [[T, B]], 10: [[T, R], [L, B]], 11: [[T, R]], 12: [[R, L]], 13: [[R, B]], 14: [[B, L]] }[code];
    for (const sg of T2) segs.push(sg);
  }
  const adj = new Map(); segs.forEach((sg, k) => { for (const e of sg) { let a = adj.get(e); if (!a) adj.set(e, a = []); a.push(k); } });
  const used = new Uint8Array(segs.length), out = [];
  for (let k = 0; k < segs.length; k++) {
    if (used[k]) continue; used[k] = 1;
    const chain = [segs[k][0], segs[k][1]];
    for (const dir of [1, 0]) { for (;;) { const end = dir ? chain[chain.length - 1] : chain[0], nb = (adj.get(end) || []).find((q) => !used[q]); if (nb == null) break; used[nb] = 1; const o = segs[nb][0] === end ? segs[nb][1] : segs[nb][0]; if (dir) chain.push(o); else chain.unshift(o); } }
    const pts = chain.map(ep);
    let per = 0; for (let q = 1; q < pts.length; q++) per += Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]);
    if (per < 4) continue;                                     // 아주 작은 고리(풀밭 가운데 둔덕)는 버림
    const closed = chain[0] === chain[chain.length - 1], mid = pts.length >> 1;   // 닫힌 고리는 반으로 나눠 줄임(처음 = 끝이면 DP가 한 점으로 무너짐)
    for (const part of closed ? [pts.slice(0, mid + 1), pts.slice(mid)] : [pts]) { const sp = dp(part, 0.35); for (let q = 1; q < sp.length; q++) out.push([sp[q - 1][0], sp[q - 1][1], sp[q][0], sp[q][1]]); }
  }
  return out;
}
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let md = 0, mi = -1; const [ax, az] = pts[a], [bx, bz] = pts[b], L = Math.hypot(bx - ax, bz - az) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((bx - ax) * (az - pts[i][1]) - (ax - pts[i][0]) * (bz - az)) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol && mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return pts.filter((_, i) => keep[i]);
}
