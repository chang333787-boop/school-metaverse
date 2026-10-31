// 훈련장(W1 · 단계 3) — 둥근 돌 구덩이(바닥 반지름 22m · 가장자리보다 6m 아래 · 깎은 돌 결) · 쇠사슬 그물 지붕(둥근 격자) · 벽 안 큰 우리 문 여섯(나무 + 쇠띠)
//   가장자리 관중 난간 · 문으로 내려가는 돌계단 · 순위판(캔버스 글) · 무기·방패 걸이 · 물통 셋 · 나무벽 미로(setMaze) — 계약 = docs/dragon/stage3_plan.md §2·§3 arena
// 때 day / overcast · 지붕 그물 때문에 비행 X(fly 없음) · 원점 = 구덩이 가운데 바닥 · +Z = 들어오는 계단 쪽
import * as THREE from 'three';
import { setTime, toon } from '../look/kit.js?v=14';
import { createProps, M4, PAL, ss, textBoard } from '../look/props.js?v=14';

const FR = 22, RIM = 6, OUT = 38, CW = 1.6, CZ1 = 35.3, B = 9;    // 바닥 반지름 · 가장자리 높이 · 바깥 경계 · 계단 골 반폭 · 계단 위 끝 · 바닥 높이(바다 위 9m — 물결이 구덩이로 안 들어오게)
const CAGE_A = [0.8, 1.6, 2.4, 3.95, 4.75, 5.55].map((k) => Math.PI / 2 + k);   // 우리 문 자리(들어오는 쪽 +Z = π/2 를 비움)

