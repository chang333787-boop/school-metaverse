// 보상 하루 한도 시험(REW-1 · 사용자 10-20 '곤충 하나 관찰하니까 관찰 레벨 무한 복사 · 막아야지' · '되풀이 또 요소 없어?' · docs/systems/town_reward_cap.md): node tools/harness/town_cap.cjs [마을=ourtown] [포트=8002]
//   이름을 grep하지 않고 상태(S.bag · money · skill · hearts)의 하루 변화량만 잼 — 새 보상 자리가 생겨도 E 자리·일터·할 일을 그대로 되풀이해 걸림
//   ① E 자리마다(같은 이름은 한 곳) 200번 되풀이 → 9번째 뒤로는 하나도 더 안 생김 ② 일 갈래마다 칸을 돌며 200판 → 받는 판 6판까지
//   ③ 할 일 알림(버스·책·별 등) 200번 → 솜씨가 늘다 멈춤 ④ 잠 → 일 → 잠 30번 → 실제 날짜 총량(게임 하루 몫 × 3) 안
//   ⑤ 평소 하루(봇이 E 자리·일터를 고르게 한 번씩) = 한도를 끈 하루와 견줘 ±15% 안 · 페이지 오류 0
//   브라우저는 brun.sh 한 자리로 돌림(동시에 하나)
const { chromium } = require('playwright');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); if (/REW-1: 꼬리표 없는/.test(t)) console.log('    ⚠ ' + t); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.rules && SM_TOWN.rw && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(800);
    // 잼 틀(페이지 안): 값표는 게임 모듈에서 그대로 읽음(같은 주소 = 같은 모듈)
    await ev(async () => { const M = await import('/v2/games/town_game.js?v=26'), G = SM_TOWN.game(), S = G.S; G.setClock(false); S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear');
      const val = e => { const I = M.ITEMS[e]; return !I ? 100 : I[2] === 'stamp' ? 0 : Math.max(100, I[3] || 0); };
      const snap = () => ({ bag: { ...S.bag }, money: S.money || 0, sk: { ...(S.skill || {}) }, h: { ...(S.hearts || {}) } });
      const diff = (a, z) => { const o = { v: 0, n: 0, money: Math.max(0, z.money - a.money), xp: {}, xpT: 0, h: {}, hMax: 0 }; for (const e of Object.keys(z.bag)) { const d = (z.bag[e] || 0) - (a.bag[e] || 0); if (d > 0) { o.n += d; o.v += d * val(e); } } o.v += o.money;
        for (const k of Object.keys(z.sk)) { const d = (z.sk[k] || 0) - (a.sk[k] || 0); if (d > 0) { o.xp[k] = d; o.xpT += d; } } for (const k of Object.keys(z.h)) { const d = (z.h[k] || 0) - (a.h[k] || 0); if (d > 0) { o.h[k] = d; o.hMax = Math.max(o.hMax, d); } } return o; };
      const clean = () => { try { const H9 = SM_TOWN.herd && SM_TOWN.herd(); if (H9 && H9.stop) H9.stop('reset'); } catch (e) { /* 양몰이 없음 */ } for (let k = 0; k < 4; k++) { if (SM_TOWN.rules.play()) SM_TOWN.rules.playEnd(3); const P = document.querySelector('.twn-p'); if (!P) break; const b9 = P.querySelector('[data-a="x"]') || [...P.querySelectorAll('button')].find(e => /닫기|그대로|나가기|Close|Keep|Leave/.test(e.textContent)); if (b9) b9.click(); else break; } };
      const fresh = (off) => { G.rwOff(!!off); S.rw = {}; S.skillDay = null; S.picked = {}; S.uses = {}; S.hearts = {}; S.tasks = null; S.min = 11 * 60; };
      const hots = () => { const seen = new Set(), out = []; for (const h of SD2.map.interact.list({ kind: 'game' })) { if (h.off || !h.use) continue; const L = String(h.label || '').replace(/[0-9]+/g, '#'); if (seen.has(L)) continue; seen.add(L); out.push(h); } return out; };
      const at = h => { try { SD2.map.player.teleport([h.x + 0.6, SM_TOWN.ground(h.x + 0.6, h.z) + 0.05, h.z]); } catch (e) { /* 설 곳 없음 */ } };
      const keep = () => JSON.stringify(S), back = j => { const o = JSON.parse(j), B = S.bag; for (const k of Object.keys(B)) delete B[k]; Object.assign(B, o.bag); for (const k of Object.keys(o)) if (k !== 'bag') S[k] = o[k]; };   /* 두 번 잴 때 같은 출발(처음 본 것·가 본 칸이 먼저 잰 쪽에만 생기지 않게) */
      window.__C = { G, S, M, val, snap, diff, clean, fresh, hots, at, keep, back }; });
    const esc = async () => { await p.keyboard.press('Escape'); await W8(60); };
    const D = await ev(() => ({ day: __C.M.RW_DAY, rd: __C.M.RW_RD, gen: __C.M.RW_GEN, heart: __C.M.RW_HEART }));
    const CAPV = D.day.v * D.rd, CAPX = D.day.x * D.rd, CAPH = D.day.h * D.rd;
    console.log('한도: 실제 날짜 하루 = 가치 ' + CAPV + ' · 솜씨 갈래마다 ' + CAPX + ' · 이웃마다 하트 ' + CAPH + ' · 일 갈래마다 ' + D.gen.job + '판 · 하트 하루 +' + D.heart);
    // ── ⑤ 평소 하루(한도 끔 → 켬 · 같은 차례) ──
    const evenDay = async off => { await ev(o => { __C.fresh(o); window.__s0 = __C.snap(); }, off); const H = await ev(() => __C.hots().length);
      for (let i = 0; i < H; i++) { await ev(i9 => { const h = __C.hots()[i9]; if (!h) return; __C.at(h); try { h.use(); } catch (e) { /* 그 자리 오류는 아래 pageerror로 */ } __C.clean(); }, i); if (i % 8 === 7) { await W8(80); await ev(() => __C.clean()); await esc(); } }
      await W8(1400); await ev(() => __C.clean()); await esc();
      const WK = await ev(() => SM_TOWN.rw.wk()); for (const w of WK) { await ev(i9 => { __C.clean(); SM_TOWN.rw.play(i9); __C.clean(); }, w.i); }
      for (const e9 of ['bus', 'book', 'stars', 'summit', 'boat', 'stones']) await ev(k => SM_TOWN.rw.tev(k), e9);
      await W8(800); await ev(() => __C.clean()); await esc(); return ev(() => __C.diff(__s0, __C.snap())); };
    console.log('⑤ 평소 하루(E 자리 · 일터 · 할 일 한 번씩)');
    await ev(() => { window.__K0 = __C.keep(); }); const dOff = await evenDay(true); await ev(() => __C.back(__K0)); const dOn = await evenDay(false); await ev(() => __C.back(__K0)); const pct = (a, z) => (z ? Math.round(a / z * 100) : 100);
    console.log('    한도 끔: 가치 ' + dOff.v + ' (물건 ' + dOff.n + ' · 돈 ' + dOff.money + ') · 솜씨 ' + dOff.xpT + ' ' + JSON.stringify(dOff.xp) + ' · 하트 최대 ' + dOff.hMax);
    console.log('    한도 켬: 가치 ' + dOn.v + ' (물건 ' + dOn.n + ' · 돈 ' + dOn.money + ') · 솜씨 ' + dOn.xpT + ' ' + JSON.stringify(dOn.xp) + ' · 하트 최대 ' + dOn.hMax);
    ok(dOn.v >= dOff.v * 0.85, '평소 하루 생김 가치 ' + pct(dOn.v, dOff.v) + '% (±15% 안)');
    ok(dOn.xpT >= dOff.xpT * 0.85, '평소 하루 솜씨 ' + pct(dOn.xpT, dOff.xpT) + '% (±15% 안)');
    ok(dOff.v <= CAPV, '평소 하루(한도 끔)도 실제 날짜 한도 안 — ' + dOff.v + ' ≤ ' + CAPV);
    // ── ① E 자리마다 200번 ──
    console.log('① E 자리마다 200번 되풀이');
    const H = await ev(() => __C.hots().map(h => h.label)); let worst = { g: 0 }, nOk = 0; const grow = [];
    for (let i = 0; i < H.length; i++) {
      await ev(i9 => { __C.fresh(false); window.__s0 = __C.snap(); const h = __C.hots()[i9]; window.__h = h; if (h) __C.at(h); }, i);
      for (let r = 0; r < 8; r++) { await ev(() => { const h = __h; if (!h) return; __C.at(h); try { h.use(); } catch (e) { /* 아래 pageerror */ } __C.clean(); }); await W8(40); }
      await W8(1100); await ev(() => __C.clean()); await esc(); await ev(() => { window.__s8 = __C.snap(); });
      await ev(() => { const h = __h; if (!h) return; for (let r = 0; r < 192; r++) { __C.at(h); try { h.use(); } catch (e) { /* 아래 */ } __C.clean(); } });
      await W8(1100); await ev(() => __C.clean()); await esc();
      const g = await ev(() => ({ a: __C.diff(__s0, __s8), z: __C.diff(__s8, __C.snap()) }));
      const more = g.z.v + g.z.xpT + g.z.hMax; if (more > 0) grow.push(H[i] + ' (+가치 ' + g.z.v + ' · +솜씨 ' + g.z.xpT + ' · +하트 ' + g.z.hMax + ')'); else nOk++;
      const tot = g.a.v + g.z.v; if (tot > worst.g) worst = { g: tot, l: H[i], xp: g.a.xpT + g.z.xpT }; }
    ok(!grow.length, 'E 자리 ' + H.length + '곳 — 9번째 뒤로 더 생기지 않음 ' + nOk + '곳' + (grow.length ? ' · 늘어난 곳: ' + grow.slice(0, 6).join(' / ') : ''));
    console.log('    가장 많이 생긴 자리: ' + (worst.l || '-') + ' 가치 ' + worst.g + ' · 솜씨 ' + (worst.xp || 0));
    // ── ② 일 갈래마다 칸을 돌며 200판 ──
    console.log('② 일 갈래마다 200판(칸을 돌며)');
    const WK = await ev(() => SM_TOWN.rw.wk()), kinds = [...new Set(WK.map(w => w.k))]; const over = [], rows = [];
    for (const k of kinds) { const idx = WK.filter(w => w.k === k).map(w => w.i); await ev(() => { __C.fresh(false); window.__s0 = __C.snap(); });
      const r = await ev(L => { let real = 0, prac = 0, none = 0; for (let n = 0; n < 200; n++) { const i9 = L[n % L.length]; __C.clean(); const q = SM_TOWN.rw.play(i9); if (!q) { none++; continue; } if (q.pr) prac++; else real++; __C.clean(); } return { real, prac, none }; }, idx);
      await W8(200); await ev(() => __C.clean()); const g = await ev(() => __C.diff(__s0, __C.snap())); rows.push(k + ' ' + idx.length + '칸 ' + r.real + '판'); if (r.real > D.gen.job) over.push(k + ' ' + r.real + '판'); if (g.hMax > D.heart) over.push(k + ' 하트 +' + g.hMax); }
    console.log('    ' + rows.join(' · '));
    ok(!over.length, '일 갈래 ' + kinds.length + '개 — 받는 판 하루 ' + D.gen.job + '판 · 이웃 하트 하루 +' + D.heart + ' 안' + (over.length ? ' · 넘침: ' + over.join(' / ') : ''));
    // ── ③ 할 일 알림 200번(같은 출처 솜씨) ──
    console.log('③ 할 일 알림 200번');
    const EVS = ['bus', 'book', 'stars', 'summit', 'boat', 'stones', 'mush', 'farm', 'sell', 'buy', 'away', 'bundle']; const evr = [], evOver = [];
    for (const e9 of EVS) { await ev(() => { __C.fresh(false); window.__s0 = __C.snap(); }); const g = await ev(k => { const t = []; for (let n = 0; n < 200; n++) { SM_TOWN.rw.tev(k, 1); if (n === 19) t.push(__C.diff(__s0, __C.snap()).xpT); } t.push(__C.diff(__s0, __C.snap()).xpT); return t; }, e9);
      evr.push(e9 + ' ' + g[1]); if (g[1] > g[0] || g[1] > 40) evOver.push(e9 + ' 20번 ' + g[0] + ' → 200번 ' + g[1]); await ev(() => __C.clean()); await esc(); }
    console.log('    솜씨(200번 뒤): ' + evr.join(' · '));
    ok(!evOver.length, '할 일 알림 ' + EVS.length + '가지 — 20번 뒤로 솜씨가 더 늘지 않음' + (evOver.length ? ' · ' + evOver.join(' / ') : ''));
    // ── ④ 잠 → 일 → 잠 30번(실제 날짜 총량) ──
    console.log('④ 잠 → 일 → 잠 30번');
    const cycle = async (n, off) => { await ev(o => { __C.fresh(o); window.__s0 = __C.snap(); }, off);
      for (let c = 0; c < n; c++) { await ev(() => { __C.clean(); __C.G.sleep(); __C.S.min = 11 * 60; }); await W8(60);
        await ev(L => { for (let r = 0; r < 2; r++) for (const i9 of L) { __C.clean(); SM_TOWN.rw.play(i9); __C.clean(); } for (const k of ['bus', 'book', 'stars', 'summit', 'boat', 'stones', 'mush']) SM_TOWN.rw.tev(k, 1); }, WK.map(w => w.i));
        await ev(i9 => { const L = __C.hots(); for (let j = 0; j < L.length; j++) { const h = L[(j + i9 * 7) % L.length]; __C.at(h); try { h.use(); } catch (e) { /* 아래 */ } __C.clean(); } }, c); await W8(1200); await ev(() => __C.clean()); await esc(); }
      return ev(() => __C.diff(__s0, __C.snap())); };
    await ev(() => { window.__K1 = __C.keep(); }); const c3 = await cycle(3, true); await ev(() => __C.back(__K1)); const c30 = await cycle(30, false);
    const xMax = Math.max(0, ...Object.values(c30.xp));
    console.log('    한도 끔 3번: 가치 ' + c3.v + ' · 솜씨 ' + c3.xpT + ' (30번이면 어림 ' + c3.v * 10 + ' · ' + c3.xpT * 10 + ')');
    console.log('    한도 켬 30번: 가치 ' + c30.v + ' · 솜씨 ' + JSON.stringify(c30.xp) + ' · 하트 최대 ' + c30.hMax);
    ok(c30.v <= CAPV, '잠 30번 생김 가치 ' + c30.v + ' ≤ 실제 날짜 한도 ' + CAPV);
    ok(xMax <= CAPX, '잠 30번 솜씨 갈래마다 최대 ' + xMax + ' ≤ ' + CAPX);
    ok(c30.hMax <= CAPH, '잠 30번 이웃마다 하트 최대 +' + c30.hMax + ' ≤ ' + CAPH);
    { const T = await ev(() => { const t = document.getElementById('toast'); return t ? t.textContent : ''; }), said = await ev(() => (__C.S.rw.r || {}).said || {}); ok(Object.keys(said).length > 0, '상한에 닿으면 알림 한 번(' + Object.keys(said).join('·') + ')' + (T ? ' — ' + T.slice(0, 40) : '')); }
    // 다음 실제 날짜 = 다시 생김
    { await ev(() => { __C.S.rw.rd = 20000101; __C.clean(); __C.G.sleep(); __C.S.min = 11 * 60; window.__s0 = __C.snap(); }); await ev(L => { for (const i9 of L) { __C.clean(); SM_TOWN.rw.play(i9); __C.clean(); } }, WK.slice(0, 8).map(w => w.i)); const g = await ev(() => __C.diff(__s0, __C.snap())); ok(g.v > 0 || g.xpT > 0, '다음 실제 날짜 = 다시 생김(가치 ' + g.v + ' · 솜씨 ' + g.xpT + ')'); }
    await ev(() => { __C.G.rwOff(false); __C.clean(); });
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('시험 오류 ' + e.message); console.log('  ✗ 시험 오류 ' + e.message.slice(0, 300)); }
  await b.close(); console.log((fails.length ? '❌ 실패 ' + fails.length : '✅ 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
