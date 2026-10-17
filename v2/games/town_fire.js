// 🚒 소방차(FIRE-1 · 10-17 아이 눈 '소방서가 덩어리 같아요 — 앞 빨간 덩어리·검은 상자'): 로우폴리 소방차 한 벌(사다리 · 경광등 · 호스 릴 · 문짝 '119')
//   소방서 차고 앞에 선 차 = 인스턴스 한 벌(그리기 1번) · 출동 = makeFireTruck()(생활 팀이 부름 — 같은 모양 · 경광등 깜빡임 · 밤엔 앞등)
//   새 Light X · 글로우 X — 불빛은 그 칸 색이 스스로 밝아지는 것뿐(emissive × 정점 색)
//   차 좌표: 앞(운전칸) = +x · 폭 = z · 바닥 = y 0 · 길이 7.2 · 폭 2.4 · 높이 3.1(경광등까지)
export const TRUCK = { L: 7.2, W: 2.4, H: 3.1 };
const RED = 0xd32f2a, RED2 = 0xb8261f, WHITE = 0xf4f4f0, GLASS = 0x34485c, SILVER = 0xc4c9ce, LINE = 0x8f969e, DARK = 0x2a2c30, TIRE = 0x222326, HUB = 0x9ca3aa;
const GEO = new WeakMap(), MATS = new WeakMap();
// 정점 꾸러미: 상자(면마다 평평한 법선) · 원통(축 = z) · 판(한쪽 면) — lit = 스스로 밝아지는 칸(1 앞등·흰 등 · 2 왼쪽 빨강 · 3 오른쪽 빨강 · 4 뒤 빨간 등)
function build(T3) {
  const P = [], N = [], C = [], LT = [], col = new T3.Color();
  const tri = (a, b, c, n, hex, lit) => { col.setHex(hex); for (const v of [a, b, c]) { P.push(v[0], v[1], v[2]); N.push(n[0], n[1], n[2]); C.push(col.r, col.g, col.b); LT.push(lit || 0); } };
  const quad = (a, b, c, d, n, hex, lit) => { tri(a, b, c, n, hex, lit); tri(a, c, d, n, hex, lit); };
  const box = (x0, x1, y0, y1, z0, z1, hex, o = {}) => { const lit = o.lit || 0, top = o.top ?? hex, sd = o.side ?? hex;
    quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0], o.front ?? sd, lit); quad([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [-1, 0, 0], o.back ?? sd, lit);
    quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], top, lit); if (!o.noBottom) quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], hex, lit);
    quad([x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1], [0, 0, 1], sd, lit); quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [0, 0, -1], sd, lit); };
  const cylZ = (x, y, z0, z1, r, seg, hex, capHex) => { for (let k = 0; k < seg; k++) { const a0 = k / seg * 6.2832, a1 = (k + 1) / seg * 6.2832, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), am = (a0 + a1) / 2;
      quad([x + c0 * r, y + s0 * r, z0], [x + c1 * r, y + s1 * r, z0], [x + c1 * r, y + s1 * r, z1], [x + c0 * r, y + s0 * r, z1], [Math.cos(am), Math.sin(am), 0], hex);
      tri([x, y, z1], [x + c0 * r, y + s0 * r, z1], [x + c1 * r, y + s1 * r, z1], [0, 0, 1], capHex ?? hex); tri([x, y, z0], [x + c1 * r, y + s1 * r, z0], [x + c0 * r, y + s0 * r, z0], [0, 0, -1], capHex ?? hex); } };
  const cylY = (x, z, y0, y1, r, seg, hex) => { for (let k = 0; k < seg; k++) { const a0 = k / seg * 6.2832, a1 = (k + 1) / seg * 6.2832, am = (a0 + a1) / 2, p0 = [x + Math.cos(a0) * r, z + Math.sin(a0) * r], p1 = [x + Math.cos(a1) * r, z + Math.sin(a1) * r];
      quad([p1[0], y0, p1[1]], [p0[0], y0, p0[1]], [p0[0], y1, p0[1]], [p1[0], y1, p1[1]], [Math.cos(am), 0, Math.sin(am)], hex); tri([x, y1, z], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], [0, 1, 0], hex); } };
  const sideQuad = (x0, x1, y0, y1, zs, hex) => { const z = zs * 1.236; if (zs > 0) quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], hex); else quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], [0, 0, -1], hex); };
  // 바퀴(앞 하나 · 뒤 둘 — 바퀴통은 회색)
  for (const x of [2.55, -1.75, -2.85]) for (const s of [-1, 1]) { const z0 = s > 0 ? 0.82 : -1.18, z1 = s > 0 ? 1.18 : -0.82; cylZ(x, 0.48, z0, z1, 0.48, 10, TIRE); cylZ(x, 0.48, s > 0 ? z1 : z0 - 0.02, s > 0 ? z1 + 0.02 : z0, 0.26, 8, HUB); }
  box(-3.4, 3.3, 0.5, 0.78, -0.85, 0.85, DARK);   // 차대
  // 운전칸: 빨강 + 흰 띠 · 앞 유리 · 옆 유리 · 그릴 · 앞등 · 범퍼 · 거울
  box(1.7, 3.55, 0.78, 2.75, -1.15, 1.15, RED, { top: RED2 });
  box(3.55, 3.58, 1.72, 2.55, -1.0, 1.0, GLASS); for (const s of [-1, 1]) box(2.15, 3.35, 1.72, 2.5, s > 0 ? 1.15 : -1.18, s > 0 ? 1.18 : -1.15, GLASS);
  box(3.55, 3.6, 0.92, 1.55, -0.62, 0.62, 0x3a3d42); for (const s of [-1, 1]) box(3.55, 3.6, 1.02, 1.3, s > 0 ? 0.72 : -1.02, s > 0 ? 1.02 : -0.72, 0xfff1c8, { lit: 1 });
  box(3.55, 3.78, 0.55, 0.86, -1.2, 1.2, SILVER); for (const s of [-1, 1]) { box(3.15, 3.25, 1.95, 2.35, s > 0 ? 1.15 : -1.38, s > 0 ? 1.38 : -1.15, DARK); }
  // 경광등: 검은 받침 + 빨강 둘 + 가운데 흰 등
  box(2.55, 3.25, 2.75, 2.84, -0.95, 0.95, DARK); box(2.6, 3.2, 2.84, 3.06, -0.92, -0.32, 0xff3a30, { lit: 2 }); box(2.6, 3.2, 2.84, 3.06, 0.32, 0.92, 0xff3a30, { lit: 3 }); box(2.6, 3.2, 2.84, 3.0, -0.3, 0.3, 0xf2f2ee, { lit: 1 });
  // 뒤 몸채: 빨강 + 옆 칸막이 셔터(은색 + 줄) 셋씩
  box(-3.6, 1.65, 0.78, 2.55, -1.2, 1.2, RED, { top: RED2 });
  for (const s of [-1, 1]) for (const [a, b] of [[-3.35, -1.95], [-1.85, -0.25], [-0.15, 1.45]]) { const z0 = s > 0 ? 1.2 : -1.23, z1 = s > 0 ? 1.23 : -1.2; box(a, b, 0.98, 2.28, z0, z1, SILVER, { noBottom: true });
    for (let y = 1.2; y < 2.25; y += 0.27) sideQuad(a + 0.05, b - 0.05, y, y + 0.05, s, LINE); }
  // 흰 띠(운전칸 문 아래 · 몸채 위) — 몸 밖으로 2cm(같은 평면 X)
  for (const s of [-1, 1]) { const z0 = s > 0 ? 1.15 : -1.17, z1 = s > 0 ? 1.17 : -1.15; box(1.75, 3.5, 1.18, 1.32, z0, z1, WHITE); box(-3.55, 1.6, 2.36, 2.5, s > 0 ? 1.2 : -1.22, s > 0 ? 1.22 : -1.2, WHITE); }
  // 문짝 '119'(흰 글자 · 3×5 칸 글꼴) — 운전칸 문 흰 띠 위
  { const px = 0.072, x0 = 2.05, y0 = 1.38, R9 = { 1: [[1, 0, 2, 5]], 9: [[0, 4, 3, 5], [0, 2, 1, 4], [2, 0, 3, 4], [1, 2, 2, 3], [0, 0, 2, 1]] };
    [1, 1, 9].forEach((d, i) => { for (const [a, b, c, e] of R9[d]) for (const s of [-1, 1]) { const ox = s > 0 ? x0 + i * 0.3 : x0 + 0.9 - i * 0.3 - 3 * px; const xa = s > 0 ? ox + a * px : ox + (3 - c) * px, xb = s > 0 ? ox + c * px : ox + (3 - a) * px; const z = s > 0 ? 1.158 : -1.158;
      if (s > 0) quad([xa, y0 + b * px, z], [xb, y0 + b * px, z], [xb, y0 + e * px, z], [xa, y0 + e * px, z], [0, 0, 1], WHITE); else quad([xb, y0 + b * px, z], [xa, y0 + b * px, z], [xa, y0 + e * px, z], [xb, y0 + e * px, z], [0, 0, -1], WHITE); } }); }
  // 사다리(지붕 위 · 은색 난간 둘 + 가로대) · 뒤 돌림판 · 앞 받침
  cylY(-2.85, 0, 2.55, 2.92, 0.55, 12, 0x9aa1a8);
  box(2.0, 2.2, 2.75, 2.92, -0.5, 0.5, 0x7d848b);
  for (const s of [-1, 1]) box(-3.9, 2.35, 2.92, 3.02, s * 0.44 - 0.05, s * 0.44 + 0.05, SILVER);
  for (let x = -3.75; x < 2.3; x += 0.42) box(x, x + 0.06, 2.94, 3.0, -0.39, 0.39, 0xaeb4ba, { noBottom: true });
  // 호스 릴(뒤 · 빨간 북 + 감긴 하얀 호스) · 뒤 빨간 등
  box(-3.66, -3.6, 0.95, 2.3, -0.75, 0.75, DARK); cylZ(-3.98, 1.62, -0.5, 0.5, 0.36, 12, 0xe8e2d0); cylZ(-3.98, 1.62, -0.58, -0.5, 0.46, 12, RED2); cylZ(-3.98, 1.62, 0.5, 0.58, 0.46, 12, RED2);
  box(-4.0, -3.66, 1.58, 1.66, -0.06, 0.06, DARK);   // 릴 축
  for (const s of [-1, 1]) box(-3.62, -3.6, 0.88, 1.12, s > 0 ? 0.78 : -1.08, s > 0 ? 1.08 : -0.78, 0xa81c1c, { lit: 4 });
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setAttribute('lit_f', new T3.Float32BufferAttribute(LT, 1)); g.computeBoundingSphere();
  return g; }
