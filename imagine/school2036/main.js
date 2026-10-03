// 물음숲 초등학교 (2036) — 걸어 다니는 상상의 학교
import * as THREE from 'three';
import { SCHOOL, PROMISES, WORDS, SUBJECTS, OPEN_QUESTIONS, SEEDS, PLACES, DAY, DAY_END } from './data.js';

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;
const Q = new URLSearchParams(location.search);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(2036);
const R = (a, b) => a + (b - a) * rnd();
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
const isTouch = matchMedia('(pointer: coarse)').matches;
const FONT = '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';

// ───────── 렌더러·장면 ─────────
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isTouch ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.3, 900);
scene.fog = new THREE.Fog(0xcfe8f7, 90, 330);

const hemi = new THREE.HemisphereLight(0xe4f3ff, 0x7d8f5a, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.25);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -82, right: 82, top: 82, bottom: -82, near: 20, far: 320 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);

// 하늘(그라데이션 돔)
const skyU = { top: { value: new THREE.Color(0x5fa8e8) }, bot: { value: new THREE.Color(0xd8eef9) } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 12), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying float h; void main(){ float k = smoothstep(-0.02, 0.5, h); gl_FragColor = vec4(mix(bot, top, k), 1.0); \n#include <colorspace_fragment>\n }'
}));
sky.renderOrder = -1;
scene.add(sky);

// ───────── 재질·도형 도우미 ─────────
const MC = new Map();
function mat(c, o) {
  const k = c + (o ? JSON.stringify(o) : '');
  let m = MC.get(k);
  if (!m) { m = new THREE.MeshLambertMaterial(Object.assign({ color: c, flatShading: true }, o)); MC.set(k, m); }
  return m;
}
function basic(c, o) {
  const k = 'B' + c + (o ? JSON.stringify(o) : '');
  let m = MC.get(k);
  if (!m) { m = new THREE.MeshBasicMaterial(Object.assign({ color: c }, o)); MC.set(k, m); }
  return m;
}
const GC = new Map();
const geo = (k, f) => { let g = GC.get(k); if (!g) { g = f(); GC.set(k, g); } return g; };
const BOX = (w, h, d) => geo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
const CYL = (a, b, h, s = 10) => geo(`c${a}|${b}|${h}|${s}`, () => new THREE.CylinderGeometry(a, b, h, s));
const ICO = (r, d = 0) => geo(`i${r}|${d}`, () => new THREE.IcosahedronGeometry(r, d));

const LENS = { ai: [], human: [] };
function tag(obj, k) { obj.traverse((m) => { if (m.isMesh) LENS[k].push(m); }); return obj; }

function put(p, g, m, x, y, z, o = {}) {
  const me = new THREE.Mesh(g, m);
  me.position.set(x, y, z);
  if (o.rx) me.rotation.x = o.rx;
  if (o.ry) me.rotation.y = o.ry;
  if (o.rz) me.rotation.z = o.rz;
  if (o.sc) me.scale.set(o.sc[0], o.sc[1], o.sc[2]);
  me.castShadow = o.cast !== false;
  me.receiveShadow = true;
  (p || scene).add(me);
  if (o.tag) tag(me, o.tag);
  return me;
}
const box = (p, w, h, d, c, x, y, z, o = {}) => put(p, BOX(w, h, d), o.m || mat(c), x, y, z, o);
const cyl = (p, a, b, h, s, c, x, y, z, o = {}) => put(p, CYL(a, b, h, s), o.m || mat(c), x, y, z, o);
const blob = (p, r, c, x, y, z, o = {}) => put(p, ICO(r, o.d || 0), o.m || mat(c), x, y, z, o);

function flat(p, w, d, c, x, y, z, o = {}) { // 바닥에 눕힌 판
  const me = put(p, geo(`p${w}|${d}`, () => new THREE.PlaneGeometry(w, d)), o.m || mat(c), x, y, z, { cast: false });
  me.rotation.x = -Math.PI / 2;
  if (o.ry) me.rotation.z = o.ry;
  return me;
}
function disc(p, r, c, x, y, z, seg = 32) {
  const me = put(p, geo(`d${r}|${seg}`, () => new THREE.CircleGeometry(r, seg)), mat(c), x, y, z, { cast: false });
  me.rotation.x = -Math.PI / 2;
  return me;
}

// 글자 스프라이트
function canvasText(lines, o = {}) {
  const fs = o.fs || 44, pad = o.pad ?? 20;
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const font = `${o.weight || 700} ${fs}px ${FONT}`;
  g.font = font;
  const w = Math.max(...lines.map((l) => g.measureText(l).width));
  c.width = Math.ceil(w + pad * 2);
  c.height = Math.ceil(lines.length * fs * 1.28 + pad * 1.3);
  g.font = font;
  const rr = o.round ?? 18;
  g.fillStyle = o.bg || 'rgba(22,44,66,.82)';
  g.beginPath();
  g.moveTo(rr, 0); g.lineTo(c.width - rr, 0); g.quadraticCurveTo(c.width, 0, c.width, rr);
  g.lineTo(c.width, c.height - rr); g.quadraticCurveTo(c.width, c.height, c.width - rr, c.height);
  g.lineTo(rr, c.height); g.quadraticCurveTo(0, c.height, 0, c.height - rr);
  g.lineTo(0, rr); g.quadraticCurveTo(0, 0, rr, 0); g.fill();
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = 5; g.stroke(); }
  g.fillStyle = o.fg || '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, c.width / 2, pad * 0.65 + fs * 1.28 * (i + 0.5)));
  return c;
}
function label(text, o = {}) {
  const c = canvasText(String(text).split('\n'), o);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, depthTest: o.depthTest ?? true, fog: false }));
  const h = o.h || 0.9;
  s.scale.set(h * c.width / c.height, h, 1);
  if (o.depthTest === false) s.renderOrder = 10;
  return s;
}
function texOf(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// 빛무리 텍스처
const GLOW = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

// ───────── 충돌 ─────────
const COL = [];
const colC = (x, z, r) => COL.push({ x, z, r });
const colB = (x0, x1, z0, z1) => COL.push({ x0, x1, z0, z1 });
function pushOut(o, rad) {
  let hit = null;
  for (const c of COL) {
    if (c.r !== undefined) {
      const dx = o.x - c.x, dz = o.z - c.z, rr = c.r + rad, d2 = dx * dx + dz * dz;
      if (d2 < rr * rr) { const d = Math.sqrt(d2) || 1e-4; o.x = c.x + dx / d * rr; o.z = c.z + dz / d * rr; hit = [dx / d, dz / d]; }
    } else if (o.x > c.x0 - rad && o.x < c.x1 + rad && o.z > c.z0 - rad && o.z < c.z1 + rad) {
      const l = o.x - (c.x0 - rad), r = (c.x1 + rad) - o.x, t = o.z - (c.z0 - rad), b = (c.z1 + rad) - o.z, m = Math.min(l, r, t, b);
      if (m === l) { o.x = c.x0 - rad; hit = [-1, 0]; } else if (m === r) { o.x = c.x1 + rad; hit = [1, 0]; }
      else if (m === t) { o.z = c.z0 - rad; hit = [0, -1]; } else { o.z = c.z1 + rad; hit = [0, 1]; }
    }
  }
  return hit;
}

// ───────── 땅·길·둘레 ─────────
const hill = (x, z) => { const r = Math.hypot(x, z); return r < 86 ? 0 : (r - 86) * 0.07 + Math.sin(x * 0.045) * Math.cos(z * 0.037) * (r - 86) * 0.06; };
{
  const g = new THREE.PlaneGeometry(760, 760, 110, 110).toNonIndexed();
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) pos.setY(i, hill(pos.getX(i), pos.getZ(i)));
  for (let i = 0; i < pos.count; i += 3) {
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3, cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const inside = Math.hypot(cx, cz) < 71;
    c.setHSL(inside ? R(0.24, 0.28) : R(0.2, 0.26), inside ? R(0.42, 0.52) : R(0.32, 0.44), inside ? R(0.55, 0.6) : R(0.42, 0.5));
    for (let j = 0; j < 3; j++) col.set([c.r, c.g, c.b], (i + j) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  ground.receiveShadow = true;
  scene.add(ground);
}
// 둥근 길 + 갈래길
{
  const ring = put(null, new THREE.RingGeometry(20.5, 24, 72), mat(0xeadcc0), 0, 0.03, 0, { cast: false });
  ring.rotation.x = -Math.PI / 2;
  for (const k of ['gate', 'path', 'bigq', 'lab', 'window', 'table', 'yard', 'sound']) {
    const [px, pz] = PLACES[k].pos, d = Math.hypot(px, pz), ux = px / d, uz = pz / d;
    const a = 24, b = d - (k === 'gate' ? 1 : k === 'yard' ? 15.4 : PLACES[k].r * 0.6), len = b - a;
    if (len <= 0) continue;
    const m = flat(null, 3.2, len, 0xeadcc0, ux * (a + len / 2), 0.028, uz * (a + len / 2));
    m.rotation.z = Math.atan2(ux, uz);
  }
  disc(null, 6.5, 0xe6d6b4, 0, 0.032, 58.5);
  flat(null, 26, 5.5, 0xd4d1cb, 0, 0.034, 67.75);                    // 보도
  flat(null, 760, 7, 0x6c7178, 0, 0.02, 74);                         // 찻길
  for (let x = -120; x <= 120; x += 6) flat(null, 2.6, 0.18, 0xf2f2f2, x, 0.025, 74);
}
// 울타리 산울타리
{
  const pts = [];
  for (let a = 0; a < TAU; a += 1.5 / 71.5) {
    const x = Math.sin(a) * 71.5, z = Math.cos(a) * 71.5;
    if (z > 62) continue;
    pts.push([x, z, a]);
  }
  const im = new THREE.InstancedMesh(BOX(1.7, 1.25, 1.3), mat(0x4f8a4b), pts.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  pts.forEach(([x, z, a], i) => { e.set(0, a, 0); q.setFromEuler(e); s.set(1, R(0.85, 1.15), 1); p.set(x, 0.6 * s.y, z); m4.compose(p, q, s); im.setMatrixAt(i, m4); });
  im.castShadow = true; im.receiveShadow = true;
  scene.add(im);
}
// 둘레 숲(인스턴스)
function forest(n, rmin, rmax, avoid) {
  const trunk = new THREE.InstancedMesh(CYL(0.25, 0.4, 2.2, 6), mat(0x7a5536), n);
  const crown = new THREE.InstancedMesh(ICO(1, 0), mat(0x4e9a52), n);
  const crown2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 2.2, 7), mat(0x3e7f4a), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let k = 0, tries = 0;
  const hide = new THREE.Matrix4().makeScale(0, 0, 0);
  while (k < n && tries++ < n * 20) {
    const a = rnd() * TAU, r = R(rmin, rmax), x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (avoid && avoid(x, z)) continue;
    const y = hill(x, z), sc = R(1.4, 2.6), pine = rnd() < 0.45;
    s.set(sc, sc, sc); e.set(0, rnd() * TAU, 0); q.setFromEuler(e);
    p.set(x, y + 1.1 * sc, z); m4.compose(p, q, s); trunk.setMatrixAt(k, m4);
    if (pine) { p.set(x, y + 3.2 * sc, z); s.set(sc * 1.3, sc * 1.4, sc * 1.3); m4.compose(p, q, s); crown2.setMatrixAt(k, m4); crown.setMatrixAt(k, hide); }
    else { p.set(x, y + 3.1 * sc, z); s.set(sc * 1.6, sc * 1.4, sc * 1.6); m4.compose(p, q, s); crown.setMatrixAt(k, m4); crown2.setMatrixAt(k, hide); }
    k++;
  }
  for (const im of [trunk, crown, crown2]) { im.count = k; im.castShadow = true; im.receiveShadow = true; scene.add(im); }
}
forest(170, 77, 175, (x, z) => Math.abs(z - 74) < 7);
// 학교 안 나무 몇 그루
const CAMPUS_TREES = [[-58, 18], [-56, -30], [-48, 40], [-20, 48], [22, 50], [52, 34], [60, -6], [56, -38], [20, -54], [-22, -54], [-50, -46], [-62, 0], [14, -9], [-27, 8]];
for (const [x, z] of CAMPUS_TREES) {
  const sc = R(0.9, 1.3);
  cyl(null, 0.22 * sc, 0.34 * sc, 2.4 * sc, 7, 0x7a5536, x, 1.2 * sc, z);
  blob(null, 1.9 * sc, pick([0x5aa85a, 0x6cb95e, 0x4f9a55]), x, 3.4 * sc, z, { d: 0 });
  blob(null, 1.3 * sc, pick([0x5aa85a, 0x7cc46a]), x + 0.8, 4.3 * sc, z - 0.4);
  colC(x, z, 0.45);
}
// 먼 풍차
const BLADES = [];
for (const [x, z] of [[-170, -190], [-120, -215], [150, -200]]) {
  const y = hill(x, z);
  cyl(null, 0.6, 1.1, 30, 8, 0xf2f2f2, x, y + 15, z, { cast: false });
  const hub = new THREE.Group(); hub.position.set(x, y + 30, z + 1.2); scene.add(hub);
  for (let i = 0; i < 3; i++) { const b = box(hub, 1.2, 14, 0.3, 0xffffff, 0, 7, 0, { cast: false }); const piv = new THREE.Group(); piv.rotation.z = i * TAU / 3; piv.add(b); hub.add(piv); }
  BLADES.push(hub);
}
// 구름
const CLOUDS = [];
for (let i = 0; i < 10; i++) {
  const g = new THREE.Group();
  const n = 3 + Math.floor(rnd() * 3);
  for (let j = 0; j < n; j++) blob(g, R(3, 6), 0xffffff, j * 4.2 - n * 2, R(-0.5, 1), R(-1.5, 1.5), { cast: false, m: basic(0xffffff, { transparent: true, opacity: 0.92 }) });
  g.position.set(R(-200, 200), R(55, 80), R(-200, 120));
  g.userData.v = R(0.6, 1.4);
  scene.add(g);
  CLOUDS.push(g);
}

// ───────── 장소 짓기 ─────────
const LABELS = [];      // 장소 이름표 (눌러서 살펴보기)
const LENS_LABELS = [];
function placeLabel(k, y) {
  const P = PLACES[k];
  const s = label(P.name, { h: 1.25, bg: 'rgba(255,255,255,.92)', fg: '#1d3557', depthTest: false, border: 'rgba(29,53,87,.18)' });
  s.position.set(P.pos[0], y, P.pos[1]);
  s.userData.place = k;
  scene.add(s); LABELS.push(s);
  const a = label('AI  ·  ' + P.ai, { h: 0.85, fs: 36, bg: 'rgba(16,80,120,.92)', fg: '#bff0ff', depthTest: false });
  const h = label('사람  ·  ' + P.human, { h: 0.85, fs: 36, bg: 'rgba(140,70,10,.92)', fg: '#ffe6c7', depthTest: false });
  a.position.set(P.pos[0], y - 1.15, P.pos[1]); h.position.set(P.pos[0], y - 2.1, P.pos[1]);
  a.visible = h.visible = false;
  scene.add(a, h); LENS_LABELS.push(a, h);
}

// 물음나무
const TREE = { leaves: null, foliage: new THREE.Group(), seedLabels: [] };
{
  const [cx, cz] = PLACES.tree.pos;
  cyl(null, 1.25, 2.3, 9, 9, 0x6e4a2f, cx, 4.5, cz);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; blob(null, 1.1, 0x6e4a2f, cx + Math.sin(a) * 2.1, 0.25, cz + Math.cos(a) * 2.1, { sc: [1.4, 0.45, 1], ry: a }); }
  const br = [[0.9, 7.8, 0.4, 0.9], [-0.8, 8.2, -0.6, -0.8], [0.2, 8.6, -1.1, 0.4]];
  for (const [x, y, z, r] of br) cyl(null, 0.35, 0.6, 4.2, 7, 0x6e4a2f, cx + x * 1.6, y, cz + z * 1.6, { rz: -r * 0.6, rx: z * 0.4 });
  const blobs = [[0, 12.8, 0, 5.4], [4.4, 11.2, 1.5, 3.9], [-4.3, 11.4, -1, 4.1], [1.4, 11, -4.2, 3.7], [-1.6, 10.9, 4.1, 3.8], [3.1, 14.6, -1.6, 3.2], [-2.8, 14.4, 1.8, 3.2]];
  const greens = [0x5fae57, 0x6bbd5d, 0x52a053, 0x78c463];
  for (const [x, y, z, r] of blobs) blob(TREE.foliage, r, pick(greens), cx + x, y, cz + z, { d: 1 });
  scene.add(TREE.foliage);
  // 물음 씨앗(빛나는 쪽지)
  const N = 110, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.46), basic(0xfff0b0, { side: THREE.DoubleSide }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const [x, y, z, r] = pick(blobs);
    v.set(R(-1, 1), R(-1, 0.25), R(-1, 1)).normalize();
    p.set(cx + x + v.x * r * 1.02, y + v.y * r * 1.02, cz + z + v.z * r * 1.02);
    e.set(R(-0.3, 0.3), rnd() * TAU, R(-0.3, 0.3)); q.setFromEuler(e); m4.compose(p, q, s); im.setMatrixAt(i, m4);
  }
  im.castShadow = false;
  tag(im, 'human');
  TREE.leaves = im; scene.add(im);
  // 둥근 벤치
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; box(null, 2.7, 0.12, 0.7, 0xb98a5c, cx + Math.sin(a) * 6.5, 0.45, cz + Math.cos(a) * 6.5, { ry: a, tag: 'human' }); box(null, 0.4, 0.42, 0.4, 0x8a6544, cx + Math.sin(a) * 6.5, 0.21, cz + Math.cos(a) * 6.5, { ry: a }); }
  box(null, 0.9, 0.6, 0.6, 0xd9b26f, cx + 2.6, 0.3, cz + 1.6, { ry: 0.5, tag: 'human' });   // 찾은 물음 상자
  // 읽을 수 있는 물음 쪽지
  SEEDS.forEach((t, i) => {
    const a = i / SEEDS.length * TAU + 0.2;
    const s2 = label(t, { h: 0.5, fs: 34, bg: 'rgba(255,246,206,.96)', fg: '#5a3e1b', pad: 14, round: 8 });
    s2.position.set(cx + Math.sin(a) * 5.4, 6.6 + (i % 3) * 0.55, cz + Math.cos(a) * 5.4);
    s2.userData.base = s2.position.y; scene.add(s2); TREE.seedLabels.push(s2);
  });
  colC(cx, cz, 7);
  placeLabel('tree', 17.5);
}

