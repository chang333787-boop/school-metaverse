// 봇 — DRG2.sense()(화면에 보이는 것)만 읽고 키만 누름(상태 쓰기·순간이동 X)
// 반응 늦음: 쉬움 0.6초 · 보통 0.35초 — '무엇을 할지'(예고·기회)는 늦은 화면(late), '손·눈 움직임'(피하기·겨누기·걷기)은 지금 화면(now)
// 초당 누름 상한 4번(연타로 깨지 않게) · 클릭형 봇 다섯(가만히 · F 연타 · F 누른 채 · Space 연타 · → 누른 채 F 연타)
import { BOTS2 } from './bots2.js?v=1';
const ACTS = ['left', 'right', 'up', 'down', 'run', 'jump', 'use'];

/* 공용 손 */
function mkHand(level) {
  const H = { keys: {}, mem: {}, t: 0, level };
  H.hold = (a, v = true) => { if (v) H.keys[a] = true; };
  H.tap = (a, gap = 0.26) => { const m = H.mem; m.tapT = m.tapT || {}; if (H.t - (m.tapT[a] ?? -9) > gap) { m.tapT[a] = H.t; m.tapHold = m.tapHold || {}; m.tapHold[a] = 2; } };
  H.walk = (x, tol = 0.35, o = {}) => { const me = H.now.me; if (!me) return true; const d = x - me.x; if (Math.abs(d) <= tol) return true; H.hold(d > 0 ? 'right' : 'left'); if (o.run) H.hold('run'); if (o.sneak) H.hold('down'); return false; };
  H.face = (dir) => { const me = H.now.me; if (me && me.face !== dir && !H.mem.faceT) { H.hold(dir > 0 ? 'right' : 'left'); H.mem.faceT = 1; } else H.mem.faceT = 0; };
  /* 피하기 — 내 쪽으로 낮게 날아오는 것(드래곤 것)이 0.2초 안에 오면 점프 */
  H.dodge = (o = {}) => {
    const me = H.now.me; if (!me || me.air) return false;
    for (const s of H.now.shots) {
      if (s.mine) continue;
      const dx = s.x - me.x, closing = -Math.sign(dx) * s.vx;
      if (closing <= 0.5 || s.y > me.y + 1.6) continue;
      const tt = (Math.abs(dx) - 0.5) / closing;
      if (tt < (o.lead ?? 0.2) && tt > -0.05) { H.hold('jump'); return true; }
    }
    return false;
  };
  return H;
}

/* 던지기 포물선 — 서는 자리 찾기(kit THROW: v 9 · a 1.05 · 손 높이 1.3) */
export function arcY(dx, v = 9, a = 1.05, h = 1.3, desc = true) {
  const vx = Math.cos(a) * v, vy = Math.sin(a) * v, t = Math.abs(dx) / vx;
  return h + vy * t - 4.9 * t * t;
}
export function standFor(tx, ty, fromX, o = {}) {
  let best = null, be = 1e9;
  for (let d = 1.5; d < 9; d += 0.1) for (const sg of [-1, 1]) {
    const x = tx - sg * d, y = arcY(d, o.v, o.a);
    const vyAt = Math.sin(o.a ?? 1.05) * (o.v ?? 9) - 9.8 * d / (Math.cos(o.a ?? 1.05) * (o.v ?? 9));
    if (o.down && vyAt > 0) continue;
    const e = Math.abs(y - ty) * 3 + Math.abs(x - fromX) * 0.05 + (o.lo != null && x < o.lo ? 99 : 0) + (o.hi != null && x > o.hi ? 99 : 0);
    if (e < be) { be = e; best = { x, face: sg }; }
  }
  return best;
}

