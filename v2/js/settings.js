// ⚙ 설정·접근성(SET-1 · 10-17 함께·표현 팀 #18): 글씨 크기 3단계 · 색 구분 돕기(색약) · 모든 소리 끄기 · 흔들림 줄이기 · 읽어 주기
//   상태 = SET(살아 있는 객체 — 읽기만) · 바꾸기 = setSet({…}) → 이 기기 localStorage 'sm-set' + body 꼬리표(fs-1·fs-2·cb-on·calm-on) + 'sm-set' 알림
//   홍보판(SM_PROMO) = 늘 기본값(저장을 읽지도 쓰지도 않음 · 창·단추 없음) · 흔들림 줄이기 기본 = 기기 설정(prefers-reduced-motion)
//   매 프레임 일 0 — 모양은 body 꼬리표 + CSS, 소리는 부르는 쪽이 SET.mute를 봄(main.js tone · 마을 자연 소리), 색은 그릴 때 SET.cb를 봄(마을 지도)
const promo = () => !!(typeof window !== 'undefined' && window.SM_PROMO);
const RM = (() => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } })();
const DEF = { fs: 0, cb: false, mute: false, calm: RM, read: false, comp: true, chal: false, gm: 0 };   // chal = 🏅 도전 모드(CHAL-1 · 마을만 · 빨간 선·거리 줄 X) · comp = 🧭 나침반 띠(NAV-1 · 마을 화면 위)
const KEY = 'sm-set';
const clean = (o) => ({ fs: [0, 1, 2].includes(o && o.fs) ? o.fs : 0, cb: !!(o && o.cb), mute: !!(o && o.mute), calm: o && typeof o.calm === 'boolean' ? o.calm : RM, read: !!(o && o.read), comp: !(o && o.comp === false), chal: !!(o && o.chal), gm: o && o.gmv === 2 && [0, 1, 2].includes(o.gm) ? o.gm : 0, gmv: 2 });   /* MODE-2(사용자 10-27 '가변 프레임이 아니라 60·30으로 하니 컴퓨터에서도 그래픽이 별로') gm = 0 자동(기본 · 기기에 맞춤 = MODE-1 전 그대로 · 해상도만 필요할 때) · 1 그래픽 우선 30fps · 2 부드럽게 60fps · gmv 2 전 저장(창을 그냥 닫아 2가 된 것 포함)은 자동으로 되돌림 */
function load() { if (promo()) return { ...DEF }; try { return clean(JSON.parse(localStorage.getItem(KEY) || 'null') || DEF); } catch (e) { return { ...DEF }; } }
export const SET = load();
// 색 구분 돕기 팔레트(Okabe–Ito — 빨강·초록 대신 주황·청록·파랑 + 무늬)
export const CB = { live: '#d55e00', work: '#f0e442', pub: '#0072b2', nat: '#009e73' };
const ZOOM = [1, 1.15, 1.3], PZ = [1, 1.12, 1.24];
const CSS = () => [1, 2].map((i) => {
  const z = ZOOM[i], p = PZ[i], b = 'body.fs-' + i + ' ';
  return b + '.chip{zoom:' + z + '}'
    + b + '.twn-p .bx,' + b + '.lb-pop,' + b + '#lkPop .lk-box,' + b + '.st-box,' + b + '#pause>div{zoom:' + p + ';max-width:calc(94vw / ' + p + ')!important;max-height:calc(90vh / ' + p + ')!important}'
    + b + '.twn-dlg .dbox,' + b + '#story-talk{zoom:' + z + ';max-width:calc(96vw / ' + z + ')!important}'
    + b + '.twn-play .pb{zoom:' + p + '}';
}).join('')
  + 'body.calm-on *,body.calm-on *::before,body.calm-on *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'   // 흔들림 줄이기 = 튀어나오기·흔들기·깜빡이기 X(자리는 그대로 — 사라지는 효과도 끝 모습 대신 처음 모습으로 남았다가 지워짐)
  + 'body.cb-on .twn-play .zone{background:repeating-linear-gradient(135deg,#0072b2 0 6px,#56b4e9 6px 12px)!important}body.cb-on .twn-play .mk{background:#111!important;box-shadow:0 0 0 3px #ffd23c!important}'   // 일 놀이 막대: 초록 칸 → 파랑 줄무늬 · 빨간 막대 → 검정 + 노란 테
  + 'body.cb-on .twn-p[data-k=dex] .bagg>div:not([style*="opacity"]){position:relative;box-shadow:inset 0 0 0 3px #0072b2}body.cb-on .twn-p[data-k=dex] .bagg>div:not([style*="opacity"])::after{content:"✓";position:absolute;top:2px;right:7px;font-weight:900;color:#0072b2;font-size:16px}'   // 도감: 모은 칸 = 파란 테 + ✓
  + '.st-tg button[aria-pressed="true"]{outline:3px solid #ffd23c;outline-offset:1px}';
