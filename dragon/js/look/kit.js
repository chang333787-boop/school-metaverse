// 결 도구(시안 A — 손그림 그림책 셰이딩): 부드러운 3단 톤 + 가장자리 빛 + 높이 안개(해 쪽은 따뜻하게) + 3색 하늘 + 거스트너 바다
// 빛 규칙(goal §5): 해 하나 + 하늘빛뿐 · 불빛은 발광으로 · 재질은 toon()으로만(같은 변형 = 셰이더 하나 · customProgramCacheKey)
import * as THREE from 'three';

/* 모든 재질이 함께 쓰는 값 — 때(낮·노을·밤·둥지)가 바뀌면 여기만 바꿈 */
export const U = {
  uRim: { value: 0.35 }, uRimPow: { value: 3.0 }, uRimCol: { value: new THREE.Color(0xfff1d6) },
  uFogBase: { value: 0 }, uFogFall: { value: 0.03 }, uFogLow: { value: 0.35 },
  uFogSun: { value: new THREE.Color(0xf2c48c) }, uSunFog: { value: 0.55 }, uSunDir: { value: new THREE.Vector3(-0.5, 0.45, 0.4).normalize() },
  uTime: { value: 0 },
};

/* 높이 안개 — 멀수록 + 낮을수록(바다·골짜기) 짙고, 해를 바라보면 따뜻한 색 */
export const FOG_PARS = `
uniform vec3 uFogSun; uniform float uSunFog; uniform float uFogBase; uniform float uFogFall; uniform float uFogLow; uniform vec3 uSunDir;
vec3 drgFog(vec3 col, vec3 wp, float depth) {
  float f = smoothstep(fogNear, fogFar, depth);
  float h = exp(-max(wp.y - uFogBase, 0.0) * uFogFall);
  f = clamp(max(f, h * uFogLow * smoothstep(0.0, fogNear, depth)), 0.0, 1.0);
  float s = pow(max(dot(normalize(wp - cameraPosition), uSunDir), 0.0), 6.0) * uSunFog;
  return mix(col, mix(fogColor, uFogSun, s), f);
}`;

