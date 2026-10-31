// 마을·큰 회관·훈련장이 같이 쓰는 소품 공장(W1 · 단계 3) — 시안 A 결: 깎은 모양(곡선 지붕·통나무·Lathe·Extrude·노이즈로 흔든 정점) + 정점색 얼룩
// 짓는 법: P.put(기하, 행렬, 칠하기)로 모아 두고 P.finish(group)에서 재질 × 청크(44m)마다 mergeGeometries 한 메시 → 그리기 수 = 보이는 청크 수
// 같은 모양 여럿(나무·바위·풀·쇠사슬 고리·우리 문·판자)은 InstancedMesh · 불빛은 kit flameMesh + glowSprite(Light 추가 X) · 매 프레임 new X
// 영화 화면·배치를 베끼지 않는다 — 빌린 것은 '늘 고쳐 짓는 나무집 · 가파른 곡선 지붕 · 지붕 끝 갈고리 장식 · 비늘 같은 지붕널 · 클링커 배' 같은 원리뿐
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, flameMesh, glowSprite, U } from './kit.js?v=16';
import { createNoise } from '../core/noise.js?v=16';

/* 색 — 실제 바이킹보다 조금 진하고 따뜻하게(r3 F-2 · 젖은 갈색 나무 · 청회색 돌 · 회녹색 풀) · 값은 우리가 새로 고름 */
export const PAL = {
  wood: [0x6b4a33, 0x5f4331, 0x7b5739, 0x56402f, 0x86623f, 0x6a5444], woodGrey: [0x6f665a, 0x625a50, 0x7a7266],
  fresh: 0xc9a468, fresh2: 0xd8b67c, char: 0x2a2320, ember: 0x5a2a18,
  stone: [0x7e7c75, 0x6d6c67, 0x8b887e, 0x62635e], moss: 0x617046,
  shingle: [0x4f3b2f, 0x5b4536, 0x46392f, 0x63503e], turf: [0x5e6f3f, 0x6b7b45, 0x535f37], paint: [0x8a3d2d, 0x3f5a73, 0x93713a, 0x4c6347, 0x6e3b4a],
  iron: 0x3c3b3e, rust: 0x5e4334, cloth: 0xdccfb2, red: 0x9e3a2c, blue: 0x3c5b7d, yel: 0xc9a13d, green: 0x4f6e4a, white: 0xe2dccb, black: 0x2a2521,
  grass: [0x5c7243, 0x6a7e4b, 0x4e643b, 0x73844f], dirt: 0x6f5b45, dirt2: 0x806b53, mud: 0x5a4a3a, rock: 0x7a7870, rock2: 0x5c5c57, sand: 0xa8977a,
  rope: 0xa58a5e, leather: 0x6a4630, hay: 0xb59a52, pine: 0x34503a, pine2: 0x456246, birch: 0xdcd6c6, leaf: 0x8a8f45,
};
const SHIELD_COLS = [[0x9e3a2c, 0xdccfb2], [0x3c5b7d, 0xc9a13d], [0x4f6e4a, 0xdccfb2], [0x2a2521, 0xc9a13d], [0xc9a13d, 0x9e3a2c], [0xdccfb2, 0x3c5b7d], [0x6e3b4a, 0xdccfb2]];

const _c = new THREE.Color(), _c2 = new THREE.Color(), _hsl = { h: 0, s: 0, l: 0 };
const UP = new THREE.Vector3(0, 1, 0);
export const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
/* 짓기 때만 쓰는 행렬(매 프레임 X) — yaw = +Z에서 돈 각 · 'YXZ' = 먼저 돌고 기울임 */
export function M4(x = 0, y = 0, z = 0, yaw = 0, pitch = 0, roll = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ')), V3(sx, sy, sz));
}
/* 선분 a→b 행렬: Y = a→b · X = 수평 옆 · Z = 위쪽(가로 부재의 면이 하늘을 봄) */
export function segBasis(ax, ay, az, bx, by, bz) {
  const y = V3(bx - ax, by - ay, bz - az), L = y.length(); y.divideScalar(L || 1);
  const x = Math.abs(y.y) > 0.985 ? V3(1, 0, 0) : V3().crossVectors(y, UP).normalize(), z = V3().crossVectors(x, y);
  return { m: new THREE.Matrix4().makeBasis(x, y, z).setPosition((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), L };
}
/* 띠 모양(가운데 선 + 굵기) → Extrude — 지붕 끝 장식·뱃머리 용머리·이물 기둥 */
export function bandGeo(pts, w0, w1, depth, wEnd) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
    const k = i / (n - 1), w = (wEnd != null && k > 0.82 ? w1 + (wEnd - w1) * ss(0.82, 0.95, k) : w0 + (w1 - w0) * k) / 2;
    L.push(new THREE.Vector2(pts[i][0] - ty / tl * w, pts[i][1] + tx / tl * w)); R.push(new THREE.Vector2(pts[i][0] + ty / tl * w, pts[i][1] - tx / tl * w));
  }
  const sh = new THREE.Shape(L.concat(R.reverse()));
  return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -depth / 2);
}

const MATS = { o: () => toon({ vc: true }), d: () => toon({ vc: true, side: THREE.DoubleSide }), w: () => toon({ color: 0x2b231d }), e: () => toon({ color: 0xffd38a, emissive: 0xff9a3a }) };   // e = 스스로 빛남(촛불 끝·잉걸불)
export const WIN_OFF = () => toon({ color: 0x2b231d }), WIN_ON = () => toon({ color: 0xffc27a, emissive: 0xd8742a });

