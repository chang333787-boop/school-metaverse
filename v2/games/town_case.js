// 📒 사건 수첩 엔진(CASE-1 · 사용자 10-25 '추론하면서 여러 구간에 걸쳐 해내는 퀘스트가 없어 · 마을 박물관 게임 같아 · 조급함이 없어' · 설계 docs/systems/town_case.md)
//   사용자 덧말(10-25): '가서 E만 누르는 것 싫고 · 막대 놀이 싫고 · 적지 않은 스트레스를 받아 가며 성취' → ① 단서 자리엔 빨간 선 X(이웃 말의 칸·방위·랜드마크 + 지도) · 확인 자리만 빨간 선
//     ② 틀린 가설 = 게임 시각이 흐르고 기한이 줄어듦(벌·점수 X) ③ 단서 하나는 몸으로(강·호숫가를 걸으며 세 군데 물 떠서 견주기 · 공사장 울타리 안에 들어가야 흙더미가 보임) ④ 막대·꾹 누르기 X ⑤ 보고서 근거는 '본 것'만
//   고리 = 생김(이미 있는 엔진 값에서 저절로 · 사건 표 줄의 when) → 단서 모으기(장소·사람·때가 서로 다름 · 수첩에 '본 것'과 '들은 생각'을 나눠 적음) → 까닭 고르기(단서 셋 이상 · 셋 중 하나)
//     → 확인(고른 까닭의 확인 자리만 빨간 선 · 틀리면 '아니었어요' + 시각 90분) → 보고서(근거 둘 · 창구 직원이 '생각'은 되물음) → 행정복지센터 창구(town_fix.js 탁자 · 09~18시)
//     → 결과(기한 안 = 다음 날 흙막이 + 물이 하루씩 맑아짐 + 아침 소식 + 이웃 반응 둘 · 늦음 = 큰비 날 논 한 칸 흙탕 하루 + '다음엔 빨리') → 다음 사건 씨앗
//   사건 표 CASES: 줄 하나 = 사건 하나(when = 생기는 조건 · place = 자리 정하기 · clues · hyps · ok = 보고서에 쓸 수 있는 본 것) · ready:false = 표 줄만(아직 안 지음)
//   지킴: 판타지 X · 전투 X · 범인 몰기 X(공사하는 분도 이웃 · '생각이 다름'까지) · 실제 회사 이름 X · 실명 X(상인·논 일꾼·공사 일꾼 = 이름 없는 역할) · 4학년(지시문 한 문장 · 새 낱말 둘 + 낱말 상자)
//   렉: 매 프레임 일 0(모두 1초 칸 sec) · 새 Light X · 사건 소품 = 합친 부품(공사장 1 · 배수구 1 · 안내판 1 + 글씨 1 · 흙탕 논 1)
export const CASE_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const DAYM = 24 * 60, DUE_H = 18, COST = 90;   /* 기한 = 생긴 날 포함 사흘째 18:00(창구 닫는 때) · 틀린 가설 = 90분 */

// ───────── 사건 표(줄 하나 = 사건 하나) ─────────
//   when(c) = 그날 아침 생기나(c = { water, wx, day }) · days = 기한(날) · clue 갈래: 'sample'(몸으로 물 떠 보기) · 'look'(그 자리 E·K) · 'talk'(사람 · 때 있음) · 'wx'(날씨 창)
//   f = 수첩 칸('fact' 본 것 · 'idea' 들은 생각) · hyps = 까닭 셋(chk = 확인 자리 · ok = 맞는 까닭) · sup = 보고서에서 '맞는 까닭을 보여 주는' 본 것
export const CASES = {
  river: { ready: true, icon: '🌊', t: T2('흐려진 강', 'The muddy river'), days: 3,
    when: c => c.water && c.water.lv >= 0.99,   /* 비 사흘 → 물 높이 +1(town_routine.js waterOf · WATER-1)인 첫 아침 */
    q: T2('강물이 왜 흙빛이 되었는지 까닭을 찾아요.', 'Find out why the river turned muddy.'),
    words: [[T2('토사', 'Silt'), T2('빗물에 쓸려 내려온 흙과 모래', 'Soil and sand washed down by rain')], [T2('흙막이', 'Silt fence'), T2('흙이 쓸려 나가지 않게 막는 판이나 덮개', 'Boards or covers that stop soil from washing away')]],
    clues: ['sample', 'site', 'drain', 'sign', 'rain', 'market', 'farmer'],
    hyps: [{ k: 'fac', t: T2('공장에서 흘려보낸 물 때문이에요', 'Water let out by the factory'), chk: 'drain' },
      { k: 'rain', t: T2('비가 많이 와서 저절로 흐려졌어요', 'It is just from lots of rain'), chk: 'far' },
      { k: 'site', t: T2('공사장 흙이 빗물에 쓸려 왔어요', 'Soil from the building site washed in with the rain'), chk: 'trail', ok: 1 }],
    sup: ['sample', 'site', 'sign', 'trail'], next: 'siteRoad' },
  // 다음 사건(표 줄만 · 아직 안 지음 · docs/systems/town_case.md §5)
  typhoon: { ready: false, icon: '🌀', t: T2('태풍 사흘 전', 'Three days before the typhoon'), days: 3, when: c => !!(c.front && c.front.typhoon) },
  scale: { ready: false, icon: '⚖️', t: T2('사라진 장터 저울', 'The missing market scale'), days: 2, when: c => !!(c.jang && c.jang.left === 1) },
  siteRoad: { ready: false, icon: '🚧', t: T2('공사장 길 안전', 'Safe road by the building site'), days: 3, seed: 'river', when: () => false },
};

// 단서 글(본 것 = 내가 직접 본·잰 것 · 들은 생각 = 이웃이 한 말)
const CL = {
  sample: { f: 'fact', ic: '💧', t: T2('물을 세 군데 떠 보니 공사장 가까운 물이 가장 흐리고, 먼 호숫가 물은 맑았어요.', 'I took water from three places: it was muddiest near the site and clear on the far shore.') },
  site: { f: 'fact', ic: '⛏', t: T2('공사장 울타리 안 흙더미에 덮개가 없고, 빗물 고랑이 물 쪽으로 나 있었어요.', 'Inside the fence the soil heaps had no cover, and rain channels ran toward the water.') },
  drain: { f: 'fact', ic: '🏭', t: T2('공장 배수구에서 나오는 물은 맑았어요.', 'The water from the factory drain was clear.') },
  sign: { f: 'fact', ic: '🚏', t: T2('정류장 안내판에 "공사 차량이 드나들어요 · 호수 둘레 땅 고르기"라고 쓰여 있었어요.', 'The bus stop notice said: "Works vehicles coming and going · levelling ground by the lake".') },
  rain: { f: 'fact', ic: '🌧', t: T2('날씨 기록을 보니 사흘 동안 비가 왔어요.', 'The weather record shows three days of rain.') },
  market: { f: 'idea', ic: '🗣', t: T2('장터 상인: "새벽마다 흙 실은 트럭이 호수 쪽 길로 가더라고요. 그 흙 때문일지도 몰라요."', 'Market seller: "Trucks full of soil go up the lake road every morning. Maybe it is that soil."') },
  farmer: { f: 'idea', ic: '🗣', t: T2('논 일꾼: "공장에서 물을 흘려보내서 그런 것 같아요."', 'Rice farmer: "I think the factory is letting water out."') },
  trail: { f: 'fact', ic: '🔎', t: T2('흙물이 공사장 고랑을 따라 호수로 흘러들고 있었어요.', 'Muddy water was running from the site channels into the lake.') },
  far: { f: 'fact', ic: '💧', t: T2('비는 똑같이 왔는데 먼 호숫가 물은 맑았어요.', 'The same rain fell, but the far shore was clear.') },
};
// 단서를 찾을 실마리(빨간 선 X · 칸·방위·랜드마크 말만) — 처음 · 이웃에게 들은 뒤
const LEAD = {
  start: p => [T2('강이나 호숫가 물가에 가면 물을 떠서 견주어 볼 수 있어요. 여러 군데를 떠 봐요.', 'At the river or lake shore you can take water samples. Try several places.'),
    T2('장터(' + p.mkCell + ' 칸) 상인이 아침에 무언가를 봤대요. 장터가 붐비는 아침 8~10시에 가 봐요.', 'A seller at the market (' + p.mkCell + ') saw something. Go while it is busy, 8–10 am.'),
    T2('비가 얼마나 왔는지는 날씨 창(위 시계 칩)에 기록이 있어요.', 'The weather window (clock chip) keeps a rain record.')],
  market: p => [T2('트럭이 다니는 호수 쪽 길 정류장(' + p.sign.cell + ' 칸)에 안내판이 있대요. 호숫가 공사장 울타리(' + p.site.cell + ' 칸 근처)도 찾아봐요.', 'There is a notice at the bus stop on the lake road (' + p.sign.cell + '). Look for the site fence by the lake (near ' + p.site.cell + ').')],
  farmer: p => [T2('공장 물이 나오는 배수구가 ' + p.drain.cell + ' 칸 물가에 있대요.', 'The factory drain comes out at the water’s edge in ' + p.drain.cell + '.')],
  farm0: p => [T2('논 일꾼은 오후(13~18시)에 ' + p.fmCell + ' 칸 논에서 일해요. 논 물은 농수로로 호수에서 와요.', 'The rice farmer works in the paddy in ' + p.fmCell + ' in the afternoon (1–6 pm). Paddy water comes from the lake by the canal.')],
};

