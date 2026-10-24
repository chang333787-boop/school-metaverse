// 🧭 길 묻기 · 모이는 곳 · 내 흔적 지도(ASK-1 · HUB-1 · TRACE-1 — 설계 docs/systems/town_phase2.md 「길 묻기」·「모이는 곳」 · town_phase3.md 「칸마다 내 흔적 지도」)
//   길 묻기: 이야기 밖 목표(할 일 · F로 고른 곳 · 보물)가 있고 그 칸에 아직 안 가 봤으면, 일꾼 4.5m 안에 들어설 때 일꾼이 먼저 말함(단추·창·추가 E 0)
//     말 = 랜드마크(LMK · 점 하나인 곳) + 방위 + 칸 주소(작은 지도가 열렸을 때만) · 두 줄 13자 안 · 6초 · 6m 밖이면 끔 · 말투는 하는 일 갈래(들·바다·읍내)마다
//     손가락 = 탐험 솜씨 1단계까지만(그 뒤엔 말과 칸만 — 칸 배지를 지도에 대 보게) · 자리는 그대로 몸만 돌림(E 자리·충돌 그대로) · 4초 뒤 되돌림
//     선 없이 닿으면 곁 일꾼 손뼉 + 한 음 + 탐험 솜씨(문 rwCheck · 꼬리표 ask:) + 일기 한 줄 · 빈 칭찬·숫자 팝업 X
//   모이는 곳: 학교 앞(정문) · 장터(정문에서 가장 가까운 장터) · 강가(정문에서 가장 가까운 다리) — 마을(town.js)이 고르고 여기는 셈만(hubNear)
//   흔적 지도: 바로 가기(J) 칸 지도 위 겹 — 심은 것(새싹) · 친해진 이웃(지붕) · 처음 만난 동물(발자국) · 보탬(꽃) · 누르기 = 그 칸 일지 세 줄 · 빈 칸 표시·%·숫자 0
//   렉: 매 프레임 = 0.5초 시계 하나 · 일꾼 찾기 = 50m 칸 묶음(둘레 아홉 칸만) · 말 셈 = 다가설 때 한 번(길 하나) · 새 Light X · 매 프레임 새 객체 X
export const ASK_V = 1;
const T2 = (ko, en) => [ko, en];
const DIR4 = [T2('북', 'north'), T2('동', 'east'), T2('남', 'south'), T2('서', 'west')];
const DIR8 = [T2('북', 'north'), T2('북동', 'northeast'), T2('동', 'east'), T2('남동', 'southeast'), T2('남', 'south'), T2('남서', 'southwest'), T2('서', 'west'), T2('북서', 'northwest')];
export const bearing = (dx, dz) => (Math.atan2(dx, -dz) * 57.29578 + 360) % 360;   /* 0 = 북(−z) · 90 = 동(+x) — town_road.js와 같음 */
const dirOf = (b, eight) => eight ? DIR8[Math.round(b / 45) % 8] : DIR4[Math.round(b / 90) % 4];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const len9 = s => [...s].length;
const KMAX = 13, EMAX = 24;   /* 한 줄 글자 수(한국어 13 · 영어 24) */
const ROLEG = { picker: 'farm', farmer: 'farm', wood: 'farm', bee: 'farm', ranch: 'farm', reach: 'farm', salt: 'sea', fisher: 'sea' };   /* 그 밖 = 읍내(장터 상인 등) */
const NOASK = new Set(['swim', 'guest']);
// 말 틀: 갈래(들 = 반말 · 바다·읍내 = 해요체) × 꼴(on 길 위 랜드마크 · br 다리 건너기 · near 랜드마크 바로 곁 · off 목적지 곁 랜드마크 · none 랜드마크 없음) — N 랜드마크 · D 방위 · C 칸(없으면 빈 글)
const FR = {
  town: { on: (N, D, C) => [N + ' 지나서', C ? D + '쪽 ' + C + ' 칸이에요' : D + '쪽으로 가요'], br: (N, D, C) => [N + ' 건너서', C ? D + '쪽 ' + C + ' 칸이에요' : D + '쪽으로 가요'], near: (N, D, C) => [N + ' 바로 옆', C ? C + ' 칸이에요' : '거기 있어요'], off: (N, D, C) => [N + ' 알죠?', C ? '그 ' + D + '쪽 ' + C + ' 칸' : '그 ' + D + '쪽이에요'], none: (D, C) => [D + '쪽으로 가요', C ? C + ' 칸이에요' : '조금 더 가요'] },
  farm: { on: (N, D, C) => [N + ' 지나서', C ? D + '쪽 ' + C + ' 칸이야' : D + '쪽으로 가'], br: (N, D, C) => [N + ' 건너서', C ? D + '쪽 ' + C + ' 칸이야' : D + '쪽으로 가'], near: (N, D, C) => [N + ' 바로 옆이야', C ? C + ' 칸이야' : '가 보면 보여'], off: (N, D, C) => [N + ' 알지?', C ? '그 ' + D + '쪽 ' + C + ' 칸' : '그 ' + D + '쪽이야'], none: (D, C) => [D + '쪽으로 가', C ? C + ' 칸이야' : '조금 더 가'] },
  sea: { on: (N, D, C) => [N + ' 지나가면', C ? D + '쪽 ' + C + ' 칸이에요' : D + '쪽이에요'], br: (N, D, C) => [N + ' 건너가면', C ? D + '쪽 ' + C + ' 칸이에요' : D + '쪽이에요'], near: (N, D, C) => [N + ' 곁이에요', C ? C + ' 칸에 있어요' : '가면 보여요'], off: (N, D, C) => [N + ' 보이죠?', C ? '거기서 ' + D + '쪽 ' + C : '거기서 ' + D + '쪽'], none: (D, C) => [D + '쪽이에요', C ? C + ' 칸이에요' : '조금 더 가요'] } };
