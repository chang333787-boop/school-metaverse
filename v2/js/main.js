// v2 부트 — 헌법⑤⑥: 정수 해상도만 · AABB 충돌만 · 매초 예산 계측
import * as THREE from 'three';
import { buildWorld } from './world.js';
import { SCHOOL } from '../../js/data.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const DPR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(DPR);                       // 네이티브(비정수 업스케일 금지)
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe9f8);
scene.fog = new THREE.Fog(0xcfe9f8, 80, 260);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.4, 320);
const hemi = new THREE.HemisphereLight(0xc9dcf0, 0xb08a5e, 1.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0cf, 3.1);
sun.position.set(60, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 95, bottom: -95, near: 10, far: 260 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun);

const world = buildWorld(scene);

// ---------- 플레이어 (AABB 전용 — 레이캐스트 0) ----------
const P = { x: 6, y: 0.01, z: 8, vy: 0, yaw: 0, ground: true };
const pg = new THREE.Group();
{
  const m = (w,h,d,c,y)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshLambertMaterial({color:c})); b.position.y=y; pg.add(b); return b; };
  m(0.44,0.5,0.3,0x4d9bd6,0.85); m(0.4,0.38,0.38,0xf6cfa4,1.33); m(0.44,0.16,0.42,0x3a2e28,1.56);
  m(0.16,0.6,0.2,0x2b3a55,0.3).position.x=-0.12; m(0.16,0.6,0.2,0x2b3a55,0.3).position.x=0.12;
}
scene.add(pg);

function terrainY(x, z) { return z > world.TERR_Z ? -1 : 0; }
function groundAt(x, z, fromY) {
  let g = terrainY(x, z);
  const k0x = Math.floor((x-0.3)/8), k1x = Math.floor((x+0.3)/8), k0z = Math.floor((z-0.3)/8), k1z = Math.floor((z+0.3)/8);
  const seen = new Set();
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = world.grid.get(gx+':'+gz); if (!cell) continue;
    for (const i of cell) { if (seen.has(i)) continue; seen.add(i);
      const b = world.colliders[i];
      if (x > b.x0-0.26 && x < b.x1+0.26 && z > b.z0-0.26 && z < b.z1+0.26 && b.y1 <= fromY + 0.55 && b.y1 > g) g = b.y1;
    }
  }
  return g;
}
function blockedAt(x, z, y) {
  const k0x = Math.floor((x-0.3)/8), k1x = Math.floor((x+0.3)/8), k0z = Math.floor((z-0.3)/8), k1z = Math.floor((z+0.3)/8);
  const seen = new Set();
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = world.grid.get(gx+':'+gz); if (!cell) continue;
    for (const i of cell) { if (seen.has(i)) continue; seen.add(i);
      const b = world.colliders[i];
      if (x > b.x0-0.26 && x < b.x1+0.26 && z > b.z0-0.26 && z < b.z1+0.26 && b.y1 > y + 0.55 && b.y0 < y + 1.5) return true;
    }
  }
  return false;
}

const keys = new Set();
addEventListener('keydown', e => keys.add(e.code));
addEventListener('keyup', e => keys.delete(e.code));
let camYaw = 0, camPitch = 0.3;
canvas.addEventListener('click', () => canvas.requestPointerLock());
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  camYaw -= e.movementX * 0.0026;
  camPitch = Math.max(-0.2, Math.min(1.1, camPitch + e.movementY * 0.0022));
});

function step(dt) {
  const sp = keys.has('ShiftLeft') ? 7.5 : 4.2;
  let mx = 0, mz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) { mx -= Math.sin(camYaw); mz -= Math.cos(camYaw); }
  if (keys.has('KeyS') || keys.has('ArrowDown')) { mx += Math.sin(camYaw); mz += Math.cos(camYaw); }
  if (keys.has('KeyA') || keys.has('ArrowLeft')) { mx -= Math.cos(camYaw); mz += Math.sin(camYaw); }
  if (keys.has('KeyD') || keys.has('ArrowRight')) { mx += Math.cos(camYaw); mz -= Math.sin(camYaw); }
  const L = Math.hypot(mx, mz);
  if (L > 0) {
    mx /= L; mz /= L;
    const nx = P.x + mx * sp * dt, nz = P.z + mz * sp * dt;
    if (!blockedAt(nx, P.z, P.y)) P.x = nx;
    if (!blockedAt(P.x, nz, P.y)) P.z = nz;
    P.yaw = Math.atan2(mx, mz);
  }
  if (keys.has('Space') && P.ground) { P.vy = 5.2; P.ground = false; }
  P.vy -= 14 * dt;
  P.y += P.vy * dt;
  const g = groundAt(P.x, P.z, P.y + 0.6);
  if (P.y <= g) { P.y = g; P.vy = 0; P.ground = true; }
  pg.position.set(P.x, P.y, P.z);
  pg.rotation.y = P.yaw;
  const cd = 6.3;
  camera.position.set(
    P.x + Math.sin(camYaw) * Math.cos(camPitch) * cd,
    P.y + 1.3 + Math.sin(camPitch) * cd,
    P.z + Math.cos(camYaw) * Math.cos(camPitch) * cd);
  camera.lookAt(P.x, P.y + 1.3, P.z);
}

// ---------- 루프 + 예산 계측(헌법⑥) ----------
const clock = new THREE.Clock();
const fpsBox = document.getElementById('fps');
let acc = 0, n = 0, simMs = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  const t0 = performance.now();
  step(dt);
  simMs = Math.max(simMs, performance.now() - t0);
  renderer.render(scene, camera);
  acc += dt; n++;
  if (acc > 1) {
    const fps = Math.round(n / acc);
    const dc = renderer.info.render.calls;
    fpsBox.textContent = fps + ' fps · ' + dc + ' dc · sim ' + simMs.toFixed(2) + 'ms';
    if (dc > 300) console.warn('예산 초과: drawCalls', dc);
    if (simMs > 1) console.warn('예산 초과: sim ms', simMs.toFixed(2));
    acc = 0; n = 0; simMs = 0;
  }
}
loop();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// 디버그 API (v1과 같은 사용감)
window.SD2 = {
  scene, camera, renderer, world,
  tp(x, z, y = null) { P.x = x; P.z = z; P.y = y ?? (terrainY(x, z) + 0.01); P.vy = 0; },
  yaw(v) { camYaw = v; },
  pos: () => [P.x.toFixed(1), P.y.toFixed(1), P.z.toFixed(1)],
  step(nn = 1, keyList = []) { keyList.forEach(k => keys.add(k)); for (let i = 0; i < nn; i++) step(1/60); keyList.forEach(k => keys.delete(k)); renderer.render(scene, camera); },
};
