// 🎲 판 놀이 틀(TABLE-1 · 설계 docs/systems/town_buildings.md §4·§5 · 사용자 10-24 '보드게임 카페에서 간단한 보드게임 하면 좋겠구만'): DOM 캔버스 판(3D 그리기 0 · 판이 열린 동안 3D는 쉬엄쉬엄 SM_HOLD3D)
//   놀이 여섯 = 우물고누 · 오목(9×9) · 칠교놀이(밀기·돌리기·뒤집기) · 마을 카드 짝 맞추기 · 윷놀이(아무것도 걸지 않음 · 늘 할 수 있음) · 사방치기(카페 앞마당 · 몸으로 — 창 X)
//   상대 = 그 자리에 이미 앉아 있는 이름 없는 손님(새 사람 X) · 단계 셋(처음·단골·고수) · 잘한 판 셋 = 다음 손님 · 두 번 지면 둘 자리 하나가 2초 반짝 · 세 번 지면 '한 칸 쉽게'
//   규칙 카드 = 한 문장 + 그림 한 장(처음 한 번 · 판 안 '규칙' 단추) · 저장 = 놀이마다 { lv, best(별 · 안에서만), good, fail, w, n } · 보상 = 문(rwCheck) 하나 — 꼬리표 table:*
//   노인정·경로당·마을회관도 같은 틀(open(놀이, { who })) · 상품 보드게임(상표·판 그림) X — 모두 전통·공용 규칙 · 셈 X(윷은 칸을 세며 옮김 · 점수판·순위 X)
//   위 = 순수 함수(판 규칙·AI · node 시험 tools/harness/town_table.cjs) · 아래 = 화면 createTable(A)
import { ITEMS } from './town_game.js?v=44';   // 짝 맞추기 '나는 것 ↔ 나는 곳'(물건표 한 곳)
import { JOBS, PG, jobSvg } from './town_places.js?v=3';   // 짝 맞추기 '일하는 사람 ↔ 일터'(장소 카드와 같은 표 · 같은 그림)
export const TABLE_V = 1;
const T2 = (ko, en) => [ko, en];
export const mkRnd = (s = 1) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const LV_NAME = [T2('처음 온 손님', 'First-time guest'), T2('단골 손님', 'Regular guest'), T2('고수 손님', 'Expert guest')];

// ───────── 우물고누(전통 고누 · 말 둘씩 · 빈 자리는 늘 하나) ─────────
//   자리: 0 왼위 · 1 오른위 · 2 오른아래 · 3 왼아래 · 4 가운데 · 위쪽 0-1 사이 = 우물(선 없음 · 못 지나감) · 나 = 왼쪽 둘(0·3) · 손님 = 오른쪽 둘(1·2)
//   한 번에 내 말 하나를 선 따라 빈 자리로 · 내 차례에 움직일 말이 없으면 짐 · 첫 수로 곧바로 이기는 수는 두지 않음(전통 규칙) · 40수 동안 아무도 못 이기면 비김
export const GONU = { P: [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5]], E: [[0, 4], [1, 4], [2, 4], [3, 4], [0, 3], [1, 2], [3, 2]], CAP: 40 };
const GN = [[], [], [], [], []]; for (const [u, v] of GONU.E) { GN[u].push(v); GN[v].push(u); }
export const gonuStart = (first = 0) => ({ a: [0, 3], b: [1, 2], turn: first, ply: 0 });
export function gonuEmpty(st) { for (let i = 0; i < 5; i++) if (!st.a.includes(i) && !st.b.includes(i)) return i; return -1; }
const gonuRaw = st => { const e = gonuEmpty(st), out = []; for (const p of st.turn ? st.b : st.a) if (GN[p].includes(e)) out.push([p, e]); return out; };
export function gonuPlay(st, m) { const a = st.a.slice(), b = st.b.slice(), L = st.turn ? b : a; L[L.indexOf(m[0])] = m[1]; return { a, b, turn: 1 - st.turn, ply: st.ply + 1 }; }
export function gonuMoves(st) { const ms = gonuRaw(st); return st.ply === 0 ? ms.filter(m => gonuRaw(gonuPlay(st, m)).length > 0) : ms; }
// 끝: null = 계속 · 0 = 내가 이김 · 1 = 손님이 이김 · 'draw'
export function gonuOver(st) { if (!gonuMoves(st).length) return 1 - st.turn; return st.ply >= GONU.CAP ? 'draw' : null; }
const gKey = (a, b, t) => { let s = ''; for (let i = 0; i < 5; i++) s += a.includes(i) ? 'a' : b.includes(i) ? 'b' : '.'; return s + t; };
let GSOL = null;
// 판이 작아 끝까지 풀어 둠(자리 30 × 차례 2 = 60 · 처음 한 번 1ms 안): v = 1 이 차례가 이김 · −1 짐 · 0 비김(돌고 돎)
export function gonuSolve() { if (GSOL) return GSOL; const S = new Map(), pairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  for (let e = 0; e < 5; e++) { const rest = [0, 1, 2, 3, 4].filter(i => i !== e); for (const pr of pairs) { const a = pr.map(k => rest[k]), b = rest.filter((_, k) => !pr.includes(k)); for (const t of [0, 1]) { const st = { a, b, turn: t, ply: 1 }; S.set(gKey(a, b, t), { ch: gonuRaw(st).map(m => { const n = gonuPlay(st, m); return gKey(n.a, n.b, n.turn); }), v: 0, d: 0 }); } } }
  for (const n of S.values()) if (!n.ch.length) n.v = -1;
  for (let ch = true; ch;) { ch = false; for (const n of S.values()) { if (n.v) continue; const cs = n.ch.map(c => S.get(c)); if (cs.some(c => c.v === -1)) { n.v = 1; n.d = 1 + Math.min(...cs.filter(c => c.v === -1).map(c => c.d)); ch = true; } else if (cs.every(c => c.v === 1)) { n.v = -1; n.d = 1 + Math.max(...cs.map(c => c.d)); ch = true; } } }
  return (GSOL = S); }
// 손님 수(끝까지 풀어 보면 이 판의 덫은 모두 '한 수 앞'뿐 — 한 쪽 두 귀를 다 쥐고 가운데가 비었을 때 우물 쪽 말을 가운데로): 처음 = 아직 덫을 몰라 반쯤 걸려듦 · 단골 = 대개 피함(열에 셋은 놓침) · 고수 = 끝까지 내다봄(질 수 없는 판이면 비김을 지킴)
const gWin = (aft) => !gonuMoves(aft).length, gBad = aft => gonuMoves(aft).some(m2 => !gonuMoves(gonuPlay(aft, m2)).length);
export function gonuAI(st, lv, rnd) { const ms = gonuMoves(st); if (!ms.length) return null; const aft = ms.map(m => gonuPlay(st, m));
  if (lv <= 0) { const bad = ms.filter((m, i) => gBad(aft[i])); if (bad.length && rnd() < 0.9) return bad[(rnd() * bad.length) | 0]; return ms[(rnd() * ms.length) | 0]; }
  if (lv === 1) { const w = ms.filter((m, i) => gWin(aft[i])); if (w.length) return w[0]; const safe = ms.filter((m, i) => !gBad(aft[i])); const L = safe.length && rnd() < 0.7 ? safe : ms; return L[(rnd() * L.length) | 0]; }
  const S = gonuSolve(); let best = null, bs = -1e9; ms.forEach((m, i) => { const n = S.get(gKey(aft[i].a, aft[i].b, aft[i].turn)), sc = !gonuMoves(aft[i]).length ? 1e6 : n.v === -1 ? 1000 - n.d : n.v === 0 ? 0 : -1000 + n.d; const s2 = sc + rnd() * 0.5; if (s2 > bs) { bs = s2; best = m; } }); return best; }
// 힌트(두 번 지면): 지금 내 차례에 질 위험이 없는 수 하나
export const gonuHint = st => gonuAI(st, 2, () => 0.5);

// ───────── 오목(9×9 작은 판 · 다섯을 먼저 가로·세로·대각선으로 잇기) ─────────
export const OM = 9, OMN = OM * OM, OMD = [[1, 0], [0, 1], [1, 1], [1, -1]];
export const omokStart = () => ({ b: new Int8Array(OMN), turn: 1, n: 0, last: -1 });   /* 1 = 검은 돌(나 · 먼저) · 2 = 흰 돌(손님) */
export function omokFive(b, i) { const c = b[i]; if (!c) return null; const x0 = i % OM, y0 = (i / OM) | 0;
  for (const [dx, dy] of OMD) { const L = [i]; for (const s of [1, -1]) { let x = x0 + dx * s, y = y0 + dy * s; while (x >= 0 && y >= 0 && x < OM && y < OM && b[y * OM + x] === c) { L.push(y * OM + x); x += dx * s; y += dy * s; } } if (L.length >= 5) return L; } return null; }
// 한 칸 점수(창 세기): 그 칸을 지나는 다섯 칸 창마다 상대 돌이 없으면 내 돌 수 n으로 점수 · 공격(내 돌) + 막기(상대 돌)
const ATT = [0, 2, 12, 80, 600, 1e6], DEF = [0, 1, 9, 70, 500, 5e5];
export function omokCell(b, i, me) { const op = 3 - me, x0 = i % OM, y0 = (i / OM) | 0; let a = 0, d = 0, a3 = 0, d3 = 0;
  for (const [dx, dy] of OMD) { let ba = 0, bd = 0; for (let k = -4; k <= 0; k++) { let nm = 0, no = 0, ok = true; for (let j = 0; j < 5; j++) { const x = x0 + dx * (k + j), y = y0 + dy * (k + j); if (x < 0 || y < 0 || x >= OM || y >= OM) { ok = false; break; } const v = b[y * OM + x]; if (v === me) nm++; else if (v === op) no++; } if (!ok) continue; if (!no) { a += ATT[nm]; if (nm > ba) ba = nm; } if (!nm) { d += DEF[no]; if (no > bd) bd = no; } }
    if (ba >= 3) a3++; if (bd >= 3) d3++; }
  return { a, d, a3, d3 }; }
const near2 = (b, i) => { const x0 = i % OM, y0 = (i / OM) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = x0 + dx, y = y0 + dy; if ((dx || dy) && x >= 0 && y >= 0 && x < OM && y < OM && b[y * OM + x]) return true; } return false; };
export function omokCands(b) { const C = []; let any = false; for (let i = 0; i < OMN; i++) if (b[i]) { any = true; break; } if (!any) return [40]; for (let i = 0; i < OMN; i++) if (!b[i] && near2(b, i)) C.push(i); return C; }
// 손님 수: 처음 = 내 줄만 보고(막지 않음 · 가끔 엉뚱한 곳) · 단골 = 넷을 막고 셋도 대개 막음 · 고수 = 막기 + 두 수 앞(내가 둔 뒤 상대가 둘 가장 좋은 수를 빼고 셈) + 열린 셋·넷 겹치기
export function omokAI(st, lv, rnd) { const b = st.b, me = st.turn, C = omokCands(b); if (C.length === 1) return C[0];
  const sc = C.map(i => { const e = omokCell(b, i, me); return { i, e }; });
  const win = sc.find(s => s.e.a >= ATT[5]); if (win && (lv > 0 || rnd() < 0.85)) return win.i;
  if (lv <= 0) { const L = sc.map(s => ({ i: s.i, v: s.e.a + (s.e.d >= DEF[5] && rnd() < 0.35 ? s.e.d : s.e.d * 0.05) + rnd() * 40 })).sort((p, q) => q.v - p.v); return L[Math.min(L.length - 1, (rnd() * 4) | 0)].i; }
  const must = sc.filter(s => s.e.d >= DEF[5]); if (must.length) return must.sort((p, q) => q.e.d + q.e.a - p.e.d - p.e.a)[0].i;
  if (lv === 1 || rnd() < OMW.slip) { const L = sc.map(s => ({ i: s.i, v: s.e.a + s.e.d * (rnd() < 0.5 ? 1 : 0.15) + rnd() * 110 })).sort((p, q) => q.v - p.v); return L[rnd() < 0.7 ? 0 : Math.min(L.length - 1, 1 + ((rnd() * 2) | 0))].i; }   /* 고수도 가끔(OMW.slip) 단골처럼 둠 = 아이가 잘 두면 이길 틈 */
  const top = sc.map(s => ({ i: s.i, v: s.e.a * 1.05 + s.e.d + (s.e.a3 >= 2 ? 900 : 0) + (s.e.d3 >= 2 ? 700 : 0) })).sort((p, q) => q.v - p.v).slice(0, 8), R9 = [];
  for (const t of top) { b[t.i] = me; if (omokFive(b, t.i)) { b[t.i] = 0; return t.i; } let rep = 0; for (const j of omokCands(b)) { const e = omokCell(b, j, 3 - me), v = e.a + e.d * 0.5 + (e.a3 >= 2 ? 900 : 0); if (v > rep) rep = v; } b[t.i] = 0; R9.push({ i: t.i, v: t.v - rep * 0.7 + rnd() * 5 }); }
  R9.sort((p, q) => q.v - p.v); return R9[0].i; }
export const OMW = { slip: 0.6 };   /* 고수가 그 수만 단골처럼 둘 몫(넷 막기는 그대로 · node 봇으로 맞춤) */
export function omokPlay(st, i) { const b = st.b.slice(); b[i] = st.turn; return { b, turn: 3 - st.turn, n: st.n + 1, last: i }; }
// 힌트(두 번 지면): 내 차례에 둘 만한 자리 하나(막아야 할 곳이 있으면 그곳)
export const omokHint = st => omokAI(st, 2, () => 0.5);

// ───────── 윷놀이(윷가락 넷 · 말 넷 · 업기·잡기 · 지름길) — 아무것도 걸지 않음 ─────────
//   판 자리: 바깥 0~19(0 = 출발·참먹이 오른아래 · 5 = 오른위 모서리 · 10 = 왼위 · 15 = 왼아래) · 20·21 = 5에서 가운데로 · 22 = 가운데(방) · 23·24 = 가운데에서 15로 · 25·26 = 10에서 가운데로 · 27·28 = 가운데에서 0으로
//   모서리(5·10)나 가운데에 딱 멈추면 다음엔 지름길로 · 참먹이(0)를 지나야 남(딱 멈추면 다음에 남) · 윷·모·잡기 = 한 번 더 · 내 말 위에 멈추면 업음(같이 다님)
export const YUT_PATH = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 0], [5, 20, 21, 22, 23, 24, 15, 16, 17, 18, 19, 0], [10, 25, 26, 22, 27, 28, 0], [22, 27, 28, 0]];
export const YUT_NAME = [T2('모', 'Mo'), T2('도', 'Do'), T2('개', 'Gae'), T2('걸', 'Geol'), T2('윷', 'Yut')];   /* 배(납작한 면)가 위로 온 수 0~4 → 0 = 모 */
export const yutSteps = f => (f === 0 ? 5 : f);
export function yutThrow(rnd) { const s = []; let f = 0; for (let i = 0; i < 4; i++) { const up = rnd() < 0.5; s.push(up); if (up) f++; } return { f, k: yutSteps(f), sticks: s, again: f === 0 || f === 4 }; }
export const yutStart = (first = 0) => ({ P: [[-1, -1, -1, -1].map(() => ({ r: -1, i: 0 })), [-1, -1, -1, -1].map(() => ({ r: -1, i: 0 }))], turn: first, pend: [], can: true, n: 0 });   /* r: −1 = 아직 안 나옴 · 9 = 다 돎(남) */
export const yutNode = p => (p.r < 0 || p.r === 9 ? -1 : YUT_PATH[p.r][p.i]);
export function yutDest(p, k) { if (p.r === 9) return null; let r = p.r, i = p.i; if (r < 0) { r = 0; i = k; } else i += k; const P = YUT_PATH[r]; if (i > P.length - 1) return { r: 9, i: 0 }; const n = P[i]; if (r === 0 && n === 5) return { r: 1, i: 0 }; if (r === 0 && n === 10) return { r: 2, i: 0 }; if (r === 1 && n === 22) return { r: 3, i: 0 }; return { r, i }; }
// 고를 수 있는 말(업힌 말은 맨 앞 하나로 · 아직 안 나온 말은 하나로)
export function yutChoices(st, who) { const L = st.P[who], out = [], seen = new Set(); L.forEach((p, j) => { if (p.r === 9) return; const key = p.r < 0 ? 'h' : 'n' + yutNode(p); if (seen.has(key)) return; seen.add(key); out.push(j); }); return out; }
// 옮기기(새 판) → { st, cap: 잡은 말 수, stack: 업은 말 수, out: 난 말 수 }
export function yutMove(st, who, j, k) { const P = [st.P[0].map(p => ({ ...p })), st.P[1].map(p => ({ ...p }))], me = P[who], p0 = me[j], n0 = yutNode(p0), grp = p0.r < 0 ? [j] : me.map((p, q) => (yutNode(p) === n0 && p.r !== 9 && p.r >= 0 ? q : -1)).filter(q => q >= 0), d = yutDest(p0, k);
  for (const q of grp) { me[q].r = d.r; me[q].i = d.i; } let cap = 0, stack = 0; const n1 = yutNode(d);
  if (n1 >= 0) { for (const p of P[1 - who]) if (yutNode(p) === n1) { p.r = -1; p.i = 0; cap++; } me.forEach((p, q) => { if (!grp.includes(q) && yutNode(p) === n1) { p.r = d.r; p.i = d.i; stack++; } }); }
  return { st: { ...st, P }, cap, stack, out: d.r === 9 ? grp.length : 0 }; }
