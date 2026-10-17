// 🐄 동물(ANIMAL-1 · 사용자 10-17 '블렌더도 사용 · 모션 · 완성도 있는 인디게임'): 블렌더로 깎은 로우폴리 소·양·개(town_animals.js)를 인스턴스로 그리고 정점 셰이더로 움직임
//   부위 = 0 몸 · 1 머리 · 2 꼬리 · 3~6 다리(관절 = piv) · 인스턴스마다 aPh = [박자 어긋냄, 모드] — 모드 0 = 풀 뜯기(머리 숙였다 이따금 들기) · 1 = 걷기(다리 번갈아) · 2 = 두리번(개 — 고개 좌우)
//   매 프레임 일 = uniform 하나(uT) · 셰이더 한 벌을 세 동물이 같이 씀(onBeforeCompile 같은 글) · 새 Light X
import { ANIMALS } from './town_animals.js?v=1';
const VS = `
  { int p = int(aPart + 0.5); float ph = aPh.x, md = aPh.y, wk = clamp(md, 0.0, 1.0) * step(md, 1.5);
    if (p >= 3) { vec3 pv = uPiv[p]; float a = sin(uT * 7.0 + ph + ((p == 3 || p == 6) ? 0.0 : 3.1416)) * 0.5 * wk; vec3 q = transformed - pv; transformed = pv + vec3(q.x, q.y * cos(a) - q.z * sin(a), q.y * sin(a) + q.z * cos(a)); }
    else if (p == 1) { vec3 pv = uPiv[1]; vec3 q = transformed - pv;
      if (md > 1.5) { float b = 0.45 * sin(uT * 0.7 + ph) + 0.08 * sin(uT * 2.3 + ph); q = vec3(q.x * cos(b) + q.z * sin(b), q.y, -q.x * sin(b) + q.z * cos(b)); }
      else { float g = smoothstep(-0.25, 0.25, sin(uT * 0.33 + ph)), a = mix(g * (0.55 + 0.07 * sin(uT * 3.1 + ph)), 0.06 * sin(uT * 7.0 + ph), wk); q = vec3(q.x, q.y * cos(a) - q.z * sin(a), q.y * sin(a) + q.z * cos(a)); }
      transformed = pv + q; }
    else if (p == 2) { vec3 pv = uPiv[2]; float a = sin(uT * (md > 1.5 ? 9.0 : 4.0) + ph) * 0.45; vec3 q = transformed - pv; transformed = pv + vec3(q.x * cos(a) + q.z * sin(a), q.y, -q.x * sin(a) + q.z * cos(a)); }
    else { transformed.y *= 1.0 + 0.012 * sin(uT * 2.0 + ph); } }`;
function inject(sh, U, piv) { sh.uniforms.uT = U; sh.uniforms.uPiv = { value: piv }; sh.vertexShader = 'attribute float aPart;\nattribute vec2 aPh;\nuniform float uT;\nuniform vec3 uPiv[7];\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>' + VS); }
export function createAnimals(T3) {
  const G = {}, M = {}, U = { value: 0 };
  function base(kind) { if (G[kind]) return G[kind]; const A = ANIMALS[kind]; if (!A) return null; const n = A.pos.length / 3, C = new Float32Array(n * 3), c9 = new T3.Color();
    for (let i = 0; i < n; i++) { c9.setRGB(A.col[i * 3] / 255, A.col[i * 3 + 1] / 255, A.col[i * 3 + 2] / 255, T3.SRGBColorSpace); C[i * 3] = c9.r; C[i * 3 + 1] = c9.g; C[i * 3 + 2] = c9.b; }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(A.pos, 3)); g.setAttribute('color', new T3.BufferAttribute(C, 3)); g.setAttribute('aPart', new T3.Float32BufferAttribute(A.part, 1)); g.computeVertexNormals(); g.computeBoundingSphere(); return (G[kind] = g); }
  function mat(kind) { if (M[kind]) return M[kind]; const A = ANIMALS[kind], piv = []; for (let p = 0; p < 7; p++) { const v = A.piv[p] || [0, 0, 0]; piv.push(new T3.Vector3(v[0], v[1], v[2])); }
    const m = new T3.MeshLambertMaterial({ vertexColors: true }); m.onBeforeCompile = sh => inject(sh, U, piv); return (M[kind] = m); }
  // n마리 인스턴스(놓기 = set(i, x, y, z, ry, s, 모드)) · 같은 모양 꼭짓점은 함께 쓰고 aPh만 메시마다
  function mesh(kind, n) { const b0 = base(kind); if (!b0) return null; const g = new T3.BufferGeometry(); for (const k in b0.attributes) g.setAttribute(k, b0.attributes[k]); g.boundingSphere = b0.boundingSphere;
    const ph = new Float32Array(n * 2); for (let i = 0; i < n; i++) ph[i * 2] = Math.random() * 6.2832; const at = new T3.InstancedBufferAttribute(ph, 2); g.setAttribute('aPh', at);
    const m = new T3.InstancedMesh(g, mat(kind), n), O = new T3.Object3D();
    const set = (i, x, y, z, ry, s = 1, md = 0) => { O.position.set(x, y, z); O.rotation.set(0, ry, 0); O.scale.setScalar(s); O.updateMatrix(); m.setMatrixAt(i, O.matrix); ph[i * 2 + 1] = md; at.needsUpdate = true; m.instanceMatrix.needsUpdate = true; };
    const mode = (i, md) => { if (ph[i * 2 + 1] !== md) { ph[i * 2 + 1] = md; at.needsUpdate = true; } };
    return { m, n, set, mode, done: () => m.computeBoundingSphere(), dispose: () => g.dispose() }; }   // dispose = 이 메시 몫(aPh)만 · 모양 꼭짓점은 함께 쓰니 그대로
  return { mesh, has: k => !!ANIMALS[k], tick: t => { U.value = t; }, dispose() { for (const k in G) G[k].dispose(); for (const k in M) M[k].dispose(); } };
}
