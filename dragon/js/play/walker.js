// 걷는 사람(플레이어) — 카메라 기준 방향으로 걷기 · Shift 누르고 있기 = 달리기 · C 살금살금(켜고 끄기) · 땅 높이 따라 · 원기둥 장애물 밀어내기 · 위치는 걸음마다(60Hz) · 그리기는 보간
import * as THREE from 'three';

const _p = { x: 0, z: 0 };
export function createWalker(o) {               // o = { height(x,z,yHint), collide(play/collide.js) | blockers: [{x,z,r}], bound, x, z, yaw }
  const W = { x: o.x || 0, z: o.z || 0, y: o.y || 0, yaw: o.yaw || 0, vx: 0, vz: 0, speed: 0, low: false, px: 0, pz: 0, py: 0, pyaw: 0, roll: 0, rollT: 0, lock: false };
  W.y = o.height(W.x, W.z, W.y);
  W.place = (x, z, yaw, y) => { W.x = W.px = x; W.z = W.pz = z; if (yaw != null) W.yaw = W.pyaw = yaw; W.y = W.py = o.height(x, z, y != null ? y : W.y); W.vx = W.vz = 0; };
  W.step = (dt, I, camYaw) => {
    W.px = W.x; W.pz = W.z; W.py = W.y; W.pyaw = W.yaw;
    if (I.tap('low')) W.low = !W.low;                              // 켜고 끄기(누르고 있기 X — 1학년)
    const f = W.lock ? 0 : I.axis('back', 'fwd'), r = W.lock ? 0 : I.axis('left', 'right');
    let mx = Math.sin(camYaw) * f - Math.cos(camYaw) * r, mz = Math.cos(camYaw) * f + Math.sin(camYaw) * r;   // 앞 = (sin, cos) · 오른쪽 = (−cos, sin)
    const m = Math.hypot(mx, mz);
    const run = !W.lock && I.on('run'); if (run && W.low) W.low = false;   // 달리면 살금살금은 꺼짐
    const top = W.low ? 1.6 : run ? 7.0 : 4.2; W.running = run && m > 0.1;
    if (W.rollT > 0) { W.rollT -= dt; mx = Math.sin(W.yaw); mz = Math.cos(W.yaw); }
    else if (!W.lock && W.canRoll !== false && I.tap('jump') && m > 0.1 && W.roll <= 0) { W.rollT = 0.45; W.roll = 1.0; W.rolls = (W.rolls || 0) + 1; }   // 구르기: 1초에 한 번
    W.roll = Math.max(0, W.roll - dt);
    const sp = W.rollT > 0 ? 7.5 : (m > 0.1 ? top : 0);
    const tvx = m > 0.1 ? mx / Math.max(1, m) * sp : 0, tvz = m > 0.1 ? mz / Math.max(1, m) * sp : 0;
    const acc = Math.min(1, dt * (m > 0.1 ? 18 : 22));   // 메타버스처럼 거의 바로 서고 바로 감(11-01 '이상한 이동 · 멀미')
    W.vx += (tvx - W.vx) * acc; W.vz += (tvz - W.vz) * acc;
    W.x += W.vx * dt; W.z += W.vz * dt;
    if (o.collide) { _p.x = W.x; _p.z = W.z; o.collide.push(_p, 0.35); W.x = _p.x; W.z = _p.z; }
    else for (const b of o.blockers || []) {                       // 원기둥 밀어내기
      const dx = W.x - b.x, dz = W.z - b.z, d = Math.hypot(dx, dz), rr = b.r + 0.35;
      if (d < rr && d > 1e-4) { W.x = b.x + dx / d * rr; W.z = b.z + dz / d * rr; }
    }
    if (o.bound) { const d = Math.hypot(W.x - o.bound.x, W.z - o.bound.z); if (d > o.bound.r) { W.x = o.bound.x + (W.x - o.bound.x) / d * o.bound.r; W.z = o.bound.z + (W.z - o.bound.z) / d * o.bound.r; } }
    W.y = o.height(W.x, W.z, W.y);
    W.speed = Math.hypot(W.vx, W.vz);
    if (W.speed > 0.3) { const ty = Math.atan2(W.vx, W.vz); let d = ty - W.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); W.yaw += d * Math.min(1, dt * 12); }
  };
  let dispY = null, lastT = 0;
  W.draw = (a, obj) => {
    let dy = W.yaw - W.pyaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const now = performance.now(), ddt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0; lastT = now;
    const ty = W.py + (W.y - W.py) * a;                         // 땅 높이 그대로 따라가면 계단·땅 결에서 몸·카메라가 덜컹 → 멀미(11-01 교사)
    dispY = dispY == null || Math.abs(ty - dispY) > 1.2 ? ty : dispY + (ty - dispY) * Math.min(1, ddt * 14);
    obj.position.set(W.px + (W.x - W.px) * a, dispY, W.pz + (W.z - W.pz) * a);
    obj.rotation.x = 0; obj.rotation.z = 0; obj.rotation.y = W.pyaw + dy * a;   // 비행·배가 남긴 몸 기울기는 걷기에서 바로 세움
  };
  return W;
}