function apply() {
  if (window.SM_PROMO) return;   /* FIX-CX7(코덱스 점검): 홍보판은 설정 CSS·꼬리표를 아예 붙이지 않음(기기 '움직임 줄이기'가 홍보판 애니메이션을 끄던 것) */
  const B = document.body; if (!B) { addEventListener('DOMContentLoaded', apply, { once: true }); return; }
  if (!document.getElementById('set-css')) { const st = document.createElement('style'); st.id = 'set-css'; st.textContent = CSS(); document.head.appendChild(st); }
  B.classList.toggle('fs-1', SET.fs === 1); B.classList.toggle('fs-2', SET.fs === 2); B.classList.toggle('cb-on', SET.cb); B.classList.toggle('calm-on', SET.calm);
}
apply();
export function setSet(patch) { if (promo()) return SET; Object.assign(SET, clean({ ...SET, ...patch })); try { localStorage.setItem(KEY, JSON.stringify(SET)); } catch (e) { /* 막힘 = 이 탭에서만 */ }
  apply(); if (SET.mute || !SET.read) hush(); try { dispatchEvent(new CustomEvent('sm-set', { detail: { ...SET } })); } catch (e) { /* */ } return SET; }
// ── 읽어 주기(브라우저 한국어 목소리 — 있을 때만 · 소리 끄기면 읽지 않음) ──
let VO = null; const hasSS = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
if (hasSS()) try { speechSynthesis.addEventListener('voiceschanged', () => { VO = null; }); } catch (e) { /* */ }
export function koVoice() { if (!hasSS()) return null; if (VO) return VO; try { VO = speechSynthesis.getVoices().find((v) => /^ko/i.test(v.lang)) || null; } catch (e) { VO = null; } return VO; }
export function speak(text) {
  if (!SET.read || SET.mute || promo() || !hasSS()) return false; const v = koVoice(); if (!v) return false;
  const t = String(text || '').replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/\s+/g, ' ').trim(); if (!t) return false;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'ko-KR'; u.voice = v; u.rate = 1; speechSynthesis.speak(u); return true; } catch (e) { return false; }
}
export function hush() { try { if (hasSS()) speechSynthesis.cancel(); } catch (e) { /* */ } }
if (typeof window !== 'undefined') window.SM_SET = { get set() { return { ...SET }; }, speak, hush };   // import를 못 쓰는 놀이(story.js 등)가 읽어 주기를 부르는 길

