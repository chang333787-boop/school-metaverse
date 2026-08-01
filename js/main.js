// 우리학교 메타버스 — 부트스트랩/카메라/HUD/상호작용
// v0.7: 캐릭터 선택, E키 조준+표시, NPC 말걸기, R키 탈출, 미니맵, 성능 계측
import * as THREE from 'three';
import { SCHOOL } from './data.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { textSign, skyTexture } from './textures.js';

// ---------- 진단 (크래시·끼임 기록) ----------
let diag;
try { diag = JSON.parse(localStorage.getItem('sd_diag')) || null; } catch (e) { diag = null; }
if (!diag) diag = { stuck: [], crashes: 0, last: {} };
window.__sdDiag = diag;
function saveDiag() { try { localStorage.setItem('sd_diag', JSON.stringify(diag)); } catch (e) { /* */ } }
window.addEventListener('error', ev => {
  diag.crashes++;
  diag.last.err = String(ev.message).slice(0, 200);
  if (performance.memory) diag.last.mem = Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB';
  saveDiag();
});

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
renderer.setSize(window.innerWidth, window.innerHeight);
// 그림자는 첫 프레임에 한 번만 굽는다 (해·월드가 정적)
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
// v0.9 그래픽: 게임 톤 (ACES) — 라이트 강도는 이에 맞춰 상향
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;

const scene = new THREE.Scene();
scene.background = skyTexture();
scene.fog = new THREE.Fog(0xcfe9f8, 70, 270);   // 하늘 지평선 색과 동일

// FOV 62 → 48: 가까운 무텍스처 상자의 원근 왜곡이 줄고 망원 압축으로 '모형' 느낌이 난다.
// (좁아진 만큼 카메라 거리를 늘려야 프레이밍이 유지된다 — camDist 4.9 → 6.3)
// ⚠️ 지직임(원거리 z-fight)의 주범 = 깊이 정밀도. far/near 비가 5000(0.1/500)이면
// 0.01~0.02m 겹침 데칼이 수십 m 밖에서 전부 떨린다. near 0.35/far 340(안개 270 밖은 안 보임)으로
// 비를 ~970까지 낮춰 정밀도를 5배 이상 확보. (카메라 최소거리 0.5 > near ✓)
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.35, 340);

// ⚠️ 조명 규칙 (아트 디렉션 조사 반영)
//  · 태양 : 헤미 ≈ 3 : 1 — 채움광이 세면 그늘이 안 생겨 전부 '색칠한 상자'가 된다
//  · groundColor 는 **따뜻한 중간톤**. 절대 회색·검정 근처로 두지 말 것(아늑함이 죽는다)
//  · skyColor 는 진짜 하늘색. 거의 흰색이면 한난 분리가 사라진다
// ⚠️ skyColor 를 진한 파랑으로 하면 **실내 바닥이 회녹색**이 된다
//    (실내는 태양이 없어 위 향한 면이 하늘색만 받는다). 옅은 하늘색이 상한.
const hemi = new THREE.HemisphereLight(0xc9dcf0, 0xb08a5e, 1.45);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0cf, 3.30);
sun.position.set(60, 95, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -110;
sun.shadow.camera.right = 110;
sun.shadow.camera.top = 95;
sun.shadow.camera.bottom = -95;
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 260;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.035;   // 경사·모서리 그림자 지글거림(acne) 억제
scene.add(sun);
scene.add(sun.target);
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshBasicMaterial({ color: 0xfff3cf, fog: false }));
sunDisc.position.copy(sun.position).normalize().multiplyScalar(235);
sunDisc.lookAt(0, 0, 0);
scene.add(sunDisc);

const world = buildWorld(scene);
const player = new Player(scene, world);
// P4(지직임): 반복 캔버스 텍스처(트랙·그물·코스·현판)에 이방성 필터 — 원거리 글랜싱 각 에일리어싱 억제
{
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const seenTex = new Set();
  scene.traverse(o => {
    const mp = o.isMesh && o.material && o.material.map;
    if (mp && !seenTex.has(mp)) { seenTex.add(mp); mp.anisotropy = Math.min(8, maxAniso); mp.needsUpdate = true; }
  });
}

