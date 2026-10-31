// 값 노이즈 2D + fbm — 씨앗으로 같은 땅(지형·돌기둥·구름 자리) · 매 프레임 쓰지 않음(짓기 때만)
export function createNoise(seed = 7) {
  const P = new Uint8Array(512);
  let s = seed >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 256; i++) P[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = P[i]; P[i] = P[j]; P[j] = t; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const h = (x, y) => P[(P[x & 255] + y) & 511] / 255;
  const sm = (t) => t * t * (3 - 2 * t);
  function v2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }
  function fbm(x, y, oct = 4) { let f = 0, a = 0.5, n = 0; for (let i = 0; i < oct; i++) { f += v2(x, y) * a; n += a; x *= 2.03; y *= 2.03; a *= 0.5; } return f / n; }
  return { v2, fbm };
}
