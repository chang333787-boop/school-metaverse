// 종장 봇 — BOTS['11-1'] = (s, K, M, B, level, now) · s = 반응 늦은 감각 · K = 몸(walk·go·face·tap·set·stop · K.cur = 지금 화면) · story_bots.js가 합침
// 화면에 보이는 것만(sense) · 키·끌기만 · 동시 키 셋 · 초당 6타
export const BOTS = {};
const DT = 1 / 60, hyp = Math.hypot;
const cd = (M, k, sec) => { M[k] = (M[k] || 0) - DT; if (M[k] <= 0) { M[k] = sec; return true; } return false; };

/* 깨어남 — 광장까지 걷기(투슬리스가 옆에서) */
BOTS['11-0'] = (s, K) => { if (s.target) K.go(s, s.target.x, s.target.z, false, 5); };
/* 새 꼬리날개 무늬 — 작업대 F → 칠하기(F 누른 채 붓 옮기기) */
BOTS['11-1'] = (s, K, M) => {
  const b = (K.cur && K.cur.bench) || s.bench || {};
  if (!b.kind) { if (s.at && K.go(s, s.at.x, s.at.z, false, 1.8)) { K.stop(); if (cd(M, 'f', 1)) K.tap('KeyF'); } return; }
  if (b.kind === 'paint') { K.set('KeyF', true); const ph = (b.t || 0) % 2; K.set('KeyD', ph < 1); K.set('KeyA', ph >= 1); }
};
/* 마을 위 날기 — 투슬리스에 올라타기(F) → 팀 F 비행 봇 */
BOTS['11-2'] = (s, K, M, B, lv) => {
  if (s.mode === 'fly') { if (window.DRG_FLYBOT) { if (!M.fb) { K.releaseAll(); M.fb = window.DRG_FLYBOT(lv); } M.fb(window.DRG.loop.n, B); } return; }
  const t = s.tl; if (t && t.x != null) { if (K.walk(s, t.x, t.z, false, 2.8)) { K.stop(); if (cd(M, 'f', 1)) K.tap('KeyF'); } } else window.DRG.bot.drag(4, 0);
};
/* 먹이 주기 — 바구니 F → 가까운 드래곤에게 살금살금 → 날 볼 때(겁 안 낼 때) F */
BOTS['11-3'] = (s, K, M) => {
  const c = K.cur, me = c.me;
  if (!c.has) { if (c.basket && K.go(c, c.basket.x, c.basket.z, false, 1.6)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
  const d = (c.dragons || []).slice().sort((a, b) => hyp(a.x - me.x, a.z - me.z) - hyp(b.x - me.x, b.z - me.z))[0];
  if (!d) { K.stop(); window.DRG.bot.drag(5, 0); return; }
  const dd = hyp(d.x - me.x, d.z - me.z);
  if (dd > 3.0) { K.go(c, d.x, d.z, true, 2.9); return; }                         // 살금살금(Shift 켬)
  K.stop(); K.face(c, d.x, d.z);
  if (s.dragons && s.dragons.some((x) => x.kind === d.kind && x.facingMe && x.pupil > 0.45) && cd(M, 'f', 1.6)) K.tap('KeyF');
};
/* 낚시 — 던지기 → 쏙 가라앉을 때 F → 당기는 반대쪽 키 */
BOTS['11-4'] = (s, K, M) => {
  if (s.state === 'cast') { K.set('KeyA', false); K.set('KeyD', false); if (cd(M, 'f', 1.2)) K.tap('KeyF'); return; }
  if (s.state === 'wait') { if (s.bob === 'sink' && !M.hooked) { M.hooked = true; K.tap('KeyF'); } if (s.bob !== 'sink') M.hooked = false; return; }
  if (s.state === 'fight') { K.set('KeyA', s.pull > 0); K.set('KeyD', s.pull < 0); }
};
/* 책 채우기 — 가까운 과녁 쪽으로 살금살금 → 6~8m에서 멈춰 바라봄 · 놀라면 물러났다가 다시 */
BOTS['11-5'] = (s, K, M) => {
  const c = K.cur, me = c.me;
  M.seen = M.seen || {};
  for (const t of c.targets || []) M.seen[t.kind] = t;
  for (const k in M.seen) if (!(c.targets || []).some((t) => t.kind === k) && hyp(M.seen[k].x - me.x, M.seen[k].z - me.z) < 14) delete M.seen[k];   // 다 본 것(또는 가까이서 안 보이면) 지움
  const t = Object.values(M.seen).sort((a, b) => hyp(a.x - me.x, a.z - me.z) - hyp(b.x - me.x, b.z - me.z))[0];
  if (!t) { K.stop(); window.DRG.bot.drag(5, (M.T = (M.T || 0) + DT) % 4 < 2 ? -3 : 3); return; }
  const dd = hyp(t.x - me.x, t.z - me.z);
  if (t.scared && dd < 9) { const ax = me.x - t.x, az = me.z - t.z, L = hyp(ax, az) || 1; K.walk(c, t.x + ax / L * 10, t.z + az / L * 10, true, 0.6); return; }
  if (dd > 7.5) { K.go(c, Math.round(t.x / 3) * 3, Math.round(t.z / 3) * 3, dd < 13, 7.0); return; }   // 멀면 그냥 걷고 13m 안에서 살금살금(움직이는 과녁은 3m 칸으로 — 길을 매번 다시 찾지 않게)
  if (dd < 5) { const ax = me.x - t.x, az = me.z - t.z, L = hyp(ax, az) || 1; K.walk(c, t.x + ax / L * 6.5, t.z + az / L * 6.5, true, 0.4); return; }
  K.stop();
  if (!me.low) { if (cd(M, 'sh', 0.6)) K.tap('ShiftLeft'); return; }
  K.face(c, t.x, t.z);
};

/* ── 다음 날(팀 J) ── */
/* 이웃 둘 — ⓐ 풀 F → 지붕 밑에서 F 꾹 → (뛰지 않고) 살금살금 쉼터로 · 그롱클이 처지면 기다림 ⓑ 내더에게 16m 안부터 살금살금 → 2.3m에서 F(가시가 서면 물러남) */
BOTS['11-6'] = (s, K, M) => {
  const c = K.cur, me = c.me, st = c.st || {};
  if (c.gr) { M.grx = c.gr.x; M.grz = c.gr.z; }
  if (st.A !== 'done') {
    if (!c.has) { K.set('KeyF', false); if (K.go(c, c.nip.x, c.nip.z, false, 1.6)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
    if (st.A === 'roof' || st.A === 'lost') {
      const tx = st.A === 'roof' || M.grx == null ? c.lure.x : M.grx, tz = st.A === 'roof' || M.grz == null ? c.lure.z : M.grz;
      if (K.go(c, tx, tz, false, st.A === 'roof' ? 2.5 : 3.0)) { K.stop(); if (c.gr) K.face(c, c.gr.x, c.gr.z); K.set('KeyF', true); } else K.set('KeyF', false);
      return;
    }
    K.set('KeyF', false);
    if (st.A === 'hop') { K.stop(); return; }
    if (M.grx != null && hyp(M.grx - me.x, M.grz - me.z) > 4.5) { K.stop(); return; }        // 그롱클을 기다림
    K.go(c, c.rest.x, c.rest.z, true, 1.2);
    return;
  }
  K.set('KeyF', false);
  if (st.B === 'calm') { K.stop(); return; }
  if (c.nd) { M.ndx = c.nd.x; M.ndz = c.nd.z; }
  if (M.ndx == null) { K.stop(); window.DRG.bot.drag(5, 0); return; }
  const dd = hyp(M.ndx - me.x, M.ndz - me.z);
  if (s.nd && s.nd.spines) { const ax = me.x - M.ndx, az = me.z - M.ndz, L = hyp(ax, az) || 1; if (dd < 8) K.walk(c, M.ndx + ax / L * 9, M.ndz + az / L * 9, true, 0.6); else K.stop(); return; }
  if (dd > 4.5) { K.go(c, Math.round(M.ndx / 2) * 2, Math.round(M.ndz / 2) * 2, dd < 16, 3.2); return; }   // 움직이는 과녁은 2m 칸으로(길을 매번 다시 찾지 않게)
  if (dd > 2.3) { K.walk(c, M.ndx, M.ndz, true, 2.3); return; }
  K.stop(); K.face(c, M.ndx, M.ndz);
  if (!me.low) { if (cd(M, 'sh', 0.6)) K.tap('ShiftLeft'); return; }
  if (cd(M, 'f', 1.6)) K.tap('KeyF');
};
/* 다친 야생 드래곤 — 도끼는 안 듦(들었으면 바로 내려놓음) · 16m 안부터 살금살금 → 3.3m에서 멈춰 F 꾹 → 다친 곳을 보고 수레에서 맞는 것 → 2.5m에서 F */
const CURE = { wing: 'cloth', leg: 'nip', hot: 'bucket' };
BOTS['11-7'] = (s, K, M) => {
  const c = K.cur, me = c.me, D = c.D;
  if (D) { M.dx = D.x; M.dz = D.z; if (D.wound) M.wound = D.wound; }
  if (c.item === 'axe') { K.set('KeyF', false); if (cd(M, 'f', 0.6)) K.tap('KeyF'); return; }
  if (c.stage === 'calm') {
    if (M.dx == null) { K.stop(); K.set('KeyF', false); window.DRG.bot.drag(5, 0); return; }
    const d = hyp(M.dx - me.x, M.dz - me.z);
    if (d > 3.3) { K.set('KeyF', false); K.go(c, M.dx, M.dz, d < 16, 3.1); return; }
    K.stop();
    if (!me.low) { K.set('KeyF', false); if (cd(M, 'sh', 0.6)) K.tap('ShiftLeft'); return; }
    K.set('KeyF', true);
    return;
  }
  K.set('KeyF', false);
  if (c.stage !== 'heal') { K.stop(); return; }
  const want = M.wound ? CURE[M.wound] : null;
  if (!want) { if (M.dx != null) K.go(c, M.dx, M.dz, true, 4.5); return; }   // 다친 곳이 보이게 가까이
  if (c.item !== want) { const sp = (c.cart || []).find((q) => q.n === want); if (sp && K.go(c, sp.x, sp.z, false, 0.6)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
  if (M.dx != null && K.go(c, M.dx, M.dz, false, 2.5)) { K.stop(); K.face(c, M.dx, M.dz); if (cd(M, 'f', 1.2)) K.tap('KeyF'); }
};
/* 우박 — 둘러봐서 투슬리스를 찾아 둠 → 하늘이 어두워지거나 날개를 펴면 그 곁으로 · 닿으면 가만히 */
BOTS['11-8'] = (s, K, M) => {
  const c = K.cur;
  if (c.tl) { M.tx = c.tl.x; M.tz = c.tl.z; M.tm = c.tl.moving; }
  if (M.tx == null) { K.stop(); window.DRG.bot.drag(6, 0); return; }
  if ((s.dark || s.wings) && !M.tm) { if (K.go(c, M.tx, M.tz, false, 2.0)) K.stop(); return; }
  K.stop();
};
/* 스콜드런 — 물가에서 F(드래곤 11m 안이면 살금살금) → 살금살금 3m → 날 볼 때 F · 물줄기 예고가 보이면 물러남 */
BOTS['11-9'] = (s, K, M) => {
  const c = K.cur, me = c.me, d = c.sc;
  if (d) { M.sx = d.x; M.sz = d.z; }
  const ds = M.sx == null ? 99 : hyp(M.sx - me.x, M.sz - me.z);
  if (s.warn) { if (M.sx != null && ds < 10) { const ax = me.x - M.sx, az = me.z - M.sz, L = hyp(ax, az) || 1; K.walk(c, M.sx + ax / L * 11, M.sz + az / L * 11, false, 0.6); } else K.stop(); return; }
  if (!c.full) { if (c.water && K.go(c, c.water.x, c.water.z, ds < 11, 1.8)) { K.stop(); if (cd(M, 'f', 0.8)) K.tap('KeyF'); } return; }
  if (M.sx == null) { K.stop(); window.DRG.bot.drag(5, 0); return; }
  if (ds > 3.0) { K.go(c, M.sx, M.sz, true, 2.8); return; }
  K.stop(); K.face(c, M.sx, M.sz);
  if (!me.low) { if (cd(M, 'sh', 0.6)) K.tap('ShiftLeft'); return; }
  if (s.sc && s.sc.facingMe && cd(M, 'f', 1.4)) K.tap('KeyF');
};
/* 배 타기 — 노(팀 F 배 봇) → 던지기 → 쏙 F → 당기는 반대쪽(11-4와 같은 손) */
BOTS['11-10'] = (s, K, M, B, lv) => {
  if (s.state === 'row') { if (s.mode === 'boat' && window.DRG_BOATBOT) { M.bb = M.bb || window.DRG_BOATBOT('beat', lv); M.bb(window.DRG.loop.n, B); } return; }
  BOTS['11-4'](s, K, M);
};
