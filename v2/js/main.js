// v2 부트 — 헌법⑤⑥: 정수 해상도만 · AABB 충돌만 · 매초 예산 계측
import * as THREE from 'three';
import { buildKid } from './kid.js?v=5';   // CHAR-2 내 캐릭터(치비·노란 모자)
import { buildWorld } from './world.js?v=126';   // ⚠️world.js를 고치면 이 숫자도 올린다(안 올리면 옛 월드로 검증하게 된다)
import { SCHOOL } from './layout.js?v=11';   // LAYOUT-3 실측 배치(v1 data.js 대신)
import * as NAV from './nav.js?v=7';               // MAP-API-1: 길격자·길찾기(도달성 게이트와 단일 출처)
import { makeMeta } from './mapmeta.js?v=8';       // MAP-API-1: 구역 계약표·출발점·표지점
import { createMapApi } from './mapapi.js?v=21';    // MAP-API-1: 게임용 지도 API(SD2.map) — 정본 docs/map_api.md
import { createTouch, touchPrimary } from './touch.js?v=7';   // TOUCH-1(09-26): 휴대폰·태블릿 조작(조이스틱·시점 드래그·점프/행동 버튼)
import { createTitle } from './title.js?v=2';   // TITLE-1(09-27): 오프닝 화면·놀이 고르기(주소에 ?game·?tour·?shot·?check·?health·?title=0이 없을 때만)
import { createActions } from './actions.js?v=1';   // ACTION-1(09-28 아이 "상호작용이 말만 되고 보이지 않는다"): 보이는 행동(자세·손 소품·물줄기·알갱이) + 버스 접이문 — 정본 docs/map_api.md §19

// TITLE-1: 오프닝을 켤지 — 게이트(?check=1)·검진(?health=1)·사진 대조(?shot)·게임 주소(?game·?tour=1)는 예전 그대로(오프닝 없음). index.html 로딩 막도 같은 규칙
const QS0 = new URLSearchParams(location.search);
const TITLE_ON = !QS0.get('shot') && !QS0.get('game') && QS0.get('tour') !== '1' && !location.search.includes('check=1') && !location.search.includes('health=1') && QS0.get('title') !== '0';
const bootP = (p, s) => { if (TITLE_ON && window.bootP) window.bootP(p, s); };   // 로딩 막대(index.html) — 진짜 단계: 모듈 받음 → 월드 짓기(지난 빌드 시간만큼 차오름) → 첫 프레임
let CAM_OVR = null;   // TITLE-1: 카메라 고리(오프닝 한 바퀴·날아오기) — step()이 평소 카메라를 정한 뒤 부른다(평소 자리 = 날아오기 목표)
bootP(0.3, 0.4);

const canvas = document.getElementById('scene');
// PERF-WIN(09-28 교사 "맥북은 괜찮은데 학교 윈도우 컴에서 화면 돌리거나 키가 잔잔하게 씹힘"): 약한 내장 그래픽(UHD 6xx·셀러론) + 윈도 배율 125~150%.
//  antialias(MSAA)는 컨텍스트를 만들 때만 정할 수 있어(도중에 못 바꿈) 켠 채로 둔다 — 자동 해상도가 배율을 1 아래로 내렸을 때 계단을 가려 주는 쪽이 이득이다(FXAA 같은 후처리 패스는 더하지 않는다).
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// PERF-WIN: 셰이더 오류 검사(getShaderInfoLog·getProgramInfoLog)는 컴파일이 끝날 때까지 주 스레드를 세운다(점검 실측 300~800ms) — 배포판은 끄고 ?debug=1·?check=1에서만 켠다
renderer.debug.checkShaderErrors = /[?&](debug|check)=1/.test(location.search);
// TOUCH-1 휴대폰 성능 판(09-26): 터치가 주 입력이거나 작은 화면(짧은 변 ≤500)이면 mobile — 픽셀 비율 ≤1.5 · 그림자 지도 1024.
//  저사양(메모리 ≤3GB 또는 코어 ≤3 — 알려 주는 브라우저만)이면 low — 픽셀 비율 ≤1.25 · 그림자 끔. 나머지(나무·디테일·안개·유리)는 같다.
//  ?hq=1 = 데스크톱 품질 강제(자동 해상도 끔 · 배율 ≤2) · ?lq=1 = low 강제(시험용). 고른 값 = SD2.gfx
//  PERF-WIN: 데스크톱은 배율 1.5에서 시작(예전 2) — 여유가 뚜렷하면(8.3ms 120Hz 맥 등) 자동 해상도가 기기 배율(≤2)까지 올린다 = 강한 기기 모습 그대로.
//   dpr = 지금 배율(자동 해상도가 바꾼다) · cap = 올라갈 수 있는 끝 · start = 시작 배율 · floor = 가장 낮은 배율
const GFX = (() => { const q = new URLSearchParams(location.search), hq = q.get('hq') === '1', lq = q.get('lq') === '1', dev = window.devicePixelRatio || 1;
  const mobile = !hq && (lq || touchPrimary() || Math.min(screen.width || 9999, screen.height || 9999) <= 500);
  const low = !hq && (lq || (mobile && ((navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 3))));
  const cap = Math.min(dev, low ? 1.25 : mobile ? 1.5 : 2), start = hq ? cap : Math.min(cap, 1.5), fix = +q.get('dpr') || 0;   // ?dpr=0.75 = 배율 고정(시험용)
  // 자동 해상도는 게이트·검진·사진 대조·?hq=1·?dpr=·?adapt=0에서 끈다(같은 화면을 다시 재야 하는 주소) · 휴대폰·저사양 판(mobile·low)도 끈다(리뷰 — 휴대폰 판은 예전 그대로)
  const adapt = !hq && !fix && !mobile && q.get('adapt') !== '0' && !/[?&](check|health)=1/.test(location.search) && !q.get('shot');
  return { mode: low ? 'low' : mobile ? 'mobile' : 'desktop', dpr: fix || start, cap: fix || cap, start: fix || start, floor: fix || Math.min(start, 0.6), shadow: low ? 0 : mobile ? 1024 : 2048, adapt, dev }; })();
const DPR = GFX.dpr;
renderer.setPixelRatio(DPR);                       // 네이티브(비정수 업스케일 금지) — 휴대폰은 GFX 상한 · PERF-WIN 자동 해상도가 바꾼다(ADAPT)
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = GFX.shadow > 0;
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
sun.shadow.mapSize.set(GFX.shadow || 1024, GFX.shadow || 1024);
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 95, bottom: -95, near: 20, far: 340 }); sun.shadow.camera.updateProjectionMatrix();   // GFX-2: 해는 원점에서 170m(setTime) · 투영 행렬을 다시 만들어야 범위가 먹는다(예전엔 기본 ±5m 그대로였다)
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun);

// PERF-LOAD(09-26): 로딩 막(index.html #boot)이 한 번 칠해진 뒤 월드를 짓는다 — buildWorld는 동기라 그동안 화면이 멈춘다(최상위 await — 모듈).
//  배경 탭(rAF 멈춤)이면 0.1초 뒤 그냥 짓는다. 잰 값은 SD2.timing(buildMs·firstFrameMs·frameCpuP50/P95·occP95 — 아래 RB)
{ let bm = 2600; try { bm = +localStorage.getItem('sm2.title.buildMs') || bm; } catch (e) { /* */ } bootP(0.92, Math.min(15, bm * 1.15 / 1000)); }   // TITLE-1: 짓는 동안(주 스레드가 멈춤) 막대는 합성기에서 찬다
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
if (TITLE_ON) { bootP(0.95, 0.2); try { localStorage.setItem('sm2.title.buildMs', Math.round(TIMING.buildMs)); } catch (e) { /* */ } }   // 다음 로딩 막대 속도(한 번만 씀)
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
const P = { x: 12.4, y: world.terrainAt(12.4, -6) + 0.01, z: -6, vy: 0, yaw: 0, ground: true, bh: 1.5, spd: 0 };   // ENGINE-1: bh = 몸 높이(웅크리면 0.8 — 게임이 켰을 때만) · spd = 수평 속도(소리 판정)   // 운동장에서 구령대·본관을 보며 시작
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
  const v = Math.hypot(P.x - kidX, P.z - kidZ) / Math.max(dt, 1e-3) * (4.2 / PHY.walk); kidX = P.x; kidZ = P.z; kidT += dt;   // SHRINK-1: 작아지면 걷기 속도 기준으로(다리 흔들기 같게)
  const K = KID, sit = !!ACT.sit, air = !P.ground && !sit && !ACT.anim, mv = sit ? 0 : Math.min(1, v / 4.2), cr = CTRL.crouched && !sit;
  if (v > 0.3 && !sit) kidPh += dt * (5.5 + v * 1.5);
  const sw = Math.sin(kidPh) * 0.7 * mv;
  K.rig.position.set(0, sit ? K.sitY : cr ? -0.17 : Math.abs(Math.sin(kidPh)) * 0.04 * mv, sit && !ACT.sit.seat ? 0.42 : 0);   // ACTION-1: 좌석 앉기는 pg가 이미 좌석 위   // sitY = 의자 앉는 판(0.46)에 엉덩이 · ENGINE-1 웅크림 = 0.17 낮게
  K.rig.rotation.x = cr ? 0.28 : 0;   // 웅크리면 몸을 앞으로 숙인다
  if (sit) { K.legL.g.rotation.x = K.legR.g.rotation.x = -1.5; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 1.5; K.armL.rotation.x = K.armR.rotation.x = -0.85; }
  else if (cr) { K.legL.g.rotation.x = -1.25 + sw * 0.35; K.legR.g.rotation.x = -1.25 - sw * 0.35; K.legL.knee.rotation.x = K.legR.knee.rotation.x = 2.0;   // ENGINE-1 웅크리기(무릎 굽힘 — 발은 땅에)
    K.armL.rotation.x = -0.9 - sw * 0.3; K.armR.rotation.x = -0.9 + sw * 0.3; }
  else if (air) { K.legL.g.rotation.x = -0.5; K.legR.g.rotation.x = 0.25; K.legL.knee.rotation.x = 0.7; K.legR.knee.rotation.x = 0.3; K.armL.rotation.x = K.armR.rotation.x = -2.5; }
  else { K.legL.g.rotation.x = sw; K.legR.g.rotation.x = -sw; K.legL.knee.rotation.x = Math.max(0, sw) * 0.9; K.legR.knee.rotation.x = Math.max(0, -sw) * 0.9;
    K.armL.rotation.x = -sw * 0.85; K.armR.rotation.x = sw * 0.85; }
  if ((tray || CTRL.hold) && !sit) K.armL.rotation.x = K.armR.rotation.x = -1.1;                    // 식판 받쳐 들기 · ENGINE-1 물건 들기(map.carry)
  if (CTRL.pose === 'dig') { const d9 = Math.sin(kidT * 11); K.armL.rotation.x = K.armR.rotation.x = -1.3 + d9 * 0.6; K.rig.rotation.x = 0.35 + d9 * 0.08; }   // ENGINE-1 파기(map.dig)
  if (milk && !sit && !tray) K.armR.rotation.x = -0.7;                                               // 우유 들기
  if (CTRL.wave > 0 && !sit) { CTRL.wave -= dt; K.armR.rotation.x = -2.75 + Math.sin(kidT * 7) * 0.12; K.armR.rotation.z = 0.45 + Math.sin(kidT * 9) * 0.35; }   // TITLE-1: 손 흔들기(오프닝 · 게임 들어갈 때)
  else if (K.armR.rotation.z !== 0.12) K.armR.rotation.z = 0.12;   // 어깨 기본 벌림(kid.js arm)
  K.head.rotation.x = mv > 0.1 ? 0.04 : Math.sin(kidT * 1.7) * 0.03;                                   // 가만히 있으면 살짝 끄덕끄덕
  K.body.scale.y = 1 + (mv < 0.1 && !sit ? Math.sin(kidT * 2.2) * 0.008 : 0);                           // 숨쉬기
  ACTS.pose();                                                       // ACTION-1: 행동 자세(마시기·씻기·분무기…)를 기본 자세 위에
}

