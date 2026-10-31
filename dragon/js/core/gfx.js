// 그리기 바탕 — 렌더러 · 화면 모드 둘(🎨 'gfx' 30 고정 / ⚡ 'smooth' 60 목표) · 자동 해상도 0.6~1.0 · 내림 단계 · 성능 수치
// 끄기: ?dpr=0.75(고정) · ?adapt=0 · ?aa=1(크롬북에서도 MSAA) · ?mode=gfx|smooth
import * as THREE from 'three';

export const IS_CB = /CrOS/.test(navigator.userAgent);
const Q = new URLSearchParams(location.search);
const LS = 'drg-set';
export function loadSet() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
export function saveSet(o) { try { localStorage.setItem(LS, JSON.stringify(Object.assign(loadSet(), o))); } catch (e) { /* 저장 못 하는 창 = 그대로 */ } }

const RING = 300;                                   // 그린 프레임 간격 고리(60fps면 5초)
export function createGfx(canvas) {
  const set = loadSet();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: IS_CB ? Q.get('aa') === '1' : Q.get('aa') !== '0', powerPreference: 'high-performance', stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const fixed = Q.has('dpr') ? Math.max(0.25, +Q.get('dpr') || 1) : 0;
  const G = {
    renderer, base: Math.min(devicePixelRatio || 1, IS_CB ? 1 : 1.5), res: 1, floor: 0.6,
    mode: Q.get('mode') || set.mode || 'smooth', adapt: !fixed && Q.get('adapt') !== '0',
    steps: [], lv: 0, draws: 0, log: [],
  };
  const iv = new Float32Array(RING); let ivN = 0, ivI = 0, lastDraw = 0, due = 0;
  let evalT = 0, slowS = 0, fastS = 0, coolT = 0, capT = 0, trial = null, fail = 0;

  function applySize() { renderer.setPixelRatio(fixed || G.base * G.res); renderer.setSize(innerWidth, innerHeight, false); }
  addEventListener('resize', () => { applySize(); G.onResize && G.onResize(innerWidth, innerHeight); });
  applySize();

  /* 내림 단계: 게임이 이름과 켜고 끄는 함수를 건다(안개 거리 · 디테일 거리 · 그림자 순) — 해상도가 바닥일 때만 차례로 */
  G.addStep = (name, fn) => { G.steps.push({ name, fn }); };
  G.setMode = (m) => { G.mode = m === 'gfx' ? 'gfx' : 'smooth'; saveSet({ mode: G.mode }); slowS = fastS = 0; coolT = 0; };

  /* 🎨 모드 = rAF는 돌되 33.3ms마다 한 번만 그림(144Hz여도 평균 30) */
  G.shouldDraw = (ts) => {
    if (G.mode !== 'gfx') return true;
    if (ts - due > 100) due = ts;                   // 탭 돌아옴·긴 멈춤 = 박자 새로
    return ts >= due - 3;
  };
  G.drew = (ts) => {
    if (G.mode === 'gfx') due += 33.333;
    if (lastDraw) { const d = ts - lastDraw; if (d < 250) { iv[ivI] = d; ivI = (ivI + 1) % RING; if (ivN < RING) ivN++; } }
    lastDraw = ts; G.draws++;
    if (G.adapt && ts - evalT >= 1000) { evalT = ts; adaptTick(ts); }
  };

  /* 최근 n개 간격의 '느린 쪽 8%를 뺀 평균' — 셰이더 짓기 몇 번은 무시 */
  const tmp = new Float32Array(RING);
  function trimmed(n) {
    n = Math.min(n, ivN); if (n < 10) return 0;
    for (let k = 0; k < n; k++) tmp[k] = iv[(ivI - 1 - k + RING) % RING];
    const a = tmp.subarray(0, n).sort(); const m = Math.floor(n * 0.92); let s = 0;
    for (let k = 0; k < m; k++) s += a[k];
    return s / m;
  }
  function pct(n, q) {
    n = Math.min(n, ivN); if (!n) return 0;
    for (let k = 0; k < n; k++) tmp[k] = iv[(ivI - 1 - k + RING) % RING];
    const a = tmp.subarray(0, n).sort(); return a[Math.min(n - 1, Math.floor(n * q))];
  }

  function change(kind, dir, ts) {                  // kind 'res' | 'step' · dir -1 내림 / +1 올림
    if (kind === 'res') { G.res = Math.round(Math.min(1, Math.max(G.floor, G.res + dir * 0.1)) * 100) / 100; applySize(); }
    else if (dir < 0) { const s = G.steps[G.lv]; s.fn(true); G.lv++; }
    else { G.lv--; G.steps[G.lv].fn(false); }
    G.log.push([Math.round(ts / 1000), kind, dir, G.res, G.lv]); if (G.log.length > 40) G.log.shift();
    coolT = ts + 3000; slowS = fastS = 0;
  }
  function adaptTick(ts) {
    const target = G.mode === 'gfx' ? 33.333 : 16.667, n = G.mode === 'gfx' ? 60 : 120;
    const ft = trimmed(n); if (!ft) return;
    if (trial && ts >= coolT) {                     // 내렸는데 안 빨라졌으면(브라우저 30 잠금·에너지 절약) 되돌리고 2분 쉼
      if (ft > trial.ft / 1.04 - 0.3) { const t = trial; trial = null; change(t.kind, +1, ts); capT = ts + 120000; fail++; }
      else trial = null;
      return;
    }
    if (ts < coolT) return;
    const slow = ft > target * 1.11, fast = ft < target * 1.05;
    slowS = slow ? slowS + 1 : 0; fastS = fast ? fastS + 1 : 0;
    if (slowS >= (G.mode === 'gfx' ? 1 : 2)) {
      if (G.res > G.floor + 0.001) { trial = { kind: 'res', ft }; change('res', -1, ts); }
      else if (G.lv < G.steps.length && ts >= capT) { trial = { kind: 'step', ft }; change('step', -1, ts); }
    } else if (fastS >= 6 * (1 << Math.min(fail, 4)) && ts >= capT) {
      if (G.lv > 0) change('step', +1, ts); else if (G.res < 1) change('res', +1, ts);
    }
  }
  G.ft = () => trimmed(G.mode === 'gfx' ? 60 : 120);

  /* 성능 수치 — DRG.perf()가 부름 */
  G.stats = () => {
    const inf = renderer.info, mem = performance.memory;
    const n1 = Math.min(ivN, G.mode === 'gfx' ? 30 : 60); let s = 0;
    for (let k = 0; k < n1; k++) s += iv[(ivI - 1 - k + RING) % RING];
    return {
      fps: n1 ? Math.round(1000 / (s / n1) * 10) / 10 : 0, p95: Math.round(pct(RING, 0.95) * 10) / 10, ft: Math.round(G.ft() * 10) / 10,
      mode: G.mode, res: G.res, dpr: renderer.getPixelRatio(), step: G.lv, stepName: G.lv ? G.steps[G.lv - 1].name : '', aa: renderer.getContext().getContextAttributes().antialias,
      calls: inf.render.calls, tris: inf.render.triangles, programs: inf.programs ? inf.programs.length : 0, textures: inf.memory.textures, geometries: inf.memory.geometries,
      heapMB: mem ? Math.round(mem.usedJSHeapSize / 1048576) : null, cb: IS_CB, log: G.log.slice(-8),
    };
  };
  G.resetStats = () => { ivN = 0; ivI = 0; lastDraw = 0; };
  return G;
}
