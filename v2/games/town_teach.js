// 🔒 선생님 칸 + 교사 화면(TEACH-1 · 10-31 '2주 믿게 만들기' 셋째 · 비판 보고서 기준 8 · docs/systems/town_teacher.md)
//   선생님 칸 = 반 진행을 갈라 놓을 수 있는 단추를 한곳에(장 바로 열기 · 다시 세는 날로 넘기기 · 날씨·계절 바꾸기 · 이 기기 학급 기록) — 들어올 때 선생님 비밀번호(lobby teacherPin · sm.t)
//   교사 화면(반 표) = 번호 · 지금 장 · 오늘 한 일 · 남긴 결과물 · 마지막 접속 — 한 줄 = 판 요약(town_tsum.js)
//     자료 셋: ① 이 기기 판(같은 반 번호 판 + 번호 없는 칸) ② 붙여 넣기(기록 복사하기 JSON 여러 개 · 판 JSON) ③ 서버(반 코드 + 교사 열쇠 → /class · 배포 전이면 안내만)
//   매 프레임 일 0(창을 열 때만 셈) · 이름 X(번호만) · 교사 열쇠는 이 탭 메모리에만(잠그면 지움)
import { CHAPTERS } from './town_story.js?v=30';
import { tsum, tsumDays } from './town_tsum.js?v=2';
import { pickLabel, dayKey } from './town_rec.js?v=18';
import { cloudTeach, cloudOn } from './town_cloud.js?v=4';

const CSS = `.twn-p[data-k=tch]{--rib:#2f4f7a}.twn-p[data-k=tch] .bx{max-height:96vh}
.tch-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 6px}
.twn-p .tch-bar button{min-height:32px;padding:3px 10px;font-size:13px;border-width:2px;box-shadow:0 2px 0 var(--ink)}
.twn-p .tch-bar button.on{background:#fff1c9;color:var(--ink);text-shadow:none}
.twn-p table.tch-t{width:100%;table-layout:fixed;margin-top:2px;font-size:13px}
.twn-p table.tch-t th,.twn-p table.tch-t td{padding:1px 8px;line-height:18px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-bottom:1px solid var(--line)}
.twn-p table.tch-t th{font-size:12px;line-height:20px}.twn-p table.tch-t td.n{font-weight:900;text-align:right}
.twn-p table.tch-t tr.r{cursor:pointer}.twn-p table.tch-t tr.r:hover td{background:#fff6dc}
.twn-p table.tch-t .mu{color:var(--mut);font-weight:600}.twn-p table.tch-t .wn{color:#b3261e;font-weight:800}
.twn-p table.tch-t tr.dt td{white-space:normal;background:#fffaf0;line-height:1.45;padding:6px 10px}
.twn-p .tch-in{font:inherit;font-size:15px;border:2px solid var(--ink);border-radius:9px;padding:4px 8px;width:10em;background:#fff;color:var(--ink)}
.twn-p .tch-key{-webkit-text-security:disc}.twn-p .tch-paste{width:100%;height:96px;font:12px monospace;box-sizing:border-box;border:2px solid var(--line);border-radius:9px}
.twn-p .tch-msg{min-height:18px;font-size:13px;font-weight:800;color:#b3261e}
@media (max-height:720px){.twn-p[data-k=tch] .bx>h3:first-child{padding-top:6px;padding-bottom:6px}.twn-p table.tch-t td{line-height:16px}.twn-p table.tch-t th{line-height:17px}.twn-p .tch-bar{margin-bottom:3px}.twn-p .tch-bar button{min-height:28px;padding:2px 9px}}`;   /* 크롬북 1366×768 = 주소창 빼면 창 높이 650~690 → 25줄이 한 화면에 */
const addCss = () => { if (document.getElementById('tch-css')) return; const st = document.createElement('style'); st.id = 'tch-css'; st.textContent = CSS; document.head.appendChild(st); };
const escRx = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const L2 = (p, e) => (Array.isArray(p) ? p[e ? 1 : 0] : String(p ?? ''));