// ---------- 시간대 프리셋 (낮/노을/밤 — 전환 시 그림자 1회만 재굽기) ----------
const TIMES = {
  day:    { sky: 'day',    fog: 0xcfe9f8, fogD: [70, 270], cloud: 0xffffff, hemi: [0xc9dcf0, 0xb08a5e, 1.45], sun: [0xfff0cf, 3.30, [60, 95, 45]],  disc: 0xfff3cf, exp: 1.16, label: '☀️ 낮' },
  sunset: { sky: 'sunset', fog: 0xf0b183, fogD: [50, 210], cloud: 0xf7cba6, hemi: [0xe8b48f, 0x8a6242, 1.00], sun: [0xff9a55, 2.90, [-85, 26, 30]], disc: 0xffb066, exp: 1.20, label: '🌇 노을' },
  night:  { sky: 'night',  fog: 0x253a63, fogD: [34, 155], cloud: 0x39496e, hemi: [0x44618f, 0x2a2a38, 0.80], sun: [0xa8c2e8, 1.10, [45, 70, -35]], disc: 0xeef2fa, exp: 1.24, label: '🌙 밤' },
};
let timeMode = 'day';
const timeBtn = document.createElement('button');
timeBtn.style.cssText = 'position:fixed;right:118px;bottom:10px;z-index:30;padding:6px 10px;border-radius:8px;border:1px solid #1d3557;background:rgba(255,255,255,.85);cursor:pointer;font-size:12px;font-family:inherit;';
timeBtn.textContent = '☀️ 낮';
document.body.appendChild(timeBtn);
function applyTime(mode) {
  timeMode = mode;
  const t = TIMES[mode];
  // 골판지 모드에선 하늘·안개도 종이 톤으로 (파란 하늘 아래 갈색 학교는 안 어울린다)
  const card = typeof cardboard !== 'undefined' && cardboard;
  scene.background = card ? new THREE.Color(mode === 'night' ? 0x3a3126 : 0xe8dcc2) : skyTexture(t.sky);
  scene.fog.color.set(card ? (mode === 'night' ? 0x3a3126 : 0xe0d2b6) : t.fog);
  // 밤·노을엔 안개를 당겨 원경 잔디가 낮처럼 밝게 남는 것을 막는다
  scene.fog.near = t.fogD[0];
  scene.fog.far = t.fogD[1];
  if (world.dynamic.cloudMat) world.dynamic.cloudMat.color.set(card ? 0xf3ead6 : t.cloud);
  hemi.color.set(t.hemi[0]);
  hemi.groundColor.set(t.hemi[1]);
  hemi.intensity = t.hemi[2];
  sun.color.set(card ? 0xfff2d6 : t.sun[0]);
  sun.intensity = t.sun[1] * (card ? 0.92 : 1);
  sun.position.set(t.sun[2][0], t.sun[2][1], t.sun[2][2]);
  sunDisc.material.color.set(t.disc);
  sunDisc.position.copy(sun.position).normalize().multiplyScalar(235);
  sunDisc.lookAt(0, 0, 0);
  sunDisc.scale.setScalar(mode === 'night' ? 0.55 : 1);
  renderer.toneMappingExposure = t.exp;
  renderer.shadowMap.needsUpdate = true;
  if (world.dynamic.nightGlow) world.dynamic.nightGlow.visible = mode === 'night';   // 창문 불빛
  if (world.dynamic.floodMat) world.dynamic.floodMat.color.set(mode === 'night' ? 0xfff2c0 : 0xb9bfc4);   // 조명탑
  timeBtn.textContent = t.label;
}
timeBtn.addEventListener('click', () => {
  applyTime(timeMode === 'day' ? 'sunset' : timeMode === 'sunset' ? 'night' : 'day');
});

// ---------- 🧻 골판지 모드 (스킨 — 본편 룩과 별개) ----------
// "4학년 아이들이 골판지로 만든 우리 학교". 색만 갈아끼우므로 배치·물리는 그대로.
let cardboard = false;
const skinBtn = document.createElement('button');
skinBtn.style.cssText = 'position:fixed;right:214px;bottom:10px;z-index:30;padding:6px 10px;border-radius:8px;border:1px solid #1d3557;background:rgba(255,255,255,.85);cursor:pointer;font-size:12px;font-family:inherit;';
skinBtn.textContent = '🧻 골판지';
document.body.appendChild(skinBtn);
skinBtn.addEventListener('click', () => {
  cardboard = !cardboard;
  if (world.dynamic.setSkin) world.dynamic.setSkin(cardboard);
  player.setCardboard(cardboard);
  skinBtn.textContent = cardboard ? '🎨 원래대로' : '🧻 골판지';
  applyTime(timeMode);            // 하늘·안개·구름을 스킨에 맞춰 다시 적용
  renderer.shadowMap.needsUpdate = true;
});

// ---------- 차는 공 (운동장 축구공 2 + 체육관 농구공) ----------
const BALLS = [];
function addBall(x, z, r, color, gy = 0) {   // gy = 그 구역의 지면 높이 (운동장 -1)
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, gy + r, z);
  scene.add(m);
  BALLS.push({ m, r, gy, vx: 0, vy: 0, vz: 0, cd: 0 });
  return BALLS[BALLS.length - 1];
}
const F_ = SCHOOL.field, GY_ = SCHOOL.gym;
const FIELD_BB = { x0: F_.center[0] - F_.width / 2 + 1, x1: F_.center[0] + F_.width / 2 - 1, z0: F_.center[1] - F_.depth / 2 + 1, z1: F_.center[1] + F_.depth / 2 - 1 };
const GYM_BB = { x0: GY_.center[0] - GY_.width / 2 + 0.8, x1: GY_.center[0] + GY_.width / 2 - 0.8, z0: GY_.center[1] - GY_.depth / 2 + 0.8, z1: GY_.center[1] + GY_.depth / 2 - 0.8 };
addBall(F_.center[0] - 4, F_.center[1] + 2, 0.24, 0xffffff, -1).bb = FIELD_BB;
addBall(F_.center[0] + 8, F_.center[1] + 9, 0.24, 0xe07a2f, -1).bb = FIELD_BB;
addBall(GY_.center[0] + 2, GY_.center[1] + 3, 0.2, 0xe07a2f, 0).bb = GYM_BB;

