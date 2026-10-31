// 구름(8장 · design §12 '구 목록 하나로 그림과 숨었나 판정') — 구름 바다(위·아래 두 겹 · 카메라 둘레 고리 격자 · 정점에서 높이) + 구름 탑(구 목록 = 인스턴스 하나)
// 그림과 판정이 같은 값: 구름 바다 높이는 deckTop/deckBot(JS)과 셰이더 dH(GLSL)가 같은 식 · 구름 탑은 같은 구 목록(spheres)으로 그리고 '숨었나'를 봄
// 결 = kit toon(3단 톤 + 가장자리 빛 + 높이 안개)을 그대로 이어 씀(셰이더 변형 = 이름 열쇠 하나씩) · 반투명 0겹(속이 찬 구름) · 빛 추가 X
// 구름 속(카메라가 구 안 · 구름 바다 안)에서는 판 대신 안개 색·거리만 바꿈(화면이 하얗게 덮임) · 매 걸음 new X
import * as THREE from 'three';
import { toon, RAMP } from './kit.js?v=15';

/* 구름 바다 높이 — 위 겹 밑동 TOP0 · 아래 겹 BOT0(아래로 볼록) · 사이가 구름 속 */
export const DECK = { top: 212, bot: 198 };
const S = Math.sin, A = Math.abs;
/* 몽글몽글한 높이(0~약 21m) — 비틀린 좌표 위에 크기 셋의 둥근 봉우리(|sin|·|sin| = 둥근 머리 · 골은 접힘) · GLSL dH와 한 글자씩 같음 */
export function deckH(x, z) {
  const qx = x + 22 * S(z * 0.0083 + 1.7), qz = z + 22 * S(x * 0.0071 + 0.3);
  const m = 0.6 + 0.4 * S(x * 0.0029 + 0.8) * S(z * 0.0023 + 2.1);
  const ax = (qx * 0.84 + qz * 0.54) * 0.034, ay = (-qx * 0.54 + qz * 0.84) * 0.034;
  const bx = (qx * 0.31 - qz * 0.95) * 0.077, by = (qx * 0.95 + qz * 0.31) * 0.077;
  const cx = (-qx * 0.62 + qz * 0.78) * 0.163, cy = (-qx * 0.78 - qz * 0.62) * 0.163;
  return (11 * A(S(ax)) * A(S(ay)) + 5.5 * A(S(bx) * S(by)) + 2.4 * A(S(cx) * S(cy))) * m;
}
export const deckTop = (x, z) => DECK.top + deckH(x, z);
export const deckBot = (x, z) => DECK.bot - 0.5 * deckH(x * 1.27 + 431, z * 1.27 - 217);
const GLSL_H = `
float dH(vec2 p, float fb, float fc) {
  vec2 q = p + 22.0 * vec2(sin(p.y * 0.0083 + 1.7), sin(p.x * 0.0071 + 0.3));
  float m = 0.6 + 0.4 * sin(p.x * 0.0029 + 0.8) * sin(p.y * 0.0023 + 2.1);
  vec2 a = vec2(q.x * 0.84 + q.y * 0.54, -q.x * 0.54 + q.y * 0.84) * 0.034;
  vec2 b = vec2(q.x * 0.31 - q.y * 0.95, q.x * 0.95 + q.y * 0.31) * 0.077;
  vec2 c = vec2(-q.x * 0.62 + q.y * 0.78, -q.x * 0.78 - q.y * 0.62) * 0.163;
  return (11.0 * abs(sin(a.x)) * abs(sin(a.y)) + 5.5 * fb * abs(sin(b.x) * sin(b.y)) + 2.4 * fc * abs(sin(c.x) * sin(c.y))) * m;
}`;

/* kit toon 재질을 이어 받아 변형을 하나 더함 — 열쇠 = toon 열쇠 + 이름(같은 변형 = 셰이더 하나) */
export function chainToon(o, name, mod) {
  const base = toon(o);
  const m = new THREE.MeshToonMaterial({ color: o.color ?? 0xffffff, gradientMap: RAMP, vertexColors: !!o.vc, side: o.side ?? THREE.FrontSide });
  m.onBeforeCompile = (sh, r) => { base.onBeforeCompile(sh, r); mod(sh); };
  const k = base.customProgramCacheKey() + '|' + name;
  m.customProgramCacheKey = () => k;
  return m;
}

