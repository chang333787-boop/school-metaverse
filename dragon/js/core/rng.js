// 씨앗 난수(mulberry32) — 시뮬레이션은 이것만 쓴다(Math.random X) · 같은 씨앗 + 같은 입력 = 같은 판
export function createRng(seed = 1) {
  let s = seed >>> 0;
  const R = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  R.range = (a, b) => a + (b - a) * R();
  R.int = (a, b) => a + Math.floor((b - a + 1) * R());
  R.pick = (arr) => arr[Math.floor(R() * arr.length)];
  R.seed = (v) => { s = v >>> 0; };
  R.state = () => s;
  return R;
}