export async function buildPlace(ctx) {
  const { group, env, camera, rng, opt = {} } = ctx;
  const time = opt.time === 'overcast' ? 'overcast' : 'day';
  const P = createProps(rng, { seed: 73, chunk: 40 });
  const N = P.N;
  const floorY = (x, z) => B + (N.v2(x * 0.09 + 3, z * 0.09) - 0.5) * 0.35 + 0.12 * (Math.hypot(x, z) / FR) ** 2;
  const rimY = (x, z) => B + RIM + (N.v2(x * 0.11 + 9, z * 0.11) - 0.5) * 0.12;
  const skirtY = (x, z) => { const r = Math.hypot(x, z), a = Math.atan2(z, x), t = Math.max(0, (r - OUT - 1.5) / (90 - OUT - 1.5)); return B + RIM - Math.pow(t, 0.55) * (B + RIM + 12) + (N.fbm(a * 3 + 2, t * 4, 3) - 0.5) * 6 * t; };
  let STAIR = null;                                                   // 계단 겹(P.stairs가 돌려줌 · 아래에서 채움)
  const height = (x, z) => {
    if (STAIR && Math.abs(x) < CW + 0.05 && z > FR - 0.6 && z < CZ1 + 0.3) { const h = P.layerH(STAIR, x, z); if (h != null) return h; }
    const r = Math.hypot(x, z);
    return r < FR + 0.6 ? floorY(x, z) : r < OUT + 1.5 ? rimY(x, z) : skirtY(x, z);
  };
  P.ground = (x, z) => (Math.hypot(x, z) < FR + 0.5 ? floorY(x, z) : rimY(x, z));
  const walls = [], blockers = [], anchors = {}, lists = { cages: [], barrels: [], racks: [], crowd: [] };
  const A = (n, x, z, yaw) => { anchors[n] = { x, y: height(x, z), z, yaw }; };

  /* ── 구덩이 바닥(흙·모래 + 그을음 · 발톱 자국) ── */
  {
    const g = new THREE.CircleGeometry(FR + 0.7, 64, 0, Math.PI * 2), q = new THREE.PlaneGeometry(FR * 2 + 2, FR * 2 + 2, 46, 46).rotateX(-Math.PI / 2), p = q.attributes.position; g.dispose();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r > FR + 0.9) { p.setX(i, x * (FR + 0.9) / r); p.setZ(i, z * (FR + 0.9) / r); } p.setY(i, floorY(p.getX(i), p.getZ(i))); }
    q.computeVertexNormals();
    P.put(q, null, (c, lx, ly, lz, wx, wy, wz) => {
      const n1 = N.fbm(wx * 0.08 + 1, wz * 0.08, 3), n2 = N.v2(wx * 0.6, wz * 0.6);
      c.setHex(0x8a7a62).lerp(new THREE.Color(0x6e6252), n1).lerp(new THREE.Color(0x9a8a6c), ss(0.6, 0.8, n2) * 0.5);
      const sc = ss(0.56, 0.7, N.v2(wx * 0.09 + 20, wz * 0.09 - 4)) + ss(0.7, 0.8, N.v2(wx * 0.3 + 2, wz * 0.3)) * 0.5; c.lerp(new THREE.Color(0x2a2420), Math.min(1, sc) * 0.8);   // 불에 그을린 자리
      c.multiplyScalar(0.92 - 0.12 * ss(FR - 3, FR, Math.hypot(wx, wz)));
    }, { ao: false });
    for (let k = 0; k < 7; k++) { const a = rng() * 6.28, r = 6 + rng() * 12, x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > 14 && Math.abs(x) < 6) continue;
      for (let s = 0; s < 3; s++) P.box(M4(x + s * 0.35 * Math.cos(a + 1.6), floorY(x, z) + 0.01, z + s * 0.35 * Math.sin(a + 1.6), -a, 0, 0), 0.08, 0.02, 1.6 + rng(), P.pFlat(0x3a3028, 0.1), { ao: false }); }
    for (let k = 0; k < 9; k++) { const a = rng() * 6.28, r = 5 + rng() * 14, x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > 13 && Math.abs(x) < 7) continue; const s = 0.5 + rng() * 0.9; P.blob(x, floorY(x, z) + 0.1, z, s, PAL.rock2, { moss: 0.1 }); blockers.push({ x, z, r: s * 0.85 }); }
  }

  /* ── 깎은 돌벽(구덩이 둘레) · 우리 문 자리 · 들어오는 문 자리 · 위 갓돌 + 난간 ── */
  {
    const gaps = CAGE_A.map((a) => ({ a, w: 5.9, h: 5.6 })).concat([{ a: Math.PI / 2, w: CW * 2 + 0.2, h: 99 }]);
    P.stoneRing(0, 0, FR, B - 0.3, B + RIM + 0.6, { segs: 64, row: 0.74, dep: 1.0, gaps, hexes: [0x6f6c64, 0x7d7a71, 0x5e5d58, 0x86827a], wet: 0.9, moss: 0.35 });
    for (let k = 0; k < 64; k++) { const a0 = k / 64 * Math.PI * 2, a1 = (k + 1) / 64 * Math.PI * 2, am = (a0 + a1) / 2; if (Math.abs(Math.atan2(Math.sin(am - Math.PI / 2), Math.cos(am - Math.PI / 2))) * FR < CW + 0.6) continue;
      const r = FR + 0.55; P.box(M4(Math.cos(am) * r, B + RIM + 0.68, Math.sin(am) * r, -am + Math.PI / 2), 2 * r * Math.sin(Math.PI / 64) + 0.05, 0.16, 1.3, P.pStone(0x8a877e, { moss: 0.4 }), { flat: true, jit: 0.03, facet: true, ao: false }); }
    /* 관중 난간(가장자리 위 나무) */
    for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) * FR < CW + 1.2) continue;
      const x = Math.cos(a) * (FR + 0.55), z = Math.sin(a) * (FR + 0.55), a2 = (k + 1) / 48 * Math.PI * 2, x2 = Math.cos(a2) * (FR + 0.55), z2 = Math.sin(a2) * (FR + 0.55);
      P.log(x, B + RIM + 0.7, z, x, B + RIM + 1.85, z, 0.08, 0x5a4230, { seg: 5, ls: 1, ao: false });
      if (Math.abs(Math.atan2(Math.sin(a2 - Math.PI / 2), Math.cos(a2 - Math.PI / 2))) * FR >= CW + 1.2) { P.log(x, B + RIM + 1.75, z, x2, B + RIM + 1.75, z2, 0.06, 0x6a4f37, { seg: 5, ls: 1, ao: false }); P.log(x, B + RIM + 1.2, z, x2, B + RIM + 1.2, z2, 0.045, 0x6a4f37, { seg: 4, ls: 1, ao: false }); }
    }
  }

  /* ── 우리 여섯: 돌 굴(어두운 안) + 나무 문(인스턴스 · open(k)) ── */
  const DW = 5.4, DH = 5.2, doorGeo = P.cageDoorGeo(DW, DH), doors = P.inst(doorGeo, 'o', CAGE_A.map(() => ({ x: 0, y: 0, z: 0 })), group, { dynamic: true });
  {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), hv = new THREE.Vector3();
    CAGE_A.forEach((a, i) => {
      const cx = Math.cos(a), cz = Math.sin(a), yaw = Math.atan2(-cx, -cz), r0 = FR + 0.15;     // yaw = 문 앞면이 가운데를 봄
      /* 굴: 바닥·옆벽·뒷벽·천장(어두운 돌) */
      const M = M4(cx * (FR + 3.2), B, cz * (FR + 3.2), yaw);
      const dk = (c, lx, ly, lz, wx, wy, wz) => { c.setHex(0x2c2a27).multiplyScalar(0.8 + 0.4 * N.v2(wx * 0.7, wy * 0.7 + wz * 0.5)); };
      P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, -0.05, 0)), DW + 1.2, 0.1, 5.2, dk, { ao: false });
      P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, DH + 0.3, 0)), DW + 1.4, 0.5, 5.4, dk, { ao: false });   // 굴 천장 윗면은 가장자리 길(RIM)보다 아래
      for (const sx of [-1, 1]) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(sx * (DW / 2 + 0.55), DH / 2, 0)), 0.8, DH + 0.6, 5.4, dk, { ao: false });
      P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, DH / 2, -2.55)), DW + 1.2, DH + 0.6, 0.4, (c) => c.setHex(0x141312), { ao: false });
      /* 문틀: 굵은 통나무 둘 + 위 들보 + 쇠고리 */
      for (const sx of [-1, 1]) { const p = new THREE.Vector3(sx * (DW / 2 + 0.25), 0, 2.85).applyMatrix4(M); P.log(p.x, B - 0.1, p.z, p.x, B + DH + 0.5, p.z, 0.3, 0x45332a, { seg: 8, ao: false }); }
      const b0 = new THREE.Vector3(-DW / 2 - 0.5, DH + 0.35, 2.85).applyMatrix4(M), b1 = new THREE.Vector3(DW / 2 + 0.5, DH + 0.35, 2.85).applyMatrix4(M); P.beam(b0.x, b0.y, b0.z, b1.x, b1.y, b1.z, 0.45, 0.45, 0x45332a, { ao: false });
      P.put(new THREE.TorusGeometry(0.35, 0.06, 4, 10), new THREE.Matrix4().multiplyMatrices(M, M4(0, DH + 0.95, 3.1)), P.pIron(), { ao: false });
      /* 문(경첩 = 왼쪽 끝) — open(k): 0 닫힘 ~ 1 활짝(구덩이 쪽으로 110°) */
      const hinge = new THREE.Vector3(-DW / 2, 0, 2.95).applyMatrix4(M);
      const C = { x: cx * (FR - 2.5), y: B, z: cz * (FR - 2.5), yaw: yaw, door: { x: cx * r0, z: cz * r0 }, k: 0, id: i,
        open(k) { C.k = Math.max(0, Math.min(1, k)); e.set(0, yaw - C.k * 1.9, 0, 'YXZ'); q.setFromEuler(e); hv.set(DW / 2, 0, 0).applyQuaternion(q).add(hinge); m4.compose(hv, q, one); doors.setMatrixAt(i, m4); doors.instanceMatrix.needsUpdate = true; } };
      C.open(0); lists.cages.push(C);
    });
    doors.computeBoundingSphere(); doors.boundingSphere.radius += 6;
  }

  /* ── 들어오는 돌계단(가장자리 → 바닥) + 골 양옆 돌벽 + 큰 문(열려 있음) ── */
  {
    STAIR = P.stairs(0, B, FR - 0.1, 0, B + RIM, CZ1, CW * 2, { stone: true, rail: false, sHex: 0x7a776e });
    for (const sx of [-1, 1]) for (let z = FR - 0.6; z < CZ1 + 0.6; z += 1.1) { const t = Math.max(0, Math.min(1, (z - FR) / (CZ1 - FR))), top = B + RIM + 0.7, bot = B + Math.max(-0.3, t * RIM - 1.0);
      P.box(M4(sx * (CW + 0.45), (top + bot) / 2, z + 0.55, 0, 0, (rng() - 0.5) * 0.02), 0.9, top - bot, 1.08, P.pStone(P.vary(0x75726a, 0.1), { moss: 0.35 }), { sy: Math.max(1, Math.round((top - bot) / 0.75)), flat: true, jit: 0.05, facet: true, ao: false }); }
    walls.push([-CW, FR - 0.06, -CW, CZ1], [CW, FR - 0.06, CW, CZ1]);
    for (const sx of [-1, 1]) {   // 큰 문 두 짝 — 양옆 벽에 붙여 활짝
      const M = M4(sx * (CW + 0.05), B, FR + 0.2, sx > 0 ? -Math.PI / 2 : Math.PI / 2);
      for (let k = 0; k < 4; k++) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0.22 + k * 0.42, 2.4, 0.12)), 0.4, 4.8, 0.14, P.pWood(P.vary(0x5c432f, 0.12)), { ao: false });
      for (const y of [0.8, 2.4, 4.0]) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0.85, y, 0.22)), 1.75, 0.18, 0.05, P.pIron(), { ao: false });
    }
    P.beam(-CW - 0.6, B + RIM + 0.3, FR + 0.1, CW + 0.6, B + RIM + 0.3, FR + 0.1, 0.5, 0.5, 0x45332a, { ao: false });
    for (const sx of [-1, 1]) P.log(sx * (CW + 0.25), B - 0.2, FR + 0.1, sx * (CW + 0.25), B + RIM + 0.4, FR + 0.1, 0.28, 0x45332a, { seg: 8, ao: false });
    P.shield(M4(0, B + RIM + 1.15, FR + 0.4, Math.PI), 0.7, { cols: [PAL.red, PAL.yel], pat: 3 });
  }

  /* ── 가장자리 길(돌판) + 바깥 바위 비탈 ── */
  {
    const rg = new THREE.RingGeometry(FR + 0.9, OUT + 1.5, 72, 7).rotateX(-Math.PI / 2), p = rg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, rimY(p.getX(i), p.getZ(i)));
    P.put(rg, null, (c, lx, ly, lz, wx, wy, wz) => { const a = Math.atan2(wz, wx) + Math.PI, r = Math.hypot(wx, wz), cell = (Math.floor(a / (Math.PI * 2) * 72) * 31 + Math.floor((r - FR - 0.9) / ((OUT + 0.6 - FR) / 7)) * 17) * 2654435761 >>> 0; /* 돌판 = 고리 칸과 맞춤 */ c.setHex(0x7a776e).multiplyScalar(0.84 + 0.22 * (cell / 4294967296) + 0.08 * N.v2(wx, wz)); if (r > OUT - 2) c.lerp(new THREE.Color(PAL.grass[2]), ss(OUT - 2, OUT + 1, r) * 0.6); }, { flat: true, ao: false });
    const sk = new THREE.RingGeometry(OUT + 1.5, 90, 72, 8).rotateX(-Math.PI / 2), sp = sk.attributes.position;
    for (let i = 0; i < sp.count; i++) sp.setY(i, skirtY(sp.getX(i), sp.getZ(i)));
    sk.computeVertexNormals();
    P.put(sk, null, (c, lx, ly, lz, wx, wy, wz, nx, ny) => { c.setHex(wy > B + 2 ? PAL.grass[2] : PAL.rock).lerp(new THREE.Color(PAL.rock2), (1 - ny) * 1.2 * N.v2(wx * 0.2, wy * 0.3)); if (wy < 1.5) c.multiplyScalar(0.7); }, { ao: false });
    /* 쇠사슬 지붕 받침: 가장자리 둘레 기둥 열둘 + 꼭대기 쇠고리 테 */
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + 0.13, x = Math.cos(a) * 25.6, z = Math.sin(a) * 25.6; if (Math.abs(x) < CW + 1.5 && z > 0) continue;
      P.log(x, B + RIM - 0.3, z, x, B + RIM + 4.2, z, 0.42, 0x4a3628, { seg: 8, ao: false }); P.put(new THREE.CylinderGeometry(0.75, 0.9, 0.6, 8), M4(x, B + RIM + 0.25, z), P.pStone(0x7a776e), { flat: true, ao: false });
      blockers.push({ x, z, r: 0.75 }); }
    const ring = []; for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2; ring.push(new THREE.Vector3(Math.cos(a) * 25.6, B + RIM + 4.1, Math.sin(a) * 25.6)); }
    P.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true), 96, 0.16, 5, true), null, P.pIron(), { ao: false });
    /* 깃발 · 바깥 쪽 바위 */
    for (const [a, c] of [[0.5, [PAL.red, PAL.yel]], [2.2, [PAL.blue, PAL.white]], [3.6, [PAL.green, PAL.white]], [5.0, [PAL.red, PAL.black]]]) P.flag(Math.cos(a) * 30, rimY(Math.cos(a) * 30, Math.sin(a) * 30), Math.sin(a) * 30, a + 1.2, { cols: c, h: 7 });
    for (let k = 0; k < 22; k++) { const a = rng() * 6.28, r = OUT + 2 + rng() * 10, x = Math.cos(a) * r, z = Math.sin(a) * r; P.blob(x, skirtY(x, z) + 0.3, z, 1.2 + rng() * 2.2, PAL.rock, { moss: 0.6 }); }
  }

  /* ── 쇠사슬 그물 지붕(고리 인스턴스 · 날줄 열둘 + 씨줄 넷 · 마디마다 큰 고리) ── */
  {
    const link = P.chainLinkGeo(0.52, 0.04), items = [], R0 = 25.6, Y0 = B + RIM + 4.1, TOP = 15.5;
    const dome = (a, t) => new THREE.Vector3(Math.cos(a) * R0 * Math.cos(t * Math.PI / 2), Y0 + TOP * Math.sin(t * Math.PI / 2) * (1 - 0.18 * t * t), Math.sin(a) * R0 * Math.cos(t * Math.PI / 2));
    const lay = (pts) => {
      let flip = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], L = a.distanceTo(b), n = Math.max(1, Math.round(L / 0.5));
        for (let k = 0; k < n; k++) {
          const p = a.clone().lerp(b, (k + 0.5) / n), d = b.clone().sub(a).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d);
          if (flip++ % 2) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
          const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); items.push({ x: p.x, y: p.y, z: p.z, yaw: e.y, pitch: e.x, roll: e.z, s: 1 });
        }
      }
    };
    const NM = 12; for (let m = 0; m < NM; m++) { const a = m / NM * Math.PI * 2 + 0.13, pts = []; for (let q = 0; q <= 14; q++) { const t = q / 14 * 0.94; pts.push(dome(a, t)); } lay(pts); }
    for (const t of [0.3, 0.55, 0.76, 0.9]) { const pts = []; for (let q = 0; q <= 48; q++) pts.push(dome(q / 48 * Math.PI * 2, t)); lay(pts); }
    const cl = P.inst(link, 'o', items, group); cl.frustumCulled = true;
    const nodes = []; for (let m = 0; m < NM; m++) for (const t of [0.3, 0.55, 0.76, 0.9]) { const p = dome(m / NM * Math.PI * 2 + 0.13, t); nodes.push({ x: p.x, y: p.y, z: p.z, yaw: m / NM * 6.28, s: 1 }); }
    P.inst(P.prep(new THREE.TorusGeometry(0.28, 0.07, 4, 8), null, P.pIron(), { ao: false }), 'o', nodes, group);
    const top = dome(0, 0.94); P.put(new THREE.TorusGeometry(R0 * Math.cos(0.94 * Math.PI / 2), 0.12, 4, 24).rotateX(Math.PI / 2), M4(0, top.y, 0), P.pIron(), { ao: false });
  }

  /* ── 순위판(나무 판 + 캔버스 글 한 장) ── */
  const BX = 7.2, BZ = 16.8, byaw = Math.atan2(-BX, -BZ);
  const TB = textBoard(512, 320, { title: '훈련장 순위' });
  const boardMat = toon({ map: TB.tex });
  {
    const M = M4(BX, floorY(BX, BZ), BZ, byaw);
    for (const sx of [-1, 1]) { const p = new THREE.Vector3(sx * 1.55, 0, -0.08).applyMatrix4(M); P.log(p.x, p.y - 0.3, p.z, p.x, p.y + 3.4, p.z, 0.12, 0x4a3628, { seg: 6 }); blockers.push({ x: p.x, z: p.z, r: 0.25 }); }
    P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 2.05, -0.16)), 3.4, 2.3, 0.1, P.pWood(0x5a4130), { ao: false });
    const rf = new THREE.Matrix4().multiplyMatrices(M, M4(0, 3.35, -0.05)); P.box(rf, 3.8, 0.12, 0.6, P.pWood(0x45332a), { ao: false });
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.94), boardMat); bm.position.set(BX, floorY(BX, BZ) + 2.05, BZ); bm.rotation.y = byaw; bm.translateZ(-0.1); bm.updateMatrix(); bm.matrixAutoUpdate = false; group.add(bm);
  }
  TB.draw(['(아직 기록 없음)']);
  const board = { x: BX, z: BZ, yaw: byaw, setLines(lines) { TB.draw((lines && lines.length ? lines : ['(아직 기록 없음)']).slice(0, 8)); } };

  /* ── 무기·방패 걸이 · 물통 셋 ── */
  for (const [a, sh] of [[Math.PI / 2 - 0.42, 0], [Math.PI / 2 + 0.42, 3], [Math.PI / 2 + 3.15, 2]]) {
    const r = FR - 0.75, x = Math.cos(a) * r, z = Math.sin(a) * r, yaw = Math.atan2(-Math.cos(a), -Math.sin(a));
    P.rack(M4(x, floorY(x, z) + 0.25, z, yaw), 2.6, { shields: sh, k: Math.floor(a * 3) });
    lists.racks.push({ x, y: floorY(x, z), z, yaw, kind: sh > 2 ? 'shield' : 'weapon' });
    const ux = Math.cos(yaw), uz = -Math.sin(yaw); walls.push([x - ux * 1.5, z - uz * 1.5, x + ux * 1.5, z + uz * 1.5]);
  }
  for (const a of [Math.PI / 2 - 0.62, Math.PI / 2 + 0.66, Math.PI / 2 + 3.4]) {
    const r = FR - 1.0, x = Math.cos(a) * r + Math.sin(a) * 1.0, z = Math.sin(a) * r - Math.cos(a) * 1.0; P.barrel(x, floorY(x, z) - 0.05, z, { water: true, h: 1.05, r: 0.45 }); P.bucket(x + 0.7, floorY(x, z), z + 0.2);
    lists.barrels.push({ x, y: floorY(x, z), z }); blockers.push({ x, z, r: 0.55 });
  }

  /* ── 관중 자리(가장자리 위) ── */
  for (let k = 0; k < 20; k++) { const a = Math.PI / 2 + 0.35 + k / 20 * (Math.PI * 2 - 0.7), r = FR + 2.2 + (k % 3) * 0.7, x = Math.cos(a) * r, z = Math.sin(a) * r; lists.crowd.push({ x, y: rimY(x, z), z, yaw: Math.atan2(-x, -z) }); }

  /* ── 먼 것(버크 섬 그림자 · 돌기둥) ── */
  for (const [x, z, r, sy] of [[260, -60, 70, 0.9], [-200, 150, 40, 0.6], [80, 260, 30, 1.3], [-230, -170, 50, 0.8]]) P.blob(x, -10, z, r, PAL.rock2, { sy, detail: 2, rough: 0.4, ao: false });

  /* ── 나무벽 미로(4장 내더) — setMaze(segs): 판(높이 2.6m)을 세우고 walls에도 넣음 · 빈 배열 = 치움 ── */
  const panel = (() => {   // 2m 판 하나(세로 널 + 위·아래 가로대 + 한쪽 기둥 + 받침 다리)
    const parts = [];
    for (let i = 0; i < 6; i++) parts.push(P.prep(new THREE.BoxGeometry(0.31, 2.5 - (i % 3) * 0.06, 0.08), M4(-1 + (i + 0.5) / 3, 1.3, 0), P.pWood(P.vary(0x6e5038, 0.18)), { ao: false }));
    for (const y of [0.45, 2.2]) parts.push(P.prep(new THREE.BoxGeometry(2.0, 0.14, 0.07), M4(0, y, 0.07), P.pWood(0x5a4130), { ao: false }));
    parts.push(P.prep(new THREE.CylinderGeometry(0.09, 0.1, 2.7, 6), M4(-1, 1.35, 0), P.pWood(0x4a3628), { ao: false }));
    parts.push(P.prep(new THREE.BoxGeometry(0.1, 0.1, 1.1), M4(-1, 0.06, 0), P.pWood(0x4a3628), { ao: false }));
    return mergeAll(parts);
  })();
  const MAXP = 220, maze = new THREE.InstancedMesh(panel, toon({ vc: true }), MAXP); maze.count = 0; maze.instanceMatrix.setUsage(THREE.DynamicDrawUsage); maze.frustumCulled = false; group.add(maze);
  const baseWalls = walls.slice();
  const mm = new THREE.Matrix4(), mq = new THREE.Quaternion(), me = new THREE.Euler(), mp = new THREE.Vector3(), ms = new THREE.Vector3();

  P.finish(group);
  setTime(env, time); env.sea.visible = true;

  /* 걷기 벽: 바닥 쪽 원(r 21.9 · 계단 골 틈) · 가장자리 쪽 원(r 23.2 · 같은 틈) — 끝점이 계단 골 벽 위에 놓여 닫힘 */
  for (const R of [FR - 0.1, FR + 1.2]) {
    const d = Math.asin(CW / R), a0 = Math.PI / 2 + d, a1 = Math.PI / 2 - d + Math.PI * 2, n = 64;
    let px = Math.cos(a0) * R, pz = Math.sin(a0) * R;
    for (let k = 1; k <= n; k++) { const a = a0 + (a1 - a0) * k / n, x = Math.cos(a) * R, z = Math.sin(a) * R; walls.push([px, pz, x, z]); px = x; pz = z; }
  }
  baseWalls.length = 0; baseWalls.push(...walls);

  A('gate', 0, FR - 2.6, Math.PI); A('center', 0, 0, Math.PI); A('board', BX + Math.sin(byaw) * 2.4, BZ + Math.cos(byaw) * 2.4, byaw + Math.PI);

  const place = {
    name: 'arena', group, time, height, blockers, walls, bound: { x: 0, z: 0, r: OUT }, anchors, lists, board, wallsVer: 0,
    setMaze(segs) {
      let n = 0; const W = baseWalls.slice();
      for (const s of segs || []) {
        const [ax, az, bx, bz] = s, L = Math.hypot(bx - ax, bz - az); if (L < 0.2) continue; const k = Math.max(1, Math.round(L / 2)), yaw = Math.atan2(bx - ax, bz - az) - Math.PI / 2;
        for (let i = 0; i < k && n < MAXP; i++) { const t = (i + 0.5) / k, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
          me.set(0, yaw, 0, 'YXZ'); mq.setFromEuler(me); mp.set(x, floorY(x, z) - 0.05, z); ms.set(L / k / 2, 1, 1); mm.compose(mp, mq, ms); maze.setMatrixAt(n++, mm); }
        W.push([ax, az, bx, bz]);
      }
      maze.count = n; maze.instanceMatrix.needsUpdate = true;
      place.walls = W; place.wallsVer++;                                   // 메인: wallsVer가 바뀌면 createCollide(place.blockers, place.walls)를 다시
      if (place.onWalls) place.onWalls(W);
    },
    step(dt, t) { P.stepCloth(t); },
    draw() {},
    dispose() { TB.tex.dispose(); boardMat.dispose(); },
    benchPath(t) {                                        // 60초: 계단으로 내려와 바닥 한 바퀴(낮게) → 가장자리 위로 올라 그물 아래 한 바퀴
      const k = Math.min(1, t / 60);
      if (k < 0.15) { const s = k / 0.15; camera.position.set(0, B + RIM + 1.7 - s * RIM, CZ1 - s * (CZ1 - FR + 1)); camera.lookAt(0, B + 1.5, 0); return; }
      if (k < 0.6) { const s = (k - 0.15) / 0.45, a = Math.PI / 2 + s * Math.PI * 2; camera.position.set(Math.cos(a) * 15, B + 2.2 + Math.sin(s * 9) * 0.5, Math.sin(a) * 15); camera.lookAt(Math.cos(a + 1.6) * 8, B + 2.5, Math.sin(a + 1.6) * 8); return; }
      const s = (k - 0.6) / 0.4, a = Math.PI / 2 + s * Math.PI * 2; camera.position.set(Math.cos(a) * 30, B + RIM + 2 + s * 8, Math.sin(a) * 30); camera.lookAt(0, B + 2, 0);
    },
    stats: () => ({ tris: Math.round(P.tris), pieces: P.pieces, walls: walls.length, blockers: blockers.length }),
  };
  return place;

  function mergeAll(parts) { const pos = [], nor = [], col = []; for (const g of parts) { pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); col.push(...g.attributes.color.array); g.dispose(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g; }
}
