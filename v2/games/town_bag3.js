// 🎒 가방 갈래 + 게임 가방(BAG-3 · 사용자 11-02 '인벤토리하고 장비? 분류가 잘 안 되는 것 같아 · 직관성' · 11-07 '게임처럼 보이는 기능은 무시?') — 설계 docs/systems/town_bag3.md
//   갈래 탭 넷: 🎒 물건(네모 칸 격자 · 거르기 · 정렬 · 크게 보기 카드) · 🧰 도구·장비(쓰임 카드 · 도구 띠 1~6 끌어 놓기) · 👕 옷·꾸미기(쓰기/벗기 · 마당 장식) · 🏅 모은 것(도장 · 배지 · 칭호 · 요리법 · 도감)
//   게임 가방: 내 아이 인형(지금 렌더러로 창 열 때 한 번 · 새 WebGL 컨텍스트 X) + 장비 칸 다섯 · 어디서 났나 꼬리표(누르면 지도 조각) · 새로 얻은 것 빨간 점 · 지금 켜진 효과 · 톡/착 소리 · ←→ 탭
//   지키는 선: 희귀도 색 테두리·반짝이·그라데이션·무게·내구도 X · 매 프레임 일 0(창이 열린 동안 끌기만) · 판타지 X · 실명 X · 이모지 = 윈도 10에서 보이는 것
//   마을 쪽이 넘기는 것(A): GAME · lang() · esc(t) · bag() · rwd() · tools() · here() [x, z] · me() {x, z} · where(x, z) { ic, nm } · mapSnip(cv, pts) · renderer() · kid() · T3
//     tone(...) · sfx(k) · typh() { rope, sand } | null · fx() 먹은 힘 한 줄 · lookSig() · night() · reopen(tab) · useShow(P9, e) · useBox() · sell(e) · yard(e)
import { ITEMS, itemName } from './town_game.js?v=52';
import { TOOL, TOOL_ORDER } from './town_tools.js?v=17';
export const BAG3_V = 1;
const T2 = (ko, en) => [ko, en];
export const TABS = [['item', '🎒', T2('물건', 'Items')], ['tool', '🧰', T2('도구·장비', 'Tools')], ['wear', '👕', T2('옷·꾸미기', 'Clothes')], ['col', '🏅', T2('모은 것', 'Collection')]];
const ICAT = { dish: 'item', food: 'item', cook: 'item', treat: 'item', wild: 'item', farm: 'item', stamp: 'col', goods: 'wear' };   /* ITEMS 갈래 → 가방 탭(없는 갈래·없는 글자 = 물건) */
const CORD = ['dish', 'food', 'cook', 'treat', 'wild', 'farm'];
const FLT = [['all', T2('전체', 'All')], ['dish', T2('🍳 요리', '🍳 Cooked')], ['food', T2('🍽 먹거리', '🍽 Food')], ['cook', T2('🥚 재료', '🥚 Ingredients')], ['treat', T2('🍦 군것질', '🍦 Treats')], ['wild', T2('🌲 주운 것', '🌲 Finds')]];
const CATN = { dish: T2('만든 요리', 'Cooked dish'), food: T2('먹거리', 'Food'), cook: T2('요리 재료', 'Ingredient'), treat: T2('군것질', 'Treat'), wild: T2('주운 것', 'Found'), farm: T2('일한 보람', 'Work done'), stamp: T2('도장', 'Stamp'), goods: T2('마당 장식', 'Yard decoration') };
const SORTS = [['kind', T2('종류', 'Kind')], ['new', T2('얻은 순', 'Newest')], ['val', T2('값', 'Value')]];
const BACK = /^mv:(deco|cook|fridge|undo)?$/;   /* 되돌림(마당 → 가방 · 요리 그만 · 냉장고 · 되돌리기) = 꼬리표·새 점 그대로 */
const UPG = { tank: 'can', rod2: 'rod', broom2: 'broom', scope: 'scope' };   /* 도구를 낫게 하는 보상 = 그 도구 카드 안(town_reward.js UPG와 같음) */
const IDX = {}; Object.keys(ITEMS).forEach((e, i) => { IDX[e] = i; });
const EQ = [['head', '🧢', T2('머리', 'Head'), 'l', 0], ['neck', '🧣', T2('목', 'Neck'), 'l', 1], ['back', '🎒', T2('등', 'Back'), 'l', 2], ['hand', '✋', T2('손', 'Hand'), 'r', 1], ['foot', '🥾', T2('발', 'Feet'), 'r', 3]];
const kindOf = e => (ITEMS[e] || [])[2] || 'food';
const tabOfE = e => ICAT[kindOf(e)] || 'item';
const fltOf = e => (kindOf(e) === 'farm' ? 'wild' : kindOf(e));
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1); return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b); };
const hex6 = c => '#' + ((c >>> 0) & 0xffffff).toString(16).padStart(6, '0');
const CSS = `
.twn-p[data-k=I] .bx{width:min(1040px,96vw)!important}.twn-p.b3-re .bx{animation:none}
.twn-p[data-k=I] .nb-tabs{margin-bottom:8px;align-items:center}.twn-p .b3-nbl{flex:none;align-self:center;font:900 12px system-ui,sans-serif;color:var(--mut);margin-right:2px;white-space:nowrap}
.b3-main{display:grid;grid-template-columns:208px minmax(0,1fr);gap:16px;align-items:start}.b3-me{display:flex;flex-direction:column;gap:10px;min-width:0}
.b3-doll{position:relative;width:208px;height:277px;box-sizing:border-box;border:3px solid var(--ink);border-radius:14px;background:#e8f1e6;box-shadow:inset 0 -40px 0 #d3e4cc;overflow:hidden}
.b3-cv{position:absolute;left:0;top:0;width:100%;height:100%;display:block;object-fit:contain}.b3-doll>small{position:absolute;left:0;right:0;bottom:6px;text-align:center;font-size:11px;font-weight:800;color:#4d6a48;pointer-events:none}
.twn-p .b3-eq{position:absolute;width:50px;height:50px;min-height:0;padding:0;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fffdf7;color:var(--ink);border:2px solid var(--ink);border-radius:11px;box-shadow:0 3px 0 var(--ink);text-shadow:none;font-size:22px;font-weight:400;line-height:1}
.twn-p .b3-eq:hover{background:#fff6dd}.twn-p .b3-eq small{font-size:10px;font-weight:900;color:var(--mut);margin-top:2px}.twn-p .b3-eq.no i{opacity:.25;filter:grayscale(1)}.twn-p .b3-eq i{font-style:normal}
.twn-p .b3-eq em{position:absolute;right:3px;top:3px;width:9px;height:9px;border-radius:3px;border:1px solid var(--ink)}
.b3-eq.l{left:6px}.b3-eq.r{right:6px}.b3-eq.p0{top:8px}.b3-eq.p1{top:68px}.b3-eq.p2{top:128px}.b3-eq.p3{bottom:30px}
.b3-fx{background:var(--card);border:2px solid var(--line);border-radius:12px;padding:8px 10px}.b3-fxh{font-weight:900;font-size:13px;color:var(--mut);margin-bottom:4px}
.b3-fx ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}.b3-fx li{display:flex;gap:6px;align-items:flex-start;font-size:13px;font-weight:800;line-height:1.3}.b3-fx li i{flex:none;font-style:normal;width:20px;text-align:center}
.b3-info{font-size:12px!important;line-height:1.4}
.b3-tabs{display:flex;gap:6px;align-items:flex-end;border-bottom:3px solid var(--ink);padding:0 2px}
.twn-p .b3-t{position:relative;flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 6px 6px;margin:0 0 -3px;min-height:48px;border:3px solid var(--ink);border-radius:12px 12px 0 0;background:var(--sub);color:var(--ink);box-shadow:none;text-shadow:none;font-size:15px;white-space:nowrap}
.twn-p .b3-t:hover{background:var(--subh)}.twn-p .b3-t.on{background:var(--pap);border-bottom-color:var(--pap);z-index:1}.twn-p .b3-t:active{transform:none;box-shadow:none}.twn-p .b3-t i{font-style:normal;font-size:20px}.twn-p .b3-t s{text-decoration:none;font-size:12px;color:var(--mut);font-weight:800}
.b3-dot{position:absolute;right:4px;top:4px;width:12px;height:12px;border-radius:50%;background:#e0453a;border:2px solid #fff;box-sizing:border-box;pointer-events:none;z-index:2}.b3-t .b3-dot{right:4px;top:4px}
.b3-split{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;margin-top:10px;align-items:start}.b3[data-b3tab=tool] .b3-split{grid-template-columns:minmax(0,1fr)}.b3[data-b3tab=tool] .b3-card{display:none}
.b3-pane{display:none;min-width:0}.b3[data-b3tab=item] [data-pane=item],.b3[data-b3tab=tool] [data-pane=tool],.b3[data-b3tab=wear] [data-pane=wear],.b3[data-b3tab=col] [data-pane=col]{display:block}
.b3-bar{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:space-between}.b3-chips,.b3-sort{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.b3-sort small{font-size:12px;font-weight:800;color:var(--mut)}
.twn-p .b3-chips button,.twn-p .b3-sort button{min-height:34px;padding:3px 8px;font-size:12.5px;border-width:2px;box-shadow:0 2px 0 var(--ink);background:var(--sub);color:var(--ink);text-shadow:none}.twn-p .b3-chips button.on,.twn-p .b3-sort button.on{background:var(--ink);color:#fff8ea}
.twn-p .b3-grid{display:grid;grid-template-columns:repeat(auto-fill,72px);gap:8px;margin-top:8px}
.twn-p .b3s{position:relative;width:72px;height:72px;min-height:0;box-sizing:border-box;padding:0 0 12px;margin:0;display:flex;align-items:center;justify-content:center;background:var(--card);color:var(--ink);border:2px solid var(--line);border-radius:12px;box-shadow:0 3px 0 var(--line);text-shadow:none;font-weight:800}
.twn-p button.b3s:hover{background:#fffaf0;border-color:var(--ink)}.twn-p .b3s b{font-size:30px;line-height:1;font-weight:400}.twn-p .b3s small{position:absolute;left:5px;bottom:3px;max-width:42px;font-size:10.5px;line-height:1.2;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.twn-p .b3s i{position:absolute;right:5px;bottom:2px;font-style:normal;font-size:12px;font-weight:900;color:var(--ink)}.twn-p .b3s.sel{border:3px solid var(--ink);background:#fff1c9;box-shadow:0 3px 0 var(--ink)}
.twn-p .b3s.e{border-style:dashed;background:rgba(255,253,247,.5);box-shadow:none}.b3-none{color:var(--mut);font-size:14px;padding:10px 2px}
.b3-card{position:sticky;top:58px;background:var(--card);border:3px solid var(--ink);border-radius:14px;box-shadow:0 4px 0 var(--ink);padding:10px 12px;min-height:190px;box-sizing:border-box}
.b3-ph{color:var(--mut);font-size:14px;line-height:1.45;text-align:center;padding:34px 6px}.b3-ch{display:flex;gap:10px;align-items:flex-start}.b3-ch>div{min-width:0}
.b3-big{flex:none;width:76px;height:76px;border-radius:14px;border:2px solid var(--ink);background:#fff1c9;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:400;line-height:1}
.b3-nm{font-size:18px;word-break:keep-all}.b3-ch i{font-style:normal;font-weight:900;color:var(--g)}
.twn-p .b3-from{min-height:32px;padding:2px 9px;margin-top:5px;font-size:13px;border-width:2px;box-shadow:0 2px 0 var(--ink);background:#eef4fb;color:var(--ink);text-shadow:none}
.b3-use1{font-size:14px;line-height:1.45;margin-top:8px}.b3-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.twn-p .b3-acts button{min-height:40px;padding:4px 11px;font-size:14px}
.b3-card .bg-use{display:block;border:0!important;border-top:2px dashed var(--line)!important;border-radius:0!important;background:none!important;padding:6px 0 0!important;margin:10px 0 0!important}
.b3-snip{display:block;width:100%;max-width:300px;height:auto;border-radius:10px;margin-top:8px}
.b3-wg{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;margin-top:6px}
.b3-wc{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;background:var(--card);border:2px solid var(--line);box-shadow:0 3px 0 var(--line);border-radius:12px;padding:8px 6px;text-align:center;font-size:13px;font-weight:800;line-height:1.25}
.b3-wc.on{border:3px solid var(--ink);background:#fff1c9}.b3-wc b{font-size:28px;line-height:1.1;font-weight:400}.b3-wc em{display:block;width:34px;height:6px;border-radius:3px;border:1px solid var(--ink)}.b3-wc i{font-style:normal;color:var(--g);font-weight:900;font-size:12px}
.b3-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:8px;margin-top:6px}.b3-cards .st{margin:0;position:relative}.b3-on{font-weight:800;color:#2f7a3a}.b3-on.off{color:#8a7f74}
.twn-p .b3-sb{min-height:34px;padding:3px 10px;margin-top:4px}.b3-more summary{cursor:pointer;font-size:12.5px;font-weight:800;color:var(--g);margin-top:4px;list-style-position:inside}.b3-more ul{margin-top:3px!important}
.b3-how{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.b3-up{display:inline-block;font-size:12px;font-weight:800;color:#2f6a9a;border:2px solid #b9d0e6;border-radius:6px;padding:0 5px;margin-left:2px;white-space:nowrap}
.b3-tc.lock{opacity:.55}.b3-tc.picked{outline:3px solid #e0a92e;outline-offset:2px}.b3-key{font-size:12px;font-weight:900;color:var(--mut);border:2px solid var(--line);border-radius:6px;padding:0 5px;white-space:nowrap}
.b3-tcb{display:flex;flex-direction:column;gap:5px}.twn-p .b3-tcb button{min-height:36px;padding:2px 10px;font-size:13px;white-space:nowrap}@media (pointer:fine){.b3-tc[data-b3drag]:not(.lock){cursor:grab}}
.b3-beltw{position:sticky;bottom:56px;z-index:3;margin-top:14px;padding:6px 10px;border:3px dashed var(--line);border-radius:14px;background:var(--pap);box-shadow:0 -6px 0 var(--pap)}.b3-belt{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap}.b3-bl{font-weight:900;font-size:14px;line-height:1.2;margin-right:6px;text-align:right}.b3-bl small{font-size:11.5px;color:var(--mut)}
.twn-p .b3-bs{position:relative;width:58px;height:58px;min-height:0;padding:0;margin:0;background:#fff;color:var(--ink);border:2px solid var(--ink);border-bottom-width:4px;border-radius:10px;box-shadow:none;text-shadow:none;font-size:28px;font-weight:400}
.twn-p .b3-bs:hover{background:#fffaf0}.twn-p .b3-bs b{position:absolute;left:4px;top:1px;font:900 11px system-ui,sans-serif;color:#6a5a4a}.twn-p .b3-bs i{font-style:normal}.twn-p .b3-bs.no i{opacity:.3}.twn-p .b3-bs.cur{background:#ffe48a;border-color:#c8443a}
.b3-beltw.pick .b3-bs{outline:3px dashed #e0a92e;outline-offset:2px}.twn-p .b3-bs.hov{background:#fff1c9;outline:3px solid #c8443a;outline-offset:2px}.b3-belth{text-align:center;margin-top:4px;font-size:12px!important}
.b3-gift{background:#fff6e6;border:2px solid #e0a92e;border-radius:12px;padding:7px 9px;margin-bottom:8px}.b3-giftr{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.twn-p .b3-giftr button{min-height:44px;padding:4px 12px;font-size:15px}
.b3-rc{display:flex;flex-direction:column;gap:6px;margin-top:6px}.b3-rc .st{margin:0}.b3-flash{outline:3px solid #e0a92e!important;outline-offset:3px}
.b3-ghost{position:fixed;left:0;top:0;z-index:70;pointer-events:none;width:54px;height:54px;box-sizing:border-box;border:3px solid #2b2420;border-radius:12px;background:#fff8ea;display:flex;align-items:center;justify-content:center;font:28px system-ui,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;box-shadow:0 4px 0 #2b2420}
@media (max-width:999px){.b3-split{grid-template-columns:minmax(0,1fr)}.b3-card{position:static}}
@media (max-width:719px){.b3-main{grid-template-columns:170px minmax(0,1fr);gap:12px}.b3-doll{width:170px;height:226px}.b3-eq.p1{top:60px}.b3-eq.p2{top:112px}}
@media (max-width:599px){.twn-p[data-k=I] .nb-tabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.twn-p[data-k=I] .nb-grp{flex-wrap:nowrap}
  .b3-main{grid-template-columns:minmax(0,1fr)}.b3-me{flex-direction:row;flex-wrap:nowrap;align-items:stretch;gap:8px}.b3-info{display:none}
  .b3-doll{flex:none;width:204px;height:176px}.b3-cv{left:54px;top:6px;width:96px;height:128px}.twn-p .b3-eq{width:46px;height:46px}.b3-eq.l{left:4px}.b3-eq.r{right:4px}.b3-eq.p0{top:4px}.b3-eq.p1{top:65px}.b3-eq.p2{top:126px}.b3-eq.p3{top:126px;bottom:auto}.b3-doll>small{top:140px;bottom:auto;left:54px;right:auto;width:96px}
  .b3-fx{flex:1 1 0;min-width:0;padding:6px 7px}.b3-fx li{font-size:12px}.b3-fxh{font-size:12px}
  .twn-p .b3-t{flex-direction:column;gap:0;font-size:12.5px;padding:4px 2px;min-height:52px}.twn-p .b3-t s{display:none}.twn-p .b3-grid{grid-template-columns:repeat(auto-fill,58px);gap:6px}.twn-p .b3s{width:58px;height:58px}.twn-p .b3s b{font-size:25px}.twn-p .b3s small{max-width:30px;font-size:10px}
  .b3-cards{grid-template-columns:minmax(0,1fr)}.twn-p .b3-bs{width:48px;height:52px;font-size:24px}}
body.touch .twn-p .b3 button{min-width:44px}
@media (max-height:500px){.twn-p[data-k=I] .bx>.row:last-child{position:static}.b3-beltw{position:static;box-shadow:none}.twn-p[data-k=I] .nb-tabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-bottom:6px}.twn-p[data-k=I] .nb-grp{flex-wrap:nowrap}.b3-info{display:none}.b3-belth{display:none}.b3-bl{display:none}.b3-doll{height:200px}.b3-eq.p1{top:54px}.b3-eq.p2{top:100px}.b3-eq.p3{bottom:24px}}
`;

