import * as THREE from 'three';
import { createTouch } from '../../v2/js/touch.js?v=7';
import { createNet } from '../../v2/js/net.js?v=1';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const mobile = (() => { try { return matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) <= 500; } catch (e) { return false; } })();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
const DPR_MAX = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5);
let dpr = DPR_MAX;
renderer.setPixelRatio(dpr);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const SKY = 0x5a4790;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 50, 150);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.2, 300);
scene.add(new THREE.HemisphereLight(0xd8ccff, 0x4a3b2c, 1.35));
const sun = new THREE.DirectionalLight(0xffd7a0, 1.0);
sun.position.set(-40, 60, 30);
scene.add(sun);

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

// ───────── 정적 지오메트리(한 메시로 합침) ─────────
const SP = [], SN = [], SC = [];
function bake(geo, hex, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  _m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(sx, sy, sz));
  g.applyMatrix4(_m);
  const p = g.attributes.position.array, n = g.attributes.normal.array;
  _c.setHex(hex);
  for (let i = 0; i < p.length; i++) { SP.push(p[i]); SN.push(n[i]); }
  for (let i = 0; i < p.length / 3; i++) SC.push(_c.r, _c.g, _c.b);
  g.dispose(); geo.dispose();
}
const SOL = [];
const CIR = [];
function box(w, h, d, hex, x, y0, z, solid = true, ry = 0) {
  bake(new THREE.BoxGeometry(w, h, d), hex, x, y0 + h / 2, z, ry);
  if (solid) { const hw = ry ? d / 2 : w / 2, hd = ry ? w / 2 : d / 2; SOL.push({ x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, y0, y1: y0 + h }); }
}
function cyl(rt, rb, h, hex, x, y0, z, seg = 10, solid = true) {
  bake(new THREE.CylinderGeometry(rt, rb, h, seg), hex, x, y0 + h / 2, z);
  if (solid) CIR.push({ x, z, r: Math.max(rt, rb), y0, y1: y0 + h });
}
function cone(r, h, hex, x, y0, z, seg = 8, ry = 0) { bake(new THREE.ConeGeometry(r, h, seg), hex, x, y0 + h / 2, z, ry); }
function blob(r, hex, x, y, z, sy = 1) { bake(new THREE.IcosahedronGeometry(r, 0), hex, x, y, z, 0, 1, sy, 1); }

const ground = new THREE.Mesh(new THREE.CircleGeometry(95, 40), new THREE.MeshLambertMaterial({ color: 0x5f8f4e }));
ground.rotation.x = -Math.PI / 2; scene.add(ground);
for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, r = 78 + (i % 3) * 6; cone(10 + (i % 4) * 2, 24 + (i % 5) * 5, 0x4b3d7a, Math.sin(a) * r, -1, Math.cos(a) * r, 5); }

// 광장
bake(new THREE.CylinderGeometry(13, 13, 0.06, 32), 0xb7a58c, 0, 0.03, 4);
for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; bake(new THREE.BoxGeometry(1.6, 0.08, 1.6), 0xc9b79c, Math.sin(a) * 10.5, 0.05, 4 + Math.cos(a) * 10.5, a); }
const pathTo = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0); bake(new THREE.BoxGeometry(2.6, 0.05, L), 0xb7a58c, (x0 + x1) / 2, 0.025, (z0 + z1) / 2, a); };
pathTo(0, -8, 0, -31); pathTo(-9, -2, -15, -22); pathTo(8, -4, 13, -20); pathTo(-12, 5, -16, 6); pathTo(12, 5, 15, 6);

// 분수
cyl(2.6, 2.8, 0.6, 0x9b8fb8, 0, 0, 4, 16);
cyl(0.45, 0.6, 2.4, 0xb7aed0, 0, 0, 4, 8);
const fWater = new THREE.Mesh(new THREE.CircleGeometry(2.35, 20), new THREE.MeshBasicMaterial({ color: 0x7fd8ff }));
fWater.rotation.x = -Math.PI / 2; fWater.position.set(0, 0.52, 4); scene.add(fWater);
const fTop = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshBasicMaterial({ color: 0xbff0ff }));
fTop.position.set(0, 2.75, 4); scene.add(fTop);

// 지팡이 가게
box(8, 4.4, 8, 0x8a5a3c, -21, 0, 6);
cone(6.4, 3.6, 0x3b2a6b, -21, 4.4, 6, 4, Math.PI / 4);
box(0.2, 2.4, 1.6, 0x3a2416, -16.9, 0, 6, false);
box(3, 0.9, 1.2, 0x6b4128, -15, 0, 3.2);
box(2.2, 1.0, 0.15, 0x2a1d4f, -16.9, 3.1, 6, false, Math.PI / 2);
// 물약 가게
cyl(1.1, 0.9, 1.0, 0x2b2b33, 17, 0, 6, 12);
box(4, 2.2, 0.8, 0x6b4128, 20.5, 0, 9.2);
for (let i = 0; i < 6; i++) bake(new THREE.CylinderGeometry(0.16, 0.18, 0.4, 6), [0xff7aa8, 0x7fd8ff, 0xa8ff9b, 0xffd66b, 0xc79bff, 0xff9f43][i], 19 + i * 0.6, 2.4, 9.2);
box(4.6, 0.25, 3.4, 0x7a2e5e, 20, 3.0, 7.8, false);
for (const [x, z] of [[18, 6.3], [22, 6.3], [18, 9.4], [22, 9.4]]) box(0.2, 3.0, 0.2, 0x5a3a22, x, 0, z, false);

// 나무
for (const [x, z, s] of [[-10, 22, 1.2], [11, 23, 1], [-30, 10, 1.4], [30, 16, 1.2], [-8, -12, 0.9], [9, -14, 1], [36, -2, 1.3], [-38, -8, 1.3], [32, -38, 1.4], [-12, -44, 1.2], [14, -46, 1.1], [44, -24, 1.2], [-44, 20, 1.3], [6, 30, 1.1]]) {
  cyl(0.25 * s, 0.35 * s, 2.2 * s, 0x6b4128, x, 0, z, 6);
  blob(1.9 * s, 0x3f8f56, x, 3.2 * s, z, 1.1); blob(1.3 * s, 0x58a868, x + 0.7 * s, 4.2 * s, z - 0.3 * s);
}

// 텃밭 울타리 · 절벽
const HEDGE = 0x2f6b3a;
box(20, 1.9, 1, HEDGE, -26, 0, -18);
box(20, 1.9, 1, HEDGE, -26, 0, -38);
box(1, 1.9, 20, HEDGE, -36, 0, -28);
box(1, 1.9, 13, HEDGE, -16, 0, -30.5);
box(1, 1.9, 2, HEDGE, -16, 0, -19);
box(8, 4.5, 5, 0x7d6a5c, -27, 0, -33.5);
blob(1.4, 0x6e5d50, -30, 4.4, -34); blob(1.1, 0x8a7766, -24.5, 4.6, -35);
for (let i = 0; i < 10; i++) bake(new THREE.BoxGeometry(2.2, 0.2, 0.9), 0x6b4a2a, -30 + (i % 5) * 2.8, 0.1, -21.5 - Math.floor(i / 5) * 2.4);

// 연못 · 섬
const POND = { x: 24, z: -20, r: 9.5 }, ISLAND = { x: 24, z: -20, r: 2.6 };
const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 32), new THREE.MeshLambertMaterial({ color: 0x3f8fd8 }));
water.rotation.x = -Math.PI / 2; water.position.set(POND.x, 0.03, POND.z); scene.add(water);
const ice = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 32), new THREE.MeshLambertMaterial({ color: 0xdff6ff }));
ice.rotation.x = -Math.PI / 2; ice.position.set(POND.x, 0.06, POND.z); ice.visible = false; scene.add(ice);
cyl(ISLAND.r, ISLAND.r + 0.3, 0.35, 0x8a7a55, ISLAND.x, 0, ISLAND.z, 14);
SOL.push({ x0: 25.15, x1: 26.05, z0: -19.45, z1: -18.95, y0: 0.35, y1: 1.95 });

