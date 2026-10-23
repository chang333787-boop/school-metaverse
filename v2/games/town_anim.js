// 🐄 동물(ANIMAL-1 · 사용자 10-17 '블렌더도 사용 · 모션 · 완성도 있는 인디게임'): 블렌더로 깎은 로우폴리 소·양·개(town_animals.js)를 인스턴스로 그리고 정점 셰이더로 움직임
//   부위 = 0 몸 · 1 머리 · 2 꼬리 · 3~6 다리(관절 = piv) · 인스턴스마다 aPh = [박자 어긋냄, 모드] — 모드 0 = 풀 뜯기(머리 숙였다 이따금 들기) · 1 = 걷기(다리 번갈아) · 2 = 두리번(개 — 고개 좌우)
//   매 프레임 일 = uniform 하나(uT) · 셰이더 한 벌을 세 동물이 같이 씀(onBeforeCompile 같은 글) · 새 Light X
//   WILD-1(10-19 야생동물 · town_wild.js): def(갈래, 자료) = JS로 지은 모양을 같은 셰이더에 · uB = 몸 갈래(0 네발 · 1 새 = 부위 3·4가 날개 · 2 개구리 = 뒷다리 차기)
//     모드 3 = 날기(날개 펼쳐 퍼덕 · 다리는 뒤로) · 4 = 뜀(개구리 뒷다리 뻗음) · 5 = 달리기(다리 빠르게) — 0·1·2(소·양·개)는 예전 그대로 · 부위 7 = 앉은 가지(날 때 숨김 · 부엉이)
import { ANIMALS } from './town_animals.js?v=1';
const VS = `
  { int p = int(aPart + 0.5); float ph = aPh.x, md = aPh.y, wk = clamp(md, 0.0, 1.0) * step(md, 1.5);
    float rn = step(4.5, md) * step(md, 5.5), fl = step(2.5, md) * step(md, 3.5), hp = step(3.5, md) * step(md, 4.5); wk = max(wk, rn);
    if (p == 7) { transformed *= 1.0 - fl; }
    else if (uB > 0.5 && uB < 1.5 && (p == 3 || p == 4)) { float s = p == 3 ? 1.0 : -1.0; vec3 pv = uPiv[p]; vec3 q = transformed - pv;
      if (fl > 0.5) { float a = s * 0.6 * sin(uT * 8.0 + ph); q = vec3(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a), q.z); }
      else { q = vec3(s * q.z * 0.55, q.y, -s * q.x * 0.6); float a = s * 1.45; q = vec3(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a), q.z); q = vec3(q.x, q.y * 0.955 + q.z * 0.2955, -q.y * 0.2955 + q.z * 0.955); }   /* 접은 날개 = 뒤로 눕혀 옆구리에(앞 가장자리 위 · 뒤 끝은 조금 아래로) */
      transformed = pv + q; }
    else if (uB > 1.5 && p >= 3) { vec3 pv = uPiv[p]; float a = hp * (p >= 5 ? 2.0 : -0.5); vec3 q = transformed - pv; transformed = pv + vec3(q.x, q.y * cos(a) - q.z * sin(a), q.y * sin(a) + q.z * cos(a)); }
    else if (p >= 3) { vec3 pv = uPiv[p]; float a = sin(uT * (7.0 + rn * 9.0) + ph + ((p == 3 || p == 6) ? 0.0 : 3.1416)) * (0.5 + rn * 0.2) * wk + fl * 1.3; vec3 q = transformed - pv; transformed = pv + vec3(q.x, q.y * cos(a) - q.z * sin(a), q.y * sin(a) + q.z * cos(a)); }
    else if (p == 1) { vec3 pv = uPiv[1]; vec3 q = transformed - pv;
      if (fl > 0.5) { }
      else if (md > 1.5 && md < 2.5) { float b = 0.45 * sin(uT * 0.7 + ph) + 0.08 * sin(uT * 2.3 + ph); q = vec3(q.x * cos(b) + q.z * sin(b), q.y, -q.x * sin(b) + q.z * cos(b)); }
      else { float g = smoothstep(-0.25, 0.25, sin(uT * 0.33 + ph)), a = mix(g * (0.55 + 0.07 * sin(uT * 3.1 + ph)), 0.06 * sin(uT * 7.0 + ph), wk); q = vec3(q.x, q.y * cos(a) - q.z * sin(a), q.y * sin(a) + q.z * cos(a)); }
      transformed = pv + q; }
    else if (p == 2) { vec3 pv = uPiv[2]; float a = sin(uT * (md > 1.5 && md < 2.5 ? 9.0 : 4.0) + ph) * 0.45 * (uB > 0.5 ? 0.12 : 1.0); vec3 q = transformed - pv; transformed = pv + vec3(q.x * cos(a) + q.z * sin(a), q.y, -q.x * sin(a) + q.z * cos(a)); }
    else { transformed.y *= 1.0 + 0.012 * sin(uT * 2.0 + ph); } }`;
