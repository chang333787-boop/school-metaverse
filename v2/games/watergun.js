// 물총 놀이(GAME-WG · 09-26 · G3-WG 09-27) — 3인칭 물총. 정본 문서 = docs/map_api.md §10
// 사용자 09-26 "tps 물총은 구현해도 될 듯 — 그 정도는 폭력적이진 않은 듯". 폭력 없음: 사람(NPC)은 과녁이 아니다 · 무기 모양 없음(장난감 물총) · 맞으면 '젖음' 칸만 찬다(피·죽음 없음).
// 놀이 셋(판을 시작하기 전에 고름 · 주소 ?mode=solo|team&arena=field|box 로 바로):
//   🎯 혼자 연습 = 과녁(물풍선·장난감 모닥불·목마른 꽃·동글동글 로봇) 3분 점수
//   🔵⚪ 팀 대결 = 청팀(나 + 봇 3) vs 백팀(봇 4) · 흠뻑 젖으면 3초 뒤 우리 진지에서 다시 · 먼저 N번 적시기(기본 15) 또는 5분
//        경기장 ① 운동장(골대 앞 = 진지) ② 컨테이너 경기장(운동장 위에 컨테이너·발판·비탈·낮은 벽 — 가운데 점 대칭 · 충돌 + 길격자 막기 = map.world.spawn)
//   팀 봇 = 치비 장난감 로봇(팀 조끼·모자 — 게임 배우, 사람 아님 · 이름 없음 '청팀 봇 2')
// 구조(네트워크 대비): 배우(ACT) = 상태만 · 봇 두뇌(brain)는 '명령'(움직일 곳·겨눌 곳·쏘기)만 만든다 → 나중에 네트워크 층이 원격 명령·사건(soak)으로 바꿔 끼울 자리 = cmdOf()·emit()
// 규칙(_template.js): ① import 금지(three = map.three) ② 사람 NPC·인물 대사 금지 — 화면 글자는 UI 문구뿐 ③ 소품은 월드 면에서 띄움 ④ 새 조명 없음
//   ⑤ 그리기 = 전부 InstancedMesh 풀, 매 프레임 새 객체 없음 · 놀이마다 안 쓰는 풀은 visible=false(드로우콜 0)
// 조작: 마우스 왼쪽 누르고 있기(시점 잠금 뒤) 또는 F = 물 쏘기 · 터치 = 💧 버튼 · 다른 입력 = SD2.map.press('fire', true/false) · Tab/📋 칩 = 점수판(팀 대결)
// G3-WG '갑자기 위로 쏘는 현상'(09-27) — 원인과 고침은 computeAim 위 주석
// WG-NET(10-03 교사 '물총 친구끼리 대결 실시간'): 👥 친구와 팀 대결 = 함께하기 방(lobby.js) 친구들 + 빈자리 봇 · Firebase match/c<번호> — 대기실(팀·경기장·시간) → 방장 ▶ 시작 → 모두 같은 서버 시각에 3·2·1
//   판정: 사람은 맞은 사람 화면이(내 화면에서 닿으면 맞음) · 봇은 방장 화면이(방장 아닌 사람이 쏜 물은 쏜 사람이 'hit'으로 알림) · 점수 = 모두가 받은 soak 사건으로 같이 셈
//   보내기: 내 상태 초당 10번(이전 것이 도착한 뒤에만 — 순서 뒤집힘 없음) · 방장은 봇 상태 초당 10번 · 받기: match 한 갈래 스트림 · 친구 몸은 부드럽게 따라감(12/초)
export const meta = { id: 'watergun', title: '물총 놀이', api: 1 };

const ROUND = 180, SHOULDER = 0.55, TANK = 100, USE = 12, REFILL = 60, RATE = 50, SPEED = 15, G = 9.8, BOT_SPEED = 10;
const FPS_SPEED = 19;   // WG-FPS(10-03): 내 물줄기 = 십자선 방향 그대로 초속 19m(포물선은 중력 그대로 — 위로 보면 멀리)
const PMAX = 560, MMAX = 48, N_BAL = 6, N_FIRE = 3, N_FLOW = 4, N_BOT = 3;
const HP_BAL = 3, HP_FIRE = 34, HP_FLOW = 38, HP_BOT = 12;
const PTS = { bal: 10, fire: 30, flow: 20, bot: 25 };
const ZONES = ['field', 'bball-sand'];                      // 운동장(본 구역) + 농구 모래 구역 — 과녁·로봇 자리
const BOT_RECT = [-38, -10.6, 38.8, 40.2];                    // 로봇이 다니는 네모(운동장 + 농구 모래 · 둔덕 발치·울타리 안)
const ARENA = [-42, -17.5, 47.5, 42.3];                      // 놀이 경계(구령대·개수대 포함) — 밖으로 0.25초 넘게 나가면 되돌림
const WATER_C = 0x8fd8ff, BOT_WATER_C = 0x9ff0dc, STEAM_C = 0xeef2f5, WET_C = 0x93a3b3;
const BAL_C = [0xff7aa8, 0xffd23c, 0x6ec8ff, 0x8de08a, 0xffa04a, 0xc79bff], FLOW_C = [0xff6f91, 0xffc93c, 0xb57bff, 0xff8a5c], BOT_C = [0xbff5d8, 0xffd9bd, 0xdcd3ff];
// ---------- 팀 대결 ----------
const T_GOAL = 15, T_TIME = 300, T_RESPAWN = 3, T_INV = 1.5, T_HIT = 6, T_RATE = 24, T_RANGE = 15, T_SIGHT = 22, T_WALK = 3.2;
const MDB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse/match/';
const TEAM_C = [0x3b82f6, 0xf3f5f8], TEAM_W = [WATER_C, BOT_WATER_C], TEAM_N = ['청팀', '백팀'], TEAM_I = ['🔵', '⚪'], TEAM_CSS = ['#7fb2ff', '#ffffff'];
// 진지 = 골대 앞 7m(서 골대 가운데 z 17.55 · 동 골대 z 14.55 — 운동장 골대가 실제로 z가 어긋나 있다 · 골대에 붙이면 카메라가 그물 뒤에 선다) · 경기장은 두 진지 가운데 C를 중심으로 점 대칭
const BASES = [{ x: -28.3, z: 17.55 }, { x: 19.6, z: 14.55 }], TC = { x: (BASES[0].x + BASES[1].x) / 2, z: (BASES[0].z + BASES[1].z) / 2 };
const T_RECT = [-37.6, 1.2, 28.2, 31.5];                      // 팀 대결 놀이 경계(골대 뒤·운동장 가장자리 띠는 뺌 — 8명이 만나게)
// 컨테이너 경기장(청팀 쪽 절반 — u = x − C.x · v = z − C.z · 백팀 쪽은 (−u, −v)·방위 +180으로 자동) · 가운데 것은 스스로 대칭
const BOX_HALF = [
  ['container', -11, 6.5, 0, { color: 0xf08a3a }], ['container', -7.5, -7.2, 90, { color: 0x4fae5a }],
  ['platform', -17, 10, 0, { size: [3, 1.3, 3], color: 0x8fb8e8 }], ['ramp', -17, 7.3, 180, { size: [1.6, 1.3, 2.4], color: 0x8fb8e8 }],
  ['platform', -19, 3.6, 0, { size: [0.4, 1.0, 3.2], color: 0xe8e2d4 }], ['platform', -16.5, -5.5, 0, { size: [3.2, 1.0, 0.4], color: 0xe8e2d4 }],
  ['platform', -4.5, 9, 0, { size: [3.2, 1.0, 0.4], color: 0xe8e2d4 }], ['platform', -20.3, -2.4, 0, { size: [0.4, 1.0, 2.6], color: 0xe8e2d4 }],
  ['crate', -13.2, -1.2, 0, { s: 1.2 }], ['crate', -13.2, -0.1, 0, { s: 1.2 }],
  ['ramp', -3.2, 0, 90, { size: [1.6, 1.2, 2.4], color: 0xffc93c }],
];
const BOX_MID = [['platform', 0, 0, 0, { size: [4, 1.2, 4], color: 0xffc93c }]];
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const wrapA = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

