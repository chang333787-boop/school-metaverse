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