export function createBag3(A) {
  const en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t || '')), esc = t => A.esc(t), G = () => A.GAME.S;
  const R = () => A.rwd(), TL = () => A.tools();
  const PREFK = 'sm-bag3-ui'; let PREF = { tab: 'item', flt: 'all', sort: 'kind' }; try { const j = JSON.parse(localStorage.getItem(PREFK) || 'null'); if (j && typeof j === 'object') PREF = Object.assign(PREF, j); } catch (e) { /* 막힘 */ }
  const savePref = () => { try { localStorage.setItem(PREFK, JSON.stringify(PREF)); } catch (e) { /* 막힘 */ } };
  const UI = { tab: 'item', sel: null, pick: null, snip: false }, SHOW = new Set(), DOLL = { sig: '', img: null, ok: false, n: 0, ms: 0 }, DRAG = { on: false, k: null, from: -1, x0: 0, y0: 0, el: null, end: 0, hov: null };
  let P = null, CTX = {}, styleEl = null, RT = null, CAM = null, BUF = null, dead = false;
  const LOG = []; const log = t => { LOG.push(t); if (LOG.length > 40) LOG.shift(); };

  // ───────── 저장(S.bag3) — 옛 저장(칸 없음) = 지금 가진 것을 모두 본 것으로(점 홍수 X) · 꼬리표는 그 뒤부터 ─────────
  function ownedIds() { const out = [], B = A.bag(); for (const e of Object.keys(B)) if (B[e] > 0) out.push(e); const T = TL(); if (T) { const H = T.have; for (const k of TOOL_ORDER) if (H[k]) out.push('t:' + k); }
    const r = R(); if (r) for (const id of r.api.own()) { const it = r.info(id); if (it && it.kind !== 'deco') out.push(id); } const ty = A.typh && A.typh(); if (ty) { if (ty.rope > 0) out.push('ty:rope'); if (ty.sand > 0) out.push('ty:sand'); } return out; }
  function S() { const g = G(); let s = g.bag3; if (!s || typeof s !== 'object' || s.v !== BAG3_V) { s = g.bag3 = { v: BAG3_V, o: {}, seen: {}, n: 0 }; for (const id of ownedIds()) s.seen[id] = 1; A.GAME.mark(); log('new save'); }
    if (!s.o || typeof s.o !== 'object' || Array.isArray(s.o)) s.o = {}; if (!s.seen || typeof s.seen !== 'object' || Array.isArray(s.seen)) s.seen = {}; if (!(s.n >= 0)) s.n = 0; return s; }
  /* GAME.add 뒤(town_game.js onAdd): 종류마다 마지막 하나 [x, z, 날, 차례] · 가방에 없던 것이 생기면 새 점 */
  function got(e, n, src) { if (dead || !e) return; const s = S(), had = (A.bag()[e] || 0) - n; if (BACK.test(String(src || ''))) return; const p = A.here(); if (p && Number.isFinite(p[0]) && Number.isFinite(p[1])) { s.n = (s.n | 0) + 1; s.o[e] = [Math.round(p[0]), Math.round(p[1]), G().day | 0, s.n]; } if (had <= 0) delete s.seen[e]; A.GAME.mark(); }
  const isNew = id => !S().seen[id] || SHOW.has(id);

  // ───────── 갈래 ─────────
  function tabOfId(id) { if (id.startsWith('t:') || id.startsWith('ty:')) return 'tool'; const r = R(), it = r && !ITEMS[id] ? r.info(id) : null; if (it) return ['hat', 'scarf', 'bag', 'bike', 'flag'].includes(it.kind) ? 'wear' : ['nick', 'badge', 'recipe'].includes(it.kind) ? 'col' : 'tool'; return tabOfE(id); }
  const bagKeys = () => { const B = A.bag(); return Object.keys(B).filter(e => B[e] > 0); };
  function sorted(L9) { const o = S().o, ix = e => (IDX[e] ?? 999), pr = e => (ITEMS[e] || [])[3] || 0, by = PREF.sort;
    if (by === 'new') return L9.slice().sort((a, b) => ((o[b] || [])[3] || 0) - ((o[a] || [])[3] || 0) || ix(a) - ix(b));
    if (by === 'val') return L9.slice().sort((a, b) => pr(b) - pr(a) || ix(a) - ix(b));
    return L9.slice().sort((a, b) => CORD.indexOf(kindOf(a)) - CORD.indexOf(kindOf(b)) || ix(a) - ix(b)); }
  const slot = (id, ic, nm, n) => '<button class="b3s" data-b3s="' + esc(id) + '"' + (ITEMS[id] || !id.includes(':') ? ' data-use="' + esc(id) + '"' : '') + ' data-b3="' + esc(id) + '" title="' + esc(nm) + '" aria-label="' + esc(nm + (n ? ' ×' + n : '')) + '"><b>' + ic + '</b><small>' + esc(nm) + '</small>' + (n ? '<i>×' + n + '</i>' : '') + '</button>';
  const itemSlot = e => slot(e, e, itemName(e, en()), A.bag()[e] | 0);
  function gridItems() { const all = bagKeys().filter(e => tabOfE(e) === 'item'); const f = PREF.flt !== 'all' && all.some(e => fltOf(e) === PREF.flt) ? PREF.flt : 'all'; return { all, f, list: sorted(f === 'all' ? all : all.filter(e => fltOf(e) === f)) }; }
  function itemGrid() { const g = gridItems(); return g.list.length ? g.list.map(itemSlot).join('') : ''; }
  function itemBar() { const g = gridItems(), e9 = en(), cnt = k => g.all.filter(e => fltOf(e) === k).length;
    const chips = FLT.filter(([k]) => k === 'all' || cnt(k)).map(([k, t]) => '<button class="' + (g.f === k ? 'on' : '') + '" data-b3f="' + k + '" aria-pressed="' + (g.f === k) + '">' + esc(L(t)) + ' <small>' + (k === 'all' ? g.all.length : cnt(k)) + '</small></button>').join('');
    return '<div class="b3-bar"><div class="b3-chips" role="group" aria-label="' + (e9 ? 'Filter' : '거르기') + '">' + chips + '</div><div class="b3-sort" role="group"><small>' + (e9 ? 'Sort' : '정렬') + '</small>' + SORTS.map(([k, t]) => '<button class="' + (PREF.sort === k ? 'on' : '') + '" data-b3o="' + k + '" aria-pressed="' + (PREF.sort === k) + '">' + esc(L(t)) + '</button>').join('') + '</div></div>'; }

  // ───────── 탭 조각 ─────────
  function paneItem(c) { const e9 = en(), all = bagKeys().filter(e => tabOfE(e) === 'item');
    return '<div class="b3-pane" data-pane="item" role="tabpanel">' + (c.giftCtx || '') + (all.length ? itemBar() + '<div class="b3-grid" data-grid="item" data-min="4">' + itemGrid() + '</div>' : '<div class="b3-none">' + esc(e9 ? 'Empty! Press E next to workers around town, pick mushrooms, get the summit stamp…' : '아직 비어 있어요! 마을 일꾼 곁에서 E · 버섯 따기 · 산꼭대기 도장…') + '</div><div class="b3-grid" data-grid="item" data-min="3"></div>') + '</div>'; }
  function toolCard(k, parts) { const e9 = en(), T = TL(), H = T ? T.have : {}, own = !!H[k], o = T ? T.order() : TOOL_ORDER, j = o.indexOf(k), cur = T && T.api.info().cur === k, ups = (parts.ups || {})[k] || [], d = TOOL[k];
    const away = k === 'can' && !!T && !H.can;   /* SPEND-1 고치러 맡긴 날 */
    return '<div class="b3-tc st' + (own ? '' : ' lock') + (UI.pick === k ? ' picked' : '') + '"' + (own ? ' data-b3="' + ['t:' + k].concat(ups.map(u => u.id)).join(' ') + '" data-b3drag="' + k + '"' : ' data-b3lock="' + k + '"') + '><b class="n">' + d.ic + '</b><span style="flex:1;min-width:0"><b>' + esc(L(d.t)) + '</b> <small class="b3-key">' + (e9 ? 'slot ' : '띠 ') + (j + 1) + '</small>' + ups.filter(u => u.id !== k).map(u => ' <small class="b3-up" title="' + esc(u.use) + '">⬆ ' + esc(u.t) + '</small>').join('') + (cur ? ' <small class="b3-on">✋ ' + (e9 ? 'in hand' : '손에 듦') + '</small>' : '')
      + '<br><small class="b3-how" title="' + esc(own ? L(d.how) : L(d.get)) + '">' + esc(own ? L(d.how) : (away ? (e9 ? 'Being fixed — it comes back tomorrow morning' : '고치러 맡겼어요. 내일 아침에 와요') : (e9 ? 'Not yet — ' : '아직 없어요. ') + L(d.get))) + '</small>' + '</span>'
      + (own ? '<span class="b3-tcb"><button class="sub" data-b3a="hold" data-k="' + k + '">' + (cur ? (e9 ? 'Put down' : '내려놓기') : '✋ ' + (e9 ? 'Hold' : '들기')) + '</button><button class="sub" data-b3a="put" data-k="' + k + '">⬇ ' + (e9 ? 'To slot' : '띠에 놓기') + '</button></span>' : '') + '</div>'; }
  function belt() { const e9 = en(), T = TL(), H = T ? T.have : {}, o = T ? T.order() : TOOL_ORDER, cur = T ? T.api.info().cur : null;
    return '<div class="b3-beltw' + (UI.pick ? ' pick' : '') + '"><div class="b3-belt"><span class="b3-bl">' + (e9 ? 'Tool belt' : '도구 띠') + '<br><small>' + (e9 ? 'keys 1–6' : '숫자 키 1~6') + '</small></span>' + o.map((k, j) => '<button class="b3-bs' + (H[k] ? '' : ' no') + (cur === k ? ' cur' : '') + '" data-b3belt="' + j + '" title="' + esc((j + 1) + ' · ' + L(TOOL[k].t)) + '" aria-label="' + esc((j + 1) + ' ' + L(TOOL[k].t)) + '"><b>' + (j + 1) + '</b><i>' + TOOL[k].ic + '</i></button>').join('') + '</div>'
      + '<div class="sm b3-belth">' + esc(UI.pick ? (e9 ? 'Now tap the slot to put ' + L(TOOL[UI.pick].t) + ' in (1–6 · Esc to stop)' : jo(L(TOOL[UI.pick].t), '을', '를') + ' 놓을 칸을 눌러요 (1~6 · 그만 Esc)') : (e9 ? 'Drag a tool card onto a slot, or press “To slot” and then a slot. The keys follow this order.' : '도구 카드를 칸에 끌어다 놓거나, 「띠에 놓기」를 누르고 칸을 눌러요. 숫자 키도 이 차례예요.')) + '</div></div>'; }
  function paneTool(parts) { const e9 = en(), T = TL(), ty = A.typh && A.typh();
    let h = '<div class="b3-pane" data-pane="tool" role="tabpanel"><div class="grp" style="margin-top:2px" data-b3grp="tools">' + (e9 ? 'Tools' : '도구') + '</div><div class="b3-cards">' + (T ? TOOL_ORDER.map(k => toolCard(k, parts)).join('') : '') + '</div>';
    const tyc = ty ? [['rope', '🧵', T2('끈', 'Rope'), ty.rope, T2('묶음', '')], ['sand', '🧱', T2('모래주머니', 'Sandbags'), ty.sand, T2('개', '')]].filter(q => q[3] > 0).map(q => '<div class="st" data-b3="ty:' + q[0] + '"><b class="n">' + q[1] + '</b><span style="flex:1"><b>' + esc(L(q[2])) + ' ×' + q[3] + '</b><br><small>' + esc(e9 ? 'For typhoon jobs (from the community centre)' : '태풍 준비 부탁에 써요(행정복지센터에서 받음)') + '</small></span></div>').join('') : '';
    h += '<div class="grp" data-b3grp="gear">' + (e9 ? 'Gear (works by itself once you have it)' : '장비 (가지고 있으면 저절로 써요)') + '</div>' + (parts.gear || tyc ? '<div class="b3-cards">' + (parts.gear || '') + tyc + '</div>' : '<div class="b3-none">' + esc(e9 ? 'No gear yet. Skill level rewards (🎁) bring gloves, boots and more.' : '아직 장비가 없어요. 솜씨 레벨 보상(🎁)으로 목장갑·장화 같은 것을 받아요.') + '</div>');
    return h + belt() + '</div>'; }
  function paneWear(parts) { const e9 = en(), deco = sorted(bagKeys().filter(e => tabOfE(e) === 'wear'));
    return '<div class="b3-pane" data-pane="wear" role="tabpanel"><div data-rwbag="1"></div>' + (parts.wear || '<div class="b3-none">' + esc(e9 ? 'No clothes yet. Skill level rewards (🎁) bring hats, neckerchiefs and colours.' : '아직 옷이 없어요. 솜씨 레벨 보상(🎁)으로 모자·목수건·색을 받아요.') + '</div>')
      + '<div class="grp" data-b3grp="deco">' + (e9 ? 'Yard decorations' : '마당 장식') + '</div>' + (deco.length ? '<div class="b3-grid" data-grid="deco" data-min="1">' + deco.map(itemSlot).join('') + '</div>' : '<div class="b3-none">' + esc(e9 ? 'Things you buy at shops or get as rewards go here. Put them in your yard.' : '가게에서 산 것·보상으로 받은 것이 여기에 와요. 우리 집 마당에 놓아요.') + '</div>') + '</div>'; }
  function paneCol(parts, c) { const e9 = en(), st = sorted(bagKeys().filter(e => tabOfE(e) === 'col'));
    let h = '<div class="b3-pane" data-pane="col" role="tabpanel"><div class="grp" style="margin-top:2px" data-b3grp="stamp">' + (e9 ? 'Stamps' : '도장') + '</div>' + (st.length ? '<div class="b3-grid" data-grid="stamp" data-min="1">' + st.map(e => slot(e, e, itemName(e, e9), (A.bag()[e] | 0) > 1 ? A.bag()[e] | 0 : 0)).join('') + '</div>' : '<div class="b3-none">' + esc(e9 ? 'No stamps yet — the summit, the lighthouse and the stepping stones have one.' : '아직 도장이 없어요. 산꼭대기·등대·징검다리에 도장이 있어요.') + '</div>');
    if (parts.badge && parts.badge.length) h += '<div class="grp" data-b3grp="badge">' + (e9 ? 'Badges' : '배지') + '</div><div class="b3-grid" data-grid="badge" data-min="1">' + parts.badge.map(q => slot(q.id, '🏅', q.t.replace(/^\S+\s/, ''), 0)).join('') + '</div>';
    h += (parts.col || '') + (c.entCol || '');   /* ENTER-3 이웃 집·가게 모음(도운 집 n/전체 · 엽서 14 · town_enter.js colHtml) */
    if (parts.recipe && parts.recipe.length) h += '<div class="grp" data-b3grp="recipe">' + (e9 ? 'Recipes you got' : '받은 요리법') + '</div><div class="b3-rc">' + parts.recipe.map(q => '<div class="st" data-b3="' + esc(q.id) + '"><b class="n">' + q.ic + '</b><span style="flex:1"><b>' + esc(q.t) + '</b><br><small>' + esc(q.use) + '</small></span></div>').join('') + '</div>';
    return h + '<div class="row" style="justify-content:flex-start;margin-top:12px">' + (c.dexBtn ? '<button class="sub" data-a="dex">📖 ' + (e9 ? 'Open the codex' : '도감 바로 가기') + '</button>' : '') + '</div></div>'; }

  // ───────── 인형 칸 · 효과 ─────────
  function eqNow() { const r = R(), w = r ? r.wearNow() : {}, T = TL(), cur = T ? T.api.info().cur : null, e9 = en();
    return { head: w.hat ? { ic: w.hat.ic, t: w.hat.t } : null, neck: w.scarf ? { ic: '🧣', t: w.scarf.t, c: w.scarf.c } : null, back: w.bag ? { ic: '🎒', t: w.bag.t, c: w.bag.c } : { ic: '🎒', t: e9 ? 'Backpack (original colour)' : '가방(원래 색)', c: 0xe45c46 }, hand: cur ? { ic: TOOL[cur].ic, t: L(TOOL[cur].t) } : null, foot: w.boots ? { ic: w.boots.ic, t: w.boots.t } : null, sig: w.sig || '' }; }
  function aside(c) { const e9 = en(), q = eqNow(), r = R(), E = r ? r.effects() : [], fx = A.fx ? A.fx() : '';
    const eq = EQ.map(([k, ic0, lab, side, pos]) => { const v = q[k]; return '<button class="b3-eq ' + side + ' p' + pos + (v ? '' : ' no') + '" data-b3eq="' + k + '" title="' + esc(L(lab) + ': ' + (v ? v.t : (e9 ? 'empty' : '비어 있음'))) + '" aria-label="' + esc(L(lab) + ': ' + (v ? v.t : (e9 ? 'empty' : '비어 있음'))) + '"><i>' + (v ? v.ic : ic0) + '</i><small>' + esc(L(lab)) + '</small>' + (v && v.c != null ? '<em style="background:' + hex6(v.c) + '"></em>' : '') + '</button>'; }).join('');
    const LI = (fx ? [{ ic: '😋', t: fx }] : []).concat(E).map(x => '<li><i>' + x.ic + '</i><span>' + esc(x.t) + '</span></li>'), li = LI.length > 5 ? LI.slice(0, 4).join('') + '</ul><details class="b3-more"><summary>' + (e9 ? LI.length - 4 + ' more' : '그 밖에 ' + (LI.length - 4) + '개') + '</summary><ul>' + LI.slice(4).join('') : LI.join('');   /* 먹은 힘(시간이 정해진 것) 먼저 · 다섯 줄 넘으면 접기 */
    return '<aside class="b3-me"><div class="b3-doll"><canvas class="b3-cv" width="416" height="554" aria-label="' + (e9 ? 'My character' : '내 캐릭터') + '"></canvas>' + eq + '<small>' + (e9 ? 'Me' : '나') + '</small></div>'
      + '<div class="b3-fx" data-b3fx="1"><div class="b3-fxh">' + (e9 ? 'Working for you now' : '지금 켜진 효과') + '</div>' + (li ? '<ul>' + li + '</ul>' + (LI.length > 5 ? '</details>' : '') : '<div class="sm">' + esc(e9 ? 'Nothing yet. Gear from skill rewards shows up here.' : '아직 없어요. 솜씨 보상으로 장비를 받으면 여기에 보여요.') + '</div>') + '</div>'
      + (c.info ? '<div class="sm b3-info">' + c.info + '</div>' : '') + '</aside>'; }

  // ───────── 창 짓기 ─────────
  function html(c) { if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'b3-css'; styleEl.textContent = CSS; document.head.appendChild(styleEl); }
    CTX = c || {}; S(); if (!CTX.re) { SHOW.clear(); UI.pick = null; UI.snip = false; UI.sel = CTX.sel || null; } else if (CTX.sel) UI.sel = CTX.sel;
    UI.tab = CTX.tab || (CTX.re ? UI.tab : PREF.tab) || 'item'; if (!TABS.some(t => t[0] === UI.tab)) UI.tab = 'item';
    if (UI.sel && !(A.bag()[UI.sel] > 0) && !(R() && R().info(UI.sel))) UI.sel = null;
    const r = R(), parts = r ? r.bagParts() : { wear: '', gear: '', col: '', badge: [], recipe: [], ups: {}, ids: [] }, e9 = en();
    const ids = ownedIds(), nw = {}; for (const id of ids) if (!S().seen[id]) nw[tabOfId(id)] = 1;
    const cnt = { item: bagKeys().filter(e => tabOfE(e) === 'item').length };
    const tabs = '<div class="b3-tabs" role="tablist">' + TABS.map(([k, ic, t]) => '<button class="b3-t' + (UI.tab === k ? ' on' : '') + '" data-b3t="' + k + '" role="tab" aria-selected="' + (UI.tab === k) + '"><i>' + ic + '</i>' + esc(L(t)) + (cnt[k] ? ' <s>' + cnt[k] + '</s>' : '') + (nw[k] ? '<span class="b3-dot b3-tdot"></span>' : '') + '</button>').join('') + '</div>';
    const card = '<aside class="b3-card" aria-live="polite"><div class="b3-ph">' + esc(e9 ? 'Tap a square to see it big — what it is for, where you got it, and buttons.' : '칸을 누르면 여기에 크게 보여요. 쓸 곳, 어디서 났는지, 단추가 나와요.') + '</div></aside>';
    return '<div class="b3" data-b3tab="' + UI.tab + '">' + (CTX.coach || '') + '<div class="b3-main">' + aside(CTX) + '<section class="b3-body">' + tabs + '<div class="b3-split"><div class="b3-panes">' + paneItem(CTX) + paneTool(parts) + paneWear(parts) + paneCol(parts, CTX) + '</div>' + card + '</div></section></div></div>'; }
  /* openP 뒤: 수첩 줄 이름표 · 새 점 · 빈 칸 채우기 · 지금 탭 본 것으로 · 고른 칸 다시 · 인형 그리기 · 끌기 */
  function bind(P9) { P = P9; const nb = P9.querySelector('.nb-tabs'); if (nb && !nb.querySelector('.b3-nbl')) nb.insertAdjacentHTML('afterbegin', '<small class="b3-nbl">📒 ' + (en() ? 'Notebook' : '수첩') + '</small>');
    dots(P9); showTab(UI.tab, false); if (UI.sel) select(UI.sel, true); dollPaint(P9.querySelector('.b3-cv'));
    P9.addEventListener('pointerdown', dragDown); }
  function dots(root) { for (const el of root.querySelectorAll('[data-b3]')) { if (el.querySelector(':scope > .b3-dot')) continue; if (String(el.dataset.b3).split(' ').some(isNew)) el.insertAdjacentHTML('beforeend', '<span class="b3-dot"></span>'); } }
  function fill(grid) { if (!grid || !grid.offsetParent) return; for (const x of grid.querySelectorAll('.b3s.e')) x.remove(); const tr = getComputedStyle(grid).gridTemplateColumns, cols = Math.max(1, tr && tr !== 'none' ? tr.split(' ').length : 6), n = grid.querySelectorAll('.b3s').length, rows = Math.max(Math.ceil(n / cols), +grid.dataset.min || 1);
    let h = ''; for (let i = n; i < rows * cols; i++) h += '<div class="b3s e" aria-hidden="true"></div>'; if (h) grid.insertAdjacentHTML('beforeend', h); }
  function showTab(t, user) { if (!P || !TABS.some(q => q[0] === t)) return; const was = UI.tab; UI.tab = t; const root = P.querySelector('.b3'); if (root) root.dataset.b3tab = t;
    for (const b of P.querySelectorAll('[data-b3t]')) { const on = b.dataset.b3t === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }
    const pane = P.querySelector('[data-pane="' + t + '"]'); if (pane) { for (const g of pane.querySelectorAll('.b3-grid')) fill(g); let ch = false; for (const el of pane.querySelectorAll('[data-b3]')) for (const id of String(el.dataset.b3).split(' ')) if (!S().seen[id]) { S().seen[id] = 1; SHOW.add(id); ch = true; } if (ch) A.GAME.mark(); }
    const tb = P.querySelector('[data-b3t="' + t + '"] .b3-tdot'); if (tb) tb.remove();
    if (UI.sel && tabOfId(UI.sel) !== t) cardClear(); if (UI.pick && t !== 'tool') { UI.pick = null; pickSync(); }
    if (user) { PREF.tab = t; savePref(); if (was !== t) snd('tab'); } log('tab ' + t); }
  function regrid() { if (!P) return; const pane = P.querySelector('[data-pane="item"]'); if (!pane) return; const bar = pane.querySelector('.b3-bar'), grid = pane.querySelector('[data-grid="item"]'); if (bar) bar.outerHTML = itemBar(); if (grid) { grid.innerHTML = itemGrid(); dots(grid); fill(grid); } if (UI.sel) { const c = P.querySelector('.b3s[data-b3s="' + cssq(UI.sel) + '"]'); if (c) c.classList.add('sel'); } snd('tab'); }
  const cssq = s => String(s).replace(/["\\]/g, '\\$&');

  // ───────── 크게 보기 카드 ─────────
  function cardClear() { UI.sel = null; UI.snip = false; if (!P) return; const c = P.querySelector('.b3-card'); if (c) c.innerHTML = '<div class="b3-ph">' + esc(en() ? 'Tap a square to see it big — what it is for, where you got it, and buttons.' : '칸을 누르면 여기에 크게 보여요. 쓸 곳, 어디서 났는지, 단추가 나와요.') + '</div>'; for (const x of P.querySelectorAll('.b3s.sel')) x.classList.remove('sel'); }
  function fromTag(e) { const o = S().o[e]; if (!o) return ''; const w = A.where(o[0], o[1]) || {}, e9 = en(); return '<button class="b3-from" data-b3a="from" aria-expanded="' + !!UI.snip + '" title="' + esc(e9 ? 'Show on the map' : '지도에서 보기') + '">' + (w.ic || '📍') + ' ' + esc((w.nm || '') + ' · ' + (e9 ? 'day ' + o[2] : o[2] + '일째')) + '</button>'; }
  function select(id, quiet) { if (!P || !id) return; const card = P.querySelector('.b3-card'); if (!card) return; const e9 = en(), isBag = !!ITEMS[id] || (A.bag()[id] > 0 && !id.includes(':'));
    if (UI.sel !== id) UI.snip = false; UI.sel = id; for (const x of P.querySelectorAll('.b3s')) x.classList.toggle('sel', x.dataset.b3s === id);
    let h = '';
    if (isBag) { const n = A.bag()[id] | 0, k = kindOf(id), acts = (CTX.acts ? CTX.acts(id) : '') + (CTX.sellOk && CTX.sellOk(id) ? '<button class="sub" data-b3a="sell">🛒 ' + (e9 ? 'Sell' : '팔기') + '</button>' : '') + (CTX.yardOk && CTX.yardOk(id) ? '<button class="sub" data-b3a="yard">🏡 ' + (e9 ? 'Put in yard' : '마당에 놓기') + '</button>' : '');
      h = '<div class="b3-ch"><b class="b3-big">' + id + '</b><div><b class="b3-nm">' + esc(itemName(id, e9)) + '</b> <i>×' + n + '</i><br><small class="sm">' + esc(L(CATN[k] || CATN.food)) + '</small><br>' + fromTag(id) + '</div></div>'
        + '<canvas class="b3-snip" width="300" height="170" style="display:' + (UI.snip ? 'block' : 'none') + '"></canvas>' + (acts ? '<div class="b3-acts">' + acts + '</div>' : '') + (k === 'stamp' ? '<div class="b3-use1">' + esc(e9 ? 'A stamp for something you did. It stays in your collection.' : '해낸 일의 도장이에요. 모은 것에 늘 남아요.') + '</div>' : (A.useBox ? A.useBox() : '')); }
    else { const it = R() && R().info(id); if (!it) { cardClear(); return; } h = '<div class="b3-ch"><b class="b3-big">' + it.ic + '</b><div><b class="b3-nm">' + esc(it.t) + '</b></div></div><div class="b3-use1">' + esc(it.use) + '</div>'; }
    card.innerHTML = h; if (isBag && kindOf(id) !== 'stamp' && A.useShow) A.useShow(P, id); if (UI.snip) snipDraw(id);
    if (!quiet) { snd('sel'); const sp = P.querySelector('.b3-split'); if (sp && getComputedStyle(sp).gridTemplateColumns.split(' ').length < 2) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } log('sel ' + id); }
  function snipDraw(e) { const cv = P && P.querySelector('.b3-snip'), o = S().o[e]; if (!cv || !o) return; const me = A.me(), e9 = en(), far = Math.hypot(me.x - o[0], me.z - o[1]) > 40;
    A.mapSnip(cv, [{ x: o[0], z: o[1], label: e9 ? 'Got it here' : '여기서 얻었어요', main: true }].concat(far ? [{ x: me.x, z: me.z, label: e9 ? 'Me' : '나' }] : [])); }

  // ───────── 도구 띠 놓기(끌기 · 누르고 고르기) ─────────
  function pickSync() { if (!P) return; const w = P.querySelector('.b3-beltw'); if (w) { w.outerHTML = belt(); } for (const c of P.querySelectorAll('.b3-tc')) c.classList.toggle('picked', !!UI.pick && c.dataset.b3drag === UI.pick); }
  function placeTool(k, j) { const T = TL(); if (!T || !T.have[k]) return false; const ok = T.place(k, j); UI.pick = null; if (ok) { snd('tok'); log('place ' + k + ' ' + j); A.reopen('tool'); } return ok; }
  function beltTap(j) { const T = TL(); if (!T) return; const o = T.order(); if (UI.pick) { placeTool(UI.pick, j); return; } const k = o[j]; if (!T.have[k]) { snd('no'); return; } UI.pick = k; pickSync(); snd('sel'); }
  function dragDown(ev) { if (ev.pointerType !== 'mouse' || ev.button !== 0 || !P) return; const src = ev.target.closest('[data-b3drag],[data-b3belt]'); if (!src || ev.target.closest('button:not([data-b3belt])')) return; const T = TL(); if (!T) return;
    const k = src.dataset.b3drag || T.order()[+src.dataset.b3belt]; if (!k || !T.have[k]) return; DRAG.k = k; DRAG.from = src.dataset.b3belt != null ? +src.dataset.b3belt : -1; DRAG.x0 = ev.clientX; DRAG.y0 = ev.clientY; DRAG.on = false;
    addEventListener('pointermove', dragMove); addEventListener('pointerup', dragUp); addEventListener('pointercancel', dragUp); }
  function dragMove(ev) { if (!DRAG.k) return; if (!DRAG.on) { if (Math.hypot(ev.clientX - DRAG.x0, ev.clientY - DRAG.y0) < 6) return; DRAG.on = true; DRAG.el = document.createElement('div'); DRAG.el.className = 'b3-ghost'; DRAG.el.textContent = TOOL[DRAG.k].ic; document.body.appendChild(DRAG.el); const w = P && P.querySelector('.b3-beltw'); if (w) w.classList.add('pick'); }
    DRAG.el.style.transform = 'translate(' + (ev.clientX - 27) + 'px,' + (ev.clientY - 27) + 'px)'; const hit = document.elementFromPoint(ev.clientX, ev.clientY), s = hit && hit.closest && hit.closest('[data-b3belt]'); if (s !== DRAG.hov) { if (DRAG.hov) DRAG.hov.classList.remove('hov'); DRAG.hov = s; if (s) s.classList.add('hov'); } }
  function dragUp() { removeEventListener('pointermove', dragMove); removeEventListener('pointerup', dragUp); removeEventListener('pointercancel', dragUp); const k = DRAG.k, s = DRAG.hov, on = DRAG.on; if (DRAG.el) DRAG.el.remove(); DRAG.el = null; DRAG.k = null; DRAG.hov = null; DRAG.on = false;
    if (!on) return; DRAG.end = performance.now(); if (s && k) placeTool(k, +s.dataset.b3belt); else { const w = P && P.querySelector('.b3-beltw'); if (w && !UI.pick) w.classList.remove('pick'); } }

  // ───────── 누르기 · 키 ─────────
  function goEq(k) { const t = k === 'hand' || k === 'foot' ? 'tool' : 'wear'; showTab(t, true); const sel = { head: '[data-b3grp="hat"]', neck: '[data-b3grp="scarf"]', back: '[data-b3grp="bag"]', hand: '[data-b3grp="tools"]', foot: '[data-rwgear="boots"],[data-rwgear="hike"],[data-b3grp="gear"]' }[k], el = P && P.querySelector('[data-pane="' + t + '"] ' + sel.split(',').join(',[data-pane="' + t + '"] '));
    if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('b3-flash'); setTimeout(() => el.classList.remove('b3-flash'), 1300); } else if (A.say) A.say(en() ? '👕 Nothing to put there yet — skill level rewards (🎁) bring it' : '👕 아직 그 칸에 쓸 것이 없어요. 솜씨 레벨 보상(🎁)으로 받아요', 2.4); }
  function act(a, k) { if (a === 'hold') { const T = TL(); if (T && T.have[k]) { T.hold(k); A.reopen('tool'); } return; }
    if (a === 'put') { UI.pick = UI.pick === k ? null : k; pickSync(); snd('sel'); const w = P && P.querySelector('.b3-beltw'); if (w && UI.pick) w.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (a === 'from') { UI.snip = !UI.snip; const cv = P && P.querySelector('.b3-snip'), b = P && P.querySelector('.b3-from'); if (cv) cv.style.display = UI.snip ? 'block' : 'none'; if (b) b.setAttribute('aria-expanded', UI.snip); if (UI.snip) snipDraw(UI.sel); snd('sel'); return; }
    if (a === 'sell' && UI.sel) { A.sell(UI.sel); return; } if (a === 'yard' && UI.sel) { A.yard(UI.sel); return; } }
  function click(ev, P9) { if (P9 !== P) return false; const t = ev.target; if (!t || !t.closest) return false; if (performance.now() - DRAG.end < 300 && t.closest('[data-b3belt],[data-b3drag]')) return true;
    const tb = t.closest('[data-b3t]'); if (tb) { showTab(tb.dataset.b3t, true); return true; }
    const ch = t.closest('[data-b3f]'); if (ch) { PREF.flt = ch.dataset.b3f; savePref(); regrid(); return true; }
    const so = t.closest('[data-b3o]'); if (so) { PREF.sort = so.dataset.b3o; savePref(); regrid(); return true; }
    const eq = t.closest('[data-b3eq]'); if (eq) { goEq(eq.dataset.b3eq); return true; }
    const bs = t.closest('[data-b3belt]'); if (bs) { beltTap(+bs.dataset.b3belt); return true; }
    const a = t.closest('[data-b3a]'); if (a) { act(a.dataset.b3a, a.dataset.k); return true; }
    const s = t.closest('[data-b3s]'); if (s) { select(s.dataset.b3s); return true; }
    return false; }
  function key(ev) { if (!P || !P.isConnected) return false; const k = ev.code; if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return false;
    if (UI.pick) { if (k === 'Escape') { UI.pick = null; pickSync(); return true; } const d = /^(?:Digit|Numpad)([1-6])$/.exec(k); if (d) { placeTool(UI.pick, +d[1] - 1); return true; } }
    if (k === 'ArrowLeft' || k === 'ArrowRight') { const i = TABS.findIndex(q => q[0] === UI.tab), j = (i + (k === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length; showTab(TABS[j][0], true); const b = P.querySelector('[data-b3t="' + TABS[j][0] + '"]'); if (b && P.contains(document.activeElement)) b.focus({ preventScroll: true }); return true; }
    return false; }
  /* 작은 소리(삼각파 · 튀는 움직임 X): 톡 = 칸에 놓기 · 착 = 입기 · 탭·고르기 = 아주 작은 딸깍 */
  function snd(k) { const t = A.tone; if (!t) return; if (k === 'tok') { t(740, 0, 0.05, 'triangle', 0.06); t(990, 0.05, 0.05, 'triangle', 0.035); } else if (k === 'wear') { t(330, 0, 0.035, 'square', 0.025); t(660, 0.035, 0.07, 'triangle', 0.05); } else if (k === 'no') t(220, 0, 0.08, 'triangle', 0.04); else t(k === 'tab' ? 620 : 880, 0, 0.03, 'triangle', 0.025); }

  // ───────── 인형 그리기(지금 렌더러를 빌려 한 번 · 새 WebGL 컨텍스트 X · 매 프레임 0) ─────────
  //   장면에서 내 캐릭터로 가는 줄만 남기고 잠깐 숨김(빛은 그대로 = 새 셰이더 X · 그림자 굽기 안 함) → 작은 그림판(sRGB 저장)에 그림 → 화소를 2D 캔버스로 · 어두우면(밤) 밝기만 맞춤
  //   모습 서명(모자·목수건·가방 색·전등 · 내 모습 색 · 밤/낮 · 실내)이 같으면 캐시 그림
  function dollSig() { const r = R(), w = r ? r.wearNow() : {}; return [w.sig || '', A.lookSig ? A.lookSig() : '', A.night && A.night() ? 'n' : 'd'].join('#'); }
  function dollPaint(cv) { if (!cv) return; const g = cv.getContext('2d'); if (!g) return; const sig = dollSig();
    if (DOLL.img && DOLL.sig === sig && DOLL.img.width === cv.width && DOLL.img.height === cv.height) { g.putImageData(DOLL.img, 0, 0); return; }
    const t0 = performance.now(); let ok = false; try { ok = dollRender(cv, g); } catch (e) { console.warn('[가방] 인형', e); ok = false; }
    DOLL.ms = +(performance.now() - t0).toFixed(1); DOLL.ok = ok; if (ok) { DOLL.n++; DOLL.sig = sig; DOLL.img = g.getImageData(0, 0, cv.width, cv.height); } else dollFlat(cv, g); log('doll ' + (ok ? 'ok ' : 'flat ') + DOLL.ms + 'ms'); }
  function dollRender(cv, g) { const R9 = A.renderer(), K = A.kid(), T3 = A.T3; if (!R9 || !K || !K.rig || !T3 || !K.rig.parent) return false; let sc = K.rig; while (sc.parent) sc = sc.parent; if (!sc.isScene) return false;
    const W = cv.width, H = cv.height, keep = [], chain = []; for (let o = K.rig; o && o !== sc; o = o.parent) chain.push(o);
    for (const node of chain) { const par = node.parent; for (const c of par.children) { if (c.isLight) continue; keep.push([c, c.visible]); c.visible = c === node; } }
    K.rig.traverse(o => { if (o.userData && o.userData.beam) { keep.push([o, o.visible]); o.visible = false; } });
    if (!RT || RT.width !== W || RT.height !== H) { if (RT) RT.dispose(); RT = new T3.WebGLRenderTarget(W, H); RT.texture.colorSpace = T3.SRGBColorSpace; BUF = new Uint8Array(W * H * 4); }
    if (!CAM) CAM = new T3.PerspectiveCamera(30, W / H, 0.05, 40); CAM.aspect = W / H; CAM.updateProjectionMatrix();
    const pg = K.rig.parent; pg.updateWorldMatrix(true, false); const m = pg.matrixWorld, a = 0.42, d = 3.3; CAM.position.set(Math.sin(a) * d, 0.8, Math.cos(a) * d).applyMatrix4(m); const tgt = new T3.Vector3(0, 0.64, 0).applyMatrix4(m); CAM.up.set(0, 1, 0); CAM.lookAt(tgt); CAM.updateMatrixWorld();
    const prevRT = R9.getRenderTarget(), bg = sc.background, cc = R9.getClearColor(new T3.Color()), ca = R9.getClearAlpha(), smU = R9.shadowMap.needsUpdate, smA = R9.shadowMap.autoUpdate;
    try { sc.background = null; R9.shadowMap.needsUpdate = false; R9.shadowMap.autoUpdate = false; R9.setClearColor(0x000000, 0); R9.setRenderTarget(RT); R9.clear(); R9.render(sc, CAM); R9.readRenderTargetPixels(RT, 0, 0, W, H, BUF); }
    finally { R9.setRenderTarget(prevRT); sc.background = bg; R9.setClearColor(cc, ca); R9.shadowMap.needsUpdate = smU; R9.shadowMap.autoUpdate = smA; for (let i = keep.length - 1; i >= 0; i--) keep[i][0].visible = keep[i][1]; }
    let sum = 0, cnt = 0; for (let i = 0; i < BUF.length; i += 16) if (BUF[i + 3] > 200) { sum += BUF[i] * 0.2126 + BUF[i + 1] * 0.7152 + BUF[i + 2] * 0.0722; cnt++; } if (cnt < 40) return false;
    const f = Math.max(1, Math.min(2.4, 128 / Math.max(1, sum / cnt))), img = g.createImageData(W, H), D = img.data;   /* 밤처럼 어두우면 밝게만(낮 그대로) */
    for (let y = 0; y < H; y++) { const sr = (H - 1 - y) * W * 4, dr = y * W * 4; for (let x = 0; x < W * 4; x += 4) { D[dr + x] = Math.min(255, BUF[sr + x] * f); D[dr + x + 1] = Math.min(255, BUF[sr + x + 1] * f); D[dr + x + 2] = Math.min(255, BUF[sr + x + 2] * f); D[dr + x + 3] = BUF[sr + x + 3]; } }
    g.clearRect(0, 0, W, H); g.putImageData(img, 0, 0); return true; }
  /* 그리기를 못 하면(그래픽 막힘) — 평평한 아이 그림(모자 색 · 가방 색) */
  function dollFlat(cv, g) { const W = cv.width, H = cv.height, q = eqNow(), s = W / 208; g.clearRect(0, 0, W, H); g.save(); g.scale(s, s); g.fillStyle = '#f1c9a5'; g.beginPath(); g.arc(104, 92, 34, 0, 7); g.fill(); g.fillStyle = q.back && q.back.c != null ? hex6(q.back.c) : '#e45c46'; g.fillRect(70, 126, 68, 74); g.fillStyle = '#3f6fb6'; g.fillRect(80, 196, 20, 44); g.fillRect(108, 196, 20, 44);
    if (q.head) { g.font = '58px system-ui,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(q.head.ic, 104, 66); } else { g.fillStyle = '#f2c230'; g.beginPath(); g.arc(104, 82, 36, Math.PI, 0); g.fill(); } g.restore(); }   /* 쓴 모자는 그 그림으로(입히면 바뀜) */

  function dispose() { dead = true; if (RT) RT.dispose(); RT = null; if (styleEl) styleEl.remove(); styleEl = null; if (DRAG.el) DRAG.el.remove(); removeEventListener('pointermove', dragMove); removeEventListener('pointerup', dragUp); removeEventListener('pointercancel', dragUp); }
  const API = { state: () => JSON.parse(JSON.stringify(S())), ui: () => ({ ...UI, pref: { ...PREF } }), tab: t => showTab(t, true), sel: id => select(id), ids: () => ownedIds(), tabOf: id => tabOfId(id), doll: () => ({ ...DOLL, img: !!DOLL.img }), dbg: () => LOG.slice(), pick: k => act('put', k), place: (k, j) => placeTool(k, j), seen: id => !!S().seen[id] };
  return { init: () => { S(); }, got, html, bind, click, key, snd, isOpen: () => !!(P && P.isConnected), dispose, api: API };
}
