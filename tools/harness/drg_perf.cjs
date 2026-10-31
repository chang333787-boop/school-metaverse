// 드래곤 게임 기술 바탕 시험: node tools/harness/drg_perf.cjs [repoDir=.] [--sec=20] [--path=/dragon/]
//   크롬북 흉내(CrOS UA · 1366×768 · GPU ANGLE · CPU 4×) — ① 열기·오류 0 ② 봇 = 입력만으로 움직임 ③ 같은 씨앗 + 같은 입력 = 같은 판(두 번)
//   ④ ⚡ 부드럽게 모드 bench(p95 · 그리기 · 삼각형) ⑤ 🎨 그래픽 우선 = 30 고정 · 무거운 시험이라 tools/ops/b2.sh로 돌린다
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const SEC = +arg('sec', 20), PAGE = arg('path', '/dragon/');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.webp': 'image/webp', '.ogg': 'audio/ogg' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const cdp = await ctx.newCDPSession(p);
    const thr = rate => cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const open = async (q) => { await p.goto(base + PAGE + q); await p.waitForFunction(() => window.DRG && DRG.loop && DRG.loop.n > 30, null, { timeout: 90000 }); };
    /* 봇 대본: 지금 걸음 기준 +10에 W 누름 · +100에 떼고 D · +160에 떼고 상태 기록 */
    const script = () => ev(() => new Promise(res => { let s0 = -1; DRG.bot.run((n, B) => { if (s0 < 0) s0 = n;
      const k = n - s0; if (k === 10) B.press('KeyW'); if (k === 100) { B.release('KeyW'); B.press('KeyD'); } if (k === 130) B.drag(40, -10);
      if (k === 160) { B.release('KeyD'); res(DRG.state()); return false; } }); }));

    console.log('\n[열기·봇]');
    await open('?seed=1&mode=smooth');
    const s0 = await ev(() => DRG.state());
    const s1 = await script();
    ok(s1 && (Math.abs(s1.x - s0.x) + Math.abs(s1.z - s0.z)) > 20, '봇이 입력만으로 움직임 ' + JSON.stringify(s0) + ' → ' + JSON.stringify(s1));
    await open('?seed=1&mode=smooth');
    const s2 = await script();
    ok(JSON.stringify(s1) === JSON.stringify(s2), '같은 씨앗 + 같은 입력 = 같은 판(' + JSON.stringify(s2) + ')');

    console.log('\n[⚡ 부드럽게 · CPU 4× · bench ' + SEC + '초]');
    await open('?seed=1&mode=smooth'); await thr(4); await W8(2500);
    const line = await ev(s => DRG.bench(s), SEC); console.log('   ' + line);
    const p95 = +(/p95 ([\d.]+)/.exec(line) || [])[1];
    ok(p95 > 0 && p95 <= 33, '⚡ p95 ' + p95 + 'ms ≤ 33');
    const pf = await ev(() => DRG.perf()); console.log('   perf ' + JSON.stringify(pf));

    console.log('\n[🎨 그래픽 우선 · CPU 4×]');
    await thr(1); await open('?seed=1&mode=gfx'); await thr(4); await W8(3000);
    const g = await ev(() => new Promise(res => { const d0 = DRG.gfx.draws, t0 = performance.now(); setTimeout(() => res((DRG.gfx.draws - d0) / ((performance.now() - t0) / 1000)), 6000); }));
    ok(g > 28 && g < 31.5, '🎨 그린 프레임 ' + g.toFixed(1) + '/초(30 고정)');
    await thr(1);
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); }
  await b.close(); srv.close();
  console.log('\n' + (fails.length ? '실패 ' + fails.length + ': ' + fails.join(' · ') : '모두 통과'));
  process.exit(fails.length ? 1 : 0);
});