// ---------- 카메라 (스크래치 벡터 — 매 프레임 할당 금지) ----------
// FOV 를 좁히면 같은 pitch 로도 화면에 땅이 더 많이 들어온다 → pitch 를 낮춰 지평선을 되돌림
let camYaw = 0, camPitch = 0.30, camDist = 6.3;
let camFrame = 0, camCeilY = null;   // 레이 절약용 (렉 대책)
let camIdle = 0, _lpx = 0, _lpy = 0, _lpz = 0, _lyaw = 0;   // S11: 정지 시 레이 1/4 주기
const camRay = new THREE.Raycaster();
const _target = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _desired = new THREE.Vector3();
// v0.9: 일반 TPS 조작 — 화면 클릭 시 마우스 잠금(누르고 있을 필요 없음). 터치는 드래그 유지
const canLock = 'requestPointerLock' in canvas;
let locked = false;
canvas.addEventListener('click', () => {
  const ov = document.getElementById('overlay');
  if (canLock && !locked && ov && ov.classList.contains('hidden')) canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  hint.textContent = locked
    ? 'E: 상호작용 · R: 빠져나오기 · ESC: 마우스 커서 보이기'
    : '화면을 클릭하면 마우스로 둘러볼 수 있어요 · E: 상호작용 · R: 빠져나오기';
});
document.addEventListener('mousemove', e => {
  if (!locked) return;
  camYaw -= e.movementX * 0.0028;
  camPitch = Math.min(1.25, Math.max(0.08, camPitch + e.movementY * 0.0024));
});
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  dragging = true; lastX = e.clientX; lastY = e.clientY;
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', e => {
  if (!dragging) return;
  camYaw -= (e.clientX - lastX) * 0.0062;
  camPitch = Math.min(1.25, Math.max(0.08, camPitch + (e.clientY - lastY) * 0.005));
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('wheel', e => {
  camDist = Math.min(12, Math.max(2.8, camDist + e.deltaY * 0.004));
}, { passive: true });

const _upDir = new THREE.Vector3(0, 1, 0);
const _probe = new THREE.Vector3();
const ceilRay = new THREE.Raycaster();
ceilRay.far = 5;
let camLen = 4.9;      // 실제 적용 중인 카메라 거리 (이 값만 부드럽게 움직인다)
let camTgtY = null;    // 부드럽게 따라가는 시선 높이
// ⚠️ 카메라 규칙 (v0.17에서 되먹임 진동을 겪고 정한 것 — 바꾸지 말 것)
//  1) 가림 검사는 '이상적인 방향(_dir)'으로만 쏜다. 실제 카메라 위치로 쏘면
//     lerp 경로 → 방향 → 클램프 → 위치 … 되먹임 루프가 생겨 매 프레임 튄다(떨림).
//  2) 위치를 lerp 하지 않는다. lerp 는 회전 중 카메라를 벽 안으로 밀어넣는다.
//     부드럽게 만들 것은 '거리'와 '시선 높이'뿐.
//  3) 거리는 가까워질 땐 즉시(관통 방지), 멀어질 땐 천천히.
function updateCamera(dt) {
  const tgtYWant = player.pos.y + 1.3;
  if (camTgtY === null || Math.abs(camTgtY - tgtYWant) > 2.5) camTgtY = tgtYWant;
  else camTgtY += (tgtYWant - camTgtY) * Math.min(1, dt * 12);
  _target.set(player.pos.x, camTgtY, player.pos.z);
  // 실내에서 카메라가 천장을 뚫지 않게 상한 계산
  // ⚠️ 렉 대책(2026-08-01): 레이는 병합 청크 전체 삼각형을 검사(BVH 없음)해서 밀집 구역에서 ms급.
  //    천장은 3프레임마다 갱신(천장이 프레임 단위로 변하지 않음), 좌우 예고 레이는 홀짝 교대.
  camFrame++;
  // S11: 플레이어·시점이 멈춰 있으면(30프레임+) 가림 레이를 1/4 주기로 — 움직이면 즉시 복귀
  const moved = Math.abs(player.pos.x - _lpx) + Math.abs(player.pos.y - _lpy) + Math.abs(player.pos.z - _lpz) > 0.001 || Math.abs(camYaw - _lyaw) > 0.0005;
  _lpx = player.pos.x; _lpy = player.pos.y; _lpz = player.pos.z; _lyaw = camYaw;
  camIdle = moved ? 0 : camIdle + 1;
  if (camIdle > 30 && camFrame % 4 !== 0) { camera.position.copy(_desired); camera.lookAt(_target); return; }
  if (camFrame % 3 === 0 || camCeilY === null) {
    ceilRay.set(_target, _upDir);
    const ceilHits = ceilRay.intersectObjects(player._nearRay, false);
    camCeilY = ceilHits.length ? ceilHits[0].point.y - 0.22 : Infinity;
  }
  const ceilY = camCeilY;
  _dir.set(
    Math.sin(camYaw) * Math.cos(camPitch),
    Math.sin(camPitch),
    Math.cos(camYaw) * Math.cos(camPitch)
  );
  // 가림 검사 — 정면 1줄(진짜 가림)과 좌우 1줄씩(미리 알림)을 구분해서 쓴다.
  // ⚠️ 셋을 그냥 min 으로 합치면 옆줄이 걸리는 순간마다 '툭' 튄다(측정으로 확인).
  //    정면이 막혔을 때만 빠르게 당기고, 옆줄만 막혔으면 아주 천천히 미리 당긴다.
  let front = camDist, side = camDist;
  const sideX = Math.cos(camYaw) * 0.45, sideZ = -Math.sin(camYaw) * 0.45;
  for (const s of [0, camFrame % 2 === 0 ? -1 : 1]) {   // 정면 매 프레임 + 좌우 예고는 한쪽씩 교대
    _probe.set(_target.x + sideX * s, _target.y, _target.z + sideZ * s);
    camRay.set(_probe, _dir);
    camRay.far = camDist + 0.4;
    const hits = camRay.intersectObjects(player._nearSolid, false);
    for (let i = 0; i < hits.length; i++) {
      if (hits[i].object.userData.noCam) continue;   // 옥상 차단벽 등은 카메라 통과 허용
      // 기본 0.9m 하한 — 단, 벽이 그보다 가까우면 '벽 앞 0.12m'가 절대 상한
      // (등을 벽에 붙이면 하한 0.9가 벽 뒤로 밀어넣던 것 — 도서관로비 yaw π 계측으로 확인)
      const d = Math.max(0.5, Math.min(Math.max(0.9, hits[i].distance - 0.35), hits[i].distance - 0.12));
      if (s === 0) front = Math.min(front, d); else side = Math.min(side, d);
      break;
    }
  }
  // 세 경우 모두 '지수 수렴 + 프레임당 이동 상한'으로 처리한다.
  // 지수만 쓰면 격차가 클 때 첫 프레임이 크게 튀고, 상한만 쓰면 영원히 등속으로 기어간다.
  const ease = (goal, k, cap) => {
    const step = (goal - camLen) * Math.min(1, dt * k);
    camLen += Math.max(-cap, Math.min(cap, step));
  };
  if (front < camLen) ease(front, 9, 0.09);            // 진짜 가림 — 안전하게 빠르게
  else if (side < camLen) ease(side, 5, 0.045);        // 예고 — 미리 살짝
  else ease(Math.min(front, side), 5, 0.12);           // 트일 땐 부드럽게
  _desired.copy(_target).addScaledVector(_dir, camLen);
  _desired.y = Math.max(_desired.y, player.pos.y + 0.35);
  if (_desired.y > ceilY) _desired.y = Math.max(ceilY, player.pos.y + 0.35);
  camera.position.copy(_desired);
  camera.lookAt(_target);
}

