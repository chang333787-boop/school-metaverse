// 이야기 장 봇(design §13) — DRG.sense()(화면·소리로 드러난 것만)를 읽고 키·끌기만 넣는다(상태 쓰기·순간이동 X)
// 반응 늦음: 쉬움 0.6초 · 보통 0.35초(그만큼 지난 감각으로 정함) · 초당 6타 상한 · 동시 키 셋 이하
// 가만히 봇 · 연타 봇(키마다) · 누른 채 봇(F·Space)은 도전을 못 깨야 한다(클릭형 검사)
const RT = { easy: 0.6, normal: 0.35, hard: 0.3 };

/* 길 찾기 — 격자 A*(장애 = 선분과의 거리 < 여유) · 봇은 화면에 보이는 선·벽만 앎 */
export function planPath(sx, sz, gx, gz, segs, clear = 0.45, cell = 0.4, pad = 6, circles = null) {
  const x0 = Math.min(sx, gx) - pad, z0 = Math.min(sz, gz) - pad, x1 = Math.max(sx, gx) + pad, z1 = Math.max(sz, gz) + pad;
  const W = Math.ceil((x1 - x0) / cell) + 1, H = Math.ceil((z1 - z0) / cell) + 1;
  if (W * H > 90000) return [[gx, gz]];
  const block = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = x0 + i * cell, z = z0 + j * cell;
    for (const [ax, az, bx, bz] of segs) { const ex = bx - ax, ez = bz - az, L2 = ex * ex + ez * ez || 1e-9; let t = ((x - ax) * ex + (z - az) * ez) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; if (Math.hypot(x - ax - ex * t, z - az - ez * t) < clear) { block[j * W + i] = 1; break; } }
    if (circles && !block[j * W + i]) for (const [cx, cz, cr] of circles) if (Math.hypot(x - cx, z - cz) < cr + 0.35) { block[j * W + i] = 1; break; }
  }
  const si = Math.round((sx - x0) / cell), sj = Math.round((sz - z0) / cell), gi = Math.round((gx - x0) / cell), gj = Math.round((gz - z0) / cell);
  const S = sj * W + si, Gk = gj * W + gi; block[S] = 0; block[Gk] = 0;
  const prev = new Int32Array(W * H).fill(-1), dist = new Float32Array(W * H).fill(1e9), done = new Uint8Array(W * H); dist[S] = 0;
  const N8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  const hk = [], hf = [];                                  // 작은 힙(f 값 작은 것부터)
  const push = (k, f) => { let i = hk.length; hk.push(k); hf.push(f); while (i > 0) { const pa = (i - 1) >> 1; if (hf[pa] <= hf[i]) break; [hk[pa], hk[i]] = [hk[i], hk[pa]]; [hf[pa], hf[i]] = [hf[i], hf[pa]]; i = pa; } };
  const pop = () => { const k = hk[0], lk = hk.pop(), lf = hf.pop(); if (hk.length) { hk[0] = lk; hf[0] = lf; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < hk.length && hf[l] < hf[m]) m = l; if (r < hk.length && hf[r] < hf[m]) m = r; if (m === i) break; [hk[m], hk[i]] = [hk[i], hk[m]]; [hf[m], hf[i]] = [hf[i], hf[m]]; i = m; } } return k; };
  push(S, 0);
  while (hk.length) {
    const k = pop(); if (done[k]) continue; done[k] = 1;
    if (k === Gk) break;
    const i = k % W, j = k / W | 0;
    for (const [di, dj, c] of N8) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue; const nk = nj * W + ni; if (block[nk] || done[nk]) continue; if (di && dj && (block[j * W + ni] || block[nj * W + i])) continue; const nd = dist[k] + c; if (nd < dist[nk]) { dist[nk] = nd; prev[nk] = k; push(nk, nd + Math.hypot(ni - gi, nj - gj)); } }
  }
  if (prev[Gk] < 0 && Gk !== S) return null;
  const pts = []; for (let k = Gk; k >= 0 && k !== S; k = prev[k]) pts.push([x0 + (k % W) * cell, z0 + (k / W | 0) * cell]);
  pts.reverse();
  const out = []; for (let q = 0; q < pts.length; q += 3) out.push(pts[q]); if (pts.length) out.push(pts[pts.length - 1]);   // 듬성듬성
  return out;
}