// 붙여 넣은 글 → JSON 덩어리들(한 덩어리 · 배열 · 줄줄이 이어 붙인 것 · 앞뒤 다른 글이 섞여도)
export function parseBlobs(t) {
  const out = []; t = String(t || '');
  try { const j = JSON.parse(t); for (const x of [].concat(j)) out.push(x); return out; } catch (e) { /* 여러 덩어리 */ }
  let depth = 0, st = -1, inS = false, bs = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (inS) { if (bs) bs = false; else if (c === '\\') bs = true; else if (c === '"') inS = false; continue; }
    if (c === '"') { if (depth) inS = true; continue; }
    if (c === '{') { if (!depth) st = i; depth++; } else if (c === '}' && depth) { depth--; if (!depth && st >= 0) { try { out.push(JSON.parse(t.slice(st, i + 1))); } catch (e) { /* 깨진 덩어리 */ } st = -1; } } }
  return out;
}
// 덩어리 하나 → 표 한 줄 { n, lab, at, s } | null
export function rowOf(o, i, en) {
  if (!o || typeof o !== 'object') return null;
  const lab = n => (n ? String(n) : (en ? 'Pasted ' : '붙인 것 ') + (i + 1));
  if (o.kind === 'sm-town-rec') { const n = o.n >= 1 && o.n <= 40 ? o.n | 0 : 0, s = o.sum && typeof o.sum === 'object' && o.sum.v ? o.sum : Object.assign({ v: 1, at: 0, day: 0, cur: null, pz: null, due: null, nd: 0, done: [] }, tsumDays(o.days)); return { n, lab: lab(n), at: +s.at || 0, s, town: String(o.town || '') }; }
  if (Number.isFinite(o.day) && o.day >= 1 && (o.story || o.rec)) { const s = tsum(o); return s ? { n: 0, lab: lab(0), at: s.at, s } : null; }
  return null;
}
// 같은 번호가 여럿이면 마지막 저장이 새것 하나만 · 번호 차례 → 번호 없는 것
export function mergeRows(L) { const by = new Map(), rest = []; for (const r of L) { if (!r) continue; if (!r.n) { rest.push(r); continue; } const o = by.get(r.n); if (!o || (r.at || 0) >= (o.at || 0)) by.set(r.n, r); } return [...by.values()].sort((a, b) => a.n - b.n).concat(rest); }

