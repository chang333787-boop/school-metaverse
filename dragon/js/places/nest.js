// 둥지 섬(design §2 8·10장 · reference A #20·#24~27 · 안개 속 화산 섬) — 장소 계약 = docs/dragon/stage3_plan.md §2 · 때 'nest'(검붉은 회색 · design §15)
// variant 'beach'(10장 ② 해변·비탈·바다 돌기둥·불난 배 · ④⑤ 대장전 하늘) · 'fog'(10장 ① 안개 바다 · 앞배가 남긴 물 위 불빛 띠)
//         'under'(10장 ③ 가라앉는 배 둘레 물속 작은 무대 · 밝은 물빛 · 사슬 셋) · 'after'(10장 ⑥ 연기 → 하늘이 맑아짐) · 'crater'(8장 분화구 안 · 팀 C)
// 결 = 시안 A(toon 정점색 · 상자 X · 깎은 땅·돌) · 불빛은 flameMesh + glowSprite(Light X) · 연기·구름·불티는 정점 셰이더가 움직임(CPU 0) · 매 걸음 new X
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, setTime, TIMES, U, flameMesh, glowSprite, FOG_PARS } from '../look/kit.js?v=15';
import { createNoise } from '../core/noise.js?v=15';
import { createRng } from '../core/rng.js?v=15';
import * as NT from '../look/nature.js?v=15';
import { loadModel } from '../look/models.js?v=15';

const { C3, mixc, sstep, clamp, hash, TAU } = NT;
/* ── 섬 모양(모든 variant가 같은 섬) — 단위 m · 바다 = y 0 ── */
const IC = { x: 0, z: -40 }, RS = 255;                  // 섬 가운데 · 바닷가 반지름(노이즈로 흔듦)
const MT = { x: 0, z: -90 }, RC = 50, RF = 215, RIM = 150, FLOOR = 96;   // 화산: 분화구 입술 반지름·높이 · 산자락 반지름
const BEACH = { x: 0, z: 192 };                           // 해변 가운데(남쪽)
const WALK = { x: 0, z: 186, r: 104 };                    // 걷는 곳
const SHIPS = [[-72, 228, 0.25], [-8, 238, -0.12], [58, 229, -0.35]];   // 불난 배 셋(이물이 모래에 걸침)
const WRECK = [[96, 252, -0.6]];                           // 가라앉는 배(투슬리스가 묶인 배 · 물속 무대 들머리)
const ADULTS = [[-70, 208], [-63, 211], [-78, 205], [-11, 216], [-3, 212], [52, 209], [61, 212], [45, 206]];
const BARRELS = [[-40, 201], [20, 207], [82, 202]];
const PILE = { x: -32, z: 194 };
const RISE = { x: 0, z: 64 }, STAND = { x: 0, z: 124 };
const SKY = { x: 0, z: -40, r: 430 };                      // 대장전 하늘 경계

/* 색(선형) */
const ROCK1 = C3(0x4b4440), ROCK2 = C3(0x5e544d), RUST = C3(0x6e4a3e), ASH = C3(0x968b7c), ASH2 = C3(0x7a7064), SAND = C3(0x55504a), SANDW = C3(0x34312e), SCRUB = C3(0x66744a), CRATER = C3(0x352e2c), EMBER = C3(0x8a3a22), BASALT = C3(0x3d3937), BASALT2 = C3(0x524c47), FOAM = C3(0xd8dedc), TOPG = C3(0x5a5a46);
const WOOD = C3(0x5a4030), WOOD2 = C3(0x6f5038), WOODD = C3(0x2e2420), CHAR = C3(0x221c1a), SAIL1 = C3(0x9a5a34), SAIL2 = C3(0xd2c29c);

/* 정점 셰이더로 움직이는 판 무리(연기·구름·불티) — 판은 세로축만 돎(빌보드) · aB = 자리(xyz)+씨앗 · aS = 크기·빠르기·높이·켜짐 */
function puffMat(o) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { map: { value: null }, c0: { value: new THREE.Color(o.c0) }, c1: { value: new THREE.Color(o.c1) }, op: { value: o.op ?? 0.8 }, wind: { value: new THREE.Vector2(o.wx ?? 2, o.wz ?? 0.5) } }]),
    vertexShader: `uniform float uTime; uniform vec2 wind; attribute vec4 aB; attribute vec4 aS; varying vec2 vUv; varying float vA; varying float vK; varying float vFogDepth; varying vec3 vW;
      void main(){ vUv = uv; float life = ${o.rise ? 'fract(uTime * aS.y + aB.w)' : '0.5'}; vK = life;
        vec3 c = aB.xyz + vec3(wind.x * life * aS.z * 0.25, ${o.rise ? 'life * aS.z' : 'sin(uTime * 0.2 + aB.w * 6.0) * 1.5'}, wind.y * life * aS.z * 0.25);
        float s = aS.x * ${o.rise ? '(0.35 + life * 1.1)' : '1.0'} * aS.w;
        vA = aS.w * ${o.rise ? 'smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.55, 1.0, life))' : '1.0'};
        vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * s * vec2(1.0, ${(o.sy || 1).toFixed(2)}); vW = c; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 c0; uniform vec3 c1; uniform float op; varying vec2 vUv; varying float vA; varying float vK; varying vec3 vW;
      #include <fog_pars_fragment>
      void main(){ vec4 t = texture2D(map, vUv); float a = t.a * vA * op; if (a < 0.01) discard; vec3 c = mix(c0, c1, clamp(vK + (vUv.y - 0.5) * 0.6, 0.0, 1.0));
        gl_FragColor = vec4(c, a);
        #ifdef USE_FOG
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * ${o.add ? '1.0' : '0.85'});
          ${o.add ? 'gl_FragColor.a *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);' : ''}
        #endif
        #include <colorspace_fragment>
      }`,
  });
  m.uniforms.uTime = U.uTime; return m;
}
let PUFF_TEX = null;
function puffTex() {
  if (PUFF_TEX) return PUFF_TEX;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d');
  for (let k = 0; k < 7; k++) { const gx = 24 + hash(k, 1) * 16, gy = 26 + hash(k, 2) * 12, gr = 10 + hash(k, 3) * 10, gd = x.createRadialGradient(gx, gy, 0, gx, gy, gr); gd.addColorStop(0, 'rgba(255,255,255,0.85)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gd; x.fillRect(0, 0, 64, 64); }
  PUFF_TEX = new THREE.CanvasTexture(cv); PUFF_TEX.colorSpace = THREE.SRGBColorSpace; return PUFF_TEX;   // 장소마다 다시 짓고 group dispose가 비움(SHARED 아님)
}
/* list = [[x,y,z,seed, size,speed,rise,on]] → 판 무리 하나(그리기 1) · aS.w(켜짐)는 나중에 setOn으로 */
function puffs(group, list, o) {
  const n = list.length, g = new THREE.InstancedBufferGeometry(); g.copy(new THREE.PlaneGeometry(1, 1)); g.instanceCount = n;
  const B = new Float32Array(n * 4), S = new Float32Array(n * 4);
  list.forEach((p, i) => { B.set([p[0], p[1], p[2], p[3]], i * 4); S.set([p[4], p[5], p[6], p[7] ?? 1], i * 4); });
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 4));
  const m = puffMat(o); m.uniforms.map.value = puffTex();
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = o.order ?? 960; group.add(mesh);
  mesh.setOn = (i, v) => { S[i * 4 + 3] = v; g.attributes.aS.needsUpdate = true; };
  mesh.setColors = (a, b) => { m.uniforms.c0.value.setHex(a); m.uniforms.c1.value.setHex(b); };
  return mesh;
}

