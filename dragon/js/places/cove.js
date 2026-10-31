// 코브(숨은 호수) — 계약 = docs/dragon/stage3_plan.md §2·§3 cove · 때 day(기본) / sunset / overcast
// 타원 움푹한 땅 90×70m · 깎아지른 돌벽 18~25m(켜 결 · 턱마다 이끼 · 벽 밑 자갈 비탈) · 호수 · 모래 마당 · 자작나무 · 바위 · 땅 높이의 좁은 돌 틈(쓰러진 나무가 걸침)
// 층 둘: 위 가장자리 길(북쪽 1/3 둘레 · 숨을 바위 셋) / 바닥 — height(x, z, yHint) = yHint에 가까운 층 · 둘은 걸어서 못 오감(입구 틈 = 바닥 출입)
// 노을 때 해가 낮게 서쪽에서 → 바닥·서쪽 벽은 그늘, 동쪽 벽 위쪽만 빛(지을 때 해 그늘을 정점색에 구움 · 그림자 지도 X)
import * as THREE from 'three';
import { setTime, TIMES, toon } from '../look/kit.js?v=16';
import { createNoise } from '../core/noise.js?v=16';
import * as NT from '../look/nature.js?v=16';

const { C3, mixc, sstep, clamp, hash, TAU, mat4, matLay } = NT;
const RX = 45, RZ = 35;                                 // 바닥 타원 반지름(벽 밑동)
const TG = 0.691, DG = 0.055;                           // 입구 틈 각도(남동) · 반폭(라디안 ≈ 2.3m)
const TH1 = -0.471, TH2 = -2.576;                       // 위 가장자리 길(북동 → 북 → 북서 · 1/3 둘레)
const TC = 2.262;                                       // 미끄러진 자국 벽(남서)
const LAKE = { x: -18, z: 6 }, SAND = { x: 14, z: -6, r: 8 }, REST = { x: 24, z: 14 }, NIP = { x: 4, z: 22 }, TLOW = { x: 31, z: -4 }, WATER_Y = -0.35;
const WATCH_TH = [-0.82, -1.52, -2.2];
const OVER = { overcast: { near: 70, far: 700 } };

