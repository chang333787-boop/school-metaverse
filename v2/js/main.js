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

// 카메라 가림 방지(v1 이식): 머리→카메라 선분을 콜라이더 AABB와 교차 검사(슬랩법 — 레이캐스트 아님, 헌법⑤ 유지)
// 낮은 가구는 통과, 벽·기둥(높이≥1.5m)과 머리 위 부재(인방·천장)만 막는다. 히트 시 벽 앞 0.3m로 당김.
function camHit(hx, hy, hz, dx, dy, dz, maxD) {
  let t = maxD;
  const ex = hx + dx*maxD, ez = hz + dz*maxD;
  const k0x = Math.floor((Math.min(hx,ex)-0.4)/8), k1x = Math.floor((Math.max(hx,ex)+0.4)/8);
  const k0z = Math.floor((Math.min(hz,ez)-0.4)/8), k1z = Math.floor((Math.max(hz,ez)+0.4)/8);
  const seen = new Set();
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = world.grid.get(gx+':'+gz); if (!cell) continue;
    for (const i of cell) {
      if (seen.has(i)) continue; seen.add(i);
      const b = world.colliders[i];
      if (b.y1 - b.y0 < 1.5 && b.y0 < hy + 0.4) continue;
      let t0 = 1e-4, t1 = t, ok = true;
      for (let ax = 0; ax < 3 && ok; ax++) {
        const o = ax===0?hx:ax===1?hy:hz, d9 = ax===0?dx:ax===1?dy:dz;
        const lo = ax===0?b.x0:ax===1?b.y0:b.z0, hi = ax===0?b.x1:ax===1?b.y1:b.z1;
        if (Math.abs(d9) < 1e-8) { if (o < lo || o > hi) ok = false; }
        else {
          let a = (lo-o)/d9, c9 = (hi-o)/d9;
          if (a > c9) { const s9 = a; a = c9; c9 = s9; }
          if (a > t0) t0 = a; if (c9 < t1) t1 = c9;
          if (t0 > t1) ok = false;
        }
      }
      if (ok && t0 < t) t = t0;
    }
  }
  return t;
}

const keys = new Set();
addEventListener('keydown', e => keys.add(e.code));
addEventListener('keyup', e => keys.delete(e.code));
let camYaw = 0, camPitch = 0.3;
const CAM_D = 6.3;
let camD = CAM_D;
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
  const hx = P.x, hy = P.y + 1.3, hz = P.z;
  const dx = Math.sin(camYaw) * Math.cos(camPitch), dy = Math.sin(camPitch), dz = Math.cos(camYaw) * Math.cos(camPitch);
  const want = Math.max(0.5, Math.min(CAM_D, camHit(hx, hy, hz, dx, dy, dz, CAM_D) - 0.3));
  camD = want < camD ? want : camD + (want - camD) * Math.min(1, dt * 7);   // 당김은 즉시·복귀는 이징(지터 방지)
  camera.position.set(hx + dx * camD, hy + dy * camD, hz + dz * camD);
  camera.lookAt(hx, hy, hz);
}

// ---------- 문짝(미닫이) ----------
// 움직이므로 청크 병합 밖의 개별 Mesh. 통행은 막지 않는다(콜라이더 없음) — 도달성 검사 결과가 그대로 유지된다.
// 벽면에서 6cm 띄워 벽 위를 미끄러지게 한다(벽 속으로 사라지면 문이 없어진 것처럼 보인다).
const doorMat = new THREE.MeshLambertMaterial({ color: 0xc08b4f });
const DOORS = world.doors.map(d => {
  // 🔴OFF=0: 문은 벽 두께(0.3) 안에서만 미끄러진다 = 포켓 도어.
  // 벽 밖으로 내밀면(0.28이었음) 벽면에 붙은 칠판과 같은 평면이 되어 반짝인다.
  // 문짝은 개별 Mesh라 빌드 감사(헌법③)가 보지 못한다 — 그래서 '벽 안에서만 움직인다'를 규칙으로 못박는다.
  const w = Math.min(d.w, 1.9), h = 2.5, OFF = 0;      // 높이는 개구 2.6에 맞춤
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(d.ax === 'x' ? w : 0.16, h, d.ax === 'x' ? 0.16 : w), doorMat);
  const bx = d.ax === 'x' ? d.cx : d.cx + OFF, bz = d.ax === 'x' ? d.cz + OFF : d.cz;
  mesh.position.set(bx, d.y0 + h / 2, bz);
  mesh.matrixAutoUpdate = false; mesh.updateMatrix();
  scene.add(mesh);
  return { mesh, ax: d.ax, bx, bz, w, y0: d.y0, open: 0 };
});
function doorTick(dt) {
  for (const o of DOORS) {
    const dx = P.x - o.bx, dz = P.z - o.bz;
    const target = (dx * dx + dz * dz < 9 && Math.abs(P.y - o.y0) < 2) ? 1 : 0;
    if (Math.abs(target - o.open) < 0.002) continue;
    o.open += (target - o.open) * Math.min(1, dt * 6);
    const s = o.open * o.w * 0.94 * o.dir;
    if (o.ax === 'x') o.mesh.position.x = o.bx + s; else o.mesh.position.z = o.bz + s;
    o.mesh.updateMatrix();
  }
}

