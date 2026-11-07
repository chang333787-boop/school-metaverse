// 🎓 학원 문제 은행(ACAD-1 · 교사 11-07 '학원에서 공부 요소만 더 추가하고 이번 주는 마무리' · 설계 docs/systems/town_acad.md)
//   순수 함수만(브라우저·three·DOM 없음) — 노드 시험 tools/harness/acad_bank.mjs가 과목 × 단계마다 1,000판을 만들어 정답·보기·자리·수준을 검산
//   문제 = 틀(template) + 씨앗 → 숫자·보기·차례가 판마다 달라짐 · 수학 정답은 계산(분수 = 정수 셈 · 소수 = 100배 정수 셈 · 큰 수 = 자리값)
//   사실 문제는 교과서에서 흔히 배우는 것만 손으로 씀 · 실제 학생 이름 X(대화 = A·B) · 판타지 X
//   글 꾸밈: ⟦3/8⟧ = 분수 · ⟦1 3/8⟧ = 대분수(창이 세로 분수로 그림) · 그림(pic)은 이 파일이 만든 SVG 글(숫자·정해진 글자만 — 바깥 글 X)
//   문제 꼴: kind 'pick'(보기 고르기 · ch[0]이 정답 → lesson()이 섞고 ans) · 'order'(items 차례대로 누르기) · 'seq'(keys 단추로 차례 채우기 · ans = 열쇠 차례)
export const BANK_V = 1;

