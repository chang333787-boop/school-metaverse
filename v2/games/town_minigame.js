// 🎮 일꾼 곁 거들기 놀이 틀 다섯(PLAY-2 · 아이 눈 플레이테스트 10-17 1위 혹평 '낚시도 딸기도 꿀도 다 빨간 막대잖아요'): 놀이 코드와 떼어 둔 규칙·화면(town_skill.js와 같은 결)
//   bar 막대(옛 그대로 — 나무 심기·감자·조개·요리·징검다리) · line 줄 버티기(낚시·김발·굴 줄) · ripe 익은 것만 고르기(딸기·배·표고·배추) · rhythm 장단 맞추기(논일·소금·건초) · bee 벌 피해서 살살(꿀)
//   결과 = 점수 0~3(옛 보상 표 그대로 — 0 아쉬움 · 1~2 잘함 · 3 아주 잘함) · 실패도 경험치 1은 마을 쪽 규칙 그대로
//   솜씨 perk 'zone'(zw 1~1.25)은 틀마다 쉬워지는 쪽으로: 막대·줄 = 초록 폭 · 장단 = 판정 폭 · 고르기 = 시간 · 꿀 = 벌을 비키는 폭
//   화면 = DOM + CSS transform·opacity(놀이 창이 열린 동안만 · 마을 tick이 부르는 tick(dt) 하나 — 따로 rAF X) · 요소는 처음에 다 만들어 두고 매 프레임 새 객체 X
//   입력 = down()/up()(E·스페이스 누름·뗌 · 큰 단추 누름·뗌) + key(코드)(고르기 판의 숫자·화살표) — 마을 keyDn이 넘겨 줌
export const MG_V = 1;
const KIND = { fisher: 'line', seaweed: 'line', oyster: 'line', strawberry: 'ripe', pear: 'ripe', shiitake: 'ripe', cabbage: 'ripe', paddy: 'rhythm', saltpan: 'rhythm', pasture: 'rhythm', beehive: 'bee' };
export const mgKind = k => KIND[k] || 'bar';
export const gradeOf = ok => (ok >= 3 ? 2 : ok >= 1 ? 1 : 0);
const GRADE_T = [['아쉬워요! 다음엔 더 잘할 수 있어요', 'So close! You’ll get it next time'], ['잘했어요!', 'Well done!'], ['아주 잘했어요!', 'Excellent!']];
export const gradeText = (ok, en) => GRADE_T[gradeOf(ok)][en ? 1 : 0];

// 익은 것 고르기: [판 갈래, 그림, 처음 안내, 덜 익은 것을 눌렀을 때, 반쯤 익은 것을 눌렀을 때] · 덜 익음(u) → 반쯤(h) → 익음(r) 차례로 익음 — 사실만(딸기 = 빨갛게 다 익으면 · 배 = 크고 누렇게 · 표고 = 갓이 알맞게 펴지면 · 배추 = 속이 꽉 차면)
const RIPE = {
  strawberry: ['s', '🍓', ['빨갛게 다 익은 딸기만 눌러요 — 하얗고 초록인 딸기는 더 기다려요', 'Tap only fully red strawberries — pale green ones need more time'], ['아직 안 익었어요 — 초록빛이 남았어요', 'Not ripe yet — it’s still greenish'], ['조금만 더 — 끝까지 빨개지면 따요', 'Almost — wait till it’s red all over']],
  pear: ['p', '🍐', ['크고 누렇게 익은 배만 눌러요 — 작고 초록인 배는 더 자라요', 'Tap only big golden pears — small green ones need to grow'], ['아직 안 익었어요 — 더 크고 누레질 때까지', 'Not ripe yet — wait till it’s bigger and golden'], ['조금만 더 — 초록빛이 다 가시면 따요', 'Almost — wait till the green is gone']],
  shiitake: ['m', '🍄', ['갓이 넓게 핀 표고만 눌러요 — 작은 봉오리는 더 자라요', 'Tap only shiitake with open caps — tiny buttons need to grow'], ['아직 작아요 — 갓이 더 펴질 때까지', 'Too small — wait till the cap opens'], ['조금만 더 — 갓이 넓게 펴지면 따요', 'Almost — wait till the cap spreads wide']],
  cabbage: ['c', '🥬', ['크고 속이 꽉 찬 배추만 눌러요 — 작은 배추는 더 자라요', 'Tap only big, full cabbages — small ones need to grow'], ['아직 작아요 — 속이 꽉 찰 때까지', 'Too small — wait till it fills out'], ['조금만 더 — 더 크고 단단해지면 따요', 'Almost — wait till it’s bigger and firm']],
};
// 장단(20박 = 네 박씩 다섯 마디 · x = 누르는 박): 논일·소금·건초마다 다른 가락 · 한 박 0.68초(약 88 BPM — 4학년이 따라 치기 쉬운 빠르기) · 한 판 약 17초
const RHY = { paddy: 'xxx.xx.xxxx.x.xxxxx.', saltpan: 'x.x.xxx.x.x.xxx.x.x.', pasture: 'xx.xxx.xxxx.xx.xx.x.' };
const BEAT = 0.68;