// 탑
const TOWER = { x: 0, z: -40, r: 4, top: 16 };
cyl(4, 4.3, 16, 0x8f86a8, TOWER.x, 0, TOWER.z, 14);
for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; box(1.1, 1.0, 0.7, 0x8f86a8, TOWER.x + Math.sin(a) * 3.6, 16, TOWER.z + Math.cos(a) * 3.6, true, 0); }
for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, y = 3 + i * 2.1; box(0.6, 0.9, 0.2, 0x2a1d4f, TOWER.x + Math.sin(a) * 4.05, y, TOWER.z + Math.cos(a) * 4.05, false, a); }
box(4, 0.4, 2.4, 0x6e6488, 0, 3.5, -34.8);
for (const x of [-1.9, 1.9]) box(0.2, 0.8, 2.4, 0x6e6488, x, 3.9, -34.8);
cyl(0.9, 1.1, 0.8, 0x3a3346, 0, 16, -40.6, 10);

// 광장 장식
for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5; cyl(0.12, 0.16, 2.4, 0x3a3346, Math.sin(a) * 9, 0, 4 + Math.cos(a) * 9, 6); }
box(3, 2.2, 0.3, 0x6b4128, 6, 0, 15.5);
box(2.6, 1.6, 0.1, 0xf3e3c3, 6, 0.6, 15.33, false);

const staticGeo = new THREE.BufferGeometry();
staticGeo.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3));
staticGeo.setAttribute('normal', new THREE.Float32BufferAttribute(SN, 3));
staticGeo.setAttribute('color', new THREE.Float32BufferAttribute(SC, 3));
const STATIC = new THREE.Mesh(staticGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
scene.add(STATIC);

// ───────── 빛 텍스처 · 글자 판 ─────────
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const glow = (hex, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: hex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); return s; };
function label(text, w = 4, bg = 'rgba(42,29,79,.85)', fg = '#ffd66b') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, 504, 120, 30); g.fill();
  g.fillStyle = fg; g.font = '900 56px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(w, w / 4, 1); return s;
}
const placeLabel = (t, x, y, z, w) => { const s = label(t, w); s.position.set(x, y, z); scene.add(s); return s; };
placeLabel('🪄 지팡이 가게', -16.6, 5.4, 6, 4.6);
placeLabel('🧪 물약 가게', 20, 4.4, 7.8, 4);
placeLabel('🌱 마법 텃밭', -16, 2.9, -22, 4);
placeLabel('🏰 시험의 탑', 0, 7, -35.5, 4.4);
placeLabel('📜 게시판', 6, 2.9, 15.6, 3);

// ───────── 마법이 닿는 것들 ─────────
const AIM = [];
const target = (obj, on) => { obj.traverse((o) => { if (o.isMesh) { o.userData.on = on; AIM.push(o); } }); return obj; };
const lam = (hex, opt = {}) => new THREE.MeshLambertMaterial({ color: hex, flatShading: true, ...opt });

const TORCHES = [];
for (let i = 0; i < 6; i++) {
  const a = i / 6 * TAU + 0.5, x = Math.sin(a) * 9, z = 4 + Math.cos(a) * 9;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.22, 0.35, 8), lam(0x4a4256)); bowl.position.set(x, 2.55, z); scene.add(bowl);
  const f = glow(0xff9a3c, 1.6); f.position.set(x, 3.05, z); f.visible = false; scene.add(f);
  const T = { x, z, f, lit: false };
  target(bowl, (sp) => { if (sp === 0 && !T.lit) { T.lit = true; f.visible = true; burst(x, 2.9, z, 0xff9a3c, 18); side(); return '횃불에 불이 붙었어요!'; } if (sp === 1 && T.lit) { T.lit = false; f.visible = false; burst(x, 2.9, z, 0xd8f0ff, 14, 1.5); side(); return '치익— 횃불이 꺼졌어요.'; } });
  TORCHES.push(T);
}
target(fWater, (sp) => {
  if (sp === 3) { fWater.material.color.setHex(0xeefaff); fTop.material.color.setHex(0xffffff); burst(0, 1.2, 4, 0xdff6ff, 30, 2); later(10, () => { fWater.material.color.setHex(0x7fd8ff); }); return '분수가 꽁꽁 얼었어요! (10초)'; }
  if (sp === 0) { burst(0, 1.2, 4, 0xffffff, 30, 3); return '치이익— 김이 피어올라요.'; }
  if (sp === 4) { burst(0, 3.5, 4, 0x7fd8ff, 40, 4); return '분수 물이 하늘로 솟구쳐요!'; }
});
target(fTop, (sp) => { if (sp === 2) { fTop.material.color.setHex(0xfff3a0); later(8, () => fTop.material.color.setHex(0xbff0ff)); burst(0, 2.8, 4, 0xfff3a0, 24); return '분수 꼭대기 수정이 반짝여요.'; } });

// 가시덤불
const BRAMBLE = { alive: true, meshes: [], sol: [] };
for (let i = 0; i < 4; i++) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 0), lam(0x5a2d6b)); m.position.set(-16, 0.8, -23.5 + i * 1.15); m.scale.set(0.9, 1.15, 0.9); scene.add(m); BRAMBLE.meshes.push(m);
  for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 4), lam(0x2b1638)); t.position.set((k % 2 ? 0.6 : -0.6), 0.2 * k - 0.2, (k > 1 ? 0.5 : -0.5)); t.rotation.z = (k % 2 ? -1 : 1); m.add(t); }
}
const bSol = { x0: -16.6, x1: -15.4, z0: -24.2, z1: -19.8, y0: 0, y1: 1.7 }; SOL.push(bSol);
BRAMBLE.meshes.forEach((m) => target(m, (sp) => {
  if (sp !== 0 || !BRAMBLE.alive) return sp === 1 ? '덤불이 물을 먹고 더 무성해졌어요…' : null;
  BRAMBLE.alive = false; bSol.y1 = -1;
  BRAMBLE.meshes.forEach((b, j) => { burst(b.position.x, 1, b.position.z, 0xff7a2c, 26, 2.5); tween(1.4, (k) => b.scale.setScalar(Math.max(0.01, 1 - k)), () => { b.visible = false; }, j * 0.15); });
  advance(1); return '🔥 가시덤불이 활활 타서 사라졌어요!';
}));

// 마법 씨앗 · 버섯
const seed = new THREE.Group(); seed.position.set(-26, 0, -26); scene.add(seed);
const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 5), lam(0x8de08a)); sprout.position.y = 0.3; seed.add(sprout);
const seedGlow = glow(0x8de08a, 1.4); seedGlow.position.y = 0.6; seed.add(seedGlow);
const MUSH = [[-25.5, -27.8, 1.3, 1.15, 0xff6b9a], [-27.6, -29.0, 2.6, 1.05, 0xffb347], [-24.6, -30.0, 3.9, 0.95, 0xc79bff]].map(([x, z, top, r, hex]) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(0.01); g.visible = false; scene.add(g);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, top - 0.25, 7), lam(0xf3e6cf)); st.position.y = (top - 0.25) / 2; g.add(st);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 5, 0, TAU, 0, Math.PI / 2), lam(hex)); cap.position.y = top - 0.3; cap.scale.y = 0.55; g.add(cap);
  for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), lam(0xffffff)); const a = k * 1.7; d.position.set(Math.sin(a) * r * 0.55, top - 0.3 + r * 0.4, Math.cos(a) * r * 0.55); g.add(d); }
  return { g, sol: { x0: x - r * 0.8, x1: x + r * 0.8, z0: z - r * 0.8, z1: z + r * 0.8, y0: 0, y1: -1, top } };
});
let grown = false;
target(seed, (sp) => {
  if (sp !== 1 || grown) return sp === 0 ? '앗 뜨거워! 씨앗이 움츠러들었어요.' : null;
  grown = true; seedGlow.visible = false; burst(-26, 0.8, -26, 0x4fc3ff, 30, 2);
  MUSH.forEach((m, i) => { SOL.push(m.sol); later(0.3 + i * 0.6, () => { m.g.visible = true; burst(m.g.position.x, 1, m.g.position.z, 0x8de08a, 22, 3); tween(1.0, (k) => m.g.scale.setScalar(Math.max(0.01, k < 0.8 ? k * 1.4 : 1.12 - (k - 0.8) * 0.6)), () => { m.g.scale.setScalar(1); m.sol.y1 = m.sol.top; }); }); });
  return '💧 쑥쑥! 거대한 버섯 계단이 자라났어요!';
});

