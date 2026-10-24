// 도구 띠 시험(TOOL-1 · 사용자 10-19 '실제로 도구를 사용해서 뭔가를 하는 게 0개네' · docs/systems/town_tools.md): node tools/harness/town_tools.cjs [마을=ourtown] [포트=8002]
//   도구 다섯을 하나씩 들고(숫자 키) F로 써서 결과가 세상·상태에 남는지: 물뿌리개 = 물 줄어듦·물방울·젖은 자국·모닥불 꺼짐(규칙 fire) · 삽 = 구덩이·지렁이(실험 compost)
//   낚싯대 = 찌·입질·놓아주기(실험 release) · 돋보기 = 곤충 관찰이 돋보기를 줌 · 흙 들여다보기 · 빗자루 = 쓸 자리가 사라지고 '오늘 깨끗이 한 곳'이 늚 · ☰ 메뉴 🧰 · 키 안내 · 페이지 오류 0
//   브라우저는 brun.sh 한 자리로 돌림(동시에 하나)
const { chromium } = require('playwright');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), info = () => ev(() => SM_TOWN.tools.info()), toast = () => ev(() => { const t = document.getElementById('toast'); return t && t.getClientRects().length ? t.textContent : ''; });
    const closeP = () => ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); });
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? P.textContent.slice(0, 80) : ''; });
    await p.goto(URL); try { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.tools && SM_TOWN.chem && !SM_TOWN.chem.pend && window.SD2, null, { timeout: 240000 }); } catch (e) { console.log('  ✗ 마을·도구가 안 뜸 — ' + JSON.stringify(await ev(() => ({ town: !!window.SM_TOWN, tools: !!(window.SM_TOWN && SM_TOWN.tools), chem: !!(window.SM_TOWN && SM_TOWN.chem) }))) + ' · 오류 ' + errs.slice(0, 4).join(' | ')); throw e; } await W8(1500);
    await closeP(); await p.keyboard.press('Escape'); await W8(800);
    await ev(() => { const G = typeof SM_TOWN.game === 'function' ? SM_TOWN.game() : SM_TOWN.game; window.__G = G.S ? G : { S: G }; if (window.__G.setClock) window.__G.setClock(false); __G.S.min = 12 * 60; if (SD2.map.time) SD2.map.time('day'); });
    await ev(() => SM_TOWN.rules && SM_TOWN.rules.wx('clear'));
    const tp = (x, z, face) => ev(([x9, z9, f9]) => { SD2.map.player.teleport([x9, SM_TOWN.ground(x9, z9) + 0.05, z9]); if (f9 != null) SD2.map.player.face(f9); }, [x, z, face]);
    const faceTo = (x, z) => ev(([x9, z9]) => { const me = SD2.map.player.get(); SD2.map.player.lookAt([x9, z9]); return Math.hypot(x9 - me.x, z9 - me.z); }, [x, z]);
    const aim = (x, z) => ev(([x9, z9]) => SM_TOWN.tools.aim(x9, z9), [x, z]);
    const settle = async () => { for (let i = 0; i < 20; i++) { if (await panel()) { await closeP(); await p.keyboard.press('Escape'); } const q = await info(); if (!q.ovl && !q.pend.length && !(await panel())) return; await W8(500); } };
    const holdK = async k => { await settle(); const q = await info(); if (q.shown !== k) { await p.keyboard.press('Digit' + (['can', 'shovel', 'rod', 'lens', 'broom'].indexOf(k) + 1)); await W8(450); } };
    const useF = async ms => { await p.keyboard.down('KeyF'); await W8(ms || 120); await p.keyboard.up('KeyF'); };
    let I = await info(); console.log('도구 — 가진 것 ' + I.have.join('·') + ' · 수돗가 ' + I.faucets + ' · 빗자루 자리 ' + I.stands + ' · 쓸 자리 ' + I.piles + '(' + I.mode + ')');
    ok(I.have.includes('can') && I.have.includes('shovel'), '처음부터 물뿌리개·삽');
    // ── 키·띠·메뉴 ──
    await p.keyboard.press('Digit1'); await W8(500); I = await info(); ok(I.cur === 'can' && I.shown === 'can' && I.engine === 'can', '1 = 물뿌리개 들기(손에 보임 · 엔진 hold)'); ok(I.bar, '도구 띠 보임');
    let keys = await ev(() => { const k = document.querySelector('.twn-keys'); return k ? k.textContent : ''; }); ok(/1~5/.test(keys) && /F/.test(keys), '키 안내 줄에 1~5·F — ' + keys.slice(0, 90));
    await p.keyboard.press('Digit1'); await W8(400); I = await info(); ok(!I.cur && !I.shown, '1 한 번 더 = 내려놓기');
    await p.keyboard.press('KeyF'); await W8(700); { const t9 = await panel(); ok(/장소|Places|찾/.test(t9), '도구 없이 F = 예전대로 장소 찾기 — ' + t9.slice(0, 30)); } await p.keyboard.press('Escape'); await W8(400);
    { const m = await ev(() => { const c = [...document.querySelectorAll('.gchip')].find(e => /메뉴|Menu/.test(e.textContent)); if (!c) return null; c.click(); const b9 = document.querySelector('.twn-p [data-tq="tools"]'); const r = !!b9; if (b9) b9.click(); return r; }); await W8(500); I = await info(); ok(m === true, '☰ 메뉴 바로 쓰기에 🧰 도구'); ok(I.bar, '🧰 누르면 띠가 펼쳐짐'); }
    // ── 💧 물뿌리개: 모닥불 끄기(규칙 fire) · 물 줄어듦 · 물방울 · 젖은 자국 ──
    { console.log('💧 물뿌리개'); await ev(() => SM_TOWN.chem.set({ relight: true, found: null })); const C = await ev(() => SM_TOWN.chem.info());
      if (!C.fires.length) ok(false, '모닥불 없음(캠핑장 없는 마을?)'); else { const F = C.fires[0]; await tp(F.x + 2.2, F.z); await faceTo(F.x, F.z); await holdK('can'); await ev(() => SM_TOWN.tools.tank(100)); await aim(F.x, F.z);
        I = await info(); ok(I.aim.lock === 'fire', '고리가 모닥불에 붙음(노랑) — ' + I.aim.lock);
        await p.keyboard.down('KeyF'); await W8(700); const mid = await info(); await W8(900); await p.keyboard.up('KeyF'); await W8(400); I = await info(); const C2 = await ev(() => SM_TOWN.chem.info());
        ok(mid.pressing && mid.drops > 5, '누르는 동안 물줄기(물방울 ' + mid.drops + ')'); ok(I.tank < 99, '물통이 줄어듦 ' + I.tank); ok(I.wet > 0, '땅에 젖은 자국 ' + I.wet);
        ok(C2.fires[0].out === 'k', '물을 뿌려 모닥불이 꺼짐(' + C2.fires[0].out + ')'); await W8(4600); ok((await ev(() => SM_TOWN.chem.info())).found.includes('fire'), '규칙 도감: 물이 불을 꺼요(fire) 알아냄'); ok((await ev(() => SM_TOWN.toolRec()))['can-fire'] >= 1, '기록 can-fire');
        await ev(() => SM_TOWN.tools.tank(0)); await p.keyboard.down('KeyF'); await W8(400); await p.keyboard.up('KeyF'); await W8(300); { const t9 = await toast(); ok(/물이 다 떨어|empty/.test(t9), '빈 물통 = 채우라는 한 줄 — ' + t9.slice(0, 40)); } await ev(() => SM_TOWN.tools.tank(100)); await aim(null); } }
    // ── ⛏ 삽: 구덩이 · 지렁이(실험 compost) ──
    { console.log('⛏ 삽'); await holdK('shovel'); I = await info(); ok(I.shown === 'shovel', '2 = 삽 들기');
      const spots = await ev(() => { const o = []; for (const f of SM_TOWN.fields()) if (['park', 'grass', 'lawn', 'farm'].includes(f.sub)) o.push([f.x, f.z]); return o; });
      let holes0 = I.holes, worm0 = I.worm, dug = 0, tries = 0;
      for (const [cx, cz] of spots) { if (dug >= 4 || tries > 40) break; for (let k = 0; k < 8 && dug < 4 && tries <= 40; k++) { tries++; const x = cx + (k % 4) * 2.2 - 3.3, z = cz + Math.floor(k / 4) * 2.4;
          await tp(x - 1.4, z); await faceTo(x, z); await aim(x, z); await useF(); await W8(250); const t0 = await toast(), a0 = await ev(() => SD2.map.player.acting); if (a0 !== 'dig') { if (tries <= 3) console.log('    못 팜: ' + t0.slice(0, 40)); continue; } await W8(1900); I = await info(); if (I.holes > holes0 + dug) { dug++; const pn = await panel(); if (pn) { await W8(200); await closeP(); await W8(300); } if (I.worm > worm0) break; } } if (I.worm > worm0) break; }
      await aim(null); I = await info(); ok(I.holes >= 1, '판 자리에 구덩이가 남음(오늘 ' + I.holes + ' · 시도 ' + tries + ')'); ok(I.worm > worm0, '지렁이가 나옴(' + I.worm + ')');
      await W8(1800); { const pn = await panel(); if (/분해자|decomposer/.test(pn)) ok(true, '처음 지렁이 = 관찰 카드(분해자)'); if (pn) await closeP(); }
      ok((await ev(() => SM_TOWN.chem.info().laws || [])).includes('compost') || (await ev(() => { const S = __G.S; return !!(S.chem && S.chem.lf && S.chem.lf.compost); })), '실험 표: 흙으로 돌아가요(compost) 알아냄');
      await ev(() => { const G = SM_TOWN.game().S; (G.quiz || (G.quiz = {})).tip = 1; }); await W8(3000);   /* '⭐ 배운 것은 수첩에' 첫 안내 알림이 학교 땅 알림을 덮지 않게 */
      const sch = await ev(() => { const r = SM_TOWN.schRect(); return r ? [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2] : null; }); if (sch) { const h0 = (await info()).holes; await tp(sch[0], sch[1]); await aim(sch[0] + 1.2, sch[1]); await useF(); await W8(600); const t9 = await toast(); ok(/학교 땅|school/.test(t9) && (await info()).holes === h0, '학교 땅은 안 팜 — ' + t9.slice(0, 30)); await aim(null); } }
    // ── 🎣 낚싯대: 부두 어부께 받기(없으면 손잡이) → 던지기 → 입질 → 당김 → 놓아주기(실험 release) ──
    { console.log('🎣 낚싯대');
      I = await info(); if (!I.have.includes('rod')) await ev(() => SM_TOWN.tools.give('rod')); await W8(1200); I = await info(); ok(I.have.includes('rod'), '낚싯대 받음'); await settle();
      const W = await ev(() => { for (let r = 40; r < 1400; r += 24) for (let a = 0; a < 48; a++) { const x = Math.cos(a / 48 * 6.2832) * r, z = Math.sin(a / 48 * 6.2832) * r; const d = SM_TOWN.sd(x, z); if (d > 1.6 && d < 3.2 && !SM_TOWN.inSchool(x, z)) { for (let b9 = 0; b9 < 16; b9++) { const u = Math.cos(b9 / 16 * 6.2832), v = Math.sin(b9 / 16 * 6.2832), wx9 = x + u * 5.5, wz9 = z + v * 5.5; if (SM_TOWN.sd(wx9, wz9) < -1.5) return { x, z, wx: wx9, wz: wz9 }; } } } return null; });
      if (!W) ok(false, '물가 자리 못 찾음'); else { await tp(W.x, W.z); await faceTo(W.wx, W.wz); await holdK('rod'); await aim(W.wx, W.wz); I = await info(); ok(I.shown === 'rod' && I.aim.ok, '3 = 낚싯대 · 고리가 물 위');
        await useF(); await W8(300); I = await info(); ok(!!I.fish, '던짐(' + (I.fish && I.fish.ph) + ')');
        for (let i = 0; i < 20 && I.fish && I.fish.ph === 'fly'; i++) { await W8(200); I = await info(); } await ev(() => SM_TOWN.tools.bite()); await W8(400); I = await info(); ok(I.fish && I.fish.ph === 'bite', '찌가 쏙(입질) — ' + (I.fish && I.fish.ph));
        await useF(); await W8(1100); { const pl = await ev(() => SM_TOWN.rules.play()); ok(!!pl && pl.k === 'rod', '누르면 줄다리기 창(FISH-2 · 일 놀이와 같은 줄 당기기) — ' + JSON.stringify(pl)); if (pl) await ev(() => SM_TOWN.rules.playEnd(3)); await W8(1000); }   /* 줄다리기 자체는 town_fish.cjs 봇이 함 */
        const pn = await panel(); ok(/낚았|caught/.test(pn), '줄다리기로 낚으면 잡음 — ' + pn.slice(0, 30));
        await ev(() => { const b9 = document.querySelector('.twn-p [data-a="rel"]'); if (b9) b9.click(); }); await W8(900); const t9 = await toast(); ok(/놓아줬|let the fish go/.test(t9), '놓아주기 한 줄 — ' + t9.slice(0, 30)); ok((await ev(() => SM_TOWN.toolRec())).release >= 1, '기록 release');
        ok(await ev(() => !!(__G.S.chem && __G.S.chem.lf && __G.S.chem.lf.release) || (SM_TOWN.chem.info().laws || []).includes('release')), '실험 표: 놓아주기(release) 알아냄');
        const dex = await ev(() => Object.keys(__G.S.dex || {}).filter(k => k.startsWith('fish:'))); ok(dex.length >= 1, '도감 🎣 낚은 물고기 ' + dex.join(',')); await aim(null); } }
    // ── 🔍 돋보기: 곤충 관찰이 돋보기를 줌 · 흙 들여다보기 ──
    { console.log('🔍 돋보기'); I = await info(); const had = I.have.includes('lens');
      await settle(); const bi = await ev(() => SM_TOWN.bugs().findIndex(s => s.b)); if (!had && bi >= 0) { await ev(i => SM_TOWN.bugLook(i), bi); await W8(500); await closeP(); await W8(800); I = await info(); ok(I.have.includes('lens'), '처음 곤충 관찰 = 돋보기 받음'); }
      else { if (!had) { console.log('    (지금 보이는 곤충 없음 — 손잡이로 받음)'); await ev(() => SM_TOWN.tools.give('lens')); } await W8(600); }
      for (let i = 0; i < 12; i++) { I = await info(); if (!I.ovl && !I.pend.length) break; await W8(500); }
      const sp = await ev(() => { const f = SM_TOWN.fields().find(q => ['park', 'grass', 'lawn', 'farm'].includes(q.sub)); return f ? [f.x, f.z] : null; });
      if (sp) { await tp(sp[0] - 1.2, sp[1]); await faceTo(sp[0], sp[1]); await holdK('lens'); await aim(sp[0], sp[1]); I = await info(); ok(I.shown === 'lens', '4 = 돋보기 들기'); await useF(); await W8(1900); const t9 = await toast(); ok(/알갱이|흙|꽃|버섯|돌|grain|soil|곤충/.test(t9) || /🔍/.test(await panel()), '들여다본 것 한 줄 — ' + t9.slice(0, 40)); if (await panel()) await closeP(); await aim(null); } }
    // ── 🧹 빗자루: 마을회관·경로당 쪽지에서 빌림(없으면 손잡이) → 쓸 자리 쓸기 ──
    { console.log('🧹 빗자루'); const ST = await ev(() => SM_TOWN.tools.stands()); I = await info();
      if (ST.length) { const s = ST[0]; await tp(s.x + 0.6, s.z + 0.6); await W8(600); await ev(() => { const h = SD2.map.interact.list({ kind: 'game' }).find(q => /빗자루|broom/i.test(q.label || '') && !q.off); if (h && h.use) h.use(); }); await W8(800); I = await info(); ok(I.have.includes('broom'), '빗자루 쪽지(E) = 빌림'); }
      else { console.log('    (마을회관·경로당 없음 — 손잡이로 받음)'); await ev(() => SM_TOWN.tools.give('broom')); await W8(500); }
      for (let i = 0; i < 12; i++) { I = await info(); if (!I.ovl && !I.pend.length) break; await W8(500); }
      let P0 = await ev(() => SM_TOWN.tools.piles());
      if (!P0.length) { await ev(() => SM_TOWN.rules && SM_TOWN.rules.season('autumn')); await W8(6000); }
      P0 = await ev(() => SM_TOWN.tools.piles()); if (!P0.length) { for (const f of await ev(() => SM_TOWN.fields())) { await tp(f.x, f.z); await W8(400); P0 = await ev(() => SM_TOWN.tools.piles()); if (P0.length) break; } }
      if (!P0.length) ok(false, '쓸 자리 없음'); else { const q = P0[0], c0 = (await info()).clean.n || 0; await tp(q.x - 1.3, q.z); await faceTo(q.x, q.z); await holdK('broom'); await aim(q.x, q.z); I = await info(); ok(I.shown === 'broom' && I.aim.lock === 'pile', '5 = 빗자루 · 고리가 쓸 자리에 붙음(' + q.mode + ')');
        await useF(); await W8(2300); I = await info(); const left = (await ev(() => SM_TOWN.tools.piles())).some(r => r.k === q.k); ok(!left, '쓴 자리가 사라짐'); ok((I.clean.n || 0) > c0, '오늘 깨끗이 한 곳 ' + c0 + ' → ' + I.clean.n); await aim(null); } }
    // ── 💧 넓은 꼭지(SPEND-1 · town_phase3.md): 물줄기 셋 → 한 번에 젖는 두둑 ≥ 2 ──
    { console.log('💧 넓은 꼭지'); await settle(); const F = await ev(() => { const S = __G.S, d = S.day, B = SM_TOWN.farm().map(f => f.bed); if (B.length < 2) return null; S.farm = B.map(() => ({ c: '🍅', d: d - 1, g: 0, w: -1 })); SM_TOWN.farmDraw(); if (!S.spend || S.spend.v !== 1) S.spend = { v: 1, can: 0, d: 0, seed: 0, used: 0, bonus: 0, at: '' }; S.spend.can = 3; SM_TOWN.tools.sync(); return B; });
      if (!F) console.log('    (두둑이 둘보다 적음)'); else { let best = null; for (const b of F) for (const x of [b[0] + 0.5, (b[0] + b[1]) / 2, b[1] - 0.5]) { const n = F.filter(c => { const px = Math.max(c[0] + 0.3, Math.min(c[1] - 0.3, x)), d = Math.hypot(px - x, c[2] - b[2]); return d < 0.9 || (d > 0.9 && d < 2.9); }).length; if (!best || n > best[0]) best = [n, x, b[2]]; }
        await tp(best[1] + 2.6, best[2]); await faceTo(best[1], best[2]); await holdK('can'); await ev(() => SM_TOWN.tools.tank(100)); await aim(best[1], best[2]); await p.keyboard.down('KeyF'); await W8(1700); I = await info(); await p.keyboard.up('KeyF'); await W8(300); await aim(null);
        ok(I.wide && I.sides.length === 2, '넓은 꼭지 = 물줄기 셋(옆 ' + I.sides.length + ')'); ok(I.pourN >= 2, '한 번 누름에 젖은 두둑 ' + I.pourN + ' (≥2)'); await ev(() => { __G.S.spend.can = 0; __G.S.farm = []; SM_TOWN.farmDraw(); SM_TOWN.tools.sync(); }); } }
    // ── 숨김: 자전거 타면 내려 둠 · 다시 내리면 손에 ──
    { await holdK('shovel'); await p.keyboard.press('KeyB'); await W8(900); I = await info(); ok(!I.shown && I.cur === 'shovel', '자전거 = 도구를 내려 둠(고른 건 기억)'); await p.keyboard.press('KeyB'); await W8(900); I = await info(); ok(I.shown === 'shovel', '내리면 다시 손에'); await p.keyboard.press('Digit2'); await W8(300); }
    // ── 비용: tick 한 번(도구 든 채) ──
    { await holdK('can'); const c = await ev(() => { const T = SM_TOWN.tools; const t0 = performance.now(); for (let i = 0; i < 200; i++) { T.aim(null); } return (performance.now() - t0) / 200; }); ok(c < 1.5, '겨눔 계산 한 번 ' + c.toFixed(3) + 'ms'); await p.keyboard.press('Digit1'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } finally { await b.close(); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
