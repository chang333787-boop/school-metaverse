// 📏 PERF-F 토론 판정 작은 고침 확인(perf.md 11-08 PERF-F 근거 · 스크래치 pff/pf.cjs에서 옮김) — PERF-G(11-08 토론 판정 10 ④): 근거로 쓴 도구를 저장소에(town_critique_1031.md:192 같은 실수 X) · 쓰는 법은 아래 원래 머리말 그대로
// PERF-F 확인 하네스(스크래치) — node pf.cjs <서빙 폴더> <태그> [--port=8941] [--only=town,ti,ctx,nogl] [--base]
//   town = 2코어 크롬북 흉내(low) 한 판: 짓기(CPU 4×) 직후 자동 해상도 기록 · 30 고정(마을 안만) · 안개 누적 · 학원·선생님 받기 막기 · 마디탑 16× · 게임 멈춤 뒤 60
//   ti = ?tifail=1 → 다음 열기 예전 길 → ?ti=1 되살림
//   ctx = 문맥 잃음 두 번(둘째 = 단추) · 홍보판 첫 번째 = 저절로
//   nogl = WebGL을 못 만들 때 안내 한 줄
//   --base = 옛 코드(새 기능 확인은 건너뛰고 값만 적음)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const root = path.resolve(pos[0] || '.'), TAG = pos[1] || 'x';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const PORT = +(arg('port') || 8941), BASE = process.argv.includes('--base');
const ONLY = (arg('only') || '').split(',').filter(Boolean), on = k => !ONLY.length || ONLY.includes(k);
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'sm-perf_f_check');   /* 결과·사진 = OUT(기본 임시 폴더 · 저장소에 안 남김) */ fs.mkdirSync(OUT, { recursive: true });
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); r.end(d); }); });
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
const fails = [], R = { tag: TAG, base: BASE };
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails.push(m); };
const note = m => console.log('  · ' + m);
const W8 = ms => new Promise(r => setTimeout(r, ms));

