// 걷는 사람(플레이어) — 카메라 기준 방향으로 걷기 · Shift 살금살금(켜고 끄기) · 땅 높이 따라 · 원기둥 장애물 밀어내기 · 위치는 걸음마다(60Hz) · 그리기는 보간
import * as THREE from 'three';

export function createWalker(o) {               // o = { height(x,z), blockers: [{x,z,r}], x, z, yaw }
  const W = { x: o.x || 0, z: o.z || 0, y: 0, yaw: o.yaw || 0, vx: 0, vz: 0, speed: 0, low: false, px: 0, pz: 0, py: 0, pyaw: 0, roll: 0, rollT: 0 };
  W.y = o.height(W.x, W.z);
  W.step = (dt, I, camYaw) => {
    W.px = W.x; W.pz = W.z; W.py = W.y; W.pyaw = W.yaw;
    if (I.tap('low')) W.low = !W.low;                              // 켜고 끄기(누르고 있기 X — 1학년)
    const f = I.axis('back', 'fwd'), r = I.axis('left', 'right');
    let mx = Math.sin(camYaw) * f - Math.cos(camYaw) * r, mz = Math.cos(camYaw) * f + Math.sin(camYaw) * r;   // 앞 = (sin, cos) · 오른쪽 = (−cos, sin)
    const m = Math.hypot(mx, mz);
    const top = W.low ? 1.6 : 4.2;
    if (W.rollT > 0) { W.rollT -= dt; mx = Math.sin(W.yaw); mz = Math.cos(W.yaw); }
    else if (I.tap('jump') && m > 0.1 && W.roll <= 0) { W.rollT = 0.45; W.roll = 1.0; }   // 구르기: 1초에 한 번
    W.roll = Math.max(0, W.roll - dt);
    const sp = W.rollT > 0 ? 7.5 : (m > 0.1 ? top : 0);
    const tvx = m > 0.1 ? mx / Math.max(1, m) * sp : 0, tvz = m > 0.1 ? mz / Math.max(1, m) * sp : 0;
    const acc = Math.min(1, dt * (m > 0.1 ? 10 : 14));
    W.vx += (tvx - W.vx) * acc; W.vz += (tvz - W.vz) * acc;
    W.x += W.vx * dt; W.z += W.vz * dt;
    for (const b of o.blockers || []) {                            // 원기둥 밀어내기
      const dx = W.x - b.x, dz = W.z - b.z, d = Math.hypot(dx, dz), rr = b.r + 0.35;
      if (d < rr && d > 1e-4) { W.x = b.x + dx / d * rr; W.z = b.z + dz / d * rr; }
    }
    if (o.bound) { const d = Math.hypot(W.x - o.bound.x, W.z - o.bound.z); if (d > o.bound.r) { W.x = o.bound.x + (W.x - o.bound.x) / d * o.bound.r; W.z = o.bound.z + (W.z - o.bound.z) / d * o.bound.r; } }
    W.y = o.height(W.x, W.z);
    W.speed = Math.hypot(W.vx, W.vz);
    if (W.speed > 0.3) { const ty = Math.atan2(W.vx, W.vz); let d = ty - W.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); W.yaw += d * Math.min(1, dt * 12); }
  };
  W.draw = (a, obj) => {
    let dy = W.yaw - W.pyaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    obj.position.set(W.px + (W.x - W.px) * a, W.py + (W.y - W.py) * a, W.pz + (W.z - W.pz) * a);
    obj.rotation.y = W.pyaw + dy * a;
  };
  return W;
}

/* 뒤따르는 카메라 — 끌기·두 손가락으로 둘러보기 · 놓으면 1.5초 뒤 등 뒤로 천천히 돌아옴 · 땅 아래로 안 내려감 */
export function createFollowCam(camera, height) {
  const C = { yaw: 0, pitch: 0.28, dist: 6.5, idle: 9, x: 0, y: 0, z: 0, init: false };
  const tgt = new THREE.Vector3();
  C.step = (dt, I, W) => {
    const lk = I.look();
    if (Math.abs(lk.x) + Math.abs(lk.y) > 0.01) { C.yaw -= lk.x * 0.006; C.pitch = Math.max(-0.1, Math.min(1.1, C.pitch + lk.y * 0.004)); C.idle = 0; }
    else C.idle += dt;
    if (C.idle > 1.5 && W.speed > 0.5) { let d = (W.yaw + Math.PI) - C.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); C.yaw += d * Math.min(1, dt * 1.6); }
  };
  C.draw = (dt, obj) => {
    tgt.set(obj.position.x, obj.position.y + 1.3, obj.position.z);
    const cx = tgt.x + Math.sin(C.yaw) * Math.cos(C.pitch) * C.dist, cz = tgt.z + Math.cos(C.yaw) * Math.cos(C.pitch) * C.dist;
    let cy = tgt.y + Math.sin(C.pitch) * C.dist; cy = Math.max(cy, height(cx, cz) + 0.6);
    if (!C.init) { C.x = cx; C.y = cy; C.z = cz; C.init = true; }
    const k = Math.min(1, dt * 8); C.x += (cx - C.x) * k; C.y += (cy - C.y) * k; C.z += (cz - C.z) * k;
    camera.position.set(C.x, C.y, C.z); camera.lookAt(tgt);
  };
  C.moveYaw = () => C.yaw + Math.PI;                             // 걷기 방향 기준(카메라가 보는 쪽)
  return C;
}