// ───────── 작은 도구 ─────────
export const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export function rngOf(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pk = (r, L) => L[Math.floor(r() * L.length)];
function shuf(r, L) { const a = L.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lvc = L => Math.max(1, Math.min(5, L | 0));
const hasBat = w => { let s = String(w).trim(); const fm = s.match(/(\d+)\/\d+⟧$/); if (fm) s = fm[1]; s = s.replace(/[\s"'”’).,!?⟧]+$/, ''); if (!s || /(°|°C|[a-zA-Z])$/.test(s)) return false; const c = s.charCodeAt(s.length - 1); if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 !== 0; if (c >= 48 && c <= 57) return '013678'.includes(String.fromCharCode(c)); return false; };
export const jo = (w, a, b) => String(w) + (hasBat(w) ? a : b);
const pmk = (o) => Object.assign({ kind: 'pick', h: ['', ''], why: '', learn: '' }, o);

// 큰 수: 네 자리씩 띄움(오른쪽부터 일 · 만 · 억 · 조 — 교과서 '네 자리씩 끊어 읽기')
export const g4 = n => { const s = String(Math.round(n)); let o = ''; for (let i = 0; i < s.length; i++) { const k = s.length - i; o += s[i]; if (k > 1 && (k - 1) % 4 === 0) o += ' '; } return o; };
const PLACE = ['일', '십', '백', '천', '만', '십만', '백만', '천만', '억', '십억', '백억', '천억', '조', '십조'];
const PLACE_V = p => (p < 4 ? ['1', '10', '100', '1000'][p] : (['', '10', '100', '1000'][p % 4] || '1') + ['', '만', '억', '조'][Math.floor(p / 4)]);
// 분수 꾸밈
export const FR = (w, a, b) => '⟦' + (w ? w + ' ' : '') + a + '/' + b + '⟧';
const frV = (w, a, b) => [w * b + a, b];   /* 대분수 → [분자, 분모](가분수) */
const frEq = (p, q) => p[0] * q[1] === q[0] * p[1];
// 소수(100배 정수 → 글)
export const dS = h => { const neg = h < 0; h = Math.abs(h); const i = Math.floor(h / 100), f = h % 100; const s = f === 0 ? String(i) : f % 10 === 0 ? i + '.' + (f / 10) : i + '.' + String(f).padStart(2, '0'); return (neg ? '-' : '') + s; };
const DIGK = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

// 보기 넷 만들기: 정답 + 후보(같은 값·같은 글 걸러 냄) → 모자라면 null(다시 뽑음)
function opts(right, cands, eq, n = 4) { const out = [right]; for (const c of cands) { if (c == null) continue; if (out.some(o => eq(o, c))) continue; out.push(c); if (out.length >= n) break; } return out.length >= Math.min(n, 3) ? out : null; }
const tryGen = (f, r, L, k = 30) => { for (let i = 0; i < k; i++) { const p = f(r, L); if (p) return p; } return null; };

// ───────── SVG 그림(이 파일이 만든 숫자·정해진 글만) ─────────
const INK = '#2b2420', PAP = '#fffdf7', GRID = '#e6d6b8', ACC = '#3b6fb6';
const svgW = (w, h, body) => '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
const tx = (x, y, t, o = '') => '<text x="' + x + '" y="' + y + '" font-size="15" font-weight="700" fill="' + INK + '" ' + o + '>' + t + '</text>';
function svgAngle(deg) { const x0 = 70, y0 = 160, R = 150, a = deg * Math.PI / 180, x2 = x0 + Math.cos(a) * R, y2 = y0 - Math.sin(a) * R, ar = 34, ax = x0 + Math.cos(a) * ar, ay = y0 - Math.sin(a) * ar;
  const arc = deg === 90 ? '<path d="M' + (x0 + 22) + ' ' + y0 + ' L' + (x0 + 22) + ' ' + (y0 - 22) + ' L' + x0 + ' ' + (y0 - 22) + '" fill="none" stroke="' + ACC + '" stroke-width="3"/>' : '<path d="M' + (x0 + ar) + ' ' + y0 + ' A' + ar + ' ' + ar + ' 0 ' + (deg > 180 ? 1 : 0) + ' 0 ' + ax.toFixed(1) + ' ' + ay.toFixed(1) + '" fill="none" stroke="' + ACC + '" stroke-width="3"/>';
  const la = a / 2, lx = x0 + Math.cos(la) * 58, ly = y0 - Math.sin(la) * 58 + 6;
  return svgW(300, 190, '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + (x0 + R) + '" y2="' + y0 + '" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/><line x1="' + x0 + '" y1="' + y0 + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' + arc + '<circle cx="' + x0 + '" cy="' + y0 + '" r="4" fill="' + INK + '"/>' + tx(Math.max(8, lx - 12).toFixed(0), ly.toFixed(0), deg + '°', 'font-size="17"')); }
function svgTri(s) { const [a, b, c] = s, k = 18, x = (a * a + c * c - b * b) / (2 * a), y = Math.sqrt(Math.max(1, c * c - x * x)), P = [[0, 0], [a * k, 0], [x * k, -y * k]];
  const mnX = Math.min(...P.map(p => p[0])), mxX = Math.max(...P.map(p => p[0])), mnY = Math.min(...P.map(p => p[1])), mxY = Math.max(...P.map(p => p[1])), Q = P.map(p => [p[0] - mnX + 60, p[1] - mnY + 34]), G = [(Q[0][0] + Q[1][0] + Q[2][0]) / 3, (Q[0][1] + Q[1][1] + Q[2][1]) / 3];
  const lab = (i, j, t) => { const m = [(Q[i][0] + Q[j][0]) / 2, (Q[i][1] + Q[j][1]) / 2], dx = m[0] - G[0], dy = m[1] - G[1], dl = Math.hypot(dx, dy) || 1; return tx((m[0] + dx / dl * 22).toFixed(0), (m[1] + dy / dl * 22 + 5).toFixed(0), t + ' cm', 'text-anchor="middle"'); };
  return svgW(Math.round(mxX - mnX + 120), Math.round(mxY - mnY + 70), '<polygon points="' + Q.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="#fff4d6" stroke="' + INK + '" stroke-width="3"/>' + lab(0, 1, a) + lab(1, 2, b) + lab(2, 0, c)); }
const QUADS = {
  trap: { nm: '사다리꼴', isa: ['사다리꼴'], pts: r => { const w = ri(r, 0, 20); return [[30, 160], [250, 160], [190 + w, 60], [90 + w / 2, 60]]; }, par: [[0, 2]], eq: [], rt: [] },
  para: { nm: '평행사변형', isa: ['사다리꼴', '평행사변형'], pts: r => { const s = ri(r, 30, 50); return [[30, 160], [200, 160], [200 + s, 60], [30 + s, 60]]; }, par: [[0, 2], [1, 3]], eq: [], rt: [] },
  rhom: { nm: '마름모', isa: ['사다리꼴', '평행사변형', '마름모'], pts: r => { const h = ri(r, 56, 70); return [[140, 110 - h], [235, 110], [140, 110 + h], [45, 110]]; }, par: [], eq: [0, 1, 2, 3], rt: [] },
  rect: { nm: '직사각형', isa: ['사다리꼴', '평행사변형', '직사각형'], pts: r => { const w = ri(r, 170, 210), h = ri(r, 70, 90); return [[30, 50], [30 + w, 50], [30 + w, 50 + h], [30, 50 + h]]; }, par: [], eq: [], rt: [0, 1, 2, 3] },
};
export const QUAD_NAMES = ['사다리꼴', '평행사변형', '마름모', '직사각형', '정사각형'];
function svgQuad(q, r) { const P = q.pts(r), seg = i => [P[i], P[(i + 1) % 4]]; let marks = '';
  q.par.forEach((pr, k) => pr.forEach(i => { const [a, b] = seg(i), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]); for (let j = 0; j <= k; j++) { const ox = mx + Math.cos(ang) * (j * 9 - k * 4.5), oy = my + Math.sin(ang) * (j * 9 - k * 4.5), p1 = [ox - Math.cos(ang - 0.6) * 9, oy - Math.sin(ang - 0.6) * 9], p2 = [ox - Math.cos(ang + 0.6) * 9, oy - Math.sin(ang + 0.6) * 9]; marks += '<polyline points="' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1) + ' ' + ox.toFixed(1) + ',' + oy.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1) + '" fill="none" stroke="' + ACC + '" stroke-width="3"/>'; } }));
  q.eq.forEach(i => { const [a, b] = seg(i), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2; marks += '<line x1="' + (mx - Math.cos(ang) * 8).toFixed(1) + '" y1="' + (my - Math.sin(ang) * 8).toFixed(1) + '" x2="' + (mx + Math.cos(ang) * 8).toFixed(1) + '" y2="' + (my + Math.sin(ang) * 8).toFixed(1) + '" stroke="' + ACC + '" stroke-width="3"/>'; });
  q.rt.forEach(i => { const c = P[i], a = P[(i + 1) % 4], b = P[(i + 3) % 4], u = [(a[0] - c[0]), (a[1] - c[1])], v = [(b[0] - c[0]), (b[1] - c[1])], lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]), k = 14, p1 = [c[0] + u[0] / lu * k, c[1] + u[1] / lu * k], p3 = [c[0] + v[0] / lv * k, c[1] + v[1] / lv * k], p2 = [p1[0] + v[0] / lv * k, p1[1] + v[1] / lv * k]; marks += '<polyline points="' + [p1, p2, p3].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="none" stroke="' + ACC + '" stroke-width="2.5"/>'; });
  return svgW(290, 190, '<polygon points="' + P.map(p => p[0] + ',' + p[1]).join(' ') + '" fill="#e6f0fb" stroke="' + INK + '" stroke-width="3"/>' + marks); }
function svgLine(xs, vs, unit, lo, hi) { const W = 400, H = 230, L = 52, R = 14, T = 16, B = 46, n = xs.length, gx = i => L + (W - L - R) * (i + 0.5) / n, gy = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo)); let g = '';
  for (let v = lo; v <= hi; v += 2) { g += '<line x1="' + L + '" y1="' + gy(v).toFixed(1) + '" x2="' + (W - R) + '" y2="' + gy(v).toFixed(1) + '" stroke="' + GRID + '" stroke-width="' + (v % 10 === 0 ? 2 : 1) + '"/>' + tx(8, (gy(v) + 5).toFixed(1), v, 'font-size="12"'); }
  xs.forEach((x, i) => { g += tx((gx(i) - 22).toFixed(1), H - 24, x, 'font-size="11"'); });
  g += '<polyline points="' + vs.map((v, i) => gx(i).toFixed(1) + ',' + gy(v).toFixed(1)).join(' ') + '" fill="none" stroke="#c8553d" stroke-width="3"/>' + vs.map((v, i) => '<circle cx="' + gx(i).toFixed(1) + '" cy="' + gy(v).toFixed(1) + '" r="5" fill="#c8553d" stroke="' + PAP + '" stroke-width="2"/>').join('');
  g += '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (H - B) + '" stroke="' + INK + '" stroke-width="2"/><line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '" stroke="' + INK + '" stroke-width="2"/>' + tx(4, H - 6, '(' + unit + ')', 'font-size="12"');
  return svgW(W, H, g); }

// ───────── 수학 ─────────
const M = {};
M.angle_kind = { lo: 1, hi: 1, gen(r) { const k = ri(r, 0, 2), deg = k === 1 ? 90 : k === 0 ? ri(r, 2, 17) * 5 : ri(r, 19, 34) * 5, nm = k === 0 ? '예각' : k === 1 ? '직각' : '둔각';
  return pmk({ key: 'ak' + deg, q: '그림의 각은 무슨 각일까요?', pic: svgAngle(deg), ch: [nm].concat(['예각', '직각', '둔각'].filter(x => x !== nm)).map(t => ({ t })), a: { deg },
    h: ['직각(90°)보다 작은지, 같은지, 큰지 견주어 봐요.', '직각보다 작으면 예각, 크면 둔각이에요.'], why: deg + '°는 직각 90°' + (k === 0 ? '보다 작아서 예각이에요.' : k === 1 ? '와 같아서 직각이에요.' : '보다 크고 180°보다 작아서 둔각이에요.'), learn: '예각 < 직각(90°) < 둔각 < 180°' }); } };
M.big_place = { lo: 1, hi: 5, gen(r, L) { const nd = L === 1 ? ri(r, 5, 6) : L === 2 ? ri(r, 7, 8) : L === 3 ? 8 : L === 4 ? ri(r, 9, 10) : ri(r, 12, 13); let ds = []; for (let i = 0; i < nd; i++) ds.push(i === 0 ? ri(r, 1, 9) : ri(r, 0, 9));
  const p = ri(r, Math.max(2, nd - 6), nd - 1), d = ds[nd - 1 - p]; if (d === 0 || ds.filter(x => x === d).length > 1) return null; const n = +ds.join('');
  const cand = shuf(r, [p - 1, p + 1, p + 4, p - 4, p + 2, p - 2].filter(x => x >= 0 && x < nd && x !== p));
  const ch = opts(p, cand, (a, b) => a === b); if (!ch) return null;
  return pmk({ key: 'bp' + n, q: g4(n) + '에서 숫자 ' + jo(d, '은', '는') + ' 어느 자리 숫자일까요?', ch: ch.map(x => ({ t: PLACE[x] + '의 자리' })), a: { n, d, p },
    h: ['오른쪽 끝에서부터 일, 십, 백, 천을 세어 봐요.', '네 자리씩 끊으면 오른쪽부터 일, 만, 억' + (nd > 12 ? ', 조' : '') + ' 묶음이에요.'], why: '오른쪽 끝에서 ' + (p + 1) + '번째 숫자가 ' + jo(d, '이라서', '라서') + ' ' + PLACE[p] + '의 자리예요. 숫자 ' + jo(d, '은', '는') + ' ' + d + '×' + jo(PLACE_V(p), '을', '를') + ' 나타내요.', learn: '큰 수는 오른쪽부터 네 자리씩 끊어 읽어요(일, 만, 억, 조).' }); } };
M.big_cmp = { lo: 2, hi: 4, gen(r, L) { const nd = L === 2 ? 7 : L === 3 ? 8 : 9; const base = []; for (let i = 0; i < nd; i++) base.push(i === 0 ? ri(r, 2, 8) : ri(r, 0, 9));
  const N = [], used = new Set(); for (let k = 0; k < 4; k++) { const ds = base.slice(); const pos = ri(r, 1, Math.min(4, nd - 1)); ds[pos] = ri(r, 0, 9); if (k === 3) ds[ri(r, 2, nd - 1)] = ri(r, 0, 9); const v = +ds.join(''); if (used.has(v)) return null; used.add(v); N.push(v); }
  const mx = Math.max(...N), rest = N.filter(v => v !== mx); if (rest.length !== 3) return null;
  return pmk({ key: 'bc' + mx, q: '가장 큰 수는 무엇일까요?', ch: [mx].concat(rest).map(v => ({ t: g4(v), v })), a: { N },
    h: ['네 수의 자릿수가 같아요. 높은 자리부터 견주어요.', '맨 앞 자리가 같으면 그다음 자리 숫자를 견주어요.'], why: '자릿수가 같으면 가장 높은 자리부터 차례로 견주어, 처음으로 다른 자리에서 숫자가 큰 수가 더 커요. 그래서 ' + jo(g4(mx), '이', '가') + ' 가장 커요.', learn: '자릿수가 같으면 높은 자리부터 견주어요.' }); } };
M.big_skip = { lo: 3, hi: 5, gen(r, L) { const ex = L === 3 ? ri(r, 4, 6) : L === 4 ? ri(r, 6, 8) : ri(r, 8, 10), S = 10 ** ex, n = ri(r, 11, 98) * 10 ** (ex + 1) + ri(r, 1, 8) * S + ri(r, 0, 9) * 10 ** Math.max(0, ex - 1);
  const ans = n + S, ch = opts(ans, shuf(r, [n + S / 10, n + S * 10, n + 2 * S, n - S]), (a, b) => a === b); if (!ch) return null; const sw = PLACE_V(ex);
  return pmk({ key: 'bs' + n + ':' + ex, q: g4(n) + '에서 ' + sw + '씩 뛰어 세면 바로 다음 수는?', ch: ch.map(v => ({ t: g4(v), v })), a: { n, S },
    h: [sw + '씩 뛰어 세면 ' + PLACE[ex] + '의 자리 숫자가 하나씩 커져요.', g4(n) + '의 ' + PLACE[ex] + '의 자리 숫자를 찾아봐요.'], why: sw + '씩 뛰어 세면 ' + PLACE[ex] + '의 자리 숫자만 1 커져요. 그래서 ' + g4(n) + ' 다음은 ' + jo(g4(ans), '이에요', '예요') + '.', learn: '뛰어 세기: 그 자리 숫자가 1씩 커져요.' }); } };
M.frac_add = { lo: 1, hi: 5, gen(r, L) { const n = L === 1 ? ri(r, 5, 9) : L === 2 ? ri(r, 7, 12) : ri(r, 4, 9);
  if (L <= 2) { const a = ri(r, 1, n - 2), b = ri(r, 1, n - 1 - a), s = a + b; const R = [s, n], C = shuf(r, [[s, 2 * n], [s + 1, n], [Math.abs(a - b) || s - 1, n], [s - 1, n], [a * b < n ? a * b : s + 2, n]]).filter(c => c[0] > 0 && c[0] < c[1]);
    const ch = opts(R, C, frEq); if (!ch) return null; return pmk({ key: 'fa' + a + '+' + b + '/' + n, q: '계산해 봐요. ' + FR(0, a, n) + ' + ' + FR(0, b, n) + ' = ?', ch: ch.map(c => ({ t: FR(0, c[0], c[1]), v: c })), a: { op: '+', x: [0, a, n], y: [0, b, n] },
      h: ['분모가 같아요. 분모는 그대로 두어요.', '분자끼리 더해요: ' + a + ' + ' + b], why: '분모가 같은 분수의 덧셈은 분모는 그대로 두고 분자끼리 더해요. ' + FR(0, a, n) + ' + ' + jo(FR(0, b, n), '은', '는') + ' ' + FR(0, 1, n) + '이 ' + s + '개라서 ' + jo(FR(0, s, n), '이에요', '예요') + '.', learn: '분모가 같은 분수의 덧셈: 분모는 그대로, 분자끼리 더해요.' }); }
  if (L === 3) { const a = ri(r, 2, n - 1), b = ri(r, n - a + 1, n - 1); if (b >= n || a + b <= n) return null; const s = a + b - n; const R = [n + s, n], C = shuf(r, [[s, n], [2 * n + s, n], [n + s + 1, n], [a + b, 2 * n], [n + s - 1, n]]).filter(c => c[0] > 0 && (c[1] !== n || c[0] % n !== 0));
    const ch = opts(R, C, frEq); if (!ch) return null; const sh = c => (c[0] >= c[1] && c[0] % c[1] !== 0 ? FR(Math.floor(c[0] / c[1]), c[0] % c[1], c[1]) : FR(0, c[0], c[1]));
    return pmk({ key: 'fa3' + a + '+' + b + '/' + n, q: '계산해서 대분수로 나타내요. ' + FR(0, a, n) + ' + ' + FR(0, b, n) + ' = ?', ch: ch.map(c => ({ t: sh(c), v: c })), a: { op: '+', x: [0, a, n], y: [0, b, n] },
      h: ['먼저 분자끼리 더해요: ' + a + ' + ' + b + ' = ' + (a + b) + '.', FR(0, n, n) + '은 1이에요. ' + FR(0, a + b, n) + '에서 1을 묶어 내요.'], why: FR(0, a, n) + ' + ' + FR(0, b, n) + ' = ' + FR(0, a + b, n) + ', 그리고 ' + FR(0, n, n) + ' = 1이므로 답은 ' + FR(1, s, n) + '.', learn: '분자의 합이 분모보다 크면 1을 묶어 대분수로 나타내요.' }); }
  const w1 = ri(r, 1, 3), w2 = ri(r, 1, 3), carry = L === 5; const a = carry ? ri(r, 2, n - 1) : ri(r, 1, n - 2), b = carry ? ri(r, n - a + 1, n - 1) : ri(r, 1, n - 1 - a); if (a < 1 || b < 1 || b >= n || (carry ? a + b <= n : a + b >= n)) return null;
  const W = w1 + w2 + (carry ? 1 : 0), A = carry ? a + b - n : a + b; const R = [W, A], C = shuf(r, [[w1 + w2, carry ? A : A + 1], [W + 1, A], [carry ? w1 + w2 : W, carry ? a + b - n + 1 : A - 1], [w1 + w2, a + b], [W - 1, A]]).filter(c => c[0] > 0 && c[1] > 0 && c[1] < n);
  const ch = opts(R, C, (p, q) => p[0] === q[0] && p[1] === q[1]); if (!ch) return null;
  return pmk({ key: 'fa' + L + ':' + w1 + a + '+' + w2 + b + '/' + n, q: '계산해 봐요. ' + FR(w1, a, n) + ' + ' + FR(w2, b, n) + ' = ?', ch: ch.map(c => ({ t: FR(c[0], c[1], n), v: frV(c[0], c[1], n) })), a: { op: '+', x: [w1, a, n], y: [w2, b, n] },
    h: ['자연수는 자연수끼리, 분수는 분수끼리 더해요.', carry ? '분수 부분 ' + FR(0, a, n) + ' + ' + FR(0, b, n) + '이 1보다 커요. 1을 자연수로 올려요.' : '자연수: ' + w1 + ' + ' + w2 + ', 분자: ' + a + ' + ' + b], why: '자연수끼리 ' + w1 + ' + ' + w2 + ' = ' + (w1 + w2) + ', 분수끼리 ' + FR(0, a, n) + ' + ' + FR(0, b, n) + ' = ' + FR(0, a + b, n) + (carry ? ', 이것은 ' + FR(1, A, n) + '이므로 답은 ' + FR(W, A, n) + '.' : '이므로 답은 ' + FR(W, A, n) + '.'), learn: carry ? '분수끼리 더해 1이 넘으면 자연수로 받아올려요.' : '대분수의 덧셈: 자연수끼리, 분수끼리 더해요.' }); } };
M.frac_sub = { lo: 2, hi: 5, gen(r, L) { const n = ri(r, 5, 9);
  if (L <= 3) { const a = ri(r, 3, n - 1), b = ri(r, 1, a - 1), d = a - b; const R = [d, n], C = shuf(r, [[a + b, n], [d + 1, n], [d, 2 * n], [d - 1, n], [d + 2, n]]).filter(c => c[0] > 0 && c[0] < c[1] && c[1] > 0);
    const ch = opts(R, C, frEq); if (!ch) return null; return pmk({ key: 'fs' + a + '-' + b + '/' + n, q: '계산해 봐요. ' + FR(0, a, n) + ' − ' + FR(0, b, n) + ' = ?', ch: ch.map(c => ({ t: FR(0, c[0], c[1]), v: c })), a: { op: '-', x: [0, a, n], y: [0, b, n] },
      h: ['분모가 같아요. 분모는 그대로 두어요.', '분자끼리 빼요: ' + a + ' − ' + b], why: FR(0, 1, n) + '이 ' + a + '개에서 ' + b + '개를 빼면 ' + d + '개가 남아요. 답은 ' + FR(0, d, n) + '.', learn: '분모가 같은 분수의 뺄셈: 분모는 그대로, 분자끼리 빼요.' }); }
  if (L === 4) { const a = ri(r, 1, n - 1), W = ri(r, 1, 3), d = n - a; const R = [W - 1, d], C = shuf(r, [[W, a], [W - 1, a], [W, d], [W - 1, d + 1], [W - 1, d - 1]]).filter(c => c[0] >= 0 && c[1] > 0 && c[1] < n);
    const ch = opts(R, C, (p, q) => p[0] === q[0] && p[1] === q[1]); if (!ch) return null; const sh = c => (c[0] ? FR(c[0], c[1], n) : FR(0, c[1], n));
    return pmk({ key: 'fs4' + W + '-' + a + '/' + n, q: '계산해 봐요. ' + W + ' − ' + FR(0, a, n) + ' = ?', ch: ch.map(c => ({ t: sh(c), v: frV(c[0], c[1], n) })), a: { op: '-', x: [W, 0, n], y: [0, a, n] },
      h: ['자연수 1을 분수로 바꿔 봐요. 1 = ' + FR(0, n, n), jo(W, '을', '를') + ' ' + (W > 1 ? FR(W - 1, n, n) : FR(0, n, n)) + '처럼 생각하고 분자끼리 빼요.'], why: W + ' = ' + (W > 1 ? FR(W - 1, n, n) : FR(0, n, n)) + '로 보고 ' + FR(0, n, n) + ' − ' + FR(0, a, n) + ' = ' + FR(0, d, n) + '이므로 답은 ' + sh(R) + '.', learn: '자연수에서 분수를 빼려면 1을 분모가 같은 분수로 바꿔요.' }); }
  const w2 = ri(r, 1, 2), w1 = w2 + ri(r, 2, 3), a = ri(r, 1, n - 2), b = ri(r, a + 1, n - 1); if (b <= a || n - 2 < 1) return null; const W = w1 - w2 - 1, A = n + a - b;
  const R = [W, A], C = shuf(r, [[w1 - w2, b - a], [W, b - a], [w1 - w2, A], [W + 1, b - a], [W, A - 1]]).filter(c => c[0] >= 0 && c[1] > 0 && c[1] < n);
  const ch = opts(R, C, (p, q) => p[0] === q[0] && p[1] === q[1]); if (!ch) return null;
  return pmk({ key: 'fs5' + w1 + a + '-' + w2 + b + '/' + n, q: '계산해 봐요. ' + FR(w1, a, n) + ' − ' + FR(w2, b, n) + ' = ?', ch: ch.map(c => ({ t: c[0] ? FR(c[0], c[1], n) : FR(0, c[1], n), v: frV(c[0], c[1], n) })), a: { op: '-', x: [w1, a, n], y: [w2, b, n] },
    h: ['분수 부분 ' + FR(0, a, n) + '에서 ' + FR(0, b, n) + '을 뺄 수 없어요.', '자연수에서 1을 빌려 와 ' + FR(w1 - 1, n + a, n) + '로 바꿔요.'], why: FR(w1, a, n) + ' = ' + FR(w1 - 1, n + a, n) + '로 바꾸면 자연수끼리 ' + (w1 - 1) + ' − ' + w2 + ' = ' + W + ', 분자끼리 ' + (n + a) + ' − ' + b + ' = ' + A + '이므로 답은 ' + (W ? FR(W, A, n) : FR(0, A, n)) + '.', learn: '분수끼리 뺄 수 없으면 자연수에서 1을 받아내려요.' }); } };
M.dec_read = { lo: 1, hi: 2, gen(r) { const h = ri(r, 11, 99); if (h % 10 === 0) return null; const t = Math.floor(h / 10), o = h % 10, tw = (t > 1 ? DIGK[t] : '') + '십', d2 = '0.' + String(h).padStart(2, '0');
  if (r() < 0.5) { const R = '영 점 ' + DIGK[t] + DIGK[o], C = shuf(r, ['영 점 ' + tw + DIGK[o], '영 점 ' + DIGK[o] + DIGK[t], DIGK[t] + ' 점 ' + DIGK[o], tw + DIGK[o]]); const ch = opts(R, C, (a, b) => a === b); if (!ch) return null;
    return pmk({ key: 'dr' + h, q: d2 + '을 바르게 읽은 것은?', ch: ch.map(t9 => ({ t: t9 })), a: { h, read: 1 }, h: ['소수점 아래 숫자는 하나씩 따로 읽어요.', d2 + '은 "영 점" 다음에 숫자를 하나씩 읽어요.'], why: '소수는 소수점 아래 숫자를 자릿값 없이 하나씩 읽어요. 그래서 답은 "' + R + '".', learn: '소수점 아래 숫자는 하나씩 읽어요(0.37 = 영 점 삼칠).' }); }
  const ch = [[d2, 10 * h], [dS(10 * h), 100 * h], [String(h), 1000 * h], ['0.0' + h, h]];
  return pmk({ key: 'dn' + h, q: '0.01이 ' + h + '개인 수는?', ch: ch.map(x => ({ t: x[0], v: x[1] })), a: { h, cnt: 1 },
    h: ['0.01이 10개면 0.1, 100개면 1이에요.', h + '개는 0.1이 ' + t + '개, 0.01이 ' + o + '개예요.'], why: '0.01이 ' + h + '개이면 0.1이 ' + t + '개, 0.01이 ' + o + '개라서 답은 ' + d2 + '.', learn: '0.01이 10개면 0.1, 100개면 1이에요.' }); } };
M.dec_cmp = { lo: 2, hi: 3, gen(r, L) { const A = ri(r, 3, 9), I = L === 3 ? ri(r, 1, 3) : 0, mx = I * 100 + A * 10, N = [mx, I * 100 + (A - 1) * 10 + ri(r, 1, 9), I * 100 + ri(r, 1, 9), L === 3 ? (I - 1) * 100 + ri(r, 91, 99) : (A - 2) * 10 + ri(r, 1, 9)];
  if (new Set(N).size !== 4 || N.some(v => v <= 0 || v >= mx && v !== mx)) return null;
  return pmk({ key: 'dc' + N.join(','), q: '가장 큰 소수는 무엇일까요?', ch: N.map(v => ({ t: dS(v), v })), a: { N },
    h: ['소수점 아래 자리가 많다고 큰 수가 아니에요.', '자연수 부분부터, 그다음 소수 첫째 자리(0.1의 자리)를 견주어요.'], why: '자연수 부분을 먼저 견주고, 같으면 소수 첫째 자리, 둘째 자리 차례로 견주어요. ' + (mx % 10 ? '그래서 ' + jo(dS(mx), '이', '가') + ' 가장 커요.' : jo(dS(mx), '은', '는') + ' ' + dS(mx) + '0과 같아서 가장 커요.'), learn: '소수는 자연수 부분, 소수 첫째 자리, 둘째 자리 차례로 견주어요.' }); } };
M.dec_add = { lo: 3, hi: 4, gen(r, L) { const a = L === 3 ? ri(r, 12, 88) : ri(r, 101, 899), b0 = L === 3 ? ri(r, 12, 88) : ri(r, 101, 899), oneD = L === 4 && r() < 0.5, b = oneD ? Math.round(b0 / 10) * 10 : b0; if (a % 10 === 0 || b % 100 === 0) return null;
  const s = a + b, noCarry = (Math.floor(a / 10) % 10 + Math.floor(b / 10) % 10) % 10 * 10 + (a % 10 + b % 10) % 10 + (Math.floor(a / 100) + Math.floor(b / 100)) * 100, mis = oneD ? a + b / 10 : s + 100;
  const ch = opts(s, shuf(r, [noCarry, mis, s + 10, s - 10, s + 1]).filter(v => v > 0), (x, y) => x === y); if (!ch) return null;
  return pmk({ key: 'da' + a + '+' + b, q: '계산해 봐요. ' + dS(a) + ' + ' + dS(b) + ' = ?', ch: ch.map(v => ({ t: dS(v), v })), a: { op: '+', a, b },
    h: ['소수점끼리 줄을 맞춰 세로로 써 봐요.', oneD ? jo(dS(b), '은', '는') + ' ' + dS(b) + '0과 같아요. 빈 자리는 0으로 생각해요.' : '0.01의 자리부터 더하고, 10이 넘으면 윗자리로 받아올려요.'], why: '소수점을 맞춰 같은 자리끼리 더해요. ' + dS(a) + ' + ' + dS(b) + ' = ' + dS(s), learn: '소수의 덧셈: 소수점을 맞추고 같은 자리끼리 더해요.' }); } };
M.dec_sub = { lo: 4, hi: 5, gen(r, L) { const a = ri(r, 210, 980), b = ri(r, 105, a - 30), oneD = L === 4 && r() < 0.6, A = oneD ? Math.round(a / 10) * 10 : a; if (A <= b || b % 10 === 0) return null; const d = A - b;
  const dg = x => [Math.floor(x / 100), Math.floor(x / 10) % 10, x % 10], P = dg(A), Q = dg(b), small = Math.abs(P[0] - Q[0]) * 100 + Math.abs(P[1] - Q[1]) * 10 + Math.abs(P[2] - Q[2]);
  const ch = opts(d, shuf(r, [small, d + 10, d - 10, d + 100, d - 1]).filter(v => v > 0), (x, y) => x === y); if (!ch) return null;
  return pmk({ key: 'ds' + A + '-' + b, q: '계산해 봐요. ' + dS(A) + ' − ' + dS(b) + ' = ?', ch: ch.map(v => ({ t: dS(v), v })), a: { op: '-', a: A, b },
    h: ['소수점끼리 줄을 맞춰 세로로 써 봐요.', (oneD ? jo(dS(A), '은', '는') + ' ' + dS(A) + '0과 같아요. ' : '') + '뺄 수 없는 자리는 윗자리에서 10을 받아내려요.'], why: '소수점을 맞춰 같은 자리끼리 빼고, 모자라면 윗자리에서 받아내려요. ' + dS(A) + ' − ' + dS(b) + ' = ' + dS(d), learn: '소수의 뺄셈: 소수점을 맞추고, 모자라면 받아내려요.' }); } };
M.angle_calc = { lo: 2, hi: 2, gen(r) { const add = r() < 0.5, a = ri(r, 7, 26) * 5, b = ri(r, 3, add ? Math.min(20, 34 - a / 5) : a / 5 - 1) * 5; if (b <= 0 || (add && a + b > 175)) return null; const v = add ? a + b : a - b;
  const ch = opts(v, shuf(r, [add ? Math.abs(a - b) : a + b, v + 10, v - 10, v + 5]).filter(x => x > 0 && x < 360), (x, y) => x === y); if (!ch) return null;
  return pmk({ key: 'ac' + a + (add ? '+' : '-') + b, q: '각도를 계산해 봐요. ' + a + '° ' + (add ? '+' : '−') + ' ' + b + '° = ?', ch: ch.map(x => ({ t: x + '°', v: x })), a: { a, b, add },
    h: ['각도의 합과 차는 자연수처럼 계산해요.', (add ? a + ' + ' + b : a + ' − ' + b) + '을 먼저 해 봐요.'], why: '각도의 ' + (add ? '합' : '차') + '는 자연수의 ' + (add ? '덧셈' : '뺄셈') + '과 같이 계산하고 끝에 °를 붙여요. ' + a + '° ' + (add ? '+' : '−') + ' ' + b + '° = ' + v + '°예요.', learn: '각도의 합과 차는 자연수처럼 계산하고 °를 붙여요.' }); } };
M.tri_side = { lo: 2, hi: 2, gen(r) { const eqT = r() < 0.4, s = ri(r, 4, 8), t = eqT ? s : pk(r, [s - 2, s - 1, s + 1, s + 2, s + 3].filter(x => x >= 3 && x < 2 * s)); const sides = shuf(r, [s, s, t]); const nm = eqT ? '정삼각형' : '이등변삼각형';
  const others = eqT ? ['직사각형', '사다리꼴', '마름모'] : ['정삼각형', '직사각형', '마름모'];
  return pmk({ key: 'ts' + sides.join(','), q: '세 변의 길이를 보고 삼각형의 이름을 골라요.', pic: svgTri(sides), ch: [nm].concat(shuf(r, others)).map(t9 => ({ t: t9 })), a: { sides },
    h: ['길이가 같은 변이 몇 개인지 세어 봐요.', '두 변이 같으면 이등변삼각형, 세 변이 모두 같으면 정삼각형이에요.'], why: '세 변이 ' + sides.join(' cm, ') + ' cm라서 ' + (eqT ? '세 변의 길이가 모두 같은 정삼각형이에요.' : '두 변의 길이가 같은 이등변삼각형이에요.'), learn: '이등변삼각형 = 두 변이 같음, 정삼각형 = 세 변이 같음' }); } };
M.tri_third = { lo: 3, hi: 3, gen(r) { const a = ri(r, 5, 14) * 5, b = ri(r, 4, 14) * 5, c = 180 - a - b; if (c < 15) return null;
  if (r() < 0.5) { const ch = opts(c, shuf(r, [360 - a - b, a + b, c + 10, c - 10]).filter(x => x > 0), (x, y) => x === y); if (!ch) return null;
    return pmk({ key: 'tt' + a + ',' + b, q: '삼각형의 두 각이 ' + a + '°, ' + b + '°예요. 나머지 한 각은?', ch: ch.map(x => ({ t: x + '°', v: x })), a: { a, b }, h: ['삼각형 세 각의 크기를 더하면 얼마인지 떠올려 봐요.', '세 각의 합은 180°예요. 180°에서 두 각을 빼요.'], why: '삼각형의 세 각을 더하면 180°예요. 180° − ' + a + '° − ' + b + '° = ' + c + '°예요.', learn: '삼각형 세 각의 크기의 합 = 180°' }); }
  const mx = Math.max(a, b, c); if (mx === 90 && (a === 90 || b === 90)) return null; const nm = mx < 90 ? '예각삼각형' : mx === 90 ? '직각삼각형' : '둔각삼각형';
  return pmk({ key: 'tk' + a + ',' + b, q: '삼각형의 두 각이 ' + a + '°, ' + b + '°예요. 어떤 삼각형일까요?', ch: [nm].concat(['예각삼각형', '직각삼각형', '둔각삼각형'].filter(x => x !== nm)).map(t9 => ({ t: t9 })), a: { a, b, kind: 1 },
    h: ['먼저 나머지 한 각을 구해요(세 각의 합 180°).', '가장 큰 각이 예각인지, 직각인지, 둔각인지 봐요.'], why: '나머지 각은 180° − ' + a + '° − ' + b + '° = ' + c + '°예요. 가장 큰 각이 ' + mx + '°라서 ' + nm + '이에요.', learn: '세 각이 모두 예각 = 예각삼각형, 한 각이 둔각 = 둔각삼각형' }); } };
M.quad_fourth = { lo: 5, hi: 5, gen(r) { const a = ri(r, 12, 26) * 5, b = ri(r, 12, 26) * 5, c = ri(r, 12, 26) * 5, d = 360 - a - b - c; if (d < 40 || d > 170) return null;
  const ch = opts(d, shuf(r, [180 - a - b - c > 0 ? 180 - a - b - c : d + 20, d + 10, d - 10, d + 5]).filter(x => x > 0), (x, y) => x === y); if (!ch) return null;
  return pmk({ key: 'qf' + a + ',' + b + ',' + c, q: '사각형의 세 각이 ' + a + '°, ' + b + '°, ' + c + '°예요. 나머지 한 각은?', ch: ch.map(x => ({ t: x + '°', v: x })), a: { a, b, c },
    h: ['사각형은 대각선 하나로 삼각형 두 개로 나눌 수 있어요.', '네 각의 합은 180° × 2 = 360°예요.'], why: '사각형 네 각의 합은 360°예요. 360° − ' + a + '° − ' + b + '° − ' + c + '° = ' + d + '°예요.', learn: '사각형 네 각의 크기의 합 = 360°' }); } };
M.quad_pic = { lo: 4, hi: 4, gen(r) { const k = pk(r, Object.keys(QUADS)), Q = QUADS[k], not = QUAD_NAMES.filter(n => !Q.isa.includes(n)), ch = [Q.nm].concat(shuf(r, not).slice(0, 3));
  const why = { trap: '평행한 변이 한 쌍만 있어서 사다리꼴이에요.', para: '마주 보는 두 쌍의 변이 평행해서 평행사변형이에요. 네 각이 직각이 아니고 네 변이 모두 같지 않아요.', rhom: '네 변의 길이가 모두 같아서 마름모예요. 네 각이 직각이 아니라 정사각형은 아니에요.', rect: '네 각이 모두 직각이라 직사각형이에요. 네 변이 모두 같지는 않아서 정사각형은 아니에요.' }[k];
  return pmk({ key: 'qp' + k, q: '그림의 사각형 이름으로 알맞은 것은?', pic: svgQuad(Q, r), ch: ch.map(t9 => ({ t: t9 })), a: { shape: k },
    h: ['화살표 표시는 평행한 변, 짧은 줄 표시는 길이가 같은 변, 네모 표시는 직각이에요.', '표시를 하나씩 확인하며 보기의 뜻과 맞춰 봐요.'], why, learn: '사다리꼴 ⊃ 평행사변형 ⊃ 마름모·직사각형 ⊃ 정사각형' }); } };
const QISA = { 정사각형: ['직사각형', '마름모', '평행사변형', '사다리꼴'], 직사각형: ['평행사변형', '사다리꼴'], 마름모: ['평행사변형', '사다리꼴'], 평행사변형: ['사다리꼴'], 사다리꼴: [] };
const QCOND = { 사다리꼴: '평행한 변이 한 쌍이라도 있어야', 평행사변형: '마주 보는 두 쌍의 변이 평행해야', 마름모: '네 변의 길이가 모두 같아야', 직사각형: '네 각이 모두 직각이어야', 정사각형: '네 변이 같고 네 각이 모두 직각이어야' };
export const QUAD_ISA = QISA;
M.quad_isa = { lo: 5, hi: 5, gen(r) { const X = pk(r, Object.keys(QISA)), Y = pk(r, Object.keys(QISA).filter(y => y !== X)), yes = QISA[X].includes(Y);
  return pmk({ key: 'qi' + X + Y, q: jo(X, '은', '는') + ' ' + jo(Y, '이라고', '라고') + ' 할 수 있을까요?', ch: (yes ? ['네, 할 수 있어요', '아니요, 할 수 없어요'] : ['아니요, 할 수 없어요', '네, 할 수 있어요']).map(t9 => ({ t: t9 })), a: { X, Y, yes },
    h: [jo(Y, '이', '가') + ' 되려면 ' + QCOND[Y] + ' 해요.', jo(X, '이', '가') + ' 그 조건을 늘 갖추었는지 봐요.'], why: jo(Y, '이', '가') + ' 되려면 ' + QCOND[Y] + ' 해요. ' + (yes ? jo(X, '은', '는') + ' 이 조건을 늘 갖추고 있어서 ' + jo(Y, '이라고', '라고') + ' 할 수 있어요.' : jo(X, '이라고', '라고') + ' 해서 늘 그렇지는 않아서 ' + jo(Y, '이라고', '라고') + ' 할 수 없어요.'), learn: '정사각형은 직사각형이면서 마름모예요.' }); } };
const LG_T = { temp: { xs: ['9시', '10시', '11시', '12시', '1시'], xn: ['오전 9시', '오전 10시', '오전 11시', '낮 12시', '오후 1시'], unit: '°C', nm: '기온', up: '오른' }, bean: { xs: ['1일', '3일', '5일', '7일', '9일'], xn: ['1일', '3일', '5일', '7일', '9일'], unit: 'cm', nm: '강낭콩의 키', up: '자란' } };
function lgData(r, kind) { if (kind === 'bean') { const v = [ri(r, 1, 3) * 2]; for (let i = 1; i < 5; i++) v.push(v[i - 1] + ri(r, 1, 3) * 2); return v; } const v = [ri(r, 6, 9) * 2]; for (let i = 1; i < 5; i++) v.push(Math.max(8, Math.min(30, v[i - 1] + pk(r, [-2, 0, 2, 2, 4, 6])))); return v; }
M.line_read = { lo: 3, hi: 3, gen(r) { const kind = pk(r, ['temp', 'bean']), T = LG_T[kind], v = lgData(r, kind), lo = Math.max(0, Math.floor((Math.min(...v) - 2) / 2) * 2), hi = Math.ceil((Math.max(...v) + 2) / 2) * 2, pic = svgLine(T.xs, v, T.unit, lo, hi);
  if (kind === 'temp' && r() < 0.5) { const mx = Math.max(...v); if (v.filter(x => x === mx).length > 1) return null; const im = v.indexOf(mx), oth = shuf(r, [0, 1, 2, 3, 4].filter(i => i !== im)).slice(0, 3);
    return pmk({ key: 'lm' + v.join(','), q: jo(T.nm, '이', '가') + ' 가장 높은 때는 언제일까요?', pic, ch: [im].concat(oth).map(i => ({ t: T.xn[i], v: i })), a: { v, max: 1 }, h: ['꺾은선에서 점이 가장 위에 있는 곳을 찾아요.', '그 점에서 아래로 내려가 가로 눈금을 읽어요.'], why: '점이 가장 높이 있는 ' + T.xn[im] + '에 ' + jo(T.nm, '이', '가') + ' ' + mx + T.unit + '로 가장 높아요.', learn: '꺾은선그래프에서 점이 높을수록 값이 커요.' }); }
  const k = ri(r, 0, 4), x = v[k], ch = opts(x, shuf(r, [x + 2, x - 2, x + 4, x - 4]).filter(y => y >= 0), (a, b) => a === b); if (!ch) return null;
  return pmk({ key: 'lr' + kind + v.join(',') + k, q: T.xn[k] + '의 ' + jo(T.nm, '은', '는') + ' 몇 ' + T.unit + '일까요?', pic, ch: ch.map(y => ({ t: y + ' ' + T.unit, v: y })), a: { v, k },
    h: ['가로 눈금에서 ' + jo(T.xs[k], '을', '를') + ' 찾아 위로 올라가 점을 찾아요.', '그 점에서 왼쪽 세로 눈금을 읽어요. 한 칸은 2' + T.unit + '예요.'], why: T.xs[k] + ' 위의 점을 왼쪽 눈금으로 읽으면 ' + x + T.unit + '예요. 세로 눈금 한 칸은 2' + T.unit + '예요.', learn: '꺾은선그래프는 가로·세로 눈금을 맞춰 읽어요.' }); } };
M.line_change = { lo: 4, hi: 4, gen(r) { const kind = pk(r, ['temp', 'bean']), T = LG_T[kind], v = lgData(r, kind), lo = Math.max(0, Math.floor((Math.min(...v) - 2) / 2) * 2), hi = Math.ceil((Math.max(...v) + 2) / 2) * 2, pic = svgLine(T.xs, v, T.unit, lo, hi);
  if (r() < 0.55) { const d = [0, 1, 2, 3].map(i => v[i + 1] - v[i]), mx = Math.max(...d); if (mx <= 0 || d.filter(x => x === mx).length > 1) return null; const im = d.indexOf(mx), oth = [0, 1, 2, 3].filter(i => i !== im), lab = i => jo(T.xn[i], '과', '와') + ' ' + T.xn[i + 1] + ' 사이';
    return pmk({ key: 'lc' + v.join(','), q: jo(T.nm, '이', '가') + ' 가장 많이 ' + T.up + ' 때는 언제일까요?', pic, ch: [im].concat(oth).map(i => ({ t: lab(i), v: i })), a: { v, rise: 1 }, h: ['선분이 가장 가파르게 올라간 곳을 찾아요.', '이웃한 두 점의 눈금 차가 가장 큰 곳이에요.'], why: lab(im) + '에 ' + v[im] + T.unit + '에서 ' + v[im + 1] + T.unit + '로 ' + mx + T.unit + ' ' + T.up + ' 것이 가장 커요. 선분이 가장 가파르게 올라가요.', learn: '꺾은선이 가파를수록 많이 바뀐 거예요.' }); }
  const i = ri(r, 0, 2), j = ri(r, i + 2, 4), dd = Math.abs(v[j] - v[i]); if (dd === 0) return null; const ch = opts(dd, shuf(r, [dd + 2, dd - 2, dd + 4, v[j] + v[i]]).filter(y => y > 0), (a, b) => a === b); if (!ch) return null;
  return pmk({ key: 'ld' + v.join(',') + i + j, q: jo(T.xn[i], '과', '와') + ' ' + T.xn[j] + '의 ' + T.nm + ' 차는 몇 ' + T.unit + '일까요?', pic, ch: ch.map(y => ({ t: y + ' ' + T.unit, v: y })), a: { v, i, j },
    h: ['두 때의 값을 각각 먼저 읽어요.', jo(T.xs[i], '은', '는') + ' ' + v[i] + T.unit + '예요. ' + T.xs[j] + '의 값을 읽어 빼 봐요.'], why: T.xn[i] + ' ' + v[i] + T.unit + ', ' + T.xn[j] + ' ' + v[j] + T.unit + '라서 차는 ' + dd + T.unit + '예요.', learn: '두 때의 차 = 큰 값 − 작은 값' }); } };
for (const k in M) M[k].id = 'math:' + k;

// ───────── 영어 ─────────
const EW = {
  color: [['red', '빨강', '#d8262e', '레드'], ['blue', '파랑', '#2f6fd0', '블루'], ['yellow', '노랑', '#f2c230', '옐로'], ['green', '초록', '#3f9f4e', '그린'], ['pink', '분홍', '#f4a6b8', '핑크'], ['purple', '보라', '#7d4bb8', '퍼플'], ['orange', '주황', '#ef8b33', '오렌지'], ['black', '검정', '#2b2420', '블랙'], ['white', '하양', '#ffffff', '화이트'], ['brown', '갈색', '#8a5a3a', '브라운']],
  fruit: [['apple', '사과', '🍎', '애플'], ['banana', '바나나', '🍌', '버내나'], ['grape', '포도', '🍇', '그레이프'], ['orange', '오렌지', '🍊', '오렌지'], ['strawberry', '딸기', '🍓', '스트로베리'], ['peach', '복숭아', '🍑', '피치'], ['lemon', '레몬', '🍋', '레먼'], ['watermelon', '수박', '🍉', '워터멜런']],
  animal: [['cat', '고양이', '🐱', '캣'], ['dog', '개', '🐶', '도그'], ['bird', '새', '🐦', '버드'], ['fish', '물고기', '🐟', '피시'], ['rabbit', '토끼', '🐰', '래빗'], ['pig', '돼지', '🐷', '피그'], ['cow', '소', '🐮', '카우'], ['horse', '말', '🐴', '호스'], ['monkey', '원숭이', '🐵', '멍키'], ['lion', '사자', '🦁', '라이언'], ['tiger', '호랑이', '🐯', '타이거'], ['bear', '곰', '🐻', '베어'], ['elephant', '코끼리', '🐘', '엘리펀트'], ['duck', '오리', '🦆', '덕']],
  thing: [['book', '책', '📖', '북'], ['pencil', '연필', '✏', '펜슬'], ['bag', '가방', '🎒', '백'], ['ball', '공', '⚽', '볼'], ['cap', '모자', '🧢', '캡'], ['umbrella', '우산', '☂', '엄브렐러'], ['clock', '시계', '⏰', '클락'], ['ruler', '자', '📏', '룰러'], ['scissors', '가위', '✂', '시저스'], ['key', '열쇠', '🔑', '키']],
  weather: [['sunny', '맑은', '☀', '서니'], ['rainy', '비 오는', '🌧', '레이니'], ['snowy', '눈 오는', '❄', '스노이'], ['cloudy', '흐린', '☁', '클라우디'], ['windy', '바람 부는', '🌬', '윈디']],
  feel: [['happy', '기쁜', '😀', '해피'], ['sad', '슬픈', '😢', '새드'], ['angry', '화난', '😠', '앵그리'], ['sleepy', '졸린', '😴', '슬리피']],
};
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const NUMK = ['영', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물'];
const catsOf = L => (L === 1 ? ['color', 'fruit', 'animal'] : L === 2 ? ['thing', 'num10', 'animal'] : ['num20', 'weather', 'feel']);
function wordPool(cat) { if (cat === 'num10' || cat === 'num20') { const a = cat === 'num10' ? 1 : 11, b = cat === 'num10' ? 10 : 20, out = []; for (let i = a; i <= b; i++) out.push([NUMW[i], NUMK[i], String(i), '']); return out; } return EW[cat]; }
const picOf = (cat, w) => (cat === 'color' ? { sw: [w[2]] } : cat.startsWith('num') ? { big: w[2] } : { emo: w[2] });
const E = {};
E.en_pic = { lo: 1, hi: 3, gen(r, L) { const cat = pk(r, catsOf(L)), P = wordPool(cat), w = pk(r, P), oth = shuf(r, P.filter(x => x[0] !== w[0])).slice(0, 3);
  return pmk({ key: 'ep' + w[0], q: 'What is this? 그림에 알맞은 낱말을 골라요.', vis: picOf(cat, w), say: w[0], ch: [w].concat(oth).map(x => ({ t: x[0] })), a: { w: w[0] },
    h: ['우리말로는 "' + jo(w[1] + '"', '이에요', '예요') + '.', '첫 글자는 ' + w[0][0] + '예요.'], why: jo(w[1], '은', '는') + ' 영어로 ' + w[0] + (w[3] ? '[' + w[3] + ']' : '') + ' 하고 말해요. 글자는 ' + w[0].split('').join('-') + '.', learn: w[1] + ' = ' + w[0] }); } };
E.en_find = { lo: 2, hi: 3, gen(r, L) { const cat = pk(r, L === 2 ? ['fruit', 'animal', 'thing'] : ['weather', 'feel', 'thing']), P = wordPool(cat), w = pk(r, P), oth = shuf(r, P.filter(x => x[0] !== w[0])).slice(0, 3);
  return pmk({ key: 'ef' + w[0], q: 'Find "' + w[0] + '". 낱말에 알맞은 그림을 골라요.', say: w[0], ch: [w].concat(oth).map(x => ({ t: x[1], emo: x[2] })), a: { w: w[0] },
    h: ['🔊 소리를 들어 봐요. ' + (w[3] ? '"' + w[3] + '" 하고 소리 나요.' : ''), '첫 글자 ' + w[0][0] + '로 시작하는 우리말 낱말을 떠올려 봐요.'], why: '"' + w[0] + '"의 뜻은 "' + jo(w[1] + '"', '이에요', '예요') + '.', learn: w[0] + ' = ' + w[1] }); } };
const KO_W = [['school', '학교', 'I go to school.', '아침마다 가방을 메고 가는 곳이에요.'], ['friend', '친구', 'He is my friend.', '같이 놀고 이야기하는 사이예요.'], ['teacher', '선생님', 'She is my teacher.', '교실에서 우리를 가르쳐 주세요.'], ['family', '가족', 'I love my family.', '함께 사는 엄마, 아빠, 형제를 모두 부르는 말이에요.'], ['water', '물', 'I drink water.', '목이 마를 때 마셔요.'], ['flower', '꽃', 'This flower is pretty.', '봄에 피고 향기가 나요.'], ['tree', '나무', 'The tree is tall.', '숲에 많고 줄기와 가지가 있어요.'], ['milk', '우유', 'I like milk.', '하얀 마실 거리로 소에게서 얻어요.'], ['bread', '빵', 'I eat bread.', '밀가루를 반죽해 구워 만들어요.'], ['sun', '해', 'The sun is hot.', '낮에 하늘에서 밝게 빛나요.'], ['moon', '달', 'I can see the moon.', '밤하늘에서 모양이 바뀌어 보여요.'], ['window', '창문', 'Open the window, please.', '바람과 햇빛이 들어오는 곳이에요.'], ['door', '문', 'Close the door, please.', '방에 들어가고 나갈 때 열어요.']];
E.en_ko = { lo: 1, hi: 2, gen(r) { const w = pk(r, KO_W), oth = shuf(r, KO_W.filter(x => x[0] !== w[0])).slice(0, 3);
  return pmk({ key: 'ek' + w[0], q: '"' + w[0] + '"의 뜻은 무엇일까요?', say: w[0], ch: [w].concat(oth).map(x => ({ t: x[1] })), a: { w: w[0] }, h: ['이 낱말이 들어간 문장: ' + w[2], w[3]], why: '"' + w[0] + '"의 뜻은 "' + jo(w[1] + '"', '이에요', '예요') + '. ' + w[2], learn: w[0] + ' = ' + w[1] }); } };
const EXPR = [['아침에 친구를 만났어요.', 'Good morning.', ['Good night.', 'Thank you.', "I'm sorry."], '아침 인사'], ['친구가 연필을 빌려주었어요.', 'Thank you.', ['Good morning.', 'Goodbye.', "I'm sorry."], '고맙다는 말'], ['친구의 발을 실수로 밟았어요.', "I'm sorry.", ['Thank you.', 'Nice to meet you.', 'Good morning.'], '미안하다는 말'], ['처음 만난 친구에게 반갑다고 해요.', 'Nice to meet you.', ['Goodbye.', "I'm sorry.", 'Good night.'], '처음 만나 반갑다는 말'], ['집에 가며 친구와 헤어져요.', 'Goodbye.', ['Nice to meet you.', 'Thank you.', 'Good morning.'], '헤어질 때 인사'], ['잠자리에 들며 가족에게 인사해요.', 'Good night.', ['Good morning.', 'Nice to meet you.', 'Thank you.'], '자기 전 인사'], ['친구의 이름이 궁금해요.', "What's your name?", ['How old are you?', 'How are you?', "What's this?"], '이름을 묻는 말'], ['친구의 나이가 궁금해요.', 'How old are you?', ["What's your name?", "What's this?", 'Can you swim?'], '나이를 묻는 말'], ['처음 보는 물건이 무엇인지 궁금해요.', "What's this?", ['How old are you?', "What's your name?", 'Good night.'], '무엇인지 묻는 말'], ['친구가 수영을 할 수 있는지 궁금해요.', 'Can you swim?', ["What's this?", 'How old are you?', 'Thank you.'], '할 수 있는지 묻는 말'], ['오늘 날씨가 궁금해요.', "How's the weather?", ["What's your name?", 'Can you swim?', 'Goodbye.'], '날씨를 묻는 말']];
E.en_expr = { lo: 3, hi: 4, gen(r) { const x = pk(r, EXPR);
  return pmk({ key: 'ex' + x[1], q: x[0] + ' 알맞은 말은?', say: x[1], ch: [x[1]].concat(x[2]).map(t => ({ t })), a: { right: x[1] }, h: ['이럴 때 우리말로는 어떻게 말할지 먼저 떠올려 봐요.', '이때 필요한 것은 "' + x[3] + '"이에요.'], why: x[3] + '로 "' + x[1] + '"라고 말해요.', learn: x[3] + ': ' + x[1] }); } };
const CLOCKW = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
function svgClock(h) { const a = (h % 12) / 12 * Math.PI * 2, hx = 80 + Math.sin(a) * 34, hy = 80 - Math.cos(a) * 34; let t = ''; for (let i = 1; i <= 12; i++) { const b = i / 12 * Math.PI * 2; t += tx((80 + Math.sin(b) * 56 - (i > 9 ? 9 : 5)).toFixed(0), (80 - Math.cos(b) * 56 + 5).toFixed(0), i, 'font-size="13"'); }
  return svgW(160, 160, '<circle cx="80" cy="80" r="72" fill="' + PAP + '" stroke="' + INK + '" stroke-width="4"/>' + t + '<line x1="80" y1="80" x2="80" y2="24" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/><line x1="80" y1="80" x2="' + hx.toFixed(1) + '" y2="' + hy.toFixed(1) + '" stroke="#c8553d" stroke-width="6" stroke-linecap="round"/><circle cx="80" cy="80" r="5" fill="' + INK + '"/>'); }
const REPLY = [['How are you?', "I'm fine, thank you.", ['Yes, I can.', "It's a book.", 'Goodbye.'], '기분이 어떤지 물었어요.'], ['How old are you?', "I'm ten years old.", ["I'm fine.", "It's sunny.", 'Yes, I do.'], '나이를 물었어요.'], ["What's this?", "It's a book.", ["It's a pencil.", "I'm ten years old.", 'Nice to meet you.'], '무엇인지 물었어요. 그림을 봐요.', '📖'], ['Can you swim?', 'Yes, I can.', ['Yes, I do.', "It's sunny.", "I'm fine."], '할 수 있는지 물었어요.'], ['Do you like apples?', 'Yes, I do.', ['Yes, I can.', "It's sunny.", "I'm ten years old."], '좋아하는지 물었어요.'], ["How's the weather?", "It's sunny.", ["It's rainy.", "It's snowy.", 'Yes, I do.'], '날씨를 물었어요. 그림을 봐요.', '☀'], ["How's the weather?", "It's rainy.", ["It's sunny.", "It's windy.", 'Yes, I can.'], '날씨를 물었어요. 그림을 봐요.', '🌧']];
E.en_reply = { lo: 4, hi: 5, gen(r) { if (r() < 0.25) { const h = ri(r, 1, 11), oth = shuf(r, [h + 1, h - 1 || 12, (h + 3) % 12 || 12]).map(x => "It's " + CLOCKW[x] + " o'clock."); const right = "It's " + CLOCKW[h] + " o'clock.";
    const ch = opts(right, oth.concat(["It's sunny."]), (a, b) => a === b); if (!ch) return null; return pmk({ key: 'et' + h, q: 'What time is it? 알맞은 대답을 골라요.', pic: svgClock(h), say: 'What time is it?', ch: ch.map(t => ({ t })), a: { h }, h: ['짧은바늘이 가리키는 수가 "몇 시"예요.', '짧은바늘이 ' + jo(h, '을', '를') + ' 가리켜요. 그 수를 영어로 ' + CLOCKW[h] + ' 하고 말해요.'], why: '짧은바늘이 ' + h + ', 긴바늘이 12를 가리켜 ' + h + '시예요. 그래서 "' + right + '"라고 대답해요.', learn: '몇 시: It\'s ○ o\'clock.' }); }
  const x = pk(r, REPLY); return pmk({ key: 'er' + x[0] + x[1], q: '"' + x[0] + '"에 알맞은 대답은?', vis: x[4] ? { emo: x[4] } : null, say: x[0], ch: [x[1]].concat(x[2]).map(t => ({ t })), a: { right: x[1] }, h: [x[3], '물음의 첫 낱말(How, What, Can, Do)을 보고 대답의 꼴을 떠올려 봐요.'], why: '"' + x[0] + '"에는 "' + x[1] + '"처럼 대답해요.', learn: x[0] + ' → ' + x[1] }); } };
const SPELL = [['cat', '고양이', '캣'], ['dog', '개', '도그'], ['pig', '돼지', '피그'], ['sun', '해', '선'], ['bag', '가방', '백'], ['apple', '사과', '애플'], ['school', '학교', '스쿨'], ['book', '책', '북'], ['fish', '물고기', '피시'], ['milk', '우유', '밀크'], ['tree', '나무', '트리'], ['red', '빨강', '레드'], ['blue', '파랑', '블루'], ['ten', '10', '텐'], ['six', '6', '식스'], ['desk', '책상', '데스크'], ['duck', '오리', '덕']];
E.en_spell = { lo: 4, hi: 5, gen(r, L) { const w = pk(r, SPELL.filter(x => (L === 4 ? x[0].length <= 4 : x[0].length >= 4))), i = ri(r, 0, w[0].length - 1), c = w[0][i], shown = w[0].slice(0, i) + '_' + w[0].slice(i + 1);
  const LET = 'aeioubdgklmnprst'.split('').filter(x => x !== c), ch = [c].concat(shuf(r, LET).slice(0, 3));
  return pmk({ key: 'es' + w[0] + i, q: '빈칸에 알맞은 글자는? ' + shown + ' (' + w[1] + ')', say: w[0], ch: ch.map(t => ({ t })), a: { w: w[0], i }, h: ['🔊 낱말 소리를 들어 봐요.', jo(w[1], '은', '는') + ' "' + w[2] + '" 하고 소리 나요.'], why: jo(w[1], '은', '는') + ' 영어로 ' + w[0] + '. 그래서 빈칸에는 ' + c + ' 글자가 들어가요.', learn: w[1] + ' = ' + w[0] }); } };
function svgWhere(k) { const box = '<rect x="210" y="96" width="90" height="70" fill="#d9b27a" stroke="' + INK + '" stroke-width="3"/><path d="M210 96 L196 78 M300 96 L314 78" stroke="' + INK + '" stroke-width="3"/>', table = '<rect x="30" y="92" width="140" height="12" fill="#9b6a3c" stroke="' + INK + '" stroke-width="3"/><rect x="40" y="104" width="10" height="62" fill="#9b6a3c" stroke="' + INK + '" stroke-width="2"/><rect x="150" y="104" width="10" height="62" fill="#9b6a3c" stroke="' + INK + '" stroke-width="2"/>';
  const at = k === 'on' ? [100, 76] : k === 'under' ? [100, 150] : [255, 136];
  return svgW(330, 180, '<line x1="10" y1="167" x2="320" y2="167" stroke="' + GRID + '" stroke-width="3"/>' + table + box + '<circle cx="' + at[0] + '" cy="' + at[1] + '" r="15" fill="#e0453a" stroke="' + INK + '" stroke-width="3"/>' + (k === 'in' ? '<rect x="211" y="120" width="88" height="45" fill="#d9b27a" opacity="0.55"/>' : '')); }
E.en_where = { lo: 4, hi: 4, gen(r) { const k = pk(r, ['in', 'on', 'under']), T = { in: "It's in the box.", on: "It's on the table.", under: "It's under the table." }, ko = { in: '상자 안', on: '탁자 위', under: '탁자 아래' };
  return pmk({ key: 'ew' + k, q: 'Where is the ball? 공은 어디에 있을까요?', pic: svgWhere(k), say: 'Where is the ball?', ch: [T[k]].concat(['in', 'on', 'under'].filter(x => x !== k).map(x => T[x])).map(t => ({ t })), a: { k },
    h: ['공이 어디에 있는지 우리말로 먼저 말해 봐요.', 'in은 안, on은 위, under는 아래예요.'], why: '공이 ' + ko[k] + '에 있으니 "' + T[k] + '"라고 말해요.', learn: 'in = 안, on = 위, under = 아래' }); } };
const DIALOG = [[["A: Hello!", '안녕!'], ["B: Hi! How are you?", '안녕! 잘 지내?'], ["A: I'm fine, thank you. And you?", '잘 지내, 고마워. 너는?'], ["B: I'm good.", '나도 좋아.']], [["A: Hi, nice to meet you.", '안녕, 만나서 반가워.'], ["B: Nice to meet you, too.", '나도 만나서 반가워.'], ["A: How old are you?", '너는 몇 살이니?'], ["B: I'm ten years old.", '나는 열 살이야.']], [["A: What's this?", '이것은 뭐야?'], ["B: It's a ruler.", '그것은 자야.'], ["A: Can I use it?", '내가 써도 될까?'], ["B: Sure. Here you are.", '물론이지. 여기 있어.']], [["A: Can you swim?", '너는 수영할 수 있니?'], ["B: Yes, I can. Can you?", '응, 할 수 있어. 너는?'], ["A: No, I can't.", '아니, 나는 못 해.']], [["A: How's the weather?", '날씨가 어때?'], ["B: It's rainy.", '비가 와.'], ["A: Take your umbrella.", '우산 챙겨 가.'], ["B: OK, thank you.", '알았어, 고마워.']], [["A: Ouch!", '아야!'], ["B: Oh, I'm sorry.", '어머, 미안해.'], ["A: That's OK.", '괜찮아.']]];
E.en_dialog = { lo: 5, hi: 5, gen(r) { const di = ri(r, 0, DIALOG.length - 1), D = DIALOG[di];
  return { kind: 'order', key: 'ed' + di, q: '짧은 대화를 차례대로 눌러요.', items: D.map(x => ({ t: x[0], sub: x[1] })), a: { di }, h: ['대화를 여는 말(인사, 물음, 놀란 말)을 먼저 찾아봐요.', '앞사람 말에 알맞게 대답하는 말이 바로 뒤에 와요.'], why: '대화는 ' + D.map(x => '"' + x[0].slice(3) + '"').join(' → ') + ' 차례예요. 물음 다음에 대답, 인사 다음에 인사가 와요.', learn: '물음 → 대답 차례로 이어져요.' }; } };
for (const k in E) E[k].id = 'english:' + k;

// ───────── 과학(손으로 쓴 사실 · 교과서 흔한 문장) + 코딩(로봇) ─────────
//   F(id, lv, 물음, 정답, [틀린 보기], 힌트1, 힌트2, 까닭, 오늘 배운 것) · O = 차례 문제(items 차례가 정답)
const F = (id, lv, q, right, wr, h1, h2, why, learn) => ({ id, lv, q, right, wr, h: [h1, h2], why, learn });
const O = (id, lv, q, items, h1, h2, why, learn) => ({ id, lv, order: items, q, h: [h1, h2], why, learn });
export const SCI = [
  F('shadow', 1, '그림자가 생기려면 무엇이 있어야 할까요?', '빛과 빛을 가리는 물체', ['물과 바람', '소리와 물체', '어둠만 있으면 돼요'], '해가 쨍한 날과 깜깜한 밤을 떠올려 봐요.', '빛이 물체에 막히면 그 뒤에 그림자가 생겨요.', '그림자는 빛이 나아가다 물체에 막혀, 그 뒤쪽에 빛이 닿지 않아 생겨요. 그래서 빛과 물체가 함께 있어야 해요.', '그림자 = 빛 + 빛을 가리는 물체'),
  F('sprout', 1, '씨가 싹 트는 데 꼭 필요한 두 가지는?', '알맞은 온도와 물', ['햇빛과 흙', '바람과 소금', '어둠과 얼음'], '젖은 솜 위에서도 씨는 싹 터요. 흙이 꼭 있어야 할까요?', '물을 준 씨와 안 준 씨, 따뜻한 곳과 추운 곳을 견주어 봐요.', '씨는 흙이나 햇빛이 없어도 물과 알맞은 온도가 있으면 싹 터요. 젖은 솜 위의 강낭콩도 싹이 나요.', '싹 트기에 필요한 것 = 물 + 알맞은 온도'),
  F('root', 1, '강낭콩 씨가 싹 틀 때 가장 먼저 나오는 것은?', '뿌리', ['꽃', '열매', '꼬투리'], '씨가 물을 빨아들여 부풀면 껍질이 갈라져요.', '땅속으로 자라 물을 빨아들이는 부분을 떠올려 봐요.', '강낭콩은 싹 틀 때 뿌리가 먼저 나와 땅속으로 자라고, 그다음 떡잎이 땅 위로 올라와요.', '강낭콩은 싹 틀 때 뿌리가 먼저 나와요.'),
  F('magnet', 1, '철 가루와 모래가 섞여 있어요. 무엇으로 쉽게 나눌까요?', '자석', ['물', '돋보기', '숟가락'], '둘 가운데 한쪽만 가진 성질을 찾아봐요.', '철은 어떤 물건에 끌려가요?', '철 가루는 자석에 붙고 모래는 붙지 않아요. 그래서 자석을 대면 철 가루만 따로 모을 수 있어요.', '자석에 붙는 성질로 철을 골라내요.'),
  F('lava', 1, '화산이 분출할 때 나오는 것 가운데 액체인 것은?', '용암', ['화산재', '화산 가스', '화산암 조각'], '고체, 액체, 기체 가운데 흐르는 것을 찾아요.', '뜨거워서 녹은 돌이 흘러내리는 것이에요.', '화산 분출물 가운데 화산 가스는 기체, 용암은 액체, 화산재와 화산암 조각은 고체예요.', '용암은 화산에서 나오는 액체예요.'),
  F('evap', 1, '젖은 빨래가 햇볕에 마르는 것과 같은 현상은?', '증발', ['응결', '얼음이 됨', '녹음'], '빨래 속 물이 어디로 갔을까요?', '물이 물 표면에서 수증기가 되어 공기 중으로 날아가는 것을 뭐라고 할까요?', '빨래의 물은 표면에서 천천히 수증기로 바뀌어 공기 중으로 날아가요. 이것이 증발이에요.', '증발 = 물 표면에서 물이 수증기가 되는 것'),
  F('icevol', 2, '물이 얼어 얼음이 되면 부피는 어떻게 될까요?', '늘어나요', ['줄어들어요', '그대로예요'], '물을 가득 채워 얼린 페트병을 떠올려 봐요.', '얼린 뒤 병이 불룩해진 까닭을 생각해요.', '물이 얼면 부피가 늘어나요. 그래서 물을 가득 채운 병을 얼리면 병이 불룩해지거나 터지기도 해요.', '물이 얼면 부피는 늘어요.'),
  F('icewt', 2, '물이 얼어 얼음이 되면 무게는 어떻게 될까요?', '그대로예요', ['늘어나요', '줄어들어요'], '얼리는 동안 물이 더해지거나 빠져나갔나요?', '부피는 바뀌어도 들어 있는 물의 양은 같아요.', '물이 얼어도 물의 양은 그대로라서 무게는 변하지 않아요. 바뀌는 것은 부피예요.', '물이 얼어도 무게는 그대로예요.'),
  F('sieve', 2, '콩, 팥, 좁쌀이 섞여 있어요. 무엇으로 나누면 좋을까요?', '구멍 크기가 다른 체', ['자석', '물에 녹이기', '불에 굽기'], '세 가지 알갱이는 무엇이 달라요?', '알갱이 크기가 다르면 구멍으로 걸러 낼 수 있어요.', '콩, 팥, 좁쌀은 알갱이 크기가 달라요. 구멍 크기가 다른 체로 거르면 작은 것부터 빠져나가 나눌 수 있어요.', '알갱이 크기가 다르면 체로 나눠요.'),
  F('opaque', 2, '빛을 비출 때 그림자가 더 진한 것은?', '도자기 컵', ['투명한 유리컵', '투명한 비닐'], '빛이 잘 통과하는 것과 통과하지 못하는 것을 나눠 봐요.', '빛이 많이 막힐수록 그림자가 진해요.', '도자기 컵은 빛을 통과시키지 못해 진한 그림자가 생기고, 투명한 유리컵은 빛이 대부분 통과해 그림자가 연해요.', '빛을 통과시키지 못하는 물체일수록 그림자가 진해요.'),
  F('annual', 2, '한 해 안에 싹 트고 자라 열매를 맺고 죽는 식물은?', '벼', ['사과나무', '감나무', '개나리'], '여러 해 동안 사는 나무를 빼 봐요.', '봄에 모를 심고 가을에 거두는 식물이에요.', '벼는 한 해 동안 한살이를 마치는 한해살이 식물이에요. 사과나무, 감나무, 개나리는 여러 해를 사는 여러해살이 식물이에요.', '한해살이 식물: 벼, 강낭콩, 옥수수'),
  F('duckweed', 2, '물에 떠서 사는 식물은?', '개구리밥', ['선인장', '소나무', '민들레'], '연못 물 위를 덮은 작은 잎을 떠올려 봐요.', '뿌리가 물속에 늘어져 있고 잎이 물 위에 떠 있어요.', '개구리밥은 잎이 물 위에 뜨고 뿌리는 물속에 늘어져 사는 식물이에요.', '개구리밥은 물에 떠서 살아요.'),
  F('condense', 3, '차가운 물병 겉면에 물방울이 맺혔어요. 왜 그럴까요?', '공기 중 수증기가 차가운 겉면에 닿아 물이 되어서', ['병 안의 물이 새어 나와서', '병이 땀을 흘려서', '햇빛이 물로 바뀌어서'], '뚜껑을 꼭 닫아도 물방울이 맺혀요.', '공기 속에는 눈에 보이지 않는 수증기가 있어요.', '공기 중의 수증기가 차가운 물병 겉면에 닿으면 식어서 물방울이 돼요. 이것을 응결이라고 해요.', '응결 = 수증기가 식어 물이 되는 것'),
  F('cactus', 3, '선인장의 줄기가 굵고 통통한 까닭은?', '물을 저장하려고', ['추위를 막으려고', '벌레를 부르려고', '그늘을 만들려고'], '선인장은 비가 적게 오는 사막에서 살아요.', '비가 올 때 받아 둔 것을 오래 써야 해요.', '사막은 비가 드물어요. 선인장은 굵은 줄기에 물을 저장하고, 잎이 가시 모양이라 물이 덜 빠져나가요.', '선인장은 굵은 줄기에 물을 저장해요.'),
  F('shsize', 3, '손전등을 물체에 더 가까이 가져가면 그림자 크기는?', '커져요', ['작아져요', '그대로예요'], '손전등과 물체가 가까워지면 물체가 가리는 빛이 많아져요.', '손을 손전등 앞에 바짝 대 보면 그림자가 어떻게 될까요?', '손전등을 물체에 가까이 하면 물체가 빛을 더 넓게 가려서 스크린의 그림자가 커져요. 멀리 하면 작아져요.', '빛을 물체에 가까이 하면 그림자가 커져요.'),
  F('mirror', 3, '거울에 비친 모습은 실제와 무엇이 달라요?', '왼쪽과 오른쪽이 바뀌어 보여요', ['위와 아래가 바뀌어 보여요', '색깔이 바뀌어 보여요', '크기가 두 배가 돼요'], '거울 앞에서 오른손을 들어 봐요.', '거울 속 나는 어느 쪽 손을 들었나요?', '거울에 비친 물체는 위아래는 그대로이고 왼쪽과 오른쪽이 바뀌어 보여요.', '거울에 비친 모습은 좌우가 바뀌어 보여요.'),
  F('basalt', 3, '현무암의 특징으로 알맞은 것은?', '색이 어둡고 구멍이 있는 것이 많아요', ['색이 밝고 알갱이가 커요', '투명해서 빛이 통과해요', '물에 잘 녹아요'], '제주도 돌하르방을 만든 돌을 떠올려 봐요.', '용암이 빨리 식으며 가스가 빠져나간 자리가 남았어요.', '현무암은 용암이 땅 위나 땅 가까이에서 빨리 식어 만들어져 색이 어둡고 알갱이가 작으며, 가스가 빠져나간 구멍이 있는 것이 많아요.', '현무암: 어두운 색, 작은 알갱이, 구멍'),
  F('cloud', 3, '구름은 무엇으로 이루어져 있을까요?', '아주 작은 물방울이나 얼음 알갱이', ['연기', '솜', '모래 먼지'], '구름이 모여 무거워지면 무엇이 내려요?', '하늘 높이 올라간 수증기가 식으면 어떻게 될까요?', '공기 중 수증기가 높은 하늘에서 식으면 아주 작은 물방울이나 얼음 알갱이가 되어 떠 있어요. 이것이 구름이에요.', '구름 = 작은 물방울과 얼음 알갱이'),
  O('bean', 3, '강낭콩의 한살이를 차례대로 눌러요.', ['씨가 싹 터요', '잎과 줄기가 자라요', '꽃이 피어요', '꼬투리(열매)가 맺혀요'], '맨 처음은 씨에서 시작해요.', '꽃이 진 자리에 열매가 생겨요.', '강낭콩은 씨가 싹 트고, 잎과 줄기가 자라고, 꽃이 핀 뒤, 꽃이 진 자리에 꼬투리가 맺혀 그 안에 새 씨가 생겨요.', '씨 → 싹 → 잎과 줄기 → 꽃 → 열매(씨)'),
  F('hyacinth', 4, '부레옥잠이 물에 뜰 수 있는 까닭은?', '잎자루에 공기가 든 통통한 부분이 있어서', ['뿌리가 바닥에 박혀 있어서', '잎이 가시 모양이라서', '줄기가 아주 무거워서'], '부레옥잠 잎자루를 잘라 보면 속이 어떻게 생겼을까요?', '공기가 든 물건은 물에 떠요(튜브처럼).', '부레옥잠의 잎자루는 통통하게 부풀어 있고 속에 공기가 든 작은 방이 많아 물에 떠요.', '부레옥잠은 잎자루 속 공기로 물에 떠요.'),
  F('boilbub', 4, '물이 끓을 때 물속에서 생기는 큰 기포 안에는 무엇이 들어 있을까요?', '수증기', ['얼음', '모래', '연기'], '물이 끓으면 물의 양이 줄어요.', '물이 기체로 바뀐 것을 뭐라고 해요?', '물이 끓으면 물 표면뿐 아니라 물속에서도 물이 수증기로 바뀌어요. 그 수증기가 기포가 되어 올라와요.', '끓을 때 생기는 기포 = 수증기'),
  F('filter', 4, '모래와 소금이 섞인 물을 거름종이로 걸렀어요. 거름종이에 남는 것은?', '모래', ['소금', '물', '아무것도 안 남아요'], '물에 녹는 것과 녹지 않는 것을 나눠 봐요.', '물에 녹은 것은 물과 함께 거름종이를 빠져나가요.', '소금은 물에 녹아 물과 함께 거름종이를 빠져나가고, 물에 녹지 않는 모래는 거름종이 위에 남아요.', '물에 녹지 않는 것은 거름종이에 남아요.'),
  O('saltsep', 4, '소금과 모래를 나누는 차례대로 눌러요.', ['물에 넣어 소금을 녹여요', '거름종이로 걸러 모래를 남겨요', '거른 소금물의 물을 증발시켜요'], '먼저 둘 가운데 하나만 녹여야 해요.', '소금물에서 소금을 다시 얻으려면 물을 날려 보내요.', '물에 넣으면 소금만 녹고, 거름종이로 거르면 모래가 남아요. 거른 소금물을 가열하거나 햇볕에 두면 물이 증발해 소금이 남아요.', '녹이기 → 거르기 → 증발시키기'),
  F('quake', 4, '건물 안에 있을 때 땅이 흔들려요. 먼저 할 일은?', '튼튼한 탁자 밑으로 들어가 몸을 보호해요', ['엘리베이터를 타고 내려가요', '창문 옆에 서 있어요', '흔들리는 동안 계단으로 뛰어요'], '떨어지는 물건과 깨지는 유리에서 몸을 지켜야 해요.', '흔들림이 멈춘 뒤에 계단으로 밖으로 나가요.', '흔들릴 때는 탁자 밑에서 머리와 몸을 보호하고, 흔들림이 멈추면 엘리베이터 대신 계단으로 넓은 곳에 나가요.', '흔들리면 탁자 밑, 멈추면 계단으로 밖에'),
  F('granite', 4, '화강암의 특징으로 알맞은 것은?', '색이 밝고 알갱이가 커요', ['색이 어둡고 구멍이 많아요', '물에 넣으면 녹아요', '투명해서 빛이 통과해요'], '화강암은 땅속 깊은 곳에서 마그마가 천천히 식어 만들어져요.', '천천히 식으면 알갱이가 크게 자랄 시간이 있어요.', '화강암은 마그마가 땅속 깊은 곳에서 천천히 식어 만들어져 알갱이가 크고, 대체로 밝은 색이에요.', '화강암: 밝은 색, 큰 알갱이'),
  F('evboil', 5, '증발과 끓음의 다른 점으로 알맞은 것은?', '끓음은 물 표면과 물속에서 모두 수증기가 생겨요', ['증발은 물이 얼음으로 바뀌는 거예요', '끓음은 물이 차가워질 때 일어나요', '증발은 아주 빠르게 일어나요'], '증발은 물 표면에서만 일어나요.', '끓는 물속에서 올라오는 기포를 떠올려 봐요.', '증발은 물 표면에서 천천히, 끓음은 물을 가열했을 때 물 표면과 물속에서 빠르게 물이 수증기로 바뀌는 거예요.', '증발은 표면에서 천천히, 끓음은 물속까지 빠르게'),
  O('wcycle', 5, '물의 여행을 차례대로 눌러요. 바다에서 시작해요.', ['바닷물이 증발해 수증기가 돼요', '수증기가 식어 구름이 돼요', '구름에서 비나 눈이 내려요', '빗물이 강을 따라 바다로 흘러가요'], '바다의 물이 하늘로 올라가는 것부터예요.', '하늘의 수증기가 식어야 비가 될 수 있어요.', '물은 증발해 수증기가 되고, 식어서 구름이 되고, 비나 눈으로 내려 강을 따라 다시 바다로 가요. 물은 이렇게 돌고 돌아요.', '증발 → 구름 → 비와 눈 → 강 → 바다'),
  F('perennial', 5, '여러 해를 살며 해마다 꽃이 피고 열매를 맺는 식물은?', '사과나무', ['벼', '옥수수', '강낭콩'], '한 해 만에 죽는 식물을 빼 봐요.', '해마다 같은 나무에서 열매를 따는 것을 떠올려요.', '사과나무는 여러 해를 살면서 해마다 꽃을 피우고 열매를 맺는 여러해살이 식물이에요. 벼, 옥수수, 강낭콩은 한해살이예요.', '여러해살이 식물: 사과나무, 감나무'),
  F('reflect', 5, '빛이 거울에 부딪혀 나아가는 방향이 바뀌는 것을 무엇이라고 할까요?', '빛의 반사', ['증발', '응결', '그림자'], '거울로 햇빛을 벽에 비추어 본 적이 있나요?', '빛이 튕겨 나가는 것을 뭐라고 해요?', '빛은 곧게 나아가다 거울에 부딪히면 방향이 바뀌어 나아가요. 이것을 빛의 반사라고 해요.', '빛의 반사 = 거울에서 빛의 방향이 바뀌는 것'),
  F('saltpan', 5, '염전에서 바닷물로 소금을 얻을 수 있는 까닭은?', '햇볕과 바람에 바닷물의 물이 증발해서', ['바닷물이 얼어서', '모래가 소금으로 바뀌어서', '비가 소금을 내려 줘서'], '소금물에서 물만 날아가면 무엇이 남을까요?', '젖은 빨래가 마르는 것과 같은 현상이에요.', '염전에 가둔 바닷물이 햇볕과 바람에 증발하면 물은 날아가고 녹아 있던 소금이 남아요.', '염전 = 바닷물을 증발시켜 소금을 얻는 곳'),
];
function factProb(f, pre) { if (f.order) return { kind: 'order', key: pre + f.id, q: f.q, items: f.order.map(t => ({ t })), h: f.h, why: f.why, learn: f.learn, a: { fact: f.id } }; return pmk({ key: pre + f.id, q: f.q, ch: [f.right].concat(f.wr).map(t => ({ t })), h: f.h, why: f.why, learn: f.learn, a: { fact: f.id } }); }
function factGen(list, pre) { return (r, L, used) => { let pool = list.filter(f => f.lv === L && !used.has(pre + f.id)); if (!pool.length) pool = list.filter(f => f.lv <= L && !used.has(pre + f.id)); if (!pool.length) pool = list.filter(f => !used.has(pre + f.id)); if (!pool.length) pool = list; return factProb(pk(r, pool), pre); }; }
// 로봇 길 찾기: 5×5 칸 · 0 = 북(위) 1 = 동 2 = 남 3 = 서 · 블록 F 앞으로 · L 왼쪽으로 돌기 · R 오른쪽으로 돌기 · { n, b: [블록] } = n번 되풀이
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0], GN = 5;
export function robotRun(prog, st, rocks) { let x = st[0], y = st[1], d = st[2]; const rs = new Set((rocks || []).map(p => p[0] + ',' + p[1])); const step = b => { if (b === 'F') { x += DX[d]; y += DY[d]; if (x < 0 || y < 0 || x >= GN || y >= GN || rs.has(x + ',' + y)) return false; } else if (b === 'L') d = (d + 3) % 4; else if (b === 'R') d = (d + 1) % 4; return true; };
  for (const b of prog) { if (typeof b === 'object') { for (let i = 0; i < b.n; i++) for (const c of b.b) if (!step(c)) return null; } else if (!step(b)) return null; } return [x, y, d]; }
const progS = p => p.map(b => (typeof b === 'object' ? 'x' + b.n + '(' + b.b.join('') + ')' : b)).join(' ');
export const BLK = { F: ['⬆', '앞으로'], L: ['↺', '왼쪽으로 돌기'], R: ['↻', '오른쪽으로 돌기'] };
const progT = p => p.map(b => (typeof b === 'object' ? '🔁' + b.n + '[' + b.b.map(c => BLK[c][0]).join('') + ']' : BLK[b][0])).join(' ');
function svgRobot(st, goal, rocks) { const C = 40, O = 10; let g = ''; for (let i = 0; i <= GN; i++) g += '<line x1="' + (O + i * C) + '" y1="' + O + '" x2="' + (O + i * C) + '" y2="' + (O + GN * C) + '" stroke="' + GRID + '" stroke-width="2"/><line x1="' + O + '" y1="' + (O + i * C) + '" x2="' + (O + GN * C) + '" y2="' + (O + i * C) + '" stroke="' + GRID + '" stroke-width="2"/>';
  (rocks || []).forEach(p => { g += '<circle cx="' + (O + p[0] * C + 20) + '" cy="' + (O + p[1] * C + 21) + '" r="14" fill="#8a9098" stroke="' + INK + '" stroke-width="2"/>'; });
  const sx = O + goal[0] * C + 20, sy = O + goal[1] * C + 20; let s = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 6.5 : 15; s += (sx + Math.cos(a) * rr).toFixed(1) + ',' + (sy + Math.sin(a) * rr).toFixed(1) + ' '; }
  g += '<polygon points="' + s + '" fill="#f2c230" stroke="' + INK + '" stroke-width="2"/>';
  const rx = O + st[0] * C + 20, ry = O + st[1] * C + 20, a = st[2] * Math.PI / 2, tip = [rx + Math.sin(a) * 15, ry - Math.cos(a) * 15], l = [rx + Math.sin(a + 2.4) * 12, ry - Math.cos(a + 2.4) * 12], rr = [rx + Math.sin(a - 2.4) * 12, ry - Math.cos(a - 2.4) * 12];
  g += '<circle cx="' + rx + '" cy="' + ry + '" r="16" fill="#3b6fb6" stroke="' + INK + '" stroke-width="2"/><polygon points="' + [tip, l, rr].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="#ffffff"/>';
  return svgW(O * 2 + GN * C, O * 2 + GN * C, g); }
