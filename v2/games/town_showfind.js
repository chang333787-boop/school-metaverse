// 🎬 쇼 뒤 '본 것 하나 찾기'(DEPTH-3 · docs/systems/town_depth.md 쇼 줄 · 사용자 10-25 '깊이가 한 칸 · 가서 E 누르는 것도 싫고')
//   쇼(town_show.js)를 끝까지 보면 = 쇼에서 말한 특징 하나를 들려줌 → 그 곳의 실제 전시 가운데 맞는 것을 걸어가 E로 살펴보고 '이거예요'를 고름
//   판마다 묻는 것이 다름(씨앗 = 쇼 · 날 · 몇 번째 · 최근 두 번 물은 것은 다시 안 물음) · 두 번 찾은 뒤 = 둘째 칸 물음(말을 바꿔 묻기 · 갖춘탈바꿈처럼 생각해서 잇기)
//   틀려도 벌 X — '그건 ○○예요'와 그 전시가 무엇인지 한 줄 → 다시 찾기 · 맞히면 도감(dex sf:<전시>) · 일기 한 줄 · 전시 받침에 금빛 표(다음에 와도 보임) · 솜씨(꼬리표 show:<쇼>)
//   곳 셋: 🐠 대형 아쿠아리움 방(있는 방에 수조 넷을 더함 · deco) · 🦋 곤충 박물관 방(새 방 · 곤충 박물관은 예전엔 들어가지 않았음) · 🐾 천연기념물 보호 센터 관찰 데크(건물이 없는 구역 · 바깥에 전시 넷)
//   지킴: 사실만(4학년 · 쇼에서 말한 것과 같은 결) · 판타지 X · 실명 X · 숫자 체크칸 X · 매 프레임 일 0(1초 칸 sec · 이벤트) · 새 Light X · 방 = 들어갈 때만 지음 · 데크 = 합친 부품 둘 + 팻말 하나
export const SF_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = s => { let a = hashS(s) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b; };   /* 받침 있으면 a */