// ---------- 토스트/힌트 ----------
const msgBox = document.createElement('div');
msgBox.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);background:rgba(29,53,87,.85);color:#fff;padding:7px 14px;border-radius:10px;font:14px sans-serif;z-index:40;display:none;';
document.body.appendChild(msgBox);
let msgTimer = 0;
function toast(t) {
  msgBox.textContent = t;
  msgBox.style.display = 'block';
  msgTimer = 1.8;
}
const promptBox = document.createElement('div');
promptBox.style.cssText = 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);background:rgba(46,125,70,.9);color:#fff;padding:5px 12px;border-radius:9px;font:13px sans-serif;z-index:40;display:none;';
document.body.appendChild(promptBox);
const hint = document.createElement('div');
hint.style.cssText = 'position:fixed;left:10px;bottom:10px;background:rgba(29,53,87,.72);color:#fff;padding:6px 10px;border-radius:8px;font:12px sans-serif;z-index:30;';
hint.textContent = '화면을 클릭하면 마우스로 둘러볼 수 있어요 · E: 상호작용 · R: 빠져나오기';
document.body.appendChild(hint);
const meChip = document.createElement('div');
meChip.style.cssText = 'position:fixed;left:10px;top:44px;background:rgba(29,53,87,.72);color:#fff;padding:5px 10px;border-radius:8px;font:12px sans-serif;z-index:30;display:none;';
document.body.appendChild(meChip);

// ---------- 상호작용 대상 고르기 (바라보는 방향 가산점) ----------
function findTarget() {
  const p = player.pos;
  const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw);
  let best = null, bestScore = 2.4;
  const consider = (x, z, y, lim, kind, o) => {
    if (Math.abs(p.y - y) > 2.2) return;
    const dx = x - p.x, dz = z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist > lim) return;
    const facing = dist > 0.01 ? (dx * fx + dz * fz) / dist : 1;
    const score = dist - (facing > 0.5 ? 0.9 : 0);
    if (score < bestScore) { best = { kind, o }; bestScore = score; }
  };
  for (const d of world.doors) consider(d.x, d.z, d.y, 2.3, 'door', d);
  for (const it of world.interactables) {
    const lim = it.type === 'chair' ? 1.5 : it.type === 'garden' ? 2 : 1.8;
    consider(it.x, it.z, it.y, lim, it.type, it);
  }
  return best;
}
function targetLabel(t) {
  if (!t) return null;
  if (t.kind === 'door') return t.o.open ? 'E: 문 닫기' : 'E: 문 열기';
  if (t.kind === 'computer') return t.o.on ? 'E: 컴퓨터 끄기' : 'E: 컴퓨터 켜기';
  if (t.kind === 'chair') return 'E: 의자에 앉기';
  if (t.kind === 'person') return `E: ${t.o.name}에게 말걸기`;
  if (t.kind === 'locker') return t.o.open ? 'E: 사물함 닫기' : 'E: 사물함 열기';
  if (t.kind === 'garden') return t.o.grown.visible ? 'E: 잘 자라고 있어요' : 'E: 물주기';
  if (t.kind === 'chalk') return t.o.st === 0 ? 'E: 칠판에 낙서하기' : t.o.st === 1 ? 'E: 낙서 더 하기' : 'E: 칠판 지우기';
  if (t.kind === 'meal') return 'E: 급식 받기';
  if (t.kind === 'book') return 'E: 책 꺼내 읽기';
  if (t.kind === 'water') return 'E: 물 마시기';
  if (t.kind === 'slide') return 'E: 미끄럼틀 타기';
  if (t.kind === 'flag') return 'E: 국기에 대한 경례';
  if (t.kind === 'mic') return 'E: 방송하기';
  return null;
}

