// 밤하늘(8장) — 오로라 띠(하늘 위 메시 한 장 · 커튼 둘) + 별(점 한 묶음) · 하늘처럼 카메라를 따라다니고 깊이 1.0(빈 화소에만 · 구름·돌기둥 뒤로 숨음)
// 결: 그림책 수채 띠 — 빛 더하기(가산 혼합)·네온·글로우 X · 보통 섞기 · 색은 흐린 풀빛 → 청록 · 세로 붓결 · 반투명 겹 ≤ 2(커튼 둘이 조금만 겹침)
// 때 섞기 blendTime(env, a, b, k) — kit TIMES 두 때 사이 값(노을 → 밤)을 걸음마다 섞음(setTime과 같은 자리를 만짐 · new X)
import * as THREE from 'three';
import { TIMES, U } from './kit.js?v=18';

/* ── 때 섞기 ── */
const _a = new THREE.Color(), _b = new THREE.Color(), _da = new THREE.Vector3(), _db = new THREE.Vector3();
const lc = (out, ha, hb, k) => out.copy(_a.setHex(ha)).lerp(_b.setHex(hb), k);
export function blendTime(env, a, b, k, over) {
  const A = TIMES[a] || TIMES.sunset, B = TIMES[b] || A, n = (key) => A[key] + (B[key] - A[key]) * k;
  const { scene, sky, sea, sun, hemi } = env, su = sky.material.uniforms;
  lc(su.top.value, A.top, B.top, k); lc(su.mid.value, A.mid, B.mid, k); lc(su.bot.value, A.fog, B.fog, k); lc(su.sunCol.value, A.sun, B.sun, k);
  lc(scene.fog.color, A.fog, B.fog, k); scene.fog.near = n('near'); scene.fog.far = n('far');
  lc(U.uFogSun.value, A.fogSun, B.fogSun, k); U.uRim.value = n('rim'); U.uFogLow.value = n('low');
  _da.set(...A.sunDir).normalize(); _db.set(...B.sunDir).normalize(); U.uSunDir.value.copy(_da).lerp(_db, k).normalize();
  lc(sun.color, A.sun, B.sun, k); sun.intensity = n('sunI'); sun.position.copy(U.uSunDir.value).multiplyScalar(500);
  lc(hemi.color, A.hs, B.hs, k); lc(hemi.groundColor, A.hg, B.hg, k); hemi.intensity = n('hI');
  if (sea) { const s = sea.material.uniforms; lc(s.deep.value, A.seaD, B.seaD, k); lc(s.shallow.value, A.seaS, B.seaS, k); lc(s.skyCol.value, A.mid, B.mid, k); }
  if (over) {                                           // 장이 덮어쓸 값(안개 속 · 하늘 = 안개 색)
    if (over.fog != null) { scene.fog.color.setHex(over.fog); su.bot.value.setHex(over.fog); }
    if (over.top != null) su.top.value.setHex(over.top);
    if (over.mid != null) su.mid.value.setHex(over.mid);
    if (over.near != null) scene.fog.near = over.near;
    if (over.far != null) scene.fog.far = over.far;
    if (over.low != null) U.uFogLow.value = over.low;
  }
  const far = scene.fog.far * 1.25;
  if (env.camera && Math.abs(env.camera.far - far) > 2) { env.camera.far = far; env.camera.updateProjectionMatrix(); }
}

