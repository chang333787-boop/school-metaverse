// v2 부트 — 헌법⑤⑥: 정수 해상도만 · AABB 충돌만 · 매초 예산 계측
import * as THREE from 'three';
import { buildWorld } from './world.js?v=89';   // ⚠️world.js를 고치면 이 숫자도 올린다(안 올리면 옛 월드로 검증하게 된다)
import { SCHOOL } from './layout.js?v=3';   // LAYOUT-3 실측 배치(v1 data.js 대신)

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

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.3, 320);   // near 0.3 — 1인칭 벽 잘림과 원경 깊이 정밀도(바닥층 1cm 간격)의 절충
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
const P = { x: 13.4, y: world.terrainAt(13.4, -6) + 0.01, z: -6, vy: 0, yaw: 0, ground: true };   // 운동장에서 구령대·본관을 보며 시작
const pg = new THREE.Group();
{
  const m = (w,h,d,c,y)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshLambertMaterial({color:c})); b.position.y=y; pg.add(b); return b; };
  m(0.44,0.5,0.3,0x4d9bd6,0.85); m(0.4,0.38,0.38,0xf6cfa4,1.33); m(0.44,0.16,0.42,0x3a2e28,1.56);
  m(0.16,0.6,0.2,0x2b3a55,0.3).position.x=-0.12; m(0.16,0.6,0.2,0x2b3a55,0.3).position.x=0.12;
}
scene.add(pg);

function terrainY(x, z) { return world.terrainAt(x, z); }   // 앞뜰·대지 yard / 운동장 field(LAYOUT-3 세 높이)
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
// 머리 위 물체 밑면(y0)이 [h0, h1] 사이에 있으면 그 높이(가장 낮은 것), 없으면 null
function ceilAt(x, z, h0, h1) {
  let c = null;
  const k0x = Math.floor((x-0.3)/8), k1x = Math.floor((x+0.3)/8), k0z = Math.floor((z-0.3)/8), k1z = Math.floor((z+0.3)/8);
  const seen = new Set();
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = world.grid.get(gx+':'+gz); if (!cell) continue;
    for (const i of cell) { if (seen.has(i)) continue; seen.add(i);
      const b = world.colliders[i];
      if (x > b.x0-0.26 && x < b.x1+0.26 && z > b.z0-0.26 && z < b.z1+0.26 && b.y0 >= h0 - 0.01 && b.y0 < h1 && (c === null || b.y0 < c)) c = b.y0;
    }
  }
  return c;
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
      if (b.nc) continue;                                  // 올라서기 금지용으로 높인 보이지 않는 윗부분·울타리 벽은 카메라를 밀지 않는다
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
let camYaw = 0, camPitch = 0.3, camFirst = false;
addEventListener('keydown', e => { if (e.code === 'KeyV') camFirst = !camFirst; });   // 1인칭 ↔ 3인칭
const CAM_D = 6.3;
let camD = CAM_D;
canvas.addEventListener('click', () => canvas.requestPointerLock());
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  camYaw -= e.movementX * 0.0026;
  camPitch = Math.max(-0.2, Math.min(1.1, camPitch + e.movementY * 0.0022));
});

