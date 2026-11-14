// ⏰ 방장 시계(HOST-1 · 교사 11-14 '같이하기 할 때는 시간 같은 거는 방장 기준으로 돌아가게 하면 될 듯'): 함께하기 방(main.js 방 · body.mp-in) 안에서는 시각·그날 날씨·계절·시계 멈춤 = 시계 주인 마을 기준
//   시계 주인 = 방장(방을 만든 기기 · SM_MP.isOwner)이 마을에 있으면 방장 · 마을에 없거나(학교 맵 등) 30초 넘게 소식이 없으면 = 마을에 있는 기기 가운데 방에 먼저 들어온 기기
//     (들어온 시각 · 같으면 id 순 · 모든 기기가 같은 규칙으로 같은 기기를 고름 — 다투어 쓰기 X) · 마을에 나 혼자면 = 내 시계(내가 주인)
//   쓰는 칸 = 내 Firebase players/<id>/fx — 방 통로 그대로(새 스트림 X · NET-2) · ctl의 새 칸은 DB 규칙이 막음(401 확인 · 규칙은 안 바꿈) · fx는 예전 마법사 마을 빛줄기 칸(학교·마을 방에선 아무도 안 씀)
//     { q, s 분(소수), a: [날씨 0맑음·1비·2눈, 계절 0지금·1봄·2여름·3가을·4겨울, 멈춤 0·1, 잠 = 주인의 n일째, 방장 0·1, 방에 들어온 시각(서버 ms), 주인 0·1], b: [서버 시각] }
//     마을에 들어오면 한 번(들어온 시각 알림 · 주인 0) · 주인이면 10초마다 + 바뀔 때(잠·날씨·계절·멈춤·밤/아침 · 1초 칸이라 1초에 한 번까지)
//   손님 = 시각은 받은 분 + 서버 시각으로 흐른 만큼(1분 넘게 다르면 2초쯤에 걸쳐 · town_game.js hostStep) · 그날 날씨 = 내 판의 '그날 정한 날씨'(WXD9 · 예보·저장 X) · 계절 = 보기만(setSeason · 내 달력 X) · 멈춤 = 같이
//     주인이 자면(주인 n일째가 늘면) = 내 판도 그 밤을 지남(GAME.sleep 한 번 · 집으로 X · 그 자리에서 짧게 어두워졌다 밝아짐 · 놀이·창이 끝난 뒤 · 40초 넘으면 바로) · 내 n일째는 내 것(방장 날짜로 안 바꿈)
//     손님의 잠·기다리기·쉬기·시계 멈춤·날씨·계절 바꾸기 = 「방장만 할 수 있어요」 한 줄(town.js가 guest()를 봄) · 방을 나가면 그 순간 시각·날씨로 내 시계가 이어 흐름(튐 X)
//   새로 주인이 되는 기기 = 다른 기기의 살아 있는 시계가 있으면 그 시계에서 이어 감(방장이 마을에 돌아와도 모두의 하늘이 튀지 않게 · 그 뒤로는 방장이 정함)
//   반 계정 반 방(CLASS-MP · 웹소켓만 · 방장 없음)은 아직 X — 다음 걸음(town_together.md)
import { SPM } from './town_game.js?v=62';
const WXN = ['clear', 'rain', 'snow'], SEAN = ['now', 'spring', 'summer', 'autumn', 'winter'];
const FRESH = 30000, EVERY = 10, NIGHT_MAX = 40000, HAND_MAX = 6;
export function createHost({ GAME, say, en, act }) {
  /* act = { wx() 그날 날씨 · setWx(w, quiet) · sea() 보이는 계절 · setSea(s) · night() 손님 밤 지나기(Promise<bool>) · free() 창·놀이·잠이 없음 } */
  let t = 0, room = '', joinTs = 0, role = '', mid = '', mOwn = false, mP = 0, nOth = 0, lastQ = -1, lastSl = null, pend = 0, pendAt = 0, nightBusy = false;
  let pubT = 0, lastPub = '', pubM = 0, pubAt = 0, presAt = -1e9, wxAp = '', wxDayAp = -1, wxHoldDay = -1, handT = 0, onlyT = -1e9, saidK = '', own = false;
  const C = [], noShow = new Map();
  const guestLike = () => role === 'guest' || role === 'wait' || role === 'hand';
  const L = (ko, e9) => (en() ? e9 : ko);
  function note(k) { if (k === saidK) return; saidK = k; const m = {
    fo: L('⏰ 방장 시계를 따라요. 시각과 날씨, 계절이 방장 마을과 같아요', '⏰ Following the host’s clock. Time, weather and season match the host’s town'),
    ff: L('⏰ 방장이 마을에 없어서 먼저 온 친구의 시계를 따라요', '⏰ The host isn’t in the town, so we follow the friend who came first'),
    mo: L('⏰ 내 시계가 방 시계예요. 내가 자면 친구들도 아침이 돼요', '⏰ Your clock is the room clock. When you sleep, friends wake up too'),
    mf: L('⏰ 방장이 마을에 없어서 친구들이 내 시계를 따라요', '⏰ The host isn’t in the town, so friends follow your clock'),
    solo: L('⏰ 이제 내 시계로 흘러요', '⏰ Your own clock runs now'),
    out: L('⏰ 방에서 나와서 내 시계로 이어 흘러요', '⏰ You left the room. Your own clock keeps going'),
  }[k]; if (m) say(m, 3.4, 1); }
  /* 손님이 따를 목표(새 소식이 올 때만 새 객체 · 매 프레임 X) */
  function aim(f, N) { const b = f.b || {}, ts = +b[0] || 0, a = f.a || {}; lastQ = f.q; mP = a[2] === 1 ? 1 : 0;
    GAME.host = { m: +f.s || 0, at: performance.now() - Math.max(0, Math.min(60000, N.srvNow - ts)), p: mP === 1 }; }
  function apply(f) { const a = f.a || {}, sn = SEAN[a[1]] || 'now', wn = WXN[a[0]] || 'clear';
    if (sn !== act.sea()) { if (act.free()) act.setSea(sn); return; }   /* 계절 먼저(눈은 겨울에만) · 다시 칠하기는 창·놀이가 없을 때(창을 닫으므로) */
    if (wn !== wxAp || GAME.S.day !== wxDayAp) { act.setWx(wn, !wxAp || wn === wxAp); wxAp = wn; wxDayAp = GAME.S.day; wxHoldDay = GAME.S.day; } }   /* 처음·날이 바뀐 다시 얹기는 조용히 · 방장이 바꾼 날씨는 알림 그대로 */
  async function tryNight() { if (nightBusy) return; if (!act.free() && performance.now() - pendAt < NIGHT_MAX) return; nightBusy = true; let ok = false;
    try { ok = await act.night(); } finally { nightBusy = false; if (ok) { pend = 0; GAME.host = null; lastQ = -1; wxDayAp = -1; } } }
  function follow(c, N) { const f = c.f, a = f.a || {}, sl = +a[3] || 0;
    if (c.id !== mid) { mid = c.id; mOwn = c.own; lastSl = sl; lastQ = -1; }   /* 주인이 바뀜 = 잠 셈은 새 주인 것으로(지난 잠 X · 이미 기다리던 밤은 그대로 지남) */
    if (lastSl == null || sl < lastSl) lastSl = sl;   /* 주인이 처음부터 다시 시작(날이 줄어듦) = 밤 X */
    if (sl > lastSl) { lastSl = sl; if (!pend) { pend = 1; pendAt = performance.now(); } }   /* 몇 밤이 지났든 내 판은 한 밤만(보상 두 번 X) */
    if (pend) { if (!GAME.host || !GAME.host.p) GAME.host = { m: GAME.minF(), at: performance.now(), p: true }; tryNight(); return; }   /* 밤을 지나기 전엔 시계를 멈춰 둠(거꾸로 아침 6시로 흐르지 않게) */
    if (f.q !== lastQ || !GAME.host) aim(f, N);
    apply(f); }
  function lead(N) { GAME.host = null; GAME.cont = nOth > 0;
    const wx = act.wx(), sea = act.sea(), p = GAME.S.clock && GAME.flow !== false ? 0 : 1, sl = GAME.S.day | 0, sig = wx + sea + p + ':' + sl + GAME.phase + (own ? 1 : 0) + (nOth > 0 ? 1 : 0), m9 = GAME.minF(), n9 = performance.now();   /* p = 지금 안 흐름(시계 멈춤 · 혼자일 때 창이 열려 멈춤) — 흐름이 바뀌거나 손님이 처음 오면 바로 알림(손님이 멈춘 시계를 앞질러 셈하지 않게) */
    const jump = nOth > 0 && Math.abs(m9 - (pubM + (p ? 0 : (n9 - pubAt) / 1000 / SPM))) > 3;   /* 기다리기·쉬기로 시각이 건너뜀 = 바로 알림 */
    if (sig !== lastPub || jump || (pubT -= 1) <= 0) { lastPub = sig; pubT = EVERY; pubM = m9; pubAt = n9; presAt = n9; N.fx({ s: +m9.toFixed(3), a: [Math.max(0, WXN.indexOf(wx)), Math.max(0, SEAN.indexOf(sea)), p, sl, own ? 1 : 0, joinTs, 1], b: [{ '.sv': 'timestamp' }] }); } }
  function presence(N, force) { const F = N.myFx, a = F && F.a; if (!force && a && +a[5] === joinTs && a[6] !== 1) return; if (!force && performance.now() - presAt < 5000) return;
    presAt = performance.now(); N.fx({ s: 0, a: [0, 0, 0, 0, own ? 1 : 0, joinTs, 0], b: [{ '.sv': 'timestamp' }] }); }   /* 들어온 시각 알림(주인 0) — 서버에 없거나 옛 주인 표시면 5초마다 다시 */
  function leave(said) { if (GAME.host) { GAME.host = null; GAME.mark(); if (said) note('out'); } GAME.cont = false; role = ''; room = ''; mid = ''; pend = 0; lastSl = null; lastQ = -1; joinTs = 0; handT = 0; nOth = 0; lastPub = ''; noShow.clear(); saidK = ''; }
  function sec() {
    const M = window.SM_MP, rm = M && M.room ? M.room() : null, N = rm && M.net ? M.net() : null;
    if (!N || !document.body.classList.contains('mp-in')) { if (room) leave(guestLike()); return; }
    if (rm !== room) { if (room) leave(false); room = rm; }
    if (!joinTs) { if (!N.srvOk) return; joinTs = Math.round(N.bornAt); }   /* 서버 시각을 안 뒤(들어오고 1~2초) 한 번 정함 — 모두가 이 숫자를 씀 */
    own = !!(M.isOwner && M.isOwner()); const now = N.srvNow;
    C.length = 0; C.push({ id: N.id, own, j: joinTs, me: true, fresh: true, f: null });
    N.fxPeers((pid, f, inTown) => { const a = f.a || {}, j = +a[5] || 0; if (!inTown || !j) return; const ts = +((f.b || {})[0]) || 0; C.push({ id: pid, own: a[4] === 1, j, me: false, fresh: a[6] === 1 && now - ts < FRESH, f }); });
    for (const c of C) if (c.fresh && !c.me) noShow.delete(c.id);
    const ok = c => c.me || c.fresh || !(now - (noShow.get(c.id) || now) > FRESH), cmp = (x, y) => x.j - y.j || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);
    let pick = null; for (const c of C) if (c.own && ok(c) && (!pick || cmp(c, pick) < 0)) pick = c;   /* 방장이 마을에 있으면 방장 */
    if (!pick) for (const c of C) if (!c.own && ok(c) && (!pick || cmp(c, pick) < 0)) pick = c;   /* 아니면 먼저 들어온 기기 */
    if (!pick.me && !pick.fresh && !noShow.has(pick.id)) noShow.set(pick.id, now);   /* 고른 기기가 30초 안에 시계를 안 쓰면 다음 기기로 */
    nOth = C.length - 1; const was = role;
    if (pick.me) {
      if (pend) { tryNight(); return; }   /* 손님일 때 시작한 밤(방장이 잠듦)을 마저 지난 뒤 주인 */
      if (was !== 'master' && was !== 'guest' && was !== 'hand') { let oc = null; for (const c of C) if (!c.me && c.fresh && (!oc || cmp(c, oc) < 0)) oc = c; if (oc) { role = 'hand'; handT = 0; mid = ''; } else role = 'master'; }
      if (role === 'hand') { let oc = null; for (const c of C) if (!c.me && c.fresh && (!oc || cmp(c, oc) < 0)) oc = c;   /* 이어 받기: 살아 있는 시계를 잠깐 따라가 맞춘 뒤 주인 */
        if (oc && ++handT <= HAND_MAX) { follow(oc, N); const g9 = GAME.hostAim(), d = g9 == null ? 0 : Math.abs(g9 - GAME.minF()); if (!(d < 1 && !pend && SEAN[(oc.f.a || {})[1]] === act.sea())) return; }
        role = 'master'; }
      if (role !== 'master') { role = 'master'; mid = ''; lastSl = null; }   /* 주인이 됨 = 다음에 누구를 따르든 잠 셈은 새로 */
      lead(N);
      if (nOth > 0) note(own ? 'mo' : 'mf'); else if (was === 'guest' || was === 'wait') note('solo');
      return; }
    if (was === 'master') { lastPub = ''; presence(N, true); }   /* 주인에서 내려옴 = 내 칸의 주인 표시를 바로 끔 */
    else presence(N, false);
    GAME.cont = false;
    if (!pick.fresh) { role = 'wait'; if (pend) tryNight(); return; }   /* 고른 주인의 시계를 아직 못 받음 = 하던 대로(따르던 시계는 그대로 흐름) */
    role = 'guest'; follow(pick, N); note(pick.own ? 'fo' : 'ff'); }
  const API = {
    tick(dt) { if ((t += dt) < 1) return; t = 0; sec(); },
    guest: () => guestLike(),
    master: () => role === 'master',
    /* 손님이 시계를 바꾸려 함 = 한 줄(1.2초에 한 번) */
    only() { const n = performance.now(); if (n - onlyT < 1200) return; onlyT = n; say(mOwn || role === 'hand' ? L('⏰ 방장만 할 수 있어요. 시간과 날씨는 방장 마을을 따라요', '⏰ Only the host can do that. Time and weather follow the host’s town') : L('⏰ 지금 시계를 맡은 친구만 할 수 있어요. 시간과 날씨는 그 친구 마을을 따라요', '⏰ Only the friend keeping the clock can do that. Time and weather follow their town'), 3); },
    /* 시계 칩 낱말(GAME.clockText 뒤) — 따르는 손님 = 방장 시계 · 친구가 따르는 주인 = 방장 시계(방장)·방 시계(먼저 온 친구) */
    tag(e9) { const g = guestLike() && !!GAME.host, m = role === 'master' && nOth > 0; if (!g && !m) return ''; const o = g ? mOwn : own, p = g ? mP === 1 : !GAME.S.clock; return ' ' + (p ? '⏸' : '⏰') + (o ? (e9 ? 'Host clock' : '방장 시계') : (e9 ? 'Room clock' : '방 시계')); },
    wxHold: () => guestLike() || wxHoldDay === GAME.S.day,   /* 오늘 날씨는 방장 것(방을 나간 뒤에도 그날은 그대로 · 예보 전선·아침 예보로 안 덮음) */
    seaHold: () => guestLike(),
    st: () => ({ room, role, mid, mOwn, own, joinTs, nOth, pend, host: GAME.host ? { ...GAME.host } : null, cont: GAME.cont, wxAp, sl: lastSl, noShow: [...noShow.keys()] }),   /* 시험(읽기만) */
    dispose() { GAME.host = null; GAME.cont = false; if (GAME.guard === guard) GAME.guard = null; },
  };
  const guard = () => { if (!guestLike()) return false; API.only(); return true; };
  GAME.guard = guard; GAME.tag = e9 => API.tag(e9);
  window.SM_HOST = API;   /* 시험이 읽음(town_host1.cjs) */
  return API;
}