// 문 경로 간섭 검사 — 문짝은 개별 Mesh라 헌법③ 빌드 감사가 못 본다(칠판과 겹쳐 반짝인 사고).
// 문이 닫힘→열림으로 쓸고 가는 볼륨에 '벽이 아닌 얇은 부재'(칠판·게시판 등)가 있으면 잡는다.
function sweepHits(o, dir) {
  const s = o.w * 0.94 * dir, T = 0.09, y0 = o.y0, y1 = o.y0 + 2.5;
  const lo = Math.min(0, s), hi = Math.max(0, s);
  const sw = o.ax === 'x'
    ? { x0: o.bx - o.w/2 + lo, x1: o.bx + o.w/2 + hi, z0: o.bz - T, z1: o.bz + T }
    : { x0: o.bx - T, x1: o.bx + T, z0: o.bz - o.w/2 + lo, z1: o.bz + o.w/2 + hi };
  let n = 0;
  for (const b of world.allBoxes) {
    if ((o.ax === 'x' ? b.z1 - b.z0 : b.x1 - b.x0) > 0.29) continue;   // 벽(0.3)은 문이 숨는 곳이니 제외
    if (b.x1 <= sw.x0 || b.x0 >= sw.x1 || b.z1 <= sw.z0 || b.z0 >= sw.z1 || b.y1 <= y0 || b.y0 >= y1) continue;
    n++;
  }
  return n;
}
// 열림 방향은 빌드 때 1회 자동 결정 — 간섭이 적은 쪽으로 연다(창문·칠판을 알아서 피한다)
DOORS.forEach(o => { o.dir = sweepHits(o, 1) <= sweepHits(o, -1) ? 1 : -1; });
function doorCheck() {
  const bad = [];
  for (const o of DOORS) if (sweepHits(o, o.dir)) bad.push([+o.bx.toFixed(1), +o.bz.toFixed(1)]);
  if (bad.length) console.error('🚪 문 경로 간섭 ' + bad.length + '건: ' + JSON.stringify(bad.slice(0, 6)));
  else console.log('✅ 문 경로 간섭 0 (문 ' + DOORS.length + '개)');
  return bad;
}

// ---------- 시간대·위치표시는 loop() 위에 둔다(loop가 참조 — 아래 두면 TDZ로 월드가 통째로 죽는다) ----------
// ---------- 시간대(낮·노을·밤) ----------
// 전환할 때만 그림자를 1회 다시 굽는다. 실시간 시간 흐름은 넣지 않는다(연속 재굽기=프레임 붕괴)
const TIMES = {
  day:    { label: '☀️ 낮',  bg: 0xcfe9f8, near: 80, far: 260, sky: 0xc9dcf0, gnd: 0xb08a5e, hi: 1.4,  sc: 0xfff0cf, si: 3.1, sp: [60, 95, 45],   exp: 1.12 },
  sunset: { label: '🌇 노을', bg: 0xf3c193, near: 60, far: 230, sky: 0xf4cba4, gnd: 0x8a6a4e, hi: 1.15, sc: 0xffb066, si: 2.4, sp: [-88, 34, 26],  exp: 1.06 },
  night:  { label: '🌙 밤',  bg: 0x1f2b3f, near: 40, far: 175, sky: 0x35485f, gnd: 0x1d2430, hi: 0.6,  sc: 0xa8bcda, si: 0.75, sp: [-30, 80, -60], exp: 1.0 },
};
const ORDER = ['day', 'sunset', 'night'];
let timeKey = 'day';
const timeBtn = document.createElement('div');
timeBtn.className = 'chip';
timeBtn.style.cssText = 'right:10px;bottom:10px;cursor:pointer;user-select:none';
document.body.appendChild(timeBtn);
function setTime(k) {
  const t = TIMES[k]; if (!t) return timeKey;
  timeKey = k;
  scene.background.setHex(t.bg);
  scene.fog.color.setHex(t.bg); scene.fog.near = t.near; scene.fog.far = t.far;
  hemi.color.setHex(t.sky); hemi.groundColor.setHex(t.gnd); hemi.intensity = t.hi;
  sun.color.setHex(t.sc); sun.intensity = t.si; sun.position.set(t.sp[0], t.sp[1], t.sp[2]);
  renderer.toneMappingExposure = t.exp;
  renderer.shadowMap.needsUpdate = true;
  timeBtn.textContent = t.label;
  return k;
}
timeBtn.addEventListener('click', e => { e.stopPropagation(); setTime(ORDER[(ORDER.indexOf(timeKey) + 1) % 3]); });
setTime('day');

