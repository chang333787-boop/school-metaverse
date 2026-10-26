// 🦕 오늘 드러난 바위 · 시대 차례 놓기(DEPTH-3 · docs/systems/town_depth.md 화석·화산·섬 줄 · 사용자 10-25 '깊이가 한 칸')
//   첫 발견 뒤에도 다시 갈 까닭 = 세상 일(물때·비·계절)에 따라 열리는 자리가 바뀜 — REGEN-1(큰비 다음 날 층층골 새 흙더미)과 겹치지 않게 다른 곳·다른 때
//     🌊 썰물섬 갯바위(썰물 때 섬에 건너가야 닿음) — 그날 드러난 결(물결 자국 · 조개 자국)이 날마다 다름
//     ⛰ 까망봉 비탈(비가 오거나 온 다음 날) — 빗물이 흙을 씻어 검은 현무암이 자갈층을 덮은 자리가 드러남
//     ❄ 층층골 벽 밑(겨울·봄) — 틈에 스민 물이 얼었다 녹으며 떨어진 조각 · 어느 띠 조각인지 날마다 다름
//   판단 = ⏳ 시대 차례 놓기(지층 기둥 창의 단추): 모은 것 가운데 셋(→ 넷 → 까망봉 현무암까지)을 오래된 것부터 차례로 누름 · 볼 자료(지층 기둥)는 같은 창 안에
//     아래에 있을수록 먼저 쌓임(지층 쌓임의 법칙) · 까망봉 현무암은 맨 위 자갈층을 덮었으니 그보다 나중 — 틀리면 벌 X = 그 조각이 기둥 어디인지 한 줄 + 처음부터 다시
//     판마다 놓을 것이 다름(씨앗 = 날 · 몇 번째 판 · 바로 앞 판과 같은 묶음 X) · 칸 = 두 판 뒤 넷 · 네 판 뒤 현무암까지
//   저장 GAME.S.oc = { v, got: { 조각 id: { band, d } }, seen: { 자리: 날 }, said: { 자리: 날 }, r: { n, last, h: [묶음] } } · 보상 = 솜씨만(xp:oc · xp:order → rwCheck)
//   지킴: 사실만(풍화·침식·지층 쌓임) · 판타지 X · 매 프레임 일 0(1초 칸 sec) · 새 Light X · 그리기 = 자리마다 작은 합친 부품 하나(열린 날만 보임) · 줄 가운데 // X
import { BANDS, FINDS } from './town_xp.js?v=8';
export const OC_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = s => { let a = hashS(s) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b; };
const LAVA = { hex: 0x2f2b2a, t: T2('까망봉 현무암', 'Kkamang basalt') };   /* band −1 = 맨 위 자갈층을 덮은 용암(층층골 띠보다 나중) */
const bandName = (b, en) => (b < 0 ? LAVA.t : BANDS[b].t)[en ? 1 : 0];
const bandHex = b => (b < 0 ? LAVA.hex : BANDS[b].hex);
// 자리 셋: 열리는 때 · 그날 드러난 것(갈래 둘 이상 · 날마다 고름)
export const SITES = {
  tide: { ic: '🌊', t: T2('썰물섬 갯바위', 'Ebb-Tide Isle shore rock'), when: T2('썰물 때 섬에 건너가면', 'at low tide, on the island'),
    v: [{ id: 't1', band: 2, t: T2('물결 자국 갯바위', 'Ripple-marked rock'), see: T2('얕은 물 밑에서 물결이 만든 무늬가 바위에 굳었어요. 층층골 진흙층의 물결 자국과 같은 무늬예요.', 'Ripples made under shallow water are set in the rock — the same pattern as the mud layer at Layer Gorge.') },
      { id: 't2', band: 3, t: T2('조개 자국 갯바위', 'Shell-print rock'), see: T2('조개껍데기 자국이 바위에 가득해요. 층층골 조개 화석층과 같은 결이에요.', 'The rock is full of shell prints — the same as the shell fossil layer at Layer Gorge.') }] },
  rain: { ic: '⛰', t: T2('까망봉 비탈', 'Kkamang Cone slope'), when: T2('비가 오거나 온 다음 날', 'on a rainy day or the day after'),
    v: [{ id: 'r1', band: -1, t: T2('자갈을 덮은 현무암', 'Basalt over gravel'), see: T2('빗물이 흙을 씻어 내 비탈 아래가 드러났어요. 검은 현무암이 둥근 자갈층 위를 덮고 있어요. 용암이 자갈층 위로 흘러와 굳었어요.', 'Rain washed the soil away. Black basalt lies on top of a round-gravel layer — lava flowed over the gravel and set.') },
      { id: 'r2', band: -1, t: T2('자갈 위 송이 층', 'Scoria on gravel'), see: T2('빗물에 씻긴 자리에 붉은 송이가 자갈층 위에 쌓여 있어요. 화산이 터질 때 날아와 쌓였어요.', 'Where the rain washed it, red scoria lies on top of the gravel. It flew out and piled up when the volcano erupted.') }] },
  frost: { ic: '❄', t: T2('층층골 벽 밑', 'Foot of the Layer Gorge wall'), when: T2('겨울과 봄', 'in winter and spring'),
    v: [0, 1, 2, 3, 4].map(b => ({ id: 'c' + b, band: b, t: T2(BANDS[b].t[0] + ' 조각', 'Piece of the ' + BANDS[b].t[1].toLowerCase()), see: T2('벽 틈에 스민 물이 얼면 부피가 커져 틈이 벌어져요. 날이 풀리자 ' + BANDS[b].t[0] + ' 조각이 떨어졌어요.', 'Water in a crack swells when it freezes and pushes the crack open. When it warmed up, a piece of the ' + BANDS[b].t[1].toLowerCase() + ' fell off.') })) },
};

