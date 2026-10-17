// 🚶 생활 몸짓(LIFE-M · 교사 10-17 '마을이 살아 있게'): 길 사람 손에 드는 것(우산·부채) 모양 + 하늘 새 떼(V자 하나 · 인스턴스 한 번 그리기)
//   길 사람 몸짓(고개 돌리기 · 하루 처음 손 인사 · 날씨 걸음 · 놀이터 아이)은 town.js makeLife 안(이미 있는 팔다리 자리)에서 — 여기엔 모양과 새 떼만
//   새 떼: 낮·비 아닐 때만 · 카메라 둘레 먼 하늘을 한 번씩 가로지름(약 50초 + 쉼) · 날갯짓 = 정점 셰이더(uniform 하나) · 매 프레임 일 = 무리 자리 하나 + 시간 하나 · 안개 X(하늘 그림자) · 새 Light X
// 손에 드는 것: 우산(손잡이 = 원점 · 위로 꽂힌 살 + 지붕) · 부채(손잡이 = 원점 · 둥근 판) — 정점 색 = 흰 바탕(인스턴스 색이 덧칠)
export function propGeos(T3) {
  const cat = L => { const P = [], N = [], Cc = []; for (const [g0, c] of L) { const g = g0.index ? g0.toNonIndexed() : g0; P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); for (let i = 0; i < g.attributes.position.count; i++) Cc.push(c, c, c); if (g !== g0) g.dispose(); g0.dispose(); } const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(Cc, 3)); return g; };
  const umb = cat([[new T3.CylinderGeometry(0.012, 0.012, 0.62, 5).translate(0, 0.31, 0), 0.25], [new T3.ConeGeometry(0.55, 0.3, 8, 1, true).translate(0, 0.72, 0), 1], [new T3.ConeGeometry(0.54, 0.29, 8, 1, true).scale(-1, 1, 1).translate(0, 0.715, 0), 0.78], [new T3.SphereGeometry(0.025, 5, 3).translate(0, 0.88, 0), 0.25]]);   // 손잡이 = 원점 · 지붕 = 겉 + 속(뒤집은 감김 — 아래에서 봐도 보이게)
  const fan = cat([[new T3.CylinderGeometry(0.012, 0.012, 0.16, 5).translate(0, 0.08, 0), 0.3], [new T3.CylinderGeometry(0.13, 0.13, 0.012, 10).rotateX(Math.PI / 2).translate(0, 0.25, 0), 1]]);
  return { umb, fan };
}
// 새 떼(V자 아홉 · 몸 + 날개 둘 · 날개만 셰이더로 퍼덕임)
const BVS = `
  { float w = aWing; if (abs(w) > 0.5) { float a = sin(uBT * 7.0 + aBP * 6.2832) * 0.65; float c = cos(a), s = sin(a) * sign(w); vec3 q = transformed; transformed = vec3(q.x * c, q.x * s + q.y, q.z); } }`;
export function createBirds(T3) {
  const P = [], W = [];
  const tri = (a, b, c, w) => { P.push(...a, ...b, ...c); W.push(w, w, w); };
  tri([0, 0, 0.7], [-0.12, 0, -0.5], [0.12, 0, -0.5], 0); tri([0, 0, 0.7], [0.12, 0, -0.5], [-0.12, 0, -0.5], 0);   // 몸(위·아래)
  for (const sd of [-1, 1]) { const A = [0, 0, 0.25], B = [sd * 1.5, 0, -0.1], C = [0, 0, -0.25]; tri(A, B, C, sd); tri(A, C, B, sd); }   // 날개(양면)
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('aWing', new T3.Float32BufferAttribute(W, 1));
  const N = 9, ph = new Float32Array(N); for (let i = 0; i < N; i++) ph[i] = (i * 0.37) % 1; g.setAttribute('aBP', new T3.InstancedBufferAttribute(ph, 1));
  const U = { value: 0 }, mat = new T3.MeshBasicMaterial({ color: 0x3a3a44, fog: false, side: T3.DoubleSide });
  mat.onBeforeCompile = sh => { sh.uniforms.uBT = U; sh.vertexShader = 'attribute float aWing;\nattribute float aBP;\nuniform float uBT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + BVS); };
  mat.customProgramCacheKey = () => 'birds1';
  const m = new T3.InstancedMesh(g, mat, N), O = new T3.Object3D(); m.frustumCulled = false; m.userData.fx = 1; m.visible = false;
  for (let i = 0; i < N; i++) { const k = Math.ceil(i / 2), sd = i % 2 ? 1 : -1; O.position.set(i ? sd * k * 3.2 : 0, (i % 3) * 0.4, -k * 3.0); O.scale.setScalar(1.2 - k * 0.03); O.updateMatrix(); m.setMatrixAt(i, O.matrix); }   // 맨 앞 하나 + 양쪽으로 넷씩 뒤로 벌어짐
  // 한 번 지나가기: 카메라 둘레 반지름 230m 원 위 한 점 → 맞은편(조금 비껴)으로 · 높이 = 카메라 + 70~95m · 빠르기 9m/s · 지나간 뒤 쉼 15~40초
  const F = { on: false, t: 0, T: 0, wait: 6, sx: 0, sz: 0, ex: 0, ez: 0, y: 0, n: 0 };
  return { m,
    tick(dt, cp, ok) { U.value += dt; if (!F.on) { m.visible = false; if (!ok || (F.wait -= dt) > 0) return; const a = (F.n * 2.39996 + 0.7) % 6.2832, b = a + Math.PI + 0.5 * Math.sin(F.n * 1.7); F.sx = cp.x + Math.cos(a) * 230; F.sz = cp.z + Math.sin(a) * 230; F.ex = cp.x + Math.cos(b) * 230; F.ez = cp.z + Math.sin(b) * 230; F.y = cp.y + 70 + (F.n % 3) * 12; F.T = Math.hypot(F.ex - F.sx, F.ez - F.sz) / 9; F.t = 0; F.on = true; F.n++; }
      if (!ok) { F.on = false; F.wait = 20; m.visible = false; return; }   /* 밤·비가 되면 바로 접음(먼 하늘이라 눈에 띄지 않음) */
      F.t += dt; const u = F.t / F.T; if (u >= 1) { F.on = false; F.wait = 15 + (F.n % 4) * 8; m.visible = false; return; }
      m.position.set(F.sx + (F.ex - F.sx) * u, F.y + Math.sin(F.t * 0.4) * 3, F.sz + (F.ez - F.sz) * u); m.rotation.set(0, Math.atan2(F.ex - F.sx, F.ez - F.sz), 0); m.visible = true; },
    info: () => ({ on: F.on, x: Math.round(m.position.x), y: Math.round(m.position.y), z: Math.round(m.position.z), n: F.n }),
    dispose() { g.dispose(); mat.dispose(); } };
}
