// 제빵 시험(BAKE-1 · 설계 docs/systems/town_jobs2.md 「다음 다섯 — 🍞 제빵」): node tools/harness/town_bake.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 빵집 안 화덕 앞 E(걸어서 닿음) → 반죽 판(진짜 끌기 + 단추) → 부풀 자리 → 판 60초 안 · 창 닫힘 · 안 멈춤
//   ② 기다리는 중 E = 지금 모습 · 게임 60분 뒤(밖) = 알림 한 번 · 굽기(빛깔 → 꺼내기) → 결과 빵 그림 · 🍞 +2 · 규칙 칸 yeast · 문(rwCheck) 꼬리표
//   ③ 찬 곳 = 납작 + 덜 구움 · 굽다 창을 닫으면 그때 꺼냄(멈춤 X) · 하루 빵 몫(두 판) 뒤 = 연습 · 꼬임 사다리(잘한 판 셋 → 계절 따라 → 내일 아침 빵 반죽 둘) · 오류 0
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async n => { if (!SHOTS) return; await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 400) } : null; });
    const closeAll = async () => { for (let i = 0; i < 4; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const clk = async sel => { const ok9 = await ev(s => { const b9 = document.querySelector(s); if (b9) b9.click(); return !!b9; }, sel); if (!ok9) { console.log('    (' + sel + ' 없음 · 창 ' + JSON.stringify(await panel()) + ' · ' + JSON.stringify(await info()) + ' · 가까운 E ' + (await ev(() => SD2.near())) + ' · 때 ' + (await ev(() => SM_TOWN.game().S.min)) + ')'); throw new Error(sel + ' 없음'); } };
    const info = () => ev(() => SM_TOWN.bake().info()), bread = () => ev(() => SM_TOWN.game().S.bag['🍞'] || 0), frozen = () => ev(() => !!SD2.CTRL.frozen);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.bake && SM_TOWN.indoor, null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(1500);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; G.bake = null; if (G.lad) delete G.lad.bake; });
    const shop = await ev(() => { const q = SM_TOWN.indoor.list().find(q => q.kind === 'shop' && /빵|제과/.test(q.name)); return q ? { id: q.id, name: q.name } : null; });
    ok(!!shop, '빵집 있음(' + (shop && shop.name) + ')'); if (!shop) throw new Error('빵집 없음');
    const enter = async () => { await ev(id => SM_TOWN.indoor.enter(id), shop.id); await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 9000 }); await W8(400); };
    const leave = async () => { await ev(async () => { SM_TOWN.indoor.exit(); for (let i = 0; i < 40 && (SM_TOWN.indoor.on || SM_TOWN.indoor.busy); i++) await new Promise(r => setTimeout(r, 100)); }); await W8(400); };
    const oven = () => ev(() => SD2.map.interact.list().filter(h => !h.off && /빵 굽기 거들기/.test(h.label)).map(h => ({ x: h.x, y: h.y, z: h.z, r: h.r }))[0] || null);
    const pressE = async () => { if (await ev(() => { const P9 = document.querySelector('.twn-p'); return !!P9 && P9.dataset.k !== 'bake'; })) await closeAll();   /* 솜씨 레벨 보상 창(lvr) 같은 다른 창이 먼저 떠 있으면 닫고 */ const h = await oven(); if (!h) return false; await ev(h => { SD2.map.player.teleport([h.x, h.y + 0.05, h.z + 0.4]); SD2.map.player.lookAt([h.x, h.z - 3]); }, h); await W8(450); const nr = await ev(() => SD2.near()); await p.keyboard.press('KeyE'); await W8(500); return nr; };
    // ① 반죽 판
    await enter(); const H0 = await oven(); ok(!!H0, '화덕 앞 E 있음'); const chk = await ev(() => SM_TOWN.indoor.check()); const hc = chk && chk.hots.find(h => /빵 굽기/.test(h.label)); ok(hc && hc.ok === true, '화덕 앞 E에 걸어서 닿음(방 칸 채우기)');
    const t0 = Date.now(); const nr = await pressE(); let P = await panel(); ok(P && P.k === 'bake' && /반죽/.test(P.t), 'E → 반죽 판 열림(가까운 E: ' + nr + ')'); ok(/^🍞 빵 반죽\n?/.test(P ? P.t : '') || /할 일:/.test(P ? P.t : ''), '창 첫 줄 = 할 일');
    await shot('bake_knead0');
    const bd = await ev(() => { const r = document.querySelector('.bk-board').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }); await p.mouse.move(bd[0] + bd[2] * 0.5, bd[1] + bd[3] * 0.5); await p.mouse.down();
    for (let k = 0; k < 5; k++) { await p.mouse.move(bd[0] + bd[2] * 0.12, bd[1] + bd[3] * 0.5, { steps: 6 }); await p.mouse.move(bd[0] + bd[2] * 0.88, bd[1] + bd[3] * 0.5, { steps: 6 }); } await p.mouse.up();
    const n1 = (await info()).n; ok(n1 >= 8, '진짜 끌기로 치댄 수 ' + n1 + '번(좌우 다섯 왕복)'); await shot('bake_knead1');
    await ev(() => SM_TOWN.bake().dbg.stroke(6)); await W8(600); P = await panel(); ok(P && /어디에서 부풀릴까요/.test(P.t), '열 번 치대면 → 부풀 자리 고르기');
    ok(await ev(() => document.querySelectorAll('.bk-spots button').length === 2), '첫 꼬임 = 자리 둘(화덕 곁 · 냉장고)'); await shot('bake_spot');
    await clk('.bk-spots [data-s="warm"]'); await W8(500); const sec = (Date.now() - t0) / 1000; let I = await info();
    ok(!(await panel()) && I.dough && I.dough.k === 'warm' && I.dough.w === 60, '자리 고름 → 창 닫힘 · 반죽 = 화덕 곁(60분)'); ok(sec < 60, '판 하나 ' + sec.toFixed(1) + '초(60초 안)'); ok(!(await frozen()), '판 뒤 안 멈춤');
    // ② 기다림 → 알림 → 굽기
    await pressE(); P = await panel(); ok(P && /부푸는 중/.test(P.t), '기다리는 중 E = 지금 모습 + 언제 올지'); await shot('bake_wait'); await closeAll();
    await leave(); await ev(() => { const G = SM_TOWN.game().S; G.min += 61; }); await W8(1800); const toast = await ev(() => [...document.querySelectorAll('#hudToast, .toast, [class*=toast]')].map(e => e.textContent).join(' | '));
    I = await info(); ok(I.dough && I.dough.told === 1, '밖에서 60분 뒤 = 다 부풀었다는 알림 한 번(' + toast.slice(0, 50) + ')');
    await enter(); const b0 = await bread(); await pressE(); P = await panel(); ok(P && /화덕에 굽기/.test(P.t) && /두 배/.test(P.t), '다 부푼 뒤 E = 굽기 창(두 배쯤 부풂)');
    const c0 = await ev(() => getComputedStyle(document.querySelector('.bk-oven .bk-bread')).backgroundColor); await W8(2500); await ev(() => SM_TOWN.bake().dbg.ovenT(9)); await W8(400); const c1 = await ev(() => getComputedStyle(document.querySelector('.bk-oven .bk-bread')).backgroundColor);
    ok(c0 !== c1, '굽는 동안 빛깔이 바뀜(' + c0 + ' → ' + c1 + ')'); ok(await ev(() => /고소한/.test(document.querySelector('.twn-p .msg').textContent)), '노릇할 때 = 고소한 냄새 한 줄'); await shot('bake_oven');
    await clk('.twn-p [data-a="out"]'); await W8(500); P = await panel(); const b1 = await bread(); I = await info();
    ok(P && /알맞게 구웠어요/.test(P.t) && /크게 부풀었어요/.test(P.t), '결과 = 알맞음 + 크게 부풂(빵 그림)'); ok(b1 - b0 === 2, '🍞 +' + (b1 - b0) + ' (알맞음·잘 부풂 = 2)'); ok(!I.dough, '구운 뒤 반죽 비움'); await shot('bake_done');
    const law = await ev(() => { const S = SM_TOWN.game().S, f = o => { if (!o || typeof o !== 'object') return null; if (o.lf && o.lf.yeast) return o.lf.yeast; for (const k of Object.keys(o)) { const r = k === 'lf' ? null : (typeof o[k] === 'object' ? f(o[k]) : null); if (r) return r; } return null; }; return f(S); });
    ok(!!law && law.it && law.it['🍞'] === 'rise', "규칙 칸 '따뜻하면 효모가 잘 부풀어요'(yeast) 알아냄");
    const rw = await ev(() => { const R = SM_TOWN.game().S.rw; return R && R.c ? Object.keys(R.c).filter(k => /bake/.test(k)) : []; }); ok(rw.some(k => k === 'b|bake:bread') && rw.some(k => /x\|bake/.test(k)), '보상이 문(rwCheck) 꼬리표로 셈 ' + JSON.stringify(rw));
    await closeAll(); ok(!(await frozen()), '결과 창 닫은 뒤 안 멈춤');
    // ③ 찬 곳 · 덜 구움 · 창 닫기 · 하루 몫 · 사다리
    const board = async (spots, mins, ovenT, how) => { const nr9 = await pressE(); const p9 = await panel(); if (!p9 || p9.k !== 'bake') console.log('    (반죽 판 안 열림 · 가까운 E ' + nr9 + ' · 창 ' + JSON.stringify(p9) + ' · ' + JSON.stringify(await info()) + ')'); await ev(() => SM_TOWN.bake().dbg.stroke(11)); await W8(450); for (const s of spots) { const ok9 = await ev(s => { const b9 = document.querySelector('.bk-spots [data-s="' + s + '"]'); if (b9) b9.click(); return !!b9; }, s); if (!ok9) { console.log('    (자리 단추 ' + s + ' 없음 · 창 ' + JSON.stringify(await panel()) + ' · ' + JSON.stringify(await info()) + ')'); throw new Error('자리 단추 없음'); } await W8(200); } await W8(300); await ev(m => { SM_TOWN.game().S.min += m; }, mins); await W8(1200); await pressE(); await ev(t => SM_TOWN.bake().dbg.ovenT(t), ovenT); await W8(300);
      if (how === 'esc') { await p.keyboard.press('Escape'); await W8(1300); return null; } await clk('.twn-p [data-a="out"]'); await W8(450); const r = await panel(); await closeAll(); return r; };
    await ev(() => { const G = SM_TOWN.game().S; G.min = 10 * 60; }); const b2 = await bread(); let R = await board(['cold'], 91, 3);
    ok(R && /덜 구웠어요/.test(R.t) && /납작/.test(R.t), '찬 곳 + 일찍 꺼냄 = 덜 구움 + 납작(' + (R && R.t.slice(0, 60).replace(/\n/g, ' ')) + ')'); const b3 = await bread(); ok(b3 - b2 === 1, '덜 구움 = 🍞 +' + (b3 - b2) + ' (하루 둘째 판)');
    R = await board(['warm'], 61, 12, 'esc'); I = await info(); ok(!I.dough && !I.ph && !(await panel()) && !(await frozen()), '굽다 Esc = 그때 꺼냄(알림) · 창·멈춤 남지 않음');
    const b4 = await bread(); ok(b4 === b3, '하루 셋째 판(굽다 닫음) = 받는 것 없음 (+' + (b4 - b3) + ')');
    const L0 = await ev(() => { const G = SM_TOWN.game().S; G.day += 1; G.min = 9 * 60; G.lad.bake = { lv: 0, good: 0, best: {}, fail: 0 }; return G.lad.bake; }); const RS = []; for (let k = 0; k < 3; k++) RS.push(await board(['warm'], 61, 10)); ok(RS[2] && /연습/.test(RS[2].t), '하루 빵 몫(두 판) 뒤 셋째 판 = 연습 한 줄');
    const L1 = (await info()).lad; ok(L1.lv === 1, '잘한 판 셋 → 꼬임 2 「계절 따라」 (lv ' + L0.lv + ' → ' + L1.lv + ')');
    await pressE(); await ev(() => SM_TOWN.bake().dbg.stroke(11)); await W8(450); const sp1 = await ev(() => [...document.querySelectorAll('.bk-spots button')].map(b => b.dataset.s)); P = await panel(); ok(sp1.join() === 'door,cold,bowl' && /꽉 찼어요/.test(P.t), '꼬임 2 = 화덕 곁 선반 꽉 참 · 문 옆·냉장고·따뜻한 물 (' + sp1.join() + ')'); await shot('bake_lv2');
    await clk('.bk-spots [data-s="bowl"]'); await W8(300); await ev(() => { SM_TOWN.game().S.min += 61; }); await W8(1200); await pressE(); await ev(() => SM_TOWN.bake().dbg.ovenT(10)); await W8(300); await clk('.twn-p [data-a="out"]'); await W8(400); await closeAll();
    for (let k = 0; k < 2; k++) await board(['bowl'], 61, 10); const L2 = (await info()).lad; ok(L2.lv === 2, '꼬임 3 「내일 아침 빵」 열림 (lv ' + L2.lv + ')');
    await pressE(); await ev(() => SM_TOWN.bake().dbg.stroke(11)); await W8(450); P = await panel(); ok(P && /반죽 첫째/.test(P.t), '꼬임 3 = 반죽 둘 · 첫째(오늘)'); await clk('.bk-spots [data-s="warm"]'); await W8(300); P = await panel(); ok(P && /내일 아침/.test(P.t), '둘째(내일 아침) 고르기'); await shot('bake_lv3'); await clk('.bk-spots [data-s="cold"]'); await W8(300);
    I = await info(); ok(I.dough && I.dough.k === 'warm' && I.dough.tom === 'cold', '반죽 둘 = 오늘 화덕 곁 · 내일 냉장고');
    await ev(() => { SM_TOWN.game().S.min += 61; }); await W8(1200); await pressE(); await ev(() => SM_TOWN.bake().dbg.ovenT(10)); await W8(300); await clk('.twn-p [data-a="out"]'); await W8(400); P = await panel(); ok(P && /냉장고에서 내일 아침까지/.test(P.t), '결과에 내일 아침 반죽 한 줄'); await shot('bake_lv3done'); await closeAll();
    await leave(); ok(!(await frozen()) && !(await ev(() => SM_TOWN.indoor.on)), '빵집을 나와 걸을 수 있음');
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