// 상호작용 상태 — anim: 정해진 경로 이동(미끄럼틀) / sit: 의자에 앉음(움직이면 일어남)
const ACT = { anim: null, sit: null };
function step(dt) {
  const moving = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].some(k => keys.has(k));
  if (ACT.anim) {
    const a = ACT.anim; a.t = Math.min(1, a.t + dt / a.dur);
    P.x = a.from[0] + (a.to[0] - a.from[0]) * a.t; P.y = a.from[1] + (a.to[1] - a.from[1]) * a.t; P.z = a.from[2] + (a.to[2] - a.from[2]) * a.t;
    P.vy = 0; if (a.t >= 1) ACT.anim = null;
  } else if (ACT.sit && !moving) {
    P.x = ACT.sit.x; P.z = ACT.sit.z; P.y = ACT.sit.y; P.vy = 0;
  } else {
    ACT.sit = null;
    physics(dt);
  }
  pg.position.set(P.x, P.y - (ACT.sit ? 0.42 : 0), P.z);
  pg.rotation.y = P.yaw;
  // CAM-2(09-24): 사용자 "복도가 좁은 것 같다" — 실측 복도는 2.5m(게임 2.7m)로 좁지 않았다. 원인은 카메라:
  //  6.3m 뒤·17° 위에서 내려다보면 실내에선 천장(3.24m) 밑에 붙어 위에서 내려다보고, 화각 48°는 휴대폰 광각보다 훨씬 좁다.
  //  → 실내(머리 위에 천장)에선 가깝고(3.3m) 낮게(피치 ≤0.2)·화각 60°, 밖은 6.3m·52°. V = 1인칭(눈높이 1.5m) 전환.
  const indoor = ceilAt(P.x, P.z, P.y + 1.6, P.y + 5.5) !== null;
  const tFov = camFirst ? 66 : indoor ? 60 : 52;
  if (Math.abs(camera.fov - tFov) > 0.05) { camera.fov += (tFov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
  pg.visible = !camFirst;
  if (camFirst) {
    const pitch = camPitch - 0.3, ey = P.y + 1.5 - (ACT.sit ? 0.42 : 0);
    camera.position.set(P.x, ey, P.z);
    camera.lookAt(P.x - Math.sin(camYaw) * Math.cos(pitch), ey - Math.sin(pitch), P.z - Math.cos(camYaw) * Math.cos(pitch));
  } else {
    const hx = P.x, hy = P.y + 1.3, hz = P.z, pch = indoor ? Math.min(camPitch, 0.2) : camPitch, CD = indoor ? 3.3 : CAM_D;
    const dx = Math.sin(camYaw) * Math.cos(pch), dy = Math.sin(pch), dz = Math.cos(camYaw) * Math.cos(pch);
    const want = Math.max(0.5, Math.min(CD, camHit(hx, hy, hz, dx, dy, dz, CD) - 0.3));
    camD = want < camD ? want : camD + (want - camD) * Math.min(1, dt * 7);   // 당김은 즉시·복귀는 이징(지터 방지)
    camera.position.set(hx + dx * camD, hy + dy * camD, hz + dz * camD);
    camera.lookAt(hx, hy, hz);
  }
  if (SHOT) applyShot();
}
function physics(dt) {
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
  const y0 = P.y;
  P.y += P.vy * dt;
  // PHYS-2 머리 부딪힘: 올라가다 머리(발+1.5)가 위쪽 물체 밑면에 닿으면 멈춘다(예전엔 천장을 뚫고 올라갔다)
  if (P.vy > 0) { const c = ceilAt(P.x, P.z, y0 + 1.5, P.y + 1.5); if (c !== null) { P.y = c - 1.5; P.vy = 0; } }
  // PHYS-2 바닥: 발 높이 + 0.55까지만 딛고 올라선다(벽 막힘 기준 blockedAt과 같은 값).
  //   예전엔 발+1.15(fromY=P.y+0.6)까지 붙어 올라가, 1.6 높이 가구 → 천장 → 지붕으로 계단 타듯 올라갔다(09-23 실측).
  //   떨어질 땐 직전 높이 기준(max) — 한 프레임에 많이 떨어져도 바닥을 뚫지 않게
  const g = groundAt(P.x, P.z, Math.max(y0, P.y));
  if (P.y <= g) { P.y = g; P.vy = 0; P.ground = true; }
}

// ---------- 사진 대조 모드: ?shot=x,y,z,방위°,올려보기°,화각° ----------
// 실사 사진을 찍은 자리·방향에 카메라를 그대로 세운다(플레이어·HUD 숨김). 방위 0°=북(-z), 90°=동(+x).
// "했다"고 말하기 전에 사진과 나란히 놓고 맞는지 보는 용도.
const SHOT = (() => {
  const s = new URLSearchParams(location.search).get('shot');
  if (!s) return null;
  const [x, y, z, h, p, f] = s.split(',').map(Number);
  return { x, y, z, h: (h || 0) * Math.PI / 180, p: (p || 0) * Math.PI / 180, f: f || 70 };
})();
function applyShot() {
  if (!SHOT.hid) { document.querySelectorAll('.chip').forEach(c => c.style.display = 'none'); SHOT.hid = true; }
  pg.visible = false;
  camera.fov = SHOT.f; camera.updateProjectionMatrix();
  camera.position.set(SHOT.x, SHOT.y, SHOT.z);
  camera.lookAt(SHOT.x + Math.sin(SHOT.h) * Math.cos(SHOT.p), SHOT.y + Math.sin(SHOT.p), SHOT.z - Math.cos(SHOT.h) * Math.cos(SHOT.p));
}

// ---------- 상호작용 (E키 또는 안내 클릭) ----------
// world.hotspots: 칠판·의자·배식대·도서실·정수기·미끄럼틀·텃밭·마이크. 안내 문구는 시스템 안내뿐(인물 대사 아님 — 대사는 교사 승인분만)
const HOT = world.hotspots;
const hintEl = document.createElement('div');
hintEl.className = 'chip';
hintEl.style.cssText = 'left:50%;bottom:56px;transform:translateX(-50%);display:none;cursor:pointer;font-size:15px;padding:8px 16px';
document.body.appendChild(hintEl);
const toastEl = document.createElement('div');
toastEl.className = 'chip';
toastEl.style.cssText = 'left:50%;top:56px;transform:translateX(-50%);display:none;font-size:15px;padding:8px 16px';
document.body.appendChild(toastEl);
let toastT = 0;
function toast(msg) { toastEl.textContent = msg; toastEl.style.display = ''; toastT = 2.2; }
let hotNear = null, hotT = 0;
function hotTick(dt) {
  if (toastT > 0 && (toastT -= dt) <= 0) toastEl.style.display = 'none';
  if ((hotT += dt) < 0.15) return;
  hotT = 0;
  let best = null, bd = 1e9;
  if (!ACT.anim) for (const h of HOT) {
    const d = (P.x - h.x) ** 2 + (P.z - h.z) ** 2;
    if (d < h.r * h.r && d < bd && Math.abs(P.y - h.y) < 1.6) { bd = d; best = h; }
  }
  if (best !== hotNear) {
    hotNear = best;
    hintEl.style.display = best ? '' : 'none';
    if (best) hintEl.textContent = 'E  ' + (best.kind === 'board' ? ['칠판에 낙서하기', '더 그리기', '칠판 지우기'][best.stage || 0] : best.kind === 'sit' && ACT.sit ? '일어나기' : best.label);
  }
}
// 칠판 낙서 — 투명 캔버스에 분필 선(단계별 2장). 칠판 면에서 2cm 앞(겹치면 반짝임)
const chalkTex = [1, 2].map(n => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 180;
  const g = c.getContext('2d'); g.strokeStyle = g.fillStyle = 'rgba(255,255,250,0.92)'; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.arc(80, 90, 45, 0, Math.PI * 2); g.stroke();                               // 웃는 얼굴
  g.beginPath(); g.arc(66, 78, 5, 0, 7); g.arc(94, 78, 5, 0, 7); g.fill();
  g.beginPath(); g.arc(80, 95, 24, 0.2, Math.PI - 0.2); g.stroke();
  g.font = '900 54px sans-serif'; g.fillText('안녕!', 160, 108);
  if (n === 2) {
    for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(400 + Math.cos(k * 1.26) * 26, 70 + Math.sin(k * 1.26) * 26, 16, 0, 7); g.stroke(); }   // 꽃
    g.beginPath(); g.moveTo(400, 96); g.lineTo(400, 165); g.stroke();
    g.beginPath(); g.moveTo(170, 150); for (let x = 170; x < 330; x += 20) g.lineTo(x + 10, x % 40 ? 135 : 160); g.stroke();   // 물결
  }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
});
const chalkGeo = new THREE.PlaneGeometry(1.5, 0.53);   // 가장 좁은 칠판(과학실 1.6m) 안에 들어가게
let tray = null;
function act(h) {
  switch (h.kind) {
    case 'board': {
      h.stage = ((h.stage || 0) + 1) % 3;
      if (!h.mesh) { h.mesh = new THREE.Mesh(chalkGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); h.mesh.position.set(h.bx, h.by, h.bz); scene.add(h.mesh); }
      h.mesh.visible = h.stage > 0;
      if (h.stage > 0) { h.mesh.material.map = chalkTex[h.stage - 1]; h.mesh.material.needsUpdate = true; }
      toast(h.stage === 0 ? '🧽 칠판을 깨끗이 지웠어요' : '✏️ 칠판에 낙서했어요');
      hotNear = null; break;
    }
    case 'sit':
      ACT.sit = { x: h.x, z: h.z, y: h.y }; P.yaw = Math.PI;   // 의자 바로 뒤(몸을 의자 상자 안에 넣으면 일어날 때 의자 위로 올라선다)
      toast('🪑 의자에 앉았어요 — 움직이면 일어나요'); hotNear = null; break;
    case 'meal':
      if (!tray) { tray = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.34), new THREE.MeshLambertMaterial({ color: 0xc8d2da })); tray.position.set(0, 1.05, 0.3); pg.add(tray); toast('🍚 급식을 받았어요'); }
      else { pg.remove(tray); tray = null; toast('🍽️ 식판을 반납했어요'); }
      break;
    case 'read': toast('📖 조용히 책을 읽고 있어요'); break;
    case 'water': toast('💧 물을 마셨어요'); break;
    case 'wash': toast('🫧 손을 깨끗이 씻었어요'); break;
    case 'garden': toast('🌱 텃밭에 물을 줬어요'); break;
    case 'mic': toast('🎤 구령대 마이크를 잡았어요'); break;
    case 'slide':
      ACT.anim = { from: h.from, to: h.to, t: 0, dur: 0.9 }; P.yaw = Math.PI; toast('🛝 슝~'); break;
  }
}
addEventListener('keydown', e => { if (e.code === 'KeyE' && hotNear) act(hotNear); });
hintEl.addEventListener('click', e => { e.stopPropagation(); if (hotNear) act(hotNear); });