// 연못
let frozenT = 0;
target(water, (sp) => {
  if (sp === 3) { frozenT = 45; ice.visible = true; burst(POND.x, 0.6, POND.z, 0xffffff, 70, 4); return '❄️ 연못이 꽁꽁 얼었어요! (45초)'; }
  if (sp === 1) { burst(POND.x, 0.5, POND.z, 0x7fd8ff, 20, 2); return '연못에 물이 조금 더 찼어요.'; }
});
target(ice, (sp) => { if (sp === 0) { frozenT = 0.01; burst(POND.x, 0.6, POND.z, 0xffffff, 40, 3); return '🔥 얼음이 녹아 버렸어요!'; } if (sp === 3) { frozenT = 45; return '❄️ 얼음이 더 단단해졌어요. (45초)'; } });

// 룬 돌
const rune = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.65, 0.55), lam(0x7a7488)); rune.position.set(25.6, 1.18, -19.2); scene.add(rune);
const runeText = label('🦘 = 🐸 + ☁️ + ⭐', 3.6, 'rgba(20,12,40,.0)', '#fff3a0'); runeText.position.set(25.6, 2.6, -19.2); runeText.visible = false; scene.add(runeText);
let runeLit = false;
target(rune, (sp) => { if (sp === 2) { if (!runeLit) { runeLit = true; runeText.visible = true; burst(25.6, 1.6, -19.2, 0xfff3a0, 30, 2); side(); } return '✨ 돌에 숨은 글씨가 떠올랐어요: 높이뛰기 물약 = 🐸 개구리 다리 + ☁️ 구름 솜 + ⭐ 별가루'; } });

// 상자
const CRATES = [[-5.0, -28.6], [-3.4, -30.6], [-1.6, -32.9]].map(([x, z], i) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), lam(0xb8803e)); m.position.set(x, 0.6, z); scene.add(m);
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.16, 1.24), lam(0x6b4128)); m.add(band);
  const C = { m, x, z, lvl: 0, y: 0, sol: { x0: x - 0.6, x1: x + 0.6, z0: z - 0.6, z1: z + 0.6, y0: 0, y1: 1.2 } }; SOL.push(C.sol);
  target(m, (sp) => {
    if (sp !== 4) return sp === 0 ? '상자가 그을렸어요. 띄우려면 🪶 띄우기 마법!' : null;
    C.lvl = (C.lvl + 1) % 3; burst(x, C.y + 0.6, z, 0xd6a8ff, 22, 2);
    return ['🪶 상자가 땅으로 내려왔어요.', '🪶 상자가 한 칸 떠올랐어요!', '🪶 상자가 두 칸 떠올랐어요!'][C.lvl];
  });
  return C;
});

// 봉화
const fire = glow(0xff8a2c, 5); fire.position.set(0, 17.6, -40.6); fire.visible = false; scene.add(fire);
const brazierHit = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); brazierHit.position.set(0, 17.5, -40.6); scene.add(brazierHit);
target(brazierHit, (sp) => { if (sp !== 0) return null; if (QS.step < 5) return '봉화는 시험의 마지막에 밝혀요.'; if (fire.visible) return null; fire.visible = true; graduate(); return '🔥 봉화가 타올랐어요!'; });

// 두루마리
const SCROLLS = [];
function scroll(x, y, z, spell, onGet) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 8), lam(0xf3e3c3)); r.rotation.z = Math.PI / 2; g.add(r);
  g.add(glow(SPELLS[spell].c, 1.8));
  const S = { g, x, y, z, got: false, spell, onGet }; SCROLLS.push(S); return S;
}

// ───────── 마법 ─────────
const SPELLS = [
  { n: '불꽃', e: '🔥', c: 0xff7a2c }, { n: '물줄기', e: '💧', c: 0x4fc3ff }, { n: '빛', e: '✨', c: 0xfff3a0 },
  { n: '얼음', e: '❄️', c: 0xbff0ff }, { n: '띄우기', e: '🪶', c: 0xd6a8ff },
];
const learned = [false, false, false, false, false];
let spell = 0, wand = false, castCd = 0;
scroll(-27, 5.1, -33.6, 3, () => advance(2));
scroll(23.2, 0.95, -20.6, 4, () => advance(3));

// ───────── 입자 ─────────
const PN = 600, pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3), pLife = new Float32Array(PN), pGrav = new Float32Array(PN);
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.42, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
pts.frustumCulled = false; scene.add(pts);
let pNext = 0;
function emit(x, y, z, vx, vy, vz, hex, life, grav = -4) {
  const i = pNext; pNext = (pNext + 1) % PN;
  pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pVel[i * 3] = vx; pVel[i * 3 + 1] = vy; pVel[i * 3 + 2] = vz;
  _c.setHex(hex); pCol[i * 3] = _c.r; pCol[i * 3 + 1] = _c.g; pCol[i * 3 + 2] = _c.b; pLife[i] = life; pGrav[i] = grav;
}
function burst(x, y, z, hex, n = 20, sp = 2.5, grav = -4) { for (let k = 0; k < n; k++) { const a = Math.random() * TAU, u = Math.random() * 2 - 1, s = sp * (0.4 + Math.random() * 0.6), q = Math.sqrt(1 - u * u); emit(x, y, z, Math.cos(a) * q * s, Math.abs(u) * s + 0.6, Math.sin(a) * q * s, hex, 0.6 + Math.random() * 0.6, grav); } }
function partTick(dt) {
  for (let i = 0; i < PN; i++) {
    if (pLife[i] <= 0) continue;
    pLife[i] -= dt;
    if (pLife[i] <= 0) { pPos[i * 3 + 1] = -999; continue; }
    pVel[i * 3 + 1] += pGrav[i] * dt;
    pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
  }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}
for (let i = 0; i < PN; i++) pPos[i * 3 + 1] = -999;

// ───────── 시간 맞춘 일 ─────────
const TW = [];
function tween(dur, fn, done, delay = 0) { TW.push({ t: -delay, dur, fn, done }); }
function later(sec, fn) { TW.push({ t: -sec, dur: 0, fn: () => {}, done: fn }); }
function twTick(dt) {
  for (let i = TW.length - 1; i >= 0; i--) { const w = TW[i]; w.t += dt; if (w.t < 0) continue;
    const k = w.dur ? Math.min(1, w.t / w.dur) : 1; w.fn(k); if (k >= 1) { TW.splice(i, 1); if (w.done) w.done(); } }
}

// ───────── 사람 ─────────
function wizard(robe, hat, skin = 0xf1c9a0, beard = false) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.15, 8), lam(robe)); body.position.y = 0.58; g.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), lam(skin)); head.position.y = 1.32; g.add(head);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 10), lam(hat)); brim.position.y = 1.5; g.add(brim);
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.62, 8), lam(hat)); top.position.set(0, 1.82, -0.04); top.rotation.x = -0.18; g.add(top);
  const star = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: 0xffd66b })); star.position.set(0, 1.78, 0.17); g.add(star);
  for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: 0x1d1530 })); e.position.set(sd * 0.09, 1.35, 0.23); g.add(e); }
  if (beard) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), lam(0xf4f4f4)); b.position.set(0, 1.05, 0.16); b.rotation.x = Math.PI; g.add(b); }
  scene.add(g); return g;
}
const me = wizard(0x7a4cff, 0x2a1d4f, 0xf1c9a0);
const wandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.6, 5), lam(0x6b4128)); wandMesh.position.set(0.36, 0.95, 0.25); wandMesh.rotation.x = 1.1; wandMesh.visible = false; me.add(wandMesh);
const wandTip = glow(0xfff3a0, 0.35); wandTip.position.set(0.36, 1.2, 0.55); wandTip.visible = false; me.add(wandTip);
const blobShadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 14), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
blobShadow.rotation.x = -Math.PI / 2; scene.add(blobShadow);
const meGlow = glow(0xfff3a0, 3); meGlow.visible = false; scene.add(meGlow);