const CSS = `.twn-p .cs-g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0}.twn-p .cs-c{border:2px solid #c9b27a;border-radius:10px;padding:6px 8px;background:#fffdf2;font-size:14px;line-height:1.45;min-height:56px}
.twn-p .cs-c h4{margin:0 0 4px;font-size:14px}.twn-p .cs-c div{margin:3px 0}.twn-p .cs-c.idea{border-style:dashed;background:#f6f8fb}
.twn-p .cs-ch{display:grid;gap:8px;margin:6px 0}.twn-p .cs-ch button{min-height:46px;font-size:15px;text-align:left}.twn-p .cs-ch button.on{outline:3px solid #2f6db5}
.twn-p .cs-wd{background:#fffdf2;border:2px dashed #c9b27a;border-radius:12px;padding:6px 10px;margin:6px 0;font-size:14px;line-height:1.5}
.twn-p .cs-ld{font-size:14px;line-height:1.5;margin:4px 0}.twn-p .cs-due{font-weight:800;color:#a2541b}
@media (max-width:480px){.twn-p .cs-g{grid-template-columns:1fr}}`;

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · lang() · esc · openP(h, wide, kind) · closeP() · panelOpen() · say(t, s) · banner(t, s) · chip(k, t, o) · sfx(k)
//   busy() · away() · open() 사건이 열렸나 · emOn() 긴급 사건 중 · storyBusy() 이야기 단계가 겹침 · water() 그날 물 높이(town_routine) · wxLog() 날마다 날씨 · wxDay()
//   waters() [{ id, k, name, sh }] · sdOf(sh, x, z) · sd(x, z) 물까지 · factories() · stops() · workers() · cell(x, z) · place(x, z) · okSpot(x, z) · onRoad(x, z) · gy(x, z)
//   guide(to, info) · guideOff() · mapSnip(cv, pts) · skUp(k, n, src) · rec(k, o) · buildParts(fn) · me() · bubble(o, t)
export function createCase(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const S = () => { const g = A.GAME.S; let s = g.case; if (!s || typeof s !== 'object' || s.v !== CASE_V) s = g.case = { v: CASE_V, d: -1, cur: null, done: {}, log: [], helper: 0, seeds: {} }; if (!Array.isArray(s.log)) s.log = []; if (!s.done || typeof s.done !== 'object') s.done = {}; if (!s.seeds || typeof s.seeds !== 'object') s.seeds = {}; return s; };
  const mark = () => A.GAME.mark(), toast = (t, s) => A.say(t, s), sfx = k => A.sfx && A.sfx(k), day = () => A.GAME.S.day | 0, now = () => day() * DAYM + (A.GAME.S.min | 0);
  let dead = false, OFF = false, css = null, HOT = {}, HKEY = {}, VIS = {}, VKEY = {}, CHIPK = '', DBG = [], lastWx = -1;
  if (!document.getElementById('cs-css')) { css = document.createElement('style'); css.id = 'cs-css'; css.textContent = CSS; document.head.appendChild(css); }
  const me = () => A.me(), dist = (x, z) => { const m = me(); return Math.hypot(x - m.x, z - m.z); };
  const log = t => { DBG.push(t); if (DBG.length > 30) DBG.shift(); };
  const r2 = v => Math.round(v * 100) / 100;

  // ───────── 자리 정하기(생길 때 한 번 · 저장에 남김) ─────────
  //   강 = 가장 긴 물 줄 · 물머리 = 그 줄 첫 점 곁 물(호수) · 공사장 = 물머리 기슭(강이 나가는 쪽) 22~34m 뭍 · 고랑 끝 = 공사장 → 물가
  //   먼 물가 = 공사장에서 가장 먼 물머리 기슭 · 배수구 = 물에 가장 가까운 공장 → 그 물가 · 안내판 = 공사장에서 가장 가까운 정류장 곁 · 상인 = 장터 일꾼 · 논 일꾼 = 농수로 끝에 가장 가까운 논 일꾼
  function placeRiver() { const W = A.waters() || [], lines = W.filter(w => w.k === 'water' && w.sh && w.sh.line), polys = W.filter(w => w.k === 'water' && w.sh && w.sh.poly);
    if (!lines.length) { log('pl:1'); return null; } const len = l => { let s = 0; for (let i = 1; i < l.length; i++) s += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]); return s; };
    const R = lines.sort((a, b) => len(b.sh.line) - len(a.sh.line))[0], RL = R.sh.line, p0 = RL[0];
    let src = null, bd = 40; for (const w of polys) { const d = A.sdOf(w.sh, p0[0], p0[1]); if (d < bd) { bd = d; src = w; } }
    if (!src) { log('pl:2'); return null; } const sdS = (x, z) => A.sdOf(src.sh, x, z), P = src.sh.poly; let cx = 0, cz = 0; for (const q of P) { cx += q[0]; cz += q[1]; } cx /= P.length; cz /= P.length;
    let out = null; for (let i = 1; i < RL.length && !out; i++) if (sdS(RL[i][0], RL[i][1]) > 2) out = RL[i];   /* 강이 물머리를 나가는 곳 */
    if (!out) out = RL[1] || RL[0];
    const C = []; for (let a = 0; a < 32; a++) { const ux = Math.cos(a * 0.19635), uz = Math.sin(a * 0.19635); let e = null; for (let t = 0; t < 400; t += 1) { const x = cx + ux * t, z = cz + uz * t; if (sdS(x, z) > 0) { e = [x, z]; break; } } if (!e) continue;
      for (const r of [16, 20, 24, 28, 32, 36, 40, 44]) { const x = e[0] + ux * r, z = e[1] + uz * r; if (!A.okSpot(x, z) || A.onRoad(x, z) || A.sd(x, z) < 11) continue; let ok = true; for (const [dx, dz] of [[5, 0], [-5, 0], [0, 5], [0, -5]]) if (A.onRoad(x + dx, z + dz) || A.sd(x + dx, z + dz) < 10) ok = false; if (!ok) continue; let cr = 0; for (let t = 0; t < r; t += 1.5) if (A.onRoad(e[0] + ux * t, e[1] + uz * t)) cr = 1;   /* 공사장 → 물가 사이 찻길 = 뒤로(흙물 고랑이 길을 건너지 않게) */
        const tr9 = A.tree && A.tree(x, z, 6.5); C.push({ x, z, ex: e[0] - ux * 1.5, ez: e[1] - uz * 1.5, ux, uz, a, sc: Math.hypot(x - out[0], z - out[1]) + (tr9 ? 400 : 0) + (cr ? 900 : 0) }); break; } }   /* 나무가 울타리 안에 드는 자리는 뒤로(없으면 그래도 씀) */
    if (!C.length) { log('pl:3'); return null; } C.sort((a, b) => a.sc - b.sc); const st = C[0];
    let tr = null; for (let t = 0; t < 60; t += 0.5) { const x = st.x - st.ux * t, z = st.z - st.uz * t; if (A.sd(x, z) < 1.6) { tr = [x, z]; break; } } if (!tr) tr = [st.ex + st.ux * 2, st.ez + st.uz * 2];
    let far = null, fd = 0; for (const q of C) { const d = Math.hypot(q.x - st.x, q.z - st.z); if (d > fd) { fd = d; far = q; } }
    let fx = null; if (far) for (let t = 0; t < 70; t += 0.5) { const x = far.x - far.ux * t, z = far.z - far.uz * t; if (A.sd(x, z) < 1.6) { fx = [x, z]; break; } } if (!fx || fd < 60) { log('pl:4'); return null; }
    const F = A.factories() || []; let fac = null, fcd = 700; const nearW = (x, z) => { let b = null, d9 = 1e9; for (const L9 of [RL]) for (let i = 1; i < L9.length; i++) for (let t = 0; t <= 1; t += 0.05) { const qx = L9[i - 1][0] + (L9[i][0] - L9[i - 1][0]) * t, qz = L9[i - 1][1] + (L9[i][1] - L9[i - 1][1]) * t, d = Math.hypot(qx - x, qz - z); if (d < d9) { d9 = d; b = [qx, qz]; } } for (const q of P) { const d = Math.hypot(q[0] - x, q[1] - z); if (d < d9) { d9 = d; b = [q[0], q[1]]; } } return [b, d9]; };
    for (const f of F) { const [, d] = nearW(f.x, f.z); if (d < fcd && Math.hypot(f.x - st.x, f.z - st.z) > 60) { fcd = d; fac = f; } } if (!fac) { log('pl:5'); return null; }
    let dr = null; { const [b] = nearW(fac.x, fac.z), ux = fac.x - b[0], uz = fac.z - b[1], l = Math.hypot(ux, uz) || 1; for (let t = 0; t < 60; t += 0.5) { const x = b[0] + ux / l * t, z = b[1] + uz / l * t; if (A.sd(x, z) > 1.4) { dr = { x, z, ux: ux / l, uz: uz / l }; break; } } } if (!dr) { log('pl:6'); return null; }
    const ST = A.stops() || []; let sg = null, sgd = 380; for (const q of ST) { const d = Math.hypot(q[0] - st.x, q[1] - st.z); if (d < sgd && d > 12) { for (const [ox, oz] of [[1.8, 1.2], [-1.8, 1.2], [1.8, -1.2], [-1.8, -1.2], [2.6, 0], [-2.6, 0], [0, 2.6], [0, -2.6]]) if (A.okSpot(q[0] + ox, q[1] + oz) && !A.onRoad(q[0] + ox, q[1] + oz)) { sg = { x: q[0] + ox, z: q[1] + oz, sx: q[0], sz: q[1] }; sgd = d; break; } } }
    if (!sg) { log('pl:7'); return null; }
    const WK = A.workers() || [], wkAt = (k, rx, rz) => { let b = null, d9 = 1e9; for (const w of WK) { if (w.k !== k || w.i == null) continue; const d = Math.hypot(w.x - rx, w.z - rz); if (d < d9) { d9 = d; b = w; } } return b; };
    const canal = W.find(w => w.k === 'canal' && w.sh && w.sh.line && Math.hypot(w.sh.line[0][0] - cx, w.sh.line[0][1] - cz) < 200), cEnd = canal ? canal.sh.line[canal.sh.line.length - 1] : [st.x, st.z];
    const mk = wkAt('stall', st.x, st.z), fm = wkAt('paddy', cEnd[0], cEnd[1]); if (!mk || !fm) { log('pl:8'); return null; }
    const side = (w, k) => { const x0 = w.hx ?? w.x, z0 = w.hz ?? w.z; for (const r of [2.4, 3.2]) for (let a = 0; a < 8; a++) { const x = x0 + Math.cos(a * 0.785 + 0.4) * r, z = z0 + Math.sin(a * 0.785 + 0.4) * r; if (A.okSpot(x, z)) return { x: r2(x), z: r2(z), i: w.i, k }; } return { x: r2(x0 + 2), z: r2(z0 + 2), i: w.i, k }; };
    const mud = { x: r2(fm.x + 3), z: r2(fm.z + 3) };
    return { river: R.id, src: src.id, srcName: src.name || '', site: { x: r2(st.x), z: r2(st.z), ux: r2(st.ux), uz: r2(st.uz), cell: A.cell(st.x, st.z) }, trail: { x: r2(tr[0]), z: r2(tr[1]) }, far: { x: r2(fx[0]), z: r2(fx[1]), cell: A.cell(fx[0], fx[1]) },
      drain: { x: r2(dr.x), z: r2(dr.z), ux: r2(dr.ux), uz: r2(dr.uz), cell: A.cell(dr.x, dr.z), fac: fac.name || '' }, sign: { x: r2(sg.x), z: r2(sg.z), sx: r2(sg.sx), sz: r2(sg.sz), cell: A.cell(sg.x, sg.z) },
      market: side(mk, 'stall'), farmer: side(fm, 'paddy'), mkCell: A.cell(mk.x, mk.z), fmCell: A.cell(fm.x, fm.z), mud, out: [r2(out[0]), r2(out[1])], line: RL.map(q => [r2(q[0]), r2(q[1])]), poly: P.map(q => [r2(q[0]), r2(q[1])]) };
  }
  const PLACE = { river: placeRiver };

  // 물빛(0 맑음 ~ 1 흙빛): 물머리 안 = 고랑 끝에서 멀수록 맑음 · 강 = 흐림(내려갈수록 조금씩 옅어짐) · 흙막이 뒤 = 날마다 맑아짐
  function murk(q, x, z) { const p = q.pl, k = clearK(q), dT = Math.hypot(x - p.trail.x, z - p.trail.z); let inSrc = false; { const P = p.poly; let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > z) !== (P[j][1] > z) && x < (P[j][0] - P[i][0]) * (z - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; } inSrc = c || dT < 40 || edgeD(P, x, z) < 9; }
    let m; const span = Math.max(50, Math.hypot(p.far.x - p.trail.x, p.far.z - p.trail.z)); if (inSrc) m = dT < span * 0.4 ? 0.95 : dT < span * 0.7 ? 0.55 : 0.12; else { let s = 0, best = 1e9, acc = 0; const R = p.line; for (let i = 1; i < R.length; i++) { const sl = Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]); for (let t = 0; t <= 1; t += 0.1) { const d = Math.hypot(R[i - 1][0] + (R[i][0] - R[i - 1][0]) * t - x, R[i - 1][1] + (R[i][1] - R[i - 1][1]) * t - z); if (d < best) { best = d; s = acc + sl * t; } } acc += sl; } m = 0.8 - Math.min(0.25, s / 1600); }
    return Math.max(0.05, m * k); }
  function edgeD(P, x, z) { let dp = 1e9; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[j], b = P[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); dp = Math.min(dp, Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z)); } return dp; }
  const clearK = q => { if (!q.fixD) return 1; const n = day() - q.fixD; return n <= 0 ? 1 : n === 1 ? 0.65 : n === 2 ? 0.35 : 0.1; };
  const murkWord = m => m > 0.6 ? T2('흙빛', 'muddy') : m > 0.3 ? T2('조금 흐림', 'a bit cloudy') : T2('맑음', 'clear');

  // ───────── 때 ─────────
  const dueAt = q => (q.d0 + (CASES[q.id].days - 1)) * DAYM + DUE_H * 60;
  function dueText(q) { const left = dueAt(q) - now(), dd = (q.d0 + CASES[q.id].days - 1) - day(), e = en();
    if (left <= 0) return e ? 'past the deadline' : '기한 지남';
    if (dd >= 2) return e ? 'due in ' + (dd + 1) + ' days' : (dd + 1 === 3 ? '기한 사흘' : '기한 ' + (dd + 1) + '일');
    if (dd === 1) return e ? 'due tomorrow, 6 pm' : '기한 이틀(내일 18시까지)';
    const h = Math.max(1, Math.round(left / 60)); return e ? 'due today 6 pm · ' + h + ' h left' : '오늘 18시까지 · ' + h + '시간 남음'; }
  function spend(min) { const G = A.GAME.S; G.min = Math.min(DAYM - 10, (G.min | 0) + min); mark(); }

  // ───────── 생김 ─────────
  function ctx() { return { water: A.water ? A.water() : null, wx: A.wxDay ? A.wxDay() : '', day: day() }; }
  function plan(force) { const s = S(), D = day(); if (s.cur) return null; if (!force && s.d === D) return null;
    if (!force) { if (!A.open() || A.busy() || A.away() || (A.GAME.S.min | 0) < 6 * 60 + 30) return null; if (A.emOn() || A.storyBusy()) { s.d = D; mark(); log('skip ' + D); return null; } }
    s.d = D; mark(); const c = ctx();
    for (const id of Object.keys(CASES)) { const R = CASES[id]; if (!R.ready || (s.done[id] && !force) || !PLACE[id]) continue; if (!force && !R.when(c)) continue;
      const pl = PLACE[id](); if (!pl) { log('noPlace ' + id); continue; }
      s.cur = { id, d0: D, st: 'open', pl, clues: {}, samples: [], leads: ['start'], hyp: '', tried: [], wrong: 0, chk: 0, rep: null, repTry: 0, fixD: 0, late: 0, mudD: 0, said: 0 }; mark(); log('plan ' + id + ' ' + D); A.rec('case', { id, ev: 'start', d: D });
      announce(); return s.cur; }
    return null; }
  function announce() { const q = S().cur; if (!q) return; const R = CASES[q.id], e = en();
    A.banner(R.icon + ' ' + (e ? 'New case: ' : '새 사건: ') + L(R.t), 3.6); sfx('ding');
    toast('📒 ' + (e ? 'The river is brown after three days of rain. Find out why within 3 days (tap the notebook chip).' : '비 사흘 뒤 강물이 흙빛이에요. 사흘 안에 까닭을 찾아 행정복지센터에 알려요(📒 수첩 칩).'), 5); }

  // ───────── 1초 칸 ─────────
  function sec() { if (dead || !A.on()) return; if (OFF) { if (S().cur) { S().cur = null; mark(); } sync(); hotSync(); chipSync(); return; } const s = S(), D = day(); let q = s.cur;
    if (!q) { plan(false); q = s.cur; }
    if (q) { if (q.st === 'open' && now() > dueAt(q) && D > q.d0 + CASES[q.id].days - 1) { q.st = 'late'; q.late = D; mark(); A.rec('case', { id: q.id, ev: 'late', d: D }); }
      if (q.st === 'late' && !q.mudD && (A.wxDay ? A.wxDay() === 'rain' : false)) { q.mudD = D; mark(); }   /* 늦으면 = 큰비 오는 날 논 한 칸 흙탕(하루) */
      if (q.st === 'late' && !q.mudD && D >= q.late + 3) { q.mudD = -1; mark(); }   /* 사흘 안에 비가 없으면 흙탕 X */
      if (q.st === 'late' && q.mudD && (q.mudD < 0 || D > q.mudD) && !q.fixD) { q.fixD = D; q.st = 'lateFix'; mark(); }   /* 그다음 날 마을이 흙막이를 세움(벌 X) */
      if (q.st === 'ok' && D > q.rep.d && !q.fixD) { q.fixD = D; q.st = 'fixed'; mark(); s.helper = (s.helper | 0) + 1; A.rec('case', { id: q.id, ev: 'fixed', d: D }); }
      if ((q.st === 'fixed' || q.st === 'lateFix') && D >= q.fixD + 4) { s.log.unshift({ id: q.id, d0: q.d0, st: q.st === 'fixed' ? 'ok' : 'late', fixD: q.fixD, hyp: q.hyp, wrong: q.wrong, rep: q.rep ? q.rep.ev : null }); s.log.length = Math.min(s.log.length, 10); s.done[q.id] = D; const nx = CASES[q.id].next; if (nx) s.seeds[nx] = D; s.cur = null; mark(); q = null; } }
    sync(); hotSync(); chipSync(); }

  // ───────── 모습(합친 부품) ─────────
  //   공사장 = 울타리(입구 하나 · 길 쪽) + 흙더미 셋 + 빗물 고랑(물가까지 흙빛 띠) + 공사 일꾼(이름 없는 역할 · 08~18시) · 흙막이 뒤 = 판 여섯 + 흙더미 덮개 · 고랑 X
  function partsSite(q, fixed) { return A.buildParts(put => {
    const W = 11, D = 9, H = 1.5, gap = 2.6;   /* 틀: z = 물 쪽(−) ~ 길 쪽(+) */
    for (const sg of [-1, 1]) put('b', sg * W / 2, 0, 0, 0.08, H, D, 0xe7d38a, 0, 0);   /* 옆 울타리 */
    put('b', 0, 0, -D / 2, W, H, 0.08, 0xe7d38a); put('b', -(W / 4 + gap / 4), 0, D / 2, W / 2 - gap / 2, H, 0.08, 0xe7d38a); put('b', W / 4 + gap / 4, 0, D / 2, W / 2 - gap / 2, H, 0.08, 0xe7d38a);   /* 물 쪽 · 길 쪽(가운데 입구) */
    for (let i = -2; i <= 2; i++) put('b', i * W / 4, H, D / 2 + 0.06, 0.1, 0.12, 0.1, 0x3a3a3a);
    const pile = (x, z, r, h) => fixed ? put('k', x, 0.02, z, r * 1.05, h * 0.9, 0, 0x3f6fa0) : put('k', x, 0.02, z, r, h, 0, 0x8a6a45);   /* 흙더미(흙빛) · 흙막이 뒤 = 파란 덮개 */
    pile(-2.6, -1.2, 2.0, 1.9); pile(1.4, -1.8, 1.7, 1.6); pile(2.8, 1.6, 1.3, 1.2);
    if (!fixed) for (let i = 0; i < 4; i++) put('b', -1.5 + i * 0.25, 0.01 + i * 0.004, -3.0 - i * 0.6, 0.35, 0.03, 0.7, 0x6b5233);   /* 울타리 안 빗물 고랑 */
    else { const zf = -D / 2 - 1.6; for (let i = -3; i <= 2; i++) put('b', i * 1.5 + 0.75, -0.15, zf, 1.4, 0.95, 0.06, i % 2 ? 0x3f6b3a : 0x4a7a44); for (let i = -3; i <= 3; i++) put('b', i * 1.5, -0.2, zf - 0.09, 0.09, 1.2, 0.09, 0x5a4632); }   /* 흙막이 판 여섯 + 말뚝 = 울타리 밖 물 쪽(밖에서 보이게) */
    put('b', W / 2 - 1.2, 0, D / 2 - 1.4, 0.06, 1.2, 0.06, 0x6a6e73); put('b', W / 2 - 1.2, 1.2, D / 2 - 1.4, 0.9, 0.55, 0.04, 0xf2c94c, 0, 0);   /* 안전 표지 */
  }); }
  function partsTrail(q) { const p = q.pl, st = p.site, tx = p.trail.x - st.x, tz = p.trail.z - st.z, l = Math.hypot(tx, tz) || 1, n = Math.max(2, Math.floor((l - 4.5) / 1.4)); return A.buildParts(put => {
    for (let i = 0; i < n; i++) { const t = 4.5 + i * 1.4, x = tx / l * t, z = tz / l * t, g = A.gy(st.x + x, st.z + z) - A.gy(st.x, st.z); put('b', x + Math.sin(i * 1.7) * 0.25, g + 0.02 + (i % 2) * 0.006, z, 0.55 + (i % 3) * 0.12, 0.03, 1.5, i % 2 ? 0x6b5233 : 0x7a5e3b, 0, Math.atan2(tx, tz)); } }); }
  function partsDrain() { return A.buildParts(put => { put('b', 0, -0.4, 0.1, 1.0, 0.9, 0.7, 0x9aa0a6); put('c', 0, 0.12, -0.25, 0.22, 0.9, 0, 0x7d858c, 0, 0, -Math.PI / 2); put('b', 0, -0.3, -1.2, 0.12, 0.42, 0.06, 0xbfe3f2); put('b', 0, -0.33, -1.5, 0.6, 0.03, 0.6, 0xbfe3f2); }); }
  function partsSign() { return A.buildParts(put => { put('b', 0, 0, -0.08, 0.08, 1.4, 0.08, 0x6a6e73); put('b', 0, 1.15, -0.02, 1.1, 0.75, 0.04, 0xfbfaf3); put('b', 0, 1.12, -0.047, 1.16, 0.81, 0.012, 0xe58a1f); }); }
  function signText(e) { const c = document.createElement('canvas'); c.width = 256; c.height = 176; const g = c.getContext('2d');
    g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, 256, 176); g.fillStyle = '#2b2420'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 30px ' + FONT; g.fillText(e ? 'Works vehicles' : '공사 차량', 128, 40); g.fillText(e ? 'coming and going' : '드나들어요', 128, 78); g.font = '700 21px ' + FONT; g.fillStyle = '#56606b'; g.fillText(e ? 'Levelling ground by the lake' : '호수 둘레 땅 고르기', 128, 120); g.fillText(e ? 'Please take care' : '조심해 주세요', 128, 150);
    const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2; const geo = new T3.PlaneGeometry(1.04, 0.7); const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ map: tx })); m.position.set(0, 1.525, 0.02); m.userData.own = 1; return m; }
  function partsMud() { return A.buildParts(put => { put('b', 0, 0.04, 0, 10, 0.04, 10, 0x7a5e3b); for (const [x, z, w] of [[-2.5, 1.8, 2.2], [2.2, -1.4, 1.8], [0.6, 3.1, 1.2], [-1.2, -2.8, 1.5]]) put('b', x, 0.085, z, w, 0.02, w * 0.7, 0x8f7552, 0, x * 0.3); }); }   /* 흙탕물이 덮은 논 한 칸(10m · 옅은 얼룩 넷) */
  function worker() { return A.buildParts(put => { for (const sg of [-1, 1]) put('b', sg * 0.09, 0, 0, 0.12, 0.8, 0.12, 0x3b4a5c); put('c', 0, 0.8, 0, 0.19, 0.55, 0, 0xf0a030); for (const sg of [-1, 1]) put('b', sg * 0.24, 0.86, 0.02, 0.08, 0.46, 0.08, 0xf0a030);
    put('s', 0, 1.5, 0, 0.16, 1, 0, 0xf2c9a0); put('c', 0, 1.58, 0, 0.19, 0.1, 0, 0xf5d020); put('s', 0, 1.62, 0, 0.17, 0.6, 0, 0xf5d020); }); }   /* 공사 일꾼(이름 없는 역할 · 노란 안전모 · 주황 조끼) */
  function drop(k) { const g = VIS[k]; if (!g) return; map.remove(g); g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.userData.own) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } } }); VIS[k] = null; }
  function put(k, key, mk, x, z, ry) { if (VKEY[k] === key) return; VKEY[k] = key; drop(k); if (!key) return; const g = mk(); g.position.set(x, A.gy(x, z), z); g.rotation.y = ry || 0; g.userData.fx = 1; map.add(g); g.updateMatrixWorld(true); VIS[k] = g; }
  function sync() { const q = S().cur, e = en(), p = q && q.pl, live = q && q.st !== 'done', fixed = !!(q && q.fixD && day() >= q.fixD), siteA = p ? Math.atan2(p.site.ux, p.site.uz) : 0, m9 = A.GAME.S.min | 0;
    put('site', live ? 'site:' + (fixed ? 1 : 0) + p.site.x : '', () => partsSite(q, fixed), p && p.site.x, p && p.site.z, siteA);
    put('trail', live && !fixed ? 'trail:' + p.trail.x : '', () => partsTrail(q), p && p.site.x, p && p.site.z, 0);
    put('drain', live ? 'drain:' + p.drain.x : '', () => partsDrain(), p && p.drain.x, p && p.drain.z, p ? Math.atan2(p.drain.ux, p.drain.uz) : 0);
    put('sign', live ? 'sign:' + p.sign.x + e : '', () => { const g = partsSign(); g.add(signText(e)); return g; }, p && p.sign.x, p && p.sign.z, p ? Math.atan2(p.sign.sx - p.sign.x, p.sign.sz - p.sign.z) : 0);
    put('mud', q && q.mudD > 0 && day() === q.mudD ? 'mud:' + q.mudD : '', () => partsMud(), p && p.mud.x, p && p.mud.z, 0);
    const wOn = live && m9 >= 8 * 60 && m9 < 18 * 60, gx = p ? p.site.x + p.site.ux * 6.2 + p.site.uz * 2.2 : 0, gz = p ? p.site.z + p.site.uz * 6.2 - p.site.ux * 2.2 : 0;
    put('wk', wOn ? 'wk:' + gx : '', () => worker(), gx, gz, siteA); }

  // ───────── E 자리(그 자리 · 빨간 선 X — 확인 자리만 빨간 선) ─────────
  function hot(k, on, x, z, label, use, r) { const key = on ? label + ':' + x + ':' + z : ''; if (HKEY[k] === key) return; HKEY[k] = key; if (HOT[k]) { HOT[k].remove(); HOT[k] = null; } if (!on) return; HOT[k] = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: r || 2.2, label, use }); }
  function hotSync() { const q = S().cur, e = en(), open = !!(q && q.st === 'open'), p = q && q.pl, m9 = A.GAME.S.min | 0;
    hot('site', open, p && p.site.x + p.site.ux * 0.8, p && p.site.z + p.site.uz * 0.8, '🔍 ' + (e ? 'Look at the soil heaps' : '흙더미 살펴보기'), () => clue('site', 'look'), 2.6);
    hot('drain', open, p && p.drain.x, p && p.drain.z, (q && q.hyp === 'fac' ? '🔎 ' : '🔍 ') + (e ? 'Look at the drain' : '배수구 살펴보기'), () => (q.hyp === 'fac' ? check('fac') : clue('drain', 'look')));
    hot('sign', open, p && p.sign.x, p && p.sign.z, '🔍 ' + (e ? 'Read the bus stop notice' : '정류장 안내판 읽기'), () => clue('sign', 'look'));
    hot('trail', open && q.hyp === 'site', p && p.trail.x, p && p.trail.z, '🔎 ' + (e ? 'Follow the muddy channel' : '흙물 자국 따라가 보기'), () => check('site'));
    hot('far', open && q.hyp === 'rain', p && p.far.x, p && p.far.z, '💧 ' + (e ? 'Compare the water here' : '여기 물 견주어 보기'), () => check('rain'));
    const tIn = (h0, h1) => () => { const m = A.GAME.S.min | 0; return m >= h0 * 60 && m < h1 * 60; }, mkT = tIn(8, 10), fmT = tIn(13, 18);   /* 누른 때의 시각으로 봄 */
    hot('market', open && !q.clues.market, p && p.market.x, p && p.market.z, '🗣 ' + (e ? 'Ask about the river' : '강 이야기 묻기'), () => talk('market', mkT()), 2.0);
    hot('farmer', open && !q.clues.farmer, p && p.farmer.x, p && p.farmer.z, '🗣 ' + (e ? 'Ask about the river' : '강 이야기 묻기'), () => talk('farmer', fmT()), 2.0);
    hot('wk', !!(q && (q.st === 'fixed' || q.st === 'lateFix') && VIS.wk), p && p.site.x + p.site.ux * 6.2 + p.site.uz * 2.2 + p.site.ux * 1.2, p && p.site.z + p.site.uz * 6.2 - p.site.ux * 2.2 + p.site.uz * 1.2, '🗣 ' + (e ? 'Talk to the site worker' : '공사 일꾼과 이야기하기'), () => react('wk'), 2.0); }
  const wkOut = i => { const w = (A.workers() || []).find(o => o.i === i); return !w || !!w.out9; };
  function talk(k, inTime) { const q = S().cur, e = en(); log('talk ' + k + ' ' + inTime + ' ' + (A.GAME.S.min | 0) + (A.panelOpen() ? ' panel' : '')); if (!q || A.panelOpen()) return; const p = q.pl[k];
    if (!inTime) { toast('🗣 ' + (k === 'market' ? (e ? 'Seller: “Busy now — come back in the morning, 8–10, when the market is lively.”' : '상인: "지금은 바빠요. 장터가 붐비는 아침 8~10시에 다시 와 줘요."') : (e ? 'Farmer: “I’m not here now — I work in the paddy 1–6 pm.”' : '논 일꾼: "지금은 쉬는 때예요. 오후 1~6시에 논에 있어요."')), 3.4); return; }
    if (wkOut(p.i)) { toast(e ? 'Nobody is here right now.' : '지금은 자리에 아무도 없어요.', 2.4); return; }
    A.bubble({ x: p.x, y: A.gy(p.x, p.z), z: p.z, sc: 1 }, L(CL[k].t).replace(/^[^:]+: /, '')); clue(k, 'talk'); if (!q.leads.includes(k)) q.leads.push(k); if (k === 'market' && !q.leads.includes('farm0')) q.leads.push('farm0'); mark(); }

  // ───────── 단서 얻기 ─────────
  function clue(k, how, quiet) { const q = S().cur, e = en(); if (!q || q.st !== 'open') return false; const neu = !q.clues[k];
    if (neu) { q.clues[k] = { d: day(), m: A.GAME.S.min | 0, how }; mark(); A.skUp('look', 1, 'case:' + q.id); A.rec('case', { id: q.id, ev: 'clue', k, how }); sfx('ding'); }
    if (!quiet) { const c = CL[k]; if (A.panelOpen()) A.closeP(); const P = A.openP('<h3>' + c.ic + ' ' + esc(c.f === 'fact' ? (e ? 'What I saw' : '본 것') : (e ? 'What I heard' : '들은 생각')) + '</h3><div class="pc-tx">' + esc(L(c.t)) + '</div><div class="sm">' + esc(neu ? (e ? 'Written in the notebook.' : '수첩에 적었어요.') : (e ? 'Already in the notebook.' : '벌써 수첩에 있어요.')) + (neu && nClue(q) === 3 && !q.hyp ? ' ' + esc(e ? 'Three clues — you can now pick a reason in the notebook.' : '단서가 셋이에요. 수첩에서 까닭을 골라 볼 수 있어요.') : '') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="nb">📒 ' + (e ? 'Notebook' : '수첩 보기') + '</button></div>', false, 'caseclue');
      P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'nb') notebook(); }; }
    return neu; }
  const nClue = q => Object.keys(q.clues).filter(k => k !== 'trail' && k !== 'far').length;

  // 💧 물 떠 보기(몸으로): 강·호숫가 물가(물에서 3.5m 안)에서만 · 앞서 뜬 곳과 30m 넘게 떨어져야 새로 셈 · 셋 이상 + 맑은 곳·흐린 곳이 다 있어야 단서
  function nearWater() { const q = S().cur; if (!q || q.st !== 'open' || A.away()) return false; const m = me(), sd = A.sd(m.x, m.z); if (!(sd > -1.2 && sd < 3.5)) return false;
    const p = q.pl; let dl = 1e9; for (let i = 1; i < p.line.length; i++) { const a = p.line[i - 1], b = p.line[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((m.x - a[0]) * dx + (m.z - a[1]) * dz) / l2)); dl = Math.min(dl, Math.hypot(a[0] + dx * t - m.x, a[1] + dz * t - m.z)); }
    return dl < 32 || edgeD(p.poly, m.x, m.z) < 8; }
  function sample() { const q = S().cur, e = en(); if (!q || A.panelOpen() || A.busy()) return; const m = me(); if (!nearWater()) { toast(e ? 'Go right to the water’s edge first.' : '물가 바로 앞까지 가야 물을 뜰 수 있어요.', 2.4); return; }
    const mm = murk(q, m.x, m.z), near = q.samples.find(o => Math.hypot(o.x - m.x, o.z - m.z) < 30), cell = A.cell(m.x, m.z);
    if (!near) { q.samples.push({ x: r2(m.x), z: r2(m.z), m: r2(mm), cell, d: day(), t: A.GAME.S.min | 0 }); mark(); sfx('pop'); A.rec('case', { id: q.id, ev: 'sample', m: r2(mm), cell }); }
    const S9 = q.samples, hasC = S9.some(o => o.m < 0.3), hasM = S9.some(o => o.m > 0.6), done = S9.length >= 3 && hasC && hasM;
    const hint = done ? '' : S9.length < 3 ? (e ? 'Take water at ' + (3 - S9.length) + ' more place(s), each 30 m or more apart.' : '30m 넘게 떨어진 곳에서 ' + (3 - S9.length) + '번 더 떠 봐요.') : !hasC ? (e ? 'All brown so far. Is it clearer farther away?' : '아직 모두 흐려요. 더 먼 물가는 어떨까요?') : (e ? 'All clear so far. Where does it get muddy?' : '아직 모두 맑아요. 어디부터 흐려질까요?');
    const P = A.openP('<h3>💧 ' + (e ? 'Water sample' : '물 떠 보기') + '</h3><canvas class="cs-cup" width="300" height="150" style="display:block;margin:4px auto;max-width:100%"></canvas><div class="pc-tx">' + esc((e ? 'Here (' + cell + '): ' : '여기(' + cell + ' 칸) 물: ') + L(murkWord(mm))) + (near ? ' <small>' + esc(e ? '(near a place you already sampled)' : '(앞서 뜬 곳과 가까워요)') + '</small>' : '') + '</div>'
      + '<div class="sm">' + esc(e ? 'Samples so far: ' : '지금까지 뜬 물: ') + S9.map(o => o.cell + ' ' + L(murkWord(o.m))).join(' / ') + '</div>' + (hint ? '<div class="sm">' + esc(hint) + '</div>' : '')
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="nb">📒 ' + (e ? 'Notebook' : '수첩 보기') + '</button></div>', false, 'casesmp');
    cup(P.querySelector('canvas'), S9.slice(-3), near ? null : S9[S9.length - 1]);
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'nb') notebook(); };
    if (done && !q.clues.sample) clue('sample', 'body', true); }
  function cup(cv, L9, cur) { if (!cv) return; const g = cv.getContext('2d'), e = en(); g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, 300, 150);
    L9.forEach((o, i) => { const x = 20 + i * 95, y = 22, w = 70, h = 96; g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h); const mx = o.m, r = Math.round(196 - 90 * mx), gg = Math.round(222 - 120 * mx), b = Math.round(236 - 170 * mx); g.fillStyle = 'rgb(' + r + ',' + gg + ',' + b + ')'; g.fillRect(x + 3, y + 22, w - 6, h - 25);
      g.fillStyle = 'rgba(40,30,20,' + (1 - mx).toFixed(2) + ')'; g.font = '800 14px ' + FONT; g.textAlign = 'center'; g.fillText(e ? 'ABC' : '가나다', x + w / 2, y + h - 12);   /* 바닥 글씨가 보이면 맑음(투명도 재기) */
      g.strokeStyle = o === cur ? '#2f6db5' : '#4a4038'; g.lineWidth = o === cur ? 4 : 2; g.strokeRect(x, y, w, h); g.fillStyle = '#2b2420'; g.font = '700 13px ' + FONT; g.fillText(o.cell, x + w / 2, y + h + 18); }); }

  // ───────── 까닭 고르기 → 확인 ─────────
  function hypPick() { const q = S().cur, e = en(), R = q && CASES[q.id]; if (!q || q.st !== 'open') return; if (nClue(q) < 3) { toast(e ? 'Find at least three clues first.' : '단서를 셋 넘게 모아야 까닭을 고를 수 있어요.', 2.6); return; }
    const H = R.hyps.slice().sort((a, b) => hashS(a.k + q.d0) - hashS(b.k + q.d0));
    const P = A.openP('<h3>🤔 ' + (e ? 'Pick a reason' : '까닭 고르기') + '</h3><div class="pc-tx">' + esc(e ? 'Which reason fits your clues best?' : '모은 단서로 보면 어떤 까닭이 가장 그럴듯해요?') + '</div><div class="sm">' + esc(e ? 'Then go and check it. A wrong guess costs time (90 min).' : '고른 까닭은 그 자리에 가서 확인해요. 틀리면 시간이 90분 흘러요.') + '</div>'
      + '<div class="cs-ch">' + H.map(h => '<button class="sub" data-h="' + h.k + '"' + (q.tried.includes(h.k) ? ' disabled style="opacity:.5"' : '') + '>' + esc(L(h.t)) + (q.tried.includes(h.k) ? esc(e ? ' (it was not this)' : ' (아니었어요)') : '') + '</button>').join('') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'casehyp');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } const k = b.dataset.h; if (!k || q.tried.includes(k)) return; q.hyp = k; mark(); A.closeP(); A.rec('case', { id: q.id, ev: 'hyp', k });
      const to = chkAt(q, k); A.guide([to.x, to.z], { icon: '🔎', name: e ? 'Check here' : '확인할 곳' }); toast(e ? 'Follow the red line to the place to check.' : '확인할 곳까지 빨간 선을 따라가요.', 2.6); }; }
  const chkAt = (q, k) => (k === 'fac' ? q.pl.drain : k === 'rain' ? q.pl.far : q.pl.trail);
  function check(k) { const q = S().cur, e = en(), R = q && CASES[q.id]; if (!q || q.st !== 'open' || q.hyp !== k || A.panelOpen()) return; const h = R.hyps.find(o => o.k === k); A.guideOff();
    if (!h.ok) { q.tried.push(k); q.wrong++; q.hyp = ''; spend(COST); clue(k === 'fac' ? 'drain' : 'far', 'check', true); A.rec('case', { id: q.id, ev: 'no', k }); sfx('tick');
      const P = A.openP('<h3>🔎 ' + (e ? 'Checked' : '확인해 봤어요') + '</h3><div class="pc-tx">' + esc(k === 'fac' ? (e ? 'The drain water is clear. It was not the factory.' : '배수구 물은 맑아요. 공장 때문은 아니었어요.') : (e ? 'The same rain fell here, yet the water is clear. Rain alone was not it.' : '여기도 비가 똑같이 왔는데 물이 맑아요. 비만으로는 아니었어요.')) + '</div><div class="sm cs-due">' + esc((e ? 'Checking took 90 min · ' : '확인하느라 90분이 흘렀어요 · ') + dueText(q)) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="h">🤔 ' + (e ? 'Pick another reason' : '다른 까닭 고르기') + '</button></div>', false, 'casechk');
      P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'h') hypPick(); }; return; }
    q.chk = day(); clue('trail', 'check', true); A.skUp('explore', 3, 'case:' + q.id + ':chk'); A.rec('case', { id: q.id, ev: 'yes', k }); sfx('ding');
    const P = A.openP('<h3>🔎 ' + (e ? 'That was it!' : '맞았어요!') + '</h3><div class="pc-tx">' + esc(L(CL.trail.t)) + '</div><div class="sm">' + esc(e ? 'Now write a report: pick two things you saw yourself, and hand it in at the community centre desk (9 am–6 pm).' : '이제 보고서를 내요. 직접 본 것 둘을 골라 행정복지센터 창구(09~18시)에 내요.') + '</div><div class="sm cs-due">' + esc(dueText(q)) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="way">🧭 ' + (e ? 'Way to the centre' : '행정복지센터 길 안내') + '</button></div>', false, 'casechk');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'way') { const hl = hallNear(); if (hl) { A.guide(hl.door, { icon: '🏛', name: e ? 'Community centre' : '행정복지센터' }); toast(e ? 'Follow the red line.' : '빨간 선을 따라가요.', 2.2); } } }; }
  function hallNear() { const H = A.halls ? A.halls() : [], m0 = me(); let b = null, bd = 1e18; for (const h of H) { const d = Math.hypot(h.door[0] - m0.x, h.door[1] - m0.z); if (d < bd) { bd = d; b = h; } } return b; }

  // ───────── 보고서(창구 · town_fix.js 탁자에서 부름) ─────────
  //   근거 둘(모은 단서를 섞어 보임 · 칸 이름 없이) → 직원: '생각'이면 되물음 · 본 것이지만 다른 까닭을 지운 것뿐이면 하나 더 · 맞으면 접수 + 낱말 둘
  function desk(h) { const q = S().cur, e = en(); if (!q || q.st !== 'open' || !q.chk) return false; if (A.panelOpen() || A.busy()) return true; const R = CASES[q.id];
    const K = Object.keys(q.clues).sort((a, b) => hashS(a + q.d0 + 'r') - hashS(b + q.d0 + 'r')); let pick = [], msg = '';
    const draw = () => '<h3>📝 ' + (e ? 'Case report: ' : '사건 보고서: ') + esc(L(R.t)) + '</h3><div class="pc-tx">' + esc(e ? 'Clerk: “Why did the river get muddy? Pick two pieces of evidence.”' : '직원: "강물이 왜 흐려졌나요? 근거를 두 가지 골라 주세요."') + '</div>'
      + '<div class="sm">' + esc((e ? 'Reason: ' : '까닭: ') + L(R.hyps.find(o => o.ok).t)) + '</div><div class="cs-ch">' + K.map(k => '<button class="sub' + (pick.includes(k) ? ' on' : '') + '" data-k="' + k + '">' + CL[k].ic + ' ' + esc(L(CL[k].t)) + '</button>').join('') + '</div>'
      + '<div class="sm" data-m style="color:#a2541b;font-weight:700">' + esc(msg) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button><button data-a="go"' + (pick.length === 2 ? '' : ' disabled style="opacity:.5"') + '>📮 ' + (e ? 'Hand in' : '내기') + '</button></div>';
    const P = A.openP(draw(), false, 'caserep'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.k) { const k = b.dataset.k; pick = pick.includes(k) ? pick.filter(o => o !== k) : pick.concat(k).slice(-2); msg = ''; paint(); return; }
      if (b.dataset.a === 'go' && pick.length === 2) { q.repTry++; mark(); const idea = pick.find(k => CL[k].f === 'idea');
        if (idea) { msg = (e ? 'Clerk: “' : '직원: "') + L(idea === 'market' ? T2('그건 장터 상인의 생각이에요. 직접 보거나 뜬 것으로 골라 줄래요?', 'That is what the seller thinks. Can you pick something you saw or measured yourself?') : T2('그건 논 일꾼의 생각이에요. 직접 본 것으로 골라 줄래요?', 'That is what the farmer thinks. Can you pick something you saw yourself?')) + (e ? '”' : '"'); sfx('tick'); A.rec('case', { id: q.id, ev: 'repIdea', k: idea }); pick = pick.filter(k => k !== idea); paint(); return; }
        if (!pick.some(k => R.sup.includes(k))) { msg = e ? 'Clerk: “Those show what it was NOT. Add one that shows it was the site soil.”' : '직원: "그건 다른 까닭이 아니라는 근거예요. 공사장 흙이라는 걸 보여 주는 것도 하나 골라 줘요."'; sfx('tick'); pick = []; paint(); return; }
        q.rep = { d: day(), m: A.GAME.S.min | 0, ev: pick.slice() }; q.st = 'ok'; mark(); A.skUp('explore', 4, 'case:' + q.id + ':rep'); A.rec('case', { id: q.id, ev: 'rep', k: pick, tries: q.repTry, wrong: q.wrong }); sfx('ding');
        const bx = P.querySelector('.bx'); (bx || P).innerHTML = '<h3>📝 ' + (e ? 'Report received' : '보고서를 받았어요') + '</h3><div class="pc-tx">' + esc(e ? 'Clerk: “Thank you. Tomorrow we will put up silt fences at the site with the builders.”' : '직원: "고마워요. 내일 공사하는 분들과 함께 공사장에 흙막이를 세울게요."') + '</div><div class="cs-wd">' + R.words.map(w => '<div>📖 <b>' + esc(L(w[0])) + '</b> = ' + esc(L(w[1])) + '</div>').join('') + '</div><div class="row"><button data-a="x">' + (e ? 'OK' : '좋아요') + '</button></div>'; } };
    return true; }

  // ───────── 수첩 창 ─────────
  function notebook() { const q = S().cur, e = en(); if (!q) { toast(e ? 'No case right now.' : '지금은 사건이 없어요.', 2); return; } if (A.panelOpen()) A.closeP(); const R = CASES[q.id];
    const col = f => Object.keys(q.clues).filter(k => CL[k].f === f).map(k => '<div>' + CL[k].ic + ' ' + esc(L(CL[k].t)) + '</div>').join('') || '<div class="sm">' + esc(e ? '(nothing yet)' : '(아직 없어요)') + '</div>';
    const leads = q.leads.flatMap(k => (LEAD[k] ? LEAD[k](q.pl) : [])).map(t => '<div class="cs-ld">· ' + esc(L(t)) + '</div>').join('');
    const res = resultHtml(q); const st = q.st;
    const P = A.openP('<h3>📒 ' + (e ? 'Case notebook: ' : '사건 수첩: ') + esc(L(R.t)) + '</h3><div class="pc-tx">' + esc((e ? 'Task: ' : '할 일: ') + L(R.q)) + '</div>'
      + (st === 'open' ? '<div class="sm cs-due">' + esc(dueText(q)) + (q.hyp ? esc(e ? ' · checking: ' : ' · 확인하러 가는 까닭: ') + esc(L(R.hyps.find(o => o.k === q.hyp).t)) : '') + (q.chk ? esc(e ? ' · report: community centre desk' : ' · 보고서: 행정복지센터 창구') : '') + '</div>' : '')
      + '<div class="cs-g"><div class="cs-c"><h4>👀 ' + (e ? 'What I saw (facts)' : '본 것(사실)') + '</h4>' + col('fact') + '</div><div class="cs-c idea"><h4>🗣 ' + (e ? 'What I heard (ideas)' : '들은 생각') + '</h4>' + col('idea') + '</div></div>'
      + (q.samples.length ? '<canvas class="pc-map" width="560" height="220"></canvas>' : '') + (st === 'open' ? '<div class="grp">' + (e ? 'Where to look' : '알아볼 곳') + '</div>' + leads : '') + res
      + '<div class="cs-wd">' + R.words.map(w => '<div>📖 <b>' + esc(L(w[0])) + '</b> = ' + esc(L(w[1])) + '</div>').join('') + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button>' + (st === 'open' && !q.chk ? '<button data-a="h"' + (nClue(q) >= 3 ? '' : ' disabled style="opacity:.5"') + '>🤔 ' + (e ? 'Pick a reason' : '까닭 고르기') + (nClue(q) >= 3 ? '' : esc(e ? ' (3 clues)' : ' (단서 셋부터)')) + '</button>' : '') + (st === 'open' && q.hyp ? '<button class="sub" data-a="way">🧭 ' + (e ? 'Way to check' : '확인할 곳 길') + '</button>' : '') + '</div>', false, 'case');
    const cv = P.querySelector('canvas'); if (cv) A.mapSnip(cv, q.samples.map((o, i) => ({ x: o.x, z: o.z, label: (i + 1) + ' ' + L(murkWord(o.m)), main: o.m > 0.6 })));
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'h') hypPick(); else if (b.dataset.a === 'way' && q.hyp) { const to = chkAt(q, q.hyp); A.guide([to.x, to.z], { icon: '🔎', name: e ? 'Check here' : '확인할 곳' }); } }; return P; }
  function resultHtml(q) { const e = en(), D = day(); if (q.st === 'open') return '';
    if (q.st === 'ok') return '<div class="grp">' + (e ? 'Waiting for' : '기다리는 것') + '</div><div class="cs-ld">' + esc(e ? 'Tomorrow morning: silt fences at the site.' : '내일 아침: 공사장에 흙막이가 서요.') + '</div>';
    const late = q.st === 'late' || q.st === 'lateFix', mudNow = q.mudD > 0 && D === q.mudD, H = [];
    if (late) H.push(e ? 'The report was late. ' : '보고가 늦었어요. ', mudNow || q.mudD > 0 ? (e ? 'In the heavy rain, muddy water ran down the canal into one rice paddy for a day. ' : '큰비 오는 날 흙탕물이 농수로를 타고 논 한 칸에 하루 들어갔어요. ') : '', e ? 'Next time, tell the centre sooner.' : '다음엔 더 빨리 알려 줘요.');
    const fx = q.fixD && D >= q.fixD; const F = fx ? [e ? 'Six silt-fence boards stand at the site, and the soil heaps are covered.' : '공사장에 흙막이 판 여섯 장이 섰고, 흙더미에 덮개를 덮었어요.', e ? 'The water gets a little clearer each day.' : '물이 하루하루 조금씩 맑아져요.'] : [];
    const I = fx ? [e ? 'Rice farmer: “The canal water will be clear for the paddy. Good!”' : '논 일꾼: "농수로 물이 맑아지면 논이 좋아하겠어요."', e ? 'Site worker: “The fences slowed our work by a day. Still, it had to be done.”' : '공사 일꾼: "흙막이를 세우느라 공사가 하루 늦어졌어요. 그래도 했어야 할 일이지요."'] : [];
    return '<div class="grp">' + (e ? 'What happened' : '어떻게 되었나') + '</div>' + (H.length ? '<div class="cs-ld">' + esc(H.join('')) + '</div>' : '') + (F.length ? '<div class="cs-g"><div class="cs-c"><h4>👀 ' + (e ? 'Facts' : '본 것') + '</h4>' + F.map(t => '<div>' + esc(t) + '</div>').join('') + '</div><div class="cs-c idea"><h4>🗣 ' + (e ? 'Ideas' : '생각') + '</h4>' + I.map(t => '<div>' + esc(t) + '</div>').join('') + '</div></div><div class="cs-ld">' + esc(e ? 'In our real town: is there a silt fence at the building sites near us?' : '우리 진짜 동네라면? 가까운 공사장에 흙막이가 있는지 살펴봐요.') + '</div>' : ''); }
  function react(k) { const q = S().cur, e = en(); if (!q || k !== 'wk' || !VIS.wk) return; const g = VIS.wk.position; A.bubble({ x: g.x, y: g.y, z: g.z, sc: 1 }, e ? 'The fences slowed us by a day. Still, it had to be done.' : '흙막이 세우느라 하루 늦어졌어요. 그래도 했어야 할 일이지요.'); }

  // ───────── 칩 · 위 가운데 줄 · 하루 마무리 · 소식 · 찾기 ─────────
  function chipSync() { const q = S().cur, e = en(); let k = ''; let t = null, fn = null;
    if (q && q.st === 'open') { if (nearWater()) { t = '💧 ' + (e ? 'Take a water sample' : '여기 물 떠 보기'); fn = () => sample(); k = 'w'; } else { t = '📒 ' + L(CASES[q.id].t) + ' · ' + dueText(q); fn = () => notebook(); k = 'n:' + t; } }
    else if (q && (q.st === 'ok' || ((q.st === 'fixed' || q.st === 'lateFix' || q.st === 'late') && day() <= (q.fixD || q.late) + 1))) { t = '📒 ' + L(CASES[q.id].t) + (e ? ' · result' : ' · 결과 보기'); fn = () => notebook(); k = 'r:' + q.st; }
    if (k === CHIPK) return; CHIPK = k; A.chip('twn-case', t, t ? { onClick: fn } : undefined); }
  function line() { const q = S().cur; if (!q || q.st !== 'open') return ''; return CASES[q.id].icon + ' ' + L(CASES[q.id].t) + ' · ' + dueText(q); }
  function recapLine(d) { const q = S().cur, e = en(); if (!q) return ''; const R = CASES[q.id];
    if (q.st === 'open') return '📒 ' + (e ? 'Waiting tomorrow: ' : '내일 기다리는 것: ') + L(R.t) + ' — ' + (q.d0 + R.days - 1 - d === 1 ? (e ? 'tomorrow is the last day' : '내일이 마지막 날이에요') : q.d0 + R.days - 1 - d <= 0 ? (e ? 'today was the last day' : '오늘이 마지막 날이었어요') : (e ? (q.d0 + R.days - 1 - d + 1) + ' days left' : (q.d0 + R.days - 1 - d + 1) + '일 남았어요'));
    if ((q.st === 'ok' || q.st === 'fixed') && q.rep && q.rep.d === d) return '📒 ' + (e ? 'Tomorrow morning: see the silt fences at the building site' : '내일 아침: 공사장에 흙막이가 서는지 보러 가요');
    return ''; }
  function news(d) { const q = S().cur, out = []; if (!q) return out; const R = CASES[q.id], p = q.pl;
    if (q.st === 'open' && q.d0 === d) out.push({ k: 'case:' + q.id, two: 1, t: T2('🌊 비 사흘 뒤 강물이 흙빛이에요. 왜 그럴까요?', '🌊 After three days of rain the river is brown. Why?'), at: null });
    if (q.st === 'fixed' && q.fixD === d) out.push({ k: 'case:' + q.id, t: T2('🚧 어제 낸 보고서대로 ' + p.site.cell + ' 칸 공사장에 흙막이를 세웠어요. 강물이 조금씩 맑아질 거예요', '🚧 As you reported, silt fences went up at the site in ' + p.site.cell + '. The river will slowly clear'), at: [p.site.x, p.site.z] });
    if (q.mudD > 0 && q.mudD === d) out.push({ k: 'case:' + q.id + ':mud', two: 1, t: T2('🌧 큰비에 흙탕물이 농수로를 타고 ' + A.cell(p.mud.x, p.mud.z) + ' 칸 논 한 곳에 들어갔어요', '🌧 In the heavy rain, muddy water ran down the canal into a paddy in ' + A.cell(p.mud.x, p.mud.z)), at: [p.mud.x, p.mud.z] });
    if (q.st === 'lateFix' && q.fixD === d) out.push({ k: 'case:' + q.id, t: T2('🚧 행정복지센터가 ' + p.site.cell + ' 칸 공사장에 흙막이를 세웠어요. 다음엔 더 빨리 알려 줘요', '🚧 The centre put up silt fences at the site in ' + p.site.cell + '. Next time, tell them sooner'), at: [p.site.x, p.site.z] });
    void R; return out; }
  function findList() { const q = S().cur, e = en(); if (!q || q.st !== 'open') return []; const L9 = [];
    if (q.hyp) { const to = chkAt(q, q.hyp); L9.push({ icon: '🔎', t: e ? 'Check the reason (' + L(CASES[q.id].t) + ')' : '까닭 확인하기 · ' + L(CASES[q.id].t), at: [to.x, to.z] }); }
    if (q.chk) { const h = hallNear(); if (h) L9.push({ icon: '📝', t: e ? 'Hand in the case report' : '사건 보고서 내기 · 행정복지센터', at: h.door }); }
    return L9; }
  // 물빛(WATER-1 값 덮기): 사건이 풀리기 전 = 흙탕 그대로(0.75 아래로 안 내려감) · 흙막이 뒤 = 하루씩 맑아짐
  function water(W) { const q = S().cur; if (!q || !W || OFF || W.lv < 0) return W;   /* 가뭄(−)은 덮지 않음 */ const D = day(); let f = null;
    if (q.st === 'open' || q.st === 'ok' || q.st === 'late') f = 0.75; else if (q.fixD) { const n = D - q.fixD; f = n <= 0 ? 0.75 : n === 1 ? 0.5 : n === 2 ? 0.25 : null; }
    if (q.mudD > 0 && D === q.mudD) f = 1;
    if (f != null && !(W.lv >= f)) W.lv = f; return W; }
  // 날씨 창이 열리면 = 비 기록(본 것)
  function onWx(P) { const q = S().cur, e = en(); if (!q || q.st !== 'open' || !P) return; const W = A.wxLog ? A.wxLog() : {}, D = day(), row = [];
    for (let k = D - 3; k <= D - 1; k++) row.push(W[k] === 'rain' ? '🌧' : W[k] === 'snow' ? '❄️' : W[k] ? '☀️' : '·');
    const div = document.createElement('div'); div.className = 'sm'; div.dataset.case = '1'; div.style.cssText = 'margin:6px 0;padding:6px 8px;border:2px dashed #c9b27a;border-radius:10px;background:#fffdf2'; div.textContent = '📒 ' + (e ? 'Rain record, last 3 days: ' : '지난 사흘 날씨 기록: ') + row.join(' ') + (e ? ' — written in the notebook' : ' — 수첩에 적었어요');
    const bx = P.querySelector('.bx') || P, h3 = bx.querySelector('h3'); if (h3 && h3.nextSibling) bx.insertBefore(div, h3.nextSibling.nextSibling || null); else bx.appendChild(div);
    if (row.filter(t => t === '🌧').length >= 3) clue('rain', 'wx', true); }
  // 📷 사진(K): 셔터 그 프레임 — 물가면 물 떠 보기와 같이 셈 X(창은 안 띄움) · 공사장 울타리 안이면 흙더미 단서
  function photo() { const q = S().cur; if (!q || q.st !== 'open') return; const p = q.pl; if (dist(p.site.x, p.site.z) < 7) clue('site', 'photo', true); else if (dist(p.sign.x, p.sign.z) < 4) clue('sign', 'photo', true); else if (dist(p.drain.x, p.drain.z) < 5) clue('drain', 'photo', true); }
  function dayLine() { return line(); }
  // town_day.js 손잡이: wait = 하루 마무리 '내일 기다리는 것' 한 줄 · due = 오늘 때 목록(마지막 날 18:00) · key = 때 목록 다시 셀 열쇠 — 단서 자리 길(p)은 주지 않음(빨간 선 X · 창구·흙막이만)
  const hallP = () => { const h = hallNear(); return h ? { icon: '🏛', name: en() ? 'Community centre' : '행정복지센터', door: h.door } : null; };
  function wait(d) { const q = S().cur; if (!q) return null; const R = CASES[q.id], last = q.d0 + R.days - 1;
    if (q.st === 'open') { const left = last - d; return { ic: R.icon, s: T2(L9(R.t) + ' 기한', 'Case due'), t: left === 1 ? T2(L9(R.t) + ': 내일이 마지막 날이에요(창구 18시까지)', L9(R.t, 1) + ': tomorrow is the last day (desk until 6 pm)') : left <= 0 ? T2(L9(R.t) + ': 기한이 지났어요', L9(R.t, 1) + ': past the deadline') : T2(L9(R.t) + ': 오늘 말고 ' + left + '일 남았어요', L9(R.t, 1) + ': ' + left + ' more days'), p: q.chk ? hallP() : null }; }
    if ((q.st === 'ok' || q.st === 'fixed') && q.rep && q.rep.d === d) return { ic: '🚧', s: T2('흙막이', 'Silt fence'), t: T2('낸 보고서대로 공사장에 흙막이가 서요', 'Silt fences go up at the site, as you reported'), p: { icon: '🚧', name: en() ? 'building site' : '공사장', door: [q.pl.site.x + q.pl.site.ux * 7, q.pl.site.z + q.pl.site.uz * 7] } };
    return null; }
  function due(d) { const q = S().cur; if (!q || q.st !== 'open' || q.d0 + CASES[q.id].days - 1 !== d) return null; const R = CASES[q.id]; return { m: DUE_H * 60, ic: '📒', s: T2(L9(R.t) + ' 기한', 'Case due'), t: T2(L9(R.t) + ' 보고서 기한(행정복지센터 창구 18시까지)', L9(R.t, 1) + ' report due (community centre desk until 6 pm)'), p: q.chk ? hallP() : null }; }
  const L9 = (t, i) => t[i || 0];
  function key() { const q = S().cur; return q ? q.id + q.st + q.d0 + (q.chk ? 'c' : '') : ''; }
  function dispose() { dead = true; for (const k of Object.keys(VIS)) drop(k); for (const k of Object.keys(HOT)) if (HOT[k]) HOT[k].remove(); HOT = {}; A.chip('twn-case', null); if (css) { css.remove(); css = null; } }
  const meshN = g => { let n = 0; if (g) g.traverse(o => { if (o.isMesh) n++; }); return n; };
  return { sec, line, dayLine, wait, due, key, recapLine, news, findList, water, onWx, photo, desk, notebook, dispose, get on() { const q = S().cur; return !!(q && q.st === 'open'); },
    info: () => { const s = S(), q = s.cur; return { cur: q ? JSON.parse(JSON.stringify(q)) : null, d: s.d, done: { ...s.done }, seeds: { ...s.seeds }, log: s.log.slice(0, 3), helper: s.helper, due: q ? dueAt(q) : null, now: now(), dueT: q ? dueText(q) : '', line: line(), chip: CHIPK, near: nearWater(),
      meshes: Object.fromEntries(Object.keys(VIS).map(k => [k, meshN(VIS[k])])), hots: Object.fromEntries(Object.keys(HOT).filter(k => HOT[k]).map(k => [k, HKEY[k]])), dbg: DBG.slice() }; },
    dbg: { plan: () => { const s = S(); s.cur = null; s.d = -1; s.done = {}; return plan(true); }, planNat: () => { const s = S(); s.cur = null; s.d = -1; s.done = {}; return plan(false); }, sample: () => sample(), murk: (x, z) => { const q = S().cur; return q ? murk(q, x, z) : null; }, sync: () => { sec(); return { ...VKEY }; }, clear: () => { const s = S(); s.cur = null; s.d = -1; s.done = {}; mark(); sec(); }, off: v => { OFF = !!v; sec(); return OFF; } } };   /* off = 물 높이만 재는 시험(town_water.cjs)이 사건 없이 */
}