// ---------- 문짝(미닫이) ----------
// 움직이므로 청크 병합 밖의 개별 Mesh. 통행은 막지 않는다(콜라이더 없음) — 도달성 검사 결과가 그대로 유지된다.
// 벽면에서 6cm 띄워 벽 위를 미끄러지게 한다(벽 속으로 사라지면 문이 없어진 것처럼 보인다).
const doorMat = new THREE.MeshLambertMaterial({ color: 0xffffff });   // 색은 문마다(instanceColor) — 기본 나무색, 유치원 노랑·사랑반 분홍
// 유리문(현관·측문·도서관·나래반·유치원 정문·뒷통로 — 실사 확인분): 반투명 하늘색
const glassMat = new THREE.MeshLambertMaterial({ color: 0xbfe3ee, transparent: true, opacity: 0.42, depthWrite: false });
// DOOR-INST(09-23): 문짝 80개가 각각 메시(=드로우콜 80)였다 → 재질별 InstancedMesh 4개(나무·유리·문창·손잡이)로.
// 나무 문엔 위쪽 작은 창(두께 0.18 = 문 면에서 1cm 튀어나옴)과 손잡이(0.22)를 단다(교실 미닫이문 실사).
const DOORS = world.doors.map(d => {
  // 🔴OFF=0: 문은 벽 두께(0.3) 안에서만 미끄러진다 = 포켓 도어.
  // 벽 밖으로 내밀면(0.28이었음) 벽면에 붙은 칠판과 같은 평면이 되어 반짝인다.
  // 문짝은 빌드 감사(헌법③) 밖이다 — 그래서 '벽 안에서만 움직인다'를 규칙으로 못박는다.
  // 🔴문짝은 개구보다 크게(양옆 5cm·위 5cm 벽 속으로 묻음). 예전엔 10cm 좁고 10cm 낮아 닫힌 문 둘레에
  //   가는 틈이 생겼고, 걸을 때 그 틈으로 보이는 방 안이 픽셀보다 가늘게 깜빡였다(09-23 깜빡임 검사기 실측).
  //   묻힌 부분은 벽 속이라 안 보이고, 문짝 두 면(±0.08)은 벽 면(±0.15)·가운데 맞댐면(0)과 겹치지 않는다.
  const w = d.w + 0.1, h = (d.dh ?? 2.6) + (d.lintel ? 0.05 : 0);
  // slideOver(자동문·현관 양문): 옆 고정 유리 앞으로 12cm 비켜 미끄러진다(실물 자동문처럼) — 벽 속 포켓이 아니라서 간섭 검사 제외
  return { ax: d.ax, bx: d.cx, bz: d.cz, w, ow: d.w, h, y0: d.y0, glass: d.glass, open: 0, over: d.slideOver ? 0.12 : 0, color: d.color };
});
const _boxG = new THREE.BoxGeometry(1, 1, 1);
const nWood = DOORS.filter(o => !o.glass).length, nGlass = DOORS.length - nWood;
const doorInst = {
  wood: new THREE.InstancedMesh(_boxG, doorMat, Math.max(1, nWood)),
  glass: new THREE.InstancedMesh(_boxG, glassMat, Math.max(1, nGlass)),
  win: new THREE.InstancedMesh(_boxG, new THREE.MeshLambertMaterial({ color: 0x9fc6d4 }), Math.max(1, nWood)),
  knob: new THREE.InstancedMesh(_boxG, new THREE.MeshLambertMaterial({ color: 0x6b6f75 }), Math.max(1, nWood)),
};
Object.values(doorInst).forEach(m => { m.frustumCulled = false; scene.add(m); });
doorInst.wood.count = nWood; doorInst.win.count = nWood; doorInst.knob.count = nWood; doorInst.glass.count = nGlass;
{ let iw = 0, ig = 0; const _dc = new THREE.Color(); DOORS.forEach(o => { o.idx = o.glass ? ig++ : iw++; if (!o.glass) doorInst.wood.setColorAt(o.idx, _dc.set(o.color ?? 0xc08b4f)); }); if (doorInst.wood.instanceColor) doorInst.wood.instanceColor.needsUpdate = true; }
const _dM = new THREE.Matrix4(), _dP = new THREE.Vector3(), _dS = new THREE.Vector3(), _dQ = new THREE.Quaternion();
function setDoor(o) {
  const s = o.open * (o.slide ?? 0) * (o.dir ?? 1);
  const X = o.ax === 'x', cx = X ? o.bx + s : o.bx + (o.over || 0), cz = X ? o.bz + (o.over || 0) : o.bz + s;
  const put = (m, lx, y, ww, hh, th) => {        // lx = 문 폭 방향 오프셋, th = 두께
    _dP.set(X ? cx + lx : cx, y, X ? cz : cz + lx); _dS.set(X ? ww : th, hh, X ? th : ww);
    m.setMatrixAt(o.idx, _dM.compose(_dP, _dQ, _dS));
  };
  if (o.glass) { put(doorInst.glass, 0, o.y0 + o.h/2, o.w, o.h, 0.16); doorInst.glass.instanceMatrix.needsUpdate = true; return; }
  put(doorInst.wood, 0, o.y0 + o.h/2, o.w, o.h, 0.16);
  const ww = Math.min(0.5, o.ow * 0.4), edge = -(o.dir ?? 1) * (o.ow/2 - 0.16);   // 손잡이 = 나중에 들어가는 쪽 끝
  put(doorInst.win, edge * 0.35, o.y0 + 1.65, ww, 0.7, 0.18);
  put(doorInst.knob, edge, o.y0 + 1.0, 0.05, 0.22, 0.22);
  doorInst.wood.instanceMatrix.needsUpdate = doorInst.win.instanceMatrix.needsUpdate = doorInst.knob.instanceMatrix.needsUpdate = true;
}
function doorTick(dt) {
  for (const o of DOORS) {
    const dx = P.x - o.bx, dz = P.z - o.bz;
    const target = (dx * dx + dz * dz < 9 && Math.abs(P.y - o.y0) < 2) ? 1 : 0;
    if (Math.abs(target - o.open) < 0.002) continue;
    o.open += (target - o.open) * Math.min(1, dt * 6);   // 다 열리면 문짝 끝이 문틀 안쪽 면과 맞닿음(막힌 곳은 그 직전까지)
    setDoor(o);
  }
}

