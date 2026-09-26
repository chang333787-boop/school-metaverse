// 물총 놀이(GAME-WG · 09-26) — 3인칭 물총 놀이 한 판(3분) · 혼자 · 점수 + 가장 높은 점수. 정본 문서 = docs/map_api.md §10
// 사용자 09-26 "tps 물총은 구현해도 될 듯 — 그 정도는 폭력적이진 않은 듯". 폭력 없음: 사람(NPC)은 과녁이 아니다(물이 그냥 지나감 — NPC는 충돌이 없다) ·
//   과녁 = 물풍선(받침대) · 장난감 모닥불(끄기) · 목마른 꽃 화분(피우기) · 동글동글 장난감 로봇(작은 물 꼭지만 — 무기 모양 없음, 맞으면 빙글빙글 어지러움).
//   로봇이 쏜 물에 맞으면 '젖음' 칸만 차고 잠깐 느려진다(피해·죽음·피 없음). 소리는 짧은 밝은 합성음(🔊 칩으로 끔).
// 규칙(_template.js): ① import 금지(three = map.three) ② 사람 NPC·인물 대사 금지 — 화면 글자는 UI 문구뿐 ③ 소품은 월드 면에서 띄움(젖은 자국 = 면 법선으로 3cm + polygonOffset)
//   ④ 새 조명 없음 ⑤ 드로우콜 = 물방울 1 · 젖은 자국 1 · 물총 1 · 로봇 1 · 풍선 2 · 모닥불 2 · 화분 3 · 물통 1 · 표식 풀 2 = 14(+15 이하) — 전부 InstancedMesh 풀, 매 프레임 새 객체 없음
// 조작: 마우스 왼쪽 누르고 있기(화면을 한 번 눌러 시점 잠금 뒤) 또는 F 누르고 있기 = 물 쏘기 · 화면 가운데 조준점으로 물줄기가 포물선을 그리며 날아간다
//   터치 화면((pointer: coarse) 또는 body.touch) = 오른쪽 아래 터치 버튼 줄 위 💧 버튼(누르고 있기) · 다른 입력 장치 = SD2.map.press('fire', true/false) → map.on('action')
// 물통: 쏘면 줄고(💧 칸), 파란 빛기둥(운동장 개수대 · 장난감 물통 둘) 안에 서 있으면 찬다.
export const meta = { id: 'watergun', title: '물총 놀이', api: 1 };

const ROUND = 180, SHOULDER = 0.55, TANK = 100, USE = 12, REFILL = 60, RATE = 50, SPEED = 15, G = 9.8, BOT_SPEED = 10;
const PMAX = 240, MMAX = 48, N_BAL = 6, N_FIRE = 3, N_FLOW = 4, N_BOT = 3;
const HP_BAL = 3, HP_FIRE = 34, HP_FLOW = 38, HP_BOT = 12;
const PTS = { bal: 10, fire: 30, flow: 20, bot: 25 };
const ZONES = ['field', 'bball-sand'];                      // 운동장(본 구역) + 농구 모래 구역 — 과녁·로봇 자리
const BOT_RECT = [-38, -10.6, 38.8, 40.2];                    // 로봇이 다니는 네모(운동장 + 농구 모래 · 둔덕 발치·울타리 안)
const ARENA = [-42, -17.5, 47.5, 42.3];                      // 놀이 경계(구령대·개수대 포함) — 밖으로 0.25초 넘게 나가면 되돌림
const WATER_C = 0x8fd8ff, BOT_WATER_C = 0x9ff0dc, STEAM_C = 0xeef2f5, WET_C = 0x93a3b3;
const BAL_C = [0xff7aa8, 0xffd23c, 0x6ec8ff, 0x8de08a, 0xffa04a, 0xc79bff], FLOW_C = [0xff6f91, 0xffc93c, 0xb57bff, 0xff8a5c], BOT_C = [0xbff5d8, 0xffd9bd, 0xdcd3ff];
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

