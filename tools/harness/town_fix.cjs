// 🔧 동네 고칠 곳 신고 시험(FIX-1 · v2/games/town_fix.js): node tools/harness/town_fix.cjs [마을=ourtown] [포트=8002]
//   ① 생김(정문 밖 · 내 둘레 80~300m 인도 · 학교 X) · 긴급 사건과 겹치면 그날 X · 모습 = 그리기 1
//   ② 🔍 살펴보기 E → 창(무엇이 어떻게 · 알리면 고쳐 줘요) → 길 안내 = 빨간 선 · 장소 찾기에 '행정복지센터에 알리기'
//   ③ 창구 08:00 = 문 닫음 한 줄(창 X) · 10:00 = 직원 몸 · 신고 창(틀린 칸 → 되물음 · 맞으면 무엇 → 틀리면 되물음 · 맞으면 접수 · 솜씨 fix:report)
//   ④ 잠 → 다음 날 고친 모습 + 「고쳤어요」 판(그리기 2 이하) + 아침 소식 한 줄 · ⑤ 이틀 뒤 판 사라짐 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async (n, at, look) => { if (!SHOTS) return; await closeAll(); await tp(at[0], at[1]); await ev(l => SD2.map.player.lookAt(l), look); await W8(1500); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 600) } : null; });
    const closeAll = async () => { for (let i = 0; i < 5; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const I = () => ev(() => SM_TOWN.fix().info()), D = (k, a) => ev(([k, a]) => SM_TOWN.fix().dbg[k](a), [k, a]);
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [x, z]);
    const tpE = async (x, z, done) => { for (let k = 0; k < 3; k++) { await closeAll(); await tp(x + 0.3, z + 0.3); await W8(600); await p.keyboard.press('KeyE'); await W8(700); if (!done || await done()) return; } };   /* 레벨 보상 창 등이 먼저 뜨면 닫고 다시 */
    const said = re => ev(re => { const t9 = document.getElementById('toast'); return new RegExp(re).test(document.body.innerText) || !!(t9 && t9.style.display !== 'none' && new RegExp(re).test(t9.textContent)); }, re);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.fix && SM_TOWN.fix() && SM_TOWN.routePts, null, { timeout: 240000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.min = 8 * 60; SM_TOWN.rules.wx('clear'); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } });
    const R = await ev(() => SM_TOWN.schRect()), gx = (R[0] + R[2]) / 2, gz = R[3] + 28; await tp(gx, gz); await W8(900);
    // ① 긴급 사건과 겹치면 그날 X
    const emOk = await ev(() => SM_TOWN.emerg().dbg.spawn('lost'));
    if (emOk) { const q = await D('plan'); const i9 = await I(); ok(!q && i9.skip === (await ev(() => SM_TOWN.game().S.day)), '긴급 사건(112) 중이면 그날 고장 X'); await ev(() => SM_TOWN.emerg().dbg.end(false)); await W8(400); }
    else console.log('    (112 사건이 이 자리에서 안 생김 — 겹침 시험 건너뜀)');
    // ① 생김
    const q0 = await D('plan'); let i0 = null; for (let i = 0; i < 20; i++) { await W8(500); i0 = await I(); if (i0.halls.length) break; } if (!q0) throw new Error('고장이 안 생김: ' + JSON.stringify(i0.dbg));
    const me0 = await ev(() => { const m = SD2.map.player.pos(); return [m.x, m.z]; }), d0 = Math.round(Math.hypot(q0.x - me0[0], q0.z - me0[1]));
    ok(d0 >= 80 && d0 <= 300, '내 둘레 ' + d0 + 'm 인도 (' + q0.cell + ' 칸)'); ok(!(await ev(q => SM_TOWN.inSchool(q.x, q.z), q0)), '학교 밖');
    ok(await ev(q => { const g = SM_TOWN.ground(q.x, q.z); return Math.abs(q.y - g - 0.14) < 0.05; }, q0), '인도 높이(땅 + 0.14)');
    ok(i0.phase === 'broken' && i0.meshes === 1, '깨진 보도블록 + 주황 고깔 = 그리기 ' + i0.meshes); ok(/살펴보기/.test(i0.look || ''), 'E 자리 🔍 살펴보기');
    ok(i0.halls.length >= 1, '행정복지센터 창구 ' + i0.halls.length + '곳 (' + i0.halls.map(h => h.name + ' ' + h.cell).join(' · ') + ')');
    await shot('fix_broken', [q0.x + q0.ux * 4.5 + q0.px * 0.3, q0.z + q0.uz * 4.5 + q0.pz * 0.3], [q0.x, q0.z]);
    await shot('fix_broken_b', [q0.x - q0.ux * 3.5, q0.z - q0.uz * 3.5], [q0.x, q0.z]);
    // 가까이 가면 한 줄 · ② 살펴보기
    await tp(q0.x + q0.ux * 20, q0.z + q0.uz * 20); let sd9 = false; for (let i = 0; i < 22 && !sd9; i++) { await W8(500); sd9 = await said('주황 고깔'); } ok(sd9, '가까이(20m) = 「주황 고깔」 한 줄'); if (!sd9) console.log('    ' + JSON.stringify(await ev(() => ({ sayN: SM_TOWN.sayN(), fx: SM_TOWN.fix().info().dbg, toast: [document.getElementById('toast').textContent, document.getElementById('toast').style.display, getComputedStyle(document.getElementById('toast')).display], d: SD2.map.player.pos() }))));
    await tpE(q0.x + q0.ux * 1.2, q0.z + q0.uz * 1.2, async () => ((await panel()) || {}).k === 'fixlook'); let P = await panel(); ok(P && P.k === 'fixlook' && /깨지고 들떠/.test(P.t) && /행정복지센터에 알리면/.test(P.t), '살펴보기 창(무엇이 어떻게 · 알리면 고쳐 줘요)');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="way"]'); if (b9) b9.click(); }); await W8(600); const rp = await ev(() => SM_TOWN.routePts()); ok(rp && rp.length > 1, '길 안내 = 빨간 선 ' + (rp ? rp.length : 0) + '점');
    ok((await I()).cur.seen > 0, '살펴봄 기록');
    await p.keyboard.press('KeyF'); await W8(700); P = await panel(); ok(P && /행정복지센터에 알리기/.test(P.t), '장소 찾기 = 「행정복지센터에 알리기」'); await closeAll();
    // ③ 창구: 시간 밖
    let H0 = (await I()).halls[0]; await tpE(H0.at[0], H0.at[1], () => said('09:00에 열어요')); await W8(300); { let c9 = false; for (let i = 0; i < 6 && !c9; i++) { c9 = await said('09:00에 열어요'); if (!c9) await W8(300); } ok(!(await panel()) && c9, '08:00 = 「지금은 문 닫았어요 · 09:00에 열어요」 (창 X)'); if (!c9) console.log('    ' + JSON.stringify({ H0, me: await ev(() => SD2.map.player.pos()), toast: await ev(() => document.getElementById('toast').textContent), near: await ev(() => { const m = SD2.map.player.pos(); return SD2.map.interact.list().filter(h => Math.hypot(h.x - m.x, h.z - m.z) < 4).map(h => h.label); }) })); } ok((await I()).clerk === 0, '문 닫은 때 = 직원 X');
    await ev(() => { SM_TOWN.game().S.min = 10 * 60; }); let ck = 0; for (let i = 0; i < 8 && ck !== 1; i++) { await W8(500); ck = (await I()).clerk; } ok(ck === 1, '10:00 = 직원 · 탁자 (그리기 1)'); H0 = (await I()).halls[0]; await shot('fix_clerk', [H0.at[0] + 3, H0.at[1] + 3], H0.at);
    const xp0 = (await ev(() => SM_TOWN.skills())).xp.explore || 0;
    await tpE(H0.at[0], H0.at[1], async () => ((await panel()) || {}).k === 'fixrep'); P = await panel(); ok(P && P.k === 'fixrep' && /어디에서/.test(P.t) && await ev(() => !!document.querySelector('.twn-p canvas')), '신고 창 ① 어디(지도 + 칸 셋)');
    const cells = await ev(() => [...document.querySelectorAll('.twn-p button[data-at]')].map(b9 => b9.textContent)), ri = cells.findIndex(t => t.startsWith(q0.cell + ' ')), wi = cells.findIndex(t => !t.startsWith(q0.cell + ' '));
    ok(cells.length === 3 && ri >= 0 && wi >= 0, '칸 셋 (' + cells.join(' / ') + ')');
    await ev(i => document.querySelector('.twn-p button[data-at="' + i + '"]').click(), wi); await W8(300); ok(/다시 봐/.test((await panel() || {}).t || ''), '틀린 칸 = 직원이 되물음');
    await ev(i => document.querySelector('.twn-p button[data-at="' + i + '"]').click(), ri); await W8(300); P = await panel(); ok(/무엇이 어떻게/.test(P.t), '맞는 칸 = ② 무엇');
    const ks = await ev(() => [...document.querySelectorAll('.twn-p button[data-w]')].map(b9 => b9.textContent)), kr = ks.findIndex(t => /보도블록/.test(t)), kw = ks.findIndex(t => !/보도블록/.test(t));
    await ev(i => document.querySelector('.twn-p button[data-w="' + i + '"]').click(), kw); await W8(300); ok(/떠올려/.test((await panel() || {}).t || ''), '틀린 모습 = 되물음');
    await ev(i => document.querySelector('.twn-p button[data-w="' + i + '"]').click(), kr); await W8(400); P = await panel(); ok(P && /접수/.test(P.t) && /민원/.test(P.t), '접수 「내일 고쳐요」 + 낱말 둘');
    const dRep = await ev(() => SM_TOWN.game().S.day); let i1 = await I(); ok(i1.cur.rep === dRep && i1.cur.mis === 2, '신고 기록(틀림 ' + i1.cur.mis + '번)'); ok(((await ev(() => SM_TOWN.skills())).xp.explore || 0) > xp0, '탐험 솜씨 +(fix:report)'); await closeAll();
    ok(i1.phase === 'broken', '신고한 날은 아직 깨진 채'); await tpE(H0.at[0], H0.at[1], () => said('접수했어요')); let sd8 = false; for (let i = 0; i < 6 && !sd8; i++) { sd8 = await said('접수했어요'); if (!sd8) await W8(300); } ok(!(await panel()) && sd8, '다시 E = 「접수했어요」 한 줄'); if (!sd8) console.log('    ' + JSON.stringify({ H0, P: await panel(), me: await ev(() => SD2.map.player.pos()), toast: await ev(() => document.getElementById('toast').textContent), near: await ev(() => { const m = SD2.map.player.pos(); return SD2.map.interact.list().filter(h => Math.hypot(h.x - m.x, h.z - m.z) < 4).map(h => h.label + '@' + h.x.toFixed(1) + ',' + h.z.toFixed(1) + (h.off ? ' off' : '')); }) }));
    // ④ 잠 → 다음 날
    await ev(() => SM_TOWN.sleep()); await W8(3500); await closeAll(); const d1 = await ev(() => SM_TOWN.game().S.day); ok(d1 === dRep + 1, '잠 = 다음 날 (' + d1 + ')');
    await W8(1200); i1 = await I(); ok(i1.phase === 'sign' && i1.meshes >= 1 && i1.meshes <= 2, '고친 보도블록 + 「고쳤어요」 판 (그리기 ' + i1.meshes + ')'); ok(!i1.look, '고친 뒤 살펴보기 E 없음');
    const nw = await ev(d => SM_TOWN.fix().news(d), d1); ok(nw.some(q => q.k === 'fix' && /고쳤어요/.test(q.t[0])), '아침 소식 「' + ((nw.find(q => q.k === 'fix') || { t: ['-'] }).t[0]) + '」');
    const N9 = await ev(() => SM_TOWN.news()); ok(N9 && N9.cand && N9.cand.one.includes('fx:fix') && (N9.lines || []).some(L => L.k === 'fx:fix'), '소식판 줄에 실림 (' + JSON.stringify((N9.lines || []).map(L => L.k)) + ')');
    await shot('fix_sign', [q0.x + q0.ux * 4.5 + q0.px * 0.3, q0.z + q0.uz * 4.5 + q0.pz * 0.3], [q0.x, q0.z]); await shot('fix_sign_b', [q0.x - q0.ux * 4.5 + q0.px * 0.3, q0.z - q0.uz * 4.5 + q0.pz * 0.3], [q0.x, q0.z]);
    // ⑤ 이틀 뒤
    await ev(d => { const G = SM_TOWN.game().S; G.day = d + 1; }, d1); for (let i = 0; i < 10; i++) { await W8(500); i1 = await I(); if (i1.phase === 'fixed' && i1.meshes === 1) break; } ok(i1.phase === 'fixed' && i1.meshes === 1, '그다음 날 = 판 없이 새 블록만');
    await ev(d => { const G = SM_TOWN.game().S; G.day = d + 2; G.fix.d = d + 2; }, d1); for (let i = 0; i < 10; i++) { await W8(500); i1 = await I(); if (!i1.cur && i1.meshes === 0) break; } ok(!i1.cur && i1.meshes === 0 && i1.log[0] && i1.log[0].rep === dRep && i1.log[0].ok === 1, '이틀 뒤 = 판·새 블록 사라짐 · 기록만');
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); try { console.log('    info ' + JSON.stringify(await p.evaluate(() => SM_TOWN.fix().info()))); } catch (e2) { /* 페이지 없음 */ } } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