const NPCS = [];
function npc(name, robe, hat, x, z, face, lines, opt = {}) {
  const g = wizard(robe, hat, opt.skin, opt.beard); g.position.set(x, 0, z); g.rotation.y = face;
  const L = label(name, 2.6); L.position.set(0, 2.55, 0); g.add(L);
  const N = { g, name, x, z, lines, path: opt.path || null, pi: 0, wait: 0, float: 0, act: opt.act };
  target(g, (sp) => { if (sp === 4) { N.float = 2.5; burst(N.g.position.x, 1, N.g.position.z, 0xd6a8ff, 16); return name + ': 으앗, 몸이 붕 떠요!'; } if (sp === 3) { burst(N.g.position.x, 1.2, N.g.position.z, 0xdff6ff, 16); return name + ': 으으 추워!'; } if (sp === 1) return name + ': 앗 차가워! 장난꾸러기 같으니.'; if (sp === 2) return name + ': 눈부셔라!'; if (sp === 0) return name + ': 앗 뜨거! 사람한테 불꽃은 안 돼요!'; });
  NPCS.push(N); return N;
}
const BUDEUL = npc('지팡이 장인 버들', 0x3b6b4a, 0x23402c, -15.2, 4.6, Math.PI / 2, null, { beard: true, skin: 0xe8c3a0 });
const SOL_GRAN = npc('물약 할머니 솔', 0x7a2e5e, 0x3a1430, 19.6, 6.2, -Math.PI / 2, null, { beard: false, skin: 0xe0b48f });
npc('마을 마법사 별이', 0x2f6fd0, 0x1d3557, 4, 10, 0, ['밤하늘 같은 탑 꼭대기 봉화를 밝히면 견습 마법사 합격이래!', '물약 할머니의 가마솥은 재료 세 가지로 끓여.'], { path: [[4, 10], [-6, 10], [-8, -2], [6, -3]] });
npc('마을 마법사 노을', 0xff8a3c, 0x7a2e12, -6, -6, 0, ['연못은 그냥 건널 수 없어. 꽁꽁 얼리는 마법이 있으면 좋을 텐데…', '✨ 빛을 비추면 숨은 글씨가 보이는 돌이 있대.'], { path: [[-6, -6], [8, -8], [10, 14], [-9, 14]] });
npc('마을 마법사 바람', 0x3aa08a, 0x1d4a40, 9, -16, 0, ['상자는 🪶 띄우기 마법으로 한 칸씩 올릴 수 있어. 세 번 쓰면 다시 내려와!', '반짝 물약 = 🌙 달맞이꽃 + ⭐ 별가루 + 🌿 민트 잎. 밤길에 좋지.'], { path: [[9, -16], [16, -12], [6, -26], [-4, -24]] });

// 부엉이 · 촛불 · 하늘 양탄자
const OWLS = [0, 1, 2].map((i) => {
  const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), lam(0x8a6a4a)); g.add(b);
  const wl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.3), lam(0x6b4a2a)); wl.position.x = -0.4; g.add(wl);
  const wr = wl.clone(); wr.position.x = 0.4; g.add(wr); scene.add(g); return { g, wl, wr, a: i * 2.1, r: 7 + i * 1.5, h: 18 + i * 1.2, s: 0.5 + i * 0.12 };
});
const CN = 26, candle = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 6), new THREE.MeshLambertMaterial({ color: 0xfff6e0 }), CN);
const flame = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 0), new THREE.MeshBasicMaterial({ color: 0xffc85a }), CN);
const CPOS = Array.from({ length: CN }, (_, i) => { const a = i / CN * TAU * 2.3, r = 5 + (i * 37 % 7); return [Math.sin(a) * r, 3.4 + (i * 13 % 9) * 0.25, 4 + Math.cos(a) * r, i * 0.7]; });
scene.add(candle, flame);
const carpet = new THREE.Group();
const cMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.5), lam(0xc0392b)); carpet.add(cMesh);
const cTrim = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 1.6), lam(0xffd66b)); cTrim.position.y = -0.04; carpet.add(cTrim);
scene.add(carpet);
const CARPET = { a: 0, x: 0, z: 0, sol: { x0: 0, x1: 0, z0: 0, z1: 0, y0: 0.3, y1: 0.48 } }; SOL.push(CARPET.sol);
target(carpet, (sp) => { if (sp === 4) { CARPET.boost = 4; return '🪶 양탄자가 신나게 빨리 날아요!'; } });

const stars = (() => { const n = 400, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const t = Math.random() * TAU, u = 0.15 + Math.random() * 0.85, r = 180; a[i * 3] = Math.cos(t) * r * Math.sqrt(1 - u * u); a[i * 3 + 1] = u * r; a[i * 3 + 2] = Math.sin(t) * r * Math.sqrt(1 - u * u); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.4, color: 0xfff6d0, sizeAttenuation: false, fog: false })); scene.add(p); return p; })();

// ───────── 플레이어 · 충돌 ─────────
const P = { x: 0, y: 0, z: 17, vy: 0, yaw: Math.PI, ground: true, src: null };
const CAM = { yaw: 0, pitch: 0.32, dist: 6.5 };
const R = 0.3, STEP = 0.55;
function groundAt(x, z, y) {
  let g = 0, src = null;
  for (const b of SOL) { if (b.y1 <= b.y0 || x < b.x0 - 0.05 || x > b.x1 + 0.05 || z < b.z0 - 0.05 || z > b.z1 + 0.05) continue; if (b.y1 <= y + STEP && b.y1 > g) { g = b.y1; src = b; } }
  for (const c of CIR) { if ((x - c.x) ** 2 + (z - c.z) ** 2 > c.r * c.r) continue; if (c.y1 <= y + STEP && c.y1 > g) { g = c.y1; src = c; } }
  if (Math.hypot(x - ISLAND.x, z - ISLAND.z) < ISLAND.r && 0.35 > g) { g = 0.35; src = ISLAND; }
  return [g, src];
}
function blocked(x, z, y) {
  for (const b of SOL) { if (b.y1 <= b.y0 || b.y1 <= y + STEP || b.y0 >= y + 1.6) continue; if (x > b.x0 - R && x < b.x1 + R && z > b.z0 - R && z < b.z1 + R) return true; }
  for (const c of CIR) { if (c.y1 <= y + STEP || c.y0 >= y + 1.6) continue; if ((x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + R) ** 2) return true; }
  return Math.hypot(x, z - 4) > 74;
}
const inPond = (x, z) => Math.hypot(x - POND.x, z - POND.z) < POND.r && Math.hypot(x - ISLAND.x, z - ISLAND.z) > ISLAND.r;

// ───────── 입력 ─────────
const keys = new Set();
let started = false, busyUI = null, jumpT = 0, castQ = false;
const locked = () => document.pointerLockElement === canvas;
const look = (dx, dy, k) => { CAM.yaw -= dx * k; CAM.pitch = clamp(CAM.pitch + dy * k * 0.85, -0.15, 1.15); };
const TOUCH = createTouch({ canvas, look: (dx, dy) => { if (!busyUI) look(dx, dy, 0.0058); }, act: () => act(), view: () => {} });
addEventListener('keydown', (e) => {
  if (!started) { if (e.code === 'Enter') { e.preventDefault(); start(); } return; }
  if (busyUI) { if (busyUI === 'dlg' && ['KeyE', 'Enter', 'Space'].includes(e.code)) { e.preventDefault(); dlgNext(); } else if (e.code === 'Escape') closeUI(); return; }
  keys.add(e.code);
  if (e.code === 'Space') { e.preventDefault(); jumpT = 0.12; }
  else if (e.code === 'KeyE') act();
  else if (e.code === 'KeyF') castQ = true;
  else if (e.code === 'KeyQ') pickSpell(1, true);
  else if (/^Digit[1-5]$/.test(e.code)) pickSpell(+e.code.slice(5) - 1);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
addEventListener('mousemove', (e) => { if (locked() && !busyUI) look(e.movementX || 0, e.movementY || 0, 0.0026); });
canvas.addEventListener('mousedown', (e) => { if (e.button !== 0 || !started || busyUI || TOUCH.on) return; if (locked()) castQ = true; else canvas.requestPointerLock?.(); });
canvas.addEventListener('wheel', (e) => { CAM.dist = clamp(CAM.dist + e.deltaY * 0.01, 3, 12); }, { passive: true });
const tCast = $('tCast');
tCast.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); castQ = true; tCast.style.transform = 'scale(.92)'; });
tCast.addEventListener('pointerup', () => { tCast.style.transform = ''; });

