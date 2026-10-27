// MODE-1 화면 모드 둘 시험: node tools/harness/gfxmode.cjs [repoDir=.] [--only=school,town,stress]
//   크롬북 흉내(CrOS UA = cb 판 · 1366×768 · 자동 해상도 켬 · GPU ANGLE) + CPU 4× 느리게(CDP setCPUThrottlingRate 4)
//   자리 = 학교 운동장 · 마을 시내(반짝시) · 마디탑 전망층 — 자리마다 카메라 한 바퀴 10초
//   🎨 그래픽 우선 = 그린 프레임 간격 33ms 안팎(fps 29~31) · ⚡ 부드럽게 = fps와 단계(50 위 유지인지)
//   고르기 창(?gmpick=1 · 3m 걸으면 뜸) → 고름 → 새로고침 뒤 기억 · 설정 창 줄로 바꾸기 → 새로고침 뒤 기억
//   stress = CPU 16×로 단계가 내려가는지 → 1×로 되돌려 다시 올라오는지(깜빡임 없이 차례대로) · 페이지 오류 0
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean), on = k => !ONLY.length || ONLY.includes(k);
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
srv.listen(0, async () => {
  const port = srv.address().port, base = 'http://127.0.0.1:' + port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [], R = {};
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
    const thr = rate => cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const perf = () => ev(() => SD2.perf());
    const taskSec = async () => { const m = await cdp.send('Performance.getMetrics'); return (m.metrics.find(q => q.name === 'TaskDuration') || {}).value || 0; };
    /* 재기: dur초 — 그린 프레임(SD2.gfx.fm.draws가 바뀐 rAF) 사이 간격 · 카메라 한 바퀴(spin) · 단계 변화 */
    const measure = async (dur, spin) => { const c0 = await taskSec();
      const r = await ev(async ([dur, spin]) => { const F = SD2.gfx.fm, M = SD2.map, me = M.player.get(), iv = [], steps = new Set([F.lv]); let d0 = F.draws, last = null, t0 = null, n = 0;
        await new Promise(res => { const f = ts => { if (t0 == null) t0 = ts; if (F.draws !== d0) { d0 = F.draws; n++; if (last != null) iv.push(ts - last); last = ts; } steps.add(F.lv);
          if (spin) { const a = (ts - t0) / (dur * 1000) * Math.PI * 2; M.player.lookAt([me.x + Math.sin(a) * 30, me.z + Math.cos(a) * 30]); }
          if (ts - t0 < dur * 1000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
        const s = iv.slice().sort((a, b) => a - b), q = k => s[Math.min(s.length - 1, Math.floor(s.length * k))];
        return { fps: +(n / dur).toFixed(1), ivMed: +q(0.5).toFixed(1), ivP5: +q(0.05).toFixed(1), ivP95: +q(0.95).toFixed(1), long50: iv.filter(d => d > 50).length, steps: [...steps], dpr: SD2.gfx.dpr, calls: SD2.renderer ? SD2.renderer.info.render.calls : null }; }, [dur, spin]);
      r.cpuPct = Math.round((await taskSec() - c0) / dur * 100); const pf = await perf(); r.mode = pf.mode; r.step = pf.step + ' ' + pf.stepName; r.dprLvl = pf.dprLvl; return r; };
    /* 화면에 올라온 settings.js와 같은 주소(캐시 번호 포함)로 불러야 같은 SET */
    const setGm = v => ev(v => import((performance.getEntriesByType('resource').find(e => /\/settings\.js/.test(e.name)) || { name: '/v2/js/settings.js' }).name).then(m => { m.setSet({ gm: v }); return m.SET.gm; }), v);

    if (on('school')) {
      console.log('\n[학교] 처음 고르기 창 → 기억');
      await p.goto(base + '/v2/?title=0&gmpick=1'); await p.waitForFunction(() => window.SD2 && SD2.map && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 }); await W8(2500);
      await ev(() => { localStorage.removeItem('sm-set'); }); await p.reload(); await p.waitForFunction(() => window.SD2 && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 }); await W8(2500);
      const p0 = await perf(); ok(p0.mode === 'smooth', '안 고른 기기 = 부드럽게(' + p0.mode + ' · 판 ' + p0.gfxMode + ')');
      ok(!(await ev(() => !!document.getElementById('gmPop'))), '걷기 전엔 고르기 창 없음');
      await ev(() => SD2.map.player.teleport('zone:운동장')); await W8(1200); await p.keyboard.down('KeyW'); await W8(2500); await p.keyboard.up('KeyW');
      let pop = false; for (let i = 0; i < 8 && !pop; i++) { await W8(700); pop = await ev(() => !!document.getElementById('gmPop')); }
      ok(pop, '몇 걸음 걸으면 고르기 창이 뜸');
      if (pop) { R.popTxt = await ev(() => document.getElementById('gmPop').innerText.replace(/\s+/g, ' ').slice(0, 160)); console.log('   창 글: ' + R.popTxt);
        await ev(() => document.querySelector('#gmPop button[data-gm="1"]').click()); await W8(400); }
      ok((await perf()).mode === 'graphics', '그래픽 우선 고름 → 바로 30fps 모드');
      await p.reload(); await p.waitForFunction(() => window.SD2 && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 }); await W8(2500);
      ok((await perf()).mode === 'graphics', '새로고침 뒤 기억(그래픽 우선)'); ok(!(await ev(() => !!document.getElementById('gmPop'))), '고른 뒤엔 창이 다시 안 뜸');
      await ev(() => SD2.map.player.teleport('zone:운동장')); await thr(4); await W8(4000);
      R.schoolQ = await measure(10, true); console.log('   운동장 🎨 ' + JSON.stringify(R.schoolQ));
      ok(R.schoolQ.fps >= 29 && R.schoolQ.fps <= 31 && Math.abs(R.schoolQ.ivMed - 33.3) < 3, '운동장 그래픽 우선 fps ' + R.schoolQ.fps + ' · 간격 ' + R.schoolQ.ivMed + 'ms');
      /* 설정 창 줄로 바꾸기 */
      await thr(1); await ev(() => dispatchEvent(new CustomEvent('sm-set-open'))); await W8(600);
      const row = await ev(() => { const b9 = document.querySelector('#setPop button[data-st="gm"][data-v="2"]'); if (!b9) return null; b9.click(); return document.querySelector('#setPop .st-box').innerText.includes('화면 모드'); });
      ok(row === true, '설정 창에 「화면 모드」 줄 · 부드럽게 누름'); await W8(300); await ev(() => { const x = document.querySelector('#setPop [data-st="x"]'); if (x) x.click(); });
      ok((await perf()).mode === 'smooth', '설정에서 바꾸면 바로 부드럽게');
      await p.reload(); await p.waitForFunction(() => window.SD2 && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 }); await W8(2500);
      ok((await perf()).mode === 'smooth', '새로고침 뒤 기억(부드럽게)');
      await ev(() => SD2.map.player.teleport('zone:운동장')); await thr(4); await W8(4000);
      R.schoolS = await measure(10, true); console.log('   운동장 ⚡ ' + JSON.stringify(R.schoolS));
      ok(R.schoolS.fps >= 50, '운동장 부드럽게 fps ' + R.schoolS.fps + '(50 위) · 단계 ' + R.schoolS.step);
      await thr(1);
    }

    if (on('promo')) {
      console.log('\n[홍보판] 예전 그대로(모드 X · 고르기 창 X)');
      await p.goto(base + '/?gmpick=1'); await p.waitForFunction(() => window.SD2 && SD2.gfx && SD2.gfx.fm, null, { timeout: 120000 }); await W8(3000);
      const pf = await perf(); ok(pf.mode === 'fixed' && pf.step === 0, '홍보판 = 모드 끔(' + pf.mode + ') · 30fps 고정 없음');
      await ev(() => { const P = SD2.map.player.get(); SD2.map.player.teleport([P.x + 6, P.z]); }); await W8(4000);
      ok(!(await ev(() => !!document.getElementById('gmPop'))), '홍보판엔 고르기 창 없음');
      const q = await measure(4, false); ok(q.fps > 45, '홍보판 그리기 ' + q.fps + 'fps(30 고정 아님)');
    }
    if (on('town') || on('stress')) {
      console.log('\n[마을] 짓는 중…');
      await setGm(1).catch(() => null);
      await p.goto(base + '/v2/?town=ourtown&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && SM_TOWN.game && window.SD2, null, { timeout: 400000, polling: 500 }); await W8(3000);
      const closeAll = async () => { for (let i = 0; i < 8; i++) { if (await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn()))) { await p.keyboard.press('Escape'); await W8(250); continue; } if (!(await ev(() => !!document.querySelector('.twn-p')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(300); } };
      await closeAll(); await p.keyboard.press('Escape'); await W8(500);
      await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.min = 12 * 60; G.S.story = G.S.story || {}; G.S.story.done = Object.assign(G.S.story.done || {}, { p0: 1, a1_1: 1 }); G.S.story.p0auto = 1; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; if (G.S.emerg) { G.S.emerg.d = G.S.day; G.S.emerg.plan = []; } if (G.rwOff) G.rwOff(true); try { SM_TOWN.storyOff(); } catch (e) { void e; } SM_TOWN.rules.wx('clear'); });
      await W8(800); await closeAll();
      if (on('school')) ok((await perf()).mode === 'graphics', '마을도 같은 모드(학교에서 고른 그래픽 우선 기억)'); else await setGm(1);
      const free = (x, z) => ev(([x, z]) => { const bl = SD2.map.q.blocked || SD2.map.q.blockedAt, okp = (a, c) => { const g = SM_TOWN.ground(a, c); return !bl(a, c, g + 0.6) && !bl(a + 0.5, c, g + 0.6) && !bl(a, c + 0.5, g + 0.6) && !bl(a - 0.5, c, g + 0.6) && !bl(a, c - 0.5, g + 0.6); };
        for (let r = 0; r <= 60; r += 1.5) for (let k = 0; k < (r ? 16 : 1); k++) { const an = k * Math.PI / 8, px = x + Math.cos(an) * r, pz = z + Math.sin(an) * r; if (okp(px, pz)) return [px, pz]; } return [x, z]; }, [x, z]);
      const tp = (x, z, y) => ev(([x, z, y]) => { SD2.map.player.teleport([x, y != null ? y + 0.05 : SM_TOWN.ground(x, z) + 0.05, z]); }, [x, z, y]);
      const down = async () => { const a = await free(123, 785); await tp(a[0], a[1]); };
      const tower = async () => { const s = await ev(() => SM_TOWN.tower().info().site); await tp(s.x + 9, s.z + 3, s.Yd); await ev(() => SD2.map.player.lookAt([17, 50])); };
      if (on('town')) {
        await thr(4);
        for (const [k, nm, go] of [['down', '시내(반짝시)', down], ['tower', '마디탑 전망층', tower]]) {
          await setGm(1); await go(); await W8(5000); await closeAll(); const q = await measure(10, true); R[k + 'Q'] = q; console.log('   ' + nm + ' 🎨 ' + JSON.stringify(q));
          ok(q.fps >= 29 && q.fps <= 31 && Math.abs(q.ivMed - 33.3) < 3, nm + ' 그래픽 우선 fps ' + q.fps + ' · 간격 ' + q.ivMed + 'ms');
          await setGm(2); await go(); await W8(5000); await closeAll(); const s = await measure(10, true); R[k + 'S'] = s; console.log('   ' + nm + ' ⚡ ' + JSON.stringify(s));
          ok(s.fps >= 50, nm + ' 부드럽게 fps ' + s.fps + '(50 위) · 단계 ' + s.step);
        }
        await thr(1);
      }
      if (on('stress')) {
        console.log('\n[버거울 때] 마디탑 전망층 · CPU 16× 30초 → 1× 70초(부드럽게 단계 내림·되돌림)');
        await setGm(2); await tower(); await W8(3000); await closeAll(); const tl = [];
        const watch = async (sec, rate) => { await thr(rate); for (let i = 0; i < sec; i++) { await W8(1000); const pf = await perf(); tl.push([rate, pf.fps, pf.step, pf.dprLvl]); } };
        await watch(30, 16); await watch(70, 1);
        R.stress = { tl: tl.map(q => q.join('/')).join(' '), log: (await ev(() => SD2.gfx.fm.log.slice())) };
        console.log('   (배율/fps/단계/해상도 칸) ' + R.stress.tl); console.log('   단계 기록 ' + JSON.stringify(R.stress.log));
        const mx = Math.max(...tl.map(q => q[2])), endS = tl[tl.length - 1][2];
        const flips = R.stress.log.filter((q, i, a) => i && q[1] !== a[i - 1][1] && q[0] - a[i - 1][0] < 3).length;
        ok(mx >= 1 || tl.filter(q => q[0] === 16).every(q => q[1] >= 50), '버거우면 단계가 내려감(가장 낮은 단계 ' + mx + ')');
        ok(endS <= mx && (mx === 0 || endS < mx), '여유가 생기면 차례로 되돌림(끝 단계 ' + endS + ')');
        ok(flips === 0, '깜빡임 없음(3초 안에 오르내림 ' + flips + '번)');
        ok((await ev(() => SD2.gfx.fm.shOff ? 1 : 0)) === 0 || endS >= 3, '그림자 되돌림 맞음');
      }
    }
    ok(errs.length === 0, '페이지 오류 ' + errs.length + (errs.length ? ' ' + JSON.stringify(errs.slice(0, 4)) : ''));
  } catch (e) { console.log('실패 ' + e.stack); fails.push('예외'); }
  fs.writeFileSync(path.join(process.env.OUT || '/tmp', 'gfxmode_res.json'), JSON.stringify(R, null, 1));
  console.log('\n' + (fails.length ? '✗ ' + fails.length + '개 실패: ' + fails.join(' | ') : '✓ 모두 통과'));
  await b.close(); srv.close(); process.exit(fails.length ? 1 : 0);
});
