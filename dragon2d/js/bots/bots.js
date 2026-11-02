// 봇(탑뷰) — DRG2.sense()(화면에 보이는 것)만 읽고 키만 누름(상태 쓰기·순간이동 X)
// 반응 늦음: 쉬움 0.6초 · 보통 0.35초 — '무엇을 할지'(예고·기회)는 늦은 화면(H.late), '손·눈 움직임'(피하기·겨누기·걷기)은 지금 화면(H.now)
// 누름 상한: 같은 키 0.26초에 한 번(연타로 깨지 않게) · 클릭형 봇 다섯(가만히 · F 연타 · F 누른 채 · Space 연타 · → 누른 채 F 연타)
// 장 봇 더하기: 이 파일의 BOTS에 '장-차례' 이름으로 (H) => { ... } 를 넣거나, 다른 파일에서 export const BOTS_X = {…} 를 만들어 아래 EXTRA에 이음
import { BOTS_7 } from './bots7.js?v=1';
import { BOTS_10 } from './bots10.js?v=1';
const ACTS = ['left', 'right', 'up', 'down', 'run', 'jump', 'use', 'sneak'];

/* ── 공용 손 ─────────────────────────────────────────────────────────── */
function mkHand(level) {
  const H = { keys: {}, mem: {}, t: 0, level };
  H.hold = (a, v = true) => { if (v) H.keys[a] = true; };
  H.tap = (a, gap = 0.26) => { const m = H.mem; m.tapT = m.tapT || {}; if (H.t - (m.tapT[a] ?? -9) > gap) { m.tapT[a] = H.t; m.tapHold = m.tapHold || {}; m.tapHold[a] = 2; } };
  /* 걷기 — 8방향 · 막히면(0.5초 안 움직임) 옆으로 0.4초 비킴 · o.run · o.sneak(살금살금 켜고 끄기를 맞춤) */
  H.walk = (x, y, tol = 0.35, o = {}) => {
    const me = H.now.me; if (!me) return true;
    H.sneak(!!o.sneak);
    const dx = x - me.x, dy = y - me.y;
    if (Math.abs(dx) <= tol && Math.abs(dy) <= tol) { H.mem.stuckT = 0; return true; }
    const m = H.mem;
    if (m.sideT > 0) { m.sideT -= H.dt; H.hold(m.side); return false; }
    if (m.lastP) { const mv = Math.hypot(me.x - m.lastP[0], me.y - m.lastP[1]); if (mv < 0.01 && !me.hurt) m.stuckT = (m.stuckT || 0) + H.dt; else m.stuckT = 0; }
    m.lastP = [me.x, me.y];
    if (m.stuckT > 0.5) { m.stuckT = 0; m.sideT = 0.45; m.side = Math.abs(dx) > Math.abs(dy) ? (H.t % 2 < 1 ? 'up' : 'down') : (H.t % 2 < 1 ? 'left' : 'right'); }
    if (dx > tol * 0.6) H.hold('right'); else if (dx < -tol * 0.6) H.hold('left');
    if (dy > tol * 0.6) H.hold('down'); else if (dy < -tol * 0.6) H.hold('up');
    if (o.run) H.hold('run');
    return false;
  };
  H.sneak = (on) => { if (on) H.hold('sneak'); };      /* X 꾹 = 살금살금(누르고 있는 동안) */
  /* 바라보기 — 한 걸음(한 프레임)만 그쪽 키 */
  H.face = (fx, fy) => { const me = H.now.me; if (!me) return true; const ok = (fx === 0 || Math.sign(me.fx) === Math.sign(fx) && Math.abs(me.fx) > 0.5) && (fy === 0 || Math.sign(me.fy) === Math.sign(fy) && Math.abs(me.fy) > 0.5) && (fx !== 0 || Math.abs(me.fx) < 0.5) && (fy !== 0 || Math.abs(me.fy) < 0.5); if (ok) return true; if (!H.mem.faceT || H.t - H.mem.faceT > 0.2) { H.mem.faceT = H.t; if (fx > 0) H.hold('right'); if (fx < 0) H.hold('left'); if (fy > 0) H.hold('down'); if (fy < 0) H.hold('up'); } return false; };
  /* 피하기 — 붉은 고리(떨어질 자리) 밖으로 · 낮게 날아오는 것이 0.22초 안에 닿으면 점프 */
  H.dodge = (o = {}) => {
    const me = H.now.me; if (!me) return false;
    for (const z of H.now.marks || []) { if (z.w) continue; const d = Math.hypot(me.x - z.x, (me.y - z.y) * 1.3); if (d < (z.r || 1.2) + 0.5) { const n = d || 1; H.hold(me.x >= z.x ? 'right' : 'left'); H.hold(me.y >= z.y ? 'down' : 'up'); return true; } }
    if (me.air) return false;
    for (const s of H.now.shots) {
      if (s.mine || s.z > 1.6) continue;
      const rx = me.x - s.x, ry = me.y - s.y, d = Math.hypot(rx, ry), closing = (rx * s.vx + ry * s.vy) / (d || 1);
      if (closing <= 0.5) continue;
      const miss = Math.abs(rx * s.vy - ry * s.vx) / (Math.hypot(s.vx, s.vy) || 1);
      if (miss > 1.0) continue;
      const tt = (d - 0.5) / closing;
      if (tt < (o.lead ?? 0.22) && tt > -0.05) { H.hold('jump'); return true; }
    }
    return false;
  };
  return H;
}
export { mkHand };

