// 📈 일 놀이 도전 사다리 + 내 최고 시험(LADDER-2 · v2/games/town_lad.js): node tools/harness/town_ladder.cjs [마을=ourtown] [포트=8002]
//   일 놀이마다 다섯 판 연달아(잘함 셋 → 아쉬움 둘): ① 칸이 1 → 2 → 3 → 4로 오름 ② 조건 값(lp)이 칸마다 바뀜 ③ 창 위 한 줄이 '도전 n칸'
//   ④ 내 최고: 첫 기록 → 높은 칸 = 새 최고(연출) → 아쉬움 = 그대로(유지) ⑤ 아쉬움 두 판 = 한 칸 내려감 ⑥ 낚시·소금 = 자기 사다리(기록만)
//   ⑦ 보상 하루 한도 그대로(같은 점수면 1칸·3칸 받는 것이 같음 · 넷째 판부터 연습) ⑧ 수첩 솜씨 칸에 놀이별 최고 ⑨ 페이지 오류 0
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
    const has = await ev(L => L.filter(k => SM_TOWN.workers().some(w => w[4] === k)), GEN.concat(OWN));
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
      ok(h.length >= Math.min(3, has.length) && h.every(t => /내 최고/.test(t) && /지금 도전/.test(t)), '일 놀이 기록 ' + h.length + '줄 · 「' + (h[0] || '').slice(0, 70) + '」'); }
    const feel1 = await ev(() => SM_TOWN.feel().info().g.best.fx); ok(feel1 > feel0, '새 최고 연출(town_feel best) ' + (feel1 - feel0) + '번');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' · ' + errs.slice(0, 4).join(' / ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); } finally { await b.close(); }
  console.log((fails.length ? '✗ 실패 ' + fails.length : '✓ 모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