// ───────── 화면 글 ─────────
const toastEl = $('toast'); let toastT = 0;
function toast(t, sec = 3) { toastEl.textContent = t; toastEl.classList.add('on'); toastT = sec; }
const spellBar = $('spells');
function drawSpells() {
  spellBar.innerHTML = '';
  SPELLS.forEach((s, i) => { const b = document.createElement('button'); b.className = 'sp' + (i === spell ? ' on' : '') + (learned[i] ? '' : ' lock');
    b.innerHTML = '<i>' + (i + 1) + '</i>' + (learned[i] ? s.e : '🔒') + '<small>' + (learned[i] ? s.n : '???') + '</small>';
    b.onclick = (e) => { e.stopPropagation(); pickSpell(i); }; spellBar.appendChild(b); });
}
function pickSpell(i, cycle = false) {
  if (cycle) { if (!learned.some(Boolean)) return; let k = spell; do { k = (k + 1) % 5; } while (!learned[k]); i = k; }
  if (!learned[i]) { toast('🔒 아직 배우지 않은 마법이에요', 1.6); return; }
  spell = i; drawSpells();
}

// ───────── 시험 ─────────
const STEPS = [
  { t: '🪄 지팡이 가게에서 지팡이 받기', at: [-15.2, 4.6] },
  { t: '🔥 텃밭 입구 가시덤불 태우기', at: [-16, -21.8] },
  { t: '💧 마법 씨앗에 물 주고 ❄️ 두루마리 얻기', at: [-26, -26] },
  { t: '❄️ 연못을 얼려 섬의 🪶 두루마리 얻기', at: [24, -20] },
  { t: '🪶 상자를 띄워 탑 난간에 오르기', at: [-3, -31] },
  { t: '🔥 탑 꼭대기 봉화 밝히기', at: [0, -40] },
];
const QS = { step: 0, done: false, potions: new Set(), t0: 0 };
function side() {
  const lit = TORCHES.filter((t) => t.lit).length;
  $('side').textContent = '🧪 물약 ' + QS.potions.size + '/3 · 🔥 광장 횃불 ' + lit + '/6' + (runeLit ? ' · ✨ 룬 해독' : '');
}
function drawQuest() {
  $('qlist').innerHTML = STEPS.map((s, i) => '<li class="' + (i < QS.step || QS.done ? 'ok' : i === QS.step ? 'now' : '') + '">' + s.t + '</li>').join('');
  $('objT').textContent = QS.done ? '🎓 합격! 마을을 마음껏 돌아다녀요' : STEPS[QS.step].t; side();
}
function advance(from) { if (QS.step !== from) return; QS.step++; drawQuest(); later(1.2, () => { if (!QS.done) toast('📜 다음 시험: ' + STEPS[QS.step].t, 3.5); }); }

// ───────── 말 걸기 · 할 것 ─────────
const ACTS = [
  { x: BUDEUL.x, z: BUDEUL.z, y: 0, r: 2.4, label: '지팡이 장인 버들과 이야기하기', fn: talkBudeul },
  { x: SOL_GRAN.x, z: SOL_GRAN.z, y: 0, r: 2.6, label: '물약 할머니 솔과 이야기하기', fn: talkSol },
  { x: 17, z: 6, y: 0, r: 2.2, label: '가마솥에 물약 끓이기', fn: openPot },
  { x: 6, z: 14.6, y: 0, r: 2.2, label: '게시판 읽기', fn: () => dlg([['📜 게시판', '[견습 마법사 시험 안내]\n지팡이를 받고, 마을의 시험을 차례로 통과한 뒤 탑 꼭대기 봉화를 밝히세요.'], ['📜 게시판', '[물약 가게 소식] 반짝 물약 = 🌙 달맞이꽃 + ⭐ 별가루 + 🌿 민트 잎']]) },
  { x: 25.6, z: -18.4, y: 0.35, r: 1.8, label: '룬 돌 살펴보기', fn: () => toast(runeLit ? '높이뛰기 물약 = 🐸 + ☁️ + ⭐' : '오래된 돌이에요. 글씨가 보이지 않아요… ✨ 빛을 비춰 볼까?', 4) },
  { x: 0, z: -34.8, y: 3.9, r: 1.4, label: '✨ 마법진 타고 탑 꼭대기로', fn: () => ride(0, 16, -37.6) },
  { x: 2.2, z: -42, y: 16, r: 1.3, label: '✨ 마법진 타고 아래로', fn: () => ride(0, 0, -31.5) },
];
const ledgeMark = glow(0xd6a8ff, 2.2); ledgeMark.position.set(0, 4.0, -34.8); scene.add(ledgeMark);
const topMark = glow(0xd6a8ff, 2); topMark.position.set(2.2, 16.1, -42); scene.add(topMark);
for (const N of NPCS) if (N.path) ACTS.push({ npc: N, r: 2.2, label: N.name + '와 이야기하기', fn: () => dlg([[N.name, N.lines[Math.floor(Math.random() * N.lines.length)]]]) });
let near = null;
function nearTick() {
  let best = null, bd = 1e9;
  for (const a of ACTS) { const x = a.npc ? a.npc.g.position.x : a.x, z = a.npc ? a.npc.g.position.z : a.z, y = a.npc ? 0 : a.y, d = Math.hypot(P.x - x, P.z - z); if (d < a.r && Math.abs(P.y - y) < 1.5 && d < bd) { bd = d; best = a; } }
  for (const s of SCROLLS) if (!s.got && Math.hypot(P.x - s.x, P.z - s.z) < 1.6 && Math.abs(P.y + 0.8 - s.y) < 1.6) { best = { label: SPELLS[s.spell].e + ' ' + SPELLS[s.spell].n + ' 두루마리 줍기', fn: () => getScroll(s) }; break; }
  if (best !== near) { near = best; $('hint').classList.toggle('hide', !best); if (best) $('hintT').textContent = best.label; }
}
function act() { if (!started) return; if (busyUI === 'dlg') { dlgNext(); return; } if (busyUI) return; if (near) near.fn(); }
$('hint').onclick = (e) => { e.stopPropagation(); act(); };
function getScroll(s) {
  s.got = true; s.g.visible = false; learned[s.spell] = true; spell = s.spell; drawSpells(); burst(s.x, s.y, s.z, SPELLS[s.spell].c, 40, 3);
  dlg([['📜 두루마리', SPELLS[s.spell].e + ' ' + SPELLS[s.spell].n + ' 마법을 배웠어요!\n숫자 ' + (s.spell + 1) + '번(또는 Q)으로 골라 쓸 수 있어요.']]); if (s.onGet) s.onGet();
}
let rideA = null;
function ride(x, y, z) { rideA = { x0: P.x, y0: P.y, z0: P.z, x, y, z, t: 0 }; burst(P.x, P.y + 0.5, P.z, 0xd6a8ff, 40, 2, 2); }

// 대화
const D = { lines: [], i: 0, done: null };
function dlg(lines, done) { D.lines = lines; D.i = 0; D.done = done || null; busyUI = 'dlg'; document.exitPointerLock?.(); $('dlg').classList.remove('hide'); showLine(); }
function showLine() { const [w, t] = D.lines[D.i]; $('dWho').textContent = w; $('dSay').textContent = t; $('dRow').innerHTML = '<button id="dNext">' + (D.i < D.lines.length - 1 ? '다음 ▶' : '확인') + '</button>'; $('dNext').onclick = (e) => { e.stopPropagation(); dlgNext(); }; }
function dlgNext() { if (D.i < D.lines.length - 1) { D.i++; showLine(); return; } $('dlg').classList.add('hide'); busyUI = null; const f = D.done; D.done = null; if (f) f(); }
function closeUI() { if (busyUI === 'dlg') { D.i = D.lines.length - 1; dlgNext(); } else if (busyUI === 'pot') closePot(); else if (busyUI === 'end') { $('end').classList.add('hide'); busyUI = null; } }
function talkBudeul() {
  if (!wand) return dlg([
    ['지팡이 장인 버들', '어서 오렴, 견습 마법사! 오늘이 바로 견습 마법사 시험 날이지.'],
    ['지팡이 장인 버들', '이 버드나무 지팡이를 받거라. 🔥 불꽃 · 💧 물줄기 · ✨ 빛 — 세 가지 마법이 들어 있단다.'],
    ['지팡이 장인 버들', '숫자 1·2·3으로 마법을 고르고, 화면 가운데 동그라미를 겨눠 클릭(또는 F)하면 마법이 날아가.'],
    ['지팡이 장인 버들', '첫 시험! 텃밭 입구를 가시덤불이 꽉 막았다더구나. 🔥 불꽃으로 태워 보렴.'],
  ], () => { wand = true; learned[0] = learned[1] = learned[2] = true; spell = 0; wandMesh.visible = wandTip.visible = true; drawSpells(); burst(P.x, 1.2, P.z, 0xfff3a0, 40, 3); advance(0); });
  const tips = ['마법은 쓸 곳을 잘 골라야 해. 같은 물건도 마법에 따라 다르게 변하지.', '탑 아래 상자 세 개를 계단처럼 띄워 보렴. 한 칸, 두 칸…', '연못 얼음은 오래가지 않아. 얼리면 서둘러 건너!', '마을 사람에게 🪶 띄우기를 써 봤니? 후후.'];
  dlg([['지팡이 장인 버들', tips[Math.floor(Math.random() * tips.length)]]]);
}
function talkSol() {
  dlg([
    ['물약 할머니 솔', '어이구, 견습 마법사로구나. 물약은 재료 세 가지를 가마솥에 넣고 끓이면 된단다.'],
    ['물약 할머니 솔', '⚡ 바람 물약 비법을 알려 주마. ⚡ 번개 깃털 + ☁️ 구름 솜 + 🌿 민트 잎! 바람처럼 빨라지지.'],
    ['물약 할머니 솔', '다른 비법은 마을 어딘가에 숨어 있어. 틀리게 섞으면… 펑! 조심하렴.'],
  ], openPot);
}

