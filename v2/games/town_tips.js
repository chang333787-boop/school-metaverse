// 💡 조작 한 줄 안내 · ⌨ 조작 도움 창(TIPS-1 · 사용자 10-31 "마우스를 보이게 하는 탭, 그리고 자전거, 그리고 일부 편의 기능이 지금 처음에 잘 안 알려 줘서
//   '어떻게 하는 거지' 생각할 것 같아. 튜토리얼이 좀 더 친절하면 좋겠어. 퀘스트 튜토리얼 말고도.")
//   ① 그때그때 한 줄(처음 한 번): 그 기능이 처음 필요해지는 순간 화면 아래 가운데(E 안내 위)에 키 그림 + 한 문장
//      한 번에 하나 · 창·대화·놀이·잠·탈것·큰 배너가 있으면 기다림 · 1.5초 넘게 가려지지 않고 보였을 때만 '봤음'(GAME.S.tips.s · 보상 문 rwCheck와 무관)
//      5분에 셋까지 · 안내 사이 20초 · 기능을 스스로 먼저 쓰면(키를 누름·탐) 그 안내는 띄우지 않음 · ⚙ 설정 '처음 쓸 때 한 줄 안내'(SET.tips) = 끄기
//      때: 처음 마우스가 잠길 때(Tab) · 걸어서 100m(B) · 정류장·역 곁(E) · 처음 비(U) · 같은 곳을 맴돎(J 찾기 → 빨간 선) · 가방에 처음 물건(I) · 첫 밤(잠) · 키 줄이 접힌 뒤(H)
//      막마다 열림(INTUIT-1 hudUnlock): 키가 있는 것 하나 = '새로 생겼어요 [M] = 큰 지도' · 여럿 = 'H에서 모두' (친구 말·알림은 town.js hudSay 그대로 — 그 뒤에 뜸)
//   ② ⌨ 조작 도움 창(H · 아래 키 줄 · ☰ 메뉴 ❓): 지금 열린 기능만(hudOn) 표 하나 · 데스크톱 = 키 그림 · 터치 = 단추 그림 · 막 열린 것 = '새로'(창을 열면 지움)
//   렉: 매 프레임 = 시간 더하기 하나 · 판정 = 0.5초 칸 · 새 객체 = 안내가 생길 때만 · 맴돎 = 2초마다 고정 칸(Float32Array) · 3D 그리기 X(DOM 한 줄)
//   새 조작·편의 기능을 만들면: 아래 TIP(안내 한 줄)·rows(도움 창 한 줄)에 한 줄씩 · 시험 tools/harness/town_tips.cjs
export const TIPS_V = 1;
const GAP = 20000, WIN = 300000, CAP = 3, SEEN_MS = 1500, CN = 30;   /* 안내 사이 · 5분 창 · 5분에 셋 · '봤음' 문턱 · 맴돎 칸 수(2초 × 30 = 1분) */
const PRI = { mouse: 6, bus: 5, subway: 5, umb: 5, lost: 5, bike: 4, bag: 4, sleep: 4, u: 3, help: 2 };   /* 지금 그 자리에서 쓸 것이 먼저 */
const DROP = { mouse: 1, bus: 1, subway: 1, umb: 1, lost: 1, sleep: 1 };   /* 조건이 지나가면 줄에서 뺌(다시 그 때가 오면 또 줄 섬) */
const K = k => '<kbd>' + k + '</kbd>', C = t => '<span class="tc">' + t + '</span>', TB = (i, t) => '<span class="tbw"><i class="tb">' + i + '</i>' + (t || '') + '</span>', TJ = t => '<span class="tbw"><i class="tj"><b></b></i>' + t + '</span>';
const UNL = { map: 1, find: 1, look: 1, jobs: 1, board: 1 };   /* 열릴 때 키 그림 한 줄을 띄우는 것(키·E가 있는 것) · 정류장·역은 그 곁에서(bus·subway 안내) */
const NAME = { mini: ['작은 지도', 'Small map'], map: ['큰 지도', 'Big map'], wx: ['날씨와 시계', 'Weather and clock'], find: ['장소 찾기', 'Place finder'], tasks: ['오늘 할 일', 'Today’s tasks'], look: ['판 모습', 'Mat look'], together: ['함께하기', 'Play together'], quiz: ['보너스 문제', 'Bonus questions'], bus: ['버스', 'Bus'], subway: ['지하철', 'Subway'], board: ['의뢰 게시판', 'Request board'], dex: ['도감', 'Codex'], skill: ['내 솜씨', 'Skills'], pass: ['마을 여권', 'Town passport'], jobs: ['직업 체험', 'Job experience'], rank: ['승급 미션', 'Skill missions'] };
// 안내 한 줄 = [앞 글, 그림, 뒤 글](데스크톱 d · 터치 t — 없으면 그 기기엔 안 띄움) · tag = 앞 꼬리표
function TIP(id, en, q) {
  const L = (ko, e) => (en ? e : ko), M = C('☰ ' + L('메뉴', 'Menu')), ACT = TB('✋', L('행동', 'Action'));
  switch (id) {
    case 'mouse': return { d: ['', K('Tab'), L(' 을 누르면 마우스가 보여요. 화면을 누르면 다시 둘러봐요.', ' shows the mouse. Click the screen to look around again.')] };
    case 'bike': return { d: ['', K('B'), L(' 를 누르면 자전거를 타요. 먼 곳도 금방 가요.', ' rides the bike. Far places get close fast.')], t: ['', M, L(' 안의 🚲 자전거 타기를 누르면 먼 곳도 금방 가요.', ' → 🚲 Bike. Far places get close fast.')] };
    case 'bus': return { d: [L('정류장에서 ', 'At a bus stop, press '), K('E'), L(' 를 누르면 버스를 타요. 갈 곳을 고르면 버스가 와요.', ' to take the bus. Pick where to go and it comes.')], t: [L('정류장에서 ', 'At a bus stop, tap '), ACT, L(' 을 누르면 버스를 타요. 갈 곳을 고르면 버스가 와요.', ' to take the bus. Pick where to go and it comes.')] };
    case 'subway': return { d: [L('역 입구에서 ', 'At a station entrance, press '), K('E'), L(' 를 누르면 지하철을 타요.', ' to take the subway.')], t: [L('역 입구에서 ', 'At a station entrance, tap '), ACT, L(' 을 누르면 지하철을 타요.', ' to take the subway.')] };
    case 'umb': return { d: [L('비가 와요. ', 'It is raining. '), K('U'), L(' 를 누르면 우산을 펴요. 한 번 더 누르면 접어요.', ' opens the umbrella. Press again to close it.')], t: [L('비가 와요. 오른쪽 위 ', 'It is raining. Tap '), C('☂ ' + L('우산', 'Umbrella')), L(' 을 누르면 우산을 펴요.', ' at the top right to open it.')] };
    case 'lost': return { d: [L('길을 찾나요? ', 'Looking for the way? '), K('J'), L(' 에서 장소 이름을 쓰고 Enter를 누르면 빨간 선이 생겨요.', ' — type a place and press Enter for a red line.')], t: [L('길을 찾나요? ', 'Looking for the way? '), M, L(' 의 📍 바로 가기에서 장소를 찾고 길 안내를 눌러요.', ' → 📍 Jump: find the place and tap Guide.')] };
    case 'bag': return { d: [L('가방에 물건이 들어왔어요. ', 'Something went into your bag. '), K('I'), L(' 를 누르면 가방이 열려요.', ' opens the bag.')], t: [L('가방에 물건이 들어왔어요. ', 'Something went into your bag. '), M, L(' 의 🎒 가방에서 볼 수 있어요.', ' → 🎒 Bag to see it.')] };
    case 'sleep': { const x = [L('밤이 됐어요. 우리 집 침대나 ', 'It is night. Sleep in your bed at home or use '), M, L(' 의 😴 단추로 자면 다음 날 아침이 돼요.', ' → 😴 to wake up the next morning.')]; return { d: x, t: x }; }
    case 'help': return { d: ['', K('H'), L(' 를 누르면 지금 쓸 수 있는 키를 모두 볼 수 있어요.', ' shows every key you can use now.')], t: ['', M, L(' 의 ❓ 조작 도움에서 단추 쓰는 법을 모두 볼 수 있어요.', ' → ❓ Controls shows how every button works.')] };
  }
  if (id.startsWith('u:')) { const tag = L('새로 생겼어요', 'New');
    if (q && q.keys) return { tag, d: ['', K('H'), L(' 를 누르면 새로 생긴 것의 쓰는 법을 볼 수 있어요.', ' shows how the new things work.')], t: ['', M, L(' 의 ❓ 조작 도움에서 새로 생긴 것을 볼 수 있어요.', ' → ❓ Controls shows the new things.')] };
    const k = id.slice(2), nm = NAME[k] ? NAME[k][en ? 1 : 0] : k;
    if (k === 'map') return { tag, d: ['', K('M'), ' = ' + nm], t: ['', M, L(' 의 🗺 큰 지도', ' → 🗺 Big map')] };
    if (k === 'find') return { tag, d: ['', K('F'), ' = ' + nm], t: ['', M, L(' 의 🔎 장소 = 장소 찾기', ' → 🔎 Places')] };
    if (k === 'look') return { tag, d: ['', K('Y'), ' = ' + nm], t: ['', M, L(' 의 🧱 판 모습', ' → 🧱 Mat look')] };
    if (k === 'jobs') return { tag, d: [L('소방서, 우체국, 도서관 안에서 ', 'Inside the fire station, post office or library, '), K('E'), ' = ' + nm], t: [L('소방서, 우체국, 도서관 안에서 ', 'Inside the fire station, post office or library, '), ACT, ' = ' + nm] };
    if (k === 'board') return { tag, d: [L('본부 게시판 앞에서 ', 'At the HQ board, '), K('E'), L(' = 이웃 부탁 고르기', ' = pick a request')], t: [L('본부 게시판 앞에서 ', 'At the HQ board, '), ACT, L(' = 이웃 부탁 고르기', ' = pick a request')] };
  }
  return null;
}
const CSS = '.twn-tip{position:fixed;left:50%;bottom:132px;transform:translateX(-50%);z-index:21;display:none;align-items:center;gap:9px;width:max-content;max-width:min(720px,calc(100vw - 24px));box-sizing:border-box;background:#fff8ea;color:#2b2420;border:3px solid #2b2420;box-shadow:0 4px 0 #2b2420;border-radius:12px;padding:8px 14px;font:700 15px/1.45 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;pointer-events:none}'
  + '.twn-tip.on{display:flex;animation:twnTip .25s ease-out both}@keyframes twnTip{from{opacity:0}to{opacity:1}}'
  + '.twn-tip .tg{flex:none;background:#3f8f4e;color:#fff;border-radius:7px;padding:1px 8px;font-size:12px;font-weight:900}'
  + '.twn-tip kbd,.twn-p .hp-k kbd{display:inline-block;min-width:16px;padding:0 7px;margin:0 1px;border:2px solid #2b2420;border-bottom-width:4px;border-radius:7px;background:#fff;color:#2b2420;font:900 13px/1.5 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;text-align:center;vertical-align:middle}'
  + '.twn-tip .tc,.twn-p .hp-k .tc{display:inline-block;padding:0 8px;margin:0 1px;border:2px solid #2b2420;border-radius:9px;background:#fff;color:#2b2420;font-size:13px;font-weight:800;line-height:1.6;vertical-align:middle;white-space:nowrap}'
  + '.twn-tip .tbw,.twn-p .hp-k .tbw{display:inline-flex;align-items:center;gap:4px;vertical-align:middle;white-space:nowrap;font-size:13px;font-weight:800}'
  + '.twn-tip .tb,.twn-p .hp-k .tb{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#1d3557;color:#fff;border:2px solid #fff;box-shadow:0 0 0 2px #1d3557;font-style:normal;font-size:14px;line-height:1}'
  + '.twn-p .hp-k .tj{position:relative;display:inline-block;width:22px;height:22px;border-radius:50%;border:3px solid #1d3557;box-sizing:border-box}.twn-p .hp-k .tj b{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#1d3557}'
  + 'body.touch .twn-tip{bottom:calc(168px + env(safe-area-inset-bottom))}body.touch.small .twn-tip{bottom:calc(148px + env(safe-area-inset-bottom));max-width:min(560px,calc(100vw - 24px));font-size:14px;padding:6px 11px}'
  + '@media (orientation:portrait){body.touch.small .twn-tip{bottom:calc(218px + env(safe-area-inset-bottom))}}'
  + '.twn-p[data-k=help]{--rib:#2f6f9f}.twn-p .hp-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));column-gap:18px;margin:0 0 4px}'
  + '.twn-p .hp-r{display:flex;align-items:center;gap:10px;padding:6px 2px;border-bottom:1px dashed var(--line);min-height:34px}'
  + '.twn-p .hp-k{flex:0 0 150px;display:flex;flex-wrap:wrap;gap:3px;align-items:center}.twn-p .hp-n{font-weight:900;margin-right:6px}.twn-p .hp-d{font-size:13px;color:var(--mut)}'
  + '.twn-p .hp-new{font-style:normal;background:#c8553d;color:#fff;border-radius:6px;padding:0 6px;margin-left:6px;font-size:11px;vertical-align:1px}'
  + 'body.touch .twn-p .hp-g{grid-template-columns:1fr}body.touch .twn-p .hp-k{flex-basis:128px}';