/* 비행 — 다가오는 돌기둥 틈 높이로 */
export function flyBot(H, o = {}) {
  const F = H.now.fly; if (!F) return;
  let ty = o.cruise ?? 5.5;
  const ahead = F.ob.filter((q) => q.k !== 'cloud' && q.x + q.w / 2 > F.x - 0.4 && q.x - q.w / 2 < F.x + (o.look ?? 11)).sort((a, b) => a.x - b.x);
  if (ahead.length) {
    const x0 = ahead[0].x, col = ahead.filter((q) => Math.abs(q.x - x0) < 1.5);
    let lo = 0.8, hi = 12;
    for (const q of col) { if (q.y0 < 0.5) lo = Math.max(lo, q.y1 + 1.2); else hi = Math.min(hi, q.y0 - 1.2); }
    ty = hi > lo ? (lo + hi) / 2 : lo;
    if (ty < lo) ty = lo;
  }
  if (o.target != null) ty = o.target;
  const e = ty - F.y;
  if (e > 0.25) H.hold('up'); else if (e < -0.25) H.hold('down');
  if (Math.abs(e) > 1.6 && H.level !== 'easy') H.hold('jump');
}

export const BOTS = {
  '0-1': (H) => flyBot(H),
  '1-1': (H) => { const n = H.now; if (n.goalX != null && H.walk(n.goalX, 0.6)) H.tap('use'); },
  '1-2': (H) => {
    const n = H.now, x = n.x || {}, me = n.me;
    if (!x.carry) { if (H.walk(x.well, 0.6)) H.tap('use'); return; }
    const fs = (x.fires || []).filter((f) => f.burn > 0); if (!fs.length) return;
    const f = fs.reduce((a, b) => (b.burn > a.burn ? b : a));
    const sp = H.mem.sp && H.mem.spF === f.x ? H.mem.sp : (H.mem.spF = f.x, H.mem.sp = standFor(f.x, f.top - 0.5, me.x, { down: true, lo: 45, hi: 82 }));
    if (H.walk(sp.x, 0.25)) { if (me.face !== sp.face) H.hold(sp.face > 0 ? 'right' : 'left'); else if (Math.abs(me.vx) < 0.3) { H.tap('use', 0.5); H.mem.sp = null; } }
  },
  '1-3': (H) => { if (!H.dodge()) H.walk(101); },
  '1-4': (H) => {
    const n = H.now, x = n.x || {}, me = n.me;
    if (x.scale != null) { if (H.walk(x.scale, 0.5)) H.tap('use'); return; }
    if (!x.carry) { if (!n.shots.length && H.walk(x.basket, 0.6)) H.tap('use'); return; }
    if (!x.T || x.T.dizzy) return;
    if (!H.walk(88, 0.4)) return;
    H.face(1);
    /* 테러 움직임 내다보기(두 번 본 자리로 빠르기) */
    const pv = H.mem.pv; H.mem.pv = { x: x.T.x, y: x.T.y, t: H.t };
    if (!pv || H.t - pv.t <= 0) return;
    const vx = (x.T.x - pv.x) / (H.t - pv.t), vy = (x.T.y - pv.y) / (H.t - pv.t);
    const a = 0.85, v = 10, cx = Math.cos(a) * v, cy = Math.sin(a) * v;
    for (let t = 0.2; t < 1.4; t += 0.05) {
      const ax = me.x + 0.3 + cx * t, ay = me.y + 1.3 + cy * t - 4.9 * t * t;
      const px = x.T.x + vx * (t + 0.03), py = x.T.y + vy * t * 0.6;
      if (Math.hypot(ax - px, ay - py) < 0.55) { H.tap('use', 0.6); break; }
    }
  },
  '1-5': (H) => {
    const n = H.now, x = n.x || {};
    if (x.aim < 1.08) { H.hold('up'); return; }
    if (x.aim > 1.14) { H.hold('down'); return; }
    if (!x.fury) return;
    const pv = H.mem.pv; H.mem.pv = { x: x.fury[0], t: H.t };
    if (!pv || pv.x <= x.fury[0] || H.t - pv.t <= 0) return;
    const vx = (x.fury[0] - pv.x) / (H.t - pv.t), a = x.aim, v = 17, dy = x.fury[1] - x.pivot[1];
    const vy0 = Math.sin(a) * v, disc = vy0 * vy0 - 19.6 * dy; if (disc < 0) return;
    const t = (vy0 - Math.sqrt(disc)) / 9.8, xa = x.pivot[0] + Math.cos(a) * v * t;
    const fx = x.fury[0] + vx * (t + 0.02);
    if (Math.abs(fx - xa) < 0.7) H.tap('use', 1.2);
  },
  '1-6': (H) => { if (!H.dodge()) H.walk(86); },
  '2-1': (H) => {
    const ts = (H.now.x || {}).torches || []; const d = ts.filter((q) => q.dim).sort((a, b) => a.lit - b.lit)[0];
    if (d && H.walk(d.x, 0.7, { run: Math.abs(d.x - H.now.me.x) > 5 })) H.tap('use');
  },
  '2-2': (H) => {
    const n = H.now, me = n.me, g = n.goalX; if (g == null) return;
    for (const b of [[37, 38.2], [49, 50.4]]) if (me.x > b[0] - 1.3 && me.x < b[0] && g > b[0] && me.ground) H.hold('jump');
    if (H.walk(g, 0.5)) { if (Math.abs(me.vx) < 0.4) H.hold('use'); }
    if (H.keys.jump) H.hold('right');
  },
  '2-3': (H) => {
    const n = H.now, x = n.x || {}, me = n.me, D = n.actors.find((a) => a.k === 'toothless'); if (!D) return;
    const peg = (x.pegs || []).find((q) => !q.cut); if (!peg) return;
    const sneak = Math.abs(me.x - D.x) < 8;
    if (H.walk(peg.x, 0.45, { sneak })) { const lp = (H.late.x || {}).pupil ?? 0; if (lp > 0.8 && x.pupil > 0.8) H.tap('use', 0.9); }
  },
  '3-1': (H) => {
    const n = H.now, x = n.x || {}, me = n.me, L = H.late;
    if (!x.carry && x.shield != null) { if (H.walk(x.shield, 0.5)) H.tap('use'); return; }
    if (H.dodge()) return;
    const D = L.actors.find((a) => a.k === 'gronckle');
    if (D && D.tell > 0.3 && !H.mem.banged) { H.tap('use', 0.9); H.mem.banged = 1; }
    if (D && D.tell === 0) H.mem.banged = 0;
    H.walk(7, 1);
  },
  '3-2': (H) => { const me = H.now.me; if (H.walk(14.1, 0.3, { sneak: me.x > 10 })) { H.hold('down'); H.hold('use'); } },
  '3-3': (H) => {
    const d = (H.now.x || {}).draw; if (!d || !d.next) return;
    const dx = d.next[0] - d.pen[0], dy = d.next[1] - d.pen[1];
    if (dx > 6) H.hold('right'); else if (dx < -6) H.hold('left');
    if (dy > 6) H.hold('down'); else if (dy < -6) H.hold('up');
  },
  '4-1': (H) => {
    const x = H.now.x || {}, L = H.late.x || {};
    if (x.ph === 'idle') H.tap('use', 0.8);
    else if (x.ph === 'dip' && L.ph === 'dip') H.tap('use', 0.5);
    else if (x.ph === 'fight' && L.pull) H.hold(L.pull > 0 ? 'left' : 'right');
  },
  '4-2': (H) => {
    const n = H.now, x = n.x || {}, L = H.late.x || {}, me = n.me, D = n.actors.find((a) => a.k === 'toothless'); if (!D) return;
    const d = Math.abs(D.x - me.x);
    if (x.knife) { if (H.walk(D.x - 9, 0.6)) { if (L.look === 1 && x.look === 1) H.tap('use', 0.8); } return; }
    if (x.eat) return;
    if (H.mem.half || (n.bubble || '').includes('반 토막')) { H.mem.half = 1; if (d > 3.5) { H.walk(D.x - 2.5, 0.4, { sneak: true }); return; } if (x.look === 1 && L.look === 1) H.hold('use'); return; }
    if (d > 2.4) { H.walk(D.x - 2.2, 0.3, { sneak: true }); return; }
    if (x.fear < 0.35 && L.fear < 0.4) H.tap('use', 1);
  },
  '4-3': (H) => {
    const n = H.now, x = n.x || {}, me = n.me, D = n.actors.find((a) => a.k === 'toothless'); if (!D) return;
    if (me.x < 26.5) {
      const next = (x.lines || []).find((l) => l > me.x - 0.1);
      if (next != null && next - me.x < 1.0 && next - me.x > 0.45 && me.ground) H.hold('jump');
      if (!me.ground || next == null || next - me.x > 0.45) H.hold('right');
      return;
    }
    if (Math.abs(D.x - me.x) > 3.0) { H.walk(D.x - 2.6, 0.3, { sneak: true }); return; }
    H.hold('use');
  },
  '5-1': (H) => { const f = H.now.x || {}; },
  '5-2': (H) => {
    const n = H.now, x = n.x || {}, L = H.late.x || {}, me = n.me;
    if (x.ph === 'eel') { if (H.walk(x.basket, 0.5)) H.tap('use', 0.8); return; }
    if (x.ph === 'throw') { H.tap('use', 0.8); return; }
    if (x.ph !== 'eat' || x.tail == null) return;
    if (!H.walk(x.tail, 0.4, { sneak: true })) return;
    H.hold('down');
    if (!x.look && !x.flinch && !L.flinch) H.hold('use');
  },
  '5-3': (H) => flyBot(H, { look: 7 }),
  '5-4': (H) => {
    const n = H.now, x = n.x || {}, me = n.me;
    if (!x.carry) { if (!n.shots.some((s) => s.mine) && H.walk(x.barrel, 0.5)) H.tap('use'); return; }
    if (!x.sp) return;
    const sp = standFor(x.sp.x, x.sp.y, me.x, { lo: 5, hi: x.sp.x - 1.5 });
    if (H.walk(sp.x, 0.25)) { H.face(1); if (Math.abs(me.vx) < 0.3 && me.face > 0) H.tap('use', 0.8); }
  },
  '6-1': (H) => {
    const n = H.now, x = n.x || {}, me = n.me, L = H.late.x || {};
    if (H.dodge({ lead: 0.22 })) return;
    const ds = x.ds || [], g = ds.find((d) => d.k === 'gronckle'), nd = ds.find((d) => d.k === 'nadder'), tr = ds.find((d) => d.k === 'terror');
    const cur = [g, nd, tr].find((d) => d && !d.calm); if (!cur) return;
    if (cur.k === 'terror') { if (H.walk(x.sun, 0.3)) { if (!x.light) H.tap('use', 1); } return; }
    const ld = (L.ds || []).find((d) => d.k === cur.k) || cur;
    const side = me.x < cur.x ? -1 : 1, near = cur.k === 'gronckle' ? 2.0 : 1.7, far = 4.5;
    if (ld.st === 'gap' && cur.st === 'gap') { if (H.walk(cur.x + side * near, 0.35)) { H.face(-side); if (cur.k === 'gronckle') H.tap('use', 0.6); else H.hold('use'); } }
    else H.walk(cur.x + side * far, 0.6);
  },
  '6-2': (H) => flyBot(H),
};
Object.assign(BOTS, BOTS2);
BOTS['5-1'] = (H) => { const f = H.now.x || {}; if (f.h != null && Math.abs(f.h - 0.6) < f.win * 0.32 && f.rising !== false) H.tap('use', 0.5); };

