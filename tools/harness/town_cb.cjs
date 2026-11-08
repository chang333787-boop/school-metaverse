// 🧪 크롬북 흉내로 마을 재기(PERF-M · 11-08 교사 '크롬북 최적화 · 저번에 학급에서 좀 덜 쾌적') — 전·후 두 판을 같은 방법으로 잰다(고치기 X · 재기만)
//   zsh tools/ops/b2.sh node tools/harness/town_cb.cjs <서빙할 폴더> <태그> [--port=8801] [--prof|--low] [--only=build,spots,walk,panels,modes] [--out=폴더]   (walk = 시내 한 자리만 · PERF-C)   (결과 = <out>/cb_<태그>[_prof|_low].json)
//   전·후 견주기 = 전 판을 따로 꺼낸 폴더(worktree)를 다른 포트로 · 후·전·후·전 번갈아 · 결과 표 = docs/systems/perf.md 'PERF-M'
//   흉내 = CrOS UA(= cb 판) · 1366×768 ×1 · 자동 해상도 켬(시험 주소 X) · GPU ANGLE(swiftshader X) · CPU 4×(CDP setCPUThrottlingRate · 열기 전부터)
//   서버 = 이 파일이 <폴더>를 그 포트로 서빙(GitHub Pages처럼 max-age=600 → 이어 하기는 캐시에서)
//   ① 짓기: 새 판(?town=ourtown) 열기 → 다 지음(SM_TOWN 생김) 초 · SM_TOWN.load.ms · 받은 JS 바이트·모듈 수(gzip 짐작 같이) · CDP ScriptDuration·V8CompileDuration·TaskDuration
//          → 첫 화면 닫고 저장 → &all=1(HUD 다 열림 = 몇 차시 논 아이)로 이어 하기 한 번 더
//   ② 자리 여섯(자동 모드 · 기본): 첫 아침 우리 집 앞 · 시내 한낮 · 바닷가 · 자전거 큰길 · 마디탑 전망층 · 잔치 날 광장 — 자리마다 카메라 한 바퀴 10초 + 걷기 20초
//          그린 프레임 간격(renderer.info.render.frame이 바뀐 rAF) → fps 중앙 · 하위 5% · >50ms · 그리기·삼각형 · 힙 · 텍스처·지오메트리 · 주 스레드 일(TaskDuration) · 스타일 다시 계산·레이아웃
//   ③ 창 열고 닫기: 가방 · 큰 지도 · 놀이 판(투호) · 실내 들어가기 · 학원 수업(있는 판만) — 여는 순간 동기 ms · 연 뒤 0.6초 안 가장 긴 프레임 · 열린 동안 fps · 닫는 프레임
//   ④ 두 화면 모드(🎨 30 · ⚡ 60): 시내 · 마디탑 카메라 한 바퀴 10초
//   --prof = 대신 CPU 프로파일(짓기 전체 · 시내 걷기 10초 · 가방·놀이 판 여는 순간) → 함수별 자기 시간 위 15(파일:줄)
//            + 프레임마다 rAF 콜백 시간 시계열(1초 칸 몰림 찾기) · 저장 크기·flush ms · GPU 지오메트리 바이트(공유 버퍼 한 번)
//   --low = 2코어 크롬북 흉내(hardwareConcurrency 2 → main.js 'low' 판) · 마디탑 CPU 16× 30초 → 1× 12초를 자동·부드럽게 둘로 — 무엇이 줄어드나
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const root = path.resolve(pos[0] || '.'), TAG = pos[1] || 'x';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const PORT = +(arg('port') || 8801), PROF = process.argv.includes('--prof'), LOW = process.argv.includes('--low'), OUT = arg('out') || '/tmp';
const ONLY = (arg('only') || '').split(',').filter(Boolean), on = k => !ONLY.length || ONLY.includes(k);
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' }); r.end(d); }); });
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
const r1 = v => Math.round(v * 10) / 10, q = (s, k) => s.length ? s[Math.min(s.length - 1, Math.floor(s.length * k))] : 0;