// NPC 말풍선
const bubbles = [];
function talk(npc) {
  const lines = npc.lines && npc.lines.length ? npc.lines
    : (npc.name === '선생님' ? ['안녕하세요! 우리 반에 온 걸 환영해요 😊'] : [`안녕! 나는 ${npc.name}(이)야`]);
  const line = lines[npc.li % lines.length];
  npc.li++;
  const b = textSign(line, { h: 0.34, fontPx: 40, pad: 14, bg: '#ffffff', fg: '#1d3557' });
  b.position.set(0, 2.6, 0);
  npc.group.add(b);
  bubbles.push({ mesh: b, parent: npc.group, t: 3.2 });
}

function interact() {
  const t = findTarget();
  if (!t) return;
  if (t.kind === 'door') {
    const d = t.o;
    d.open = !d.open;
    if (d.slide) d.slide();
    else d.group.rotation.y = d.open ? d.openRot : 0;
    toast(d.open ? '문을 열었다 (드르륵)' : '문을 닫았다');
  } else if (t.kind === 'computer') {
    const it = t.o;
    it.on = !it.on;
    it.mesh.material.color.set(it.on ? 0x9fd8ff : 0x1a2b30);
    toast(it.on ? '컴퓨터를 켰다! 🖥️' : '컴퓨터를 껐다');
  } else if (t.kind === 'chair') {
    player.sit(t.o);
    toast(t.o.msg || '의자에 앉았다 (이동키로 일어나기)');
  } else if (t.kind === 'person') {
    talk(t.o);
  } else if (t.kind === 'chalk') {
    const c = t.o;
    c.st = (c.st + 1) % 3;
    c.m[0].visible = c.st >= 1;
    c.m[1].visible = c.st >= 2;
    toast(c.st === 0 ? '칠판을 깨끗이 지웠다 🧽' : c.st === 1 ? '분필로 슥슥… ✏️' : '낙서 완성! 선생님 오시기 전에…');
  } else if (t.kind === 'meal') {
    const menus = ['오늘 급식: 카레라이스·미역국·깍두기 🍛', '오늘 급식: 불고기·콩나물국·사과 🍎', '오늘 급식: 짜장밥·계란국·단무지 🍜', '오늘 급식: 치킨마요덮밥·어묵국 🍗'];
    toast(menus[Math.floor(Math.random() * menus.length)] + ' — 식판 가득!');
  } else if (t.kind === 'book') {
    const bks = ['《마당을 나온 암탉》을 꺼내 읽었다 📖', '《구름빵》을 꺼내 읽었다 📖', '《강아지똥》을 꺼내 읽었다 📖', '《흔한남매》는 대출 중이다… 😢', '공룡 도감을 펼쳤다 🦕'];
    toast(bks[Math.floor(Math.random() * bks.length)]);
  } else if (t.kind === 'water') {
    toast('시원한 물 한 모금! 💧 (꿀꺽꿀꺽)');
  } else if (t.kind === 'slide') {
    player.escapeTo(t.o.top);
    toast('미끄럼틀 꼭대기! 앞으로 걸어가면 슝~ 🛝');
  } else if (t.kind === 'flag') {
    toast('국기에 대하여 경례! 🇰🇷');
  } else if (t.kind === 'mic') {
    toast('아아— 마이크 테스트. 전교생 여러분~ 🎤');
  } else if (t.kind === 'locker') {
    const lk = t.o;
    lk.open = !lk.open;
    lk.group.rotation.y = lk.open ? lk.openRot : 0;
    if (lk.open) {
      const stuff = ['텅 비어 있다', '체육복이 걸려 있다', '오래된 공책이 있다', '줄넘기가 들어 있다', '실내화 한 짝만 있다…?', '색종이 뭉치가 있다'];
      toast('사물함을 열었다 — ' + stuff[Math.floor(Math.random() * stuff.length)]);
    } else {
      toast('사물함을 닫았다');
    }
  } else if (t.kind === 'garden') {
    if (!t.o.grown.visible) {
      t.o.grown.visible = true;
      toast('물을 줬어요! 쑥쑥 자라라 🌱');
    }
  }
}