export function storyBot(level) {
  const lag = level === 'easy' ? 0.6 : 0.35, hist = [];
  const H = mkHand(level); let lastKey = '';
  return (sense, set, dt) => {
    H.t += dt;
    const now = sense(); hist.push([H.t, now]); while (hist.length > 1 && H.t - hist[0][0] > lag) hist.shift();
    H.now = now; H.late = hist[0][1];
    const key = now.ch + ':' + now.idx + ':' + now.fails;
    if (key !== lastKey) { lastKey = key; H.mem = {}; }
    H.keys = {};
    if (!now.busy && now.me) { const fn = BOTS[now.id]; if (fn) fn(H); }
    const th = H.mem.tapHold || {};
    for (const a of ACTS) { let v = !!H.keys[a]; if (th[a] > 0) { v = th[a] === 2; th[a]--; } set(a, v); }
  };
}
/* 클릭형 봇 — idle · fmash · fhold · smash · wfmash */
export function dumbBot(kind) {
  let t = 0, k = 0;
  return (sense, set, dt) => {
    t += dt; k++;
    for (const a of ACTS) set(a, false);
    if (kind === 'fmash') set('use', k % 10 < 3);
    if (kind === 'fhold') set('use', true);
    if (kind === 'smash') set('jump', k % 10 < 3);
    if (kind === 'wfmash') { set('right', true); set('use', k % 10 < 3); }
  };
}
