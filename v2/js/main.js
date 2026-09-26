// v2 부트 — 헌법⑤⑥: 정수 해상도만 · AABB 충돌만 · 매초 예산 계측
import * as THREE from 'three';
import { buildKid } from './kid.js?v=3';   // CHAR-2 내 캐릭터(치비·노란 모자)
import { buildWorld } from './world.js?v=120';   // ⚠️world.js를 고치면 이 숫자도 올린다(안 올리면 옛 월드로 검증하게 된다)
import { SCHOOL } from './layout.js?v=10';   // LAYOUT-3 실측 배치(v1 data.js 대신)
import * as NAV from './nav.js?v=5';               // MAP-API-1: 길격자·길찾기(도달성 게이트와 단일 출처)
import { makeMeta } from './mapmeta.js?v=6';       // MAP-API-1: 구역 계약표·출발점·표지점
import { createMapApi } from './mapapi.js?v=6';    // MAP-API-1: 게임용 지도 API(SD2.map) — 정본 docs/map_api.md

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const DPR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(DPR);                       // 네이티브(비정수 업스케일 금지)
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = false;   // GFX-2: 굽기는 setTime → bakeShadows가 한다
// GFX-3(09-26 "그래픽 10점으로"): ACES → Neutral(r170 · Khronos PBR Neutral) — ACES는 채도를 눌러 노란 골대·버스·파랑/주황 기둥·빨간 지붕이 탁했다.
//  Neutral은 밝은 부분만 부드럽게 접고 색상·채도를 그대로 둔다(AgX는 더 탁해서 뺐다). ACES는 노출에 1/0.6을 곱하므로 시간대 exp를 다시 맞췄다(TIMES)
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;

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
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 95, bottom: -95, near: 20, far: 340 }); sun.shadow.camera.updateProjectionMatrix();   // GFX-2: 해는 원점에서 170m(setTime) · 투영 행렬을 다시 만들어야 범위가 먹는다(예전엔 기본 ±5m 그대로였다)
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun);

// PERF-LOAD(09-26): 로딩 막(index.html #boot)이 한 번 칠해진 뒤 월드를 짓는다 — buildWorld는 동기라 그동안 화면이 멈춘다(최상위 await — 모듈).
//  배경 탭(rAF 멈춤)이면 0.1초 뒤 그냥 짓는다. 잰 값은 SD2.timing(buildMs·firstFrameMs·frameCpuP50/P95·occP95 — 아래 RB)
await new Promise(r => { requestAnimationFrame(() => setTimeout(r)); setTimeout(r, 100); });
// PERF-LOAD: 셰이더 미리 짓기 — 월드를 짓는 동안(동기) GPU 쪽이 셰이더를 따로 컴파일하도록 먼저 던져 둔다(이 맥 차가운 시작 첫 프레임 336 → 298ms).
//  재질 조합(종류·무늬·알파 자름·정점색·평면 음영·양면·투명·인스턴스·인스턴스 색)이 첫 화면의 실제 재질(world.js·캐릭터·문·구름)과 같으면 three가 같은 프로그램을 그대로 쓴다.
//  첫 프레임 뒤 버린다(warmDone — 버린 재질만 쓰던 프로그램은 같이 지워진다). 그래서 첫 화면에 없는 조합(밤 별 Points·필름 문 인스턴스 MeshBasic·
//  비인스턴스 Lambert 기본 — 멀리 있거나 밤·상호작용 때만)은 넣지 않는다(occ_merge 로딩 리뷰: 짓고 곧 버리던 3개 — 첫 화면 프로그램 목록 = 미리 짓지 않은 판과 같음).
// GFX-3: 창 유리 — 밖에서 보면 '뚫린 구멍'이던 것을 유리로 읽히게(한 줄 셰이더 · 텍스처·패스·드로우콜 0):
//  ① 비치는 하늘/땅 — 시선을 유리 면에 반사한 방향이 위면 하늘빛, 아래면 땅빛(눈높이보다 위 창은 하늘이 비친다) ② 비스듬할수록 더 비치고 더 불투명(프레넬)
//  ③ 만화식 사선 반짝임 두 줄(월드 좌표 — 창마다 같은 자리). 정면은 여전히 들여다보인다. 색·세기는 시간대마다(setTime · 밤엔 약하게 — 불 켜진 창 빛을 가리지 않게)
const GLASS_U = { uSkyRef: { value: new THREE.Color(0x8fc3ea) }, uGndRef: { value: new THREE.Color(0x5d6b73) }, uFr: { value: 0.6 }, uOut: { value: 1 } };
// GFX-3 리뷰: 안(건물 칸 안 · 눈높이)에서 밖·옆 교실을 볼 땐 사선 반짝임을 끄고 비침도 약하게(uOut 0) — 교실·과학실 창에 흰 사선이 크게 그어져 바깥이 가려졌다. skyTick이 정한다
function glassFx(sh) {
  Object.assign(sh.uniforms, GLASS_U);
  sh.fragmentShader = 'uniform vec3 uSkyRef;\nuniform vec3 uGndRef;\nuniform float uFr;\nuniform float uOut;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
  vec3 gV = normalize(-vViewPosition), gN = normalize(vNormal);
  vec3 gWd = (vec4(gV, 0.0) * viewMatrix).xyz, gWn = (vec4(gN, 0.0) * viewMatrix).xyz, gP = cameraPosition + gWd * length(vViewPosition);
  float gC = 1.0 - abs(dot(gV, gN)), gFr = uFr * (0.3 + 0.7 * gC * gC * gC) * mix(0.35, 1.0, uOut);
  vec3 gRef = mix(uGndRef, uSkyRef, smoothstep(-0.2, 0.3, reflect(gWd, gWn).y));
  float gS = fract((gP.x + gP.z + gP.y) * 0.21), gW = fwidth(gS) + 0.004;   // 폭 = 화면 한 픽셀 이상(멀리서 반짝임·계단 방지)
  float gB = (smoothstep(0.2 - gW, 0.2 + gW, gS) - smoothstep(0.26 - gW, 0.26 + gW, gS)) + 0.6 * (smoothstep(0.31 - gW, 0.31 + gW, gS) - smoothstep(0.34 - gW, 0.34 + gW, gS));
  gB *= (1.0 - smoothstep(25.0, 60.0, length(vViewPosition))) * uOut;   // 멀면 줄은 옅게(하늘빛만)
  outgoingLight = mix(outgoingLight, gRef, gFr) + gB * uFr * 0.45;
  diffuseColor.a = clamp(mix(diffuseColor.a, 0.9, gFr) + gB * uFr * 0.35, 0.0, 1.0);
#include <opaque_fragment>`);
}
const warmDone = (() => { try {
  const T = new THREE.DataTexture(new Uint8Array(4), 1, 1), G = new THREE.BufferGeometry(), s = new THREE.Scene(), mats = []; T.needsUpdate = true;
  G.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  G.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
  const L = o => new THREE.MeshLambertMaterial(o), B = o => new THREE.MeshBasicMaterial(o), D = THREE.DoubleSide;
  const add = (m, inst, col) => { mats.push(m); const o = inst ? new THREE.InstancedMesh(G, m, 1) : new THREE.Mesh(G, m); if (col) o.setColorAt(0, new THREE.Color()); s.add(o); };
  [B({ map: T, alphaTest: 0.5 }), B({}), L({ map: T }), L({ map: T, alphaTest: 0.5, side: D }), L({ map: T, side: D }), L({ transparent: true }), L({ vertexColors: true }),
   B({ map: T, vertexColors: true }), L({ map: T, vertexColors: true }), L({ map: T, transparent: true, side: D }), L({ map: T, vertexColors: true, transparent: true, side: D }),
   B({ vertexColors: true, fog: false })].forEach(m => add(m));   // (CHAR-2: 캐릭터가 매끈한 음영이 되어 '정점색+평면 음영' 조합은 뺌 — L({vertexColors}) 하나로 같이 쓴다)
  add(L({}), true, true); { const m = L({ transparent: true }); m.onBeforeCompile = glassFx; add(m, true); } add(L({}), true);   // GFX-3: 유리문(인스턴스)도 프레넬
  // GFX-2: 그림자를 받는 바깥 바닥(무늬 × 정점색 · receiveShadow) · 발밑 둥근 그림자(무늬 · 투명) · 하늘 돔(정점색 · 안개·톤매핑 무시)
  { const m = L({ map: T, vertexColors: true }); mats.push(m); const o = new THREE.Mesh(G, m); o.receiveShadow = true; s.add(o); }
  add(B({ map: T, transparent: true, depthWrite: false })); add(B({ vertexColors: true, fog: false, toneMapped: false, depthWrite: false }));
  { const m = L({ transparent: true, depthWrite: false }); m.onBeforeCompile = glassFx; add(m); }   // GFX-3: 창 유리(프레넬) — 같은 onBeforeCompile이면 같은 프로그램
  renderer.compile(s, camera, scene);
  return () => { mats.forEach(m => m.dispose()); G.dispose(); T.dispose(); };
} catch (e) { return () => {}; } })();
const TIMING = { buildMs: performance.now(), firstFrameMs: null };
const world = buildWorld(scene);
TIMING.buildMs = performance.now() - TIMING.buildMs;
if (world.glassMesh) { world.glassMesh.material.onBeforeCompile = glassFx; world.glassMesh.material.needsUpdate = true; }
// GFX-2(09-26 "그래픽 계속 발전"): 정적 월드 그림자 — 합친 정적 청크(나무·건물·골대 등 st)가 그림자를 던지고, 바깥 바닥 무늬 층만 받는다.
//  건물 청크는 받지 않는다(지붕 그림자가 교실 바닥·벽에 떨어지면 실내가 어두워진다). near 디테일(사람·책상)은 던지지 않는다(굽는 순간 카메라 거리로 켜고 끈다).
//  그림자는 시간대를 바꿀 때만 한 번 굽는다(bakeShadows) — 매 프레임 비용 = 받는 바닥 픽셀 샘플링뿐(삼각형·드로우콜 +0)
const SHADOW_RECV = new Set(['grass', 'dirt', 'pave', 'paveE', 'paveF', 'paveG', 'asph', 'gravel', 'chip', 'ilock', 'sand', 'hop', 'brick', 'kidHop', 'redRd']);   // GFX-3: 사방치기·정문 붉은 포장도 받는다
const ST_MESH = [];
scene.traverse(o => { if (o.userData.st) { o.castShadow = true; ST_MESH.push(o); } else if (o.userData.pat && SHADOW_RECV.has(o.userData.pat)) o.receiveShadow = true; });
// GFX-3: 바깥 near 디테일 청크(차·놀이기구·골대·벤치·농구대·바깥에 선 사람·아랫단 띠)도 굽는 순간만 켜서 그림자를 던진다 — '떠 보이던' 작은 것이 땅에 붙는다.
//  굽기는 카메라와 무관(해 카메라 절두체) · 매 프레임 비용 0(굽기만). 실내 청크('i')는 던지지 않는다(지붕 아래라 받는 바닥이 없다)
for (const d of world.details) if (!d.inside) { d.mesh.castShadow = true; ST_MESH.push(d.mesh); }
let MAP = null;   // MAP-API-1 지도 API — loop() 위에서 만든다. setTime('day')가 먼저 돌므로 참조는 전부 MAP?.(TDZ 함정)

