// 드래곤 실제 놀이 장면 크롬북 흉내(팀 C · 11-01): node tools/harness/drg_play.cjs [repo=.] [--spots=1-2,3-1,…] [--sec=25] [--cpu=4] [--od=1] [--trans=1] [--first=1]
//   빈 장소 카메라 길이 아니라 그 차례를 보통 봇이 실제 시간으로 노는 동안 잰다(배우·불·파티클·비행 포함)
//   크롬북 흉내 = CrOS UA · 1366×768 · CPU 4× · GPU ANGLE · ?adapt=0&dpr=1(고정 해상도) · ⚡ 모드
//   잴 것(놀이 프레임만 = 덮개가 걷힌 뒤): p95 간격 · 50ms 넘는 간격 · 프레임 일 p95(주 스레드 · 봇 몫 뺌) · 그리기 CPU · GPU ms(타이머 질의 · 맥 GPU)
//            그리기 수·삼각형 최대 · 셰이더 수(놀이 중 새로 지은 수) · 힙 · 반투명 겹(--od · 화면 1/2 · 최대·99%·평균) · 덮개 시간(장소 짓기)
//   --trans=1  장 넘어가기(앞 장 마지막 차례 → 다음 장 첫 놀이 6초) 덮개 시간 · 덮개 뒤 가장 긴 프레임 · 놀이 중 새 셰이더
//   --first=1  첫 화면(제목)까지 받는 양·시간 · 1장 첫 놀이까지
//   --heap=1   장 오가기 힙(CDP 정밀 · 열한 장 두 바퀴) · --walk=0~11 이어서 놀기(--wturbo=3 · --stall=초 봇 막힘 건너뜀) · --split=1 GPU 몫 · --tris=1 삼각형 몫 · --shot=폴더 · --cpu=10
//   무거운 시험(그리기 켬) → B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_play.cjs .
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const DEF = '1-2,1-3,1-5,3-1,4-2,4-4,6-4,6-6,8-3,8-4,8-5,10-2,10-4,10-5,11-3,11-4';
const SPOTS = arg('spots', DEF).split(',').filter(Boolean), SEC = +arg('sec', 25), CPU = +arg('cpu', 4), OD = arg('od', '1') === '1', LEVEL = arg('level', 'normal');
const SPL = arg('split', '0') === '1', HEAPT = arg('heap', '0') === '1', SHOT = arg('shot', ''), TRI = arg('tris', '0') === '1', WALK = arg('walk', ''), TRANS = arg('trans', '0'), FIRST = arg('first', '0') === '1', SKIP = arg('skip', '0') === '1', EXTRA = arg('q', '');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.webp': 'image/webp', '.ogg': 'audio/ogg', '.jpg': 'image/jpeg' };
let served = [];
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } served.push([u, d.length, Date.now()]); r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const V = (fs.readFileSync(path.join(root, 'dragon/index.html'), 'utf8').match(/main\.js\?v=(\d+)/) || [])[1];

/* 페이지보다 먼저: rAF 콜백 시간(같은 ts = 한 프레임) · 봇 몫(__PF.bot) · 덮개 보임 */
const INIT = () => {
  const R = window.__PF = { on: false, fr: [], bot: 0, rc: 0, gpu: [], calls: 0, tris: 0, prog: 0 };
  const raf = window.requestAnimationFrame.bind(window);
  let cur = -1, work = 0, rcpu = 0;
  const flush = () => {
    if (cur < 0 || !R.on) return;
    const v = document.getElementById('veil'), veil = !!(v && v.style.display !== 'none' && !v.classList.contains('hide'));
    const G = window.DRG && DRG.world && DRG.world.G, busy = !!(G && (G.host.busy || (G.runner && G.runner.busy)));
    const st = G && G.runner && G.runner.step;
    R.fr.push([cur, work - R.bot, R.rc, R.calls, R.tris, R.prog, veil || busy ? 1 : 0, st ? st.id || '' : '', R.bot]);
    R.bot = 0; R.rc = 0;
  };
  window.requestAnimationFrame = (cb) => raf((ts) => {
    if (ts !== cur) { flush(); cur = ts; work = 0; }
    const t0 = performance.now();
    try { cb(ts); } finally { work += performance.now() - t0; }
  });
};

