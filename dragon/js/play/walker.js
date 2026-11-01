// 걷는 사람(플레이어) — 카메라 기준 방향으로 걷기 · Shift 누르고 있기 = 달리기 · C 살금살금(켜고 끄기) · Space = 점프(공중 = 피하기) · 땅 높이 따라 · 원기둥·벽 밀어내기 · 위치는 걸음마다(60Hz) · 그리기는 보간
import * as THREE from 'three';

const _p = { x: 0, z: 0 }, _c = { x: 0, z: 0 }, FRAC = [0.5, 0.75, 1], FAN = [-0.8, -0.35, 0.35, 0.8];
/* 손맛 값(11-01 교사 '조작감이 제일 중요해 · 이동이 이상하고 멀미 나' — 메타버스 v2/js/main.js PHY와 나란히 맞춤 · design §7-1 견줌 표)
   걷기 4.2 · 달리기 7.5 · 살금 1.6 m/s · 서고 가기 = 거의 바로(가속 30 · 멈춤 40 /초 — 90%까지 0.08초 · 멈추며 미끄러짐 0.1m) · 몸 돌기 15/초
   점프 = 꼭대기 0.85m · 0.52초 · 가던 힘 그대로(손을 떼도 날아감 · 누르면 7/초로 틂 · 서서 방향키+Space = 그쪽으로 뛰어오름 60%) · 공중에 있는 동안 = 피하기(W.rollT > 0 — 장 판정은 그대로)
   내려앉고 0.45초 안에 또 뛰면 낮은 콩 뛰기(0.3m · 피하기 아님) = 연타하면 무방비(design §1 '연타 = 무방비') */
export const FEEL = { walk: 4.2, run: 7.5, low: 1.6, acc: 30, stop: 40, turn: 15, airAcc: 7, kick: 0.6,
  jumpH: 0.85, jumpT: 0.52, hopH: 0.3, hopT: 0.34, rest: 0.45, buf: 0.12 };
