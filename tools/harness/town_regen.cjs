// 🔁 다시 살아나는 것 시험(REGEN-1 · v2/games/town_regen.js): node tools/harness/town_regen.cjs [마을=ourtown] [포트=8002]
//   ① 화석: 네 흙더미를 다 판 저장 → 비 없는 날 X · 날씨 자동 + 어제 비 = 새 흙더미 하나(같은 날 둘 X · 앞 것을 안 파면 X · 날씨 칩 날 X) → 삽·빗자루·돋보기 = 표본 1 · 화석 칸 넷 그대로
//      다음 비 = 표본 2(앞 것과 다른 갈래 · 다른 자리) · 지층 기둥에 색 맞춰 붙이면 '표본 n'
//   ② 놀람: 찾은 놀람을 다른 계절에 다시 보면 변주 한 줄('다시 본 ○○ · 겨울') · 하루 한 번 · 같은 변주 되풀이 X · 일지 · 다 찾은 아이 = 아침 물음
//   ③ 보물 지도: 상자를 다 찾은 저장 → 게시판 = 잃은 물건 지도 · 그 자리 E 한 번 = 찾음 → 이웃 마음 · 하루 하나 · 나흘 동안 같은 판 X
//   ④ 응용 물음: 실험 규칙을 다 알아낸 저장 → 칩 · 틀리면 20분 · 맞히면 끝(그날 새 물음 X) · 다음 날마다 다른 물음 · 정답 자리 세 번 연속 X
//   ⑤ 나의 길: 다시 살아난 것 = 그날 처음 하나만 한 걸음
//   ⑥ 페이지 오류 0
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) */
const pos9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos9[0] || 'ourtown', PORT = pos9[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? P.textContent : ''; });
    const closeAll = async () => { for (let i = 0; i < 4; i++) { if (!(await panel())) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); if (await panel()) { await p.keyboard.press('Escape'); await W8(250); } } };
    const RG = () => ev(() => SM_TOWN.regen().api.state()), nextDay = () => ev(() => { SM_TOWN.game().S.day++; return SM_TOWN.game().S.day; });
    await p.goto(URL); try { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.regen && SM_TOWN.regen() && SM_TOWN.xp && SM_TOWN.xp() && SM_TOWN.treasure && SM_TOWN.treasure() && window.SD2, null, { timeout: 240000 }); } catch (e) { console.log('  ✗ 마을·다시 살아나기가 안 뜸 — ' + errs.slice(0, 4).join(' | ')); throw e; }
    await W8(2000); await closeAll(); await p.keyboard.press('Escape'); await W8(600);
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 10 * 60; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; G.S.story = G.S.story || {}; G.S.story.p0auto = 1; (G.S.quiz || (G.S.quiz = {})).tip = 1; delete G.S.regen; });

    // ① 화석
    console.log('① 화석 — 큰비 다음 날 새 흙더미');
    { await ev(() => { const x = SM_TOWN.game().S.xp || (SM_TOWN.game().S.xp = {}); x.fos = { f1: [4, 1], f2: [3, 1], f3: [2, 1], f4: [0, 1] }; x.st = { f1: 3, f2: 3, f3: 3, f4: 3 }; x.col = ['f1', 'f2', 'f3', 'f4']; });
      const XA = () => ev(() => ({ sites: SM_TOWN.xp().api.sites(), inst: SM_TOWN.xp().api.inst(), fos: Object.keys(SM_TOWN.xp().api.state().fos).length }));
      const r0 = await ev(() => SM_TOWN.regen().api.roll({ auto: true, rainY: false })); ok(!r0, '비 없는 날 = 새 흙더미 X');
      const r1 = await ev(() => SM_TOWN.regen().api.roll({ auto: true, rainY: true })), s1 = await RG(), x1 = await XA(), rg1 = x1.sites.find(s => s.id === 'rg');
      ok(r1 && s1.fos && s1.fos.n === 1, '날씨 자동 + 어제 비 = 새 흙더미(표본 1 · ' + (s1.fos ? s1.fos.f + ' · ' + s1.fos.u + 'm' : '-') + ')');
      ok(!!rg1 && rg1.st === 0 && x1.inst.pile === 1, '층층골 벽 밑에 흙더미가 보임(자리 ' + (rg1 ? rg1.x + ',' + rg1.z : '-') + ' · 흙더미 ' + x1.inst.pile + ')');
      ok(!(await ev(() => SM_TOWN.regen().api.roll({ auto: true, rainY: true }))), '같은 날 두 번 X(하루 하나)');
      await nextDay(); ok(!(await ev(() => SM_TOWN.regen().api.roll({ auto: true, rainY: true }))), '앞 흙더미를 안 팠으면 비가 와도 새로 쌓이지 않음');
      const steps0 = await ev(() => SM_TOWN.mypath().steps().look);
      for (const t of ['shovel', 'broom', 'lens']) await ev(t9 => SM_TOWN.xp().api.use(t9, 'rg'), t); await W8(300);
      const cardT = await panel(); await closeAll(); const s2 = await RG(), x2 = await XA();
      ok(s2.spec.length === 1 && s2.spec[0].n === 1 && x2.fos === 4, '삽 → 빗자루 → 돋보기 = 표본 1(화석 칸은 넷 그대로)'); ok(/표본 1/.test(cardT), '관찰 카드 = 「표본 1 · …」(' + cardT.slice(0, 40) + ')');
      const steps1 = await ev(() => SM_TOWN.mypath().steps().look); ok(steps1 === steps0 + 1 && s2.pd[await ev(() => SM_TOWN.game().S.day)] === 'look', '나의 길 관찰가 한 걸음(' + steps0 + ' → ' + steps1 + ')');
      await nextDay(); ok(!(await ev(() => SM_TOWN.regen().api.roll({ auto: false, rainY: true }))), '날씨 칩으로 고른 날 = 새 흙더미 X');
      await nextDay(); const r3 = await ev(() => SM_TOWN.regen().api.roll({ auto: true, rainY: true })), s3 = await RG();
      ok(r3 && s3.fos.n === 2 && s3.fos.f !== s2.spec[0].f && s3.fos.u !== s1.fos.u, '다음 큰비 = 표본 2 · 다른 갈래(' + s1.fos.f + ' → ' + s3.fos.f + ') · 다른 자리(' + s1.fos.u + ' → ' + s3.fos.u + 'm)');
      for (const t of ['shovel', 'broom', 'lens']) await ev(t9 => SM_TOWN.xp().api.use(t9, 'rg'), t); await W8(200); await closeAll();
      await ev(() => SM_TOWN.xp().api.openCol()); await W8(300); const band = await ev(() => { const f = SM_TOWN.regen().specF('s1'); return f ? f.band : -1; });
      await ev(() => { const b9 = document.querySelector('.twn-p [data-f="s1"]'); if (b9) b9.click(); }); await W8(200); await ev(bd => { const r9 = document.querySelector('.twn-p [data-b="' + bd + '"]'); if (r9) r9.click(); }, band); await W8(250);
      const colT = await panel(), col = await ev(() => SM_TOWN.xp().api.state().col); await closeAll();
      ok(col.includes('s1') && /표본 1/.test(colT), '지층 기둥에 색을 맞춰 붙임 → 띠 줄에 「표본 1」'); ok(!/%|\d+\s*\/\s*\d+/.test(colT), '기둥 창에 % · n/m X'); }

    // ② 놀람 변주
    console.log('② 숨은 놀람 — 같은 곳 다른 때');
    { await ev(() => { const x = SM_TOWN.game().S.xp; x.surp = { sunset: [1, 1050, 'summer', 'clear', '정상'] }; x.surpD = {}; }); await nextDay();
      const a = await ev(() => SM_TOWN.regen().api.again('sunset', { sea: 'winter' })); ok(!!a && /다시 본 해넘이 · 겨울/.test(a.ban) && /남서/.test(a.fact), '겨울에 다시 본 해넘이 = 「' + (a ? a.ban : '-') + '」 · 남서쪽 한 줄');
      ok(!(await ev(() => SM_TOWN.regen().api.again('sunset', { sea: 'summer' }))), '같은 날 두 번째 변주 X(하루 한 번)');
      await nextDay(); ok(!(await ev(() => SM_TOWN.regen().api.again('sunset', { sea: 'winter' }))), '이미 본 변주(겨울)는 되풀이 X');
      const b2 = await ev(() => SM_TOWN.regen().api.again('sunset', { sea: 'summer' })); ok(!!b2 && /여름/.test(b2.ban) && /북서/.test(b2.fact), '다음 날 여름 = 다른 변주(' + (b2 ? b2.ban : '-') + ')');
      const dia = await ev(() => (SM_TOWN.game().S.diary || []).filter(q => /다시 본/.test(q.t)).length); ok(dia >= 2, '일지에 「다시 본 …」 ' + dia + '줄');
      await ev(() => SM_TOWN.surp().api.open()); await W8(300); const jt = await panel(); await closeAll(); ok(/다시 본 것/.test(jt) && /해넘이 · 겨울/.test(jt), '놀람 일지 창에 「다시 본 것」');
      const ids = await ev(() => SM_TOWN.surp().api.rows().map(r => r.id)); const ask0 = await ev(() => SM_TOWN.regen().api.ask({ sea: 'winter', wx: 'snow' }));
      await ev(ids9 => { const x = SM_TOWN.game().S.xp; for (const id of ids9) x.surp[id] = x.surp[id] || [1, 600, 'summer', 'clear', '']; }, ids); const ask1 = await ev(() => SM_TOWN.regen().api.ask({ sea: 'winter', wx: 'snow' }));
      ok(!ask0 && !!ask1 && /오늘은 .*다시 보면/.test(ask1), '놀람을 다 찾은 뒤에만 아침 물음(' + (ask1 || '-') + ')'); }

    // ③ 잃은 물건 지도
    console.log('③ 보물 지도 — 상자 일곱 뒤 잃은 물건 지도');
    { const SP = await ev(() => SM_TOWN.treasure().spots()); console.log('  상자 자리 ' + SP.length + '곳');
      await ev(sp => { const G = SM_TOWN.game(), t = G.S.tmap || (G.S.tmap = { v: 1 }); t.v = 1; t.got = {}; for (const c of sp) t.got[c.id] = 1; t.n = [2, 2, 1]; t.title = [1, 2, 3]; t.cur = null; t.last = 0; }, SP); await W8(500);
      const bd = (await ev(() => SM_TOWN.treasure().info())).board; ok(/잃은 물건/.test(bd), '게시판 = 「' + bd + '」');
      const runs = []; for (let k = 0; k < 4; k++) { if (k) await nextDay();
        await ev(() => SM_TOWN.treasure().take()); await W8(400); const pt = await panel(), I = await ev(() => SM_TOWN.treasure().info()), c = I.cur;
        if (!c || !c.lost) { ok(false, (k + 1) + '일째 잃은 물건 지도 받기(' + (c ? c.id : '없음') + ')'); break; }
        if (!k) { ok(/이웃이 그린 지도/.test(pt) && /잃어버렸어요/.test(pt) && /tm-cv/.test(await ev(() => document.querySelector('.twn-p').innerHTML)), '창 = 이웃 말 + 지도 조각 그림'); ok(!/빨간 선/.test(pt), '창에 빨간 선 X'); }
        await closeAll(); await ev(() => SM_TOWN.treasure().take()); await W8(300); const same = (await ev(() => SM_TOWN.treasure().info())).cur; await closeAll(); if (!k) ok(same && same.id === c.id, '같은 날 다시 = 같은 지도');
        const h0 = await ev(hk => (SM_TOWN.game().S.hearts || {})[hk] || 0, c.lost.hk);
        await ev(([x, z]) => { const M = SD2.map; M.player.teleport([x + 0.6, M.q.groundAt(x + 0.6, z, 600) + 0.05, z]); }, [c.x, c.z]); await W8(1200);
        const dig = (await ev(() => SM_TOWN.treasure().info())).dig; if (!k) ok(/풀숲/.test(dig || ''), '그 자리 E = 「' + dig + '」(꾹 X)');
        await p.keyboard.press('KeyE'); await W8(1800); const I2 = await ev(() => SM_TOWN.treasure().info()), h1 = await ev(hk => (SM_TOWN.game().S.hearts || {})[hk] || 0, c.lost.hk), rt = await panel(); await closeAll();
        ok(!I2.cur && I2.last === (await ev(() => SM_TOWN.game().S.day)) && h1 > h0, (k + 1) + '일째 ' + c.lv + '단계 ' + c.k + ' — ' + c.lost.it.e + ' 찾음 · 이웃 마음 ' + h0 + ' → ' + h1);
        if (!k) { ok(/찾았어요/.test(rt) && /돌려줬어요/.test(rt), '찾은 창 = 돌려줬어요'); await ev(() => SM_TOWN.treasure().take()); await W8(300); ok(!(await ev(() => SM_TOWN.treasure().info())).cur, '같은 날 두 번째 지도 X'); await closeAll(); }
        runs.push({ k: c.k, x: c.x, z: c.z, hk: c.lost.hk, it: c.lost.it.e, lv: c.lv }); }
      console.log('  ' + runs.map(r => r.k + '·' + r.lv + '·' + r.it).join(' | '));
      ok(runs.length === 4 && runs.every((r, i) => !i || r.k !== runs[i - 1].k) && new Set(runs.map(r => Math.round(r.x) + ',' + Math.round(r.z))).size === 4, '나흘 = 같은 갈래 이어서 X · 자리 넷 다름');
      ok(runs.length === 4 && runs.every((r, i) => !i || r.hk !== runs[i - 1].hk), '이웃이 날마다 바뀜'); }

    // ④ 응용 물음
    console.log('④ 화학 규칙 — 응용 물음');
    { await ev(async () => { const m = await import('/v2/games/town_regen.js?v=1'), G = SM_TOWN.game(), c = G.S.chem; c.lf = c.lf || {}; c.found = c.found || {}; for (const a of m.APPS) for (const n of a.need) { const [k, id] = n.split(':'); if (k === 'lf') c.lf[id] = c.lf[id] || { d: 1, at: '', it: {} }; else c.found[id] = c.found[id] || { d: 1, at: '', how: '' }; } });
      await nextDay(); for (let i = 0; i < 4; i++) await ev(() => SM_TOWN.regen().sec());
      const Q0 = await ev(() => SM_TOWN.regen().api.app()), ch0 = await ev(() => SM_TOWN.regen().api.chip()), chipDom = await ev(() => /오늘의 물음/.test(document.body.innerText));
      ok(!!Q0 && Q0.n === 3, '오늘의 물음 ' + (Q0 ? Q0.id : '-') + ' · 자리 셋'); ok(ch0 === 'app' && chipDom, '화면에 「오늘의 물음」 칩');
      await ev(() => SM_TOWN.regen().api.appOpen()); await W8(300); const at = await panel(); ok(/오늘의 물음/.test(at) && (await ev(() => document.querySelectorAll('.twn-p [data-c]').length)) === 3, '창 = 이웃 물음 + 자리 단추 셋'); await closeAll();
      const m0 = await ev(() => SM_TOWN.game().S.min), wr = await ev(i => SM_TOWN.regen().api.answer(i), (Q0.pos + 1) % 3), m1 = await ev(() => SM_TOWN.game().S.min);
      ok(wr === false && m1 === m0 + 20, '틀리면 벌 X · 시간 20분(' + m0 + ' → ' + m1 + ')');
      const rt = await ev(i => SM_TOWN.regen().api.answer(i), Q0.pos); for (let i = 0; i < 4; i++) await ev(() => SM_TOWN.regen().sec()); const s4 = await RG();
      ok(rt === true && s4.app.ok === 1 && (await ev(() => SM_TOWN.regen().api.chip())) === '', '맞히면 끝 · 칩 사라짐');
      ok((await ev(() => SM_TOWN.regen().api.app())).id === Q0.id && !(await ev(i => SM_TOWN.regen().api.answer(i), Q0.pos)), '같은 날 새 물음 X');
      const ids = [Q0.id], poss = [Q0.pos]; for (let k = 0; k < 5; k++) { await nextDay(); const Q = await ev(() => SM_TOWN.regen().api.app()); if (!Q) break; ids.push(Q.id); poss.push(Q.pos); await ev(i => SM_TOWN.regen().api.answer(i), Q.pos); }
      console.log('  ' + ids.join(' → ') + ' · 정답 자리 ' + poss.join(''));
      ok(ids.length === 6 && new Set(ids).size === 6, '엿새 = 물음이 날마다 다름'); ok(poss.every((q, i) => i < 2 || !(q === poss[i - 1] && q === poss[i - 2])), '정답 자리 세 번 연속 X'); }

    // ⑤ 나의 길
    console.log('⑤ 나의 길 — 하루 하나까지');
    { const s = await RG(), V = Object.values(s.pd); ok(Object.keys(s.pd).length >= 6 && V.every(v => ['look', 'explore', 'nb'].includes(v)), '다시 살아난 날 ' + Object.keys(s.pd).length + '일 · 길 갈래 ' + [...new Set(V)].join('·'));
      const d = await ev(() => SM_TOWN.game().S.day), before = await ev(() => SM_TOWN.mypath().steps().look); await ev(() => SM_TOWN.regen().api.again('sunrise', { sea: 'winter' })); const after = await ev(() => SM_TOWN.mypath().steps());
      ok((await RG()).pd[d] === 'look' && after.look === before, '같은 날 두 번째(놀람 변주) = 걸음 더 X'); }

    console.log('⑥ 페이지 오류');
    ok(errs.length === 0, '페이지 오류 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); }
  await b.close(); console.log('\n' + (fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 모두 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