// 반디 둥지
const NEST = [];
{
  const [cx, cz] = PLACES.nest.pos, g = new THREE.Group();
  cyl(g, 0.7, 0.95, 10, 10, 0xf3f5f7, 0, 5, 0);
  for (let i = 0; i < 4; i++) cyl(g, 1.25, 1.25, 0.12, 12, 0xd8e4ec, 0, 2 + i * 2.2, 0);
  blob(g, 0.7, 0, 0, 10.5, 0, { m: basic(0x7fe6ff), cast: false, d: 1 });
  for (let i = 0; i < 30; i++) blob(g, 0.13, 0, Math.sin(i * 0.75) * 0.82, 1.4 + i * 0.28, Math.cos(i * 0.75) * 0.82, { m: basic(0x30475e), cast: false });
  g.position.set(cx, 0, cz); scene.add(g); tag(g, 'ai');
  for (let i = 0; i < 40; i++) NEST.push(new THREE.Vector3(cx + Math.sin(i * 0.75) * 1.25, 1.5 + i * 0.22, cz + Math.cos(i * 0.75) * 1.25));
  colC(cx, cz, 1.4);
  placeLabel('nest', 12.6);
}

// 나의 길 방 (지붕만 있는 둥근 방 8개)
const PODS = [];
const HOLOS = [];
{
  const [cx, cz] = PLACES.path.pos;
  const dome = new THREE.SphereGeometry(2.1, 12, 5, 0, TAU, 0, Math.PI / 2);
  disc(null, 3.1, 0xf6d98b, cx, 0.035, cz, 24);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + 0.2, px = cx + Math.sin(a) * 6.6, pz = cz + Math.cos(a) * 6.6;
    PODS.push({ x: px, z: pz, a });
    cyl(null, 2.1, 2.1, 0.06, 14, pick([0xbfe8d6, 0xcfe3f7, 0xf7d9e3, 0xe4dcf7]), px, 0.03, pz, { cast: false });
    for (let j = 0; j < 3; j++) { const b = a + j / 3 * TAU + 0.5; box(null, 0.12, 2.35, 0.12, 0xdfe6ea, px + Math.sin(b) * 1.95, 1.17, pz + Math.cos(b) * 1.95); }
    put(null, dome, mat(0xf4f7f6, { side: THREE.DoubleSide }), px, 2.3, pz, { sc: [1, 0.55, 1] });
    cyl(null, 2.12, 2.12, 0.14, 14, pick([0x8fd3b6, 0x8fb8e3, 0xf2a0b8, 0xb59fe6]), px, 2.3, pz);
    box(null, 0.85, 0.07, 0.85, 0xeee3d0, px, 0.72, pz, { tag: 'human' });
    cyl(null, 0.05, 0.05, 0.7, 6, 0x9aa5ad, px, 0.36, pz);
    for (const sgn of [1, -1]) cyl(null, 0.22, 0.22, 0.42, 10, 0xff9f6b, px + Math.sin(a) * 0.75 * sgn, 0.21, pz + Math.cos(a) * 0.75 * sgn, { tag: 'human' });
    const h = put(null, geo('holo', () => new THREE.PlaneGeometry(0.62, 0.42)), basic(0x58e1ff, { transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }), px, 1.22, pz, { cast: false, ry: a + Math.PI / 2, tag: 'ai' });
    HOLOS.push(h);
  }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; cyl(null, 0.38, 0.38, 0.2, 10, pick([0xff8fa3, 0x8ecae6, 0xffd166, 0xa0e8af]), cx + Math.sin(a) * 2.3, 0.1, cz + Math.cos(a) * 2.3, { tag: 'human' }); }
  placeLabel('path', 5.6);
}

// 큰물음 작업장
const BQ_TABLES = [];
let MAPTEX;
{
  const [cx, cz] = PLACES.bigq.pos;
  box(null, 19, 0.05, 13, 0xcda57a, cx, 0.025, cz, { cast: false });
  box(null, 21, 0.3, 15, 0x7cb07f, cx, 4.6, cz);
  for (const x of [-10, 0, 10]) for (const z of [-7, 7]) box(null, 0.35, 4.5, 0.35, 0x8d6748, cx + x, 2.25, cz + z);
  for (let i = 0; i < 6; i++) box(null, 3, 0.1, 2.2, 0x23446b, cx - 7 + (i % 3) * 7, 4.85, cz - 3.5 + Math.floor(i / 3) * 7, { rx: -0.18 });
  const things = [
    (x, z) => { cyl(null, 0.14, 0.14, 0.3, 8, 0x6ec6ff, x - 0.6, 1.05, z, { tag: 'human' }); cyl(null, 0.14, 0.14, 0.3, 8, 0x8fd18f, x - 0.2, 1.05, z + 0.2, { tag: 'human' }); box(null, 0.9, 0.05, 0.6, 0xf5f0e6, x + 0.6, 0.93, z, { tag: 'human' }); },
    (x, z) => { box(null, 1.8, 0.12, 0.7, 0x8a5a3c, x, 0.96, z); box(null, 1.6, 0.04, 0.22, 0x3fa9f5, x, 1.04, z, { ry: 0.15, tag: 'human' }); },
    (x, z) => { for (let i = 0; i < 4; i++) box(null, 1.4, 0.06, 0.18, 0xd9b48a, x, 0.95 + i * 0.06, z - 0.3 + i * 0.05, { ry: i * 0.1, tag: 'human' }); box(null, 0.4, 0.08, 0.1, 0x9aa5ad, x + 0.7, 0.96, z + 0.3); },
    (x, z) => { box(null, 0.7, 0.45, 0.5, 0xb7c9d6, x - 0.5, 1.13, z, { tag: 'ai' }); box(null, 0.5, 0.3, 0.05, 0x58e1ff, x - 0.5, 1.15, z + 0.26, { m: basic(0x58e1ff), tag: 'ai' }); box(null, 0.6, 0.04, 0.45, 0xf5f0e6, x + 0.6, 0.93, z, { tag: 'human' }); }
  ];
  [[-4.5, -3], [4.5, -3], [-4.5, 3], [4.5, 3]].forEach(([dx, dz], i) => {
    const x = cx + dx, z = cz + dz;
    box(null, 2.6, 0.1, 1.3, 0xd8b48a, x, 0.85, z, { tag: 'human' });
    for (const [lx, lz] of [[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.5], [1.15, 0.5]]) box(null, 0.1, 0.8, 0.1, 0x8d6748, x + lx, 0.4, z + lz);
    things[i](x, z);
    BQ_TABLES.push([x, z]);
  });
  // 냄새 지도 판 (반디가 그림)
  const c = document.createElement('canvas'); c.width = 512; c.height = 300;
  const g = c.getContext('2d');
  g.fillStyle = '#e8f3d6'; g.fillRect(0, 0, 512, 300);
  g.strokeStyle = '#3a8fd6'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, 60); g.bezierCurveTo(160, 20, 150, 220, 300, 180); g.bezierCurveTo(420, 150, 430, 260, 510, 270); g.stroke();
  for (const [x, y, r] of [[210, 150, 22], [330, 178, 30], [450, 220, 18]]) { g.fillStyle = 'rgba(230,80,60,.35)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  g.fillStyle = '#1d3557'; g.font = `700 34px ${FONT}`; g.fillText('개울 냄새 지도', 18, 44);
  g.font = `600 22px ${FONT}`; g.fillText('냄새 강함', 300, 140); g.fillText('물이 고인 곳?', 360, 250);
  g.fillStyle = '#2e7dd6'; g.beginPath(); g.arc(495, 18, 8, 0, TAU); g.fill();   // 파란 점 — 반디가 도움
  MAPTEX = texOf(c);
  box(null, 4.2, 2.6, 0.12, 0x5a4636, cx, 1.9, cz - 6.2);
  put(null, geo('mapP', () => new THREE.PlaneGeometry(4, 2.35)), new THREE.MeshBasicMaterial({ map: MAPTEX }), cx, 1.9, cz - 6.13, { cast: false, tag: 'ai' });
  for (const sx of [-1.8, 1.8]) box(null, 0.12, 0.7, 0.12, 0x5a4636, cx + sx, 0.35, cz - 6.2);
  // 3D 프린터·상자
  box(null, 1, 1.2, 1, 0xe7ecef, cx + 8.4, 0.6, cz + 5, { tag: 'ai' });
  box(null, 0.7, 0.5, 0.05, 0, cx + 8.4, 0.75, cz + 5.51, { m: basic(0x58e1ff), cast: false, tag: 'ai' });
  for (let i = 0; i < 4; i++) box(null, 0.8, 0.6, 0.8, 0xb38b5d, cx - 8.5 + (i % 2) * 0.9, 0.3 + Math.floor(i / 2) * 0.6, cz + 5, { tag: 'human' });
  placeLabel('bigq', 6.6);
}