function robotGen(r, L) { const nSeg = L === 1 ? 1 : L === 2 ? 2 : 3, segs = []; for (let i = 0; i < nSeg; i++) segs.push({ n: L === 1 ? ri(r, 2, 3) : L === 2 ? ri(r, 1, 3) : L === 3 ? ri(r, 1, 2) : L === 4 ? ri(r, 1, 4) : ri(r, 2, 4), t: i < nSeg - 1 ? pk(r, ['L', 'R']) : null });
  if (L === 4 && segs.every(s => s.n < 3)) segs[ri(r, 0, nSeg - 1)].n = 3;
  const st = [ri(r, 0, 4), ri(r, 0, 4), ri(r, 0, 3)]; let x = st[0], y = st[1], d = st[2]; const path = new Set([x + ',' + y]), raw = [];
  for (const s of segs) { for (let i = 0; i < s.n; i++) { x += DX[d]; y += DY[d]; if (x < 0 || y < 0 || x >= GN || y >= GN || path.has(x + ',' + y)) return null; path.add(x + ',' + y); raw.push('F'); } if (s.t) { raw.push(s.t); d = s.t === 'L' ? (d + 3) % 4 : (d + 1) % 4; } }
  const goal = [x, y]; const rocks = []; if (L >= 3) { const free = []; for (let i = 0; i < GN; i++) for (let j = 0; j < GN; j++) if (!path.has(i + ',' + j)) free.push([i, j]); const near = free.filter(p => [...path].some(q => { const [a, b] = q.split(',').map(Number); return Math.abs(a - p[0]) + Math.abs(b - p[1]) === 1; })); for (const p of shuf(r, near).slice(0, L === 5 ? 2 : 1)) rocks.push(p); }
  const pack = p => { if (L < 4) return p; const out = []; for (let i = 0; i < p.length;) { if (p[i] === 'F') { let j = i; while (p[j] === 'F') j++; const n = j - i; if (n >= 3 || (n === 2 && L === 5)) out.push({ n, b: ['F'] }); else for (let k = 0; k < n; k++) out.push('F'); i = j; } else out.push(p[i++]); } return out; };
  const right = pack(raw); const ok = p => { const e = robotRun(p, st, rocks); return !!e && e[0] === goal[0] && e[1] === goal[1]; }; if (!ok(right)) return null;
  const muts = []; const segToRaw = S => { const p = []; S.forEach(s => { for (let i = 0; i < s.n; i++) p.push('F'); if (s.t) p.push(s.t); }); return p; };
  for (let k = 0; k < nSeg; k++) { for (const dn of [1, -1]) { const S = segs.map(s => ({ ...s })); S[k].n += dn; if (S[k].n >= 1) muts.push(pack(segToRaw(S))); } if (segs[k].t) { const S = segs.map(s => ({ ...s })); S[k].t = S[k].t === 'L' ? 'R' : 'L'; muts.push(pack(segToRaw(S))); } }
  if (nSeg === 1) { muts.push(pack(['R'].concat(raw))); muts.push(pack(['L'].concat(raw))); }
  const seen = new Set([progS(right)]), wrong = []; for (const m of shuf(r, muts)) { const k = progS(m); if (seen.has(k) || ok(m)) continue; seen.add(k); wrong.push(m); if (wrong.length >= 3) break; }
  if (wrong.length < 2) return null; const rep = L >= 4;
  const walk = []; segs.forEach(s => { walk.push('앞으로 ' + s.n + '칸'); if (s.t) walk.push(s.t === 'L' ? '왼쪽으로 돌기' : '오른쪽으로 돌기'); });
  return pmk({ key: 'rb' + st.join('') + progS(right), q: '로봇이 ⭐에 닿으려면 어떤 블록 차례가 알맞을까요?', pic: svgRobot(st, goal, rocks), ch: [right].concat(wrong).map(p => ({ t: progT(p), prog: p })), a: { st, goal, rocks },
    h: ['로봇이 지금 보는 쪽(흰 세모 끝)을 먼저 확인해요.' + (rocks.length ? ' 회색 돌은 지나갈 수 없어요.' : ''), '⬆ 하나는 한 칸 앞으로, ↺ ↻는 그 자리에서 몸만 돌아요.' + (rep ? ' 🔁3[⬆]는 ⬆ 세 개와 같아요.' : '')], why: '로봇이 ' + walk.join(', ') + ' 가면 ⭐에 닿아요. 블록은 위에서부터 차례대로 실행돼요.', learn: rep ? '🔁 반복 블록으로 같은 블록을 짧게 써요.' : '블록은 차례대로 하나씩 실행돼요.' }); }
