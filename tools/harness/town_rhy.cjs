// 🎶 노동요 리듬 놀이 시험(RHY-1a 모내기 소리 · 설계 docs/systems/town_rhy.md §6): node tools/harness/town_rhy.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--only=H3,H6]
//   H1 입력 모형 시뮬레이션(브라우저 X · 2만 판) · H2 연타 봇(시뮬레이션 + 실제 판 메기기 마디 연타) · H3 실제 판(소리 켬 · 무음) · H4 판 동안 화면에 숫자·%·/·막대 X
//   H5 판 길이 30~60초 · H6 장인 시험 → 내 논배미 → 밤 셋 자람 → 가을(달력 켬·끔) 익음 → 벼 베기로 비움 · H7 보상 문(하루 몫 · 꼬리표 job:rhy:mo)
//   H8 상태 교차(Space·J·M·Esc·잠·새로고침) · H9 크롬북 렉(CPU 4× · 그리기 +2 · tick ms · 새 Light 0) · H10 출력 지연 0.2초 흉내(보정 켬/끔)
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, ONLY = ((process.argv.find(a => a.startsWith('--only=')) || '').slice(7) || '').split(',').filter(Boolean);
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1', on = h => !ONLY.length || ONLY.includes(h);
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); }, pc = v => (v * 100).toFixed(1) + '%';
(async () => { const T0 = Date.now(), R = await import(path.resolve(__dirname, '../../v2/games/town_rhy.js'));
  // ── H1 · H2 · H5(순수) ──
  if (on('H1')) { console.log('H1 입력 모형 시뮬레이션(2만 판 · 늦음 40~220ms · σ 80~160ms · 놓침 10%)');
    for (const lv of [1, 2, 3]) { const s = R.rhySim(lv, 20000); ok(s.s1 >= 0.9 && s.s2 >= 0.45 && s.s2 <= 0.55 && s.s3 >= 0.1 && s.s3 <= 0.2, R.LVS[lv].name[0] + ' ★1 ' + pc(s.s1) + ' · ★2 ' + pc(s.s2) + ' · ★3 ' + pc(s.s3) + ' (K = 반듯 ' + R.LVS[lv].K + '/' + R.rhyPlan(lv, 1).n + ')'); }
    const m = R.rhySim(4, 20000); console.log('    (장인 시험 · 같은 모형 = 처음 하는 아이 기준) ★2 ' + pc(m.s2) + ' · ★3 ' + pc(m.s3)); }
  if (on('H2')) { console.log('H2 연타 봇(0.15·0.3·0.5초 × 위상 무작위 · 2천 판씩)'); let worst = 0, cp = 0; for (const lv of [1, 2, 3, 4]) for (const iv of [0.15, 0.3, 0.5]) { const r = R.rhyMash(lv, iv, 2000); worst = Math.max(worst, r.s2); cp += r.callPlants; } ok(worst === 0, '연타 ★2 최대 ' + pc(worst)); ok(cp === 0, '메기기 마디 누름으로 생긴 모(시뮬레이션) ' + cp); }
  if (on('H5')) { console.log('H5 판 길이'); for (const lv of [1, 2, 3, 4]) { const p = R.rhyPlan(lv, 3); ok(p.len >= 30 && p.len <= 60, R.LVS[lv].name[0] + ' ' + p.bpm + ' BPM · ' + p.n + '포기 · ' + p.len.toFixed(1) + '초'); } }
  if (on('H4')) { const T = []; const walk = o => { if (typeof o === 'string') T.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); }; walk(R.CALLS.map(c => c[1])); walk(R.RAIN_CALL[1]);
    const src = fs.readFileSync(path.resolve(__dirname, '../../v2/games/town_rhy.js'), 'utf8'), tx = /const TX = (\{[\s\S]*?\n\s+fix: [^\n]*\})/.exec(src); if (tx) walk(Function('return ' + tx[1])());
    const bad = T.filter(t => /[0-9%/]/.test(t)); ok(!bad.length && T.length > 30, 'H4a 말풍선·알림 글 ' + T.length + '줄에 숫자·%·/ 없음' + (bad.length ? ' — ' + bad.slice(0, 3).join(' | ') : '')); }
  const needPage = ['H2', 'H3', 'H4', 'H6', 'H7', 'H8', 'H9', 'H10'].some(on); if (!needPage) return done();
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('crash', () => console.log('    ‼ 페이지 죽음(crash)')); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
  const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), info = () => ev(() => SM_TOWN.rhy().info());
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true }); const shot = async (n, clip) => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png', clip }); };
  const boot = async () => { await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.rhy, null, { timeout: 240000 }); await W8(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Shift'); };
  const spring = async () => { await ev(() => { SM_TOWN.storyOff && SM_TOWN.storyOff(); SM_TOWN.weather && SM_TOWN.weather('clear'); SM_TOWN.game().S.min = 11 * 60; SM_TOWN.rules.season('spring'); }); await W8(1000); try { await p.waitForFunction(() => !SM_TOWN.cal().busy, null, { timeout: 40000 }); } catch (e) { /* */ } await W8(1500); };
  // 봇(페이지 안): mode 'cue' = 들리는 때(cue) · 'raw' = 소리 시계 + late초 · miss = 놓침 확률
  const bot = (o = {}) => ev(o => { window.__bot = { n: 0, on: true }; const loop = () => { if (!__bot.on) return; const RH = SM_TOWN.rhy(), c = o.mode === 'raw' ? RH.cueRaw() : RH.cue(); if (c && c.k !== 'rest' && c.dt < 0.25 && c.j !== __bot.j) { __bot.j = c.j; if (Math.random() >= (o.miss || 0)) setTimeout(() => { dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true })); __bot.n++; }, Math.max(0, (c.dt + (o.late || 0)) * 1000 + 25)); } setTimeout(loop, 12); }; loop(); }, o);
  const botOff = () => ev(() => { if (window.__bot) __bot.on = false; });
  const phase = async (ph, ms = 70000) => { try { await p.waitForFunction(ph => { const i = SM_TOWN.rhy().info(); return ph === 'off' ? !i.on : i.ph === ph; }, ph, { timeout: ms }); return true; } catch (e) { return false; } };
  const panels = async () => { for (let k = 0; k < 4 && await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg'))); k++) { await p.keyboard.press('Escape'); await W8(350); } };   /* 판 뒤 솜씨 레벨업 창 등(놓아준 뒤에만 뜸) */
  const release = async () => { await botOff(); for (let k = 0; k < 3 && await ev(() => SM_TOWN.rhy().busy); k++) { await p.keyboard.press('Escape'); await W8(400); } await W8(1300); await panels(); };
  const W = async () => ev(() => SM_TOWN.rhyW()); await boot(); await spring(); const WK = await W(); ok(WK.length >= 2, '봄 논 일꾼 ' + WK.length + '명(있는 사람 · 새 사람 X)'); const wi = (WK[2] || WK[0]).i, wj = (WK[1] || WK[0]).i, wk3 = (WK[4] || WK[1]).i, wfar = await ev(() => { const L = SM_TOWN.rhyW().map(w => [w.i, SM_TOWN.rhy().spotOf(w.i).d]).sort((a, b) => b[1] - a[1]); return L[0]; });
  const go = async (i, o) => { await panels(); return ev(([i, o]) => SM_TOWN.rhyGo(i, o), [i, o || {}]); };
  const reset = () => ev(() => { const S = SM_TOWN.game().S; S.lad = S.lad || {}; delete S.lad.mo; S.uses = {}; S.rw = {}; });
  await reset();

  // ── H3(소리 켬) + H2(실제 판 메기기 마디 연타) + H4(화면 감사) + H5(실제 길이) ──
  if (on('H3') || on('H4') || on('H2')) { console.log('H3 실제 판 — 소리 켬');
    await ev(() => { window.__mut = []; window.__mo = new MutationObserver(L => { const ph = SM_TOWN.rhy().info().ph; if (ph !== 'play') return; for (const m of L) for (const n of m.addedNodes) if (n.nodeType === 1) __mut.push({ c: String(n.className || ''), t: (n.textContent || '').trim().slice(0, 80), bar: n.matches && (n.matches('.bar,.tmb,[style*=scaleX]') || !!n.querySelector('.bar,.tmb,[style*=scaleX]')) }); }); __mo.observe(document.body, { childList: true, subtree: true }); });
    const st = await go(wi); ok(st === true, 'E 자리 → 세상 안 모내기 시작(창 X)'); ok(await phase('play', 8000), '걸어 들어가 판 시작(' + (await info()).ph + ')');
    const I0 = await info(); ok(I0.au, '소리 장치 켜짐 · 출력 지연 ' + I0.lat.toFixed(3) + '초 뺌'); ok(await ev(() => !document.querySelector('.twn-play')), '옛 창 놀이(mkPlant) 안 열림');
    // 메기기 마디(첫 줄 0~4박) 동안 0.15초 연타 → 모 0
    const plan = await ev(() => { const P = SM_TOWN.rhy().plan(); return { beat: P.beat, t0: P.rows[0].t0 }; }); await p.waitForFunction(t => SM_TOWN.rhy().info().t > t, plan.t0 + 0.05, { timeout: 10000 });
    const ins0 = (await info()).inst; for (let k = 0; k < Math.floor((plan.beat * 4 - 0.75) / 0.15); k++) { await p.keyboard.press('Space'); await W8(150); } const I1 = await info();
    ok(I1.res.every(r => r == null) && I1.inst === ins0, 'H2 메기기 마디 연타 ' + Math.floor((plan.beat * 4 - 0.75) / 0.15) + '번 → 모 0 · 판정 0(헛손)');
    await bot(); await W8(9000); await shot('rhy_play'); if (SHOTS) await shot('rhy_play_zoom', { x: 360, y: 150, width: 560, height: 430 });
    ok(await ev(() => !!SD2.CTRL.frozen && SM_TOWN.rhy().busy), '판 동안 걷기 막힘');
    ok(await phase('end'), '판 끝까지'); await botOff(); await W8(1800); await shot('rhy_end'); const L1 = (await info()).last;
    ok(L1 && L1.stars >= 1 && L1.s >= 10, '봇(손 내림 위상) 반듯 ' + (L1 && L1.s) + '/' + (L1 && L1.n) + ' · 별 ' + (L1 && L1.stars) + '(안에서만)');
    ok(L1 && L1.len >= 30 && L1.len <= 60, 'H5 실제 판 ' + (L1 && L1.len.toFixed(1)) + '초');
    const M9 = await ev(() => { __mo.disconnect(); return __mut; }), bad = M9.filter(m => (m.bar) || (/[0-9%/]/.test(m.t) && !/twn-xp|chip|mini|comp|clock/.test(m.c)));
    ok(!bad.length, 'H4 판 동안 새로 뜬 화면 글 ' + M9.length + '개에 숫자·%·/·막대 없음' + (bad.length ? ' — ' + JSON.stringify(bad.slice(0, 3)) : ''));
    ok(await phase('again', 15000), '「한 번 더」 6초'); await shot('rhy_again'); ok(await ev(() => /한 번 더/.test((document.querySelector('.twn-rhy-a') || {}).textContent || '')), '「한 번 더」 단추');
    ok(await phase('off', 9000), '누르지 않으면 6초 뒤 놓아줌'); await W8(600); await shot('rhy_after');
    const A1 = await ev(() => ({ fr: !!SD2.CTRL.frozen, pose: SD2.CTRL.pose, inst: SM_TOWN.rhy().info().inst, rope: SM_TOWN.rhy().info().rope }));
    ok(!A1.fr && !A1.pose, '몸 풀림(멈춤·자세 X)'); ok(A1.inst > 0 && !A1.rope, '심은 모 줄이 논에 남음(인스턴스 ' + A1.inst + ') · 못줄 치움'); }
  if (on('H3') && wfar && wfar[1] > 6) { console.log('H3 논에서 먼 일꾼(' + wfar[1] + 'm) — 뛰어서 들어감(순간이동 X)'); await go(wfar[0]); const jumps = await ev(async () => { let last = SD2.map.player.get(), mx = 0; for (let k = 0; k < 140; k++) { await new Promise(r => setTimeout(r, 100)); const c = SD2.map.player.get(); mx = Math.max(mx, Math.hypot(c.x - last.x, c.z - last.z)); last = c; if (SM_TOWN.rhy().info().ph === 'play') break; } return { mx: +mx.toFixed(2), ph: SM_TOWN.rhy().info().ph }; });
    ok(jumps.ph === 'play' && jumps.mx < 0.75, '판 시작 · 0.1초 동안 가장 많이 옮긴 거리 ' + jumps.mx + 'm(< 0.75)'); await release(); }
  // ── H3(무음 · 모든 소리 끄기) ──
  if (on('H3')) { console.log('H3 실제 판 — 모든 소리 끄기(몸짓만)'); await ev(async () => { const m = await import('/v2/js/settings.js?v=2'); m.SET.mute = true; dispatchEvent(new CustomEvent('sm-set')); }); await W8(500);
    await go(wi); ok(await phase('play', 8000), '판 시작'); const I = await info(); ok(!I.au, '소리 없이(성능 시계)'); await bot(); ok(await phase('end'), '끝까지'); await botOff(); const L = (await info()).last; ok(L && L.s >= 10, '무음 반듯 ' + (L && L.s) + '/' + (L && L.n));
    await release(); await ev(async () => { const m = await import('/v2/js/settings.js?v=2'); m.SET.mute = false; dispatchEvent(new CustomEvent('sm-set')); }); await W8(400); }
  // ── H10 출력 지연 흉내 0.2초 · 봇 = 소리 시계 + 0.2(들림) + 0.15(사람 늦음) ──
  if (on('H10')) { console.log('H10 출력 지연 0.2초 흉내'); const run = async (comp) => { await ev(c => { const RH = SM_TOWN.rhy(); RH.lat(0.2); RH.noComp(!c); }, comp); const g9 = await go(wi); const p9 = await phase('play', 8000); if (!p9) console.log('    (판 시작 못 함: go=' + g9 + ' · ' + JSON.stringify(await info()).slice(0, 300) + ')'); await bot({ mode: 'raw', late: 0.35 });
      await p.waitForFunction(() => (SM_TOWN.rhy().info().res || []).filter(r => r != null).length >= 7, null, { timeout: 40000 }).catch(() => {}); const r = ((await info()).res || []).filter(x => x != null).slice(0, 7); await release(); await ev(() => { const RH = SM_TOWN.rhy(); RH.lat(null); RH.noComp(false); }); return r.filter(x => x === 's').length; };
    const a = await run(true), c = await run(false); ok(a >= 6 && c <= 2, '보정 켬 반듯 ' + a + '/7 · 보정 끔 반듯 ' + c + '/7(보정이 빠지면 비뚤)'); await reset(); }
  // ── H7 보상 문(같은 칸 셋째 판 뒤 = 연습 · 일 갈래 하루 6판) ──
  if (on('H7')) { console.log('H7 보상 문'); await reset(); const bagN = () => ev(() => SM_TOWN.game().S.bag['🌱'] || 0), seq = [wi, wi, wi, wi, wj, wj, wj, wk3]; const got = [];
    for (const i of seq) { const n0 = await bagN(); await go(i); await phase('play', 8000); await ev(() => SM_TOWN.rhy().ff()); await phase('again', 15000); await W8(200); got.push((await bagN()) - n0); await release(); await W8(300); }
    const rw = await ev(() => Object.keys(SM_TOWN.game().S.rw.c || {}).filter(k => /^[bxm]\|/.test(k) && /rhy|paddy/.test(k)));
    ok(got[0] > 0 && got[3] === 0 && got[4] > 0 && got[7] === 0, '판마다 🌱 ' + got.join(' · ') + ' (같은 칸 넷째 = 연습 · 일곱째부터 일 갈래 하루 몫 끝)'); ok(rw.length && rw.every(k => /job:rhy:mo/.test(k)), '문 꼬리표 = ' + rw.join(', '));
    ok(await ev(() => (SM_TOWN.game().S.lad.mo.n | 0) >= 8), '연습 판도 사다리는 셈'); await reset(); }
  // ── H6 장인 시험 → 내 논배미 → 자람 → 가을 → 벼 베기 ──
  if (on('H6')) { console.log('H6 장인 시험 · 내 논배미'); await reset(); await ev(() => { const S = SM_TOWN.game().S; S.lad.mo = { lv: 3, good: 3, best: { 3: 2 }, fail: 0, n: 9, tool: 0, mt: '', reg: {}, plot: null }; });
    const w = WK.find(q => q.i === wi); await ev(w => { const M = SD2.map, x = w.x + 1.2, z = w.z + 0.9; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 3) + 0.05, z]); }, w); await W8(2600);
    const I0 = await info(); ok(I0.inv, '일꾼이 먼저 말을 검(장인 시험 · 하루 한 번)'); await go(wi); ok((await info()).master, '장인 시험 판(소리만 · 기다려 몸짓 X)'); await phase('play', 8000); await bot(); await phase('end'); await botOff(); await W8(2500);
    const L = (await info()).L; ok(L.tool === 1 && L.plot && L.plot.rows.length >= 4, '통과 → 내 못줄 · 내 논배미 ' + (L.plot ? L.plot.rows.length : 0) + '줄' + (L.tool ? '' : ' — ' + JSON.stringify((await info()).last))); await release(); await W8(300);
    const h = async () => (await ev(() => SM_TOWN.rhy().plotInfo())), hs = [];
    hs.push(await h()); for (let k = 0; k < 3; k++) { await ev(() => { SM_TOWN.game().S.day++; SM_TOWN.rhy().redraw(); }); hs.push(await h()); }
    const H = hs.map(a => a.length ? a[0][0] : 0); ok(H[0] < H[1] && H[1] <= H[2] && H[2] < H[3], '밤마다 자람(키 ' + H.join(' → ') + 'm)'); await shot('rhy_grown');
    for (const cal of [true, false]) { await ev(c => { SM_TOWN.game().S.cal.on = c; SM_TOWN.rules.season('autumn'); }, cal); await W8(1000); try { await p.waitForFunction(() => !SM_TOWN.cal().busy, null, { timeout: 40000 }); } catch (e) { /* */ } await W8(1500); const P9 = await h(); ok(P9.length && P9.every(q => q[1] === 2), '가을(달력 ' + (cal ? '켬' : '끔') + ') = 내 논배미 누렇게 익음(' + P9.length + '포기)'); }
    await ev(w => { const M = SD2.map, x = w.x + 1.2, z = w.z + 0.9; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 3) + 0.05, z]); M.player.lookAt([w.x, w.z]); }, w); await W8(1200); if (SHOTS) await shot('rhy_autumn');
    await panels(); await p.keyboard.press('KeyE'); await W8(900); const kind = await ev(() => SM_TOWN.rules.play()); await ev(() => SM_TOWN.rules.playEnd(2)); await W8(600);   /* 일꾼 곁 E(가을 = 옛 벼 베기 창) */
    ok(kind && !(await info()).L.plot.rows.length, '가을 E = 벼 베기(옛 놀이 그대로) → 내 논배미 비움'); await ev(() => { SM_TOWN.game().S.cal.on = true; SM_TOWN.rules.season('spring'); }); await W8(1000); try { await p.waitForFunction(() => !SM_TOWN.cal().busy, null, { timeout: 40000 }); } catch (e) { /* */ } await W8(1500); await reset(); }
  // ── H8 상태 교차 ──
  if (on('H8')) { console.log('H8 상태 교차'); await go(wi); await phase('play', 8000); const y0 = await ev(() => SD2.map.player.get().y);
    await p.keyboard.press('Space'); await W8(350); ok(Math.abs((await ev(() => SD2.map.player.get().y)) - y0) < 0.05, '판 중 Space = 꽂기(점프 0)');
    for (const k of ['KeyJ', 'KeyM', 'KeyI', 'Digit1']) { await p.keyboard.press(k); await W8(350); } ok(await ev(() => SM_TOWN.rhy().busy && !document.querySelector('.twn-p')), 'J·M·I·1 = 짧은 알림만(창·도구 X · 판 그대로)');
    await p.keyboard.press('Escape'); await W8(500); ok(await ev(() => !SM_TOWN.rhy().busy && !SD2.CTRL.frozen && !SD2.CTRL.pose), 'Esc = 그만(멈춤·자세 풀림)');
    await go(wi); await phase('play', 8000); await ev(() => SM_TOWN.sleep()); await W8(3200); ok(await ev(() => !SM_TOWN.rhy().busy), '잠 = 그만'); for (let k = 0; k < 3; k++) { await p.keyboard.press('Escape'); await W8(300); }
    await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); await go(wi); await phase('play', 8000); await ev(() => { const S = SM_TOWN, G = S.game(); G.S.last = null; S.lastSave && S.lastSave(); G.flush && G.flush(); });
    await boot(); await W8(1500); const mv = await ev(() => ({ busy: SM_TOWN.rhy().busy, fr: !!SD2.CTRL.frozen, pose: SD2.CTRL.pose })); const a = await ev(() => SD2.map.player.get()); await p.keyboard.down('KeyW'); await W8(700); await p.keyboard.up('KeyW'); const c = await ev(() => SD2.map.player.get());
    ok(!mv.busy && !mv.fr && !mv.pose && Math.hypot(c.x - a.x, c.z - a.z) > 0.3, '판 중 저장 → 새로고침 = 판 없음 · 걷기 정상(' + Math.hypot(c.x - a.x, c.z - a.z).toFixed(2) + 'm)'); await spring(); }
  // ── H9 크롬북 렉(CPU 4×) ──
  if (on('H9')) { console.log('H9 크롬북 렉(CPU 4×)'); const w = (await W()).find(q => q.i === wi); await ev(w => { const M = SD2.map, x = w.x + 1.2, z = w.z + 0.9; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 3) + 0.05, z]); M.player.lookAt([w.x, w.z]); }, w); await W8(2500);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const meas = ms => ev(async ms => { const T = [], DC = [], RR = SD2.renderer; let last = performance.now(), run = true; const loop = () => { if (!run) return; const n = performance.now(); T.push(n - last); last = n; DC.push(RR.info.render.calls); requestAnimationFrame(loop); }; requestAnimationFrame(loop); await new Promise(r => setTimeout(r, ms)); run = false; T.sort((a, b) => a - b); const q = k => +T[Math.floor(T.length * k)].toFixed(1); return { n: T.length, p50: q(0.5), p95: q(0.95), over33: T.filter(x => x > 33.4).length, dc: Math.round(DC.reduce((a, b) => a + b, 0) / DC.length) }; }, ms);
    const lights = () => ev(() => { let n = 0; SD2.scene.traverse(o => { if (o.isLight) n++; }); return n; }); const L0 = await lights(), A = await meas(10000);
    await ev(() => { const RH = SM_TOWN.rhy(), f = RH.tick.bind(RH); window.__tk = []; RH.tick = dt => { const t = performance.now(); f(dt); __tk.push(performance.now() - t); }; }); await go(wi); await phase('play', 12000); await bot(); await W8(1500); const B = await meas(10000), L1 = await lights(), dr = await ev(() => SM_TOWN.rhy().draws());
    const tk = await ev(() => { const a = __tk.slice().sort((x, y) => x - y); return { n: a.length, med: +a[a.length >> 1].toFixed(3), p95: +a[Math.floor(a.length * 0.95)].toFixed(3) }; }); await release(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    console.log('    판 전 ' + JSON.stringify(A) + ' · 판 중 ' + JSON.stringify(B) + ' · RHY.tick ' + JSON.stringify(tk));
    ok(dr <= 2 && L1 === L0, '그리기 +' + dr + '(모 인스턴스 하나 · 못줄 하나) · 새 Light ' + (L1 - L0)); ok(B.p95 < 33, '판 중 프레임 p95 ' + B.p95 + 'ms(< 33 · 판 전 ' + A.p95 + ')'); ok(tk.p95 < 0.5, 'RHY.tick p95 ' + tk.p95 + 'ms(CPU 4×)'); }
  ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : '')); await b.close(); done();
  function done() { console.log((fails.length ? '✗ FAIL ' + fails.length : '✓ PASS') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exitCode = fails.length ? 1 : 0; }
})().catch(e => { console.error(e); process.exitCode = 2; });
