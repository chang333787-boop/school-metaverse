// 원소 · 이펙트(탑뷰) — 원인 규칙에서만 나옴(design §3-2): 불 → 바람 쪽으로 번짐 · 물 → 꺼짐 + 김 · 가스 + 불티 = 펑 · 맞음 = 흙먼지
// 평면 x·y + 높이 z(화면에선 위로 z만큼) · 손그림 결: 먹선 두른 납작한 불꽃·연기(빛 번짐 X) · 풀 하나(고정 배열) · 화면 밖은 안 그림
const N = 420;
const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N), pvx = new Float32Array(N), pvy = new Float32Array(N), pvz = new Float32Array(N), pl = new Float32Array(N), pm = new Float32Array(N), ps = new Float32Array(N), pk = new Uint8Array(N);
const K = { flame: 1, smoke: 2, steam: 3, drop: 4, spark: 5, dust: 6, gas: 7, plasma: 8, ember: 9, bubble: 10, leaf: 11 };
let head = 0;
export function puff(kind, x, y, z = 0, vx = 0, vy = 0, vz = 0, life = 1, size = 0.3) {
  const i = head; head = (head + 1) % N;
  px[i] = x; py[i] = y; pz[i] = z; pvx[i] = vx; pvy[i] = vy; pvz[i] = vz; pl[i] = life; pm[i] = life; ps[i] = size; pk[i] = K[kind] || 2;
}
export function burst(kind, x, y, z, n, sp = 2, life = 0.8, size = 0.25, rnd = Math.random) {
  for (let i = 0; i < n; i++) { const a = rnd() * 6.283, s = sp * (0.4 + rnd() * 0.6); puff(kind, x, y, z, Math.cos(a) * s, Math.sin(a) * s * 0.6, sp * (0.3 + rnd() * 0.5), life * (0.6 + rnd() * 0.5), size * (0.7 + rnd() * 0.6)); }
}
export const FX = {
  shots: [],     // { kind, x, y, z, vx, vy, vz, g, r, life, mine, hit(s)→bool, land(s) }
  fires: [],     // { x, y(앞 밑변), w, h(지붕 높이), d(깊이), burn 0..1, next, spread()→이웃, prop }
  wind: [0, 0],  // 바람(평면) — 불 번짐·연기 흐름
};
export function clearFx() { pl.fill(0); FX.shots.length = 0; FX.fires.length = 0; FX.wind = [0, 0]; }
export function shoot(o) { const s = Object.assign({ z: 1, vz: 0, g: 9.8, r: 0.3, life: 4, t: 0 }, o); FX.shots.push(s); return s; }

