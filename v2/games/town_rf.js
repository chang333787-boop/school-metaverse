// 🏞 강·들에서 할 일(RIVER-1 · FIELD-1 · 10-17 지역별 E 할 일 표에서 가장 적은 곳 = 들 8 · 강 11 — 둘씩): 자리 정하기 + 놀이 창(놀이 틀 town_minigame.js 그대로)
//   아이 판에 있는 것만: 강 = 생태 하천(갈대 · 교사 10-15) · 굽은 강(파란 종이 칸이 비스듬히 꺾임) / 들 = 다랑이 논(노란 「논밭」) · 저수지에서 온 농수로(교사 10-15)
//   🔬 물 맑기 살펴보기(돋보기로 숨은 물속 생물 찾기 → 생물로 물 맑기 정하기) · 🍃 나뭇잎 배 띄우기(예상 → 지켜보기 → 모래가 쌓이는 곳) · 🐸 논에 사는 생물(가만히 지켜보기) · 💧 다랑이 논 물 대기(물길·물꼬 열고 닫기)
//   손놀림이 다른 놀이(때 맞춰 누르기·끌기·나누기·차례·파기·바다 셋)와 겹치지 않게 · 끝 = 놀이 틀의 결과 + 사실 한 줄 · 처음 해내면 도장(도감) · 솜씨(관찰·농사)
//   그리기 0(창 = DOM · 열린 동안만) · 매 프레임 일 = 놀이가 열렸을 때 tick 하나 · 자리 = 지을 때 한 번(E 자리 넷)
const T2 = (ko, en) => [ko, en];
export const RF_GAMES = {
  stream: { kind: 'lens', icon: '🔬', sk: 'look', stamp: '🔬', t: T2('물 맑기 살펴보기', 'How clean is the stream?'), line: T2('생태 하천의 갈대는 물을 맑게 해 줘요. 물속 생물로 확인해 봐요', 'The reeds of the eco stream help clean the water. Check it with water creatures') },
  bend: { kind: 'bend', icon: '🍃', sk: 'look', stamp: '🌀', t: T2('나뭇잎 배 띄우기', 'Float leaf boats'), line: T2('강이 굽은 곳에서는 쪽마다 물의 빠르기가 달라요', 'On a bend, the water flows at different speeds on each side') },
  paddylife: { kind: 'still', icon: '🐸', sk: 'look', stamp: '🐸', t: T2('논에 사는 생물 찾기', 'Find paddy creatures'), line: T2('논에는 벼만 사는 게 아니에요. 가만히 보면 여러 생물이 보여요', 'Rice isn’t the only thing living in a paddy — keep still and look') },
  terrace: { kind: 'gate', icon: '💧', sk: 'farm', stamp: '💧', t: T2('다랑이 논 물 대기', 'Water the terraced paddies'), line: T2('저수지 물이 농수로를 따라 와요. 위 논부터 차례로 물을 대요', 'Reservoir water comes down the canal — fill the paddies from the top') },
};
// A = { map, createMini, en(), esc, zw(k), sea(), busy(), enth, places(), rivers() [{ line, w }], paddies() [{ x, z }], region(x, z), water(x, z), ok(x, z), gy(x, z), stamp(e), skUp(k, n), sfx(k), tone(...) }
export function createRF(A) {
  const en = () => A.en(), L = a => (Array.isArray(a) ? a[en() ? 1 : 0] : a || '');
  let H = [], cur = null, spots = {}, bendA = 0;
  // ── 자리 ──
  const around = (x, z, r0, r1, f) => { for (let r = r0; r <= r1; r += 1.5) for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6 + r * 0.7, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (A.ok(px, pz) && (!f || f(px, pz))) return [px, pz]; } return null; };
  const nearWater = (x, z) => [[2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5], [3.5, 3.5], [-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5]].some(([a, b]) => A.water(x + a, z + b));
  function pickStream() { const P = A.places().find(p => p && (p.en === 'Eco Stream' || /생태 하천/.test(p.name || ''))); if (P) { const s = around(P.x, P.z, 1.5, 9, nearWater); if (s) return s; }
    for (const R of A.rivers()) for (let i = 0; i < R.line.length; i += 3) { const [x, z] = R.line[i]; if (A.region(x, z) !== '강') continue; const s = around(x, z, R.w / 2 + 1.5, R.w / 2 + 6, nearWater); if (s) return s; } return null; }
  function pickBend(not) { const C = [];   /* 강 칸의 강줄기 마디마다 앞뒤 20m 방향 차이 → 가장 많이 굽은 곳부터 · 굽은 안쪽 둔치(모래가 쌓이는 쪽)에 자리 */
    for (const R of A.rivers()) { const Q = R.line; for (let i = 5; i < Q.length - 5; i++) { const [x, z] = Q[i]; if (A.region(x, z) !== '강') continue; const a = Q[i - 5], b = Q[i + 5], t1 = Math.atan2(z - a[1], x - a[0]), t2 = Math.atan2(b[1] - z, b[0] - x); let d = Math.abs(t2 - t1); if (d > Math.PI) d = 2 * Math.PI - d; C.push([d, x, z, (a[0] + b[0]) / 2 - x, (a[1] + b[1]) / 2 - z, R.w]); } }
    C.sort((p, q) => q[0] - p[0]);
    for (const [d, x, z, mx, mz, w] of C.slice(0, 40)) { const ml = Math.hypot(mx, mz) || 1; for (let off = w / 2 + 2; off <= w / 2 + 14; off += 2) { const px = x + mx / ml * off, pz = z + mz / ml * off; if (not && Math.hypot(px - not[0], pz - not[1]) < 25) continue; if (A.region(px, pz) !== '강') continue; if (A.ok(px, pz)) { bendA = +d.toFixed(2); return [px, pz]; } } }
    return null; }
  function pickPaddy(not) { const W = A.paddies().filter(w => A.region(w.x, w.z) === '들'); for (const w of W) { if (not && Math.hypot(w.x - not[0], w.z - not[1]) < 30) continue; const s = around(w.x, w.z, 5, 11, (x, z) => A.region(x, z) === '들'); if (s) return s; } return null; }
  function init() { clear(); spots = {}; spots.stream = pickStream(); spots.bend = pickBend(spots.stream); spots.paddylife = pickPaddy(null); spots.terrace = pickPaddy(spots.paddylife);
    for (const k of Object.keys(RF_GAMES)) { const s = spots[k]; if (!s) continue; const D = RF_GAMES[k]; const h = A.map.interact.add({ kind: 'game', x: s[0], z: s[1], y: A.gy(s[0], s[1]), r: 2.2, label: D.icon + ' ' + L(D.t), use: () => play(k) }); A.enth.push(h); H.push(h); } }
  function clear() { if (cur) end(-1); H = []; }
  // ── 놀이 창(놀이 틀과 같은 모양 · 키는 창이 열린 동안 여기서 받음) ──
  function play(k) { if (cur || A.busy()) return; const D = RF_GAMES[k], e = en();
    const el = document.createElement('div'); el.className = 'twn-play'; el.innerHTML = '<div class="pb"><b>' + D.icon + ' ' + A.esc(L(D.t)) + '</b><small>' + A.esc(L(D.line)) + '</small><div class="mg"></div><div class="msg"></div><div class="row"><button class="go"></button><button class="sub x">' + (e ? 'Stop' : '그만') + '</button></div></div>';
    document.body.appendChild(el); A.map.player.freeze(true); if (document.exitPointerLock) document.exitPointerLock();
    const c = { el, k, mg: null }; cur = c;
    c.mg = A.createMini(D.kind, { root: el.querySelector('.pb'), k, en: e, zw: A.zw(D.sk), sea: A.sea(), grade: true, sfx: q => A.sfx(q), tone: (...a) => A.tone(...a), onEnd: ok => { if (cur === c) end(ok); } });
    c.kd = ev => { if (cur !== c) return; if (ev.code === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); end(-1); return; } if (ev.code === 'Tab') return;
      if (ev.code === 'KeyE' || ev.code === 'Space' || ev.code === 'Enter') { if (!ev.repeat) c.mg.down(); } else c.mg.key(ev.code, ev.repeat); ev.preventDefault(); ev.stopImmediatePropagation(); };
    c.ku = ev => { if (cur === c && (ev.code === 'KeyE' || ev.code === 'Space')) { c.mg.up(); ev.stopImmediatePropagation(); } };
    addEventListener('keydown', c.kd, true); addEventListener('keyup', c.ku, true); el.querySelector('.x').onclick = () => end(-1); }
  function end(ok) { const c = cur; if (!c) return; cur = null; removeEventListener('keydown', c.kd, true); removeEventListener('keyup', c.ku, true); if (c.mg) c.mg.dispose(); setTimeout(() => c.el.remove(), 250); A.map.player.freeze(!!(A.busy && A.busy()));   /* FIX-CX9(코덱스 10-18): 다른 창·탈것이 있으면 몸을 풀지 않음 */
    if (ok < 0) return; const D = RF_GAMES[c.k]; if (A.rec) A.rec('play', { k: c.k, g: ok >= 3 ? 2 : ok >= 1 ? 1 : 0 });   /* REC-0 학급 기록(점수 0~3 → 놀이 틀 gradeOf와 같은 셋) */ A.skUp(D.sk, ok >= 2 ? 3 : 1, 'rf:' + c.k); if (ok >= 1 && A.stamp(D.stamp)) A.toast('📒 ' + (en() ? 'New stamp in your codex: ' : '도감에 새 도장: ') + D.stamp + ' ' + L(D.t), 3); }
  return { init, tick(dt) { if (cur && cur.mg) cur.mg.tick(dt); }, dispose() { clear(); }, get on() { return !!cur; }, spots: () => ({ ...spots, bendA }), play, end };
}