export function createWalker(o) {               // o = { height(x,z,yHint), collide(play/collide.js) | blockers: [{x,z,r}], bound, x, z, yaw }
  const W = { x: o.x || 0, z: o.z || 0, y: o.y || 0, yaw: o.yaw || 0, vx: 0, vz: 0, speed: 0, low: false, px: 0, pz: 0, py: 0, pyaw: 0, roll: 0, rollT: 0, lock: false,
    air: 0, pair: 0, vy: 0, g: 0, inAir: false, jt: 0, jT: 0, dodge: false, landT: 9, landK: 0, bufT: 0, jumps: 0, hops: 0 };
  W.y = o.height(W.x, W.z, W.y);
  W.place = (x, z, yaw, y) => { W.x = W.px = x; W.z = W.pz = z; if (yaw != null) W.yaw = W.pyaw = yaw; W.y = W.py = o.height(x, z, y != null ? y : W.y); W.vx = W.vz = 0; W.air = W.pair = W.vy = 0; W.inAir = W.dodge = false; W.rollT = 0; W.landT = 9; W.landK = 0; W.snap = true; };
  W.step = (dt, I, camYaw) => {
    W.px = W.x; W.pz = W.z; W.py = W.y; W.pyaw = W.yaw; W.pair = W.air;
    if (I.tap('low')) W.low = !W.low;                              // 켜고 끄기(누르고 있기 X — 1학년)
    const f = W.lock ? 0 : I.axis('back', 'fwd'), r = W.lock ? 0 : I.axis('left', 'right');
    const mx = Math.sin(camYaw) * f - Math.cos(camYaw) * r, mz = Math.cos(camYaw) * f + Math.sin(camYaw) * r;   // 앞 = (sin, cos) · 오른쪽 = (−cos, sin)
    const m = Math.hypot(mx, mz);
    const run = !W.lock && I.on('run'); if (run && W.low) W.low = false;   // 달리면 살금살금은 꺼짐
    const top = W.low ? FEEL.low : run ? FEEL.run : FEEL.walk; W.running = run && m > 0.1;
    /* 점프 — 땅에서만 · 공중에서 누른 것은 내려앉기 0.12초 앞까지 기억(먼저 눌러도 뜀) */
    W.landT += dt; if (W.bufT > 0) W.bufT -= dt;
    const can = !W.lock && W.canRoll !== false, want = can && I.tap('jump');
    if (want && W.inAir) W.bufT = FEEL.buf;
    if (!W.inAir && can && (want || W.bufT > 0)) {
      const hop = W.landT < FEEL.rest, H = hop ? FEEL.hopH : FEEL.jumpH, T = hop ? FEEL.hopT : FEEL.jumpT;
      W.g = 8 * H / (T * T); W.vy = 4 * H / T; W.inAir = true; W.jt = 0; W.jT = T; W.dodge = !hop; W.bufT = 0;
      if (m > 0.1) { const k = FEEL.kick, tx = mx / Math.max(1, m) * top, tz = mz / Math.max(1, m) * top; W.vx += (tx - W.vx) * k; W.vz += (tz - W.vz) * k; }   // 누른 쪽으로 뛰어오름(서 있다 옆으로 피할 때)
      if (hop) W.hops++; else { W.jumps++; W.rolls = W.jumps; }
    }
    if (W.inAir) {
      W.jt += dt; W.vy -= W.g * dt; W.air += W.vy * dt;
      if (W.air <= 0 && W.vy < 0) { W.landK = Math.min(1, -W.vy / 6.5); W.air = 0; W.vy = 0; W.inAir = false; W.dodge = false; W.landT = 0; }
    }
    W.rollT = W.inAir && W.dodge ? Math.max(0.001, W.jT - W.jt) : 0;   // 피하기 판정(장 파일: !(P.W.rollT > 0)) = 제대로 뛴 점프의 공중
    W.roll = W.inAir ? 1 : Math.max(0, FEEL.rest - W.landT);
    /* 걷기 — 땅 = 거의 바로 서고 바로 감 · 공중 = 가던 힘 그대로(누르면 조금씩만 틂) */
    const sp = m > 0.1 ? top : 0;
    const tvx = m > 0.1 ? mx / Math.max(1, m) * sp : 0, tvz = m > 0.1 ? mz / Math.max(1, m) * sp : 0;
    const acc = W.inAir ? (m > 0.1 ? Math.min(1, dt * FEEL.airAcc) : 0) : Math.min(1, dt * (m > 0.1 ? FEEL.acc : FEEL.stop));
    W.vx += (tvx - W.vx) * acc; W.vz += (tvz - W.vz) * acc;
    W.x += W.vx * dt; W.z += W.vz * dt;
    if (o.collide) { _p.x = W.x; _p.z = W.z; o.collide.push(_p, 0.35); W.x = _p.x; W.z = _p.z; }
    else for (const b of o.blockers || []) {                       // 원기둥 밀어내기
      const dx = W.x - b.x, dz = W.z - b.z, d = Math.hypot(dx, dz), rr = b.r + 0.35;
      if (d < rr && d > 1e-4) { W.x = b.x + dx / d * rr; W.z = b.z + dz / d * rr; }
    }
    if (o.bound) { const d = Math.hypot(W.x - o.bound.x, W.z - o.bound.z); if (d > o.bound.r) { W.x = o.bound.x + (W.x - o.bound.x) / d * o.bound.r; W.z = o.bound.z + (W.z - o.bound.z) / d * o.bound.r; } }
    /* 벽에 막힌 만큼 속도도 덜어냄 — 공중에서 벽을 밀며 미끄러지거나, 벽에서 떨어질 때 쌓인 속도로 튀지 않게 */
    if (dt > 0) { const ax = (W.x - W.px) / dt, az = (W.z - W.pz) / dt; if (Math.abs(ax - W.vx) + Math.abs(az - W.vz) > 0.05) { W.vx = ax; W.vz = az; } }
    W.y = o.height(W.x, W.z, W.y);
    W.speed = Math.hypot(W.vx, W.vz);
    if (m > 0.1 && (W.speed > 0.3 || W.inAir)) { const ty = Math.atan2(tvx, tvz); let d = ty - W.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); W.yaw += d * Math.min(1, dt * FEEL.turn * (W.inAir ? 0.6 : 1)); }   // 몸은 누르는 쪽으로(메타버스처럼 · 벽에 비빌 때 몸이 벽을 따라 돌지 않게)
  };
  let dispY = null, lastT = 0;
  W.dG = null; W.dAir = 0;                                         // 그린 땅 높이(부드럽게) · 그린 점프 높이 — 카메라가 읽음
  W.draw = (a, obj) => {
    let dy = W.yaw - W.pyaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const now = performance.now(), ddt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0; lastT = now;
    const ty = W.py + (W.y - W.py) * a;                         // 땅 높이 그대로 따라가면 계단·땅 결에서 몸·카메라가 덜컹 → 멀미(11-01 교사)
    dispY = dispY == null || W.snap || Math.abs(ty - dispY) > 1.2 ? ty : dispY + (ty - dispY) * Math.min(1, ddt * 14);
    W.snap = false;
    const air = Math.max(0, W.pair + (W.air - W.pair) * a);
    W.dG = dispY; W.dAir = air;
    obj.position.set(W.px + (W.x - W.px) * a, dispY + air, W.pz + (W.z - W.pz) * a);
    obj.rotation.x = 0; obj.rotation.z = 0; obj.rotation.y = W.pyaw + dy * a;   // 비행·배가 남긴 몸 기울기는 걷기에서 바로 세움
  };
  /* 자세 값(human_rig) — jump 0~1 웅크려 뜀 · land 0~1 내려앉으며 무릎 굽힘 */
  W.poseJump = () => (W.inAir ? Math.sin(Math.PI * Math.min(1, W.jt / W.jT)) * (W.dodge ? 1 : 0.55) : 0);
  W.poseLand = () => (W.inAir ? 0 : W.landK * Math.max(0, 1 - W.landT / 0.2));
  return W;
}