/* 봇 몸 — 키 누름 상태 · 끌어서 카메라 돌리기 · 걸어가기 */
function body(B) {
  const held = new Set(); let taps = 0, tapWin = 0;
  const K = {
    set(code, on) { if (on && !held.has(code)) { if (held.size >= 3) return; B.press(code); held.add(code); } else if (!on && held.has(code)) { B.release(code); held.delete(code); } },
    tap(code) { if (taps >= 6) return false; taps++; B.hold(code, 2); return true; },
    tick(dt) { tapWin += dt; if (tapWin >= 1) { tapWin = 0; taps = 0; } },
    releaseAll() { for (const c of [...held]) { B.release(c); held.delete(c); } },
    /* 카메라를 목표 쪽으로(끌기) 돌리고, 맞으면 W — 돌아갈 각이 크면 멈춰서 돌림 */
    /* 손·눈 움직임은 지금 화면(K.cur)으로 — 반응 늦음은 '무엇을 할지' 정할 때만(늦은 감각으로 조준하면 흔들림) */
    walk(s, tx, tz, slow = false, arrive = 0.5) {
      const c = K.cur || s, me = c.me; if (!me) return false;
      const dx = tx - me.x, dz = tz - me.z, d = Math.hypot(dx, dz);
      if (d < arrive) { K.set('KeyW', false); K.set('KeyA', false); K.set('KeyD', false); return true; }
      /* 막힘 — W를 누르는데 1.2초 넘게 제자리면 0.7초 옆걸음(번갈아) */
      if (K.held.has('KeyW') && K.lx !== undefined && Math.hypot(me.x - K.lx, me.z - K.lz) < 0.01) K.stuckT = (K.stuckT || 0) + 1 / 60; else K.stuckT = 0;
      K.lx = me.x; K.lz = me.z;
      if (K.stuckT > 1.2) { K.sideT = 0.7; K.stuckT = 0; K.sideK = K.sideK === 'KeyA' ? 'KeyD' : 'KeyA'; }
      if (K.sideT > 0) { K.sideT -= 1 / 60; K.set(K.sideK, true); K.set('KeyW', true); return false; }
      K.set('KeyA', false); K.set('KeyD', false);
      const want = Math.atan2(dx, dz), da = Math.atan2(Math.sin(want - c.camYaw), Math.cos(want - c.camYaw));
      const px = Math.max(-30, Math.min(30, -da / 0.006 * 0.3));
      if (Math.abs(da) > 0.03) B.drag(px, 0);
      K.set('KeyW', Math.abs(da) < 0.6);
      if (slow !== null && (K.shiftCd = (K.shiftCd || 0) - 1 / 60) <= 0 && !!me.low !== !!slow) { K.tap('ShiftLeft'); K.shiftCd = 0.5; }   // 바뀐 걸 보고 다시(0.5초)
      return false;
    },
    stop() { K.set('KeyW', false); },
    /* 길 찾아 걷기 — 보이는 벽·바위(sense.obst)로 A* · 막히면 다시 찾음 */
    go(s, tx, tz, slow = false, arrive = 1) {
      const me = K.cur.me, ob = K.cur.obst;
      if (Math.hypot(tx - me.x, tz - me.z) < arrive) { K.stop(); K.path = null; return true; }
      const key = tx.toFixed(1) + ',' + tz.toFixed(1);
      if (!K.path || K.pathKey !== key || K.pk >= K.path.length || (K.replanT = (K.replanT || 0) + 1 / 60) > 4) {
        K.replanT = 0; K.pathKey = key; K.pk = 0;
        K.path = ob && Math.hypot(tx - me.x, tz - me.z) < 70 ? planPath(me.x, me.z, tx, tz, ob.walls, 0.5, 0.5, 8, ob.rocks) || [[tx, tz]] : [[tx, tz]];
      }
      const p = K.path[K.pk]; if (K.walk(s, p[0], p[1], slow, K.pk === K.path.length - 1 ? arrive : 0.8)) K.pk++;
      return false;
    },
    face(s, tx, tz) { const c = K.cur || s, me = c.me, want = Math.atan2(tx - me.x, tz - me.z), da = Math.atan2(Math.sin(want - c.camYaw), Math.cos(want - c.camYaw)); if (Math.abs(da) > 0.05) B.drag(Math.max(-30, Math.min(30, -da / 0.006 * 0.3)), 0); return Math.abs(da) < 0.15; },
    held,
  };
  return K;
}

