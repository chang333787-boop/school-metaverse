// 🧺 꾸러미가 마을을 바꿈 + 🤝 이웃 사연 시험(BUNDLE-2 · v2/games/town_bundle2.js): node tools/harness/town_bundle2.cjs [마을=ourtown] [포트=8002] [--shots=폴더(그리기 켬)]
//   ① 꾸러미 창 = 꾸러미마다 '채우면 ○○이 생겨요' 한 줄 · 이 마을에서 자리를 못 찾는 꾸러미 0
//   ② 봄 꾸러미 채움 → 배너 '내일 아침 …' · 그날은 마을에 아직 없음 · 하루 마무리 '오늘 바뀐 것'·'내일 기다리는 것'에 줄
//   ③ 다음 날 → 그 자리에 새 물건 + 판(장면에 붙음) · 아침 소식 후보에 'bun:spring' · 15초 뒤 배너 한 번 · 판 E(읽기) · 나의 길 🤝 이웃 걸음 +1
//   ④ 나머지 꾸러미도 채움 → 다음 날 모두 생김 · 여름 등 = 밤에 빛나는 부품 · 서로 겹침 0(가운데 2.4m 넘게)
//   ⑤ 하트 단계 셋 넘은 이웃 = 일꾼 E 글 '이야기 듣기' → E = 사연 대화(사연 줄 그대로) · 수첩 나의 길 이웃 줄에 '사연' 단추 · 두 번째 E = 원래 일(한 번만)
//   ⑥ 하트 단계 둘 이웃 = 사연 없음 · 사연 갈래 열 넘게 · 사연 글에 실명·이모지 X · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await c.newPage();
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  const closeAll = async () => { for (let i = 0; i < 6; i++) { if (!await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); await W8(250); } } };
  const shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
  const I = () => ev(() => SM_TOWN.bun2().info());
  const run = async (n = 3) => { for (let i = 0; i < n; i++) { await ev(() => SM_TOWN.bun2().sec()); await W8(100); } };
  const fill = async id => { await closeAll(); await ev(id => { const G = SM_TOWN.game(), r = SM_TOWN.bundles().find(q => q.id === id); for (const [e, n] of Object.entries(r.need)) G.S.bag[e] = (G.S.bag[e] | 0) + n; G.mark(); SM_TOWN.openBundles(); }, id); await W8(300);
    await ev(id => { const b9 = document.querySelector('.twn-p button[data-b="' + id + '"]'); if (b9) b9.click(); }, id); await W8(400); return ev(() => (document.getElementById('hudBan') || {}).textContent || ''); };
  const sleep = async () => { await closeAll(); const d0 = await ev(() => SM_TOWN.game().S.day); await ev(() => { SM_TOWN.game().S.min = 21 * 60; SM_TOWN.sleep({ ask: true }); }); await W8(900);
    const RC = await ev(() => { const P9 = document.querySelector('.twn-p'); if (!P9) return null; const row = P9.querySelector('[data-dc="bun2"]'); return { row: row ? row.textContent : null, w: [...P9.querySelectorAll('button[data-dwi]')].map(e => e.dataset.tm + ':' + e.textContent) }; });
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); for (let i = 0; i < 30; i++) { await W8(500); if (await ev(d0 => SM_TOWN.game().S.day > d0, d0)) break; } await W8(2500); await closeAll(); await ev(() => { SM_TOWN.game().S.min = 9 * 60; }); return RC; };
  const look = async (o, n, dist = 6) => { if (!SHOTS || !o) return; for (const da of [Math.PI, 1.1, -1.1, 0, 2.2, -2.2]) { const okp = await ev(([o, dist, da]) => { const a = o[2] + da, x = o[0] + Math.sin(a) * dist, z = o[1] + Math.cos(a) * dist; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.face(Math.atan2(o[0] - x, -(o[1] - z)) * 180 / Math.PI); const q = SD2.map.player.pos(); return Math.hypot(q.x - x, q.z - z) < 0.6; }, [o, dist, da]); if (okp) break; } await W8(1800); await shot(n); };
  try {
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.bun2 && SM_TOWN.bun2() && SM_TOWN.mypath && SM_TOWN.mypath(), null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(800);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; SM_TOWN.weather('clear'); }); await W8(500);
    const i0 = await I(); ok(!Object.keys(i0.q).length && !Object.keys(i0.on).length && !i0.vis.length, '새 저장 = 채운 꾸러미 0 · 마을에 바뀐 것 0');
    // ① 꾸러미 창
    const book = await ev(() => SM_TOWN.bundles().map(r => r.id)); console.log('  이 마을 꾸러미: ' + book.join(','));
    await ev(() => SM_TOWN.openBundles()); await W8(400);
    const H1 = await ev(() => [...document.querySelectorAll('.twn-p .sm')].map(e => e.textContent).filter(t => /채우면 .+ 생겨요$/.test(t.trim())));
    ok(H1.length === book.length, "꾸러미마다 '채우면 ○○이 생겨요' 한 줄(" + H1.length + '/' + book.length + ') — ' + H1.slice(0, 3).join(' / '));
    const PL = await ev(ids => ids.map(id => { const q = SM_TOWN.bun2().place(id); return [id, q ? q.at : null, q ? q.pts.length : 0, q && q.sign ? 1 : 0]; }), book); console.log('  자리: ' + JSON.stringify(PL));
    ok(PL.every(q => q[1] && q[2] > 0 && q[3]), '꾸러미마다 자리 + 판 자리를 찾음(자리 없음 0)');
    await shot('01_bundle_window'); await closeAll();
    // ② 봄 꾸러미
    const first = book.includes('spring') ? 'spring' : book[0], st0 = await ev(() => SM_TOWN.mypath().steps().nb);
    const ban = await fill(first); let i1 = await I(); const d1 = await ev(() => SM_TOWN.game().S.day);
    ok(i1.q[first] === d1 && /내일 아침/.test(ban), first + ' 채움 → 배너 = ' + ban);
    await run(2); i1 = await I(); ok(!i1.vis.includes(first), '채운 날에는 아직 마을에 없음(다음 날 아침)');
    await ev(() => SM_TOWN.openBundles()); await W8(300); { const t = await ev(() => [...document.querySelectorAll('.twn-p .sm')].map(e => e.textContent).find(t => /내일 아침/.test(t)) || ''); ok(!!t, "꾸러미 창 = '" + t + "'"); } await closeAll();
    const RC = await sleep(); console.log('  하루 마무리: ' + JSON.stringify(RC));
    ok(RC && RC.row && /내일 아침/.test(RC.row), "'오늘 바뀐 것'에 꾸러미 줄 — " + (RC && RC.row)); ok(RC && RC.w.some(t => /^bun2:/.test(t) && /내일 아침/.test(t)), "'내일 기다리는 것'에 '내일 아침 …이 생겨요'");
    // ③ 다음 날
    await run(3); const i2 = await I(), d2 = await ev(() => SM_TOWN.game().S.day);
    ok(d2 === d1 + 1 && i2.on[first] === d2 && i2.live[first], '다음 날 = 그 자리에 새 물건 + 판이 장면에 붙음 ' + JSON.stringify(i2.at[first]));
    { const N = await ev(() => SM_TOWN.game().S.news || null); const has = N && ((N.cand && N.cand.one || []).some(k => k.endsWith('bun:' + first)) || (N.lines || []).some(L => /bun:/.test(L.k) && L.k.endsWith(first)));
      if (N && N.d === d2) ok(has, '아침 소식 후보에 bun:' + first + ' — 칠판 ' + JSON.stringify((N.lines || []).map(L => L.t)));
      else { const nw = await ev(d => SM_TOWN.bun2().news(d), d2); ok(nw.length === 1 && /어제 채운/.test(nw[0].t[0]), '아침 소식 줄(집이 없는 판 = 줄만): ' + (nw[0] && nw[0].t[0])); } }
    ok(!(await I()).told[first], '배너는 아침 15초 뒤(좋은 아침 알림과 겹치지 않게)'); await W8(15500); await closeAll(); await run(2);
    { const t = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''), i3 = await I(); ok(i3.told[first] === 1 && /마을 사람들이/.test(t), '배너 한 번: ' + t); }
    { const st1 = await ev(() => SM_TOWN.mypath().steps().nb); ok(st1 === st0 + 1, '나의 길 🤝 이웃 걸음 +1(' + st0 + ' → ' + st1 + ')'); }
    { const h = await ev(id => { const L9 = SD2.map.interact.list().filter(q => /판 읽기/.test(q.label)); return L9.map(q => q.label); }, first); ok(h.length >= 1, '판 E: ' + h.join(' / ')); }
    await ev(id => SM_TOWN.bun2().readSign(id), first); await W8(500); { const t = await ev(() => (document.querySelector('.twn-dlg .tx') || {}).textContent || ''); ok(/채운/.test(t), '판 읽기 대화 = ' + t); } await closeAll();
    { const a = (await I()).at[first]; await look(a.pts[0], '02_' + first, 6); await look(a.sign, '02_' + first + '_sign', 3); }
    // ④ 나머지 꾸러미
    for (const id of book) if (id !== first) await fill(id);
    await sleep(); await run(3); const i4 = await I();
    ok(book.every(id => i4.live[id]), '나머지 꾸러미도 다음 날 모두 생김 ' + JSON.stringify(i4.live));
    { const P9 = []; for (const id of book) { const a = i4.at[id]; if (!a) continue; for (const o of a.pts) P9.push([id, o[0], o[1]]); if (a.sign) P9.push([id + ':sign', a.sign[0], a.sign[1]]); } let bad = []; for (let i = 0; i < P9.length; i++) for (let j = i + 1; j < P9.length; j++) if (P9[i][0].split(':')[0] !== P9[j][0].split(':')[0] && Math.hypot(P9[i][1] - P9[j][1], P9[i][2] - P9[j][2]) < 2.4) bad.push(P9[i][0] + '~' + P9[j][0]);
      const PV = await ev(() => Object.values(SM_TOWN.mypath().info().vat).map(v => [v[0], v[1]])); for (const q of P9) for (const v of PV) if (Math.hypot(q[1] - v[0], q[2] - v[1]) < 2.0) bad.push(q[0] + '~나의 길');
      ok(!bad.length, '꾸러미 물건끼리·나의 길 물건과 겹침 0' + (bad.length ? ' — ' + bad.join(', ') : '')); }
    if (book.includes('summer')) { await ev(() => { SM_TOWN.game().S.min = 21 * 60 + 30; }); await W8(2500); await run(2); const iL = await I(); ok(iL.lamps >= 2 && iL.lit === true, '여름 밤길 등 ' + iL.lamps + '개 · 밤 = 빛나는 부품'); await look(iL.at.summer.pts[0], '03_summer_night', 5); await ev(() => { SM_TOWN.game().S.min = 10 * 60; }); await W8(2500); await run(2); ok((await I()).lit === false, '낮 = 등 꺼짐(우윳빛 유리)'); }
    for (const id of book) if (id !== first && id !== 'summer') await look(i4.at[id].pts[0], '04_' + id, id === 'autumn' ? 7 : 5.5);
    // ⑤ 이웃 사연
    const R = await ev(() => SM_TOWN.nb().reps()), TK = await ev(async () => Object.keys((await import('/v2/games/town_bundle2.js?v=1')).TALES));
    ok(TK.length >= 10, '사연 갈래 ' + TK.length + '(열 넘게)');
    const TX = await ev(async () => Object.values((await import('/v2/games/town_bundle2.js?v=1')).TALES).flat().map(q => q[0]).join(' '));
    ok(!/[\u{1F300}-\u{1FAFF}]/u.test(TX), '사연 글에 이모지 0');
    const w1 = R.find(r => TK.includes(r.k)), w2 = R.find(r => TK.includes(r.k) && r.k !== (w1 && w1.k));
    if (!w1) ok(false, '사연이 있는 일꾼이 이 마을에 없음');
    else { await ev(([a, b]) => { const G = SM_TOWN.game().S; G.hearts[a] = 9; if (b) G.hearts[b] = 6; SM_TOWN.game().mark(); }, [w1.hk, w2 && w2.hk]); await W8(3300); await run(1);
      const lab = await ev(() => SM_TOWN.wkh().filter(q => /이야기 듣기/.test(q[1])).map(q => q[0] + ':' + q[1])); ok(lab.some(t => t.startsWith(w1.k + ':')), "단골 이웃 E 글 = '" + lab.join(' / ') + "'");
      if (w2) ok(!lab.some(t => t.startsWith(w2.k + ':')), '하트 단계 둘 이웃 = 사연 없음(' + w2.k + ')');
      const hot = await ev(k => { const h = SD2.map.interact.list().find(q => /이야기 듣기/.test(q.label)); if (!h) return null; h.use(); return h.label; }, w1.k); await W8(600);
      const D1 = await ev(() => { const d = document.querySelector('.twn-dlg'); return d ? { name: (d.querySelector('.name') || {}).textContent, tx: (d.querySelector('.tx') || {}).textContent } : null; });
      console.log('  사연 대화: ' + JSON.stringify(D1)); const first9 = await ev(async k => (await import('/v2/games/town_bundle2.js?v=1')).TALES[k][0][0], w1.k);
      ok(!!hot && D1 && D1.tx && first9.slice(0, 8) === D1.tx.slice(0, 8), 'E = 사연 대화(' + (D1 && D1.name) + ')');
      await shot('05_tale'); for (let i = 0; i < 8; i++) { if (!await ev(() => !!document.querySelector('.twn-dlg'))) break; await p.keyboard.press('Space'); await W8(350); } await closeAll(); await W8(400);
      const i5 = await I(); ok(i5.tale[w1.k] && i5.tale[w1.k].hk === w1.hk, '사연을 들음 = 저장(' + JSON.stringify(i5.tale[w1.k]) + ')');
      const lab2 = await ev(() => SM_TOWN.wkh().filter(q => /이야기 듣기/.test(q[1])).length); ok(lab2 === 0, '다 들은 뒤 E 글 = 원래 일(한 번만)');
      { const t2 = await ev(w => { const W9 = SM_TOWN.nb().reps().find(q => q.hk === w.hk); return SM_TOWN.bun2().tale({ k: W9.k, hk: W9.hk, x: W9.x, z: W9.z, rep: true }); }, w1); ok(t2 === false, '두 번째 E = 사연 다시 X'); }
      await ev(() => SM_TOWN.mypath().open()); await W8(400); const TB = await ev(() => [...document.querySelectorAll('.twn-p button[data-tale]')].map(e => e.textContent)); ok(TB.length === 1 && /사연/.test(TB[0]), '수첩 🛤 나의 길 이웃 줄 = ' + TB.join(' / '));
      await shot('06_notebook'); await ev(() => document.querySelector('.twn-p button[data-tale]').click()); await W8(500); ok(await ev(() => !!document.querySelector('.twn-dlg')), '사연 단추 = 다시 읽기'); await closeAll(); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
