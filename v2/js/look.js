// 🎨 내 모습(LOOK-1 · 10-17 함께·표현 팀 설계): 모자 색 · 윗옷 · 바지 · 머리색 · 피부색 — 처음부터 모두 열림(순위·희귀 X · 사고팔기 X)
//   칠하기 = 이미 구운 메시의 정점 색만 바꿈(kid.js·마을 자전거 탄 아이 bake와 같은 색 칸) — 재질·메시 새로 X · 매 프레임 일 0(고를 때 한 번)
//   어느 정점이 어느 칸인지 = 처음 붙일 때 '구운 원래 색'으로 한 번 찾아 둠(userData 없이 부위 순서가 바뀌어도 맞음) — BASE는 kid.js C와 같은 값
//   저장 = 이 기기 localStorage 'sm-look'(학교·마을 같은 모습) · 홍보판(SM_PROMO) = 늘 기본 모습(창·저장·보내기 모두 꺼짐)
//   함께하기 = 옷 코드 'L' + 숫자 다섯(모자·윗옷·바지·머리·피부) → players k 칸(8자 이하 — DB 규칙 그대로) · 기본 모습이면 예전처럼 'kid'
//   모자 모양 = 지금 것 하나(나중에 솜씨 보상으로 늘릴 자리 = SHAPES)
const T2 = (ko, en) => [ko, en];
export const PALS = {
  cap: [[0xf2c230, T2('노랑', 'Yellow')], [0xe8574f, T2('빨강', 'Red')], [0x4f8fe0, T2('파랑', 'Blue')], [0x4fbf6a, T2('초록', 'Green')], [0x9a6ad8, T2('보라', 'Purple')], [0xf28fb5, T2('분홍', 'Pink')], [0xf4f1e8, T2('하양', 'White')], [0x3a3f4a, T2('검정', 'Black')]],
  top: [[0x5aa6e0, T2('하늘', 'Sky')], [0xe8605a, T2('빨강', 'Red')], [0xf2a93b, T2('주황', 'Orange')], [0x5cbf73, T2('초록', 'Green')], [0x9b7be0, T2('보라', 'Purple')], [0xf28fb5, T2('분홍', 'Pink')], [0xf4f1e8, T2('하양', 'White')], [0x3d4658, T2('먹색', 'Charcoal')]],
  bot: [[0x33456b, T2('남색', 'Navy')], [0x2b2d33, T2('검정', 'Black')], [0x8a8f99, T2('회색', 'Grey')], [0x7a5a3e, T2('갈색', 'Brown')], [0x3f7a4a, T2('초록', 'Green')], [0xc9b48a, T2('베이지', 'Beige')], [0x4f7fc0, T2('청바지', 'Denim')], [0xb04a5a, T2('자주', 'Plum')]],
  hair: [[0x5b3f2e, T2('갈색', 'Brown')], [0x2a2522, T2('검정', 'Black')], [0x8a5a36, T2('밝은 갈색', 'Light brown')], [0xc9954f, T2('금빛', 'Golden')], [0x3a2a1e, T2('짙은 갈색', 'Dark brown')], [0xa8483a, T2('붉은 갈색', 'Auburn')], [0xf08fb0, T2('분홍', 'Pink')], [0x5a8fd8, T2('파랑', 'Blue')]],
  skin: [[0xf7d6b5, T2('기본', 'Default')], [0xfbe4cf, T2('밝은 톤', 'Light')], [0xeec39b, T2('따뜻한 톤', 'Warm')], [0xd9a273, T2('구릿빛', 'Tan')], [0xb57a4e, T2('갈색 톤', 'Brown')], [0x8a5634, T2('짙은 톤', 'Deep')]],
};
export const LOOK_KEYS = ['cap', 'top', 'bot', 'hair', 'skin'];
export const SHAPES = [T2('둥근 모자', 'Cap')];   // 모자 모양 — 지금은 하나(솜씨 보상으로 늘릴 자리)
const LABEL = { cap: T2('👒 모자 색', '👒 Hat'), top: T2('👕 윗옷', '👕 Top'), bot: T2('👖 바지', '👖 Shorts'), hair: T2('💇 머리색', '💇 Hair'), skin: T2('✋ 피부색', '✋ Skin') };
// kid.js C(구운 원래 색) — 이 색으로 칠한 정점이 각 칸
const BASE = { top: 0x5aa6e0, top2: 0x4a90cc, bot: 0x33456b, skin: 0xf7d6b5, hair: 0x5b3f2e, cap: 0xf2c230, cap2: 0xe0ac1c, blush: 0xf6b9a8 };
const SLOT = ['', 'top', 'top2', 'bot', 'skin', 'hair', 'cap', 'cap2', 'blush'];
const DEF = { cap: 0, top: 0, bot: 0, hair: 0, skin: 0 };
const KEY = 'sm-look';
const promo = () => !!(typeof window !== 'undefined' && window.SM_PROMO);
const clampL = (l) => { const o = { ...DEF }; if (l && typeof l === 'object') for (const k of LOOK_KEYS) { const v = l[k] | 0; o[k] = v >= 0 && v < PALS[k].length ? v : 0; } return o; };
function load() { if (promo()) return { ...DEF }; try { return clampL(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return { ...DEF }; } }
let cur = load(), T = null;
const sets = new Set();   // 붙인 메시 묶음(내 캐릭터 · 마을 자전거 탄 아이 · 미리보기)
export const getLook = () => ({ ...cur });
export const isDefault = (l = cur) => LOOK_KEYS.every((k) => (l[k] | 0) === 0);
// 옷 코드(함께하기 · 8자 이하): 기본 모습이면 null(→ 예전 'kid')
export const lookCode = (l = cur) => (promo() || isDefault(l) ? null : 'L' + LOOK_KEYS.map((k) => l[k] | 0).join(''));
export function parseLook(k) { if (typeof k !== 'string' || !/^L[0-9]{5}$/.test(k)) return null; const o = {}; LOOK_KEYS.forEach((key, i) => { o[key] = +k[i + 1]; }); return clampL(o); }
// sRGB 글자 색 셈(어둡게 · 섞기) — 칠하기 직전에만
const ch = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255], hx = (a) => (Math.round(a[0]) << 16) | (Math.round(a[1]) << 8) | Math.round(a[2]);
const dark = (h, m) => hx(ch(h).map((v) => v * m)), mix = (a, b, t) => { const A = ch(a), B = ch(b); return hx(A.map((v, i) => v + (B[i] - v) * t)); };
// 칸마다 색(hex · sRGB) — 기본 칸(0)은 원래 색 그대로(이음 색 top2·cap2·볼도 원래 값)
export function lookColors(l = cur) { l = clampL(l); const P = (k) => PALS[k][l[k]][0];
  return { cap: P('cap'), cap2: l.cap ? dark(P('cap'), 0.86) : BASE.cap2, top: P('top'), top2: l.top ? dark(P('top'), 0.86) : BASE.top2, bot: P('bot'), hair: P('hair'), skin: P('skin'), blush: l.skin ? mix(P('skin'), 0xff8a80, 0.35) : BASE.blush }; }