/* 카메라 둘레 고리 격자(가까울수록 촘촘) — flip = 아래를 보는 면(아래 겹) */
function ringGrid(R, r0, k, seg, flip) {
  const rs = [0]; for (let r = r0; r < R; r *= k) rs.push(r); rs.push(R);
  const pos = new Float32Array(rs.length * seg * 3), idx = [];
  for (let i = 0; i < rs.length; i++) for (let j = 0; j < seg; j++) { const a = j / seg * Math.PI * 2, o = (i * seg + j) * 3; pos[o] = Math.cos(a) * rs[i]; pos[o + 2] = Math.sin(a) * rs[i]; }
  for (let i = 0; i < rs.length - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + (j + 1) % seg, c = (i + 1) * seg + j, d = (i + 1) * seg + (j + 1) % seg;
    if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(pos.length), 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R); return g;
}

/* 구름 탑 한 덩이 모양 — 구에 큰 혹·작은 혹(정점 바깥으로) · 매끈한 법선 */
function puffGeo() {
  const g = new THREE.SphereGeometry(1, 13, 9), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.07 * S(x * 4.1 + 1.3) * S(y * 3.7 + 0.4) * S(z * 4.3 + 2.2) + 0.03 * S(x * 9.3 + y * 7.1) * S(z * 8.7 - y * 5.3) - (y < -0.3 ? (-0.3 - y) * 0.55 : 0);   // 밑은 조금 납작
    p.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals(); return g;
}

/* 색 — 때마다(노을·밤) 바꿈: 위(빛 받는 봉우리) · 골(그늘) · 밑면 · 오로라 물듦 */
export const CLOUD_COL = {
  sunset: { top: 0xfff2ea, valley: 0xcdb6d2, under: 0xf2b8a2, lift: 0.3 },
  dusk:   { top: 0xdccbdc, valley: 0x9488ae, under: 0x7a6688, lift: 0.26 },
  night:  { top: 0xb4c0da, valley: 0x606c90, under: 0x3a405a, lift: 0.22 },
};