const SC = { fact: { lo: 1, hi: 5, id: 'science:fact', gen: factGen(SCI, 'sci:') }, robot: { lo: 1, hi: 5, id: 'science:robot', gen: (r, L) => tryGen(robotGen, r, L, 60) } };

// ───────── 독서·논술·공부방 ─────────
const STW = [['"멍멍"은 무엇을 흉내 낸 말일까요?', '소리', ['모양', '색깔', '냄새'], '멍멍은 개가 짖는 소리를 흉내 낸 말이에요.'], ['"방긋"은 무엇을 흉내 낸 말일까요?', '모양', ['소리', '맛', '냄새'], '방긋은 입을 벌리고 웃는 모양을 흉내 낸 말이에요.'], ['"졸졸"은 무엇을 흉내 낸 말일까요? (시냇물이 졸졸 흘러요.)', '소리', ['모양', '색깔', '맛'], '졸졸은 물이 흐르는 소리를 흉내 낸 말이에요.'], ['"엉금엉금"은 무엇을 흉내 낸 말일까요? (거북이 엉금엉금 기어요.)', '모양', ['소리', '냄새', '맛'], '엉금엉금은 느리게 기어가는 모양을 흉내 낸 말이에요.'], ['"쨍그랑"은 무엇을 흉내 낸 말일까요?', '소리', ['모양', '색깔', '냄새'], '쨍그랑은 유리 같은 것이 깨지는 소리를 흉내 낸 말이에요.'], ['"반짝반짝"은 무엇을 흉내 낸 말일까요? (별이 반짝반짝 빛나요.)', '모양', ['소리', '맛', '냄새'], '반짝반짝은 빛이 나는 모양을 흉내 낸 말이에요.']];
const STH = [['할머니께 밥을 드시라고 말할 때 알맞은 말은?', '할머니, 진지 드세요.', ['할머니, 밥 먹어.', '할머니, 밥 줘.', '할머니, 밥 먹자.'], '어른께는 "밥" 대신 "진지", "먹어" 대신 "드세요"처럼 높임말을 써요.'], ['교실을 나가며 선생님께 드리는 인사로 알맞은 것은?', '안녕히 계세요.', ['잘 있어.', '안녕.', '또 봐.'], '어른께는 "안녕히 계세요"처럼 높임말로 인사해요.'], ['할아버지의 나이를 여쭐 때 알맞은 말은?', '할아버지, 연세가 어떻게 되세요?', ['할아버지, 몇 살이야?', '할아버지, 나이가 뭐야?', '할아버지, 몇 살 먹었어?'], '어른의 나이는 "연세"라고 높여 말해요.']];
const HOMO = [['배가 고파서 밥을 먹었어요.', '배', '사람이나 동물의 몸 가운데 부분', ['물 위를 다니는 탈것', '단맛이 나는 과일']], ['배를 타고 섬에 갔어요.', '배', '물 위를 다니는 탈것', ['사람이나 동물의 몸 가운데 부분', '단맛이 나는 과일']], ['눈이 펑펑 와서 눈사람을 만들었어요.', '눈', '하늘에서 내리는 하얀 얼음 알갱이', ['물체를 보는 몸의 한 부분', '새싹이 돋아나는 자리']], ['눈에 티가 들어가 눈물이 났어요.', '눈', '물체를 보는 몸의 한 부분', ['하늘에서 내리는 하얀 얼음 알갱이', '새싹이 돋아나는 자리']], ['다리를 건너 마을로 갔어요.', '다리', '물이나 길 위를 건너가게 만든 것', ['몸을 받치고 걷게 하는 부분', '책상을 받치는 부분']], ['오래 걸었더니 다리가 아파요.', '다리', '몸을 받치고 걷게 하는 부분', ['물이나 길 위를 건너가게 만든 것', '안경을 귀에 거는 부분']], ['말을 타고 들판을 달렸어요.', '말', '갈기가 있고 빨리 달리는 동물', ['사람이 생각을 소리로 나타내는 것', '곡식의 양을 재는 그릇']], ['동생이 말을 또박또박 잘해요.', '말', '사람이 생각을 소리로 나타내는 것', ['갈기가 있고 빨리 달리는 동물', '곡식의 양을 재는 그릇']]];
const FACTS_S = ['개미는 다리가 여섯 개예요.', '해는 동쪽에서 떠요.', '일주일은 칠 일이에요.', '거북은 알을 낳아요.', '봄에는 개나리와 진달래가 피어요.', '우리나라의 수도는 서울이에요.', '물은 0도가 되면 얼기 시작해요.', '태극기에는 검은 괘가 네 개 있어요.'];
const OPIN_S = ['여름이 가장 좋은 계절이에요.', '고양이가 강아지보다 더 귀여워요.', '축구는 가장 재미있는 운동이에요.', '떡볶이는 세상에서 제일 맛있는 음식이에요.', '파란색은 정말 멋진 색이에요.', '책 읽기는 그림 그리기보다 즐거워요.', '비 오는 날은 기분이 좋아요.'];
const CONJ = [['비가 많이 왔어요.', '우산을 쓰고 학교에 갔어요.', '그래서'], ['열심히 달렸어요.', '버스를 놓치고 말았어요.', '그러나'], ['사과를 샀어요.', '배도 샀어요.', '그리고'], ['날씨가 무척 추웠어요.', '두꺼운 외투를 입었어요.', '그래서'], ['숙제를 다 했어요.', '일기도 썼어요.', '그리고'], ['동생은 키가 작아요.', '달리기는 아주 빨라요.', '그러나'], ['배가 몹시 고팠어요.', '밥을 두 그릇이나 먹었어요.', '그래서'], ['약속 시간에 맞춰 나갔어요.', '친구는 오지 않았어요.', '그러나']];
const CONJ_W = { 그래서: '앞 문장이 까닭, 뒤 문장이 결과라서 "그래서"를 써요.', 그러나: '앞 문장과 뒤 문장이 서로 반대되는 내용이라 "그러나"를 써요.', 그리고: '앞 문장에 비슷한 내용을 덧붙여서 "그리고"를 써요.' };
const SPL = [['선생님께서 우리에게 한글을 (  ).', '가르쳐 주셨어요', '가리켜 주셨어요', '"가르치다"는 지식이나 방법을 알려 주는 것, "가리키다"는 손가락 등으로 방향이나 물건을 짚는 거예요.'], ['동생이 손가락으로 하늘의 별을 (  ).', '가리켰어요', '가르쳤어요', '"가리키다"는 손가락 등으로 방향이나 물건을 짚는 것, "가르치다"는 지식을 알려 주는 거예요.'], ['빌린 책은 (  ) 돌려줘야 해요.', '반드시', '반듯이', '"반드시"는 "꼭", "반듯이"는 "비뚤지 않고 바르게"라는 뜻이에요.'], ['줄을 (  ) 맞춰 서요.', '반듯이', '반드시', '"반듯이"는 "비뚤지 않고 바르게", "반드시"는 "꼭"이라는 뜻이에요.'], ['(  ) 뒤에 다시 만나요.', '며칠', '몇일', '"며칠"이 바른 말이에요. "몇일"이라고 쓰지 않아요.'], ['숙제를 다 해야 (  ).', '돼요', '되요', '"되어요"를 줄이면 "돼요"예요.'], ['오늘은 (  ) 기분이 좋아요.', '왠지', '웬지', '"왜인지"를 줄인 말이라 "왠지"예요.'], ['이게 (  ) 일이야?', '웬', '왠', '"어찌 된"이라는 뜻일 때는 "웬"을 써요.']];
// 짧은 글: [제목, 문장 넷, 중심 문장 번호(-1 = 중심 문장 문제 아님), 의견 문장 번호(-1 = 없음)]
const PASS = [['갯벌', ['갯벌은 여러 생물이 함께 사는 소중한 곳이에요.', '갯벌에는 게와 조개, 갯지렁이가 살아요.', '철새들은 먼 길을 가다 갯벌에 들러 먹이를 먹어요.', '갯벌의 흙과 생물은 더러워진 물을 깨끗하게 하는 데 도움을 줘요.'], 0, -1], ['김장', ['김장은 겨울을 준비하는 우리 고유의 문화예요.', '늦가을에 배추를 소금에 절이고 양념을 버무려요.', '이웃이나 친척이 모여 함께 담그고 나누기도 해요.', '우리나라의 김장 문화는 2013년에 유네스코 인류무형문화유산이 되었어요.'], 0, -1], ['나누어 버리기', ['종이, 플라스틱, 캔은 따로 모아서 내놓아요.', '우유갑은 씻어 말린 뒤 종이팩으로 따로 모아요.', '음식물 쓰레기는 물기를 빼서 버려요.', '이렇게 쓰레기를 나누어 버리면 다시 쓸 수 있는 자원이 많아져요.'], 3, -1], ['자전거 안전', ['자전거를 탈 때는 안전 규칙을 꼭 지켜야 해요.', '머리를 보호하는 안전모를 써요.', '어두울 때는 앞뒤에 불빛을 켜요.', '횡단보도를 건널 때는 자전거에서 내려 끌고 가요.'], 0, -1], ['단오', ['단오에는 여러 가지 풍습이 있었어요.', '창포를 삶은 물에 머리를 감았어요.', '그네뛰기와 씨름을 하며 놀았어요.', '부채를 선물하며 더운 여름을 잘 보내라고 빌었어요.'], 0, -1], ['상추 씨', ['나는 주말에 할머니 댁 텃밭에서 상추 씨를 뿌렸어요.', '상추 씨는 깨알처럼 아주 작았어요.', '상추는 처음 텃밭을 가꾸는 사람에게 가장 좋은 채소예요.', '할머니께서는 한 달쯤 지나면 잎을 딸 수 있다고 하셨어요.'], -1, 2], ['도서관', ['도서관에서는 책을 빌려 읽을 수 있어요.', '빌린 책은 정해진 날까지 돌려줘야 해요.', '도서관은 주말을 보내기에 가장 좋은 곳이에요.', '도서관 안에서는 작은 목소리로 말해요.'], -1, 2], ['겨울잠', ['곰과 개구리는 추운 겨울 동안 겨울잠을 자요.', '곰은 가을에 먹이를 많이 먹어 몸에 영양분을 저장해요.', '겨울잠을 자는 동물들은 정말 대단해요.', '봄이 되어 날씨가 따뜻해지면 겨울잠에서 깨어나요.'], -1, 2]];
export const ST_PASS = PASS;
const ST = {};
ST.st_word = { lo: 1, hi: 1, gen(r) { if (r() < 0.6) { const x = pk(r, STW); return pmk({ key: 'sw' + x[0], q: x[0], ch: [x[1]].concat(x[2]).map(t => ({ t })), a: { right: x[1] }, h: ['소리를 흉내 낸 말인지, 모양을 흉내 낸 말인지 생각해요.', '귀로 들리면 소리, 눈으로 보이면 모양이에요.'], why: x[3], learn: '흉내 내는 말: 소리를 흉내 내는 말, 모양을 흉내 내는 말' }); }
  const x = pk(r, STH); return pmk({ key: 'sh' + x[0], q: x[0], ch: [x[1]].concat(x[2]).map(t => ({ t })), a: { right: x[1] }, h: ['어른께 말할 때는 높임말을 써요.', '"-세요", "-습니다"처럼 높이는 말을 찾아봐요.'], why: x[3], learn: '어른께는 높임말을 써요.' }); } };