/* 부드러운 3단 톤(그림자 0.46 · 가운데 0.74 · 밝음 1) — 경계는 몇 칸만 섞어 붓으로 칠한 듯 */
function makeRamp() {
  const W = 64, d = new Uint8Array(W * 4);
  for (let i = 0; i < W; i++) {
    const x = i / (W - 1), sm = (a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const v = 0.46 + (0.74 - 0.46) * sm(0.40, 0.47) + (1 - 0.74) * sm(0.60, 0.66);
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = Math.round(v * 255); d[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(d, W, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}
export const RAMP = makeRamp();

function patch(m) {
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDrgW;')
      .replace('#include <project_vertex>', `#include <project_vertex>
  vec4 drgW = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    drgW = batchingMatrix * drgW;
  #endif
  #ifdef USE_INSTANCING
    drgW = instanceMatrix * drgW;
  #endif
  vDrgW = (modelMatrix * drgW).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDrgW;\nuniform float uRim; uniform float uRimPow; uniform vec3 uRimCol;')
      .replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\n#ifdef USE_FOG' + FOG_PARS + '\n#endif')
      .replace('#include <opaque_fragment>', `{
    vec3 rn = normalize(normal); float rim = pow(1.0 - clamp(dot(rn, normalize(vViewPosition)), 0.0, 1.0), uRimPow); float side = 1.0;
    #if NUM_DIR_LIGHTS > 0
      side = clamp(dot(rn, directionalLights[0].direction) * 0.5 + 0.6, 0.0, 1.0);
    #endif
    outgoingLight += uRimCol * rim * side * uRim;
  }
  #include <opaque_fragment>`)
      .replace('#include <fog_fragment>', '#ifdef USE_FOG\n  gl_FragColor.rgb = drgFog(gl_FragColor.rgb, vDrgW, vFogDepth);\n#endif');
  };
  m.customProgramCacheKey = () => PATCH_KEY;        // patch()를 고치면 PATCH_KEY를 올린다(같은 열쇠면 three가 옛 셰이더를 다시 씀)
  return m;
}

const PATCH_KEY = 'drgToon2';

/* 재질 캐시 — 같은 옵션이면 같은 재질 하나 */
const CACHE = new Map();
export const SHARED = new Set([RAMP]);              // 장소 dispose가 지우면 안 되는 것(재질 캐시 · 불빛 · 램프)
export function toon(o = {}) {
  const key = [o.color ?? 0xffffff, o.vc ? 1 : 0, o.emissive ?? 0, o.side ?? 0, o.map ? o.map.uuid : '', o.flat ? 1 : 0].join('|');
  let m = CACHE.get(key);
  if (!m) {
    m = patch(new THREE.MeshToonMaterial({ color: o.color ?? 0xffffff, gradientMap: RAMP, vertexColors: !!o.vc, map: o.map || null, emissive: o.emissive ?? 0, side: o.side ?? THREE.FrontSide }));
    if (o.flat) m.flatShading = true;
    CACHE.set(key, m); SHARED.add(m);
  }
  return m;
}

/* 하늘: 위·가운데·아래 세 색 + 해 둘레 빛 — 카메라를 따라다님(draw에서 position 복사) */
export function makeSky() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunCol: { value: new THREE.Color() }, uSunDir: U.uSunDir, sunSize: { value: 0.9985 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunCol; uniform vec3 uSunDir; uniform float sunSize; varying vec3 vD;
      void main(){ vec3 d = normalize(vD); float h = d.y;
        vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h * 1.6, 0.0, 1.0), 0.7)) : mix(mid, bot, clamp(-h * 4.0, 0.0, 1.0));
        float s = max(dot(d, uSunDir), 0.0);
        c += sunCol * (pow(s, 24.0) * 0.35 + pow(s, 400.0) * 0.6) + sunCol * smoothstep(sunSize, sunSize + 0.0008, s) * 0.9;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const g = new THREE.SphereGeometry(100, 32, 16);
  const sky = new THREE.Mesh(g, m); sky.frustumCulled = false; sky.renderOrder = 900;   // 불투명 중 맨 끝 = 빈 화소만 칠함(깊이 1.0 · LEQUAL)
  return sky;
}

/* 바다: 카메라 둘레 고리 격자(가까울수록 촘촘 · 반지름 ≥ 안개 끝 ×1.2) + 정점 거스트너 물결 넷(짧은 물결일수록 가까이서만) + 물마루·거품·하늘빛 반사 */
function ringGrid(R = 2000, r0 = 1.2, k = 1.036, seg = 128) {
  const rs = [0]; for (let r = r0; r < R; r *= k) rs.push(r); rs.push(R);
  const pos = new Float32Array(rs.length * seg * 3), idx = [];
  for (let i = 0; i < rs.length; i++) for (let j = 0; j < seg; j++) { const a = j / seg * Math.PI * 2, o = (i * seg + j) * 3; pos[o] = Math.cos(a) * rs[i]; pos[o + 2] = Math.sin(a) * rs[i]; }
  for (let i = 0; i < rs.length - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + (j + 1) % seg, c = (i + 1) * seg + j, d = (i + 1) * seg + (j + 1) % seg;
    idx.push(a, b, c, b, d, c);                                  // 위에서 볼 때 앞면(법선 +Y)
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R); return g;
}
export function makeSea() {
  const g = ringGrid();
  const m = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      deep: { value: new THREE.Color(0x1f3a4a) }, shallow: { value: new THREE.Color(0x3f6b78) }, foam: { value: new THREE.Color(0xe9f0ee) }, skyCol: { value: new THREE.Color(0x9fb3bf) },
      amp: { value: 1.0 },
    }]),
    vertexShader: `
      uniform float uTime; uniform float amp; varying vec3 vW; varying vec3 vN; varying float vH; varying float vFogDepth;
      vec3 gw(vec4 w, vec2 p, inout vec3 t, inout vec3 b) {   // w = 방향 x·z, 가파름, 파장
        float k = 6.28318 / w.w, c = sqrt(9.8 / k), a = w.z / k; vec2 d = normalize(w.xy); float f = k * (dot(d, p) - c * uTime);
        t += vec3(-d.x * d.x * w.z * sin(f), d.x * w.z * cos(f), -d.x * d.y * w.z * sin(f));
        b += vec3(-d.x * d.y * w.z * sin(f), d.y * w.z * cos(f), -d.y * d.y * w.z * sin(f));
        return vec3(d.x * a * cos(f), a * sin(f), d.y * a * cos(f));
      }
      void main() {
        vec3 p = (modelMatrix * vec4(position, 1.0)).xyz; vec3 t = vec3(1,0,0), b = vec3(0,0,1), o = vec3(0);
        float dc = length(p.xz - cameraPosition.xz);                                  // 물결마다 파장 ×6~14 거리에서 사라짐(격자보다 짧은 물결 = 엉뚱한 무늬)
        o += gw(vec4( 1.0, 0.3, 0.16 * amp * (1.0 - smoothstep(372.0, 868.0, dc)), 62.0), p.xz, t, b);
        o += gw(vec4( 0.6, 1.0, 0.13 * amp * (1.0 - smoothstep(186.0, 434.0, dc)), 31.0), p.xz, t, b);
        o += gw(vec4(-0.4, 0.9, 0.10 * amp * (1.0 - smoothstep(102.0, 238.0, dc)), 17.0), p.xz, t, b);
        o += gw(vec4( 0.9,-0.5, 0.08 * amp * (1.0 - smoothstep( 54.0, 126.0, dc)),  9.0), p.xz, t, b);
        p += o; vW = p; vH = o.y; vN = normalize(cross(b, t));
        vec4 mv = viewMatrix * vec4(p, 1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 deep; uniform vec3 shallow; uniform vec3 foam; uniform vec3 skyCol;
      #include <fog_pars_fragment>
      #ifdef USE_FOG
      ${FOG_PARS}
      #endif
      varying vec3 vW; varying vec3 vN; varying float vH;   /* vFogDepth는 fog_pars_fragment가 선언 */
      void main() {
        vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
        float crest = smoothstep(-1.2, 1.8, vH);
        vec3 c = mix(deep, shallow, crest);
        float fr = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        c = mix(c, skyCol, fr * 0.35);
        float sp = max(dot(reflect(-uSunDir, n), v), 0.0);
        c += uFogSun * smoothstep(0.93, 0.97, sp) * 0.5;                       // 반짝임도 톤처럼 끊어서
        c = mix(c, foam, smoothstep(2.0, 2.8, vH) * 0.55);   /* 물마루 꼭대기에만 */
        #ifdef USE_FOG
          gl_FragColor = vec4(drgFog(c, vW, vFogDepth), 1.0);
        #else
          gl_FragColor = vec4(c, 1.0);
        #endif
        #include <colorspace_fragment>
      }`,
  });
  Object.assign(m.uniforms, { uTime: U.uTime, uSunDir: U.uSunDir, uFogSun: U.uFogSun, uSunFog: U.uSunFog, uFogBase: U.uFogBase, uFogFall: U.uFogFall, uFogLow: U.uFogLow });
  const sea = new THREE.Mesh(g, m); sea.frustumCulled = false; sea.renderOrder = 800;   // 땅 다음(가려질 화소를 먼저 칠하지 않게)
  sea.follow = (cam) => { sea.position.set(Math.round(cam.position.x), 0, Math.round(cam.position.z)); };   // 1m 칸에 맞춰 물결이 미끄러지지 않게
  return sea;
}