/* 비행(달리기) — 앞 돌기둥 사이 가장 넓은 틈의 x로 · 멀면 꼬리(Space) */
export function flyBot(H, o = {}) {
  const F = H.now.fly; if (!F) return;
  const lane = o.lane || [10, 38];
  const ahead = F.ob.filter((q) => q.k === 'stack' && q.y < F.y + 1 && q.y > F.y - (o.look ?? 13));
  let best = F.x, bc = 1e9;
  for (let x = lane[0] + 0.8; x <= lane[1] - 0.8; x += 0.5) {
    let c = Math.abs(x - F.x) * 0.15;
    for (const q of ahead) { const gap = Math.abs(x - q.x) - q.r - 1.0; if (gap < 0) c += 100 - gap * 10 + (F.y - q.y < 6 ? 50 : 0); }
    if (c < bc) { bc = c; best = x; }
  }
  if (o.target != null) best = o.target;
  const e = best - F.x;
  if (e > 0.3) H.hold('right'); else if (e < -0.3) H.hold('left');
  if (Math.abs(e) > 2 && H.level !== 'easy') H.hold('jump');
}

/* 던지기 서는 자리 — 과녁(tx, ty)에서 5m 떨어진 곳(kit THROW.R = 5) · 바라볼 쪽 */
export const R5 = 5;

