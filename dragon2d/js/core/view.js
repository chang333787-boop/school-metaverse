// 화면 · 카메라 · 박자 — Canvas 2D · 고정 걸음 1/60초 · 화면 모드 둘(🎨 30 고정 / ⚡ 60) · 자동 해상도 0.6~1.0 · 성능 수치
// 카메라: 멀미 없게 — 회전·흔들기·확대 출렁 없음 · 임계 감쇠(넘치지 않음) · 가는 쪽을 조금 더 보여 줌 · 장소 끝에서 멈춤
// 끄기·고정: ?dpr=0.75 · ?adapt=0 · ?mode=gfx|smooth · ?turbo=N(봇 시험: 그리는 프레임마다 N걸음)
import { loadSet, saveSet } from './set.js?v=1';

export const IS_CB = /CrOS/.test(navigator.userAgent);
const Q = new URLSearchParams(location.search);
export const VIEW_H = 11;                                  // 화면 높이 = 11m(1366×768에서 1m ≈ 70px) · 탑뷰(위에서 비스듬히)
const RING = 240;

export function createView(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const set = loadSet();
  const fixed = Q.has('dpr') ? Math.max(0.3, +Q.get('dpr') || 1) : 0;
  const V = {
    canvas, ctx, W: 0, H: 0, S: 1, res: 1, base: Math.min(devicePixelRatio || 1, IS_CB ? 1 : 1.25),
    mode: Q.get('mode') || set.mode || 'smooth', adapt: !fixed && Q.get('adapt') !== '0',
    cam: { x: 0, y: 0, zoom: 1 },
    stat: { draws: 0, items: 0 },
  };
  function size() {
    const r = fixed || V.base * V.res;
    const w = Math.round(innerWidth * r), h = Math.round(innerHeight * r);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    V.W = w; V.H = h; V.S = h / (VIEW_H / V.cam.zoom); V.css = innerHeight / h;
  }
  addEventListener('resize', size); size();
  V.size = size;
  V.setMode = (m) => { V.mode = m === 'gfx' ? 'gfx' : 'smooth'; saveSet({ mode: V.mode }); };

  /* 월드(미터 · x 오른쪽 · y 아래 = 남쪽) → 화면 픽셀 */
  V.sx = (x) => (x - V.cam.x) * V.S + V.W * 0.5;
  V.sy = (y) => (y - V.cam.y) * V.S + V.H * 0.5;
  V.wx = (px) => (px - V.W * 0.5) / V.S + V.cam.x;
  V.wy = (py) => (py - V.H * 0.5) / V.S + V.cam.y;
  V.halfW = () => V.W * 0.5 / V.S;
  V.halfH = () => V.H * 0.5 / V.S;
  V.onScreen = (x, y = V.cam.y, pad = 3) => Math.abs(x - V.cam.x) < V.halfW() + pad && Math.abs(y - V.cam.y) < V.halfH() + pad + 3;
  /* 그리기 함수용 — 발 자리로 옮기고 1단위 = 1m · flip −1 = 왼쪽 */
  V.at = (x, y, flip = 1, k = 1) => { ctx.setTransform(V.S * flip * k, 0, 0, V.S * k, V.sx(x), V.sy(y)); };
  V.reset = () => ctx.setTransform(1, 0, 0, 1, 0, 0);

  /* 카메라 따라가기 — 가로: 앞쪽을 조금 더(보는 쪽 lead) · 임계 감쇠(ω) · 세로: 띠 안이면 그대로 */
  V.follow = (tx, ty, dt, o = {}) => {
    const c = V.cam, a = 1 - Math.exp(-(o.w || 5.5) * dt);
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) { c.x = tx; c.y = ty; }
    c.x += (tx - c.x) * a; c.y += (ty - c.y) * a;
    clamp(o.bounds);
  };
  function clamp(b) {
    if (!b) return; const c = V.cam, hw = V.halfW(), hh = V.halfH();
    c.x = b[2] - b[0] < hw * 2 ? (b[0] + b[2]) / 2 : Math.max(b[0] + hw, Math.min(b[2] - hw, c.x));
    c.y = b[3] - b[1] < hh * 2 ? (b[1] + b[3]) / 2 : Math.max(b[1] + hh, Math.min(b[3] - hh, c.y));
  }
  V.snap = (x, y, b) => { V.cam.x = x; V.cam.y = y; clamp(b); };
  V.setZoom = (z) => { V.cam.zoom = z; size(); };

  /* 성능 — 그린 프레임 간격 고리 · 자동 해상도(⚡ 모드에서 p95가 길면 내리고 짧으면 올림) */
  const iv = new Float32Array(RING); let ivN = 0, ivI = 0, last = 0, due = 0, evalT = 0, slow = 0, fast = 0;
  const work = new Float32Array(RING); let wI = 0, wN = 0;
  V.shouldDraw = (ts) => { if (V.mode !== 'gfx') return true; if (ts - due > 100) due = ts; return ts >= due - 3; };
  V.drew = (ts, workMs) => {
    if (V.mode === 'gfx') due += 33.333;
    if (last) { iv[ivI] = ts - last; ivI = (ivI + 1) % RING; ivN = Math.min(RING, ivN + 1); }
    last = ts; work[wI] = workMs; wI = (wI + 1) % RING; wN = Math.min(RING, wN + 1);
    if (!V.adapt || V.mode === 'gfx') return;
    evalT += iv[(ivI + RING - 1) % RING] || 16;
    if (evalT > 2000 && ivN > 60) {
      evalT = 0; const p = V.p95();
      if (p > 24) { slow++; fast = 0; } else if (p < 18) { fast++; slow = 0; } else { slow = fast = 0; }
      if (slow >= 2 && V.res > 0.6) { V.res = Math.max(0.6, V.res - 0.1); size(); slow = 0; }
      if (fast >= 4 && V.res < 1) { V.res = Math.min(1, V.res + 0.1); size(); fast = 0; }
    }
  };
  const pct = (arr, n, q) => { if (!n) return 0; const a = Array.from(arr.slice(0, n)).sort((x, y) => x - y); return a[Math.min(n - 1, Math.floor(n * q))]; };
  V.p95 = () => pct(iv, ivN, 0.95);
  V.perf = () => ({ fps: ivN ? Math.round(1000 / (Array.from(iv.slice(0, ivN)).reduce((s, v) => s + v, 0) / ivN)) : 0, p50: +pct(iv, ivN, 0.5).toFixed(1), p95: +V.p95().toFixed(1), max: +pct(iv, ivN, 1).toFixed(1), workP95: +pct(work, wN, 0.95).toFixed(2), res: V.res, W: V.W, H: V.H, mode: V.mode, items: V.stat.items });
  V.perfReset = () => { ivN = ivI = 0; wN = wI = 0; last = 0; };
  return V;
}

/* 고정 걸음 박자 — step(dt) 60Hz · draw() 그리는 프레임 · turbo = 프레임마다 N걸음(시험) */
export function startLoop(V, step, draw) {
  const DT = 1 / 60; let acc = 0, prev = 0;
  const turbo = Math.max(0, +(Q.get('turbo') || 0));
  const L = { n: 0, t: 0, paused: false, turbo };
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!prev) prev = ts;
    let el = (ts - prev) / 1000; prev = ts;
    if (el > 0.25) el = 0.25;                                // 탭 돌아옴 = 따라잡지 않음
    const t0 = performance.now();
    if (!L.paused) {
      if (turbo) { for (let i = 0; i < turbo; i++) { step(DT); L.n++; L.t += DT; } }
      else { acc += el; let k = 0; while (acc >= DT && k < 5) { step(DT); L.n++; L.t += DT; acc -= DT; k++; } if (k === 5) acc = 0; }
    }
    if (!V.shouldDraw(ts)) return;
    draw(acc / DT);
    V.drew(ts, performance.now() - t0);
  }
  requestAnimationFrame(frame);
  return L;
}
