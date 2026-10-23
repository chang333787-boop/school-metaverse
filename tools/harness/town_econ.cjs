// 🧺 장터 값 시험(MKT-2 · 단계 4 「23 장터 값」 · docs/systems/town_phase4.md): node tools/harness/town_econ.cjs [마을=ourtown] [포트=8002]
//   ① 사흘 비 다음 날 하루 벌이(장터마다 물건 한 벌을 판 값)가 맑은 날과 견줘 ±15% 안 · 물건마다 공급×수요 0.85~1.15
//   ② 사흘 비 = 들 물건 바구니가 줄어듦 · 맑고 바람 센 어제 + 내가 만든 소금 = 바다 소금 바구니 가득
//   ③ 되사서 되팔기는 늘 손해(가게 값 > 되팔 값 · 비·장날에도) ④ 한 장터에 몰아 팔면 그 장터만 값이 내려감(demK) · 다른 장터는 그대로
//   ⑤ 칠판 숫자 = priceAt ⑥ 두 번째로 말을 걸면 상인이 까닭(비) · 페이지 오류 0 · 캡처 = scratchpad/econ_shots · 브라우저는 brun.sh 한 자리로
const { chromium } = require('playwright');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOT = process.env.ECON_SHOTS || '/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/3596a208-fd90-4cd5-b160-00ac62075cec/scratchpad/econ_shots';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), shot = n => p.screenshot({ path: SHOT + '/' + n + '.png' });
    const closeP = () => ev(() => { for (let k = 0; k < 3; k++) { const P = document.querySelector('.twn-p'); if (!P) return; const b9 = P.querySelector('[data-a="x"]') || P.querySelector('button.sub') || P.querySelector('button'); if (b9) b9.click(); else return; } });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.mk && SM_TOWN.game && SM_TOWN.rules && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await closeP(); await p.keyboard.press('Escape'); await W8(500);
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); if (G.S.day % 5 === 0) G.S.day++; });
    const ST = await ev(() => SM_TOWN.mk.stalls()); console.log('장터 ' + ST.length + '곳: ' + ST.map(s => s.mk + '(' + s.reg + ')').join(', ')); ok(ST.length >= 2, '장터 둘 이상');
    const ITEMS9 = ['🥬', '🥔', '🍓', '🍚', '🍐', '🥛', '🍄', '🍯', '🧂', '🐟', '🌿', '🐚', '🥒'];
    const income = () => ev(L => { let v = 0; const ks = []; for (const s of SM_TOWN.mk.stalls()) for (const e of L) { v += SM_TOWN.mk.price(e, s.reg); ks.push(SM_TOWN.mk.k(e, s.reg)); } return { v, kmin: Math.min(...ks), kmax: Math.max(...ks) }; }, ITEMS9);
    const setDay = (r, o) => ev(([r9, o9]) => { SM_TOWN.mk.setR3(r9); SM_TOWN.mk.set(Object.assign({ gy: false, ys: 0 }, o9 || {})); SM_TOWN.mk.day(); }, [r, o || null]);
    // ── ① 맑은 사흘 vs 사흘 비 다음 날 ──
    console.log('☀️ / 🌧 하루 벌이');
    await setDay([0, 0, 0]); const I0 = await income(), L0 = await ev(() => SM_TOWN.mk.lumps()), B0 = await ev(() => SM_TOWN.mk.boards());
    await setDay([0, 1.1, 1.1]); const I1 = await income(), L1 = await ev(() => SM_TOWN.mk.lumps()), B1 = await ev(() => SM_TOWN.mk.boards());
    const rt = I1.v / I0.v; console.log('    맑음 ' + I0.v + ' · 사흘 비 ' + I1.v + ' (×' + rt.toFixed(3) + ') · 물건 k ' + I1.kmin.toFixed(2) + '~' + I1.kmax.toFixed(2));
    ok(rt >= 0.85 && rt <= 1.15, '사흘 비 다음 날 하루 벌이 ±15% 안(×' + rt.toFixed(3) + ')'); ok(rt > 1.0, '비가 이어지면 들 물건 값이 오름(공급이 줄어서)');
    ok(I1.kmin >= 0.85 && I1.kmax <= 1.15 && I0.kmin >= 0.85 && I0.kmax <= 1.15, '공급×수요는 늘 0.85~1.15 안');
    { const big = []; for (const r of [[3, 3, 3], [0, 0, 0]]) { await setDay(r, { gy: true, ys: 9 }); const I = await income(); big.push(I.kmin.toFixed(2) + '~' + I.kmax.toFixed(2)); ok(I.kmin >= 0.85 && I.kmax <= 1.15, '극단(큰비 사흘 · 소금 많이)에도 0.85~1.15 — ' + big[big.length - 1]); } }
    // ── ② 바구니 ──
    const sum = (L, f) => L.filter(f).reduce((a, c) => a + c.n, 0), fieldF = c => ['배추', '감자', '딸기', '쌀', '배'].includes(c.mk);
    console.log('🧺 바구니: 맑음 ' + L0.map(c => c.mk + c.n).join(' ') + ' | 비 ' + L1.map(c => c.mk + c.n).join(' '));
    if (L0.some(fieldF)) ok(sum(L1, fieldF) < sum(L0, fieldF), '사흘 비 = 들 물건 바구니가 줄어듦(' + sum(L0, fieldF) + ' → ' + sum(L1, fieldF) + ')'); else console.log('    (들 물건 판매대 없음)');
    if (L0.some(c => c.mk === '소금')) { await setDay([0, 0, 0], { gy: true, ys: 4 }); const L2 = await ev(() => SM_TOWN.mk.lumps()); ok(L2.filter(c => c.mk === '소금').every(c => c.n === 3 && c.full), '맑고 바람 센 어제 + 내가 만든 소금 = 소금 바구니 가득'); await setDay([0, 1.1, 1.1]); const L3 = await ev(() => SM_TOWN.mk.lumps()); ok(sum(L3, c => c.mk === '소금') < sum(L2, c => c.mk === '소금'), '비 온 사흘 = 소금 바구니가 줄어듦'); }
    else console.log('    (소금 판매대 없음)');
    // ── ⑤ 칠판 = priceAt ──
    await setDay([0, 1.1, 1.1]); const B2 = await ev(() => SM_TOWN.mk.boards()); let bad = 0, rows = 0;
    for (const B of B2) { const pr = await ev(([g, reg]) => g.map(e => SM_TOWN.mk.price(e, reg)), [B.goods.slice(0, 4), B.reg]); B.rows.forEach((r, i) => { rows++; if (r[1] !== pr[i]) bad++; }); }
    console.log('    칠판 ' + B2.length + '개: ' + B2.map(B => B.m + '[' + B.rows.map(r => r.join(' ')).join(', ') + ']').join(' / '));
    ok(B2.length >= 1 && rows >= 1 && bad === 0, '칠판 숫자 = priceAt(' + rows + '줄 중 다름 ' + bad + ')');
    ok(B2.every(B => B.rows.every(r => /^\d+$/.test(String(r[1])))), '칠판 = 숫자만(화살표·% 없음)');
    ok(JSON.stringify(B0.map(B => B.rows)) !== JSON.stringify(B1.map(B => B.rows)) || !L0.some(fieldF), '날씨가 바뀌면 아침 칠판 숫자도 바뀜');
    // ── ③ 되사서 되팔기 = 늘 손해 ──
    console.log('🔁 되사서 되팔기');
    const shopV = await ev(async () => { const M = await import('/v2/games/town_game.js?v=32'); const o = {}; for (const S9 of M.SHOPS) for (const g of S9[4]) if (!g[2] && (M.ITEMS[g[0]] || [])[3] > 0) o[g[0]] = Math.min(o[g[0]] || 1e9, g[1]); return o; });
    for (const cond of [[0, 0, 0], [3, 3, 3]]) { await setDay(cond); for (const e of Object.keys(shopV)) { const q = await ev(([e9]) => { const S = SM_TOWN.game().S; S.bag[e9] = 1; S.bought = S.bought || {}; S.bought[e9] = 1; const v = []; for (let i = 0; i < SM_TOWN.mk.stalls().length; i++) v.push(SM_TOWN.mk.quote(i, e9, 1)); delete S.bag[e9]; delete S.bought[e9]; return Math.max(...v); }, [e]); ok(q < shopV[e], (cond[0] ? '큰비 사흘' : '맑음') + ' · ' + e + ' 가게 ' + shopV[e] + ' → 되팔기 최고 ' + q + ' = 손해'); } }
    // ── ④ 한 장터에 몰아 팔기 ──
    console.log('📉 한 장터에 몰아 팔기'); await setDay([0, 0, 0]);
    { const e = '🥔', i = 0, j = 1; const q0 = await ev(([e9, i9, j9]) => { const S = SM_TOWN.game().S; S.bag[e9] = 12; if (S.bought) delete S.bought[e9]; return [SM_TOWN.mk.quote(i9, e9, 1), SM_TOWN.mk.quote(j9, e9, 1)]; }, [e, i, j]);
      await ev(i9 => SM_TOWN.mk.open(i9), i); await W8(400);
      for (let k = 0; k < 10; k++) { const done = await ev(e9 => { const b9 = document.querySelector('.twn-p [data-s="' + e9 + '"]'); if (!b9) return false; b9.click(); return true; }, e); if (!done) break; await W8(80); }
      await shot('market_sold'); await closeP(); await W8(300);
      const q1 = await ev(([e9, i9, j9]) => { const S = SM_TOWN.game().S; S.bag[e9] = (S.bag[e9] || 0) + 1; const r = [SM_TOWN.mk.quote(i9, e9, 1), SM_TOWN.mk.quote(j9, e9, 1)]; return r; }, [e, i, j]);
      console.log('    ' + ST[i].mk + ': ' + q0[0] + ' → ' + q1[0] + ' · ' + ST[j].mk + ': ' + q0[1] + ' → ' + q1[1]);
      ok(q1[0] < q0[0], '몰아 판 장터(' + ST[i].mk + ')는 값이 내려감'); ok(q1[1] === q0[1], '다른 장터(' + ST[j].mk + ')는 그대로'); }
    // ── ⑥ 상인의 두 번째 말 ──
    console.log('🗣 상인 까닭'); await ev(() => { SM_TOWN.game().S.uses = {}; }); await setDay([0, 1.1, 1.1]);
    { let k = -1; for (let i = 0; i < ST.length; i++) { const w = await ev(i9 => SM_TOWN.mk.why(i9), i); if (w) { k = i; break; } }
      if (k < 0) ok(false, '비 온 뒤 까닭을 말할 장터가 없음'); else {
        await ev(i9 => SM_TOWN.mk.open(i9), k); await W8(300); const w1 = await ev(() => (document.querySelector('.twn-p .mkwhy') || {}).textContent || ''); await closeP(); await W8(300);
        const s9 = ST[k]; await ev(s => { SD2.map.player.teleport([s.x + 2.2, SM_TOWN.ground(s.x + 2.2, s.z) + 0.05, s.z + 2.2]); SD2.map.player.lookAt([s.x, s.z]); }, s9); await W8(600);
        await ev(i9 => SM_TOWN.mk.open(i9), k); await W8(400); const w2 = await ev(() => (document.querySelector('.twn-p .mkwhy') || {}).textContent || ''); await shot('market_why');
        console.log('    첫 번째: "' + w1 + '" · 두 번째: "' + w2 + '"'); ok(!w1 && /비/.test(w2), '두 번째로 말을 걸 때 상인이 까닭(비)을 말함'); await closeP(); await W8(300);
        } }
    { const B = (await ev(() => SM_TOWN.mk.boards())).find(q => q.rows.length >= 2); if (B) { await ev(q => { const L = Math.hypot(q.nx, q.nz) || 1, x = q.x + q.nx / L * 4.2, z = q.z + q.nz / L * 4.2; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.lookAt([q.x, q.z]); }, B); await W8(1200); await shot('market_board'); } }
  } catch (e) { fails.push('예외 ' + e.message.slice(0, 160)); console.log('  ✗ 예외 ' + e.message.slice(0, 300)); }
  finally { ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : '')); await b.close(); console.log((fails.length ? '❌ ' + fails.length + '개 실패' : '✅ 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); }
})();