// 진짜 실험실
const LAB_TABLES = [];
{
  const [cx, cz] = PLACES.lab.pos;
  box(null, 13, 0.05, 10, 0xcfe3ea, cx, 0.025, cz, { cast: false });
  box(null, 14, 0.2, 11, 0xf4f7f8, cx, 3.7, cz);
  for (const x of [-6.6, 0, 6.6]) for (const z of [-5, 5]) box(null, 0.25, 3.6, 0.25, 0xb9c6cc, cx + x, 1.8, cz + z);
  [[-3.2, -2.4], [3.2, -2.4], [-3.2, 2.4], [3.2, 2.4]].forEach(([dx, dz], i) => {
    const x = cx + dx, z = cz + dz;
    box(null, 1.8, 0.08, 1.1, 0xfafafa, x, 0.9, z, { tag: 'human' });
    box(null, 1.6, 0.86, 0.9, 0xcfd8dc, x, 0.43, z);
    const cols = [0xff6b6b, 0x4dabf7, 0x69db7c];
    cols.forEach((c, j) => cyl(null, 0.09, 0.11, 0.26, 10, 0, x - 0.5 + j * 0.25, 1.07, z - 0.2, { m: mat(c, { transparent: true, opacity: 0.75 }), tag: 'human' }));
    box(null, 0.5, 0.05, 0.36, 0xff922b, x + 0.5, 0.97, z + 0.2, { tag: 'human' });   // 다른 점 공책
    const h = blob(null, 0.32, 0, x, 1.75, z, { m: basic(0x58e1ff, { wireframe: true }), cast: false, tag: 'ai' });
    HOLOS.push(h);
    LAB_TABLES.push([x, z]);
  });
  placeLabel('lab', 5.4);
}

// 세계 창문
const SCREEN = { c: document.createElement('canvas'), tex: null, live: null };
{
  const [cx, cz] = PLACES.window.pos;
  SCREEN.c.width = 768; SCREEN.c.height = 288;
  SCREEN.tex = texOf(SCREEN.c);
  box(null, 15, 6, 0.5, 0x2d3142, cx, 3, cz - 6);
  put(null, geo('scr', () => new THREE.PlaneGeometry(14, 5.25)), new THREE.MeshBasicMaterial({ map: SCREEN.tex }), cx, 3.1, cz - 5.74, { cast: false, tag: 'ai' });
  for (const s of [1, -1]) box(null, 3, 6, 0.5, 0x2d3142, cx + s * 8.9, 3, cz - 4.9, { ry: -s * 0.6 });
  box(null, 15, 0.04, 8, 0xeedcc6, cx, 0.02, cz + 0.1, { cast: false });
  const cc = [0xff8fa3, 0x8ecae6, 0xffd166, 0xa0e8af, 0xcdb4db];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) cyl(null, 0.38, 0.38, 0.18, 10, cc[(r + i) % cc.length], cx - 5 + i * 2, 0.09, cz - 2.4 + r * 1.6, { tag: 'human' });
  colB(cx - 9.5, cx + 9.5, cz - 6.6, cz - 5.3);
  colC(cx + 8.9, cz - 4.9, 1.2); colC(cx - 8.9, cz - 4.9, 1.2);
  placeLabel('window', 7.6);
}
function drawScreen(live, t) {
  const g = SCREEN.c.getContext('2d'), W = 768, H = 288;
  if (live) {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(0.55, '#e3f6ff'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(650, 70, 34, 0, TAU); g.fill();
    g.fillStyle = '#2a9df4'; g.fillRect(0, 150, W, 60);
    g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 9; i++) g.fillRect(((i * 97 + t * 30) % (W + 60)) - 60, 165 + (i % 3) * 14, 50, 3);
    g.fillStyle = '#f3d59c'; g.fillRect(0, 205, W, 83);
    g.fillStyle = '#f7f1e3'; g.fillRect(40, 110, 150, 100); g.fillStyle = '#e07a5f'; g.beginPath(); g.moveTo(30, 112); g.lineTo(115, 70); g.lineTo(200, 112); g.fill();
    g.strokeStyle = '#7a5536'; g.lineWidth = 8; g.beginPath(); g.moveTo(700, 270); g.quadraticCurveTo(690, 190, 715, 140); g.stroke();
    g.fillStyle = '#3f8f4f'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(715 + Math.cos(i * 1.3) * 26, 140 + Math.sin(i * 1.3) * 12, 32, 9, i * 1.3, 0, TAU); g.fill(); }
    const kc = ['#ff8a80', '#4cc9f0', '#ffd166', '#06d6a0', '#b388ff', '#f28482'];
    for (let i = 0; i < 6; i++) {
      const x = 250 + i * 70, y = 250, sk = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d'][i % 4];
      g.fillStyle = kc[i]; g.fillRect(x - 14, y - 46, 28, 40);
      g.fillStyle = sk; g.beginPath(); g.arc(x, y - 60, 15, 0, TAU); g.fill();
      g.strokeStyle = sk; g.lineWidth = 7; g.lineCap = 'round';
      const w = Math.sin(t * 6 + i) * 0.5;
      g.beginPath(); g.moveTo(x + 13, y - 40); g.lineTo(x + 13 + Math.sin(2.4 + w) * 26, y - 40 - Math.cos(2.4 + w) * -26 - 30); g.stroke();
      g.fillStyle = '#334'; g.fillRect(x - 12, y - 6, 9, 22); g.fillRect(x + 3, y - 6, 9, 22);
    }
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(14, 12, 380, 40);
    g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(34, 32, 8, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.font = `700 22px ${FONT}`; g.fillText('연결 중 · 지구 반대편 바닷가 학교', 50, 40);
  } else {
    g.fillStyle = '#16233a'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(120,200,255,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, H / 2 + 10, 90, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(W / 2, H / 2 + 10, 40, 90, 0, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(W / 2 - 90, H / 2 + 10); g.lineTo(W / 2 + 90, H / 2 + 10); g.stroke();
    for (let i = 0; i < 9; i++) { const a = i * 0.7 + t * 0.4; g.fillStyle = 'rgba(255,220,120,.9)'; g.beginPath(); g.arc(W / 2 + Math.cos(a) * 70, H / 2 + 10 + Math.sin(a * 1.3) * 60, 4, 0, TAU); g.fill(); }
    g.fillStyle = '#cfe9ff'; g.font = `700 26px ${FONT}`; g.textAlign = 'center'; g.fillText('세계 창문 — 다음 연결 13:10', W / 2, 40); g.textAlign = 'left';
  }
  SCREEN.tex.needsUpdate = true;
}

// 함께 밥상 · 로봇 주방 · 빛 농장 · 텃밭
const ROBOT_ARMS = [], BOTS = [];
const DINE_TABLES = [-31.8, -28.2];
{
  const [cx, cz] = PLACES.table.pos;
  for (const x of [-6.5, 0, 6.5]) for (const z of [-3.8, 3.8]) box(null, 0.22, 3.1, 0.22, 0x8d6748, cx + x, 1.55, cz + z);
  for (const z of [-3.8, 3.8]) box(null, 13.4, 0.2, 0.22, 0x8d6748, cx, 3.12, cz + z);
  for (let i = 0; i < 7; i++) box(null, 0.16, 0.12, 8, 0xa17a55, cx - 6 + i * 2, 3.26, cz);
  for (let i = 0; i < 14; i++) blob(null, R(0.45, 0.7), pick([0x5aa85a, 0x6cbf5e, 0x4f9a55]), cx + R(-6.2, 6.2), 3.45, cz + R(-3.6, 3.6), { cast: true });
  for (const tz of DINE_TABLES) {
    box(null, 7, 0.08, 1.1, 0xe8d2b0, cx, 0.74, tz, { tag: 'human' });
    for (const lx of [-3.2, 0, 3.2]) box(null, 0.12, 0.7, 0.8, 0x8d6748, cx + lx, 0.35, tz);
    for (const s of [-1, 1]) { box(null, 7, 0.08, 0.36, 0xc9a77c, cx, 0.45, tz + s * 0.8, { tag: 'human' }); for (const lx of [-3, 3]) box(null, 0.1, 0.42, 0.3, 0x8d6748, cx + lx, 0.21, tz + s * 0.8); }
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { cyl(null, 0.18, 0.15, 0.03, 12, 0xffffff, cx - 2.5 + i, 0.8, tz + s * 0.3, { cast: false }); blob(null, 0.08, 0x7cc46a, cx - 2.5 + i, 0.85, tz + s * 0.3, { cast: false }); }
  }
  // 로봇 주방
  const kz = cz - 9.5;
  box(null, 9, 3.4, 4, 0xf6f3ee, cx, 1.7, kz);
  box(null, 9.4, 0.3, 4.4, 0x7cb07f, cx, 3.55, kz);
  put(null, geo('kwin', () => new THREE.PlaneGeometry(6, 1.6)), basic(0x2e4a66), cx, 1.9, kz + 2.01, { cast: false, tag: 'ai' });
  box(null, 6, 1, 0.8, 0xc9d1d6, cx, 0.5, kz + 2.6);
  for (const s of [-1.6, 1.6]) {
    const base = new THREE.Group(); base.position.set(cx + s, 1, kz + 2.6); scene.add(base);
    cyl(base, 0.22, 0.28, 0.25, 10, 0xe4e9ec, 0, 0.12, 0);
    const j1 = new THREE.Group(); j1.position.y = 0.25; base.add(j1);
    box(j1, 0.16, 0.9, 0.16, 0xf2f5f7, 0, 0.45, 0);
    const j2 = new THREE.Group(); j2.position.y = 0.9; j1.add(j2);
    box(j2, 0.13, 0.7, 0.13, 0xf2f5f7, 0, 0.35, 0);
    blob(j2, 0.1, 0, 0, 0.72, 0, { m: basic(0x58e1ff), cast: false });
    tag(base, 'ai');
    ROBOT_ARMS.push({ j1, j2, ph: s });
  }
  cyl(null, 0.32, 0.3, 0.4, 12, 0x9aa5ad, cx - 0.4, 1.2, kz + 2.6); cyl(null, 0.28, 0.26, 0.32, 12, 0xb0b8bf, cx + 0.5, 1.16, kz + 2.5);
  colB(cx - 4.5, cx + 4.5, kz - 2, kz + 3);
  // 나르는 로봇 둘
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group();
    box(g, 0.55, 0.45, 0.7, 0xf2f5f7, 0, 0.32, 0);
    blob(g, 0.2, 0, 0, 0.62, 0, { m: basic(0x58e1ff), cast: false });
    box(g, 0.5, 0.04, 0.6, 0xd9d9d9, 0, 0.56, 0);
    tag(g, 'ai'); scene.add(g);
    BOTS.push({ g, a: [cx - 3.2 + i * 6.4, kz + 3.6], b: [cx - 4.2 + i * 8.4, cz + (i ? 1.8 : -1.8)], t: i * 0.5 });
    g.position.set(cx - 3.2 + i * 6.4, 0, kz + 3.6);
  }
  placeLabel('table', 5.4);
}
{
  const [fx, fz] = PLACES.farm.pos;
  const tx = fx + 2, tz = fz - 3;
  put(null, new THREE.CylinderGeometry(2, 2, 7, 14, 1, true), mat(0xbfefff, { transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }), tx, 3.5, tz, { cast: false, tag: 'ai' });
  for (let i = 0; i < 6; i++) {
    cyl(null, 1.75, 1.75, 0.12, 14, 0x6bbf59, tx, 0.7 + i * 1.05, tz, { tag: 'human' });
    cyl(null, 1.8, 1.8, 0.05, 14, 0, tx, 1.12 + i * 1.05, tz, { m: basic(0xd27bff), cast: false, tag: 'ai' });
  }
  cyl(null, 0.25, 0.25, 7, 8, 0xdfe6ea, tx, 3.5, tz);
  cyl(null, 2.15, 2.15, 0.25, 14, 0xdfe6ea, tx, 7.1, tz);
  colC(tx, tz, 2.3);
  for (let i = 0; i < 4; i++) {
    const bz = fz - 1 + i * 2, bx = fx - 4.5;
    box(null, 3.2, 0.35, 1, 0x7b5236, bx, 0.175, bz, { tag: 'human' });
    for (let j = 0; j < 6; j++) blob(null, 0.17, pick([0x5cb85c, 0x7cc46a, 0x4caf50]), bx - 1.25 + j * 0.5, 0.45, bz, { cast: false, tag: 'human' });
    colB(bx - 1.6, bx + 1.6, bz - 0.5, bz + 0.5);
  }
  box(null, 0.35, 0.3, 0.2, 0x2a9d8f, fx - 2.3, 0.15, fz + 7.3, { tag: 'human' });
  placeLabel('farm', 9);
}

// 흙마당
const YARD = { x: PLACES.yard.pos[0], z: PLACES.yard.pos[1], r: 15 };
{
  const { x: cx, z: cz } = YARD;
  disc(null, 15, 0xb98d5e, cx, 0.03, cz, 40);
  disc(null, 1.7, 0x6f4f33, cx - 4, 0.036, cz - 5, 16);
  const posts = [];
  for (let i = 0; i < 44; i++) {
    const a = i / 44 * TAU;
    const x = cx + Math.sin(a) * 15.3, z = cz + Math.cos(a) * 15.3;
    if (x < cx - 13 && Math.abs(z - cz) < 4) continue;   // 서쪽 입구
    posts.push([x, z]);
  }
  const im = new THREE.InstancedMesh(CYL(0.17, 0.2, 1.1, 6), mat(0x8a6544), posts.length);
  const m4 = new THREE.Matrix4();
  posts.forEach(([x, z], i) => { m4.makeTranslation(x, 0.55, z); im.setMatrixAt(i, m4); });
  im.castShadow = true; scene.add(im); tag(im, 'human');
  const ropes = new THREE.InstancedMesh(CYL(0.035, 0.035, 1, 4), mat(0xe9d8a6), posts.length);
  const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), p = new THREE.Vector3(), s = new THREE.Vector3();
  let rn = 0;
  for (let i = 0; i < posts.length - 1; i++) {
    const [x0, z0] = posts[i], [x1, z1] = posts[i + 1], d = Math.hypot(x1 - x0, z1 - z0);
    if (d > 3) continue;
    dir.set(x1 - x0, 0, z1 - z0).normalize(); q.setFromUnitVectors(up, dir);
    p.set((x0 + x1) / 2, 0.92, (z0 + z1) / 2); s.set(1, d, 1); m4.compose(p, q, s); ropes.setMatrixAt(rn++, m4);
  }
  ropes.count = rn; scene.add(ropes); tag(ropes, 'human');
  for (const [x, z, a] of [[-4, 4, 0.4], [4, -2, 1.9], [2, 8, 2.6]]) cyl(null, 0.36, 0.36, 4.6, 8, 0x9a6b45, cx + x, 0.36, cz + z, { rz: Math.PI / 2, ry: a, tag: 'human' });
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.4; cyl(null, 0.45, 0.5, 0.5, 8, 0xa07650, cx + Math.sin(a) * 9.5, 0.25, cz + Math.cos(a) * 9.5, { tag: 'human' }); }
  blob(null, 1.5, 0x9a958c, cx + 6, 0.8, cz + 3, { sc: [1.3, 0.75, 1.1] });
  colC(cx + 6, cz + 3, 1.7);
  const sg = label('흙마당\n반디는 둥지에서 기다려요', { h: 0.8, fs: 34, bg: 'rgba(120,80,40,.9)' });
  sg.position.set(cx - 16.2, 2, cz + 4.6); scene.add(sg);
  cyl(null, 0.08, 0.08, 1.6, 6, 0x8a6544, cx - 16.2, 0.8, cz + 4.6);
  placeLabel('yard', 6);
}

