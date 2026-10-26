// 🛂 갈래 이웃 부탁 시험(DEPTH-4 · town_depth.md '갈래 배지 뒤 이 갈래 이웃 부탁 하나'): node tools/harness/town_passreq.cjs [마을=ourtown] [포트=8002]
//   ① 배지 없는 갈래 = 부탁 단추 없음 · 배지 뒤 = 여권 갈래 줄·장소 카드에 '이 갈래 이웃 부탁' ② 멀리서 받음 = 부탁한 곳까지 빨간 선 → 그 곳에 걸어가면 고르기 창(직업으로만 알려 줌 · 셋 가운데 하나)
//   ③ 틀린 곳 고름 → 그곳에 가면 '하는 일 한 줄 + 여기서 일하지 않아요' · 다시 고르기(틀린 곳은 막힘) ④ 맞는 곳 = 끝 · 여권 '지난 부탁' · 오늘 그 갈래 끝
//   ⑤ 빌린 책(배움 갈래) = 받아서 다시 가져오기 ⑥ 날이 바뀐 두 판 = 부탁한 곳→받을 곳이 다름 · 열 판 연속 같은 부탁 0 ⑦ 오류 0 · 그리기 끔(pw.cjs) · b2.sh 자리로
const { chromium, RENDER } = require('./pw.cjs');
const SHOT = process.env.PREQ_SHOTS || '/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/52a18de9-e78e-4006-be4f-f54f6909d405/scratchpad/preq';
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a); await p.addInitScript(() => { window.__SURP_OFF = 1; });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.jobs && SM_TOWN.game && window.SD2, null, { timeout: 240000 }); await W8(1500);
    const closeAll = async () => { for (let i = 0; i < 5; i++) { const n = await ev(() => { const P = document.querySelector('.twn-p'); if (!P) return 0; const b9 = P.querySelector('[data-a="x"]') || P.querySelector('.x'); if (b9) b9.click(); return 1; }); if (!n) break; await W8(250); await p.keyboard.press('Escape'); await W8(200); } };
    await closeAll();
    await ev(() => { const G = SM_TOWN.game(); G.setClock(false); G.S.min = 10 * 60; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; });
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 600) } : null; });
    const R = () => ev(() => SM_TOWN.jobs().req), J = 'SM_TOWN.jobs()';
    const go = async at => { await ev(a => { const [x, z] = a; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, at); await W8(2300); };
    const far = async at => go([at[0] + 60, at[1] + 60]);
    // 도장 전부 · 배지는 한 갈래만 먼저
    const G9 = await ev(() => { const Jb = SM_TOWN.jobs(), P9 = SM_TOWN.game().S.pass || (SM_TOWN.game().S.pass = { v: {}, b: {} }); for (const q of Jb.eligible()) P9.v[Jb.keyOf(q)] = SM_TOWN.game().S.day; P9.b = {}; const st = Jb.groupStat(); return Object.keys(st).filter(g => st[g].t && Jb.dbg.qMake(g)); });
    ok(G9.length >= 2, '부탁을 만들 수 있는 갈래 ' + G9.join(','));
    const g1 = G9.find(g => g !== 'learn') || G9[0];
    const pass0 = await (async () => { await ev(() => SM_TOWN.jobs().openPass()); await W8(300); const t = (await panel() || {}).t || ''; await closeAll(); return t; })();
    ok(!/이 갈래 이웃 부탁/.test(pass0), '배지 없음 = 여권에 부탁 단추 없음');
    await ev(g => { SM_TOWN.game().S.pass.b[g] = SM_TOWN.game().S.day; }, g1);
    await ev(() => SM_TOWN.jobs().openPass()); await W8(300); const pass1 = (await panel() || {}).t || ''; ok((pass1.match(/이 갈래 이웃 부탁/g) || []).length === 1, '배지 받은 갈래(' + g1 + ') = 여권 갈래 줄에 부탁 단추 하나');
    await ev(g => { const b9 = document.querySelector('.twn-p [data-q="' + g + '"]'); if (b9) b9.click(); }, g1); await W8(400); let r = await R();
    const A0 = r.cur && await ev(k => SM_TOWN.jobs().dbg.qSpot(k), r.cur.a);
    ok(r.cur && r.cur.st === 'toA' && r.cur.g === g1 && A0 && A0.g === g1, '멀리서 받음 = 먼저 부탁한 곳(' + (A0 && A0.name) + ')으로 · 단계 ' + (r.cur && r.cur.st));
    await go(A0.at); r = await R(); let P = await panel(); const tA = r.cur;
    if (RENDER) { require('fs').mkdirSync(SHOT, { recursive: true }); await W8(400); await p.screenshot({ path: SHOT + '/preq_pick.png' }); }
    ok(r.cur.st === 'pick' && P && P.k === 'preq' && /어디에서 일할까요/.test(P.t) && (await ev(() => document.querySelectorAll('.twn-p [data-o]').length)) === 3, '부탁한 곳에 걸어가면 = 고르기 창(셋 · 「' + (P && (P.t.match(/“[^”]*”/) || [''])[0]) + '」)');
    const T = await ev(k => SM_TOWN.jobs().dbg.qSpot(k), tA.t); ok(T && T.jobs.includes(tA.job), '맞는 곳 = 그 직업이 일하는 곳(' + T.name + ' · ' + tA.job + ')');
    const wrongK = tA.opts.find(k => k !== tA.t), W = await ev(k => SM_TOWN.jobs().dbg.qSpot(k), wrongK); ok(W && !W.jobs.includes(tA.job), '다른 둘엔 그 직업이 없음(' + W.name + ')');
    await ev(k => { const b9 = [...document.querySelectorAll('.twn-p [data-o]')].find(b => b.dataset.o === k); if (b9) b9.click(); }, wrongK); await W8(300); r = await R(); ok(r.cur.st === 'go' && r.cur.go === wrongK && !(await panel()), '틀린 곳 고름 → 그곳까지 걸어가기');
    await go(W.at); r = await R(); P = await panel(); const toast = await ev(() => [...document.querySelectorAll('#toast')].map(e => e.textContent).join(' | '));
    ok(r.cur.st === 'pick' && r.cur.wrong.includes(wrongK) && P && P.k === 'preq' && (await ev(k => { const b9 = [...document.querySelectorAll('.twn-p [data-o]')].find(b => b.dataset.o === k); return !!b9 && b9.disabled; }, wrongK)), '틀린 곳에 닿음 = 다시 고르기(틀린 곳은 막힘)');
    ok(/여기서 일하지 않아요/.test(toast), '틀린 곳 한 줄 「' + (toast.match(/🛂[^|]*/) || [''])[0].slice(0, 70) + '」');
    await ev(k => { const b9 = [...document.querySelectorAll('.twn-p [data-o]')].find(b => b.dataset.o === k); if (b9) b9.click(); }, tA.t); await W8(300); await go(T.at); r = await R();
    if (tA.kind === 'fetch') { ok(r.cur && r.cur.st === 'back', '빌린 책 = 받아서 다시 가져가기'); await go(A0.at); r = await R(); }
    ok(!r.cur && r.log.length === 1 && r.log[0].miss === 1 && r.day[g1] != null, '맞는 곳 = 부탁 끝 · 기록(틀림 ' + (r.log[0] && r.log[0].miss) + ')');
    await closeAll(); await ev(() => SM_TOWN.jobs().openPass()); await W8(300); const pass2 = (await panel() || {}).t || ''; ok(/지난 부탁/.test(pass2) && /오늘 부탁은 들어줬어요/.test(pass2), '여권 = 지난 부탁 한 줄 · 오늘 그 갈래 끝'); await closeAll();
    // ⑤ 배움 갈래(빌린 책) — 받아서 다시 가져오기
    if (G9.includes('learn')) { await ev(() => { const S = SM_TOWN.game().S; S.pass.b.learn = S.day; }); for (let k = 0; k < 14; k++) { await ev(() => { const S = SM_TOWN.game().S; S.pass.q.cur = null; S.pass.q.day = {}; SM_TOWN.jobs().qOffer('learn'); }); await W8(200); r = await R(); if (r.cur && r.cur.kind === 'fetch') break; await closeAll(); await ev(() => { const S = SM_TOWN.game().S; S.day += 1; S.pass.q.cur = null; }); }
      if (!(r.cur && r.cur.kind === 'fetch')) console.log('  (도서관 부탁이 열네 날 안에 없음)'); const a = await ev(k => SM_TOWN.jobs().dbg.qSpot(k), r.cur.a), t = await ev(k => SM_TOWN.jobs().dbg.qSpot(k), r.cur.t);
      if (r.cur.st === 'toA') await go(a.at); await ev(k => { const b9 = [...document.querySelectorAll('.twn-p [data-o]')].find(b => b.dataset.o === k); if (b9) b9.click(); }, r.cur.t); await W8(300); await go(t.at); const r1 = await R(); await go(a.at); const r2 = await R();
      ok(r.cur.kind === 'fetch' && r1.cur && r1.cur.st === 'back' && !r2.cur, '빌린 책 = 받을 곳(' + t.name + ') → 다시 부탁한 곳(' + a.name + ')까지 걸어야 끝'); } else console.log('  (배움 갈래 부탁 없음 — 건너뜀)');
    // ⑥ 날마다 다른 부탁 · 연속 같은 부탁 0
    const seq = []; for (let k = 0; k < 10; k++) { const c = await ev(g => { const S = SM_TOWN.game().S, Jb = SM_TOWN.jobs(); S.day += 1; S.pass.q.cur = null; Jb.qOffer(g); const c9 = Jb.req.cur; if (c9) { S.pass.q.cur = null; S.pass.q.log.push({ d: S.day, g, a: c9.a, t: c9.t, job: c9.job, from: c9.from, kind: c9.kind, miss: 0 }); S.pass.q.last[g] = c9.a + '>' + c9.t; S.pass.q.day[g] = S.day; } return c9 ? c9.a + '>' + c9.t + '|' + c9.job : null; }, g1); seq.push(c); await closeAll(); }
    const rep = seq.filter((q, i) => i && q === seq[i - 1]).length; ok(seq.every(Boolean) && rep === 0 && new Set(seq).size >= 3, '열 날 = 바로 앞과 같은 부탁 ' + rep + ' · ' + new Set(seq).size + '가지 (' + seq.slice(0, 4).join(' ') + ' …)');
    ok(seq[0] !== seq[1], '두 판(날)에서 할 일이 다름: ' + seq[0] + ' / ' + seq[1]);
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' · ' + errs.slice(0, 4).join(' / ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); } finally { await b.close(); }
  console.log((fails.length ? '✗ 실패 ' + fails.length : '✓ 모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
