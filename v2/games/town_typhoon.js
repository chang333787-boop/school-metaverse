// 🌀 태풍이 온다(TYPH-1 · 성취 네 기둥 첫 증명 판 · 정본 docs/systems/town_achieve.md 표 · 설계 docs/systems/town_typhoon.md)
//   날(k = 오늘 − 예보 날 + 1): 1 예보·소문 → 2~5 이웃 부탁이 몰림(하루에 다 못 함) · 3~5 대피 길 사건 → 6 마지막 날 → 7 태풍 날(안에서 지켜봄) → 8 다음 날 결과 → 함께 고치기
//   네 기둥: 🗓 시간·체력·물건이 모자람(끈·모래주머니 = 행정복지센터 하루 몫 · 무거운 일 = 체력 칸이 모자라면 숨 고르기) · 🧠 들은 말을 사실/생각으로 나누고 본 것만 근거
//     🧗 지름길 비탈은 체력 칸이 모자라면 못 오름 · 🏘 준비한 곳은 멀쩡 · 못 한 곳은 흔적 + 이웃이 기억 + 함께 고치기
//   지킴: 판타지 X · 다침·놀래기 X(사람·동물 늘 무사) · 막대·꾹 X(몸·자리 판단 · 틀리면 시간 비용) · 실명 X(이웃 = 하는 일로 · 임시 몸 = 이름 없는 역할)
//     · 지역 비하 X · 아이콘·% 체크리스트 X · 새 Light X · 지어낸 실제 사실 X(태풍 대비 일반 상식만)
//   렉: 매 프레임 일 0 · 1초 칸 sec · 모습(합친 부품)은 상태가 바뀔 때만 다시 지음
//   사건 수첩 엔진(town_case.js)이 main에 오면 '들은 말'·'대피 길'은 그 틀로 옮김(RUM·path가 그 자리)
import { CASES, CL } from './town_case.js?v=5';   /* CASE-1 사건 수첩 표(대피 길 = CASES.typhoon 한 줄) */
export const TY_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = s => { let a = hashS(s) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const hm = m => { m = Math.round(m); return String(((m / 60) | 0) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const DIRN = [T2('북', 'north'), T2('북동', 'northeast'), T2('동', 'east'), T2('남동', 'southeast'), T2('남', 'south'), T2('남서', 'southwest'), T2('서', 'west'), T2('북서', 'northwest')];
const dirIdx = (dx, dz) => ((Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)) % 8) + 8) % 8;   /* 0 = 북(−z) · 2 = 동(+x) */
const dirVec = i => [Math.sin(i * Math.PI / 4), -Math.cos(i * Math.PI / 4)];
export const TY = { work: [8, 19], hall: [9, 18], rope: 2, sand: 4, steep: 0.3, steepN: 5, low: 16, restPer: 15, wrong: 30 };   /* 일하는 때 · 센터 창구 · 하루 몫 · 지름길 비탈(기울기 30%) 오를 체력 칸 · 강가 낮은 곳(물까지 m) · 모자란 칸마다 쉬는 분 · 틀린 자리 */
// 부탁 갈래: 무엇 · 몇 분 · 끈 · 모래주머니 · 무거운 정도(체력 칸) · 판단
const KIND = {
  boat: { ic: '🚤', t: T2('배 묶기', 'Tie up the boat'), m: 40, rope: 2, sand: 0, heavy: 4, how: 'side' },
  vinyl: { ic: '🌱', t: T2('비닐하우스 둘레 정리하고 끈 조이기', 'Clear around the greenhouse and tighten its straps'), m: 20, rope: 1, sand: 0, heavy: 0, how: 'gather' },
  sign: { ic: '🏷', t: T2('가게 간판 묶기', 'Tie down a shop sign'), m: 25, rope: 1, sand: 0, heavy: 0, how: 'find' },
  sand: { ic: '🧱', t: T2('문 앞에 모래주머니 쌓기', 'Stack sandbags by the door'), m: 40, rope: 0, sand: 4, heavy: 6, how: 'low' },
  home: { ic: '🏠', t: T2('우리 집 화분·빨래 들이기', 'Bring in the pots and laundry at home'), m: 5, rope: 0, sand: 0, heavy: 0, how: 'gather' },
  elder: { ic: '👵', t: T2('어르신께 안전한 대피 길 알려 드리기', 'Tell the elders the safe way to the shelter'), m: 15, rope: 0, sand: 0, heavy: 0, how: 'tell' },
};
// 고치기(결과 날 · 못 한 곳만)
const FIXK = { boat: { m: 30, rope: 0, heavy: 4, t: T2('밀린 배를 같이 물로 밀어 다시 묶기', 'Push the drifted boat back and tie it again') }, vinyl: { m: 20, rope: 1, heavy: 0, t: T2('찢긴 비닐 한 칸 같이 갈아 끼우기', 'Replace the torn greenhouse panel together') },
  sign: { m: 20, rope: 1, heavy: 0, t: T2('기운 간판 같이 바로 세우기', 'Straighten the tilted sign together') }, sand: { m: 25, rope: 0, heavy: 0, t: T2('가게 문턱 흙탕물 같이 닦기', 'Mop up the muddy water at the door together') }, home: { m: 10, rope: 0, heavy: 0, t: T2('쓰러진 화분 세우고 흙 담기', 'Stand the fallen pot up and refill the soil') } };
// 들은 말·근거·까닭 = 사건 수첩 엔진 표 한 줄(town_case.js CASES.typhoon · CL ty_*) — f = 1 사실(예보·안내문·내가 걸어 본 것) · 0 생각(이웃 짐작)
const CR = CASES.typhoon;
const RUM = CR.clues.map(k => ({ id: k.replace(/^ty_/, ''), f: CL[k].f === 'fact' ? 1 : 0, who: CL[k].who, t: CL[k].t, ic: CL[k].ic }));
const CSS = `.twn-p .ty-r{border:2px solid #c9b27a;border-radius:12px;background:#fffdf2;padding:6px 10px;margin:6px 0;line-height:1.45}.twn-p .ty-r.done{opacity:.6}.twn-p .ty-r b{font-size:15px}
.twn-p .ty-ch{display:grid;gap:8px;margin:6px 0}.twn-p .ty-ch button{min-height:46px;font-size:15px;text-align:left}.twn-p .ty-rm{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0}.twn-p .ty-rm button{min-height:38px;padding:2px 10px}
.twn-p .ty-tag{display:inline-block;font-weight:800;border-radius:8px;padding:0 6px;margin-right:4px}.twn-p .ty-tag.f{background:#dff0e2;color:#22603a}.twn-p .ty-tag.t{background:#f3e6d0;color:#7a5a2a}
.twn-p canvas.ty-map{display:block;width:100%;max-width:520px;height:auto;border-radius:8px;margin:4px 0}`;

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · lang() · esc · openP(h, wide, kind) · closeP() · panel() · say(t, s) · sfx(k) · bubble(o, t) · busy() · inb() · inSchool(x, z)
//   places() PLACES · shops() [{ name, door }] · harb() { dock, x, z } | null · workers() WKP · home() 문 자리 | null · gate() 정문 안 [x, z]
//   water(x, z) 강·바다까지 m · sea(x, z) 바다까지 m(물 안 = 음수) · land(x, z) 서 있을 수 있는 땅 · gy(x, z) · cell(x, z) · mapSnip(cv, pts) · route(p) · guideOff()
//   stam() 탐험 체력 { n } · story1() 1막 끝 · season() · setWx(w) · wx() · sleep() · taskEv(ev) · skUp(k, n, src) · heart(w, n, src) · diary(t) · buildParts(fn) · restack()
export function createTyphoon(A) {
  const map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t == null ? '' : t)), esc = t => A.esc(t);
  const G = () => A.GAME, day = () => G().S.day | 0, now = () => G().S.min | 0, mark = () => G().mark();
  const S = () => { const g = G().S; let s = g.typh; if (!s || typeof s !== 'object' || s.v !== TY_V) s = g.typh = { v: TY_V, n: 0, d0: 0, st: '', last: 0, log: [], mem: {} }; if (!Array.isArray(s.log)) s.log = []; if (!s.mem || typeof s.mem !== 'object') s.mem = {}; return s; };
  let dead = false, css = null, VIS = [], HOT = [], VKEY = '', DBG = [], said = {}, PEND = '', pathQ = [];
  const log = t => { DBG.push(t); if (DBG.length > 40) DBG.shift(); };
  const me = () => map.player.pos(), dist = (p) => { const m = me(); return Math.hypot(p[0] - m.x, p[1] - m.z); };
  const K = () => { const s = S(); return s.st ? day() - s.d0 + 1 : 0; };   /* 판 안의 날(1~) · 0 = 판 없음 */
  const storm = d => { const s = S(); return !!s.st && (d == null ? day() : d) === s.d0 + 6; };
  if (!document.getElementById('ty-css')) { css = document.createElement('style'); css.id = 'ty-css'; css.textContent = CSS; document.head.appendChild(css); }

  // ───────── 자리 고르기(판을 시작할 때 한 번 · 저장) — 판에 없는 곳은 그 부탁이 저절로 빠짐 ─────────
  const P = () => A.places() || [];
  const doorOf = p => (p.door ? [p.door[0], p.door[1]] : [p.x, p.z]);
  const findP = re => P().filter(p => p && p.name && re.test(p.name) && p.kind !== 'area');
  const nearW = (at, r, re) => { let b = null, bd = r; for (const w of A.workers() || []) { if (w.gate || (re && !re.test(String(w.k)))) continue; const d = Math.hypot(w.x - at[0], w.z - at[1]); if (d < bd) { bd = d; b = w; } } return b; };
  const landNear = (x, z, R9) => { if (A.land(x, z)) return [x, z]; for (let r = 0.8; r <= (R9 || 4); r += 0.8) for (let a = 0; a < 12; a++) { const xx = x + Math.cos(a * 0.5236) * r, zz = z + Math.sin(a * 0.5236) * r; if (A.land(xx, zz)) return [xx, zz]; } return null; };
  const outOf = (door, ctr) => { const ox = door[0] - ctr[0], oz = door[1] - ctr[1], l = Math.hypot(ox, oz) || 1; return [ox / l, oz / l]; };
  const r1 = a => [+(+a[0]).toFixed(2), +(+a[1]).toFixed(2)];
  function plan(seed) { const R9 = rng('typh:' + seed), out = [], gate = A.gate();
    const elderP = findP(/노인정|경로당|마을회관/)[0] || null, hallL = findP(/행정복지/), elderAt = elderP ? doorOf(elderP) : null;
    const hall = hallL.length ? hallL.slice().sort((a, b) => (elderAt ? Math.hypot(doorOf(a)[0] - elderAt[0], doorOf(a)[1] - elderAt[1]) - Math.hypot(doorOf(b)[0] - elderAt[0], doorOf(b)[1] - elderAt[1]) : 0))[0] : null;
    // 바람·배: 배 타는 곳(없으면 바닷가 장소) 둘레에서 물 한 곳(배) + 땅 말뚝 둘 · 바람은 한 말뚝 쪽에서 오게(묶을 쪽이 분명하게)
    let wind = [3, 4, 5][(R9() * 3) | 0], boat = null; const H = A.harb && A.harb(), D0 = [];
    if (H && H.dock) D0.push(H.dock); for (const q of findP(/선착장|부두|항구|포구/)) D0.push(doorOf(q));
    for (const d of D0) { if (boat) break; let bw = null, bd = 1e9; for (let r = 3; r <= 16; r += 1.5) for (let a = 0; a < 16; a++) { const x = d[0] + Math.cos(a * 0.3927) * r, z = d[1] + Math.sin(a * 0.3927) * r; if (A.sea(x, z) < -1.6 && r < bd) { bd = r; bw = [x, z]; } } if (!bw) continue;
      const LN = []; for (let r = 2; r <= 9; r += 1) for (let a = 0; a < 20; a++) { const x = bw[0] + Math.cos(a * 0.3142) * r, z = bw[1] + Math.sin(a * 0.3142) * r; if (A.land(x, z)) LN.push([x, z]); } let pa = null, pb = null, best = 0;
      for (let i = 0; i < LN.length; i++) for (let j = i + 1; j < LN.length; j++) { const dd = Math.hypot(LN[i][0] - LN[j][0], LN[i][1] - LN[j][1]); if (dd > best && dd < 9) { best = dd; pa = LN[i]; pb = LN[j]; } }
      if (!pa || best < 3) continue;
      if (R9() < 0.5) { const t = pa; pa = pb; pb = t; } const mx = (pa[0] + pb[0]) / 2, mz = (pa[1] + pb[1]) / 2; wind = dirIdx(pa[0] - mx, pa[1] - mz);   /* pa = 바람이 오는 쪽 말뚝 */
      const w = nearW(d, 90, /fish|clam|oyster|seaweed|boat|market|sea/); boat = { k: 'boat', d: 2, at: r1(w ? [w.x, w.z] : landNear(mx, mz, 4) || pa), wi: w ? w.i ?? null : null, who: T2('어민', 'Fisher'), body: !w, site: r1(bw), ry: Math.atan2(pb[0] - pa[0], pb[1] - pa[1]), pa: r1(pa), pb: r1(pb), nm: T2('선착장', 'the jetty') }; }
    if (boat) out.push(boat);
    // 간판: 가게 문이 모인 곳 가운데에 가까운 둘(모래주머니 쌓는 가게는 빼고)
    const sandNm = (() => { let b = null, bw = 1e9; for (const q of (A.shops() || []).filter(q => q && q.door)) { const w = A.water(q.door[0], q.door[1]); if (w < bw) { bw = w; b = q; } } const el = findP(/노인정|경로당|마을회관/)[0]; if (el && A.water(doorOf(el)[0], doorOf(el)[1]) < bw) return ''; return b ? b.name : ''; })();
    const SH = (A.shops() || []).filter(q => q && q.door && !A.inSchool(q.door[0], q.door[1]));
    if (SH.length) { const mx = SH.reduce((a, q) => a + q.door[0], 0) / SH.length, mz = SH.reduce((a, q) => a + q.door[1], 0) / SH.length, srt = SH.slice().sort((a, b) => Math.hypot(a.door[0] - mx, a.door[1] - mz) - Math.hypot(b.door[0] - mx, b.door[1] - mz)), took = [];
      for (const q of srt) { if (took.length >= 2) break; if (q.name === sandNm) continue; if (took.some(t => t.name === q.name || Math.hypot(t.door[0] - q.door[0], t.door[1] - q.door[1]) < 10)) continue; const st = landNear(q.door[0], q.door[1], 3); if (st) took.push({ ...q, st }); }
      took.forEach((q, i) => { const nb = SH.filter(o => o.name !== q.name).sort((a, b) => Math.hypot(a.door[0] - q.door[0], a.door[1] - q.door[1]) - Math.hypot(b.door[0] - q.door[0], b.door[1] - q.door[1]))[0];
        out.push({ k: 'sign', d: i ? 3 : 2, at: r1(q.st), body: true, who: T2('가게 주인', 'Shopkeeper'), shop: q.name, site: r1(q.st), nb: nb ? nb.name : '', nm: T2(q.name, q.name), dir: dirIdx(q.door[0] - gate[0], q.door[1] - gate[1]) }); }); }
    // 모래주머니: 강에 가장 가까운 문(노인정·센터·가게) — 문 앞·두 옆 가운데 강 쪽이 맞음
    { const C9 = []; if (elderP) C9.push({ nm: elderP.name, door: doorOf(elderP), c: [elderP.x, elderP.z], ow: 'elder' }); for (const q of SH) C9.push({ nm: q.name, door: q.door, c: q.c || null, ow: 'shop' });
      let b = null, bw = 1e9; for (const q of C9) { const w = A.water(q.door[0], q.door[1]); if (w < bw) { bw = w; b = q; } }
      if (b) { const c = b.c && Number.isFinite(b.c[0]) && Math.hypot(b.c[0] - b.door[0], b.c[1] - b.door[1]) > 0.5 ? b.c : [b.door[0] - 0.01, b.door[1] - 1], [ox, oz] = outOf(b.door, c), sx = -oz, sz = ox, S9 = [];
        for (const [a, s9] of [[1.6, 0], [0.8, 2.8], [0.8, -2.8]]) { const p = landNear(b.door[0] + ox * a + sx * s9, b.door[1] + oz * a + sz * s9, 1.6); if (p && !S9.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1.6)) S9.push(p); }
        if (S9.length >= 2) { const ws = S9.map(p => A.water(p[0], p[1])), gs = S9.map(p => A.gy(p[0], p[1])), rng9 = Math.max(...ws) - Math.min(...ws), ok = rng9 >= 1 ? ws.indexOf(Math.min(...ws)) : gs.indexOf(Math.min(...gs));
          out.push({ k: 'sand', d: 2, at: r1(landNear(b.door[0] + ox * 2.2 + sx * 1.2, b.door[1] + oz * 2.2 + sz * 1.2, 3) || S9[0]), body: true, who: b.ow === 'elder' ? T2('노인정 어르신', 'An elder at the senior centre') : T2('가게 주인', 'Shopkeeper'), shop: b.nm, site: r1(b.door), spots: S9.map(r1), ok, by: rng9 >= 1 ? 'water' : 'low', nm: T2(b.nm, b.nm) }); } } }
    // 비닐하우스: 둘레에 날아갈 것 넷
    { const g = findP(/비닐하우스|온실/)[0]; if (g) { const at = doorOf(g), c = [g.x, g.z], IT = [], R2 = rng('typh:gh:' + seed);
        for (let t = 0; t < 80 && IT.length < 4; t++) { const a = R2() * 6.2832, r = 7 + R2() * 9, x = c[0] + Math.cos(a) * r, z = c[1] + Math.sin(a) * r; if (!A.land(x, z) || IT.some(q => Math.hypot(q[0] - x, q[1] - z) < 4)) continue; IT.push(r1([x, z])); }
        const w = nearW(at, 70, /straw|farm|cabbage|potato|green/); if (IT.length >= 3) out.push({ k: 'vinyl', d: 3, at: r1(w ? [w.x, w.z] : landNear(at[0], at[1], 4) || at), wi: w ? w.i ?? null : null, body: !w, who: T2('딸기 농부', 'Strawberry farmer'), site: r1(landNear(at[0], at[1], 4) || at), items: IT, got: [], nm: T2(g.name, g.name) }); } }
    // 우리 집: 화분 둘 · 빨래
    { const h = A.home(); if (h) { const IT = []; for (const [a, r] of [[0.6, 2.2], [2.2, 2.6], [-1.0, 3.0], [3.4, 3.2], [-2.4, 2.8]]) { if (IT.length >= 3) break; const p = landNear(h[0] + Math.cos(a) * r, h[1] + Math.sin(a) * r, 1.2); if (p && !IT.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1.2)) IT.push(r1(p)); }
        if (IT.length >= 2) out.push({ k: 'home', d: 4, at: r1(h), body: false, who: T2('우리 집', 'Our house'), site: r1(h), items: IT, got: [], nm: T2('우리 집', 'our house') }); } }
    // 어르신 대피 길(사건)
    let shelter = null; { const C9 = [{ nm: T2('우리 학교 체육관', 'our school gym'), at: A.gate(), school: 1 }]; for (const p of findP(/학교/)) if (!A.inSchool(p.x, p.z)) C9.push({ nm: T2(p.name, p.name), at: doorOf(p) });
      let b = null, bs = -1e9; for (const q of C9) { const s9 = A.gy(q.at[0], q.at[1]) + (A.water(q.at[0], q.at[1]) > 40 ? 0 : -50) + (q.school ? 0.5 : 0); if (s9 > bs) { bs = s9; b = q; } } shelter = b ? { nm: b.nm, at: r1(b.at), school: !!b.school } : null; }
    if (elderAt && shelter) out.push({ k: 'elder', d: 3, at: r1(landNear(elderAt[0] + 1.6, elderAt[1] + 1.6, 3) || elderAt), body: true, who: T2('노인정 어르신', 'An elder at the senior centre'), site: r1(elderAt), nm: T2(elderP.name, elderP.name) });
    out.forEach((q, i) => { q.id = q.k + i; q.st = ''; q.mis = 0; q.seen = 0; });
    const hd = hall ? doorOf(hall) : null, hc = hall ? [hall.x, hall.z] : null; let desk = null;
    if (hd) { const [ox, oz] = outOf(hd, hc && Math.hypot(hc[0] - hd[0], hc[1] - hd[1]) > 0.5 ? hc : [hd[0], hd[1] - 1]), sx = -oz, sz = ox; for (const s9 of [-3.8, 3.8, -4.8, 4.8]) { const p = landNear(hd[0] + ox * 1.4 + sx * s9, hd[1] + oz * 1.4 + sz * s9, 1); if (p) { desk = r1(p); break; } } if (!desk) desk = r1(landNear(hd[0] + ox * 2, hd[1] + oz * 2, 4) || hd); }
    return { reqs: out, wind, shelter, desk, hall: hall ? hall.name : '', elder: elderAt ? r1(elderAt) : null }; }

  // ───────── 판 시작·날 ─────────
  function start(why) { const s = S(), d = day(), p = plan(d + ':' + (s.n | 0) + ':' + (G().S.v || 0)); s.n = (s.n | 0) + 1; s.d0 = d; s.st = 'on'; s.wind = p.wind; s.shelter = p.shelter; s.desk = p.desk; s.hallNm = p.hall; s.reqs = p.reqs; s.mat = { rope: 0, sand: 0, d: 0, nr: 0, ns: 0 }; s.rum = []; s.path = { st: '', ok: 0, cells: [], tries: 0, told: 0 }; s.res = null; s.fix = []; s.said = {}; s.fcSeen = 0; mark(); VKEY = ''; log('start ' + d + ' ' + why + ' reqs ' + p.reqs.map(q => q.k).join(',')); return info(); }
  const seasonOk = () => ['now', 'summer', 'autumn'].includes(A.season());
  function want() { const s = S(), d = day(); if (s.st || window.SM_PROMO || now() > 11 * 60 || (A.other && A.other())) return false;   /* WXEV-1 폭염·폭설 판 동안 = 태풍 시작 X */ if (!seasonOk()) return false;
    if (!s.n) return A.story1() || d >= 7; return s.last && d - s.last >= 21 && hashS('typh:again:' + d) % 5 === 0; }
  function heard(id) { const s = S(); if (!s.st || s.rum.some(r => r.id === id)) return false; const r = RUM.find(q => q.id === id); if (!r) return false; s.rum.push({ id, d: day(), s: null }); mark(); return true; }
  function onDay() { if (dead || !A.on()) return; const s = S(); said = {};
    if (!s.st && want()) start('auto');
    if (!s.st) return; const k = K();
    if (k === 7) { A.setWx('rain'); s.said.k7 = 0; mark(); }
    if (k === 8 && !s.res) result();
    if (k > 13 || (k > 8 && s.res && (s.fix || []).every(f => f.st === 'done'))) finish();
    VKEY = ''; }
  function finish() { const s = S(); if (!s.st) return; s.log.unshift({ n: s.n, d0: s.d0, ok: (s.reqs || []).filter(q => q.st === 'done').map(q => q.k), miss: (s.reqs || []).filter(q => q.st !== 'done').map(q => q.k), fixed: (s.fix || []).filter(f => f.st === 'done').length }); s.log.length = Math.min(s.log.length, 6); s.st = ''; s.last = day(); mark(); clearVis(); log('finish ' + day()); }

  // ───────── 시간·물건·체력 ─────────
  const openReq = () => (S().reqs || []).filter(q => q.d <= K() && q.st !== 'done' && K() <= 6);
  const restOf = heavy => { const n = (A.stam() && A.stam().n) || 3; return heavy > 0 ? Math.max(0, heavy - n) * TY.restPer : 0; };
  function spend(m, why) { const t = now() + m; if (t > TY.work[1] * 60) return false; G().waitMin(t); A.sfx('tick'); A.say('⏳ ' + (en() ? m + ' minutes passed' : m + '분이 지났어요') + (why ? ' — ' + L(why) : ''), 2.6); return true; }
  const late = m => now() < TY.work[0] * 60 || now() + m > TY.work[1] * 60;
  const lateMsg = () => A.say(now() < TY.work[0] * 60 ? (en() ? '🌙 Too early — neighbours start work at 08:00' : '🌙 아직 일러요. 이웃들은 08:00부터 일해요') : (en() ? '🌙 It is getting late — let’s do it tomorrow before the typhoon' : '🌙 날이 저물었어요. 태풍 오기 전에 내일 해요'), 3);
  function needLine(q) { const k = KIND[q.k], a = []; if (k.rope) a.push(en() ? k.rope + ' rope' : '끈 ' + k.rope + '묶음'); if (k.sand) a.push(en() ? k.sand + ' sandbags' : '모래주머니 ' + k.sand + '개'); return a.join(', '); }
  function hasMat(q) { const s = S(), k = KIND[q.k]; return s.mat.rope >= k.rope && s.mat.sand >= k.sand; }
  // 하루 셈(시험·수첩): 남은 일 분(쉬는 분 포함) · 오늘 남은 일하는 분 · 끈 모자람
  function budget() { const s = S(), L9 = openReq(), left = Math.max(0, TY.work[1] * 60 - Math.max(now(), TY.work[0] * 60)), need = L9.reduce((a, q) => a + KIND[q.k].m + restOf(KIND[q.k].heavy) + (q.k === 'vinyl' || q.k === 'home' ? (q.items.length - q.got.length) * 5 : 0), 0);
    const ropeNeed = L9.reduce((a, q) => a + KIND[q.k].rope, 0), sandNeed = L9.reduce((a, q) => a + KIND[q.k].sand, 0), today = s.mat.d === day(), ropeGet = s.mat.rope + (today ? TY.rope - s.mat.nr : TY.rope), sandGet = s.mat.sand + (today ? TY.sand - s.mat.ns : TY.sand);
    return { n: L9.length, need, left, ropeNeed, ropeGet, sandNeed, sandGet, fits: need <= left && ropeNeed <= ropeGet && sandNeed <= sandGet }; }

  // ───────── 모습(합친 부품) · E 자리 ─────────
  function clearVis() { for (const g of VIS) { map.remove(g); g.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); } VIS = []; for (const h of HOT) h.remove(); HOT = []; VKEY = ''; }
  const add = (g, x, z, ry, y) => { g.position.set(x, y == null ? A.gy(x, z) : y, z); g.rotation.y = ry || 0; g.userData.fx = 1; map.add(g); g.updateMatrixWorld(true); VIS.push(g); return g; };
  const hot = (x, z, label, use, r) => { const h = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: r || 2.0, label, use }); HOT.push(h); return h; };
  function bodyParts(elder) { return A.buildParts(put => { const pants = elder ? 0x5a5048 : 0x33456b, top = elder ? 0x8a6a9a : 0x5f8f6a, hair = elder ? 0xd8d4cc : 0x3a2a1e;
    for (const sg of [-1, 1]) put('b', sg * 0.09, 0, 0, 0.12, 0.78, 0.12, pants); put('c', 0, 0.78, 0, 0.18, 0.55, 0, top); for (const sg of [-1, 1]) put('b', sg * 0.23, 0.84, 0.02, 0.08, 0.46, 0.08, top);
    put('s', 0, 1.48, 0, 0.16, 1, 0, 0xf2c9a0); put('s', 0, 1.53, -0.01, 0.17, 0.75, 0, hair); if (elder) put('b', 0.3, 0, 0.12, 0.04, 0.9, 0.04, 0x6b5238); }); }   /* 이름 없는 역할(어르신 = 지팡이) */
  const BOATC = { hull: 0xf4f1ea, band: 0x2f6fd0, deck: 0xb08a5e };
  function boatParts(tied) { return A.buildParts(put => { put('b', 0, -0.35, 0, 1.6, 0.7, 3.4, BOATC.hull); put('b', 0, 0.3, 0, 1.64, 0.14, 3.44, BOATC.band); put('b', 0, 0.38, 0, 1.44, 0.04, 3.2, BOATC.deck); put('b', 0, 0.42, -0.4, 0.9, 0.7, 0.9, 0xe8e6df); put('b', 0, 1.12, -0.4, 1.04, 0.08, 1.04, BOATC.band);
    if (tied) { put('b', 0.55, 0.45, 1.25, 0.06, 0.12, 0.06, 0x8a5a2a); put('b', -0.55, 0.45, 1.25, 0.06, 0.12, 0.06, 0x8a5a2a); } }); }
  const post = () => A.buildParts(put => { put('c', 0, 0, 0, 0.14, 0.75, 0, 0x6b5238); put('c', 0, 0.75, 0, 0.17, 0.08, 0, 0x4a3a28); });
  const rope = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return add(A.buildParts(put => put('b', 0, 0, 0, 0.05, 0.05, l, 0xe8d29a)), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.atan2(dx, dz), Math.max(A.gy(a[0], a[1]), A.gy(b[0], b[1])) + 0.62); };
  const ITEM = [0xb98a55, 0x4a8fd0, 0xe8e6df, 0x3fa060];
  const itemParts = i => A.buildParts(put => { if (i % 4 === 0) put('b', 0, 0, 0, 0.5, 0.4, 0.4, ITEM[0]); else if (i % 4 === 1) put('c', 0, 0, 0, 0.18, 0.34, 0, ITEM[1]); else if (i % 4 === 2) put('b', 0, 0, 0, 0.7, 0.05, 0.5, ITEM[2]); else { put('b', 0, 0.38, 0, 0.42, 0.05, 0.42, ITEM[3]); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put('b', a * 0.17, 0, b * 0.17, 0.05, 0.38, 0.05, ITEM[3]); } });
  const homeItem = i => A.buildParts(put => { if (i === 2) { put('b', -0.5, 0, 0, 0.05, 1.1, 0.05, 0x9aa0a6); put('b', 0.5, 0, 0, 0.05, 1.1, 0.05, 0x9aa0a6); put('b', 0, 1.06, 0, 1.06, 0.04, 0.05, 0x9aa0a6); put('b', -0.2, 0.62, 0, 0.32, 0.42, 0.03, 0xf2c94c); put('b', 0.22, 0.6, 0, 0.3, 0.44, 0.03, 0x7fb8e6); } else { put('c', 0, 0, 0, 0.2, 0.32, 0, 0xc0683a); put('s', 0, 0.42, 0, 0.2, 0.9, 0, 0x4f9a52); } });
  const sandParts = () => A.buildParts(put => { for (let i = 0; i < 4; i++) put('b', (i % 2) * 0.55 - 0.27 + ((i >> 1) ? 0.27 : 0), (i >> 1) * 0.26, 0, 0.52, 0.25, 0.34, 0xc9b48a); });
  const signTilt = () => A.buildParts(put => { put('b', 0, 0, 0, 0.06, 2.4, 0.06, 0x6a6e73); put('b', 0.55, 2.1, 0, 1.3, 0.55, 0.06, 0xd8423a, 0, 0, 0.45); });
  const tornParts = () => A.buildParts(put => { put('b', 0, 0.02, 0, 1.2, 0.03, 0.8, 0xeef4ee, 0, 0.3); put('b', 0.5, 0.05, 0.3, 0.5, 0.03, 0.3, 0xdfe8df, 0, -0.5); });
  const mudParts = () => A.buildParts(put => { put('b', 0, 0.03, 0, 2.2, 0.02, 1.6, 0x7a6248); put('b', 0.4, 0.04, 0.2, 1.0, 0.02, 0.7, 0x6a5440); });
  const potDown = () => A.buildParts(put => { put('c', 0, 0.2, 0, 0.2, 0.32, 0, 0xc0683a, 0, 0, 1.5); put('b', 0.4, 0.02, 0, 0.5, 0.04, 0.4, 0x6a5440); });
  const deskParts = () => A.buildParts(put => { for (const sx of [-0.45, 0.45]) put('b', sx, 0, 0, 0.06, 0.7, 0.5, 0x8a6a4a); put('b', 0, 0.7, 0, 1.0, 0.05, 0.6, 0xd9c7a5); for (let i = 0; i < 3; i++) put('b', -0.3 + i * 0.3, 0.75, -0.08, 0.26, 0.18, 0.22, 0xc9b48a); put('c', 0.32, 0.75, 0.16, 0.1, 0.12, 0, 0xe8d29a); });

  function sync() { if (!A.on()) return; const s = S(), k = K(), key = s.st ? [s.n, k, A.lang(), (s.reqs || []).map(q => q.st + (q.got ? q.got.length : '') + q.seen).join(''), s.path && s.path.ok, s.res ? 1 : 0, (s.fix || []).map(f => f.st).join(''), s.mat && s.mat.d === day() ? s.mat.nr + ':' + s.mat.ns : ''].join('|') : '';
    if (key === VKEY) return; clearVis(); VKEY = key; if (!s.st) return;
    if (s.desk && k <= 6) { const d = s.desk; add(deskParts(), d[0], d[1], 0); hot(d[0], d[1] + 0.9, '🧰 ' + (en() ? 'Typhoon supplies (ropes, sandbags)' : '태풍 대비 물품 받기(끈·모래주머니)'), () => deskUse(), 2.2); }
    for (const q of s.reqs || []) buildReq(q, k);
    if (s.res) for (const f of s.fix || []) buildFix(f);
    log('sync ' + key + ' vis ' + VIS.length + ' hot ' + HOT.length); }
  function buildReq(q, k) { const pre = k <= 6, shown = q.d <= k, done = q.st === 'done', miss = !!S().res && !done;
    if (q.k === 'boat') { const sp = q.site, y = A.seaY ? A.seaY() - 0.05 : A.gy(sp[0], sp[1]); const f = (S().fix || []).find(o => o.id === q.id), drift = miss && !(f && f.st === 'done');
      if (!drift) add(boatParts(done), sp[0], sp[1], q.ry, y); else { const p = landNear(sp[0] + (q.pa[0] - sp[0]) * 0.5, sp[1] + (q.pa[1] - sp[1]) * 0.5, 4) || q.pb; const g = add(boatParts(false), p[0], p[1], q.ry + 0.6); g.rotation.z = 0.12; g.updateMatrixWorld(true); }
      add(post(), q.pa[0], q.pa[1], 0); add(post(), q.pb[0], q.pb[1], 0); if (done) rope(q.pa, sp); }
    if (q.k === 'vinyl' && pre && shown && !done) q.items.forEach((p, i) => { if (q.got.includes(i)) return; add(itemParts(i), p[0], p[1], i * 0.7); if (q.st) hot(p[0], p[1], '📦 ' + (en() ? 'Put it inside the greenhouse' : '하우스 안으로 들이기'), () => gather(q, i), 1.6); });
    if (q.k === 'home' && pre && shown && !done) q.items.forEach((p, i) => { if (q.got.includes(i)) return; add(homeItem(i === q.items.length - 1 && q.items.length >= 3 ? 2 : 0), p[0], p[1], 0); if (q.st) hot(p[0], p[1], (i === 2 ? '👕 ' : '🌿 ') + (en() ? (i === 2 ? 'Bring in the laundry' : 'Bring in the pot') : (i === 2 ? '빨래 걷어 들이기' : '화분 들이기')), () => gather(q, i), 1.5); });
    if (q.k === 'sand' && done) add(sandParts(), q.spots[q.ok][0], q.spots[q.ok][1], 0);
    // 부탁하는 사람(임시 몸 = 이름 없는 역할 · 일꾼이 있으면 그 몸) · 말 걸기
    if (pre && shown && !done && q.k !== 'home') { if (q.body) add(bodyParts(q.k === 'elder' || /어르신/.test(q.who[0])), q.at[0], q.at[1], Math.atan2(me().x - q.at[0], me().z - q.at[1]));
      hot(q.at[0], q.at[1], (q.st ? '🌀 ' : '🙋 ') + L(q.who) + (en() ? ' — ' : ' — ') + (q.st ? L(KIND[q.k].t) : (en() ? 'Hear the request' : '부탁 듣기')), () => talk(q), 2.4);
      if (q.st) { if (q.k === 'boat') for (const [p, w] of [[q.pa, 0], [q.pb, 1]]) hot(p[0], p[1], '🧵 ' + (en() ? 'Tie the rope on this side' : '이쪽 말뚝에 밧줄 묶기'), () => tieBoat(q, w), 1.4);
        if (q.k === 'sand') q.spots.forEach((p, i) => hot(p[0], p[1], '🧱 ' + (en() ? 'Stack sandbags here' : '여기에 모래주머니 쌓기'), () => stackSand(q, i), 1.3));
        if (q.k === 'vinyl') hot(q.site[0], q.site[1], '🧵 ' + (en() ? 'Tighten the greenhouse straps' : '비닐하우스 끈 조이기'), () => tieVinyl(q), 2.0);
        if (q.k === 'sign') hot(q.site[0] + 0.01, q.site[1] + 0.01, '🏷 ' + (en() ? 'Tie down the sign' : '간판 묶기'), () => tieSign(q), 1.6);
        if (q.k === 'elder' && !S().path.ok) hot(q.site[0], q.site[1], '🧭 ' + (en() ? 'Walk the way to the shelter to check it' : '대피소까지 길 걸어서 확인하기'), () => pathStart(q), 2.0); } }
    if (q.k === 'home' && pre && shown && !done && !q.st) hot(q.at[0], q.at[1], '🌀 ' + (en() ? 'Get the house ready for the typhoon' : '우리 집 태풍 준비'), () => talk(q), 2.4); }
  function buildFix(f) { if (f.st === 'done' && f.k !== 'boat') return; const p = f.at;
    if (f.st !== 'done') { if (f.k === 'sign') add(signTilt(), p[0], p[1], 0.3); if (f.k === 'vinyl') add(tornParts(), p[0], p[1], 0.4); if (f.k === 'sand') add(mudParts(), p[0], p[1], 0); if (f.k === 'home') add(potDown(), p[0], p[1], 0);
      hot(p[0], p[1], '🔧 ' + L(FIXK[f.k].t), () => fixUse(f), 2.0); } }

  // ───────── 부탁 듣기 · 몸·자리 판단 ─────────
  const wname = () => L(DIRN[S().wind | 0]);
  function where(q) { const e = en(), c = A.cell(q.site[0], q.site[1]), g = A.gate();
    if (q.k === 'sign') return e ? 'The ' + q.shop + ' shop in ' + c + (q.nb ? ', near ' + q.nb : '') + ' — ' + L(DIRN[q.dir]) + ' of the school gate' : c + ' 칸 「' + q.shop + '」' + (q.nb ? '(「' + q.nb + '」 근처)' : '') + ' — 학교 정문에서 ' + L(DIRN[q.dir]) + '쪽';
    const dd = L(DIRN[dirIdx(q.site[0] - g[0], q.site[1] - g[1])]); return e ? L(q.nm) + ' in ' + c + ' — ' + dd + ' of the school gate' : c + ' 칸 ' + L(q.nm) + ' — 학교 정문에서 ' + dd + '쪽'; }
  function askLine(q) { const e = en(), w = wname();
    if (q.k === 'boat') return e ? '“The typhoon will push our boat. Could you help tie it to a post? Two ropes. Think about which side the wind comes from.”' : '"태풍 바람이 배를 밀 거야. 말뚝에 밧줄로 묶는 것 좀 도와줄래? 끈 두 묶음이 들어. 바람이 어느 쪽에서 오는지 생각해 봐."';
    if (q.k === 'vinyl') return e ? '“Strong wind picks things up. There are four loose things around the greenhouse — please find them and put them inside, then tighten the straps.”' : '"센 바람은 물건을 날려. 하우스 둘레에 날아갈 만한 것이 넷 있어. 찾아서 안에 들여놓고, 끈을 조여 줄래?"';
    if (q.k === 'sign') return e ? '“Our sign might shake loose. Bring one rope and tie it down with me?”' : '"우리 가게 간판이 흔들릴까 걱정이야. 끈 한 묶음 가져와서 같이 묶어 줄래?"';
    if (q.k === 'sand') return e ? '“If the river overflows, water may come to the door. Four sandbags would help — but on which side?”' : '"강물이 넘치면 문까지 물이 올 수 있어. 모래주머니 넷을 쌓아 줄래? 어느 쪽에 쌓을지가 중요해."';
    if (q.k === 'home') return e ? 'Pots and laundry outside can blow away. Bring them in before the typhoon.' : '바깥에 둔 화분과 빨래는 바람에 날아갈 수 있어요. 태풍 오기 전에 들여놓아요.';
    if (q.k === 'elder') return e ? '“When the typhoon comes we must go to the shelter at ' + L(S().shelter.nm) + '. Which way is safe for us? Please walk it yourself and tell us.”' : '"태풍이 오면 우리 노인정 사람들은 ' + L(S().shelter.nm) + ' 대피소로 가야 해. 어느 길이 안전한지 네가 직접 걸어 보고 알려 주겠니?"';
    void w; return ''; }
  function talk(q) { if (A.panel() || A.busy()) return; if (q.k === 'elder' && S().path.ok && q.st !== 'done') { tellElder(q); return; } const e = en(), k = KIND[q.k], first = !q.st; if (first) { q.st = 'heard'; q.seen = day(); mark(); VKEY = ''; log('heard ' + q.id); }
    if (q.wi != null) { const w = (A.workers() || []).find(o => o.i === q.wi); if (w) A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, L(T2('태풍 오기 전에 부탁해', 'Before the typhoon, please'))); }
    const rest = restOf(k.heavy), nd = needLine(q);
    const h = '<h3>' + k.ic + ' ' + esc(L(k.t)) + '</h3><div class="pc-tx">' + esc(L(q.who)) + ': ' + esc(askLine(q)) + '</div>'
      + (nd ? '<div class="sm">' + esc((e ? 'Needs: ' : '필요한 것: ') + nd + (e ? ' (from the community centre)' : ' — 행정복지센터에서 받아요') + '. ' + (e ? 'You have ' : '지금 가진 것: ') + matText()) + '</div>' : '')
      + '<div class="sm">' + esc((e ? 'Takes about ' : '걸리는 때: 어림 ') + (k.m + (q.k === 'vinyl' || q.k === 'home' ? q.items.length * 5 : 0)) + (e ? ' min' : '분') + (rest ? (e ? ' + ' + rest + ' min catching your breath (heavy work)' : ' + 무거워서 숨 고르기 ' + rest + '분') : '')) + '</div>'
      + (q.k === 'boat' ? '<div class="sm">' + esc(e ? 'Hint: the forecast and the wind flags tell you where the wind comes from.' : '힌트: 예보와 풍향 깃발을 보면 바람이 어느 쪽에서 오는지 알 수 있어요.') + '</div>' : '')
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'OK' : '알았어요') + '</button><button class="sub" data-a="nb">📒 ' + (e ? 'Typhoon notebook' : '태풍 수첩') + '</button></div>';
    const W = A.openP(h, false, 'typreq'); W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'nb') open(); }; }
  const matText = () => { const m = S().mat; return en() ? m.rope + ' rope, ' + m.sand + ' sandbags' : '끈 ' + m.rope + '묶음, 모래주머니 ' + m.sand + '개'; };
  function startJob(q) { const k = KIND[q.k]; if (K() > 6) return false; if (late(k.m)) { lateMsg(); return false; } if (!hasMat(q)) { A.say('🧰 ' + (en() ? 'Not enough supplies: ' + needLine(q) + '. Get them at the community centre (09:00–18:00).' : needLine(q) + '이 있어야 해요. 행정복지센터(09:00~18:00)에서 받아요.'), 3.4); return false; } return true; }
  function jobDone(q, extraWhy) { const s = S(), k = KIND[q.k], rest = restOf(k.heavy); s.mat.rope -= k.rope; s.mat.sand -= k.sand; q.st = 'done'; q.dd = day(); mark();
    if (rest) spend(k.m + rest, T2('무거워서 중간에 숨을 골랐어요(체력 칸이 늘면 덜 쉬어요)', 'it was heavy, so you stopped to catch your breath (more stamina = less rest)')); else spend(k.m, extraWhy || null);
    A.sfx('ding'); A.skUp('work', 2, 'case:typhoon'); A.taskEv('typh'); if (q.wi != null) { const w = (A.workers() || []).find(o => o.i === q.wi); if (w) { A.heart(w, 1, 'case:typhoon'); A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, L(T2('고마워, 이제 마음이 놓여', 'Thank you — that’s a relief'))); } }
    VKEY = ''; log('done ' + q.id + ' rest ' + rest); }
  function wrong(q, why) { q.mis = (q.mis | 0) + 1; mark(); A.sfx('tick'); const ok = spend(TY.wrong, null); A.say('🤔 ' + L(why) + (ok ? (en() ? ' (30 minutes lost)' : ' (30분이 더 걸렸어요)') : ''), 4.2); log('wrong ' + q.id); }
  function tieBoat(q, w) { if (A.panel() || !startJob(q)) return; if (w !== 0) { wrong(q, T2('바람이 반대쪽에서 와서 배가 밧줄 쪽으로 밀려 부딪혀요. 바람이 오는 쪽 말뚝에 묶어야 배가 끌려가지 않아요. 다시 풀어 묶느라 시간이 들었어요.', 'The wind comes from the other side, so the boat gets pushed into the rope side. Tie it on the side the wind comes from. Untying and re-tying took time.')); return; }
    jobDone(q); A.say('🧵 ' + (en() ? 'Tied on the windward side (' + wname() + '). The wind can’t drag the boat away now.' : '바람이 오는 ' + wname() + '쪽에 묶었어요. 이제 바람이 배를 끌고 가지 못해요.'), 3.6); }
  function stackSand(q, i) { if (A.panel() || !startJob(q)) return; if (i !== q.ok) { wrong(q, q.by === 'water' ? T2('여기는 강에서 먼 쪽이에요. 물은 강 쪽에서 넘어오니 강과 가까운 쪽부터 막아요. 다시 옮기느라 시간이 들었어요.', 'This side is away from the river. Water comes from the river side, so block that side first. Moving them took time.') : T2('여기는 땅이 높은 쪽이에요. 물은 낮은 곳으로 흘러요. 다시 옮기느라 시간이 들었어요.', 'This side is higher. Water flows to low ground. Moving them took time.')); return; }
    jobDone(q); A.say('🧱 ' + (en() ? 'Stacked on the river side, staggered like bricks.' : '강 쪽 문 앞에 벽돌처럼 엇갈려 쌓았어요.'), 3.2); }
  function gather(q, i) { if (A.panel() || K() > 6) return; if (late(5)) { lateMsg(); return; } if (q.got.includes(i)) return; q.got.push(i); mark(); spend(5, null); A.sfx('pop'); VKEY = '';
    const left = q.items.length - q.got.length; if (q.k === 'home' && !left) { jobDone(q); return; } A.say(left ? (en() ? left + ' more left' : '아직 ' + left + '개 남았어요') : (en() ? 'All inside. Now tighten the straps.' : '다 들였어요. 이제 끈을 조여요.'), 2.4); }
  function tieVinyl(q) { if (A.panel() || !startJob(q)) return; if (q.got.length < q.items.length) { q.mis = (q.mis | 0) + 1; mark(); spend(10, null); A.say('🤔 ' + (en() ? 'There are still loose things around — they could fly into the vinyl. Look around the greenhouse again.' : '아직 둘레에 날아갈 것이 있어요. 날아와 비닐을 찢을 수 있어요. 하우스 둘레를 다시 둘러봐요(10분).'), 4); return; }
    jobDone(q); A.say('🧵 ' + (en() ? 'Straps tight, nothing left to blow around.' : '끈을 조이고 둘레도 깨끗해요.'), 3); }
  function tieSign(q) { if (A.panel() || !startJob(q)) return; jobDone(q); A.say('🏷 ' + (en() ? 'Sign tied to the wall with the shopkeeper.' : '가게 주인과 같이 간판을 벽에 단단히 묶었어요.'), 3); }

  // ───────── 행정복지센터 물품(하루 몫 · 가방 칸이 아니라 개수) ─────────
  function deskUse() { if (A.panel() || A.busy()) return; const e = en(), s = S(), m = s.mat, h = now() / 60;
    if (h < TY.hall[0] || h >= TY.hall[1]) { A.say('🌙 ' + (e ? 'The centre gives out supplies 09:00–18:00' : '물품은 09:00~18:00에 나눠 줘요'), 2.8); return; }
    if (m.d !== day()) { m.d = day(); m.nr = 0; m.ns = 0; mark(); } heard('hall');
    const lr = TY.rope - m.nr, ls = TY.sand - m.ns;
    const P9 = A.openP('<h3>🧰 ' + (e ? 'Typhoon supplies' : '태풍 대비 물품') + '</h3><div class="pc-tx">' + esc(e ? 'Clerk: “We hand out a little to each person every day so everyone gets some.”' : '직원: "모두가 나눠 쓰도록 하루에 한 사람 몫씩 나눠 드려요."') + '</div>'
      + '<div class="ty-r"><span class="ty-tag f">' + (e ? 'Notice' : '안내문') + '</span>' + esc(L(RUM[1].t)) + '</div>'
      + '<div class="sm">' + esc(e ? 'Left for you today: ' + lr + ' rope, ' + ls + ' sandbags. You have: ' + matText() + '. Taking them takes 10 minutes.' : '오늘 받을 수 있는 것: 끈 ' + lr + '묶음, 모래주머니 ' + ls + '개. 가진 것: ' + matText() + '. 받는 데 10분이 걸려요.') + '</div>'
      + '<div class="row">' + (lr > 0 ? '<button data-a="r">' + (e ? 'Rope' : '끈 받기') + '</button>' : '') + (ls > 0 ? '<button data-a="s">' + (e ? 'Sandbags' : '모래주머니 받기') + '</button>' : '') + (lr > 0 && ls > 0 ? '<button data-a="b">' + (e ? 'Both' : '둘 다 받기') + '</button>' : '') + '<button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'typdesk');
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.a; A.closeP(); if (a === 'x') return; if (late(10)) { lateMsg(); return; }
      if (a === 'r' || a === 'b') { m.rope += lr; m.nr = TY.rope; } if (a === 's' || a === 'b') { m.sand += ls; m.ns = TY.sand; } mark(); spend(10, null); A.say('🧰 ' + (e ? 'You now have ' : '이제 ') + matText() + (e ? '' : '이 있어요'), 2.8); VKEY = ''; log('desk ' + a); }; }

  // ───────── 대피 길 사건(직접 걸어 확인 · 강가 낮은 곳 X · 가파른 비탈은 체력) ─────────
  function pathStart(q) { const s = S(); if (A.panel() || s.path.ok) return; if (!s.rum.some(r => r.id === 'hall')) heard('hall'); s.path = { ...s.path, st: 'walk', cells: [A.cell(me().x, me().z)], t0: now() }; pathQ = []; mark();
    A.say('🧭 ' + (en() ? 'Walk to ' + L(s.shelter.nm) + ' yourself. Avoid low ground by the river. (Teleporting stops the check.)' : L(s.shelter.nm) + '까지 직접 걸어가요. 강가 낮은 곳은 피해요. 순간 이동하면 확인이 멈춰요.'), 4.2); log('path start'); void q; }
  function pathEnd(ok, why, at) { const s = S(), p = s.path; p.st = ''; p.tries = (p.tries | 0) + 1; if (ok) { p.ok = day(); p.len = Math.round(p.len9 || 0); heard('walk'); const rw = s.rum.find(r => r.id === 'walk'); if (rw) rw.s = 'f'; A.skUp('explore', 2, 'case:typhoon'); A.sfx('ding'); } mark(); VKEY = ''; pathQ = []; if (why) A.say(L(why), 5); log('path end ' + ok + ' ' + (at || '')); }
  function pathSec() { const s = S(), p = s.path; if (!p || p.st !== 'walk') return; const m = me(), y = A.gy(m.x, m.z), L0 = pathQ[pathQ.length - 1];
    if (L0 && Math.hypot(m.x - L0[0], m.z - L0[1]) > 45) { pathEnd(false, T2('🧭 순간 이동해서 길 확인이 멈췄어요. 노인정에서 다시 걸어 봐요.', '🧭 You teleported, so the check stopped. Start again at the senior centre.')); return; }
    pathQ.push([m.x, m.z, y]); if (pathQ.length > 8) pathQ.shift(); if (L0) p.len9 = (p.len9 || 0) + Math.hypot(m.x - L0[0], m.z - L0[1]);
    const c = A.cell(m.x, m.z); if (c && p.cells[p.cells.length - 1] !== c) { p.cells.push(c); mark(); }
    if (A.water(m.x, m.z) < TY.low && !A.inSchool(m.x, m.z)) { pathEnd(false, T2('💧 ' + c + ' 칸은 강가 낮은 곳이에요. 비가 많이 오면 강물이 불어 잠길 수 있어요. 노인정에서 다른 길로 다시 걸어 봐요.', '💧 ' + c + ' is low ground by the water. In heavy rain it can flood. Start again at the senior centre and try another way.'), 'low ' + c); return; }
    if (pathQ.length >= 3) { const a = pathQ[pathQ.length - 3], dh = Math.hypot(m.x - a[0], m.z - a[1]), rise = y - a[2];
      if (dh >= 4 && rise >= 2 && rise / dh >= TY.steep) { const n = (A.stam() && A.stam().n) || 3;
        if (n < TY.steepN) { map.player.teleport([a[0], A.gy(a[0], a[1]) + 0.05, a[1]]); const t = Math.min(TY.work[1] * 60 - 1, now() + 20); if (t > now()) G().waitMin(t); s.path.slip = (s.path.slip | 0) + 1; pathEnd(false, T2('😓 비탈이 너무 가팔라 숨이 차서 미끄러져 내려왔어요(20분). 체력 칸이 더 늘어야 오를 수 있어요. 어르신들께는 둘러 가는 길이 맞아요.', '😓 Too steep — out of breath, you slid back down (20 min). You need more stamina to climb it. For the elders, a gentler way is better.'), 'slip'); return; }
        pathEnd(false, T2('⛰ 이 비탈은 너무 가팔라요. 나는 올랐지만 어르신들은 오르기 힘들어요. 노인정에서 둘러 가는 길로 다시 걸어 봐요.', '⛰ This slope is very steep. You made it, but the elders would struggle. Start again and take a gentler way.'), 'steep'); return; } }
    const sh = s.shelter.at, arrive = s.shelter.school ? A.inSchool(m.x, m.z) || Math.hypot(m.x - sh[0], m.z - sh[1]) < 10 : Math.hypot(m.x - sh[0], m.z - sh[1]) < 10;
    if (arrive && p.cells.length >= 1) pathEnd(true, T2('✅ 안전한 길을 확인했어요: ' + p.cells.join(' → ') + '. 노인정 어르신께 알려 드려요.', '✅ Safe way checked: ' + p.cells.join(' → ') + '. Go and tell the elders.'), 'ok'); }
  function tellElder(q) { const s = S(), e = en(); let st = 0;
    const R = CR.hyps.map(h => ({ ok: h.ok ? 1 : 0, t: h.ok ? T2(h.t[0] + ': ' + s.path.cells.join(' → '), h.t[1] + ': ' + s.path.cells.join(' → ')) : h.t })).sort((a, b) => hashS(L(a.t) + s.d0) - hashS(L(b.t) + s.d0));
    const W9 = [...CR.sup.map(k => ({ ok: 1, t: T2(CL[k].t[0] + '(본 것)', CL[k].t[1] + ' (what I saw)') })), ...s.rum.map(r => RUM.find(o => o.id === r.id)).filter(r => r && !r.f).map(r => ({ ok: 0, t: T2(r.who[0] + '이 그랬어요: ' + r.t[0], r.who[1] + ' said: ' + r.t[1]) }))].slice(0, 4).sort((a, b) => hashS(L(a.t) + s.d0) - hashS(L(b.t) + s.d0));
    const draw = () => '<h3>👵 ' + (e ? 'Tell the elders' : '어르신께 알려 드리기') + '</h3><div class="pc-tx">' + esc(st === 0 ? (e ? '“Which way should we go to the shelter?”' : '"대피소까지 어느 길로 가면 되니?"') : (e ? '“How do you know it is safe?”' : '"그 길이 안전한 걸 어떻게 아니?"')) + '</div><div class="ty-ch">' + (st === 0 ? R : W9).map((o, i) => '<button class="sub" data-i="' + i + '">' + esc(L(o.t)) + '</button>').join('') + '</div><div class="sm" data-m></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P9 = A.openP(draw(), false, 'typtell'), msg = t => { const m = P9.querySelector('[data-m]'); if (m) m.textContent = t; };
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const o = (st === 0 ? R : W9)[+b.dataset.i]; if (!o) return;
      if (!o.ok) { q.mis = (q.mis | 0) + 1; mark(); spend(10, null); msg(st === 0 ? (e ? '“Did you walk that one yourself? Tell me the way you checked.”' : '"그 길을 네가 직접 걸어 봤니? 네가 확인한 길을 알려 주렴."') : (e ? '“That is what someone thinks. What did you see yourself?”' : '"그건 누군가의 생각이구나. 네가 직접 본 것은 뭐니?"')); return; }
      if (st === 0) { st = 1; A.sfx('tick'); P9.innerHTML = draw(); return; }
      A.closeP(); if (!startJob(q)) return; s.path.told = day(); jobDone(q, T2('어르신들께 길을 하나하나 짚어 드렸어요', 'you went over the way with the elders')); A.say('👵 ' + (e ? '“Thank you. We’ll go that way, together, early.”' : '"고맙다. 그 길로 미리 다 같이 가마."'), 3.6); }; }

  // ───────── 태풍 날 · 결과 ─────────
  function result() { const s = S(), out = []; s.fix = []; for (const q of s.reqs || []) { const ok = q.st === 'done'; let line = '', at = null;
      if (q.k === 'boat') line = ok ? T2('선착장 배는 밧줄 덕분에 제자리에 있어요.', 'The boat stayed put thanks to the rope.') : T2('선착장 배 하나가 바람에 밀려 물가에 얹혔어요. 다친 사람은 없어요.', 'A boat was pushed onto the shore by the wind. No one was hurt.');
      if (q.k === 'vinyl') { line = ok ? T2('비닐하우스는 멀쩡해요. 딸기도 그대로예요.', 'The greenhouse is fine, strawberries too.') : T2('날아온 물건에 비닐 한 칸이 찢겼어요. 딸기는 무사해요.', 'Something blew into the greenhouse and tore one panel. The strawberries are safe.'); at = q.items[0]; }
      if (q.k === 'sign') { line = ok ? T2('「' + q.shop + '」 간판은 그대로예요.', 'The ' + q.shop + ' sign is fine.') : T2('「' + q.shop + '」 간판 하나가 기울었어요. 다친 사람은 없어요.', 'The ' + q.shop + ' sign tilted. No one was hurt.'); at = q.site; }
      if (q.k === 'sand') { line = ok ? T2('모래주머니 덕분에 「' + q.shop + '」 문 안은 말라 있어요.', 'Thanks to the sandbags, inside ' + q.shop + ' stayed dry.') : T2('「' + q.shop + '」 문턱까지 흙탕물이 들어왔어요. 닦으면 돼요.', 'Muddy water reached the door of ' + q.shop + '. It can be mopped up.'); at = q.spots[q.ok]; }
      if (q.k === 'home') { line = ok ? T2('우리 집 화분과 빨래는 안에서 무사해요.', 'Our pots and laundry were safe inside.') : T2('바깥에 둔 화분 하나가 쓰러졌어요.', 'A pot left outside fell over.'); at = q.items[0]; }
      if (q.k === 'elder') line = ok ? T2('노인정 어르신들은 알려 준 길로 미리 대피소에 갔어요.', 'The elders went to the shelter early by the way you checked.') : T2('어르신들이 길을 몰라 이웃이 대피소까지 모셔다 드렸어요. 모두 무사해요.', 'The elders didn’t know the way, so a neighbour took them to the shelter. Everyone is safe.');
      s.mem[q.k + ':' + (q.shop || q.id)] = { k: ok ? 'thx' : 'sorry', d: day(), at: q.at, who: q.who, n: s.n };
      out.push({ id: q.id, k: q.k, ok: ok ? 1 : 0, t: line, at: q.at });
      if (!ok && FIXK[q.k] && at) s.fix.push({ id: q.id, k: q.k, at: r1(landNear(at[0], at[1], 3) || at), st: '', who: q.who, shop: q.shop || '' }); }
    s.res = { d: day(), L: out }; s.said.res = 0; mark(); VKEY = '';
    const n = out.filter(o => o.ok).length; A.diary(en() ? 'The typhoon passed. I helped with ' + n + ' of ' + out.length + ' requests before it came.' : '태풍이 지나갔어요. 태풍 오기 전에 부탁 ' + out.length + '개 가운데 ' + n + '개를 도왔어요.'); log('result ' + n + '/' + out.length); return s.res; }
  function fixUse(f) { if (A.panel() || A.busy()) return; const e = en(), s = S(), k = FIXK[f.k]; if (late(k.m)) { lateMsg(); return; } if (s.mat.rope < k.rope) { A.say('🧰 ' + (e ? 'You need a rope from the community centre.' : '끈 한 묶음이 있어야 해요. 행정복지센터에서 받아요.'), 3); return; }
    s.mat.rope -= k.rope; f.st = 'done'; f.d = day(); const mm = s.mem[f.k + ':' + (f.shop || f.id)]; if (mm) mm.k = 'both'; mark(); const rest = restOf(k.heavy); spend(k.m + rest, rest ? T2('무거워서 숨을 골랐어요', 'heavy work, you caught your breath') : null); A.sfx('ding'); A.skUp('work', 1, 'case:typhoon'); A.taskEv('typh'); VKEY = '';
    A.say('🔧 ' + (e ? 'Fixed together. “Thanks for coming to help!”' : '같이 고쳤어요. "와서 도와줘서 고마워!"'), 3.2); if (s.fix.every(o => o.st === 'done')) setTimeout(() => { if (!dead) finish(); }, 1500); }
  // 남은 기억(결과 날부터 사흘): 그 자리 가까이 가면 이웃 말 한 번(하루 한 번)
  function memSec() { const s = S(), m = me(), d = day(); for (const [key, o] of Object.entries(s.mem)) { if (!o || !o.at || d - o.d > 3 || said['mem:' + key] === d) continue; if (Math.hypot(o.at[0] - m.x, o.at[1] - m.z) > 9) continue; said['mem:' + key] = d;
      const t = o.k === 'thx' ? T2('태풍 때 도와줘서 고마워. 덕분에 멀쩡했어.', 'Thanks for helping before the typhoon. Everything was fine.') : o.k === 'both' ? T2('기울어진 건 아쉬웠지만, 같이 고쳐 줘서 고마워.', 'It was a shame it got damaged, but thanks for fixing it with me.') : T2('다음 태풍 땐 미리 같이 준비하자. 다친 사람이 없어서 다행이야.', 'Next time let’s get ready early together. Good thing no one was hurt.');
      A.say('💬 ' + L(o.who) + ': "' + L(t) + '"', 4); break; } }
  // 태풍 날: 집 문 가까이·대피소(학교)·건물 안에서만 · 밖으로 나가면 한 줄 + 집(없으면 학교 정문 안)
  function stormSec() { const s = S(), m = me(), h = A.home(), sh = s.shelter;
    if (A.wx() !== 'rain') A.setWx('rain');
    const ok = A.inb() || A.inSchool(m.x, m.z) || (h && Math.hypot(m.x - h[0], m.z - h[1]) < 6) || (sh && Math.hypot(m.x - sh.at[0], m.z - sh.at[1]) < 8);
    if (!ok && !A.busy()) { const to = h ? landNear(h[0], h[1], 3) || h : A.gate(); map.player.teleport([to[0], A.gy(to[0], to[1]) + 0.05, to[1]]); A.say('🌀 ' + (en() ? 'Stay inside for now — wait until the typhoon passes.' : '지금은 안에 있어요. 태풍이 지나갈 때까지 기다려요.'), 3); s.out = (s.out | 0) + 1; mark(); log('storm back'); }
    if (!s.said.k7 && !A.panel() && !A.busy()) { s.said.k7 = 1; mark(); stormPanel(); } }
  function stormPanel() { const e = en(), s = S(); const P9 = A.openP('<h3>🌀 ' + (e ? 'The typhoon is passing' : '태풍이 지나가는 날') + '</h3><div class="pc-tx">' + esc(e ? 'Strong wind and heavy rain all day. Today we stay inside — at home or at the shelter — and watch from the doorway.' : '하루 종일 센 바람과 큰비가 와요. 오늘은 집이나 대피소 안에서 지내요. 문가에서 밖을 지켜볼 수 있어요.') + '</div>'
      + '<div class="sm">' + esc(e ? 'Look: the river is higher and the flags point ' + L(DIRN[((s.wind | 0) + 4) % 8]) + '.' : '보세요: 강물이 높아졌고, 깃발이 ' + L(DIRN[((s.wind | 0) + 4) % 8]) + '쪽으로 날려요.') + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Watch' : '지켜보기') + '</button><button data-a="ff">⏩ ' + (e ? 'Wait until it passes' : '태풍이 지나갈 때까지 기다리기') + '</button></div>', false, 'typstorm');
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'ff') { log('ff'); A.sleep(); } }; }
  function resPanel() { const e = en(), s = S(), R = s.res; if (!R) return null; const ok = R.L.filter(o => o.ok), no = R.L.filter(o => !o.ok);
    const row = o => '<div class="ty-r"><b>' + (KIND[o.k] ? KIND[o.k].ic : '') + ' ' + esc(L(o.t)) + '</b></div>';
    const P9 = A.openP('<h3>🌅 ' + (e ? 'The morning after the typhoon' : '태풍이 지나간 아침') + '</h3><div class="sm">' + esc(e ? 'Everyone in town is safe. Here is what changed:' : '마을 사람과 동물은 모두 무사해요. 달라진 것은 이래요.') + '</div>'
      + (ok.length ? '<div class="grp">' + (e ? 'Ready in time' : '준비한 곳') + '</div>' + ok.map(row).join('') : '') + (no.length ? '<div class="grp">' + (e ? 'Not ready in time' : '준비하지 못한 곳') + '</div>' + no.map(row).join('') : '')
      + (s.fix.length ? '<div class="sm">' + esc(e ? 'Neighbours would love help fixing things — see the 🔧 spots.' : '이웃들이 같이 고쳐 줄 사람을 기다려요. 🔧 자리에 가 봐요.') + '</div>' : '')
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'OK' : '알았어요') + '</button><button class="sub" data-a="nb">📒 ' + (e ? 'Typhoon notebook' : '태풍 수첩') + '</button></div>', false, 'typres');
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'nb') open(); }; return P9; }
  function fcPanel() { const e = en(), s = S(); heard('fc'); const P9 = A.openP('<h3>📻 ' + (e ? 'Morning radio forecast' : '아침 라디오 일기 예보') + '</h3><div class="pc-tx">' + esc(e ? 'A typhoon is moving up from the sea far to the south. In six days it may pass close to our town. Strong wind will blow from the ' + wname() + ', and heavy rain may make the river rise. Tie down or bring in things that can blow away, and know where the shelter is and how to get there.' : '먼 남쪽 바다에서 태풍이 올라오고 있어요. 엿새 뒤 우리 마을 가까이 지날 수 있어요. 바람은 ' + wname() + '쪽에서 세게 불고, 비가 많이 와 강물이 불어날 수 있어요. 날아갈 수 있는 것은 묶거나 들여놓고, 대피소와 가는 길을 미리 알아 두세요.') + '</div>'
      + '<div class="sm">' + esc(e ? 'Neighbours will start asking for help. You can’t do everything in one day — plan it.' : '이웃들이 도움을 부탁할 거예요. 하루에 다 할 수는 없어요. 무엇부터 할지 정해 봐요.') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'OK' : '알았어요') + '</button><button class="sub" data-a="nb">📒 ' + (e ? 'Typhoon notebook' : '태풍 수첩') + '</button></div>', false, 'typfc');
    s.fcSeen = day(); mark(); P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'nb') open(); }; return P9; }

  // ───────── 수첩(부탁 · 물건 · 들은 말 사실/생각 · 대피 길) ─────────
  function open() { if (dead) return null; const e = en(), s = S(); if (!s.st) { A.say(e ? 'No typhoon news right now' : '지금은 태풍 소식이 없어요', 2.2); return null; } const k = K(), B = budget();
    const left = k <= 6 ? (e ? (7 - k) + ' day(s) until the typhoon' : '태풍까지 ' + (7 - k) + '일') : k === 7 ? (e ? 'The typhoon is passing today' : '오늘 태풍이 지나가요') : (e ? 'The typhoon has passed' : '태풍이 지나갔어요');
    const reqs = (s.reqs || []).filter(q => q.d <= Math.min(k, 6)), rr = q => { const kd = KIND[q.k], st = q.st === 'done' ? (e ? 'Done' : '했어요') : q.st ? (e ? 'Heard — not done yet' : '들었어요 — 아직 못 했어요') : (e ? 'Not heard yet — go and ask' : '아직 못 들었어요 — 찾아가 물어봐요');
      return '<div class="ty-r' + (q.st === 'done' ? ' done' : '') + '"><b>' + kd.ic + ' ' + esc(L(kd.t)) + '</b> · ' + esc(L(q.who)) + '<div class="sm">' + esc(where(q)) + '</div><div class="sm">' + esc(st) + (needLine(q) && q.st !== 'done' ? ' · ' + esc(needLine(q)) : '') + '</div>' + (q.st !== 'done' ? '<button class="sub" data-map="' + q.id + '">🗺 ' + (e ? 'Map' : '지도') + '</button>' + (q.seen ? '<button class="sub" data-go="' + q.id + '">🧭 ' + (e ? 'Way (been there)' : '길 안내(가 본 곳)') + '</button>' : '') : '') + '</div>'; };
    const rum = s.rum.map(r => { const o = RUM.find(q => q.id === r.id); if (!o) return ''; const tag = r.s ? '<span class="ty-tag ' + r.s + '">' + (r.s === 'f' ? (e ? 'Fact' : '사실') : (e ? 'Opinion' : '생각')) + '</span>' : '';
      return '<div class="ty-r">' + tag + '<b>' + esc(L(o.who)) + '</b>: ' + esc(L(o.t)) + (r.s ? '' : '<div class="ty-rm"><span class="sm">' + esc(e ? 'Is this a fact or someone’s opinion?' : '사실일까요, 누군가의 생각일까요?') + '</span><button class="sub" data-rf="' + r.id + '">' + (e ? 'Fact' : '사실') + '</button><button class="sub" data-rt="' + r.id + '">' + (e ? 'Opinion' : '생각') + '</button></div>') + '</div>'; }).join('');
    const p = s.path, el = (s.reqs || []).find(q => q.k === 'elder' && q.d <= k), pathT = !el ? '' : p.told ? (e ? 'Told the elders the safe way.' : '어르신께 안전한 길을 알려 드렸어요.') : p.ok ? (e ? 'Checked: ' + p.cells.join(' → ') + '. Now tell the elders.' : '확인한 길: ' + p.cells.join(' → ') + '. 이제 어르신께 알려 드려요.') : p.st === 'walk' ? (e ? 'Checking now — walk to ' + L(s.shelter.nm) + '.' : '확인하는 중 — ' + L(s.shelter.nm) + '까지 걸어가요.') : (e ? 'Start at the senior centre and walk to ' + L(s.shelter.nm) + '. Avoid low riverside ground and steep slopes.' : '노인정에서 시작해 ' + L(s.shelter.nm) + '까지 걸어 봐요. 강가 낮은 곳과 가파른 비탈은 피해요.');
    const fixes = s.res ? (s.fix || []).filter(f => f.st !== 'done').map(f => '<div class="ty-r"><b>🔧 ' + esc(L(FIXK[f.k].t)) + '</b><div class="sm">' + esc(A.cell(f.at[0], f.at[1]) + (e ? '' : ' 칸')) + '</div><button class="sub" data-fm="' + f.id + '">🗺 ' + (e ? 'Map' : '지도') + '</button></div>').join('') : '';
    const h = '<h3>📒 ' + (e ? 'Typhoon notebook' : '태풍 수첩') + ' — ' + esc(left) + '</h3>'
      + (k >= 2 && k <= 6 ? '<div class="sm">' + esc(e ? 'Now ' + hm(now()) + '. Neighbours work 08:00–19:00. Work left today: about ' + B.need + ' min, time left: ' + B.left + ' min. ' : '지금 ' + hm(now()) + '. 이웃들은 08:00~19:00에 일해요. 남은 부탁 어림 ' + B.need + '분, 오늘 남은 때 ' + B.left + '분. ') + esc(e ? 'You have ' + matText() + '.' : '가진 것: ' + matText() + '.') + '</div>' : '')
      + (reqs.length && k <= 6 ? '<div class="grp">' + (e ? 'Requests' : '부탁') + '</div>' + reqs.map(rr).join('') : '') + (fixes ? '<div class="grp">' + (e ? 'Fix together' : '함께 고치기') + '</div>' + fixes : '')
      + (pathT && k <= 6 ? '<div class="grp">🧭 ' + (e ? 'Way to the shelter' : '대피 길') + '</div><div class="ty-r">' + esc(pathT) + '</div>' : '')
      + (rum ? '<div class="grp">👂 ' + (e ? 'Things I heard' : '들은 말') + '</div>' + rum : '') + '<canvas class="ty-map" width="520" height="220" style="display:none"></canvas>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P9 = A.openP(h, true, 'typnb'), cv = () => P9.querySelector('canvas.ty-map');
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const d = b.dataset;
      if (d.a === 'x') { A.closeP(); return; }
      if (d.rf || d.rt) { const id = d.rf || d.rt, r = s.rum.find(o => o.id === id), o = RUM.find(q => q.id === id); if (!r || !o) return; const pick = d.rf ? 1 : 0;
        if (pick === o.f) { r.s = o.f ? 'f' : 't'; mark(); A.sfx('ding'); open(); } else { A.sfx('tick'); A.say(e ? 'Think again: did someone see or measure it, or is it a guess?' : '다시 생각해 봐요. 누가 직접 보거나 잰 것인가요, 짐작인가요?', 3.2); } return; }
      if (d.map || d.fm) { const q = d.map ? s.reqs.find(o => o.id === d.map) : s.fix.find(o => o.id === d.fm), c = cv(); if (!q || !c) return; const at = q.site || q.at, m = me(); c.style.display = ''; try { A.mapSnip(c, [{ x: at[0], z: at[1], label: L(q.nm || q.who), main: true }, { x: m.x, z: m.z, label: e ? 'Me' : '나' }]); } catch (x) { /* 지도 조각 없음 */ } return; }
      if (d.go) { const q = s.reqs.find(o => o.id === d.go); if (!q) return; A.closeP(); A.route({ icon: KIND[q.k].ic, name: L(q.nm), door: q.at.slice(0, 2) }); } };
    log('open k' + k); return P9; }

  // ───────── 소문(지나가는 이웃 · 하루 둘 · 1~4일째) ─────────
  function rumSec() { const s = S(), k = K(); if (k < 1 || k > 4 || A.panel() || A.busy()) return; const d = day(); if ((said.rum || 0) >= 2 || said.rumD === d && performance.now() - (said.rumT || 0) < 40000) return;
    const next = RUM.filter(r => !r.f && r.id !== 'walk' && !s.rum.some(o => o.id === r.id))[0]; if (!next) return; const m = me(); let w = null, bd = 12; for (const q of A.workers() || []) { if (q.gate) continue; const dd = Math.hypot(q.x - m.x, q.z - m.z); if (dd < bd) { bd = dd; w = q; } } if (!w) return;
    heard(next.id); said.rum = (said.rum || 0) + 1; said.rumD = d; said.rumT = performance.now(); A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, L(next.t)); A.say('👂 ' + (en() ? 'You heard: ' : '들은 말: ') + L(next.t) + (en() ? ' (in the typhoon notebook)' : ' (태풍 수첩에 적혔어요)'), 4); log('rum ' + next.id); }

  // ───────── 1초 칸 ─────────
  let first = true;
  function sec() { if (dead || !A.on()) return; const s = S(); if (first) { first = false; if (!s.st && want()) start('auto'); if (s.st && K() === 8 && !s.res) result(); }
    if (!s.st) { if (VIS.length || HOT.length) clearVis(); return; } const k = K();
    if (k > 13) { finish(); return; } sync();
    if (k === 1 && s.fcSeen !== day() && !A.panel() && !A.busy()) fcPanel();
    if (k === 7) stormSec();
    if (k >= 8 && s.res && !s.said.res && !A.panel() && !A.busy()) { s.said.res = 1; mark(); resPanel(); }
    if (k <= 6) { pathSec(); rumSec(); for (const q of s.reqs || []) if (q.d <= k && !q.seen && dist(q.site) < 14) { q.seen = day(); mark(); } }
    if (k >= 8) memSec(); }

  // ───────── 바깥 손잡이(town.js) ─────────
  const line = () => { const s = S(); if (!s.st) return ''; const k = K(), e = en(), n = openReq().length, nf = (s.fix || []).filter(f => f.st !== 'done').length;
    if (k <= 1) return e ? '🌀 Typhoon forecast — open the notebook' : '🌀 태풍 예보 — 태풍 수첩 보기';
    if (k <= 6) return (e ? '🌀 ' + (7 - k) + ' day(s) to the typhoon' : '🌀 태풍까지 ' + (7 - k) + '일') + (n ? (e ? ' · ' + n + ' requests left' : ' · 남은 부탁 ' + n) : (e ? ' · all ready' : ' · 준비 다 했어요'));
    if (k === 7) return e ? '🌀 Typhoon day — open the notebook' : '🌀 태풍 날 — 태풍 수첩 보기';
    return nf ? (e ? '🌀 After the typhoon · ' + nf + ' to fix together' : '🌀 태풍이 지나갔어요 · 함께 고칠 곳 ' + nf) : ''; };
  const goal = () => { const s = S(); if (!s.st) return ''; const k = K(), e = en();
    if (s.path && s.path.st === 'walk') return e ? '🧭 Checking the way — walk to ' + L(s.shelter.nm) + ' · avoid low riverside ground' : '🧭 대피 길 확인 중 — ' + L(s.shelter.nm) + '까지 걸어가요 · 강가 낮은 곳은 피해요';
    if (k === 6) { const n = openReq().length; return (e ? '🌀 One day to the typhoon' : '🌀 태풍까지 하루') + (n ? (e ? ' — ' + n + ' requests left' : ' — 남은 부탁 ' + n) : (e ? ' — all ready' : ' — 준비 다 했어요')); }
    if (k === 7) return e ? '🌀 Typhoon — stay inside' : '🌀 태풍이 지나가는 중 — 안에서 지켜봐요'; return ''; };
  // 하루 마무리 '내일 기다리는 것'(town_day.js) · 오늘 할 일 ⑤(town_disc.js 칸 C.only) · 날씨 창 · 예보
  function wait(d1) { const s = S(); if (!s.st) return null; const k1 = d1 - s.d0 + 1, n = openReq().length;
    if (k1 >= 2 && k1 <= 6) return { k: 'typh', ic: '🌀', s: T2('태풍까지 ' + (7 - k1) + '일', (7 - k1) + ' day(s) to typhoon'), t: k1 === 6 ? T2('내일이 태풍 전 마지막 날이에요. 남은 부탁 ' + n + '개 가운데 무엇부터 할까요?', 'Tomorrow is the last day before the typhoon. ' + n + ' requests left — which first?') : T2('태풍까지 ' + (7 - k1) + '일 남았어요. 이웃 부탁 ' + n + '개가 기다려요', (7 - k1) + ' day(s) until the typhoon. ' + n + ' requests are waiting'), p: null };
    if (k1 === 7) return { k: 'typh', ic: '🌀', s: T2('태풍', 'Typhoon'), t: T2('내일 태풍이 지나가요. 집이나 대피소에서 지켜봐요', 'Tomorrow the typhoon passes. Watch from home or the shelter'), p: null };
    if (k1 === 8) return { k: 'typh', ic: '🌅', s: T2('태풍 뒤', 'After'), t: T2('태풍이 지나간 아침, 준비한 곳이 어떻게 됐는지 봐요', 'The morning after — see how the places you prepared did'), p: null }; return null; }
  function ctx(C) { const s = S(); if (!s.st) return; const k = K(); if (k < 1 || k > 6) return; const q = openReq()[0], a = [q ? A.cell(q.site[0], q.site[1]) : '', 'only', '🌀', ''];
    a.ev = 'typh'; a.t = T2('🌀 태풍 대비 부탁 하나 들어주기', '🌀 Help with one typhoon request'); a.tp = T2('🌀 태풍 대비 부탁을 들어줬어요', '🌀 Helped with a typhoon request'); a.why = T2('태풍까지 ' + (7 - k) + '일 남았대요', (7 - k) + ' day(s) until the typhoon'); a.disc = 'typh'; a.nm = ''; C.only = a; }
  const fcAt = d => { const s = S(); if (!s.st) return null; const k = d - s.d0 + 1; return k === 7 ? 'rain' : k === 6 ? 'cloud' : k === 8 ? 'clear' : null; };
  const windAt = d => { const s = S(); if (!s.st) return null; const k = d - s.d0 + 1; if (k < 1 || k > 7) return null; const v = dirVec(((s.wind | 0) + 4) % 8); return { x: v[0], z: v[1], k: k === 7 ? 1 : 0.6 }; };   /* 깃발 = 불어 가는 쪽 */
  const wxLine = () => { const s = S(); if (!s.st) return ''; const k = K(); return k <= 6 ? (en() ? '🌀 Typhoon on day ' + (s.d0 + 6) + ' — wind from the ' + wname() + ', heavy rain' : '🌀 ' + (s.d0 + 6) + '일째에 태풍 — ' + wname() + '쪽에서 센 바람, 큰비') : k === 7 ? (en() ? '🌀 Typhoon today' : '🌀 오늘 태풍이 지나가요') : ''; };
  function dispose() { dead = true; clearVis(); if (css) { css.remove(); css = null; } }
  function info() { const s = S(); return { st: s.st, n: s.n, d0: s.d0, k: K(), out: s.out | 0, wind: s.wind, shelter: s.shelter || null, desk: s.desk || null, mat: s.mat ? { ...s.mat } : null, reqs: (s.reqs || []).map(q => ({ id: q.id, k: q.k, d: q.d, st: q.st, mis: q.mis, at: q.at, site: q.site, pa: q.pa, pb: q.pb, ok: q.ok, spots: q.spots, items: q.items, got: q.got, shop: q.shop, seen: q.seen })),
    rum: (s.rum || []).map(r => ({ ...r })), path: s.path ? { ...s.path } : null, res: s.res ? JSON.parse(JSON.stringify(s.res)) : null, fix: (s.fix || []).map(f => ({ ...f })), mem: JSON.parse(JSON.stringify(s.mem)), log: s.log.slice(0, 3), budget: s.st ? budget() : null, vis: VIS.length, hot: HOT.map(h => h.label || (h.hot && h.hot.label) || ''), line: line(), goal: goal(), dbg: DBG.slice() }; }
  // 시험 손잡이: E 자리의 쓰기를 그대로 부름(자리 판단 · 시간 · 물건 · 체력이 실제와 같음)
  const byId = id => (S().reqs || []).find(q => q.id === id || q.k === id);
  const dbg = { want: () => want(), talk: id => { const q = byId(id); if (q) talk(q); }, desk: () => deskUse(), tieBoat: (w) => tieBoat(byId('boat'), w), sand: i => stackSand(byId('sand'), i), gather: (id, i) => gather(byId(id), i), vinyl: () => tieVinyl(byId('vinyl')), sign: id => tieSign(byId(id)), path: () => pathStart(byId('elder')), pathSec: () => pathSec(), tell: () => tellElder(byId('elder')), result: () => result(), fix: id => { const f = S().fix.find(o => o.id === id || o.k === id); if (f) fixUse(f); }, finish: () => finish(), heard: id => heard(id), water: (x, z) => A.water(x, z), worker: () => { const w = (A.workers() || []).find(o => !o.gate && !A.inSchool(o.x, o.z)); return w ? [w.x, w.z] : null; }, sync: () => { VKEY = ''; sync(); return VIS.length; } };
  return { sec, day: onDay, start, open, line, goal, wait, ctx, fcAt, windAt, wxLine, storm, info, dbg, dispose, budget };
}
