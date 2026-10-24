// 🔁 중심 고리 봇 7일(10-24 게임성 ② · docs/systems/town_phase3.md 「짓기 기록(10-24)」): node tools/harness/town_loop7.cjs [마을=ourtown] [포트=8002]
//   봇 하루 = 학교 텃밭(빈 두둑 심기 → 물뿌리개로 물 → 다 자란 것 거두기) + 우리 집 화분 + 일꾼 거들기(일 놀이 몇 판) + 가까운 장터에 다 팔기 + (돈이 모이면) 넓은 꼭지 맡기기 → 튼튼한 씨앗 사기 → 잠
//   PASS 조건: ① 7일 모두 '어제보다 나아진 것'(누적 심은 두둑 · 누적 거둔 수 · 한 번에 물 준 두둑 · 번 돈 누적) 하나 이상이 늘어남 ② 넓은 꼭지·튼튼한 씨앗을 7일 안에 삼
//     ③ 넓은 꼭지 뒤 한 번에 물 준 두둑 ≥ 2 ④ 튼튼한 씨앗으로 심은 두둑을 거두면 하나 더 ⑤ 하루 벌이가 고리 덤(튼튼한 씨앗 몫)을 빼고 견줘 ±15% 안
//     ⑥ 아침마다(심은 게 자란 날) 1분 안에 '자라 있음' 표시(칠판 첫 줄 · 화분 모형) ⑦ 맡긴 날 = 물뿌리개 없음 · 다음 아침 문 앞 ⑧ 페이지 오류 0
//   실제 날짜 한도(REW-1 rd)는 봇이 하루마다 비움(= 수업 하루에 게임 하루 · 시험 손잡이) · 브라우저는 한 번에 하나
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.tools && SM_TOWN.spend && SM_TOWN.mk && SM_TOWN.rw && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const G = SM_TOWN.game(); window.__G = G; G.setClock(false); G.S.min = 9 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); if (G.S.wx) G.S.wx.auto = false;
      window.__clean = () => { try { const H9 = SM_TOWN.herd && SM_TOWN.herd(); if (H9 && H9.stop) H9.stop('reset'); } catch (e) { /* 없음 */ } for (let k = 0; k < 5; k++) { if (SM_TOWN.rules.play()) SM_TOWN.rules.playEnd(3); const P = document.querySelector('.twn-p'); if (!P) break; const b9 = P.querySelector('[data-a="x"]') || [...P.querySelectorAll('button')].find(e => /닫기|그대로|나가기|새 하루|잘 자요|Close|Keep|Leave/.test(e.textContent)); if (b9) b9.click(); else break; } };
      window.__tp = (x, z) => SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); });
    const clean = async () => { await ev(() => __clean()); await p.keyboard.press('Escape'); await W8(80); await ev(() => __clean()); };
    const farm = () => ev(() => SM_TOWN.farm().map(f => ({ bed: f.bed, st: f.st, q: !!(f.P && f.P.q), c: f.P && f.P.c })));
    const sp = () => ev(() => SM_TOWN.spend.info()), tl = () => ev(() => SM_TOWN.tools.info());
    const plantPanel = async () => { await W8(150); return ev(() => { const b9 = document.querySelector('.twn-p [data-c]'); if (!b9) return false; b9.click(); return true; }); };
    // 장터: 학교에서 가장 가까운 곳
    const MK = await ev(() => { const L = SM_TOWN.mk.stalls(); let bi = 0, bd = 1e9; L.forEach((s, i) => { const d = Math.hypot(s.x - 16, s.z - 58); if (d < bd) { bd = d; bi = i; } }); return { i: bi, n: L[bi].mk, x: L[bi].x, z: L[bi].z, d: Math.round(bd) }; });
    console.log('장터 = ' + MK.n + '(학교에서 ' + MK.d + 'm) · 철물점·씨앗 가게: ' + JSON.stringify((await sp()).has));
    const WK = await ev(() => { const seen = new Set(), o = []; for (const w of SM_TOWN.rw.wk()) { if (!w.k || w.k === 'stall' || seen.has(w.k)) continue; seen.add(w.k); o.push(w.i); } return o.slice(0, 7); });
    const P0 = await ev(() => SM_TOWN.home().pots.length);
    const rows = [], cum = { plant: 0, harv: 0, earn: 0 }; const HV = []; let prev = null, canDay = 0, seedDay = 0, extraAll = 0, sawWide = false, bonusOk = null, awayOk = null, doorOk = null;
    for (let D = 1; D <= 7; D++) {
      await clean(); await ev(() => { const S = __G.S; if (S.rw) S.rw.rd = 0; S.min = 9 * 60; if (SD2.map.time) SD2.map.time('day'); });   /* 실제 날짜 = 수업 하루 */
      const day = await ev(() => __G.S.day), m0 = await ev(() => __G.S.money), e0 = await ev(() => __G.S.earned);
      const R = { day, plant: 0, harv: 0, extra: 0, pourMax: 0, earn: 0, money: 0, buy: [] };
      // ── 아침 1분 안 '자라 있음' ──
      if (D > 1) { const s9 = await sp(); R.seen = s9.seen; R.grow = s9.grow; R.potN = s9.potN;
        if (s9.can === 2) { const h = await ev(() => { const h9 = SD2.map.interact.list({ kind: 'game' }).find(q => /고친 물뿌리개|fixed watering/.test(q.label || '') && !q.off); if (!h9) return null; __tp(h9.x + 0.5, h9.z); return { x: h9.x, z: h9.z }; }); doorOk = !!h; await W8(300); await ev(() => { const h9 = SD2.map.interact.list({ kind: 'game' }).find(q => /고친 물뿌리개|fixed watering/.test(q.label || '') && !q.off); if (h9 && h9.use) h9.use(); }); await W8(500); R.buy.push('꼭지 받음'); } }
      // ── 학교 텃밭 ──
      let F = await farm();
      for (let i = 0; i < F.length; i++) { if (F[i].st !== 'ripe') continue; const b0 = await ev(() => ({ ...__G.S.bag })); const q = F[i].q, c = F[i].c; await ev(i9 => SM_TOWN.farmUse(i9), i); await W8(120); const n = await ev(([c9, b9]) => (__G.S.bag[c9] || 0) - (b9[c9] || 0), [c, b0]); R.harv += n; HV.push({ day, c, q, n }); if (q) R.extra++; }
      F = await farm();
      for (let i = 0; i < F.length; i++) { if (F[i].st !== 'empty') continue; await ev(i9 => SM_TOWN.farmUse(i9), i); if (await plantPanel()) R.plant++; await W8(100); await clean(); }
      // 물: 물뿌리개(F)로 — 두둑 끝에 서서 가운데 두둑부터 겨눔(넓은 꼭지면 옆 두둑까지)
      await ev(() => SM_TOWN.tools.tank(100));
      const canAway = (await sp()).away; if (canAway) { const t9 = await tl(); awayOk = !t9.have.includes('can'); }
      for (let pass = 0; pass < 8 && !canAway; pass++) { { const pt = await ev(() => { const P = document.querySelector('.twn-p'); return P ? P.textContent.slice(0, 50) : ''; }); if (pt && process.env.LOOP_DBG) console.log('      (창: ' + pt + ')'); } await clean(); F = await farm(); const wi = F.map((f, i) => f.st === 'water' ? i : -1).filter(i => i >= 0); if (!wi.length) break;
        let best = null; for (const k of wi) { const b9 = F[k].bed; for (const x9 of [b9[0] + 0.5, (b9[0] + b9[1]) / 2, b9[1] - 0.5]) { const n9 = 1 + F.filter((f, j) => j !== k && f.st === 'water' && (() => { const px = Math.max(f.bed[0] + 0.3, Math.min(f.bed[1] - 0.3, x9)), d9 = Math.hypot(px - x9, f.bed[2] - b9[2]); return d9 > 0.9 && d9 < 2.9; })()).length; if (!best || n9 > best[0]) best = [n9, x9, b9[2]]; } }   /* 아이처럼 두둑이 몰린 쪽을 겨눔 */
        const x = best[1], z = best[2]; await ev(([x9, z9]) => { __tp(x9 + 2.6, z9); SD2.map.player.lookAt([x9, z9]); }, [x, z]); await W8(250);
        const t9 = await tl(); if (t9.shown !== 'can') { await p.keyboard.press('Digit1'); await W8(400); }
        await ev(([x9, z9]) => SM_TOWN.tools.aim(x9, z9), [x, z]); await p.keyboard.down('KeyF'); await W8(1700); const mid = await tl(); await p.keyboard.up('KeyF'); await W8(200); await ev(() => SM_TOWN.tools.aim(null));
        if (process.env.LOOP_DBG) console.log('      물 ' + JSON.stringify({ x: +x.toFixed(1), z, shown: mid.shown, pr: mid.pressing, lock: mid.aim.lock, n: mid.pourN, drops: mid.drops, sides: mid.sides.length, busy: await ev(() => !!document.querySelector('.twn-p')) })); R.pourMax = Math.max(R.pourMax, mid.pourN); if (mid.sides.length) sawWide = true; await ev(() => SM_TOWN.tools.tank(100)); }
      if (process.env.LOOP_DBG) console.log('    [' + day + '] 텃밭 ' + (await farm()).map(f => (f.c || '·') + f.st + (f.q ? 'q' : '')).join(' '));
      // ── 우리 집 화분(E) ──
      const H = await ev(() => { const d = SM_TOWN.homeDbg(); return d && d.pots ? d.pots : null; });
      if (H) for (let i = 0; i < P0; i++) { await ev(([x9, z9]) => __tp(x9 + 0.8, z9), [H[i][0], H[i][2]]); const st = await ev(i9 => SM_TOWN.home().pots[i9] ? SM_TOWN.home().pots[i9].st : 'empty', i);
        if (st === 'ripe') { const b0 = await ev(() => ({ ...__G.S.bag })); await ev(i9 => SM_TOWN.potUse(i9), i); await W8(100); R.harv += await ev(b9 => Object.keys(__G.S.bag).reduce((a, e) => a + Math.max(0, (__G.S.bag[e] || 0) - (b9[e] || 0)), 0), b0); }
        const st2 = await ev(i9 => SM_TOWN.home().pots[i9] ? SM_TOWN.home().pots[i9].st : 'empty', i); if (st2 === 'empty') { await ev(i9 => SM_TOWN.potUse(i9), i); if (await plantPanel()) R.plant++; await clean(); }
        if (!canAway) await ev(i9 => { if (SM_TOWN.home().pots[i9] && SM_TOWN.home().pots[i9].st === 'water') SM_TOWN.potUse(i9); }, i); }
      // ── 일꾼 거들기(갈래마다 한 판) ──
      for (const i of WK) { await ev(i9 => { __clean(); SM_TOWN.rw.play(i9); __clean(); }, i); } await W8(300); await clean();
      // ── 장터: 다 팔기 → 사기 ──
      await ev(m => __tp(m.x + 2, m.z + 2), MK); await W8(300); await ev(i9 => SM_TOWN.mk.open(i9), MK.i); await W8(300);
      for (let k = 0; k < 60; k++) { const did = await ev(() => { const b9 = document.querySelector('.twn-p [data-all]') || document.querySelector('.twn-p [data-s]'); if (!b9) return false; b9.click(); return true; }); if (!did) break; await W8(40); }
      const sv = await sp();
      if (!sv.can && (await ev(() => __G.S.money)) >= 8000) { for (let k = 0; k < 2; k++) { await ev(() => { const b9 = document.querySelector('.twn-p [data-sp="can"]'); if (b9) b9.click(); }); await W8(200); } if ((await sp()).can === 1) { R.buy.push('넓은 꼭지 맡김'); canDay = day; const t9 = await tl(); awayOk = !t9.have.includes('can'); } }
      else if (sv.can && !sv.seed && (await ev(() => __G.S.money)) >= 3500) { await ev(() => { const b9 = document.querySelector('.twn-p [data-sp="seed"]'); if (b9) b9.click(); }); await W8(200); if ((await sp()).seed > 0) { R.buy.push('튼튼한 씨앗'); if (!seedDay) seedDay = day; } }
      await clean(); await W8(5200);   /* 되돌리기 5초가 지나 판 셈이 들어감 */
      // ── 하루 기록 ──
      const m1 = await ev(() => __G.S.money), e1 = await ev(() => __G.S.earned); R.earn = e1 - e0; R.money = m1; R.pourMax = R.pourMax | 0; cum.plant += R.plant; cum.harv += R.harv; cum.earn += R.earn; R.cum = { ...cum, pour: Math.max(prev ? prev.cum.pour : 0, R.pourMax) };
      const price = await ev(() => { const S = SM_TOWN.mk.stalls(); return SM_TOWN.mk.price ? SM_TOWN.mk.price('🍅', S[0].reg) : 200; }); R.extraV = R.extra * price; extraAll += R.extraV;
      R.better = prev ? ['plant', 'harv', 'earn', 'pour'].filter(k => R.cum[k] > prev.cum[k]) : ['첫날'];
      rows.push(R); prev = R; void m0;
      // ── 잠 → 아침 ──
      await ev(() => SM_TOWN.sleep()); await W8(2600); await clean(); await W8(1800); await clean();
      if (D < 7) { const s9 = await sp(); console.log('    ' + day + '일째 밤 → 아침: 칠판 "' + (s9.grow || '-') + '" · 보임 ' + JSON.stringify(s9.seen) + ' · 화분 모형 ' + s9.potN + ' · 물뿌리개 ' + ['그냥', '맡김', '문 앞', '넓은 꼭지'][s9.can]); }
    }
    console.log('\n| 날 | 심음 | 거둠(덤) | 한 번에 물 | 번 돈 | 가진 돈 | 산 것 | 어제보다 늘어난 것 | 아침 자라 있음 |');
    for (const R of rows) console.log('| ' + R.day + ' | ' + R.plant + ' | ' + R.harv + (R.extra ? '(+' + R.extra + ')' : '') + ' | ' + R.pourMax + ' | ' + R.earn + ' | ' + R.money + ' | ' + (R.buy.join(', ') || '-') + ' | ' + R.better.join(', ') + ' | ' + (R.seen ? R.seen.how + ' ' + R.seen.s + '초' : R.day > 1 ? '-' : '') + ' |');
    ok(rows.every(R => R.better.length > 0), '7일 모두 어제보다 나아진 것 하나 이상');
    ok(canDay > 0 && canDay <= 6, '넓은 꼭지를 7일 안에 맡김(' + canDay + '일째)'); ok(seedDay > 0, '튼튼한 씨앗을 7일 안에 삼(' + seedDay + '일째)');
    ok(awayOk === true, '맡긴 날 = 물뿌리개 없음'); ok(doorOk === true, '다음 아침 우리 집 문 앞에 고친 물뿌리개');
    ok(sawWide && Math.max(...rows.map(R => R.pourMax)) >= 2, '넓은 꼭지 뒤 한 번에 물 준 두둑 ' + Math.max(...rows.map(R => R.pourMax)) + ' (≥2)');
    { const Q = HV.filter(h => h.q); for (const h of Q) { const nn = HV.filter(o => !o.q && o.c === h.c && o.day <= h.day).sort((a, c) => c.day - a.day)[0]; if (nn) { bonusOk = (bonusOk !== false) && h.n === nn.n + 1; console.log('    튼튼한 씨앗 ' + h.c + ' ' + h.n + '개 · 보통 ' + nn.n + '개(' + nn.day + '일째)'); } } ok(bonusOk === true, '튼튼한 씨앗 두둑 = 거둘 때 하나 더'); }
    { const E = rows.slice(1).map(R => R.earn), avg = E.reduce((a, c) => a + c, 0) / E.length, base = (E.reduce((a, c) => a + c, 0) - extraAll) / E.length, r = avg / base; console.log('    하루 벌이 평균 ' + Math.round(avg) + '원 · 덤 뺀 ' + Math.round(base) + '원 (×' + r.toFixed(3) + ')'); ok(r <= 1.15, '하루 벌이가 덤을 빼고 견줘 ±15% 안(×' + r.toFixed(3) + ')'); }
    { const G = rows.filter(R => R.day > 1 && R.grow); ok(G.length >= 3 && G.every(R => R.seen && R.seen.s <= 60), '아침마다 1분 안 자라 있음 표시(' + G.length + '번 · ' + G.map(R => R.seen ? R.seen.s + '초' : '없음').join(' ') + ')'); ok(G.every(R => R.potN > 0) || !P0, '화분에 자란 모형이 보임'); }
  } catch (e) { fails.push('예외 ' + e.message.slice(0, 160)); console.log('  ✗ 예외 ' + e.message.slice(0, 300)); }
  finally { ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : '')); await b.close(); console.log((fails.length ? '❌ ' + fails.length + '개 실패' : '✅ 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); }
})();
