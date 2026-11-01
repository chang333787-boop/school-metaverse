// 「버크의 드래곤 친구」 2D판 — 포켓몬식 탑뷰 모험(Canvas 2D · 빌드 없음 · 외부 네트워크 0) · 교사 11-01 '2D 말고 포켓몬처럼 탑뷰'
// 3D판(dragon/)의 이야기·대사·장 순서·느낀 점 장치를 그대로 옮김 · 조작 = 메타버스와 같은 손(방향키·WASD · Shift 달리기 · Space 점프 · F 쓰기 · C 살금살금)
// 주소: ?ch=&step=&diff=easy|normal|hard&grade= · ?chain=0(장 하나만) · ?turbo=N · ?bot=easy|normal · ?seed= · ?bench=1
import { createView, startLoop, IS_CB } from './core/view.js?v=1';
import { createInput } from './core/input.js?v=1';
import { createSfx } from './core/sfx.js?v=1';
import { createHud } from './ui/hud.js?v=1';
import { createBook } from './ui/book.js?v=1';
import { showTitle, diffOf } from './ui/title.js?v=1';
import { showEnding } from './ui/ending.js?v=1';
import { readSlot } from './story/save.js?v=1';
import { createRunner, LAST_CH } from './story/runner.js?v=1';
import { createCast, drawActor, shadowR } from './play/actors.js?v=1';
import { stepBody, poseOf } from './play/body.js?v=1';
import { stepFlight, poseOfFlight } from './play/flight.js?v=1';
import { stepFx, drawFx, drawShotShadows, FX, fxCount } from './play/fx.js?v=1';
import { drawGround, drawPropAt } from './play/world.js?v=1';
import { drawPerson, drawDragonTop, drawBoss } from './art/actors.js?v=1';
import { drawProp } from './art/scenery.js?v=1';

const Q = new URLSearchParams(location.search);
const canvas = document.getElementById('scene');
const V = createView(canvas);
const I = createInput(canvas);
let seed = +(Q.get('seed') || 0) || (Date.now() % 100000);
const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const G = {
  Q, V, I, rng, t: 0, turbo: +(Q.get('turbo') || 0), diff: 'normal', grade: 0, slot: 0, best: { ch: 0, idx: 0 }, inv: {},
  cast: createCast(), fspots: [], marks: [], flags: {}, mode: 'walk', P: null, Fl: null, W: null, goal: null, camOpt: {}, diag: { errs: [] },
};
window.addEventListener('error', (e) => G.diag.errs.push(String(e.message).slice(0, 200)));
G.hud = createHud();
G.book = createBook(G);
G.sfx = createSfx(G);
G.runner = createRunner(G);
canvas.focus();

/* ── 걸음 ───────────────────────────────────────────────────────────────── */
let bot = null;
function step(dt) {
  G.t += dt;
  if (bot) bot.tick(dt);
  I.poll(dt);
  const P = G.P;
  if (P && G.runner.state === 'run' && !G.book.open) {
    if (G.mode === 'walk') stepBody(P, I, G.W, dt);
    else if (G.mode === 'fly' && G.Fl) stepFlight(G.Fl, I, dt, G.diff, G.sfx);
    P.mashT = Math.max(0, (P.mashT || 0) - dt);
    if (I.pressed.use) { P.useTimes = P.useTimes || []; P.useTimes.push(G.t); while (P.useTimes.length && G.t - P.useTimes[0] > 1.2) P.useTimes.shift(); if (P.useTimes.length >= 5) P.mashT = 1.2; }
  }
  G.marks.length = 0; G.fspots.length = 0;
  if (G.runner.state === 'run' || G.runner.state === 'wait') G.runner.tick(dt);
  G.cast.step(dt);
  stepFx(dt, G.W, rng);
  /* 카메라 — 가는 쪽을 조금 더 · 장소 끝에서 멈춤 */
  if (P && G.W) {
    const o = G.camOpt;
    if (G.mode === 'fly' && G.Fl) { const F = G.Fl; V.follow(o.fixX ?? (F.arena ? (F.arena[0] + F.arena[2]) / 2 : F.x * 0.5 + (o.cx ?? F.x) * 0.5), o.fixY ?? (F.arena ? (F.arena[1] + F.arena[3]) / 2 : F.y - 2.6), dt, { w: F.arena ? 3 : 8 }); }
    else {
      P.lx = (P.lx || 0) + ((P.vx * 0.25) - (P.lx || 0)) * Math.min(1, dt * 2); P.ly = (P.ly || 0) + ((P.vy * 0.2) - (P.ly || 0)) * Math.min(1, dt * 2);
      const tx = o.fixX ?? (o.focus ? (P.x + o.focus[0]) / 2 : P.x + P.lx), ty = o.fixY ?? (o.focus ? (P.y + o.focus[1]) / 2 : P.y - 0.8 + P.ly);
      V.follow(tx, ty, dt, { w: 5, bounds: G.W.bounds });
    }
  }
  G.hud.tick(dt);
  if (G.diff === 'easy' && G.runner.step && G.runner.step.mood) { const d = G.cast.find('toothless'); G.hud.mood(d ? d.pose.pupil : null); }
}