// A: GAME · id(마을) · key(이 탭 저장 칸) · en() · esc · openP(h, wide, kind) · closeP() · say(t, s) · pin() → 선생님 비밀번호 · tchOn() · tchOff() · cls() → 반 코드 · chapters(back) · due() · dueSkip() · wx() · rec()
export function createTeach(A) {
  const en = () => A.en(), esc = A.esc;
  let src = 'dev', tkey = '', msg = '', paste = '', claim = 0, open9 = -1, code = '', pN = 0;   /* pN = 붙여 넣어 읽은 덩어리 수(읽었으면 글 상자를 접어 표가 한 화면에) */
  const RS = { dev: [], paste: [], cloud: [] };   /* 자료마다 줄(띠를 오가도 섞이지 않게) */
  const rowsGet = () => RS[src] || [], rowsSet = L => { RS[src] = L; };
  const T = (ko, e9) => (en() ? e9 : ko);
  async function open() { if (window.SM_PROMO) return false; if (!A.tchOn()) { const ok = await A.pin(); if (!ok) return false; } home(); return true; }
  // 선생님 칸(첫 화면) — 단추 넷 + 잠그기
  function home() { if (!A.tchOn()) return open(); addCss(); const e = en(), due = A.due && A.due();
    const card = (t, d, a, b, cls9) => '<div class="st"><span style="flex:1"><b>' + t + '</b><br><small>' + d + '</small></span><button class="' + (cls9 || 'sub') + '" data-a="' + a + '">' + b + '</button></div>';
    const P = A.openP('<h3>🔒 ' + T('선생님 칸', 'Teacher section') + '</h3><div class="sm">' + T('이 탭은 지금 선생님 모드예요. 다 쓰면 잠그고 아이에게 넘겨요.', 'This tab is in teacher mode. Lock it before handing it back to a pupil.') + '</div>'
      + '<div class="grp">' + T('우리 반 한눈에', 'Class at a glance') + '</div>' + card(T('반 표', 'Class table'), T('번호마다 지금 장, 오늘 한 일, 남긴 결과물, 마지막 접속을 한 화면에 봐요.', 'For each number: current chapter, today, saved work, last seen.'), 'board', '📋 ' + T('반 표 열기', 'Open'), 'pri')
      + '<div class="grp">' + T('이야기 = 차시', 'Stories as lessons') + '</div>' + card(T('장 바로 열기', 'Open a chapter now'), T('막 잠금과 상관없이 그 장을 열고 시작하는 곳으로 옮겨요. 이 기기 판만 바뀌어요.', 'Opens any chapter regardless of act locks and moves you near its start. Only this device’s game changes.'), 'ch', '▶ ' + T('장 고르기', 'Pick'))
      + (due ? card(T('다시 세는 날로 넘기기', 'Skip to the count-again day'), T('며칠 뒤 다시 보는 의뢰를 오늘로 당겨요.', 'Brings the wait-a-few-days request to today.'), 'due', '⏩ ' + T('넘기기', 'Skip')) : '')
      + '<div class="grp">' + T('날씨와 계절', 'Weather and season') + '</div>' + card(T('날씨·계절 바꾸기', 'Change weather or season'), T('수업에서 비, 눈, 계절을 보여 줄 때 써요. 아이 화면에는 달력대로·예보대로 돌아가기만 있어요.', 'For showing rain, snow or a season in class. Pupils only see “back to calendar / forecast”.'), 'wx', '🌦 ' + T('날씨 창', 'Weather'))
      + '<div class="grp">' + T('이 기기 기록', 'This device') + '</div>' + card(T('학급 기록(이 기기)', 'Class record (this device)'), T('최근 14일 단계, 힌트, 고른 것, 한 줄 카드예요. 복사해서 반 표에 붙여 넣을 수 있어요.', 'Last 14 days of steps, hints, choices and line cards. Copy it into the class table.'), 'rec', '📊 ' + T('열기', 'Open'))
      + '<div class="row"><button class="sub" data-a="lock">🔒 ' + T('잠그고 닫기', 'Lock and close') + '</button><button class="sub" data-a="x">' + T('닫기', 'Close') + '</button></div>', false, 'tch');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'x') return A.closeP(); if (a === 'lock') return lock();
      if (!A.tchOn()) { A.closeP(); return open(); }   /* 다른 탭에서 잠갔으면 다시 묻기 */
      if (a === 'board') return board(); if (a === 'ch') return A.chapters(() => home()); if (a === 'due') { A.closeP(); A.dueSkip(); A.say(T('⏩ 다시 세는 날로 넘겼어요', '⏩ Skipped to the count-again day'), 2.4); return; }
      if (a === 'wx') { A.closeP(); A.wx(); return; } if (a === 'rec') { A.rec(); return; } };
    return P; }
  function lock() { tkey = ''; RS.dev = []; RS.paste = []; RS.cloud = []; src = 'dev'; paste = ''; pN = 0; claim = 0; A.tchOff(); A.closeP(); A.say(T('🔒 선생님 칸을 잠갔어요', '🔒 Teacher section locked'), 2.4); }
  // ① 이 기기 판: 같은 반(반 코드) 번호 판 + 번호 없는 칸(칸 1~3) — 이 탭 판은 지금 상태 그대로
  function devRows() { const c = (A.cls && A.cls()) || '', rx = new RegExp('^sm-town-game:' + escRx(A.id) + '(?:@(?:([a-z0-9]{4,8}):)?s(\\d{2}))?(?:#([23]))?$'), out = [];
    let keys = []; try { for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); } catch (e) { keys = []; }
    for (const k of keys) { const m = k && rx.exec(k); if (!m) continue; if (m[2] && (m[1] || '') !== c) continue;
      let S = null; if (k === A.key) S = A.GAME.S; else { try { S = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { S = null; } }
      const s = tsum(S); if (!s) continue; const n = m[2] ? +m[2] : 0; out.push({ n, lab: n ? String(n) : T('칸 ', 'Slot ') + (m[3] || 1), at: k === A.key ? Date.now() : s.at, s, me: k === A.key }); }
    return mergeRows(out); }
  // ③ 서버(반 코드 + 교사 열쇠)
  async function pull(key, mk) { const c = code || (A.cls && A.cls()) || ''; if (!/^[a-z0-9]{4,8}$/.test(c)) { msg = T('반 코드(영문·숫자 4~8자)를 넣어요', 'Enter the class code (4–8 letters or digits)'); return board(); }
    if (!/^\S{6,32}$/.test(key)) { msg = T('교사 열쇠는 띄어쓰기 없이 6~32자예요', 'The teacher key is 6–32 characters, no spaces'); return board(); }
    msg = T('☁️ 받는 중…', '☁️ Loading…'); board(); const r = mk ? await cloudTeach('tclaim', c, { tkey: key }) : await cloudTeach('class', c, { tkey: key });
    if (mk && r.st === 200 && r.j && r.j.ok) { claim = 0; return pull(key, false); }
    if (r.st === 200 && r.j && r.j.ok && Array.isArray(r.j.L)) { tkey = key; code = c; msg = ''; RS.cloud = mergeRows(r.j.L.map(q => ({ n: q.n | 0, lab: String(q.n | 0), at: +q.at || 0, s: q.s || null }))); return board(); }
    if (r.st === 404 && r.j && r.j.nokey) { claim = 1; msg = T('이 반은 아직 교사 열쇠가 없어요. 아래에서 처음 정해요(아이에게 반 코드를 주기 전에).', 'This class has no teacher key yet. Set one below (before giving pupils the class code).'); return board(); }
    msg = r.st === 403 ? T('교사 열쇠가 달라요', 'Wrong teacher key') : r.st === 409 ? T('이 반은 이미 다른 교사 열쇠가 있어요', 'This class already has a different teacher key') : r.st === 423 ? T('잠깐 잠겼어요. 10분 뒤에 다시 해요', 'Locked for a moment. Try again in 10 minutes') : r.st === 404 ? T('서버에 아직 교사 표가 없어요(배포 전). 이 기기 판이나 붙여 넣기로 봐요.', 'The server has no class table yet (not deployed). Use this device or paste.') : r.st === 0 ? T('서버에 닿지 못했어요. 인터넷이 끊겼거나, 서버에 교사 표가 아직 없어요(배포 전).', 'Could not reach the server: no internet, or the class table is not deployed yet.') : (r.j && r.j.m) || T('받지 못했어요', 'Could not load'); return board(); }
  // 칸 그리기
  const chOf = id => CHAPTERS.find(c => c.id === id);
  const chT = id => { const c = chOf(id); return c ? c.icon + ' ' + L2(c.t, en()) : id; };
  const ago = at => { if (!at) return '—'; const d = new Date(at), k = dayKey(d), hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), y = new Date(); y.setDate(y.getDate() - 1); return k === dayKey() ? T('오늘 ', 'today ') + hm : k === dayKey(y) ? T('어제 ', 'yesterday ') + hm : k.slice(5).replace('-', '/') + ' ' + hm; };
  function curCell(s) { if (!s) return '<span class="mu">—</span>'; const c = s.cur && chOf(s.cur[0]), nd = s.nd ? ' <span class="mu">' + T('끝낸 장 ', 'done ') + s.nd + '</span>' : '';
    if (s.cur && !c) return esc(s.cur[0]) + nd;
    if (c) return esc(chT(c.id)) + ' <b>' + Math.min(c.steps.length, (s.cur[1] | 0) + 1) + '/' + c.steps.length + '</b>' + nd;
    if (s.pz) return '<span class="mu">' + T('(쉼)', '(paused)') + '</span> ' + esc(chT(s.pz)) + nd;
    if (s.due) return '<span class="mu">' + T('(며칠 뒤)', '(waiting)') + '</span> ' + esc(chT(s.due)) + nd;
    if (s.nd) return '<span class="mu">' + T('다음 장 고르는 중', 'between chapters') + '</span>' + nd;
    return '<span class="mu">' + T('시작 전', 'not started') + '</span>'; }
  function todayParts(t) { const w = (t.help | 0) + (t.job | 0) + (t.play | 0), P = [];
    if (t.st) P.push(T('단계 ', 'steps ') + t.st); if (t.cd) P.push(T('장 끝 ', 'chapters ') + t.cd); if (t.q) P.push(T('문제 ', 'quiz ') + t.qok + '/' + t.q); if (w) P.push(T('일 ', 'work ') + w); if (t.tmap) P.push(T('보물 지도 ', 'maps ') + t.tmap); if (t.show) P.push(T('쇼 ', 'shows ') + t.show); if (t.rank) P.push(T('승급 ', 'rank ') + t.rank); if (t.road) P.push(T('길 위 ', 'road ') + t.road); return P; }
  function todayCell(s) { if (!s || !s.td) return '<span class="mu">—</span>'; const P = todayParts(s.td), old = s.rd !== dayKey(); const body = P.length ? esc(P.join(', ')) : T('기록 없음', 'nothing'), h3 = s.td.h3 ? ' <span class="wn">' + T('막힘 ', 'stuck ') + s.td.h3 + '</span>' : '';
    return old ? '<span class="mu">' + esc(s.rd.slice(5).replace('-', '/')) + ' ' + body + '</span>' + h3 : body + h3; }
  function outText(o) { if (!o) return ''; const c = chOf(o.c), st = c && c.steps.find(q => q.id === o.s); if (o.t) return '“' + o.t + '”';
    const pk = o.p && o.p.length ? o.p.map(k => pickLabel(c, st, k, en())).join(', ') : ''; if (o.w) return (pk ? pk + ' — ' : '') + T('까닭: ', 'because: ') + o.w.join(', '); if (o.l) return (pk ? pk + ' — ' : '') + T('불편해질 사람: ', 'inconvenienced: ') + o.l; return T('잰 값: ', 'measured: ') + o.f; }
  function outCell(s) { if (!s || !s.out || !s.out.length) return '<span class="mu">—</span>'; return esc(outText(s.out[0])) + (s.no > 1 ? ' <span class="mu">' + T('외 ', '+') + (s.no - 1) + '</span>' : ''); }
  function detail(r) { const s = r.s; if (!s) return T('요약이 없어요(아직 저장 전이거나 예전 판).', 'No summary yet.'); const D = [];
    if (s.out && s.out.length) D.push('<b>' + T('남긴 결과물', 'Saved work') + '</b><br>' + s.out.map(o => esc(chT(o.c)) + (o.d ? ' <span class="mu">' + esc(o.d.replace('-', '/')) + '</span>' : '') + ' — ' + esc(outText(o))).join('<br>'));
    if (s.td) D.push('<b>' + T('마지막 기록 날 ', 'Last recorded day ') + esc(s.rd.slice(5).replace('-', '/')) + '</b> ' + esc(todayParts(s.td).join(', ') || '—') + (s.td.tr ? ' · ' + T('틀린 수 ', 'wrong tries ') + s.td.tr : '') + (s.tcd && s.tcd.length ? '<br>' + T('그날 끝낸 장: ', 'Finished that day: ') + esc(s.tcd.map(chT).join(', ')) : ''));
    if (s.done && s.done.length) D.push('<b>' + T('끝낸 장 ', 'Finished chapters ') + s.nd + '</b> ' + esc(s.done.slice(-12).map(chT).join(', ')) + (s.nd > 12 ? ' …' : ''));
    D.push('<span class="mu">' + T('게임 ', 'Game day ') + (s.day || '?') + T('일째', '') + (r.me ? T(' · 지금 이 탭', ' · this tab') : '') + '</span>'); return D.join('<br>'); }
  function tableHtml(R) {
    let h = '<table class="tch-t"><colgroup><col style="width:56px"><col style="width:27%"><col style="width:25%"><col><col style="width:108px"></colgroup><thead><tr><th>' + T('번호', 'No.') + '</th><th>' + T('지금 장', 'Chapter now') + '</th><th>' + T('오늘 한 일', 'Today') + '</th><th>' + T('남긴 결과물', 'Saved work') + '</th><th>' + T('마지막 접속', 'Last seen') + '</th></tr></thead><tbody>';
    R.forEach((r, i) => { h += '<tr class="r" data-r="' + i + '"><td class="n">' + esc(r.lab) + (r.me ? '*' : '') + '</td><td>' + curCell(r.s) + '</td><td>' + todayCell(r.s) + '</td><td>' + outCell(r.s) + '</td><td>' + esc(ago(r.at)) + '</td></tr>';
      if (open9 === i) h += '<tr class="dt"><td colspan="5">' + detail(r) + '</td></tr>'; });
    if (!R.length) h += '<tr><td colspan="5" class="mu" style="text-align:center;padding:10px">' + (src === 'paste' ? T('붙여 넣은 기록이 아직 없어요', 'Nothing pasted yet') : src === 'cloud' ? T('반 코드와 교사 열쇠를 넣고 받아요', 'Enter the class code and teacher key') : T('이 기기에 판이 없어요', 'No games on this device')) + '</td></tr>';
    return h + '</tbody></table>'; }
  function footHtml(R) { const nums = R.filter(r => r.n).map(r => r.n), mx = nums.length ? Math.max(...nums) : 0, miss = []; for (let n = 1; n <= mx; n++) if (!nums.includes(n)) miss.push(n);
    const td = R.filter(r => r.s && r.s.rd === dayKey()).length, st = R.filter(r => r.s && r.s.td && r.s.td.h3 && r.s.rd === dayKey()).length;
    return '<div class="sm" style="margin-top:6px">' + T('줄 ', 'Rows ') + R.length + ', ' + T('오늘 기록 ', 'recorded today ') + td + (st ? ', ' + T('오늘 막힘 있는 번호 ', 'stuck today ') + st : '') + (miss.length ? ', ' + T('안 보이는 번호 ', 'missing numbers ') + miss.join(' ') : '') + '. ' + T('줄을 누르면 자세히 봐요.', 'Tap a row for details.') + '</div>'; }
  // 교사 화면(반 표)
  function board(s9) { if (!A.tchOn()) return open(); addCss(); if (s9) { src = s9; msg = ''; open9 = -1; if (s9 === 'dev') RS.dev = devRows(); }
    if (src === 'dev' && !s9 && !RS.dev.length) RS.dev = devRows(); const rows = rowsGet();
    const c = code || (A.cls && A.cls()) || '', cOn = cloudOn(), B = (k, t) => '<button class="sub' + (src === k ? ' on' : '') + '" data-s="' + k + '">' + t + '</button>';
    let h = '<h3>📋 ' + T('우리 반 한눈에', 'Class at a glance') + '</h3><div class="tch-bar"><button class="sub" data-a="home">◀ ' + T('선생님 칸', 'Teacher') + '</button>' + B('dev', T('이 기기 판', 'This device')) + B('paste', T('붙여 넣기', 'Paste')) + (cOn ? B('cloud', '☁️ ' + T('서버', 'Server')) : '') + '<span class="sm">' + T('오늘 ', 'Today ') + esc(dayKey().slice(5).replace('-', '/')) + (src === 'dev' ? ' · ' + (c ? T('반 ', 'class ') + esc(c) : T('반 코드 없음', 'no class code')) : src === 'cloud' && tkey ? ' · ' + T('반 ', 'class ') + esc(code) : src === 'paste' && pN && rows.length ? ' · ' + T('붙여 넣은 기록 ', 'pasted ') + pN + T('개', '') : '') + '</span>' + (src === 'paste' && pN && rows.length ? '<button class="sub" data-a="pedit">' + T('다시 붙여 넣기', 'Paste again') + '</button>' : '') + '</div>';   /* 붙여 넣은 뒤 = 한 띠에(25줄이 한 화면에) */
    if (src === 'paste' && !(pN && rows.length)) h += '<div class="sm">' + T('기기마다 학급 기록의 「복사하기」로 받은 글을 여러 개 한꺼번에 붙여 넣어요(패들렛에 모은 글을 통째로 복사해도 돼요).', 'Paste several “Copy record” texts at once (a whole Padlet column is fine).') + '</div><textarea class="tch-paste" placeholder="{&quot;kind&quot;:&quot;sm-town-rec&quot;, …}">' + esc(paste) + '</textarea><div class="tch-bar"><button class="pri" data-a="parse">' + T('표로 보기', 'Show table') + '</button><button class="sub" data-a="pclr">' + T('지우기', 'Clear') + '</button></div>';
    if (src === 'cloud' && (!tkey || claim)) h += '<div class="tch-bar"><span class="sm">' + T('반 코드', 'Class code') + '</span><input class="tch-in" data-i="code" maxlength="8" autocomplete="off" value="' + esc(c) + '"><span class="sm">' + (claim ? T('새 교사 열쇠(6자 넘게)', 'New teacher key (6+)') : T('교사 열쇠', 'Teacher key')) + '</span><input class="tch-in tch-key" data-i="key" maxlength="32" autocomplete="off" spellcheck="false">' + (claim ? '<input class="tch-in tch-key" data-i="key2" maxlength="32" autocomplete="off" spellcheck="false" placeholder="' + T('한 번 더', 'again') + '"><button class="pri" data-a="claim">' + T('처음 정하기', 'Set key') + '</button>' : '<button class="pri" data-a="pull">' + T('받기', 'Load') + '</button>') + '</div>';
    h += (msg ? '<div class="tch-msg">' + esc(msg) + '</div>' : '') + tableHtml(rows) + footHtml(rows);
    const P = A.openP(h, true, 'tch');
    P.onclick = ev => { { const ta = P.querySelector('.tch-paste'); if (ta) paste = ta.value; }   /* 다시 그리기 전에 붙여 넣던 글을 남김 */
      const b = ev.target.closest('button'); if (!b) { const tr = ev.target.closest('tr.r'); if (tr) { const i = +tr.dataset.r; open9 = open9 === i ? -1 : i; const y = P.querySelector('.bx'), t9 = y ? y.scrollTop : 0; board(); const y1 = document.querySelector('.twn-p .bx'); if (y1) y1.scrollTop = t9; } return; }
      if (!A.tchOn()) { A.closeP(); return open(); }
      if (b.dataset.s) return board(b.dataset.s); const a = b.dataset.a;
      if (a === 'home') return home();
      if (a === 'parse') { const L = parseBlobs(paste).map((o, i) => rowOf(o, i, en())), ok9 = L.filter(Boolean); RS.paste = mergeRows(ok9); pN = ok9.length; open9 = -1; msg = !ok9.length ? T('읽을 수 있는 기록이 없어요. 「복사하기」로 받은 글인지 봐요', 'Nothing readable. Is it from “Copy record”?') : ok9.length < L.length ? T('덩어리 ', 'Skipped ') + (L.length - ok9.length) + T('개는 기록이 아니라 뺐어요', ' that were not records') : ''; return board(); }
      if (a === 'pclr') { paste = ''; RS.paste = []; msg = ''; pN = 0; return board(); } if (a === 'pedit') { pN = 0; return board(); }
      const iv = k => ((P.querySelector('[data-i="' + k + '"]') || {}).value || '').trim();
      if (a === 'pull' || a === 'claim') { const c9 = iv('code').toLowerCase(); if (c9) code = c9; const k1 = iv('key'); if (a === 'claim' && k1 !== iv('key2')) { msg = T('두 번 넣은 열쇠가 달라요', 'The two keys differ'); return board(); } pull(k1, a === 'claim'); } };
    return P; }
  return { open, home, board, lock, devRows, get rows() { return rowsGet(); }, get src() { return src; }, set paste(v) { paste = String(v || ''); } };
}