function terrainY(x, z) { return world.terrainAt(x, z); }   // 앞뜰·대지 yard / 운동장 field(LAYOUT-3 세 높이)
// PERF-WIN: 8m 격자 칸 찾기 = 숫자 열쇠(예전 gx+':'+gz 문자열을 부를 때마다 만들었다 — 점검 할당 1위권). world.grid(문자열 Map)는 그대로 두고
//  같은 배열을 숫자 Map에 거울로 단다 — mapapi collider.add가 world.grid.set으로 새 칸을 만들면 거울도 따라간다(set을 감쌈). 칸 배열은 같은 객체라 push·splice도 그대로 보인다
const GRIDN = new Map(), gkey = (gx, gz) => (gx + 2048) * 4096 + (gz + 2048);
for (const [k, a] of world.grid) { const c = k.indexOf(':'); GRIDN.set(gkey(+k.slice(0, c), +k.slice(c + 1)), a); }
{ const G = world.grid, set0 = G.set; G.set = function (k, a) { set0.call(G, k, a); const c = k.indexOf(':'); GRIDN.set(gkey(+k.slice(0, c), +k.slice(c + 1)), a); return G; }; }
world.cell = (gx, gz) => GRIDN.get(gkey(gx, gz));   // mapapi.ray·engine 시야선도 이것으로
// 본 상자 표시 = 세대 번호 배열(예전 new Set()을 부를 때마다 — 한 프레임 수십 번). colliders가 늘면(게임 충돌 추가) 키운다
let SEEN = new Uint32Array(8192), SEEN_G = 0;
function seenGen() { if (SEEN.length < world.colliders.length) { SEEN = new Uint32Array(world.colliders.length * 2); SEEN_G = 0; } if (++SEEN_G > 4e9) { SEEN.fill(0); SEEN_G = 1; } return SEEN_G; }
function groundAt(x, z, fromY) {
  let g = terrainY(x, z);
  const k0x = Math.floor((x-0.3)/8), k1x = Math.floor((x+0.3)/8), k0z = Math.floor((z-0.3)/8), k1z = Math.floor((z+0.3)/8), gen = seenGen(), C = world.colliders;
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (SEEN[i] === gen) continue; SEEN[i] = gen;
      const b = C[i];
      if (x > b.x0-0.26 && x < b.x1+0.26 && z > b.z0-0.26 && z < b.z1+0.26 && b.y1 <= fromY + 0.55 && b.y1 > g) g = b.y1;
    }
  }
  return g;
}
// 머리 위 물체 밑면(y0)이 [h0, h1] 사이에 있으면 그 높이(가장 낮은 것), 없으면 null
function ceilAt(x, z, h0, h1) {
  let c = null;
  const k0x = Math.floor((x-0.3)/8), k1x = Math.floor((x+0.3)/8), k0z = Math.floor((z-0.3)/8), k1z = Math.floor((z+0.3)/8), gen = seenGen(), C = world.colliders;
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (SEEN[i] === gen) continue; SEEN[i] = gen;
      const b = C[i];
      if (x > b.x0-0.26 && x < b.x1+0.26 && z > b.z0-0.26 && z < b.z1+0.26 && b.y0 >= h0 - 0.01 && b.y0 < h1 && (c === null || b.y0 < c)) c = b.y0;
    }
  }
  return c;
}
function blockedAt(x, z, y, h = 1.5) {   // ENGINE-1: h = 몸 높이(기본 1.5 — 길격자·게이트는 그대로 · 웅크린 몸만 0.8)
  const k0x = Math.floor((x-0.3)/8), k1x = Math.floor((x+0.3)/8), k0z = Math.floor((z-0.3)/8), k1z = Math.floor((z+0.3)/8), gen = seenGen(), C = world.colliders;
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (SEEN[i] === gen) continue; SEEN[i] = gen;
      const b = C[i];
      if (x > b.x0-0.26 && x < b.x1+0.26 && z > b.z0-0.26 && z < b.z1+0.26 && b.y1 > y + 0.55 && b.y0 < y + h) return true;
    }
  }
  return false;
}

// ---------- SHRINK-1(09-27): 작아지기 — map.player.scale(s)(게임이 켰을 때만 · 기본 1 = 위 함수 그대로 → 길격자·게이트 영향 0) ----------
//  몸 반지름·키·오름·점프·걷기·중력·카메라 거리·근평면이 s에 비례. 충돌 = 같은 충돌 상자 목록에서 만든 '작은 몸 판'(tinyBuild — 켤 때 한 번):
//   world.js가 적어 둔 c.tiny(책상 상판·책 칸·다리 · 의자 좌판·등받이·다리 · 교탁 상판·서랍장·모니터 · 사물함 윗판) → 그 상자들 ·
//   올라서기 금지(NS)로 올린 상자 → 보이는 윗면 vy1까지(작은 몸은 가구 윗면을 딛는다) · 나머지는 같은 상자 그대로(문·게임 충돌 제거도 따라감).
//  작은 몸 판의 함수는 본 상자를 세대 번호로 거른다(매 프레임 새 Set 없음).
const PHY = { sc: 1, r: 0.26, st: 0.55, h: 1.5, walk: 4.2, run: 7.5, crawl: 1.9, jv: 5.2, g: 14, T: null };
function tinyBuild() {
  const T = { cols: [], grid: new Map(), mark: new Uint32Array(8192), gen: 1 };
  for (const c of world.colliders) { if (c.y0 < -1e5) continue; tinyAdd(c, T); }
  for (const b of world.allBoxes) if (b.ts) tinyAdd(b, T);   // 보이기만 하던 얇은 부재(걸레받이·창틀 — world.js ts) = 작은 몸에겐 벽·발판(평소 몸·길격자는 그대로)
  return T;
}
function tinyAdd(c, T = PHY.T) {   // 게임이 작아진 뒤 더한 충돌(mapapi collider.add)도 여기로
  if (!T) return;
  const put = b => { const i = T.cols.push(b) - 1;
    for (let gx = Math.floor(b.x0 / 8); gx <= Math.floor(b.x1 / 8); gx++) for (let gz = Math.floor(b.z0 / 8); gz <= Math.floor(b.z1 / 8); gz++) { const k = gkey(gx, gz); let a = T.grid.get(k); if (!a) T.grid.set(k, a = []); a.push(i); } };
  if (c.tiny) { for (const t of c.tiny) put({ x0: t.x0, x1: t.x1, y0: t.y0, y1: t.y1, z0: t.z0, z1: t.z1, src: c }); }
  else if (c.vy1 != null) put({ x0: c.x0, x1: c.x1, y0: c.y0, y1: c.vy1, z0: c.z0, z1: c.z1, src: c });
  else put(c);
  if (T.mark.length < T.cols.length) { const a = new Uint32Array(T.cols.length * 2); T.mark = a; T.gen = 1; }
}
function tGen(T) { if (++T.gen > 4e9) { T.gen = 1; T.mark.fill(0); } return T.gen; }
function tGround(x, z, fromY) {
  const T = PHY.T, r = PHY.r, top = fromY + PHY.st, gen = tGen(T); let g = terrainY(x, z);
  for (let gx = Math.floor((x - 0.3) / 8); gx <= Math.floor((x + 0.3) / 8); gx++) for (let gz = Math.floor((z - 0.3) / 8); gz <= Math.floor((z + 0.3) / 8); gz++) {
    const cell = T.grid.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (T.mark[i] === gen) continue; T.mark[i] = gen; const b = T.cols[i];
      if (b.src && b.src.y0 < -1e5) continue;
      if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r && b.y1 <= top && b.y1 > g) g = b.y1; } }
  return g;
}
function tCeil(x, z, h0, h1) {
  const T = PHY.T, r = PHY.r, gen = tGen(T); let c = null;
  for (let gx = Math.floor((x - 0.3) / 8); gx <= Math.floor((x + 0.3) / 8); gx++) for (let gz = Math.floor((z - 0.3) / 8); gz <= Math.floor((z + 0.3) / 8); gz++) {
    const cell = T.grid.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (T.mark[i] === gen) continue; T.mark[i] = gen; const b = T.cols[i];
      if (b.src && b.src.y0 < -1e5) continue;
      if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r && b.y0 >= h0 - 0.01 * PHY.sc && b.y0 < h1 && (c === null || b.y0 < c)) c = b.y0; } }
  return c;
}
function tBlocked(x, z, y, h) {
  const T = PHY.T, r = PHY.r, st = y + PHY.st, gen = tGen(T);
  for (let gx = Math.floor((x - 0.3) / 8); gx <= Math.floor((x + 0.3) / 8); gx++) for (let gz = Math.floor((z - 0.3) / 8); gz <= Math.floor((z + 0.3) / 8); gz++) {
    const cell = T.grid.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (T.mark[i] === gen) continue; T.mark[i] = gen; const b = T.cols[i];
      if (b.src && b.src.y0 < -1e5) continue;
      if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r && b.y1 > st && b.y0 < y + h) return true; } }
  return false;
}
// 플레이어 물리가 부르는 판(평소 = 위 함수 그대로)
const pGround = (x, z, fromY) => PHY.T ? tGround(x, z, fromY) : groundAt(x, z, fromY);
const pCeil = (x, z, h0, h1) => PHY.T ? tCeil(x, z, h0, h1) : ceilAt(x, z, h0, h1);
const pBlocked = (x, z, y, h) => PHY.T ? tBlocked(x, z, y, h) : blockedAt(x, z, y, h);
// 작은 몸 카메라 광선: 작은 몸 판의 모든 보이는 상자(책상 상판·의자 등받이 포함 — 평소 camHit은 낮은 가구를 건너뛴다) · nc 막이(울타리·보이지 않는 윗부분)는 무시
function tCamHit(hx, hy, hz, dx, dy, dz, maxD) {
  const T = PHY.T, gen = tGen(T); let t = maxD;
  const ex = hx + dx * maxD, ez = hz + dz * maxD;
  for (let gx = Math.floor((Math.min(hx, ex) - 0.4) / 8); gx <= Math.floor((Math.max(hx, ex) + 0.4) / 8); gx++) for (let gz = Math.floor((Math.min(hz, ez) - 0.4) / 8); gz <= Math.floor((Math.max(hz, ez) + 0.4) / 8); gz++) {
    const cell = T.grid.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k]; if (T.mark[i] === gen) continue; T.mark[i] = gen; const b = T.cols[i];
      if (b.nc || (b.src && b.src.y0 < -1e5)) continue;
      let t0 = 1e-4, t1 = t, ok = true;
      for (let ax = 0; ax < 3 && ok; ax++) {
        const o = ax === 0 ? hx : ax === 1 ? hy : hz, d9 = ax === 0 ? dx : ax === 1 ? dy : dz, lo = ax === 0 ? b.x0 : ax === 1 ? b.y0 : b.z0, hi = ax === 0 ? b.x1 : ax === 1 ? b.y1 : b.z1;
        if (Math.abs(d9) < 1e-8) { if (o < lo || o > hi) ok = false; }
        else { let a = (lo - o) / d9, c9 = (hi - o) / d9; if (a > c9) { const s9 = a; a = c9; c9 = s9; } if (a > t0) t0 = a; if (c9 < t1) t1 = c9; if (t0 > t1) ok = false; } }
      if (ok && t0 < t) t = t0; } }
  // 바닥(지형·층 바닥) — 작은 몸은 카메라가 바닥 가까이라 바닥 밑으로 가지 않게
  if (dy < -1e-4) { const fy = tGround(hx, hz, hy - PHY.st), tf = (fy + camera.near - hy) / dy; if (tf > 0 && tf < t) t = tf; }
  return t;
}
const TCAM = { want: 0, d: 0, sh: 0, x0: 0, y: 0, z0: 0 };
function camPoseT(hx, hy, hz, yaw, pch, CD, fov, aspect, dUse) {
  const S = PHY.sc, n = camera.near, m = n * 1.8 + 0.01 * S;   // 근평면 모서리까지(≈1.6n) + 여유
  const dx = Math.sin(yaw) * Math.cos(pch), dy = Math.sin(pch), dz = Math.cos(yaw) * Math.cos(pch);
  const hit = tCamHit(hx, hy, hz, dx, dy, dz, CD);
  let want = Math.min(CD, hit - m); if (want < 0.5 * S) want = Math.max(0.1 * S, Math.min(0.5 * S, hit - m));
  if (want < 0) want = 0;
  const d = dUse ?? want, cx = hx + dx * d, cy = hy + dy * d, cz = hz + dz * d;
  const hw = n * Math.tan(fov * Math.PI / 360) * aspect + 0.08 * S, rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const r = tCamHit(cx, cy, cz, rx, 0, rz, hw), l = tCamHit(cx, cy, cz, -rx, 0, -rz, hw);
  TCAM.sh = (r < hw && l < hw) ? (r - l) / 2 : r < hw ? r - hw : l < hw ? hw - l : 0;
  TCAM.want = want; TCAM.d = d; TCAM.x0 = cx; TCAM.y = cy; TCAM.z0 = cz;
  return TCAM;
}
// s = 몸 크기(0.05~1) · o.speed = 걷기 배율(기본 √s) · o.jump = 점프 정점 높이 m(기본 0.97·s) · o.gravity = 중력 배율(기본 √s) · o.far = 먼 평면(기본 160)
function setScale(s, o = {}) {
  s = Math.max(0.05, Math.min(1, +s || 1));
  if (s === 1) {
    Object.assign(PHY, { sc: 1, r: 0.26, st: 0.55, h: 1.5, walk: 4.2, run: 7.5, crawl: 1.9, jv: 5.2, g: 14, T: null });
    pg.scale.setScalar(1); camera.near = 0.3; camera.far = 320; camera.updateProjectionMatrix(); camD = CAM_D; camSh = 0;
    P.bh = CTRL.crouched ? CROUCH_H : 1.5; return 1;
  }
  const k = o.speed ?? Math.sqrt(s), gk = o.gravity ?? Math.sqrt(s), apex = o.jump ?? 0.97 * s;
  Object.assign(PHY, { sc: s, r: 0.26 * s, st: 0.55 * s, h: 1.5 * s, walk: 4.2 * k, run: 7.5 * k, crawl: 1.9 * k, g: 14 * gk });
  PHY.jv = Math.sqrt(2 * PHY.g * apex);
  if (!PHY.T) PHY.T = tinyBuild();
  pg.scale.setScalar(s); camera.near = Math.max(0.01, 0.3 * s); camera.far = o.far ?? 160; camera.updateProjectionMatrix(); camD = CAM_D * s; camSh = 0;
  P.bh = (CTRL.crouched ? CROUCH_H : 1.5) * s; P.vy = 0;
  return s;
}