const CSS = `
.twn-play .mg{display:flex;flex-direction:column;gap:6px;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.twn-play .pb.mg-end .mg{opacity:.55;transition:opacity .2s}
.twn-play .mg .dim{opacity:.35}
.twn-play .dots{display:flex;gap:6px;justify-content:center}
.twn-play .dots i{width:14px;height:14px;border-radius:7px;background:#e7efe3;border:2px solid #c9d6c4}
.twn-play .dots i.g{background:#7fd06a;border-color:#2b5a3a}
.twn-play .dots i.m{background:#f6d3cf;border-color:#e0453a}
.twn-play .wt{height:40px;background:linear-gradient(#cdeefa,#8fd4ff)}
.twn-play .wt .fl{position:absolute;left:50%;top:9px;width:16px;height:22px;margin-left:-8px;border-radius:8px;background:linear-gradient(#e0453a 50%,#fffdf6 50%);border:2px solid #1d2b3a;will-change:transform}
.twn-play .wt .cue{position:absolute;left:50%;top:6px;margin-left:16px;font-size:20px;line-height:1;color:#e0453a;opacity:0;transition:opacity .1s}
.twn-play .wt.on .cue{opacity:1}
.twn-play .pgb{height:10px}
.twn-play .pg{position:absolute;left:0;top:0;bottom:0;width:100%;background:#2b5a3a;transform-origin:0 50%;transform:scaleX(0)}
.twn-play .rg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.twn-play .rg .rt{position:relative;min-height:58px;padding:0;border-radius:12px;background:#eef5ea;color:#1d2b3a;font-size:34px;line-height:1;border:2px solid #d5e2cf}
.twn-play .rg .rt .rf{display:inline-block;transition:transform .35s,filter .35s,opacity .3s}
.twn-play .rg .rt em{position:absolute;left:6px;top:4px;font-size:11px;font-style:normal;font-weight:700;color:#56606b}
.twn-play .rg .rt.sel{border-color:#2b5a3a;box-shadow:inset 0 0 0 2px #2b5a3a}
.twn-play .rg .rt.e .rf{opacity:.14;transform:scale(.35);filter:grayscale(1)}
.twn-play .rg .rt.no{animation:twn-mg-shake .35s}
@keyframes twn-mg-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.twn-play .rg[data-c=s] .u .rf{filter:hue-rotate(100deg) saturate(.55) brightness(1.2);transform:scale(.72)}
.twn-play .rg[data-c=s] .h .rf{filter:hue-rotate(28deg) saturate(.75) brightness(1.18);transform:scale(.9)}
.twn-play .rg[data-c=p] .r .rf{filter:saturate(1.35) hue-rotate(-14deg)}
.twn-play .rg[data-c=p] .u .rf{filter:hue-rotate(50deg) saturate(1.3) brightness(.92);transform:scale(.66)}
.twn-play .rg[data-c=p] .h .rf{filter:hue-rotate(24deg) saturate(1.2);transform:scale(.86)}
.twn-play .rg[data-c=m] .rf{filter:sepia(1) saturate(1.5) hue-rotate(-18deg) brightness(.8)}
.twn-play .rg[data-c=m] .r .rf{transform:scale(1.12)}
.twn-play .rg[data-c=m] .u .rf{transform:scale(.45)}
.twn-play .rg[data-c=m] .h .rf{transform:scale(.68);filter:sepia(1) saturate(1.1) hue-rotate(-18deg) brightness(.95)}
.twn-play .rg[data-c=c] .r .rf{transform:scale(1.12)}
.twn-play .rg[data-c=c] .u .rf{filter:saturate(.55) brightness(1.3);transform:scale(.55)}
.twn-play .rg[data-c=c] .h .rf{filter:saturate(.8) brightness(1.12);transform:scale(.82)}
.twn-play .tmb{height:8px}
.twn-play .tm{position:absolute;left:0;top:0;bottom:0;width:100%;background:#7fd06a;transform-origin:0 50%}
.twn-play .rl{height:50px;background:#f3ead2}
.twn-play .rl .hz{position:absolute;left:14%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:4px solid #2b5a3a;background:#fffdf6;box-sizing:border-box;transition:transform .08s}
.twn-play .rl .hz.pu{transform:scale(1.15)}
.twn-play .rl .nt{position:absolute;left:0;top:50%;width:30px;margin:-15px 0 0 -15px;font-size:26px;line-height:30px;text-align:center;font-style:normal;will-change:transform;transition:opacity .2s}
.twn-play .rl .nt.p,.twn-play .rl .nt.g{opacity:0}
.twn-play .rl .nt.m{opacity:.25;filter:grayscale(1)}
.twn-play .rl .fb{position:absolute;left:calc(14% + 28px);top:50%;margin-top:-9px;font-size:17px;line-height:18px;color:#2b5a3a;opacity:0}
.twn-play .rl .fb.on{animation:twn-mg-fb .6s}
@keyframes twn-mg-fb{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-10px)}}
.twn-play .hv{position:relative;height:64px;border-radius:13px;overflow:hidden;background:repeating-linear-gradient(60deg,#f2c86a 0 10px,#e9b23a 10px 20px)}
.twn-play .hv .sc{position:absolute;left:39%;width:22%;top:0;bottom:0;background:rgba(255,253,246,.55);border-left:2px dashed #a2541b;border-right:2px dashed #a2541b;box-sizing:border-box;transition:background .15s}
.twn-play .hv .sc.dz{background:rgba(224,69,58,.28)}
.twn-play .hv .be{position:absolute;left:0;top:18px;width:28px;margin-left:-14px;font-size:26px;line-height:28px;text-align:center;font-style:normal;will-change:transform;transition:opacity .3s}
.twn-play .hv .be.off{opacity:0}
.twn-play .hv .be.st{filter:drop-shadow(0 0 5px #fff) drop-shadow(0 0 3px #fff)}
.twn-play .jars{display:flex;gap:12px;justify-content:center;font-size:24px}
.twn-play .jars i{font-style:normal;opacity:.25;transition:opacity .3s,transform .3s}
.twn-play .jars i.f{opacity:1;transform:scale(1.15)}
`;
function css() { if (document.getElementById('twn-mg-css')) return; const s = document.createElement('style'); s.id = 'twn-mg-css'; s.textContent = CSS; document.head.appendChild(s); }
const rnd = (a, b) => a + Math.random() * (b - a);
const setCls = (el, c) => { if (el.className !== c) el.className = c; };
const pop = (el, c) => { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); };   // 일이 생길 때만(매 프레임 X)