// ── 창 내용(마을 = openP 안 · 학교 = openSetPanel) — 기존 클래스(.grp .row .sub .sm)만 ──
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tg = (k, v, on, label) => '<button type="button" class="' + (on ? '' : 'sub') + '" data-st="' + k + '" data-v="' + v + '" aria-pressed="' + on + '">' + esc(label) + '</button>';
export function setHTML(en, o9) { const town = !!(o9 && o9.town), L = (ko, e9) => (en ? e9 : ko), ko = !!koVoice(), ss = hasSS();
  return '<h3>⚙ ' + L('설정', 'Settings') + '</h3>'
    + '<div class="grp">🔤 ' + L('글씨 크기', 'Text size') + '</div><div class="row st-tg" style="justify-content:flex-start">' + [L('보통', 'Normal'), L('크게', 'Large'), L('아주 크게', 'Larger')].map((t, i) => tg('fs', i, SET.fs === i, t)).join('') + '</div>'
    + '<div class="grp">🎨 ' + L('색 구분 돕기', 'Colour help') + '</div><div class="row st-tg" style="justify-content:flex-start">' + tg('cb', 1, SET.cb, L('켜기', 'On')) + tg('cb', 0, !SET.cb, L('끄기', 'Off')) + '</div><div class="sm">' + L('빨강·초록 대신 주황·청록·파랑과 무늬로 — 지도 범례·일 놀이 막대·도감·요리 재료', 'Orange, teal and blue with patterns instead of red and green — map, timing bar, codex, recipes') + '</div>'
    + '<div class="grp">🔇 ' + L('소리', 'Sound') + '</div><div class="row st-tg" style="justify-content:flex-start">' + tg('mute', 0, !SET.mute, L('소리 켜기', 'Sound on')) + tg('mute', 1, SET.mute, L('모든 소리 끄기', 'All sound off')) + '</div>'
    + '<div class="grp">📺 ' + L('화면 모드', 'Display mode') + '</div><div class="row st-tg" style="justify-content:flex-start">' + tg('gm', 0, !SET.gm, L('자동 (기기에 맞춤 · 추천)', 'Auto (fits the device · recommended)')) + tg('gm', 1, SET.gm === 1, L('그래픽 우선 (30fps)', 'Graphics first (30fps)')) + tg('gm', 2, SET.gm === 2, L('부드럽게 (60fps)', 'Smooth (60fps)')) + '</div><div class="sm">' + L('자동은 좋은 컴퓨터에선 그래픽을 다 보여 주고, 버거울 때만 해상도를 살짝 낮춰요. 그래픽 우선은 1초에 30번 그려서 기기가 덜 뜨거워요. 부드럽게는 60번을 목표로 하고, 버거우면 먼 안개와 작은 물건, 그림자를 차례로 줄여요.', 'Auto shows full graphics on a strong computer and only lowers resolution a little when it struggles. Graphics first draws 30 times a second and keeps the device cooler. Smooth aims for 60 and, when it struggles, trims far fog, small details and shadows in turn.') + '</div>'   /* MODE-1 */
    + '<div class="grp">🌀 ' + L('흔들림 줄이기', 'Reduce motion') + '</div><div class="row st-tg" style="justify-content:flex-start">' + tg('calm', 1, SET.calm, L('켜기', 'On')) + tg('calm', 0, !SET.calm, L('끄기', 'Off')) + '</div><div class="sm">' + L('창이 튀어나오기·얼굴 흔들기·배 출렁임을 줄여요', 'Less bouncing windows, wobbling faces and boat rocking') + (RM ? L(' · 이 기기는 처음부터 켬', ' · on by default on this device') : '') + '</div>'
    + '<div class="grp">📢 ' + L('읽어 주기', 'Read aloud') + '</div><div class="row st-tg" style="justify-content:flex-start">' + tg('read', 1, SET.read, L('켜기', 'On')) + tg('read', 0, !SET.read, L('끄기', 'Off')) + '</div><div class="sm">' + (!ss ? L('이 브라우저는 읽어 주기를 못 해요', 'This browser cannot read aloud') : ko ? L('대화창 글을 소리 내어 읽어요(소리 끄기면 안 읽어요)', 'Reads dialogue aloud (not when sound is off)') : L('이 기기에 한국어 목소리가 없어요 — 켜 두면 목소리가 생길 때 읽어요', 'No Korean voice on this device yet')) + '</div>'
    + '<div class="grp">🧭 ' + L('나침반 띠 (마을 화면 위 · 동서남북과 갈 곳)', 'Compass strip (town · directions and your goal)') + '</div><div class="row st-tg" style="justify-content:flex-start">' + tg('comp', 1, SET.comp, L('켜기', 'On')) + tg('comp', 0, !SET.comp, L('끄기', 'Off')) + '</div>'
    + (town ? '<div class="grp">🏅 ' + L('도전 모드 (마을 · 빨간 선 없이 찾아가기)', 'Challenge mode (town · find places without the red line)') + '</div><div class="row st-tg" style="justify-content:flex-start">' + tg('chal', 1, SET.chal, L('켜기', 'On')) + tg('chal', 0, !SET.chal, L('끄기', 'Off')) + '</div><div class="sm">' + L('켜면 빨간 선과 거리 숫자가 없어지고, 길 안내 단추가 「지도 펴기」가 돼요. 이웃 말과 지도로 찾아가면 나의 길 도전가 걸음이 하루 하나 늘어요.', 'No red line or distance numbers; the guide button opens the map. Finding a place this way adds one Challenger step a day.') + '</div>' : '')
    + '<div class="sm" style="margin-top:6px">' + L('이 기기에 기억해요', 'Saved on this device') + '</div>'
    + '<div class="row"><button type="button" class="sub" data-st="reset">↺ ' + L('처음 설정', 'Defaults') + '</button><button type="button" data-st="x">' + L('다 됐어요', 'Done') + '</button></div>'; }