// ---------- 플레이어 (AABB 전용 — 레이캐스트 0) ----------
const P = { x: 12.4, y: world.terrainAt(12.4, -6) + 0.01, z: -6, vy: 0, yaw: 0, ground: true };   // 운동장에서 구령대·본관을 보며 시작
// ---------- 내 캐릭터(CHAR-2 · 09-26 사용자 "캐릭터 생긴 게 너무 징그럽다") — 장난감 치비 · 노란 모자(v2/js/kid.js) ----------
// CHAR-1(각진 얼굴·반짝이는 큰 눈·코 공·두꺼운 입·긴 목·막대 팔다리)을 버리고: 큰 둥근 머리·목 없음·짧고 통통한 팔다리·눈 둘 + 가는 웃는 입·매끈한 음영.
// 부위마다 정점색을 구운 메시(한 재질) — 드로우콜 7. 앞 = +z(P.yaw 0 = +z로 걷는 방향). 키 ≈1.3m
const pg = new THREE.Group();
const KID = buildKid(THREE, 'b');
pg.add(KID.rig);
scene.add(pg);
KID.rig.traverse(o => { o.castShadow = false; });   // GFX-2: 그림자는 굽기만 하므로 캐릭터 그림자는 구운 자리에 멈춰 남는다 — 대신 발밑 둥근 그림자(아래 blob)
// GFX-2: 발밑 둥근 그림자 — 부드러운 원(무늬 알파 · 조명 무시 · 깊이 안 씀). 매 프레임 발밑 바닥 높이(groundAt)에, 뛰면 작고 옅어진다
const blob = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 4, 32, 32, 31);
  gr.addColorStop(0, 'rgba(20,24,34,0.42)'); gr.addColorStop(0.55, 'rgba(20,24,34,0.3)'); gr.addColorStop(1, 'rgba(20,24,34,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
  m.renderOrder = 1; scene.add(m); return m;
})();
// 걷기·점프·앉기 동작: 이동 속도로 팔다리를 흔들고(반대쪽끼리), 공중이면 팔을 들고, 앉으면 무릎을 굽혀 의자 위에(몸을 앞으로 0.42·아래로 0.1)
let kidPh = 0, kidX = P.x, kidZ = P.z, kidT = 0;
function kidTick(dt) {
  const v = Math.hypot(P.x - kidX, P.z - kidZ) / Math.max(dt, 1e-3); kidX = P.x; kidZ = P.z; kidT += dt;
  const K = KID, sit = !!ACT.sit, air = !P.ground && !sit && !ACT.anim, mv = sit ? 0 : Math.min(1, v / 4.2);
  if (v > 0.3 && !sit) kidPh += dt * (5.5 + v * 1.5);
  const sw = Math.sin(kidPh) * 0.7 * mv;
  K.rig.position.set(0, sit ? K.sitY : Math.abs(Math.sin(kidPh)) * 0.04 * mv, sit ? 0.42 : 0);   // sitY = 의자 앉는 판(0.46)에 엉덩이
  if (sit) { K.legL.g.rotation.x = K.legR.g.rotation.x = -1.5; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 1.5; K.armL.rotation.x = K.armR.rotation.x = -0.85; }
  else if (air) { K.legL.g.rotation.x = -0.5; K.legR.g.rotation.x = 0.25; K.legL.knee.rotation.x = 0.7; K.legR.knee.rotation.x = 0.3; K.armL.rotation.x = K.armR.rotation.x = -2.5; }
  else { K.legL.g.rotation.x = sw; K.legR.g.rotation.x = -sw; K.legL.knee.rotation.x = Math.max(0, sw) * 0.9; K.legR.knee.rotation.x = Math.max(0, -sw) * 0.9;
    K.armL.rotation.x = -sw * 0.85; K.armR.rotation.x = sw * 0.85; }
  if (tray && !sit) K.armL.rotation.x = K.armR.rotation.x = -1.1;                                  // 식판 받쳐 들기
  if (milk && !sit && !tray) K.armR.rotation.x = -0.7;                                               // 우유 들기
  K.head.rotation.x = mv > 0.1 ? 0.04 : Math.sin(kidT * 1.7) * 0.03;                                   // 가만히 있으면 살짝 끄덕끄덕
  K.body.scale.y = 1 + (mv < 0.1 && !sit ? Math.sin(kidT * 2.2) * 0.008 : 0);                           // 숨쉬기
}

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
const CTRL = { frozen: false, speed: 1 };   // MAP-API-1: 게임이 멈춤(입력·점프만 무시 — 중력은 유지)·속도(0.5~2)를 건다
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
  pg.position.set(P.x, P.y, P.z);
  pg.rotation.y = CTRL.face ?? P.yaw;   // GAME-WG(09-26): 게임이 몸 방향을 잠깐 잡을 수 있다(물총 겨눔 — map.player.aim) · 없으면 걷는 방향
  kidTick(dt);
  // CAM-2(09-24): 사용자 "복도가 좁은 것 같다" — 실측 복도는 2.5m(게임 2.7m)로 좁지 않았다. 원인은 카메라:
  //  6.3m 뒤·17° 위에서 내려다보면 실내에선 천장(3.24m) 밑에 붙어 위에서 내려다보고, 화각 48°는 휴대폰 광각보다 훨씬 좁다.
  //  → 실내(머리 위에 천장)에선 가깝고(3.3m) 낮게(피치 ≤0.2)·화각 60°, 밖은 6.3m·52°. V = 1인칭(눈높이 1.5m) 전환.
  const indoor = ceilAt(P.x, P.z, P.y + 1.6, P.y + 5.5) !== null;
  const tFov = camFirst ? 66 : indoor ? 60 : 52;
  if (Math.abs(camera.fov - tFov) > 0.05) { camera.fov += (tFov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
  { const gy = groundAt(P.x, P.z, P.y + 0.05), h = Math.max(0, P.y - gy), k = Math.max(0.35, 1 - h * 0.35);   // GFX-2 발밑 그림자
    blob.position.set(P.x, gy + 0.045, P.z); blob.scale.setScalar(0.95 * k); blob.material.opacity = k; blob.visible = !ACT.sit && h < 3; }
  pg.visible = !camFirst && camD > 0.45;   // CAM-3: 벽에 붙어 카메라가 머리 바로 뒤까지 오면 캐릭터를 숨긴다(1인칭처럼)
  if (camFirst) {
    const pitch = camPitch - 0.3, ey = P.y + 1.5 - (ACT.sit ? 0.42 : 0);
    camera.position.set(P.x, ey, P.z);
    camera.lookAt(P.x - Math.sin(camYaw) * Math.cos(pitch), ey - Math.sin(pitch), P.z - Math.cos(camYaw) * Math.cos(pitch));
  } else {
    const hx = P.x, hy = P.y + 1.3, hz = P.z, pch = indoor ? Math.min(camPitch, 0.2) : camPitch, CD = indoor ? 3.3 : CAM_D;
    const want = camPose(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect).want;
    camD = want < camD ? want : camD + (want - camD) * Math.min(1, dt * 7);   // 당김은 즉시·복귀는 이징(지터 방지)
    const C = camPose(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect, camD);   // 실제 거리에서 옆벽 비키기
    camSh = Math.abs(C.sh) > Math.abs(camSh) || C.sh * camSh < 0 ? C.sh : camSh + (C.sh - camSh) * Math.min(1, dt * 8);   // 비키기는 즉시·돌아오기는 이징
    const sh9 = camSh + (CTRL.shoulder || 0), rx = Math.cos(camYaw) * sh9, rz = -Math.sin(camYaw) * sh9;   // GAME-WG: CTRL.shoulder = 어깨 너머 시점(게임이 바깥에서만 켬 — map.player.shoulder)
    camera.position.set(C.x0 + rx, C.y, C.z0 + rz);
    camera.lookAt(hx + rx, hy, hz + rz);
  }
  if (SHOT) applyShot();
}
// CAM-3(09-24 맵 건강 검진): 3인칭 카메라 자리 — 검진(health.js)과 실제 카메라가 이 한 식을 쓴다(SD2.camPose).
//  ① 머리→뒤 가운데 광선(camHit)으로 벽까지 거리, 여유 0.3을 뺀 자리(최대 CD). 검진 실측: 자세의 1.06%가 벽을 뚫었다.
//  ② 벽이 0.8m 안이라 0.5까지 못 물러나면: 예전엔 0.5에 섰다 = 벽 뒤(벽 너머 방이 통째로 보임) → 벽 앞 0.12까지만(캐릭터는 숨김)
//  ③ 옆벽: 카메라 자리에서 좌우로 '근평면 반폭 + 8cm' 광선 — 닿으면 그만큼 반대로 비켜 선다(시선도 같이 비켜 화면이 돌지 않게).
//     벽에 붙어 벽과 나란히 볼 때 근평면 모서리(반폭 0.33 > 몸 반지름 0.26)가 벽을 파고들던 것.
//  ④ CAM-4(integ 09-25): 근평면 사각형(시선 0.3 앞 · 반폭·반높이)이 처마·차양·지붕 끝 같은 판에 걸리면 0.1씩 머리 쪽으로 당긴다(0.5까지 — 0.25씩이면 현관 차양 밑에서 한 번에 0.6m 튀었다).
//     camHit은 낮은 얇은 부재(가구)를 일부러 무시해 카메라 높이의 처마 판(동관 남쪽 처마 y 3.4~3.7 · 현관 차양)을 못 봤다 — 검진 nearWall과 같은 판정
const CAMP = { want: 0, d: 0, sh: 0, x0: 0, y: 0, z0: 0 };
function nearClip(cx, cy, cz, fx, fy, fz, fov, aspect, hy) {
  const hh = 0.3 * Math.tan(fov * Math.PI / 360), hw = hh * aspect, rl = Math.hypot(fz, fx) || 1, rx = fz / rl, rz = -fx / rl;
  const ux = rz * fy, uy = fz * rx - fx * rz, uz = -fy * rx, fl = hy - 1.3 + 0.12;
  const k0x = Math.floor((cx - 1) / 8), k1x = Math.floor((cx + 1) / 8), k0z = Math.floor((cz - 1) / 8), k1z = Math.floor((cz + 1) / 8);
  for (let gx = k0x; gx <= k1x; gx++) for (let gz = k0z; gz <= k1z; gz++) {
    const cell = world.grid.get(gx + ':' + gz); if (!cell) continue;
    for (const i of cell) { const b = world.colliders[i];
      if (b.nc || b.y1 <= fl || (b.y1 - b.y0 < 1.5 && b.y0 < hy + 0.4)) continue;
      if (b.x1 < cx - 0.6 || b.x0 > cx + 0.6 || b.z1 < cz - 0.6 || b.z0 > cz + 0.6 || b.y1 < cy - 0.6 || b.y0 > cy + 0.6) continue;
      for (const [sa, sb] of NCP) { const ex = fx * 0.3 + rx * hw * sa + ux * hh * sb, ey = fy * 0.3 + uy * hh * sb, ez = fz * 0.3 + rz * hw * sa + uz * hh * sb;
        let t0 = 0, t1 = 1, ok = true;
        for (let a = 0; a < 3 && ok; a++) { const o = a === 0 ? cx : a === 1 ? cy : cz, d9 = a === 0 ? ex : a === 1 ? ey : ez, lo = a === 0 ? b.x0 : a === 1 ? b.y0 : b.z0, hi = a === 0 ? b.x1 : a === 1 ? b.y1 : b.z1;
          if (Math.abs(d9) < 1e-8) { if (o < lo || o > hi) ok = false; } else { let p = (lo - o) / d9, q = (hi - o) / d9; if (p > q) { const s9 = p; p = q; q = s9; } if (p > t0) t0 = p; if (q < t1) t1 = q; if (t0 > t1) ok = false; } }
        if (ok) return true; } } }
  return false;
}
const NCP = [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0]];
function camPose(hx, hy, hz, yaw, pch, CD, fov, aspect, dUse) {
  const dx = Math.sin(yaw) * Math.cos(pch), dy = Math.sin(pch), dz = Math.cos(yaw) * Math.cos(pch);
  const hit = camHit(hx, hy, hz, dx, dy, dz, CD);
  let want = Math.min(CD, hit - 0.3);
  if (want < 0.5) want = Math.max(0.1, Math.min(0.5, hit - 0.12));
  for (let k = 0; k < 60 && want > 0.5 && nearClip(hx + dx * want, hy + dy * want, hz + dz * want, -dx, -dy, -dz, fov, aspect, hy); k++) want = Math.max(0.5, want - 0.1);   // ④
  const d = dUse ?? want, cx = hx + dx * d, cy = hy + dy * d, cz = hz + dz * d;
  const hw = 0.3 * Math.tan(fov * Math.PI / 360) * aspect + 0.08, rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const r = camHit(cx, cy, cz, rx, 0, rz, hw), l = camHit(cx, cy, cz, -rx, 0, -rz, hw);
  CAMP.sh = (r < hw && l < hw) ? (r - l) / 2 : r < hw ? r - hw : l < hw ? hw - l : 0;
  CAMP.want = want; CAMP.d = d; CAMP.x0 = cx; CAMP.y = cy; CAMP.z0 = cz;
  return CAMP;
}
let camSh = 0;
function physics(dt) {
  const sp = (keys.has('ShiftLeft') ? 7.5 : 4.2) * CTRL.speed;
  let mx = 0, mz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) { mx -= Math.sin(camYaw); mz -= Math.cos(camYaw); }
  if (keys.has('KeyS') || keys.has('ArrowDown')) { mx += Math.sin(camYaw); mz += Math.cos(camYaw); }
  if (keys.has('KeyA') || keys.has('ArrowLeft')) { mx -= Math.cos(camYaw); mz += Math.sin(camYaw); }
  if (keys.has('KeyD') || keys.has('ArrowRight')) { mx += Math.cos(camYaw); mz -= Math.sin(camYaw); }
  if (CTRL.frozen) mx = mz = 0;
  const L = Math.hypot(mx, mz);
  if (L > 0) {
    mx /= L; mz /= L;
    const nx = P.x + mx * sp * dt, nz = P.z + mz * sp * dt;
    if (!blockedAt(nx, P.z, P.y)) P.x = nx;
    if (!blockedAt(P.x, nz, P.y)) P.z = nz;
    P.yaw = Math.atan2(mx, mz);
  }
  if (keys.has('Space') && P.ground && !CTRL.frozen) { P.vy = 5.2; P.ground = false; }
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
  pg.visible = false; blob.visible = false;
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
function toast(msg, sec = 2.2) { toastEl.textContent = msg; toastEl.style.display = ''; toastT = sec; }
let hotNear = null, hotT = 0;
function hotTick(dt) {
  if (toastT > 0 && (toastT -= dt) <= 0) toastEl.style.display = 'none';
  if ((hotT += dt) < 0.15) return;
  hotT = 0;
  let best = null, bd = 1e9;
  if (!ACT.anim) for (const h of HOT) {
    if (h.off) continue;   // MAP-API-1: 게임이 끈 지점
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
  const g = c.getContext('2d'); g.strokeStyle = g.fillStyle = 'rgba(28,64,150,0.9)'; g.lineWidth = 5; g.lineCap = 'round';   // 흰 칠판 = 파랑 마커
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
let tray = null, milk = null, shoesIn = false, drumN = 0;
// 소리(WebAudio — E키 누름이 사용자 제스처라 바로 재생 가능). 짧은 합성음만(파일 없음)
let AC = null;
function tone(freq, t0, dur, type = 'sine', vol = 0.25, drop = 0) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();   // GAME-FIND-1: ?game= 주소로 시작하면 첫 소리가 사용자 입력 전이라 멈춘 채 만들어진다 → 다음 소리 때 깨운다
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(freq, t); if (drop) o.frequency.exponentialRampToValueAtTime(drop, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* 소리 막힌 환경 — 무시 */ }
}
const drumSnd = () => { tone(120, 0, 0.35, 'sine', 0.55, 45); tone(120, 0.3, 0.3, 'sine', 0.45, 45); tone(900, 0.15, 0.08, 'square', 0.06); };
const xyloSnd = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.4, 'triangle', 0.22));
const songSnd = () => [392, 440, 494, 523, 494, 440, 392].forEach((f, i) => tone(f, i * 0.28, 0.32, 'triangle', 0.16));
function act(h) {
  if (typeof h.use === 'function') {   // MAP-API-1: 게임이 더한 지점(map.interact.add) — 예외는 잡아서 루프가 안 멈추게
    try { h.use(h); } catch (e) { console.error(e); }
    hotNear = null; if (h.once) h.off = true; MAP?.emit('interact', h); return;
  }
  MAP?.emit('interact', h);
  switch (h.kind) {
    case 'board': {
      h.stage = ((h.stage || 0) + 1) % 3;
      if (!h.mesh) { h.mesh = new THREE.Mesh(chalkGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); h.mesh.position.set(h.bx, h.by, h.bz); h.mesh.rotation.y = h.ry || 0; scene.add(h.mesh); }
      h.mesh.visible = h.stage > 0;
      if (h.stage > 0) { h.mesh.material.map = chalkTex[h.stage - 1]; h.mesh.material.needsUpdate = true; }
      toast(h.stage === 0 ? '🧽 칠판을 깨끗이 지웠어요' : '✏️ 칠판에 낙서했어요');
      hotNear = null; break;
    }
    case 'sit':
      ACT.sit = { x: h.x, z: h.z, y: h.y }; P.yaw = h.yaw ?? Math.PI;   // 의자 바로 뒤(몸을 의자 상자 안에 넣으면 일어날 때 의자 위로 올라선다)
      toast('🪑 의자에 앉았어요 — 움직이면 일어나요'); hotNear = null; break;
    case 'meal':   // 배식대: 칸 나뉜 식판에 밥·국·반찬 셋(반납은 식판 반납대에서)
      if (!tray) {
        tray = new THREE.Group(); tray.position.set(0, KID.tray[0], KID.tray[1]);   // 두 손 앞(CHAR-2 키에 맞춤)
        const TM = c => new THREE.MeshLambertMaterial({ color: c });
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.34), TM(0xc8d2da)); tray.add(base);
        [[-0.13, 0.07, 0xf4f1e8], [0.13, 0.07, 0xc86a3a], [-0.16, -0.08, 0xc8452c], [0, -0.08, 0x6fa04f], [0.16, -0.08, 0xe8c35a]].forEach(([x, z, c], i) => {
          const f = new THREE.Mesh(i < 2 ? new THREE.SphereGeometry(0.075, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2) : new THREE.BoxGeometry(0.1, 0.03, 0.09), TM(c));
          f.position.set(x, 0.02, -z); tray.add(f); });
        pg.add(tray); toast('🍚 급식을 받았어요 — 식탁에 앉아 먹어요');
      } else toast('🍽️ 다 먹은 식판은 식판 반납대에 돌려줘요');
      break;
    case 'trayback':
      if (tray) { pg.remove(tray); tray = null; toast('🍽️ 식판을 반납했어요 — 잘 먹었습니다!'); } else toast('반납할 식판이 없어요');
      break;
    case 'read': toast('📖 조용히 책을 읽고 있어요'); break;
    case 'water': toast('💧 물을 마셨어요'); break;
    case 'wash': toast('🫧 손을 깨끗이 씻었어요'); break;
    case 'garden': toast('🌱 텃밭에 물을 줬어요'); break;
    case 'pot': toast('🪴 향나무 화분에 물을 줬어요'); break;
    case 'mic': toast('🎤 구령대 마이크를 잡았어요'); break;
    case 'shoes': shoesIn = !shoesIn; toast(shoesIn ? '👟 실내화로 갈아신었어요' : '👞 운동화로 갈아신었어요'); break;
    case 'drum': (drumN++ % 2 ? xyloSnd : drumSnd)(); toast(drumN % 2 ? '🥁 둥둥 둥둥!' : '🎶 도미솔도~ 실로폰 소리'); break;
    case 'milk':
      if (!milk) { milk = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.09), new THREE.MeshLambertMaterial({ color: 0xf4f6f2 })); milk.position.set(...KID.milk); pg.add(milk); toast('🥛 우유를 하나 꺼냈어요'); }
      else { pg.remove(milk); milk = null; toast('🥛 우유를 다 마셨어요'); }
      break;
    case 'visit': toast('📝 방문록에 이름을 적었어요'); break;
    case 'map': toast('🗺️ 학교 안내도 — 현관 · 가운데 로비 · 교실을 찾아가 봐요'); break;
    case 'clock': { const d = new Date(); toast(`🕰️ 지금은 ${d.getHours()}시 ${d.getMinutes()}분이에요`); break; }
    case 'notice': toast('📋 이번 주 학생자치회 소식을 읽었어요'); break;
    case 'aed': toast('❤️ AED(자동심장충격기) 보관함이에요 — 위급할 땐 선생님께 바로 알려요'); break;   // LINK-EAST-14 세로복도 입구
    case 'keypad': [1319, 1175, 1397].forEach((f, i) => tone(f, i * 0.09, 0.07, 'square', 0.05)); toast('🔢 과학실 번호키를 눌렀어요 — 삐빅!'); break;   // LINK-EAST-11 과학실 문
    case 'song': songSnd(); toast('🎵 교가를 흥얼거렸어요'); break;
    case 'motto': toast('📜 우리 학교 교훈 — 바르고 슬기롭게'); break;
    case 'flag': toast('🇰🇷 태극기가 바람에 펄럭여요'); break;
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
glassMat.onBeforeCompile = glassFx;   // GFX-3: 창 유리와 같은 프레넬(하늘빛·비스듬하면 더 불투명)
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
  return { ax: d.ax, bx: d.cx, bz: d.cz, w, ow: d.w, h, y0: d.y0, glass: d.glass, open: 0, over: d.slideOver ? 0.12 : 0, color: d.color, slot: d.slot, film: d.film, lum: d.lum };
});
const _boxG = new THREE.BoxGeometry(1, 1, 1);
const nWood = DOORS.filter(o => !o.glass && !o.film).length, nFilm = DOORS.filter(o => o.film).length, nGlass = DOORS.length - nWood - nFilm;
// 필름 유리문(화장실 넷 — main_corridor-5 · 영상 a_457.5·a_517.5): 복도 쪽 면이 북(-z)을 봐서 반구광만 받아 회색 판으로 보였다 → 조명 무시 + 흰 바탕 무늬(문마다 필름 색)
const filmTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#d4d6d8'; g.fillRect(0, 0, 128, 7); g.fillRect(0, 249, 128, 7); g.fillRect(0, 0, 7, 256); g.fillRect(121, 0, 7, 256);   // 은색 문 테
  g.fillStyle = 'rgba(150,150,150,0.35)'; [[34, 190, 16], [80, 214, 22], [58, 150, 11], [96, 170, 9], [30, 228, 10]].forEach(([x, y, r]) => { for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * 1.2566) * r * 0.7, y + Math.sin(k * 1.2566) * r * 0.7, r * 0.55, r * 0.32, k * 1.2566, 0, 7); g.fill(); } });   // 꽃·잎 무늬
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(64, 86, 22, 0, 7); g.fill(); g.strokeStyle = 'rgba(120,120,120,0.5)'; g.lineWidth = 4; g.stroke();   // 이름 둥근 판
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const doorInst = {
  film: new THREE.InstancedMesh(_boxG, new THREE.MeshBasicMaterial({ color: 0xffffff, map: filmTex }), Math.max(1, nFilm)),
  wood: new THREE.InstancedMesh(_boxG, doorMat, Math.max(1, nWood)),
  glass: new THREE.InstancedMesh(_boxG, glassMat, Math.max(1, nGlass)),
  win: new THREE.InstancedMesh(_boxG, new THREE.MeshLambertMaterial({ color: 0x9fc6d4 }), Math.max(1, nWood)),
  knob: new THREE.InstancedMesh(_boxG, new THREE.MeshLambertMaterial({ color: 0x6b6f75 }), Math.max(1, nWood)),
};
Object.values(doorInst).forEach(m => { m.frustumCulled = false; scene.add(m); });
doorInst.wood.count = nWood; doorInst.win.count = nWood; doorInst.knob.count = nWood; doorInst.glass.count = nGlass; doorInst.film.count = nFilm;
{ let iw = 0, ig = 0, i9 = 0; const _dc = new THREE.Color(); DOORS.forEach(o => { o.idx = o.glass ? ig++ : o.film ? i9++ : iw++; if (o.film) doorInst.film.setColorAt(o.idx, _dc.set(o.color ?? 0xffffff)); else if (!o.glass) doorInst.wood.setColorAt(o.idx, _dc.set(o.color ?? 0xc08b4f).multiplyScalar(o.lum ?? 1)); });
  if (doorInst.wood.instanceColor) doorInst.wood.instanceColor.needsUpdate = true; if (doorInst.film.instanceColor) doorInst.film.instanceColor.needsUpdate = true; }
