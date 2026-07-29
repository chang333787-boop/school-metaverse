// 우리학교 메타버스 — 부트스트랩/카메라/HUD
import * as THREE from 'three';
import { SCHOOL } from './data.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ed3f5);
scene.fog = new THREE.Fog(0x9ed3f5, 70, 270);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 500);

scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x87996b, 1.25));
const sun = new THREE.DirectionalLight(0xfff2d9, 1.7);
sun.position.set(60, 95, 45);
scene.add(sun);

const world = buildWorld(scene);
const player = new Player(scene, world);

// ---------- 카메라 ----------
let camYaw = 0, camPitch = 0.42, camDist = 5.6;
const camRay = new THREE.Raycaster();
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', e => {
  if (!dragging) return;
  camYaw -= (e.clientX - lastX) * 0.0062;
  camPitch = Math.min(1.25, Math.max(0.08, camPitch + (e.clientY - lastY) * 0.005));
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('wheel', e => {
  camDist = Math.min(10, Math.max(2.6, camDist + e.deltaY * 0.004));
}, { passive: true });

function updateCamera(dt) {
  const target = new THREE.Vector3(player.pos.x, player.pos.y + 1.45, player.pos.z);
  const dir = new THREE.Vector3(
    Math.sin(camYaw) * Math.cos(camPitch),
    Math.sin(camPitch),
    Math.cos(camYaw) * Math.cos(camPitch)
  );
  let dist = camDist;
  camRay.set(target, dir);
  camRay.far = camDist + 0.3;
  const hits = camRay.intersectObjects(world.colliders, false);
  if (hits.length) dist = Math.max(1.1, hits[0].distance - 0.35);
  const desired = target.clone().addScaledVector(dir, dist);
  desired.y = Math.max(desired.y, player.pos.y + 0.35);
  const k = 1 - Math.exp(-14 * dt);
  camera.position.lerp(desired, k);
  camera.lookAt(target);
}

// ---------- 상호작용 (E키: 문·컴퓨터·의자) ----------
const msgBox = document.createElement('div');
msgBox.style.cssText = 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);background:rgba(29,53,87,.85);color:#fff;padding:7px 14px;border-radius:10px;font:14px sans-serif;z-index:40;display:none;';
document.body.appendChild(msgBox);
let msgTimer = 0;
function toast(t) {
  msgBox.textContent = t;
  msgBox.style.display = 'block';
  msgTimer = 1.6;
}
const hint = document.createElement('div');
hint.style.cssText = 'position:fixed;left:10px;bottom:10px;background:rgba(29,53,87,.72);color:#fff;padding:6px 10px;border-radius:8px;font:12px sans-serif;z-index:30;';
hint.textContent = 'E: 문 열고닫기 · 컴퓨터 켜기 · 의자에 앉기';
document.body.appendChild(hint);

function interact() {
  const p = player.pos;
  let best = null, bestD = 2.3;
  for (const d of world.doors) {
    if (Math.abs(p.y - d.y) > 2.4) continue;
    const dist = Math.hypot(p.x - d.x, p.z - d.z);
    if (dist < bestD) { best = { kind: 'door', o: d }; bestD = dist; }
  }
  for (const it of world.interactables) {
    if (Math.abs(p.y - it.y) > 2) continue;
    const dist = Math.hypot(p.x - it.x, p.z - it.z);
    const lim = it.type === 'chair' ? 1.5 : 1.7;
    if (dist < Math.min(bestD, lim)) { best = { kind: it.type, o: it }; bestD = dist; }
  }
  if (!best) return;
  if (best.kind === 'door') {
    const d = best.o;
    d.open = !d.open;
    d.group.rotation.y = d.open ? d.openRot : 0;
    toast(d.open ? '문을 열었다' : '문을 닫았다');
  } else if (best.kind === 'computer') {
    const it = best.o;
    it.on = !it.on;
    it.mesh.material.color.set(it.on ? 0x9fd8ff : 0x1a2b30);
    toast(it.on ? '컴퓨터를 켰다! 🖥️' : '컴퓨터를 껐다');
  } else if (best.kind === 'chair') {
    player.sit(best.o);
    toast('의자에 앉았다 (이동키로 일어나기)');
  }
}