/* ── 그리기 ─────────────────────────────────────────────────────────────── */
const TINT = { night: 'rgba(22,30,64,0.36)', aurora: 'rgba(14,22,44,0.34)', fog: 'rgba(196,202,204,0.22)', sunset: 'rgba(240,140,90,0.10)', storm: 'rgba(60,62,72,0.2)', under: 'rgba(40,120,150,0.26)', dawn: 'rgba(240,200,170,0.08)' };
const INK = '#2b2118';
const items = []; let itemN = 0;
function addItem(y, k, ref) { let it = items[itemN]; if (!it) items[itemN] = it = { y: 0, k: 0, ref: null }; it.y = y; it.k = k; it.ref = ref; itemN++; }
function shadow(ctx, x, y, r, z = 0) { ctx.beginPath(); ctx.ellipse(x, y, r * (1 - Math.min(0.5, z * 0.08)), r * 0.42 * (1 - Math.min(0.5, z * 0.08)), 0, 0, 7); ctx.fill(); }
function draw() {
  const ctx = V.ctx, W = G.W, t = G.t;
  if (!W || !G.P) { V.reset(); ctx.fillStyle = '#1d2730'; ctx.fillRect(0, 0, V.W, V.H); return; }
  drawGround(W, V);
  if (G.drawUnder) G.drawUnder(ctx, V, t);
  let n = 0;
  for (const p of W.props) if (p.flat && !p.hide && V.onScreen(p.x, p.y, 3)) { drawPropAt(V, p, t); n++; }
  /* 그림자(배우·히컵·쏜 것) */
  V.at(0, 0); ctx.fillStyle = 'rgba(30,24,20,.26)';
  for (const a of G.cast.list) if (!a.hide && V.onScreen(a.x, a.y)) shadow(ctx, a.x, a.y, shadowR(a), a.z);
  if (G.mode === 'walk' && !G.P.hide) shadow(ctx, G.P.x, G.P.y, 0.32, G.P.z);
  if (G.Fl) { const F = G.Fl; if (F.splashT <= 0) shadow(ctx, F.x + 1.2, F.y + 1.6, 1.3, 0); for (const o of F.ob) if (o.k === 'cloud' && V.onScreen(o.x, o.y + 3, o.w)) { ctx.fillStyle = 'rgba(30,24,20,.12)'; ctx.beginPath(); ctx.ellipse(o.x + 2, o.y + 3, o.w / 2, o.h / 2, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(30,24,20,.26)'; } }
  drawShotShadows(V);
  /* y 차례 */
  itemN = 0;
  for (const p of W.props) if (!p.flat && !p.over && !p.hide && V.onScreen(p.x, p.y, (p.o.w || 4) / 2 + 3)) addItem(p.y, 0, p);
  for (const a of G.cast.list) if (!a.hide && V.onScreen(a.x, a.y, 6)) addItem(a.y + (a.ySort || 0), 1, a);
  if (G.mode === 'walk' && !G.P.hide) addItem(G.P.y, 2, G.P);
  if (G.Fl) for (const o of G.Fl.ob) if (o.k === 'stack' && V.onScreen(o.x, o.y, o.r + 2)) addItem(o.y, 3, o);
  const list = items.slice(0, itemN).sort((a, b) => a.y - b.y);
  for (const it of list) {
    if (it.k === 0) { drawPropAt(V, it.ref, t); n++; }
    else if (it.k === 1) drawActor(V, it.ref, t);
    else if (it.k === 2) { const P = it.ref; V.at(P.x, P.y, P.dir === 'side' ? P.flip : 1); drawPerson(ctx, P.who, poseOf(P), t); }
    else { const o = it.ref; V.at(o.x, o.y); drawProp(ctx, o.prop || 'seastack', { r: o.r, w: o.r * 2.2, h: o.r * 1.4, hit: o.hitR }, t); }
  }
  if (G.Fl && G.mode === 'fly') {
    const F = G.Fl;
    if (F.splashT <= 0 && !(F.invT > 0 && (t * 10 % 1) < 0.3)) { V.at(F.x, F.y - F.z * 0.4, 1, F.scale || 1); ctx.rotate(F.tilt + (F.rot || 0)); drawDragonTop(ctx, F.kind, Object.assign(poseOfFlight(F, t), G.flyPose || {}), t); }
  }
  if (G.boss && !G.boss.hide) { const B = G.boss; V.at(B.x, B.y, 1, B.scale || 1); if (B.rot) ctx.rotate(B.rot); if (B.alpha != null) ctx.globalAlpha = B.alpha; drawBoss(ctx, B.pose, t); ctx.globalAlpha = 1; }   /* 대장(위에서 본 모습 · 기준 = 주둥이 앞 끝 · rot π = 머리가 아래(남쪽)를 향함) */
  for (const p of W.props) if (p.over && V.onScreen(p.x, p.y - (p.o.d || 0) / 2, 30)) drawPropAt(V, p, t);
  V.reset();
  const st = G.runner.step, tint = TINT[G.tint || (st && st.tint) || W.time] || (W.name === 'under' ? TINT.under : null);
  if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, V.W, V.H); }
  drawFx(V, t);
  if (G.Fl) for (const o of G.Fl.ob) { if (o.k !== 'cloud' || !V.onScreen(o.x, o.y, o.w)) continue; V.at(o.x, o.y); ctx.globalAlpha = G.Fl.hidden && Math.abs(G.Fl.x - o.x) < o.w / 2 && Math.abs(G.Fl.y - o.y) < o.h / 2 ? 0.5 : 0.92; drawProp(ctx, 'cloud', { w: o.w, h: o.h }, t); ctx.globalAlpha = 1; }
  V.stat.items = n;
  if (G.drawOver) G.drawOver(ctx, V, t);
  drawMarks(ctx);
}
/* 표시 — 목표 ▼(화면 밖이면 가장자리 화살표 + 거리) · 쉬움 F 키 · 예고 ! · 점·고리·글 */
function keycap(ctx, x, y, s, label) {
  ctx.fillStyle = '#f4ead2'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x - s / 2, y - s / 2, s * (label.length > 1 ? 1.5 : 1), s * 0.94, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = `700 ${Math.round(s * 0.5)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + (label.length > 1 ? s * 0.25 : 0), y);
}
function drawMarks(ctx) {
  V.reset();
  const k = V.H / 768, g = G.goal;
  if (g && g.x != null) {
    const me = G.Fl || G.P, gy = g.y - (g.h ?? 2.2);
    const x = V.sx(g.x), y = V.sy(gy) + Math.sin(G.t * 4) * 5 * k, m = 34 * k;
    if (x > m && x < V.W - m && y > m && y < V.H - m) {
      ctx.fillStyle = '#e6c464'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5 * k;
      ctx.beginPath(); ctx.moveTo(x - 14 * k, y - 22 * k); ctx.lineTo(x + 14 * k, y - 22 * k); ctx.lineTo(x, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      const cx = V.W / 2, cy = V.H / 2, a = Math.atan2(y - cy, x - cx), ex = cx + Math.cos(a) * (V.W / 2 - 36 * k), ey = cy + Math.sin(a) * (V.H / 2 - 36 * k);
      const qx = Math.max(30 * k, Math.min(V.W - 30 * k, ex)), qy = Math.max(30 * k, Math.min(V.H - 30 * k, ey));
      ctx.save(); ctx.translate(qx, qy); ctx.rotate(a); ctx.fillStyle = '#e6c464'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5 * k;
      ctx.beginPath(); ctx.moveTo(18 * k, 0); ctx.lineTo(-8 * k, -15 * k); ctx.lineTo(-8 * k, 15 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      const d = Math.round(Math.hypot(g.x - me.x, g.y - me.y));
      ctx.font = `700 ${Math.round(15 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4 * k; ctx.strokeStyle = INK; ctx.fillStyle = '#f4ead2';
      const tx = qx - Math.cos(a) * 30 * k, ty = qy - Math.sin(a) * 30 * k; ctx.strokeText(d + 'm', tx, ty); ctx.fillText(d + 'm', tx, ty);
    }
  }
  if (G.diff === 'easy' || G.fshowAll) for (const f of G.fspots) { if (!V.onScreen(f.x, f.y)) continue; keycap(ctx, V.sx(f.x), V.sy(f.y - (f.h ?? 2.2)), 30 * k, f.label || 'F'); }
  for (const m of G.marks) {
    const x = V.sx(m.x), y = V.sy(m.y);
    if (m.k === '!') { ctx.fillStyle = '#f4ead2'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.ellipse(x, y, 13 * k, 17 * k, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#a83e1e'; ctx.font = `900 ${Math.round(24 * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y + 1); }
    else if (m.k === 'dot') { ctx.fillStyle = m.c || 'rgba(43,33,24,.5)'; ctx.beginPath(); ctx.arc(x, y, (m.r || 4) * k, 0, 7); ctx.fill(); }
    else if (m.k === 'text') { ctx.font = `700 ${Math.round((m.s || 18) * k)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4 * k; ctx.strokeStyle = '#f4ead2'; ctx.strokeText(m.t, x, y); ctx.fillStyle = m.c || INK; ctx.fillText(m.t, x, y); }
    else if (m.k === 'ring') { ctx.strokeStyle = m.c || INK; ctx.lineWidth = 3 * k; ctx.setLineDash([6 * k, 6 * k]); ctx.beginPath(); ctx.ellipse(x, y, (m.r || 1) * V.S, (m.r || 1) * V.S * 0.55, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    else if (m.k === 'zone') { ctx.fillStyle = m.c || 'rgba(200,68,46,.22)'; ctx.strokeStyle = m.s || 'rgba(168,62,30,.7)'; ctx.lineWidth = 2 * k; ctx.setLineDash([8 * k, 6 * k]); ctx.beginPath(); if (m.w) ctx.rect(V.sx(m.x - m.w / 2), V.sy(m.y - m.h / 2), m.w * V.S, m.h * V.S); else ctx.ellipse(x, y, m.r * V.S, m.r * V.S * 0.55, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); }
  }
  if (G.P && G.P.sneak && G.mode === 'walk') { ctx.font = `700 ${Math.round(15 * k)}px sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4 * k; ctx.strokeStyle = INK; ctx.fillStyle = '#f4ead2'; ctx.strokeText('살금살금 (C)', 14 * k, V.H - 70 * k); ctx.fillText('살금살금 (C)', 14 * k, V.H - 70 * k); }
}

/* ── 봇(입력만) · 디버그 API ─────────────────────────────────────────────── */
const r2 = (v) => Math.round(v * 100) / 100;
function sense() {
  const R = G.runner, P = G.P, F = G.Fl, st = R.step;
  const on = (x, y) => V.onScreen(x, y, 1);
  const s = {
    ch: R.chN, idx: R.idx, id: st ? st.id : '', busy: R.state !== 'run', done: R.done, fails: R.fails, t: r2(R.t), diff: G.diff, mode: G.mode,
    goal: st ? st.goal : '', hint: G.hud.state().hint, bubble: G.hud.state().bubble,
    me: P ? { x: r2(P.x), y: r2(P.y), vx: r2(P.vx), vy: r2(P.vy), z: r2(P.z), air: P.air, dodge: P.dodge, hurt: P.hurtT > 0, fx: r2(P.fx), fy: r2(P.fy), carry: P.carry, hand: r2(P.hand), sneak: P.sneak } : null,
    fly: F ? { x: r2(F.x), y: r2(F.y), vx: r2(F.vx), vy: r2(F.vy), hidden: F.hidden, splash: F.splashT > 0, hits: F.hits, falls: F.falls, ob: F.ob.filter((o) => Math.abs(o.y - F.y) < 22).map((o) => ({ k: o.k, x: r2(o.x), y: r2(o.y), r: o.r, w: o.w, h: o.h })) } : null,
    goalXY: G.goal ? [G.goal.x, G.goal.y] : null,
    actors: G.cast.list.filter((a) => !a.hide && on(a.x, a.y)).map((a) => ({ k: a.who || a.kind, x: r2(a.x), y: r2(a.y), z: r2(a.z || 0), dir: a.dir, flip: a.flip, pupil: a.pose.pupil != null ? r2(a.pose.pupil) : null, tell: a.pose.tell ? r2(a.pose.tell) : 0, look: a.look, eat: a.pose.eat || 0, dizzy: a.pose.dizzy || 0, tag: a.tag || '' })),
    shots: FX.shots.filter((q) => on(q.x, q.y)).map((q) => ({ k: q.kind, x: r2(q.x), y: r2(q.y), z: r2(q.z), vx: r2(q.vx), vy: r2(q.vy), mine: !!q.mine })),
    marks: G.marks.filter((m) => m.k === 'zone').map((m) => ({ x: r2(m.x), y: r2(m.y), r: m.r, w: m.w, h: m.h })),
  };
  if (st && st.sense) { try { s.x = st.sense(G); } catch (e) { s.x = { err: String(e) }; } }
  return s;
}
window.DRG2 = {
  G, sense, perf: () => Object.assign(V.perf(), { fx: fxCount(), actors: G.cast.list.length, chunks: G.W ? G.W.chunks.size : 0, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }),
  perfReset: () => V.perfReset(), diag: () => ({ errs: G.diag.errs.slice(-20), ua: navigator.userAgent, cb: IS_CB }),
  skip: () => G.runner.skip(), jump: (c, i = 0) => G.runner.jump(c, i), input: I, get loop() { return LOOP; },
  bot: {
    run(fn) { I.botOn = true; I.botClear(); bot = { tick: (dt) => fn(sense, (a, v) => I.botSet(a, v), dt) }; },
    stop() { bot = null; I.botClear(); I.botOn = false; },
  },
};

/* ── 시작 ──────────────────────────────────────────────────────────────── */
let LOOP = null;
async function boot() {
  document.getElementById('load').classList.add('hide');
  LOOP = startLoop(V, step, draw);
  let pick;
  if (Q.has('ch')) { const g = +(Q.get('grade') || 4); pick = { grade: g, slot: 0, ch: +Q.get('ch'), idx: +(Q.get('step') || 0) }; }
  else pick = await showTitle({ playable: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], Q });
  G.grade = pick.grade; G.diff = diffOf(pick.grade, Q); G.slot = pick.slot;
  const s = pick.save || (pick.slot ? readSlot(pick.slot) : null);
  if (s) { G.book.load(s.book); G.inv = s.inv || {}; G.best = { ch: s.best ?? s.ch ?? 0, idx: s.bestIdx ?? 0 }; }
  G.book.give();
  G.onDone = async (n) => { if (n >= LAST_CH) { G.ended = true; await showEnding(G); location.href = location.pathname; } };
  canvas.focus();
  G.runner.start(pick.ch, pick.idx || 0);
  if (Q.get('bot')) { const m = await import('./bots/bots.js?v=1'); DRG2.bot.run(m.storyBot(Q.get('bot'))); }
}
boot();
