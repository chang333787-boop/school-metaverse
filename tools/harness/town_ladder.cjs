// 📈 일 놀이 도전 사다리 + 내 최고 시험(LADDER-2 · v2/games/town_lad.js): node tools/harness/town_ladder.cjs [마을=ourtown] [포트=8002]
//   일 놀이마다 다섯 판 연달아(잘함 셋 → 아쉬움 둘): ① 칸이 1 → 2 → 3 → 4로 오름 ② 조건 값(lp)이 칸마다 바뀜 ③ 창 위 한 줄이 '도전 n칸'
//   ④ 내 최고: 첫 기록 → 높은 칸 = 새 최고(연출) → 아쉬움 = 그대로(유지) ⑤ 아쉬움 두 판 = 한 칸 내려감 ⑥ 낚시·소금 = 자기 사다리(기록만)
//   ⑦ 보상 하루 한도 그대로(같은 점수면 1칸·3칸 받는 것이 같음 · 넷째 판부터 연습) ⑧ 수첩 솜씨 칸에 놀이별 최고 ⑨ 페이지 오류 0
//   ⑨ HARD-1 명인 칸: 도전가 둘째 표지판 전 = 칸 4 위로 안 감 · 표지판을 지나면 열림(S.lad.m5 · 그 자리 한 줄) · 칸 4 잘함 = 그대로 · 아주 잘함 = 명인 칸
//      명인 칸 판이 일곱 갈래(투호·모내기·벼 베기·꿀·배 봉지·나무 심기·김)마다 열리고 그 판단이 들어 있고(dbg) 몇 번 눌러도 오류 없이 끝남 · 나머지 갈래는 칸 4가 끝 · 기록 = '명인 칸'
//   브라우저 하나 · 그리기 끔(pw.cjs) · b2.sh 자리로
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const GEN = ['strawberry', 'shiitake', 'cabbage', 'potato', 'clam', 'beehive', 'pear', 'lumber', 'seaweed', 'oyster', 'pasture', 'paddy'], OWN = ['fisher', 'saltpan'];
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|기록 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a); await p.addInitScript(() => { window.__SURP_OFF = 1; });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.lad && SM_TOWN.rules && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(500);
    await ev(() => { const G = SM_TOWN.game(); window.__G = G; G.setClock(false); G.S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); if (G.S.wx) G.S.wx.auto = false; SM_TOWN.rules.season('spring');
      window.__clean = () => { try { const H9 = SM_TOWN.herd && SM_TOWN.herd(); if (H9 && H9.stop) H9.stop('reset'); } catch (e) { /* 없음 */ } for (let k = 0; k < 4; k++) { if (SM_TOWN.rules.play()) SM_TOWN.rules.playEnd(0); const P = document.querySelector('.twn-p'); if (!P) break; const b9 = P.querySelector('[data-a="x"]'); if (b9) b9.click(); else break; } };
      window.__low = () => { const sh = SM_TOWN.shore && SM_TOWN.shore(); if (!sh || !sh.low) return true; for (let m = 0; m < 24 * 60; m += 20) { __G.S.min = m; if (sh.low()) return true; } return false; }; });
    const has = await ev(L => L.filter(k => SM_TOWN.workers().some(w => w[4] === k)), GEN.concat(OWN)), hasT = await ev(() => SM_TOWN.workers().some(w => w[4] === 'tuho'));
    console.log('이 판의 일 놀이: ' + has.join(', '));
    // 한 판: 열고(칸·값·한 줄) → 점수·모은 수로 끝 → 끝 창 기록 줄 → 닫기
    const one = (k, sc, n) => ev(([k9, s9, n9]) => { __clean(); if (k9 === 'clam') __low(); else __G.S.min = 11 * 60; const b0 = { ...__G.S.bag }; if (!SM_TOWN.play(k9)) return { none: 1 }; const L = SM_TOWN.lad(); if (!L.play) return { none: 2 };
      const o = { lv: L.play.lv, lp: L.play.lp, lab: L.play.lab, pr: L.play.pr, kind: L.play.kind }; L.finish(s9, n9); const L2 = SM_TOWN.lad(); o.rec = L2.play && L2.play.rec; o.recEl = L2.play ? L2.play.recEl : ''; { const w9 = [...document.querySelectorAll('.twn-play')].pop(); o.neuCls = !!(w9 && w9.querySelector('.mgrec.neu')); }   /* 앞 판 창은 0.25초 뒤에 지워짐 → 이번 창만 */
      SM_TOWN.playEnd(s9); const d = {}; for (const e of Object.keys(__G.S.bag)) { const v = (__G.S.bag[e] || 0) - (b0[e] || 0); if (v > 0) d[e] = v; } o.got = d; o.st = SM_TOWN.lad().mg[k9 === 'paddy' ? o.kind : k9]; return o; }, [k, sc, n]);
    const fresh = k => ev(k9 => { const S = __G.S; S.uses = {}; S.rw = {}; S.hearts = {}; if (S.lad && S.lad.mg) { delete S.lad.mg[k9]; delete S.lad.mg.plant; delete S.lad.mg.cut; } if (k9 === 'fisher') S.fishL = { lv: 1, good: 0, n: 0, log: {} }; }, k);
    const feel0 = await ev(() => SM_TOWN.feel().info().g.best.fx);
    // ── ①~⑤ 일 놀이마다 다섯 판 ──
    console.log('①~⑤ 일 놀이마다 다섯 판(잘함 셋 → 아쉬움 둘)');
    for (const k of has.filter(q => GEN.includes(q))) { await fresh(k); const R = [];
      for (const [sc, n] of [[3, 5], [3, 3], [3, 4], [0, 9], [0, 0]]) { R.push(await one(k, sc, n)); await W8(60); }
      if (R.some(r => r.none)) { ok(false, k + ' — 놀이가 안 열림 ' + JSON.stringify(R.map(r => r.none || 0))); continue; }
      const lvs = R.map(r => r.lv), lps = R.map(r => r.lp), end = R[4].st;
      ok(lvs.join() === '1,2,3,4,4', k + ' 칸 ' + lvs.join('→') + ' · 아쉬움 둘 뒤 ' + end.lv + '칸');
      ok(end.lv === 3, k + ' 아쉬움 두 판 = 한 칸 내려감(4 → ' + end.lv + ')');
      ok(lps[0] !== lps[1] && lps[1] !== lps[2] && lps[2] !== lps[3], k + ' 조건 값 ' + lps.join(' → ') + ' (' + R[1].lab + ')');
      ok(/도전 1칸/.test(R[0].lab) && /도전 3칸: /.test(R[2].lab), k + ' 창 위 한 줄 「' + R[2].lab + '」');
      const nf = R.map(r => (r.rec ? (r.rec.neu ? 'N' : '-') : '0')).join('');
      ok(nf === '-NN--' && R[1].neuCls && !R[3].neuCls, k + ' 내 최고 첫 기록 → 새 최고 둘 → 유지 둘(' + nf + ')');
      ok(end.best && end.best.lv === 4 ? false : end.best && end.best.lv === 3 && end.best.n === 4, k + ' 남은 최고 = ' + JSON.stringify(end.best) + ' · 지난 = ' + JSON.stringify(end.last));
      ok(/내 최고/.test(R[3].recEl) && /새 내 최고/.test(R[1].recEl), k + ' 끝 창 「' + R[3].recEl.slice(0, 60) + '」'); }
    // ── ⑥ 낚시·소금 = 자기 사다리 · 기록만 ──
    console.log('⑥ 낚시·소금(자기 사다리 · 기록만)');
    for (const k of has.filter(q => OWN.includes(q))) { await fresh(k); const R = []; for (const [sc, n] of [[3, 2], [3, 3], [3, 1], [0, 0]]) { R.push(await one(k, sc, n)); await W8(60); }
      if (R.some(r => r.none)) { ok(false, k + ' — 놀이가 안 열림'); continue; }
      const end = R[3].st; ok(!!(end && end.best && end.n === 4), k + ' 기록 ' + end.n + '판 · 최고 ' + JSON.stringify(end.best) + ' · 칸 ' + R.map(r => r.lv).join('→'));
      if (k === 'fisher') { await ev(() => { __G.S.fishL.lv = 3; }); const r = await one(k, 3, 2); ok(r.lv === 3 && /도전 3칸: 물때/.test(r.lab), '낚시 칸 = 낚시 사다리(fishL) 그대로 · 「' + r.lab + '」'); } }   /* 낚시 칸 오름은 줄 낚시 판 안(fishAfter)에서 셈 — 시험 끝내기는 그 길을 안 지나므로 칸만 맞춰 봄 */
    // ── ⑦ 보상 하루 한도 그대로 ──
    console.log('⑦ 보상 = 칸과 상관없음 · 하루 한도 그대로');
    { const k = has.includes('strawberry') ? 'strawberry' : has[0];
      await fresh(k); const a = await one(k, 3, 8); await fresh(k); await ev(k9 => { const S = __G.S; S.lad.mg[k9] = { lv: 3, z: 0, n: 2, best: null, last: null }; }, k); const c = await one(k, 3, 8);
      ok(a.lv === 1 && c.lv === 3 && JSON.stringify(a.got) === JSON.stringify(c.got), k + ' 같은 점수: 1칸 ' + JSON.stringify(a.got) + ' = 3칸 ' + JSON.stringify(c.got));
      await fresh(k); const P = []; for (let i = 0; i < 6; i++) P.push(await one(k, 3, 5)); const real = P.filter(r => !r.pr).length, gotN = P.reduce((s9, r) => s9 + Object.values(r.got).reduce((x, y) => x + y, 0), 0);
      ok(real <= 4 && P[5].pr, k + ' 여섯 판 = 받는 판 ' + real + ' · 연습 ' + (6 - real) + ' · 받은 물건 ' + gotN + ' (칸 ' + P.map(r => r.lv).join('→') + ')'); }
    // ── ⑧ 수첩 ──
    console.log('⑧ 수첩 솜씨 칸');
    { const h = await ev(() => { SM_TOWN.openSkills(); const P = document.querySelector('.twn-p'); const t = P ? [...P.querySelectorAll('[data-lad]')].map(e => e.textContent) : []; __clean(); return t; });
      ok(h.length >= Math.min(3, has.length) && h.every(t => /내 최고/.test(t) && /지금 (도전|명인)/.test(t)), '일 놀이 기록 ' + h.length + '줄 · 「' + (h[0] || '').slice(0, 70) + '」'); }
    // ── ⑨ HARD-1 명인 칸 ──
    console.log('⑨ 명인 칸(도전가 둘째 표지판)');
    { const M5 = { tuho: 'toss', plant: 'plant', cut: 'cut', beehive: 'comb', pear: 'cover', lumber: 'order', seaweed: 'spread' }, NO5 = ['strawberry', 'shiitake', 'cabbage', 'potato', 'clam', 'oyster', 'pasture'];
      const list = has.filter(k => GEN.includes(k)).concat(hasT ? ['tuho'] : []), keyOf = (k, sea) => (k === 'paddy' ? (sea === 'autumn' ? 'cut' : 'plant') : k);
      const at4 = (k, sea) => ev(([k9, s9]) => { SM_TOWN.rules.season(s9); const S = __G.S; S.uses = {}; S.rw = {}; const key = k9 === 'paddy' ? (s9 === 'autumn' ? 'cut' : 'plant') : k9; S.lad = S.lad || {}; S.lad.mg = S.lad.mg || {}; S.lad.mg[key] = { lv: 4, z: 0, n: 3, best: null, last: null }; }, [k, sea]);
      const runs = []; for (const k of list) { runs.push([k, 'spring']); if (k === 'paddy') runs.push([k, 'autumn']); }
      await ev(() => { if (__G.S.lad) delete __G.S.lad.m5; const P9 = __G.S.path; if (P9 && P9.got) P9.got.chal = Math.max(P9.got.chal | 0, 2); });   /* 앞 시험에서 도전가 걸음이 이미 넘침 → 표지판은 지난 것으로 두고 열림 표만 지움(다시 지나지 않으니 그대로 꺼짐) */
      const pre = []; for (const [k, sea] of runs) { await at4(k, sea); const r = await one(k, 3, 5); pre.push(keyOf(k, sea) + ':' + r.lv + '→' + (r.st ? r.st.lv : '?')); }
      ok(pre.length >= 3 && pre.every(t => /:4→4$/.test(t)), '표지판 전 = 칸 4 아주 잘함도 그대로 4 · ' + pre.join(' '));
      await ev(() => SM_TOWN.rules.season('spring'));
      // 도전가 걸음 8 채우기(스키 셋 + 고누 칸 4·이김) → 둘째 표지판 지나기(첫째는 지난 것으로)
      await W8(4300); await ev(() => { __clean(); const S = __G.S; S.path.got.chal = 1; delete S.lad.m5; S.xp = S.xp || {}; S.xp.ski = Object.assign(S.xp.ski || {}, { c1: { best: 31, last: 33, n: 2 }, c2: { best: 40, last: 41, n: 1 }, c3: { best: 52, last: 55, n: 1 } }); S.tbl = S.tbl || { v: 1 }; S.tbl.g = Object.assign(S.tbl.g || {}, { gonu: { lv: 4, good: 0, fail: 0, w: 1, n: 3, best: {} } }); __G.mark(); });
      let toast = ''; for (let i = 0; i < 4; i++) { await ev(() => { __clean(); SM_TOWN.mypath().sec(true); }); await W8(250); const t9 = await ev(() => (document.getElementById('toast') || {}).textContent || ''); if (/명인 칸/.test(t9)) toast = t9; if (await ev(() => !!(__G.S.lad && __G.S.lad.m5)) && toast) break; }
      const I5 = await ev(() => ({ got: (__G.S.path && __G.S.path.got || {}).chal | 0, m5: !!(__G.S.lad && __G.S.lad.m5) }));
      ok(I5.got >= 2 && I5.m5, '도전가 표지판 ' + I5.got + '개 지남 → 명인 칸 열림(m5 ' + I5.m5 + ')');
      ok(/명인 칸이 열렸어요/.test(toast), '그 자리 한 줄 「' + toast.slice(0, 60) + '」');
      // 나머지 갈래 = 칸 4가 끝
      const no5 = []; for (const k of has.filter(q => NO5.includes(q)).slice(0, 3)) { await at4(k, 'spring'); const r = await one(k, 3, 5); no5.push(k + ':' + r.lv + '→' + r.st.lv); }
      ok(no5.every(t => /:4→4$/.test(t)), '명인 칸이 없는 갈래는 칸 4가 끝 · ' + no5.join(' '));
      // 명인 칸 갈래마다: 4칸 잘함 = 그대로 · 아주 잘함 = 다음 판 명인 칸 → 그 판 열어 판단 확인 · 눌러 보기 · 끝
      for (const [k, sea] of runs) { const key = keyOf(k, sea), kind = M5[key]; if (!kind) continue; await at4(k, sea);
        const a = await one(k, 2, 5), b9 = await one(k, 3, 5);
        ok(a.lv === 4 && a.st.lv === 4 && b9.st.lv === 5 && /명인 칸/.test(b9.recEl), key + ' 칸 4 잘함 = 4 그대로 · 아주 잘함 = 다음 명인 칸 「' + (b9.recEl || '').slice(-50) + '」');
        const R5 = await ev(async ([k9, s9]) => { __clean(); SM_TOWN.rules.season(s9); __G.S.uses = {}; __G.S.rw = {}; if (k9 === 'clam') __low(); else __G.S.min = 11 * 60; if (!SM_TOWN.play(k9)) return { none: 1 }; const L = SM_TOWN.lad(); if (!L.play) return { none: 2 };
          const o = { lv: L.play.lv, lp: L.play.lp, lab: L.play.lab, kind: L.play.kind }, d0 = SM_TOWN.mgDbg() || {}; o.d0 = { br: d0.br, pre: d0.pre, preSt: d0.st && d0.pre >= 0 ? d0.st[d0.pre] : null, door: d0.door, door2: d0.door2, okN: d0.ok ? d0.ok.length : null, wd: d0.wd, fine: d0.fine, sky: d0.sky, t0: d0.t0 };
          if (o.kind === 'cover' && d0.bagT) { const q = d0.order || []; d0.bagT(q[0]); d0.bagT(q[1]); o.t0 = (SM_TOWN.mgDbg() || {}).t0; }
          for (let i = 0; i < 14; i++) { const W9 = document.querySelector('.twn-play .mg'); if (!W9) break; const bs = [...W9.querySelectorAll('button, .gc, .ot, .spot')].filter(e => !e.disabled); if (!bs.length) { await new Promise(r => setTimeout(r, 300)); continue; } const e9 = bs[(Math.random() * bs.length) | 0], r9 = e9.getBoundingClientRect();
            e9.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r9.left + r9.width / 2, clientY: r9.top + r9.height / 2 })); e9.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await new Promise(r => setTimeout(r, 350)); }
          const d1 = SM_TOWN.mgDbg() || {}; o.ph = d1.ph; o.sky1 = d1.sky; SM_TOWN.lad().finish(3, 6); const L2 = SM_TOWN.lad(); o.recEl = L2.play ? L2.play.recEl : ''; SM_TOWN.playEnd(3); o.st = SM_TOWN.lad().mg[k9 === 'paddy' ? o.kind : k9]; return o; }, [k, sea]);
        if (R5.none) { ok(false, key + ' 명인 칸 판이 안 열림 ' + R5.none); continue; }
        const D = R5.d0, J = kind === 'toss' ? [-1, 0, 1].includes(D.br) : kind === 'cut' ? D.pre >= 0 && D.preSt === 4 : kind === 'comb' ? D.door2 >= 0 && D.door2 !== D.door && D.okN >= 1 : kind === 'cover' ? R5.t0 === 2 : kind === 'order' ? typeof D.wd === 'boolean' : true;
        ok(R5.lv === 5 && /^명인 칸: /.test(R5.lab) && J, key + ' 명인 칸 판 열림 「' + R5.lab + '」 · 판단 ' + JSON.stringify(D) + (kind === 'cover' ? ' · 바람 바뀐 차례 ' + R5.t0 : ''));
        ok(R5.st && R5.st.last && R5.st.last.lv === 5 && /명인 칸/.test(R5.recEl), key + ' 눌러 본 뒤 끝 · 기록 「' + (R5.recEl || '').slice(0, 60) + '」 · 칸 ' + (R5.st && R5.st.lv)); await W8(80); }
      await ev(() => SM_TOWN.rules.season('spring'));
      const h5 = await ev(() => { SM_TOWN.openSkills(); const P = document.querySelector('.twn-p'); const t = P ? [...P.querySelectorAll('[data-lad]')].map(e => e.textContent) : []; __clean(); return t; });
      ok(h5.some(t => /지금 명인 칸/.test(t) && /내 최고: 명인 칸/.test(t)), '수첩 솜씨 칸 「' + (h5.find(t => /명인/.test(t)) || '').slice(0, 70) + '」'); }
    // ── ⑨-2 명인 칸 놀이 틀 바로 열기(이 마을에 일터가 없는 투호·김 포함 · 일곱 갈래 모두) ──
    { const R = await ev(async () => { const M = await import('/v2/games/town_minigame.js?v=12'), out = {};
        for (const [kind, k] of [['toss', 'tuho'], ['spread', 'seaweed'], ['plant', 'paddy'], ['cut', 'paddy'], ['comb', 'beehive'], ['cover', 'pear'], ['order', 'lumber'], ['dig', 'potato']]) {
          const root = document.createElement('div'); root.className = 'twn-play'; root.innerHTML = '<div class="pb"><div class="mg"></div><div class="msg"></div><button class="go"></button></div>'; document.body.appendChild(root); let end = -1, er = '';
          try { const g = M.createMini(kind, { root: root.querySelector('.pb'), k, en: false, zw: 1, sea: kind === 'cut' ? 'autumn' : 'spring', x: { day: 3, mem: {}, key: 'zz:' + kind }, lv: 5, onEnd: sc => { end = sc; } }), d0 = g.dbg || {}, o = { lv: g.lv, lp: g.lp };
            if (kind === 'toss') { o.br = d0.br; o.solOk = d0.sols.length > 0 && !d0.sols.includes(d0.br + ',1'); }
            if (kind === 'spread') { o.sky0 = d0.sky; g.key('Enter'); for (let d = 1; d <= 3; d++) { for (let t = 0; t < 30; t++) g.tick(0.1); g.key('Digit' + d); if ((g.dbg || {}).ph === 'next') break; } for (let t = 0; t < 15; t++) g.tick(0.1); o.sky1 = (g.dbg || {}).sky; o.sheet = (g.dbg || {}).sheet; }
            if (kind === 'order') { o.ph = []; for (let i = 0; i < 80 && !g.done; i++) { const d = g.dbg || {}; if (!o.ph.includes(d.ph)) o.ph.push(d.ph); if (d.ph === 'order') { const b9 = root.querySelector('.crd [data-s="' + d.st + '"]'); if (b9) b9.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); } else if (d.ph === 'depth' || d.ph === 'water' || d.ph === 'stake') g.key('Digit' + (1 + ((Math.random() * (d.ph === 'stake' ? 2 : 3)) | 0))); for (let t = 0; t < 20; t++) g.tick(0.1); } }
            for (let i = 0; i < 40 && !g.done; i++) { const bs = [...root.querySelectorAll('.mg button, .mg .gc, .mg .ot, .mg .spot')].filter(e => !e.disabled); if (bs.length) { const e9 = bs[(Math.random() * bs.length) | 0], r9 = e9.getBoundingClientRect(); e9.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r9.left + r9.width / 2, clientY: r9.top + r9.height / 2 })); e9.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); } g.down(); g.up(); for (let t = 0; t < 12; t++) g.tick(0.1); }
            for (let t = 0; t < 900 && end < 0; t++) g.tick(0.1); o.end = end; o.done = g.done; g.dispose(); out[kind] = o; } catch (e) { er = String(e && e.stack || e).slice(0, 300); out[kind] = { er }; } root.remove(); }
        return out; });
      for (const [kind, o] of Object.entries(R)) { const want5 = kind !== 'dig';
        const J = kind === 'toss' ? [-1, 0, 1].includes(o.br) && o.solOk : kind === 'spread' ? o.sheet >= 1 && o.sky1 !== o.sky0 : true;
        ok(!o.er && o.lv === (want5 ? 5 : 4) && (o.end >= 0 || !want5) && J && (kind !== 'order' || o.ph.includes('stake')), kind + ' 놀이 틀 칸 ' + o.lv + (want5 ? '' : '(명인 칸 없는 갈래 = 4로 묶임)') + ' · 끝 점수 ' + o.end + (kind === 'order' ? ' · 지난 단계 ' + o.ph.join('→') : '') + (kind === 'toss' ? ' · 가지 자리 ' + o.br + ' · 답 있음(가지 밑 높게 = 답 아님) ' + o.solOk : kind === 'spread' ? ' · 하늘 ' + o.sky0 + ' → ' + o.sky1 : '') + (o.er ? ' · 오류 ' + o.er : '')); } }
    const feel1 = await ev(() => SM_TOWN.feel().info().g.best.fx); ok(feel1 > feel0, '새 최고 연출(town_feel best) ' + (feel1 - feel0) + '번');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' · ' + errs.slice(0, 4).join(' / ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); } finally { await b.close(); }
  console.log((fails.length ? '✗ 실패 ' + fails.length : '✓ 모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
