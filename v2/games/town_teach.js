// 🔒 선생님 칸 + 교사 화면(TEACH-1 · 10-31 '2주 믿게 만들기' 셋째 · 비판 보고서 기준 8 · docs/systems/town_teacher.md)
//   선생님 칸 = 반 진행을 갈라 놓을 수 있는 단추를 한곳에(장 바로 열기 · 다시 세는 날로 넘기기 · 날씨·계절 바꾸기 · 이 기기 학급 기록) — 들어올 때 선생님 비밀번호(lobby teacherPin · sm.t)
//   교사 화면(반 표) = 번호 · 지금 장 · 오늘 한 일 · 남긴 결과물 · 마지막 접속 — 한 줄 = 판 요약(town_tsum.js)
//     자료 셋: ① 이 기기 판(같은 반 번호 판 + 번호 없는 칸) ② 붙여 넣기(기록 복사하기 JSON 여러 개 · 판 JSON) ③ 서버(반 코드 + 교사 열쇠 → /class · 배포 전이면 안내만)
//   매 프레임 일 0(창을 열 때만 셈) · 이름 X(번호만) · 교사 열쇠는 이 탭 메모리에만(잠그면 지움)
//   CLASS-MP(11-14) 「👥 우리 반 함께 보기 켬/끔」: ☁️ 서버 판(교사 열쇠로 받은 뒤) 띠 한 칸 → /tset(서버 반 칸) · 아이는 다음 /load·/save 답부터(이미 붙은 아이는 몇 분 안에 · 처음 = 켬)
//   PIN-1(11-14) 아이 번호 비밀번호 풀기: ☁️ 서버 판 번호 줄의 「풀기」 → 그 줄 아래에서 한 번 더 묻기 → /pinclear(판은 그대로 · 다음에 들어오는 아이가 새 비밀번호를 정함)
import { CHAPTERS } from './town_story.js?v=54';
import { tsum, tsumDays } from './town_tsum.js?v=2';
import { pickLabel, dayKey } from './town_rec.js?v=36';
import { cloudTeach, cloudOn } from './town_cloud.js?v=10';

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
.twn-p .tch-msg{min-height:18px;font-size:13px;font-weight:800;color:#b3261e}.twn-p .tch-msg.ok{color:#2c6b3f}
.twn-p table.tch-t td.k{padding:0 4px;text-align:center}
.twn-p table.tch-t button.pc{min-height:0;height:16px;padding:0 8px;margin:0;font-size:11px;line-height:12px;border-width:1px;border-radius:6px;box-shadow:none;text-shadow:none;vertical-align:middle;background:#fff;color:var(--ink)}.twn-p table.tch-t button.pc:hover{background:#fff1c9}.twn-p table.tch-t button.pc:active{transform:none;box-shadow:none}
.twn-p table.tch-t tr.dt.ask td{background:#fff1c9}.twn-p table.tch-t tr.dt button{min-height:30px;padding:2px 12px;margin-left:8px;font-size:13px;border-width:2px;box-shadow:0 2px 0 var(--ink)}
@media (max-height:720px){.twn-p[data-k=tch] .bx>h3:first-child{padding-top:6px;padding-bottom:6px}.twn-p table.tch-t td{line-height:16px}.twn-p table.tch-t th{line-height:17px}.twn-p .tch-bar{margin-bottom:3px}.twn-p .tch-bar button{min-height:28px;padding:2px 9px}.twn-p table.tch-t button.pc{height:14px;font-size:10px;line-height:10px}}`;   /* 크롬북 1366×768 = 주소창 빼면 창 높이 650~690 → 25줄이 한 화면에 */
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
  let src = 'dev', tkey = '', msg = '', paste = '', claim = 0, open9 = -1, code = '', pN = 0, ask9 = 0, okM = '', pcB = false, mpS = -1;   /* CLASS-MP mpS = 서버 반 칸 「우리 반 함께 보기」(1 켬 · 0 끔 · -1 모름) */   /* pN = 붙여 넣어 읽은 덩어리 수(읽었으면 글 상자를 접어 표가 한 화면에) · PIN-1 ask9 = 풀지 묻는 번호 · okM = 잘 됐다는 알림 글(빨강 X) · pcB = 푸는 중 */
  const RS = { dev: [], paste: [], cloud: [] };   /* 자료마다 줄(띠를 오가도 섞이지 않게) */
  const rowsGet = () => RS[src] || [], rowsSet = L => { RS[src] = L; };
  const T = (ko, e9) => (en() ? e9 : ko);
  async function open() { if (window.SM_PROMO) return false; if (!A.tchOn()) { const ok = await A.pin(); if (!ok) return false; } home(); return true; }
  // 선생님 칸(첫 화면) — 단추 넷 + 잠그기(닫으면 늘 잠김 · DEB-1)
  function home() { if (!A.tchOn()) return open(); addCss(); const e = en(), due = A.due && A.due();
    const card = (t, d, a, b, cls9) => '<div class="st"><span style="flex:1"><b>' + t + '</b><br><small>' + d + '</small></span><button class="' + (cls9 || 'sub') + '" data-a="' + a + '">' + b + '</button></div>';
    const P = A.openP('<h3>🔒 ' + T('선생님 칸', 'Teacher section') + '</h3><div class="sm">' + T('이 탭은 지금 선생님 모드예요. 다 쓰면 잠그고 아이에게 넘겨요.', 'This tab is in teacher mode. Lock it before handing it back to a pupil.') + '</div>'
      + '<div class="grp">' + T('우리 반 한눈에', 'Class at a glance') + '</div>' + card(T('반 표', 'Class table'), T('번호마다 지금 장, 오늘 한 일, 남긴 결과물, 마지막 접속을 한 화면에 봐요.', 'For each number: current chapter, today, saved work, last seen.'), 'board', '📋 ' + T('반 표 열기', 'Open'), 'pri')
      + '<div class="grp">' + T('이야기 = 차시', 'Stories as lessons') + '</div>' + card(T('장 바로 열기', 'Open a chapter now'), T('막 잠금과 상관없이 그 장을 열고 시작하는 곳으로 옮겨요. 이 기기 판만 바뀌어요.', 'Opens any chapter regardless of act locks and moves you near its start. Only this device’s game changes.'), 'ch', '▶ ' + T('장 고르기', 'Pick'))
      + (due ? card(T('다시 세는 날로 넘기기', 'Skip to the count-again day'), T('며칠 뒤 다시 보는 의뢰를 오늘로 당겨요.', 'Brings the wait-a-few-days request to today.'), 'due', '⏩ ' + T('넘기기', 'Skip')) : '')
      + '<div class="grp">' + T('날씨와 계절', 'Weather and season') + '</div>' + card(T('날씨·계절 바꾸기', 'Change weather or season'), T('수업에서 비, 눈, 계절을 보여 줄 때 써요. 아이 화면에는 달력대로·예보대로 돌아가기만 있어요.', 'For showing rain, snow or a season in class. Pupils only see “back to calendar / forecast”.'), 'wx', '🌦 ' + T('날씨 창', 'Weather'))
      + '<div class="grp">' + T('이 기기 기록', 'This device') + '</div>' + card(T('학급 기록(이 기기)', 'Class record (this device)'), T('최근 14일 단계, 힌트, 고른 것, 한 줄 카드예요. 복사해서 반 표에 붙여 넣을 수 있어요.', 'Last 14 days of steps, hints, choices and line cards. Copy it into the class table.'), 'rec', '📊 ' + T('열기', 'Open'))
      + card(T('화면 기록(이 기기)', 'Screen log (this device)'), T('이 기기에서 연 판마다 첫 화면까지 걸린 때, 끊김, 화면이 멈춘 일을 저절로 적어 둬요. 복사해서 채팅이나 패들렛에 붙여 넣어요.', 'Each time this device opens the game it notes load time, stutters and screen freezes. Copy it into a chat or Padlet.'), 'diag', '📋 ' + T('복사', 'Copy'))
      + '<div class="row"><button class="sub" data-a="lock">🔒 ' + T('잠그고 닫기', 'Lock and close') + '</button></div>', false, 'tch');   /* DEB-1(11-08): '닫기' 단추 X — 선생님 칸을 닫는 길(✕·Esc·바깥 포함 · town.js closeP)은 모두 잠금 · 잠그지 않고 닫아 그 탭만 순간이동 무제한·칩 다 열림으로 남던 것 */
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'x' || a === 'lock') return lock();
      if (!A.tchOn()) { A.closeP(); return open(); }   /* 다른 탭에서 잠갔으면 다시 묻기 */
      if (a === 'board') return board(); if (a === 'ch') return A.chapters(() => home()); if (a === 'due') { A.closeP(); A.dueSkip(); A.say(T('⏩ 다시 세는 날로 넘겼어요', '⏩ Skipped to the count-again day'), 2.4); return; }
      if (a === 'wx') { A.wx(); return; }   /* 창을 바꿈(닫기 X = 잠금 X) — 날씨 창의 계절 단추가 선생님 모드로 보이게 */ if (a === 'rec') { A.rec(); return; } if (a === 'diag') { copyDiag(b); return; } };
    return P; }
  /* PERF-G 화면 기록 복사(diag.js · SD.diagText — 이름·저장 내용 X) */
  function copyDiag(b) { const t = window.SD && window.SD.diagText ? window.SD.diagText() : ''; if (!t) { A.say(T('화면 기록이 아직 없어요', 'No screen log yet'), 2.4); return; }
    const ok = () => { b.textContent = '✓ ' + T('복사했어요', 'Copied'); A.say(T('📋 화면 기록을 복사했어요', '📋 Screen log copied'), 2.4); };
    const old = () => { try { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); const r = document.execCommand('copy'); ta.remove(); if (r) { ok(); return; } } catch (e) { /* 아래로 */ } A.say(T('복사하지 못했어요. 한 번 더 눌러 주세요', 'Could not copy. Press once more'), 2.4); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, old); else old(); }
  function lock() { tkey = ''; RS.dev = []; RS.paste = []; RS.cloud = []; src = 'dev'; paste = ''; pN = 0; claim = 0; ask9 = 0; okM = ''; mpS = -1; A.tchOff(); A.closeP(); A.say(T('🔒 선생님 칸을 잠갔어요', '🔒 Teacher section locked'), 2.4); }
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
    if (r.st === 200 && r.j && r.j.ok && Array.isArray(r.j.L)) { tkey = key; code = c; msg = ''; ask9 = 0; RS.cloud = mergeRows(r.j.L.map(q => ({ n: q.n | 0, lab: String(q.n | 0), at: +q.at || 0, s: q.s || null, np: q.np ? 1 : 0 }))); mpS = r.j.mp === 0 ? 0 : r.j.mp === 1 ? 1 : -1; return board(); }
    if (r.st === 404 && r.j && r.j.nokey) { claim = 1; msg = T('이 반은 아직 교사 열쇠가 없어요. 아래에서 처음 정해요(아이에게 반 코드를 주기 전에).', 'This class has no teacher key yet. Set one below (before giving pupils the class code).'); return board(); }
    msg = r.st === 403 ? T('교사 열쇠가 달라요', 'Wrong teacher key') : r.st === 409 ? T('이 반은 이미 다른 교사 열쇠가 있어요', 'This class already has a different teacher key') : r.st === 423 ? T('잠깐 잠겼어요. 10분 뒤에 다시 해요', 'Locked for a moment. Try again in 10 minutes') : r.st === 404 ? T('서버에 아직 교사 표가 없어요(배포 전). 이 기기 판이나 붙여 넣기로 봐요.', 'The server has no class table yet (not deployed). Use this device or paste.') : r.st === 0 ? T('서버에 닿지 못했어요. 인터넷이 끊겼거나, 서버에 교사 표가 아직 없어요(배포 전).', 'Could not reach the server: no internet, or the class table is not deployed yet.') : (r.j && r.j.m) || T('받지 못했어요', 'Could not load'); return board(); }
  // PIN-1 아이 번호 비밀번호 풀기(서버 판 · 교사 열쇠는 표를 받을 때 넣은 것 그대로 · 새로 저장 X) — 판은 그대로, 핀만 비움
  async function pinClear(n) { if (pcB || !tkey || !(n >= 1 && n <= 40)) return; pcB = true; ask9 = 0; msg = T('☁️ 푸는 중…', '☁️ Clearing…'); board(); const r = await cloudTeach('pinclear', code, { tkey }, 8000, n); pcB = false;
    if (!A.tchOn() || !tkey) return;   /* 기다리는 동안 잠갔으면 창을 다시 열지 않음 */
    if (r.st === 200 && r.j && r.j.ok) { const q = RS.cloud.find(x => x.n === n); if (q) q.np = 1;
      msg = okM = r.j.had ? T(n + '번 비밀번호를 풀었어요. 그 아이가 들어와서 새 비밀번호를 정하면 돼요', 'Cleared the PIN for No. ' + n + '. That pupil sets a new one the next time they come in') : T(n + '번은 서버에 판이 없어요. 그 아이가 들어와서 비밀번호를 정하면 돼요', 'No. ' + n + ' has no game on the server. That pupil sets a PIN when they come in'); return board(); }
    if (r.st === 403 || (r.st === 404 && r.j && r.j.nokey)) tkey = '';   /* 열쇠가 그사이 바뀜 = 다시 넣게 */
    msg = r.st === 403 ? T('교사 열쇠가 달라요. 열쇠를 다시 넣고 받아요', 'Wrong teacher key. Enter it again and load') : r.st === 423 ? T('잠깐 잠겼어요. 10분 뒤에 다시 해요', 'Locked for a moment. Try again in 10 minutes') : r.st === 404 && r.j && r.j.nokey ? T('이 반은 교사 열쇠가 없어요. 열쇠를 다시 넣고 받아요', 'This class has no teacher key. Enter it again and load') : r.st === 404 ? T('서버가 아직 준비 중이에요. 조금 뒤에 다시 해요', 'The server is not ready for this yet. Try again a little later') : r.st === 0 ? T('서버에 닿지 못했어요. 인터넷이 끊겼거나 서버가 아직 준비 중이에요. 조금 뒤에 다시 해요', 'Could not reach the server: no internet, or the server is not ready for this yet. Try again a little later') : (r.j && r.j.m) || T('풀지 못했어요. 다시 해요', 'Could not clear. Try again'); return board(); }   /* 배포 전 서버는 이 주소의 미리 묻기(OPTIONS)에 허락 머리 없이 404 → 브라우저에서는 끊김(0)과 같게 보임 → 한 줄에 둘 다 */
  // CLASS-MP 「우리 반 함께 보기」 켬·끔(교사 열쇠는 표를 받을 때 넣은 것 그대로)
  async function mpSet(v) { if (pcB || !tkey) return; pcB = true; msg = T('☁️ 바꾸는 중…', '☁️ Saving…'); board(); const r = await cloudTeach('tset', code, { tkey, mp: v ? 1 : 0 }); pcB = false; if (!A.tchOn() || !tkey) return;
    if (r.st === 200 && r.j && r.j.ok) { mpS = r.j.mp ? 1 : 0; msg = okM = mpS ? T('우리 반 함께 보기를 켰어요. 아이가 다음에 들어오거나 저장할 때부터 같은 반 친구가 보여요', 'Class view is on. Pupils see classmates from their next sign-in or save') : T('우리 반 함께 보기를 껐어요. 몇 분 안에, 늦어도 다음에 들어올 때부터 혼자 놀아요', 'Class view is off. Pupils play on their own within a few minutes, at the latest from their next sign-in'); return board(); }
    if (r.st === 403) tkey = ''; msg = r.st === 403 ? T('교사 열쇠가 달라요. 열쇠를 다시 넣고 받아요', 'Wrong teacher key. Enter it again and load') : r.st === 423 ? T('잠깐 잠겼어요. 10분 뒤에 다시 해요', 'Locked for a moment. Try again in 10 minutes') : r.st === 0 || r.st === 404 ? T('서버에 닿지 못했거나 서버가 아직 준비 중이에요. 조금 뒤에 다시 해요', 'Could not reach the server, or it is not ready yet. Try again a little later') : (r.j && r.j.m) || T('바꾸지 못했어요. 다시 해요', 'Could not change it. Try again'); return board(); }
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
  function tableHtml(R) { const pc = src === 'cloud' && !!tkey && !claim, nc = pc ? 6 : 5;   /* PIN-1: 서버 판(열쇠로 받은 뒤)에만 비밀번호 칸 */
    let h = '<table class="tch-t"><colgroup><col style="width:56px"><col style="width:27%"><col style="width:25%"><col><col style="width:108px">' + (pc ? '<col style="width:' + (en() ? 78 : 86) + 'px">' : '') + '</colgroup><thead><tr><th>' + T('번호', 'No.') + '</th><th>' + T('지금 장', 'Chapter now') + '</th><th>' + T('오늘 한 일', 'Today') + '</th><th>' + T('남긴 결과물', 'Saved work') + '</th><th>' + T('마지막 접속', 'Last seen') + '</th>' + (pc ? '<th>🔑 ' + T('비밀번호', 'PIN') + '</th>' : '') + '</tr></thead><tbody>';
    R.forEach((r, i) => { h += '<tr class="r" data-r="' + i + '"><td class="n">' + esc(r.lab) + (r.me ? '*' : '') + '</td><td>' + curCell(r.s) + '</td><td>' + todayCell(r.s) + '</td><td>' + outCell(r.s) + '</td><td>' + esc(ago(r.at)) + '</td>' + (pc ? '<td class="k">' + (r.np ? '<span class="mu" title="' + T('새 비밀번호를 기다려요', 'Waiting for a new PIN') + '">' + T('풀림', 'cleared') + '</span>' : r.n ? '<button class="pc" data-a="pc" data-n="' + r.n + '">' + T('풀기', 'Clear') + '</button>' : '') + '</td>' : '') + '</tr>';
      if (pc && ask9 && ask9 === r.n) h += '<tr class="dt ask"><td colspan="' + nc + '"><b>' + T(r.n + '번 비밀번호를 풀까요?', 'Clear the PIN for No. ' + r.n + '?') + '</b> ' + T('판(진행)은 그대로예요', 'The game (progress) stays as it is') + '<button class="pri" data-a="pcy" data-n="' + r.n + '">🔑 ' + T('풀기', 'Clear') + '</button><button class="sub" data-a="pcn">' + T('그만', 'Cancel') + '</button></td></tr>';
      if (open9 === i) h += '<tr class="dt"><td colspan="' + nc + '">' + detail(r) + '</td></tr>'; });
    if (!R.length) h += '<tr><td colspan="' + nc + '" class="mu" style="text-align:center;padding:10px">' + (src === 'paste' ? T('붙여 넣은 기록이 아직 없어요', 'Nothing pasted yet') : src === 'cloud' ? T('반 코드와 교사 열쇠를 넣고 받아요', 'Enter the class code and teacher key') : T('이 기기에 판이 없어요', 'No games on this device')) + '</td></tr>';
    return h + '</tbody></table>'; }
  function footHtml(R) { const nums = R.filter(r => r.n).map(r => r.n), mx = nums.length ? Math.max(...nums) : 0, miss = []; for (let n = 1; n <= mx; n++) if (!nums.includes(n)) miss.push(n);
    const td = R.filter(r => r.s && r.s.rd === dayKey()).length, st = R.filter(r => r.s && r.s.td && r.s.td.h3 && r.s.rd === dayKey()).length;
    return '<div class="sm" style="margin-top:6px">' + T('줄 ', 'Rows ') + R.length + ', ' + T('오늘 기록 ', 'recorded today ') + td + (st ? ', ' + T('오늘 막힘 있는 번호 ', 'stuck today ') + st : '') + (miss.length ? ', ' + T('안 보이는 번호 ', 'missing numbers ') + miss.join(' ') : '') + '. ' + T('줄을 누르면 자세히 봐요.', 'Tap a row for details.') + '</div>'; }
  // 교사 화면(반 표)
  function board(s9) { if (!A.tchOn()) return open(); addCss(); if (s9) { src = s9; msg = ''; open9 = -1; ask9 = 0; if (s9 === 'dev') RS.dev = devRows(); }
    if (src === 'dev' && !s9 && !RS.dev.length) RS.dev = devRows(); const rows = rowsGet();
    const c = code || (A.cls && A.cls()) || '', cOn = cloudOn(), B = (k, t) => '<button class="sub' + (src === k ? ' on' : '') + '" data-s="' + k + '">' + t + '</button>';
    let h = '<h3>📋 ' + T('우리 반 한눈에', 'Class at a glance') + '</h3><div class="tch-bar"><button class="sub" data-a="home">◀ ' + T('선생님 칸', 'Teacher') + '</button>' + B('dev', T('이 기기 판', 'This device')) + B('paste', T('붙여 넣기', 'Paste')) + (cOn ? B('cloud', '☁️ ' + T('서버', 'Server')) : '') + '<span class="sm">' + T('오늘 ', 'Today ') + esc(dayKey().slice(5).replace('-', '/')) + (src === 'dev' ? ' · ' + (c ? T('반 ', 'class ') + esc(c) : T('반 코드 없음', 'no class code')) : src === 'cloud' && tkey ? ' · ' + T('반 ', 'class ') + esc(code) : src === 'paste' && pN && rows.length ? ' · ' + T('붙여 넣은 기록 ', 'pasted ') + pN + T('개', '') : '') + '</span>' + (src === 'paste' && pN && rows.length ? '<button class="sub" data-a="pedit">' + T('다시 붙여 넣기', 'Paste again') + '</button>' : '') + '</div>';   /* 붙여 넣은 뒤 = 한 띠에(25줄이 한 화면에) */
    if (src === 'paste' && !(pN && rows.length)) h += '<div class="sm">' + T('기기마다 학급 기록의 「복사하기」로 받은 글을 여러 개 한꺼번에 붙여 넣어요(패들렛에 모은 글을 통째로 복사해도 돼요).', 'Paste several “Copy record” texts at once (a whole Padlet column is fine).') + '</div><textarea class="tch-paste" placeholder="{&quot;kind&quot;:&quot;sm-town-rec&quot;, …}">' + esc(paste) + '</textarea><div class="tch-bar"><button class="pri" data-a="parse">' + T('표로 보기', 'Show table') + '</button><button class="sub" data-a="pclr">' + T('지우기', 'Clear') + '</button></div>';
    if (src === 'cloud' && (!tkey || claim)) h += '<div class="tch-bar"><span class="sm">' + T('반 코드', 'Class code') + '</span><input class="tch-in" data-i="code" maxlength="8" autocomplete="off" value="' + esc(c) + '"><span class="sm">' + (claim ? T('새 교사 열쇠(6자 넘게)', 'New teacher key (6+)') : T('교사 열쇠', 'Teacher key')) + '</span><input class="tch-in tch-key" data-i="key" maxlength="32" autocomplete="off" spellcheck="false">' + (claim ? '<input class="tch-in tch-key" data-i="key2" maxlength="32" autocomplete="off" spellcheck="false" placeholder="' + T('한 번 더', 'again') + '"><button class="pri" data-a="claim">' + T('처음 정하기', 'Set key') + '</button>' : '<button class="pri" data-a="pull">' + T('받기', 'Load') + '</button>') + '</div>';
    if (src === 'cloud' && tkey && !claim && mpS >= 0) h += '<div class="tch-bar"><span class="sm">👥 ' + T('우리 반 함께 보기', 'Class view (see classmates)') + '</span><button class="sub' + (mpS ? ' on' : '') + '" data-a="mp1">' + T('켬', 'On') + '</button><button class="sub' + (mpS ? '' : ' on') + '" data-a="mp0">' + T('끔', 'Off') + '</button><span class="sm">' + T('번호만 보여요(이름 X)', 'Numbers only (no names)') + '</span></div>';
    h += (msg ? '<div class="tch-msg' + (msg === okM ? ' ok' : '') + '">' + esc(msg) + '</div>' : '') + tableHtml(rows) + footHtml(rows);
    const P = A.openP(h, true, 'tch');
    P.onclick = ev => { { const ta = P.querySelector('.tch-paste'); if (ta) paste = ta.value; }   /* 다시 그리기 전에 붙여 넣던 글을 남김 */
      const b = ev.target.closest('button'); if (!b) { const tr = ev.target.closest('tr.r'); if (tr) { const i = +tr.dataset.r; open9 = open9 === i ? -1 : i; const y = P.querySelector('.bx'), t9 = y ? y.scrollTop : 0; board(); const y1 = document.querySelector('.twn-p .bx'); if (y1) y1.scrollTop = t9; } return; }
      if (!A.tchOn()) { A.closeP(); return open(); }
      if (b.dataset.s) return board(b.dataset.s); const a = b.dataset.a;
      if (a === 'home') return home();
      if (a === 'mp1' || a === 'mp0') return mpSet(a === 'mp1');
      if (a === 'pc' || a === 'pcn' || a === 'pcy') { const n9 = +b.dataset.n || 0, y = P.querySelector('.bx'), t9 = y ? y.scrollTop : 0; if (a === 'pcy') { pinClear(n9); } else { ask9 = a === 'pc' && !pcB ? n9 : 0; if (a === 'pc') msg = ''; board(); } const y1 = document.querySelector('.twn-p .bx'); if (y1) y1.scrollTop = t9; if (a === 'pc') { const q9 = document.querySelector('.twn-p tr.dt.ask'); if (q9 && q9.scrollIntoView) q9.scrollIntoView({ block: 'nearest' }); } return; }   /* PIN-1: 풀기 → 그 줄 아래에서 한 번 더 묻기(맨 아랫줄이면 묻는 줄이 보이게 내림) → [풀기]·[그만] */
      if (a === 'parse') { const L = parseBlobs(paste).map((o, i) => rowOf(o, i, en())), ok9 = L.filter(Boolean); RS.paste = mergeRows(ok9); pN = ok9.length; open9 = -1; msg = !ok9.length ? T('읽을 수 있는 기록이 없어요. 「복사하기」로 받은 글인지 봐요', 'Nothing readable. Is it from “Copy record”?') : ok9.length < L.length ? T('덩어리 ', 'Skipped ') + (L.length - ok9.length) + T('개는 기록이 아니라 뺐어요', ' that were not records') : ''; return board(); }
      if (a === 'pclr') { paste = ''; RS.paste = []; msg = ''; pN = 0; return board(); } if (a === 'pedit') { pN = 0; return board(); }
      const iv = k => ((P.querySelector('[data-i="' + k + '"]') || {}).value || '').trim();
      if (a === 'pull' || a === 'claim') { const c9 = iv('code').toLowerCase(); if (c9) code = c9; const k1 = iv('key'); if (a === 'claim' && k1 !== iv('key2')) { msg = T('두 번 넣은 열쇠가 달라요', 'The two keys differ'); return board(); } pull(k1, a === 'claim'); } };
    return P; }
  return { open, home, board, lock, devRows, get rows() { return rowsGet(); }, get src() { return src; }, set paste(v) { paste = String(v || ''); } };
}
