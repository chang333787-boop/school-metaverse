// 큰 회관 실내(W1 · 단계 3) — 긴 집 ≈ 50×24m · 높은 지붕 서까래 · 큰 기둥 두 줄 · 긴 탁자·의자 · 가운데 큰 화로 · 벽 횃불 여섯 · 벽 방패 · 한쪽 끝 큰 문 · 다른 끝 단(족장 자리)
// 계약 = docs/dragon/stage3_plan.md §2·§3 hall · 때 night(비 오는 밤 · 문틈으로 비 · 화로·횃불 빛 퍼짐) / overcast(낮 회의 · 문 활짝 · 연기 구멍 빛)
// 실내 빛: Light를 더하지 않고 '구워 둔 불빛'(정점색에 화로·횃불·문 빛을 거리로 곱함) + 불꽃·빛 퍼짐 판 · 원점 = 가운데 바닥 · +Z = 문 쪽
import * as THREE from 'three';
import { setTime } from '../look/kit.js?v=18';
import { createProps, M4, PAL, ss } from '../look/props.js?v=18';

const HX = 12, HZ = 25, EAVE = 8, RIDGE = 17.5;

export async function buildPlace(ctx) {
  const { group, env, camera, rng, opt = {} } = ctx;
  const time = opt.time === 'overcast' ? 'overcast' : 'night', day = time === 'overcast';
  const DAIS_Z = -20.8, DAIS_Y = 0.7;
  const floorH = (x, z) => (z < DAIS_Z ? DAIS_Y : z < DAIS_Z + 1.2 ? DAIS_Y * (DAIS_Z + 1.2 - z) / 1.2 : 0);
  const P = createProps(rng, { seed: 57, chunk: 30, ground: floorH });
  const N = P.N, walls = [], blockers = [], anchors = {}, lists = { torches: [], seats: [] };
  const A = (n, x, z, yaw) => { anchors[n] = { x, y: floorH(x, z), z, yaw }; };

  /* ── 바닥: 큰 돌판(엇갈림 · 판마다 색) + 단은 널판 ── */
  {
    const g = new THREE.PlaneGeometry(HX * 2 + 0.6, HZ * 2 + 0.6, 22, 44).rotateX(-Math.PI / 2);
    P.put(g, M4(0, 0, 0), (c, lx, ly, lz, wx, wy, wz) => {
      const row = Math.floor((lz + HZ + 0.3) / 1.15), col = Math.floor((lx + HX + 0.3) / 1.118), r = ((row * 73 + col * 151) * 2654435761 >>> 0) / 4294967296;
      c.setHex(r > 0.7 ? 0x6a655a : r > 0.35 ? 0x5c574e : 0x534e46).multiplyScalar(0.85 + 0.25 * N.v2(wx * 0.4, wz * 0.4));
      if (Math.abs(lx) < 4.5 && lz > -18 && lz < 22) c.multiplyScalar(0.9);                                                     // 가운데 길은 닳아 짙음
    }, { flat: true, ao: false });
    for (let i = 0; i < 40; i++) { const x = -HX + 0.3 + i * 0.6; P.box(M4(x, DAIS_Y - 0.06, (DAIS_Z - HZ) / 2), 0.58, 0.12, HZ + DAIS_Z, P.pWood(P.vary(0x6e5038, 0.12)), { ao: false }); }
    P.box(M4(0, DAIS_Y / 2, (DAIS_Z - HZ) / 2), HX * 2, DAIS_Y, HZ + DAIS_Z, P.pWood(0x4a3628), { ao: false });
    for (let k = 0; k < 3; k++) P.box(M4(0, DAIS_Y * (k + 0.5) / 3 - 0.02, DAIS_Z + 1.2 - (k + 0.5) * 0.4), HX * 1.2, DAIS_Y * (k + 1) / 3, 0.42, P.pWood(P.vary(0x5e4430, 0.1)), { ao: false });
    /* 털가죽 깔개 */
    for (const [x, z, a, s] of [[0, 4.8, 0.1, 1], [-3.4, -2.6, 1.0, 0.8], [0, -22.5, 0, 1.3]]) {
      const fg = new THREE.CircleGeometry(1.2 * s, 9).rotateX(-Math.PI / 2).scale(1.4, 1, 1), fp = fg.attributes.position;
      for (let i = 0; i < fp.count; i++) { const r = Math.hypot(fp.getX(i), fp.getZ(i)); if (r > 0.5) { const k = 1 + (N.v2(fp.getX(i) * 3, fp.getZ(i) * 3) - 0.5) * 0.3; fp.setX(i, fp.getX(i) * k); fp.setZ(i, fp.getZ(i) * k); } }
      P.put(fg, M4(x, floorH(x, z) + 0.02, z, a), P.pFlat(z < -20 ? 0x8a6a48 : 0x6e5a48, 0.18), { ao: false });
    }
  }

  const roof = P.roof(M4(0, EAVE, 0), { w: HX * 2 + 0.6, d: HZ * 2 + 0.6, H: RIDGE - EAVE, ohE: 0.8, ohG: 0.3, sag: 0.0, up: 0.0, cu: 0, p: 1.35, kind: 'shingle', hex: [0x4a382d], under: 0x5a412f, t: 0.3, cell: 1.25, row: 1.05, ridge: false });
  /* ── 벽: 아래 깎은 돌(3m) + 위 세로 널(처마까지) + 벽 속 기둥 ── */
  {
    const stoneRow = (x0, z0, x1, z1, gap) => {
      const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, yaw = Math.atan2(ux, uz) + Math.PI / 2;
      for (let row = 0; row < 4; row++) { let s = (row % 2) * 0.6; const y = row * 0.75 + 0.37;
        while (s < L - 0.05) { const len = Math.min(L - s, 0.9 + rng() * 0.8), m = s + len / 2, x = x0 + ux * m, z = z0 + uz * m;
          if (!(gap && Math.abs(x) < gap && row < 4)) P.box(M4(x, y, z, yaw, 0, (rng() - 0.5) * 0.02), len - 0.04, 0.71, 0.7, P.pStone(P.vary(P.pick(PAL.stone), 0.12), { moss: 0.1 }), { sx: 2, flat: true, jit: 0.04, facet: true, ao: false });
          s += len; } }
    };
    stoneRow(-HX - 0.35, -HZ, -HX - 0.35, HZ); stoneRow(HX + 0.35, -HZ, HX + 0.35, HZ); stoneRow(-HX, -HZ - 0.35, HX, -HZ - 0.35); stoneRow(-HX, HZ + 0.35, HX, HZ + 0.35, 2.7);
    const pw = 0.45;
    for (const sx of [-1, 1]) for (let i = 0, n = Math.round(HZ * 2 / pw); i < n; i++) { const z = -HZ + (i + 0.5) * HZ * 2 / n; P.box(M4(sx * (HX + 0.12), 3 + (EAVE - 3) / 2, z), 0.14, EAVE - 3 + 0.1, HZ * 2 / n - 0.02, P.pWood(P.vary(0x5a4130, 0.15)), { sy: 2, ao: false }); }
    for (const sz of [-1, 1]) for (let i = 0, n = Math.round(HX * 2 / pw); i < n; i++) {
      const x = -HX + (i + 0.5) * HX * 2 / n, top = EAVE + roof.at(x, sz * HZ) - roof.t + 0.05, y0 = sz > 0 && Math.abs(x) < 2.7 ? 6.2 : 3;
      P.box(M4(x, (y0 + top) / 2, sz * (HZ + 0.12)), HX * 2 / n - 0.02, top - y0, 0.14, P.pWood(P.vary(0x5e4430, 0.15)), { sy: 3, ao: false });
    }
    for (const sx of [-1, 1]) for (let k = 0; k <= 8; k++) { const z = -HZ + k * HZ / 4; P.log(sx * (HX - 0.05), 0, z, sx * (HX - 0.05), EAVE + 0.2, z, 0.34, 0x4a3527, { seg: 8, ao: false }); }
    for (const sx of [-1, 1]) P.beam(sx * (HX - 0.1), EAVE, -HZ, sx * (HX - 0.1), EAVE, HZ, 0.5, 0.5, 0x45332a, { ao: false });
    for (const sx of [-1, 1]) P.beam(sx * (HX - 0.15), 3.05, -HZ, sx * (HX - 0.15), 3.05, HZ, 0.3, 0.22, 0x4a3628, { ao: false });
  }

  /* ── 지붕(밑면 널판) · 서까래 · 들보 · 동자기둥 ── */
  {
    for (let k = 0; k <= 16; k++) {
      const z = -HZ + k * HZ / 8, u = roof.uOf(z);
      for (const sx of [-1, 1]) { const pts = []; for (let q = 0; q <= 8; q++) { const v = 0.02 + q / 8 * 0.94; pts.push(new THREE.Vector3(sx * roof.X(u, v), EAVE + roof.Y(u, v) - roof.t - 0.22, z)); }
        P.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.2, 6), null, P.pWood(0x46342a), { ao: false }); }
    }
    for (let k = 0; k <= 8; k++) { const z = -HZ + k * HZ / 4; P.log(-HX, EAVE - 0.35, z, HX, EAVE - 0.35, z, 0.3, 0x4a3527, { seg: 8, ao: false });
      P.log(0, EAVE - 0.4, z, 0, RIDGE - 0.6, z, 0.24, 0x45332a, { seg: 7, ao: false });
      for (const sx of [-1, 1]) P.log(sx * 0.2, EAVE - 0.2, z, sx * 5.5, EAVE + 4.8, z, 0.16, 0x45332a, { seg: 6, ao: false }); }
    P.log(0, RIDGE - 0.55, -HZ, 0, RIDGE - 0.55, HZ, 0.3, 0x45332a, { seg: 8, ao: false });
    /* 연기 구멍(용마루 가운데 · 낮엔 빛이 들어옴) */
    P.box(M4(0, RIDGE - 0.1, 0), 2.6, 0.4, 3.6, P.pWood(0x2a201a), { ao: false });
  }

  /* ── 큰 기둥 두 줄(돌 받침 + 깎은 띠) + 세로 도리 ── */
  const PX = 6.4, PZ = [-18.75, -12.5, -6.25, 0, 6.25, 12.5, 18.75];
  for (const sx of [-1, 1]) {
    for (const z of PZ) {
      const x = sx * PX;
      P.put(new THREE.CylinderGeometry(0.85, 0.95, 0.5, 8, 1), M4(x, 0.25, z), P.pStone(PAL.stone[0], { moss: 0 }), { flat: true, jit: 0.03, facet: true, ao: false });
      P.log(x, 0.4, z, x, EAVE - 0.3, z, 0.55, P.vary(0x523b2b, 0.1), { seg: 10, ao: false });
      for (const y of [1.25, 1.5, EAVE - 1.0]) P.put(new THREE.TorusGeometry(0.57, 0.07, 4, 12).rotateX(Math.PI / 2), M4(x, y, z), P.pWood(0x3a2a20), { ao: false });
      P.box(M4(x, EAVE - 0.55, z), 1.5, 0.35, 0.9, P.pWood(0x45332a), { ao: false });
      blockers.push({ x, z, r: 0.75 });
    }
    P.log(sx * PX, EAVE - 0.3, -HZ, sx * PX, EAVE - 0.3, HZ, 0.32, 0x45332a, { seg: 8, ao: false });
  }

  /* ── 가운데 큰 화로(돌 고리 + 잉걸불 + 큰 불 + 세발 솥걸이) ── */
  {
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; P.blob(Math.cos(a) * 2.25, 0.18, Math.sin(a) * 2.25, 0.5, PAL.stone[k % 4], { moss: 0, sy: 0.6, ao: false }); }
    P.put(new THREE.CircleGeometry(1.9, 14).rotateX(-Math.PI / 2), M4(0, 0.12, 0), P.pFlat(0x2a1a14, 0.2), { ao: false });
    for (let k = 0; k < 10; k++) { const a = rng() * 6.28, r = rng() * 1.3; P.put(new THREE.IcosahedronGeometry(0.22 + rng() * 0.12, 0), M4(Math.cos(a) * r, 0.2, Math.sin(a) * r, rng() * 6), null, { mat: 'e', ao: false }); }
    for (let k = 0; k < 7; k++) { const a = k * 0.9 + rng(); P.log(Math.cos(a) * 1.2, 0.25, Math.sin(a) * 1.2, Math.cos(a) * 0.2, 0.55, Math.sin(a) * 0.2, 0.13, 0x3a2a20, { seg: 6, ls: 1, ao: false }); }
    P.fire(group, 0, 0.3, 0, 1.9, { glow: 13, op: 0.6, n: 4 });
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.5; P.log(Math.cos(a) * 2.9, 0, Math.sin(a) * 2.9, 0, 4.4, 0, 0.09, 0x3a3330, { seg: 5, ao: false }); }
    P.log(0, 4.4, 0, 0, 3.3, 0, 0.025, PAL.iron, { seg: 4, ao: false });
    blockers.push({ x: 0, z: 0, r: 2.7 });
  }

  /* ── 긴 탁자 넷(옆 통로) + 의자 · 회의 탁자 · 책 탁자 ── */
  const table = (cx, cz, len, wid, yaw, o = {}) => {
    const M = M4(cx, 0, cz, yaw), W = (a, b) => new THREE.Vector3(a, 0, b).applyMatrix4(M);
    P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.86, 0)), wid, 0.12, len, P.pWood(P.vary(0x7a5a3c, 0.1)), { sz: Math.max(1, Math.round(len / 2)), ao: false });
    for (const a of [-1, 1]) for (const b of [-1, 1]) { const p = W(a * (wid / 2 - 0.15), b * (len / 2 - 0.4)); P.log(p.x, 0, p.z, p.x, 0.82, p.z, 0.09, 0x4a3628, { seg: 6, ls: 1 }); }
    if (o.bench !== false) for (const a of [-1, 1]) { P.box(new THREE.Matrix4().multiplyMatrices(M, M4(a * (wid / 2 + 0.45), 0.45, 0)), 0.42, 0.1, len - 0.3, P.pWood(P.vary(0x6a4c34, 0.1)), { ao: false });
      for (const b of [-1, 0, 1]) { const p = W(a * (wid / 2 + 0.45), b * (len / 2 - 0.5)); P.log(p.x, 0, p.z, p.x, 0.42, p.z, 0.07, 0x4a3628, { seg: 5, ls: 1 }); }
      for (let k = 0; k < Math.floor(len / 1.6); k++) { const p = W(a * (wid / 2 + 0.45), -len / 2 + 0.9 + k * 1.6); lists.seats.push({ x: p.x, y: 0.5, z: p.z, yaw: yaw + (a > 0 ? -Math.PI / 2 : Math.PI / 2) }); } }
    /* 상 위: 나무 그릇·빵·뿔잔·초 */
    for (let k = 0; k < Math.floor(len / 1.4); k++) { const p = W((rng() - 0.5) * wid * 0.5, -len / 2 + 0.7 + k * 1.4 + rng() * 0.3);
      if (rng() < 0.45) P.put(new THREE.SphereGeometry(0.17, 7, 3, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1, 0.6, 1), M4(p.x, 1.03, p.z), P.pWood(0x8a6a48), { mat: 'd', ao: false });
      else if (rng() < 0.5) P.blob(p.x, 0.99, p.z, 0.13, 0xb08048, { moss: 0, sy: 0.6, ao: false });
      else { P.put(new THREE.CylinderGeometry(0.035, 0.04, 0.2, 5).translate(0, 0.1, 0), M4(p.x, 0.92, p.z), P.pFlat(0xe8dcc0), { ao: false }); P.put(new THREE.ConeGeometry(0.03, 0.07, 4), M4(p.x, 1.16, p.z), null, { mat: 'e', ao: false }); } }
    const pad = o.bench === false ? 0.25 : 0.75, ring = [[-wid / 2 - pad, -len / 2 - 0.2], [wid / 2 + pad, -len / 2 - 0.2], [wid / 2 + pad, len / 2 + 0.2], [-wid / 2 - pad, len / 2 + 0.2]].map(([a, b]) => W(a, b));
    for (let i = 0; i < 4; i++) walls.push([ring[i].x, ring[i].z, ring[(i + 1) % 4].x, ring[(i + 1) % 4].z]);
  };
  for (const sx of [-1, 1]) { table(sx * 9.35, -11, 12, 1.25, 0); table(sx * 9.35, 11, 12, 1.25, 0); }
  table(0, -14, 7.2, 1.8, Math.PI / 2);
  table(3.7, 4.0, 1.6, 1.1, 0.4, { bench: false });
  /* 책(덮인 큰 책 + 가죽 끈) · 촛대 */
  { const M = M4(3.7, 0.93, 4.0, 0.4 + 0.25); P.box(M, 0.62, 0.14, 0.82, P.pFlat(0x5a3020, 0.1), { ao: false }); P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0.02, 0.0, 0)), 0.58, 0.1, 0.8, P.pFlat(0xe0d4b4, 0.05), { ao: false });
    P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.07, 0)), 0.64, 0.02, 0.1, P.pFlat(0x2a1a12), { ao: false });
    P.put(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 6).translate(0, 0.15, 0), M4(3.3, 0.92, 4.5), P.pFlat(0xe8dcc0), { ao: false }); P.put(new THREE.ConeGeometry(0.035, 0.09, 4), M4(3.3, 1.27, 4.5), null, { mat: 'e', ao: false }); }

  /* ── 단: 족장 의자 · 뒤 현수막 · 큰 방패 무늬 ── */
  {
    const M = M4(0, DAIS_Y, -23.3), Mx = (a, b, c, yy = 0, p = 0, r = 0) => new THREE.Matrix4().multiplyMatrices(M, M4(a, b, c, yy, p, r));
    P.box(Mx(0, 0.55, 0), 1.5, 0.18, 1.2, P.pWood(0x5a3f2c)); P.box(Mx(0, 1.5, -0.55), 1.6, 2.0, 0.18, P.pWood(0x523a2a));
    for (const sx of [-1, 1]) { P.box(Mx(sx * 0.72, 0.85, 0.05), 0.16, 0.5, 1.2, P.pWood(0x4a3527)); const p = new THREE.Vector3(sx * 0.72, 0, -0.55).applyMatrix4(M); P.log(p.x, p.y, p.z, p.x, p.y + 2.9, p.z, 0.12, 0x45332a, { seg: 6 }); }
    P.gableDeco(Mx(0, 2.0, -0.62), { Y: (u, v) => 0.5 * (1 - v), X: () => 0.8 }, 1, { k: 0.45, hex: 0x3e2c20 });
    for (const [a, b] of [[-0.6, -0.45], [0.6, -0.45], [-0.6, 0.45], [0.6, 0.45]]) { const p = new THREE.Vector3(a, 0, b).applyMatrix4(M); P.log(p.x, p.y, p.z, p.x, p.y + 0.5, p.z, 0.07, 0x45332a, { seg: 5, ls: 1 }); }
    P.put(new THREE.CircleGeometry(0.55, 8).rotateX(-Math.PI / 2), Mx(0, 0.65, 0.05), P.pFlat(0x9a7a58, 0.2), { ao: false });
    blockers.push({ x: 0, z: -23.4, r: 1.0 });
    P.shield(M4(0, 9.5, -HZ + 0.05), 2.2, { cols: [0x9e3a2c, 0xc9a13d], pat: 2 });
    for (const sx of [-1, 1]) P.cloth(1.8, 5.2, M4(sx * 4.2 - 0.9, 7.6, -HZ + 0.25), (c, lx, ly, lz, wx, wy) => { const b = ly < -4.4 || Math.abs(lx - 0.9) < 0.18; c.setHex(b ? PAL.yel : sx > 0 ? 0x2e4a66 : 0x7e2f25).multiplyScalar(0.9 + 0.1 * N.v2(wx, wy)); }, { amp: 0.04 });
  }

  /* ── 벽 횃불 여섯(쇠 받침 + 횃대 + 불꽃) · 벽 방패 · 걸린 현수막 · 문 옆 무기 걸이 · 통 ── */
  const TZ = [-14, 0, 14];
  for (const sx of [-1, 1]) for (const z of TZ) {
    const x = sx * (HX - 0.55), y = 3.6;
    P.log(sx * (HX - 0.05), y - 0.5, z, x, y - 0.1, z, 0.04, PAL.iron, { seg: 4, ls: 1, ao: false });
    P.put(new THREE.TorusGeometry(0.13, 0.03, 4, 8).rotateX(Math.PI / 2), M4(x, y - 0.12, z), P.pIron(), { ao: false });
    P.log(x, y - 0.75, z, x, y + 0.05, z, 0.06, 0x4a3628, { seg: 5, ls: 1, ao: false });
    const T = P.torch(group, x, y + 0.05, z, { noPost: true, s: 0.75, flame: 0.85, glow: 5.5, op: 0.55 });
    T.id = lists.torches.length; lists.torches.push(T);
  }
  for (const sx of [-1, 1]) for (let k = 0; k < 17; k++) { const z = -HZ + 3 + k * 2.75; if (TZ.some((t) => Math.abs(t - z) < 1.0)) continue; P.shield(M4(sx * (HX - 0.05), 5.4 + (k % 2) * 0.35, z, -sx * Math.PI / 2, (rng() - 0.5) * 0.1), 0.6 + rng() * 0.08); }
  for (const [x, z, c] of [[-PX + 1.2, -6.25, 0x7e2f25], [PX - 1.2, 6.25, 0x2e4a66], [-PX + 1.2, 12.5, 0x4f6e4a], [PX - 1.2, -12.5, 0x93713a]]) P.cloth(1.3, 3.4, M4(x - 0.65, EAVE - 0.6, z, Math.PI / 2 * Math.sign(x)), (cc, lx, ly, lz, wx, wy) => { cc.setHex(ly < -2.8 ? PAL.yel : c).multiplyScalar(0.9 + 0.1 * N.v2(wx, wy)); }, { amp: 0.04 });
  P.rack(M4(-HX + 0.5, 0.25, 19.5, Math.PI / 2), 3.4, { shields: 2 });
  walls.push([-HX + 0.2, 17.6, -HX + 0.95, 17.6], [-HX + 0.95, 17.6, -HX + 0.95, 21.4], [-HX + 0.95, 21.4, -HX + 0.2, 21.4]);
  for (const [x, z] of [[HX - 0.8, 22.8], [HX - 1.6, 23.6], [HX - 0.8, 23.8], [-HX + 0.8, -18.6], [HX - 0.9, -19.4]]) { P.barrel(x, 0, z, { h: 1.0, r: 0.4 }); blockers.push({ x, z, r: 0.48 }); }

  /* ── 큰 문(두 짝 · 밤엔 한 짝이 조금 열려 비가 보임 · 낮엔 활짝) + 문밖 돌바닥 + 문 빛 ── */
  {
    const dw = 2.55, dh = 6.0;
    P.bin = 'doorL'; for (let i = 0; i < 6; i++) P.box(M4(dw * (i + 0.5) / 6, dh / 2, 0), dw / 6 - 0.02, dh, 0.16, P.pWood(P.vary(0x553b29, 0.12)), { ao: false }); for (const y of [1, 3, 5]) P.box(M4(dw / 2, y, 0.1), dw - 0.1, 0.16, 0.04, P.pIron(), { ao: false }); P.put(new THREE.TorusGeometry(0.22, 0.04, 4, 10), M4(dw - 0.5, 2.6, 0.14), P.pIron(), { ao: false });
    P.bin = 'doorR'; for (let i = 0; i < 6; i++) P.box(M4(-dw * (i + 0.5) / 6, dh / 2, 0), dw / 6 - 0.02, dh, 0.16, P.pWood(P.vary(0x553b29, 0.12)), { ao: false }); for (const y of [1, 3, 5]) P.box(M4(-dw / 2, y, 0.1), dw - 0.1, 0.16, 0.04, P.pIron(), { ao: false }); P.put(new THREE.TorusGeometry(0.22, 0.04, 4, 10), M4(-dw + 0.5, 2.6, 0.14), P.pIron(), { ao: false });
    P.bin = null;
    for (const sx of [-1, 1]) P.log(sx * 2.75, 0, HZ + 0.2, sx * 2.75, 6.4, HZ + 0.2, 0.3, 0x3e2c20, { seg: 8, ao: false });
    P.beam(-3.2, 6.35, HZ + 0.2, 3.2, 6.35, HZ + 0.2, 0.5, 0.5, 0x3e2c20, { ao: false });
    P.put(new THREE.PlaneGeometry(40, 30, 8, 6).rotateX(-Math.PI / 2), M4(0, -0.05, HZ + 15.4), P.pStone(0x55524c, { moss: 0.3 }), { flat: true, ao: false });
    for (let k = 0; k < 6; k++) P.blob(-9 + k * 3.6 + rng(), 0.1, HZ + 6 + rng() * 6, 0.6 + rng() * 0.5, PAL.rock2, { ao: false });
    walls.push([-HX + 0.35, HZ - 0.4, HX - 0.35, HZ - 0.4], [-HX + 0.35, -HZ + 0.35, HX - 0.35, -HZ + 0.35], [-HX + 0.35, -HZ + 0.35, -HX + 0.35, HZ - 0.4], [HX - 0.35, -HZ + 0.35, HX - 0.35, HZ - 0.4]);
  }

  P.finish(group); P.finishFire(group);
  const dL = P.named.doorL, dR = P.named.doorR;
  dL.position.set(-2.55, 0, HZ + 0.05); dR.position.set(2.55, 0, HZ + 0.05);
  dL.rotation.y = day ? 1.35 : 0.32; dR.rotation.y = day ? -1.35 : 0.0;   // 안쪽(−Z)으로 열림

  /* ── 구워 둔 불빛(정점색 × 거리 빛) — 밤: 따뜻한 화로·횃불 + 문틈의 찬 빛 / 낮: 문·연기 구멍의 흐린 빛 + 약한 화로 ── */
  const L = [{ x: 0, y: 1.6, z: 0, r: day ? 15 : 20, i: day ? 0.55 : 1.7, c: [1.35, 0.88, 0.5] }];
  for (const T of lists.torches) L.push({ x: T.x, y: T.y, z: T.z, r: 8, i: day ? 0.25 : 0.95, c: [1.35, 0.85, 0.45] });
  if (day) L.push({ x: 0, y: 3, z: HZ + 1, r: 22, i: 0.85, c: [0.95, 1.0, 1.08] }, { x: 0, y: RIDGE, z: 0, r: 20, i: 0.45, c: [1.0, 1.0, 1.0] });
  else L.push({ x: -1.6, y: 2, z: HZ + 0.5, r: 5.5, i: 0.22, c: [0.6, 0.75, 1.1] });
  const amb = day ? [0.6, 0.6, 0.64] : [0.2, 0.21, 0.3];
  group.updateMatrixWorld(true);                                     // 문짝 묶음(부모 자리)을 먼저 갱신해야 제자리 빛을 받음
  group.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || !m.geometry.attributes.color || m.material.emissive && m.material.emissive.getHex() > 0) return;
    const p = m.geometry.attributes.position, c = m.geometry.attributes.color, v = new THREE.Vector3(), out = m.name === 'doorL' || (m.parent && /door/.test(m.parent.name));
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); let r = amb[0], g = amb[1], b = amb[2];
      if (v.z > HZ + 0.6 && !out) { r = g = b = day ? 0.95 : 0.35; b += day ? 0.05 : 0.12; }
      else for (const l of L) { const d = Math.hypot(v.x - l.x, (v.y - l.y) * 0.8, v.z - l.z), k = Math.max(0, 1 - d / l.r); if (k > 0) { const f = k * k * l.i; r += f * l.c[0]; g += f * l.c[1]; b += f * l.c[2]; } }
      c.setXYZ(i, c.getX(i) * r, c.getY(i) * g, c.getZ(i) * b);
    }
    c.needsUpdate = true;
  });

  /* ── 문 빛 판(바닥에 번지는 빛 · 반투명 1겹) · 낮 연기 구멍 빛 기둥 · 밤 비 ── */
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; { const x = cv.getContext('2d'), gd = x.createRadialGradient(32, 32, 0, 32, 32, 32); gd.addColorStop(0, 'rgba(255,255,255,0.9)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gd; x.fillRect(0, 0, 64, 64); }
  const lt = new THREE.CanvasTexture(cv); lt.colorSpace = THREE.SRGBColorSpace;
  const lm = new THREE.MeshBasicMaterial({ map: lt, color: day ? 0xcfd6dc : 0x5a78a8, transparent: true, opacity: day ? 0.35 : 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(day ? 7 : 3.2, day ? 12 : 7).rotateX(-Math.PI / 2), lm); spill.position.set(day ? 0 : -1.4, 0.03, HZ - (day ? 5 : 3.2)); spill.rotation.y = day ? 0 : 0.18; spill.renderOrder = 945; group.add(spill);
  if (day) { const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.6, RIDGE - 1, 10, 1, true), new THREE.MeshBasicMaterial({ map: lt, color: 0x9a9890, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })); sh.position.set(0, RIDGE / 2 + 0.3, 0); sh.renderOrder = 944; group.add(sh); }
  const rainC = { position: new THREE.Vector3(0, 7, HZ + 6) }, rain = day ? null : P.precip(group, 'rain', 700, 14);
  if (rain) rain.mesh.material.uniforms.uA.value = 0.55;

  /* ── 때 ── 실내라 바다 끔 · 안개 = 연기 낀 따뜻한 어둠 */
  if (day) setTime(env, 'overcast', { fog: 0x4a4036, near: 24, far: 120, sun: 0xeee2cc, sunI: 0.7, sunDir: [-0.15, 0.95, 0.25], hs: 0xb0a088, hg: 0x40342a, hI: 0.95, rim: 0.1, low: 0.0 });   /* 실내 = 가장자리 빛 약하게(바닥이 비스듬히 하얗게 뜨지 않게) */
  else setTime(env, 'night', { fog: 0x170f0b, near: 12, far: 80, sun: 0xffb478, sunI: 0.32, sunDir: [0.15, 0.95, 0.2], hs: 0x6a4e3a, hg: 0x3a2618, hI: 0.8, rim: 0.06, low: 0.0 });
  env.sea.visible = false;
  for (const T of lists.torches) T.set(1);

  A('door', 0, 22.6, Math.PI); A('dais', 0, -21.6, 0); A('firepit', 0, 3.6, Math.PI); A('table_main', 0, -12.0, Math.PI); A('table_book', 4.4, 5.3, Math.PI + 0.4);

  return {
    name: 'hall', group, time, height: floorH, blockers, walls, bound: null, anchors, lists, ceil: EAVE - 0.8,
    step(dt, t) { P.stepFire(t); P.stepFlames(t); P.stepCloth(t); if (rain) rain.step(t, rainC); },
    draw() {},
    dispose() { lt.dispose(); lm.dispose(); },
    benchPath(t) {                                       // 60초: 문에서 들어와 화로 → 회의 탁자 → 단 → 옆 통로로 돌아 나옴
      const K = [[0, 2.2, 23, 0, 2, 0], [-3, 3.5, 10, 0, 1.5, -5], [3, 3.0, -4, 0, 1.8, -20], [0, 2.4, -16, 0, 1.6, -24], [-9.5, 3.2, -19, -9, 2, 5], [-3.8, 4.5, 4, 8, 3, 15], [5, 2.6, 20, -5, 2.5, 0], [0, 2.2, 23, 0, 2, 0]];
      const k = Math.min(0.9999, t / 60) * (K.length - 1), i = Math.floor(k), f = k - i, s = f * f * (3 - 2 * f), a = K[i], b = K[i + 1];
      camera.position.set(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s); camera.lookAt(a[3] + (b[3] - a[3]) * s, a[4] + (b[4] - a[4]) * s, a[5] + (b[5] - a[5]) * s);
    },
    stats: () => ({ tris: Math.round(P.tris), pieces: P.pieces, walls: walls.length, blockers: blockers.length }),
  };
}