// 물약
const INGS = [['🐸', '개구리 다리'], ['☁️', '구름 솜'], ['⭐', '별가루'], ['🌙', '달맞이꽃'], ['⚡', '번개 깃털'], ['🌿', '민트 잎']];
const RECIPES = [
  { k: '🐸☁️⭐', n: '🦘 높이뛰기 물약', c: 0x8de08a, fx: 'jump', say: '몸이 깃털처럼 가벼워요! 높이 뛸 수 있어요 (60초)' },
  { k: '⚡☁️🌿', n: '⚡ 바람 물약', c: 0x7fd8ff, fx: 'speed', say: '발이 바람처럼 빨라졌어요! (60초)' },
  { k: '🌙⭐🌿', n: '🌟 반짝 물약', c: 0xfff3a0, fx: 'glow', say: '온몸이 반짝반짝 빛나요! (60초)' },
];
const FX = { jump: 0, speed: 0, glow: 0, frog: 0 };
let potSel = [];
const ingBox = $('ings');
INGS.forEach(([e, n], i) => { const b = document.createElement('button'); b.innerHTML = '<span>' + e + '</span>' + n; b.onclick = () => { if (potSel.includes(i) || potSel.length >= 3) return; potSel.push(i); drawPot(); }; ingBox.appendChild(b); });
function drawPot() { [...ingBox.children].forEach((b, i) => b.classList.toggle('sel', potSel.includes(i))); $('pick').textContent = potSel.length ? '가마솥: ' + potSel.map((i) => INGS[i][0] + ' ' + INGS[i][1]).join(' + ') : '재료를 세 가지 골라요'; $('potBrew').disabled = potSel.length < 3; }
function openPot() { busyUI = 'pot'; document.exitPointerLock?.(); potSel = []; drawPot(); $('pot').classList.remove('hide'); }
function closePot() { $('pot').classList.add('hide'); busyUI = null; }
$('potClear').onclick = () => { potSel = []; drawPot(); };
$('potClose').onclick = closePot;
$('potBrew').onclick = () => {
  const key = potSel.map((i) => INGS[i][0]).sort().join(''), r = RECIPES.find((x) => [...x.k.match(/\p{Extended_Pictographic}️?/gu)].sort().join('') === key);
  closePot();
  if (r) { FX[r.fx] = 60; QS.potions.add(r.fx); side(); burst(17, 1.3, 6, r.c, 60, 3, 1.5); toast('✨ ' + r.n + ' 완성! ' + r.say, 4); }
  else { FX.frog = 15; burst(17, 1.3, 6, 0x6fbf3a, 70, 3, 2); toast('펑! 💨 잘못 섞었어요… 몸이 개구리색이 됐어요! (15초)', 4); }
};

// ───────── 마법 쏘기 ─────────
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(0, 0);
const BOLTS = [];
function cast(at) {
  if (!wand) { toast('지팡이가 없어요. 먼저 지팡이 가게에 가 봐요!', 2.5); return; }
  if (castCd > 0) return; castCd = 0.4;
  if (at) ray.set(camera.position, at.clone().sub(camera.position).normalize()); else ray.setFromCamera(ndc, camera); ray.far = 60;
  const hits = ray.intersectObjects([STATIC, ground], false).filter((h) => h.distance > 1.2);
  const first = hits[0], lim = first ? first.distance : 60;
  let hit = first || null, bt = 1e9;
  for (const o of AIM) {   // 겨눈 줄에 가까운 마법 대상(조금 빗나가도 맞게)
    let vis = o.visible; o.traverseAncestors((a) => { if (!a.visible) vis = false; }); if (!vis) continue;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const c = o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld), r = o.geometry.boundingSphere.radius * o.getWorldScale(_s).x;
    const t = c.clone().sub(ray.ray.origin).dot(ray.ray.direction); if (t < 1.2 || t > lim + r + 0.6) continue;
    const dist = ray.ray.at(t, new THREE.Vector3()).distanceTo(c); if (dist > r + 0.45 || t >= bt) continue;
    bt = t; hit = { object: o, point: c, distance: t };
  }
  const tip = _v.set(0.36, 1.2, 0.55).applyMatrix4(me.matrixWorld).clone();
  const to = hit ? hit.point.clone() : ray.ray.at(40, new THREE.Vector3());
  const s = SPELLS[spell], b = glow(s.c, 0.9); b.position.copy(tip); scene.add(b);
  BOLTS.push({ b, from: tip, to, t: 0, dur: Math.max(0.15, tip.distanceTo(to) / 34), sp: spell, obj: hit && hit.object.userData && hit.object.userData.on ? hit.object : null });
  if (NET) NET.fx({ s: spell, a: [tip.x, tip.y, tip.z].map((v) => +v.toFixed(2)), b: [to.x, to.y, to.z].map((v) => +v.toFixed(2)) });
  P.yaw = Math.atan2(-Math.sin(CAM.yaw), -Math.cos(CAM.yaw));
}
function boltTick(dt) {
  for (let i = BOLTS.length - 1; i >= 0; i--) {
    const B = BOLTS[i]; B.t += dt; const k = Math.min(1, B.t / B.dur);
    B.b.position.lerpVectors(B.from, B.to, k); B.b.position.y += Math.sin(k * Math.PI) * 0.4;
    if (Math.random() < 0.7) emit(B.b.position.x, B.b.position.y, B.b.position.z, 0, 0.3, 0, SPELLS[B.sp].c, 0.35, 0);
    if (k < 1) continue;
    scene.remove(B.b); B.b.material.dispose(); BOLTS.splice(i, 1);
    const msg = B.remote ? null : B.obj ? B.obj.userData.on(B.sp) : null;
    if (msg) toast(msg, 3.2); else if (B.remote) burst(B.to.x, B.to.y + 0.1, B.to.z, SPELLS[B.sp].c, 18, 2); else burst(B.to.x, B.to.y + 0.1, B.to.z, SPELLS[B.sp].c, 12, 1.6);
  }
}

// ───────── 합격 ─────────
let fireworks = 0;
function graduate() {
  QS.done = true; drawQuest(); fireworks = 9;
  later(3.5, () => {
    const sec = Math.round((performance.now() - QS.t0) / 1000);
    $('endList').innerHTML = ['⏱ 걸린 시간: ' + Math.floor(sec / 60) + '분 ' + (sec % 60) + '초', '🧪 만든 물약: ' + QS.potions.size + ' / 3', '🔥 밝힌 광장 횃불: ' + TORCHES.filter((t) => t.lit).length + ' / 6', '✨ 룬 돌 해독: ' + (runeLit ? '했어요' : '아직')].map((t) => '<li>' + t + '</li>').join('');
    busyUI = 'end'; document.exitPointerLock?.(); $('end').classList.remove('hide');
  });
}
$('endFree').onclick = () => { $('end').classList.add('hide'); busyUI = null; };
$('endAgain').onclick = () => location.reload();