/* 때 넷 — 색값은 영화 화면에서 뽑지 않고 '감정 따라 바뀌는 흐름'(reference F-2)만 빌려 새로 고름 */
export const TIMES = {
  day:    { top: 0x5f82a0, mid: 0xb4c2c6, bot: 0x8fa3a8, fog: 0xa3b3b8, fogSun: 0xe8d6b4, near: 160, far: 1500, sun: 0xfff0d8, sunI: 2.1, hs: 0xc9d8e0, hg: 0x3e4a3c, hI: 0.8, sunDir: [-0.45, 0.5, 0.55], rim: 0.3, low: 0.18, seaD: 0x1d3a48, seaS: 0x46717c },
  sunset: { top: 0x3f4f7a, mid: 0xe7a77e, bot: 0x9a6f72, fog: 0xd59f86, fogSun: 0xffc27a, near: 180, far: 1600, sun: 0xffc48a, sunI: 2.2, hs: 0xe9b89c, hg: 0x3a2f3c, hI: 0.75, sunDir: [-0.8, 0.12, 0.3], rim: 0.5, low: 0.25, seaD: 0x2c2f4a, seaS: 0x7a5f6c },
  night:  { top: 0x0e1626, mid: 0x26324a, bot: 0x1a2232, fog: 0x2a3550, fogSun: 0x3c4a70, near: 60, far: 700, sun: 0x9fb2e0, sunI: 0.55, hs: 0x5a6a90, hg: 0x1a1a22, hI: 0.75, sunDir: [0.3, 0.6, -0.5], rim: 0.22, low: 0.35, seaD: 0x0c1622, seaS: 0x1f3448 },
  nest:   { top: 0x3a3438, mid: 0x6a5a58, bot: 0x3a2e2c, fog: 0x5e5250, fogSun: 0xa86a4a, near: 40, far: 520, sun: 0xffb08a, sunI: 0.9, hs: 0x8a7a76, hg: 0x2a1a16, hI: 0.9, sunDir: [0.2, 0.35, 0.7], rim: 0.3, low: 0.6, seaD: 0x1a1a1e, seaS: 0x3a3436 },
  /* 단계 3에 더함(design §15 색 흐름): 2장 흐린 낮 · 2장 안개 숲 · 3장 진눈깨비 배웅 · 5장 새벽 · 6장 맑은 바다 하늘 청록 */
  overcast: { top: 0x7d8c96, mid: 0xb3bcbf, bot: 0x98a3a6, fog: 0xa7b0b2, fogSun: 0xc9c6b8, near: 90, far: 900, sun: 0xe9e6dc, sunI: 1.35, hs: 0xc4ccd0, hg: 0x40483e, hI: 1.0, sunDir: [-0.3, 0.7, 0.4], rim: 0.24, low: 0.3, seaD: 0x24363e, seaS: 0x4d6468 },
  fog:      { top: 0x8e9a9e, mid: 0xa9b3b3, bot: 0x9aa4a4, fog: 0xa4aeac, fogSun: 0xc2c4b6, near: 8, far: 95, sun: 0xe4e2d6, sunI: 1.1, hs: 0xbcc6c6, hg: 0x3a4436, hI: 1.15, sunDir: [-0.2, 0.75, 0.3], rim: 0.32, low: 0.55, seaD: 0x2a3a3e, seaS: 0x4a5e60 },
  sleet:    { top: 0x6c7884, mid: 0x9aa6ae, bot: 0x8a949a, fog: 0x98a2a8, fogSun: 0xb8bcbc, near: 30, far: 380, sun: 0xdde4ea, sunI: 1.1, hs: 0xb4c0c8, hg: 0x3a4246, hI: 1.05, sunDir: [-0.2, 0.6, 0.6], rim: 0.26, low: 0.4, seaD: 0x1e2e36, seaS: 0x40565e },
  dawn:     { top: 0x4a6286, mid: 0xd8b49a, bot: 0x9a8a8e, fog: 0xc4aa9c, fogSun: 0xffd2a0, near: 140, far: 1300, sun: 0xffd8b0, sunI: 1.8, hs: 0xdcc4b8, hg: 0x3a3a40, hI: 0.85, sunDir: [0.75, 0.18, -0.4], rim: 0.45, low: 0.22, seaD: 0x253246, seaS: 0x6a6a78 },
  clear:    { top: 0x3f7fae, mid: 0xa9d0d8, bot: 0x8ab8c0, fog: 0x9cc4cc, fogSun: 0xf2e2c0, near: 220, far: 1900, sun: 0xfff4e0, sunI: 2.3, hs: 0xcfe4ea, hg: 0x3c4a3a, hI: 0.8, sunDir: [-0.5, 0.55, 0.45], rim: 0.3, low: 0.14, seaD: 0x15435a, seaS: 0x2f7d8a },
};
/* over = 장소가 바꾸고 싶은 값만(예: 실내 { near: 20, far: 120, hI: 1.3 }) — TIMES는 그대로 둠 */
export function setTime(env, name, over) {
  const T0 = TIMES[name]; if (!T0) return;
  const T = over ? Object.assign({}, T0, over) : T0;
  const { scene, sky, sea, sun, hemi } = env;
  sky.material.uniforms.top.value.setHex(T.top); sky.material.uniforms.mid.value.setHex(T.mid); sky.material.uniforms.bot.value.setHex(T.fog); sky.material.uniforms.sunCol.value.setHex(T.sun);   // 아랫색 = 안개색(바다 끝 띠 숨김)
  scene.fog.color.setHex(T.fog); scene.fog.near = T.near; scene.fog.far = T.far;
  U.uFogSun.value.setHex(T.fogSun); U.uRim.value = T.rim; U.uFogLow.value = T.low;
  U.uSunDir.value.set(...T.sunDir).normalize();
  sun.color.setHex(T.sun); sun.intensity = T.sunI; sun.position.copy(U.uSunDir.value).multiplyScalar(500);
  hemi.color.setHex(T.hs); hemi.groundColor.setHex(T.hg); hemi.intensity = T.hI;
  if (sea) { const su = sea.material.uniforms; su.deep.value.setHex(T.seaD); su.shallow.value.setHex(T.seaS); su.skyCol.value.setHex(T.mid); su.fogColor.value.setHex(T.fog); su.fogNear.value = T.near; su.fogFar.value = T.far; }
  if (env.camera) { env.camera.far = T.far * 1.25; env.camera.updateProjectionMatrix(); }   // 안개에 다 묻힌 것까지 그리지 않음
  env.time = name;
}

