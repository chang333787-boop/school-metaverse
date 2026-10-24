// 🚒 마을 불 사건 시험(FIRE-4 · 사용자 10-24 '불 끄는 퀘스트가 어디 갔는데 불 안 보이는데 버그 아니야?'): node tools/harness/town_fire.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 생김: 이야기 전(첫 30분) = 불 없음 · 첫 쪽지 + 1막 첫 장 뒤 = 그날 정한 때에 내 둘레(60~260m) 집에 불(직업 체험이 잠겨 있어도) · 소방서 450m 밖에서도
//   ② 보임: 연기 기둥(옥상 + 12m 넘게) · 빛기둥 · 위 가운데 줄 = 칸 + 방향 + 거리(지나가는 장소 글에 안 덮임) · 120m 앞에서 기둥이 화면 안 · 장소 찾기(F) 맨 위 '지금 생긴 일' → 길 · J 검색 '불'
//   ③ 끌 수 있음: 빨간 선을 걸어서 불난 집 앞 → E → 소방차가 와서 섬 → 물 뿌리기(E 꾹)로 불꽃이 줄어듦 → 사다리 → 이웃 둘 → 소화기 순서 → 끝 창
//   ④ 끝나면 바뀜: 창 위 그을음 + 문 옆 소화기(그날·다음 날 · 그다음 날 사라짐) · 빛기둥·칩·할 일 줄이 남지 않음 · 그냥 두면 4분 뒤 소방관이 끄고 흔적은 남음 · 오류 0
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 500) } : null; });
    const closeAll = async () => { for (let i = 0; i < 5; i++) { const dl = await ev(() => !!document.querySelector('.twn-dlg')); if (dl) { await ev(() => { const d = document.querySelector('.twn-dlg .dbox'); if (d) d.click(); }); await W8(250); continue; } if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const goalTx = () => ev(() => { const g = document.getElementById('hudGoal') || [...document.querySelectorAll('body > div')].find(d => d.style && /translateX\(-50%\)/.test(d.style.transform || '') && /top/.test(d.style.cssText) && d.offsetParent); return g && g.style.display !== 'none' ? g.innerText : ''; });
    const F = () => ev(() => SM_TOWN.jobs().fire), FS = () => ev(() => SM_TOWN.jobs().dbg.fireState()), SM = () => ev(() => SM_TOWN.jobs().dbg.smoke());
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.jobs && SM_TOWN.routePts, null, { timeout: 240000 }); await W8(2500); await closeAll(); await W8(800);
    const setT = (m, o = {}) => ev(([m, o]) => { const G = SM_TOWN.game().S; G.jobs = G.jobs || {}; delete G.jobs.fireDay; delete G.jobs.fireNo; delete G.jobs.fire; if (o.day) G.day = o.day; G.min = m; const E9 = SM_TOWN.emerg && SM_TOWN.emerg(); if (E9) { E9.abort(); E9.dbg.plan(); G.emerg.plan = [{ k: 'fire', at: m, until: m + 200, st: 0 }]; E9.dbg.walk(100); } }, [m, o]);   /* EMERG-1이 있으면 불의 때는 엔진이 정함 → 그날 칸 = 지금 불 · 다니는 중(80m)으로 맞춤 */
    // ① 생김(정문 밖 길에서 — 긴급 출동은 학교 안에선 안 생김)
    { const R9 = await ev(() => SM_TOWN.schRect()); await ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [(R9[0] + R9[2]) / 2, R9[3] + 28]); await W8(800); }
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = {}; G.story.cur = null; }); await setT(15 * 60); await W8(2600);
    ok(!(await F()), '이야기 전(첫 30분) = 불 사건 없음(INTUIT-1 그대로)');
    const meA = await ev(() => { const m = SD2.map.player.pos(), st = SM_TOWN.places().find(q => /소방서/.test(q.name || '')); return { x: m.x, z: m.z, st: st ? Math.round(Math.hypot(st.door[0] - m.x, st.door[1] - m.z)) : -1 }; });
    await ev(() => { const G = SM_TOWN.game().S; G.story.done = { p0: 1, a1_1: 1 }; }); await setT(15 * 60); let f0 = null; for (let i = 0; i < 12 && !f0; i++) { await W8(500); f0 = await F(); } await closeAll();
    const lockJ = await ev(() => SM_TOWN.hud.on('jobs'));
    ok(!!f0, '첫 쪽지 + 1막 첫 장 뒤 15시 = 불 사건 생김 (직업 체험 ' + (lockJ ? '열림' : '잠김') + ' · 소방서까지 ' + meA.st + 'm)');
    if (!f0) throw new Error('불이 안 생김');
    let fs = await FS(); const dHouse = Math.round(Math.hypot(fs.hs[0] - meA.x, fs.hs[1] - meA.z)); ok(dHouse >= 55 && dHouse <= 270, '불난 집 = 내 둘레 ' + dHouse + 'm');
    // ② 보임
    const sm = await SM(); ok(sm && sm.top - sm.roof >= 12, '연기 기둥 = 옥상 위 ' + (sm ? (sm.top - sm.roof).toFixed(1) : '?') + 'm'); ok(sm && sm.beacon, '불난 집 빛기둥');
    const chip = await ev(() => [...document.querySelectorAll('.gchip')].some(c => /🚒/.test(c.textContent) && getComputedStyle(c).display !== 'none')); ok(chip, '오른쪽 칩 🚒');
    await W8(700); let g = await goalTx(); ok(/불/.test(g) && /\d+m/.test(g) && /쪽/.test(g), '위 가운데 줄 = 칸·방향·거리 「' + g + '」');
    { const far = await ev(fs => { const M = SD2.map, me = M.player.pos(), dx = me.x - fs.hs[0], dz = me.z - fs.hs[1], l = Math.hypot(dx, dz) || 1, x = fs.hs[0] + dx / l * 120, z = fs.hs[1] + dz / l * 120; M.player.teleport([x, SM_TOWN.ground(x, z) + 0.3, z]); M.player.lookAt([fs.hs[0], fs.hs[1]]); return [x, z]; }, fs); await W8(1600);
      const vis = await ev(() => { const S = SM_TOWN.jobs().dbg.smoke(), cam = SD2.map.camera, V = cam.position.clone(); V.set(S.col[0] + 2, S.col[1] + 9, S.col[2] + 1).project(cam); return { x: +V.x.toFixed(2), y: +V.y.toFixed(2), z: +V.z.toFixed(3) }; });
      ok(Math.abs(vis.x) < 1 && Math.abs(vis.y) < 1 && vis.z < 1, '120m 앞에서 연기 기둥이 화면 안 (' + JSON.stringify(vis) + ')'); await shot('fire_120m');
      await ev(() => { const M = SD2.map, me = M.player.pos(); M.player.teleport([me.x + 9, SM_TOWN.ground(me.x + 9, me.z) + 0.3, me.z]); }); await W8(1300); g = await goalTx(); ok(/불/.test(g), '걸어서 장소가 바뀌어도 할 일 줄 = 불 「' + g + '」'); }
    const fOn = await ev(() => SM_TOWN.hud.on('find')); if (!fOn) { console.log('    (장소 찾기 F가 아직 잠김 — 시험에선 열고 봄)'); await ev(() => SM_TOWN.hud.unlock('find', false)); await W8(400); await closeAll(); }
    await p.keyboard.press('KeyF'); await W8(700); let P = await panel(); const emRow = await ev(() => !!document.querySelector('.twn-p button[data-em]')); ok(P && /지금 생긴 일/.test(P.t) && emRow, '장소 찾기(F) 맨 위 = 지금 생긴 일(불난 집)');
    await ev(() => { const b9 = document.querySelector('.twn-p button[data-em]'); if (b9) b9.click(); }); await W8(600); const rn = await ev(() => SM_TOWN.routeNow()); ok(!!rn, '🧭 길 = 빨간 선 (' + (rn ? rn.len + 'm' : '없음') + ')');
    { const hj = await ev(() => SM_TOWN.hud.on('jump')); if (hj) { await p.keyboard.press('KeyJ'); await W8(700); await p.keyboard.type('불'); await W8(400); const jb = await ev(() => !!document.querySelector('.twn-p .jr button[data-em]')); ok(jb, 'J 검색 「불」 = 지금 불난 집'); await closeAll(); } else console.log('    (J 바로 가기 잠김 — J 검색 건너뜀)'); }
    // ③ 끌 수 있음: 빨간 선을 따라 걸음(8m · 0.25초)
    { const pts = await ev(() => SM_TOWN.routePts()); if (pts) for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], c = pts[k], l = Math.hypot(c[0] - a[0], c[1] - a[1]); for (let t = 8; t < l + 8; t += 8) { const u = Math.min(1, t / l); await ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u]); await W8(220); } } }
    await W8(500); const near = await ev(() => SD2.near()); ok(/불 끄기/.test(near || ''), '빨간 선 끝 = 「소방관 도와 불 끄기」 E (' + near + ')'); await shot('fire_scene');
    await p.keyboard.press('KeyE'); await W8(900); ok((await ev(() => SM_TOWN.jobs().active)) === 'fire', '불난 집 앞 E = 소방 출동 시작' + (lockJ ? '' : '(직업 체험 잠김이어도)'));
    for (let i = 0; i < 40; i++) { const f = await F(); if (f && f.phase === 'hose') break; if (i === 6) await ev(() => SM_TOWN.jobs().dbg.rideEnd()); await W8(400); }
    let f1 = await F(); ok(f1 && f1.phase === 'hose', '소방차가 와서 섬 → 물 뿌리기'); const h0 = f1 ? f1.flames.reduce((a, v) => a + v, 0) : 0;
    await p.keyboard.down('KeyE'); await W8(5000); await p.keyboard.up('KeyE'); f1 = await F(); const h1 = f1 ? f1.flames.reduce((a, v) => a + v, 0) : 0; ok(f1 && h1 < h0 - 0.4, 'E 꾹 = 불꽃이 줄어듦 (' + h0.toFixed(1) + ' → ' + h1.toFixed(1) + ')'); await shot('fire_hose');
    if (f1 && f1.phase === 'hose') await ev(() => SM_TOWN.jobs().dbg.sprayAll()); await W8(900); f1 = await F(); ok(f1 && f1.phase === 'cat', '불을 다 끄면 지붕 위 고양이');
    { const st = await FS(); if (st && st.ladder) await ev(st => { const [x, z] = st.ladder; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, st); await W8(400); await p.keyboard.down('KeyE'); await W8(1900); await p.keyboard.up('KeyE'); for (let i = 0; i < 20; i++) { await W8(400); if (await ev(() => SD2.map.interact.list().some(h => !h.off && /이웃 주민 돕기|Help the neighbour/.test(h.label)))) break; } }   /* 고양이가 내려오고 1.3초 뒤 이웃 E가 생김 */
    for (let k = 0; k < 2; k++) { const st = await FS(), q = st && st.people && st.people[k]; if (!q) break; await ev(q => { const x = q.x - Math.sin(q.ry) * 0.9, z = q.z - Math.cos(q.ry) * 0.9; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, q); await W8(500); await p.keyboard.press('KeyE');
      for (let i = 0; i < 20; i++) { await W8(300); const r = await ev(() => { const B = [...document.querySelectorAll('.twn-dlg .ch button')]; if (B.length) { const ok9 = B.find(b9 => /몸을 낮추고|119/.test(b9.textContent)); (ok9 || B[0]).click(); return 'ch'; } const d = document.querySelector('.twn-dlg .dbox'); if (d) { d.click(); return 'dlg'; } return ''; }); if (!r && i > 3) break; } }
    await W8(800); P = await panel(); ok(P && P.k === 'firequiz', '이웃 둘 = 안전 알려 주기 → 소화기 순서 창');
    for (let i = 0; i < 4; i++) { await ev(i => { const b9 = document.querySelector('.twn-p button[data-i="' + i + '"]'); if (b9) b9.click(); }, i); await W8(250); }
    await W8(700); P = await panel(); ok(P && P.k === 'jobend' && /끝/.test(P.t), '소화기 순서 = 체험 끝 창'); await closeAll();
    // ④ 끝나면 바뀜
    const mk = await ev(() => SM_TOWN.jobs().dbg.mark()); ok(mk.drawn && mk.log && mk.log.s.length === 3, '불 끈 집 = 그을음 셋 + 소화기 (' + (mk.log ? mk.log.cell : '-') + ')'); await W8(400);
    { const lg = mk.log; if (lg && lg.s) { await ev(lg => { const M = SD2.map, o = lg.s[2], x = o[0] + Math.sin(lg.ry) * 9, z = o[2] + Math.cos(lg.ry) * 9; M.player.teleport([x, SM_TOWN.ground(x, z) + 0.3, z]); M.player.lookAt([o[0], o[2]]); }, lg); await W8(1200); await closeAll(); await W8(400); await shot('fire_after'); } }
    ok(!(await F()) && !(await ev(() => [...document.querySelectorAll('.gchip')].some(c => /🚒/.test(c.textContent)))), '끝나면 불·칩이 남지 않음'); g = await goalTx(); ok(!/불이 났어요|불난 집/.test(g), '할 일 줄이 장소 글로 돌아옴 「' + g + '」');
    const d0 = await ev(() => SM_TOWN.game().S.day); await ev(d => { SM_TOWN.game().S.day = d + 1; }, d0); await W8(1500); ok((await ev(() => SM_TOWN.jobs().dbg.mark())).drawn, '다음 날도 흔적이 남음');
    await ev(d => { SM_TOWN.game().S.day = d + 2; }, d0); await W8(1500); ok(!(await ev(() => SM_TOWN.jobs().dbg.mark())).drawn, '그다음 날 흔적이 사라짐');
    // 그냥 둔 불 = 소방관들이 끄고 흔적은 남음
    await setT(11 * 60); { let f9 = null; for (let i = 0; i < 8 && !f9; i++) { await W8(500); f9 = await F(); } if (!f9) await ev(() => SM_TOWN.jobs().dbg.offer()); } await closeAll();   /* 엔진이 있으면 그날 칸으로 생김(바로 띄우면 칸이 남아 한 번 더 생김) */ ok(!!(await F()), '다른 날 불(바로 띄움)'); await ev(() => SM_TOWN.jobs().dbg.autoNow()); await W8(1500); const mk2 = await ev(() => SM_TOWN.jobs().dbg.mark());
    ok(!(await F()) && mk2.drawn && mk2.log.d === d0 + 2, '그냥 두면 소방관들이 끔 · 흔적은 남음');
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