const FRE = { on: (N, D, C) => ['Go past the ' + N, C ? 'then ' + D + ' to ' + C : 'then head ' + D], br: (N, D, C) => ['Cross the ' + N, C ? 'then ' + D + ' to ' + C : 'then head ' + D], near: (N, D, C) => ['Right by the ' + N, C ? 'in cell ' + C : 'you will see it'], off: (N, D, C) => ['Know the ' + N + '?', C ? 'It is ' + D + ' of it, ' + C : 'It is ' + D + ' of it'], none: (D, C) => ['Head ' + D, C ? 'to cell ' + C : 'a little further'] };
const DW = [[250, T2('가까워요', 'It is close')], [700, T2('좀 걸어요', 'A bit of a walk')], [1e9, T2('자전거 타요', 'Take your bike')]];
const DWF = [[250, '가까워'], [700, '좀 걸어'], [1e9, '자전거 타']];

// 길 위(폴리선)에서 점까지 거리와 그 자리까지 걸은 거리 · out = [거리, 따라 걸은 m]
function onPath(P, x, z, out) { let best = 1e9, s = 0, acc = 0; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], vx = b[0] - a[0], vz = b[1] - a[1], L2 = vx * vx + vz * vz, L = Math.sqrt(L2) || 1, t = L2 ? Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / L2)) : 0, d = Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); if (d < best) { best = d; s = acc + t * L; } acc += L; } out[0] = best; out[1] = s; out[2] = acc; return out; }
const OP = [0, 0, 0];