// 소리 정자 · 손자국 마당
const PAV = { x: 28, z: 30 };
const GALLERY = [];
{
  const { x: cx, z: cz } = PAV;
  cyl(null, 4.6, 4.6, 0.24, 8, 0xc49a6c, cx, 0.12, cz, { tag: 'human' });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8; box(null, 0.24, 3.2, 0.24, 0x8d4a32, cx + Math.sin(a) * 4.2, 1.6, cz + Math.cos(a) * 4.2); }
  put(null, new THREE.ConeGeometry(5.9, 2.4, 8), mat(0xc2553a), cx, 4.4, cz, { ry: Math.PI / 8 });
  blob(null, 0.3, 0xffd166, cx, 5.75, cz);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; cyl(null, 0.36, 0.32, 0.5, 12, pick([0xe63946, 0x457b9d, 0xf4a261]), cx + Math.sin(a) * 1.3, 0.5, cz + Math.cos(a) * 1.3, { tag: 'human' }); cyl(null, 0.36, 0.36, 0.02, 12, 0xfff3e0, cx + Math.sin(a) * 1.3, 0.76, cz + Math.cos(a) * 1.3, { cast: false }); }
  for (let i = 0; i < 8; i++) box(null, 0.16, 0.05, 0.5 - i * 0.03, ['#ff595e', '#ff924c', '#ffca3a', '#c5ca30', '#8ac926', '#52a675', '#1982c4', '#6a4c93'][i].replace('#', '0x') * 1, cx - 0.6 + i * 0.18, 0.62, cz, { tag: 'human' });
  box(null, 1.6, 0.08, 0.6, 0x8d6748, cx, 0.55, cz);
  box(null, 0.35, 0.5, 0.3, 0x2b2d42, cx + 3.4, 0.49, cz - 1.4, { tag: 'ai' });
  blob(null, 0.1, 0, cx + 3.4, 0.82, cz - 1.25, { m: basic(0x58e1ff), cast: false, tag: 'ai' });
  // 손자국 마당
  const gz = 38;
  for (let i = 0; i < 7; i++) {
    const x = 34.5 + i * 1.15;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), r2 = mulberry32(77 + i);
    g.fillStyle = `hsl(${r2() * 360},55%,93%)`; g.fillRect(0, 0, 128, 128);
    for (let k = 0; k < 6; k++) { g.strokeStyle = `hsl(${r2() * 360},70%,55%)`; g.lineWidth = 3 + r2() * 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(r2() * 128, r2() * 128); g.bezierCurveTo(r2() * 128, r2() * 128, r2() * 128, r2() * 128, r2() * 128, r2() * 128); g.stroke(); }
    if (r2() < 0.6) { g.fillStyle = '#ffcf40'; g.beginPath(); g.arc(30 + r2() * 70, 30 + r2() * 40, 14, 0, TAU); g.fill(); }
    for (let k = 0; k < 3; k++) { g.fillStyle = `hsla(${r2() * 360},70%,50%,.55)`; g.beginPath(); g.arc(r2() * 128, r2() * 128, 6 + r2() * 10, 0, TAU); g.fill(); }
    box(null, 1, 0.9, 0.06, 0x8d6748, x, 1.45, gz);
    put(null, geo('artP', () => new THREE.PlaneGeometry(0.88, 0.78)), new THREE.MeshLambertMaterial({ map: texOf(c) }), x, 1.45, gz + 0.035, { cast: false, tag: 'human' });
    GALLERY.push(x);
  }
  for (const x of [34, 42.1]) cyl(null, 0.07, 0.07, 2.2, 6, 0x8d6748, x, 1.1, gz);
  box(null, 8.1, 0.04, 0.04, 0xe9d8a6, 38.05, 1.98, gz, { cast: false });
  const ar = label('일부러 아님 3호', { h: 0.38, fs: 30, bg: 'rgba(255,255,255,.95)', fg: '#333', pad: 10, round: 6 });
  ar.position.set(34.5 + 3 * 1.15, 0.85, gz + 0.1); scene.add(ar);
  placeLabel('sound', 6.6);
}

// 심심 벤치 · 화해 의자
const BENCH = { x: -13.6, z: 15.6, ry: 0.5 };
{
  const { x, z, ry } = BENCH, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  box(g, 2.2, 0.1, 0.55, 0xffc94a, 0, 0.45, 0); box(g, 2.2, 0.5, 0.08, 0xffc94a, 0, 0.78, -0.26);
  for (const sx of [-0.95, 0.95]) box(g, 0.1, 0.45, 0.5, 0x8d6748, sx, 0.22, 0);
  tag(g, 'human');
  const l1 = label('심심 벤치', { h: 0.42, fs: 30, bg: 'rgba(255,201,74,.95)', fg: '#5a3e1b', pad: 10 }); l1.position.set(x, 1.55, z); scene.add(l1);
  const g2 = new THREE.Group(); g2.position.set(-9.2, 0, 11.8); g2.rotation.y = -0.4; scene.add(g2);
  for (const s of [-1, 1]) { box(g2, 0.55, 0.08, 0.55, 0x2a9d8f, s * 0.75, 0.45, 0); box(g2, 0.08, 0.55, 0.55, 0x2a9d8f, s * 1.0, 0.72, 0); box(g2, 0.45, 0.42, 0.45, 0x21867a, s * 0.75, 0.21, 0); }
  box(g2, 1.9, 0.05, 0.05, 0xff6b6b, 0, 1.0, 0, { cast: false });
  tag(g2, 'human');
  const l2 = label('화해 의자', { h: 0.42, fs: 30, bg: 'rgba(42,157,143,.95)', pad: 10 }); l2.position.set(-9.2, 1.6, 11.8); scene.add(l2);
  placeLabel('bench', 3.4);
}

// 손글씨 우체통
{
  const [x, z] = PLACES.post.pos;
  box(null, 0.14, 1, 0.14, 0x555b6e, x, 0.5, z);
  box(null, 0.55, 0.65, 0.45, 0xd62828, x, 1.3, z, { tag: 'human' });
  box(null, 0.32, 0.04, 0.02, 0x222222, x, 1.45, z + 0.235, { cast: false });
  box(null, 0.9, 0.06, 0.5, 0xc9a77c, x + 1.6, 1.0, z, { tag: 'human' });
  box(null, 0.1, 1, 0.1, 0x8d6748, x + 1.6, 0.5, z);
  box(null, 0.35, 0.03, 0.25, 0xffffff, x + 1.6, 1.05, z, { cast: false, tag: 'human' });
  colC(x, z, 0.4);
  placeLabel('post', 3);
}

// 정문 · 통통 정류장
let BUS;
{
  const [cx, cz] = PLACES.gate.pos;
  for (const s of [-1, 1]) { box(null, 1.1, 4.6, 1.1, 0x8d6748, cx + s * 5.2, 2.3, cz); colC(cx + s * 5.2, cz, 0.8); }
  box(null, 11.6, 0.9, 1.1, 0x8d6748, cx, 4.9, cz);
  box(null, 12.4, 0.35, 1.9, 0x7cb07f, cx, 5.52, cz);
  const c = canvasText(['물음숲 초등학교'], { fs: 64, bg: '#fff8e7', fg: '#5a3e1b', round: 10, pad: 26 });
  const t = texOf(c);
  const w = 6.6, h = w * c.height / c.width;
  put(null, geo('gsign', () => new THREE.PlaneGeometry(w, h)), new THREE.MeshLambertMaterial({ map: t }), cx, 4.9, cz + 0.56, { cast: false });
  put(null, geo('gsign', () => new THREE.PlaneGeometry(w, h)), new THREE.MeshLambertMaterial({ map: t }), cx, 4.9, cz - 0.56, { cast: false, ry: Math.PI });
  // 정류장
  box(null, 4.2, 0.12, 1.7, 0x23446b, 8, 2.55, 67.6);
  for (const s of [-1.8, 1.8]) box(null, 0.12, 2.5, 0.12, 0xb9c6cc, 8 + s, 1.25, 67.0);
  box(null, 3, 0.08, 0.45, 0xc9a77c, 8, 0.45, 67.2);
  // 통통버스 (운전석이 없어요)
  BUS = new THREE.Group();
  box(BUS, 10, 2.5, 2.6, 0xffd23f, 0, 1.55, 0);
  box(BUS, 9.6, 0.4, 2.4, 0xffffff, 0, 2.95, 0);
  box(BUS, 8.4, 0.85, 2.62, 0x24324a, -0.5, 2.05, 0, { cast: false });
  box(BUS, 0.1, 1.3, 2.3, 0x24324a, 5.02, 1.9, 0, { cast: false });
  box(BUS, 9.8, 0.12, 2.64, 0, 0, 1.0, 0, { m: basic(0x3fd8ff), cast: false, tag: 'ai' });
  box(BUS, 1.1, 1.7, 0.04, 0x3d5a80, 2, 1.25, -1.31, { cast: false });
  for (const [x, z] of [[-3.2, -1.25], [3.2, -1.25], [-3.2, 1.25], [3.2, 1.25]]) cyl(BUS, 0.5, 0.5, 0.35, 12, 0x2b2d42, x, 0.5, z, { rx: Math.PI / 2 });
  const bl = label('통통버스', { h: 0.55, fs: 34, bg: 'rgba(29,53,87,.85)' }); bl.position.set(0, 3.7, 0); BUS.add(bl);
  tag(BUS, 'ai');
  BUS.position.set(-300, 0, 72.2);
  scene.add(BUS);
  placeLabel('gate', 8);
}
const BUS_DOOR = { x: 2, z: 70.1 };
function busX(m) {
  const seg = (a, b, x0, x1, f) => (m >= a && m < b) ? x0 + (x1 - x0) * f((m - a) / (b - a)) : null;
  const eo = (t) => 1 - Math.pow(1 - t, 3), ei = (t) => t * t * t;
  return seg(478, 488, -130, 0, eo) ?? seg(488, 494, 0, 0, eo) ?? seg(494, 502, 0, 150, ei)
    ?? seg(910, 918, -130, 0, eo) ?? seg(918, 928, 0, 0, eo) ?? seg(928, 936, 0, 150, ei) ?? 400;
}