export function truckGeo(T3) { let g = GEO.get(T3); if (!g) { g = build(T3); GEO.set(T3, g); } return g; }
// 재질: 경광등(2·3)은 uSir일 때 번갈아 · 앞등·흰 등(1)과 뒤 등(4)은 밤(uNight) 또는 출동 때 · 빛 = 그 칸 색이 밝아질 뿐
const VS = 'attribute float lit_f;\nvarying float vLit_f;\n', VB = '#include <begin_vertex>\n vLit_f = lit_f;';
const FS = 'uniform float uSir_f;\nuniform float uNight_f;\nuniform float uT_f;\nvarying float vLit_f;\n', FB = `#include <emissivemap_fragment>
 { float l = 0.0, k = floor(vLit_f + 0.5), ph = step(0.5, fract(uT_f * 1.6));
   if (k == 1.0) l = max(uNight_f, uSir_f * 0.6) * 0.9; else if (k == 2.0) l = uSir_f * ph * 1.4; else if (k == 3.0) l = uSir_f * (1.0 - ph) * 1.4; else if (k == 4.0) l = max(uNight_f, uSir_f) * 0.7;
   totalEmissiveRadiance += diffuseColor.rgb * l; }`;
export function truckMat(T3) { const U = { uSir_f: { value: 0 }, uNight_f: { value: 0 }, uT_f: { value: 0 } }, m = new T3.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U); sh.vertexShader = VS + sh.vertexShader.replace('#include <begin_vertex>', VB); sh.fragmentShader = FS + sh.fragmentShader.replace('#include <emissivemap_fragment>', FB); };
  m.customProgramCacheKey = () => 'firetruck1'; m.userData.U = U; return m; }
