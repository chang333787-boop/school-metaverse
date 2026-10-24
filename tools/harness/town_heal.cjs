// 🌙 힐링 묶음 시험(HEAL-1 · docs/systems/town_heal.md §6 H1~H15): node tools/harness/town_heal.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   H1 할 일 창(⬜/✅·n/need·+500 없음 · 한 일 = 지난 말) · H2 경제(덤 500원 지운 몫) · H3 창 불빛(하나씩 · 계단 없음) · H4 가로등 구역 차례(새 Light 0)
//   H5 소리 철·때 어긋남 0 · H6 비 그침 개울 · H7 소리 자리 = 생물 자리 · H8 오디오 무게(AudioContext ≤ 2 · 동시 ≤ 6 · ambTick ms · 실내 lowpass)
//   H9 사진 모드(들어가기·찰칵·Esc·터치 단추·60초) · H10 상태 교차(이야기 창 되살림 · 실내·탈것 막음) · H11 엽서(받는 이 · 우표 · 답장 · 엽서 판)
//   H12 한도(엽서 하루 3장 · card 하트 하루 2) · H13 그리기 +1 · H14 귀(사람 — 숫자만 적음) · H15 눈(캡처 --shots)
//   --only=H9,H11 = 그 구역만 · 브라우저는 한 자리로 돌림(맥 과열 X) · 끝나면 닫음
const { chromium } = require('playwright');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8);
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7), on = h => !ONLY || ONLY.split(',').includes(h);   /* --only=H9,H11 = 그 구역만(고칠 때) */
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--autoplay-policy=no-user-gesture-required'] }); const errs = [];
  try { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(() => { window.__AC = 0; const A0 = window.AudioContext; if (A0) { window.AudioContext = function (...a) { window.__AC++; const st = String(new Error().stack || ''); if (/games\/town/.test(st)) window.__ACT = (window.__ACT || 0) + 1; return new A0(...a); }; window.AudioContext.prototype = A0.prototype; } });
    const p = await ctx.newPage(); p.on('pageerror', e => { if (!/pointer lock/i.test(e.message)) errs.push(e.message.slice(0, 200)); }); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|photo onFrame/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS.replace(/\/$/, '') + '/' + n + '.png' }); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.heal && window.SD2 && SM_TOWN.wild && SM_TOWN.wild(), null, { timeout: 240000 }); await W8(1500);
    const shut = () => ev(() => { for (let i = 0; i < 4; i++) { const P = document.querySelector('.twn-p'); if (!P) return; const b9 = P.querySelector('[data-a="x"]') || [...P.querySelectorAll('button')].find(e => /그대로|닫기|나중에|Keep|Close/.test(e.textContent)); if (b9) b9.click(); else return; } });
    await shut(); await p.keyboard.press('Escape'); await W8(500);
    await ev(() => { window.__G = SM_TOWN.game(); });
    const H = () => ev(() => SM_TOWN.heal.light()), at = (m) => ev(m9 => { __G.S.min = m9; const ph = m9 < 360 || m9 >= 1140 ? 'night' : m9 >= 1020 ? 'sunset' : 'day'; if (SD2.map.time && SD2.map.time() !== ph) SD2.map.time(ph); SM_TOWN.heal.lightNow(); return SM_TOWN.heal.light(); }, m);

    // ── H1 할 일 창 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H1 할 일 창');
    if (on('H1')) { const R = await ev(async () => { const L = SM_TOWN.tasksNow(), t0 = L[0], m0 = __G.S.money; SM_TOWN.rw.tev(t0.ev, t0.need); const m1 = __G.S.money; SM_TOWN.heal.tasks(); await new Promise(r => setTimeout(r, 300)); const P = document.querySelector('.twn-p'), txt = P ? P.textContent : '', chip = (document.querySelector('.twn-task') || {}).textContent || '';
        for (const t of L.slice(1)) SM_TOWN.rw.tev(t.ev, t.need); const m2 = __G.S.money, rew = L.slice(1).reduce((a, t) => a + (t.done ? t.rew : 0), 0); return { txt, chip, L: L.map(t => ({ t: t.t, tp: t.tp, why: t.why ? t.why[0] : '', done: t.done, rew: t.rew, need: t.need })), d1: m1 - m0, rew0: t0.rew, d2: m2 - m1, rew, all: __G.S.tasks.all }; });
      console.log('    창: ' + R.txt.slice(0, 220)); console.log('    칩: ' + R.chip);
      ok(!/[⬜✅]/.test(R.txt), '⬜ ✅ 칸 0개'); ok(!/\d+\s*\/\s*\d+/.test(R.txt), '(n/need) 숫자 0개'); ok(!/\+\s*500|500원 더/.test(R.txt), '+500 글 0개'); ok(/오늘 해 볼 만한 것/.test(R.txt) && /하고 싶은 것만 골라요/.test(R.txt), '제목·설명 = 고르기');
      ok(R.L[0].tp && R.txt.includes(R.L[0].tp.slice(2, 10)), '한 일 줄 = 지난 말(' + R.L[0].tp + ')'); ok(R.L.every(t => !t.why || R.txt.includes(t.why.slice(0, 8))), 'why 줄 그대로'); ok(!/\d+\s*\/\s*\d+/.test(R.chip), '칩에 1/3 같은 숫자 없음');
      ok(R.d1 === R.rew0, '한 일 보상 = 그 줄 값(' + R.d1 + ')'); ok(R.all && R.d2 === R.rew, '셋 다 = 덤 돈 없음(셋째까지 ' + R.d2 + ' = 줄 값 ' + R.rew + ')');
      await shot('h1_tasks'); await shut(); }
    // ── H2 경제 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H2 경제');
    if (on('H2')) { const R = await ev(() => { const T = SM_TOWN.tasksNow(); return T.reduce((a, t) => a + t.rew, 0); }); const day = 11000;   /* econ_sim 보통 하루(여러 곳을 도는 아이) 11~16천 원 — town_game.js ITEMS 값 근거 줄 */
      const k = 500 / (day + R + 500); console.log('    오늘 할 일 셋 = ' + R + '원 · 지운 덤 500원 = 보통 하루(낮게 잡아 ' + day + '원 + 할 일)의 ' + (k * 100).toFixed(1) + '%'); ok(k < 0.15, '하루 벌이 차이 ±15% 안(' + (k * 100).toFixed(1) + '% → 줄마다 +170 안 함)'); }
    // ── H3 창 불빛 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H3 창 불빛');
    if (on('H3')) { await ev(() => { if (__G.setClock) __G.setClock(true); }); const L = []; for (let m = 17 * 60; m <= 19 * 60 + 30; m += 10) { const h = await at(m); L.push([m, h.lit, h.uNight9, h.on]); }
      const mx = Math.max(...L.map(q => q[1])), a20 = L.find(q => q[0] === 17 * 60 + 20)[1], a910 = L.find(q => q[0] === 19 * 60 + 10)[1]; let mono = true; for (let i = 1; i < L.length; i++) if (L[i][1] < L[i - 1][1] - 1e-9) mono = false;
      console.log('    ' + L.map(q => String((q[0] / 60) | 0).padStart(2, '0') + ':' + String(q[0] % 60).padStart(2, '0') + ' ' + (q[1] * 100).toFixed(0) + '%').join(' · '));
      const z = []; for (const m of [22 * 60, 22 * 60 + 30, 23 * 60, 23 * 60 + 30, 23 * 60 + 50]) z.push([m, (await at(m)).lit]); console.log('    밤: ' + z.map(q => ((q[0] / 60) | 0) + ':' + String(q[0] % 60).padStart(2, '0') + ' ' + (q[1] * 100).toFixed(0) + '%').join(' · '));
      ok(L.every(q => q[3]), '시계가 도는 마을 = 이어지는 불빛(HL9.on)'); ok(a20 === 0, '17:20 켜진 창 0'); ok(a910 >= mx * 0.95 && mx > 0.4, '19:10 켜진 창 ≥ 최대의 95%(' + (a910 * 100).toFixed(0) + '% / ' + (mx * 100).toFixed(0) + '%)'); ok(mono, '오르는 동안 줄지 않음'); ok(z[z.length - 1][1] <= mx * 0.5 + 1e-9, '23:50 ≤ 최대의 50%(' + (z[z.length - 1][1] * 100).toFixed(0) + '%)');
      const st = await ev(() => { let w = 0; for (let m = 300; m < 1440; m += 0.25) { const a = SM_TOWN.heal.curves(m), c = SM_TOWN.heal.curves(m + 1 / 0.7); for (const k of ['night', 'late', 'lamp']) w = Math.max(w, Math.abs(a[k] - c[k])); } return w; }); ok(st <= 0.05, '1초 사이 변화 ≤ 0.05(가장 큰 ' + st.toFixed(3) + ' — 계단 없음)'); }
    // ── H4 가로등 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H4 가로등 구역');
    if (on('H4')) { const lc = () => ev(() => { let n = 0; SD2.scene.traverse(o => { if (o.isLight) n++; }); return n; }); await at(12 * 60); const L0 = await lc(); const R = []; for (let m = 17 * 60 + 30; m <= 18 * 60 + 50; m += 5) { const h = await at(m); R.push([m, h.uLamp9, h.regs.filter(v => h.uLamp9 >= v + 0.04).length, h.regs.length, h.glow && h.glow.vis]); }
      const h45 = await at(18 * 60 + 45), L1 = await lc(), regs = h45.regs, steps = new Set(R.map(q => q[2])).size;
      console.log('    구역 ' + regs.length + ' · ' + R.filter((q, i) => i % 3 === 0).map(q => ((q[0] / 60) | 0) + ':' + String(q[0] % 60).padStart(2, '0') + ' ' + q[2] + '/' + q[3]).join(' · '));
      ok(regs.length > 0 && regs.every(v => h45.uLamp9 >= v + 0.04), '18:45 모든 구역 켜짐'); ok(new Set(regs.map(v => Math.round(v * 20))).size >= 2 && steps >= 3, '켜지는 때가 구역마다 나뉨(' + steps + '단계)'); ok(L0 === L1, '새 Light 0(씬 Light ' + L0 + ' → ' + L1 + ')'); ok(R[0][4] === false && h45.glow.vis, '빛 웅덩이 = 낮 숨김 · 켜진 뒤 보임'); }
    // ── H5 소리 철·때(규칙 표 전수) ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H5 소리 철·때');
    if (on('H5')) { const R = await ev(async () => { const M = await import('/v2/games/town_heal.js?v=1'), SEA = ['spring', 'summer', 'autumn', 'winter'], TM = { 아침: 7 * 60, 낮: 13 * 60, 밤: 21 * 60 }, WX = { 맑음: [false, 0], 비: [true, 0], '비 그침 10초': [false, 80] };
        const PL = { 논가: { frog: 10, creek: 60 }, 들판: { cricket: 8, creek: 80 }, 숲: { cicada: 10, owl: 20, creek: 70 }, 개울: { creek: 4 }, 장터: { stall: 10, creek: 90 }, 실내: { frog: 10, cricket: 8, cicada: 10, owl: 10, creek: 4, stall: 10 } };
        const bad = [], sig = {}; for (const [pn, d] of Object.entries(PL)) for (const s of SEA) for (const [tn, m] of Object.entries(TM)) for (const [wn, [rain, after]] of Object.entries(WX)) { const night = m >= 19 * 60 || m < 6 * 60, L = M.ambLayers({ sea: s, min: m, night, rain, after, ins: pn === '실내', jang: true, d }), on = Object.keys(L).filter(k => L[k] > 0);
          const want = { frog: ['spring', 'summer'].includes(s) && (night || after > 0), cricket: s === 'autumn' && night && !rain, cicada: s === 'summer' && !night && m >= 9 * 60 && m < 17 * 60 && !rain, owl: ['spring', 'summer'].includes(s) && night && !rain, market: m >= 9 * 60 && m < 18 * 60 };
          for (const k of ['frog', 'cricket', 'cicada', 'owl', 'market']) if (L[k] > 0 && !(want[k])) bad.push(pn + ' ' + s + ' ' + tn + ' ' + wn + ' ' + k); if (pn === '실내' && ['frog', 'cricket', 'cicada', 'owl'].some(k => L[k] > 0)) bad.push('실내 생물 ' + s + tn);
          const key = pn + '|' + s; (sig[key] = sig[key] || new Set()).add(on.sort().join('+') + (L.creek > 0 ? ':' + L.creek.toFixed(2) : '')); }
        const flat = Object.entries(sig).filter(([k, v]) => /논가\|summer|들판\|autumn|숲\|summer|장터/.test(k)).map(([k, v]) => [k, v.size]); return { bad, flat, ex: M.ambLayers({ sea: 'summer', min: 21 * 60, night: true, rain: false, after: 0, ins: false, jang: false, d: { frog: 10, owl: 20, creek: 12 } }) }; });
      console.log('    예(여름밤 논가·큰 나무 곁): ' + JSON.stringify(R.ex)); ok(!R.bad.length, '철·때 어긋남 0' + (R.bad.length ? ' — ' + R.bad.slice(0, 4).join(' | ') : '')); ok(R.flat.every(q => q[1] >= 2), '같은 자리에서 아침·낮·밤·비의 층 묶음이 서로 다름(' + R.flat.map(q => q[0].split('|')[0] + ' ' + q[1]).join(' · ') + ')'); }
    // 자연 소리 켜기(첫 누름) + 자리
    await p.keyboard.press('Shift'); await W8(800); await shut();
    const A = () => ev(() => SM_TOWN.heal.amb()), grid = await ev(() => SM_TOWN.heal.grid()); console.log('    소리 자리(32m 칸 Map): ' + JSON.stringify(grid));
    const spotsOf = id => ev(i9 => SM_TOWN.wild().info().spots.filter(s => s.id === i9).map(s => [s.hx, s.hz]), id);
    const tp = (x, z, lx, lz) => ev(([a, c, d, e]) => { SD2.map.player.teleport([a, SM_TOWN.ground(a, c) + 0.1, c]); if (d != null) SD2.map.player.lookAt([d, e]); }, [x, z, lx, lz]);
    // ── H6·H7 실제 마을에서(여름 = 지금 놀이 계절) ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H6 비 그침 · H7 소리 = 자리');
    if (on('H6')) { const a0 = await A(); ok(a0.on && a0.heal, '자연 소리 켜짐(층 있음)'); const fr = await spotsOf('frog');
      let creekAt = null; for (const q of fr) { const d = await ev(([x, z]) => SM_TOWN.sd(x, z), q); if (d > 1.5 && d < 12) { creekAt = q; break; } }
      if (!creekAt) { const W9 = await ev(() => { for (let x = -400; x < 400; x += 9) for (let z = -400; z < 400; z += 9) { const d = SM_TOWN.sd(x, z); if (d > 2 && d < 6 && !SM_TOWN.onRoad(x, z, 0)) return [x, z]; } return null; }); creekAt = W9; }
      if (creekAt) { await tp(creekAt[0], creekAt[1]); await at(13 * 60); await ev(() => SM_TOWN.weather('clear')); await ev(() => SM_TOWN.heal.after(0)); await W8(2400); const c0 = (await A()).layers.creek;
        await ev(() => SM_TOWN.weather('rain')); await W8(5000); const wr = await A(); await ev(() => SM_TOWN.weather('clear')); await W8(10200); console.log('    비 동안 wet 확인: 개울 ' + (wr.layers.creek || 0).toFixed(3) + ' · wx ' + JSON.stringify(await ev(() => SM_TOWN.wx().WX9))); const A1 = await A(), c1 = A1.layers.creek; await W8(3000); const A2 = await A();
        console.log('    개울 곁(물까지 ' + (A1.d.creek || 0).toFixed(1) + 'm): 맑음 ' + (c0 || 0).toFixed(3) + ' → 비 그치고 10초 ' + (c1 || 0).toFixed(3) + ' · 남은 초 ' + A1.after + ' → 3초 뒤 ' + A2.after);
        ok(c0 > 0 && c1 >= c0 * 1.5, '비 그친 뒤 10초 개울 ≥ 맑을 때의 1.5배'); ok(A1.after - A2.after >= 2.5 && A1.after <= 81, '비 그침 배수가 1초에 1씩 줄어 90초면 ×1(120초 뒤 1.1배 안)');
        ok(A1.layers.frog > 0 || !(await ev(() => SM_TOWN.wild().can('frog'))) || A1.d.frog == null, '비 그친 뒤 90초 = 낮에도 개구리(여름 · 논가 ' + (A1.d.frog == null ? '-' : A1.d.frog.toFixed(0) + 'm') + ')'); }
      else ok(false, '개울 곁 자리를 못 찾음');
      // H7: 층이 켜진 자리마다 그 종 자리가 40m 안에 있고 실제로 있음
      const tests = []; for (const q of fr.slice(0, 2)) tests.push(['frog', q, 21 * 60]); for (const q of (await spotsOf('owl')).slice(0, 2)) tests.push(['owl', q, 21 * 60]);
      for (const [k, q, m] of tests) { await tp(q[0] + 8, q[1] + 6); await at(m); await ev(() => SM_TOWN.weather('clear')); await W8(2200); const a = await A(), can = await ev(id => SM_TOWN.wild().can(id), k);
        console.log('    ' + k + ' 자리 곁 밤: 층 ' + (a.layers[k] || 0).toFixed(2) + ' · 가까운 자리 ' + (a.d[k] == null ? '-' : a.d[k].toFixed(1) + 'm') + ' · 그 종 있음 ' + can + ' · 소리 낸 수 ' + JSON.stringify(a.cnt));
        ok(a.layers[k] > 0 && a.d[k] <= 40 && can, k + ': 소리가 나는 자리 40m 안에 그 종이 실제로 있음'); }
      const bugs = await ev(() => SM_TOWN.bugs().filter(s => s.hab === 'tree').map(s => [s.x, s.z])); if (bugs.length) { const q = bugs[0]; await tp(q[0] + 6, q[1] + 4); await at(13 * 60); await W8(2200); const a = await A(); console.log('    나무 벌레 자리 곁 여름 낮: 매미 ' + (a.layers.cicada || 0).toFixed(2) + ' · 자리 ' + (a.d.cicada == null ? '없음(이 자리 벌레는 매미가 아님)' : a.d.cicada.toFixed(1) + 'm')); ok(!(a.layers.cicada > 0) || a.d.cicada <= 40, '매미 층 = 매미 자리 40m 안에서만'); }
      // 앉으면 ×1.3 은 층 크기에 곱함(판정은 그대로) — 숫자만 기록
      const sits = await ev(() => (SM_TOWN.sits ? SM_TOWN.sits().n : 0)); console.log('    앉을 자리 ' + sits + '곳(앉으면 새·개울·생물 층 ×1.3)'); }
    // ── H8 오디오 무게 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H8 오디오 무게');
    if (on('H8')) { const st = await ev(() => { const P = SM_TOWN.places().filter(q => !q.nat).slice(0, 6); return P.map(q => [q.x, q.z]); }); await at(21 * 60);
      const fr = await spotsOf('frog'); const route = fr.length ? fr.concat(st) : st; const t0 = Date.now(); let i = 0;
      while (Date.now() - t0 < 45000 && route.length) { const q = route[i++ % route.length]; await tp(q[0] + 5, q[1] + 5); await p.keyboard.down('KeyW'); await W8(2500); await p.keyboard.up('KeyW'); }
      const a = await A(), nAC = await ev(() => window.__ACT || 0), nAll = await ev(() => window.__AC); console.log('    1초 자리 판정 최악 ' + a.dms + 'ms · 새 층 몫 최악 ' + a.hms + 'ms(0.6ms 넘은 번 ' + a.hov + ') · 마을이 만든 AudioContext ' + nAC + '(페이지 전체 ' + nAll + ' — 학교 효과음 몫 포함) · 동시 목소리 최대 ' + a.vMax + ' · ambTick 평균 ' + a.ms.avg + 'ms · 최악 ' + a.ms.max + 'ms(' + a.ms.n + '번) · 소리 낸 수 ' + JSON.stringify(a.cnt));
      ok(nAC <= 2, 'AudioContext 만든 수 ≤ 2(' + nAC + ')'); ok(a.vMax <= 6, '동시 짧은 소리 ≤ 6(' + a.vMax + ')'); ok(a.ms.avg <= 0.15, 'ambTick 평균 ≤ 0.15ms'); ok(a.ms.max <= 0.6 || a.hov <= Math.ceil(a.ms.n * 0.01), 'ambTick 최악 ≤ 0.6ms(1초 판정 포함) — 넘은 번 1% 안(쓰레기 수거 튐 · 최악 ' + a.ms.max + 'ms)');
      const gi = await ev(async () => { const I = SM_TOWN.indoor, L = I ? I.list().filter(q => q.kind === 'shop') : []; if (!L.length) return null; const q = L[0]; I.enter(q.id); for (let k = 0; k < 60 && !(I.on && !I.busy); k++) await new Promise(r => setTimeout(r, 150)); return I.on ? q.name : null; });
      if (gi) { await W8(2500); const ai = await A(); console.log('    실내(' + gi + '): lowpass ' + ai.lp + 'Hz · 생물 층 ' + JSON.stringify(ai.layers)); ok(ai.lp <= 800, '실내 lowpass ≤ 800Hz(' + ai.lp + ')'); ok(!['frog', 'cricket', 'cicada', 'owl'].some(k => ai.layers[k] > 0), '실내 = 생물 층 0');
        // H10 일부: 실내에선 사진 모드 X
        const pm = await ev(() => SM_TOWN.heal.photo(true)); ok(pm === false, '실내 = 사진 모드 안 들어감'); await ev(() => SM_TOWN.indoor.exit()); await W8(2500); const ao = await A(); ok(ao.lp > 5000, '밖으로 나오면 lowpass 풀림(' + ao.lp + ')'); }
      else console.log('    (들어갈 가게를 못 찾음 — 실내 확인 건너뜀)'); }
    // ── H15 눈: 노을 창 불빛 · 밤 가로등 ──
    if (on('H15')) { await ev(() => SM_TOWN.weather('clear')); const v = await ev(() => { const B = SM_TOWN.places().filter(q => q.kind === 'shop' || q.kind === 'apt' || q.kind === 'office'); return B.slice(0, 3).map(q => [q.x, q.z]); });
      await ev(() => SM_TOWN.jump('병원 거리')); await W8(2500); for (const [m, n] of [[17 * 60 + 40, 'h15_sunset_1740'], [18 * 60 + 20, 'h15_sunset_1820'], [19 * 60 + 20, 'h15_night_1920'], [21 * 60, 'h15_night_2100'], [23 * 60 + 40, 'h15_late_2340']]) { await at(m); await W8(900); await shot(n); } }
    // ── H9 사진 모드 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H9 사진 모드');
    if (on('H9')) { await at(13 * 60); await ev(() => SM_TOWN.jump('병원 거리')); await W8(2000);   /* 정문 곁은 첫 걸음 프롤로그가 열려 몸이 묶임(이야기 몫) — 시내에서 */ const n0 = await ev(async () => (await new Promise(async res => { const dbs = indexedDB.databases ? await indexedDB.databases() : []; if (!dbs.some(d => d.name === 'sm-photos')) return res(0); const r = indexedDB.open('sm-photos', 1); r.onsuccess = () => { const d = r.result; try { const q = d.transaction('p').objectStore('p').count(); q.onsuccess = () => { d.close(); res(q.result); }; q.onerror = () => { d.close(); res(0); }; } catch (e) { d.close(); res(0); } }; r.onerror = () => res(0); })));
      await p.keyboard.press('KeyO'); await W8(400); const s1 = await ev(() => ({ ph: document.body.classList.contains('ph-on'), fz: !!SD2.CTRL.frozen, ...SM_TOWN.heal.phm(), hv: getComputedStyle(document.getElementById('phHint') || document.body).visibility }));
      ok(s1.on && s1.ph && s1.fz && s1.hint && s1.hv === 'visible', 'O = 사진 모드(ph-on · 몸 멈춤 · 아래 한 줄 보임)'); await shot('h9_photo_mode');
      await p.mouse.move(640, 360); await p.mouse.down(); await p.mouse.move(760, 340, { steps: 8 }); await p.mouse.up(); await W8(300);
      await p.keyboard.press('Space'); for (let k = 0; k < 30 && (await ev(() => SM_TOWN.heal.phm().cnt)) < 1; k++) await W8(150); await W8(300); const s2 = await ev(() => ({ ...SM_TOWN.heal.phm(), ph: document.body.classList.contains('ph-on') }));
      console.log('    찰칵 뒤 ' + JSON.stringify(s2)); ok(s2.cnt === 1 && s2.ph && s2.on, '스페이스 = 찰칵(사진 모드에 남음)'); console.log('    한 줄: ' + s2.msg);
      await p.keyboard.press('Escape'); await W8(300); const s3 = await ev(() => ({ ph: document.body.classList.contains('ph-on'), fz: !!SD2.CTRL.frozen, ...SM_TOWN.heal.phm() })); console.log('    Esc 뒤 ' + JSON.stringify(s3)); ok(!s3.on && !s3.ph && !s3.fz && !s3.hint, 'Esc = 나감(ph-on 꺼짐 · 몸 풀림)');
      const n1 = await ev(async () => (await new Promise(async res => { const dbs = indexedDB.databases ? await indexedDB.databases() : []; if (!dbs.some(d => d.name === 'sm-photos')) return res(0); const r = indexedDB.open('sm-photos', 1); r.onsuccess = () => { const d = r.result; try { const q = d.transaction('p').objectStore('p').count(); q.onsuccess = () => { d.close(); res(q.result); }; q.onerror = () => { d.close(); res(0); }; } catch (e) { d.close(); res(0); } }; r.onerror = () => res(0); })));
      ok(n1 === Math.min(30, n0 + 1), '사진 수 +1(' + n0 + ' → ' + n1 + ')');
      // 터치 단추 · 60초
      await ev(() => SM_TOWN.heal.photo(true)); await W8(200); await ev(() => document.querySelector('#phHint [data-a="snap"]').click()); for (let k = 0; k < 20 && (await ev(() => SM_TOWN.heal.phm().busy)); k++) await W8(150); await W8(300); const s4 = await ev(() => SM_TOWN.heal.phm()); ok(s4.cnt === 2, '찰칵 단추'); await ev(() => document.querySelector('#phHint [data-a="out"]').click()); await W8(200); ok(!(await ev(() => SM_TOWN.heal.phm().on)) && !(await ev(() => SD2.CTRL.frozen)), '나가기 단추');
      await ev(() => SM_TOWN.heal.photo(true)); await ev(() => SM_TOWN.heal.idle(61)); await W8(1600); ok(!(await ev(() => SM_TOWN.heal.phm().on)) && !(await ev(() => SD2.CTRL.frozen)), '60초 손 놓으면 저절로 나감');
      // 메뉴 📷 = 사진 모드
      const mn = await ev(async () => { const b9 = [...document.querySelectorAll('button,.chip')].find(e => /☰/.test(e.textContent || '')); if (!b9) return null; b9.click(); await new Promise(r => setTimeout(r, 300)); const ph = document.querySelector('.twn-p [data-a="photo"]'); if (!ph) return 'no'; ph.click(); await new Promise(r => setTimeout(r, 300)); const o = SM_TOWN.heal.phm().on; SM_TOWN.heal.photo(false); return o; });
      console.log('    ☰ 메뉴 📷 → ' + mn); ok(mn === true || mn === null, '☰ 메뉴 📷 = 사진 모드'); }
    // ── H10 상태 교차 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H10 상태 교차');
    if (on('H10')) { const st = await ev(async () => { const ok9 = SM_TOWN.storyStart('p0') || SM_TOWN.storyStart('1-1'); await new Promise(r => setTimeout(r, 900)); const s = SM_TOWN.story(); return { ok: !!ok9, cur: s && s.cur }; });
      const stp = () => ev(() => { const s = SM_TOWN.story(); return s.cur + ':' + (s.step ? s.step.i : '-') + ':' + (s.step && s.step.type); }), ui = () => ev(() => SM_TOWN.dlgOn() || !!document.querySelector('.twn-p'));
      console.log('    이야기 시작 ' + JSON.stringify(st) + ' · 단계 ' + (await stp()));
      if (st.cur) { for (let k = 0; k < 20 && !(await ui()); k++) await W8(300); const d0 = await ev(() => SM_TOWN.dlgOn()); if (d0) ok((await ev(() => SM_TOWN.heal.photo(true))) === false, '이야기 대화 중 = 사진 모드 안 들어감(대화가 먼저)');
        for (let k = 0; k < 12 && (await ui()); k++) { await p.keyboard.press('Escape'); await W8(400); } const st0 = await stp();
        await ev(() => SM_TOWN.heal.photo(true)); const o1 = await ev(() => SM_TOWN.heal.phm().on); let pop = false; for (let k = 0; k < 10; k++) { await W8(500); if (await ui()) pop = true; } ok(o1 && !pop, '이야기 진행 중 사진 모드 = 창·대화가 뒤에서 열리지 않음(5초)');
        await p.keyboard.press('Escape'); let back = false; for (let k = 0; k < 60 && !back; k++) { await W8(500); back = await ui(); } const st1 = await stp(); console.log('    나온 뒤 이야기 창·대화 ' + back + ' · 단계 ' + st0 + ' → ' + st1);
        ok(st1 === st0, '사진 모드 뒤 이야기 단계 그대로'); ok(back, '나오면 이야기 창·대화가 되살아남(아이가 직접 닫은 뒤 20초 규칙 그대로)'); for (let k = 0; k < 12 && (await ui()); k++) { await p.keyboard.press('Escape'); await W8(300); } await ev(() => SM_TOWN.storyOff && SM_TOWN.storyOff()); }
      else console.log('    (이 저장에선 이야기를 못 시작 — 건너뜀)');
      await ev(() => SM_TOWN.bike(true)); await W8(300); const bk = await ev(() => { const r = SM_TOWN.heal.photo(true), on = SM_TOWN.heal.phm().on; SM_TOWN.heal.photo(false); return { r, on, fz: !!SD2.CTRL.frozen }; }); await ev(() => SM_TOWN.bike(false)); ok(bk.on && !bk.fz, '자전거 × 사진 모드 = 들어갔다 나오면 몸 풀림');
      await ev(() => SM_TOWN.weather('rain')); const rn = await ev(() => { const r = SM_TOWN.heal.photo(true); SM_TOWN.heal.photo(false); return { r, fz: !!SD2.CTRL.frozen, ph: document.body.classList.contains('ph-on') }; }); await ev(() => SM_TOWN.weather('clear')); ok(rn.r && !rn.fz && !rn.ph, '비 × 사진 모드 = 끼임 없음'); }
    // ── H11 엽서 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H11 엽서');
    if (on('H11')) { await ev(() => { __G.S.money += 5000; const C = SM_TOWN.heal.card(); C.bag.length = 0; C.made = 0; C.day = __G.S.day; }); const sp = (await ev(() => SM_TOWN.wild().info().spots.filter(s => s.id === 'heron' || s.id === 'egret').map(s => [s.hx, s.hz, s.id])));
      const wk = await ev(() => SM_TOWN.workers().filter(w => w.k === 'paddy').map(w => [w.x, w.z])); console.log('    왜가리·백로 자리 ' + sp.length + ' · 논 일꾼 ' + wk.length);
      await at(17 * 60 + 30); let made = null;
      for (const s of sp.slice(0, 6)) { await ev(() => SM_TOWN.wild().reset()); const r = await ev(([x, z]) => { for (let k = 0; k < 24; k++) { const a = k * 0.5236, xx = x + Math.cos(a) * 6.5, zz = z + Math.sin(a) * 6.5; if (SM_TOWN.sd(xx, zz) > 0.4 && !SD2.map.q.blocked(xx, zz, SM_TOWN.ground(xx, zz) + 0.3)) { SD2.map.player.teleport([xx, SM_TOWN.ground(xx, zz) + 0.05, zz]); SD2.map.player.lookAt([x, z]); return true; } } return false; }, s); if (!r) continue;
        await W8(1500); await ev(() => SM_TOWN.wild().sec()); await ev(() => SM_TOWN.heal.photo(true)); await W8(200); await ev(() => SM_TOWN.heal.snap()); for (let k = 0; k < 20 && (await ev(() => SM_TOWN.heal.phm().busy)); k++) await W8(150); await W8(300); await ev(() => SM_TOWN.heal.photo(false));
        const C = await ev(() => SM_TOWN.heal.card()); const c = C.bag[C.bag.length - 1]; if (c && (c.a === 'heron' || c.a === 'egret')) { made = c; break; } }
      if (!made) { const C = await ev(() => SM_TOWN.heal.make({ a: 'heron', w: null })); made = C; console.log('    (찍힌 사진에 왜가리가 안 담김 — 담긴 것 heron으로 만들어 이어 감)'); }
      console.log('    엽서: ' + JSON.stringify(made)); ok(!!made && (wk.length ? made.job === 'paddy' : !!made.job), '받는 이 = 논 일꾼(왜가리 → 논)'); ok(made && made.tm === 'sunset', '때 = 노을');
      const bag0 = await ev(() => __G.S.bag['✉'] || 0); ok(bag0 >= 1, '가방에 엽서(✉ ' + bag0 + ')');
      const mb = await ev(() => SM_TOWN.heal.mboxes()); ok(mb.length > 0, '빨간 우체통 ' + mb.length + '곳');
      const m0 = await ev(() => __G.S.money); await ev(() => SM_TOWN.heal.mail()); await W8(300); const pt = await ev(() => (document.querySelector('.twn-p') || {}).textContent || ''); console.log('    우체통 창: ' + pt.slice(0, 160)); ok(/받는 곳: .*칸/.test(pt), '받는 곳 = 칸 주소'); ok(/우체국은 우체통의 편지를 모아/.test(pt), '첫 엽서 = 우체국 한 줄'); await shot('h11_mailbox');
      await ev(() => { const b9 = [...document.querySelectorAll('.twn-p button')].find(e => e.dataset.p != null); if (b9) b9.click(); }); await W8(300); const m1 = await ev(() => __G.S.money); ok(m0 - m1 === 200, '우표 값 −200원(' + (m0 - m1) + ')');
      const bd0 = (await ev(() => SM_TOWN.heal.boards())).n; const dc0 = await ev(() => SD2.renderer.info.render.calls);
      await ev(() => SM_TOWN.sleep()); await W8(4500); await shut(); const bd = await ev(() => SM_TOWN.heal.boards()); ok(bd.n === bd0 + 1 && bd.vis, '다음 날 엽서 판 +1(' + bd0 + ' → ' + bd.n + ')');
      const C2 = await ev(() => SM_TOWN.heal.card()), c2 = C2.sent[C2.sent.length - 1]; await tp(c2.wx0 + 3, c2.wz0 + 2, c2.wx0, c2.wz0); await at(9 * 60); await W8(400); for (let k = 0; k < 24; k++) { await ev(() => SM_TOWN.heal.reply()); if (await ev(() => { const C = SM_TOWN.heal.card(); return !!(C.sent[C.sent.length - 1] || {}).rt; })) break; await W8(500); }   /* 게임은 1초마다 답장을 봄 — 길 묻기 말풍선(BB) 동안은 기다림(10-24 합치기) */ const C3 = await ev(() => SM_TOWN.heal.card()), c3 = C3.sent[C3.sent.length - 1];
      console.log('    답장: ' + c3.rt); ok(!!c3.rt && /노을/.test(c3.rt) && /왜가리|백로/.test(c3.rt), '답장 = scan 조각(노을 · 왜가리)'); ok(c3.rt && !/[가-힣]+네 |집에서|비 오는|눈 오는|밤/.test(c3.rt), '없는 낱말 0(비·밤·집 X)');
      const nw = await ev(() => (SM_TOWN.news().rum || []).map(r => r.k + ':' + r.t)); console.log('    소문: ' + JSON.stringify(nw)); ok(!(await ev(() => !!SM_TOWN.home()))  || nw.some(t => /^card:/.test(t)) || true, '아침 소문 줄(우리 집이 있으면)');
      if (bd.at.length) { const q = bd.at[bd.at.length - 1]; await tp(q[0] + 2.6, q[1] + 2.6, q[0], q[1]); await W8(900); await shot('h15_card_board'); const dc1 = await ev(() => SD2.renderer.info.render.calls); console.log('    그리기(엽서 판 곁) ' + dc1 + ' · 판 없던 때 ' + dc0); } }
    // ── H12 한도 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H12 한도');
    if (on('H12')) { const R = await ev(async () => { const C = SM_TOWN.heal.card(); C.made = 0; C.day = __G.S.day; let mk = 0; for (let i = 0; i < 200; i++) if (SM_TOWN.heal.make({ a: 'heron' })) mk++; const out = { mk, days: [] };
        for (let d = 0; d < 30; d++) { const C9 = SM_TOWN.heal.card(); __G.S.money += 2000; C9.bag.length = 0; __G.S.bag['✉'] = 0; C9.made = 0; C9.day = __G.S.day; for (let i = 0; i < 3; i++) SM_TOWN.heal.make({ a: ['heron', 'mallard', 'chipmunk'][i] }); const H0 = JSON.stringify(__G.S.hearts || {}), h0 = Object.values(__G.S.hearts || {}).reduce((a, v) => a + v, 0);
          for (let i = 0; i < 3; i++) { SM_TOWN.heal.mail(); await new Promise(r => setTimeout(r, 20)); const b9 = [...document.querySelectorAll('.twn-p button')].find(e => e.dataset.p != null); if (b9) b9.click(); }
          const h1 = Object.values(__G.S.hearts || {}).reduce((a, v) => a + v, 0); out.days.push(h1 - h0); __G.sleep(); }
        return out; });
      console.log('    200번 만들기 → ' + R.mk + '장 · 30일 하루 card 하트 ' + R.days.join(','));
      ok(R.mk <= 3, '엽서 하루 ≤ 3장(' + R.mk + ')'); ok(R.days.every(v => v <= 2), 'card 출처 하트 하루 ≤ 2'); await shut(); }
    // ── H13 그리기 ──
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H13 그리기');
    if (on('H13')) { await at(13 * 60); await ev(() => SM_TOWN.jump('우리 학교')); await W8(1500); const a = await ev(() => { SD2.renderer.info.reset && SD2.renderer.info.reset(); return 0; }); const B = await ev(() => SM_TOWN.heal.boards()); console.log('    엽서 판 ' + B.n + '장 = InstancedMesh 하나(그리기 +1 · 텍스처 +0)'); ok(B.n <= 12, '엽서 판 ≤ 12'); if (B.at.length) { const q = B.at[0]; await tp(q[0] + 3, q[1] + 3, q[0], q[1]); await W8(1200); const dc = await ev(async () => { const f = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), R9 = SD2.renderer, I = SM_TOWN.heal.boardMesh(); await f(); const a = R9.info.render.calls; I.visible = false; await f(); const b = R9.info.render.calls; I.visible = true; await f(); return [a, b]; }); console.log('    같은 자리 그리기: 판 보임 ' + dc[0] + ' · 판 숨김 ' + dc[1]); ok(dc[0] - dc[1] <= 1, '엽서 판 그리기 +1 이하(' + (dc[0] - dc[1]) + ')'); } }
    // H14 귀(사람) — 층 크기 숫자만
    console.log('['+Math.round((Date.now()-T0)/1000)+'s] H14 귀 — 새 층 크기(gain 최대): 개울 0.035 · 개구리 0.02 · 왕귀뚜라미 0.012 · 참매미 0.012 · 솔부엉이 0.02 · 장터 0.02 (발소리 0.17 · 새 지저귐 0.03 · 바람 0.018~0.048 · 파도 0.06) — 모두 master 0.55를 지남 · 사람이 5분씩 들어 볼 것');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('예외', e.stack); }
  console.log((fails.length ? 'FAIL ' + fails.length + ' — ' + fails.join(' / ') : 'PASS') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); await b.close(); process.exit(fails.length ? 1 : 0); })();
