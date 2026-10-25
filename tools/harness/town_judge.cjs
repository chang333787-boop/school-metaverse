// 🧠 판단 놀이 시험(JUDGE-1 · 10-25 사용자 '막대기 놀이 싫어 · 적지 않은 스트레스를 받아 가며 성취'): node tools/harness/town_judge.cjs [마을=ourtown] [포트=8002] [--render = 셋마다 캡처]
//   꿀 뜨기·어린 나무 심기·김 펴기 = 꾹·초록 칸 대신 세상(바람·흙·하늘)을 보고 고르는 놀이(v2/games/town_minigame.js mkComb·mkOrder·mkSpread)
//   셋마다: ① 막대·꾹 없음(zone·pg·mk 0 · 큰 꾹 단추 숨김 · E를 오래 눌러도 짧게 누른 것과 같은 판정) ② 맞는 판단만 = 점수 3·끝 ③ 틀린 판단 = 기다림(시간 비용 · 남은 시간이 그만큼 줆) · 나무는 다음 날 시듦 → 되살리기
//   ④ 잘한 판 뒤 사다리 칸 오름 + 칸이 오르면 판단이 어려워짐(꿀 = 벌통 문·여덟 자리·바람 바뀜 · 나무 = 세 그루 · 김 = 두꺼운 칸·숟갈 여유 0) ⑤ 날씨가 답을 바꿈(김 말리기 · 나무 물 양) ⑥ 페이지 오류 0
//   ⑦ 🚣 배 노 젓기(JUDGE-2 · town_boat.js): 박자 막대 X · ←→ 박자로 눌러도·연타해도 빨라지지 않음 · 물때 한가운데 = 물살 셈 · 물이 멈출 즈음 = 거의 0 · 기슭 가까이 = 약함 · 손 놓으면 물살 쪽으로 떠밀림 · 힘껏(Shift) = 빨라짐 + 팔 힘이 줄다 지침
//   브라우저 하나 · 그리기 끔(pw.cjs) · b2.sh 자리로
const { chromium, RENDER } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOT = process.env.JUDGE_SHOTS || '/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/52a18de9-e78e-4006-be4f-f54f6909d405/scratchpad/judge1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|기록 오류|모르는 놀이 갈래/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a); await p.addInitScript(() => { window.__SURP_OFF = 1; });
    if (RENDER) require('fs').mkdirSync(SHOT, { recursive: true });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.lad && SM_TOWN.rules && SM_TOWN.mgDbg && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(500);
    await ev(() => { const G = SM_TOWN.game(); window.__G = G; G.setClock(false); G.S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); if (G.S.wx) G.S.wx.auto = false; SM_TOWN.rules.season('spring');
      window.__clean = () => { for (let k = 0; k < 4; k++) { if (SM_TOWN.rules.play()) SM_TOWN.rules.playEnd(0); const P = document.querySelector('.twn-p'); if (!P) break; const b9 = P.querySelector('[data-a="x"]'); if (b9) b9.click(); else break; } }; });
    const has = await ev(L => L.filter(k => SM_TOWN.workers().some(w => w[4] === k) || (k === 'seaweed' && SD2.map.interact.list().some(q => /김 펴서 말리기|Spread laver/.test(q.label)))), ['beehive', 'lumber', 'seaweed']); console.log('이 판의 판단 놀이: ' + has.join(', '));
    const D = () => ev(() => SM_TOWN.mgDbg());
    const open = (k, lv) => ev(([k9, lv9]) => { __clean(); const S = __G.S; S.uses = {}; S.rw = {}; S.min = 11 * 60; if (!S.lad) S.lad = {}; if (!S.lad.mg) S.lad.mg = {}; S.lad.mg[k9] = { lv: lv9, z: 0, n: 0, best: null, last: null };
      window.__K = k9; if (!SM_TOWN.play(k9)) { const h = SD2.map.interact.list().find(q => /김 펴서 말리기|Spread laver/.test(q.label)); if (k9 !== 'seaweed' || !h) return null; h.use(); }
      if (!SM_TOWN.mgDbg()) return null; const el = [...document.querySelectorAll('.twn-play')].pop(), go = el && el.querySelector('.go'); return { dbg: SM_TOWN.mgDbg(), bars: el ? el.querySelectorAll('.zone,.pg,.mk').length : -1, goHidden: !go || go.style.display === 'none', lab: (el.querySelector('.mglad') || {}).textContent || '', head: (el.querySelector('small') || {}).textContent || '' }; }, [k, lv]);
    const tap = sel => p.locator('.twn-play ' + sel).last().click({ force: true, timeout: 4000 });
    const until = async (f, ms = 8000) => { const t0 = Date.now(); let d = null; while (Date.now() - t0 < ms) { d = await D(); if (!d || f(d)) return d; await W8(120); } return d; };
    const ended = () => ev(() => { const L = SM_TOWN.lad().play; if (L && !L.done) return null; const k9 = window.__K, R = k9 && __G.S.lad && __G.S.lad.mg[k9]; return { done: true, g: L && L.rec && L.rec.last ? L.rec.last.g : R && R.last ? R.last.g : null }; });
    const waitEnd = async (ms = 12000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const e = await ended(); if (e) return e; await W8(150); } return null; };
    const lvOf = k => ev(k9 => (__G.S.lad.mg[k9] || {}).lv, k);
    const msg = () => ev(() => { const el = [...document.querySelectorAll('.twn-play')].pop(); return el ? (el.querySelector('.msg') || {}).textContent || '' : ''; });
    const shot = async n => { if (!RENDER) return; await W8(400); try { await p.locator('.twn-play').last().screenshot({ path: SHOT + '/' + n + '.png' }); console.log('    📷 ' + n + '.png'); } catch (e) { console.log('    (캡처 못 함 ' + e.message.slice(0, 60) + ')'); } };
    const common = (k, o) => { ok(!!o && !!o.dbg, k + ' 놀이 창 열림'); if (!o) return false; ok(o.bars === 0 && o.goHidden, k + ' 막대·꾹 없음(zone·pg·mk ' + o.bars + ' · 큰 단추 숨김 ' + o.goHidden + ') · 「' + o.head + '」'); return true; };

    // ── 🍯 꿀 뜨기 ──
    if (has.includes('beehive')) { console.log('🍯 꿀 뜨기 — 바람과 벌 판단');
      const combRun = async (wrong, pokeBee) => { let d = await D(); const left0 = d.left; let waited = 0, lost = 0;
        for (let w = 0; w < wrong; w++) { d = await D(); const bad = d.spots.find(s => !d.ok.includes(s)); const l1 = d.left; await tap('.spot[data-p="' + bad + '"]'); await W8(150); const d2 = await D(); ok(d2.ph === 'stand' && d2.lock > 2 && d2.err === w + 1, '  틀린 자리(' + bad + ' · 바람 ' + d.wind + ' → 등질 쪽 ' + d.up + (d.door >= 0 ? ' · 문 ' + d.door : '') + ') = 벌이 흩어져 기다림 ' + d2.lock + '초 · 「' + (await msg()).slice(0, 40) + '」');
          const d3 = await until(q => q.lock === 0); lost += l1 - d3.left; waited += d2.lock; }
        const stand = async () => { d = await D(); await tap('.spot[data-p="' + d.ok[0] + '"]'); return until(q => q.ph === 'comb'); };
        d = await D(); if (d.ph !== 'comb') d = await stand(); if (!d || d.ph !== 'comb') return { fail: 'stand' };
        if (pokeBee && d.bees.length) { await tap('.gc[data-i="' + d.bees[0] + '"]'); await W8(120); const d2 = await D(); ok(d2.lock > 1.5 && d2.err >= 1, '  벌이 모인 칸 = 벌이 옮겨 가고 기다림 ' + d2.lock + '초'); await until(q => q.lock === 0); }
        for (let n = 0; n < 80; n++) { const e = await ended(); if (e) return { ...e, left0, waited, lost, d }; d = await D(); if (!d) break; if (d.ph === 'turn') { await until(q => q.ph === 'stand'); d = await stand(); continue; } if (d.ph === 'stand') { d = await stand(); continue; }
          if (d.lock > 0) { await W8(150); continue; } const i = d.kinds.findIndex((q, j) => q === 'cap' && !d.got[j] && !d.bees.includes(j)); if (i < 0) { await W8(300); continue; } await tap('.gc[data-i="' + i + '"]'); await W8(90); }
        return { ...(await waitEnd()), left0, waited, lost, d }; };
      // 맞는 판단만(1칸) — 키보드로 자리 고르기 + E를 1.5초 꾹(오래 눌러도 판정이 같음)
      let o = await open('beehive', 1); if (common('beehive', o)) { const d0 = o.dbg; ok(d0.spots.length === 4 && d0.door < 0 && d0.ok.length === 1 && d0.ok[0] === (d0.wind + 4) % 8, '1칸 = 네 자리 · 문 없음 · 답 = 바람이 불어오는 쪽(바람 ' + d0.wind + ' → ' + d0.ok[0] + ')');
        await shot('comb_1_stand'); const pn = await ev(() => [...document.querySelectorAll('.twn-p,.twn-dlg,.twn-lvup')].map(e => e.className).join(' ')); if (pn) console.log('    (열린 창: ' + pn + ')');
        await W8(400); const t = d0.spots.indexOf(d0.ok[0]);   /* 창을 연 뒤 0.25초 안의 E는 시도로 안 셈(town.js) */ for (let i = 0; i < t; i++) { await p.keyboard.press('ArrowRight'); await W8(60); } await p.keyboard.down('KeyE'); await W8(1500); await p.keyboard.up('KeyE');
        const d1 = await until(q => q.ph === 'comb'); ok(d1 && d1.ph === 'comb' && d1.err === 0, 'E를 1.5초 꾹 = 한 번 누른 것과 같음(벌 판으로 · 틀림 ' + (d1 && d1.err) + ')'); await shot('comb_2_frame');
        const r = await combRun(0, false); ok(r && r.done && r.g === 3, '맞는 판단만 = 점수 ' + (r && r.g) + ' · 끝'); ok((await lvOf('beehive')) === 2, '잘한 판 뒤 사다리 2칸'); }
      // 틀린 자리 둘 + 벌 칸 = 시간 비용
      o = await open('beehive', 2); if (o && o.dbg) { const d0 = o.dbg; ok(d0.door >= 0 && !d0.ok.includes(d0.door), '2칸 = 벌통 문(' + d0.door + ') · 문 앞은 답이 아님 · 「' + o.lab + '」');
        const r = await combRun(2, true); ok(r.lost >= r.waited * 0.8, '틀린 판단 = 남은 시간이 기다린 만큼 줆(' + r.lost.toFixed(1) + '초 / 기다림 ' + r.waited.toFixed(1) + '초)'); ok(r.done && r.g != null && r.g < 3, '틀린 판의 점수 ' + r.g + ' (< 3)'); }
      // 3칸 = 여덟 자리 · 도중에 바람이 바뀜
      o = await open('beehive', 3); if (o && o.dbg) { const w0 = o.dbg.wind; ok(o.dbg.spots.length === 8 && o.dbg.NB === 4, '3칸 = 여덟 자리 · 벌 무리 ' + o.dbg.NB + ' · 「' + o.lab + '」');
        const r = await combRun(0, false); ok(r.d && r.d.turned && r.d.wind !== w0, '도중에 바람이 바뀜(' + w0 + ' → ' + (r.d && r.d.wind) + ') → 다시 서기'); ok(r.done, '바람이 바뀌어도 끝까지(점수 ' + r.g + ')'); }
      await ev(() => __clean()); await W8(400); }

    // ── 🌲 어린 나무 심기 ──
    if (has.includes('lumber')) { console.log('🌲 어린 나무 심기 — 흙 보고 깊이·물');
      const treeRun = async plan => { let n = 0; for (let s = 0; s < 120; s++) { const e = await ended(); if (e) return e; const d = await D(); if (!d) break;
          if (d.ph === 'order') { if (d.lock > 0) { await W8(150); continue; } if (plan.wrongCard && !plan._wc) { plan._wc = 1; const wc = d.cards.find(x => x !== d.st); await tap('[data-s="' + wc + '"]'); await W8(120); const d2 = await D(); ok(d2.lock > 1 && d2.miss === 1, '  차례 틀림 = 잠깐 손이 멈춤 ' + d2.lock + '초'); continue; } await tap('[data-s="' + d.st + '"]'); await W8(120); continue; }
          if (d.ph === 'depth') { const q = plan.depth && plan.depth[n] != null && !d.rv ? plan.depth[n] : 0; if (plan.shot) { await shot('tree_1_depth'); plan.shot = 0; } await tap('[data-q="' + q + '"]'); await W8(150); continue; }
          if (d.ph === 'water') { const w = plan.water && plan.water[n] != null && !d.rv ? plan.water[n](d.need) : d.need; if (plan.wshot) { await shot('tree_2_water'); plan.wshot = 0; } await tap('[data-w="' + w + '"]'); await W8(150); n += d.rv ? 0 : 1; continue; }
          await W8(200); } return waitEnd(); };
      const mem = () => ev(() => JSON.parse(JSON.stringify(__G.S.mgj || {})));
      const day0 = await ev(() => { __G.S.mgj = {}; return __G.S.day; });
      let o = await open('lumber', 1); if (common('lumber', o)) { ok(o.dbg.n === 2 && o.dbg.old.length === 0, '1칸 = 나무 둘 · 시든 나무 없음');
        const r = await treeRun({ wrongCard: 1, depth: [-1, 0], water: [null, need => (need + 1) % 3], shot: 1, wshot: 1 }); const M = await mem(), K = Object.keys(M)[0], R = K && M[K];
        ok(r && r.done && r.g <= 1, '틀린 판단(얕게 · 물 양) = 점수 ' + (r && r.g)); ok(!!R && R.d === day0 && R.w.length === 2 && R.w[0] === 'up', '잘못 심은 두 그루가 남음(' + JSON.stringify(R) + ')'); }
      o = await open('lumber', 1); if (o && o.dbg) { ok(o.dbg.old.length === 0, '같은 날엔 아직 안 시듦(내일 보임)'); const r = await treeRun({}); ok(r && r.done && r.g === 3, '맞는 판단만 = 점수 ' + (r && r.g)); ok((await lvOf('lumber')) === 2, '잘한 판 뒤 사다리 2칸'); const R = Object.values(await mem())[0]; ok(R && R.w.length === 2, '오늘 잘못 심은 것은 그대로 남음(' + (R && R.w.length) + ')'); }
      await ev(d => { __G.S.day = d + 1; }, day0);
      o = await open('lumber', 1); if (o && o.dbg) { const wl = await ev(() => !!document.querySelector('.twn-play .sap.wl')); ok(o.dbg.old.length === 2 && o.dbg.rv && wl, '다음 날 = 시든 나무 둘부터(' + o.dbg.old.join(',') + ') · 시든 묘목 그림 ' + wl); await shot('tree_3_wilted');
        const r = await treeRun({}); const R = Object.values(await mem())[0]; ok(r && r.done && r.g === 3, '되살리고 새로 심기 = 점수 ' + (r && r.g)); ok(R && R.w.length === 0 && R.d === day0 + 1, '알맞게 돌보면 시든 나무가 사라짐(' + JSON.stringify(R) + ')'); }
      // 날씨 = 답이 바뀜(비 오면 한 컵 덜)
      await ev(() => SM_TOWN.rules.wx('rain')); o = await open('lumber', 4); if (o && o.dbg) { ok(o.dbg.n === 3 && o.dbg.rain, '4칸 = 나무 셋 · 비 오는 날 · 「' + o.lab + '」'); const d = await until(q => q.ph === 'water' || q.ph === 'end', 1); void d;
        let seen = 0, okN = 0; for (let s = 0; s < 120 && seen < 3; s++) { const e = await ended(); if (e) break; const q = await D(); if (q.ph === 'water') { seen++; if (q.need === Math.max(0, 2 - q.m - 1)) okN++; await tap('[data-w="' + q.need + '"]'); await W8(150); continue; } if (q.ph === 'order' && q.lock <= 0) { await tap('[data-s="' + q.st + '"]'); await W8(120); continue; } if (q.ph === 'depth') { await tap('[data-q="0"]'); await W8(150); continue; } await W8(200); }
        ok(seen === 3 && okN === 3, '비 오는 날 물 양 = 흙 색 − 한 컵(' + okN + '/' + seen + ')'); await waitEnd(); }
      await ev(() => SM_TOWN.rules.wx('clear')); await ev(() => __clean()); await W8(400); }

    // ── 🌿 김 펴기 ──
    if (has.includes('seaweed')) { console.log('🌿 김 펴기 — 고르게 펴기 + 말릴 자리');
      const cellSel = i => '.mat i:nth-of-type(' + (i + 1) + ')';
      const sheetPerfect = async (mist) => { let d = await D(); if (mist) { const i = d.h.findIndex(v => v === 2); await tap(cellSel(i)); await W8(100); const d2 = await D(); ok(d2.h[i] === 3 && d2.mis === 1, '  알맞은 칸에 부음 = 두꺼워짐(되돌릴 수 있음)'); await p.keyboard.press('Enter'); await W8(150); return; }
        for (let i = 0; i < 25; i++) if (d.h[i] === 3) { await tap(cellSel(i)); await W8(70); }
        d = await D(); for (let i = 0; i < 25; i++) for (let k = d.h[i]; k < 2; k++) { await tap(cellSel(i)); await W8(70); } };
      const dryRun = async (wrongDry) => { const d = await until(q => q.ph === 'dry' || q.ph === 'end', 3000); if (!d || d.ph !== 'dry') return 0; let lost = 0;
        if (wrongDry) { const bad = [0, 1, 2].find(i => !d.dryOk.includes(i)); const l1 = d.left; await tap('[data-d="' + bad + '"]'); await W8(120); const d2 = await D(); ok(d2.lock > 2 && d2.ph === 'dry', '  틀린 말릴 자리(' + bad + ' · 하늘 ' + d.sky + ') = 다시 옮기느라 기다림 ' + d2.lock + '초 · 「' + (await msg()).slice(0, 36) + '」'); const d3 = await until(q => q.lock === 0); lost = l1 - d3.left; }
        await tap('[data-d="' + d.dryOk[0] + '"]'); await until(q => q.ph !== 'dry'); return lost; };
      let o = await open('seaweed', 1); if (common('seaweed', o)) { const d0 = o.dbg; const need = d0.h.reduce((s, v) => s + Math.max(0, 2 - v), 0); ok(d0.TK === 0 && d0.bowl === need + 2, '1칸 = 두꺼운 칸 없음 · 숟갈 ' + d0.bowl + ' = 필요 ' + need + ' + 여유 2'); ok(JSON.stringify(d0.dryOk) === (d0.sky === 'clear' ? '[0]' : d0.sky === 'cloud' ? '[0,1]' : '[1]'), '오늘 하늘의 말릴 곳 = ' + JSON.stringify(d0.dryOk) + '(하늘 ' + d0.sky + ')'); await shot('seaweed_1_mat');
        for (let s = 0; s < 3; s++) { await until(q => q.ph === 'spread' || q.ph === 'end', 3000); if (await ended()) break; await sheetPerfect(false); if (s === 0) await shot('seaweed_2_dry'); await dryRun(false); }
        const r = await waitEnd(); ok(r && r.done && r.g === 3, '맞는 판단만 = 고른 장 셋 · 점수 ' + (r && r.g)); ok((await lvOf('seaweed')) === 2, '잘한 판 뒤 사다리 2칸'); }
      // 틀린 판단: 알맞은 칸에 붓고 그대로 내기 + 틀린 말릴 자리
      o = await open('seaweed', 2); if (o && o.dbg) { ok(o.dbg.TK === 2, '2칸 = 두꺼운 칸 ' + o.dbg.TK + ' · 「' + o.lab + '」'); await sheetPerfect(true); const d = await D(); ok(d.ph === 'dry', '  덜 고른 장도 말리기로(점: ' + d.good + '장 좋음)'); const lost = await dryRun(true); ok(lost >= 2, '틀린 말릴 자리 = 남은 시간이 ' + lost.toFixed(1) + '초 줆');
        for (let s = 1; s < 3; s++) { await until(q => q.ph === 'spread' || q.ph === 'end', 3000); if (await ended()) break; await sheetPerfect(false); await dryRun(false); }
        const r = await waitEnd(); ok(r && r.done && r.g === 2, '틀린 장 하나 = 점수 ' + (r && r.g)); }
      // 3칸: 숟갈 여유 0(두꺼운 곳에서 덜어야만 됨) · 비 오는 날 = 처마 밑
      await ev(() => SM_TOWN.rules.wx('rain')); o = await open('seaweed', 3); if (o && o.dbg) { const d0 = o.dbg, need = d0.h.reduce((s, v) => s + Math.max(0, 2 - v), 0); ok(d0.TK === 3 && d0.bowl === need - 3, '3칸 = 숟갈 ' + d0.bowl + ' < 필요 ' + need + '(두꺼운 칸 셋에서 덜어야 함)'); ok(d0.sky === 'rain' && JSON.stringify(d0.dryOk) === '[1]', '비 오는 날 말릴 곳 = 처마 밑만');
        await sheetPerfect(false); const d1 = await until(q => q.ph === 'dry', 3000); ok(d1 && d1.ph === 'dry' && d1.good === 1, '덜어 와서 고르게 = 첫 장 좋음'); await dryRun(false); await ev(() => __clean()); }
      await ev(() => SM_TOWN.rules.wx('clear')); await W8(400); }


    // ── 🚣 배 노 젓기(JUDGE-2) ──
    { const hb = await ev(() => { const h = SD2.map.interact.list().find(q => /^⛵ 배 타기|^⛵ Board/.test(q.label)); return h ? [h.x, h.z] : null; });
      if (!hb) console.log('🚣 이 마을엔 배가 없음 — 건너뜀'); else { console.log('🚣 배 노 젓기 — 물때·바람 보고 방향·힘');
        await ev(() => __clean()); await ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, hb); await W8(600); await ev(() => SM_TOWN.boatGo(true)); await W8(700);
        const BX = () => ev(() => { const X = SM_TOWN.boatx(); return { rv: X.rv, cur: X.cur }; }), BO = () => ev(() => SM_TOWN.boat());
        ok((await BO()).on, '배 탐'); const hudT = await ev(() => { const h = document.querySelector('.twn-row'); return h ? { bar: h.querySelectorAll('.bt,.mk,.ok').length, t: (h.querySelector('.rl') || {}).textContent || '', b: (h.querySelector('button') || {}).textContent || '' } : null; });
        ok(hudT && hudT.bar === 0 && /물때/.test(hudT.t) && /힘껏/.test(hudT.b), '박자 막대 X · 물때 줄 「' + (hudT && hudT.t) + '」 · 단추 「' + (hudT && hudT.b) + '」');
        for (let i = 0; i < 6; i++) { await p.keyboard.press(i % 2 ? 'ArrowRight' : 'ArrowLeft'); await W8(700); } const r1 = (await BX()).rv; for (let i = 0; i < 16; i++) { await p.keyboard.press(i % 2 ? 'ArrowRight' : 'ArrowLeft'); await W8(60); } const r2 = (await BX()).rv;
        ok(r1 === 0 && r2 === 0, '←→ 박자(0.7초)로 눌러도 · 연타해도 노 빠르기 0(' + r1 + ' · ' + r2 + ') — 박자 판정 X');
        const tideAt = k => ev(k9 => { const G = SM_TOWN.game().S, P = 745, lo = 300 + ((G.day * 50 + 250) % P); for (const c of [lo + k9 * P / 4, lo + k9 * P / 4 + P, lo + k9 * P / 4 - P]) if (c >= 400 && c <= 1380) { G.min = Math.round(c); return G.min; } G.day++; return null; }, k);
        let tm = await tideAt(1); for (let i = 0; i < 4 && tm == null; i++) tm = await tideAt(1);
        const far = await ev(() => { const B = SM_TOWN.boat(), X = SM_TOWN.boatx(), sd = SM_TOWN.seaSd || null; void sd; const c = X.curAt(B.x, B.z); return { c, x: B.x, z: B.z }; });
        ok(far.c.fl === 1 && far.c.sp > 0.2, '물때 한가운데(밀물 · ' + tm + '분) = 물살 ' + far.c.sp.toFixed(2) + 'm/초 · 기슭 배수 ' + far.c.f.toFixed(2));
        const ebb = await (async () => { await tideAt(3); return ev(() => { const B = SM_TOWN.boat(); return SM_TOWN.boatx().curAt(B.x, B.z); }); })(); ok(ebb.fl === -1 && Math.abs(ebb.x + far.c.x) < 0.05 && Math.abs(ebb.z + far.c.z) < 0.05, '썰물 = 같은 자리에서 반대로 흐름');
        await tideAt(0); const sl = await ev(() => { const B = SM_TOWN.boat(); return SM_TOWN.boatx().curAt(B.x, B.z); }); ok(sl.fl === 0 && sl.sp < 0.3, '물이 다 빠질 즈음 = 물살 거의 멈춤(' + sl.sp.toFixed(2) + ')');
        await tideAt(1);
        // 먼바다 쪽으로 저어 나감(W 4초) → 손 놓고 떠밀림 재기
        await p.keyboard.down('KeyW'); await W8(4000); await p.keyboard.up('KeyW'); for (let i = 0; i < 30 && (await BO()).v > 0.3; i++) await W8(200);
        const b0 = await BO(), c0 = await ev(() => { const B = SM_TOWN.boat(); return SM_TOWN.boatx().curAt(B.x, B.z); }); await W8(2500); const b1 = await BO(), mv = (b1.x - b0.x) * c0.x + (b1.z - b0.z) * c0.z;
        ok(mv > c0.sp * 2.5 * 0.5 || c0.sp < 0.3, '손 놓으면 물살 쪽으로 떠밀림(' + mv.toFixed(2) + 'm / 물살 ' + c0.sp.toFixed(2) + 'm/초 · 기슭 배수 ' + c0.f.toFixed(2) + ')');
        ok(c0.f > far.c.f + 0.3, '기슭에서 멀수록 물살 셈(선착장 곁 ' + far.c.f.toFixed(2) + '배 · 저어 나간 곳 ' + c0.f.toFixed(2) + '배) → 거슬러 갈 땐 기슭 가까이');
        // 힘껏 = 빨라짐 + 팔 힘이 줄다 지침
        await p.keyboard.down('KeyW'); await p.keyboard.down('ShiftLeft'); await W8(1500); const h1 = await BX(); await W8(5600); const h2 = await BX(); await p.keyboard.up('ShiftLeft'); await W8(600); const h3 = await BX(); await p.keyboard.up('KeyW');
        ok(h1.rv > 1.5 && h1.cur.arm < 6, '힘껏(W + Shift) = 노 빠르기 +' + h1.rv.toFixed(1) + ' · 팔 힘 ' + h1.cur.arm); ok(h2.cur.tired > 0 || h3.cur.tired > 0, '6초 넘게 힘껏 = 팔이 지침(잠깐 느려짐 · ' + h2.cur.tired + ')'); ok(h3.rv < h1.rv, '지친 동안 = 힘껏이 안 됨(' + h3.rv.toFixed(2) + ')');
        await ev(() => SM_TOWN.boatGo(false)); await W8(500); ok(!(await BO()).on && !(await ev(() => !!document.querySelector('.twn-row'))), '배에서 내림 = 물때 줄 치움'); } }
    // 다른 길(사다리 하네스와 같은 끝내기 손잡이)도 그대로
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' · ' + errs.slice(0, 4).join(' / ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); } finally { await b.close(); }
  console.log((fails.length ? '✗ 실패 ' + fails.length : '✓ 모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
