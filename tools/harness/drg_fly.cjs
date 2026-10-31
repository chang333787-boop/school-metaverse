// 비행·바다·배 시험(단계 3 팀 F): zsh tools/ops/b2.sh node tools/harness/drg_fly.cjs [repoDir=.] [--only=easy,normal,dumb,boat,same,perf] [--seeds=1,2,3] [--shots]
//   크롬북 흉내(CrOS UA · 1366×768 · GPU ANGLE) · 봇 판은 ?turbo=8로 빨리 · 성능은 turbo 없이 CPU 4×
//   ① 쉬움 봇·보통 봇이 코스를 끝냄(시간) ② 가만히·Space 연타·왼쪽 누른 채 봇은 못 끝냄 ③ 배: 박자 봇은 닿고 연타 봇은 한참 늦음
//   ④ 같은 씨앗 + 같은 입력 = 같은 판 ⑤ ⚡ 모드 CPU 4× p95 ≤ 33ms · 그리기 ≤ 110(장소) · 삼각형 ≤ 25만 · 오류 0 · --shots = docs/dragon/shots/f_*.jpg
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const ONLY = arg('only', 'easy,normal,dumb,regrab,boat,lift,same,perf').split(','), SEEDS = arg('seeds', '1,2,3').split(',').map(Number), SHOTS = process.argv.includes('--shots');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const fails = [], rows = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const has = (k) => ONLY.includes(k);

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
    const open = async (q) => { await p.goto(base + '/dragon/' + q); await p.waitForFunction(() => window.DRG && DRG.loop && DRG.loop.n > 30 && DRG.state() && !DRG.state().loading, null, { timeout: 120000 }); };
    /* 봇을 넣고 끝날 때까지(또는 판 시간 lim초) 돌림 — 결과 = 마지막 상태 */
    const play = (bot, lim) => ev(async ({ bot, lim }) => {
      const m = await import('/dragon/js/bots/flight_bot.js?v=14');
      const fn = bot[0] === 'boat' ? m.boatBot(bot[1], bot[2]) : m.flyBot(bot[1]);
      return await new Promise((res) => {
        let n0 = -1, out = null;
        DRG.bot.run((n, B) => { if (n0 < 0) n0 = n; const s = DRG.state(); if (s.done || s.arrived || s.t > lim) { out = s; DRG.bot.stop(); res(s); return false; } return fn(n, B); });
        const iv = setInterval(() => { if (out) clearInterval(iv); }, 500);
      });
    }, { bot, lim });

    if (has('easy') || has('normal')) {
      for (const lv of ['easy', 'normal']) {
        if (!has(lv)) continue;
        console.log('\n[' + lv + ' 봇 · 씨앗 ' + SEEDS.join(',') + ' · turbo 8]');
        for (const sd of SEEDS) {
          await open('?scene=fly&diff=' + lv + '&seed=' + sd + '&turbo=8&hold=1&mode=smooth');
          const s = await play(['fly', lv], 240);
          rows.push([lv + ' 봇 씨앗 ' + sd, s.done ? '끝냄' : '못 끝냄', s.done ? s.doneT.toFixed(1) + '초' : '-', '떨어짐 ' + s.falls + ' · 스침 ' + s.grazes + ' · 첨벙 ' + s.splashes + ' · 꼬리 맞춤 ' + s.matched + '/12 · 놓침 ' + s.misses + (lv === 'normal' ? ' · 박자 날갯짓 ' + s.perfect + '/일찍 ' + s.early : '')]);
          ok(s.done, lv + ' 봇 씨앗 ' + sd + ' 코스 끝냄 ' + (s.done ? s.doneT.toFixed(1) + '초' : '(관문 ' + s.gates + ')') + ' ' + JSON.stringify(s));
        }
      }
    }
    if (has('dumb')) {
      console.log('\n[못 끝내야 하는 봇 · 판 150초]');
      for (const lv of ['easy', 'normal']) for (const k of ['idle', 'mash', 'left']) {
        await open('?scene=fly&diff=' + lv + '&seed=1&turbo=8&hold=1&mode=smooth');
        const s = await play(['fly', k], 150);
        const nm = { idle: '가만히', mash: 'Space 연타', left: '왼쪽 누른 채' }[k];
        rows.push([nm + ' 봇(' + lv + ')', s.done ? '끝냄 ✗' : '못 끝냄', '-', '관문 ' + s.gates + '/12 · 떨어짐 ' + s.falls + ' · 첨벙 ' + s.splashes]);
        ok(!s.done, nm + ' 봇(' + lv + ') 못 끝냄 — 관문 ' + s.gates);
      }
    }
    if (has('regrab')) {
      console.log('\n[떨어짐 → 다시 붙기 · 보통]');
      await open('?scene=fly&diff=normal&seed=1&turbo=8&hold=1');
      const s = await play(['fly', 'stall'], 40);
      ok(s.falls >= 1 && s.regrabs >= 1 && s.regrabs > s.splashes, '창에서 Space로 다시 붙음 — 떨어짐 ' + s.falls + ' · 다시 붙음 ' + s.regrabs + ' · 그중 물에서 건짐 ' + s.splashes);
      rows.push(['떨어졌다 다시 붙는 봇(보통)', '떨어짐 ' + s.falls, '', '다시 붙음 ' + s.regrabs + ' · 물에서 건짐 ' + s.splashes]);
      await open('?scene=fly&diff=normal&seed=1&turbo=8&hold=1');
      const m = await play(['fly', 'idle'], 40);
      ok(m.falls >= 1 && m.regrabs === m.splashes, '가만히 = 창에서 못 붙고 물에서 건져짐(첨벙) — 떨어짐 ' + m.falls + ' · 첨벙 ' + m.splashes);
    }
    if (has('boat')) {
      console.log('\n[배 · 노 박자]');
      const res = {};
      for (const k of ['beat', 'mash', 'idle']) {
        await open('?scene=fly&boat=1&diff=normal&seed=1&turbo=8&hold=1&mode=smooth');
        const s = await play(['boat', k, 'normal'], 200);
        res[k] = s;
        const nm = { beat: '박자', mash: '연타', idle: '가만히' }[k];
        rows.push(['배 ' + nm + ' 봇', s.arrived ? '닿음' : '못 닿음', s.arrived ? s.arriveT.toFixed(1) + '초' : '-', '젓기 ' + s.strokes + ' · 박자 ' + s.perfect + ' · 엇박 ' + s.offbeat + ' · 엉킴 ' + s.tangles + ' · 물결 ' + s.waves + ' · 남은 ' + (233 - s.s).toFixed(0) + 'm']);
      }
      ok(res.beat.arrived && res.beat.arriveT < 75, '배 박자 봇 닿음 ' + res.beat.arriveT + '초');
      ok(!res.mash.arrived || res.mash.arriveT > res.beat.arriveT * 2.5, '배 연타 봇 한참 늦음(' + (res.mash.arrived ? res.mash.arriveT + '초' : '200초 안에 못 닿음 · ' + res.mash.s.toFixed(0) + 'm') + ')');
      ok(!res.idle.arrived, '배 가만히 봇 못 닿음');
    }
    if (has('lift')) {
      console.log('\n[5장 첫 들림(liftOnly) · 바다 위 가짜 땅 + 호수]');
      for (const [k, want] of [['idle', 'splash'], ['left', 'bump']]) {
        await open('?scene=fly&lift=1&diff=normal&seed=1&turbo=8&hold=1');
        const s = await play(['fly', k], 12);
        ok(s.done && (want === 'splash' ? s.splashes === 1 : s.bumps >= 1 && s.splashes === 0) && s.doneT > 3 && s.doneT < 7, '첫 들림 ' + (k === 'idle' ? '가만히 = 호수에 첨벙' : '왼쪽 누른 채 = 땅에 쿵(돌벽 안에서 돎)') + ' — ' + s.doneT + '초 · 첨벙 ' + s.splashes + ' · 쿵 ' + s.bumps);
        rows.push(['첫 들림 ' + (k === 'idle' ? '가만히' : '왼쪽 누른 채'), s.done ? '끝(' + (s.splashes ? '첨벙' : '쿵') + ')' : '안 끝남', s.doneT.toFixed(1) + '초', '']);
      }
    }
    if (has('same')) {
      console.log('\n[같은 씨앗 + 같은 입력 = 같은 판]');
      const snap = async (q, bot) => { await open(q); return ev(async ({ bot }) => { const m = await import('/dragon/js/bots/flight_bot.js?v=14'); const fn = bot[0] === 'boat' ? m.boatBot(bot[1]) : m.flyBot(bot[1]); return await new Promise((res) => { let n0 = -1; DRG.bot.run((n, B) => { if (n0 < 0) n0 = n; if (n - n0 >= 1500) { const s = DRG.state(); DRG.bot.stop(); res(s); return false; } return fn(n, B); }); }); }, { bot }); };
      for (const [q, bot] of [['?scene=fly&diff=normal&seed=2&turbo=8&hold=1', ['fly', 'normal']], ['?scene=fly&diff=easy&seed=3&turbo=8&hold=1', ['fly', 'easy']], ['?scene=fly&boat=1&seed=1&turbo=8&hold=1', ['boat', 'beat']]]) {
        const a = await snap(q, bot), c = await snap(q, bot);
        ok(JSON.stringify(a) === JSON.stringify(c), '같은 판 ' + q.split('&').slice(0, 3).join('&') + ' → ' + JSON.stringify(a).slice(0, 140));
      }
    }
    if (has('perf')) {
      console.log('\n[⚡ 부드럽게 · CPU 4× · turbo 없이 · 보통 봇이 나는 동안 20초]');
      await open('?scene=fly&diff=normal&seed=1&mode=smooth&hold=1');
      await ev(async () => { const m = await import('/dragon/js/bots/flight_bot.js?v=14'); DRG.bot.run(m.flyBot('normal')); });
      await thr(4); await W8(3000);
      const r = await ev(() => new Promise((res) => {
        const iv = [], t0 = performance.now(); let last = 0, calls = 0, tris = 0, sim = 0;
        const f = (ts) => { const inf = DRG.gfx.renderer.info.render; if (last) iv.push(ts - last); last = ts; if (inf.calls > calls) calls = inf.calls; if (inf.triangles > tris) tris = inf.triangles; sim = Math.max(sim, DRG.loop.takeMax());
          if (performance.now() - t0 < 20000) requestAnimationFrame(f); else { iv.sort((a, b) => a - b); res({ p95: +iv[Math.floor(iv.length * 0.95)].toFixed(1), fps: +(iv.length / 20).toFixed(1), calls, tris, simMax: +sim.toFixed(2), simMs: +DRG.loop.simMs.toFixed(3), res: DRG.gfx.res, state: DRG.state() }); } };
        requestAnimationFrame(f);
      }));
      console.log('   ' + JSON.stringify(r));
      ok(r.p95 <= 33, '⚡ 비행 중 p95 ' + r.p95 + 'ms ≤ 33(CPU 4×)');
      ok(r.calls <= 150 && r.tris <= 350000, '그리기 ' + r.calls + ' ≤ 150(장소 몫 110 + 사람·드래곤·화면) · 삼각형 ' + Math.round(r.tris / 1000) + 'k ≤ 350k(장소 ≤ 250k)');
      ok(r.simMs < 1.0, '비행 한 걸음 평균 ' + r.simMs + 'ms < 1ms(CPU 4×) · 가장 긴 프레임의 걸음 합 ' + r.simMax + 'ms');
      rows.push(['⚡ 비행 중(CPU 4×)', 'p95 ' + r.p95 + 'ms', 'fps ' + r.fps, '그리기 ' + r.calls + ' · 삼각형 ' + Math.round(r.tris / 1000) + 'k · 걸음 ' + r.simMs + 'ms · 해상도 ' + r.res]);
      await thr(1);
      await open('?scene=fly&diff=normal&seed=1&mode=smooth&adapt=0&dpr=1'); await thr(4); await W8(2500);
      const line = await ev(() => DRG.bench(20)); console.log('   ' + line);
      const p95 = +(/p95 ([\d.]+)/.exec(line) || [])[1], calls = +(/calls (\d+)/.exec(line) || [])[1], tk = +(/tris (\d+)k/.exec(line) || [])[1];
      ok(p95 <= 33, '⚡ 장소 한 바퀴(고정 해상도) p95 ' + p95 + 'ms ≤ 33');
      ok(calls <= 110 && tk <= 250, '장소 그리기 ' + calls + ' ≤ 110 · 삼각형 ' + tk + 'k ≤ 250k');
      rows.push(['⚡ 장소 한 바퀴(고정 해상도)', 'p95 ' + p95 + 'ms', '', '그리기 ' + calls + ' · 삼각형 ' + tk + 'k']);
      await thr(1);
    }
    if (SHOTS) {
      console.log('\n[사진 · 가로 960]');
      await p.setViewportSize({ width: 960, height: 540 });
      const dir = path.join(root, 'docs/dragon/shots'); fs.mkdirSync(dir, { recursive: true });
      const shotAt = async (q, bot, cond, file, extra) => {
        await open(q);
        await ev(async ({ bot, cond }) => { const m = await import('/dragon/js/bots/flight_bot.js?v=14'); const fn = bot[0] === 'boat' ? m.boatBot(bot[1]) : m.flyBot(bot[1]); const C = new Function('s', 'return ' + cond); window.__shotOk = false;
          DRG.bot.run((n, B) => { const s = DRG.state(); if (C(s)) { window.__shotOk = true; DRG.loop.paused = true; DRG.bot.stop(); return false; } return fn(n, B); }); }, { bot, cond });
        await p.waitForFunction(() => window.__shotOk, null, { timeout: 120000 });
        await ev(() => { DRG.loop.paused = false; }); await W8(extra || 200); await ev(() => { DRG.loop.paused = true; });
        await W8(150);
        await p.screenshot({ path: path.join(dir, file), type: 'jpeg', quality: 84 }); console.log('   ' + file);
      };
      await shotAt('?scene=fly&diff=normal&seed=1&time=clear&hold=1', ['fly', 'normal'], 's.gates >= 2 && s.t > 1', 'f_pillars.jpg', 900);
      await shotAt('?scene=fly&diff=normal&seed=1&time=sunset&hold=1', ['fly', 'normal'], 's.gates >= 4', 'f_sunset.jpg', 700);
      await shotAt('?scene=fly&diff=normal&seed=1&time=clear&hold=1', ['fly', 'normal'], 's.t > 2', 'f_note.jpg', 100);
      await shotAt('?scene=fly&boat=1&diff=normal&seed=1&time=day&hold=1', ['boat', 'beat'], 's.t > 9', 'f_boat.jpg', 300);
      await open('?scene=place&p=sea&at=lunch&time=clear'); await W8(1500); await p.screenshot({ path: path.join(dir, 'f_lunch.jpg'), type: 'jpeg', quality: 84 }); console.log('   f_lunch.jpg');
      await p.setViewportSize({ width: 1366, height: 768 });
    }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); }
  await b.close(); srv.close();
  if (rows.length) { console.log('\n| 봇·시험 | 결과 | 시간 | 덤 |\n|---|---|---|---|'); for (const r of rows) console.log('| ' + r.join(' | ') + ' |'); }
  console.log('\n' + (fails.length ? '실패 ' + fails.length + ': ' + fails.join(' · ') : '모두 통과'));
  process.exit(fails.length ? 1 : 0);
});