// 전시: id · 아이콘(창 제목 앞 하나) · 이름 · 본 것 두 줄(모형을 보면 보이는 것) · 틀렸을 때 '그건 ○○예요' 뒤 한 줄
// 물음: id · 맞는 전시 · 칸(1 = 쇼에서 들은 말 그대로 · 2 = 말을 바꾸거나 생각해서 잇기) · 들은 말
export const HALLS = {
  aquarium: { kind: 'aqua', where: T2('대형 아쿠아리움 안', 'inside the Aquarium'),
    ex: [
      { id: 'jelly', ic: '💡', t: T2('빛 해파리 수조', 'Glowing jellyfish tank'), see: [T2('둥근 우산 모양 몸 아래로 가는 촉수가 늘어져 있어요.', 'Thin tentacles hang under a round, umbrella-shaped body.'), T2('몸 가장자리가 분홍빛으로 반짝여요.', 'The edge of the body glows pink.')], why: T2('몸에서 빛을 내는 해파리예요', 'they are jellyfish that make their own light') },
      { id: 'turtle', ic: '🐢', t: T2('바다거북 수조', 'Sea turtle tank'), see: [T2('등에 단단한 등딱지가 있어요.', 'It has a hard shell on its back.'), T2('앞다리가 노처럼 넓적해서 물을 밀며 헤엄쳐요.', 'Its front legs are flat like oars and push the water as it swims.')], why: T2('먼 바다를 여행하는 바다거북이에요', 'it is a sea turtle that travels the open sea') },
      { id: 'whale', ic: '🐋', t: T2('혹등고래 노래 듣기', 'Listen to a humpback whale'), see: [T2('앞지느러미가 몸 길이의 3분의 1쯤으로 아주 길어요.', 'Its front flippers are very long — about a third of its body.'), T2('곁에 귀를 대는 관이 있어요. 낮은 노래가 길게 들려요.', 'There is a listening tube beside it. A long, low song comes out.')], why: T2('물속에서 노래하는 혹등고래예요', 'it is a humpback whale that sings under water') },
      { id: 'deep', ic: '🔦', t: T2('깊은 바다 수조', 'Deep sea tank'), see: [T2('수조 안이 거의 깜깜해요.', 'It is almost pitch dark inside.'), T2('작은 불빛 몇 개만 깜빡여요. 스스로 빛을 내는 물고기예요.', 'Only a few tiny lights blink. They are fish that make their own light.')], why: T2('햇빛이 닿지 않는 깊은 바다를 꾸민 곳이에요', 'it shows the deep sea where sunlight cannot reach') } ],
    qs: [
      { id: 'a1', ex: 'jelly', lv: 1, c: T2('몸에서 빛을 내서 다가오는 적을 놀라게 하는 친구', 'the friend that makes light to startle animals coming to eat it') },
      { id: 'a2', ex: 'turtle', lv: 1, c: T2('모래밭에서 태어나 먼 바다를 여행하는 친구', 'the friend that hatches on a sandy beach and travels the open sea') },
      { id: 'a3', ex: 'whale', lv: 1, c: T2('물속에서 노래를 해서 멀리 있는 친구에게 소리를 전하는 친구', 'the friend that sings under water to reach friends far away') },
      { id: 'a4', ex: 'deep', lv: 1, c: T2('햇빛이 닿지 않아 깜깜한 곳', 'the place so deep that sunlight cannot reach it') },
      { id: 'a5', ex: 'turtle', lv: 2, c: T2('수천 km를 헤엄치고도 알을 낳으러 태어난 바닷가 근처로 돌아오는 친구', 'the friend that swims thousands of km and still comes back near its home beach to lay eggs') },
      { id: 'a6', ex: 'whale', lv: 2, c: T2('소리가 공기보다 물속에서 더 빠르고 멀리 간다는 것을 알려 준 친구', 'the friend that showed sound goes faster and farther in water than in air') },
      { id: 'a7', ex: 'jelly', lv: 2, c: T2('깜깜한 물속에서 번쩍여 몸을 지키는 친구', 'the friend that flashes in the dark water to protect itself') },
      { id: 'a8', ex: 'deep', lv: 2, c: T2('어떤 바다 생물이 스스로 빛을 내야 하는 까닭이 된 곳', 'the place that is the reason some sea animals make their own light') } ] },
  butterfly: { kind: 'insect', where: T2('곤충 박물관 안', 'inside the Insect Museum'),
    ex: [
      { id: 'egg', ic: '🥚', t: T2('배추흰나비 알', 'Cabbage white eggs'), see: [T2('배추 잎 위에 노란 알이 하나씩 떨어져 붙어 있어요.', 'Yellow eggs sit one by one on a cabbage leaf.'), T2('알은 옥수수 알처럼 길쭉하게 서 있어요.', 'Each egg stands up, long like a corn kernel.')], why: T2('한살이의 맨 처음, 알 때예요', 'this is the very first stage, the egg') },
      { id: 'larva', ic: '🐛', t: T2('애벌레와 허물', 'Caterpillar and shed skins'), see: [T2('초록 애벌레 곁에 쭈글쭈글한 허물 넷이 놓여 있어요.', 'Four wrinkled shed skins lie next to a green caterpillar.'), T2('허물은 뒤로 갈수록 커요.', 'The skins get bigger one after another.')], why: T2('알에서 나와 잎을 먹고 자라는 때예요', 'this is the stage that hatches and grows by eating leaves') },
      { id: 'pupa', ic: '🌿', t: T2('번데기', 'Pupa'), see: [T2('나뭇가지에 하얀 실로 몸을 붙이고 매달려 있어요.', 'It hangs on a twig, fixed with a white silk thread.'), T2('입도 다리도 움직이지 않아요.', 'Its mouth and legs do not move.')], why: T2('어른벌레가 되기 전, 움직이지 않고 기다리는 때예요', 'this is the still, waiting stage before the adult') },
      { id: 'adult', ic: '🦋', t: T2('배추흰나비 어른벌레', 'Adult cabbage white'), see: [T2('하얀 날개에 검은 점이 있어요.', 'It has white wings with black spots.'), T2('꽃에 앉아 긴 대롱 입을 꽂고 있어요.', 'It sits on a flower with its long tube mouth inside.')], why: T2('날개가 다 자란 마지막 때예요', 'this is the last stage, with grown wings') },
      { id: 'beetle', ic: '🐞', t: T2('장수풍뎅이 한살이', 'Rhinoceros beetle life cycle'), see: [T2('굼벵이 같은 애벌레, 번데기, 뿔 달린 어른벌레가 나란히 있어요.', 'A grub-like larva, a pupa and a horned adult sit side by side.'), T2('장수풍뎅이도 번데기 때가 있어요.', 'The rhinoceros beetle has a pupa stage too.')], why: T2('배추흰나비가 아닌 다른 곤충이에요. 번데기 때가 있어요', 'this is a different insect from the cabbage white. It has a pupa stage') },
      { id: 'fly', ic: '🔍', t: T2('잠자리 한살이', 'Dragonfly life cycle'), see: [T2('물속에 사는 애벌레(수채)와 날개 넷 달린 잠자리가 있어요.', 'There is a water-living larva (nymph) and a dragonfly with four wings.'), T2('번데기 칸은 비어 있어요. 잠자리는 번데기 없이 어른벌레가 돼요.', 'The pupa space is empty. A dragonfly becomes an adult without a pupa.')], why: T2('배추흰나비가 아닌 다른 곤충이에요. 번데기 없이 자라요', 'this is a different insect from the cabbage white. It grows up without a pupa') } ],
    qs: [
      { id: 'b1', ex: 'egg', lv: 1, c: T2('옥수수처럼 길쭉하고 노란빛인 것', 'the thing that is long like corn and yellowish') },
      { id: 'b2', ex: 'larva', lv: 1, c: T2('잎을 먹고 허물을 네 번 벗으며 커지는 것', 'the one that eats leaves and sheds its skin four times as it grows') },
      { id: 'b3', ex: 'pupa', lv: 1, c: T2('실로 몸을 붙이고 아무것도 먹지 않는 때', 'the stage fixed with silk that eats nothing at all') },
      { id: 'b4', ex: 'adult', lv: 1, c: T2('날개를 말린 뒤 날아올라 꽃꿀을 먹는 것', 'the one that dries its wings, flies up and drinks nectar') },
      { id: 'b5', ex: 'egg', lv: 2, c: T2('배추흰나비가 배추 잎에 하나씩 낳은 것', 'what the cabbage white lays one by one on a cabbage leaf') },
      { id: 'b6', ex: 'pupa', lv: 2, c: T2('애벌레와 어른벌레 사이에 있어서 갖춘탈바꿈이라고 부르게 하는 때', 'the stage between larva and adult that makes it “complete metamorphosis”') },
      { id: 'b7', ex: 'beetle', lv: 2, c: T2('배추흰나비처럼 번데기를 거쳐 자라는 다른 곤충(갖춘탈바꿈)', 'another insect that grows through a pupa, like the cabbage white') },
      { id: 'b8', ex: 'larva', lv: 2, c: T2('알에서 나와 맨 먼저 알껍데기를 먹는 것', 'the one that comes out of the egg and eats its eggshell first') } ] },
  otter: { kind: 'deck', where: T2('천연기념물 보호 센터 관찰 데크', 'the viewing deck at the Natural Monument Centre'),
    ex: [
      { id: 'otter', ic: '🐾', t: T2('수달 굴', 'Otter den'), see: [T2('몸이 길고 다리가 짧아요. 발가락 사이에 물갈퀴가 있어요.', 'Its body is long and its legs are short. It has webbed toes.'), T2('굴 앞에 물고기 뼈가 남아 있어요. 밤에 사냥했어요.', 'Fish bones lie by the den — it hunted at night.')], why: T2('물가 굴에 사는 수달이에요', 'it is an otter living in a riverside den') },
      { id: 'clean', ic: '🐟', t: T2('맑은 물 · 흐린 물 수조', 'Clear and cloudy water tanks'), see: [T2('왼쪽 칸은 물이 맑고 물고기가 다섯 마리예요.', 'The left tank is clear and has five fish.'), T2('오른쪽 칸은 물이 흐리고 물고기가 한 마리뿐이에요.', 'The right tank is cloudy and has only one fish.')], why: T2('물이 맑은지에 따라 물고기 수가 다른 것을 견주는 수조예요', 'it compares how many fish live in clear and cloudy water') },
      { id: 'trash', ic: '♻', t: T2('강에서 주운 것', 'Things found in the river'), see: [T2('강에서 주운 비닐, 캔, 낡은 그물이 걸려 있어요.', 'Plastic bags, cans and an old net from the river are hung up.'), T2('「강에 버리지 않아요」 판이 붙어 있어요.', 'A sign says “Keep rubbish out of the river”.')], why: T2('강을 더럽히는 쓰레기를 모아 둔 판이에요', 'it is a board of rubbish that dirtied the river') },
      { id: 'duck', ic: '🦆', t: T2('원앙', 'Mandarin duck'), see: [T2('수컷은 주황빛 날개깃이 돛처럼 서 있어요.', 'The male has orange wing feathers standing up like sails.'), T2('원앙도 천연기념물이에요. 나무 구멍에 둥지를 틀어요.', 'It is a natural monument too, and nests in tree holes.')], why: T2('나무 구멍에 둥지를 트는 원앙이에요', 'it is a mandarin duck that nests in tree holes') } ],
    qs: [
      { id: 'o1', ex: 'otter', lv: 1, c: T2('주로 밤에 물고기를 잡는 동물', 'the animal that mostly catches fish at night') },
      { id: 'o2', ex: 'clean', lv: 1, c: T2('물이 맑아지면 물고기가 늘어난다는 것', 'that more fish live there when the water gets clean') },
      { id: 'o3', ex: 'trash', lv: 1, c: T2('강을 맑게 하려면 치워야 하는 것', 'what we must clear away to make a river clean') },
      { id: 'o4', ex: 'otter', lv: 2, c: T2('먹이가 많아지자 다시 찾아온 동물', 'the animal that came back once there was plenty of food') },
      { id: 'o5', ex: 'clean', lv: 2, c: T2('강물이 더러우면 물고기가 살기 어렵다는 것', 'that fish find it hard to live in dirty water') },
      { id: 'o6', ex: 'duck', lv: 2, c: T2('수달 말고, 나라가 법으로 지키는 다른 동물', 'another animal, not the otter, that the country protects by law') } ] },
};
const exOf = (sh, id) => (HALLS[sh] ? HALLS[sh].ex.find(e => e.id === id) : null);
const qOf = (sh, id) => (HALLS[sh] ? HALLS[sh].qs.find(q => q.id === id) : null);
export const SF_HRS = { insect: [9, 18] };   /* 곤충 박물관(docs/systems/town_hours.md) — 아쿠아리움·데크는 예전 그대로 */