/* 뒤따르는 카메라 — 어깨 너머 TPS · 몸에 단단히 붙어 돎(옆으로 늦게 끌려오지 않음 = 멀미 X) · 위아래는 용수철로 부드럽게(땅 결·계단에서 출렁 X) · 벽은 빨리 당기고 천천히 놓음 · 언덕 위로 넘어감
   끌기·두 손가락으로 둘러보기 · 잠그지 않은 놀이는 놓으면 1.5초 뒤 등 뒤로 천천히 돌아옴 */
const spring = (S, k, to, dt, w, vmax = 8) => {                 // 임계 감쇠 용수철(S[k] 자리 · S[k + 'v'] 빠르기 ≤ vmax) — 한 단 거름(지수)과 달리 비탈이 꺾이는 곳에서도 가속이 튀지 않음
  const v = S[k + 'v'], x = S[k] - to, e = Math.exp(-w * dt), t = (v + w * x) * dt;
  S[k] = to + (x + t) * e; S[k + 'v'] = Math.max(-vmax, Math.min(vmax, (v - w * t) * e));
};
export function createFollowCam(camera, height, opt = {}) {   // opt = { collide, ceil }
  /* TPS(11-01 교사): 어깨 너머(오른쪽 0.45m) · 마우스 잠금 중엔 저절로 등 뒤로 돌지 않음(마우스가 카메라 주인) · 잠그지 않은 키보드만 놀이는 예전처럼 돌아옴 */
  const C = { yaw: 0, pitch: 0.24, dist: 5.0, idle: 9, x: 0, y: 0, z: 0, init: false, collide: opt.collide || null, ceil: opt.ceil ?? Infinity, lift: 1.45, shoulder: 0.45, locked: false,
    d: 5.0, sh: 0.45, by: 0, byv: 0, outT: 0, ly: 0, lyv: 0, hitD: Infinity };
  const tgt = new THREE.Vector3();
  /* 걷기 끝 선(물가·절벽 등고선) 너머 땅이 눈높이보다 높으면 = 바위벽(카메라를 막음) · 낮으면 = 낭떠러지·물(넘어 봄) */
  const E = { ax: 0, az: 0, dx: 0, dz: 0, y: 0, by: 0 };
  const edgeOK = (t) => height(E.ax + E.dx * t + E.ux * 0.6, E.az + E.dz * t + E.uz * 0.6, E.by) > E.y - 0.3;
  const cut = (ax, az, bx, bz) => { E.ax = ax; E.az = az; E.dx = bx - ax; E.dz = bz - az; const L = Math.hypot(E.dx, E.dz) || 1; E.ux = E.dx / L; E.uz = E.dz / L; return C.collide.cut(ax, az, bx, bz, true, edgeOK); };
  /* 둘러보기 — 걸음(봇의 끌기)과 그리기(걸음 사이에 들어온 마우스) 둘 다에서 바로 씀: 걸음이 없는 프레임(60Hz 걸음 · 120Hz 화면)에도 마우스가 멈칫하지 않게 */
  C.look = (I) => {
    const z = I.zoom ? I.zoom() : 0;
    if (z) C.dist = Math.max(3.2, Math.min(8, C.dist * Math.exp(z * 0.0016)));   // 마우스 휠 = 거리(3.2~8m · 한 칸 ≈ 17%)
    const lk = I.look();
    if (Math.abs(lk.x) + Math.abs(lk.y) <= 0.01) return false;
    C.yaw -= lk.x * 0.006; C.pitch = Math.max(-0.35, Math.min(1.1, C.pitch + lk.y * 0.004)); C.idle = 0; return true;
  };
  C.step = (dt, I, W) => {
    C.locked = !!(I.locked && I.locked());
    if (!C.look(I)) C.idle += dt;
    if (!C.locked && C.idle > 1.5 && W.speed > 0.5) { let d = (W.yaw + Math.PI) - C.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); C.yaw += d * Math.min(1, dt * 1.6); }
  };
  C.draw = (dt, obj, W, I) => {
    if (I) C.look(I);
    dt = Math.min(dt, 0.1);
    const px = obj.position.x, pz = obj.position.z;
    const gy = W && W.dG != null ? W.dG + W.dAir * 0.3 : obj.position.y;   // 점프하면 화면 속 히컵이 올라가 보이게(카메라는 30%만 따라 뜀 — 메타버스 MOTION-1)
    if (!C.init || Math.abs(gy - C.by) > 2.5) { C.by = gy; C.byv = 0; } else spring(C, 'by', gy, dt, 10);   // 위아래만 부드럽게(용수철 · 계단·땅 결 · 몸 그림은 14/초로 더 빠름)
    const col = C.collide, ex = Math.cos(C.yaw), ez = -Math.sin(C.yaw);   // 화면 오른쪽 = (cos, −sin) — 사람은 화면 왼쪽 가운데
    E.y = C.by + C.lift; E.by = C.by;
    /* 어깨 — 오른쪽이 벽이면 그만큼 줄임(머리 옆 벽 너머로 눈이 나가지 않게) */
    let sh = C.shoulder;
    if (col && sh > 0) { const L = sh + 0.32, k = cut(px, pz, px + ex * L, pz + ez * L); if (k < 1) sh = Math.max(0, k * L - 0.32); }
    C.sh = !C.init ? sh : sh < C.sh ? Math.max(sh, C.sh - dt * 5) : C.sh + (sh - C.sh) * Math.min(1, dt * 3);   // 줄 땐 초당 5m(옆으로 툭 X) · 늘 땐 천천히
    tgt.set(px + ex * C.sh, C.by + C.lift, pz + ez * C.sh);
    /* 거리 — 등 뒤 벽까지(키 큰 벽만 · 울타리·난간은 넘어 봄 · 물가·낭떠러지 선은 넘어 봄) · 들어올 땐 빠르게(벽 뒤로는 절대 X) · 나갈 땐 0.3초 기다렸다가 천천히 = 떨림 0 */
    const cp = Math.cos(C.pitch), spi = Math.sin(C.pitch), bx = Math.sin(C.yaw) * cp, bz = Math.cos(C.yaw) * cp, L = C.dist + 0.4;
    let hit = Infinity, soft = Infinity, hard = Infinity;
    if (col) {
      const k = cut(tgt.x, tgt.z, tgt.x + bx * L, tgt.z + bz * L); if (k < 1) { hit = k * L; soft = hit - 0.4; hard = hit - 0.15; }
      /* 부채 넷(카메라 끝에서 옆으로 ±0.35·±0.8m) — 벽 모서리를 미리 보고 조금씩 당김(가운데 한 줄만 보면 모서리를 지나는 순간 툭) · 먼 줄일수록 덜 당김 · 옆줄은 '벽 뒤 X'를 정하지 않음(모서리 스칠 때 툭 X) */
      for (const o of FAN) { const k2 = cut(tgt.x, tgt.z, tgt.x + bx * L + ex * o, tgt.z + bz * L + ez * o); if (k2 < 1) soft = Math.min(soft, k2 * L - 0.4 + Math.abs(o) * 0.9); }
    }
    C.hitD = hit;
    const want = Math.max(0.35, Math.min(C.dist, soft)); hard = Math.max(0.3, hard);
    if (!C.init) C.d = Math.min(want, hard);
    else if (want < C.d - 0.005) { C.d -= Math.min((C.d - want) * Math.min(1, dt * 12), dt * 10); C.outT = 0; }   // 들어올 땐 빠르게(초당 10m까지)
    else { C.outT += dt; if (C.outT > 0.3) C.d += Math.min((want - C.d) * Math.min(1, dt * 2.4), dt * 4); }   // 나갈 땐 0.3초 기다렸다가 천천히(떨림 0)
    if (C.d > hard) C.d = hard;                                    // 벽 뒤로는 절대 X
    if (C.d > C.dist) C.d = C.dist;
    let cx = tgt.x + bx * C.d, cz = tgt.z + bz * C.d;
    if (col) { _c.x = cx; _c.z = cz; col.push(_c, 0.32, true); cx = _c.x; cz = _c.z; }   // 벽과 나란할 때 화면 가장자리(근평면 반폭 0.31m)가 벽을 파고들지 않게
    /* 땅 — 카메라와 머리 사이 언덕·비탈 위로 넘어감(당기지 않고 들어 올림 · 용수철로) · 카메라 발밑 땅 속으로는 절대 X */
    const cy0 = tgt.y + spi * C.d;
    let need = cy0;
    for (const f of FRAC) { const g = height(tgt.x + bx * C.d * f, tgt.z + bz * C.d * f, C.by) + 0.45, ry = tgt.y + (cy0 - tgt.y) * f; if (ry < g) need = Math.max(need, tgt.y + (g - tgt.y) / f); }
    const up = Math.min(2.5, need - cy0);                         // 들어 올림은 2.5m까지(사이 땅이 더 높으면 아래 '발밑 땅' 막이만)
    if (!C.init) { C.ly = up; C.lyv = 0; } else spring(C, 'ly', up, dt, up > C.ly ? 12 : 5, 6);
    const cy = Math.min(C.ceil - 0.4, Math.max(cy0 + Math.max(0, C.ly), height(cx, cz, C.by) + 0.3));
    C.x = cx; C.y = cy; C.z = cz; C.init = true;
    camera.position.set(cx, cy, cz); camera.lookAt(tgt);
  };
  C.moveYaw = () => C.yaw + Math.PI;                             // 걷기 방향 기준(카메라가 보는 쪽)
  return C;
}
