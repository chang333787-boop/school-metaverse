// 🚩 길찾기 시험(ORIENT-1 · 오리엔티어링) + 🏅 도전 모드(CHAL-1) — 정본 docs/systems/town_explore.md '31 진짜 어려운 도전' · town_achieve.md(네 기둥 ②·③) · 메모리 '적지 않은 스트레스로 성취'
//   길찾기 시험: 출발 판(코스마다 하나 · 학교 정문 곁 → 장터 곁 → 등산로 들머리) E = 그 판 전용 지도 한 장(종이 결 · 기호 · 방위표 · 축척 · 칸 줄 · 산은 등고선 — 보물 지도 잉크 mapInk)
//     깃발 다섯(InstancedMesh 한 벌 · 시험 중에만)을 1번부터 차례로 — 몸이 깃발 곁(1.8m)에 들어서면 도장(E·막대 X) · 차례가 아닌 깃발 = '이건 4번이에요' 한 줄
//     빨간 선 X · 거리 수 X · 작은 지도 내 점 X(나침반 띠는 켬) · M = 이 시험 지도 · 오래 헤매면 시간이 비용(150초 = 이웃 말 귀띔 · 240초 = 방위 한 마디)
//     시간은 수첩(🚩 탭)에만 · 순위 X · 내 최고만 · 끝 창 = 내가 걸은 길 그린 지도(집배원 길 지도 꼴) + 맴돈 곳 동그라미 + '어디서 헤맸나' 줄
//     헤맴 = 한 구간 안에서 떠났던 24m 칸에 90m 넘게 돌아다닌 뒤 다시 들어섬(칸마다 한 번 · 50m 안 같은 구간 표시는 하나로) · J·버스로 옮기면(한 번에 12m 넘게) 그 판은 기록·보상 X
//     코스 셋: 🏫 학교 둘레 → 🏘 시내 → ⛰ 산(앞 코스를 마쳐야 열림 · 산은 등산로가 있는 마을만) · 보상 = 솜씨만(탐험 · rwCheck 'xp:chal' · 코스마다 하루 한 번)
//   도전 모드(설정 한 칸 · SET.chal): 켜면 빨간 선·위 가운데 거리 줄·작은 지도 목표 별·나침반 띠 목표 표가 꺼지고, 길 안내 단추 = 🗺 지도 펴기(큰 지도 M · 방위·축척 있음)
//     장소 안내 = 이웃 말 한 줄(칸·방위·랜드마크 — town_ask.js wayLine) · 그렇게 찾아가 닿으면(40m 넘게 떨어진 곳) 나의 길 🏅 도전가 걸음 하나(하루 한도)
//   저장 GAME.S.orient = { v, cd: { 날: 1 }, best: { c1: { t, w, d } }, last: { c1: { t, w, d, j } }, n: { c1: 번 }, rw: { c1: 날 } } — 진행 중인 판은 저장하지 않음(새로고침 = 출발 판에서 다시)
//   지킴: 판타지 X · 실명 X(판·깃발에 사람 X) · 순위 X · 아이콘·% X(수첩 시간만) · 새 Light X · 매 프레임 = 0.25초 칸 하나(시험 중에만) · 새 객체 X(스크래치) · 캔버스 글자에 이모지 X
import { mapInk } from './town_treasure.js?v=8';
export const OR_V = 1;
const T2 = (ko, en) => [ko, en];
export const COURSES = [
  { id: 'c1', ic: '🏫', t: T2('학교 둘레', 'Around the school'), sk: 3, learn: T2('방위와 칸 이름으로 찾아요', 'Find your way with directions and grid cells'), lk: 'map:dir8' },
  { id: 'c2', ic: '🏘', t: T2('시내', 'Downtown'), sk: 4, learn: T2('지도 기호와 축척으로 찾아요', 'Find your way with map symbols and the scale bar'), lk: 'map:scale' },
  { id: 'c3', ic: '⛰', t: T2('산', 'The hill'), sk: 5, learn: T2('등고선으로 가파른 곳을 읽어요', 'Read steep ground from contour lines'), lk: 'map:contour' },
];
const DIR8 = [T2('북', 'north'), T2('북동', 'north-east'), T2('동', 'east'), T2('남동', 'south-east'), T2('남', 'south'), T2('남서', 'south-west'), T2('서', 'west'), T2('북서', 'north-west')];
const bearing = (dx, dz) => (Math.atan2(dx, -dz) * 57.29578 + 360) % 360;   /* 0 = 북(−z) · 90 = 동(+x) — town_ask.js와 같음 */
const d8 = (dx, dz) => DIR8[Math.round(bearing(dx, dz) / 45) % 8];
const FLAG_R = 1.8, CELL = 24, LOOP_M = 90, HINT1 = 150, HINT2 = 240, TRK_N = 6000;
const NUMW = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
const keys = o => (o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : []);
export const fmtSec = (s, en) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60), r = s % 60; return en ? (m ? m + ' min ' : '') + r + ' s' : (m ? m + '분 ' : '') + r + '초'; };

// 나의 길 🏅 도전가 걸음(town_path.js stepsOf가 부름 · 순수): 도전 모드로 찾아간 날(하루 하나) + 처음 완주한 코스
export function chalSteps(S) { const o = S && S.orient; if (!o || typeof o !== 'object') return 0; const b = o.best && typeof o.best === 'object' ? o.best : {}; return Math.min(30, keys(o.cd).length) + COURSES.filter(c => b[c.id]).length; }

