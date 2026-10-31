// 🗓 계절 행사 시험(SEASON-1 · v2/games/town_season.js): node tools/harness/town_season.cjs [마을=ourtown] [포트=8002] [--shots=폴더(그리기 켬 · 설날 낮 · 대보름 밤 캡처)]
//   ① 달력 자리: 추석·김장(가을) · 설날·대보름(겨울) · 단오(여름) = 그 계절 정해진 날 · 그날 아니면 행사 물건·E·모인 이웃·달 0
//   ② 행사마다 그날로 옮겨: 마당 물건 · E 자리 · 모인 이웃(옷 색) · 아침 소식 · 달력 줄 · 할 거리(틀린 판단 = 안 셈 · 맞는 판단 = 셈) → 다 하면 끝 · 잔치 준비 갈래 보탬 · 일기
//   ③ 잔치 날과 겹치면 하루 비킴 · 창 글에 숫자·% 0 · 페이지 오류 0
const { chromium, RENDER } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  try { const c = await b.newContext({ viewport: [1280, 720] && { width: 1280, height: 720 } }), p = await c.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.seasonEv && SM_TOWN.seasonEv(), null, { timeout: 240000 }); await W8(1500);
    const closeAll = async () => { for (let i = 0; i < 8; i++) { if (!await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(200); if (await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); await W8(200); } } };
    await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.cal = { d0: 1, on: true, s: 'now' }; G.min = 9 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = 9999; G.story = G.story || {}; G.story.p0auto = 1; if (G.feast) G.feast.fd = 200; SM_TOWN.weather('clear'); SM_TOWN.game().mark(); });
    const N = () => ev(() => SM_TOWN.seasonEv()), I = () => ev(() => SM_TOWN.seasonEv().info()), D = (k, ...a) => ev(([k, a]) => SM_TOWN.seasonEv().dbg[k](...a), [k, a]);
    const sec = async (n = 2) => { for (let i = 0; i < n; i++) { await ev(() => SM_TOWN.seasonEv().sec()); await W8(60); } };
    const setDay = async (d, m) => { await closeAll(); await ev(([d, m]) => { const G = SM_TOWN.game(); G.S.day = d; G.S.min = m; G.mark(); }, [d, m]); await sec(2); await W8(700); };
    const setMin = async m => { await ev(m => { SM_TOWN.game().S.min = m; }, m); await sec(2); await W8(700); };
    const q = (...a) => D('q', ...a), use = async id => { await sec(1); await ev(id => SM_TOWN.seasonEv().dbg.use(id), id); await W8(150); await sec(1); }, go = async (x, z) => { await ev(([x, z]) => SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]), [x, z]); await sec(1); };
    const goL = async (lx, lz) => { const P = await D('at', lx, lz); await go(P[0], P[1]); };
    const lvF = () => ev(() => { const f = SM_TOWN.feast && SM_TOWN.feast(); return f ? { ...f.info().lv } : null; });
    const shotAt = async (n, lx, lz, tx, tz, pt) => { if (pt != null) await ev(v => SD2.pitch(v), pt); if (!SHOTS) return; await closeAll(); await ev(([lx, lz, tx, tz]) => { const F9 = SM_TOWN.seasonEv().dbg, P = F9.at(lx, lz), T = F9.at(tx, tz); SD2.map.player.teleport([P[0], SM_TOWN.ground(P[0], P[1]) + 0.05, P[1]]); SD2.map.player.face(Math.atan2(T[0] - P[0], -(T[1] - P[1])) * 180 / Math.PI); }, [lx, lz, tx, tz]); await W8(2600); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('  📷 ' + SHOTS + '/' + n + '.png'); };
    const panelTxt = () => ev(() => { const P9 = document.querySelector('.twn-p'); return P9 ? P9.textContent : ''; });

    // ① 달력 자리
    const DAYS = {}; for (const id of ['chu', 'kim', 'seol', 'bor', 'dano']) DAYS[id] = await D('dayOf', id, 1);
    const seaOf = await ev(D9 => Object.fromEntries(Object.entries(D9).map(([k, d]) => [k, SM_TOWN.game().seasonAt(d)])), DAYS);
    console.log('  행사 날: ' + JSON.stringify(DAYS) + ' · 계절 ' + JSON.stringify(seaOf));
    ok(seaOf.chu === 'autumn' && seaOf.kim === 'autumn' && seaOf.seol === 'winter' && seaOf.bor === 'winter' && seaOf.dano === 'summer' && DAYS.chu < DAYS.kim && DAYS.seol + 1 === DAYS.bor, '추석·김장 = 가을(추석이 먼저) · 설날·대보름 = 겨울(이어진 날) · 단오 = 여름');
    await setDay(DAYS.chu + 1, 9 * 60); let S9 = await I();
    ok(!S9.id && !S9.vis.length && !Object.keys(S9.hot).length && !(await ev(() => SM_TOWN.seasonP().length)) && !S9.moon, '행사 없는 날 = 마당 물건 0 · E 0 · 모인 이웃 0 · 달 X');

    // ② 추석
    let lv0 = await lvF(); await setDay(DAYS.chu, 9 * 60); S9 = await I(); console.log('  추석 마당 ' + JSON.stringify(S9.site) + ' · 물건 ' + S9.parts + ' · E ' + Object.keys(S9.hot).join(','));
    ok(S9.id === 'chu' && S9.vis.includes('yard') && S9.parts >= 3 && S9.hot.sp && S9.hot.trail && !S9.hot.ggr, '추석 = 송편 상 · 성묘길 팻말 · E(송편 빚기 · 성묘길 챙기기) · 강강술래는 밤에만');
    let SP = await ev(() => SM_TOWN.seasonP()); ok(SP.length >= 3 && SP.filter(q9 => q9[3] === 'sitg').length >= 3, '송편 상에 이웃 셋이 앉음(있는 일꾼 · ' + SP.length + '명)');
    const nw = await ev(d => SM_TOWN.seasonEv().news(d), DAYS.chu), nwp = await ev(d => SM_TOWN.seasonEv().news(d), DAYS.chu - 1), cal = await ev(() => SM_TOWN.seasonEv().calLine());
    ok(nw.length === 1 && /오늘은 추석이에요/.test(nw[0].t[0]) && !/\d/.test(nw[0].t[0]) && nwp.length === 1 && /내일은 추석/.test(nwp[0].t[0]), '아침 소식 = 「' + (nw[0] && nw[0].t[0]) + '」 · 전날 「' + (nwp[0] && nwp[0].t[0]) + '」');
    ok(/오늘은 추석/.test(cal), '날씨 창 달력 줄 = 「' + cal + '」');
    const O = await D('orders'); const wrong = ['sesame', 'bean', 'chest'].find(k => !O[0].includes(k));
    await q(wrong, null); await use('sp'); S9 = await I(); ok((S9.st.spn | 0) === 0, '송편: 조건에 안 맞는 소(' + wrong + ') = 안 셈 · 이웃이 까닭 한 줄');
    for (let i = 0; i < 3; i++) { await q(O[i][0]); await use('sp'); } S9 = await I(); ok(S9.st.spn === 3, '송편: 이웃 셋에게 맞는 소 = 셋 다 빚음(상에 송편이 하나씩)');
    await q('lighter'); await use('trail'); S9 = await I(); ok(!(S9.st.pk || []).length, '성묘길: 라이터 = 안 셈(산불 까닭)');
    await q('sleeve'); await use('trail'); await q('water'); await use('trail'); S9 = await I(); let lv1 = await lvF();
    ok(!S9.st.done && (S9.st.pk || []).length === 2 && !S9.past.some(q9 => q9.id === 'chu'), '성묘길 긴소매·물 → 낮 할 일 둘 · 밤 강강술래가 남아 아직 끝 X(RWFIX-1 E9 · 안내판 셋 = 끝 조건)');
    await setMin(19 * 60 + 30); S9 = await I(); SP = await ev(() => SM_TOWN.seasonP());
    ok(!!S9.hot.ggr && !!S9.moon && SP.filter(q9 => q9[3] === 'walk').length >= 6, '추석 밤 = 보름달 · 강강술래 원(' + SP.filter(q9 => q9[3] === 'walk').length + '명) · E 강강술래 구경');
    await use('ggr'); S9 = await I(); lv1 = await lvF();
    ok(S9.st.done === 1 && S9.past.some(q9 => q9.id === 'chu'), '강강술래 구경까지 → 추석 할 일 셋 끝 · 기록');
    ok(!lv0 || lv1.food === lv0.food + 1, '잔치 준비 「잔치 음식」에 보탬 ' + JSON.stringify(lv0 && lv0.food) + ' → ' + JSON.stringify(lv1 && lv1.food));
    { const me = await ev(() => SD2.map.player.pos()); ok(S9.moon[0] - me.x > 150 && S9.moon[1] > me.y, '보름달 = 동쪽(+x) 하늘 ' + JSON.stringify(S9.moon)); }

    // 김장
    lv0 = await lvF(); await setDay(DAYS.kim, 9 * 60); S9 = await I(); console.log('  김장 집 ' + JSON.stringify(S9.houses) + ' · 이미 담근 집 ' + S9.st.sp);
    ok(S9.id === 'kim' && S9.houses.length === 4 && S9.hot.kim && Object.keys(S9.hot).filter(k => /^h\d/.test(k)).length === 4, '김장 = 마당 다섯 자리 · 이웃 네 집 E');
    let r = await D('kim', 2); ok(!r.ok && r.t.length > 4, '절이기 차례: 처음에 「하룻밤 두기」 = 안 셈 · 「' + r.t + '」');
    for (let k = 0; k < 5; k++) r = await D('kim', k); S9 = await I(); ok(r.all && S9.st.carry === 3, '차례 다섯 → 김치 세 통');
    const sp = S9.st.sp; await q(null); await use('h' + sp); S9 = await I(); ok(S9.st.carry === 3 && !(S9.st.dv || []).length, '문 앞에 김치통이 있는 집 = 안 줌(이미 담금)');
    for (let i = 0; i < 4; i++) if (i !== sp) await use('h' + i); S9 = await I(); lv1 = await lvF();
    ok(S9.st.done === 1 && S9.st.carry === 0 && S9.parts >= 10, '못 한 세 집에 한 통씩 → 김장 끝 · 그 집 문 앞에 김치통이 남음(물건 ' + S9.parts + ')');
    ok(!lv0 || lv1.food === lv0.food + 1, '잔치 준비 「잔치 음식」 보탬');

    // 설날
    lv0 = await lvF(); await setDay(DAYS.seol, 9 * 60); S9 = await I(); SP = await ev(() => SM_TOWN.seasonP());
    const hbN = await ev(() => { const h = SD2 && SM_TOWN.seasonEv() && SM_TOWN.seasonP(); return h.length; });
    ok(S9.id === 'seol' && S9.houses.length === 3 && S9.hot.yut && !S9.hot.dd && hbN >= 5, '설날 = 윷판·떡국 상 · 세배할 세 집 · 이웃 ' + hbN + '명(한복)');
    const el = S9.st.sp, other = [0, 1, 2].find(i => i !== el);
    { const a = await ev(() => { const w = SM_TOWN.seasonP(); return w.filter(q9 => q9[3] === 'sitg').length; }); ok(a >= 1, '어르신 = 돗자리에 앉음(흰머리)'); }
    await q(null); await use('h' + other); S9 = await I(); ok(!(S9.st.sb || []).length, '어르신보다 먼저 다른 집 = 안 셈(어르신 쪽 방위 한 줄)');
    await q('money'); await q(null); await use('h' + el); S9 = await I(); ok(!(S9.st.sb || []).length, '어르신께 「세뱃돈 주세요」 = 안 셈');
    await q('ok'); await use('h' + el); for (const i of [0, 1, 2]) if (i !== el) await use('h' + i); S9 = await I();
    ok((S9.st.sb || []).length === 3 && S9.st.sb[0] === el && !!S9.hot.dd, '어르신 먼저 → 세 집 세배 → 떡국 상 E가 생김');
    await q(null); await use('dd'); S9 = await I(); ok(S9.st.dd && !S9.st.done, '떡국 → 할 일 둘 · 윷놀이가 남아 아직 끝 X(RWFIX-1 E9)');
    await use('yut'); await W8(400); const yt = await panelTxt(); ok(/윷/.test(yt), '윷놀이 E = 판 놀이 창(윷) 열림'); await closeAll();
    S9 = await I(); lv1 = await lvF(); ok(S9.st.done === 1 && (!lv0 || lv1.guest === lv0.guest + 1), '윷놀이까지 → 설날 끝 · 잔치 준비 「손님맞이」 보탬');
    await D('use', 'board'); await W8(300); const bt = await panelTxt(); ok(/설날/.test(bt) && !/\d|%/.test(bt), '안내판 창 = 할 일 셋 · 글에 숫자·% 0'); await closeAll();
    if (SHOTS) { await setMin(11 * 60); await shotAt('01_seol_yard', 0, 13, 0, -1); }

    // 정월 대보름
    lv0 = await lvF(); await setDay(DAYS.bor, 9 * 60); S9 = await I(); ok(S9.id === 'bor' && S9.hot.nut && S9.hot.moon && !S9.flame && !S9.moon, '대보름 아침 = 달집·안전 줄·부럼 상 · 불 X · 달 X');
    await q('candy'); await use('nut'); S9 = await I(); ok(!S9.st.nut, '부럼: 사탕과 젤리 = 안 셈'); await q('ok'); await use('nut'); S9 = await I(); ok(S9.st.nut === 1, '부럼: 호두와 땅콩 = 깸');
    await setMin(15 * 60); await use('moon'); S9 = await I(); ok(!S9.st.dir && !(await ev(() => !!document.querySelector('.twn-p'))), '오후 세 시 달맞이 = 저녁에 다시(창 X)');
    await setMin(17 * 60); await use('moon'); await W8(300); const mt = await panelTxt(), hasC = await ev(() => document.querySelectorAll('.twn-p [data-dir]').length);
    ok(/지는 해/.test(mt) && hasC === 4, '달맞이 창 = 나침반 그림(지는 해) + 방위 단추 넷');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-dir="w"]'); if (b9) b9.click(); }); await W8(200); const why = await ev(() => (document.querySelector('.twn-p [data-why]') || {}).textContent || '');
    S9 = await I(); ok(!S9.st.dir && /맞은편/.test(why), '서쪽 = 안 셈 · 「' + why + '」'); await closeAll();
    r = await D('dir', 'e'); S9 = await I(); ok(r.ok && S9.st.dir === 1, '동쪽 = 맞음');
    await goL(0, -1.2); await setMin(18 * 60 + 20); S9 = await I(); ok(!S9.st.lit && S9.st.warn === 1, '달이 뜸 · 안전 줄 안에 서 있으면 불을 안 붙임(소방관 한 줄)');
    await goL(0, 6.6); await sec(2); S9 = await I(); lv1 = await lvF();
    ok(S9.st.lit === 1 && S9.flame && !!S9.moon && S9.st.done === 1, '안전 줄 밖 → 달집 불(MeshBasic) · 보름달 · 대보름 끝');
    ok(!lv0 || lv1.safe === lv0.safe + 1, '잔치 준비 「안전」 보탬');
    if (SHOTS) { await setMin(19 * 60 + 10); await W8(3000); await shotAt('02_bor_night', -1, -19, 0, 2, -0.2);  const ndc = await ev(() => { const c9 = SD2.map.camera, m = SM_TOWN.seasonEv().info().moon; if (!m) return null; const v = c9.position.clone().set(m[0], m[1], m[2]); c9.updateMatrixWorld(); v.project(c9); return [+v.x.toFixed(2), +v.y.toFixed(2), v.z < 1 ? 0 : 1]; }); ok(ndc && Math.abs(ndc[0]) < 1 && Math.abs(ndc[1]) < 1 && ndc[2] < 1, '동쪽을 보면 보름달이 화면 안 ' + JSON.stringify(ndc)); }   /* 달집 서쪽에서 동쪽(로컬 +z) = 달집 불 + 떠오르는 보름달 */

    // 단오
    lv0 = await lvF(); await setDay(DAYS.dano, 10 * 60); S9 = await I(); ok(S9.id === 'dano' && S9.hot.cp && S9.hot.cake && S9.hot.ring && S9.hot.swing, '단오 = 그네·씨름판·창포물·수리취떡 E');
    const cpk = S9.st.cpk; await q(String(1 - cpk)); await use('cp'); S9 = await I(); ok(!S9.st.cp, '둥근 잎 다발 = 안 셈'); await q(String(cpk)); await use('cp'); S9 = await I(); ok(S9.st.cp === 1, '칼처럼 긴 잎 다발 = 창포');
    await q('star'); await use('cake'); await q('ok'); await use('cake'); S9 = await I(); ok(S9.st.cake === 1, '수리취떡 무늬 = 수레바퀴(별 = 안 셈)');
    await goL(3.0, -3.0); await use('ring'); S9 = await I(); ok(!S9.st.bout, '모래판 안에서 응원 = 밖으로(안 셈)');
    await goL(3.0, 2.2); await q('b'); await use('ring'); await W8(400); await sec(1); S9 = await I(); lv1 = await lvF(); SP = await ev(() => SM_TOWN.seasonP());
    ok(S9.st.bout === 2 && S9.st.done === 1 && SP.some(q9 => q9[3] === 'sitg'), '모래판 밖 응원 → 한 판 끝(한 선수 모래에 닿음) · 단오 끝');
    ok(!lv0 || lv1.show === lv0.show + 1, '잔치 준비 「공연 준비」 보탬');

    // ③ 잔치 날과 겹치면
    await ev(d => { SM_TOWN.game().S.feast.fd = d; }, DAYS.seol); const mv = await D('dayOf', 'seol', DAYS.seol - 3), on19 = await ev(d => SM_TOWN.seasonEv().idOn(d), DAYS.seol);
    ok(mv === DAYS.seol - 1 && !on19, '잔치 날 = 설날 → 설날은 하루 앞(뒷날이 대보름) · 잔치 날엔 행사 X'); await ev(() => { SM_TOWN.game().S.feast.fd = 200; });
    await setDay(DAYS.dano + 1, 10 * 60); S9 = await I(); ok(!S9.id && !S9.vis.length && !(await ev(() => SM_TOWN.seasonP().length)), '다음 날 = 행사 물건·이웃 치움');
    const dia = await ev(() => (SM_TOWN.game().S.diary || []).filter(q9 => /단오|설날|추석|김장|대보름/.test(q9.t)).length); ok(dia >= 5, '일기에 행사 줄 ' + dia);
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
    await c.close();
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