// ① 막대(옛 그대로): 빨간 막대가 초록 칸에 올 때 누르기 세 번 → 맞힌 수 = 점수
function mkBar(c) {
  c.mg.innerHTML = '<div class="bar"><i class="zone"></i><i class="mk"></i></div>';
  const z9 = c.mg.querySelector('.zone'), mk = c.mg.querySelector('.mk'), zw = c.zw; let zone = rnd(0.35, 0.65), sp = rnd(0.9, 1.4), t = 0, pos = 0.5, round = 0, ok = 0;
  const place = () => { z9.style.width = (18 * zw) + '%'; z9.style.left = (zone * 100 - 9 * zw) + '%'; }; place();
  c.say(c.T('빨간 막대가 초록 칸에 오면 E!', 'Press E when the red bar is in the green!'));
  return { go: c.T('지금!', 'Now!'),
    down() { const good = Math.abs(pos - zone) < 0.09 * zw; round++; if (good) ok++; c.snd(good ? 'tick' : 'pop'); c.say((good ? c.T('좋아요! ', 'Nice! ') : c.T('아깝다! ', 'Almost! ')) + round + '/3'); zone = rnd(0.25, 0.75); sp = rnd(0.9, 1.5); place(); if (round >= 3) c.finish(ok); },
    tick(dt) { t += dt * sp; pos = 0.5 + 0.5 * Math.sin(t * 2.2); mk.style.left = (pos * 100) + '%'; } };
}

