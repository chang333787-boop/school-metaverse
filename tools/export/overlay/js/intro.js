// 처음 영상(인트로) — 마을이 다 지어지고 첫 화면이 뜨기 직전에 한 번
//   장면 셋: ① 마을 이름(높이서 마을을 천천히 훑음) ② 첫 아침(우리 집 현관으로 내려옴) ③ 무엇을 하나요(동네 길을 따라 날아감)
//   언제든 건너뛰기(Space·Enter·Esc·클릭·터치) · 처음 한 번 다 보면 다음부터는 짧게(마을 이름만) · ?intro=0 = 안 봄 · ?intro=1 = 처음부터 다시
//   새 3D 물체·빛을 만들지 않음 — 카메라 자리만 바꿈(SD2.camOvr) · 화면 위 글은 종이 카드 하나
const NAME = '@APP@';
const KEY = 'uri.intro.v1';
const Q = new URLSearchParams(location.search);
const FORCE = Q.get('intro') === '1', OFF = Q.get('intro') === '0';
const store = { get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }, set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* 막힌 저장소 */ } } };
const REDUCE = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

const CSS = `
body.iv-on > *:not(#scene):not(#iv){visibility:hidden!important}
#iv{position:fixed;inset:0;z-index:9500;cursor:pointer;-webkit-user-select:none;user-select:none;color:#2b2420;
  font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;word-break:keep-all;overflow-wrap:anywhere}
#iv .pap{position:absolute;inset:0;background:#f6efe2;opacity:1;transition:opacity .7s ease;display:flex;align-items:center;justify-content:center;pointer-events:none}
#iv .pap.clear{opacity:0}
#iv .ttl{text-align:center;transition:opacity .5s ease}
#iv .ttl b{display:block;font-size:clamp(40px,9vw,84px);font-weight:900;letter-spacing:.02em;line-height:1.1}
#iv .ttl span{display:block;margin-top:14px;font-size:clamp(16px,3.6vw,22px);font-weight:700;color:#5b4d42}
#iv .ttl i{display:block;width:min(260px,50vw);height:6px;margin:18px auto 0;background:#3f8f4e;border-radius:3px}
#iv .cap{position:absolute;left:max(16px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));width:min(560px,calc(100vw - 32px));
  background:#fff8ea;border:3px solid #2b2420;border-radius:14px;box-shadow:0 4px 0 #2b2420;padding:14px 18px 14px;opacity:0;transition:opacity .45s ease;pointer-events:none;box-sizing:border-box}
#iv .cap.in{opacity:1}
#iv .cap .k{display:inline-block;background:#3f8f4e;color:#fff;font-weight:900;font-size:14px;padding:3px 10px;border-radius:8px;margin-bottom:8px}
#iv .cap .t{font-size:clamp(20px,4.6vw,26px);font-weight:900;line-height:1.3}
#iv .cap .l{font-size:clamp(15px,3.8vw,19px);font-weight:650;line-height:1.5;margin-top:6px;opacity:0;transition:opacity .45s ease}
#iv .cap .l.in{opacity:1}
#iv .cap .dots{position:absolute;right:14px;top:14px;display:flex;gap:5px}
#iv .cap .dots u{width:9px;height:9px;border-radius:2px;border:2px solid #2b2420;background:#fff8ea}
#iv .cap .dots u.on{background:#2b2420}
#iv .skip{position:absolute;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));font:800 15px/1 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;
  color:#2b2420;background:#fff8ea;border:3px solid #2b2420;border-radius:11px;box-shadow:0 3px 0 #2b2420;padding:9px 13px;min-height:44px;cursor:pointer;display:flex;align-items:center;gap:8px}
#iv .skip:active{transform:translateY(2px);box-shadow:0 1px 0 #2b2420}
#iv .skip kbd{font:800 12px/1 system-ui,sans-serif;background:#2b2420;color:#fff8ea;border-radius:6px;padding:4px 6px}
body.touch #iv .skip kbd{display:none}
.twn-ld .bx button.iv-again{display:block!important;width:auto!important;min-height:0!important;margin:8px 2px 0!important;padding:4px 0!important;background:none!important;border:0!important;box-shadow:none!important;color:#5b4d42!important;font:700 13px/1.2 system-ui,sans-serif!important;text-decoration:underline;cursor:pointer;transform:none!important}
@media (prefers-reduced-motion:reduce){#iv .pap,#iv .cap,#iv .cap .l{transition:none}}
`;

