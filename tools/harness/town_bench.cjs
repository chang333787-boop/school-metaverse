// 🧪 bench 한 줄이 끝까지 나오는지(PERF-G · town_bench.js) — zsh tools/ops/b2.sh node tools/harness/town_bench.cjs [마을=ourtown] [포트=8002] [--rate=1] [--ti0]
//   그리기 켬(프레임을 renderer.info.render.frame으로 셈) · 2코어 크롬북 흉내(low = 자동 30 고정) · 새 맥락
//   판정: 판 여섯(자동 60 · 잠금 끔 배율 1·0.5 각 두 번 20 · 자동 60)이 모두 프레임을 가짐 · 잠금 끔 판이 30 잠금에 안 묶임(중앙 간격 < 30ms — 맥 GPU 기준)
//         · 끝난 뒤 잠금·자동 해상도·배율이 처음대로(SD2.gfx.fm.on · GFX.adapt · dpr) · 한 줄에 '잠금 끔'·병목 판정 · 페이지 오류 0
const { chromium } = require('playwright');
const A = process.argv.slice(2), TOWN = A.find(a => !a.startsWith('--') && !/^\d+$/.test(a)) || 'ourtown', PORT = A.find(a => /^\d+$/.test(a)) || '8002';
const RATE = +((A.find(a => a.startsWith('--rate=')) || '--rate=1').slice(7)), TI0 = A.includes('--ti0');
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log((c ? '✓ ' : '✗ ') + m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
  await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 2 }); Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 4 }); });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  if (RATE > 1) { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE }); }
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + TOWN + '&bench=1' + (TI0 ? '&ti=0' : ''));
  await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && !window.SM_BUILD, null, { timeout: 400000, polling: 500 });
  const g0 = await ev(() => ({ on: SD2.gfx.fm.on, ad: SD2.gfx.adapt, mode: SD2.gfx.mode }));
  await p.waitForFunction(() => window.SM_BENCH, null, { timeout: 480000, polling: 1000 });
  await p.waitForTimeout(500);
  const r = await ev(() => ({ B: window.SM_BENCH, on: SD2.gfx.fm.on, ad: SD2.gfx.adapt, dpr: SD2.gfx.dpr, mode: SD2.perf().mode, lad: SD2.gfx.auto.ladder.slice(), lvl: SD2.gfx.auto.lvl }));
  const d = r.B.data;
  console.log('한 줄: ' + r.B.line);
  ok(g0.mode === 'low', '2코어 흉내 = low 판(' + g0.mode + ')');
  ok(d.a1.n > 100 && d.a2.n > 100 && d.d1.n > 100 && d.d5.n > 100, '판마다 프레임: 자동 ' + d.a1.n + '/' + d.a2.n + ' · 배율1 ' + d.d1.n + ' · 배율0.5 ' + d.d5.n);
  ok(d.d1.p50 > 0 && d.d1.p50 < 30, '잠금 끔 판 = 30 잠금에 안 묶임(배율1 중앙 간격 ' + d.d1.p50 + 'ms · 자동 판 ' + d.a1.p50 + 'ms)');
  ok(r.on === g0.on && r.ad === g0.ad && r.dpr === r.lad[r.lvl], '끝난 뒤 처음대로: 잠금 ' + r.on + ' · 자동 해상도 ' + r.ad + ' · 배율 ' + r.dpr + '(사다리 ' + r.lad[r.lvl] + ') · 모드 ' + r.mode);
  ok(/잠금 끔/.test(r.B.line) && /병목|여유|섞임/.test(r.B.line) && /참고/.test(r.B.line), '한 줄에 잠금 끔·병목 판정·힙 참고');
  ok(Array.isArray(d.logs) && d.logs[0] && Array.isArray(d.logs[0].fm), '자동 판 단계 기록 칸(FM ' + (d.logs[0] ? d.logs[0].fm.length : '-') + ' · ADAPT ' + (d.logs[0] ? d.logs[0].ad.length : '-') + ')');
  if (TI0) ok(d.ti0, 'ti=0 판 표시');
  ok(errs.length === 0, '페이지 오류 ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log(fail ? 'BENCH FAIL ' + fail : 'PASS'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('✗ 하네스 멈춤', e); console.log('BENCH FAIL harness'); process.exit(2); });
