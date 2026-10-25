// 📊 학급 기록 준비(REC-0 · 10-18 · town_lessons G '학급 기록 화면' · town_quests §0 '배운 것이 기기에만 남아 교사가 볼 수 없음'): 이 기기 안 기록 + 선생님 보기 + 복사하기 — 서버 X(나중에 이 꼴 그대로 올림 · docs/systems/town_record.md)
//   GAME.S.rec = { v, days: { 'YYYY-MM-DD': { g0·g1 그날 게임 날, st 이야기 단계, cd 장 끝냄, q 보너스 문제, help 일꾼 곁 거들기, job 직업 체험, show 쇼, rank 승급 미션, play 강·들 놀이 } } }
//   이야기 단계 이름 = 이야기 S.story.rec.st와 같게(c 장 · s 단계 · h 힌트 단계 · tr 틀린 수 · p 고른 것 · w 까닭 · l 불편해질 사람 · t 한 줄 · f 잰 값) — QUEST-2 기록을 같은 이름으로 한 곳에
//   하루 = 실제 날짜(수업 한 번 = 하루 · 게임 하루는 12분이라 게임 날로 묶으면 14일이 수업 한두 번) · 최근 14일 · 갈래마다 하루 상한 · 글은 짧게 자름 · 전체가 80KB를 넘으면 오래된 날부터(보통 하루 3~4KB · 꽉 찬 하루 약 15KB)
//   이름·sid·기기 번호 X — 화면엔 '이 기기'로만 · 매 프레임 일 0(일이 끝날 때 add 한 번 · 창은 열 때만 셈)
import { CHAPTERS } from './town_story.js?v=24';
import { BANK, DIR8 } from './town_quiz.js?v=11';
export const REC_V = 1, REC_DAYS = 14, REC_MAX = 80 * 1024;
const T2 = (ko, en) => [ko, en];
// 갈래: 하루 상한 · 이름(선생님 보기)
export const KINDS = { st: [80, T2('이야기 단계', 'Story steps')], way: [60, T2('길 찾기 도움(헤맴 그물)', 'Way-finding help')], cd: [30, T2('끝낸 장', 'Chapters finished')], q: [60, T2('보너스 문제', 'Bonus questions')], help: [60, T2('일꾼 곁 거들기', 'Helping workers')], job: [20, T2('직업 체험', 'Job experience')], show: [20, T2('쇼', 'Shows')], rank: [30, T2('승급 미션', 'Rank missions')], play: [60, T2('강·들 놀이', 'River and field play')], tmap: [30, T2('보물 지도', 'Treasure maps')], road: [40, T2('길 위 사건', 'On the road')] };
const cut = (v, n) => (v == null ? undefined : String(v).slice(0, n));
// 한 건 다듬기(글 길이·고른 것 수 제한 · 빈 칸 빼기) — 아이 이름·sid는 애초에 받지 않음
export function tidy(k, o) { const r = {};
  for (const [key, v] of Object.entries(o || {})) { if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
    if (key === 'p' || key === 'w') r[key] = [].concat(v).slice(0, 6).map(x => cut(x, 40)); else if (key === 't') r[key] = cut(v, 60); else if (key === 'l') r[key] = cut(v, 40); else if (typeof v === 'number' || typeof v === 'boolean') r[key] = typeof v === 'boolean' ? (v ? 1 : 0) : v; else r[key] = cut(v, 40); }
  return r; }
export const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
// 기록 뿌리(없으면 만들고 · 처음 한 번 예전 이야기 기록 S.story.rec을 '이전' 날로 옮김)
export function recRoot(S) { let R = S.rec; if (!R || typeof R !== 'object' || !R.days) R = S.rec = { v: REC_V, days: {} };
  if (!R.mig) { R.mig = 1; const SR = S.story && S.story.rec; if (SR && Object.keys(SR).length) { const B = R.days['0000-00-00'] = { g0: null, g1: null };
      for (const [c, x] of Object.entries(SR)) { for (const [s, o] of Object.entries((x && x.st) || {})) (B.st || (B.st = [])).push(tidy('st', { c, s, ...o })); if (x && x.d1) (B.cd || (B.cd = [])).push({ c, star: x.star ? 1 : 0 }); } } }
  return R; }
