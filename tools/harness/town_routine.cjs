// 🏡 이웃 하루 일과 · 먹이·물 연쇄 시험(ROUTINE-1 · docs/systems/town_routine.md): node tools/harness/town_routine.cjs [마을=ourtown] [포트=8002]
//   ① 10:00 = 일꾼이 다 자리에 · E 켜짐 → 20:30·06:30 = 자리 비움 · E 꺼짐 → 아침 시계를 돌리면 집에서 걸어 나와(한 번에 1.5m 넘게 안 튐) 일 시간 안에 도착 · E 다시 켜짐 → 일이 끝나면 걸어서 집에 감
//   ② 여름 비 사흘 → 다음 날 개구리·왜가리 수가 늘고 논에 왜가리 · 소식판 한 줄 · 비 없는 날 닷새 → 줄어듦 · 소식 한 줄 · 도감 '먹이 사슬' 한 줄(본 것만)
//   ③ 1초 칸·걷기 비용 · 페이지 오류 0
const { chromium, RENDER } = require('./pw.cjs');   /* --perf = 그리기 켜고 걷는 동안·걷지 않을 때 프레임 견줌 */
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.routine && SM_TOWN.routine() && SM_TOWN.wild && SM_TOWN.wild(), null, { timeout: 240000 }); await W8(2500);
    const shut = async () => { for (let i = 0; i < 6; i++) { const any = await ev(() => { const P = document.querySelector('.twn-play .x, .twn-play [data-a="x"]'); if (P) { P.click(); return 1; } const Q = document.querySelector('.twn-p [data-a="x"]'); if (Q) { Q.click(); return 1; } return document.querySelector('.twn-p,.twn-play,.twn-dlg') ? 2 : 0; }); if (!any) break; if (any === 2) await p.keyboard.press('Escape'); await W8(250); } };
    await shut(); await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); SM_TOWN.rules.season('summer'); });
    const RT = () => ev(() => SM_TOWN.routine().info()), at = async (m, clock) => { await ev(([m9, c9]) => { const G = SM_TOWN.game(); G.S.clock = c9; G.S.min = m9; G.mark(); }, [m, !!clock]); await W8(1600); };
    // ── ① 일과 ──
    console.log('① 이웃 하루 일과');
    await at(10 * 60, true); await ev(() => SM_TOWN.game().S.clock = false); let I = await RT();
    const kinds = {}; for (const o of I.list) kinds[o.k] = (kinds[o.k] || 0) + 1; console.log('  일과 일꾼 ' + I.n + ' · ' + Object.entries(kinds).map(([k, n]) => k + ' ' + n).join(' · '));
    ok(I.n >= 8, '일과가 있는 일꾼 ' + I.n + '명');
    const inH = (o, m) => m >= o.hrs[0] * 60 && m < o.hrs[1] * 60;
    { const bad = I.list.filter(o => inH(o, 600) && (o.st !== 'in' || o.off)); ok(!bad.length, '10:00 = 일 시간인 일꾼 모두 자리 · E 켜짐 (' + (I.list.length - bad.length) + '/' + I.list.filter(o => inH(o, 600)).length + (bad.length ? ' · 어긋남 ' + bad.slice(0, 3).map(o => o.k + ' ' + o.st).join(', ') : '') + ')'); }
    for (const m0 of [20 * 60 + 30, 6 * 60 + 30]) { await at(m0, true); await ev(() => SM_TOWN.game().S.clock = false); I = await RT(); const m = await ev(() => SM_TOWN.game().S.min);   /* 시계를 돌려 때를 바꾼 뒤 멈춤 · 판정은 지금 분으로 */ const hh = Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
      const out = I.list.filter(o => !inH(o, m)), gone = out.filter(o => o.st === 'out' && o.off && o.out), early = out.filter(o => o.st === 'in' && ((m >= o.cs && m < o.hrs[0] * 60) || o.nd)), bad = out.filter(o => !gone.includes(o) && !early.includes(o));
      ok(!bad.length && gone.length >= out.length * 0.75, hh + ' = 일 시간 밖 일꾼 자리 비움 ' + gone.length + '/' + out.length + (early.length ? ' (일찍 와 기다림·이야기에 필요 ' + early.length + ')' : '') + (bad.length ? ' · 어긋남 ' + bad.slice(0, 3).map(o => o.k + ' ' + o.st + ' off ' + o.off + ' cs ' + o.cs + ' la ' + o.la + ' hm ' + JSON.stringify(o.hm)).join(', ') : ''));
      const eOn = await ev(() => { const L = SM_TOWN.routine().info().list.filter(o => o.out); return SD2.map.interact.list().filter(h => !h.off && L.some(o => Math.abs(o.x - h.x) < 3.2 && Math.abs(o.z - h.z) < 3.2) && /같이 해요|장터 \(|쉬는 중/.test(h.label)).length; });
      ok(eOn === 0, hh + ' 비운 자리의 일꾼 E 0 (' + eOn + ')'); }
    // 아침 출근 걷기(카메라 곁 · 시계 돌림)
    { const nH = await ev(() => SM_TOWN.routine().homes()); I = await RT(); const c = I.list.filter(o => o.hm && o.hrs[0] === 7);
      console.log('  집 자리 ' + nH + '/' + I.n + ' (문 ' + I.list.filter(o => o.hm && o.hm.door).length + ' · 길가 ' + I.list.filter(o => o.hm && !o.hm.door).length + ')');
      ok(c.length > 0, '집 자리가 있는 07~19 일꾼 ' + c.length);
      const o = c.find(q => q.hm.door) || c[0];
      if (o) { await ev(([x, z]) => { SD2.map.player.teleport([x + 6, SM_TOWN.ground(x + 6, z) + 0.1, z]); }, [o.hm.x, o.hm.z]); await at(o.cs - 3, true); await W8(400);
        let seen = { come: 0, inAt: null, maxStep: 0, n: 0 }, last = null; const t0 = Date.now();
        while (Date.now() - t0 < 45000) { await W8(200); const r = await ev(i9 => { const R = SM_TOWN.routine().info(), q = R.list.find(v => v.i === i9); return { q, min: SM_TOWN.game().S.min }; }, o.i); const q = r.q;
          if (q.st === 'come') { seen.come++; if (q.mx != null) { if (last) seen.maxStep = Math.max(seen.maxStep, Math.hypot(q.mx - last[0], q.mz - last[1])); last = [q.mx, q.mz]; seen.n++; } }
          if (q.st === 'in' && seen.come) { seen.inAt = r.min; break; } }
        ok(seen.come > 2, '아침 = 집에서 걸어 나옴 (걷는 칸 ' + seen.come + ' · ' + o.k + ' 문 ' + (o.hm.door ? 'O' : 'X') + ')');
        ok(seen.n > 2 && seen.maxStep < 1.5, '걷기 = 0.2초에 1.5m 넘게 안 튐 (가장 큰 걸음 ' + seen.maxStep.toFixed(2) + 'm)');
        ok(seen.inAt != null && seen.inAt <= 7 * 60 + 8, '일 시간 안에 도착 (' + (seen.inAt != null ? Math.floor(seen.inAt / 60) + ':' + String(seen.inAt % 60).padStart(2, '0') : '못 옴') + ')');
        const off = await ev(i9 => SM_TOWN.routine().info().list.find(v => v.i === i9).off, o.i); ok(!off, '도착하면 E 다시 켜짐');
        // 퇴근(시험 손잡이로 일 끝 = 지금+2분 · 낮이라 보임)
        const m0 = await ev(() => SM_TOWN.game().S.min); await ev(([k, m9]) => SM_TOWN.routine().hrsTest(k, [7, (m9 + 2) / 60]), [o.k, m0]);
        let go = 0, gone = null; const t1 = Date.now(); while (Date.now() - t1 < 45000) { await W8(250); const q = await ev(i9 => SM_TOWN.routine().info().list.find(v => v.i === i9), o.i); if (q.st === 'go') go++; if (q.st === 'out') { gone = q; break; } }
        ok(go > 2 && gone && gone.off, '일이 끝나면 걸어서 집에 감 (걷는 칸 ' + go + ' · E 꺼짐 ' + !!(gone && gone.off) + ')');
        await ev(k => SM_TOWN.routine().hrsTest(k, null), o.k);
        if (RENDER) { const FR = () => ev(() => new Promise(res => { const T = []; let l = performance.now(); const f = () => { const n = performance.now(); T.push(n - l); l = n; if (T.length < 90) requestAnimationFrame(f); else { T.shift(); T.sort((a, b) => a - b); res({ worst: Math.round(T[T.length - 1]), p95: Math.round(T[Math.floor(T.length * 0.95)]), mv: SM_TOWN.routine().info().mv }); } }; requestAnimationFrame(f); }));
          await at(10 * 60, true); await ev(([x, z]) => { SD2.map.player.teleport([x + 4, SM_TOWN.ground(x + 4, z) + 0.1, z]); }, [o.x, o.z]); await W8(1500); const f0 = await FR();
          const m1 = await ev(() => SM_TOWN.game().S.min); await ev(([L9, m9]) => { for (const k of L9) SM_TOWN.routine().hrsTest(k, [7, (m9 + 1) / 60]); }, [Object.keys(kinds), m1]); let f1 = null; for (let k = 0; k < 40 && !f1; k++) { await W8(250); if ((await RT()).mv > 0) f1 = await FR(); }
          await ev(L9 => { for (const k of L9) SM_TOWN.routine().hrsTest(k, null); }, Object.keys(kinds));
          console.log('  프레임(그리기 켬) 걷는 몸 0 = ' + JSON.stringify(f0) + ' · 걷는 동안 = ' + JSON.stringify(f1)); ok(f1 && f1.mv > 0 && f1.worst <= Math.max(50, f0.worst * 1.5), '걷는 동안 가장 긴 프레임이 걷지 않을 때와 같은 범위'); } } }
    I = await RT(); console.log('  걷기 tick 가장 긴 ' + I.tickMax + 'ms · 걸어 나옴 ' + I.nCome + ' · 걸어 들어감 ' + I.nGo + ' · 바로 옮김 ' + I.nSnap); ok(I.tickMax < 1, '걷기 tick < 1ms (' + I.tickMax + ')');
    // ── ② 먹이·물 연쇄 ──
    console.log('② 먹이·물 연쇄');
    const day = async w => { await ev(w9 => { SM_TOWN.rules.wx(w9); }, w); await W8(1300); await ev(() => SM_TOWN.game().sleep()); await W8(1800); await shut(); await at(11 * 60, false); };
    const fcN = () => ev(() => SM_TOWN.wild().fcN());
    await at(11 * 60, false); await ev(() => SM_TOWN.rules.wx('clear')); const N0 = await fcN(), C0 = (await RT()).chain; console.log('  보통 날 ' + JSON.stringify(N0) + ' · ' + C0.d + '일째 ' + (C0.k || '없음'));
    for (let i = 0; i < 3; i++) await day('rain');
    const N1 = await fcN(), C1 = (await RT()).chain; console.log('  비 사흘 뒤 ' + JSON.stringify(N1) + ' · ' + C1.d + '일째 ' + C1.k + ' (비 ' + C1.n + '일)');
    ok(C1.k === 'wet', '비 사흘 → 다음 날 = 비 갈래 (' + C1.k + ')');
    ok(N1.frog > N0.frog && N1.heron + N1.heronPaddy > N0.heron + N0.heronPaddy && N1.heronPaddy > 0, '개구리 ' + N0.frog + '→' + N1.frog + ' · 왜가리 ' + (N0.heron + N0.heronPaddy) + '→' + (N1.heron + N1.heronPaddy) + ' (논 ' + N1.heronPaddy + ')');
    { const sp = await ev(() => SM_TOWN.wild().fcSpots()); if (sp[0]) { await ev(s => { SM_TOWN.wild().reset(); SD2.map.player.teleport([s.x + 10, SM_TOWN.ground(s.x + 10, s.z) + 0.2, s.z]); }, sp[0]); await W8(600); await ev(() => SM_TOWN.wild().sec()); const a = await ev(() => SM_TOWN.wild().fcSpots()[0].act); ok(a, '논 한가운데 왜가리가 실제로 나옴 (act ' + a + ')'); } else ok(false, '논 왜가리 자리 없음'); }
    { const N = await ev(() => { const R = SM_TOWN.newsRun(false); return R ? { lines: R.lines.map(L => L.k + ' ' + L.t), cand: R.cand.two } : null; }); console.log('  소식판 ' + JSON.stringify(N && N.lines)); ok(!!N && N.lines.some(t => /^chain:wet/.test(t) && /왜가리/.test(t)), '아침 소식판 한 줄 = 왜 늘었나 (비 사흘 → 개구리 → 왜가리)'); }
    for (let i = 0; i < 5; i++) await day('clear');
    const N2 = await fcN(), C2 = (await RT()).chain; console.log('  비 없는 닷새 뒤 ' + JSON.stringify(N2) + ' · ' + C2.d + '일째 ' + C2.k + ' (맑음 ' + C2.n + '일)');
    ok(C2.k === 'dry' && N2.frog < N0.frog && N2.heron < N0.heron && N2.heronPaddy === 0, '맑음 닷새 → 개구리 ' + N0.frog + '→' + N2.frog + ' · 왜가리 ' + N0.heron + '→' + N2.heron + ' · 논 왜가리 0');
    { const N = await ev(() => { const R = SM_TOWN.newsRun(false); return R ? R.lines.map(L => L.k + ' ' + L.t) : null; }); ok(!!N && N.some(t => /^chain:dry/.test(t)), '아침 소식판 한 줄 = 왜 줄었나 (' + (N || []).join(' / ').slice(0, 90) + ')'); }
    { const L = await ev(() => { const D = SM_TOWN.game().S.dex, R = SM_TOWN.routine(); const a = R.dexLine({}); const b = R.dexLine({ 'wild:frog': 1 }); const c = R.dexLine({ 'wild:frog': 1, 'wild:heron': 1 }); void D; return [a, b, c]; }); ok(L[0] === '' && /…/.test(L[1]) && !/왜가리/.test(L[1]) && !/❔/.test(L[1]) && /왜가리/.test(L[2]) && !/…/.test(L[2]), '도감 먹이 사슬 = 본 것만 (' + L[2] + ')'); }
    { const W = await ev(() => SM_TOWN.wild().info()); ok(W.secMax < 4, '야생동물 1초 칸 가장 긴 ' + W.secMax + 'ms'); }
    ok(!errs.length, '페이지 오류 0 ' + errs.slice(0, 3).join(' | '));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } await b.close(); console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