export function stepFx(dt, W, rnd = Math.random) {
  for (let i = FX.shots.length - 1; i >= 0; i--) {
    const s = FX.shots[i];
    s.t += dt; s.vz -= s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.life -= dt;
    if (s.kind === 'water' && rnd() < 0.5) puff('drop', s.x, s.y, s.z, 0, 0, -1, 0.3, 0.08);
    if (s.kind === 'plasma' && rnd() < 0.7) puff('plasma', s.x, s.y, s.z, 0, 0, 0, 0.18, 0.2);
    if ((s.kind === 'lava' || s.kind === 'fire') && rnd() < 0.5) puff('ember', s.x, s.y, s.z, 0, 0, 0.6, 0.4, 0.1);
    let dead = s.life <= 0;
    if (!dead && s.hit && s.hit(s)) dead = true;
    if (!dead && s.z <= 0 && s.g > 0) {
      if (s.bounce) { s.z = 0; s.vz = s.bounce; puff('dust', s.x, s.y, 0, 0, 0, 0.4, 0.4, 0.2); }
      else { dead = true; s.land && s.land(s); landFx(s); }
    }
    if (!dead && W && s.wall !== false && s.z < 1.2 && W.blocked(s.x, s.y, 0.1, s.z) && !s.noWall) { dead = true; landFx(s); }
    if (dead) FX.shots.splice(i, 1);
  }
  for (const f of FX.fires) {
    if (f.burn <= 0) continue;
    f.burn = Math.min(1, f.burn + dt * (f.grow ?? 0.035));
    if (f.burn > 0.55) { f.next -= dt; if (f.next <= 0 && f.spread) { f.next = 99; const nb = f.spread(); if (nb && nb.burn <= 0 && !nb.saved && !nb.lost) { nb.burn = 0.08; nb.next = nb.delay || 6; } } }
    if (rnd() < dt * 8 * f.burn) puff('smoke', f.x + (rnd() - 0.5) * f.w * 0.6, f.y - f.d * 0.5, f.h, FX.wind[0] * 0.6, FX.wind[1] * 0.6, 0.9, 2.2, 0.45);
    if (f.prop) { f.prop.o.burn = f.burn; f.prop.o.scorch = Math.max(f.prop.o.scorch || 0, f.burn * 0.8); }
  }
  for (let i = 0; i < N; i++) {
    if (pl[i] <= 0) continue;
    pl[i] -= dt; const k = pk[i];
    if (k === K.drop) pvz[i] -= 9.8 * dt;
    else if (k === K.smoke || k === K.steam || k === K.gas) { pvx[i] += (FX.wind[0] * 0.5 - pvx[i]) * dt; pvy[i] += (FX.wind[1] * 0.5 - pvy[i]) * dt; ps[i] += dt * 0.35; }
    else if (k === K.flame) { pvz[i] += 1.5 * dt; ps[i] *= 1 - dt * 1.4; }
    else if (k === K.bubble) { pvz[i] = 1.2; pvx[i] = Math.sin(pl[i] * 9) * 0.3; }
    px[i] += pvx[i] * dt; py[i] += pvy[i] * dt; pz[i] = Math.max(0, pz[i] + pvz[i] * dt);
  }
}
function landFx(s) {
  if (s.kind === 'water') burst('drop', s.x, s.y, 0.1, 6, 2, 0.4, 0.08);
  else if (s.kind === 'lava' || s.kind === 'fire') { burst('ember', s.x, s.y, 0.1, 5, 2, 0.6, 0.1); burst('smoke', s.x, s.y, 0.2, 2, 0.6, 1.2, 0.35); }
  else if (s.kind === 'plasma') burst('spark', s.x, s.y, s.z, 6, 3, 0.4, 0.1);
  else burst('dust', s.x, s.y, 0.1, 4, 1.5, 0.5, 0.2);
}
/* 물이 불에 닿음 → 꺼짐 + 김(원소 규칙) */
export function douse(f, k = 0.5) { f.burn = Math.max(0, f.burn - k); for (let i = 0; i < 6; i++) puff('steam', f.x + (Math.random() - 0.5) * f.w * 0.7, f.y - f.d * 0.5, f.h, 0, 0, 1.1, 1.4, 0.35); if (f.burn <= 0.02) { f.burn = 0; f.saved = true; } }
/* 물 떨어진 자리가 지붕 위(발자국 사각) 안인가 */
export const onRoof = (f, x, y) => Math.abs(x - f.x) < f.w / 2 && y < f.y + 0.3 && y > f.y - f.d - 0.3;

