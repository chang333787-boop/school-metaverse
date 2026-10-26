// 바다 칸 할 거리 시험(SEA4-1 · docs/systems/town_cells.md §11): node tools/harness/town_sea4.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   칸마다(가13·가14·나13·나14) 할 거리 둘 이상 · 실측 SM_TOWN.cells 전(바다 할 거리 빼고)·후 · 자리 = 뭍은 걸어 설 곳 · 물은 선착장에서 배로 이어진 물
//   E 판단: 창마다 틀린 답 = 끝나지 않고 한 줄 · 맞는 답 = 보상(솜씨)·오늘 한 것 · 고르기(주워요/둬요) = 다 고르면 주운 것이 세상에서 사라짐 · 부표 = 맞힌 뒤 두 부표 사이를 배로 지나면 한 줄
//   물때(게: 밀물 = 언제 올까 · 썰물 = 엽낭게 · 밤 = 달랑게) · 밤엔 부표 불빛 · E 자리 꺼짐(뭍 = 배 위에서 · 물 = 걸을 때) · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8);
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const CELLS = ['가13', '가14', '나13', '나14'];
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.sea4 && SM_TOWN.sea4() && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(600);
    await ev(() => { const G = typeof SM_TOWN.game === 'function' ? SM_TOWN.game() : SM_TOWN.game; window.__G = G.S ? G : { S: G }; if (window.__G.setClock) window.__G.setClock(false); });
    const shut = () => ev(() => { const P = document.querySelector('.twn-p'); if (!P) return; const b9 = P.querySelector('[data-a="x"]') || [...P.querySelectorAll('button')].find(e => /그대로|닫기|Keep|Close/.test(e.textContent)); if (b9) b9.click(); });
    const at = (min, ph) => ev(([m, k]) => { __G.S.min = m; if (SD2.map.time) SD2.map.time(k); SM_TOWN.rules.wx('clear'); }, [min, ph]);
    await at(11 * 60, 'day'); await W8(1500);
    const I0 = await ev(() => SM_TOWN.sea4().info()); const SP = I0.spots;
    console.log('바다 할 거리 자리 ' + SP.length + ' · 짓기 ' + I0.buildMs + 'ms · 상자 ' + I0.parts + ' · ' + SP.map(s => s.n + ':' + s.id).join(' '));
    // ── 1. 칸마다 둘 이상 · 실측 전후 ──
    console.log('1. 칸마다 할 거리');
    const C = await ev(() => SM_TOWN.cells());
    for (const n of CELLS) { const mine = SP.filter(s => s.n === n), all = C.cells[n] || [], mineL = new Set(mine.map(s => s.label)), other = all.filter(l => !mineL.has(l));
      ok(mine.length >= 2, n + ': 바다 할 거리 ' + mine.length + ' (' + mine.map(s => s.id).join('·') + ') · 실측 전 ' + other.length + ' → 후 ' + all.length); }
    ok(I0.buildMs < 60, '짓기 ' + I0.buildMs + 'ms'); ok(!SP.some(s => s.bad), '부표 둘 다 물 위');
    // ── 2. 자리 = 뭍은 걸어 설 곳 · 물은 선착장에서 배로 이어진 물 ──
    console.log('2. 자리');
    const land = await ev(L => L.map(s => { const g = SM_TOWN.ground(s.ex, s.ez), bl = SD2.map.q.blocked(s.ex, s.ez, g + 0.3); return [s.n + ':' + s.id, !bl && SM_TOWN.sd(s.ex, s.ez) > 0.4]; }), SP.filter(s => /crab|wrack|tide|vest/.test(s.id)));
    for (const [k, v] of land) ok(v, k + ' 걸어 설 수 있는 마른 땅');
    const reach = await ev(L => { const A9 = SM_TOWN.sea4(), H9 = A9.harb(); if (!H9) return null; const st = 6, key = (x, z) => Math.round(x / st) + ',' + Math.round(z / st), seen = new Set([key(H9[0], H9[1])]), Q = [[Math.round(H9[0] / st), Math.round(H9[1] / st)]]; let n9 = 0;
      while (Q.length && n9 < 40000) { const [i, j] = Q.shift(); n9++; for (const [a, b9] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k9 = (i + a) + ',' + (j + b9); if (seen.has(k9)) continue; if (!A9.seaOk((i + a) * st, (j + b9) * st)) continue; seen.add(k9); Q.push([i + a, j + b9]); } }
      return L.map(s => [s.n + ':' + s.id, [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b9]) => seen.has((Math.round(s.ex / st) + a) + ',' + (Math.round(s.ez / st) + b9)))]); }, SP.filter(s => /gull|drift|buoy/.test(s.id) && !s.swim));
    ok(!!reach, '선착장 있음'); if (reach) for (const [k, v] of reach) ok(v, k + ' 선착장에서 배로 닿음');
    // ── 3. E 판단(창) ──
    console.log('3. E 판단');
    const st = () => ev(() => JSON.parse(JSON.stringify(SM_TOWN.sea4().st())));
    const go = s => ev(s9 => { const A9 = SM_TOWN.sea4(), B = A9.boatRef(), sea = /gull|drift|buoy/.test(s9.id) && !s9.swim; if (s9.swim) { if (B.on) SM_TOWN.boatGo(false); SD2.map.player.teleport([s9.ex, -3.5, s9.ez]); } else if (sea) { if (!B.on) SM_TOWN.boatGo(true); B.x = s9.ex; B.z = s9.ez; B.v = 0; } else { if (B.on) SM_TOWN.boatGo(false); SD2.map.player.teleport([s9.ex, SM_TOWN.ground(s9.ex, s9.ez) + 0.05, s9.ez]); } }, s);
    const hotOf = s => ev(s9 => { const A9 = SM_TOWN.sea4(); A9.sec(); const q = A9.info().spots.find(x => x.n === s9.n && x.id === s9.id); return q ? { off: q.off, label: q.label } : null; }, s);
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { t: P.textContent, opts: [...P.querySelectorAll('button[data-a^="o"]')].map(b9 => b9.textContent), rows: [...P.querySelectorAll('[data-r]')].map(r => r.querySelector('b').textContent) } : null; });
    const msg = () => ev(() => { const m = document.querySelector('.twn-p [data-m]'); return m ? m.textContent : ''; });
    const click = sel => ev(s9 => { const b9 = document.querySelector('.twn-p ' + s9); if (b9) b9.click(); return !!b9; }, sel);
    const pressE = async () => { for (let k = 0; k < 3; k++) { await p.keyboard.press('KeyE'); for (let i = 0; i < 12; i++) { await W8(200); if (await ev(() => !!document.querySelector('.twn-p') || /twn-toast/.test(document.body.innerHTML.slice(-4000)))) return; } } };   /* 그리기 켬이면 E 자리 고르기(0.15초)가 늦을 수 있어 기다렸다 다시 */
    // 고르기 창 하나: 틀린 답 하나 → 아직 안 끝남 · 맞는 답 → 끝 + 보상
    async function askRun(s, right, nm) { const s0 = await st(); const P0 = await panel(); if (!P0) { ok(false, nm + ' 창 열림'); return; } ok(P0.opts.length >= 2, nm + ' 창 = 본 것 + 답 ' + P0.opts.length + ' — "' + P0.t.slice(0, 70).replace(/\s+/g, ' ') + '…"');
      const ri = P0.opts.findIndex(o => right.test(o)); ok(ri >= 0, nm + ' 맞는 답 있음(' + P0.opts.join(' / ') + ')'); const wi = P0.opts.findIndex((o, i) => i !== ri);
      await click('[data-a="o' + wi + '"]'); await W8(200); const m1 = await msg(), s1 = await st(); ok(m1.length > 4 && (s1.n[s.id] || 0) === (s0.n[s.id] || 0), nm + ' 틀린 답 = 끝나지 않고 한 줄 "' + m1.slice(0, 40) + '"');
      await click('[data-a="o' + ri + '"]'); await W8(300); const m2 = await msg(), s2 = await st(); ok((s2.n[s.id] || 0) === (s0.n[s.id] || 0) + 1, nm + ' 맞는 답 = 보상·기록 "' + m2.slice(0, 50) + '"'); await shut(); await W8(250); }
    const by = (n, id) => SP.find(s => s.n === n && s.id === id) || SP.find(s => s.id === id);
    // 게(밀물 → 언제 올까 · 썰물 → 엽낭게 · 밤 → 달랑게)
    const crab = SP.find(s => s.id === 'crab' && /가13|나13/.test(s.n));
    if (crab) { const L0 = await ev(() => { const d = __G.S.day; return 300 + ((d * 50 + 250) % 745); });
      await at((L0 + 372) % 1440 > 420 && (L0 + 372) % 1440 < 1080 ? (L0 + 372) % 1440 : L0 - 300 > 420 ? L0 - 300 : 480, 'day'); await go(crab); await W8(900); let h = await hotOf(crab); ok(h && !h.off, '게(밀물) E 켜짐 — ' + (h && h.label));
      const good = await ev(async () => { const M = await import('/v2/games/town_shore.js?v=5'), d = __G.S.day, m = __G.S.min, nx = M.lowsOf(d).find(w => w[0] > m && w[0] + 20 < 18 * 60); return nx ? M.hm(nx[0] + 20) : '내일 썰물 때'; }); await pressE(); await askRun(crab, new RegExp('^' + good + '$'), '게(밀물 · 언제 올까 · 답 ' + good + ')');
      await at(L0 + 10, 'day'); await W8(900); h = await hotOf(crab); ok(h && /게 살펴보기/.test(h.label), '게(썰물) E = ' + (h && h.label)); await pressE(); await askRun(crab, /먹이/, '엽낭게(썰물)');
      if (SHOTS) { await at(L0 + 10, 'day'); await ev(s9 => { SD2.map.player.teleport([s9.ex - 4, SM_TOWN.ground(s9.ex - 4, s9.ez + 3) + 0.05, s9.ez + 3]); SD2.map.player.lookAt([s9.ex, s9.ez]); }, crab); await W8(1500); await p.screenshot({ path: SHOTS.replace(/\/$/, '') + '/sea4_beach.png' }); await go(crab); }
      await at(22 * 60, 'night'); await W8(1200); h = await hotOf(crab); ok(h && /밤/.test(h.label), '게(밤) E = ' + (h && h.label)); await pressE(); await askRun(crab, /가만히/, '달랑게(밤)'); await at(11 * 60, 'day'); await W8(800); }
    // 물때 표 · 구명조끼
    for (const [id, re, nm] of [['tide', null, '물때 표'], ['vest', /조끼 나/, '구명조끼']]) { const s = by('가13', id) || by('나13', id); if (!s) { ok(false, nm + ' 자리'); continue; } await go(s); await W8(900); const h = await hotOf(s); ok(h && !h.off, nm + ' E 켜짐 — ' + (h && h.label)); await pressE();
      let R = re; if (id === 'tide') { const a = await ev(() => { const d = __G.S.day, m = __G.S.min, f = (mm) => { const L0 = 300 + ((d * 50 + 250) % 745); return (1 - Math.cos(2 * Math.PI * (mm - L0) / 745)) / 2; }, lv = f(m), dl = f(m + 10) - lv; return lv > 0.93 || lv < 0.07 ? 2 : dl > 0 ? 0 : 1; }); R = [/들어오는/, /빠지는/, /멈췄/][a]; }
      await askRun(s, R, nm); }
    // 물때선 쓰레기 · 떠다니는 것(주워요/둬요)
    const ITEMS = await ev(async () => { const M = await import('/v2/games/town_sea4.js?v=1'); return Object.fromEntries([...M.SEA4_BEACH, ...M.SEA4_SEA].map(q => [q[0][0], q[1]])); });
    for (const s of [by('가13', 'wrack'), by('가14', 'drift')].filter(Boolean)) { const nm = s.n + ' ' + (s.id === 'wrack' ? '물때선 고르기' : '떠다니는 것 건지기'); await go(s); await W8(900); const h = await hotOf(s); ok(h && !h.off, nm + ' E 켜짐'); await pressE(); const P0 = await panel(); if (!P0) { ok(false, nm + ' 창'); continue; }
      ok(P0.rows.length === 5 && P0.rows.some(r => ITEMS[r]) && P0.rows.some(r => ITEMS[r] === 0), nm + ' 물건 다섯(주울 것·둘 것 섞임): ' + P0.rows.join(' · '));
      const r0 = P0.rows[0]; await click('[data-a="' + (ITEMS[r0] ? 'l' : 't') + '0"]'); await W8(150); ok((await msg()).length > 4 && !(await st()).done[s.n + ':' + s.id], nm + ' 틀리게 고름 = 다시 봐요');
      for (let i = 0; i < 5; i++) { await click('[data-a="' + (ITEMS[P0.rows[i]] ? 't' : 'l') + i + '"]'); await W8(120); }
      const S2 = await st(), I2 = await ev(() => SM_TOWN.sea4().info()); ok(S2.done[s.n + ':' + s.id] === (await ev(() => __G.S.day)), nm + ' 다 고름 = 오늘 한 것 · "' + (await msg()).slice(0, 40) + '"'); await shut(); await W8(200);
      await pressE(); const t2 = await ev(() => document.querySelector('.twn-p') ? 'panel' : (document.querySelector('.twn-toast, .toast') || {}).textContent || 'toast'); ok(t2 !== 'panel', nm + ' 같은 날 다시 E = 창 없이 한 줄'); }
    // 해수욕장 앞바다(가14 · 헤엄으로): 해파리 · 수영 한계선
    for (const [id, re, nm] of [['jelly', /천천히/, '해파리'], ['rope', /안쪽/, '수영 한계선']]) { const s = SP.find(q => q.id === id); if (!s) { ok(false, nm + ' 자리'); continue; } await go(s); await W8(1200); const sw = await ev(() => SD2.map.player.get().y); const h = await hotOf(s); ok(h && !h.off, s.n + ' ' + nm + ' E 켜짐(헤엄 · y ' + sw.toFixed(2) + ') — ' + (h && h.label)); await pressE(); await askRun(s, re, nm); }
    // 갈매기
    { const s = by('가14', 'gull'); if (s) { await go(s); await W8(900); const h = await hotOf(s); ok(h && !h.off, '갈매기 E 켜짐(배 위) — ' + (h && h.label)); await pressE(); await askRun(s, /물고기/, '갈매기'); } else ok(false, '갈매기 자리'); }
    // 부표(맞힌 뒤 사이로 지나가기)
    { const s = by('나14', 'buoy'); if (s) { await go(s); await W8(900); const h = await hotOf(s); ok(h && !h.off, '부표 E 켜짐(배 위) — ' + (h && h.label)); await pressE(); const cv = await ev(() => !!document.querySelector('.twn-p canvas.twn-sea4')); ok(cv, '부표 창 = 그림(위에서 본 길 셋)'); await askRun(s, /사이/, '항로 표지 부표');
        const said = await ev(async s9 => { const A9 = SM_TOWN.sea4(), B = A9.boatRef(), u = s9.u, L = []; const o = window.__sayL || (window.__sayL = []); for (let k = -10; k <= 10; k += 4) { B.x = s9.x + u[0] * k; B.z = s9.z + u[1] * k; await new Promise(r => setTimeout(r, 250)); A9.sec(); } return A9.info().gate; }, s);
        ok(said === null, '부표 사이로 선착장 쪽 지나가기 = 다 됨(gate 끝)');
        if (SHOTS) { await at(11 * 60, 'day'); await ev(s9 => { const B = SM_TOWN.sea4().boatRef(); B.x = s9.x - s9.u[0] * 22 + s9.u[1] * 4; B.z = s9.z - s9.u[1] * 22 - s9.u[0] * 4; B.h = Math.atan2(s9.u[0], s9.u[1]); SD2.map.player.lookAt([s9.x, s9.z]); }, s); await W8(1800); await p.screenshot({ path: SHOTS.replace(/\/$/, '') + '/sea4_sea.png' }); }
        await at(22 * 60, 'night'); await W8(1500); const I3 = await ev(() => SM_TOWN.sea4().info()); ok(I3.lit, '밤 = 부표 불빛 켜짐'); await at(11 * 60, 'day'); } else ok(false, '부표 자리'); }
    // E 자리 꺼짐: 뭍 자리 = 배 위에선 꺼짐 · 물 자리 = 걸을 땐 꺼짐
    { await ev(() => SM_TOWN.boatGo(false)); await W8(500); const I4 = await ev(() => { SM_TOWN.sea4().sec(); return SM_TOWN.sea4().info(); }); ok(I4.spots.filter(s => /gull|drift|buoy/.test(s.id)).every(s => s.off), '걸을 때 = 물 자리 E 꺼짐'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); }
  await b.close(); console.log((fails.length ? '\n✗ 실패 ' + fails.length + '개' : '\n✓ 모두 통과') + ' (' + Math.round((Date.now() - T0) / 1000) + '초)'); process.exit(fails.length ? 1 : 0); })();