// 메시들에 붙이기: 처음 한 번 정점마다 칸 번호(원래 색과 같으면) → 지금 모습으로 칠함 · 돌려준 손잡이.detach()로 뗌
export function attachLook(THREE, list) {
  T = T || THREE; const c9 = new T.Color(), lin = SLOT.map((s) => (s ? c9.set(BASE[s]).toArray() : null)), out = [];
  const meshes = []; for (const o of Array.isArray(list) ? list : [list]) { if (!o) continue; if (o.isMesh) meshes.push(o); else if (o.traverse) o.traverse((m) => { if (m.isMesh) meshes.push(m); }); }
  for (const m of meshes) { const C = m.geometry && m.geometry.attributes.color; if (!C) continue; const a = C.array, n = C.count, sl = new Uint8Array(n); let hit = 0;
    for (let i = 0; i < n; i++) { const r = a[i * 3], g = a[i * 3 + 1], b = a[i * 3 + 2]; for (let s = 1; s < SLOT.length; s++) { const L = lin[s]; if (Math.abs(r - L[0]) < 2e-4 && Math.abs(g - L[1]) < 2e-4 && Math.abs(b - L[2]) < 2e-4) { sl[i] = s; hit++; break; } } }
    if (hit) out.push({ m, sl }); }
  const H = { list: out, detach: () => sets.delete(H) }; sets.add(H); paint(H, cur); return H;
}
function paint(H, l) { if (!T) return; const C = lookColors(l), c9 = new T.Color(), lin = SLOT.map((s) => (s ? c9.set(C[s]).toArray() : null));
  for (const { m, sl } of H.list) { const A = m.geometry.attributes.color, a = A.array; for (let i = 0; i < sl.length; i++) { const s = sl[i]; if (!s) continue; const L = lin[s]; a[i * 3] = L[0]; a[i * 3 + 1] = L[1]; a[i * 3 + 2] = L[2]; } A.needsUpdate = true; } }
