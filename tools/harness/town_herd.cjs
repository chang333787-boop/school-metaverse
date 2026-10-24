// 양몰이 시험(HERD-1 · 설계 docs/systems/town_jobs2.md「짓는 조각 2」): node tools/harness/town_herd.cjs [마을=ourtown] [포트=8002] [--n=맑음판수,비판수] [--shots=폴더]
//   봇 = 사람처럼 '걸어서' 몬다(map.player.steer 4.2m/s · 뛰기 X · 순간이동 X): 문에서 가장 먼 양과 그 곁(3.5m) = 이번 무리 → 무리 뒤(문 반대쪽)에 서서 문 쪽으로 걸어 밂 · 무리를 가로지르지 않고 둘레로 돎 · 우리 옆이면 모서리 밖으로 먼저
//   확인: 1단계(꼬임 1) 60초 안 성공 ≥ 90%(맑음·비) · 양이 차도에 0 · 오류 0 · 판 뒤 문 닫힘·우리 안 양 충돌 · 비 = 처마 밑에서 시작 · 첫 양 반응 10초 안 · (덤) 2단계 개 판 한 번 · 아이 눈 캡처
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */ const fs = require('fs'), path = require('path');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const NN = (arg('n') || '6,5').split(',').map(Number), SHOTS = arg('shots'), PERF = process.argv.includes('--perf');   /* --perf = 크롬북 CPU 4배 느리게: 목장 곁 판 없음 ↔ 판 하는 중(봇) 프레임 p95·그리기 수 견줌(판만 · 다른 시험 건너뜀) */
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [], fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
  try { const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), shot = async nm => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, nm + '.png') }); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.herd && SM_TOWN.game, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(600);
    await ev(() => { const S = SM_TOWN.game().S; S.min = 11 * 60; SM_TOWN.game().setClock(false); if (S.story) S.story.cur = null; SM_TOWN.storyOff && SM_TOWN.storyOff(); S.herd = { v: 1, lv: 1, good: 0, n: 5, pen: 0, rib: 0, best: 0 }; SM_TOWN.weather('clear'); });   /* n=5: 처음 세 판 조건 끔을 지나 비 조건이 켜지게 */
    if (PERF) { const cdp = await p.context().newCDPSession(p); const meas = async ms => ev(async ms => { const R9 = SD2.renderer, T = [], C = []; let last = performance.now(); const t0 = last; await new Promise(res => { const f = () => { const n = performance.now(); T.push(n - last); last = n; C.push(R9 ? R9.info.render.calls : 0); if (n - t0 < ms) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }); T.sort((a, b) => a - b); return { p50: +T[T.length >> 1].toFixed(1), p95: +T[Math.floor(T.length * 0.95)].toFixed(1), max: +T[T.length - 1].toFixed(1), n: T.length, calls: Math.round(C.reduce((a, b) => a + b, 0) / C.length) }; }, ms);
      await ev(() => { SM_TOWN.herdGo(1, ''); SM_TOWN.herd().stop('reset'); }); await W8(4000); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await W8(2500); const off = await meas(9000);
      await ev(() => { SM_TOWN.herdGo(1, ''); }); await W8(1200); const on1 = await meas(9000); await ev(() => { SM_TOWN.herd().stop('reset'); SM_TOWN.game().S.herd.lv = 2; SM_TOWN.herdGo(2, ''); SM_TOWN.herd().whistle(); }); await W8(1200); const on2 = await meas(9000);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); console.log(JSON.stringify({ cpu4: { off, on1, on2 } })); ok(on1.p95 - off.p95 <= 1.0 && on2.p95 - off.p95 <= 1.0, '크롬북 4× p95 +1ms 이하 (판 없음 ' + off.p95 + ' → 판 ' + on1.p95 + ' · 개 판 ' + on2.p95 + 'ms)'); ok(on2.calls - off.calls <= 2, '그리기 판 없음 ' + off.calls + ' → 개 판 ' + on2.calls); ok(!errs.length, '오류 0 ' + errs.slice(0, 3).join(' | ')); throw { done: 1 }; }
    const I0 = await ev(() => SM_TOWN.herd().info()); ok(!!I0 && I0.sh.length >= 3, '목장·양 있음 ' + (I0 ? I0.sh.length + '마리 · 우리 ' + JSON.stringify(I0.G) : '없음'));
    if (!I0) throw new Error('목장 없음');
    // 페이지 안 봇(100ms마다) — tools/harness와 scratchpad/herd_tune.mjs가 같은 글
    await ev(() => { window.__HB = { inPen: (G, a, b, m = 0) => a > G.pa0 + m && a < G.pa1 - m && b < G.pb1 - m,
      bot0(I) { const G = I.G, gc = (G.ga0 + G.ga1) / 2, oa = gc, ob = G.pb1 + 1.2, out = I.sh.filter(q => !this.inPen(G, q.a, q.b, 0.2)), P = { a: I.me[0], b: I.me[1] }, GR = 3.5;
        if (!out.length) return [gc - P.a, G.pb1 + 4.5 - P.b]; let k = out[0], kd = -1; for (const q of out) { const d = Math.hypot(q.a - oa, q.b - ob); if (d > kd) { kd = d; k = q; } }
        let ca = 0, cb = 0, cn = 0, sp = 0; for (const q of out) if (Math.hypot(q.a - k.a, q.b - k.b) < GR) { ca += q.a; cb += q.b; cn++; } ca /= cn; cb /= cn; for (const q of out) if (Math.hypot(q.a - k.a, q.b - k.b) < GR) sp = Math.max(sp, Math.hypot(q.a - ca, q.b - cb));
        let ga = oa, gb = ob; if (Math.hypot(ca - oa, cb - ob) < 3) { ga = gc; gb = G.pb1 - 3; } else if (cb < G.pb1 + 0.8 && (ca > G.pa1 - 0.5 || ca < G.pa0 + 0.5)) { ga = ca > G.pa1 - 0.5 ? G.pa1 + 1.2 : G.pa0 - 1.2; gb = G.pb1 + 2.2; }
        const rr = Math.max(3.2, sp + 2.2), ua = ca - ga, ub = cb - gb, ul = Math.hypot(ua, ub) || 1, da = ca + ua / ul * rr, db = cb + ub / ul * rr, pa = P.a - ca, pb = P.b - cb, pd = Math.hypot(pa, pb) || 1, side = (pa * ua + pb * ub) / (pd * ul);
        if (Math.hypot(P.a - da, P.b - db) < 1.6 || (side > 0.85 && pd < rr + 1.5)) return [ga - P.a, gb - P.b];
        if (side < 0.3 && pd < rr + 4) { const cr = pa * ub - pb * ua, ta = -pb * Math.sign(cr || 1), tb = pa * Math.sign(cr || 1), tl = Math.hypot(ta, tb) || 1, want = rr + 2.5 - pd; return [ta / tl + pa / pd * want * 0.4, tb / tl + pb / pd * want * 0.4]; }
        return [da - P.a, db - P.b]; },
      bot(I) { const G = I.G, r9 = this.bot0(I), P = { a: I.me[0], b: I.me[1] }, wa = P.a + r9[0], wb = P.b + r9[1], gc = (G.ga0 + G.ga1) / 2;
        if (this.inPen(G, P.a, P.b, -0.2)) { if (P.b > G.pb1 - 1.2 && P.a > G.ga0 - 0.3 && P.a < G.ga1 + 0.3) return [gc - P.a, 3]; return [gc - P.a, G.pb1 - 0.5 - P.b]; }
        if (P.b < G.pb1 + 0.6 && (P.a > G.pa1 - 0.6 || P.a < G.pa0 + 0.6) && wb > G.pb1 - 0.3) { const sd = P.a > G.pa1 - 0.6 ? 1 : -1, ka = sd > 0 ? G.pa1 + 1.6 : G.pa0 - 1.6, kb = G.pb1 + 1.6; if ((wa - (sd > 0 ? G.pa1 : G.pa0)) * sd < 0.8) { if ((P.a - (sd > 0 ? G.pa1 : G.pa0)) * sd < 1.2) return [ka - P.a, Math.max(0.3, kb - P.b) * 0.3]; return [ka - P.a, kb - P.b]; } }
        if (P.a > G.pa0 - 0.6 && P.a < G.pa1 + 0.6 && wb < G.pb1 + 1.3) return [r9[0], Math.max(r9[1], G.pb1 + 1.3 - P.b)];
        return r9; },
      run(whistle) { this.stopRun(); const R = this.R = { t0: performance.now(), road: 0, first: null, s0: null, t: 0, end: false, wh: false, stuck: 0, lp: null }; this.iv = setInterval(() => { const H9 = SM_TOWN.herd(), I = H9.info(); if (!I) return; if (!I.on) { if (!R.end) { R.end = true; SD2.map.player.steer(null); } return; } R.t = I.t; R.road = Math.max(R.road, I.sh.filter(q => q.road).length);
          if (!R.s0) R.s0 = I.sh.map(q => [q.a, q.b]); else if (R.first == null && I.sh.some((q, i) => Math.hypot(q.a - R.s0[i][0], q.b - R.s0[i][1]) > 1)) R.first = I.t;
          if (whistle && !R.wh && I.t > 1.5) { R.wh = true; H9.whistle(); }
          const [ma, mb] = this.bot(I), L = Math.hypot(ma, mb); if (L < 0.05) { SD2.map.player.steer(null); return; } const dx = ma * I.c + mb * I.s, dz = -ma * I.s + mb * I.c; SD2.map.player.steer(dx, dz, Math.min(4.2, Math.max(1.2, L * 3)), true); }, 100); },
      stopRun() { if (this.iv) clearInterval(this.iv); this.iv = null; SD2.map.player.steer(null); } }; });
    async function board(lv, cond, nm) { await ev(() => { SM_TOWN.herd().stop('reset'); const S = SM_TOWN.game().S; S.min = 11 * 60; S.herd.pen = 0; S.uses = {}; }); await W8(300); const e0 = errs.length, R9 = { esc: 0 };
      const st = await ev(([lv, cond]) => SM_TOWN.herdGo(lv, cond), [lv, cond]); if (!st) return { win: false, why: '시작 안 됨' };
      const I1 = await ev(() => SM_TOWN.herd().info()); if (nm) { await W8(900); await shot(nm + '_0start'); }
      await ev(w => __HB.run(w), lv >= 2); let lastShot = 0, R = null;
      for (let k = 0; k < 140; k++) { await W8(500); if (await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); R9.esc++; } R = await ev(() => __HB.R); if (nm && !lastShot && R.t > 14) { lastShot = 1; await shot(nm + '_1mid'); } if (R.end) break; }
      await ev(() => __HB.stopRun()); const I2 = await ev(() => SM_TOWN.herd().info()), win = !!I2.sv.pen; if (nm) { await W8(2600); await shot(nm + '_2end'); }
      await W8(win ? 2600 : 600); const I3 = await ev(() => SM_TOWN.herd().info());
      return { win, why: I2.why, t: R && R.t, first: R && R.first, road: R ? R.road : 0, cond: I1.cond, eave: cond === 'rain' ? I1.amb : '', gate: I3.gate, penCol: win ? I3.sh.filter(q => q.in && q.col).length : null, n: I3.sh.length, errs: errs.length - e0, phi: I3.phi, esc: R9.esc }; }
    // 비 오는 날 판 밖: 양이 걸어서 처마 밑으로(놀이를 안 해도 · 목장 곁에서 봄)
    { await ev(() => { SM_TOWN.herdGo(1, ''); SM_TOWN.herd().stop('quit'); }); await W8(3500); await ev(() => SM_TOWN.weather('rain')); await W8(2600); const a = await ev(() => SM_TOWN.herd().info()); ok(a.amb === 'eave' && a.sh.some(q => q.walk), '비가 오면 판 밖에서도 양이 처마 밑으로 걸어감(' + a.amb + ' · 걷는 양 ' + a.sh.filter(q => q.walk).length + ')');
      if (SHOTS) { await W8(12000); await shot('herd_rain_eaves'); } await ev(() => SM_TOWN.weather('clear')); await W8(2200); const c = await ev(() => SM_TOWN.herd().info()); ok(c.amb === 'home' && c.sh.some(q => q.walk), '개면 제자리로 걸어감(' + c.amb + ')'); }
    const RES = []; for (let i = 0; i < NN[0]; i++) { const r = await board(1, '', i === 0 ? 'herd_clear' : null); RES.push(['맑음', r]); console.log('  · 맑음 ' + (i + 1) + ': ' + JSON.stringify(r)); }
    // 몬 양 = 다음 아침까지 우리 안 → 아침에 걸어 나옴
    { const a0 = await ev(() => SM_TOWN.herd().info()); if (a0.amb === 'pen') { await ev(() => SM_TOWN.sleep()); await W8(5200); const a = await ev(() => SM_TOWN.herd().info()); ok(a.amb !== 'pen' && !a.sv.pen && a.sh.filter(q => q.in && !q.walk).length === 0, '아침이면 문이 열리고 우리 안 양이 걸어 나옴(' + a.amb + ' · 걷는 양 ' + a.sh.filter(q => q.walk).length + ' · 우리 안에 선 양 ' + a.sh.filter(q => q.in && !q.walk).length + ')'); await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); } else ok(false, '마지막 맑음 판 뒤 양이 우리 안이 아님(' + a0.amb + ')'); }
    for (let i = 0; i < NN[1]; i++) { await ev(() => SM_TOWN.weather('rain')); const r = await board(1, 'rain', i === 0 ? 'herd_rain' : null); RES.push(['비', r]); console.log('  · 비 ' + (i + 1) + ': ' + JSON.stringify(r)); } await ev(() => SM_TOWN.weather('clear'));
    const win60 = RES.filter(([, r]) => r.win && r.t <= 60).length, all = RES.length; ok(win60 / all >= 0.9, '1단계 60초 안 성공 ' + win60 + '/' + all + ' (' + Math.round(win60 / all * 100) + '%) · 걸린 초 ' + RES.map(([, r]) => r.win ? Math.round(r.t) : '✗').join(','));
    ok(RES.every(([, r]) => !r.road), '양이 차도에 0 (최대 ' + Math.max(...RES.map(([, r]) => r.road)) + ')');
    ok(RES.filter(([c]) => c === '비').every(([, r]) => r.cond === 'rain' && r.eave === 'eave'), '비 = 처마 밑에서 시작(조건 rain)');
    ok(RES.every(([, r]) => r.first != null && r.first <= 10), '첫 양 반응 10초 안 (' + RES.map(([, r]) => r.first).join(',') + ')');
    ok(RES.filter(([, r]) => r.win).every(([, r]) => r.gate && r.penCol === r.n), '이기면 문 닫힘(막이) · 우리 안 양마다 충돌 다시');
    { const r = await board(2, '', 'herd_dog'); console.log('  · 개(2단계): ' + JSON.stringify(r)); ok(r.n > 0, '2단계 개 판 돌아감(' + (r.win ? Math.round(r.t) + '초' : '실패') + ')'); }
    ok(!errs.length, '오류 0 ' + [...new Set(errs)].slice(0, 4).join(' | '));
    console.log(JSON.stringify({ boards: RES.map(([c, r]) => [c, r.win, r.t && +r.t.toFixed(1)]), sec: Math.round((Date.now() - T0) / 1000) }));
  } catch (e) { if (!e || !e.done) throw e; } finally { await b.close(); }
  console.log(fails.length ? 'FAIL' : 'PASS'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error('하네스 오류', e.message); console.log('FAIL'); process.exit(2); });