// A: GAME · lang() · esc · openP(h, w, k) · closeP() · panelOpen() · say(t, s, lv) · sfx(k) · tone(…) · skUp(k, n, src) · rec(k, o) · diary(e, t) · room() 지금 방 { kind } | null
//    map · root() 마을 묶음(데크를 여기에 — 다시 지으면 새로) · parts(fn) 합친 부품(실내와 같은 재질) · places() · spot(x, z) 설 수 있는 빈 땅 · gy(x, z) · sign(x, z, ry, 글, y0) · col(상자) 충돌 손잡이 · busy()
export function createShowFind(A) {
  const en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t), map = A.map;
  const S = () => { const g = A.GAME.S; let s = g.sf; if (!s || typeof s !== 'object' || s.v !== SF_V) s = g.sf = { v: SF_V, cur: {}, h: {}, got: {}, n: {}, ex: {} }; for (const k of ['cur', 'h', 'got', 'n', 'ex']) if (!s[k] || typeof s[k] !== 'object') s[k] = {}; return s; };
  const day = () => A.GAME.S.day | 0, mark = () => A.GAME.mark();
  const STAR = {};   /* 지금 지은 방·데크의 금빛 표(전시 id → 묶음) */
  let DECK = null, deckTry = 0, goalT = '', dead = false;

  // ───────── 물음 고르기 ─────────
  function pick(sh, seed) { const H = HALLS[sh], s = S(), n = s.n[sh] | 0, lv = n >= 2 ? 2 : 1, last = s.h[sh] || [];
    let pool = H.qs.filter(q => q.lv === lv && !last.slice(-2).includes(q.id)); if (!pool.length) pool = H.qs.filter(q => !last.slice(-2).includes(q.id)); if (!pool.length) pool = H.qs.slice();
    const lastEx = last.length ? (qOf(sh, last[last.length - 1]) || {}).ex : null, p2 = pool.filter(q => q.ex !== lastEx); if (p2.length) pool = p2;   /* 바로 앞 판과 같은 전시도 피함 */
    const R = rng(seed != null ? String(seed) : 'sf:' + sh + ':' + day() + ':' + n); return pool[Math.floor(R() * pool.length) % pool.length]; }
  function start(sh, from, seed) { const H = HALLS[sh]; if (!H) return null; const s = S(), c = s.cur[sh]; if (c && qOf(sh, c.q)) { tell(sh, c, from, true); return c; }   /* 아직 못 찾은 물음이 있으면 그대로(쇼를 다시 봐도 판이 바뀌지 않음) */
    const q = pick(sh, seed); const cur = { q: q.id, d: day(), t: 0, seen: [] }; s.cur[sh] = cur; mark(); tell(sh, cur, from, false); return cur; }
  function tell(sh, c, from, again) { const H = HALLS[sh], q = qOf(sh, c.q), e = en(), here = A.room() && A.room().kind === H.kind;
    A.say('🎬 ' + (e ? (again ? 'Still to find: ' : 'Find what you saw: ') + '“' + L(q.c) + '” — look ' + (here ? 'around this room' : L(H.where)) + ' and press E' : (again ? '아직 못 찾았어요: ' : '쇼에서 본 것 찾기: ') + '「' + L(q.c) + '」 — ' + (here ? '이 방' : L(H.where)) + '에서 맞는 것을 찾아 E로 살펴봐요'), 6, 1); }
  // 쇼가 끝 장면에 닿음(town_show.js seen)
  function after(sh) { if (!HALLS[sh]) return; const c = start(sh, 'show'), q = c && qOf(sh, c.q), cap = document.querySelector('.twn-p .scap');   /* 쇼 창 자막 아래에도 한 줄(창이 떠 있는 동안 알림은 미뤄지고, 다른 알림에 밀려도 보이게) */
    if (q && cap && cap.parentNode && !cap.parentNode.querySelector('.sf-next')) { const d = document.createElement('div'); d.className = 'sm sf-next'; d.style.cssText = 'text-align:center;margin:6px auto 0;font-weight:800'; const H = HALLS[sh], here = A.room() && A.room().kind === H.kind;
      d.textContent = '🎬 ' + (en() ? 'Next: find “' + L(q.c) + '” ' + (here ? 'in this room' : L(H.where)) : '이제 찾아봐요: 「' + L(q.c) + '」 — ' + (here ? '이 방' : L(H.where)) + '에서'); cap.parentNode.insertBefore(d, cap.nextSibling); } }

  // ───────── 살펴보기 창 ─────────
  function use(k) { const m = /^sf:([a-z]+):([a-z]+)$/.exec(String(k || '')); if (!m) return false; const sh = m[1], id = m[2], X = exOf(sh, id); if (!X) return false; if (A.busy() && !A.panelOpen()) return true; look(sh, id, ''); return true; }
  function look(sh, id, msg) { const X = exOf(sh, id), e = en(), s = S(), c = s.cur[sh], q = c && qOf(sh, c.q), had = !!s.ex[sh + ':' + id];
    if (c && !c.seen.includes(id)) { c.seen.push(id); mark(); }
    const h = '<h3>' + X.ic + ' ' + esc(L(X.t)) + (e ? ' — take a look' : ' 살펴보기') + '</h3>'
      + '<div class="grp">' + (e ? 'What you see' : '본 것') + '</div>' + X.see.map(t => '<div class="pc-tx">' + esc(L(t)) + '</div>').join('')
      + (msg ? '<div class="sm" style="margin:6px 0"><b>' + esc(msg) + '</b></div>' : '')
      + (q ? '<div class="grp">' + (e ? 'What the show said' : '쇼에서 들은 말') + '</div><div class="pc-tx">「' + esc(L(q.c)) + '」</div>'
          + '<div class="row"><button data-a="pick">' + (e ? 'This is it' : '이거예요') + '</button><button class="sub" data-a="x">' + (e ? 'Look at others' : '다른 것도 볼래요') + '</button></div>'
        : '<div class="sm">' + (had ? (e ? 'You found this after a show. The gold mark stays here.' : '쇼를 보고 찾아낸 전시예요. 금빛 표가 남아 있어요.') : (e ? 'Watch the show here first, then come and find what it talked about.' : '이곳 쇼를 보고 나면, 쇼에서 말한 것을 여기서 찾아볼 수 있어요.')) + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>');
    const P = A.openP(h, false, 'sfind'); if (!P) return; P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') A.closeP(); else if (b.dataset.a === 'pick') choose(sh, id); }; }
  function choose(sh, id) { const s = S(), c = s.cur[sh], e = en(); if (!c) { A.closeP(); return; } const q = qOf(sh, c.q); if (!q) { delete s.cur[sh]; mark(); A.closeP(); return; }
    if (id !== q.ex) { c.t = (c.t | 0) + 1; mark(); const X = exOf(sh, id); if (A.sfx) A.sfx('tick'); A.rec('show', { id: sh, find: q.id, ok: 0, at: id });
      look(sh, id, e ? 'That is the ' + L(X.t) + ' — ' + L(X.why) + '. Compare it with what the show said and look at another one.' : '그건 ' + L(X.t) + jo(L(X.t), '이에요', '예요') + '. ' + L(X.why) + '. 쇼에서 들은 말과 견주어 다른 것을 살펴봐요.'); return; }
    const X = exOf(sh, id), tries = c.t | 0, H = s.h[sh] || (s.h[sh] = []); H.push(q.id); while (H.length > 4) H.shift(); s.got[q.id] = day(); s.n[sh] = (s.n[sh] | 0) + 1; s.ex[sh + ':' + id] = day(); delete s.cur[sh]; mark();
    const neu = A.GAME.found('sf:' + sh + ':' + id); A.skUp('look', tries ? 2 : 3, 'show:' + sh); A.rec('show', { id: sh, find: q.id, ok: 1, tries, at: id });
    A.diary('🎬', e ? 'Found “' + L(q.c) + '” after the show: the ' + L(X.t) : '쇼에서 들은 「' + L(q.c) + '」' + jo(L(q.c), '을', '를') + ' 찾았어요: ' + L(X.t));
    if (STAR[id]) STAR[id].visible = true; if (A.sfx) A.sfx('ding'); if (A.tone) { A.tone(784, 0, 0.1, 'triangle', 0.05); A.tone(1175, 0.12, 0.14, 'triangle', 0.05); }
    const nx = (s.n[sh] | 0) === 2 ? (e ? ' Next time the show question gets harder.' : ' 다음 판부터는 물음이 한 칸 어려워져요.') : '';
    A.openP('<h3>' + X.ic + ' ' + (e ? 'Found it!' : '찾았어요!') + '</h3><div class="pc-tx">' + esc(e ? '“' + L(q.c) + '” — it was the ' + L(X.t) + '.' : '「' + L(q.c) + '」 — ' + L(X.t) + jo(L(X.t), '이었어요', '였어요') + '.') + '</div>'
      + '<div class="sm">' + (e ? (tries ? 'You checked ' + (tries + 1) + ' exhibits and compared them.' : 'You found it on the first look.') : (tries ? '전시 ' + (tries + 1) + '곳을 견주어 찾았어요.' : '처음 살펴본 곳에서 찾았어요.')) + (neu ? (e ? ' Added to your codex, and a gold mark is on the stand.' : ' 도감에 적고, 받침에 금빛 표를 붙였어요.') : (e ? ' A gold mark is on the stand.' : ' 받침에 금빛 표가 있어요.')) + nx + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'sfind').onclick = ev => { const b = ev.target.closest('button'); if (b && b.dataset.a === 'x') A.closeP(); }; }

  // ───────── 금빛 표(받침 위 모퉁이 · 찾은 전시만 보임) ─────────
  function star(K, S9, sh, id, x, y, z) { const [ox, oy, oz] = S9.at, g = K.parts(put => { put('s', ox + x, oy + y + 0.05, oz + z, 0.06, 0.8, 0, 0xf2c230, 1); put('c16', ox + x, oy + y, oz + z, 0.07, 0.01, 0, 0xb07a00); }); g.visible = !!S().ex[sh + ':' + id]; (S9.extra || (S9.extra = [])).push(g); STAR[id] = g; }
  const lab = (sh, id) => { const X = exOf(sh, id); return '🔍 ' + L(X.t) + (en() ? ' — take a look' : ' 살펴보기'); };

  // ───────── 🐠 아쿠아리움 방에 수조 넷(town_indoor.js roomAqua 위에 deco · 방 26 × 18 · 문 = +z) ─────────
  //   빛 해파리 = 오른벽 가운데 수조 · 바다거북 = 왼벽 가운데 수조 · 혹등고래 = 오른벽 앞 수조 + 귀 대는 관 · 깊은 바다 = 뒤벽 새 어두운 수조
  function aquaDeco(S9, made, X) { const K = X.K, P = S9.put, ex = made.extra || (made.extra = []); for (const k in STAR) delete STAR[k];
    const gx = 11.64;   /* 오른벽 수조 앞 유리(11.7)에 붙은 것 */
    for (const [z, y] of [[-1.6, 1.5], [-0.2, 2.5], [0.9, 1.4], [-1.0, 3.2]]) { P('s', gx, y, z, 0.2, 0.62, 0, 0xf2a6c8, 1); P('s', gx - 0.01, y - 0.02, z, 0.12, 0.5, 0, 0xfbd7e6, 1); for (const dz of [-0.11, 0, 0.11]) P('b', gx, y - 0.5, z + dz, 0.015, 0.42, 0.015, 0xf7c4da, 1); }   // 빛 해파리 넷(분홍 빛 · 촉수)
    K.sign(S9, en() ? 'Glowing jellyfish' : '빛 해파리', 11.6, 3.62, -0.5, -Math.PI / 2, 1.6, 0.32, { bg: '#c25d8a', fr: false }); ex.push({ k: 'sf:aquarium:jelly', stand: [10.55, 0, -0.5], r: 1.05, label: lab('aquarium', 'jelly') }); star(K, S9, 'aquarium', 'jelly', 11.4, 0.6, -2.3);
    { const z = -0.5, x = -11.66, y = 2.0; P('s', x, y, z, 0.5, 0.55, 0, 0x7d9a5e); P('s', x + 0.03, y + 0.04, z, 0.38, 0.6, 0, 0x93b06e); P('s', x + 0.04, y + 0.02, z + 0.6, 0.15, 0.85, 0, 0xa7b88a);   // 바다거북 옆모습(등딱지 두 겹 · 머리)
      P('b', x + 0.03, y - 0.32, z + 0.3, 0.05, 0.07, 0.7, 0x6a8650, 0, 0.45); P('b', x + 0.03, y - 0.24, z - 0.38, 0.05, 0.06, 0.32, 0x6a8650, 0, -0.35); }   // 노 같은 긴 앞다리 · 짧은 뒷다리(몸에 붙어 비스듬히)
    K.sign(S9, en() ? 'Sea turtle' : '바다거북', -11.6, 3.62, -0.5, Math.PI / 2, 1.5, 0.32, { bg: '#5f7d45', fr: false }); ex.push({ k: 'sf:aquarium:turtle', stand: [-10.55, 0, 0.7], r: 1.05, label: lab('aquarium', 'turtle') }); star(K, S9, 'aquarium', 'turtle', -11.4, 0.6, -2.3);
    { const z0 = 6.4, x = gx, y = 2.3; [[0, 0.42], [-0.55, 0.46], [-1.1, 0.4], [-1.6, 0.3], [-2.0, 0.2], [-2.3, 0.13]].forEach(([dz, r]) => P('s', x, y, z0 + dz, r, 0.62, 0, 0x5d7486, 1)); P('s', x - 0.02, y - 0.12, z0 - 0.35, 0.36, 0.42, 0, 0xc9d3da, 1);   // 혹등고래 옆모습(몸 여섯 · 흰 배)
      P('b', x - 0.01, y - 0.2, z0 - 0.95, 0.04, 0.08, 1.3, 0xc9d3da, 1, -0.55); P('b', x, y, z0 - 2.5, 0.04, 0.06, 0.4, 0x4d6476, 1); P('b', x, y - 0.02, z0 - 2.68, 0.04, 0.6, 0.12, 0x4d6476, 1);   /* 몸의 3분의 1쯤 되는 긴 앞지느러미(비스듬히 아래로) · 꼬리 자루 · 꼬리지느러미 */
      P('b', 11.0, 0, 7.1, 0.08, 1.05, 0.08, 0x8a8f99); P('k', 11.0, 1.05, 7.1, 0.16, 0.3, 0, 0xb8a46a, 0, -Math.PI / 2); K.colL(S9, 11.0, 7.1, 0.12, 0.12, -0.5, 1.3); }   // 귀 대는 관(기둥 · 나팔)
    K.sign(S9, en() ? 'Humpback whale song' : '혹등고래 노래', 11.6, 3.62, 5.0, -Math.PI / 2, 1.8, 0.32, { bg: '#3f5a70', fr: false }); ex.push({ k: 'sf:aquarium:whale', stand: [10.4, 0, 6.3], r: 1.05, label: lab('aquarium', 'whale') }); star(K, S9, 'aquarium', 'whale', 11.4, 0.6, 3.2);
    { const x = 5.8, z = -8.45; P('b', x, 0, z, 2.4, 0.6, 0.9, 0x2b3a4a); P('b', x, 0.6, z, 2.3, 1.8, 0.8, 0x0e1a2c, 1); P('b', x, 2.4, z, 2.42, 0.08, 0.92, 0x2b3a4a); K.colL(S9, x, z, 1.2, 0.45, -0.5, 2.5);   // 깊은 바다 수조(거의 깜깜)
      for (const [dx, dy] of [[-0.7, 1.2], [0.4, 1.7], [0.8, 0.95], [-0.2, 2.0], [0.1, 1.35]]) P('s', x + dx, dy, z + 0.42, 0.035, 1, 0, 0xffe27a, 1); }   // 스스로 빛을 내는 물고기 불빛
    K.sign(S9, en() ? 'Deep sea' : '깊은 바다', 5.8, 2.75, -8.0 + 0.02, 0, 1.4, 0.3, { bg: '#3f6a80', fr: false }); ex.push({ k: 'sf:aquarium:deep', stand: [5.8, 0, -7.0], r: 1.05, label: lab('aquarium', 'deep') }); star(K, S9, 'aquarium', 'deep', 6.85, 0.6, -7.95); }

  // ───────── 🦋 곤충 박물관 방(새 방 · 12 × 10 · 받침 여섯 — 한살이 넷은 날마다 자리가 바뀜) ─────────
  function insectRoom(at, K, name) { const W = 12, D = 10, H = 3.6, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, ac = 0xc27a1a; for (const k in STAR) delete STAR[k];
    const S9 = K.shell(at, W, D, H, { wall: 0xf6f1e4, wains: 0x7a9a4a, winY: [], noLights: true, ft: ['wood', 1.0, 0xf4e6cc] }), P = S9.put; S9.ac = K.cs(ac);
    K.mainSign(S9, name || (en() ? 'Insect Museum' : '곤충 박물관'), 0, 2.85, -hd + 0.02, 0, { bg: '#c27a1a' });
    const R = rng('sfroom:' + day()), BX = [-3.75, -1.25, 1.25, 3.75], ord = ['egg', 'larva', 'pupa', 'adult'];
    for (let i = ord.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }   /* 한살이 넷 = 날마다 받침 자리가 바뀜(자리 외우기 X — 모형을 보고 고름) */
    const spots = ord.map((id, i) => ({ id, x: BX[i], z: -3.4, ry: 0 })).concat([{ id: 'beetle', x: -4.7, z: 0.6, ry: Math.PI / 2 }, { id: 'fly', x: 4.7, z: 0.6, ry: -Math.PI / 2 }]);
    const ex = [];
    for (const s of spots) { const { x, z, ry } = s, fx = Math.sin(ry), fz = Math.cos(ry); P('b', x, 0, z, 0.9, 0.9, 0.9, 0xf6f4ee); K.colL(S9, x, z, 0.45, 0.45, -0.5, 1.4);
      K.sign(S9, L(exOf('butterfly', s.id).t), x + fx * 0.455, 0.55, z + fz * 0.455, ry, 0.84, 0.22, { bg: '#7a9a4a', fr: false });
      model(P, s.id, x, z, 0.9); star(K, S9, 'butterfly', s.id, x - fz * 0.32 + fx * 0.3, 0.9, z + fx * 0.32 + fz * 0.3);
      ex.push({ k: 'sf:butterfly:' + s.id, stand: [x + fx * 1.25, 0, z + fz * 1.25], r: 1.0, label: lab('butterfly', s.id) }); }
    K.sign(S9, en() ? 'Big models · real size is much smaller' : '크게 만든 모형이에요 · 실제로는 훨씬 작아요', 0, 2.2, -hd + 0.02, 0, 3.4, 0.26, { bg: '#7a9a4a', fr: false });
    K.plant(S9, -hw + 0.6, hd - 0.7); K.plant(S9, hw - 0.6, hd - 0.7); K.plant(S9, -hw + 0.6, -hd + 0.7, 0.8); K.plant(S9, hw - 0.6, -hd + 0.7, 0.8);
    K.standGuest(S9, ox + 2.6, oy, oz + 1.6, Math.PI, 3); K.standGuest(S9, ox - 2.2, oy, oz + 2.4, 2.6, 5);   /* 둘러보는 손님(이름 없음) */
    K.wwin(S9, 'F', -3.4, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 3.4, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-3, 0, 3]) for (const zz of [-2.0, 2.0]) K.panelL(S9, x, zz);
    return { S: S9, W, D, H, seats: [], items: ['한살이 받침 넷(알 · 애벌레와 허물 · 번데기 · 어른벌레 — 날마다 자리가 바뀜)', '장수풍뎅이 한살이', '잠자리 한살이(번데기 칸 빔)', '찾은 표(금빛)', '손님(이름 없음)'], extra: ex, cam: { d: 3.8, p: 0.55 } }; }
  // 받침 위 모형(로컬 · y0 = 받침 윗면)
  function model(P0, id, x, z, y0) { const Y = y0, K9 = 1.6, P = (k, px, py, pz, sx, sy, sz, hex, gl, rx) => P0(k, x + (px - x) * K9, y0 + (py - y0) * K9, z + (pz - z) * K9, sx * K9, k === 's' ? sy : sy * K9, sz * K9, hex, gl, rx);   /* 크게 만든 모형(1.6배 · 받침 윗면 기준) */
    if (id === 'egg') { P('s', x, Y + 0.02, z, 0.34, 0.12, 0, 0x8cc65a); P('s', x + 0.12, Y + 0.05, z - 0.06, 0.22, 0.12, 0, 0x9fd46a); P('b', x - 0.05, Y + 0.05, z, 0.5, 0.012, 0.02, 0xd8efb4);   /* 배추 잎(두 겹 · 잎맥) */ for (const [dx, dz] of [[-0.1, 0.06], [0.06, -0.08], [0.16, 0.08]]) P('s', x + dx, Y + 0.16, z + dz, 0.035, 2.4, 0, 0xf1d97a); }   // 길쭉한 노란 알 셋(하나씩 떨어져)
    else if (id === 'larva') { for (let i = 0; i < 6; i++) P('s', x - 0.22 + i * 0.075, Y + 0.06, z + 0.05, 0.05, 1, 0, i % 2 ? 0x7fb24e : 0x9cc86a); P('s', x + 0.2, Y + 0.075, z + 0.05, 0.045, 1, 0, 0x6a9a40);   /* 애벌레(마디 여섯 · 머리) */
      [0.04, 0.055, 0.07, 0.085].forEach((r, i) => P('s', x - 0.25 + i * 0.16, Y + 0.02, z - 0.16, r, 0.35, 0, 0xc9d1a8)); }   // 허물 넷(점점 큼)
    else if (id === 'pupa') { for (const dx of [-0.2, 0.2]) P('b', x + dx, Y, z, 0.04, 0.42, 0.04, 0x8a6a4a); P('b', x, Y + 0.42, z, 0.46, 0.04, 0.04, 0x8a6a4a); P('b', x, Y + 0.36, z, 0.012, 0.06, 0.012, 0xffffff);   /* 받침 기둥 둘 · 가로 가지 · 실 */ P('s', x, Y + 0.26, z, 0.05, 1.9, 0, 0xb7c98a); P('k', x, Y + 0.17, z, 0.045, 0.07, 0, 0xa7b97a, 0, Math.PI); }   // 번데기(가지 밑에 매달림 · 세로로 길쭉 · 아래 뾰족)
    else if (id === 'adult') { P('b', x, Y, z, 0.03, 0.32, 0.03, 0x5a8a3a); for (let k = 0; k < 6; k++) { const a = k * 1.047; P('s', x + Math.cos(a) * 0.08, Y + 0.33, z + Math.sin(a) * 0.08, 0.06, 0.45, 0, 0xf2a6c8); } P('s', x, Y + 0.35, z, 0.05, 0.6, 0, 0xf2c230);   /* 꽃(줄기 · 꽃잎 여섯 · 가운데) */
      P('b', x, Y + 0.4, z, 0.03, 0.03, 0.16, 0x2b2d31); for (const s9 of [-1, 1]) { P('b', x + s9 * 0.11, Y + 0.42, z - 0.02, 0.2, 0.012, 0.16, 0xf7f4ea); P('s', x + s9 * 0.15, Y + 0.43, z - 0.04, 0.02, 0.4, 0, 0x2b2d31); } P('b', x, Y + 0.37, z + 0.07, 0.006, 0.04, 0.006, 0x2b2d31); }   // 배추흰나비(하얀 날개 · 검은 점 · 대롱 입)
    else if (id === 'beetle') { P('s', x - 0.26, Y + 0.05, z, 0.07, 0.8, 0, 0xf0e6c8); P('s', x - 0.18, Y + 0.05, z, 0.06, 0.8, 0, 0xf0e6c8);   /* 굼벵이 애벌레 · 번데기 · 어른벌레(뿔) */ P('s', x, Y + 0.07, z, 0.07, 1.3, 0, 0xb08a50);
      P('s', x + 0.22, Y + 0.08, z, 0.12, 0.65, 0, 0x5a3420); P('s', x + 0.32, Y + 0.08, z, 0.06, 0.8, 0, 0x3a2414); P('b', x + 0.38, Y + 0.1, z, 0.12, 0.025, 0.025, 0x3a2414, 0, 0.6); }
    else if (id === 'fly') { P('s', x - 0.24, Y + 0.04, z, 0.08, 0.5, 0, 0x7a6a4a); P('b', x - 0.08, Y + 0.002, z, 0.16, 0.02, 0.16, 0xd8d2c2);   /* 물속 애벌레(수채) · 빈 칸(번데기 없음) · 어른 잠자리 */
      P('b', x + 0.2, Y + 0.2, z, 0.03, 0.03, 0.4, 0x3d74c9); P('s', x + 0.2, Y + 0.2, z + 0.21, 0.035, 1, 0, 0x2b5aa0); for (const s9 of [-1, 1]) for (const dz of [0.1, 0.0]) P('b', x + 0.2 + s9 * 0.15, Y + 0.21, z + dz, 0.28, 0.008, 0.07, 0xcfe8f5, 1); P('b', x + 0.2, Y, z, 0.02, 0.2, 0.02, 0x8a8f99); } }

  // ───────── 🐾 천연기념물 보호 센터 관찰 데크(바깥 · 건물 없는 구역 · 처음 1초 칸에서 한 번) ─────────
  function deckPlace() { const L9 = A.places() || []; return L9.find(p => /천연기념물 보호 센터/.test(p.name || '')) || L9.find(p => /천연기념물/.test(p.name || '')) || null; }
  function deckBuild() { const R0 = A.root(); if (!R0) return; const p = deckPlace(); if (!p) { DECK = { none: true, root: R0 }; return; } const D0 = p.door || [p.x, p.z], used = (map.interact.list() || []).filter(h => !h.off && Math.hypot(h.x - D0[0], h.z - D0[1]) < 40), got = [];
    const flat = (x, z) => { const g0 = A.gy(x, z); if (!Number.isFinite(g0)) return null; for (const [a, b] of [[0.8, 0], [-0.8, 0], [0, 0.8], [0, -0.8], [0.6, 0.6], [-0.6, -0.6], [0, 1.6], [0, -1.6], [1.6, 0], [-1.6, 0]]) { if (!A.spot(x + a, z + b)) return null; const g = A.gy(x + a, z + b); if (!Number.isFinite(g) || Math.abs(g - g0) > 0.35) return null; } return g0; };
    for (let r = 6; r <= 22 && got.length < 4; r += 2) for (let k = 0; k < 18 && got.length < 4; k++) { const a = k / 18 * 6.2832 + r * 0.13, x = D0[0] + Math.cos(a) * r, z = D0[1] + Math.sin(a) * r;
      if (got.some(q => Math.hypot(q.x - x, q.z - z) < 5) || used.some(h => Math.hypot(h.x - x, h.z - z) < 3.4)) continue; const y = flat(x, z); if (y == null) continue; got.push({ x, z, y, ry: Math.atan2(D0[0] - x, D0[1] - z) }); }   /* 앞 = 도착 자리 쪽 */
    if (got.length < 4) { DECK = { none: true, n: got.length, root: R0 }; return; } const ids = ['otter', 'clean', 'trash', 'duck'], cols = [];
    const g = A.parts(put => got.forEach((s, i) => { const id = ids[i], c = Math.cos(s.ry), sn = Math.sin(s.ry), Pq = (k, lx, ly, lz, sx, sy, sz, hex, gl, ry9, rx9) => put(k, s.x + lx * c + lz * sn, s.y + ly, s.z - lx * sn + lz * c, sx, sy, sz, hex, gl, (ry9 || 0) + s.ry, rx9 || 0);
      Pq('b', 0, 0, 0, 1.9, 0.14, 1.3, 0xa8794a); for (const dx of [-0.92, 0.92]) Pq('b', dx, 0.14, -0.6, 0.06, 0.8, 0.06, 0x8a5a34); Pq('b', 0, 0.9, -0.6, 1.9, 0.06, 0.06, 0x8a5a34);   /* 나무 받침 · 뒤 난간 */
      if (id === 'otter') { Pq('s', -0.3, 0.14, -0.2, 0.42, 0.55, 0, 0x8d877c); Pq('b', 0.35, 0.142, 0.1, 0.8, 0.02, 0.6, 0x5fb5d8, 1); Pq('s', 0.05, 0.36, 0.05, 0.16, 0.75, 0, 0x8a6142); Pq('s', 0.25, 0.36, 0.05, 0.15, 0.75, 0, 0x8a6142); Pq('s', 0.42, 0.42, 0.05, 0.11, 0.9, 0, 0x7a5236); Pq('s', 0.5, 0.42, 0.05, 0.04, 1, 0, 0xc9a982); Pq('b', -0.18, 0.3, 0.05, 0.3, 0.06, 0.07, 0x7a5236, 0, 0, 0.3);   /* 바위 굴 · 물 · 몸 · 머리 · 코 · 꼬리 */
        for (const dz of [-0.04, 0.04]) Pq('b', 0.2, 0.14, 0.18 + dz, 0.12, 0.02, 0.02, 0xf4f1ea); }   // 물고기 뼈
      else if (id === 'clean') { Pq('b', 0, 0.14, 0, 1.6, 0.4, 0.7, 0x6b4a2f); Pq('b', -0.41, 0.54, 0, 0.76, 0.56, 0.62, 0x9fd8f0, 1); Pq('b', 0.41, 0.54, 0, 0.76, 0.56, 0.62, 0x9a8a5a, 1); Pq('b', 0, 0.54, 0, 0.04, 0.58, 0.64, 0x2b3a4a);   /* 받침 · 맑은 칸 · 흐린 칸 · 칸막이 */
        for (const [dx, dy] of [[-0.6, 0.7], [-0.4, 0.82], [-0.25, 0.66], [-0.55, 0.92], [-0.3, 0.98]]) Pq('b', dx, dy, 0.32, 0.1, 0.04, 0.015, 0xef8b33, 1); Pq('b', 0.4, 0.75, 0.32, 0.1, 0.04, 0.015, 0xb07a40, 1); }   // 물고기 다섯 · 하나
      else if (id === 'trash') { Pq('b', 0, 0.14, -0.35, 1.5, 1.1, 0.06, 0xf6f4ee); Pq('c', -0.4, 0.6, -0.3, 0.06, 0.16, 0, 0xb8c0c8); Pq('b', 0.05, 0.75, -0.3, 0.3, 0.26, 0.03, 0xe9eef2); for (let k = 0; k < 4; k++) Pq('b', 0.45, 0.45 + k * 0.1, -0.3, 0.32, 0.01, 0.02, 0x3f8f4e);   /* 판 · 캔 · 비닐 · 그물 줄 */
        Pq('b', 0, 1.1, -0.3, 1.2, 0.12, 0.02, 0x3b6fb6); }   // 판 위 파란 띠(「강에 버리지 않아요」 — 글은 창에)
      else { Pq('b', 0, 0.14, 0, 1.2, 0.2, 0.3, 0x8a5a34, 0, 0.2); Pq('s', 0, 0.48, 0, 0.18, 0.75, 0, 0x8a6a4a); Pq('s', 0.17, 0.6, 0, 0.09, 1, 0, 0x3f7a5a); Pq('b', 0.17, 0.6, 0.06, 0.1, 0.03, 0.02, 0xf6f4ee); Pq('b', 0.27, 0.58, 0, 0.06, 0.03, 0.03, 0xe0453a);   /* 통나무 · 몸 · 머리 · 흰 눈띠 · 부리 */
        for (const dz of [-0.1, 0.1]) Pq('b', -0.05, 0.62, dz, 0.12, 0.12, 0.02, 0xef8b33); } }));   // 주황 돛 깃
    R0.add(g); for (const s of got) cols.push(A.col({ x0: s.x - 0.9, x1: s.x + 0.9, z0: s.z - 0.9, z1: s.z + 0.9, y0: s.y - 0.5, y1: s.y + 0.95 }));
    const stars = got.map((s, i) => { const id = ids[i], c = Math.cos(s.ry), sn = Math.sin(s.ry), gg = A.parts(put => { put('s', s.x + 0.8 * c, s.y + 0.22, s.z - 0.8 * sn, 0.06, 0.8, 0, 0xf2c230, 1); }); gg.visible = !!S().ex['otter:' + id]; R0.add(gg); STAR[id] = gg; return gg; });
    const hots = got.map((s, i) => { const id = ids[i], st = [s.x + Math.sin(s.ry) * 1.5, s.z + Math.cos(s.ry) * 1.5]; return map.interact.add({ kind: 'game', x: st[0], z: st[1], y: s.y, r: 1.3, label: lab('otter', id), use: () => use('sf:otter:' + id) }); });
    { const bx = D0[0], bz = D0[1]; let b = null; for (const [a, d] of [[0, 3.2], [1.2, 3.2], [-1.2, 3.2], [2.4, 4], [-2.4, 4]]) { const x = bx + Math.cos(a) * d, z = bz + Math.sin(a) * d; if (A.spot(x, z) && !got.some(q => Math.hypot(q.x - x, q.z - z) < 2.6)) { b = [x, z]; break; } }
      if (b) A.sign(b[0], b[1], Math.atan2(got[0].x - b[0], got[0].z - b[1]) + Math.PI, en() ? 'Natural monument viewing deck' : '천연기념물 관찰 데크', A.gy(b[0], b[1])); }
    DECK = { g, stars, cols, hots, at: got.map((s, i) => ({ id: ids[i], x: +s.x.toFixed(1), z: +s.z.toFixed(1), y: +s.y.toFixed(2), stand: [+(s.x + Math.sin(s.ry) * 1.5).toFixed(2), +(s.z + Math.cos(s.ry) * 1.5).toFixed(2)] })), place: p.name, D0, root: R0 }; }

  // ───────── 위 가운데 줄 · 1초 칸 ─────────
  function goalNow() { const s = S(), R9 = A.room(), e = en(); for (const sh in s.cur) { const c = s.cur[sh], q = qOf(sh, c.q), H = HALLS[sh]; if (!q || !H) continue; let here = false;
      if (H.kind === 'deck') { const me = map.player.pos(); here = !!(DECK && DECK.D0 && !R9 && Math.hypot(me.x - DECK.D0[0], me.z - DECK.D0[1]) < 45); } else here = !!(R9 && R9.kind === H.kind);
      if (here) return '🎬 ' + (e ? 'Find what the show said: “' + L(q.c) + '” — look closely (E)' : '쇼에서 들은 것 찾기: 「' + L(q.c) + '」 — 살펴보고(E) 골라요'); }
    return ''; }
  function deckClear() { if (DECK && DECK.g) { if (DECK.g.parent) DECK.g.parent.remove(DECK.g); for (const g of DECK.stars) if (g.parent) g.parent.remove(g); for (const h of DECK.hots) h.remove(); for (const c of DECK.cols) if (c && c.remove) c.remove(); } DECK = null; deckTry = 0; }
  function sec() { if (dead) return; if (DECK && DECK.root !== A.root()) deckClear();   /* 마을을 다시 지음(계절·모습) = 데크도 다시 */ if (!A.on()) return; if (!DECK && (deckTry += 1) >= 3) { try { deckBuild(); } catch (e) { DECK = { none: true, err: String(e && e.message) }; console.warn('[쇼 찾기] 데크', e); } } goalT = goalNow(); }
  function dispose() { deckClear(); dead = true; }
  // 방 갈래별 연결(town.js tblRoom · pubIn)
  const roomOpts = kind => kind === 'insect' ? { room: (at, K) => insectRoom(at, K, null), onExtra: kk => use(kk) } : null;
  return { after, start, use, look, choose, aquaDeco, insectRoom, roomOpts, sec, dispose, get goal() { return goalT; },
    info: () => ({ S: JSON.parse(JSON.stringify(S())), deck: DECK ? { none: !!DECK.none, n: DECK.n, at: DECK.at || null, place: DECK.place || null, err: DECK.err } : null, goal: goalT }),
    dbg: { pick: (sh, seed) => (pick(sh, seed) || {}).id, clear: sh => { delete S().cur[sh]; mark(); }, deck: () => { deckClear(); deckBuild(); return DECK && DECK.at; } } };
}