// 고르기(저장 + 붙인 것 모두 다시 칠함 + 'sm-look' 알림 — 함께하기가 옷 코드를 보냄) · 홍보판 = 아무 일 없음
export function setLook(l, o = {}) { if (promo()) return getLook(); cur = clampL(l); for (const H of sets) if (!H.temp) paint(H, cur);
  if (!o.noSave) { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, ...cur })); } catch (e) { /* 막힘 = 이 탭에서만 */ } }
  try { dispatchEvent(new CustomEvent('sm-look', { detail: { look: getLook(), code: lookCode() } })); } catch (e) { /* */ } return getLook(); }

// ── 창 안 내용(마을 = openP 안 · 학교 = openLookPanel) — 색 칸(동그라미) + 미리보기 캔버스 ──
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const css6 = (h) => '#' + h.toString(16).padStart(6, '0');
export function lookHTML(en) { const L = en ? 1 : 0;
  const sw = (k, i) => { const [h, nm] = PALS[k][i], on = cur[k] === i; return '<button type="button" class="lk-sw' + (on ? ' on' : '') + '" data-lk-k="' + k + '" data-lk-i="' + i + '" aria-label="' + esc(nm[L]) + '" aria-pressed="' + on + '" title="' + esc(nm[L]) + '" style="background:' + css6(h) + '"></button>'; };
  return '<h3>🎨 ' + (en ? 'My look' : '내 모습') + '</h3><div class="lk-wrap"><div class="lk-pvw"><canvas class="lk-pv" width="180" height="230" aria-label="' + (en ? 'Preview' : '미리보기') + '"></canvas><div class="sm">' + (en ? 'Drag to turn' : '끌면 돌아가요') + '</div></div><div class="lk-rows">'
    + LOOK_KEYS.map((k) => '<div class="grp">' + LABEL[k][L] + '</div><div class="lk-row">' + PALS[k].map((_, i) => sw(k, i)).join('') + '</div>').join('')
    + '<div class="sm">' + (en ? 'Every colour is open from the start. More hat shapes will come with your skills.' : '모든 색을 처음부터 고를 수 있어요 · 모자 모양은 솜씨가 늘면 더 생길 거예요') + '</div></div></div>'
    + '<div class="row"><button type="button" class="sub" data-lk="reset">↺ ' + (en ? 'Original look' : '처음 모습') + '</button><button type="button" data-lk="x">' + (en ? 'Done' : '다 됐어요') + '</button></div>'; }
// 색 칸 모양(마을 창·학교 창 같음 — 창 클래스 .lk-*만) · 터치 44px
const LKCSS = '.lk-wrap{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start}.lk-pvw{text-align:center;flex:0 0 auto}.lk-pv{width:180px;height:230px;border-radius:14px;background:linear-gradient(#e8f3ff,#f7fbff);display:block;touch-action:none;cursor:grab}.lk-rows{flex:1 1 260px;min-width:0}'
  + '.lk-row{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 6px}.lk-sw{width:38px!important;height:38px!important;min-height:38px!important;min-width:38px!important;padding:0!important;border-radius:50%!important;border:3px solid #fff!important;box-shadow:0 0 0 2px #c9d3df;cursor:pointer;flex:0 0 auto}'
  + '.lk-sw.on{box-shadow:0 0 0 3px #1d3557,0 0 0 6px #ffd23c;transform:scale(1.06)}.lk-sw:focus-visible{outline:3px solid #1d3557;outline-offset:2px}body.touch .lk-sw{width:44px!important;height:44px!important;min-height:44px!important;min-width:44px!important}';
export function addLookCss() { if (document.getElementById('lk-css')) return; const st = document.createElement('style'); st.id = 'lk-css'; st.textContent = LKCSS; document.head.appendChild(st); }

