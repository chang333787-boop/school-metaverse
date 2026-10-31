// 비행 엔진(design §3-3 아케이드식) — 값은 속도 하나 + 회전율 · 꼬리 자리는 회전율·브레이크 계수만 바꿈 · 실속 = 느리면 천천히 내려감
// 계약 = docs/dragon/stage3_plan.md §5 · 충돌은 메시 레이 없이 world.ground(x,z) + 원기둥(pillars) + 아치(arches) 목록만(32m 격자) · 매 걸음 new X
// 조작(보통): ↑↓ = 오르기·내리기 · ←→ = 돌기 · Space = 날갯짓(날개가 다 올라간 박자에 누르면 힘 다 실림 · 연타 = 절반) · 1~4 꼬리 자리
// 조작(쉬움): 앞으로 저절로 · 방향키 · Space 누르고 있기 = 꼬리 펴기(날카롭게 돎) · 떨어지면 저절로 다시 붙음
// 바깥 갈고리: world.updrafts(함수 또는 배열 [{x, z, r, top?, lift?, power?, y?}]) 위 = 날갯짓 없이 솟음(S.updraft) · F.push(ax, ay, az) = 이 걸음 움직임에만 더함(m/s · 걸음마다 다시 부름)
// 좌표: 앞 = (sin yaw, cos yaw) · 오른쪽 = (−cos yaw, sin yaw)(걷기와 같음) · roll > 0 = 오른쪽 날개가 내려감 · pitch > 0 = 고개 듦
import * as THREE from 'three';
import { getSfx } from '../core/sfx.js?v=18';

/* 손맛 값 — 한곳에서만 고친다(봇 기록으로 맞춤) */
export const FK = {
  vstall: 10, vcruise: 23, vmax: 33, boostMax: 9,
  drag: 0.1,              // 보통: 날갯짓 없을 때 속도가 줄어드는 정도(1/초) — 33 → 실속 10까지 약 12초
  flapDv: 2.7,            // 날갯짓 한 번(힘 다 실림)에 붙는 속도(m/s)
  flapLift: 2.6,          // 날갯짓 한 번에 위로 뜨는 힘(m/s · 곧 사라짐)
  sink: 1.1,              // 활공하면 천천히 내려감(m/s)
  turn: 1.05,             // 기본 회전율(rad/s) — 쉬움 꼬리 펴기 ×1.8
  pitchUp: 0.42, pitchDown: 0.52,
  body: 1.7,              // 몸이 돌에 닿는 반지름(m)
  graze: 1.6,             // 몸 둘레 + 이만큼 안 = 스침(날개 끝이 1m 안)
  hitBig: { easy: 99, normal: 20, hard: 16 },   // 돌 쪽으로 이 속도 넘게 박으면 히컵이 떨어짐(25m/s로 53° 넘게 · 쉬움은 도움이 먼저 피함)
};
/* 꼬리 자리: [왼쪽으로 돌 때 배수, 오른쪽으로 돌 때 배수, 끌림(브레이크) 배수] — 1 곧게 · 2 왼 · 3 오른 · 4 급강하·브레이크 */
const TAIL = [null, [1, 1, 1], [1.75, 0.6, 1.12], [0.6, 1.75, 1.12], [1.5, 1.5, 3.4]];
/* 도움(스마트 핸들) — 떨어지지 않게만: 물 위 바닥 · 돌 피하기 · 실속 길이 · 다시 붙기 저절로 */
const ASSIST = {
  easy:   { floor: 7, avoid: 0.9, look: 0.75, stallFall: 1e9, autoGrab: true, gateR: 1.55, gust: 0.5 },
  normal: { floor: 3, avoid: 0.45, look: 0.5, stallFall: 3.2, autoGrab: false, gateR: 1.0, gust: 1 },
  hard:   { floor: 0, avoid: 0, look: 0, stallFall: 2.0, autoGrab: false, gateR: 0.85, gust: 1.3 },
};
const CELL = 32;
const TOP_T = 0.62, TOP_END = 0.98;
const WING = 0.72;                    // 날갯짓 폭(rig flapRate) — 1이면 날개 끝이 몸 아래로 너무 내려감   // 날갯짓 뒤 0.62~0.98초 = 날개가 다 올라가 있는 때(힘 다 실림)