export function recAdd(S, k, o, now) { if (!KINDS[k]) return null; const R = recRoot(S), key = dayKey(now), D = R.days; let B = D[key];
  if (!B) { B = D[key] = { g0: S.day || 1, g1: S.day || 1 }; const keys = Object.keys(D).sort(); while (keys.length > REC_DAYS) delete D[keys.shift()]; while (keys.length > 1 && JSON.stringify(R).length > REC_MAX) delete D[keys.shift()]; }   /* 새 날에만 크기 셈(하루 한 번) */
  B.g1 = S.day || B.g1; const A9 = B[k] || (B[k] = []), e = tidy(k, o); A9.push(e); if (A9.length > KINDS[k][0]) A9.shift(); return e; }
// 모아 세기(선생님 보기 · 복사) — 창을 열 때만
export function recSum(S) { const R = recRoot(S), days = Object.keys(R.days).sort(), out = { days, st: {}, cd: {}, picks: {}, lines: [], q: { n: 0, ok: 0, by: {}, m: {} }, help: {}, job: {}, show: {}, rank: {}, play: {} };
  for (const key of days) { const B = R.days[key];
    for (const e of B.st || []) { const k9 = e.c + '/' + e.s, X = out.st[k9] || (out.st[k9] = { c: e.c, s: e.s, n: 0, h: [0, 0, 0, 0], tr: 0 }); X.n++; X.h[Math.max(0, Math.min(3, e.h | 0))]++; X.tr += e.tr | 0;
      if (e.p) { const P9 = out.picks[k9] || (out.picks[k9] = {}); for (const p of e.p) P9[p] = (P9[p] || 0) + 1; }
      if (e.t || e.w || e.l) out.lines.push({ day: key, c: e.c, s: e.s, t: e.t, w: e.w, l: e.l, p: e.w || e.l ? e.p : undefined }); }
    for (const e of B.cd || []) out.cd[e.c] = (out.cd[e.c] || 0) + 1;
    for (const e of B.q || []) { out.q.n++; if (e.ok) out.q.ok++; const X = out.q.by[e.id] || (out.q.by[e.id] = [0, 0]); X[e.ok ? 0 : 1]++; out.q.m[e.m || 'mid'] = (out.q.m[e.m || 'mid'] || 0) + 1; }
    for (const e of B.help || []) { const X = out.help[e.k] || (out.help[e.k] = [0, 0, 0]); X[Math.max(0, Math.min(2, e.g | 0))]++; }
    for (const e of B.job || []) { const X = out.job[e.k] || (out.job[e.k] = [0, 0]); X[e.done ? 0 : 1]++; }   /* [끝냄, 멈춤] */
    for (const e of B.show || []) out.show[e.id] = (out.show[e.id] || 0) + 1;
    for (const e of B.rank || []) { const X = out.rank[e.k + ':' + e.L] || (out.rank[e.k + ':' + e.L] = { k: e.k, L: e.L, go: 0, done: 0, h: 0 }); if (e.done) { X.done++; X.h = Math.max(X.h, e.h | 0); } else X.go++; }
    for (const e of B.play || []) { const X = out.play[e.k] || (out.play[e.k] = [0, 0, 0]); X[Math.max(0, Math.min(2, e.g | 0))]++; } }
  return out; }
// 복사용 한 덩어리(서버에 올릴 꼴 그대로 · 이름·sid·기기 번호 X)
export const recExport = (S, town) => ({ kind: 'sm-town-rec', v: REC_V, town: town || '', made: dayKey(), days: recRoot(S).days });
// 고른 것 → 사람 말(장 보기 · 단계 보기 · 장소 이름 · 방위)
export function pickLabel(c, st, key, en) { const L = p => (Array.isArray(p) ? p[en ? 1 : 0] : String(p)), d = (st && st.do) || {};
  if (d.type === 'judge') { const o = (c.opts || []).find(q => q[0] === key); if (o) return L(o[1]); }
  if (Array.isArray(d.opts)) { const o = d.opts.find(q => q[0] === key); if (o) return L(o[1]); }
  if (d.opts === 'names' && d.names) { const o = d.names.find(q => q[0] === key); if (o) return o[1] + ' ' + o[0]; }
  if (d.opts === 'dirs' && /^d[0-7]$/.test(key)) return L(DIR8[+key[1]]);
  return String(key); }

