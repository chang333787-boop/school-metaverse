// 비행(탑뷰) — 위에서 내려다본 바다 위를 투슬리스 + 히컵이 남 · 화면은 돌지 않음(멀미 X) · 몸만 기욺
// 달리기(run): 앞(화면 위)으로는 저절로 · ←→ 옆으로 · ↑↓ 빠르게·느리게 · Space 꾹 = 꼬리 펴기(옆으로 빨리 꺾임 = 히컵 몫 · 둘이 함께) · F = 쏘기
// 싸움터(arena): 앞으로 저절로 X · 방향키 8방향 · F = 위(대장 쪽)로 쏘기
// 돌기둥에 박으면 바다에 풍덩 → 1초 뒤 지난 점검 자리에서 다시(쉬움 = 튕기기만) · 1m 안으로 스치면 바람 + 덤 빠르기 · 구름 속 = 숨음
export function createFlight(x, y, o = {}) {
  return {
    x, y, vx: 0, vy: -(o.speed || 10), base: o.speed || 10, tail: 0, cool: 0, splashT: 0, invT: 0, hidden: false, z: o.z ?? 3, tilt: 0,
    hits: 0, falls: 0, grazes: 0, shots: 0, rider: o.rider || 'hiccup', fin: o.fin || 'new', assist: !!o.assist, arena: o.arena || null, lane: o.lane || null,
    ob: [], onShoot: null, cam: 'fly', checkY: y, kind: o.kind || 'toothless',
  };
}
export function addStack(Fl, x, y, r = 1.3, o = {}) { const s = Object.assign({ k: 'stack', x, y, r, hitR: 0 }, o); Fl.ob.push(s); return s; }
export function addCloud(Fl, x, y, w, h) { const c = { k: 'cloud', x, y, w, h }; Fl.ob.push(c); return c; }

const R = 0.8;
export function stepFlight(Fl, I, dt, diff, sfx) {
  const easy = diff === 'easy', hard = diff === 'hard';
  Fl.tail += ((easy || I.down.jump ? 1 : 0) - Fl.tail) * Math.min(1, dt * 10);
  let hx = Fl.lockH ? 0 : I.dir(), hy = Fl.lockV ? 0 : -I.vdir();
  if (Fl.splashT > 0) {                                      // 풍덩 → 1초 뒤 다시
    Fl.splashT -= dt; Fl.z = Math.max(-0.5, Fl.z - dt * 6);
    if (Fl.splashT <= 0) { Fl.z = 3; Fl.invT = 1.5; if (!Fl.arena) { Fl.y = Math.max(Fl.y, Fl.checkY); Fl.x = Fl.lane ? (Fl.lane[0] + Fl.lane[1]) / 2 : Fl.x; } }
    return;
  }
  if (Fl.arena) {
    const n = Math.hypot(hx, hy) || 1, sp = 7.5 + Fl.tail * 1.5;
    Fl.vx += (hx / n * sp - Fl.vx) * Math.min(1, dt * 7); Fl.vy += (hy / n * sp - Fl.vy) * Math.min(1, dt * 7);
  } else {
    /* 쉬움 도움 — 바로 앞 돌기둥이면 옆으로 살짝(떨어지지 않게만) */
    let assist = 0;
    if (Fl.assist || easy) for (const o of Fl.ob) { if (o.k !== 'stack') continue; const ahead = Fl.y - o.y; if (ahead > 0 && ahead < 9 && Math.abs(Fl.x - o.x) < o.r + R + 0.6) assist += Fl.x >= o.x ? 1 : -1; }
    const side = 5 + Fl.tail * 3.5;
    Fl.vx += ((hx + assist * (easy ? 0.9 : 0.5)) * side - Fl.vx) * Math.min(1, dt * (4 + Fl.tail * 6));
    const tgt = Fl.base - hy * 3 + (Fl.boostT > 0 ? 3 : 0);
    Fl.vy += (-tgt - Fl.vy) * Math.min(1, dt * 2.5);
  }
  if (Fl.boostT > 0) Fl.boostT -= dt;
  Fl.x += Fl.vx * dt; Fl.y += Fl.vy * dt;
  if (Fl.arena) { const a = Fl.arena; Fl.x = Math.max(a[0], Math.min(a[2], Fl.x)); Fl.y = Math.max(a[1], Math.min(a[3], Fl.y)); }
  if (Fl.lane) { const L = Fl.lane; if (Fl.x < L[0]) { Fl.x = L[0]; Fl.vx = Math.max(0, Fl.vx); } if (Fl.x > L[1]) { Fl.x = L[1]; Fl.vx = Math.min(0, Fl.vx); } }
  Fl.tilt += (Math.max(-0.5, Math.min(0.5, Fl.vx * 0.07)) - Fl.tilt) * Math.min(1, dt * 8);
  if (Fl.invT > 0) Fl.invT -= dt;
  /* 돌기둥 · 구름 */
  Fl.hidden = false;
  for (const o of Fl.ob) {
    if (o.k === 'cloud') { if (Math.abs(Fl.x - o.x) < o.w / 2 && Math.abs(Fl.y - o.y) < o.h / 2) Fl.hidden = true; continue; }
    const d = Math.hypot(Fl.x - o.x, (Fl.y - o.y) * 1.2);
    if (d < o.r + R * 0.7 && Fl.invT <= 0) {
      Fl.hits++; o.hitR = 1; Fl.lastHit = o; sfx && sfx.play('thud', { x: Fl.x });
      if (easy || Fl.arena) { Fl.invT = 0.9; const n = d || 1; Fl.vx = (Fl.x - o.x) / n * 6; Fl.vy *= 0.5; }
      else { Fl.falls++; Fl.splashT = 1; sfx && sfx.play('splash', { x: Fl.x }); return; }
    } else if (d < o.r + R + 1.0 && !o.grazed && Fl.invT <= 0 && !Fl.arena) { o.grazed = true; Fl.grazes++; Fl.boostT = 0.8; sfx && sfx.play('whoosh', { x: Fl.x }); }
    if (o.hitR > 0) o.hitR -= dt * 3;
  }
  if (Fl.cool > 0) Fl.cool -= dt;
  if (I.pressed.use && Fl.cool <= 0 && !Fl.noShoot) { Fl.cool = 0.55; Fl.shots++; Fl.onShoot && Fl.onShoot(Fl); }
  if (Fl.ob.length > 60) Fl.ob = Fl.ob.filter((o) => o.y < Fl.y + 30);
}
export function poseOfFlight(Fl, t) {
  return { flap: (t * 1.3) % 1, fin: Fl.fin, rider: Fl.rider, saddle: 1, wing: 1, glow: Fl.glow || 0 };
}