// ② 줄 버티기(낚시·김발·굴 줄): 기다렸다 신호에 E(낚시 = 찌가 쏙 · 김발·굴 = 물결이 잔잔해질 때) → E를 꾹 눌렀다 뗐다 빨간 막대(줄 당김)를 초록 칸에 → 다 올리면 하나 · 세 번
function mkLine(c) {
  const fish = c.k === 'fisher', zw = c.zw;
  c.mg.innerHTML = '<div class="bar wt"><i class="fl"></i><b class="cue">!</b></div><div class="bar tn dim"><i class="zone"></i><i class="mk"></i></div><div class="bar pgb dim"><i class="pg"></i></div><div class="dots"><i></i><i></i><i></i></div>';
  const wt = c.mg.querySelector('.wt'), fl = c.mg.querySelector('.fl'), tn = c.mg.querySelector('.tn'), z9 = tn.querySelector('.zone'), mk = tn.querySelector('.mk'), pgb = c.mg.querySelector('.pgb'), pg = c.mg.querySelector('.pg'), dots = c.mg.querySelectorAll('.dots i');
  const HW = 0.14 * zw;   /* 초록 칸 반폭(솜씨가 늘면 넓어짐) */ z9.style.width = (HW * 200) + '%';
  const W_TXT = fish ? c.T('찌를 보다가 쏙 들어가면 E!', 'Watch the float — press E when it dips!') : c.T('물결이 셀 땐 기다리고, 잔잔해지면 E!', 'Wait while the waves are big — press E when it calms!');
  const R_TXT = c.T('E를 꾹 눌렀다 뗐다 — 빨간 막대를 초록 칸에!', 'Hold and release E — keep the red bar in the green!');
  let ph = 'wait', tw = 0, t = 0, tt = 0, hold = false, ten = 0.45, prog = 0, tight = 0, round = 0, ok = 0, gap = 0, ph0 = rnd(0, 6), early = 0;
  const wait = () => { ph = 'wait'; tw = fish ? rnd(1.3, 3.0) : rnd(1.4, 2.6); setCls(wt, 'bar wt'); setCls(tn, 'bar tn dim'); setCls(pgb, 'bar pgb dim'); c.say(W_TXT); };
  const endRound = got => { dots[round].className = got ? 'g' : 'm'; round++; if (got) ok++; c.snd(got ? 'ding' : 'pop'); hold = false; if (round >= 3) { c.finish(ok); return; } ph = 'gap'; gap = 0.8; };
  wait();
  return { go: c.T('당기기 (꾹)', 'Reel (hold)'),
    down() { if (ph === 'wait') { early++; tw = fish ? rnd(1.2, 2.2) : rnd(1.0, 1.8); c.snd('pop'); c.say(fish ? c.T('너무 일찍! 물고기가 놀랐어요 — 찌가 쏙 들어갈 때까지', 'Too early! The fish got startled — wait for the dip') : c.T('물결이 셀 땐 줄이 무거워요 — 잔잔해질 때까지', 'The waves make it heavy — wait till it calms')); return; }
      if (ph === 'bite') { ph = 'reel'; hold = true; ten = 0.45; prog = 0; tight = 0; tt = 0; setCls(wt, 'bar wt dim'); setCls(tn, 'bar tn'); setCls(pgb, 'bar pgb'); c.snd('tick'); c.say(R_TXT); return; }
      if (ph === 'reel') hold = true; },
    up() { hold = false; },
    tick(dt) { t += dt;
      if (ph === 'wait' || ph === 'bite') { const big = !fish && ph === 'wait', y = ph === 'bite' && fish ? 10 : Math.sin(t * (big ? 5.5 : 2.6)) * (big ? 7 : 2); fl.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
        if (ph === 'wait' && (tw -= dt) <= 0) { ph = 'bite'; tw = (fish ? 0.9 : 1.3) * zw; setCls(wt, 'bar wt on'); c.snd('tick'); c.say(fish ? c.T('쏙! 지금 E!', 'A bite! Press E now!') : c.T('잔잔해요! 지금 E!', 'Calm now! Press E!')); }
        else if (ph === 'bite' && (tw -= dt) <= 0) { setCls(wt, 'bar wt'); c.say(fish ? c.T('놓쳤어요! 다음 물고기를 기다려요', 'Missed it! Wait for the next one') : c.T('물결이 다시 세졌어요 — 다음 줄', 'The waves are back — next rope')); endRound(false); }
        return; }
      if (ph === 'gap') { if ((gap -= dt) <= 0) wait(); return; }
      tt += dt; const pull = fish ? 0.4 * Math.sin(1.9 * tt + ph0) + 0.25 * Math.sin(3.7 * tt + ph0 * 2) : -0.12 + 0.12 * Math.sin(1.3 * tt + ph0);   /* 낚시 = 물고기가 이리저리 당김 · 김발·굴 = 무거운 줄이 아래로 */
      ten = Math.min(1, Math.max(0, ten + ((hold ? 0.62 : -0.7) + pull) * dt)); const cen = fish ? 0.55 + 0.12 * Math.sin(0.8 * tt + ph0) : 0.55, inn = Math.abs(ten - cen) < HW;
      prog = Math.min(1, Math.max(0, prog + (inn ? 0.34 : -0.1) * dt));
      if (ten >= 0.985) { if ((tight += dt) > 0.35) { tight = 0; prog = Math.max(0, prog - 0.25); ten = 0.6; c.snd('buzz'); c.say(c.T('줄이 너무 팽팽해요! 살살 — 손을 떼 봐요', 'Too tight! Ease off — let go a little')); } } else tight = 0;
      z9.style.left = ((cen - HW) * 100) + '%'; mk.style.left = (ten * 100) + '%'; pg.style.transform = 'scaleX(' + prog.toFixed(3) + ')';
      if (prog >= 1) { c.say(fish ? c.T('낚았어요! ', 'Caught one! ') + (round + 1) + '/3' : c.T('줄을 다 올렸어요! ', 'Rope lifted! ') + (round + 1) + '/3'); endRound(true); }
      else if (tt > 8) { c.say(fish ? c.T('물고기가 줄을 풀고 갔어요 — 다음엔 초록 칸에 오래', 'It slipped away — stay in the green longer') : c.T('줄이 무거워요 — 다음 줄로', 'Too heavy — on to the next rope')); endRound(false); } } };
}