// 말 한 마디(순수 함수 · 다가설 때 한 번): o = { me:[x,z], to:[x,z], pts(길), len, lmk[], cell(x,z), cellOn, dir8, en, role, hk }
export function wayLine(o) { const en = !!o.en, P = o.pts && o.pts.length > 1 ? o.pts : [o.me, o.to], to = o.to, me = o.me, total = Number.isFinite(o.len) ? o.len : Math.hypot(to[0] - me[0], to[1] - me[1]);
  let pick = null, ps = -1, mode = 'none';
  for (const q of o.lmk || []) { if (Math.hypot(q.x - me[0], q.z - me[1]) < 25) continue; onPath(P, q.x, q.z, OP); if (OP[0] > 40 || OP[1] < 25) continue; if (OP[1] > ps) { ps = OP[1]; pick = q; } }   /* 길 40m 안을 지나는 것 가운데 목적지에 가장 가까운 것 */
  if (pick) mode = pick.k === 'bridge' ? 'br' : 'on';
  else { let bd = 260; for (const q of o.lmk || []) { if (Math.hypot(q.x - me[0], q.z - me[1]) < 25) continue; const d = Math.hypot(q.x - to[0], q.z - to[1]); if (d < bd) { bd = d; pick = q; } } if (pick) mode = 'off'; }   /* 없으면 목적지에서 가장 가까운 것 */
  const dL = pick ? Math.hypot(pick.x - to[0], pick.z - to[1]) : 0; if (pick && dL <= 35) mode = 'near';
  const from = pick && mode !== 'near' ? [pick.x, pick.z] : me, b = bearing(to[0] - from[0], to[1] - from[1]), D = dirOf(b, !!o.dir8)[en ? 1 : 0];
  const c0 = o.cell ? o.cell(to[0], to[1]) : '', C = o.cellOn && c0 && !/밖|out/.test(c0) ? c0 : '', g = ROLEG[o.role] || 'town', N = pick ? pick.nm[en ? 1 : 0] : '';
  const F = en ? FRE : FR[g], MX = en ? EMAX : KMAX, mk = (C9, D9) => mode === 'none' ? F.none(D9, C9) : F[mode](N, D9, C9);
  let l = mk(C, D); if (len9(l[0]) > MX || len9(l[1]) > MX) l = mk(C, D.length > 1 && !en ? DIR4[Math.round(b / 90) % 4][0] : D); if (len9(l[1]) > MX) l = [l[0], C ? (en ? 'cell ' + C : C + ' 칸') : l[1].slice(0, MX)]; if (len9(l[0]) > MX) l = [N.slice(0, MX), l[1]];   /* 넘치면 4방위 → 칸만 → 이름만 */
  const dw = (en ? DW : g === 'farm' ? DWF.map(q => [q[0], T2(q[1], '')]) : DW).find(q => total <= q[0])[1][en ? 1 : 0], l1 = dw + ', ' + l[0]; if (dw && len9(l1) <= MX && mode !== 'near') l = [l1, l[1]];   /* 거리 낱말 = 들어가면 앞에(가까워요 · 좀 걸어요 · 자전거 타요) */
  const pt = pick ? [pick.x, pick.z] : [to[0], to[1]];
  return { l, mode, lmk: pick ? { k: pick.k, nm: pick.nm, x: pick.x, z: pick.z } : null, dir: D, b: Math.round(b), cell: C, len: Math.round(total), pt }; }

// 을/를 · 이/가(받침)
function jong(w) { const c = String(w).trim().slice(-1), k = c.charCodeAt(0) - 0xAC00; if (k >= 0 && k < 11172) return k % 28 !== 0; if (/[0-9]/.test(c)) return '013678'.includes(c); return false; }
const ul = w => w + (jong(w) ? '을' : '를');