export const BOTS = {
  '0-1': (H) => flyBot(H),
  '1-1': (H) => { const g = H.now.goalXY; if (g && H.walk(g[0], g[1] + 0.9, 0.6)) H.tap('use'); },
  '1-2': (H) => {
    const x = H.now.x || {}, me = H.now.me;
    const me0 = H.now.me, tb = (x.tubs || []).reduce((a, b) => (Math.abs(b[0] - me0.x) < Math.abs(a[0] - me0.x) ? b : a));
    if (!x.carry) { if (H.walk(tb[0], tb[1] + 0.9, 0.5)) H.tap('use'); return; }
    const fs = (x.fires || []).filter((f) => f.burn > 0); if (!fs.length) return;
    const f = fs.reduce((a, b) => (b.burn > a.burn ? b : a));
    if (H.walk(f.x, f.y + 2.6, 0.3)) { if (H.face(0, -1) && Math.hypot(me.vx, me.vy) < 0.4) H.tap('use', 0.5); }
  },
  '1-3': (H) => { if (!H.dodge()) H.walk(57, 30.6, 0.8); },
  '1-4': (H) => {
    const x = H.now.x || {}, me = H.now.me;
    if (x.scale) { if (H.walk(x.scale[0], x.scale[1] + 0.3, 0.5)) H.tap('use'); return; }
    if (!x.carry) { if (!H.now.shots.length && H.walk(x.basket[0], x.basket[1] + 0.9, 0.5)) H.tap('use'); return; }
    if (!x.T || x.T.dizzy) return;
    if (!H.walk(54, 28.4, 0.3)) return;
    if (!H.face(0, -1)) return;
    const pv = H.mem.pv; H.mem.pv = { x: x.T.x, y: x.T.y, t: H.t };
    if (!pv || H.t - pv.t <= 0) return;
    const vx = (x.T.x - pv.x) / (H.t - pv.t), vy = (x.T.y - pv.y) / (H.t - pv.t);
    for (let t = 0.15; t < 0.7; t += 0.05) { const by = me.y - 7 * t, px = x.T.x + vx * (t + 0.03), py = x.T.y + vy * (t + 0.03); if (Math.hypot(me.x - px, (by - py) * 1.2) < 0.6) { H.tap('use', 0.6); break; } }
  },
  '1-5': (H) => {
    const x = H.now.x || {}, A = 1.25;
    if (x.ang < A - 0.03) { H.hold('right'); return; }
    if (x.ang > A + 0.03) { H.hold('left'); return; }
    if (!x.fury) return;
    const pv = H.mem.pv; H.mem.pv = { x: x.fury[0], t: H.t };
    if (!pv || pv.x <= x.fury[0] || H.t - pv.t <= 0) return;
    const vx = (x.fury[0] - pv.x) / (H.t - pv.t), th = (x.fury[1] - x.piv[1]) / (16 * Math.sin(x.ang)); if (th <= 0 || th > 0.85) return;
    const xb = x.piv[0] + 16 * Math.cos(x.ang) * th, fx = x.fury[0] + vx * (th + 0.02);
    if (Math.abs(fx - xb) < 0.8) H.tap('use', 1.2);
  },
  '1-6': (H) => { if (!H.dodge()) H.walk(46, 29.2, 0.8); },
  '2-1': (H) => { const ts = (H.now.x || {}).torches || [], d = ts.filter((q) => q.dim).sort((a, b) => a.lit - b.lit)[0]; if (d && H.walk(d.x, d.y, 0.6, { run: Math.abs(d.x - H.now.me.x) > 5 })) H.tap('use'); },
  '2-2': (H) => {
    const x = H.now.x || {}, me = H.now.me, c = (x.clues || [])[x.ci || 0]; if (!c) { H.walk(41, 15, 0.8); return; }
    for (const [lx, y0, y1] of x.logs || []) if (me.x > lx - 1.6 && me.x < lx - 0.5 && c[0] > lx && me.y > y0 && me.y < y1 + 0.3 && !me.air) H.hold('jump');
    if (H.walk(c[0], c[1] + 0.4, 0.5)) { if (Math.hypot(me.vx, me.vy) < 0.4) H.hold('use'); }
    if (H.keys.jump) H.hold('right');
  },
  '2-3': (H) => {
    const x = H.now.x || {}, me = H.now.me, L = H.late.x || {};
    const peg = (x.pegs || []).find((q) => !q.cut); if (!peg || !x.D) return;
    const sn = Math.hypot(me.x - x.D[0], me.y - x.D[1]) < 7.5;
    if (H.walk(peg.x + (peg.x < x.D[0] ? -0.6 : 0.6), peg.y, 0.4, { sneak: sn })) { if ((L.pupil ?? 0) > 0.8 && x.pupil > 0.8) H.tap('use', 0.9); }
  },
  '3-1': (H) => {
    const x = H.now.x || {}, L = H.late;
    if (!x.carry && x.shield) { if (H.walk(x.shield[0], x.shield[1] + 0.3, 0.5)) H.tap('use'); return; }
    if (H.dodge()) return;
    const D = L.actors.find((a) => a.k === 'gronckle');
    if (D && D.tell > 0.3 && !H.mem.banged) { H.tap('use', 0.9); H.mem.banged = 1; }
    if (D && D.tell === 0) H.mem.banged = 0;
    H.walk(11, 15, 1.2);
  },
  '3-2': (H) => { const x = H.now.x || {}, r = (x.rocks || [])[1]; if (!r) return; if (H.walk(r[0] - 1.3, r[1] + 0.2, 0.3, { sneak: H.now.me.x > 8 })) { H.sneak(true); H.hold('use'); } },
  '3-3': (H) => {
    const d = (H.now.x || {}).draw; if (!d || !d.next) return;
    const dx = d.next[0] - d.pen[0], dy = d.next[1] - d.pen[1];
    if (dx > 6) H.hold('right'); else if (dx < -6) H.hold('left');
    if (dy > 6) H.hold('down'); else if (dy < -6) H.hold('up');
  },
  '4-1': (H) => {
    const x = H.now.x || {}, L = H.late.x || {};
    if (x.row) { if (x.row.up && x.row.ph > 0.04 && x.row.ph < x.row.win - 0.04) H.tap('use', 0.6); return; }
    if (x.ph === 'idle') H.tap('use', 0.8);
    else if (x.ph === 'dip' && L.ph === 'dip') H.tap('use', 0.5);
    else if (x.ph === 'fight' && L.pull) H.hold(L.pull > 0 ? 'left' : 'right');
  },
  '4-2': (H) => {
    const x = H.now.x || {}, L = H.late.x || {}, me = H.now.me; if (!x.D) return;
    const d = Math.hypot(x.D[0] - me.x, x.D[1] - me.y);
    if (x.ph === 'knife') { if (H.walk(x.D[0] - 9, x.D[1], 0.6)) { if (L.look === 1 && x.look === 1) H.tap('use', 0.8); } return; }
    if (x.ph === 'eat') return;
    if (x.ph === 'half') { if (d > 3.5) { H.walk(x.D[0] - 2.5, x.D[1], 0.4, { sneak: true }); return; } if (x.look === 1 && L.look === 1) H.hold('use'); return; }
    if (d > 2.5) { H.walk(x.D[0] - 2.2, x.D[1], 0.3, { sneak: true }); return; }
    if (x.fear < 0.35 && L.fear < 0.4) H.tap('use', 1);
  },
  '4-3': (H) => {
    const x = H.now.x || {}, me = H.now.me; if (!x.D) return; const D = { x: x.D[0], y: x.D[1] };
    H.mem.wp = H.mem.wp || 0;
    if (H.mem.wp < 8) {      /* 선 틈으로 지그재그(위·아래 번갈아 열림 · 바위 비켜) */
      const WP = [[12.5, 20.2], [12.5, 10], [16.5, 10], [16.5, 20.2], [20.4, 20.2], [20.4, 10], [22.4, 10], [22.4, 15]];
      const w = WP[H.mem.wp]; if (w && H.walk(w[0], w[1], 0.3)) H.mem.wp++;
      return;
    }
    if (Math.hypot(D.x - me.x, D.y - me.y) > 3.0) { H.walk(D.x - 2.4, D.y, 0.3, { sneak: true }); return; }
    H.hold('use');
  },
  '5-1': (H) => { const f = H.now.x || {}; if (f.h != null && Math.abs(f.h - 0.6) < f.win * 0.3) H.tap('use', 0.5); },
  '5-2': (H) => {
    const x = H.now.x || {}, L = H.late.x || {};
    if (x.ph === 'eel' || !x.ph) { if (H.walk(x.basket[0], x.basket[1] + 0.8, 0.5)) H.tap('use', 0.8); return; }
    if (x.ph === 'throw') { H.tap('use', 0.8); return; }
    if (x.ph !== 'eat' || !x.tail) return;
    if (!H.walk(x.tail[0] + 0.5, x.tail[1], 0.35, { sneak: true })) return;
    if (!x.look && !x.flinch && !L.flinch) H.hold('use');
  },
  '5-3': (H) => flyBot(H, { lane: [5, 34], look: 8 }),
  '5-4': (H) => {
    const x = H.now.x || {}, me = H.now.me;
    if (!x.carry) { H.mem.ready = 0; if (!H.now.shots.some((s) => s.mine) && H.walk(x.tub[0], x.tub[1] + 0.9, 0.5)) H.tap('use'); return; }
    if (!x.sp) return;
    if (!H.mem.ready) { if (H.walk(x.sp.x - 6.6, x.sp.y, 0.4)) H.mem.ready = 1; return; }
    if (H.walk(x.sp.x - 5, x.sp.y, 0.25)) { if (H.face(1, 0) && Math.hypot(me.vx, me.vy) < 0.3) H.tap('use', 0.8); }
  },
  '6-1': (H) => {
    const x = H.now.x || {}, me = H.now.me, L = H.late.x || {};
    if (H.dodge()) return;
    const ds = x.ds || [], cur = ['gronckle', 'nadder', 'terror'].map((k) => ds.find((d) => d.k === k)).find((d) => d && !d.calm); if (!cur) return;
    if (cur.k === 'terror') { if (H.walk(x.sun[0], x.sun[1] + 0.3, 0.35)) { if (!x.light) H.tap('use', 1); } return; }
    const ld = (L.ds || []).find((d) => d.k === cur.k) || cur;
    if (ld.st === 'gap' && cur.st === 'gap') { if (H.walk(cur.x, cur.y + 1.5, 0.4)) { if (cur.k === 'gronckle') H.tap('use', 0.6); else H.hold('use'); } }
    else H.walk(cur.x + (me.x < cur.x ? -2.2 : 2.2), cur.y + 2.2, 0.8);
  },
  '6-2': (H) => flyBot(H),
  '4-0': (H) => { if (!H.dodge()) { const g = H.now.goalXY; if (g) H.walk(g[0], g[1] + 0.4, 0.8); } },
  '6-3': (H) => {
    const x = H.now.x || {}, me = H.now.me, L = H.late.x || {};
    if (!x.T) { const g = H.now.goalXY; if (g) H.walk(g[0], g[1] + 0.6, 0.6); return; }
    if (!x.carry) { if (H.walk(x.basket[0], x.basket[1] - 0.6, 0.45)) H.tap('use', 0.8); return; }
    if (H.walk(x.T[0] - 1.4, x.T[1], 0.35, { sneak: true })) { if (x.pupil > 0.7 && (L.pupil ?? 0) > 0.7) H.tap('use', 1); }
  },
};
Object.assign(BOTS, BOTS_7 || {}, BOTS_10 || {});