// 필름 문은 실내 디테일처럼 멀면 숨긴다(world.details에 끼우면 detailTick이 거리로 켜고 끔 — 먼 구역 닻 드로우콜 +0)
if (nFilm) { const fl = DOORS.filter(o => o.film); world.details.push({ mesh: doorInst.film, cx: fl.reduce((a, o) => a + o.bx, 0) / nFilm, cz: fl.reduce((a, o) => a + o.bz, 0) / nFilm, inside: true }); }
const _dM = new THREE.Matrix4(), _dP = new THREE.Vector3(), _dS = new THREE.Vector3(), _dQ = new THREE.Quaternion();
function setDoor(o) {
  const s = o.open * (o.slide ?? 0) * (o.dir ?? 1);
  const X = o.ax === 'x', cx = X ? o.bx + s : o.bx + (o.over || 0), cz = X ? o.bz + (o.over || 0) : o.bz + s;
  const put = (m, lx, y, ww, hh, th) => {        // lx = 문 폭 방향 오프셋, th = 두께
    _dP.set(X ? cx + lx : cx, y, X ? cz : cz + lx); _dS.set(X ? ww : th, hh, X ? th : ww);
    m.setMatrixAt(o.idx, _dM.compose(_dP, _dQ, _dS));
  };
  if (o.glass) { put(doorInst.glass, 0, o.y0 + o.h/2, o.w, o.h, 0.16); doorInst.glass.instanceMatrix.needsUpdate = true; return; }
  if (o.film) { put(doorInst.film, 0, o.y0 + o.h/2, o.w, o.h, 0.16); doorInst.film.instanceMatrix.needsUpdate = true; return; }
  put(doorInst.wood, 0, o.y0 + o.h/2, o.w, o.h, 0.16);
  const ww = Math.min(0.5, o.ow * 0.4), edge = -(o.dir ?? 1) * (o.ow/2 - 0.16);   // 손잡이 = 나중에 들어가는 쪽 끝
  if (o.slot) put(doorInst.win, edge * 0.35, o.y0 + 1.45, Math.min(0.6, o.ow * 0.5), 0.12, 0.18);   // 교실 문 = 눈높이 가로 쪽창(영상 a_480·a_423 — classrooms-19)
  else put(doorInst.win, edge * 0.35, o.y0 + 1.65, ww, 0.7, 0.18);
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
  if (!o.swC || len > o.swLen || o.swN !== world.allBoxes.length) {   // PERF-LOAD: 문마다 가장 길게 쓸 자리(양쪽)에 걸친 후보만 한 번 추림 — 세기만 하니 순서 무관(같은 값)
    const e = Math.max(len, o.ow + 0.05), R9 = o.ax === 'x' ? [o.bx - o.w/2 - e, o.bx + o.w/2 + e, o.bz - T, o.bz + T] : [o.bx - T, o.bx + T, o.bz - o.w/2 - e, o.bz + o.w/2 + e];
    o.swC = world.allBoxes.filter(b => !(b.wall || b.y1 - b.y0 >= 2.6) && !(b.x1 <= R9[0] || b.x0 >= R9[1] || b.z1 <= R9[2] || b.z0 >= R9[3] || b.y1 <= y0 || b.y0 >= y1)); o.swLen = e; o.swN = world.allBoxes.length; }
  for (const b of o.swC) {
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
  night:  { label: '🌙 밤',  bg: 0x1f2b3f, near: 40, far: 175, sky: 0x5a73a0, gnd: 0x2c3444, hi: 1.15, sc: 0xa8bcda, si: 0.9, sp: [-30, 80, -60], exp: 1.12 },
};
// GFX-2: 밤 — 해가 안 비치는 쪽 겉벽·나무가 새까만 실루엣이던 것을 푸른 달빛으로(하늘빛 0x35485f·0.6 → 0x5a73a0·1.15). 노을 그늘도 덜 탁하게(1.15 → 1.3)
TIMES.sunset.hi = 1.3;
// GFX-3: Neutral 노출(ACES 1.12/1.06/1.12와 같은 밝기 — 밤은 살짝 더 밝게 읽히게)
TIMES.day.exp = 1.05; TIMES.sunset.exp = 1.12; TIMES.night.exp = 1.15;
// GFX-2: 하늘 돔 — 단색 배경 대신 지평선(= 안개색 — 먼 땅과 이어진다) → 천정(짙은 하늘색)으로. 정점색 한 메시(조명·안개·톤매핑 무시 — 안개도 톤매핑 뒤에 섞이니 지평선이 배경색과 같다)
//  카메라를 따라다닌다(skyTick). 반지름 290 < 카메라 far 320. 안쪽을 보게 감는 방향을 뒤집었다(BackSide 셰이더를 따로 만들지 않게)
const SKY_TOP = { day: 0x86bfee, sunset: 0xa8a2cf, night: 0x0b1322 };
const skyDome = (() => {
  const g = new THREE.SphereGeometry(290, 20, 8), ix = g.index.array;
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false, depthWrite: false }));
  m.frustumCulled = false; m.renderOrder = -1; scene.add(m); return m;
})();
function skyPaint(k) {
  const P = skyDome.geometry.attributes.position, C = skyDome.geometry.attributes.color, lo = new THREE.Color(TIMES[k].bg), hi = new THREE.Color(SKY_TOP[k]), c = new THREE.Color();
  const sd = new THREE.Vector3(...TIMES[k].sp).setY(0).normalize(), glow = new THREE.Color(0xffc48a);
  for (let i = 0; i < P.count; i++) { const x = P.getX(i) / 290, y = P.getY(i) / 290, z = P.getZ(i) / 290, t = Math.min(1, Math.max(0, y));
    c.copy(lo).lerp(hi, Math.pow(t, 0.7));
    if (k === 'sunset') { const a = Math.max(0, (x * sd.x + z * sd.z) / (Math.hypot(x, z) || 1)); c.lerp(glow, a * a * a * Math.max(0, 1 - t * 2.2) * 0.55); }   // 해 쪽 지평선 주황빛
    C.setXYZ(i, c.r, c.g, c.b); }
  C.needsUpdate = true;
}
// GFX-2: 그림자 굽기 — 정적 청크는 매 프레임 절두체로 숨기므로(OCC.st) 굽는 순간만 다 켜고, 땅속 먼 곳을 보는 굽기 카메라로 한 번 그린다
//  (화면 패스는 절두체 밖이라 거의 0 — 그림자 패스는 해 카메라 절두체로 따로 거른다. three 그림자 패스는 '화면 카메라 층'을 보므로 층으로는 못 가린다)
const bakeCam = new THREE.PerspectiveCamera(1, 1, 0.1, 0.2); bakeCam.position.set(0, -5000, 0); bakeCam.lookAt(0, -6000, 0); bakeCam.updateMatrixWorld();
function bakeShadows() {
  const st = ST_MESH, vis = st.map(m => m.visible);
  st.forEach(m => { m.visible = true; });
  const t0 = performance.now();
  renderer.shadowMap.needsUpdate = true; renderer.render(scene, bakeCam);
  st.forEach((m, i) => { m.visible = vis[i]; });
  TIMING.bakeMs = +(performance.now() - t0).toFixed(2);   // GFX-3: 굽기 CPU 비용(시간대 전환 1회)
}
// 밤하늘 별(점 500개 · 안개 무시) + 밤엔 창 유리가 따뜻하게 빛난다(교실 불 켜진 느낌) — 빛(Light)은 추가하지 않는다
const stars = (() => {
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = Math.random() * Math.PI * 2, ph = 0.08 + Math.random() * 0.5, R = 290;
    pos[i*3] = Math.cos(th) * Math.cos(ph) * R; pos[i*3+1] = Math.sin(ph) * R; pos[i*3+2] = Math.sin(th) * Math.cos(ph) * R; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff8e8, size: 1.7, sizeAttenuation: false, fog: false }));
  m.visible = false; m.frustumCulled = false; scene.add(m); return m;
})();
// 구름(다각 덩어리 9무리 · 한 메시 · 조명 무시 + 정점색: 윗면 흰색·아랫면 푸른 회색). 카메라를 따라다녀 하늘처럼 멀고, 아주 천천히 돈다. 시간대마다 색만 바꾼다
const clouds = (() => {
  let sd = 20260924; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const pos = [], col = [], blob = new THREE.IcosahedronGeometry(1, 1), bp = blob.attributes.position, m4 = new THREE.Matrix4();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), TOP = new THREE.Color(0xffffff), BOT = new THREE.Color(0xd3dcea), cc = new THREE.Color();
  for (let i = 0; i < 9; i++) {
    const th = i / 9 * Math.PI * 2 + rnd() * 0.5, R = 150 + rnd() * 60, cx = Math.cos(th) * R, cz = Math.sin(th) * R, cy = 58 + rnd() * 30, sc = 0.8 + rnd() * 0.5, k = 4 + Math.floor(rnd() * 3);
    for (let j = 0; j < k; j++) {
      const ox = (j - (k - 1) / 2) * 9 * sc + (rnd() - 0.5) * 4, big = 1 - Math.abs(j - (k - 1) / 2) / k;
      m4.compose(new THREE.Vector3(cx + ox * Math.cos(th + 1.57), cy + big * 4.5 * sc, cz + ox * Math.sin(th + 1.57)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd() * 3, 0)),
        new THREE.Vector3((9 + big * 9) * sc, (5 + big * 7) * sc, (8 + big * 7) * sc));
      for (let t = 0; t < bp.count; t += 3) {
        a.fromBufferAttribute(bp, t).applyMatrix4(m4); b.fromBufferAttribute(bp, t + 1).applyMatrix4(m4); c.fromBufferAttribute(bp, t + 2).applyMatrix4(m4);
        a.y = Math.max(a.y, cy - 1); b.y = Math.max(b.y, cy - 1); c.y = Math.max(c.y, cy - 1);   // 밑면은 납작하게 눌러 닫는다(뭉게구름 밑면 — 면을 빼면 구멍이 보인다)
        n.subVectors(b, a).cross(c.clone().sub(a)); if (n.lengthSq() < 1e-6) continue; n.normalize();
        cc.copy(BOT).lerp(TOP, Math.min(1, Math.max(0, (n.y + 0.35) / 1.1)));
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); for (let q = 0; q < 3; q++) col.push(cc.r, cc.g, cc.b);
      }
    }
  }
  blob.dispose();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  m.frustumCulled = false; scene.add(m); return m;
})();
const CLOUD_TINT = { day: 0xffffff, sunset: 0xffc9a6, night: 0x34425a };
// 태극기 펄럭임: 깃대 쪽은 고정, 끝으로 갈수록 크게 흔들리고 살짝 처진다(정점 75개 — 매 프레임)
const flagBase = world.flag ? Float32Array.from(world.flag.geometry.attributes.position.array) : null;
let flagT = 0;
function skyTick(dt) {
  clouds.position.set(camera.position.x, 0, camera.position.z); clouds.rotation.y += dt * 0.004;
  skyDome.position.copy(camera.position);
  { const c = camera.position, BR = world.details.brect; let o = 1;   // GFX-3 리뷰: 카메라가 건물 칸 안(지붕 아래)이면 유리 반짝임 끔
    if (c.y < 9) for (let i = 0; i < BR.length; i++) { const r = BR[i]; if (c.x > r[0] && c.x < r[1] && c.z > r[2] && c.z < r[3]) { o = 0; break; } }
    if (GLASS_U.uOut.value !== o) { GLASS_U.uOut.value = o; glassApply(timeKey); } }
  if (!flagBase) return;
  flagT += dt; const P = world.flag.geometry.attributes.position, A = P.array;
  for (let i = 0; i < P.count; i++) { const x = flagBase[i*3], y = flagBase[i*3+1], u = (x + 0.7) / 1.4;
    A[i*3+2] = Math.sin(flagT * 3.4 - u * 5.2 + y * 0.9) * 0.11 * u + Math.sin(flagT * 1.3 - u * 2.1) * 0.04 * u;
    A[i*3+1] = y - 0.05 * u * u; }
  P.needsUpdate = true; world.flag.geometry.computeVertexNormals();
}
// 창 유리 시간대 색. 밤 '불 켜진 창' 빛은 밖에서 볼 때만 — 안(uOut 0)에서 내다보면 창이 주황 안개처럼 바깥을 덮어 낮처럼 보였다(GFX-3 리뷰) → 안에선 옅은 유리 그대로
function glassApply(k) {
  if (!world.glassMesh) return;
  const gmat = world.glassMesh.material, glow = GLASS_U.uOut.value > 0.5;
  gmat.emissive.setHex(!glow ? 0x000000 : k === 'night' ? 0xb08a3e : k === 'sunset' ? 0x3a2a14 : 0x000000); gmat.opacity = k === 'night' && glow ? 0.62 : 0.32;
  GLASS_U.uSkyRef.value.setHex(GLASS_SKY[k][0]); GLASS_U.uGndRef.value.setHex(GLASS_SKY[k][1]); GLASS_U.uFr.value = GLASS_SKY[k][2];
}
const GLASS_SKY = { day: [0x8fc3ea, 0x5d6b73, 0.6], sunset: [0xe9b995, 0x5e4a44, 0.55], night: [0x1c2a44, 0x0c1018, 0.22] };   // GFX-3: 유리에 비치는 [하늘, 땅, 세기]
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
  sun.color.setHex(t.sc); sun.intensity = t.si; sun.position.set(t.sp[0], t.sp[1], t.sp[2]).setLength(170);   // GFX-2: 그림자 카메라를 월드 밖으로(노을 해 98m 자리면 서쪽 끝이 그 뒤 — 방향은 같다)
  renderer.toneMappingExposure = t.exp;
  skyPaint(k);
  bakeShadows();
  stars.visible = k === 'night';
  clouds.material.color.setHex(CLOUD_TINT[k]);
  glassApply(k);
  timeBtn.textContent = t.label;
  MAP?.emit('time', k);
  return k;
}
timeBtn.addEventListener('click', e => { e.stopPropagation(); setTime(ORDER[(ORDER.indexOf(timeKey) + 1) % 3]); });
setTime('day');