// 흔적 지도 그림 하나(종이 지도 스티커: 연노랑 동그라미 + 갈색 테두리 = '내 흔적' 단추와 같은 색 · 지도 기호와 섞이지 않게) · 그림 = 새싹(심음) · 지붕(친해진 이웃) · 발자국(처음 만난 동물) · 꽃(보탬)
export function traceIcon(g, x, y, k, r = 8) { g.save(); g.translate(x, y); g.fillStyle = '#fff4c2'; g.strokeStyle = '#8a5a00'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.stroke(); const s = r / 8;
  if (k === 'sprout') { g.strokeStyle = '#3b7a2a'; g.lineWidth = 1.8 * s; g.beginPath(); g.moveTo(0, 5 * s); g.lineTo(0, -1 * s); g.stroke(); g.fillStyle = '#5fb84a'; g.beginPath(); g.ellipse(-2.6 * s, -2.2 * s, 3 * s, 1.7 * s, -0.6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(2.6 * s, -3 * s, 3 * s, 1.7 * s, 0.6, 0, Math.PI * 2); g.fill(); }
  else if (k === 'roof') { g.fillStyle = '#e0453a'; g.beginPath(); g.moveTo(-5.5 * s, -0.5 * s); g.lineTo(0, -5.5 * s); g.lineTo(5.5 * s, -0.5 * s); g.closePath(); g.fill(); g.fillStyle = '#f2c230'; g.fillRect(-3.6 * s, -0.5 * s, 7.2 * s, 5 * s); g.fillStyle = '#7a4a2a'; g.fillRect(-1 * s, 1.5 * s, 2 * s, 3 * s); }
  else if (k === 'paw') { g.fillStyle = '#7a4a2a'; g.beginPath(); g.ellipse(0, 1.8 * s, 3 * s, 2.4 * s, 0, 0, Math.PI * 2); g.fill(); for (const [px, py] of [[-3.6, -2], [-1.3, -4.4], [1.3, -4.4], [3.6, -2]]) { g.beginPath(); g.arc(px * s, py * s, 1.25 * s, 0, Math.PI * 2); g.fill(); } }
  else { g.fillStyle = '#f08fb2'; for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.5708; g.beginPath(); g.arc(Math.cos(a) * 3 * s, Math.sin(a) * 3 * s, 2.1 * s, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#f2c230'; g.beginPath(); g.arc(0, 0, 1.6 * s, 0, Math.PI * 2); g.fill(); }
  g.restore(); }

// A = 마을 쪽이 넘기는 것: lang() · GAME · workers() WKP · mesh() 일꾼 인스턴스(set·act·reset·actOf) · asks(w) 물을 수 있는 일꾼인가(E 손잡이·물속 X)
//   cell(x, z) · cellOn() 작은 지도가 열렸나 · route(a, b) · lmkSrc() 랜드마크 [{ k, nm:[ko,en], x, z }] · hubs() 모이는 곳 · ready() 다 지었나(30프레임 뒤)
//   target() 이야기 밖 목표 [x, z, 아이콘] · busy() 창·놀이·실내·탈것 · bubble(o, t, sec) · bubbleOff() · bubbleOwn() 지금 말풍선이 길 말인가
//   cheer(x, z, r, sec) · tone() · skUp(k, n, src) · diary(t) · explL() 탐험 솜씨 단계 · dir8() 8방위 열림 · lineOn() 빨간 선 있음 · rec(k, o) · who(hk)
export function createAsk(A) {
  const en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t));
  let built = false, LMK = [], GRID = new Map(), Q = 0, LAST = -1e9, LINE_T = -1e9, CUR = null; const DBG = { told: 0, arrive: 0, line: 0, pointN: 0, lastMs: 0 };
  const st = () => { const S = A.GAME.S; if (!S.way || typeof S.way !== 'object') S.way = { ask: null, notes: [], said: {}, sd: 0 }; const W = S.way; if (!Array.isArray(W.notes)) W.notes = []; if (!W.said || typeof W.said !== 'object') W.said = {}; if (W.sd !== S.day) { W.sd = S.day; W.said = {}; } return W; };
  const gk = (x, z) => Math.floor(x / 50) + ':' + Math.floor(z / 50);
  function build() { built = true; const raw = A.lmkSrc() || [], out = [];
    for (const q of raw) { if (!q || !Number.isFinite(q.x) || !Number.isFinite(q.z)) continue; const lim = q.k === 'bus' ? 90 : q.k === 'tree' ? 70 : 20; if (out.some(o => o.k === q.k && Math.hypot(o.x - q.x, o.z - q.z) < lim)) continue; if (q.k === 'bus' && out.some(o => o.k !== 'bus' && Math.hypot(o.x - q.x, o.z - q.z) < 45)) continue; out.push(q); }   /* 같은 갈래 가까운 것 = 하나 · 정류장은 다른 랜드마크 곁이면 뺌 */
    const nb = out.filter(q => q.k === 'bus').length; LMK = nb > 12 ? out.filter((q, i) => q.k !== 'bus' || (hashS(i + '') % nb) < 12) : out;
    GRID = new Map(); const W = A.workers() || []; W.forEach((w, i) => { if (!A.asks(w)) return; const k = gk(w.x, w.z); let a = GRID.get(k); if (!a) GRID.set(k, a = []); a.push(i); }); }
  function nearW(me, r) { const W = A.workers() || [], cx = Math.floor(me.x / 50), cz = Math.floor(me.z / 50); let bi = -1, bd = r; for (let a = cx - 1; a <= cx + 1; a++) for (let b = cz - 1; b <= cz + 1; b++) { const L9 = GRID.get(a + ':' + b); if (!L9) continue; for (const i of L9) { const w = W[i]; if (!w || w.party) continue; const d = Math.hypot(w.x - me.x, w.z - me.z); if (d < bd && Math.abs((w.g || 0) - me.y) < 3) { bd = d; bi = i; } } } return bi; }
  function point(i, w, pt) { const h = A.mesh(); if (!h || !h.set) return; const ry = Math.atan2(pt[0] - w.x, pt[1] - w.z); h.set(i, w.x, w.g + 0.02, w.z, ry); h.act(i, 'point', 0); DBG.pointN++; const c = CUR = { i, w, ry, pt, t0: performance.now(), bub: true, pointing: true };
    setTimeout(() => { if (!c.pointing) return; c.pointing = false; const h9 = A.mesh(); if (!h9) return; h9.set(i, w.x, w.g + 0.02, w.z, w.ry); if (!h9.actOf || h9.actOf(i) === 15) h9.reset(i); }, 4000); }   /* 다른 몸짓(손뼉·부탁)이 그사이 들어왔으면 그것은 그대로 */
  function tell(i, w, T, me, force) { const t0 = performance.now(), W = st(), S = A.GAME.S, to = [T[0], T[1]], R = A.route([me.x, me.z], to);
    const o = wayLine({ me: [me.x, me.z], to, pts: R && R.ok ? R.pts : null, len: R && R.ok ? R.len : undefined, lmk: LMK, cell: A.cell, cellOn: A.cellOn(), dir8: A.dir8(), en: en(), role: w.role, hk: w.hk || '' });
    A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, o.l[0] + '\n' + o.l[1], 6); const pt = A.explL() <= 1 || force === 'point'; if (pt) point(i, w, o.pt); else CUR = { i, w, pt: o.pt, t0: performance.now(), bub: true, pointing: false };
    const tc = A.cell(to[0], to[1]), key = (w.hk || 'w' + i) + '@' + Math.round(to[0] / 10) + ',' + Math.round(to[1] / 10); W.said[key] = S.day;
    W.ask = { to: [Math.round(to[0] * 10) / 10, Math.round(to[1] * 10) / 10], k: T[2] || '', nm: o.lmk ? o.lmk.nm : null, dir: o.dir, t: o.l[0] + ' ' + o.l[1], c: tc, d: S.day, mode: o.mode };
    W.notes.push({ d: S.day, t: o.l[0] + ' ' + o.l[1], c: tc }); while (W.notes.length > 30) W.notes.shift(); A.GAME.mark(); if (A.taskShow) A.taskShow(); LAST = performance.now(); DBG.told++; DBG.lastMs = +(performance.now() - t0).toFixed(2);
    if (A.rec) A.rec('way', { k: T[2] === '🧭' ? 'find' : T[2] === '📋' ? 'task' : 'tmap', help: 'told', st: 'ask', m: o.mode }); return { ...o, i, pointed: pt }; }
  function arrive(me) { const W = st(), a = W.ask, S = A.GAME.S; if (!a) return; if (a.d !== S.day) { W.ask = null; A.GAME.mark(); return; } if (Math.hypot(me.x - a.to[0], me.z - a.to[1]) > 12) return;
    const help = performance.now() - LINE_T < 60000 ? 'told+line' : 'told'; W.ask = null; A.GAME.mark(); if (A.taskShow) A.taskShow(); DBG.arrive++; if (A.rec) A.rec('way', { k: a.k === '📋' ? 'task' : 'find', help, st: 'arrive' });
    if (help !== 'told') { DBG.line++; return; }   /* 선을 따라 왔으면 반기기·솜씨 X(물어서 찾아간 것만) */
    A.cheer(me.x, me.z, 25, 3); A.tone(); A.skUp('explore', 2, 'ask:' + a.c); const nm = a.nm ? L(a.nm) : ''; A.diary(en() ? (nm ? 'Found the way by the ' + nm : 'Asked the way and found it') + ' (' + a.c + ')' : (nm ? nm + ' 보고 찾아갔어요' : '길을 물어 찾아갔어요') + ' (' + a.c + ')'); }
  function sec(me) { if (!built) { if (!A.ready()) return; build(); }
    if (A.lineOn()) LINE_T = performance.now();
    if (CUR && CUR.bub) { const w = CUR.w; if (Math.hypot(w.x - me.x, w.z - me.z) > 6 || performance.now() - CUR.t0 > 6000) { if (A.bubbleOwn()) A.bubbleOff(); CUR.bub = false; } }   /* 6m 밖 · 6초 = 끔 */
    arrive(me); if (A.busy() || performance.now() - LAST < 60000) return;
    const T = A.target(); if (!T || T[2] === '📖') return;   /* 이야기 길 안내는 그대로(town_story navStep) */
    const S = A.GAME.S, tc = A.cell(T[0], T[1]); if ((S.cells || {})[tc]) return;
    const i = nearW(me, 4.5); if (i < 0) return; const w = A.workers()[i]; if (Math.hypot(w.x - T[0], w.z - T[1]) < 10) return;   /* 목표가 그 일꾼 자신 = 말 X */
    const W = st(), key = (w.hk || 'w' + i) + '@' + Math.round(T[0] / 10) + ',' + Math.round(T[1] / 10); if (W.said[key]) return; tell(i, w, T, me); }
  return {
    tick(dt) { if ((Q += dt) < 0.5) return; Q = 0; sec(A.map.player.pos()); },
    sec, wayLine, get lmk() { return LMK; }, built: () => built, rebuild() { built = false; },
    tail() { const W = A.GAME.S.way, a = W && W.ask; if (!a || a.d !== A.GAME.S.day) return ''; return (en() ? 'heard: ' : '들은 길: ') + (a.nm ? L(a.nm) + ' ' : '') + (a.mode === 'near' ? (en() ? 'nearby' : '곁') : a.dir + (en() ? '' : '쪽')); },   /* 할 일 줄 꼬리(들은 길: 정문 북쪽) */
    // 시험 손잡이: 일꾼 i에게 to로 가는 길을 물음(먼저 말하기와 같은 셈 · 말풍선·손가락까지)
    askNow(i, to, icon, force) { if (!built) build(); const w = (A.workers() || [])[i]; if (!w) return null; const me = A.map.player.pos(); return tell(i, w, [to[0], to[1], icon || '📋'], me, force); },
    info: () => ({ built, lmk: LMK.map(q => ({ k: q.k, nm: q.nm[0], x: Math.round(q.x), z: Math.round(q.z), c: A.cell(q.x, q.z) })), dbg: { ...DBG }, cur: CUR && { i: CUR.i, ry: CUR.ry, pt: CUR.pt, pointing: CUR.pointing, bub: CUR.bub }, way: JSON.parse(JSON.stringify(A.GAME.S.way || null)), wait: Math.max(0, Math.round((60000 - (performance.now() - LAST)) / 1000)) }),
    reset() { LAST = -1e9; LINE_T = -1e9; },
    // ── 흔적 지도(TRACE-1) ── src = 마을이 모은 것 { sap:[[x,z,d]], farm:[x,z,d]|null, pots:[x,z,d]|null, hearts:[{x,z,hk,who,d}], wmet:{c:{id,x,z,d}}, deeds:[], don:[], wname(id), item(e) }
    marks(src) { const M = [], add = (k, x, z, d) => { if (Number.isFinite(x) && Number.isFinite(z)) M.push({ k, x, z, c: A.cell(x, z), d: d | 0 }); };
      for (const q of src.sap || []) add('sprout', q[0], q[1], q[2]); if (src.farm) add('sprout', src.farm[0], src.farm[1], src.farm[2]); if (src.pots) add('sprout', src.pots[0], src.pots[1], src.pots[2]);
      for (const D of src.deeds || []) if (D.t === 'plant') add('sprout', D.x, D.z, D.d); else if (D.t === 'wild') add('paw', D.x, D.z, D.d);
      for (const h of src.hearts || []) add('roof', h.x, h.z, h.d); for (const v of Object.values(src.wmet || {})) if (v) add('paw', v.x, v.z, v.d); for (const q of src.don || []) if (q) add('flower', q.x, q.z, q.d);
      return M; },
    draw(g, PX, M, r) { const done = []; for (const m of M) { const [px, py] = PX(m.x, m.z); if (done.some(q => q[2] === m.k && Math.abs(q[0] - px) < r * 1.6 && Math.abs(q[1] - py) < r * 1.6)) continue; done.push([px, py, m.k]); traceIcon(g, px, py, m.k, r); } return done.length; },   /* 같은 그림이 겹치면 하나 */
    log(cell, src) { const e9 = en(), out = [], seen = new Set(), put = (d, t) => { if (!t || seen.has(t)) return; seen.add(t); out.push([d | 0, t]); }, day = d => !(d > 0) ? '' : e9 ? 'Day ' + d + ': ' : d + '일째 ';
      const nmE = e => !e ? '' : String(e).startsWith('w:') ? src.wname(String(e).slice(2), e9) : src.item(e, e9);
      const KO = { plant: () => '씨앗을 심었어요', water: () => '텃밭에 물을 줬어요', harvest: D => (nmE(D.e) ? ul(nmE(D.e)) + ' ' : '') + '거뒀어요', wild: D => ul(nmE(D.e) || '동물') + ' 처음 만났어요', gift: D => (src.who(D.k, false) || '이웃') + '에게 선물했어요', share: D => (src.who(D.k, false) || '이웃') + '에게 나눠 줬어요', work: D => (src.who(D.k, false) || '이웃') + ' 일을 거들었어요', summit: () => '산꼭대기에 올랐어요', stones: () => '징검다리를 건넜어요', book: () => '책을 읽었어요', stars: () => '별을 봤어요', boat: () => '배를 타고 나갔어요', sell: () => '물건을 팔았어요', cook: () => '요리를 만들었어요', mush: () => '버섯을 땄어요', eat: () => '밥을 먹었어요', beach: () => '바닷가에서 놀았어요' };
      const EN = { plant: () => 'planted seeds', water: () => 'watered the garden', harvest: D => 'harvested ' + (nmE(D.e) || 'crops'), wild: D => 'met a ' + (nmE(D.e) || 'wild animal') + ' for the first time', gift: D => 'gave a present to the ' + (src.who(D.k, true) || 'neighbour'), share: D => 'shared food with the ' + (src.who(D.k, true) || 'neighbour'), work: D => 'helped the ' + (src.who(D.k, true) || 'neighbour'), summit: () => 'climbed to the summit', stones: () => 'crossed the stepping stones', book: () => 'read a book', stars: () => 'watched the stars', boat: () => 'took a boat out', sell: () => 'sold things', cook: () => 'cooked a dish', mush: () => 'picked mushrooms', eat: () => 'ate a meal', beach: () => 'played on the beach' };
      const D9 = (src.deeds || []).filter(D => D.c === cell || (Number.isFinite(D.x) && A.cell(D.x, D.z) === cell)).slice().reverse();   /* 학교 안 행적은 칸 이름이 '학교'라 자리로 셈 */ for (const D of D9) { const f = (e9 ? EN : KO)[String(D.t).split(':')[0]]; if (f) put(D.d, day(D.d) + f(D)); }
      for (const q of src.sap || []) if (A.cell(q[0], q[1]) === cell) put(q[2], day(q[2]) + (e9 ? 'planted a young tree' : '어린 나무를 심었어요'));
      if (src.farm && A.cell(src.farm[0], src.farm[1]) === cell) put(src.farm[2], day(src.farm[2]) + (e9 ? 'something is growing in the garden' : '텃밭에 심은 것이 자라요'));
      if (src.pots && A.cell(src.pots[0], src.pots[1]) === cell) put(src.pots[2], day(src.pots[2]) + (e9 ? 'the flowerpots at home are growing' : '우리 집 화분이 자라요'));
      for (const h of src.hearts || []) if (A.cell(h.x, h.z) === cell) put(h.d, day(h.d) + (e9 ? 'became friends with the ' + h.who : h.who + (jong(h.who) ? '과' : '와') + ' 친해졌어요'));
      for (const [c, v] of Object.entries(src.wmet || {})) if (c === cell && v) put(v.d, day(v.d) + (e9 ? 'met a ' + src.wname(v.id, true) + ' for the first time' : ul(src.wname(v.id, false)) + ' 처음 만났어요'));
      out.sort((a, b) => b[0] - a[0]); return out.slice(0, 3).map(q => q[1]); } };
}