export default async function start(map, params = {}) {
  const THREE = map.three, Q = map.q, cam = map.camera;
  let dead = false, st = 'prep', mode = null, arenaKey = null, round = 0, T = 0, cd = 0, cdShown = -1, secShown = -1;
  let score = 0, tank = TANK, wet = 0, wetT = 9, slowT = 0, soakT = 0, emitAcc = 0, sprayT = 0, emptyT = 0, gurT = 0, inWater = 0, muted = false;
  let best = map.store.get('best', null), last = null, goalT = 0;
  const cnt = { bal: 0, fire: 0, flow: 0, bot: 0, wet: 0 };
  const ROUND_S = Math.max(10, Math.min(600, +params.time || ROUND));
  const seed = params.seed != null && params.seed !== '' ? (isNaN(+params.seed) ? params.seed : +params.seed) : Date.now();
  const rng = map.rng(seed);
  const inp = { key: false, mouse: false, pad: false, test: false, tap: false };
  let aimOverride = null;
  let ME = 0;   // 내 배우 번호(혼자 팀 대결 = 0 · 친구 대결 = 청 0~3 / 백 4~7 중 내 자리)

  map.player.freeze(true);
  const prepBan = map.hud.banner('물총 준비 중…', 30);
  map.sfx('warm');
  const nav = await map.nav();
  if (dead || map.gone) return {};   // 리뷰(09-26): 길격자를 짓는 사이 ⏹ 그만하기/다른 놀이 → 범위가 이미 정리됨. 여기서 만들면 HUD·메시·멈춤이 영영 남았다
  prepBan.remove();

  // ---------- 모양 굽기(부위마다 정점색 · 한 메시) — kid.js bake와 같은 식 ----------
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _n = new THREE.Vector3(), _f = new THREE.Vector3();
  const _Z = new THREE.Vector3(0, 0, 1), _nm = new THREE.Matrix3(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const GEOS = [], MATS = [];
  const SPH = new THREE.SphereGeometry(1, 14, 10), SPHS = new THREE.SphereGeometry(1, 8, 6), CYL = new THREE.CylinderGeometry(1, 1, 1, 12, 1), CONE = new THREE.CylinderGeometry(0.72, 1, 1, 14, 1);
  function bake(parts) {
    const pos = [], nor = [], cl = [];
    for (const [geo, p, sc, hex, r] of parts) {
      const g = geo.index ? geo.toNonIndexed() : geo, Pa = g.attributes.position, Na = g.attributes.normal;
      _m4.compose(_v.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(...(r || [0, 0, 0]))), _s.set(sc[0], sc[1], sc[2])); _nm.getNormalMatrix(_m4); _c.set(hex);
      for (let i = 0; i < Pa.count; i++) { _v.fromBufferAttribute(Pa, i).applyMatrix4(_m4); pos.push(_v.x, _v.y, _v.z); _n.fromBufferAttribute(Na, i).applyMatrix3(_nm).normalize(); nor.push(_n.x, _n.y, _n.z); cl.push(_c.r, _c.g, _c.b); }
      if (g !== geo) g.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    GEOS.push(g); return g;
  }
  const lamV = (emi = 0x1a1a1a) => { const m = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: emi }); MATS.push(m); return m; };
  function inst(geo, mat, n) { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.castShadow = m.receiveShadow = false;
    for (let i = 0; i < n; i++) m.setMatrixAt(i, ZERO); m.setColorAt(0, _c.set(0xffffff)); for (let i = 1; i < n; i++) m.setColorAt(i, _c); map.add(m); return m; }
  const X = Math.PI / 2;
  // 물풍선(받침대 위) · 받침대
  const balGeo = bake([[SPH, [0, 0, 0], [0.25, 0.3, 0.25], 0xffffff], [CONE, [0, -0.31, 0], [0.045, 0.06, 0.045], 0xffffff]]);
  const standGeo = bake([[CYL, [0, 0.025, 0], [0.22, 0.05, 0.22], 0x8d99a6], [CYL, [0, 0.5, 0], [0.025, 1.0, 0.025], 0xf2f4f6], [CYL, [0, 0.99, 0], [0.09, 0.05, 0.09], 0xffc93c]]);
  // 장난감 모닥불: 돌 둘레 + 통나무 셋 · 불꽃(조명 무시 — 바깥 주황·안 노랑)
  const pitParts = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; pitParts.push([SPHS, [Math.cos(a) * 0.4, 0.06, Math.sin(a) * 0.4], [0.12, 0.08, 0.1], k % 2 ? 0x9aa0a6 : 0xb7bcc1, [0, -a, 0]]); }
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI; pitParts.push([CYL, [0, 0.1, 0], [0.06, 0.62, 0.06], 0x8a5a3a, [X, a, 0]]); }
  const pitGeo = bake(pitParts);
  const flameGeo = bake([[SPH, [0, 0.36, 0], [0.22, 0.4, 0.22], 0xff8a2a], [SPH, [0, 0.3, 0.03], [0.13, 0.26, 0.13], 0xffe45c], [SPHS, [0.12, 0.26, -0.05], [0.09, 0.18, 0.09], 0xff6a2a]]);
  // 목마른 꽃 화분: 화분(테라코타) · 줄기+잎(뿌리 = 흙 위 원점, 목마르면 기운다) · 꽃머리(흰 꽃잎 → 화분마다 색 · 노란 가운데)
  const potGeo = bake([[CONE, [0, 0.17, 0], [0.21, 0.34, 0.21], 0xc8663c, [Math.PI, 0, 0]], [CYL, [0, 0.335, 0], [0.235, 0.05, 0.235], 0xd67a4e], [CYL, [0, 0.355, 0], [0.2, 0.02, 0.2], 0x4a3326]]);
  const stemGeo = bake([[CYL, [0, 0.22, 0], [0.018, 0.44, 0.018], 0x4f9a3c], [SPHS, [0.07, 0.16, 0], [0.08, 0.02, 0.04], 0x5fae48, [0, 0, 0.5]], [SPHS, [-0.07, 0.24, 0], [0.08, 0.02, 0.04], 0x5fae48, [0, 0, -0.5]]]);
  const headParts = [[SPHS, [0, 0, 0.01], [0.065, 0.065, 0.05], 0xffd84a]];
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; headParts.push([SPHS, [Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0], [0.075, 0.045, 0.025], 0xffffff, [0, 0, a]]); }
  const headGeo = bake(headParts);
  // 장난감 로봇(앞 = +z · 키 ≈1.2m): 둥근 몸·둥근 머리·어두운 얼굴판 + 하늘색 눈 둘 · 더듬이 · 짧은 팔 · 배 앞 작은 물 꼭지(파랑) · 둥근 발
  const botGeo = bake([
    [SPH, [0, 0.44, 0], [0.34, 0.31, 0.32], 0xf6f8fb], [SPHS, [0, 0.42, 0.2], [0.2, 0.16, 0.13], 0xe3ebf3],
    [SPH, [0, 0.86, 0], [0.27, 0.24, 0.26], 0xf6f8fb], [SPHS, [0, 0.87, 0.14], [0.2, 0.135, 0.13], 0x243249],
    [SPHS, [-0.075, 0.885, 0.255], [0.042, 0.052, 0.02], 0x9ff4ff], [SPHS, [0.075, 0.885, 0.255], [0.042, 0.052, 0.02], 0x9ff4ff],
    [CYL, [0, 1.16, 0], [0.014, 0.14, 0.014], 0x9aa3ad], [SPHS, [0, 1.25, 0], [0.045, 0.045, 0.045], 0xff7b7b],
    [SPHS, [-0.35, 0.46, 0.04], [0.08, 0.1, 0.08], 0xe9eef4], [SPHS, [0.35, 0.46, 0.04], [0.08, 0.1, 0.08], 0xe9eef4],
    [CYL, [0.16, 0.42, 0.33], [0.035, 0.14, 0.035], 0x3aa0ff, [X, 0, 0]], [SPHS, [0.16, 0.42, 0.41], [0.045, 0.045, 0.03], 0x7cc4ff],
    [SPHS, [-0.13, 0.07, 0.03], [0.1, 0.07, 0.13], 0x5a6270], [SPHS, [0.13, 0.07, 0.03], [0.1, 0.07, 0.13], 0x5a6270]]);
  // 물총(앞 = +z · 원점 = 손잡이 위): 주황 몸 · 파란 물통 · 노란 꼭지
  const gunGeo = bake([[CYL, [0, 0, 0.02], [0.055, 0.3, 0.055], 0xff8a3d, [X, 0, 0]], [SPHS, [0, 0.09, -0.03], [0.085, 0.08, 0.085], 0x4fb3ff],
    [CYL, [0, 0, 0.2], [0.022, 0.1, 0.022], 0xffd23c, [X, 0, 0]], [CYL, [0, -0.08, -0.06], [0.03, 0.14, 0.04], 0xe0702a, [0.3, 0, 0]]]);
  // 장난감 물통(파란 통 · 흰 띠 · 꼭지)
  const barrelGeo = bake([[CYL, [0, 0.4, 0], [0.32, 0.8, 0.32], 0x3b82d6], [CYL, [0, 0.2, 0], [0.335, 0.05, 0.335], 0xf4f6f8], [CYL, [0, 0.6, 0], [0.335, 0.05, 0.335], 0xf4f6f8],
    [CYL, [0, 0.82, 0], [0.29, 0.04, 0.29], 0x6aa6ea], [CYL, [0, 0.3, 0.36], [0.03, 0.12, 0.03], 0xc9ced3, [X, 0, 0]], [SPHS, [0, 0.27, 0.43], [0.04, 0.03, 0.04], 0x8fd8ff]]);
  // 팀 봇(치비 장난감 로봇 · 앞 = +z · 발 = 0 · 키 ≈1.38): 몸(머리·얼굴판·눈·더듬이·배 앞에 두 손으로 드는 물총) · 조끼+모자(흰 정점색 → 팀 색 인스턴스) · 다리(엉덩이 축) · 팔(어깨 축)
  const TB = 0xd6dee8;
  const tbodyGeo = bake([
    [CYL, [0, 0.37, 0], [0.15, 0.1, 0.13], 0x5a6270], [SPH, [0, 0.55, 0], [0.19, 0.2, 0.16], TB],
    [SPH, [0, 1.0, 0], [0.3, 0.28, 0.28], TB], [SPHS, [0, 1.0, 0.13], [0.23, 0.17, 0.16], 0x243249],
    [SPHS, [-0.085, 1.02, 0.28], [0.045, 0.058, 0.02], 0x9ff4ff], [SPHS, [0.085, 1.02, 0.28], [0.045, 0.058, 0.02], 0x9ff4ff], [SPHS, [0, 0.935, 0.283], [0.06, 0.016, 0.012], 0x9ff4ff],
    [SPHS, [-0.3, 1.0, 0], [0.045, 0.08, 0.08], 0xb0bac5], [SPHS, [0.3, 1.0, 0], [0.045, 0.08, 0.08], 0xb0bac5],
    [CYL, [0, 1.33, -0.02], [0.012, 0.1, 0.012], 0x9aa3ad], [SPHS, [0, 1.39, -0.02], [0.035, 0.035, 0.035], 0xff7b7b],
    [CYL, [0, 0.6, 0.27], [0.05, 0.3, 0.05], 0xff8a3d, [X, 0, 0]], [SPHS, [0, 0.68, 0.2], [0.07, 0.065, 0.07], 0x4fb3ff], [CYL, [0, 0.6, 0.44], [0.02, 0.08, 0.02], 0xffd23c, [X, 0, 0]]]);
  const tbibGeo = bake([[SPH, [0, 0.555, 0], [0.205, 0.17, 0.175], 0xffffff], [SPHS, [0, 1.1, -0.01], [0.31, 0.2, 0.3], 0xffffff], [CYL, [0, 1.14, 0.2], [0.19, 0.025, 0.13], 0xffffff]]);
  const tlegGeo = bake([[CYL, [0, -0.15, 0], [0.068, 0.26, 0.068], 0x5a6270], [SPHS, [0, -0.3, 0.04], [0.085, 0.055, 0.12], 0xf6f6f2]]);
  const tarmGeo = bake([[SPHS, [0, -0.12, 0], [0.058, 0.14, 0.058], TB], [SPHS, [0, -0.25, 0], [0.052, 0.052, 0.052], 0xeef2f6]]);
  const vestGeo = bake([[SPH, [0, 0.56, 0.012], [0.176, 0.19, 0.152], 0xffffff]]);   // 내 캐릭터(kid.js — 몸통 캡슐 r 0.155·앞뒤 ×0.82) 위에 입는 조끼

  const M = {
    drop: inst(new THREE.IcosahedronGeometry(1, 0), (() => { const m = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x1d3142 }); MATS.push(m); return m; })(), PMAX),
    mark: inst(new THREE.CircleGeometry(1, 14), (() => { const m = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.MultiplyBlending, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); MATS.push(m); return m; })(), MMAX),   // 곱하기 섞기 = 젖은 곳만 어둡게(흰색 = 그대로) → 마르면 흰색으로
    bal: inst(balGeo, lamV(0x202020), N_BAL), stand: inst(standGeo, lamV(), N_BAL),
    pit: inst(pitGeo, lamV(), N_FIRE), flame: inst(flameGeo, (() => { const m = new THREE.MeshBasicMaterial({ vertexColors: true }); MATS.push(m); return m; })(), N_FIRE),
    pot: inst(potGeo, lamV(), N_FLOW), stem: inst(stemGeo, lamV(), N_FLOW), head: inst(headGeo, lamV(0x202020), N_FLOW),
    bot: inst(botGeo, lamV(0x262626), N_BOT), barrel: inst(barrelGeo, lamV(), 2),
    tbody: inst(tbodyGeo, lamV(0x262626), 7), tbib: inst(tbibGeo, lamV(0x202020), 7), tleg: inst(tlegGeo, lamV(), 14), tarm: inst(tarmGeo, lamV(0x202020), 14),
  };
  GEOS.push(M.drop.geometry, M.mark.geometry); [SPH, SPHS, CYL, CONE].forEach(g => g.dispose());
  M.mark.renderOrder = 1; M.mark.count = MMAX;
  const SOLO_M = ['bal', 'stand', 'pit', 'flame', 'pot', 'stem', 'head', 'bot', 'barrel'], TEAM_M = ['tbody', 'tbib', 'tleg', 'tarm'];
  const showSet = (keys, on) => { for (const k of keys) M[k].visible = on; };
  showSet(SOLO_M, false); showSet(TEAM_M, false);
  const gun = new THREE.Mesh(gunGeo, lamV(0x202020)); gun.rotation.order = 'YXZ'; map.add(gun);
  // WG-FPS: 물이 떨어질 자리(흰 고리 · 포물선을 6토막으로 짚어 벽·바닥에 닿는 첫 자리) — 기본 3인칭(10-03 교사 '1인칭은 멀미' · V = 1인칭) · 위로 보는 한계 넓힘(멀리 쏘려면 위로)
  const land = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }));
  land.rotation.x = -Math.PI / 2; land.renderOrder = 3; land.visible = false; map.add(land);
  let landK = 0;
  function landTick(x0, y0, z0) {
    if ((landK++ & 1) === 1) return;   // 두 프레임에 한 번
    const fy = Q.floorY(map.player.pos().x, map.player.pos().z), vy0 = aim.vy, disc = vy0 * vy0 + 2 * G * (y0 - fy);
    let tEnd = disc > 0 ? (vy0 + Math.sqrt(disc)) / G : 2.4; tEnd = Math.min(tEnd, 2.4);
    let ax = x0, ay = y0, az = z0, hitAt = null;
    for (let k = 1; k <= 6; k++) { const t = tEnd * k / 6, bx = x0 + aim.vx * t, by = y0 + vy0 * t - 0.5 * G * t * t, bz = z0 + aim.vz * t;
      const r9 = ray(ax, ay, az, bx, by, bz); if (r9 !== null) { hitAt = [ax + (bx - ax) * r9, ay + (by - ay) * r9, az + (bz - az) * r9]; break; } ax = bx; ay = by; az = bz; }
    const P9 = hitAt || [ax, fy, az]; land.position.set(P9[0], P9[1] + 0.04, P9[2]); land.visible = true;
  }
  map.player.pitchLow(-0.75);
  const vestMat = new THREE.MeshLambertMaterial({ color: TEAM_C[0], emissive: 0x101820 }); MATS.push(vestMat);
  const vest = new THREE.Mesh(vestGeo, vestMat); vest.visible = false; map.add(vest);

  // =====================================================================================
  // 혼자 연습(과녁) — 준비는 처음 고를 때 한 번(물 채우는 곳·과녁 자리) · 다른 놀이로 가면 표식·트리거·충돌을 뗀다
  // =====================================================================================
  const WP = [], SPOTS = [], soloRes = [];
  let soloReady = false;
  function soloSetup() {
    if (!soloReady) {
      soloReady = true;
      // 물 채우는 곳: 운동장 개수대(수도꼭지 쪽 서는 자리) + 장난감 물통 둘(운동장 서쪽 · 구령대 앞 서쪽)
      { const lm = map.poi('lm:sink'), w = lm && map.interact.list({ kind: 'wash' }).find(h => Math.hypot(h.x - lm.x, h.z - lm.z) < 3.5);
        if (w) WP.push({ x: w.x, y: w.y, z: w.z, label: '개수대', barrel: false }); else if (lm && lm.stand) WP.push({ x: lm.stand[0], y: lm.stand[1], z: lm.stand[2], label: '개수대', barrel: false }); }
      for (const [bx, bz] of [[-33.5, 3.5], [-4.5, -9.3]]) {
        const i = nav.snap(bx, Q.floorY(bx, bz), bz, 3); if (i < 0) continue; const p = nav.pos(i);
        const k = WP.filter(w => w.barrel).length; WP.push({ x: p[0], y: p[1], z: p[2], label: '물통', barrel: true, k });
        M.barrel.setMatrixAt(k, _m4.compose(_v.set(p[0], p[1] + 0.005, p[2]), _q.setFromEuler(_e.set(0, rng() * 6, 0)), _s.set(1, 1, 1)));
      }
      M.barrel.instanceMatrix.needsUpdate = true;
      // 과녁 자리(운동장·농구 모래 — 길격자 무작위 칸 · 물 채우는 곳·출발 자리와 떨어지게)
      const spawnP = map.resolve('spawn:field-center');
      const far = WP.map(w => ({ x: w.x, z: w.z, r: 5 })); far.push({ x: spawnP.x, z: spawnP.z, r: 6 });
      for (let k = 0; k < 600 && SPOTS.length < 34; k++) { const p = nav.random({ zones: ZONES, minClear: 4, farFrom: far, rng }); if (!p) continue;
        if (p[0] < BOT_RECT[0] || p[0] > BOT_RECT[2] || p[2] < BOT_RECT[1] || p[2] > BOT_RECT[3]) continue;
        SPOTS.push({ x: p[0], y: p[1], z: p[2], used: null }); far.push({ x: p[0], z: p[2], r: 4.5 }); }
    }
    for (const w of WP) {
      const r = w.barrel ? 1.5 : 1.9;   // 물통은 충돌 상자 둘레에 서면 · 개수대는 꼭지 앞 보도
      soloRes.push(map.mk.marker(w.x, w.y, w.z, { color: 0x3cc8ff, beam: true }));
      soloRes.push(map.trigger.add({ x: w.x, y: w.y, z: w.z, r }, { enter() { inWater++; }, exit() { inWater = Math.max(0, inWater - 1); } }));
      if (w.barrel) soloRes.push(map.collider.add({ x0: w.x - 0.3, x1: w.x + 0.3, y0: w.y, y1: w.y + 0.85, z0: w.z - 0.3, z1: w.z + 0.3 }));
    }
    showSet(SOLO_M, true); map.arena.set({ rect: ARENA });
  }
  function soloTeardown() { for (const r of soloRes) r.remove(); soloRes.length = 0; inWater = 0; showSet(SOLO_M, false); }
  function takeSpot(who, me) {
    let bestS = null, bd = -1;
    for (let k = 0; k < 8; k++) { const s = SPOTS[Math.floor(rng() * SPOTS.length)]; if (!s || s.used) continue; const d = me ? Math.hypot(s.x - me.x, s.z - me.z) : 20; if (d > 7 && d < 45) { bestS = s; break; } if (d > bd) { bd = d; bestS = s; } }
    if (!bestS) bestS = SPOTS.find(s => !s.used) || SPOTS[0];
    if (who.spot) who.spot.used = null; bestS.used = who; who.spot = bestS; return bestS;
  }
  const B = [], F = [], FL = [], R = [];
  for (let i = 0; i < N_BAL; i++) { B.push({ i, spot: null, hp: HP_BAL, alive: true, re: 0, ph: rng() * 6, wob: 0 }); M.bal.setColorAt(i, _c.set(BAL_C[i % BAL_C.length])); }
  for (let i = 0; i < N_FIRE; i++) F.push({ i, spot: null, hp: HP_FIRE, lit: true, re: 0, ph: rng() * 6 });
  for (let i = 0; i < N_FLOW; i++) { FL.push({ i, spot: null, water: 0, bloom: 0, done: false, wilt: 0, yaw: rng() * 6 }); M.head.setColorAt(i, _c.set(FLOW_C[i % FLOW_C.length])); }
  for (let i = 0; i < N_BOT; i++) { R.push({ i, x: 0, y: 0, z: 0, yaw: 0, pts: null, pi: 0, think: 0, cd: 3 + rng() * 3, hp: HP_BOT, dizzy: 0, wind: 0, shots: 0, shotT: 0, tx: 0, ty: 0, tz: 0, bob: rng() * 6, spot: null, hit: 0 });
    M.bot.setColorAt(i, _c.set(BOT_C[i % BOT_C.length])); }
  M.bal.instanceColor.needsUpdate = M.head.instanceColor.needsUpdate = M.bot.instanceColor.needsUpdate = true;
  function placeAll() {
    const me = map.player.get();
    for (const s of SPOTS) s.used = null;
    for (const b of B) { b.spot = null; takeSpot(b, me); b.hp = HP_BAL; b.alive = true; b.re = 0; }
    for (const f of F) { f.spot = null; takeSpot(f, me); f.hp = HP_FIRE; f.lit = true; f.re = 0; }
    for (const fl of FL) { fl.spot = null; takeSpot(fl, me); fl.water = 0; fl.bloom = 0; fl.done = false; fl.wilt = 0; }
    for (const r of R) { r.spot = null; const s = takeSpot(r, me); r.spot.used = null; r.spot = null; r.x = s.x; r.y = s.y; r.z = s.z; r.pts = null; r.think = rng(); r.dizzy = 0; r.hp = HP_BOT; r.shots = 0; r.wind = 0; r.cd = 3 + rng() * 3; }
    for (const fl of FL) { M.pot.setMatrixAt(fl.i, _m4.compose(_v.set(fl.spot.x, fl.spot.y + 0.005, fl.spot.z), _q.setFromEuler(_e.set(0, fl.yaw, 0)), _s.set(1, 1, 1))); }
    for (const b of B) M.stand.setMatrixAt(b.i, _m4.compose(_v.set(b.spot.x, b.spot.y + 0.005, b.spot.z), _q.identity(), _s.set(1, 1, 1)));
    for (const f of F) M.pit.setMatrixAt(f.i, _m4.compose(_v.set(f.spot.x, f.spot.y + 0.01, f.spot.z), _q.setFromEuler(_e.set(0, f.ph, 0)), _s.set(1, 1, 1)));
    M.pot.instanceMatrix.needsUpdate = M.stand.instanceMatrix.needsUpdate = M.pit.instanceMatrix.needsUpdate = true;
    mmMarks();
  }
  function moveStand(b) { M.stand.setMatrixAt(b.i, _m4.compose(_v.set(b.spot.x, b.spot.y + 0.005, b.spot.z), _q.identity(), _s.set(1, 1, 1))); M.stand.instanceMatrix.needsUpdate = true; }
  function movePit(f) { M.pit.setMatrixAt(f.i, _m4.compose(_v.set(f.spot.x, f.spot.y + 0.01, f.spot.z), _q.setFromEuler(_e.set(0, f.ph, 0)), _s.set(1, 1, 1))); M.pit.instanceMatrix.needsUpdate = true; }
  function movePot(fl) { M.pot.setMatrixAt(fl.i, _m4.compose(_v.set(fl.spot.x, fl.spot.y + 0.005, fl.spot.z), _q.setFromEuler(_e.set(0, fl.yaw, 0)), _s.set(1, 1, 1))); M.pot.instanceMatrix.needsUpdate = true; }
  function mmMarks() {
    const mk = WP.map(w => ({ x: w.x, z: w.z, color: '#2b8fe0', shape: 'ring', label: '물' }));
    for (const f of F) if (f.lit) mk.push({ x: f.spot.x, z: f.spot.z, color: '#ff7a2a', shape: 'dot', r: 4 });
    map.minimap.setMarks(mk);
  }

  // ---------- 소리(짧은 합성음 · 🔊 칩으로 끔) ----------
  const tone = (...a) => { if (!muted) map.tone(...a); };
  const sfx = k => { if (!muted) map.sfx(k); };
  const SND = {
    spray: () => tone(1300 + rng() * 400, 0, 0.05, 'triangle', 0.02, 700),
    splash: () => tone(760, 0, 0.07, 'sine', 0.06, 320),
    pop: () => { tone(520, 0, 0.07, 'square', 0.04, 1300); tone(1046, 0.05, 0.14, 'sine', 0.11, 1568); },
    out: () => { tone(420, 0, 0.25, 'triangle', 0.05, 160); tone(784, 0.18, 0.12, 'sine', 0.12); tone(1046, 0.28, 0.2, 'sine', 0.12); },
    bloom: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.07, 0.18, 'triangle', 0.12)),
    dizzy: () => { tone(300, 0, 0.3, 'sine', 0.14, 900); tone(900, 0.28, 0.3, 'sine', 0.1, 300); },
    squirt: () => tone(480, 0, 0.12, 'triangle', 0.06, 980),
    wet: () => tone(1250, 0, 0.07, 'sine', 0.06, 1750),
    gurgle: () => tone(260 + rng() * 220, 0, 0.09, 'sine', 0.06, 520),
    empty: () => tone(220, 0, 0.14, 'triangle', 0.08, 180),
    soakMe: () => { tone(900, 0, 0.3, 'sine', 0.1, 300); tone(500, 0.25, 0.3, 'triangle', 0.06, 250); },
    soakThem: () => { tone(784, 0, 0.1, 'triangle', 0.1); tone(1175, 0.08, 0.16, 'sine', 0.12); },
  };

  // ---------- HUD(DOM — 조준점 · 물/젖음 칸 · 점수 튀어나옴 · 터치 💧 버튼 · 팀: 알림 줄 · 점수판) ----------
  const root = document.createElement('div'); root.className = 'wg-hud';
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:19;font-family:sans-serif';
  root.innerHTML = '<div class="wg-x" style="position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border:2px solid rgba(255,255,255,.95);border-radius:50%;box-shadow:0 0 0 1px rgba(29,53,87,.55),inset 0 0 0 1px rgba(29,53,87,.4)">'
    + '<div style="position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(29,53,87,.6)"></div></div>'
    + '<div class="wg-g" style="position:absolute;left:50%;bottom:52px;transform:translateX(-50%);width:230px;padding:7px 12px;border-radius:10px;background:rgba(29,53,87,.8);color:#fff;font-size:13px;line-height:1">'
    + '<div style="display:flex;align-items:center;gap:8px"><span class="wg-tl" style="width:58px;white-space:nowrap">💧 물</span><div style="flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.22);overflow:hidden"><div class="wg-tb" style="height:100%;width:100%;background:#4fb3ff;border-radius:5px"></div></div></div>'
    + '<div style="display:flex;align-items:center;gap:8px;margin-top:6px"><span style="width:58px;white-space:nowrap">💦 젖음</span><div style="flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.22);overflow:hidden"><div class="wg-wb" style="height:100%;width:0%;background:#9ff0dc;border-radius:5px"></div></div></div></div>'
    + '<div class="wg-feed" style="position:absolute;left:12px;top:96px;display:flex;flex-direction:column;gap:4px;font-size:14px;font-weight:700"></div>'
    + '<div class="wg-board" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:300px;padding:12px 16px;border-radius:12px;background:rgba(29,53,87,.9);color:#fff;font-size:14px;display:none"></div>';
  document.body.appendChild(root);
  const elX = root.querySelector('.wg-x'), elTB = root.querySelector('.wg-tb'), elWB = root.querySelector('.wg-wb'), elTL = root.querySelector('.wg-tl'), elG = root.querySelector('.wg-g');
  const elFeed = root.querySelector('.wg-feed'), elBoard = root.querySelector('.wg-board');
  elG.style.display = 'none';
  const POPS = []; for (let k = 0; k < 6; k++) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;left:0;top:0;font-weight:800;font-size:20px;color:#fff;text-shadow:0 2px 0 rgba(29,53,87,.7),0 0 4px rgba(29,53,87,.6);display:none;white-space:nowrap'; root.appendChild(d); POPS.push({ el: d, t: 0, x: 0, y: 0, z: 0 }); }
  let popK = 0;
  const pop = (x, y, z, text) => { const p = POPS[popK++ % POPS.length]; p.x = x; p.y = y; p.z = z; p.t = 0.9; p.el.textContent = text; p.el.style.display = ''; };
  let hudTank = -1, hudWet = -1, hudX = -1, hudRef = -1;
  // 터치 화면: 💧 버튼(누르고 있기) — 자리는 phone.css(.wg-fire · 행동 버튼 위). 다른 입력은 SD2.map.press('fire', …)
  const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches || document.body.classList.contains('touch'); } catch (e) { return false; } })();
  let fireBtn = null;
  if (coarse) {
    fireBtn = document.createElement('div'); fireBtn.className = 'wg-fire'; fireBtn.textContent = '💧';
    fireBtn.style.cssText = 'position:fixed;right:calc(196px + env(safe-area-inset-right));bottom:calc(100px + env(safe-area-inset-bottom));width:76px;height:76px;border-radius:50%;z-index:22;display:flex;align-items:center;justify-content:center;'
      + 'font-size:34px;background:rgba(79,179,255,.85);border:3px solid rgba(255,255,255,.85);box-shadow:0 3px 0 rgba(0,0,0,.18);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer';
    let fpx = 0, fpy = 0;   // WG-FPS: 💧을 누른 채 끌면 시점(조준) — 엄지 하나로 쏘며 겨누기(왼손 = 조이스틱)
    const dn = e => { e.preventDefault(); e.stopPropagation(); inp.pad = true; fpx = e.clientX; fpy = e.clientY; fireBtn.style.transform = 'scale(.92)'; try { fireBtn.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ } };
    const up = e => { e.stopPropagation(); inp.pad = false; fireBtn.style.transform = ''; };
    const mv = e => { if (!inp.pad) return; e.preventDefault(); e.stopPropagation(); map.player.look(e.clientX - fpx, e.clientY - fpy); fpx = e.clientX; fpy = e.clientY; };
    fireBtn.addEventListener('pointerdown', dn); fireBtn.addEventListener('pointermove', mv); fireBtn.addEventListener('pointerup', up); fireBtn.addEventListener('pointercancel', up); fireBtn.addEventListener('lostpointercapture', up);
    fireBtn.style.display = 'none'; document.body.appendChild(fireBtn);
  }
  const sndChip = () => map.hud.chip('wg-snd', muted ? '🔇 소리 끔' : '🔊 소리 켬', { onClick: () => { muted = !muted; sndChip(); } });
  const scoreChip = () => map.hud.chip('wg-score', '⭐ ' + score + '점');
  const timeChip = () => map.hud.chip('wg-time', '⏱ ' + fmt(T));
  const clearChips = () => { for (const k of ['wg-score', 'wg-time', 'wg-snd', 'wg-team', 'wg-board']) map.hud.chip(k, null); };

  // ---------- 입력: 마우스 왼쪽(시점 잠금 중) · F · 'fire' 신호 · Tab(점수판) ----------
  // PERF-WIN(09-28): 톡 치기 걸쇠(inp.tap) — 느린 PC(한 프레임 50ms)에서 F·왼쪽 클릭을 프레임 사이에 눌렀다 떼도 다음 tick이 한 번은 쏜다(예전엔 눌림·뗌이 같은 프레임이면 사라짐)
  const onKD = e => { if (e.code === 'KeyF' && !e.repeat) inp.key = inp.tap = true;
    if (e.code === 'Tab' && mode === 'team' && st !== 'menu') { e.preventDefault(); if (!e.repeat) boardOn(elBoard.style.display === 'none'); } };
  const onKU = e => { if (e.code === 'KeyF') inp.key = false; };
  const onMD = e => { if (e.button === 0 && document.pointerLockElement) inp.mouse = inp.tap = true; };
  const onMU = e => { if (e.button === 0) inp.mouse = false; };
  const onBlur = () => { inp.key = inp.mouse = inp.pad = inp.tap = false; };
  addEventListener('keydown', onKD); addEventListener('keyup', onKU); addEventListener('mousedown', onMD); addEventListener('mouseup', onMU); addEventListener('blur', onBlur);
  map.on('action', ev => { if (ev && ev.name === 'fire') inp.pad = !!ev.down; });

  // ---------- 물방울 풀(구조 배열 — 매 프레임 새 객체 없음) ----------
  // kind: 1 물줄기(혼자 = 나 · 팀 = 누구든 — own = 쏜 배우 번호) · 2 로봇 물(혼자) · 3 튀는 물(충돌 없음) · 4 김(위로)
  const kind = new Uint8Array(PMAX), own = new Int8Array(PMAX), px = new Float32Array(PMAX), py = new Float32Array(PMAX), pz = new Float32Array(PMAX), vx = new Float32Array(PMAX), vy = new Float32Array(PMAX), vz = new Float32Array(PMAX);
  const qx = new Float32Array(PMAX), qy = new Float32Array(PMAX), qz = new Float32Array(PMAX);   // 마지막으로 충돌을 본 자리(충돌은 2프레임마다 — 그사이 선분 전체를 본다)
  let frameN = 0;
  const life = new Float32Array(PMAX), life0 = new Float32Array(PMAX), psz = new Float32Array(PMAX), pr = new Float32Array(PMAX), pg = new Float32Array(PMAX), pb = new Float32Array(PMAX);
  let pNext = 0, pAlive = 0;
  function spawn(k, x, y, z, ux, uy, uz, lt, size, hex, o = -1) {
    for (let n = 0; n < PMAX; n++) { const i = (pNext + n) % PMAX; if (kind[i]) continue;
      kind[i] = k; own[i] = o; px[i] = qx[i] = x; py[i] = qy[i] = y; pz[i] = qz[i] = z; vx[i] = ux; vy[i] = uy; vz[i] = uz; life[i] = life0[i] = lt; psz[i] = size; _c.set(hex); pr[i] = _c.r; pg[i] = _c.g; pb[i] = _c.b; pNext = (i + 1) % PMAX; return i; }
    return -1;
  }
  function burst(x, y, z, n, hex, up = 2.2, spread = 1.8, size = 0.06) {
    for (let k = 0; k < n; k++) { const a = rng() * Math.PI * 2, s = spread * (0.4 + rng() * 0.6); spawn(3, x, y, z, Math.cos(a) * s, up * (0.5 + rng() * 0.7), Math.sin(a) * s, 0.35 + rng() * 0.25, size * (0.7 + rng() * 0.6), hex); }
  }
  function steam(x, y, z, n) { for (let k = 0; k < n; k++) spawn(4, x + (rng() - 0.5) * 0.4, y, z + (rng() - 0.5) * 0.4, (rng() - 0.5) * 0.3, 0.9 + rng() * 0.6, (rng() - 0.5) * 0.3, 0.8 + rng() * 0.5, 0.09 + rng() * 0.05, STEAM_C); }

  // ---------- 젖은 자국(고정 칸 MMAX · 7초 · 뒤 3초에 흰색으로 마름 · 면 법선으로 3cm) ----------
  const mx = new Float32Array(MMAX), my = new Float32Array(MMAX), mz = new Float32Array(MMAX), mnx = new Float32Array(MMAX), mny = new Float32Array(MMAX), mnz = new Float32Array(MMAX), mlife = new Float32Array(MMAX), mrad = new Float32Array(MMAX);
  let mNext = 0, markCool = 0, mAlive = 0;
  const WETc = new THREE.Color(WET_C), WHITE = new THREE.Color(0xffffff);
  function markSet(i) { _n.set(mnx[i], mny[i], mnz[i]); _q.setFromUnitVectors(_Z, _n); M.mark.setMatrixAt(i, _m4.compose(_v.set(mx[i] + mnx[i] * 0.03, my[i] + mny[i] * 0.03, mz[i] + mnz[i] * 0.03), _q, _s.set(mrad[i], mrad[i], 1))); M.mark.instanceMatrix.needsUpdate = true; }
  function addMark(x, y, z, nx, ny, nz, big = 0) {
    for (let i = 0; i < MMAX; i++) if (mlife[i] > 0 && (mx[i] - x) ** 2 + (my[i] - y) ** 2 + (mz[i] - z) ** 2 < 0.16 && mnx[i] * nx + mny[i] * ny + mnz[i] * nz > 0.9) {   // 가까운 자국은 넓히고 다시 젖음
      mlife[i] = 7; if (mrad[i] < 0.62 || big) { mrad[i] = Math.max(mrad[i] + 0.03, big); markSet(i); } return; }
    if (markCool > 0 && !big) return; markCool = 0.05;
    let i = -1; for (let n = 0; n < MMAX; n++) { const j = (mNext + n) % MMAX; if (mlife[j] <= 0) { i = j; break; } } if (i < 0) i = mNext;
    mNext = (i + 1) % MMAX; mx[i] = x; my[i] = y; mz[i] = z; mnx[i] = nx; mny[i] = ny; mnz[i] = nz; mlife[i] = 7; mrad[i] = big || 0.2 + rng() * 0.12; markSet(i);
  }

  // ---------- 충돌: 선분 a→b가 공(가운데 c, 반지름 r)에 닿는가 ----------
  function segHit(ax, ay, az, bx, by, bz, cx, cy, cz, r) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, L = dx * dx + dy * dy + dz * dz;
    let t = L > 1e-9 ? ((cx - ax) * dx + (cy - ay) * dy + (cz - az) * dz) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = ax + dx * t - cx, ey = ay + dy * t - cy, ez = az + dz * t - cz; return ex * ex + ey * ey + ez * ez < r * r;
  }
  const RA = [0, 0, 0], RB = [0, 0, 0], RO = {};
  const ray = (ax, ay, az, bx, by, bz) => { RA[0] = ax; RA[1] = ay; RA[2] = az; RB[0] = bx; RB[1] = by; RB[2] = bz; return Q.ray(RA, RB, RO); };
  // 벽·물체 면에 닿음 → 법선(축 하나씩 움직여 먼저 막히는 축)
  function surfHit(i, ax, ay, az, t) {
    const bx = px[i], by = py[i], bz = pz[i], hx = ax + (bx - ax) * t, hy = ay + (by - ay) * t, hz = az + (bz - az) * t;
    let nx = 0, ny = 1, nz = 0, tb = 2;
    const tx = ray(ax, ay, az, bx, ay, az); if (tx !== null && tx < tb) { tb = tx; nx = bx > ax ? -1 : 1; ny = 0; nz = 0; }
    const tz = ray(ax, ay, az, ax, ay, bz); if (tz !== null && tz < tb) { tb = tz; nx = 0; ny = 0; nz = bz > az ? -1 : 1; }
    const ty = ray(ax, ay, az, ax, by, az); if (ty !== null && ty < tb) { nx = 0; nz = 0; ny = by > ay ? -1 : 1; }
    // 자국은 낮은 윗면(구령대·벤치·계단·발판)에만 — 옆면·높은 윗면은 충돌 상자가 보이는 모양과 다를 수 있다(나무 잎판·그물·줄기 십자) → 튀는 물만
    impact(i, hx, hy, hz, nx, ny, nz, ny > 0.9 && hy - Q.floorY(hx, hz) < 1.4);
  }
  function impact(i, x, y, z, nx, ny, nz, mark = true) {
    burst(x + nx * 0.05, y + ny * 0.05, z + nz * 0.05, 2 + (rng() < 0.5 ? 1 : 0), kind[i] === 2 || own[i] >= 4 ? BOT_WATER_C : WATER_C, 1.6, 1.1, 0.045);
    if (mark) addMark(x, y, z, nx, ny, nz);
    kind[i] = 0;
  }

  // 과녁에 물이 닿음(혼자 연습 — 내 물줄기만)
  let splashT = 0;
  const hitFx = (x, y, z, hex = WATER_C) => { if (splashT <= 0) { SND.splash(); splashT = 0.12; } burst(x, y, z, 2, hex, 1.8, 1.4, 0.05); };
  function hitTargets(i, ax, ay, az) {
    const bx = px[i], by = py[i], bz = pz[i];
    for (const b of B) { if (!b.alive) continue; const s = b.spot; if (segHit(ax, ay, az, bx, by, bz, s.x, s.y + 1.3, s.z, 0.36)) {
      b.hp--; b.wob = 1; hitFx(bx, by, bz);
      if (b.hp <= 0) { b.alive = false; b.re = 6; M.bal.setMatrixAt(b.i, ZERO); M.bal.instanceMatrix.needsUpdate = true; burst(s.x, s.y + 1.3, s.z, 18, BAL_C[b.i % BAL_C.length], 2.6, 2.4, 0.07); burst(s.x, s.y + 1.3, s.z, 10, WATER_C, 1.5, 2.8, 0.06);
        score += PTS.bal; cnt.bal++; SND.pop(); pop(s.x, s.y + 1.7, s.z, '+' + PTS.bal); scoreChip(); }
      return true; } }
    for (const f of F) { if (!f.lit) continue; const s = f.spot; if (segHit(ax, ay, az, bx, by, bz, s.x, s.y + 0.35, s.z, 0.55)) {
      f.hp--; hitFx(bx, by, bz); if (rng() < 0.25) steam(s.x, s.y + 0.4, s.z, 1);
      if (f.hp <= 0) { f.lit = false; f.re = 14; M.flame.setMatrixAt(f.i, ZERO); M.flame.instanceMatrix.needsUpdate = true; steam(s.x, s.y + 0.3, s.z, 12);
        score += PTS.fire; cnt.fire++; SND.out(); pop(s.x, s.y + 1.0, s.z, '+' + PTS.fire); scoreChip(); mmMarks(); }
      return true; } }
    for (const fl of FL) { if (fl.done) continue; const s = fl.spot; if (segHit(ax, ay, az, bx, by, bz, s.x, s.y + 0.55, s.z, 0.45)) {
      fl.water = Math.min(1, fl.water + 1 / HP_FLOW); hitFx(bx, by, bz);
      if (fl.water >= 1) { fl.done = true; fl.wilt = 28; score += PTS.flow; cnt.flow++; SND.bloom(); pop(s.x, s.y + 1.2, s.z, '+' + PTS.flow + ' 🌸'); scoreChip(); }
      return true; } }
    for (const r of R) { if (r.dizzy > 0) continue; if (segHit(ax, ay, az, bx, by, bz, r.x, r.y + 0.6, r.z, 0.5)) {
      r.hp--; r.hit = 0.15; hitFx(bx, by, bz);
      if (r.hp <= 0) { r.dizzy = 3; r.shots = 0; r.wind = 0; r.pts = null; score += PTS.bot; cnt.bot++; SND.dizzy(); pop(r.x, r.y + 1.5, r.z, '+' + PTS.bot + ' 💫'); scoreChip(); }
      return true; } }
    return false;
  }

  // ---------- 겨눔: 화면 가운데 광선이 처음 닿는 곳(벽·물체·바닥·과녁) → 물총 꼭지에서 그곳까지 포물선 발사각 ----------
  // G3-WG '갑자기 위로 쏘는 현상'(09-27 재현 — 스크래치 g3w/probe2: 운동장 160자리 × 70프레임 걷기·시점 돌리기 중 발사각이 한 프레임에 12° 넘게 튄 것 93번) — 원인 넷:
  //  ① 닿지 않는 곳(사거리 ≈23m 밖 — 먼 바닥·하늘 45m 점)이면 발사각을 고정 45°로 쐈다. 가운데 광선이 가는 것(철망·골대 그물·기둥 충돌 상자)에 닿았다 비껴갔다 하면
  //     겨눈 점이 20m ↔ 60m를 오가 발사각이 15~30° ↔ 45°로 프레임마다 뒤집혔다(튄 93번 전부). → 닿지 않으면 그 방향 '최대 사거리 각'(45° + 올려본 각/2 — 사거리 경계에서 이어짐)
  //     + 발사각을 초당 110°까지만 바꾼다(한 프레임 깜빡임이 물줄기를 꺾지 않게).
  //  ② 꼭지 1.2m 안을 겨누면 방향만 카메라 앞으로 바꾸고 높이 차는 그대로 둬서, 앞 가까이 위쪽(벽 윗부분·컨테이너 옆면·골대 가로대·나무 잎판)에 닿으면 50~63°로 치솟았다 → 가까우면 보는 방향 그대로 쏜다.
  //  ③ 쏘기 시작한 첫 프레임은 꼭지 자리가 걷던 방향(뒤로 걸으면 카메라 쪽)이었다 → 쏘는 동안 꼭지 = 카메라가 보는 쪽.
  //  ④ 포인터 잠금 튐(크롬이 잠그는 순간 수백 px movementY 한 번 → 시점이 끝까지 위로 꺾임) → main.js mousemove가 잠금 직후 200/150px, 그 밖엔 60fps 기준 300/200px(프레임이 느리면 이벤트가 담은 시간만큼 크게) 넘는 값을 버린다(PERF-WIN).
  const aim = { x: 0, y: 0, z: 0, on: false, h: 0, vx: 0, vy: 0, vz: 0, a: 0, far: false };
  let aimA = null;
  function computeAim(me, nx, ny, nz, dt, targetsFn) {
    let tx, ty, tz; aim.on = false; aim.far = false;
    _f.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const fl = Math.hypot(_f.x, _f.z) || 1;
    if (aimOverride) { tx = aimOverride[0]; ty = aimOverride[1]; tz = aimOverride[2]; }
    else {
      // 카메라와 나 사이(뒤따라오는 로봇·카메라 옆 나무)는 겨눔에서 뺀다 — 광선은 내 몸 앞(t0)부터
      const o = cam.position, FAR = 45;
      const t0 = Math.max(0, (me.x - o.x) * _f.x + (me.y + 1.0 - o.y) * _f.y + (me.z - o.z) * _f.z) + 0.3;
      let d = FAR; const t = ray(o.x + _f.x * t0, o.y + _f.y * t0, o.z + _f.z * t0, o.x + _f.x * FAR, o.y + _f.y * FAR, o.z + _f.z * FAR); if (t !== null) d = t0 + t * (FAR - t0);
      const fy = Q.floorY(me.x, me.z); if (_f.y < -1e-3) { const tg = (fy - o.y) / _f.y; if (tg > t0 && tg < d) d = tg; }
      const tgt = (cx, cy, cz, r) => { const lx = cx - o.x, ly = cy - o.y, lz = cz - o.z, tc = lx * _f.x + ly * _f.y + lz * _f.z; if (tc < t0 || tc > d) return; const d2 = lx * lx + ly * ly + lz * lz - tc * tc; if (d2 < r * r) { d = tc; aim.on = true; } };
      targetsFn(tgt);
      tx = o.x + _f.x * d; ty = o.y + _f.y * d; tz = o.z + _f.z * d;
    }
    aim.x = tx; aim.y = ty; aim.z = tz;
    if (!aimOverride) {   // WG-FPS(10-03 교사 '물총 엔진이 일반 FPS 느낌이 아니다'): 예전엔 십자선이 고른 점까지 엉덩이 꼭지에서 포물선 각을 풀어(초당 110°로 늦게 따라감) 쐈다 →
      //   1인칭 = 카메라가 보는 방향 그대로 · 3인칭 = 꼭지에서 십자선이 가리키는 점 쪽으로 곧장 — 둘 다 같은 빠르기로 쏘고 중력이 포물선을 만든다(위로 보면 멀리)
      let dx9 = _f.x, dy9 = _f.y, dz9 = _f.z;
      if (!map.player.first) { dx9 = tx - nx; dy9 = ty - ny; dz9 = tz - nz; const L9 = Math.hypot(dx9, dy9, dz9) || 1; dx9 /= L9; dy9 /= L9; dz9 /= L9; }
      aim.vx = dx9 * FPS_SPEED; aim.vy = dy9 * FPS_SPEED; aim.vz = dz9 * FPS_SPEED; aim.a = Math.asin(Math.max(-1, Math.min(1, dy9)));
      aim.h = Math.atan2(dx9, -dz9) * 180 / Math.PI; return;
    }
    let dx = tx - nx, dz = tz - nz, dh = Math.hypot(dx, dz); const h = ty - ny;
    let a;
    if (dh < 1.2) { dx = _f.x / fl; dz = _f.z / fl; dh = 1; a = Math.atan2(_f.y, fl) + 0.05; }   // ② 발밑·코앞: 보는 방향 그대로(조금 위로 — 물이 처지니까)
    else { const S2 = SPEED * SPEED, disc = S2 * S2 - G * (G * dh * dh + 2 * h * S2);
      if (disc >= 0) a = Math.atan((S2 - Math.sqrt(disc)) / (G * dh));
      else { a = Math.PI / 4 + Math.atan2(h, dh) / 2; aim.far = true; } }   // ① 닿지 않음 → 그 방향 최대 사거리 각(경계에서 낮은 해와 같은 값)
    a = Math.max(-1.0, Math.min(0.95, a));
    if (aimA == null) aimA = a; else { const mxs = 1.9 * dt; aimA += Math.max(-mxs, Math.min(mxs, a - aimA)); }   // ① 초당 ≈110°까지만
    const c = Math.cos(aimA) * SPEED; aim.vx = dx / dh * c; aim.vz = dz / dh * c; aim.vy = Math.sin(aimA) * SPEED; aim.a = aimA;
    aim.h = Math.atan2(dx, -dz) * 180 / Math.PI;
  }
  const soloTargets = tgt => {
    for (const b of B) if (b.alive) tgt(b.spot.x, b.spot.y + 1.3, b.spot.z, 0.42);
    for (const f of F) if (f.lit) tgt(f.spot.x, f.spot.y + 0.35, f.spot.z, 0.6);
    for (const fl of FL) if (!fl.done) tgt(fl.spot.x, fl.spot.y + 0.55, fl.spot.z, 0.5);
    for (const r of R) if (r.dizzy <= 0) tgt(r.x, r.y + 0.6, r.z, 0.55);
  };

  // ---------- 로봇(혼자 연습 — 길격자 경로 · 가끔 다가와 물 몇 방울) ----------
  let planned = false;
  const inRect = (x, z) => x >= BOT_RECT[0] && x <= BOT_RECT[2] && z >= BOT_RECT[1] && z <= BOT_RECT[3];
  // 리뷰(09-26): 경로는 짧게만(로봇 둘레 ≤ PLAN_R m · maxExp 4000) — 운동장 끝에서 끝(60m+) 길찾기는 한 번에 6~60ms 멈칫이었다. 먼 사람 쪽으로는 몇 번에 나눠 다가간다
  const PLAN_R = 13;
  const destAt = (x, z, y) => { if (!inRect(x, z)) return null; const i = nav.snap(x, y, z, 1.5); if (i < 0) return null; const zn = nav.zoneOf(i); return zn && ZONES.includes(zn.id) ? nav.pos(i) : null; };
  function plan(r, me) {
    r.think = 4 + rng() * 3; r.pts = null;
    let dest = null;
    const dMe = Math.hypot(me.x - r.x, me.z - r.z);
    if (st === 'play' && dMe > 7 && rng() < 0.7) {
      if (dMe < PLAN_R + 5) { const a = rng() * Math.PI * 2, d = 5 + rng() * 2.5, x = me.x + Math.cos(a) * d, z = me.z + Math.sin(a) * d; dest = destAt(x, z, Q.floorY(x, z)); }
      else { const k = (PLAN_R - 2 + rng() * 2) / dMe, x = r.x + (me.x - r.x) * k + (rng() - 0.5) * 3, z = r.z + (me.z - r.z) * k + (rng() - 0.5) * 3; dest = destAt(x, z, r.y); }
    }
    // 아니면 둘레 아무 데나(nav.random은 전 칸을 훑어 수 ms — 판 중에는 쓰지 않는다)
    for (let k = 0; k < 6 && !dest; k++) { const a = rng() * Math.PI * 2, d = 3 + rng() * (PLAN_R - 4); dest = destAt(r.x + Math.cos(a) * d, r.z + Math.sin(a) * d, r.y); }
    if (!dest) { r.think = 0.5; return; }
    const res = nav.path([r.x, r.y, r.z], dest, { maxExp: 4000 });
    if (res.ok && res.pts.length > 1) { r.pts = res.pts; r.pi = 1; } else r.think = 0.5;
  }
  function botTick(r, dt, me) {
    r.bob += dt;
    if (r.hit > 0) r.hit -= dt;
    if (r.dizzy > 0) { r.dizzy -= dt; r.yaw += dt * 9; if (r.dizzy <= 0) { r.hp = HP_BOT; r.cd = 2 + rng() * 2; r.think = 0; } return; }
    const dx = me.x - r.x, dz = me.z - r.z, dMe = Math.hypot(dx, dz);
    if (r.wind > 0 || r.shots > 0) {
      const want = Math.atan2(dx, dz); const dy = wrapA(want - r.yaw); r.yaw += dy * Math.min(1, dt * 10);
      if (r.wind > 0) { r.wind -= dt; if (r.wind <= 0) { r.shots = 7; r.shotT = 0; r.tx = me.x + (rng() - 0.5) * 1.1; r.ty = me.y + 0.8; r.tz = me.z + (rng() - 0.5) * 1.1; SND.squirt(); } return; }
      if ((r.shotT -= dt) <= 0) { r.shotT = 0.07; r.shots--;
        const c = Math.cos(r.yaw), s = Math.sin(r.yaw), nx = r.x + 0.16 * c + 0.44 * s, ny = r.y + 0.42, nz = r.z - 0.16 * s + 0.44 * c;
        const ex = r.tx - nx, ez = r.tz - nz, dh = Math.hypot(ex, ez) || 1, hh = r.ty - ny, S2 = BOT_SPEED * BOT_SPEED, disc = S2 * S2 - G * (G * dh * dh + 2 * hh * S2);
        if (disc >= 0) { const a = Math.atan((S2 - Math.sqrt(disc)) / (G * dh)), cc = Math.cos(a) * BOT_SPEED; spawn(2, nx, ny, nz, ex / dh * cc + (rng() - 0.5) * 0.4, Math.sin(a) * BOT_SPEED + (rng() - 0.5) * 0.3, ez / dh * cc + (rng() - 0.5) * 0.4, 2.2, 0.06, BOT_WATER_C); }
        else r.shots = 0; }
      return;
    }
    r.cd -= dt;
    if (st === 'play' && r.cd <= 0 && dMe < 9.5 && dMe > 2) {
      r.cd = 3.4 + rng() * 2.4;
      if (Q.los([r.x, r.y + 0.9, r.z], [me.x, me.y + 1.1, me.z], { ignoreNc: false })) { r.wind = 0.5; return; }   // 철망·골대 그물 뒤는 숨는 곳(로봇이 못 봄)
    }
    if ((r.think -= dt) <= 0 || !r.pts || r.pi >= r.pts.length) { if ((r.think <= 0 || !r.pts) && !planned) { planned = true; plan(r, me); } if (!r.pts) return; }   // 길찾기는 한 프레임에 로봇 하나만
    const p = r.pts[r.pi], ex = p[0] - r.x, ez = p[2] - r.z, d = Math.hypot(ex, ez), sp = 1.7 * dt;
    if (d <= sp) { r.x = p[0]; r.z = p[2]; r.y = p[1]; r.pi++; if (r.pi >= r.pts.length) { r.pts = null; r.think = 0.6 + rng() * 1.2; } }
    else { r.x += ex / d * sp; r.z += ez / d * sp; r.y += (p[1] - r.y) * Math.min(1, dt * 6);
      const want = Math.atan2(ex, ez); r.yaw += wrapA(want - r.yaw) * Math.min(1, dt * 6); }
  }

  // =====================================================================================
  // 팀 대결 — 배우(ACT) · 봇 두뇌(명령만) · 사건(emit) · 진지 · 경기장 소품
  // =====================================================================================
  const ACT = [];   // 0 = 나(청팀) · 1~3 청팀 봇 · 4~7 백팀 봇
  for (let i = 0; i < 8; i++) {
    const team = i < 4 ? 0 : 1, human = i === 0, k = human ? 0 : team ? i - 3 : i;
    ACT.push({ i, team, human, name: human ? '나' : TEAM_N[team] + ' 봇 ' + k, role: human ? null : (k % 2 ? 'attack' : 'defend'), slot: human ? -1 : i - 1,
      x: 0, y: 0, z: 0, yaw: 0, px: 0, pz: 0, vx: 0, vz: 0, tank: TANK, wet: 0, wetT: 9, alive: true, reT: 0, inv: 0, fall: 0, soaks: 0, soaked: 0,
      // 두뇌 상태(봇만) — 명령 cmd = { mx, mz(가고 싶은 곳), fire, ax, ay, az(겨눌 곳) }
      cmd: { go: false, mx: 0, mz: 0, fire: false, ax: 0, ay: 0, az: 0, run: 1 }, st: 'go', tgt: -1, seeT: 0, see: false, thinkT: rng() * 0.3, pts: null, pi: 0, stuckT: 0,
      burst: 0, pause: 0.5, ex: 0, ey: 0, ez: 0, coverT: 0, cover: null, refill: false, strafe: 1, strafeT: 0, walk: 0, emit: 0, lastX: 0, lastZ: 0, dest: null, hitT: 0,
      remote: false, pid: null, net: null });   // remote = 친구(네트워크) · net = 받은 상태 [x,y,z,yaw,쏨,a,b,c,젖음,살아있음]
  }
  let teamScore = [0, 0], tGoal = T_GOAL, tTime = T_TIME, feedN = 0;
  const basePos = [null, null], teamRes = [], props = [], COVERS = [], memo = [{ x: 0, z: 0, t: -99 }, { x: 0, z: 0, t: -99 }];   // memo[팀] = 우리 팀이 마지막으로 본 상대 자리
  let clock = 0, boardOnNow = false, mmT = 0, hudScore = '';
  // 사건(네트워크 층이 같은 사건을 주고받을 자리) — 지금은 이 판 안에서만
  function emit(ev) { if (ev.type === 'soak') { onSoak(ev.by, ev.who); if (NM.on) netEmit({ k: 'soak', by: ev.by, who: ev.who }); } }
  const snapNav = (x, z, r = 3) => { const i = nav.snap(x, Q.floorY(x, z), z, r); return i < 0 ? null : nav.pos(i); };
  function teamSetup(key) {
    arenaKey = key;
    for (let t = 0; t < 2; t++) { const p = snapNav(BASES[t].x, BASES[t].z) || [BASES[t].x, Q.floorY(BASES[t].x, BASES[t].z), BASES[t].z]; basePos[t] = { x: p[0], y: p[1], z: p[2] }; }
    // 진지: 빛기둥(청 · 흰) · 깃발 · 물 채우는 자리(나 = 트리거 · 봇 = 거리)
    for (let t = 0; t < 2; t++) { const b = basePos[t];
      teamRes.push(map.mk.marker(b.x, b.y, b.z, { color: t ? 0xffffff : 0x3c8cff, beam: true }));
      const fl = map.world.spawn('flag', { x: b.x + (t ? 1.6 : -1.6), z: b.z - 2.2, y: b.y }, { h: t ? 270 : 90, color: TEAM_C[t], s: 1.3 }); if (fl) props.push(fl);
      if (t === 0) teamRes.push(map.trigger.add({ x: b.x, y: b.y, z: b.z, r: 2.6 }, { enter() { inWater++; }, exit() { inWater = Math.max(0, inWater - 1); } })); }
    // 컨테이너 경기장: 청팀 절반 + 점 대칭 백팀 절반 + 가운데(스스로 대칭) — 충돌 + 길격자 막기는 map.world.spawn이 한다
    COVERS.length = 0;
    if (key === 'box') {
      const put = (kind, u, v, h, o) => { const pr = map.world.spawn(kind, { x: TC.x + u, z: TC.z + v }, { ...o, h }); if (pr) { props.push(pr); if (kind === 'container' || (kind === 'platform' && o.size && o.size[1] <= 1.05) || kind === 'crate') coverAround(TC.x + u, TC.z + v, kind, h, o); } };
      for (const [k, u, v, h, o] of BOX_HALF) { put(k, u, v, h, o); put(k, -u, -v, (h + 180) % 360, o); }
      for (const [k, u, v, h, o] of BOX_MID) put(k, u, v, h, o);
    }
    map.arena.set({ rect: T_RECT, msg: '경기장 밖으로는 나갈 수 없어요' });
    showSet(TEAM_M, true);
    recolor();
  }
  // 엄폐 자리: 소품 네 옆 1.1m 밖(길격자 칸으로 다듬음) — 봇이 젖었을 때 상대와 사이에 소품을 두는 곳
  function coverAround(x, z, kind, h, o) {
    const sz = o.size || (kind === 'container' ? [6.06, 2.59, 2.44] : kind === 'crate' ? [0.96, 0.96, 0.96] : [2, 1, 2]), odd = (Math.round(h / 90) & 1) === 1, w = odd ? sz[2] : sz[0], d = odd ? sz[0] : sz[2];
    const pts = [[x - w / 2 - 1.1, z], [x + w / 2 + 1.1, z], [x, z - d / 2 - 1.1], [x, z + d / 2 + 1.1]];
    if (w > 4) pts.push([x - w / 4, z - d / 2 - 1.1], [x + w / 4, z + d / 2 + 1.1], [x - w / 4, z + d / 2 + 1.1], [x + w / 4, z - d / 2 - 1.1]);
    if (d > 4) pts.push([x - w / 2 - 1.1, z - d / 4], [x + w / 2 + 1.1, z + d / 4], [x + w / 2 + 1.1, z - d / 4], [x - w / 2 - 1.1, z + d / 4]);
    for (const [cx, cz] of pts) { const i = nav.snap(cx, Q.floorY(cx, cz), cz, 0.6); if (i >= 0) { const p = nav.pos(i); COVERS.push({ x: p[0], y: p[1], z: p[2], by: -1 }); } }
  }
  const jOf = a => a.i < ME ? a.i : a.i - 1;   // 인스턴스 칸(나를 뺀 7)
  function recolor() { for (const a of ACT) if (a.i !== ME) M.tbib.setColorAt(jOf(a), _c.set(TEAM_C[a.team])); M.tbib.instanceColor.needsUpdate = true; vestMat.color.set(TEAM_C[ACT[ME].team]); }
  function teamTeardown() {
    for (const r of teamRes) r.remove(); teamRes.length = 0; for (const p of props) p.remove(); props.length = 0; COVERS.length = 0; inWater = 0;
    showSet(TEAM_M, false); vest.visible = false; elFeed.textContent = ''; feedN = 0; boardOn(false);
  }
  function spawnAt(a, first) {
    const solo = a.human && !NM.on, b = basePos[a.team], k = solo ? 0 : (a.i % 4) + 1, ang = (k / 5) * Math.PI * 2 + (first ? 0 : rng() * 0.8), r = solo ? 0 : 1.6 + rng() * 0.8;
    let x = b.x + Math.cos(ang) * r * (a.team ? -1 : 1), z = b.z + Math.sin(ang) * r; const p = snapNav(x, z, 2) || [b.x, b.y, b.z];
    a.x = a.px = a.lastX = p[0]; a.y = p[1]; a.z = a.pz = a.lastZ = p[2]; a.yaw = a.team ? -Math.PI / 2 : Math.PI / 2;
    a.tank = TANK; a.wet = 0; a.alive = true; a.reT = 0; a.fall = 0; a.inv = first ? 0 : T_INV; a.pts = null; a.tgt = -1; a.see = false; a.seeT = 0; a.refill = false; a.cover = null; a.coverT = 0; a.burst = 0; a.pause = 0.4 + rng() * 0.6; a.st = 'go'; a.dest = null; a.thinkT = rng() * 0.3;
    a.cmd.go = false; a.cmd.fire = false;
    if (a.human) { map.player.teleport([p[0], p[1], p[2]], { h: a.team ? 270 : 90 }); tank = TANK; wet = 0; }
  }
  // 흠뻑 → 3초 뒤 우리 진지에서(나는 그동안 멈춤 · 봇은 빙글 돌며 주저앉았다가 사라짐)
  function onSoak(by, who) {
    const a = ACT[who], s = by >= 0 ? ACT[by] : null;
    if (!a) return;
    if (!a.alive) { if (s) { s.soaks++; teamScore[s.team]++; } a.soaked++; teamChip(); if (s && teamScore[s.team] >= tGoal && st === 'play') finishTeam(); return; }   // 이미 젖은 배우(늦게 온 사건) — 점수만
    a.alive = false; a.reT = T_RESPAWN; a.fall = 0; a.soaked++; a.cmd.fire = false;
    if (s) { s.soaks++; teamScore[s.team]++; }
    burst(a.x, a.y + 0.8, a.z, 16, TEAM_W[s ? s.team : 0], 2.2, 2.6, 0.07); addMark(a.x, a.y + 0.01, a.z, 0, 1, 0, 0.75);
    feed(s, a);
    if (a.human) { SND.soakMe(); map.player.freeze(true); map.player.speed(1); inp.key = inp.mouse = inp.pad = false; map.hud.banner('💦 흠뻑! 3초 뒤 우리 진지에서', 2.6); }
    else if (s && s.human) { SND.soakThem(); pop(a.x, a.y + 1.6, a.z, '💦'); }
    if (a.remote) a.emit = 0;
    teamChip();
    if (s && teamScore[s.team] >= tGoal && st === 'play') finishTeam();
  }
  const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const nameHtml = a => '<span style="color:' + TEAM_CSS[a.team] + '">' + TEAM_I[a.team] + ' ' + esc(a.name) + '</span>';
  function feed(s, a) {   // 알림 줄(오른쪽 위 → 왼쪽 위 · 4줄 · 5초)
    const d = document.createElement('div'); d.style.cssText = 'padding:3px 9px;border-radius:8px;background:rgba(29,53,87,.72);color:#fff;white-space:nowrap;width:max-content;text-shadow:0 1px 0 rgba(0,0,0,.35)';
    d.innerHTML = (s ? nameHtml(s) + ' 💦 ' : '💦 ') + nameHtml(a); d.dataset.t = String(clock + 5);
    elFeed.appendChild(d); feedN++; while (elFeed.children.length > 4) elFeed.firstChild.remove();
  }
  // 휴대폰: 칩 줄이 💧 버튼에 닿지 않게 점수·시간을 한 칩에
  function teamChip() { const sm = document.body.classList.contains('small'), t = TEAM_I[0] + ' ' + teamScore[0] + ' : ' + teamScore[1] + ' ' + TEAM_I[1] + ' · ⏱ ' + fmt(T) + (sm ? '' : '  (' + tGoal + '점 먼저)'); if (t !== hudScore) { hudScore = t; map.hud.chip('wg-team', t); } if (boardOnNow) boardDraw(); }
  function boardDraw() {
    const row = a => '<tr><td style="padding:2px 8px;text-align:left">' + nameHtml(a) + (a.human ? ' ⭐' : '') + '</td><td style="padding:2px 8px">' + a.soaks + '</td><td style="padding:2px 8px">' + a.soaked + '</td></tr>';
    let h = '<div style="font-weight:800;font-size:16px;text-align:center;margin-bottom:6px">📋 점수판 — ' + TEAM_I[0] + ' ' + teamScore[0] + ' : ' + teamScore[1] + ' ' + TEAM_I[1] + '</div><table style="border-collapse:collapse;width:100%;text-align:center"><tr style="opacity:.8"><th></th><th style="padding:2px 8px">💦 적심</th><th style="padding:2px 8px">😵 젖음</th></tr>';
    for (let t = 0; t < 2; t++) for (const a of ACT) if (a.team === t) h += row(a);
    elBoard.innerHTML = h + '</table><div style="opacity:.75;font-size:12px;text-align:center;margin-top:6px">' + (coarse ? '📋 칩을 다시 누르면 닫혀요' : 'Tab = 닫기') + '</div>';
  }
  function boardOn(on) { boardOnNow = !!on; elBoard.style.display = on ? '' : 'none'; if (on) boardDraw(); }

  // ---------- 봇 두뇌(명령만 만든다) ----------
  const enemyOf = a => a.team ? 0 : 4, alive = a => a.alive && !(a.human && st !== 'play');
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
  const losA = (a, b) => ray(a.x, a.y + 1.0, a.z, b.x, b.y + 0.9, b.z) === null;
  let planBudget = 0, losBudget = 0;
  function think(b) {
    // 물: 15 밑이면 진지로(그동안은 안 싸움) · 진지에서 가득 차면 다시
    if (b.tank < 15) b.refill = true;
    const home = basePos[b.team];
    if (b.refill && b.tank >= TANK - 1) b.refill = false;
    // 상대 고르기: 가장 가까운 셋 중 보이는 첫째(광선 ≤2)
    let best1 = -1, best2 = -1, d1 = 1e9, d2 = 1e9; const e0 = enemyOf(b);
    for (let k = e0; k < e0 + 4; k++) { const e = ACT[k]; if (!alive(e)) continue; const d = dist2(b, e); if (d > T_SIGHT * T_SIGHT) continue; if (d < d1) { d2 = d1; best2 = best1; d1 = d; best1 = k; } else if (d < d2) { d2 = d; best2 = k; } }
    let tgt = -1;
    if (best1 >= 0 && losBudget > 0) { losBudget--; if (losA(b, ACT[best1])) tgt = best1; else if (best2 >= 0 && losBudget > 0) { losBudget--; if (losA(b, ACT[best2])) tgt = best2; } }
    if (tgt !== b.tgt) { b.seeT = 0; b.burst = 0; b.pause = 0.35 + rng() * 0.35; }   // 새 상대: 반응 시간
    b.tgt = tgt; b.see = tgt >= 0;
    if (b.see) { const e = ACT[tgt]; memo[b.team].x = e.x; memo[b.team].z = e.z; memo[b.team].t = clock; }
    if (b.refill) { b.st = 'refill'; goTo(b, home.x, home.z, 1.5); return; }
    if (b.see) {
      const e = ACT[tgt], d = Math.sqrt(dist2(b, e));
      // 엄폐: 많이 젖었거나(>50) 쏘다 쉬는 참에 가끔 — 상대와 사이에 소품이 있는 자리(8m 안 · 광선 ≤2)
      if (b.coverT <= 0 && COVERS.length && (b.wet > 50 || (b.role === 'defend' && rng() < 0.12)) && losBudget > 0) {
        let bc = null, bd = 64;
        for (const c of COVERS) { if (c.by >= 0 && c.by !== b.i) continue; const dd = (c.x - b.x) ** 2 + (c.z - b.z) ** 2; if (dd < bd && (c.x - e.x) ** 2 + (c.z - e.z) ** 2 > 16) { bd = dd; bc = c; } }
        if (bc) { losBudget--; if (ray(bc.x, bc.y + 1.0, bc.z, e.x, e.y + 0.9, e.z) !== null) { if (b.cover) b.cover.by = -1; b.cover = bc; bc.by = b.i; b.coverT = 1.6 + rng() * 1.2; b.st = 'cover'; goTo(b, bc.x, bc.z, 0.4); return; } }
      }
      if (b.st === 'cover' && b.coverT > 0) return;
      b.st = 'fight';
      if (d > T_RANGE - 2) goTo(b, e.x, e.z, T_RANGE - 4); else b.pts = null;   // 너무 멀면 다가감 · 사거리 안이면 옆걸음(아래 실행)
      return;
    }
    if (b.st === 'cover' && b.coverT > 0) return;
    // 안 보임: 공격 = 우리 팀이 마지막으로 본 자리(8초 안) → 상대 진지 쪽 · 수비 = 우리 진지 앞 반원
    b.st = 'go';
    if (b.dest && b.pts && b.pi < b.pts.length) return;
    const m = memo[b.team], eb = basePos[1 - b.team];
    let x, z;
    if (b.role === 'attack') {
      if (clock - m.t < 8 && rng() < 0.7) { x = m.x + (rng() - 0.5) * 6; z = m.z + (rng() - 0.5) * 6; }
      else { const k = 0.35 + rng() * 0.45; x = home.x + (eb.x - home.x) * k; z = TC.z + (rng() - 0.5) * 24; }
    } else { const k = 0.18 + rng() * 0.2; x = home.x + (eb.x - home.x) * k; z = home.z + (rng() - 0.5) * 18; }
    x = Math.max(T_RECT[0] + 2, Math.min(T_RECT[2] - 2, x)); z = Math.max(T_RECT[1] + 2, Math.min(T_RECT[3] - 2, z));
    goTo(b, x, z, 1.5);
  }
  // 길: 먼 곳은 14m 앞 칸까지만 한 번에(maxExp 3000 · 한 프레임에 길찾기 하나) — 닿으면 다시
  function goTo(b, x, z, near) {
    if (b.dest && Math.abs(b.dest[0] - x) < 1.2 && Math.abs(b.dest[1] - z) < 1.2 && b.pts && b.pi < b.pts.length) return;
    if ((b.x - x) ** 2 + (b.z - z) ** 2 < near * near) { b.pts = null; b.dest = null; return; }
    if (planBudget <= 0) return; planBudget--;
    let gx = x, gz = z; const d = Math.hypot(x - b.x, z - b.z); if (d > 14) { gx = b.x + (x - b.x) * 14 / d; gz = b.z + (z - b.z) * 14 / d; }
    const i = nav.snap(gx, b.y, gz, 2); if (i < 0) { b.pts = null; return; }
    const res = nav.path([b.x, b.y, b.z], nav.pos(i), { maxExp: 3000 });
    if (res.ok && res.pts.length > 1) { b.pts = res.pts; b.pi = 1; b.dest = b.dest || [0, 0]; b.dest[0] = x; b.dest[1] = z; } else { b.pts = null; b.dest = null; }
  }
  // 두뇌 → 명령(매 프레임): 움직일 곳 · 겨눌 곳 · 쏘기
  function brain(b, dt) {
    const c = b.cmd; c.go = false; c.fire = false;
    if ((b.thinkT -= dt) <= 0) { b.thinkT = 0.28 + rng() * 0.12; think(b); }
    if (b.coverT > 0) b.coverT -= dt;
    if (b.pts && b.pi < b.pts.length) { const p = b.pts[b.pi]; if ((p[0] - b.x) ** 2 + (p[2] - b.z) ** 2 < 0.09) b.pi++; if (b.pi < b.pts.length) { c.go = true; c.mx = b.pts[b.pi][0]; c.mz = b.pts[b.pi][2]; c.run = b.st === 'refill' || b.st === 'cover' ? 1.15 : 1; } }
    if (b.see && b.tgt >= 0 && !b.refill) {
      const e = ACT[b.tgt]; b.seeT += dt;
      if (!alive(e)) { b.see = false; b.tgt = -1; return; }
      if (!c.go && b.st === 'fight') {   // 옆걸음(0.6~1.3초마다 방향 바꿈 · 막히면 반대로)
        if ((b.strafeT -= dt) <= 0) { b.strafeT = 0.6 + rng() * 0.7; b.strafe = rng() < 0.5 ? -1 : 1; }
        const ex = e.x - b.x, ez = e.z - b.z, l = Math.hypot(ex, ez) || 1, back = l < 5 ? -0.7 : 0;
        c.go = true; c.mx = b.x + (-ez / l * b.strafe + ex / l * back) * 2; c.mz = b.z + (ex / l * b.strafe + ez / l * back) * 2; c.run = 0.7;
      }
      // 쏘기: 반응 0.35~0.7초 뒤 · 1~1.8초 쏘고 0.4~0.9초 쉼 · 오차(거리 비례 — 한 번 쏠 때마다 새로) · 상대가 움직이면 반쯤 앞질러
      if (b.seeT > b.pause && b.tank > 0) {
        if (b.burst <= 0) { b.burst = 1 + rng() * 0.8; const dd = Math.sqrt(dist2(b, e)), er = 0.1 * dd * (e.human || e.remote ? 1 : 0.8); b.ex = (rng() - 0.5) * er; b.ey = (rng() - 0.3) * er * 0.5; b.ez = (rng() - 0.5) * er; }
        b.burst -= dt; if (b.burst <= 0) { b.seeT = 0; b.pause = 0.4 + rng() * 0.5; }
        const fly = Math.sqrt(dist2(b, e)) / 12;
        c.fire = true; c.ax = e.x + e.vx * fly * 0.5 + b.ex; c.ay = e.y + 0.75 + b.ey; c.az = e.z + e.vz * fly * 0.5 + b.ez;
      }
    }
  }
  // 명령 실행(모든 봇 같은 규칙 — 원격 배우도 이 함수에 명령만 넣으면 된다)
  const _bp = { x: 0, y: 0, z: 0 };
  function applyCmd(b, dt) {
    const c = b.cmd; let mvx = 0, mvz = 0;
    if (c.go) { const ex = c.mx - b.x, ez = c.mz - b.z, d = Math.hypot(ex, ez);
      if (d > 0.02) { const sp = Math.min(d, T_WALK * c.run * (b.wet > 70 ? 0.8 : 1) * dt); _bp.x = b.x; _bp.y = b.y; _bp.z = b.z; Q.moveBody(_bp, ex / d * sp, ez / d * sp);
        mvx = _bp.x - b.x; mvz = _bp.z - b.z; b.x = _bp.x; b.z = _bp.z; b.y += (_bp.y - b.y) * Math.min(1, dt * 12);
        if (mvx * mvx + mvz * mvz < sp * sp * 0.04) { if ((b.stuckT += dt) > 0.8) { b.stuckT = 0; b.pts = null; b.dest = null; b.strafe = -b.strafe; } } else b.stuckT = 0; } }
    b.walk += Math.hypot(mvx, mvz) * 5.5;
    // 몸 방향: 쏘면 겨눈 쪽 · 아니면 걷는 쪽
    let want = null; if (c.fire || (b.see && b.tgt >= 0)) { const e = c.fire ? null : ACT[b.tgt]; want = Math.atan2((c.fire ? c.ax : e.x) - b.x, (c.fire ? c.az : e.z) - b.z); } else if (mvx * mvx + mvz * mvz > 1e-6) want = Math.atan2(mvx, mvz);
    if (want != null) b.yaw += wrapA(want - b.yaw) * Math.min(1, dt * 9);
    if (c.fire && b.tank > 0) { b.tank = Math.max(0, b.tank - USE * dt); fireCmd(b, dt); } else b.emit = 0;
  }
  function fireCmd(b, dt) {   // 봇 물(겨눈 곳까지 포물선) — 방장 아닌 화면은 받은 겨눔으로 같은 물을 그린다
    const c = b.cmd; b.emit += T_RATE * dt;
    { const sy = Math.sin(b.yaw), cy = Math.cos(b.yaw), nx = b.x + sy * 0.48, ny = b.y + 0.6, nz = b.z + cy * 0.48;
      while (b.emit >= 1) { b.emit -= 1;
        const ex = c.ax - nx, ez = c.az - nz, dh = Math.hypot(ex, ez) || 1, hh = c.ay - ny, S2 = SPEED * SPEED, disc = S2 * S2 - G * (G * dh * dh + 2 * hh * S2);
        const a = disc >= 0 ? Math.atan((S2 - Math.sqrt(disc)) / (G * dh)) : Math.PI / 4 + Math.atan2(hh, dh) / 2, cc = Math.cos(a) * SPEED, j = 0.4;
        spawn(1, nx, ny, nz, ex / dh * cc + (rng() - 0.5) * j, Math.sin(a) * SPEED + (rng() - 0.5) * j, ez / dh * cc + (rng() - 0.5) * j, 2.0, 0.075, TEAM_W[b.team], b.i); }
    }
  }
  // 물방울이 배우에게(쏜 팀과 다른 팀만 · 다시 나온 뒤 1.5초는 안 젖음)
  function teamHit(i, ax, ay, az) {
    const o = own[i], ot = o >= 0 ? ACT[o].team : -1, bx = px[i], by = py[i], bz = pz[i];
    for (let k = 0; k < 8; k++) { const a = ACT[k]; if (a.team === ot || !a.alive) continue;
      if (!segHit(ax, ay, az, bx, by, bz, a.x, a.y + 0.72, a.z, a.human ? 0.45 : 0.48)) continue;
      burst(bx, by, bz, 3, TEAM_W[ot < 0 ? 0 : ot], 1.4, 1.2, 0.045);
      if (a.inv > 0 || st !== 'play') return true;
      if (NM.on && !a.human) {   // 친구 대결 판정: 친구 몸 = 그 친구 화면이 · 봇 = 방장 화면이(내가 쏜 물은 내가 알려 줌)
        a.hitT = 0.15;
        if (a.remote) { if (o === ME && splashT <= 0) { SND.splash(); splashT = 0.12; } return true; }
        if (!NM.host) { if (o === ME) { NM.hit[k] += T_HIT; if (splashT <= 0) { SND.splash(); splashT = 0.12; } } return true; }
        if (o >= 0 && ACT[o].remote) return true;
      }
      a.wet = Math.min(100, a.wet + T_HIT); a.wetT = 0; a.hitT = 0.15;
      if (a.human) { wet = a.wet; wetT = 0; cnt.wet++; SND.wet(); if (soakT <= 0) { slowT = 0.5; map.player.speed(0.85); } }
      else if (o === ME) { if (splashT <= 0) { SND.splash(); splashT = 0.12; } }
      if (a.wet >= 100) emit({ type: 'soak', by: o, who: k });
      return true; }
    return false;
  }
  const teamTargets = tgt => { const t = ACT[ME].team; for (const a of ACT) if (a.team !== t && a.alive) tgt(a.x, a.y + 0.72, a.z, 0.55); };

  // 팀 그리기(몸·조끼·다리 둘·팔 둘 — 행렬만)
  function drawBot(a) {
    const j = jOf(a);
    if (!a.alive && a.fall >= 1) { M.tbody.setMatrixAt(j, ZERO); M.tbib.setMatrixAt(j, ZERO); M.tleg.setMatrixAt(j * 2, ZERO); M.tleg.setMatrixAt(j * 2 + 1, ZERO); M.tarm.setMatrixAt(j * 2, ZERO); M.tarm.setMatrixAt(j * 2 + 1, ZERO); return; }
    const f = a.alive ? 0 : a.fall, sink = f * f * 0.9, sc = 1 - f * 0.55, yaw = a.yaw + (a.alive ? 0 : f * 9), tilt = a.alive ? 0 : f * 0.5, sq = a.hitT > 0 ? 0.06 : 0;
    const blink = a.inv > 0 && Math.floor(a.inv * 8) % 2 === 0;
    if (blink) { M.tbody.setMatrixAt(j, ZERO); M.tbib.setMatrixAt(j, ZERO); M.tleg.setMatrixAt(j * 2, ZERO); M.tleg.setMatrixAt(j * 2 + 1, ZERO); M.tarm.setMatrixAt(j * 2, ZERO); M.tarm.setMatrixAt(j * 2 + 1, ZERO); return; }
    const bob = Math.abs(Math.sin(a.walk)) * 0.035, y0 = a.y + 0.01 + bob - sink, sy = Math.sin(yaw), cy = Math.cos(yaw);
    _q.setFromEuler(_e.set(tilt, yaw, 0)); _s.set(sc * (1 + sq), sc * (1 - sq), sc * (1 + sq));
    _v.set(a.x, y0, a.z); M.tbody.setMatrixAt(j, _m4.compose(_v, _q, _s)); M.tbib.setMatrixAt(j, _m4);
    const sw = Math.sin(a.walk) * 0.7, aiming = a.cmd.fire || a.see;
    for (let s = 0; s < 2; s++) { const side = s ? 1 : -1;
      // 다리: 엉덩이(±0.085, 0.34)
      let ox = 0.085 * side * sc, oy = 0.34 * sc; _v.set(a.x + ox * cy, y0 + oy, a.z - ox * sy); _q.setFromEuler(_e.set(sw * side, yaw, 0)); _s.set(sc, sc, sc); M.tleg.setMatrixAt(j * 2 + s, _m4.compose(_v, _q, _s));
      // 팔: 어깨(±0.21, 0.7) — 겨누면 앞으로(물총 잡기) · 아니면 흔들기
      ox = 0.21 * side * sc; oy = 0.7 * sc; _v.set(a.x + ox * cy, y0 + oy, a.z - ox * sy); _q.setFromEuler(_e.set(aiming ? -1.25 : -sw * side * 0.8, yaw, aiming ? -0.35 * side : 0.12 * side)); M.tarm.setMatrixAt(j * 2 + s, _m4.compose(_v, _q, _s)); }
  }

  function teamBegin() {
    round++; st = 'count'; cd = 3; cdShown = -1; T = tTime; secShown = -1; teamScore = [0, 0]; clock = 0; hudScore = '';
    for (let i = 0; i < PMAX; i++) kind[i] = 0; for (let i = 0; i < MMAX; i++) { mlife[i] = 0; M.mark.setMatrixAt(i, ZERO); } M.mark.instanceMatrix.needsUpdate = true;
    for (const c of COVERS) c.by = -1; memo[0].t = memo[1].t = -99;
    for (const a of ACT) { a.soaks = 0; a.soaked = 0; spawnAt(a, true); }
    map.player.freeze(true); map.player.speed(1); wet = 0; tank = TANK; slowT = soakT = 0; inp.test = false; aimA = null;
    elFeed.textContent = ''; elG.style.display = ''; if (fireBtn) fireBtn.style.display = '';
    teamChip(); sndChip(); map.hud.chip('wg-board', coarse ? '📋 점수판' : '📋 점수판 (Tab)', { onClick: () => boardOn(!boardOnNow) }); goal(null);
    map.minimap.show(); teamMarks();
  }
  function teamMarks() {
    const mk = [];
    for (let t = 0; t < 2; t++) mk.push({ x: basePos[t].x, z: basePos[t].z, color: t ? '#e8eef5' : '#2b6fe0', shape: 'ring', label: t ? '백' : '청' });
    for (const a of ACT) if (a.i !== ME && a.team === ACT[ME].team && a.alive) mk.push({ x: a.x, z: a.z, color: TEAM_CSS[a.team] === '#ffffff' ? '#e8eef5' : '#3b82f6', shape: 'dot', r: 3 });
    map.minimap.setMarks(mk);
  }
  async function finishTeam() {
    st = 'end'; inp.key = inp.mouse = inp.pad = inp.test = false; map.player.aim(null); map.player.speed(1); map.player.freeze(true); goal(null); boardOn(false);
    for (const a of ACT) a.cmd.fire = false;
    const w = teamScore[0] > teamScore[1] ? 0 : teamScore[1] > teamScore[0] ? 1 : -1, me = ACT[ME], myT = me.team;
    if (NM.on) { netFinish(w); return; }
    const rec = map.store.get('team', { games: 0, wins: 0 }) || { games: 0, wins: 0 }; rec.games++; if (w === myT) rec.wins++; map.store.set('team', rec);   // 판이 끝날 때만 씀
    last = { mode: 'team', arena: arenaKey, score: teamScore.slice(), win: w, me: { soaks: me.soaks, soaked: me.soaked }, round };
    sfx('done'); if (w === 0) SND.bloom();
    let mvp = null; for (const a of ACT) if (!mvp || a.soaks > mvp.soaks) mvp = a;
    const i = await map.hud.ask('🏁 경기 끝!\n' + TEAM_I[0] + ' 청팀 ' + teamScore[0] + ' : ' + teamScore[1] + ' 백팀 ' + TEAM_I[1] + '\n' + (w < 0 ? '비겼어요 🤝' : w === 0 ? '🎉 청팀(우리 팀) 이겼어요!' : '백팀이 이겼어요 — 다음엔 꼭!')
      + '\n나: 💦 ' + me.soaks + '번 적심 · 😵 ' + me.soaked + '번 젖음' + (mvp && mvp.soaks ? '\n가장 많이 적신 배우: ' + TEAM_I[mvp.team] + ' ' + mvp.name + ' (' + mvp.soaks + ')' : '') + '\n우리 팀 ' + rec.wins + '승 / ' + rec.games + '판',
      ['다시 하기', '다른 놀이·경기장', '그만하기']);
    if (dead || map.gone || i < 0) return;
    if (i === 0) teamBegin(); else if (i === 1) menu(false); else map.quit();
  }

  // =====================================================================================
  // 👥 친구와 팀 대결(WG-NET) — Firebase match/c<번호>: m(경기: st lobby|count|play|end · host · arena · time · goal · t0 서버 시각 · seq) · p/<pid>{n,tm,on} · s/<pid>[내 상태] · b{자리:[봇 상태]} · ev/<id>{k soak|hit,by,who,n,q,t}
  // =====================================================================================
  const NM = { on: false, room: null, pid: null, name: '', host: false, es: null, D: {}, seen: new Set(), off: 0, seq: -1, st: null, sendT: 0, bT: 0, busyS: false, busyB: false,
    hit: new Float32Array(8), hitT: 0, ui: null, beat: 0, beatN: 0, lastSend: 0, claim: false, lastRes: null, assignKey: '', seenAt: {}, rtt: 0, lag: 0 };
  const MPX = () => { const mp = window.SM_MP; return mp && mp.room() ? mp : null; };
  const nreq = (path, method = 'GET', data) => fetch(MDB + NM.room + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data), keepalive: true }).then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)));
  const sNow = () => Date.now() + NM.off;
  const r2 = (v) => Math.round(v * 100) / 100;
  function applyEvt(root, type, path, d) {
    const set = (r, p, v) => {
      if (!p.length) return v && typeof v === 'object' ? v : {};
      let o = r; for (let i = 0; i < p.length - 1; i++) { if (!o[p[i]] || typeof o[p[i]] !== 'object') { if (v === null) return r; o[p[i]] = {}; } o = o[p[i]]; }
      if (v === null) delete o[p[p.length - 1]]; else o[p[p.length - 1]] = v; return r;
    };
    if (type === 'put') return set(root, path, d);
    if (d && typeof d === 'object') for (const k in d) root = set(root, [...path, ...k.split('/').filter(Boolean)], d[k]);
    return root;
  }
  // 친구 이름표(사람만 · 8칸)
  const TAGS = new Array(8).fill(null);
  function tagFor(a) {
    let t = TAGS[a.i]; const txt = a.name;
    if (t && t.userData.txt === txt) return t;
    if (!t) { t = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); t.scale.set(1.3, 0.33, 1); t.visible = false; map.add(t); TAGS[a.i] = t; }
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = a.team ? 'rgba(245,247,250,.95)' : 'rgba(59,130,246,.92)'; g.beginPath(); g.roundRect(4, 6, 248, 52, 22); g.fill();
    g.fillStyle = a.team ? '#1d3557' : '#fff'; g.font = '800 32px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt.slice(0, 8), 128, 34);
    if (t.material.map) t.material.map.dispose(); t.material.map = new THREE.CanvasTexture(c); t.material.map.colorSpace = THREE.SRGBColorSpace; t.material.needsUpdate = true; t.userData.txt = txt; return t;
  }
  function tagTick() {
    for (const a of ACT) { const t = TAGS[a.i]; const on = a.remote && a.i !== ME && (a.alive || a.fall < 1);
      if (!on) { if (t) t.visible = false; continue; } const tt = tagFor(a); tt.visible = true; tt.position.set(a.x, a.y + 1.78, a.z); }
  }
  function resetActors() {
    ME = 0; NM.assignKey = '';
    for (const a of ACT) { a.human = a.i === 0; a.remote = false; a.pid = null; a.net = null; a.name = a.human ? '나' : TEAM_N[a.team] + ' 봇 ' + (a.team ? a.i - 3 : a.i); }
    for (const t of TAGS) if (t) t.visible = false;
  }
  // 자리: 들어온 순서대로 팀마다 4자리(청 0~3 · 백 4~7) — 모두가 같은 목록으로 같은 자리를 계산한다
  function assign() {
    const P = NM.D.p || {}, ids = Object.keys(P).filter((id) => P[id] && typeof P[id].tm === 'number').sort((a, b) => (P[a].on || 0) - (P[b].on || 0) || (a < b ? -1 : 1));
    const c = [0, 0], who = new Array(8).fill(null);
    for (const id of ids) { let t = P[id].tm ? 1 : 0; if (c[t] >= 4) t = 1 - t; if (c[t] >= 4) continue; who[t * 4 + c[t]++] = id; }
    const key = who.join(',') + '|' + ids.map((id) => P[id].n).join(','); if (key === NM.assignKey) return; NM.assignKey = key;
    let me = -1;
    for (const a of ACT) { const id = who[a.i], was = a.remote || a.human;
      a.pid = id; a.human = id === NM.pid; a.remote = !!id && !a.human;
      a.name = a.human ? '나' : a.remote ? String(P[id].n || '친구').slice(0, 8) : TEAM_N[a.team] + ' 봇 ' + (a.i % 4 + 1);
      if (a.human) me = a.i;
      if (!a.remote) a.net = null; else a.net = (NM.D.s || {})[id] || a.net;
      if (was && !a.human && !a.remote && basePos[a.team] && (st === 'play' || st === 'count')) spawnAt(a, false);   // 친구가 나간 자리 = 봇이 진지에서
    }
    if (me < 0) { console.warn('[WG-NET] 자리 없음', NM.pid, JSON.stringify(P), JSON.stringify(who)); map.hud.toast('😥 두 팀 자리가 꽉 찼어요(4대4) — 다음 경기에 들어와요', 4); setTimeout(() => menu(false), 0); return; }
    ME = me; recolor();
  }
  async function netEnter() {
    const mp = MPX(); if (!mp) return menu(false);
    const N = mp.net();
    resetActors(); NM.on = true; NM.room = mp.room(); NM.pid = (N && N.id) || ('p' + Math.random().toString(36).slice(2, 10)); NM.name = (N && N.name) || '친구';
    NM.D = {}; NM.seen.clear(); NM.seq = -1; NM.st = null; NM.lastRes = null; NM.seenAt = {}; NM.hit.fill(0);
    if (N && N.hide) N.hide(true);   // 걷기 이름표 대신 경기 몸(팀 조끼 로봇 + 이름표)
    st = 'lobby'; lobbyDraw('불러오는 중…');
    let D0 = null;
    try {
      D0 = (await nreq('')) || {};
      const P = D0.p || {}, n = [0, 0]; for (const id in P) if (P[id] && id !== NM.pid) n[P[id].tm ? 1 : 0]++;
      const t1 = Date.now(), r = await nreq('/p/' + NM.pid, 'PUT', { n: NM.name, tm: n[0] <= n[1] ? 0 : 1, on: { '.sv': 'timestamp' } }), t2 = Date.now();
      NM.off = r.on - (t1 + t2) / 2; NM.rtt = t2 - t1;
      const m = D0.m, live = m && P[m.host] && Object.keys(P).length;
      if (!live) await nreq('/m', 'PUT', { st: 'lobby', host: NM.pid, arena: (m && m.arena) || 'field', time: (m && m.time) || 180, goal: (m && m.goal) || T_GOAL, seq: ((m && m.seq) || 0) + 1, t0: 0 });
      else if (m.st === 'end' || (m.st !== 'lobby' && sNow() > m.t0 + m.time * 1000 + 15000)) { /* 끝난 경기 — 대기실로 보이게만 */ }
    } catch (e) { map.hud.toast('😥 친구 대결에 들어가지 못했어요 — 인터넷·방을 확인해 주세요', 4); NM.on = false; if (N && N.hide) N.hide(false); return menu(false); }
    if (dead || !NM.on) return;
    if (D0 && D0.ev) for (const id in D0.ev) NM.seen.add(id);   // 들어오기 전 사건은 점수만(아래 stateChange가 다시 셈)
    NM.es = new EventSource(MDB + NM.room + '.json');
    const on = (type) => (e) => { let msg; try { msg = JSON.parse(e.data); } catch (er) { return; } if (!msg) return; NM.D = applyEvt(NM.D, type, (msg.path || '/').split('/').filter(Boolean), msg.data); netSync(); };
    NM.es.addEventListener('put', on('put')); NM.es.addEventListener('patch', on('patch'));
    addEventListener('pagehide', netBye);
    clearInterval(NM.beat); NM.beat = setInterval(() => { if (NM.on && performance.now() - NM.lastSend > 2500) netSend(0, map.player.pos(), false, true); }, 1500);   // 탭이 뒤에 있어 화면이 멈춰도 '있어요' 신호
  }
  function netBye() { if (!NM.on) return; fetch(MDB + NM.room + '/p/' + NM.pid + '.json', { method: 'DELETE', keepalive: true }).catch(() => {}); fetch(MDB + NM.room + '/s/' + NM.pid + '.json', { method: 'DELETE', keepalive: true }).catch(() => {}); }
  function netLeave() {
    if (!NM.on) return;
    const P = NM.D.p || {}, rest = Object.keys(P).filter((id) => id !== NM.pid).sort((a, b) => (P[a].on || 0) - (P[b].on || 0));
    if (!rest.length) nreq('', 'DELETE').catch(() => {});   // 마지막 사람 = 경기 통째로 치움
    else { netBye(); if (NM.host) nreq('/m/host', 'PUT', rest[0]).catch(() => {}); }
    if (NM.es) NM.es.close(); NM.es = null; NM.on = false; clearInterval(NM.beat); removeEventListener('pagehide', netBye);
    const mp = window.SM_MP, N = mp && mp.net(); if (N && N.hide) N.hide(false);
    if (NM.ui) { NM.ui.remove(); NM.ui = null; }
    resetActors();
  }
  function netSync() {
    const D = NM.D, m = D.m; if (!m || !NM.on) return;
    NM.host = m.host === NM.pid;
    assign(); if (!NM.on) return;
    const S = D.s || {}, now = performance.now();
    for (const id in S) if (S[id] !== NM.seenAt[id + '#']) { NM.seenAt[id + '#'] = S[id]; NM.seenAt[id] = now; }
    for (const a of ACT) if (a.remote) { const v = S[a.pid]; if (v) a.net = v; }
    if (!NM.host && D.b) for (const a of ACT) if (!a.human && !a.remote) { const v = D.b[a.i]; if (v) a.net = v; }
    if (m.seq !== NM.seq || m.st !== NM.st) stateChange(m);
    const E = D.ev || {};
    for (const id in E) { if (NM.seen.has(id)) continue; NM.seen.add(id); const e = E[id]; if (e && e.q === m.seq) onNetEv(e); }
    hostCheck(m);
    if (NM.ui) lobbyDraw();
  }
  function onNetEv(e) {
    const a = ACT[e.who]; if (!a) return;
    if (e.k === 'soak') onSoak(typeof e.by === 'number' ? e.by : -1, e.who);
    else if (e.k === 'hit' && NM.host && !a.human && !a.remote && a.alive && a.inv <= 0 && st === 'play') {
      a.wet = Math.min(100, a.wet + (e.n || 0)); a.wetT = 0; a.hitT = 0.15; if (a.wet >= 100) emit({ type: 'soak', by: e.by, who: e.who });
    }
  }
  function netEmit(e) { const id = 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); NM.seen.add(id); e.q = NM.seq; e.t = { '.sv': 'timestamp' }; nreq('/ev/' + id, 'PUT', e).catch(() => {}); }
  function stateChange(m) {
    const newSeq = m.seq !== NM.seq; NM.seq = m.seq; NM.st = m.st;
    if (m.st === 'count' || m.st === 'play') {
      if (newSeq || (st !== 'count' && st !== 'play')) {
        if (arenaKey !== m.arena) { if (arenaKey) teamTeardown(); teamSetup(m.arena); }
        tTime = m.time; tGoal = m.goal || T_GOAL; lobbyHide(); teamBegin();
        const E = NM.D.ev || {};   // 늦게 들어옴: 이미 난 사건 = 점수만
        for (const id in E) { const e = E[id]; if (!e || e.q !== m.seq || e.k !== 'soak') continue; NM.seen.add(id); const s9 = ACT[e.by]; if (s9) { s9.soaks++; teamScore[s9.team]++; } if (ACT[e.who]) ACT[e.who].soaked++; }
        teamChip();
      }
    } else if (m.st === 'end') { if (st === 'count' || st === 'play') finishTeam(); else lobbyDraw(); }
    else { if (st === 'count' || st === 'play') { map.hud.banner('경기를 멈췄어요', 1.5); } lobbyShow(); }
  }
  // 방장이 나갔거나(p 없음) 30초 넘게 소식이 없으면 → 소식 있는 사람 중 가장 먼저 들어온 사람이 방장(지우지는 않음 — 잠깐 다른 탭을 본 친구가 튕기지 않게)
  //   경기 중 90초 넘게 소식 없는 친구 자리만 방장이 비운다(그 자리는 봇이)
  function hostCheck(m) {
    const P = NM.D.p || {}, now = performance.now(); if (!P[NM.pid]) return;
    const quiet = (id, ms) => NM.seenAt[id] && now - NM.seenAt[id] > ms;
    if (m.host !== NM.pid && (!P[m.host] || quiet(m.host, 30000))) {
      const first = Object.keys(P).filter((id) => id === NM.pid || !quiet(id, 30000)).sort((a, b) => (P[a].on || 0) - (P[b].on || 0))[0];
      if (first === NM.pid && !NM.claim) { NM.claim = true; nreq('/m/host', 'PUT', NM.pid).catch(() => {}).finally(() => { NM.claim = false; }); }
    }
    if (NM.host && st === 'play') for (const id in P) if (id !== NM.pid && quiet(id, 90000)) { nreq('/p/' + id, 'DELETE').catch(() => {}); delete NM.seenAt[id]; }
  }
  // 친구·(방장 아닌 화면의) 봇: 받은 상태를 부드럽게 따라가고, 쏘고 있으면 같은 물을 그린다
  function netActor(a, dt, human) {
    const v = a.net; a.cmd.go = false; a.cmd.fire = false; if (!v) return;
    const ox = a.x, oz = a.z, k = Math.min(1, dt * 12);
    if ((v[0] - a.x) ** 2 + (v[2] - a.z) ** 2 > 25) { a.x = v[0]; a.y = v[1]; a.z = v[2]; }   // 다시 출발 등 순간 이동
    else { a.x += (v[0] - a.x) * k; a.y += (v[1] - a.y) * k; a.z += (v[2] - a.z) * k; }
    a.yaw += wrapA(v[3] - a.yaw) * Math.min(1, dt * 14);
    const mv = Math.hypot(a.x - ox, a.z - oz); a.walk += mv * 5.5; a.vx = (a.x - ox) / Math.max(dt, 1e-3); a.vz = (a.z - oz) / Math.max(dt, 1e-3);
    if (!a.alive || st !== 'play' || !v[4]) { a.emit = 0; return; }
    a.cmd.fire = true;
    if (human) {
      a.emit += T_RATE * 1.25 * dt; const sy = Math.sin(a.yaw), cy = Math.cos(a.yaw), nx = a.x + sy * 0.46 - cy * 0.1, ny = a.y + 0.62, nz = a.z + cy * 0.46 + sy * 0.1;
      while (a.emit >= 1) { a.emit -= 1; spawn(1, nx, ny, nz, v[5] + (rng() - 0.5) * 0.35, v[6] + (rng() - 0.5) * 0.35, v[7] + (rng() - 0.5) * 0.35, 2.4, 0.075, TEAM_W[a.team], a.i); }
    } else { a.cmd.ax = v[5]; a.cmd.ay = v[6]; a.cmd.az = v[7]; fireCmd(a, dt); }
  }
  // 보내기: 내 상태(경기 중 10번/초 · 대기실 2초마다) · 방장 = 봇 상태 · 내가 봇을 맞힌 양(0.2초마다 모아서)
  function netSend(dt, me, firing, beat) {
    NM.sendT -= dt; NM.bT -= dt; NM.hitT -= dt;
    const busy = st === 'play' || st === 'count';
    if ((NM.sendT <= 0 || beat) && !NM.busyS) {
      NM.sendT = busy ? 0.1 : 2; NM.busyS = true; const a = ACT[ME], t1 = NM.lastSend = performance.now();
      nreq('/s/' + NM.pid, 'PUT', [r2(me.x), r2(me.y), r2(me.z), r2(gunYaw), firing && tank > 0 ? 1 : 0, r2(aim.vx), r2(aim.vy), r2(aim.vz), Math.round(wet), a.alive ? 1 : 0, (NM.beatN = (NM.beatN + 1) % 100)])   // 마지막 = 신호 번호(가만히 있어도 바뀌어야 친구 화면이 '있음'을 안다)
        .then(() => { NM.lag = Math.round(performance.now() - t1); }).catch(() => {}).finally(() => { NM.busyS = false; });
    }
    if (beat) return;
    if (NM.host && busy && NM.bT <= 0 && !NM.busyB) {
      NM.bT = 0.1; NM.busyB = true; const b = {};
      for (const a of ACT) if (!a.human && !a.remote) b[a.i] = [r2(a.x), r2(a.y), r2(a.z), r2(a.yaw), a.cmd.fire && a.alive ? 1 : 0, r2(a.cmd.ax), r2(a.cmd.ay), r2(a.cmd.az), Math.round(a.wet), a.alive ? 1 : 0];
      nreq('/b', 'PUT', b).catch(() => {}).finally(() => { NM.busyB = false; });
    }
    if (NM.hitT <= 0) { NM.hitT = 0.2; for (let k = 0; k < 8; k++) if (NM.hit[k] > 0) { netEmit({ k: 'hit', by: ME, who: k, n: Math.round(NM.hit[k]) }); NM.hit[k] = 0; } }
  }
  function netFinish(w) {
    const myT = ACT[ME].team, me = ACT[ME];
    let mvp = null; for (const a of ACT) if (!mvp || a.soaks > mvp.soaks) mvp = a;
    NM.lastRes = { s: teamScore.slice(), w, myT, soaks: me.soaks, soaked: me.soaked, mvp: mvp && mvp.soaks ? (mvp.human ? '나' : mvp.name) + ' ' + mvp.soaks + '번' : '' };
    const rec = map.store.get('net', { games: 0, wins: 0 }) || { games: 0, wins: 0 }; rec.games++; if (w === myT) rec.wins++; map.store.set('net', rec);
    sfx('done'); if (w === myT) SND.bloom();
    map.hud.banner(w < 0 ? '🤝 비겼어요!' : w === myT ? '🎉 우리 팀 승리!' : '다음엔 꼭!', 2.2);
    if (NM.host && NM.D.m && NM.D.m.st !== 'end') nreq('/m/st', 'PUT', 'end').catch(() => {});
    setTimeout(() => { if (NM.on && !dead) lobbyShow(); }, 2200);
  }
  // ---------- 대기실(팀 · 경기장 · 시간 · ▶ 시작) ----------
  function lobbyShow() {
    st = 'lobby'; map.player.freeze(true); map.player.aim(null); goal(null); inp.key = inp.mouse = inp.pad = inp.test = false; boardOn(false);
    elG.style.display = 'none'; if (fireBtn) fireBtn.style.display = 'none'; land.visible = false; gun.visible = false; vest.visible = false;
    showSet(TEAM_M, false); for (const t of TAGS) if (t) t.visible = false; for (let i = 0; i < PMAX; i++) kind[i] = 0; M.drop.visible = false;
    clearChips(); elFeed.textContent = ''; feedN = 0; map.hud.goal(null);
    document.exitPointerLock?.(); lobbyDraw();
  }
  function lobbyHide() { if (NM.ui) { NM.ui.remove(); NM.ui = null; } showSet(TEAM_M, true); }
  function lobbyDraw(msg) {
    if (!NM.ui) {
      NM.ui = document.createElement('div'); NM.ui.className = 'wg-lobby';
      NM.ui.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,94vw);max-height:90vh;overflow:auto;box-sizing:border-box;pointer-events:auto;background:#fffdf6;color:#1d3557;border:3px solid #1d3557;border-radius:16px;padding:14px 16px;box-shadow:0 8px 28px rgba(0,0,0,.3);font:15px/1.5 "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
      for (const t of ['keydown', 'keyup']) NM.ui.addEventListener(t, (e) => e.stopPropagation());
      NM.ui.addEventListener('click', lobbyClick); root.appendChild(NM.ui);
    }
    const D = NM.D, m = D.m, P = D.p || {};
    if (!m) { NM.ui.innerHTML = '<b>👥 친구와 팀 대결</b><div style="margin-top:6px">' + (msg || '불러오는 중…') + '</div>'; return; }
    const bt = (a, t, on, x = '') => '<button data-w="' + a + '" style="font:inherit;font-weight:800;border:0;border-radius:9px;padding:6px 11px;cursor:pointer;' + (on ? 'background:#1d3557;color:#fff' : 'background:#e8edf3;color:#1d3557') + x + '">' + t + '</button>';
    const row = (t) => ACT.filter((a) => a.team === t).map((a) => a.human ? '<b>⭐ ' + esc(NM.name) + '(나)</b>' : a.remote ? esc(a.name) : '<span style="opacity:.55">🤖 봇</span>').join(' · ');
    const hostN = NM.host ? '나' : P[m.host] ? esc(P[m.host].n) : '방장', AN = { field: '운동장', box: '컨테이너 경기장' }, playing = m.st === 'count' || m.st === 'play';
    const R = NM.lastRes, rec = map.store.get('net', null);
    let h = '<div style="font-weight:900;font-size:18px">👥 친구와 물총 팀 대결</div>'
      + (R ? '<div style="margin:6px 0;padding:6px 9px;border-radius:9px;background:#fff3bf">🏁 지난 경기 ' + TEAM_I[0] + ' ' + R.s[0] + ' : ' + R.s[1] + ' ' + TEAM_I[1] + ' — ' + (R.w < 0 ? '비김' : R.w === R.myT ? '우리 팀 승리 🎉' : TEAM_N[R.w] + ' 승리') + '<br><span style="font-size:13px">나 💦 ' + R.soaks + '번 적심 · 😵 ' + R.soaked + '번 젖음' + (R.mvp ? ' · 가장 많이 적신 사람: ' + esc(R.mvp) : '') + '</span></div>' : '')
      + '<div style="margin-top:6px;padding:7px 9px;border-radius:9px;background:#e7f0ff">🔵 <b>청팀</b> ' + row(0) + '</div>'
      + '<div style="margin-top:5px;padding:7px 9px;border-radius:9px;background:#f1f3f5">⚪ <b>백팀</b> ' + row(1) + '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + bt('team', '🔄 팀 바꾸기') + '</div>';
    if (playing) h += '<div style="margin-top:8px;font-weight:800">⏳ 경기 중이에요 — 곧 들어가요</div>';
    else if (NM.host) h += '<div style="margin-top:10px;font-size:13px;color:#5a6b80">방장 = 나 · 정하고 ▶ 시작</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">' + bt('arena-field', '⚽ 운동장', m.arena === 'field') + bt('arena-box', '📦 컨테이너', m.arena === 'box') + '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + bt('time-120', '2분', m.time === 120) + bt('time-180', '3분', m.time === 180) + bt('time-300', '5분', m.time === 300) + '</div>'
      + '<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px">' + bt('start', '▶ 시작!', true, ';font-size:17px;padding:8px 18px') + '</div>';
    else h += '<div style="margin-top:10px">방장 ⭐' + hostN + '이(가) ▶ 시작을 누르면 모두 같이 시작해요<br><span style="font-size:13px;color:#5a6b80">경기장 ' + (AN[m.arena] || m.arena) + ' · ' + Math.round(m.time / 60) + '분 · 먼저 ' + (m.goal || T_GOAL) + '번 적시면 승리</span></div>';
    h += '<div style="display:flex;gap:6px;justify-content:space-between;align-items:center;margin-top:10px"><span style="font-size:12px;color:#5a6b80">' + (rec && rec.games ? '친구 대결 ' + rec.wins + '승/' + rec.games + '판 · ' : '') + '방 ' + esc(NM.room.slice(1)) + '</span>' + bt('leave', '나가기') + '</div>';
    if (NM.ui.dataset.h !== h) { NM.ui.dataset.h = h; NM.ui.innerHTML = h; }
  }
  async function lobbyClick(e) {
    e.stopPropagation(); const b = e.target.closest('[data-w]'); if (!b || !NM.on) return; const w = b.dataset.w, m = NM.D.m || {};
    try {
      if (w === 'team') { const t = 1 - ACT[ME].team; if (ACT.filter((a) => a.team === t && (a.remote || a.human)).length >= 4) return map.hud.toast('그 팀은 꽉 찼어요(4명)', 2); await nreq('/p/' + NM.pid + '/tm', 'PUT', t); }
      else if (w.startsWith('arena-') && NM.host) await nreq('/m/arena', 'PUT', w.slice(6));
      else if (w.startsWith('time-') && NM.host) await nreq('/m/time', 'PUT', +w.slice(5));
      else if (w === 'start' && NM.host) { await nreq('/ev', 'DELETE'); await nreq('/b', 'DELETE'); await nreq('/m', 'PATCH', { st: 'count', t0: Math.round(sNow() + 4000), seq: (m.seq || 0) + 1 }); }
      else if (w === 'leave') { menu(false); }
    } catch (er) { map.hud.toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 2.5); }
  }
  // 시험용
  function netStart() { const b = NM.ui && NM.ui.querySelector('[data-w="start"]'); if (b) b.click(); return !!b; }
  function netTeam() { const b = NM.ui && NM.ui.querySelector('[data-w="team"]'); if (b) b.click(); }

  // ---------- 한 판(혼자 연습) ----------
  function goal(text, sec) { map.hud.goal(text); goalT = sec || 0; }
  function begin(r) {
    round = r; st = 'count'; cd = 3; cdShown = -1; T = ROUND_S; secShown = -1; score = 0; tank = TANK; wet = 0; wetT = 9; slowT = soakT = 0; inp.test = false; aimA = null;
    for (const k in cnt) cnt[k] = 0;
    for (let i = 0; i < PMAX; i++) kind[i] = 0; for (let i = 0; i < MMAX; i++) { mlife[i] = 0; M.mark.setMatrixAt(i, ZERO); } M.mark.instanceMatrix.needsUpdate = true;
    map.player.freeze(true); map.player.speed(1);
    map.player.teleport('spawn:field-center', { h: 90 });
    placeAll();
    elG.style.display = ''; if (fireBtn) fireBtn.style.display = '';
    scoreChip(); timeChip(); sndChip(); goal(null);
    map.minimap.show();
  }
  async function finish() {
    st = 'end'; inp.key = inp.mouse = inp.pad = inp.test = false; map.player.aim(null); map.player.speed(1); map.player.freeze(true); goal(null);
    const rec = best == null || score > best; if (rec) { best = score; map.store.set('best', score); }   // 기록은 판이 끝날 때만 쓴다(map.store — 2초 안에 localStorage · try/catch)
    last = { mode: 'solo', score, best, rec, round, ...cnt };
    sfx('done');
    const i = await map.hud.ask('💦 물총 연습 끝!\n점수 ' + score + '점' + (rec ? '  🏆 새 기록!' : '\n가장 높은 점수 ' + best + '점')
      + '\n🎈 ' + cnt.bal + '  🔥 ' + cnt.fire + '  🌸 ' + cnt.flow + '  🤖 ' + cnt.bot, ['다시 하기', '다른 놀이·경기장', '그만하기']);
    if (dead || map.gone || i < 0) return;
    if (i === 0) begin(round + 1); else if (i === 1) menu(false); else map.quit();
  }

  // ---------- 고르기(판 전에) ----------
  async function menu(first) {
    st = 'menu'; map.player.freeze(true); map.player.aim(null); goal(null); inp.key = inp.mouse = inp.pad = inp.test = false;
    elG.style.display = 'none'; if (fireBtn) fireBtn.style.display = 'none'; clearChips(); boardOn(false);
    if (NM.on) netLeave(); if (mode === 'solo') soloTeardown(); if (mode === 'team' && arenaKey) teamTeardown(); mode = null; arenaKey = null;
    for (let i = 0; i < PMAX; i++) kind[i] = 0;
    let m = first && /^(solo|team|net)$/.test(params.mode || '') ? params.mode : null, ak = first && /^(field|box)$/.test(params.arena || '') ? params.arena : null;
    if (m === 'team' && !ak) ak = 'field';
    if (!m) {
      const rec = map.store.get('team', null), inRoom = !!MPX();
      const i = await map.hud.ask('💦 물총 놀이\n무엇을 할까요?', ['🎯 혼자 연습 — 과녁 맞히기(3분)' + (best != null ? '  (최고 ' + best + '점)' : ''),
        '🔵⚪ 봇과 팀 대결 — 운동장(골대 앞 진지)', '🔵⚪ 봇과 팀 대결 — 컨테이너 경기장' + (rec && rec.games ? '  (' + rec.wins + '승/' + rec.games + '판)' : ''),
        inRoom ? '👥 친구와 팀 대결 — 같은 방 친구들과(빈자리는 봇)' : '👥 친구와 팀 대결 — 먼저 왼쪽 위 👥 함께하기로 방에 들어가요', '그만하기']);
      if (dead || map.gone || i < 0) return; if (i === 4) { map.quit(); return; }
      if (i === 3) { if (!inRoom) { map.hud.toast('👥 왼쪽 위 「함께하기」를 눌러 선생님이 연 방에 먼저 들어가요', 4); return menu(false); } m = 'net'; }
      else { m = i === 0 ? 'solo' : 'team'; ak = i === 2 ? 'box' : 'field'; }
    }
    if (m === 'net') { for (let k = 0; k < 30 && !MPX() && !dead; k++) await new Promise((r) => setTimeout(r, 200));   // ?mode=net — 방(lobby.js)이 다시 들어가는 동안 잠깐 기다림
      if (!MPX()) { map.hud.toast('👥 왼쪽 위 「함께하기」를 눌러 선생님이 연 방에 먼저 들어가요', 4); return menu(false); } mode = 'team'; return netEnter(); }
    mode = m;
    if (m === 'solo') { soloSetup(); begin(round + 1); }
    else { tGoal = Math.max(1, Math.min(99, +params.goal || T_GOAL)); tTime = Math.max(20, Math.min(900, +params.time || T_TIME)); teamSetup(ak); teamBegin(); }
  }

  menu(true);
  let shT = 0, shW = 0, shV = 0;
  let gunYaw = 0, lastX = map.player.get().x, lastZ = map.player.get().z, aimHold = 0;

  // ---------- 매 프레임: 팀 ----------
  function teamTick(dt, me) {
    clock += dt;
    const P0 = ACT[ME]; P0.vx = (me.x - P0.x) / Math.max(dt, 1e-3); P0.vz = (me.z - P0.z) / Math.max(dt, 1e-3); P0.x = me.x; P0.y = me.y; P0.z = me.z; P0.tank = tank;
    planBudget = 1; losBudget = 3;
    for (let k = 0; k < 8; k++) { const a = ACT[k];
      if (a.inv > 0) a.inv -= dt; if (a.hitT > 0) a.hitT -= dt;
      a.wetT += dt; if (a.alive && a.wetT > 2.5 && a.wet > 0) a.wet = Math.max(0, a.wet - 18 * dt);
      if (!a.alive) { a.fall = Math.min(1, a.fall + dt / 0.7); if (st === 'play' && (a.reT -= dt) <= 0) { spawnAt(a, false); if (a.human) { map.player.freeze(false); map.hud.banner('다시 출발!', 0.9); } } continue; }
      if (a.human) { a.wet = wet; continue; }
      if (a.remote) { netActor(a, dt, true); continue; }
      if (NM.on && !NM.host) { netActor(a, dt, false); continue; }   // 봇은 방장 화면이 움직인다
      { a.vx = (a.x - a.lastX) / Math.max(dt, 1e-3); a.vz = (a.z - a.lastZ) / Math.max(dt, 1e-3); a.lastX = a.x; a.lastZ = a.z; }
      // 진지에서 물 채우기
      const hb = basePos[a.team]; if ((a.x - hb.x) ** 2 + (a.z - hb.z) ** 2 < 6.8) a.tank = Math.min(TANK, a.tank + REFILL * dt);
      if (st === 'play') { brain(a, dt); applyCmd(a, dt); } else { a.cmd.go = a.cmd.fire = false; }
    }
    for (const a of ACT) if (a.i !== ME) drawBot(a);
    if (NM.on) tagTick();
    M.tbody.instanceMatrix.needsUpdate = M.tbib.instanceMatrix.needsUpdate = M.tleg.instanceMatrix.needsUpdate = M.tarm.instanceMatrix.needsUpdate = true;
    // 내 조끼(내 캐릭터 몸통 위 — 몸 방향 = 물총 방향 추정과 같은 값)
    const camNear = cam.position.distanceToSquared(_v.set(me.x, me.y + 1.3, me.z)) < 0.36;
    vest.visible = ACT[ME].alive && !camNear; if (vest.visible) { vest.position.set(me.x, me.y, me.z); vest.rotation.y = gunYaw; }
    // 알림 줄 지우기 · 미니맵 우리 팀 점(3번/초)
    if (feedN && elFeed.firstChild && +elFeed.firstChild.dataset.t < clock) { elFeed.firstChild.remove(); feedN--; }
    if ((mmT -= dt) <= 0) { mmT = 0.33; teamMarks(); }
  }

  return {
    tick(dt) {
      if (dead || st === 'menu' || st === 'prep') return;
      if (st === 'lobby') { if (NM.on) netSend(dt, map.player.pos(), false); return; }
      const me = map.player.get();
      if (splashT > 0) splashT -= dt; if (markCool > 0) markCool -= dt;
      const team = mode === 'team', meAlive = !team || ACT[ME].alive;
      if (NM.on && NM.D.m) { const m9 = NM.D.m; if (st === 'count') cd = (m9.t0 - sNow()) / 1000; }
      // 3·2·1
      if (st === 'count') { cd -= dt; const n = Math.ceil(cd);
        if (n !== cdShown) { cdShown = n; if (n > 0) { map.hud.banner(String(n), 1.2); sfx('tick'); } }
        if (cd <= 0) { st = 'play'; map.player.freeze(false); map.hud.banner(team ? '경기 시작!' : '물총 발사!', 1.0); sfx('go');
          if (team) { const mt = ACT[ME].team; goal((coarse ? '💧 버튼' : '클릭·F') + '로 ' + TEAM_I[1 - mt] + ' ' + TEAM_N[1 - mt] + (NM.on ? '' : ' 봇') + '을 흠뻑 적셔요! 물은 우리 진지(' + (mt ? '흰' : '파란') + ' 빛기둥)에서', 7);
            map.hud.toast(TEAM_I[mt] + ' 우리 팀 = ' + (mt ? '흰' : '파란') + ' 조끼 · 먼저 ' + tGoal + '번 적시면 이겨요 · ' + (coarse ? '📋 칩' : 'Tab') + ' = 점수판', 5); }
          else { goal(coarse ? '💧 과녁에 물을 쏴요! 💧 버튼 누른 채 끌면 조준' : '💧 과녁에 물을 쏴요! 십자선 = 조준 · 클릭·F 누르고 있기', 6);
            map.hud.toast(coarse ? '🎈풍선 🔥불 🌸꽃 🤖로봇 — 위를 보면 멀리 · 흰 고리 = 물이 떨어질 자리 · 👁 = 1인칭' : '🎈풍선 🔥불 🌸꽃 🤖로봇 — 위를 보면 멀리 · 흰 고리 = 물이 떨어질 자리 · V = 1인칭', 5); } } }
      if (st === 'play') {
        if (NM.on && NM.D.m) T = (NM.D.m.t0 + NM.D.m.time * 1000 - sNow()) / 1000; else T -= dt;
        const s = Math.ceil(T); if (s !== secShown) { secShown = s; if (team) teamChip(); else timeChip(); if (s <= 10 && s > 0) sfx('tick'); }
        if (T <= 0) { T = 0; if (team) teamChip(); else timeChip(); if (team) finishTeam(); else finish(); }
      }
      if (goalT > 0 && (goalT -= dt) <= 0) goal(null);
      // 몸 방향(물총 자리): 쏘는 동안 = 카메라가 보는 쪽(③) · 아니면 걷는 방향(움직임으로 추정 — main.js P.yaw와 같은 식)
      const mdx = me.x - lastX, mdz = me.z - lastZ; lastX = me.x; lastZ = me.z;
      const firing = st === 'play' && meAlive && (inp.key || inp.mouse || inp.pad || inp.test || inp.tap); inp.tap = false;
      if (firing) { _f.set(0, 0, -1).applyQuaternion(cam.quaternion); if (_f.x * _f.x + _f.z * _f.z > 1e-6) gunYaw = Math.atan2(_f.x, _f.z); }
      const gx0 = Math.sin(gunYaw), gz0 = Math.cos(gunYaw), FP = map.player.first;
      let nozX = me.x + gx0 * 0.46 - gz0 * 0.1, nozY = me.y + 0.62, nozZ = me.z + gz0 * 0.46 + gx0 * 0.1;
      if (FP) { _f.set(0, 0, -1).applyQuaternion(cam.quaternion); const fl9 = Math.hypot(_f.x, _f.z) || 1, rx9 = -_f.z / fl9, rz9 = _f.x / fl9, cp = cam.position;   // 1인칭 꼭지 = 화면 오른쪽 아래 물총 끝
        nozX = cp.x + _f.x * 0.8 + rx9 * 0.2; nozY = cp.y + _f.y * 0.8 - 0.19; nozZ = cp.z + _f.z * 0.8 + rz9 * 0.2; }   // 물총 끝(눈 앞 0.8 · 오른쪽 0.2 · 아래 0.19)
      if (st === 'play' && meAlive) { computeAim(me, nozX, nozY, nozZ, dt, team ? teamTargets : soloTargets); landTick(nozX, nozY, nozZ); } else land.visible = false;   // 떨어질 자리 표시(쏘기 전에도)
      if (firing) {
        aimHold = 0.6;
        if (tank > 0) {
          tank = Math.max(0, tank - USE * dt); emitAcc += (team ? T_RATE * 1.25 : RATE) * dt;
          while (emitAcc >= 1) { emitAcc -= 1; const j = FP ? 0.22 : 0.35; spawn(1, nozX, nozY, nozZ, aim.vx + (rng() - 0.5) * j, aim.vy + (rng() - 0.5) * j, aim.vz + (rng() - 0.5) * j, 2.4, 0.075, team ? TEAM_W[ACT[ME].team] : WATER_C, team ? ME : 0); }   // 물 주인 = 내 배우 번호(친구 대결에서 백팀이면 4~7)
          if ((sprayT -= dt) <= 0) { sprayT = 0.13; SND.spray(); }
          if (tank <= 0) { SND.empty(); goal(team ? '💧 물이 없어요! 우리 진지(빛기둥)로' : '💧 물이 없어요! 파란 빛기둥에서 채워요', 4); }
        } else if ((emptyT -= dt) <= 0) { emptyT = 0.7; SND.empty(); if (goalT <= 0) goal(team ? '💧 물이 없어요! 우리 진지(빛기둥)로' : '💧 물이 없어요! 파란 빛기둥에서 채워요', 3); }
      } else emitAcc = 0;
      if (aimHold > 0 && !FP) { aimHold -= dt; map.player.aim(aim.h); gunYaw = Math.atan2(Math.sin(aim.h * Math.PI / 180), -Math.cos(aim.h * Math.PI / 180)); if (aimHold <= 0) map.player.aim(null); }
      else if (mdx * mdx + mdz * mdz > 1e-5) gunYaw = Math.atan2(mdx, mdz);
      gun.visible = meAlive && st !== 'menu';
      if (FP) {   // 1인칭: 물총을 화면 오른쪽 아래에(카메라를 따라 · 쏘면 살짝 뒤로 반동)
        const kick = firing && tank > 0 ? Math.sin(performance.now() * 0.06) * 0.008 : 0, fl9 = Math.hypot(_f.x, _f.z) || 1, rx9 = -_f.z / fl9, rz9 = _f.x / fl9, cp = cam.position;
        gun.scale.setScalar(0.42);
        gun.position.set(cp.x + _f.x * (0.5 - kick) + rx9 * 0.24, cp.y + _f.y * 0.5 - 0.22, cp.z + _f.z * (0.5 - kick) + rz9 * 0.24);
        gun.quaternion.copy(cam.quaternion); gun.rotateY(Math.PI); gun.rotateX(-0.06);
      } else { gun.scale.setScalar(1);
        gun.position.set(me.x + Math.sin(gunYaw) * 0.26 - Math.cos(gunYaw) * 0.1, me.y + 0.6, me.z + Math.cos(gunYaw) * 0.26 + Math.sin(gunYaw) * 0.1);
        gun.rotation.set(firing ? -Math.atan2(aim.vy, Math.hypot(aim.vx, aim.vz)) : 0.15, gunYaw, 0); }
      // 어깨 너머 시점: 머리·카메라 오른쪽 0.9m가 트였을 때만 0.55m 비켜 섬(0.2초마다 확인 · 부드럽게)
      if (FP) { shW = 0; } else if ((shT -= dt) <= 0) { shT = 0.2; _f.set(0, 0, -1).applyQuaternion(cam.quaternion); const rxv = -_f.z, rzv = _f.x, l = Math.hypot(rxv, rzv) || 1, ux = rxv / l * 1.0, uz = rzv / l * 1.0, cp = cam.position;
        shW = st !== 'end' && ray(me.x, me.y + 1.3, me.z, me.x + ux, me.y + 1.3, me.z + uz) === null && ray(cp.x, cp.y, cp.z, cp.x + ux, cp.y, cp.z + uz) === null && !Q.indoor(me.x, me.y, me.z) ? SHOULDER : 0; }
      if (Math.abs(shV - shW) > 1e-3) { shV += Math.sign(shW - shV) * Math.min(Math.abs(shW - shV), dt * (shW < shV ? 4 : 1.5)); map.player.shoulder(shV); }
      // 물 채우기(빛기둥 안)
      const refilling = inWater > 0 && st !== 'end' && meAlive;
      if (refilling && tank < TANK) { tank = Math.min(TANK, tank + REFILL * dt); if ((gurT -= dt) <= 0) { gurT = 0.22; SND.gurgle(); } }
      // 젖음(혼자 연습 — 팀은 teamHit·teamTick이 wet을 다룬다)
      wetT += dt; if (wetT > 2 && wet > 0 && soakT <= 0) wet = Math.max(0, wet - (team ? 18 : 9) * dt);
      if (soakT > 0 && (soakT -= dt) <= 0) { map.player.speed(1); wet = 35; }
      if (slowT > 0 && (slowT -= dt) <= 0 && soakT <= 0) map.player.speed(1);
      if (team) teamTick(dt, me);
      if (NM.on) netSend(dt, me, firing);

      // 물방울
      let n = 0; frameN++;
      for (let i = 0; i < PMAX; i++) {
        const k = kind[i]; if (!k) continue;
        if ((life[i] -= dt) <= 0) { kind[i] = 0; continue; }
        if (k === 4) { px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt; }
        else { vy[i] -= G * dt; px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt; }
        if ((k === 1 || k === 2) && (((i + frameN) & 1) === 0 || life[i] <= dt * 2)) {
          const ax = qx[i], ay = qy[i], az = qz[i]; qx[i] = px[i]; qy[i] = py[i]; qz[i] = pz[i];
          if (team) { if (teamHit(i, ax, ay, az)) { kind[i] = 0; continue; } }
          else if (k === 1) { if (hitTargets(i, ax, ay, az)) { kind[i] = 0; continue; } }
          else if (segHit(ax, ay, az, px[i], py[i], pz[i], me.x, me.y + 0.7, me.z, 0.5)) {   // 로봇 물이 나에게 — 젖음만
            kind[i] = 0; burst(px[i], py[i], pz[i], 3, BOT_WATER_C, 1.4, 1.2, 0.045);
            if (st === 'play' && soakT <= 0) { wet = Math.min(100, wet + 8); wetT = 0; cnt.wet++; SND.wet();
              if (wet >= 100) { soakT = 2; map.player.speed(0.55); map.hud.banner('💦 흠뻑!', 1.1); } else { slowT = 0.7; map.player.speed(0.78); } }
            continue; }
          const t = ray(ax, ay, az, px[i], py[i], pz[i]);
          if (t !== null) { surfHit(i, ax, ay, az, t); continue; }
          const fy = Q.floorY(px[i], pz[i]);
          if (py[i] <= fy && ay >= fy - 0.3) { impact(i, px[i], fy, pz[i], 0, 1, 0); continue; }
          if (py[i] < fy - 3) { kind[i] = 0; continue; }
        }
        // 그리기(살아 있는 것만 앞으로 모아서)
        const a = life[i] / life0[i];
        if (k <= 2) { _n.set(vx[i], vy[i], vz[i]).normalize(); _q.setFromUnitVectors(_Z, _n); const s = psz[i] * (k === 1 ? Math.min(1, 0.25 + (life0[i] - life[i]) * 6) : 1); _s.set(s, s, s * 2.6); }   // WG-FPS: 막 나온 물방울은 작게(눈앞에서 물줄기가 덩어리로 보이던 것)
        else if (k === 3) { _q.identity(); const s = psz[i] * (0.4 + 0.6 * a); _s.set(s, s, s); }
        else { _q.identity(); const s = psz[i] * (1.6 - a); _s.set(s, s, s); }
        M.drop.setMatrixAt(n, _m4.compose(_v.set(px[i], py[i], pz[i]), _q, _s));
        M.drop.instanceColor.setXYZ(n, pr[i], pg[i], pb[i]); n++;
      }
      pAlive = n; M.drop.count = n; M.drop.visible = n > 0;
      if (n) { M.drop.instanceMatrix.needsUpdate = true; M.drop.instanceColor.needsUpdate = true; }
      // 젖은 자국 마르기
      let ma = 0, cdirty = false;
      for (let i = 0; i < MMAX; i++) { if (mlife[i] <= 0) continue;
        mlife[i] -= dt; if (mlife[i] <= 0) { M.mark.setMatrixAt(i, ZERO); M.mark.instanceMatrix.needsUpdate = true; continue; }
        ma++; const f = Math.min(1, mlife[i] / 3); _c.copy(WHITE).lerp(WETc, f); M.mark.setColorAt(i, _c); cdirty = true; }
      mAlive = ma; M.mark.visible = ma > 0; if (cdirty) M.mark.instanceColor.needsUpdate = true;

      if (!team) {
        // 과녁 움직임(몇 개뿐 — 행렬만)
        for (const b of B) { const s = b.spot;
          if (!b.alive) { if (st === 'play' && (b.re -= dt) <= 0) { takeSpot(b, me); moveStand(b); b.hp = HP_BAL; b.alive = true; } else continue; }
          b.ph += dt; if (b.wob > 0) b.wob = Math.max(0, b.wob - dt * 3);
          const sw = Math.sin(b.ph * 1.7) * 0.05 + Math.sin(b.ph * 22) * 0.08 * b.wob;
          M.bal.setMatrixAt(b.i, _m4.compose(_v.set(b.spot.x + sw * 0.3, s.y + 1.34, b.spot.z), _q.setFromEuler(_e.set(sw, 0, sw * 0.6)), _s.set(1 + 0.1 * b.wob, 1 - 0.06 * b.wob, 1 + 0.1 * b.wob))); }
        M.bal.instanceMatrix.needsUpdate = true;
        for (const f of F) {
          if (!f.lit) { if (st === 'play' && (f.re -= dt) <= 0) { takeSpot(f, me); movePit(f); f.hp = HP_FIRE; f.lit = true; mmMarks(); } else continue; }
          f.ph += dt; const k = 0.45 + 0.55 * f.hp / HP_FIRE, fl = 1 + Math.sin(f.ph * 13) * 0.08 + Math.sin(f.ph * 7.3) * 0.06;
          M.flame.setMatrixAt(f.i, _m4.compose(_v.set(f.spot.x, f.spot.y + 0.02, f.spot.z), _q.setFromEuler(_e.set(0, f.ph * 0.7, Math.sin(f.ph * 5) * 0.05)), _s.set(k, k * fl, k))); }
        M.flame.instanceMatrix.needsUpdate = true;
        for (const fl of FL) { const s = fl.spot;
          if (fl.done) { fl.bloom = Math.min(1, fl.bloom + dt * 2.5); if (st === 'play' && (fl.wilt -= dt) <= 0) { fl.done = false; fl.water = 0; fl.bloom = 0; takeSpot(fl, me); movePot(fl); } }
          const droop = (1 - fl.water) * 0.95, cy = Math.cos(fl.yaw), sy = Math.sin(fl.yaw);
          _q.setFromEuler(_e.set(droop, fl.yaw, 0));
          M.stem.setMatrixAt(fl.i, _m4.compose(_v.set(s.x, s.y + 0.36, s.z), _q, _s.set(1, 1, 1)));
          const L = 0.46, hy = Math.cos(droop) * L, hz = Math.sin(droop) * L, hs = fl.done ? 0.9 + 0.35 * Math.sin(Math.min(1, fl.bloom) * Math.PI) * (1 - fl.bloom) + 0.1 * fl.bloom : 0.3 + 0.3 * fl.water;
          _q.setFromEuler(_e.set(droop - 0.35, fl.yaw, 0));
          M.head.setMatrixAt(fl.i, _m4.compose(_v.set(s.x + sy * hz, s.y + 0.36 + hy, s.z + cy * hz), _q, _s.set(hs, hs, hs))); }
        M.stem.instanceMatrix.needsUpdate = M.head.instanceMatrix.needsUpdate = true;
        planned = false;
        for (const r of R) { botTick(r, dt, me);
          const bob = Math.abs(Math.sin(r.bob * 6)) * 0.04 * (r.pts ? 1 : 0.3), wig = r.wind > 0 ? Math.sin(r.bob * 40) * 0.08 : 0, sq = r.hit > 0 ? 0.08 : 0;
          M.bot.setMatrixAt(r.i, _m4.compose(_v.set(r.x, r.y + 0.01 + bob, r.z), _q.setFromEuler(_e.set(r.dizzy > 0 ? Math.sin(r.bob * 14) * 0.12 : 0, r.yaw + wig, wig * 0.5)), _s.set(1 + sq, 1 - sq, 1 + sq))); }
        M.bot.instanceMatrix.needsUpdate = true;
      }

      // HUD(바뀐 때만 DOM)
      const tp = Math.round(tank), wp = Math.round(wet);
      if (tp !== hudTank) { hudTank = tp; elTB.style.width = tp + '%'; elTB.style.background = tp < 20 ? '#ff9a4a' : '#4fb3ff'; }
      if (wp !== hudWet) { hudWet = wp; elWB.style.width = wp + '%'; }
      const xOn = st === 'play' && aim.on && firing ? 1 : 0; if (xOn !== hudX) { hudX = xOn; elX.style.borderColor = xOn ? '#ffd23c' : 'rgba(255,255,255,.95)'; }
      const rf = refilling && tank < TANK ? 1 : 0; if (rf !== hudRef) { hudRef = rf; elTL.textContent = rf ? '💧 채움…' : '💧 물'; }
      for (const p of POPS) { if (p.t <= 0) continue; p.t -= dt; p.y += dt * 0.8;
        if (p.t <= 0) { p.el.style.display = 'none'; continue; }
        _v.set(p.x, p.y, p.z).project(cam); if (_v.z > 1) { p.el.style.display = 'none'; continue; } p.el.style.display = '';
        p.el.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * innerWidth - 18).toFixed(0) + 'px,' + ((-_v.y * 0.5 + 0.5) * innerHeight - 12).toFixed(0) + 'px)'; p.el.style.opacity = Math.min(1, p.t * 2.5).toFixed(2); }
    },
    stop() {
      dead = true;
      removeEventListener('keydown', onKD); removeEventListener('keyup', onKU); removeEventListener('mousedown', onMD); removeEventListener('mouseup', onMU); removeEventListener('blur', onBlur);
      if (NM.on) netLeave(); for (const t of TAGS) if (t) { t.material.map.dispose(); t.material.dispose(); }
      root.remove(); if (fireBtn) fireBtn.remove(); map.player.aim(null); map.player.shoulder(0);
      for (const k in M) M[k].dispose(); for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose();   // 메시·표식·트리거·충돌·소품은 범위 파사드(map.add·map.world)가 뗀다
    },
    // 시험·교사 시연용
    fire(on = true) { inp.test = !!on; },
    aim(x, y, z) { aimOverride = x == null ? null : [x, y, z]; },
    endNow() { if (st !== 'play') return; if (NM.on) { if (NM.host) nreq('/m/st', 'PUT', 'end').catch(() => {}); } else T = 0.001; },
    choose(m, ak) { params.mode = m; params.arena = ak; return menu(true); },
    get state() { return st; }, get mode() { return mode; }, get arena() { return arenaKey; }, get score() { return mode === 'team' ? teamScore.slice() : score; }, get tank() { return tank; }, get wet() { return wet; }, get best() { return best; }, get timeLeft() { return T; },
    get counts() { return { ...cnt }; }, get last() { return last; }, get particles() { return pAlive; }, get marks() { return mAlive; }, get round() { return round; }, get seed() { return seed; },
    get aimInfo() { return { ...aim }; },
    get water() { return WP.map(w => ({ x: w.x, y: w.y, z: w.z, label: w.label })); },
    get actors() { return ACT.map(a => ({ i: a.i, name: a.name, team: a.team, role: a.role, x: +a.x.toFixed(2), y: +a.y.toFixed(2), z: +a.z.toFixed(2), alive: a.alive, wet: Math.round(a.wet), tank: Math.round(a.tank), st: a.st, see: a.see, tgt: a.tgt, soaks: a.soaks, soaked: a.soaked })); },
    get props() { return props.length; }, get covers() { return COVERS.length; }, get bases() { return basePos.map(b => b && { ...b }); },
    get net() { return NM.on ? { room: NM.room, pid: NM.pid, host: NM.host, me: ME, seq: NM.seq, st: NM.st, rtt: NM.rtt, lag: NM.lag } : null; },
    netStart: () => netStart(), netTeam: () => netTeam(), get netP() { return NM.on ? JSON.stringify(NM.D.p) : null; },
    soakTest(who, by = 0) { if (mode === 'team' && ACT[who] && ACT[who].alive) emit({ type: 'soak', by, who }); },
    get targets() { return { bal: B.map(b => ({ x: b.spot && b.spot.x, y: b.spot && b.spot.y, z: b.spot && b.spot.z, alive: b.alive, hp: b.hp })), fire: F.map(f => ({ x: f.spot && f.spot.x, y: f.spot && f.spot.y, z: f.spot && f.spot.z, lit: f.lit, hp: f.hp })),
      flow: FL.map(f => ({ x: f.spot && f.spot.x, y: f.spot && f.spot.y, z: f.spot && f.spot.z, water: f.water, done: f.done })), bot: R.map(r => ({ x: r.x, y: r.y, z: r.z, dizzy: r.dizzy, hp: r.hp })) }; },
  };
}