/* Mesher 결과 → BufferGeometry(정점색) */
function geoOf(r) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(r.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(r.nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(r.col, 3));
  g.setIndex(new THREE.BufferAttribute(r.idx, 1)); return g;
}
/* 바다 돌기둥(현무암) — 층마다 튀어나온 턱 · 세로 홈 · 넓은 밑동 · 잿빛 꼭대기 · 젖은 밑동·물거품 띠 */
function stack(M, x, z, r, top, seed) {
  const SEG = 16, ys = [-8, -1.2, 0.4, 2];
  const n = Math.max(8, Math.round(top / 3.6)); for (let i = 1; i <= n; i++) ys.push(2 + (top - 3) * i / n);
  ys.push(top - 0.4, top + 0.5, top + 1.1);
  const base = M.n, cc = [0, 0, 0], bandH = 5 + hash(seed, 3) * 4, lean = (hash(seed, 7) - 0.5) * 0.06, la = hash(seed, 8) * TAU;
  ys.forEach((y, ri) => {
    const h = clamp(y / top, 0, 1), last = ri >= ys.length - 3, fr = ((y / bandH + seed) % 1 + 1) % 1;
    const waist = hash(seed, 9) > 0.5 ? 0.22 * Math.exp(-Math.pow((h - 0.45) / 0.15, 2)) : 0;
    const prof = (1.32 - 0.45 * h - waist) * (1 + (fr < 0.12 ? 0.12 * fr / 0.12 : 0.12 * (1 - (fr - 0.12) / 0.88)) - 0.06);
    for (let s = 0; s < SEG; s++) {
      const a = s / SEG * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const groove = (NT.noise3(ca * 4.2 + seed * 3, sa * 4.2, y * 0.025) - 0.5) * 0.8, knob = (NT.noise3(ca * 1.6 + y * 0.06, sa * 1.6, seed) - 0.5) * 0.5;
      let rr = r * prof * (1 + groove + knob); if (ri === ys.length - 1) rr = r * 0.05; else if (ri === ys.length - 2) rr *= 0.6;
      const px = x + ca * rr + Math.cos(la) * lean * y, pz = z + sa * rr + Math.sin(la) * lean * y;
      mixc(BASALT, BASALT2, 0.5 + 0.5 * Math.sin(y * 0.55 + groove * 8), cc);
      if (fr < 0.1) mixc(cc, ASH2, 0.45, cc); else if (fr > 0.85) mixc(cc, CHAR, 0.3, cc);
      mixc(cc, CHAR, Math.max(0, -(groove + knob)) * 1.4, cc);
      if (last) mixc(TOPG, ASH, NT.noise3(ca * 3, sa * 3, seed), cc);
      if (y < 2.5) mixc(cc, SANDW, clamp((2.5 - y) / 2.5, 0, 1) * 0.8, cc);
      if (y > -0.9 && y < 1.2 && NT.noise3(ca * 4 + seed, sa * 4, y) > 0.5) mixc(cc, FOAM, 0.6, cc);
      M.v(px, y, pz, cc.slice());
    }
  });
  for (let ri = 0; ri < ys.length - 1; ri++) for (let s = 0; s < SEG; s++) { const a = base + ri * SEG + s, b = base + ri * SEG + (s + 1) % SEG, c = base + (ri + 1) * SEG + (s + 1) % SEG, d = base + (ri + 1) * SEG + s; M.quad(a, d, c, b); }
}
/* 바이킹 배(길이 ≈ 22m · 이물 = +Z) — 판자 띠 · 용머리 이물 · 돛대·돛 · 방패 줄 · burnt 0~1 그을음 · 정점색 한 덩어리 */
function shipMesher(M, burnt, seed, torn) {
  const L = 11, NS = 16, NP = 9, cc = [0, 0, 0];
  const base = M.n;
  for (let i = 0; i <= NS; i++) {
    const s = i / NS * 2 - 1, w = 2.7 * Math.pow(Math.max(0, 1 - s * s), 0.55) + 0.06, top = 1.3 + 1.5 * Math.pow(Math.abs(s), 3.5), d = 1.7 * (1 - 0.35 * s * s);
    for (let j = 0; j < NP; j++) {
      const u = j / (NP - 1) * 2 - 1, a = u * Math.PI * 0.5, x = Math.sin(a) * w, y = top - Math.cos(a) * d * (1 - 0.15 * Math.abs(u));
      const band = Math.floor((y + 0.6) / 0.36) % 2, ch = burnt * clamp(0.4 + 0.6 * hash(seed, i, j) + (Math.abs(s) < 0.6 ? 0.3 : 0), 0, 1);
      mixc(band ? WOOD : WOOD2, WOODD, hash(seed, i * 3, j) * 0.25, cc); mixc(cc, CHAR, ch * 0.85, cc);
      M.v(x, y, s * L, cc.slice());
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NP - 1; j++) { const a = base + i * NP + j, b = a + 1, c = a + NP + 1, d = a + NP; M.quad(a, d, c, b); }
  /* 용머리·꼬리(굽은 대롱) */
  const neck = (sg) => { const pts = []; for (let k = 0; k <= 6; k++) { const f = k / 6; pts.push([0, 2.6 + f * 3.0 + Math.sin(f * 2.6) * 0.4, sg * (L + 0.2 + Math.sin(f * 1.9) * 1.4 - f * f * 1.2), 0.32 * (1 - f * 0.55), mixc(WOODD, CHAR, burnt * 0.6)]); } NT.tube(M, pts, 6, mixc(WOODD, CHAR, burnt)); };
  neck(1); neck(-1);
  /* 방패 줄(뱃전 바깥) */
  for (let k = -4; k <= 4; k++) for (const sd of [-1, 1]) {
    const s = k / 5.2, w = 2.7 * Math.pow(Math.max(0, 1 - s * s), 0.55) + 0.12, y = 1.1 + 1.5 * Math.pow(Math.abs(s), 3.5);
    const col = (k + 5) % 2 ? C3(0x8a6a3a) : C3(0x6e3a2a); mixc(col, CHAR, burnt * hash(seed, k + 9, sd + 2), cc);
    NT.lathe(M, [[0.02, 0.12], [0.5, 0.05], [0.55, -0.06]], 8, () => [1, 0, cc.slice()], 0, 0, 0);
    const b0 = M.n - 3 * 8; for (let q = b0; q < M.n; q++) { const px = M.p[q * 3], py = M.p[q * 3 + 1], pz = M.p[q * 3 + 2]; M.p[q * 3] = sd * (w + py); M.p[q * 3 + 1] = y + pz; M.p[q * 3 + 2] = s * L + px; }
  }
  /* 돛대 · 활대 · 돛(찢김 = 칸 빼기) */
  NT.tube(M, [[0, 0.4, 0.5, 0.2, WOODD], [0, 11, 0.5, 0.13, WOODD]], 6);
  NT.tube(M, [[-4.2, 9.6, 0.6, 0.12, WOODD], [4.2, 9.6, 0.6, 0.12, WOODD]], 5);
  const sb = M.n, SW = 7, SH = 5;
  for (let j = 0; j <= SH; j++) for (let i = 0; i <= SW; i++) {
    const x = (i / SW - 0.5) * 8, y = 9.5 - j / SH * 6.2, bell = Math.sin(i / SW * Math.PI) * 0.9 * (1 - j / SH * 0.3);
    mixc(Math.floor(i / 1.4) % 2 ? SAIL1 : SAIL2, CHAR, burnt * clamp(j / SH * 0.9 + hash(seed, i, j) * 0.4 - 0.2, 0, 1), cc);
    M.v(x, y, 0.7 + bell, cc.slice());
  }
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { if (torn && hash(seed, i, j + 30) < torn * (0.3 + j / SH)) continue; const a = sb + j * (SW + 1) + i; M.quad(a, a + 1, a + SW + 2, a + SW + 1); }
}

export async function buildPlace(ctx) {
  const { group, env, camera } = ctx, opt = ctx.opt || {};
  const variant = opt.variant || 'beach';
  if (variant === 'under') return buildUnder(ctx);
  if (variant === 'crater') return buildCrater(ctx);
  const N = createNoise(61), N2 = createNoise(83), R = createRng(4127);
  const time = TIMES[opt.time] ? opt.time : 'nest';
  const fogV = variant === 'fog', after = variant === 'after';
  const OVER = fogV ? { near: 8, far: 88, low: 0.5, top: 0xa29c98, mid: 0xb6b0ac, fog: 0xb2aca8, fogSun: 0xc4bcb4, hI: 1.2 } : { near: 70, far: 760, low: 0.2, sunI: 1.3, hI: 1.05 };
  setTime(env, time, OVER); env.sea.visible = true;

  /* ── 섬 높이(해석식 · 짓기 때만) ── */
  const shoreR = (th) => RS * (1 + 0.11 * (N.fbm(Math.cos(th) * 1.5 + 3, Math.sin(th) * 1.5 + 8, 3) - 0.5) * 2);
  const islandH = (x, z) => {
    const dx = x - MT.x, dz = z - MT.z, th = Math.atan2(dz, dx), r = Math.hypot(dx, dz) * (1 + 0.07 * (N.fbm(Math.cos(th) * 1.3 + 5, Math.sin(th) * 1.3 + 2, 3) - 0.5) * 2);
    let m;
    if (r < RC) m = FLOOR + (RIM - FLOOR) * Math.pow(sstep(28, RC, r), 1.4) + (N2.fbm(x * 0.05, z * 0.05, 3) - 0.5) * 6;
    else {
      const f = Math.max(0, 1 - (r - RC) / (RF - RC));
      if (f <= 0) m = -1e9;
      else {
        const rid = Math.pow(Math.abs(Math.sin(th * 11 + N.fbm(r * 0.012 + 3, th * 1.5, 3) * 5)), 0.55);    // 흘러내린 용암 등성이 · 사이 골짜기
        m = RIM * Math.pow(f, 1.45) - 20 * f * (1 - rid) * sstep(0.02, 0.3, f) + (N2.fbm(x * 0.03 + 7, z * 0.03, 4) - 0.5) * 18 * f + (N.fbm(x * 0.13, z * 0.13, 2) - 0.5) * 3 * f - 5 * Math.pow(1 - f, 4);
      }
    }
    const ex = x - IC.x, ez = z - IC.z, ds = Math.hypot(ex, ez) / shoreR(Math.atan2(ez, ex));
    const land = 3.2 * sstep(1.0, 0.87, ds) - 7 * sstep(1.0, 1.18, ds) + (N.fbm(x * 0.06 + 1, z * 0.06, 3) - 0.5) * 1.4 * sstep(1.05, 0.9, ds);
    return Math.max(m, land);
  };
  /* 걷는 격자(1m · 해변) · 섬 격자(4m · 비행 땅·먼 판) */
  const G1 = NT.createGrid(-132, 92, 1, 265, 172).fill((x, z) => islandH(x, z));
  await NT.breathe();
  const G2 = NT.createGrid(-320, -340, 4, 161, 156).fill((x, z) => islandH(x, z));
  const inG1 = (x, z) => x > -131 && x < 132 && z > 93 && z < 262;
  const height = (x, z) => (inG1(x, z) ? G1.at(x, z) : G2.at(x, z));
  const flyGround = (x, z) => (x > -320 && x < 320 && z > -340 && z < 280 ? G2.at(x, z) : -20);
  await NT.breathe();

  /* ── 땅 굽기(청크 120m · 먼 판) ── */
  const B = NT.createBuilder({ x0: -320, z0: -340, size: 128, nx: 5, nz: 5, far: 1 });
  const colFor = (G) => (x, y, z, i, j, c) => colAt(x, y, z, Math.hypot(G.get(i + 1, j) - G.get(i - 1, j), G.get(i, j + 1) - G.get(i, j - 1)) / (2 * G.step), c);
  const colAt = (x, y, z, slope, c) => {
    const n = N.v2(x * 0.07, z * 0.07), n2 = N2.v2(x * 0.02 + 4, z * 0.02), dm = Math.hypot(x - MT.x, z - MT.z), n3 = N2.v2(x * 0.3, z * 0.3);
    if (y < 3.6 && dm > RF - 30) { mixc(SAND, SANDW, sstep(1.6, 0.2, y) * 0.9 + n * 0.1, c); if (n3 > 0.72) mixc(c, ASH2, 0.35, c); }
    else if (dm > RF - 15) { mixc(ASH, ASH2, n, c); if (n2 > 0.5) mixc(c, SCRUB, Math.min(1, (n2 - 0.5) * 2.6), c); if (n3 > 0.78) mixc(c, ROCK2, 0.5, c); }
    else { mixc(ROCK1, ROCK2, n, c); if (n2 > 0.58) mixc(c, RUST, Math.min(0.8, (n2 - 0.58) * 2.2), c); if (slope < 0.45 && dm > RC + 20) mixc(c, ASH2, sstep(0.45, 0.2, slope) * 0.75, c); if (y > RIM - 30) mixc(c, ASH, sstep(RIM - 30, RIM, y) * 0.45, c); if (dm < RC) mixc(c, CRATER, 0.7, c); }
    if (slope > 0.7) mixc(c, ROCK1, sstep(0.7, 1.3, slope) * 0.7, c);
    if (after) { const dc = Math.hypot(x - 18, z - 150); if (dc < 30) mixc(c, CHAR, sstep(30, 8, dc) * 0.8, c); }
    return c;
  };
  const allBelow = (G, i, j, lim) => G.get(i, j) < lim && G.get(i + 1, j) < lim && G.get(i, j + 1) < lim && G.get(i + 1, j + 1) < lim;
  B.ground(G1, colFor(G1), (i, j) => allBelow(G1, i, j, -2.5), 3);
  B.ground(G2, colFor(G2), (i, j) => { const x = G2.x0 + i * 4, z = G2.z0 + j * 4; return (x > -127 && x < 124 && z > 96 && z < 254) || allBelow(G2, i, j, -3); }, 2);
  await NT.breathe();

  /* 바위·그루터기(해변·비탈) — 원형 몇 벌을 행렬로 */
  const rocks = [0, 1, 2, 3].map((k) => NT.rockGeo(k * 7 + 3, { flat: 0.6, moss: 0, detail: 1 }));
  const blockers = [];
  for (let k = 0; k < 70; k++) {
    const a = R() * TAU, d = 60 + R() * 200, x = MT.x + Math.cos(a) * d, z = MT.z + Math.sin(a) * d, y = islandH(x, z); if (y < 0.4) continue;
    const s = 1.2 + R() * (d > 180 ? 2.5 : 5), near = Math.hypot(x - WALK.x, z - WALK.z) < WALK.r + 20;
    B.put(rocks[k % 4], NT.mat4(x, y - s * 0.35, z, R() * TAU, s, s * 1.05, s * (0.8 + R() * 0.4)), [0.72, 0.68, 0.66], near ? 'near' : 'both');
    if (near && s > 1.6) blockers.push({ x, z, r: s * 0.8 });
  }
  const crags = [0, 1, 2].map((k) => NT.rockGeo(k * 13 + 5, { flat: 1.15, moss: 0, sharp: 0.85, detail: 1 }));
  for (let k = 0; k < 40; k++) {                                       // 산비탈 바위 봉우리(반쯤 묻힘 · 위로 솟음 · 멀리서도 보임)
    const a = R() * TAU, d = RC + 10 + R() * (RF - RC - 40), x = MT.x + Math.cos(a) * d, z = MT.z + Math.sin(a) * d, y = islandH(x, z), s = 4 + R() * 7;
    if (Math.hypot(x - RISE.x, z - RISE.z) < 30) continue;
    B.put(crags[k % 3], NT.mat4(x, y - s * 0.45, z, a, s * (0.8 + R() * 0.4), s * (1.1 + R() * 0.6), s), [0.62 + R() * 0.1, 0.56, 0.53], 'both');
  }
  const bush = NT.bushGeo(5, { n: 3 });
  for (let k = 0; k < 60; k++) { const x = WALK.x + (R() - 0.5) * 300, z = WALK.z - 50 + (R() - 0.5) * 160, y = islandH(x, z); if (y < 3.4 || y > 30) continue; const s = 0.6 + R() * 0.9; B.put(bush, NT.mat4(x, y - 0.1, z, R() * TAU, s), [0.75, 0.7, 0.55], 'near'); if (Math.hypot(x - WALK.x, z - WALK.z) < WALK.r) blockers.push({ x, z, r: s * 0.9 }); }
  const dead = [NT.deadTreeGeo(3, { h: 9 }), NT.deadTreeGeo(8, { h: 12 })];
  for (let k = 0; k < 18; k++) {
    const a = R() * TAU, d = RF - 30 + R() * 50, x = MT.x + Math.cos(a) * d, z = MT.z + Math.sin(a) * d, y = islandH(x, z); if (y < 2) continue;
    B.put(dead[k % 2], NT.mat4(x, y, z, R() * TAU, 0.8 + R() * 0.5), [0.35, 0.32, 0.3], 'both');
    if (Math.hypot(x - WALK.x, z - WALK.z) < WALK.r) blockers.push({ x, z, r: 0.6 });
  }
  /* 걷는 곳 잔결 — 마른 풀포기(재 들판) · 조약돌(검은 모래) · 떠밀려 온 나무 */
  if (!fogV) {
    const tufts = [0, 1, 2].map((k) => NT.grassGeo(k * 3 + 1, { blades: 7, h: 0.55, base: C3(0x55603a), tip: C3(0xa89e6a) }));
    const pebble = NT.rockGeo(11, { flat: 0.5, moss: 0, detail: 0 });
    const logs = [NT.logGeo(2, { len: 5, r: 0.3 }), NT.logGeo(6, { len: 3.5, r: 0.24 })];
    for (let k = 0; k < 900; k++) { const x = WALK.x + (R() - 0.5) * 240, z = WALK.z - 40 + (R() - 0.5) * 170, y = height(x, z); if (y < 3.3 || y > 16 || N2.v2(x * 0.05, z * 0.05) < 0.4) continue; B.put(tufts[k % 3], NT.mat4(x, y, z, R() * TAU, 1.2 + R() * 1.2), null, 'near'); }
    for (let k = 0; k < 160; k++) { const x = WALK.x + (R() - 0.5) * 240, z = WALK.z + (R() - 0.3) * 70, y = height(x, z); if (y < 0.2 || y > 3.5) continue; const s = 0.15 + R() * 0.4; B.put(pebble, NT.mat4(x, y - s * 0.2, z, R() * TAU, s, s * 0.7, s * (0.8 + R() * 0.5)), [0.55, 0.52, 0.5], 'near'); }
    for (let k = 0; k < 10; k++) { const x = WALK.x + (R() - 0.5) * 200, z = WALK.z + 8 + R() * 22, y = height(x, z); if (y < 0.3 || y > 3) { k--; continue; } B.put(logs[k % 2], NT.mat4(x, y - 0.15, z, R() * TAU, 1), [0.62, 0.58, 0.55], 'near'); blockers.push({ x, z, r: 0.5 }); }
  }
  /* 대장이 산을 깨고 나오는 자리 — 바위 둔덕(따로 한 메시 · 깨지면 숨김) */
  const riseY = islandH(RISE.x, RISE.z);
  let riseMesh = null;
  if (!fogV && !after) {
    const parts = [];
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, d = 6 + hash(k, 3) * 14, s = 5 + hash(k, 5) * 7, g = geoOf(rocks[k % 4]).clone(); g.applyMatrix4(NT.mat4(RISE.x + Math.cos(a) * d, riseY - 2 + hash(k, 7) * 4, RISE.z + Math.sin(a) * d, a, s, s * 0.9, s)); parts.push(g); }
    const g = mergeGeometries(parts); parts.forEach((p) => p.dispose());
    const cc = g.attributes.color; for (let i = 0; i < cc.count; i++) cc.setXYZ(i, cc.getX(i) * 0.62, cc.getY(i) * 0.56, cc.getZ(i) * 0.52);
    riseMesh = new THREE.Mesh(g, toon({ vc: true })); riseMesh.matrixAutoUpdate = false; group.add(riseMesh);
  }
  /* 무너진 바위 조각(대장이 나올 때 · 인스턴스 24) */
  const CHUNKS = 24, chunkM = new THREE.InstancedMesh(geoOf(rocks[1]), toon({ vc: true }), CHUNKS); chunkM.frustumCulled = false; chunkM.count = 0; group.add(chunkM);
  const chunkS = new Float32Array(CHUNKS * 8);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler();

  /* ── 바다 돌기둥(비행 원기둥) ── */
  const pillars = [], SM = new NT.Mesher();
  for (let k = 0, tries = 0; k < (fogV ? 16 : 13) && tries < 600; tries++) {
    const a = R() * TAU, d = (fogV ? 290 : 285) + R() * (fogV ? 420 : 120), x = IC.x + Math.cos(a) * d, z = IC.z + Math.sin(a) * d, r = 8 + R() * 9, top = 34 + R() * 60;
    if (pillars.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + r + 34)) continue;
    if (fogV && Math.abs(x) < 26 && z > 260) continue;                                  // 불빛 길 위는 비움(옆으로 비켜서)
    stack(SM, x, z, r, top, k * 1.7 + 0.3); pillars.push({ x: +x.toFixed(1), z: +z.toFixed(1), r: +(r * 1.05).toFixed(2), top: +top.toFixed(1) }); k++;
  }
  { const g = geoOf(SM.done()); g.computeBoundingSphere(); const m = new THREE.Mesh(g, toon({ vc: true })); m.matrixAutoUpdate = false; group.add(m); }
  B.build(group, 190);
  await NT.breathe();

  /* ── 배: 불난 배 셋 + 가라앉는 배 하나(정점색 한 덩어리 · 두 면) ── */
  const shipList = [], shipParts = [];
  const shipAt = (sx, sz, yaw, burnt, torn, sink, seed) => {
    const M = new NT.Mesher(); shipMesher(M, burnt, seed, torn); const g = geoOf(M.done());
    _e.set(sink * 0.18, yaw, sink * 0.35); _q.setFromEuler(_e); _p.set(sx, -0.6 - sink * 2.2, sz); _s.set(1, 1, 1); g.applyMatrix4(_m.compose(_p, _q, _s)); shipParts.push(g);
  };
  if (!fogV) {
    SHIPS.forEach(([x, z, yaw], i) => { shipAt(x, z, yaw, after ? 1 : 0.55, after ? 0.8 : 0.35, 0, i * 5 + 1); shipList.push({ x, y: 0, z, yaw, burning: !after }); });
    if (!after) WRECK.forEach(([x, z, yaw], i) => shipAt(x, z, yaw, 0.35, 0.2, 1, 40 + i));
    const g = mergeGeometries(shipParts); shipParts.forEach((p) => p.dispose());
    const m = new THREE.Mesh(g, toon({ vc: true, side: THREE.DoubleSide })); m.matrixAutoUpdate = false; group.add(m);
    for (const s of shipList) blockers.push({ x: s.x - Math.sin(s.yaw) * 6, z: s.z - 11 - Math.cos(s.yaw) * 6, r: 2.4 });
  }
  /* 불 · 빛 판(불난 배 · 산 김) — 불꽃 셰이더 하나 · Light X */
  const flames = [], glows = [];
  if (!fogV && !after) for (const s of shipList) {
    for (let k = 0; k < 4; k++) { const f = flameMesh(2.6 + hash(k, s.x | 0) * 2.4), zz = (k - 1.5) * 4.2, xx = (hash(k, 9, s.z | 0) - 0.5) * 2.4; f.position.set(s.x + Math.cos(s.yaw) * xx + Math.sin(s.yaw) * zz, 1.6, s.z - Math.sin(s.yaw) * xx + Math.cos(s.yaw) * zz); group.add(f); flames.push(f); }
    const gl = glowSprite(0xff8a3a, 26, 0.5); gl.position.set(s.x, 5, s.z); group.add(gl); glows.push(gl);
  }
  /* 연기 기둥(배 · 분화구) + 불티 — 위로 오르는 판(정점 셰이더) · 상승 기류의 보이는 짝 */
  const smokeList = [], emberList = [];
  const cols = [];
  if (!fogV) { for (const s of shipList) cols.push([s.x, 3, s.z, after ? 0.9 : 1.3]); cols.push([MT.x, RIM - 6, MT.z, 3.4]); if (after) { cols.push([STAND.x - 20, 6, STAND.z - 10, 2.2]); cols.push([STAND.x + 30, 4, STAND.z + 5, 1.8]); } }
  cols.forEach(([x, y, z, k], ci) => {
    const n = Math.round(20 * Math.min(k, 2.2)); for (let i = 0; i < n; i++) smokeList.push([x + (hash(ci, i) - 0.5) * 4 * k, y, z + (hash(ci, i, 2) - 0.5) * 4 * k, i / n, 13 * k, 0.04 / Math.sqrt(k), 60 * k, 1]);
    if (!after && k < 3) for (let i = 0; i < 14; i++) emberList.push([x + (hash(ci, i, 5) - 0.5) * 6, y, z + (hash(ci, i, 6) - 0.5) * 6, i / 14, 0.6, 0.18, 55, 1]);
  });
  /* ⑥ 연기 — 떨어진 자리 둘레 낮게 깔린 연기(하늘이 맑아지면 걷힘) */
  let groundSmoke = null;
  if (after) { const L = []; for (let k = 0; k < 46; k++) { const a = hash(k, 1) * TAU, d = 6 + hash(k, 2) * 46, x = 18 + Math.cos(a) * d, z = 150 + Math.sin(a) * d; L.push([x, height(x, z) + 2 + hash(k, 3) * 5, z, hash(k, 4), 12 + hash(k, 5) * 12, 0, 0, 1]); } groundSmoke = puffs(group, L, { c0: 0x4a4542, c1: 0x7c7672, op: 0.62, wx: 0, wz: 0, order: 958 }); }
  const smoke = smokeList.length ? puffs(group, smokeList, { c0: after ? 0x4a4644 : 0x2e2a29, c1: after ? 0x8a8682 : 0x6a625c, op: after ? 0.75 : 0.85, rise: true, wx: 3, wz: 1.5 }) : null;
  const embers = emberList.length ? puffs(group, emberList, { c0: 0xffb060, c1: 0xff6a20, op: 0.9, rise: true, add: true, wx: 1, wz: 0.4, order: 965 }) : null;

  /* ── 구름(숨는 곳 · 대장전) — 구 목록 하나로 그림과 '숨었나' 판정을 같이(design §12) ── */
  const clouds = [], cloudPuffs = [];
  if (!fogV && !after) {
    for (let k = 0, tries = 0; k < 13 && tries < 400; tries++) {
      const a = R() * TAU, d = 90 + R() * 260, x = IC.x + Math.cos(a) * d, z = IC.z + Math.sin(a) * d, y = 72 + R() * 70, r = 17 + R() * 11;
      if (clouds.some((c) => Math.hypot(c.x - x, c.z - z, (c.y - y) * 1.5) < c.r + r + 24)) continue;
      if (Math.hypot(x - MT.x, z - MT.z) < 70 && y < RIM + 20) continue;
      clouds.push({ x: +x.toFixed(1), y: +y.toFixed(1), z: +z.toFixed(1), r: +r.toFixed(1), burnT: 0, i: k });
      for (let q = 0; q < 7; q++) cloudPuffs.push([x + (hash(k, q) - 0.5) * r * 1.3, y + (hash(k, q, 2) - 0.5) * r * 0.5, z + (hash(k, q, 3) - 0.5) * r * 1.3, hash(k, q, 4), r * (1.3 + hash(k, q, 5) * 0.6), 0, 0, 1]);
      k++;
    }
  }
  const cloudMesh = cloudPuffs.length ? puffs(group, cloudPuffs, { c0: 0x7a706c, c1: 0xb8aea6, op: 0.92, wx: 0, wz: 0, order: 900 }) : null;
  /* 먼 하늘 구름 띠(안개 위 · 둥지 하늘이 맑아지면 걷힘) */
  const hazeList = []; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + hash(k, 1), d = 520 + hash(k, 2) * 200; hazeList.push([IC.x + Math.cos(a) * d, 150 + hash(k, 3) * 110, IC.z + Math.sin(a) * d, hash(k, 4), 220 + hash(k, 5) * 160, 0, 0, 1]); }
  const haze = puffs(group, hazeList, { c0: 0x4a4240, c1: 0x7a6e68, op: 0.7, wx: 0, wz: 0, order: 905 });

  /* ── 무기 더미(어른이 내려놓은 무기 · n개만 보임 = 그리기 범위) ── */
  let pileMesh = null, pileIdx = [];
  if (!fogV) {
    const M = new NT.Mesher(), py = islandH(PILE.x, PILE.z), STEEL = C3(0x8a8c8e), GRIP = C3(0x5a3e28);
    for (let k = 0; k < 16; k++) {
      const a = hash(k, 1) * TAU, d = Math.sqrt(k / 16) * 2.6, x = PILE.x + Math.cos(a) * d, z = PILE.z + Math.sin(a) * d, y = py + 0.15 + (1 - d / 2.8) * 0.9 * (k / 16), yaw = hash(k, 2) * TAU, kind = k % 4;
      const c = Math.cos(yaw), s = Math.sin(yaw), P2 = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
      if (kind === 0 || kind === 2) { const p0 = P2(-1.1, 0.05, 0), p1 = P2(1.1, 0.25, 0); NT.tube(M, [[...p0, 0.06, GRIP], [...p1, 0.05, GRIP]], 5); const hd = P2(1.0, 0.3, 0.25); NT.blob(M, hd[0], hd[1], hd[2], 0.28, 0.1, 0.35, 0, null, () => STEEL); }
      else if (kind === 1) { NT.lathe(M, [[0.05, 0.16], [0.75, 0.1], [0.8, -0.02], [0.05, -0.05]], 10, (q) => [1, 0, q === 1 ? C3(k % 8 < 4 ? 0x8a5a2e : 0x6e3a2a) : STEEL], 0, x, z); for (let q = M.n - 40; q < M.n; q++) M.p[q * 3 + 1] += y; }
      else { const p0 = P2(-0.9, 0.05, 0), p1 = P2(0.9, 0.12, 0); NT.tube(M, [[...p0, 0.05, GRIP], [...P2(-0.5, 0.07, 0), 0.04, STEEL], [...p1, 0.02, STEEL]], 4); }
      pileIdx.push(M.i.length);
    }
    const g = geoOf(M.done()); pileMesh = new THREE.Mesh(g, toon({ vc: true })); pileMesh.matrixAutoUpdate = false; g.setDrawRange(0, 0); group.add(pileMesh);
  }

  /* ── 안개 바다(①) — 앞배가 남긴 물 위 불빛 띠: 구불구불 길 위 떠다니는 불(판자 + 작은 불) · 안개 밖은 숨김 ── */
  const lights = [];
  let trail = null;
  if (fogV) {
    const ctrl = [[0, 1010], [-40, 930], [-70, 840], [-30, 760], [45, 690], [70, 610], [30, 530], [-35, 460], [-50, 390], [-10, 320], [0, 262]];
    trail = NT.spline(ctrl, 4);
    const pts = NT.resample(trail, 24);
    const plank = new NT.Mesher(); NT.lathe(plank, [[0.05, 0.25], [1.0, 0.2], [1.1, 0.0], [0.05, -0.1]], 7, (k) => [1, 0, k < 2 ? WOOD : WOODD]);
    const pg = geoOf(plank.done());
    const planks = new THREE.InstancedMesh(pg, toon({ vc: true }), pts.length); planks.frustumCulled = false; group.add(planks);
    pts.forEach(([x, z], i) => {
      const ox = (hash(i, 3) - 0.5) * 6, oz = (hash(i, 4) - 0.5) * 6;
      planks.setMatrixAt(i, _m.compose(_p.set(x + ox, 0.1, z + oz), _q.setFromEuler(_e.set(0, hash(i, 5) * TAU, 0)), _s.set(1.2 + hash(i, 6), 1, 0.7)));
      const f = flameMesh(1.1 + hash(i, 7) * 0.6); f.position.set(x + ox, 0.25, z + oz); group.add(f);
      const gl = glowSprite(0xffa24a, 9, 0.6); gl.position.set(x + ox, 1.2, z + oz); group.add(gl);
      lights.push({ x: +(x + ox).toFixed(2), y: 0.3, z: +(z + oz).toFixed(2), i, f, gl });
    });
    planks.instanceMatrix.needsUpdate = true;
  }

  /* ── 걷기 벽(해변 · 모래와 물 경계 · 비탈이 가팔라지는 곳) — 마칭 스퀘어 ── */
  let walls = [];
  if (!fogV) {
    const sx = 1.5, nx = 162, nz = 115, x0 = -121, z0 = 82, val = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * sx, z = z0 + j * sx, h = height(x, z); val[j * nx + i] = Math.max(0.35 - h, h - 13, Math.hypot(x - WALK.x, z - WALK.z) - WALK.r); }
    walls = NT.contourWalls(val, x0, z0, sx, nx, nz);
  }

  const A = (x, z, yaw = 0, y) => ({ x, y: y ?? height(x, z), z, yaw });
  const anchors = fogV ? {
    beach: A(BEACH.x, BEACH.z, Math.PI), fog_start: { x: trail[0][0], y: 14, z: trail[0][1], yaw: Math.PI }, fog_end: { x: trail[trail.length - 1][0], y: 14, z: trail[trail.length - 1][1], yaw: Math.PI },
    spawn_air: { x: trail[0][0], y: 14, z: trail[0][1], yaw: Math.PI },
  } : {
    beach: A(BEACH.x, BEACH.z, Math.PI), boss_rise: A(RISE.x, RISE.z, 0, riseY), boss_stand: A(STAND.x, STAND.z, 0),
    water_ship: { x: WRECK[0][0], y: 0, z: WRECK[0][1], yaw: WRECK[0][2] }, shore_ship: A(84, 214, 0.6),
    weapon_pile: A(PILE.x, PILE.z, 0), spawn_air: { x: 0, y: 70, z: 330, yaw: Math.PI }, crash: A(18, 150, 2.6), stoick_in: A(40, 182, -2.3),
  };
  const lists = fogV ? { lights: lights.map((l) => ({ x: l.x, y: l.y, z: l.z, i: l.i })) } : {
    ships: shipList.map((s) => ({ x: s.x, y: 0, z: s.z, yaw: s.yaw })), adults: ADULTS.map(([x, z]) => ({ x, y: height(x, z), z, yaw: Math.atan2(STAND.x - x, STAND.z - z) })),
    barrels: BARRELS.map(([x, z]) => ({ x, y: height(x, z), z })), clouds,
  };
  /* 물통(통 · 해변) */
  if (!fogV) {
    const M = new NT.Mesher(); for (const [x, z] of BARRELS) { const y = height(x, z); NT.lathe(M, [[0.05, 1.05], [0.48, 1.0], [0.55, 0.5], [0.48, 0.0], [0.05, -0.02]], 10, (k) => [1, 0, k === 2 ? C3(0x6a4a30) : C3(0x7a5a3a)], 0, x, z); for (let q = M.n - 50; q < M.n; q++) M.p[q * 3 + 1] += y; blockers.push({ x, z, r: 0.6 }); }
    const m = new THREE.Mesh(geoOf(M.done()), toon({ vc: true })); m.matrixAutoUpdate = false; group.add(m);
  }

  /* ── 대장전 하늘(비행 계약 §5) ── */
  const fly = { ground: flyGround, water: 0, pillars, ceil: 290, bounds: { x: SKY.x, z: SKY.z, r: SKY.r }, clouds };
  const inCloud = (x, y, z) => { for (let i = 0; i < clouds.length; i++) { const c = clouds[i]; if (c.burnT > 0) continue; if ((x - c.x) ** 2 + ((y - c.y) * 1.6) ** 2 + (z - c.z) ** 2 < c.r * c.r) return c; } return null; };

  /* 둥지 하늘이 맑아짐(⑥ · k 0 → 1) — 덮어쓸 값 하나를 다시 씀 */
  const tA = TIMES.nest, tB = TIMES.dawn, over = Object.assign({}, OVER), ca = new THREE.Color(), cb = new THREE.Color();
  const lerpHex = (a, b, k) => ca.setHex(a).lerp(cb.setHex(b), k).getHex();
  let clearK = -1;
  function setClear(k) {
    k = clamp(k, 0, 1); if (Math.abs(k - clearK) < 0.02) return; clearK = k;
    for (const key of ['top', 'mid', 'bot', 'fog', 'fogSun', 'sun', 'hs', 'hg', 'seaD', 'seaS']) over[key] = lerpHex(tA[key], tB[key], k);
    over.sunI = 1.3 + (tB.sunI - 1.3) * k; over.low = 0.2 - 0.1 * k; over.far = 260 + 1000 * k; over.near = 14 + 120 * k;
    setTime(env, 'nest', over); env.time = 'nest';
    haze.material.uniforms.op.value = 0.7 * (1 - k);
    if (smoke) smoke.material.uniforms.op.value = 0.75 * (1 - k * 0.6);
    if (groundSmoke) groundSmoke.material.uniforms.op.value = 0.62 * (1 - k * 0.85);
  }
  if (after) setClear(0);

  /* 대장이 나옴 — 둔덕 숨김 + 조각이 굴러 떨어짐(4초) */
  let breakT = -1;
  function breakRise() {
    if (!riseMesh || breakT >= 0) return; riseMesh.visible = false; breakT = 0; chunkM.count = CHUNKS;
    for (let i = 0; i < CHUNKS; i++) { const a = i / CHUNKS * TAU + hash(i, 1), o = i * 8; chunkS[o] = RISE.x + Math.cos(a) * 8; chunkS[o + 1] = riseY + 4 + hash(i, 2) * 10; chunkS[o + 2] = RISE.z + Math.sin(a) * 8; chunkS[o + 3] = Math.cos(a) * (6 + hash(i, 3) * 10); chunkS[o + 4] = 8 + hash(i, 4) * 12; chunkS[o + 5] = Math.sin(a) * (6 + hash(i, 3) * 10) + 6; chunkS[o + 6] = 1.4 + hash(i, 5) * 3; chunkS[o + 7] = hash(i, 6) * TAU; }
  }
  function chunkStep(dt) {
    if (breakT < 0 || breakT > 6) return; breakT += dt;
    for (let i = 0; i < CHUNKS; i++) {
      const o = i * 8; chunkS[o + 4] -= 22 * dt; chunkS[o] += chunkS[o + 3] * dt; chunkS[o + 1] += chunkS[o + 4] * dt; chunkS[o + 2] += chunkS[o + 5] * dt;
      const gy = G2.at(chunkS[o], chunkS[o + 2]) + chunkS[o + 6] * 0.5; if (chunkS[o + 1] < gy) { chunkS[o + 1] = gy; chunkS[o + 4] *= -0.25; chunkS[o + 3] *= 0.6; chunkS[o + 5] *= 0.6; }
      chunkS[o + 7] += dt * 2;
      chunkM.setMatrixAt(i, _m.compose(_p.set(chunkS[o], chunkS[o + 1], chunkS[o + 2]), _q.setFromEuler(_e.set(chunkS[o + 7], chunkS[o + 7] * 0.7, 0)), _s.setScalar(chunkS[o + 6])));
    }
    chunkM.instanceMatrix.needsUpdate = true;
  }
  /* 불 끄기·켜기(배 i · 물통 물 = 김 · 끝나면 꺼짐) */
  function shipFire(i, on) { for (let k = 0; k < 4; k++) { const f = flames[i * 4 + k]; if (f) f.visible = on; } if (glows[i]) glows[i].visible = on; }
  /* 구름이 탐(불이 지나감) — 12초 뒤 다시 모임 */
  function burnCloud(c) { if (!c || c.burnT > 0) return; c.burnT = 12; for (let q = 0; q < 7; q++) cloudMesh.setOn(c.i * 7 + q, 0); }
  let tNow = 0, lastLit = -1;
  const place = {
    name: 'nest', variant,
    height, blockers, walls, bound: fogV ? { x: 0, z: 600, r: 600 } : { x: WALK.x, z: WALK.z, r: WALK.r },
    anchors, lists, fly, inCloud, burnCloud, breakRise, shipFire, setClear, islandH: flyGround,
    trail, sky: SKY, mountain: { x: MT.x, z: MT.z, rim: RIM, rc: RC },
    pile(n) { if (pileMesh) pileMesh.geometry.setDrawRange(0, n <= 0 ? 0 : pileIdx[Math.min(n, pileIdx.length) - 1]); },
    stats: { pillars: pillars.length, clouds: clouds.length, lights: lights.length },
    step(dt, t) {
      tNow = t; chunkStep(dt);
      for (let i = 0; i < clouds.length; i++) { const c = clouds[i]; if (c.burnT > 0) { c.burnT -= dt; if (c.burnT <= 0) for (let q = 0; q < 7; q++) cloudMesh.setOn(c.i * 7 + q, 1); } }
      if (fogV) {                                                     // 안개 밖 불빛은 숨김(불꽃 셰이더는 안개를 안 먹음) — 2Hz
        const k = Math.floor(t * 2); if (k !== lastLit) { lastLit = k; const cx = camera.position.x, cz = camera.position.z; for (const l of lights) { const vis = Math.hypot(l.x - cx, l.z - cz) < 82; l.f.visible = vis; l.gl.visible = vis; } }
      }
    },
    draw() {},
    dispose() {},
    benchPath(tt) {
      if (fogV) { const s = Math.min(trail.length - 1, Math.floor(tt / 60 * trail.length)), p = trail[s], q = trail[Math.min(trail.length - 1, s + 6)]; camera.position.set(p[0], 14, p[1]); camera.lookAt(q[0], 6, q[1]); return; }
      const a = tt / 60 * TAU * 0.9 + 1.2, rr = 150 + Math.sin(tt * 0.2) * 90;
      camera.position.set(BEACH.x + Math.sin(a) * rr * 0.6, 26 + Math.sin(tt * 0.31) * 18 + (tt > 30 ? 40 : 0), BEACH.z - 60 + Math.cos(a) * rr);
      camera.lookAt(STAND.x, 30, STAND.z - 40);
    },
  };
  return place;
}

