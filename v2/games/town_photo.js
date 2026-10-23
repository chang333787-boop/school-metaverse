// 📷 사진 기자(PHOTO-2 · docs/systems/town_jobs2.md 「다음 다섯 — 사진 기자」): 장면이 먼저, 기사가 나중
//   동물 엔진(town_wild.js)이 저절로 만든 행동을 아이가 보고 찍으면 기사 쪽지 한 장 → 작은 도서관 소식지 편집장(사서 자리 · 직함만 · 새 사람 X)에게 내면 마을 소식지에 실림
//   셔터 = 이미 있는 📷 사진 찍기(photo.js takePhoto)를 그대로 · 세는 수 없이 바로 · 그 한 프레임에서만 화면 안 동물·행동을 셈(wild.shot · 투영 상자 · 매 프레임 X)
//   점수 = 별 대신 '무엇이 담겼나' 말(가까이 · 행동 · 둘이 함께 · 때·날씨) + 판 뒤 '다음에 해 볼 것' 한 줄 · 개인 순위 X · 앨범 = 찍은 기사만(빈칸 X)
//   배울 거리 = 동물 행동 사실 한 줄 + 지키는 법(멀리서 보기 · 먹이 주지 않기) · 보상 = 문(rwCheck) 꼬리표 'photo:<동물>'(같은 동물 하루 한 번)
import { WILD, wildById, HAB_NAME } from './town_wild.js?v=5';
export const PHOTO_V = 1;
const T2 = (ko, en) => [ko, en];
// 행동: 짧은 이름(담긴 것) · 관형 말(기사 제목) — 쉬기는 종마다 다름
const ACT = {
  fly: [T2('날아오름', 'taking off'), T2('날아오르는', 'taking off')], dive: [T2('물에 뛰어듦', 'diving in'), T2('물에 뛰어드는', 'diving into the water')],
  climb: [T2('나무 타기', 'climbing'), T2('나무를 타고 오르는', 'climbing a tree')], run: [T2('달아남', 'running off'), T2('뛰어 달아나는', 'running off')],
  come: [T2('다가옴', 'coming closer'), T2('가까이 다가오는', 'coming closer')], walk: [T2('걷기', 'walking'), T2('천천히 걷는', 'walking slowly')],
  swim: [T2('헤엄', 'swimming'), T2('헤엄치는', 'swimming')], alert: [T2('두리번', 'looking around'), T2('고개를 들고 두리번거리는', 'raising its head to look around')] };
const REST = { waterdeer: [T2('풀 뜯기', 'grazing'), T2('풀을 뜯는', 'grazing')], chipmunk: [T2('먹이 찾기', 'foraging'), T2('먹이를 찾는', 'looking for food')],
  heron: [T2('먹이 기다리기', 'waiting for fish'), T2('물가에서 가만히 먹이를 기다리는', 'standing still, waiting for fish')], egret: [T2('먹이 기다리기', 'waiting for food'), T2('가만히 먹이를 기다리는', 'standing still, waiting for food')],
  mallard: [T2('물 위에서 쉬기', 'resting on the water'), T2('물 위에 떠서 쉬는', 'resting on the water')], spotbill: [T2('물 위에서 쉬기', 'resting on the water'), T2('물 위에 떠서 쉬는', 'resting on the water')],
  frog: [T2('물가에 앉기', 'sitting by the water'), T2('물가에 앉아 있는', 'sitting by the water')], otter: [T2('강가에서 쉬기', 'resting'), T2('강가에서 쉬는', 'resting on the bank')],
  owl: [T2('가지에서 쉬기', 'perching'), T2('가지에 앉아 쉬는', 'perching on a branch')] };