// 카메라 가림 방지(v1 이식): 머리→카메라 선분을 콜라이더 AABB와 교차 검사(슬랩법 — 레이캐스트 아님, 헌법⑤ 유지)
// 낮은 가구는 통과, 벽·기둥(높이≥1.5m)과 머리 위 부재(인방·천장)만 막는다. 히트 시 벽 앞 0.3m로 당김.
function camHit(hx, hy, hz, dx, dy, dz, maxD) {
  let t = maxD;
  const ex = hx + dx*maxD, ez = hz + dz*maxD;
  const k0x = Math.floor((Math.min(hx,ex)-0.4)/8), k1x = Math.floor((Math.max(hx,ex)+0.4)/8);
  const k0z = Math.floor((Math.min(hz,ez)-0.4)/8), k1z = Math.floor((Math.max(hz,ez)+0.4)/8);
  const gen = seenGen(), C = world.colliders;   // PERF-WIN: 세대 번호·숫자 칸(새 Set·문자열 없음)
  for (let gx=k0x; gx<=k1x; gx++) for (let gz=k0z; gz<=k1z; gz++) {
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const i = cell[k];
      if (SEEN[i] === gen) continue; SEEN[i] = gen;
      const b = C[i];
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

// ---------- 입력(PERF-WIN 09-28 "키가 잔잔하게 씹힘") ----------
// keys = 누르고 있는 키(e.code — 한글 입력기가 켜져 e.key가 'Process'·keyCode 229여도 e.code는 제자리 글쇠라 그대로 받는다 · isComposing도 막지 않는다).
//  ① 톡 치기 걸쇠: keydown 뒤 '다음 시뮬레이션 한 번'이 돌기 전에 keyup이 와도(느린 PC 20fps = 한 프레임 50ms) 그 키는 그 한 번 동안 눌린 것으로 본다 —
//     keyup을 KEY_UP에 미뤄 두었다가 프레임 끝(keysFrameEnd)에 뺀다. keys를 읽는 곳(이동·점프·웅크리기·mapapi·게임 pl.keys)이 모두 한 번은 본다.
//  ② 안 떨어지는 키 막기: 창 blur(Alt+Tab·윈도 키)·탭 숨김·포인터 잠금 풀림이면 전부 비운다(keyup을 못 받아 계속 걷던 것).
const keys = new Set(), KEY_NEW = new Set(), KEY_UP = new Set();
function keysClear() { keys.clear(); KEY_NEW.clear(); KEY_UP.clear(); }
function keysFrameEnd() { KEY_NEW.clear(); if (KEY_UP.size) { for (const k of KEY_UP) keys.delete(k); KEY_UP.clear(); } }   // 루프가 한 프레임의 시뮬레이션(step·게임 tick)을 끝낸 뒤
addEventListener('keydown', e => { if (!e.code) return;
  if (!keys.has(e.code)) KEY_NEW.add(e.code); keys.add(e.code); KEY_UP.delete(e.code);
  if (e.code === 'Space' && !e.repeat) TOUCH.jumpT = Math.max(TOUCH.jumpT, 0.12); });   // Space를 한 프레임보다 짧게 톡 쳐도 뛴다(느린 노트북 · 점프 버튼 jumpT와 같은 방식)
addEventListener('keyup', e => { if (!e.code) return; if (KEY_NEW.has(e.code)) KEY_UP.add(e.code); else keys.delete(e.code); });   // 아직 한 번도 안 읽힌 키 = 프레임 끝까지 눌린 채
addEventListener('blur', keysClear);
document.addEventListener('visibilitychange', () => { if (document.hidden) keysClear(); });
let camYaw = 0, camPitch = 0.3, camFirst = false;
addEventListener('keydown', e => { if (e.code === 'KeyV' && !e.repeat) camFirst = !camFirst; });   // 1인칭 ↔ 3인칭(누르고 있어 자동 반복돼도 한 번만)
const CAM_D = 6.3;
let camD = CAM_D;
canvas.addEventListener('click', () => { if (!TOUCH.on) canvas.requestPointerLock(); });   // 터치 기기엔 포인터 잠금이 없다(드래그가 시점)
// 마우스 시점(PERF-WIN): 움직임을 모았다가 프레임마다 한 번 더한다(mouseApply — 이벤트 수·프레임 수와 무관하게 같은 양 · 느린 PC에서 여러 이벤트가 한 프레임에 몰려도 부드럽게). 감도는 예전 그대로(0.0026·0.0022 rad/px).
//  튀는 값 버리기(물총 '위로 꺾임' 버그 — 크롬이 잠그는 순간·창 포커스 직후, 윈도에선 잠금 중에도 가끔 수백 px 한 번):
//   ① 잠금/포커스 뒤 0.25초 안: 한 이벤트 |dx| > 200 또는 |dy| > 150이면 버림(잠그려고 클릭한 직후 그만큼 휙 돌리는 손은 없다)
//   ② 그 밖: 이 이벤트가 담은 시간(지난 이벤트부터 · 프레임 간격 이상 · ≤120ms)에 비례한 문턱 — 사람 손 한계(가로 8px/ms · 세로 6px/ms ≈ 초당 8000px)를 넘으면 버림, 최소 300/200px(60fps에선 예전 물총 문턱과 같다).
//      느린 프레임(크롬이 mousemove를 rAF에 맞춰 합쳐 보냄 — 20fps면 한 이벤트에 50ms치)에선 문턱이 400px로(6fps면 960px) 커져 진짜 빠른 휙 돌리기는 버리지 않는다(리뷰: 고정 문턱은 그걸 버려 시점이 걸렸다).
const MOUSE = { dx: 0, dy: 0, t0: 0, fd: 16.7, fl: 0, te: 0, drop: 0 };   // fd = 지난 프레임 간격(ms · 루프가 적음 · ≤120) · te = 지난 이벤트 시각
document.addEventListener('pointerlockchange', () => { MOUSE.t0 = performance.now(); MOUSE.dx = MOUSE.dy = 0; if (document.pointerLockElement !== canvas) keysClear(); });   // 잠금이 풀리면(Esc·창 전환) 누른 키도 비운다
addEventListener('focus', () => { MOUSE.t0 = performance.now(); });
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  const now = performance.now(), gap = Math.max(MOUSE.fd, Math.min(120, now - MOUSE.te)); MOUSE.te = now;   // 이 이벤트가 담은 시간 ≈ 지난 이벤트부터(≤120ms) — 프레임 간격보다 짧게 보지는 않는다
  const mx = e.movementX || 0, my = e.movementY || 0, ax = Math.abs(mx), ay = Math.abs(my);
  const fresh = now - MOUSE.t0 < 250, lim = fresh ? 200 : Math.max(300, gap * 8), limY = fresh ? 150 : Math.max(200, gap * 6);
  if (ax > lim || ay > limY) { MOUSE.drop++; return; }
  MOUSE.dx += mx; MOUSE.dy += my;
});
function mouseApply() {   // 루프(와 SD2.step) — 모은 움직임을 한 번에
  if (!MOUSE.dx && !MOUSE.dy) return;
  camYaw -= MOUSE.dx * 0.0026;
  camPitch = Math.max(-0.2, Math.min(1.1, camPitch + MOUSE.dy * 0.0022));
  MOUSE.dx = MOUSE.dy = 0;
}
// TOUCH-1: 터치 조작(v2/js/touch.js) — 왼쪽 조이스틱 = 아날로그 이동(TOUCH.mx·my·m → physics) · 오른쪽 드래그 = 시점(마우스와 같은 부호, 휴대폰용 감도) · 점프/행동/시점 버튼
const TOUCH = createTouch({ canvas,
  look: (dx, dy) => { camYaw -= dx * 0.0058; camPitch = Math.max(-0.2, Math.min(1.1, camPitch + dy * 0.0042)); },
  act: () => { if (MAP?.closeModal()) return; if (hotNear) act(hotNear); else MAP?.idleAct(); }, view: () => { camFirst = !camFirst; },   // 리뷰(ENGINE-1): 쪽지가 떠 있으면 ✋ = 닫기(예전엔 같은 지점을 다시 눌러 쪽지를 또 열었다)
  onMode: on => { if (hotNear) hintEl.textContent = on ? hintEl.textContent.replace(/^E  /, '✋ ') : hintEl.textContent.replace(/^✋ /, 'E  ');   // 리뷰: 터치 ↔ 마우스(터치 화면 크롬북) 오갈 때
    if (MAP && MAP.minimap.visible) MAP.minimap.toggle(MAP.minimap.big); } });   // 미니맵 크기 다시(터치면 버튼 위까지만)

// 상호작용 상태 — anim: 정해진 경로 이동(미끄럼틀) / sit: 의자에 앉음(움직이면 일어남)
const ACT = { anim: null, sit: null };
const CTRL = { frozen: false, speed: 1 };   // MAP-API-1: 게임이 멈춤(입력·점프만 무시 — 중력은 유지)·속도(0.5~2)를 건다
// ENGINE-1(09-27 행동 사전): 게임이 켜는 것만 — crouchOK(웅크리기 허용 · 기본 끔 = 게이트 영향 0) · crouched(지금 웅크림) · crouchForce(null|bool — 시험·게임이 강제) ·
//   peek(숨는 자리 틈새 시점 {x,y,z,yaw,fov}) · hot(강제 상호작용 지점 — 숨은 동안 '나오기') · hold(물건 들기 팔) · pose('dig') · noiseT(뛰어내림 소리 남는 시간)
Object.assign(CTRL, { wave: 0, crouchOK: false, crouched: false, crouchForce: null, peek: null, hot: null, hold: false, pose: null, noiseT: 0 });
// ACTION-1(09-28): 보이는 행동 — act()·map.player.act가 부른다(쉬는 동안 비용 0 · 버스 문만 거리 재기). 신발 기본 = 운동화(파랑) — 신발장에서 실내화(흰색)로
const ACTS = createActions({ THREE, scene, camera, KID, pg, P, ACT, blocked: (x, z, y) => pBlocked(x, z, y, P.bh), groundAt: (x, z, y) => pGround(x, z, y), toast: m => toast(m), tone: (...a) => tone(...a) });
const SHOE_OUT = 0x4f7fd0;
KID.setShoe(SHOE_OUT);
if (world.busDoor) ACTS.busDoor(world.busDoor);
{ const H9 = world.hotspots;   // 급식실 의자 중 사람이 앉아 있는 자리는 앉기 지점을 뺀다 · 구령대 마이크 머리(집어 들면 사라짐)
  for (let i = H9.length - 1; i >= 0; i--) { const h = H9[i]; if (h.seat && h.cafe && (world.people || []).some(p => Math.hypot(p.x - h.seat.x, p.z - h.seat.z) < 0.45)) H9.splice(i, 1); }
  for (const h of H9) if (h.mic) ACTS.micStand(h); }