/* ════════ 물속 작은 무대(10장 ③) — 바다 판 없이 · 밝은 물빛(어두워지지 않음) · 빛 줄기 · 거품 · 가라앉은 배 · 사슬 셋 ════════ */
async function buildUnder(ctx) {
  const { group, env, camera } = ctx;
  const N = createNoise(19);
  setTime(env, 'day', { top: 0x6cc4cc, mid: 0x7fd0d0, bot: 0x5ab4bc, fog: 0x72c2c4, fogSun: 0xc8f0e8, near: 4, far: 62, sun: 0xfff6e0, sunI: 1.9, hs: 0xd8f4f0, hg: 0x5a8a7a, hI: 1.35, sunDir: [0.1, 0.9, 0.3], rim: 0.35, low: 0.0 });
  env.sea.visible = false;
  const SURF = 15;
  const bed = (x, z) => -0.2 + (N.fbm(x * 0.06 + 3, z * 0.06, 3) - 0.5) * 1.6 + Math.max(0, Math.hypot(x, z) - 26) * 0.35;
  const G = NT.createGrid(-44, -44, 1, 89, 89).fill(bed);
  const B = NT.createBuilder({ x0: -44, z0: -44, size: 44, nx: 2, nz: 2 });
  const SANDU = C3(0xd8cba0), SANDU2 = C3(0xbfb48e), WEED = C3(0x5f8a5a);
  B.ground(G, (x, y, z, i, j, c) => { const n = N.v2(x * 0.15, z * 0.15); mixc(SANDU, SANDU2, n, c); if (n > 0.7) mixc(c, WEED, (n - 0.7) * 2, c); return c; });
  const rocks = [0, 1].map((k) => NT.rockGeo(k * 5 + 2, { flat: 0.7, moss: 0.6 }));
  const blockers = [];
  for (let k = 0; k < 14; k++) { const a = hash(k, 1) * TAU, d = 12 + hash(k, 2) * 22, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.8 + hash(k, 3) * 2.2; B.put(rocks[k % 2], NT.mat4(x, bed(x, z) - 0.2, z, a, s, s * 0.8, s), [0.85, 1.0, 0.95], 'near'); if (d < 26 && s > 1.1) blockers.push({ x, z, r: s * 0.8 }); }
  /* 해초 줄기(굽은 대롱) */
  const W = new NT.Mesher();
  for (let k = 0; k < 26; k++) { const a = hash(k, 7) * TAU, d = 9 + hash(k, 8) * 24, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 2 + hash(k, 9) * 4, pts = []; for (let q = 0; q <= 5; q++) { const f = q / 5; pts.push([x + Math.sin(f * 3 + k) * 0.4, bed(x, z) + f * h, z + Math.cos(f * 2.5 + k) * 0.3, 0.12 * (1 - f * 0.7), mixc(WEED, C3(0x8ab070), f)]); } NT.tube(W, pts, 4); }
  B.put(W.done(), new THREE.Matrix4(), null, 'near');
  B.build(group, 999);
  /* 가라앉은 배(기울어 모래에 박힘) */
  const M = new NT.Mesher(); shipMesher(M, 0.3, 77, 0.2);
  const sg = geoOf(M.done()), mm = new THREE.Matrix4().compose(new THREE.Vector3(-3, 1.1, 2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, 0.5, 0.42)), new THREE.Vector3(1, 1, 1)); sg.applyMatrix4(mm);
  const ship = new THREE.Mesh(sg, toon({ vc: true, side: THREE.DoubleSide })); ship.matrixAutoUpdate = false; group.add(ship);
  blockers.push({ x: -3, z: 2, r: 3.2 }, { x: -3 + Math.sin(0.5) * 7, z: 2 + Math.cos(0.5) * 7, r: 2.6 }, { x: -3 - Math.sin(0.5) * 7, z: 2 - Math.cos(0.5) * 7, r: 2.6 });
  /* 사슬 셋 — 갑판 고리에서 각자 끝으로(투슬리스 목 고리 · 닻 · 부러진 돛대) · 고리 인스턴스(그리기 1) · 끝은 장이 옮김 */
  const DECK = [[-1.4, 2.6, 0.4], [-3.4, 2.4, 4.6], [-4.4, 2.6, -2.2]];
  const ENDS = [[6.5, 1.0, 5.5], [-10.5, 0.2, 10.5], [-12, 0.4, -7]];
  const LINKS = 26, link = new THREE.TorusGeometry(0.2, 0.06, 5, 8);
  const chainM = new THREE.InstancedMesh(link, toon({ color: 0x5a5c5e }), LINKS * 3); chainM.frustumCulled = false; group.add(chainM);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _d = new THREE.Vector3(), _a = new THREE.Vector3(0, 0, 1), _r = new THREE.Quaternion(), _x = new THREE.Vector3(0, 0, 1);
  const ends = ENDS.map((e) => ({ x: e[0], y: e[1], z: e[2] }));
  function chainTo(i, x, y, z) {
    const e = ends[i]; e.x = x; e.y = y; e.z = z;
    const d = DECK[i], sag = Math.min(2.4, Math.hypot(x - d[0], z - d[2]) * 0.18);
    let px = d[0], py = d[1], pz = d[2];
    for (let k = 1; k <= LINKS; k++) {
      const f = k / LINKS, nx = d[0] + (x - d[0]) * f, ny = d[1] + (y - d[1]) * f - Math.sin(f * Math.PI) * sag, nz = d[2] + (z - d[2]) * f;
      _d.set(nx - px, ny - py, nz - pz).normalize(); _q.setFromUnitVectors(_a, _d); if (k % 2) _q.multiply(_r.setFromAxisAngle(_x, Math.PI / 2));
      chainM.setMatrixAt(i * LINKS + k - 1, _m.compose(_p.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2), _q, _s));
      px = nx; py = ny; pz = nz;
    }
    chainM.instanceMatrix.needsUpdate = true;
  }
  ends.forEach((e, i) => chainTo(i, e.x, e.y, e.z));
  /* 닻 · 부러진 돛대 끝 */
  const X = new NT.Mesher(), IRON = C3(0x55585a);
  NT.tube(X, [[ENDS[1][0], 0.2, ENDS[1][2], 0.18, IRON], [ENDS[1][0], 2.4, ENDS[1][2], 0.14, IRON]], 6); NT.tube(X, [[ENDS[1][0] - 1.4, 0.6, ENDS[1][2], 0.12, IRON], [ENDS[1][0], 0.1, ENDS[1][2], 0.16, IRON], [ENDS[1][0] + 1.4, 0.6, ENDS[1][2], 0.12, IRON]], 6);
  NT.tube(X, [[ENDS[2][0], 0.3, ENDS[2][2], 0.3, WOODD], [ENDS[2][0] + 5, 1.1, ENDS[2][2] + 3, 0.25, WOODD]], 6);
  const xm = new THREE.Mesh(geoOf(X.done()), toon({ vc: true })); xm.matrixAutoUpdate = false; group.add(xm);
  blockers.push({ x: ENDS[1][0], z: ENDS[1][2], r: 0.8 });
  /* 물낯(위에서 밝게) · 빛 줄기 · 거품 */
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(220, 220, 1, 1).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd8fbf4, transparent: true, opacity: 0.85, fog: true, side: THREE.DoubleSide, depthWrite: false })); surf.position.y = SURF; group.add(surf);
  const rays = [];
  for (let k = 0; k < 9; k++) { const a = hash(k, 2) * TAU, d = 4 + hash(k, 3) * 20; rays.push([Math.cos(a) * d, SURF * 0.55, Math.sin(a) * d, hash(k, 4), 7 + hash(k, 5) * 5, 0, 0, 1]); }
  puffs(group, rays, { c0: 0xffffff, c1: 0xe8fff8, op: 0.16, add: true, wx: 0, wz: 0, order: 970, sy: 3.2 });
  const bub = []; for (let k = 0; k < 60; k++) { const a = hash(k, 5) * TAU, d = hash(k, 6) * 22; bub.push([Math.cos(a) * d, 0, Math.sin(a) * d, hash(k, 7), 0.25 + hash(k, 8) * 0.25, 0.08 + hash(k, 9) * 0.06, SURF, 1]); }
  const bubbles = puffs(group, bub, { c0: 0xffffff, c1: 0xd8fff8, op: 0.7, rise: true, wx: 0.3, wz: 0.2, order: 968 });
  const burst = []; for (let k = 0; k < 30; k++) burst.push([0, -50, 0, hash(k, 3), 0.3 + hash(k, 4) * 0.3, 0.6, 8, 0]);
  const burstM = puffs(group, burst, { c0: 0xffffff, c1: 0xe0fff8, op: 0.85, rise: true, wx: 0.2, wz: 0, order: 969 });
  const BB = burstM.geometry.attributes.aB, BS = burstM.geometry.attributes.aS; let burstT = 0;
  const anchors = {
    under_in: { x: 10, y: bed(10, -12), z: -12, yaw: -0.4 }, ring: { x: ENDS[0][0], y: ENDS[0][1], z: ENDS[0][2], yaw: 0 },
    tl: { x: 7.5, y: bed(7.5, 7), z: 7, yaw: -2.2 }, anchor: { x: ENDS[1][0], y: 0, z: ENDS[1][2], yaw: 0 }, mast: { x: ENDS[2][0], y: 0, z: ENDS[2][2], yaw: 0 },
    stoick_in: { x: 16, y: bed(16, 2), z: 2, yaw: -1.6 }, deck: { x: -3, y: 2.4, z: 2, yaw: 0 },
  };
  return {
    name: 'nest', variant: 'under', height: (x, z) => G.at(x, z), blockers, walls: [], bound: { x: 0, z: 0, r: 30 }, anchors, surface: SURF,
    lists: { chains: DECK.map((d, i) => ({ x: d[0], y: d[1], z: d[2], end: ends[i], kind: ['tl', 'anchor', 'mast'][i] })) },
    chainTo, ends,
    /* 사슬이 끊길 때 거품 한 무리 */
    bubbleBurst(x, y, z) { burstT = 1.6; for (let k = 0; k < 30; k++) { BB.setXYZW(k, x + (hash(k, 1) - 0.5) * 1.5, y, z + (hash(k, 2) - 0.5) * 1.5, (1 - (U.uTime.value * 0.6) % 1 + hash(k, 3) * 0.08) % 1); BS.setW(k, 1); } BB.needsUpdate = true; BS.needsUpdate = true; },
    step(dt) { if (burstT > 0) { burstT -= dt; if (burstT <= 0) { for (let k = 0; k < 30; k++) BS.setW(k, 0); BS.needsUpdate = true; } } }, draw() {}, dispose() {},
    benchPath(tt) { const a = tt * 0.2; camera.position.set(Math.cos(a) * 18, 5, Math.sin(a) * 18); camera.lookAt(0, 2, 0); },
  };
}