export default async function start(map, params = {}) {
  const THREE = map.three, Q = map.q, cam = map.camera;
  let dead = false, st = 'prep', round = 0, T = 0, cd = 0, cdShown = -1, secShown = -1;
  let score = 0, tank = TANK, wet = 0, wetT = 9, slowT = 0, soakT = 0, emitAcc = 0, sprayT = 0, emptyT = 0, gurT = 0, inWater = 0, muted = false;
  let best = map.store.get('best', null), last = null, goalT = 0;
  const cnt = { bal: 0, fire: 0, flow: 0, bot: 0, wet: 0 };
  const ROUND_S = Math.max(10, Math.min(600, +params.time || ROUND));
  const seed = params.seed != null && params.seed !== '' ? (isNaN(+params.seed) ? params.seed : +params.seed) : Date.now();
  const rng = map.rng(seed);
  const inp = { key: false, mouse: false, pad: false, test: false };
  let aimOverride = null;

  map.player.freeze(true);
  map.hud.banner('물총 준비 중…', 30);
  map.sfx('warm');
  const nav = await map.nav();
  if (dead) return {};
  map.arena.set({ rect: ARENA });

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

  const M = {
    drop: inst(new THREE.IcosahedronGeometry(1, 0), (() => { const m = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x1d3142 }); MATS.push(m); return m; })(), PMAX),
    mark: inst(new THREE.CircleGeometry(1, 14), (() => { const m = new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.MultiplyBlending, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); MATS.push(m); return m; })(), MMAX),   // 곱하기 섞기 = 젖은 곳만 어둡게(흰색 = 그대로) → 마르면 흰색으로
    bal: inst(balGeo, lamV(0x202020), N_BAL), stand: inst(standGeo, lamV(), N_BAL),
    pit: inst(pitGeo, lamV(), N_FIRE), flame: inst(flameGeo, (() => { const m = new THREE.MeshBasicMaterial({ vertexColors: true }); MATS.push(m); return m; })(), N_FIRE),
    pot: inst(potGeo, lamV(), N_FLOW), stem: inst(stemGeo, lamV(), N_FLOW), head: inst(headGeo, lamV(0x202020), N_FLOW),
    bot: inst(botGeo, lamV(0x262626), N_BOT), barrel: inst(barrelGeo, lamV(), 2),
  };
  GEOS.push(M.drop.geometry, M.mark.geometry); [SPH, SPHS, CYL, CONE].forEach(g => g.dispose());
  M.mark.renderOrder = 1; M.mark.count = MMAX;
  const gun = new THREE.Mesh(gunGeo, lamV(0x202020)); gun.rotation.order = 'YXZ'; map.add(gun);

  // ---------- 물 채우는 곳: 운동장 개수대(수도꼭지 쪽 서는 자리) + 장난감 물통 둘(운동장 서쪽 · 구령대 앞 서쪽) ----------
  const WP = [];
  { const lm = map.poi('lm:sink'), w = lm && map.interact.list({ kind: 'wash' }).find(h => Math.hypot(h.x - lm.x, h.z - lm.z) < 3.5);
    if (w) WP.push({ x: w.x, y: w.y, z: w.z, label: '개수대', barrel: false }); else if (lm && lm.stand) WP.push({ x: lm.stand[0], y: lm.stand[1], z: lm.stand[2], label: '개수대', barrel: false }); }
  for (const [bx, bz] of [[-33.5, 3.5], [-4.5, -9.3]]) {
    const i = nav.snap(bx, Q.floorY(bx, bz), bz, 3); if (i < 0) continue; const p = nav.pos(i);
    const k = WP.filter(w => w.barrel).length; WP.push({ x: p[0], y: p[1], z: p[2], label: '물통', barrel: true, k });
    M.barrel.setMatrixAt(k, _m4.compose(_v.set(p[0], p[1] + 0.005, p[2]), _q.setFromEuler(_e.set(0, rng() * 6, 0)), _s.set(1, 1, 1)));
    map.collider.add({ x0: p[0] - 0.3, x1: p[0] + 0.3, y0: p[1], y1: p[1] + 0.85, z0: p[2] - 0.3, z1: p[2] + 0.3 });
  }
  M.barrel.instanceMatrix.needsUpdate = true;
  for (const w of WP) {
    const r = w.barrel ? 1.5 : 1.9;   // 물통은 충돌 상자 둘레에 서면 · 개수대는 꼭지 앞 보도
    map.mk.marker(w.x, w.y, w.z, { color: 0x3cc8ff, beam: true });
    map.trigger.add({ x: w.x, y: w.y, z: w.z, r }, { enter() { inWater++; }, exit() { inWater = Math.max(0, inWater - 1); } });
  }

  // ---------- 과녁 자리(운동장·농구 모래 — 길격자 무작위 칸 · 물 채우는 곳·출발 자리와 떨어지게) ----------
  const spawnP = map.resolve('spawn:field-center');
  const SPOTS = [];
  { const far = WP.map(w => ({ x: w.x, z: w.z, r: 5 })); far.push({ x: spawnP.x, z: spawnP.z, r: 6 });
    for (let k = 0; k < 600 && SPOTS.length < 34; k++) { const p = nav.random({ zones: ZONES, minClear: 4, farFrom: far, rng }); if (!p) continue;
      if (p[0] < BOT_RECT[0] || p[0] > BOT_RECT[2] || p[2] < BOT_RECT[1] || p[2] > BOT_RECT[3]) continue;
      SPOTS.push({ x: p[0], y: p[1], z: p[2], used: null }); far.push({ x: p[0], z: p[2], r: 4.5 }); } }
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
  };

  // ---------- HUD(DOM — 조준점 · 물/젖음 칸 · 점수 튀어나옴 · 터치 💧 버튼) ----------
  const root = document.createElement('div'); root.className = 'wg-hud';
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:19;font-family:sans-serif';
  root.innerHTML = '<div class="wg-x" style="position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border:2px solid rgba(255,255,255,.95);border-radius:50%;box-shadow:0 0 0 1px rgba(29,53,87,.55),inset 0 0 0 1px rgba(29,53,87,.4)">'
    + '<div style="position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(29,53,87,.6)"></div></div>'
    + '<div class="wg-g" style="position:absolute;left:50%;bottom:52px;transform:translateX(-50%);width:230px;padding:7px 12px;border-radius:10px;background:rgba(29,53,87,.8);color:#fff;font-size:13px;line-height:1">'
    + '<div style="display:flex;align-items:center;gap:8px"><span class="wg-tl" style="width:58px;white-space:nowrap">💧 물</span><div style="flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.22);overflow:hidden"><div class="wg-tb" style="height:100%;width:100%;background:#4fb3ff;border-radius:5px"></div></div></div>'
    + '<div style="display:flex;align-items:center;gap:8px;margin-top:6px"><span style="width:58px;white-space:nowrap">💦 젖음</span><div style="flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,.22);overflow:hidden"><div class="wg-wb" style="height:100%;width:0%;background:#9ff0dc;border-radius:5px"></div></div></div></div>';
  document.body.appendChild(root);
  const elX = root.querySelector('.wg-x'), elTB = root.querySelector('.wg-tb'), elWB = root.querySelector('.wg-wb'), elTL = root.querySelector('.wg-tl');
  const POPS = []; for (let k = 0; k < 6; k++) { const d = document.createElement('div'); d.style.cssText = 'position:absolute;left:0;top:0;font-weight:800;font-size:20px;color:#fff;text-shadow:0 2px 0 rgba(29,53,87,.7),0 0 4px rgba(29,53,87,.6);display:none;white-space:nowrap'; root.appendChild(d); POPS.push({ el: d, t: 0, x: 0, y: 0, z: 0 }); }
  let popK = 0;
  const pop = (x, y, z, text) => { const p = POPS[popK++ % POPS.length]; p.x = x; p.y = y; p.z = z; p.t = 0.9; p.el.textContent = text; p.el.style.display = ''; };
  let hudTank = -1, hudWet = -1, hudX = -1, hudRef = -1;
  // 터치 화면: 💧 버튼(누르고 있기) — 터치 버튼 줄(점프·행동·시점 = 오른쪽 아래 한 줄) 위 · 미니맵 왼쪽. 다른 입력은 SD2.map.press('fire', …)
  const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches || document.body.classList.contains('touch'); } catch (e) { return false; } })();
  let fireBtn = null;
  if (coarse) {
    fireBtn = document.createElement('div'); fireBtn.className = 'wg-fire'; fireBtn.textContent = '💧';
    fireBtn.style.cssText = 'position:fixed;right:calc(196px + env(safe-area-inset-right));bottom:calc(100px + env(safe-area-inset-bottom));width:76px;height:76px;border-radius:50%;z-index:22;display:flex;align-items:center;justify-content:center;'
      + 'font-size:34px;background:rgba(79,179,255,.85);border:3px solid rgba(255,255,255,.85);box-shadow:0 3px 0 rgba(0,0,0,.18);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer';
    const dn = e => { e.preventDefault(); e.stopPropagation(); inp.pad = true; fireBtn.style.transform = 'scale(.92)'; try { fireBtn.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ } };
    const up = e => { e.stopPropagation(); inp.pad = false; fireBtn.style.transform = ''; };
    fireBtn.addEventListener('pointerdown', dn); fireBtn.addEventListener('pointerup', up); fireBtn.addEventListener('pointercancel', up); fireBtn.addEventListener('lostpointercapture', up);
    document.body.appendChild(fireBtn);
  }
  const sndChip = () => map.hud.chip('wg-snd', muted ? '🔇 소리 끔' : '🔊 소리 켬', { onClick: () => { muted = !muted; sndChip(); } });
  const scoreChip = () => map.hud.chip('wg-score', '⭐ ' + score + '점');
  const timeChip = () => map.hud.chip('wg-time', '⏱ ' + fmt(T));

  // ---------- 입력: 마우스 왼쪽(시점 잠금 중) · F · 'fire' 신호 ----------
  const onKD = e => { if (e.code === 'KeyF' && !e.repeat) inp.key = true; };
  const onKU = e => { if (e.code === 'KeyF') inp.key = false; };
  const onMD = e => { if (e.button === 0 && document.pointerLockElement) inp.mouse = true; };
  const onMU = e => { if (e.button === 0) inp.mouse = false; };
  const onBlur = () => { inp.key = inp.mouse = inp.pad = false; };
  addEventListener('keydown', onKD); addEventListener('keyup', onKU); addEventListener('mousedown', onMD); addEventListener('mouseup', onMU); addEventListener('blur', onBlur);
  map.on('action', ev => { if (ev && ev.name === 'fire') inp.pad = !!ev.down; });

  // ---------- 물방울 풀(구조 배열 — 매 프레임 새 객체 없음) ----------
  // kind: 1 내 물줄기 · 2 로봇 물 · 3 튀는 물(충돌 없음) · 4 김(위로)
  const kind = new Uint8Array(PMAX), px = new Float32Array(PMAX), py = new Float32Array(PMAX), pz = new Float32Array(PMAX), vx = new Float32Array(PMAX), vy = new Float32Array(PMAX), vz = new Float32Array(PMAX);
  const qx = new Float32Array(PMAX), qy = new Float32Array(PMAX), qz = new Float32Array(PMAX);   // 마지막으로 충돌을 본 자리(충돌은 2프레임마다 — 그사이 선분 전체를 본다)
  let frameN = 0;
  const life = new Float32Array(PMAX), life0 = new Float32Array(PMAX), psz = new Float32Array(PMAX), pr = new Float32Array(PMAX), pg = new Float32Array(PMAX), pb = new Float32Array(PMAX);
  let pNext = 0, pAlive = 0;
  function spawn(k, x, y, z, ux, uy, uz, lt, size, hex) {
    for (let n = 0; n < PMAX; n++) { const i = (pNext + n) % PMAX; if (kind[i]) continue;
      kind[i] = k; px[i] = qx[i] = x; py[i] = qy[i] = y; pz[i] = qz[i] = z; vx[i] = ux; vy[i] = uy; vz[i] = uz; life[i] = life0[i] = lt; psz[i] = size; _c.set(hex); pr[i] = _c.r; pg[i] = _c.g; pb[i] = _c.b; pNext = (i + 1) % PMAX; return i; }
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
  function addMark(x, y, z, nx, ny, nz) {
    for (let i = 0; i < MMAX; i++) if (mlife[i] > 0 && (mx[i] - x) ** 2 + (my[i] - y) ** 2 + (mz[i] - z) ** 2 < 0.16 && mnx[i] * nx + mny[i] * ny + mnz[i] * nz > 0.9) {   // 가까운 자국은 넓히고 다시 젖음
      mlife[i] = 7; if (mrad[i] < 0.62) { mrad[i] += 0.03; markSet(i); } return; }
    if (markCool > 0) return; markCool = 0.05;
    let i = -1; for (let n = 0; n < MMAX; n++) { const j = (mNext + n) % MMAX; if (mlife[j] <= 0) { i = j; break; } } if (i < 0) i = mNext;
    mNext = (i + 1) % MMAX; mx[i] = x; my[i] = y; mz[i] = z; mnx[i] = nx; mny[i] = ny; mnz[i] = nz; mlife[i] = 7; mrad[i] = 0.2 + rng() * 0.12; markSet(i);
  }

  // ---------- 충돌: 선분 a→b가 과녁 공(가운데 c, 반지름 r)에 닿는가 ----------
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
    // 자국은 낮은 윗면(구령대·벤치·계단)에만 — 옆면·높은 윗면은 충돌 상자가 보이는 모양과 다를 수 있다(나무 잎판·그물·줄기 십자) → 튀는 물만
    impact(i, hx, hy, hz, nx, ny, nz, ny > 0.9 && hy - Q.floorY(hx, hz) < 1.2);
  }
  function impact(i, x, y, z, nx, ny, nz, mark = true) {
    burst(x + nx * 0.05, y + ny * 0.05, z + nz * 0.05, 2 + (rng() < 0.5 ? 1 : 0), kind[i] === 2 ? BOT_WATER_C : WATER_C, 1.6, 1.1, 0.045);
    if (mark) addMark(x, y, z, nx, ny, nz);
    kind[i] = 0;
  }

  // 과녁에 물이 닿음(내 물줄기만)
  let splashT = 0;
  const hitFx = (x, y, z) => { if (splashT <= 0) { SND.splash(); splashT = 0.12; } burst(x, y, z, 2, WATER_C, 1.8, 1.4, 0.05); };
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
  const aim = { x: 0, y: 0, z: 0, on: false, h: 0, vx: 0, vy: 0, vz: 0 };
  function computeAim(me, nx, ny, nz) {
    let tx, ty, tz; aim.on = false;
    if (aimOverride) { tx = aimOverride[0]; ty = aimOverride[1]; tz = aimOverride[2]; }
    else {
      // 카메라와 나 사이(뒤따라오는 로봇·카메라 옆 나무)는 겨눔에서 뺀다 — 광선은 내 몸 앞(t0)부터
      _f.set(0, 0, -1).applyQuaternion(cam.quaternion); const o = cam.position, FAR = 45;
      const t0 = Math.max(0, (me.x - o.x) * _f.x + (me.y + 1.0 - o.y) * _f.y + (me.z - o.z) * _f.z) + 0.3;
      let d = FAR; const t = ray(o.x + _f.x * t0, o.y + _f.y * t0, o.z + _f.z * t0, o.x + _f.x * FAR, o.y + _f.y * FAR, o.z + _f.z * FAR); if (t !== null) d = t0 + t * (FAR - t0);
      const fy = Q.floorY(me.x, me.z); if (_f.y < -1e-3) { const tg = (fy - o.y) / _f.y; if (tg > t0 && tg < d) d = tg; }
      const tgt = (cx, cy, cz, r) => { const lx = cx - o.x, ly = cy - o.y, lz = cz - o.z, tc = lx * _f.x + ly * _f.y + lz * _f.z; if (tc < t0 || tc > d) return; const d2 = lx * lx + ly * ly + lz * lz - tc * tc; if (d2 < r * r) { d = tc; aim.on = true; } };
      for (const b of B) if (b.alive) tgt(b.spot.x, b.spot.y + 1.3, b.spot.z, 0.42);
      for (const f of F) if (f.lit) tgt(f.spot.x, f.spot.y + 0.35, f.spot.z, 0.6);
      for (const fl of FL) if (!fl.done) tgt(fl.spot.x, fl.spot.y + 0.55, fl.spot.z, 0.5);
      for (const r of R) if (r.dizzy <= 0) tgt(r.x, r.y + 0.6, r.z, 0.55);
      tx = o.x + _f.x * d; ty = o.y + _f.y * d; tz = o.z + _f.z * d;
    }
    aim.x = tx; aim.y = ty; aim.z = tz;
    let dx = tx - nx, dz = tz - nz, dh = Math.hypot(dx, dz); const h = ty - ny;
    if (dh < 1.2) { _f.set(0, 0, -1).applyQuaternion(cam.quaternion); const l = Math.hypot(_f.x, _f.z) || 1; dx = _f.x / l; dz = _f.z / l; dh = 1; aim.vx = dx * SPEED * 0.95; aim.vz = dz * SPEED * 0.95; aim.vy = SPEED * 0.3; }
    else { const S2 = SPEED * SPEED, disc = S2 * S2 - G * (G * dh * dh + 2 * h * S2); let a = disc >= 0 ? Math.atan((S2 - Math.sqrt(disc)) / (G * dh)) : Math.PI / 4; a = Math.max(-1.1, Math.min(1.1, a));
      const c = Math.cos(a) * SPEED; aim.vx = dx / dh * c; aim.vz = dz / dh * c; aim.vy = Math.sin(a) * SPEED; }
    aim.h = Math.atan2(dx, -dz) * 180 / Math.PI;
  }

  // ---------- 로봇(길격자 경로 · 가끔 다가와 물 몇 방울) ----------
  const inRect = (x, z) => x >= BOT_RECT[0] && x <= BOT_RECT[2] && z >= BOT_RECT[1] && z <= BOT_RECT[3];
  function plan(r, me) {
    r.think = 4 + rng() * 3; r.pts = null;
    let dest = null;
    const dMe = Math.hypot(me.x - r.x, me.z - r.z);
    if (st === 'play' && dMe > 7 && rng() < 0.7) { const a = rng() * Math.PI * 2, d = 5 + rng() * 2.5, x = me.x + Math.cos(a) * d, z = me.z + Math.sin(a) * d;
      if (inRect(x, z)) { const i = nav.snap(x, Q.floorY(x, z), z, 1.5); if (i >= 0) { const zn = nav.zoneOf(i); if (zn && ZONES.includes(zn.id)) dest = nav.pos(i); } } }
    // 아니면 과녁 자리 풀 근처 아무 데나(nav.random은 전 칸을 훑어 수 ms — 판 중에는 쓰지 않는다)
    for (let k = 0; k < 6 && !dest; k++) { const sp = SPOTS[Math.floor(rng() * SPOTS.length)], x = sp.x + (rng() - 0.5) * 4, z = sp.z + (rng() - 0.5) * 4;
      if (!inRect(x, z)) continue; const i = nav.snap(x, sp.y, z, 1.2); if (i >= 0) { const zn = nav.zoneOf(i); if (zn && ZONES.includes(zn.id)) dest = nav.pos(i); } }
    if (!dest) { r.think = 1; return; }
    const res = nav.path([r.x, r.y, r.z], dest, { maxExp: 20000 });
    if (res.ok && res.pts.length > 1) { r.pts = res.pts; r.pi = 1; } else r.think = 1;
  }
  function botTick(r, dt, me) {
    r.bob += dt;
    if (r.hit > 0) r.hit -= dt;
    if (r.dizzy > 0) { r.dizzy -= dt; r.yaw += dt * 9; if (r.dizzy <= 0) { r.hp = HP_BOT; r.cd = 2 + rng() * 2; r.think = 0; } return; }
    const dx = me.x - r.x, dz = me.z - r.z, dMe = Math.hypot(dx, dz);
    if (r.wind > 0 || r.shots > 0) {
      const want = Math.atan2(dx, dz); let dy = want - r.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; r.yaw += dy * Math.min(1, dt * 10);
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
    if ((r.think -= dt) <= 0 || !r.pts || r.pi >= r.pts.length) { if (r.think <= 0 || !r.pts) plan(r, me); if (!r.pts) return; }
    const p = r.pts[r.pi], ex = p[0] - r.x, ez = p[2] - r.z, d = Math.hypot(ex, ez), sp = 1.7 * dt;
    if (d <= sp) { r.x = p[0]; r.z = p[2]; r.y = p[1]; r.pi++; if (r.pi >= r.pts.length) { r.pts = null; r.think = 0.6 + rng() * 1.2; } }
    else { r.x += ex / d * sp; r.z += ez / d * sp; r.y += (p[1] - r.y) * Math.min(1, dt * 6);
      const want = Math.atan2(ex, ez); let dy = want - r.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; r.yaw += dy * Math.min(1, dt * 6); }
  }

  // ---------- 한 판 ----------
  function goal(text, sec) { map.hud.goal(text); goalT = sec || 0; }
  function begin(r) {
    round = r; st = 'count'; cd = 3; cdShown = -1; T = ROUND_S; secShown = -1; score = 0; tank = TANK; wet = 0; wetT = 9; slowT = soakT = 0; inp.test = false;
    for (const k in cnt) cnt[k] = 0;
    for (let i = 0; i < PMAX; i++) kind[i] = 0; for (let i = 0; i < MMAX; i++) { mlife[i] = 0; M.mark.setMatrixAt(i, ZERO); } M.mark.instanceMatrix.needsUpdate = true;
    map.player.freeze(true); map.player.speed(1);
    map.player.teleport('spawn:field-center', { h: 90 });
    placeAll();
    scoreChip(); timeChip(); sndChip(); goal(null);
  }
  async function finish() {
    st = 'end'; inp.key = inp.mouse = inp.pad = inp.test = false; map.player.aim(null); map.player.speed(1); map.player.freeze(true); goal(null);
    const rec = best == null || score > best; if (rec) { best = score; map.store.set('best', score); }   // 기록은 판이 끝날 때만 쓴다(map.store — 2초 안에 localStorage · try/catch)
    last = { score, best, rec, round, ...cnt };
    sfx('done');
    const i = await map.hud.ask('💦 물총 놀이 끝!\n점수 ' + score + '점' + (rec ? '  🏆 새 기록!' : '\n가장 높은 점수 ' + best + '점')
      + '\n🎈 ' + cnt.bal + '  🔥 ' + cnt.fire + '  🌸 ' + cnt.flow + '  🤖 ' + cnt.bot, ['다시 하기', '그만하기']);
    if (dead) return;
    if (i === 0) begin(round + 1); else map.quit();
  }

  map.minimap.show();
  begin(0);
  let shT = 0, shW = 0, shV = 0;
  let gunYaw = 0, lastX = map.player.get().x, lastZ = map.player.get().z, aimHold = 0;

  return {
    tick(dt) {
      if (dead) return;
      const me = map.player.get();
      if (splashT > 0) splashT -= dt; if (markCool > 0) markCool -= dt;
      // 3·2·1
      if (st === 'count') { cd -= dt; const n = Math.ceil(cd);
        if (n !== cdShown) { cdShown = n; if (n > 0) { map.hud.banner(String(n), 1.2); sfx('tick'); } }
        if (cd <= 0) { st = 'play'; map.player.freeze(false); map.hud.banner('물총 발사!', 1.0); sfx('go'); goal(coarse ? '💧 과녁에 물을 쏴요! 💧 버튼 누르고 있기' : '💧 과녁에 물을 쏴요! 클릭·F 누르고 있기', 6);
          map.hud.toast(coarse ? '🎈풍선 🔥불 🌸꽃 🤖로봇 — 화면을 밀어 위를 보면 멀리 쏴요' : '🎈풍선 🔥불 🌸꽃 🤖로봇 — 마우스를 위로 올리면 멀리 쏴요', 5); } }
      if (st === 'play') {
        T -= dt; const s = Math.ceil(T); if (s !== secShown) { secShown = s; timeChip(); if (s <= 10 && s > 0) sfx('tick'); }
        if (T <= 0) { T = 0; timeChip(); finish(); }
      }
      if (goalT > 0 && (goalT -= dt) <= 0) goal(null);
      // 몸 방향(물총 자리): 쏘는 동안 겨눈 쪽 · 아니면 걷는 방향(움직임으로 추정 — main.js P.yaw와 같은 식)
      const mdx = me.x - lastX, mdz = me.z - lastZ; lastX = me.x; lastZ = me.z;
      const firing = st === 'play' && (inp.key || inp.mouse || inp.pad || inp.test);
      const gx0 = Math.sin(gunYaw), gz0 = Math.cos(gunYaw);
      const nozX = me.x + gx0 * 0.46 - gz0 * 0.1, nozY = me.y + 0.62, nozZ = me.z + gz0 * 0.46 + gx0 * 0.1;
      if (firing) {
        computeAim(me, nozX, nozY, nozZ); aimHold = 0.6;
        if (tank > 0) {
          tank = Math.max(0, tank - USE * dt); emitAcc += RATE * dt;
          while (emitAcc >= 1) { emitAcc -= 1; const j = 0.35; spawn(1, nozX, nozY, nozZ, aim.vx + (rng() - 0.5) * j, aim.vy + (rng() - 0.5) * j, aim.vz + (rng() - 0.5) * j, 2.4, 0.075, WATER_C); }
          if ((sprayT -= dt) <= 0) { sprayT = 0.13; SND.spray(); }
          if (tank <= 0) { SND.empty(); goal('💧 물이 없어요! 파란 빛기둥에서 채워요', 4); }
        } else if ((emptyT -= dt) <= 0) { emptyT = 0.7; SND.empty(); if (goalT <= 0) goal('💧 물이 없어요! 파란 빛기둥에서 채워요', 3); }
      } else emitAcc = 0;
      if (aimHold > 0) { aimHold -= dt; map.player.aim(aim.h); gunYaw = Math.atan2(Math.sin(aim.h * Math.PI / 180), -Math.cos(aim.h * Math.PI / 180)); if (aimHold <= 0) map.player.aim(null); }
      else if (mdx * mdx + mdz * mdz > 1e-5) gunYaw = Math.atan2(mdx, mdz);
      gun.position.set(me.x + Math.sin(gunYaw) * 0.26 - Math.cos(gunYaw) * 0.1, me.y + 0.6, me.z + Math.cos(gunYaw) * 0.26 + Math.sin(gunYaw) * 0.1);
      gun.rotation.set(firing ? -Math.atan2(aim.vy, Math.hypot(aim.vx, aim.vz)) : 0.15, gunYaw, 0);
      // 어깨 너머 시점: 머리·카메라 오른쪽 0.9m가 트였을 때만 0.55m 비켜 섬(0.2초마다 확인 · 부드럽게)
      if ((shT -= dt) <= 0) { shT = 0.2; _f.set(0, 0, -1).applyQuaternion(cam.quaternion); const rxv = -_f.z, rzv = _f.x, l = Math.hypot(rxv, rzv) || 1, ux = rxv / l * 1.0, uz = rzv / l * 1.0, cp = cam.position;
        shW = st !== 'end' && ray(me.x, me.y + 1.3, me.z, me.x + ux, me.y + 1.3, me.z + uz) === null && ray(cp.x, cp.y, cp.z, cp.x + ux, cp.y, cp.z + uz) === null && !Q.indoor(me.x, me.y, me.z) ? SHOULDER : 0; }
      if (Math.abs(shV - shW) > 1e-3) { shV += Math.sign(shW - shV) * Math.min(Math.abs(shW - shV), dt * (shW < shV ? 4 : 1.5)); map.player.shoulder(shV); }
      // 물 채우기(빛기둥 안)
      const refilling = inWater > 0 && st !== 'end';
      if (refilling && tank < TANK) { tank = Math.min(TANK, tank + REFILL * dt); if ((gurT -= dt) <= 0) { gurT = 0.22; SND.gurgle(); } }
      // 젖음
      wetT += dt; if (wetT > 2 && wet > 0 && soakT <= 0) wet = Math.max(0, wet - 9 * dt);
      if (soakT > 0 && (soakT -= dt) <= 0) { map.player.speed(1); wet = 35; }
      if (slowT > 0 && (slowT -= dt) <= 0 && soakT <= 0) map.player.speed(1);

      // 물방울
      let n = 0; frameN++;
      for (let i = 0; i < PMAX; i++) {
        const k = kind[i]; if (!k) continue;
        if ((life[i] -= dt) <= 0) { kind[i] = 0; continue; }
        if (k === 4) { px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt; }
        else { vy[i] -= G * dt; px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt; }
        if ((k === 1 || k === 2) && (((i + frameN) & 1) === 0 || life[i] <= dt * 2)) {
          const ax = qx[i], ay = qy[i], az = qz[i]; qx[i] = px[i]; qy[i] = py[i]; qz[i] = pz[i];
          if (k === 1) { if (hitTargets(i, ax, ay, az)) { kind[i] = 0; continue; } }
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
        if (k <= 2) { _n.set(vx[i], vy[i], vz[i]).normalize(); _q.setFromUnitVectors(_Z, _n); const s = psz[i]; _s.set(s, s, s * 2.6); }
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
      for (const r of R) { botTick(r, dt, me);
        const bob = Math.abs(Math.sin(r.bob * 6)) * 0.04 * (r.pts ? 1 : 0.3), wig = r.wind > 0 ? Math.sin(r.bob * 40) * 0.08 : 0, sq = r.hit > 0 ? 0.08 : 0;
        M.bot.setMatrixAt(r.i, _m4.compose(_v.set(r.x, r.y + 0.01 + bob, r.z), _q.setFromEuler(_e.set(r.dizzy > 0 ? Math.sin(r.bob * 14) * 0.12 : 0, r.yaw + wig, wig * 0.5)), _s.set(1 + sq, 1 - sq, 1 + sq))); }
      M.bot.instanceMatrix.needsUpdate = true;

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
      root.remove(); if (fireBtn) fireBtn.remove(); map.player.aim(null); map.player.shoulder(0);
      for (const k in M) M[k].dispose(); for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose();   // 메시는 범위 파사드(map.add)가 장면에서 뗀다
    },
    // 시험·교사 시연용
    fire(on = true) { inp.test = !!on; },
    aim(x, y, z) { aimOverride = x == null ? null : [x, y, z]; },
    endNow() { if (st === 'play') T = 0.001; },
    get state() { return st; }, get score() { return score; }, get tank() { return tank; }, get wet() { return wet; }, get best() { return best; }, get timeLeft() { return T; },
    get counts() { return { ...cnt }; }, get last() { return last; }, get particles() { return pAlive; }, get marks() { return mAlive; }, get round() { return round; }, get seed() { return seed; },
    get aimInfo() { return { ...aim }; },
    get water() { return WP.map(w => ({ x: w.x, y: w.y, z: w.z, label: w.label })); },
    get targets() { return { bal: B.map(b => ({ x: b.spot.x, y: b.spot.y, z: b.spot.z, alive: b.alive, hp: b.hp })), fire: F.map(f => ({ x: f.spot.x, y: f.spot.y, z: f.spot.z, lit: f.lit, hp: f.hp })),
      flow: FL.map(f => ({ x: f.spot.x, y: f.spot.y, z: f.spot.z, water: f.water, done: f.done })), bot: R.map(r => ({ x: r.x, y: r.y, z: r.z, dizzy: r.dizzy, hp: r.hp })) }; },
  };
}
