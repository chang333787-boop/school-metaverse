// 🌾 생태 하천 물가 · 자전거 동행 시험(SHORE-1 · 사용자 11-02 '생태하천 돋보기가 위치가 그냥 땅인데? 어색함 흐름상, 자전거 타고 앉기도 전부터 어색했음')
//   node tools/harness/town_shore.cjs [마을=ourtown] [포트=8002] [--shots=폴더]   (브라우저는 zsh tools/ops/b2.sh로 — 그리기 켬 · 화면 밖 판정이 카메라를 씀)
//   ① 물가 자리: SM_TOWN.shoreSpot() · 이름표 '생태 하천' = 그 자리 · 목표점 3m 안에 물 · 갈대 셋 이상 · 물속 돌 둘 이상 · 길에서 걸어 닿음(walkLen)
//   ② 1-4 돋보기: 목표(빨간 선·❗) = 물가 자리 · 흙을 보면 안 넘어가고 한 줄 · 물(또는 돌·갈대)을 보면 넘어감 · 성공 글 = 물속 돌·갈대
//   ③ 1-4 반딧불이: 다른 물가에서 반딧불이가 떠도 안 넘어감 · 그 물가(목표 45m 안)에서 넘어감
//   ④ 1-2 자전거 단계: 탄 뒤 '자전거(B)나 버스를 타 봐요' 알림 X
//   ⑤ 새 친구 자전거 동행: 타면 0.4초 뒤 친구도 그 자리에서 자전거(사라짐 X · 튐 X) · 곧은 길 21m/s · 굽은 길 7.5m/s 따라옴(간격 · 프레임 튐) · 멈추면 곁으로 · 내리면 그 자리에서 내림
//   ⑥ 페이지 오류 0
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
(async () => {
  const FF_I = (await import(require('path').resolve(__dirname, '../../v2/games/town_story.js'))).CHAPTERS.find(q => q.id === 'a1_6').steps.findIndex(q => q.id === 'ff');   /* COVER-4: 1-4에 도감 단계가 들어와 번호 대신 id */
  if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  try {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (!SHOTS) return; await W8(300); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); };
    const tp = (x, z, lx, lz) => ev(([x, z, lx, lz]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); }, [x, z, lx, lz]);
    const step = () => ev(() => { const s = SM_TOWN.story(); return s.step ? s.step.id : null; });
    const closeAll = () => ev(() => { for (let i = 0; i < 4; i++) { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); const d = document.querySelector('.twn-dlg .dbox'); if (d) d.click(); } });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.tools, null, { timeout: 240000 }); await W8(2500); await closeAll(); await W8(600);
    const noPlan = () => ev(() => { const G = SM_TOWN.game().S; if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } });   /* 시험 동안 긴급 사건이 저절로 생기지 않게 */
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1, a1_3: 1, c3: 1 }); G.min = 10 * 60; SM_TOWN.rules.wx('clear'); const T = G.tools || (G.tools = {}); (T.have || (T.have = {})).lens = 1; }); await noPlan();
    // 토스트 모으기(④·② 한 줄)
    await ev(() => { const R = window.__SHT = []; new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) { const t = (n.innerText || n.textContent || '').replace(/\s+/g, ' ').trim(); if (t && t.length < 200) { R.push(t); if (R.length > 80) R.shift(); } } }).observe(document.body, { childList: true, subtree: true, characterData: false }); });
    const toasts = () => ev(() => window.__SHT.slice()), clrT = () => ev(() => { window.__SHT.length = 0; });

    console.log('① 생태 하천 물가 자리');
    const SH = await ev(() => SM_TOWN.shoreSpot()); ok(!!SH, '물가 자리 있음 ' + (SH ? '(' + SH.x + ', ' + SH.z + ') 갈대 ' + SH.nR + ' · 돌 ' + SH.st.length : ''));
    if (!SH) throw new Error('물가 자리 없음');
    const PL = await ev(() => SM_TOWN.places().filter(q => q.name === '생태 하천')); ok(PL.length === 1 && Math.hypot(PL[0].door[0] - SH.x, PL[0].door[1] - SH.z) < 0.1, "이름표 '생태 하천' = 물가 자리 (" + PL.map(q => q.door.join(',')).join(' / ') + ')');
    const W3 = await ev(([x, z]) => { let m = 9; for (let r = 0; r <= 3; r += 0.5) for (let a = 0; a < 16; a++) m = Math.min(m, SM_TOWN.sd(x + Math.cos(a * Math.PI / 8) * r, z + Math.sin(a * Math.PI / 8) * r)); return { here: SM_TOWN.sd(x, z), min3: m }; }, [SH.x, SH.z]);
    ok(W3.min3 < 0 && W3.here > 1.2, '목표점 3m 안에 물(물가 선까지 ' + W3.here + 'm · 3m 안 가장 깊은 곳 ' + W3.min3 + ')');
    ok(SH.nR >= 3, '곁 갈대 무리 ' + SH.nR);
    const stW = await ev(st => st.filter(s => SM_TOWN.sd(s[0], s[2]) < 0).length, SH.st); ok(stW >= 2 && SH.st.length >= 4, '물가 돌 ' + SH.st.length + ' (얕은 물속 ' + stW + ')');
    const RT = await ev(([x, z]) => { const R = SM_TOWN.schRect(), g = [(R[0] + R[2]) / 2, R[3] + 6], r = SM_TOWN.routeXY(g, [x, z]); if (!r || !r.ok) return { ok: false }; const a = r.pts[Math.max(0, r.pts.length - 3)]; return { ok: true, len: Math.round(r.len), wl: SM_TOWN.walkLen([a[0], a[1]], [x, z], 2.2, 30) }; }, [SH.x, SH.z]);
    ok(RT.ok && RT.wl >= 0, '학교 정문에서 길 ' + RT.len + 'm · 마지막 길 점에서 걸어 닿음 ' + RT.wl + 'm');

    console.log('② 1-4 돋보기');
    await ev(() => SM_TOWN.storyAt('a1_6', 1)); await W8(1500); await closeAll();
    let st0 = await step(); const tg = await ev(() => SM_TOWN.storyTarget()); ok(st0 === 'lens' && tg && Math.hypot(tg.x - SH.x, tg.z - SH.z) < 0.5, '돋보기 단계 목표 = 물가 자리 (' + (tg ? tg.x + ', ' + tg.z : '-') + ')');
    const gs = await ev(() => SM_TOWN.goalSp()); ok(!gs || Math.hypot(gs.x - SH.x, gs.z - SH.z) < 1, '❗ 자리 = 물가 자리 ' + JSON.stringify(gs));
    const bx = SH.x + SH.ux * 3.5, bz = SH.z + SH.uz * 3.5; await tp(bx, bz, SH.wx, SH.wz); await W8(1500); await shot('shore_spot');
    await tp(SH.x, SH.z, SH.wx, SH.wz); await W8(900); await closeAll();
    await ev(() => SM_TOWN.tools.hold('lens')); await W8(500); await closeAll();
    // 흙(물가 반대쪽)을 보면 안 넘어감 + 한 줄
    await clrT(); const soil = await ev(([x, z]) => SM_TOWN.tools.aim(x, z), [SH.x + SH.ux * 1.6, SH.z + SH.uz * 1.6]); await ev(() => SM_TOWN.tools.use()); await W8(2600);
    let tt = await toasts(); ok((await step()) === 'lens' && /그냥 흙/.test(tt.join(' | ')), '흙을 보면 안 넘어감 + 한 줄 (겨눔 ' + (soil.lock || '흙') + ') 「' + (tt.find(t => /흙/.test(t)) || '').slice(0, 60) + '」');
    // 물속 돌(없으면 물)을 겨눔
    let lk = null; for (const s of SH.st) { const r = await ev(([x, z]) => SM_TOWN.tools.aim(x, z), [s[0], s[2]]); if (r.lock === 'stone') { lk = r; break; } }
    if (!lk) lk = await ev(([x, z]) => SM_TOWN.tools.aim(x, z), [SH.ex - SH.ux * 1.0, SH.ez - SH.uz * 1.0]);
    const wa = await ev(([x, z]) => SM_TOWN.tools.aim(x, z), [SH.ex - SH.ux * 1.0, SH.ez - SH.uz * 1.0]); ok(wa.lock === 'water' || wa.lock === 'stone', '얕은 물을 겨누면 노란 고리(' + wa.lock + ')');
    await clrT(); await ev(([x, z]) => SM_TOWN.tools.aim(x, z), [lk.x, lk.z]); await shot('shore_lens_aim'); await ev(() => SM_TOWN.tools.use()); await W8(2800);
    tt = await toasts(); const st1 = await step(); ok(st1 === 'clean', '물가(' + lk.lock + ')를 보면 넘어감 → ' + st1); ok(tt.some(t => /얕은 물속 돌까지|물속 돌|바닥 돌/.test(t)), '성공 글 = 물속 돌·갈대 「' + (tt.find(t => /돌/.test(t)) || '').slice(0, 70) + '」'); await shot('shore_lens_done');
    await ev(() => SM_TOWN.tools.aim(null)); await ev(() => SM_TOWN.tools.hold(null)); await closeAll();

    console.log('③ 1-4 반딧불이');
    const far = await ev(([sx, sz]) => { for (let r = 90; r < 600; r += 30) for (let a = 0; a < 24; a++) { const x = sx + Math.cos(a / 24 * 6.283) * r, z = sz + Math.sin(a / 24 * 6.283) * r, s = SM_TOWN.sd(x, z); if (s > 1.5 && s < 3 && !SM_TOWN.inSchool(x, z)) return [x, z]; } return null; }, [SH.x, SH.z]);
    if (far) { await tp(far[0], far[1]); await W8(600); } await ev(i9 => { const G = SM_TOWN.game().S; SM_TOWN.season('summer'); G.min = 21 * 60; SM_TOWN.rules.wx('clear'); SM_TOWN.storyAt('a1_6', i9); }, FF_I); await W8(1500); await closeAll(); const ffSt = await step();
    if (ffSt === 'ff' && far) { await W8(2600); const f1 = await ev(() => SM_TOWN.ff()), s1 = await step(); ok(s1 === 'ff', '다른 물가(' + Math.round(Math.hypot(far[0] - SH.x, far[1] - SH.z)) + 'm 밖)에선 반딧불이가 떠도(' + (f1 ? f1.n : 0) + ') 안 넘어감');
      await tp(SH.x, SH.z, SH.wx, SH.wz); await W8(3200); await shot('shore_ff'); const s2 = await step(); ok(s2 === 'line', '그 물가에서 반딧불이 → 넘어감 (' + s2 + ')'); }
    else ok(false, '반딧불이 단계 준비 ' + ffSt + ' · 다른 물가 ' + JSON.stringify(far));
    await closeAll(); await ev(() => { SM_TOWN.storyOff && SM_TOWN.storyOff(); const G = SM_TOWN.game().S; G.min = 10 * 60; }); await W8(800);

    console.log('④ 1-2 자전거 단계 알림');
    const R0 = await ev(() => SM_TOWN.schRect()); await tp((R0[0] + R0[2]) / 2, R0[3] + 30); await W8(800);
    await ev(() => SM_TOWN.storyAt('a1_3', 1)); await W8(1200); await closeAll(); ok((await step()) === 'bike', '1-2 자전거 단계');
    await clrT(); await p.keyboard.press('KeyB'); await W8(3600); tt = await toasts(); ok(!tt.some(t => /자전거\(B\)나 버스/.test(t)), "탄 뒤 '자전거(B)나 버스를 타 봐요' X (" + tt.filter(t => /🚲/.test(t)).map(t => t.slice(0, 40)).join(' | ') + ')');
    await p.keyboard.press('KeyB'); await W8(900); await closeAll(); await ev(() => { SM_TOWN.storyOff && SM_TOWN.storyOff(); }); await W8(500);

    console.log('⑤ 새 친구 자전거 동행'); await noPlan();
    const RT2 = await ev(([sx, sz]) => { const R = SM_TOWN.schRect(), g = [(R[0] + R[2]) / 2, R[3] + 8], r = SM_TOWN.routeXY(g, [sx, sz]); if (!r || !r.ok) return null; let L = 0, mx = 0, at = 0; for (let i = 1; i < r.pts.length; i++) { const d = Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]); if (d > mx && i < r.pts.length - 2) { mx = d; at = i; } L += d; } return mx > 40 ? { pts: r.pts.map(q9 => [q9[0], q9[1]]), mx, at, nm: '생태 하천', L } : null; }, [SH.x, SH.z]);   /* 학교 정문 → 생태 하천(이 장 그대로의 길) */
    ok(!!RT2, '시험 길 ' + (RT2 ? RT2.nm + ' ' + Math.round(RT2.L) + 'm · 곧은 토막 ' + Math.round(RT2.mx) + 'm' : '없음'));
    if (RT2) {
      const A0 = RT2.pts[RT2.at - 1], A1 = RT2.pts[RT2.at];
      await tp(A0[0], A0[1], A1[0], A1[1]); await ev(() => SM_TOWN.friendOn(true)); await W8(1500);
      // 걸으며 곁으로 오게 3m
      await ev(([x, z]) => { const M = SD2.map, q = M.player.get(); M.player.steer(x - q.x, z - q.z, 3, true); }, A1); await W8(900); await ev(() => SD2.map.player.steer(null)); await W8(1400);
      const f0 = await ev(() => SM_TOWN.friend()); ok(f0.on && f0.walkVis && !f0.rd, '걷는 친구가 곁에 (' + JSON.stringify({ x: f0.x, z: f0.z }) + ')');
      // 기록기(프레임마다): 친구 자리 · 보이는지 · 튐 · 간격
      await ev(() => { const R = window.__FR = { n: 0, mx: 0, mxAt: '', gap: 0, gapN: 0, gapSum: 0, hid: 0, scr: 0, jn0: SM_TOWN.friend().jn, last: null, ev: [], on: 1, rdAt: null }; const V = new SD2.map.camera.position.constructor(); const f = () => { if (!R.on) return; requestAnimationFrame(f); const F = SM_TOWN.friend(), q = SD2.map.player.get(); const vis = F.walkVis || (F.bike && F.bike.on); if (!vis) R.hid++; if (F.rd) { V.set(F.x, F.y + 0.8, F.z).project(SD2.map.camera); if (V.z < 1 && Math.abs(V.x) < 1 && Math.abs(V.y) < 1) R.scr++; } if (R.last && F.jn === R.last.jn) { const d = Math.hypot(F.x - R.last.x, F.z - R.last.z); if (d > R.mx) { R.mx = d; R.mxAt = (F.rd ? '탐' : '걸음') + ' ' + R.n; } } if (R.last && R.last.rd !== F.rd) R.ev.push([R.n, F.rd ? '탐' : '내림', +Math.hypot(F.x - R.last.x, F.z - R.last.z).toFixed(2)]); const g = Math.hypot(F.x - q.x, F.z - q.z); if (F.rd) { R.gap = Math.max(R.gap, g); R.gapSum += g; R.gapN++; } R.last = F; R.n++; }; requestAnimationFrame(f); });
      const fpre = await ev(() => SM_TOWN.friend());
      await p.keyboard.press('KeyB'); await W8(150); const fm0 = await ev(() => SM_TOWN.friend()); await W8(700); const fm1 = await ev(() => SM_TOWN.friend()); await shot('bike_mount');
      ok(fm0.walkVis && !fm0.rd, '내가 막 탄 순간 = 친구는 아직 서 있음(사라짐 X)'); ok(fm1.rd && fm1.bike && fm1.bike.on && !fm1.walkVis && Math.hypot(fm1.x - fpre.x, fm1.z - fpre.z) < 2.5, '0.4초 뒤 친구도 그 자리에서 자전거 (' + Math.hypot(fm1.x - fpre.x, fm1.z - fpre.z).toFixed(2) + 'm)');
      // 곧은 토막 W 키(21m/s) 3초
      await p.keyboard.down('KeyW'); await W8(1500); await shot('bike_ride_fast'); await W8(1500); await p.keyboard.up('KeyW');
      const fr1 = await ev(() => { const F = SM_TOWN.friend(), q = SD2.map.player.get(); return { g: +Math.hypot(F.x - q.x, F.z - q.z).toFixed(1), pv: F.pv, rd: F.rd, R: { mx: +window.__FR.mx.toFixed(2), at: window.__FR.mxAt, gap: +window.__FR.gap.toFixed(1), hid: window.__FR.hid } }; });
      ok(fr1.rd && fr1.R.hid === 0, '달리는 동안 친구가 늘 보임(숨은 프레임 ' + fr1.R.hid + ')'); ok(fr1.R.gap < 14, '곧은 길 21m/s 간격 가장 큼 ' + fr1.R.gap + 'm (멈춘 뒤 ' + fr1.g + 'm)');
      ok(fr1.R.mx < 2.4, '프레임 튐 가장 큼 ' + fr1.R.mx + 'm (' + fr1.R.at + ' · 21m/s × 0.1초 = 2.1)');
      await W8(1800); const fr2 = await ev(() => { const F = SM_TOWN.friend(), q = SD2.map.player.get(); return { g: +Math.hypot(F.x - q.x, F.z - q.z).toFixed(1), off: F.off, sp: F.bike && F.bike.sp }; }); ok(fr2.g < 5.5, '멈추면 곁으로 ' + fr2.g + 'm (옆 ' + fr2.off + ' · 바퀴 ' + fr2.sp + ')'); await shot('bike_stop');
      // 굽은 길: 남은 빨간 선 점을 steer(7.5m/s)로
      const PB = RT2.pts.slice(RT2.at, RT2.at + 8); await ev(P => { const D = window.__SHD = { P, j: 0, on: 1, done: 0 }; const f = () => { if (!D.on) { SD2.map.player.steer(null); return; } requestAnimationFrame(f); const M = SD2.map, q = M.player.get(); let tg = D.P[D.j], d = Math.hypot(tg[0] - q.x, tg[1] - q.z); while (d < 2 && D.j < D.P.length - 1) { D.j++; tg = D.P[D.j]; d = Math.hypot(tg[0] - q.x, tg[1] - q.z); } if (D.j === D.P.length - 1 && d < 2) { D.done = 1; M.player.steer(null); } else M.player.steer(tg[0] - q.x, tg[1] - q.z, 7.5, true); }; requestAnimationFrame(f); }, PB);
      for (let i = 0; i < 60 && !(await ev(() => window.__SHD.done)); i++) { await W8(500); if (i === 6) await shot('bike_ride_turn'); }
      await ev(() => { window.__SHD.on = 0; }); await W8(1800);
      const fr3 = await ev(() => { const F = SM_TOWN.friend(), q = SD2.map.player.get(); return { off: F.off, g: +Math.hypot(F.x - q.x, F.z - q.z).toFixed(1), R: { mx: +window.__FR.mx.toFixed(2), at: window.__FR.mxAt, gap: +window.__FR.gap.toFixed(1), avg: +(window.__FR.gapSum / Math.max(1, window.__FR.gapN)).toFixed(1), hid: window.__FR.hid, jn: SM_TOWN.friend().jn - window.__FR.jn0 } }; });
      ok(fr3.R.hid === 0 && fr3.R.mx < 2.4, '굽은 길(빨간 선) 동안 늘 보임 · 튐 가장 큼 ' + fr3.R.mx + 'm · 화면 밖 붙기 ' + fr3.R.jn); const scr = await ev(() => +(window.__FR.scr / Math.max(1, window.__FR.gapN)).toFixed(2)); ok(scr >= 0.7, '탄 동안 친구가 화면 안 ' + Math.round(scr * 100) + '% (나란히 달림)'); ok(fr3.g < 5.5 && fr3.R.avg < 7, '도착 뒤 곁 ' + fr3.g + 'm · 탄 동안 평균 간격 ' + fr3.R.avg + 'm');
      // 내림
      const fpre2 = await ev(() => SM_TOWN.friend()); await p.keyboard.press('KeyB'); await W8(150); const fd0 = await ev(() => SM_TOWN.friend()); await W8(700); const fd1 = await ev(() => SM_TOWN.friend()); await shot('bike_dismount');
      ok(fd0.rd && fd0.bike.on, '내가 막 내린 순간 = 친구는 아직 자전거 위'); ok(!fd1.rd && fd1.walkVis && !(fd1.bike && fd1.bike.on) && Math.hypot(fd1.x - fpre2.x, fd1.z - fpre2.z) < 2.5, '0.4초 뒤 친구도 그 자리에서 내림 (' + Math.hypot(fd1.x - fpre2.x, fd1.z - fpre2.z).toFixed(2) + 'm)');
      const R9 = await ev(() => { window.__FR.on = 0; return window.__FR; }); console.log('    탐·내림 사건 ' + JSON.stringify(R9.ev) + ' · 프레임 ' + R9.n);
      ok(R9.ev.every(e => e[2] < 1.2), '타고 내릴 때 자리 튐 X (' + R9.ev.map(e => e[1] + ' ' + e[2] + 'm').join(' · ') + ')');
    }
    console.log('⑥ 페이지 오류'); ok(errs.length === 0, '페이지 오류 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));
  } catch (e) { ok(false, '시험 중단: ' + (e && e.message ? e.message.slice(0, 200) : e)); }
  await b.close();
  console.log(fails ? '✗ ' + fails + '개 실패' : '✓ 모두 통과'); process.exit(fails ? 1 : 0);
})();