// 창에 듣개 붙이기: 색 칸 누름 = 바로 칠함·저장 · 미리보기 = 창이 열린 동안만 그림(창이 닫히면 저절로 멈추고 치움)
//   o = { THREE, buildKid, en, onClose(), onChange(look) } · 미리보기 = 작은 캔버스의 따로 그리는 장면(세상 장면·조명은 건드리지 않음)
export function bindLook(root, o) { addLookCss(); T = T || o.THREE; let pv = null;
  const redraw = () => { for (const b of root.querySelectorAll('.lk-sw')) { const on = cur[b.dataset.lkK] === +b.dataset.lkI; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); } };
  root.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    if (b.dataset.lkK) { e.stopPropagation(); setLook({ ...cur, [b.dataset.lkK]: +b.dataset.lkI }); redraw(); if (pv) pv.paint(); if (o.onChange) o.onChange(getLook()); return; }
    if (b.dataset.lk === 'reset') { e.stopPropagation(); setLook({ ...DEF }); redraw(); if (pv) pv.paint(); if (o.onChange) o.onChange(getLook()); return; }
    if (b.dataset.lk === 'x') { e.stopPropagation(); if (o.onClose) o.onClose(); } });
  const cv = root.querySelector('.lk-pv'); if (cv && o.THREE && o.buildKid) { try { pv = preview(cv, o.THREE, o.buildKid); } catch (er) { pv = null; cv.style.display = 'none'; } }
  return { dispose: () => { if (pv) pv.dispose(); pv = null; } };
}
function preview(cv, THREE, buildKid) {
  const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: false });
  R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.setSize(180, 230, false); R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1.05;
  const S = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 180 / 230, 0.1, 20); cam.position.set(0, 0.72, 3.3); cam.lookAt(0, 0.62, 0);
  S.add(new THREE.HemisphereLight(0xc9dcf0, 0xb08a5e, 1.4)); const sun = new THREE.DirectionalLight(0xfff0cf, 2.6); sun.position.set(1.5, 3, 2.5); S.add(sun);   // 미리보기 장면에만(세상 장면 조명 그대로)
  const K = buildKid(THREE, 'b'); S.add(K.rig); K.rig.rotation.y = -0.5; const H = attachLook(THREE, K.rig); H.temp = true;   // 미리보기 = 고를 때 bindLook이 직접 칠함
  let raf = 0, last = 0, drag = null, spin = 0.6, dead = false;
  const down = (e) => { drag = e.clientX; spin = 0; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); }, move = (e) => { if (drag == null) return; K.rig.rotation.y += (e.clientX - drag) * 0.02; drag = e.clientX; }, up = () => { drag = null; spin = 0.6; };
  cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const dispose = () => { if (dead) return; dead = true; cancelAnimationFrame(raf); sets.delete(H); K.rig.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose(); } }); R.dispose(); try { R.forceContextLoss(); } catch (e) { /* */ } };
  const loop = (t) => { if (dead) return; if (!cv.isConnected) { dispose(); return; } const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; K.rig.rotation.y += spin * dt; K.rig.position.y = Math.abs(Math.sin(t / 420)) * 0.015; R.render(S, cam); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return { paint: () => paint(H, cur), dispose };
}
// 학교 쪽(⏸ 멈춤 창 '🎨 내 모습') — 마을 openP와 같은 내용을 작은 창으로
export function openLookPanel(o) { if (promo()) return null; addLookCss(); document.exitPointerLock?.();
  const old = document.getElementById('lkPop'); if (old) old.remove();
  const w = document.createElement('div'); w.id = 'lkPop'; w.className = 'ttl-keep';
  w.style.cssText = 'position:fixed;inset:0;z-index:61;display:flex;align-items:center;justify-content:center;background:rgba(20,30,50,.45);font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
  w.innerHTML = '<div class="lk-box" role="dialog" aria-modal="true" style="background:#fffdf6;color:#1d3557;border:4px solid #1d3557;border-radius:18px;padding:14px 18px;width:min(640px,94vw);max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;box-shadow:0 8px 0 #1d3557">' + lookHTML(false) + '</div>';
  const st = document.createElement('style'); st.textContent = '#lkPop h3{margin:0 0 8px;font-size:20px}#lkPop .grp{font-weight:800;margin-top:4px}#lkPop .sm{font-size:13px;color:#5a6b80}#lkPop .row{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}#lkPop .row button{font:inherit;font-weight:800;border:0;border-radius:10px;padding:9px 16px;min-height:44px;background:#1d3557;color:#fff;cursor:pointer}#lkPop .row button.sub{background:#e8edf3;color:#1d3557}'; w.appendChild(st);
  let B = null; const close = () => { if (!w.isConnected) return; removeEventListener('keydown', onEsc, true); if (B) B.dispose(); w.remove(); if (o && o.onClose) o.onClose(); };
  const onEsc = (e) => { if (e.key !== 'Escape' || !w.isConnected) return; e.preventDefault(); e.stopImmediatePropagation(); close(); };   // 창 밖에 초점이 있어도 Esc = 닫기(잡기 단계 — 오프닝·멈춤 창보다 뒤에 붙어 그쪽이 먼저 비켜 줌)
  addEventListener('keydown', onEsc, true);
  for (const t of ['keydown', 'keyup']) w.addEventListener(t, (e) => { e.stopPropagation(); });
  w.addEventListener('click', (e) => { e.stopPropagation(); if (e.target === w) close(); });
  document.body.appendChild(w); B = bindLook(w, { ...o, onClose: close }); const ok = w.querySelector('[data-lk="x"]'); if (ok) ok.focus({ preventScroll: true }); return { close };
}