const INK = '#2b2118';
function flame(ctx, x, y, s, t, hot) {
  const f = 1 + Math.sin(t * 13 + x * 3) * 0.12;
  ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.quadraticCurveTo(x - s * 0.55, y - s * 0.9 * f, x, y - s * 1.6 * f); ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.9 * f, x + s * 0.5, y); ctx.closePath();
  ctx.fillStyle = hot ? '#f6c24a' : '#e9772e'; ctx.fill(); ctx.stroke();
  if (!hot) { ctx.beginPath(); ctx.moveTo(x - s * 0.22, y); ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.6 * f, x, y - s * 0.95 * f); ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.6 * f, x + s * 0.22, y); ctx.fillStyle = '#f6c24a'; ctx.fill(); }
}
/* 쏜 것 그림자(땅) — 높이가 보이게 · 맞을 자리 읽기 */
export function drawShotShadows(V) {
  const ctx = V.ctx; V.at(0, 0); ctx.fillStyle = 'rgba(30,24,20,.28)';
  for (const s of FX.shots) { if (!V.onScreen(s.x, s.y) || s.noShadow) continue; const r = Math.max(0.12, (s.r || 0.25) * (1 - Math.min(0.6, s.z * 0.08))); ctx.beginPath(); ctx.ellipse(s.x, s.y, r, r * 0.5, 0, 0, 7); ctx.fill(); }
}
export function drawFx(V, t) {
  const ctx = V.ctx; V.at(0, 0);
  ctx.lineWidth = 0.035; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const f of FX.fires) {
    if (f.burn <= 0 || !V.onScreen(f.x, f.y)) continue;
    const n = Math.max(1, Math.round(f.burn * 5)), sz = 0.45 + f.burn * 0.6;
    for (let i = 0; i < n; i++) { const fx = f.x - f.w * 0.38 + (i + 0.5) * (f.w * 0.76 / n), fy = f.y - f.h - f.d * 0.35 + ((i * 7) % 3) * 0.3; flame(ctx, fx, fy, sz * (0.8 + ((i * 37) % 5) * 0.08), t, false); }
  }
  for (const s of FX.shots) {
    if (!V.onScreen(s.x, s.y)) continue;
    const x = s.x, y = s.y - s.z, ang = Math.atan2(s.vy - s.vz, s.vx);
    if (s.kind === 'water') { ctx.fillStyle = '#7fb0c8'; ctx.beginPath(); ctx.ellipse(x, y, 0.24, 0.18, ang, 0, 7); ctx.fill(); ctx.stroke(); }
    else if (s.kind === 'bola') { const a = s.t * 14; ctx.strokeStyle = '#8a6a3a'; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 0.4, y + Math.sin(a) * 0.4); ctx.lineTo(x - Math.cos(a) * 0.4, y - Math.sin(a) * 0.4); ctx.stroke(); ctx.strokeStyle = INK; ctx.fillStyle = '#8d8a82'; for (const sg of [1, -1]) { ctx.beginPath(); ctx.arc(x + Math.cos(a) * 0.4 * sg, y + Math.sin(a) * 0.4 * sg, 0.12, 0, 7); ctx.fill(); ctx.stroke(); } }
    else if (s.kind === 'plasma') { ctx.fillStyle = '#8a7ad8'; ctx.beginPath(); ctx.ellipse(x, y, 0.45, 0.24, ang, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d8d0f4'; ctx.beginPath(); ctx.ellipse(x, y, 0.18, 0.09, ang, 0, 7); ctx.fill(); }
    else if (s.kind === 'lava') { ctx.fillStyle = '#d0582a'; ctx.beginPath(); ctx.arc(x, y, s.r, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f2a63a'; ctx.beginPath(); ctx.arc(x - s.r * 0.25, y - s.r * 0.25, s.r * 0.45, 0, 7); ctx.fill(); }
    else if (s.kind === 'fire') flame(ctx, x, y + 0.3, s.r * 1.6, t, false);
    else if (s.kind === 'spike') { ctx.fillStyle = '#e2c35a'; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(s.vy, s.vx)); ctx.beginPath(); ctx.moveTo(0.38, 0); ctx.lineTo(-0.3, -0.09); ctx.lineTo(-0.3, 0.09); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    else if (s.kind === 'fish' || s.kind === 'eel') { ctx.fillStyle = s.kind === 'eel' ? '#5a6a3a' : '#b7c2bf'; ctx.beginPath(); ctx.ellipse(x, y, 0.3, 0.12, s.t * 8, 0, 7); ctx.fill(); ctx.stroke(); }
  }
  const hw = V.halfW() + 2, hh = V.halfH() + 3, cx = V.cam.x, cy = V.cam.y;
  for (let i = 0; i < N; i++) {
    if (pl[i] <= 0 || Math.abs(px[i] - cx) > hw || Math.abs(py[i] - cy) > hh) continue;
    const k = pk[i], a = pl[i] / pm[i], x = px[i], y = py[i] - pz[i], s = ps[i];
    if (k === K.smoke || k === K.steam || k === K.gas || k === K.dust) {
      ctx.globalAlpha = Math.min(1, a * (k === K.steam ? 0.8 : 0.75));
      ctx.fillStyle = k === K.smoke ? '#6a6460' : k === K.steam ? '#eef0ec' : k === K.gas ? '#9ac46a' : '#b8a07a';
      ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
    } else if (k === K.flame) { ctx.globalAlpha = Math.min(1, a * 1.5); flame(ctx, x, y, s, t, a < 0.4); }
    else if (k === K.drop) { ctx.globalAlpha = 1; ctx.fillStyle = '#7fb0c8'; ctx.fillRect(x - s / 2, y - s / 2, s, s * 1.4); }
    else if (k === K.spark || k === K.ember) { ctx.globalAlpha = Math.min(1, a * 1.4); ctx.fillStyle = k === K.spark ? '#f6d26a' : '#f2a63a'; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
    else if (k === K.plasma) { ctx.globalAlpha = a; ctx.fillStyle = '#a89ae4'; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); }
    else if (k === K.bubble) { ctx.globalAlpha = Math.min(1, a * 2); ctx.strokeStyle = '#e8f4f8'; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.stroke(); ctx.strokeStyle = INK; }
    else if (k === K.leaf) { ctx.globalAlpha = a; ctx.fillStyle = '#7a8a4a'; ctx.fillRect(x, y, s, s * 0.5); }
  }
  ctx.globalAlpha = 1;
}
export function fxCount() { let n = 0; for (let i = 0; i < N; i++) if (pl[i] > 0) n++; return n; }