// 출동용 한 대(생활 팀): 자리·방향은 부르는 쪽이 group.position · rotation.y로 · siren(on) · night(0~1) · tick(dt) · dispose()
export function makeFireTruck(T3) { const mat = truckMat(T3), mesh = new T3.Mesh(truckGeo(T3), mat), grp = new T3.Group(); mesh.castShadow = false; grp.add(mesh); grp.userData.fireTruck = true;
  return { group: grp, mesh, siren: on => { mat.userData.U.uSir_f.value = on ? 1 : 0; }, night: k => { mat.userData.U.uNight_f.value = k; }, tick: dt => { mat.userData.U.uT_f.value += dt; }, dispose: () => { if (grp.parent) grp.parent.remove(grp); mat.dispose(); } }; }
// 소방서 앞에 선 차들(인스턴스 한 벌): list = [[x, y, z, ry], …] · 출동하면 parked(i, false)로 그 자리 차를 숨김(같은 차가 두 대로 보이지 않게)
export const FIRE_STATIONS = [];
let PARK = null;
export function placeParked(T3, list, group) { if (PARK) { if (PARK.m.parent) PARK.m.parent.remove(PARK.m); PARK.m.dispose(); PARK = null; } FIRE_STATIONS.length = 0; if (!list.length) return null;
  const mat = MATS.get(T3) || (() => { const m9 = truckMat(T3); MATS.set(T3, m9); return m9; })(), m = new T3.InstancedMesh(truckGeo(T3), mat, list.length), M4 = new T3.Matrix4(), Q = new T3.Quaternion(), S = new T3.Vector3(1, 1, 1), V = new T3.Vector3(), Y = new T3.Vector3(0, 1, 0);
  list.forEach(([x, y, z, ry, info], i) => { Q.setFromAxisAngle(Y, ry); V.set(x, y, z); M4.compose(V, Q, S); m.setMatrixAt(i, M4); FIRE_STATIONS.push({ i, x, y, z, ry, ...(info || {}) }); });
  m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.matrixAutoUpdate = false; m.castShadow = m.receiveShadow = false; m.userData.fx = 1; group.add(m); PARK = { m, list, mat, M4: new T3.Matrix4() }; return m; }
export function parked(i, show) { if (!PARK || !PARK.list[i]) return false; const [x, y, z, ry] = PARK.list[i], M4 = PARK.M4; if (show) { M4.makeRotationY(ry).setPosition(x, y, z); } else M4.makeScale(0, 0, 0); PARK.m.setMatrixAt(i, M4); PARK.m.instanceMatrix.needsUpdate = true; return true; }