const CALM = { rest: 1, alert: 1, come: 1, walk: 1, swim: 1 }, SCARED = { fly: 1, dive: 1, climb: 1, run: 1 };
// 동물 행동 사실(일반 도감에 널리 실린 것 · 4학년 말) — 행동 × 종(없으면 행동 기본)
const FACT = {
  fly: { heron: T2('왜가리는 날 때 긴 목을 S자로 접고 다리를 뒤로 쭉 뻗어요.', 'A heron folds its long neck into an S and stretches its legs back when it flies.'), egret: T2('백로는 날 때 목을 S자로 접고 다리를 뒤로 쭉 뻗어요.', 'An egret folds its neck into an S and stretches its legs back when it flies.'),
    mallard: T2('청둥오리 같은 오리는 물 위에서 곧바로 날아오를 수 있어요.', 'Dabbling ducks like mallards can take off straight from the water.'), spotbill: T2('흰뺨검둥오리 같은 오리는 물 위에서 곧바로 날아오를 수 있어요.', 'Dabbling ducks like spot-billed ducks can take off straight from the water.'),
    owl: T2('부엉이 깃털은 끝이 부드러워서 날갯소리가 거의 나지 않아요.', 'Owl feathers have soft edges, so owls fly almost silently.'), _: T2('새는 놀라면 날아올라 다른 곳으로 옮겨 가요.', 'A startled bird flies off to another place.') },
  dive: { frog: T2('개구리는 위험을 느끼면 물속으로 뛰어들어 숨어요.', 'A frog jumps into the water to hide when it senses danger.'), otter: T2('수달은 물속에서 귀와 콧구멍을 닫을 수 있어요.', 'An otter can close its ears and nostrils underwater.'), _: T2('물가 동물은 놀라면 물속으로 숨어요.', 'Waterside animals hide in the water when startled.') },
  climb: { _: T2('다람쥐는 날카로운 발톱으로 나무줄기를 붙잡고 올라요.', 'A chipmunk grips tree bark with its sharp claws to climb.') },
  run: { waterdeer: T2('고라니는 겁이 많아서 놀라면 껑충껑충 뛰어 달아나요.', 'Water deer are shy and bound away when startled.'), _: T2('놀란 동물은 숨을 곳으로 달아나요.', 'A startled animal runs to a place to hide.') },
  come: { _: T2('가만히 있으면 동물이 덜 겁내요. 그래도 먹이는 주지 않아요.', 'Animals are less afraid when you keep still. Still, we never feed them.') },
  alert: { _: T2('고개를 들고 두리번거리는 건 무언가를 알아챘다는 뜻이에요. 그럴 땐 멈춰서 기다려요.', 'Raising its head to look around means it noticed something. Stop and wait.') },
  walk: { _: T2('천천히 걷는 건 아직 놀라지 않았다는 뜻이에요.', 'Walking slowly means it is not scared yet.') },
  swim: { _: T2('오리는 물갈퀴가 달린 발로 물을 저어 헤엄쳐요.', 'Ducks paddle with their webbed feet.') },
  rest: { waterdeer: T2('고라니는 풀과 나뭇잎을 먹는 초식 동물이에요.', 'Water deer are plant eaters that eat grass and leaves.'), chipmunk: T2('다람쥐는 볼주머니에 먹이를 넣어 굴로 날라요.', 'A chipmunk carries food to its burrow in its cheek pouches.'),
    heron: T2('왜가리는 물가에 가만히 서 있다가 물고기가 다가오면 부리로 재빨리 잡아요.', 'A heron stands still by the water and snaps up fish that come close.'), egret: T2('백로는 논이나 얕은 물에서 물고기와 개구리를 잡아먹어요.', 'Egrets catch fish and frogs in rice fields and shallow water.'),
    mallard: T2('오리는 꼬리 쪽에서 나오는 기름을 깃털에 발라 물이 스며들지 않게 해요.', 'Ducks spread oil from near their tail on their feathers to keep water out.'), spotbill: T2('오리는 꼬리 쪽에서 나오는 기름을 깃털에 발라 물이 스며들지 않게 해요.', 'Ducks spread oil from near their tail on their feathers to keep water out.'),
    frog: T2('개구리는 피부로도 숨을 쉬어서 늘 촉촉한 물가에 살아요.', 'Frogs also breathe through their skin, so they live in damp places by water.'), otter: T2('수달은 물고기를 잡아먹고, 강가 바위 틈이나 굴에서 쉬어요.', 'Otters eat fish and rest in rock gaps or dens on the riverbank.'),
    owl: T2('솔부엉이는 낮에는 나무 그늘에서 쉬고 밤에 큰 곤충을 잡아요.', 'The brown hawk-owl rests in the shade by day and catches big insects at night.'), _: T2('쉬고 있는 동물은 가까이 가면 놀라요. 멀리서 지켜봐요.', 'A resting animal is easily startled. Watch from a distance.') } };