const _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _pp = { x: 0, y: 0, z: 0 };
const SADDLE = new THREE.Vector3(0, 1.16, -0.05);       // 투슬리스 등(모델 좌표) — 히컵 뿌리 자리(웅크린 엉덩이 ≈ 등 위)
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function createFlight({ world, mode = 'normal', dragon = null, rider = null, rng = null }) {
  const W = world || {};
  const pillars = W.pillars || [], arches = W.arches || [];
  /* 돌기둥 32m 격자 — 걸음마다 둘레 3×3칸만 봄 */
  const grid = new Map(), gk = (i, j) => (i + 4096) * 8192 + (j + 4096);
  pillars.forEach((p, k) => {
    for (let i = Math.floor((p.x - p.r - 6) / CELL); i <= Math.floor((p.x + p.r + 6) / CELL); i++)
      for (let j = Math.floor((p.z - p.r - 6) / CELL); j <= Math.floor((p.z + p.r + 6) / CELL); j++) { const h = gk(i, j); let a = grid.get(h); if (!a) grid.set(h, a = []); a.push(k); }
  });
  const pillarHit = new Float32Array(pillars.length);      // 기둥마다 마지막 스친 때(같은 기둥 연달아 X)
  const archHit = new Float32Array(arches.length);
  /* 아치 미리 계산: 두 다리 사이 방향(u) · 옆(v) */
  const AR = arches.map((a) => ({ x: a.x, z: a.z, ux: Math.cos(a.yaw || 0), uz: -Math.sin(a.yaw || 0), half: a.half, y0: a.y0, y1: a.y1, th: a.th || 6 }));

  const O = { autoForward: mode === 'easy', assist: mode !== 'hard', ceil: W.ceil ?? 400, noFlap: false, tailAuto: false, liftOnly: false, liftSec: 3.4, gusts: true };
  let A = ASSIST[mode] || ASSIST.normal;
  const easy = mode === 'easy';

  const S = {
    x: 0, y: 30, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, roll: 0, speed: FK.vcruise, tail: 1, flapPh: 1, stall: false, fallen: false, gates: 0, grazes: 0,
    t: 0, done: false, doneT: 0, boost: 0, lift: 0, stallT: 0, splashes: 0, crashes: 0, bumps: 0, falls: 0, regrabs: 0, perfect: 0, early: 0, matched: 0, tailHits: 0,
    spread: false, grab: false, riderDist: 0, grabT: 0, lockT: 0, tuck: 0, liftT: 0, gustX: 0, gustZ: 0, misses: 0, safeT: 0, fallT: 0, updraft: false,
  };
  const P = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 };   // 앞 걸음(그리기 보간)
  const RD = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, px: 0, py: 0, pz: 0, spin: 0 };   // 떨어진 히컵
  const pose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, speed: 0, rx: 0, ry: 0, rz: 0 };   // 그린 자리(카메라가 읽음)
  let pushX = 0, pushY = 0, pushZ = 0;
  let gates = [], turnS = 0, pitchS = 0, turnHeld = 0, tailCool = 0, fp = 1, splashCool = 0, gustT = 4, gustDur = 0, gustA = 0, gustK = 0, autoFlap = 0;

  /* 사건 — 드문 일이라 받는 쪽 함수만 부름(값 그릇은 하나씩 다시 씀) */
  const L = {};
  const EV = { gate: { i: 0, matched: false, tail: 1 }, graze: { i: 0, d: 0 }, splash: { speed: 0 }, crash: { speed: 0 }, fall: { why: '' }, regrab: { auto: false }, flap: { power: 0, kind: '' }, miss: { i: 0, d: 0 }, tail: { k: 1, match: false }, done: { t: 0 }, bump: { speed: 0 } };
  const emit = (n) => { const a = L[n]; if (a) for (let i = 0; i < a.length; i++) a[i](EV[n]); };
  const F = { state: S, pose, mode, world: W, rider: RD };
  F.on = (ev, fn) => { (L[ev] = L[ev] || []).push(fn); return F; };
  const SX = getSfx();                                      /* 소리(켜졌을 때만 · 보이는 짝 = 날개 · 물보라 · 흔들림) — 날갯짓 박자 · 물보라 · 부딪힘 */
  if (SX) { F.on('flap', (e) => SX.play('flap', null, 0.55 + 0.45 * e.power)); F.on('splash', () => SX.play('splash')); F.on('bump', () => SX.play('thud', null, 0.5)); F.on('crash', () => SX.play('thud')); }
  F.off = (ev, fn) => { const a = L[ev]; if (a) { const k = a.indexOf(fn); if (k >= 0) a.splice(k, 1); } };
  F.setOpts = (o) => { Object.assign(O, o); if (o.assist === false) A = ASSIST.hard; else if (o.assist === true) A = ASSIST[mode] || ASSIST.normal; if (o.liftOnly) { S.liftT = 0; S.speed = 0; } return F; };
  F.opts = O;

  /* 관문 — 지나는 면의 방향(앞뒤 관문을 잇는 방향)을 미리 셈 */
  F.setGates = (list) => {
    gates = (list || []).map((g, i, a) => {
      const p = i > 0 ? a[i - 1] : { x: S.x, z: S.z }, n = a[i + 1] || { x: g.x * 2 - p.x, z: g.z * 2 - p.z };
      let nx = n.x - p.x, nz = n.z - p.z; if (g.yaw != null) { nx = Math.sin(g.yaw); nz = Math.cos(g.yaw); }
      const d = Math.hypot(nx, nz) || 1;
      return { x: g.x, y: g.y, z: g.z, r: g.r, tail: g.tail || 1, nx: nx / d, nz: nz / d };
    });
    S.gates = 0; S.done = false; return F;
  };
  F.gates = () => gates;
  F.gateR = (g) => g.r * A.gateR;

  /* 자리 놓기 — 시작·장면 옮김 */
  F.place = (x, y, z, yaw = 0, speed = FK.vcruise) => {
    S.x = P.x = x; S.y = P.y = y; S.z = P.z = z; S.yaw = P.yaw = yaw; S.pitch = P.pitch = 0; S.roll = P.roll = 0;
    S.speed = speed; S.boost = 0; S.lift = 0; S.vx = Math.sin(yaw) * speed; S.vz = Math.cos(yaw) * speed; S.vy = 0;
    S.fallen = false; S.grab = false; S.stallT = 0; fp = TOP_T; turnS = pitchS = 0; return F;   // 날개가 올라간 채 시작(첫 Space = 힘 다 실림)
  };

  function setTail(k) {
    if (k === S.tail) return;
    S.tail = k;
    /* 꼬리를 직접 맞춤 = 지금 도는 쪽과 같은 꼬리 → 더 날카롭게 돌고 잠깐 빨라짐(도움을 켜도 남음) */
    const match = turnHeld > 0.2 && ((k === 2 && turnS > 0.4) || (k === 3 && turnS < -0.4));
    EV.tail.k = k; EV.tail.match = match;
    if (match && tailCool <= 0) { S.boost = Math.min(FK.boostMax, S.boost + 4); tailCool = 1.2; S.tailHits++; }
    emit('tail');
  }
  function boost(v) { S.boost = Math.min(FK.boostMax, S.boost + v); }

  function waterAt(x, z) {
    if (W.lake) { const l = W.lake, d = Math.hypot(x - l.x, z - l.z); return d < l.r ? l.y : -1e9; }
    return W.water ?? -1e9;
  }
  function boundK(x, z) {                                   // 1 = 경계 · 밖으로 갈수록 큼
    const b = W.bounds; if (!b) return 0;
    return b.rx ? Math.hypot((x - b.x) / b.rx, (z - b.z) / b.rz) : Math.hypot(x - b.x, z - b.z) / b.r;
  }

  /* 떨어짐 → 투슬리스가 따라 내려옴 → 가까워진 박자에 Space(쉬움 = 저절로) */
  function fall(why) {
    if (S.fallen) return;
    S.fallen = true; S.falls++; S.grab = false; S.grabT = 0; S.lockT = 0; S.fallT = 0;
    /* 히컵은 위로 뜨고(안장에서 빠짐) 투슬리스는 꼬리를 못 잡아 아래로 휘청 — 위아래로 벌어졌다가 밑에서 올라와 다시 만남(가던 쪽 그대로) */
    RD.x = S.x; RD.y = S.y + 1.2; RD.z = S.z; RD.vx = S.vx * 0.92; RD.vy = Math.max(S.vy, 0) * 0.5 + 4.5; RD.vz = S.vz * 0.92; RD.spin = 0;
    RD.px = RD.x; RD.py = RD.y; RD.pz = RD.z;
    S.speed = Math.max(S.speed * 0.7, 12); S.boost = 0; S.lift = 0;
    EV.fall.why = why; emit('fall');
  }
  function regrab(auto) {
    S.fallen = false; S.grab = false; S.regrabs++; S.stallT = 0; S.safeT = 1.2;   // 붙은 뒤 1.2초는 부딪혀도 안 떨어짐(튕기기만)
    S.x = RD.x; S.y = RD.y - 1.2; S.z = RD.z;
    _pp.x = S.x; _pp.y = S.y; _pp.z = S.z; F.pushOut(_pp, FK.body + 1); S.x = _pp.x; S.z = _pp.z;
    S.yaw = Math.atan2(S.vx, S.vz); S.pitch = clamp(Math.atan2(S.vy, Math.hypot(S.vx, S.vz)), -0.5, 0.2);
    S.speed = Math.max(S.speed, FK.vcruise * 0.85); fp = TOP_T;   // 붙자마자 날개가 올라가 있음 = 바로 한 번 칠 수 있음
    EV.regrab.auto = auto; emit('regrab');
  }

  /* 바깥 힘 — 이 걸음 움직임에만 더함(돌풍 칸과 같은 자리 · 여러 번 부르면 쌓임 · 걸음이 끝나면 0) */
  F.push = (ax, ay, az) => { pushX += ax || 0; pushY += ay || 0; pushZ += az || 0; return F; };
  /* 상승 기류(불 × 공기) — 걸음 끝 자리가 기둥 안이면 뜨는 힘을 채움(다음 걸음 가라앉음 0 · 날갯짓 없이 솟음) */
  function stepUps() {
    S.updraft = false;
    const U = typeof W.updrafts === 'function' ? W.updrafts() : W.updrafts; if (!U || !U.length) return;
    for (let i = 0; i < U.length; i++) {
      const u = U[i], top = u.top != null ? u.top : u.y != null ? u.y + 40 : 1e9;
      if (S.y >= top) continue;
      const dx = S.x - u.x, dz = S.z - u.z; if (dx * dx + dz * dz >= u.r * u.r) continue;
      const k = u.lift != null ? u.lift : 7.5 * (u.power != null ? Math.min(1, u.power) : 1);
      if (k > S.lift) S.lift = k; S.updraft = true;
    }
  }

  /* 한 걸음(1/60초) */
  F.step = (dt, I) => { stepCore(dt, I); stepUps(); pushX = pushY = pushZ = 0; if (SX && SX.on) SX.level('wind', clamp((S.speed + S.boost - 6) / 27, 0, 1) + Math.min(0.25, Math.hypot(S.gustX, S.gustZ) * 0.07)); };   // 바람 = 빠를수록 · 돌풍 때 더
  const stepCore = (dt, I) => {
    S.t += dt; P.x = S.x; P.y = S.y; P.z = S.z; P.yaw = S.yaw; P.pitch = S.pitch; P.roll = S.roll;
    RD.px = RD.x; RD.py = RD.y; RD.pz = RD.z;
    if (tailCool > 0) tailCool -= dt; if (splashCool > 0) splashCool -= dt; if (S.safeT > 0) S.safeT -= dt;
    if (S.fallen) { stepFallen(dt, I); return; }
    if (O.liftOnly) { stepLift(dt, I); return; }

    /* 입력: ←→ 돌기(왼쪽 +) · ↑↓ 오르내리기 — 부드럽게 따라감(휘청 X) */
    const tin = I.axis('right', 'left'), pin = I.axis('back', 'fwd');
    turnS += (tin - turnS) * Math.min(1, dt * 7); pitchS += (pin - pitchS) * Math.min(1, dt * 5);
    turnHeld = Math.abs(tin) > 0.5 ? turnHeld + dt : 0;

    /* 꼬리: 보통 1~4 · 쉬움 Space 누르고 있기 = 꼬리 펴기 */
    let fl, fr, brake;
    if (easy || O.tailAuto) {
      const sp = O.tailAuto ? Math.abs(turnS) > 0.4 : I.on('jump');                  // tailAuto = 도는 쪽으로 꼬리가 저절로(덤 가속 없음)
      if (!O.tailAuto && sp && !S.spread && turnHeld > 0.15 && tailCool <= 0) { boost(3); tailCool = 1.2; S.tailHits++; }   // 도는 중에 직접 폄 = 꼬리 맞춤
      S.spread = sp; fl = fr = sp ? 1.8 : 1; brake = sp ? 1.15 : 1; S.tail = sp ? (turnS >= 0 ? 2 : 3) : 1;
    } else {
      for (let k = 1; k <= 4; k++) if (I.tap('t' + k)) setTail(k);
      const T = TAIL[S.tail]; fl = T[0]; fr = T[1]; brake = T[2]; S.spread = S.tail !== 1;
    }

    /* 돌기 · 기울기(돌 때만 기울고 곧 되돌아옴) */
    let rate = FK.turn * turnS * (turnS > 0 ? fl : fr);
    /* 날갯짓(보통) — 다 올라간 박자 = 힘 1 · 너무 일찍(연타) = 반 이하 · 오래 기다림(활공) = 0.8 */
    fp += dt;
    if (!easy && !O.noFlap && I.tap('jump')) {
      let pw, kind;
      if (fp < TOP_T) { pw = 0.5 * fp / TOP_T; kind = 'early'; S.early++; }
      else if (fp < TOP_END) { pw = 1; kind = 'top'; S.perfect++; }
      else { pw = 0.8; kind = 'glide'; }
      S.speed += FK.flapDv * pw * (1 - 0.35 * S.speed / FK.vmax); S.lift = Math.min(5, S.lift + FK.flapLift * pw); fp = 0;
      EV.flap.power = pw; EV.flap.kind = kind; emit('flap');
    }
    if (easy || O.autoForward) {                              // 쉬움: 저절로 날갯짓(보이는 것만) · 오를 때 더 자주
      autoFlap -= dt; if (autoFlap <= 0 && (pitchS > 0.2 || S.speed < FK.vcruise - 2)) { fp = 0; autoFlap = 0.9; if (SX) SX.play('flap', null, 0.5); }
    }
    S.flapPh = fp;

    /* 오르내리기 — 손을 떼면 저절로 수평 · 실속이면 고개가 떨어짐 · 꼬리 4 = 고개 더 숙임 */
    let pt = pitchS > 0 ? pitchS * FK.pitchUp : pitchS * FK.pitchDown * (S.tail === 4 && !easy ? 1.5 : 1);
    S.stall = S.speed < FK.vstall && !(easy || O.autoForward);
    if (S.stall) pt -= (FK.vstall - S.speed) / FK.vstall * 0.55;
    S.pitch += (pt - S.pitch) * Math.min(1, dt * 3.2);

    /* 속도 하나: 내리막 = 빨라짐 · 오르막 = 느려짐 · 끌림 · 저절로 앞으로(쉬움) · 덤 속도(스침·꼬리 맞춤)는 따로 사라짐 */
    S.speed -= 9.8 * Math.sin(S.pitch) * dt * 0.85;
    if (easy || O.autoForward) { const tgt = FK.vcruise * (S.spread ? 0.92 : 1) - (S.tail === 4 ? 6 : 0); S.speed += (tgt - S.speed) * Math.min(1, dt * 0.9); }
    else S.speed -= FK.drag * S.speed * brake * dt;
    S.speed = clamp(S.speed, 0, FK.vmax);
    S.boost = Math.max(0, S.boost - dt * (S.boost * 0.9 + 1.2));
    const v = S.speed + S.boost;

    /* 바람(돌풍) — 씨앗 난수로 때·세기 · 옆으로 밂(보이는 짝 = 물 위 바람결 · 기울어짐) */
    if (O.gusts && rng) {
      gustT -= dt;
      if (gustT <= 0 && gustDur <= 0) { gustDur = 2.4; gustA = rng() * Math.PI * 2; gustK = (1.6 + rng() * 1.8) * A.gust; gustT = 6 + rng() * 6; }
      if (gustDur > 0) { gustDur -= dt; const e = Math.sin(Math.PI * clamp(1 - gustDur / 2.4, 0, 1)) * gustK; S.gustX = Math.cos(gustA) * e; S.gustZ = Math.sin(gustA) * e; } else S.gustX = S.gustZ = 0;
    }

    /* 실속 — 느리면 천천히 내려감 · 오래면 히컵이 떨어짐 */
    let sink = FK.sink * (1 - Math.min(1, S.lift / 2.5));
    if (S.stall) { sink += (FK.vstall - S.speed) * 0.9; S.stallT += dt; } else S.stallT = Math.max(0, S.stallT - dt * 2);
    S.lift *= Math.exp(-dt * 2.2);

    /* 도움 ① 돌 피하기(부딪히기 0.6~0.95초 앞에서 옆으로 살짝) ② 경계 안으로 ③ 물 위 바닥 ④ 천장 */
    if (A.avoid > 0) rate += avoidRate(v) * A.avoid;
    const bk = boundK(S.x, S.z);
    if (bk > 0.9) { const b = W.bounds, to = Math.atan2(b.x - S.x, b.z - S.z); rate += clamp(wrap(to - S.yaw) * 2, -1, 1) * (bk - 0.9) * 12; }
    S.yaw = wrap(S.yaw + rate * dt);
    const bankT = clamp(-rate / FK.turn * 0.5, -1.05, 1.05);
    S.roll += (bankT - S.roll) * Math.min(1, dt * 4);

    const h = Math.cos(S.pitch) * v;
    S.vx = Math.sin(S.yaw) * h + S.gustX + pushX; S.vz = Math.cos(S.yaw) * h + S.gustZ + pushZ;
    S.vy = Math.sin(S.pitch) * v + S.lift - sink + pushY;

    const wy = waterAt(S.x, S.z), gy = W.ground ? W.ground(S.x, S.z) : -1e9, floorY = Math.max(wy, gy);
    if (A.floor > 0) {
      const cl = S.y - floorY - FK.body;                      // 배 밑 여유
      if (cl < A.floor && S.vy < 0) { const k = clamp(cl / A.floor, 0, 1); S.vy *= k; S.pitch += (0.12 - S.pitch) * Math.min(1, dt * 3 * (1 - k)); }
    }
    if (S.y > O.ceil - 12 && S.vy > 0) S.vy *= clamp((O.ceil - S.y) / 12, 0, 1);

    S.x += S.vx * dt; S.y += S.vy * dt; S.z += S.vz * dt;
    if (bk > 1.06) { const b = W.bounds; if (b.rx) { S.x = b.x + (S.x - b.x) / bk * 1.06; S.z = b.z + (S.z - b.z) / bk * 1.06; } else { S.x = b.x + (S.x - b.x) / bk * 1.06; S.z = b.z + (S.z - b.z) / bk * 1.06; } }
    if (S.y > O.ceil) S.y = O.ceil;

    collide(dt, wy, gy);
    if (!S.fallen) {
      checkGate();
      if (S.stallT > A.stallFall) fall('stall');
    }
    S.tuck = Math.max(0, S.tuck - dt * 1.8);
  };

  /* 앞을 내다보고 정말 부딪힐 돌만 살짝 비껴 감 — 손보다 약하게(관문 틈으로 드는 손을 이기지 않음) · 가장 가까운 하나만 · 둘레 칸만 */
  function avoidRate(v) {
    const la = v * A.look, fx = S.x + Math.sin(S.yaw) * la, fz = S.z + Math.cos(S.yaw) * la;
    const a = grid.get(gk(Math.floor(fx / CELL), Math.floor(fz / CELL))); if (!a) return 0;
    let best = 0, bk = 0;
    for (let q = 0; q < a.length; q++) {
      const p = pillars[a[q]]; if (S.y > p.top + 1) continue;
      const dx = fx - p.x, dz = fz - p.z, d = Math.hypot(dx, dz), need = p.r + FK.body + 0.6;
      if (d < need && 1 - d / need > bk) {
        bk = 1 - d / need;
        const side = Math.sin(S.yaw) * (p.z - S.z) - Math.cos(S.yaw) * (p.x - S.x);   // > 0 = 기둥이 오른쪽(−cos, sin 쪽)
        best = (side > 0 ? 1 : -1) * Math.min(1, bk * 2.2);   // 기둥 반대쪽으로(왼쪽 = +)
      }
    }
    return best;
  }

  function collide(dt, wy, gy) {
    /* 물 — 배가 닿으면 첨벙: 느려지고 튀어 오름 */
    if (S.y - FK.body * 0.6 < wy) {
      S.y = wy + FK.body * 0.6; if (S.pitch < 0.1) S.pitch = 0.1;
      if (splashCool <= 0) { S.splashes++; EV.splash.speed = S.speed; S.speed *= 0.72; S.boost = 0; S.lift = Math.max(S.lift, 3); splashCool = 1; emit('splash'); }
    }
    if (gy > wy && S.y - FK.body * 0.6 < gy) {               // 땅(코브 바닥 등)
      S.y = gy + FK.body * 0.6; if (S.pitch < 0.15) S.pitch = 0.15;
      if (splashCool <= 0) { S.bumps++; EV.bump.speed = S.speed; S.speed *= 0.6; splashCool = 1; emit('bump'); }
    }
    /* 돌기둥 — 몸이 닿으면 튕김(세게 정면이면 떨어짐) · 날개 끝이 1m 안이면 스침 = 바람 + 빨라짐 */
    const a = grid.get(gk(Math.floor(S.x / CELL), Math.floor(S.z / CELL)));
    if (a) for (let q = 0; q < a.length; q++) {
      const k = a[q], p = pillars[k]; if (S.y > p.top + 1.2) continue;
      const dx = S.x - p.x, dz = S.z - p.z, dc = Math.hypot(dx, dz) || 1e-4, d = dc - p.r;
      if (d < FK.body) {
        const nx = dx / dc, nz = dz / dc, vin = -(S.vx * nx + S.vz * nz);   // 기둥 쪽으로 가던 빠르기
        S.x = p.x + nx * (p.r + FK.body); S.z = p.z + nz * (p.r + FK.body);
        if (vin > FK.hitBig[mode] && S.safeT <= 0) { S.crashes++; EV.crash.speed = vin; emit('crash'); fall('crash'); return; }
        /* 미끄러지듯 비껴 감 — 방향을 기둥 면을 따라(앞으로 가던 쪽) */
        const tx = -nz, tz = nx, sgn = (S.vx * tx + S.vz * tz) >= 0 ? 1 : -1;
        S.yaw = wrap(S.yaw + clamp(wrap(Math.atan2(tx * sgn, tz * sgn) - S.yaw), -0.6, 0.6));
        if (vin > 3) { S.speed *= 0.78; S.boost = 0; S.bumps++; EV.bump.speed = vin; emit('bump'); }
      } else if (d < FK.body + FK.graze && S.t - pillarHit[k] > 1.0 && S.speed > 12) {
        pillarHit[k] = S.t; S.grazes++; boost(6); S.tuck = 1; EV.graze.i = k; EV.graze.d = d - FK.body; emit('graze');
      }
    }
    /* 아치 — 다리는 pillars에 있음 · 위 다리(가로 돌)만 여기서: 밑을 스치면 스침 */
    for (let i = 0; i < AR.length; i++) {
      const r = AR[i], dx = S.x - r.x, dz = S.z - r.z, u = dx * r.ux + dz * r.uz, w = -dx * r.uz + dz * r.ux;
      if (Math.abs(u) > r.half || Math.abs(w) > r.th * 0.5 + FK.body + FK.graze) continue;
      const inSpan = Math.abs(w) < r.th * 0.5 + FK.body * 0.6;
      if (inSpan && S.y > r.y0 - FK.body && S.y < r.y1 + FK.body) {
        if (S.y < (r.y0 + r.y1) * 0.5) { S.y = r.y0 - FK.body; if (S.vy > 0) S.pitch = Math.min(S.pitch, -0.05); } else S.y = r.y1 + FK.body;
        S.speed *= 0.85; S.bumps++; EV.bump.speed = S.speed; emit('bump');
      } else if (S.y < r.y0 - FK.body && S.y > r.y0 - FK.body - FK.graze - 1.5 && S.t - archHit[i] > 1.5 && S.speed > 12) {
        archHit[i] = S.t; S.grazes++; boost(7); S.tuck = 1; EV.graze.i = -1 - i; EV.graze.d = r.y0 - FK.body - S.y; emit('graze');
      }
    }
  }

  function checkGate() {
    if (S.gates >= gates.length) return;
    const g = gates[S.gates];
    const s0 = (P.x - g.x) * g.nx + (P.z - g.z) * g.nz, s1 = (S.x - g.x) * g.nx + (S.z - g.z) * g.nz;
    if (s0 < 0 && s1 >= 0) {
      const k = s0 / (s0 - s1), cx = P.x + (S.x - P.x) * k, cy = P.y + (S.y - P.y) * k, cz = P.z + (S.z - P.z) * k;
      const d = Math.hypot(cx - g.x, cy - g.y, cz - g.z);
      if (d <= g.r * A.gateR) {
        const matched = easy ? (g.tail !== 1) === S.spread : S.tail === g.tail;
        if (matched) { S.matched++; boost(4); }
        EV.gate.i = S.gates; EV.gate.matched = matched; EV.gate.tail = g.tail;
        S.gates++; emit('gate');
        if (S.gates >= gates.length && !S.done) { S.done = true; S.doneT = S.t; EV.done.t = S.t; emit('done'); }
      } else if (Math.abs(cy - g.y) < 60) { S.misses++; EV.miss.i = S.gates; EV.miss.d = d; emit('miss'); }
    }
  }

  function stepFallen(dt, I) {
    /* 히컵: 떨어짐(공기 저항 조금 · 빙글) */
    RD.vy -= 9.8 * dt; const dr = Math.exp(-dt * 0.18); RD.vx *= dr; RD.vz *= dr; RD.vy *= Math.exp(-dt * 0.05);
    RD.x += RD.vx * dt; RD.y += RD.vy * dt; RD.z += RD.vz * dt; RD.spin += dt * 2.2;
    S.fallT += dt;
    const dx = RD.x - S.x, dy = (RD.y - 1.6) - S.y, dz = RD.z - S.z, d = Math.hypot(dx, dy, dz) || 1e-3;
    if (S.fallT < 0.8) {                                     // 휘청: 꼬리를 못 잡아 고개가 떨어지고 흔들리며 앞으로 밀림
      S.vy -= 9 * dt; S.vx *= Math.exp(-dt * 0.25); S.vz *= Math.exp(-dt * 0.25);
      S.x += S.vx * dt; S.y += S.vy * dt; S.z += S.vz * dt;
      S.pitch += (-0.7 - S.pitch) * Math.min(1, dt * 3); S.roll = Math.sin(S.fallT * 9) * 0.5 * (1 - S.fallT / 0.8);
      S.speed = Math.hypot(S.vx, S.vy, S.vz); S.riderDist = d; S.grab = false; fp += dt; S.flapPh = fp;
      if (I.tap('jump')) S.lockT = 0.45;
      floorClamp(); rescue(); return;
    }
    /* 투슬리스: 히컵을 따라 내려옴 — 가까우면 히컵 빠르기에 맞춰 나란히 */
    const close = clamp(1 - (d - 3) / 14, 0, 1);
    const ws = Math.min(36, 14 + d * 1.4);
    const tvx = dx / d * ws * (1 - close) + RD.vx * close + dx * 1.2 * close, tvy = dy / d * ws * (1 - close) + RD.vy * close + dy * 1.2 * close, tvz = dz / d * ws * (1 - close) + RD.vz * close + dz * 1.2 * close;
    const k = Math.min(1, dt * (1.6 + close * 3));
    S.vx += (tvx - S.vx) * k; S.vy += (tvy - S.vy) * k; S.vz += (tvz - S.vz) * k;
    S.x += S.vx * dt; S.y += S.vy * dt; S.z += S.vz * dt;
    const hs = Math.hypot(S.vx, S.vz);
    if (hs > 2) { const ty = Math.atan2(S.vx, S.vz); S.yaw = wrap(S.yaw + clamp(wrap(ty - S.yaw), -3 * dt, 3 * dt)); }
    S.pitch += (clamp(Math.atan2(S.vy, hs), -1.1, 0.4) - S.pitch) * Math.min(1, dt * 3); S.roll *= Math.exp(-dt * 3);
    S.speed = Math.hypot(S.vx, S.vy, S.vz);
    S.riderDist = d; fp += dt; S.flapPh = fp;
    /* 가까워진 박자(창) — 3.6m 안 · Space(창 밖에서 누르면 0.45초 못 누름 = 연타 막기) */
    if (S.lockT > 0) S.lockT -= dt;
    const open = d < 3.6;
    S.grab = open;
    S.grabT = open ? S.grabT + dt : 0;
    if (I.tap('jump')) { if (open && S.lockT <= 0) { regrab(false); return; } S.lockT = 0.45; }
    if (open && A.autoGrab && S.grabT > 0.25) { regrab(true); return; }
    floorClamp(); rescue();
  }
  /* 떨어지는 동안 투슬리스는 물·땅을 스치듯 넘음(배가 닿지 않게) */
  function floorClamp() {
    const f = Math.max(waterAt(S.x, S.z), W.ground ? W.ground(S.x, S.z) : -1e9) + FK.body + 0.6;
    if (S.y < f) { S.y = f; if (S.vy < 0) S.vy = 0; }
  }
  /* 물에 닿기 전에 투슬리스가 건져 올림(첨벙 · 놓친 값) */
  function rescue() {
    const wy = waterAt(RD.x, RD.z), gy = W.ground ? W.ground(RD.x, RD.z) : -1e9;
    if (RD.y < Math.max(wy, gy) + 2.2) {
      RD.y = Math.max(wy, gy) + 4.2; S.vy = 3; S.vx = Math.sin(S.yaw) * 10; S.vz = Math.cos(S.yaw) * 10;
      S.splashes++; EV.splash.speed = S.speed; emit('splash'); regrab(true);
      S.pitch = 0.3; S.speed = FK.vcruise * 0.7;
    }
  }

  /* 5장 첫 들림 — 낮게만 · 앞으로 저절로 · 날갯짓 없음 · 꼬리 좌우만 · 몇 초 뒤 물(호수)에 첨벙 */
  function stepLift(dt, I) {
    if (S.done) { S.speed = 0; S.vx = S.vy = S.vz = 0; S.roll *= Math.exp(-dt * 4); return; }
    S.liftT += dt; const T = S.liftT;
    const tin = I.axis('right', 'left'); turnS += (tin - turnS) * Math.min(1, dt * 6);
    S.spread = Math.abs(turnS) > 0.3; S.tail = turnS > 0.3 ? 2 : turnS < -0.3 ? 3 : 1;
    const gy = W.ground ? W.ground(S.x, S.z) : 0, wy = waterAt(S.x, S.z), base = Math.max(gy, wy);
    S.speed += ((T < O.liftSec ? 10 : 7) - S.speed) * Math.min(1, dt * 1.5);
    let rate = FK.turn * 0.9 * turnS;
    const bk = boundK(S.x, S.z);
    if (bk > 0.86) {                                          // 돌벽에 가까우면 튕겨 나옴(손으로 피하는 연습)
      const b = W.bounds, to = Math.atan2(b.x - S.x, b.z - S.z); rate += clamp(wrap(to - S.yaw), -1, 1) * (bk - 0.86) * 10;
      if (bk > 0.97 && splashCool <= 0) { S.bumps++; S.speed *= 0.7; splashCool = 0.8; EV.bump.speed = S.speed; emit('bump'); }
    }
    S.yaw = wrap(S.yaw + rate * dt);
    S.roll += (clamp(-rate / FK.turn * 0.6, -0.9, 0.9) + Math.sin(T * 5.3) * 0.08 - S.roll) * Math.min(1, dt * 4);   // 처음이라 살짝 뒤뚱
    const ty = T < O.liftSec ? base + FK.body * 0.6 + Math.min(1, T / 0.9) * 2.4 + Math.sin(T * 3.1) * 0.35 : -1e9;
    if (T < O.liftSec) S.vy = clamp((ty - S.y) * 3, -6, 6); else S.vy = Math.max(S.vy - 6 * dt, -4);
    S.pitch += ((T < O.liftSec ? 0.08 : -0.18) - S.pitch) * Math.min(1, dt * 3);
    S.vx = Math.sin(S.yaw) * S.speed; S.vz = Math.cos(S.yaw) * S.speed;
    S.x += S.vx * dt; S.y += S.vy * dt; S.z += S.vz * dt;
    fp = T < 0.5 ? 0 : fp + dt; S.flapPh = fp;
    const nb = W.ground ? W.ground(S.x, S.z) : 0, nw = waterAt(S.x, S.z);
    if (T > O.liftSec && S.y - FK.body * 0.6 <= Math.max(nb, nw) && !S.done) {
      S.y = Math.max(nb, nw) + FK.body * 0.6; S.speed = 0; S.done = true; S.doneT = S.t;
      if (nw >= nb) { S.splashes++; EV.splash.speed = 7; emit('splash'); } else { S.bumps++; EV.bump.speed = 7; emit('bump'); }
      EV.done.t = S.t; emit('done');
    }
    if (S.done) { S.speed = 0; S.vy = 0; S.y = Math.max(nb, nw) + FK.body * 0.3; }
  }
  F.lifted = () => S.liftT;

  /* 그리기 — 보간해 드래곤·히컵을 놓고 rig 값(있는 것만)을 넣은 뒤 rig.update(dt)를 부름(따로 부르지 말 것) */
  F.draw = (a, dt = 1 / 60) => {
    const yaw = P.yaw + wrap(S.yaw - P.yaw) * a;
    pose.x = P.x + (S.x - P.x) * a; pose.y = P.y + (S.y - P.y) * a; pose.z = P.z + (S.z - P.z) * a;
    pose.yaw = yaw; pose.pitch = P.pitch + (S.pitch - P.pitch) * a; pose.roll = P.roll + (S.roll - P.roll) * a; pose.speed = S.speed + S.boost;
    pose.rx = RD.px + (RD.x - RD.px) * a; pose.ry = RD.py + (RD.y - RD.py) * a; pose.rz = RD.pz + (RD.z - RD.pz) * a;
    if (dragon && dragon.root) {
      dragon.root.position.set(pose.x, pose.y - 1.2, pose.z);   // 모델 뿌리 = 발 밑(몸 가운데보다 1.2m 아래)
      dragon.root.rotation.set(-pose.pitch, yaw, pose.roll, 'YXZ');
      const R = dragon.rig;
      if (R) {
        /* 날개: 날갯짓 뒤 0~0.25 내려침 · ~0.62 올림 · ~0.98 다 올라가 멈춤(누를 박자) · 그 뒤 활공으로 폄 */
        let ph, rateV, glide;
        const t = S.flapPh;
        if (S.fallen) { ph = 0; rateV = 0; glide = 0.2; }
        else if (t < 0.25) { ph = -Math.PI / 2 + t / 0.25 * Math.PI; rateV = WING; glide = 0; }
        else if (t < TOP_T) { ph = Math.PI / 2 + (t - 0.25) / (TOP_T - 0.25) * Math.PI; rateV = WING; glide = 0; }
        else if (t < TOP_END && !(easy || O.autoForward || O.liftOnly)) { ph = Math.PI * 1.5; rateV = WING; glide = 0; }
        else { ph = Math.PI * 1.5; rateV = WING * Math.max(0, 1 - (t - (easy ? TOP_T : TOP_END)) / 0.3); glide = 1 - rateV / WING; }
        if (O.liftOnly && S.liftT > 0.5) { rateV = 0.25; ph = S.liftT * 9; glide = 0.6; }
        R.flapRate = rateV; R.glide = glide;
        if (typeof R.flap === 'number') R.flap = ph - (rateV > 0.02 ? dt * (1.6 + rateV * 2.2) * Math.PI * 2 : 0);   // rig.update가 더할 몫을 미리 뺌
        R.fold = S.fallen ? 0.45 : O.liftOnly ? 0.05 : S.tuck * 0.35 + (S.tail === 4 && !easy ? 0.25 : 0);
        R.look = clamp(turnS * 0.5, -0.6, 0.6);
        if ('tilt' in R) R.tilt = -pose.roll * 0.3;
        if ('fin' in R) R.fin = S.tail;
        if ('headUp' in R) R.headUp = clamp(pose.pitch * 1.2, -0.6, 0.6);
        if (R.update) R.update(dt);
      }
    }
    if (rider && rider.root) {
      const R = rider.rig;
      if (!S.fallen) {
        _e.set(-pose.pitch, yaw, pose.roll, 'YXZ'); _q.setFromEuler(_e);
        _v.copy(SADDLE).applyQuaternion(_q);
        rider.root.position.set(pose.x + _v.x, pose.y - 1.2 + _v.y, pose.z + _v.z);
        rider.root.quaternion.copy(_q);
        if (R) { if ('ride' in R) R.ride = 1; else R.low = 1; R.speed = 0; R.reach = 0; R.away = 0; if ('cower' in R) R.cower = 0; }
      } else {
        rider.root.position.set(pose.rx, pose.ry - 0.8, pose.rz);
        _e.set(Math.sin(RD.spin) * 0.6, yaw + RD.spin * 0.4, Math.cos(RD.spin * 0.7) * 0.5, 'YXZ'); rider.root.quaternion.setFromEuler(_e);
        if (R) { if ('ride' in R) R.ride = 0; R.low = 0.3; R.speed = 0.6; R.reach = S.grab ? 1 : 0.4; if ('cheer' in R) R.cheer = S.grab ? 0 : 0.7; }
      }
      if (R && R.update) R.update(dt);
    }
  };

  /* 카메라가 돌기둥 속으로 들어가지 않게 밀어냄(카메라용) */
  F.pushOut = (p, m = 2.5) => {
    const a = grid.get(gk(Math.floor(p.x / CELL), Math.floor(p.z / CELL))); if (!a) return p;
    for (let q = 0; q < a.length; q++) {
      const c = pillars[a[q]]; if (p.y > c.top + 2) continue;
      const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz) || 1e-4, rr = c.r + m;
      if (d < rr) { p.x = c.x + dx / d * rr; p.z = c.z + dz / d * rr; }
    }
    return p;
  };
  F.waterAt = waterAt;
  /* 화면에 보이는 날개 자리(봇·화면 표시) — 다 올라가 멈춰 있음 = 누를 박자 */
  F.wingsUp = () => !easy && !O.noFlap && !S.fallen && S.flapPh >= TOP_T && S.flapPh < TOP_END;
  return F;
}