// 잔디 깎는 로봇
const MOWER = new THREE.Group();
{
  box(MOWER, 0.7, 0.3, 0.9, 0xf2f5f7, 0, 0.2, 0);
  blob(MOWER, 0.08, 0, 0, 0.4, 0.38, { m: basic(0x58e1ff), cast: false });
  tag(MOWER, 'ai'); scene.add(MOWER);
}

// ───────── 사람 ─────────
const SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0xffdbac, 0x8d5524, 0xf5cfa0];
const SHIRT = [0xff8a80, 0xffd166, 0x06d6a0, 0x4cc9f0, 0xb388ff, 0xff9f1c, 0x90be6d, 0xf28482, 0x84a59d, 0xf6bd60, 0x7bdff2, 0xcdb4db];
const PANTS = [0x3d5a80, 0x5c4d7d, 0x2b2d42, 0x6b705c, 0x495057, 0x7f5539];
const HAIR = [0x2b2118, 0x3b2a1a, 0x5a3825, 0x1c1c1c, 0x8a5a2b, 0xd4a373];
const BANBI_C = [0x7fe6ff, 0x9dffb0, 0xd0b3ff, 0xffb3e1, 0xfff07a, 0x8fd3ff];

function makePerson(o) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const legL = new THREE.Group(), legR = new THREE.Group(), armL = new THREE.Group(), armR = new THREE.Group();
  legL.position.set(-0.11, 0.62, 0); legR.position.set(0.11, 0.62, 0);
  armL.position.set(-0.29, 1.08, 0); armR.position.set(0.29, 1.08, 0);
  inner.add(legL, legR, armL, armR);
  for (const L of [legL, legR]) { box(L, 0.16, 0.56, 0.18, 0, 0, -0.28, 0, { m: mat(o.pants) }); box(L, 0.17, 0.1, 0.24, 0, 0, -0.57, 0.03, { m: mat(o.shoe || 0x3a3a46) }); }
  box(inner, 0.44, 0.52, 0.26, 0, 0, 0.87, 0, { m: mat(o.shirt) });
  for (const A of [armL, armR]) { box(A, 0.13, 0.3, 0.15, 0, 0, -0.13, 0, { m: mat(o.shirt) }); box(A, 0.11, 0.24, 0.13, 0, 0, -0.39, 0, { m: mat(o.skin) }); }
  const head = new THREE.Group(); head.position.y = 1.34; inner.add(head);
  box(head, 0.36, 0.36, 0.34, 0, 0, 0, 0, { m: mat(o.skin) });
  box(head, 0.38, 0.12, 0.36, 0, 0, 0.16, -0.01, { m: mat(o.hair) });
  box(head, 0.38, 0.26, 0.1, 0, 0, 0.04, -0.15, { m: mat(o.hair) });
  if (o.long) box(head, 0.36, 0.36, 0.1, 0, 0, -0.14, -0.16, { m: mat(o.hair) });
  for (const s of [-1, 1]) box(head, 0.05, 0.06, 0.02, 0, s * 0.08, 0.02, 0.172, { m: basic(0x222222), cast: false });
  if (o.vest) box(inner, 0.46, 0.3, 0.28, 0, 0, 0.98, 0, { m: mat(o.vest) });
  if (o.bag) box(inner, 0.34, 0.36, 0.14, 0, 0, 0.9, -0.2, { m: mat(o.bag) });
  g.scale.setScalar(o.s);
  scene.add(g);
  return { g, inner, legL, legR, armL, armR, head, s: o.s, ph: rnd() * TAU };
}
function makeBanbi(c) {
  const orb = new THREE.Mesh(ICO(0.13, 1), basic(c));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
  glow.scale.set(0.95, 0.95, 1);
  const g = new THREE.Group(); g.add(orb, glow); scene.add(g);
  tag(orb, 'ai');
  return { g, orb, glow, c: new THREE.Color(c), pos: g.position, ph: rnd() * TAU, state: 'on' };
}

const N_KIDS = 24;
const KIDS = [], TEACH = [];
for (let i = 0; i < N_KIDS; i++) {
  const p = makePerson({ s: R(0.74, 0.98), skin: pick(SKIN), shirt: SHIRT[i % SHIRT.length], pants: pick(PANTS), hair: pick(HAIR), long: rnd() < 0.45, bag: rnd() < 0.6 ? pick([0xe76f51, 0x2a9d8f, 0x264653, 0xf4a261, 0x8338ec]) : 0 });
  tag(p.g, 'human');
  const b = makeBanbi(BANBI_C[i % BANBI_C.length]);
  KIDS.push({ p, b, x: BUS_DOOR.x, z: BUS_DOOR.z, yaw: 0, tx: 0, tz: 0, tyaw: 0, pose: 'stand', seatY: 0, area: null, wait: 0, spd: 3, vis: false, idx: i, nest: i });
}
for (let i = 0; i < 4; i++) {
  const p = makePerson({ s: 1.16, skin: pick(SKIN), shirt: [0xf1faee, 0xe9edc9, 0xfefae0, 0xedf6f9][i], pants: pick(PANTS), hair: pick(HAIR), long: i % 2 === 1, vest: [0x2a9d8f, 0xe76f51, 0x457b9d, 0xe9c46a][i] });
  tag(p.g, 'human');
  const lb = label('선생님', { h: 0.36, fs: 30, bg: 'rgba(42,157,143,.9)', pad: 10 }); lb.position.y = 1.95; p.g.add(lb);
  TEACH.push({ p, x: 0, z: 50, yaw: 0, tx: 0, tz: 50, tyaw: 0, pose: 'stand', seatY: 0, area: null, wait: 0, spd: 2.4, vis: true });
}
const PLAYER = { p: makePerson({ s: 0.9, skin: 0xf1c27d, shirt: 0xff4d6d, pants: 0x264653, hair: 0x2b2118, bag: 0xffd166 }), b: null, x: -3.5, z: 63.5, yaw: Math.PI, vis: true };
PLAYER.b = makeBanbi(0xffffff);
tag(PLAYER.p.g, 'human');
{ const lb = label('나', { h: 0.42, fs: 34, bg: 'rgba(255,77,109,.95)', pad: 12 }); lb.position.y = 2.05; PLAYER.p.g.add(lb); }

function animPerson(a, moving, t, dt, run) {
  const p = a.p;
  p.legL.rotation.set(0, 0, 0); p.legR.rotation.set(0, 0, 0); p.armL.rotation.set(0, 0, 0); p.armR.rotation.set(0, 0, 0);
  p.inner.position.y = 0; p.head.rotation.y = 0;
  if (moving) {
    p.ph += dt * (run ? 13 : 9);
    const sw = Math.sin(p.ph) * (run ? 0.85 : 0.6);
    p.legL.rotation.x = sw; p.legR.rotation.x = -sw; p.armL.rotation.x = -sw * 0.8; p.armR.rotation.x = sw * 0.8;
    p.inner.position.y = Math.abs(Math.cos(p.ph)) * 0.05;
    return;
  }
  const sitting = a.pose.startsWith('sit');
  if (sitting) {
    p.legL.rotation.x = p.legR.rotation.x = -Math.PI / 2;
    p.inner.position.y = (a.seatY + 0.06) / p.s - 0.62;
    p.armL.rotation.x = p.armR.rotation.x = -0.35;
  }
  const w = t * 7 + p.ph;
  switch (a.pose) {
    case 'wave': case 'sitwave': p.armR.rotation.z = 2.6 + Math.sin(w) * 0.4; p.armR.rotation.x = 0; break;
    case 'sithand': p.armR.rotation.z = 2.95; p.armR.rotation.x = 0; break;
    case 'drum': p.armL.rotation.x = -1.05 + Math.sin(w * 1.3) * 0.35; p.armR.rotation.x = -1.05 + Math.sin(w * 1.3 + Math.PI) * 0.35; break;
    case 'reach': p.armL.rotation.z = -2.75; p.armR.rotation.z = 2.75; p.inner.position.y = Math.max(0, Math.sin(w * 0.6)) * 0.06; break;
    case 'look': p.head.rotation.y = Math.sin(t * 0.7 + p.ph) * 0.5; break;
    case 'write': p.armR.rotation.x = -0.9 + Math.sin(w * 2) * 0.08; p.head.rotation.x = 0.3; break;
    default: p.head.rotation.y = Math.sin(t * 0.5 + p.ph) * 0.25;
  }
}

// ───────── 하루 배치 ─────────
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const S = (x, z, yaw, pose = 'stand', seatY = 0, area = null) => ({ x, z, yaw, pose, seatY, area });
function playIn(cx, cz, r) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * r; return S(cx + Math.sin(a) * d, cz + Math.cos(a) * d, 0, 'play', 0, { x: cx, z: cz, r }); }
function spotsFor(slot) {
  const K = [], T = [];
  const P = (k) => PLACES[k].pos;
  switch (slot.layout) {
    case 'line':
      if (slot.id === 'arrive') {
        for (let i = 0; i < N_KIDS; i++) K.push(S(i % 2 ? 0.7 : -0.7, 59.8 + Math.floor(i / 2) * 0.9, Math.PI));
        T.push(S(0, 57.4, 0, 'wave'), S(-3, 55.5, 0.4, 'wave'), S(3.4, 54.5, -0.5), S(5, 8.5, 0.3, 'look'));
      } else {
        for (let i = 0; i < N_KIDS; i++) K.push(S(BUS_DOOR.x + (i % 2 ? 0.45 : -0.45), 69.3 - Math.floor(i / 2) * 0.9, 0));
        T.push(S(-2.2, 61, 0.3, 'wave'), S(-3.6, 59.5, 0.5, 'wave'), S(4.5, 60, -0.6, 'wave'), S(6, 56, -0.3));
      }
      break;
    case 'circle': {
      const n = N_KIDS + 4, tIdx = [3, 10, 17, 24];
      let ki = 0;
      for (let j = 0; j < n; j++) {
        const a = j / n * TAU, x = Math.sin(a) * 9.2, z = Math.cos(a) * 9.2, yaw = face(x, z, 0, 0);
        if (tIdx.includes(j)) T.push(S(x, z, yaw, 'sit', 0));
        else { const hand = slot.id === 'council' && (ki % 3 === 0); K.push(S(x, z, yaw, hand ? 'sithand' : 'sit', 0)); ki++; }
      }
      break;
    }
    case 'pods': {
      const [cx, cz] = P('path');
      for (const pod of PODS) for (const sg of [1, -1]) { const x = pod.x + Math.sin(pod.a) * 0.75 * sg, z = pod.z + Math.cos(pod.a) * 0.75 * sg; K.push(S(x, z, face(x, z, pod.x, pod.z), 'sit', 0.42)); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, x = cx + Math.sin(a) * 2.3, z = cz + Math.cos(a) * 2.3; K.push(S(x, z, face(x, z, cx, cz), 'sit', 0.2)); }
      T.push(S(cx + 4, cz, 0, 'patrol', 0, { x: cx, z: cz, r: 9 }), S(cx - 4, cz + 2, 0, 'patrol', 0, { x: cx, z: cz, r: 9 }), S(-4, 9, 0.2, 'look'), S(46, -9, 2.6, 'look'));
      break;
    }
    case 'play': {
      for (let i = 0; i < 18; i++) K.push(playIn(YARD.x, YARD.z, 12));
      const { x, z, ry } = BENCH;
      for (const dx of [-0.5, 0.5]) K.push(S(x + dx * Math.cos(ry), z - dx * Math.sin(ry), ry, 'sit', 0.45));
      const [fx, fz] = P('farm');
      for (let i = 0; i < 2; i++) K.push(S(fx - 4.5 + i * 1.2 - 0.6, fz - 2.1, 0, 'look'));
      K.push(S(-9.2 - 0.75 * Math.cos(-0.4), 11.8 + 0.75 * Math.sin(-0.4), -0.4 + Math.PI / 2, 'sit', 0.45));
      K.push(S(-9.2 + 0.75 * Math.cos(-0.4), 11.8 - 0.75 * Math.sin(-0.4), -0.4 - Math.PI / 2, 'sit', 0.45));
      T.push(S(YARD.x - 16.5, YARD.z - 2, Math.PI / 2, 'look'), S(-11, 10, 0.6), S(4, 9, 0.3, 'look'), S(28, -22, 0, 'look'));
      break;
    }
    case 'teams':
      for (const [tx, tz] of BQ_TABLES) for (const sz of [-0.95, 0.95]) for (const dx of [-0.8, 0, 0.8]) { const x = tx + dx, z = tz + sz; K.push(S(x, z, face(x, z, tx, z - sz), 'stand')); }
      T.push(S(-44, -6, 0, 'patrol', 0, { x: -44, z: -6, r: 7 }), S(-40, -2, 0, 'patrol', 0, { x: -44, z: -6, r: 7 }), S(-44, 0.3, Math.PI, 'look'), S(4, 9, 0.3));
      break;
    case 'tables':
      for (const [tx, tz] of LAB_TABLES) {
        for (const sz of [-0.85, 0.85]) for (const dx of [-0.5, 0.5]) { const x = tx + dx, z = tz + sz; K.push(S(x, z, face(x, z, x, tz), 'stand')); }
        for (const sx of [-1.3, 1.3]) { const x = tx + sx, z = tz; K.push(S(x, z, face(x, z, tx, tz), 'look')); }
      }
      T.push(S(-28, -34, 0, 'patrol', 0, { x: -28, z: -34, r: 5 }), S(-25, -30, 0, 'patrol', 0, { x: -28, z: -34, r: 5 }), S(-14, -12.5, 0.4), S(30, -24, 0.2));
      break;
    case 'dine': {
      const [cx] = P('table');
      for (const tz of DINE_TABLES) for (const sg of [-1, 1]) for (let i = 0; i < 6; i++) { const x = cx - 2.5 + i, z = tz + sg * 0.8; K.push(S(x, z, sg < 0 ? 0 : Math.PI, 'sit', 0.45)); }
      T.push(S(cx - 4.1, -30, Math.PI / 2, 'look'), S(cx + 4.1, -30, -Math.PI / 2, 'look'), S(cx - 2, -37.5, Math.PI), S(cx + 6.5, -25, -2.4));
      break;
    }
    case 'screen': {
      const [cx, cz] = P('window');
      let i = 0;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) K.push(S(cx - 5 + c * 2, cz - 2.4 + r * 1.6, Math.PI, (r === 0 && c % 2 === 0) || (i++ % 7 === 3) ? 'sitwave' : 'sit', 0.18));
      T.push(S(cx - 7.2, cz - 3, 2.6, 'wave'), S(cx + 7.2, cz - 1, -2.4), S(-12, -13, 0.4), S(30, -24, 0.2));
      break;
    }
    case 'arts': {
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3, x = PAV.x + Math.sin(a) * 2.5, z = PAV.z + Math.cos(a) * 2.5; K.push(S(x, z, face(x, z, PAV.x, PAV.z), 'drum')); }
      for (let i = 0; i < 8; i++) K.push(S(34.4 + i * 1.08, 39.7 + (i % 2) * 0.5, Math.PI, i % 3 === 0 ? 'look' : 'stand'));
      for (let i = 0; i < 8; i++) K.push(playIn(YARD.x, YARD.z, 11));
      T.push(S(PAV.x + 3.2, PAV.z + 2.4, -2.2, 'drum'), S(38, 42, Math.PI, 'look'), S(YARD.x - 16.5, YARD.z - 2, Math.PI / 2, 'look'), S(10, 20, 0.4));
      break;
    }
    case 'queue': {
      const [px, pz] = P('post');
      for (let i = 0; i < 10; i++) K.push(S(px, pz + 1.1 + i * 0.85, Math.PI, i === 0 ? 'write' : 'stand'));
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.1, x = Math.sin(a) * 7.7, z = Math.cos(a) * 7.7; K.push(S(x, z, face(x, z, 0, 0), i % 2 ? 'reach' : 'look')); }
      T.push(S(px + 1.6, pz - 0.9, 0, 'write'), S(4, 9.5, 0.4, 'look'), S(-5, 9, -0.4), S(2, 55, 0));
      break;
    }
  }
  return { K, T };
}

