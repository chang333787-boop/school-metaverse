// 고정 걸음 루프 — 시뮬레이션 1/60초 걸음(그리기 박자와 따로) · 걸음 앞에 봇(beforeStep) · 그리기는 gfx.shouldDraw가 정함
// 0.25초 넘게 멈췄다 오면 따라잡지 않음(탭 숨김·로딩) · 한 프레임 최대 3걸음(20fps 아래면 놀이가 느려짐 — 걸음이 몰려 더 느려지는 것보다 나음)
export function createLoop({ gfx, input, step, draw, beforeStep }) {
  const DT = 1 / 60, TURBO = Math.max(1, Math.min(16, +(new URLSearchParams(location.search).get('turbo') || 1)));   // ?turbo=8 = 봇 판을 빨리(성능 판정엔 안 씀)
  const L = { n: 0, simMs: 0, simMax: 0, long50: 0, running: false, paused: false };
  let acc = 0, last = 0, maxT = 0;
  function frame(ts) {
    if (!L.running) return;
    requestAnimationFrame(frame);
    let el = last ? (ts - last) / 1000 : 0; last = ts;
    if (el > 0.25) el = 0.25;
    if (el * 1000 > 50 && L.n > 120) L.long50++;
    if (L.paused) return;
    acc += el * TURBO;
    const t0 = performance.now(); let k = 0; const cap = 3 * TURBO;
    while (acc >= DT && k < cap) { if (beforeStep) beforeStep(L.n); step(DT, L.n); input.endStep(); L.n++; acc -= DT; k++; }
    if (k === cap) acc = 0;
    const ms = performance.now() - t0; L.simMs = L.simMs * 0.95 + ms * 0.05; if (ms > maxT) maxT = ms;
    if (gfx.shouldDraw(ts)) { draw(acc / DT); gfx.drew(ts); }
  }
  L.start = () => { if (L.running) return; L.running = true; last = 0; requestAnimationFrame(frame); };
  L.stop = () => { L.running = false; };
  L.takeMax = () => { const m = maxT; maxT = 0; return m; };
  L.DT = DT; L.turbo = TURBO;
  return L;
}
