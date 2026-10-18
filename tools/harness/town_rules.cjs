// 제한을 다 쓴 상태로 이야기 진행 시험(RULES-1 · 사용자 10-18 '그런 것들 좀 세밀하게 · 12월 학기말 오픈베타'): node tools/harness/town_rules.cjs [마을=ourtown] [포트=8002]
//   가장 나쁜 날 = 일터·선물 하루 몫 다 씀(GAME.uses → 99) · 돈 0 · 밤 23시(가게 닫힘 · 시계 멈춤) · 비 — 그래도 이야기 단계는 나아가야 함(docs/systems/town_rules.md 원칙 ①)
//   ① 1-2 목장 같이 일하기 ② 모자란 물건(감자)이 나는 일터 ③ 이야기 없음 = 연습 판(받는 것 없음) ④ 심부름 사기(닫힌 마트 · 돈 0) ⑤ 가게 둘러보기(닫힌 마트에 들어감)
//   ⑥ 심부름 선물(하루 하나 다 씀) ⑦ 겨울 텃밭(이야기 = 배추 · 아니면 언제·어떻게 한 줄) ⑧ 여름 논(이야기 = 모내기) ⑨ 저녁·밤까지 쉬기(앞으로만 · 날짜 그대로)
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), toast = () => ev(() => { const t = document.getElementById('toast'); return t && t.getClientRects().length ? t.textContent : ''; });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.rules, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(800);
    const st = () => ev(() => { const s = SM_TOWN.story(); return { cur: s.cur, i: s.S ? s.S.i : null, v: s.S ? s.S.v : null }; });
    const close = async () => { await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(300); };
    const worst = () => ev(() => { const G = SM_TOWN.game(), S = G.S; if (!G.__uses0) G.__uses0 = G.uses; G.uses = () => 99; G.setClock(false); S.min = 23 * 60; S.money = 0; SM_TOWN.rules.wx('rain'); });
    await worst(); await W8(600); ok(await ev(() => SM_TOWN.wx().WX9 === 'rain' && SM_TOWN.game().S.min === 23 * 60), '가장 나쁜 날: 비 · 23시 · 돈 0 · 하루 몫 다 씀');
    // ① 1-2 목장 같이 일하기
    await ev(() => SM_TOWN.storyAt('a1_3', 1)); await W8(400); await close(); await worst();
    await ev(() => SM_TOWN.rules.work('pasture')); await W8(400); let pl = await ev(() => SM_TOWN.rules.play()); ok(pl && !pl.pr, '① 이야기 같이 일하기 = 하루 셋을 다 써도 진짜 판 ' + JSON.stringify(pl));
    { const s0 = await st(); await ev(() => SM_TOWN.rules.playEnd(3)); await W8(1500); const s1 = await st(); ok(s1.cur !== s0.cur || s1.i > s0.i, '① 판이 끝나면 이야기가 나아감 ' + JSON.stringify([s0.cur, s0.i, s1.cur, s1.i])); }
    // ② 지금 단계에 모자란 물건(감자)이 나는 일터
    await ev(() => SM_TOWN.storyAt('c4', 2)); await W8(400); await close(); await worst(); await ev(() => { const B = SM_TOWN.game().S.bag; for (const e of ['🥔', '🥬', '🧂']) delete B[e]; });
    ok((await ev(() => SM_TOWN.rules.wants())).includes('🥔'), '② 모자란 물건 = 감자');
    await ev(() => SM_TOWN.rules.work('potato')); await W8(400); pl = await ev(() => SM_TOWN.rules.play()); ok(pl && !pl.pr, '② 감자 일터 = 하루 셋을 다 써도 진짜 판');
    await ev(() => SM_TOWN.rules.playEnd(3)); await W8(700); ok((await ev(() => SM_TOWN.game().S.bag['🥔'] || 0)) > 0, '② 감자가 가방에');
    // ③ 이야기 없음 = 연습 판
    await ev(() => SM_TOWN.storyOff()); await W8(300); await close(); await worst();
    { const b0 = await ev(() => ({ p: SM_TOWN.game().S.bag['🥔'] || 0, m: SM_TOWN.game().S.money })); await ev(() => SM_TOWN.rules.work('potato')); await W8(400); pl = await ev(() => SM_TOWN.rules.play()); ok(pl && pl.pr, '③ 이야기 없이 몫을 다 쓰면 연습 판(놀이는 열림)'); ok(/연습/.test(await toast()) && /6시/.test(await toast()), '③ 언제 다시 받는지 한 줄: ' + (await toast()).slice(0, 60));
      await ev(() => SM_TOWN.rules.playEnd(3)); await W8(700); const b1 = await ev(() => ({ p: SM_TOWN.game().S.bag['🥔'] || 0, m: SM_TOWN.game().S.money })); ok(b1.p === b0.p && b1.m === b0.m, '③ 연습 판은 받는 것 없음 ' + JSON.stringify([b0, b1])); }
    // ④ 심부름 사기: 닫힌 마트 · 돈 0
    const shops = await ev(() => SM_TOWN.shops()); const mart = shops.find(q => q.kind === 'grocery');
    if (!mart) ok(false, '④ 마트 없음'); else {
      await ev(() => SM_TOWN.storyAt('c1', 5)); await W8(500); await close(); await worst(); await ev(() => { for (const e of ['🌾', '🥚', '🥛']) delete SM_TOWN.game().S.bag[e]; });
      const op = await ev(n => SM_TOWN.rules.shop(n), mart.name); ok(op, '④ 23시 닫힌 ' + mart.name + ' = 심부름이라 열림'); ok(/심부름/.test(await toast()), '④ 까닭 한 줄: ' + (await toast()).slice(0, 50));
      for (const e of ['🌾', '🥚', '🥛']) { await ev(e9 => { const b9 = document.querySelector('.twn-p [data-b="' + e9 + '"]'); if (b9) b9.click(); }, e); await W8(450); }
      await W8(1500); const s1 = await st(), m1 = await ev(() => SM_TOWN.game().S.money); ok(s1.cur === 'c1' && s1.i > 5, '④ 돈 0이어도 심부름 물건 셋을 사고 다음 단계로 ' + JSON.stringify([s1.cur, s1.i])); ok(m1 >= 0, '④ 돈은 0 밑으로 안 감 (' + m1 + ')'); await close();
      // ⑤ 둘러보기: 닫힌 마트에 들어감
      await ev(() => SM_TOWN.storyAt('c1', 3)); await W8(400); await close(); await worst();
      await ev(n => SM_TOWN.rules.goIn(n), mart.name); await W8(4200); const s5 = await st(), inn = await ev(() => SM_TOWN.indoor.state()); ok(!!(s5.v && s5.v.seen && s5.v.seen.grocery), '⑤ 23시에도 둘러보기(들어가 값 보기)가 셈 ' + JSON.stringify(inn).slice(0, 80));
      await ev(() => SM_TOWN.indoor.exit()); await W8(2600); }
    // ⑥ 심부름 선물: 하루 하나 다 씀
    await ev(() => SM_TOWN.storyAt('c2', 3)); await W8(400); await close(); await worst();
    { const who = (await st()).v.who, w = await ev(k => SM_TOWN.rules.wk(k), who); if (!w) ok(false, '⑥ 받는 일꾼 없음 ' + who); else {
        await ev(q => { const G = SM_TOWN.game(); G.S.bag['🥤'] = 1; const x = (q.hx ?? q.x) + 1.2, z = (q.hz ?? q.z) + 0.6; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, w); await W8(600);
        const s0 = await st(); await ev(() => SM_TOWN.rules.gift('🥤')); await W8(1600); const s1 = await st(); ok(s1.cur !== s0.cur || s1.i > s0.i, '⑥ 하루 선물을 다 써도 심부름 선물은 전해짐 ' + JSON.stringify([s0.i, s1.cur, s1.i, (await toast()).slice(0, 40)])); } }
    // ⑦ 겨울 텃밭
    await ev(() => SM_TOWN.storyOff()); await ev(() => SM_TOWN.rules.season('winter')); await W8(9000); await worst(); await ev(() => { SM_TOWN.game().S.farm = []; });
    await ev(() => SM_TOWN.rules.farmUse(0)); await W8(500); ok(!(await ev(() => !!document.querySelector('.twn-p [data-c]'))) && /겨울/.test(await toast()), '⑦ 이야기 없는 겨울 = 심기 X + 언제 한 줄: ' + (await toast()).slice(0, 40)); await close();
    await ev(() => SM_TOWN.storyAt('c3', 1)); await W8(400); await close(); await worst(); await ev(() => SM_TOWN.rules.farmUse(0)); await W8(500); ok(await ev(() => !!document.querySelector('.twn-p [data-c="🥬"]')), '⑦ 이야기 거두기 단계 = 겨울에도 배추를 심을 수 있음'); await close();
    // ⑧ 여름 논
    await ev(() => SM_TOWN.storyOff()); await ev(() => SM_TOWN.rules.season('summer')); await W8(9000); await worst();
    await ev(() => SM_TOWN.rules.work('paddy')); await W8(400); ok(!(await ev(() => SM_TOWN.rules.play())) && /봄|가을/.test(await toast()), '⑧ 이야기 없는 여름 논 = 언제 한 줄: ' + (await toast()).slice(0, 40));
    await ev(() => SM_TOWN.storyAt('a2_2', 3)); await W8(400); await close(); await worst(); await ev(() => SM_TOWN.rules.work('paddy')); await W8(400); pl = await ev(() => SM_TOWN.rules.play()); ok(pl && !pl.pr, '⑧ 이야기 논 일 = 여름에도 모내기 판 ' + JSON.stringify(pl)); await ev(() => SM_TOWN.rules.playEnd(0)); await W8(500);
    // ⑨ 저녁·밤까지 쉬기
    await ev(() => SM_TOWN.storyOff()); await ev(() => { SM_TOWN.game().S.min = 10 * 60; }); const d0 = await ev(() => SM_TOWN.game().S.day);
    await ev(() => SM_TOWN.rules.rest()); await W8(2200); const m17 = await ev(() => SM_TOWN.game().S.min); await ev(() => SM_TOWN.rules.rest()); await W8(2200); const m19 = await ev(() => SM_TOWN.game().S.min), d1 = await ev(() => SM_TOWN.game().S.day), e19 = await ev(() => SM_TOWN.rules.eve());
    ok(m17 === 17 * 60 && m19 === 19 * 60 && d1 === d0 && !e19, '⑨ 10시 → 17시 → 19시 · 날짜 그대로 · 밤엔 단추 없음 ' + JSON.stringify([m17, m19, d0, d1]));
    await ev(() => { const G = SM_TOWN.game(); if (G.__uses0) G.uses = G.__uses0; });
    ok(!errs.length, '오류 0 ' + errs.join(' | '));
  } finally { await b.close(); }
  console.log('\n요약: 실패 ' + fails.length + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error(e); process.exit(2); });