// 마을 쪽이 넘기는 것(A): GAME · en() · esc · openP(h, wide, kind) · closeP() · toast(t, s) · pin() → 선생님 비밀번호(lobby teacherPin) · helpName(k) 일꾼 · jobName(k) 직업 체험 · showName(id) · rankName(k, L) · playName(k) · town
export function createRec(A) {
  const S = () => A.GAME.S, en = () => A.en(), L2 = p => (Array.isArray(p) ? p[en() ? 1 : 0] : String(p ?? '')), esc = A.esc;
  let proj = false; recRoot(S());   /* 예전 이야기 기록 옮기기는 마을을 열 때 한 번(첫 기록 때 하면 방금 끝낸 단계까지 '이전'에 겹쳐 셈) */
  function add(k, o) { const e = recAdd(S(), k, o); if (e) A.GAME.mark(); return e; }
  const chOf = id => CHAPTERS.find(c => c.id === id), stOf = (c, sid) => c && c.steps.find(s => s.id === sid);
  const dayLab = k => (k === '0000-00-00' ? (en() ? 'earlier' : '이전') : k.slice(5).replace('-', '/'));
  // 선생님 보기(이 기기 하나 · 투사 모드 = 날짜·'이 기기' 숨기고 글을 크게)
  function view() { const e = en(), M = recSum(S()), big = proj ? 'font-size:20px;line-height:1.5' : '';
    let h = '<h3>📊 ' + (e ? 'Class record — this device' : '학급 기록 — 이 기기') + '</h3>'
      + (proj ? '' : '<div class="sm">' + (e ? 'What was done on this device in the last 14 days. Nothing is sent to a server. To gather several devices, copy each one and paste them together.' : '최근 14일 동안 이 기기에서 한 것이에요. 서버로 보내지 않아요. 여러 기기를 모으려면 기기마다 복사해서 한곳에 붙여 모아요.') + '</div>')
      + '<div class="row" style="justify-content:flex-start"><button class="sub" data-a="proj">📽 ' + (proj ? (e ? 'Projector mode: on' : '투사 모드: 켬') : (e ? 'Projector mode: off' : '투사 모드: 끔')) + '</button><button class="sub" data-a="copy">📋 ' + (e ? 'Copy record' : '복사하기') + '</button></div>'
      + (proj || !M.days.length ? '' : '<div class="sm">' + (e ? 'Days recorded: ' : '기록한 날: ') + M.days.map(dayLab).join(', ') + '</div>');
    if (!M.days.length) h += '<div class="sm">' + (e ? 'Nothing recorded yet.' : '아직 기록이 없어요.') + '</div>';
    // 1) 이야기 단계: 해낸 수 · 힌트 단계
    const byC = {}; for (const X of Object.values(M.st)) (byC[X.c] || (byC[X.c] = [])).push(X);
    if (Object.keys(byC).length) { h += '<div class="grp">' + (e ? 'Story steps — done and hints used' : '이야기 단계 — 해낸 수와 힌트') + '</div>';
      for (const c of CHAPTERS) { const L9 = byC[c.id]; if (!L9) continue; L9.sort((a, b) => c.steps.findIndex(s => s.id === a.s) - c.steps.findIndex(s => s.id === b.s));
        h += '<div class="st"><b class="n">' + c.icon + '</b><span style="flex:1"><b>' + esc(L2(c.t)) + '</b>' + (M.cd[c.id] ? ' <small>' + (e ? 'finished ' + M.cd[c.id] : '끝냄 ' + M.cd[c.id] + '번') + '</small>' : '') + L9.map(X => { const st = stOf(c, X.s), nm = st && st.todo ? L2(st.todo) : (st && st.do && st.do.type === 'note' ? (e ? 'Read the note' : '쪽지 읽기') : X.s), hh = X.h.map((n, i) => n ? (i ? (e ? 'hint ' + i + ': ' + n : i + '단계 ' + n) : (e ? 'no hint: ' + n : '힌트 없이 ' + n)) : '').filter(Boolean).join(', ');
          return '<br><small>' + esc(nm) + (e ? ' — done ' + X.n + '. ' : ' — ' + X.n + '번 해냄. ') + esc(hh) + (X.tr ? (e ? '. Wrong tries ' + X.tr : '. 틀린 수 ' + X.tr) : '') + '</small>'; }).join('') + '</span></div>'; } }
    // 2) 고른 것 분포
    const PK = Object.entries(M.picks); if (PK.length) { h += '<div class="grp">' + (e ? 'What was chosen' : '고른 것') + '</div>';
      for (const [k9, P9] of PK) { const [cid, sid] = k9.split('/'), c = chOf(cid), st = stOf(c, sid), tot = Object.values(P9).reduce((a, b) => a + b, 0), q = st && st.do && st.do.q ? L2(st.do.q) : (st && st.todo ? L2(st.todo) : sid);
        h += '<div class="st"><span style="flex:1"><b>' + esc(c ? L2(c.t) : cid) + '</b><br><small>' + esc(q) + '</small>' + Object.entries(P9).sort((a, b) => b[1] - a[1]).map(([p, n]) => '<div style="display:flex;gap:8px;align-items:center;margin-top:4px"><span style="flex:0 0 46%;' + big + '">' + esc(pickLabel(c, st, p, e)) + '</span><div style="flex:1;height:10px;background:#e3e7ea;border-radius:9px;overflow:hidden"><div style="height:100%;width:' + Math.round(n / tot * 100) + '%;background:#2f8a3a"></div></div><b>' + n + '</b></div>').join('') + '</span></div>'; } }
    // 3) 한 줄 카드(한 줄 · 까닭 · 불편해질 사람)
    if (M.lines.length) { h += '<div class="grp">' + (e ? 'Line cards' : '한 줄 카드') + '</div>';
      for (const x of M.lines.slice(-30).reverse()) { const c = chOf(x.c), st = stOf(c, x.s), R9 = [];   /* 있는 줄만 이어 붙임(빈 첫 줄 X) · 판단 카드 머리 = 고른 것 */
        if (x.t) R9.push('<b>' + esc(x.t) + '</b>'); else if (x.p) R9.push('<b>' + (e ? 'Chose: ' : '고른 것: ') + esc(x.p.map(k => pickLabel(c, st, k, e)).join(', ')) + '</b>');
        if (x.w) R9.push('<small>' + (e ? 'Because: ' : '까닭: ') + esc(x.w.join(', ')) + '</small>'); if (x.l) R9.push('<small>' + (e ? 'Who might be inconvenienced: ' : '불편해질 사람: ') + esc(x.l) + '</small>');
        if (!proj) R9.push('<small>' + (e ? 'This device' : '이 기기') + ', ' + esc(dayLab(x.day)) + ', ' + esc(c ? L2(c.t) : x.c) + '</small>');
        h += '<div class="st"><span style="flex:1;' + big + '">' + R9.join('<br>') + '</span></div>'; } }
    // 4) 보너스 문제
    if (M.q.n) { const wr = Object.entries(M.q.by).filter(([, v]) => v[1]).sort((a, b) => b[1][1] - a[1][1]).slice(0, 5), nm = id => (BANK[id] ? L2(BANK[id].t) : id);
      h += '<div class="grp">' + (e ? 'Bonus questions' : '보너스 문제') + '</div><div class="st"><span style="flex:1"><b>' + (e ? M.q.ok + ' right out of ' + M.q.n : M.q.n + '문제 가운데 ' + M.q.ok + '문제 맞힘') + '</b><br><small>' + (e ? 'Midday ' + (M.q.m.mid || 0) + ', bedtime ' + (M.q.m.rec || 0) + ', review ' + (M.q.m.prac || 0) : '낮 ' + (M.q.m.mid || 0) + ', 잠들 때 ' + (M.q.m.rec || 0) + ', 다시 풀기 ' + (M.q.m.prac || 0)) + '</small>'
        + (wr.length ? '<br><small>' + (e ? 'Often missed: ' : '자주 틀린 것: ') + esc(wr.map(([id, v]) => nm(id) + ' ' + v[1]).join(', ')) + '</small>' : '') + '</span></div>'; }
    // 5) 해 본 일: 직업 체험 · 승급 미션 · 일꾼 곁 거들기 · 강·들 놀이 · 쇼
    const g3 = v => (e ? (v[0] + v[1] + v[2]) + ' times (excellent ' + v[2] + ', well done ' + v[1] + ', close ' + v[0] + ')' : (v[0] + v[1] + v[2]) + '번(아주 잘함 ' + v[2] + ', 잘함 ' + v[1] + ', 아쉬움 ' + v[0] + ')'), row = (t, d) => '<div class="st"><span style="flex:1"><b>' + esc(t) + '</b> <small>' + d + '</small></span></div>';
    const JB = Object.entries(M.job), RK = Object.values(M.rank), HP = Object.entries(M.help), PL = Object.entries(M.play), SH = Object.entries(M.show);
    if (JB.length) { h += '<div class="grp">' + (e ? 'Job experience' : '직업 체험') + '</div>'; for (const [k, v] of JB) h += row(A.jobName(k), e ? 'finished ' + v[0] + (v[1] ? ', stopped ' + v[1] : '') : '끝냄 ' + v[0] + (v[1] ? ', 멈춤 ' + v[1] : '')); }
    if (RK.length) { h += '<div class="grp">' + (e ? 'Rank missions' : '승급 미션') + '</div>'; for (const X of RK) h += row(A.rankName(X.k, X.L), (e ? 'started ' + X.go + ', badge ' + X.done : '시작 ' + X.go + ', 배지 ' + X.done) + (X.done ? (X.h ? (e ? ', hints up to ' + X.h : ', 힌트 ' + X.h + '단계까지') : (e ? ', no hints' : ', 힌트 없이')) : '')); }
    if (HP.length) { h += '<div class="grp">' + (e ? 'Helping workers' : '일꾼 곁 거들기') + '</div>'; for (const [k, v] of HP) h += row(A.helpName(k), g3(v)); }
    if (PL.length) { h += '<div class="grp">' + (e ? 'River and field play' : '강·들 놀이') + '</div>'; for (const [k, v] of PL) h += row(A.playName(k), g3(v)); }
    if (SH.length) { h += '<div class="grp">' + (e ? 'Shows' : '쇼') + '</div>'; for (const [id, n] of SH) h += row(A.showName(id), e ? 'watched to the end ' + n : '끝까지 본 수 ' + n); }
    h += '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const P9 = A.openP(h, true, 'rec'); P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') A.closeP(); else if (b.dataset.a === 'proj') { proj = !proj; view(); } else if (b.dataset.a === 'copy') copy(P9); }; return P9; }
  // 복사하기: JSON 한 덩어리 → 클립보드(안 되면 창 안 글 상자에 담아 골라 둠)
  function copy(P9) { const t = JSON.stringify(recExport(S(), A.town)), e = en(), shown = () => { let ta = P9.querySelector('textarea[data-rec]'); if (!ta) { ta = document.createElement('textarea'); ta.dataset.rec = '1'; ta.readOnly = true; ta.style.cssText = 'width:100%;height:120px;font:12px monospace;margin-top:8px'; P9.querySelector('.bx').appendChild(ta); } ta.value = t; ta.focus(); ta.select(); A.toast(e ? 'Select all and copy (Ctrl+C)' : '글 상자를 모두 골라 복사해요(Ctrl+C)', 3); };
    try { navigator.clipboard.writeText(t).then(() => A.toast(e ? '📋 Copied — paste it into a note to gather devices' : '📋 복사했어요. 메모장이나 패들렛에 붙여 넣어 모아요', 3), shown); } catch (er) { shown(); } return t; }
  // 이야기 목록 선생님 칸 → 비밀번호 창 → 보기
  async function open() { const ok = await A.pin(); if (ok) view(); }
  return { add, view, open, copy, sum: () => recSum(S()), dump: () => recExport(S(), A.town), get proj() { return proj; } };
}
