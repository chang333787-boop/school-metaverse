// 💧 비·가뭄이 물에 보이게 시험(WATER-1 · town_routine.js waterOf · town_look.js wlv): node tools/harness/town_water.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--perf]
//   그리기 켬(셰이더가 실제로 엮이는지 봐야 함) · 브라우저 하나
//   ① 보통 날 물 높이 0 → 비 사흘 → 다음 날 +1(물낯 +0.14m · 흙탕) · 어제 비 = 웅덩이 남음 → 비 없는 날 닷새 → −1(−0.24m · 자갈 띠) → 비 하루 + 맑음 하루 → 다시 0(되돌아옴)
//   ② 셰이더 값(uWlv_a·uPud_a)이 그날 값과 같음 · 물에 뜨는 것 높이(dy)가 같이 · 밤 0~5시에 날이 바뀌어도 아침까지 어제 물 그대로
//   ③ 강·연못 재질 프로그램에 물 높이 조각(wlv1)이 엮임 · 셰이더 오류 0 · 페이지 오류 0
//   LQ=1 = lite 판(?lq=1)으로 같은 시험
//   --shots = 같은 자리 세 장(보통 · 비 사흘 뒤 · 가뭄 닷새 뒤) × 강가·논·보도 · --perf = 가뭄 날 같은 자리 그리기 수·프레임(CPU 4×) 켠 판 ↔ 끈 판(?artoff=wlv)
const { chromium } = require('playwright');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SH = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8), PERF = process.argv.includes('--perf');
if (SH) require('fs').mkdirSync(SH, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
async function open(b, q, errs) { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if (/Shader Error|ERROR: 0:|VALIDATE_STATUS/.test(t) || (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 300)); });
  await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&dpr=1&all=1' + (process.env.LQ === '1' ? '&lq=1' : '') + q);   /* LQ=1 = 휴대폰·크롬북 lite 판(셰이더 lite 갈래) */ await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.routine && SM_TOWN.routine() && SM_TOWN.water, null, { timeout: 240000 }); await p.waitForTimeout(2500); return p; }
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { let p = await open(b, '', errs);
    const mk = p9 => { const ev = (f, a) => p9.evaluate(f, a), W8 = ms => p9.waitForTimeout(ms);
      const shut = async () => { for (let i = 0; i < 6; i++) { const any = await ev(() => { const P = document.querySelector('.twn-play .x, .twn-play [data-a="x"]'); if (P) { P.click(); return 1; } const Q = document.querySelector('.twn-p [data-a="x"]'); if (Q) { Q.click(); return 1; } const K = [...document.querySelectorAll('button')].find(b9 => b9.offsetParent && /^(그대로|Keep)$/.test(b9.textContent.trim())); if (K) { K.click(); return 1; } return document.querySelector('.twn-p,.twn-play,.twn-dlg') ? 2 : 0; }); if (!any) break; if (any === 2) await p9.keyboard.press('Escape'); await W8(250); } };
      const at = async m => { await ev(m9 => { const G = SM_TOWN.game(); G.S.clock = false; G.S.min = m9; G.mark(); }, m); await W8(1600); };
      const day = async w => { await ev(w9 => SM_TOWN.rules.wx(w9), w); await W8(1300); await ev(() => SM_TOWN.game().sleep()); await W8(1800); await shut(); await at(11 * 60); };
      const WT = () => ev(() => SM_TOWN.water());
      return { ev, W8, shut, at, day, WT }; };
    let H = mk(p); await H.shut(); await H.ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); SM_TOWN.rules.season('summer'); if (SM_TOWN.case && SM_TOWN.case()) SM_TOWN.case().dbg.off(true); }); await H.W8(8000);   /* CASE-1 흐려진 강(비 사흘 뒤 흙탕을 붙듦)은 끄고 물 높이 셈만 */
    // 같은 자리 셋(강가 · 논 · 보도) — 자료에서 찾음
    const V = await H.ev(() => { const out = {}, T = SM_TOWN, sd = (x, z) => T.sd(x, z);
      { const P = (T.places ? T.places() : []).filter(q => q.kind === 'water'); P.forEach((q, i9) => { let best = null; for (let a = 0; a < 24 && !best; a++) for (let r = 8; r < 90 && !best; r += 4) { const x = q.x + Math.cos(a * 0.2618) * r, z = q.z + Math.sin(a * 0.2618) * r; if (sd(x, z) > -3) continue;   /* 물 안 한 점 → 바깥으로 나가며 물가(석축)와 둔치 자리 */
            const ux = Math.cos(a * 0.2618), uz = Math.sin(a * 0.2618); let e = null; for (let t = 0; t < 60; t += 0.5) { const s9 = sd(x + ux * t, z + uz * t); if (s9 > 6) { e = [x + ux * t, z + uz * t]; break; } } if (e) best = { cx: e[0], cz: e[1], tx: e[0] - ux * 13, tz: e[1] - uz * 13, h: 2.4, name: q.name }; } if (best && i9 < 2) out['water' + i9] = best; }); }
      if (T.toWorld) { const c = T.toWorld(225, 37.5); let e = null; for (let t = 0; t < 60; t += 0.5) if (sd(c[0], c[1] + t) > 6) { e = [c[0], c[1] + t]; break; } if (e) out.river = { cx: e[0], cz: e[1] + 2, tx: c[0] + 4, tz: c[1] - 4, h: 3.4, name: '강(곧은 곳)' }; }   /* ourtown 강 곧은 토막(판 212~237, 37.5) */
      { const F = T.wild && T.wild().fcSpots ? T.wild().fcSpots() : []; const R = F[0] || (T.places ? T.places() : []).find(q => q.kind === 'rice'); if (R) out.paddy = { cx: R.x - 7, cz: R.z - 5, tx: R.x + 3, tz: R.z + 2, h: 2.0, name: '논' }; }   /* 논 한가운데(왜가리 자리) */
      out.pave = { cx: 61 - 0 * 5, cz: 63.4 - 5, tx: 61, tz: 63.4 + 4, h: 1.9 };   /* ART-3 c 견본 paveA(학교 앞 보도) */
      return out; });
    console.log('자리 ' + JSON.stringify(V));
    const shot = async (tag) => { if (!SH) return; await H.ev(() => SM_TOWN.rules.season('summer')); await H.W8(6000); await H.shut();   /* 날이 지나며 계절이 바뀌어도 같은 여름으로 견줌 */ for (const [n, v] of Object.entries(V)) { if (!v) continue; await aim(p, v); await H.W8(2600); await p.screenshot({ path: SH + '/' + n + '_' + tag + '.png' }); console.log('  📷 ' + n + '_' + tag); } };
    const aim = (pg, v) => pg.evaluate(v9 => { const M = SD2.map, gy = (x, z) => M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 3); M.player.teleport([v9.tx, SM_TOWN.ground(v9.tx, v9.tz) + 0.25, v9.tz]);
      const R = SD2.renderer; if (!window.__O) window.__O = R.render.bind(R); const o = window.__O; R.render = (s, c) => { c.position.set(v9.cx, gy(v9.cx, v9.cz) + v9.h, v9.cz); c.lookAt(v9.tx, gy(v9.tx, v9.tz) - 0.3, v9.tz); c.updateMatrixWorld(); o(s, c); }; }, v);
    const FR = pg => pg.evaluate(() => new Promise(res => { const T = []; let l = performance.now(), c = 0; const f = () => { const n = performance.now(); T.push(n - l); l = n; c += SD2.renderer.info.render.calls; if (T.length < 120) requestAnimationFrame(f); else { T.shift(); T.sort((a, b) => a - b); res({ p50: +T[60].toFixed(1), p95: +T[Math.floor(T.length * 0.95)].toFixed(1), calls: Math.round(c / 120) }); } }; requestAnimationFrame(f); }));
    const perf = async pg => { const out = {}, cdp = await pg.context().newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      for (const [n, v] of Object.entries(V)) { if (!v) continue; await aim(pg, v); await pg.waitForTimeout(3000); out[n] = await FR(pg); } await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); return out; };
    // ── ① 날씨 날짜를 돌려 물 높이가 바뀌고 되돌아오는지 ──
    console.log('① 물 높이 · 날씨 날짜 돌리기');
    await H.at(11 * 60); await H.ev(() => SM_TOWN.rules.wx('clear')); await H.W8(1600);
    let W0 = await H.WT(); console.log('  보통 날 ' + JSON.stringify(W0)); ok(W0.lv === 0 && W0.set && W0.set.lv === 0, '보통 날 물 높이 0 (lv ' + W0.lv + ' · 셰이더 ' + (W0.set && W0.set.lv) + ')');
    await shot('0normal');
    const W00 = await H.WT();
    for (let i = 0; i < 3; i++) await H.day('rain');
    await H.ev(() => SM_TOWN.rules.wx('clear')); await H.W8(45000);   /* 비 그친 낮(젖은 바닥 uRain이 마를 때까지) — 물 높이·웅덩이는 그날 값 그대로 */
    const W1 = await H.WT(); console.log('  비 사흘 뒤 ' + JSON.stringify(W1));
    ok(W1.lv === 1 && W1.set.lv === 1, '비 사흘 → 다음 날 물 높이 +1 (lv ' + W1.lv + ' · 셰이더 ' + W1.set.lv + ')');
    ok(Math.abs(W1.dy - 0.14) < 1e-6, '물에 뜨는 것 높이 +0.14m (' + W1.dy + ')');
    ok(W1.pud === 1 && W1.set.pud === 1, '어제 비 → 웅덩이가 하루 더 남음 (pud ' + W1.pud + ')');
    { const R = await H.ev(() => SM_TOWN.routine().info().chain); ok(R.k === 'wet', '먹이·물 연쇄도 비 갈래 (' + R.k + ')'); }
    await shot('1rain3');
    for (let i = 0; i < 5; i++) await H.day('clear');
    const W2 = await H.WT(); console.log('  비 없는 닷새 뒤 ' + JSON.stringify(W2));
    ok(W2.lv === -1 && W2.set.lv === -1, '비 없는 날 닷새 → 물 높이 −1 (lv ' + W2.lv + ' · 셰이더 ' + W2.set.lv + ')');
    ok(Math.abs(W2.dy + 0.24) < 1e-6 && W2.pud === 0 && W2.set.pud === 0, '물에 뜨는 것 −0.24m · 웅덩이 없음 (dy ' + W2.dy + ' · pud ' + W2.pud + ')');
    await shot('2dry5');
    let PF1 = null; if (PERF) PF1 = await perf(p);
    // 밤 0~5시에 날이 바뀌어도 아침까지 어제 물 그대로
    { const k0 = (await H.WT()).k; await H.ev(() => { const S = SM_TOWN.game().S; SM_TOWN.rules.wx('rain'); S.min = 23 * 60 + 58; }); await H.W8(1300);
      await H.ev(() => { const S = SM_TOWN.game().S; S.day += 1; S.min = 2 * 60; SM_TOWN.game().mark(); }); await H.W8(1700); const kA = (await H.WT()).k;
      await H.ev(() => { SM_TOWN.game().S.min = 6 * 60; }); await H.W8(1700); const WB = await H.WT();
      ok(kA === k0 && WB.k !== k0 && Math.abs(WB.lv - 0.333) < 1e-6 && WB.pud === 1, '새벽 2시 = 어제 물 그대로(' + kA + ') → 아침 6시 = 새 물(' + WB.k + ')'); }
    for (const w of ['clear']) await H.day(w);
    const W3 = await H.WT(); console.log('  비 하루 + 맑음 하루 뒤 ' + JSON.stringify(W3)); ok(W3.lv === 0 && W3.set.lv === 0 && W3.set.pud === 0 && Math.abs(W3.dy) < 1e-9, '되돌아옴: 물 높이 0 · 웅덩이 없음 · dy 0');
    // ── ③ 셰이더 ──
    const prog = await H.ev(() => { const P = SD2.renderer.info.programs || []; return { n: P.length, wlv: P.filter(q => String(q.cacheKey).includes('wlv1')).length }; });
    ok(prog.wlv >= 1, '물 높이 조각이 엮인 프로그램 ' + prog.wlv + '개 (전체 ' + prog.n + ')');
    { const t = await H.ev(() => { const t0 = performance.now(); for (let i = 0; i < 200; i++) SM_TOWN.water(); return (performance.now() - t0) / 200; }); ok(t < 0.2, '그날 물 높이 셈 한 번 ' + t.toFixed(4) + 'ms (1초 칸)'); }
    if (PERF) { const p2 = await open(b, '&artoff=wlv', errs), H2 = mk(p2); await H2.shut(); await H2.ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); SM_TOWN.rules.season('summer'); }); await H2.W8(8000);
      for (let i = 0; i < 5; i++) await H2.day('clear'); const PF0 = await perf(p2);
      console.log('  성능(가뭄 날 · CPU 4×) 끈 판 ' + JSON.stringify(PF0) + '\n  성능(가뭄 날 · CPU 4×) 켠 판 ' + JSON.stringify(PF1));
      for (const n of Object.keys(PF0)) ok(PF1[n] && PF1[n].calls <= PF0[n].calls + 1, n + ' 그리기 수 ' + PF0[n].calls + ' → ' + PF1[n].calls); }
    ok(!errs.length, '페이지·셰이더 오류 0 ' + errs.slice(0, 3).join(' | '));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } await b.close(); console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