export const yutDone = (st, who) => st.P[who].every(p => p.r === 9);
// 남은 칸(가장 짧은 길 · 아직 안 나온 말 = 20 + 1)
const YLEFT = (() => { const L = {}; for (let r = 0; r < 4; r++) YUT_PATH[r].forEach((n, i) => { const k = r + ':' + i; let best = 1e9; const walk = (rr, ii, dd) => { if (dd > 40) return; const d = yutDest({ r: rr, i: ii }, 1); if (d.r === 9) { best = Math.min(best, dd + 1); return; } walk(d.r, d.i, dd + 1); }; walk(r, i, 0); L[k] = best; }); return L; })();
export const yutLeft = p => (p.r === 9 ? 0 : p.r < 0 ? 21 : YLEFT[p.r + ':' + p.i]);
const YPROB = [0, 4 / 16, 6 / 16, 4 / 16, 1 / 16, 1 / 16];   /* 칸 수 1~5(도·개·걸·윷·모)가 나올 몫 */
// 이 자리(n)에 있는 말이 다음 차례에 잡힐 몫(상대 말마다 한 번 던져 닿는 몫의 합 · 어림)
function yutRisk(st, who, n) { if (n <= 0) return 0; let r = 0; for (const p of st.P[1 - who]) { if (p.r === 9) continue; for (let k = 1; k <= 5; k++) { const d = yutDest(p, k); if (d.r !== 9 && yutNode(d) === n) r += YPROB[k]; } } return Math.min(1, r); }
export const YUTW = { pg: 10, out: 40, rb: 60, st: 45, cap: 220, th: 0.6 };   /* 고수 셈 무게(앞섬 · 남 · 잡힐 때 잃는 것 · 업기 · 잡기 · 다음에 잡을 몫) — node 봇으로 맞춤 */
function yutEval(st, who) { const W = YUTW; let v = 0; for (const w of [0, 1]) { const sg = w === who ? 1 : -1; for (const p of st.P[w]) { v += sg * (21 - yutLeft(p)) * W.pg; if (p.r === 9) v += sg * W.out; } }
  for (const w of [who, 1 - who]) { const L9 = st.P[w], seen = new Set(), sg = w === who ? -1 : W.th; if (!sg) continue; for (const p of L9) { const n = yutNode(p); if (n < 0 || seen.has(n)) continue; seen.add(n); const sz = L9.filter(q => yutNode(q) === n).length, prog = (21 - yutLeft(p)) * W.pg; v += sg * yutRisk(st, w, n) * (prog * sz + W.rb * sz); if (w === who && sz > 1) v += W.st * (sz - 1); } }
  return v; }
// 손님 수(지금 받은 칸 하나에 어느 말을): 처음 = 아무 말 · 단골 = 잡을 수 있으면 잡고, 아니면 지름길·앞선 말 · 고수 = 옮긴 뒤 판 셈(앞섬 · 잡힐 몫 · 업기)
export function yutAI(st, who, k, lv, rnd) { const C = yutChoices(st, who); if (C.length === 1) return C[0]; if (lv <= 0) { const nc = C.filter(j => !yutMove(st, who, j, k).cap); const L = nc.length && rnd() < 0.75 ? nc : C; return L[(rnd() * L.length) | 0]; }   /* 처음 = 잡을 수 있는 말을 잘 못 봄(넷에 셋은 그냥 지나침) */
  const R = C.map(j => ({ j, m: yutMove(st, who, j, k) }));
  if (lv === 1) { const cap = R.filter(r => r.m.cap); if (cap.length) return cap[0].j; const sc = R.map(r => { const p = r.m.st.P[who][r.j]; return { j: r.j, v: (r.m.out ? 50 : 0) + (p.r === 1 || p.r === 2 || p.r === 3 ? 30 : 0) + (st.P[who][r.j].r < 0 ? 12 : 21 - yutLeft(st.P[who][r.j])) + rnd() * 18 }; }).sort((p, q) => q.v - p.v); return sc[0].j; }
  let best = C[0], bv = -1e18; for (const r of R) { const v = yutEval(r.m.st, who) + r.m.cap * YUTW.cap + rnd() * 2; if (v > bv) { bv = v; best = r.j; } } return best; }
// 받은 칸이 여럿일 때(윷·모 뒤) 어느 칸부터 어느 말로: 처음·단골 = 받은 차례대로 · 고수 = 칸 차례와 말을 한꺼번에 따져 봄(셋까지) → { ki: 받은 칸 번호, j: 말 }
export function yutPlan(st, who, pend, lv, rnd) { if (lv < 2 || pend.length < 2) return { ki: 0, j: yutAI(st, who, pend[0], lv, rnd) };
  const P = pend.slice(0, 3); let best = null, bv = -1e18;
  const go = (s, left, first, capV) => { if (!left.length) { const v = yutEval(s, who) + capV; if (v > bv) { bv = v; best = first; } return; } const seen = new Set();
    left.forEach((k, ki) => { if (seen.has(k)) return; seen.add(k); for (const j of yutChoices(s, who)) { const m = yutMove(s, who, j, k), rest = left.filter((_, q) => q !== ki); go(m.st, rest, first || { ki: pend.indexOf(k), j }, capV + m.cap * YUTW.cap + (yutDone(m.st, who) ? 1e5 : 0)); } }); };
  go(st, P, null, 0); return best || { ki: 0, j: yutAI(st, who, pend[0], lv, rnd) }; }

// ───────── 칠교놀이(일곱 조각 · 밀기·돌리기·뒤집기) ─────────
//   조각 길이 단위 = 작은 세모의 짧은 변 1 · 넓이 합 8 · 돌리기 = 45°씩 · 뒤집기 = 좌우 · 맞춤 = 조각 꼭짓점 모양이 칸(정답 자리)과 같고 가까우면 딱 붙음
const R2 = Math.SQRT2;
export const TANG_PIECES = [
  { k: 'LT', v: [[0, 0], [2, 0], [0, 2]], c: '#e0453a' }, { k: 'LT', v: [[0, 0], [2, 0], [0, 2]], c: '#3d74c9' },
  { k: 'MT', v: [[0, 0], [R2, 0], [0, R2]], c: '#f2c230' }, { k: 'ST', v: [[0, 0], [1, 0], [0, 1]], c: '#3cc76a' }, { k: 'ST', v: [[0, 0], [1, 0], [0, 1]], c: '#ef8b33' },
  { k: 'SQ', v: [[0, 0], [1, 0], [1, 1], [0, 1]], c: '#8a5bd1' }, { k: 'PA', v: [[0, 0], [1, 0], [2, 1], [1, 1]], c: '#2fb5b0' }];
// 모양(정답 칸 = 조각 갈래 + 꼭짓점 · y = 위로) — 집·배(조각 금 보임) → 물고기·소방차(그림자만) → 뒤집은 배·뒤집은 물고기(원래 모양만 보고 거울처럼)
const SHAPE0 = {
  house: { t: T2('집', 'House'), s: [['LT', [[0, 2], [2, 2], [2, 4]]], ['LT', [[2, 2], [4, 2], [2, 4]]], ['SQ', [[1, 0], [2, 0], [2, 1], [1, 1]]], ['ST', [[2, 0], [3, 0], [2, 1]]], ['MT', [[3, 0], [3, 2], [2, 1]]], ['PA', [[1, 1], [2, 1], [3, 2], [2, 2]]], ['ST', [[1, 1], [2, 2], [1, 2]]]] },
  boat: { t: T2('돛단배', 'Sailboat'), s: [['ST', [[0, 1], [1, 0], [1, 1]]], ['SQ', [[1, 0], [2, 0], [2, 1], [1, 1]]], ['ST', [[2, 0], [3, 0], [2, 1]]], ['MT', [[2, 1], [4, 1], [3, 0]]], ['LT', [[2, 1], [4, 1], [2, 3]]], ['LT', [[2, 1], [0, 1], [2, 3]]], ['PA', [[2, 3], [2, 4], [3, 5], [3, 4]]]] },
  fish: { t: T2('물고기', 'Fish'), s: [['LT', [[0, 0], [2, 0], [0, 2]]], ['LT', [[2, 0], [2, 2], [0, 2]]], ['MT', [[2, 0], [2, 2], [3, 1]]], ['ST', [[0, 1], [0, 2], [-1, 2]]], ['ST', [[0, 0], [0, 1], [-1, 0]]], ['PA', [[0, 2], [1, 2], [2, 3], [1, 3]]], ['SQ', [[1, -1], [2, -1], [2, 0], [1, 0]]]] },
  truck: { t: T2('소방차', 'Fire engine'), s: [['LT', [[1, 0], [3, 0], [1, 2]]], ['LT', [[3, 0], [3, 2], [1, 2]]], ['SQ', [[3, 0], [4, 0], [4, 1], [3, 1]]], ['ST', [[3, 1], [4, 1], [3, 2]]], ['PA', [[1, 2], [2, 2], [3, 3], [2, 3]]], ['ST', [[1, 0], [2, 0], [1, -1]]], ['MT', [[2, 0], [4, 0], [3, -1]]]] },
};
// 뒤집은 모양 = 원래 모양 왼쪽 0.5칸 띄운 세로 선(거울 선)에 비춘 모양 · 원래 모양은 판에 옅게 그려 두고 거울 쪽은 그림자 없이 비워 둠
const mirS = (id, t) => { const s = SHAPE0[id], mx = tangBox(s)[0] - 0.5; return { t, mir: true, base: id, mx, s: s.s.map(([k, V]) => [k, V.map(([x, y]) => [2 * mx - x, y])]) }; };
export const TANG_SHAPES = { ...SHAPE0, boatM: mirS('boat', T2('뒤집은 돛단배', 'Flipped sailboat')), fishM: mirS('fish', T2('뒤집은 물고기', 'Flipped fish')) };
export const TANG_LADDER = [['house', 'boat'], ['fish', 'truck'], ['boatM', 'fishM']];
// 조각 꼭짓점(돌림 a = 45°의 몇 배 · 뒤집음 f · 가운데 cx·cy)
export function tangVerts(pc, a, f, cx, cy) { const V = pc.v, n = V.length; let mx = 0, my = 0; for (const [x, y] of V) { mx += x; my += y; } mx /= n; my /= n; const th = a * Math.PI / 4, c = Math.cos(th), s = Math.sin(th);
  return V.map(([x, y]) => { let u = x - mx, w = y - my; if (f) u = -u; return [cx + u * c - w * s, cy + u * s + w * c]; }); }
const cen = V => { let x = 0, y = 0; for (const q of V) { x += q[0]; y += q[1]; } return [x / V.length, y / V.length]; };
const sameShape = (A, B) => { if (A.length !== B.length) return false; const [ax, ay] = cen(A), [bx, by] = cen(B); return A.every(([x, y]) => B.some(([u, w]) => Math.abs(x - ax - (u - bx)) < 0.02 && Math.abs(y - ay - (w - by)) < 0.02)); };
export const tangSlotCen = V => cen(V);
// 조각 하나가 맞는 칸(같은 갈래 · 같은 모양 방향 · 가운데가 r 안 · 빈 칸) → 칸 번호 | −1
export function tangFit(shape, pc, a, f, cx, cy, used, r = 0.55) { const V = tangVerts(pc, a, f, cx, cy); let best = -1, bd = r; shape.s.forEach(([k, S], i) => { if (k !== pc.k || used[i]) return; const [sx, sy] = cen(S), d = Math.hypot(sx - cx, sy - cy); if (d < bd && sameShape(V, S)) { bd = d; best = i; } }); return best; }
// 그 칸에 맞는 돌림·뒤집음(힌트 · 시험 봇)
export function tangPoseFor(shape, i, pc) { const S = shape.s[i][1], [sx, sy] = cen(S); for (let f = 0; f < 2; f++) for (let a = 0; a < 8; a++) if (sameShape(tangVerts(pc, a, f, sx, sy), S)) return { a, f, cx: sx, cy: sy }; return null; }
export function tangBox(shape) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [, S] of shape.s) for (const [x, y] of S) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; }

// ───────── 마을 카드 짝 맞추기(카드 열둘 → 열여섯 → 비슷한 짝) ─────────
//   짝 = 일하는 사람 ↔ 일터(여권 도장 찍은 곳만) · 나는 것 ↔ 나는 곳(놀이 물건표의 '나는 곳') — 짝이 하나뿐이도록(같은 곳 두 번 X)
export function memDeal(pairs, rnd) { const C = []; pairs.forEach((p, i) => { C.push({ p: i, s: 0 }); C.push({ p: i, s: 1 }); }); for (let i = C.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [C[i], C[j]] = [C[j], C[i]]; } return C; }

// ───────── 사방치기(카페 앞마당 바닥 · 몸으로 — 창 X) ─────────
//   칸(줄) = 1·2·3·(4·5)·6·(7·8) + 하늘 · 한 줄 = 1.4m · 걷기를 0.45배로 늦추면 W를 누른 채 스페이스 = 딱 한 칸 콩 · Shift까지 = 두 칸(돌 칸 뛰어넘기)
//   올라갈 때 돌 칸을 건너뛰고 하늘에서 돌아 내려옴 · 돌 앞 칸에서 E = 돌 줍기 · 칸 밖·돌 칸·두 칸 건너뛰기·걸어서 옮기기 = 처음부터 · 꼬임: 하늘까지 올라가기만 → 갔다가 돌아오기(돌 줍기) → 선 밟으면 안 됨
export const HOP = { SQ: 1.4, ROWS: [[1], [2], [3], [4, 5], [6], [7, 8]], SLOW: 0.45 };
export const hopRows = () => 6;
// 바닥 자리 → 줄 번호(0 = 시작 칸 앞 · 1~6 = 줄 · 7 = 하늘 · −1 = 칸 밖) · u = 판 따라(시작 선 0) · v = 가로
export function hopRow(u, v, lv) { const n = hopRows(lv), S = HOP.SQ; if (u < 0) return Math.abs(v) < 2.2 && u > -2.4 ? 0 : -1; const r = Math.floor(u / S); if (r >= n) return u < n * S + S && Math.abs(v) < S ? 7 : -1; const w = HOP.ROWS[r].length > 1 ? S : S / 2; return Math.abs(v) <= w + 0.15 ? r + 1 : -1; }
export const hopOnLine = (u, lv) => { const S = HOP.SQ, f = u / S - Math.round(u / S); return lv >= 2 && Math.abs(f * S) < 0.13 && u > 0.13 && u < hopRows(lv) * S - 0.13; };