export function storyBot(level) {
  const lag = level === 'easy' ? 0.6 : 0.35, hist = [];
  const H = mkHand(level); let lastKey = '';
  return (sense, set, dt) => {
    H.t += dt; H.dt = dt;
    const now = sense(); hist.push([H.t, now]); while (hist.length > 1 && H.t - hist[0][0] > lag) hist.shift();
    H.now = now; H.late = hist[0][1];
    const key = now.ch + ':' + now.idx + ':' + now.fails;
    if (key !== lastKey) { lastKey = key; H.mem = {}; }
    H.keys = {};
    if (now.card || now.dialog) H.tap('use', 0.35);                     /* 대화창·장 카드 = F로 넘김 */
    else if (!now.busy && now.me) { const fn = BOTS[now.id]; if (fn) fn(H); else if (now.goalXY) H.walk(now.goalXY[0], now.goalXY[1] + 0.6, 0.6); }
    const th = H.mem.tapHold || {};
    for (const a of ACTS) { let v = !!H.keys[a]; if (th[a] > 0) { v = th[a] === 2; th[a]--; } set(a, v); }
  };
}
/* 클릭형 봇 — idle · fmash · fhold · smash · wfmash */
export function dumbBot(kind) {
  let k = 0;
  return (sense, set) => {
    k++;
    for (const a of ACTS) set(a, false);
    if (kind === 'fmash') set('use', k % 10 < 3);
    if (kind === 'fhold') set('use', true);
    if (kind === 'smash') set('act', k % 10 < 3);           /* X 연타 */
    if (kind === 'wfmash') { set('right', true); set('use', k % 10 < 3); }
  };
}