/* 뒤따르는 카메라 — 끌기·두 손가락으로 둘러보기 · 놓으면 1.5초 뒤 등 뒤로 천천히 돌아옴 · 땅 아래로 안 내려감 */
export function createFollowCam(camera, height, opt = {}) {   // opt = { collide, ceil }
  /* TPS(11-01 교사): 거리 4.6 · 어깨 너머(오른쪽 0.45m) · 마우스 잠금 중엔 저절로 등 뒤로 돌지 않음(마우스가 카메라 주인) · 잠그지 않은 키보드만 놀이는 예전처럼 돌아옴 */
  const C = { yaw: 0, pitch: 0.22, dist: 4.6, idle: 9, x: 0, y: 0, z: 0, init: false, collide: opt.collide || null, ceil: opt.ceil ?? Infinity, lift: 1.5, shoulder: 0.45, locked: false };
  const tgt = new THREE.Vector3();
  C.step = (dt, I, W) => {
    const lk = I.look();
    C.locked = !!(I.locked && I.locked());
    if (Math.abs(lk.x) + Math.abs(lk.y) > 0.01) { C.yaw -= lk.x * 0.006; C.pitch = Math.max(-0.35, Math.min(1.1, C.pitch + lk.y * 0.004)); C.idle = 0; }
    else C.idle += dt;
    if (!C.locked && C.idle > 1.5 && W.speed > 0.5) { let d = (W.yaw + Math.PI) - C.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); C.yaw += d * Math.min(1, dt * 1.6); }
  };
  C.draw = (dt, obj) => {
    const rx = Math.cos(C.yaw) * C.shoulder, rz = -Math.sin(C.yaw) * C.shoulder;   // 화면 오른쪽 = (cos, −sin) — 사람은 화면 왼쪽 가운데
    tgt.set(obj.position.x + rx, obj.position.y + C.lift, obj.position.z + rz);
    let dd = C.dist;
    if (C.collide) { const fx = tgt.x + Math.sin(C.yaw) * Math.cos(C.pitch) * dd, fz = tgt.z + Math.cos(C.yaw) * Math.cos(C.pitch) * dd, k = C.collide.cut(tgt.x, tgt.z, fx, fz); if (k < 1) dd = Math.max(1.2, dd * k - 0.4); }
    const cx = tgt.x + Math.sin(C.yaw) * Math.cos(C.pitch) * dd, cz = tgt.z + Math.cos(C.yaw) * Math.cos(C.pitch) * dd;
    let cy = tgt.y + Math.sin(C.pitch) * dd; cy = Math.min(C.ceil - 0.4, Math.max(cy, height(cx, cz, obj.position.y) + 0.6));
    if (!C.init) { C.x = cx; C.y = cy; C.z = cz; C.init = true; }
    const k = Math.min(1, dt * (C.locked ? 22 : 10)), ky = Math.min(1, dt * 5); C.x += (cx - C.x) * k; C.y += (cy - C.y) * ky; C.z += (cz - C.z) * k;   // 옆은 늦지 않게 · 위아래는 천천히(멀미 줄이기)
    camera.position.set(C.x, C.y, C.z); camera.lookAt(tgt);
  };
  C.moveYaw = () => C.yaw + Math.PI;                             // 걷기 방향 기준(카메라가 보는 쪽)
  return C;
}