/* 뒤따르는 3인칭 카메라 — 흔들림 적게(기울기 X) · 빠를 때 시야각 60 → 70 · 스칠 때 살짝 넓어짐 · 물·돌기둥 안으로 안 들어감 */
export function createFlightCam(camera, o = {}) {
  const C = { dist: o.dist ?? 10.5, up: o.up ?? 2.9, ahead: 12, fov0: 60, fov1: 70, x: 0, y: 0, z: 0, yaw: 0, lx: 0, ly: 0, lz: 0, init: false, kick: 0, fov: 60 };
  const p = { x: 0, y: 0, z: 0 };
  C.kickFov = (k = 3) => { C.kick = Math.max(C.kick, k); };
  C.update = (dt, F) => {
    const s = F.pose, st = F.state;
    let tx = s.x, ty = s.y + 0.6, tz = s.z, yawT = s.yaw;
    if (st.fallen) {                                         // 떨어지면 히컵과 투슬리스 사이를 봄
      tx = s.x * 0.45 + s.rx * 0.55; ty = s.y * 0.45 + s.ry * 0.55 + 1; tz = s.z * 0.45 + s.rz * 0.55;
    }
    if (!C.init) { C.yaw = yawT; }
    C.yaw += wrap(yawT - C.yaw) * Math.min(1, dt * (st.fallen ? 1.5 : 3.2));   // 돌 때 조금 늦게 따라와 옆모습이 살짝 보임
    const pitchLift = clamp(-s.pitch, -0.5, 0.7) * C.dist * 0.45;              // 내리꽂으면 카메라가 조금 위로
    p.x = tx - Math.sin(C.yaw) * C.dist; p.z = tz - Math.cos(C.yaw) * C.dist; p.y = ty + C.up + pitchLift;
    if (F.pushOut) F.pushOut(p, 2.5);
    const wy = F.waterAt ? F.waterAt(p.x, p.z) : 0, gy = F.world && F.world.ground ? F.world.ground(p.x, p.z) : -1e9;
    p.y = Math.max(p.y, Math.max(wy, gy) + 1.6);
    if (!C.init) { C.x = p.x; C.y = p.y; C.z = p.z; C.lx = tx; C.ly = ty; C.lz = tz; C.init = true; }
    const k = 1 - Math.exp(-dt * 7), kl = 1 - Math.exp(-dt * 10);
    C.x += (p.x - C.x) * k; C.y += (p.y - C.y) * k; C.z += (p.z - C.z) * k;
    const ax = tx + Math.sin(s.yaw) * C.ahead, az = tz + Math.cos(s.yaw) * C.ahead, ay = ty + Math.sin(s.pitch) * C.ahead * 0.6;
    C.lx += (ax - C.lx) * kl; C.ly += (ay - C.ly) * kl; C.lz += (az - C.lz) * kl;
    camera.position.set(C.x, C.y, C.z); camera.up.set(0, 1, 0); camera.lookAt(C.lx, C.ly, C.lz);
    C.kick = Math.max(0, C.kick - dt * 4);
    const sp = clamp((s.speed - 18) / 16, 0, 1), f = C.fov0 + (C.fov1 - C.fov0) * sp * sp * (3 - 2 * sp) + C.kick;
    C.fov += (f - C.fov) * Math.min(1, dt * 3);
    if (Math.abs(camera.fov - C.fov) > 0.05) { camera.fov = C.fov; camera.updateProjectionMatrix(); }
  };
  C.reset = () => { C.init = false; };
  return C;
}