// 장면: 카메라 시작·끝(자리 p · 보는 곳 l)과 글. 자리는 기준점(A)에서 잼 — 앞(f) = 집에서 길 쪽 · 옆(r)
const SCENES = [
  { id: 'name', dur: 10.5, cap: { k: NAME, t: '어린이들이 종이 판 위에 지은 마을이에요', l: ['산과 들, 강과 바다가 이어져 있어요.'] },
    cam: A => ({ p0: A.at(A.gate, -72, 58, -36), l0: A.at(A.gate, 8, 0, 112), p1: A.at(A.gate, 34, 52, -42), l1: A.at(A.gate, -26, 0, 112) }) },
  { id: 'home', dur: 11, cap: { k: '첫 아침', t: '아침 7시, 우리 집 현관 앞에서 첫날이 시작돼요', l: ['현관 칠판에 이웃이 남긴 쪽지가 붙어 있어요.'] },
    cam: A => ({ p0: A.loc(A.home, 46, -30, 34), l0: A.loc(A.home, -2, 0, 2), p1: A.loc(A.home, 9.5, -6.5, 4.2), l1: A.loc(A.home, -3, 0.6, 1.8) }) },
  { id: 'play', dur: 13, cap: { k: '무엇을 할까요?', t: '마을에 사는 어린이가 되어 보아요', l: ['🚲 걷고 자전거를 타며 마을을 둘러봐요.', '📋 이웃의 부탁을 듣고 함께 풀어요.', '🎉 첫 마을 잔치를 함께 준비해요.'] },
    cam: A => ({ p0: A.along(0.0, 7, 0, 11), l0: A.along(0.45, 0, 0, 2), p1: A.along(0.78, -14, 10, 15), l1: A.along(1.08, 0, 0, 3) }) },
];
const SHORT = [{ id: 'name', dur: 5, cap: { k: NAME, t: '어린이들이 종이 판 위에 지은 마을이에요', l: [] }, cam: SCENES[0].cam }];

let css = null;
const addCss = () => { if (css) return; css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css); };
const el = (tag, cls, html, p) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; if (p) p.appendChild(d); return d; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ease = x => x * x * (3 - 2 * x);

// 기준점: 학교 정문 · 우리 집(앞 방향) · 첫 이야기 목적지(작은 도서관 — 없으면 집 앞 길 쪽)
function anchors() {
  const T = window.SM_TOWN, gnd = (x, z) => { try { const y = T.ground(x, z); return Number.isFinite(y) ? y : 0; } catch (e) { return 0; } };
  let home = null, f = [0, -1];
  try { const H = T.home(); const e = H && (Array.isArray(H.e) ? H.e : null); if (e) home = [e[0], e[1]]; if (H && H.fw) f = [H.fw[0], H.fw[1]]; } catch (e) { /* */ }
  if (!home) { try { const h = T.homeSpot(); home = Array.isArray(h) ? h : [h.x, h.z]; } catch (e) { home = [15.4, 70]; } }
  const fl = Math.hypot(f[0], f[1]) || 1; f = [f[0] / fl, f[1] / fl];
  const r = [-f[1], f[0]], gate = [15.4, 50];
  let dest = null;
  try { const P = T.places(); const lib = P.find(q => q.name === '작은 도서관') || P.filter(q => q.kind === 'public').sort((a, b) => Math.hypot(a.x - home[0], a.z - home[1]) - Math.hypot(b.x - home[0], b.z - home[1]))[0]; if (lib) dest = [lib.x, lib.z]; } catch (e) { /* */ }
  if (!dest || Math.hypot(dest[0] - home[0], dest[1] - home[1]) < 30) dest = [home[0] + f[0] * 90, home[1] + f[1] * 90];
  const gy = { gate: gnd(gate[0], gate[1]), home: gnd(home[0], home[1]), dest: gnd(dest[0], dest[1]) };
  const d = [dest[0] - home[0], dest[1] - home[1]], dl = Math.hypot(d[0], d[1]) || 1, dn = [d[0] / dl, d[1] / dl], dr = [-dn[1], dn[0]];
  return {
    gate, home, dest, gnd,
    at: (a, dx, dy, dz) => [a[0] + dx, (a === gate ? gy.gate : gy.home) + dy, a[1] + dz],
    loc: (a, fwd, side, dy) => [a[0] + f[0] * fwd + r[0] * side, gy.home + dy, a[1] + f[1] * fwd + r[1] * side],   // fwd = 길 쪽 m · side = 옆 m
    along: (t, side, dfwd, dy) => { const x = home[0] + d[0] * t + dr[0] * side + f[0] * dfwd * (1 - t), z = home[1] + d[1] * t + dr[1] * side + f[1] * dfwd * (1 - t); return [x, gy.home + (gy.dest - gy.home) * Math.min(1, Math.max(0, t)) + dy, z]; },
  };
}

