// 📒 사건 수첩 시험(CASE-1 · v2/games/town_case.js · 첫 사건 '흐려진 강'): node tools/harness/town_case.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 비 사흘 → 그다음 아침 저절로 사건(물 높이 +1) · 칩·위 가운데 줄 '기한 사흘' · 단서 자리엔 빨간 선 X
//   ② 단서 다섯(장소·사람·때가 다름): 정류장 안내판 · 장터 상인(아침 8~10시만 · 오후엔 '아침에 와요') · 공사장 울타리 안 흙더미 · 날씨 창 비 기록 · 물 떠 보기(물가 세 곳 · 물에서 멀면 못 뜸)
//   ③ 틀린 가설 → 확인 자리만 빨간 선 → '아니었어요' + 시각 90분 · 기한 줄어듦 ④ 맞는 가설 → 맞았어요 → 창구(09~18시) 보고서: '들은 생각'을 넣으면 직원이 되물음 → 본 것 둘 = 접수
//   ⑤ 하루 마무리 '내일 기다리는 것' · 잠 → 다음 날 흙막이(공사장 고랑 X) · 물 흙탕 값이 하루씩 내려감 · 아침 소식 한 줄 · 이웃 반응 둘
//   ⑥ 기한 넘김 판: 사흘 넘게 안 냄 → 늦음 → 비 오는 날 논 한 칸 흙탕(하루) → 다음 날 흙막이 · 벌 X ⑦ 휴대폰 390 수첩 창(가로 넘침 X) ⑧ 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 900) } : null; });
    const closeAll = async () => { for (let i = 0; i < 6; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
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
    let r = await tpE(PL.sign.x, PL.sign.z, async () => ((await panel()) || {}).k === 'caseclue'); let P = await panel(); ok(r && /안내판/.test(P.t) && /본 것/.test(P.t), '🚏 정류장 안내판 = 본 것 (' + PL.sign.cell + ')'); await shot('case_sign', [PL.sign.x + (PL.sign.sx - PL.sign.x) * 2.2, PL.sign.z + (PL.sign.sz - PL.sign.z) * 2.2], [PL.sign.x, PL.sign.z]);
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
    const pickK = async ks => { for (const k of ks) await ev(k => document.querySelector('.twn-p [data-k="' + k + '"]').click(), k); await W8(200); await ev(() => document.querySelector('.twn-p [data-a="go"]').click()); await W8(400); return panel(); };
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
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); try { console.log('    info ' + JSON.stringify(await p.evaluate(() => SM_TOWN.case().info())).slice(0, 1500)); } catch (e2) { /* 페이지 없음 */ } } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