const CROUCH_H = 0.8;
// 웅크리기 입력: C·Ctrl 누르고 있기(키보드) · 터치 ⬇ 버튼(누를 때마다 켜고 끔 — 두 엄지가 조이스틱·시점에 있으니) · crouchForce
function crouchTick() {
  const want = CTRL.crouchOK && !ACT.sit && !ACT.anim && (CTRL.crouchForce ?? (keys.has('KeyC') || keys.has('ControlLeft') || keys.has('ControlRight') || !!TOUCH.crouch));
  if (want && !CTRL.crouched) { CTRL.crouched = true; P.bh = CROUCH_H * PHY.sc; }
  else if (!want && CTRL.crouched) {   // 일어서기: 머리 위(발 +0.55 ~ +1.5)가 막혀 있으면 웅크린 채(책상·미끄럼틀 밑)
    if (!pBlocked(P.x, P.z, P.y, PHY.h)) { CTRL.crouched = false; P.bh = PHY.h; } }   // 리뷰(ENGINE-1): 게임이 웅크리기를 꺼도(crouch(false)) 머리 위가 막혀 있으면 빠져나올 때까지 웅크린 채 — 예전엔 낮은 곳 밑에서 일어서며 몸이 상자 안에 끼었다(게임이 멈출 땐 engine.reset이 unstick)
}
const MOVE_K = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
const anyKey = L => { for (let i = 0; i < L.length; i++) if (keys.has(L[i])) return true; return false; };   // PERF-WIN: 매 프레임 배열·닫힘(some) 없이
function step(dt) {
  const moving = anyKey(MOVE_K) || TOUCH.m > 0 || TOUCH.jump || TOUCH.jumpT > 0;   // jumpT: 톡 친 점프(프레임 사이에 떼도) — 앉아 있으면 일어난다
  if (ACT.anim) {
    const a = ACT.anim; a.t = Math.min(1, a.t + dt / a.dur);
    P.x = a.from[0] + (a.to[0] - a.from[0]) * a.t; P.y = a.from[1] + (a.to[1] - a.from[1]) * a.t; P.z = a.from[2] + (a.to[2] - a.from[2]) * a.t;
    P.vy = 0; if (a.t >= 1) ACT.anim = null;
  } else if (ACT.sit && !moving) {
    P.x = ACT.sit.x; P.z = ACT.sit.z; P.y = ACT.sit.y; P.vy = 0;
  } else {
    ACT.sit = null;
    if (ACTS.busy && moving) ACTS.stop();   // ACTION-1: 움직이면 하던 행동을 바로 멈춘다
    physics(dt);
  }
  ACTS.tick(dt);   // ACTION-1: 한 발 옮기기·시간·물줄기·알갱이·버스 문(쉬는 동안은 버스 문 거리 재기뿐)
  const SE = ACT.sit && ACT.sit.seat;   // ACTION-1: 좌석 앉기(식탁·버스) — 몸은 서는 칸(P) 대신 좌석 위에 그린다(일어나면 서는 칸에서 바로 걷는다)
  pg.position.set(SE ? SE.x : P.x, SE ? SE.y : P.y, SE ? SE.z : P.z);
  pg.rotation.y = SE ? SE.yaw : CTRL.face ?? P.yaw;   // GAME-WG(09-26): 게임이 몸 방향을 잠깐 잡을 수 있다(물총 겨눔 — map.player.aim) · 없으면 걷는 방향
  kidTick(dt);
  // CAM-2(09-24): 사용자 "복도가 좁은 것 같다" — 실측 복도는 2.5m(게임 2.7m)로 좁지 않았다. 원인은 카메라:
  //  6.3m 뒤·17° 위에서 내려다보면 실내에선 천장(3.24m) 밑에 붙어 위에서 내려다보고, 화각 48°는 휴대폰 광각보다 훨씬 좁다.
  //  → 실내(머리 위에 천장)에선 가깝고(3.3m) 낮게(피치 ≤0.2)·화각 60°, 밖은 6.3m·52°. V = 1인칭(눈높이 1.5m) 전환.
  const indoor = ceilAt(P.x, P.z, P.y + 1.6, P.y + 5.5) !== null;
  const tFov = camFirst ? 66 : indoor ? 60 : 52;
  if (Math.abs(camera.fov - tFov) > 0.05) { camera.fov += (tFov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
  { const S = PHY.sc, gy = pGround(P.x, P.z, P.y + 0.05 * S), h = Math.max(0, P.y - gy) / S, k = Math.max(0.35, 1 - h * 0.35);   // GFX-2 발밑 그림자(SHRINK-1: 몸 크기 비례)
    blob.position.set(P.x, gy + 0.045 * Math.max(S, 0.2), P.z); blob.scale.setScalar(0.95 * k * S); blob.material.opacity = k; blob.visible = !ACT.sit && h < 3; }
  pg.visible = !camFirst && camD > 0.45 * PHY.sc;   // CAM-3: 벽에 붙어 카메라가 머리 바로 뒤까지 오면 캐릭터를 숨긴다(1인칭처럼)
  if (CTRL.peek) {   // ENGINE-1 숨는 자리: 캐릭터 숨김 · 카메라 = 틈새 시점(좁은 화각 · 고개는 ±40°까지만 · 가장자리 어둡게는 mapapi DOM)
    const K9 = CTRL.peek; pg.visible = false; blob.visible = false;
    let dy9 = camYaw - K9.yaw; while (dy9 > Math.PI) dy9 -= Math.PI * 2; while (dy9 < -Math.PI) dy9 += Math.PI * 2;
    if (Math.abs(dy9) > 0.7) camYaw = K9.yaw + Math.sign(dy9) * 0.7;
    const pitch = Math.max(-0.35, Math.min(0.35, camPitch - 0.3));
    if (Math.abs(camera.fov - K9.fov) > 0.05) { camera.fov = K9.fov; camera.updateProjectionMatrix(); }
    camera.position.set(K9.x, K9.y, K9.z);
    camera.lookAt(K9.x - Math.sin(camYaw) * Math.cos(pitch), K9.y - Math.sin(pitch), K9.z - Math.cos(camYaw) * Math.cos(pitch));
    if (SHOT) applyShot(); return;
  }
  const eyeH = (CTRL.crouched ? 0.8 : 1.5) * PHY.sc, headH = (CTRL.crouched ? 0.8 : 1.3) * PHY.sc;   // ENGINE-1: 웅크리면 눈·머리 높이도 낮게 · SHRINK-1 몸 크기 비례
  if (camFirst) {
    const pitch = camPitch - 0.3, ey = (SE ? SE.y : P.y) + eyeH - (ACT.sit ? 0.42 * PHY.sc : 0), ex = SE ? SE.x : P.x, ez = SE ? SE.z : P.z;
    camera.position.set(ex, ey, ez);
    camera.lookAt(ex - Math.sin(camYaw) * Math.cos(pitch), ey - Math.sin(pitch), ez - Math.cos(camYaw) * Math.cos(pitch));
  } else if (PHY.T) {   // SHRINK-1 작은 몸 3인칭: 거리·근평면 비례 · 낮은 가구도 카메라를 막는다(camPoseT) · 실내 피치 제한 없음(천장이 멀다) · 바닥 밑으로 안 감
    const S = PHY.sc, hx = P.x, hy = P.y + headH, hz = P.z, pch = Math.max(-0.2, Math.min(0.9, camPitch)), CD = (indoor ? 4.2 : CAM_D) * S;   // 리뷰(SHRINK): 올려다보기 −0.2까지(책상 절벽·교탁 봉우리를 밑에서) — 바닥은 tCamHit가 막는다
    const want = camPoseT(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect).want;
    camD = want < camD ? want : camD + (want - camD) * Math.min(1, dt * 7);
    const C = camPoseT(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect, camD);
    camSh = Math.abs(C.sh) > Math.abs(camSh) || C.sh * camSh < 0 ? C.sh : camSh + (C.sh - camSh) * Math.min(1, dt * 8);
    const rx = Math.cos(camYaw) * camSh, rz = -Math.sin(camYaw) * camSh;
    camera.position.set(C.x0 + rx, C.y, C.z0 + rz);
    camera.lookAt(hx + rx, hy, hz + rz);
  } else {
    const hx = SE ? SE.x : P.x, hy = (SE ? SE.y + 0.1 : P.y) + headH, hz = SE ? SE.z : P.z, pch = indoor ? Math.min(camPitch, 0.2) : camPitch, CD = indoor ? 3.3 : CAM_D;
    const want = camPose(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect).want;
    camD = want < camD ? want : camD + (want - camD) * Math.min(1, dt * 7);   // 당김은 즉시·복귀는 이징(지터 방지)
    const C = camPose(hx, hy, hz, camYaw, pch, CD, camera.fov, camera.aspect, camD);   // 실제 거리에서 옆벽 비키기
    camSh = Math.abs(C.sh) > Math.abs(camSh) || C.sh * camSh < 0 ? C.sh : camSh + (C.sh - camSh) * Math.min(1, dt * 8);   // 비키기는 즉시·돌아오기는 이징
    const sh9 = camSh + (CTRL.shoulder || 0), rx = Math.cos(camYaw) * sh9, rz = -Math.sin(camYaw) * sh9;   // GAME-WG: CTRL.shoulder = 어깨 너머 시점(게임이 바깥에서만 켬 — map.player.shoulder)
    camera.position.set(C.x0 + rx, C.y, C.z0 + rz);
    camera.lookAt(hx + rx, hy, hz + rz);
  }
  if (CAM_OVR) CAM_OVR(dt);   // TITLE-1: 오프닝 카메라(평소 자리를 목표로 읽고 덮어쓴다)
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
    const cell = GRIDN.get(gkey(gx, gz)); if (!cell) continue;
    for (let k = 0; k < cell.length; k++) { const b = world.colliders[cell[k]];
      if (b.nc || b.y1 <= fl || (b.y1 - b.y0 < 1.5 && b.y0 < hy + 0.4)) continue;
      if (b.x1 < cx - 0.6 || b.x0 > cx + 0.6 || b.z1 < cz - 0.6 || b.z0 > cz + 0.6 || b.y1 < cy - 0.6 || b.y0 > cy + 0.6) continue;
      for (let c9 = 0; c9 < 5; c9++) { const sa = NCP[c9][0], sb = NCP[c9][1], ex = fx * 0.3 + rx * hw * sa + ux * hh * sb, ey = fy * 0.3 + uy * hh * sb, ez = fz * 0.3 + rz * hw * sa + uz * hh * sb;
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
  crouchTick();
  const cr = CTRL.crouched, sp = (cr ? PHY.crawl : keys.has('ShiftLeft') ? PHY.run : PHY.walk) * CTRL.speed;   // ENGINE-1: 웅크리면 느리게(달리기 없음) · SHRINK-1 PHY = 몸 크기 판
  let mx = 0, mz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) { mx -= Math.sin(camYaw); mz -= Math.cos(camYaw); }
  if (keys.has('KeyS') || keys.has('ArrowDown')) { mx += Math.sin(camYaw); mz += Math.cos(camYaw); }
  if (keys.has('KeyA') || keys.has('ArrowLeft')) { mx -= Math.cos(camYaw); mz += Math.sin(camYaw); }
  if (keys.has('KeyD') || keys.has('ArrowRight')) { mx += Math.cos(camYaw); mz -= Math.sin(camYaw); }
  let sp2 = sp;
  if (mx === 0 && mz === 0 && TOUCH.m > 0) {   // TOUCH-1 조이스틱(키를 안 누를 때만): 앞 my·오른쪽 mx를 키와 같은 축으로. 세기 = 걷기 30~100% · 가장자리(≥0.92) = 달리기
    mx = -Math.sin(camYaw) * TOUCH.my + Math.cos(camYaw) * TOUCH.mx; mz = -Math.cos(camYaw) * TOUCH.my - Math.sin(camYaw) * TOUCH.mx;
    sp2 = (cr ? PHY.crawl * Math.max(0.4, Math.min(1, TOUCH.m / 0.8)) : TOUCH.m >= 0.92 ? PHY.run : PHY.walk * Math.max(0.3, Math.min(1, (TOUCH.m - 0.15) / 0.6))) * CTRL.speed;
  }
  if (CTRL.frozen) mx = mz = 0;
  const L = Math.hypot(mx, mz), ox = P.x, oz = P.z;
  if (L > 0) {
    mx /= L; mz /= L;
    const sp = sp2, nx = P.x + mx * sp * dt, nz = P.z + mz * sp * dt;
    if (!pBlocked(nx, P.z, P.y, P.bh)) P.x = nx;
    if (!pBlocked(P.x, nz, P.y, P.bh)) P.z = nz;
    P.yaw = Math.atan2(mx, mz);
  }
  P.spd = Math.hypot(P.x - ox, P.z - oz) / Math.max(dt, 1e-4);   // ENGINE-1: 소리 판정(map.player.noise)
  if (TOUCH.jumpT > 0) TOUCH.jumpT -= dt;
  if ((keys.has('Space') || TOUCH.jump || TOUCH.jumpT > 0) && P.ground && !CTRL.frozen && !cr) { P.vy = PHY.jv; P.ground = false; TOUCH.jumpT = 0; }
  P.vy -= PHY.g * dt;
  const y0 = P.y;
  P.y += P.vy * dt;
  // PHYS-2 머리 부딪힘: 올라가다 머리(발+1.5)가 위쪽 물체 밑면에 닿으면 멈춘다(예전엔 천장을 뚫고 올라갔다)
  if (P.vy > 0) { const c = pCeil(P.x, P.z, y0 + P.bh, P.y + P.bh); if (c !== null) { P.y = c - P.bh; P.vy = 0; } }
  // PHYS-2 바닥: 발 높이 + 0.55까지만 딛고 올라선다(벽 막힘 기준 blockedAt과 같은 값).
  //   예전엔 발+1.15(fromY=P.y+0.6)까지 붙어 올라가, 1.6 높이 가구 → 천장 → 지붕으로 계단 타듯 올라갔다(09-23 실측).
  //   떨어질 땐 직전 높이 기준(max) — 한 프레임에 많이 떨어져도 바닥을 뚫지 않게
  const g = pGround(P.x, P.z, Math.max(y0, P.y));
  if (P.y <= g) { if (!P.ground && y0 - g > 0.35 * PHY.sc) CTRL.noiseT = 0.4; P.y = g; P.vy = 0; P.ground = true; }   // ENGINE-1: 뛰어내린 '쿵' = 큰 소리 0.4초
  if (CTRL.noiseT > 0) CTRL.noiseT -= dt;
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
hintEl.className = 'chip'; hintEl.id = 'hint';
hintEl.style.cssText = 'left:50%;bottom:56px;transform:translateX(-50%);display:none;cursor:pointer;font-size:15px;padding:8px 16px';
document.body.appendChild(hintEl);
const toastEl = document.createElement('div'); toastEl.id = 'toast';   // TOUCH-1 리뷰: 터치면 칩 줄 아래로(touch.js css)
toastEl.className = 'chip';
toastEl.style.cssText = 'left:50%;top:56px;transform:translateX(-50%);display:none;font-size:15px;padding:8px 16px';
document.body.appendChild(toastEl);
let toastT = 0;
function toast(msg, sec = 2.2) { toastEl.textContent = msg; toastEl.style.display = ''; toastT = sec; }
let hotNear = null, hotT = 0, hotLab = null;
function hotTick(dt) {
  if (toastT > 0 && (toastT -= dt) <= 0) toastEl.style.display = 'none';
  if ((hotT += dt) < 0.15) return;
  hotT = 0;
  let best = null, bd = 1e9;
  if (CTRL.hot) best = CTRL.hot;   // ENGINE-1: 숨은 동안엔 '나오기' 하나만
  else if (!ACT.anim) for (const h of HOT) {
    if (h.off) continue;   // MAP-API-1: 게임이 끈 지점
    const d = (P.x - h.x) ** 2 + (P.z - h.z) ** 2;
    if (d < h.r * h.r && d < bd && Math.abs(P.y - h.y) < 1.6) { bd = d; best = h; }
  }
  if (mapOpened && best !== mapOpened) { if (MAP && MAP.minimap.visible && !MAP.game.current) MAP.minimap.hide(); mapOpened = null; }   // ACTION-1: 안내도에서 멀어지면 연 지도를 닫는다
  if (best !== hotNear || (best && best.label !== hotLab)) {   // ENGINE-1: 같은 지점이 이름을 바꾸면(숨기 ↔ 나오기) 안내도 다시
    hotNear = best; hotLab = best && best.label;
    hintEl.style.display = best ? '' : 'none'; TOUCH.setNear(best);
    if (best) hintEl.textContent = (TOUCH.on ? '✋ ' : 'E  ') + (best.kind === 'board' ? ['칠판에 낙서하기', '더 그리기', '칠판 지우기'][best.stage || 0] : best.kind === 'sit' && ACT.sit ? '일어나기' : best.label);
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
// ACTION-1(09-28 아이 "상호작용이 말만 되고 실제로 보이지 않는 게 대부분"): 지점마다 보이는 행동(actions.js) — 알림 글은 동작 뒤에 짧게.
//   지점 필드(world.js): at [x,y,z](대상 — 돌아서서 알맞은 거리로 한 발) · ats [[…],…](가장 가까운 것) · wash의 at/ats 넷째 값 = 물이 닿는 높이 · mic [x,y,z,ry](스탠드 위 마이크) ·
//   sit의 seat {x,y,z,yaw,table?}(몸은 좌석 위 · 서는 칸은 h.x·h.z) · 정본 docs/map_api.md §19
function makeTray() {   // 칸 나뉜 식판(밥·국·반찬 셋) — 음식은 children 1~5(먹으면 줄어든다)
  const g = new THREE.Group();
  const TM = c => new THREE.MeshLambertMaterial({ color: c });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.34), TM(0xc8d2da)));
  [[-0.13, 0.07, 0xf4f1e8], [0.13, 0.07, 0xc86a3a], [-0.16, -0.08, 0xc8452c], [0, -0.08, 0x6fa04f], [0.16, -0.08, 0xe8c35a]].forEach(([x, z, c], i) => {
    const f = new THREE.Mesh(i < 2 ? new THREE.SphereGeometry(0.075, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2) : new THREE.BoxGeometry(0.1, 0.03, 0.09), TM(c));
    f.position.set(x, 0.02, -z); g.add(f); });
  g.userData.eaten = 0; return g;
}
const trayHands = () => { if (!tray) return; pg.add(tray); tray.position.set(0, KID.tray[0], KID.tray[1]); tray.rotation.set(0, 0, 0); };
const trayFood = k => { if (!tray) return; tray.userData.eaten = k; for (let i = 1; i < tray.children.length; i++) { const f = tray.children[i]; f.visible = k < 0.98; f.scale.setScalar(Math.max(0.05, 1 - k * (0.8 + i * 0.04))); } };
let mapOpened = null;
function act(h) {
  if (typeof h.use === 'function') {   // MAP-API-1: 게임이 더한 지점(map.interact.add) — 예외는 잡아서 루프가 안 멈추게
    try { h.use(h); } catch (e) { console.error(e); }
    hotNear = null; if (h.once) h.off = true; MAP?.emit('interact', h); return;
  }
  MAP?.emit('interact', h);
  const A = (name, o = {}) => ACTS.play(name, { at: h.at, ats: h.ats, h, ...o });
  switch (h.kind) {
    case 'board': {
      const nx = ((h.stage || 0) + 1) % 3;
      A(nx === 0 ? 'erase' : 'write', { at: [h.bx, h.by, h.bz], msg: nx === 0 ? '🧽 칠판을 깨끗이 지웠어요' : '✏️ 칠판에 낙서했어요', midAt: 0.75, onMid: () => {
        h.stage = nx;
        if (!h.mesh) { h.mesh = new THREE.Mesh(chalkGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); h.mesh.position.set(h.bx, h.by, h.bz); h.mesh.rotation.y = h.ry || 0; scene.add(h.mesh); }
        h.mesh.visible = h.stage > 0;
        if (h.stage > 0) { h.mesh.material.map = chalkTex[h.stage - 1]; h.mesh.material.needsUpdate = true; } } });
      hotNear = null; break;
    }
    case 'sit':
      if (ACT.sit) { ACT.sit = null; hotNear = null; break; }   // ACTION-1: 앉아 있을 때 E = 일어나기(안내 '일어나기'와 같게 — 예전엔 같은 의자에 다시 앉았다)
      ACTS.stop(true);
      ACT.sit = { x: h.x, z: h.z, y: h.y, seat: h.seat || null }; P.yaw = h.seat ? h.seat.yaw : h.yaw ?? Math.PI;   // 의자 바로 뒤(몸을 의자 상자 안에 넣으면 일어날 때 의자 위로 올라선다) · 좌석(seat)은 몸만 좌석 위
      if (tray && h.seat && h.seat.table) {   // 식판을 식탁에 내려놓고 숟가락으로 떠먹기 — 8초면 다 먹음 · 일어나면 식판을 다시 든다
        const T = h.seat.table; scene.add(tray); tray.position.set(T[0], T[1] + 0.02, T[2]); tray.rotation.set(0, h.seat.yaw, 0);
        const e0 = tray.userData.eaten || 0; let told = e0 >= 1;
        ACTS.play('eat', { onEat: t => { const k = Math.min(1, e0 + t / 8); trayFood(k); if (k >= 1 && !told) { told = true; toast('😋 다 먹었어요! 식판은 식판 반납대에 돌려줘요'); } }, onEnd: () => trayHands() });
        toast(e0 >= 1 ? '🍽️ 식판이 비었어요 — 일어나서 반납대로' : '🍚 냠냠 — 식탁에 앉아 먹어요 (움직이면 일어나요)', 2.6);
      } else toast(h.bus ? '🚌 버스 의자에 앉았어요 — 움직이면 일어나요' : '🪑 의자에 앉았어요 — 움직이면 일어나요');
      hotNear = null; break;
    case 'meal':   // 배식대: 두 손을 뻗어 받으면 칸 나뉜 식판에 밥·국·반찬 셋(반납은 식판 반납대에서)
      if (!tray) A('reach', { msg: '🍚 급식을 받았어요 — 빈 의자에 가서 앉아 먹어요', midAt: 0.5, onMid: () => { if (!tray) { tray = makeTray(); trayHands(); } } });
      else toast(tray.userData.eaten >= 1 ? '🍽️ 다 먹은 식판은 식판 반납대에 돌려줘요' : '🍚 식판은 이미 받았어요 — 의자에 앉아 먹어요');
      break;
    case 'trayback':
      if (tray) { const t9 = tray; A('reach', { msg: t9.userData.eaten >= 1 ? '🍽️ 식판을 반납했어요 — 잘 먹었습니다!' : '🍽️ 식판을 반납했어요', midAt: 0.5,
        onMid: () => { if (tray !== t9) return; scene.attach(t9); if (h.at) t9.position.set(h.at[0], h.at[1] + 0.02, h.at[2]); tray = null; },
        onEnd: () => { if (t9.parent === scene) scene.remove(t9); } }); }
      else toast('반납할 식판이 없어요');
      break;
    case 'read': A('read'); break;
    case 'water': A('drink'); break;
    case 'wash': A(h.pump ? 'sanitize' : 'wash'); break;
    case 'garden': A('water'); break;
    case 'pot': A('spray'); break;
    case 'mic': A('mic', { at: h.at }); break;
    case 'shoes': A('shoes', { midAt: 0.85, msg: shoesIn ? '👞 운동화로 갈아신었어요' : '👟 실내화로 갈아신었어요', onMid: () => {
      shoesIn = !shoesIn; KID.setShoe(shoesIn ? KID.shoeIn : SHOE_OUT); h.label = shoesIn ? '운동화로 갈아신기' : '실내화로 갈아신기'; } }); break;
    case 'drum': (drumN++ % 2 ? xyloSnd : drumSnd)(); A('drum', { msg: drumN % 2 ? '🥁 둥둥 둥둥!' : '🎶 도미솔도~ 실로폰 소리' }); break;
    case 'milk':
      if (!milk) { milk = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.09), new THREE.MeshLambertMaterial({ color: 0xf4f6f2 })); milk.position.set(...KID.milk); pg.add(milk); toast('🥛 우유를 하나 꺼냈어요'); }
      else { pg.remove(milk); milk = null; toast('🥛 우유를 다 마셨어요'); }
      break;
    case 'visit': A('scribble', { msg: '📝 방문록에 이름을 적었어요' }); break;
    case 'map': A('point', { msg: '🗺️ 학교 안내도 — 현관 · 가운데 로비 · 교실을 찾아가 봐요 (M · 지도 닫기)', midAt: 0.6, onMid: () => {   // 안내도 = 큰 지도를 연다(게임이 지도를 안 쓸 때만 — 멀어지면 닫힘)
      if (MAP && !MAP.minimap.visible && !MAP.game.current) { MAP.minimap.show({ big: true }); mapOpened = h; } } }); break;
    case 'clock': { const d = new Date(); A('look', { msg: `🕰️ 지금은 ${d.getHours()}시 ${d.getMinutes()}분이에요` }); break; }
    case 'notice': A('look', { msg: '📋 이번 주 학생자치회 소식을 읽었어요' }); break;
    case 'aed': A('point', { msg: '❤️ AED(자동심장충격기) 보관함이에요 — 위급할 땐 선생님께 바로 알려요' }); break;   // LINK-EAST-14 세로복도 입구
    case 'keypad': A('press', { msg: '🔢 과학실 번호키를 눌렀어요 — 삐빅!', midAt: 0.35, onMid: () => [1319, 1175, 1397].forEach((f, i) => tone(f, i * 0.09, 0.07, 'square', 0.05)) }); break;   // LINK-EAST-11 과학실 문
    case 'song': songSnd(); A('sing', { msg: '🎵 교가를 흥얼거렸어요' }); break;
    case 'motto': A('look', { msg: '📜 우리 학교 교훈 — 바르고 슬기롭게' }); break;
    case 'flag': A('salute', { msg: '🇰🇷 태극기가 바람에 펄럭여요' }); break;
    case 'slide':
      ACTS.stop(true); ACT.anim = { from: h.from, to: h.to, t: 0, dur: 0.9 }; P.yaw = Math.PI; toast('🛝 슝~'); break;
  }
}
addEventListener('keydown', e => { if (e.code === 'KeyE' && !e.repeat) { if (hotNear) act(hotNear); else MAP?.idleAct(); } });   // ENGINE-1: 할 것이 없을 때 행동 = 게임 몫(들고 있는 물건 내려놓기)
hintEl.addEventListener('click', e => { e.stopPropagation(); if (MAP?.closeModal()) return; if (hotNear) act(hotNear); });

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
  return { ax: d.ax, bx: d.cx, bz: d.cz, w, ow: d.w, h, y0: d.y0, glass: d.glass, open: 0, over: d.slideOver ? 0.12 : 0, color: d.color, slot: d.slot, film: d.film, lum: d.lum, swing: d.swing || null };
});
const _boxG = new THREE.BoxGeometry(1, 1, 1);
const SLID = DOORS.filter(o => !o.swing);   // GYM-2: 여닫이 문은 아래 SWING 인스턴스가 따로 그린다(미닫이 인스턴스 번호 밖)
const nWood = SLID.filter(o => !o.glass && !o.film).length, nFilm = SLID.filter(o => o.film).length, nGlass = SLID.length - nWood - nFilm;
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
{ let iw = 0, ig = 0, i9 = 0; const _dc = new THREE.Color(); SLID.forEach(o => { o.idx = o.glass ? ig++ : o.film ? i9++ : iw++; if (o.film) doorInst.film.setColorAt(o.idx, _dc.set(o.color ?? 0xffffff)); else if (!o.glass) doorInst.wood.setColorAt(o.idx, _dc.set(o.color ?? 0xc08b4f).multiplyScalar(o.lum ?? 1)); });
  if (doorInst.wood.instanceColor) doorInst.wood.instanceColor.needsUpdate = true; if (doorInst.film.instanceColor) doorInst.film.instanceColor.needsUpdate = true; }