ST.st_homo = { lo: 1, hi: 4, gen(r) { const x = pk(r, HOMO); return pmk({ key: 'so' + x[0], q: '"' + x[0] + '"에서 "' + x[1] + '"의 뜻은?', ch: [x[2]].concat(x[3]).map(t => ({ t })), a: { right: x[2] }, h: ['같은 소리라도 뜻이 여러 가지인 낱말이 있어요.', '앞뒤 말을 보고 어떤 뜻인지 짐작해 봐요.'], why: '이 문장에서 ' + jo('"' + x[1] + '"', '은', '는') + ' ' + jo('"' + x[2] + '"', '이라는', '라는') + ' 뜻이에요. 앞뒤 말을 보면 알 수 있어요.', learn: '소리가 같은 낱말은 앞뒤 말로 뜻을 알아요.' }); } };
ST.st_fo = { lo: 2, hi: 3, gen(r) { const opi = r() < 0.6, one = opi ? pk(r, OPIN_S) : pk(r, FACTS_S), oth = shuf(r, opi ? FACTS_S : OPIN_S).slice(0, 3);
  return pmk({ key: 'sf' + one, q: (opi ? '의견' : '사실') + '을 나타낸 문장을 골라요.', ch: [one].concat(oth).map(t => ({ t })), a: { opi, right: one }, h: ['사실은 맞는지 확인할 수 있는 것, 의견은 생각이나 느낌이에요.', '"가장", "제일", "더 귀여워요"처럼 사람마다 다를 수 있는 말을 찾아봐요.'], why: jo('"' + one + '"', '은', '는') + ' ' + (opi ? '사람마다 생각이 다를 수 있어서 의견이에요. 나머지는 사실인지 확인할 수 있어요.' : '누구나 확인할 수 있어서 사실이에요. 나머지는 사람마다 생각이 다른 의견이에요.'), learn: '사실 = 확인할 수 있는 것, 의견 = 생각이나 느낌' }); } };
