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
const FOG_PARS = `
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
  m.customProgramCacheKey = () => 'drgToon1';
  return m;
}

/* 재질 캐시 — 같은 옵션이면 같은 재질 하나 */
const CACHE = new Map();
export function toon(o = {}) {
  const key = [o.color ?? 0xffffff, o.vc ? 1 : 0, o.emissive ?? 0, o.side ?? 0, o.map ? o.map.uuid : '', o.flat ? 1 : 0].join('|');
  let m = CACHE.get(key);
  if (!m) {
    m = patch(new THREE.MeshToonMaterial({ color: o.color ?? 0xffffff, gradientMap: RAMP, vertexColors: !!o.vc, map: o.map || null, emissive: o.emissive ?? 0, side: o.side ?? THREE.FrontSide }));
    if (o.flat) m.flatShading = true;
    CACHE.set(key, m);
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
  const sky = new THREE.Mesh(g, m); sky.frustumCulled = false; sky.renderOrder = -10;
  return sky;
}

/* 바다: 카메라를 따라오는 격자(칸 단위로 맞춰 물결이 미끄러지지 않음) + 정점 거스트너 물결 넷 + 물마루 밝게 · 거품 · 하늘빛 반사(프레넬) */
export function makeSea(size = 2400, seg = 160) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
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
        float fade = 1.0 - smoothstep(300.0, 1100.0, length(p.xz - cameraPosition.xz));   // 멀면 잔잔하게(안개 속)
        o += gw(vec4( 1.0, 0.3, 0.16 * amp * fade, 62.0), p.xz, t, b);
        o += gw(vec4( 0.6, 1.0, 0.13 * amp * fade, 31.0), p.xz, t, b);
        o += gw(vec4(-0.4, 0.9, 0.10 * amp * fade, 17.0), p.xz, t, b);
        o += gw(vec4( 0.9,-0.5, 0.08 * amp * fade,  9.0), p.xz, t, b);
        p += o; vW = p; vH = o.y; vN = normalize(cross(b, t));
        vec4 mv = viewMatrix * vec4(p, 1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 deep; uniform vec3 shallow; uniform vec3 foam; uniform vec3 skyCol;
      #include <fog_pars_fragment>
      ${FOG_PARS}
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
        gl_FragColor = vec4(drgFog(c, vW, vFogDepth), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  Object.assign(m.uniforms, { uTime: U.uTime, uSunDir: U.uSunDir, uFogSun: U.uFogSun, uSunFog: U.uSunFog, uFogBase: U.uFogBase, uFogFall: U.uFogFall, uFogLow: U.uFogLow });
  const sea = new THREE.Mesh(g, m); sea.frustumCulled = false;
  const step = size / seg;
  sea.follow = (cam) => { sea.position.set(Math.round(cam.position.x / step) * step, 0, Math.round(cam.position.z / step) * step); };
  return sea;
}

/* 때 넷 — 색값은 영화 화면에서 뽑지 않고 '감정 따라 바뀌는 흐름'(reference F-2)만 빌려 새로 고름 */
export const TIMES = {
  day:    { top: 0x5f82a0, mid: 0xb4c2c6, bot: 0x8fa3a8, fog: 0xa3b3b8, fogSun: 0xe8d6b4, near: 160, far: 1500, sun: 0xfff0d8, sunI: 2.1, hs: 0xc9d8e0, hg: 0x3e4a3c, hI: 0.8, sunDir: [-0.45, 0.5, 0.55], rim: 0.3, low: 0.18, seaD: 0x1d3a48, seaS: 0x46717c },
  sunset: { top: 0x3f4f7a, mid: 0xe7a77e, bot: 0x9a6f72, fog: 0xd59f86, fogSun: 0xffc27a, near: 180, far: 1600, sun: 0xffc48a, sunI: 2.2, hs: 0xe9b89c, hg: 0x3a2f3c, hI: 0.75, sunDir: [-0.8, 0.12, 0.3], rim: 0.5, low: 0.25, seaD: 0x2c2f4a, seaS: 0x7a5f6c },
  night:  { top: 0x0e1626, mid: 0x26324a, bot: 0x1a2232, fog: 0x2a3550, fogSun: 0x3c4a70, near: 60, far: 700, sun: 0x9fb2e0, sunI: 0.55, hs: 0x5a6a90, hg: 0x1a1a22, hI: 0.75, sunDir: [0.3, 0.6, -0.5], rim: 0.22, low: 0.35, seaD: 0x0c1622, seaS: 0x1f3448 },
  nest:   { top: 0x3a3438, mid: 0x6a5a58, bot: 0x3a2e2c, fog: 0x5e5250, fogSun: 0xa86a4a, near: 40, far: 520, sun: 0xffb08a, sunI: 0.9, hs: 0x8a7a76, hg: 0x2a1a16, hI: 0.9, sunDir: [0.2, 0.35, 0.7], rim: 0.3, low: 0.6, seaD: 0x1a1a1e, seaS: 0x3a3436 },
};
export function setTime(env, name) {
  const T = TIMES[name]; if (!T) return;
  const { scene, sky, sea, sun, hemi } = env;
  sky.material.uniforms.top.value.setHex(T.top); sky.material.uniforms.mid.value.setHex(T.mid); sky.material.uniforms.bot.value.setHex(T.bot); sky.material.uniforms.sunCol.value.setHex(T.sun);
  scene.fog.color.setHex(T.fog); scene.fog.near = T.near; scene.fog.far = T.far;
  U.uFogSun.value.setHex(T.fogSun); U.uRim.value = T.rim; U.uFogLow.value = T.low;
  U.uSunDir.value.set(...T.sunDir).normalize();
  sun.color.setHex(T.sun); sun.intensity = T.sunI; sun.position.copy(U.uSunDir.value).multiplyScalar(500);
  hemi.color.setHex(T.hs); hemi.groundColor.setHex(T.hg); hemi.intensity = T.hI;
  if (sea) { const su = sea.material.uniforms; su.deep.value.setHex(T.seaD); su.shallow.value.setHex(T.seaS); su.skyCol.value.setHex(T.mid); su.fogColor.value.setHex(T.fog); su.fogNear.value = T.near; su.fogFar.value = T.far; }
  env.time = name;
}