// ───────── 시작 ─────────
const Qp = new URLSearchParams(location.search);
let NET = null;
const nmIn = $('nmIn');
try { nmIn.value = localStorage.getItem('mp.name') || ''; } catch (e) { /* */ }
nmIn.addEventListener('keydown', (e) => e.stopPropagation());
function drawWho() { if (!NET) return; const n = NET.count; $('who').textContent = '👥 마법사 ' + n + '명 · 나: ' + NET.name; }
function netStart() {
  if (Qp.get('mp') === '0' || NET) return;
  NET = createNet({ THREE, scene, room: (Qp.get('room') || 'wizard').replace(/[^a-z0-9_-]/gi, '').slice(0, 24) || 'wizard', kind: 'wizard', onChange: drawWho,
    onFx: (O, f) => { if (!f || !Array.isArray(f.a) || !Array.isArray(f.b) || !SPELLS[f.s]) return; const from = new THREE.Vector3(...f.a), to = new THREE.Vector3(...f.b);
      if (from.distanceTo(camera.position) > 90) return; const b = glow(SPELLS[f.s].c, 0.9); b.position.copy(from); scene.add(b); BOLTS.push({ b, from, to, t: 0, dur: Math.max(0.15, from.distanceTo(to) / 34), sp: f.s, obj: null, remote: true }); } });
  if (nmIn.value.trim()) NET.setName(nmIn.value);
  $('who').classList.remove('hide'); drawWho();
}
function start() {
  if (started) return; started = true; QS.t0 = performance.now(); netStart();
  $('title').classList.add('hide');
  for (const id of ['quest', 'obj', 'cross', 'spells', 'help']) $(id).classList.remove('hide');
  drawSpells(); drawQuest();
  later(0.6, () => toast('지팡이 가게(왼쪽)의 버들 할아버지를 찾아가요!', 4));
}
$('start').onclick = (e) => { e.stopPropagation(); start(); };