// ════════════ 화면(판 놀이 창 · DOM 캔버스 · 3D 그리기 0) ════════════
const CSS = `
.twn-p .tb-todo{font-weight:800;font-size:15px;margin:0 0 4px;color:var(--ink)}
.twn-p .tb-say{font-size:14px;color:var(--mut);min-height:0;margin-bottom:4px}
.twn-p .tb-say:empty{display:none}
.twn-p .tb-cv{display:block;margin:4px auto;border:3px solid var(--ink);border-radius:14px;background:#f3e2c2;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer}
.twn-p .tb-msg{min-height:20px;font-size:14px;font-weight:700;color:var(--mut);text-align:center;margin:2px 0}
.twn-p .tb-rc{display:block;margin:6px auto;border:3px solid var(--ink);border-radius:12px;background:#f3e2c2}
.twn-p .tb-rule{margin:6px 0;padding:8px 10px;border:2px solid var(--line);border-radius:12px;background:var(--card);font-size:14px;line-height:1.45}
.twn-p .tb-res{margin:6px 0;padding:10px 12px;border:3px solid var(--ink);border-radius:14px;background:#fff4cf;font-size:15px;line-height:1.5}
.twn-p .tb-res b{font-size:17px}
.twn-p .tb-grid{display:grid;gap:6px;margin:6px auto;max-width:520px}
.twn-p .tb-card{position:relative;min-height:66px;padding:4px 3px;border-radius:12px;font-size:13px;line-height:1.2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:#3f8f4e;color:#fff;box-shadow:0 3px 0 var(--ink)}
.twn-p .tb-card .ci{font-size:26px;line-height:1}
.twn-p .tb-card .ci svg{width:34px;height:34px;display:block}
.twn-p .tb-card.up{background:var(--card);color:var(--ink);text-shadow:none}
.twn-p .tb-card.ok{background:#e4f5d4;color:var(--ink);text-shadow:none;border-color:#3f8f4e}
.twn-p .tb-card .bk{font-size:22px;opacity:.9}
.twn-p .tb-pick{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:4px 0}
.twn-p .tb-pick button{min-height:38px;padding:4px 12px}
.twn-p .tb-pick button.on{background:#f2c230;color:var(--ink);text-shadow:none}
`;
const YUT_IC = '<svg viewBox="0 0 28 22" width="26" height="20" aria-hidden="true" style="vertical-align:-3px"><g stroke="#2b2622" stroke-width="1.6"><rect x="2" y="2" width="5" height="18" rx="2.5" fill="#f3dfb0"/><rect x="8.5" y="2" width="5" height="18" rx="2.5" fill="#a8743f"/><rect x="15" y="2" width="5" height="18" rx="2.5" fill="#f3dfb0"/><rect x="21.5" y="2" width="5" height="18" rx="2.5" fill="#f3dfb0"/></g></svg>';
export const GAMES = {
  gonu: { ic: '⚪', t: T2('우물고누', 'Well gonu'), vs: 1, col: 0x6b4a2f, rule: T2('말을 선을 따라 빈 자리로 한 칸씩 옮겨서, 상대 말이 움직일 곳이 없게 막으면 이겨요.', 'Move one of your pieces along a line into the empty spot. Trap the other side so they cannot move, and you win.'), rule2: T2('위쪽 우물 쪽으로는 지나갈 수 없어요. 마흔 수 안에 끝나지 않으면 비겨요.', 'You cannot pass the well at the top. If nobody wins in 40 moves, it is a draw.') },
  omok: { ic: '⚫', t: T2('오목', 'Omok (five in a row)'), vs: 1, col: 0x2b2d31, rule: T2('검은 돌과 흰 돌을 번갈아 놓아서, 다섯 개를 가로·세로·대각선으로 먼저 이으면 이겨요.', 'Take turns placing black and white stones. The first to make five in a row (across, down or diagonal) wins.'), rule2: T2('나는 검은 돌이고 먼저 놓아요. 손님이 넷을 이으면 얼른 막아요.', 'I play black and go first. If the guest has four in a row, block it quickly.') },
  tang: { ic: '🔷', t: T2('칠교놀이', 'Tangram'), vs: 0, col: 0x3d74c9, rule: T2('일곱 조각을 밀고, 돌리고, 뒤집어서 그림자 모양을 빈틈없이 채워요.', 'Slide, turn and flip the seven pieces to fill the shadow shape with no gaps.'), rule2: T2('조각을 끌어 옮기고, 돌리기·뒤집기 단추로 모양을 맞춰요. 맞는 자리 가까이 놓으면 딱 붙어요.', 'Drag a piece, then use Turn and Flip. Put it near the right place and it snaps in.') },
  mem: { ic: '🃏', t: T2('마을 카드 짝 맞추기', 'Town card pairs'), vs: 0, col: 0x3f8f4e, rule: T2('카드를 두 장씩 뒤집어서, 일하는 사람과 일터, 나는 것과 나는 곳처럼 짝인 카드를 찾아요.', 'Turn over two cards at a time and find the pairs: a worker and their workplace, or a thing and where it comes from.'), rule2: T2('짝이 아니면 다시 덮여요. 어디 있었는지 기억해 두어요.', 'If they don’t match, they turn back over. Remember where they were.') },
  yut: { ic: YUT_IC, t: T2('윷놀이', 'Yut'), vs: 1, col: 0xa8743f, rule: T2('윷가락을 던져 나온 만큼 말을 옮기고, 내 말 넷이 먼저 판을 한 바퀴 돌아 나오면 이겨요.', 'Throw the sticks and move as many spots as they show. Get all four of your pieces around the board and out first to win.'), rule2: T2('윷·모가 나오거나 상대 말을 잡으면 한 번 더 던져요. 내 말 위에 멈추면 업고 같이 가요. 모서리나 가운데에 딱 멈추면 지름길로 가요. 아무것도 걸지 않고 놀아요.', 'Yut, mo or catching a piece gives another throw. Land on your own piece to carry it along. Stop exactly on a corner or the middle to take the shortcut. We play just for fun.') },
  hop: { ic: '👣', t: T2('사방치기', 'Hopscotch'), vs: 0, col: 0xf6f4ee, rule: T2('돌이 놓인 칸은 건너뛰고, 한 칸씩 콩콩 뛰어 하늘까지 갔다가 돌아와요.', 'Skip the square with the stone, hop one square at a time up to the sky, then come back.'), rule2: T2('W를 누른 채 스페이스 = 한 칸 콩. Shift까지 누르면 두 칸을 뛰어넘어요. 내려올 때 돌 앞 칸에서 E로 돌을 주워요.', 'Hold W and press Space to hop one square. Add Shift to jump two. On the way back, press E in front of the stone to pick it up.'), rule2t: T2('조이스틱을 앞으로 민 채 점프 단추 = 한 칸 콩. 조이스틱을 끝까지 밀면 두 칸을 뛰어넘어요. 내려올 때 돌 앞 칸에서 E 단추로 돌을 주워요.', 'Push the stick forward and tap Jump to hop one square. Push the stick all the way to jump two. On the way back, tap E in front of the stone to pick it up.') },
};
const YXY = (() => { const P = []; for (let i = 0; i <= 19; i++) P[i] = i <= 5 ? [1, 1 - i / 5] : i <= 10 ? [1 - (i - 5) / 5, 0] : i <= 15 ? [0, (i - 10) / 5] : [(i - 15) / 5, 1]; P[20] = [5 / 6, 1 / 6]; P[21] = [2 / 3, 1 / 3]; P[22] = [0.5, 0.5]; P[23] = [1 / 3, 2 / 3]; P[24] = [1 / 6, 5 / 6]; P[25] = [1 / 6, 1 / 6]; P[26] = [1 / 3, 1 / 3]; P[27] = [2 / 3, 2 / 3]; P[28] = [5 / 6, 5 / 6]; return P; })();
const KIDC = '#fffaf0', GSTC = '#3a2e28', INK = '#2b2622';
// 판 그림(방 탁자 위 · 규칙 카드 · 창 모두 같은 그림): ctx 위 x·y·w·h 네모 안에
function drawGonu(g, x, y, w, h, st, o = {}) { const m = Math.min(w, h) * 0.16, s = Math.min(w, h) - 2 * m, X = i => x + (w - s) / 2 + GONU.P[i][0] * s, Y = i => y + (h - s) / 2 + GONU.P[i][1] * s, r = s * 0.1;
  g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.022); g.lineCap = 'round'; for (const [u, v] of GONU.E) { g.beginPath(); g.moveTo(X(u), Y(u)); g.lineTo(X(v), Y(v)); g.stroke(); }
  g.fillStyle = '#7fb8e0'; g.beginPath(); g.arc((X(0) + X(1)) / 2, Y(0), s * 0.09, 0, 6.2832); g.fill(); g.stroke(); if (o.label) { g.fillStyle = INK; g.font = '800 ' + Math.round(s * 0.07) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(o.label, (X(0) + X(1)) / 2, Y(0) - s * 0.1); }
  for (let i = 0; i < 5; i++) { g.fillStyle = '#e9d3a8'; g.beginPath(); g.arc(X(i), Y(i), r * 0.45, 0, 6.2832); g.fill(); }
  if (st) for (const [L9, c] of [[st.a, KIDC], [st.b, GSTC]]) for (const p of L9) { const mv = o.mov && o.mov.includes(p), hi = o.hint === p && o.blink; g.fillStyle = c; g.beginPath(); g.arc(X(p), Y(p), r, 0, 6.2832); g.fill(); g.lineWidth = Math.max(2, s * 0.018); g.strokeStyle = INK; g.stroke(); if (mv || hi) { g.strokeStyle = hi ? '#e0453a' : '#f2c230'; g.lineWidth = Math.max(3, s * 0.03); g.beginPath(); g.arc(X(p), Y(p), r * 1.32, 0, 6.2832); g.stroke(); } }
  return { X, Y, r }; }
function drawOmok(g, x, y, w, h, b, o = {}) { const s = Math.min(w, h), st = s / (OM + 0.2), x0 = x + (w - s) / 2 + st * 0.6, y0 = y + (h - s) / 2 + st * 0.6, P = i => [x0 + (i % OM) * st, y0 + ((i / OM) | 0) * st];
  g.fillStyle = '#e2b56c'; g.fillRect(x + (w - s) / 2, y + (h - s) / 2, s, s); g.strokeStyle = '#5a3c26'; g.lineWidth = Math.max(1, s * 0.004); for (let k = 0; k < OM; k++) { g.beginPath(); g.moveTo(x0, y0 + k * st); g.lineTo(x0 + (OM - 1) * st, y0 + k * st); g.stroke(); g.beginPath(); g.moveTo(x0 + k * st, y0); g.lineTo(x0 + k * st, y0 + (OM - 1) * st); g.stroke(); }
  g.fillStyle = '#5a3c26'; for (const i of [20, 24, 40, 56, 60]) { const [px, py] = P(i); g.beginPath(); g.arc(px, py, st * 0.09, 0, 6.2832); g.fill(); }
  if (b) for (let i = 0; i < OMN; i++) { if (!b[i]) continue; const [px, py] = P(i); g.fillStyle = b[i] === 1 ? '#22201e' : '#fbf8f0'; g.beginPath(); g.arc(px, py, st * 0.43, 0, 6.2832); g.fill(); g.strokeStyle = '#1b1917'; g.lineWidth = Math.max(1, st * 0.05); g.stroke(); }
  if (o.last >= 0 && b && b[o.last]) { const [px, py] = P(o.last); g.fillStyle = '#e0453a'; g.beginPath(); g.arc(px, py, st * 0.12, 0, 6.2832); g.fill(); }
  if (o.line) { g.strokeStyle = '#e0453a'; g.lineWidth = st * 0.16; g.lineCap = 'round'; const a = P(o.line[0]), z = P(o.line[o.line.length - 1]); let lo = o.line[0], hi = o.line[0]; for (const i of o.line) { if (i < lo) lo = i; if (i > hi) hi = i; } const A9 = P(lo), Z9 = P(hi); g.beginPath(); g.moveTo(A9[0], A9[1]); g.lineTo(Z9[0], Z9[1]); g.stroke(); void a; void z; }
  if (o.ghost >= 0 && b && !b[o.ghost]) { const [px, py] = P(o.ghost); g.globalAlpha = 0.45; g.fillStyle = '#22201e'; g.beginPath(); g.arc(px, py, st * 0.43, 0, 6.2832); g.fill(); g.globalAlpha = 1; }
  if (o.hint >= 0 && o.blink) { const [px, py] = P(o.hint); g.strokeStyle = '#e0453a'; g.lineWidth = st * 0.12; g.beginPath(); g.arc(px, py, st * 0.5, 0, 6.2832); g.stroke(); }
  return { P, st }; }
function drawYutBoard(g, x, y, s, P, o = {}) { const X = n => x + YXY[n][0] * s, Y = n => y + YXY[n][1] * s, big = [0, 5, 10, 15, 22];
  g.fillStyle = '#f6e7c4'; g.fillRect(x - s * 0.06, y - s * 0.06, s * 1.12, s * 1.12); g.strokeStyle = '#8a5a34'; g.lineWidth = Math.max(1.5, s * 0.008); g.strokeRect(x, y, s, s); g.beginPath(); g.moveTo(X(5), Y(5)); g.lineTo(X(15), Y(15)); g.moveTo(X(10), Y(10)); g.lineTo(X(0), Y(0)); g.stroke();
  for (let n = 0; n <= 28; n++) { const B = big.includes(n), r = s * (B ? 0.045 : 0.03); g.fillStyle = B ? '#e0a85c' : '#fffaf0'; g.beginPath(); g.arc(X(n), Y(n), r, 0, 6.2832); g.fill(); g.strokeStyle = '#8a5a34'; g.stroke(); }
  if (o.label) { g.fillStyle = '#8a5a34'; g.font = '800 ' + Math.round(s * 0.05) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(o.label, X(0), Y(0) + s * 0.055); }
  if (P) { const drawn = {}; for (const w of [0, 1]) P[w].forEach((p, j) => { const n = yutNode(p); if (n < 0) return; const k = w + ':' + n; if (drawn[k]) { drawn[k].n++; return; } drawn[k] = { n: 1, w, node: n, j }; });
    for (const d of Object.values(drawn)) { const off = d.w ? s * 0.022 : -s * 0.022, px = X(d.node) + off, py = Y(d.node) + off, r = s * 0.038; g.fillStyle = d.w ? '#3d74c9' : '#e0453a'; g.beginPath(); g.arc(px, py, r, 0, 6.2832); g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1.5, s * 0.008); g.stroke(); if (d.n > 1) { g.fillStyle = '#fff'; g.font = '900 ' + Math.round(r * 1.2) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(d.n), px, py + 1); } } }
  return { X, Y }; }