// ---------- 현재 위치 표시 ----------
const locBox = document.getElementById('loc');
let locT = 0;
function updateLoc() {   // MAP-API-1: 가장 좁은 구역(겹쳐도 순서에 안 흔들림)·높이 띠(계단 참도 '계단')
  const Z = MAP ? MAP.zoneAt(P.x, P.y, P.z) : null;
  locBox.textContent = '📍 ' + (Z ? Z.label : '학교');
}

// ---------- 디테일 층 거리 컬링(DETAIL-1) ----------
// 작은 부재(책상 다리·눈·손 등)는 멀면 청크째 숨긴다 — 원경에서 픽셀보다 가는 부재가 반짝이는 것을 막고, 그리는 양도 준다.
// 16m 청크 중심 기준 + 반대각선(11.3m) 여유. 0.2초마다 한 번.
const DETAIL_FAR = 55, DETAIL_IN = 20, DETAIL_IN_IN = 30;   // INTERIOR-CULL: 실내 청크 = 카메라가 밖이면 20m·안이면 30m(+반대각선) — 벽 너머·창 너머 책상·사람을 멀리서 그리지 않는다
// ---------- 실내 가림 컬링(OCC-CULL · 09-24 integ) — 보이는 모습은 그대로, 벽·슬래브·지붕 뒤라 안 보이는 실내 청크만 뺀다 ----------
// 합친 뒤 급식 창고 앞 벽을 보는 화면이 17.4만 삼각형(벽 너머 본관·서관 교실 책상·사람까지 그림). 실내 청크(건물 × 층 × 16m 칸 — world.js dChunk)마다:
//  ① 같은 건물 다른 층 = 슬래브 너머 → 계단 곁(2m)이 아니면 숨김
//  ② 카메라에서 2D 광선 720개(0.5°)를 쏘아 '높은 벽 조각'(allBoxes wall · 높이 ≥ 2.4 — 창·문은 벽 조각이 없는 구멍이라 그대로 뚫림)에 닿는 거리·높이·방위 범위를 모은다.
//     청크 상자로 가는 광선 중 하나라도 앞의 벽이 그 선(카메라 높이 → 청크 높이 범위)을 다 막지 못하면 보인다(높이까지 따지므로 지붕 위 카메라는 벽을 넘겨 본다).
//     광선 사이도 본다(09-26 리뷰 — 걸으면 복도 끝 소화기가 깜빡): ⓐ 상자 양옆 테 광선(바깥 한 칸씩)까지 쏜다 — 광선 간격보다 좁게 보이는 청크는 지나는 광선이 없어 '가림'이 됐다.
//     ⓑ 이웃한 두 광선을 막은 벽들의 방위 범위가 그 사이(청크 방위 안)를 다 잇지 못하면 틈(창틀·기둥 옆 0.5°보다 좁은 틈)으로 보인다.
//        한 벽이 두 광선 사이를 잇는다고 치는 것은 두 광선 모두에서 그 선을 막을 때뿐(한쪽에선 청크 뒤로 가는 비스듬한 벽은 제 광선까지만).
//  ③ 건물 밖 카메라의 선이 그 동 지붕(1층 청크: 서관은 슬래브) 위로 들어가거나 2층 청크에 슬래브 아래로 들어가면 가림.
// 카메라가 0.15m 넘게 움직일 때만 다시 잰다(가만히 서서 돌리지 않으면 0 ms). 문을 돌아설 때 늦게 뜨지 않게 0.2초 간격과 따로 매 프레임 본다.
const OCC = { N: 720, R: 46, K: 6, hd: null, hy0: null, hy1: null, hl: null, hh: null, hw: null, hn: null, occ: null, planes: null, stairs: null, x: 1e9, y: 1e9, z: 1e9, ms: 0, off: false };
world.occ = OCC;   // 검사용(SD2.world.occ.off = true → 가림 컬링 끔: 켠 화면과 픽셀 비교해 '보이는 것을 숨긴 곳 0' 확인)
// PERF-LOAD(09-26): 최근 프레임 CPU(렌더 제외 — 물리·문·지도·하늘·디테일·위치 칩)와 가림 컬링 재계산 ms 고리 버퍼(매 프레임 할당 0) → SD2.timing이 읽을 때 백분위
const RB = { cpu: new Float32Array(240), occ: new Float32Array(120), ci: 0, oi: 0 };
const rbPct = (a, n, p) => { const m = Math.min(n, a.length); if (!m) return null; const s = Array.from(a.subarray(0, m)).sort((x, y) => x - y); return +s[Math.min(m - 1, Math.floor(p * m))].toFixed(3); };
function occPrep() {
  const W = world.allBoxes.filter(b => b.wall && b.y1 - b.y0 >= 2.4), BR = world.details.brect, FH0 = world.details.FH, NK = OCC.N * OCC.K;
  OCC.occ = W; OCC.hd = new Float32Array(NK); OCC.hy0 = new Float32Array(NK); OCC.hy1 = new Float32Array(NK); OCC.hn = new Uint8Array(OCC.N);
  OCC.hl = new Float32Array(NK); OCC.hh = new Float32Array(NK); OCC.hw = new Int32Array(NK);   // 벽 방위 범위(그 광선 기준, 광선 단위 hl ≤ 0 ≤ hh)·벽 번호
  OCC.rs = new Uint32Array(OCC.N); OCC.nd = new Uint8Array(OCC.N);   // PERF-LOAD: 광선마다 잰 재계산 번호(gen) · 이번에 잴 광선
  OCC.cs = new Float64Array(OCC.N); OCC.sn = new Float64Array(OCC.N);   // PERF-LOAD: 광선 방향 cos·sin 표(같은 식 kk·DA로 한 번만 — 값이 같다)
  for (let k = 0; k < OCC.N; k++) { const th = k * (Math.PI * 2 / OCC.N); OCC.cs[k] = Math.cos(th); OCC.sn[k] = Math.sin(th); }
  OCC.wb = new Float64Array(W.length * 6); W.forEach((w, i) => OCC.wb.set([w.x0, w.x1, w.z0, w.z1, w.y0, w.y1], i * 6));   // PERF-LOAD: 벽 좌표를 한 줄 배열로(같은 값 · 캐시에 붙어 있게)
  OCC.stairs = world.zones.filter(z => z.kind === 'stair' || (z.kind == null && /계단/.test(z.label) && !/창고/.test(z.label)));
  // 동마다 가로 가림판(③): 지붕·슬래브. 동 바닥 격자(1.5m) 모든 칸에서 충돌 상자(부풀림 없음)가 빈틈없이 덮는 높이 구간(0.05m 단위)만 가림판으로 쓴다 —
  //  한 칸이라도 뚫려 있으면 그 높이는 판이 아니다(보수적). 서관은 계단 칸을 빼고 재고 그 칸을 모든 판의 구멍으로 둔다.
  const C = world.colliders, G = world.grid;
  const inStair = (x, z, e = 0.6) => OCC.stairs.some(q => x > q.x0 - e && x < q.x1 + e && z > q.z0 - e && z < q.z1 + e);
  const bands = (r, hole) => { const HN = 260, cov = new Uint16Array(HN); let n = 0;   // 높이 2.2 + 0.05·k
    for (let x = r[0] + 0.6; x < r[1] - 0.3; x += 1.5) for (let z = r[2] + 0.6; z < r[3] - 0.3; z += 1.5) { if (hole && inStair(x, z)) continue; n++;
      const hit = new Uint8Array(HN), cell = G.get(Math.floor(x / 8) + ':' + Math.floor(z / 8)) || [];
      for (const k of cell) { const b = C[k]; if (x < b.x0 - 0.02 || x > b.x1 + 0.02 || z < b.z0 - 0.02 || z > b.z1 + 0.02 || b.y1 < 2.2) continue;
        for (let h = Math.max(0, Math.ceil((b.y0 - 2.2) / 0.05)); h < HN && 2.2 + h * 0.05 <= b.y1; h++) hit[h] = 1; }
      for (let h = 0; h < HN; h++) cov[h] += hit[h]; }
    const L = []; for (let h = 0; h < HN; h++) if (n && cov[h] === n) { const b0 = 2.2 + h * 0.05; while (h + 1 < HN && cov[h + 1] === n) h++; L.push({ b: [b0, 2.2 + h * 0.05], hole }); }
    return L; };
  OCC.planes = BR.map((r, i) => bands(r, i === world.details.wing));
}
// 광선(ox,oz)+(dx,dz)t 와 상자 [x0,x1]×[z0,z1] — 들어가는 t(없으면 -1)·나오는 t를 _sl에
const _sl = [0, 0];
function slab(ox, oz, dx, dz, x0, x1, z0, z1) {
  let t0 = -1e9, t1 = 1e9;
  if (Math.abs(dx) < 1e-9) { if (ox < x0 || ox > x1) return false; } else { let a = (x0 - ox) / dx, b = (x1 - ox) / dx; if (a > b) { const s = a; a = b; b = s; } if (a > t0) t0 = a; if (b < t1) t1 = b; }
  if (Math.abs(dz) < 1e-9) { if (oz < z0 || oz > z1) return false; } else { let a = (z0 - oz) / dz, b = (z1 - oz) / dz; if (a > b) { const s = a; a = b; b = s; } if (a > t0) t0 = a; if (b < t1) t1 = b; }
  if (t0 > t1 || t1 < 0) return false; _sl[0] = Math.max(0, t0); _sl[1] = t1; return true;
}
// 상자가 카메라에서 차지하는 방위 범위: 광선 번호 단위 소수 _af[0] ≤ _af[1](감지 않음) · 쏠 광선 번호 [_as[0], _as[1]](넘치면 N으로 감음) — 매 갱신 수백 번이라 배열을 만들지 않는다
//  벽(occRays) = 상자를 지나는 광선만 · 청크(outer) = 양옆 테 광선(바닥·천장 내림)까지 — 청크 방위 전체가 이웃 광선 쌍 사이에 든다
const _as = [0, 0], _af = [0, 0];
function angSpan(cx, cz, x0, x1, z0, z1, outer) {
  const DA = Math.PI * 2 / OCC.N, a0 = Math.atan2((z0 + z1) / 2 - cz, (x0 + x1) / 2 - cx); let lo = 0, hi = 0;
  for (let c = 0; c < 4; c++) { let d = Math.atan2((c & 2 ? z1 : z0) - cz, (c & 1 ? x1 : x0) - cx) - a0; if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2; if (d < lo) lo = d; if (d > hi) hi = d; }
  const A = (a0 + lo) / DA, B = (a0 + hi) / DA; _af[0] = A; _af[1] = B;
  if (outer) { _as[0] = Math.floor(A); _as[1] = Math.ceil(B); return; }
  let k0 = Math.ceil(A), k1 = Math.floor(B); if (k1 < k0) k0 = k1 = Math.round(a0 / DA); _as[0] = k0; _as[1] = k1;
}
// 광선마다 가까운 높은 벽 K개(거리·높이 범위·방위 범위·벽 번호). nd = 이 광선만 잰다(PERF-LOAD — 목록은 부른 쪽이 비움 · 벽을 번호 순으로 넣으니 전부 잰 것과 같다)
function occRays(cp, nd) {
  const { N, R, K, hd, hy0, hy1, hl, hh, hw, hn, cs, sn, wb } = OCC, px = cp.x, pz = cp.z; if (!nd) hn.fill(0);
  for (let i = 0, wi = 0; i < wb.length; i += 6, wi++) { const x0 = wb[i], x1 = wb[i + 1], z0 = wb[i + 2], z1 = wb[i + 3];
    if (x1 < px - R || x0 > px + R || z1 < pz - R || z0 > pz + R) continue;
    if (px > x0 && px < x1 && pz > z0 && pz < z1) continue;   // 카메라가 벽 속(없어야 하지만)
    angSpan(px, pz, x0, x1, z0, z1); const A = _af[0], B = _af[1];
    for (let k = _as[0], k1 = _as[1]; k <= k1; k++) { const kk = ((k % N) + N) % N; if (nd && !nd[kk]) continue;
      if (!slab(px, pz, cs[kk], sn[kk], x0, x1, z0, z1) || _sl[0] > R) continue;
      const t = _sl[0], base = kk * K; let n = hn[kk], j = n;
      if (n === K) { if (t >= hd[base + K - 1]) continue; j = K - 1; } else hn[kk] = n + 1;
      while (j > 0 && hd[base + j - 1] > t) { const s = base + j - 1; hd[s + 1] = hd[s]; hy0[s + 1] = hy0[s]; hy1[s + 1] = hy1[s]; hl[s + 1] = hl[s]; hh[s + 1] = hh[s]; hw[s + 1] = hw[s]; j--; }
      hd[base + j] = t; hy0[base + j] = wb[i + 4]; hy1[base + j] = wb[i + 5]; hl[base + j] = Math.min(0, A - k); hh[base + j] = Math.max(0, B - k); hw[base + j] = wi; }
  }
}
// ③·② 한 선(카메라 → 광선 위 거리 t·높이 ty)을 막는 것: 벽 칸 묶음(비트 j = 광선의 j번째 벽, K ≤ 7) | 128(가림판 — 그 동 안에서 선 높이가 띠를 지남, 서관 슬래브의 계단 구멍 제외) · 0 = 안 막힘
const _fa = new Float32Array(9), _fb = new Float32Array(9);
let _rrP = false;   // PERF-LOAD: 이 광선의 동 사각형 교차(_fa·_fb)를 아직 안 잼 — 벽이 선을 못 막을 때만 잰다(대부분 첫 벽이 막아 9번 slab을 건너뜀 · 결과 같음)
function rayRects(cp, dx, dz) { const BR = world.details.brect; for (let i = 0; i < BR.length; i++) { const r = BR[i]; if (OCC.planes[i].length && slab(cp.x, cp.z, dx, dz, r[0], r[1], r[2], r[3])) { _fa[i] = _sl[0]; _fb[i] = _sl[1]; } else _fa[i] = -1; } }
function stairHole(ox, oz, dx, dz, L) { for (const q of OCC.stairs) if (slab(ox, oz, dx, dz, q.x0, q.x1, q.z0, q.z1) && _sl[0] <= L) return true; return false; }   // 선 조각이 계단 구멍을 지나나(PERF-LOAD: some(닫힘) → 고리 — 같은 판정)
function lineMask(cp, base, n, dx, dz, t, ty) {
  const { hd, hy0, hy1, hl, hh } = OCC, hc = cp.y, g = (ty - hc) / Math.max(t, 1e-3); let m = 0, lo = 0, hi = 0;
  for (let j = 0; j < n; j++) { const d = hd[base + j]; if (d >= t) break; const h = hc + g * d;
    if (h >= hy0[base + j] - 0.02 && h <= hy1[base + j] + 0.02) { m |= 1 << j; if (hl[base + j] < lo) lo = hl[base + j]; if (hh[base + j] > hi) hi = hh[base + j]; } }
  if (m && lo <= -1 && hi >= 1) return m;   // 막은 벽이 양옆 이웃 광선까지 닿음 — 가림판까지 볼 것 없다(틈 판정은 벽으로 충분)
  if (_rrP) { _rrP = false; rayRects(cp, dx, dz); }   // PERF-LOAD: 가림판이 필요한 첫 선에서만 이 광선의 동 사각형 교차를 잰다(광선마다 한 번 — 같은 값)
  for (let i = 0; i < 9; i++) { if (_fa[i] < 0) continue; const a = _fa[i], b = Math.min(_fb[i], t); if (b <= a) continue;
    for (const p of OCC.planes[i]) { const p0 = p.b[0], p1 = p.b[1]; let sa = a, sb = b;   // 선 높이가 [p0, p1]인 구간
      if (Math.abs(g) < 1e-6) { if (hc < p0 || hc > p1) continue; } else { let u = (p0 - hc) / g, v = (p1 - hc) / g; if (u > v) { const w = u; u = v; v = w; } sa = Math.max(a, u); sb = Math.min(b, v); if (sb < sa) continue; }
      if (p.hole && stairHole(cp.x + dx * sa, cp.z + dz * sa, dx, dz, sb - sa)) continue;
      return m | 128; } }
  return m;
}
// ⓑ 앞 광선(k−1: 벽 칸 pb·묶음 pm)과 이 광선(k: cb·cm) 사이, 청크 방위 [A, B] 안에 두 광선의 막은 벽들이 못 덮은 틈이 있나(가림판 묶음은 부르지 않는다 — 판은 이어져 있다)
//  앞 광선 벽이 k까지 뻗어도 k에서 이 선을 막지 않으면(청크 뒤로 감) 제 광선까지만 친다 · 이 광선 쪽도 같은 식
function occGap(pb, pm, cb, cm, k, A, B) {
  const { hl, hh, hw, K } = OCC; let R = k - 1, L = k;
  for (let j = 0; j < K; j++) { if (!(pm >> j & 1)) continue; const e = k - 1 + hh[pb + j];
    if (e < k) { if (e > R) R = e; continue; }
    const w = hw[pb + j]; for (let i = 0; i < K; i++) if ((cm >> i & 1) && hw[cb + i] === w) return false; }   // 같은 벽이 두 광선에서 다 막음 = 사이도 막힘
  for (let i = 0; i < K; i++) { if (!(cm >> i & 1)) continue; const s = k + hl[cb + i]; if (s > k - 1 && s < L) L = s; }
  return R < L - 0.02 && Math.max(R, A) < Math.min(L, B);
}
const _pm = new Uint8Array(9), _cm = new Uint8Array(9);   // 선 9개마다 앞 광선·이 광선의 막음 묶음
// 청크가 이 자리(cp)에서 보이나. pre = 광선 없이 정해지면 그 값, 광선이 필요하면 -1(PERF-LOAD — 부른 쪽이 이 청크가 쓰는 광선 = angSpan(outer) 범위를 먼저 잰다)
function occVisible(d, cp, pre) {
  const bx = d.box, BR = world.details.brect[d.bi];
  const x0 = bx.min.x, x1 = bx.max.x, z0 = bx.min.z, z1 = bx.max.z, y0 = bx.min.y, y1 = bx.max.y;
  const inB = cp.x > BR[0] && cp.x < BR[1] && cp.z > BR[2] && cp.z < BR[3];
  const FH0 = world.details.FH, slabOK = d.fl === 1 ? y1 <= FH0 + 0.35 : y0 >= FH0 - 0.05;   // 두 층에 걸친 청크(계단)는 ①을 안 씀
  if (inB && slabOK && d.bi === world.details.wing) { const camFl = cp.y > FH0 + 0.15 ? 2 : 1;   // ① 슬래브
    if (camFl !== d.fl && !OCC.stairs.some(z => cp.x > z.x0 - 2 && cp.x < z.x1 + 2 && cp.z > z.z0 - 2 && cp.z < z.z1 + 2)) return false; }
  if (cp.x >= x0 && cp.x <= x1 && cp.z >= z0 && cp.z <= z1) return true;
  if (pre) return -1;
  const { N, K, hn, cs, sn } = OCC; angSpan(cp.x, cp.z, x0, x1, z0, z1, true); const A = _af[0], B = _af[1];
  let prev = false, pb = 0;
  for (let k = _as[0], k1 = _as[1]; k <= k1; k++) { const kk = ((k % N) + N) % N, dx = cs[kk], dz = sn[kk], cb = kk * K;
    let tE, tX;
    if (slab(cp.x, cp.z, dx, dz, x0, x1, z0, z1)) { tE = _sl[0]; tX = _sl[1]; }
    else {   // 테 광선(상자 옆을 스침): 상자 네 모서리를 광선에 내린 거리 범위를 청크 거리로 본다
      tE = 1e9; tX = -1e9; for (let c = 0; c < 4; c++) { const t = ((c & 1 ? x1 : x0) - cp.x) * dx + ((c & 2 ? z1 : z0) - cp.z) * dz; if (t < tE) tE = t; if (t > tX) tX = t; }
      if (tX <= 0) { prev = false; continue; } tE = Math.max(0, tE); }
    _rrP = true;   // 동 사각형 교차(rayRects)는 가림판이 필요한 선에서 처음 잰다(lineMask)
    // 청크의 광선 위 조각을 3×3 선(거리 tE·가운데·tX × 높이 y0·가운데·y1)으로 — 하나라도 안 막히거나 앞 광선과의 사이에 틈이 있으면 보임
    for (let q = 0; q < 9; q++) { const t = q % 3 === 0 ? tE : q % 3 === 1 ? (tE + tX) / 2 : tX, ty = q < 3 ? y0 : q < 6 ? (y0 + y1) / 2 : y1;
      const m = lineMask(cp, cb, hn[kk], dx, dz, t, ty); if (!m) return true;
      if (prev && !((m | _pm[q]) & 128) && occGap(pb, _pm[q], cb, m, k, A, B)) return true;
      _cm[q] = m; }
    _pm.set(_cm); pb = cb; prev = true;
  }
  return false;
}
let detailT = 1;
const _fr = new THREE.Frustum(), _fm = new THREE.Matrix4(), _pd = [];
function detailTick(dt) {
  detailT += dt;
  const cp = camera.position, moved = Math.abs(cp.x - OCC.x) + Math.abs(cp.y - OCC.y) + Math.abs(cp.z - OCC.z) > 0.15;
  let t0 = performance.now(), occW = false, prep = false;
  if (detailT >= 0.2 || moved) { detailT = 0;
    const camIn = ceilAt(cp.x, cp.z, cp.y - 0.3, cp.y + 4.5) !== null;
    const R = (DETAIL_FAR + 11.3) ** 2, RI = ((camIn ? DETAIL_IN_IN : DETAIL_IN) + 11.3) ** 2;
    if (!OCC.occ) { const tp = performance.now(); occPrep(); prep = true; TIMING.occPrepMs = performance.now() - tp; t0 += TIMING.occPrepMs; }   // 한 번뿐인 준비는 OCC.ms·occP95 고리에서 뺀다
    // PERF-LOAD(09-26): 가림 판정(광선)은 절두체에 든 청크만, 처음 필요한 프레임에 — 판정 자리는 이 재계산 자리(OCC.x·y·z)라 예전(전부 여기서)과 결과가 같다.
    //  돌아서기만 하면(재계산 없이) 새로 들어온 청크를 그 프레임에 같은 자리로 잰다. 광선도 그 청크들이 쓰는 것만(occRays nd) — 테 광선·이웃 광선 쌍(occGap)까지(angSpan outer).
    //  동일성(occ_merge 09-26) = integ 판(전부 여기서 재던 것)과 경로 3개·제자리 회전 6,269프레임 보이는 청크 집합 같음
    OCC.gen = (OCC.gen || 0) + 1; OCC.x = cp.x; OCC.y = cp.y; OCC.z = cp.z; occW = true;
    for (const d of world.details) {
      const dx = cp.x - d.cx, dz = cp.z - d.cz;
      d.on = dx * dx + dz * dz < (d.inside ? RI : R);   // d.on = 이 재계산 자리에서 그릴 후보(거리 안) — 절두체에 들어와 가림 판정을 받으면 그 결과로 덮어쓴다(d.pend = 판정을 기다리는 재계산 번호)
      d.pend = d.on && d.inside && !OCC.off && d.box && d.bi != null ? OCC.gen : 0;   // 상자·건물 칸이 없는 항목(main.js가 넣는 필름 문 등)은 거리만
    }
  }
  // 절두체는 매 프레임 상자(AABB)로 — three의 경계 구는 길쭉한 청크(교실 줄)에선 카메라 뒤 옆 교실까지 품는다. 정적 청크(world.js st)도 같이(상자 밖이면 그릴 것이 0이라 모습 그대로)
  camera.updateMatrixWorld(); _fr.setFromProjectionMatrix(_fm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  _pd.length = 0;
  for (const d of world.details) { const v = d.on && (!d.box || _fr.intersectsBox(d.box)); if (v && d.pend === OCC.gen) _pd.push(d); else d.mesh.visible = v; }
  if (_pd.length) { occW = true;   // 이 청크들이 쓰는 광선 중 이 자리로 아직 안 잰 것만 잰다(광선 목록은 자리마다 한 번)
    const { N, rs, nd, hn } = OCC; let any = false;
    for (const d of _pd) { const r = occVisible(d, OCC, true); if (r !== -1) { d.mesh.visible = d.on = r; d.pend = 0; continue; }   // 슬래브 너머·카메라가 청크 안 = 광선 없이
      const b = d.box; angSpan(OCC.x, OCC.z, b.min.x, b.max.x, b.min.z, b.max.z, true);   // occVisible과 같은 범위(테 광선까지 — occGap이 앞 광선 벽 목록도 읽는다)
      for (let k = _as[0]; k <= _as[1]; k++) { const kk = ((k % N) + N) % N; if (rs[kk] !== OCC.gen) { rs[kk] = OCC.gen; nd[kk] = 1; hn[kk] = 0; any = true; } } }
    if (any) { occRays(OCC, nd); nd.fill(0); }
    for (const d of _pd) if (d.pend) { d.mesh.visible = d.on = occVisible(d, OCC); d.pend = 0; } }
  if (occW) { OCC.ms = performance.now() - t0; if (!prep) RB.occ[RB.oi++ % RB.occ.length] = OCC.ms; }
  if (!OCC.st) { OCC.st = []; scene.traverse(o => { if (o.userData.st) OCC.st.push(o); }); }
  for (const m of OCC.st) m.visible = _fr.intersectsBox(m.geometry.boundingBox);
}

// ---------- 지도 API(MAP-API-1 · 09-24) — 게임이 받는 지도 계약. 정본 docs/map_api.md ----------
MAP = createMapApi({ THREE, scene, camera, renderer, world, SCHOOL,
  q: { groundAt, blockedAt, ceilAt, segHit: camHit },
  pl: { P, ACT, CTRL, keys, getYaw: () => camYaw, setYaw: v => { camYaw = v; } },
  ui: { toast, hint: hintEl, tone }, hot: HOT }, NAV, makeMeta(SCHOOL));   // tone = 게임 효과음(GAME-FIND-1 map.sfx)

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
  MAP.tick(dt);   // 구역·트리거·경계 10Hz + 게임 tick(게임 몫 ms는 MAP.game.lastMs)
  simMs = Math.max(simMs, performance.now() - t0);
  skyTick(dt);
  detailTick(dt);
  const tR0 = performance.now();
  renderer.render(scene, camera);
  const tR1 = performance.now();
  acc += dt; n++;
  locT += dt;
  if (locT > 0.4) { locT = 0; updateLoc(); }
  RB.cpu[RB.ci++ % RB.cpu.length] = (tR0 - t0) + (performance.now() - tR1);   // PERF-LOAD: 프레임 CPU(렌더 제외)
  if (acc > 1) {
    const fps = Math.round(n / acc);
    const dc = renderer.info.render.calls;
    fpsBox.textContent = fps + ' fps · ' + dc + ' dc · sim ' + simMs.toFixed(2) + 'ms' + (MAP.game.current ? ' · game ' + MAP.game.lastMs.toFixed(2) + 'ms' : '');
    if (dc > 300) console.warn('예산 초과: drawCalls', dc);
    if (simMs > 1) console.warn('예산 초과: sim ms', simMs.toFixed(2));
    acc = 0; n = 0; simMs = 0;
  }
}
loop();
TIMING.firstFrameMs = performance.now();   // 첫 프레임(페이지 시작부터 ms) — 그 뒤 로딩 막을 걷는다
document.getElementById('boot')?.remove();
warmDone();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- 도달성 검사 (전 실 자동 답사) ----------
// 플레이어와 똑같은 규칙(blockedAt·groundAt·오름 0.55)으로 걸을 수 있는 칸을 전부 채워보고,
// 등록된 모든 구역에 실제로 닿는지 판정한다. "문이 있다"가 아니라 "도달된다"가 기준.
// MAP-API-1(09-24): 칸 채우기는 길격자(nav.js)가 한다 = 게임 길찾기와 같은 칸(단일 출처). 부를 때마다 새로 짓는다(캐시 갱신).
//   격자 0.3m: 계단 단 깊이(0.72)보다 촘촘해야 한 칸 이동이 한 단을 넘지 않는다(0.5는 두 단을 건너뛰어 오탐)
//   구역 판정 = MAP.inZone(반열린 구간 + 높이 띠) — 구역 안 칸이 하나라도 닿으면 통과
function reach(opt = {}) {
  const NV = MAP.navSync({ jump: !!opt.jump, fresh: true }), N = NV.raw, S = N.S;
  const zs = world.zones, bad = [], ok = [];
  if (!opt.jump) {   // 점프 모드는 옥상 검사 전용(점프 중엔 낮은 문틀도 막힘으로 쳐서 구역 결과가 의미 없다)
    const hit = new Uint8Array(zs.length);
    for (let i = 0; i < N.count; i++) { const x = N.X(i), z = N.Z(i), y = N.y[i]; for (let k = 0; k < zs.length; k++) if (!hit[k] && MAP.inZone(zs[k], x, y, z)) hit[k] = 1; }
    zs.forEach((Z, k) => (hit[k] ? ok : bad).push(Z.label));
  }
  // 옥상 도달 검사(사용자 07-30 "어디를 밟고 옥상에 올라가는 버그"): 2층(서관) 밖에서 3m 넘게 올라간 칸
  let roof = 0; const roofAt = [], U = world.UPPER;   // 2층(서관)만 3m 위가 정상
  for (let i = 0; i < N.count; i++) {
    const y = Math.round(N.y[i] * 2) / 2, x = N.X(i), z = N.Z(i);
    if (y > 3.0 && !(x > U[0] - 0.2 && x < U[1] + 0.2 && z > U[2] - 0.2 && z < U[3] + 0.2)) { roof++; if (roofAt.length < 5) roofAt.push([+x.toFixed(1), +z.toFixed(1), y]); }
  }
  if (roof) bad.push('옥상 도달 ' + roof + '칸 ' + JSON.stringify(roofAt));
  if (opt.probe) {                       // 진단: 지정 구간에서 도달한 최고 지점
    const [px0, px1, pz0, pz1] = opt.probe;
    let top = -99, at = null;
    for (let i = 0; i < N.count; i++) { const x = N.X(i), z = N.Z(i), y = Math.round(N.y[i] * 2) / 2; if (x >= px0 && x <= px1 && z >= pz0 && z <= pz1 && y > top) { top = y; at = [x, z, y]; } }
    console.log('probe 최고 도달: ' + JSON.stringify(at));
    return { cells: N.count, ok, bad, probe: at };
  }
  if (bad.length) console.error('🚫 도달 불가 ' + bad.length + '곳: ' + bad.join(', '));
  else console.log(opt.jump ? '✅ 점프로 옥상 도달 0' : '✅ 도달성: 전 구역 ' + ok.length + '곳 통과 (칸 ' + N.count + ')');
  const res = { cells: N.count, ok, bad }; if (opt.keep) res.nav = NV; return res;
}