/* 그리기 감싸기 — CPU 시간 · 그리기 수 · GPU 타이머(EXT_disjoint_timer_query_webgl2) */
const HOOK = () => {
  const R = window.__PF, r = DRG.gfx.renderer, gl = r.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (R.hooked) return !!ext; R.hooked = true;
  const orig = r.render.bind(r), pend = []; let depth = 0;
  r.render = (s, c) => {
    depth++; let q = null;
    if (ext && depth === 1 && R.on && pend.length < 8) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); }
    const t0 = performance.now();
    try { orig(s, c); } finally {
      if (depth === 1) {
        const dt = performance.now() - t0; R.rc += dt; R.calls = r.info.render.calls; R.tris = r.info.render.triangles;
        const pl = r.info.programs || [], np = pl.length;
        if (R.on && np > R.prog && R.prog) {                      // 새 셰이더 = 어떤 재질 · 그 프레임 그리기 CPU ms(짓기 멈칫)
          const v = document.getElementById('veil'), veil = !!(v && v.style.display !== 'none' && !v.classList.contains('hide')), G = DRG.world.G;
          (R.newP = R.newP || []).push({ st: G.runner.step ? G.runner.step.id : '', veil: veil || G.host.busy, ms: Math.round(dt), names: pl.slice(R.prog).map((x) => x.name + ':' + String(x.cacheKey).split(',').slice(-3).join(',').slice(0, 40)) });
        }
        R.prog = np;
      }
      if (q) { gl.endQuery(ext.TIME_ELAPSED_EXT); pend.push(q); }
      depth--;
    }
    for (let i = 0; i < pend.length; i++) {
      const qq = pend[i];
      if (!gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)) continue;
      const dj = gl.getParameter(ext.GPU_DISJOINT_EXT);
      if (!dj && R.on) R.gpu.push(gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6);
      gl.deleteQuery(qq); pend.splice(i, 1); i--;
    }
  };
  return !!ext;
};

/* 반투명 겹 — 화면 1/2 · 불투명은 깊이만 · 반투명(transparent 또는 더하기 섞기)은 조각마다 +1 · 모든 조각(불투명 깊이 통과 포함)도 따로 */
const OVERDRAW = async () => {
  const THREE = await import('/lib/three.module.min.js');
  const { scene, camera } = DRG, r = DRG.gfx.renderer;
  const w = Math.round(innerWidth / 2), h = Math.round(innerHeight / 2);
  const rt = new THREE.WebGLRenderTarget(w, h, { depthBuffer: true });
  const mats = new Set();
  scene.traverseVisible((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m)); });
  const keep = [];
  for (const m of mats) {
    const tr = m.transparent || m.blending === THREE.AdditiveBlending;
    keep.push([m, m.onBeforeCompile, m.customProgramCacheKey, m.blending, m.blendSrc, m.blendDst, m.blendEquation, m.colorWrite, m.depthWrite, m.transparent, tr]);
    const ob = m.onBeforeCompile, ok = m.customProgramCacheKey.bind(m);
    m.onBeforeCompile = function (sh, rr) { if (ob) ob.call(this, sh, rr); sh.fragmentShader = sh.fragmentShader.replace(/\}\s*$/, '  gl_FragColor = vec4(1.0/255.0, 0.0, 0.0, 1.0);\n}'); };
    m.customProgramCacheKey = () => ok() + '|OD';
    m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor; m.blendEquation = THREE.AddEquation;
    m.needsUpdate = true;
  }
  const bg = scene.background, buf = new Uint8Array(w * h * 4);
  scene.background = null;
  const pass = (onlyTr) => {
    for (const k of keep) { const m = k[0]; m.colorWrite = onlyTr ? k[10] : k[7]; }
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, camera); r.setRenderTarget(null);
    r.readRenderTargetPixels(rt, 0, 0, w, h, buf);
    const hist = new Uint32Array(256); let sum = 0;
    for (let i = 0; i < w * h; i++) { const v = buf[i * 4]; hist[v]++; sum += v; }
    let mx = 0; for (let v = 255; v >= 0; v--) if (hist[v]) { mx = v; break; }
    let acc = 0, p99 = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= w * h * 0.01) { p99 = v; break; } }
    return { max: mx, p99, mean: +(sum / (w * h)).toFixed(2) };
  };
  const tr = pass(true), all = pass(false);
  /* 반투명 하나씩(그 물건 조각만 셈 · 깊이는 불투명) — 화면 몫이 큰 것부터 */
  const objs = []; scene.traverseVisible((o) => { const m = o.material && (Array.isArray(o.material) ? o.material[0] : o.material); if (m && (m.transparent || m.blending === THREE.AdditiveBlending || keep.find((k) => k[0] === m && k[10]))) objs.push(o); });
  const each = [];
  for (const o of objs.slice(0, 60)) {
    const vis = []; for (const x of objs) if (x !== o) { vis.push(x); x.visible = false; }
    const r1 = pass(true); for (const x of vis) x.visible = true;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (r1.mean > 0.002) each.push({ name: (o.name || o.type) + (o.parent && o.parent.name ? '@' + o.parent.name : '') + ' ro' + o.renderOrder + (o.isSprite ? ' s' + o.scale.x.toFixed(0) : '') + (o.geometry && o.geometry.instanceCount < 1e9 ? ' n' + o.geometry.instanceCount : o.count ? ' n' + o.count : ''), mean: r1.mean, p99: r1.p99, max: r1.max, op: m.uniforms && m.uniforms.op ? +m.uniforms.op.value.toFixed(2) : m.opacity });
  }
  each.sort((a, b) => b.mean - a.mean);
  for (const k of keep) { const m = k[0]; m.onBeforeCompile = k[1]; m.customProgramCacheKey = k[2]; m.blending = k[3]; m.blendSrc = k[4]; m.blendDst = k[5]; m.blendEquation = k[6]; m.colorWrite = k[7]; m.depthWrite = k[8]; m.needsUpdate = true; }
  scene.background = bg; rt.dispose();
  return { tr, all, mats: mats.size, top: each.slice(0, 6) };
};