export function createTips(A) {
  const en = () => A.lang() === 'en', tch = () => !!A.touch(), now0 = performance.now();
  const S = () => { const G = A.GAME.S; let t = G.tips; if (!t || typeof t !== 'object' || Array.isArray(t)) t = G.tips = { s: {}, nw: {} }; if (!t.s || typeof t.s !== 'object') t.s = {}; if (!t.nw || typeof t.nw !== 'object') t.nw = {}; return t; };
  const seen = id => !!S().s[id];
  const Q = [], ST = { acc: 0, n: 0, cur: null, curAt: 0, curDur: 0, lastHide: -1e9, lastBusy: -1e9, shows: [], walk: 0, lx: NaN, lz: NaN, t0: now0, ci: 0, cn: 0, log: [], skew: 0 }, CIRC = new Float32Array(CN * 2);
  let EL = null, CSSEL = null, dead = false;
  function ensure() { if (EL) return; CSSEL = document.createElement('style'); CSSEL.textContent = CSS; document.head.appendChild(CSSEL); EL = document.createElement('div'); EL.className = 'twn-tip'; EL.setAttribute('role', 'status'); EL.setAttribute('aria-live', 'polite'); document.body.appendChild(EL); }
  function log(id, k) { ST.log.push([id, k, Math.round((performance.now() - now0 + ST.skew) / 100) / 10]);   /* 초(시험의 시간 건너뛰기 포함) */ if (ST.log.length > 60) ST.log.shift(); }
  function mark(id) { const t = S(); if (t.s[id]) return; t.s[id] = (A.GAME.S.day | 0) || 1; A.GAME.mark(); }
  function want(id, o) { if (dead || seen(id) || (ST.cur && ST.cur.id === id)) return false; for (const q of Q) if (q.id === id) return false; const now = performance.now(); Q.push({ id, pri: (o && o.pri) || PRI[id] || PRI.u, t0: now, exp: o && o.exp ? now + o.exp : 0, keys: (o && o.keys) || null }); log(id, 'want'); return true; }
  /* 스스로 썼음 = 안내 X(지금 떠 있으면 내림 = 봤음) */
  function used(id) { if (dead || seen(id)) return; mark(id); for (let i = Q.length - 1; i >= 0; i--) if (Q[i].id === id) Q.splice(i, 1); if (ST.cur && ST.cur.id === id) hide(true); log(id, 'used'); }
  function plain(h) { return h.replace(/<[^>]+>/g, ''); }
  function html(q) { const d = TIP(q.id, en(), q); if (!d) return null; const P = tch() ? d.t : d.d; if (!P) return null; return { h: (d.tag ? '<span class="tg">' + d.tag + '</span>' : '') + '<span class="tx">' + P.join('') + '</span>', n: plain(P.join('')).length }; }
  function show(q, now) { const h = html(q); if (!h) { mark(q.id); return false; } ensure(); EL.innerHTML = h.h; EL.classList.remove('on'); void EL.offsetWidth; EL.classList.add('on'); ST.cur = q; ST.curAt = now; ST.curDur = Math.max(6000, Math.min(9500, 4600 + h.n * 70)); ST.shows.push(now); log(q.id, 'show'); return true; }
  function hide(done) { const q = ST.cur; if (!q) return; if (EL) EL.classList.remove('on'); const now = performance.now(), el = now - ST.curAt; ST.cur = null;
    if (done || el >= SEEN_MS) { ST.lastHide = now; mark(q.id); if (q.keys) for (const k of q.keys) mark('u:' + k); log(q.id, 'seen'); } else { Q.unshift(q); ST.shows.pop(); log(q.id, 'back'); } }   /* 1.5초 안에 창이 덮으면 맨 앞에 다시(셈·20초 간격도 되돌림 — 창이 닫히고 1.5초 뒤 다시) */
  const near = (L9, x, z, r, ex) => { if (!L9) return false; const r2 = r * r; for (const p of L9) { const px = ex ? p.ex : p[0], pz = ex ? p.ez : p[1]; if ((px - x) * (px - x) + (pz - z) * (pz - z) < r2) return true; } return false; };
  function valid(q, now) { const id = q.id, me = A.me();
    if (q.exp && now > q.exp) return false;
    switch (id) {
      case 'mouse': return !!document.pointerLockElement && !tch() && A.mouseMode() !== 'drag';
      case 'bike': return A.hudOn('bike') && !A.bike() && A.out();
      case 'bus': return A.hudOn('bus') && A.out() && near(A.stops(), me.x, me.z, 14, false);
      case 'subway': return A.hudOn('subway') && A.out() && near(A.stations(), me.x, me.z, 14, true);
      case 'umb': return A.raining() && A.umbOk() && !A.umbOpen() && A.out();
      case 'lost': return now - q.t0 < 60000 && !A.route() && A.out();
      case 'sleep': return A.night();
    }
    if (id.startsWith('u:')) return !A.toastOn();   /* 친구 말·알림(위 가운데)이 끝난 뒤에 */
    return true; }
  function noteUse(now) { if (A.bike()) used('bike'); if (A.umbOpen()) used('umb'); const r = A.riding(); if (r === 'bus') used('bus'); else if (r === 'sub') used('subway'); const pk = A.panelK(); if (pk === 'I') used('bag'); else if (pk === 'help') used('help'); void now; }
  function circ(me) { const i = ST.ci * 2; CIRC[i] = me.x; CIRC[i + 1] = me.z; ST.ci = (ST.ci + 1) % CN; if (ST.cn < CN) ST.cn++; if (ST.cn < CN / 2) return false;   /* 30초 넘게 모였을 때부터 */
    const n = ST.cn, s0 = (ST.ci - n + CN) % CN; let len = 0, px = CIRC[s0 * 2], pz = CIRC[s0 * 2 + 1], mx = 0; const x0 = px, z0 = pz;
    for (let k = 1; k < n; k++) { const j = ((s0 + k) % CN) * 2, x = CIRC[j], z = CIRC[j + 1], d = Math.hypot(x - px, z - pz); if (d > 24) return false;   /* 2초에 24m 넘게 = 순간이동·탈것 */ len += d; px = x; pz = z; const r = Math.hypot(x - x0, z - z0); if (r > mx) mx = r; }
    return len >= 90 && mx <= 25; }   /* 1분 안에 90m 넘게 움직였는데 처음 자리에서 25m 밖으로 못 나감 = 같은 곳을 맴돎 */
  function circReset() { ST.cn = 0; ST.ci = 0; }
  function sec() { if (dead) return; const now = performance.now(), me = A.me(); ST.n++;
    noteUse(now);
    if (A.SET.tips === false || A.off()) { if (ST.cur) { if (EL) EL.classList.remove('on'); Q.unshift(ST.cur); ST.cur = null; ST.shows.pop(); } return; }
    const walk = A.out() && A.roam() && !A.bike();   /* 걸어서 다닌 거리(탈것·실내·놀이 X · 0.5초에 5m 넘게 = 순간이동이라 셈 X) */
    if (walk && Number.isFinite(ST.lx)) { const d = Math.hypot(me.x - ST.lx, me.z - ST.lz); if (d < 5) ST.walk += d; }
    if (walk) { ST.lx = me.x; ST.lz = me.z; } else ST.lx = NaN;
    if (!seen('bike') && ST.walk > 100 && A.hudOn('bike') && !A.bike()) want('bike');
    if (A.out()) { if (!seen('bus') && A.hudOn('bus') && near(A.stops(), me.x, me.z, 10, false)) want('bus'); if (!seen('subway') && A.hudOn('subway') && near(A.stations(), me.x, me.z, 10, true)) want('subway'); }
    if (!seen('umb') && A.raining() && A.umbOk() && !A.umbOpen() && A.out()) want('umb');
    if (!seen('bag') && A.bagHas()) want('bag');
    if (!seen('sleep') && A.night() && A.out()) want('sleep');
    if (!seen('help') && now - ST.t0 > (tch() ? 240000 : 150000) && (tch() || A.keysFold())) want('help');
    if (ST.n % 4 === 0) { if (A.out() && (A.roam() || A.bike()) && !A.busy()) { if (!seen('lost') && circ(me) && !A.route()) { want('lost'); circReset(); } } else circReset(); }   /* 2초마다 · 창·실내·놀이 동안은 처음부터 */
    const busy = A.busy() || A.banner();
    if (busy) ST.lastBusy = now;
    if (ST.cur) { if (busy) hide(false); else if (now - ST.curAt > ST.curDur) hide(true); return; }
    if (busy || now - ST.lastBusy < 1500 || now - ST.t0 < 4000 || now - ST.lastHide < GAP) return;
    while (ST.shows.length && now - ST.shows[0] > WIN) ST.shows.shift();
    if (ST.shows.length >= CAP) return;
    for (let i = Q.length - 1; i >= 0; i--) { const q = Q[i]; if (seen(q.id) || (q.exp && now > q.exp)) Q.splice(i, 1); else if (DROP[q.id] && !valid(q, now)) Q.splice(i, 1); }
    let b = null; for (const q of Q) if (valid(q, now) && (!b || q.pri > b.pri)) b = q;
    if (!b) return; Q.splice(Q.indexOf(b), 1); show(b, now); }
  function tick(dt) { if (dead) return; ST.acc += dt; if (ST.acc < 0.5) return; ST.acc = 0; sec(); }
  /* INTUIT-1 막마다 열림 — town.js hudUnlock이 부름(조용히 열린 것 = 선생님·?all=1·예전 판은 부르지 않음) */
  function unlocked(L9) { if (dead || !L9 || !L9.length) return; const t = S(); for (const k of L9) t.nw[k] = 1; A.GAME.mark(); const U = L9.filter(k => UNL[k]);
    if (L9.length >= 2 && U.length !== 1) want('u:' + L9.join('+'), { pri: PRI.u, exp: 600000, keys: L9.slice() }); else if (U.length === 1) want('u:' + U[0], { pri: PRI.u, exp: 600000 }); }
  const onKey = e => { if (dead || e.repeat) return; const t9 = e.target; if (t9 && /INPUT|TEXTAREA|SELECT/.test(t9.tagName)) return; const id = { Tab: 'mouse', KeyB: 'bike', KeyU: 'umb', KeyI: 'bag', KeyJ: 'lost', KeyH: 'help' }[e.code]; if (id && (id !== 'bike' || A.hudOn('bike'))) used(id); };
  const onLock = () => { if (!dead && document.pointerLockElement && !tch() && !seen('mouse')) want('mouse'); };
  addEventListener('keydown', onKey, true); document.addEventListener('pointerlockchange', onLock);
  // ───── ⌨ 조작 도움 창 — 표 하나(지금 열린 것만) · 데스크톱 = 키 그림 · 터치 = 단추 그림 ─────
  function rows() { const e9 = en(), t9 = tch(), H = A.hudOn, L = (ko, e) => (e9 ? e : ko), M = C('☰ ' + L('메뉴', 'Menu')), R = [];
    const g = n => R.push([n]), r = (pic, n, d, nk) => R.push([null, pic, n, d, nk || '']), drag = A.mouseMode() === 'drag';
    g(L('움직이기', 'Moving'));
    if (t9) { r(TJ(L('이동', 'Move')), L('걷기와 달리기', 'Walk and run'), L('왼쪽 아래를 누른 채 밀어요. 끝까지 밀면 달려요', 'Hold and push at the bottom left. Push to the edge to run'));
      r(C(L('화면 끌기', 'Drag')), L('둘러보기', 'Look around'), L('오른쪽 화면을 끌어요', 'Drag the right side of the screen'));
      r(C(L('두 손가락', 'Two fingers')), L('카메라 거리', 'Camera distance'), L('두 손가락을 벌리거나 오므려요', 'Spread or pinch two fingers'));
      r(TB('⤴'), L('점프', 'Jump'), L('오른쪽 아래 둥근 단추', 'Round button at the bottom right')); r(TB('👁'), L('1인칭', 'First person'), L('내 눈으로 봐요. 한 번 더 누르면 돌아와요', 'See through your eyes. Tap again to come back')); }
    else { r(K('W') + K('A') + K('S') + K('D'), L('걷기', 'Walk'), L('방향키로도 걸어요', 'Arrow keys work too')); r(K('Shift'), L('달리기', 'Run'), L('걸으면서 누르고 있어요', 'Hold while walking')); r(K('Space'), L('점프', 'Jump'), '');
      r(K(drag ? L('끌기', 'Drag') : L('마우스', 'Mouse')), L('둘러보기', 'Look around'), drag ? L('화면을 누른 채 끌어요', 'Hold and drag the screen') : L('마우스를 움직여요', 'Move the mouse'));
      r(K(L('휠', 'Wheel')), L('카메라 거리', 'Camera distance'), L('휠을 굴리면 멀어지고 가까워져요', 'Roll the wheel to zoom out and in')); r(K('V'), L('1인칭', 'First person'), L('내 눈으로 봐요. 한 번 더 누르면 돌아와요', 'See through your eyes. Press again to come back'));
      g(L('마우스', 'Mouse'));
      if (!drag) r(K('Tab'), L('마우스 보이기', 'Show the mouse'), L('단추를 누를 때 써요. 화면을 누르면 다시 둘러봐요', 'Use it to click buttons. Click the screen to look around again'), 'mouse');
      r(K('Esc') + K('P'), L('잠깐 멈춤', 'Pause'), L('멈춤 창이 열려요', 'Opens the pause window'));
      r(M, L('마우스 방식', 'Mouse style'), drag ? L('메뉴의 👀 단추로 「움직이면 둘러보기」로 바꿔요', 'Switch to “move to look” with the 👀 button in the menu') : L('메뉴의 👀 단추로 「끌어서 둘러보기」로 바꿔요', 'Switch to “drag to look” with the 👀 button in the menu')); }
    g(L('하기', 'Doing'));
    r(t9 ? TB('✋', L('행동', 'Action')) : K('E'), L('말 걸기와 들어가기', 'Talk and go in'), t9 ? L('노랗게 빛나면 눌러요. 할 수 있는 일이 아래에 떠요', 'Tap when it glows yellow. What you can do shows below') : L('가까이 가면 할 수 있는 일이 아래에 떠요', 'Get close and what you can do shows below'));
    r(t9 ? C(L('왼쪽 위 이야기 줄', 'Story line, top left')) : K('Q'), L('이야기 수첩', 'Story notebook'), L('할 일과 이야기를 봐요', 'See your tasks and stories'));
    if (A.tools()) r(t9 ? M : K(A.tools()) + K('F'), L('도구', 'Tools'), t9 ? L('메뉴의 🧰 도구로 들면 쓰기 단추가 생겨요', 'Pick one with 🧰 Tools in the menu, then a use button appears') : L('숫자로 들고 겨눈 곳에 F나 클릭으로 써요', 'Pick one with a number, then press F or click where you aim'));
    r(t9 ? C('☂ ' + L('우산', 'Umbrella')) : K('U'), L('우산', 'Umbrella'), t9 ? L('비 오는 날 오른쪽 위에 생겨요', 'Shows at the top right on rainy days') : L('비 오는 날 펴고 접어요', 'Open and close it on rainy days'), 'umb');
    r(t9 ? C('🔔 ' + L('따르릉', 'Ring')) : K('R'), L('따르릉', 'Bell'), L('자전거를 탈 때 울려요', 'Ring it while riding'));
    if (A.snow() && H('wx')) r(t9 ? C('⛄ ' + L('눈사람', 'Snowman')) : K('N'), L('눈사람', 'Snowman'), L('눈 오는 날 만들어요', 'Make one on snowy days'));
    r(t9 ? M : K('O'), L('사진 찍기', 'Photo mode'), t9 ? L('메뉴의 📷 사진 찍기', '📷 Photo in the menu') : L('Space로 찍고 Esc로 나와요', 'Space takes a photo, Esc leaves'));
    g(L('다니기', 'Getting around'));
    r(t9 ? M : K('B'), L('자전거', 'Bike'), t9 ? L('메뉴의 🚲 자전거 타기를 눌러요. 내릴 때는 오른쪽 위 내리기 단추를 눌러요', 'Tap 🚲 Bike in the menu. Tap Get off at the top right to stop') : L('한 번 더 누르면 내려요', 'Press again to get off'), 'bike');
    if (H('mini')) r(t9 ? C('🗺 ' + L('지도', 'Map')) : C(L('작은 지도', 'Small map')), L('작은 지도', 'Small map'), t9 ? L('누르면 펼쳐지고 접혀요', 'Tap to open or fold it') : L('오른쪽 위에 있어요. 누르면 큰 지도가 열려요', 'At the top right. Click it for the big map'), 'mini');
    if (H('map')) r(t9 ? M : K('M'), L('큰 지도', 'Big map'), t9 ? L('메뉴의 🗺 큰 지도를 눌러요. 작은 지도를 눌러도 열려요', 'Tap 🗺 Big map in the menu, or tap the small map') : L('가고 싶은 곳을 찾아봐요', 'Find where you want to go'), 'map');
    if (H('find')) r(t9 ? M : K('F'), L('장소 찾기', 'Place finder'), L('이름을 쓰면 빨간 선이 길을 알려 줘요', 'Type a name and a red line shows the way'), 'find');
    r(t9 ? M : K('J'), L('바로 가기와 찾기', 'Jump and search'), L('장소 이름을 쓰고 Enter를 누르면 빨간 선이 생겨요. 순간이동은 하루 5번이에요', 'Type a place and press Enter for a red line. Quick trips: 5 a day'), 'lost');
    if (H('bus')) r(C('🚌 ' + L('정류장', 'Bus stop')) + (t9 ? TB('✋') : K('E')), L('버스', 'Bus'), L('정류장에서 갈 곳을 골라요', 'Pick where to go at the stop'), 'bus');
    if (H('subway')) r(C('🚇 ' + L('역 입구', 'Station')) + (t9 ? TB('✋') : K('E')), L('지하철', 'Subway'), L('역 입구에서 내릴 역을 골라요', 'Pick your stop at the entrance'), 'subway');
    r(M, L('하늘에서 보기', 'Sky view'), L('메뉴의 🛰 단추로 마을 전체를 내려다봐요', 'See the whole town with 🛰 in the menu'));
    if (H('look')) r(t9 ? M : K('Y'), L('판 모습', 'Mat look'), L('우리가 만든 판 모습으로 바꿔요', 'Switch to the mat we built'), 'look');
    g(L('가방과 하루', 'Bag and day'));
    r(t9 ? M : K('I'), L('가방', 'Bag'), t9 ? L('메뉴의 🎒 가방에서 모은 것을 보고 먹거나 나눠요', '🎒 Bag in the menu: see, eat or share what you collected') : L('모은 것을 보고 먹거나 나눠요', 'See, eat or share what you collected'), 'bag');
    if (H('tasks')) r(C(L('왼쪽 할 일 줄', 'Task line, left')), L('오늘 할 일', 'Today’s tasks'), L('누르고 📋 할 일 칸을 봐요', 'Tap it and open the 📋 Tasks tab'), 'tasks');
    if (H('wx')) r(C(t9 ? '☰ ' + L('메뉴', 'Menu') : L('날씨와 시계', 'Weather and clock')), L('날씨와 시계', 'Weather and clock'), t9 ? L('메뉴 위쪽에 오늘 날씨가 보여요', 'Today’s weather shows at the top of the menu') : L('오른쪽 위를 누르면 오늘과 내일 날씨를 봐요', 'Click it at the top right for today and tomorrow'), 'wx');
    r(M, L('자기', 'Sleep'), L('우리 집 침대나 메뉴의 😴 단추로 다음 날 아침이 돼요. 밤 12시가 되면 저절로 자요', 'Sleep in your bed or use 😴 in the menu to reach the next morning. At midnight you fall asleep anyway'), 'sleep');
    r(C(L('저절로', 'Automatic')), L('저장', 'Saving'), A.where(e9) + L(' 메뉴 아래에 저장한 때가 보여요', ' The menu shows when it was saved'));
    if (H('pass')) r(t9 ? C(L('이야기 줄', 'Story line')) : K('Q'), L('마을 여권', 'Town passport'), L('수첩의 🛂 여권 칸에 도장이 모여요', 'Stamps gather in the 🛂 Passport tab'), 'pass');
    if (H('dex')) r(M, L('도감', 'Codex'), L('찾은 것이 모두 모여요', 'Everything you find is there'), 'dex');
    if (H('skill')) r(M, L('내 솜씨', 'Skills'), H('rank') ? L('할수록 솜씨가 늘어요. 승급 미션도 여기서 골라요', 'Skills grow as you do things. Pick skill missions here too') : L('할수록 솜씨가 늘어요', 'Skills grow as you do things'), 'skill');
    if (H('jobs')) r(t9 ? TB('✋') : K('E'), L('직업 체험', 'Job experience'), L('소방서, 우체국, 도서관 안에서 해요', 'Inside the fire station, post office or library'), 'jobs');
    if (H('board')) r(t9 ? TB('✋') : K('E'), L('의뢰 게시판', 'Request board'), L('본부 게시판 앞에서 이웃 부탁을 골라요', 'Pick a neighbour’s request at the HQ board'), 'board');
    if (H('quiz')) r(t9 ? TB('✋') : K('E'), L('보너스 문제', 'Bonus questions'), L('낮에 일꾼 곁에 가면 물어봐요', 'Workers ask you in the daytime'), 'quiz');
    if (H('together')) r(M, L('함께하기', 'Play together'), L('메뉴의 👥 함께하기로 친구와 같은 방에 들어가요', 'Join friends with 👥 Together in the menu'), 'together');
    r(t9 ? M : K('H'), L('조작 도움', 'Controls'), t9 ? L('지금 보는 이 창이에요. 메뉴의 ❓ 단추로 열어요', 'This window. Open it with ❓ in the menu') : L('이 창이에요. 아래 키 줄을 눌러도 열려요', 'This window. Clicking the key line opens it too'), 'help');
    return R; }
  function help() { if (dead || A.blocked()) return false; ensure(); const e9 = en(), t9 = tch(), L = (ko, e) => (e9 ? e : ko), nw = { ...S().nw }, R = rows();
    let h = '<h3>⌨ ' + L('조작 도움', 'Controls') + '</h3>' + (A.hudAll() ? '' : '<div class="sm" style="margin:-2px 2px 6px">' + L('지금 쓸 수 있는 것만 보여요. 이야기를 따라가면 하나씩 더 생겨요.', 'Only what you can use now. More appears as the story goes on.') + '</div>'), open = false;
    for (const q of R) { if (!q[1] && q[0]) { h += (open ? '</div>' : '') + '<div class="grp">' + q[0] + '</div><div class="hp-g">'; open = true; continue; }
      h += '<div class="hp-r" data-hk="' + q[4] + '"><span class="hp-k">' + q[1] + '</span><span><b class="hp-n">' + q[2] + (q[4] && nw[q[4]] ? '<em class="hp-new">' + L('새로', 'New') + '</em>' : '') + '</b><span class="hp-d">' + q[3] + '</span></span></div>'; }
    h += (open ? '</div>' : '') + '<div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-top:8px"><button class="sub" data-hp="tips">💡 ' + (A.SET.tips === false ? L('처음 쓸 때 한 줄 안내 켜기', 'Turn on first-time tips') : L('처음 쓸 때 한 줄 안내 끄기', 'Turn off first-time tips')) + '</button>'
      + (t9 ? '' : '<button class="sub" data-hp="keys">' + (A.keysFold() ? L('아래 키 줄 펼치기', 'Show the key line') : L('아래 키 줄 접기', 'Fold the key line')) + '</button>') + '<button data-hp="x">' + L('닫기', 'Close') + '</button></div>';
    const P9 = A.openP(h, false, 'help'); if (!P9) return false; const bx = P9.querySelector('.bx'); if (bx) bx.style.width = t9 ? 'min(640px,94vw)' : 'min(900px,96vw)';
    P9.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('button[data-hp]'); if (!b) return; const a = b.dataset.hp; ev.stopPropagation();
      if (a === 'x') { A.closeP(); return; } if (a === 'tips') { A.setSet({ tips: A.SET.tips === false }); if (A.SET.tips === false && ST.cur) hide(true); } else if (a === 'keys') A.keysShow(A.keysFold()); const sc = bx ? bx.scrollTop : 0; help(); const b2 = A.panelEl() && A.panelEl().querySelector('.bx'); if (b2) b2.scrollTop = sc; });
    S().nw = {}; A.GAME.mark(); used('help'); log('help', 'open'); return true; }
  function stop() { dead = true; removeEventListener('keydown', onKey, true); document.removeEventListener('pointerlockchange', onLock); if (EL) EL.remove(); if (CSSEL) CSSEL.remove(); EL = CSSEL = null; }
  const api = { info: () => ({ cur: ST.cur ? ST.cur.id : null, on: !!(EL && EL.classList.contains('on')), text: EL && ST.cur ? EL.innerText.replace(/\s+/g, ' ').trim() : '', q: Q.map(q => q.id), seen: { ...S().s }, nw: { ...S().nw }, shows5: ST.shows.length, walk: +ST.walk.toFixed(1), circ: ST.cn, log: ST.log.slice(), off: A.SET.tips === false, why: { out: A.out(), roam: A.roam(), bike: A.bike(), busy: A.busy(), route: A.route() } }),
    want: (id, o) => want(id, o), used: id => used(id), spots: () => ({ bus: (A.stops() || []).map(q => [q[0], q[1]]), sub: (A.stations() || []).map(q => [q.ex, q.ez]) }), sec: () => sec(), help: () => help(), rows: () => rows().filter(q => q[1]).map(q => q[4] + ':' + plain(q[2])), unlocked: L9 => unlocked(L9),
    age: ms => { ST.skew += ms; ST.t0 -= ms; ST.lastHide -= ms; ST.lastBusy -= ms; for (let i = 0; i < ST.shows.length; i++) ST.shows[i] -= ms; for (const q of Q) { q.t0 -= ms; if (q.exp) q.exp -= ms; } if (ST.cur) ST.curAt -= ms; },   /* 시험: 시간 건너뛰기(안내 사이·5분 셈) */
    reset: () => { A.GAME.S.tips = { s: {}, nw: {} }; Q.length = 0; ST.shows.length = 0; ST.lastHide = ST.lastBusy = -1e9; ST.walk = 0; ST.lx = NaN; circReset(); if (ST.cur) { if (EL) EL.classList.remove('on'); ST.cur = null; } ST.log.length = 0; } };
  return { tick, sec, want, used, unlocked, help, stop, api };
}