/*
  createClouds({ group, spheres }) → CL
  spheres = [{ x, y, z, r }] 구름 탑 덩이(그림 = 판정)
  CL.hidden(x, y, z) → 'deck' | 'puff' | ''   ·   CL.depth(x, y, z) → 구름 속 깊이(m · 밖이면 음수)
  CL.setColors(a, b, k) 두 때 색 사이 · CL.follow(camera) 걸음마다(카메라 따라 격자 · 보이기) · CL.fog(scene, env) 구름 속이면 안개 색·거리·하늘
*/
export function createClouds({ group, spheres = [] }) {
  const uni = { uTop: { value: new THREE.Color() }, uValley: { value: new THREE.Color() }, uUnder: { value: new THREE.Color() }, uAur: { value: 0 }, uAurCol: { value: new THREE.Color(0x8fd0a8) }, uLift: { value: 0.3 } };
  /* 구름 바다 — 위 겹(위를 봄) · 아래 겹(아래를 봄) */
  const deckMat = (bottom) => chainToon({ color: 0xffffff }, bottom ? 'deckB1' : 'deckT1', (sh) => {
    Object.assign(sh.uniforms, uni, { uBase: { value: bottom ? DECK.bot : DECK.top } });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uBase; varying float vDeckH;' + GLSL_H)
      .replace('#include <beginnormal_vertex>', `
  vec2 wp = (modelMatrix * vec4(position, 1.0)).xz;
  float dc = length(wp - cameraPosition.xz), fb = 1.0 - smoothstep(300.0, 520.0, dc), fc = 1.0 - smoothstep(120.0, 230.0, dc);   /* 짧은 혹은 가까이서만(격자보다 짧으면 흔들림) */
  ${bottom ? 'vec2 wq = wp * 1.27 + vec2(431.0, -217.0); float hk = -0.5;' : 'vec2 wq = wp; float hk = 1.0;'}
  float h0 = dH(wq, fb, fc), e = 1.6;
  float hx = (dH(wq + vec2(e, 0.0), fb, fc) - dH(wq - vec2(e, 0.0), fb, fc)) * hk, hz = (dH(wq + vec2(0.0, e), fb, fc) - dH(wq - vec2(0.0, e), fb, fc)) * hk;
  vec3 objectNormal = normalize(vec3(-hx, 2.0 * e, -hz)) * ${bottom ? '-1.0' : '1.0'};
  vDeckH = h0;`)
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.x, h0 * hk, position.z);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uTop; uniform vec3 uValley; uniform vec3 uUnder; uniform float uAur; uniform vec3 uAurCol; uniform float uLift; varying float vDeckH;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * uLift * ' + (bottom ? '1.5;' : '1.0;'))
      .replace('#include <color_fragment>', bottom
        ? '#include <color_fragment>\n  diffuseColor.rgb *= mix(uUnder, uValley, smoothstep(0.0, 9.0, vDeckH) * 0.5);'
        : '#include <color_fragment>\n  { float t = smoothstep(1.0, 17.0, vDeckH); diffuseColor.rgb *= mix(uValley, uTop, t); diffuseColor.rgb = mix(diffuseColor.rgb, uAurCol, uAur * 0.22 * t); }');
  });
  const geo = ringGrid(2600, 3, 1.055, 96, false), geoB = ringGrid(2600, 3, 1.055, 96, true);
  const top = new THREE.Mesh(geo, deckMat(false)), bot = new THREE.Mesh(geoB, deckMat(true));
  top.position.y = DECK.top; bot.position.y = DECK.bot; top.frustumCulled = bot.frustumCulled = false;
  group.add(top); group.add(bot);

  /* 구름 탑 — 구 목록 = 인스턴스 · 아래는 골 색 · 위는 빛 받는 색 */
  const puffMat = chainToon({ color: 0xffffff }, 'puff1', (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vPy;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vPy = position.y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uTop; uniform vec3 uValley; uniform float uAur; uniform vec3 uAurCol; uniform float uLift; varying float vPy;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * uLift;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  { float t = smoothstep(-0.75, 0.55, vPy); diffuseColor.rgb *= mix(uValley, uTop, t); diffuseColor.rgb = mix(diffuseColor.rgb, uAurCol, uAur * 0.22 * t); }');
  });
  const NP = Math.max(1, spheres.length);
  const puffs = new THREE.InstancedMesh(puffGeo(), puffMat, NP);
  const mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), ss = new THREE.Vector3(), ee = new THREE.Euler();
  spheres.forEach((s, i) => { ee.set(0, (i * 2.399) % 6.283, 0); qq.setFromEuler(ee); pp.set(s.x, s.y, s.z); ss.set(s.r, s.r * (s.sy || 0.86), s.r); puffs.setMatrixAt(i, mm.compose(pp, qq, ss)); });
  puffs.count = spheres.length; puffs.computeBoundingSphere(); group.add(puffs);
  /* 판정용 구 — 8m 격자(걸음마다 둘레만) */
  const CELL = 48, grid = new Map(), gk = (i, j) => (i + 4096) * 8192 + (j + 4096);
  spheres.forEach((s, k) => { for (let i = Math.floor((s.x - s.r) / CELL); i <= Math.floor((s.x + s.r) / CELL); i++) for (let j = Math.floor((s.z - s.r) / CELL); j <= Math.floor((s.z + s.r) / CELL); j++) { const h = gk(i, j); let a = grid.get(h); if (!a) grid.set(h, a = []); a.push(k); } });

  const CL = { group, top, bot, puffs, spheres, uni, on: true, camDepth: -99 };
  /* 구름 탑 속 깊이(m) — 가장 깊은 구 · 밖이면 음수(가장 가까운 겉면까지) */
  CL.puffDepth = (x, y, z) => {
    const a = grid.get(gk(Math.floor(x / CELL), Math.floor(z / CELL))); if (!a) return -99;
    let best = -99;
    for (let q = 0; q < a.length; q++) { const s = spheres[a[q]], ry = s.r * (s.sy || 0.86), dx = (x - s.x) / s.r, dy = (y - s.y) / ry, dz = (z - s.z) / s.r; const d = (1 - Math.sqrt(dx * dx + dy * dy + dz * dz)) * s.r * 0.9; if (d > best) best = d; }
    return best;
  };
  CL.deckDepth = (x, y, z) => Math.min(deckTop(x, z) - y, y - deckBot(x, z));
  CL.depth = (x, y, z) => (CL.on ? Math.max(CL.deckDepth(x, y, z), CL.puffDepth(x, y, z)) : -99);
  CL.hidden = (x, y, z) => { if (!CL.on) return ''; if (CL.puffDepth(x, y, z) > 1.5) return 'puff'; if (CL.deckDepth(x, y, z) > 1.5) return 'deck'; return ''; };

  const ca = new THREE.Color(), cb = new THREE.Color();
  CL.setColors = (a, b, k) => {
    const A0 = CLOUD_COL[a] || CLOUD_COL.sunset, B0 = CLOUD_COL[b] || A0;
    uni.uTop.value.copy(ca.setHex(A0.top)).lerp(cb.setHex(B0.top), k);
    uni.uValley.value.copy(ca.setHex(A0.valley)).lerp(cb.setHex(B0.valley), k);
    uni.uUnder.value.copy(ca.setHex(A0.under)).lerp(cb.setHex(B0.under), k);
    uni.uLift.value = A0.lift + (B0.lift - A0.lift) * k;
  };
  CL.setColors('sunset', 'sunset', 0);
  CL.show = (v) => { CL.on = v; top.visible = bot.visible = puffs.visible = v; };
  /* 걸음(그리기)마다 — 격자를 카메라에(4m 칸) · 위에 있으면 아래 겹 숨김 · 아래면 위 겹·탑 숨김 */
  CL.follow = (cam) => {
    if (!CL.on) return;
    const x = Math.round(cam.position.x / 4) * 4, z = Math.round(cam.position.z / 4) * 4, y = cam.position.y;
    top.position.x = bot.position.x = x; top.position.z = bot.position.z = z;
    bot.visible = y < DECK.top + 4; top.visible = y > DECK.bot - 14; puffs.visible = y > DECK.bot - 6;
  };
  /* 구름 속 안개 — 카메라 깊이로 안개 끝을 좁히고 색을 구름 속 색으로 · 하늘도 같은 색(빈 화소가 비치지 않게) · 장이 정한 안개(base)에서 매번 새로 셈 */
  const base = { col: new THREE.Color(), near: 0, far: 0 }, inCol = new THREE.Color(), skyT = new THREE.Color(), skyM = new THREE.Color(), skyB = new THREE.Color();
  CL.fog = (scene, env, cam, kMin = 0) => {
    const f = scene.fog; base.col.copy(f.color); base.near = f.near; base.far = f.far;
    const d = CL.on ? CL.depth(cam.position.x, cam.position.y, cam.position.z) : -99; CL.camDepth = d;
    const k = d < -5 ? 0 : Math.min(1, (d + 5) / 7);
    const kk = Math.max(kMin, k * k * (3 - 2 * k));
    if (kk <= 0) return 0;
    inCol.copy(uni.uValley.value).lerp(uni.uTop.value, 0.55);
    f.color.copy(base.col).lerp(inCol, kk);
    f.near = base.near * (1 - kk);
    f.far = base.far * Math.pow(26 / Math.max(27, base.far), kk);
    const su = env.sky.material.uniforms;
    skyT.copy(su.top.value); skyM.copy(su.mid.value); skyB.copy(su.bot.value);
    su.top.value.lerp(inCol, kk); su.mid.value.lerp(inCol, kk); su.bot.value.lerp(inCol, kk);
    CL._sky = [skyT, skyM, skyB];
    return kk;
  };
  /* 하늘 색 되돌리기(장이 안개를 다시 정하지 않는 걸음에서) */
  CL.unfog = (env) => { if (!CL._sky) return; const su = env.sky.material.uniforms; su.top.value.copy(CL._sky[0]); su.mid.value.copy(CL._sky[1]); su.bot.value.copy(CL._sky[2]); CL._sky = null; };
  CL.dispose = () => { top.removeFromParent(); bot.removeFromParent(); puffs.removeFromParent(); geo.dispose(); geoB.dispose(); puffs.geometry.dispose(); puffs.dispose(); top.material.dispose(); bot.material.dispose(); puffMat.dispose(); };
  return CL;
}