// 깃발 한 벌(정점 색 한 메시): 말뚝 + 주황·흰 대각 무늬 상자(실제 오리엔티어링 검문 깃발 꼴 — 상자 면마다 삼각형 둘 = 흰·주황) + 밑 말뚝 받침
function flagGeo(T3) { const P = [], N = [], C = [], col = new T3.Color(), M = new T3.Matrix4(), Q = new T3.Quaternion(), E = new T3.Euler(), V = new T3.Vector3(), S = new T3.Vector3();
  const part = (g, x, y, z, ry, sx, sy, sz, hexA, hexB) => { M.compose(V.set(x, y, z), Q.setFromEuler(E.set(0, ry, 0)), S.set(sx, sy, sz)); g.applyMatrix4(M); const q = g.index ? g.toNonIndexed() : g, p = q.attributes.position, n = q.attributes.normal;
    for (let i = 0; i < p.count; i++) { col.setHex(hexB != null && ((i / 3) | 0) % 2 ? hexB : hexA); P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)); C.push(col.r, col.g, col.b); } if (q !== g) q.dispose(); g.dispose(); };
  part(new T3.BoxGeometry(1, 1, 1), 0, 0.8, 0, 0, 0.06, 1.6, 0.06, 0x8a8f96);   /* 말뚝(아이 키보다 조금 높게 · 멀리서 보이게) */
  part(new T3.BoxGeometry(1, 1, 1), 0, 1.3, 0.3, 0.785, 0.5, 0.5, 0.5, 0xffffff, 0xf07a1a);   /* 깃발 상자(대각 무늬) — 말뚝 옆에 달림(같은 면 겹침 X) */
  part(new T3.BoxGeometry(1, 1, 1), 0, 0.035, 0, 0, 0.2, 0.07, 0.2, 0x6b4a2f);   /* 받침 */
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.computeBoundingSphere(); return g; }

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · lang() · esc · on() · busy() · ready() 큰 지도를 배웠나 · panel() 창이 떠 있나 · chalSet() 설정 · openP(h, w, k) · closeP() · say(t, s) · sfx(k) · banner(t, s) · chip(k, t, o) · SFONT
//   drawMap(g, o) · mapSnip(cv, pts, o) · route(a, b) · walkLen(a, b, rr, mg) · okSpot(x, z) · gy(x, z) · ty(x, z) · cellOf(x, z) · edges() { xs, zs } 칸 경계(땅 자리) · places() · school() { rect, gate } · hubs() · trail() 등산로 점
//   lmk() 랜드마크 [{ k, nm:[ko,en], x, z }] · wayLine(o) · buildParts(fn) · skUp(k, n, src) · rec(k, o) · diary(t) · learn(ids) · comp(on) 나침반 띠 · guide(to, info) · guideOff() · big() 큰 지도 · reguide() 도전 모드를 끈 뒤 빨간 선 다시
export function createOrient(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t ?? '')), esc = t => A.esc(t);
  const G = () => A.GAME.S, day = () => G().day | 0, mark = () => A.GAME.mark();
  const S = () => { const g = G(); let s = g.orient; if (!s || typeof s !== 'object' || s.v !== OR_V) s = g.orient = { v: OR_V, cd: {}, best: {}, last: {}, n: {}, rw: {} }; for (const k of ['cd', 'best', 'last', 'n', 'rw']) if (!s[k] || typeof s[k] !== 'object') s[k] = {}; return s; };
  const ink = mapInk(() => A.SFONT, en);
  const DBG = { built: {}, stamp: 0, wrong: 0, loops: 0, hint: 0, jmp: 0, chal: 0, ms: 0 };
  let dead = false, BOARDS = [], COURSE = {}, RUN = null, FLAGS = null, FGEO = null, FMAT = null, q = 0, sq = 0, CHIP = '', GOAL = '', lastChal = false, panelT = 0, ENDP = null;
  const M4 = new T3.Matrix4(), QY = new T3.Quaternion(), UP = new T3.Vector3(0, 1, 0), VP = new T3.Vector3(), VS = new T3.Vector3(1, 1, 1), VZ = new T3.Vector3(0, 0, 0);   /* 스크래치(깃발 자리 · 시험 시작 때만) */
  const cfg = { loop: LOOP_M, h1: HINT1, h2: HINT2 };

  // ───────── 자리 고르기 ─────────
  function spotNear(cx, cz, r0, r1) { for (let r = r0; r <= r1; r += 1.5) for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; if (A.okSpot(x, z)) return [x, z]; } return null; }
  /* 걸어서 닿나: 길(route)이 이어지고 길 끝에서 그 자리까지 몸 규칙 걷기(보물 지도 reach와 같은 셈) */
  function reach(a, b) { const R = A.route(a, b); if (!R || !R.ok || !R.pts || R.pts.length < 2) return false; const lb = R.pts[R.pts.length - 2]; if (Math.hypot(lb[0] - b[0], lb[1] - b[1]) < 2.5) return R.len; const w = A.walkLen(lb, b, 2.2, 30); return w >= 0 ? R.len : false; }
  function lmkAll() { const out = []; for (const q9 of A.lmk() || []) if (q9 && Number.isFinite(q9.x) && q9.k !== 'bus' && q9.k !== 'home') out.push({ nm: q9.nm, x: q9.x, z: q9.z });
    for (const p of A.places()) { if (p.school || p.area || !p.name || ['house', 'apt'].includes(p.kind)) continue; const x = p.door ? p.door[0] : p.x, z = p.door ? p.door[1] : p.z; if (Number.isFinite(x)) out.push({ nm: [p.name, p.en || p.name], x, z, sym: p.sym || p.icon }); } return out; }
  /* 깃발 설명(검문 설명 = 이웃 말 한 줄): 칸 + 가까운 랜드마크에서 방위 · 없으면 학교·등산로에서 */
  function descOf(x, z, c, near) { const cell = A.cellOf(x, z), LM = lmkAll(); let best = null, bd = 70; for (const m of LM) { const d = Math.hypot(m.x - x, m.z - z); if (d < bd && !LM.some(o => o !== m && o.nm[0] === m.nm[0] && Math.hypot(o.x - m.x, o.z - m.z) > 12 && Math.hypot(o.x - x, o.z - z) < 220)) { bd = d; best = m; } }   /* 둘레에 같은 이름이 또 있으면(큰 나무 여럿) 헷갈리니 쓰지 않음 */
    let tail; if (best) tail = bd < 10 ? T2(best.nm[0] + ' 바로 앞', 'right by the ' + best.nm[1]) : (() => { const D = d8(x - best.x, z - best.z); return T2(best.nm[0] + ' ' + D[0] + '쪽', D[1] + ' of the ' + best.nm[1]); })();
    else if (c === 'c1') { const sc = A.school(), D = d8(x - (sc.rect[0] + sc.rect[2]) / 2, z - (sc.rect[1] + sc.rect[3]) / 2); tail = T2('학교 담 ' + D[0] + '쪽', D[1] + ' side of the school fence'); }
    else if (near) { const D = d8(x - near[0], z - near[1]); tail = T2('등산로에서 ' + D[0] + '쪽 비탈', 'on the slope ' + D[1] + ' of the trail'); }
    else tail = T2('길에서 조금 떨어진 곳', 'a little off the road');
    return { cell, t: [cell + ' 칸 · ' + tail[0], 'cell ' + cell + ', ' + tail[1]], lmk: best ? { nm: best.nm, x: best.x, z: best.z } : null }; }

  // ───────── 코스 셋(마을마다 늘 같은 자리 · 무작위 X · 처음 쓸 때 한 번 셈) ─────────
  function startOf(c) { if (c === 'c1') { const sc = A.school(); if (!sc) return null; const g = sc.gate; return spotNear(g[0] + 7, g[1] + 5, 0, 12) || spotNear(g[0] - 7, g[1] + 5, 0, 12); }
    if (c === 'c2') { const H = (A.hubs() || []).find(h => h.k === 'market'); let cx, cz; if (H) { cx = H.x; cz = H.z; } else { const P9 = A.places().filter(p => !p.school && !p.nat && !p.area && !p.prop && p.door && !['house', 'apt'].includes(p.kind)); if (P9.length < 5) return null; cx = P9.reduce((a, p) => a + p.x, 0) / P9.length; cz = P9.reduce((a, p) => a + p.z, 0) / P9.length; } return spotNear(cx, cz, 4, 30); }
    if (c === 'c3') { const T = A.trail(); if (!T || T.length < 3) return null; return spotNear(T[0][0], T[0][1], 2, 18); } return null; }
  function build(c) { if (COURSE[c] !== undefined) return COURSE[c]; const t0 = performance.now(); let R = null; try { R = c === 'c1' ? buildC1() : c === 'c2' ? buildC2() : buildC3(); } catch (e) { console.warn('[길찾기] 코스 짓기', c, e); DBG.err = String(e && e.message); R = null; }
    if (R && R.flags.length >= 4) { R.flags.forEach((f, i) => { Object.assign(f, descOf(f.x, f.z, c, f.near)); f.y = A.gy(f.x, f.z); f.n = i + 1; }); } else R = null;
    COURSE[c] = R; DBG.built[c] = { ms: Math.round(performance.now() - t0), n: R ? R.flags.length : 0 }; return R; }
  function buildC1() { const sc = A.school(), st = startOf('c1'); if (!sc || !st) return null; const [x0, z0, x1, z1] = sc.rect, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, C9 = [];
    for (const off of [18, 26, 12, 34]) { const X0 = x0 - off, X1 = x1 + off, Z0 = z0 - off, Z1 = z1 + off, per = 2 * (X1 - X0 + Z1 - Z0); for (let s = 0; s < per; s += 5) { let x, z, u = s; if (u < X1 - X0) { x = X0 + u; z = Z0; } else if ((u -= X1 - X0) < Z1 - Z0) { x = X1; z = Z0 + u; } else if ((u -= Z1 - Z0) < X1 - X0) { x = X1 - u; z = Z1; } else { u -= X1 - X0; x = X0; z = Z1 - u; } if (A.okSpot(x, z)) C9.push({ x, z, b: bearing(x - cx, z - cz), off }); } }
    const want = [225, 290, 350, 50, 125], flags = []; let prev = st;   /* 정문(남)에서 시계 방향으로 한 바퀴: 남서 → 서 → 북 → 북동 → 남동 */
    for (const b0 of want) { const L9 = C9.filter(p => { const db = Math.abs(((p.b - b0) % 360 + 540) % 360 - 180); return db < 32 && flags.every(f => Math.hypot(f.x - p.x, f.z - p.z) > 35) && Math.hypot(p.x - st[0], p.z - st[1]) > 30; }).sort((a, b) => Math.abs(((a.b - b0) % 360 + 540) % 360 - 180) + a.off * 0.4 - (Math.abs(((b.b - b0) % 360 + 540) % 360 - 180) + b.off * 0.4));
      for (const p of L9.slice(0, 6)) if (reach(prev, [p.x, p.z]) !== false) { flags.push({ x: +p.x.toFixed(1), z: +p.z.toFixed(1) }); prev = [p.x, p.z]; break; } }
    return { c: 'c1', start: st, flags }; }
  function buildC2() { const st = startOf('c2'); if (!st) return null; const C9 = []; DBG.c2 = { pl: 0, door: 0, sp: 0, legs: [] };
    for (const p of A.places()) { DBG.c2.pl++; if (p.school || p.nat || p.area || p.prop || !p.door || ['house', 'apt'].includes(p.kind)) continue; DBG.c2.door++; const d0 = Math.hypot(p.door[0] - st[0], p.door[1] - st[1]); if (d0 < 45 || d0 > 360) continue;
      let ox = p.door[0] - p.x, oz = p.door[1] - p.z; const ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol; let sp = null; for (const k of [4, 6, 8]) { for (const s of [0, 3, -3]) { const x = p.door[0] + ox * k - oz * s, z = p.door[1] + oz * k + ox * s; if (A.okSpot(x, z) || (A.side && A.side(x, z))) { sp = [x, z]; break; } } if (sp) break; } if (sp) { C9.push({ x: sp[0], z: sp[1] }); DBG.c2.sp++; } }
    if (C9.length < 25) { const LM = lmkAll().filter(m => Math.hypot(m.x - st[0], m.z - st[1]) < 340); for (let gx = -320; gx <= 320; gx += 14) for (let gz = -320; gz <= 320; gz += 14) { const x = st[0] + gx, z = st[1] + gz; if (gx * gx + gz * gz > 320 * 320 || !LM.some(m => Math.hypot(m.x - x, m.z - z) < 30)) continue; if (A.okSpot(x, z) || (A.side && A.side(x, z))) C9.push({ x, z }); } }   /* 문 앞 자리가 모자라면: 이름 있는 곳 30m 안 빈 땅·인도(14m 칸) */ DBG.c2.cand = C9.length;
    const flags = []; let prev = st; for (let n = 0; n < 5; n++) { const L9 = C9.filter(p => flags.every(f => Math.hypot(f.x - p.x, f.z - p.z) > 45) && Math.hypot(p.x - st[0], p.z - st[1]) > 40).map(p => [Math.abs(Math.hypot(p.x - prev[0], p.z - prev[1]) - 130), p]).filter(q9 => q9[0] < 110).sort((a, b) => a[0] - b[0]);
      let got = null; for (const [, p] of L9.slice(0, 8)) if (reach(prev, [p.x, p.z]) !== false) { got = p; break; } DBG.c2.legs.push([L9.length, !!got]); if (!got) break; flags.push({ x: +got.x.toFixed(1), z: +got.z.toFixed(1) }); prev = [got.x, got.z]; }
    return { c: 'c2', start: st, flags }; }
  function buildC3() { const T = A.trail(), st = startOf('c3'); if (!T || !st) return null; const cum = [0]; for (let i = 1; i < T.length; i++) cum.push(cum[i - 1] + Math.hypot(T[i][0] - T[i - 1][0], T[i][1] - T[i - 1][1])); const TL = cum[cum.length - 1]; DBG.c3 = { n: T.length, TL: Math.round(TL) }; if (TL < 150) return null;
    const at = f => { const s = f * TL; let i = 1; while (i < T.length - 1 && cum[i] < s) i++; const a = T[i - 1], b = T[i], k = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), dx = b[0] - a[0], dz = b[1] - a[1], dl = Math.hypot(dx, dz) || 1; return { x: a[0] + dx * k, z: a[1] + dz * k, nx: -dz / dl, nz: dx / dl }; };
    const flags = []; [0.18, 0.36, 0.54, 0.72, 0.92, 0.27, 0.45, 0.63, 0.82, 1].forEach((f, i) => { if (flags.length >= 5) return; const P = at(f), side = i % 2 ? -1 : 1; let sp = null; for (const o of [9, 13, 6, 16, 4]) { for (const sd of [side, -side]) { const x = P.x + P.nx * o * sd, z = P.z + P.nz * o * sd; if (A.okSpot(x, z) && Math.abs(A.gy(x, z) - A.gy(P.x, P.z)) < 4 && A.walkLen([P.x, P.z], [x, z], 2.2, 25) >= 0) { sp = [x, z]; break; } } if (sp) break; }
      if (!sp) sp = [P.x, P.z]; if (flags.every(q9 => Math.hypot(q9.x - sp[0], q9.z - sp[1]) > 24) && Math.hypot(st[0] - sp[0], st[1] - sp[1]) > 24) flags.push({ x: +sp[0].toFixed(1), z: +sp[1].toFixed(1), near: [P.x, P.z], f }); }); flags.sort((a, b) => a.f - b.f);   /* 앞 다섯 자리에서 모자라면 사이 자리로 채우고 오르는 차례로 */
    DBG.c3.f = flags.length; return { c: 'c3', start: st, flags, hill: true }; }
  const open9 = c => { const i = COURSES.findIndex(q9 => q9.id === c); return i <= 0 || !!S().best[COURSES[i - 1].id] || (S().n[COURSES[i - 1].id] | 0) > 0; };

  // ───────── 출발 판(코스마다 · 기둥 둘 + 글자 판 · E = 시작 창) ─────────
  function boardTex(c) { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 300; const g = cv.getContext('2d'), C = COURSES.find(q9 => q9.id === c), F = A.SFONT;
    g.fillStyle = '#a3237a'; g.fillRect(0, 0, 512, 300); g.fillStyle = '#fbf7ec'; g.fillRect(12, 12, 488, 276); g.fillStyle = '#2b2420'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 54px ' + F; g.fillText(en() ? 'Orienteering' : '길찾기 시험', 256, 78); g.font = '800 40px ' + F; g.fillText(L(C.t) + (en() ? ' course' : ' 코스'), 256, 150);
    g.fillStyle = '#a3237a'; g.beginPath(); g.moveTo(256, 196); g.lineTo(286, 248); g.lineTo(226, 248); g.closePath(); g.lineWidth = 7; g.strokeStyle = '#a3237a'; g.stroke();   /* 출발 = 세모(오리엔티어링 지도 약속) */
    g.fillStyle = '#2b2420'; g.font = '700 24px ' + F; g.fillText(en() ? 'Map, five flags, in order' : '지도 한 장 · 깃발 다섯 · 차례대로', 256, 272); const tx = new T3.CanvasTexture(cv); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2; return tx; }
  function boards() { for (const B of BOARDS) { B.h.remove(); if (B.g.parent) B.g.parent.remove(B.g); B.m.geometry.dispose(); B.m.material.map.dispose(); B.m.material.dispose(); } BOARDS = [];
    for (const C of COURSES) { const st = startOf(C.id); if (!st) continue; const [x, z] = st, sc = A.school(), face = C.id === 'c1' && sc ? sc.gate : C.id === 'c3' && A.trail() ? A.trail()[1] : null, ry = face ? Math.atan2(face[0] - x, face[1] - z) : 0, w = 1.5, h = 0.9, y0 = 0.75;
      const g = A.buildParts(put => { for (const s of [-1, 1]) put('b', s * (w / 2 + 0.04), 0, -0.05, 0.09, y0 + h + 0.1, 0.09, 0x6b4a2f); put('b', 0, y0 - 0.06, -0.08, w + 0.16, h + 0.14, 0.05, 0x8a6a4a); });
      g.position.set(x, A.gy(x, z), z); g.rotation.y = ry; g.userData.fx = 1; map.add(g); const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshLambertMaterial({ map: boardTex(C.id) })); m.position.set(0, y0 + h / 2 + 0.01, -0.045); m.userData.fx = 1; g.add(m); g.updateMatrixWorld(true);
      const hh = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: 2.2, label: label(C.id), use: () => openStart(C.id) }); BOARDS.push({ c: C.id, x, z, g, m, h: hh }); } }
  function label(c) { const C = COURSES.find(q9 => q9.id === c), e = en(); if (!A.ready()) return '🔒 🚩 ' + (e ? 'Orienteering — opens with the big map' : '길찾기 시험 — 큰 지도가 생기면 열려요'); if (!open9(c)) { const P = COURSES[COURSES.findIndex(q9 => q9.id === c) - 1]; return '🔒 🚩 ' + (e ? 'Finish the ' + P.t[1] + ' course first' : P.t[0] + ' 코스를 마치면 열려요'); }
    if (RUN && RUN.c === c) return '🚩 ' + (e ? 'Look at the course map' : '시험 지도 다시 보기'); return '🚩 ' + (e ? 'Orienteering: ' + C.t[1] : '길찾기 시험 · ' + C.t[0]); }

  // ───────── 시험 지도(그 판 전용 · 종이 결) ─────────
  function boxOf(R, pad) { let ax = R.start[0], bx = ax, az = R.start[1], bz = az; for (const f of R.flags) { ax = Math.min(ax, f.x); bx = Math.max(bx, f.x); az = Math.min(az, f.z); bz = Math.max(bz, f.z); } return [ax - pad, az - pad, bx + pad, bz + pad]; }
  function contours(g, x0, z0, sc, w, h) { const st = 5, nx = Math.ceil(w / sc / st) + 1, nz = Math.ceil(h / sc / st) + 1, H = new Float32Array(nx * nz); let lo = 1e9, hi = -1e9; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const v = A.ty(x0 + i * st, z0 + j * st); H[j * nx + i] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
    const iv = hi - lo > 40 ? 10 : 5; g.save(); g.lineCap = 'round'; for (let v = Math.ceil(lo / iv) * iv; v < hi; v += iv) { const thick = Math.round(v / iv) % 5 === 0; g.strokeStyle = thick ? '#7a4a22' : '#a8743f'; g.lineWidth = thick ? 2.2 : 1.2; g.beginPath();
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = H[j * nx + i], b = H[j * nx + i + 1], c = H[(j + 1) * nx + i + 1], d = H[(j + 1) * nx + i], E9 = [], px = i * st * sc, pz = j * st * sc, s9 = st * sc;
        if ((a < v) !== (b < v)) E9.push(px + s9 * (v - a) / (b - a), pz); if ((b < v) !== (c < v)) E9.push(px + s9, pz + s9 * (v - b) / (c - b)); if ((d < v) !== (c < v)) E9.push(px + s9 * (v - d) / (c - d), pz + s9); if ((a < v) !== (d < v)) E9.push(px, pz + s9 * (v - a) / (d - a));
        if (E9.length >= 4) { g.moveTo(E9[0], E9[1]); g.lineTo(E9[2], E9[3]); } if (E9.length === 8) { g.moveTo(E9[4], E9[5]); g.lineTo(E9[6], E9[7]); } } g.stroke(); } g.restore(); return iv; }
  function drawCourse(cv, R, o9) { const w = cv.width, h = cv.height, g = cv.getContext('2d'), bb = boxOf(R, 45), sc = Math.min(w / (bb[2] - bb[0]), h / (bb[3] - bb[1])), cx = (bb[0] + bb[2]) / 2, cz = (bb[1] + bb[3]) / 2, x0 = cx - w / 2 / sc, z0 = cz - h / 2 / sc, P = (x, z) => [(x - x0) * sc, (z - z0) * sc];
    try { A.drawMap(g, { x0, z0, sc, w, h, symbols: true, doors: false }); } catch (e) { g.fillStyle = '#e9efe2'; g.fillRect(0, 0, w, h); }
    let iv = 0; if (R.hill) { g.fillStyle = 'rgba(244,234,208,.5)'; g.fillRect(0, 0, w, h); iv = contours(g, x0, z0, sc, w, h); }
    { const E = A.edges(); g.save(); g.strokeStyle = 'rgba(29,53,87,.35)'; g.lineWidth = 1; g.setLineDash([4, 5]); g.beginPath(); for (const x of E.xs) { const px = (x - x0) * sc; if (px > 0 && px < w) { g.moveTo(px, 0); g.lineTo(px, h); } } for (const z of E.zs) { const pz = (z - z0) * sc; if (pz > 0 && pz < h) { g.moveTo(0, pz); g.lineTo(w, pz); } } g.stroke(); g.setLineDash([]);   /* 칸 줄 + 칸 이름(설명의 칸을 지도에서 찾게) */
      g.font = '800 12px ' + A.SFONT; g.textAlign = 'left'; g.textBaseline = 'top'; for (let i = 0; i < E.xs.length - 1; i++) for (let j = 0; j < E.zs.length - 1; j++) { const px = (E.xs[i] - x0) * sc, pz = (E.zs[j] - z0) * sc, qx = (E.xs[i + 1] - x0) * sc, qz = (E.zs[j + 1] - z0) * sc; if (qx < 0 || qz < 0 || px > w || pz > h) continue; const lx = Math.max(px, 0) + 4, lz = Math.max(pz, 0) + 4; if (lx > w - 30 || lz > h - 16) continue; const t9 = A.cellOf((E.xs[i] + E.xs[i + 1]) / 2, (E.zs[j] + E.zs[j + 1]) / 2); if (!t9 || /밖|out/.test(t9)) continue; g.fillStyle = 'rgba(255,253,246,.85)'; g.fillRect(lx - 2, lz - 1, g.measureText(t9).width + 4, 15); g.fillStyle = '#1d3557'; g.fillText(t9, lx, lz); } g.restore(); }
    ink.paper(g, w, h, 'or:' + R.c);
    const pts = [R.start, ...R.flags.map(f => [f.x, f.z])].map(q9 => P(q9[0], q9[1])), PU = '#a3237a';   /* 오리엔티어링 지도 약속: 보라 세모(출발) · 동그라미(깃발) · 차례 줄 */
    g.save(); g.strokeStyle = PU; g.lineWidth = 2.5; g.globalAlpha = 0.85; for (let i = 0; i + 1 < pts.length; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, dl = Math.hypot(dx, dz) || 1, r0 = i ? 15 : 17; if (dl < 34) continue; g.beginPath(); g.moveTo(ax + dx / dl * r0, az + dz / dl * r0); g.lineTo(bx - dx / dl * 15, bz - dz / dl * 15); g.stroke(); }
    g.globalAlpha = 1; g.lineWidth = 3; { const [sx, sz] = pts[0]; g.beginPath(); g.moveTo(sx, sz - 15); g.lineTo(sx + 13, sz + 8); g.lineTo(sx - 13, sz + 8); g.closePath(); g.stroke(); }
    g.font = '900 15px ' + A.SFONT; g.textAlign = 'center'; g.textBaseline = 'middle'; R.flags.forEach((f, i) => { const [a, b] = pts[i + 1], done = o9 && o9.done > i; g.strokeStyle = PU; g.lineWidth = 3; g.beginPath(); g.arc(a, b, 13, 0, 6.2832); g.stroke(); if (done) { g.fillStyle = 'rgba(163,35,122,.25)'; g.fill(); }
      const lx = a + 17, lz = b - 15; g.lineWidth = 4; g.strokeStyle = 'rgba(255,253,246,.95)'; g.strokeText(String(i + 1), lx, lz); g.fillStyle = PU; g.fillText(String(i + 1), lx, lz); }); g.restore();
    if (o9 && o9.trk) o9.trk(g, P);
    ink.compass(g, w - 34, 50); ink.scaleBar(g, 18, h - 22, sc);
    const rows = [['#a3237a', en() ? 'Start' : '출발', 'peak'], ['', en() ? 'Flag (number = order)' : '깃발(숫자 = 차례)'], ['#a3237a', en() ? 'Order to go' : '가는 차례', 'line']]; if (iv) rows.push(['#a8743f', (en() ? 'Contour, every ' : '등고선(') + iv + (en() ? ' m' : 'm마다)'), 'line']);
    if (!o9 || !o9.noLeg) ink.legend(g, 12, 12, rows);
    return { x0, z0, sc }; }
  function cardHtml(R, e) { return '<ol class="or-ds" style="margin:6px 0 0;padding-left:22px;font-size:14px;line-height:1.5">' + R.flags.map((f, i) => '<li' + (RUN && RUN.i > i ? ' style="opacity:.55"' : RUN && RUN.i === i ? ' style="font-weight:900"' : '') + '>' + esc(f.t[e ? 1 : 0]) + (RUN && RUN.i > i ? (e ? ' — stamped' : ' — 도장') : '') + '</li>').join('') + '</ol>'; }
  function mapCanvas(R, o9) { const cv = document.createElement('canvas'); cv.width = 560; cv.height = 380; try { drawCourse(cv, R, o9); } catch (e) { console.warn('[길찾기] 지도', e); } cv.style.cssText = 'width:min(560px,88vw);height:auto;display:block;margin:0 auto;border-radius:6px'; return cv; }

  // ───────── 시작 창 ─────────
  function openStart(c) { const e = en(), C = COURSES.find(q9 => q9.id === c);
    if (!A.ready()) { A.say(e ? '🔒 The test opens once you have the big map (follow the story)' : '🔒 큰 지도가 생기면 길찾기 시험을 할 수 있어요(이야기를 따라가요)', 3); return; }
    if (!open9(c)) { A.say(label(c).replace('🔒 🚩 ', '🔒 '), 3); return; }
    if (RUN && RUN.c === c) { openMap(); return; }
    const R = build(c); if (!R) { A.say(e ? '🚩 This town has no course here yet' : '🚩 이 마을에는 아직 이 코스를 낼 자리가 없어요', 3); return; }
    const s = S(), n = s.n[c] | 0;
    const P = A.openP('<h3>🚩 ' + esc(e ? 'Orienteering — ' + C.t[1] : '길찾기 시험 — ' + C.t[0]) + '</h3><div class="sm">' + esc(L(C.learn)) + '</div>'
      + '<div style="margin:6px 0;line-height:1.55">' + esc(e ? 'Take this map and find the five flags in order, from 1.' : '이 지도 한 장을 들고 깃발 다섯 곳을 1번부터 차례로 찾아요.') + '<br>' + esc(e ? 'There is no red line in this test. Use only the map and the cell names.' : '이 시험에는 빨간 선이 없어요. 지도와 칸 이름으로만 찾아가요.') + '<br>' + esc(e ? 'Stand next to a flag and it is stamped.' : '깃발 곁에 서면 도장이 찍혀요.') + '<br>' + esc(e ? 'Press M to look at this map again.' : 'M을 누르면 이 지도를 다시 펴요.') + '</div>'
      + '<div class="or-cv"></div>' + cardHtml(R, e)
      + '<div class="sm" style="margin-top:6px">' + esc(e ? 'Your time goes only in your notebook (🚩 tab). Nobody else sees it.' : '걸린 시간은 수첩 🚩 칸에만 적혀요. 남과 견주지 않아요.') + (n ? ' ' + esc(e ? 'You have finished this course before.' : '이 코스를 해낸 적이 있어요.') : '') + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Not now' : '다음에') + '</button><button data-a="go">🚩 ' + (e ? 'Take the map and start' : '지도 받고 출발') + '</button></div>', false, 'ormap');
    P.querySelector('.or-cv').appendChild(mapCanvas(R));
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') A.closeP(); if (b.dataset.a === 'go') { A.closeP(); start(c); } }; return P; }

  // ───────── 시험 진행 ─────────
  function flagsOn(R) { if (!FLAGS) { FGEO = flagGeo(T3); FMAT = new T3.MeshLambertMaterial({ vertexColors: true, flatShading: true }); FLAGS = new T3.InstancedMesh(FGEO, FMAT, 5); FLAGS.frustumCulled = false; FLAGS.userData.fx = 1; FLAGS.matrixAutoUpdate = false; }
    for (let i = 0; i < 5; i++) { const f = R.flags[i]; if (f) { QY.setFromAxisAngle(UP, i * 1.3); M4.compose(VP.set(f.x, f.y, f.z), QY, VS); } else M4.compose(VP.set(0, -999, 0), QY.identity(), VZ); FLAGS.setMatrixAt(i, M4); }
    FLAGS.count = Math.min(5, R.flags.length); FLAGS.instanceMatrix.needsUpdate = true; if (!FLAGS.parent) map.add(FLAGS); FLAGS.visible = true; }
  function flagsOff() { if (FLAGS) FLAGS.visible = false; }
  function start(c) { const R = build(c); if (!R) return false; A.guideOff(); const me = map.player.pos();
    RUN = { c, R, i: 0, t: 0, leg: 0, d0: day(), w: [], trk: new Float32Array(TRK_N * 2), tn: 0, lx: me.x, lz: me.z, px: me.x, pz: me.z, dist: 0, cells: new Map(), ck: '', jmp: false, h: 0, wrong: -1, wrongT: 0, mapT: 0 };
    pushTrk(me.x, me.z); flagsOn(R); A.comp(true); A.learn([COURSES.find(q9 => q9.id === c).lk]); A.sfx('go');
    A.banner(en() ? '🚩 Go! Find flag 1' : '🚩 출발! 1번 깃발을 찾아요', 2); A.rec('orient', { k: 'start', c }); setGoal(); chipNow(); return true; }
  function pushTrk(x, z) { if (!RUN || RUN.tn >= TRK_N * 2) return; RUN.trk[RUN.tn++] = x; RUN.trk[RUN.tn++] = z; RUN.px = x; RUN.pz = z; }
  function stop(why) { if (!RUN) return; const c = RUN.c; RUN = null; flagsOff(); A.comp(false); A.chip('twn-or', null); CHIP = ''; GOAL = ''; if (why) { A.say(why, 3.2); A.rec('orient', { k: 'stop', c }); } }
  function setGoal() { if (!RUN) { GOAL = ''; return; } const f = RUN.R.flags[RUN.i], e = en(); GOAL = '🚩 ' + (e ? 'Flag ' + f.n + ': ' : f.n + '번 깃발: ') + f.t[e ? 1 : 0] + (e ? ' · M = map' : ' · M = 지도'); }
  function chipNow() { const t = RUN ? '🚩 ' + (en() ? 'Flag ' + (RUN.i + 1) + ' · map (M)' : (RUN.i + 1) + '번 깃발 · 지도 (M)') : ''; if (t === CHIP) return; CHIP = t; A.chip('twn-or', t || null, { onClick: () => openMap() }); }
  /* 둘러보기(시험 봇의 '눈'과 같은 셈): 지금 자리에서 r 안 · 보이는(가림 없는) 깃발 번호 */
  function seen(r) { if (!RUN) return []; const me = map.player.pos(), out = []; RUN.R.flags.forEach((f, i) => { const d = Math.hypot(f.x - me.x, f.z - me.z); if (d > (r || 28)) return; if (map.q.los && !map.q.los([me.x, me.y + 1.5, me.z], [f.x, f.y + 1.0, f.z])) return; out.push({ n: i + 1, x: f.x, z: f.z, d: Math.round(d) }); }); return out; }
  function check() { if (!RUN) return; const me = map.player.pos(), R = RUN.R, step = Math.hypot(me.x - RUN.lx, me.z - RUN.lz);
    if (step > 12) { RUN.jmp = true; DBG.jmp++; } else RUN.dist += step; RUN.lx = me.x; RUN.lz = me.z;
    if (Math.hypot(me.x - RUN.px, me.z - RUN.pz) >= 3) pushTrk(me.x, me.z);
    { const k = Math.floor(me.x / CELL) + ',' + Math.floor(me.z / CELL); if (k !== RUN.ck) { const was = RUN.cells.get(RUN.ck); if (was) was.left = RUN.dist; const c9 = RUN.cells.get(k); if (c9 && c9.left != null && !c9.loop && RUN.dist - c9.left >= cfg.loop) { c9.loop = true; if (!RUN.w.some(q9 => q9.leg === RUN.i + 1 && Math.hypot(q9.x - me.x, q9.z - me.z) < 50)) RUN.w.push({ x: me.x, z: me.z, leg: RUN.i + 1, cell: A.cellOf(me.x, me.z) }); DBG.loops++; } else if (!c9) RUN.cells.set(k, { left: null, loop: false }); RUN.ck = k; } }
    for (let i = 0; i < R.flags.length; i++) { const f = R.flags[i]; if (Math.hypot(f.x - me.x, f.z - me.z) > FLAG_R || Math.abs(f.y - me.y) > 2.5) continue;
      if (i === RUN.i) { stamp(); return; } if (i > RUN.i && RUN.wrong !== i) { RUN.wrong = i; DBG.wrong++; A.say(en() ? '🚩 This is flag ' + (i + 1) + '. You are looking for flag ' + (RUN.i + 1) + ' now.' : '🚩 이건 ' + (i + 1) + '번 깃발이에요. 지금은 ' + (RUN.i + 1) + '번을 찾아요.', 3); A.sfx('tick'); } } }
  function stamp() { const R = RUN.R, e = en(); RUN.i++; RUN.leg = 0; RUN.h = 0; RUN.wrong = -1; RUN.cells = new Map(); RUN.ck = ''; DBG.stamp++; A.sfx('ding');
    if (RUN.i >= R.flags.length) { finish(); return; }
    A.banner('🚩 ' + (e ? 'Flag ' + RUN.i + ' stamped! Now flag ' + (RUN.i + 1) : RUN.i + '번 깃발 도장! 이제 ' + (RUN.i + 1) + '번'), 2); setGoal(); chipNow(); }
  function hintTick() { const f = RUN.R.flags[RUN.i], e = en(), me = map.player.pos();
    if (RUN.h < 1 && RUN.leg >= cfg.h1) { RUN.h = 1; DBG.hint++; const m = f.lmk; A.say('💡 ' + (m ? (e ? 'Flag ' + f.n + ' is near the ' + m.nm[1] + '. Find that symbol on the map first.' : f.n + '번 깃발은 ' + m.nm[0] + ' 곁이에요. 지도에서 그 기호를 먼저 찾아요.') : (e ? 'Find cell ' + f.cell + ' on the map first.' : '지도에서 ' + f.cell + ' 칸을 먼저 찾아요.')), 5); }
    else if (RUN.h < 2 && RUN.leg >= cfg.h2) { RUN.h = 2; DBG.hint++; const D = d8(f.x - me.x, f.z - me.z); A.say('🧭 ' + (e ? 'From here, flag ' + f.n + ' is to the ' + D[1] + '.' : f.n + '번 깃발은 지금 자리에서 ' + D[0] + '쪽이에요.'), 5); } }
  function finish() { const run = RUN, c = run.c, s = S(), e = en(), C = COURSES.find(q9 => q9.id === c), prev = s.best[c] || null, t = Math.round(run.t), w = run.w.length;
    s.n[c] = (s.n[c] | 0) + 1; s.last[c] = { t, w, d: day(), j: run.jmp ? 1 : 0 }; let better = false, first = !prev;
    if (!run.jmp) { if (!prev || t < prev.t) { s.best[c] = { t, w, d: day() }; better = !!prev; } if (s.rw[c] !== day()) { s.rw[c] = day(); A.skUp('explore', C.sk, 'xp:chal'); } A.diary(e ? 'Finished the ' + C.t[1] + ' orienteering course.' : '길찾기 시험 ' + C.t[0] + ' 코스를 마쳤어요.'); }
    mark(); A.rec('orient', { k: 'done', c, t, w, j: run.jmp ? 1 : 0 }); RUN = null; A.chip('twn-or', null); CHIP = ''; GOAL = ''; A.comp(false); A.sfx('done');
    ENDP = { run, first, better, prev }; endCard(ENDP); setTimeout(() => { if (!RUN) flagsOff(); }, 400); }
  function endCard(o) { const run = o.run, R = run.R, e = en(), C = COURSES.find(q9 => q9.id === run.c), i9 = COURSES.indexOf(C), N = COURSES[i9 + 1], nOpen = N && build(N.id) && (S().n[run.c] | 0) === 1;
    const cmp = run.jmp ? (e ? 'You moved by shortcut (J) or bus on the way, so this run is not a record.' : '바로 가기(J)나 버스로 옮긴 길이 있어서 이번엔 기록에 넣지 않았어요.') : o.first ? (e ? 'You finished this course for the first time. Your time is in the notebook (🚩).' : '이 코스를 처음 해냈어요. 걸린 시간은 수첩 🚩 칸에 적었어요.') : o.better ? (e ? 'Faster than your best so far.' : '지금까지 내 최고보다 빨랐어요.') : (e ? 'Slower than your best. Look at where you went around in circles.' : '내 최고보다 늦었어요. 어디서 맴돌았는지 지도에서 봐요.');
    const wl = run.w.length ? run.w.slice(0, 4).map(q9 => (e ? 'On the way to flag ' + q9.leg + ', you went round in cell ' + q9.cell + '.' : q9.leg + '번 깃발 가는 길, ' + q9.cell + ' 칸에서 맴돌았어요.')) : [e ? 'You found all five flags without going round in circles.' : '맴돈 곳 없이 깃발 다섯을 찾았어요.'];
    const P = A.openP('<h3>🚩 ' + esc(e ? C.t[1] + ' course finished' : C.t[0] + ' 코스 완주') + '</h3><div style="font-weight:800;margin:2px 0 6px">' + esc(cmp) + '</div>'
      + '<div class="or-end"></div><div class="sm" style="margin:4px 0">' + esc(e ? 'Blue = the way I walked · circles = where I went round' : '파란 줄 = 내가 걸은 길 · 주황 동그라미 = 맴돈 곳') + '</div>'
      + '<div style="margin:4px 0"><b>' + esc(e ? 'Where did I go round?' : '어디서 헤맸나') + '</b><br>' + wl.map(t9 => esc(t9)).join('<br>') + (run.w.length > 4 ? '<br>' + esc(e ? '…and more' : '…그 밖에도 있어요') : '') + '</div>'
      + (nOpen ? '<div style="margin:6px 0">' + esc(e ? 'A new course opened: ' + N.t[1] + '. Its start board: ' : '새 코스가 열렸어요: ' + N.t[0] + '. 출발 판은 ') + esc(boardSay(N.id)) + '</div>' : '')
      + '<div class="row"><button class="sub" data-a="rec">📔 ' + (e ? 'Notebook' : '수첩 기록') + '</button>' + (nOpen ? '<button class="sub" data-a="nx">🗺 ' + (e ? 'To the next start board' : '다음 출발 판으로') + '</button>' : '') + '<button data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'ormap');
    const cv = document.createElement('canvas'); cv.width = 560; cv.height = 380; cv.style.cssText = 'width:min(560px,88vw);height:auto;display:block;margin:0 auto;border-radius:6px'; P.querySelector('.or-end').appendChild(cv);
    try { drawCourse(cv, R, { done: R.flags.length, noLeg: true, trk: (g, PX) => { g.save(); g.strokeStyle = 'rgba(47,111,208,.9)'; g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); for (let k = 0; k < run.tn; k += 2) { const [a, b] = PX(run.trk[k], run.trk[k + 1]); if (k) g.lineTo(a, b); else g.moveTo(a, b); } g.stroke();
      for (const q9 of run.w) { const [a, b] = PX(q9.x, q9.z); g.strokeStyle = '#e07a1a'; g.lineWidth = 3; g.setLineDash([5, 4]); g.beginPath(); g.arc(a, b, 16, 0, 6.2832); g.stroke(); g.setLineDash([]); } g.restore(); } }); } catch (x) { console.warn('[길찾기] 끝 지도', x); }
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') A.closeP(); if (b.dataset.a === 'rec') openRec(); if (b.dataset.a === 'nx' && N) { const B = BOARDS.find(q9 => q9.c === N.id); A.closeP(); if (B) A.guide([B.x, B.z], { icon: '🚩', name: e ? 'start board' : '출발 판' }); } }; return P; }
  const boardSay = c => { const B = BOARDS.find(q9 => q9.c === c); if (!B) return ''; const d = descOf(B.x, B.z, c, null); return d.t[en() ? 1 : 0]; };
  function openMap() { if (!RUN) return false; const R = RUN.R, e = en(), C = COURSES.find(q9 => q9.id === RUN.c);
    const P = A.openP('<h3>🚩 ' + esc(e ? 'Course map — ' + C.t[1] : '시험 지도 — ' + C.t[0]) + '</h3><div class="sm">' + esc(e ? 'This map has no “you are here”. Match the roads and symbols with what you see.' : '이 지도에는 내 자리가 없어요. 눈앞의 길과 기호를 지도와 맞춰 봐요.') + '</div><div class="or-cv"></div>' + cardHtml(R, e)
      + '<div class="row"><button class="sub" data-a="quit">' + (e ? 'Stop the test' : '시험 그만두기') + '</button><button data-a="x">' + (e ? 'Keep going (M)' : '계속 찾기 (M)') + '</button></div>', false, 'ormap');
    P.querySelector('.or-cv').appendChild(mapCanvas(R, { done: RUN.i })); RUN.mapT = 0;
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') A.closeP(); if (b.dataset.a === 'quit') { A.closeP(); stop(e ? '🚩 Test stopped. Start again at the start board.' : '🚩 시험을 멈췄어요. 출발 판에서 다시 시작해요.'); } }; return true; }
  // 수첩 🚩 칸: 코스마다 내 최고 시간 · 맴돈 곳 · 해낸 번(숫자는 여기에만)
  function openRec() { const s = S(), e = en();
    const rows = COURSES.map(C => { const b = s.best[C.id], l = s.last[C.id], n = s.n[C.id] | 0, B = BOARDS.find(q9 => q9.c === C.id); let t;
      if (!B) t = e ? 'No course in this town.' : '이 마을에는 이 코스가 없어요.'; else if (!open9(C.id)) t = e ? 'Opens after the course before it.' : '앞 코스를 마치면 열려요.'; else if (!n) t = (e ? 'Not tried yet. Start board: ' : '아직 안 해 봤어요. 출발 판: ') + boardSay(C.id);
      else t = (b ? (e ? 'My best: ' + fmtSec(b.t, 1) + ', went round ' + b.w + ' time(s)' : '내 최고 ' + fmtSec(b.t) + ' · 맴돈 곳 ' + b.w) : (e ? 'No record yet' : '아직 기록 없음')) + (l ? (e ? ' · last: ' + fmtSec(l.t, 1) + (l.j ? ' (shortcut, not counted)' : '') : ' · 지난번 ' + fmtSec(l.t) + (l.j ? '(바로 가기 · 기록 X)' : '')) : '') + (e ? ' · finished ' + n + ' time(s)' : ' · 해낸 번 ' + n);
      return '<div class="st"><span><b>' + C.ic + ' ' + esc(L(C.t)) + '</b><br><small>' + esc(t) + '</small></span></div>'; }).join('');
    const P = A.openP('<h3>🚩 ' + (e ? 'Orienteering notebook' : '길찾기 기록') + '</h3><div class="sm">' + esc(e ? 'Only you see these times. Try to beat your own best.' : '이 시간은 나만 봐요. 내 최고를 넘어 보는 거예요.') + '</div>' + rows + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'orient');
    P.onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; return P; }

  // ───────── 도전 모드(CHAL-1) ─────────
  const chalOn = () => !!(A.chalSet() && A.ready() && A.on());
  const noLine = () => chalOn() || !!RUN;
  /* 이웃 말 한 줄(칸·방위·랜드마크) — town_ask.js wayLine(일꾼이 길을 알려 줄 때와 같은 말) */
  function sayWay(to) { const me = map.player.pos(), e = en(); if (!to) return ''; let R = null; try { R = A.route([me.x, me.z], to); } catch (x) { R = null; }
    const W = A.wayLine({ me: [me.x, me.z], to, pts: R && R.ok ? R.pts : null, len: R && R.ok ? R.len : undefined, lmk: lmkAll().filter(m => Math.hypot(m.x - to[0], m.z - to[1]) > 12).map(m => ({ k: 'p', nm: m.nm, x: m.x, z: m.z })),   /* 목적지 자신은 랜드마크로 X('도서관 — 도서관 옆') */ cell: (x, z) => A.cellOf(x, z), cellOn: true, dir8: true, en: e });
    return W && W.l ? W.l.filter(Boolean).join(' ') : ''; }
  const STRIP = /\s*(약\s*|about\s*)?\d[\d,.]*\s*(km|m)(?![a-z가-힣])/gi;
  function strip(t) { if (!chalOn() || typeof t !== 'string') return t; return t.replace(STRIP, '').replace(/\s*·\s*(?=·|$)/g, '').replace(/\s*🚶\s*\d+[^·]*|\s*🚲\s*\d+[^·]*/g, '').replace(/(\s*·\s*)+$/, '').trim(); }
  /* 도전 모드로 찾아가 닿음: from0 = 길 안내를 받은 자리(40m 넘게 떨어진 곳만) · 하루 한도 */
  function chalArrive(from0, to) { if (!chalOn() || !from0 || !to || Math.hypot(from0[0] - to[0], from0[1] - to[1]) < 40) return false; const s = S(), d = day(); DBG.chal++; if (s.cd[d]) return false; s.cd[d] = 1; mark(); A.rec('orient', { k: 'chal' }); A.say(en() ? '🏅 Found it without the red line — one more step on the Challenger path' : '🏅 빨간 선 없이 찾아왔어요. 도전가 길로 한 걸음', 3.4); return true; }

  // ───────── 칸 ─────────
  function tick(dt) { if (!RUN || dead) return; const pnl = A.panel(); if (pnl) { RUN.mapT += dt; if (RUN.mapT < 60) { RUN.t += dt; RUN.leg += dt; } } else { RUN.mapT = 0; RUN.t += dt; RUN.leg += dt; }   /* 지도를 읽는 시간도 셈(한 번에 60초까지 — 창을 띄워 두고 자리를 비우면 멈춤) */
    if ((q += dt) < 0.25) return; q = 0; if (!A.on()) { stop(''); return; } if (pnl) return; const t0 = performance.now(); check(); if (RUN) hintTick(); DBG.ms = Math.max(DBG.ms, performance.now() - t0); }
  function sec() { if (dead) return; if ((sq += 1) % 3 === 0) for (const B of BOARDS) { const lb = label(B.c); if (B.h.hot.label !== lb) B.h.hot.label = lb; }
    if (RUN && RUN.d0 !== day()) stop(en() ? '🚩 A new day began, so the test stopped. Start again at the start board.' : '🚩 하루가 지나 시험을 멈췄어요. 출발 판에서 다시 시작해요.');
    const c9 = chalOn(); if (lastChal && !c9 && !RUN) A.reguide(); lastChal = c9; }
  function init() { COURSE = {}; if (!A.on()) return; boards(); }
  function dispose() { dead = true; stop(''); for (const B of BOARDS) { B.h.remove(); if (B.g.parent) B.g.parent.remove(B.g); B.m.geometry.dispose(); if (B.m.material.map) B.m.material.map.dispose(); B.m.material.dispose(); } BOARDS = []; if (FLAGS) { map.remove(FLAGS); FLAGS.dispose(); } if (FGEO) FGEO.dispose(); if (FMAT) FMAT.dispose(); FLAGS = FGEO = FMAT = null; }
  function rebuild() { stop(''); init(); }
  init();
  return { tick, sec, dispose, rebuild, openStart, openMap, openRec, start, stop: () => stop(''), check, seen, chalOn, noLine, sayWay, strip, chalArrive,
    running: () => !!RUN, has: () => COURSES.some(C => (S().n[C.id] | 0) > 0), get goal() { return RUN ? GOAL : ''; },
    course: c => { const R = build(c); return R ? { c, start: R.start.slice(), flags: R.flags.map(f => ({ n: f.n, cell: f.cell, t: f.t.slice(), lmk: f.lmk && { nm: f.lmk.nm.slice() } })) } : null; },
    flagsAt: c => { const R = build(c); return R ? R.flags.map(f => [f.x, f.z]) : null; },   /* 시험 손잡이(봇은 쓰지 않음 — 확인용) */
    cellBox: nm => { const E = A.edges(); for (let i = 0; i < E.xs.length - 1; i++) for (let j = 0; j < E.zs.length - 1; j++) if (A.cellOf((E.xs[i] + E.xs[i + 1]) / 2, (E.zs[j] + E.zs[j + 1]) / 2) === nm) return [E.xs[i], E.zs[j], E.xs[i + 1], E.zs[j + 1]]; return null; },   /* 지도 칸 줄 읽기(봇) */
    lmkList: () => lmkAll().map(m => ({ nm: m.nm[0], x: Math.round(m.x), z: Math.round(m.z) })),
    boards: () => BOARDS.map(B => ({ c: B.c, x: +B.x.toFixed(1), z: +B.z.toFixed(1), label: B.h.hot.label })),
    cfg: o => Object.assign(cfg, o || {}),
    info: () => ({ run: RUN ? { c: RUN.c, i: RUN.i, t: Math.round(RUN.t), w: RUN.w.map(q9 => ({ leg: q9.leg, cell: q9.cell })), jmp: RUN.jmp, tn: RUN.tn / 2, h: RUN.h, flagsVis: !!(FLAGS && FLAGS.visible), count: FLAGS ? FLAGS.count : 0 } : null, save: JSON.parse(JSON.stringify(S())), dbg: { ...DBG, built: { ...DBG.built } }, chal: chalOn(), goal: GOAL, chip: CHIP, end: ENDP ? { first: ENDP.first, better: ENDP.better, w: ENDP.run.w.length, tn: ENDP.run.tn / 2 } : null }) };
}
