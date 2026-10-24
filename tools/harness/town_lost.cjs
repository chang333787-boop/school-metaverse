// 헤맴 그물·알림 통·% 지우기·J 제한 시험(PHASE2 조각 1·2·3): node tools/harness/town_lost.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 알림 통 say: 막힘(lv0) 뒤에 저절로 생긴 알림(lv1)이 와도 막힘이 사라지지 않음 · lv1은 줄 섰다가 뜸 · 같은 글 30초 안 X · lv0은 늘 바로
//   ② 헤맴 그물 lostTick: 목표(할 일)를 멀리 두고 가만히 → 75초 일꾼 손 들기 · 120초 빨간 선 · 170초 '🚏 가까운 정류장으로' 단추(누르면 순간이동 수 그대로)
//      엉뚱한 쪽 걷기 → 시간이 쌓임 · 목표 쪽으로 20m 넘게 다가가면 처음부터 · 1초 칸 ≤ 1ms
//   ③ 화면 글: 도감·여권·가방·큰 지도에 '%'·'n / N' 0 · ④ J 제한: 안 가 본 칸 순간이동 0(길 보기) · 가 본 칸·학교는 그대로
//   모두 열린 예전 저장(선생님 X = 순간이동 제한이 걸리는 아이)으로 봄
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null;
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    await ctx.addInitScript(id => { if (!sessionStorage.getItem('zz.seed')) { localStorage.setItem('sm-town-game:' + id, JSON.stringify({ v: 1, day: 3, min: 600, bag: { '🍓': 2 }, money: 300 })); sessionStorage.setItem('zz.seed', '1'); } }, ID);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.say && SM_TOWN.game && window.SD2, null, { timeout: 240000 }); await p.waitForTimeout(1500);
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const closeAll = async () => { for (let i = 0; i < 3; i++) { await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(200); } };
    await closeAll(); await W8(1500);
    await ev(() => { window.__G = SM_TOWN.game(); window.__tp = (x, z) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }; window.__me = () => { const m = SD2.map.player.get(); return [m.x, m.z]; }; window.__toast = () => { const t = document.getElementById('toast'); return t && t.style.display !== 'none' ? t.textContent : ''; }; const S = __G.S; S.story = S.story || {}; S.story.cur = null; S.story.done = { ...(S.story.done || {}), p0: 1 }; S.story.p0auto = 1; });   /* 프롤로그 저절로 시작(쪽지 창) X — 창이 열린 동안 그물은 세지 않음 */
    ok(await ev(() => SM_TOWN.hud.all() && !SM_TOWN.tpSeen(1e5, 1e5)), '모두 열린 아이 저장 · 순간이동 제한 걸림(선생님 X)');
    await shot('lost_first');

    // ① 알림 통
    await W8(4500);
    await ev(() => SM_TOWN.say('🚧 막힘 시험 — 길이 막혔어요', 3)); await W8(1500); await ev(() => SM_TOWN.say('📌 저절로 시험 가', 3, 1)); await W8(700);
    ok(/막힘 시험/.test(await ev(() => __toast())), 'lv1이 와도 막힘 알림이 그대로(0.7초 뒤)');
    await W8(2300); ok(/저절로 시험 가/.test(await ev(() => __toast())), 'lv1은 줄 섰다가 막힘 4초 뒤에 뜸');
    await W8(4200); await ev(() => SM_TOWN.say('📌 저절로 시험 가', 3, 1)); await W8(300); ok(!/저절로 시험 가/.test(await ev(() => __toast())), '같은 글 30초 안 = 다시 안 뜸');
    await ev(() => SM_TOWN.say('🎯 내 행동 하나', 2)); await W8(200); await ev(() => SM_TOWN.say('🎯 내 행동 둘', 2)); await W8(200); ok(/내 행동 둘/.test(await ev(() => __toast())), 'lv0(내 행동)은 늘 바로');
    await ev(() => SM_TOWN.say('📌 늦은 저절로', 3, 1)); await W8(200); await ev(() => SM_TOWN.say('🚧 막힘 둘', 4)); await W8(4600); ok(!/늦은 저절로/.test(await ev(() => __toast())), '3초 안에 못 뜬 lv1 = 버림(늦게 뜨지 않음)');
    console.log('    say 수: ' + JSON.stringify(await ev(() => { const n = SM_TOWN.sayN(); return { lv0: n.n0, lv1: n.n1, drop: n.drop }; })));

    // ③ 화면 글: 도감·여권·가방·큰 지도
    const BAD = /%|\d\s*\/\s*\d/;
    const panelTxt = () => ev(() => { const q = document.querySelector('.twn-p'); return q ? q.textContent.replace(/\s+/g, ' ') : ''; });
    const tab = async k => { await ev(k9 => { const B = [...document.querySelectorAll('.twn-p .nb-tabs button')]; const b9 = B.find(e => e.textContent.includes(k9)); if (b9) b9.click(); }, k); await W8(500); };
    await ev(() => { const S = __G.S; S.dex = S.dex || {}; S.dex['🍓'] = { d: S.day, c: '가1', s: 'spring', t: 'day' }; S.dex['🥔'] = { d: 1, c: '가2', s: 'spring', t: 'day' }; });
    await p.keyboard.press('KeyI'); await W8(600); { const t = (await panelTxt()).replace(/꾸러미 \d+\/\d+/, '꾸러미');   /* 계절 꾸러미 칸 수는 채울 목록이라 그대로 */ ok(t && !BAD.test(t), '가방 창 글에 %·n / N 없음' + (BAD.test(t) ? ' — ' + t.match(/.{0,30}(%|\d\s*\/\s*\d).{0,10}/)[0] : '')); }
    const nbTxt = await ev(() => { const e = document.querySelector('.twn-p .nb-tabs'); return e ? { n: e.querySelectorAll('button').length, g: e.querySelectorAll('.nb-grp small').length, t: e.textContent } : null; });
    ok(nbTxt && (nbTxt.n > 6 ? nbTxt.g === 3 : nbTxt.g === 0), '수첩 탭 ' + (nbTxt && nbTxt.n) + '개 — 6개 넘으면 소제목 셋 · 아니면 0(' + (nbTxt && nbTxt.g) + ')');
    await tab('도감'); { const t = await panelTxt(); ok(/찾은 것 \d+/.test(t), '도감 머리 = 「찾은 것 n」'); ok(!BAD.test(t), '도감 글에 %·n / N 없음' + (BAD.test(t) ? ' — ' + t.match(/.{0,30}(%|\d\s*\/\s*\d).{0,10}/)[0] : '')); ok(!/❔|어디쯤\?/.test(t), '못 찾은 ❔ 카드 안 그림'); ok(/아직 찾을 게 있대요/.test(t), '갈래마다 단서 한 줄');
      const band = await ev(() => [...document.querySelectorAll('.twn-p .bagg > div')].filter(e => /fff4cc/.test(e.getAttribute('style') || '')).length); ok(band >= 1, '오늘 찾은 카드 = 옅은 띠(' + band + '장)'); await shot('lost_dex'); }
    await tab('여권'); { const t = await panelTxt(); ok(!!t && !BAD.test(t), '여권 글에 %·n / N 없음' + (BAD.test(t) ? ' — ' + t.match(/.{0,30}(%|\d\s*\/\s*\d).{0,10}/)[0] : '')); }
    await closeAll(); await p.keyboard.press('KeyM'); await W8(900); { const t = await ev(() => { const B = [...document.querySelectorAll('.twn-p button')].find(e => /가 본|explored/.test(e.textContent)); return B ? B.textContent : ''; }); ok(!!t && !BAD.test(t), '큰 지도 「가 본 칸」 단추 = 분모 X (' + t.trim() + ')'); }
    await closeAll();

    // ④ J 제한
    await ev(() => __tp(15.4, 74)); await W8(1200);
    const J = await ev(() => { const S = __G.S, C = S.cells || {}, L = SM_TOWN.places().filter(q => q.door && !C[SM_TOWN.cell(q.x, q.z)] && !SM_TOWN.tpSeen(q.x, q.z)); return { n: L.length, cells: [...new Set(L.map(q => SM_TOWN.cell(q.x, q.z)))].slice(0, 8), tpn: S.tpn || 0 }; });
    console.log('    안 가 본 칸 장소 ' + J.n + '곳 · 칸 ' + J.cells.join(','));
    let moved = 0; for (const c of J.cells) { const a = await ev(() => __me()); await ev(c9 => SM_TOWN.jumpCell(c9), c); await W8(900); const b9 = await ev(() => __me()); if (Math.hypot(a[0] - b9[0], a[1] - b9[1]) > 5) moved++; await closeAll(); }
    ok(J.cells.length > 0 && moved === 0, '안 가 본 칸 순간이동 0 (' + J.cells.length + '칸 중 ' + moved + ')');
    ok(await ev(() => !!SM_TOWN.routeNow()), '안 가 본 칸 = 빨간 선(길 보기)'); ok((await ev(() => __G.S.tpn || 0)) === J.tpn, '길 보기는 순간이동 수를 안 씀');
    await p.keyboard.press('KeyJ'); await W8(900); { const t = await panelTxt(); ok(/아직 안 가 봤어요 · 길 보기/.test(t), 'J 창 = 안 가 본 곳에 「아직 안 가 봤어요 · 길 보기」'); ok(!/남은 순간이동/.test(await ev(() => __toast())), '순간이동 n/5 알림 X'); await shot('lost_jump'); }
    { const r = await ev(() => { const B = [...document.querySelectorAll('.twn-p .jp button[data-j]')].find(e => /아직 안 가 봤어요/.test(e.textContent)); if (!B) return null; const a = __me(); B.click(); return a; }); await W8(1200); const b9 = await ev(() => __me()); ok(!!r && Math.hypot(r[0] - b9[0], r[1] - b9[1]) < 5, 'J 창 안 가 본 장소 단추 = 순간이동 X'); await closeAll(); }
    { const vis = await ev(() => { const S = __G.S; S.cells = S.cells || {}; const c = SM_TOWN.cell(15.4, 140); S.cells[c] = 1; return c; }); const a = await ev(() => __me()); await ev(c9 => SM_TOWN.jumpCell(c9), vis); await W8(1500); const b9 = await ev(() => __me()); ok(Math.hypot(a[0] - b9[0], a[1] - b9[1]) > 5, '가 본 칸(' + vis + ') = 순간이동 됨'); await closeAll(); }
    await ev(() => SM_TOWN.pathOff());

    // ② 헤맴 그물
    const T = await ev(() => { SM_TOWN.tasksNow(); const t = SM_TOWN.compTgt(); return t; });
    if (!T) { ok(false, '할 일 목표가 없음(compTgt)'); } else {
      const W = await ev(t => { const L = SM_TOWN.workers().filter(w => w[4] && Math.hypot(w[1] - t[0], w[2] - t[1]) > 160); return L.length ? L[(L.length / 2) | 0] : null; }, T);
      console.log('    목표 ' + T[2] + ' [' + T.map(v => typeof v === 'number' ? Math.round(v) : v).join(',') + '] · 곁 일꾼 ' + JSON.stringify(W));
      if (W) await ev(w => __tp(w[1] + 4, w[2] + 2), W); else await ev(t => __tp(t[0] + 200, t[1]), T);
      await W8(1500); const t0 = Date.now(); const L0 = await ev(() => SM_TOWN.lost()); console.log('    시작 ' + JSON.stringify({ t: L0.t, st: L0.st }));
      const DLGS = new Set(), at = async s => { for (;;) { const w = s * 1000 - (Date.now() - t0); if (w <= 0) break; await W8(Math.min(w, 2000)); const dg = await ev(() => { const on = SM_TOWN.dlgOn && SM_TOWN.dlgOn(); if (!on) return null; const e = document.querySelector('.twn-dlg,.dlg,[class*=dlg]'); return (e ? e.textContent : 'dlg').slice(0, 50); }); if (dg) { DLGS.add(dg); await p.keyboard.press('Escape'); await W8(300); await closeAll(); } }   /* 곁 일꾼 말 걸기·길 위 부탁 대화창 = 닫음(창이 열린 동안은 헤맴을 세지 않음 — 그 시간만큼 뒤로 밀림) */ return ev(() => ({ L: SM_TOWN.lost(), r: !!SM_TOWN.routeNow(), chip: [...document.querySelectorAll('.gchip')].some(e => /정류장으로/.test(e.textContent)) })); };
      let q = await at(70); ok(q.L.st === 0 && !q.chip && q.L.t >= 60, '70초 = 아직 그물 X (t ' + Math.round(q.L.t) + (q.L.why ? ' · 멈춘 까닭 ' + q.L.why : '') + ')' + (await ev(() => { const P = document.querySelector('.twn-p'); return P ? ' · 열린 창: ' + P.textContent.slice(0, 40) : ''; })));
      q = await at(83); ok(q.L.st >= 1, '75초 = 첫 단계(일꾼 손 들기 ' + (q.L.n75 ? '했음' : '25m 안 일꾼 없음 → 건너뜀') + ')'); if (W) ok(q.L.n75 === 1, '25m 안 일꾼이 손 들고 「길 몰라? 이리 와 봐」');
      q = await at(130); ok(q.L.st >= 2 && q.r, '120초 = 빨간 선(선 없던 목표)');
      await shot('lost_120');
      q = await at(182); if (DLGS.size) console.log('    닫은 대화창: ' + [...DLGS].join(' | ')); ok(q.L.st >= 3 && q.chip, '170초 = 「🚏 가까운 정류장으로」 단추'); await shot('lost_170');
      const tpn0 = await ev(() => __G.S.tpn || 0), m0 = await ev(() => __me()); await ev(() => { const c = [...document.querySelectorAll('.gchip')].find(e => /정류장으로/.test(e.textContent)); if (c) c.click(); }); await W8(1500);
      const m1 = await ev(() => __me()); ok(Math.hypot(m0[0] - m1[0], m0[1] - m1[1]) > 10, '단추 = 목적지 가까운 정류장으로 옮김'); ok((await ev(() => __G.S.tpn || 0)) === tpn0, '정류장 단추는 순간이동 수(TP-LIM)에 안 셈');
      ok(!(await ev(() => [...document.querySelectorAll('.gchip')].some(e => /정류장으로/.test(e.textContent)))), '누르면 단추 사라짐');
      // 엉뚱한 쪽 걷기 → 쌓임 → 목표 쪽 다가가면 처음부터
      await ev(() => SM_TOWN.pathOff()); await ev(t => { const m = __me(), dx = m[0] - t[0], dz = m[1] - t[1], l = Math.hypot(dx, dz) || 1; SD2.map.player.lookAt([m[0] + dx / l * 50, m[1] + dz / l * 50]); }, T); await W8(1200);
      const w0 = await ev(() => SM_TOWN.lost().t); await p.keyboard.down('KeyW'); await W8(12000); await p.keyboard.up('KeyW'); const w1 = await ev(() => SM_TOWN.lost());
      ok(w1.t >= w0 + 8 || w1.t >= 8, '엉뚱한 쪽 걷기 = 헤맴 시간 쌓임(' + w0 + ' → ' + w1.t + ')');
      await ev(t => { const m = __me(), dx = t[0] - m[0], dz = t[1] - m[1], l = Math.hypot(dx, dz) || 1, k = Math.min(60, l - 20); __tp(m[0] + dx / l * k, m[1] + dz / l * k); }, T); await W8(2500);
      const w2 = await ev(() => SM_TOWN.lost()); ok(w2.t <= 3, '목표 쪽으로 20m 넘게 다가감 = 처음부터(t ' + w2.t + ')');
      const ms = await ev(() => SM_TOWN.lost()); ok(ms.ms <= 1, '1초 칸 lostTick 최악 ' + ms.ms.toFixed(3) + 'ms (≤ 1ms) · 단계가 바뀐 한 번(선 긋기) ' + (ms.msA || 0).toFixed(1) + 'ms'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('예외', e.message); }
  console.log((fails.length ? 'FAIL ' + fails.length + ' — ' + fails.join(' | ') : 'PASS') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); await b.close(); process.exit(fails.length ? 1 : 0); })();