ST.st_conj = { lo: 3, hi: 3, gen(r) { const x = pk(r, CONJ); return pmk({ key: 'sc' + x[0], q: '빈칸에 알맞은 이어 주는 말은? "' + x[0] + ' (  ) ' + x[1] + '"', ch: [x[2]].concat(['그래서', '그러나', '그리고', '왜냐하면'].filter(w => w !== x[2])).map(t => ({ t })), a: { right: x[2] }, h: ['앞 문장과 뒤 문장이 어떤 사이인지 봐요.', '까닭과 결과면 "그래서", 반대면 "그러나", 덧붙이면 "그리고"예요.'], why: CONJ_W[x[2]], learn: '그래서 = 까닭과 결과, 그러나 = 반대, 그리고 = 덧붙임' }); } };
ST.st_spell = { lo: 3, hi: 4, gen(r) { const x = pk(r, SPL); return pmk({ key: 'sp' + x[0], q: '바르게 쓴 말을 골라요. "' + x[0] + '"', ch: [x[1], x[2]].map(t => ({ t })), a: { right: x[1] }, h: ['두 낱말의 뜻을 떠올려 봐요.', '문장의 뜻에 맞는 낱말이 무엇인지 봐요.'], why: x[3], learn: '헷갈리는 말: ' + x[1] + '(바른 말)' }); } };
ST.st_main = { lo: 4, hi: 5, gen(r) { const P = pk(r, PASS.filter(p => p[2] >= 0)), m = P[2], oth = [0, 1, 2, 3].filter(i => i !== m);
  return pmk({ key: 'sm' + P[0], q: '글을 읽고 중심 문장을 골라요.', text: P[1].join(' '), long: true, ch: [m].concat(oth).map(i => ({ t: P[1][i] })), a: { pass: P[0], m },
    h: ['중심 문장은 문단 전체가 말하려는 생각을 담은 문장이에요.', '나머지 문장들이 어떤 문장을 자세히 설명하는지 찾아봐요.'], why: '나머지 문장들이 모두 ' + jo('"' + P[1][m] + '"', '을', '를') + ' 뒷받침하는 내용이라 이 문장이 중심 문장이에요.', learn: '중심 문장 = 문단의 중심 생각, 뒷받침 문장 = 자세한 설명' }); } };