// ?check=1 이면 로드 직후 자동 답사(검증용 URL — 학생 접속엔 부담 주지 않도록 기본 꺼둠)
//   MAP-API-1: + 지도 계약(구역표·출발점·지점·상호작용 도달·갇힘 칸) + 맵 건강 검진 빠른 판(health.js — ?check=1/?health=1일 때만 불러옴)
if (location.search.includes('check=1')) setTimeout(() => { reach(); reach({ jump: true }); doorCheck(); MAP.check(); window.SD2.health({ quick: true }).catch(e => console.error('🩺 검진 실패', e)); }, 60);   // 두 번째 = 점프로 옥상에 오르는지
else if (location.search.includes('health=1')) setTimeout(() => window.SD2.health({ img: true }).then(r => console.log('🩺', JSON.stringify(r.counts))), 60);

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
  step(nn = 1, keyList = []) { keyList.forEach(k => keys.add(k)); for (let i = 0; i < nn; i++) { step(1/60); doorTick(1/60); hotTick(1/60); MAP.tick(1/60); } keyList.forEach(k => keys.delete(k)); detailTick(1); renderer.render(scene, camera); },
  doors: () => DOORS.length, doorCheck,
  near: () => hotNear && hotNear.label, act: () => hotNear && act(hotNear),
  // MAP-API-1: 지도 API · 물리 함수(검진·게임과 같은 식) · 맵 건강 검진(health.js 지연 로드 — Promise)
  map: MAP, phys: { groundAt, blockedAt, ceilAt, camHit }, ACT, CTRL, camPose: (...a) => ({ ...camPose(...a) }),
  health: opt => import('./health.js?v=5').then(m => m.runHealth(window.SD2, opt || {})),
  // PERF-LOAD(09-26): 로드·프레임 계측 — buildMs·firstFrameMs(ms) · 최근 240프레임 CPU p50/p95(렌더 제외) · 가림 컬링 재계산 p95. reset() 뒤 걸어 보고 읽는다
  timing: Object.defineProperties(TIMING, {
    frameCpuP50: { get: () => rbPct(RB.cpu, RB.ci, 0.5), enumerable: true }, frameCpuP95: { get: () => rbPct(RB.cpu, RB.ci, 0.95), enumerable: true },
    occP95: { get: () => rbPct(RB.occ, RB.oi, 0.95), enumerable: true }, reset: { value: () => { RB.ci = RB.oi = 0; } } }),
};
// 게임 로더(MAP-API-1): ?game=이름 → v2/games/registry.js 허용 목록 → export default start(map) (사진 대조 모드에선 안 켠다)
{ const GAME = new URLSearchParams(location.search).get('game'); if (GAME && !SHOT) MAP.game.load(GAME, Object.fromEntries(new URLSearchParams(location.search))); }