/* GPU 몫 나누기(--split=1) — 놀이를 멈춘 같은 화면을 묶음마다 빼고 그려 GPU ms 차이(맥 GPU · 중앙값 40번) · 그리기 수·삼각형 차이도 */
const SPLIT = async () => {
  const { scene, camera } = DRG, r = DRG.gfx.renderer, gl = r.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'), G = DRG.world.G;
  if (!ext) return null;
  const R = window.__PF; R.on = false;
  const time = async (n = 40) => {
    const out = []; let calls = 0, tris = 0;
    for (let i = 0; i < n; i++) {
      await new Promise((res) => requestAnimationFrame(res));
      const qq = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, qq); r.render(scene, camera); gl.endQuery(ext.TIME_ELAPSED_EXT);
      calls = r.info.render.calls; tris = r.info.render.triangles;
      await new Promise((res) => { const f = () => (gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE) ? res() : setTimeout(f, 2)); f(); });
      if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) out.push(gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6); gl.deleteQuery(qq);
    }
    out.sort((a, b) => a - b); return { ms: out[out.length >> 1] || 0, calls, tris };
  };
  DRG.loop.paused = true;
  const env = G.env, place = G.place && G.place.group, objs = [];
  scene.traverseVisible((o) => { if (o.isMesh || o.isPoints || o.isSprite || o.isLine) objs.push(o); });
  const isTr = (o) => { const m = Array.isArray(o.material) ? o.material[0] : o.material; return !!m && (m.transparent || m.blending === 2); };
  const groups = {
    '바다': [env.sea], '하늘': [env.sky],
    '반투명·더하기': objs.filter(isTr),
    '뼈 배우(사람·드래곤)': objs.filter((o) => o.isSkinnedMesh),
    '인스턴스': objs.filter((o) => o.isInstancedMesh && !isTr(o)),
    '장소 불투명(그 밖)': objs.filter((o) => !isTr(o) && !o.isSkinnedMesh && !o.isInstancedMesh && o !== env.sea && o !== env.sky),
  };
  const base = await time(), res = { '전체': { ms: +base.ms.toFixed(2), calls: base.calls, tris: Math.round(base.tris / 1000) } };
  for (const k in groups) {
    const L = groups[k].filter((o) => o && o.visible); if (!L.length) continue;
    L.forEach((o) => (o.visible = false));
    const t = await time();
    L.forEach((o) => (o.visible = true));
    res[k] = { ms: +(base.ms - t.ms).toFixed(2), calls: base.calls - t.calls, tris: Math.round((base.tris - t.tris) / 1000), n: L.length };
  }
  /* 큰 반투명 하나하나(화면 넓이 순 아님 · 빼 보았을 때 GPU 차이 큰 셋) */
  const tr = groups['반투명·더하기'].filter((o) => o.visible), each = [];
  for (const o of tr.slice(0, 40)) { o.visible = false; const t = await time(12); o.visible = true; each.push([(o.name || o.type) + (o.parent && o.parent.name ? '@' + o.parent.name : '') + (o.isSprite ? ' s' + o.scale.x.toFixed(0) : ''), +(base.ms - t.ms).toFixed(2)]); }
  each.sort((a, b) => b[1] - a[1]); res.tTop = each.slice(0, 4);
  DRG.loop.paused = false;
  return res;
};