function escape() {
  const p = player.pos;
  let best = null, bestD = 1e9;
  for (const s of world.safePoints) {
    const d = Math.hypot(p.x - s.x, p.z - s.z) + Math.abs(p.y - s.y) * 3;
    if (d < bestD) { best = s; bestD = d; }
  }
  if (best) {
    player.escapeTo(best);
    toast('빠져나왔어요!');
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
  const sz = z => (z - bd.zMin) / (bd.zMax - bd.zMin) * (H - 10) + 5;
  const rect = (x0, z0, x1, z1, c) => {
    mmx.fillStyle = c;
    mmx.fillRect(sx(x0), sz(z0), sx(x1) - sx(x0), sz(z1) - sz(z0));
  };
  mmx.clearRect(0, 0, W, H);
  const F = SCHOOL.field, B = SCHOOL.building;
  rect(-bd.x, bd.zMin, bd.x, -18, 'rgba(120,150,100,0.35)');   // 테라스(높은 지대) 톤
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
  rect(SCHOOL.playground.center[0] - 20, SCHOOL.playground.center[1] - 6, SCHOOL.playground.center[0] - 8, SCHOOL.playground.center[1] + 5, '#aeb2b8');   // 자전거 코스
  rect(-59.3, -43, -48.7, -35, '#8fc978');   // 유치원 놀이터
  rect(-20, -69.5, 48, -59.5, '#b9bdc2');    // 주차장
  mmx.fillStyle = '#2f6b3f';                 // 큰 나무
  mmx.beginPath();
  mmx.arc(sx(SCHOOL.bigTree[0]), sz(SCHOOL.bigTree[1]), 5, 0, Math.PI * 2);
  mmx.fill();
  rect(SCHOOL.gate[0] - 2, SCHOOL.gate[1] - 1.5, SCHOOL.gate[0] + 2, SCHOOL.gate[1] + 1, '#7a5230');
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

// ---------- 캐릭터 선택 ----------
const SHIRT_PAL = [0xe8863a, 0x67b26f, 0x4d9bd6, 0xd94f6b, 0xf2b134, 0x8e6fc9, 0x3aa8a0];
let myChar = null;
try { myChar = JSON.parse(localStorage.getItem('sd_char')) || null; } catch (e) { myChar = null; }
function applyCharacter(room, name, girl, idx) {
  // 이전 선택 NPC 다시 보이기
  if (myChar) {
    const prev = world.npcs.get(myChar.room + ':' + myChar.name);
    if (prev) prev.visible = true;
  }
  myChar = { room, name, girl };
  try { localStorage.setItem('sd_char', JSON.stringify(myChar)); } catch (e) { /* */ }
  player.applyLook(girl, SHIRT_PAL[idx % SHIRT_PAL.length]);
  const npc = world.npcs.get(room + ':' + name);
  if (npc) npc.visible = false;   // 같은 사람이 둘이면 안 됨
  meChip.textContent = '나: ' + name;
  meChip.style.display = 'block';
}

const overlay = document.getElementById('overlay');
const panel = overlay.querySelector('.panel');
const startBtn = document.getElementById('startBtn');
const selWrap = document.createElement('div');
selWrap.style.cssText = 'max-height:170px;overflow:auto;margin:8px 0;text-align:left;font-size:13px;background:rgba(0,0,0,.05);border-radius:8px;padding:6px;';
const selTitle = document.createElement('div');
selTitle.textContent = '내 캐릭터 고르기 (학년을 눌러서 펼치기)';
selTitle.style.cssText = 'font-weight:bold;margin-bottom:4px;';
selWrap.appendChild(selTitle);
Object.entries(SCHOOL.people || {}).forEach(([room, g]) => {
  const det = document.createElement('details');
  const sum = document.createElement('summary');
  sum.textContent = room;
  sum.style.cursor = 'pointer';
  det.appendChild(sum);
  g.s.forEach(([nm, gd], idx) => {
    const b = document.createElement('button');
    b.textContent = nm;
    b.style.cssText = 'margin:2px;padding:3px 9px;border-radius:7px;border:1px solid #1d3557;background:#fff;cursor:pointer;font-size:12px;';
    b.addEventListener('click', () => {
      applyCharacter(room, nm, gd === '여', idx);
      selWrap.querySelectorAll('button').forEach(x => x.style.background = '#fff');
      b.style.background = '#ffe9a8';
    });
    det.appendChild(b);
  });
  selWrap.appendChild(det);
});
panel.insertBefore(selWrap, startBtn);

const changeBtn = document.createElement('button');
changeBtn.textContent = '캐릭터 바꾸기';
changeBtn.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:30;padding:6px 10px;border-radius:8px;border:1px solid #1d3557;background:rgba(255,255,255,.85);cursor:pointer;font-size:12px;';
changeBtn.addEventListener('click', () => overlay.classList.remove('hidden'));
document.body.appendChild(changeBtn);

// 저장된 선택 자동 적용
if (myChar && SCHOOL.people && SCHOOL.people[myChar.room]) {
  const idx = SCHOOL.people[myChar.room].s.findIndex(([nm]) => nm === myChar.name);
  if (idx >= 0) {
    const saved = myChar; myChar = null;
    applyCharacter(saved.room, saved.name, saved.girl, idx);
  }
}

// ---------- 입력 ----------
const keys = new Set();
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'KeyF') fpsBox.classList.toggle('hidden');
  if (e.code === 'KeyE') interact();
  if (e.code === 'KeyR') escape();
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
      if (zn.floor === undefined && y > 2.2) continue;
      return zn.label;
    }
  }
  return '학교 마당';
}