/* 불빛 — 빛(Light)을 더하지 않고 발광 + 가짜 빛 퍼짐(goal §5) · 재질·텍스처는 모두 한 벌 공유(장소 dispose가 지우지 않음) */
let GLOW = null;
function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  GLOW = new THREE.CanvasTexture(c); GLOW.colorSpace = THREE.SRGBColorSpace; SHARED.add(GLOW); return GLOW;
}
const GLOW_MATS = new Map();
/* 빛 퍼짐 판(빌보드) — 횃불·화로·대장간 불 둘레 · size m · 반투명 1겹(겹침 예산 ≤ 4) */
export function glowSprite(color = 0xffa040, size = 3, opacity = 0.55) {
  const k = color + '|' + opacity; let m = GLOW_MATS.get(k);
  if (!m) { m = new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }); GLOW_MATS.set(k, m); SHARED.add(m); }
  const s = new THREE.Sprite(m); s.scale.setScalar(size); s.renderOrder = 950; return s;
}
/* 불꽃 — 세 겹 원뿔이 uTime으로 일렁임(셰이더 하나 · 모든 불이 공유) · 크기는 scale로 */
let FLAME_M = null, FLAME_G = null;
export function flameMesh(scale = 1) {
  if (!FLAME_M) {
    FLAME_M = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uTime: U.uTime },
      vertexShader: `uniform float uTime; varying float vH; varying float vR;
        void main(){ vec3 p = position; vH = clamp(p.y / 1.0, 0.0, 1.0); vR = length(p.xz);
          vec4 w = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); float ph = w.x * 1.7 + w.z * 2.3;
          p.x += sin(uTime * 9.0 + p.y * 5.0 + ph) * 0.08 * vH; p.z += cos(uTime * 7.0 + p.y * 4.0 + ph) * 0.08 * vH;
          p.y *= 0.85 + 0.15 * sin(uTime * 11.0 + ph);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `varying float vH; varying float vR;
        void main(){ vec3 c = mix(vec3(1.0, 0.85, 0.45), vec3(0.95, 0.35, 0.08), vH); float a = (1.0 - vH) * 0.85;
          gl_FragColor = vec4(c * a, a);
          #include <colorspace_fragment>
        }`,
    });
    FLAME_G = new THREE.ConeGeometry(0.22, 1, 7, 3, true).translate(0, 0.5, 0);
    SHARED.add(FLAME_M); SHARED.add(FLAME_G);
  }
  const m = new THREE.Mesh(FLAME_G, FLAME_M); m.scale.setScalar(scale); m.renderOrder = 940; return m;
}
/* 장소가 지운 뒤에도 남는 공유 자원인지(dispose 때 건너뜀) */
export function isShared(o) { return SHARED.has(o); }

/* 늘 있는 바탕 — 하늘·바다·해·하늘빛·안개를 한 번만 짓고 장소가 바뀌어도 다시 씀(장소는 setTime · sea.visible만 만짐) */
export function createEnv(scene, camera) {
  scene.fog = new THREE.Fog(0xa9b8ba, 90, 1100);
  const hemi = new THREE.HemisphereLight(0xd7e2e6, 0x4b5a48, 1.15); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.5); scene.add(sun); scene.add(sun.target);
  const sky = makeSky(); scene.add(sky);
  const sea = makeSea(); scene.add(sea);
  SHARED.add(sky.geometry); SHARED.add(sky.material); SHARED.add(sea.geometry); SHARED.add(sea.material);
  const env = { scene, sky, sea, sun, hemi, camera, time: 'day' };
  env.follow = () => { sky.position.copy(camera.position); sea.follow(camera); };
  return env;
}
