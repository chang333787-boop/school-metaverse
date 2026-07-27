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

// ---------- 입력 ----------
const keys = new Set();
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'KeyF') fpsBox.classList.toggle('hidden');
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
  if (hudAcc > 0.25) {
    hudAcc = 0;
    locChip.textContent = '📍 ' + zoneLabel();
    fpsVal = Math.round(fpsN / fpsAcc);
    fpsBox.textContent = fpsVal + ' fps';
    fpsAcc = 0; fpsN = 0;
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
