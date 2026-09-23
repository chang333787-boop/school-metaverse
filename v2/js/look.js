// v2 화풍(룩) — 장면을 한 번 렌더 타깃에 그린 뒤, 화면 전체 1패스 셰이더로 '그림체'를 입힌다.
// 목적: 기본 상자+램버트의 '익숙한(흔한 복셀 게임) 느낌'을 벗는 것. 모델·배치는 건드리지 않는다.
// 비용: 추가 드로우콜 1 + 전체화면 1패스(탭 수 ≤ 25). 크롬북(1366×610·DPR1) 기준으로 잡았다.
// ?look=storybook | diorama | crayon | none   (없으면 none = 지금과 동일)
import * as THREE from 'three';

const STYLES = {
  none: null,
  // ① 그림책 — 갈색 잉크 외곽선 + 종이결 + 따뜻한 수채 톤. 하늘은 크림→연하늘 그라데이션
  storybook: {
    outline: 1.0, lw: 1.5, ink: [0.2, 0.13, 0.1], edgeFar: 80, wash: 0.2, washScale: 0.45, split: 0.5,
    sat: 0.92, warm: 0.05, lift: 0.1, contrast: 1.02,
    paper: 0.08, poster: 0, hatch: 0, tilt: 0, vignette: 0.28,
    skyTop: [0.62, 0.78, 0.9], skyHor: [0.98, 0.94, 0.84],
  },
  // ② 미니어처 디오라마 — 위아래 흐림(틸트시프트) + 진한 색 + 비네트. '우리 학교 모형'을 들여다보는 느낌
  diorama: {
    outline: 0.25, lw: 1.0, ink: [0.2, 0.18, 0.2], edgeFar: 50, wash: 0.06, washScale: 1.2, split: 0.35,
    sat: 1.35, warm: 0.05, lift: 0.0, contrast: 1.15,
    paper: 0.0, poster: 0, hatch: 0, tilt: 1.0, vignette: 0.42,
    skyTop: [0.45, 0.68, 0.92], skyHor: [0.86, 0.93, 0.98],
  },
  // ③ 색연필 — 명암 3단 끊기 + 그늘에 빗금 + 연필 외곽선 + 도화지. 톤은 파스텔
  crayon: {
    outline: 0.9, lw: 1.3, ink: [0.28, 0.28, 0.33], edgeFar: 60, wash: 0.05, washScale: 0.8, split: 0.2,
    sat: 0.8, warm: 0.02, lift: 0.14, contrast: 1.05,
    paper: 0.14, poster: 4, hatch: 0.8, tilt: 0, vignette: 0.12,
    skyTop: [0.78, 0.87, 0.95], skyHor: [0.97, 0.96, 0.92],
  },
};

const VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */`
precision highp float;
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform vec2 res; uniform float cNear, cFar, exposure, px;
uniform float lw, split, outline, edgeFar, sat, warm, lift, contrast, paper, poster, hatch, tilt, vignette;
uniform vec3 ink, skyTop, skyHor;
varying vec2 vUv;

float lin(float d) { return cNear * cFar / (cFar - d * (cFar - cNear)); }
vec3 aces(vec3 x) { x *= exposure; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 shade(vec2 uv) { return toSRGB(aces(texture2D(tColor, uv).rgb)); }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }

void main() {
  vec2 t = px / res;
  vec2 to = t * lw;
  float d0 = texture2D(tDepth, vUv).r;
  bool sky = d0 >= 0.99999;
  vec3 col;

  // ── 틸트시프트(디오라마): 화면 가운데 띠는 선명, 위·아래로 갈수록 흐림
  if (tilt > 0.0) {
    float band = smoothstep(0.12, 0.42, abs(vUv.y - 0.46)) * tilt;
    vec3 acc = vec3(0.0); float wsum = 0.0;
    for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) {
      vec2 o = vec2(float(i), float(j)) * band * 2.2 * t;
      float w = 1.0 / (1.0 + float(i * i + j * j));
      acc += shade(vUv + o) * w; wsum += w;
    }
    col = acc / wsum;
  } else col = shade(vUv);

  // ── 하늘: 평평한 단색 대신 세로 그라데이션 + 옅은 구름결
  if (sky) {
    float h = clamp((vUv.y - 0.35) / 0.65, 0.0, 1.0);
    vec3 s = mix(skyHor, skyTop, pow(h, 0.8));
    float cl = noise(vUv * vec2(6.0, 14.0) + vec2(0.0, 3.0)) * noise(vUv * vec2(13.0, 30.0));
    col = mix(s, vec3(1.0), smoothstep(0.25, 0.6, cl) * 0.35 * h);
  }

  // ── 명암 끊기(색연필): 밝기만 N단으로, 색상은 유지
  if (poster > 0.0 && !sky) {
    float l = luma(col);
    float q = (floor(l * poster + 0.5) / poster);
    col *= mix(1.0, q / max(l, 0.02), 0.6);
  }

  // ── 색 보정: 채도·대비·따뜻함·검정 들어올림(종이색)
  float l = luma(col);
  col = mix(vec3(l), col, sat);
  col = (col - 0.5) * contrast + 0.5;
  col += vec3(warm, warm * 0.45, -warm * 0.6);
  col = mix(col, vec3(1.0, 0.97, 0.9), lift * (1.0 - l));
  // 분할 톤: 그늘은 푸른 보라, 볕은 살구 — 회색으로 어두워지던 그늘을 '색이 있는 그늘'로
  if (!sky) { float sh = 1.0 - smoothstep(0.2, 0.62, l), hi = smoothstep(0.55, 0.95, l);
    col += split * (sh * vec3(-0.05, -0.02, 0.07) + hi * vec3(0.04, 0.02, -0.03)); }

  // ── 빗금: 어두운 곳에만 화면 45° 연필선
  if (hatch > 0.0 && !sky) {
    vec2 fp = gl_FragCoord.xy / px;
    float dark = 1.0 - smoothstep(0.25, 0.6, l);
    float line1 = smoothstep(0.55, 0.9, sin((fp.x + fp.y) * 0.9) * 0.5 + 0.5);
    float line2 = smoothstep(0.6, 0.95, sin((fp.x - fp.y) * 0.9) * 0.5 + 0.5) * step(l, 0.3);
    col *= 1.0 - hatch * dark * max(line1, line2) * 0.45;
  }

  // ── 외곽선: 깊이 불연속(실루엣) + 밝기 불연속(면 꺾임). 멀수록 흐리게(원경 반짝임 억제)
  if (outline > 0.0 && !sky) {
    float z = lin(d0);
    float zl = lin(texture2D(tDepth, vUv - vec2(to.x, 0.0)).r), zr = lin(texture2D(tDepth, vUv + vec2(to.x, 0.0)).r);
    float zd = lin(texture2D(tDepth, vUv - vec2(0.0, to.y)).r), zu = lin(texture2D(tDepth, vUv + vec2(0.0, to.y)).r);
    float de = (abs(zl + zr - 2.0 * z) + abs(zd + zu - 2.0 * z)) / z;       // 2차 차분 — 비스듬한 면은 0, 모서리만 뜬다
    float eD = smoothstep(0.04, 0.12, de);
    float ll = luma(shade(vUv - vec2(to.x, 0.0))), lr = luma(shade(vUv + vec2(to.x, 0.0)));
    float ld = luma(shade(vUv - vec2(0.0, to.y))), lu = luma(shade(vUv + vec2(0.0, to.y)));
    float eL = smoothstep(0.1, 0.22, abs(ll - lr) + abs(ld - lu));
    float fade = 1.0 - smoothstep(edgeFar * 0.5, edgeFar, z);
    float e = max(eD, eL * 0.7) * outline * fade;
    // 손그림 떨림: 선 농도를 저주파 잡음으로 흔든다
    e *= 0.75 + 0.5 * noise(gl_FragCoord.xy / px * 0.08);
    col = mix(col, ink, clamp(e, 0.0, 1.0));
  }

  // ── 종이결 + 비네트
  if (paper > 0.0) {
    vec2 fp = gl_FragCoord.xy / px;
    float g = noise(fp * 0.9) * 0.6 + noise(fp * 0.23) * 0.4;
    col *= 1.0 - paper * (g - 0.5) * 2.0 * 0.5 - paper * 0.3;
    col += paper * 0.35;
  }
  vec2 c = vUv - 0.5;
  col *= 1.0 - vignette * dot(c, c) * 1.6;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// 면 물감 얼룩: 모든 불투명 재질의 바탕색을 월드 좌표 잡음으로 ±흔든다(붓 자국처럼). 공유 uniform 하나로 켜고 끈다.
const PAINT = { uWash: { value: 0 }, uWashScale: { value: 0.5 } };
const NOISE3 = `
float pH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float pN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(pH(i), pH(i + vec3(1,0,0)), f.x), mix(pH(i + vec3(0,1,0)), pH(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(pH(i + vec3(0,0,1)), pH(i + vec3(1,0,1)), f.x), mix(pH(i + vec3(0,1,1)), pH(i + vec3(1,1,1)), f.x), f.y), f.z); }
`;
function paintPatch(mat) {
  if (mat.userData.painted || mat.transparent || mat.map) return;
  mat.userData.painted = true;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uWash = PAINT.uWash; sh.uniforms.uWashScale = PAINT.uWashScale;
    sh.vertexShader = 'varying vec3 vPaintW;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n  vPaintW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying vec3 vPaintW;\nuniform float uWash, uWashScale;\n' + NOISE3 + sh.fragmentShader.replace('#include <color_fragment>',
      `#include <color_fragment>
  if (uWash > 0.0) {
    vec3 q = vPaintW * uWashScale;
    float n = pN(q) * 0.55 + pN(q * 2.7 + 7.0) * 0.3 + pN(q * 9.0 + 3.0) * 0.15;
    diffuseColor.rgb *= 1.0 + uWash * (n - 0.5) * 2.0;
  }`);
  };
  mat.customProgramCacheKey = () => 'paint1';
  mat.needsUpdate = true;
}

export function createLook(renderer, scene, camera, initial) {
  let style = STYLES[initial] ? initial : 'none';
  const size = new THREE.Vector2();
  const dt = new THREE.DepthTexture(1, 1); dt.type = THREE.UnsignedIntType;
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4, depthTexture: dt });
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: {
      tColor: { value: rt.texture }, tDepth: { value: dt }, res: { value: new THREE.Vector2() },
      cNear: { value: camera.near }, cFar: { value: camera.far }, exposure: { value: 1 }, px: { value: 1 },
      lw: { value: 1 }, split: { value: 0 }, outline: { value: 0 }, edgeFar: { value: 60 }, sat: { value: 1 }, warm: { value: 0 }, lift: { value: 0 }, contrast: { value: 1 },
      paper: { value: 0 }, poster: { value: 0 }, hatch: { value: 0 }, tilt: { value: 0 }, vignette: { value: 0 },
      ink: { value: new THREE.Color() }, skyTop: { value: new THREE.Color() }, skyHor: { value: new THREE.Color() },
    },
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const qScene = new THREE.Scene(); qScene.add(quad);
  const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  scene.traverse(o => { if (o.isMesh && (o.material.isMeshLambertMaterial || o.material.isMeshBasicMaterial)) paintPatch(o.material); });
  function apply() {
    const s = STYLES[style];
    PAINT.uWash.value = s ? s.wash : 0; if (s) PAINT.uWashScale.value = s.washScale;
    if (!s) return;
    const u = mat.uniforms;
    for (const k of ['lw', 'split', 'outline', 'edgeFar', 'sat', 'warm', 'lift', 'contrast', 'paper', 'poster', 'hatch', 'tilt', 'vignette']) u[k].value = s[k];
    u.ink.value.setRGB(...s.ink); u.skyTop.value.setRGB(...s.skyTop); u.skyHor.value.setRGB(...s.skyHor);
  }
  apply();

  return {
    get style() { return style; },
    styles: Object.keys(STYLES),
    set(name) { if (name in STYLES) { style = name; apply(); } return style; },
    paint: paintPatch,
    render() {
      if (!STYLES[style]) { renderer.render(scene, camera); return; }
      renderer.getDrawingBufferSize(size);
      if (rt.width !== size.x || rt.height !== size.y) rt.setSize(size.x, size.y);
      const u = mat.uniforms;
      u.res.value.copy(size); u.px.value = renderer.getPixelRatio();
      u.cNear.value = camera.near; u.cFar.value = camera.far; u.exposure.value = renderer.toneMappingExposure;
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(qScene, qCam);
    },
  };
}