ST.st_opin = { lo: 5, hi: 5, gen(r) { const P = pk(r, PASS.filter(p => p[3] >= 0)), m = P[3], oth = [0, 1, 2, 3].filter(i => i !== m);
  return pmk({ key: 'so' + P[0], q: '글을 읽고 의견을 나타낸 문장을 골라요.', text: P[1].join(' '), long: true, ch: [m].concat(oth).map(i => ({ t: P[1][i] })), a: { pass: P[0], m },
    h: ['있었던 일이나 확인할 수 있는 것은 사실이에요.', '"가장", "정말" 같은 말이 들어간 생각을 찾아봐요.'], why: jo('"' + P[1][m] + '"', '은', '는') + ' 글쓴이의 생각이라 의견이에요. 다른 문장은 있었던 일이나 확인할 수 있는 사실이에요.', learn: '글에서 사실과 의견을 나누어 읽어요.' }); } };
for (const k in ST) ST[k].id = 'study:' + k;

// ───────── 미술 ─────────
export const PAINT = { 빨강: '#d8262e', 노랑: '#f2c230', 파랑: '#2f6fd0', 주황: '#ef8b33', 초록: '#3f9f4e', 보라: '#7d4bb8', 하양: '#ffffff', 검정: '#2b2420', 분홍: '#f4a6b8', 갈색: '#8a5a3a', 청록: '#2fa0a0', 남색: '#25407a' };
const MIX = [['빨강', '노랑', '주황', '빨강과 노랑 사이에는 귤 색이 있어요.'], ['노랑', '파랑', '초록', '노랑과 파랑 사이에는 나뭇잎 색이 있어요.'], ['빨강', '파랑', '보라', '빨강과 파랑 사이에는 포도 색이 있어요.']];
const hx2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), toHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mixC = (a, b, t) => { const A = hx2(a), B = hx2(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const lum = h => { const c = hx2(h); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; };
const AR = {};
AR.art_mix = { lo: 1, hi: 5, gen(r, L) { const m = pk(r, MIX);
  if (L === 1 || (L >= 3 && r() < 0.5)) { const oth = ['주황', '초록', '보라', '분홍', '갈색'].filter(x => x !== m[2]); return pmk({ key: 'am' + m[2], q: jo(m[0], '과', '와') + ' ' + m[1] + ' 물감을 섞으면 어떤 색이 될까요?', vis: { sw: [PAINT[m[0]], PAINT[m[1]]], plus: 1 }, ch: [m[2]].concat(shuf(r, oth).slice(0, 3)).map(t => ({ t, sw: PAINT[t] })), a: { mix: m },
    h: ['섞으면 두 색의 중간쯤 되는 색이 나와요.', m[3]], why: m[0] + ' + ' + m[1] + ' = ' + m[2] + '. 물감은 섞으면 두 색의 중간색이 돼요.', learn: m[0] + ' + ' + m[1] + ' = ' + m[2] }); }
  const pairs = MIX.map(x => x[0] + ' + ' + x[1]).concat(['하양 + 검정']), right = m[0] + ' + ' + m[1];
  return pmk({ key: 'am2' + m[2], q: m[2] + ' 물감을 만들려면 어떤 두 색을 섞을까요?', vis: { sw: [PAINT[m[2]]] }, ch: [right].concat(pairs.filter(p => p !== right)).map(t => ({ t, sw2: t.split(' + ').map(n => PAINT[n]) })), a: { mix: m },
    h: [m[2] + '에는 어떤 두 색이 함께 보이는지 떠올려 봐요.', m[3]], why: jo(m[0], '과', '와') + ' ' + jo(m[1], '을', '를') + ' 섞으면 ' + jo(m[2], '이', '가') + ' 돼요.', learn: m[0] + ' + ' + m[1] + ' = ' + m[2] }); } };
AR.art_temp = { lo: 1, hi: 5, gen(r) { const warm = r() < 0.5, W = ['빨강', '주황', '노랑'], C = ['파랑', '청록', '남색'], right = pk(r, warm ? W : C), oth = shuf(r, warm ? C : W).slice(0, 3);
  return pmk({ key: 'at' + right, q: (warm ? '따뜻한' : '차가운') + ' 느낌이 드는 색은?', ch: [right].concat(oth).map(t => ({ t, sw: PAINT[t] })), a: { warm, right },
    h: ['불, 해, 바다, 얼음을 떠올려 봐요.', (warm ? '불이나 해처럼' : '물이나 얼음처럼') + ' 보이는 색을 골라요.'], why: '빨강, 주황, 노랑은 불과 해가 떠올라 따뜻한 색, 파랑, 청록, 남색은 물과 얼음이 떠올라 차가운 색이에요.', learn: '따뜻한 색 = 빨강, 주황, 노랑 / 차가운 색 = 파랑, 청록, 남색' }); } };
AR.art_tint = { lo: 3, hi: 5, gen(r, L) { const base = pk(r, ['빨강', '파랑', '초록', '보라']), B = PAINT[base];
  if (L === 3 || (L === 5 && r() < 0.5)) { const white = r() < 0.5, right = white ? mixC(B, '#ffffff', 0.55) : mixC(B, '#000000', 0.5), wrong = white ? mixC(B, '#000000', 0.5) : mixC(B, '#ffffff', 0.55), other = PAINT[pk(r, ['노랑', '주황', '갈색'])];
    return pmk({ key: 'ati' + base + white, q: base + '에 ' + (white ? '하양' : '검정') + '을 섞으면 어떤 색이 될까요?', vis: { sw: [B, white ? '#ffffff' : '#000000'], plus: 1 }, ch: [[right, (white ? '밝은 ' : '어두운 ') + base], [wrong, (white ? '어두운 ' : '밝은 ') + base], [other, '다른 색']].map(x => ({ t: x[1], sw: x[0] })), a: { base, white, sw: [right, wrong, other] },
      h: ['하양을 섞으면 밝아지고, 검정을 섞으면 어두워져요.', jo(base, '은', '는') + ' 그대로 두고 밝기만 바뀌어요.'], why: base + '에 ' + (white ? '하양을 섞으면 밝은 ' : '검정을 섞으면 어두운 ') + jo(base, '이', '가') + ' 돼요. 색은 그대로, 밝기만 바뀌어요.', learn: '하양을 섞으면 밝게, 검정을 섞으면 어둡게' }); }
  const ts = shuf(r, [0.15, 0.4, 0.65]), sws = ts.map(t => mixC(B, '#ffffff', t)), mi = ts.indexOf(0.65), lab = ['가', '나', '다'];
  return pmk({ key: 'ati4' + base, q: '하양을 가장 많이 섞은 ' + jo(base, '은', '는') + ' 어느 것일까요?', ch: [mi].concat([0, 1, 2].filter(i => i !== mi)).map(i => ({ t: lab[i], sw: sws[i] })), a: { base, sws, ts },
    h: ['하양을 많이 섞을수록 색이 어떻게 될까요?', '가장 밝고 연한 색을 찾아봐요.'], why: '하양을 많이 섞을수록 색이 밝고 연해져요. 그래서 가장 연한 색이 하양을 가장 많이 섞은 거예요.', learn: '하양을 많이 섞을수록 밝고 연해요.' }); } };
const SHP = ['circle', 'tri', 'sq', 'dia'], SHN = { circle: '동그라미', tri: '세모', sq: '네모', dia: '마름모꼴' }, SCOL = { 빨강: '#d8262e', 파랑: '#2f6fd0', 노랑: '#f2c230', 초록: '#3f9f4e' };
export const shapeSvg = (s, c, sz = 34) => { const h = sz / 2, f = 'fill="' + c + '" stroke="' + INK + '" stroke-width="2"'; const b = s === 'circle' ? '<circle cx="' + h + '" cy="' + h + '" r="' + (h - 3) + '" ' + f + '/>' : s === 'tri' ? '<polygon points="' + h + ',3 ' + (sz - 3) + ',' + (sz - 4) + ' 3,' + (sz - 4) + '" ' + f + '/>' : s === 'sq' ? '<rect x="4" y="4" width="' + (sz - 8) + '" height="' + (sz - 8) + '" ' + f + '/>' : '<polygon points="' + h + ',2 ' + (sz - 2) + ',' + h + ' ' + h + ',' + (sz - 2) + ' 2,' + h + '" ' + f + '/>'; return '<svg viewBox="0 0 ' + sz + ' ' + sz + '" width="' + sz + '" height="' + sz + '" xmlns="http://www.w3.org/2000/svg">' + b + '</svg>'; };
AR.art_pat = { lo: 1, hi: 5, gen(r, L) { const cols = shuf(r, Object.keys(SCOL)), shs = shuf(r, SHP); let seq = [];
  if (L === 5) { const sA = shs.slice(0, 2), cA = cols.slice(0, 3); for (let i = 0; i < 8; i++) seq.push([sA[i % 2], cA[i % 3]]); }
  else { const unit = L <= 2 ? pk(r, [[0, 1], [0, 1], [0, 1, 2]]) : L === 3 ? pk(r, [[0, 1], [0, 1, 2]]) : pk(r, [[0, 0, 1], [0, 1, 1], [0, 1, 2], [0, 1, 2, 3]]); const items = unit.map(k => [shs[k], cols[k]]); for (let i = 0; i < 8; i++) seq.push(items[i % unit.length]); }
  const hole = L === 4 ? ri(r, 3, 6) : 7, ans = seq[hole], vis = seq.slice(0, L === 4 ? 8 : 7).map((x, i) => (i === hole ? null : x));
  const cand = []; for (const s of SHP) for (const c of Object.keys(SCOL)) if (!(s === ans[0] && c === ans[1])) cand.push([s, c]); const near = shuf(r, cand.filter(x => x[0] === ans[0] || x[1] === ans[1])), oth = near.slice(0, 3);
  if (oth.length < 3) return null;
  return pmk({ key: 'ap' + L + seq.map(x => x[0][0] + x[1][0]).join(''), q: L === 4 ? '빈칸에 들어갈 무늬를 골라요.' : '되풀이되는 무늬예요. 다음에 올 것을 골라요.', vis: { pat: vis }, ch: [ans].concat(oth).map(x => ({ t: x[1] + ' ' + SHN[x[0]], shp: x })), a: { seq: seq.map(x => x.join(':')), hole },
    h: [L === 5 ? '모양과 색이 따로따로 되풀이돼요. 모양만 먼저 봐요.' : '같은 무늬가 다시 나오는 곳을 찾아 묶어 봐요.', L === 5 ? '모양은 두 개, 색은 세 개씩 되풀이돼요.' : '되풀이되는 한 묶음이 몇 개인지 세어 봐요.'], why: L === 5 ? '모양은 ' + SHN[seq[0][0]] + ', ' + SHN[seq[1][0]] + ' 둘씩, 색은 ' + seq[0][1] + ', ' + seq[1][1] + ', ' + seq[2][1] + ' 셋씩 되풀이돼요. 그래서 ' + ans[1] + ' ' + jo(SHN[ans[0]], '이에요', '예요') + '.' : '한 묶음이 되풀이되니 그 자리에는 ' + ans[1] + ' ' + jo(SHN[ans[0]], '이', '가') + ' 와요.', learn: '무늬는 한 묶음을 찾으면 다음을 알 수 있어요.' }); } };
AR.art_three = { lo: 4, hi: 5, gen() { return pmk({ key: 'a3', q: '빨강, 노랑, 파랑 물감을 모두 섞으면 어떤 색이 될까요?', ch: [['검정에 가까운 어두운 색', '#3a2a2a'], ['하양', '#ffffff'], ['밝은 노랑', '#f8e08a'], ['분홍', PAINT.분홍]].map(x => ({ t: x[0], sw: x[1] })), a: { three: 1 }, h: ['물감은 섞을수록 밝아질까요, 어두워질까요?', '두 색만 섞어도 처음보다 조금 어두워져요.'], why: '물감은 섞을수록 색이 어두워져요. 빨강, 노랑, 파랑을 모두 섞으면 검정에 가까운 어두운 색이 돼요.', learn: '물감은 섞을수록 어두워져요.' }); } };
for (const k in AR) AR[k].id = 'art:' + k;

// ───────── 피아노 ─────────
export const NOTE = ['도', '레', '미', '파', '솔', '라', '시', '높은 도'], NOTE_F = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
function svgStaff(ns) { const W = 90 + ns.length * 70, gap = 12, base = 120, y = i => base - (i - 2) * gap / 2; let g = '<text x="8" y="40" font-size="12" font-weight="700" fill="' + INK + '">높은음자리표</text>';
  for (let k = 0; k < 5; k++) g += '<line x1="10" y1="' + (base - k * gap) + '" x2="' + (W - 10) + '" y2="' + (base - k * gap) + '" stroke="' + INK + '" stroke-width="2"/>';
  ns.forEach((n, j) => { const cx = 90 + j * 70, cy = y(n); if (n === 0) g += '<line x1="' + (cx - 16) + '" y1="' + cy + '" x2="' + (cx + 16) + '" y2="' + cy + '" stroke="' + INK + '" stroke-width="2"/>'; g += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="9" ry="6.5" transform="rotate(-20 ' + cx + ' ' + cy + ')" fill="' + INK + '"/><line x1="' + (cx + 8) + '" y1="' + cy + '" x2="' + (cx + 8) + '" y2="' + (cy - 34) + '" stroke="' + INK + '" stroke-width="2"/>' + (ns.length > 1 ? tx(cx - 4, 158, j + 1, 'font-size="12"') : ''); });
  return svgW(W, 166, g); }
const PI = {};
PI.pi_hilo = { lo: 1, hi: 4, gen(r, L) { const gapMin = L === 1 ? 4 : L === 2 ? 2 : 1, same = L >= 3 && r() < 0.25, a = ri(r, 0, 7); let b = a; if (!same) { const cand = []; for (let i = 0; i <= 7; i++) if (Math.abs(i - a) >= gapMin) cand.push(i); if (!cand.length) return null; b = pk(r, cand); }
  const k = b > a ? 0 : b < a ? 1 : 2, T = ['두 번째 음이 더 높아요', '두 번째 음이 더 낮아요', '두 음의 높이가 같아요'];
  return pmk({ key: 'ph' + a + '-' + b, q: '두 음을 듣고 높이를 견주어요.', pic: svgStaff([a, b]), play: [[NOTE_F[a], 0, 0.55], [NOTE_F[b], 0.75, 0.55]], ch: [k].concat([0, 1, 2].filter(x => x !== k)).map(i => ({ t: T[i] })), a: { a, b },
    h: ['오선에서 위쪽에 있을수록 높은 음이에요.', '두 음표 가운데 어느 쪽이 더 위에 있는지 봐요.'], why: k === 2 ? '두 음표가 같은 자리에 있어서 높이가 같아요.' : '두 번째 음표가 첫 번째보다 ' + (k === 0 ? '위에 있어서 더 높은' : '아래에 있어서 더 낮은') + ' 음이에요.', learn: '오선 위쪽은 높은 음, 아래쪽은 낮은 음이에요.' }); } };
PI.pi_name = { lo: 3, hi: 4, gen(r, L) { const n = ri(r, 0, L === 3 ? 6 : 7), oth = shuf(r, [0, 1, 2, 3, 4, 5, 6, 7].filter(i => i !== n && (L === 4 || i !== 7))).slice(0, 3);
  return pmk({ key: 'pn' + n, q: '이 음의 계이름은 무엇일까요?', pic: svgStaff([n]), play: [[NOTE_F[n], 0, 0.7]], ch: [n].concat(oth).map(i => ({ t: NOTE[i] })), a: { n },
    h: ['도는 오선 아래 덧줄에 걸쳐 있어요.', '도에서 줄과 칸을 하나씩 올라가며 도, 레, 미, 파… 세어 봐요.'], why: n === 0 ? '오선 아래 덧줄에 걸친 음은 도예요.' : '도에서 줄과 칸을 ' + n + '칸 올라가면 ' + jo(NOTE[n], '이에요', '예요') + '. 줄과 칸을 하나 오를 때마다 계이름이 하나씩 올라가요.', learn: '줄과 칸을 하나 오를 때마다 도, 레, 미, 파, 솔, 라, 시' }); } };
PI.pi_dir = { lo: 3, hi: 3, gen(r) { const k = ri(r, 0, 3); let ns; if (k === 0) { const s = ri(r, 0, 3); ns = [s, s + ri(r, 1, 2)]; ns.push(ns[1] + ri(r, 1, 2)); } else if (k === 1) { const s = ri(r, 4, 7); ns = [s, s - ri(r, 1, 2)]; ns.push(ns[1] - ri(r, 1, 2)); } else if (k === 2) { const s = ri(r, 1, 6); ns = [s, s, s]; } else { const s = ri(r, 0, 3), t = s + ri(r, 2, 4); ns = [s, t, s + ri(r, 0, 1)]; }
  if (ns.some(n => n < 0 || n > 7)) return null; const T = ['점점 올라가요', '점점 내려가요', '같은 음이 되풀이돼요', '올라갔다가 내려와요'], W = ['음표가 차례로 위로 올라가서 점점 올라가는 가락이에요.', '음표가 차례로 아래로 내려가서 점점 내려가는 가락이에요.', '음표가 모두 같은 자리에 있어서 같은 음이 되풀이되는 가락이에요.', '음표가 위로 갔다가 다시 내려와서 올라갔다가 내려오는 가락이에요.'];
  return pmk({ key: 'pd' + ns.join(''), q: '세 음을 듣고 가락이 어떻게 움직이는지 골라요.', pic: svgStaff(ns), play: ns.map((n, i) => [NOTE_F[n], i * 0.6, 0.5]), ch: [k].concat([0, 1, 2, 3].filter(x => x !== k)).map(i => ({ t: T[i] })), a: { ns },
    h: ['음표를 왼쪽에서 오른쪽으로 차례로 봐요.', '음표가 위로 가면 올라가는 가락, 아래로 가면 내려가는 가락이에요.'], why: W[k], learn: '가락의 움직임은 음표의 높낮이로 알아요.' }); } };
const DYN = [['f(포르테)는 어떻게 연주할까요?', '세게', ['여리게', '조금 여리게', '느리게'], 'f(포르테)는 세게 연주하라는 셈여림표예요.'], ['p(피아노)는 어떻게 연주할까요?', '여리게', ['세게', '조금 세게', '빠르게'], 'p(피아노)는 여리게 연주하라는 셈여림표예요.'], ['mf(메조 포르테)는 어떻게 연주할까요?', '조금 세게', ['아주 여리게', '여리게', '느리게'], 'm(메조)은 "조금"이라는 뜻이라 mf는 조금 세게예요.'], ['mp(메조 피아노)는 어떻게 연주할까요?', '조금 여리게', ['세게', '조금 세게', '빠르게'], 'm(메조)은 "조금"이라는 뜻이라 mp는 조금 여리게예요.'], ['악보에서 음의 높이를 나타내는 다섯 줄을 무엇이라고 할까요?', '오선', ['덧줄', '마디', '쉼표'], '음의 높이를 나타내는 다섯 줄을 오선이라고 해요.'], ['4분의 4박자에서 4분음표(♩)는 몇 박일까요?', '한 박', ['두 박', '반 박', '네 박'], '4분의 4박자에서는 4분음표 하나가 한 박이에요.']];
PI.pi_dyn = { lo: 2, hi: 2, gen(r) { const x = pk(r, DYN); return pmk({ key: 'py' + x[0], q: x[0], ch: [x[1]].concat(x[2]).map(t => ({ t })), a: { right: x[1] }, h: x[0].includes('오선') || x[0].includes('박') ? ['악보를 읽을 때 쓰는 낱말을 떠올려 봐요.', x[0].includes('박') ? '♩는 손뼉을 한 번 치는 길이예요.' : '음표를 그리는 줄은 다섯 개예요.'] : ['f는 세게, p는 여리게예요.', 'm(메조)이 앞에 붙으면 "조금"이라는 뜻이에요.'], why: x[3], learn: x[0].includes('오선') || x[0].includes('박') ? x[3] : 'f 세게, mf 조금 세게, mp 조금 여리게, p 여리게' }); } };
export const RHY_KEYS = { q: { t: '따', d: '♩ 한 박에 한 번' }, e: { t: '따따', d: '♫ 한 박에 두 번' }, r: { t: '쉼', d: '한 박 쉬기' } };
const BAR0 = ['qeqe', 'eeqq', 'qqeq', 'eqqq', 'qeeq', 'eqeq', 'qqqe', 'eeqe'], BAR1 = ['qqqr', 'qeqr', 'eeqr', 'qrqe', 'qreq', 'eqrq', 'qqre', 'qerq', 'eqqr'], TAIL = ['qq', 'ee', 'qe', 'eq', 'qr', 'er'];
PI.pi_rhy = { lo: 1, hi: 5, gen(r, L) { const b1 = pk(r, L === 1 ? BAR0 : BAR1), str = L <= 3 ? b1 : L === 4 ? b1 + pk(r, TAIL) : b1 + pk(r, BAR0.concat(BAR1)), keys = L === 1 ? ['q', 'e'] : ['q', 'e', 'r'], seq = str.split('');
  return { kind: 'seq', key: 'pr' + seq.join(''), q: L <= 2 ? '선생님 리듬을 보고 들은 대로 따라 쳐요.' : '선생님 리듬을 잘 듣고 외워서 따라 쳐요.', seq, keys, demo: { mode: L <= 2 ? 'show' : 'flash', beat: 0.62, rhy: 1 }, a: { seq },
    h: ['처음부터 다시 들어 봐요.', '한 박씩 끊어서 들어요: ♩는 따, ♫는 따따, 쉼은 조용해요.'], why: '이번 리듬은 ' + jo(seq.map(k => RHY_KEYS[k].t).join(' '), '이에요', '예요') + '. ♩는 한 박에 한 번, ♫는 한 박에 두 번 치고, 쉼은 한 박 쉬어요.', learn: '♩ = 한 박에 한 번, ♫ = 한 박에 두 번' }; } };
for (const k in PI) PI[k].id = 'piano:' + k;

// ───────── 태권도(동작 차례 기억 · 싸움 X) ─────────
export const MOVES = { down: { t: '아래막기', ic: '⬇', f: 330 }, mid: { t: '몸통막기', ic: '🛡', f: 392 }, face: { t: '얼굴막기', ic: '⬆', f: 440 }, punch: { t: '몸통지르기', ic: '✊', f: 494 }, kick: { t: '앞차기', ic: '👟', f: 523 } };
const TKF = [['수련을 시작하고 끝낼 때 하는 것은?', '인사(경례)', ['박수', '노래', '달리기'], '태권도는 예절로 시작해 예절로 끝나요. 시작과 끝에 인사(경례)를 해요.'], ['운동하기 전에 먼저 하는 것은?', '몸풀기', ['낮잠', '간식', '겨루기'], '몸을 먼저 풀어야 근육이 놀라지 않아 다치지 않아요.'], ['겨루기를 할 때 몸을 지켜 주는 것은?', '보호대', ['모자', '목도리', '우산'], '보호대를 차면 부딪혀도 덜 다쳐요.'], ['처음 태권도를 배우는 사람이 매는 띠는?', '흰 띠', ['검은 띠', '빨간 띠', '금색 띠'], '처음 배울 때는 흰 띠를 매고, 실력이 늘면 띠 색이 바뀌어요.'], ['"지르기"는 무엇으로 하는 동작일까요?', '주먹', ['발', '무릎', '머리'], '지르기는 주먹을 곧게 뻗는 동작이에요.'], ['"앞차기"는 무엇으로 하는 동작일까요?', '발', ['주먹', '손바닥', '팔꿈치'], '앞차기는 발로 앞을 차는 동작이에요.'], ['"막기"는 어떤 동작일까요?', '팔로 몸을 지키는 동작', ['발로 높이 차는 동작', '주먹을 앞으로 뻗는 동작', '몸을 숙여 인사하는 동작'], '막기는 팔을 써서 머리나 몸을 지키는 동작이에요.']];
const TK = {};
TK.tk_fact = { lo: 1, hi: 2, gen(r) { const x = pk(r, TKF); return pmk({ key: 'tf' + x[0], q: x[0], ch: [x[1]].concat(x[2]).map(t => ({ t })), a: { right: x[1] }, h: ['태권도장에서 사범님이 늘 하시는 말씀을 떠올려 봐요.', '안전하게, 예의 바르게 하는 쪽을 골라요.'], why: x[3], learn: x[3].split('.')[0] + '.' }); } };
TK.tk_seq = { lo: 1, hi: 5, gen(r, L) { const n = L + 2, K = Object.keys(MOVES), seq = []; for (let i = 0; i < n; i++) { let m = pk(r, K); if (i >= 2 && seq[i - 1] === m && seq[i - 2] === m) m = K[(K.indexOf(m) + 1) % K.length]; seq.push(m); }
  return { kind: 'seq', key: 'tk' + seq.join(''), q: '사범님이 보여 주는 동작 ' + ['', '', '두', '세', '네', '다섯', '여섯', '일곱'][n] + ' 개를 보고 같은 차례로 눌러요.', seq, keys: K, demo: { mode: L <= 2 ? 'show' : 'flash', beat: 0.85, tk: 1 }, a: { seq },
    h: ['처음부터 다시 볼게요.', '두세 개씩 끊어서 외워 봐요.'], why: '이번 차례는 ' + jo(seq.map(k => MOVES[k].t).join(' → '), '이에요', '예요') + '. 두세 개씩 끊어 외우면 쉬워요.', learn: '긴 차례는 두세 개씩 끊어 외워요.' }; } };
for (const k in TK) TK[k].id = 'taekwondo:' + k;

// ───────── 과목 표 ─────────
export const SUBJ = {
  math: { ic: '📐', t: '수학', stamp: '📐', tpl: M, top: ['각도, 큰 수의 자리, 분수의 덧셈, 소수 읽기', '큰 수 견주기, 분수의 뺄셈, 소수 견주기, 삼각형', '뛰어 세기, 소수의 덧셈, 삼각형의 각, 꺾은선그래프', '대분수의 덧셈, 소수의 뺄셈, 사각형 이름, 꺾은선의 변화', '대분수의 뺄셈, 사각형 사이의 관계, 억과 조'] },
  english: { ic: '🔤', t: '영어', stamp: '🔤', tpl: E, top: ['색, 과일, 동물 낱말', '물건, 수, 듣고 그림 찾기', '날씨, 기분, 때에 맞는 말', '묻고 답하기, 빈 글자, 어디에 있나요', '짧은 대화의 차례'] },
  science: { ic: '💡', t: '과학·코딩', stamp: '💡', tpl: SC, top: ['그림자, 싹 트기, 화산 + 로봇 곧은 길', '얼음, 체로 거르기, 식물 + 로봇 한 번 돌기', '응결, 거울, 구름, 한살이 + 로봇 두 번 돌기', '끓음, 거르기, 지진 + 로봇 반복 블록', '증발과 끓음, 물의 여행 + 로봇 긴 길'] },
  study: { ic: '📝', t: '독서·논술', stamp: '📝', tpl: ST, top: ['흉내 내는 말, 높임말', '사실과 의견, 소리가 같은 낱말', '이어 주는 말, 맞춤법', '짧은 글의 중심 문장', '글 속 의견 찾기'] },
  art: { ic: '🎨', t: '미술', stamp: '🎨', tpl: AR, top: ['물감 두 색 섞기', '색 만들기, 따뜻한 색과 차가운 색', '밝기, 되풀이 무늬', '더 밝은 색, 무늬의 빈칸', '두 가지가 도는 무늬, 셋 다 섞기'] },
  piano: { ic: '🎹', t: '피아노', stamp: '🎹', tpl: PI, top: ['음의 높고 낮음, 리듬 따라 치기', '셈여림, 쉼이 있는 리듬', '계이름, 가락의 움직임, 듣고 외워 치기', '높은 도, 여섯 박 리듬', '여덟 박 리듬'] },
  taekwondo: { ic: '🥋', t: '태권도', stamp: '🥋', tpl: TK, top: ['동작 셋 따라 하기, 예절', '동작 넷', '동작 다섯(보고 외우기)', '동작 여섯', '동작 일곱'] },
};
export const SUBJ_ORDER = ['math', 'english', 'science', 'study', 'art', 'piano', 'taekwondo'];
// 과목마다 자리 차례(정해진 자리 = 그 틀 · 나머지 = 수준에 맞는 틀 가운데 고름)
const FIX = { science: { 1: 'robot', 3: 'robot' }, taekwondo: { 0: 'tk_fact', 1: 'tk_seq', 2: 'tk_seq', 3: 'tk_seq', 4: 'tk_seq' }, piano: { 1: 'pi_rhy', 4: 'pi_rhy' } };
const NOT_FREE = { science: ['robot'], taekwondo: [], piano: ['pi_rhy'] };
export const levelsOf = (st, n) => (n === 3 ? [lvc(st - 1), lvc(st), lvc(st)] : [lvc(st - 1), lvc(st), lvc(st), lvc(st), lvc(st + 1)]);
// 한 판(수업 = 다섯 · 자습 = 셋) → 문제 목록(보기 섞음 · 같은 자리 정답 연속 X)
export function lesson(subj, st, seed, opt = {}) { const S = SUBJ[subj]; if (!S) return []; const r = rngOf(seed), n = opt.n || 5, lvs = levelsOf(st, n), used = new Set(opt.recent || []), useT = {}, out = []; let lastPos = -1;
  const T = S.tpl, keys = Object.keys(T);
  for (let i = 0; i < n; i++) { const L = lvs[i]; let tk = FIX[subj] && n === 5 ? FIX[subj][i] : null; if (!tk && FIX[subj] && n === 3) tk = subj === 'taekwondo' ? (i === 0 ? 'tk_fact' : 'tk_seq') : subj === 'science' && i === 1 ? 'robot' : subj === 'piano' && i === 1 ? 'pi_rhy' : null;
    if (!tk) { const ok = keys.filter(k => T[k].lo <= L && L <= T[k].hi && !(NOT_FREE[subj] || []).includes(k)), pool = ok.length ? ok : keys.filter(k => !(NOT_FREE[subj] || []).includes(k)); const m = Math.min(...pool.map(k => useT[k] || 0)); tk = pk(r, pool.filter(k => (useT[k] || 0) === m)); }
    useT[tk] = (useT[tk] || 0) + 1; const t = T[tk]; let p = null;
    for (let k = 0; k < 40 && !p; k++) { const q = t.gen(r, Math.max(t.lo, Math.min(t.hi, L)), used); if (q && !used.has(q.key)) p = q; else if (q && k > 30) p = q; }
    if (!p) continue; used.add(p.key); p.t = t.id; p.lv = L; p.star = n === 5 && i === 4; p.subj = subj;
    if (p.kind === 'pick') { const m9 = p.ch.length; let perm = shuf(r, p.ch.map((c, j) => j)); if (perm.indexOf(0) === lastPos) perm = perm.slice(1).concat(perm[0]); p.ch = perm.map(j => p.ch[j]); p.ans = perm.indexOf(0); lastPos = p.ans; if (m9 < 2) continue; }
    else if (p.kind === 'order') { let perm = shuf(r, p.items.map((c, j) => j)); if (perm.every((v, j) => v === j)) perm = perm.slice(1).concat(perm[0]); p.perm = perm; }
    out.push(p); }
  return out; }
// 판정: 잘한 판 = 다섯 가운데 넷 이상을 까닭 보기 전에 맞힘(marks: 0 한 번에 · 1 힌트 뒤 · 2 까닭 뒤)
export const goodRun = marks => marks.length >= 5 && marks.filter(m => m < 2).length >= 4;
