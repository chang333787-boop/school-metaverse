// 🎮 놀이 판 공용 틀(PLAY-2 판 크게 · 교사 11-07 "미니게임이 왜 왼아래에 고정되어 있지? 이왕이면 크게 보여도 되지 않나" · docs/systems/town_play2.md)
//   판 놀이(.twn-play — 일 놀이·투호·낚시·부엌·강/들 놀이 · 판 창 놀이 GAME_P) = 화면 가운데 큰 판 + 뒤 세상 살짝 어둡게
//   세상 놀이(양몰이·모내기 소리·사방치기) = 위 가운데 큰 놀이 줄(.twn-wcard) · 세상을 봐야 하는 판(누워 뜨기 .twn-play.pz-world) = 위 가운데 카드(어둡게 X)
//   같은 틀: 초록 제목 띠 + ✕(그 놀이의 '그만'과 같음) · 할 일 한 줄 · 글은 보이는 크기 16px 넘게 · 단추 44px 넘게 · Esc = 그만(놀이마다 있던 것 그대로) · 끝 = 결과가 크게(town_minigame.js mg-end)
//   크게 하는 법 = zoom 하나(데스크톱만 · 휴대폰은 1) — 열릴 때·창 크기가 바뀔 때·판이 화면을 넘칠 때만 다시 잼(매 프레임 X)
//     PERF-C(11-08 크롬북 '창 여는 순간 멈칫'): 0.5초 시계(판마다 scrollHeight 읽기 = 강제 레이아웃) X → ResizeObserver 하나(판 바로 아래 칸들 = 안 내용이 자라 넘치는지 · 레이아웃이 끝난 뒤 불림 = 읽어도 강제 레이아웃 X)
//     ✕ 다시 붙이기(놀이가 판을 다시 그리면 ✕가 사라짐)·새 칸 지켜보기 = MutationObserver 하나(판 안 바뀜 · 하는 일 = 찾기 한 번)
//     누르기 좌표는 놀이들이 비율(clientX − 판 왼쪽) / 판 너비 · elementFromPoint로 셈 → zoom이어도 그대로 맞음(10-07 크롬 153 확인: offsetWidth = 그대로 · 사각형 = 커진 크기)
//   body 꼬리표(:has() X): h-pbox = 판이 떠 있음(마을 칩·작은 지도·조이스틱·행동 단추 잠깐 숨김 · 알림을 판 위 띠로) · h-wplay = 세상 놀이 줄(위 가운데 목표 줄·나침반 띠 잠깐 숨김) · h-pwl = 세상 판(누워 뜨기 — 휴대폰은 조이스틱·칩 잠깐 숨김 · 세로는 아래 카드)
//   CSS 셈: 마을·휴대폰 CSS가 #toast·놀이 글에 꼬리표 여럿(+ !important)을 걸어 둬서 이 틀은 :not(#pz0)(없는 id라 늘 맞음 · id 하나만큼 셈)로 이김 · 글 크기 바닥 15px = 판이 1.07배만 커져도 보이는 크기 16px
export const PBOX_V = 1;
const TOP = 56, BOT = 22, WMAX = 0.74, ZCAP = 1.9, ZMIN = 0.8, PCAP = 1.5;   /* 데스크톱: 위 56px = 알림 띠 자리 · 판 너비 ≤ 화면 74% · 판 창(openP) 놀이는 1~1.5배 */
const GAME_P = new Set(['table', 'janggu', 'bake', 'ent3', 'acadq']);   /* ACAD-1 학원 수업 창 */   /* ENTER-3 건물 판단 틀 판(town_enter2.js) */   /* 판 창으로 여는 놀이(openP kind) — 그림 판(canvas)이 든 창은 제 맞춤(fitCv)이 있어 키우지 않음 */
const CSS = `
.twn-play{position:fixed;inset:0;z-index:46;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:${TOP}px 16px ${BOT - 6}px;background:rgba(18,22,34,.36);font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji}
.twn-play .pb{box-sizing:border-box;position:relative;background:#fff8ea;border:4px solid #2b2420;border-radius:18px;padding:0 16px 14px;width:min(460px,92vw);box-shadow:0 7px 0 #2b2420,0 18px 34px rgba(0,0,0,.28);display:flex;flex-direction:column;gap:8px;color:#2b2420;animation:twnIn .2s ease-out both;overflow:auto;overscroll-behavior:contain}
.twn-play b{font-size:20px;font-weight:900}
.twn-play small{font-size:14px;color:#6f6257}
.twn-play .pb>b:first-child{display:block;position:sticky;top:0;z-index:4;flex:none;margin:0 -16px 0;padding:10px 64px 9px 16px;background:#3f8f4e;color:#fff;font-size:20px;line-height:1.3;border-bottom:4px solid #2b2420;border-radius:14px 14px 0 0;text-shadow:0 2px 0 rgba(0,0,0,.22);word-break:keep-all}
.twn-play .pb>b:first-child .twn-x{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:44px;height:44px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;background:#fff8ea;color:#2b2420;border:3px solid #2b2420;border-radius:12px;box-shadow:0 3px 0 #2b2420;font:900 20px/1 system-ui,sans-serif;text-shadow:none;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.twn-play .pb>b:first-child .twn-x::before{content:'✕'}
.twn-play .pb>b:first-child .twn-x:active{transform:translateY(calc(-50% + 2px));box-shadow:0 1px 0 #2b2420}
.twn-play .pb>b:first-child .twn-x:focus-visible{outline:3px solid #f2c230;outline-offset:2px}
.twn-play:not(#pz0) .pb>small{font-size:15.5px;line-height:1.4;color:#5a4d42;font-weight:700}
.twn-play:not(#pz0) .pb>.mglad{font-size:15px}
.twn-play:not(#pz0) .msg{font-size:16px;font-weight:800;line-height:1.4}
.twn-play:not(#pz0) .msg .mgres{display:block;font-size:25px;font-weight:900;color:#2b6a38;line-height:1.25;margin-bottom:2px}
.twn-play .row{display:flex;gap:10px;justify-content:flex-end}
.twn-play button{font:inherit;font-weight:800;border:3px solid #2b2420;border-radius:12px;padding:9px 18px;min-height:48px;background:#3f8f4e;color:#fff;cursor:pointer;box-shadow:0 4px 0 #2b2420;transition:transform .07s,box-shadow .07s;text-shadow:0 1px 0 rgba(0,0,0,.25)}
.twn-play button:active{transform:translateY(3px);box-shadow:0 1px 0 #2b2420}
.twn-play button.sub{background:#f4e6c8;color:#2b2420;text-shadow:none}
.twn-play.pz-board:not(#pz0) :is(.rsit>span,.rt>em,.cbx>.obx,.cbx>.mbx,.fr9>b,.scn>.wxl,.sky>b,.spn>small,.zl>em,.zr>em,.tlab>span,.sp>.gst,.kc-pot>.nm,.kc-pot>.lb,.ht>.on,.ht>button,.rw>.lt,.rw>.pt,.kc-plate>em,.sel>small,button>small){font-size:15px}
.twn-play.pz-board:not(#pz0) .kc button{min-height:36px}
.twn-play.pz-board:not(#pz0) .kc .kc-pot button{min-width:40px}
body.small .twn-play.pz-board:not(#pz0) :is(.kc button,.gc){min-height:44px}
body.small .twn-play.pz-board:not(#pz0) .kc .kc-pot button{min-width:44px}
body.h-pbox:not(#pz0) #toast{z-index:48!important;top:calc(8px + env(safe-area-inset-top))!important;bottom:auto!important}
body.h-pbox:not(#pz0) :is(#tJoyHint,#tJump,#tAct,#tView,#tCrouch,.tbtn,.twn-mini,.twn-task,.twn-memo,.twn-comp,.twn-keys,.twn-tools,.twn-tuse,#hint,.chip:not(#toast):not(#hudBan)){visibility:hidden!important}
body.small .twn-play{padding:calc(50px + env(safe-area-inset-top)) 8px calc(8px + env(safe-area-inset-bottom))}
body.small .twn-play .pb{width:min(460px,calc(100vw - 16px));max-height:100%}
.twn-play .pb>.row:last-child{position:sticky;bottom:-14px;z-index:2;margin:0 -16px -14px;padding:8px 16px 10px;background:#fff8ea}
@media (orientation:landscape){body.small .twn-play{padding-top:calc(48px + env(safe-area-inset-top))}}
.twn-play.pz-world:not(#pz0){inset:auto;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);display:block;padding:0;background:none;z-index:30}
.twn-play.pz-world .pb{width:min(560px,calc(100vw - 24px));animation:none}
.twn-play.pz-world:not(#pz0) .pb>small{font-size:17px}
.twn-play.pz-world:not(#pz0) .msg{font-size:18px}
.twn-play.pz-world:not(#pz0) button{font-size:17px}
body.small .twn-play.pz-world:not(#pz0) .pb{gap:4px;padding:0 12px 8px;border-width:3px;border-radius:14px;max-width:calc(100vw - 24px)}
body.small .twn-play.pz-world:not(#pz0) .pb>b:first-child{margin:0 -12px;padding:6px 12px 5px;font-size:17px;border-radius:11px 11px 0 0;border-bottom-width:3px}
body.small .twn-play.pz-world:not(#pz0) .pb>small{font-size:14px}
body.small .twn-play.pz-world:not(#pz0) .msg{font-size:15px}
body.small .twn-play.pz-world:not(#pz0) .bar{height:22px}
body.small .twn-play.pz-world:not(#pz0) button{min-height:44px;padding:4px 14px}
body.small .twn-play.pz-world:not(#pz0) .pb>.row:last-child{position:static;margin:0;padding:0;background:none}
@media (orientation:landscape){body.small .twn-play.pz-world:not(#pz0) .pb{width:calc(100vw - 420px);min-width:300px}}
@media (orientation:portrait){body.small .twn-play.pz-world:not(#pz0){top:auto;bottom:calc(12px + env(safe-area-inset-bottom))}}
body.small.h-pwl:not(#pz0) :is(#tJoyHint,#tJump,#tAct,#tView,#tCrouch,.tbtn,.twn-mini,.twn-task,.twn-memo,.chip:not(#toast):not(#hudBan)){visibility:hidden!important}
.twn-wcard{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:22;box-sizing:border-box;max-width:min(880px,calc(100vw - 32px));background:#fff8ea;color:#2b2420;border:3px solid #2b2420;border-top:7px solid #3f8f4e;border-radius:14px;box-shadow:0 4px 0 #2b2420;padding:8px 24px 9px;font:900 23px/1.3 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;text-align:center;pointer-events:none;word-break:keep-all;display:none}
.twn-wcard.on{display:block}.twn-wcard .wq{pointer-events:auto;margin-left:14px;vertical-align:middle;min-height:40px;padding:4px 14px;border:2px solid #2b2420;border-bottom-width:4px;border-radius:10px;background:#fff;color:#2b2420;font:800 16px system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;cursor:pointer}.twn-wcard .wq:active{border-bottom-width:2px;transform:translateY(2px)}
body.h-wplay:not(#pz0) :is(#hudGoal,.twn-comp){visibility:hidden!important}
body.h-wplay:not(.small):not(#pz0) #toast{top:calc(var(--wcB,76px) + 8px)!important;bottom:auto!important}
body.small .twn-wcard{top:calc(6px + env(safe-area-inset-top));font-size:clamp(15px,4.4vh,18px);padding:4px 14px 5px;border-top-width:5px;max-width:calc(100vw - 340px)}
@media (orientation:portrait){body.small .twn-wcard{font-size:17px;max-width:calc(100vw - 140px)}}
.twn-p:is(.pz-game,[data-k=table],[data-k=janggu],[data-k=bake]):not(#pz0) .twn-x{width:44px;height:44px}
.twn-p.pz-game:not(#pz0) h3.pz-band{position:sticky;top:-14px;z-index:4;margin:-14px -18px 12px;padding:11px 64px 10px 18px;background:#3f8f4e;color:#fff;font-size:20px;border-bottom:4px solid #2b2420;border-radius:14px 14px 0 0;text-shadow:0 2px 0 rgba(0,0,0,.22)}
.twn-p:is([data-k=table],[data-k=janggu],[data-k=bake]):not(#pz0) :is(.sm,.tb-msg,.tb-todo){font-size:16px}
.twn-p:is([data-k=table],[data-k=janggu],[data-k=bake]):not(#pz0) .row button{font-size:16.5px}
.twn-p:is([data-k=table],[data-k=janggu],[data-k=bake]):not(#pz0) button{min-height:44px}
`;