// ③ 익은 것만 고르기(딸기·배·표고·배추): 아홉 칸에 익은 것·덜 익은 것이 섞여 나옴(덜 익은 것은 시간이 지나면 익음) → 익은 것만 누르기 · 덜 익은 걸 누르면 '아직 안 익었어요'(관찰) · 딴 수 − 잘못 누른 수로 점수
function mkRipe(c) {
  const R = RIPE[c.k] || RIPE.strawberry, T = 15 * c.zw, N = 9;
  let h = '<div class="rg" data-c="' + R[0] + '">'; for (let i = 0; i < N; i++) h += '<button class="rt u" data-i="' + i + '"><span class="rf">' + R[1] + '</span><em>' + (i + 1) + '</em></button>'; h += '</div><div class="bar tmb"><i class="tm"></i></div>';
  c.mg.innerHTML = h; const rg = c.mg.querySelector('.rg'), B = rg.querySelectorAll('.rt'), tm = c.mg.querySelector('.tm'), st = new Array(N).fill('u'), age = new Array(N).fill(0);
  let sel = 4, left = T, rip = 0, none = 0, P = 0, M = 0;
  const draw = i => setCls(B[i], 'rt ' + st[i] + (i === sel ? ' sel' : ''));
  const grow = (a, b, amin) => { let k = -1, n = 0; for (let i = 0; i < N; i++) if (st[i] === a && age[i] >= amin) { n++; if (Math.random() * n < 1) k = i; } if (k >= 0) { st[k] = b; age[k] = 0; draw(k); } return k; };   // a 단계 가운데 하나를 골라 b로(따로 배열 X)
  { const idx = [0, 1, 2, 3, 4, 5, 6, 7, 8]; for (let i = N - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, q = idx[i]; idx[i] = idx[j]; idx[j] = q; } for (let i = 0; i < 3; i++) { st[idx[i]] = 'r'; st[idx[i + 3]] = 'h'; } age.fill(1); for (let i = 0; i < N; i++) draw(i); }
  const pick = i => { if (c.done || i < 0 || i >= N) return; if (sel !== i) { const o = sel; sel = i; draw(o); } if (st[i] === 'r') { st[i] = 'e'; age[i] = 0; P++; draw(i); c.snd('pick'); c.say(c.T('똑! ', 'Pick! ') + P + c.T('개 땄어요', ' picked')); }
    else if (st[i] === 'u' || st[i] === 'h') { M++; draw(i); pop(B[i], 'no'); c.snd('pop'); c.say(R[st[i] === 'h' ? 4 : 3][c.en ? 1 : 0]); } };
  const onPd = e => { const b = e.target.closest('.rt'); if (!b) return; e.preventDefault(); pick(+b.dataset.i); }; rg.addEventListener('pointerdown', onPd);
  if (c.go) c.go.style.display = 'none';   /* 칸을 바로 누름(큰 단추 없음) · 키보드 = 숫자 1~9 또는 화살표 + E */
  c.say(R[2][c.en ? 1 : 0]);
  return { go: '',
    down() { pick(sel); },
    key(code) { const d = /^(Digit|Numpad)([1-9])$/.exec(code); if (d) { pick(+d[2] - 1); return true; }
      const mv = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -3, KeyW: -3, ArrowDown: 3, KeyS: 3 }[code]; if (!mv) return false; const n = sel + mv; if (n < 0 || n >= N || (Math.abs(mv) === 1 && ((n / 3) | 0) !== ((sel / 3) | 0))) return true; const o = sel; sel = n; draw(o); draw(n); return true; },
    tick(dt) { left -= dt; tm.style.transform = 'scaleX(' + Math.max(0, left / T).toFixed(3) + ')'; let nr = 0;
      for (let i = 0; i < N; i++) { age[i] += dt; if (st[i] === 'e' && age[i] > 1.4) { st[i] = 'u'; age[i] = 0; draw(i); } else if (st[i] === 'r') nr++; }
      if ((rip += dt) > 1.25) { rip = 0; grow('h', 'r', 0.6); grow('u', 'h', 0.8); } if (nr) none = 0; else if ((none += dt) > 0.4) { none = 0; if (grow('h', 'r', 0) < 0) grow('u', 'r', 0); }
      if (left <= 0) { const s = P - M; c.finish(s >= 8 ? 3 : s >= 5 ? 2 : s >= 2 ? 1 : 0); } },
    dispose() { rg.removeEventListener('pointerdown', onPd); } };
}