document.getElementById('startBtn').addEventListener('click', () => {
  overlay.classList.add('hidden');
  canvas.focus();
  if (canLock) canvas.requestPointerLock();
});
document.getElementById('schoolName').textContent = SCHOOL.name;
document.getElementById('tagline').textContent = SCHOOL.tagline;
document.getElementById('ver').textContent = SCHOOL.tagline;

// ---------- 월드 틱 (루프와 SD.step 양쪽에서 호출 — 깃발·구름·나무·NPC·공) ----------
// ⚠️ 그림자 맵은 첫 프레임과 시간대 전환 때만 굽는다.
// 예전엔 NPC 가 돌 때마다 0.6초 스로틀로 다시 구웠는데,
// 그때마다 프레임이 끊기고 그림자가 계단처럼 튀어 '미세한 떨림'으로 보였다.
// NPC 는 castShadow 를 끄고 발밑에 정적 그림자를 미리 구워 대체한다(world.js).
function worldTick(dt) {
  const t = clock.elapsedTime;
  // 사이클4: 트랙 러너 — 타원 경로. 방향은 persons 루프(요0 갱신)가 자연히 처리
  if (world.runners) for (const rn of world.runners) {
    rn.phase += dt * rn.speed;
    const px9 = rn.cx + Math.cos(rn.phase) * rn.rx;
    const pz9 = rn.cz + Math.sin(rn.phase) * rn.rz;
    rn.group.position.x = px9;
    rn.group.position.z = pz9;
    rn.group.position.y = -1 + Math.abs(Math.sin(rn.phase * 22)) * 0.06;   // 잔달음 바운스
    rn.pe.x = px9; rn.pe.z = pz9;
    rn.pe.yaw0 = Math.atan2(-Math.sin(rn.phase) * rn.rx, Math.cos(rn.phase) * rn.rz);   // 모델은 yaw0에서 +z를 본다(착석 NPC로 확인)
  }
  // P7: 문 이징 슬라이드 (움직이는 문만 비용 발생)
  for (const d of world.doors) {
    if (d.curOff === undefined || d.curOff === d.targetOff) continue;
    const dlt = d.targetOff - d.curOff;
    d.curOff += Math.sign(dlt) * Math.min(Math.abs(dlt), dt * Math.max(1.6, d.w * 2.6));
    if (Math.abs(d.targetOff - d.curOff) < 0.002) d.curOff = d.targetOff;
    d._apply();
  }
  if (world.dynamic.flag) world.dynamic.flag.rotation.y = Math.sin(t * 1.8) * 0.28 + 0.1;
  world.dynamic.clouds.forEach((c, i) => {
    c.position.x += dt * (0.55 + i * 0.12);
    if (c.position.x > 110) c.position.x = -110;
  });
  if (world.dynamic.bigTree) {
    world.dynamic.bigTree.rotation.z = Math.sin(t * 0.6) * 0.013;
    world.dynamic.bigTree.rotation.x = Math.sin(t * 0.47 + 1) * 0.01;
  }
  // NPC 숨쉬기 + 가까우면 플레이어 쳐다보기 (그림자 재굽기 없음)
  for (let i = 0; i < world.persons.length; i++) {
    const pn = world.persons[i];
    const g = pn.group;
    if (!g.visible) continue;
    g.scale.y = pn.sc * (1 + 0.012 * Math.sin(t * 2.1 + i * 1.7));
    const ddx = player.pos.x - pn.x, ddz = player.pos.z - pn.z;
    const near = (ddx * ddx + ddz * ddz < 10.2) && Math.abs(player.pos.y - g.position.y) < 2;
    const targetYaw = near ? Math.atan2(ddx, ddz) : pn.yaw0;
    let dY = targetYaw - g.rotation.y;
    while (dY > Math.PI) dY -= Math.PI * 2;
    while (dY < -Math.PI) dY += Math.PI * 2;
    if (Math.abs(dY) > 0.01) g.rotation.y += dY * Math.min(1, dt * 5);
    if (pn.tag) pn.tag.rotation.y = camYaw - g.rotation.y;   // 이름표는 항상 카메라를 향함
  }
  // 공 물리 (다가가면 뻥!)
  for (const b of BALLS) {
    b.cd -= dt;
    const bp = b.m.position;
    const bdx = bp.x - player.pos.x, bdz = bp.z - player.pos.z;
    const d2 = bdx * bdx + bdz * bdz;
    if (d2 < 0.8 && b.cd <= 0 && Math.abs(player.pos.y - bp.y) < 1.2) {
      const dd = Math.sqrt(d2) || 0.01;
      const pow = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 10.5 : 6.5;
      b.vx = bdx / dd * pow;
      b.vz = bdz / dd * pow;
      b.vy = 3.2;
      b.cd = 0.35;
    }
    if (b.vx || b.vy || b.vz) {
      b.vy -= 13 * dt;
      const dragK = 1 - 0.12 * dt;
      b.vx *= dragK; b.vz *= dragK;
      bp.x += b.vx * dt; bp.y += b.vy * dt; bp.z += b.vz * dt;
      if (bp.y < b.gy + b.r) {
        bp.y = b.gy + b.r;
        b.vy = Math.abs(b.vy) > 1 ? -b.vy * 0.55 : 0;
        b.vx *= 0.94; b.vz *= 0.94;
      }
      // 골인 판정 (큰 골대 골라인 통과)
      b.gcd = (b.gcd || 0) - dt;
      if (b.bb === FIELD_BB && b.gcd <= 0 && bp.y < 0.2 && Math.abs(bp.z - F_.center[1]) < 2.5) {
        const gL = F_.center[0] - (F_.width / 2 - 18), gR = F_.center[0] + (F_.width / 2 - 18);
        if (bp.x < gL - 0.25 || bp.x > gR + 0.25) {
          toast('⚽ 골인!!');
          bp.set(F_.center[0] - 4 + Math.random() * 8, b.gy + b.r, F_.center[1] + 4);
          b.vx = 0; b.vy = 0; b.vz = 0;
          b.gcd = 2;
        }
      }
      if (bp.x < b.bb.x0 || bp.x > b.bb.x1) { b.vx = -b.vx * 0.7; bp.x = Math.max(b.bb.x0, Math.min(b.bb.x1, bp.x)); }
      if (bp.z < b.bb.z0 || bp.z > b.bb.z1) { b.vz = -b.vz * 0.7; bp.z = Math.max(b.bb.z0, Math.min(b.bb.z1, bp.z)); }
      if (Math.abs(b.vx) < 0.05 && Math.abs(b.vz) < 0.05 && bp.y <= b.gy + b.r + 0.01) { b.vx = 0; b.vz = 0; b.vy = 0; }
      b.m.rotation.x += b.vz * dt * 3;
      b.m.rotation.z -= b.vx * dt * 3;
    }
  }
}