// 문 경로 간섭 검사 — 문짝은 개별 Mesh라 헌법③ 빌드 감사가 못 본다(칠판과 겹쳐 반짝인 사고).
// 문이 닫힘→열림으로 쓸고 가는 볼륨에 '벽이 아닌 얇은 부재'(칠판·게시판 등)가 있으면 잡는다.
function sweepHits(o, dir, len = o.ow + 0.05) {
  const s = len * dir, T = 0.09, y0 = o.y0, y1 = o.y0 + o.h;
  const lo = Math.min(0, s), hi = Math.max(0, s);
  const sw = o.ax === 'x'
    ? { x0: o.bx - o.w/2 + lo, x1: o.bx + o.w/2 + hi, z0: o.bz - T, z1: o.bz + T }
    : { x0: o.bx - T, x1: o.bx + T, z0: o.bz - o.w/2 + lo, z1: o.bz + o.w/2 + hi };
  let n = 0;
  for (const b of world.allBoxes) {
    if (b.wall || b.y1 - b.y0 >= 2.6) continue;   // 벽 조각(징두리로 나뉜 것 포함)·문보다 높은 기둥 = 문이 숨는 곳이니 제외.
                                        // 두께로 판정하면 두 겹 외벽(0.15)을 얇은 부재로 오인한다
    if (b.x1 <= sw.x0 || b.x0 >= sw.x1 || b.z1 <= sw.z0 || b.z0 >= sw.z1 || b.y1 <= y0 || b.y0 >= y1) continue;
    n++;
  }
  return n;
}
// 열림 방향은 빌드 때 1회 자동 결정 — 간섭이 적은 쪽으로 연다(창문·칠판을 알아서 피한다)
DOORS.forEach(o => {
  if (o.over) { o.dir = 1; o.slide = o.ow + 0.05; setDoor(o); return; }
  o.dir = sweepHits(o, 1) <= sweepHits(o, -1) ? 1 : -1;
  // 끝까지 못 여는 자리(옆 벽 속에 창이 있는 곳)는 부딪히기 직전까지만 연다 — 문짝이 창 유리를 뚫고 나오지 않게
  o.slide = o.ow + 0.05;
  while (o.slide > 0.3 && sweepHits(o, o.dir, o.slide)) o.slide -= 0.05;
  setDoor(o);
});
function doorCheck() {
  const bad = [];
  for (const o of DOORS) if (!o.over && sweepHits(o, o.dir, o.slide)) bad.push([+o.bx.toFixed(1), +o.bz.toFixed(1)]);
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

// ---------- 디테일 층 거리 컬링(DETAIL-1) ----------
// 작은 부재(책상 다리·눈·손 등)는 멀면 청크째 숨긴다 — 원경에서 픽셀보다 가는 부재가 반짝이는 것을 막고, 그리는 양도 준다.
// 16m 청크 중심 기준 + 반대각선(11.3m) 여유. 0.2초마다 한 번.
const DETAIL_FAR = 55, DETAIL_IN = 20, DETAIL_IN_IN = 30;   // INTERIOR-CULL: 실내 청크 = 카메라가 밖이면 20m·안이면 30m(+반대각선) — 벽 너머·창 너머 책상·사람을 멀리서 그리지 않는다
let detailT = 1;
function detailTick(dt) {
  detailT += dt; if (detailT < 0.2) return; detailT = 0;
  const cp = camera.position, camIn = ceilAt(cp.x, cp.z, cp.y - 0.3, cp.y + 4.5) !== null;
  const R = (DETAIL_FAR + 11.3) ** 2, RI = ((camIn ? DETAIL_IN_IN : DETAIL_IN) + 11.3) ** 2;
  for (const d of world.details) {
    const dx = cp.x - d.cx, dz = cp.z - d.cz;
    d.mesh.visible = dx * dx + dz * dz < (d.inside ? RI : R);
  }
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
  hotTick(dt);
  simMs = Math.max(simMs, performance.now() - t0);
  detailTick(dt);
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
      if (nx < -90 || nx > 64 || nz < -90 || nz > 66) continue;
      // jump 모드: 점프 정점(+0.97)에서 막히는지·착지 가능한지 — 무엇을 밟고 어디까지 올라가는지 본다
      const JY = opt.jump ? 0.97 : 0;
      if (blockedAt(nx, nz, c.y + JY)) continue;
      const g = groundAt(nx, nz, c.y + JY);                // 물리와 같은 규칙(발+0.55까지 — PHYS-2)
      if (g > c.y + (opt.jump ? 1.5 : 0.55)) continue;   // 못 오르는 턱
      const k = key(Math.round(nx/S), Math.round(nz/S), g);
      if (seen.has(k)) continue;
      seen.add(k);
      mark(nx, nz, g);
      q.push({ x: nx, z: nz, y: g });
    }
  }
  const bad = [], ok = [];
  // 점프 모드는 옥상 검사 전용(점프 중엔 낮은 문틀도 막힘으로 쳐서 구역 결과가 의미 없다)
  if (!opt.jump) zs.forEach((Z, i) => (hits.get(i) ? ok : bad).push(Z.label));
  // 옥상 도달 검사(사용자 07-30 "어디를 밟고 옥상에 올라가는 버그"): 2층(서관 x-40~-12, z-50~-38) 밖에서 3m 넘게 올라간 칸
  let roof = 0; const roofAt = [];
  for (const k of seen) {
    const [ix, iz, y2] = k.split(',').map(Number), x = ix * S, z = iz * S;
    const U = world.UPPER;   // 2층(서관)만 3m 위가 정상
    if (y2 / 2 > 3.0 && !(x > U[0] - 0.2 && x < U[1] + 0.2 && z > U[2] - 0.2 && z < U[3] + 0.2)) { roof++; if (roofAt.length < 5) roofAt.push([+x.toFixed(1), +z.toFixed(1), y2 / 2]); }
  }
  if (roof) bad.push('옥상 도달 ' + roof + '칸 ' + JSON.stringify(roofAt));
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
  else console.log(opt.jump ? '✅ 점프로 옥상 도달 0' : '✅ 도달성: 전 구역 ' + ok.length + '곳 통과 (칸 ' + seen.size + ')');
  return { cells: seen.size, ok, bad };
}