// ───────── 상태 ─────────
const ST = { mode: 'title', m: 482, slot: -1, paused: false, lens: false, rate: 1, endShown: false, tourI: 0, panel: null };
let curSpots = null;

function applySlot(i, teleport) {
  ST.slot = i;
  if (i < 0) return;
  const slot = DAY[i];
  curSpots = spotsFor(slot);
  KIDS.forEach((k, j) => assign(k, curSpots.K[j], teleport));
  TEACH.forEach((t, j) => assign(t, curSpots.T[j], teleport));
  beacon.position.set(PLACES[slot.place].pos[0], 0, PLACES[slot.place].pos[1]);
  updateNow();
}
function assign(a, s, teleport) {
  if (!s) return;
  a.tx = s.x; a.tz = s.z; a.tyaw = s.yaw; a.pose = s.pose; a.seatY = s.seatY; a.area = s.area; a.wait = rnd() * 1.5;
  a.boarded = false;
  if (teleport) { a.x = s.x; a.z = s.z; a.yaw = s.yaw; if (a.idx !== undefined) a.vis = true; }
}

function moveAgent(a, dt) {
  const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
  const roam = a.pose === 'play' || a.pose === 'patrol';
  if (d > 0.06) {
    const spd = a.pose === 'play' ? 3.6 : a.pose === 'patrol' ? 1.1 : a.spd;
    const step = Math.min(d, spd * dt);
    a.x += dx / d * step; a.z += dz / d * step;
    if (d > 0.6) {
      const n = pushOut(a, 0.3);
      if (n) { let tx = -n[1], tz = n[0]; if (tx * dx + tz * dz < 0) { tx = -tx; tz = -tz; } a.x += tx * step * 0.9; a.z += tz * step * 0.9; pushOut(a, 0.3); }
    }
    const want = Math.atan2(dx, dz);
    a.yaw += angDiff(want, a.yaw) * Math.min(1, dt * 10);
    return { moving: true, run: a.pose === 'play' };
  }
  if (roam && a.area) {
    a.wait -= dt;
    if (a.wait <= 0) {
      const ar = a.area, an = rnd() * TAU, r = Math.sqrt(rnd()) * ar.r;
      a.tx = ar.x + Math.sin(an) * r; a.tz = ar.z + Math.cos(an) * r;
      a.wait = a.pose === 'play' ? R(0.2, 1.6) : R(1.5, 4);
    }
    return { moving: false };
  }
  a.yaw += angDiff(a.tyaw, a.yaw) * Math.min(1, dt * 6);
  return { moving: false };
}
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };

// ───────── 반디 ─────────
const _v = new THREE.Vector3();
let nestSlot = 0;
function banbiTarget(b, a, state, t, isPlayer) {
  const s = a.p.s;
  if (state === 'nest') {
    if (b.nestI === undefined) b.nestI = nestSlot++ % NEST.length;
    const n = NEST[b.nestI];
    return _v.set(n.x + Math.sin(t * 0.6 + b.ph) * 0.06, n.y + Math.sin(t * 1.1 + b.ph) * 0.05, n.z);
  }
  const side = 0.48 * s, yaw = a.yaw;
  const up = state === 'off' ? 1.1 : 1.95 + Math.sin(t * 2.2 + b.ph) * 0.08;
  return _v.set(a.x + Math.cos(yaw) * side + Math.sin(t * 1.3 + b.ph) * 0.06, up * s + (isPlayer ? 0.1 : 0), a.z - Math.sin(yaw) * side);
}
function zoneState(a, base) {
  const dy = Math.hypot(a.x - YARD.x, a.z - YARD.z);
  if (dy < YARD.r + 0.3) return 'nest';
  if (Math.hypot(a.x - BENCH.x, a.z - BENCH.z) < 3.2 || Math.hypot(a.x + 9.2, a.z - 11.8) < 3) return 'off';
  return base;
}
function updBanbi(b, a, state, t, dt, isPlayer) {
  b.g.visible = a.vis !== false;
  const tg = banbiTarget(b, a, state, t, isPlayer);
  const d = b.pos.distanceTo(tg);
  if (d > 2.5) { const step = Math.min(d, 13 * dt); b.pos.addScaledVector(_v.sub(b.pos).normalize(), step); b.pos.y += Math.sin(Math.min(1, d / 20) * Math.PI) * dt * 2; }
  else b.pos.lerp(tg, 1 - Math.exp(-dt * 6));
  const sleep = state === 'nest' && d < 1.5, off = state === 'off';
  const k = sleep ? 0.35 + Math.sin(t * 1.5 + b.ph) * 0.1 : off ? 0 : 0.9;
  b.glow.material.opacity += (k - b.glow.material.opacity) * Math.min(1, dt * 4);
  b.orb.scale.setScalar(sleep ? 0.7 : off ? 0.75 : 1);
  if (!ST.lens) b.orb.material = off ? basic(0x8a9399) : sleep ? basic(b.c.getHex(), { transparent: true, opacity: 0.6 }) : basic(b.c.getHex());
  b.state = state;
}

// 지금 장소 표시 기둥
const beacon = new THREE.Group();
{
  const col = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 34, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
  col.position.y = 17; beacon.add(col);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.9, 40), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.7, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; beacon.add(ring);
  beacon.userData.ring = ring;
  beacon.visible = false;
  scene.add(beacon);
}
const clickMark = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }));
clickMark.rotation.x = -Math.PI / 2; clickMark.visible = false; scene.add(clickMark);

// ───────── 하늘·빛(시간) ─────────
const SKY_KEYS = [
  [470, 0x8fbfe6, 0xffd9b8, 0.95, 0xffd7a8, 0.85],
  [600, 0x5fa8e8, 0xd0e9f8, 1.25, 0xfff4e0, 0.95],
  [780, 0x4f9ee6, 0xd6ecf8, 1.3, 0xffffff, 1],
  [890, 0x6a9fd6, 0xffe2b8, 1.1, 0xffdcaa, 0.9],
  [940, 0x6d88c2, 0xffc49a, 0.9, 0xffc48a, 0.8]
];
const cA = new THREE.Color(), cB = new THREE.Color();
function applySky(m) {
  let i = 0; while (i < SKY_KEYS.length - 2 && m > SKY_KEYS[i + 1][0]) i++;
  const a = SKY_KEYS[i], b = SKY_KEYS[i + 1], k = clamp((m - a[0]) / (b[0] - a[0]), 0, 1);
  const dim = ST.lens ? 0.22 : 1;
  skyU.top.value.copy(cA.set(a[1]).lerp(cB.set(b[1]), k)).multiplyScalar(dim);
  skyU.bot.value.copy(cA.set(a[2]).lerp(cB.set(b[2]), k)).multiplyScalar(dim);
  scene.fog.color.copy(skyU.bot.value);
  sun.intensity = (a[3] + (b[3] - a[3]) * k) * (ST.lens ? 0.18 : 1);
  sun.color.copy(cA.set(a[4]).lerp(cB.set(b[4]), k));
  hemi.intensity = (a[5] + (b[5] - a[5]) * k) * (ST.lens ? 0.2 : 1);
  const f = clamp((m - 450) / (960 - 450), 0, 1), az = -1.2 + f * 2.4, el = 0.55 + Math.sin(f * Math.PI) * 0.55;
  sun.position.set(Math.sin(az) * Math.cos(el) * 160, Math.sin(el) * 160, -Math.cos(az) * Math.cos(el) * 60 + 40);
  sun.target.position.set(0, 0, 0);
}

// ───────── AI 렌즈 ─────────
function setLens(on) {
  ST.lens = on;
  for (const k of ['ai', 'human']) for (const m of LENS[k]) {
    if (on) { if (!m.userData.m0) m.userData.m0 = m.material; m.material = LMAT[k]; }
    else if (m.userData.m0) { m.material = m.userData.m0; m.userData.m0 = null; }
  }
  for (const s of LENS_LABELS) s.visible = on;
  $('legend').classList.toggle('on', on);
  $('bLens').classList.toggle('act', on);
  applySky(ST.m);
}
const LMAT = { ai: new THREE.MeshBasicMaterial({ color: 0x3fd8ff }), human: new THREE.MeshBasicMaterial({ color: 0xffa94d }) };

// ───────── 카메라·조작 ─────────
const CAM = { yaw: Math.PI, pitch: 0.32, dist: 8, pos: new THREE.Vector3(0, 30, 90), look: new THREE.Vector3(), tw: null };
const CAMS = {
  arrive: [[-11, 7.5, 46], [0, 1.6, 61]], quiet: [[7, 12, 27], [0, 1, 0]], path: [[-23, 9, 37], [-34, 0.8, 24]],
  break: [[27, 10, 16], [44, 0.5, 5]], bigq: [[-30, 3.8, 5], [-44, 1, -5]], lab: [[-18, 3.1, -24.5], [-28, 1, -34]],
  lunch: [[21, 2.9, -21], [32, 0.8, -30]], world: [[0, 4.2, -33], [0, 2.2, -48]], arts: [[19, 3.4, 41], [31, 1.2, 33]],
  council: [[8, 12, -25], [0, 1, 0]], diary: [[21, 6.5, 57], [5, 1.4, 41]], home: [[-9, 6.5, 52], [1.5, 1.6, 66]]
};
function flyTo(pos, look, dur = 1.8) {
  CAM.tw = { p0: camera.position.clone(), l0: CAM.look.clone(), p1: new THREE.Vector3(...pos), l1: new THREE.Vector3(...look), t: 0, dur };
}