/* 구름 탑 쌓기 도우미 — 밑동(구름 바다 위)에서 위로 줄어드는 덩이 n개 · 옆으로 조금씩 흔들림(씨앗 난수) */
export function towerSpheres(out, x, z, h, r0, rng) {
  const y0 = deckTop(x, z) - r0 * 0.3, lv = Math.max(3, Math.round(h / (r0 * 0.7)));
  for (let i = 0; i < lv; i++) {
    const t = i / (lv - 1), r = r0 * (1.2 - 0.6 * t) * (0.86 + rng() * 0.28);
    const lean = Math.sin(t * 2.2 + x * 0.01) * r0 * 0.35, cx = x + lean + (rng() - 0.5) * r0 * 0.55, cz = z + (rng() - 0.5) * r0 * 0.55, cy = y0 + t * h;
    out.push({ x: cx, y: cy, z: cz, r, sy: 0.9 });
    const side = i === 0 ? 3 : i < lv - 1 ? (rng() < 0.6 ? 2 : 1) : 1;           // 옆 혹(아래일수록 많이 · 꼭대기는 꽃양배추 머리)
    for (let k = 0; k < side; k++) { const a = rng() * 6.283, rk = r * (0.55 + rng() * 0.25); out.push({ x: cx + Math.cos(a) * r * 0.7, y: cy + (i === lv - 1 ? r * 0.3 : (rng() - 0.2) * r * 0.6), z: cz + Math.sin(a) * r * 0.7, r: rk, sy: 0.92 }); }
  }
  return out;
}
/* 뭉게구름 한 무더기(숨을 곳) — 가운데 큰 덩이 + 둘레 */
export function clumpSpheres(out, x, y, z, r0, rng, n = 6) {
  out.push({ x, y, z, r: r0, sy: 0.82 });
  for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rng() * 0.6, d = r0 * (0.6 + rng() * 0.35); out.push({ x: x + Math.cos(a) * d, y: y + (rng() - 0.4) * r0 * 0.5, z: z + Math.sin(a) * d, r: r0 * (0.5 + rng() * 0.25), sy: 0.85 }); }
  return out;
}
