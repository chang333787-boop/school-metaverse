// 📒 사건 수첩 시험(CASE-1 · v2/games/town_case.js · 첫 사건 '흐려진 강' · 둘째 사건 '사라진 장터 저울'): node tools/harness/town_case.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--only=river|scale|siteRoad]
//   🚧 ⑨ 공사장 길 안전: 흐려진 강 씨앗 날 = 아직 X → 다음 날 아침 저절로 · 기한 사흘 · 단서 여섯(입구 지켜보기 = 아침 8~9시에 그 자리에 서 있어야 · 떠나면 처음부터 · 길바닥 흙 · 쌓인 자재 · 끊긴 보도 · 길을 지나는 이웃 · 공사 일꾼)
//      틀린 까닭 둘(빨라서 = 과속 방지 턱 · 어두워서 = 가로등) '아니었어요' + 90분 · 맞는 까닭 = 끊긴 보도 눈높이 · 창구(생각 = 되물음 · 근거 없음 = 하나 더) → 대책 고르기(틀린 대책 = 직원이 까닭) · 다음 날 울타리 보도·건널목·'공사 차량 시간' 판 · 트럭이 8~9시를 비움 · 늦음 = 하루 보도 막힘 → 다음 날 고침
//   ⚖️ ⑧ 장날 아침(어제 바람 약함) 저절로 · 기한 이틀 · 단서 여섯(바닥 자국 방위 · 정류장 시간표 · 정자 이웃 저녁 · 옆 가게 이웃 오후 + 본 것을 보여 줘야 생각남 · 맡긴 곳 장부 9~18시 · 날씨 창 바람)
//      틀린 까닭 = 분실물 '아니었어요' + 90분 · 맞는 까닭 = 선반 · 상인에게 본 것 둘(생각 = 되물음 · 간 곳 근거 없음 = 하나 더) · 다음 날 고친 저울 + '정확해요' 판 + 소식 · 늦음 = 다음 장날 임시 저울 → 그다음 날 돌아옴
//   ① 비 사흘 → 그다음 아침 저절로 사건(물 높이 +1) · 칩·위 가운데 줄 '기한 사흘' · 단서 자리엔 빨간 선 X
//   ② 단서 다섯(장소·사람·때가 다름): 정류장 안내판 · 장터 상인(아침 8~10시만 · 오후엔 '아침에 와요') · 공사장 울타리 안 흙더미 · 날씨 창 비 기록 · 물 떠 보기(물가 세 곳 · 물에서 멀면 못 뜸)
//   ③ 틀린 가설 → 확인 자리만 빨간 선 → '아니었어요' + 시각 90분 · 기한 줄어듦 ④ 맞는 가설 → 맞았어요 → 창구(09~18시) 보고서: '들은 생각'을 넣으면 직원이 되물음 → 본 것 둘 = 접수
//   ⑤ 하루 마무리 '내일 기다리는 것' · 잠 → 다음 날 흙막이(공사장 고랑 X) · 물 흙탕 값이 하루씩 내려감 · 아침 소식 한 줄 · 이웃 반응 둘
//   ⑥ 기한 넘김 판: 사흘 넘게 안 냄 → 늦음 → 비 오는 날 논 한 칸 흙탕(하루) → 다음 날 흙막이 · 벌 X ⑦ 휴대폰 390 수첩 창(가로 넘침 X) ⑧ 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7) || null;   /* --only=river · --only=scale · --only=siteRoad = 한 사건만 */
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 900) } : null; });
    const closeAll = async () => { for (let i = 0; i < 4 && (await ev(() => !!document.querySelector('.twn-dlg'))); i++) { await p.keyboard.press('Escape'); await W8(300); }   /* 이야기 대화(저절로 열리는 다음 장)가 E를 먹지 않게 */
      for (let i = 0; i < 6; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const I = () => ev(() => SM_TOWN.case().info()), C = (k, a) => ev(([k, a]) => SM_TOWN.case().dbg[k](a), [k, a]);
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [x, z]);
    const tpE = async (x, z, done) => { for (let k = 0; k < 6; k++) { await closeAll(); await tp(x + 0.2, z + 0.2); for (let w = 0; w < 20; w++) { await W8(300); if (await ev(() => [...document.querySelectorAll('div')].some(d => /^(E  |✋ )/.test(d.textContent) && d.style.display !== 'none' && !d.children.length))) break; } await W8(300); await p.keyboard.press('KeyE'); await W8(800); if (!done || await done()) return true; await W8(700); } return false; };   /* 순간이동 직후 E 자리 잡힘이 늦는 때가 있어 여섯 번까지 */
    const said = re => ev(re => { const t9 = document.getElementById('toast'); return !!(t9 && t9.style.display !== 'none' && new RegExp(re).test(t9.textContent)); }, re);
    const waitSaid = async re => { for (let i = 0; i < 10; i++) { if (await said(re)) return true; await W8(250); } return false; };
    const at = async m => { await ev(m9 => { const G = SM_TOWN.game().S; G.clock = false; G.min = m9; SM_TOWN.game().mark(); }, m); await W8(1300); };
    const calm = () => ev(() => { const G = SM_TOWN.game().S; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } if (G.fix) { G.fix.d = G.day; } });
    const sleep = async () => { await closeAll(); await ev(() => SM_TOWN.sleep()); await W8(3800); const rc = await panel(); await closeAll(); await calm(); return rc; };
    const route = () => ev(() => SM_TOWN.routePts());
    const shot = async (n, from, look) => { if (!SHOTS) return; await closeAll(); await tp(from[0], from[1]); await ev(l => SD2.map.player.lookAt(l), look); await W8(1800); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.case && SM_TOWN.case() && SM_TOWN.fix && SM_TOWN.fix() && SM_TOWN.routePts, null, { timeout: 240000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); SM_TOWN.rules.season('summer'); SM_TOWN.case().dbg.clear(); }); await calm();
    const R0 = await ev(() => SM_TOWN.schRect()); await tp((R0[0] + R0[2]) / 2, R0[3] + 30); await W8(800);
    let r = null, P = null;
    const pickK = async ks => { for (const k of ks) await ev(k => document.querySelector('.twn-p [data-k="' + k + '"]').click(), k); await W8(200); await ev(() => document.querySelector('.twn-p [data-a="go"]').click()); await W8(400); return panel(); };
    if (!ONLY || ONLY === 'river') {
    // ① 비 사흘 → 저절로
    for (let k = 0; k < 3; k++) { await at(9 * 60); await ev(() => SM_TOWN.rules.wx('rain')); await W8(1300); ok(!(await I()).cur, (k + 1) + '일째 비 = 아직 사건 X'); await sleep(); }
    await ev(() => SM_TOWN.rules.wx('clear')); await at(7 * 60); let i0 = null; for (let i = 0; i < 12; i++) { await W8(500); i0 = await I(); if (i0.cur) break; }
    const lv = await ev(() => SM_TOWN.routine().water().lv); ok(i0.cur && i0.cur.id === 'river' && lv >= 0.99, '비 사흘 뒤 아침 = 「흐려진 강」 저절로 (물 높이 ' + lv + ')'); if (!i0.cur) throw new Error('사건이 안 생김 ' + JSON.stringify(i0.dbg));
    const PL = i0.cur.pl; console.log('    자리: 공사장 ' + PL.site.cell + ' · 배수구 ' + PL.drain.cell + ' · 안내판 ' + PL.sign.cell + ' · 장터 ' + PL.mkCell + ' · 논 ' + PL.fmCell + ' · 먼 물가 ' + PL.far.cell);
    ok(/기한 사흘/.test(i0.line) && /기한 사흘/.test(i0.chip), '칩·위 가운데 줄 = 「' + i0.line + '」');
    ok(i0.meshes.site === 1 && i0.meshes.trail === 1 && i0.meshes.drain === 1 && i0.meshes.sign === 2, '소품 그리기: 공사장 1 · 고랑 1 · 배수구 1 · 안내판 2');
    await at(10 * 60); await W8(1200); { const g = await ev(() => SD2.map.hud && document.body.innerText); ok(/흐려진 강 · 기한/.test(g), '위 가운데 줄에 사건 한 줄'); }
    await tp(PL.market.x + 30, PL.market.z + 30); await W8(800);
    const SP = [PL.site, PL.drain, PL.sign, PL.market, PL.farmer, PL.trail, PL.far], noLine = async () => { const rp = await route(); if (!rp || !rp.length) return true; const e9 = rp[rp.length - 1]; return !SP.some(q => Math.hypot(e9[0] - q.x, e9[1] - q.z) < 8); };
    ok(await noLine(), '처음 = 단서 자리에 빨간 선 X');
    // ② 단서
    r = await tpE(PL.sign.x, PL.sign.z, async () => ((await panel()) || {}).k === 'caseclue'); P = await panel(); ok(r && /안내판/.test(P.t) && /본 것/.test(P.t), '🚏 정류장 안내판 = 본 것 (' + PL.sign.cell + ')'); await shot('case_sign', [PL.sign.x + (PL.sign.sx - PL.sign.x) * 2.2, PL.sign.z + (PL.sign.sz - PL.sign.z) * 2.2], [PL.sign.x, PL.sign.z]);
    await at(14 * 60); r = await tpE(PL.market.x, PL.market.z, async () => (await I()).dbg.some(t => /^talk market false/.test(t))); ok(r && !(await I()).cur.clues.market, '🗣 장터 상인 오후 2시 = 「아침 8~10시에 다시 와 줘요」 · 단서 X');
    await at(8 * 60 + 30); await W8(1500); r = await tpE(PL.market.x, PL.market.z, async () => ((await panel()) || {}).k === 'caseclue'); P = await panel(); ok(r && /들은 생각/.test(P.t) && /트럭/.test(P.t) && (await I()).cur.clues.market, '🗣 장터 상인 아침 8:30 = 들은 생각 (' + PL.mkCell + ')');
    if (!(await I()).cur.clues.market) { console.log('    state ' + JSON.stringify(await ev(() => ({ cls: document.body.className, dlg: !!document.querySelector('.twn-dlg'), play: !!document.querySelector('.twn-play'), hint: [...document.querySelectorAll('div')].filter(d => /^(E  |✋ )/.test(d.textContent) && !d.children.length).map(d => d.textContent + '|' + d.style.display), ctrl: !!(SD2.CTRL && SD2.CTRL.hot), min: SM_TOWN.game().S.min })))); await W8(1500); const hint = await ev(() => [...document.querySelectorAll('div')].filter(d => /^(E  |✋ )/.test(d.textContent) && d.offsetParent).map(d => d.textContent).slice(0, 3)); await p.keyboard.press('KeyE'); await W8(800); console.log('    hint ' + JSON.stringify(hint) + ' after ' + JSON.stringify((await I()).dbg) + ' P ' + JSON.stringify(await panel())); }
    if (!(await I()).cur.clues.market) console.log('    ' + JSON.stringify({ P, dbg: (await I()).dbg, toast: await ev(() => document.getElementById('toast').textContent), wk: await ev(i => { const w = SM_TOWN.routine().info().list.find(o => o.i === i); return w; }, PL.market.i), me: await ev(() => SD2.map.player.pos()), near: await ev(() => { const m = SD2.map.player.pos(); return SD2.map.interact.list().filter(h => Math.hypot(h.x - m.x, h.z - m.z) < 4).map(h => [h.label, +Math.hypot(h.x - m.x, h.z - m.z).toFixed(1), !!h.off, +h.y.toFixed(2), +m.y.toFixed(2)]); }) }));
    r = await tpE(PL.site.x + PL.site.ux * 0.8, PL.site.z + PL.site.uz * 0.8, async () => ((await panel()) || {}).k === 'caseclue'); P = await panel(); ok(r && /흙더미/.test(P.t), '⛏ 공사장 울타리 안 흙더미 = 본 것 (' + PL.site.cell + ')');
    await shot('case_site', [PL.site.x + PL.site.ux * 14 + PL.site.uz * 6, PL.site.z + PL.site.uz * 14 - PL.site.ux * 6], [PL.site.x, PL.site.z]);
    await closeAll(); await ev(() => SM_TOWN.openWx()); await W8(500); P = await panel(); ok(P && P.k === 'wx' && /지난 사흘 날씨 기록/.test(P.t) && (await I()).cur.clues.rain, '🌧 날씨 창 = 비 기록 (본 것)'); await closeAll();
    // 물 떠 보기(몸으로): 물에서 먼 곳 X → 물가 세 곳
    await tp(PL.site.x, PL.site.z); await W8(1300); ok(!(await I()).near, '물에서 먼 곳(공사장) = 물 뜨기 칩 X');
    const shoreOf = (x, z) => ev(([x, z]) => { for (let r9 = 0; r9 < 40; r9 += 1) for (let a = 0; a < 16; a++) { const px = x + Math.cos(a * 0.3927) * r9, pz = z + Math.sin(a * 0.3927) * r9, s9 = SM_TOWN.sd(px, pz); if (s9 > 0.6 && s9 < 2.6) return [px, pz]; } return [x, z]; }, [x, z]);
    const riv = PL.line[Math.min(PL.line.length - 1, Math.floor(PL.line.length * 0.35))], S3 = [[PL.trail.x, PL.trail.z], await shoreOf(riv[0], riv[1]), [PL.far.x, PL.far.z]];
    for (const [k, q] of S3.entries()) { await closeAll(); await tp(q[0], q[1]); let i9 = null; for (let w = 0; w < 12; w++) { await W8(400); i9 = await I(); if (i9.chip === 'w') break; } ok(i9.near && i9.chip === 'w', '물가 ' + (k + 1) + ' = 「💧 여기 물 떠 보기」 칩'); await ev(() => SM_TOWN.case().dbg.sample()); await W8(500); P = await panel(); ok(P && P.k === 'casesmp', '  물 떠 보기 창 · ' + ((P && P.t.split('\n').find(L => /물:/.test(L))) || '')); if (k === 0) await shot('case_sample', [q[0], q[1]], [q[0], q[1]]); }
    let i1 = await I(); ok(i1.cur.samples.length === 3 && i1.cur.clues.sample && i1.cur.samples.some(o => o.m > 0.6) && i1.cur.samples.some(o => o.m < 0.3), '💧 물빛 견주기 = 세 곳(흐림·맑음 다 있음) → 본 것');
    const kinds = Object.keys(i1.cur.clues); ok(kinds.length >= 5, '단서 ' + kinds.length + '개: ' + kinds.join(' · ') + ' (장소 다섯 · 사람 · 아침 · 날씨 창)'); ok(await noLine(), '단서를 다 모아도 빨간 선 X');
    // 수첩(사실 / 생각 나뉨)
    await closeAll(); await ev(() => SM_TOWN.case().notebook()); await W8(400); P = await panel(); const nbOk = await ev(() => { const P9 = document.querySelector('.twn-p'), c = P9 && P9.querySelectorAll('.cs-c'); return c && c.length === 2 && /흙더미/.test(c[0].innerText) && /트럭/.test(c[1].innerText) && !/트럭/.test(c[0].innerText); });
    ok(P && P.k === 'case' && nbOk, '수첩 = 본 것 칸 · 들은 생각 칸이 나뉨'); if (SHOTS) await p.screenshot({ path: SHOTS + '/case_notebook.png' });
    // ③ 틀린 가설
    await ev(() => document.querySelector('.twn-p [data-a="h"]').click()); await W8(400); P = await panel(); ok(P && P.k === 'casehyp' && (await ev(() => document.querySelectorAll('.twn-p [data-h]').length)) === 3, '까닭 셋 고르기');
    await ev(() => document.querySelector('.twn-p [data-h="fac"]').click()); await W8(800); { const rp = await route(), e9 = rp && rp[rp.length - 1]; ok(e9 && Math.hypot(e9[0] - PL.drain.x, e9[1] - PL.drain.z) < 8, '공장 까닭 = 확인 자리(배수구)에만 빨간 선'); }
    const t0 = await ev(() => SM_TOWN.game().S.min), left0 = (await I()).due - (await I()).now;
    r = await tpE(PL.drain.x, PL.drain.z, async () => ((await panel()) || {}).k === 'casechk'); P = await panel(); const t1 = await ev(() => SM_TOWN.game().S.min), left1 = (await I()).due - (await I()).now;
    ok(r && /아니었어요/.test(P.t) && /90분/.test(P.t), '배수구 = 「공장 때문은 아니었어요」'); ok(t1 - t0 >= 90 && left0 - left1 >= 90, '틀린 가설 = 시각 +' + (t1 - t0) + '분 · 기한 ' + (left0 - left1) + '분 줄어듦 (벌·점수 X)');
    await shot('case_drain', [PL.drain.x + PL.drain.ux * 3, PL.drain.z + PL.drain.uz * 3], [PL.drain.x - PL.drain.ux, PL.drain.z - PL.drain.uz]);
    // ④ 맞는 가설
    if (!(await panel())) { await ev(() => SM_TOWN.case().notebook()); await W8(400); }   /* 사진을 찍느라 창을 닫았으면 수첩에서 */
    await ev(() => document.querySelector('.twn-p [data-a="h"]').click()); await W8(400); ok(await ev(() => document.querySelector('.twn-p [data-h="fac"]').disabled), '고른 적 있는 까닭 = 「아니었어요」로 막힘');
    await ev(() => document.querySelector('.twn-p [data-h="site"]').click()); await W8(800);
    r = await tpE(PL.trail.x, PL.trail.z, async () => ((await panel()) || {}).k === 'casechk'); P = await panel(); ok(r && /맞았어요/.test(P.t), '흙물 자국 = 「맞았어요」 → 보고서'); await closeAll();
    // 창구
    const H0 = (await ev(() => SM_TOWN.fix().info())).halls[0]; await at(8 * 60); r = await tpE(H0.at[0], H0.at[1], () => said('09:00')); ok(r && !(await panel()), '창구 08:00 = 문 닫음 한 줄');
    await at(11 * 60); r = await tpE(H0.at[0], H0.at[1], async () => ((await panel()) || {}).k === 'caserep'); ok(r, '창구 11:00 = 사건 보고서 창');
    P = await pickK(['market', 'sample']); ok(/상인의 생각/.test(P.t) && (await I()).cur.st === 'open', '「들은 생각」을 근거로 내면 = 직원이 되물음');
    P = await pickK(['site']); ok(/받았어요/.test(P.t) && /토사/.test(P.t) && /흙막이/.test(P.t) && (await I()).cur.st === 'ok', '본 것 둘(물빛·흙더미) = 접수 + 낱말 둘'); await closeAll();
    // ⑤ 하루 마무리 · 다음 날
    const dR = await ev(() => SM_TOWN.game().S.day); const rc = await sleep(); ok(rc && /흙막이가 서요/.test(rc.t), '하루 마무리 「내일 기다리는 것」 = 「공사장에 흙막이가 서요」');
    await at(9 * 60); let i2 = null; for (let i = 0; i < 8; i++) { await W8(500); i2 = await I(); if (i2.cur && i2.cur.st === 'fixed') break; }
    ok(i2.cur.st === 'fixed' && i2.cur.fixD === dR + 1 && !i2.meshes.trail && i2.meshes.site === 1, '다음 날 = 흙막이(공사장 고랑 사라짐)');
    const nw = await ev(d => SM_TOWN.case().news(d), dR + 1); ok(nw.some(q => /흙막이를 세웠어요/.test(q.t[0])), '아침 소식 「' + ((nw[0] || { t: ['-'] }).t[0]) + '」');
    const N9 = await ev(() => SM_TOWN.news()); ok(N9 && (N9.lines || []).some(L => L.k === 'fx:case:river'), '소식판 줄에 실림');
    const lvA = await ev(() => SM_TOWN.water().set && SM_TOWN.water().set.lv); ok(lvA != null && lvA >= 0.49 && lvA <= 0.76, '물 흙탕 값 ' + lvA);
    await ev(() => SM_TOWN.case().notebook()); await W8(400); P = await panel(); ok(/흙막이 판 여섯/.test(P.t) && /논 일꾼/.test(P.t) && /공사 일꾼/.test(P.t), '결과 = 본 것(흙막이) + 생각 둘(반기는 이웃 · 불편한 공사 일꾼)'); await closeAll();
    await shot('case_fixed', [PL.site.x + PL.site.ux * 14 + PL.site.uz * 6, PL.site.z + PL.site.uz * 14 - PL.site.ux * 6], [PL.site.x, PL.site.z]);
    await shot('case_fixed_b', [PL.trail.x + PL.site.ux * 1.5, PL.trail.z + PL.site.uz * 1.5], [PL.site.x, PL.site.z]);
    await sleep(); await at(9 * 60); await W8(1500); const lvB = await ev(() => SM_TOWN.water().set && SM_TOWN.water().set.lv); ok(lvB != null && lvB < lvA, '그다음 날 = 더 맑아짐 (' + lvA + ' → ' + lvB + ')');
    // ⑥ 기한 넘김 판
    await ev(() => SM_TOWN.case().dbg.plan()); await W8(600); const dL = await ev(() => SM_TOWN.game().S.day);
    for (let k = 0; k < 3; k++) { await at(10 * 60); const rc9 = await sleep(); if (k === 0) ok(rc9 && /흐려진 강: 오늘 말고 2일 남았어요/.test(rc9.t), '하루 마무리(사건 첫날) = 「흐려진 강: 오늘 말고 2일 남았어요」'); if (k === 1) ok(rc9 && /흐려진 강: 내일이 마지막 날/.test(rc9.t), '하루 마무리(둘째 날) = 「내일이 마지막 날이에요」'); if (k === 1) { const tl = await ev(() => SM_TOWN.dayx && SM_TOWN.dayx() ? SM_TOWN.dayx().list().map(q => q.g) : null); if (tl) ok(tl.includes('case'), '마지막 날 오늘 때 목록에 「흐려진 강 기한 18:00」'); } }
    await ev(() => SM_TOWN.rules.wx('rain')); await at(9 * 60); let i3 = null; for (let i = 0; i < 8; i++) { await W8(500); i3 = await I(); if (i3.cur && i3.cur.mudD) break; }
    ok(i3.cur.late === dL + 3 && i3.cur.mudD === dL + 3 && i3.meshes.mud === 1, '기한 넘김 → 비 오는 날 논 한 칸 흙탕 (그리기 ' + i3.meshes.mud + ')');
    ok((await ev(d => SM_TOWN.case().news(d), dL + 3)).some(q => /논 한 곳/.test(q.t[0])), '아침 소식 = 농수로 흙탕물 한 줄');
    if (SHOTS) await shot('case_mud', [i3.cur.pl.mud.x + 12, i3.cur.pl.mud.z + 12], [i3.cur.pl.mud.x, i3.cur.pl.mud.z]);
    await ev(() => SM_TOWN.case().notebook()); await W8(300); P = await panel(); ok(/다음엔 더 빨리/.test(P.t), '수첩 = 「다음엔 더 빨리 알려 줘요」(벌 X)'); await closeAll();
    await ev(() => SM_TOWN.rules.wx('clear')); await sleep(); await at(9 * 60); let i4 = null; for (let i = 0; i < 8; i++) { await W8(500); i4 = await I(); if (i4.cur && i4.cur.st === 'lateFix') break; } ok(i4.cur.st === 'lateFix' && !i4.meshes.mud, '다음 날 = 흙탕 사라짐 · 마을이 흙막이');
    // ⑦ 휴대폰 390
    await p.setViewportSize({ width: 390, height: 844 }); await W8(800); await ev(() => SM_TOWN.case().notebook()); await W8(500);
    const ph = await ev(() => { const P9 = document.querySelector('.twn-p'), r9 = P9 && P9.getBoundingClientRect(); return P9 ? { w: Math.round(r9.width), l: Math.round(r9.left), r: Math.round(r9.right), sw: document.documentElement.scrollWidth, cols: getComputedStyle(P9.querySelector('.cs-g')).gridTemplateColumns } : null; });
    ok(ph && ph.l >= 0 && ph.r <= 390 && ph.sw <= 390 && !/ /.test(ph.cols.trim()), '휴대폰 390 수첩 창 (폭 ' + (ph && ph.w) + ' · 한 줄 칸 · 가로 넘침 X)'); if (SHOTS) await p.screenshot({ path: SHOTS + '/case_notebook_390.png' }); await closeAll(); await p.setViewportSize({ width: 1280, height: 720 });
    } /* 흐려진 강 끝 */
    // ───────── ⚖️ 사라진 장터 저울(SCALE-1) ─────────
    if (!ONLY || ONLY === 'scale') {
    console.log('  — ⚖️ 사라진 장터 저울');
    await closeAll(); await ev(() => { SM_TOWN.case().dbg.clear(); SM_TOWN.rules.wx('clear'); if (SM_TOWN.typhoon) { SM_TOWN.typhoon.info(); if (SM_TOWN.game().S.typh && SM_TOWN.game().S.typh.st) SM_TOWN.typhoon.dbg.finish(); } const t9 = SM_TOWN.game().S.typh; if (t9 && !t9.st) { t9.n = Math.max(1, t9.n | 0); t9.last = 1e6; } }); await calm();   /* 태풍 판(7일째부터 저절로)이 장날과 겹치지 않게 */
    // ⑧ 장날 아침(어제 바람 약함) = 저절로
    const dJ = await ev(() => { const D0 = SM_TOWN.game().S.day; for (let d = D0 + 2; d < D0 + 80; d++) if (d % 5 === 0 && !SM_TOWN.case().dbg.windy(d - 1)) return d; return -1; });
    await ev(d => { const G = SM_TOWN.game().S; G.day = d - 1; SM_TOWN.game().mark(); }, dJ); await at(9 * 60); await W8(1300); ok(!(await I()).cur, '장날 전날(' + (dJ - 1) + '일째) = 아직 사건 X'); await sleep();
    await ev(() => SM_TOWN.rules.wx('clear')); await at(7 * 60); let j0 = null; for (let i = 0; i < 12; i++) { await W8(500); j0 = await I(); if (j0.cur) break; }
    ok(j0.cur && j0.cur.id === 'scale' && j0.cur.d0 === dJ && (await ev(() => SM_TOWN.case().dbg.ctx().jang.on)), '장날(' + dJ + '일째) 아침 = 「사라진 장터 저울」 저절로');
    if (!j0.cur || j0.cur.id !== 'scale') throw new Error('저울 사건이 안 생김 ' + JSON.stringify(j0.dbg) + ' ' + JSON.stringify(await ev(() => [SM_TOWN.case().dbg.ctx(), SM_TOWN.case().dbg.gate(), document.querySelector('.twn-p') && document.querySelector('.twn-p').dataset.k, document.body.className])));
    const Q = j0.cur.pl; console.log('    자리: 장터 ' + Q.mkCell + ' · 맡긴 곳 ' + Q.fix.name + ' ' + Q.fix.cell + '(' + Q.fix.kind + ') · 분실물 ' + Q.lost.name + ' ' + Q.lost.cell + ' · 정류장 ' + Q.bus.cell + ' · 정자 ' + Q.pav.cell + ' · 방위 ' + Q.dir);
    ok(/사라진 장터 저울 · 기한 이틀/.test(j0.line) && /기한 이틀/.test(j0.chip), '칩·위 가운데 줄 = 「' + j0.line + '」');
    ok(j0.meshes.sc_track === 1 && j0.meshes.sc_bus === 2 && j0.meshes.sc_book === 1 && !j0.meshes.sc_scale, '소품 그리기: 바닥 자국 1 · 시간표 2 · 장부 탁자 1 · 저울 X');
    ok((await ev(d => SM_TOWN.case().news(d), dJ)).some(q => /저울이 없어졌대요/.test(q.t[0])), '아침 소식 = 「저울이 없어졌대요」');
    const SQ = [Q.track, Q.bus, Q.fix, Q.pav, Q.nb, Q.mk, Q.roll, Q.lost], noLineS = async () => { const rp = await route(); if (!rp || !rp.length) return true; const e9 = rp[rp.length - 1]; return !SQ.some(q => Math.hypot(e9[0] - q.x, e9[1] - q.z) < 8); };
    ok(await noLineS(), '처음 = 단서 자리에 빨간 선 X');
    /* 그리기 켬이면 순간이동 뒤 E 자리 잡힘이 더 늦음 → 안내 글이 그 자리 이름일 때까지 기다렸다가 E(앞 자리 E를 누르지 않게) */
    const tpL = async (x, z, lab, done) => { for (let k = 0; k < 6; k++) { await closeAll(); await tp(x + 0.2, z + 0.2); for (let w = 0; w < 40; w++) { await W8(300); if (await ev(l => [...document.querySelectorAll('div')].some(d => /^(E  |✋ )/.test(d.textContent) && d.textContent.includes(l) && d.style.display !== 'none' && !d.children.length), lab)) break; } await W8(300); if (process.env.DBGE) console.log('    E전 ' + lab + ' ' + JSON.stringify(await ev(() => ({ p: !!document.querySelector('.twn-p'), dlg: !!document.querySelector('.twn-dlg'), cls: document.body.className, hint: [...document.querySelectorAll('div')].filter(d => /^(E  |✋ )/.test(d.textContent) && !d.children.length).map(d => d.textContent + '|' + d.style.display), dbg: SM_TOWN.case().info().dbg.slice(-2) })))); await p.keyboard.press('KeyE'); await W8(800); if (process.env.DBGE) console.log('    E뒤 ' + JSON.stringify(await panel()) + ' ' + (await ev(() => document.getElementById('toast').textContent))); if (!done || await done()) return true; await W8(700); } return false; };
    const clueP = async (x, z, lab) => tpL(x, z, lab, async () => ((await panel()) || {}).k === 'caseclue');
    // 옆 가게 이웃: 오전 = 오후에 와요 · 본 것 없음 = 모르겠어요 · 시간표만 보여 줌 = 모르겠어요 · 바닥 자국을 보여 줌 = 생각남
    await at(10 * 60); r = await tpL(Q.nb.x, Q.nb.z, '저울 이야기 묻기', () => said('오후 1~6시')); ok(r && !(await I()).cur.clues.nbr, '🗣 옆 가게 이웃 오전 10시 = 「오후 1~6시에 다시 와 줘요」');
    await at(14 * 60); r = await tpL(Q.nb.x, Q.nb.z, '저울 이야기 묻기', () => said('모르겠어요')); ok(r && !(await I()).cur.clues.nbr && !(await panel()), '🗣 옆 가게 이웃(본 것 없음) = 「글쎄요, 잘 모르겠어요」 · 단서 X');
    r = await clueP(Q.bus.x, Q.bus.z, '버스 시간표'); P = await panel(); ok(r && /시간표/.test(P.t) && /6시 10분/.test(P.t) && /본 것/.test(P.t), '🚏 정류장 시간표 = 본 것 (' + Q.bus.cell + ')');
    if (SHOTS) { const by = Q.bus.ry != null ? Q.bus.ry : Math.atan2(Q.bus.sx - Q.bus.x, Q.bus.sz - Q.bus.z); await shot('scale_bus', [Q.bus.x + Math.sin(by) * 3.4 + Math.cos(by) * 1.2, Q.bus.z + Math.cos(by) * 3.4 - Math.sin(by) * 1.2], [Q.bus.x, Q.bus.z]); }
    await at(14 * 60 + 10); r = await tpL(Q.nb.x, Q.nb.z, '저울 이야기 묻기', async () => ((await panel()) || {}).k === 'casenbr'); ok(r && (await ev(() => document.querySelectorAll('.twn-p [data-f]').length)) === 1, '🗣 옆 가게 이웃(본 것 하나) = 「무엇을 보여 줄까요?」 창');
    await ev(() => document.querySelector('.twn-p [data-f="bus"]').click()); await W8(400); P = await panel(); ok(P && /잘 모르겠어요/.test(P.t) && !(await I()).cur.clues.nbr, '  시간표를 보여 주면 = 「그걸 봐도 잘 모르겠어요」 · 단서 X'); await closeAll();
    r = await clueP(Q.track.x, Q.track.z, '판매대 바닥'); P = await panel(); ok(r && /바퀴 자국/.test(P.t) && /받침 자국/.test(P.t) && new RegExp(['북', '북동', '동', '남동', '남', '남서', '서', '북서'][Q.dir] + '쪽').test(P.t), '👣 판매대 바닥 = 받침 자국 + 바퀴 자국 방위 (본 것)');
    if (SHOTS) await shot('scale_market', [Q.track.x - Q.track.ux * 3.5 + Q.track.uz * 2.5, Q.track.z - Q.track.uz * 3.5 - Q.track.ux * 2.5], [Q.track.x + Q.track.ux * 2, Q.track.z + Q.track.uz * 2]);
    await at(14 * 60 + 20); r = await tpL(Q.nb.x, Q.nb.z, '저울 이야기 묻기', async () => ((await panel()) || {}).k === 'casenbr'); await ev(() => document.querySelector('.twn-p [data-f="track"]').click()); await W8(600); P = await panel();
    ok(r && P && P.k === 'caseclue' && /제 수레/.test(P.t) && /들은 생각/.test(P.t) && (await I()).cur.clues.nbr, '  바닥 자국을 보여 주면 = 「그 바퀴 자국은 제 수레예요」 (들은 생각)');
    // 정자 이웃(맑은 저녁 6~8시만)
    r = await tpL(Q.pav.x, Q.pav.z, '어제 저녁 이야기', () => said('저녁 6~8시')); ok(r && !(await I()).cur.clues.wit, '🗣 정자 이웃 오후 2시 = 「맑은 날 저녁 6~8시에 모여요」');
    await ev(() => SM_TOWN.rules.wx('clear')); await tp(Q.pav.x + 1, Q.pav.z + 1); await at(19 * 60 + 20); for (let k = 0; k < 120; k++) { await W8(1000); if ((await ev(() => SM_TOWN.routine().info().list.filter(o => o.st === 'pav').length)) >= 1) break; }   /* 이웃이 일을 마치고 정자로 걸어옴(ROUTINE-2) */
    r = await tpL(Q.pav.x, Q.pav.z, '어제 저녁 이야기', async () => !!(await I()).cur.clues.wit); P = await panel(); ok(r && P && /마지막 버스/.test(P.t) && /들은 생각/.test(P.t), '🗣 정자 이웃 저녁 7:20(정자에 앉음) = 들은 생각 (' + Q.pav.cell + ')');
    if (!(await I()).cur.clues.wit) console.log('    정자 ' + JSON.stringify({ dbg: (await I()).dbg.slice(-6), toast: await ev(() => document.getElementById('toast').textContent), wx: await ev(() => SM_TOWN.case().dbg.ctx().wx), pav: await ev(() => SM_TOWN.routine().ev().pv), me: await ev(() => SD2.map.player.pos()), st: await ev(() => SM_TOWN.routine().info().list.filter(o => o.ev.pv >= 0).map(o => [o.i, o.st])), near: await ev(() => { const m = SD2.map.player.pos(); return SD2.map.interact.list().filter(h => Math.hypot(h.x - m.x, h.z - m.z) < 5).map(h => [h.label, +Math.hypot(h.x - m.x, h.z - m.z).toFixed(1), !!h.off, +h.y.toFixed(2), +m.y.toFixed(2)]); }) }));
    // 맡긴 곳 장부(9~18시)
    await sleep(); await calm(); await at(8 * 60); r = await tpL(Q.fix.x, Q.fix.z, '장부 보기', () => said('9시~18시')); ok(r && !(await I()).cur.clues.book, '📒 ' + Q.fix.name + ' 08:00 = 「문을 닫았어요」');
    await at(10 * 60); r = await clueP(Q.fix.x, Q.fix.z, '장부 보기'); P = await panel(); ok(r && /장부/.test(P.t) && /5시 50분/.test(P.t) && /본 것/.test(P.t), '📒 ' + Q.fix.name + ' 장부 10:00 = 본 것 (' + Q.fix.cell + ')');
    if (SHOTS) { const fl = Math.hypot(Q.fix.x - Q.fix.dx, Q.fix.z - Q.fix.dz) || 1, fu = [(Q.fix.x - Q.fix.dx) / fl, (Q.fix.z - Q.fix.dz) / fl]; await shot('scale_fix', [Q.fix.x + fu[0] * 3 + fu[1] * 1.5, Q.fix.z + fu[1] * 3 - fu[0] * 1.5], [Q.fix.x, Q.fix.z]); }
    await closeAll(); await ev(() => SM_TOWN.openWx()); await W8(500); P = await panel(); ok(P && P.k === 'wx' && /바람 약함/.test(P.t) && (await I()).cur.clues.calm, '🌤 날씨 창 = 어제 바람 약함 (본 것)'); await closeAll();
    const kS = Object.keys((await I()).cur.clues); ok(['track', 'bus', 'wit', 'nbr', 'book', 'calm'].every(k => kS.includes(k)), '단서 여섯: ' + kS.join(' · ') + ' (장터 바닥 · 정류장 · 정자 저녁 · 옆 가게 오후 · 맡긴 곳 · 날씨 창)'); ok(await noLineS(), '단서를 다 모아도 빨간 선 X');
    await ev(() => SM_TOWN.case().notebook()); await W8(400); ok(await ev(() => { const c = document.querySelectorAll('.twn-p .cs-c'); return c.length === 2 && /바퀴 자국/.test(c[0].innerText) && /제 수레/.test(c[1].innerText) && /마지막 버스를 기다리는데/.test(c[1].innerText) && !/제 수레/.test(c[0].innerText); }), '수첩 = 본 것 칸 · 들은 생각 칸이 나뉨');
    if (SHOTS) await p.screenshot({ path: SHOTS + '/scale_notebook.png' });
    // 틀린 까닭(누가 가져감) → 분실물 = 아니었어요 + 90분
    await ev(() => document.querySelector('.twn-p [data-a="h"]').click()); await W8(400); ok((await ev(() => [...document.querySelectorAll('.twn-p [data-h]')].map(b => b.dataset.h).sort().join())) === 'fix,took,wind', '까닭 셋 고르기(바람 · 누가 · 고치러)');
    await ev(() => document.querySelector('.twn-p [data-h="took"]').click()); await W8(800); { const rp = await route(), e9 = rp && rp[rp.length - 1]; ok(e9 && Math.hypot(e9[0] - Q.lost.x, e9[1] - Q.lost.z) < 8, '「누가 가져갔어요」 = 확인 자리(' + Q.lost.name + ' 분실물)에만 빨간 선'); }
    const u0 = await ev(() => SM_TOWN.game().S.min), lf0 = (await I()).due - (await I()).now;
    r = await tpL(Q.lost.x, Q.lost.z, '분실물 장부', async () => ((await panel()) || {}).k === 'casechk'); P = await panel(); const u1 = await ev(() => SM_TOWN.game().S.min), lf1 = (await I()).due - (await I()).now;
    ok(r && /아니었어요/.test(P.t) && /90분/.test(P.t) && /분실물/.test(P.t), '분실물 장부 = 「누가 모르고 가져간 것은 아니었어요」'); ok(u1 - u0 >= 90 && lf0 - lf1 >= 90, '틀린 까닭 = 시각 +' + (u1 - u0) + '분 · 기한 ' + (lf0 - lf1) + '분 줄어듦 (벌·점수 X)');
    // 맞는 까닭(고치러 맡김) → 선반 = 맞았어요
    if (!(await panel())) { await ev(() => SM_TOWN.case().notebook()); await W8(400); }
    await ev(() => document.querySelector('.twn-p [data-a="h"]').click()); await W8(400); ok(await ev(() => document.querySelector('.twn-p [data-h="took"]').disabled), '고른 적 있는 까닭 = 「아니었어요」로 막힘');
    await ev(() => document.querySelector('.twn-p [data-h="fix"]').click()); await W8(800); { const rp = await route(), e9 = rp && rp[rp.length - 1]; ok(e9 && Math.hypot(e9[0] - Q.fix.x, e9[1] - Q.fix.z) < 8, '「고치러 맡겼어요」 = 확인 자리(맡긴 곳)에 빨간 선'); }
    r = await tpL(Q.fix.x, Q.fix.z, '저울 선반', async () => ((await panel()) || {}).k === 'casechk'); P = await panel(); ok(r && /맞았어요/.test(P.t) && /선반/.test(P.t) && /상인/.test(P.t), '맡긴 곳 선반 = 「맞았어요」 → 상인에게 알리기'); await closeAll();
    // 상인에게 보고(본 것 둘)
    await at(19 * 60 + 20); r = await tpL(Q.mk.x, Q.mk.z, '상인에게 알려 주기', () => said('아침 8시~저녁 7시')); ok(r && !(await panel()), '상인 저녁 7:20 = 「아침 8시~저녁 7시에 장터에 있어요」');
    await at(15 * 60); r = await tpL(Q.mk.x, Q.mk.z, '상인에게 알려 주기', async () => ((await panel()) || {}).k === 'caserep'); ok(r, '상인 15:00 = 「근거를 두 가지 보여 줘요」 창');
    P = await pickK(['bus', 'calm']); ok(/저울이 간 곳/.test(P.t) && (await I()).cur.st === 'open', '시간표·날씨만 = 「저울이 간 곳을 보여 주는 것도」');
    P = await pickK(['wit', 'track']); ok(/정자 이웃의 생각/.test(P.t) && (await I()).cur.st === 'open', '「들은 생각」을 근거로 내면 = 상인이 되물음');
    P = await pickK(['book']); ok(/상인이 알았어요/.test(P.t) && /계량/.test(P.t) && /눈금/.test(P.t) && /누가 가져간 줄/.test(P.t) && (await I()).cur.st === 'ok', '본 것 둘(바닥 자국·장부) = 오해가 풀림 + 낱말 둘(계량 · 눈금)'); await closeAll();
    // 다음 날 결과
    const dRS = await ev(() => SM_TOWN.game().S.day); const rcS = await sleep(); ok(rcS && /저울이 돌아/.test(rcS.t), '하루 마무리 「내일 기다리는 것」 = 「장터에 고친 저울이 돌아와요」');
    await at(9 * 60); let j2 = null; for (let i = 0; i < 8; i++) { await W8(500); j2 = await I(); if (j2.cur && j2.cur.st === 'fixed') break; }
    ok(j2.cur.st === 'fixed' && j2.cur.fixD === dRS + 1 && !j2.meshes.sc_track && j2.meshes.sc_scale >= 2, '다음 날 = 장터에 고친 저울 + 「정확해요」 판 (바닥 자국 X · 그리기 ' + j2.meshes.sc_scale + ')');
    const nwS = await ev(d => SM_TOWN.case().news(d), dRS + 1); ok(nwS.some(q => /돌아왔어요/.test(q.t[0]) && /서로 고맙다고/.test(q.t[0])), '아침 소식 「' + ((nwS[0] || { t: ['-'] }).t[0]) + '」');
    { const N9 = await ev(() => SM_TOWN.news()), L9 = (N9 && N9.lines) || [], on9 = L9.some(L => L.k === 'fx:case:scale'), mine9 = L9.find(L => L.mine);   /* 소식판 = '내가 한 일' 줄 하나(town_news.js) — 다른 내 일 결과가 먼저면 그 줄 */
      ok(on9 || (mine9 && /^fx:/.test(mine9.k)), '소식판 줄에 실림' + (on9 ? '' : ' (오늘 내 일 줄 = ' + (mine9 && mine9.k) + ')')); }
    await ev(() => SM_TOWN.case().notebook()); await W8(400); P = await panel(); ok(/정확해요/.test(P.t) && /상인: /.test(P.t) && /옆 가게 이웃: /.test(P.t) && /손해/.test(P.t), '결과 = 본 것(돌아온 저울 · 정확해요 판) + 생각 둘(상인 · 옆 가게 이웃) + 공정한 거래 한 줄'); await closeAll();
    await at(10 * 60); r = await tpL(Q.mk.x, Q.mk.z, '상인과 이야기하기', async () => (await I()).dbg.some(t => /^talkS mk/.test(t))); ok(r, '결과 날 상인 E = 고맙다는 한마디');
    if (SHOTS) await shot('scale_fixed', [Q.track.x - Math.sin(Q.track.fy) * 3.2 + Math.cos(Q.track.fy) * 0.8, Q.track.z - Math.cos(Q.track.fy) * 3.2 - Math.sin(Q.track.fy) * 0.8], [Q.track.x, Q.track.z]);
    // 늦은 판: 이틀 넘김 → 다음 장날 임시 저울(하루) → 그다음 날 저울이 돌아옴 · 벌 X
    await ev(() => SM_TOWN.case().dbg.plan('scale')); await W8(600); const dS = await ev(() => SM_TOWN.game().S.day);
    { await at(10 * 60); const rc9 = await sleep(); ok(rc9 && /사라진 장터 저울: 내일이 마지막 날/.test(rc9.t), '하루 마무리(사건 첫날) = 「사라진 장터 저울: 내일이 마지막 날이에요」'); }
    await at(10 * 60); await sleep(); await at(9 * 60); await W8(1500); let j3 = await I(); ok(j3.cur && j3.cur.st === 'late' && j3.cur.late === dS + 2, '이틀 넘김 = 늦음 (' + (j3.cur && j3.cur.st) + ')');
    const nJ = await ev(d => { for (let k = d; k < d + 6; k++) if (k % 5 === 0) return k; return -1; }, dS + 2);
    if (nJ > dS + 2) { await ev(d => { const G = SM_TOWN.game().S; G.day = d - 1; SM_TOWN.game().mark(); }, nJ); await at(20 * 60); await sleep(); }
    await at(9 * 60); for (let i = 0; i < 8; i++) { await W8(500); j3 = await I(); if (j3.cur && j3.cur.mudD) break; }
    ok(j3.cur.mudD === nJ && j3.meshes.sc_scale >= 1 && (await ev(() => SM_TOWN.case().dbg.ctx().jang.on)), '늦음 → 다음 장날(' + nJ + '일째) 상인이 임시 저울 (그리기 ' + j3.meshes.sc_scale + ')');
    ok((await ev(d => SM_TOWN.case().news(d), nJ)).some(q => /임시 저울/.test(q.t[0])), '아침 소식 = 「임시 저울로 팔아요 · 줄이 길어요」');
    if (SHOTS) await shot('scale_slow', [Q.track.x - Math.sin(Q.track.fy) * 3.2, Q.track.z - Math.cos(Q.track.fy) * 3.2], [Q.track.x, Q.track.z]);
    await ev(() => SM_TOWN.case().notebook()); await W8(300); P = await panel(); ok(/임시 저울/.test(P.t) && /다음엔 더 빨리/.test(P.t), '수첩 = 「다음엔 더 빨리 알려 줘요」(벌 X)'); await closeAll();
    await sleep(); await at(9 * 60); let j4 = null; for (let i = 0; i < 8; i++) { await W8(500); j4 = await I(); if (j4.cur && j4.cur.st === 'lateFix') break; } ok(j4.cur.st === 'lateFix' && j4.meshes.sc_scale >= 2 && !j4.meshes.sc_track, '그다음 날 = 고친 저울이 돌아옴');
    ok((await ev(d => SM_TOWN.case().news(d), nJ + 1)).some(q => /다음엔 더 빨리/.test(q.t[0])), '아침 소식 = 「고친 저울이 돌아왔어요 · 다음엔 더 빨리」');
    }
    // ───────── 🚧 공사장 길 안전(SITEROAD-1) ─────────
    if (!ONLY || ONLY === 'siteRoad') {
    console.log('  — 🚧 공사장 길 안전');
    const tpR = async (x, z, lab, done) => { for (let k = 0; k < 6; k++) { await closeAll(); await tp(x + 0.2, z + 0.2); for (let w = 0; w < 40; w++) { await W8(300); if (await ev(l => [...document.querySelectorAll('div')].some(d => /^(E  |✋ )/.test(d.textContent) && d.textContent.includes(l) && d.style.display !== 'none' && !d.children.length), lab)) break; } await W8(300); await p.keyboard.press('KeyE'); await W8(800); if (!done || await done()) return true; await W8(700); } return false; };
    const clueR = (x, z, lab) => tpR(x, z, lab, async () => ((await panel()) || {}).k === 'caseclue');
    await closeAll(); await ev(() => { SM_TOWN.case().dbg.clear(); SM_TOWN.rules.wx('clear'); if (SM_TOWN.typhoon) { SM_TOWN.typhoon.info(); if (SM_TOWN.game().S.typh && SM_TOWN.game().S.typh.st) SM_TOWN.typhoon.dbg.finish(); } const t9 = SM_TOWN.game().S.typh; if (t9 && !t9.st) { t9.n = Math.max(1, t9.n | 0); t9.last = 1e6; } }); await calm();
    // ⑨ 흐려진 강이 끝난 날(씨앗) = 아직 X → 다음 날 아침 저절로
    const dSd = await ev(() => { const G = SM_TOWN.game().S, s9 = G.case; s9.done.river = G.day; s9.done.scale = G.day; s9.seeds.siteRoad = G.day; s9.d = -1; SM_TOWN.game().mark(); return G.day; });
    await at(9 * 60); await W8(1300); ok(!(await I()).cur, '흐려진 강이 끝난 날(' + dSd + '일째) = 아직 사건 X'); await sleep();
    await ev(() => SM_TOWN.rules.wx('clear')); await at(7 * 60); let k0 = null; for (let i = 0; i < 12; i++) { await W8(500); k0 = await I(); if (k0.cur) break; }
    ok(k0.cur && k0.cur.id === 'siteRoad' && k0.cur.d0 === dSd + 1, '다음 날 아침 = 「공사장 길 안전」 저절로');
    if (!k0.cur || k0.cur.id !== 'siteRoad') throw new Error('공사장 길 사건이 안 생김 ' + JSON.stringify(k0.dbg));
    const RQ = k0.cur.pl; console.log('    자리: 공사장 ' + RQ.cell + ' · 끊긴 보도 ' + RQ.cCell + ' · 지켜보는 자리 ' + JSON.stringify(RQ.watch) + ' · 이웃 ' + RQ.nb.cell + '(' + RQ.nb.k + ') · 보도 판 ' + RQ.sw.length);
    ok(/공사장 길 안전 · 기한 사흘/.test(k0.line) && /기한 사흘/.test(k0.chip), '칩·위 가운데 줄 = 「' + k0.line + '」');
    ok(k0.meshes.sr_site === 1 && k0.meshes.sr_road === 2 && k0.meshes.sr_slow === 2 && !k0.meshes.sr_info && !k0.meshes.sr_truck, '소품: 공사장 1 · 길 2(합친 부품 + 가로등 머리) · 천천히 표지 2 · 안내판 X · 7시 트럭 X ' + JSON.stringify(k0.meshes));
    ok((await ev(d => SM_TOWN.case().news(d), dSd + 1)).some(q => /위험하대요/.test(q.t[0])), '아침 소식 = 「아이들이 위험하대요」');
    const SR = [RQ.watch, RQ.mud, RQ.pile, RQ.c, RQ.slow, RQ.info, RQ.lamp, RQ.nb, RQ.crew], noLineR = async () => { const rp = await route(); if (!rp || !rp.length) return true; const e9 = rp[rp.length - 1]; return !SR.some(q => Math.hypot(e9[0] - q.x, e9[1] - q.z) < 8); };
    ok(await noLineR(), '처음 = 단서 자리에 빨간 선 X');
    // 지켜보기: 낮 = 조용해요 · 공사 일꾼 · 이웃 · 길바닥 · 자재 · 보도
    await at(10 * 60); r = await tpR(RQ.watch.x, RQ.watch.z, '입구 곁에 서서', () => said('조용해요')); ok(r && !(await I()).cur.clues.sr_truck && !(await I()).meshes.sr_truck, '🚚 입구 지켜보기 10:00 = 「지금은 입구가 조용해요」 · 트럭 X · 단서 X');
    r = await tpR(RQ.crew.x, RQ.crew.z, '공사 일꾼에게', async () => !!(await I()).cur.clues.sr_crew); P = await panel(); ok(r && P && /들은 생각/.test(P.t) && /어두운/.test(P.t), '🗣 공사 일꾼 10:00 = 들은 생각(어두워서)');
    r = await tpR(RQ.nb.x, RQ.nb.z, '공사장 길 이야기', async () => !!(await I()).cur.clues.sr_nbr); P = await panel(); ok(r && P && /빨리 달려서/.test(P.t), '🗣 길을 자주 지나는 이웃(' + RQ.nb.cell + ') = 들은 생각(빨라서)');
    r = await clueR(RQ.mud.x, RQ.mud.z, '길바닥'); P = await panel(); ok(r && /미끄러워요/.test(P.t) && /본 것/.test(P.t), '👣 입구 앞 길바닥 흙 = 본 것');
    r = await clueR(RQ.pile.x + RQ.n[0] * 1.6, RQ.pile.z + RQ.n[1] * 1.6, '쌓인 자재');   /* CASE-COL: 자재 더미 = 몸이 못 들어감 → 찻길 쪽 1.6m 앞에서 살펴봄(살펴보기 반지름 2.4) */ P = await panel(); ok(r && /눈높이/.test(P.t) && /본 것/.test(P.t), '📦 쌓인 자재(아이 눈높이) = 본 것');
    r = await clueR(RQ.c.x, RQ.c.z, '보도 살펴보기'); P = await panel(); ok(r && /보도가 끊겨/.test(P.t), '🚶 끊긴 보도 = 본 것');
    // 몸으로: 아침 8~9시에 그 자리에 서 있어야(떠나면 처음부터)
    await at(8 * 60 + 10); let tk8 = 0; for (let i = 0; i < 12 && !tk8; i++) { await W8(500); tk8 = (await I()).meshes.sr_truck | 0; } ok(tk8 >= 1, '아침 8:10 = 입구에 트럭');
    r = await tpR(RQ.watch.x, RQ.watch.z, '입구 곁에 서서', () => said('지켜봐요')); ok(r && (await I()).cur.watch > 0, '  8:10 지켜보기 시작 = 「이 자리에 서서 입구를 잠깐 지켜봐요」');
    await W8(1500); await tp(RQ.watch.x + 12, RQ.watch.z + 12); let lv9 = false; for (let i = 0; i < 30 && !lv9; i++) { await W8(500); lv9 = (await I()).dbg.includes('watch:left'); } ok(lv9 && !(await I()).cur.watch && !(await I()).cur.clues.sr_truck, '  중간에 자리를 떠나면 = 「끝까지 못 봤어요」 · 단서 X');
    r = await tpR(RQ.watch.x, RQ.watch.z, '입구 곁에 서서', () => said('지켜봐요')); let wk9 = null; for (let i = 0; i < 40; i++) { await W8(1000); wk9 = await I(); if (wk9.cur.clues.sr_truck) break; } P = await panel();
    ok(r && wk9.cur.clues.sr_truck && wk9.cur.clues.sr_truck.how === 'body' && P && /8시~9시/.test(P.t), '  그 자리에 서 있으면 = 「아침 8시~9시에 트럭이 드나들어요」 (본 것 · 몸으로)');
    if (SHOTS) await shot('road_truck', [RQ.watch.x, RQ.watch.z], [RQ.gate.x, RQ.gate.z]);
    ok(await noLineR(), '단서를 다 모아도 빨간 선 X');
    await closeAll(); await ev(() => SM_TOWN.case().notebook()); await W8(400); ok(await ev(() => { const c = document.querySelectorAll('.twn-p .cs-c'); return c.length === 2 && /보도가 끊겨/.test(c[0].innerText) && /빨리 달려서/.test(c[1].innerText) && /어두운/.test(c[1].innerText) && !/빨리 달려서/.test(c[0].innerText); }), '수첩 = 본 것 칸 · 들은 생각 칸이 나뉨');
    if (SHOTS) await p.screenshot({ path: SHOTS + '/road_notebook.png' });
    // 틀린 까닭 둘 → 아니었어요 + 90분
    await ev(() => document.querySelector('.twn-p [data-a="h"]').click()); await W8(400); ok((await ev(() => [...document.querySelectorAll('.twn-p [data-h]')].map(b => b.dataset.h).sort().join())) === 'cross,dark,speed', '까닭 셋 고르기(빨라서 · 어두워서 · 다니는 때 + 끊긴 보도 + 가린 자재)');
    await ev(() => document.querySelector('.twn-p [data-h="speed"]').click()); await W8(800); { const rp = await route(), e9 = rp && rp[rp.length - 1]; ok(e9 && Math.hypot(e9[0] - RQ.slow.x, e9[1] - RQ.slow.z) < 8, '「빨라서」 = 확인 자리(천천히 표지)에만 빨간 선'); }
    const v0 = await ev(() => SM_TOWN.game().S.min), g0 = (await I()).due - (await I()).now;
    r = await tpR(RQ.slow.x, RQ.slow.z, '입구 앞 찻길', async () => ((await panel()) || {}).k === 'casechk'); P = await panel(); const v1 = await ev(() => SM_TOWN.game().S.min), g1 = (await I()).due - (await I()).now;
    ok(r && /과속 방지 턱/.test(P.t) && /아니었어요/.test(P.t) && /90분/.test(P.t), '천천히 표지 = 「빨라서 위험한 것은 아니었어요」'); ok(v1 - v0 >= 90 && g0 - g1 >= 90, '틀린 까닭 = 시각 +' + (v1 - v0) + '분 · 기한 ' + (g0 - g1) + '분 줄어듦');
    if (!(await panel())) { await ev(() => SM_TOWN.case().notebook()); await W8(400); await ev(() => document.querySelector('.twn-p [data-a="h"]').click()); } else await ev(() => document.querySelector('.twn-p [data-a="h"]').click()); await W8(400);
    await ev(() => document.querySelector('.twn-p [data-h="dark"]').click()); await W8(800);
    r = await tpR(RQ.lamp.x, RQ.lamp.z, '가로등', async () => ((await panel()) || {}).k === 'casechk'); P = await panel(); ok(r && /가로등/.test(P.t) && /아니었어요/.test(P.t), '가로등 = 「어두워서 위험한 것은 아니었어요」');
    if (!(await panel())) { await ev(() => SM_TOWN.case().notebook()); await W8(400); } await ev(() => document.querySelector('.twn-p [data-a="h"]').click()); await W8(400);
    ok(await ev(() => document.querySelector('.twn-p [data-h="speed"]').disabled && document.querySelector('.twn-p [data-h="dark"]').disabled), '고른 적 있는 까닭 둘 = 「아니었어요」로 막힘');
    await ev(() => document.querySelector('.twn-p [data-h="cross"]').click()); await W8(800); { const rp = await route(), e9 = rp && rp[rp.length - 1]; ok(e9 && Math.hypot(e9[0] - RQ.c.x, e9[1] - RQ.c.z) < 8, '맞는 까닭 = 확인 자리(끊긴 보도)에 빨간 선'); }
    r = await tpR(RQ.c.x, RQ.c.z, '아이 눈높이', async () => ((await panel()) || {}).k === 'casechk'); P = await panel(); ok(r && /맞았어요/.test(P.t) && /자재 더미에 가려/.test(P.t), '끊긴 보도 아이 눈높이 = 「맞았어요」 → 보고서'); await closeAll();
    // 창구 → 대책 고르기
    const H1 = (await ev(() => SM_TOWN.fix().info())).halls[0]; await at(14 * 60); r = await tpE(H1.at[0], H1.at[1], async () => ((await panel()) || {}).k === 'caserep'); ok(r, '창구 14:00 = 사건 보고서 창');
    P = await pickK(['sr_nbr', 'sr_truck']); ok(/그 길을 자주 지나는 이웃의 생각/.test(P.t) && (await I()).cur.st === 'open', '「들은 생각」을 근거로 내면 = 직원이 되물음');
    await ev(() => document.querySelector('.twn-p [data-k="sr_truck"]').click()); await W8(200);   /* 남은 골라 둔 것 비우기 */
    P = await pickK(['sr_mud', 'sr_slow']); ok(/왜 위험한지 보여 주는 것도/.test(P.t) && (await I()).cur.st === 'open', '흙·과속 방지 턱만 = 「아이들이 왜 위험한지 보여 주는 것도」');
    P = await pickK(['sr_truck', 'sr_pile']); ok(P && /대책 고르기/.test(P.t) && (await ev(() => document.querySelectorAll('.twn-p [data-x]').length)) === 3 && (await I()).cur.st === 'open', '본 것 둘(트럭 때 · 자재) = 「무엇을 하면 좋을까요?」 대책 셋');
    await ev(() => document.querySelector('.twn-p [data-x="care"]').click()); await W8(400); P = await panel(); ok(/조심하는 것만으로는/.test(P.t) && (await I()).cur.st === 'open', '  「조심해 달라고」 = 직원이 까닭(끊긴 보도·자재가 그대로)');
    await ev(() => document.querySelector('.twn-p [data-x="away"]').click()); await W8(400); P = await panel(); ok(/먼 길을 돌면/.test(P.t) && (await I()).cur.st === 'open', '  「먼 길로 돌아서」 = 직원이 까닭(날마다 힘들고 늦음)');
    await ev(() => document.querySelector('.twn-p [data-x="fix"]').click()); await W8(400); P = await panel(); ok(/받았어요/.test(P.t) && /보도/.test(P.t) && /시야/.test(P.t) && (await I()).cur.st === 'ok' && (await I()).cur.fixK === 'fix', '  「8~9시 트럭이 쉬고 · 울타리 보도 · 자재 옮김」 = 접수 + 낱말 둘(보도 · 시야)'); await closeAll();
    // 다음 날 결과
    const dRR = await ev(() => SM_TOWN.game().S.day); const rcR = await sleep(); ok(rcR && /울타리 친 보도/.test(rcR.t), '하루 마무리 「내일 기다리는 것」 = 「공사장 앞에 울타리 친 보도가 생겨요」');
    await at(8 * 60 + 30); let k2 = null; for (let i = 0; i < 8; i++) { await W8(500); k2 = await I(); if (k2.cur && k2.cur.st === 'fixed') break; }
    ok(k2.cur.st === 'fixed' && k2.cur.fixD === dRR + 1 && k2.meshes.sr_info === 2 && k2.meshes.sr_road === 2, '다음 날 = 울타리 보도 + 「공사 차량 시간」 판 (그리기 ' + k2.meshes.sr_info + ')');
    ok(!k2.meshes.sr_truck, '  고친 뒤 아침 8:30 = 트럭이 쉼(입구에 트럭 X)'); await at(10 * 60); let tk9 = 0; for (let i = 0; i < 12 && !tk9; i++) { await W8(500); tk9 = (await I()).meshes.sr_truck | 0; } ok(tk9 >= 1, '  10:00 = 트럭이 다님');
    ok((await ev(d => SM_TOWN.case().news(d), dRR + 1)).some(q => /울타리 친 보도와 건널목/.test(q.t[0])), '아침 소식 「울타리 친 보도와 건널목 표시」');
    await ev(() => SM_TOWN.case().notebook()); await W8(400); P = await panel(); ok(/철판 보도/.test(P.t) && /공사 일꾼: /.test(P.t) && /자주 지나는 이웃: /.test(P.t) && /눈높이/.test(P.t) && /우리 진짜 동네라면/.test(P.t), '결과 = 본 것 둘 + 생각 둘(늦어지는 공사 일꾼 · 반기는 이웃) + 배운 것 + 우리 동네'); await closeAll();
    r = await tpR(RQ.crew.x, RQ.crew.z, '공사 일꾼과 이야기', async () => (await I()).dbg.some(t => /^talkR crew/.test(t))); ok(r, '결과 날 공사 일꾼 E = 한마디');
    if (SHOTS) { await shot('road_fixed', [RQ.watch.x - RQ.n[1] * 6, RQ.watch.z + RQ.n[0] * 6], [RQ.c.x, RQ.c.z]); await shot('road_fixed_b', [RQ.watch.x, RQ.watch.z], [RQ.c.x, RQ.c.z]); }
    // 늦은 판: 사흘 넘김 → 다음 날 하루 보도 막힘 → 그다음 날 고침
    await ev(() => SM_TOWN.case().dbg.plan('siteRoad')); await W8(600); const dLR = await ev(() => SM_TOWN.game().S.day);
    for (let k = 0; k < 3; k++) { await at(10 * 60); const rc9 = await sleep(); if (k === 1) ok(rc9 && /공사장 길 안전: 내일이 마지막 날/.test(rc9.t), '하루 마무리(둘째 날) = 「공사장 길 안전: 내일이 마지막 날이에요」'); }
    await at(9 * 60); let k3 = null; for (let i = 0; i < 8; i++) { await W8(500); k3 = await I(); if (k3.cur && k3.cur.mudD) break; }
    ok(k3.cur.st === 'late' && k3.cur.mudD === dLR + 3 && k3.meshes.sr_info === 2 && k3.meshes.sr_road === 2, '기한 넘김 → 다음 날 하루 보도 막힘(고깔 + 「보도 막힘」 판)');
    ok((await ev(d => SM_TOWN.case().news(d), dLR + 3)).some(q => /하루 막혀요/.test(q.t[0])), '아침 소식 = 「보도가 오늘 하루 막혀요」');
    if (SHOTS) await shot('road_closed', [RQ.watch.x, RQ.watch.z], [RQ.c.x, RQ.c.z]);
    await ev(() => SM_TOWN.case().notebook()); await W8(300); P = await panel(); ok(/길 건너편으로 돌아서/.test(P.t) && /다음엔 더 빨리/.test(P.t), '수첩 = 「다음엔 더 빨리 알려 줘요」(벌 X)'); await closeAll();
    await sleep(); await at(9 * 60); let k4 = null; for (let i = 0; i < 8; i++) { await W8(500); k4 = await I(); if (k4.cur && k4.cur.st === 'lateFix') break; } ok(k4.cur.st === 'lateFix' && k4.meshes.sr_info === 2, '그다음 날 = 마을이 울타리 보도를 냄');
    ok((await ev(d => SM_TOWN.case().news(d), dLR + 4)).some(q => /다음엔 더 빨리/.test(q.t[0])), '아침 소식 = 「울타리 친 보도를 냈어요 · 다음엔 더 빨리」');
    }
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); try { console.log('    info ' + JSON.stringify(await p.evaluate(() => SM_TOWN.case().info())).slice(0, 1500)); } catch (e2) { /* 페이지 없음 */ } } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