const keys = new Set();
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
  keys.add(e.code);
  if (e.code === 'KeyE' || e.code === 'Enter') { if (ST.panel) closePanel(); else if (ST.mode === 'walk' && nearPlace) openPlace(nearPlace); }
  else if (e.code === 'Escape') { closePanel(); closeBook(); }
  else if (e.code === 'KeyL') setLens(!ST.lens);
  else if (e.code === 'KeyB') toggleBook();
  else if (e.code === 'KeyT') ST.mode === 'tour' ? startWalk() : startTour(ST.slot < 0 ? 0 : ST.slot);
  else if (e.code === 'KeyN') nextScene();
  else if (e.code === 'Space') { e.preventDefault(); if (ST.mode === 'walk') togglePause(); }
  else if (ST.mode === 'tour' && (e.code === 'ArrowRight')) tourStep(1);
  else if (ST.mode === 'tour' && (e.code === 'ArrowLeft')) tourStep(-1);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

let drag = null;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitP = new THREE.Vector3();
let moveTarget = null;
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
  if (ST.mode === 'walk') { CAM.yaw -= dx * 0.006; CAM.pitch = clamp(CAM.pitch + dy * 0.004, 0.05, 1.25); }
  else if (ST.mode === 'tour') { CAM.orb = (CAM.orb || 0) - dx * 0.004; }
});
canvas.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
  drag = null;
  if (moved > 7) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(LABELS, false)[0];
  if (hit) { openPlace(hit.object.userData.place); return; }
  if (ST.mode === 'walk' && ray.ray.intersectPlane(gPlane, hitP)) { moveTarget = { x: hitP.x, z: hitP.z }; clickMark.position.set(hitP.x, 0.07, hitP.z); clickMark.visible = true; }
});
canvas.addEventListener('wheel', (e) => { CAM.dist = clamp(CAM.dist + e.deltaY * 0.01, 3.5, 22); }, { passive: true });

function allowed(x, z) { return Math.hypot(x, z) < 70.3 || (Math.abs(x) < 12 && z < 70.2 && z > 0); }
function movePlayer(dt) {
  const P = PLAYER;
  let ix = 0, iz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) iz += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) iz -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
  const fx = -Math.sin(CAM.yaw), fz = -Math.cos(CAM.yaw), rx = -fz, rz = fx;
  let vx = fx * iz + rx * ix, vz = fz * iz + rz * ix;
  if (ix || iz) { moveTarget = null; clickMark.visible = false; }
  else if (moveTarget) {
    const dx = moveTarget.x - P.x, dz = moveTarget.z - P.z, d = Math.hypot(dx, dz);
    if (d < 0.25) { moveTarget = null; clickMark.visible = false; } else { vx = dx / d; vz = dz / d; }
  }
  const len = Math.hypot(vx, vz);
  const run = keys.has('ShiftLeft') || keys.has('ShiftRight');
  if (len > 0) {
    const spd = (run ? 7.5 : 4.4) * dt;
    const ox = P.x, oz = P.z;
    P.x += vx / len * spd; P.z += vz / len * spd;
    const n = pushOut(P, 0.32);
    if (n && moveTarget) { let tx = -n[1], tz = n[0]; if (tx * vx + tz * vz < 0) { tx = -tx; tz = -tz; } P.x += tx * spd * 0.8; P.z += tz * spd * 0.8; pushOut(P, 0.32); }
    if (!allowed(P.x, P.z)) { P.x = ox; P.z = oz; moveTarget = null; clickMark.visible = false; }
    P.yaw += angDiff(Math.atan2(vx, vz), P.yaw) * Math.min(1, dt * 12);
    return { moving: true, run };
  }
  return { moving: false };
}

// ───────── 화면 글(UI) ─────────
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let nearPlace = null;
function updateNow() {
  const el = $('now');
  if (ST.mode === 'title') { el.classList.remove('on'); return; }
  el.classList.add('on');
  const slot = DAY[ST.slot];
  $('nowT').textContent = slot ? `${slot.title} · ${PLACES[slot.place].name}` : '통통버스가 오고 있어요';
}
function toast(html, ms = 4200) {
  const el = $('toast'); el.innerHTML = html; el.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), ms);
}
function slotCardHTML(i) {
  const s = DAY[i];
  return `<div class="tc-time">${fmt(s.t)} <b>${esc(s.title)}</b><span class="tc-place">${esc(PLACES[s.place].name)}</span></div>
    ${s.say.map((l) => `<p>${esc(l)}</p>`).join('')}
    <div class="duo"><div class="ai"><i></i><b>AI가 해요</b>${esc(s.ai)}</div><div class="hu"><i></i><b>사람이 해요</b>${esc(s.human)}</div></div>
    <div class="then">${esc(s.then)}</div>`;
}
function openPlace(k) {
  const P = PLACES[k], s = DAY[ST.slot];
  const here = s && s.place === k && ST.mode === 'walk';
  $('panelBody').innerHTML = `<h2>${esc(P.name)}</h2>${P.lines.map((l) => `<p>${esc(l)}</p>`).join('')}
    <div class="duo"><div class="ai"><i></i><b>AI가 해요</b>${esc(P.ai)}</div><div class="hu"><i></i><b>사람이 해요</b>${esc(P.human)}</div></div>
    <div class="worry"><b>이 학교의 고민</b>${esc(P.worry)}</div>
    ${here ? `<div class="here"><b>지금 여기선 · ${fmt(s.t)} ${esc(s.title)}</b>${s.say.map((l) => `<p>${esc(l)}</p>`).join('')}</div>` : ''}`;
  $('panel').classList.add('on'); ST.panel = k;
}
function closePanel() { $('panel').classList.remove('on'); ST.panel = null; }

// 이야기책
const BOOK_TABS = {
  school: () => `<h3>${esc(SCHOOL.name)} <small>${SCHOOL.year}</small></h3><p class="motto">"${esc(SCHOOL.motto)}"</p>${SCHOOL.big.map((p) => `<p>${esc(p)}</p>`).join('')}
    <h4>상징 공간</h4><ul>${['tree', 'nest', 'yard', 'bench', 'post'].map((k) => `<li><b>${esc(PLACES[k].name)}</b> — ${esc(PLACES[k].lines[0])}</li>`).join('')}</ul>`,
  day: () => `<h3>물음숲의 하루</h3><table class="tt">${DAY.map((s) => `<tr><td class="t">${fmt(s.t)}</td><td><b>${esc(s.title)}</b><br><small>${esc(PLACES[s.place].name)} · 반디 ${s.banbi === 'nest' ? '잠듦' : s.banbi === 'off' ? '빛 꺼짐' : '깨어 있음'}</small></td><td><small>${esc(s.then)}</small></td></tr>`).join('')}</table>`,
  subj: () => `<h3>과목은 어떻게 바뀌었을까</h3><div class="subj">${SUBJECTS.map((s) => `<div class="sc"><div class="sh"><span>${esc(s.old)}</span> → <b>${esc(s.now)}</b></div>
      <div class="row ai"><i></i>${esc(s.ai)}</div><div class="row te"><i></i>선생님: ${esc(s.teacher)}</div><div class="row hu"><i></i>나: ${esc(s.me)}</div>${s.keep !== '-' ? `<div class="row kp">그대로: ${esc(s.keep)}</div>` : ''}</div>`).join('')}</div>`,
  promise: () => `<h3>반디 약속</h3><p>물음숲 아이들이 반디 회의에서 정한 약속이에요. 해마다 고쳐요.</p><ol class="prom">${PROMISES.map(([a, b]) => `<li><b>${esc(a)}</b><br>${esc(b)}</li>`).join('')}</ol>`,
  words: () => `<h3>물음숲 낱말</h3><dl>${WORDS.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>`,
  open: () => `<h3>이 학교도 아직 모르는 물음</h3><p>물음숲 초등학교도 다 정하지 못했어요. 너라면?</p><ul class="openq">${OPEN_QUESTIONS.map((q) => `<li>${esc(q)}</li>`).join('')}</ul><p class="note">이 학교와 사람들은 모두 상상이에요. 10년 뒤 진짜 학교는 우리가 정해요.</p>`
};
function showBookTab(k) {
  $('bookBody').innerHTML = BOOK_TABS[k]();
  document.querySelectorAll('#bookTabs button').forEach((b) => b.classList.toggle('act', b.dataset.k === k));
  $('bookBody').scrollTop = 0;
}
function toggleBook() { $('book').classList.contains('on') ? closeBook() : ($('book').classList.add('on'), showBookTab(document.querySelector('#bookTabs .act')?.dataset.k || 'school')); }
function closeBook() { $('book').classList.remove('on'); }

// 투어
function startTour(i = 0) {
  ST.mode = 'tour'; ST.paused = true;
  document.body.dataset.mode = 'tour';
  $('bMode').textContent = '🚶 걸어 보기';
  $('title').classList.remove('on'); $('end').classList.remove('on'); closePanel();
  PLAYER.p.g.visible = false; PLAYER.b.g.visible = false; PLAYER.vis = false;
  tourGo(i);
}
function tourGo(i) {
  ST.tourI = i;
  const s = DAY[i];
  ST.m = s.t + 1;
  applySlot(i, true);
  const [p, l] = CAMS[s.id];
  CAM.orb = 0;
  flyTo(p, l, 2);
  if (camera.position.lengthSq() < 1) CAM.tw.t = 1;
  $('tourBody').innerHTML = slotCardHTML(i);
  $('tourDots').innerHTML = DAY.map((_, j) => `<i class="${j === i ? 'on' : j < i ? 'done' : ''}"></i>`).join('');
  $('tPrev').disabled = i === 0;
  $('tNext').textContent = i === DAY.length - 1 ? '하루 끝 ▶' : '다음 ▶';
  $('tour').classList.add('on');
  if (s.id === 'world') drawScreen(true, 0);
  viewOffset();
}
function viewOffset() {
  const on = ST.mode === 'tour' && $('tour').classList.contains('on');
  if (on) camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * (innerWidth < 700 ? 0.26 : 0.2), innerWidth, innerHeight);
  else camera.clearViewOffset();
}
function tourStep(d) {
  const i = ST.tourI + d;
  if (i < 0) return;
  if (i >= DAY.length) { $('tour').classList.remove('on'); viewOffset(); showEnd(); return; }
  tourGo(i);
}
function startWalk(fromTitle) {
  const was = ST.mode;
  ST.mode = 'walk'; ST.paused = false;
  document.body.dataset.mode = 'walk';
  $('bMode').textContent = '🎬 따라가기';
  $('title').classList.remove('on'); $('tour').classList.remove('on'); $('end').classList.remove('on');
  PLAYER.p.g.visible = true; PLAYER.vis = true;
  CAM.tw = null;
  if (fromTitle || ST.m >= DAY_END) resetDay();
  else if (was === 'tour') {
    const s = DAY[ST.slot], [px, pz] = PLACES[s.place].pos, d = Math.hypot(px, pz) || 1, off = PLACES[s.place].r + 2;
    PLAYER.x = px - px / d * off; PLAYER.z = pz - pz / d * off;
    if (s.place === 'tree') { PLAYER.x = 0; PLAYER.z = 15; }
    CAM.yaw = Math.atan2(PLAYER.x - px, PLAYER.z - pz);
    PLAYER.b.pos.set(PLAYER.x, 2, PLAYER.z);
  }
  setPauseBtn(); updateNow(); viewOffset();
}
function resetDay() {
  ST.m = 482; ST.slot = -1; ST.endShown = false;
  KIDS.forEach((k) => { k.vis = false; k.boarded = false; k.x = BUS_DOOR.x; k.z = BUS_DOOR.z; k.b.pos.set(k.x, 2, k.z); });
  applySlot(0, false); ST.slot = -1;
  PLAYER.x = -3.5; PLAYER.z = 63.5; PLAYER.yaw = Math.PI; CAM.yaw = Math.PI; CAM.pitch = 0.3; CAM.dist = 8;
  PLAYER.b.pos.set(PLAYER.x, 2, PLAYER.z);
  updateNow();
  toast('통통버스가 오고 있어요. 아이들을 따라 정문으로 들어가 봐요!');
}
function nextScene() {
  if (ST.mode === 'tour') return tourStep(1);
  if (ST.mode !== 'walk') return;
  const i = ST.slot + 1;
  if (i >= DAY.length) { ST.m = DAY_END; return; }
  ST.m = DAY[i].t;
  KIDS.forEach((k) => { k.vis = true; });
  applySlot(i, true);
  slotToast(i);
}
function slotToast(i) {
  const s = DAY[i];
  toast(`<b>${fmt(s.t)} ${esc(s.title)}</b> — ${esc(s.say[0])}<button class="tbtn" id="toastMore">이야기 보기</button>`, 6500);
  const b = $('toastMore'); if (b) b.onclick = () => openSlot(i);
}
function openSlot(i) {
  $('panelBody').innerHTML = slotCardHTML(i);
  $('panel').classList.add('on'); ST.panel = 'slot';
}
function togglePause() { ST.paused = !ST.paused; setPauseBtn(); }
function setPauseBtn() { $('bPause').textContent = ST.paused ? '▶ 시간 흐르기' : '⏸ 시간 멈춤'; }