// ④ 장단 맞추기(논일·소금 모으기·건초): 넷 세고 → 박 그림이 동그라미에 닿을 때 E(두레 일노래처럼 다 같이 · 박마다 북소리) · 얼쑤!(딱) 좋다!(조금 어긋남) · 맞힌 비율로 점수
function mkRhythm(c) {
  const pat = RHY[c.k] || RHY.paddy, emo = c.k === 'paddy' ? (c.sea === 'spring' ? '🌱' : '🌾') : c.k === 'saltpan' ? '🧂' : '🌾', zw = c.zw, TN = [];
  for (let i = 0; i < pat.length; i++) if (pat[i] === 'x') TN.push((4 + i) * BEAT);
  let h = '<div class="bar rl"><i class="hz"></i>'; for (let i = 0; i < TN.length; i++) h += '<i class="nt">' + emo + '</i>'; h += '<b class="fb"></b></div>'; c.mg.innerHTML = h;
  const rl = c.mg.querySelector('.rl'), hz = rl.querySelector('.hz'), NT = rl.querySelectorAll('.nt'), fb = rl.querySelector('.fb'), J = new Array(TN.length).fill(0), snd9 = new Array(TN.length).fill(false);   /* J: 0 아직 · 1 얼쑤 · 2 좋다 · 3 놓침 */
  const PW = 0.08 * zw, GW = 0.17 * zw, END = TN[TN.length - 1] + 0.9;
  let W = rl.getBoundingClientRect().width, t = 0, beat = -1, P = 0, G = 0, stray = 0;
  const VERB = c.k === 'paddy' ? (c.sea === 'spring' ? c.T('심기!', 'Plant!') : c.T('베기!', 'Cut!')) : c.k === 'saltpan' ? c.T('밀기!', 'Push!') : c.T('휙!', 'Toss!');
  const judge = (i, j) => { J[i] = j; setCls(NT[i], 'nt ' + (j === 1 ? 'p' : j === 2 ? 'g' : 'm')); fb.textContent = j === 1 ? c.T('얼쑤!', 'Great!') : j === 2 ? c.T('좋다!', 'Good!') : c.T('어이쿠', 'Oops'); pop(fb, 'on'); if (j === 1) P++; else if (j === 2) G++; };
  c.say(c.T('넷을 세면 시작 — 박이 동그라미에 닿을 때 E!', 'Count to four — press E when a beat reaches the circle!'));
  return { go: VERB,
    down() { let bi = -1, bd = 9; for (let i = 0; i < TN.length; i++) { if (J[i]) continue; const d = Math.abs(t - TN[i]); if (d < bd) { bd = d; bi = i; } }
      if (bi < 0 || bd > 0.3) { stray++; c.snd('pop'); return; } const j = bd <= PW ? 1 : bd <= GW ? 2 : 3; judge(bi, j); if (j < 3) c.tone(j === 1 ? 784 : 659, 0, 0.1, 'triangle', 0.13); },
    tick(dt) { t += dt; if (!W) W = rl.getBoundingClientRect().width; const hx = W * 0.14, spd = W * 0.42;
      const b = Math.floor(t / BEAT); if (b !== beat) { beat = b; if (b >= 0 && b < 4) { c.snd('tick'); c.say(c.T(['하나', '둘', '셋', '넷'][b], ['One', 'Two', 'Three', 'Four'][b])); } else if (b === 4) c.say(c.T('박이 동그라미에 닿을 때 ', 'Press when it reaches the circle: ') + VERB); pop(hz, 'pu'); }
      for (let i = 0; i < TN.length; i++) { const d = TN[i] - t; if (!snd9[i] && d <= 0) { snd9[i] = true; c.tone(110, 0, 0.16, 'sine', 0.3, 60); }   /* 박마다 북소리(따라 치기) */
        if (!J[i] && d < -GW) judge(i, 3); NT[i].style.transform = 'translateX(' + (hx + d * spd).toFixed(1) + 'px)'; }
      if (t > END) { const r = (P + 0.7 * G - 0.25 * stray) / TN.length; c.finish(r >= 0.85 ? 3 : r >= 0.6 ? 2 : r >= 0.3 ? 1 : 0); } } };
}