/* ── 오로라 커튼 — 하늘 둘레 띠(방위 az0 가운데 · 폭 span) · 정점에서 주름이 천천히 흐름 · 조각에서 세로 붓결 ── */
function curtainGeo(az0, span, el0, el1, R, cols, wob) {
  const n = cols + 1, pos = new Float32Array(n * 2 * 3), uv = new Float32Array(n * 2 * 2), idx = [];
  for (let i = 0; i < n; i++) {
    const t = i / cols, az = az0 + (t - 0.5) * span, bend = Math.sin(t * Math.PI * 1.3 + wob) * 0.06 + Math.sin(t * 19 + wob * 3) * 0.035 + Math.sin(t * 41 + wob) * 0.015;   // 아랫단이 주름처럼 오르내림
    for (let j = 0; j < 2; j++) {
      const el = (j ? el1 : el0) + bend * (j ? 0.5 : 1), o = (i * 2 + j) * 3;
      pos[o] = Math.sin(az) * Math.cos(el) * R; pos[o + 1] = Math.sin(el) * R; pos[o + 2] = Math.cos(az) * Math.cos(el) * R;
      uv[(i * 2 + j) * 2] = t; uv[(i * 2 + j) * 2 + 1] = j;
    }
    if (i < cols) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

/*
  createNightSky({ group, az }) → S   — az = 오로라 가운데 방위(라디안 · 앞 = +z에서 돈 각, 걷기·비행과 같은 꼴)
  S.set(k) 0~1 보이기(서서히) · S.follow(camera) 그리기마다 · S.dispose()
*/
export function createNightSky({ group, az = 0 }) {
  const root = new THREE.Group(); root.frustumCulled = false; group.add(root);
  const uA = { value: 0 };
  /* 오로라 — 커튼 둘(앞 큰 것 · 뒤 흐린 것) 한 기하로 합침 */
  const g1 = curtainGeo(az - 0.15, 2.3, 0.1, 0.56, 82, 96, 0.3), g2 = curtainGeo(az + 0.7, 1.5, 0.2, 0.62, 84, 56, 1.7);
  const merged = new THREE.BufferGeometry();
  const np = g1.attributes.position.count + g2.attributes.position.count;
  const P = new Float32Array(np * 3), UV = new Float32Array(np * 2), L = new Float32Array(np);
  P.set(g1.attributes.position.array, 0); P.set(g2.attributes.position.array, g1.attributes.position.array.length);
  UV.set(g1.attributes.uv.array, 0); UV.set(g2.attributes.uv.array, g1.attributes.uv.array.length);
  L.fill(1, 0, g1.attributes.position.count); L.fill(0.55, g1.attributes.position.count);
  const off = g1.attributes.position.count, ix = Array.from(g1.index.array).concat(Array.from(g2.index.array, (v) => v + off));
  merged.setAttribute('position', new THREE.BufferAttribute(P, 3)); merged.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); merged.setAttribute('aL', new THREE.BufferAttribute(L, 1)); merged.setIndex(ix);
  g1.dispose(); g2.dispose();
  const aur = new THREE.Mesh(merged, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    uniforms: { uTime: U.uTime, uA, cLow: { value: new THREE.Color(0x9fdcb2) }, cMid: { value: new THREE.Color(0x76c2bc) }, cTop: { value: new THREE.Color(0xa99ac8) } },
    vertexShader: `uniform float uTime; attribute float aL; varying vec2 vUv; varying float vL;
      void main(){ vUv = uv; vL = aL; vec3 p = position;
        float w = sin(uv.x * 9.0 + uTime * 0.21) * 1.1 + sin(uv.x * 23.0 - uTime * 0.33) * 0.45;   /* 커튼 주름 — 천천히 흐름 */
        vec3 side = normalize(vec3(p.z, 0.0, -p.x)); p += side * w * (1.4 + uv.y * 2.2);
        vec4 c = projectionMatrix * modelViewMatrix * vec4(p, 1.0); gl_Position = c.xyww; }`,
    fragmentShader: `uniform float uTime; uniform float uA; uniform vec3 cLow; uniform vec3 cMid; uniform vec3 cTop; varying vec2 vUv; varying float vL;
      void main(){
        float y = vUv.y, x = vUv.x;
        float edge = smoothstep(0.0, 0.22, y) * pow(1.0 - y, 1.4) * smoothstep(0.0, 0.14, x) * smoothstep(1.0, 0.86, x) * (1.0 + 0.5 * exp(-y * 9.0));
        float rays = 0.55 + 0.45 * sin(x * 160.0 + sin(x * 17.0 + uTime * 0.4) * 2.5) * sin(x * 61.0 - uTime * 0.15);   /* 세로 붓결 */
        float band = 0.65 + 0.35 * sin(x * 7.0 - uTime * 0.12 + y * 2.0);
        vec3 c = mix(cLow, cMid, smoothstep(0.05, 0.45, y)); c = mix(c, cTop, smoothstep(0.55, 0.95, y) * 0.7);
        float a = edge * (0.55 + 0.45 * rays) * band * uA * vL * 0.78;
        gl_FragColor = vec4(c, a);
        #include <colorspace_fragment>
      }`,
  }));
  aur.renderOrder = 902; aur.frustumCulled = false; root.add(aur);
  /* 별 — 위쪽 반구에만 · 크기 셋 · 오로라 쪽은 덜(밝은 하늘) · 반짝임 조금 */
  const NS = 520, sp = new Float32Array(NS * 3), sz = new Float32Array(NS);
  let s = 91; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < NS; i++) { const a = r() * Math.PI * 2, e = Math.asin(0.08 + r() * 0.92), R = 86; sp[i * 3] = Math.sin(a) * Math.cos(e) * R; sp[i * 3 + 1] = Math.sin(e) * R; sp[i * 3 + 2] = Math.cos(a) * Math.cos(e) * R; sz[i] = r() < 0.08 ? 3.2 : r() < 0.35 ? 2.2 : 1.5; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('aS', new THREE.BufferAttribute(sz, 1));
  const stars = new THREE.Points(sg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: U.uTime, uA, uPx: { value: 1 } },
    vertexShader: `uniform float uTime; uniform float uPx; attribute float aS; varying float vA;
      void main(){ vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = c.xyww;
        vA = 0.75 + 0.25 * sin(uTime * 1.3 + position.x * 0.7 + position.z * 0.3); gl_PointSize = aS * uPx; }`,
    fragmentShader: `uniform float uA; varying float vA;
      void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.2, length(d)) * vA * uA;
        gl_FragColor = vec4(vec3(1.0, 0.96, 0.86), a);
        #include <colorspace_fragment>
      }`,
  }));
  stars.renderOrder = 901; stars.frustumCulled = false; root.add(stars);

  const S = { root, aur, stars, k: 0, want: 0 };
  S.set = (k, now) => { S.want = k; if (now) S.k = k; };
  S.follow = (cam, dt = 1 / 60) => {
    S.k += (S.want - S.k) * Math.min(1, dt * 0.6);
    uA.value = S.k; root.visible = S.k > 0.01;
    root.position.copy(cam.position);
    stars.material.uniforms.uPx.value = Math.min(2, (window.devicePixelRatio || 1));
  };
  S.dispose = () => { root.removeFromParent(); merged.dispose(); sg.dispose(); aur.material.dispose(); stars.material.dispose(); };
  return S;
}