function inject(sh, U, piv, kB) { sh.uniforms.uT = U; sh.uniforms.uPiv = { value: piv }; sh.uniforms.uB = { value: kB || 0 }; sh.vertexShader = 'attribute float aPart;\nattribute vec2 aPh;\nuniform float uT;\nuniform float uB;\nuniform vec3 uPiv[7];\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + VS); }
export function createAnimals(T3) {
  const G = {}, M = {}, U = { value: 0 };
  const EXT = {}, AN = k => ANIMALS[k] || EXT[k];   /* WILD-1 바깥 모양(def) */
  function base(kind) { if (G[kind]) return G[kind]; const A = AN(kind); if (!A) return null; const n = A.pos.length / 3, C = new Float32Array(n * 3), c9 = new T3.Color();
    for (let i = 0; i < n; i++) { c9.setRGB(A.col[i * 3] / 255, A.col[i * 3 + 1] / 255, A.col[i * 3 + 2] / 255, T3.SRGBColorSpace); C[i * 3] = c9.r; C[i * 3 + 1] = c9.g; C[i * 3 + 2] = c9.b; }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(A.pos, 3)); g.setAttribute('color', new T3.BufferAttribute(C, 3)); g.setAttribute('aPart', new T3.Float32BufferAttribute(A.part, 1)); g.computeVertexNormals(); g.computeBoundingSphere(); return (G[kind] = g); }
  function mat(kind) { if (M[kind]) return M[kind]; const A = AN(kind), piv = []; for (let p = 0; p < 7; p++) { const v = A.piv[p] || [0, 0, 0]; piv.push(new T3.Vector3(v[0], v[1], v[2])); }
    const m = new T3.MeshLambertMaterial({ vertexColors: true }); m.onBeforeCompile = sh => inject(sh, U, piv, A.bird); return (M[kind] = m); }
  // n마리 인스턴스(놓기 = set(i, x, y, z, ry, s, 모드)) · 같은 모양 꼭짓점은 함께 쓰고 aPh만 메시마다
  function mesh(kind, n) { const b0 = base(kind); if (!b0) return null; const g = new T3.BufferGeometry(); for (const k in b0.attributes) g.setAttribute(k, b0.attributes[k]); g.boundingSphere = b0.boundingSphere;
    const ph = new Float32Array(n * 2); for (let i = 0; i < n; i++) ph[i * 2] = Math.random() * 6.2832; const at = new T3.InstancedBufferAttribute(ph, 2); g.setAttribute('aPh', at);
    const m = new T3.InstancedMesh(g, mat(kind), n), O = new T3.Object3D();
    const set = (i, x, y, z, ry, s = 1, md = 0) => { O.position.set(x, y, z); O.rotation.set(0, ry, 0); O.scale.setScalar(s); O.updateMatrix(); m.setMatrixAt(i, O.matrix); ph[i * 2 + 1] = md; at.needsUpdate = true; m.instanceMatrix.needsUpdate = true; };
    const mode = (i, md) => { if (ph[i * 2 + 1] !== md) { ph[i * 2 + 1] = md; at.needsUpdate = true; } };
    return { m, n, set, mode, done: () => m.computeBoundingSphere(), dispose: () => g.dispose() }; }   // dispose = 이 메시 몫(aPh)만 · 모양 꼭짓점은 함께 쓰니 그대로
  return { mesh, has: k => !!AN(k), def: (k, A) => { if (!AN(k)) EXT[k] = A; }, tick: t => { U.value = t; }, dispose() { for (const k in G) G[k].dispose(); for (const k in M) M[k].dispose(); } };
}