// ---------- 미니맵 ----------
const mm = document.createElement('canvas');
mm.width = 220; mm.height = 160;
mm.style.cssText = 'position:fixed;right:10px;top:10px;width:176px;height:128px;background:rgba(240,246,250,.85);border:2px solid #1d3557;border-radius:10px;z-index:30;';
document.body.appendChild(mm);
const mmx = mm.getContext('2d');
function mmDraw() {
  const W = mm.width, H = mm.height;
  const bd = SCHOOL.bounds;
  const sx = x => (x + bd.x) / (bd.x * 2) * (W - 10) + 5;
  const sz = z => (z - SCHOOL.bounds.zMin) / (bd.zMax - bd.zMin) * (H - 10) + 5;
  const rect = (x0, z0, x1, z1, c) => {
    mmx.fillStyle = c;
    mmx.fillRect(sx(x0), sz(z0), sx(x1) - sx(x0), sz(z1) - sz(z0));
  };
  mmx.clearRect(0, 0, W, H);
  const F = SCHOOL.field, B = SCHOOL.building;
  rect(F.center[0] - F.width / 2, F.center[1] - F.depth / 2, F.center[0] + F.width / 2, F.center[1] + F.depth / 2, '#e4cf9d');
  rect(B.front.x[0], B.front.z[0], B.front.x[1], B.front.z[1], '#5aa877');
  B.wings.forEach(w => rect(w.x[0], w.z[0], w.x[1], w.z[1], '#5aa877'));
  rect(B.kitchen.x[0], B.kitchen.z[0], B.kitchen.x[1], B.kitchen.z[1], '#4a4e54');
  rect(B.linkCorridor.x[0], B.eastWing.z[0], B.linkCorridor.x[1], B.front.z[0], '#5aa877');
  rect(B.eastWing.x[0], B.eastWing.z[0], B.eastWing.x[1], B.eastWing.z[1], '#5aa877');
  const G = SCHOOL.gym;
  rect(G.center[0] - G.width / 2, G.center[1] - G.depth / 2, G.center[0] + G.width / 2, G.center[1] + G.depth / 2, '#c35233');
  const GA = SCHOOL.garden;
  rect(GA.center[0] - GA.width / 2, GA.center[1] - GA.depth / 2, GA.center[0] + GA.width / 2, GA.center[1] + GA.depth / 2, '#8a5a30');
  rect(SCHOOL.playground.center[0] - 8.5, SCHOOL.playground.center[1] - 7, SCHOOL.playground.center[0] + 8.5, SCHOOL.playground.center[1] + 7, '#e8b64f');
  rect(SCHOOL.gate[0] - 2, SCHOOL.gate[1] - 1.5, SCHOOL.gate[0] + 2, SCHOOL.gate[1] + 1, '#7a5230');
  // 내 위치
  mmx.fillStyle = '#e3453a';
  mmx.beginPath();
  mmx.arc(sx(player.pos.x), sz(player.pos.z), 4, 0, Math.PI * 2);
  mmx.fill();
  mmx.strokeStyle = '#e3453a';
  mmx.lineWidth = 2;
  mmx.beginPath();
  mmx.moveTo(sx(player.pos.x), sz(player.pos.z));
  mmx.lineTo(sx(player.pos.x) + Math.sin(player.yaw) * 8, sz(player.pos.z) + Math.cos(player.yaw) * 8);
  mmx.stroke();
}

// ---------- 입력 ----------
const keys = new Set();
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'KeyF') fpsBox.classList.toggle('hidden');
  if (e.code === 'KeyE') interact();
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

// ---------- HUD ----------
const locChip = document.getElementById('loc');
const fpsBox = document.getElementById('fps');
function zoneLabel() {
  const { x, y, z } = player.pos;
  const fl = y > 2.2 ? 1 : 0;
  for (const zn of world.zones) {
    if (zn.floor !== undefined && zn.floor !== fl) continue;
    if (x >= zn.x0 && x <= zn.x1 && z >= zn.z0 && z <= zn.z1) {
      if (zn.floor === undefined && y > 2.2) continue; // 실외 zone은 지상에서만
      return zn.label;
    }
  }
  return '학교 마당';
}

// ---------- 시작 오버레이 ----------
const overlay = document.getElementById('overlay');
document.getElementById('startBtn').addEventListener('click', () => {
  overlay.classList.add('hidden');
  canvas.focus();
});
document.getElementById('schoolName').textContent = SCHOOL.name;
document.getElementById('tagline').textContent = SCHOOL.tagline;
document.getElementById('ver').textContent = SCHOOL.tagline;

// ---------- 루프 ----------
const clock = new THREE.Clock();
let fpsAcc = 0, fpsN = 0, fpsVal = 0, hudAcc = 0;
window.__lastErr = null;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  try {
    player.update(dt, keys, camYaw);
  } catch (err) {
    window.__lastErr = String(err.stack || err);
    return;
  }
  updateCamera(dt);
  const t = clock.elapsedTime;
  if (world.dynamic.flag) world.dynamic.flag.rotation.y = Math.sin(t * 1.8) * 0.28 + 0.1;
  world.dynamic.clouds.forEach((c, i) => {
    c.position.x += dt * (0.55 + i * 0.12);
    if (c.position.x > 110) c.position.x = -110;
  });
  fpsAcc += dt; fpsN++;
  hudAcc += dt;
  if (msgTimer > 0) {
    msgTimer -= dt;
    if (msgTimer <= 0) msgBox.style.display = 'none';
  }
  if (hudAcc > 0.25) {
    hudAcc = 0;
    locChip.textContent = '📍 ' + zoneLabel();
    fpsVal = Math.round(fpsN / fpsAcc);
    fpsBox.textContent = fpsVal + ' fps';
    fpsAcc = 0; fpsN = 0;
    mmDraw();
  }
  renderer.render(scene, camera);
}
loop();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- 검증용 디버그 (콘솔에서 사용) ----------
window.SD = {
  player, world,
  step(n = 1, keyList = [], dt = 1 / 60) {
    const ks = new Set(keyList);
    for (let i = 0; i < n; i++) {
      player.update(dt, ks, camYaw);
      updateCamera(dt);
    }
    renderer.render(scene, camera);
  },
  tp(x, z, y = 0) { player.pos.set(x, y, z); player.vy = 0; player.airborne = false; },
  pos: () => [player.pos.x.toFixed(1), player.pos.y.toFixed(1), player.pos.z.toFixed(1)],
  yaw: v => { camYaw = v; },
  fps: () => fpsVal,
  zone: zoneLabel,
};