// ⑤ 벌 피해서 살살(꿀 뜨기): 벌이 벌집 앞을 오감 → 가운데(뜨는 자리)가 비었을 때 E를 꾹(살살 뜸) · 벌이 지나갈 때 누르고 있으면 벌이 깜짝 놀라 조금 쏟아짐(무섭지 않게) · 꿀 세 통
function mkBee(c) {
  const zw = c.zw, TL = 22 + (zw - 1) * 8, DZ = 0.11 / zw;   /* 솜씨가 늘면 벌을 비키는 폭이 좁아짐(덜 놀람) */
  c.mg.innerHTML = '<div class="hv"><i class="sc"></i><i class="be">🐝</i><i class="be">🐝</i><i class="be off">🐝</i></div><div class="bar pgb"><i class="pg"></i></div><div class="jars"><i>🍯</i><i>🍯</i><i>🍯</i></div>';
  const hv = c.mg.querySelector('.hv'), sc = hv.querySelector('.sc'), BE = hv.querySelectorAll('.be'), pg = c.mg.querySelector('.pg'), JR = c.mg.querySelectorAll('.jars i');
  const OM = [1.15, 1.5, 1.9], PH = [rnd(0, 6.3), rnd(0, 6.3), rnd(0, 6.3)], STT = [0, 0, 0];
  let W = hv.getBoundingClientRect().width, t = 0, hold = false, prog = 0, cd = 0, dz9 = false, full = 0, msgT = 0;
  const IDLE = c.T('벌이 가운데를 지나갈 땐 멈추고, 비면 E를 꾹 — 살살 떠요', 'Stop when a bee crosses the middle — when it’s clear, hold E to scoop gently');
  c.say(IDLE);
  return { go: c.T('살살 뜨기 (꾹)', 'Scoop (hold)'),
    down() { hold = true; }, up() { hold = false; },
    tick(dt) { t += dt; if (!W) W = hv.getBoundingClientRect().width; if (cd > 0) cd -= dt; if (msgT > 0 && (msgT -= dt) <= 0) c.say(IDLE);
      const nb = full >= 1 ? 3 : 2; let danger = false, near = -1, nd = 9;
      for (let i = 0; i < 3; i++) { const on = i < nb; if (!on) continue; const x = 0.5 + 0.44 * Math.sin(OM[i] * t + PH[i]), d = Math.abs(x - 0.5); if (d < DZ) danger = true; if (d < nd) { nd = d; near = i; }
        BE[i].style.transform = 'translate(' + (x * W).toFixed(1) + 'px,' + (Math.sin(t * 6 + i * 2) * 5).toFixed(1) + 'px)'; if (STT[i] > 0 && (STT[i] -= dt) <= 0) setCls(BE[i], 'be'); }
      if (nb === 3 && BE[2].className === 'be off') setCls(BE[2], 'be');
      if (danger !== dz9) { dz9 = danger; setCls(sc, danger ? 'sc dz' : 'sc'); }
      if (hold) { if (danger) { if (cd <= 0) { cd = 1.2; prog = Math.max(Math.floor(prog), prog - 0.35); if (near >= 0) { STT[near] = 0.7; setCls(BE[near], 'be st'); } c.snd('buzz'); c.say(c.T('벌이 깜짝 놀랐어요! 벌이 지나간 뒤에 살살', 'The bees got startled! Wait till they pass, then go gently')); msgT = 1.8; } }
        else prog = Math.min(3, prog + 0.42 * dt); }
      const f = Math.floor(prog); if (f > full) { for (let i = full; i < f; i++) JR[i].className = 'f'; full = f; c.snd('ding'); c.say(c.T('꿀 ', 'Honey jar ') + full + c.T('통 가득!', ' full!')); msgT = 1.4; }
      pg.style.transform = 'scaleX(' + (prog >= 3 ? 1 : prog - full).toFixed(3) + ')';
      if (prog >= 3) c.finish(3); else if (t > TL) c.finish(full); } };
}