let RUN = null, swallowUp = null;
// 키는 엔진·마을보다 먼저 받음(이 모듈이 먼저 읽힘) — 영상 동안 게임 키 X · 건너뛴 키의 keyup도 삼킴(뒤에 뜬 첫 화면 단추가 눌리지 않게)
addEventListener('keydown', e => {
  if (!RUN) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.repeat) return;
  if (/^(Space|Enter|NumpadEnter|Escape)$/.test(e.code)) { swallowUp = e.code; finish('skip'); }
}, true);
addEventListener('keyup', e => {
  if (RUN || (swallowUp && e.code === swallowUp)) { e.preventDefault(); e.stopImmediatePropagation(); if (!RUN) swallowUp = null; }
}, true);

function play(list, why) {
  if (RUN || !window.SD2 || !SD2.camOvr || !SD2.camera) return false;
  addCss();
  const A = anchors(), C = SD2.camera, root = el('div', null, null, document.body); root.id = 'iv';
  const pap = el('div', 'pap', '<div class="ttl"><b>' + esc(NAME) + '</b><span>어린이들이 지은 마을로 가요</span><i></i></div>', root);
  const cap = el('div', 'cap', null, root);
  const skip = el('button', 'skip', '건너뛰기 ▶▶ <kbd>Space</kbd>', root); skip.type = 'button';
  const shots = list.map(s => ({ ...s, c: s.cam(A) }));
  const T0 = performance.now(), lead = list.length > 1 ? 2.2 : 1.4, total = lead + shots.reduce((a, s) => a + s.dur, 0);
  try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) { /* */ }
  try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) { /* */ }
  document.body.classList.add('iv-on');
  RUN = { root, pap, cap, why, i: -1, shown: 0, done: false, total, T0, lead, shots };
  const P = [0, 0, 0], L = [0, 0, 0];
  const lerp3 = (o, a, b, t) => { o[0] = a[0] + (b[0] - a[0]) * t; o[1] = a[1] + (b[1] - a[1]) * t; o[2] = a[2] + (b[2] - a[2]) * t; };
  const capFor = (i) => { const s = shots[i], c = s.cap;
    cap.innerHTML = '<div class="dots">' + (shots.length > 1 ? shots.map((_, j) => '<u class="' + (j === i ? 'on' : '') + '"></u>').join('') : '') + '</div><span class="k">' + esc(c.k) + '</span><div class="t">' + esc(c.t) + '</div>' + c.l.map(x => '<div class="l">' + esc(x) + '</div>').join('');
    cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); RUN.shown = 0; };
  SD2.camOvr(() => {
    const R = RUN; if (!R || R.done) return;
    const now = (performance.now() - R.T0) / 1000;
    if (now >= R.total) { finish('end'); return; }
    if (now > R.lead - 0.7 && !R.pap.classList.contains('clear') && R.i <= 0) R.pap.classList.add('clear');
    let t = Math.max(0, now - R.lead), i = 0; while (i < shots.length - 1 && t >= shots[i].dur) { t -= shots[i].dur; i++; }
    const s = shots[i], u = REDUCE ? 1 : Math.min(1, t / s.dur), e = ease(u);
    if (i !== R.i) { if (R.i >= 0) dip(); R.i = i; if (now >= R.lead - 0.3) capFor(i); else setTimeout(() => { if (RUN === R && R.i === i) capFor(i); }, (R.lead - 0.3 - now) * 1000); }
    const lines = cap.querySelectorAll('.l'), want = Math.min(lines.length, Math.floor((t - 0.9) / 1.3) + 1);
    for (let k = R.shown; k < want; k++) if (lines[k]) lines[k].classList.add('in');
    if (want > R.shown) R.shown = want;
    if (now > R.total - 0.8 && !R.out) { R.out = 1; R.pap.querySelector('.ttl').style.opacity = '0'; R.pap.classList.remove('clear'); cap.classList.remove('in'); }
    lerp3(P, s.c.p0, s.c.p1, e); lerp3(L, s.c.l0, s.c.l1, e);
    try { const g = A.gnd(P[0], P[2]) + 4; if (P[1] < g) P[1] = g; } catch (err) { /* */ }
    C.position.set(P[0], P[1], P[2]); C.lookAt(L[0], L[1], L[2]);
  });
  root.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); finish('skip'); });
  return true;
}
// 장면 사이: 종이색으로 잠깐(카메라가 휙 바뀌는 것을 가림)
function dip() { const R = RUN; if (!R) return; const p = R.pap; p.querySelector('.ttl').style.opacity = '0'; p.style.transition = 'none'; p.classList.remove('clear'); void p.offsetWidth; p.style.transition = 'opacity .55s ease'; requestAnimationFrame(() => p.classList.add('clear')); }