/* 장 봇 — level 'easy'|'normal' · 차례 id마다 하는 일 */
import { flyBot, boatBot } from './flight_bot.js?v=16';
import { BOTS as B0 } from './ch0_bots.js?v=16';
import { BOTS as B1 } from './ch1_bots.js?v=16';
import { BOTS as B7 } from './ch7_bots.js?v=16';
import { BOTS as B8 } from './ch8_bots.js?v=16';
import { BOTS as B9 } from './ch9_bots.js?v=16';
import { BOTS as B10 } from './ch10_bots.js?v=16';
import { BOTS as B11 } from './ch11_bots.js?v=16';
window.DRG_FLYBOT = flyBot; window.DRG_BOATBOT = boatBot;
export function storyBot(level = 'normal') {
  const lag = Math.round(RT[level] * 60);
  const hist = []; let K = null, mem = {}, lastId = '', lastFails = 0, T = 0;
  return (n, B) => {
    if (!K) K = body(B);
    const now = window.DRG.sense(); if (!now) return;
    hist.push(now); if (hist.length > lag + 1) hist.shift();
    const s = hist[0];                                     // 반응 늦음만큼 지난 감각
    const dt = 1 / 60; T += dt; K.tick(dt);
    if (now.id !== lastId || now.fails !== lastFails) { K.releaseAll(); mem = {}; lastId = now.id; lastFails = now.fails; K.path = null; hist.length = 0; hist.push(now); return; }   // 다시 하기 뒤에도 기억을 비움(팀 G)
    if (s.busy || !s.me || !now.me) return;
    K.cur = now;
    const f = BOTS[s.id]; if (f) f(s, K, mem, B, level, now);
  };
}
/* 클릭형 검사 봇 — 가만히 · 연타(key) · 누른 채(key) · W 누른 채 F 연타 */
export function dumbBot(kind, key = 'KeyF') {
  let k = 0;
  return (n, B) => {
    if (kind === 'idle') return;
    if (kind === 'hold') { if (n % 60 === 0) B.press(key); return; }
    if (kind === 'mash') { if (n % 10 === 0) B.hold(key, 3); return; }
    if (kind === 'walkmash') { if (n % 120 === 0) B.press('KeyW'); if (n % 10 === 0) B.hold(key, 3); k++; }
  };
}