function drawTangShape(g, sh, ox, oy, u, o = {}) { const T = ([x, y]) => [ox + x * u, oy - y * u]; g.fillStyle = o.fill || 'rgba(43,38,34,.78)'; for (const [, V] of sh.s) { g.beginPath(); V.forEach((q, i) => { const [a, b] = T(q); if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.closePath(); g.fill(); }
  if (o.lines) { g.strokeStyle = o.lines; g.lineWidth = Math.max(1, u * 0.04); g.setLineDash([u * 0.12, u * 0.1]); for (const [, V] of sh.s) { g.beginPath(); V.forEach((q, i) => { const [a, b] = T(q); if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.closePath(); g.stroke(); } g.setLineDash([]); } }
const fitTang = (sh, w, h, pad = 0.15) => { const [x0, y0, x1, y1] = tangBox(sh), u = Math.min(w * (1 - pad) / (x1 - x0), h * (1 - pad) / (y1 - y0)); return { u, ox: (w - (x1 - x0) * u) / 2 - x0 * u, oy: (h + (y1 - y0) * u) / 2 + y0 * u }; };

export function createTable(A) {
  const en = () => !!A.en(), L = () => (A.en() ? 1 : 0), S = () => A.GAME.S, esc = A.esc, day = () => S().day | 0, R = mkRnd(((Date.now() / 7) | 0) & 0xffffff);
  let css = null, C = null, dead = false, held = false, keyOn = null, raf = 0, rz = null, HOPS = null;
  if (!document.getElementById('tb-css')) { css = document.createElement('style'); css.id = 'tb-css'; css.textContent = CSS; document.head.appendChild(css); }
  const TS = () => { let t = S().tbl; if (!t || typeof t !== 'object' || Array.isArray(t)) t = S().tbl = { v: 1 }; for (const k of ['g', 'box', 'last', 'seen', 'mem']) if (!t[k] || typeof t[k] !== 'object' || Array.isArray(t[k])) t[k] = {}; return t; };
  const GS = g => { const t = TS().g; let s = t[g]; if (!s || typeof s !== 'object') s = t[g] = { lv: 0, good: 0, fail: 0, w: 0, n: 0, best: {} }; if (!s.best || typeof s.best !== 'object') s.best = {}; s.lv = Math.max(0, Math.min(2, s.lv | 0)); return s; };
  const ttl = g => GAMES[g].ic + ' ' + esc(GAMES[g].t[L()]);
  const mark = () => { if (A.GAME.mark) A.GAME.mark(); };
  function hold(on) { if (on === held) return; held = on; window.SM_HOLD3D = Math.max(0, (window.SM_HOLD3D || 0) + (on ? 1 : -1)); }   /* 판이 열린 동안 3D는 쉬엄쉬엄(1초 네 번 · 크롬북 열) */
  function shut() { if (!C) return; const c = C; C = null; for (const id of c.timers) clearTimeout(id); if (keyOn) { removeEventListener('keydown', keyOn, true); removeEventListener('keyup', keyOn, true); keyOn = null; } if (rz) { removeEventListener('resize', rz); rz = null; } if (raf) { cancelAnimationFrame(raf); raf = 0; } hold(false); }
  function loop() { raf = 0; if (!C || dead) return; if (!C.P || !C.P.isConnected) { shut(); return; } if (C.anim) C.anim(performance.now()); raf = requestAnimationFrame(loop); }
  function later(fn, ms) { const c = C; if (!c) return 0; const id = setTimeout(() => { if (C === c && !dead) fn(); }, ms); c.timers.push(id); return id; }
  const todo = t => { const el = C && C.P && C.P.querySelector('.tb-todo'); if (el) el.textContent = (en() ? 'To do: ' : '할 일: ') + t; };
  const msg = t => { const el = C && C.P && C.P.querySelector('.tb-msg'); if (el) el.textContent = t || ''; };
  const say = t => { const el = C && C.P && C.P.querySelector('.tb-say'); if (el) el.textContent = t || ''; };
  function fitCv(cv, W, H, reserve = 236) { const bx = C.P.querySelector('.bx'), aw = Math.max(220, (bx ? bx.clientWidth : 600) - 42), ah = Math.max(150, innerHeight * 0.9 - reserve), k = Math.min(aw / W, ah / H, 1.3), w = Math.round(W * k), h = Math.round(H * k), d = Math.min(2, devicePixelRatio || 1);
    cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * d); cv.height = Math.round(h * d); const g = cv.getContext('2d'); g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); return g; }
  const ptr = (cv, ev, W, H) => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; };
  const who = () => (C.ctx.who ? C.ctx.who + ' · ' + LV_NAME[C.lvp][L()].split(' ')[0] : C.ctx.solo ? (en() ? 'practising alone' : '혼자 연습') : GAMES[C.g].vs ? LV_NAME[C.lvp][L()] : (en() ? ['Step 1', 'Step 2', 'Step 3'] : ['한 단계', '두 단계', '세 단계'])[C.lvp]);
  // 창 틀: 제목(놀이 · 상대) → 할 일 한 줄 → 손님 말 → 판 → 알림 → 단추
  function frame(inner, btns) { const g = C.g; return '<h3>' + ttl(g) + ' <span class="sm">— ' + esc(who()) + '</span></h3><div class="tb-todo"></div><div class="tb-say"></div>' + inner + '<div class="tb-msg"></div><div class="tb-rule" hidden></div><div class="row tb-btns">' + btns + '</div>'; }
  const B = (a, t, sub) => '<button ' + (sub ? 'class="sub" ' : '') + 'data-a="' + a + '">' + t + '</button>';
  function stdBtns() { const g = C.g, s = GS(g), e = en(); return (C.hintOK() ? B('hint', '💡 ' + (e ? 'Hint' : '힌트'), 1) : '') + B('rule', '📜 ' + (e ? 'Rules' : '규칙'), 1) + (GAMES[g].vs && !C.ctx.solo && s.fail >= 3 && C.lvp > 0 && !C.easy ? B('easy', e ? 'One step easier' : '한 칸 쉽게', 1) : '') + B('x', e ? 'Stop' : '그만', 1); }
  function setBtns(h) { const r = C && C.P && C.P.querySelector('.tb-btns'); if (r) r.innerHTML = h; }
  function showRule() { const el = C.P.querySelector('.tb-rule'); if (!el) return; el.hidden = !el.hidden; if (!el.hidden) el.innerHTML = '<b>📜 ' + esc(GAMES[C.g].rule[L()]) + '</b><br>' + esc(GAMES[C.g].rule2[L()]); }
  function bind(P) { P.dataset.g = C.g; P.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('button[data-a]'); if (!b || !C) return; const a = b.dataset.a;
      if (a === 'x') { const c = C; if (c && !c.over && c.quit) c.quit(); shut(); A.closeP(); return; } if (a === 'rule') { showRule(); return; } if (a === 'again') { start(C.g, C.ctx); return; } if (a === 'easy') { C.easy = true; start(C.g, { ...C.ctx, easy: true }); return; } if (a === 'hint' && C.hint9) { C.hint9(); return; } if (C.btn) C.btn(a, b); }); }
  // ── 열기: 처음 = 규칙 카드(한 문장 + 그림 한 장 · 1층 카페 직원이 건넴) → 판 ──
  function open(g, ctx = {}) { if (dead || !GAMES[g]) return false; if (g === 'hop') return hopUse(); if (A.busy && A.busy() && !(C && C.P && C.P.isConnected)) return false; if (!TS().seen[g]) return ruleCard(g, ctx); return start(g, ctx); }
  function ruleCard(g, ctx) { shut(); const e = en(), l = L(), from = ctx.from === 'cafe' ? (e ? 'A café staff member hands you a rule card.' : '카페 직원이 규칙 카드를 건네요.') : '';
    const h = '<h3>📜 ' + (e ? 'Rule card — ' : '규칙 카드 — ') + esc(GAMES[g].t[l]) + '</h3>' + (from ? '<div class="sm">' + from + '</div>' : '') + '<canvas class="tb-rc"></canvas><div class="pc-tx" style="font-size:17px;font-weight:800;line-height:1.45">' + esc(GAMES[g].rule[l]) + '</div><div class="sm" style="margin-top:4px">' + esc(GAMES[g].rule2[l]) + '</div><div class="row">' + B('go', e ? 'Start' : '시작해요') + B('x', e ? 'Later' : '나중에', 1) + '</div>';
    const P = A.openP(h, false, 'table'); P.dataset.g = g; const cv = P.querySelector('.tb-rc'); { const W = 300, H = 170, d = Math.min(2, devicePixelRatio || 1); cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = W * d; cv.height = H * d; const c2 = cv.getContext('2d'); c2.setTransform(d, 0, 0, d, 0, 0); rulePic(g, c2, W, H); }
    P.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('button[data-a]'); if (!b) return; if (b.dataset.a === 'go') { TS().seen[g] = day() || 1; mark(); start(g, ctx); } else A.closeP(); }); return true; }
  function rulePic(g, c, W, H) { c.fillStyle = '#f3e2c2'; c.fillRect(0, 0, W, H);
    if (g === 'gonu') { drawGonu(c, 70, 4, 160, 162, gonuStart(0), { label: en() ? 'well' : '우물', mov: [3] }); c.strokeStyle = '#e0453a'; c.lineWidth = 3; c.beginPath(); c.moveTo(104, 137); c.lineTo(142, 95); c.stroke(); }
    else if (g === 'omok') { const b = new Int8Array(OMN); [30, 31, 32, 33].forEach(i => { b[i] = 1; }); [21, 22, 41, 42].forEach(i => { b[i] = 2; }); drawOmok(c, 65, 0, 170, 170, b, { ghost: 34 }); }
    else if (g === 'tang') { const sh = TANG_SHAPES.house, f = fitTang(sh, 130, 150); drawTangShape(c, sh, 20 + f.ox, 10 + f.oy, f.u, { lines: 'rgba(255,255,255,.7)' }); TANG_PIECES.forEach((pc, i) => { const V = tangVerts(pc, i, i === 6 ? 1 : 0, 0, 0); c.fillStyle = pc.c; c.beginPath(); V.forEach(([x, y], k) => { const X = 190 + (i % 3) * 38 + x * 14, Y = 40 + ((i / 3) | 0) * 46 - y * 14; if (k) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); }); }
    else if (g === 'mem') { const L9 = [['🧂', en() ? 'Salt' : '소금'], ['🌊', en() ? 'Sea' : '바다'], ['?', ''], ['?', '']]; L9.forEach(([ic, t], i) => { const x = 22 + i * 68, up = i < 2; c.fillStyle = up ? '#fffdf7' : '#3f8f4e'; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.roundRect ? c.roundRect(x, 35, 58, 90, 10) : c.rect(x, 35, 58, 90); c.fill(); c.stroke(); c.fillStyle = up ? INK : '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '28px sans-serif'; c.fillText(up ? ic : '★', x + 29, 70); c.font = '800 13px sans-serif'; c.fillText(t, x + 29, 105); }); c.strokeStyle = '#e0453a'; c.lineWidth = 3; c.beginPath(); c.moveTo(80, 30); c.quadraticCurveTo(116, 8, 152, 30); c.stroke(); }
    else if (g === 'yut') { drawYutBoard(c, 18, 14, 140, [[{ r: 0, i: 3 }, { r: -1, i: 0 }, { r: -1, i: 0 }, { r: -1, i: 0 }], [{ r: 0, i: 12 }, { r: -1, i: 0 }, { r: -1, i: 0 }, { r: -1, i: 0 }]], { label: en() ? 'start' : '출발' }); yutSticks(c, 190, 30, 100, 110, [true, true, false, true], 0, 1); c.fillStyle = INK; c.font = '900 22px sans-serif'; c.textAlign = 'center'; c.fillText(en() ? 'Geol: 3' : '걸 — 세 칸', 240, 160); }
    else if (g === 'hop') hopPic(c, 20, 10, W - 40, H - 20, 3); }
  function start(g, ctx = {}) { shut(); const s = GS(g); C = { g, ctx, timers: [], t0: performance.now(), lvp: ctx.solo ? 0 : Math.max(0, s.lv - (ctx.easy ? 1 : 0)), easy: !!ctx.easy, hints: 0, over: false, hintOK: () => false };
    if (g === 'gonu') gonuOpen(); else if (g === 'omok') omokOpen(); else if (g === 'tang') tangOpen(); else if (g === 'mem') memOpen(); else if (g === 'yut') yutOpen();
    if (!C) return false; hold(true); if (!raf) raf = requestAnimationFrame(loop); const LW = s.lw; if (GAMES[g].vs && !ctx.solo && LW && LW.lv === C.lvp && LW.d && day() - LW.d < 7 && !C.saidLW) { C.saidLW = 1; say((en() ? 'Guest: “That move last time was good. One more game?”' : '손님: “지난번 그 수 좋았어요. 오늘도 한 판 해요.”')); }   /* 단골 기억(진 손님이 다음에 그 일을 말함) */
    if (A.rec) A.rec('table', { g, ph: 'start', lv: C.lvp }); return true; }
  function openPanel(inner, W, H, draw) { C.P = A.openP(frame(inner, stdBtns()), false, 'table'); bind(C.P); C.W = W; C.H = H; const cv = C.P.querySelector('.tb-cv'); if (cv) { C.cv = cv; C.g2 = fitCv(cv, W, H); C.draw = draw; rz = () => { if (C && C.cv) { C.g2 = fitCv(C.cv, C.W, C.H, C.rsv || 236); C.dirty = true; } }; addEventListener('resize', rz); } }
  // 끝 → 사다리·보상·남는 것(판 · 놀이 상자 · 저녁 요약 한 줄)
  function finish(r) { const c = C; if (!c || c.over) return; c.over = true; const g = c.g, s = GS(g), e = en(), lv = c.lvp, sec = Math.round((performance.now() - c.t0) / 100) / 10, solo = !!c.ctx.solo, T = TS();
    const out = []; let up = 0; if (!solo) { s.n = (s.n | 0) + 1; if (r.win) s.w = (s.w | 0) + 1; const good = r.st >= 2 || (g === 'gonu' && r.draw && lv >= 1); if (good && !c.easy) { s.good = (s.good | 0) + 1; s.fail = 0; if (s.good >= 3 && s.lv < 2 && lv === s.lv) { s.lv++; s.good = 0; up = s.lv; } } else if (!good) s.fail = (s.fail | 0) + 1; else s.fail = 0; if (!(s.best['s' + lv] >= r.st)) s.best['s' + lv] = r.st;
      if (r.win && !T.box[g]) { T.box[g] = day() || 1; out.push((e ? '🎁 You got the ' : '🎁 ') + esc(GAMES[g].t[L()]) + (e ? ' game box. It is on the café shelf now, and you can put it on the shelf at home.' : ' 놀이 상자를 받았어요. 카페 선반에 놓였고, 우리 집 선반에도 놓여요.')); }
      if (r.win && GAMES[g].vs && lv === 2) { const got = A.bagAdd ? A.bagAdd('🥤', 1, 'table:drink') : 0; out.push(got ? (e ? '🥤 The expert guest bought you a drink downstairs.' : '🥤 고수 손님이 1층에서 음료 한 잔을 사 줬어요.') : (e ? 'The expert guest smiles: “Again tomorrow!”' : '고수 손님이 웃어요. “내일 또 해요!”')); }
      if (r.win && r.snap) { T.last[g] = { d: day() || 1, s: r.snap }; out.push(e ? 'The board stays on the table as it is.' : '이긴 판이 탁자 위에 그대로 남아요.'); }
      if (r.win || r.st >= 2) { const lg = T.log && T.log.d === day() ? T.log : null; if (!lg || (lg.lv | 0) <= lv) T.log = { d: day(), g, lv, t: r.logT || '' }; }
      if (r.win) s.lw = { lv, d: day() || 1 }; }
    if (A.rec) A.rec('table', { g, ph: 'end', lv, win: !!r.win, draw: !!r.draw, st: r.st, sec, hints: c.hints, solo }); mark();
    const upT = up ? (e ? ['', 'The regular guest waves: “Play with me too!”', 'The expert guest waves: “Play with me too!”'][up] : ['', '단골 손님이 손짓해요. “저랑도 한 판 해요.”', '고수 손님이 손짓해요. “저랑도 한 판 해요.”'][up]) : '';
    const easyT = !solo && GAMES[g].vs && s.fail >= 3 && C.lvp > 0 ? (e ? 'You can pick “One step easier” for the next game.' : '다음 판은 \'한 칸 쉽게\'를 골라도 돼요.') : (!solo && s.fail >= 2 && !r.win ? (e ? 'Next game, press 💡 Hint to see a good spot for 2 seconds.' : '다음 판엔 💡 힌트를 누르면 둘 만한 자리가 2초 반짝여요.') : '');
    const box = C.P.querySelector('.tb-res') || (() => { const d = document.createElement('div'); d.className = 'tb-res'; const m = C.P.querySelector('.tb-msg'); m.parentNode.insertBefore(d, m.nextSibling); return d; })();
    box.innerHTML = '<b>' + esc(r.head) + '</b>' + (r.why ? '<br>' + esc(r.why) : '') + out.map(t => '<br>' + t).join('') + (upT ? '<br>' + esc(upT) : '') + (easyT ? '<br><span class="sm">' + esc(easyT) + '</span>' : '');
    todo(r.win ? (e ? 'Play again or stop.' : '한 판 더 하거나 그만해요.') : (e ? 'Try again, or stop for now.' : '한 판 더 해 보거나, 오늘은 그만해요.')); setBtns(B('again', e ? 'One more game' : '한 판 더') + (!solo && GAMES[g].vs && s.fail >= 3 && s.lv > 0 && !c.easy ? B('easy', e ? 'One step easier' : '한 칸 쉽게', 1) : '') + B('x', e ? 'Stop' : '그만', 1));
    if (C.cv) { C.rsv = 236 + box.offsetHeight + 12; C.g2 = fitCv(C.cv, C.W, C.H, C.rsv); C.dirty = true; } else { const bx = C.P.querySelector('.bx'); if (bx) bx.scrollTop = bx.scrollHeight; }   /* 결과 칸만큼 판을 줄여 단추(한 판 더 · 그만)가 늘 보이게 */
    if (A.sfx) A.sfx(r.win || r.st >= 2 ? 'done' : 'tick'); if (r.win && A.onWin) A.onWin(g, lv); }

  // ───── 우물고누 ─────
  function gonuOpen() { const solo = !!C.ctx.solo, first = solo ? 0 : (GS('gonu').n | 0) % 2; C.st = gonuStart(first); C.blink = 0; C.hintOK = () => !solo && GS('gonu').fail >= 2 && !C.over && C.st.turn === 0;
    openPanel('<canvas class="tb-cv"></canvas>', 360, 330, gonuDraw); const e = en();
    C.hint9 = () => { C.hp = gonuHint(C.st); C.blink = performance.now() + 2000; C.hints++; };
    C.cv.addEventListener('pointerdown', ev => { if (C.over || C.busy || (!solo && C.st.turn !== 0)) return; const [x, y] = ptr(C.cv, ev, 360, 330), G9 = C.geo; if (!G9) return; const ms = gonuMoves(C.st); let pick = null; for (const m of ms) if (Math.hypot(G9.X(m[0]) - x, G9.Y(m[0]) - y) < G9.r * 1.6) pick = m; if (!pick) { if (ms.length) msg(e ? 'Tap a piece with a yellow ring.' : '노란 테두리가 있는 말을 눌러요.'); return; } gonuStep(pick); });
    C.anim = () => { if (C.dirty || C.blink) { C.dirty = false; if (C.blink && performance.now() > C.blink) C.blink = 0; gonuDraw(); } }; C.dirty = true; gonuTurn(); }
  function gonuDraw() { const g = C.g2, W = 360, H = 330; g.fillStyle = '#f3e2c2'; g.fillRect(0, 0, W, H); const solo = !!C.ctx.solo, mine = !C.over && (solo || C.st.turn === 0) && !C.busy, mov = mine ? gonuMoves(C.st).map(m => m[0]) : [];
    C.geo = drawGonu(g, 0, 8, W, H - 8, C.st, { label: en() ? 'well' : '우물', mov, hint: C.blink ? (C.hp && C.hp[0]) : -1, blink: C.blink && ((performance.now() / 250) | 0) % 2 === 0 }); }
  function gonuTurn() { const e = en(), solo = !!C.ctx.solo, st = C.st, o = gonuOver(st); C.dirty = true;
    if (o !== null) { const win = o === 0, draw = o === 'draw'; if (solo) { finish({ win: false, st: 1, head: draw ? (e ? 'Draw — nobody could trap the other.' : '비겼어요. 서로 막지 못했어요.') : (o === 0 ? (e ? 'White wins!' : '흰 말이 이겼어요!') : (e ? 'Black wins!' : '검은 말이 이겼어요!')) }); return; }
      finish({ win, draw, st: win ? (C.hints ? 2 : 3) : 1, snap: win ? gKey(st.a, st.b, st.turn) : null, logT: e ? 'won Well gonu against the ' + LV_NAME[C.lvp][1].toLowerCase() : '우물고누에서 ' + LV_NAME[C.lvp][0] + '을 이겼어요', head: win ? (e ? 'You win! The guest’s pieces cannot move.' : '이겼어요! 손님 말이 움직일 곳이 없어요.') : draw ? (e ? 'Draw — 40 moves and nobody was trapped.' : '비겼어요. 마흔 수 동안 아무도 갇히지 않았어요.') : (e ? 'The guest wins. My pieces had nowhere to go.' : '손님이 이겼어요. 내 말이 갈 곳이 없었어요.'), why: win ? '' : draw ? (e ? 'Tip: when both corners on one side are yours and the middle is empty, move the piece next to the well into the middle.' : '도움말: 한쪽 두 귀가 다 내 말이고 가운데가 비면, 우물 옆 말을 가운데로 옮겨 보세요.') : (e ? 'Tip: before moving, check whether the guest could trap you next.' : '도움말: 옮기기 전에, 손님이 다음에 나를 가둘 수 있는지 살펴봐요.') }); return; }
    const left = GONU.CAP - st.ply; if (solo) { todo(st.turn === 0 ? (e ? 'White’s turn: move a white piece.' : '흰 말 차례예요. 흰 말을 빈 자리로 옮겨요.') : (e ? 'Black’s turn: move a black piece.' : '검은 말 차례예요. 검은 말을 빈 자리로 옮겨요.')); msg(left <= 10 ? (e ? left + ' moves until a draw' : left + '수 뒤에 비겨요') : ''); return; }
    if (st.turn === 0) { todo(e ? 'Move one white piece into the empty spot. Trap the guest to win.' : '흰 말 하나를 빈 자리로 옮겨요. 손님 말을 가두면 이겨요.'); msg(left <= 10 ? (e ? left + ' moves until a draw' : left + '수 뒤에 비겨요') : (st.ply === 0 ? (e ? 'You go first.' : '내가 먼저 해요.') : '')); setBtns(stdBtns()); return; }
    todo(e ? 'The guest is thinking…' : '손님 차례예요. 손님이 생각해요…'); msg(''); C.busy = true; later(() => { C.busy = false; const m = gonuAI(C.st, C.lvp, R); if (m) { C.st = gonuPlay(C.st, m); if (A.sfx) A.sfx('tick'); } gonuTurn(); }, 650 + R() * 350); }
  function gonuStep(m) { C.st = gonuPlay(C.st, m); C.blink = 0; if (A.sfx) A.sfx('pop'); gonuTurn(); }

  // ───── 오목 ─────
  function omokOpen() { C.st = omokStart(); C.ghost = -1; C.blink = 0; C.hintOK = () => GS('omok').fail >= 2 && !C.over && C.st.turn === 1;
    openPanel('<canvas class="tb-cv"></canvas>', 380, 380, omokDraw); const e = en();
    C.hint9 = () => { C.hp = omokHint(C.st); C.blink = performance.now() + 2000; C.hints++; C.dirty = true; };
    const cell = ev => { const [x, y] = ptr(C.cv, ev, 380, 380), G9 = C.geo; if (!G9) return -1; const i = Math.round((x - G9.P(0)[0]) / G9.st), j = Math.round((y - G9.P(0)[1]) / G9.st); return i >= 0 && j >= 0 && i < OM && j < OM ? j * OM + i : -1; };
    C.cv.addEventListener('pointermove', ev => { const k = cell(ev); if (k !== C.ghost) { C.ghost = k; C.dirty = true; } });
    C.cv.addEventListener('pointerleave', () => { C.ghost = -1; C.dirty = true; });
    C.cv.addEventListener('pointerdown', ev => { if (C.over || C.busy || C.st.turn !== 1) return; const k = cell(ev); if (k < 0) return; if (C.st.b[k]) { msg(e ? 'There is already a stone there.' : '거기는 이미 돌이 있어요.'); return; } omokStep(k); });
    C.anim = () => { if (C.dirty || C.blink) { C.dirty = false; if (C.blink && performance.now() > C.blink) C.blink = 0; omokDraw(); } }; C.dirty = true; omokTurn(); }
  function omokDraw() { const g = C.g2; g.fillStyle = '#f3e2c2'; g.fillRect(0, 0, 380, 380); C.geo = drawOmok(g, 0, 0, 380, 380, C.st.b, { last: C.st.last, line: C.line, ghost: !C.over && C.st.turn === 1 && !C.busy ? C.ghost : -1, hint: C.blink ? C.hp : -1, blink: C.blink && ((performance.now() / 250) | 0) % 2 === 0 }); }
  function omokTurn() { const e = en(); C.dirty = true; if (C.st.turn === 1) { todo(e ? 'Place a black stone. Make five in a row first.' : '검은 돌을 놓아요. 다섯 개를 먼저 이어요.'); msg(C.st.n === 0 ? (e ? 'You go first. Start near the middle.' : '내가 먼저 놓아요. 가운데쯤부터 놓아 봐요.') : ''); setBtns(stdBtns()); return; }
    todo(e ? 'The guest is placing a white stone…' : '손님이 흰 돌을 놓아요…'); C.busy = true; later(() => { C.busy = false; const i = omokAI(C.st, C.lvp, R); omokStep(i); }, 550 + R() * 400); }
  function omokStep(i) { const e = en(), me = C.st.turn; C.st = omokPlay(C.st, i); C.blink = 0; if (A.sfx) A.sfx(me === 1 ? 'pop' : 'tick'); const L9 = omokFive(C.st.b, i); C.dirty = true;
    if (L9) { C.line = L9; const win = me === 1; finish({ win, st: win ? (C.hints ? 2 : 3) : 1, snap: win ? Array.from(C.st.b).join('') : null, logT: e ? 'won Omok against the ' + LV_NAME[C.lvp][1].toLowerCase() : '오목에서 ' + LV_NAME[C.lvp][0] + '을 이겼어요', head: win ? (e ? 'Five in a row — you win!' : '다섯 개를 이었어요. 이겼어요!') : (e ? 'The guest made five in a row.' : '손님이 다섯 개를 먼저 이었어요.'), why: win ? '' : (e ? 'Tip: when the guest has three in an open line, block one end.' : '도움말: 손님 돌이 셋 이어지고 양쪽이 비어 있으면 한쪽 끝을 막아요.') }); return; }
    if (C.st.n >= OMN) { finish({ win: false, draw: true, st: 1, head: e ? 'The board is full — a draw.' : '판이 꽉 찼어요. 비겼어요.' }); return; } omokTurn(); }

  // ───── 윷놀이 ─────
  function yutSticks(g, x, y, w, h, up, t, done) { const sw = w * 0.17, sh = h * 0.78; for (let k = 0; k < 4; k++) { const cx = x + w * (0.14 + k * 0.24), cy = y + h * 0.5 - (done ? 0 : Math.sin(Math.min(1, t) * Math.PI) * h * 0.4), rot = done ? (k - 1.5) * 0.08 : t * 9 + k * 0.9;
      g.save(); g.translate(cx, cy); g.rotate(rot); const face = done ? up[k] : ((t * 6 + k) | 0) % 2 === 0; g.fillStyle = face ? '#f3dfb0' : '#a8743f'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); if (g.roundRect) g.roundRect(-sw / 2, -sh / 2, sw, sh, sw / 2); else g.rect(-sw / 2, -sh / 2, sw, sh); g.fill(); g.stroke();
      if (!face) { g.strokeStyle = 'rgba(43,38,34,.55)'; g.lineWidth = 1.6; for (const yy of [-0.25, 0, 0.25]) { g.beginPath(); g.moveTo(-sw * 0.22, yy * sh - sw * 0.2); g.lineTo(sw * 0.22, yy * sh + sw * 0.2); g.moveTo(sw * 0.22, yy * sh - sw * 0.2); g.lineTo(-sw * 0.22, yy * sh + sw * 0.2); g.stroke(); } } g.restore(); } }
  // 윷 창 자리: 넓은 창 = 판 왼쪽 · 윷가락 오른쪽 / 좁은 창(휴대폰 세로) = 판 위 · 윷가락·칸 수·대기 말 아래(글이 너무 작아지지 않게)
  const YLAY = { land: { W: 600, H: 380, bx: 22, by: 26, s: 300, tn: [368, 26], st: [368, 66, 210, 136], rs: [473, 236], bar: [378, 250, 190], hn: [473, 280], cp: [372, 288], tr: [368, 340, 368] },
    port: { W: 380, H: 626, bx: 40, by: 14, s: 300, tn: [222, 372], st: [14, 404, 180, 116], rs: [104, 556], bar: [222, 470, 140], hn: [292, 500], cp: [220, 386], tr: [18, 584, 610] } };   /* 세로 = 차례 글은 오른쪽 위(윷가락이 날아도 안 가림) · 윷가락은 왼쪽(날 때 판·글 밖) */
  function yutOpen() { const first = (GS('yut').n | 0) % 2; C.st = yutStart(first); C.pend = []; C.can = true; C.sel = 0; C.fx = null; C.res = null; C.hov = -1; C.charge = 0;
    const Y = C.yl = Math.min(innerWidth * 0.94, 640) - 42 < 480 ? YLAY.port : YLAY.land; openPanel('<canvas class="tb-cv"></canvas>', Y.W, Y.H, yutDraw); const e = en();
    const pick = ev => { const [x, y] = ptr(C.cv, ev, Y.W, Y.H); for (let i = 0; i < C.pend.length; i++) { const cx = Y.cp[0] + i * 52; if (x > cx && x < cx + 46 && y > Y.cp[1] - 2 && y < Y.cp[1] + 34) return { chip: i }; } const ch = C.st.turn === 0 ? yutChoices(C.st, 0) : []; let best = null, bd = 26;
      for (const j of ch) { const p = C.st.P[0][j]; if (p.r < 0) { const hi = C.st.P[0].filter(q => q.r < 0).length, tx = Y.tr[0] + 42, ty = Y.tr[1]; if (x > tx && x < tx + hi * 24 + 16 && y > ty - 14 && y < ty + 14) return { j }; continue; } const n = yutNode(p), px = Y.bx + YXY[n][0] * Y.s - Y.s * 0.022, py = Y.by + YXY[n][1] * Y.s - Y.s * 0.022, d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = { j }; } } return best; };
    C.cv.addEventListener('pointermove', ev => { if (C.st.turn !== 0 || C.can || !C.pend.length || C.fx) return; const p = pick(ev), j = p && p.j != null ? p.j : -1; if (j !== C.hov) { C.hov = j; C.dirty = true; } });
    C.cv.addEventListener('pointerdown', ev => { if (C.over || C.fx || C.st.turn !== 0) return; if (C.can) { chargeOn(); return; } const p = pick(ev); if (!p) { msg(e ? 'Tap one of your red pieces with a yellow ring.' : '노란 테두리가 있는 빨간 말을 눌러요.'); return; } if (p.chip != null) { C.sel = p.chip; C.dirty = true; return; } yutGo(0, C.sel, p.j); });
    C.cv.addEventListener('pointerup', () => { if (C.charging) throwNow(); }); C.cv.addEventListener('pointerleave', () => { if (C.charging) throwNow(); });
    keyOn = ev => { if (!C || C.g !== 'yut' || !C.P.isConnected) return; if (ev.code !== 'Space' && ev.code !== 'Enter') return; if (ev.type === 'keydown') { if (!ev.repeat && C.can && C.st.turn === 0 && !C.fx && !C.over) chargeOn(); } else if (C.charging) throwNow(); ev.preventDefault(); ev.stopPropagation(); }; addEventListener('keydown', keyOn, true); addEventListener('keyup', keyOn, true);
    C.anim = now => { if (C.charging) { C.charge = Math.min(1, (now - C.chT0) / 700); C.dirty = true; if (A.tone && now - (C.lastTone || 0) > 90) { C.lastTone = now; A.tone(330 + C.charge * 330, 0, 0.05, 'triangle', 0.035); } } if (C.fx) yutFx(now); if (C.dirty) { C.dirty = false; yutDraw(); } };
    C.dirty = true; yutTurn(); }
  function chargeOn() { if (!C.can || C.fx || C.charging) return; C.charging = true; C.chT0 = performance.now(); msg(en() ? 'Let go to throw!' : '손을 떼면 던져요!'); }
  function throwNow() { if (!C.charging) return; C.charging = false; yutThrowFx(0); }
  function yutThrowFx(who) { const t = yutThrow(R); C.fx = { type: 'throw', who, t0: performance.now(), dur: 900, r: t }; C.res = null; if (A.sfx) A.sfx('pop'); }
  function yutFx(now) { const fx = C.fx, u = (now - fx.t0) / fx.dur; C.dirty = true; if (u < 1) return; C.fx = null;
    if (fx.type === 'throw') { const t = fx.r, e = en(); C.res = t; C.pend.push(t.k); C.can = t.again; if (A.tone) { A.tone(180, 0, 0.06, 'square', 0.05); A.tone(140, 0.07, 0.06, 'square', 0.04); } if (A.sfx && t.again) A.sfx('ding');
      const nm = YUT_NAME[t.f][L()], kt = e ? t.k + (t.k > 1 ? ' spots' : ' spot') : ['', '한 칸', '두 칸', '세 칸', '네 칸', '다섯 칸'][t.k]; msg(nm + '! ' + kt + (t.again ? (e ? ' — throw once more!' : ' — 한 번 더 던져요!') : '')); yutTurn(); return; }
    if (fx.type === 'move') { const m = fx.m; C.st = m.st; if (m.cap && A.sfx) A.sfx('ding'); else if (A.sfx) A.sfx('tick'); const e = en(), mine = fx.who === 0;
      if (m.cap) { C.can = true; msg(mine ? (e ? 'Caught the guest’s piece! Throw once more.' : '손님 말을 잡았어요! 한 번 더 던져요.') : (e ? 'The guest caught my piece. It goes back to start.' : '손님이 내 말을 잡았어요. 내 말은 처음으로 돌아가요.')); } else if (m.stack) msg(mine ? (e ? 'Carried! They move together now.' : '업었어요! 이제 같이 가요.') : (e ? 'The guest carried a piece.' : '손님이 말을 업었어요.')); else if (m.out) msg(mine ? (e ? 'A piece made it home!' : '말이 났어요!') : (e ? 'A guest piece made it home.' : '손님 말이 났어요.'));
      if (yutDone(C.st, fx.who)) { yutEnd(fx.who); return; } yutTurn(); } }
  function yutGo(who, ki, j) { const k = C.pend[ki]; if (k == null) return; const p0 = C.st.P[who][j], path = []; for (let s = 1; s <= k; s++) { const d = yutDest(p0, s); path.push(d.r === 9 ? -1 : yutNode(d)); if (d.r === 9) break; } C.pend.splice(ki, 1); C.sel = 0; C.hov = -1;
    const m = yutMove(C.st, who, j, k), grp = p0.r < 0 ? [j] : C.st.P[who].map((p, q) => (p.r >= 0 && p.r !== 9 && yutNode(p) === yutNode(p0) ? q : -1)).filter(q => q >= 0); C.fx = { type: 'move', who, j, grp, from: yutNode(p0), path, m, t0: performance.now(), dur: 150 * path.length + 120 }; }
  function yutTurn() { const e = en(), st = C.st, me = st.turn === 0; C.dirty = true; if (C.over || C.fx) return;
    if (!C.can && !C.pend.length) { st.turn = 1 - st.turn; C.can = true; C.res = null; yutTurn(); return; }
    if (me) { if (C.can) { todo(C.pend.length ? (e ? 'Throw once more (hold, then let go).' : '한 번 더 던져요. (꾹 눌렀다가 떼요)') : (e ? 'Throw the yut sticks: press and hold, then let go.' : '윷가락을 던져요. 판을 꾹 눌렀다가 떼요.' + (A.touch && A.touch() ? '' : ' (스페이스도 돼요)'))); return; }
      const k = C.pend[C.sel]; todo((e ? 'Move a red piece ' : '빨간 말 하나를 ') + (e ? k + (k > 1 ? ' spots' : ' spot') : ['', '한 칸', '두 칸', '세 칸', '네 칸', '다섯 칸'][k] + ' 옮겨요') + (C.pend.length > 1 ? (e ? ' (tap a number on the right to switch)' : ' (오른쪽 칸 수를 눌러 바꿀 수 있어요)') : '') + '.'); return; }
    todo(e ? 'The guest’s turn…' : '손님 차례예요…'); C.busy = true; later(() => { C.busy = false; if (C.over) return; if (C.can) { yutThrowFx(1); return; } const pl = yutPlan(C.st, 1, C.pend, C.lvp, R); yutGo(1, pl.ki, pl.j); }, C.can ? 650 : 450); }
  function yutEnd(w) { const e = en(), win = w === 0; C.dirty = true; finish({ win, st: win ? 3 : 1, snap: win ? JSON.stringify(C.st.P) : null, logT: e ? 'won Yut against the ' + LV_NAME[C.lvp][1].toLowerCase() : '윷놀이에서 ' + LV_NAME[C.lvp][0] + '을 이겼어요', head: win ? (e ? 'All four pieces are home — you win!' : '내 말 넷이 다 났어요. 이겼어요!') : (e ? 'The guest’s four pieces got home first.' : '손님 말 넷이 먼저 났어요.'), why: win ? '' : (e ? 'Tip: carry pieces together, and stop on corners to take shortcuts.' : '도움말: 말을 업어서 같이 가고, 모서리에 딱 멈추면 지름길로 가요.') }); }
  function yutDraw() { const g = C.g2, st = C.st, e = en(), Y = C.yl, BX = Y.bx, BY = Y.by, BS = Y.s; g.fillStyle = '#f3e2c2'; g.fillRect(0, 0, Y.W, Y.H);
    let P = st.P; const fx = C.fx; if (fx && fx.type === 'move') P = [st.P[0].map((p, q) => (fx.who === 0 && fx.grp.includes(q) ? { r: -2, i: 0 } : p)), st.P[1].map((p, q) => (fx.who === 1 && fx.grp.includes(q) ? { r: -2, i: 0 } : p))];
    drawYutBoard(g, BX, BY, BS, P.map(L9 => L9.map(p => (p.r === -2 ? { r: -1, i: 0 } : p))), { label: e ? 'start' : '출발' });
    if (fx && fx.type === 'move') { const u = Math.min(1, (performance.now() - fx.t0) / (150 * fx.path.length)), seg = Math.min(fx.path.length - 1, Math.floor(u * fx.path.length)), f = u * fx.path.length - seg, a = seg === 0 ? fx.from : fx.path[seg - 1], b = fx.path[seg], pos = n => (n == null || n < 0 ? [BX + BS * 1.08, BY + BS * 1.02] : [BX + YXY[n][0] * BS, BY + YXY[n][1] * BS]), A9 = a < 0 && seg === 0 ? [BX + BS * 1.04, BY + BS * 1.0] : pos(a), Z9 = pos(b), hop = Math.sin(f * Math.PI) * 12;
      g.fillStyle = fx.who ? '#3d74c9' : '#e0453a'; g.beginPath(); g.arc(A9[0] + (Z9[0] - A9[0]) * f, A9[1] + (Z9[1] - A9[1]) * f - hop, BS * 0.04, 0, 6.2832); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); if (fx.grp.length > 1) { g.fillStyle = '#fff'; g.font = '900 13px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(fx.grp.length), A9[0] + (Z9[0] - A9[0]) * f, A9[1] + (Z9[1] - A9[1]) * f - hop + 1); } }
    const me = st.turn === 0 && !C.over, ch = me && !C.can && !fx && C.pend.length ? yutChoices(st, 0) : [];
    for (const j of ch) { const p = st.P[0][j]; if (p.r < 0) continue; const n = yutNode(p), x = BX + YXY[n][0] * BS - BS * 0.022, y = BY + YXY[n][1] * BS - BS * 0.022; g.strokeStyle = '#f2c230'; g.lineWidth = 3.5; g.beginPath(); g.arc(x, y, BS * 0.058, 0, 6.2832); g.stroke(); }
    if (C.hov >= 0 && ch.includes(C.hov) && C.pend.length) { const d = yutDest(st.P[0][C.hov], C.pend[C.sel]), n = d.r === 9 ? -1 : yutNode(d); if (n >= 0) { g.setLineDash([5, 4]); g.strokeStyle = '#e0453a'; g.lineWidth = 3; g.beginPath(); g.arc(BX + YXY[n][0] * BS, BY + YXY[n][1] * BS, BS * 0.055, 0, 6.2832); g.stroke(); g.setLineDash([]); } }
    g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.font = '900 17px sans-serif'; g.fillText(C.over ? '' : st.turn === 0 ? (e ? 'My turn (red)' : '내 차례 (빨강)') : (e ? 'Guest’s turn (blue)' : '손님 차례 (파랑)'), Y.tn[0], Y.tn[1]);
    const tr = fx && fx.type === 'throw' ? fx : null; yutSticks(g, Y.st[0], Y.st[1], Y.st[2], Y.st[3], tr ? tr.r.sticks : C.res ? C.res.sticks : [true, false, true, false], tr ? (performance.now() - tr.t0) / tr.dur : 1, !tr && !!C.res);
    if (!tr && C.res) { g.fillStyle = INK; g.font = '900 26px sans-serif'; g.textAlign = 'center'; g.fillText(YUT_NAME[C.res.f][L()] + (e ? ' ' + C.res.k : ' · ' + ['', '한 칸', '두 칸', '세 칸', '네 칸', '다섯 칸'][C.res.k]), Y.rs[0], Y.rs[1]); }
    if (C.charging || (me && C.can && !tr)) { const [x, y, w] = Y.bar; g.fillStyle = '#e9d3a8'; g.fillRect(x, y, w, 14); g.fillStyle = '#e0453a'; g.fillRect(x, y, w * (C.charge || 0), 14); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x, y, w, 14); g.fillStyle = INK; g.font = '800 14px sans-serif'; g.textAlign = 'center'; g.fillText(e ? 'press and hold, then let go' : '꾹 눌렀다가 떼면 던져요', Y.hn[0], Y.hn[1]); }
    C.pend.forEach((k, i) => { const x = Y.cp[0] + i * 52, y = Y.cp[1], on = i === C.sel && st.turn === 0; g.fillStyle = on ? '#f2c230' : '#fffaf0'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); if (g.roundRect) g.roundRect(x, y, 46, 32, 8); else g.rect(x, y, 46, 32); g.fill(); g.stroke(); g.fillStyle = INK; g.font = '900 15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(YUT_NAME[[0, 1, 2, 3, 4, 0][k]][L()] + k, x + 23, y + 17); g.textBaseline = 'alphabetic'; });
    [[0, Y.tr[1], '#e0453a', e ? 'Mine' : '내 말'], [1, Y.tr[2], '#3d74c9', e ? 'Guest' : '손님']].forEach(([w, y, c, t]) => { const lx = Y.tr[0], H9 = st.P[w].filter(p => p.r < 0).length, O9 = st.P[w].filter(p => p.r === 9).length; g.fillStyle = INK; g.font = '800 14px sans-serif'; g.textAlign = 'left'; g.fillText(t, lx, y + 5); for (let k = 0; k < H9; k++) { g.fillStyle = c; g.beginPath(); g.arc(lx + 56 + k * 24, y, 10, 0, 6.2832); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); } if (w === 0 && ch.some(j => st.P[0][j].r < 0)) { g.strokeStyle = '#f2c230'; g.lineWidth = 3; g.strokeRect(lx + 42, y - 13, H9 * 24 + 4, 26); } g.fillStyle = INK; g.fillText((e ? 'home ' : '난 말 ') + O9, lx + 164, y + 5); }); }   /* 내 말·손님 대기 줄(판 '출발' 글자와 겹치지 않게) */

  // ───── 칠교놀이 ─────
  const TW = 600, TH = 380, TBX = 380;
  function tangOpen() { const s = GS('tang'), lv = C.lvp, L2 = TANG_LADDER[lv], id = L2[(s.n | 0) % L2.length], sh = TANG_SHAPES[id], e = en(), firstEver = !(s.n | 0) && !C.ctx.solo;
    C.sh = sh; C.id = id; C.used = new Array(7).fill(false); C.sel = -1; C.blink = 0; C.hintOK = () => !C.over;
    const [x0, y0, x1, y1] = tangBox(sh), mx = sh.mx, spanX0 = sh.mir ? x0 : x0, spanX1 = sh.mir ? 2 * mx - x0 : x1, u = Math.min(42, (TBX - 30) / (spanX1 - spanX0), (TH - 40) / (y1 - y0)); C.u = u; C.ox = (TBX - (spanX1 - spanX0) * u) / 2 - spanX0 * u; C.oy = (TH + (y1 - y0) * u) / 2 + y0 * u;
    const TRAY = [[430, 70], [535, 70], [430, 175], [535, 178], [430, 285], [535, 285], [485, 345]], toS = (X, Y) => [(X - C.ox) / u, (C.oy - Y) / u];
    C.pc = TANG_PIECES.map((pc, i) => { const [cx, cy] = toS(TRAY[i][0], TRAY[i][1]); return { i, pc, a: (R() * 8) | 0, f: R() < 0.5 ? 1 : 0, cx, cy, slot: -1 }; });
    if (firstEver) { C.pc.forEach(p => { if (p.pc.k === 'PA') { const si = sh.s.findIndex(q => q[0] === 'PA'), po = tangPoseFor(sh, si, p.pc); if (po) p.f = po.f; } }); let k = 0; C.pc.forEach(p => { if (p.pc.k !== 'LT' || k >= 2) return; const si = sh.s.findIndex((q, i) => q[0] === 'LT' && !C.used[i]), po = tangPoseFor(sh, si, p.pc); Object.assign(p, { a: po.a, f: po.f, cx: po.cx, cy: po.cy, slot: si }); C.used[si] = true; k++; }); C.pre = 2; }
    openPanel('<canvas class="tb-cv"></canvas>', TW, TH, tangDraw);
    const kt = !(A.touch && A.touch()); setBtns('<button class="sub" data-a="rl">↺ ' + (e ? 'Turn left' : '왼쪽 돌리기') + '</button><button class="sub" data-a="rr">↻ ' + (e ? 'Turn right' : '오른쪽 돌리기') + (kt ? ' (R)' : '') + '</button><button class="sub" data-a="fl">⇋ ' + (e ? 'Flip' : '뒤집기') + (kt ? ' (T)' : '') + '</button>' + stdBtns());   /* 터치엔 키 글자 X(TOUCH-2) */
    C.hint9 = () => { const i = sh.s.findIndex((q, k) => !C.used[k]); if (i < 0) return; const p = C.pc.find(q => q.slot < 0 && q.pc.k === sh.s[i][0]); C.hs = i; C.hpi = p ? p.i : -1; if (p) C.sel = p.i; C.blink = performance.now() + 2200; C.hints++; C.dirty = true; msg(e ? 'The blinking piece goes in the red outline.' : '반짝이는 조각이 빨간 테두리 자리에 들어가요.'); };
    const turn = d => { const p = C.pc[C.sel]; if (!p) { msg(e ? 'First tap a piece to pick it.' : '먼저 조각을 눌러 골라요.'); return; } if (p.slot >= 0) { C.used[p.slot] = false; p.slot = -1; } if (d === 'f') p.f = 1 - p.f; else p.a = (p.a + (d > 0 ? 7 : 1)) % 8; if (A.sfx) A.sfx('tick'); fitTry(p, false); C.dirty = true; };
    C.btn = a => { if (C.over) return; if (a === 'rl') turn(-1); else if (a === 'rr') turn(1); else if (a === 'fl') turn('f'); };
    keyOn = ev => { if (!C || C.g !== 'tang' || !C.P.isConnected || ev.type !== 'keydown' || C.over) return; if (ev.code === 'KeyR') { turn(ev.shiftKey ? -1 : 1); ev.preventDefault(); ev.stopPropagation(); } else if (ev.code === 'KeyT') { turn('f'); ev.preventDefault(); ev.stopPropagation(); } }; addEventListener('keydown', keyOn, true);
    const hit = (X, Y) => { const [x, y] = toS(X, Y); for (let k = C.pc.length - 1; k >= 0; k--) { const p = C.order ? C.pc[C.order[k]] : C.pc[k]; if (inPoly(x, y, tangVerts(p.pc, p.a, p.f, p.cx, p.cy))) return p; } return null; };
    let drag = null, lastTap = 0;
    C.cv.addEventListener('pointerdown', ev => { if (C.over) return; ev.preventDefault(); const [X, Y] = ptr(C.cv, ev, TW, TH), p = hit(X, Y); if (!p) return; C.sel = p.i; C.order = (C.order || C.pc.map(q => q.i)).filter(i => i !== p.i).concat(p.i); const now = performance.now(); if (now - lastTap < 320 && p.i === drag9) { turn(1); lastTap = 0; return; } lastTap = now; drag9 = p.i; if (p.slot >= 0) { C.used[p.slot] = false; p.slot = -1; } drag = { p, dx: X, dy: Y, cx: p.cx, cy: p.cy, moved: false }; C.cv.setPointerCapture && C.cv.setPointerCapture(ev.pointerId); C.dirty = true; });
    let drag9 = -1;
    C.cv.addEventListener('pointermove', ev => { if (!drag) return; const [X, Y] = ptr(C.cv, ev, TW, TH); drag.p.cx = drag.cx + (X - drag.dx) / u; drag.p.cy = drag.cy - (Y - drag.dy) / u; drag.moved = drag.moved || Math.hypot(X - drag.dx, Y - drag.dy) > 4; C.dirty = true; });
    const up = () => { if (!drag) return; const p = drag.p; drag = null; fitTry(p, true); C.dirty = true; }; C.cv.addEventListener('pointerup', up); C.cv.addEventListener('pointercancel', up);
    C.anim = () => { if (C.dirty || C.blink) { C.dirty = false; if (C.blink && performance.now() > C.blink) C.blink = 0; tangDraw(); } };
    todo(e ? 'Drag the pieces onto the shadow. Turn or flip them to fit.' : '조각을 그림자 위로 끌어다 놓아요. 안 맞으면 돌리거나 뒤집어요.'); msg(firstEver ? (e ? 'A guest put the two big triangles (the roof) in first.' : '옆자리 손님이 큰 세모 둘(지붕)을 먼저 놓아 줬어요.') : sh.mir ? (e ? 'Build the shape flipped over the dashed line (like a mirror).' : '점선을 거울처럼, 오른쪽 모양을 뒤집은 모양으로 왼쪽에 만들어요.') : lv === 0 ? (e ? 'The lines show where each piece goes.' : '그림자 안 선을 보면 조각 자리가 보여요.') : (e ? 'Only the shadow this time — no lines.' : '이번엔 선 없이 그림자만 있어요.')); C.dirty = true; }
  function fitTry(p, drop) { const e = en(), i = tangFit(C.sh, p.pc, p.a, p.f, p.cx, p.cy, C.used, C.lvp === 0 ? 0.7 : 0.55); if (i >= 0) { const c = tangSlotCen(C.sh.s[i][1]); p.cx = c[0]; p.cy = c[1]; p.slot = i; C.used[i] = true; if (A.sfx) A.sfx('pop'); const n = C.used.filter(Boolean).length; if (n >= 7) tangDone(); else msg((e ? 'It fits! ' : '딱 맞았어요! ') + (e ? (7 - n) + ' left' : (7 - n) + '조각 남았어요')); return; }
    if (drop) { const x = p.cx * C.u + C.ox; if (x < TBX) { const near = C.sh.s.some(([k, S], k2) => !C.used[k2] && k === p.pc.k && Math.hypot(tangSlotCen(S)[0] - p.cx, tangSlotCen(S)[1] - p.cy) < 0.8); msg(near ? (e ? 'Almost! Try turning or flipping it.' : '거의 다 왔어요! 돌리거나 뒤집어 봐요.') : ''); } } }
  function tangDone() { msg(''); const e = en(), sec = (performance.now() - C.t0) / 1000, par = [60, 90, 120][C.lvp], st = 1 + (C.hints ? 0 : 1) + (sec <= par ? 1 : 0); C.dirty = true; const T = TS(); const sv = T.last.tang && Array.isArray(T.last.tang.s) ? T.last.tang.s : []; if (!C.ctx.solo && !sv.includes(C.id)) sv.push(C.id);
    finish({ win: !C.ctx.solo, st: C.ctx.solo ? 1 : st, snap: C.ctx.solo ? null : sv, logT: e ? 'made the ' + C.sh.t[1].toLowerCase() + ' in Tangram' : '칠교놀이로 ' + C.sh.t[0] + ' 모양을 맞췄어요', head: (e ? 'Done! It is a ' : '다 맞췄어요! ') + C.sh.t[L()] + (e ? '.' : ' 모양이에요.'), why: (C.ctx.solo ? '' : (e ? 'The shape will hang as a shadow picture on the café window. ' : '맞춘 모양은 카페 창에 그림자 판으로 걸려요. ')) + (e ? 'Slide (move), turn and flip are the three ways to move a shape.' : '밀기, 돌리기, 뒤집기는 도형을 움직이는 세 가지 방법이에요.') }); }
  function tangDraw() { const g = C.g2, u = C.u, sh = C.sh, e = en(), lv = C.lvp; g.fillStyle = '#f3e2c2'; g.fillRect(0, 0, TW, TH); g.fillStyle = '#ead2a8'; g.fillRect(TBX, 0, TW - TBX, TH); g.strokeStyle = 'rgba(90,60,38,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(TBX, 8); g.lineTo(TBX, TH - 8); g.stroke();
    if (sh.mir) { const base = TANG_SHAPES[sh.base]; drawTangShape(g, base, C.ox, C.oy, u, { fill: 'rgba(61,116,201,.35)', lines: 'rgba(43,38,34,.35)' }); g.setLineDash([8, 6]); g.strokeStyle = '#5a3c26'; g.lineWidth = 2.5; const X = C.ox + sh.mx * u; g.beginPath(); g.moveTo(X, 14); g.lineTo(X, TH - 14); g.stroke(); g.setLineDash([]); g.fillStyle = '#5a3c26'; g.font = '800 13px sans-serif'; g.textAlign = 'center'; g.fillText(e ? 'mirror line' : '거울 선', X, 12); }
    else drawTangShape(g, sh, C.ox, C.oy, u, { lines: lv === 0 ? 'rgba(255,255,255,.75)' : null });
    if (C.blink && C.hs >= 0 && ((performance.now() / 250) | 0) % 2 === 0) { const V = sh.s[C.hs][1]; g.strokeStyle = '#e0453a'; g.lineWidth = 3.5; g.beginPath(); V.forEach(([x, y], k) => { const X = C.ox + x * u, Y = C.oy - y * u; if (k) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath(); g.stroke(); }
    const ord = C.order || C.pc.map(q => q.i); for (const i of ord) { const p = C.pc[i], V = tangVerts(p.pc, p.a, p.f, p.cx, p.cy); g.fillStyle = p.pc.c; g.beginPath(); V.forEach(([x, y], k) => { const X = C.ox + x * u, Y = C.oy - y * u; if (k) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath(); g.fill(); g.strokeStyle = i === C.sel ? '#fff' : INK; g.lineWidth = i === C.sel ? 3.5 : 2; g.stroke(); if (i === C.sel) { g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke(); } if (C.blink && i === C.hpi && ((performance.now() / 250) | 0) % 2 === 0) { g.strokeStyle = '#e0453a'; g.lineWidth = 4; g.stroke(); } } }

  // ───── 마을 카드 짝 맞추기 ─────
  const REGIC = { 들: '🌾', 산: '⛰', 바다: '🌊', 강: '💧', 시내: '🏙' }, REGEN = { 들: 'Fields', 산: 'Mountains', 바다: 'Sea', 강: 'River', 시내: 'Downtown' };
  function memPairs(n, similar) { const e = en(), l = L(), P = [], uA = new Set(), uB = new Set(), sh = a => { for (let i = a.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const add = (a, b, key, info) => { if (P.length >= n || uA.has(a.t) || uB.has(b.t)) return; uA.add(a.t); uB.add(b.t); P.push({ a, b, key, info }); };
    let st = []; try { st = (A.stamped ? A.stamped() : []).filter(p => p && p.name && (p.jobs || []).some(k => JOBS[k])); } catch (x) { st = []; } st = sh(st); if (similar) st.sort((p, q) => (p.g < q.g ? -1 : p.g > q.g ? 1 : 0));
    const its = sh(Object.keys(ITEMS).filter(k => { const I = ITEMS[k]; return I && (I[2] === 'food' || I[2] === 'treat') && REGIC[I[4]]; })), regs = sh(Object.keys(REGIC)), half = Math.ceil(n / 2);
    for (const p of st) { if (P.length >= (similar ? n : Math.max(n - regs.length, half))) break; const jk = sh((p.jobs || []).filter(k => JOBS[k]).slice())[0], J = JOBS[jk]; add({ ic: 'svg:' + jk, t: J[0][l] }, { ic: PG[p.g] ? PG[p.g][0] : '📍', t: p.name }, 'p:' + p.name, J[0][l] + ' — ' + J[1][l]); }
    for (const r of regs) { const k = its.find(q => ITEMS[q][4] === r); if (k) add({ ic: k, t: ITEMS[k][l] }, { ic: REGIC[r], t: e ? REGEN[r] : r }, 'i:' + k, e ? ITEMS[k][1] + ' comes from the ' + REGEN[r].toLowerCase() + '.' : ITEMS[k][0] + jo(ITEMS[k][0], '은', '는') + ' ' + r + '에서 나요.'); }
    for (const p of st) add({ ic: 'svg:' + p.jobs.find(k => JOBS[k]), t: JOBS[p.jobs.find(k => JOBS[k])][0][l] }, { ic: PG[p.g] ? PG[p.g][0] : '📍', t: p.name }, 'p:' + p.name, '');
    return P.slice(0, n); }
  function memOpen() { const lv = C.lvp, n = lv === 0 ? 6 : 8, e = en(); C.pairs = memPairs(n, lv === 2); C.cards = memDeal(C.pairs, R); C.open = []; C.got = 0; C.miss = 0; C.flips = 0; C.hintOK = () => false;
    const cols = 4; openPanel('<div class="tb-grid" style="grid-template-columns:repeat(' + cols + ',1fr)">' + C.cards.map((c, i) => '<button class="tb-card" data-c="' + i + '" aria-label="' + (e ? 'card' : '카드') + '"><span class="bk">★</span></button>').join('') + '</div>', 0, 0, null);
    const face = c => { const q = C.pairs[c.p][c.s ? 'b' : 'a'], ic = String(q.ic).startsWith('svg:') ? jobSvg(q.ic.slice(4), c.p % 2 === 0, c.p % 3) : esc(q.ic); return '<span class="ci">' + ic + '</span><span>' + esc(q.t) + '</span>'; };
    const els = [...C.P.querySelectorAll('.tb-card')], cover = i => { els[i].className = 'tb-card'; els[i].innerHTML = '<span class="bk">★</span>'; }, show = i => { els[i].className = 'tb-card up'; els[i].innerHTML = face(C.cards[i]); };
    C.flip = i => { if (C.over || C.cards[i].done || C.open.includes(i)) return; if (C.open.length >= 2) { for (const k of C.open) cover(k); C.open = []; } show(i); C.open.push(i); C.flips++; if (A.sfx) A.sfx('tick');
      if (C.open.length === 2) { const [a, b] = C.open, A9 = C.cards[a], B9 = C.cards[b]; if (A9.p === B9.p) { A9.done = B9.done = true; els[a].className = els[b].className = 'tb-card ok'; C.open = []; C.got++; if (A.sfx) A.sfx('pop'); const pr = C.pairs[A9.p]; msg(pr.info || ''); const M = TS().mem; if (!M[pr.key]) M[pr.key] = day() || 1; if (C.got >= C.pairs.length) memDone(); else todo((e ? 'Find the next pair. ' : '다음 짝을 찾아요. ') + (C.pairs.length - C.got) + (e ? ' left.' : '쌍 남았어요.')); }
        else { C.miss++; const o2 = C.open.slice(); later(() => { if (C.open.length === 2 && C.open[0] === o2[0] && C.open[1] === o2[1]) { for (const k of o2) cover(k); C.open = []; } }, 850); } } };
    C.P.querySelector('.tb-grid').addEventListener('click', ev => { const b = ev.target.closest('.tb-card'); if (b) C.flip(+b.dataset.c); });
    todo(e ? 'Turn over two cards at a time and find matching pairs.' : '카드를 두 장씩 뒤집어 짝을 찾아요.'); msg(e ? 'Pairs: a worker and their workplace, or a thing and where it comes from.' : '짝: 일하는 사람과 일터, 나는 것과 나는 곳'); }
  function memDone() { const e = en(), sec = (performance.now() - C.t0) / 1000, n = C.pairs.length, st = 1 + (C.miss <= n ? 1 : 0) + (sec <= n * 8 ? 1 : 0), M = TS().mem, tot = Object.keys(M).length;
    finish({ win: true, st, snap: null, logT: e ? 'matched all the town cards' : '마을 카드 짝을 다 맞췄어요', head: e ? 'All pairs found!' : '짝을 다 찾았어요!', why: (e ? 'Town cards collected: ' + tot : '모은 마을 카드: ' + tot + '장') + (e ? '. Places you stamp in your passport become new cards.' : '. 여권 도장을 찍은 곳이 새 카드가 돼요.') }); }

  // ───── 사방치기(3D · 창 X) ─────
  function hopPic(c, x, y, w, h, stone) { const S9 = Math.min(w / 8, h / 2.4); for (let r = 0; r < 6; r++) { const two = HOP.ROWS[r].length > 1, X = x + r * S9; c.strokeStyle = INK; c.lineWidth = 2; if (two) { c.strokeRect(X, y + h / 2 - S9, S9, S9); c.strokeRect(X, y + h / 2, S9, S9); } else c.strokeRect(X, y + h / 2 - S9 / 2, S9, S9); c.fillStyle = INK; c.font = '800 ' + Math.round(S9 * 0.35) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; HOP.ROWS[r].forEach((q, k) => c.fillText(String(q), X + S9 / 2, y + h / 2 + (two ? (k ? S9 / 2 : -S9 / 2) : 0))); }
    c.beginPath(); c.arc(x + 6 * S9, y + h / 2, S9 * 0.9, -Math.PI / 2, Math.PI / 2); c.stroke(); c.fillStyle = INK; c.fillText(en() ? 'sky' : '하늘', x + 6.45 * S9, y + h / 2); if (stone) { c.fillStyle = '#8a8f96'; c.beginPath(); c.arc(x + (stone - 0.5) * S9, y + h / 2, S9 * 0.18, 0, 6.2832); c.fill(); c.stroke(); } }
  // 판 세우기(마을이 자리 하나를 골라 줌: 시작 선 가운데 x·z · 판 방향 dx·dz) — 바닥 판 = 땅 높이를 따라 휜 판 하나(분필 그림 · 투명 · 돌도 그림에 그림 = 그리기 +1) · 45m 밖·실내면 숨김
  function hopSetup(sp) { hopDispose(); if (!sp || !A.map || !A.T3) return null; const T3 = A.T3, cv = document.createElement('canvas'); cv.width = 256; cv.height = 1024; const tx = new T3.CanvasTexture(cv); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 4;
    const L9 = (hopRows(2) + 1) * HOP.SQ + 1.6, Wd = 3.2, nx = 4, nz = 14, geo = new T3.PlaneGeometry(Wd, L9, nx, nz), pos = geo.attributes.position, px = -sp.dz, pz = sp.dx;
    for (let k = 0; k < pos.count; k++) { const a = pos.getX(k), b = pos.getY(k), u = b + L9 / 2 - 1.6, x = sp.x + sp.dx * u + px * a, z = sp.z + sp.dz * u + pz * a; pos.setXYZ(k, x, A.ty(x, z) + 0.2, z);   /* 마당 길·칸 선(땅 위 12~18cm) 위 = 문 앞 고리(0.19)와 같은 높이 */ } geo.computeVertexNormals(); geo.computeBoundingSphere();
    const mat = new T3.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), mesh = new T3.Mesh(geo, mat); mesh.userData.fx = 1; mesh.renderOrder = 1; mesh.matrixAutoUpdate = false; mesh.updateMatrix(); A.map.add(mesh);
    const hot = A.map.interact.add({ kind: 'game', x: sp.x - sp.dx * 0.9, z: sp.z - sp.dz * 0.9, y: A.ty(sp.x - sp.dx * 0.9, sp.z - sp.dz * 0.9), r: 1.6, label: (en() ? '👣 Hopscotch — hop, hop!' : '👣 사방치기 (콩콩 뛰기)'), use: () => hopUse() });
    const pick = A.map.interact.add({ kind: 'game', x: sp.x, z: sp.z, y: A.ty(sp.x, sp.z), r: 1.2, label: (en() ? '✋ Pick up the stone' : '✋ 돌 줍기'), use: () => hopPick() }); pick.hot.off = true;
    HOPS = { sp, cv, tx, geo, mat, mesh, hot, pick, L9, Wd, on: null, vis: true, drawn: '', stoneAt: (GS('hop').w | 0) > 0 ? 7 : 0 }; hopPaint(); return HOPS; }
  const hopUV = (u, v) => { const H = HOPS, s = H.sp; return [s.x + s.dx * u - s.dz * v, s.z + s.dz * u + s.dx * v]; };
  function hopPaint() { const H = HOPS; if (!H) return; const bright = (GS('hop').w | 0) > 0, key = (bright ? 1 : 0) + ':' + H.stoneAt; if (H.drawn === key) return; H.drawn = key; const g = H.cv.getContext('2d'), Wp = 256, Hp = 1024, kx = Wp / H.Wd, ky = Hp / H.L9, U = u => Hp - (u + 1.6) * ky, V = v => Wp / 2 + v * kx, S9 = HOP.SQ;
    g.clearRect(0, 0, Wp, Hp); g.lineCap = 'round'; g.lineJoin = 'round'; g.font = '900 ' + Math.round(S9 * ky * 0.42) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const pass = (col, lw, txt) => { g.strokeStyle = col; g.lineWidth = lw;   /* 같은 금을 두 번: 어두운 밑금(밝은 보도에서도 보이게) → 분필 금 */
      for (let r = 0; r < 6; r++) { const two = HOP.ROWS[r].length > 1, w = two ? S9 : S9 / 2; g.strokeRect(V(-w), U((r + 1) * S9), 2 * w * kx, S9 * ky); if (two) { g.beginPath(); g.moveTo(V(0), U((r + 1) * S9)); g.lineTo(V(0), U(r * S9)); g.stroke(); }
        HOP.ROWS[r].forEach((q, k) => { const x = V(two ? (k ? S9 / 2 : -S9 / 2) : 0), y = U((r + 0.5) * S9); if (txt) { g.fillStyle = txt; g.fillText(String(q), x, y); } else g.strokeText(String(q), x, y); }); }
      g.beginPath(); g.ellipse(V(0), U(6 * S9), S9 * kx, S9 * ky, 0, Math.PI, 2 * Math.PI); g.stroke(); const t9 = en() ? 'SKY' : '하늘'; if (txt) { g.fillStyle = txt; g.fillText(t9, V(0), U(6.5 * S9)); } else g.strokeText(t9, V(0), U(6.5 * S9));
      g.beginPath(); g.moveTo(V(-1.2), U(0)); g.lineTo(V(1.2), U(0)); g.stroke(); for (const s of [-0.18, 0.18]) { g.beginPath(); g.ellipse(V(s), U(-0.85), 0.11 * kx, 0.22 * ky, 0, 0, 6.2832); g.stroke(); } };   /* 시작 선 · 발자국 둘 */
    pass('rgba(40,34,28,' + (bright ? 0.42 : 0.3) + ')', bright ? 14 : 11, null); pass(bright ? '#fffdf2' : 'rgba(255,253,242,0.82)', bright ? 7 : 5, bright ? '#ffe066' : 'rgba(255,253,242,0.9)');   /* 이기기 전 = 옅은 분필 · 이긴 뒤 = 또렷한 분필(숫자 노랑) */
    if (H.stoneAt) { const r = H.stoneAt, cx = V(r === 7 ? 0 : HOP.ROWS[r - 1].length > 1 ? -S9 / 2 : 0), cy = U((r === 7 ? 6.45 : r - 0.5) * S9); g.fillStyle = '#6f7782'; g.beginPath(); g.ellipse(cx, cy, 0.17 * kx, 0.17 * ky, 0, 0, 6.2832); g.fill(); g.fillStyle = '#a7aeb7'; g.beginPath(); g.ellipse(cx - 0.04 * kx, cy - 0.04 * ky, 0.08 * kx, 0.07 * ky, 0, 0, 6.2832); g.fill(); g.strokeStyle = 'rgba(43,38,34,.7)'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, 0.17 * kx, 0.17 * ky, 0, 0, 6.2832); g.stroke(); }   /* 돌(던져 놓은 칸 · 이긴 뒤엔 하늘에 남음) */
    H.tx.needsUpdate = true; }
  function hopVis(me, hide) { const H = HOPS; if (!H) return; const d = Math.hypot(me.x - H.sp.x, me.z - H.sp.z), v = !hide && d < 45; if (v !== H.vis) { H.vis = v; H.mesh.visible = v; } }
  // 줄 번호: 0 = 시작 칸(발자국) · 1~6 = 줄 · 7 = 하늘 · 꼬임 0 = 하늘까지 올라가기만 · 1 = 갔다가 돌아오기(돌 줍기) · 2 = 1 + 선 밟으면 안 됨
  function hopUse() { const H = HOPS; if (!H || dead) return false; if (H.on) { hopStop('quit'); return true; } if (A.busy && A.busy()) return false; const s = GS('hop'), lv = s.lv, n = 6; if (!TS().seen.hop) { TS().seen.hop = day() || 1; mark(); if (A.toast) A.toast('📜 ' + GAMES.hop.rule[L()] + ' ' + GAMES.hop[A.touch && A.touch() ? 'rule2t' : 'rule2'][L()], 7); }
    const cand = []; for (let r = 2; r <= n; r++) if (r !== H.lastStone) cand.push(r); const stone = cand[(R() * cand.length) | 0]; H.lastStone = stone;
    H.on = { lv, n, stone, dir: 1, row: 0, cur: 0, need: 1, picked: false, wasAir: false, walk: 0, t0: performance.now(), faults: 0 }; H.stoneAt = stone; hopPaint();
    if (A.speed) A.speed(HOP.SLOW); hopNeed(); hopLine(); if (A.sfx) A.sfx('go'); if (A.rec) A.rec('table', { g: 'hop', ph: 'start', lv }); return true; }
  const sqName = (r, e) => (r === 7 ? (e ? 'the sky' : '하늘') : HOP.ROWS[r - 1].join('·') + (e ? '' : '번 칸'));
  function hopLine() { const H = HOPS, o = H && H.on, e = en(); if (!A.task) return; if (!o) { A.task(null); return; } const st = sqName(o.stone, e);
    A.task(o.row === -9 ? (e ? '👣 Go back to the footprints and start again.' : '👣 발자국으로 돌아가 처음부터 해요.') : o.need === 'pick' ? (e ? '👣 Press E to pick up the stone in square ' + st + '.' : '👣 E를 눌러 ' + st + '의 돌을 주워요.') : o.dir > 0 ? (o.row === 0 ? (A.touch && A.touch() ? (e ? '👣 Stand on the footprints. Push the stick forward and tap Jump. Skip square ' + st + '.' : '👣 발자국에 서서 조이스틱을 민 채 점프 단추로 콩! ' + st + '은 건너뛰어요.') : (e ? '👣 Stand on the footprints. Hold W and press Space to hop. Skip square ' + st + ' (add Shift to jump two).' : '👣 발자국에 서서 W를 누른 채 스페이스로 콩! ' + st + '은 건너뛰어요 (Shift까지 = 두 칸).')) : (e ? '👣 Hop to ' + sqName(o.need, e) + '. Skip square ' + st + '.' : '👣 ' + sqName(o.need, e) + (o.need === 7 ? '로' : '으로') + ' 콩! ' + st + '은 건너뛰어요.')) : (o.need === 0 ? (e ? '👣 Hop out past the start line.' : '👣 시작 선 밖으로 콩 뛰어 나가요.') : (e ? '👣 Hop back down to ' + sqName(o.need, e) + '.' : '👣 ' + sqName(o.need, e) + '으로 콩 내려가요.'))); }
  function hopFault(t) { const H = HOPS, o = H.on; o.faults++; o.dir = 1; o.row = -9; o.need = 1; o.picked = false; o.walk = 0; H.stoneAt = o.stone; hopPaint(); H.pick.hot.off = true; if (A.sfx) A.sfx('tick'); if (A.toast) A.toast('👣 ' + t + (en() ? ' Back to the footprints and start again.' : ' 발자국으로 돌아가 처음부터 해요.'), 3); hopLine(); }
  function hopNeed() { const H = HOPS, o = H.on; H.pick.hot.off = true; if (o.dir > 0) { let nx = o.row + 1; if (nx === o.stone) nx++; o.need = nx > o.n ? 7 : nx; return; }
    const below = o.row === 7 ? o.n : o.row - 1; if (!o.picked && below === o.stone) { o.need = 'pick'; const [x, z] = hopUV((o.stone - 0.5) * HOP.SQ, 0); Object.assign(H.pick.hot, { x, z, y: A.ty(x, z) }); H.pick.hot.off = false; return; } o.need = below; }
  // 땅에 닿은 순간 한 번: 어느 줄에 섰나 → 맞으면 다음 줄 · 틀리면 처음부터(까닭 한 줄)
  function hopLand(rr, u) { const H = HOPS, o = H.on, e = en(); if (!o || o.row === -9) return; o.cur = rr;
    if (rr < 0) { hopFault(e ? 'Out of the squares!' : '칸 밖으로 나갔어요!'); return; } if (rr === o.row) return;
    if (rr >= 1 && rr <= 6 && hopOnLine(u, o.lv)) { hopFault(e ? 'You landed on a line!' : '선을 밟았어요!'); return; }
    if (o.need === 'pick') { hopFault(e ? 'Pick up the stone first (E).' : '돌을 먼저 주워요 (E).'); return; }
    if (!o.picked && rr === o.stone) { hopFault(e ? 'That square has the stone!' : '돌이 있는 칸이에요!'); return; }
    if (o.dir > 0 && rr === 0) return;
    if (rr !== o.need) { const far = o.dir > 0 ? rr > o.need : rr < o.need; hopFault(far ? (e ? 'Too far — one square at a time.' : '너무 멀리 뛰었어요. 한 칸씩 콩콩!') : (e ? 'Wrong way!' : '거꾸로 뛰었어요!')); return; }
    o.row = rr; if (A.tone) A.tone(392 + (rr === 7 ? 8 : rr) * 40, 0, 0.09, 'triangle', 0.06);
    if (rr === 7) { if (o.lv <= 0) { hopWin(); return; } o.dir = -1; if (A.toast) A.toast(e ? '👣 The sky! Turn around and hop back down.' : '👣 하늘이에요! 돌아서 콩콩 내려가요.', 2.2); }
    else if (o.dir < 0 && rr === 0) { hopWin(); return; }
    hopNeed(); hopLine(); }
  function hopPick() { const H = HOPS, o = H && H.on; if (!o || o.need !== 'pick') return; o.picked = true; H.stoneAt = 0; hopPaint(); H.pick.hot.off = true; o.need = o.stone; if (A.sfx) A.sfx('pop'); if (A.toast) A.toast(en() ? '👣 Got the stone! Keep hopping down.' : '👣 돌을 주웠어요! 계속 콩콩 내려가요.', 2); hopLine(); }
  function hopWin() { const H = HOPS, o = H.on, s = GS('hop'), e = en(), sec = Math.round((performance.now() - o.t0) / 1000), first = !(s.w | 0), st = 1 + (o.faults === 0 ? 1 : 0) + (sec <= 60 ? 1 : 0); H.on = null; H.pick.hot.off = true; s.n = (s.n | 0) + 1; s.w = (s.w | 0) + 1; let up = 0; if (st >= 2) { s.good = (s.good | 0) + 1; s.fail = 0; if (s.good >= 3 && s.lv < 2) { s.lv++; s.good = 0; up = s.lv; } } if (!(s.best['s' + o.lv] >= st)) s.best['s' + o.lv] = st;
    const T = TS(); if (!T.log || T.log.d !== day()) T.log = { d: day(), g: 'hop', lv: o.lv, t: e ? 'hopped up to the sky in hopscotch' : '사방치기로 하늘까지 다녀왔어요' }; mark(); if (A.speed) A.speed(0); if (A.task) A.task(null); H.stoneAt = 7; hopPaint();
    const upT = up === 1 ? (e ? ' Next time: up and back, picking up the stone.' : ' 다음엔 하늘에 갔다가 돌을 주워 돌아와요.') : up === 2 ? (e ? ' Next time: no stepping on lines!' : ' 다음엔 선을 밟으면 안 돼요!') : '';
    if (A.banner) A.banner('👣 ' + (e ? 'Hopscotch done! ' : '사방치기 성공! ') + (first ? (e ? 'The chalk squares are fresh and bright now.' : '분필 칸이 새로 또렷해졌어요.') : o.lv <= 0 ? (e ? 'All the way to the sky.' : '하늘까지 콩콩 갔어요.') : (e ? 'Up to the sky and back.' : '하늘까지 갔다 왔어요.')) + upT, 3.6); if (A.sfx) A.sfx('done'); if (A.rec) A.rec('table', { g: 'hop', ph: 'end', lv: o.lv, win: true, st, sec, faults: o.faults }); if (A.onWin) A.onWin('hop', o.lv); }
  function hopStop(why) { const H = HOPS; if (!H || !H.on) return; const o = H.on; H.on = null; H.stoneAt = (GS('hop').w | 0) > 0 ? 7 : 0; hopPaint(); H.pick.hot.off = true; if (A.speed) A.speed(0); if (A.task) A.task(null); if ((why === 'quit' || why === 'away') && A.toast) A.toast(en() ? '👣 Hopscotch stopped.' : '👣 사방치기를 그만했어요.', 2); if (A.rec) A.rec('table', { g: 'hop', ph: 'stop', why, lv: o.lv }); }
  // 매 프레임(사방치기 하는 동안만 · 새 객체 X): 몸이 땅에 닿는 순간 = 어느 줄인지 · 땅에 붙은 채 다른 줄로 = 걸어서 옮김
  function hopTick(dt) { const H = HOPS; if (!H || !H.on) return; const o = H.on, me = A.map.player.pos(), s = H.sp, du = me.x - s.x, dz9 = me.z - s.z, u = du * s.dx + dz9 * s.dz, v = -du * s.dz + dz9 * s.dx, air = A.map.player.vy !== 0;
    if (Math.hypot(du, dz9) > 16) { hopStop('away'); return; } const rr = hopRow(u, v, o.lv);
    if (o.row === -9) { if (!air && rr === 0) { o.row = 0; o.cur = 0; o.dir = 1; hopNeed(); hopLine(); } o.wasAir = air; return; }
    if (o.wasAir && !air) hopLand(rr, u);
    else if (!air && rr !== o.cur && o.need !== 'pick') { if (o.row === 0 && o.dir > 0 && rr !== 1) { o.cur = rr; o.walk = 0; } else { o.walk += dt; if (o.walk > 0.15) { o.walk = 0; if (o.dir < 0 && o.row === 1 && rr === 0 && o.need === 0) hopWin(); else hopFault(rr < 0 ? (en() ? 'You stepped out of the squares!' : '칸 밖으로 나갔어요!') : (en() ? 'You walked into the next square — hop instead!' : '걸어서 옮겼어요. 콩 뛰어서 옮겨요!')); } } }
    else o.walk = 0;
    o.wasAir = air; }
  function hopDispose() { const H = HOPS; if (!H) return; hopStop('reset'); HOPS = null; if (H.mesh.parent) H.mesh.parent.remove(H.mesh); H.geo.dispose(); H.mat.dispose(); H.tx.dispose(); H.hot.remove(); H.pick.remove(); }

  // ── 방 탁자 위 그림(실내가 지을 때 한 번 · 이긴 판이면 그 판 그대로) ──
  function pic(g, c, w, h) { if (g.startsWith('shadow:')) { shadowPic(g.slice(7), c, w, h); return; }
    if (g.startsWith('sign:') || g === 'shelf') { const k = g.slice(5), e = en(), G9 = GAMES[k], col = g === 'shelf' ? 0x8a5a34 : k === 'toy' ? 0xef8b33 : G9 ? G9.col : 0x8a5bd1, t = g === 'shelf' ? (e ? 'Game shelf' : '놀이 선반') : k === 'toy' ? (e ? 'Game supplies' : '놀이 도구 가게') : G9 ? G9.t[L()] : k;
      c.fillStyle = '#' + (col >>> 0).toString(16).padStart(6, '0'); c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(3, h * 0.06); c.strokeRect(c.lineWidth, c.lineWidth, w - 2 * c.lineWidth, h - 2 * c.lineWidth); let fs = h * 0.56; c.font = '900 ' + fs + 'px sans-serif'; const mw = c.measureText(t).width; if (mw > w * 0.86) { fs *= w * 0.86 / mw; c.font = '900 ' + fs + 'px sans-serif'; } c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, w / 2, h / 2 + fs * 0.04); return; }
    const T = TS(), last = T.last[g]; c.fillStyle = '#f3e2c2'; c.fillRect(0, 0, w, h);
    if (g === 'gonu') { let st = gonuStart(0); if (last && typeof last.s === 'string' && last.s.length >= 5) { const a = [], b = []; for (let i = 0; i < 5; i++) { if (last.s[i] === 'a') a.push(i); else if (last.s[i] === 'b') b.push(i); } if (a.length === 2 && b.length === 2) st = { a, b, turn: 0, ply: 1 }; } drawGonu(c, 0, 0, w, h, st); }
    else if (g === 'omok') { let b = null; if (last && typeof last.s === 'string' && last.s.length === OMN) { b = new Int8Array(OMN); for (let i = 0; i < OMN; i++) b[i] = +last.s[i] || 0; } drawOmok(c, 0, 0, w, h, b); }
    else if (g === 'yut') { let P = null; try { P = last && JSON.parse(last.s); } catch (x) { P = null; } drawYutBoard(c, w * 0.12, h * 0.12, Math.min(w, h) * 0.76, Array.isArray(P) && P.length === 2 ? P : null); }
    else if (g === 'tang') { const sh = TANG_SHAPES.house, f = fitTang(sh, w, h, 0.3); drawTangShape(c, sh, f.ox, f.oy, f.u, { fill: 'rgba(43,38,34,.25)', lines: 'rgba(43,38,34,.4)' }); TANG_PIECES.forEach((pc, i) => { const V = tangVerts(pc, i * 3, 0, 0, 0); c.fillStyle = pc.c; c.beginPath(); V.forEach(([x, y], k) => { const X = w * (0.15 + (i % 4) * 0.23) + x * w * 0.07, Y = h * (i < 4 ? 0.18 : 0.84) - y * w * 0.07; if (k) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.closePath(); c.fill(); }); }
    else if (g === 'mem') { for (let i = 0; i < 12; i++) { const x = w * (0.08 + (i % 4) * 0.22), y = h * (0.1 + ((i / 4) | 0) * 0.29); c.fillStyle = i === 2 || i === 7 ? '#fffdf7' : '#3f8f4e'; c.fillRect(x, y, w * 0.19, h * 0.24); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x, y, w * 0.19, h * 0.24); } } }
  // 카페 창에 거는 그림자 판(맞춘 칠교 모양) · 선반 놀이 상자
  const solved = () => { const s = TS().last.tang; return s && Array.isArray(s.s) ? s.s.filter(id => TANG_SHAPES[id]) : []; };
  function shadowPic(id, c, w, h) { const sh = TANG_SHAPES[id]; if (!sh) return; c.fillStyle = '#fff6df'; c.fillRect(0, 0, w, h); const f = fitTang(sh, w, h, 0.22); drawTangShape(c, sh, f.ox, f.oy, f.u, { fill: '#2b2622' }); }
  const boxes = () => { const B9 = TS().box; return ['gonu', 'omok', 'tang', 'mem', 'yut'].filter(g => B9[g]).map(g => ({ g, col: GAMES[g].col, t: GAMES[g].t[L()] })); };
  function recapLine(d) { const lg = TS().log; return lg && lg.d === d && lg.t ? (en() ? '🎲 Today you ' + lg.t + '.' : '🎲 오늘 ' + lg.t + '.') : ''; }
  function shop() { const e = en(), l = L(), goods = [['🧩', 2500, T2('사면 우리 집에서 혼자 칠교놀이를 할 수 있어요.', 'With this you can play tangram alone at home.')], ['🔳', 2000, T2('사면 우리 집에서 혼자 두 편을 다 두며 고누를 연습할 수 있어요.', 'With this you can practise gonu at home, playing both sides.')]];
    const draw = () => '<h3>🧩 ' + (e ? 'Game supply shop' : '놀이 도구 가게') + '</h3><div class="tb-todo">' + (e ? 'To do: buy a set to play at home, if you like.' : '할 일: 집에서 놀 도구를 사고 싶으면 골라요.') + '</div><div class="sm">💰 ' + (A.money ? A.money() : '') + '</div><div class="bagg">' + goods.map(([em, v, d]) => { const own = A.count && A.count(em) > 0; return '<div><b>' + em + '</b>' + esc((ITEMS[em] || [em, em])[l]) + '<br><i>' + (A.won ? A.won(v) : v) + '</i><br><span class="sm">' + esc(d[l]) + '</span><br><button ' + (own ? 'disabled ' : '') + 'data-b="' + em + '" style="min-height:30px;padding:3px 10px;margin-top:3px">' + (own ? (e ? 'Have it' : '있어요') : (e ? 'Buy' : '사기')) + '</button></div>'; }).join('') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P = A.openP(draw(), false, 'shop'); P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const g9 = goods.find(q => q[0] === b.dataset.b); if (!g9 || !A.buy) return; if (A.buy(g9[0], g9[1])) P.querySelector('.bx').innerHTML = draw(); }; }
  return { open, shop, pic, shadowPic, solved, boxes, recapLine, hopSetup, hopDispose, hopTick, hopVis, hopUse, hopEnd: why => hopStop(why),
    get on() { return C && C.P && C.P.isConnected ? C.g : null; }, get hopOn() { return !!(HOPS && HOPS.on); },
    abort() { if (C) { shut(); } if (HOPS && HOPS.on) hopStop('abort'); },
    info: () => ({ g: C ? C.g : null, lvp: C ? C.lvp : null, over: C ? C.over : null, hold: held, HOLD3D: window.SM_HOLD3D || 0, tbl: JSON.parse(JSON.stringify(TS())), hop: HOPS ? { on: HOPS.on ? { ...HOPS.on } : null, sp: HOPS.sp, vis: HOPS.vis } : null }),
    dbg: {
      get C() { return C; }, R,
      gonuKid: () => { if (!C || C.g !== 'gonu' || C.st.turn !== 0 || C.over) return false; const m = gonuAI(C.st, 1, R); if (m) gonuStep(m); return !!m; },
      omokKid: () => { if (!C || C.g !== 'omok' || C.st.turn !== 1 || C.over || C.busy) return false; omokStep(omokAI({ ...C.st, turn: 1 }, 2, R)); return true; },
      omokAt: i => { if (!C || C.g !== 'omok') return null; const G9 = C.geo, r = C.cv.getBoundingClientRect(), [px, py] = G9.P(i); return [r.left + px * r.width / 380, r.top + py * r.height / 380]; },
      yutKid: () => { if (!C || C.g !== 'yut' || C.st.turn !== 0 || C.over || C.fx) return false; if (C.can) { yutThrowFx(0); return 'throw'; } if (!C.pend.length) return false; yutGo(0, 0, yutAI(C.st, 0, C.pend[0], 2, R)); return 'move'; },
      tangSolve: (n = 7) => { if (!C || C.g !== 'tang') return 0; let k = 0; for (const p of C.pc) { if (k >= n || C.over) break; if (p.slot >= 0) continue; const i = C.sh.s.findIndex((q, j) => q[0] === p.pc.k && !C.used[j]); if (i < 0) continue; const po = tangPoseFor(C.sh, i, p.pc); Object.assign(p, { a: po.a, f: po.f, cx: po.cx + 0.2, cy: po.cy - 0.15 }); fitTry(p, true); k++; } C.dirty = true; return k; },
      tangPieceAt: i => { if (!C || C.g !== 'tang') return null; const p = C.pc[i], r = C.cv.getBoundingClientRect(); return [r.left + (C.ox + p.cx * C.u) * r.width / TW, r.top + (C.oy - p.cy * C.u) * r.height / TH]; },
      tangSlotAt: (pieceI) => { if (!C || C.g !== 'tang') return null; const p = C.pc[pieceI], i = C.sh.s.findIndex((q, j) => q[0] === p.pc.k && !C.used[j]); if (i < 0) return null; const po = tangPoseFor(C.sh, i, p.pc), r = C.cv.getBoundingClientRect(); return { a: po.a, f: po.f, xy: [r.left + (C.ox + po.cx * C.u) * r.width / TW, r.top + (C.oy - po.cy * C.u) * r.height / TH] }; },
      memSolve: () => { if (!C || C.g !== 'mem') return 0; let n = 0; for (let p = 0; p < C.pairs.length; p++) { const ix = C.cards.map((c, i) => (c.p === p && !c.done ? i : -1)).filter(i => i >= 0); if (ix.length === 2) { C.flip(ix[0]); C.flip(ix[1]); n++; } } return n; },
      hopLand: (row, u) => hopLand(row, u), hopPick: () => hopPick(), hopUV: (u, v) => (HOPS ? hopUV(u, v) : null),
    },
    dispose() { dead = true; shut(); hopDispose(); if (css) { css.remove(); css = null; } } };
}
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 ? a : b; };   /* 받침 있으면 a(은) · 없으면 b(는) */
const inPoly = (x, y, V) => { let c = false; for (let i = 0, j = V.length - 1; i < V.length; j = i++) { const [xi, yi] = V[i], [xj, yj] = V[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