export function createProps(rng, opt = {}) {
  const N = createNoise(opt.seed || 23);
  const CH = opt.chunk || 44, bins = new Map();
  const P = { N, rng, ground: opt.ground || null, wins: [], torches: [], flames: [], tris: 0, pieces: 0 };
  const R = (a, b) => a + (b - a) * rng(), pick = (a) => a[Math.floor(rng() * a.length)];
  P.R = R; P.pick = pick;
  P.vary = (hex, a = 0.1) => { _c.setHex(hex).getHSL(_hsl); _c.setHSL(_hsl.h + (rng() - 0.5) * a * 0.12, Math.min(1, _hsl.s * (1 + (rng() - 0.5) * a * 2)), Math.min(1, _hsl.l * (1 + (rng() - 0.5) * a * 2))); return _c.getHex(); };

  /* 기하 하나를 다듬음: 색인 풀기 · uv 버림 · 행렬 · 정점색 칠하기 · 땅 가까이 어둡게(떠 보이지 않게) · 흔들기 · 깎은 면 법선 */
  function prep(geo, M, paint, o = {}) {
    let g = geo;
    if (g.index) { const q = g.toNonIndexed(); g.dispose(); g = q; }
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.clearGroups(); g.morphAttributes = {};
    if (!g.attributes.normal) g.computeVertexNormals();
    const pa = g.attributes.position.array, na = g.attributes.normal.array, n = pa.length / 3, lp = pa.slice(), ln = na.slice();
    if (M) g.applyMatrix4(M);
    const col = new Float32Array(n * 3), base = o.col != null ? o.col : 0x888888;
    if (paint && o.flat) {
      for (let t = 0; t < n; t += 3) {
        const i = t * 3, lx = (lp[i] + lp[i + 3] + lp[i + 6]) / 3, ly = (lp[i + 1] + lp[i + 4] + lp[i + 7]) / 3, lz = (lp[i + 2] + lp[i + 5] + lp[i + 8]) / 3;
        const wx = (pa[i] + pa[i + 3] + pa[i + 6]) / 3, wy = (pa[i + 1] + pa[i + 4] + pa[i + 7]) / 3, wz = (pa[i + 2] + pa[i + 5] + pa[i + 8]) / 3;
        paint(_c, lx, ly, lz, wx, wy, wz, ln[i], ln[i + 1], ln[i + 2], t / 3);
        for (let k = 0; k < 9; k += 3) { col[i + k] = _c.r; col[i + k + 1] = _c.g; col[i + k + 2] = _c.b; }
      }
    } else for (let v = 0; v < n; v++) {
      const i = v * 3;
      if (paint) paint(_c, lp[i], lp[i + 1], lp[i + 2], pa[i], pa[i + 1], pa[i + 2], ln[i], ln[i + 1], ln[i + 2], v); else _c.setHex(base);
      col[i] = _c.r; col[i + 1] = _c.g; col[i + 2] = _c.b;
    }
    if (o.ao !== false && P.ground && M) for (let v = 0; v < n; v++) {
      const i = v * 3, h = pa[i + 1] - P.ground(pa[i], pa[i + 2]);
      if (h < 2.2) { const k = 0.58 + 0.42 * ss(-0.15, 1.9, h); col[i] *= k; col[i + 1] *= k; col[i + 2] *= k; }
    }
    if (o.jit) for (let v = 0; v < n; v++) {
      const i = v * 3, x = pa[i], y = pa[i + 1], z = pa[i + 2], j = o.jit;
      pa[i] += (N.v2(x * 0.83 + 3.1, z * 0.83 + y * 0.61) - 0.5) * 2 * j; pa[i + 1] += (N.v2(y * 0.9 + 7.7, x * 0.7 - z * 0.4) - 0.5) * 2 * j * (o.jitY ?? 1); pa[i + 2] += (N.v2(z * 0.79 - 1.3, y * 0.83 + x * 0.3) - 0.5) * 2 * j;
    }
    if (o.facet) g.computeVertexNormals();
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }
  P.prep = prep;
  /* 모으기 — 재질 × 청크 칸 */
  /* 묶음에 넣기 — P.bin = '이름'이면 그 이름 묶음(따로 움직일 것 · 배) · 아니면 재질 × 청크 칸 */
  function binPut(g, mat) {
    let k;
    if (P.bin) k = P.bin + '#' + mat;
    else { g.computeBoundingBox(); const b = g.boundingBox; k = (P.near ? 'n' : '') + mat + '|' + Math.floor((b.min.x + b.max.x) / 2 / CH) + '|' + Math.floor((b.min.z + b.max.z) / 2 / CH); }
    let a = bins.get(k); if (!a) bins.set(k, a = []); a.push(g);
    P.tris += g.attributes.position.count / 3; P.pieces++;
    return g;
  }
  P.bin = null; P.named = {}; P.near = false; P.nearMeshes = [];   // near = 작은 것(창·문·방패·통…) — 청크째 멀면 숨김
  P.put = (geo, M, paint, o = {}) => binPut(prep(geo, M, paint, o), o.mat || 'o');
  P.addRaw = (g, mat = 'o') => binPut(g, mat);   // 이미 칠한 기하(땅 조각 · position·normal·color · 색인 없음)
  /* 흔들리는 천(깃발·현수막) — 한 메시 · step에서 위치만 고침(new X) */
  const cloth = { geos: [], amp: [], dir: [], ph: [], mesh: null, rest: null };
  P.cloth = (w, h, M, paint, o = {}) => {
    const sx = Math.max(4, Math.round(w / 0.25)), sy = Math.max(2, Math.round(h / 0.3));
    const g = prep(new THREE.PlaneGeometry(w, h, sx, sy).translate(w / 2, -h / 2, 0), M, paint, { ...o, ao: false });
    const nv = g.attributes.position.count, dir = V3(0, 0, 1).transformDirection(M), ph = rng() * 6.28;
    const lp = new THREE.PlaneGeometry(w, h, sx, sy).translate(w / 2, -h / 2, 0).toNonIndexed().attributes.position.array;
    for (let v = 0; v < nv; v++) { const u = lp[v * 3] / w; cloth.amp.push(Math.pow(u, 1.2) * (o.amp ?? 0.22), u * 3.2 + ph); cloth.dir.push(dir.x, dir.y, dir.z); }
    cloth.geos.push(g);
  };
  P.stepCloth = (t) => {
    if (!cloth.mesh) return;
    const p = cloth.mesh.geometry.attributes.position, a = p.array, r = cloth.rest, A = cloth.amp, D = cloth.dir;
    for (let v = 0, n = a.length / 3; v < n; v++) {
      const s = Math.sin(t * 3.1 + A[v * 2 + 1]) * A[v * 2] + Math.sin(t * 5.3 + A[v * 2 + 1] * 1.7) * A[v * 2] * 0.35, i = v * 3;
      a[i] = r[i] + D[i] * s; a[i + 1] = r[i + 1] + D[i + 1] * s - Math.abs(s) * 0.15; a[i + 2] = r[i + 2] + D[i + 2] * s;
    }
    p.needsUpdate = true;
  };
  /* 같은 모양 여럿 — items = [{x,y,z,yaw,pitch,roll,s,sy,col}] */
  P.inst = (geo, mk, items, group, o = {}) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, MATS[mk || 'o'](), items.length), q = new THREE.Matrix4();
    items.forEach((it, i) => {
      const s = it.s ?? 1;
      m.setMatrixAt(i, q.compose(V3(it.x, it.y ?? 0, it.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(it.pitch || 0, it.yaw || 0, it.roll || 0, 'YXZ')), V3(it.sx ?? s, it.sy ?? s, it.sz ?? s)));
      if (it.col != null) m.setColorAt(i, _c.setHex(it.col));
    });
    if (o.dynamic) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.computeBoundingSphere(); if (!o.dynamic) { m.matrixAutoUpdate = false; m.updateMatrix(); }
    group.add(m); P.tris += geo.attributes.position.count / 3 * items.length;
    return m;
  };
  P.finish = (group) => {
    const out = [];
    for (const [k, arr] of bins) {
      const nm = k.includes('#') ? k.split('#')[0] : null, k0 = nm ? k.split('#')[1] : k.split('|')[0], near = !nm && k0[0] === 'n', mk = near ? k0.slice(1) : k0, g = arr.length === 1 ? arr[0] : mergeGeometries(arr, false);
      if (arr.length > 1) for (const a of arr) a.dispose();
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, MATS[mk]());
      if (nm) { let G = P.named[nm]; if (!G) { G = P.named[nm] = new THREE.Group(); G.name = nm; group.add(G); } G.add(m); }
      else { m.matrixAutoUpdate = false; m.updateMatrix(); group.add(m); }
      if (near) P.nearMeshes.push({ m, x: g.boundingSphere.center.x, z: g.boundingSphere.center.z, r: g.boundingSphere.radius });
      out.push(m); if (mk === 'w') P.wins.push(m);
    }
    bins.clear();
    if (cloth.geos.length) {
      const g = mergeGeometries(cloth.geos, false); for (const a of cloth.geos) a.dispose();
      g.attributes.position.setUsage(THREE.DynamicDrawUsage); cloth.rest = g.attributes.position.array.slice(); g.computeBoundingSphere(); g.boundingSphere.radius += 2;
      cloth.mesh = new THREE.Mesh(g, MATS.d()); group.add(cloth.mesh); out.push(cloth.mesh); cloth.geos = [];
      cloth.amp = new Float32Array(cloth.amp); cloth.dir = new Float32Array(cloth.dir);
    }
    return out;
  };
  P.finishAll = (group) => { const r = P.finish(group); P.finishFire(group); return r; };
  P.setWindows = (on) => { for (const m of P.wins) m.material = on ? WIN_ON() : WIN_OFF(); };
  /* 가까이 묶음 보이기 — 카메라에서 dist(+청크 반지름) 밖이면 숨김 · 몇 프레임에 한 번 부르면 됨(new X) */
  P.updateNear = (cam, dist = 70) => { const x = cam.position.x, z = cam.position.z; for (let i = 0; i < P.nearMeshes.length; i++) { const n = P.nearMeshes[i], d = dist + n.r; n.m.visible = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z) < d * d; } };

  /* ── 칠하기 ── */
  P.pWood = (hex, o = {}) => (c, lx, ly, lz, wx, wy, wz, nx, ny, nz) => {
    const n1 = N.v2(wx * 0.55 + wy * 0.31 + 11, wz * 0.55 - wy * 0.23), n2 = N.v2(wx * 2.6 + wz * 0.4, wy * 2.4 + wz * 1.7);
    c.setHex(hex).multiplyScalar(0.84 + 0.24 * n1 + 0.1 * n2);
    if (o.end && Math.abs(ny) > 0.8) c.lerp(_c2.setHex(0xa7835a), 0.55);
    if (o.char) { const k = ss(0.42, 0.62, N.v2(wx * 0.35 + 40, wz * 0.35 + wy * 0.5)) * o.char; c.lerp(_c2.setHex(PAL.char), k); }
  };
  P.pStone = (hex, o = {}) => (c, lx, ly, lz, wx, wy, wz, nx, ny, nz, k) => {
    const n1 = N.v2(wx * 0.4 + 5, wz * 0.4 + wy * 0.4), r = ((k * 2654435761) >>> 0) / 4294967296;
    c.setHex(hex).multiplyScalar(0.8 + 0.22 * n1 + 0.14 * r);
    if (o.moss !== 0 && ny > 0.45) c.lerp(_c2.setHex(PAL.moss), ss(0.45, 0.75, N.v2(wx * 0.7, wz * 0.7)) * (o.moss ?? 0.6));
    if (o.wet && wy < o.wet) c.multiplyScalar(0.7);
  };
  P.pFlat = (hex, v = 0.12) => (c, lx, ly, lz, wx, wy, wz) => { c.setHex(hex).multiplyScalar(1 - v + v * 2 * N.v2(wx * 1.3 + 2, wz * 1.3 + wy)); };
  P.pIron = () => P.pFlat(PAL.iron, 0.15);

  /* ── 기본 부재 ── */
  P.log = (ax, ay, az, bx, by, bz, r, hex, o = {}) => {
    const { m, L } = segBasis(ax, ay, az, bx, by, bz);
    const g = new THREE.CylinderGeometry(r * (o.taper ?? 0.92), r, L, o.seg || 6, o.ls || (L > 3 ? 2 : 1), !!o.open);
    if (o.rot) g.rotateY(o.rot);
    return P.put(g, m, P.pWood(hex, { end: true, char: o.char }), { jit: o.jit ?? Math.min(0.03, r * 0.15), mat: o.mat, ao: o.ao });
  };
  P.beam = (ax, ay, az, bx, by, bz, w, h, hex, o = {}) => {
    const { m, L } = segBasis(ax, ay, az, bx, by, bz);
    return P.put(new THREE.BoxGeometry(w, L, h, 1, Math.max(1, Math.round(L / 1.5)), 1), m, P.pWood(hex, { char: o.char }), { jit: o.jit ?? 0.012, ao: o.ao, mat: o.mat });
  };
  P.box = (M, w, h, d, paint, o = {}) => P.put(new THREE.BoxGeometry(w, h, d, o.sx || 1, o.sy || 1, o.sz || 1), M, paint, o);
  P.blob = (x, y, z, r, hex, o = {}) => {
    const g = new THREE.IcosahedronGeometry(r, o.detail ?? 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), k = 1 + (N.v2(vx * 1.7 / r + x, vy * 1.7 / r + vz / r * 1.3 + z) - 0.5) * (o.rough ?? 0.5); p.setXYZ(i, vx * k * (o.sx ?? 1), vy * k * (o.sy ?? 0.75), vz * k * (o.sz ?? 1)); }
    return P.put(g, M4(x, y, z, o.yaw ?? rng() * 6.28), P.pStone(hex, { moss: o.moss }), { flat: true, facet: true, ao: o.ao, mat: o.mat });
  };

  /* ── 돌 받침(집 밑 · 깎은 돌 결) ── */
  P.plinth = (M, w, d, top, bot, o = {}) => {
    const h = Math.max(0.3, top - bot);
    return P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, top - h / 2, 0)), w, h, d, P.pStone(o.hex || pick(PAL.stone), { moss: 0.5 }),
      { sx: Math.max(1, Math.round(w / 1.1)), sy: Math.max(1, Math.round(h / 0.7)), sz: Math.max(1, Math.round(d / 1.1)), flat: true, jit: 0.07, facet: true });
  };

  /* ── 곡선 지붕 ── 용마루가 가운데서 살짝 처지고 양끝이 들림 · 처마로 갈수록 완만(오목) · 지붕널은 칸마다 색 + 줄마다 턱(비늘)
     M = 벽 위(처마 높이) 가운데 · 용마루 = 로컬 Z · o = { w(벽 바깥 폭), d(길이), H(높이), ohE(처마 내밈), ohG(박공 내밈), sag, up, p, kind, hex, char, u0, u1 } */
  P.roof = (M, o) => {
    const kind = o.kind || 'shingle', L = o.d + 2 * o.ohG, p = o.p ?? 1.45, t = o.t ?? 0.22, W2 = o.w / 2 + o.ohE;
    const F = (v) => 1 - Math.pow(1 - v, p), vw = (o.w / 2) / W2, Fw = F(vw);
    const Y = (u, v) => { const e = Math.abs(2 * u - 1); return (o.H + (o.up ?? 0.4) * e * e * e - (o.sag ?? 0.25) * Math.sin(Math.PI * u)) * (1 - F(v) / Fw) + (o.cu ?? 0.25) * e ** 4 * v * v; };
    const X = (u, v) => { const e = Math.abs(2 * u - 1); return v * W2 * (1 + (o.flare ?? 0.05) * e ** 4); };
    const Z = (u) => -L / 2 + u * L;
    const slope = Math.hypot(W2, o.H * 1.4), nu = Math.max(4, Math.round(L / (kind === 'turf' ? 0.9 : o.cell ?? 0.66))), nv = Math.max(4, Math.round(slope / (kind === 'turf' ? 0.8 : o.row ?? 0.52)));
    const u0 = o.u0 ?? 0, u1 = o.u1 ?? 1, iu0 = Math.round(u0 * nu), iu1 = Math.round(u1 * nu);
    const pos = [], nor = [], col = [], hexes = Array.isArray(o.hex) ? o.hex : [o.hex];
    const nrm = (u, v, s, out) => { const e = 1e-3, ax = X(u, v + e) - X(u, v), ay = Y(u, v + e) - Y(u, v), bz = Z(u + e) - Z(u), by = Y(u + e, v) - Y(u, v); out.set(-s * ay * bz, ax * bz, -ax * by).normalize(); return out; };
    const n0 = V3(), q = V3(), lift = kind === 'shingle' ? 0.07 : 0;
    const quad = (A, B, C, D, NA, NB, NC, ND, cc, flip) => {     // A B C D = 사각 네 귀(시계/반시계 상관없이 flip으로 맞춤)
      const tri = flip ? [A, C, B, A, D, C] : [A, B, C, A, C, D], tn = flip ? [NA, NC, NB, NA, ND, NC] : [NA, NB, NC, NA, NC, ND];
      for (let i = 0; i < 6; i++) { pos.push(tri[i].x, tri[i].y, tri[i].z); nor.push(tn[i].x, tn[i].y, tn[i].z); col.push(cc.r, cc.g, cc.b); }
    };
    const pt = (u, v, s, dy = 0) => V3(s * X(u, v), Y(u, v) + dy, Z(u));
    for (const s of [-1, 1]) {
      for (let i = iu0; i < iu1; i++) for (let j = 0; j < nv; j++) {
        const ua = i / nu, ub = (i + 1) / nu, va = j / nv, vb = (j + 1) / nv;
        const vo = lift ? Math.min(1, vb + 0.35 / nv) : vb, A = pt(ua, va, s), B = pt(ub, va, s), C = pt(ub, vo, s, lift), D = pt(ua, vo, s, lift);   // 지붕널은 아랫줄 위로 겹침(틈 X)
        const NA = nrm(ua, va, s, V3()), NB = nrm(ub, va, s, V3()), NC = nrm(ub, vo, s, V3()), ND = nrm(ua, vo, s, V3());
        /* 색: 지붕널 = 칸마다 · 엇갈림 · 아래 줄로 갈수록 이끼 · 잔디 = 덩어리 얼룩 · 칠한 판 = 세로 줄 */
        const wx = (A.x + C.x) / 2, wz = (A.z + C.z) / 2, rr = ((i * 73 + j * 151 + (s > 0 ? 7 : 0)) * 2654435761 >>> 0) / 4294967296;
        if (kind === 'turf') { _c.setHex(hexes[0]).multiplyScalar(0.82 + 0.3 * N.v2(wx * 0.5 + 9, wz * 0.5 + s * 3)); if (j >= nv - 1) _c.setHex(0x5a4630); }
        else if (kind === 'paint') { const h = hexes[(i + (s > 0 ? 1 : 0)) % hexes.length]; _c.setHex(h).multiplyScalar((i % 2 ? 0.9 : 1.04) * (0.9 + 0.16 * rr)); }
        else { const h = hexes[Math.floor(rr * hexes.length)]; _c.setHex(h).multiplyScalar(0.82 + 0.3 * rr + (j % 2 ? 0.04 : -0.04)); if (j > nv * 0.6) _c.lerp(_c2.setHex(PAL.moss), ss(0.6, 0.9, N.v2(wx * 0.6, wz * 0.6 + s)) * 0.35); }
        if (o.fresh && (o.fresh(ua, va, s))) _c.setHex(rr > 0.5 ? PAL.fresh : PAL.fresh2).multiplyScalar(0.92 + rr * 0.12);
        if (o.char) { const k = ss(0.32, 0.55, N.v2(wx * 0.32 + 40, wz * 0.32 + s * 5) + (1 - va) * 0.15) * o.char; _c.lerp(_c2.setHex(k > 0.75 ? PAL.char : PAL.ember), k * 0.95); }   // 그을음(용마루 쪽이 더 탐)
        if (P.frost) _c.lerp(_c2.setHex(0xd4dadc), ss(0.3, 0.65, N.v2(wx * 0.45 + 7, wz * 0.45 + j * 0.3)) * P.frost);   // 진눈깨비 쌓임
        quad(A, B, C, D, NA, NB, NC, ND, _c, s < 0);                       // 왼쪽(s<0)은 거울이라 감김을 뒤집어야 윗면이 위를 봄
        /* 밑면(어두운 판) — 굵기 t · 실내에서 안 보는 지붕은 두 칸씩(삼각형 반) */
        const st = o.under ? 1 : 2;
        if ((i - iu0) % st === 0 && j % st === 0) {
          const ub2 = Math.min(i + st, iu1) / nu, vb2 = Math.min(j + st, nv) / nv, Ab = pt(ua, va, s, -t), Bb = pt(ub2, va, s, -t), Cb = pt(ub2, vb2, s, -t), Db = pt(ua, vb2, s, -t), dn = V3(0, -1, 0);
          if (o.under) _c.setHex(o.under).multiplyScalar(0.8 + 0.3 * (((i * 2654435761) >>> 0) / 4294967296) + (j % 3 === 0 ? -0.08 : 0)); else _c.setHex(0x3e3026);
          quad(Ab, Bb, Cb, Db, dn, dn, dn, dn, _c, s > 0);
        }
      }
      /* 처마 끝 띠 · 박공 끝 띠 */
      _c.setHex(o.edge ?? 0x4a3628);
      for (let i = iu0; i < iu1; i++) { const ua = i / nu, ub = (i + 1) / nu, A = pt(ua, 1, s, lift), B = pt(ub, 1, s, lift), C = pt(ub, 1, s, -t), D = pt(ua, 1, s, -t); q.set(s, -0.3, 0).normalize(); quad(A, B, C, D, q, q, q, q, _c, s < 0); }
      for (const [ue, sg] of [[iu0 / nu, -1], [iu1 / nu, 1]]) for (let j = 0; j < nv; j++) {
        const va = j / nv, vb = (j + 1) / nv, A = pt(ue, va, s), B = pt(ue, vb, s, lift), C = pt(ue, vb, s, -t), D = pt(ue, va, s, -t); n0.set(0, 0, sg);
        quad(A, B, C, D, n0, n0, n0, n0, _c, (s * sg) > 0);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    const cc = new Float32Array(col);
    const out = prep(g, M, null, { ao: false }); out.attributes.color.array.set(cc); binPut(out, o.mat || 'o');
    /* 용마루 통나무 */
    if (o.ridge !== false) {
      const pts = []; for (let i = iu0; i <= iu1; i++) pts.push(V3(0, Y(i / nu, 0) + 0.05, Z(i / nu)).applyMatrix4(M));
      const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(4, (iu1 - iu0)), 0.17, 6, false);
      P.put(tg, null, P.pWood(o.ridgeHex ?? 0x4f3a2a, { char: o.char }), { ao: false });
    }
    return { Y, X, Z, L, W2, t, uOf: (z) => (z + L / 2) / L, vOf: (x, u) => Math.min(1, Math.abs(x) / (W2 * (1 + (o.flare ?? 0.05) * Math.abs(2 * u - 1) ** 4))),
      at: (lx, lz) => { const u = (lz + L / 2) / L; return Y(u, Math.min(1, Math.abs(lx) / X(u, 1))); } };
  };

  /* ── 지붕 끝 장식(박공 끝에서 X로 엇걸린 판 · 끝은 안쪽을 보는 갈고리 머리) ── M = 박공 면(로컬 XY) · roof = P.roof 결과 · u = 0|1 */
  P.gableDeco = (M, roof, u, o = {}) => {
    const hex = o.hex ?? 0x4a3527, R0 = roof.Y(u, 0) + 0.1, X1 = roof.X(u, 1);
    for (const s of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 5; k++) { const v = 1 - k / 5; pts.push([s * X1 * v, roof.Y(u, v) + 0.12]); }
      const k = o.k ?? 1, nk = [[-0.36, 0.52], [-0.55, 1.0], [-0.62, 1.45], [-0.76, 1.8], [-1.06, 1.98], [-1.38, 1.93], [-1.62, 1.76]];
      for (const [a, b] of nk) pts.push([s * a * k, R0 + b * k]);
      const Mb = new THREE.Matrix4().multiplyMatrices(M, M4(0, 0, s * 0.07)), pw = P.pWood(hex, { char: o.char });
      P.put(bandGeo(pts, 0.3, 0.24, 0.13, 0.48), Mb, pw, { ao: false, jit: 0.01 });
      P.put(bandGeo([[-1.02, 1.72], [-1.3, 1.62], [-1.5, 1.56]].map(([a, b]) => [s * a * k, R0 + b * k]), 0.18 * k, 0.1 * k, 0.12), Mb, pw, { ao: false });   // 아래턱
      P.put(bandGeo([[-0.86, 1.98], [-0.72, 2.3], [-0.5, 2.46]].map(([a, b]) => [s * a * k, R0 + b * k]), 0.15 * k, 0.05 * k, 0.12), Mb, pw, { ao: false });   // 뿔
    }
  };

  /* ── 문 · 창 ── M = 벽 면(로컬 +Z가 밖) */
  P.door = (M, w = 1.3, h = 2.05, o = {}) => {
    const hex = o.hex ?? P.vary(0x5a3f2c);
    const n = Math.max(3, Math.round(w / 0.3));
    for (let i = 0; i < n; i++) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(-w / 2 + (i + 0.5) * w / n, h / 2, 0.02 * (i % 2))), w / n - 0.015, h, 0.09, P.pWood(P.vary(hex, 0.12)), { jit: 0.006 });
    for (const y of [0.45, h - 0.5]) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, y, 0.07)), w * 0.92, 0.09, 0.03, P.pIron());
    P.put(new THREE.TorusGeometry(0.09, 0.02, 4, 8), new THREE.Matrix4().multiplyMatrices(M, M4(w * 0.3, h * 0.5, 0.1)), P.pIron());
    /* 문틀: 기둥 둘 + 상인방 */
    const fh = o.frame ?? 0x4a3527;
    for (const sx of [-1, 1]) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(sx * (w / 2 + 0.1), h / 2 + 0.05, 0.03)), 0.2, h + 0.1, 0.22, P.pWood(fh), { jit: 0.01 });
    P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, h + 0.17, 0.05)), w + 0.6, 0.22, 0.26, P.pWood(fh), { jit: 0.015 });
  };
  P.window = (M, w = 0.7, h = 0.6, o = {}) => {
    P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0, 0.02)), w, h, 0.05, null, { mat: 'w', ao: false });
    const fh = o.frame ?? 0x4f3a2b;
    for (const sy of [-1, 1]) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, sy * (h / 2 + 0.05), 0.06)), w + 0.25, 0.1, 0.12, P.pWood(fh));
    for (const sx of [-1, 1]) {
      P.box(new THREE.Matrix4().multiplyMatrices(M, M4(sx * (w / 2 + 0.05), 0, 0.06)), 0.1, h + 0.1, 0.12, P.pWood(fh));
      const a = o.shut === false ? 0 : sx * (0.55 + rng() * 0.6);         // 덧문은 저마다 다르게 열림
      P.box(new THREE.Matrix4().multiplyMatrices(M, M4(sx * (w / 2 + 0.08), 0, 0.08)).multiply(M4(0, 0, 0, a)).multiply(M4(sx * w / 4, 0, 0.02)), w / 2, h, 0.05, P.pWood(P.vary(o.shutHex ?? 0x6a4b33, 0.2)), { jit: 0.005 });
    }
  };

  /* ── 둥근 방패(무늬 = 반 · 넷 · 줄 · 고리) ── M = 방패 면(+Z가 앞) */
  P.shield = (M, r = 0.42, o = {}) => {
    const [a, b] = o.cols || pick(SHIELD_COLS), pat = o.pat ?? Math.floor(rng() * 5);
    const g = new THREE.CylinderGeometry(r, r, 0.05, 12, 1).rotateX(Math.PI / 2);
    P.put(g, M, (c, lx, ly, lz, wx, wy, wz, nx, ny, nz) => {
      const ang = Math.atan2(ly, lx), rr = Math.hypot(lx, ly) / r, side = Math.abs(nz) < 0.5;
      let A = true;
      if (pat === 0) A = lx > 0; else if (pat === 1) A = lx * ly > 0; else if (pat === 2) A = Math.floor((ang + Math.PI) / (Math.PI / 4)) % 2 === 0; else if (pat === 3) A = rr < 0.55; else A = Math.abs(ly) < r * 0.22 || Math.abs(lx) < r * 0.22;
      c.setHex(side ? 0x4a3a2c : A ? a : b).multiplyScalar(0.88 + 0.16 * N.v2(wx * 3, wy * 3 + wz));
    }, { flat: true, ao: false });
    P.put(new THREE.TorusGeometry(r, 0.035, 3, 12), M, P.pIron(), { ao: false });
    P.put(new THREE.SphereGeometry(0.1, 5, 2, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0, 0.02)), P.pFlat(0x8a8a86), { ao: false });
  };

  /* ── 통(배럴) · 상자 · 양동이 ── */
  P.barrel = (x, y, z, o = {}) => {
    const h = o.h ?? 1.0, r = o.r ?? 0.4, prof = []; for (let i = 0; i <= 6; i++) { const t = i / 6; prof.push(new THREE.Vector2(r * (0.82 + 0.18 * Math.sin(t * Math.PI)), t * h)); }
    const hex = o.hex ?? P.vary(0x7a5636);
    const BM = M4(x, y, z, rng() * 6.28, o.tilt || 0);
    P.put(new THREE.LatheGeometry(prof, 10), BM, (c, lx, ly, lz) => { const st = Math.floor((Math.atan2(lz, lx) + Math.PI) / (Math.PI * 2) * 10); c.setHex(hex).multiplyScalar(0.84 + 0.2 * (((st * 2654435761) >>> 0) / 4294967296)); }, { flat: true });
    for (const t of [0.18, 0.82]) P.put(new THREE.TorusGeometry(r * (0.83 + 0.17 * Math.sin(t * Math.PI)) + 0.01, 0.03, 3, 10).rotateX(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(BM, M4(0, t * h, 0)), P.pIron(), { ao: false });
    P.put(new THREE.CircleGeometry(r * 0.83, 10).rotateX(-Math.PI / 2), M4(x, y + h - 0.03, z), P.pWood(0x5d4330), { ao: false });
    if (o.water) P.put(new THREE.CircleGeometry(r * 0.78, 10).rotateX(-Math.PI / 2), M4(x, y + h - 0.12, z), P.pFlat(0x3f6470, 0.05), { ao: false });
  };
  P.crate = (x, y, z, s = 0.8, yaw = 0) => {
    const M = M4(x, y + s / 2, z, yaw);
    P.box(M, s, s, s, P.pWood(P.vary(0x8a6644)), { jit: 0.01 });
    for (const [a, b, c] of [[0, s / 2 - 0.05, s / 2 + 0.01], [0, -s / 2 + 0.05, s / 2 + 0.01]]) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(a, b, c)), s + 0.02, 0.1, 0.04, P.pWood(0x5d4330));
  };
  P.bucket = (x, y, z) => P.put(new THREE.CylinderGeometry(0.2, 0.16, 0.32, 8, 1).translate(0, 0.16, 0), M4(x, y, z), P.pWood(0x7a5a3a));

  /* ── 장작더미 · 짚 ── */
  P.woodpile = (M, len = 2.4, h = 1.1) => {
    for (let y = 0.13, row = 0; y < h; y += 0.25, row++) for (let i = 0; i < len / 0.27; i++) {
      const zz = -len / 2 + 0.13 + i * 0.27 + (row % 2) * 0.12; if (zz > len / 2 - 0.12) continue;
      const a = V3(-0.45, y, zz).applyMatrix4(M), b = V3(0.45, y, zz).applyMatrix4(M);
      P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.12 + rng() * 0.02, P.vary(0x7a5a3c, 0.2), { seg: 5, ls: 1, jit: 0.015 });
    }
  };

  /* ── 울타리(말뚝 + 가로대 둘) — 걷기 벽 선분을 돌려줌 ── */
  P.fence = (pts, o = {}) => {
    const walls = [], gh = P.ground || (() => 0), hex = o.hex ?? 0x6a5340, h = o.h ?? 1.15, step = o.step ?? 2.2;
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, az] = pts[k], [bx, bz] = pts[k + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / step));
      walls.push([ax, az, bx, bz]);
      let px = ax, pz = az, py = gh(ax, az);
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = gh(x, z);
        if (i > 0 || k === 0) P.log(x, y - 0.3, z, x + (rng() - 0.5) * 0.06, y + h + rng() * 0.15, z + (rng() - 0.5) * 0.06, 0.08, P.vary(hex, 0.2), { seg: 6, ls: 1 });
        if (i > 0) for (const hh of o.rails ?? [0.45, 0.95]) P.log(px, py + hh * h / 1.15, pz, x, y + hh * h / 1.15 + (rng() - 0.5) * 0.06, z, 0.05, P.vary(hex, 0.2), { seg: 5, ls: 1 });
        px = x; pz = z; py = y;
      }
    }
    return walls;
  };

  /* ── 횃불(기둥 + 쇠 바구니 + 불꽃 + 빛 퍼짐) — set(on) · level(0~1)
     불꽃·빛은 횃불 수와 상관없이 그리기 2번(인스턴스 둘 · kit flameMesh·glowSprite와 같은 결) — finish에서 지음 · 꺼짐 = 크기 0 ── */
  P.torch = (group, x, y, z, o = {}) => {
    const h = o.h ?? 2.5, sc = o.s ?? 1;
    if (!o.noPost) P.log(x, y - 0.2, z, x, y + h, z, 0.09, 0x4f3b2b, { seg: 6 });
    const top = o.noPost ? y : y + h + 0.05;
    if (sc > 0.05) P.put(new THREE.CylinderGeometry(0.24 * sc, 0.13 * sc, 0.32 * sc, 7, 1, true).translate(0, 0.16 * sc, 0), M4(x, top, z), P.pIron(), { mat: 'd', ao: false });
    const T = { x, y: top, z, id: P.torches.length, fy: top + 0.18 * sc, gy: top + 0.55, fs: o.flame ?? 0.9, gs: o.glow ?? 4.5, level: 1, on: true, ph: rng() * 6.28, i: P.torches.length,
      set(v) { const l = v === true ? 1 : v === false ? 0 : Math.max(0, Math.min(1, v)); T.level = l; T.on = l > 0.02; fireSet(T); } };
    P.torches.push(T); return T;
  };
  const FIRE = { fl: null, gl: null, m: new THREE.Matrix4() };
  function fireSet(T, flick = 1) {
    if (!FIRE.fl) return;
    const m = FIRE.m, k = T.on ? 1 : 0, fs = T.fs * (0.35 + 0.65 * T.level) * k, gs = T.gs * (0.3 + 0.7 * T.level) * k * flick;
    m.makeScale(fs, fs, fs).setPosition(T.x, T.fy, T.z); FIRE.fl.setMatrixAt(T.i, m);
    m.makeScale(gs, gs, gs).setPosition(T.x, T.gy, T.z); FIRE.gl.setMatrixAt(T.i, m);
    FIRE.fl.instanceMatrix.needsUpdate = FIRE.gl.instanceMatrix.needsUpdate = true;
  }
  P.finishFire = (group, col = 0xffa040, op = 0.55) => {
    const n = P.torches.length; if (!n) return;
    const fm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uTime: U.uTime },
      vertexShader: `uniform float uTime; varying float vH;
        void main(){ vec3 p = position; vH = clamp(p.y, 0.0, 1.0); vec4 w = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float ph = w.x * 1.7 + w.z * 2.3;
          p.x += sin(uTime * 9.0 + p.y * 5.0 + ph) * 0.08 * vH; p.z += cos(uTime * 7.0 + p.y * 4.0 + ph) * 0.08 * vH; p.y *= 0.85 + 0.15 * sin(uTime * 11.0 + ph);
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0); }`,
      fragmentShader: `varying float vH; void main(){ vec3 c = mix(vec3(1.0, 0.85, 0.45), vec3(0.95, 0.35, 0.08), vH); float a = (1.0 - vH) * 0.85; gl_FragColor = vec4(c * a, a);
        #include <colorspace_fragment>
      }` });
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; { const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const gm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, uCol: { value: new THREE.Color(col) }, uOp: { value: op } }]),
      vertexShader: `varying vec2 vUv; varying float vFogDepth;
        void main(){ vUv = uv; vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float s = length(instanceMatrix[0].xyz); c.xy += position.xy * s; vFogDepth = -c.z; gl_Position = projectionMatrix * c; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 uCol; uniform float uOp; varying vec2 vUv;
        #include <fog_pars_fragment>
        void main(){ float a = texture2D(map, vUv).a * uOp;
          #ifdef USE_FOG
            a *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth) * 0.85;
          #endif
          gl_FragColor = vec4(uCol * a, a);
          #include <colorspace_fragment>
        }` });
    gm.uniforms.map.value = tex;
    FIRE.fl = new THREE.InstancedMesh(new THREE.ConeGeometry(0.22, 1, 7, 3, true).translate(0, 0.5, 0), fm, n);
    FIRE.gl = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), gm, n);
    for (const I of [FIRE.fl, FIRE.gl]) { I.instanceMatrix.setUsage(THREE.DynamicDrawUsage); I.frustumCulled = false; group.add(I); }
    FIRE.fl.renderOrder = 940; FIRE.gl.renderOrder = 950;
    for (const T of P.torches) fireSet(T);
  };
  /* 불빛 일렁임 — 켜진 것만(횃불 수만큼 · new X) */
  P.stepFire = (t) => { if (!FIRE.gl) return; for (let i = 0; i < P.torches.length; i++) { const T = P.torches[i]; if (!T.on) continue; fireSet(T, 1 + 0.07 * Math.sin(t * 11 + T.ph) + 0.04 * Math.sin(t * 23 + T.ph * 2)); } };
  /* 화로·모닥불 — 불꽃 셋 + 빛 퍼짐(항상 켜짐) */
  P.fire = (group, x, y, z, s = 1, o = {}) => {
    const fl = [];
    for (let i = 0; i < (o.n ?? 3); i++) { const a = i * 2.1 + rng(), r = i ? 0.28 * s : 0, f = flameMesh(s * (i ? 1.0 : 1.5)); f.position.set(x + Math.cos(a) * r, y, z + Math.sin(a) * r); group.add(f); fl.push(f); }
    const gl = glowSprite(o.col ?? 0xff9a3a, o.glow ?? 6 * s, o.op ?? 0.6); gl.position.set(x, y + 0.9 * s, z); group.add(gl);
    const F = { x, y, z, fl, gl, gs: o.glow ?? 6 * s, ph: rng() * 6.28 }; P.flames.push(F); return F;
  };
  P.stepFlames = (t) => { for (let i = 0; i < P.flames.length; i++) { const F = P.flames[i]; F.gl.scale.setScalar(F.gs * (1 + 0.08 * Math.sin(t * 9 + F.ph) + 0.05 * Math.sin(t * 17 + F.ph))); } };

  /* ── 나무 계단(디딤판 + 옆판 + 받침 기둥 + 난간) / 돌계단(단마다 땅까지 찬 돌) — 걷기 경사(ramp)와 옆 벽을 돌려줌 ── */
  P.stairs = (ax, ay, az, bx, by, bz, w, o = {}) => {
    const gh = P.ground || (() => 0), dx = bx - ax, dz = bz - az, run = Math.hypot(dx, dz), ux = dx / run, uz = dz / run, rx = uz, rz = -ux;   // r = 오른쪽
    const rise = by - ay, n = Math.max(2, Math.round(Math.abs(rise) / (o.stone ? 0.24 : 0.21))), yaw = Math.atan2(ux, uz), hex = o.hex ?? 0x6b5038;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, tc = (t0 + t1) / 2, cx = ax + dx * tc, cz = az + dz * tc, top = ay + rise * t1, dep = run / n;
      if (o.stone) { const gmin = Math.min(gh(cx + rx * w / 2, cz + rz * w / 2), gh(cx - rx * w / 2, cz - rz * w / 2), gh(cx, cz)) - 0.4, hh = Math.max(0.3, top - gmin);
        P.box(M4(cx, top - hh / 2, cz, yaw), w, hh, dep + 0.06, P.pStone(o.sHex ?? pick(PAL.stone), { moss: 0.35 }), { sx: Math.max(1, Math.round(w / 2.2)), sy: Math.max(1, Math.min(3, Math.round(hh / 1.5))), flat: true, jit: 0.035, facet: true }); }
      else P.box(M4(cx, top - 0.04, cz, yaw), w, 0.08, dep + 0.05, P.pWood(P.vary(hex, 0.15)), { jit: 0.008 });
    }
    if (!o.stone) {
      for (const sd of [-1, 1]) {
        const ox = rx * sd * (w / 2 + 0.05), oz = rz * sd * (w / 2 + 0.05);
        P.beam(ax + ox, ay - 0.18, az + oz, bx + ox, by - 0.18, bz + oz, 0.1, 0.3, 0x5a4230);
        const np = Math.max(1, Math.round(run / 2.6));
        for (let k = 0; k <= np; k++) { const t = k / np, x = ax + dx * t + ox, z = az + dz * t + oz, y = ay + rise * t - 0.25, g = gh(x, z); if (y - g > 0.5) P.log(x, g - 0.3, z, x, y, z, 0.1, 0x55402e, { seg: 6 }); }
        if (o.rail !== false) {
          for (let k = 0; k <= np; k++) { const t = k / np, x = ax + dx * t + ox, z = az + dz * t + oz, y = ay + rise * t; P.log(x, y - 0.1, z, x, y + 1.0, z, 0.06, 0x5f4632, { seg: 5, ls: 1 }); }
          P.log(ax + ox, ay + 0.95, az + oz, bx + ox, by + 0.95, bz + oz, 0.05, 0x6a4f37, { seg: 5 });
        }
      }
    } else if (o.rail !== false) {
      for (const sd of [-1, 1]) {   // 돌계단 옆 낮은 담
        const ox = rx * sd * (w / 2 + 0.3), oz = rz * sd * (w / 2 + 0.3);
        for (let i = 0; i < n; i += 2) { const t = (i + 1) / n, cx = ax + dx * (i + 1) / n + ox, cz = az + dz * (i + 1) / n + oz, top = ay + rise * t + 0.7, gmin = gh(cx, cz) - 0.3, hh = top - gmin;
          P.box(M4(cx, top - hh / 2, cz, yaw), 0.6, hh, run / n * 2 + 0.08, P.pStone(pick(PAL.stone)), { sy: Math.max(1, Math.min(3, Math.round(hh / 1.5))), flat: true, jit: 0.04, facet: true }); }
      }
    }
    const hw = w / 2;
    return { kind: 'ramp', ax, az, bx, bz, ay, by, ux, uz, run, hw, n,
      walls: [[ax + rx * hw, az + rz * hw, bx + rx * hw, bz + rz * hw], [ax - rx * hw, az - rz * hw, bx - rx * hw, bz - rz * hw]] };
  };
  /* 걷기 겹 높이(계단 ramp · 평평한 판 flat · 다리 bridge) — 안이면 높이, 밖이면 null */
  P.layerH = (L, x, z) => {
    if (L.kind === 'flat') { if (L.poly) return inPoly(L.poly, x, z) ? L.y : null; return (x >= L.x0 && x <= L.x1 && z >= L.z0 && z <= L.z1) ? L.y : null; }
    const px = x - L.ax, pz = z - L.az, t = (px * L.ux + pz * L.uz) / L.run, s = Math.abs(px * L.uz - pz * L.ux);
    if (t < -0.02 || t > 1.02 || s > L.hw + 0.05) return null;
    const tc = Math.max(0, Math.min(1, t));
    if (L.kind === 'bridge') return L.ay + (L.by - L.ay) * tc - Math.sin(tc * Math.PI) * (L.sag || 0);
    return L.ay + (L.by - L.ay) * Math.min(1, tc + 0.5 / L.n);
  };

  /* ── 나무 다리(널판 + 밧줄 난간 + 처짐) ── */
  P.bridge = (ax, ay, az, bx, by, bz, w = 2.2, o = {}) => {
    const dx = bx - ax, dz = bz - az, run = Math.hypot(dx, dz), ux = dx / run, uz = dz / run, rx = uz, rz = -ux, yaw = Math.atan2(ux, uz), sag = o.sag ?? 1.2, n = Math.round(run / 0.36);
    const yAt = (t) => ay + (by - ay) * t - Math.sin(t * Math.PI) * sag;
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; if (rng() < 0.03) continue; P.box(M4(ax + dx * t + (rng() - 0.5) * 0.05, yAt(t) - 0.04, az + dz * t, yaw + (rng() - 0.5) * 0.06), w + (rng() - 0.5) * 0.25, 0.07, 0.3, P.pWood(P.vary(PAL.woodGrey[0], 0.2)), { ao: false }); }
    for (const sd of [-1, 1]) {
      const ox = rx * sd * w / 2, oz = rz * sd * w / 2;
      for (const yy of [-0.12, 1.05]) { const pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push(V3(ax + dx * t + ox, yAt(t) + yy - (yy > 0 ? Math.sin(t * Math.PI) * 0.15 : 0), az + dz * t + oz)); }
        P.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, yy > 0 ? 0.045 : 0.07, 5), null, P.pFlat(yy > 0 ? PAL.rope : 0x4f3a2a, 0.1), { ao: false }); }
      for (let k = 1; k < 10; k++) { const t = k / 10, x = ax + dx * t + ox, z = az + dz * t + oz, y = yAt(t); P.log(x, y - 0.1, z, x, y + 1.05, z, 0.025, PAL.rope, { seg: 4, ls: 1, ao: false }); }
      for (const t of [0, 1]) { const x = ax + dx * t + ox * 1.15, z = az + dz * t + oz * 1.15, y = t ? by : ay; P.log(x, y - 1.2, z, x, y + 1.5, z, 0.16, 0x4f3b2b); }
    }
    const hw = w / 2 - 0.05;
    return { kind: 'bridge', ax, az, bx, bz, ay, by, ux, uz, run, hw, sag, n, walls: [[ax + rx * hw, az + rz * hw, bx + rx * hw, bz + rz * hw], [ax - rx * hw, az - rz * hw, bx - rx * hw, bz - rz * hw]] };
  };

  /* ── 선착장 판(널판 + 밑 기둥 + 말뚝) — 평평한 걷기 판과 가장자리 벽 ── */
  P.pier = (ax, az, bx, bz, w, y, o = {}) => {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, rx = uz, rz = -ux, yaw = Math.atan2(ux, uz), n = Math.round(L / 0.32);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; P.box(M4(ax + dx * t, y - 0.05, az + dz * t, yaw + (rng() - 0.5) * 0.03), w + (rng() - 0.5) * 0.2, 0.09, 0.28, P.pWood(P.vary(pick(PAL.woodGrey), 0.18)), { ao: false }); }
    for (const sd of [-1, 1]) {
      const ox = rx * sd * (w / 2 - 0.15), oz = rz * sd * (w / 2 - 0.15);
      P.beam(ax + ox, y - 0.25, az + oz, bx + ox, y - 0.25, bz + oz, 0.18, 0.28, 0x4f3e30, { ao: false });
      const np = Math.max(1, Math.round(L / 3));
      for (let k = 0; k <= np; k++) { const t = k / np, x = ax + dx * t + ox * 1.12, z = az + dz * t + oz * 1.12, up = (k % 2 === 0) ? 0.75 + rng() * 0.3 : -0.1;
        P.log(x, -3.5, z, x + (rng() - 0.5) * 0.08, y + up, z, 0.16, P.vary(0x4a3b30, 0.15), { seg: 7, ls: 3, ao: false });
        if (up > 0.3 && rng() < 0.5) P.put(new THREE.TorusGeometry(0.2, 0.05, 4, 9).rotateX(Math.PI / 2), M4(x, y + 0.15, z), P.pFlat(PAL.rope), { ao: false }); }
    }
    const hw = w / 2;
    return { walls: [[ax + rx * hw, az + rz * hw, bx + rx * hw, bz + rz * hw], [ax - rx * hw, az - rz * hw, bx - rx * hw, bz - rz * hw], [bx + rx * hw, bz + rz * hw, bx - rx * hw, bz - rz * hw]],
      poly: [[ax + rx * hw, az + rz * hw], [bx + rx * hw, bz + rz * hw], [bx - rx * hw, bz - rz * hw], [ax - rx * hw, az - rz * hw]] };
  };

  /* ── 배(클링커 이음 — 줄마다 턱) · 큰 배 = 돛 + 용머리 + 방패 줄 / 작은 배 = 고기잡이 ── 로컬 +Z = 뱃머리 */
  P.hull = (M, o) => {
    const Lh = o.L / 2, B = o.B / 2, D = o.D, sh = o.sheer ?? 1.4, ns = o.ns ?? 22, nt = o.nt ?? 7;
    const bw = (s) => B * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 2.3)), 0.55), ky = (s) => -D + D * 0.85 * Math.pow(Math.abs(s), 3), gy = (s) => 0.45 + sh * Math.pow(Math.abs(s), 2.6);
    const P3 = (s, t, side, lift) => V3(side * (bw(s) * Math.sin(t * Math.PI / 2) + lift), ky(s) + (gy(s) - ky(s)) * (1 - Math.cos(t * Math.PI / 2)), s * Lh);
    const pos = [], col = [], strake = o.strake ?? [0x5a4231, 0x6a4d36, 0x4e3a2c], top = o.top ?? PAL.red;
    for (const side of [-1, 1]) for (let i = 0; i < ns; i++) for (let j = 0; j < nt; j++) {
      const sa = -1 + 2 * i / ns, sb = -1 + 2 * (i + 1) / ns, ta = j / nt, tb = (j + 1) / nt, lift = 0.035;
      const A = P3(sa, ta, side, lift), Bq = P3(sb, ta, side, lift), C = P3(sb, tb, side, 0), Dq = P3(sa, tb, side, 0);
      _c.setHex(j === nt - 1 ? top : strake[j % strake.length]).multiplyScalar(0.86 + 0.2 * N.v2(i * 0.7 + side * 5, j * 1.3));
      if (o.char) _c.lerp(_c2.setHex(PAL.char), ss(0.5, 0.7, N.v2(i * 0.4 + 20, j * 0.6)) * o.char);
      const tri = side > 0 ? [A, Bq, C, A, C, Dq] : [A, C, Bq, A, Dq, C];
      for (const v of tri) { pos.push(v.x, v.y, v.z); col.push(_c.r, _c.g, _c.b); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const out = prep(g, M, null, { ao: false }); out.attributes.color.array.set(col); binPut(out, 'd');
    /* 갑판 · 가로대 */
    const dy = ky(0) + (gy(0) - ky(0)) * 0.62;
    for (let s = -0.78; s <= 0.78; s += 0.035 * 20 / o.L) { const w = bw(s) * Math.sin(0.62 * Math.PI / 2 + 0.25) * 1.9; if (w > 0.3) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, dy, s * Lh)), w, 0.06, 0.3 * o.L / 20 + 0.08, P.pWood(P.vary(0x7d5f42, 0.15)), { ao: false }); }
    for (let s = -0.6; s <= 0.61; s += 0.2) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, dy + 0.45, s * Lh)), bw(s) * 1.85, 0.08, 0.26, P.pWood(0x5d4532), { ao: false });
    /* 이물·고물 기둥 — 뱃머리는 용머리(목이 솟고 주둥이가 앞으로 · 뿔 하나) · 고물은 말린 꼬리 */
    const zb = Lh, yb = gy(1);
    const stem = (sgn, pts, w0, w1, wE) => P.put(bandGeo(pts.map(([zz, yy]) => [zz, yy]), w0, w1, 0.2, wE), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0, 0, sgn > 0 ? -Math.PI / 2 : Math.PI / 2)), P.pWood(o.post ?? 0x4a3527, { char: o.char }), { ao: false, mat: 'd' });
    const keelPts = (sgn) => { const a = []; for (let k = 0; k <= 6; k++) { const s = 0.7 + 0.3 * k / 6; a.push([s * Lh, ky(s) - 0.05]); } return a; };
    if (o.head) {
      const hp = keelPts(1).concat([[zb + 0.15, yb + 0.1], [zb + 0.45, yb + 0.75], [zb + 0.55, yb + 1.45], [zb + 0.48, yb + 2.0], [zb + 0.72, yb + 2.38], [zb + 1.25, yb + 2.42]]);
      stem(1, hp, 0.34, 0.26, 0.42);
      P.put(bandGeo([[zb + 0.72, yb + 2.12], [zb + 1.0, yb + 2.02], [zb + 1.18, yb + 2.06]], 0.13, 0.1, 0.16), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0, 0, -Math.PI / 2)), P.pWood(0x4a3527), { ao: false, mat: 'd' });
      P.put(bandGeo([[zb + 0.6, yb + 2.4], [zb + 0.42, yb + 2.7], [zb + 0.2, yb + 2.86]], 0.12, 0.06, 0.12), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0, 0, -Math.PI / 2)), P.pWood(0x3e2c20), { ao: false, mat: 'd' });
      const tp = keelPts(1).map(([zz, yy]) => [-zz, yy]).concat([[-zb - 0.15, yb + 0.1], [-zb - 0.4, yb + 0.8], [-zb - 0.45, yb + 1.45], [-zb - 0.2, yb + 1.85], [-zb + 0.08, yb + 1.7], [-zb + 0.05, yb + 1.45]]);
      stem(1, tp, 0.32, 0.18);
    } else {
      stem(1, keelPts(1).concat([[zb + 0.12, yb + 0.12], [zb + 0.22, yb + 0.5]]), 0.22, 0.18);
      stem(1, keelPts(1).map(([zz, yy]) => [-zz, yy]).concat([[-zb - 0.12, yb + 0.12], [-zb - 0.2, yb + 0.45]]), 0.22, 0.18);
    }
    /* 방패 줄(뱃전 바깥) */
    if (o.shields) for (const side of [-1, 1]) for (let s = -0.6; s <= 0.61; s += 1.15 / Lh) {
      const x = side * (bw(s) + 0.06), y = gy(s) - 0.28;
      P.shield(new THREE.Matrix4().multiplyMatrices(M, M4(x, y, s * Lh, side > 0 ? Math.PI / 2 : -Math.PI / 2, -0.12)), 0.42);
    }
    /* 돛대 · 활대 · 돛(줄무늬 · 바람에 부푼 모양) · 버팀줄 */
    if (o.mast) {
      const mh = o.mastH ?? 9, my = dy, mz = 0.05 * Lh, mt = V3(0, my + mh, mz).applyMatrix4(M), mb = V3(0, my - 0.2, mz).applyMatrix4(M);
      P.log(mb.x, mb.y, mb.z, mt.x, mt.y, mt.z, 0.17, 0x5a4230, { seg: 7, ao: false });
      const yw = o.sailW ?? B * 3.1, ya = V3(-yw / 2, my + mh - 0.9, mz + 0.2).applyMatrix4(M), yb2 = V3(yw / 2, my + mh - 0.9, mz + 0.2).applyMatrix4(M);
      P.log(ya.x, ya.y, ya.z, yb2.x, yb2.y, yb2.z, 0.1, 0x5a4230, { seg: 6, ao: false });
      if (o.sail !== false) {
        const sh2 = o.sailH ?? mh * 0.55, sp = new THREE.PlaneGeometry(yw * 0.96, sh2, 10, 8), pa = sp.attributes.position;
        for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) / (yw / 2), y = (pa.getY(i) + sh2 / 2) / sh2; pa.setZ(i, (1 - x * x) * (0.5 + 0.5 * Math.sin(y * Math.PI)) * (o.billow ?? 0.9)); }
        const [c1, c2] = o.sailCols ?? [PAL.cloth, PAL.red];
        P.put(sp, new THREE.Matrix4().multiplyMatrices(M, M4(0, my + mh - 0.9 - sh2 / 2 - 0.05, mz + 0.3)), (c, lx, ly, lz, wx, wy, wz) => { const st = Math.floor((lx / yw + 0.5) * 7); c.setHex(st % 2 ? c2 : c1).multiplyScalar(0.88 + 0.12 * N.v2(wx * 0.5, wy * 0.5)); }, { flat: true, mat: 'd', ao: false });
      }
      for (const zz of [Lh * 0.95, -Lh * 0.9]) { const e = V3(0, gy(zz / Lh) + 0.1, zz).applyMatrix4(M); P.log(mt.x, mt.y - 0.2, mt.z, e.x, e.y, e.z, 0.025, PAL.rope, { seg: 4, ls: 1, ao: false }); }
      for (const sd of [-1, 1]) for (const zz of [-0.15, 0.2]) { const e = V3(sd * bw(zz) * 0.97, gy(zz) + 0.05, zz * Lh).applyMatrix4(M); P.log(mt.x, mt.y - 0.6, mt.z, e.x, e.y, e.z, 0.022, PAL.rope, { seg: 4, ls: 1, ao: false }); }
    }
    return { bw, gy, ky, dy, Lh };
  };

  /* ── 망루(네 다리 + X 버팀 · 위 판 + 난간 + 작은 지붕 + 불 바구니) — 다리 = 원기둥 장애물 · 둘레 = 벽(계단 들어오는 쪽만 틈) ── */
  P.tower = (group, x, z, yaw, o = {}) => {
    const gh = P.ground || (() => 0), hs = (o.size ?? 4.4) / 2, top = o.top, g0 = gh(x, z), M = M4(x, 0, z, yaw), hex = o.hex ?? 0x5a4331;
    const W = (lx, ly, lz) => V3(lx, ly, lz).applyMatrix4(M);
    const corners = [[-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs]], blockers = [];
    for (const [cx, cz] of corners) {
      const b = W(cx * 1.12, 0, cz * 1.12), t = W(cx, 0, cz), gb = gh(b.x, b.z);
      P.log(b.x, gb - 0.5, b.z, t.x, top + 1.25, t.z, 0.22, P.vary(hex, 0.1), { seg: 8, ls: 5 });
      blockers.push({ x: b.x, z: b.z, r: 0.32 });
    }
    /* X 버팀 두 층 */
    for (let lv = 0; lv < 2; lv++) {
      const y0 = g0 + 0.6 + lv * (top - g0) * 0.48, y1 = g0 + 0.6 + (lv + 1) * (top - g0) * 0.48 - 0.4;
      for (let k = 0; k < 4; k++) { const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4], A = W(ax * 1.06, 0, az * 1.06), B = W(bx * 1.06, 0, bz * 1.06);
        P.log(A.x, y0, A.z, B.x, y1, B.z, 0.09, 0x56402f, { seg: 6 }); P.log(A.x, y1, A.z, B.x, y0, B.z, 0.09, 0x56402f, { seg: 6 }); P.log(A.x, y1 + 0.2, A.z, B.x, y1 + 0.2, B.z, 0.1, 0x5e4632, { seg: 6 }); }
    }
    /* 위 판 · 난간 · 기둥 위 작은 곡선 지붕 · 불 바구니 */
    const n = Math.round(hs * 2 / 0.3);
    for (let i = 0; i < n; i++) P.box(new THREE.Matrix4().multiplyMatrices(M, M4(-hs - 0.2 + (i + 0.5) * (hs * 2 + 0.4) / n, top - 0.05, 0)), (hs * 2 + 0.4) / n - 0.02, 0.1, hs * 2 + 0.4, P.pWood(P.vary(0x7a5c40, 0.15)), { ao: false });
    for (let k = 0; k < 4; k++) { const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4]; if (k === (o.gapSide ?? 2)) continue;
      const A = W(ax, 0, az), B = W(bx, 0, bz); P.log(A.x, top + 1.0, A.z, B.x, top + 1.0, B.z, 0.07, 0x6a4f37, { seg: 6 }); P.log(A.x, top + 0.5, A.z, B.x, top + 0.5, B.z, 0.05, 0x6a4f37, { seg: 5 }); }
    const rf = P.roof(new THREE.Matrix4().multiplyMatrices(M, M4(0, top + 2.9, 0)), { w: hs * 2, d: hs * 2, H: 1.5, ohE: 0.5, ohG: 0.5, sag: 0.08, up: 0.35, kind: 'shingle', hex: PAL.shingle, t: 0.16 });
    for (const [cx, cz] of corners) { const t = W(cx, 0, cz); P.log(t.x, top + 1.2, t.z, t.x, top + 2.85, t.z, 0.12, hex, { seg: 6 }); }
    P.gableDeco(new THREE.Matrix4().multiplyMatrices(M, M4(0, top + 2.9, hs + 0.48)), rf, 1, { k: 0.6 });
    P.gableDeco(new THREE.Matrix4().multiplyMatrices(M, M4(0, top + 2.9, -hs - 0.48, Math.PI)), rf, 0, { k: 0.6 });
    const fb = W(hs * 0.45, 0, -hs * 0.45);
    P.log(fb.x, top, fb.z, fb.x, top + 1.0, fb.z, 0.08, PAL.iron, { seg: 5, ao: false });
    const tt = P.torch(group, fb.x, top + 1.0, fb.z, { noPost: true, s: 1.7, flame: 1.5, glow: 7.5, op: 0.6 });
    /* 뿔피리 걸이 */
    const hn = W(-hs * 0.6, 0, hs * 0.6); P.put(new THREE.ConeGeometry(0.1, 0.7, 6, 2, true).rotateZ(1.2), M4(hn.x, top + 1.25, hn.z, yaw), P.pFlat(0xd8cfb8), { ao: false, mat: 'd' });
    const ring = corners.map(([cx, cz]) => { const p = W(cx, 0, cz); return [p.x, p.z]; });
    const walls = [];
    for (let k = 0; k < 4; k++) { const a = ring[k], b = ring[(k + 1) % 4]; if (k === (o.gapSide ?? 2)) { const m1 = [a[0] + (b[0] - a[0]) * 0.28, a[1] + (b[1] - a[1]) * 0.28], m2 = [a[0] + (b[0] - a[0]) * 0.72, a[1] + (b[1] - a[1]) * 0.72]; walls.push([a[0], a[1], m1[0], m1[1]], [m2[0], m2[1], b[0], b[1]]); } else walls.push([a[0], a[1], b[0], b[1]]); }
    return { walls, blockers, poly: ring, top, torch: tt, W };
  };

  /* ── 대장간 도구들 ── M = 놓을 자리(+Z가 앞) */
  P.anvil = (M) => {
    const s = new THREE.Shape([[-0.55, 0], [-0.32, 0.05], [-0.25, 0.32], [-0.62, 0.4], [-0.95, 0.5], [-0.62, 0.55], [0.45, 0.55], [0.45, 0.4], [0.28, 0.34], [0.22, 0.05], [0.45, 0]].map(([a, b]) => new THREE.Vector2(a, b)));
    P.put(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1 }).translate(0, 0, -0.15), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.62, 0)), P.pFlat(0x4a4a4e, 0.1), { ao: false });
    const a = V3(0, 0, 0).applyMatrix4(M); P.log(a.x, a.y - 0.1, a.z, a.x, a.y + 0.63, a.z, 0.33, 0x6a4c34, { seg: 9, ls: 1 });
  };
  P.bellows = (M) => {
    const s = new THREE.Shape([[0, -0.45], [0.55, -0.4], [1.0, -0.1], [1.05, 0], [1.0, 0.1], [0.55, 0.4], [0, 0.45], [-0.15, 0]].map(([a, b]) => new THREE.Vector2(a, b)));
    for (const y of [0.55, 0.95]) P.put(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }).rotateX(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(M, M4(0, y, 0)), P.pWood(0x6a4a30), { ao: y < 0.6 });
    const bag = new THREE.CylinderGeometry(0.5, 0.5, 0.36, 10, 2).scale(1.0, 1, 0.85); const bp = bag.attributes.position;
    for (let i = 0; i < bp.count; i++) { const y = bp.getY(i); bp.setX(i, bp.getX(i) * (1 + 0.12 * Math.cos(y * 8))); bp.setZ(i, bp.getZ(i) * (1 + 0.12 * Math.cos(y * 8))); }
    P.put(bag, new THREE.Matrix4().multiplyMatrices(M, M4(0.42, 0.75, 0)), P.pFlat(PAL.leather, 0.15), { ao: false });
    P.put(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6).rotateZ(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(M, M4(1.3, 0.75, 0)), P.pIron(), { ao: false });
    P.put(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5).rotateZ(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(M, M4(-0.45, 0.95, 0)), P.pWood(0x5a4230), { ao: false });
    for (const [lx, lz] of [[0.1, -0.3], [0.1, 0.3], [0.9, -0.15], [0.9, 0.15]]) { const p = V3(lx, 0, lz).applyMatrix4(M); P.log(p.x, p.y, p.z, p.x, p.y + 0.55, p.z, 0.05, 0x5a4230, { seg: 5, ls: 1 }); }
  };
  P.grindstone = (M) => {
    P.put(new THREE.CylinderGeometry(0.5, 0.5, 0.16, 16, 1).rotateZ(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.95, 0)), P.pStone(0x8c887c, { moss: 0 }), { flat: true, ao: false });
    P.put(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 5).rotateZ(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.95, 0)), P.pIron(), { ao: false });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const a = V3(sx * 0.3, 0, sz * 0.35).applyMatrix4(M), b = V3(sx * 0.3, 0.98, 0).applyMatrix4(M); P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.05, 0x5a4230, { seg: 5, ls: 1 }); }
    const c1 = V3(0.42, 0.95, 0).applyMatrix4(M), c2 = V3(0.42, 0.7, 0.15).applyMatrix4(M); P.log(c1.x, c1.y, c1.z, c2.x, c2.y, c2.z, 0.025, PAL.iron, { seg: 4, ls: 1, ao: false });
    P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.3, 0)), 0.3, 0.25, 0.9, P.pWood(0x6a4c34)); P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.43, 0)), 0.22, 0.02, 0.8, P.pFlat(0x3f6470, 0.05), { ao: false });
  };
  /* 무기 하나(칼·도끼·창·망치·철퇴) — 로컬 Y = 자루 방향 · 놓을 자리 M */
  P.weapon = (M, kind) => {
    const wood = P.vary(0x5e4430, 0.2), steel = P.pFlat(0x8a8c90, 0.08);
    if (kind === 'sword') { P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.62, 0)), 0.08, 0.9, 0.025, steel, { ao: false }); P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.15, 0)), 0.26, 0.05, 0.05, P.pIron(), { ao: false }); P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.03, 0)), 0.05, 0.2, 0.05, P.pFlat(PAL.leather), { ao: false }); }
    else if (kind === 'axe' || kind === 'hammer') {
      P.put(new THREE.CylinderGeometry(0.03, 0.035, 0.95, 5), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.47, 0)), P.pWood(wood), { ao: false });
      if (kind === 'axe') { const s = new THREE.Shape([[0, -0.07], [0.12, -0.1], [0.24, -0.2], [0.27, 0], [0.24, 0.2], [0.12, 0.1], [0, 0.07]].map(([a, b]) => new THREE.Vector2(a, b))); P.put(new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.015), new THREE.Matrix4().multiplyMatrices(M, M4(0.02, 0.85, 0)), steel, { ao: false }); }
      else P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.9, 0)), 0.3, 0.13, 0.13, P.pIron(), { ao: false });
    } else if (kind === 'spear') { P.put(new THREE.CylinderGeometry(0.025, 0.03, 1.9, 5), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.95, 0)), P.pWood(wood), { ao: false }); P.put(new THREE.ConeGeometry(0.05, 0.3, 4), new THREE.Matrix4().multiplyMatrices(M, M4(0, 2.0, 0)), steel, { ao: false }); }
    else { P.put(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 5), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.4, 0)), P.pWood(wood), { ao: false }); P.put(new THREE.IcosahedronGeometry(0.11, 0), new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.82, 0)), P.pIron(), { ao: false, flat: true }); }
  };
  /* 무기·방패 걸이(기둥 둘 + 가로대 둘 · 무기 기대 놓음 + 방패 몇) */
  P.rack = (M, len = 2.4, o = {}) => {
    for (const sx of [-1, 1]) { const a = V3(sx * len / 2, -0.3, 0).applyMatrix4(M), b = V3(sx * len / 2, 1.6, 0).applyMatrix4(M); P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.08, 0x5a4230, { seg: 6, ls: 1 }); }
    for (const y of [0.35, 1.35]) { const a = V3(-len / 2, y, 0).applyMatrix4(M), b = V3(len / 2, y, 0).applyMatrix4(M); P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.06, 0x6a4f37, { seg: 5, ls: 1 }); }
    const kinds = o.kinds || ['sword', 'axe', 'spear', 'hammer', 'axe', 'sword', 'mace'];
    for (let i = 0, n = Math.floor(len / 0.4); i < n; i++) P.weapon(new THREE.Matrix4().multiplyMatrices(M, M4(-len / 2 + 0.25 + i * 0.4, 0.05, 0.12, 0, -0.2)), kinds[(i + (o.k || 0)) % kinds.length]);
    if (o.shields) for (let i = 0; i < o.shields; i++) P.shield(new THREE.Matrix4().multiplyMatrices(M, M4(-len / 2 + 0.5 + i * (len - 1) / Math.max(1, o.shields - 1), 1.1, -0.1, Math.PI)), 0.4);
  };

  /* ── 투석기(나무 틀 + 팔 + 돌 바구니) · 볼라 발사기(받침 돌개 + 큰 활 + 돌 두 개 끈) ── */
  P.catapult = (M) => {
    const W = (a, b, c) => V3(a, b, c).applyMatrix4(M), lg = (a, b, r, h) => P.log(a.x, a.y, a.z, b.x, b.y, b.z, r, h ?? 0x5a4230, { seg: 6 });
    for (const sx of [-1, 1]) { lg(W(sx * 0.9, 0.2, -1.6), W(sx * 0.9, 0.2, 1.6), 0.15); lg(W(sx * 0.9, 0.2, -0.9), W(sx * 0.7, 2.1, 0), 0.11); lg(W(sx * 0.9, 0.2, 0.9), W(sx * 0.7, 2.1, 0), 0.11);
      for (const zz of [-1.2, 1.2]) P.put(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 12).rotateZ(Math.PI / 2), new THREE.Matrix4().multiplyMatrices(M, M4(sx * 1.08, 0.42, zz)), P.pWood(0x4a3628), { flat: true }); }
    lg(W(-0.9, 0.25, 1.4), W(0.9, 0.25, 1.4), 0.12); lg(W(-0.9, 0.25, -1.4), W(0.9, 0.25, -1.4), 0.12); lg(W(-0.8, 2.05, 0), W(0.8, 2.05, 0), 0.1);
    lg(W(0, 1.1, 1.3), W(0, 2.6, -1.9), 0.12, 0x6a4c34);
    P.put(new THREE.SphereGeometry(0.42, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.Matrix4().multiplyMatrices(M, M4(0, 2.75, -2.0)), P.pWood(0x5a4230), { mat: 'd' });
    P.blob(W(0, 2.85, -2.0).x, W(0, 2.85, -2.0).y, W(0, 2.85, -2.0).z, 0.3, PAL.rock2, { ao: false });
    P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 0.85, 1.35)), 0.7, 0.6, 0.6, P.pStone(PAL.rock2), { flat: true, jit: 0.04, facet: true });
  };
  P.bolaLauncher = (M) => {
    const W = (a, b, c) => V3(a, b, c).applyMatrix4(M);
    const b0 = W(0, 0, 0); P.log(b0.x, b0.y - 0.2, b0.z, b0.x, b0.y + 1.3, b0.z, 0.28, 0x5a4230, { seg: 8 });
    P.put(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 12), new THREE.Matrix4().multiplyMatrices(M, M4(0, 1.35, 0)), P.pWood(0x6a4c34), { flat: true });
    P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 1.6, 0.3, 0, -0.15)), 0.3, 0.25, 2.4, P.pWood(0x5f4430));
    const pts = []; for (let k = 0; k <= 12; k++) { const a = -1 + 2 * k / 12; pts.push(V3(a * 1.5, 1.72 + 0, 1.3 - 0.35 * (1 - a * a)).applyMatrix4(M)); }
    P.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.06, 5), null, P.pWood(0x4a3527), { ao: false });
    for (const sx of [-1, 1]) { const a = W(sx * 1.5, 1.72, 1.3), b = W(sx * 0.1, 1.72, -0.5); P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.012, PAL.rope, { seg: 3, ls: 1, ao: false }); }
    for (const sx of [-1, 1]) { const s = W(sx * 0.35, 1.85, 0.9); P.blob(s.x, s.y, s.z, 0.14, PAL.rock2, { ao: false, detail: 0, sy: 1 }); }
    const r1 = W(-0.35, 1.85, 0.9), r2 = W(0.35, 1.85, 0.9); P.log(r1.x, r1.y, r1.z, r2.x, r2.y, r2.z, 0.018, PAL.rope, { seg: 3, ls: 1, ao: false });
    P.box(new THREE.Matrix4().multiplyMatrices(M, M4(0, 1.45, -1.0)), 0.06, 0.5, 0.06, P.pIron());
  };

  /* ── 깃발(장대 + 흔들리는 천) ── */
  P.flag = (x, y, z, yaw, o = {}) => {
    const h = o.h ?? 6; P.log(x, y - 0.3, z, x, y + h, z, 0.07, 0x5a4230, { seg: 6 });
    const [a, b] = o.cols ?? pick(SHIELD_COLS), w = o.w ?? 1.7, fh = o.fh ?? 1.0;
    P.cloth(w, fh, M4(x + 0.05 * Math.sin(yaw), y + h - 0.1, z + 0.05 * Math.cos(yaw), yaw - Math.PI / 2), (c, lx, ly, lz, wx, wy, wz) => { const band = Math.abs(ly + fh / 2) < fh * 0.18; c.setHex(band ? b : a).multiplyScalar(0.9 + 0.1 * N.v2(wx, wy)); }, { amp: o.amp ?? 0.22 });
  };

  /* ── 우리 문(나무 + 쇠띠) — 인스턴스로 쓸 기하 하나 · 아래 가운데 = 원점 · 경첩 = 로컬 x = -w/2 ── */
  P.cageDoorGeo = (w = 5.2, h = 5.0) => {
    const parts = [], n = Math.round(w / 0.42);
    for (let i = 0; i < n; i++) parts.push(prep(new THREE.BoxGeometry(w / n - 0.03, h - (i % 3) * 0.04, 0.18, 1, 3, 1), M4(-w / 2 + (i + 0.5) * w / n, h / 2, 0), P.pWood(P.vary(0x5c432f, 0.15)), { ao: false, jit: 0.01 }));
    for (const y of [0.6, h / 2, h - 0.6]) parts.push(prep(new THREE.BoxGeometry(w + 0.06, 0.22, 0.08), M4(0, y, 0.12), P.pFlat(0x3a393b, 0.1), { ao: false }));
    for (let i = 0; i < 12; i++) parts.push(prep(new THREE.SphereGeometry(0.05, 4, 3), M4(-w / 2 + 0.3 + (i % 6) * (w - 0.6) / 5, i < 6 ? 0.6 : h - 0.6, 0.17), P.pFlat(0x5a5a5c), { ao: false }));
    parts.push(prep(new THREE.BoxGeometry(0.2, h * 0.9, 0.2), M4(0, h * 0.45, 0.2, 0, 0, 0.62), P.pFlat(0x3a393b, 0.1), { ao: false }));   // 빗장 대각 쇠
    const g = mergeGeometries(parts, false); for (const p of parts) p.dispose(); return g;
  };
  /* 쇠사슬 고리 하나(인스턴스용 · 로컬 X = 사슬 방향) */
  P.chainLinkGeo = (len = 0.42, r = 0.035) => { const g = new THREE.TorusGeometry(0.11, r, 3, 6).scale(len / 0.26, 1, 1); return prep(g, null, P.pFlat(0x48484c, 0.12), { ao: false }); };
  /* 깎은 돌벽 고리(안쪽을 보는 원통 · 돌덩이마다 색 + 들쭉날쭉 · 위 갓돌) — 문 자리(gaps: [{a, w, h}])는 비움 */
  P.stoneRing = (cx, cz, r, y0, y1, o = {}) => {
    /* 줄마다 높이가 조금씩 다르고, 돌덩이 길이도 제각각(벽돌처럼 고르지 않게) · 몇 개는 툭 튀어나옴 */
    const hexes = o.hexes ?? PAL.stone, inward = o.inward !== false, C = 2 * Math.PI * r, rowH = o.row ?? 0.75;
    const gaps = o.gaps || [], inGap = (a, y) => gaps.some((g) => { const d = Math.atan2(Math.sin(a - g.a), Math.cos(a - g.a)); return Math.abs(d) * r < g.w / 2 && y < y0 + g.h; });
    let yy = y0;
    while (yy < y1 - 0.2) {
      const rh = Math.min(y1 - yy, rowH * (0.75 + rng() * 0.55)); let s0 = rng() * 1.5;
      while (s0 < C + 0.01) {
        const len = Math.min(C - s0 + 0.0, 1.0 + rng() * 1.9); if (len < 0.3) break;
        const a0 = s0 / r, a1 = (s0 + len) / r, am = (a0 + a1) / 2; s0 += len;
        if (inGap(am, yy + rh / 2)) continue;
        const out = rng() < 0.12 ? 0.12 + rng() * 0.12 : (rng() - 0.5) * 0.08, dep = (o.dep ?? 0.9) + (rng() - 0.5) * 0.25, rr = r - (inward ? out : -out), L = 2 * rr * Math.sin((a1 - a0) / 2) - 0.05;
        const x = cx + Math.cos(am) * (rr + (inward ? dep / 2 : -dep / 2)), z = cz + Math.sin(am) * (rr + (inward ? dep / 2 : -dep / 2));
        P.box(M4(x, yy + rh / 2, z, -am + Math.PI / 2, (rng() - 0.5) * 0.04, (rng() - 0.5) * 0.05), L, rh - 0.06, dep, P.pStone(P.vary(pick(hexes), 0.16), { moss: o.moss ?? 0.3, wet: o.wet }), { sx: 2, sy: 1, sz: 1, flat: true, jit: o.jit ?? 0.06, facet: true, ao: o.ao });
      }
      yy += rh;
    }
  };

  /* ── 양 우리(울타리 + 작은 헛간 + 건초 + 물통) — 양은 팀 M · 지금은 빈 우리 ── */
  P.sheepPen = (x, z, yaw, w = 12, d = 9) => {
    const M = M4(x, 0, z, yaw), W = (a, b) => { const p = V3(a, 0, b).applyMatrix4(M); return [p.x, p.z]; };
    const pts = [W(-w / 2 + 2.2, d / 2), W(-w / 2, d / 2), W(-w / 2, -d / 2), W(w / 2, -d / 2), W(w / 2, d / 2), W(-w / 2 + 4.0, d / 2)];
    const walls = P.fence(pts, { hex: 0x6f5a45 });
    const gh = P.ground || (() => 0), sh = V3(w / 2 - 2.2, 0, -d / 2 + 1.8).applyMatrix4(M), g = gh(sh.x, sh.z);
    const SM = M4(sh.x, g, sh.z, yaw);
    for (const [a, b] of [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]]) { const p = V3(a, 0, b).applyMatrix4(SM); P.log(p.x, g - 0.3, p.z, p.x, g + 1.9 - (b > 0 ? 0.5 : 0), p.z, 0.1, 0x5a4230, { seg: 6 }); }
    P.roof(new THREE.Matrix4().multiplyMatrices(SM, M4(0, 1.6, 0, Math.PI / 2, -0.25)), { w: 2.6, d: 3.2, H: 0.5, ohE: 0.4, ohG: 0.3, sag: 0.05, up: 0.1, kind: 'turf', hex: PAL.turf, ridge: false, t: 0.15 });
    for (let i = 0; i < 4; i++) P.blob(V3(-0.6 + i * 0.4, 0, 0.2).applyMatrix4(SM).x, g + 0.3, V3(-0.6 + i * 0.4, 0, 0.2).applyMatrix4(SM).z, 0.45, PAL.hay, { moss: 0, rough: 0.3 });
    const tr = V3(-w / 2 + 2, 0, -d / 2 + 1.2).applyMatrix4(M); P.box(M4(tr.x, gh(tr.x, tr.z) + 0.25, tr.z, yaw), 1.6, 0.4, 0.5, P.pWood(0x5f4632));
    P.box(M4(tr.x, gh(tr.x, tr.z) + 0.43, tr.z, yaw), 1.45, 0.04, 0.36, P.pFlat(0x3f6470, 0.05), { ao: false });
    return { walls, gate: W(-w / 2 + 3.1, d / 2 + 1.2) };
  };

  /* ── 짓는 중인 집 비계(장대 + 발판 + 사다리) ── */
  P.scaffold = (M, w, h) => {
    const gh = P.ground || (() => 0);
    for (const sx of [-w / 2, 0, w / 2]) { const p = V3(sx, 0, 0.9).applyMatrix4(M), q = V3(sx, 0, 0).applyMatrix4(M); P.log(p.x, gh(p.x, p.z) - 0.3, p.z, p.x, h, p.z, 0.07, PAL.fresh, { seg: 5 }); P.log(q.x, gh(q.x, q.z) - 0.3, q.z, q.x, h - 0.3, q.z, 0.07, PAL.fresh, { seg: 5 }); }
    for (const y of [h * 0.45, h * 0.85]) for (let k = 0; k < 3; k++) { const p = V3(-w / 2 - 0.3, 0, 0.25 + k * 0.25).applyMatrix4(M), q = V3(w / 2 + 0.3, 0, 0.25 + k * 0.25).applyMatrix4(M); P.beam(p.x, y, p.z, q.x, y, q.z, 0.24, 0.05, P.vary(PAL.fresh, 0.15)); }
    const l0 = V3(w / 2 + 0.6, 0, 1.4).applyMatrix4(M), y0 = gh(l0.x, l0.z);
    for (const sd of [-0.25, 0.25]) { const a = V3(w / 2 + 0.6 + sd, 0, 1.4).applyMatrix4(M), b = V3(w / 2 + 0.6 + sd, 0, 0.95).applyMatrix4(M); P.log(a.x, y0, a.z, b.x, h * 0.85, b.z, 0.04, PAL.fresh2, { seg: 4, ls: 2 }); }
    for (let k = 1; k < 9; k++) { const t = k / 9, y = y0 + (h * 0.85 - y0) * t, a = V3(w / 2 + 0.35, 0, 1.4 - 0.45 * t).applyMatrix4(M), b = V3(w / 2 + 0.85, 0, 1.4 - 0.45 * t).applyMatrix4(M); P.log(a.x, y, a.z, b.x, y, b.z, 0.025, PAL.fresh2, { seg: 4, ls: 1 }); }
  };

  /* ── 나무집 하나(통나무 벽 또는 세로 널벽 · 돌 받침 또는 다리 기둥 · 곡선 지붕 · 박공 장식 · 문 · 창 · 덤) ──
     o = { x, z, yaw, w, d, hw, floor, kind: 'log'|'stave', roof: 'shingle'|'turf'|'paint', H, stilts, rebuild, char, extras, deco } → { walls, door, poly } */
  P.house = (group, o) => {
    const gh = P.ground || (() => 0), w = o.w, d = o.d, hw = o.hw ?? 2.7, yaw = o.yaw ?? 0, M = M4(o.x, o.floor, o.z, yaw);
    const W = (a, b, c) => V3(a, b, c).applyMatrix4(M), Mx = (a, b, c, yy = 0, p = 0, r = 0) => new THREE.Matrix4().multiplyMatrices(M, M4(a, b, c, yy, p, r));
    const wood = o.wood ?? P.vary(pick(rng() < 0.35 ? PAL.woodGrey : PAL.wood), 0.14), r = 0.19, s = r * 1.86, ext = 0.32, char = o.char || 0;
    const nk = Math.max(4, Math.round(hw / s)), dw = 1.3, dh = 2.05, freshW = (lz, side) => o.rebuild && side === 'e+' && lz > d * 0.1;
    /* 받침 */
    const corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => W(a, 0, b));
    const gmin = Math.min(...corners.map((p) => gh(p.x, p.z)), gh(o.x, o.z));
    if (o.stilts) {
      for (let i = 0; i <= 3; i++) for (const sz of [-1, 1]) { const p = W(-w / 2 + i * w / 3, 0, sz * (d / 2 - 0.1)), g = gh(p.x, p.z); if (o.floor - g > 0.3) P.log(p.x, g - 0.4, p.z, p.x, o.floor, p.z, 0.15, 0x4f3d2f, { seg: 6 }); }
      for (const sz of [-1, 1]) for (let i = 0; i < 3; i++) { const a = W(-w / 2 + i * w / 3, 0, sz * (d / 2 - 0.1)), b = W(-w / 2 + (i + 1) * w / 3, 0, sz * (d / 2 - 0.1)), ga = gh(a.x, a.z), gb = gh(b.x, b.z); if (o.floor - Math.max(ga, gb) > 1.2) P.log(a.x, Math.max(ga, gb) + 0.3, a.z, b.x, o.floor - 0.3, b.z, 0.08, 0x56402f, { seg: 5 }); }
      P.box(Mx(0, -0.1, 0), w + 0.5, 0.2, d + 0.5, P.pWood(0x5d4632), { jit: 0.01 });
      P.plinth(M, w * 0.5, d * 0.5, -0.2, gmin - o.floor - 0.4, {});
    } else P.plinth(M, w + 0.55, d + 0.55, 0.02, gmin - o.floor - 0.45, {});
    /* 벽 */
    const logX = (z0, y, x0, x1, hex, ch) => { const a = W(x0, y, z0), b = W(x1, y, z0); P.log(a.x, a.y, a.z, b.x, b.y, b.z, r * (0.92 + rng() * 0.16), hex, { char: ch, seg: 6, ls: 1 }); };
    const logZ = (x0, y, z0, z1, hex, ch) => { const a = W(x0, y, z0), b = W(x0, y, z1); P.log(a.x, a.y, a.z, b.x, b.y, b.z, r * (0.92 + rng() * 0.16), hex, { char: ch, seg: 6, ls: 1 }); };
    const topCh = (y) => char * ss(hw * 0.4, hw, y);
    if ((o.kind || 'log') === 'log') {
      for (let k = 0; k < nk; k++) {
        const y = r + k * s, y2 = r + (k + 0.5) * s;
        for (const sx of [-1, 1]) { const hex = freshW(0, sx > 0 ? 'e+' : 'e-') && k > nk * 0.5 ? P.vary(PAL.fresh, 0.15) : P.vary(wood, 0.14); logZ(sx * w / 2, y, -d / 2 - ext, d / 2 + ext, hex, topCh(y)); }
        if (y2 + r > hw + 0.05) continue;
        for (const sz of [-1, 1]) {
          const hex = P.vary(wood, 0.14);
          if (sz > 0 && y2 < dh + 0.15) { logX(sz * d / 2, y2, -w / 2 - ext, -dw / 2 - 0.12, hex, topCh(y2)); logX(sz * d / 2, y2, dw / 2 + 0.12, w / 2 + ext, hex, topCh(y2)); }
          else logX(sz * d / 2, y2, -w / 2 - ext, w / 2 + ext, hex, topCh(y2));
        }
      }
    } else {
      const pw = 0.27;
      for (const sx of [-1, 1]) for (let i = 0, n = Math.round(d / pw); i < n; i++) { const lz = -d / 2 + (i + 0.5) * d / n, fr = freshW(lz, sx > 0 ? 'e+' : 'e-');
        P.box(Mx(sx * (w / 2 - 0.05), hw / 2, lz), 0.1, hw + (rng() - 0.5) * 0.06, d / n - 0.012, P.pWood(fr ? P.vary(PAL.fresh, 0.15) : P.vary(wood, 0.16), { char: topCh(hw) * 0.8 }), { sy: 2, jit: 0.006 }); }
      for (const sx of [-1, 1]) for (const y of [0.12, hw - 0.1]) { const a = W(sx * w / 2, y, -d / 2 - 0.25), b = W(sx * w / 2, y, d / 2 + 0.25); P.beam(a.x, a.y, a.z, b.x, b.y, b.z, 0.24, 0.24, 0x4a3628); }
      for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = W(cx * w / 2, 0, cz * d / 2); P.log(p.x, p.y - 0.1, p.z, p.x, p.y + hw + 0.05, p.z, 0.17, 0x4a3628, { seg: 7 }); }
    }
    /* 지붕 */
    const H = o.H ?? Math.max(2.6, w * 0.62), roofKind = o.roof || 'shingle';
    const hexR = roofKind === 'turf' ? PAL.turf : roofKind === 'paint' ? [o.paint ?? pick(PAL.paint), 0x5a4232] : PAL.shingle.map((h) => P.vary(h, 0.1));
    const fresh = o.rebuild ? (u, v, s2) => s2 > 0 && u > 0.55 : null;
    const roof = P.roof(Mx(0, hw, 0), { w: w + 2 * r, d, H, ohE: o.ohE ?? 0.75, ohG: o.ohG ?? 0.55, sag: o.sag ?? 0.22 + rng() * 0.12, up: o.up ?? 0.35 + rng() * 0.2, p: o.p ?? 1.4 + rng() * 0.2, kind: roofKind, hex: hexR, char, fresh, u1: char > 0.5 ? 0.72 : o.rebuild ? 0.8 : 1, cell: 0.78, row: 0.58 });   /* 탄 집 = 앞쪽 지붕이 타서 빔 */
    if (o.rebuild || char > 0.5) for (let z = d * (char > 0.5 ? 0.2 : 0.3); z < d / 2 + 0.4; z += 0.6) for (const sd of [-1, 1]) { const u = roof.uOf(z), a = W(0, hw + roof.Y(u, 0) - 0.15, z), b = W(sd * roof.X(u, 1) * 0.98, hw + roof.Y(u, 1) - 0.1, z); P.log(a.x, a.y, a.z, b.x, b.y, b.z, 0.07, char > 0.5 ? (rng() < 0.4 ? PAL.fresh : PAL.char) : PAL.fresh, { seg: 5, ls: 1 }); }
    /* 박공 세로 널(벽 위 세모) */
    for (const sz of [-1, 1]) {
      const pw = 0.38, n = Math.round((w + 0.2) / pw);
      for (let i = 0; i < n; i++) {
        const lx = -(w + 0.2) / 2 + (i + 0.5) * (w + 0.2) / n, top = roof.at(lx, sz * d / 2) - roof.t - 0.04; if (top < 0.15) continue;
        P.box(Mx(lx, hw + top / 2 - 0.05, sz * (d / 2 + 0.02)), (w + 0.2) / n - 0.015, top + 0.1, 0.1, P.pWood(P.vary(o.gable ?? wood, 0.16), { char: char * 0.9 }), { sy: 2, jit: 0.006 });
      }
    }
    for (const [u, sz] of [[1, 1], [0, -1]]) if (!((o.rebuild || char > 0.5) && u === 1)) P.gableDeco(Mx(0, hw, sz * (d / 2 + roof.L / 2 - d / 2 - 0.04), sz > 0 ? 0 : Math.PI), roof, u, { hex: o.deco ?? 0x4a3527, char, k: o.decoK ?? 0.9 + w * 0.02 });
    /* 문 · 앞 계단 · 창 · 방패 · 덤 */
    const nearWas = P.near; P.near = true;                                   // 문·창·방패·덤은 가까이 묶음(멀면 숨김)
    P.door(Mx(0, 0, d / 2 + (o.kind === 'stave' ? 0.02 : r * 0.6)), dw, dh, { hex: o.doorHex });
    const dt0 = W(0, 0, d / 2 + 0.3), fg = gh(W(0, 0, d / 2 + 1.0).x, W(0, 0, d / 2 + 1.0).z); let stepL = 0;
    if (o.floor - fg > 0.3) { stepL = (o.floor - fg) * 1.3 + 0.2; const a = W(0, 0, d / 2 + 0.3 + stepL); P.stairs(a.x, gh(a.x, a.z), a.z, dt0.x, o.floor, dt0.z, 1.5, { rail: false }); }
    const nwin = Math.max(1, Math.floor(d / 3.5)), wo = (o.kind || 'log') === 'log' ? r + 0.01 : 0.01;
    for (const sx of [-1, 1]) for (let i = 0; i < nwin; i++) { const lz = -d / 2 + (i + 0.5) * d / nwin + (rng() - 0.5) * 0.6; if (o.noWin && o.noWin(sx, lz)) continue; P.window(Mx(sx * (w / 2 + wo), 1.5, lz, sx * Math.PI / 2), 0.62, 0.58); if (o.two) P.window(Mx(sx * (w / 2 + wo), hw - 1.0, lz + 0.4, sx * Math.PI / 2), 0.55, 0.5); }
    const nsh = o.shields ?? Math.floor(rng() * 3);
    for (let i = 0; i < nsh; i++) { const sx = i % 2 ? 1 : -1; P.shield(Mx(sx * (w / 2 + r + 0.05), 1.75 + rng() * 0.3, -d / 2 + 1.0 + rng() * (d - 2.0), sx * Math.PI / 2, (rng() - 0.5) * 0.2), 0.42 + rng() * 0.06); }
    const ex = o.extras ?? [];
    if (ex.includes('wood')) P.woodpile(Mx(-w / 2 - 0.85, 0, -d * 0.1), Math.min(3, d * 0.45), 1.0 + rng() * 0.3);
    if (ex.includes('barrels')) { const p = W(w / 2 + 0.75, 0, d / 2 - 0.6); P.barrel(p.x, gh(p.x, p.z) - 0.05, p.z); const q = W(w / 2 + 0.8, 0, d / 2 - 1.5); P.barrel(q.x, gh(q.x, q.z) - 0.05, q.z, { h: 0.8, r: 0.33 }); }
    if (ex.includes('crates')) { const p = W(-w / 2 - 0.7, 0, d / 2 - 0.4); P.crate(p.x, gh(p.x, p.z) - 0.05, p.z, 0.7, yaw + 0.3); }
    if (ex.includes('vent')) { const a = W(0, hw + roof.Y(0.5, 0), d * 0.15); P.box(M4(a.x, a.y + 0.25, a.z, yaw), 0.7, 0.5, 0.9, P.pWood(0x4a3628)); P.box(M4(a.x, a.y + 0.6, a.z, yaw), 1.0, 0.1, 1.2, P.pWood(0x3e3026)); }
    P.near = nearWas;
    if (o.rebuild) P.scaffold(Mx(w / 2 + 0.2, 0, d * 0.25, Math.PI / 2), d * 0.55, o.floor + hw + 0.4);
    /* 걷기 벽(받침 둘레 + 여유) · 문 앞 자리 */
    const m = 0.45, fz = d / 2 + Math.max(m, stepL + 0.15), ring = [[-w / 2 - m - (ex.includes('wood') ? 1.0 : 0), -d / 2 - m], [w / 2 + m + (ex.includes('barrels') ? 0.9 : 0), -d / 2 - m], [w / 2 + m + (ex.includes('barrels') ? 0.9 : 0), fz], [-w / 2 - m, fz]].map(([a, b]) => { const p = W(a, 0, b); return [p.x, p.z]; });
    const walls = ring.map((a, i) => [a[0], a[1], ring[(i + 1) % 4][0], ring[(i + 1) % 4][1]]);
    const df = W(0, 0, fz + 1.0);
    return { walls, poly: ring, door: { x: df.x, z: df.z, yaw: yaw + Math.PI }, roof, M, W };
  };

  /* ── 나무 · 바위 · 풀 기하(인스턴스용) ── */
  P.pineGeo = (layers = 4) => {
    const parts = [prep(new THREE.CylinderGeometry(0.16, 0.3, 4.5, 6, 2).translate(0, 2.0, 0), null, P.pWood(0x4e3a2c), { ao: false })];
    for (let i = 0; i < layers; i++) {
      const t = i / layers, r = 2.4 * (1 - t * 0.78), h = 2.8 * (1 - t * 0.35), y = 1.6 + t * 6.4, cg = new THREE.ConeGeometry(r, h, 8, 1, true), cp = cg.attributes.position;
      for (let k = 0; k < cp.count; k++) { const yy = cp.getY(k); if (yy < -h / 2 + 0.01) { const a = Math.atan2(cp.getZ(k), cp.getX(k)); const f = 1 + 0.18 * Math.sin(a * 5 + i * 1.3); cp.setX(k, cp.getX(k) * f); cp.setZ(k, cp.getZ(k) * f); cp.setY(k, yy - 0.25 * (Math.sin(a * 5 + i) + 1) * 0.5); } }
      parts.push(prep(cg.translate(0, y + h / 2, 0), null, (c, lx, ly, lz) => { const tip = ss(0.5, 1.0, (ly - y) / h); c.setHex(PAL.pine).lerp(_c2.setHex(PAL.pine2), 0.4 + 0.6 * (1 - tip) * (i / layers)); c.multiplyScalar(0.8 + 0.25 * N.v2(lx * 2 + i, lz * 2)); }, { ao: false }));
    }
    const g = mergeGeometries(parts, false); for (const p of parts) p.dispose(); return g;
  };
  P.birchGeo = () => {
    const parts = [prep(new THREE.CylinderGeometry(0.11, 0.2, 6, 6, 4).translate(0, 3, 0), null, (c, lx, ly, lz) => { c.setHex(PAL.birch); if (N.v2(ly * 3.3, Math.atan2(lz, lx) * 2) > 0.68) c.setHex(0x3a342e); }, { ao: false })];
    for (let i = 0; i < 4; i++) { const a = i * 1.7, b = new THREE.IcosahedronGeometry(1.5 - i * 0.15, 0), bp = b.attributes.position; for (let k = 0; k < bp.count; k++) { const f = 1 + (N.v2(bp.getX(k) * 2 + i, bp.getY(k) * 2 + bp.getZ(k)) - 0.5) * 0.5; bp.setXYZ(k, bp.getX(k) * f, bp.getY(k) * f * 0.85, bp.getZ(k) * f); }
      parts.push(prep(b.translate(Math.cos(a) * 0.9 * (i ? 1 : 0), 5.2 + i * 0.6, Math.sin(a) * 0.9 * (i ? 1 : 0)), null, (c, lx, ly, lz, wx, wy, wz, nx, ny) => { c.setHex(PAL.leaf).multiplyScalar(0.72 + 0.35 * Math.max(0, ny) + 0.12 * N.v2(lx * 3, lz * 3)); }, { flat: true, facet: true, ao: false })); }
    const g = mergeGeometries(parts, false); for (const p of parts) p.dispose(); return g;
  };
  P.rockGeo = (seed = 1, sy = 0.7) => {
    const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (N.v2(x * 1.6 + seed * 7, y * 1.6 + z * 1.1) - 0.5) * 0.65; p.setXYZ(i, x * k, Math.max(-0.35, y * k * sy), z * k); }
    return prep(g, null, P.pStone(PAL.rock, { moss: 0.7 }), { flat: true, facet: true, ao: false });
  };
  P.grassGeo = () => {
    const pos = [];
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + rng(), r = 0.12 + rng() * 0.18, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 0.35 + rng() * 0.4, lx = Math.cos(a + 1.57) * 0.05, lz = Math.sin(a + 1.57) * 0.05, tx = Math.cos(a) * 0.18, tz = Math.sin(a) * 0.18;
      pos.push(x - lx, 0, z - lz, x + lx, 0, z + lz, x + tx, h, z + tz); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    return prep(g, null, (c, lx, ly) => { c.setHex(0x5e7444).multiplyScalar(0.6 + ly * 1.2); }, { ao: false });
  };

  /* ── 진눈깨비·비 줄기(카메라를 따라오는 상자 · 셰이더가 uTime으로 떨어뜨림 · 그리기 1) ── */
  P.precip = (group, kind = 'sleet', n = 1400, box = 46) => {
    const pos = new Float32Array(n * 6), seed = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { const x = (rng() - 0.5) * box, y = rng() * box, z = (rng() - 0.5) * box, s = rng(); for (let k = 0; k < 2; k++) { pos[i * 6 + k * 3] = x; pos[i * 6 + k * 3 + 1] = y; pos[i * 6 + k * 3 + 2] = z; seed[i * 2 + k] = k + s * 0.001; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const rain = kind === 'rain';
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uC: { value: new THREE.Vector3() }, uBox: { value: box }, uCol: { value: new THREE.Color(rain ? 0x9fb0c0 : 0xe8eef2) }, uLen: { value: rain ? 0.9 : 0.35 }, uSp: { value: rain ? 16 : 6.5 }, uWind: { value: new THREE.Vector2(rain ? 2.5 : 3.2, 1.2) }, uA: { value: rain ? 0.35 : 0.6 } }]),
      vertexShader: `uniform float uT; uniform vec3 uC; uniform float uBox; uniform float uLen; uniform float uSp; uniform vec2 uWind; attribute float seed; varying float vFogDepth; varying float vA;
        void main(){ float e = floor(seed); float s = fract(seed) * 1000.0; vec3 p = position; float fall = uT * uSp * (0.85 + 0.3 * fract(s * 7.13));
          p.y = mod(p.y - fall - uC.y, uBox); p.x = mod(p.x + uWind.x * (uT + s) * 0.35 - uC.x, uBox) - uBox * 0.5; p.z = mod(p.z + uWind.y * (uT + s) * 0.35 - uC.z, uBox) - uBox * 0.5;
          p += uC; p.y += -uBox * 0.4; vec3 dir = normalize(vec3(uWind.x * 0.06, -1.0, uWind.y * 0.06));
          p -= dir * e * uLen; p.x += sin(uT * 2.0 + s) * 0.15 * (1.0 - step(10.0, uSp));
          vec4 mv = modelViewMatrix * vec4(p, 1.0); vFogDepth = -mv.z; vA = 1.0 - smoothstep(uBox * 0.25, uBox * 0.5, length(p.xz - uC.xz)); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uCol; uniform float uA; varying float vA;
        #include <fog_pars_fragment>
        void main(){ gl_FragColor = vec4(uCol, uA * vA);
          #ifdef USE_FOG
            gl_FragColor.a *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
          #endif
          #include <colorspace_fragment>
        }` });
    const L = new THREE.LineSegments(g, m); L.frustumCulled = false; L.renderOrder = 960; group.add(L);
    return { mesh: L, step(t, cam) { m.uniforms.uT.value = t; m.uniforms.uC.value.copy(cam.position); } };
  };

  /* ── 굴뚝 연기(그리기 1 · 판 몇 장이 위로 흘러감 · 불투명에 가까운 옅은 판) ── */
  P.smoke = (group, spots) => {
    if (!spots.length) return null;
    const per = 5, n = spots.length * per, g = new THREE.PlaneGeometry(1, 1), cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d');
    const gd = x.createRadialGradient(32, 32, 0, 32, 32, 30); gd.addColorStop(0, 'rgba(255,255,255,0.8)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gd; x.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, uT: { value: 0 }, uCol: { value: new THREE.Color(0x8a8c8e) } }]),
      vertexShader: `uniform float uT; attribute vec4 sp; varying vec2 vUv; varying float vA; varying float vFogDepth;
        void main(){ vUv = uv; float k = fract(uT * 0.06 + sp.w); vec3 c = sp.xyz + vec3(k * 3.0, k * 9.0, k * 1.2);
          vec4 mv = viewMatrix * vec4(c, 1.0); float s = 1.2 + k * 4.0; mv.xy += position.xy * s; vA = sin(k * 3.14159) * 0.5; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 uCol; varying vec2 vUv; varying float vA;
        #include <fog_pars_fragment>
        void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(uCol, t.a * vA);
          #ifdef USE_FOG
            gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth));
          #endif
          #include <colorspace_fragment>
        }` });
    m.uniforms.map.value = tex;
    const ig = new THREE.InstancedBufferGeometry(); ig.index = g.index; ig.setAttribute('position', g.attributes.position); ig.setAttribute('uv', g.attributes.uv);
    const sp = new Float32Array(n * 4); spots.forEach((s, i) => { for (let k = 0; k < per; k++) { const o = (i * per + k) * 4; sp[o] = s[0]; sp[o + 1] = s[1]; sp[o + 2] = s[2]; sp[o + 3] = k / per; } });
    ig.setAttribute('sp', new THREE.InstancedBufferAttribute(sp, 4)); ig.instanceCount = n;
    const mesh = new THREE.Mesh(ig, m); mesh.frustumCulled = false; mesh.renderOrder = 930; group.add(mesh);
    return { mesh, tex, step(t) { m.uniforms.uT.value = t; } };
  };

  /* 작은 소품은 늘 가까이 묶음(멀면 숨김) */
  for (const k of ['barrel', 'crate', 'bucket', 'rack', 'weapon', 'anvil', 'bellows', 'grindstone', 'woodpile', 'bolaLauncher']) { const f = P[k]; P[k] = (...a) => { const nw = P.near; P.near = true; try { return f(...a); } finally { P.near = nw; } }; }
  return P;
}