// ?check=1 이면 로드 직후 자동 답사(검증용 URL — 학생 접속엔 부담 주지 않도록 기본 꺼둠)
if (location.search.includes('check=1')) setTimeout(() => { reach(); reach({ jump: true }); doorCheck(); }, 60);   // 두 번째 = 점프로 옥상에 오르는지

// ---------- 물리 검사 (PHYS-1 · 09-23) ----------
// passCheck: 보이는 부재 속으로 몸 중심이 들어가는가(= 뚫고 지나감). 몸 높이 띠만·플레이어 규칙(0.26 부풀림·오름 0.55) 그대로
// standCheck: 윗면이 발+0.15~1.52(점프 도달)인 충돌 상자 중 위에 몸 공간이 있는 것 = 올라설 수 있는 곳(계단·무대 등 의도된 것 포함 — 목록을 눈으로 본다)
const gndOf = b => { const U = world.UPPER; return (b.y0 >= U[4] - 0.15 && b.x0 > U[0] - 0.6 && b.x1 < U[1] + 0.6 && b.z0 > U[2] - 0.6 && b.z1 < U[3] + 0.6) ? U[4] : world.baseAt((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2); };   // 2층 = 서관 위만, 나머지는 그 자리 바닥(건물·마당·앞뜰·운동장)
const FH2 = SCHOOL.building.floorHeight + 0.3;
function passCheck() {
  const out = [];
  const test = (pts, g) => pts.some(([x, y, z]) => y >= g + 0.05 && y <= g + 1.45 && !blockedAt(x, z, g) && groundAt(x, z, g) < y - 0.02);
  for (const b of world.allBoxes) {
    if (b.wall) continue; const g = gndOf(b);
    if (b.y0 > g + 1.4 || b.y1 < g + 0.12 || b.x1 - b.x0 > 40 || b.z1 - b.z0 > 40 || g > 3) continue;
    const pts = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) pts.push([b.x0 + (b.x1-b.x0)*(i+0.5)/3, (Math.max(b.y0, g+0.1) + Math.min(b.y1, g+1.4))/2, b.z0 + (b.z1-b.z0)*(j+0.5)/3]);
    if (test(pts, g)) out.push(['box', +((b.x0+b.x1)/2).toFixed(1), +((b.z0+b.z1)/2).toFixed(1)]);
  }
  for (const r of world.visRods) {
    const g = gndOf(r); if (r.y0 > g + 1.4 || r.y1 < g + 0.12) continue;
    const pts = []; for (let t = 0.1; t < 1; t += 0.2) pts.push([r.a[0] + (r.b[0]-r.a[0])*t, r.a[1] + (r.b[1]-r.a[1])*t, r.a[2] + (r.b[2]-r.a[2])*t]);
    if (test(pts, g)) out.push(['rod', +((r.x0+r.x1)/2).toFixed(1), +((r.z0+r.z1)/2).toFixed(1)]);
  }
  return out;
}
function standCheck() {
  const out = [];
  for (const c of world.colliders) {
    const g = gndOf(c), top = c.y1 - g;
    if (top < 0.15 || top > 1.52 || c.y0 > g + 0.6) continue;
    let ok = false;
    for (let i = 0; i < 3 && !ok; i++) for (let j = 0; j < 3 && !ok; j++) if (!blockedAt(c.x0 + (c.x1-c.x0)*(i+0.5)/3, c.z0 + (c.z1-c.z0)*(j+0.5)/3, c.y1)) ok = true;
    if (ok) out.push([+top.toFixed(2), +((c.x0+c.x1)/2).toFixed(1), +((c.z0+c.z1)/2).toFixed(1), +(c.x1-c.x0).toFixed(2), +(c.z1-c.z0).toFixed(2)]);
  }
  return out;
}

// 디버그 API (v1과 같은 사용감)
window.SD2 = {
  scene, camera, renderer, world, reach, detailTick, passCheck, standCheck,
  time: k => setTime(k || ORDER[(ORDER.indexOf(timeKey) + 1) % 3]),
  loc: () => { updateLoc(); return locBox.textContent; },
  tp(x, z, y = null) { P.x = x; P.z = z; P.y = y ?? (world.baseAt(x, z) + 0.01); P.vy = 0; },
  yaw(v) { camYaw = v; },
  pos: () => [P.x.toFixed(1), P.y.toFixed(1), P.z.toFixed(1)],
  step(nn = 1, keyList = []) { keyList.forEach(k => keys.add(k)); for (let i = 0; i < nn; i++) { step(1/60); doorTick(1/60); hotTick(1/60); } keyList.forEach(k => keys.delete(k)); detailTick(1); renderer.render(scene, camera); },
  doors: () => DOORS.length, doorCheck,
  near: () => hotNear && hotNear.label, act: () => hotNear && act(hotNear),
};