function finish(k) {
  const R = RUN; if (!R || R.done) return; R.done = true;
  store.set('1');
  R.pap.querySelector('.ttl').style.opacity = '0'; R.pap.style.transition = 'opacity .35s ease'; R.pap.classList.remove('clear'); R.cap.classList.remove('in');
  setTimeout(() => {
    try { SD2.camOvr(null); } catch (e) { /* */ }
    document.body.classList.remove('iv-on');
    R.pap.style.transition = 'opacity .5s ease'; requestAnimationFrame(() => R.pap.classList.add('clear'));
    setTimeout(() => { R.root.remove(); if (RUN === R) RUN = null; again(); }, 520);
  }, 360);
  window.SM_INTRO = { done: k, at: Date.now() };
}

// 첫 화면에 '처음 영상 다시 보기' 한 줄
function again() {
  const T = window.SM_TOWN; if (!T || !T.title || !T.title()) return;
  const bx = document.querySelector('.twn-ld.ttl9 .bx'); if (!bx || bx.querySelector('.iv-again')) return;
  const b = el('button', 'iv-again', '▶ 처음 영상 다시 보기', bx); b.type = 'button';
  b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); play(SCENES, 'again'); });
}

// 마을이 다 지어지고 첫 화면이 뜨면 시작
(function wait() {
  if (OFF) return;
  if (window.SM_NORENDER && !FORCE) return;
  const seen = store.get() === '1', list = FORCE || !seen ? SCENES : SHORT, t0 = performance.now();
  let gone = 0;
  const tick = () => {
    const T = window.SM_TOWN;
    if (T && T.title) {
      if (T.title()) {
        // 우리 집은 다 지은 뒤 몇 프레임 지나 정해짐 — 집 자리가 잡힐 때까지(4초까지) 기다림
        let hm = null; try { const H = T.home(); hm = H && Array.isArray(H.e) ? H.e : null; } catch (e) { hm = null; }
        if (!hm && (tick.w = (tick.w || 0) + 1) < 16) { setTimeout(tick, 250); return; }
        if (!play(list, FORCE ? 'force' : seen ? 'short' : 'first')) setTimeout(tick, 300); return; }
      if (++gone > 12) return;   // 첫 화면 없이 바로 시작하는 판(칸을 골라 다시 지음 등) = 영상 X
    }
    if (performance.now() - t0 < 300000) setTimeout(tick, 250);
  };
  tick();
})();

window.SM_INTRO_API = { play: () => play(SCENES, 'api'), playShort: () => play(SHORT, 'api'), stop: () => finish('stop'), get on() { return !!RUN; }, scenes: SCENES.map(s => ({ id: s.id, dur: s.dur })) };
