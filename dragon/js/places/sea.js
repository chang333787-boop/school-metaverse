// 바다 돌기둥(4장 고기잡이배 · 6장 첫 바다 비행·돌기둥 점심) — 장소 계약 = docs/dragon/stage3_plan.md §2·§3 sea
// 넓은 바다는 kit의 env.sea를 그대로 씀(setTime·sea.visible만) · 멀리 버크 섬 실루엣 + 마을 불빛 · 깎은 돌기둥(층 결 · 세로 홈 · 꼭대기 풀 · 밑동 물거품 띠) · 아치 · 점심 돌기둥
// 관문은 '빨간 선·빛기둥' 없이 돌기둥 사이 틈 자체가 길 — 확인 자리에만 갈매기 떼(다음 관문 둘 위를 돎 · 지나면 흩어짐)
// 자리는 장소 고정 난수로(게임 씨앗과 따로 — 씨앗이 바뀌어도 코스는 같음) · 그리기 ≤ 110 · 삼각형 ≤ 25만 · 텍스처 2장(구름·불빛)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, setTime, TIMES, U } from '../look/kit.js?v=14';
import { createRng } from '../core/rng.js?v=14';
import { createNoise } from '../core/noise.js?v=14';

/* 코스 — 출발(공중) → 관문 열둘: [x, z, y, 'arch'] · 꼬리 자리는 들어오고 나가는 방향으로 셈 */
const SPAWN = { x: 0, y: 30, z: -548, yaw: 0 };
const GP = [[0, -430, 26], [-52, -330, 22], [-36, -222, 17, 'arch'], [38, -148, 26], [96, -52, 33], [72, 52, 22], [-6, 122, 15], [-86, 204, 24], [-56, 306, 32, 'arch'], [36, 356, 28], [64, 262, 24], [138, 196, 28]];
const GATE_R = 9;                      // 관문 반지름(쉬움은 비행 엔진이 1.55배)
const LUNCH = { x: 232, z: 206, top: 38, r: 16 };
const DOCK = { x: -70, z: -505 }, FISH = { x: -184, z: -302 };
const BOAT = [[-70, -505], [-92, -462], [-118, -420], [-146, -378], [-168, -338], [-184, -302]];
const BOUNDS = { x: 40, z: -90, r: 680 };

const C = (h) => new THREE.Color(h);
const ROCK_A = C(0x857e72), ROCK_B = C(0x6a655d), LEDGE = C(0xa59c8a), ROCK_D = C(0x4a4743), WET = C(0x363b3a), FOAM = C(0xe6ecea), GRASS = C(0x6f8d48), GRASS2 = C(0x5a7a3a), TURF = C(0x4d5a34), GULL = C(0xf4f1ea), GULL_T = C(0x3a3c40);

