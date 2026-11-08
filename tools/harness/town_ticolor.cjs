// 🌼 나무·꽃 색 풀기 시험(DEB-1 · 브라우저 X · 노드만): node tools/harness/town_ticolor.cjs [ourtown 포트 — 안 씀 · gm.sh 목록 'ticolor'로도 돎]
//   PERF-E 나무 셰이더는 잎·꽃 색 16진수(24비트)를 나무 그림(Float32 텍셀)에 넣고 셰이더에서 uint로 다시 풂.
//   11-08 회귀: `uint(i1.w + 0.5)` — float32는 2^23 위에서 1 간격이라 홀수 + 0.5가 짝수로 반올림돼 0xffffff → 0x1000000(R·G·B 0 = 검은 꽃) · 0xa0c0ff → 0xa0c100(파랑 255 → 0).
//   ① town.js 셰이더 식을 그대로 읽어 같은 float32 셈으로 흉내 ② 계절 다섯(지금·여름·봄·가을·겨울)의 나무·소나무·열매·꽃 색표 + 겨울 떨기나무 눈 섞기 ③ 24비트 전부(0~0xffffff)
//   ④ 쓰는 쪽 = `seaHex(t, sp) & 0xffffff`(짓기·계절 둘) — 셰이더 식이나 쓰는 쪽이 바뀌면 이 시험도 같이 맞춤
const fs = require('fs'), path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '../../v2/games/town.js'), 'utf8');
const fails = []; const ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const f32 = Math.fround;
// ① 셰이더 식 읽기: uint h9 = uint(i1.w[ ± 상수]);
const M = SRC.match(/uint h9 = uint\(i1\.w(?:\s*([+-])\s*([0-9.]+))?\);/);
ok(!!M, '셰이더에 잎 색 풀기 식(uint h9 = uint(i1.w …))이 있음' + (M ? ' — ' + M[0] : ' — 식이 바뀌었으면 이 시험을 맞춰요'));
const ADD = M && M[1] ? (M[1] === '-' ? -1 : 1) * parseFloat(M[2]) : 0;
ok(/\(h9 >> 16u\) & 255u/.test(SRC) && /\(h9 >> 8u\) & 255u/.test(SRC) && /h9 & 255u/.test(SRC), '셰이더가 h9를 R(>>16)·G(>>8)·B(&255)로 나눔');
const nW = (SRC.match(/D\[q \+ 7\] = (?:seaHex|flHex)\(t, sp\) & 0xffffff/g) || []).length, fW = /function flHex\(t, sp\) \{ const h = seaHex\(t, sp\); if \(!t\.dry\) return h;/.test(SRC);   /* DEB-2 ⑯ flHex = seaHex + 이야기 마른 꽃(dry)일 때만 바랜 색 */
ok(nW === 2 && fW, '쓰는 쪽 = seaHex(t, sp)(마른 꽃만 flHex로 바램) & 0xffffff 두 곳(짓기·계절) — ' + nW + '곳');
ok(/new Float32Array\(2048 \* IH \* 4\)/.test(SRC) && /T3\.FloatType/.test(SRC), '나무 그림 = Float32(RGBA32F) — 정수 24비트가 그대로 들어감');
// GLSL: f = 텍셀(float32) → f + 상수(float32 덧셈 · 가장 가까운 짝수) → uint(잘라 버림)
const dec = h => { const f = f32(h), v = ADD ? f32(f + ADD) : f; const u = v < 0 ? 0 : Math.trunc(v) >>> 0; return [(u >>> 16) & 255, (u >>> 8) & 255, u & 255]; };
const same = h => { const d = dec(h); return d[0] === ((h >> 16) & 255) && d[1] === ((h >> 8) & 255) && d[2] === (h & 255); };
const hx = h => '0x' + (h >>> 0).toString(16).padStart(6, '0');
// ② 계절 색표(SEASON 그대로 읽음)
const i0 = SRC.indexOf('const SEASON = {'), i1 = SRC.indexOf('\n};', i0);
let SEASON = null; try { SEASON = eval('(' + SRC.slice(i0 + 15, i1 + 2).replace(/\/\/[^\n]*/g, '') + ')'); } catch (e) { /* 아래에서 실패 */ }
ok(!!(SEASON && SEASON.summer && SEASON.winter), '계절 색표(SEASON)를 읽음' + (SEASON ? ' — ' + Object.keys(SEASON).join('·') : ''));
if (SEASON) {
  const snow = h => { const a = (h >> 16) & 255, b = (h >> 8) & 255, c = h & 255; return (Math.round(a + (232 - a) * 0.62) << 16) | (Math.round(b + (238 - b) * 0.62) << 8) | Math.round(c + (242 - c) * 0.62); };   /* seaHex 겨울 떨기나무와 같은 식 */
  const SEAS = [['지금', SEASON.summer], ['여름', SEASON.summer], ['봄', SEASON.spring], ['가을', SEASON.autumn], ['겨울', SEASON.winter]];
  for (const [nm, P] of SEAS) { const L = [].concat(P.tree || [], P.pine || [], P.fruit != null ? [P.fruit] : [], P.flower || []); if (P === SEASON.winter) for (const h of SEASON.summer.tree.concat(SEASON.summer.pine, [0x4e9a43])) L.push(snow(h));
    const bad = L.filter(h => !same(h)); ok(L.length > 0 && !bad.length, nm + ' 색 ' + L.length + '개 = 풀어도 같은 색' + (bad.length ? ' — 다름 ' + bad.map(h => hx(h) + '→' + dec(h).map(v => v.toString(16).padStart(2, '0')).join('')).join(' ') : '')); }
  ok(same(0xffffff), '흰 꽃 0xffffff = 흰색(검정 X) — 풀면 ' + dec(0xffffff).join(','));
}
// ③ 24비트 전부
{ let n = 0, first = -1; for (let h = 0; h <= 0xffffff; h++) if (!same(h)) { n++; if (first < 0) first = h; } ok(!n, '24비트 색 16,777,216개 전부 같은 색으로 풀림' + (n ? ' — 다름 ' + n + '개(처음 ' + hx(first) + ')' : '')); }
console.log(fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 나무·꽃 색 풀기 그대로(DEB-1)');
process.exit(fails.length ? 1 : 0);