/* ════════ 분화구 안(8장 · 팀 C) — 둥근 돌벽 · 바닥 고리 · 숨을 바위 턱 · 가운데 깊은 구덩이(대장 그림자) · 빠져나갈 틈 ════════ */
async function buildCrater(ctx) {
  const { group, env, camera } = ctx, opt = ctx.opt || {};
  const N = createNoise(29), N2 = createNoise(47);
  setTime(env, TIMES[opt.time] ? opt.time : 'nest', { near: 30, far: 330, low: 0.7 });
  env.sea.visible = false;
  const RW = 56, PIT = 17, WALLH = 42, EXIT_A = 1.25, EXIT_W = 0.09;   // 돌벽 반지름 · 구덩이 · 벽 높이 · 틈 각도·반폭
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const rwall = (th) => RW * (1 + 0.06 * (N.fbm(Math.cos(th) * 1.6 + 2, Math.sin(th) * 1.6, 3) - 0.5) * 2);
  const crH = (x, z) => {
    const r = Math.hypot(x, z), th = Math.atan2(z, x), rw = rwall(th), ex = Math.abs(wrapA(th - EXIT_A)) < EXIT_W;
    if (r < PIT) return -30 + 26 * Math.pow(sstep(PIT * 0.4, PIT, r), 2.2);                      // 구덩이(깊고 어두움)
    let f = (N2.fbm(x * 0.07, z * 0.07, 3) - 0.5) * 1.6 + sstep(PIT, PIT + 6, r) * 0.6;
    if (r > rw - 3 && !ex) f += WALLH * Math.pow(sstep(rw - 3, rw + 5, r), 1.3) * (0.85 + 0.3 * N.v2(th * 5, 2));
    if (ex) f += sstep(rw, rw + 30, r) * 6;
    return f;
  };
  const G = NT.createGrid(-96, -96, 1, 193, 193).fill(crH);
  const B = NT.createBuilder({ x0: -96, z0: -96, size: 64, nx: 3, nz: 3 });
  B.ground(G, (x, y, z, i, j, c) => {
    const r = Math.hypot(x, z), n = N.v2(x * 0.1, z * 0.1);
    if (r < PIT + 1) mixc(CRATER, C3(0x1a1414), sstep(PIT, PIT * 0.5, r), c);
    else if (y > 4) { mixc(ROCK1, ROCK2, n, c); if (N2.v2(x * 0.05, y * 0.1) > 0.62) mixc(c, RUST, 0.5, c); }
    else { mixc(ASH2, CRATER, n * 0.7, c); const bone = N2.v2(x * 0.4, z * 0.4); if (bone > 0.8 && r < PIT + 10) mixc(c, C3(0xa89c88), 0.5, c); }
    return c;
  });
  /* 숨을 바위 턱(넷 이상) — 바닥 고리 위 큰 바위 · 뒤에서 구덩이를 보는 자리 */
  const rocks = [0, 1, 2].map((k) => NT.rockGeo(k * 9 + 4, { flat: 0.75, moss: 0 }));
  const ledges = [], blockers = [];
  const LEDGE_A = [2.3, 3.0, 3.9, 4.7, 5.6, 0.4];
  LEDGE_A.forEach((a, k) => {
    const d = PIT + 16 + (k % 2) * 7, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 2.6 + hash(k, 3) * 1.4;
    B.put(rocks[k % 3], NT.mat4(x, crH(x, z) - 0.6, z, a, s * 1.4, s, s), [0.7, 0.66, 0.64], 'near');
    blockers.push({ x, z, r: s * 1.1 });
    const bx = Math.cos(a) * (d + s * 1.5 + 0.8), bz = Math.sin(a) * (d + s * 1.5 + 0.8);
    ledges.push({ x: +bx.toFixed(2), y: +crH(bx, bz).toFixed(2), z: +bz.toFixed(2), yaw: +Math.atan2(-bx, -bz).toFixed(3) });
  });
  for (let k = 0; k < 30; k++) { const a = hash(k, 2) * TAU, d = PIT + 4 + hash(k, 5) * 30, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.4 + hash(k, 6) * 1.1; if (Math.abs(wrapA(a - EXIT_A)) < 0.2) continue; B.put(rocks[k % 3], NT.mat4(x, crH(x, z) - 0.2, z, a, s), [0.6, 0.56, 0.54], 'near'); }
  B.build(group, 999);
  /* 걷기 벽 — 구덩이 가장자리 · 돌벽 밑 · 틈 밖 끝 */
  const sx = 1.5, nx = 129, nz = 129, x0 = -96, z0 = -96, val = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * sx, z = z0 + j * sx, r = Math.hypot(x, z), h = crH(x, z); val[j * nx + i] = Math.max(PIT + 1.8 - r, h - 3.2, r - 92); }
  const walls = NT.contourWalls(val, x0, z0, sx, nx, nz);
  /* 구덩이 김 · 불티(아래서 오름) · 대장 그림자(모델 · 어둡게) · 콧구멍 김 */
  const steam = []; for (let k = 0; k < 22; k++) { const a = hash(k, 1) * TAU, d = hash(k, 2) * PIT * 0.8; steam.push([Math.cos(a) * d, -14, Math.sin(a) * d, k / 22, 10, 0.03, 40, 1]); }
  puffs(group, steam, { c0: 0x3a3230, c1: 0x7a6a62, op: 0.55, rise: true, wx: 0.5, wz: 0.3 });
  const nose = []; for (let k = 0; k < 16; k++) nose.push([0, -50, 0, k / 16, 2.4, 0.5, 9, 0]);
  const noseM = puffs(group, nose, { c0: 0x6a5a52, c1: 0xb0a49a, op: 0.8, rise: true, wx: 0, wz: 0.5 });
  const glow = glowSprite(0xff7a30, 40, 0.35); glow.position.set(0, -10, 0); group.add(glow);
  const BOSS = { x: 0, y: -20, z: -14, yaw: 0 };
  let boss = null, bossRig = null, head = null; const hp = new THREE.Vector3();
  try {
    const { root, bones } = await loadModel('assets/models/boss.glb?v=15');
    root.position.set(BOSS.x, BOSS.y, BOSS.z); root.rotation.y = BOSS.yaw; root.scale.setScalar(0.62);
    const dark = toon({ vc: true, color: 0x6a5e5a });
    root.traverse((o) => { if (o.isMesh && o.userData.mat === 'drg_body') o.material = dark; });
    group.add(root); boss = root; head = bones.head;
    const { createDragonRig } = await import('../look/dragon_rig.js?v=15'); bossRig = createDragonRig(bones, root, 'boss'); bossRig.fold = 1; bossRig.headUp = 0.4; bossRig.update(0.016);
  } catch (e) { /* 모델이 없으면 김·빛만 */ }
  const NB = noseM.geometry.attributes.aB, NS = noseM.geometry.attributes.aS;
  let sign = 0, signShown = -1;
  const ex = Math.cos(EXIT_A) * (RW + 11), ez = Math.sin(EXIT_A) * (RW + 11);
  const li = LEDGE_A[0], lx = Math.cos(li) * (RW - 8), lz = Math.sin(li) * (RW - 8);
  const anchors = {
    ledge_in: { x: +lx.toFixed(2), y: crH(lx, lz), z: +lz.toFixed(2), yaw: Math.atan2(-lx, -lz) },
    exit: { x: +ex.toFixed(2), y: crH(ex, ez), z: +ez.toFixed(2), yaw: EXIT_A + Math.PI / 2 },
    pit: { x: 0, y: -20, z: 0, yaw: 0 }, drop: { x: 0, y: 24, z: 0, yaw: 0 }, center: { x: 0, y: 0, z: 0, yaw: 0 },
  };
  const place = {
    name: 'nest', variant: 'crater', height: (x, z) => G.at(x, z), blockers, walls, bound: { x: 0, z: 0, r: 92 }, anchors,
    lists: { ledges, boss: [{ x: BOSS.x, y: BOSS.y, z: BOSS.z, yaw: BOSS.yaw }] },
    fly: { ground: (x, z) => G.at(x, z), pillars: [], ceil: 170, bounds: { x: 0, z: 0, r: 150 } },
    /* 콧구멍 벌름(대장이 냄새를 찾음 · 소리 짝 신호) — k 0~1 · 김이 뿜어지고 머리가 조금 듦 · 눈빛 */
    bossSign(k) { sign = clamp(k, 0, 1); },
    step(dt, t) {
      if (bossRig) { bossRig.sniff = sign; bossRig.headUp = 0.3 + sign * 0.35; bossRig.jaw = 0.05 + sign * 0.12; bossRig.update(dt); }
      const on = sign > 0.3 ? 1 : 0;
      if (on !== signShown && head) {
        signShown = on; head.getWorldPosition(hp);
        for (let k = 0; k < 16; k++) { NB.setXYZW(k, hp.x + (k % 2 ? 1.6 : -1.6), hp.y + 1, hp.z + 4, k / 16); NS.setW(k, on); }
        NB.needsUpdate = true; NS.needsUpdate = true;
      }
      glow.material.opacity = 0.3 + 0.05 * Math.sin(t * 0.8);
    },
    draw() {}, dispose() {},
    benchPath(tt) { const a = tt * 0.15; camera.position.set(Math.cos(a) * 44, 14, Math.sin(a) * 44); camera.lookAt(0, -6, 0); },
  };
  return place;
}