// 끝 화면 · 물음 씨앗
const MY_SEEDS = [];
function addSeedLabel(text, save) {
  const i = MY_SEEDS.length, a = i * 2.39 + 1.1;
  const s = label(text, { h: 0.55, fs: 34, bg: 'rgba(255,214,102,.98)', fg: '#4a2f0b', pad: 14, round: 8, border: 'rgba(255,255,255,.9)' });
  s.position.set(Math.sin(a) * 4.6, 5.2 + (i % 4) * 0.5, Math.cos(a) * 4.6);
  s.userData.base = s.position.y;
  scene.add(s); TREE.seedLabels.push(s); MY_SEEDS.push(text);
  if (save) { try { localStorage.setItem('q36.seeds', JSON.stringify(MY_SEEDS.slice(-12))); } catch (e) { /* 저장 안 돼도 괜찮아요 */ } }
}
try { (JSON.parse(localStorage.getItem('q36.seeds') || '[]') || []).slice(-12).forEach((t) => addSeedLabel(t, false)); } catch (e) { /* 없음 */ }
function showEnd() {
  ST.endShown = true; ST.paused = true;
  $('end').classList.add('on'); $('endDone').classList.remove('on'); $('endAsk').classList.add('on');
  $('seedIn').value = '';
}
$('seedGo').onclick = () => {
  const t = $('seedIn').value.trim().slice(0, 40);
  if (!t) { $('seedIn').focus(); return; }
  addSeedLabel(t, true);
  $('endAsk').classList.remove('on'); $('endDone').classList.add('on');
  flyTo([7, 7, 13], [0, 5.6, 0], 2);
  if (ST.mode === 'walk') { ST.mode = 'tour'; document.body.dataset.mode = 'tour'; PLAYER.p.g.visible = false; PLAYER.vis = false; }
};

// 단추 연결
$('goTour').onclick = () => startTour(0);
$('goWalk').onclick = () => startWalk(true);
$('goBook').onclick = () => { $('book').classList.add('on'); showBookTab('school'); };
$('tPrev').onclick = () => tourStep(-1);
$('tNext').onclick = () => tourStep(1);
$('tWalk').onclick = () => startWalk(false);
$('bPause').onclick = togglePause;
$('bNext').onclick = nextScene;
$('bLens').onclick = () => setLens(!ST.lens);
$('bBook').onclick = toggleBook;
$('bMode').onclick = () => ST.mode === 'tour' ? startWalk(false) : startTour(Math.max(0, ST.slot));
$('panelX').onclick = closePanel;
$('bookX').onclick = closeBook;
$('now').onclick = () => { if (ST.slot >= 0) openSlot(ST.slot); };
$('hint').onclick = () => { if (nearPlace) openPlace(nearPlace); };
$('endAgain').onclick = () => { $('end').classList.remove('on'); startTour(0); };
$('endWalk').onclick = () => { $('end').classList.remove('on'); startWalk(true); };
document.querySelectorAll('#bookTabs button').forEach((b) => { b.onclick = () => showBookTab(b.dataset.k); });
$('titleName').textContent = SCHOOL.name;
$('titleMotto').textContent = SCHOOL.motto;
$('titleLead').textContent = SCHOOL.big[0];

// ───────── 루프 ─────────
const clock = new THREE.Clock();
let T = 0, scrT = 0, fpsN = 0, fpsT = 0, lastNowMin = -1;
const camWant = new THREE.Vector3(), lookWant = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  T += dt;

  // 시간 흐름
  if (ST.mode === 'walk' && !ST.paused && !ST.panel && !$('book').classList.contains('on')) {
    ST.m += dt * ST.rate;
    let i = -1; for (let j = 0; j < DAY.length; j++) if (DAY[j].t <= ST.m) i = j;
    if (i !== ST.slot && i >= 0) { applySlot(i, false); slotToast(i); }
    if (ST.m >= DAY_END && !ST.endShown) showEnd();
  }
  // 버스에서 내리기 · 타기
  const m = ST.m;
  KIDS.forEach((k, j) => {
    if (!k.vis && m >= 488 + j * 0.1 && m < 900 && ST.slot <= 0) {
      k.vis = true; k.x = BUS_DOOR.x; k.z = BUS_DOOR.z; k.b.pos.set(k.x, 2, k.z);
      if (ST.slot < 0) { const s = spotsFor(DAY[0]).K[j]; assign(k, s, false); }
    }
    if (DAY[ST.slot]?.id === 'home' && m >= 922 + j * 0.28 && k.vis && !k.boarded) { k.tx = BUS_DOOR.x; k.tz = BUS_DOOR.z; k.pose = 'stand'; k.boarding = true; }
    if (k.boarding && Math.hypot(k.x - BUS_DOOR.x, k.z - BUS_DOOR.z) < 0.4) { k.vis = false; k.boarded = true; k.boarding = false; }
    if (m >= 928 && DAY[ST.slot]?.id === 'home') { k.vis = false; }
  });
  BUS.position.x = busX(m);
  BUS.visible = Math.abs(BUS.position.x) < 250;

  // 사람
  const slot = DAY[ST.slot];
  for (const k of KIDS) {
    k.p.g.visible = k.vis;
    if (!k.vis) { k.b.g.visible = false; continue; }
    const r = moveAgent(k, dt);
    k.p.g.position.set(k.x, 0, k.z); k.p.g.rotation.y = k.yaw;
    animPerson(k, r.moving, T, dt, r.run);
    updBanbi(k.b, k, zoneState(k, slot ? slot.banbi : 'on'), T, dt, false);
  }
  for (const t of TEACH) {
    const r = moveAgent(t, dt);
    t.p.g.position.set(t.x, 0, t.z); t.p.g.rotation.y = t.yaw;
    animPerson(t, r.moving, T, dt, false);
  }
  if (ST.mode === 'walk') {
    const r = movePlayer(dt);
    PLAYER.p.g.position.set(PLAYER.x, 0, PLAYER.z); PLAYER.p.g.rotation.y = PLAYER.yaw;
    PLAYER.pose = 'stand';
    animPerson(PLAYER, r.moving, T, dt, r.run);
    const prev = PLAYER.b.state, st = zoneState(PLAYER, slot ? slot.banbi : 'on');
    updBanbi(PLAYER.b, PLAYER, st, T, dt, true);
    if (prev !== st && prev) {
      if (st === 'nest' && Math.hypot(PLAYER.x - YARD.x, PLAYER.z - YARD.z) < YARD.r + 0.3) toast('흙마당이에요. 내 반디는 둥지로 날아가 기다려요 — 약속 3번!');
      else if (st === 'nest') toast(`${slot ? slot.title : ''} — 반디들이 둥지에서 쉬어요.`, 3000);
      else if (st === 'off') toast('심심 벤치·화해 의자 근처에선 반디 빛이 저절로 꺼져요.', 3500);
    }
  }

  // 움직이는 것들
  TREE.foliage.rotation.y = Math.sin(T * 0.25) * 0.01;
  for (const s of TREE.seedLabels) s.position.y = s.userData.base + Math.sin(T * 1.3 + s.position.x) * 0.05;
  for (const h of HOLOS) h.rotation.y += dt * 0.6;
  const lunch = m > 715 && m < 790;
  ROBOT_ARMS.forEach((a) => { const w = lunch ? T * 2 : T * 0.3; a.j1.rotation.z = Math.sin(w + a.ph) * 0.5; a.j2.rotation.z = Math.sin(w * 1.4 + a.ph) * 0.8; a.j1.rotation.y = Math.sin(w * 0.5) * 0.6; });
  BOTS.forEach((b) => {
    if (lunch) b.t += dt * 0.12;
    const k = (Math.sin(b.t * TAU) + 1) / 2, x = b.a[0] + (b.b[0] - b.a[0]) * k, z = b.a[1] + (b.b[1] - b.a[1]) * k;
    const dx = x - b.g.position.x, dz = z - b.g.position.z;
    if (Math.abs(dx) + Math.abs(dz) > 1e-4) b.g.rotation.y = Math.atan2(dx, dz);
    b.g.position.set(x, 0, z);
  });
  { const a = T * 0.02; MOWER.position.set(Math.sin(a) * 64, 0, Math.cos(a) * 64 - 4); MOWER.rotation.y = a + Math.PI / 2; }
  for (const b of BLADES) b.rotation.z += dt * 0.6;
  for (const c of CLOUDS) { c.position.x += c.userData.v * dt; if (c.position.x > 240) c.position.x = -240; }
  beacon.visible = ST.mode === 'walk' && ST.slot >= 0;
  beacon.userData.ring.scale.setScalar(1 + Math.sin(T * 3) * 0.08);
  scrT += dt;
  if (scrT > 0.25) { scrT = 0; drawScreen(slot?.id === 'world', T); }
  applySky(m);

  // 카메라
  if (ST.mode === 'title') {
    const a = T * 0.05 + 0.6;
    camera.position.set(Math.sin(a) * 62, 28, Math.cos(a) * 62);
    CAM.look.set(0, 4, 0); camera.lookAt(CAM.look);
  } else if (ST.mode === 'tour' && CAM.tw) {
    const tw = CAM.tw; tw.t = Math.min(1, tw.t + dt / tw.dur);
    const k = ease(tw.t);
    camWant.lerpVectors(tw.p0, tw.p1, k); CAM.look.lerpVectors(tw.l0, tw.l1, k);
    // 끌어서 살짝 돌려 보기
    const o = CAM.orb || 0;
    if (o) { const dx = camWant.x - CAM.look.x, dz = camWant.z - CAM.look.z; camWant.x = CAM.look.x + dx * Math.cos(o) - dz * Math.sin(o); camWant.z = CAM.look.z + dx * Math.sin(o) + dz * Math.cos(o); }
    camWant.y += k === 1 ? Math.sin(T * 0.4) * 0.15 : 0;
    camera.position.copy(camWant); camera.lookAt(CAM.look);
  } else if (ST.mode === 'walk') {
    lookWant.set(PLAYER.x, 1.35, PLAYER.z);
    camWant.set(PLAYER.x + Math.sin(CAM.yaw) * Math.cos(CAM.pitch) * CAM.dist, 1.35 + Math.sin(CAM.pitch) * CAM.dist, PLAYER.z + Math.cos(CAM.yaw) * Math.cos(CAM.pitch) * CAM.dist);
    camWant.y = Math.max(camWant.y, 0.6);
    const k = 1 - Math.exp(-dt * 9);
    camera.position.lerp(camWant, k); CAM.look.lerp(lookWant, k);
    camera.lookAt(CAM.look);
    // 가까운 장소
    let best = null, bd = 1e9;
    for (const key in PLACES) { const P = PLACES[key], d = Math.hypot(PLAYER.x - P.pos[0], PLAYER.z - P.pos[1]) / (P.r + 1.5); if (d < 1 && d < bd) { bd = d; best = key; } }
    if (best !== nearPlace) { nearPlace = best; $('hint').classList.toggle('on', !!best); if (best) $('hintT').textContent = PLACES[best].name; }
    // 방향 화살표
    if (slot) {
      const [px, pz] = PLACES[slot.place].pos, d = Math.hypot(px - PLAYER.x, pz - PLAYER.z);
      const ang = Math.atan2(px - PLAYER.x, pz - PLAYER.z), camAng = Math.atan2(-Math.sin(CAM.yaw), -Math.cos(CAM.yaw));
      $('arrow').style.transform = `rotate(${-(ang - camAng) * 180 / Math.PI}deg)`;
      $('arrow').style.opacity = d > PLACES[slot.place].r + 2 ? 1 : 0.15;
    }
  }
  sky.position.copy(camera.position);
  const mm = Math.floor(m);
  if (mm !== lastNowMin) { lastNowMin = mm; $('clock').textContent = fmt(Math.min(m, DAY_END)); }

  renderer.render(scene, camera);
  fpsN++; fpsT += dt; if (fpsT > 1) { window.Q36.fps = Math.round(fpsN / fpsT); fpsN = 0; fpsT = 0; }
  requestAnimationFrame(frame);
}

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); viewOffset(); });

// 확인·시험용
window.Q36 = {
  ST, KIDS, PLAYER, CAM, keys, renderer, fps: 0, mt: () => moveTarget,
  time: (hhmm) => { const [h, mi] = hhmm.split(':').map(Number); ST.m = h * 60 + mi; },
  tour: startTour, walk: startWalk, lens: setLens, next: nextScene,
  info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures, fps: window.Q36.fps })
};

applySky(ST.m);
drawScreen(false, 0);
$('boot').remove();
if (Q.get('tour') === '1') startTour(Number(Q.get('i') || 0));
else if (Q.get('walk') === '1') startWalk(true);
else { $('title').classList.add('on'); document.body.dataset.mode = 'title'; ST.m = DAY[3].t + 5; applySlot(3, true); }
if (Q.get('lens') === '1') setLens(true);
requestAnimationFrame(frame);
