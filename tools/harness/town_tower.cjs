// 🗼 마디탑 전망대 시험(TOWER-1 · v2/games/town_tower.js): node tools/harness/town_tower.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--perf]
//   ① 타워가 서 있음(자리 · 칸 · 키 · 충돌) ② 입구 E → 엘리베이터 창(층 숫자가 오름) → 3초 안 꼭대기 도착 ③ 전망층에서 안개·카메라 far가 넓어짐
//   ④ 가장자리로 여덟 방향 걸어도 떨어지지 않음(높이 유지 · 난간 안) ⑤ 망원경 E = 이름·방위·거리 창 + 좁은 시점 · 다시 E = 그만 ⑥ 내려오기 → 땅 · 안개·far 되돌아옴
//   ⑦ 문 닫는 때(밤 11시) = 한 줄만 · 오르지 않음 ⑧ 페이지 오류 0 · --shots = 멀리서 낮·밤 · 전망층 풍경 낮·노을·밤 · 망원경 · --perf = 전망층 fps·그리기 수(그리기 켬)
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, PERF = process.argv.includes('--perf');
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const { RENDER } = require('./pw.cjs'), b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', ...(RENDER && !process.env.SWGL ? ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] : [])] });   /* GPU-1: 사진·성능 = GPU(맥 Metal) */
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (SHOTS) { await W8(900); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); } };
    const closeAll = async () => { for (let i = 0; i < 6; i++) { const o = await ev(() => !!document.querySelector('.twn-p') || !!document.querySelector('.twn-dlg')); if (!o) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); else { const c = document.querySelector('.twn-p button'); if (c) c.click(); } }); await W8(250); if (await ev(() => !!document.querySelector('.twn-dlg'))) { await p.keyboard.press('KeyE'); await W8(250); } } };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.tower && SM_TOWN.tower().on(), null, { timeout: 240000 }); await W8(3000); await closeAll();
    const setMin = m => ev(m9 => { SM_TOWN.game().S.min = m9; SM_TOWN.rules.wx('clear'); try { SM_TOWN.storyOff(); } catch (e) { void e; } }, m);
    await setMin(11 * 60);
    const I = () => ev(() => SM_TOWN.tower().info()), me = () => ev(() => { const q = SD2.map.player.get(); return { x: q.x, y: q.y, z: q.z }; });
    const fog2 = () => ev(() => { const s = SD2.scene || null; return { far: SD2.map.camera.far, fog: s && s.fog ? Math.round(s.fog.far) : null }; });
    const press = (re, ms = 400) => ev(async ([src, ms]) => { const re = new RegExp(src), M = SD2.map, me = M.player.get(); let h = null, bd = 1e9; for (const q of M.interact.list()) { if (q.kind !== 'game' || q.off || !re.test(q.label || '')) continue; const d = Math.hypot(q.x - me.x, q.z - me.z) + Math.abs(q.y - me.y) * 3; if (d < bd) { bd = d; h = q; } } if (!h) return { none: 1 };
      if (Math.hypot(h.x - me.x, h.z - me.z) > 0.6 || Math.abs(h.y - me.y) > 1) { M.player.teleport([h.x, h.y + 0.05, h.z]); await new Promise(r => setTimeout(r, 300)); } SD2.actOn(h); await new Promise(r => setTimeout(r, ms)); return { label: h.label, pan: !!document.querySelector('.twn-p'), toast: ((document.getElementById('toast') || {}).textContent || '') }; }, [re.source, ms]);

    // ── 1. 서 있음 ──
    console.log('── 1. 타워');
    let w = await I(); ok(w.built && w.site, '마디탑이 지어짐 — 자리 ' + (w.site ? w.site.x + ', ' + w.site.z + ' (' + w.site.cell + ') · 바닥 ' + w.site.g0 + ' · 전망층 ' + w.site.Yd + ' · 꼭대기 ' + w.site.top : '-'));
    ok(w.site && w.site.Yd - w.site.g0 > 140 && w.site.top - w.site.g0 < 300, '키: 전망층 ' + (w.site ? Math.round(w.site.Yd - w.site.g0) : '-') + 'm · 전체 ' + (w.site ? Math.round(w.site.top - w.site.g0) : '-') + 'm (산 290m보다 낮음)');
    ok(w.cols > 100, '충돌 상자 ' + w.cols + '개(광장·아랫집·전망층 바닥·난간·엘리베이터 집)');
    ok(w.tels.length >= 2, '망원경 ' + w.tels.length + '개 — ' + w.tels.map(t => t.nm + '(' + t.dir + ' ' + t.d + 'm)').join(' · '));
    const VP = (() => { const t = w.tels.find(q => /호수|Lake/.test(q.nm)) || w.tels[0]; return t ? [w.site.x + (w.site.x - t.x) * -1, w.site.z + (w.site.z - t.z) * -1] : [w.gate.x, w.gate.z]; })();   /* 사진 자리 = 호수 쪽(강 건너 트인 쪽) */
    const blk = await ev(() => { const T = SM_TOWN.tower().info().site, M = SD2.map; return !!(M.q.blocked || M.q.blockedAt)(T.x + 1, T.z + 1, T.g0 + 1); }); ok(blk, '몸통 자리는 몸이 막힘(뚫고 들어가지 않음)');
    const fog0 = await fog2(); console.log('  · 땅에서 카메라 far ' + Math.round(fog0.far) + ' · 안개 far ' + fog0.fog);
    if (SHOTS) { await ev(([x, z, cx, cz]) => { const M = SD2.map, ux = x - cx, uz = z - cz, L = Math.hypot(ux, uz), px = x + ux / L * 230, pz = z + uz / L * 230; M.player.teleport([px, SM_TOWN.ground(px, pz) + 0.05, pz]); M.player.lookAt([cx, cz]); M.player.setPitch(-0.3); }, [VP[0], VP[1], w.site.x, w.site.z]); await W8(2500); await shot('tw_near_day');
      await ev(() => { const M = SD2.map; M.player.teleport([16.5, SM_TOWN.ground(16.5, 70) + 0.05, 70]); }); await ev(([cx, cz]) => { SD2.map.player.lookAt([cx, cz]); SD2.map.player.setPitch(0.1); }, [w.site.x, w.site.z]); await W8(2000); await shot('tw_school_day'); }

    // ── 2. 올라가기 ──
    console.log('── 2. 올라가기');
    let r = await press(/전망대 올라가기|Go up/, 600); ok(!r.none && r.pan, '입구 E = 엘리베이터 창 「' + (r.label || '없음') + '」');
    const fl1 = await ev(() => { const e = document.querySelector('.twn-p [data-tw="fl"]'); return e ? e.textContent : ''; }); await W8(700); const fl2 = await ev(() => { const e = document.querySelector('.twn-p [data-tw="fl"]'); return e ? e.textContent : ''; });
    ok(parseInt(fl2) > parseInt(fl1), '층 숫자가 올라감 (' + fl1 + ' → ' + fl2 + ')');
    if (SHOTS) await shot('tw_lift');
    await W8(1800); w = await I(); let m = await me(); ok(w.mode === 'deck' && Math.abs(m.y - w.site.Yd) < 1, '3초 안 꼭대기 도착(전망층 y ' + m.y.toFixed(1) + ')');
    ok(!(await ev(() => !!document.querySelector('.twn-p'))), '도착하면 창이 닫힘');
    await W8(1500); const fog1 = await fog2(); ok(fog1.far > 2000 && (fog1.fog == null || fog1.fog > 1800), '전망층 = 카메라 far ' + Math.round(fog1.far) + ' · 안개 far ' + fog1.fog + ' (마을 끝까지)');

    // ── 3. 떨어지지 않음 ──
    console.log('── 3. 가장자리 걷기');
    let minY = 1e9, maxR = 0; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832; await ev(([x, y, z]) => SD2.map.player.teleport([x, y, z]), [w.site.x + Math.cos(a) * 7, w.site.Yd + 0.05, w.site.z + Math.sin(a) * 7]); await ev(([dx, dz]) => SD2.map.player.steer(dx, dz, 6, false), [Math.cos(a), Math.sin(a)]); for (let i = 0; i < 6; i++) { await W8(300); const q = await me(); minY = Math.min(minY, q.y); maxR = Math.max(maxR, Math.hypot(q.x - w.site.x, q.z - w.site.z)); } await ev(() => SD2.map.player.steer(null)); }
    ok(minY > w.site.Yd - 0.5 && maxR < 12.3, '여덟 방향 가장자리로 1.8초씩 걸어도 그대로(가장 낮은 y ' + minY.toFixed(2) + ' · 가장 먼 ' + maxR.toFixed(2) + 'm · 난간 12.3m)');
    w = await I(); ok(w.mode === 'deck', '아직 전망층');
    if (SHOTS) { for (const [k, mn] of [['day', 11 * 60], ['sunset', 18 * 60 + 40], ['night', 21 * 60]]) { await setMin(mn); await ev(() => { const s = SM_TOWN.tower().info().site, M = SD2.map; const ux = 17 - s.x, uz = 50 - s.z, L = Math.hypot(ux, uz); M.player.teleport([s.x + ux / L * 8, s.Yd + 0.05, s.z + uz / L * 8]); }); await ev(([x, z]) => { SD2.map.player.lookAt([x, z]); SD2.map.player.setPitch(0.3); }, [17, 50]); await W8(3500); await shot('tw_deck_' + k); } await setMin(11 * 60); await W8(1500); }

    // ── 4. 망원경 ──
    console.log('── 4. 망원경');
    for (const t of w.tels) { r = await press(new RegExp('망원경 — ' + t.nm.replace(/[()]/g, '.')), 600); const sc = await ev(() => ({ id: SM_TOWN.tower().info().scope, ov: (document.querySelector('.twn-scope') || {}).textContent || '', peek: !!(SD2.CTRL && SD2.CTRL.peek), fov: SD2.map.camera.fov }));
      ok(sc.id && sc.peek && /km|m/.test(sc.ov), '🔭 ' + t.nm + ' = 좁은 시점 + 「' + sc.ov.replace(/그만 보기.*/, '').slice(0, 90) + '」');
      if (SHOTS && t === w.tels[0]) { await W8(1500); await shot('tw_scope'); }
      await press(new RegExp('망원경 — ' + t.nm.replace(/[()]/g, '.')), 300); const off = await ev(() => ({ id: SM_TOWN.tower().info().scope, ov: !!document.querySelector('.twn-scope'), peek: !!(SD2.CTRL && SD2.CTRL.peek) })); ok(!off.id && !off.ov && !off.peek, '다시 E = 그만 보기'); }
    await press(new RegExp('망원경 — ' + w.tels[0].nm.replace(/[()]/g, '.')), 400); await p.keyboard.press('KeyW'); await W8(200); ok(!(await I()).scope, '걷기 키를 누르면 망원경을 내려놓음');

    if (PERF) { await ev(() => { const s = SM_TOWN.tower().info().site; SD2.map.player.teleport([s.x + 9, s.Yd + 0.05, s.z + 3]); SD2.map.player.lookAt([17, 50]); }); await W8(3000);
      const pf = await ev(async () => { const R = SD2.renderer; let n = 0, calls = 0, tri = 0, worst = 0, last = performance.now(); const t0 = last; await new Promise(res => { const f = () => { const t = performance.now(); worst = Math.max(worst, t - last); last = t; n++; if (R) { calls = Math.max(calls, R.info.render.calls); tri = Math.max(tri, R.info.render.triangles); } if (t - t0 < 5000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }); return { fps: +(n / 5).toFixed(1), worst: Math.round(worst), calls, tri }; });
      console.log('  · 전망층 성능: ' + JSON.stringify(pf)); ok(pf.fps >= 30, '전망층 fps ' + pf.fps + ' (≥ 30) · 그리기 ' + pf.calls + ' · 삼각형 ' + pf.tri);
      await ev(() => { const s = SM_TOWN.tower().info().site; SD2.map.player.teleport([s.x + 40, SM_TOWN.ground(s.x + 40, s.z) + 0.05, s.z]); SD2.map.player.lookAt([s.x, s.z]); }); await W8(3000);
      const pg = await ev(async () => { const R = SD2.renderer; let n = 0, calls = 0; const t0 = performance.now(); await new Promise(res => { const f = () => { n++; if (R) calls = Math.max(calls, R.info.render.calls); if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }); return { fps: +(n / 4).toFixed(1), calls }; }); console.log('  · 타워 밑 땅 성능: ' + JSON.stringify(pg));
      await press(/전망대 올라가기|Go up/, 300); await W8(3000); }

    // ── 5. 내려오기 ──
    console.log('── 5. 내려오기');
    r = await press(/엘리베이터로 내려가기|lift down/, 600); ok(!r.none && r.pan, '가운데 E = 내려가는 창');
    await W8(2600); w = await I(); m = await me(); ok(w.mode === '' && Math.abs(m.y - w.site.g0) < 2, '땅으로 내려옴(y ' + m.y.toFixed(1) + ' · 광장 ' + w.site.g0 + ')');
    await W8(1500); const fog3 = await fog2(); ok(Math.abs(fog3.far - fog0.far) < 1 && fog3.fog === fog0.fog, '안개·far 되돌아옴(far ' + Math.round(fog3.far) + ' · 안개 ' + fog3.fog + ')');
    if (SHOTS) { await setMin(21 * 60); await ev(([cx, cz]) => { const M = SD2.map; M.player.teleport([16.5, SM_TOWN.ground(16.5, 70) + 0.05, 70]); M.player.lookAt([cx, cz]); M.player.setPitch(0.1); }, [w.site.x, w.site.z]); await W8(3500); await shot('tw_school_night');
      await ev(([x, z, cx, cz]) => { const M = SD2.map, ux = x - cx, uz = z - cz, L = Math.hypot(ux, uz), px = x + ux / L * 230, pz = z + uz / L * 230; M.player.teleport([px, SM_TOWN.ground(px, pz) + 0.05, pz]); M.player.lookAt([cx, cz]); M.player.setPitch(-0.3); }, [VP[0], VP[1], w.site.x, w.site.z]); await W8(3000); await shot('tw_near_night'); await setMin(11 * 60); }

    // ── 6. 문 닫는 때 ──
    console.log('── 6. 닫는 때');
    await setMin(23 * 60); r = await press(/전망대 올라가기|Go up/, 500); ok(!r.pan && /문을 닫았|closed/.test(r.toast), '밤 11시 = 문 닫음 한 줄 「' + r.toast.slice(0, 50) + '」'); await setMin(11 * 60);

    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외', e.message); }
  await b.close(); console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