// 지키는 법(야생동물 사진 예절 · 사실)
const CARE = [T2('야생동물은 멀리서 보고, 먹이를 주지 않아요. 사람 음식은 동물을 아프게 해요.', 'We watch wild animals from afar and never feed them. Our food can make them sick.'),
  T2('쫓아가거나 소리치지 않아요. 놀란 동물은 먹이 먹을 시간을 잃어요.', 'We never chase or shout. A scared animal loses time it needs to feed.'),
  T2('둥지나 새끼 곁에는 오래 머물지 않아요.', 'We never stay long near nests or young animals.'),
  T2('다 찍으면 조용히 물러나요.', 'When we are done, we step back quietly.')];
const SEA = { spring: T2('봄', 'spring'), summer: T2('여름', 'summer'), autumn: T2('가을', 'autumn'), winter: T2('겨울', 'winter') };
const TM = { night: T2('밤', 'at night'), dawn: T2('이른 아침', 'early morning'), dusk: T2('저녁 노을', 'at sunset') }, WXN = { rain: T2('비 오는 날', 'on a rainy day'), snow: T2('눈 오는 날', 'on a snowy day') };
const jong = s => { const c = String(s).charCodeAt(String(s).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 > 0; };
const WA = s => s + (jong(s) ? '과' : '와'), IGA = s => s + (jong(s) ? '이' : '가');
const hashD = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 13; return h >>> 0; };

// 기사 글(순수 · 시험이 행동마다 부름): a = { id, act, fr, n, o, tm, wx, sea, reed }
export function pressLines(a, en) { const L = en ? 1 : 0, w = wildById(a.id); if (!w) return null; const nm = w.t[L], R9 = REST[a.id] || [T2('쉬기', 'resting'), T2('쉬는', 'resting')], A9 = a.act === 'rest' ? R9 : ACT[a.act] || R9;
  const place = HAB_NAME(w, a.reed, L), head = en ? 'A ' + nm.toLowerCase() + ' ' + A9[1][1] + ' — ' + place : place + '의 ' + nm + ', ' + A9[1][0] + ' 모습';
  const words = [a.fr >= 0.2 ? T2('가까이에서 크게', 'close and big')[L] : a.fr >= 0.08 ? T2('알맞은 크기', 'a good size')[L] : T2('멀리서 작게', 'small, far away')[L], (en ? 'action: ' : '행동: ') + A9[0][L]];
  if (a.n >= 2) words.push(en ? 'two together' : '두 마리가 함께'); else if (a.o && wildById(a.o)) words.push(en ? 'with a ' + wildById(a.o).t[1].toLowerCase() : WA(nm) + ' ' + wildById(a.o).t[0] + ' 함께');
  const when = [a.tm && TM[a.tm] ? TM[a.tm][L] : '', a.wx && WXN[a.wx] ? WXN[a.wx][L] : ''].filter(Boolean); words.push(when.length ? when.join(en ? ', ' : ' · ') : (SEA[a.sea] || SEA.spring)[L] + (en ? ' daytime' : ' 낮'));
  const F9 = FACT[a.act] || FACT.rest, fact = (F9[a.id] || F9._)[L];
  const next = SCARED[a.act] ? T2('놀라서 달아난 모습이에요. 다음엔 쪼그려 살금살금 다가가 쉬는 모습을 찍어 봐요.', 'It got scared and fled. Next time crouch, creep up and catch it resting.')[L]
    : a.fr < 0.08 ? T2('쪼그려 조금 더 다가가면 크게 찍혀요. 3m 안은 동물이 놀라요.', 'Crouch and creep a little closer for a bigger shot. Within 3 m it gets scared.')[L]
    : a.n < 2 && !a.o && w.cap > 1 ? T2('두 마리가 함께 있는 곳을 찾아 찍어 봐요.', 'Look for a place where two are together.')[L]
    : w.come && a.act !== 'come' ? T2('쪼그려 3초 가만히 있으면 다가오는 모습도 찍을 수 있어요.', 'Crouch and keep still for 3 seconds to catch it coming closer.')[L]
    : !a.tm && !a.wx ? T2('저녁이나 비 오는 날에는 다른 모습을 볼 수 있어요.', 'In the evening or on a rainy day you may see something different.')[L]
    : T2('아직 안 찍은 동물을 찾아봐요. 도감에 귀띔이 있어요.', 'Find an animal you have not shot yet. The codex has hints.')[L];
  return { head, words, fact, next, calm: !!CALM[a.act], scared: !!SCARED[a.act] }; }