srv.listen(PORT, async () => {
  const base = 'http://127.0.0.1:' + PORT, errs = [];
  const b = await chromium.launch({ args: GPU });
  const T0 = Date.now(), el = () => ((Date.now() - T0) / 1000).toFixed(0) + 's';
  const mkCtx = async (low) => { const c = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
    if (low) await c.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 2 }); Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 4 }); });
    return c; };
  const watchErr = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 200))); };
  const closeAll = async (p) => { for (let i = 0; i < 8; i++) { const st = await p.evaluate(() => ({ dlg: !!(window.SM_TOWN && SM_TOWN.dlgOn && SM_TOWN.dlgOn()), pn: !!document.querySelector('.twn-p') })).catch(() => ({})); if (st.dlg) { await p.keyboard.press('Escape'); await W8(250); continue; } if (!st.pn) break;
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }).catch(() => null); await W8(300); } };
  try {
    if (on('town')) {
      console.log('\n[town] 2코어 크롬북 흉내 · 새 판 · ' + el());
      const c = await mkCtx(true);
      let blocked = 0; await c.route(/town_(acad|teach)\.js/, rt => { blocked++; rt.abort(); });
      const p = await c.newPage(); watchErr(p, 'town'); const cons = []; p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') cons.push(m.text().slice(0, 160)); });
      const cdp = await c.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const t0 = Date.now(); await p.goto(base + '/v2/?town=ourtown');
      await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && window.SD2, null, { timeout: 400000, polling: 200 });
      const A1 = await p.evaluate(() => { const A = SD2.gfx.auto, F = SD2.gfx.fm; return { s: 0, autoLog: A.log.slice(), fail: [...A.fail.entries()], capT: A.capT ? Math.round(A.capT - performance.now()) : 0, lvl: A.lvl, dpr: SD2.gfx.dpr, fmLog: F.log.slice(), lv: F.lv, q: F.q, target: F.target, build: window.SM_BUILD, loadMs: SM_TOWN.load.ms, ladder: A.ladder.slice() }; });
      R.buildSec = (Date.now() - t0) / 1000; R.after = A1; console.log('  짓기 ' + R.buildSec.toFixed(1) + '초 · 직후 ' + JSON.stringify(A1));
      await W8(6000);
      const A2 = await p.evaluate(() => { const A = SD2.gfx.auto, F = SD2.gfx.fm; return { autoLog: A.log.slice(), fail: [...A.fail.entries()], capT: A.capT ? Math.round(A.capT - performance.now()) : 0, lvl: A.lvl, fmLog: F.log.slice(), q: F.q, target: F.target, mode: F.mode, town: F.town, programs: SD2.renderer.info.programs.length }; });
      R.after6 = A2; console.log('  6초 뒤 ' + JSON.stringify(A2));
      if (!BASE) { ok(!A1.autoLog.length && !A1.fail.length && !A1.capT, '짓는 동안 자동 해상도 내림·실패·5분 잠금 0(log ' + A1.autoLog.length + ' · fail ' + A1.fail.length + ' · capT ' + A1.capT + ')');
        ok(A1.ladder.join(',') === '1,0.75', '저사양 사다리 ' + A1.ladder.join(' → '));
        ok(A2.q === true && A2.target === 30 && A2.town === true, '마을 안 = 30 고정(q ' + A2.q + ' · 목표 ' + A2.target + ')'); }
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await closeAll(p); await p.keyboard.press('Escape'); await W8(400); await closeAll(p);
      await p.evaluate(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.min = 12 * 60; G.S.story = G.S.story || {}; G.S.story.done = Object.assign(G.S.story.done || {}, { p0: 1, a1_1: 1 }); G.S.story.p0auto = 1; if (G.S.emerg) { G.S.emerg.d = G.S.day; G.S.emerg.plan = []; } });
      await W8(800); await closeAll(p);
      /* 안개 누적: fm 단계 1(fk 0.8)로 강제 · 판정 멈춤(cool) → 하늘에서 보기 셋 · 마디탑 오르내림 둘 */
      const fogRd = () => p.evaluate(() => ({ far: SD2.scene.fog.far, near: SD2.scene.fog.near, rFar: window.__FF, camFar: SD2.camera.far }));
      await p.evaluate(() => { const sc = SD2.scene, pv = sc.onBeforeRender; sc.onBeforeRender = function (...a) { window.__FF = sc.fog.far; if (pv) pv.apply(this, a); }; });
      const down = async () => { await p.evaluate(() => { const P = SD2.map.player; P.teleport([123, SM_TOWN.ground(123, 785) + 0.05, 785]); }); };
      await down(); await W8(2500);
      const f00 = await fogRd(); note('단계 0 안개 ' + JSON.stringify(f00));
      await p.evaluate(() => { const F = SD2.gfx.fm; F.cool = 99999; F.lv = 1; F.fk = 0.8; F.step = '안개 당김'; });
      await W8(1500); const f0 = await fogRd(); note('단계 1 처음 ' + JSON.stringify(f0));
      await p.screenshot({ path: path.join(OUT, TAG + '_fk08_down.png') });
      for (let i = 0; i < 3; i++) { await p.evaluate(() => SD2.top.enter()); await W8(1500); await p.evaluate(() => SD2.top.exit()); await W8(1500); }
      const fT = await fogRd(); note('하늘에서 보기 셋 뒤 ' + JSON.stringify(fT));
      const site = await p.evaluate(() => { const s = SM_TOWN.tower().info().site; return { x: s.x, z: s.z, Yd: s.Yd }; });
      for (let i = 0; i < 2; i++) { await p.evaluate(s => { SD2.map.player.teleport([s.x + 9, s.Yd + 0.05, s.z + 3]); SD2.map.player.lookAt([17, 50]); }, site); await W8(3500);
        if (i === 0) { const fu = await fogRd(); note('전망층 위 ' + JSON.stringify(fu)); R.fogTower = fu; await p.screenshot({ path: path.join(OUT, TAG + '_fk08_tower.png') }); }
        await down(); await W8(3500); }
      const f1 = await fogRd(); note('마디탑 둘 뒤 ' + JSON.stringify(f1));
      await p.evaluate(() => { const F = SD2.gfx.fm; F.lv = 0; F.fk = 1; F.step = '기본'; F.cool = 0; }); await W8(1500);
      const f2 = await fogRd(); note('단계 0으로 되돌린 뒤 ' + JSON.stringify(f2));
      R.fog = { f00, f0, fT, f1, f2 };
      if (!BASE) { ok(Math.abs(f0.far - f00.far) < 0.01 && Math.abs(f0.rFar - f00.far * 0.8) < 0.5, '단계 1 = 그리기 때만 ×0.8(밖 ' + f0.far + ' · 그릴 때 ' + f0.rFar + ')');
        ok(Math.abs(fT.far - f00.far) < 0.01 && Math.abs(f1.far - f00.far) < 0.01, '하늘에서 보기 셋 · 마디탑 둘 뒤 scene.fog.far 그대로(' + f00.far + ' → ' + fT.far + ' → ' + f1.far + ')');
        ok(Math.abs(f2.rFar - f00.far) < 0.01, '단계를 풀면 그릴 때도 바탕(' + f2.rFar + ')'); }
      else note('옛 코드: 처음 ' + f00.far + ' → 하늘 셋 ' + fT.far + ' → 마디탑 둘 ' + f1.far + ' → 단계 풀고 ' + f2.far);
      /* 학원·선생님 칸 받기 막기 */
      if (!BASE) {
        await W8(9000);   /* 다 지은 뒤 8초 미리 받기도 막힘 */
        const sayHas = () => p.evaluate(() => /불러오지 못했어요/.test(document.body.innerText));
        await p.evaluate(() => SM_TOWN.acad().open('math')); await W8(1500);
        const s1 = await sayHas(); ok(s1, '학원 모듈 막으면 「불러오지 못했어요」(막은 요청 ' + blocked + ')');
        await W8(3500); await c.unroute(/town_(acad|teach)\.js/);
        const r2 = await p.evaluate(async () => { const a0 = SM_TOWN.acad(); SM_TOWN.acad().open('math'); await new Promise(r => setTimeout(r, 2500)); return { panel: !!document.querySelector('.twn-p'), loaded: SM_TOWN.acad() !== a0 }; });
        const mods = await p.evaluate(() => performance.getEntriesByType('resource').filter(e => /town_acad\.js/.test(e.name)).map(e => e.name.replace(/^.*\//, '')));
        ok(r2.loaded, '막기를 풀고 다시 누르면 학원 모듈을 받음(창 ' + r2.panel + ' · 받은 주소 ' + mods.join(' ') + ')');
        await closeAll(p);
        await c.route(/town_teach\.js/, rt => { blocked++; rt.abort(); });
        await p.evaluate(() => { const T = SM_TOWN.teach(); if (T && T.open) T.open(); }); await W8(1500);
        ok(await sayHas(), '선생님 칸 모듈 막아도 「불러오지 못했어요」');
        await c.unroute(/town_teach\.js/); await closeAll(p);
        ok(cons.some(t => /\[학원\] 불러오기/.test(t)), 'console에 [학원] 불러오기 한 줄');
      }
      /* 마디탑 16× 30초 → 1× 15초: 마을 = 단계 ②까지 · 프로그램 수 */
      await p.evaluate(s => { SD2.map.player.teleport([s.x + 9, s.Yd + 0.05, s.z + 3]); SD2.map.player.lookAt([17, 50]); }, site); await W8(3000); await closeAll(p);
      const pg0 = await p.evaluate(() => SD2.renderer.info.programs.length);
      await p.evaluate(() => { SD2.gfx.fm.log.length = 0; });
      const tl = []; await cdp.send('Emulation.setCPUThrottlingRate', { rate: 16 });
      for (let i = 0; i < 30; i++) { await W8(1000); const pf = await p.evaluate(() => { const x = SD2.perf(); return [x.fps, x.step, x.dprLvl, SD2.renderer.info.programs.length]; }); tl.push([16, ...pf]); }
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      for (let i = 0; i < 15; i++) { await W8(1000); const pf = await p.evaluate(() => { const x = SD2.perf(); return [x.fps, x.step, x.dprLvl, SD2.renderer.info.programs.length]; }); tl.push([1, ...pf]); }
      const fl = await p.evaluate(() => ({ log: SD2.gfx.fm.log.slice(), auto: SD2.gfx.auto.log.slice(-8) }));
      R.stress = { tl: tl.map(q => q.join('/')).join(' '), fl };
      console.log('  (배율/fps/단계/해상도/프로그램) ' + R.stress.tl); console.log('  단계 기록 ' + JSON.stringify(fl.log) + ' · 해상도 ' + JSON.stringify(fl.auto));
      const mx = Math.max(...tl.map(q => q[2])), pgs = new Set(tl.map(q => q[4]));
      if (!BASE) { ok(mx <= 1, '마을 단계 ②(안개)까지만(가장 낮은 단계 ' + mx + ')'); ok(pgs.size === 1 && tl[0][4] === pg0, '단계 바뀌어도 셰이더 프로그램 수 그대로(' + [...pgs].join(',') + ')');
        const ups = fl.log.filter(q => q[1] === 'up' || q[1] === 'down').map(q => q[0]); let minGap = 1e9; for (let i = 1; i < ups.length; i++) minGap = Math.min(minGap, ups[i] - ups[i - 1]); note('오르내림 간격 최소 ' + (minGap === 1e9 ? '-' : minGap.toFixed(1)) + '초'); }
      else note('옛 코드 가장 낮은 단계 ' + mx + ' · 프로그램 ' + [...pgs].join(','));
      /* 게임 멈춤 → 학교 = 60 */
      await p.evaluate(() => SD2.map.game.stop()); await W8(3500);
      const S9 = await p.evaluate(() => ({ town: document.body.classList.contains('h-town'), q: SD2.gfx.fm.q, target: SD2.gfx.fm.target, mode: SD2.gfx.fm.mode, build: window.SM_BUILD }));
      note('마을 멈춘 뒤 ' + JSON.stringify(S9)); if (!BASE) ok(!S9.town && S9.q === false && S9.target === 60, '학교로 돌아오면 60 목표(q ' + S9.q + ' · 목표 ' + S9.target + ')');
      await c.close();
    }
    if (on('school')) {
      console.log('\n[school] 2코어 흉내 학교 운동장 · ' + el());
      const c = await mkCtx(true), p = await c.newPage(); watchErr(p, 'school');
      await p.goto(base + '/v2/?title=0'); await p.waitForFunction(() => window.SD2 && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 }); await W8(1500);
      await p.evaluate(() => SD2.map.player.teleport('zone:운동장')); await W8(3000);
      const s = await p.evaluate(async () => { const F = SD2.gfx.fm, a = []; let d0 = F.draws, last = null; await new Promise(res => { const t0 = performance.now(); const f = ts => { if (F.draws !== d0) { d0 = F.draws; if (last != null) a.push(ts - last); last = ts; } if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }); a.sort((x, y) => x - y); return { q: F.q, target: F.target, mode: F.mode, fps: +(a.length / 4).toFixed(1), med: a[a.length >> 1], ladder: SD2.gfx.auto.ladder.slice(), floor: SD2.gfx.floor }; });
      R.school = s; note('운동장 ' + JSON.stringify(s));
      if (!BASE) ok(s.q === false && s.target === 60 && s.fps > 45, '저사양 학교 운동장 = 60 목표(q ' + s.q + ' · ' + s.fps + 'fps)');
      await c.close();
      /* 4코어 크롬북(cb) 바닥 */
      const c2 = await mkCtx(false), p2 = await c2.newPage(); await p2.goto(base + '/v2/?title=0'); await p2.waitForFunction(() => window.SD2 && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 });
      const cb = await p2.evaluate(() => ({ mode: SD2.gfx.mode, ladder: SD2.gfx.auto.ladder.slice(), floor: SD2.gfx.floor }));
      await p2.goto(base + '/'); await p2.waitForFunction(() => window.SD2 && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 });
      const cbP = await p2.evaluate(() => ({ mode: SD2.gfx.mode, ladder: SD2.gfx.auto.ladder.slice(), floor: SD2.gfx.floor, fm: SD2.gfx.fm.mode }));
      R.cb = { cb, cbP }; note('cb ' + JSON.stringify(cb) + ' · 홍보판 cb ' + JSON.stringify(cbP));
      if (!BASE) { ok(cb.mode === 'cb' && cb.ladder.join(',') === '1,0.75' && cb.floor === 0.75, '4코어 크롬북 사다리 ' + cb.ladder.join(' → ')); ok(cbP.floor === 0.6 && cbP.fm === 'fixed', '홍보판 크롬북 = 예전 그대로(바닥 ' + cbP.floor + ')'); }
      await c2.close();
    }
    if (on('ti')) {
      console.log('\n[ti] 나무 셰이더 자기 확인 · ' + el());
      const c = await mkCtx(false), p = await c.newPage(); watchErr(p, 'ti'); const cons = []; p.on('console', m => cons.push(m.text().slice(0, 200)));
      const tiRd = () => p.evaluate(() => { const t = SM_TOWN.ti(); return { on: t.on, safe: t.safe, ok: t.ok, n: t.n, ls: localStorage.getItem('sm-gfx-safe'), prog: SD2.renderer.info.programs.length }; });
      await p.goto(base + '/v2/?town=ourtown&tifail=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load, null, { timeout: 300000, polling: 300 });
      let t1 = null; for (let i = 0; i < 40; i++) { await W8(1000); t1 = await tiRd(); if (t1.safe) break; }
      note('?tifail=1 ' + JSON.stringify(t1)); ok(t1.on && t1.safe && t1.safe.why === 'test', '?tifail=1 = 이번 판은 새 길 · sm-gfx-safe 기록(why ' + (t1.safe && t1.safe.why) + ')');
      ok(cons.some(t => /나무 셰이더\(PERF-E\) 시험 손잡이/.test(t)), 'console 한 줄');
      await p.goto(base + '/v2/?town=ourtown'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load, null, { timeout: 300000, polling: 300 }); await W8(3000);
      const t2 = await tiRd(); note('다음 열기 ' + JSON.stringify(t2)); ok(!t2.on && t2.safe, '다음 열기 = 예전 나무 길(on ' + t2.on + ')');
      const k9 = await p.evaluate(() => { let n = 0; SD2.scene.traverse(o => { if (o.userData && o.userData.k9 === 'treeN') n++; }); return n; }); ok(k9 > 0, '예전 길 나무 메시 ' + k9);
      await p.goto(base + '/v2/?town=ourtown&ti=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load, null, { timeout: 300000, polling: 300 });
      let t3 = null; for (let i = 0; i < 20; i++) { await W8(1000); t3 = await tiRd(); if (t3.ok != null) break; }
      note('?ti=1 ' + JSON.stringify(t3)); ok(t3.on && !t3.safe && t3.ok === 1 && !t3.ls, '?ti=1 = 기억 지우고 새 길 · 링크 확인 ok');
      await c.close();
    }
    if (on('gm')) {
      console.log('\n[gm] 학교에서 고른 그래픽 우선이 마을에도 · ' + el());
      const c = await mkCtx(false), p = await c.newPage(); watchErr(p, 'gm');
      const setGm = v => p.evaluate(v => import((performance.getEntriesByType('resource').find(e => /\/settings\.js/.test(e.name)) || { name: '/v2/js/settings.js' }).name).then(m => { m.setSet({ gm: v }); return [m.SET.gm, localStorage.getItem('sm-set')]; }), v);
      await p.goto(base + '/v2/?title=0'); await p.waitForFunction(() => window.SD2 && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 }); await W8(1500);
      note('gm 2 ' + JSON.stringify(await setGm(2))); await p.reload(); await p.waitForFunction(() => window.SD2 && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 }); await W8(1500);
      note('gm 1 ' + JSON.stringify(await setGm(1)) + ' · 학교 mode ' + await p.evaluate(() => SD2.perf().mode));
      await p.goto(base + '/v2/?town=ourtown&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && window.SD2, null, { timeout: 300000, polling: 300 });
      const m0 = await p.evaluate(() => [SD2.perf().mode, localStorage.getItem('sm-set'), SD2.gfx.fm.log.slice()]); await W8(3000); await closeAll(p); await p.keyboard.press('Escape'); await W8(500);
      const m1 = await p.evaluate(() => [SD2.perf().mode, localStorage.getItem('sm-set'), SD2.gfx.fm.log.slice()]);
      R.gm = { m0, m1 }; note('마을 직후 ' + JSON.stringify(m0) + ' · 창 닫은 뒤 ' + JSON.stringify(m1));
      ok(m1[0] === 'graphics', '마을도 그래픽 우선(' + m1[0] + ')');
      await c.close();
    }
    if (on('quit')) {
      console.log('\n[quit] 짓다가 멈추기 · ' + el());
      const c = await mkCtx(false), p = await c.newPage(); watchErr(p, 'quit'); const cdp = await c.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.goto(base + '/v2/?town=ourtown'); await p.waitForFunction(() => window.SM_BUILD > 0 && window.SD2 && SD2.map, null, { timeout: 120000, polling: 100 }); await W8(3000);
      const pct = await p.evaluate(() => { const b9 = document.querySelector('.twn-ld .ldt b'); return b9 ? b9.textContent : '?'; });
      await p.evaluate(() => SD2.map.game.stop()); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const tq = Date.now(); let q = null; for (let i = 0; i < 60; i++) { await W8(1000); q = await p.evaluate(() => ({ build: window.SM_BUILD, town: !!window.SM_TOWN, cur: !!SD2.map.game.current, h: document.body.classList.contains('h-town') })); if (!(q.build > 0)) break; }
      q.sec = Math.round((Date.now() - tq) / 1000); await W8(4500);
      const d0 = await p.evaluate(() => SD2.gfx.fm.draws); await W8(2500); const d1 = await p.evaluate(() => ({ draws: SD2.gfx.fm.draws, fps: SD2.gfx.fm.fps, cool: SD2.gfx.fm.cool, coolT: SD2.gfx.auto.coolT }));
      R.quit = { pct, q, d1 }; note('짓기 ' + pct + '에서 멈춤 → ' + JSON.stringify(q) + ' · ' + JSON.stringify(d1));
      if (!BASE) ok(!(q.build > 0) && d1.fps > 0 && d1.cool <= 0, '짓다가 멈추면 SM_BUILD 0 · 학교에서 화면 모드 판정 다시 돎(fps ' + d1.fps + ' · cool ' + d1.cool + ')');
      await c.close();
    }
    if (on('ctx')) {
      console.log('\n[ctx] 문맥 잃음 · ' + el());
      const c = await mkCtx(false), p = await c.newPage(); watchErr(p, 'ctx');
      const ready = () => p.waitForFunction(() => window.SD2 && SD2.renderer, null, { timeout: 120000 });
      const lose = () => p.evaluate(() => { window.__mk = 1; SD2.renderer.getContext().getExtension('WEBGL_lose_context').loseContext(); });
      await p.goto(base + '/v2/?title=0'); await ready(); await p.evaluate(() => sessionStorage.removeItem('sm-ctxlost')); await W8(1500);
      await Promise.all([p.waitForNavigation({ timeout: 15000 }), lose()]); await ready(); await W8(1500);
      const m1 = await p.evaluate(() => ({ mk: window.__mk || 0, n: JSON.parse(sessionStorage.getItem('sm-ctxlost') || '[]').length }));
      ok(m1.mk === 0 && m1.n === 1, '첫 잃음 = 저절로 다시 불러옴(기록 ' + m1.n + ')');
      await lose(); await W8(5000);
      const m2 = await p.evaluate(() => ({ mk: window.__mk || 0, btn: !!document.querySelector('#ctxLost button'), txt: (document.querySelector('#ctxLost') || {}).innerText || '', n: JSON.parse(sessionStorage.getItem('sm-ctxlost') || '[]').length }));
      await p.screenshot({ path: path.join(OUT, TAG + '_ctx2.png') });
      ok(m2.mk === 1 && m2.btn && m2.n === 2, '둘째 잃음(10분 안) = 저절로 안 불러오고 단추(' + m2.txt.replace(/\n/g, ' / ') + ')');
      await Promise.all([p.waitForNavigation({ timeout: 15000 }), p.click('#ctxLost button')]); await ready();
      ok(await p.evaluate(() => !window.__mk), '단추 누르면 다시 불러옴');
      /* 홍보판: 첫 잃음 저절로(아이폰 MOB-2 그대로) */
      await p.goto(base + '/'); await ready(); await p.evaluate(() => sessionStorage.removeItem('sm-ctxlost')); await W8(1500);
      await Promise.all([p.waitForNavigation({ timeout: 15000 }), lose()]); await ready();
      ok(await p.evaluate(() => !window.__mk), '홍보판 첫 잃음 = 저절로 다시 불러옴');
      await c.close();
    }
    if (on('nogl')) {
      console.log('\n[nogl] WebGL을 못 만들 때 · ' + el());
      const c = await mkCtx(false); await c.addInitScript(() => { const g0 = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { if (/webgl/.test(k)) return null; return g0.call(this, k, ...a); }; });
      const p = await c.newPage(); const pe = []; p.on('pageerror', e => pe.push(e.message.slice(0, 120)));
      await p.goto(base + '/v2/?title=0'); await W8(4000);
      const t = await p.evaluate(() => [...document.querySelectorAll('.ttl-keep')].map(d => d.innerText).join(' | '));
      await p.screenshot({ path: path.join(OUT, TAG + '_nogl.png') });
      ok(/크롬\(브라우저\)을 완전히 껐다가/.test(t), '안내 한 줄 「' + t + '」 · 페이지 오류 ' + pe.length);
      await c.close();
    }
  } catch (e) { console.log('실패 ' + e.stack); fails.push('예외'); }
  const errs2 = errs.filter(e => !/WebGL|context/i.test(e));
  ok(errs2.length === 0, '페이지 오류 ' + errs2.length + (errs2.length ? ' ' + JSON.stringify(errs2.slice(0, 4)) : ''));
  fs.writeFileSync(path.join(OUT, 'pf_' + TAG + '.json'), JSON.stringify(R, null, 1));
  console.log('\n' + (fails.length ? '✗ ' + fails.length + '개 실패: ' + fails.join(' | ') : '✓ 모두 통과') + ' · ' + el());
  await b.close(); srv.close(); process.exit(fails.length ? 1 : 0);
});