/* 페이지 안 기록기: 그린 프레임 시각·그리기·삼각형 + 움직이기(카메라 한 바퀴 · 원 걷기 · 길 따라) */
const INSTALL = () => { if (window.__PM) return true; const R = SD2.renderer, M = SD2.map; if (!R || !M) return false;
  const PM = window.__PM = { rec: false, ts: [], dc: [], tr: [], marks: [], drive: null, dist: 0 }; let lastF = -1, px = null, pz = null;
  const f = ts => { const fr = R.info.render.frame; if (PM.rec && fr !== lastF) { PM.ts.push(ts); PM.dc.push(R.info.render.calls); PM.tr.push(R.info.render.triangles); } lastF = fr;
    const d = PM.drive; if (d) { if (d.t0 == null) d.t0 = ts; const el = (ts - d.t0) / 1000, me = M.player.get();
      if (px != null) { const mv = Math.hypot(me.x - px, me.z - pz); if (mv < 5) PM.dist += mv; } px = me.x; pz = me.z;
      if (d.k === 'spin') { const a = el / d.dur * Math.PI * 2; M.player.lookAt([d.cx + Math.sin(a) * 30, d.cz + Math.cos(a) * 30]); }
      else if (d.k === 'circle') { const a = el / d.dur * Math.PI * 2; M.player.steer(Math.cos(a), Math.sin(a), d.sp, true); }
      else if (d.k === 'route') { const P = d.pts; while (d.j < P.length - 1 && Math.hypot(P[d.j][0] - me.x, P[d.j][1] - me.z) < 1.8) d.j++; const t = P[Math.min(d.j, P.length - 1)]; let dx = t[0] - me.x, dz = t[1] - me.z; const dd = Math.hypot(dx, dz) || 1;
        if (el - (d.ct || 0) > 1) { if (Math.hypot(me.x - (d.cx9 ?? me.x + 9), me.z - (d.cz9 ?? 0)) < 0.4) { d.side = el + 0.5; d.sn = (d.sn || 0) + 1; } d.ct = el; d.cx9 = me.x; d.cz9 = me.z; }
        if (el < (d.side || 0)) { const s = d.sn % 2 ? 1 : -1; const nx = -dz / dd * s + dx / dd * 0.2, nz = dx / dd * s + dz / dd * 0.2; dx = nx; dz = nz; }
        M.player.steer(dx, dz, d.sp, true); }
      if (el >= d.dur) { PM.drive = null; M.player.steer(null); px = null; } }
    requestAnimationFrame(f); };
  requestAnimationFrame(f); return true; };

