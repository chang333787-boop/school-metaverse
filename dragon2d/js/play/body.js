// 히컵 몸 — 탑뷰(포켓몬식) 걷기: 방향키·WASD 8방향 · Shift 달리기 7.5 · X = 그 차례 동작(점프 = 피하기 · 누르고 있는 동안 살금살금 1.6)
// 손에 붙게(교사 11-02 '즉시 서고 가기 · 벽에 걸리지 않게'): 서고 가기 0.05초(가속 50/초 · 멈춤 60/초) · 대각선도 같은 빠르기 · 벽은 축마다 막아 미끄러짐 · 모서리에 걸리면 옆으로 슬쩍 비켜 감 · 점프 미리 누름 0.12초
// 점프 = 피하기(높이 0.85m · 0.52초) · 내려앉고 0.45초 안에 또 뛰면 낮은 콩 뛰기(피하기 X · 연타 막기 = design §1)
export const FEEL = { walk: 4.2, run: 7.5, sneak: 1.6, acc: 50, stop: 60, g: 25.1, jv: 6.53, hop: 3.9, buffer: 0.12, mash: 0.45, r: 0.3 };

export function createBody(x = 2, y = 2) {
  return {
    x, y, z: 0, vx: 0, vy: 0, vz: 0, fx: 0, fy: 1, dir: 'down', flip: 1, ground: true, air: false, dodge: false, hop: false, sneak: false,
    walk: 0, speed: 0, crouch: 0, hand: 0, look: 0, carry: null, helmet: 0, hurt: 0, hurtT: 0, sit: 0, peg: 0,
    landT: 9, jumpBuf: 0, lock: false, who: 'hiccup', cam: 'walk', moved: 0, hits: 0,
  };
}

/* 걸음 — I(입력) · W(장소: move = 벽 막기) */
export function stepBody(P, I, W, dt) {
  const F = FEEL, free = !P.lock && P.hurtT <= 0;
  let dx = free ? I.dir() : 0, dy = free ? -I.vdir() : 0;
  const n = Math.hypot(dx, dy); if (n > 0) { dx /= n; dy /= n; }
  P.sneak = free && I.down.sneak;                              /* X를 누르고 있는 동안만(켜고 끄기 X — 상태를 잊지 않게) */
  P.crouch += ((P.sneak && P.z <= 0 ? 1 : 0) - P.crouch) * Math.min(1, dt * 14);
  P.hand += ((P.handLock || 0) - P.hand) * Math.min(1, dt * 10);
  const top = P.sneak ? F.sneak : I.down.run ? F.run : F.walk;
  const tx = dx * top, ty = dy * top;
  const sp = Math.hypot(P.vx, P.vy), k = 1 - Math.exp(-((top * n > sp + 0.01) ? F.acc : F.stop) * dt);
  P.vx += (tx - P.vx) * (P.z > 0 ? k * 0.6 : k); P.vy += (ty - P.vy) * (P.z > 0 ? k * 0.6 : k);
  if (n) { P.fx = dx; P.fy = dy; P.dir = Math.abs(dx) > Math.abs(dy) * 0.85 ? 'side' : dy < 0 ? 'up' : 'down'; if (Math.abs(dx) > 0.2) P.flip = dx > 0 ? 1 : -1; }
  /* 점프(높이 z) */
  P.jumpBuf = I.pressed.jump && free ? F.buffer : Math.max(0, P.jumpBuf - dt);
  P.landT += dt;
  if (P.jumpBuf > 0 && P.z <= 0 && !P.noJump && free) {
    const low = P.landT < F.mash;
    P.vz = low ? F.hop : F.jv; P.hop = low; P.jumpBuf = 0; P.z = 0.001; P.jumped = (P.jumped || 0) + 1;
  }
  if (P.z > 0) {
    if (!I.down.jump && P.vz > 3 && !P.hop) P.vz *= Math.exp(-dt * 9);
    P.vz -= F.g * dt; P.z += P.vz * dt;
    if (P.z <= 0) { P.z = 0; P.vz = 0; P.landT = 0; P.hop = false; }
  }
  /* 옮기기(벽 막기 — 축마다) · 문(gate 상자) */
  const ox = P.x, oy = P.y;
  W.move(P, P.x + P.vx * dt, P.y + P.vy * dt, F.r);
  /* 모서리 비키기 — 한 축으로 밀었는데 막혔으면 옆으로 0.45m 안에 빈 곳을 찾아 슬쩍(젤다처럼 모서리에 안 걸림) */
  if (n && Math.hypot(P.x - ox, P.y - oy) < top * dt * 0.2) {
    const sx = Math.abs(dx) >= Math.abs(dy), step = top * dt;
    corner: for (const off of [0.15, 0.3, 0.45]) for (const sg of [1, -1]) {
      const tx2 = sx ? P.x + Math.sign(dx) * step : P.x + sg * off, ty2 = sx ? P.y + sg * off : P.y + Math.sign(dy) * step;
      if (!W.blocked(tx2, ty2, F.r, P.z)) { const m = Math.min(step * 0.8, off); if (sx) W.move(P, P.x, P.y + sg * m, F.r); else W.move(P, P.x + sg * m, P.y, F.r); break corner; }
    }
  }
  if (P.gate) { const g = P.gate; P.x = Math.max(g[0], Math.min(g[2], P.x)); P.y = Math.max(g[1], Math.min(g[3], P.y)); }
  const mv = Math.hypot(P.x - ox, P.y - oy); P.moved += mv;
  if (dt > 0) { const rv = mv / dt; if (rv < Math.hypot(P.vx, P.vy) * 0.3) { P.vx *= 0.5; P.vy *= 0.5; } }
  P.air = P.z > 0; P.ground = !P.air; P.dodge = P.air && !P.hop;
  P.speed = Math.min(1, Math.hypot(P.vx, P.vy) / F.run * 1.25);
  P.walk = (P.walk + Math.hypot(P.vx, P.vy) * dt / 1.6) % 1;
  if (P.hurtT > 0) { P.hurtT -= dt; P.hurt = Math.min(1, P.hurtT * 3); } else P.hurt = 0;
}

/* 맞음 — 밀려남(맞은 쪽 반대로) · 보통 = 넘어짐(일어나는 시간) · 쉬움 = 안 넘어짐 */
export function hitBody(P, ux, uy, diff, power = 1) {
  if (P.hurtT > 0.2) return false;
  const n = Math.hypot(ux, uy) || 1;
  P.vx = ux / n * 6 * power; P.vy = uy / n * 6 * power; P.vz = 3.5; P.z = 0.001; P.hop = true;
  P.hurtT = diff === 'easy' ? 0.35 : diff === 'hard' ? 1.6 : 1.1;
  P.hits++;
  return true;
}
export function poseOf(P) {
  return { dir: P.dir, walk: P.walk, speed: P.speed, z: P.z, air: P.air ? 1 : 0, crouch: P.crouch, hand: P.hand, look: P.look, carry: P.carry, helmet: P.helmet, hurt: P.hurt, sit: P.sit, peg: P.peg, talk: P.talk || 0 };
}