export function bindSet(root, o = {}) {
  root.addEventListener('click', (e) => { const b = e.target.closest('button[data-st]'); if (!b || !root.contains(b)) return; e.stopPropagation(); const k = b.dataset.st;
    if (k === 'x') { if (o.onClose) o.onClose(); return; }
    if (k === 'reset') setSet({ fs: 0, cb: false, mute: false, calm: RM, read: false, comp: true, chal: false }); else setSet({ [k]: k === 'fs' || k === 'gm' ? +b.dataset.v : b.dataset.v === '1' });   /* (처음 설정은 화면 모드를 그대로 둠 — 기기 성능 고르기) */
    if (k === 'read' && SET.read) speak(o.en ? '읽어 주기를 켰어요' : '읽어 주기를 켰어요');
    if (o.redraw) o.redraw(); else { const box = root.classList.contains('st-box') ? root : root.querySelector('.bx'); if (box) { const sc = box.scrollTop; box.innerHTML = setHTML(o.en, o); box.scrollTop = sc; } } });
}
// 학교 쪽 작은 창(⏸ 멈춤 창과 같은 결 — 크림 바탕 · 남색 테 · 노란 단추) · 사진관 창도 같이 씀
export function schoolPop(id, html, onClose) { const old = document.getElementById(id); if (old) old.remove(); document.exitPointerLock?.();
  const w = document.createElement('div'); w.id = id; w.className = 'ttl-keep st-pop';
  w.style.cssText = 'position:fixed;inset:0;z-index:61;display:flex;align-items:center;justify-content:center;background:rgba(20,30,50,.45);font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
  w.innerHTML = '<div class="st-box" role="dialog" aria-modal="true" style="background:#fffdf5;color:#1d3557;border:4px solid #1d3557;border-radius:18px;padding:14px 18px;width:min(560px,94vw);max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;box-shadow:0 8px 0 #1d3557">' + html + '</div>';
  if (!document.getElementById('st-pop-css')) { const st = document.createElement('style'); st.id = 'st-pop-css'; st.textContent = '.st-pop h3{margin:0 0 8px;font-size:20px}.st-pop .grp{font-weight:800;margin-top:8px}.st-pop .sm{font-size:13px;color:#5a6b80}.st-pop .row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px}.st-pop button{font:inherit;font-weight:800;border:0;border-radius:10px;padding:8px 14px;min-height:44px;background:#ffd23f;color:#1d3557;cursor:pointer}.st-pop button.sub{background:#e8edf3;color:#1d3557}.st-pop .bagg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:6px}.st-pop .bagg>div{background:#eef4ff;border-radius:10px;padding:5px;text-align:center;font-size:12px}'; document.head.appendChild(st); }
  const close = () => { if (!w.isConnected) return; removeEventListener('keydown', onEsc, true); w.remove(); if (onClose) onClose(); };
  const onEsc = (e) => { if (e.key !== 'Escape' || !w.isConnected) return; e.preventDefault(); e.stopImmediatePropagation(); close(); };
  addEventListener('keydown', onEsc, true); for (const t of ['keydown', 'keyup']) w.addEventListener(t, (e) => e.stopPropagation());
  w.addEventListener('click', (e) => { e.stopPropagation(); if (e.target === w) close(); });
  document.body.appendChild(w); return { el: w, box: w.querySelector('.st-box'), close };
}
export function openSetPanel(o = {}) { if (promo()) return null; const P = schoolPop('setPop', setHTML(false), o.onClose); bindSet(P.box, { onClose: P.close }); const ok = P.box.querySelector('[data-st="x"]'); if (ok) ok.focus({ preventScroll: true }); return P; }
// MODE-1 처음 한 번 화면 모드 고르기(main.js가 처음 몇 걸음 걸은 뒤 부름 · 홍보판 X) — 고르지 않고 닫으면 추천(부드럽게)으로 기억
export function openGfxPick(o = {}) { if (promo() || document.getElementById('gmPop')) return null; const en = !!o.en, L = (ko, e9) => (en ? e9 : ko);
  const card = (v, t, d, rec) => '<button type="button" data-gm="' + v + '" class="' + (rec ? '' : 'sub') + '" style="display:block;width:100%;text-align:left;margin-top:8px"><b>' + esc(t) + (rec ? ' ' + esc(L('(추천)', '(recommended)')) : '') + '</b><br><span style="font-weight:600;font-size:13px">' + esc(d) + '</span></button>';
  let picked = false; const P = schoolPop('gmPop', '<h3>📺 ' + L('화면을 어떻게 볼까요?', 'How should the screen run?') + '</h3>'
    + card(2, L('부드럽게', 'Smooth'), L('1초에 60번 그려요. 버거우면 먼 곳부터 조금씩 줄여요.', 'Draws 60 times a second and trims far things when it struggles.'), true)
    + card(1, L('그래픽 우선', 'Graphics first'), L('1초에 30번 그려요. 기기가 덜 뜨겁고 배터리를 아껴요.', 'Draws 30 times a second. Cooler device, longer battery.'), false)
    + '<div class="sm" style="margin-top:8px">' + L('⚙ 설정에서 언제든 바꿀 수 있어요.', 'You can change this any time in Settings.') + '</div>', () => { if (!picked) setSet({ gm: 2 }); if (o.onClose) o.onClose(); });
  P.box.addEventListener('click', (e) => { const b = e.target.closest('button[data-gm]'); if (!b) return; e.stopPropagation(); picked = true; setSet({ gm: +b.dataset.gm }); P.close(); });
  const f = P.box.querySelector('button[data-gm="2"]'); if (f) f.focus({ preventScroll: true }); return P; }