// A: GAME · map · lang() · esc · openP · closeP · panelOpen() · say(t, s, lv) · sfx · tone · skUp(k, n, src) · diary(e, t) · on() · busy()
//    xp() 탐험 땅 모듈(api.edges · api.isleAt) · root() · parts(fn) · gy(x, z) · cond() { low: 썰물섬 바닷길 열림, rain: 비 오거나 온 다음 날, sea: 계절 }
export function createOutcrop(A) {
  const en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t), map = A.map;
  const S = () => { const g = A.GAME.S; let s = g.oc; if (!s || typeof s !== 'object' || s.v !== OC_V) s = g.oc = { v: OC_V, got: {}, seen: {}, said: {}, r: { n: 0, last: '', h: [] } }; for (const k of ['got', 'seen', 'said']) if (!s[k] || typeof s[k] !== 'object') s[k] = {}; if (!s.r || typeof s.r !== 'object') s.r = { n: 0, last: '', h: [] }; return s; };
  const day = () => A.GAME.S.day | 0, mark = () => A.GAME.mark();
  let P = null, ovr = null, dead = false, B = null;   /* P = 자리 셋 { k, x, y, z, g 부품, h E } · ovr = 시험이 정한 조건 · B = 지금 시대 차례 판 */
  const cond = () => ovr || A.cond();
  const openOf = k => { const c = cond(); return k === 'tide' ? !!c.low : k === 'rain' ? !!c.rain : c.sea === 'winter' || c.sea === 'spring'; };
  const varOf = k => { const V = SITES[k].v; return V[hashS('oc:' + k + ':' + day()) % V.length]; };   /* 그날 드러난 것(날마다 다름) */

  // ───────── 자리 잡기 · 짓기(탐험 땅이 지어진 뒤 · 마을을 다시 지으면 새로) ─────────
  function place() { const X = A.xp(), R0 = A.root(); if (!X || !X.on || !X.api || !R0) return null; const E = X.api.edges(), out = [];
    const g = E.find(e => e.k === 'gorge'), c = E.find(e => e.k === 'crater'), il = E.find(e => e.k === 'isle');
    if (g) out.push({ k: 'frost', x: g.wall + 1.15, z: g.gz0 + 20 });
    const H9 = (map.interact.list ? map.interact.list() : []).filter(h => !h.off), clr = (x, z) => !H9.some(h => Math.hypot(h.x - x, h.z - z) < 3.6);   /* 다른 E 자리(까망봉 돌 살펴보기 등)와 떼기 */
    if (c) { let q = null; for (const r of [7.5, 6]) for (const a of [0.62, 1.2, -0.62, -1.2, 2.0, -2.0]) { const x = c.cx + Math.sin(a) * r, z = c.cz - Math.cos(a) * r; if (!q && clr(x, z)) q = { k: 'rain', x, z }; } if (q) out.push(q); }   /* 분화구 바닥(평평한 곳) */
    if (il) { const [cx, cz] = il.C, bd = il.bird, pl = il.pool; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.2832, x = cx + Math.cos(a) * 15, z = cz + Math.sin(a) * 15; if (Math.hypot(x - bd[0], z - bd[1]) < 17 || Math.hypot(x - pl[0], z - pl[1]) < 7 || X.api.isleAt(x, z) !== 'isle') continue; out.push({ k: 'tide', x, z }); break; } }
    for (const s of out) s.y = A.gy(s.x, s.z); return out.filter(s => Number.isFinite(s.y)); }
  function build() { const R0 = A.root(), L9 = place(); if (!L9) return; P = { root: R0, list: [] };
    for (const s of L9) { const R = rng('ocb:' + s.k), cols = s.k === 'tide' ? [0x5f5a52, 0x6f6a62, 0x7c766c] : s.k === 'rain' ? [0x2f2b2a, 0x3a3533, 0x8f4b35] : [0x9b958b, 0x86684f, 0xcbbb9e];
      s.g = A.parts(put => { for (let i = 0; i < 6; i++) { const a = i * 1.05 + R() * 0.4, r = 0.4 + R() * 0.9; put('s', s.x + Math.cos(a) * r, s.y + 0.05, s.z + Math.sin(a) * r, 0.22 + R() * 0.3, 0.45, 0, cols[i % 3]); }   /* 낮은 돌 여섯(바닥에 반쯤 묻힘) */
        if (s.k === 'tide') for (let i = 0; i < 4; i++) put('b', s.x, s.y + 0.2, s.z - 0.3 + i * 0.2, 0.9, 0.02, 0.05, 0xb5a37b);   /* 물결 무늬 줄 */
        else if (s.k === 'rain') { put('b', s.x, s.y + 0.02, s.z, 1.4, 0.18, 0.9, 0x9b958b); put('b', s.x, s.y + 0.2, s.z, 1.3, 0.2, 0.8, 0x2f2b2a); }   /* 자갈층 위 검은 덮개 */
        else put('b', s.x + 0.5, s.y + 0.02, s.z + 0.2, 0.5, 0.22, 0.4, 0xb5a890); });   /* 떨어진 조각 */
      s.g.visible = false; R0.add(s.g);
      s.h = map.interact.add({ kind: 'game', x: s.x, z: s.z, y: s.y + 0.4, r: 2.0, label: SITES[s.k].ic + ' ' + (en() ? 'Look at the rock that showed up today' : '오늘 드러난 바위 살펴보기'), use: () => look(s.k) }); if (s.h.hot) s.h.hot.off = true;
      P.list.push(s); }
    vis(); }
  function vis() { if (!P) return; for (const s of P.list) { const o = openOf(s.k); s.g.visible = o; if (s.h && s.h.hot) s.h.hot.off = !o; } }
  function clear() { if (P) for (const s of P.list) { if (s.g && s.g.parent) s.g.parent.remove(s.g); if (s.h) s.h.remove(); } P = null; }

  // ───────── 살펴보기 창 · 모으기 ─────────
  function look(k) { if (!openOf(k)) return; if (A.busy() && !A.panelOpen()) return; const v = varOf(k), s = S(), e = en(), neu = !s.got[v.id], first = s.seen[k] !== day();
    if (neu) s.got[v.id] = { band: v.band, d: day() }; if (first) { s.seen[k] = day(); A.skUp('look', neu ? 3 : 1, 'xp:oc'); A.diary(SITES[k].ic, (e ? 'Saw today’s rock: ' : '오늘 드러난 바위를 봤어요: ') + L(v.t)); } mark();
    if (A.sfx) A.sfx('tick'); if (neu && A.tone) { A.tone(784, 0, 0.08, 'triangle', 0.05); A.tone(1047, 0.1, 0.1, 'triangle', 0.05); }
    const sw = '<span style="display:inline-block;width:26px;height:18px;vertical-align:-4px;border:2px solid #2b2420;border-radius:4px;background:#' + bandHex(v.band).toString(16).padStart(6, '0') + '"></span>';
    const P9 = A.openP('<h3>' + SITES[k].ic + ' ' + esc(L(v.t)) + '</h3><div class="pc-tx">' + esc(L(v.see)) + '</div><div class="sm">' + sw + ' ' + esc(v.band < 0 ? (e ? 'It lies on top of the gravel layer — the top of the Layer Gorge column.' : '층층골 기둥 맨 위 자갈층보다 위에 덮여 있어요.') : (e ? 'Same as the ' + L(BANDS[v.band].t) + ' on the strata column.' : '지층 기둥의 ' + L(BANDS[v.band].t) + jo(L(BANDS[v.band].t), '과', '와') + ' 같은 결이에요.')) + '</div>'
      + '<div class="sm">' + (neu ? (e ? 'Added to your time-order board.' : '시대 차례 판에 올렸어요.') : (e ? 'Already on your time-order board.' : '이미 시대 차례 판에 있어요.')) + ' ' + (e ? 'Rocks show up ' + L(SITES[k].when) + ' — come back another day for a different one.' : L(SITES[k].when) + ' 드러나요. 다른 날 오면 다른 것이 드러날 수 있어요.') + '</div>'
      + '<div class="row"><button data-a="ord">⏳ ' + (e ? 'Time-order board' : '시대 차례 놓기') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'oc');
    if (P9) P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') A.closeP(); else if (b.dataset.a === 'ord') open(); }; }

  // ───────── ⏳ 시대 차례 놓기 ─────────
  function cards() { const out = [], x = A.GAME.S.xp || {}, fos = x.fos || {}; for (const f of FINDS) if (fos[f.id]) out.push({ key: f.id, ic: f.ic, t: f.t, band: f.band, from: T2('층층골 흙더미', 'Layer Gorge soil heap') });
    const s = S(); for (const k in SITES) for (const v of SITES[k].v) if (s.got[v.id]) out.push({ key: v.id, ic: SITES[k].ic, t: v.t, band: v.band, from: SITES[k].t }); return out; }
  const lvOf = () => { const n = S().r.n | 0; return n >= 4 ? 3 : n >= 2 ? 2 : 1; };
  function deal(seed) { const C = cards(), s = S(), lv = lvOf(), want = lv >= 2 ? 4 : 3, R = rng(seed != null ? String(seed) : 'ocr:' + day() + ':' + (s.r.n | 0));
    const by = {}; for (const c of C) (by[c.band] || (by[c.band] = [])).push(c); const bands = Object.keys(by).map(Number); if (bands.length < 3) return null;
    for (let t = 0; t < 12; t++) { let bs = bands.slice(); for (let i = bs.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [bs[i], bs[j]] = [bs[j], bs[i]]; }
      if (lv >= 3 && bands.includes(-1)) bs = [-1, ...bs.filter(b => b !== -1)];   /* 셋째 칸 = 현무암이 꼭 끼어 있음(기둥 밖 것과 잇기) */ else if (lv < 3) bs = bs.filter(b => b !== -1).concat(bs.includes(-1) ? [-1] : []);
      const pick = bs.slice(0, Math.min(want, bs.length)).map(b => by[b][Math.floor(R() * by[b].length)]), key = pick.map(c => c.key).sort().join('|');
      if (key !== s.r.last || t === 11) { for (let i = pick.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pick[i], pick[j]] = [pick[j], pick[i]]; } return { lv, cards: pick, key, done: [], msg: '' }; } }
    return null; }
  const order = cs => cs.slice().sort((a, b) => b.band - a.band);   /* 오래된 것부터 = 아래 띠(번호 큼)부터 · 현무암(−1)은 맨 나중 */
  function open(seed) { const e = en(); B = deal(seed); if (!B) { const n = new Set(cards().map(c => c.band)).size;
      A.openP('<h3>⏳ ' + (e ? 'Time-order board' : '시대 차례 놓기') + '</h3><div class="pc-tx">' + (e ? 'You need finds from at least three different layers. You have ' + n + '.' : '서로 다른 띠에서 찾은 것이 셋 넘게 있어야 해요. 지금은 ' + n + '갈래예요.') + '</div><div class="sm">' + (e ? 'Dig the soil heaps at Layer Gorge, and look for rocks that show up at low tide, after rain, or in winter and spring.' : '층층골 흙더미를 발굴하고, 썰물 때 · 비 온 뒤 · 겨울과 봄에 드러나는 바위를 찾아봐요.') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'oc').onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; return false; }
    draw(); return true; }
  function draw() { const e = en(), lavaOn = B.cards.some(c => c.band < 0) || !!S().got.r1 || !!S().got.r2;
    const col = (lavaOn ? '<div style="display:flex;align-items:center;gap:8px;min-height:30px;padding:3px 10px;background:#2f2b2a;color:#fff;border:2px solid #2b2420">' + esc(L(LAVA.t)) + ' <span style="opacity:.8">' + (e ? '(covers the top)' : '(맨 위를 덮음)') + '</span></div>' : '')
      + BANDS.map((b, i) => '<div style="display:flex;align-items:center;gap:8px;min-height:30px;padding:3px 10px;background:#' + b.hex.toString(16).padStart(6, '0') + ';color:' + (i === 4 || i === 2 ? '#fff' : '#2b2420') + ';border:2px solid #2b2420;border-top-width:' + (i || lavaOn ? 0 : 2) + 'px">' + esc(L(b.t)) + '</div>').join('');
    const cs = B.cards.map((c, i) => { const k = B.done.indexOf(i); return '<button class="' + (k >= 0 ? '' : 'sub') + '" data-c="' + i + '"' + (k >= 0 ? ' disabled' : '') + ' style="min-height:58px;text-align:left"><span style="display:inline-block;width:22px;height:16px;vertical-align:-3px;border:2px solid #2b2420;border-radius:4px;background:#' + bandHex(c.band).toString(16).padStart(6, '0') + '"></span> ' + c.ic + ' ' + esc(L(c.t)) + (k >= 0 ? ' <b>' + (k + 1) + '</b>' : '') + '<br><span class="sm">' + esc(L(c.from)) + '</span></button>'; }).join('');
    const h = '<h3>⏳ ' + (e ? 'Time-order board' : '시대 차례 놓기') + '</h3><div class="pc-tx">' + (e ? 'Tap them from the oldest to the newest. Use the strata column: lower layers were laid down first.' : '오래된 것부터 차례로 눌러요. 지층 기둥을 봐요 — 아래 띠일수록 먼저 쌓였어요.') + '</div>'
      + '<div style="display:grid;grid-template-columns:minmax(120px,1fr) 2fr;gap:10px;align-items:start;margin:6px 0"><div><div class="sm">' + (e ? 'Top = newest' : '위 = 나중') + '</div>' + col + '<div class="sm">' + (e ? 'Bottom = oldest' : '아래 = 먼저') + '</div></div><div style="display:grid;gap:8px">' + cs + '</div></div>'
      + (B.msg ? '<div class="sm"><b>' + esc(B.msg) + '</b></div>' : '') + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P9 = A.openP(h, false, 'oc'); if (P9) P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (b.dataset.c != null) tap(+b.dataset.c); }; }
  function tap(i) { if (!B || B.done.includes(i)) return; const e = en(), O = order(B.cards), want = O[B.done.length], c = B.cards[i];
    if (c !== want && c.band !== want.band) { const nm = L(c.t), bn = bandName(c.band, e);
      B.msg = c.band < 0 ? (e ? 'The ' + nm + ' lies on top of the gravel, the top layer. Something else is older.' : nm + jo(nm, '은', '는') + ' 맨 위 자갈층을 덮고 있어요. 더 먼저 쌓인 것이 있어요.') : (e ? 'The ' + nm + ' belongs to the ' + bn + ' on the column. One of these comes from a lower layer — start again from the lowest.' : nm + jo(nm, '은', '는') + ' 기둥의 ' + bn + '에 있어요. 이 가운데 더 아래 띠에서 온 것이 있어요 — 가장 아래 것부터 다시 놓아요.');
      B.done = []; B.miss = (B.miss | 0) + 1; if (A.sfx) A.sfx('tick'); draw(); return; }
    B.done.push(i); if (A.tone) A.tone(523 + B.done.length * 110, 0, 0.08, 'triangle', 0.05); B.msg = '';
    if (B.done.length < B.cards.length) { draw(); return; }
    const s = S(), lv = B.lv; s.r.n = (s.r.n | 0) + 1; s.r.last = B.key; (s.r.h || (s.r.h = [])).push({ d: day(), k: B.key, m: B.miss | 0 }); while (s.r.h.length > 8) s.r.h.shift(); mark(); A.skUp('look', 3, 'xp:order');
    A.diary('⏳', e ? 'Put ' + B.cards.length + ' finds in time order' : '찾은 것 ' + B.cards.length + '개를 시대 차례로 놓았어요'); if (A.sfx) A.sfx('ding');
    const up = lvOf() > lv, L9 = order(B.cards).map(c => c.ic + ' ' + L(c.t)).join(' → '); B = null;
    A.openP('<h3>⏳ ' + (e ? 'In time order!' : '시대 차례가 맞아요!') + '</h3><div class="pc-tx">' + esc(L9) + '</div><div class="sm">' + (e ? 'Layers pile up from the bottom, so the lower one is older. Lava that covered the top layer came later still.' : '지층은 아래부터 차례로 쌓여서 아래에 있을수록 오래됐어요. 맨 위 층을 덮은 용암은 그보다 더 나중이에요.') + (up ? (e ? ' Next time there will be one more step.' : ' 다음 판은 한 칸 어려워져요.') : '') + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'oc').onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; }

  // ───────── 1초 칸 ─────────
  function sec() { if (dead) return; if (P && P.root !== A.root()) clear(); if (!A.on()) return; if (!P) { build(); if (!P) return; } vis();
    const me = map.player.pos(); for (const s of P.list) { if (!openOf(s.k) || S().said[s.k] === day() || A.busy()) continue; if (Math.hypot(me.x - s.x, me.z - s.z) > 40) continue; S().said[s.k] = day(); mark();
      const v = varOf(s.k); A.say(SITES[s.k].ic + ' ' + (en() ? 'Something new showed up today: ' + L(v.t) + ' — look closely (E)' : '오늘 새로 드러난 것이 있어요: ' + L(v.t) + ' — 가까이 가서 살펴봐요(E)'), 4, 1); } }
  function dispose() { clear(); dead = true; }
  return { sec, dispose, open, look, get goal() { return ''; },
    info: () => ({ S: JSON.parse(JSON.stringify(S())), sites: P ? P.list.map(s => ({ k: s.k, x: +s.x.toFixed(1), y: +s.y.toFixed(2), z: +s.z.toFixed(1), open: openOf(s.k), v: varOf(s.k).id, vis: !!s.g.visible, off: !!(s.h && s.h.hot && s.h.hot.off) })) : null, board: B ? { lv: B.lv, cards: B.cards.map(c => ({ key: c.key, band: c.band })), done: B.done.slice(), msg: B.msg } : null, cards: cards().map(c => c.key + ':' + c.band) }),
    dbg: { cond: c => { ovr = c || null; vis(); }, deal: seed => { const d = deal(seed); return d ? d.cards.map(c => c.key) : null; }, tap: i => tap(i), order: () => (B ? order(B.cards).map(c => B.cards.indexOf(c)) : null), varOf: k => varOf(k).id } };
}