// 필름 문은 실내 디테일처럼 멀면 숨긴다(world.details에 끼우면 detailTick이 거리로 켜고 끔 — 먼 구역 닻 드로우콜 +0)
if (nFilm) { const fl = DOORS.filter(o => o.film); world.details.push({ mesh: doorInst.film, cx: fl.reduce((a, o) => a + o.bx, 0) / nFilm, cz: fl.reduce((a, o) => a + o.bz, 0) / nFilm, inside: true }); }
const _dM = new THREE.Matrix4(), _dP = new THREE.Vector3(), _dS = new THREE.Vector3(), _dQ = new THREE.Quaternion();
// ---------- 여닫이 문(GYM-2 · 09-28 아이 "체육관 문은 미는 문") ----------
// world gap의 swing = { n: 열리는 쪽 법선 부호, leaves: [짝 폭 …](1짝 = 한쪽 경첩 · 2짝 = 양쪽 경첩), look: 'quilt'(남색 누빔 · 흰 단추) | 'plain'(민짝 + 작은 창) | 'glass'(유리 + 스테인리스 틀), color }
// 짝마다 경첩(문틀 안쪽 끝)에서 수직축으로 돈다(다 열면 83°). 통행은 막지 않는다(미닫이와 같은 규칙) · 인스턴스 3개(누빔·민/틀·유리) — 문이 있는 곳 둘레 구로 절두체 컬링
const quiltTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#1d2757'; g.fillRect(0, 0, 128, 256);
  for (let j = 0; j < 9; j++) for (let i = 0; i < 5; i++) { const x = i * 32 - (j % 2) * 16, y = j * 32 - 8, gr = g.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 22);   // 누빔(단추 사이가 볼록)
    gr.addColorStop(0, '#2c3a7a'); gr.addColorStop(1, '#161e46'); g.fillStyle = gr; g.beginPath(); g.ellipse(x + 16, y + 16, 17, 17, 0, 0, 7); g.fill(); }
  g.fillStyle = '#e9eaee'; for (let j = 0; j < 9; j++) for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(i * 32 - (j % 2) * 16, j * 32 - 8, 2.6, 0, 7); g.fill(); }
  g.strokeStyle = '#f2f2f2'; g.lineWidth = 6; g.strokeRect(3, 3, 122, 250);   // 흰 문테
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const SWING = DOORS.filter(o => o.swing), SWP = { q: [], p: [], g: [] };
SWING.forEach(o => {
  const sw = o.swing, X = o.ax === 'x', L = sw.leaves || [o.ow], S = L.reduce((a, b) => a + b, 0), m = Math.max(0.03, (o.ow - S) / 2);
  const line = X ? o.bz : o.bx, c = X ? o.bx : o.bz, g0 = c - o.ow / 2, g1 = c + o.ow / 2, H9 = (o.h - (o.lintel ? 0.05 : 0)) - 0.02;
  o.lv = L.map((w, k) => {
    const s = L.length === 1 || k === 0 ? 1 : -1, hinge = s > 0 ? g0 + m : g1 - m, len = w * (o.ow - 2 * m) / S - 0.02, parts = [];   // 짝 폭 = 문틀 안(양끝 m)에 맞춰 줄임
    const P = (mesh, a, y, pw, ph, t, col) => { const i = SWP[mesh].length; SWP[mesh].push(col ?? 0xffffff); parts.push({ mesh, i, a, y, pw, ph, t }); };
    if (sw.look === 'glass') { P('g', len / 2, o.y0 + H9 / 2, len - 0.1, H9 - 0.1, 0.03); [0.03, len - 0.03].forEach(a => P('p', a, o.y0 + H9 / 2, 0.06, H9, 0.05, 0xc9cdd1)); P('p', len / 2, o.y0 + H9 - 0.03, len - 0.1, 0.06, 0.05, 0xc9cdd1); P('p', len / 2, o.y0 + 0.06, len - 0.1, 0.12, 0.05, 0xc9cdd1); P('p', len - 0.12, o.y0 + 1.0, 0.03, 0.9, 0.12, 0xb8bcc0); }
    else if (sw.look === 'quilt') { P('q', len / 2, o.y0 + H9 / 2, len, H9, 0.06); if (w < 0.8) P('p', len / 2, o.y0 + 1.55, 0.25, 0.35, 0.07, 0xbfd8e2); P('p', len - 0.1, o.y0 + 1.05, 0.04, 0.6, 0.14, 0x8a5a36); }   // 좁은 짝 = 작은 창 · 세로 나무 막대 손잡이
    else { P('p', len / 2, o.y0 + H9 / 2, len, H9, 0.05, sw.color ?? 0xf2f2f0); P('p', len / 2, o.y0 + 1.5, Math.min(0.35, len * 0.4), 0.5, 0.06, 0xd6e4ea); P('p', len - 0.1, o.y0 + 1.0, 0.12, 0.04, 0.12, 0x9aa0a6); }
    return { hinge, s, parts, w: len };
  });
  o.lineC = line;
});
const swingInst = {}; let swingR = 0; const _swC = new THREE.Vector3();
SWING.forEach(o => _swC.add(new THREE.Vector3(o.bx, o.y0 + 1.2, o.bz))); if (SWING.length) _swC.divideScalar(SWING.length);
SWING.forEach(o => { swingR = Math.max(swingR, Math.hypot(o.bx - _swC.x, o.bz - _swC.z) + o.ow + 1.5); });
[['q', new THREE.MeshLambertMaterial({ color: 0xffffff, map: quiltTex })], ['p', new THREE.MeshLambertMaterial({ color: 0xffffff })], ['g', glassMat]].forEach(([k, mat]) => {
  const n = SWP[k].length, im = new THREE.InstancedMesh(_boxG, mat, Math.max(1, n)); im.count = n; swingInst[k] = im;
  if (k !== 'g') { const _c9 = new THREE.Color(); SWP[k].forEach((col, i) => im.setColorAt(i, _c9.set(col))); if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  im.boundingSphere = new THREE.Sphere(_swC.clone(), swingR); im.visible = n > 0; scene.add(im); });
const _sQ = new THREE.Quaternion(), _sY = new THREE.Vector3(0, 1, 0);
function setSwing(o) {
  const th = o.open * 1.45, X = o.ax === 'x', n = o.swing.n || 1;
  for (const L of o.lv) {
    const dA = L.s * Math.cos(th), dN = n * Math.sin(th);          // 짝 방향(벽 축 성분 · 법선 성분)
    const dx = X ? dA : dN, dz = X ? dN : dA;
    _sQ.setFromAxisAngle(_sY, Math.atan2(-dz, dx));
    const hx = X ? L.hinge : o.lineC, hz = X ? o.lineC : L.hinge;
    for (const p of L.parts) { _dP.set(hx + dx * p.a, p.y, hz + dz * p.a); _dS.set(p.pw, p.ph, p.t); swingInst[p.mesh].setMatrixAt(p.i, _dM.compose(_dP, _sQ, _dS)); }
  }
  for (const k in swingInst) swingInst[k].instanceMatrix.needsUpdate = true;
}
// 여닫이 문이 쓸고 가는 자리(짝마다 경첩 → 다 연 자리까지의 사분면 상자)에 얇은 부재가 있는가
function swingHits(o) {
  let n = 0; const X = o.ax === 'x', nn = o.swing.n || 1;
  for (const L of o.lv) { const len = L.w;
    const a0 = Math.min(L.hinge + L.s * 0.02, L.hinge + L.s * len), a1 = Math.max(L.hinge + L.s * 0.02, L.hinge + L.s * len), b0 = Math.min(o.lineC + nn * 0.16, o.lineC + nn * (len + 0.1)), b1 = Math.max(o.lineC + nn * 0.16, o.lineC + nn * (len + 0.1));
    const R9 = X ? [a0, a1, b0, b1] : [b0, b1, a0, a1];
    for (const b of world.allBoxes) { if (b.wall || b.y1 - b.y0 >= 2.6 || b.y1 <= o.y0 + 0.02 || b.y0 >= o.y0 + o.h) continue;
      if (b.x1 <= R9[0] || b.x0 >= R9[1] || b.z1 <= R9[2] || b.z0 >= R9[3]) continue; n++; } }
  return n;
}
function setDoor(o) {
  if (o.swing) { setSwing(o); return; }
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
const DOOR_ACT = [];   // NPC-MOVE(found2): 걷는 대역 사람 자리({x,y,z} — worldfx.js가 넣고 뺀다) — 사람이 다가가면 문이 열린다
function doorTick(dt) {
  for (const o of DOORS) {
    const dx = P.x - o.bx, dz = P.z - o.bz;
    let near = dx * dx + dz * dz < 9 && Math.abs(P.y - o.y0) < 2;
    if (!near) for (let i = 0; i < DOOR_ACT.length; i++) { const a = DOOR_ACT[i], ax = a.x - o.bx, az = a.z - o.bz; if (ax * ax + az * az < 4 && Math.abs(a.y - o.y0) < 2) { near = true; break; } }
    const target = o.lock ? 0 : o.hold != null ? o.hold : near ? 1 : 0;   // ENGINE-1: 잠근 문(map.story lockDoor)은 닫힌 채 · WORLD-FX: o.hold = 게임이 연/닫은 채(1/0)
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
  if (o.swing) { o.dir = 1; o.slide = 0; setDoor(o); return; }
  if (o.over) { o.dir = 1; o.slide = o.ow + 0.05; setDoor(o); return; }
  o.dir = sweepHits(o, 1) <= sweepHits(o, -1) ? 1 : -1;
  // 끝까지 못 여는 자리(옆 벽 속에 창이 있는 곳)는 부딪히기 직전까지만 연다 — 문짝이 창 유리를 뚫고 나오지 않게
  o.slide = o.ow + 0.05;
  while (o.slide > 0.3 && sweepHits(o, o.dir, o.slide)) o.slide -= 0.05;
  setDoor(o);
});
function doorCheck() {
  const bad = [];
  for (const o of DOORS) if (o.swing ? swingHits(o) : !o.over && sweepHits(o, o.dir, o.slide)) bad.push([+o.bx.toFixed(1), +o.bz.toFixed(1)]);
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
let flagT = 0, flagAcc = 1, flagW = null;
function skyTick(dt) {
  clouds.position.set(camera.position.x, 0, camera.position.z); clouds.rotation.y += dt * 0.004;
  skyDome.position.copy(camera.position);
  { const c = camera.position, BR = world.details.brect; let o = 1;   // GFX-3 리뷰: 카메라가 건물 칸 안(지붕 아래)이면 유리 반짝임 끔
    if (c.y < 9) for (let i = 0; i < BR.length; i++) { const r = BR[i]; if (c.x > r[0] && c.x < r[1] && c.z > r[2] && c.z < r[3]) { o = 0; break; } }
    if (GLASS_U.uOut.value !== o) { GLASS_U.uOut.value = o; glassApply(timeKey); } }
  if (!flagBase) return;
  // PERF-WIN: 펄럭임은 깃발이 가까울 때(70m — 그 밖은 안개·몇 픽셀)만 30Hz로(법선 다시 계산 포함) — 예전엔 안 보여도 매 프레임
  flagT += dt; flagAcc += dt;
  if (flagAcc < 1 / 30) return;
  if (!flagW) { world.flag.updateMatrixWorld(); flagW = new THREE.Vector3().setFromMatrixPosition(world.flag.matrixWorld); }
  if (camera.position.distanceToSquared(flagW) > 70 * 70) return;
  flagAcc = 0;
  const P = world.flag.geometry.attributes.position, A = P.array;
  for (let i = 0; i < P.count; i++) { const x = flagBase[i*3], y = flagBase[i*3+1], u = (x + 0.7) / 1.4;
    A[i*3+2] = Math.sin(flagT * 3.4 - u * 5.2 + y * 0.9) * 0.11 * u + Math.sin(flagT * 1.3 - u * 2.1) * 0.04 * u;
    A[i*3+1] = y - 0.05 * u * u; }
  P.needsUpdate = true; world.flag.geometry.computeVertexNormals();
}
// 창 유리 시간대 색. 밤 '불 켜진 창' 빛은 밖에서 볼 때만 — 안(uOut 0)에서 내다보면 창이 주황 안개처럼 바깥을 덮어 낮처럼 보였다(GFX-3 리뷰) → 안에선 옅은 유리 그대로
function glassApply(k) {
  if (!world.glassMesh) return;
  const gmat = world.glassMesh.material, glow = GLASS_U.uOut.value > 0.5 && !darkOn;   // G-ESCAPE: 불 끈 밤엔 '불 켜진 창'도 끔
  gmat.emissive.setHex(!glow ? 0x000000 : k === 'night' ? 0xb08a3e : k === 'sunset' ? 0x3a2a14 : 0x000000); gmat.opacity = k === 'night' && glow ? 0.62 : 0.32;
  GLASS_U.uSkyRef.value.setHex(GLASS_SKY[k][0]); GLASS_U.uGndRef.value.setHex(GLASS_SKY[k][1]); GLASS_U.uFr.value = GLASS_SKY[k][2];
}
const GLASS_SKY = { day: [0x8fc3ea, 0x5d6b73, 0.6], sunset: [0xe9b995, 0x5e4a44, 0.55], night: [0x1c2a44, 0x0c1018, 0.22] };   // GFX-3: 유리에 비치는 [하늘, 땅, 세기]
const ORDER = ['day', 'sunset', 'night'];
let timeKey = 'day';
// G-ESCAPE(09-27): 불 끄기 — 형광등(lamp 한 메시) 색을 어둡게 + 하늘빛·해 세기를 줄임 · 비상구 유도등(sign 아틀라스)은 그대로 빛남. 게임이 멈추면 engine reset이 되돌린다
let darkOn = false;
const DARK = { hi: 0.4, si: 0.15, lamp: 0x3a3e48 };
function setDark(on) { on = !!on; if (on === darkOn) return darkOn; darkOn = on; if (world.lampMat) world.lampMat.color.setHex(on ? DARK.lamp : 0xfdfbf2); setTime(timeKey); return darkOn; }
const timeBtn = document.createElement('div');
timeBtn.className = 'chip'; timeBtn.id = 'timeChip';   // TOUCH-1: 터치면 왼쪽 위로(touch.js css)
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
  if (darkOn) { hemi.intensity = t.hi * DARK.hi; sun.intensity = t.si * DARK.si; }   // G-ESCAPE: 불 끄기(게임 map.lights(false)) — 있는 빛의 세기만 줄인다(새 빛 없음)
  glassApply(k);
  { const i = t.label.indexOf(' '); timeBtn.innerHTML = '<span class="ico">' + t.label.slice(0, i) + '</span><span class="lbl">' + t.label.slice(i) + '</span>'; timeBtn.title = t.label; }   // MOBUI-1: 휴대폰은 아이콘만(phone.css .lbl 숨김) — 글자는 데스크톱과 같다
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
function nearStair(x, z) { const L = OCC.stairs; for (let i = 0; i < L.length; i++) { const q = L[i]; if (x > q.x0 - 2 && x < q.x1 + 2 && z > q.z0 - 2 && z < q.z1 + 2) return true; } return false; }   // PERF-WIN: some(닫힘) → 고리(같은 판정)
function occVisible(d, cp, pre) {
  const bx = d.box, BR = world.details.brect[d.bi];
  const x0 = bx.min.x, x1 = bx.max.x, z0 = bx.min.z, z1 = bx.max.z, y0 = bx.min.y, y1 = bx.max.y;
  const inB = cp.x > BR[0] && cp.x < BR[1] && cp.z > BR[2] && cp.z < BR[3];
  const FH0 = world.details.FH, slabOK = d.fl === 1 ? y1 <= FH0 + 0.35 : y0 >= FH0 - 0.05;   // 두 층에 걸친 청크(계단)는 ①을 안 씀
  if (inB && slabOK && d.bi === world.details.wing) { const camFl = cp.y > FH0 + 0.15 ? 2 : 1;   // ① 슬래브
    if (camFl !== d.fl && !nearStair(cp.x, cp.z)) return false; }
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
// PERF-WIN(09-28): 한 프레임 가림 판정 예산(루프만 — SD2.step·검진은 끝까지 잰다). 점검에서 앞뜰·긴 폰 화면 한 프레임 8~20ms 튐 → 가까운 청크부터 4개씩 재다가
//  예산(OCC_BUDGET ms)을 넘기면 남은 청크는 이번 프레임엔 '보임'(안전한 쪽 — 늦게 떠서 깜빡이는 일 없음 · 그리는 양만 잠깐 는다)으로 두고 다음 프레임에 잰다
const OCC_BUDGET = 1.0, OCC_GROUP = 4;
const _pdCmp = (a, b) => ((a.cx - OCC.x) ** 2 + (a.cz - OCC.z) ** 2) - ((b.cx - OCC.x) ** 2 + (b.cz - OCC.z) ** 2);
function detailTick(dt, budget = Infinity) {
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
    const { N, rs, nd, hn } = OCC;
    if (budget < Infinity && _pd.length > OCC_GROUP) _pd.sort(_pdCmp);   // 예산이 있으면 가까운(화면에 크게 보이는) 청크부터
    let g0 = 0;
    while (g0 < _pd.length) { const g1 = budget < Infinity ? Math.min(_pd.length, g0 + OCC_GROUP) : _pd.length; let any = false;
      for (let i = g0; i < g1; i++) { const d = _pd[i], r = occVisible(d, OCC, true); if (r !== -1) { d.mesh.visible = d.on = r; d.pend = 0; continue; }   // 슬래브 너머·카메라가 청크 안 = 광선 없이
        const b = d.box; angSpan(OCC.x, OCC.z, b.min.x, b.max.x, b.min.z, b.max.z, true);   // occVisible과 같은 범위(테 광선까지 — occGap이 앞 광선 벽 목록도 읽는다)
        for (let k = _as[0]; k <= _as[1]; k++) { const kk = ((k % N) + N) % N; if (rs[kk] !== OCC.gen) { rs[kk] = OCC.gen; nd[kk] = 1; hn[kk] = 0; any = true; } } }
      if (any) { occRays(OCC, nd); nd.fill(0); }
      for (let i = g0; i < g1; i++) { const d = _pd[i]; if (d.pend) { d.mesh.visible = d.on = occVisible(d, OCC); d.pend = 0; } }
      g0 = g1; if (performance.now() - t0 > budget) break; }
    for (let i = g0; i < _pd.length; i++) { _pd[i].mesh.visible = true; OCC.defer = (OCC.defer || 0) + 1; } }   // 예산 넘김 — 남은 청크는 보이게 두고(pend 그대로) 다음 프레임에
  if (occW) { OCC.ms = performance.now() - t0; if (!prep) RB.occ[RB.oi++ % RB.occ.length] = OCC.ms; }
  if (!OCC.st) { OCC.st = []; scene.traverse(o => { if (o.userData.st) OCC.st.push(o); }); }
  for (const m of OCC.st) m.visible = _fr.intersectsBox(m.geometry.boundingBox);
}

// ---------- 지도 API(MAP-API-1 · 09-24) — 게임이 받는 지도 계약. 정본 docs/map_api.md ----------
let rebakeT = 0;
MAP = createMapApi({ THREE, scene, camera, renderer, world, SCHOOL,
  q: { groundAt, blockedAt, ceilAt, segHit: camHit },
  pl: { P, ACT, CTRL, keys, touch: TOUCH, acts: ACTS, getYaw: () => camYaw, setYaw: v => { camYaw = v; }, setScale, tinyAdd: c => tinyAdd(c), pBlocked, pGround, scale: () => PHY.sc },   // SHRINK-1: 작아지기(map.player.scale)
  ui: { toast, hint: hintEl, tone, setTime: k => setTime(k), getTime: () => timeKey, dark: on => setDark(on), isDark: () => darkOn }, hot: HOT,
  // ENGINE-1: 행동 사전 고리 — 캐릭터(들기 자리)·문 잠그기(문짝 닫힌 채 — 충돌은 mapapi가)·터치(웅크리기 버튼)
  kid: { pg, KID }, doorLock: (n, on) => { const o = DOORS[n]; if (!o) return false; o.lock = !!on; if (on) { o.open = 0; setDoor(o); } return true; },
  // WORLD-FX(found2): 문 연 채/닫은 채(null = 원래대로 — 다가가면 열림) · 걷는 대역 사람 자리 · 그림자 다시 굽기(바깥 사람을 숨기거나 옮길 때 — 0.6초 몰아서)
  doorHold: (n, v) => { const o = DOORS[n]; if (!o) return false; o.hold = v == null ? null : v ? 1 : 0; return true; }, doorActors: DOOR_ACT,
  rebake: () => { if (!rebakeT) rebakeT = setTimeout(() => { rebakeT = 0; bakeShadows(); }, 600); },
  prewarm: () => prewarm(), idle }, NAV, makeMeta(SCHOOL));   // PERF-WIN: 게임이 시작한 뒤 새 재질 미리 짓기 · 쉬는 시간 부르기(길격자 미리 짓기)   // tone = 게임 효과음(GAME-FIND-1 map.sfx)

// ---------- 자동 해상도(PERF-WIN 09-28 · 학교 윈도 PC = 약한 내장 그래픽 + 배율 125~150%) ----------
// 진짜 프레임 간격(rAF 시각 차)을 최근 2초 창에 모아 0.25초마다 '느린 쪽 8%를 뺀 평균'(ft)을 잰다 — 탭 숨김·250ms 넘는 한두 번 끊김은 버리고(셋 이어지면 느림), 100ms로 자른다.
//  리뷰(09-28): 예전 지수 평균은 강한 60Hz 기기에서 게임 열기·셰이더 짓기 끊김 한 번(100~250ms)에도 1초 넘게 18.5를 넘어 한 칸 내려갔고, 그게 세 번이면 그 칸으로 영영 못 돌아왔다(흐려진 채).
//   느린 쪽 8%를 빼면 2초 안의 끊김 몇 번(≤ 9프레임)은 무시되고, 계속 느린 기기(절반이 33ms·전부 22ms 등)만 느림으로 잡힌다.
//  내리기: ft > 18.5ms(≈54fps 아래)가 1초 이어지면 배율 한 칸(0.25) 내림 — 사다리 = cap부터 0.25씩 0.75까지 + 0.6(바닥).
//  올리기: 시작 배율(start)까지는 '화면 주사율에 딱 맞게 돈다'(ft < 17.5 · 60Hz면 16.7) 또는 ft < 13이 4초 · start 위(cap까지 — 2배 화면)는 ft < 13(진짜 여유)만.
//   한 번 버거웠던 칸으로 다시 오르려면 4초 × 2^실패 횟수(최대 64초) · 세 번 실패한 칸은 이번 판엔 다시 안 오른다(오르락내리락 막기).
//  바닥 칸에선 그림자 지도도 1024로(한 번 다시 굽기 · 2048이던 기기만) — 바닥을 벗어나면 되돌림. 바꾼 뒤 1.5초는 쉬고 창을 비운다(새 창이 1초 차야 판단).
//  재지 않는 때: 오프닝·메뉴·날아오기(TITLE — 첫 셰이더·길격자 짓기와 겹친다) · 탭 숨김. 휴대폰·저사양 판(mobile·low)은 예전 그대로(끔).
//  끄기: ?hq=1(품질 강제) · ?dpr=x(고정) · ?adapt=0 · 게이트·검진·사진 대조 주소. 값 = SD2.gfx(dpr·cap·start·floor·shadow·adapt) · SD2.gfx.auto(ft·단계 log)
const ADAPT = (() => { const L = []; for (let v = GFX.cap; v >= 0.75 - 1e-6; v = Math.round((v - 0.25) * 100) / 100) L.push(v);
  if (!L.includes(GFX.start)) { L.push(GFX.start); L.sort((a, b) => b - a); } if (L[L.length - 1] > 0.6 + 1e-6) L.push(0.6);
  GFX.floor = GFX.adapt ? L[L.length - 1] : GFX.dpr;
  return { ladder: L, lvl: L.indexOf(GFX.start), s0: L.indexOf(GFX.start), ft: 0, buf: new Float32Array(256), srt: new Float32Array(256), bi: 0, bn: 0, winT: 0, evT: 0, big: 0, slowT: 0, goodT: 0, coolT: 3,
    fail: new Map(), steps: 0, last: 0, shadow0: GFX.shadow, log: [], hold: null }; })();
GFX.auto = ADAPT;
function setDpr(v) { GFX.dpr = v; renderer.setPixelRatio(v); }
function setShadowSize(sz) {   // 그림자 지도 크기 바꾸기(자동 해상도 바닥) — 새 지도로 한 번 다시 굽는다
  if (!GFX.shadow || sun.shadow.mapSize.x === sz) return; GFX.shadow = sz; sun.shadow.mapSize.set(sz, sz);
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } bakeShadows();
}
function adaptWin() {   // 최근 2초 창의 '느린 쪽 8%를 뺀 평균'(할당 없음 — 정렬은 미리 만든 배열에)
  const A = ADAPT, B = A.buf, n = Math.min(A.bn, B.length); let k = 0, t = 0;
  for (let j = 1; j <= n && t < 2000; j++) { const v = B[(A.bi - j + B.length) % B.length]; A.srt[k++] = v; t += v; }
  const S = A.srt.subarray(0, k).sort(), m = Math.max(1, Math.ceil(k * 0.92)); let s = 0;
  for (let j = 0; j < m; j++) s += S[j];
  return s / m;
}
function adaptReset(cool) { const A = ADAPT; A.bn = 0; A.winT = 0; A.evT = 0; A.slowT = A.goodT = 0; if (cool != null) A.coolT = Math.max(A.coolT, cool); }
function adaptTick(ts) {
  const A = ADAPT, raw = A.last ? ts - A.last : 0; A.last = ts;
  if (!GFX.adapt || !(raw > 0) || document.hidden) return;   // (첫 호출은 performance.now — rAF 시각이 그보다 앞설 수 있다)
  if (A.hold && A.hold()) { if (A.bn || A.winT) adaptReset(2); return; }   // 오프닝·메뉴 동안은 재지 않고, 끝나면 2초 쉬고 새 창으로
  if (raw > 250) { if (++A.big < 3) return; } else A.big = 0;   // 한두 번 끊김(게임 열기·탭 전환)은 버리고, 250ms 넘는 프레임이 셋 이어지면(아주 느린 기기) 느림으로 센다
  const d = Math.min(100, raw), sec = d / 1000;
  if (A.coolT > 0) { A.coolT -= sec; return; }
  A.buf[A.bi] = d; A.bi = (A.bi + 1) % A.buf.length; A.bn++; A.winT += d; A.evT += d;
  if (A.winT < 1000 || A.evT < 250) return;   // 창이 1초 넘게 찬 뒤 0.25초마다 판단
  const dtE = A.evT / 1000; A.evT = 0; A.ft = adaptWin();
  if (A.ft > 18.5) { A.slowT += dtE; A.goodT = 0; } else A.slowT = 0;
  const L = A.ladder, logp = () => A.log.push([+(performance.now() / 1000).toFixed(1), L[A.lvl], +A.ft.toFixed(1)]);
  if (A.slowT >= 1 && A.lvl < L.length - 1) {   // 내림
    A.fail.set(A.lvl, (A.fail.get(A.lvl) || 0) + 1); A.lvl++; A.steps++; logp();
    setDpr(L[A.lvl]); if (A.lvl === L.length - 1 && A.shadow0 > 1024) setShadowSize(1024);
    adaptReset(1.5); return;
  }
  if (A.lvl === 0) return;
  const up = A.lvl - 1, good = A.ft < 13 || (up >= A.s0 && A.ft < 17.5);   // start 위로는 진짜 여유(13ms)만
  if (good) A.goodT += dtE; else { A.goodT = 0; return; }
  const f = A.fail.get(up) || 0; if (f >= 3) return;
  if (A.goodT >= 4 * Math.min(16, 2 ** f)) {   // 올림
    const wasFloor = A.lvl === L.length - 1; A.lvl = up; A.steps++; logp();
    setDpr(L[A.lvl]); if (wasFloor && A.shadow0 > 1024) setShadowSize(A.shadow0);
    adaptReset(1.5);
  }
}
// ---------- 셰이더 미리 짓기(PERF-WIN) — 첫 프레임 뒤 쉬는 시간에 ----------
// 장면에 있지만 아직 한 번도 안 그려 프로그램이 없는 재질(밤 별 Points · 게임이 만든 물총 자국·숨바꼭질·방탈출 재질 등)만 골라,
//  같은 지오메트리·재질·그림자 받기·인스턴스(색) 설정의 대역 오브젝트를 임시 장면에 두고 renderer.compile(장면 조명·안개 기준) — 원래 오브젝트는 건드리지 않는다(화면 변화 0).
//  병렬 컴파일 확장(KHR_parallel_shader_compile)이 있으면 GPU 쪽이 따로 짓고, 셰이더 오류 검사를 껐으니 처음 그릴 때 주 스레드가 서지 않는다.
//  mapapi가 게임을 시작한 뒤에도 부른다(host.prewarm). 지은 수 = SD2.timing.prewarm
function prewarm() {
  const P9 = renderer.properties, tmp = new THREE.Scene(), mats = []; let k = 0;
  scene.traverse(o => { if (!(o.isMesh || o.isPoints) || !o.material || Array.isArray(o.material)) return; const m = o.material; if (P9.get(m).currentProgram) return; mats.push(m);
    let p; if (o.isInstancedMesh) { p = new THREE.InstancedMesh(o.geometry, m, 1); if (o.instanceColor) p.setColorAt(0, _pwC); } else p = o.isPoints ? new THREE.Points(o.geometry, m) : new THREE.Mesh(o.geometry, m);
    p.receiveShadow = o.receiveShadow; tmp.add(p); k++; });
  if (!k) return 0;
  const t0 = performance.now();
  //  지은 뒤 쉬는 시간에 한 재질씩 uniform·attribute 목록을 읽어 둔다(getUniforms — 링크가 안 끝났으면 여기서 기다림 = 처음 그리는 프레임 대신 쉬는 시간에 · 병렬 컴파일이 없는 GPU(SwiftShader 실측)에서 이게 없으면 밤 전환 때 0.3~1초가 그대로 남았다)
  const touch = () => { const t1 = performance.now(); while (mats.length && performance.now() - t1 < 4) { const pr = P9.get(mats.pop()).currentProgram; if (pr) { try { pr.getUniforms(); pr.getAttributes(); } catch (e) { /* 무시 */ } } } if (mats.length) idle(touch, 400); };
  //  (compileAsync는 안 쓴다 — 기다리는 동안 게임이 멈춰 재질을 버리면 three의 확인 타이머가 'isReady' 오류를 낸다. compile은 컴파일·링크를 던지기만 하고, 기다림은 위 touch가 쉬는 시간에)
  try { renderer.compile(tmp, camera, scene); } catch (e) { return 0; }
  TIMING.prewarm = (TIMING.prewarm || 0) + k; TIMING.prewarmMs = +(performance.now() - t0).toFixed(1); idle(touch, 400); return k;
}
const _pwC = new THREE.Color();
// 쉬는 시간 부르기(requestIdleCallback — 없으면 setTimeout)
function idle(fn, timeout = 1500) { return window.requestIdleCallback ? requestIdleCallback(fn, { timeout }) : setTimeout(() => fn({ timeRemaining: () => 8, didTimeout: true }), 60); }   // (함수 선언 — mapapi host가 먼저 받는다)

// ---------- 루프 + 예산 계측(헌법⑥) ----------
const clock = new THREE.Clock();
const fpsBox = document.getElementById('fps');
let acc = 0, n = 0, simMs = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  if (!ADAPT.ext) adaptTick(ts || performance.now());   // PERF-WIN 자동 해상도(진짜 프레임 간격 · ext = 시험이 가짜 시각을 넣는 동안 끔)
  const dt = Math.min(0.05, clock.getDelta());
  const t0 = performance.now();
  if (ts) { if (MOUSE.fl) MOUSE.fd = Math.min(120, Math.max(1, ts - MOUSE.fl)); MOUSE.fl = ts; }
  mouseApply();   // PERF-WIN: 이 프레임에 모인 마우스 움직임을 한 번에
  step(dt);
  doorTick(dt);
  hotTick(dt);
  MAP.tick(dt);   // 구역·트리거·경계 10Hz + 게임 tick(게임 몫 ms는 MAP.game.lastMs)
  keysFrameEnd();   // PERF-WIN: 이번 시뮬레이션이 본 '톡 친 키'를 뗀다
  simMs = Math.max(simMs, performance.now() - t0);
  skyTick(dt);
  detailTick(dt, OCC_BUDGET);
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
    fpsBox.textContent = fps + ' fps · ' + GFX.dpr + 'x · ' + dc + ' dc · sim ' + simMs.toFixed(2) + 'ms' + (MAP.game.current ? ' · game ' + MAP.game.lastMs.toFixed(2) + 'ms' : '');
    if (dc > 300) console.warn('예산 초과: drawCalls', dc);
    if (simMs > 1) console.warn('예산 초과: sim ms', simMs.toFixed(2));
    acc = 0; n = 0; simMs = 0;
  }
}
loop();
TIMING.firstFrameMs = performance.now();   // 첫 프레임(페이지 시작부터 ms) — 그 뒤 로딩 막을 걷는다
// TITLE-1: 오프닝 — 로딩 막을 제목 화면으로 걷는다(v2/js/title.js · 모양 v2/title.css). 꺼져 있으면(게이트·게임 주소) 예전처럼 막만 걷는다
const TITLE = TITLE_ON ? createTitle({ THREE, camera, P, CTRL, keys, touch: TOUCH, SCHOOL, tone, toast, game: MAP.game, picker: MAP.picker, setCam: f => { CAM_OVR = f; } }) : null;
if (TITLE) ADAPT.hold = () => TITLE.phase !== 'off';   // PERF-WIN 리뷰: 오프닝·메뉴·날아오기 동안 자동 해상도는 재지 않는다
if (TITLE) TITLE.bootDone(); else document.getElementById('boot')?.remove();
warmDone();
// PERF-WIN: 첫 화면이 뜬 뒤 쉬는 시간에 — ① 아직 안 지은 셰이더(밤 별 등) ② 게임 길격자(첫 게임을 열 때 1초 뚝뚝 끊기던 것 · 쉬는 조각 ≤8ms · mapapi navIdle)
//  게이트·검진 주소는 예전 그대로(그쪽은 navSync로 새로 짓는다)
idle(() => prewarm());
if (!/[?&](check|health)=1/.test(location.search)) idle(() => MAP.navIdle && MAP.navIdle(), 3000);