// o = { en() 영어인가 }
export function createPbox(o = {}) {
  let css = null, mo = null, card = null, cardT = '', cardQT = '', cardQ = null, ro = null, mi = null;
  const B = new Set(), P = new Set(), WL = new Set();   /* 판(.twn-play.pz-board) · 키운 판 창(.twn-p.pz-game) · 세상 판(.pz-world) */
  const OWN = new WeakMap(), OBS = new Map(), FIT = new WeakSet(), LATE = new Set();   /* 지켜보는 칸 → 판 · 판 → 지켜보는 칸들 · 처음 맞춤을 한 판 · 끄는 동안 미룬 판 */
  const body = () => document.body, small = () => body().classList.contains('small');
  const en = () => !!(o.en && o.en());
  function addCss() { if (css) return; css = document.createElement('style'); css.id = 'twn-pbox-css'; css.textContent = CSS; document.head.appendChild(css); }
  // ✕ = 그 놀이의 '그만' 단추를 누른 것과 같음(놀이마다 그만 길이 다름 — 누르기(pointerdown)로 받는 놀이도 있어 둘 다 보냄)
  function stopBtn(el) { return el.querySelector('.row .x, .row [data-a="x"], [data-a="x"], button.x'); }
  function addX(el) { const t = el.querySelector('.pb>b:first-child'); if (!t || t.querySelector('.twn-x') || !stopBtn(el)) return; const x = document.createElement('span'); x.className = 'twn-x'; x.setAttribute('role', 'button'); x.tabIndex = 0; x.setAttribute('aria-label', en() ? 'Close' : '닫기');
    const shut = e => { e.preventDefault(); e.stopPropagation(); const s = stopBtn(el); if (!s || !el.isConnected) return; s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); if (el.isConnected) s.click(); };
    x.addEventListener('pointerdown', e => e.stopPropagation()); x.addEventListener('click', shut); x.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') shut(e); }); t.appendChild(x); }
  // 판 맞추기: 데스크톱 = 판(그대로 크기 offsetWidth·Height)을 화면에 맞춰 zoom · 넘치면 판 안에서 굴림 · 휴대폰 = zoom 없음(설정 글씨 크기만)
  function fitB(el, shrink) { const pb = el.querySelector('.pb'); if (!pb) return; if (small() || el.classList.contains('pz-world')) { if (pb.style.zoom) { pb.style.zoom = ''; pb.style.maxHeight = ''; } return; }
    const z0 = parseFloat(pb.style.zoom) || 0, w = pb.offsetWidth, h = Math.max(pb.offsetHeight, pb.scrollHeight); if (!w || !h) return;
    const vw = innerWidth, vh = innerHeight, ah = vh - TOP - BOT, aw = Math.min(vw - 40, vw * WMAX); let z = Math.max(ZMIN, Math.min(ZCAP, aw / w, ah / h)); z = Math.floor(z * 100) / 100;
    if (shrink && z0 && z >= z0 - 0.01) return; if (Math.abs(z - z0) > 0.004) pb.style.zoom = String(z); pb.style.maxHeight = Math.floor(ah / z) + 'px'; }
  // 판 창(openP) 놀이: 데스크톱에서 남는 자리가 있으면 1~1.5배(줄이지는 않음 — 원래 판 창 규칙 그대로)
  // 판 창 놀이인데 제목 띠·✕가 없는 창(장구처럼 h3를 칸으로 감싼 창) = 같은 초록 띠 + ✕(그 창의 닫기 단추와 같음)
  function bandP(el) { if (el.querySelector('.twn-x')) return; const h = el.querySelector('.bx h3'), s = el.querySelector('[data-a="x"]'); if (!h || !s) return; h.classList.add('pz-band'); const x = document.createElement('span'); x.className = 'twn-x'; x.setAttribute('role', 'button'); x.tabIndex = 0; x.setAttribute('aria-label', en() ? 'Close' : '닫기');
    const shut = e => { e.preventDefault(); e.stopPropagation(); const b9 = el.querySelector('[data-a="x"]'); if (b9) b9.click(); }; x.addEventListener('click', shut); x.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') shut(e); }); h.appendChild(x); }
  function isGameP(el) { const k = el.dataset ? el.dataset.k : ''; if (el.querySelector('canvas')) return false; return GAME_P.has(k) || !!el.querySelector('.twn-addb,.jg-w'); }
  function fitP(el, shrink) { const bx = el.querySelector('.bx'); if (!bx) return; if (small()) { if (bx.style.zoom) { bx.style.zoom = ''; bx.style.removeProperty('max-width'); bx.style.removeProperty('max-height'); } return; }
    const z0 = parseFloat(bx.style.zoom) || 0, w = bx.offsetWidth, h = bx.scrollHeight + 8; if (!w || !h) return;
    const vw = innerWidth, vh = innerHeight; let z = Math.max(1, Math.min(PCAP, (vw * WMAX) / w, (vh * 0.9) / h)); z = Math.floor(z * 100) / 100;
    if (shrink && z0 && z >= z0 - 0.01) return; if (Math.abs(z - z0) > 0.004) bx.style.zoom = String(z); bx.style.setProperty('max-width', Math.floor(vw * 0.94 / z) + 'px', 'important'); bx.style.setProperty('max-height', Math.floor(vh * 0.9 / z) + 'px', 'important'); }
  const over = el => { const r = el.getBoundingClientRect(); return r.top < 2 || r.bottom > innerHeight - 2; };
  function tags() { const b = body(); const nb = [...B].some(e => e.isConnected); b.classList.toggle('h-pbox', nb); const nw = [...WL].some(e => e.isConnected); b.classList.toggle('h-wplay', !!cardT || nw); b.classList.toggle('h-pwl', nw); }
  // 지켜보기(PERF-C): 판 = .pb 바로 아래 칸들 · 판 창 = .bx 바로 아래 칸들(내용이 자라면 칸 크기가 바뀜 → 넘치는지 봄)
  //   .pb·.bx 자신은 안 지켜봄 — 콜백 안에서 그 zoom·최대 높이를 바꾸므로(자신을 보면 'ResizeObserver loop' 오류) · 안 칸 크기는 zoom·최대 높이와 상관없음 · 창 크기 = resize(onRz)
  const boxOf = el => el.querySelector(B.has(el) || WL.has(el) ? '.pb' : '.bx');
  function track(el) { if (!ro) return; const bx = boxOf(el); let L = OBS.get(el); if (!L) OBS.set(el, L = new Set());
    for (const t of L) if (!t.isConnected || t.parentElement !== bx) { ro.unobserve(t); L.delete(t); }
    if (!bx) return; for (const c of bx.children) if (!L.has(c)) { L.add(c); OWN.set(c, el); ro.observe(c); } }
  function untrack(el) { const L = OBS.get(el); if (L && ro) for (const t of L) ro.unobserve(t); OBS.delete(el); LATE.delete(el); if (mi && !OBS.size) mi.disconnect(); }   /* MutationObserver는 끊기만 하고(판이 하나도 없을 때) 다음 판에서 다시 */
  function drop(el) { B.delete(el); P.delete(el); WL.delete(el); untrack(el); }
  /* 맞추기 판정 = 예전 0.5초 시계와 같은 조건(화면을 넘치거나 판 안 내용이 넘치면 줄여 맞춤 — 끝 화면·끄는 중은 그대로) · 처음 = 예전처럼 맞추고 다음 프레임 한 번 더(놀이가 첫 tick에 판을 채운 뒤 · 키우기까지) */
  function check(el) { if (!el.isConnected) { drop(el); tags(); return; }
    if (WL.has(el)) { wplace(el); return; }
    if (B.has(el)) { const pb = el.querySelector('.pb'); if (!pb) return; if (!FIT.has(el)) { FIT.add(el); fitB(el, false); requestAnimationFrame(() => { if (el.isConnected) fitB(el, false); }); return; } if (el.dataset.pzDn) { LATE.add(el); return; } if (over(pb) || (!pb.classList.contains('mg-end') && pb.scrollHeight > pb.clientHeight + 4)) fitB(el, true); return; }
    if (P.has(el)) { const bx = el.querySelector('.bx'); if (!bx) return; if (!FIT.has(el)) { FIT.add(el); fitP(el, false); requestAnimationFrame(() => { if (el.isConnected) fitP(el, false); }); return; } if (over(bx)) fitP(el, true); } }
  const onRO = E => { const S9 = new Set(); for (const e of E) { const el = OWN.get(e.target); if (el) S9.add(el); } for (const el of S9) check(el); };
  /* 판 안이 바뀜(놀이가 판을 다시 그림): ✕ 다시 · 새 칸 지켜보기 — 글자만 바뀐 것은 찾기 한 번으로 끝 */
  const onMI = L => { const S9 = new Set(); for (const m of L) { for (let n = m.target; n; n = n.parentElement) { if (OBS.has(n)) { S9.add(n); break; } } } for (const el of S9) { if (!el.isConnected) { drop(el); continue; } if (!P.has(el)) addX(el); track(el); } };   /* 판 창 띠(bandP)는 예전처럼 열 때 한 번만 */
  function watchEl(el) { if (!ro) ro = new ResizeObserver(onRO); if (!mi) mi = new MutationObserver(onMI); track(el); mi.observe(el, { childList: true, subtree: true }); }
  function onBoard(el) { if (el.classList.contains('pz-world')) { WL.add(el); addX(el); watchEl(el); tags(); return; }
    el.classList.add('pz-board'); B.add(el); addX(el); watchEl(el); tags();   /* 처음 맞춤 = 첫 레이아웃 뒤 ResizeObserver 첫 부름(그리기 전 · 놀이 틀이 같은 차례에 판을 채운 뒤) */
    el.addEventListener('pointerdown', () => { el.dataset.pzDn = '1'; }, true);   /* 끄는 동안엔 크기를 안 바꿈(잡은 것이 손가락 밑에서 미끄러지지 않게 · 뗌은 창 전체에서 clrDn) */
    el.addEventListener('click', e => { if (e.target === el) e.stopPropagation(); }); }   /* 판 바깥(어두운 곳) 누르기 = 아무 일 없음(판 놀이는 실수로 그만두지 않게 — 닫기는 ✕·Esc·그만) */
  function onPanel(el) { if (!isGameP(el)) return; el.classList.add('pz-game'); P.add(el); bandP(el); watchEl(el); }
  function onRz() { for (const el of B) if (el.isConnected) fitB(el, false); for (const el of P) if (el.isConnected) fitP(el, false); for (const el of WL) if (el.isConnected) wplace(el); if (cardT) cardB(); }
  // 세상 판(누워 뜨기): 위 가운데 · 알림은 그 밑으로
  function wplace(el) { const pb = el.querySelector('.pb'); if (!pb) return; const r = pb.getBoundingClientRect(); body().style.setProperty('--wcB', Math.round(r.bottom) + 'px'); }
  function cardB() { if (!card) return; const r = card.getBoundingClientRect(); if (r.height) body().style.setProperty('--wcB', Math.round(r.bottom) + 'px'); }
  // 세상 놀이 줄: 위 가운데 큰 한 줄(t = 글 · null = 끔) — 양몰이·모내기 소리·사방치기가 쓰던 왼쪽 할 일 칩 대신
  function wcard(t, q) { t = t ? String(t) : ''; const qt = q && q.t ? String(q.t) : ''; cardQ = q && q.f ? q.f : null; if (t === cardT && qt === cardQT) return; cardT = t; cardQT = qt; if (t && !card) { addCss(); card = document.createElement('div'); card.className = 'twn-wcard'; card.setAttribute('role', 'status'); card.innerHTML = '<span class="wt"></span><button type="button" class="wq"></button>'; card.querySelector('.wq').addEventListener('click', e => { e.stopPropagation(); if (cardQ) cardQ(); }); card.addEventListener('pointerdown', e => { if (e.target.closest('.wq')) e.stopPropagation(); }); document.body.appendChild(card); }
    if (card) { const w9 = card.querySelector('.wt'), b9 = card.querySelector('.wq'); if (w9.textContent !== t) w9.textContent = t; b9.textContent = qt; b9.style.display = qt ? '' : 'none'; card.classList.toggle('on', !!t); } tags(); if (t) cardB(); }   /* DEB-3(토론 판정 7): q = { t: 글, f: 할 일 } — 양몰이 '그만하기' 단추(일꾼 E 대신) */   /* 빈 놀이 줄은 안 보임(세상 판만 떠 있을 때 빈 칸이 남던 것) */
  const clrDn = () => { for (const el of B) delete el.dataset.pzDn; if (LATE.size) { const L9 = [...LATE]; LATE.clear(); requestAnimationFrame(() => { for (const el of L9) if (B.has(el)) check(el); }); } };   /* 끄는 동안 미룬 맞춤 = 뗀 뒤 한 번 */
  function watch() { addCss(); if (mo) return; mo = new MutationObserver(L => { for (const m of L) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; if (n.classList.contains('twn-play')) onBoard(n); else if (n.classList.contains('twn-p')) onPanel(n); } let rm = false; for (const m of L) for (const n of m.removedNodes) { if (OBS.has(n) && !n.isConnected) drop(n); rm = true; } if (rm) tags(); });
    mo.observe(document.body, { childList: true }); addEventListener('resize', onRz); addEventListener('pointerup', clrDn, true); addEventListener('pointercancel', clrDn, true); for (const n of document.querySelectorAll('body>.twn-play')) onBoard(n); }
  function dispose() { if (mo) { mo.disconnect(); mo = null; } removeEventListener('resize', onRz); removeEventListener('pointerup', clrDn, true); removeEventListener('pointercancel', clrDn, true); if (ro) { ro.disconnect(); ro = null; } if (mi) { mi.disconnect(); mi = null; } OBS.clear(); LATE.clear(); if (card) { card.remove(); card = null; } cardT = ''; cardQT = ''; cardQ = null; B.clear(); P.clear(); WL.clear(); const b = body(); if (b) { b.classList.remove('h-pbox', 'h-wplay', 'h-pwl'); b.style.removeProperty('--wcB'); } if (css) { css.remove(); css = null; } }
  return { watch, wcard, dispose, busy: () => { for (const el of B) if (el.isConnected) return true; return false; }, info: () => ({ boards: [...B].filter(e => e.isConnected).map(e => { const pb = e.querySelector('.pb'); return { z: pb ? parseFloat(pb.style.zoom) || 1 : 0 }; }), panels: [...P].filter(e => e.isConnected).map(e => { const bx = e.querySelector('.bx'); return { k: e.dataset.k, z: bx ? parseFloat(bx.style.zoom) || 1 : 0 }; }), card: cardT, world: [...WL].filter(e => e.isConnected).length }) };
}