export async function buildPlace(ctx) {
  const { group, env } = ctx, opt = ctx.opt || {};
  const time = opt.time && TIMES[opt.time] ? opt.time : 'day';
  setTime(env, time, OVER[time]);
  if (env.sea) env.sea.visible = false;
  const N = createNoise(37), N2 = createNoise(53), T0 = performance.now();

  /* ── 타원 좌표 · 벽 · 땅 높이 ── */
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const rhoW = (th) => 1 + 0.028 * (N.fbm(Math.cos(th) * 1.4 + 3, Math.sin(th) * 1.4 + 7, 3) - 0.5) * 2;
  const yTop = (th) => 21.5 + 14 * (N2.fbm(Math.cos(th) * 1.1 + 11, Math.sin(th) * 1.1 + 2, 3) - 0.5);
  const Rm = (th) => Math.hypot(RX * Math.cos(th), RZ * Math.sin(th));     // s = 1 에서 가운데까지 거리(m)
  const pol = { s: 0, th: 0, dg: 0, R: 40 };
  const polar = (x, z) => { const u = x / RX, v = z / RZ, th = Math.atan2(v, u); pol.th = th; pol.s = Math.hypot(u, v) / rhoW(th); pol.dg = Math.abs(wrap(th - TG)); pol.R = Rm(th); return pol; };
  const P2 = (th, s) => { const r = s * rhoW(th); return [RX * r * Math.cos(th), RZ * r * Math.sin(th)]; };
  const lakeBed = (dl) => -3.2 + 3.6 * sstep(3, 19.5, dl);
  let lakeR = 3; for (let k = 0; k < 40; k++) { const m = lakeR + 0.5; if (lakeBed(m) < WATER_Y) lakeR = m; }   // 물가 반지름(물높이 = 바닥 높이인 곳)
  const valleyF = (s, R) => 0.25 + Math.max(0, s - 0.97) * R * 0.07;
  /* 바닥 층(바깥 주머니 골짜기 포함) */
  const floorH = (x, z) => {
    const p = polar(x, z), s = p.s, rho = s;
    let f = 0.5 * Math.min(rho, 1) ** 2 + (N.fbm(x * 0.05 + 1, z * 0.05 + 4, 3) - 0.5) * 0.9;
    const dl = Math.hypot(x - LAKE.x, z - LAKE.z); if (dl < 20) f = Math.min(f, lakeBed(dl) + (f - 0.4) * sstep(16, 20, dl));
    const ds = Math.hypot(x - SAND.x, z - SAND.z); if (ds < SAND.r + 3) f = f + (0.14 - f) * sstep(SAND.r + 3, SAND.r, ds);
    const gw = sstep(DG + 0.035, DG - 0.012, p.dg);
    const scree = 3.3 * sstep(0.9, 0.998, s) ** 1.7 + (N2.v2(p.th * 30, 3) - 0.5) * 0.6 * sstep(0.92, 0.99, s);
    f += scree * (1 - gw);
    if (gw > 0 && s > 0.9) f = f + (valleyF(s, p.R) + (N.v2(x * 0.3, z * 0.3) - 0.5) * 0.2 - f) * gw * sstep(0.9, 0.97, s);
    return f;
  };
  const rimH = (x, z, th, s, R) => yTop(th) + sstep(1.09, 1.45, s) * (s - 1.09) * R * 0.06 + (N.fbm(x * 0.04 + 20, z * 0.04, 3) - 0.5) * 2.8 * sstep(1.09, 1.3, s) + sstep(2.15, 2.7, s) * 20;
  /* 그리는 땅(바닥 · 벽 띠 속 숨은 비탈 · 가장자리 땅 · 틈 밖 골짜기) */
  const renderH = (x, z) => {
    const p = polar(x, z), s = p.s, th = p.th, R = p.R, dg = p.dg;
    if (s < 1.04 || (dg < DG + 0.0006 && s < 1.4)) return floorH(x, z);      // 틈 끝 열(±DG)까지 낮은 쪽 → 가파른 이음은 벽 끝 낯 뒤로 숨음
    if (s < 1.09) { const fw = floorH(x, z); return fw + (yTop(th) - fw) * sstep(1.04, 1.085, s); }
    const rh = rimH(x, z, th, s, R), v = sstep(DG + 0.2, DG + 0.004, dg) * sstep(1.95, 1.42, s);
    return rh + (valleyF(s, R) + 0.3 * (1 - v) - rh) * v;
  };

  /* ── 걷기 높이 격자 둘(1m · 같은 함수에서) ── */
  const FG = NT.createGrid(-50, -40, 1, 109, 81).fill((x, z) => floorH(x, z));
  const RG = NT.createGrid(-60, -50, 1, 127, 52).fill((x, z) => { const p = polar(x, z); return p.s < 1.09 ? yTop(p.th) : rimH(x, z, p.th, p.s, p.R); });
  const inRG = (x, z) => x > -60 && x < 66 && z > -50 && z < 1;
  const height = (x, z, yHint) => { const hf = FG.at(x, z); if (yHint == null || !inRG(x, z)) return hf; const hr = RG.at(x, z); return Math.abs(hr - yHint) < Math.abs(hf - yHint) ? hr : hf; };   // 가장자리 격자 밖 = 바닥만
  await NT.breathe();

  /* ── 굽개(60m 칸 4×4) ── */
  const B = NT.createBuilder({ x0: -126, z0: -105, size: 42, nx: 6, nz: 5, far: 1 });
  const ID = new THREE.Matrix4();
  const GRASS1 = C3(0x6f8c48), GRASS2 = C3(0x8aa456), MOSS = C3(0x5b7340), DIRT = C3(0x7a6a4e), SANDC = C3(0xd3c096), SAND2 = C3(0xc2ab80), PEB = C3(0x9a9488), SCREE = C3(0x8c867a), SCREE2 = C3(0x6e6a62), NEED = C3(0x5e5038), ROCKC = C3(0x7c766c);
  const tmpc = [0, 0, 0];
  const groundCol = (x, y, z, ny, c) => {
    const p = polar(x, z), s = p.s, w = N.v2(x * 0.08, z * 0.08), w2 = N2.v2(x * 0.025 + 3, z * 0.025);
    if (s < 1.0 || (p.dg < DG && s < 1.62)) {
      mixc(GRASS1, GRASS2, sstep(0.3, 0.8, w2), c); mixc(c, MOSS, sstep(0.55, 0.85, w) * 0.6, c);
      if (w < 0.22) mixc(c, DIRT, (0.22 - w) * 3, c);
      const dl = Math.hypot(x - LAKE.x, z - LAKE.z); if (dl < lakeR + 3) { mixc(c, mixc(SAND2, PEB, sstep(0.4, 0.7, w), tmpc), sstep(lakeR + 3, lakeR + 0.6, dl), c); if (dl < lakeR) mixc(c, C3(0x4e5a4c), sstep(lakeR, lakeR - 3, dl), c); }
      const ds = Math.hypot(x - SAND.x, z - SAND.z); if (ds < SAND.r + 2) mixc(c, mixc(SANDC, SAND2, w * 0.6, tmpc), sstep(SAND.r + 2, SAND.r - 0.5, ds), c);
      const sc = sstep(0.9, 0.975, s) * (1 - sstep(DG + 0.03, DG - 0.01, p.dg)); if (sc > 0) mixc(c, mixc(SCREE, SCREE2, w, tmpc), sc, c);
      if (p.dg < DG + 0.02 && s > 0.94) mixc(c, mixc(NEED, MOSS, w2, tmpc), sstep(0.94, 1.02, s) * 0.85, c);   // 틈·바깥 주머니 = 숲 바닥
    } else {
      mixc(NEED, MOSS, sstep(0.3, 0.75, w2), c); mixc(c, GRASS1, sstep(0.6, 0.9, w) * 0.5, c);
    }
    const st = sstep(0.8, 0.55, ny); if (st > 0) mixc(c, mixc(ROCKC, C3(0x5a5650), w * 0.7 + (s > 1.09 ? 0.3 : 0), tmpc), st * 0.9, c);
    return c;
  };
  /* 땅 — 극좌표 격자(바닥 가운데 → 벽 → 가장자리 땅) · 틈 가장자리에 열을 몰아 넣어 틈 벽이 곧게 · 법선은 높이 차분(조각끼리 이음매 X) */
  const S_ROWS = [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42, 0.48, 0.54, 0.6, 0.66, 0.72, 0.78, 0.84, 0.88, 0.92, 0.945, 0.965, 0.98, 0.993, 1.0, 1.04, 1.065, 1.09, 1.12, 1.16, 1.21, 1.27, 1.34, 1.42, 1.52, 1.64, 1.78, 1.95, 2.15, 2.4, 2.7];
  const cols = []; for (let j = 0; j < 220; j++) cols.push(-Math.PI + j / 220 * TAU);
  for (const e of [-1, 1]) for (const d of [-0.004, 0, 0.004]) cols.push(wrap(TG + e * DG + e * d));
  for (const d of [-0.03, 0, 0.03]) cols.push(wrap(TG + d));
  cols.sort((a, b) => a - b);
  const NC = cols.length, NR = S_ROWS.length, nrm = (x, z, o) => { const e = 0.6, hx = renderH(x + e, z) - renderH(x - e, z), hz = renderH(x, z + e) - renderH(x, z - e), l = Math.hypot(hx, 2 * e, hz); o[0] = -hx / l; o[1] = 2 * e / l; o[2] = -hz / l; return o; };
  const VX = new Float32Array(NR * NC), VZ = new Float32Array(NR * NC), VY = new Float32Array(NR * NC);
  for (let r = 0; r < NR; r++) for (let j = 0; j < NC; j++) { const th = cols[j], s = S_ROWS[r]; const [x, z] = P2(th, s); VX[r * NC + j] = x; VZ[r * NC + j] = z; VY[r * NC + j] = renderH(x, z); }
  const SECT = 12, nn = [0, 0, 0], cc = [0, 0, 0];
  for (const [r0, r1] of [[0, 21], [21, 26], [26, NR - 1]]) for (let q = 0; q < SECT; q++) {
    const j0 = Math.floor(q * NC / SECT), j1 = Math.floor((q + 1) * NC / SECT), M = new NT.Mesher(), idx = new Map();
    const vid = (r, j) => { const jj = (j + NC) % NC, k = r * NC + jj; if (idx.has(k)) return idx.get(k); const x = VX[k], z = VZ[k], y = VY[k]; nrm(x, z, nn); groundCol(x, y, z, nn[1], cc); const id = M.vn(x, y, z, cc, nn[0], nn[1], nn[2]); idx.set(k, id); return id; };
    for (let r = r0; r < r1; r++) for (let j = j0; j < j1; j++) { const a = vid(r, j), b = vid(r, j + 1), c = vid(r + 1, j + 1), d = vid(r + 1, j); M.quad(a, b, c, d); }
    const mid = P2((cols[j0] + cols[Math.min(NC - 1, j1)]) / 2, (S_ROWS[r0] + S_ROWS[r1]) / 2);
    B.put(M.done(), ID, null, r0 === 0 ? 'near' : 'both', null, mid[0], mid[1]);
    if (r0 === 0) B.put(M.done(), ID, null, 'far', null, mid[0], mid[1]);
  }
  await NT.breathe();

  /* ── 돌벽(벽 띠를 덮는 깎은 덩어리) — 안쪽 낯은 켜마다 턱이 지고 위는 둥근 입술 · 틈 쪽 끝은 막음 ── */
  /* 돌벽 낯 — 세로 금(3m 남짓 기둥마다 움푹) + 켜(3.3m)마다 위로 갈수록 들어갔다 다음 켜에서 튀어나옴(턱 = 이끼 자리) + 큰 노이즈 · 양수 = 벽 속으로 */
  const bulge = (th, y) => {
    const yb = y / 3.3 + N.v2(th * 2, 7) * 0.9, bi = Math.floor(yb), fb = yb - bi;
    const u = th * 40 / 3.4 + N.v2(th * 5, y * 0.09) * 1.8 + hash(bi >> 1, 9) * 0.45, ui = Math.floor(u), f = u - ui, col = (hash(ui, bi >> 1, 17) - 0.5) * 0.75;
    const joint = hash(ui, bi >> 1, 23) < 0.62 ? 0.55 * (sstep(0.12, 0, f) + sstep(0.88, 1, f)) : 0;   // 세로 금은 군데군데 · 켜 둘마다 어긋남
    const ledge = 0.75 * sstep(0.62, 0.96, fb) + (hash(bi, ui, 5) - 0.5) * 0.35;
    return Math.min(1.0, -0.45 + col + joint + ledge + (N2.v2(th * 9, y * 0.12) - 0.5) * 0.9);
  };
  const floorWall = (th) => { const [x, z] = P2(th, 0.995); return floorH(x, z); };
  const WR = 24, ST1 = C3(0x8e8a82), ST2 = C3(0x7b7872), ST3 = C3(0x9a958b), WET = C3(0x55534d), MOSSW = C3(0x5a7440), LIP = C3(0x667a44), JOINT = C3(0x4c4a46);
  const wallCols = cols.filter((th) => Math.abs(wrap(th - TG)) >= DG - 0.0005);
  /* 틈 오른쪽 끝(TG+DG)부터 한 바퀴 돌아 왼쪽 끝(TG−DG)까지 */
  const startJ = wallCols.findIndex((th) => Math.abs(wrap(th - (TG + DG))) < 0.0008);
  const arc = []; for (let k = 0; k < wallCols.length; k++) arc.push(wallCols[(startJ + k) % wallCols.length]);
  const prof = (th) => {                                   // [s, y] 아래 안쪽 → 위 → 바깥 아래
    const fw = floorWall(th), top = yTop(th), R = Rm(th), out = [];
    out.push([1.0 + 0.3 / R, fw - 1.1]);
    for (let k = 0; k <= WR; k++) { const y = fw + 0.2 + (top - 0.7 - fw - 0.2) * k / WR, lo = sstep(fw, fw + 4, y); out.push([1.0 + (bulge(th, y) * lo - 0.12 * (1 - lo)) / R, y]); }   // 밑동은 자갈에 바로 닿게(뜬 벽 X)
    const bt = bulge(th, top - 0.7);
    out.push([1.0 + (bt - 0.15) / R, top - 0.2], [1.0 + (bt + 0.6) / R, top + 0.05], [1.09, top]);
    const [xo, zo] = P2(th, 1.125), ho = renderH(xo, zo);
    out.push([1.11, top - 0.5], [1.12, Math.min((top + ho) / 2, ho - 0.6)], [1.125, ho - 0.9]);
    return out;
  };
  const WM = new NT.Mesher(), cols2 = [];
  for (let c = 0; c < arc.length; c++) {
    const th = arc[c], pr = prof(th), fw = floorWall(th), top = yTop(th), ids = [];
    pr.forEach(([s, y], k) => {
      const [x, z] = P2(th, s), band = Math.floor(y / 3.3 + N.v2(th * 2, 7) * 0.9), bn = hash(band, 3), u = th * 40 / 3.4 + N.v2(th * 5, y * 0.09) * 1.8 + hash(band >> 1, 9) * 0.45, fu = u - Math.floor(u), jOn = hash(Math.floor(u), band >> 1, 23) < 0.62;
      const col = mixc(bn < 0.33 ? ST1 : bn < 0.66 ? ST2 : ST3, ST2, N2.v2(th * 40, y * 0.4) * 0.45);
      if (jOn && k >= 1 && k <= WR + 1 && (fu < 0.07 || fu > 0.93)) mixc(col, JOINT, 0.5, col);
      if (y < fw + 2.2) mixc(col, WET, sstep(fw + 2.2, fw, y) * 0.7, col);
      if (k >= 1 && k <= WR + 1) { const streak = sstep(0.62, 0.8, N.v2(th * 34, 9)) * sstep(fw + 3, top - 2, y); if (streak > 0) mixc(col, MOSSW, streak * 0.4, col); }
      if (k >= WR + 2 && k <= WR + 4) mixc(col, LIP, k === WR + 2 ? 0.55 : 0.9, col);
      if (k > WR + 4) mixc(col, ST2, 0.3, col);
      ids.push(WM.v(x, y, z, col));
    });
    cols2.push(ids);
  }
  for (let c = 0; c < arc.length - 1; c++) { const A = cols2[c], Bc = cols2[c + 1]; for (let k = 0; k < A.length - 1; k++) WM.quad(A[k], Bc[k], Bc[k + 1], A[k + 1]); }
  const capFan = (ids, dirSign) => {                       // 틈 낯 — 부채로 막고 바깥(틈 쪽)을 보게
    let cx = 0, cy = 0, cz = 0; for (const i of ids) { cx += WM.p[i * 3]; cy += WM.p[i * 3 + 1]; cz += WM.p[i * 3 + 2]; } cx /= ids.length; cy /= ids.length; cz /= ids.length;
    const tgx = -Math.sin(TG), tgz = Math.cos(TG), ci = WM.v(cx - tgx * dirSign * -0.9, cy, cz - tgz * dirSign * -0.9, C3(0x5e5b56)), a = ids[0], b = ids[1];   // 가운데를 틈 쪽으로 불룩(납작한 판 X)
    const ex = WM.p[a * 3] - cx, ey = WM.p[a * 3 + 1] - cy, ez = WM.p[a * 3 + 2] - cz, fx = WM.p[b * 3] - cx, fy = WM.p[b * 3 + 1] - cy, fz = WM.p[b * 3 + 2] - cz;
    const nx = ey * fz - ez * fy, nz = ex * fy - ey * fx, tx = -Math.sin(TG), tz = Math.cos(TG);   // 접선(각이 커지는 쪽)
    const flip = (nx * tx + nz * tz) * dirSign < 0;
    for (let k = 0; k < ids.length - 1; k++) { if (flip) WM.tri(ci, ids[k + 1], ids[k]); else WM.tri(ci, ids[k], ids[k + 1]); }
  };
  capFan(cols2[0], -1); capFan(cols2[cols2.length - 1], 1);
  {  // 미끄러진 자국 — 남서 벽에 발톱 긁힘 둘 묶음(옅은 줄 셋씩) + 밑에 새 자갈
    const SCR = C3(0x4c4843), LIPC = C3(0xc9bfac);
    for (const [dth, y0, len] of [[-0.03, 1.0, 6.2], [0.014, 1.6, 7.0], [0.052, 0.8, 5.0]]) for (let l = 0; l < 4; l++) {
      const th0 = TC + dth + l * 0.006, pts = [];
      for (let k = 0; k <= 8; k++) { const fw = floorWall(th0), y = fw + y0 + len * k / 8, th = th0 + (1 - k / 8) * 0.026 + Math.sin(k * 0.9 + l) * 0.0015, R = Rm(th), [x, z] = P2(th, 1.0 + (bulge(th, y) - 0.1) / R); pts.push([x, y, z]); }   // 위에서 아래로 비스듬히 미끄러진 발톱 자국(검은 홈 + 밝은 턱)
      const ids = [];
      for (const [x, y, z] of pts) { const t = Math.atan2(z / RZ, x / RX), tx = -Math.sin(t) * 0.06, tz = Math.cos(t) * 0.06; ids.push([WM.v(x - tx, y, z - tz, SCR), WM.v(x + tx * 2.4, y + 0.02, z + tz * 2.4, LIPC)]); }
      for (let k = 0; k < ids.length - 1; k++) { WM.quad(ids[k][0], ids[k + 1][0], ids[k + 1][1], ids[k][1]); WM.quad(ids[k][0], ids[k][1], ids[k + 1][1], ids[k + 1][0]); }
    }
  }
  const wallG = WM.done((x, y, z, nx, ny, nz, c) => { if (y > 1.5 && y < 40) { if (ny > 0.32) mixc(c, MOSSW, sstep(0.32, 0.65, ny) * 0.8, c); else if (ny < -0.35) { c[0] *= 0.78; c[1] *= 0.78; c[2] *= 0.8; } } });   // 턱 위 = 이끼 · 처마 밑 = 어둡게
  B.put(wallG, ID, null, 'both', null, 0, 0);
  await NT.breathe();

  /* ── 원형 ── */
  const FIR = [0, 1, 2, 3].map((k) => NT.firGeo(1100 + k, { h: 12, tiers: 4, seg: 6, wide: 0.9 + (k % 3) * 0.08 })), FIR_MID = [0, 1].map((k) => NT.firGeo(1150 + k, { h: 12, tiers: 3, seg: 5 })), FIR_FAR = NT.firFarGeo({ h: 12 });
  const BIRCH = [0, 1, 2].map((k) => NT.birchGeo(1200 + k, { h: 10, lite: k === 2 })), BIRCH_L = [0, 1].map((k) => NT.birchGeo(1250 + k, { h: 10, lite: true })), BIRCH_FAR = NT.birchFarGeo({ h: 10 });
  const ROCK = [0, 1, 2, 3, 4].map((k) => NT.rockGeo(1300 + k, { flat: 0.55 + k * 0.07 })), PEBR = [0, 1, 2].map((k) => NT.rockGeo(1330 + k, { flat: 0.6, detail: 0 })), ROCK_BIG = [0, 1, 2].map((k) => NT.rockGeo(1350 + k, { detail: 2, flat: 0.72, sharp: 0.6 })), SLAB = [0, 1].map((k) => NT.rockGeo(1360 + k, { detail: 2, flat: 0.9, sharp: 0.75, moss: 0.4 })), CUSH = [NT.cushionGeo(1370), NT.cushionGeo(1371, { a: C3(0x46622e), b: C3(0x75924a) })];
  const FERN = [0, 1, 2].map((k) => NT.fernGeo(1400 + k));
  const GRASS = [0, 1, 2].map((k) => NT.grassGeo(1500 + k, { blades: 6, h: 0.45, base: C3(0x4f6a30), tip: C3(0xa4bc62) }));
  const FLOWER = NT.grassGeo(1510, { blades: 6, h: 0.4, base: C3(0x4f6a30), tip: C3(0x9fb860), seedHead: C3(0xf1ead2) }), FLOWER_Y = NT.grassGeo(1511, { blades: 5, h: 0.35, seedHead: C3(0xe8c860) });
  const REED = NT.grassGeo(1520, { blades: 9, h: 1.1, w: 0.03, base: C3(0x3f5a30), tip: C3(0x8a9a58) });
  const LOGS = [NT.logGeo(1600, { len: 9, r: 0.45 }), NT.logGeo(1601, { len: 13, r: 0.58 })];
  const tintOf = (k, a = 0.1) => { const m = 1 + (hash(k, 1) - 0.5) * a * 2; return [m, m * (1 + (hash(k, 2) - 0.5) * a), m * (1 + (hash(k, 3) - 0.5) * a)]; };
  const pillars = [], blockers = [], occTrees = [], busy = [[SAND.x, SAND.z, SAND.r + 0.5], [REST.x, REST.z, 4.5], [NIP.x, NIP.z, 3.5], [TLOW.x, TLOW.z, 4], [LAKE.x, LAKE.z, lakeR + 0.5]];
  const free = (x, z, r) => { for (const b of busy) if ((x - b[0]) ** 2 + (z - b[1]) ** 2 < (r + b[2]) ** 2) return false; return true; };
  const layerH = (x, z) => renderH(x, z);
  const fir = (x, z, s, k, o = {}) => { const y = layerH(x, z), yaw = hash(k, 7) * TAU, m = mat4(x, y - 0.2, z, yaw, s, s * (0.88 + hash(k, 8) * 0.28), s, o.tx ?? (hash(k, 9) - 0.5) * 0.07, o.tz ?? (hash(k, 10) - 0.5) * 0.07), t = tintOf(k, 0.1); B.put(o.mid ? FIR_MID[k % 2] : FIR[k % 4], m, t, 'near'); B.put(FIR_FAR, m, t, 'far'); occTrees.push([x, z, 1.8 * s, y + 9 * s]); };
  const birch = (x, z, s, k, o = {}) => { const y = layerH(x, z), yaw = hash(k, 7) * TAU, m = mat4(x, y - 0.1, z, yaw, s, s * (0.9 + hash(k, 8) * 0.25), s, o.tx ?? (hash(k, 9) - 0.5) * 0.12, o.tz ?? (hash(k, 10) - 0.5) * 0.12), t = tintOf(k, 0.08); B.put(o.lite ? BIRCH_L[k % 2] : BIRCH[k % 3], m, t, 'near'); B.put(BIRCH_FAR, m, t, 'far'); occTrees.push([x, z, 1.6 * s, y + 8 * s]); };
  const rock = (x, z, r, k, o = {}) => { const y = o.y ?? layerH(x, z), g = o.big ? ROCK_BIG[k % 3] : r < 0.5 ? PEBR[k % 3] : ROCK[k % 5]; B.put(g, mat4(x, y + (o.dy ?? -r * 0.2), z, hash(k, 3) * TAU, r * (0.85 + hash(k, 4) * 0.3), r * (o.sy || 0.9), r * (0.85 + hash(k, 5) * 0.3), (hash(k, 6) - 0.5) * 0.2, (hash(k, 7) - 0.5) * 0.2), o.tint || tintOf(k, 0.07), 'near'); };
  const put = (g, x, z, yaw, s, k, tint, y) => B.put(g, mat4(x, (y ?? layerH(x, z)) - 0.03, z, yaw, s, s * (0.8 + hash(k, 4) * 0.4), s), tint || null, 'near');

  /* ── 바닥 ── */
  {  // 쉬는 바위 — 넓고 윗면이 평평(투슬리스가 엎드림)
    const y = floorH(REST.x, REST.z);
    B.put(ROCK_BIG[0], mat4(REST.x, y - 0.35, REST.z, 0.5, 3.4, 1.15, 2.7), [1.02, 1.0, 0.96], 'near');
    blockers.push({ x: REST.x, z: REST.z, r: 2.9 }); pillars.push({ x: REST.x, z: REST.z, r: 3.2, top: +(y + 1.3).toFixed(2) });
  }
  const restTop = floorH(REST.x, REST.z) + 1.25;
  let branchTip = null;
  {  // 낮은 가지 나무 — 굵은 전나무 + 땅에서 3.6m에 옆으로 뻗은 굵은 가지(매달려 잠잘 자리)
    const y = floorH(TLOW.x, TLOW.z), a = -2.4, L = 4.6;
    B.put(FIR[1], mat4(TLOW.x, y - 0.2, TLOW.z, 0.3, 1.25, 1.2, 1.25), [0.95, 1.0, 0.98], 'near');
    const bm = new NT.Mesher(), BK = C3(0x4a3b30), BK2 = C3(0x5d4b3b);
    NT.tube(bm, [[0, 3.4, 0, 0.26, BK], [Math.cos(a) * L * 0.4, 3.7, Math.sin(a) * L * 0.4, 0.2, BK2], [Math.cos(a) * L * 0.8, 3.75, Math.sin(a) * L * 0.8, 0.14, BK], [Math.cos(a) * L, 3.95, Math.sin(a) * L, 0.07, BK2]], 6, BK2);
    B.put(bm.done(), mat4(TLOW.x, y, TLOW.z), null, 'near');
    branchTip = { x: +(TLOW.x + Math.cos(a) * L * 0.75).toFixed(2), y: +(y + 3.75).toFixed(2), z: +(TLOW.z + Math.sin(a) * L * 0.75).toFixed(2) };
    blockers.push({ x: TLOW.x, z: TLOW.z, r: 0.75 }); pillars.push({ x: TLOW.x, z: TLOW.z, r: 3.2, top: +(y + 14).toFixed(2) }); occTrees.push([TLOW.x, TLOW.z, 2.6, y + 11]);
  }
  [[-6, -22, 1.0], [4, -26, 0.85], [27, -17, 1.05], [-34, -13, 0.95], [-30, 19, 1.0], [12, 26, 0.9], [-8, 25, 1.1], [36, 12, 0.8], [-40, 2, 0.9]].forEach(([x, z, s], k) => {   // 자작나무
    if (!free(x, z, 2)) return; birch(x, z, s, k + 40); blockers.push({ x, z, r: 0.35 }); pillars.push({ x, z, r: 2.2 * s, top: +(floorH(x, z) + 10 * s).toFixed(2) }); busy.push([x, z, 2]);
  });
  [[-24, -24, 1.6], [20, -24, 1.2], [-2, 12, 0.9], [38, -6, 1.4], [-40, -4, 1.1], [26, 25, 1.3], [-14, -12, 0.7]].forEach(([x, z, r], k) => {   // 이끼 바위
    if (!free(x, z, r)) return; rock(x, z, r, k + 60, { big: r > 1.2 }); blockers.push({ x, z, r: r * 0.85 }); if (r > 1.2) pillars.push({ x, z, r: r * 1.1, top: +(floorH(x, z) + r * 0.7).toFixed(2) }); busy.push([x, z, r + 0.4]);
  });
  {  // 쓰러진 통나무(호숫가)
    const x = -2, z = -4, yaw = 2.6; B.put(LOGS[0], mat4(x, floorH(x, z) - 0.1, z, yaw, 1), [0.95, 0.95, 0.9], 'near');
    for (let s = 0.5; s < 9; s += 1) blockers.push({ x: +(x + Math.sin(yaw) * s).toFixed(2), z: +(z + Math.cos(yaw) * s).toFixed(2), r: 0.45 });
    busy.push([x + Math.sin(yaw) * 4.5, z + Math.cos(yaw) * 4.5, 5]);
  }
  /* 벽 밑 자갈 · 고사리 · 풀 · 꽃 · 물가 갈대 */
  for (let k = 0; k < 360; k++) {
    const th = hash(k, 71) * TAU - Math.PI; if (Math.abs(wrap(th - TG)) < DG + 0.03) continue;
    const s = 0.93 + hash(k, 72) * 0.065, [x, z] = P2(th, s);
    if (hash(k, 73) < 0.55) rock(x, z, 0.25 + hash(k, 74) * 0.55, k + 100, { y: floorH(x, z), tint: [0.95, 0.94, 0.9] });
    else if (hash(k, 73) < 0.8 && s < 0.965) put(FERN[k % 3], x, z, hash(k, 75) * TAU, 0.8 + hash(k, 76) * 0.5, k, [0.95, 1, 0.95]);
  }
  for (let k = 0; k < 3000; k++) {
    const th = hash(k, 81) * TAU - Math.PI, s = Math.sqrt(hash(k, 82)) * 0.93, [x, z] = P2(th, s);
    const dl = Math.hypot(x - LAKE.x, z - LAKE.z), dsd = Math.hypot(x - SAND.x, z - SAND.z);
    if (dl < lakeR + 0.6) { if (dl > lakeR - 1.2 && hash(k, 83) < 0.45) put(REED, x, z, hash(k, 84) * TAU, 0.8 + hash(k, 85) * 0.5, k, null, Math.max(WATER_Y, floorH(x, z))); continue; }
    if (dsd < SAND.r + 0.5 || !free(x, z, 0.2)) continue;
    const r = hash(k, 86);
    if (r < 0.06) put(r < 0.03 ? FLOWER : FLOWER_Y, x, z, hash(k, 84) * TAU, 0.9, k);
    else if (r > 0.92) { const q = 0.35 + hash(k, 87) * 0.5; B.put(CUSH[k % 2], mat4(x, floorH(x, z), z, hash(k, 88) * TAU, q, 0.8 + hash(k, 89) * 0.5, q * (0.7 + hash(k, 90) * 0.5)), tintOf(k, 0.08), 'near'); }
    else if (r < 0.1 && s > 0.6) put(FERN[k % 3], x, z, hash(k, 84) * TAU, 0.7 + hash(k, 85) * 0.4, k);
    else put(GRASS[k % 3], x, z, hash(k, 84) * TAU, 0.8 + hash(k, 85) * 0.6, k, tintOf(k, 0.08));
  }
  for (let k = 0; k < 14; k++) { const a = hash(k, 91) * TAU, r = SAND.r + 0.3 + hash(k, 92) * 1.2, x = SAND.x + Math.cos(a) * r, z = SAND.z + Math.sin(a) * r; rock(x, z, 0.16 + hash(k, 93) * 0.22, k + 300, { tint: [1.05, 1.03, 0.98] }); }   // 모래 마당 둘레 조약돌
  {  // 입구 틈 — 틈 낯에 박힌 바위 · 꼭대기에 걸친 쓰러진 나무 · 바닥 쪽 기운 통나무
    for (const e of [-1, 1]) for (let k = 0; k < 2; k++) { const th = TG + e * (DG + 0.012), s = 1.0 + k * 0.06, [x, z] = P2(th, s), fw = floorH(x, z); B.put(SLAB[(k + (e > 0 ? 1 : 0)) % 2], mat4(x, fw + 0.6 + k * 1.2, z, TG + Math.PI / 2 + (hash(k, e + 5) - 0.5) * 0.4, 1.0 + hash(k, e + 6) * 0.5, 1.6 + k * 0.5, 0.9), [0.9, 0.9, 0.87], 'near'); }   // 틈 밑동에 기댄 납작 바위
    const [bx, bz] = P2(TG, 1.04), yb = yTop(TG) - 1.6, yaw = TG + Math.PI / 2 + 0.25;
    B.put(LOGS[1], mat4(bx - Math.sin(yaw) * 6.5, yb, bz - Math.cos(yaw) * 6.5, yaw, 1, 1, 1, 0.06, 0.04), null, 'near');
    const [lx, lz] = P2(TG + 0.085, 0.935), lyaw = Math.atan2(-RX * Math.sin(TG + 0.085), RZ * Math.cos(TG + 0.085));   // 틈 옆 벽을 따라 누움(드나드는 길은 비움)
    B.put(LOGS[0], mat4(lx, floorH(lx, lz) + 0.1, lz, lyaw, 0.9, 0.9, 0.9, -0.12, 0), [0.9, 0.9, 0.85], 'near');
    for (let s = 0.5; s < 7.5; s += 1) blockers.push({ x: +(lx + Math.sin(lyaw) * s).toFixed(2), z: +(lz + Math.cos(lyaw) * s).toFixed(2), r: 0.42 });
    for (let k = 0; k < 26; k++) { const th = TG + (hash(k, 95) - 0.5) * 0.42, s = 1.16 + hash(k, 96) * 0.7, [x, z] = P2(th, s); if (Math.abs(wrap(th - TG)) < DG + 0.05 && s < 1.42) continue; if (hash(k, 98) < 0.3) birch(x, z, 0.8 + hash(k, 97) * 0.3, k + 900, { lite: true }); else fir(x, z, 0.65 + hash(k, 97) * 0.45, k + 900); }   // 틈 밖 골짜기 = 나무가 선 비탈(틈으로 숲이 보임)
    {  // 주머니 끝 = 쓰러진 나무 + 덤불(여기서 막힘이 그림으로 보이게)
      const ts = 1.47, [ex, ez] = P2(TG, ts), tyaw = Math.atan2(-RX * Math.sin(TG), RZ * Math.cos(TG)), BUSHC = [NT.bushGeo(1380, { n: 3 }), NT.bushGeo(1381, { n: 2 })];
      B.put(LOGS[1], mat4(ex - Math.sin(tyaw) * 6.5, renderH(ex, ez) + 0.15, ez - Math.cos(tyaw) * 6.5, tyaw, 1, 1, 1, 0, 0.05), null, 'both');
      for (let k = 0; k < 6; k++) { const th = TG + (k - 2.5) * 0.035, [bx, bz] = P2(th, ts + 0.04 + hash(k, 131) * 0.04); B.put(BUSHC[k % 2], mat4(bx, renderH(bx, bz) - 0.15, bz, hash(k, 132) * TAU, 1.3 + hash(k, 133) * 0.6, 1.0 + hash(k, 134) * 0.5, 1.3), tintOf(k, 0.1), 'near'); }
    }
    for (let k = 0; k < 14; k++) { const th = TG + (hash(k, 99) - 0.5) * 0.16, s = 1.12 + hash(k, 100) * 0.3, [x, z] = P2(th, s); if (Math.abs(wrap(th - TG)) < DG && s < 1.36 && hash(k, 101) < 0.6) continue; put(FERN[k % 3], x, z, hash(k, 102) * TAU, 0.8 + hash(k, 103) * 0.5, k + 950, null, renderH(x, z)); }
  }
  /* ── 위 가장자리 — 숲(가장자리엔 코브 쪽으로 기운 나무 = 바닥에서 올려다본 실루엣) · 길 · 숨을 바위 셋 ── */
  const rimIn = (th) => 1.0 + 1.0 / Rm(th), rimOut = (th) => 1.0 + 6.2 / Rm(th);
  const conn = [P2(TH1 + 0.005, 1.0 + 4 / Rm(TH1)), P2(TH1 + 0.04, 1.17), P2(TH1 + 0.07, 1.3)];
  const rimVal = (x, z) => {
    const p = polar(x, z), th = p.th, R = p.R;
    const strip = Math.max((rimIn(th) - p.s) * R, (p.s - rimOut(th)) * R, Math.max(th - TH1, TH2 - th) * R);
    return Math.min(strip, NT.polyDist(conn, x, z) - 2.0);
  };
  const inRim = (x, z, m = 0) => rimVal(x, z) < m;
  const watch = [];
  WATCH_TH.forEach((th, k) => {
    const R = Rm(th), [rx, rz] = P2(th, 1.0 + 0.7 / R), y = yTop(th);
    B.put(ROCK_BIG[k % 3], mat4(rx, y - 0.25, rz, th + k, 1.3, 1.2, 1.0), [1, 0.98, 0.95], 'near');
    blockers.push({ x: +rx.toFixed(2), z: +rz.toFixed(2), r: 1.1 });
    const [wx, wz] = P2(th, 1.0 + 3.1 / R);
    watch.push({ x: +wx.toFixed(2), y: +RG.at(wx, wz).toFixed(3), z: +wz.toFixed(2), yaw: +Math.atan2(-wx, -wz).toFixed(4) });
  });
  for (let k = 0; k < 1150; k++) {
    const th = hash(k, 101) * TAU - Math.PI, s = 1.1 + hash(k, 102) ** 1.45 * 1.35, [x, z] = P2(th, s), dg = Math.abs(wrap(th - TG));
    if (dg < DG + 0.17 && s < 1.66) continue;
    if (rimVal(x, z) < 1.4) continue;
    const near = s < 1.22, r = hash(k, 103);
    if (r < (near ? 0.5 : 0.36)) {
      const sc = 0.8 + hash(k, 104) * 0.5, lean = near && s < 1.14 ? 0.1 : 0, lx = -Math.cos(th) * lean, lz = -Math.sin(th) * lean;   // 가장자리 나무는 코브 쪽으로 기욺
      if (hash(k, 105) < 0.2) birch(x, z, sc * 0.95, k + 2000, lean ? { tx: lz * 1.2, tz: -lx * 1.2, lite: true } : { lite: true }); else fir(x, z, sc, k + 2000, lean ? { tx: lz, tz: -lx } : { mid: s > 1.4 });
    } else if (r < 0.62) put(FERN[k % 3], x, z, hash(k, 106) * TAU, 0.8 + hash(k, 107) * 0.5, k + 2000);
    else if (r < 0.68) rock(x, z, 0.4 + hash(k, 108) * 1.0, k + 2000);
  }
  for (let k = 0; k < 500; k++) {                         // 가장자리 길 풀
    const th = TH2 + hash(k, 111) * (TH1 - TH2), s = rimIn(th) + hash(k, 112) * (rimOut(th) - rimIn(th)), [x, z] = P2(th, s);
    put(hash(k, 113) < 0.08 ? FLOWER_Y : GRASS[k % 3], x, z, hash(k, 114) * TAU, 0.7 + hash(k, 115) * 0.5, k + 3000, [0.95, 0.97, 0.9], RG.at(x, z));
  }
  await NT.breathe();

  /* ── 해 그늘 굽기(낮·노을) — 가리는 높이 = 땅 + 벽 위 + 가장자리 나무 ── */
  const T = TIMES[time];
  if (time === 'day' || time === 'sunset' || time === 'dawn' || time === 'clear') {
    const OG = NT.createGrid(-126, -100, 1.5, 169, 135).fill((x, z) => { const p = polar(x, z); return p.s >= 0.995 && p.s < 1.09 && !(p.dg < DG && p.s < 1.62) ? yTop(p.th) : p.s > 1.4 ? Math.min(renderH(x, z), yTop(p.th) + 1.5) : renderH(x, z); });   // 먼 둘레 언덕은 가리지 않음(해가 낮아도 벽 위는 빛)
    /* 가장자리 나무는 빛이 사이로 새므로 가리지 않음(occTrees는 남겨 둠) → 노을 그늘선이 벽 가운데쯤 = 벽 위쪽만 빛 */
    if (opt.treeShade) for (const [x, z, r, top] of occTrees) { const i0 = Math.floor((x - r + 126) / 1.5), i1 = Math.ceil((x + r + 126) / 1.5), j0 = Math.floor((z - r + 100) / 1.5), j1 = Math.ceil((z + r + 100) / 1.5); for (let j = Math.max(0, j0); j <= Math.min(134, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(168, i1); i++) { const k = j * 169 + i; if (OG.h[k] < top) OG.h[k] = top; } }
    const sd = new THREE.Vector3(...T.sunDir).normalize(), shade = NT.sunShade(OG, [sd.x, sd.y, sd.z], { step: 1.5, max: 240, soft: 1.8, top: 50 });
    const SH = time === 'sunset' ? [0.46, 0.5, 0.72] : [0.6, 0.64, 0.78];
    B.repaint((x, y, z, nx, ny, nz, c) => {
      const ndl = nx * sd.x + ny * sd.y + nz * sd.z; if (ndl < 0.02) return;
      const v = shade(x, y, z); if (v >= 1) return;
      const k = (1 - v) * sstep(0.02, 0.25, ndl);
      c[0] *= 1 - (1 - SH[0]) * k; c[1] *= 1 - (1 - SH[1]) * k; c[2] *= 1 - (1 - SH[2]) * k;
    });
  }
  const meshes = B.build(group, 72);

  /* ── 드래곤 풀(따로 · 켜고 끔) · 호수 물 ── */
  const nipM = new NT.Mesher(), nipG = NT.nipGeo(1700);
  for (let k = 0; k < 8; k++) {
    const a = hash(k, 121) * TAU, r = k ? 0.8 + hash(k, 122) * 1.8 : 0, x = NIP.x + Math.cos(a) * r, z = NIP.z + Math.sin(a) * r, y = floorH(x, z) - 0.03, s = 0.8 + hash(k, 123) * 0.5, m = mat4(x, y, z, hash(k, 124) * TAU, s, s, s);
    const e = m.elements, base = nipM.n;
    for (let v = 0; v < nipG.nv; v++) { const px = nipG.pos[v * 3], py = nipG.pos[v * 3 + 1], pz = nipG.pos[v * 3 + 2]; nipM.vn(e[0] * px + e[4] * py + e[8] * pz + e[12], e[1] * px + e[5] * py + e[9] * pz + e[13], e[2] * px + e[6] * py + e[10] * pz + e[14], [nipG.col[v * 3], nipG.col[v * 3 + 1], nipG.col[v * 3 + 2]], (e[0] * nipG.nor[v * 3] + e[4] * nipG.nor[v * 3 + 1] + e[8] * nipG.nor[v * 3 + 2]) / s, (e[1] * nipG.nor[v * 3] + e[5] * nipG.nor[v * 3 + 1] + e[9] * nipG.nor[v * 3 + 2]) / s, (e[2] * nipG.nor[v * 3] + e[6] * nipG.nor[v * 3 + 1] + e[10] * nipG.nor[v * 3 + 2]) / s); }   // 법선도 같이 돌림(크기는 고름)
    for (let i = 0; i < nipG.idx.length; i += 3) nipM.tri(base + nipG.idx[i], base + nipG.idx[i + 1], base + nipG.idx[i + 2]);
  }
  const nipMesh = new THREE.Mesh(toGeo(nipM.done()), toon({ vc: true, emissive: 0x0b2624 }));
  nipMesh.matrixAutoUpdate = false; group.add(nipMesh);
  const wcol = time === 'sunset' ? { deep: 0x2a3448, shallow: 0x6a6a74, edge: 0xd8b8a0, sky: T.mid } : time === 'overcast' ? { deep: 0x2a403e, shallow: 0x587670, edge: 0xb0c0b8, sky: T.mid } : { deep: 0x1f4c4c, shallow: 0x4f8c82, edge: 0xc0dccc, sky: T.mid };
  const lakeMesh = new THREE.Mesh(NT.lakeGeo(LAKE.x, LAKE.z, lakeR, WATER_Y, (x, z) => floorH(x, z)), NT.waterMat(wcol));
  lakeMesh.matrixAutoUpdate = false; group.add(lakeMesh);

  /* ── 벽 선분 — 바닥 / 가장자리를 1m 마칭 스퀘어로 ── */
  const ravine = [P2(TG, 0.88), P2(TG, 0.97), P2(TG, 1.1), P2(TG, 1.22), P2(TG, 1.34)];
  const floorVal = (x, z) => {
    const p = polar(x, z), inCove = (p.s - 0.962) * p.R;
    const q = {}; const dr = NT.polyDist(ravine, x, z, q), t = q.t / (ravine.length - 1), hw = t < 0.25 ? 3.0 - t * 5 : t < 0.55 ? 1.75 : 1.75 + (t - 0.55) * 4.5;
    const inGap = dr - hw, dl = Math.hypot(x - LAKE.x, z - LAKE.z);
    return Math.max(Math.min(inCove, inGap), (lakeR - 1.5) - dl);
  };
  const wallsFrom = (fn, x0, z0, nx, nz) => { const v = new Float32Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = fn(x0 + i, z0 + j); return NT.contourWalls(v, x0, z0, 1, nx, nz); };
  const walls = [...wallsFrom(floorVal, -50, -40, 111, 82), ...wallsFrom(rimVal, -60, -50, 127, 54)];

  /* ── 이름 자리 · 목록 ── */
  const A = (x, z, yaw, y) => ({ x: +x.toFixed(2), y: +(y ?? FG.at(x, z)).toFixed(3), z: +z.toFixed(2), yaw: +yaw.toFixed(4) });
  const toC = (x, z) => Math.atan2(-x, -z);                // 가운데를 보는 앞
  const [gix, giz] = P2(TG, 0.86), [gox, goz] = P2(TG, 1.3), [cwx, cwz] = P2(TC, 0.9), [cw1x, cw1z] = P2(TC, 1.0);
  const ld = Math.hypot(4 - LAKE.x, 4 - LAKE.z), lsx = LAKE.x + (4 - LAKE.x) / ld * (lakeR + 1.2), lsz = LAKE.z + (4 - LAKE.z) / ld * (lakeR + 1.2);
  const [rsx, rsz] = conn[2], rimEnd = P2(TH1, 1.0 + 3.5 / Rm(TH1));
  const anchors = {
    rim_start: A(rsx, rsz, Math.atan2(rimEnd[0] - rsx, rimEnd[1] - rsz), RG.at(rsx, rsz)),
    gap_out: A(gox, goz, Math.atan2(gix - gox, giz - goz)),
    gap_in: A(gix, giz, toC(gix, giz)),
    floor: A(4, 4, toC(4, 4) + Math.PI * 0.2),
    sand: A(SAND.x, SAND.z, toC(SAND.x, SAND.z)),
    lake: A(LAKE.x, LAKE.z, 0, WATER_Y),
    lake_shore: A(lsx, lsz, Math.atan2(LAKE.x - lsx, LAKE.z - lsz)),
    climb_wall: A(cwx, cwz, Math.atan2(cw1x - cwx, cw1z - cwz)),
    nip: Object.assign(A(NIP.x, NIP.z, toC(NIP.x, NIP.z)), { show: (on) => { nipMesh.visible = !!on; } }),
    rest_rock: Object.assign(A(REST.x, REST.z, -2.2, restTop), { ground: +floorH(REST.x, REST.z).toFixed(3) }),
    tree_low: Object.assign(A(TLOW.x, TLOW.z, -2.4), { branch: branchTip }),
  };
  const lists = { rim_watch: watch };
  const lake = { x: LAKE.x, z: LAKE.z, r: +lakeR.toFixed(2), y: WATER_Y };
  const topAvg = (() => { let s = 0; for (let k = 0; k < 64; k++) s += yTop(k / 64 * TAU); return s / 64; })();
  const flyGround = (x, z) => { const h = FG.at(x, z); return Math.hypot(x - LAKE.x, z - LAKE.z) < lakeR ? Math.max(h, WATER_Y) : h; };
  const info = { buildMs: Math.round(performance.now() - T0), walls: walls.length, blockers: blockers.length, tris: Math.round(B.tris), chunks: meshes.length, lakeR: lake.r, topAvg: +topAvg.toFixed(1) };
  const o = {}, rimPath = [], tv = new THREE.Vector3();
  for (let k = 0; k <= 40; k++) { const th = TH1 - (TH1 - TH2) * k / 40; rimPath.push(P2(th, 1.0 + 2.6 / Rm(th))); }

  return {
    name: 'cove',
    group, height, blockers, walls, bound: null,
    anchors, lists, lake, info, nip: nipMesh,
    ceil: undefined,
    fly: { ground: flyGround, pillars, ceil: +(topAvg + 8).toFixed(1), bounds: { x: 0, z: 0, rx: RX - 2, rz: RZ - 2 } },
    step() {},
    draw() {},
    dispose() { if (env.sea) env.sea.visible = true; },
    benchPath(t) {                                    // 0~22초 가장자리 길 · 22~60초 바닥을 한 바퀴(호수·모래 마당을 봄)
      const c = ctx.camera;
      if (t < 22) {
        NT.polyAt(rimPath, t / 22 * NT.polyLen(rimPath), o); const x = o.x, z = o.z;
        c.position.set(x, RG.at(x, z) + 2.2, z); tv.set(x * 0.2, 2, z * 0.2); c.lookAt(tv);
      } else {
        const k = (t - 22) / 38, a = -1.2 + k * TAU, x = Math.cos(a) * RX * 0.62, z = Math.sin(a) * RZ * 0.62;
        c.position.set(x, FG.at(x, z) + 2.4, z); tv.set(LAKE.x * 0.4 - Math.sin(a) * 12, 1.5, LAKE.z * 0.4 + Math.cos(a) * 12); c.lookAt(tv);
      }
    },
  };
}

function toGeo(g) {
  const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(g.pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(g.nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(g.col, 3)); G.setIndex(new THREE.BufferAttribute(g.idx, 1)); G.computeBoundingSphere(); return G;
}
