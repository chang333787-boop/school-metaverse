// 🎁 나눠 주기 단계 시험(SHARE-1 · 사용자 11-02 '이웃에게 나눠 주기 할 때 상인들한테는 안 나눠지는데 상인도 ! 떠서 헷갈림 · 염전에게 주었는데 양몰기하고 친해짐')
//   ① 1-2 텃밭 장 'share'(아무 이웃에게) 목표 = 장터 상인 X(상인 곁에 서도)  ② 상인 곁에서 선물 = 까닭 한 줄('장터 상인은 사고팔기만')
//   ③ 염전 일꾼에게 주면 '염전 일꾼에게 전했어요'(쪽지 준 이웃 이름 X)  ④ 장 끝 마음 띠 = '쪽지를 맡긴 ○○과/와' · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, BASE = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async n => { if (!SHOTS) return; await W8(250); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); };
    await p.goto(BASE); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.storyAt, null, { timeout: 240000 }); await W8(2500);
    /* 띠·토스트·말 기록(그대로 부름) */
    await ev(() => { const H = SD2.map.hud, R = window.__T9 = []; for (const k of ['banner', 'toast']) { const f = H[k].bind(H); H[k] = (t, ...a) => { R.push(k + ':' + t); return f(t, ...a); }; } });
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.min = 11 * 60; G.S.story = G.S.story || {}; G.S.story.done = Object.assign(G.S.story.done || {}, { p0: 1, a1_1: 1 }); G.S.story.p0auto = 1; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; if (G.S.emerg) { G.S.emerg.d = G.S.day; G.S.emerg.plan = []; } SM_TOWN.rules.wx('clear'); });
    const W = await ev(() => SM_TOWN.workers ? SM_TOWN.workers() : null);
    console.log('  일꾼 수', W ? W.length : 'API 없음');
    /* 장 열기 → 고르기(plan)에서 '나눠 주기' 누르기 */
    const ci = await ev(() => SM_TOWN.storyAt('c3', 6));
    ok(ci, '1-2 텃밭 장 plan 단계 열기');
    let picked = false;
    for (let i = 0; i < 40 && !picked; i++) { await W8(300); picked = await ev(() => { const d = document.querySelector('.twn-dlg .dbox'); if (d) { d.click(); return false; } const B = [...document.querySelectorAll('.twn-p [data-k]')], q = B.find(x => x.getAttribute('data-k') === 'share'); if (q) { q.click(); return true; } return false; }); }
    if (picked) { await W8(400); await ev(() => { const B = [...document.querySelectorAll('.twn-p button')].find(x => /확인|골랐|다 골랐|정했/.test(x.textContent)); if (B) B.click(); }); }
    let sid = ''; for (let i = 0; i < 30; i++) { await W8(300); sid = await ev(() => { const s = SM_TOWN.story(); return s.cur + ':' + (s.step && s.step.id); }); if (/share/.test(sid)) break; await ev(() => { const d = document.querySelector('.twn-dlg .dbox'); if (d) d.click(); }); }
    ok(/c3:share/.test(sid), 'share 단계에 옴(' + sid + ')');
    await ev(() => { const S = SM_TOWN.story().S; S.v.who = 'pasture'; });
    /* ① 장터 상인 곁 = 목표가 상인이 아님 */
    const stall = await ev(() => { const w = SM_TOWN.workers().find(q => q[4] === 'stall'); return w ? [w[1], w[2]] : null; });
    ok(!!stall, '장터 상인 있음');
    if (stall) { await ev(([x, z]) => { x += 1.2; z += 1.2; SD2.map.player.teleport([x, SD2.map.q.groundAt(x, z, SM_TOWN.ground(x, z) + 3) + 0.05, z]); }, stall); await W8(900);
      const T = await ev(() => SM_TOWN.storyTarget()); ok(T && !/장터 상인|market seller/.test(T.name || ''), '상인 곁에서도 목표 = 상인 X(' + (T && T.name) + ')');
      await ev(() => { const G = SM_TOWN.game(); G.add('🥬', 2); }); await ev(() => { window.__T9.length = 0; SM_TOWN.bagOpen(); }); await W8(700);
      const say1 = await ev(() => { const e = document.querySelector('.twn-p'); return e ? e.innerText : ''; });
      ok(/장터 상인은 사고팔기만/.test(say1), '상인 곁 가방 = 까닭 한 줄'); ok(!/data-gift/.test(await ev(() => (document.querySelector('.twn-p') || {}).innerHTML || '')), '상인 곁 = 🎁 단추 없음'); await shot('stall'); }
    /* ② 염전 일꾼에게 주기 */
    const salt = await ev(() => { const w = SM_TOWN.workers().find(q => q[4] === 'saltpan'); return w ? [w[1], w[2]] : null; });
    ok(!!salt, '염전 일꾼 있음');
    if (salt) { await ev(() => { const c = document.querySelector('.twn-p .x, .twn-p [data-close]'); if (c) c.click(); }); await p.keyboard.press('Escape'); await W8(300); await ev(([x, z]) => { x += 1.5; SD2.map.player.teleport([x, SD2.map.q.groundAt(x, z, SM_TOWN.ground(x, z) + 3) + 0.05, z]); }, salt); await W8(1200);
      await ev(() => { window.__T9.length = 0; SM_TOWN.bagOpen(); }); await W8(500); await ev(() => { const b = document.querySelector('.twn-p [data-gift="🥬"]'); if (b) b.click(); }); await W8(2500);
      const s2 = await ev(() => ({ T: window.__T9.join(' | '), sid: (() => { const s = SM_TOWN.story(); return s.cur + ':' + (s.step && s.step.id); })(), log: JSON.stringify(SM_TOWN.story().S.log || '').slice(-300) }));
      console.log('    기록', s2.T.slice(0, 300));
      ok(/염전 일꾼에게 전했어요/.test(s2.T + s2.log) || /염전 일꾼에게 전했어요/.test(await ev(() => document.body.innerText)), '받은 사람 이름 = 염전 일꾼');
      ok(!/목장 일꾼에게 전했어요/.test(s2.T + s2.log), '쪽지 준 이웃(목장) 이름 X');
      ok(/c3:why/.test(s2.sid), '다음 단계 = 수첩(' + s2.sid + ')'); await shot('salt'); }
    ok(errs.length === 0, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  } finally { await b.close(); }
  console.log(fails.length ? 'SHARE FAIL ' + fails.length : 'SHARE PASS'); process.exit(fails.length ? 1 : 0);
})();
