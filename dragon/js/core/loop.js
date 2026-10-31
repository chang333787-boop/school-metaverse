// 고정 걸음 루프 — 시뮬레이션 1/60초 걸음(그리기 박자와 따로) · 걸음 앞에 봇(beforeStep) · 그리기는 gfx.shouldDraw가 정함
// 0.25초 넘게 멈췄다 오면 따라잡지 않음(탭 숨김·로딩) · 한 프레임 최대 5걸음
export function createLoop({ gfx, input, step, draw, beforeStep }) {
  const DT = 1 / 60;
  const L = { n: 0, simMs: 0, simMax: 0, long50: 0, running: false, paused: false };
  let acc = 0, last = 0, maxT = 0;
  function frame(ts) {
    if (!L.running) return;
    requestAnimationFrame(frame);
    let el = last ? (ts - last) / 1000 : 0; last = ts;
    if (el > 0.25) el = 0.25;
    if (el * 1000 > 50 && L.n > 120) L.long50++;
    if (L.paused) return;
    acc += el;
    const t0 = performance.now(); let k = 0;
    while (acc >= DT && k < 5) { if (beforeStep) beforeStep(L.n); step(DT, L.n); input.endStep(); L.n++; acc -= DT; k++; }
    if (k === 5) acc = 0;
    const ms = performance.now() - t0; L.simMs = L.simMs * 0.95 + ms * 0.05; if (ms > maxT) maxT = ms;
    if (gfx.shouldDraw(ts)) { draw(acc / DT); gfx.drew(ts); }
  }
  L.start = () => { if (L.running) return; L.running = true; last = 0; requestAnimationFrame(frame); };
  L.stop = () => { L.running = false; };
  L.takeMax = () => { const m = maxT; maxT = 0; return m; };
  L.DT = DT;
  return L;
}