export async function buildPlace(ctx) {
  const { group, env, opt = {} } = ctx;
  const time = TIMES[opt.time] ? opt.time : 'clear';
  setTime(env, time); env.sea.visible = true;
  const R = createRng(9157), N = createNoise(23);
  const tmp = new THREE.Color();

  /* ── 관문 ── */
  const course = GP.map(([x, z, y, kind], i) => ({ x, y, z, r: GATE_R, tail: 1, arch: kind === 'arch', i }));
  const segYaw = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  course.forEach((g, i) => {
    const p = i ? course[i - 1] : SPAWN, n = course[i + 1];
    const yin = segYaw(p, g), yout = n ? segYaw(g, n) : yin, turn = Math.atan2(Math.sin(yout - yin), Math.cos(yout - yin));
    const drop = n ? n.y - g.y : 0;
    g.tail = Math.abs(turn) > 1.35 || drop < -14 ? 4 : turn > 0.45 ? 2 : turn < -0.45 ? 3 : 1;   // 왼쪽으로 돎 = 2 · 오른쪽 = 3 · 머리핀·급강하 = 4
    g.yaw = Math.atan2(Math.sin(yin) + Math.sin(yout), Math.cos(yin) + Math.cos(yout));   // 지나는 면의 방향(들어옴·나감 사이)
    g.px = -Math.cos(g.yaw); g.pz = Math.sin(g.yaw);     // 오른쪽 방향
  });
  const poly = [SPAWN, ...course];
  const segDist = (x, z, a, b) => { const ex = b.x - a.x, ez = b.z - a.z, L = ex * ex + ez * ez; let t = ((x - a.x) * ex + (z - a.z) * ez) / L; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(x - a.x - ex * t, z - a.z - ez * t); };
  const pathDist = (x, z) => { let d = 1e9; for (let i = 0; i < poly.length - 1; i++) d = Math.min(d, segDist(x, z, poly[i], poly[i + 1])); return d; };
  const boatPts = BOAT.map(([x, z]) => ({ x, z }));
  const boatDist = (x, z) => { let d = 1e9; for (let i = 0; i < boatPts.length - 1; i++) d = Math.min(d, segDist(x, z, boatPts[i], boatPts[i + 1])); return d; };

  /* ── 돌기둥 자리 ── kind: gate 관문 옆 · wall 길 따라 · far 먼 곳 · fish 고기잡이 · lunch 점심 */
  const P = [];
  const fits = (x, z, r, gap = 14) => { for (const q of P) if (Math.hypot(q.x - x, q.z - z) < q.r + r + gap) return false; return true; };
  const arches = [];
  for (const g of course) {
    if (g.arch) {
      const rb = 6.5, rt = 4.4, hw = 13.5 + rb, yc = g.y + 9.5 + rt;
      arches.push({ g, x: g.x, z: g.z, hw, rb, yc, rt, depth: 1.55, yaw: Math.atan2(-g.pz, g.px) });
      g.piv = [P.length, P.length + 1];
      P.push({ x: g.x + g.px * hw, z: g.z + g.pz * hw, r: rb * 1.2, top: yc, kind: 'leg', vis: false });
      P.push({ x: g.x - g.px * hw, z: g.z - g.pz * hw, r: rb * 1.2, top: yc, kind: 'leg', vis: false });
      continue;
    }
    g.piv = [];
    for (const s of [1, -1]) {
      const r = 7 + R() * 5.5, gap = 13.5 + R() * 3;
      g.piv.push(P.length);
      P.push({ x: g.x + g.px * s * (gap + r), z: g.z + g.pz * s * (gap + r), r, top: g.y + 28 + R() * 46, kind: 'gate', vis: true });
    }
  }
  P.push({ x: LUNCH.x, z: LUNCH.z, r: LUNCH.r + 1.5, top: LUNCH.top, kind: 'lunch', vis: true });
  P.push({ x: -214, z: -290, r: 11, top: 70, kind: 'fish', vis: true });
  P.push({ x: -163, z: -262, r: 8, top: 46, kind: 'fish', vis: true });
  /* 길 따라 벽처럼(복도 느낌) → 먼 곳 · 길·뱃길·출발을 비켜서 */
  const okPlace = (x, z, r) => Math.hypot(x - BOUNDS.x, z - BOUNDS.z) < BOUNDS.r - 40 && pathDist(x, z) > r + 24 && boatDist(x, z) > r + 16 && Math.hypot(x - SPAWN.x, z - SPAWN.z) > r + 50 && Math.hypot(x - FISH.x, z - FISH.z) > r + 14;
  let tries = 0, walls = 0;
  while (walls < 11 && tries++ < 1200) {
    const i = R.int(0, poly.length - 2), a = poly[i], b = poly[i + 1], t = R(), side = R() < 0.5 ? 1 : -1;
    const yw = segYaw(a, b), off = 34 + R() * 34, r = 8 + R() * 7;
    const x = a.x + (b.x - a.x) * t - Math.cos(yw) * side * off, z = a.z + (b.z - a.z) * t + Math.sin(yw) * side * off;
    if (okPlace(x, z, r) && fits(x, z, r, 16)) { P.push({ x, z, r, top: 40 + R() * 55, kind: 'wall', vis: true }); walls++; }
  }
  for (let sec = 0; sec < 6; sec++) {                     // 먼 곳: 방향 여섯 칸에 하나씩(어느 쪽을 봐도 수평선이 비지 않게)
    for (let k = 0; k < 300; k++) {
      const a = (sec + R()) / 6 * Math.PI * 2, d = 200 + R() * 380, x = BOUNDS.x + Math.cos(a) * d, z = BOUNDS.z + Math.sin(a) * d, r = 10 + R() * 9;
      if (okPlace(x, z, r) && pathDist(x, z) > r + 55 && fits(x, z, r, 30)) { P.push({ x, z, r, top: 50 + R() * 70, kind: 'far', vis: true }); break; }
    }
  }

  /* ── 돌기둥 모양: 깎은 돌 — 갈래 넷(곧은 탑 · 넓은 밑동 · 허리 팬 것 · 타원) · 층마다 튀어나온 턱(밝은 윗면 + 어두운 밑) · 세로 홈 · 정점색(층 결 · 젖은 밑동 · 물거품 띠 · 꼭대기 풀) ── */
  const SEG = 26;
  const KINDS = ['tower', 'tower', 'stack', 'stack', 'notch', 'oval'];
  function stackGeo(p, seed) {
    const top = p.top, rr = p.kind === 'lunch' ? LUNCH.r + 1.5 : p.r;
    const shape = p.kind === 'lunch' ? 'tower' : p.kind === 'fish' ? 'stack' : KINDS[Math.floor(N.v2(seed * 3.3, 0.5) * 5.99)];
    const ox = shape === 'oval' ? 1.2 : 1, oz = shape === 'oval' ? 0.84 : 1, oa = seed * 2.1;       // 타원(돌려 놓음)
    const bandH = 6 + N.v2(seed, 9) * 5;
    const ys = [-9, -1.6, -0.4, 0.8, 2.2, 4];
    const n = Math.max(9, Math.round((top - 7) / 3.4));
    for (let i = 1; i <= n; i++) ys.push(4 + (top - 7.5) * i / n);
    const lip = p.kind === 'lunch' ? [[top - 1.6, 0.96], [top - 0.6, 1.0], [top - 0.05, 1.03], [top + 0.25, 0.9], [top + 0.4, 0.55], [top + 0.45, 0.01]] : [[top - 1.6, 0.92], [top - 0.7, 0.98], [top - 0.1, 1.03], [top + 0.3, 0.82], [top + 0.8, 0.45], [top + 1.05, 0.01]];
    const rings = ys.map((y) => [y, null]).concat(lip);
    const prof = (h) => shape === 'stack' ? 1.32 - 0.5 * h : shape === 'notch' ? 1.06 - 0.08 * h - 0.2 * Math.exp(-Math.pow((h - 0.5) / 0.13, 2)) : 1.1 - 0.18 * h;
    const nv = rings.length * (SEG + 1), pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = [];
    let sumR = 0, cntR = 0, maxR = 0;
    rings.forEach(([y, lipK], ri) => {
      const h = Math.max(0, Math.min(1, y / top));
      const fr = ((y / bandH + seed * 1.7) % 1 + 1) % 1;                    // 층 안 자리: 0 = 턱(튀어나옴) → 1 = 다음 턱 밑(들어감)
      const ledge = 1 + (fr < 0.12 ? 0.07 * fr / 0.12 : 0.07 * (1 - (fr - 0.12) / 0.88)) - 0.035;
      const bulge = 1 + (N.v2(y * 0.035 + seed * 5, seed * 2.3) - 0.5) * 0.26;
      let base = rr * (y < 1.5 ? prof(0) * 1.08 : prof(h)) * (lipK ? 1 : ledge * bulge);
      if (lipK) base = rr * prof(1) * lipK;
      for (let s = 0; s <= SEG; s++) {
        const a = s / SEG * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const groove = (N.v2(ca * 3.1 + seed * 7, sa * 3.1 + y * 0.012) - 0.5) * 0.34;   // 세로 홈(y로는 천천히 변함)
        const knob = (N.v2(ca * 1.3 + y * 0.06, sa * 1.3 + seed) - 0.5) * 0.22;
        const k = lipK ? 1 + groove * 0.25 : 1 + groove + knob;
        const r = base * k, o = (ri * (SEG + 1) + s) * 3;
        const lx = ca * r * ox, lz = sa * r * oz, co = Math.cos(oa), so = Math.sin(oa);
        pos[o] = lx * co - lz * so; pos[o + 1] = y; pos[o + 2] = lx * so + lz * co;
        if (y > 6 && y < Math.min(top - 2, 52)) { const rh = Math.hypot(pos[o], pos[o + 2]); sumR += rh; cntR++; if (rh > maxR) maxR = rh; }
        /* 색: 층 결 · 턱 윗면은 밝게 · 턱 밑·홈은 어둡게 · 젖은 밑동 · 물거품 띠 · 풀 */
        const st = 0.5 + 0.5 * Math.sin(y * 0.62 + N.v2(ca * 2 + seed, sa * 2 + y * 0.08) * 4);
        tmp.copy(ROCK_A).lerp(ROCK_B, st);
        if (!lipK) { if (fr < 0.1) tmp.lerp(LEDGE, 0.55); else if (fr > 0.82) tmp.lerp(ROCK_D, 0.45); }
        tmp.lerp(ROCK_D, Math.max(0, -(groove + knob)) * 1.6);
        if (y < 3.2) tmp.lerp(WET, Math.min(1, (3.2 - y) / 2.6) * 0.75);
        if (y > -0.9 && y < 1.5) { const fn = N.v2(ca * 4 + seed * 3, sa * 4 + y); if (fn > 0.42) tmp.lerp(FOAM, Math.min(1, (fn - 0.42) * 3.5) * (1 - Math.abs(y - 0.3) / 1.3)); }
        if (lipK) {
          const wx = pos[o] + p.x, wz = pos[o + 2] + p.z;
          if (y >= top - 0.12) tmp.copy(GRASS).lerp(GRASS2, N.v2(wx * 0.18, wz * 0.18) * 0.8 + N.v2(wx * 0.9, wz * 0.9) * 0.2);
          else if (y > top - 1.7 && N.v2(ca * 5 + seed * 2, sa * 5) > 0.35) tmp.copy(TURF);
        } else if (y > top - 6 && N.v2(ca * 6 + seed, sa * 6 + y * 0.3) > 0.58) tmp.lerp(TURF, 0.65);   // 풀이 흘러내림
        else if (fr < 0.1 && y > 8 && N.v2(ca * 7 + seed, sa * 7 + y) > 0.62) tmp.lerp(GRASS2, 0.5);     // 턱 위 풀 한 줌
        tmp.multiplyScalar(0.94 + N.v2(ca * 9 + y * 0.2, sa * 9) * 0.12);
        col[o] = tmp.r; col[o + 1] = tmp.g; col[o + 2] = tmp.b;
      }
    });
    for (let ri = 0; ri < rings.length - 1; ri++) for (let s = 0; s < SEG; s++) {
      const a = ri * (SEG + 1) + s, b = a + 1, c = a + SEG + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
    g.computeVertexNormals();
    g.translate(p.x, 0, p.z);
    if (cntR && p.kind !== 'lunch') p.r = sumR / cntR * 0.5 + maxR * 0.5;   // 부딪힘 반지름 = 나는 높이(6~52m)에서 보이는 것에 맞춤
    p.shape = shape; p.rTop = rr * prof(1);
    return g;
  }

  /* ── 아치: 자연 바다 아치 — 굵은 두 다리 + 무거운 윗돌(비행 방향으로 두꺼움 · 층 결 · 풀 덮인 등) · 다리는 충돌 원기둥 · 윗돌은 비행 엔진 arches ── */
  function archGeo(A, seed) {
    const hw = A.hw, yc = A.yc, as = (N.v2(seed, 3) - 0.5) * 0.12;      // 조금 비대칭
    const pts = [[-hw, -9], [-hw * 1.01, yc * 0.4], [-hw * 0.97, yc * 0.75], [-hw * 0.84, yc - 1.4], [-hw * 0.48, yc + 0.3 + as * 8], [0, yc + 0.6], [hw * 0.48, yc + 0.2 - as * 8], [hw * 0.84, yc - 1.6], [hw * 0.97, yc * 0.75], [hw * (1.01 + as), yc * 0.4], [hw, -9]];
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)));
    const NS = 72, RS = 18, fr = curve.computeFrenetFrames(NS, false);
    const nv = (NS + 1) * (RS + 1), pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = [], c = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) {
      const t = i / NS; curve.getPointAt(t, c);
      const leg = Math.min(1, Math.abs(t - 0.5) * 2.1), rIn = (A.rt + (A.rb - A.rt) * leg * leg) * (1 + (N.v2(t * 7 + seed, seed) - 0.5) * 0.3);
      const depth = A.depth * (1 - 0.25 * leg);                                 // 비행 방향 두께(위가 더 두꺼움)
      for (let j = 0; j <= RS; j++) {
        const a = j / RS * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const k = 1 + (N.v2(ca * 2.5 + t * 16, sa * 2.5 + seed) - 0.5) * 0.42;
        const nx = fr.normals[i].x * ca * rIn + fr.binormals[i].x * sa * rIn * depth, ny = fr.normals[i].y * ca * rIn + fr.binormals[i].y * sa * rIn * depth, nz = fr.normals[i].z * ca * rIn + fr.binormals[i].z * sa * rIn * depth;
        let y = c.y + ny * k;
        const fy = ((y / 7 + seed) % 1 + 1) % 1, ledge = fy < 0.12 ? 1.05 : 1 - 0.04 * (fy - 0.12);   // 층 턱
        const o = (i * (RS + 1) + j) * 3, x = c.x + nx * k * ledge, z = c.z + nz * k * ledge;
        if (ny > 0.7 * rIn && t > 0.25 && t < 0.75) y += 0.6;                 // 등이 불룩
        pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
        const st = 0.5 + 0.5 * Math.sin(y * 0.6 + N.v2(t * 6, sa * 2) * 4);
        tmp.copy(ROCK_A).lerp(ROCK_B, st).lerp(ROCK_D, Math.max(0, 1 - k) * 2);
        if (fy < 0.1) tmp.lerp(LEDGE, 0.5); else if (fy > 0.85) tmp.lerp(ROCK_D, 0.4);
        if (y < 3.2) tmp.lerp(WET, Math.min(1, (3.2 - y) / 2.6) * 0.75);
        if (y > -0.9 && y < 1.5 && N.v2(ca * 4 + seed, t * 30) > 0.45) tmp.lerp(FOAM, 0.6);
        if (ny > 0.45 * rIn && y > yc - 1) tmp.copy(GRASS).lerp(GRASS2, N.v2(x * 0.2, z * 0.2));   // 등 위 풀
        else if (ny > 0.2 * rIn && y > yc - 3 && N.v2(x * 0.4, z * 0.4 + seed) > 0.5) tmp.lerp(TURF, 0.7);
        col[o] = tmp.r; col[o + 1] = tmp.g; col[o + 2] = tmp.b;
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < RS; j++) { const a = i * (RS + 1) + j, b = a + 1, cc = a + RS + 1, d = cc + 1; idx.push(a, b, cc, b, d, cc); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
    g.computeVertexNormals();
    g.rotateY(A.yaw); g.translate(A.x, 0, A.z);
    return g;
  }

  /* ── 점심 돌기둥 위: 바위 셋 · 풀 덤불 · 걸터앉을 통나무 ── */
  function blob(x, y, z, sx, sy, sz, color, seed, seg = 10) {
    const g = new THREE.SphereGeometry(1, seg, Math.max(4, seg >> 1)), p = g.attributes.position, cc = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), k = 1 + (N.v2(vx * 2 + seed, vz * 2 + vy) - 0.5) * 0.4;
      p.setXYZ(i, x + vx * sx * k, y + Math.max(vy, -0.35) * sy * k, z + vz * sz * k);
      tmp.copy(color).multiplyScalar(0.85 + (vy + 1) * 0.12); cc[i * 3] = tmp.r; cc[i * 3 + 1] = tmp.g; cc[i * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.deleteAttribute('uv'); g.computeVertexNormals(); return g;
  }
  const blockers = [];
  const lunchProps = [];
  [[-6, 4, 2.2, 1.5], [7, -5, 1.6, 1.1], [3, 9, 1.2, 0.9]].forEach(([dx, dz, s, h], k) => {
    lunchProps.push(blob(LUNCH.x + dx, LUNCH.top + 0.3, LUNCH.z + dz, s, h, s * 0.9, ROCK_B, k * 3 + 1));
    blockers.push({ x: LUNCH.x + dx, z: LUNCH.z + dz, r: s * 0.95 });
  });
  for (let k = 0; k < 14; k++) { const a = R() * 6.28, d = 3 + R() * 11; lunchProps.push(blob(LUNCH.x + Math.cos(a) * d, LUNCH.top + 0.35, LUNCH.z + Math.sin(a) * d, 0.7 + R() * 0.6, 0.45 + R() * 0.3, 0.7, R() < 0.5 ? GRASS2 : C(0x7d9a52), k + 9, 7)); }
  { const lg = new THREE.CylinderGeometry(0.32, 0.36, 3.6, 9, 1).rotateZ(Math.PI / 2).rotateY(0.6).translate(LUNCH.x - 2, LUNCH.top + 0.6, LUNCH.z - 6), cc = new Float32Array(lg.attributes.position.count * 3);
    for (let i = 0; i < cc.length; i += 3) { tmp.set(0x6b4c32).multiplyScalar(0.9 + (i % 7) * 0.03); cc[i] = tmp.r; cc[i + 1] = tmp.g; cc[i + 2] = tmp.b; }
    lg.setAttribute('color', new THREE.BufferAttribute(cc, 3)); lg.deleteAttribute('uv'); lunchProps.push(lg); blockers.push({ x: LUNCH.x - 2, z: LUNCH.z - 6, r: 0.9 }); }
  /* 고기잡이 자리: 물 위로 낮게 나온 바위(물고기가 모이는 곳) */
  [[-200, -322, 4.5, 1.6], [-170, -326, 3.2, 1.1], [-205, -305, 2.4, 0.9]].forEach(([x, z, s, h], k) => lunchProps.push(blob(x, -0.6, z, s, h + 0.6, s * 0.8, ROCK_D, 40 + k, 9)));

  /* ── 묶어서 그리기: 돌기둥 공간 넷 + 아치 + 소품 = 6번 ── */
  const rock = toon({ vc: true });
  const chunks = [[], [], [], []];
  P.forEach((p, k) => {
    if (!p.vis) return; const q = (p.x > BOUNDS.x ? 1 : 0) + (p.z > BOUNDS.z ? 2 : 0);
    chunks[q].push(stackGeo(p, k * 1.37 + 0.5));
    if (p.kind === 'lunch') return;
    for (let j = 0, nb = 2 + (k % 2); j < nb; j++) { const a = R() * 6.28, d = p.r * (0.95 + R() * 0.2); chunks[q].push(blob(p.x + Math.cos(a) * d, -0.7, p.z + Math.sin(a) * d, 1.8 + R() * 2.4, 1.3 + R() * 1.5, 1.8 + R() * 1.8, j ? ROCK_D : ROCK_B, k * 5 + j, 8)); }   // 밑동 바위(물결에 깎인 덩이)
    if (p.rTop > 5.5) for (let j = 0; j < 2; j++) { const a = R() * 6.28, d = p.rTop * (0.2 + R() * 0.4); chunks[q].push(blob(p.x + Math.cos(a) * d, p.top + 0.7, p.z + Math.sin(a) * d, 1.2 + R(), 0.9 + R() * 0.6, 1.2 + R(), j ? GRASS2 : C(0x7d9a52), k * 7 + j, 7)); }   // 꼭대기 덤불
  });
  arches.forEach((A, k) => chunks[(A.x > BOUNDS.x ? 1 : 0) + (A.z > BOUNDS.z ? 2 : 0)].push(archGeo(A, k * 2.1 + 3)));
  let tris = 0;
  for (const c of chunks) {
    if (!c.length) continue;
    const g = mergeGeometries(c); c.forEach((x) => x.dispose()); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, rock); m.matrixAutoUpdate = false; group.add(m); tris += g.index.count / 3;
  }
  { const g = mergeGeometries(lunchProps); lunchProps.forEach((x) => x.dispose()); const m = new THREE.Mesh(g, rock); m.matrixAutoUpdate = false; group.add(m); tris += g.index.count / 3; }

  /* ── 멀리 버크 섬 실루엣(낮은 해상도 한 장) + 마을 불빛(점 하나 묶음) ── */
  const IS = { x: -230, z: -1480, w: 1250, d: 520 };
  const islandH = (lx, lz) => {
    const e = Math.hypot(lx / (IS.w * 0.5), lz / (IS.d * 0.5)), m = Math.max(0, 1 - e * e);
    const n = N.fbm(lx * 0.004 + 3, lz * 0.006 + 1, 4), cliff = Math.min(1, m * 3.5);
    return (n * 150 + 40) * cliff * (0.5 + 0.5 * m) + (lx > IS.w * 0.18 ? 30 * cliff : 0) - 20 * (1 - cliff);
  };
  {
    const g = new THREE.PlaneGeometry(IS.w, IS.d, 40, 18).rotateX(-Math.PI / 2), p = g.attributes.position, cc = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const y = islandH(p.getX(i), p.getZ(i)); p.setY(i, y); tmp.copy(C(0x4d5a4c)).lerp(C(0x5f6a62), N.v2(p.getX(i) * 0.01, p.getZ(i) * 0.01)); if (y < 4) tmp.lerp(C(0x3e4644), 0.6); cc[i * 3] = tmp.r; cc[i * 3 + 1] = tmp.g; cc[i * 3 + 2] = tmp.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.deleteAttribute('uv'); g.computeVertexNormals(); g.translate(IS.x, 0, IS.z);
    const m = new THREE.Mesh(g, rock); m.matrixAutoUpdate = false; group.add(m); tris += g.index.count / 3;
  }
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = 32; { const x = glowC.getContext('2d'), gd = x.createRadialGradient(16, 16, 0, 16, 16, 16); gd.addColorStop(0, 'rgba(255,255,255,1)'); gd.addColorStop(0.3, 'rgba(255,255,255,0.5)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gd; x.fillRect(0, 0, 32, 32); }
  const glowTex = new THREE.CanvasTexture(glowC); glowTex.colorSpace = THREE.SRGBColorSpace;
  const NL = 11, lp = new Float32Array(NL * 3);
  for (let i = 0; i < NL; i++) { const lx = IS.w * (0.24 + R() * 0.16), lz = -IS.d * 0.05 + (R() - 0.5) * IS.d * 0.32; lp[i * 3] = IS.x + lx; lp[i * 3 + 1] = islandH(lx, lz) + 4; lp[i * 3 + 2] = IS.z + lz; }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const lightMat = new THREE.PointsMaterial({ map: glowTex, color: 0xffb060, size: 16, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.5 });
  const lights = new THREE.Points(lg, lightMat); lights.renderOrder = 950; group.add(lights);

  /* ── 구름(빌보드 한 묶음 · 반투명 1겹) ── */
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x2 = cv.getContext('2d');
  for (let k = 0; k < 10; k++) { const gx = 26 + R() * 76, gy = 46 + R() * 36, gr = 16 + R() * 26, gd = x2.createRadialGradient(gx, gy, 0, gx, gy, gr); gd.addColorStop(0, 'rgba(255,255,255,0.9)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); x2.fillStyle = gd; x2.fillRect(0, 0, 128, 128); }
  const ctex = new THREE.CanvasTexture(cv); ctex.colorSpace = THREE.SRGBColorSpace;
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, tint: { value: new THREE.Color() }, shade: { value: new THREE.Color() } }]),
    vertexShader: `varying vec2 vUv; varying float vFogDepth; varying float vY;
      void main(){ vUv = uv; vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float s = length(instanceMatrix[0].xyz);
        c.xy += position.xy * s; vY = position.y; vFogDepth = -c.z; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 tint; uniform vec3 shade; varying vec2 vUv; varying float vY;
      #include <fog_pars_fragment>
      void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.02) discard; vec3 c = mix(shade, tint, smoothstep(-0.4, 0.4, vY));
        gl_FragColor = vec4(c, t.a * 0.88);
        #ifdef USE_FOG
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * 0.8);
        #endif
        #include <colorspace_fragment>
      }`,
  });
  cloudMat.uniforms.map.value = ctex;
  { const T = TIMES[time]; cloudMat.uniforms.tint.value.setHex(T.mid).lerp(C(0xffffff), 0.6); cloudMat.uniforms.shade.value.setHex(T.top).lerp(C(T.mid), 0.55); }
  const CL = 14, clouds = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.5), cloudMat, CL), mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), ss = new THREE.Vector3();
  for (let i = 0; i < CL; i++) { const a = R() * 6.28, d = 220 + R() * 900; pp.set(BOUNDS.x + Math.cos(a) * d, 130 + R() * 150, BOUNDS.z + Math.sin(a) * d); ss.setScalar(140 + R() * 170); clouds.setMatrixAt(i, mm.compose(pp, qq.identity(), ss)); }
  clouds.frustumCulled = false; clouds.renderOrder = 5; group.add(clouds);

  /* ── 관문 확인 표시(길 안내 선 X) ① 갈매기 떼 — 다음 관문 둘 위를 돎 · 지나면 흩어짐 ② 물보라 — 다음 관문 둘의 돌기둥 밑동에 물결이 부서짐 ── */
  const gullGeo = (() => {
    /* 몸(가는 마름모) + 굽은 날개 둘(안쪽 위로 · 끝은 아래로 = 갈매기 꼴) · 날개 끝 짙은 색 */
    const v = [0, 0, 0.55, 0, 0.08, 0, 0, 0, -0.45, 0, -0.06, 0,
      0, 0.04, 0.12, 0.42, 0.16, 0.04, 0.85, 0.02, -0.12, 0, 0.04, -0.08,
      0, 0.04, 0.12, -0.42, 0.16, 0.04, -0.85, 0.02, -0.12, 0, 0.04, -0.08];
    const id = [0, 1, 2, 0, 2, 3, 0, 3, 2, 0, 2, 1, 4, 5, 7, 5, 6, 7, 8, 11, 9, 9, 11, 10];
    const cc = []; for (let i = 0; i < 12; i++) { const t = (i === 6 || i === 10) ? GULL_T : GULL; cc.push(t.r, t.g, t.b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); g.setIndex(id); g.computeVertexNormals(); g.scale(2.6, 2.6, 2.6); return g;
  })();
  const GPG = 9, NG = course.length * GPG, gulls = new THREE.InstancedMesh(gullGeo, toon({ vc: true, side: THREE.DoubleSide }), NG);
  gulls.frustumCulled = false; group.add(gulls);
  const Z0 = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < NG; i++) gulls.setMatrixAt(i, Z0);
  const gullE = new THREE.Euler(0, 0, 0, 'YXZ');
  let cur = 0; const passT = new Float32Array(course.length).fill(-1), hid = new Uint8Array(course.length);
  let tNow = 0;
  /* 물보라 자리 = 관문 양옆 돌기둥 밑동(관문 쪽 면) */
  course.forEach((g) => { g.bases = g.piv.map((k) => { const q = P[k], d = Math.hypot(g.x - q.x, g.z - q.z) || 1; return [q.x + (g.x - q.x) / d * q.r * 0.92, q.z + (g.z - q.z) / d * q.r * 0.92, (g.x - q.x) / d, (g.z - q.z) / d]; }); });
  const SPN = 22, SPB = 4, spPos = new Float32Array(SPN * SPB * 3), spCol = new Float32Array(SPN * SPB * 4);
  for (let i = 0; i < SPN * SPB; i++) { spCol[i * 4] = 0.95; spCol[i * 4 + 1] = 0.98; spCol[i * 4 + 2] = 0.98; spPos[i * 3 + 1] = -50; }
  const spG = new THREE.BufferGeometry(); spG.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); spG.setAttribute('color', new THREE.BufferAttribute(spCol, 4));
  const spray = new THREE.Points(spG, new THREE.PointsMaterial({ map: glowTex, size: 2.6, sizeAttenuation: true, vertexColors: true, transparent: true, depthWrite: false, fog: true }));
  spray.frustumCulled = false; spray.renderOrder = 955; group.add(spray);
  const hsh = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  function sprayFrame(t) {
    let b = 0;
    for (let gi = cur; gi < Math.min(course.length, cur + 2); gi++) for (const B of course[gi].bases) {
      if (b >= SPB) break;
      const per = 2.4, ph = ((t + gi * 0.7 + b * 1.1) % per + per) % per;        // 물결이 부서지는 박자(2.4초마다)
      for (let j = 0; j < SPN; j++) {
        const i = b * SPN + j, tau = ph - hsh(i, 1) * 0.25, o = i * 3;
        if (tau < 0 || tau > 1.5) { spPos[o + 1] = -50; spCol[i * 4 + 3] = 0; continue; }
        const out = 2 + hsh(i, 2) * 4, side = (hsh(i, 3) - 0.5) * 7, vy = 7 + hsh(i, 4) * 7;
        spPos[o] = B[0] + B[2] * out * tau - B[3] * side * tau; spPos[o + 1] = 0.4 + vy * tau - 4.9 * tau * tau; spPos[o + 2] = B[1] + B[3] * out * tau + B[2] * side * tau;
        spCol[i * 4 + 3] = Math.max(0, 1 - tau / 1.5) * 0.9;
      }
      b++;
    }
    for (; b < SPB; b++) for (let j = 0; j < SPN; j++) { const i = b * SPN + j; spPos[i * 3 + 1] = -50; spCol[i * 4 + 3] = 0; }
    spG.attributes.position.needsUpdate = true; spG.attributes.color.needsUpdate = true;
  }
  function gullFrame(t) {
    let dirty = false;
    for (let gi = Math.max(0, cur - 3); gi < Math.min(course.length, cur + 2); gi++) {
      const g = course[gi], dirS = gi % 2 ? 1 : -1;
      if (gi < cur && t - passT[gi] > 2.6) { if (!hid[gi]) { for (let k = 0; k < GPG; k++) gulls.setMatrixAt(gi * GPG + k, Z0); hid[gi] = 1; dirty = true; } continue; }
      for (let k = 0; k < GPG; k++) {
        const id = gi * GPG + k, ph = k / GPG * Math.PI * 2 + gi * 1.3;
        if (gi < cur) {                                       // 흩어짐
          const st = t - passT[gi];
          pp.set(g.x + Math.cos(ph) * (7 + st * 15), g.y + 7 + st * 8 + Math.sin(st * 3 + k) * 1.5, g.z + Math.sin(ph) * (7 + st * 15));
          gullE.set(-0.35, Math.atan2(Math.cos(ph), Math.sin(ph)), Math.sin(t * 14 + k) * 0.25);
          ss.set(1, 1 + Math.sin(t * 16 + k) * 0.6, 1);
        } else {                                              // 관문 위를 빙빙
          const a = ph + t * (0.55 + (k % 3) * 0.06) * dirS, rad = 9 + (k % 3) * 3;   // 관문 위로 높게(지날 때 화면을 가리지 않게)
          pp.set(g.x + Math.cos(a) * rad, g.y + 11 + Math.sin(t * 1.8 + k) * 1.4 + (k % 3) * 1.8, g.z + Math.sin(a) * rad);
          gullE.set(0, Math.atan2(-Math.sin(a) * dirS, Math.cos(a) * dirS), 0.32 * dirS);
          ss.set(1, 1 + Math.sin(t * 7 + k * 1.7) * 0.55, 1);
        }
        qq.setFromEuler(gullE); gulls.setMatrixAt(id, mm.compose(pp, qq, ss)); dirty = true;
      }
    }
    if (dirty) gulls.instanceMatrix.needsUpdate = true;
  }

  /* ── 걷기(점심 돌기둥 위만) ── */
  const height = (x, z) => { const d = Math.hypot(x - LUNCH.x, z - LUNCH.z); return d < LUNCH.r + 1 ? LUNCH.top + 0.3 : 0; };
  const pillars = P.map((p) => ({ x: +p.x.toFixed(2), z: +p.z.toFixed(2), r: +p.r.toFixed(2), top: +p.top.toFixed(2) }));
  const archList = arches.map((A) => ({ x: A.x, z: A.z, yaw: A.yaw, half: A.hw - A.rb * 0.6, y0: A.yc - A.rt * 0.95, y1: A.yc + A.rt + 0.6, th: A.rt * A.depth * 2 }));
  const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const place = {
    name: 'sea',
    height, blockers, walls: [],
    bound: { x: LUNCH.x, z: LUNCH.z, r: LUNCH.r - 1.4 },
    anchors: {                                          // 첫 자리 = 점심 돌기둥(장소 보기에서 걸을 수 있는 곳)
      lunch: { x: LUNCH.x, y: LUNCH.top + 0.3, z: LUNCH.z, yaw: Math.atan2(course[11].x - LUNCH.x, course[11].z - LUNCH.z) },
      dock: { x: DOCK.x, y: 0, z: DOCK.z, yaw: yawTo(DOCK, boatPts[1]) },
      fishing: { x: FISH.x, y: 0, z: FISH.z, yaw: yawTo(boatPts[boatPts.length - 2], FISH) },
      spawn_air: { x: SPAWN.x, y: SPAWN.y, z: SPAWN.z, yaw: SPAWN.yaw },
    },
    lists: {
      course: course.map((g) => ({ x: g.x, y: g.y, z: g.z, r: g.r, tail: g.tail, yaw: +g.yaw.toFixed(4), arch: g.arch })),
      boatPath: boatPts.map((p) => ({ x: p.x, y: 0, z: p.z })),
    },
    fly: { ground: () => -60, water: 0, pillars, arches: archList, ceil: 400, bounds: { x: BOUNDS.x, z: BOUNDS.z, r: BOUNDS.r } },
    /* 지금 관문 번호(비행이 지난 수) — 갈매기 떼가 다음 둘 위로 · 지난 것은 흩어짐 */
    gateMark(i) { if (i === cur) return; for (let k = cur; k < i && k < course.length; k++) passT[k] = tNow; cur = i; },
    stats: { pillars: P.filter((p) => p.vis).length, arches: arches.length, tris: Math.round(tris) },
    setTime(name) { if (!TIMES[name]) return; setTime(env, name); const T = TIMES[name]; cloudMat.uniforms.tint.value.setHex(T.mid).lerp(C(0xffffff), 0.6); cloudMat.uniforms.shade.value.setHex(T.top).lerp(C(T.mid), 0.55); lightMat.opacity = name === 'sunset' || name === 'night' || name === 'dawn' ? 0.95 : 0.4; },
    step(dt, t) { tNow = t; gullFrame(t); sprayFrame(t); },
    draw() {},
    dispose() {},
    benchPath(tt) {                                     // 60초: 코스를 따라 관문 사이로 한 바퀴(높이도 관문 따라)
      const L = [], pts = [SPAWN, ...course]; let tot = 0;
      for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z); L.push(d); tot += d; }
      const at = (s, o) => { s = Math.max(0, Math.min(tot - 0.01, s)); let i = 0; while (s > L[i]) { s -= L[i]; i++; } const a = pts[i], b = pts[i + 1], k = s / L[i]; o.x = a.x + (b.x - a.x) * k; o.y = a.y + (b.y - a.y) * k; o.z = a.z + (b.z - a.z) * k; return o; };
      const s = (tt / 60) * tot, c = at(s, { x: 0, y: 0, z: 0 }), f = at(s + 40, { x: 0, y: 0, z: 0 });
      ctx.camera.position.set(c.x, c.y + 6, c.z); ctx.camera.lookAt(f.x, f.y + 4, f.z);
    },
  };
  place.setTime(time);
  return place;
}