// 기사료(안에서만 · 화면엔 말만): 기본 300 · 크게 +100 · 차분한 모습 +100 · 둘 +100 · 때·날씨 +100 · 편집장 주제 +200
export const pressPay = (a, th) => 300 + (a.fr >= 0.2 ? 100 : 0) + (CALM[a.act] ? 100 : 0) + (a.n >= 2 || a.o ? 100 : 0) + (a.tm || a.wx ? 100 : 0) + (th ? 200 : 0);

export function createPress(A) {
  const S = () => A.GAME.S, en = () => A.lang() === 'en', esc = t => A.esc(t);
  const ST = () => { const P = S().press; return P && P.v === 1 && Array.isArray(P.list) ? P : (S().press = { v: 1, list: [], news: [], got: {}, th: null }); };
  let shotMs = 0, shotMax = 0, lastScan = null, chipOn = null, URLS = [], lastMade = null;
  const freeUrls = () => { for (const u of URLS) URL.revokeObjectURL(u); URLS = []; };
  const whenNow = () => { const h = A.hour(), n9 = A.night(); return h < 5 || h >= 20 || n9 >= 1 ? 'night' : h < 7.5 ? 'dawn' : h >= 17 ? 'dusk' : ''; };
  // 셔터 그 한 프레임(photo.js onFrame): 화면 안 동물 → 가장 크게 담긴 동물 하나 + 같은 종 수 + 다른 종
  function scan() { const W = A.wild(); lastScan = null; if (!W || !W.on) return null; const t0 = performance.now(), me = A.me(), L = W.shot(A.cam(), [me.x, me.y + 1.3, me.z]).filter(q => q.fr >= 0.025);   /* 점처럼 작으면(화면 키 2.5% 밑) 기사 X */
    if (L.length) { const m = L[0], n = L.filter(q => q.id === m.id).length, o = (L.find(q => q.id !== m.id) || {}).id || '';
      lastScan = { id: m.id, act: m.act, fr: m.fr, d: m.d, reed: !!m.reed, n, o, tm: whenNow(), wx: A.wx() === 'clear' ? '' : A.wx(), sea: A.sea(), cell: A.cellOf(me.x, me.z), all: L.map(q => q.id + ':' + q.act) }; }
    shotMs = performance.now() - t0; if (shotMs > shotMax) shotMax = shotMs; return lastScan; }
  const label = () => { if (!lastScan) return ''; const w = wildById(lastScan.id); return w ? w.t[en() ? 1 : 0] + ' · ' + (lastScan.act === 'rest' ? (REST[lastScan.id] || [T2('쉬기', 'resting')])[0] : ACT[lastScan.act][0])[en() ? 1 : 0] : ''; };
  // 찍은 뒤(사진이 이 기기 앨범에 남은 뒤): 동물이 담겼으면 기사 쪽지 한 장 + 판 뒤 창
  function made(rec) { const a9 = lastScan; lastScan = null; if (!a9) { if (A.wild() && A.wild().near) A.toast(en() ? '📷 Keep the animal in the middle of the screen to make a news photo' : '📷 동물이 화면 가운데 오게 찍으면 기사가 돼요', 3); return null; }
    const P = ST(), a = { t: rec ? rec.t : Date.now(), d: S().day, id: a9.id, act: a9.act, fr: a9.fr, n: a9.n, o: a9.o, tm: a9.tm, wx: a9.wx, sea: a9.sea, cell: a9.cell, reed: a9.reed ? 1 : 0, sent: 0, paid: 0 };
    P.list.push(a); P.got[a.id] = (P.got[a.id] || 0) + 1; while (P.list.length > 40) { const i = P.list.findIndex(q => q.sent); P.list.splice(i >= 0 ? i : 0, 1); } A.GAME.mark(); lastMade = a;
    if (A.rec) A.rec('photo', { id: a.id, act: a.act }); openNote(a, rec && rec.b); return a; }
  const img = (b, h) => { if (!b) return ''; const u = URL.createObjectURL(b); URLS.push(u); return '<img src="' + u + '" alt="" style="height:' + h + 'px;width:auto;border-radius:8px;border:3px solid #3a3d42;display:block;flex:none">'; };
  const chipsH = ws => ws.map(t => '<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;border:2px solid #3a3d42;border-radius:6px;background:#fffdf6;font-size:14px">' + esc(t) + '</span>').join('');
  const care = () => CARE[(S().day + ST().list.length) % CARE.length][en() ? 1 : 0];
  function openNote(a, blob) { const e9 = en(), Q = pressLines(a, e9); if (!Q) return; freeUrls();
    const P9 = A.openP('<h3>📰 ' + (e9 ? 'News note' : '기사 쪽지') + '</h3><div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' + img(blob, 150) + '<div style="flex:1;min-width:220px;font-size:16px;line-height:1.5"><b>' + esc(Q.head) + '</b>'
      + '<div style="margin-top:6px">' + (e9 ? 'In the photo: ' : '담긴 것: ') + chipsH(Q.words) + '</div><div style="margin-top:6px"><b>' + (e9 ? 'Did you know?' : '알아 두기') + '</b> ' + esc(Q.fact) + '</div><div class="sm" style="margin-top:6px"><b>' + (e9 ? 'Next time' : '다음에 해 볼 것') + '</b> ' + esc(Q.next) + '</div></div></div>'
      + '<div class="sm" style="margin-top:8px">' + esc(care()) + '</div><div class="sm">' + (e9 ? 'Take it to the newsletter editor at the small library.' : '작은 도서관 소식지 편집장에게 가져가면 마을 소식지에 실려요.') + '</div>'
      + '<div class="row">' + (A.libGo ? '<button data-a="go">🧭 ' + (e9 ? 'Way to the editor' : '편집장에게 가는 길') + '</button>' : '') + '<button class="sub" data-a="x">' + (e9 ? 'Close' : '닫기') + '</button></div>', false, 'press');
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'go') { A.closeP(); A.libGo(); } else if (b.dataset.a === 'x') A.closeP(); }; A.sfx && A.sfx('ding'); }
  // 편집장 주제: 기사를 하나라도 낸 뒤 · 이 마을·이 계절에 있는데 아직 안 찍은 동물만(서식지를 알아야 찾아갈 수 있을 때) · 하루 하나
  function theme() { const P = ST(), d = S().day, W = A.wild(); if (!W || !P.news.length) return null; if (P.th && P.th.d === d) return P.th.done ? null : P.th;
    const C = (W.dexList ? W.dexList() : []).map(q => q.id).filter(id => W.can(id) && !P.got[id]); if (!C.length) { P.th = null; return null; } P.th = { d, id: C[hashD(d + 5) % C.length], done: 0 }; A.GAME.mark(); return P.th; }
  // 소식지 편집장(작은 도서관 대출대 · 사서 자리 · 직함만): 낼 기사 · 이번 주 소식 · 주제
  function desk() { const e9 = en(), L = e9 ? 1 : 0, P = ST(), th = theme(), U = P.list.filter(q => !q.sent).slice(-6).reverse(); freeUrls();
    const row = a => { const Q = pressLines(a, e9); return Q ? '<div data-t="' + a.t + '" style="display:flex;gap:10px;align-items:center;margin:6px 0;padding:6px;border:2px solid #3a3d42;border-radius:8px;background:#fffdf6"><span class="ph" style="flex:none"></span><div style="flex:1;font-size:15px"><b>' + esc(Q.head) + '</b><div>' + chipsH(Q.words) + '</div><div class="res sm"></div></div><button data-a="send" data-t="' + a.t + '">' + (e9 ? 'Hand in' : '이 기사 내기') + '</button></div>' : ''; };
    const thH = th ? (() => { const w = wildById(th.id); return '<div style="margin-top:8px;padding:6px 8px;border-left:6px solid #7d5bb8;background:#f3eefb"><b>' + (e9 ? 'Next issue: ' : '다음 호 주제: ') + esc(w.t[L]) + '</b> — ' + (e9 ? 'when and where would you meet it? Codex hint: ' : '언제, 어디에 가면 만날까요? 도감 귀띔: ') + esc(w.hint[L]) + '</div>'; })() : '';
    const news = P.news.slice(-5).reverse(), nwH = news.length ? '<div class="grp">' + (e9 ? 'Town newsletter' : '마을 소식지') + '</div>' + news.map(q => '<div class="sm">· ' + esc(q.h[L] || q.h[0]) + '</div>').join('') : '';
    const P9 = A.openP('<h3>📰 ' + (e9 ? 'Newsletter editor' : '소식지 편집장') + '</h3><div class="sm">' + (e9 ? '“A good story shows exactly what you saw. Bring me photos of animals doing something.”' : '“본 것을 그대로 담은 기사가 좋은 기사예요. 동물이 무엇을 하는지 보이게 찍어 와요.”') + '</div>'
      + (U.length ? U.map(row).join('') : '<div class="st" style="margin-top:8px">' + (e9 ? 'No news notes yet. Near an animal, press K (📷) to take a photo.' : '아직 낼 기사가 없어요. 동물 곁에서 K(📷)를 눌러 찍어 와요.') + '</div>') + thH + nwH
      + '<div class="sm" style="margin-top:8px">' + esc(care()) + '</div><div class="row"><button class="sub" data-a="x">' + (e9 ? 'Close' : '닫기') + '</button></div>', false, 'pressdesk');
    if (U.length && A.photos) A.photos().then(L9 => { if (!P9.isConnected) return; for (const el of P9.querySelectorAll('[data-t]')) { if (el.tagName === 'BUTTON') continue; const p = L9.find(q => String(q.t) === el.dataset.t), sp = el.querySelector('.ph'); if (p && sp) sp.innerHTML = img(p.b, 64); } }).catch(() => {});
    P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (b.dataset.a === 'send') { const r = send(+b.dataset.t), box = b.parentElement, res = box && box.querySelector('.res'); if (res && r) res.innerHTML = '<b>' + esc(r.msg) + '</b>'; b.remove(); } }; }
  // 기사 내기: 문(rwCheck) 꼬리표 'photo:<동물>' — 같은 동물 같은 게임 날 한 번(RW_GEN·RW_XP photo = 1) · 막히면 앨범에만 남김
  function send(t) { const e9 = en(), L = e9 ? 1 : 0, P = ST(), a = P.list.find(q => q.t === t && !q.sent); if (!a) return null; const w = wildById(a.id), Q = pressLines(a, e9), th = P.th && P.th.d === S().day && !P.th.done && P.th.id === a.id;
    const pay = A.earn(pressPay(a, th), 'photo:' + a.id); a.sent = S().day; A.GAME.mark();
    if (!(pay > 0)) { a.paid = -1; return { ok: false, msg: e9 ? 'We already ran a ' + w.t[1].toLowerCase() + ' story today. I will keep this one in your album — try another animal, or come back tomorrow.' : '오늘 ' + w.t[0] + ' 기사는 벌써 실었어요. 이 기사는 앨범에 남겨 둘게요. 다른 동물을 찍거나 내일 또 와요.' }; }
    a.paid = pay; if (th) P.th.done = S().day; P.news.push({ d: S().day, h: [pressLines(a, false).head, pressLines(a, true).head] }); while (P.news.length > 8) P.news.shift();
    A.skUp('look', 2, 'photo:' + a.id); A.sfx && A.sfx('done'); A.toast('📰 ' + (e9 ? 'In the town newsletter: ' : '마을 소식지에 실렸어요: ') + Q.head, 3.6);
    return { ok: true, pay, msg: (th ? (e9 ? 'Spot on for this issue’s topic! ' : '이번 호 주제에 꼭 맞아요! ') : '') + (e9 ? 'Printed! Fee ' + pay + ' won.' : '실렸어요! 기사료 ' + pay + '원') }; }
  // 앨범 '내 기사' 칸(찍은 것만 · 빈칸 X)
  function albumHtml() { const e9 = en(), A9 = ST().list.slice().reverse(); return '<div class="grp">📰 ' + (e9 ? 'My news photos' : '내 기사') + ' <span class="sm">' + A9.length + '</span></div>' + (A9.length ? '<div class="pr-alb">' + A9.slice(0, 12).map(a => { const Q = pressLines(a, e9); return Q ? '<div class="sm" data-pt="' + a.t + '" style="display:flex;gap:8px;align-items:center;margin:4px 0"><span class="ph"></span><span><b>' + esc(Q.head) + '</b><br>' + esc(Q.words.join(' · ')) + (a.paid > 0 ? (e9 ? ' — printed' : ' — 소식지에 실림') : '') + '</span></div>' : ''; }).join('') + '</div>' : ''); }
  function albumFill(root) { if (!A.photos || !root) return; freeUrls(); A.photos().then(L9 => { if (!root.isConnected) return; for (const el of root.querySelectorAll('[data-pt]')) { const p = L9.find(q => String(q.t) === el.dataset.pt), sp = el.querySelector('.ph'); if (p && sp) sp.innerHTML = img(p.b, 48); } }).catch(() => {}); }
  // 1초 칸: 동물 곁(야생동물 쪼그리기 30m)일 때만 📷 칩
  function sec() { const W = A.wild(), want = !!(W && W.on && W.near && !A.busy() && !A.inb()); if (want === chipOn) return; chipOn = want; A.chip('twn-photo', want ? (A.touch() ? '📷 ' + (en() ? 'Photo' : '찍기') : '📷 ' + (en() ? 'News photo (K)' : '기사 사진 (K)')) : null, { onClick: () => A.shoot() }); }
  function dispose() { freeUrls(); if (chipOn) A.chip('twn-photo', null); chipOn = null; }
  return { scan, made, label, desk, send, albumHtml, albumFill, sec, dispose, theme, lines: (a, e9) => pressLines(a, e9 ?? en()),
    info: () => { const P = ST(); return { n: P.list.length, unsent: P.list.filter(q => !q.sent).length, last: lastMade, news: P.news.length, th: P.th, got: { ...P.got }, shotMs: +shotMs.toFixed(3), shotMax: +shotMax.toFixed(3), chip: chipOn }; } };
}
export const PRESS_ACTS = Object.keys(ACT).concat('rest');
export const PRESS_IDS = WILD.map(w => w.id);