// PAUSE-1(09-28 사용자 "Alt+Tab이나 Esc를 누르지 않으면 메뉴를 못 누르는 듯"): 마우스가 잠긴 동안엔 커서가 없어 🏠·🎮 칩을 못 누른다.
//   Esc(브라우저가 잠금을 푼다)로 잠금이 풀리면 '잠깐 멈춤' 창 — ▶ 계속하기(다시 잠금) · 🏠 메뉴로 · 🎮 놀이 바꾸기. 게임·창이 스스로 푼 잠금(쪽지·고르기 창 등 = 멈춤·창 열림)은 띄우지 않는다.
{
  const pz = document.createElement('div'); pz.id = 'pause';
  pz.style.cssText = 'position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(20,30,50,.45);font-family:inherit';
  pz.innerHTML = '<div style="background:#fffdf5;border:4px solid #1d3557;border-radius:18px;padding:18px 22px;min-width:240px;text-align:center;box-shadow:0 8px 0 #1d3557;color:#1d3557">'
    + '<div style="font-size:22px;font-weight:800;margin-bottom:12px">⏸ 잠깐 멈춤</div>'
    + '<button data-a="go">▶ 계속하기</button><button data-a="menu">🏠 메뉴로</button><button data-a="pick">🎮 놀이 바꾸기</button>'
    + '<div style="font-size:12px;color:#5a6a80;margin-top:8px">1·Enter 계속 · 2 메뉴 · 3 놀이 · P/Esc = 멈춤 창</div></div>';
  pz.querySelectorAll('button').forEach(b => b.style.cssText = 'display:block;width:100%;min-height:46px;margin:8px 0 0;border:0;border-radius:12px;background:#ffd23f;color:#1d3557;font:inherit;font-size:17px;font-weight:700;cursor:pointer');
  document.body.appendChild(pz);
  let userLock = false;   // 잠금이 사용자 클릭으로 걸렸는지(게임이 스스로 풀 때와 구분)
  const hide = () => { pz.style.display = 'none'; };
  const busy = () => CTRL.frozen || (TITLE && TITLE.phase !== 'off')   // 오프닝·메뉴·날아오는 중 · 게임이 멈춘(쪽지·대화) 동안
    || (MAP.picker && MAP.picker.panel) || document.querySelector('.eng-note,.hudAsk,.esc-lock,#tour-talk,#story-talk');
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) { userLock = true; hide(); return; }
    if (!userLock) return; userLock = false;
    setTimeout(() => { if (!document.pointerLockElement && !busy()) show(); }, 120);   // 창이 곧 뜨는 경우(쪽지 등)는 그 창이 먼저
  });
  pz.addEventListener('click', e => {
    const a = e.target.dataset && e.target.dataset.a; e.stopPropagation();
    if (a === 'menu') { hide(); if (TITLE) TITLE.backToMenu(); else location.href = location.pathname; return; }   // 게임 주소로 들어왔으면 오프닝(메뉴)이 있는 첫 화면으로
    if (a === 'pick') { hide(); MAP.picker && MAP.picker.open(); return; }
    hide(); if (!TOUCH.on) canvas.requestPointerLock();   // 계속하기 · 빈 곳 누름
  });
  const show = () => { keys.clear(); pz.style.display = 'flex'; };
  // 단축키(09-28 사용자 "메뉴·게임 키도 버튼 할당"): P = 멈춤 창(잠금 중에도 — 잠금을 풀고 창) · G = 🎮 놀이 고르기 · 멈춤 창 안: Enter/Space/1 계속 · 2 메뉴로 · 3 놀이 바꾸기 · Esc 닫기
  addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    const on = pz.style.display === 'flex';
    if (on) {
      const a = { Enter: 'go', NumpadEnter: 'go', Space: 'go', Digit1: 'go', Digit2: 'menu', Digit3: 'pick', KeyP: 'go', Escape: 'close' }[e.code];
      if (!a) return; e.preventDefault(); e.stopImmediatePropagation();
      if (a === 'close') hide(); else pz.querySelector('[data-a="' + a + '"]').click();
      return;
    }
    if (TITLE && TITLE.phase !== 'off') return;   // 오프닝·메뉴에선 그 화면의 키
    if (e.code === 'KeyP') { e.preventDefault(); userLock = false; document.exitPointerLock?.(); show(); }
    else if (e.code === 'KeyG' && !CTRL.frozen) { e.preventDefault(); document.exitPointerLock?.(); MAP.picker && (MAP.picker.panel ? MAP.picker.close() : MAP.picker.open()); }
  }, true);
  window.__pause = { show, hide, get on() { return pz.style.display === 'flex'; }, busy };
}

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
  yaw(v) { camYaw = v; }, pitch(v) { if (v != null) camPitch = Math.max(-0.2, Math.min(1.1, v)); return camPitch; },   // 시험용(리뷰 SHRINK)
  pos: () => [P.x.toFixed(1), P.y.toFixed(1), P.z.toFixed(1)],
  step(nn = 1, keyList = []) { keyList.forEach(k => keys.add(k)); for (let i = 0; i < nn; i++) { mouseApply(); step(1/60); doorTick(1/60); hotTick(1/60); MAP.tick(1/60); keysFrameEnd(); } keyList.forEach(k => keys.delete(k)); detailTick(1); renderer.render(scene, camera); },
  doors: () => DOORS.length, doorCheck,
  near: () => hotNear && hotNear.label, act: () => hotNear && act(hotNear),
  acts: ACTS, hotNow: () => hotNear, actOn: h => act(h), camOvr: f => { CAM_OVR = f; }, pg,   // ACTION-1: 보이는 행동(시험 — SD2.acts.play('drink', {at:[x,y,z]}) · stats())
  touch: TOUCH, gfx: GFX, title: TITLE, input: { keys, KEY_NEW, KEY_UP, MOUSE, clear: keysClear }, prewarm, setDpr, setShadowSize, adaptTick,   // PERF-WIN
  cam: () => [+camYaw.toFixed(3), +camPitch.toFixed(3), camFirst],   // TOUCH-1: 터치 상태·성능 판·시점(시험용)
  // MAP-API-1: 지도 API · 물리 함수(검진·게임과 같은 식) · 맵 건강 검진(health.js 지연 로드 — Promise)
  map: MAP, phys: { groundAt, blockedAt, ceilAt, camHit, PHY, pGround, pBlocked, pCeil }, ACT, CTRL, camPose: (...a) => ({ ...camPose(...a) }),
  health: opt => import('./health.js?v=6').then(m => m.runHealth(window.SD2, opt || {})),
  // PERF-LOAD(09-26): 로드·프레임 계측 — buildMs·firstFrameMs(ms) · 최근 240프레임 CPU p50/p95(렌더 제외) · 가림 컬링 재계산 p95. reset() 뒤 걸어 보고 읽는다
  timing: Object.defineProperties(TIMING, {
    frameCpuP50: { get: () => rbPct(RB.cpu, RB.ci, 0.5), enumerable: true }, frameCpuP95: { get: () => rbPct(RB.cpu, RB.ci, 0.95), enumerable: true },
    occP95: { get: () => rbPct(RB.occ, RB.oi, 0.95), enumerable: true }, reset: { value: () => { RB.ci = RB.oi = 0; } } }),
};
// 게임 로더(MAP-API-1): ?game=이름 → v2/games/registry.js 허용 목록 → export default start(map) (사진 대조 모드에선 안 켠다)
{ const QS = new URLSearchParams(location.search), GAME = QS.get('game') || (QS.get('tour') === '1' ? 'tour' : null); if (GAME && !SHOT) MAP.game.load(GAME, Object.fromEntries(new URLSearchParams(location.search))); }
