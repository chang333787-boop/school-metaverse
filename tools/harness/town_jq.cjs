// 🔎 J 검색 두 갈래 시험(JQ-2 · 사용자 10-24 'J에서 검색하고 누를 때 무조건 이동이 아니라 빨간 선만 하고 싶을 수도'): node tools/harness/town_jq.cjs [마을=ourtown] [포트=8002]
//   GO-1(11-01)부터: ① 치면 결과마다 단추 하나(따로 있던 🚌 작은 단추 X)  ② Enter = 창 없이 맨 위로 빨간 선 · 자리 그대로 · 순간이동 수 그대로  ③ 결과를 누르면 고르기 창 → 🚌 바로 가기 = 그 앞으로 가고 수가 하나 줆  ④ 휴대폰 폭(390)에서 결과·창 단추 44px 이상 · 오류 0 (전수는 town_go.cjs)
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { for (const vw of [[1280, 720], [390, 800]]) { console.log('— 화면 ' + vw.join('×'));
    const p = await (await b.newContext({ viewport: { width: vw[0], height: vw[1] }, hasTouch: vw[0] < 500 })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.routePts, null, { timeout: 240000 }); await W8(2500);
    for (let i = 0; i < 5 && await ev(() => !!document.querySelector('.twn-p,.twn-dlg')); i++) { await p.keyboard.press('Escape'); await W8(300); }
    const tpn = () => ev(() => SM_TOWN.game().S.tpn | 0), pos = () => ev(() => { const q = SD2.map.player.get(); return [q.x, q.z]; });
    const openJ = async t => { await p.keyboard.press('KeyJ'); await W8(500); await ev(t => { const q = document.querySelector('.twn-p .jq'); q.value = t; q.dispatchEvent(new Event('input')); }, t); await W8(200); };
    await openJ('마트'); const R = await ev(() => [...document.querySelectorAll('.twn-p .jr button[data-gd]')].map(x => ({ t: x.innerText.replace(/\s+/g, ' '), h: x.offsetHeight, w: x.offsetWidth })));
    ok(R.length >= 1 && !(await ev(() => !!document.querySelector('.twn-p .jr .jgo, .twn-p .jr .jx'))), '결과 ' + R.length + '개 = 장소마다 단추 하나 (' + JSON.stringify(R[0]) + ')'); ok(R.length && R[0].h >= 44, '결과 단추 높이 ' + (R[0] ? R[0].w + '×' + R[0].h : '-'));
    const p0 = await pos(), n0 = await tpn(); await ev(() => document.querySelector('.twn-p .jq').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))); await W8(700);
    const p1 = await pos(), rt = await ev(() => SM_TOWN.routePts()); ok(!(await ev(() => !!document.querySelector('.twn-p'))), 'Enter = 창 닫힘'); ok(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 1, 'Enter = 자리 그대로(순간이동 X)'); ok(rt && rt.length > 1, '빨간 선 생김(' + (rt ? rt.length : 0) + '점)'); ok((await tpn()) === n0, '순간이동 수 그대로(' + n0 + ')');
    await openJ('마트'); await ev(() => document.querySelector('.twn-p .jr button[data-gd]').click()); await W8(400); const G = await ev(() => SM_TOWN.go().info()); ok(!!G && G.g.h >= 44 && G.j.h >= 44, '결과 누름 = 고르기 창(' + (G ? G.name + ' · 단추 ' + G.g.h + '/' + G.j.h + 'px' : '없음') + ')'); await ev(() => SM_TOWN.go().pick('j')); await W8(2600); for (let i = 0; i < 4 && await ev(() => !!document.querySelector('.twn-p,.twn-dlg')); i++) { await p.keyboard.press('Escape'); await W8(300); }
    const p2 = await pos(), n2 = await tpn(); ok(Math.hypot(p2[0] - p0[0], p2[1] - p0[1]) > 20, '🚌 = 그곳 앞으로 감(' + Math.round(Math.hypot(p2[0] - p0[0], p2[1] - p0[1])) + 'm)'); const free = !!(G && G.left < 0); ok(free ? n2 === n0 : n2 === n0 + 1, free ? '순간이동 공짜 모드(all=1 · 선생님) = 수 표시 없음 · 그대로' : '순간이동 수 하나 씀(' + n0 + ' → ' + n2 + ')');
    ok(!errs.length, '페이지 오류 0 ' + errs.join(' | ')); await p.close(); }
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } await b.close(); console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
