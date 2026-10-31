// 🥁 장구 장단 놀이(JANGGU-1 · 사용자 10-20 '음악가 = RPG 리듬 게임처럼' · '실제 게임 방식으로' · 타이밍 막대 X) — 설계 docs/systems/town_jobs2.md 「리듬·장구·버스킹」(버스킹 1차) · docs/systems/town_music.md
//   장구 선생님(직함만 · 새 사람 X) = 광장·공원에 가장 가까운 일꾼(장터 상인 먼저) 곁 E '장구 배우기'
//   몸통 = 짜기와 주고받기: 선생님이 한 장단을 치면(칸에 구음 글자가 차례로 켜짐 · 소리는 확인용) 아이가 ←(쿵) →(덕) ↓(덩) 또는 장구 두 면 단추로 칸을 채워 받음
//     판정 = 소리 차례만(박자 ms 판정 X) · 칸을 다 채우면 마을이 아이 장단을 반주와 함께 박에 맞춰 연주(town_music.js playBars) → 잘 짰는지가 들림
//   꼬임 사다리(안에서만 셈 · 판 번호 X): 쿵과 덕(넷 칸) → 덩 더하기 → 한 박을 셋으로(셋잇단) → 긴 장단 · 잘한 판(별 둘 이상) 셋이면 다음 꼬임 · 판 뒤 '됐어요 / 다음엔' 한 줄
//   내 장단 짓기(첫 꼬임 뒤) → 저장 → 버스킹 1차: 그 자리에서 치면 보이는 곳의 상인·일꾼이 몸을 돌려 손뼉(cheer · 새 행인 X) · 병원·집 앞·밤 = 이웃이 싫어하는 말 한 줄(사회 배움)
//   보상 = 솜씨 일솜씨(하루 넷까지) · 꼬임 오를 때 돈 + 선생님 ❤ · 버스킹 손뼉 = 하루 한 번 돈 · 렉: 매 프레임 일 = 창이 닫혔나 하나 · 칸 켜기 = 연주하는 동안만 짧은 타이머 · 새 Light X · 새 메시 X
//   지어내지 않음: 장단 이름·구음은 교과서와 대조 전이라 쿵·덕·덩 꼴만(선생님 장단 = 연습용 차례 · 세마치·굿거리라고 부르지 않음) · 홍보판(SM_PROMO) X
export const JG_V = 1;
const T2 = (ko, en) => [ko, en];
const SND = { k: T2('쿵', 'Kung'), d: T2('덕', 'Deok'), D: T2('덩', 'Deong'), '-': T2('', '') };
// 꼬임(stage): beats 박 × sub 칸 · keys = 쓸 수 있는 소리 · show = 선생님 글자를 늘 보임(첫 꼬임만) · pool = 연습용 차례('-' = 쉼 · 칸 고정)
const STG = [
  { t: T2('쿵과 덕', 'Kung and deok'), beats: 4, sub: 1, bpm: 84, keys: 'kd', show: true, pool: ['kdkd', 'kkdd', 'kddk', 'dkdk', 'kkkd', 'dkkd', 'kdkk', 'ddkk'],
    say: T2('장구 왼쪽 면은 쿵, 오른쪽 면은 덕 소리가 나요.', 'The left side of the janggu goes kung, the right side goes deok.'), fact: T2('장구는 허리가 잘록한 우리 북이에요. 왼쪽 면은 낮게, 오른쪽 면은 높게 울려요.', 'The janggu is a Korean drum with a narrow waist. The left side sounds low and the right side sounds high.') },
  { t: T2('덩 더하기', 'Adding deong'), beats: 4, sub: 1, bpm: 84, keys: 'kdD', pool: ['Dkdk', 'Ddkd', 'Dkkd', 'DdDk', 'kdDd', 'Dddk', 'DkDd', 'kDkd'],
    say: T2('두 면을 같이 치면 덩이에요.', 'Hit both sides together for deong.'), fact: T2('덩은 장구 두 면을 함께 쳐서 나는 소리예요.', 'Deong is the sound of hitting both sides of the janggu at once.') },
  { t: T2('한 박을 셋으로', 'Three in a beat'), beats: 3, sub: 3, bpm: 60, keys: 'kdD', pool: ['D-Ddkdkd-', 'D-kd-dkd-', 'k-dk-dD--', 'D-dk-dkk-', 'Dd-kd-D--', 'D-Dk-dk--'],
    say: T2('이번엔 한 박을 셋으로 나눠 쳐요.', 'Now we split each beat into three.'), fact: T2('세마치장단과 굿거리장단도 한 박을 셋으로 나누어 쳐요.', 'Semachi and gutgeori rhythms also split each beat into three.') },
  { t: T2('긴 장단', 'A long rhythm'), beats: 4, sub: 3, bpm: 56, keys: 'kdD', pool: ['D--k-dkd-D--', 'D-dk-dD-dk--', 'D--dkdk-dD--', 'D-kd-dk-dD-k', 'Dd-k-dD-kd--'],
    say: T2('이제 긴 장단도 해 봐요.', 'Let’s try a long rhythm now.'), fact: T2('장단은 정해진 소리 차례를 되풀이해요.', 'A jangdan repeats a set order of sounds.') },
];
const GOOD_UP = 3, XP_DAY = 4, UP_MONEY = 200, BUSK_MONEY = 100;
const ORD = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째', '열한째', '열두째'];
const CSS = '.jg-w .jg-say{margin:2px 0 6px;font-weight:800}.jg-w .jg-lab{font-size:13px;font-weight:800;margin:6px 0 3px;color:#5a4a3a}'
  + '.jg-w .jg-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.jg-w .jg-b{display:flex;gap:3px}'
  + '.jg-w .jg-c{width:46px;height:46px;border:2px solid #2b2b2b;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:19px;background:#fffdf6;color:#2b2b2b;cursor:pointer;user-select:none}'
  + '.jg-w .jg-c.r{background:#e9e4d8;color:#9a917f;cursor:default}.jg-w .jg-c.q{color:#9a917f}.jg-w .jg-c.cur{box-shadow:0 0 0 3px #2f6fd0}.jg-w .jg-c.lit{background:#ffd23a}'
  + '.jg-w .jg-c.bad{border-color:#d8402e;background:#fde3dd}.jg-w .jg-c.ok{border-color:#2f8a4e}.jg-w .jg-c.k{color:#7a3b1e}.jg-w .jg-c.d{color:#1f4f8f}.jg-w .jg-c.D{color:#5a2a7a}'
  + '.jg-w .jg-pad{display:flex;gap:8px;margin:10px 0 4px;flex-wrap:wrap}.jg-w .jg-pad button{flex:1;min-width:110px;min-height:58px;font-size:18px;font-weight:900}'
  + '.jg-w .jg-res{min-height:22px;margin:8px 0 2px;font-weight:800}.jg-w .jg-fact{font-size:13px;color:#5a4a3a;margin-top:4px}.jg-w .jg-key{opacity:.7;font-size:14px}body.touch .jg-w .jg-key{display:none}'
  + '@media (max-width:520px){.jg-w .jg-c{width:34px;height:38px;font-size:16px}.jg-w .jg-row{gap:6px}}';

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · lang() · esc · openP(h, wide, kind) · closeP() · busy() 다른 창·놀이 · workers() WKP · wkMesh() 일꾼 인스턴스(set·act·reset)
//   places() 장소(이름·종류·자리·문) · okSpot(x, z) 서는 빈 땅 · gy(x, z) 서는 높이 · night() · music() MUS(hold·hit·playBars) · skUp(k, n) · money(n) · heart(w, n) · bubble(o, t) · rec(k, o) · cell(x, z)
export function createJanggu(A) {
  const map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const S = () => { const g = A.GAME.S; let s = g.jg; if (!s || typeof s !== 'object' || s.v !== JG_V) s = g.jg = { v: JG_V, lv: 0, good: 0, top: false, n: 0, mine: null, busk: 0, last: null }; return s; };
  const mark = () => A.GAME.mark(), toast = (t, s) => map.hud.toast(t, s), sfx = k => map.sfx && map.sfx(k), mus = () => { try { return A.music(); } catch (e) { return null; } };
  let TW = null, TI = -1, HOT = null, W = null, R = null, BK = null, kd = null, tmr = [], lightT = 0, PB = null, lastHit = null, cssOn = false;
  const later = (f, ms) => { const id = setTimeout(() => { tmr = tmr.filter(q => q !== id); f(); }, ms); tmr.push(id); return id; };
  const DBG = { plays: 0, cheer: 0, last: null }, C3 = new A.T3.Vector3();   /* 스크래치(카메라 앞 방향) */

  // ───────── 선생님 자리(짓기 때 한 번) ─────────
  function pickTeacher() { const T9 = A.teacher && A.teacher(); if (T9 && T9.i != null) return T9.i;   /* BUG4-2: 잔치 마당 무대 옆으로 옮긴 곁 일손(town.js jgPlace) · 없으면 예전대로 장터 쪽 */
    const WK = A.workers() || [], P = (A.places() || []).filter(p => p.kind === 'park' || /광장|공원/.test(p.name || '')); let best = -1, bs = 1e18;
    WK.forEach((w, i) => { if (!w.k || w.role === 'swim' || w.role === 'guest' || w.gate) return; let open9 = 0; for (let a = 0; a < 12; a++) { const ang = a * Math.PI / 6; if (A.okSpot(w.x + Math.sin(ang) * 2.6, w.z + Math.cos(ang) * 2.6)) open9++; } if (open9 < 8) return;   /* FIX-JG1(사용자 10-24 '장구 선생님 못 찾겠네'): 몸이 벽에 묻히거나 둘레가 막힌 일꾼은 X — 둘레 12방향 가운데 8 이상 트인 곳만 */ let d = 1e6; for (const p of P) d = Math.min(d, Math.hypot(p.x - w.x, p.z - w.z)); const sc = (w.k === 'stall' ? 0 : 150) + (P.length ? d : 0); if (sc < bs) { bs = sc; best = i; } });
    return best; }
  function hotSpot(w) { const hx = w.hx ?? null, hz = w.hz ?? null, f = w.ry || 0; let pick = null, pd = 1e9;
    for (const r of [2.6, 3.2, 3.9]) for (let a = 0; a < 12; a++) { const ang = f + a * Math.PI / 6, x = w.x + Math.sin(ang) * r, z = w.z + Math.cos(ang) * r; if (!A.okSpot(x, z)) continue; if (hx != null && Math.hypot(x - hx, z - hz) < 3.6) continue;
      const d = r + Math.min(a, 12 - a) * 0.15; if (d < pd) { pd = d; pick = [x, z]; } }
    return pick || [w.x + Math.sin(f) * 1.6, w.z + Math.cos(f) * 1.6]; }
  /* BUG4-2 일 시간(9~18시 · town.js WHRS.janggu · docs/systems/town_hours.md) — 밖이면 몸은 집에 가고 E = 한 줄 */
  const hrs = () => (A.hrs ? A.hrs() : [9, 18]), inHrs = () => { const m = A.min ? A.min() : 600, H9 = hrs(); return m >= H9[0] * 60 && m < H9[1] * 60; }, mine9 = () => !!(TW && TW.jg);
  function restLine() { const H9 = hrs(), m = A.min ? A.min() : 600, e = en(), early = m < H9[0] * 60; return '🥁 ' + (e ? 'The janggu teacher is resting now. Come back ' + (early ? 'at ' : 'tomorrow at ') + H9[0] + ':00 (lessons ' + H9[0] + ':00 to ' + H9[1] + ':00).' : '지금은 장구 선생님이 쉬는 때예요. ' + (early ? '' : '내일 ') + H9[0] + '시에 와요(가르치는 때 ' + H9[0] + '시~' + H9[1] + '시).'); }
  let PROP = null, PCOLH = null;
  function propBuild() { if (PROP || !TW || !TW.jg || !A.buildParts) return; const ry = TW.ry || 0, c = Math.cos(ry), sn = Math.sin(ry), px = TW.x + c * 1.15 + sn * 0.25, pz = TW.z - sn * 1.15 + c * 0.25;   /* 선생님 오른쪽 옆 · 조금 앞 */
    PROP = A.buildParts(p => { p('b', 0, 0, 0, 1.9, 0.03, 1.4, 0xd9c27a); for (let i = 0; i < 6; i++) p('b', 0, 0.03, -0.6 + i * 0.24, 1.86, 0.004, 0.05, 0xa88a3a);   /* 짚 돗자리 */
      const R9 = 1.5708; p('b', 0, 0.03, 0, 0.36, 0.28, 0.8, 0x5a3e28);   /* 낮은 받침 */
      for (const s9 of [-1, 1]) { p('c', 0, 0.5, s9 < 0 ? -0.42 : 0.22, 0.19, 0.2, 0, 0xc8423a, 0, 0, R9); p('c', 0, 0.5, s9 < 0 ? -0.45 : 0.42, 0.23, 0.03, 0, 0xf6f4ee, 0, 0, R9); }   /* 양쪽 울림통(붉은 칠) · 흰 가죽 면 */
      p('c', 0, 0.5, -0.22, 0.06, 0.44, 0, 0x7a3b1e, 0, 0, R9); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832; p('c', Math.cos(a) * 0.15, 0.5 + Math.sin(a) * 0.15, -0.43, 0.008, 0.86, 0, 0xe8d38a, 0, 0, R9); }   /* 잘록한 허리 · 조임줄 */
      p('c', 0.55, 0.035, -0.2, 0.012, 0.42, 0, 0x6b4a2f, 0, 0, R9); p('c', 0.7, 0.035, -0.2, 0.012, 0.4, 0, 0xd8b878, 0, 0, R9); });   /* 궁채 · 열채 */
    PROP.position.set(px, A.gy(px, pz), pz); PROP.rotation.y = ry + 1.5708;   /* 장구 몸통이 앞에서 옆으로 보이게(잘록한 허리) */ map.add(PROP); PROP.updateMatrixWorld(true);
    if (A.collider) { const y = A.gy(px, pz); PCOLH = A.collider({ x0: px - 0.5, x1: px + 0.5, z0: pz - 0.5, z1: pz + 0.5, y0: y - 1, y1: y + 0.55, nc: true }); } }
  function init() { const out = []; if (HOT) { HOT = null; } TI = pickTeacher(); TW = TI >= 0 ? A.workers()[TI] : null; if (!TW || !A.on()) return out; propBuild();
    const [x, z] = hotSpot(TW), H9 = hrs(); HOT = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: 2.2, label: '🥁 ' + (en() ? 'Learn the janggu (janggu teacher, ' + H9[0] + ':00 to ' + H9[1] + ':00)' : '장구 배우기 (장구 선생님 · ' + H9[0] + '시~' + H9[1] + '시)'), use: () => { if (mine9() && !inHrs()) { toast(restLine(), 3.6); return; } open(); } }); out.push(HOT); return out; }

  // ───────── 창 ─────────
  function css() { if (cssOn || document.getElementById('jg-css')) { cssOn = true; return; } const st = document.createElement('style'); st.id = 'jg-css'; st.textContent = CSS; document.head.appendChild(st); cssOn = true; }
  const stIdx = () => Math.min(STG.length - 1, S().lv);
  const shapeOf = i => STG[Math.max(0, Math.min(STG.length - 1, i))];
  const mineShape = () => { const s = S(); return s.top ? STG.length - 1 : Math.max(0, s.lv - 1); };
  function cellsHTML(row, C, sub, cls) { let h = '<div class="jg-row" data-row="' + row + '">'; for (let b = 0; b < C.length; b += sub) { h += '<div class="jg-b">'; for (let i = b; i < Math.min(C.length, b + sub); i++) h += '<div class="jg-c ' + (cls(i) || '') + '" data-c="' + row + ':' + i + '"></div>'; h += '</div>'; } return h + '</div>'; }
  function padHTML(keys, rest) { const e = en(); return '<div class="jg-pad">' + '<button data-h="k"><span class="jg-key">← </span>' + (e ? 'Kung (left)' : '쿵 (왼쪽 면)') + '</button>'
      + (keys.includes('D') ? '<button data-h="D"><span class="jg-key">↓ </span>' + (e ? 'Deong (both)' : '덩 (두 면 같이)') + '</button>' : '') + '<button data-h="d">' + (e ? 'Deok (right)' : '덕 (오른쪽 면)') + '<span class="jg-key"> →</span></button>'
      + (rest ? '<button class="sub" data-h="-"><span class="jg-key">↑ </span>' + (e ? 'Rest' : '쉼') + '</button>' : '') + '</div>'; }
  function open(mode) { if (!A.on() || !TW) return false; if (BK) buskEnd(true); css(); const s = S(), e = en(); mode = mode === 'mine' && (s.lv >= 1 || s.top) ? 'mine' : 'learn';
    const P = A.openP('<div class="jg-w"><h3>🥁 ' + (e ? 'Janggu lesson' : '장구 배우기') + '</h3><div class="jg-say" data-r="task"></div><div data-r="body"></div><div class="jg-res" data-r="res"></div><div class="row" data-r="btn"></div><div class="jg-fact" data-r="fact"></div></div>', false, 'janggu');
    if (!P) return false; W = { el: P, mode }; P.onclick = ev => { const c = ev.target.closest('[data-c]'); if (c) { cellClick(c.dataset.c); return; } const b = ev.target.closest('button'); if (!b) return; if (b.dataset.h) { hit(b.dataset.h); return; } btn(b.dataset.a); };
    if (!kd) { kd = ev => { if (!W || !W.el.isConnected) return; const m = { ArrowLeft: 'k', ArrowRight: 'd', ArrowDown: 'D', ArrowUp: '-' }[ev.code]; if (m) { ev.preventDefault(); ev.stopImmediatePropagation(); if (!ev.repeat) hit(m); return; }
        if (ev.code === 'Backspace') { ev.preventDefault(); ev.stopImmediatePropagation(); erase(); return; } if (ev.code === 'Enter' || ev.code === 'Space') { ev.preventDefault(); ev.stopImmediatePropagation(); if (!ev.repeat) btn(R && R.done ? (W.mode === 'mine' ? 'play' : 'next') : W.mode === 'mine' ? 'play' : 'again'); } };
      addEventListener('keydown', kd, true); }
    const M = mus(); if (M) M.hold(true);
    if (mode === 'mine') mineStart(); else { roundStart(); const w = TW; if (w) A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, L(s.top ? T2('내 장단을 지어서 광장에서 들려줘 봐요.', 'Make your own rhythm and play it in the square.') : STG[stIdx()].say)); }
    A.rec('janggu', { open: mode, lv: s.lv }); return true; }
  const Q = k => W && W.el.querySelector('[data-r="' + k + '"]');
  function closed() { stopPlay(); W = null; R = null; lastHit = null; if (!BK) { const M = mus(); if (M) M.hold(false); } }
  function close() { if (W && W.el.isConnected) A.closeP(); closed(); }

  // 배우기 한 판: 선생님 장단(연습용 차례 하나 · 같은 날 같은 꼬임이면 차례대로 돌림)
  function roundStart() { const s = S(), si = stIdx(), G = STG[si], pat = G.pool[(s.n * 3 + A.GAME.S.day + si) % G.pool.length], C = [...pat];
    R = { si, pat: C, mine: C.map(c => (c === '-' ? '-' : '')), cur: C.findIndex(c => c !== '-'), demo: 0, replays: 0, tries: 0, erases: 0, bad: [], done: false, s: 0, up: false, hide: !G.show };
    const e = en(); Q('task').textContent = (e ? 'To do: ' : '할 일: ') + (e ? 'Listen to the teacher, then fill the boxes in the same order.' : '선생님 장단을 듣고 아래 칸을 같은 차례로 채워요.');
    Q('body').innerHTML = '<div class="jg-lab">' + esc((e ? 'Teacher — ' : '선생님 장단 — ') + L(G.t)) + '</div>' + cellsHTML('t', C, G.sub, i => (C[i] === '-' ? 'r' : C[i]))
      + '<div class="jg-lab">' + (e ? 'My janggu' : '내 장구') + '</div>' + cellsHTML('m', C, G.sub, i => (C[i] === '-' ? 'r' : '')) + padHTML(G.keys, false);
    Q('fact').textContent = L(G.fact); Q('res').textContent = ''; buttons(); draw(); demo(); }
  function buttons() { const e = en(), b = Q('btn'); if (!b) return; if (W.mode === 'mine') { b.innerHTML = '<button class="sub" data-a="erase">' + (e ? 'Erase one' : '한 칸 지우기') + '</button><button data-a="play">' + (e ? 'Play it' : '들어 보기') + '</button>'
      + (R && R.done ? '<button data-a="save">' + (e ? 'Save' : '저장하기') + '</button>' : '') + (S().mine ? '<button class="sub" data-a="busk">' + (e ? 'Play it here for people' : '여기서 들려주기') + '</button>' : '') + '<button class="sub" data-a="learn">' + (e ? 'Back to lessons' : '배우기로') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button>'; return; }
    b.innerHTML = R && R.done ? '<button data-a="next">' + (e ? 'Next rhythm' : '다음 장단') + '</button>' + (S().lv >= 1 || S().top ? '<button class="sub" data-a="mine">' + (e ? 'Make my rhythm' : '내 장단 짓기') + '</button>' : '') + '<button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button>'
      : '<button class="sub" data-a="again">' + (e ? 'Hear it again' : '다시 듣기') + '</button><button class="sub" data-a="erase">' + (e ? 'Erase one' : '한 칸 지우기') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button>'; }
  function draw(lit = -1, row = '') { if (!W || !R) return; const el = W.el;
    for (const c of el.querySelectorAll('[data-c]')) { const [rw, si] = c.dataset.c.split(':'), i = +si, tc = R.pat ? R.pat[i] : '-', mc = R.mine[i];
      if (rw === 't') { const showT = !R.hide || R.demo === 1 && i <= lit || R.done; c.textContent = tc === '-' ? '·' : showT ? L(SND[tc]) : '?'; c.className = 'jg-c ' + (tc === '-' ? 'r' : showT ? tc : 'q') + (row === 't' && i === lit ? ' lit' : ''); }
      else { const rest = R.pat && R.pat[i] === '-' && W.mode !== 'mine'; c.textContent = rest ? '·' : mc === '-' ? '·' : mc ? L(SND[mc]) : ''; c.className = 'jg-c ' + (rest ? 'r' : mc === '-' ? 'r' : mc || '') + (!R.done && i === R.cur && R.demo !== 1 ? ' cur' : '') + (R.bad.includes(i) ? ' bad' : '') + (R.done && !rest && W.mode !== 'mine' ? ' ok' : '') + (row === 'm' && i === lit ? ' lit' : ''); } } }
  // 연주(소리가 없어도 같은 박으로 칸이 켜짐 — 교실은 소리 없는 때가 많음)
  function stopPlay() { if (lightT) { clearInterval(lightT); lightT = 0; } if (PB && PB.stop) PB.stop(); PB = null; }
  function play(cells, sub, bpm, o, row, done) { stopPlay(); const M = mus(); let h = M ? M.playBars(cells.map(c => c || '-').join(''), bpm, { sub, reps: o.reps || 1, acc: !!o.acc }) : null; DBG.plays++; DBG.last = h && { n: h.n, acc: h.acc, len: h.len, cellMs: +h.cellMs.toFixed(1) };
    const cm = h ? h.cellMs : 60000 / bpm / sub, t0 = h ? h.t0 : performance.now() + 200, n = cells.length * (o.reps || 1); PB = h; let last = -2;
    lightT = setInterval(() => { if (!W || !W.el.isConnected) { stopPlay(); return; } const k = Math.floor((performance.now() - t0) / cm); if (k === last) return; last = k; if (k >= n) { clearInterval(lightT); lightT = 0; PB = null; draw(); if (done) done(); return; } if (k >= 0) draw(k % cells.length, row); }, 40);
    return h; }
  function demo() { if (!R) return; R.demo = 1; R.bad = []; const G = STG[R.si]; play(R.pat, G.sub, G.bpm, { reps: 1 }, 't', () => { if (!R) return; R.demo = 2; draw(); }); draw(); }
  function cellClick(id) { if (!R || R.demo === 1) return; if (R.done) { if (W.mode !== 'mine') return; R.done = false; buttons(); } const [rw, si] = id.split(':'), i = +si; if (rw !== 'm') return; if (W.mode !== 'mine' && R.pat[i] === '-') return; R.cur = i; draw(); }
  function nextCur(i) { const N = R.mine.length; for (let k = i + 1; k < N; k++) if (W.mode === 'mine' ? !R.mine[k] : R.pat[k] !== '-' && (!R.mine[k] || R.bad.includes(k))) return k; for (let k = 0; k < N; k++) if (W.mode === 'mine' ? !R.mine[k] : R.pat[k] !== '-' && (!R.mine[k] || R.bad.includes(k))) return k; return -1; }
  function hit(c) { if (!W || !R || R.done) return; if (R.demo === 1) { Q('res').textContent = en() ? 'Wait until the teacher finishes.' : '선생님 장단이 끝나면 쳐요.'; return; }
    const G = W.mode === 'mine' ? shapeOf(R.si) : STG[R.si]; if (c === '-' && W.mode !== 'mine') return; if (c !== '-' && !G.keys.includes(c)) { if (c === 'D') Q('res').textContent = en() ? 'Deong comes in the next step.' : '덩은 다음에 배워요.'; return; }
    const now = performance.now(), M = mus();
    if (G.keys.includes('D') && lastHit && now - lastHit.t < 130 && ((c === 'k' && lastHit.c === 'd') || (c === 'd' && lastHit.c === 'k')) && R.mine[lastHit.i] === lastHit.c) { R.mine[lastHit.i] = 'D'; if (M) M.hit(c); lastHit = null; draw(); return; }   /* 두 면을 거의 같이 = 덩 */
    if (R.cur < 0) return; const i = R.cur; R.mine[i] = c; R.bad = R.bad.filter(q => q !== i); lastHit = { c, i, t: now }; if (M && c !== '-') M.hit(c);
    R.cur = nextCur(i); draw(); if (R.cur < 0) later(() => { if (R && !R.done && R.cur < 0) submit(); }, 320); }
  function erase() { if (!W || !R || R.done || R.demo === 1) return; let i = R.cur < 0 ? R.mine.length : R.cur; for (let k = i - 1; k >= 0; k--) if (R.mine[k] && (W.mode === 'mine' || R.pat[k] !== '-')) { R.mine[k] = ''; R.cur = k; R.erases++; draw(); return; } }
  // 판정 = 소리 차례만 · 아이 장단을 반주와 함께 두 번 연주
  function submit() { if (!R || R.done) return; if (W.mode === 'mine') { minePlay(); return; } const G = STG[R.si], e = en(); R.tries++; R.bad = []; R.pat.forEach((c, i) => { if (c !== '-' && R.mine[i] !== c) R.bad.push(i); });
    if (R.bad.length) { R.cur = R.bad[0]; Q('res').textContent = e ? 'The red boxes are different from the teacher. Tap one and play it again.' : (R.bad.length === 1 ? ORD[R.bad[0]] + ' 칸이 선생님 장단과 달라요. 그 칸을 다시 쳐 봐요.' : '빨간 칸 ' + R.bad.length + '개가 선생님 장단과 달라요. 다시 듣고 고쳐 봐요.'); draw();
      play(R.mine, G.sub, G.bpm, { reps: 1 }, 'm', null); return; }
    R.done = true; const s = S(), first = R.tries === 1, third = R.si === 0 ? R.erases === 0 : R.replays === 0; R.s = 1 + (first ? 1 : 0) + (third ? 1 : 0); s.n++;
    const good = R.s >= 2; if (good && !s.top) { s.good++; if (s.good >= GOOD_UP) { s.good = 0; if (s.lv < STG.length - 1) { s.lv++; R.up = 'lv'; } else { s.top = true; R.up = 'top'; } } }
    s.last = { si: R.si, c: R.pat.join('') }; mark();
    if (A.GAME.use('jg:xp') <= XP_DAY) A.skUp('work', good ? 2 : 1);
    if (R.up) { const k = 'jg:up' + (R.up === 'top' ? 'T' : s.lv); if (!s[k]) { s[k] = 1; A.money(UP_MONEY, true); }   /* RWFIX-1: 승급 상 = 한 번뿐 — 하루 총량에 막히면 다음에 들어옴(팝은 실제로 들어온 돈만) */ if (TW && !A.GAME.picked('jg:h')) { A.GAME.pick('jg:h'); A.heart(TW, 2); } mark(); }
    const what = first ? (e ? 'Every sound is in the right order.' : '소리 차례가 다 맞았어요.') : (e ? 'You fixed it. Every sound is in order now.' : '고쳐서 소리 차례가 다 맞았어요.');
    const next = R.up === 'lv' ? (e ? 'Next: ' + L(STG[s.lv].t) + '. ' + L(STG[s.lv].say) : '다음엔 「' + L(STG[s.lv].t) + '」을 배워요. ' + L(STG[s.lv].say)) : R.up === 'top' ? (e ? 'Next: make your own rhythm and play it for people.' : '다음엔 내 장단을 지어 사람들 앞에서 쳐 봐요.')
      : !first ? (e ? 'Next time, try to get it right the first time.' : '다음엔 한 번에 맞혀 봐요.') : !third ? (R.si === 0 ? (e ? 'Next time, try without erasing.' : '다음엔 지우지 않고 해 봐요.') : (e ? 'Next time, try hearing it only once.' : '다음엔 한 번만 듣고 해 봐요.')) : (e ? 'Next: another rhythm from the teacher.' : '다음엔 선생님의 다른 장단을 받아요.');
    Q('res').textContent = (e ? 'Done: ' : '됐어요: ') + what + ' ' + next; buttons(); draw(); sfx('ding');
    const M = TW && A.wkMesh(); if (M && TI >= 0) { M.act(TI, 'cheer', 0); later(() => { const M2 = A.wkMesh(); if (M2 && TI >= 0 && !BK) M2.reset(TI); }, 5200); }
    play(R.mine, G.sub, G.bpm, { reps: 2, acc: true }, 'm', null); A.rec('janggu', { lv: R.si, s: R.s, up: R.up || null }); }
  function btn(a) { if (!W) return; if (a === 'x') { close(); return; } if (a === 'again') { if (R && !R.done && R.demo !== 1) { R.replays++; demo(); } return; } if (a === 'erase') { erase(); return; }
    if (a === 'next') { stopPlay(); roundStart(); return; } if (a === 'mine') { stopPlay(); W.mode = 'mine'; mineStart(); return; } if (a === 'learn') { stopPlay(); W.mode = 'learn'; roundStart(); return; }
    if (a === 'play') { if (W.mode === 'mine') minePlay(); return; } if (a === 'save') { mineSave(); return; } if (a === 'busk') { close(); busk(); return; } }

  // ───────── 내 장단 짓기(첫 꼬임 뒤) ─────────
  function mineStart() { const s = S(), si = mineShape(), G = shapeOf(si), N = G.beats * G.sub, e = en(), old = s.mine && s.mine.si === si ? [...s.mine.c] : null;
    R = { si, pat: null, mine: old || Array(N).fill(''), cur: old ? -1 : 0, demo: 0, replays: 0, tries: 0, erases: 0, bad: [], done: !!old, s: 0 };
    Q('task').textContent = (e ? 'To do: ' : '할 일: ') + (e ? 'Fill every box with a sound or a rest, then listen.' : '칸마다 소리나 쉼을 넣어 내 장단을 지어요.');
    Q('body').innerHTML = '<div class="jg-lab">' + esc((e ? 'My rhythm — ' : '내 장단 — ') + L(G.t)) + '</div>' + cellsHTML('m', R.mine, G.sub, () => '') + padHTML(G.keys, true);
    Q('fact').textContent = en() ? 'The town band plays along when you listen.' : '들어 보기를 누르면 마을 반주가 같이 울려요.'; Q('res').textContent = old ? (e ? 'This is your saved rhythm. Tap a box to change it.' : '저장한 내 장단이에요. 칸을 누르면 바꿀 수 있어요.') : ''; if (old) R.done = false; buttons(); draw(); }
  function minePlay() { if (!R) return; if (R.mine.some(c => !c)) { Q('res').textContent = en() ? 'Fill every box first.' : '먼저 칸을 다 채워요.'; return; } const n = R.mine.filter(c => c !== '-').length; if (n < 2) { Q('res').textContent = en() ? 'Put in at least two sounds.' : '소리를 둘 넘게 넣어요.'; return; }
    const G = shapeOf(R.si); R.done = true; R.cur = -1; buttons(); draw(); Q('res').textContent = en() ? 'Listen. If you like it, save it.' : '잘 들어 봐요. 마음에 들면 저장해요.'; play(R.mine, G.sub, G.bpm, { reps: 2, acc: true }, 'm', () => { if (R) { R.done = true; buttons(); } }); }
  function mineSave() { if (!R || R.mine.some(c => !c)) return; const s = S(); s.mine = { si: R.si, c: R.mine.join('') }; mark(); Q('res').textContent = en() ? 'Saved. Play it for people at a market or a park.' : '저장했어요. 장터나 공원에서 사람들에게 들려줘요.'; R.done = false; buttons(); sfx('ding'); }

  // ───────── 버스킹 1차(그 자리에서 내 장단 · 보이는 상인·일꾼 손뼉 · 자리 규칙) ─────────
  const canBusk = () => !!(TW && S().mine && A.on());
  function placeWhy(x, z) { const P = A.places() || [], near = (k, r) => P.some(p => k.test(p.kind) && Math.min(Math.hypot(p.x - x, p.z - z), p.door ? Math.hypot(p.door[0] - x, p.door[1] - z) : 1e9) < r);
    if (TW && Math.hypot(TW.x - x, TW.z - z) < 20) return 'ok';
    if (near(/^hospital$/, 30)) return 'hosp'; if (A.night() && near(/^(house|apt)$/, 35)) return 'night'; if (near(/^(house|apt)$/, 14)) return 'home'; return 'ok'; }
  function audience(me) { const out = [], WK = A.workers() || [], cam = map.camera; let fx = 0, fz = -1; if (cam && cam.getWorldDirection) { cam.getWorldDirection(C3); const l = Math.hypot(C3.x, C3.z) || 1; fx = C3.x / l; fz = C3.z / l; }
    const cx = cam ? cam.position.x : me.x, cz = cam ? cam.position.z : me.z;
    WK.forEach((w, i) => { if (w.role === 'swim' || w.party || w.out9 === 1) return;   /* 집에 간(숨은) 몸은 손뼉 X */ const d = Math.hypot(w.x - me.x, w.z - me.z); if (d > 32 || Math.abs(w.g - me.y) > 5) return; const vx = w.x - cx, vz = w.z - cz, vl = Math.hypot(vx, vz) || 1; if (d > 4 && (vx * fx + vz * fz) / vl < 0.3) return; out.push(i); });
    return out; }
  function busk() { if (!canBusk()) { toast(en() ? '🥁 First make and save your rhythm with the janggu teacher' : '🥁 먼저 장구 선생님께 내 장단을 지어 저장해요', 3); return false; } if (BK || A.busy()) return false;
    const s = S(), G = shapeOf(s.mine.si), me = map.player.pos(), why = placeWhy(me.x, me.z), aud = why === 'ok' ? audience(me) : [], e = en(), M = mus(); if (M) M.hold(true);
    const C = [...s.mine.c], h = M ? M.playBars(C.join(''), G.bpm, { sub: G.sub, reps: why === 'ok' ? 2 : 1, acc: why === 'ok' }) : null, ms = (h ? h.endMs - performance.now() : C.length * (why === 'ok' ? 2 : 1) * 60000 / G.bpm / G.sub + 200);
    BK = { why, aud, h, t0: performance.now(), ms, x: me.x, z: me.z }; DBG.plays++; DBG.last = h && { n: h.n, acc: h.acc, len: h.len, cellMs: +h.cellMs.toFixed(1) };
    toast('🥁 ' + (e ? 'Playing my rhythm…' : '내 장단을 치고 있어요'), 2.4);
    const WM = A.wkMesh(), WK = A.workers(); if (WM) aud.forEach((i, k) => later(() => { if (!BK) return; const w = WK[i]; let dr = Math.atan2(me.x - w.x, me.z - w.z) - (w.ry || 0); dr = Math.atan2(Math.sin(dr), Math.cos(dr)); WM.set(i, w.x, w.g + 0.02, w.z, (w.ry || 0) + Math.max(-1.1, Math.min(1.1, dr)));   /* 몸 돌리기는 일하던 쪽에서 ±60°까지(판매대·벽 속으로 팔이 들어가지 않게) */ WM.act(i, 'cheer', 0); }, 350 + k * 220));
    DBG.cheer = aud.length; later(() => buskEnd(false), Math.max(800, ms)); A.rec('busk', { why, n: aud.length }); return true; }
  function buskEnd(quiet) { const b = BK; if (!b) return; BK = null; const WM = A.wkMesh(), WK = A.workers(); if (WM) for (const i of b.aud) { const w = WK[i]; WM.set(i, w.x, w.g + 0.02, w.z, w.ry); WM.reset(i); }
    if (b.h && quiet) b.h.stop(); if (!W) { const M = mus(); if (M) M.hold(false); } if (quiet) return; const e = en(), s = S();
    if (b.why !== 'ok') { const line = { hosp: T2('병원 앞이에요. 아픈 사람이 쉬는 곳이라 조용히 해 줘요.', 'This is a hospital. Sick people are resting here, so please keep it quiet.'), home: T2('집 앞에서 크게 치면 쉬는 이웃이 힘들어요. 장터나 공원에서 쳐 봐요.', 'Loud drums by a house bother neighbours who are resting. Try a market or a park.'), night: T2('밤이라 이웃이 자요. 낮에 장터나 공원에서 쳐 봐요.', 'Neighbours are sleeping at night. Try a market or a park in the daytime.') }[b.why];
      const near = audience({ x: b.x, y: map.player.pos().y, z: b.z })[0]; if (near != null) { const w = WK[near]; A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, L(line)); } toast((b.why === 'hosp' ? '🏥 ' : '🏠 ') + L(line), 4.2); s.busk = (s.busk || 0); mark(); return; }
    if (!b.aud.length) { toast(e ? '🥁 Nobody was around to hear it. Try a market or a park where people gather.' : '🥁 듣는 사람이 없었어요. 사람이 모이는 장터나 공원에서 쳐 봐요.', 3.6); return; }
    s.busk = (s.busk || 0) + 1; mark(); toast('👏 ' + (e ? b.aud.length + ' neighbours clapped along' : '구경하던 이웃 ' + b.aud.length + '명이 손뼉을 쳤어요'), 3.4); sfx('ding');
    if (!A.GAME.picked('jg:busk')) { A.GAME.pick('jg:busk'); A.money(BUSK_MONEY); A.skUp('work', 1); } }

  function tick() { if (W && !W.el.isConnected) closed(); }
  function sec() { if (W && !W.el.isConnected) closed(); if (!mine9()) return; const v = inHrs() || !!W || !!BK ? 0 : 1; if (TW.out9 !== v) TW.out9 = v;   /* 일 시간 밖 = 몸 숨김(town.js WKM.tick이 out9 1을 숨김) · 창·버스킹 중엔 그대로 */
    const WM = A.wkMesh(); if (WM && !BK && WM.actOf && WM.actOf(TI) !== 0 && !(R && W)) WM.act(TI, 'stand', 'none'); }   /* 버스킹 뒤 reset이 옛 일 몸짓(허리 굽히기 등)으로 돌리던 것 → 서 있기 */
  function dispose() { if (PROP) { map.remove(PROP); PROP.traverse(o => { if (o.geometry) o.geometry.dispose(); }); PROP = null; } if (PCOLH) { PCOLH.remove(); PCOLH = null; } for (const id of tmr) clearTimeout(id); tmr = []; stopPlay(); if (BK) buskEnd(true); if (kd) { removeEventListener('keydown', kd, true); kd = null; } W = null; R = null; HOT = null; }
  const info = () => { const s = S(); return { on: !!TW, teacher: TW && { i: TI, x: +TW.x.toFixed(1), z: +TW.z.toFixed(1), g: +TW.g.toFixed(2), k: TW.k, role: TW.role, cell: A.cell(TW.x, TW.z), moved: TW.jg || null, out9: TW.out9 | 0, hrs: hrs(), inHrs: inHrs(), prop: PROP ? [+PROP.position.x.toFixed(1), +PROP.position.z.toFixed(1)] : null }, hot: HOT && { x: +HOT.hot.x.toFixed(1), z: +HOT.hot.z.toFixed(1), y: +HOT.hot.y.toFixed(2), label: HOT.hot.label },
    open: !!(W && W.el.isConnected), mode: W ? W.mode : null, S: JSON.parse(JSON.stringify(s)), R: R && { si: R.si, pat: R.pat && R.pat.join(''), mine: R.mine.join(','), cur: R.cur, demo: R.demo, bad: R.bad.slice(), done: R.done, s: R.s, up: R.up || null, tries: R.tries, replays: R.replays },
    busk: BK && { why: BK.why, aud: BK.aud.slice() }, plays: DBG.plays, cheer: DBG.cheer, last: DBG.last, canBusk: canBusk() }; };
  return { init, tick, sec, dispose, open, busk, canBusk, info, spot: () => (HOT && HOT.hot && TW ? { x: HOT.hot.x, z: HOT.hot.z, tx: TW.x, tz: TW.z } : null), get active() { return !!(W || BK); }, STG, dbg: { hit, submit, erase, stage: n => { const s = S(); s.lv = Math.max(0, Math.min(STG.length - 1, n)); s.good = 0; s.top = false; mark(); }, place: (x, z) => placeWhy(x, z) } };
}
