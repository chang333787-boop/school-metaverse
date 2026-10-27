// 🔔 알림 잃음 막기(NOTE-1 · 코덱스 10-27 표 4) — node tools/harness/town_note.cjs [마을=ourtown] [포트=8002]
//   ① 동시에 알림 넷(저절로 둘 + 중요 둘) → 중요 둘은 다 화면에 뜨고 본 뒤에 cb · 지난 알림에 '봤음'
//   ② 창이 열린 동안 중요 알림 = 기다림(창 뒤에 뜨지 않음) → 창을 닫으면 뜸
//   ③ 중요 넷이 한꺼번에(창 열림) → 줄은 셋 · 넘친 것은 ☰ 🔔 지난 알림에 '못 봄'으로 · 열면 봄
//   ④ 페이지 오류 0 · 브라우저는 GPU 옵션 · 끝나면 닫음
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const errs = [];
(async () => {
  const b = await chromium.launch({ args: GPU }); const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  try {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 160)); });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.sayN, null, { timeout: 240000 }); await p.waitForTimeout(1200);
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(600);
    for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
    await p.evaluate(() => { const S = SM_TOWN.game().S; S.story = S.story || {}; S.story.done = { ...(S.story.done || {}), p0: 1 }; S.story.cur = null; S.story.p0auto = 1; document.querySelectorAll('.twn-p').forEach(e => e.remove()); });
    await p.waitForTimeout(5000); await p.evaluate(() => { for (let i = 0; i < 3; i++) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    /* 화면에 뜬 알림 글을 0.15초마다 모음(창 = 열린 .twn-p 있음) */
    await p.evaluate(() => { window.__seen = []; window.__cb = []; setInterval(() => { const t = document.getElementById('toast'), x = t && t.style.display !== 'none' ? t.textContent : ''; if (x && window.__seen[window.__seen.length - 1] !== x) window.__seen.push(x); }, 150); });
    const panelOpen = () => p.evaluate(() => !!document.querySelector('.twn-p'));
    if (await panelOpen()) { await p.keyboard.press('Escape'); await p.waitForTimeout(500); }
    console.log('① 동시에 넷');
    await p.evaluate(() => { SM_TOWN.say('🍃 시험 저절로 가', 3, 1); SM_TOWN.say('📒 시험 중요 하나', 3, 2, () => __cb.push(1)); SM_TOWN.say('🍃 시험 저절로 나', 3, 1); SM_TOWN.say('📒 시험 중요 둘', 3, 2, () => __cb.push(2)); });
    await p.waitForTimeout(14000);
    let R = await p.evaluate(() => ({ seen: __seen.slice(), cb: __cb.slice(), ntf: SM_TOWN.ntf().filter(o => /시험 중요/.test(o.t)), n: SM_TOWN.sayN() }));
    console.log('    뜬 차례: ' + R.seen.filter(t => /시험/.test(t)).join(' → '));
    ok(R.seen.some(t => /시험 중요 하나/.test(t)) && R.seen.some(t => /시험 중요 둘/.test(t)), '중요 둘 다 화면에 뜸');
    ok(R.cb.length === 2 && R.cb[0] === 1 && R.cb[1] === 2, '본 뒤에 cb 둘(차례대로 · ' + R.cb.join(',') + ')');
    ok(R.ntf.length === 2 && R.ntf.every(o => o.s === 1), '지난 알림 둘 = 봤음');
    console.log('    저절로 알림(버려도 됨) 뜬 수 ' + R.seen.filter(t => /시험 저절로/.test(t)).length + ' · 버림 ' + R.n.drop);
    console.log('② 창이 열린 동안 = 기다림');
    await p.evaluate(() => { __seen.length = 0; SM_TOWN.menu(); }); ok(await panelOpen(), '메뉴 창 열림');
    await p.evaluate(() => SM_TOWN.say('📒 시험 창 뒤 중요', 3, 2, () => __cb.push(3)));
    await p.waitForTimeout(2600); R = await p.evaluate(() => ({ seen: __seen.slice(), n: SM_TOWN.sayN(), cb: __cb.slice() }));
    ok(!R.seen.some(t => /창 뒤 중요/.test(t)) && R.n.q2.some(t => /창 뒤 중요/.test(t)) && !R.cb.includes(3), '창이 열린 동안 안 뜨고 줄에 있음');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400); if (await panelOpen()) await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); });
    await p.waitForTimeout(3500); R = await p.evaluate(() => ({ seen: __seen.slice(), cb: __cb.slice() }));
    ok(R.seen.some(t => /창 뒤 중요/.test(t)) && R.cb.includes(3), '창을 닫으니 뜨고 본 뒤 cb');
    console.log('③ 중요 넷 한꺼번에(창 열림) → 셋 줄 · 넘친 것은 지난 알림');
    await p.evaluate(() => { __seen.length = 0; SM_TOWN.menu(); for (const k of ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ']) SM_TOWN.say('📒 시험 넘침 ' + k, 3, 2); });
    R = await p.evaluate(() => ({ n: SM_TOWN.sayN(), ntf: SM_TOWN.ntf().filter(o => /넘침/.test(o.t)) }));
    ok(R.n.q2.length === 3 && !R.n.q2.some(t => /넘침 ㄱ/.test(t)) && R.n.over >= 1, '줄 = 셋(' + R.n.q2.map(t => t.slice(-1)).join('') + ') · 넘침 ' + R.n.over);
    ok(R.ntf.length === 4 && R.ntf.find(o => /넘침 ㄱ/.test(o.t)).s === 0, '넘친 ㄱ = 지난 알림에 못 봄');
    await p.evaluate(() => SM_TOWN.menu()); const btn = await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="ntf"]'); return b9 ? b9.textContent : ''; }); ok(/지난 알림/.test(btn) && /●/.test(btn), '메뉴 단추 = ' + btn);
    await p.evaluate(() => document.querySelector('.twn-p [data-a="ntf"]').click()); await p.waitForTimeout(300);
    const box = await p.evaluate(() => (document.querySelector('.twn-p') || {}).innerText || ''); ok(/넘침 ㄱ/.test(box) && /못 봄/.test(box), '🔔 지난 알림 창에 ㄱ · 못 봄');
    ok(await p.evaluate(() => SM_TOWN.ntf().every(o => o.s === 1 || /넘침 [ㄴㄷㄹ]/.test(o.t))), '창을 열어 본 것 = 봤음(줄에 남은 셋 빼고)');
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(16000);
    R = await p.evaluate(() => ({ seen: __seen.slice(), ntf: SM_TOWN.ntf().filter(o => /넘침/.test(o.t)) }));
    ok(['ㄴ', 'ㄷ', 'ㄹ'].every(k => R.seen.some(t => t.endsWith(k))) && R.ntf.every(o => o.s === 1), '창을 닫은 뒤 ㄴ·ㄷ·ㄹ 차례로 뜨고 모두 봤음(' + R.seen.filter(t => /넘침/.test(t)).map(t => t.slice(-1)).join('') + ')');
    await p.close();
  } catch (e) { console.error(e); fails++; }
  console.log('페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