const BOTS = {};
/* ── 4장 ── */
BOTS['4-1'] = (s, K, M, B) => {                          // 내더 미로: 살금살금 + A* 길 · 가시 예고가 보이면 벽 뒤로 구르기
  if (!s.exit || !s.maze) return;
  if (!K.cur.me.low) { if ((K.shiftCd = (K.shiftCd || 0) - 1 / 60) <= 0) { K.tap('ShiftLeft'); K.shiftCd = 0.5; } return; }
  if (s.nadder && s.nadder.spines > 0.3) {               // 가시 예고: 벽 뒤로 가거나, 쏘기 직전(예고 끝 0.3초 앞)에 옆으로 구르기
    M.warn = (M.warn || 0) + 1 / 60;
    const end = { easy: 3, normal: 2.5, hard: 2 }[s.diff] - 0.35 - 0.35;   // 반응 늦음만큼 앞당김
    if (M.warn > end && !M.rolled) { M.rolled = true; window.DRG.bot.drag(150, 0); K.set('KeyW', true); K.tap('Space'); }
    else if (!M.rolled) K.stop();
    return;
  }
  M.warn = 0; M.rolled = false;
  /* 다시 하기(가시 세 번 → 들어온 문)면 옛 길을 버림 · 3초 동안 1m도 못 가면 다시 찾음(팀 G — CPU 4× 실제 시간에서 옛 길 끝을 향해 벽만 밀던 막힘) */
  if (M.fails !== s.fails) { M.fails = s.fails; M.path = null; }
  M.chkT = (M.chkT || 0) + 1 / 60;
  if (M.chkT > 3) { if (M.cx !== undefined && Math.hypot(s.me.x - M.cx, s.me.z - M.cz) < 1) M.path = null; M.chkT = 0; M.cx = s.me.x; M.cz = s.me.z; }
  if (!M.path || (M.k >= M.path.length)) { const ob = K.cur.obst || { walls: [], rocks: [] }; M.path = planPath(s.me.x, s.me.z, s.exit.x, s.exit.z, s.maze, 0.7, 0.5, 20, ob.rocks) || [[s.exit.x, s.exit.z]]; M.k = 0; }
  const p = M.path[M.k]; if (K.walk(s, p[0], p[1], null, 0.6)) M.k++;
};
BOTS['4-2'] = (s, K, M, B, lv) => {                      // 배(팀 F 배 봇) + 낚시
  if (s.state === 'row') { if (s.mode === 'boat' && window.DRG_BOATBOT) { M.bb = M.bb || window.DRG_BOATBOT('beat', lv); M.bb(window.DRG.loop.n, B); } return; }
  if (s.state === 'cast') { K.set('KeyA', false); K.set('KeyD', false); if (!M.cd || M.cd <= 0) { K.tap('KeyF'); M.cd = 1.2; } M.cd -= 1 / 60; return; }
  if (s.state === 'wait') { if (s.bob === 'sink' && !M.hooked) { M.hooked = true; K.tap('KeyF'); } if (s.bob !== 'sink') M.hooked = false; return; }
  if (s.state === 'fight') { K.set('KeyA', s.pull > 0); K.set('KeyD', s.pull < 0); }
};
BOTS['4-3'] = (s, K, M) => {                            // 칼 내려놓기 → 생선 → 기다리기
  const t = s.tl;
  if (!t || t.seen === false) { window.DRG.bot.drag(4, 0); K.stop(); return; }
  if (s.stage === 'knife') {
    if (t.d > 12 && !t.moving) { K.walk(s, t.x, t.z, true); return; }
    K.stop(); K.face(s, t.x, t.z); if (t.facingMe && (!M.cd || M.cd <= 0)) { K.tap('KeyF'); M.cd = 1.0; } M.cd = (M.cd || 0) - 1 / 60; return;
  }
  if (s.stage === 'fish') {
    if (t.d > 6) { K.walk(s, t.x, t.z, true, 5.8); return; }
    K.stop(); K.face(s, t.x, t.z); M.cd = (M.cd || 0) - 1 / 60;
    if (t.pupil > 0.55 && M.cd <= 0) { K.tap('KeyF'); M.cd = 3.5; }
    return;
  }
  K.stop();                                              // 오는 중·먹는 중 = 가만히
};
BOTS['4-4'] = (s, K) => { K.set('KeyF', !!s.look && !s.earTurn); };
BOTS['4-5'] = (s, K, M) => {                            // 선 피해 다가가 손 내밀기
  const t = s.tl; if (!s.segs || !t || t.seen === false) { K.stop(); K.set('KeyF', false); if (s.center && s.me) K.face(s, s.center.x, s.center.z); return; }
  const d = Math.hypot(s.me.x - t.x, s.me.z - t.z);
  if (d < 2.4) { K.stop(); K.set('KeyF', true); return; }
  K.set('KeyF', false);
  if (!M.path || M.k >= M.path.length) {
    const gx = t.x + (s.me.x - t.x) / d * 1.2, gz = t.z + (s.me.z - t.z) / d * 1.2;
    if ((M.cd = (M.cd || 0) - 1 / 60) > 0) return;
    const ob = K.cur.obst || { walls: [], rocks: [] };          // 화면에 보이는 둘레 벽·바위(장소)
    M.path = planPath(s.me.x, s.me.z, gx, gz, s.segs.concat(ob.walls), 0.42, 0.25, 10, ob.rocks) || []; M.k = 0;
    if (!M.path.length) { M.cd = 1; return; }
  }
  const p = M.path[M.k]; if (K.walk(s, p[0], p[1], true, 0.35)) M.k++;
};
/* ── 2장 ── */
BOTS['2-1'] = (s, K, M, B, lv) => {                      // 횃불: 꺼져 가는 것(가장 낮은 것)으로 가서 F · 쉬움 = 탁자로
  if (s.diff === 'easy') { if (s.table) K.walk(s, s.table.x, s.table.z, false, 4); return; }
  const T = (s.torches || []).filter((t) => t.level < 0.92).sort((a, b) => a.level - b.level)[0];
  if (!T) { K.stop(); B.drag(4, 0); return; }
  if (K.go(s, T.x, T.z, false, 2.2)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.6; } }
};
BOTS['2-2'] = (s, K, M, B) => {                          // 추적: 조각이 보이면 줍고 · 떨어진 곳이 보이면 가고 · 아니면 짐작 X에 가장 가까운 단서로
  const me = K.cur.me;
  if (M.lx !== undefined) { const mv = Math.hypot(me.x - M.lx, me.z - M.lz); M.still = mv < 0.02 && K.held.has('KeyW') ? (M.still || 0) + 1 / 60 : 0; }
  M.lx = me.x; M.lz = me.z;
  if (M.still > 1.2) { M.unstick = 0.8; M.still = 0; M.side = !M.side; }
  if (M.unstick > 0) { M.unstick -= 1 / 60; K.set(M.side ? 'KeyA' : 'KeyD', true); K.set('KeyW', true); return; }
  K.set('KeyA', false); K.set('KeyD', false);
  M.seen = M.seen || {};
  if (s.fin && !s.got) { if (K.walk(s, s.fin.x, s.fin.z, false, 1.4)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.8; } } return; }
  if (s.crash && s.got) { K.walk(s, s.crash.x, s.crash.z, false, 4); return; }
  for (const c of s.clues) if (Math.hypot(me.x - c.x, me.z - c.z) < 3) M.seen[c.i] = 1;
  const g = s.guess, cand = s.clues.filter((c) => !M.seen[c.i]).sort((a, b) => Math.hypot(a.x - g.x, a.z - g.z) - Math.hypot(b.x - g.x, b.z - g.z))[0];
  if (cand) { M.tgt = cand; M.scanT = 0; }
  if (M.tgt && !M.seen[M.tgt.i]) { K.walk(s, M.tgt.x, M.tgt.z, false, 2.5); return; }
  M.scanT = (M.scanT || 0) + 1 / 60; K.stop();
  if (M.scanT < 4.5) { B.drag(4, 0); return; }                // 둘러보기(천천히 · 한 바퀴 ≈ 4초)
  M.tgt = null; K.walk(s, g.x, g.z, false, 3); if (M.scanT > 6) M.scanT = 0;
};
BOTS['2-3'] = (s, K, M) => {                             // 밧줄: 살금살금 가장 가까운 말뚝 → 동공이 둥글 때 F
  const me = K.cur.me, t = s.tl;
  const p = (s.pegs || []).sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z))[0];
  if (!p) { if (t && t.x != null) { const a = Math.atan2(me.x - t.x, me.z - t.z) + 1.0; K.walk(s, t.x + Math.sin(a) * 3.6, t.z + Math.cos(a) * 3.6, true, 0.6); } else { K.stop(); window.DRG.bot.drag(4, 0); } return; }   // 안 보이는 말뚝 = 몸을 돌아서 봄
  if (!K.walk(s, p.x, p.z, true, 1.1)) return;
  K.stop();
  if (t && t.pupil > 0.8 && (M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.7; }
  else if (M.cd > 0) M.cd -= 1 / 60;
};
/* ── 3장 ── */
BOTS['3-0'] = (s, K) => { if (s.target) K.go(s, s.target.x, s.target.z, false, 4); };
BOTS['3-1'] = (s, K, M) => {                             // 그롱클: 볼이 부풀면 한 번 두드림 · 방패를 놓치면 주움
  if (!s.shieldOn && s.shieldAt) { if (K.walk(s, s.shieldAt.x, s.shieldAt.z, false, 1.2)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.6; } } return; }
  K.stop();
  if (s.gr) K.face(s, s.gr.x, s.gr.z);
  if (s.gr && s.gr.puff) { if (!M.banged) { M.banged = true; K.tap('KeyF'); } } else M.banged = false;
};
BOTS['3-2'] = (s, K, M) => {                             // 코브 관찰: 살금살금 가장 가까운 숨을 바위로 → 미끄러질 때 F 꾹
  const me = K.cur.me, w = (s.watch || []).slice().sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z))[0];
  if (!w) return;
  if (!me.low) { K.set('KeyF', false); if ((K.shiftCd = (K.shiftCd || 0) - 1 / 60) <= 0) { K.tap('ShiftLeft'); K.shiftCd = 0.5; } return; }
  if (!K.walk(s, w.x, w.z, null, 1.0)) { K.set('KeyF', false); return; }
  K.stop();
  if (s.tl && s.tl.x != null) K.face(s, s.tl.x, s.tl.z); else if (w.yaw != null) K.face(s, w.x + Math.sin(w.yaw) * 10, w.z + Math.cos(w.yaw) * 10);
  K.set('KeyF', !!s.climbing);
};
BOTS['3-3'] = (s, K, M) => {                             // 책 받기 → 점 잇기(방향키로 펜 · F 누른 채)
  if (!s.draw) { if (s.table) { if (K.walk(s, s.table.x, s.table.z, false, 1.6)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.8; } } } return; }
  const d = (K.cur && K.cur.draw) || s.draw, n = d.next; if (!n) { K.releaseAll(); return; }   // 펜은 손·눈 움직임 = 지금 화면으로
  const dx = n[0] - d.pen[0], dy = n[1] - d.pen[1];
  K.set('KeyF', true);
  K.set('KeyD', dx > 6); K.set('KeyA', dx < -6); K.set('KeyS', dy > 6); K.set('KeyW', dy < -6);
};
/* ── 5장 ── */
BOTS['5-1'] = (s, K, M) => {                             // 망루: 바람이 오는 횃불 앞에 서기 · 꺼진 것은 F
  const off = (s.torches || []).find((t) => !t.lit);
  if (s.gust) { K.walk(s, s.gust.x, s.gust.z, false, 0.35); return; }
  if (off) { if (K.walk(s, off.x, off.z, false, 1.3)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.6; } } return; }
  if (s.diff === 'easy' && s.top) { K.go(s, s.top.x, s.top.z, false, 3); return; }
  K.stop();
};
BOTS['5-2'] = (s, K, M) => {                             // 대장간: 작업대 → 자르기·바람·망치(모양을 보고 맞춰 누름)
  const b = s.bench || {};
  if (!b.kind) { if (s.at && K.walk(s, s.at.x, s.at.z, false, 1.8)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 1; } } return; }
  if (b.kind === 'cut') { if (b.corner && !M.hit) { M.hit = true; K.tap('Space'); } if (!b.corner) M.hit = false; return; }
  if (b.kind === 'wind') { if (b.full > 0.85 && !M.pumped && !b.tangle) { M.pumped = true; K.tap('Space'); } if (b.full < 0.5) M.pumped = false; if (Math.abs(b.bend) > 0.25 && !b.straight && !M.moved) { M.moved = true; K.tap(b.bend > 0 ? 'KeyD' : 'KeyA'); } if (Math.abs(b.bend) < 0.1) M.moved = false; return; }
  if (b.kind === 'hammer') { if (b.hot && !M.hit && !b.numb) { M.hit = true; K.tap('KeyF'); } if (!b.hot) M.hit = false; }
};
BOTS['5-3'] = (s, K, M) => {                             // 뱀장어 치우기 → 꼬리: 움찔이면 떼고 · 둥글면 F 꾹
  const t = s.tl; const me = K.cur.me;
  if (s.stage === 'eel') { const bx = t && t.x != null ? null : null; if (!M.bk) M.bk = s.basket; return BOTS['5-3eel'](s, K, M); }
  if (s.stage === 'carry') { const away = M.away || (M.away = { x: me.x + 14, z: me.z }); if (K.walk(s, away.x, away.z, false, 1)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.8; } } return; }
  if (s.stage === 'tail' && s.tail) {
    if (!K.walk(s, s.tail.x, s.tail.z, true, 1.1)) { K.set('KeyF', false); return; }
    K.stop(); K.set('KeyF', !s.flinch && s.calm > 0.75);
  }
};
BOTS['5-3eel'] = (s, K, M) => { if (!s.basketAt) return; if (K.walk(s, s.basketAt.x, s.basketAt.z, false, 1.4)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.8; } } };
BOTS['5-4'] = (s, K, M, B, lv) => {                      // 첫 들림: 꼬리에 F → 팀 F 비행 봇(들림)
  if (s.tail) { if (K.walk(s, s.tail.x, s.tail.z, false, 1.2)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.8; } } return; }
  if (s.mode === 'fly' && window.DRG_FLYBOT) { if (!M.fb) { K.releaseAll(); M.fb = window.DRG_FLYBOT(lv); } M.fb(window.DRG.loop.n, B); return; }
  const f = s.fly; if (!f) return;
  const want = f.toC != null ? f.toC : 0, da = Math.atan2(Math.sin(want - f.yaw), Math.cos(want - f.yaw));
  const steer = (f.wall != null && f.wall < 12) || Math.abs(da) > 1.2 ? Math.sign(da) : 0;
  K.set('KeyA', steer > 0); K.set('KeyD', steer < 0);
};
BOTS['5-5'] = (s, K, M) => {                             // 지플백: 통에서 물 → 불티 머리를 겨눠 던짐
  const sp = (s.heads || []).find((h) => h.cue === 'spark' && !h.wet);
  if (s.held === 'none') { K.set('KeyF', false); const b = (s.barrels || []).slice().sort((p, q) => Math.hypot(p.x - K.cur.me.x, p.z - K.cur.me.z) - Math.hypot(q.x - K.cur.me.x, q.z - K.cur.me.z))[0]; if (b && K.walk(s, b.x, b.z, false, 1.4)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.8; } } return; }
  if (!sp) { K.set('KeyF', false); if (s.z) { K.stop(); K.face(s, s.z.x, s.z.z); } return; }
  const me = K.cur.me, d = Math.hypot(sp.x - me.x, sp.z - me.z);
  if (!s.aim && d > 7) { K.walk(s, sp.x, sp.z, false, 6); return; }
  K.stop();
  if (!s.aim) { if (K.face(s, sp.x, sp.z)) K.set('KeyF', true); return; }
  const c = K.cur, a = c.aim || s.aim, ex = sp.x - a.x, ez = sp.z - a.z;
  if (Math.hypot(ex, ez) < 0.6) { K.set('KeyF', false); K.set('KeyA', false); K.set('KeyD', false); K.set('KeyW', false); K.set('KeyS', false); return; }
  const my = c.camYaw, fx = Math.sin(my), fz = Math.cos(my), rx = -Math.cos(my), rz = Math.sin(my), er = ex * rx + ez * rz, ef = ex * fx + ez * fz;
  if (s.diff === 'easy') { K.set('KeyD', er > 0.3); K.set('KeyA', er < -0.3); K.set('KeyW', ef > 0.3); K.set('KeyS', ef < -0.3); return; }
  window.DRG.bot.drag(Math.max(-20, Math.min(20, er / 0.03 * 0.3)), Math.max(-20, Math.min(20, -ef / 0.03 * 0.3)));
};
/* ── 6장 ── */
BOTS['6-1'] = (s, K, M) => {                             // 안장 바느질 → 무늬 칠하기
  const b = s.bench || {};
  if (!b.kind) { if (s.at && K.walk(s, s.at.x, s.at.z, false, 1.8)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 1; } } return; }
  const c = (K.cur && K.cur.bench) || b;                 // 박자 놀이는 앞을 내다보고 누름(지금 화면)
  if (b.kind === 'stitch') { if (c.on && !M.hit && !c.tangle) { M.hit = true; K.tap('Space'); } if (!c.on) M.hit = false; return; }
  if (b.kind === 'paint') { K.set('KeyF', true); const ph = (b.t || 0) % 2; K.set('KeyD', ph < 1); K.set('KeyA', ph >= 1); K.set('KeyS', ((b.t || 0) % 3) < 1.5); }
};
BOTS['6-3'] = (s, K, M) => {                             // 발견 셋
  const f = s.found || {}, t = s.tl; const me = K.cur.me;
  if (!f.nip) { if (!M.has) { if (s.nip && K.walk(s, s.nip.x, s.nip.z, false, 1.4)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.8; M.has = true; } } } else if (t && t.x != null && K.walk(s, t.x, t.z, true, 2.6)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 1; } } return; }
  if (!f.chin) { if (s.chin && K.walk(s, s.chin.x, s.chin.z, true, 1.0)) { K.stop(); K.set('KeyF', true); } else K.set('KeyF', false); return; }
  if (!f.light) { K.set('KeyF', true); K.set('KeyW', true); K.set('KeyD', ((M.lt = (M.lt || 0) + 1 / 60) % 4) < 2); }
};
BOTS['6-4'] = (s, K, M) => {                             // 셋 진정: 예고가 보이면 옆으로 움직여 피하고 · 틈(gap)인 드래곤에게 맞는 물건
  const need = { gronckle: 'nip', nadder: 'chin', terror: 'cod' };
  const ds = (s.dragons || []).filter((d) => !d.calm); if (!ds.length) return;
  const me = K.cur.me, d = ds[0], want = need[d.kind], dd = Math.hypot(d.x - me.x, d.z - me.z);
  /* 피하기 — 예고 동안은 하던 일 · 가까운 드래곤이 쏘는 순간(예고가 꺼짐) 옆으로 구르기 */
  M.pw = M.pw || {};
  for (const x of ds) { const was = M.pw[x.kind]; M.pw[x.kind] = x.warn; if (was && !x.warn && Math.hypot(x.x - me.x, x.z - me.z) < 14 && s.diff !== 'easy') { M.rollT = 0.5; M.side = -(M.side || 1); } }
  if (M.rollT > 0) { M.rollT -= 1 / 60; K.set('KeyF', false); K.set(M.side > 0 ? 'KeyD' : 'KeyA', true); K.set(M.side > 0 ? 'KeyA' : 'KeyD', false); if (!M.rolled) { M.rolled = true; K.tap('Space'); } return; }
  M.rolled = false; K.set('KeyA', false); K.set('KeyD', false);
  if (want !== 'chin' && s.item !== want) { K.set('KeyF', false); if (dd < 4.2) { K.walk(s, me.x - (d.x - me.x), me.z - (d.z - me.z), false, 0.2); return; } K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.5; } return; }
  const gap = d.gap || s.diff === 'easy';
  const near = d.kind === 'nadder' ? 2.2 : 2.6, stand = d.kind === 'nadder' ? 3.0 : 3.4;
  if (!gap) { K.set('KeyF', false); if (dd < near) K.walk(s, me.x - (d.x - me.x), me.z - (d.z - me.z), false, 0.2); else if (dd > stand + 0.8) K.walk(s, d.x, d.z, false, stand); else { K.stop(); K.face(s, d.x, d.z); } return; }
  if (!K.walk(s, d.x, d.z, false, d.kind === 'terror' ? 1.6 : 2.6)) { K.set('KeyF', false); return; }
  K.stop(); K.face(s, d.x, d.z);
  if (want === 'chin') K.set('KeyF', true); else if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 0.5; }
};
BOTS['6-5'] = (s, K, M) => { const b = (K.cur && K.cur.bench) || s.bench || {}; if (b.kind === 'hammer') { if (b.hot && !M.hit && !b.numb) { M.hit = true; K.tap('KeyF'); } if (!b.hot) M.hit = false; return; } if (s.target && K.go(s, s.target.x, s.target.z, false, 3)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 1; } } };
BOTS['6-7'] = (s, K, M) => {                             // 다친 테러: 살금살금 생선 → 천 감기(움찔이면 떼기)
  const t = s.terror; if (!t) { K.stop(); return; }
  if (!K.walk(s, t.x, t.z, true, 1.6)) { K.set('KeyF', false); return; }
  K.stop();
  if (!s.fed) { if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 1; } return; }
  K.set('KeyF', !s.flinch);
};
BOTS['6-2'] = (s, K, M, B, lv) => {                      // 올라타기 → 비행(팀 F 봇)
  if (s.mode !== 'fly') { const t = s.tl; if (t && t.x != null) { if (K.walk(s, t.x, t.z, false, 2.8)) { K.stop(); if ((M.cd = (M.cd || 0) - 1 / 60) <= 0) { K.tap('KeyF'); M.cd = 1; } } } else B.drag(4, 0); return; }
  if (window.DRG_FLYBOT) { if (!M.fb) { K.releaseAll(); M.fb = window.DRG_FLYBOT(lv); } M.fb(window.DRG.loop.n, B); }
};
BOTS['6-6'] = (s, K, M, B, lv) => { if (s.mode === 'fly' && window.DRG_FLYBOT) { M.fb = M.fb || window.DRG_FLYBOT(lv); M.fb(window.DRG.loop.n, B); } };
Object.assign(BOTS, B0, B1, B7, B8, B9, B10, B11);          // 장마다 봇 파일(팀이 따로 씀) — 같은 꼴: (s, K, M, B, level, now)
export { BOTS };