srv.listen(PORT, async () => {
  const base = 'http://127.0.0.1:' + PORT, R = { tag: TAG, root, at: new Date().toISOString() }, errs = [];
  const b = await chromium.launch({ args: GPU });
  const T00 = Date.now(), el = () => ((Date.now() - T00) / 1000).toFixed(0) + 's';
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
    if (PROF) await ctx.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window), C = window.__CBT = { on: false, ts: [], d: [] };   /* 프레임마다 rAF 콜백(= 루프 + 그리기 호출) 시간 */
      window.requestAnimationFrame = function (cb) { return raf(function (ts) { if (!C.on) return cb(ts); const t0 = performance.now(); try { return cb(ts); } finally { C.ts.push(ts); C.d.push(performance.now() - t0); } }); }; });
    if (LOW) await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 2 }); Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 4 }); });   /* 2코어 셀러론 크롬북(4GB) 흉내 = main.js 'low' 판 */
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable'); await cdp.send('Network.enable');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    /* 받은 바이트 */
    const NET = new Map(); let netOn = true;
    cdp.on('Network.responseReceived', e => { if (netOn) NET.set(e.requestId, { url: e.response.url, mime: e.response.mimeType, cache: !!(e.response.fromDiskCache || e.response.fromMemoryCache), st: e.response.status }); });
    cdp.on('Network.loadingFinished', e => { const o = NET.get(e.requestId); if (o) o.bytes = e.encodedDataLength; });
    const netSum = () => { let jsB = 0, jsN = 0, allB = 0, allN = 0, gz = 0, cached = 0; const files = [];
      for (const o of NET.values()) { allN++; allB += o.bytes || 0; if (o.cache) cached++; const u = new URL(o.url); if (/\.m?js$/.test(u.pathname)) { jsN++; jsB += o.bytes || 0; files.push(u.pathname); try { gz += zlib.gzipSync(fs.readFileSync(path.join(root, decodeURIComponent(u.pathname))), { level: 6 }).length; } catch (e) { void e; } } }
      return { jsN, jsMB: r1(jsB / 1048576 * 10) / 10, jsGzMB: r1(gz / 1048576 * 10) / 10, allN, allMB: r1(allB / 1048576 * 10) / 10, cached, top: files.length }; };
    const metrics = async () => { const m = await cdp.send('Performance.getMetrics'), o = {}; for (const x of m.metrics) o[x.name] = x.value; return o; };
    const ZM = { TaskDuration: 0, ScriptDuration: 0, V8CompileDuration: 0, RecalcStyleDuration: 0, RecalcStyleCount: 0, LayoutDuration: 0, LayoutCount: 0 };   /* 쪽을 옮기면 CDP 값이 0부터 다시 → 짓기는 0에서 잰다 */
    const dM = (a, b9) => ({ task: b9.TaskDuration - a.TaskDuration, script: b9.ScriptDuration - a.ScriptDuration, compile: (b9.V8CompileDuration || 0) - (a.V8CompileDuration || 0), style: b9.RecalcStyleDuration - a.RecalcStyleDuration, styleN: b9.RecalcStyleCount - a.RecalcStyleCount, layout: b9.LayoutDuration - a.LayoutDuration, layoutN: b9.LayoutCount - a.LayoutCount, heapMB: Math.round(b9.JSHeapUsedSize / 1048576), nodes: b9.Nodes, lobj: b9.LayoutObjects });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const built = async () => { const h = await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && SM_TOWN.game && window.SD2 && SD2.renderer && performance.now(), null, { timeout: 400000, polling: 100 }); return await h.jsonValue(); };
    const closeAll = async () => { for (let i = 0; i < 10; i++) { if (await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn()))) { await p.keyboard.press('Escape'); await W8(250); continue; } if (!(await ev(() => !!document.querySelector('.twn-p')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(300); } };
    const calm = async () => { await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.story = G.S.story || {}; G.S.story.done = Object.assign(G.S.story.done || {}, { p0: 1, a1_1: 1 }); G.S.story.p0auto = 1; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; if (G.S.emerg) { G.S.emerg.d = G.S.day; G.S.emerg.plan = []; } if (G.rwOff) G.rwOff(true); try { SM_TOWN.storyOff(); } catch (e) { void e; } SM_TOWN.rules.wx('clear'); }); };
    const start = async () => { await ev(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]') || document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(1200); for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await W8(150); } await closeAll(); await calm(); await W8(600); await closeAll(); };
    const setGm = v => ev(v => import((performance.getEntriesByType('resource').find(e => /\/settings\.js/.test(e.name)) || { name: '/v2/js/settings.js' }).name).then(m => { m.setSet({ gm: v }); return m.SET.gm; }), v);
    const setMin = mn => ev(mn => { SM_TOWN.game().S.min = mn; }, mn);
    const free = (x, z) => ev(([x, z]) => { const bl = SD2.map.q.blocked || SD2.map.q.blockedAt, okp = (a, c) => { const g = SM_TOWN.ground(a, c); return !bl(a, c, g + 0.6) && !bl(a + 0.5, c, g + 0.6) && !bl(a, c + 0.5, g + 0.6) && !bl(a - 0.5, c, g + 0.6) && !bl(a, c - 0.5, g + 0.6); };
      for (let r = 0; r <= 60; r += 1.5) for (let k = 0; k < (r ? 16 : 1); k++) { const an = k * Math.PI / 8, px = x + Math.cos(an) * r, pz = z + Math.sin(an) * r; if (okp(px, pz)) return [px, pz]; } return [x, z]; }, [x, z]);
    const tp = (x, z, y) => ev(([x, z, y]) => { SD2.map.player.teleport([x, y != null ? y + 0.05 : SM_TOWN.ground(x, z) + 0.05, z]); }, [x, z, y]);
    const wakeRec = () => ev(INSTALL);
    /* 창 하나 재기: dur초 동안 기록 + 움직이기 → 요약 */
    const win = async (dur, drive) => { await wakeRec(); const m0 = await metrics();
      await ev(([dr]) => { const PM = window.__PM; PM.ts = []; PM.dc = []; PM.tr = []; PM.dist = 0; PM.rec = true; if (dr) { const me = SD2.map.player.get(); PM.drive = Object.assign({ cx: me.x, cz: me.z, j: 0 }, dr); } }, [drive]);
      await W8(dur * 1000 + 150); const m1 = await metrics();
      const raw = await ev(() => { const PM = window.__PM; PM.rec = false; PM.drive = null; SD2.map.player.steer(null); const R9 = SD2.renderer.info; return { ts: PM.ts, dc: PM.dc, tr: PM.tr, dist: PM.dist, geo: R9.memory.geometries, tex: R9.memory.textures, prog: (R9.programs || []).length, y: SD2.map.player.get().y, pf: SD2.perf ? SD2.perf() : {} }; });
      const iv = []; for (let i = 1; i < raw.ts.length; i++) iv.push(raw.ts[i] - raw.ts[i - 1]); const s = iv.slice().sort((a, b9) => a - b9), dcs = raw.dc.slice().sort((a, b9) => a - b9), trs = raw.tr.slice().sort((a, b9) => a - b9), d = dM(m0, m1), n = raw.ts.length || 1;
      return { fps: r1(n / dur), fpsMed: r1(1000 / (q(s, 0.5) || 1)), low5: r1(1000 / (q(s, 0.95) || 1)), maxMs: Math.round(s[s.length - 1] || 0), long50: iv.filter(v => v > 50).length, dcMed: q(dcs, 0.5), dcMax: dcs[dcs.length - 1] || 0, triK: Math.round(q(trs, 0.5) / 1000), triMaxK: Math.round((trs[trs.length - 1] || 0) / 1000),
        heapMB: d.heapMB, geo: raw.geo, tex: raw.tex, prog: raw.prog, nodes: d.nodes, lobj: d.lobj, taskPct: Math.round(d.task / dur * 100), taskMsF: r1(d.task * 1000 / n), scriptMsF: r1(d.script * 1000 / n), styleMsS: r1(d.style * 1000 / dur), styleN: Math.round(d.styleN / dur), layoutMsS: r1(d.layout * 1000 / dur), layoutN: Math.round(d.layoutN / dur), dist: Math.round(raw.dist), y: r1(raw.y), mode: raw.pf.mode, dpr: raw.pf.dpr, step: raw.pf.step }; };
    const both = (a, b9) => { const o = {}; for (const k of Object.keys(a)) o[k] = typeof a[k] === 'number' && typeof b9[k] === 'number' && !['heapMB', 'geo', 'tex', 'prog', 'nodes', 'lobj', 'y', 'dpr', 'step'].includes(k) ? (['maxMs', 'dcMax', 'triMaxK'].includes(k) ? Math.max(a[k], b9[k]) : ['long50'].includes(k) ? a[k] + b9[k] : r1((a[k] * 10 + b9[k] * 20) / 30)) : b9[k]; return o; };   /* 카메라 10초 + 걷기 20초 합친 값(시간 가중 · 최대는 최대 · 개수는 합) */

    if (LOW) {
      /* ⑧ 2코어 크롬북('low' 판) — 버거울 때 무엇이 줄어드나(자동 · 부드럽게) */
      await p.goto(base + '/v2/?town=ourtown&all=1'); await built(); await start(); await W8(1500);
      R.lowGfx = await ev(() => { const g = SD2.gfx; return { mode: g.mode, dpr: g.dpr, cap: g.cap, start: g.start, floor: g.floor, adapt: g.adapt, shadow: g.shadow, aa: g.aa, hc: navigator.hardwareConcurrency, dm: navigator.deviceMemory }; }); console.log('[' + TAG + '] ⑧ 판 ' + JSON.stringify(R.lowGfx));
      const tw = await ev(() => SM_TOWN.tower().info().site);
      const tower = async () => { await tp(tw.x + 9, tw.z + 3, tw.Yd); await ev(() => SD2.map.player.lookAt([17, 50])); };
      const watch = async (sec, rate, tag9) => { await cdp.send('Emulation.setCPUThrottlingRate', { rate }); const tl = []; for (let i = 0; i < sec; i++) { await W8(1000); const pf = await ev(() => { const f = SD2.perf(); return [f.fps, f.dpr, f.step, f.fog, f.detail, f.shadow, f.mode]; }); tl.push(pf); } R['low_' + tag9] = tl; console.log('[' + TAG + '] ⑧ ' + tag9 + ' (fps/dpr/단계/안개/디테일/그림자/모드) ' + tl.map(x => x.slice(0, 6).join('/')).join(' ')); };
      for (const gm of [0, 2]) { await setGm(gm); await closeAll(); await tower(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await W8(4000); await closeAll(); await watch(30, 16, 'gm' + gm + '_16x'); await watch(12, 1, 'gm' + gm + '_1x'); R['low_log' + gm] = await ev(() => (SD2.gfx.fm.log || []).slice(-12)); }
      throw 'done';
    }
    if (PROF) {
      /* ⑥ CPU 프로파일 */
      const top = (prof, k = 15) => { const N = new Map(); for (const n of prof.nodes) N.set(n.id, n); const self = new Map(); let tot = 0;
        for (let i = 0; i < prof.samples.length; i++) { const dt = prof.timeDeltas[i] || 0; tot += dt; self.set(prof.samples[i], (self.get(prof.samples[i]) || 0) + dt); }
        const agg = new Map(); for (const [id, t] of self) { const c = N.get(id).callFrame, f = c.url ? c.url.replace(/^.*\/v2\//, 'v2/').replace(/\?.*$/, '') : '', key = (c.functionName || '(anon)') + ' ' + (f ? f + ':' + (c.lineNumber + 1) : ''); agg.set(key, (agg.get(key) || 0) + t); }
        const L = [...agg].sort((a, b9) => b9[1] - a[1]); const byFile = new Map(); for (const [kk, t] of agg) { const m = kk.match(/ (v2\/[^:]+):/); const f = m ? m[1] : kk.startsWith('(') ? kk.split(' ')[0] : 'native/기타'; byFile.set(f, (byFile.get(f) || 0) + t); }
        return { totS: r1(tot / 1e6), top: L.filter(x => !/^\(idle\)/.test(x[0])).slice(0, k).map(([kk, t]) => [kk, Math.round(t / 1000), r1(t / tot * 100)]), idlePct: r1((agg.get('(idle) ') || 0) / tot * 100), files: [...byFile].sort((a, b9) => b9[1] - a[1]).slice(0, 12).map(([f, t]) => [f, Math.round(t / 1000), r1(t / tot * 100)]) }; };
      await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
      await cdp.send('Profiler.start'); const t0 = Date.now(); await p.goto(base + '/v2/?town=ourtown&all=1'); const nowMs = await built(); R.profBuildS = r1((Date.now() - t0) / 1000); R.profBuildOpen = r1(nowMs / 1000);
      const pb = (await cdp.send('Profiler.stop')).profile; R.profBuild = top(pb); console.log('[' + TAG + '] 짓기 프로파일 ' + R.profBuildS + '초 ' + JSON.stringify(R.profBuild));
      await start(); await setGm(0); await setMin(12 * 60); const a = await free(123, 785); await tp(a[0], a[1]); await W8(5000); await closeAll(); await wakeRec();
      await cdp.send('Profiler.start'); await ev(() => { window.__PM.drive = { k: 'circle', dur: 10, sp: 4.2 }; }); await W8(10200); const pw9 = (await cdp.send('Profiler.stop')).profile; R.profWalk = top(pw9); console.log('[' + TAG + '] 시내 걷기 10초 프로파일 ' + JSON.stringify(R.profWalk));
      /* 창 여는 순간 프로파일(가방 · 놀이 판) — 샘플 0.1ms */
      await cdp.send('Profiler.setSamplingInterval', { interval: 100 }).catch(() => null);
      for (const [k9, fn9] of [['bag', () => SM_TOWN.bagOpen()], ['play', () => SM_TOWN.playK('tuho')]]) { await closeAll(); await W8(1500); await cdp.send('Profiler.start'); await ev(fn9); await W8(1200); const pp = (await cdp.send('Profiler.stop')).profile; R['profOpen_' + k9] = top(pp, 12); console.log('[' + TAG + '] 여는 순간 프로파일 ' + k9 + ' ' + JSON.stringify(R['profOpen_' + k9].top)); await ev(() => { if (SM_TOWN.playEnd) SM_TOWN.playEnd(false); }); await p.keyboard.press('Escape'); await W8(300); await closeAll(); }
      /* ⑦ 덧붙임(코드 읽기 팀 물음): 프레임 일 시계열(1초 칸 몰림) · 저장 크기·flush ms · GPU 지오메트리 바이트 */
      await ev(() => { const C = window.__CBT; C.ts = []; C.d = []; C.on = true; window.__PM.drive = { k: 'circle', dur: 20, sp: 4.2 }; }); await W8(20300);
      const ser = await ev(() => { const C = window.__CBT; C.on = false; const F = new Map(); for (let i = 0; i < C.ts.length; i++) F.set(C.ts[i], (F.get(C.ts[i]) || 0) + C.d[i]); return [...F]; });
      { const fr = ser.map(x => x[1]), st = fr.slice().sort((a, b9) => a - b9), med = q(st, 0.5), thr = med * 2 + 2, sp = ser.filter(x => x[1] > thr), gaps = []; for (let i = 1; i < sp.length; i++) gaps.push(sp[i][0] - sp[i - 1][0]);
        const gs = gaps.slice().sort((a, b9) => a - b9), sec = new Map(); for (const [t, d] of ser) { const k = Math.floor((t - ser[0][0]) / 1000); const o = sec.get(k) || [0, 0, 0]; o[0] = Math.max(o[0], d); o[1] += d; o[2]++; sec.set(k, o); }
        const secMax = [...sec.values()].map(o => o[0]).sort((a, b9) => a - b9);
        R.frameJs = { frames: fr.length, medMs: r1(med), p95Ms: r1(q(st, 0.95)), p99Ms: r1(q(st, 0.99)), maxMs: r1(st[st.length - 1] || 0), spikeThr: r1(thr), spikes: sp.length, spikesPerS: r1(sp.length / 20), spikeGapMedMs: Math.round(q(gs, 0.5)), spikeGapNear1s: gaps.filter(g => g > 900 && g < 1100).length, secMaxMed: r1(q(secMax, 0.5)), over16: fr.filter(v => v > 16.7).length, over33: fr.filter(v => v > 33.3).length, top: ser.slice().sort((a, b9) => b9[1] - a[1]).slice(0, 8).map(x => [Math.round(x[0] - ser[0][0]), r1(x[1])]) };
        console.log('[' + TAG + '] ⑦ 프레임 JS(시내 걷기 20초) ' + JSON.stringify(R.frameJs)); }
      R.save = await ev(() => { const G = SM_TOWN.game(), out = { flush: [] }; const s9 = JSON.stringify(G.S); out.kb = Math.round(s9.length / 1024); out.keys = Object.keys(G.S).length; out.big = Object.keys(G.S).map(k => [k, JSON.stringify(G.S[k] ?? null).length]).sort((a, b9) => b9[1] - a[1]).slice(0, 8).map(([k, n]) => k + ' ' + Math.round(n / 1024) + 'KB');
        for (let i = 0; i < 5; i++) { G.mark(); const t0 = performance.now(); G.flush(); out.flush.push(Math.round((performance.now() - t0) * 10) / 10); }
        let ls = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls += (k.length + (localStorage.getItem(k) || '').length); } out.lsKB = Math.round(ls / 1024); out.slot = SM_TOWN.slot ? JSON.stringify(SM_TOWN.slot()).slice(0, 200) : null; return out; });
      console.log('[' + TAG + '] ⑦ 저장 ' + JSON.stringify(R.save));
      R.gpuGeo = await ev(() => { const seen = new Set(); let bytes = 0, inst = 0, nGeo = new Set(), nMesh = 0, empty = 0; const add = a => { if (!a) return; const k = a.isInterleavedBufferAttribute ? a.data : a; if (seen.has(k)) return; seen.add(k); const arr = k.array, bpe = arr && arr.BYTES_PER_ELEMENT ? arr.BYTES_PER_ELEMENT : 4, n = k.isInterleavedBuffer ? k.count * k.stride : a.count * a.itemSize; if (!arr || !arr.length) empty++; bytes += n * bpe; };
        SD2.scene.traverse(o => { const g = o.geometry; if (!g || !g.attributes) return; nMesh++; nGeo.add(g); for (const k in g.attributes) add(g.attributes[k]); if (g.index) add(g.index); if (o.isInstancedMesh) { const b0 = bytes; add(o.instanceMatrix); add(o.instanceColor); inst += bytes - b0; } });
        return { MB: Math.round(bytes / 1048576), instMB: Math.round(inst / 1048576), geos: nGeo.size, meshes: nMesh, attrs: seen.size, emptiedAttrs: empty }; });
      console.log('[' + TAG + '] ⑦ GPU 지오메트리 ' + JSON.stringify(R.gpuGeo));
      throw 'done';
    }

    if (on('build')) {
      /* ① 짓기 — 새 판 */
      let m0 = ZM; let t0 = Date.now(); await p.goto(base + '/v2/?town=ourtown'); let nowMs = await built(); let m1 = await metrics();
      const L1 = await ev(() => ({ ms: SM_TOWN.load.ms, steps: (SM_TOWN.load.steps || []).slice(0, 40), mode: SD2.perf ? SD2.perf().mode : '?', gfx: SD2.perf ? SD2.perf().gfxMode : '?', dpr: SD2.gfx && SD2.gfx.dpr, gmPop: !!document.getElementById('gmPop') }));
      let d = dM(m0, m1); R.buildNew = { wallS: r1((Date.now() - t0) / 1000), openS: r1(nowMs / 1000), ldS: r1(L1.ms / 1000), net: netSum(), taskS: r1(d.task), scriptS: r1(d.script), compileS: r1(d.compile), styleS: r1(d.style), layoutS: r1(d.layout), heapMB: d.heapMB, mode: L1.mode, gfx: L1.gfx, dpr: L1.dpr, gmPop: L1.gmPop, steps: L1.steps };
      console.log('[' + TAG + '] ① 새 판 ' + JSON.stringify({ ...R.buildNew, steps: undefined }) + ' (' + el() + ')'); console.log('   단계 ' + JSON.stringify(L1.steps).slice(0, 1500));
      await start(); await W8(3000); const fl = await ev(() => SM_TOWN.save().flush()); R.flush = fl;
      /* 이어 하기(HUD 다 열림) */
      NET.clear(); m0 = ZM; t0 = Date.now(); await p.goto(base + '/v2/?town=ourtown&all=1'); nowMs = await built(); m1 = await metrics();
      const L2 = await ev(() => ({ ms: SM_TOWN.load.ms, had: SM_TOWN.save().had })); d = dM(m0, m1);
      R.buildCont = { wallS: r1((Date.now() - t0) / 1000), openS: r1(nowMs / 1000), ldS: r1(L2.ms / 1000), had: L2.had, net: netSum(), taskS: r1(d.task), scriptS: r1(d.script), compileS: r1(d.compile), styleS: r1(d.style), layoutS: r1(d.layout), heapMB: d.heapMB };
      console.log('[' + TAG + '] ① 이어 하기 ' + JSON.stringify(R.buildCont) + ' (' + el() + ')');
      netOn = false; await start();
    } else { netOn = false; await p.goto(base + '/v2/?town=ourtown&all=1'); await built(); await start(); }
    await W8(2000); await calm(); await closeAll();
    const site = await ev(() => { const hs = SM_TOWN.homeSpot ? SM_TOWN.homeSpot() : null, bt = SM_TOWN.find ? SM_TOWN.find('해수욕장') : null, tw = SM_TOWN.tower ? SM_TOWN.tower().info().site : null, F = SM_TOWN.feast ? SM_TOWN.feast() : null;
      return { home: hs, beach: bt ? (bt.door || [bt.x, bt.z]) : null, tower: tw ? { x: tw.x, z: tw.z, Yd: tw.Yd } : null, fd: F ? F.info().fd : null, day: SM_TOWN.game().S.day, plaza: F && F.dbg && F.dbg.at ? F.dbg.at(0, 4) : null }; });
    R.site = site; console.log('[' + TAG + '] 자리 ' + JSON.stringify(site));

    if (on('spots')) {
      /* ② 자리 여섯(자동 모드) */
      await setGm(0); R.spots = {};
      const spot = async (k, nm, go, walk) => { await closeAll(); await go(); await W8(5000); await closeAll(); await calm();
        const s1 = await win(10, { k: 'spin', dur: 10 }); const s2 = await win(20, walk || { k: 'circle', dur: 20, sp: 4.2 }); const all = both(s1, s2);
        R.spots[k] = { nm, spin: s1, walk: s2, all }; console.log('[' + TAG + '] ② ' + nm + ' ' + JSON.stringify(all) + ' (' + el() + ')'); };
      await spot('home', '첫 아침 우리 집 앞', async () => { await setMin(8 * 60); const h = site.home || [-38.3, 133]; const a = await free(h[0], h[1]); await tp(a[0], a[1]); });
      await spot('down', '시내 한낮', async () => { await setMin(12 * 60); const a = await free(123, 785); await tp(a[0], a[1]); });
      await spot('beach', '바닷가(해수욕장)', async () => { await setMin(13 * 60); const b9 = site.beach || [0, 0]; const a = await free(b9[0], b9[1]); await tp(a[0], a[1]); });
      /* 자전거 큰길: 우리 집 앞 → 행정복지센터 문(BENCH-1 길) · B로 자전거 */
      const pts = await ev(() => { const h = SM_TOWN.homeSpot ? SM_TOWN.homeSpot() : [-38.3, 133]; let r = null; try { r = SM_TOWN.routeXY(h, [8.7, 631.4]); } catch (e) { r = null; } return r && r.ok && r.pts ? r.pts.map(v => [v[0], v[1]]) : [[8.7, 631.4]]; });
      await spot('bike', '자전거 큰길(집 → 행정복지센터)', async () => { await setMin(11 * 60); const h = site.home || [-38.3, 133]; const a = await free(h[0], h[1]); await tp(a[0], a[1]); await W8(400); await p.keyboard.press('KeyB'); await W8(800); },
        { k: 'route', dur: 20, sp: 9, pts });
      await p.keyboard.press('KeyB'); await W8(500);
      await spot('tower', '마디탑 전망층', async () => { await setMin(12 * 60); const s = site.tower; if (s) { await tp(s.x + 9, s.z + 3, s.Yd); await ev(() => SD2.map.player.lookAt([17, 50])); } }, { k: 'circle', dur: 20, sp: 1.2 });
      /* 잔치 날 광장 10:30(마지막 — 날을 바꿈) */
      await spot('feast', '잔치 날 광장 10:30', async () => { await ev(fd => { const G = SM_TOWN.game(); G.S.day = fd; G.mark && G.mark(); G.S.min = 10 * 60 + 30; }, site.fd); for (let i = 0; i < 3; i++) { await closeAll(); await ev(() => SM_TOWN.feast().sec(true)); await W8(100); } const P = await ev(() => SM_TOWN.feast().dbg.at(0, 4)); if (P) await tp(P[0], P[1]); R.feastOn = await ev(() => SM_TOWN.feast().info().on); });
      await ev(d0 => { const G = SM_TOWN.game(); G.S.day = d0; G.mark && G.mark(); G.S.min = 12 * 60; }, site.day); for (let i = 0; i < 2; i++) { await closeAll(); await ev(() => SM_TOWN.feast().sec(true)); await W8(100); }
    }

    if (ONLY.includes('walk') && !ONLY.includes('spots')) {
      /* --only=walk(PERF-C 11-08): 시내 한낮 한 자리만(카메라 한 바퀴 10초 + 걷기 20초) — 걷기 스타일 다시 계산 횟수·ms를 짧게 */
      await setGm(0); R.spots = {}; await closeAll(); await setMin(12 * 60); const a = await free(123, 785); await tp(a[0], a[1]); await W8(5000); await closeAll(); await calm();
      const s1 = await win(10, { k: 'spin', dur: 10 }); const s2 = await win(20, { k: 'circle', dur: 20, sp: 4.2 }); R.spots.down = { nm: '시내 한낮', spin: s1, walk: s2, all: both(s1, s2) };
      console.log('[' + TAG + '] ② 시내 한낮 카메라 ' + JSON.stringify({ styleN: s1.styleN, styleMsS: s1.styleMsS, layoutMsS: s1.layoutMsS, taskMsF: s1.taskMsF }) + ' · 걷기 ' + JSON.stringify({ styleN: s2.styleN, styleMsS: s2.styleMsS, layoutN: s2.layoutN, layoutMsS: s2.layoutMsS, taskMsF: s2.taskMsF, fpsMed: s2.fpsMed, dist: s2.dist }) + ' (' + el() + ')');
    }

    if (on('panels')) {
      /* ③ 창 열고 닫기 — 시내 한낮에서 */
      await setGm(0); await setMin(12 * 60); await closeAll(); const a = await free(123, 785); await tp(a[0], a[1]); await W8(4000); await closeAll(); await wakeRec(); R.panels = {};
      const panel = async (k, nm, open, close, waitOpen, oarg) => { await closeAll(); await W8(1200); const m0 = await metrics();
        await ev(() => { const PM = window.__PM; PM.ts = []; PM.dc = []; PM.tr = []; PM.rec = true; }); await W8(800);
        const o = await ev(open, oarg); await W8(waitOpen || 3200);
        const isOpen = await ev(() => !!document.querySelector('.twn-p, .twn-play, .twn-mapbig, .twn-big') || !!(SM_TOWN.indoor && SM_TOWN.indoor.on));
        const c0 = await ev(() => performance.now()); await close(); const cms = r1(await ev(c0 => performance.now() - c0, c0)); await W8(1000);
        const m1 = await metrics(); const raw = await ev(() => { const PM = window.__PM; PM.rec = false; return { ts: PM.ts, dc: PM.dc }; });
        const at = o && o.t0 ? o.t0 : 0, iv = []; for (let i = 1; i < raw.ts.length; i++) iv.push([raw.ts[i], raw.ts[i] - raw.ts[i - 1]]);
        const after = iv.filter(x => x[0] > at && x[0] < at + 600).map(x => x[1]), during = iv.filter(x => x[0] > at + 600 && x[0] < c0).map(x => x[1]), cl = iv.filter(x => x[0] > c0 && x[0] < c0 + 700).map(x => x[1]);
        const dur = (c0 - at - 600) / 1000, d = dM(m0, m1), dcOpen = raw.dc.slice(Math.max(0, raw.ts.findIndex(t => t > at + 600))).filter((_, i9) => raw.ts[i9] < c0).sort((x, y) => x - y);
        R.panels[k] = { nm, ok: !!(o && o.ok), open: isOpen, syncMs: o ? r1(o.ms) : null, openFrameMs: Math.round(Math.max(0, ...after)), fpsOpen: r1(during.length / Math.max(0.1, dur)), maxOpenMs: Math.round(Math.max(0, ...during)), closeMs: cms, closeFrameMs: Math.round(Math.max(0, ...cl)), dcOpen: q(dcOpen, 0.5), styleMs: r1(d.style * 1000), layoutMs: r1(d.layout * 1000), taskMs: Math.round(d.task * 1000), nodes: d.nodes };
        console.log('[' + TAG + '] ③ ' + nm + ' ' + JSON.stringify(R.panels[k])); };
      const escClose = async () => { await p.keyboard.press('Escape'); await W8(200); await closeAll(); };
      await panel('bag', '가방', () => { const t0 = performance.now(); SM_TOWN.bagOpen(); return { t0, ms: performance.now() - t0, ok: !!document.querySelector('.twn-p') }; }, escClose);
      await panel('map', '큰 지도', () => { const t0 = performance.now(); SM_TOWN.openBig(); return { t0, ms: performance.now() - t0, ok: true }; }, escClose);
      await panel('play', '놀이 판(투호)', () => { const t0 = performance.now(); const ok = SM_TOWN.playK('tuho'); return { t0, ms: performance.now() - t0, ok }; }, async () => { await ev(() => { if (SM_TOWN.playEnd) SM_TOWN.playEnd(false); }); await escClose(); });
      const shopI = await ev(() => { const C = SM_TOWN.indoor.census(); let bi = -1, bd = 1e18; for (const c of C) { if (c.in !== 'shop' || !c.door || c.school || c.home) continue; const pl = SM_TOWN.shops().find(s => s.name === c.name); if (!pl) continue; const dd = (pl.door[0] - 123) ** 2 + (pl.door[1] - 785) ** 2; if (dd < bd) { bd = dd; bi = c.i; } } return bi >= 0 ? { i: bi, name: C[bi].name } : null; });
      R.shop = shopI;
      if (shopI) await panel('indoor', '실내 들어가기(' + shopI.name + ')', i => { const t0 = performance.now(); const ok = SM_TOWN.indoor.enterI(i); return { t0, ms: performance.now() - t0, ok }; }, async () => { await ev(() => SM_TOWN.indoor.exit && SM_TOWN.indoor.exit()); await W8(1500); }, 4500, shopI.i).catch(e => console.log('   실내 못 잼 ' + e.message));
      if (shopI && R.panels.indoor && !R.panels.indoor.ok) console.log('   (실내 들어가기 실패)');
      const hasAcad = await ev(() => !!SM_TOWN.acad);
      if (hasAcad) { try { const ai = await ev(() => { const C = SM_TOWN.indoor.census(); const c = C.find(x => !x.school && ['math', 'english', 'science', 'study', 'art', 'piano', 'taekwondo'].includes(x.cat)); return c ? c.i : -1; });
        if (ai >= 0) { await setMin(15 * 60); await closeAll(); await ev(i => SM_TOWN.indoor.enterI(i), ai); await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 15000 }); await W8(1500); await closeAll();
          await panel('acad', '학원 수업(실내에서 E)', () => { const t0 = performance.now(); SM_TOWN.ent().use('ent:acad'); return { t0, ms: performance.now() - t0, ok: !!document.querySelector('.twn-p') }; }, escClose);
          await ev(() => SM_TOWN.indoor.exit && SM_TOWN.indoor.exit()); await W8(1500); } else R.panels.acad = { nm: '학원 수업', ok: false, why: '학원 건물 못 찾음' }; } catch (e) { R.panels.acad = { nm: '학원 수업', ok: false, why: String(e.message || e).slice(0, 120) }; } }
      else R.panels.acad = { nm: '학원 수업', ok: false, why: '이 판엔 학원 수업 없음' };
      await setMin(12 * 60); await closeAll();
    }

    if (on('modes')) {
      /* ④ 두 화면 모드 */
      R.modes = {};
      for (const [k, nm, go] of [['down', '시내 한낮', async () => { const a = await free(123, 785); await tp(a[0], a[1]); }], ['tower', '마디탑 전망층', async () => { const s = site.tower; if (s) { await tp(s.x + 9, s.z + 3, s.Yd); await ev(() => SD2.map.player.lookAt([17, 50])); } }]]) {
        for (const gm of [1, 2]) { await setGm(gm); await closeAll(); await go(); await W8(5000); await closeAll(); const s = await win(10, { k: 'spin', dur: 10 }); R.modes[k + gm] = s; console.log('[' + TAG + '] ④ ' + nm + ' ' + (gm === 1 ? '🎨' : '⚡') + ' ' + JSON.stringify(s)); } }
      await setGm(0);
    }
  } catch (e) { if (e !== 'done') { console.log('실패 ' + (e && e.stack || e)); R.fail = String(e && e.message || e).slice(0, 300); } }
  R.errs = errs.slice(0, 10); fs.mkdirSync(OUT, { recursive: true }); const fn = path.join(OUT, 'cb_' + TAG + (PROF ? '_prof' : LOW ? '_low' : '') + '.json'); fs.writeFileSync(fn, JSON.stringify(R, null, 1)); console.log('→ ' + fn + ' · 페이지 오류 ' + errs.length + (errs.length ? ' ' + JSON.stringify(errs.slice(0, 3)) : ''));
  await b.close(); srv.close(); process.exit(0);
});