// ---------- 루프 ----------
const clock = new THREE.Clock();
let fpsAcc = 0, fpsN = 0, fpsVal = 0, hudAcc = 0;
let pixelChecked = false;
window.__lastErr = null;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, clock.getDelta());
  try {
    player.update(dt, keys, camYaw);
  } catch (err) {
    window.__lastErr = String(err.stack || err);
    diag.crashes++;
    diag.last.err = String(err).slice(0, 200);
    saveDiag();
    return;
  }
  updateCamera(dt);
  worldTick(dt);
  const t = clock.elapsedTime;
  // 달리기 FOV 킥
  const fovT = player.speedK > 0.5 && (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 53 : 48;
  if (Math.abs(camera.fov - fovT) > 0.05) {
    camera.fov += (fovT - camera.fov) * Math.min(1, dt * 5);
    camera.updateProjectionMatrix();
  }
  // 말풍선 수명
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].t -= dt;
    if (bubbles[i].t <= 0) {
      bubbles[i].parent.remove(bubbles[i].mesh);
      bubbles.splice(i, 1);
    }
  }
  if (msgTimer > 0) {
    msgTimer -= dt;
    if (msgTimer <= 0) msgBox.style.display = 'none';
  }
  fpsAcc += dt; fpsN++;
  hudAcc += dt;
  if (hudAcc > 0.25) {
    hudAcc = 0;
    locChip.textContent = '📍 ' + zoneLabel();
    fpsVal = Math.round(fpsN / fpsAcc);
    fpsBox.textContent = fpsVal + ' fps';
    fpsAcc = 0; fpsN = 0;
    mmDraw();
    const tgt = findTarget();
    const lbl = targetLabel(tgt);
    if (lbl) { promptBox.textContent = lbl; promptBox.style.display = 'block'; }
    else promptBox.style.display = 'none';
    // 해상도 자동 조절 (1회): 첫 5초 뒤 fps<40이면 낮춤
    if (!pixelChecked && t > 5) {
      pixelChecked = true;
      if (fpsVal > 0 && fpsVal < 40) {
        renderer.setPixelRatio(1);
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    }
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
  player, world, camera, renderer, scene, THREE,
  time: applyTime,
  balls: BALLS,
  step(n = 1, keyList = [], dt = 1 / 60) {
    const ks = new Set(keyList);
    for (let i = 0; i < n; i++) {
      player.update(dt, ks, camYaw);
      updateCamera(dt);
      worldTick(dt);
    }
    renderer.render(scene, camera);
  },
  tp(x, z, y = 0) { player.escapeTo({ x, y, z }); },
  pos: () => [player.pos.x.toFixed(1), player.pos.y.toFixed(1), player.pos.z.toFixed(1)],
  yaw: v => { camYaw = v; },
  fps: () => fpsVal,
  zone: zoneLabel,
  perf: () => ({
    fps: fpsVal,
    rayObjs: player._nearRay.length,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    drawCalls: renderer.info.render.calls,
  }),
  diag: () => diag,
  diagClear: () => { diag.stuck = []; diag.crashes = 0; diag.last = {}; saveDiag(); return diag; },
};
