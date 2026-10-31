// 디버그 API window.DRG — perf · diag · bot(입력만 넣는 봇) · bench(?bench=1 · 정해진 카메라 길 60초 → 한 줄 결과)
// 봇 규칙(goal §6): 상태를 직접 쓰지 않는다 — input.virtual(키 누르기·떼기)과 lookAdd(끌기)만
export function installDebug(ctx) {               // ctx = { gfx, loop, input, canvas, benchPath(t초) → 카메라 옮김 }
  const errs = [], D = { ctxLost: 0, t0: Date.now() };
  const pushErr = (m) => { if (errs.length < 50) errs.push(String(m).slice(0, 240)); };
  addEventListener('error', (e) => pushErr(e.message + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : '')));
  addEventListener('unhandledrejection', (e) => pushErr('promise: ' + ((e.reason && e.reason.message) || e.reason)));
  const cerr = console.error.bind(console);         // three 셰이더 오류는 console.error로만 나옴 → 진단에도 남김
  console.error = (...a) => { const m = String(a[0]); if (/THREE\.|Shader|WebGL/.test(m)) pushErr(m.split('\n').filter(l => /ERROR|Error/.test(l)).slice(0, 2).join(' / ') || m.slice(0, 200)); cerr(...a); };
  ctx.canvas.addEventListener('webglcontextlost', () => { D.ctxLost++; pushErr('webgl context lost'); });

  /* 봇: 걸음 번호에 맞춰 누르고 뗌 — loop의 beforeStep에서 tick */
  const q = [];                                     // [걸음, code, on]
  let script = null, now = 0;
  const bot = {
    tick(n) {
      now = n;
      let w = 0;                                      // 넣은 차례대로 적용(같은 걸음의 누름 → 뗌 순서를 지킴)
      for (let i = 0; i < q.length; i++) { if (q[i][0] <= n) ctx.input.virtual(q[i][1], q[i][2]); else q[w++] = q[i]; }
      q.length = w;
      if (script) { try { if (script(n, bot) === false) script = null; } catch (e) { pushErr('bot: ' + e.message); script = null; } }
    },
    hold(code, steps = 1, after = 0) { q.push([now + after, code, true], [now + after + Math.max(1, steps), code, false]); },
    press(code) { ctx.input.virtual(code, true); }, release(code) { ctx.input.virtual(code, false); },
    drag(dx, dy) { ctx.input.lookAdd(dx, dy); },
    run(fn) { script = fn; }, stop() { script = null; q.length = 0; ctx.input.clear(); },
    get busy() { return !!script || q.length > 0; },
  };

  /* bench: 그리는 동안 최댓값을 모음 */
  let B = null;
  function afterDraw() {
    if (!B) return;
    const r = ctx.gfx.renderer.info.render;
    const now = performance.now(); if (B.last) B.ivs.push(now - B.last); B.last = now; B.fr++;
    if (r.calls > B.calls) B.calls = r.calls; if (r.triangles > B.tris) B.tris = r.triangles;
    if (ctx.gfx.res < B.resMin) B.resMin = ctx.gfx.res;
  }
  function bench(sec = 60) {
    if (!ctx.benchPath) return Promise.resolve('bench: 이 장면엔 카메라 길이 없음');
    return new Promise((res) => {
      const L = ctx.loop, long0 = L.long50, e0 = errs.length;
      B = { calls: 0, tris: 0, resMin: 1, t0: performance.now(), fr: 0, ivs: [], last: 0 };
      ctx.gfx.resetStats();
      const f = (ts) => {
        const t = (performance.now() - B.t0) / 1000;
        ctx.benchPath(t);
        if (t < sec) { requestAnimationFrame(f); return; }
        const s = B.ivs.slice().sort((a, b) => a - b), p95 = s[Math.floor(s.length * 0.95)] || 0, st = ctx.gfx.stats();
        const line = ['DRG-BENCH v1', 'CB ' + (st.cb ? 1 : 0), innerWidth + 'x' + innerHeight + '@' + (devicePixelRatio || 1), 'mode ' + st.mode,
          'fps ' + (B.fr / sec).toFixed(1) + (st.mode === 'gfx' ? '(30고정)' : '') + (ctx.gfx.adapt ? '' : ' 고정해상도'), 'p95 ' + p95.toFixed(1) + 'ms', 'long ' + (L.long50 - long0), 'calls ' + B.calls, 'tris ' + Math.round(B.tris / 1000) + 'k',
          'prog ' + st.programs, 'tex ' + st.textures, 'res ' + B.resMin, 'heap ' + (st.heapMB == null ? '-' : st.heapMB), 'err ' + (errs.length - e0)].join(' | ');
        B = null; show(line); res(line);
      };
      requestAnimationFrame(f);
    });
  }
  function show(line) {                             // 선생님이 실제 크롬북에서 복사해 보내는 한 줄
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:90;background:#f4ead2;color:#2b2118;border:2px solid #2b2118;border-radius:10px;padding:10px 12px;font:14px/1.5 monospace;word-break:break-all';
    box.textContent = line;
    const b = document.createElement('button');
    b.textContent = '복사'; b.style.cssText = 'margin-left:10px;font:inherit;padding:2px 10px';
    b.onclick = () => { try { navigator.clipboard.writeText(line); b.textContent = '복사됨'; } catch (e) { b.textContent = '길게 눌러 복사'; } };
    box.appendChild(b); document.body.appendChild(box);
  }

  const DRG = {
    perf: () => Object.assign(ctx.gfx.stats(), { simMs: Math.round(ctx.loop.simMs * 100) / 100, simMax: Math.round(ctx.loop.takeMax() * 100) / 100, long50: ctx.loop.long50, simStep: ctx.loop.n }),
    diag: () => ({ errs: errs.slice(), ctxLost: D.ctxLost, upSec: Math.round((Date.now() - D.t0) / 1000), ua: navigator.userAgent, heapMB: ctx.gfx.stats().heapMB }),
    state: () => (ctx.snapshot ? ctx.snapshot() : null),   // 읽기만(봇 판정·같은 판 되풀이 확인)
    bot, bench, gfx: ctx.gfx, input: ctx.input,
    get loop() { return ctx.loop; },
    scene: ctx.scene, camera: ctx.camera, world: ctx.world,           // 들여다보기 전용(봇은 쓰지 않음)                // 루프는 debug 다음에 생김
  };
  window.DRG = DRG;
  return { bot, afterDraw, DRG };
}