const MK = { bar: mkBar, line: mkLine, ripe: mkRipe, rhythm: mkRhythm, bee: mkBee };
// 놀이 하나 열기: o = { root(.pb — 안에 .mg · .msg · .go가 있어야 함), k(일 갈래), en, zw(솜씨 초록 칸 배수), sea, sfx(k), tone(...), grade(false = 결과 말 없이 바로 끝 — 요리·징검다리), onEnd(점수 0~3) }
export function createMini(kind, o) { css();
  const c = { root: o.root, mg: o.root.querySelector('.mg'), msgEl: o.root.querySelector('.msg'), go: o.root.querySelector('.go'), en: !!o.en, zw: Math.max(1, o.zw || 1), k: o.k, sea: o.sea, done: false };
  c.T = (ko, e2) => (c.en ? e2 : ko); c.say = s => { if (c.msgEl && c.msgEl.textContent !== s) c.msgEl.textContent = s; }; c.snd = k => { if (o.sfx) o.sfx(k); }; c.tone = (...a) => { if (o.tone) o.tone(...a); };
  let endT = -1, score = 0;
  c.finish = ok => { if (c.done) return; c.done = true; score = Math.max(0, Math.min(3, ok | 0)); if (o.grade === false) { endT = 0; return; } c.root.classList.add('mg-end'); c.say(gradeText(score, c.en)); c.snd(score >= 3 ? 'done' : score ? 'ding' : 'buzz'); endT = 0.8; };
  const g = (MK[kind] || mkBar)(c);
  const pd = e => { e.preventDefault(); if (!c.done) g.down(); }, pu = () => { if (g.up) g.up(); };
  if (c.go && g.go) { c.go.textContent = g.go; c.go.addEventListener('pointerdown', pd); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) c.go.addEventListener(ev, pu); }
  return { kind,
    get ok() { return score; }, get done() { return c.done; },
    down() { if (!c.done) g.down(); }, up() { if (!c.done && g.up) g.up(); }, key(code) { return !c.done && g.key ? !!g.key(code) : false; },
    tick(dt) { if (dt > 0.1) dt = 0.1; if (!c.done) { g.tick(dt); return; } if (endT >= 0 && (endT -= dt) <= 0) { endT = -1; o.onEnd(score); } },
    dispose() { c.done = true; endT = -1; if (g.dispose) g.dispose(); if (c.go) { c.go.removeEventListener('pointerdown', pd); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) c.go.removeEventListener(ev, pu); } } };
}