// ───────── 매 프레임 ─────────
const lookAt = new THREE.Vector3(), camWant = new THREE.Vector3();
let last = performance.now(), T = 0, nearT = 0, fpsN = 0, fpsT = 0, slowT = 0, preDrop = null, capped = false;
function update(dt) {
  T += dt;
  if (castCd > 0) castCd -= dt;
  if (toastT > 0 && (toastT -= dt) <= 0) toastEl.classList.remove('on');
  for (const k in FX) if (FX[k] > 0) FX[k] = Math.max(0, FX[k] - dt);
  if (castQ) { castQ = false; if (started && !busyUI) cast(); }

  // 움직이는 것들
  CARPET.a += dt * (CARPET.boost > 0 ? 0.9 : 0.28); if (CARPET.boost > 0) CARPET.boost -= dt;
  const ox = CARPET.x, oz = CARPET.z; CARPET.x = Math.sin(CARPET.a) * 7.2; CARPET.z = 4 + Math.cos(CARPET.a) * 7.2;
  carpet.position.set(CARPET.x, 0.43 + Math.sin(T * 2) * 0.03, CARPET.z); carpet.rotation.y = CARPET.a + Math.PI / 2;
  Object.assign(CARPET.sol, { x0: CARPET.x - 1.0, x1: CARPET.x + 1.0, z0: CARPET.z - 1.0, z1: CARPET.z + 1.0 });
  if (P.ground && P.src === CARPET.sol) { P.x += CARPET.x - ox; P.z += CARPET.z - oz; }
  for (const C of CRATES) { const want = C.lvl * 1.3; C.y += (want - C.y) * Math.min(1, dt * 3); C.m.position.y = C.y + 0.6 + (C.lvl ? Math.sin(T * 2 + C.x) * 0.04 : 0); C.sol.y0 = C.y; C.sol.y1 = C.y + 1.2; C.m.rotation.y = C.lvl ? Math.sin(T + C.x) * 0.05 : 0;
    if (P.ground && P.src === C.sol && Math.abs(want - C.y) > 0.01) P.y = C.sol.y1; }
  if (frozenT > 0) { frozenT -= dt; if (frozenT <= 0) { ice.visible = false; toast('얼음이 다 녹았어요!', 2); } else if (frozenT < 8) ice.material.opacity = 1; }
  ice.material.transparent = frozenT > 0 && frozenT < 8; ice.material.opacity = frozenT < 8 ? 0.4 + 0.5 * Math.abs(Math.sin(T * 6)) : 1;
  water.material.color.setHSL(0.58, 0.6, 0.5 + Math.sin(T * 1.3) * 0.04);
  fWater.material.color.offsetHSL(0, 0, 0);
  fTop.position.y = 2.75 + Math.sin(T * 1.8) * 0.12; fTop.rotation.y += dt;
  if (Math.random() < 0.5) emit((Math.random() - 0.5) * 0.4, 2.9, 4 + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.6, 2.4, (Math.random() - 0.5) * 1.6, 0x9fe6ff, 1.0, -6);
  for (const T0 of TORCHES) if (T0.lit) { T0.f.scale.setScalar(1.5 + Math.sin(T * 13 + T0.x) * 0.15); if (Math.random() < 0.2) emit(T0.x, 3.1, T0.z, 0, 1.2, 0, 0xff9a3c, 0.5, 0); }
  if (fire.visible) { fire.scale.setScalar(5 + Math.sin(T * 9) * 0.5); if (Math.random() < 0.6) emit((Math.random() - 0.5), 17.4, -40.6 + (Math.random() - 0.5), 0, 3, 0, 0xff8a2c, 0.8, 0); }
  for (const s of SCROLLS) if (!s.got) { s.g.position.y = s.y + Math.sin(T * 2 + s.x) * 0.15; s.g.rotation.y += dt * 1.5; }
  seedGlow.material.opacity = 0.6 + Math.sin(T * 3) * 0.3;
  ledgeMark.material.opacity = 0.5 + Math.sin(T * 3) * 0.3; topMark.material.opacity = ledgeMark.material.opacity;
  for (const O of OWLS) { O.a += dt * O.s; O.g.position.set(TOWER.x + Math.sin(O.a) * O.r, O.h + Math.sin(T * 2 + O.a) * 0.5, TOWER.z + Math.cos(O.a) * O.r); O.g.rotation.y = O.a + Math.PI / 2; const f = Math.sin(T * 10 + O.a) * 0.6; O.wl.rotation.z = f; O.wr.rotation.z = -f; }
  for (let i = 0; i < CN; i++) { const [x, y, z, ph] = CPOS[i], yy = y + Math.sin(T * 1.2 + ph) * 0.25; _m.makeTranslation(x, yy, z); candle.setMatrixAt(i, _m); _m.makeTranslation(x, yy + 0.3 + Math.sin(T * 15 + ph) * 0.02, z); flame.setMatrixAt(i, _m); }
  candle.instanceMatrix.needsUpdate = true; flame.instanceMatrix.needsUpdate = true;
  for (const N of NPCS) {
    if (N.float > 0) { N.float -= dt; N.g.position.y = Math.sin(Math.min(1, (2.5 - N.float) / 0.4) * Math.PI / 2) * 1.4 * Math.min(1, N.float / 0.5); }
    if (!N.path) continue;
    if (busyUI === 'dlg' && Math.hypot(P.x - N.g.position.x, P.z - N.g.position.z) < 3) continue;
    if (N.wait > 0) { N.wait -= dt; continue; }
    const [tx, tz] = N.path[N.pi], dx = tx - N.g.position.x, dz = tz - N.g.position.z, d = Math.hypot(dx, dz);
    if (d < 0.2) { N.pi = (N.pi + 1) % N.path.length; N.wait = 1 + Math.random() * 2; continue; }
    N.g.position.x += dx / d * 1.3 * dt; N.g.position.z += dz / d * 1.3 * dt; N.g.rotation.y = Math.atan2(dx, dz);
  }
  if (fireworks > 0) { fireworks -= dt; if (Math.random() < dt * 3) { const x = (Math.random() - 0.5) * 40, z = -40 + (Math.random() - 0.5) * 30, y = 24 + Math.random() * 10; burst(x, y, z, [0xff6b9a, 0xffd66b, 0x7fd8ff, 0x8de08a, 0xd6a8ff][Math.floor(Math.random() * 5)], 60, 7, -3); } }

  // 플레이어
  if (rideA) {
    rideA.t += dt / 2.2; const k = Math.min(1, rideA.t), e = k * k * (3 - 2 * k);
    P.x = rideA.x0 + (rideA.x - rideA.x0) * e; P.z = rideA.z0 + (rideA.z - rideA.z0) * e; P.y = rideA.y0 + (rideA.y - rideA.y0) * e + Math.sin(k * Math.PI) * 1.5; P.vy = 0;
    if (Math.random() < 0.8) emit(P.x, P.y, P.z, (Math.random() - 0.5) * 2, 0.5, (Math.random() - 0.5) * 2, 0xd6a8ff, 0.6, 0);
    if (k >= 1) { rideA = null; P.ground = true; if (P.y > 3 && QS.step === 4) advance(4); }
  } else if (started) {
    let ix = 0, iz = 0;
    if (!busyUI) {
      if (keys.has('KeyW') || keys.has('ArrowUp')) iz += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1; if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
    }
    let tsp = 0;
    if (!ix && !iz && TOUCH.m > 0 && !busyUI) { ix = TOUCH.mx; iz = TOUCH.my; tsp = TOUCH.m >= 0.92 ? 7.5 : 4.2 * clamp((TOUCH.m - 0.15) / 0.6, 0.3, 1); }
    const fx = -Math.sin(CAM.yaw), fz = -Math.cos(CAM.yaw), rx = -fz, rz = fx;
    let vx = fx * iz + rx * ix, vz = fz * iz + rz * ix; const L = Math.hypot(vx, vz);
    const run = tsp ? tsp > 7 : keys.has('ShiftLeft') || keys.has('ShiftRight');
    if (L > 0) {
      const sp = (tsp || (run ? 7.5 : 4.2)) * (FX.speed > 0 ? 1.6 : 1) * dt; vx /= L; vz /= L;
      const nx = P.x + vx * sp, nz = P.z + vz * sp;
      if (!blocked(nx, P.z, P.y)) P.x = nx; if (!blocked(P.x, nz, P.y)) P.z = nz;
      P.yaw += Math.atan2(Math.sin(Math.atan2(vx, vz) - P.yaw), Math.cos(Math.atan2(vx, vz) - P.yaw)) * Math.min(1, dt * 12);
    }
    if (jumpT > 0) jumpT -= dt; if (TOUCH.jumpT > 0) TOUCH.jumpT -= dt;
    if (!busyUI && (keys.has('Space') || TOUCH.jump || jumpT > 0 || TOUCH.jumpT > 0) && P.ground) { P.vy = FX.jump > 0 ? 8.6 : 5.2; P.ground = false; jumpT = 0; TOUCH.jumpT = 0; }
    P.vy -= 14 * dt; const y0 = P.y; P.y += P.vy * dt;
    const [g, src] = groundAt(P.x, P.z, Math.max(y0, P.y));
    if (P.y <= g) { P.y = g; P.vy = 0; P.ground = true; P.src = src; } else { P.ground = false; P.src = null; }
    if (P.ground && P.y < 0.05 && inPond(P.x, P.z) && frozenT <= 0) {
      burst(P.x, 0.3, P.z, 0x7fd8ff, 50, 3); P.x = 13.2; P.z = -20; P.y = 0; CAM.yaw = -Math.PI / 2; toast('첨벙! 💦 연못은 그냥 건널 수 없어요. 얼려 볼까요?', 3.5);
    }
    if (P.y < -5) { P.x = 0; P.z = 17; P.y = 0; }
  }
  me.position.set(P.x, P.y, P.z); me.rotation.y = P.yaw;
  me.children[0].material.color.setHex(FX.frog > 0 ? 0x5fbf3a : 0x7a4cff);
  const moving = started && (keys.size || TOUCH.m > 0) && !busyUI;
  me.position.y += moving && P.ground ? Math.abs(Math.sin(T * 10)) * 0.06 : 0;
  blobShadow.position.set(P.x, groundAt(P.x, P.z, P.y + 0.01)[0] + 0.03, P.z);
  meGlow.visible = FX.glow > 0; meGlow.position.set(P.x, P.y + 1, P.z); if (FX.glow > 0 && Math.random() < 0.4) emit(P.x + (Math.random() - 0.5) * 0.6, P.y + 0.2, P.z + (Math.random() - 0.5) * 0.6, 0, 0.8, 0, [0xfff3a0, 0xff9bd2, 0x9fe6ff][Math.floor(Math.random() * 3)], 0.9, 0);
  wandTip.material.color.setHex(SPELLS[spell].c);

  if ((nearT -= dt) <= 0) { nearT = 0.15; nearTick(); }
  if (NET && started) { NET.tick(dt, { x: P.x, y: P.y, z: P.z, h: P.yaw }); if ((whoT -= dt) <= 0) { whoT = 2; drawWho(); } }
  boltTick(dt); partTick(dt); twTick(dt);

  // 효과 칩
  const ch = []; if (FX.jump > 0) ch.push('🦘 높이뛰기 ' + Math.ceil(FX.jump)); if (FX.speed > 0) ch.push('⚡ 바람 ' + Math.ceil(FX.speed)); if (FX.glow > 0) ch.push('🌟 반짝 ' + Math.ceil(FX.glow)); if (FX.frog > 0) ch.push('🐸 개구리색 ' + Math.ceil(FX.frog)); if (frozenT > 0) ch.push('❄️ 연못 얼음 ' + Math.ceil(frozenT));
  const html = ch.map((t) => '<div class="chip">' + t + '</div>').join(''); if (html !== chipsHTML) { chipsHTML = html; $('chips').innerHTML = html; }

  // 카메라
  const hx = P.x, hy = P.y + 1.4, hz = P.z;
  let d = started ? CAM.dist : 16;
  const yaw = started ? CAM.yaw : T * 0.08, pitch = started ? CAM.pitch : 0.42;
  for (let k = 1; k <= 6; k++) { const t = d * k / 6, x = hx + Math.sin(yaw) * Math.cos(pitch) * t, y = hy + Math.sin(pitch) * t, z = hz + Math.cos(yaw) * Math.cos(pitch) * t;
    if (y < 0.3 || blockedCam(x, y, z)) { d = Math.max(1.2, t - d / 6); break; } }
  camWant.set(hx + Math.sin(yaw) * Math.cos(pitch) * d, Math.max(0.35, hy + Math.sin(pitch) * d), hz + Math.cos(yaw) * Math.cos(pitch) * d);
  camera.position.lerp(camWant, started ? 1 - Math.exp(-dt * 14) : 0.05);
  lookAt.set(hx, hy, hz); camera.lookAt(lookAt);
  if (started && !QS.done) { const [tx, tz] = STEPS[QS.step].at, a = Math.atan2(tx - P.x, tz - P.z), ca = Math.atan2(-Math.sin(CAM.yaw), -Math.cos(CAM.yaw)); $('arrow').style.transform = 'rotate(' + (-(a - ca) * 180 / Math.PI) + 'deg)'; }
}
let chipsHTML = '', whoT = 0;
function blockedCam(x, y, z) {
  for (const b of SOL) if (b.y1 > b.y0 && x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y > b.y0 && y < b.y1) return true;
  for (const c of CIR) if (y > c.y0 && y < c.y1 && (x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return true;
  return false;
}

function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  update(dt);
  renderer.render(scene, camera);
  fpsN++; fpsT += dt; if (fpsT > 2) { const fps = fpsN / fpsT;
    if (preDrop) { if (fps < preDrop.fps * 1.1) { dpr = preDrop.dpr; renderer.setPixelRatio(dpr); capped = true; } preDrop = null; }
    else if (!capped && fps < 40 && dpr > 0.75) { slowT++; if (slowT >= 2) { preDrop = { dpr, fps }; dpr = Math.max(0.75, dpr - 0.25); renderer.setPixelRatio(dpr); slowT = 0; } } else slowT = 0;
    window.MAGIC.fps = Math.round(fps); fpsN = 0; fpsT = 0; }
  requestAnimationFrame(frame);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
window.MAGIC = { P, CAM, QS, learned, CRATES, start, cast: () => cast(), cam: () => camera.position.toArray().map((v) => +v.toFixed(2)), castAt: (x, y, z) => { castCd = 0; cast(new THREE.Vector3(x, y, z)); }, act: () => act(), pick: pickSpell, tp: (x, z, y = 0) => { P.x = x; P.z = z; P.y = y; P.vy = 0; }, aim: (yaw, pitch) => { CAM.yaw = yaw; CAM.pitch = pitch; }, near: () => near && near.label, info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, fps: window.MAGIC.fps, dpr }), fps: 0 };
camera.position.set(0, 12, 40);
requestAnimationFrame(frame);
if (new URLSearchParams(location.search).get('start') === '1') start();
