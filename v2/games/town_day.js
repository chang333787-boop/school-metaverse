// ⏰ 하루 한 바퀴(DAY-2 · 사용자 10-25 '돌아다니다가 하루가 가는 것 같아 · 하루가 모자란 기분이 들면 좋겠어 · 성취가 뭐가 있는지 모르겠어 · 다음 날에는 이거 해야지가 없어')
//   ① 오늘 시간표 한 줄(.twn-day · 왼쪽 가방 밑 · 할 일 줄 바로 위): 지금 뒤 오늘 안의 때 셋(휴대폰 = 하나)
//      때 = 썰물(섬 바닷길·갯벌) · 영화 상영 · 정자 모임(맑은 날 18:00) · 맑은 밤 별(19:00) · 일꾼 점심 · 장터·일터 마침 · 가게·창구 닫음
//      누르면 오늘 때 전부(시간 차례 · 지난 것은 흐리게 · 🧭 = 빨간 선) · 숫자는 시각만(점수·% X)
//   ② 하루 마무리 창(town.js dayRecap이 부름): '오늘 바뀐 것'(새 도장·새 도감·고칠 곳·마당·새 내 최고·솜씨 레벨 — 그림 줄 · 없으면 줄 X)
//      + '내일 기다리는 것' 셋(내가 한 일에서 이어지는 것 먼저 → 세상 일) · 누르면 빨간 선(잠들기 전이면 내일 아침에)
//   ③ 다음 날 아침: 같은 자리에 '어제 기다린 것' 한 번(누르면 그 셋 + 🧭 · 누르거나 10:00이 지나면 시간표로)
//   지킴: 판타지 X · 실명 X · 지어낸 사실 X(이미 있는 엔진이 실제로 하는 것만) · 빈 칭찬 X
//   렉: 매 프레임 일 0 · 1초 칸 sec(글이 바뀔 때만 DOM) · 오늘 때 목록 = 날·날씨가 바뀔 때만 다시 셈 · 하루 마무리 = 창 열 때 한 번
import { CROPS, plotState } from './town_farm.js?v=2';
import { lowsOf } from './town_shore.js?v=5';
import { SKILLS, SK_ORDER, levelOf } from './town_skill.js?v=5';
export const DAY_V = 1;
const T2 = (ko, en) => [ko, en];
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1); return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b); };   /* 받침 있으면 a(이·을·이에요) · 없으면 b(가·를·예요) */
const hm = m => { m = Math.round(m); return String(((m / 60) | 0) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const DEXI = { bug: '🐞', fish: '🐟', shore: '🦀', star: '⭐', tmap: '🗺', wild: '🦌' };
const CSS = `.twn-day{cursor:pointer;position:fixed;left:10px;top:132px;z-index:30;box-sizing:border-box;max-width:min(520px,calc(100vw - 20px));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#eef4fb;color:#1d3557;border:3px solid #2b2420;border-left:9px solid #1d3557;border-radius:12px;box-shadow:0 3px 0 #2b2420;padding:4px 11px;font:800 13px system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;transition:transform .07s}
.twn-day:active{transform:translateY(2px)}.twn-day.ydw{background:#fff3d6;color:#2b2420;border-left-color:#e0a020}body.small .twn-day{max-width:min(400px,48vw)}
.twn-p .dy-t{display:grid;grid-template-columns:52px 1fr auto;gap:6px 8px;align-items:center;margin:6px 0;font-size:15px}.twn-p .dy-t .tm{font:900 15px ui-monospace,Menlo,monospace}
.twn-p .dy-t .past{opacity:.42}.twn-p .dy-t .now{font-weight:900}.twn-p .dy-t button{min-height:40px;padding:4px 10px;font-size:14px}
.twn-p .dy-w{display:grid;gap:6px;margin:6px 0}.twn-p .dy-w button{min-height:44px;text-align:left;font-size:15px;line-height:1.35}.twn-p .dy-w button.on{outline:3px solid #ff5a36;outline-offset:1px}
.twn-p .dy-ch{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:20px;line-height:1.3}.twn-p .dy-ch small{font-size:13px;opacity:.8}`;

// 마을 쪽이 넘기는 것(A): GAME · lang() · esc · openP(h, wide, kind) · closeP() · panel() · on() · busy() · tasksOn() · touch() · say(t, s) · sfx(k)
//   restack()(왼쪽 줄 다시 쌓기) · route(p)(🧭 빨간 선 · p = { icon, name, door:[x, z], isle? })
//   자리: isle() 썰물섬 장소 | null · seenIsle() · shore() [x, z] | null · cinema() { name, door } | null · shows [{ s, e, t:[ko,en] }] · stall() [x, z] | null
//     shops() [{ name, h1, door }] · offices() [{ ic, name, h1, door }] · pav() [x, z] | null · star() [x, z] | null · mush() [x, z] | null
//     farm() { at, plots } | null · pots() [] · home() [x, z] | null · facDest(ln, door) · ladRows() [{ key, name, best }]
//   typh(d1) 태풍 판 한 줄 | null(TYPH-1 · 없어도 됨) · bagWait(d0, pre) · bagDue(d) · bagKey()(BAG-2 town_bag.js · 없어도 됨)
//   pathRow(d) 하루 마무리 '나의 길' 줄 [k, ic, 제목, 글] | null · pathWait() 내일 기다리는 표지판 { ic, s, t, p } | null(PATH-1 · 없어도 됨)
//   bunRow(d) '오늘 바뀐 것' 꾸러미로 바뀐 마을 줄 | null · bunWait(d0, pre) 내일 아침 바뀌는 곳 { ic, s, t, p } | null(BUNDLE-2 · 없어도 됨)
//   날: wx() 오늘 날씨 · fc(i) 예보(오늘 = 0) · auto() 예보대로 · jang(d) · season(d) · seaName(s) [ko, en]
export function createDay(A) {
  const en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const S = () => A.GAME.S, day = () => S().day | 0, now = () => S().min | 0, mark = () => A.GAME.mark();
  let el = null, css = null, txt = '', mode = '', LC = null, dead = false, pinT = 0, DBG = [];
  const log = t => { DBG.push(t); if (DBG.length > 30) DBG.shift(); };
  function ensure() { if (!css) { css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css); } if (!el) { el = document.createElement('div'); el.className = 'twn-day'; el.style.display = 'none'; el.onclick = e => { e.stopPropagation(); click(); }; document.body.appendChild(el); } }

  // ───────── ① 오늘 때 목록 ─────────
  //   하나 = { m(분), g(갈래 — 줄에선 갈래마다 하나), ic, s:[짧게], t:[길게], p(🧭 장소) | null }
  const plc = (icon, name, at) => (at ? { icon, name, door: [at[0], at[1]] } : null);
  function build(d) { const out = [], e = en(), w = A.wx(), put = (m, g, ic, s, t, p) => { if (m >= 0 && m < 1440) out.push({ m, g, ic, s, t: t || s, p: p || null }); };
    // 썰물: 섬에 가 본 뒤 = 섬 바닷길(KIDEYE-1과 같은 선) · 아니면 갯벌
    const isl = A.seenIsle() ? A.isle() : null, sh = A.shore(), LW = (isl || sh) ? lowsOf(d) : [];
    for (const [a, b] of LW) { if (isl) { const p = { ...isl, icon: '🏝' }; if (a > 360) put(a, 'tide', '🏝', T2('썰물섬 열림', 'Isle path opens'), T2('썰물섬 바닷길이 열려요', 'The sea path to Ebb-Tide Isle opens'), p); if (b < 1440) put(b, 'tide', '🌊', T2('썰물섬 닫힘', 'Isle path closes'), T2('바닷물이 차서 썰물섬 바닷길이 닫혀요', 'The sea comes in and the isle path closes'), p); }
      else { const p = plc('🦀', e ? 'mudflat' : '갯벌', sh); if (a > 360) put(a, 'tide', '🏖', T2('갯벌 드러남', 'Mudflat opens'), T2('물이 빠져 갯벌이 드러나요', 'The tide goes out and the mudflat appears'), p); if (b < 1440) put(b, 'tide', '🌊', T2('갯벌 물 참', 'Tide comes in'), T2('물이 들어와 갯벌이 잠겨요', 'The tide comes in over the mudflat'), p); } }
    // 영화 상영(영화관이 있는 마을 · 오늘 이미 봤으면 X)
    const cn = A.cinema(), cs = ((S().bldg || {}).cinema) || {};
    if (cn && cs.seen !== d) for (const q of A.shows || []) put(q.s, 'film', '🎬', T2('영화', 'Film'), T2('영화 「' + q.t[0] + '」 ' + hm(q.s) + '~' + hm(q.e), 'Film “' + q.t[1] + '” ' + hm(q.s) + '–' + hm(q.e)), plc('🎬', cn.name, cn.door));
    // 일꾼 하루(ROUTINE-1·2 · HOURS-1): 점심 12:00~13:00 · 19:00 일 마침(장터도)
    const st = A.stall(); put(720, 'lunch', '🍱', T2('일꾼 점심', 'Workers’ lunch'), T2('일꾼들이 점심을 먹어요. 13:00부터 다시 일해요', 'Workers eat lunch. Work starts again at 13:00'), null);
    if (st) put(480, 'stall', '🛒', T2('장터 열림', 'Market opens'), A.jang(d) ? T2('장날 장터가 열려요. 값이 더 좋아요', 'Market day — the market opens with better prices') : T2('장터가 열려요', 'The market opens'), plc('🛒', e ? 'market' : '장터', st));
    put(1140, 'work', '🌇', st ? T2('장터·일터 마침', 'Market and work end') : T2('일터 마침', 'Work ends'), st ? T2('장터와 일터가 일을 마쳐요. 같이 일하기는 그 전에', 'The market and workplaces close. Help out before then') : T2('일터가 일을 마쳐요. 같이 일하기는 그 전에', 'Workplaces close. Help out before then'), st ? plc('🛒', e ? 'market' : '장터', st) : null);
    // 맑은 날: 정자 모임 18:00 · 별 19:00
    if (w === 'clear') { const pv = A.pav(); if (pv) put(1080, 'pav', '🏮', T2('정자 모임', 'Pavilion chat'), T2('일을 마친 이웃들이 정자에 모여 이야기해요(20:00까지)', 'Neighbours meet at the pavilion to chat (until 20:00)'), plc('🏮', e ? 'pavilion' : '정자', pv));
      put(1140, 'star', '⭐', T2('별', 'Stars'), T2('맑은 밤이라 별이 잘 보여요', 'A clear night — good for stars'), plc('⭐', e ? 'summit' : '산꼭대기', A.star())); }
    // 가게(닫는 시각마다 한 줄 · 24시간 가게 X) · 창구(은행·우체국·행정복지센터)
    const G = new Map(); for (const q of A.shops()) { if (!(q.h1 < 24)) continue; const a = G.get(q.h1) || []; a.push(q); G.set(q.h1, a); }
    for (const [h, a] of G) { const nm = a.map(q => q.name), s9 = nm.length > 1 ? (e ? nm[0] + ' +' + (nm.length - 1) : nm[0] + ' 외 ' + (nm.length - 1) + '곳') : nm[0]; put(h * 60, 'shop' + h, '🏪', T2(s9 + ' 닫음', s9 + ' closes'), T2('가게 문 닫음: ' + nm.join(', '), 'Shops close: ' + nm.join(', ')), plc('🏪', a[0].name, a[0].door)); }
    for (const q of A.offices()) put(q.h1 * 60, 'off:' + q.name, q.ic, T2(q.name + ' 닫음', q.name + ' closes'), T2(q.name + ' 창구가 문을 닫아요', 'The ' + q.name + ' counter closes'), plc(q.ic, q.name, q.door));
    { const c = A.caseDue && A.caseDue(d); if (c) put(c.m, 'case', c.ic, c.s, c.t, c.p); }   /* CASE-1 사건 기한(마지막 날 18:00) */
    { const c = A.bagDue && A.bagDue(d); if (c) put(c.m, 'req', c.ic, c.s, c.t, c.p); }   /* BAG-2 이웃 부탁 마감(18:00) */
    out.sort((a, b) => a.m - b.m); return out; }
  function list() { const d = day(), k = d + ':' + A.wx() + ':' + (A.seenIsle() ? 1 : 0) + ':' + ((((S().bldg || {}).cinema) || {}).seen === d ? 1 : 0) + ':' + LANG0() + ':' + (A.caseKey ? A.caseKey() : '') + ':' + (A.bagKey ? A.bagKey() : ''); if (LC && LC.k === k) return LC.L; LC = { k, L: build(d) }; log('list ' + k + ' ' + LC.L.length); return LC.L; }
  const LANG0 = () => (en() ? 'en' : 'ko');
  const ahead = n => { const m = now(), seen = new Set(), o = []; for (const q of list()) { if (q.m <= m || seen.has(q.g)) continue; seen.add(q.g); o.push(q); if (o.length >= n) break; } return o; };
  function lineToday() { const L9 = ahead(A.touch() ? 1 : 3); if (!L9.length) return en() ? '⏰ No more times today — sleep starts a new day' : '⏰ 오늘 남은 때가 없어요. 자면 새 하루예요'; return '⏰ ' + L9.map(q => hm(q.m) + ' ' + L(q.s)).join(' · '); }
  function openToday() { const e = en(), m = now(), L9 = list(), FL = L9.filter(q => q.g === 'film'), done = new Set(); let i0 = 0;
    const rows = []; for (const q of L9) { if (q.g === 'film') { if (done.has('film')) continue; done.add('film'); const nx = FL.find(f => f.m > m) || FL[FL.length - 1];   /* 영화는 한 줄(다음 상영 자리 · 시각들은 그 줄 안에 · 지난 것 흐림) */
        rows.push({ m: nx.m, ic: '🎬', h: (e ? 'Films: ' : '영화 상영: ') + FL.map(f => '<span class="' + (f.m <= m ? 'past' : '') + '">' + hm(f.m) + '</span>').join(' '), p: nx.p, past: FL.every(f => f.m <= m), sub: L(nx.t) }); continue; }
      rows.push({ m: q.m, ic: q.ic, h: esc(L(q.t)), p: q.p, past: q.m <= m }); }
    rows.sort((a, b) => a.m - b.m); for (let i = 0; i < rows.length; i++) if (!rows[i].past) { i0 = i; break; }
    const P = [];
    const h = '<h3>⏰ ' + (e ? 'Today’s times' : '오늘 시간표') + '</h3><div class="sm">' + esc(e ? 'Now ' + hm(m) + '. The day ends when you sleep (or at midnight). Grey = already past.' : '지금 ' + hm(m) + '. 자거나 자정이 되면 하루가 끝나요. 흐린 줄은 지난 때예요.') + '</div>'
      + '<div class="dy-t">' + rows.map((r, i) => { const c = r.past ? 'past' : i === i0 ? 'now' : ''; if (r.p) P[i] = r.p; return '<span class="tm ' + c + '">' + hm(r.m) + '</span><span class="' + c + '">' + r.ic + ' ' + r.h + (r.sub && !r.past ? '<div class="sm">' + esc(e ? 'Next: ' + r.sub : '다음: ' + r.sub) + '</div>' : '') + '</span>' + (r.p && !r.past ? '<button class="sub" data-go="' + i + '">🧭</button>' : '<span></span>'); }).join('') + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const W = A.openP(h, false, 'dayt'); W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.go != null) { const p = P[+b.dataset.go]; A.closeP(); if (p) A.route(p); log('go ' + (p && p.name)); return; } if (b.dataset.a === 'x') A.closeP(); }; log('openToday ' + rows.length); return W; }

  // ───────── ② 하루 마무리 ─────────
  //   하루 처음 1초 = 솜씨 레벨·내 최고 자국(dsnap · prev = 어제 것) — 도장·도감·마당은 저장에 날짜가 있어 자국 X
  function snapNow() { const s = S(), sk = {}; for (const k of SK_ORDER) sk[k] = levelOf((s.skill || {})[k]).L; const bs = {}; try { for (const r of A.ladRows() || []) bs[r.key] = r.best || ''; } catch (x) { /* 기록 없음 */ } return { d: day(), sk, bs }; }
  function snap() { const s = S(), o = s.dsnap; if (o && o.d === day()) return; const n = snapNow(); if (o && o.d === day() - 1) { delete o.prev; n.prev = o; } s.dsnap = n; mark(); }
  function changes(d) { const s = S(), e = en(), out = [], dOf = v => (typeof v === 'number' ? v : v && v.d);
    const st = Object.entries(((s.pass || {}).v) || {}).filter(([, v]) => v === d).map(([k]) => String(k).split('@')[0].replace(/^xp_/, ''));
    if (st.length) out.push(['st', '🛂', e ? 'New stamps' : '새 여권 도장', esc(st.slice(0, 4).join(', ')) + (st.length > 4 ? ' …' : '')]);
    const dx = Object.entries(s.dex || {}).filter(([, v]) => dOf(v) === d).map(([k]) => { const i = k.indexOf(':'); if (i < 0) return k.length <= 4 ? k : '📖'; const p = k.slice(0, i), r = k.slice(i + 1); return p === 'ate' ? r : DEXI[p] || '📖'; });
    if (dx.length) out.push(['dex', '📖', e ? 'New in the codex' : '새 도감 칸', '<span class="dy-ch">' + dx.slice(0, 12).join(' ') + (dx.length > 12 ? ' …' : '') + '</span>']);
    const fx = s.fix && s.fix.cur; if (fx && fx.rep === d) out.push(['fix', '🔧', e ? 'Reported a repair' : '고칠 곳 신고', esc((fx.cell ? fx.cell + (e ? ' — ' : ' 칸 ') : '') + (e ? 'it gets fixed tomorrow morning' : '내일 아침에 고쳐요'))]);
    else if (fx && fx.rep && fx.rep === d - 1) out.push(['fix', '🔧', e ? 'Fixed' : '고쳐진 곳', esc((fx.cell ? fx.cell + (e ? ' — ' : ' 칸 ') : '') + (e ? 'the paving you reported was fixed' : '신고한 보도블록을 고쳤어요'))]);
    const yd = (s.deeds || []).filter(q => q && q.t === 'deco' && q.d === d && q.e).map(q => q.e); if (yd.length) out.push(['yard', '🏡', e ? 'Put in the yard' : '마당에 놓은 것', '<span class="dy-ch">' + [...new Set(yd)].join(' ') + '</span>']);
    const sn = s.dsnap && s.dsnap.d === d ? s.dsnap : s.dsnap && s.dsnap.prev && s.dsnap.prev.d === d ? s.dsnap.prev : null;
    if (sn) { const cur = snapNow(), up = SK_ORDER.filter(k => (cur.sk[k] | 0) > (sn.sk[k] | 0)).map(k => SKILLS[k].icon + ' ' + L(SKILLS[k].t) + ' ' + cur.sk[k]); if (up.length) out.push(['sk', '🌟', e ? 'Skill level up' : '솜씨 레벨', esc(up.join(', '))]);
      let rows = []; try { rows = A.ladRows() || []; } catch (x) { rows = []; } const nb = rows.filter(r => r.best && (sn.bs || {})[r.key] !== r.best).map(r => r.name); if (nb.length) out.push(['best', '🏅', e ? 'New personal best' : '새 내 최고', esc(nb.join(', '))]); }
    { const r = A.pathRow && A.pathRow(d); if (r) out.push(r); }   /* PATH-1 오늘 나의 길 걸음(town_path.js) */
    { const r = A.bunRow && A.bunRow(d); if (r) out.push(r); }   /* BUNDLE-2 꾸러미로 바뀐 마을(town_bundle2.js) */
    return out; }
  //   내일 기다리는 것: 내가 한 일 → 세상 일 · 셋까지 · pre = 잠들기 전(내일 = d + 1) · 아니면 이미 그 아침(자정 잠)
  function waits(T, pre) { const s = S(), e = en(), d0 = T.day | 0, d1 = d0 + 1, fi = pre ? 1 : 0, out = [], add = (k, ic, s9, t, p) => out.push({ k, ic, s: s9, t, p: p || null, mine: 0 });
    const rainT = A.wx() === 'rain';   /* 텃밭 자람 = 어제 물 줬거나 그날 비(farmGrow · town.js 하루 날씨) */
    const grow = P => !!(P && P.c && CROPS[P.c] && P.g < CROPS[P.c][2] && (P.w === d0 || rainT));   /* 잠들기 전에만 씀(아침이면 이미 자람) */
    const mine = (P) => !!(P && P.c && (P.w === d0 || P.d === d0));
    const crop = (L9, where, ic, at, nm) => { const M = L9.filter(mine); if (!M.length) return; const R = M.filter(P => pre ? grow(P) && P.g + 1 >= CROPS[P.c][2] : plotState(P, d1) === 'ripe'), C = (R[0] || M[0]).c, cn = CROPS[C] ? CROPS[C][e ? 1 : 0] : '';
      if (R.length) add('grow', C, T2(where[0] + ' 다 자람', where[1] + ' ripe'), T2(where[0] + ' ' + jo(cn, '이', '가') + ' 다 자라요. 거둘 수 있어요', 'The ' + cn.toLowerCase() + ' in the ' + where[1] + ' will be ripe — ready to pick'), plc(ic, nm, at));
      else if (M.some(P => pre ? grow(P) : true)) add('grow', '🌱', T2(where[0] + ' 자람', where[1] + ' grows'), T2('물 준 ' + where[0] + ' ' + jo(cn, '이', '가') + ' 하루 더 자라요', 'The ' + cn.toLowerCase() + ' you watered in the ' + where[1] + ' grows another day'), plc(ic, nm, at)); };
    const F = A.farm(); if (F) crop(F.plots, T2('텃밭', 'garden'), '🌱', F.at, e ? 'school garden' : '학교 텃밭');
    const hm9 = A.home(); if (hm9) crop(A.pots() || [], T2('화분', 'pot'), '🏠', hm9, e ? 'our house' : '우리 집');
    for (const q of (((s.bldg || {}).post || {}).box || [])) if (q && q.d === d0 && !q.ok) { add('post', '📦', T2('소포 닿음', 'Parcel arrives'), T2('보낸 소포가 ' + q.cell + ' 칸 ' + q.who + '께 닿아요. 가서 인사하면 고맙대요', 'Your parcel reaches ' + q.who + ' in ' + q.cell + '. Go and say hello'), plc('📦', q.who, [q.x, q.z])); break; }
    if (T.nb && T.nb.d === d0 && hm9 && A.giftOk(T.nb)) add('gift', '🎁', T2('답례', 'Thank-you gift'), T2('오늘 마음을 나눈 이웃이 우리 집 문 앞에 답례를 둬요', 'The neighbour you were kind to leaves a thank-you gift at our door'), plc('🏠', e ? 'our house' : '우리 집', hm9));
    { const f = (s.bldg || {}).factory; if (f && f.made === d0) { const to = A.facDest(f.ln, f.door || null), ln = f.ln === 'jelly' ? T2('젤리 케이크', 'jelly cake') : T2('감자', 'potato'); if (to) add('fac', '🚚', T2('공장 상자', 'Factory boxes'), T2('오늘 공장에서 만든 ' + ln[0] + ' 상자가 ' + to.name + '에 들어와요', 'The ' + ln[1] + ' boxes made at the factory today arrive at ' + to.name), plc('🚚', to.name, to.at)); } }
    { const q = s.fix && s.fix.cur; if (q && q.rep === d0) add('fix', '🔧', T2('고친 자리', 'Repair'), T2('신고한 ' + (q.cell ? q.cell + ' 칸 ' : '') + '보도블록이 고쳐져요', 'The paving you reported ' + (q.cell ? 'in ' + q.cell + ' ' : '') + 'gets fixed'), plc('🔧', q.cell || '', [q.x, q.z])); }
    { const q = A.bunWait && A.bunWait(d0, pre); if (q) add('bun2', q.ic, q.s, q.t, q.p); }   /* BUNDLE-2 오늘 채운 꾸러미 = 내일 아침 바뀌는 곳 */
    { const q = A.pathWait && A.pathWait(); if (q) add('path', q.ic, q.s, q.t, q.p); }   /* PATH-1 다음 표지판까지 얼마 안 남은 길(town_path.js) */
    { const c = A.caseWait && A.caseWait(d0, pre); if (c) add('case', c.ic, c.s, c.t, c.p); }   /* CASE-1 사건 수첩(town_case.js) — 기한·흙막이 */
    { const c = A.bagWait && A.bagWait(d0, pre); if (c) add(c.k, c.ic, c.s, c.t, c.p); }   /* BAG-2 도시락 챙기기(어제 못 닿은 체력 목표가 한 칸 위) */
    for (const o of out) o.mine = 1;
    // 세상 일
    const W = [];
    { const q = A.typh ? A.typh(d1) : null; if (q) W.push(q); }   /* TYPH-1 태풍 판(태풍까지 n일 · 내일 태풍 · 태풍 뒤 아침) = 세상 일 맨 앞 */
    if (A.stall() && A.jang(d1)) W.push({ k: 'jang', ic: '🎪', s: T2('장날', 'Market day'), t: T2('장날이에요. 장터 값이 더 좋아요', 'Market day — the market pays more'), p: plc('🛒', e ? 'market' : '장터', A.stall()) });
    const fw = A.auto() ? A.fc(fi) : null;
    if (fw === 'rain') W.push({ k: 'wx', ic: '🌧', s: T2('비 예보', 'Rain'), t: T2('비 예보예요. 숲 그늘에 버섯이 돋고 강물이 불어요', 'Rain is forecast. Mushrooms come up in the shady woods and the river rises'), p: plc('🍄', e ? 'mushrooms' : '버섯', A.mush()) });
    else if (fw === 'snow') W.push({ k: 'wx', ic: '❄️', s: T2('눈 예보', 'Snow'), t: T2('눈 예보예요. 눈사람을 만들 수 있어요', 'Snow is forecast — you can build a snowman'), p: null });
    const s0 = A.season(d0), s1 = A.season(d1); if (s0 && s1 && s0 !== s1) { const nm = A.seaName(s1); W.push({ k: 'season', ic: '📅', s: T2(nm[0] + ' 시작', nm[1] + ' starts'), t: T2('내일부터 ' + jo(nm[0], '이에요', '예요') + '. 심는 씨앗과 제철이 바뀌어요', nm[1] + ' starts tomorrow — new seeds and new things in season'), p: null }); }
    if (A.seenIsle() && A.isle()) { const L9 = lowsOf(d1); if (L9.length) { const [a, b] = L9[0]; W.push({ k: 'tide', ic: '🏝', s: T2('썰물섬 ' + hm(a), 'Isle ' + hm(a)), t: T2('썰물섬 바닷길 ' + hm(a) + '~' + hm(b), 'Ebb-Tide Isle path ' + hm(a) + '–' + hm(b)), p: { ...A.isle(), icon: '🏝' } }); } }
    if (fw === 'clear') W.push({ k: 'wx', ic: '☀️', s: T2('맑음', 'Clear'), t: T2('맑음 예보예요. 밤에 별이 잘 보여요', 'Clear skies forecast — good for stars at night'), p: plc('⭐', e ? 'summit' : '산꼭대기', A.star()) });
    for (const w of W) { if (out.length >= 3) break; out.push({ ...w, mine: 0 }); }
    return out.slice(0, 3); }
  // dayRecap이 부름: 창 글(바뀐 것 · 기다리는 것) — 그 자리에서 저장(다음 날 아침 줄)
  function recapHtml(T, pre) { const e = en(), d0 = T.day | 0, C = changes(d0), Wt = waits(T, pre); let h = '';
    if (C.length) h += '<div class="grp" data-dch="1">' + (e ? 'What changed today' : '오늘 바뀐 것') + '</div>' + C.map(([k, ic, t, v]) => '<div class="st" data-dc="' + k + '"><b class="n">' + ic + '</b><span><b>' + esc(t) + '</b> ' + v + '</span></div>').join('');
    const s = S(); s.dayw = { v: DAY_V, d: d0, L: Wt.map(w => ({ k: w.k, ic: w.ic, s: w.s, t: w.t, p: w.p, mine: w.mine })), pin: null, seen: 0, pd: 0 }; mark();
    if (Wt.length) h += '<div class="grp" data-dw="1">🌅 ' + (pre ? (e ? 'Waiting for tomorrow' : '내일 기다리는 것') : (e ? 'Waiting this morning' : '오늘 아침 기다리는 것')) + '</div><div class="dy-w">' + Wt.map((w, i) => '<button class="sub" data-dwi="' + i + '" data-tm="' + w.k + '">' + w.ic + ' ' + esc(L(w.t)) + (w.p ? ' 🧭' : '') + '</button>').join('') + '</div><div class="sm" data-dwm>' + esc(Wt.some(w => w.p) ? (pre ? (e ? 'Tap one to get a red line to it tomorrow morning.' : '하나를 누르면 내일 아침에 그곳까지 빨간 선을 그어 줘요.') : (e ? 'Tap one for a red line to it.' : '하나를 누르면 그곳까지 빨간 선을 그어 줘요.')) : '') + '</div>';
    log('recap ' + d0 + ' ch' + C.length + ' w' + Wt.map(w => w.k).join(',')); return h; }
  function recapBind(P9, pre) { P9.addEventListener('click', ev => { const b = ev.target.closest('button[data-dwi]'); if (!b) return; ev.stopPropagation(); const s = S(), i = +b.dataset.dwi, w = s.dayw && s.dayw.L[i]; if (!w || !w.p) return;
    if (pre) { s.dayw.pin = i; mark(); for (const x of P9.querySelectorAll('button[data-dwi]')) x.classList.toggle('on', x === b); const m = P9.querySelector('[data-dwm]'); if (m) m.textContent = en() ? '🧭 Tomorrow morning a red line will lead you to ' + w.p.name + '.' : '🧭 내일 아침에 ' + w.p.name + '까지 빨간 선을 그어 줄게요.'; A.sfx('tick'); log('pin ' + i); return; }
    s.dayw.pin = i; s.dayw.pd = 1; mark(); A.closeP(); A.route(w.p); log('go ' + i); }, true); }

  // ───────── ③ 아침 '어제 기다린 것' ─────────
  const ydw = () => { const w = S().dayw; return w && w.v === DAY_V && w.d === day() - 1 && Array.isArray(w.L) && w.L.length ? w : null; };
  function openYdw() { const w = ydw(); if (!w) return openToday(); const e = en(); w.seen = 1; mark();
    const h = '<h3>🌅 ' + (e ? 'What we waited for yesterday' : '어제 기다린 것') + '</h3><div class="sm">' + esc(e ? 'Last night you were looking forward to these. Go and see!' : '어젯밤 하루 마무리에서 기다리던 것이에요. 가서 봐요.') + '</div>'
      + '<div class="dy-w">' + w.L.map((q, i) => '<button class="sub" data-yi="' + i + '"' + (q.p ? '' : ' disabled') + '>' + q.ic + ' ' + esc(L(q.t)) + (q.p ? ' 🧭' : '') + '</button>').join('') + '</div><div class="row"><button class="sub" data-a="t">⏰ ' + (e ? 'Today’s times' : '오늘 시간표') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const W = A.openP(h, false, 'dayy'); W.onclick = ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.yi != null) { const q = w.L[+b.dataset.yi]; A.closeP(); if (q && q.p) A.route(q.p); log('ygo ' + b.dataset.yi); return; } if (b.dataset.a === 't') { A.closeP(); openToday(); return; } A.closeP(); }; sec(); log('openYdw'); return W; }
  function click() { if (A.panel()) return; if (mode === 'y') openYdw(); else openToday(); }

  // 1초 칸: 자국 · 아침 빨간 선(잠들기 전에 고른 것) · 줄 글(바뀔 때만 DOM)
  function sec() { if (dead) return; if (!A.on()) { show(''); return; } ensure(); snap();
    const w = ydw();
    if (w && w.pin != null && !w.pd && !A.busy() && !A.panel()) { if (!pinT) pinT = performance.now(); else if (performance.now() - pinT > 2500) { const q = w.L[w.pin]; w.pd = 1; mark(); pinT = 0; if (q && q.p) { A.route(q.p); A.say((en() ? '🌅 What you waited for: ' : '🌅 어제 기다린 것: ') + L(q.t), 3.6); log('pin go ' + w.pin); } } } else pinT = 0;
    if (!A.tasksOn() || A.busy()) { show(''); return; }
    if (w && !w.seen && now() < 600) { mode = 'y'; show((en() ? '🌅 Waited for: ' : '🌅 어제 기다린 것: ') + w.L.map(q => q.ic + ' ' + L(q.s)).join(' · '), 'y'); return; }
    mode = 't'; show(lineToday(), 't'); }
  function show(t, k) { if (!el) return; if (!t) { if (el.style.display !== 'none') { el.style.display = 'none'; txt = ''; A.restack(); } return; } const vis = el.style.display === 'none', ch = t !== txt; if (ch) { txt = t; el.textContent = t; } el.classList.toggle('ydw', k === 'y'); if (vis) el.style.display = ''; if (vis || ch) A.restack(); }
  function reset() { LC = null; txt = ''; }
  function dispose() { dead = true; if (el) { el.remove(); el = null; } if (css) { css.remove(); css = null; } }
  return { sec, reset, dispose, recapHtml, recapBind, openToday, openYdw, changes, waits, list, lineToday, get el() { return el; }, get text() { return txt; }, get mode() { return mode; }, dbg: () => DBG.slice() };
}