// ---------- 현재 위치 표시 ----------
const locBox = document.getElementById('loc');
let locT = 0;
function updateLoc() {
  let name = '학교';
  for (const z of world.zones) {
    if (P.x > z.x0 && P.x < z.x1 && P.z > z.z0 && P.z < z.z1 && Math.abs(P.y - (z.y ?? 0)) < 1.2) { name = z.label; break; }
  }
  locBox.textContent = '📍 ' + name;
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
  doorTick(dt);
  simMs = Math.max(simMs, performance.now() - t0);
  renderer.render(scene, camera);
  acc += dt; n++;
  locT += dt;
  if (locT > 0.4) { locT = 0; updateLoc(); }
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

// ---------- 도달성 검사 (전 실 자동 답사) ----------
// 플레이어와 똑같은 규칙(blockedAt·groundAt·오름 0.55)으로 걸을 수 있는 칸을 전부 채워보고,
// 등록된 모든 구역에 실제로 닿는지 판정한다. "문이 있다"가 아니라 "도달된다"가 기준.
function reach(opt = {}) {
  // 격자 0.3m: 계단 단 깊이(0.72)보다 촘촘해야 한 칸 이동이 한 단을 넘지 않는다(0.5는 두 단을 건너뛰어 오탐)
  const S = opt.step || 0.3, sx = opt.from ? opt.from[0] : 6, sz = opt.from ? opt.from[1] : 8;
  const key = (ix, iz, y) => ix + ',' + iz + ',' + Math.round(y * 2);
  const seen = new Set(), hits = new Map();
  const start = { x: sx, z: sz, y: groundAt(sx, sz, 2) };
  const q = [start];
  seen.add(key(Math.round(sx/S), Math.round(sz/S), start.y));
  const zs = world.zones;
  const mark = (x, z, y) => {
    for (let i = 0; i < zs.length; i++) {
      const Z = zs[i];
      if (x > Z.x0 && x < Z.x1 && z > Z.z0 && z < Z.z1 && Math.abs(y - (Z.y ?? 0)) < 1.2)
        hits.set(i, (hits.get(i) || 0) + 1);
    }
  };
  mark(start.x, start.z, start.y);
  const DIR = [[1,0],[-1,0],[0,1],[0,-1]];
  let pops = 0;
  while (q.length && pops < 900000) {
    const c = q.pop(); pops++;
    for (const [dx, dz] of DIR) {
      const nx = c.x + dx*S, nz = c.z + dz*S;
      if (nx < -80 || nx > 80 || nz < -68 || nz > 44) continue;
      if (blockedAt(nx, nz, c.y)) continue;
      const g = groundAt(nx, nz, c.y + 0.6);
      if (g > c.y + 0.55) continue;                 // 못 오르는 턱
      const k = key(Math.round(nx/S), Math.round(nz/S), g);
      if (seen.has(k)) continue;
      seen.add(k);
      mark(nx, nz, g);
      q.push({ x: nx, z: nz, y: g });
    }
  }
  const bad = [], ok = [];
  zs.forEach((Z, i) => (hits.get(i) ? ok : bad).push(Z.label));
  if (opt.probe) {                       // 진단: 지정 구간에서 도달한 최고 지점
    const [px0, px1, pz0, pz1] = opt.probe;
    let top = -99, at = null;
    for (const k of seen) {
      const [ix, iz, y2] = k.split(',').map(Number);
      const x = ix*S, z = iz*S, y = y2/2;
      if (x >= px0 && x <= px1 && z >= pz0 && z <= pz1 && y > top) { top = y; at = [x, z, y]; }
    }
    console.log('probe 최고 도달: ' + JSON.stringify(at));
    return { cells: seen.size, ok, bad, probe: at };
  }
  if (bad.length) console.error('🚫 도달 불가 ' + bad.length + '곳: ' + bad.join(', '));
  else console.log('✅ 도달성: 전 구역 ' + ok.length + '곳 통과 (칸 ' + seen.size + ')');
  return { cells: seen.size, ok, bad };
}

// ?check=1 이면 로드 직후 자동 답사(검증용 URL — 학생 접속엔 부담 주지 않도록 기본 꺼둠)
if (location.search.includes('check=1')) setTimeout(() => { reach(); doorCheck(); }, 60);

// 디버그 API (v1과 같은 사용감)
window.SD2 = {
  scene, camera, renderer, world, reach,
  time: k => setTime(k || ORDER[(ORDER.indexOf(timeKey) + 1) % 3]),
  loc: () => { updateLoc(); return locBox.textContent; },
  tp(x, z, y = null) { P.x = x; P.z = z; P.y = y ?? (terrainY(x, z) + 0.01); P.vy = 0; },
  yaw(v) { camYaw = v; },
  pos: () => [P.x.toFixed(1), P.y.toFixed(1), P.z.toFixed(1)],
  step(nn = 1, keyList = []) { keyList.forEach(k => keys.add(k)); for (let i = 0; i < nn; i++) { step(1/60); doorTick(1/60); } keyList.forEach(k => keys.delete(k)); renderer.render(scene, camera); },
  doors: () => DOORS.length, doorCheck,
};
