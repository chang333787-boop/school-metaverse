// 🍞 제빵(BAKE-1 · JOBS-2 차례표 6 · 설계 docs/systems/town_jobs2.md 「다음 다섯 — 🍞 제빵」): 빵집 화덕 앞 E(새 사람 X · 빵집이 없는 마을은 장터 일꾼 곁)
//   판(60초 안) = ① 반죽을 좌우로 끌어 치대기(열 번) ② 부풀 자리 고르기(따뜻한 곳 · 찬 곳) → 발효는 판 밖에서 게임 60~90분(SPM 0.7 = 실제 42~63초 남짓) → 다시 화덕 앞 E = 굽기
//   굽기 = 넓은 폭 판정(빛깔을 보고 꺼내기 · 덜 구움 7초 안 · 알맞음 7~16초 · 탐 16초 뒤) · 결과(부푼 크기 × 구운 빛깔)가 빵 그림에 남음 · 때 맞춰 누르기 X
//   꼬임 사다리(S.lad.bake · 잘한 판 셋이면 다음 · 내려가지 않음 · 별은 안에서만): 오늘 굽는 빵(화덕 곁·냉장고) → 계절 따라(화덕 곁 선반이 꽉 참 · 문 옆 창가는 계절마다 다름 · 따뜻한 물 그릇) → 내일 아침 빵(반죽 둘 · 오늘 것과 밤새 둘 것)
//   배울 것 = '따뜻하면 효모가 잘 부풀어요'(town_laws.js yeast · 수첩 규칙 칸) · 보상 = GAME.add('🍞', n, 'bake:bread') · skUp('cook', n, 'bake') — 문(rwCheck) 하나로만 · 그리기 0(창 = DOM)
export const BAKE_V = 1;
const T2 = (ko, en) => [ko, en];
const LV = [T2('오늘 굽는 빵', 'Bread for today'), T2('계절 따라', 'Follow the season'), T2('내일 아침 빵', 'Bread for tomorrow morning')];
const UP = [null, T2('이제 계절을 보고 자리를 골라 봐요. 오늘은 화덕 곁 선반이 꽉 찼어요.', 'Now choose the spot by the season. The shelf by the oven is full today.'), T2('이제 반죽 둘을 맡겨 볼게요. 하나는 오늘, 하나는 내일 아침에 구워요.', 'Now I’ll give you two doughs: one for today, one for tomorrow morning.')];
const DOOR_T = { spring: 18, summer: 27, autumn: 17, winter: 8 };   /* 문 옆 창가 = 계절 바깥 기온쯤(어림 · 읽기·견주기만) */
const SPOTS = { warm: ['🔥', T2('화덕 곁 선반', 'Shelf by the oven'), 28], cold: ['❄️', T2('냉장고', 'Fridge'), 4], door: ['🚪', T2('문 옆 창가', 'By the door window'), 0], bowl: ['🥣', T2('따뜻한 물 그릇 위', 'Over a bowl of warm water'), 30] };
const tOf = (k, sea) => (k === 'door' ? DOOR_T[sea] ?? 18 : SPOTS[k][2]);
const riseOf = T => (T >= 24 ? 2 : T >= 15 ? 1.5 : 1.1);   /* 60~90분 동안 부푼 정도(어림): 따뜻함 = 두 배쯤 · 선선함 = 반쯤 더 · 차가움 = 거의 그대로 */
const waitOf = T => (T >= 24 ? 60 : T >= 15 ? 75 : 90);
const CSS = `
.twn-p .bk-board{position:relative;height:120px;border:3px solid var(--ink);border-radius:14px;background:#e9c99a;margin:6px 0;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden}
.twn-p .bk-board::before{content:'';position:absolute;left:30%;right:30%;top:8px;bottom:8px;border-left:2px dashed rgba(107,74,47,.35);border-right:2px dashed rgba(107,74,47,.35)}
.twn-p .bk-dough{position:absolute;top:30px;left:50%;width:96px;height:60px;margin-left:-48px;border-radius:46% 54% 50% 50%;background:#f6ead2;border:3px solid #8a6a44;box-shadow:inset -8px -6px 0 rgba(160,120,70,.22);will-change:transform}
.twn-p .bk-dough.s0{border-radius:38% 62% 44% 56%/58% 40% 60% 42%;box-shadow:inset -10px -8px 0 rgba(160,120,70,.3),inset 12px 6px 0 rgba(255,255,255,.35)}
.twn-p .bk-dough.s1{border-radius:44% 56% 48% 52%}
.twn-p .bk-dough.s2{border-radius:50%;box-shadow:inset -6px -5px 0 rgba(160,120,70,.18)}
.twn-p .bk-dots{display:flex;gap:5px;justify-content:center;margin:2px 0}
.twn-p .bk-dots i{width:13px;height:13px;border-radius:7px;background:#f3eadb;border:2px solid #c9b79c}
.twn-p .bk-dots i.g{background:#d99a3e;border-color:#6b4a2f}
.twn-p .bk-push{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.twn-p .bk-push button{min-height:48px;font-size:17px}
.twn-p .bk-spots{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:6px 0}
.twn-p .bk-spots button{min-height:78px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:15px;line-height:1.25}
.twn-p .bk-spots button b{font-size:26px;line-height:1}
.twn-p .bk-spots button small{font-size:13px;opacity:.85}
.twn-p .bk-oven{position:relative;height:150px;border:3px solid var(--ink);border-radius:14px 14px 40px 40px;background:#7a3b2a;margin:6px 0;overflow:hidden}
.twn-p .bk-oven .in{position:absolute;left:12%;right:12%;top:26px;bottom:18px;border-radius:50% 50% 12px 12px/40% 40% 12px 12px;background:#2b2622;box-shadow:inset 0 -14px 0 #ff8a2a}
.twn-p .bk-bread{position:absolute;left:50%;bottom:30px;width:110px;height:54px;margin-left:-55px;border-radius:50% 50% 22% 22%/70% 70% 30% 30%;border:3px solid #5a3a22;background:#f3dfb0;transform-origin:50% 100%}
.twn-p .bk-bread i{position:absolute;top:30%;width:22%;height:4px;border-radius:2px;background:rgba(90,58,34,.35);transform:rotate(-20deg)}
.twn-p .bk-res{display:flex;gap:12px;align-items:center;margin:6px 0}
.twn-p .bk-res .bk-pic{position:relative;flex:none;width:150px;height:96px;border:3px solid var(--ink);border-radius:12px;background:#fff7e8}
.twn-p .bk-res .bk-bread{bottom:16px}
`;
export function createBake(A) {
  const en = () => A.en(), L = () => (A.en() ? 1 : 0), S = () => A.GAME.S, esc = A.esc, sea = () => A.season();
  let css = null, B = null, tq = 0, dead = false;   /* B = 지금 열린 판(창) 하나 · 반죽 기다림은 S.bake(저장) */
  if (!document.getElementById('bk-css')) { css = document.createElement('style'); css.id = 'bk-css'; css.textContent = CSS; document.head.appendChild(css); }
  const now = () => (S().day | 0) * 1440 + (S().min | 0);
  const ladS = () => { let L9 = S().lad; if (!L9 || typeof L9 !== 'object' || Array.isArray(L9)) L9 = S().lad = {}; return L9.bake || (L9.bake = { lv: 0, good: 0, best: {}, fail: 0 }); };
  const hm = m => { m = ((m % 1440) + 1440) % 1440; const h = (m / 60) | 0, mi = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi; };
  const breadHtml = (rise, col) => '<div class="bk-bread" style="transform:scale(' + (0.62 + rise * 0.24).toFixed(2) + ',' + (0.5 + rise * 0.3).toFixed(2) + ');background:' + col + '"><i style="left:22%"></i><i style="left:44%"></i><i style="left:66%"></i></div>';
  const COLS = ['#f3dfb0', '#ecc785', '#d99a3e', '#b8732c', '#7a4a22', '#4a2e18'];   /* 하얀 반죽 → 노릇 → 갈색 → 탐 */
  const colAt = t => COLS[Math.min(COLS.length - 1, t < 7 ? (t / 3.5) | 0 : t < 16 ? 2 + ((t - 7) / 5) | 0 : 4 + ((t - 16) / 3) | 0)];
  const gradeAt = t => (t < 7 ? 0 : t < 16 ? 1 : 2);   /* 0 덜 구움 · 1 알맞음 · 2 탐 */
  function shut() { if (!B) return; if (B.P && B.key) B.P.removeEventListener('keydown', B.key); B = null; }
  const open = (h, k) => { const P = A.openP(h, false, k); return P; };
  // E(화덕 앞) — 반죽이 없으면 반죽 판 · 부푸는 중이면 지금 모습 · 다 부풀었으면 굽기
  function use() { if (dead || B || A.busy()) return; const d = S().bake; if (!d) { knead(); return; } const el = now() - d.t; if (el < d.w) { wait(d, el); return; } oven(d); }
  // ① 반죽 치대기: 반죽을 좌우로 끌기(또는 ◀ ▶ 단추 · ← → 키) · 판 가운데 점선을 넘나들면 한 번 · 열 번이면 매끈 → 자리 고르기
  function knead() { const e = en(), lad = ladS(), lv = Math.min(2, lad.lv | 0), N = 10;
    const h = '<h3>🍞 ' + (e ? 'Bread dough' : '빵 반죽') + '</h3><div class="sm">' + (e ? 'To do: knead the dough, then choose where it rises.' : '할 일: 반죽을 치대고, 부풀 자리를 골라요.') + '</div><div class="sm">' + (e ? 'Today: ' : '오늘 일: ') + esc(LV[lv][L()]) + '</div>'
      + '<div class="bk-board"><div class="bk-dough s0"></div></div><div class="bk-dots">' + '<i></i>'.repeat(N) + '</div><div class="bk-push"><button class="sub" data-p="-1">◀ ' + (e ? 'Push' : '밀기') + '</button><button class="sub" data-p="1">' + (e ? 'Push' : '밀기') + ' ▶</button></div><div class="msg sm">' + (e ? 'Drag the dough left and right across the board (or ◀ ▶).' : '반죽을 판 위에서 좌우로 쭉쭉 끌어요. (◀ ▶ 단추도 돼요)') + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Stop' : '그만') + '</button></div>';
    const P = open(h, 'bake'); B = { ph: 'knead', P, lv, n: 0, side: 0, t0: performance.now() }; const b = B, bd = P.querySelector('.bk-board'), dg = P.querySelector('.bk-dough'), dots = P.querySelectorAll('.bk-dots i');
    const at = x => { const r = bd.getBoundingClientRect(), u = Math.max(0, Math.min(1, (x - r.left) / r.width)); dg.style.transform = 'translateX(' + Math.round((u - 0.5) * (r.width - 100)) + 'px) scaleX(' + (1 + Math.abs(u - 0.5) * 0.5).toFixed(2) + ')'; return u; };
    const stroke = s9 => { if (B !== b || b.ph !== 'knead') return; if (s9 === b.side) return; const first = !b.side; b.side = s9; if (first) return; b.n++; if (dots[b.n - 1]) dots[b.n - 1].className = 'g'; dg.className = 'bk-dough s' + Math.min(2, (b.n / 4) | 0); A.sfx('tick'); if (b.n >= N) setTimeout(() => { if (B === b) spots(); }, 350); };
    let drag = false; bd.addEventListener('pointerdown', ev => { ev.preventDefault(); drag = true; bd.setPointerCapture && bd.setPointerCapture(ev.pointerId); const u = at(ev.clientX); if (u < 0.3) stroke(-1); else if (u > 0.7) stroke(1); });
    bd.addEventListener('pointermove', ev => { if (!drag) return; const u = at(ev.clientX); if (u < 0.3) stroke(-1); else if (u > 0.7) stroke(1); }); bd.addEventListener('pointerup', () => { drag = false; }); bd.addEventListener('pointercancel', () => { drag = false; });
    const push = s9 => { dg.style.transform = 'translateX(' + (s9 * 70) + 'px) scaleX(1.25)'; stroke(s9); };
    b.key = ev => { if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') { push(-1); ev.preventDefault(); } else if (ev.code === 'ArrowRight' || ev.code === 'KeyD') { push(1); ev.preventDefault(); } }; P.addEventListener('keydown', b.key);
    P.onclick = ev => { const t = ev.target.closest('button'); if (!t) return; if (t.dataset.a === 'x') { shut(); A.closeP(); return; } if (t.dataset.p) push(+t.dataset.p); if (t.dataset.s && b.ph === 'spot') pick(t.dataset.s); }; }
  // ② 부풀 자리: 꼬임마다 고를 것이 다름 · 기온(℃)은 읽고 견주기만
  function spots() { const b = B; if (!b) return; const e = en(), l = L(), s = sea(), lv = b.lv; b.ph = 'spot'; b.want = lv === 2 ? ['today', 'tom'] : ['today']; b.pick = {};
    b.opts = lv === 0 ? ['warm', 'cold'] : ['door', 'cold', 'bowl'];
    draw(); }
  function draw() { const b = B, e = en(), l = L(), s = sea(), q = b.want.find(w => !b.pick[w]), bx = b.P.querySelector('.bx');
    const ask = q === 'tom' ? (e ? 'Dough 2 will be baked tomorrow morning. Where can it rise slowly all night?' : '반죽 둘째는 내일 아침에 구워요. 밤새 천천히 부풀 자리는 어디일까요?') : b.lv === 2 ? (e ? 'Dough 1 is baked this afternoon. Where will it rise well in an hour?' : '반죽 첫째는 오늘 오후에 구워요. 한 시간 남짓 만에 잘 부풀 자리는 어디일까요?') : (e ? 'We bake it this afternoon. Where will it rise well in about an hour?' : '오늘 오후에 구울 반죽이에요. 한 시간 남짓 만에 잘 부풀 자리는 어디일까요?');
    const opts = b.lv === 2 ? ['warm', 'cold', 'door'] : b.opts;
    bx.innerHTML = '<h3>🍞 ' + (e ? 'Where should it rise?' : '어디에서 부풀릴까요?') + '</h3><div class="sm">' + (e ? 'To do: choose where the dough rises.' : '할 일: 반죽이 부풀 자리를 골라요.') + '</div><div class="pc-tx">' + ask + '</div>'
      + (b.lv === 1 ? '<div class="sm">' + (e ? 'The shelf by the oven is full today.' : '오늘은 화덕 곁 선반이 꽉 찼어요.') + '</div>' : '')
      + '<div class="bk-spots">' + opts.map(k => { const S9 = SPOTS[k], T = tOf(k, s); return '<button class="sub" data-s="' + k + '"><b>' + S9[0] + '</b>' + esc(S9[1][l]) + '<small>' + (e ? 'about ' : '약 ') + T + '℃</small></button>'; }).join('') + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Stop' : '그만') + '</button></div>'; }
  function pick(k) { const b = B; if (!b || b.ph !== 'spot') return; const q = b.want.find(w => !b.pick[w]); if (!q) return; b.pick[q] = k; A.sfx('pop'); if (b.want.some(w => !b.pick[w])) { draw(); return; } place(); }
  function place() { const b = B, e = en(), s = sea(), k = b.pick.today, T = tOf(k, s), w = waitOf(T), sec9 = Math.round((performance.now() - b.t0) / 100) / 10;
    S().bake = { t: now(), w, k, T, lv: b.lv, tom: b.pick.tom || null, sea: s, sec: sec9 }; if (A.GAME.mark) A.GAME.mark(); if (A.rec) A.rec('job', { k: 'bake', ph: 'dough', lv: b.lv, spot: k, sec: sec9 });
    const S9 = SPOTS[k], at = hm(now() + w); shut(); A.closeP(); A.handShow && A.handShow('🍞');
    A.toast('🍞 ' + (e ? 'The dough is resting: ' + S9[1][1] + '. Come back to the oven around ' + at + '.' : '반죽을 ' + S9[1][0] + '에 두었어요. ' + at + '쯤 화덕 앞으로 다시 와요.'), 4); }
  // 기다리는 중: 지금 모습(부푼 만큼) + 언제 오면 되는지 한 줄
  function wait(d, el) { const e = en(), l = L(), u = Math.min(1, el / d.w), r = 1 + (riseOf(d.T) - 1) * u, S9 = SPOTS[d.k];
    const h = '<h3>🍞 ' + (e ? 'The dough is rising' : '반죽이 부푸는 중') + '</h3><div class="bk-res"><div class="bk-pic">' + breadHtml(r, COLS[0]) + '</div><div class="pc-tx">' + S9[0] + ' ' + esc(S9[1][l]) + (e ? ' (about ' + d.T + '℃). Come back around ' + hm(d.t + d.w) + '.' : ' (약 ' + d.T + '℃)에 있어요. ' + hm(d.t + d.w) + '쯤 다시 와요.') + '</div></div><div class="row"><button data-a="x">' + (e ? 'OK' : '좋아요') + '</button></div>';
    const P = open(h, 'bake'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; }
  // ③ 굽기: 화덕 속 빵 빛깔이 바뀜 → 노릇할 때 꺼내기(넓은 폭) · 22초면 저절로 꺼냄(탐) · 창을 닫으면 그때 꺼냄
  function oven(d) { const e = en(), l = L(), r = riseOf(d.T);
    const h = '<h3>🍞 ' + (e ? 'Bake it in the oven' : '화덕에 굽기') + '</h3><div class="sm">' + (e ? 'To do: take the bread out when it turns golden brown.' : '할 일: 빵이 노릇해지면 꺼내요.') + '</div><div class="pc-tx">' + (r >= 2 ? (e ? 'The dough rose to about twice its size.' : '반죽이 두 배쯤 부풀었어요.') : r >= 1.5 ? (e ? 'The dough rose a little.' : '반죽이 조금 부풀었어요.') : (e ? 'The dough hardly rose.' : '반죽이 거의 안 부풀었어요.')) + '</div>'
      + '<div class="bk-oven"><div class="in"></div>' + breadHtml(r, COLS[0]) + '</div><div class="msg sm">' + (e ? 'Watch the colour.' : '빛깔을 지켜봐요.') + '</div><div class="row"><button data-a="out">' + (e ? 'Take it out' : '꺼내기') + '</button></div>';
    const P = open(h, 'bake'); B = { ph: 'oven', P, d, r, t: 0, ci: 0, br: P.querySelector('.bk-bread'), msg: P.querySelector('.msg'), smell: 0 }; const b = B; A.sfx('pop');
    b.key = ev => { if (ev.code === 'KeyE' || ev.code === 'Space' || ev.code === 'Enter') { ev.preventDefault(); out(); } }; P.addEventListener('keydown', b.key);
    P.onclick = ev => { const t = ev.target.closest('button'); if (t && t.dataset.a === 'out') out(); }; }
  function out(quiet) { const b = B; if (!b || b.ph !== 'oven') return; const d = b.d, g = gradeAt(b.t), col = colAt(b.t), lad = ladS(), lv = d.lv | 0, e = en(), l = L(); shut(); S().bake = null;
    const rose = d.T >= 24, tomOk = !d.tom || d.tom === 'cold', st = 1 + (g === 1 ? 1 : 0) + (rose && tomOk ? 1 : 0);
    let up = 0; if (st >= 2) { lad.good = (lad.good | 0) + 1; lad.fail = 0; if (lad.good >= 3 && lv < 2) { lad.lv = lv + 1; lad.good = 0; up = lv + 1; } } else lad.fail = (lad.fail | 0) + 1; { const B9 = lad.best || (lad.best = {}); if (!(B9['s' + lv] >= st)) B9['s' + lv] = st; }
    const want = g === 2 ? 0 : g === 1 && rose ? 2 : 1, got = want ? A.bagAdd('🍞', want, 'bake:bread') : 0; if (!quiet) A.skUp('cook', 3 + st, 'bake');   /* 창 없이 꺼냄(잠·Esc) = 솜씨 X — 레벨 보상 창이 잠 마무리 뒤에 끼어 뜨지 않게 */ A.law('yeast', '🍞', 'rise'); if (A.GAME.mark) A.GAME.mark();
    if (A.rec) A.rec('job', { k: 'bake', ph: 'bake', lv, st, g, spot: d.k, T: d.T, sec: Math.round(b.t) });
    const gt = [T2('덜 구웠어요. 속이 아직 하얘요.', 'Underbaked — still pale inside.'), T2('알맞게 구웠어요. 겉이 노릇해요.', 'Baked just right — golden outside.'), T2('탔어요. 탄 빵은 먹지 않아요.', 'Burnt — we don’t eat burnt bread.')][g];
    const rt = rose ? T2('따뜻한 곳에서 효모가 잘 일해서 크게 부풀었어요.', 'Somewhere warm, the yeast worked well and the bread rose big.') : d.T >= 15 ? T2('선선한 곳이라 효모가 천천히 일해서 조금만 부풀었어요.', 'It was cool, so the yeast worked slowly and the bread rose a little.') : T2('차가운 곳이라 효모가 거의 일하지 못해서 납작해요.', 'It was cold, so the yeast barely worked and the bread is flat.');
    const nx = !rose ? T2('다음엔 더 따뜻한 자리에 두어 봐요.', 'Next time, try a warmer spot.') : g === 0 ? T2('다음엔 노릇해질 때까지 조금 더 기다려 봐요.', 'Next time, wait a little longer, until it turns golden.') : g === 2 ? T2('다음엔 갈색이 짙어지기 전에 꺼내 봐요.', 'Next time, take it out before it goes dark brown.') : d.tom && d.tom !== 'cold' ? T2('내일 아침 반죽은 차가운 곳에서 밤새 천천히 부풀려요.', 'Tomorrow’s dough should rise slowly overnight somewhere cold.') : T2('자리도 굽기도 알맞았어요.', 'Both the spot and the baking were right.');
    if (quiet) { A.toast('🍞 ' + gt[l] + (got ? (e ? ' +🍞' + got : ' 🍞 ' + got + '개') : ''), 3.4); return; }
    const h = '<h3>🍞 ' + (e ? 'Out of the oven' : '다 구웠어요') + '</h3><div class="bk-res"><div class="bk-pic">' + breadHtml(b.r, col) + '</div><div><div class="pc-tx"><b>' + esc(gt[l]) + '</b> ' + esc(rt[l]) + '</div>'
      + (d.tom ? '<div class="sm">' + (d.tom === 'cold' ? (e ? 'Dough 2 is in the fridge, rising slowly for tomorrow morning.' : '반죽 둘째는 냉장고에서 내일 아침까지 천천히 부풀어요.') : (e ? 'Dough 2 is already puffed up and will be flat by morning.' : '반죽 둘째는 벌써 다 부풀어서 아침엔 꺼질 거예요.')) + '</div>' : '')
      + '<div class="pc-tx">' + esc(nx[l]) + '</div>' + (got ? '<div class="sm">' + (e ? 'Into my bag: 🍞 ×' + got : '가방에 🍞 ' + got + '개') + '</div>' : want ? '<div class="sm">' + (e ? 'I already got today’s share of bread here. This one was practice.' : '오늘 빵 몫은 다 받았어요. 이번엔 연습이에요.') + '</div>' : '')
      + (up && UP[up] ? '<div class="pc-tx">🍞 ' + (e ? 'Bakery clerk: ' : '빵집 점원: ') + '“' + esc(UP[up][l]) + '”</div>' : '') + '</div></div>'
      + '<div class="sm">💡 ' + (e ? 'Yeast is a tiny living thing. Somewhere warm it puffs the dough up fast; in the cold it works slowly.' : '효모는 아주 작은 생물이에요. 따뜻하면 반죽을 빨리 부풀리고, 차가우면 천천히 부풀려요.') + '</div><div class="row"><button data-a="x">' + (e ? 'OK' : '좋아요') + '</button></div>';
    A.sfx(g === 1 ? 'done' : 'ding'); const P = open(h, 'bake'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; }
  // 마을 tick(dt): 굽는 동안만 빛깔(0.1초 칸 · 바뀔 때만 DOM) · 1초 칸 = 다 부풀면 한 번 알림 · 창이 닫혔으면 판을 정리
  function tick(dt) { if (dead) return; const b = B;
    if (b) { if (!b.P.isConnected) { if (b.ph === 'oven') out(true); else shut(); return; }
      if (b.ph === 'oven') { b.t += Math.min(dt, 0.1); const c = colAt(b.t); if (c !== b.col) { b.col = c; b.br.style.background = c; } const sm = b.t >= 16 ? 2 : b.t >= 7 ? 1 : 0; if (sm !== b.smell) { b.smell = sm; b.msg.textContent = sm === 1 ? (en() ? 'A toasty smell. It is turning golden.' : '고소한 냄새가 나요. 노릇해지고 있어요.') : (en() ? 'A burning smell!' : '타는 냄새가 나요!'); A.sfx('tick'); } if (b.t >= 22) out(); } }
    if ((tq += dt) < 1) return; tq = 0; const d = S().bake; if (d && !d.told && now() - d.t >= d.w && !A.inBake()) { d.told = 1; if (A.GAME.mark) A.GAME.mark(); A.toast(en() ? '🍞 The dough at the bakery has risen. Go and bake it!' : '🍞 빵집 반죽이 다 부풀었어요. 가서 구워요!', 3.6); } }
  // 덮개 없이 멈춰야 할 때(잠 · 하늘에서 보기) — 굽던 빵은 그때 꺼냄(알림만) · 반죽 판은 접음
  function abort() { if (!B) return; if (B.ph === 'oven') out(true); else shut(); }
  return { use, tick, abort, get open() { return B ? B.ph : null; }, info: () => ({ lad: ladS(), dough: S().bake ? { ...S().bake, left: S().bake.w - (now() - S().bake.t) } : null, ph: B ? B.ph : null, t: B && B.ph === 'oven' ? B.t : 0, n: B && B.ph === 'knead' ? B.n : 0 }),
    dbg: { stroke: n => { const b = B; if (!b || b.ph !== 'knead') return 0; const btn = b.P.querySelectorAll('.bk-push button'); for (let i = 0; i < n; i++) btn[i % 2].click(); return b.n; }, pick: k => pick(k), out: () => out(), ovenT: t => { if (B && B.ph === 'oven') B.t = t; } },
    dispose() { dead = true; shut(); if (css) { css.remove(); css = null; } } };
}
