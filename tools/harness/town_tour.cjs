// 마을 순회 측정(PERF-TOUR · 교사 10-14 '렉 검사하면서 해야 할 듯 — 데스크톱도 살짝 버벅여서 크롬북은 불안'): node tools/harness/town_tour.cjs [마을=ourtown] [포트=8002] [--gpu]
//   크롬북 조건 = CrOS UA · CPU 4배 느리게 · 1366×768 · DPR 1 · 자동 해상도 끔 — 정문 큰길 걷기 → 자전거로 다리 지나 산자락 → 바로 가기 5번 → 하늘에서 보기 열고 닫기 → 밤
//   잼: 프레임 시간 p50·p95·p99·최대 · 33ms 넘는 프레임 수(구간마다 · 전체) · --gpu = 화면 맞춤(vsync)·프레임 상한을 끄고(실제 그리기 시간이 드러남)
//   push 게이트: 전체 p95 < 33ms · 33ms 넘는 프레임 ≤ 1.5% (넘으면 그 꾸밈은 빼고 간다 — CLAUDE.md 'fps가 무너지면 기능을 빼고 간다')
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002', GPU = process.argv.includes('--gpu');
(async () => { const args = ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling']; if (GPU) args.push('--disable-gpu-vsync', '--disable-frame-rate-limit');
  const b = await chromium.launch({ args }); const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&dpr=1'); await p.waitForFunction(() => window.SM_TOWN, null, { timeout: 120000 }); await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = document.querySelector('.twn-p button'); if (b) b.click(); });
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const R = await p.evaluate(async () => { const M = SD2.map, sl = ms => new Promise(r => setTimeout(r, ms)), T = [], G = []; let phase = 'start', run = true, last = performance.now();
    { const RR = SD2.renderer, gl = RR.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'), orig = RR.render.bind(RR), pend = []; if (ext) RR.render = (s9, c9) => { const q = gl.createQuery(), ph = phase; gl.beginQuery(ext.TIME_ELAPSED_EXT, q); orig(s9, c9); gl.endQuery(ext.TIME_ELAPSED_EXT); pend.push([q, ph]); for (let i = pend.length - 1; i >= 0; i--) { const [qq, p9] = pend[i]; if (gl.getQueryParameter(qq, gl.QUERY_RESULT_AVAILABLE)) { if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) G.push([p9, gl.getQueryParameter(qq, gl.QUERY_RESULT) / 1e6]); gl.deleteQuery(qq); pend.splice(i, 1); } } }; }   // GPU 그리기 시간(이 컴퓨터 기준 — 꾸밈을 더할 때 늘어나는 양 비교용)
    const loop = () => { if (!run) return; const now = performance.now(); T.push([phase, now - last]); last = now; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    const follow = async (to, ms, v) => { const t0 = performance.now(), me0 = M.player.get(), rt = SM_TOWN.route(to, [me0.x, me0.z]), pts = rt && rt.ok ? rt.pts : null; let k = 1; while (performance.now() - t0 < ms) { const me = M.player.get(); if (pts) { while (k < pts.length - 1 && Math.hypot(pts[k][0] - me.x, pts[k][1] - me.z) < 3) k++; const q = pts[Math.min(k, pts.length - 1)]; M.player.steer(q[0] - me.x, q[1] - me.z, v, true); } await sl(150); } M.player.steer(null); };
    phase = 'walk'; M.player.teleport([15.4, -1.3, 52]); M.player.lookAt([15.4, 200]); await sl(400); await follow('대형마트', 12000, 4.2);
    phase = 'bike'; SM_TOWN.bike(true); await sl(300); await follow('전망대', 16000, 7.5); SM_TOWN.bike(false);
    phase = 'jump'; for (const q of ['우리 학교', '강', '호수', '병원 거리', '축구장']) { SM_TOWN.jump(q); await sl(2600); }
    phase = 'top'; SM_TOWN.top(true); await sl(3500); SM_TOWN.top(false); await sl(1200);
    phase = 'night'; for (let k = 0; k < 4; k++) { const c = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /(낮|노을|밤)$/.test((e.textContent || '').trim()) && e.textContent.trim().length < 8); if (!c || /밤/.test(c.textContent)) break; c.click(); await sl(400); } await follow('강', 5000, 4.2);
    run = false; const st = L => { const a = L.slice().sort((x, y) => x - y), q = f => +a[Math.min(a.length - 1, Math.floor(a.length * f))].toFixed(1); return { n: a.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: +a[a.length - 1].toFixed(1), over33: a.filter(x => x > 33.4).length }; };
    const out = { all: st(T.map(t => t[1])) }; for (const ph of ['walk', 'bike', 'jump', 'top', 'night']) out[ph] = st(T.filter(t => t[0] === ph).map(t => t[1]));
    if (G.length) { const gst = L => { const a = L.slice().sort((x, y) => x - y); return a.length ? { med: +a[a.length >> 1].toFixed(2), p95: +a[Math.floor(a.length * 0.95)].toFixed(2) } : null; }; out.gpu = { all: gst(G.map(g => g[1])) }; for (const ph of ['walk', 'bike', 'jump', 'top', 'night']) out.gpu[ph] = gst(G.filter(g => g[0] === ph).map(g => g[1])); }
    return out; });
  const gate = R.all.p95 < 33 && R.all.over33 <= Math.ceil(R.all.n * 0.015);
  console.log(JSON.stringify({ gpu: GPU, ...R, gate: gate ? 'PASS' : 'FAIL', errs }, null, 1)); await b.close(); process.exit(gate ? 0 : 1); })();