/* 삼각형 몫(--tris=1) — 지금 화면 시야 안 물건마다 삼각형(인스턴스 수 곱) · 많은 차례 열 */
const TRIS = async () => {
  const THREE = await import('/lib/three.module.min.js');
  const { scene, camera } = DRG, fr = new THREE.Frustum(), m4 = new THREE.Matrix4(), sp = new THREE.Sphere();
  camera.updateMatrixWorld(); m4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(m4);
  const out = [];
  scene.traverseVisible((o) => {
    if (!(o.isMesh || o.isPoints) || !o.geometry || !o.layers.test(camera.layers)) return;
    const g = o.geometry; if (o.frustumCulled) { if (!g.boundingSphere) g.computeBoundingSphere(); sp.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(sp)) return; }
    const n0 = g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0, dr = g.drawRange.count === Infinity ? n0 : Math.min(n0, g.drawRange.count);
    const inst = o.isInstancedMesh ? o.count : g.isInstancedBufferGeometry ? Math.min(g.instanceCount, 1e6) : 1, t = (o.isPoints ? dr : dr / 3) * inst;
    const d = camera.position.distanceTo(sp.copy(g.boundingSphere || new THREE.Sphere()).applyMatrix4(o.matrixWorld).center);
    out.push({ k: (o.name || o.type) + (o.parent && o.parent.name ? '@' + o.parent.name.slice(0, 14) : '') + (inst > 1 ? ' ×' + inst : '') + ' r' + Math.round(sp.radius) + ' d' + Math.round(d), t });
  });
  out.sort((a, b) => b.t - a.t);
  return { sum: Math.round(out.reduce((a, x) => a + x.t, 0) / 1000), top: out.slice(0, 10).map((x) => x.k + ' ' + Math.round(x.t / 1000) + 'k') };
};

const q = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const f1 = (x) => Math.round(x * 10) / 10;

srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--js-flags=--expose-gc'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
  const p = await ctx.newPage(); await p.addInitScript(INIT);
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|404|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const cdp = await ctx.newCDPSession(p);
  const thr = rate => cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const rows = [], trows = [];
  const Q0 = `diff=${LEVEL}&chain=0&seed=1&mode=smooth&adapt=0&dpr=1${EXTRA ? '&' + EXTRA : ''}`;
  const openStep = async (ch, step, chain) => {
    await thr(1);
    await p.goto(`${base}/dragon/?ch=${ch}&step=${step}&${Q0.replace('chain=0', 'chain=' + (chain ? 1 : 0))}`);
    await p.waitForFunction(() => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id && !DRG.sense().busy, null, { timeout: 120000 });
    return p.evaluate(HOOK);
  };
  const startBot = () => p.evaluate(async ({ LEVEL, V }) => {
    const m = await import('/dragon/js/bots/story_bots.js?v=' + V), s = m.storyBot(LEVEL), R = window.__PF;
    DRG.bot.run((n, B) => { const t0 = performance.now(); const r = s(n, B); R.bot += performance.now() - t0; return r; });
  }, { LEVEL, V });
  const rec = (on) => p.evaluate((on) => { const R = window.__PF; if (on) { R.fr = []; R.gpu = []; R.newP = []; } R.on = on; return on ? 0 : { fr: R.fr, gpu: R.gpu, newP: R.newP || [] }; }, on);
  /* 힙 = CDP(performance.memory는 헤드리스에서 칸 단위로 뭉개져 늘 같은 값이 나옴) · GC 두 번 뒤 */
  const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage'); const u = await cdp.send('Runtime.getHeapUsage'); return f1(u.usedSize / 1048576); };
  /* 프레임 기록 → 한 줄 */
  const sum = (fr, gpu) => {
    const play = [], load = [], ids = new Set(), longs = []; let botLong = 0, long = 0, longMax = 0, lastLoad = -1e9, newProg = 0, prog0 = 0;
    for (let i = 1; i < fr.length; i++) {
      const [ts, work, rc, calls, tris, prog, busy, id] = fr[i], dt = ts - fr[i - 1][0];
      if (busy || fr[i - 1][6]) { load.push(dt); lastLoad = ts; continue; }
      if (ts - lastLoad < 500) continue;                        // 덮개가 걷히는 0.5초는 따로(장소 첫 그리기)
      if (!prog0) prog0 = prog;
      if (prog > fr[i - 1][5] && fr[i - 1][5]) newProg += prog - fr[i - 1][5];
      play.push({ dt, work, rc, calls, tris, prog }); ids.add(id);
      if (dt > 50 && (fr[i - 1][8] || 0) > dt * 0.5) { botLong++; continue; }   // 봇 길 찾기(A*)가 그 프레임을 잡아먹음 = 게임 몫 아님
      if (dt > 50) { long++; if (dt > longMax) longMax = dt; longs.push(id + ' ' + Math.round(dt) + 'ms(게임 일 ' + Math.round(work) + ' · 봇 ' + Math.round(fr[i][8] || 0) + ' · 앞 프레임 게임 ' + Math.round(fr[i - 1][1]) + ' · 봇 ' + Math.round(fr[i - 1][8] || 0) + ')'); }
    }
    const dts = play.map(x => x.dt);
    return {
      n: play.length, fps: play.length ? f1(1000 / (dts.reduce((a, c) => a + c, 0) / dts.length)) : 0, p95: f1(q(dts, 0.95)), p99: f1(q(dts, 0.99)), long, longMax: f1(longMax),
      work95: f1(q(play.map(x => x.work), 0.95)), workMed: f1(q(play.map(x => x.work), 0.5)), rc95: f1(q(play.map(x => x.rc), 0.95)), gpu95: Math.round(q(gpu, 0.95) * 100) / 100, gpuMed: Math.round(q(gpu, 0.5) * 100) / 100,
      calls: Math.max(0, ...play.map(x => x.calls)), tris: Math.round(Math.max(0, ...play.map(x => x.tris)) / 1000), prog: Math.max(0, ...play.map(x => x.prog)), newProg, ids: [...ids].join('·'), loadN: load.length, longs, botLong,
    };
  };
  try {
    /* ① 놀이 장면 */
    if (!SKIP) {
      console.log(`\n[놀이 장면 · CPU ${CPU}× · 고정 해상도 1366×768 · ⚡ · 보통 봇 실제 시간 ${SEC}초]`);
      for (const sp0 of SPOTS) {
        const sp = sp0, [ch, st] = sp.split('-').map(Number);
        const idx = await p.evaluate(async ({ ch, id, V }) => (await import('/dragon/js/story/ch' + ch + '.js?v=' + V)).chapter.steps.findIndex(s => s.id === id), { ch, id: sp, V }).catch(() => -1);
        if (idx < 0) { await openStep(ch, 0); }
        const i2 = idx >= 0 ? idx : await p.evaluate(async ({ ch, id, V }) => (await import('/dragon/js/story/ch' + ch + '.js?v=' + V)).chapter.steps.findIndex(s => s.id === id), { ch, id: sp, V });
        const gx = await openStep(ch, i2);
        await thr(CPU); await p.waitForTimeout(800);
        await rec(true); await startBot();
        await p.waitForTimeout(SEC * 1000);
        const { fr, gpu, newP } = await rec(false);
        await p.evaluate(() => DRG.bot.stop());
        for (const x of newP) if (!x.veil) console.log('    놀이 중 새 셰이더 ' + x.st + ' ' + x.ms + 'ms ' + x.names.join(' / '));
        if (SHOT) await p.screenshot({ path: path.join(SHOT, sp0 + '.jpg'), type: 'jpeg', quality: 80 });
        if (TRI) { const tt = await p.evaluate(TRIS).catch(e => ({ err: e.message })); console.log('    삼각형 몫(지금 화면) ' + tt.sum + 'k = ' + (tt.top || []).join(' · ') + (tt.err || '')); }
        let sp1 = null; if (SPL) { await thr(1); sp1 = await p.evaluate(SPLIT).catch(e => ({ err: e.message.slice(0, 160) })); }
        let od = null; if (OD) { await thr(1); od = await p.evaluate(OVERDRAW).catch(e => ({ err: e.message.slice(0, 120) })); }
        const hp = await heap();
        const s = sum(fr, gpu), place = await p.evaluate(() => DRG.sense().place + '·' + (DRG.world.G.placeKey || '').split('|').slice(1).join('·'));
        const row = Object.assign({ spot: sp, place, heap: hp, gpuOk: gx }, s, od && !od.err ? { odTr: od.tr.max + '/' + od.tr.p99 + '/' + od.tr.mean, odAll: od.all.p99 + '/' + od.all.mean } : { odTr: od ? od.err : '-' });
        if (sp1) row.split = sp1;
        for (const l of s.longs) console.log('    50ms 넘음 ' + l);
        if (od && od.top && od.tr.mean > 0.05) console.log('    반투명 몫 ' + od.top.map((x) => x.name + ' 평균 ' + x.mean + ' 99% ' + x.p99 + ' 최대 ' + x.max + ' op ' + x.op).join(' | '));
        rows.push(row);
        if (sp1) console.log("    GPU 몫 " + JSON.stringify(sp1));
        console.log(`  ${sp0} ${place} | p95 ${s.p95} · p99 ${s.p99} · fps ${s.fps} · 50ms+ ${s.long}(최대 ${s.longMax}${s.botLong ? ' · 봇 몫 ' + s.botLong + ' 뺌' : ''}) | 일 p95 ${s.work95}(중앙 ${s.workMed}) · 그리기CPU p95 ${s.rc95} · GPU ${s.gpuMed}/${s.gpu95}ms | 그리기 ${s.calls} · 삼각형 ${s.tris}k · 셰이더 ${s.prog}(놀이 중 +${s.newProg}) | 힙 ${hp}MB | 겹 반투명 최대/99%/평균 ${row.odTr} · 모든 조각 99%/평균 ${row.odAll || '-'} | 차례 ${s.ids} · 프레임 ${s.n}`);
      }
    }
    /* ② 장 넘어가기 */
    if (TRANS !== '0') {
      const chs = TRANS === '1' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : TRANS.split(',').map(Number);
      console.log(`\n[장 넘어가기 · CPU ${CPU}× · 앞 장 마지막 차례 → 다음 장 첫 놀이 6초]`);
      for (const ch of chs) {
        const last = await p.evaluate(async ({ ch, V }) => (await import('/dragon/js/story/ch' + ch + '.js?v=' + V)).chapter.steps.length - 1, { ch, V }).catch(async () => { await openStep(ch, 0); return p.evaluate(async ({ ch, V }) => (await import('/dragon/js/story/ch' + ch + '.js?v=' + V)).chapter.steps.length - 1, { ch, V }); });
        await openStep(ch, last, true);
        await thr(CPU); await p.waitForTimeout(500);
        await rec(true); await startBot();
        const t0 = Date.now();
        const ok = await p.waitForFunction((ch) => { const s = DRG.sense(); return s && s.ch !== ch && !s.busy && s.id; }, ch, { timeout: 240000, polling: 200 }).then(() => true).catch(() => false);
        const tIn = Date.now();
        await p.waitForTimeout(6000);
        const { fr, newP } = await rec(false); await p.evaluate(() => DRG.bot.stop());
        for (const x of newP) if (!x.veil) console.log('    덮개 밖 새 셰이더 ' + x.st + ' ' + x.ms + 'ms ' + x.names.join(' / '));
        /* 덮개 구간 = busy 프레임 · 덮개 뒤 6초 */
        let v0 = -1, v1 = -1, vSum = 0, vMax = 0; for (let i = 0; i < fr.length; i++) if (fr[i][6]) { if (v0 < 0) v0 = fr[i][0]; v1 = fr[i][0]; }
        for (let i = 1; i < fr.length; i++) if (fr[i][6] || fr[i - 1][6]) { const d = fr[i][0] - fr[i - 1][0]; vSum += d; if (d > vMax) vMax = d; }
        const after = fr.filter((x, i) => i && x[0] > v1 && !x[6]), aDt = after.map((x, i) => i ? x[0] - after[i - 1][0] : 0).slice(1).filter((d, i) => !((after[i][8] || 0) > d * 0.5));   // 봇 길 찾기 프레임 뺌
        const p0 = after.length ? after[0][5] : 0, p1 = after.length ? after[after.length - 1][5] : 0;
        const firstAfter = after.length > 1 ? after[1][0] - after[0][0] : 0;
        const tr = { ch: ch + '→' + (ch + 1), ok, veil: Math.round(vSum), veilMax: Math.round(vMax), maxAfter: f1(Math.max(0, ...aDt)), first: f1(firstAfter), long: aDt.filter(x => x > 50).length, newProg: p1 - p0, wait: Math.round((tIn - t0) / 100) / 10 };
        trows.push(tr);
        console.log(`  ${tr.ch} ${ok ? '' : '(못 넘어감) '}덮개 ${tr.veil}ms(가장 긴 멈춤 ${tr.veilMax}ms) · 덮개 뒤 6초 가장 긴 간격 ${tr.maxAfter}ms(50ms+ ${tr.long}) · 놀이 중 새 셰이더 ${tr.newProg} · 앞 장 끝까지 ${tr.wait}초`);
      }
    }
    /* ⑤ 이어서 놀기(--walk=0~11 · 오프닝부터 장을 이어 · ?turbo=WT) — 덮개 밖 50ms 넘는 간격을 하나하나(차례 · 새 셰이더 · 그 프레임 일) */
    if (WALK !== '') {
      const [c0, c1] = WALK.split('~').map(Number), WT = +arg('wturbo', 2), WMIN = +arg('wmin', 60);
      console.log(`\n[이어서 놀기 · ${c0}~${c1}장 · CPU ${CPU}× · turbo ${WT} · 보통 봇 · 덮개 밖 50ms 넘는 프레임]`);
      await thr(1);
      await p.goto(`${base}/dragon/?ch=${c0}&step=0&diff=${LEVEL}&chain=1&seed=1&mode=smooth&adapt=0&dpr=1&turbo=${WT}`);
      await p.waitForFunction(() => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id, null, { timeout: 120000 });
      await p.evaluate(HOOK); await thr(CPU); await rec(true); await startBot();
      const t0 = Date.now(), STALL = +arg('stall', 240); let lastId = '', idT = Date.now();
      const longs = [], seen = {}, stalls = [];
      while (Date.now() - t0 < WMIN * 60000) {
        await p.waitForTimeout(3000);
        const r = await p.evaluate(() => { const R = window.__PF, fr = R.fr.splice(0, Math.max(0, R.fr.length - 1)), last = R.fr[0]; if (last) fr.push(last), np = (R.newP || []).splice(0); const s = DRG.sense(); return { fr, np, ch: s.ch, id: s.id, ended: !!DRG.world.G.ended, err: DRG.world.G.runner.err || '' }; });
        for (const x of r.np) if (!x.veil) { longs.push({ kind: 'prog', st: x.st, ms: x.ms, names: x.names }); console.log(`\n   ${x.st} 새 셰이더 ${x.ms}ms ${x.names.join(' / ')}`); }
        let veilT = -1e9;
        for (let i = 1; i < r.fr.length; i++) { const a = r.fr[i - 1], c = r.fr[i], dt = c[0] - a[0]; if (c[6] || a[6]) { veilT = c[0]; continue; } const id = c[7]; seen[id] = seen[id] || { n: 0, max: 0, calls: 0, tris: 0 }; const S = seen[id]; S.n++; if (dt > S.max) S.max = dt; if (c[3] > S.calls) S.calls = c[3]; if (c[4] > S.tris) S.tris = c[4]; if (dt > 50) { const L = { kind: 'long', st: id, ms: Math.round(dt), work: Math.round(c[1]), bot: Math.round(c[8] || 0), pw: Math.round(a[1]), pb: Math.round(a[8] || 0), afterVeil: Math.round(c[0] - veilT) }; longs.push(L); console.log(`\n   ${L.st} ${L.ms}ms(게임 일 ${L.work} · 봇 ${L.bot} · 앞 프레임 게임 ${L.pw} · 봇 ${L.pb} · 덮개 걷힌 뒤 ${L.afterVeil}ms)`); } }
        if (r.id !== lastId) { lastId = r.id; idT = Date.now(); process.stdout.write(' ' + r.id); }
        else if (Date.now() - idT > STALL * 1000 && r.ch < c1) {   // 봇이 막힘(실제 시간 CPU 4×에서만 나는 봇 막힘 · 게임 몫 아님) → 다음 장으로
          console.log(`\n   ${r.id} 봇 막힘 ${STALL}초 → ${r.ch + 1}장으로`); stalls.push(r.id); idT = Date.now();
          await p.evaluate(async (n) => { const G = DRG.world.G; G.runner.done = true; await G.startCh(n, 0); }, r.ch + 1);
        }
        if (r.err) { console.log('\n  예외 ' + r.err); break; }
        if (r.ended) break;
        if (r.ch > c1) break;
      }
      console.log('\n  걸린 ' + f1((Date.now() - t0) / 60000) + '분 · 50ms 넘는 간격(덮개 밖) ' + longs.filter(x => x.kind === 'long').length + (stalls.length ? ' · 봇 막혀 건너뜀 ' + stalls.join(',') : ''));
      for (const x of longs) console.log('   ' + (x.kind === 'long' ? `${x.st} ${x.ms}ms(게임 일 ${x.work} · 봇 ${x.bot} · 앞 프레임 게임 ${x.pw} · 봇 ${x.pb} · 덮개 걷힌 뒤 ${x.afterVeil}ms)` : `${x.st} 새 셰이더 ${x.ms}ms ${x.names.join(' / ')}`));
      const worst = Object.entries(seen).sort((a, b) => b[1].tris - a[1].tris).slice(0, 8).map(([k, v]) => `${k} 그리기 ${v.calls} 삼각형 ${Math.round(v.tris / 1000)}k 최대 간격 ${Math.round(v.max)}`);
      console.log('  삼각형 많은 차례: ' + worst.join(' · '));
      rows.push({ walk: WALK, longs, seen });
    }
    /* ④ 장 열 번 오가기 힙(CDP 정밀 값 · GC 뒤) — 장을 통째로 새로 시작(장소·배우·이펙트·책·음악) · 기하·텍스처·셰이더 수 */
    if (HEAPT) {
      console.log('\n[장 오가기 힙 · CDP 정밀 · 장마다 첫 차례 4초 · 한 바퀴 열한 장]');
      await openStep(1, 2); await thr(1);
      const cyc = [4, 8, 10, 11, 3, 6, 9, 2, 5, 7, 1];               // 한 바퀴 = 열한 장(1장으로 돌아옴) · 첫 바퀴는 모델·공유 재질 캐시를 채움 → 둘째 바퀴 늘어난 몫 = 새는 것
      const snap = async (lab) => { const h = await heap(); const m = await p.evaluate(() => { const i = DRG.gfx.renderer.info; return { g: i.memory.geometries, t: i.memory.textures, pr: i.programs.length, ch: DRG.scene.children.length }; }); console.log(`   ${lab} 힙 ${h}MB · 기하 ${m.g} · 텍스처 ${m.t} · 셰이더 ${m.pr} · 장면 자식 ${m.ch}`); return Object.assign({ h }, m); };
      const go = async (ch) => { await p.evaluate(async (ch) => { const G = DRG.world.G; G.runner.done = true; await G.startCh(ch, 0); }, ch); await p.waitForFunction(() => !DRG.sense().busy, null, { timeout: 60000 }); await p.waitForTimeout(4000); };
      await go(1); for (const c of cyc) await go(c);
      const h0 = await snap('첫 바퀴 뒤(1장)');
      for (const c of cyc) await go(c);
      const h1 = await snap('둘째 바퀴 뒤(1장 · 장 열한 번 더)');
      console.log(`   증가 ${f1(h1.h - h0.h)}MB · 기하 ${h1.g - h0.g} · 텍스처 ${h1.t - h0.t} · 셰이더 ${h1.pr - h0.pr}`);
      rows.push({ heapTrip: { h0, h1 } });
    }
    /* ③ 첫 화면 */
    if (FIRST) {
      console.log(`\n[첫 화면 · CPU ${CPU}× · 캐시 없음]`);
      for (const [lab, qs, until] of [['제목 화면', '', () => document.getElementById('load').classList.contains('hide')], ['1장 첫 놀이', '?ch=1&step=0&chain=0&seed=1&mode=smooth', () => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id && !DRG.sense().busy]]) {
        await thr(1); await p.goto('about:blank'); await thr(CPU); served = [];
        const t0 = Date.now(); await p.goto(base + '/dragon/' + qs); await p.waitForFunction(until, null, { timeout: 120000, polling: 50 });
        const ms = Date.now() - t0, bytes = served.reduce((a, x) => a + x[1], 0);
        const top = served.slice().sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0].split('/').slice(-1)[0] + ' ' + Math.round(x[1] / 1024) + 'KB').join(' · ');
        console.log(`  ${lab}: ${f1(ms / 1000)}초 · ${served.length}개 ${f1(bytes / 1048576)}MB · 큰 것 ${top}`);
        rows.push({ first: lab, ms, files: served.length, MB: f1(bytes / 1048576) });
      }
      await thr(1);
    }
  } catch (e) { console.log('예외', e.message.slice(0, 400)); errs.push('예외 ' + e.message.slice(0, 200)); }
  console.log('\n페이지 오류 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));
  if (process.env.DRG_OUT) fs.writeFileSync(path.join(process.env.DRG_OUT, 'drg_play_' + Date.now() + '.json'), JSON.stringify({ rows, trows, errs }, null, 1));   // DRG_OUT=폴더 → 표 JSON
  await b.close(); srv.close();
});