/* 점이 다각형 안인지(짝수-홀수) */
export function inPoly(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; }
  return c;
}

/* 캔버스 글 판(순위판 · 한글) — 512×256 한 장 · setLines로 다시 그림 */
export function textBoard(w = 512, h = 320, o = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = (lines) => {
    x.fillStyle = o.bg ?? '#7a5a3c'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { x.fillStyle = i % 2 ? 'rgba(0,0,0,0.08)' : 'rgba(255,230,190,0.06)'; x.fillRect(0, i * h / 9, w, h / 9); }
    x.strokeStyle = 'rgba(40,25,15,0.5)'; x.lineWidth = 3; for (let i = 1; i < 9; i++) { x.beginPath(); x.moveTo(0, i * h / 9 + (i % 3)); x.lineTo(w, i * h / 9 - (i % 2)); x.stroke(); }
    x.fillStyle = '#2b1c12'; x.textBaseline = 'middle';
    const title = o.title; let y0 = 30;
    if (title) { x.font = 'bold 40px "Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif'; x.textAlign = 'center'; x.fillText(title, w / 2, 34); y0 = 82; x.fillRect(40, 58, w - 80, 3); }
    x.textAlign = 'left'; const lh = Math.min(46, (h - y0 - 10) / Math.max(1, lines.length)); x.font = 'bold ' + Math.round(lh * 0.78) + 'px "Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
    lines.forEach((l, i) => { x.fillStyle = i === 0 ? '#5a1e10' : '#2b1c12'; x.fillText(String(l), 44, y0 + lh * (i + 0.5)); });
    tex.needsUpdate = true;
  };
  return { tex, draw, canvas: cv };
}
