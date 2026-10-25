// 🤔 '왜 있어?' 고치기(WHY-1 · 사용자 10-25 '애들 입장에서 뭐야 이건 왜 상호작용이 없어 — 동물보호센터 동물들이 아무것도 없는 것처럼')
//   감사 표 = docs/systems/town_why.md · 시험 = tools/harness/town_why.cjs
//   꼴: E 한 번 = 몸짓 + 소리 + 한 줄(사실·현실만) + 되도록 작은 변화가 남음 · 같은 E도 때·날씨·몇 번째·며칠째 사귀었나에 따라 두세 갈래(사용자 '깊이가 한 칸인 것이 너무 많다')
//   ① 🐶 보호센터 강아지 셋(보리·콩이·두리 = 보호소가 지어 준 동물 이름) — 쓰다듬기 · 공 던지기 · 산책(하루 한 번 · 문 밖에서 내 발자국을 따라옴 = 긴급 출동 PET-1 따라오기와 같은 길)
//      성격 셋(활발 · 겁 많음 · 나이 많음)이 반응을 가름 · 사귄 날 수(bond)가 늘면 겁 많은 콩이가 다가오고 산책도 나감 · 다음 날 들어가면 놀아 준 강아지가 울타리로 와 꼬리를 흔듦
//   ② 🐱 보호센터 고양이 둘 — 쓰다듬기(천천히 눈 깜빡 → 머리 비비기 → 꼬리 탁탁 = 그만) · 끈 흔들기(주황 고양이) · 한낮엔 회색 고양이가 잠
//   ③ 바깥 것은 아래 OUT 표(감사 상위 · 그리는 곳에 E 자리 하나씩)
//   지킴: 판타지 X · 동물을 괴롭히는 몸짓 X(먹이 X · 깨우지 않음 · 그만하라는 몸짓을 알려 줌) · 실명 X · 보상 = 산책 끝에만 솜씨(꼬리표 why:walk → rwCheck 한 문)
//   렉: 매 프레임 일 = 방 안 동물 다섯 + 공 하나(보호센터 방에 있을 때만) · 산책 중 강아지 하나 · 새 객체 X(스크래치) · 새 Light X
//     그리기: 보호센터 방 안에서만 +10(강아지 셋·고양이 둘 = 몸 + 꼬리 — 꼬리가 따로 흔들려야 해서) + 공 1 · 방 밖 0 · 산책 중 +2(강아지 · 목줄)
export const WHY_V = 1;
const T2 = (ko, en) => [ko, en];
const DOGS = [
  { id: 'bori', nm: T2('보리', 'Bori'), col: 0xc8a070, sp: 1.9, kind: 'lively' },
  { id: 'kong', nm: T2('콩이', 'Kongi'), col: 0xf2ede0, sp: 1.2, kind: 'shy' },
  { id: 'duri', nm: T2('두리', 'Duri'), col: 0x3a3a3a, sp: 0.55, kind: 'old' },
];
const CATS = [{ id: 'grey', nm: T2('회색 고양이', 'Grey cat'), col: 0x7a7a7a, y: 1.22, ry: 0.8, dx: 0, dz: 0 }, { id: 'orange', nm: T2('주황 고양이', 'Orange cat'), col: 0xef9b4a, y: 0.65, ry: -0.6, dx: 0.05, dz: -0.05 }];
const COLLAR = [0xe0453a, 0x3d74c9, 0x3cc76a];
const WALK_M = 90;   /* 산책 한 바퀴 = 강아지와 같이 걸은 거리(보호센터 둘레 한 바퀴쯤) */

export function createWhy(A) {
  const { map, T3 } = A, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t), day = () => A.GAME.S.day | 0, hour = () => (A.GAME.S.min | 0) / 60;
  const say = (t, s) => A.say(t, s || 4), tone = (...a) => { if (!(A.mute && A.mute())) map.tone(...a); };
  const S = () => { const g = A.GAME.S; let s = g.why; if (!s || typeof s !== 'object' || s.v !== WHY_V) s = g.why = { v: WHY_V, bond: {}, last: {}, greet: {}, td: { d: -1, n: {} }, walk: -1, walkN: 0 }; if (s.td.d !== day()) s.td = { d: day(), n: {} }; return s; };
  const cnt = k => S().td.n[k] | 0, bump = k => { const s = S(); s.td.n[k] = (s.td.n[k] | 0) + 1; A.GAME.mark(); return s.td.n[k]; };
  const DBG = [], log = t => { DBG.push(t); if (DBG.length > 30) DBG.shift(); };
  let dead = false, R = null, W = null, T = 0;   /* R = 보호센터 방(들어가 있을 때만) · W = 산책 */
  const _v = new T3.Vector3();
  // ───────── 소리(작게 · 짧게) ─────────
  const SND = { bark: () => { tone(540, 0, 0.07, 'triangle', 0.07, 420); tone(580, 0.14, 0.08, 'triangle', 0.06, 430); }, yip: () => tone(760, 0, 0.06, 'triangle', 0.05, 620),
    meow: () => { tone(600, 0, 0.12, 'sine', 0.045, 820); tone(820, 0.12, 0.2, 'sine', 0.04, 560); }, purr: () => { tone(70, 0, 0.5, 'triangle', 0.05, 66); },
    sniff: () => { tone(1800, 0, 0.03, 'sine', 0.012); tone(1700, 0.08, 0.03, 'sine', 0.012); tone(1800, 0.16, 0.03, 'sine', 0.012); }, ball: () => tone(300, 0, 0.06, 'triangle', 0.05, 220), pant: () => { for (let i = 0; i < 4; i++) tone(900, i * 0.18, 0.05, 'sine', 0.012, 700); },
    snore: () => tone(110, 0, 0.6, 'sine', 0.025, 90) };
  const snd = k => { if (SND[k]) SND[k](); };

  // ───────── 몸(상자 꼴 · 보호센터 방 강아지·고양이와 같은 모양 · 꼬리만 따로) ─────────
  function dogMesh(parts, hex, collar) { const g = parts(put => { const dk = 0x2b2b2b; for (const [a, b] of [[-0.1, 0.22], [0.1, 0.22], [-0.1, -0.22], [0.1, -0.22]]) put('b', a, 0, b, 0.08, 0.26, 0.08, hex); put('b', 0, 0.24, 0, 0.3, 0.26, 0.66, hex); put('b', 0, 0.4, 0.36, 0.26, 0.26, 0.26, hex); put('b', 0, 0.42, 0.52, 0.13, 0.11, 0.1, hex); put('b', 0, 0.49, 0.575, 0.05, 0.04, 0.02, dk);
      for (const s9 of [-1, 1]) { put('b', s9 * 0.07, 0.55, 0.495, 0.035, 0.035, 0.02, dk); put('b', s9 * 0.1, 0.6, 0.33, 0.06, 0.12, 0.08, 0x6b4a2f); } if (collar != null) put('b', 0, 0.36, 0.25, 0.3, 0.07, 0.09, collar); });
    const tl = parts(put => put('b', 0, 0, 0, 0.05, 0.22, 0.05, hex)); tl.position.set(0, 0.42, -0.31); tl.rotation.x = -0.8; g.add(tl); g.rotation.order = 'YXZ'; return { g, tl }; }
  function catMesh(parts, hex) { const g = parts(put => { for (const [a, b] of [[-0.07, 0.15], [0.07, 0.15], [-0.07, -0.15], [0.07, -0.15]]) put('b', a, 0, b, 0.06, 0.18, 0.06, hex); put('b', 0, 0.17, 0, 0.22, 0.19, 0.44, hex); put('b', 0, 0.28, 0.27, 0.2, 0.19, 0.18, hex);
      for (const s9 of [-1, 1]) { put('k', s9 * 0.06, 0.47, 0.27, 0.045, 0.09, 0, hex); put('b', s9 * 0.05, 0.4, 0.365, 0.03, 0.03, 0.02, 0x2b2b2b); } });
    const tl = parts(put => put('b', 0, 0, 0, 0.04, 0.3, 0.04, hex)); tl.position.set(0, 0.3, -0.21); tl.rotation.x = -0.3; g.add(tl); g.rotation.order = 'YXZ'; return { g, tl }; }

  // ───────── ① 보호센터 방(town_bldg.js roomShelter가 부름 · 정적 동물 대신 움직이는 몸) ─────────
  //   o = { pens: [cx…], z0, z1, tower: [tx, tz], at: [ox, oy, oz] } → 돌려줌 = 방에 더할 E 자리(made.extra 꼴 · 로컬 좌표)
  function shelterRoom(K, S9, o) { const [ox, oy, oz] = o.at, ex = [], s = S(), D = day(); R = { at: o.at, dogs: [], cats: [], ball: null, bt: 0, said: false };
    DOGS.forEach((d, i) => { const cx = o.pens[i], { g, tl } = dogMesh(K.parts, d.col, null), hx = cx - 0.35, hz = o.z0 + 1.2, ry = 0.5 - i * 0.5;
      const P = { i, d, g, tl, cx, x0: cx - 1.1, x1: cx + 1.1, z0: o.z0 + 0.4, z1: o.z1 - 0.32, fz: o.z1 - 0.38, x: hx, z: hz, ry, tx: hx, tz: hz, act: 'idle', t: 2 + i * 1.7, tw: 0, wag: 0.15, up: 0, roll: 0, lie: 0, ball: false, sit: 0 };
      if (d.kind === 'old' && hour() >= 12 && hour() < 15) P.lie = 1;
      g.position.set(ox + hx, oy, oz + hz); g.rotation.y = ry; (S9.extra || (S9.extra = [])).push(g); R.dogs.push(P);
      ex.push({ k: 'why:d' + i, stand: [cx, 0, o.z1 + 0.75], r: 1.0, label: '🐶 ' + (en() ? 'Play with ' + L(d.nm) : L(d.nm) + '와 놀기') });
      if (s.last[d.id] != null && s.last[d.id] < D && s.greet[d.id] !== D) { s.greet[d.id] = D; P.act = 'greet'; P.t = 4.5; P.tx = Math.min(P.x1, Math.max(P.x0, cx)); P.tz = P.fz; P.wag = 1; P.lie = 0; P.g9 = 1; } });   /* 다음 날 들어오면 놀아 준 강아지가 울타리로 와 꼬리를 흔듦 */
    const [tx, tz] = o.tower; CATS.forEach((c, i) => { const { g, tl } = catMesh(K.parts, c.col); g.position.set(ox + tx + c.dx, oy + c.y, oz + tz + c.dz); g.rotation.y = c.ry; S9.extra.push(g); R.cats.push({ i, c, g, tl, ry: c.ry, y: c.y, act: '', t: 0 }); });
    ex.push({ k: 'why:c', stand: [tx + 1.05, 0, tz - 0.15], r: 1.0, label: '🐱 ' + (en() ? 'Play with the cats' : '고양이와 놀기') });
    const ball = K.parts(put => put('s', 0, 0, 0, 0.07, 0.07, 0.07, 0xf2c230)); ball.visible = false; S9.extra.push(ball); R.ball = { g: ball, x: 0, y: 0, z: 0, fx: 0, fz: 0, sx: 0, sz: 0, sy: 0, t: 0, fly: 0, own: -1, hide: 0 };
    if (R.dogs.some(P => P.g9)) setTimeout(() => { if (!R || dead) return; const P = R.dogs.find(q => q.g9); if (!P) return; snd('bark'); say('🐶 ' + (en() ? L(P.d.nm) + ' recognises you and comes to the fence wagging its tail.' : L(P.d.nm) + '가 나를 알아보고 울타리로 와서 꼬리를 흔들며 반겨요.'), 4); log('greet ' + P.d.id); }, 900);
    log('room'); return ex; }
  function roomLeft() { R = null; }
  const me = () => map.player.pos();
  const W9 = (lx, lz) => [R.at[0] + lx, R.at[2] + lz];   /* 방 로컬 → 세상 */
  // 강아지 고르는 창(할 일 셋 · 한 번 고르면 창이 닫히고 몸으로 보임)
  function dogPanel(i) { if (!R) return; const P = R.dogs[i], d = P.d, e = en(), s = S(), b = s.bond[d.id] | 0, kindT = { lively: T2('활발한 강아지예요', 'a lively dog'), shy: T2('겁이 많은 강아지예요', 'a shy dog'), old: T2('나이가 많은 강아지예요', 'an older dog') }[d.kind];
    const meet = b === 0 ? T2('처음 만나요', 'You are meeting for the first time') : b < 3 ? T2('몇 번 같이 놀았어요', 'You have played together a few times') : T2('나를 잘 알아요', 'It knows you well');
    const walked = s.walk === day();
    const h = '<h3>🐶 ' + esc(L(d.nm)) + '</h3><div class="sm">' + esc((e ? 'To do: pick one. ' : '할 일: 하나를 골라요. ') + L(d.nm) + (e ? ' is ' + L(kindT) + '. ' : '는 ' + L(kindT) + '. ') + L(meet) + (e ? '.' : '.')) + '</div>'
      + '<div class="bd-ch"><button class="sub" data-w="pet">🤚 ' + esc(e ? 'Stroke gently' : '살살 쓰다듬기') + '</button><button class="sub" data-w="ball">⚾ ' + esc(e ? 'Throw the ball' : '공 던져 주기') + '</button><button class="sub" data-w="walk">🐾 ' + esc(walked ? (e ? 'Go for a walk (done today)' : '산책하기 (오늘은 했어요)') : (e ? 'Go for a walk (once a day)' : '산책하기 (하루 한 번)')) + '</button></div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const Pn = A.openP(h, false, 'whypet'); Pn.onclick = ev => { const bt = ev.target.closest('button'); if (!bt) return; A.closeP(); const w = bt.dataset.w; if (w === 'pet') dogPet(i); else if (w === 'ball') dogBall(i); else if (w === 'walk') dogWalk(i); }; }
  function played(d) { const s = S(), D = day(); if (s.last[d.id] !== D) { s.bond[d.id] = Math.min(30, (s.bond[d.id] | 0) + 1); s.last[d.id] = D; } A.GAME.mark(); }
  const sleepy = d => d.kind === 'old' && hour() >= 12 && hour() < 15;
  const fenceX = P => { const m = me(), px = m.x - R.at[0]; return Math.min(P.x1, Math.max(P.x0, px + (px > P.cx ? -0.8 : 0.8))); };   /* 내 바로 앞 = 내 몸에 가려짐 → 반 걸음 옆 */
  function go(P, act, tx, tz, t) { P.act = act; P.tx = Math.min(P.x1, Math.max(P.x0, tx)); P.tz = Math.min(P.z1, Math.max(P.z0, tz)); P.t = t; }
  function dogPet(i) { if (!R) return; const P = R.dogs[i], d = P.d, e = en(), n = bump('pet' + i), b = S().bond[d.id] | 0, nm = L(d.nm); let t = '', br = '';
    P.up = 0; P.roll = 0;
    if (d.kind === 'lively') {
      if (n === 1 && b === 0) { br = 'sniff'; go(P, 'come', fenceX(P), P.fz, 3); P.wag = 0.8; snd('sniff'); t = e ? nm + ' sniffs your hand, then starts wagging its tail.' : nm + '가 손 냄새를 킁킁 맡더니 꼬리를 흔들어요.'; }
      else if (n === 1) { br = 'jump'; go(P, 'jump', fenceX(P), P.fz, 3.2); P.wag = 1; snd('bark'); t = e ? nm + ' runs over and puts its front paws on the fence. Its tail is wagging fast.' : nm + '가 달려와 울타리에 앞발을 올려요. 꼬리가 바쁘게 흔들려요.'; }
      else if (n === 2) { br = 'belly'; go(P, 'belly', fenceX(P), P.fz - 0.15, 4); P.wag = 0.5; snd('yip'); t = e ? nm + ' rolls over to show its tummy. That means it feels safe with you.' : nm + '가 벌러덩 누워 배를 보여요. 마음을 놓았다는 몸짓이에요.'; }
      else { br = 'drink'; go(P, 'drink', P.cx + 0.55, P.z1 - 0.05, 4); P.wag = 0.2; t = e ? nm + ' goes to drink some water. Dogs need a rest too.' : nm + '가 물그릇으로 가서 물을 마셔요. 강아지도 쉬는 틈이 필요해요.'; } }
    else if (d.kind === 'shy') {
      if (b === 0 && n === 1) { br = 'back'; go(P, 'back', P.cx, P.z0, 3); P.wag = 0; t = e ? nm + ' steps back. With a shy dog, crouch down, hold out the back of your hand and let it sniff first.' : nm + '가 뒤로 물러나요. 겁이 많은 강아지에게는 몸을 낮추고 손등을 내밀어 먼저 냄새를 맡게 기다려요.'; }
      else if (b < 2) { br = 'near'; go(P, 'come', fenceX(P), (P.z0 + P.fz) / 2 + 0.3, 3.5); P.wag = 0.3; snd('sniff'); t = e ? nm + ' comes a little closer and sniffs the back of your hand.' : nm + '가 조금씩 다가와 손등 냄새를 맡아요.'; }
      else { br = 'come'; go(P, 'come', fenceX(P), P.fz, 3.5); P.wag = 0.9; snd('yip'); t = e ? nm + ' comes over wagging its tail. It knows you now.' : nm + '가 꼬리를 흔들며 다가와요. 이제 나를 알아봐요.'; } }
    else {
      if (sleepy(d)) { br = 'sleep'; S().td.n['pet' + i] = n - 1; P.lie = 1; P.act = 'idle'; P.t = 6; snd('snore'); t = e ? nm + ' is asleep on its tummy. Older dogs sleep a lot. Let it sleep and just watch.' : nm + '가 배를 깔고 잠들어 있어요. 나이 든 개는 잠이 많아요. 깨우지 않고 지켜봐요.'; }
      else if (n === 1) { br = 'slow'; P.lie = 0; go(P, 'come', fenceX(P), P.fz, 6); P.wag = 0.35; t = e ? nm + ' gets up slowly and comes over. When you stroke its back, it closes its eyes.' : nm + '가 천천히 일어나 다가와요. 등을 쓰다듬으니 눈을 지그시 감아요.'; }
      else { br = 'lie'; go(P, 'liefence', fenceX(P), P.fz, 5); P.wag = 0.15; t = e ? nm + ' lies down by the fence. Just staying close makes it happy.' : nm + '가 울타리 곁에 엎드려요. 곁에 있어 주는 것만으로도 좋아해요.'; } }
    if (br !== 'back' && br !== 'sleep') played(d); say('🐶 ' + t, 4.2); P.br = br; log('pet ' + d.id + ' ' + br); return br; }
  function throwBall(P, lx, lz, low) { const B = R.ball, m = me(); B.sx = m.x; B.sy = m.y + 1.0; B.sz = m.z; const [wx, wz] = W9(lx, lz); B.fx = wx; B.fz = wz; B.t = 0; B.fly = low ? 1.1 : 0.65; B.low = low; B.own = -1; B.hide = 0; B.life = 12; B.g.visible = true; B.dog = P.i; snd('ball'); }
  function dogBall(i) { if (!R) return; const P = R.dogs[i], d = P.d, e = en(), b = S().bond[d.id] | 0, nm = L(d.nm); if (R.ball.g.visible) { say('⚾ ' + (e ? 'Wait until the ball comes back.' : '공이 돌아올 때까지 기다려요.'), 2.4); return 'wait'; }
    const n = bump('ball' + i), lx = P.cx + (Math.random() - 0.5) * 1.4, lz = P.z0 + 0.25 + Math.random() * 0.6; let t = '', br = '';
    P.lie = 0; P.up = 0; P.roll = 0;
    if (d.kind === 'lively') { if (n <= 2) { br = n === 1 ? 'fetch' : 'fetch2'; throwBall(P, lx, lz); P.act = 'wait'; P.t = 6; P.wag = 1; t = n === 1 ? (e ? nm + ' chases the ball and brings it back!' : nm + '가 공을 쫓아가 물고 돌아와요!') : (e ? 'Again! ' + nm + ' really loves playing ball.' : '또 던지니 또 물어 와요. ' + nm + '는 공놀이를 정말 좋아해요.'); }
      else { br = 'tired'; throwBall(P, lx, lz); P.act = 'tired'; P.t = 4; P.wag = 0.1; snd('pant'); t = e ? nm + ' is panting. It leaves the ball and lies down to rest. Dogs need water and rest after playing.' : nm + '가 헥헥 숨이 차요. 공은 두고 엎드려 쉬어요. 신나게 논 뒤엔 물과 쉼이 필요해요.'; } }
    else if (d.kind === 'shy') { if (b < 2) { br = 'watch'; throwBall(P, lx, lz); P.act = 'watch'; P.t = 3; P.wag = 0; t = e ? nm + ' just watches the ball roll. It is still getting used to you.' : nm + '는 굴러간 공을 바라보기만 해요. 아직 낯선가 봐요.'; }
      else { br = 'keep'; throwBall(P, lx, lz); P.act = 'wait'; P.keep = 1; P.t = 6; P.wag = 0.7; t = e ? nm + ' grabs the ball and takes it to its own corner. You are becoming friends.' : nm + '가 공을 물고 자기 자리로 가요. 조금씩 친해지고 있어요.'; } }
    else { if (sleepy(d)) { br = 'sleep'; S().td.n['ball' + i] = n - 1; snd('snore'); t = e ? nm + ' is asleep. Play ball when it is awake.' : nm + '는 자고 있어요. 공놀이는 깨어 있을 때 해요.'; }
      else { br = 'nudge'; throwBall(P, fenceX(P), P.fz - 0.5, true); P.act = 'wait'; P.nudge = 1; P.t = 6; P.wag = 0.3; t = e ? 'You roll the ball gently. ' + nm + ' gives it a little push with its nose. Older dogs play slowly.' : '공을 살살 굴려 주니 ' + nm + '가 코로 툭 밀어요. 나이 든 개는 천천히 놀아요.'; } }
    if (br !== 'watch' && br !== 'sleep') played(d); say('⚾ ' + t, 4.2); P.br = br; log('ball ' + d.id + ' ' + br); return br; }
  function dogWalk(i) { if (!R) return; const P = R.dogs[i], d = P.d, e = en(), s = S(), b = s.bond[d.id] | 0, nm = L(d.nm), wx = A.wx ? A.wx() : 'clear', sea = A.season ? A.season() : '';
    const carer = t => { say('🧑 ' + (e ? 'Animal carer: “' : '동물보호사: "') + t + (e ? '”' : '"'), 4.4); };
    if (W) { carer(e ? 'You are already out on a walk.' : '지금 산책 중이에요.'); return 'busy'; }
    if (s.walk === day()) { carer(e ? 'We already went for a walk today. Come again tomorrow.' : '오늘 산책은 이미 다녀왔어요. 내일 또 와 줘요.'); return 'done'; }
    if (wx === 'rain' || wx === 'storm' || wx === 'snow') { carer(e ? 'It is ' + (wx === 'snow' ? 'snowing' : 'raining') + ', so let’s play inside today.' : (wx === 'snow' ? '눈이' : '비가') + ' 와서 오늘은 산책 대신 안에서 놀아요.'); return 'wet'; }
    if (/summer|여름/.test(String(sea)) && hour() >= 12 && hour() < 15) { carer(e ? 'At midday the pavement is hot enough to burn a dog’s paws. Let’s go when the sun is lower.' : '한낮엔 길바닥이 뜨거워 강아지 발바닥이 델 수 있어요. 해가 조금 기울면 나가요.'); return 'hot'; }
    if (d.kind === 'old') { carer(e ? nm + ' has weak legs, so long walks are hard. How about a walk with Bori or Kongi?' : nm + '는 다리가 약해서 먼 산책은 힘들어요. 보리나 콩이와 나가 볼까요?'); return 'old'; }
    if (d.kind === 'shy' && b < 2) { carer(e ? nm + ' is still nervous with you. Play together a few more days first.' : nm + '는 아직 나를 낯설어해요. 며칠 더 같이 놀고 나서 나가요.'); return 'shy'; }
    if (hour() >= 16.5) { carer(e ? 'We close soon. Let’s walk tomorrow.' : '곧 문을 닫아요. 산책은 내일 해요.'); return 'late'; }
    W = { st: 'leash', i, d, col: COLLAR[i], m: 0, g: null, tl: null, lead: null, x: 0, z: 0, tw: 0, trail: new Float32Array(128), tn: 0, stop: false, sniff: 0, sniffed: false, half: false, door: A.shelterDoor ? A.shelterDoor() : null, t0: day() };
    P.act = 'leash'; P.t = 1e9; P.g.visible = false; snd('bark'); played(d);
    say('🐾 ' + (e ? 'You clip on ' + nm + '’s lead. Go out of the door and walk once around the shelter together.' : nm + '에게 목줄을 채웠어요. 문으로 나가 보호센터 둘레를 같이 한 바퀴 걸어요.'), 4.6); log('walk start ' + d.id); return 'go'; }
  // 고양이(E 하나 → 창: 쓰다듬기 · 끈 흔들기)
  function catPanel() { if (!R) return; const e = en(), h = '<h3>🐱 ' + esc(e ? 'Cats' : '고양이') + '</h3><div class="sm">' + esc(e ? 'To do: pick one. Cats like short, gentle play.' : '할 일: 하나를 골라요. 고양이는 짧고 살살 노는 걸 좋아해요.') + '</div>'
      + '<div class="bd-ch"><button class="sub" data-w="pet">🤚 ' + esc(e ? 'Stroke gently' : '살살 쓰다듬기') + '</button><button class="sub" data-w="toy">🎀 ' + esc(e ? 'Wave a string toy' : '끈 장난감 흔들어 주기') + '</button></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const Pn = A.openP(h, false, 'whycat'); Pn.onclick = ev => { const bt = ev.target.closest('button'); if (!bt) return; A.closeP(); if (bt.dataset.w === 'pet') catPet(); else if (bt.dataset.w === 'toy') catToy(); }; }
  function catPet() { if (!R) return; const e = en(), nap = hour() >= 12 && hour() < 15, n = bump('cpet'), C = R.cats[nap ? 1 : 0], nm = L(C.c.nm); let t = '', br = '';
    if (nap && n === 1) { br = 'nap'; R.cats[0].act = 'nap'; R.cats[0].t = 5; snd('snore'); t = e ? 'The grey cat is asleep up high. Cats sleep for more than half the day. Let it sleep.' : '회색 고양이는 높은 곳에서 자고 있어요. 고양이는 하루의 절반 넘게 자요. 깨우지 않아요.'; }
    else if (n <= 1 || (nap && n === 2)) { br = 'blink'; C.act = 'blink'; C.t = 2.2; snd('purr'); t = e ? 'The ' + nm.toLowerCase() + ' slowly closes and opens its eyes. Cats do that when they feel relaxed.' : nm + '가 눈을 천천히 감았다 떠요. 고양이가 마음을 놓을 때 하는 몸짓이에요.'; }
    else if (n <= (nap ? 3 : 2)) { br = 'rub'; C.act = 'rub'; C.t = 2.4; snd('meow'); t = e ? 'The ' + nm.toLowerCase() + ' rubs its head on your hand. It is leaving its scent on you.' : nm + '가 머리를 손에 비벼요. 내 손에 자기 냄새를 묻히는 거예요.'; }
    else { br = 'flick'; C.act = 'flick'; C.t = 2; t = e ? 'The ' + nm.toLowerCase() + ' flicks its tail. That means “that is enough for now”. Let it rest.' : nm + '가 꼬리를 탁탁 쳐요. 이제 그만 만져 달라는 뜻이에요. 쉬게 두어요.'; }
    say('🐱 ' + t, 4.2); log('cat ' + br); return br; }
  function catToy() { if (!R) return; const e = en(), n = bump('ctoy'), C = R.cats[1]; let t = '', br = '';
    if (n === 1) { br = 'paw'; C.act = 'paw'; C.t = 2; t = e ? 'The orange cat bats at the string with its front paws.' : '주황 고양이가 끈을 앞발로 톡톡 쳐요.'; }
    else if (n === 2) { br = 'pounce'; C.act = 'pounce'; C.t = 2.2; snd('meow'); t = e ? 'It crouches low, wiggles its bottom, then pounces!' : '몸을 낮추고 엉덩이를 씰룩이다가 폴짝 뛰어올라요.'; }
    else { br = 'bored'; C.act = 'bored'; C.t = 2; t = e ? 'The orange cat has lost interest. Cats like to play in short bursts, many times a day.' : '주황 고양이가 이제 끈에 관심이 없어요. 고양이는 짧게, 여러 번 나눠 노는 걸 좋아해요.'; }
    say('🎀 ' + t, 4.2); log('toy ' + br); return br; }

  // ───────── 방 안 움직임(보호센터 방에 있을 때만) ─────────
  function roomTick(dt) { const [ox, oy, oz] = R.at, B = R.ball;
    if (B.g.visible && (B.life -= dt) <= 0 && B.own < 0) { B.g.visible = false; B.dog = -1; }   /* 아무도 안 물어 간 공 = 보호사가 치움(12초) */
    if (B.g.visible) { if (B.fly > 0) { B.t += dt; const k = Math.min(1, B.t / B.fly), h = B.low ? 0 : Math.sin(k * Math.PI) * 1.1; B.x = B.sx + (B.fx - B.sx) * k; B.z = B.sz + (B.fz - B.sz) * k; B.y = (B.sy + (oy + 0.07 - B.sy) * k) + h; if (k >= 1) { B.fly = 0; B.y = oy + 0.07; } }
      else if (B.own >= 0) { const P = R.dogs[B.own]; B.x = P.g.position.x + Math.sin(P.ry) * 0.62; B.z = P.g.position.z + Math.cos(P.ry) * 0.62; B.y = P.g.position.y + 0.4; }
      else if (B.hide > 0) { B.hide -= dt; if (B.hide <= 0) B.g.visible = false; }
      B.g.position.set(B.x, B.y, B.z); }
    for (const P of R.dogs) { if (P.act === 'leash') continue; P.t -= dt;
      if (P.act === 'wait' && B.fly === 0 && B.g.visible && B.dog === P.i) { P.act = 'fetch'; P.tx = B.x - ox; P.tz = B.z - oz; P.tx = Math.min(P.x1, Math.max(P.x0, P.tx)); P.tz = Math.min(P.z1, Math.max(P.z0, P.tz)); P.t = 8; }
      if (P.act === 'fetch' && Math.hypot(P.x - P.tx, P.z - P.tz) < 0.35) { if (P.nudge) { P.nudge = 0; B.fx = B.x + Math.sin(P.ry) * 0.5; B.fz = B.z + Math.cos(P.ry) * 0.5; B.sx = B.x; B.sz = B.z; B.sy = B.y; B.t = 0; B.fly = 0.6; B.low = true; B.hide = 2; B.dog = -1; P.act = 'idle'; P.t = 3; snd('ball'); }
        else { B.own = P.i; R.nf = (R.nf | 0) + 1; if (P.keep) { P.keep = 0; go(P, 'keep', P.cx - 0.8, P.z0, 4); } else go(P, 'bring', fenceX(P), P.fz, 5); } }
      if ((P.act === 'bring' || P.act === 'keep') && Math.hypot(P.x - P.tx, P.z - P.tz) < 0.3) { B.own = -1; B.hide = P.act === 'keep' ? 3 : 1.6; B.y = oy + 0.07; B.dog = -1; if (P.act === 'bring') { snd('yip'); R.nb = (R.nb | 0) + 1; } P.act = 'idle'; P.t = 3; }
      if (P.act === 'tired' && B.fly === 0 && B.dog === P.i) { B.hide = 2.5; B.dog = -1; }
      if (P.t <= 0 && P.act !== 'fetch') { if (P.act !== 'idle' && P.act !== 'greet') { P.up = 0; P.roll = 0; } if (P.act === 'tired' || P.act === 'liefence') P.lie = P.d.kind === 'old' || P.act === 'tired' ? 1 : 0; P.act = 'idle'; P.wag = P.d.kind === 'old' ? 0.08 : 0.18; P.t = 4 + Math.random() * 5; P.g9 = 0;
        if (!P.lie && !sleepy(P.d)) { P.tx = P.x0 + Math.random() * (P.x1 - P.x0); P.tz = P.z0 + Math.random() * (P.z1 - P.z0); } else { P.tx = P.x; P.tz = P.z; P.lie = 1; } }
      const dx = P.tx - P.x, dz = P.tz - P.z, l = Math.hypot(dx, dz), run = P.act === 'fetch' || P.act === 'bring' || P.act === 'greet' || P.act === 'jump', sp = P.d.sp * (run ? 1.3 : P.act === 'idle' ? 0.45 : 1) * (P.act === 'back' ? 1.4 : 1);
      let mv = 0; if (l > 0.04 && !(P.lie && P.act === 'idle')) { mv = Math.min(l, sp * dt); P.x += dx / l * mv; P.z += dz / l * mv; const want = P.act === 'back' ? Math.atan2(-dx, -dz) : Math.atan2(dx, dz); let a = want - P.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); P.ry += a * Math.min(1, dt * 8); P.lie = 0; }
      else if (l <= 0.04 && (P.act === 'come' || P.act === 'jump' || P.act === 'greet' || P.act === 'belly' || P.act === 'liefence' || P.act === 'watch')) { const m = me(); let a = (P.act === 'watch' && B.g.visible ? Math.atan2(B.x - ox - P.x, B.z - oz - P.z) : Math.atan2(m.x - ox - P.x, m.z - oz - P.z)) - P.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); P.ry += a * Math.min(1, dt * 5);
        if (P.act === 'jump') P.up = Math.min(1, P.up + dt * 4); if (P.act === 'belly') P.roll = Math.min(1, P.roll + dt * 3); if (P.act === 'liefence') P.lie = 1; }
      if (P.act === 'drink' && l <= 0.04) { P.ry = 0; P.up = -0.4; }
      P.tw += mv; const bob = mv > 0 ? Math.abs(Math.sin(P.tw * 9)) * 0.035 : 0, lieK = P.lie ? 1 : 0;
      P.g.position.set(ox + P.x, oy + bob + P.roll * 0.17 - lieK * 0.08 + P.up * 0.1, oz + P.z); P.g.rotation.y = P.ry; P.g.rotation.x = -0.5 * Math.max(0, P.up) + 0.25 * Math.max(0, -P.up); P.g.rotation.z = P.roll * 1.35; P.g.scale.y = lieK ? 0.62 : 1;
      P.tl.rotation.z = Math.sin(T * (P.wag > 0.5 ? 18 : 7)) * (0.15 + 0.6 * P.wag); }
    for (const C of R.cats) { C.t -= dt; let px = 0, ry = C.ry, y = 0, tz = Math.sin(T * 1.3 + C.i) * 0.25, tw = 0;
      if (C.t > 0) { if (C.act === 'blink') px = Math.sin(Math.min(1, (2.2 - C.t)) * Math.PI) * 0.12; else if (C.act === 'rub') { const m = me(); ry = Math.atan2(m.x - C.g.position.x, m.z - C.g.position.z); px = Math.sin(T * 6) * 0.08; } else if (C.act === 'flick') { tz = Math.sin(T * 22) * 0.8; ry = C.ry + 0.9; }
        else if (C.act === 'paw') { px = -0.35; tz = Math.sin(T * 9) * 0.4; } else if (C.act === 'pounce') { const k = 2.2 - C.t; px = k < 1 ? 0.15 : -0.45; tw = k < 1 ? Math.sin(T * 20) * 0.15 : 0; y = k >= 1 && k < 1.6 ? Math.sin((k - 1) / 0.6 * Math.PI) * 0.22 : 0; } else if (C.act === 'bored') ry = C.ry + Math.PI * 0.8; else if (C.act === 'nap') px = 0.05; }
      else C.act = '';
      let a = ry - C.g.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); C.g.rotation.y += a * Math.min(1, dt * 6); C.g.rotation.x = px; C.g.rotation.z = tw; C.g.position.y = oy + C.y + y; C.tl.rotation.z = tz; } }

  // ───────── 산책(문 밖 · 내 발자국을 따라옴 = 긴급 출동 PET-1과 같은 길) ─────────
  function trailPush(x, z) { const T9 = W.trail, i = (W.tn % 64) * 2; T9[i] = x; T9[i + 1] = z; W.tn++; }
  function walkEnd(ok, why) { if (!W) return; const e = en(), nm = L(W.d.nm), s = S();
    if (W.g) { map.remove(W.g); W.g.traverse(m => { if (m.isMesh) m.geometry.dispose(); }); } if (W.lead) { map.remove(W.lead); W.lead.geometry.dispose(); W.lead.material.dispose(); }
    if (ok) { s.walk = day(); s.walkN = (s.walkN | 0) + 1; A.GAME.mark(); snd('bark'); A.skUp && A.skUp('explore', 1, 'why:walk'); say('🐾 ' + (e ? nm + ' trots back in, wagging its tail. A walk helps a dog feel calm and happy.' : nm + '가 꼬리를 흔들며 들어가요. 산책을 다녀온 강아지는 마음이 편해져요.'), 4.4); }
    else if (why === 'short') { s.walk = day(); A.GAME.mark(); say('🐾 ' + (e ? 'You came back early. ' + nm + ' had a short walk.' : '일찍 돌아왔어요. ' + nm + '는 조금만 걸었어요.'), 3.6); }
    else say('🐾 ' + (e ? 'The animal carer took ' + nm + ' back to the shelter.' : '동물보호사가 ' + nm + '를 보호센터로 데려갔어요.'), 3.6);
    log('walk end ' + (ok ? 'ok' : why) + ' ' + Math.round(W.m)); W = null; }
  function walkTick(dt) { const e = en(), nm = L(W.d.nm);
    if (W.st === 'leash') { if (A.inb()) return;
      const m = map.player.get(); W.door = W.door || (A.shelterDoor ? A.shelterDoor() : null); const { g, tl } = dogMesh(A.parts, W.d.col, W.col); W.g = g; W.tl = tl; W.x = m.x; W.z = m.z; g.position.set(W.x, A.gy(W.x, W.z), W.z); map.add(g);
      W.lead = new T3.Mesh(new T3.BoxGeometry(0.025, 0.025, 1), new T3.MeshLambertMaterial({ color: W.col })); W.lead.userData.fx = 1; map.add(W.lead); W.st = 'walk'; trailPush(m.x, m.z); W.lx = m.x; W.lz = m.z; return; }
    if (A.inb()) { walkEnd(W.m >= WALK_M * 0.5 ? true : false, 'short'); return; }
    const m = map.player.pos(), T9 = W.trail, li = ((W.tn - 1) % 64) * 2, mv = Math.hypot(m.x - W.lx, m.z - W.lz); W.lx = m.x; W.lz = m.z;
    if (mv > 25 || Math.hypot(m.x - W.x, m.z - W.z) > 45 || hour() >= 17.5) { walkEnd(false, 'far'); return; }
    if (Math.hypot(m.x - T9[li], m.z - T9[li + 1]) > 0.5) trailPush(m.x, m.z);
    const bike = A.bike && A.bike(), gap = Math.hypot(m.x - W.x, m.z - W.z);
    if (bike || gap > 14) { if (!W.stop) { W.stop = true; say('🐾 ' + (bike ? (e ? nm + ' is scared of the bike wheels and stops. Get off (B) and walk.' : nm + '가 자전거 바퀴를 무서워해서 멈췄어요. 내려서(B) 같이 걸어요.') : (e ? nm + ' stops and waits for you.' : nm + '가 멈춰 서서 기다려요.')), 3.4); } }
    else if (W.stop && gap < 7) W.stop = false;
    if (!W.stop && !bike) W.m += mv;
    if (!W.sniffed && W.m > WALK_M * 0.4) { W.sniffed = true; W.sniff = 2.6; snd('sniff'); say('🐶 ' + (e ? nm + ' stops to sniff the ground. Dogs learn what is happening in the neighbourhood by smell.' : nm + '가 멈춰서 땅 냄새를 킁킁 맡아요. 강아지는 냄새로 동네 소식을 알아요.'), 4); }
    if (!W.half && W.m > WALK_M * 0.7 && W.door) { W.half = true; say('🐾 ' + (e ? 'Almost a full lap. Head back to the shelter door.' : '거의 한 바퀴예요. 보호센터 문으로 돌아가요.'), 3.4); }
    if (W.m >= WALK_M && W.door && Math.hypot(m.x - W.door[0], m.z - W.door[1]) < 6) { walkEnd(true); return; }
    if (W.sniff > 0) W.sniff -= dt;
    else if (!W.stop) { let tx = null, tz = null, acc = 0, px = m.x, pz = m.z; for (let k = 1; k <= Math.min(W.tn, 63); k++) { const j = ((W.tn - k) % 64 + 64) % 64 * 2, qx = T9[j], qz = T9[j + 1]; acc += Math.hypot(qx - px, qz - pz); px = qx; pz = qz; if (acc >= 1.3) { tx = qx; tz = qz; break; } }
      if (tx != null) { const dx = tx - W.x, dz = tz - W.z, l = Math.hypot(dx, dz); if (l > 0.05) { const v = Math.min(l, (l > 3 ? 5.6 : 4.2) * dt); W.x += dx / l * v; W.z += dz / l * v; W.tw += v; W.g.rotation.y = Math.atan2(dx, dz); } } }
    const gy = A.gy(W.x, W.z); W.g.position.set(W.x, gy + Math.abs(Math.sin(W.tw * 6)) * 0.05, W.z); W.tl.rotation.z = Math.sin(T * 16) * 0.6;
    /* 목줄 = 내 손(1.0m) → 강아지 목(0.42m) 사이 가는 막대 하나 */
    const hx = m.x, hy = m.y + 0.95, hz = m.z, nx = W.x + Math.sin(W.g.rotation.y) * 0.25, ny = gy + 0.42, nz = W.z + Math.cos(W.g.rotation.y) * 0.25, ll = Math.hypot(hx - nx, hy - ny, hz - nz);
    W.lead.position.set((hx + nx) / 2, (hy + ny) / 2, (hz + nz) / 2); W.lead.scale.set(1, 1, Math.max(0.05, ll)); W.lead.lookAt(_v.set(hx, hy, hz)); }

  // ───────── ③ 바깥 · 방 소품(감사 상위 · docs/systems/town_why.md) ─────────
  const won = v => (en() ? '₩' + (v | 0).toLocaleString('en') : (v | 0).toLocaleString('ko') + '원');
  const hotNear = re => { const m = me(); let b = null, bd = 4; for (const h of map.interact.list({ kind: 'game' })) { if (h.off || !re.test(h.label || '')) continue; const d = Math.hypot(h.x - m.x, h.z - m.z); if (d < bd) { bd = d; b = h; } } return b; };
  const SND2 = { baa: () => { tone(320, 0, 0.12, 'triangle', 0.05, 300); tone(305, 0.12, 0.28, 'triangle', 0.05, 262); }, moo: () => tone(150, 0, 0.7, 'triangle', 0.07, 112), splash: () => { tone(1400, 0, 0.05, 'sine', 0.03, 900); tone(1100, 0.06, 0.06, 'sine', 0.025, 700); },
    beep: () => { tone(1320, 0, 0.06, 'square', 0.015); tone(1320, 0.1, 0.06, 'square', 0.015); }, print: () => { for (let i = 0; i < 5; i++) tone(220 + i * 10, i * 0.07, 0.05, 'triangle', 0.02); }, squeak: () => { tone(1500, 0, 0.06, 'sine', 0.03, 1800); tone(1500, 0.12, 0.06, 'sine', 0.03, 1800); }, bubble: () => { tone(500, 0, 0.05, 'sine', 0.03, 800); tone(650, 0.08, 0.05, 'sine', 0.025, 950); } };
  const sn = k => { if (SND2[k]) SND2[k](); };
  const sea = () => String(A.season ? A.season() : 'summer'), wx = () => (A.wx ? A.wx() : 'clear'), night = () => !!(A.night && A.night());
  // 목장 양·소: E 하나가 가장 가까운 한 마리를 따라감(0.4초마다 · 양몰이 중 꺼짐)
  let FARM = null, FQ = null, FT = 0, sec9 = 0;
  function farmUse() { const q = FQ, H9 = A.herd && A.herd(); if (!q || !H9) return; const e = en(), m = me(), sheep = q.k === 'sheep', n = bump(sheep ? 'sheep' : 'cow'); let t = '', br = '';
    if (sheep) { if (n === 1) { br = 'baa:' + sea(); H9.anFace(q, m.x, m.z, false, 2); sn('baa'); t = (e ? 'The sheep says “baa” and lifts its head. ' : '양이 "매애" 하고 고개를 들어요. ') + (sea() === 'spring' ? (e ? 'Sheep are sheared in spring, so they are not too hot in summer.' : '봄에는 양털을 깎아요. 털이 길면 여름에 더워서요.') : sea() === 'summer' ? (e ? 'Its wool was sheared in spring, so it looks light.' : '봄에 털을 깎아서 몸이 가뿐해 보여요.') : (e ? 'Its wool has grown thick, so it stays warm on cold days.' : '털이 두툼하게 자라서 추운 날에도 따뜻해요.')); }
      else if (n === 2) { br = 'flock'; H9.anFace(q, m.x, m.z, true, 0); t = e ? 'The sheep turns back toward the flock. Sheep feel safe when they are together.' : '양이 무리 쪽으로 몸을 돌려요. 양은 무리와 함께 있어야 마음을 놓아요.'; }
      else { br = 'graze'; H9.anCalm(q); t = e ? 'The sheep goes back to eating grass. Sheep spend much of the day grazing.' : '양이 다시 풀을 뜯어요. 양은 하루의 많은 시간을 풀을 먹으며 보내요.'; } }
    else { if (wx() === 'rain' && n === 1) { br = 'rain'; H9.anFace(q, m.x, m.z, true, 0); sn('moo'); t = e ? 'It is raining. The cow lowers its head and stands still.' : '비가 와서 소가 머리를 낮추고 가만히 서 있어요.'; }
      else if (n === 1) { br = 'look'; H9.anFace(q, m.x, m.z, false, 2); sn('moo'); t = e ? 'The cow looks at you with big eyes. Cows can’t see right behind them, so walk up slowly from the front or side.' : '소가 큰 눈으로 나를 바라봐요. 소는 바로 뒤쪽을 잘 못 봐서, 앞이나 옆에서 천천히 다가가야 놀라지 않아요.'; }
      else if (n === 2) { br = 'chew'; H9.anCalm(q); t = e ? 'The cow is chewing and chewing. It brings swallowed grass back up to chew again. This is called chewing the cud.' : '소가 입을 오물오물 움직여요. 삼킨 풀을 다시 꺼내 씹는 되새김질이에요.'; }
      else { br = 'stomach'; H9.anCalm(q); t = e ? 'A cow’s stomach has four parts, so it digests grass slowly, step by step.' : '소의 위는 네 칸으로 나뉘어 있어요. 풀을 여러 번에 걸쳐 천천히 소화해요.'; } }
    if (A.bubble) A.bubble({ x: q.x, y: q.y, z: q.z, sc: sheep ? 0.75 : 0.95 }, sheep ? (e ? 'Baa~' : '매애~') : (e ? 'Moo~' : '음메~'));
    FT = 3.5; say((sheep ? '🐑 ' : '🐄 ') + t, 4.4); log('farm ' + q.k + ' ' + br); return br; }
  function farmSec() { if (!FARM) return; const H9 = A.herd && A.herd(), m = me(); if (FT > 0 && FQ) return; const q = H9 && !H9.on && H9.anNear ? H9.anNear(m.x, m.z, 4.5) : null; FQ = q; const h = FARM.hot; if (!q || (A.busy && A.busy())) { h.off = true; return; }
    h.x = q.x; h.z = q.z; h.y = q.y; h.off = false; h.label = q.k === 'sheep' ? (en() ? '🐑 Say hello to the sheep' : '🐑 양에게 인사하기') : (en() ? '🐄 Say hello to the cow' : '🐄 소에게 인사하기'); }
  // 동물 마당 강아지(상자 몸 · 움직이지 않음 → 짖는 말풍선 + 소리 + 한 줄)
  function yardUse(Y) { const e = en(), n = bump('yd'), dg = Y.d[(n - 1) % Y.d.length] || [Y.x, Y.z]; let t = '', br = '';
    if (night()) { br = 'night'; if (A.bubble) A.bubble({ x: dg[0], y: Y.y, z: dg[1], sc: 0.6 }, e ? '(zzz)' : '(쿨쿨)'); snd('snore'); t = e ? 'The dogs are sleeping by the kennel. Walk past quietly.' : '강아지들이 개집 곁에서 자요. 조용히 지나가요.'; }
    else if (n === 1) { br = 'hello'; if (A.bubble) A.bubble({ x: dg[0], y: Y.y, z: dg[1], sc: 0.6 }, e ? 'Woof woof!' : '멍멍!'); snd('bark'); t = e ? 'A dog in the yard barks hello. With a dog you don’t know, ask the owner first before going near.' : '마당 강아지가 반갑다고 짖어요. 모르는 강아지에게는 주인에게 먼저 물어보고 다가가요.'; }
    else if (n === 2) { br = 'home'; if (A.bubble) A.bubble({ x: dg[0], y: Y.y, z: dg[1], sc: 0.6 }, e ? 'Arf!' : '왈!'); snd('yip'); t = e ? 'Barking can also mean “this is my home”. Dogs tell others about their place.' : '강아지가 짖는 건 "여기 우리 집이야" 하고 알리는 말이기도 해요.'; }
    else { br = 'water'; if (A.bubble) A.bubble({ x: Y.x + 3.5, y: Y.y, z: Y.z + 3.4, sc: 0.5 }, e ? '(full bowl)' : '(물그릇 가득)'); tone(880, 0, 0.07, 'sine', 0.04, 560); t = e ? 'The water bowl is full. Dogs drink a lot on hot days, so they always need fresh water.' : '물그릇에 물이 가득해요. 강아지는 더운 날 물을 많이 마셔서, 늘 새 물을 채워 줘요.'; }
    say('🐕 ' + t, 4.2); log('yard ' + br); return br; }
  // 분수(물에 손 · 계절·밤·비 · 몇 번째)
  function fountainUse(f) { const e = en(), n = bump('fn'), m = me(), gy = A.ty ? A.ty(f.x, f.z) : m.y, dx = m.x - f.x, dz = m.z - f.z, l = Math.hypot(dx, dz) || 1, rx = f.x + dx / l * 1.7, rz = f.z + dz / l * 1.7; let t = '', br = '';
    const splash = () => { sn('splash'); if (A.puff) A.puff(rx, gy + 0.56, rz, [0x8fd8ff, 0xcfeeff, 0x6cc0f0], 0.8); };
    if (sea() === 'winter') { br = 'winter'; tone(220, 0, 0.08, 'triangle', 0.04); t = e ? 'In winter the fountain is turned off, because water left in the pipes could freeze and burst them.' : '겨울엔 분수 물줄기를 멈춰 둬요. 관 속 물이 얼면 관이 터질 수 있어서요.'; }
    else if (wx() === 'rain') { br = 'rain'; splash(); t = e ? 'Raindrops draw little rings on the fountain water.' : '빗방울이 분수 물낯에 동그라미를 그려요.'; }
    else if (night()) { br = 'night'; splash(); t = e ? 'The water is cold at night. The street lights sparkle on the water.' : '밤이라 물이 차가워요. 가로등 빛이 물낯에 비쳐 반짝여요.'; }
    else if (n === 1) { br = 'cool'; splash(); t = e ? 'You dip your hand in the fountain. It feels cool.' : '분수 물에 손을 담가 보니 시원해요.'; }
    else if (n === 2) { br = 'pump'; splash(); t = e ? 'A pump sends the same water back up again and again. That saves water.' : '분수는 같은 물을 펌프로 돌려 다시 뿜어 올려요. 물을 아끼는 방법이에요.'; }
    else { br = 'drink'; t = e ? 'Fountain water is not for drinking. If you are thirsty, drink at the spring or at home.' : '분수 물은 마시는 물이 아니에요. 목이 마르면 약수터나 집에서 마셔요.'; tone(440, 0, 0.07, 'sine', 0.04, 392); }
    say('💧 ' + t, 4.2); log('fountain ' + br); return br; }
  // 은행 번호표 · 현금 지급기 · 병원 키 재기 · 아쿠아리움 수조·작은 동물 방
  function ticket() { const e = en(), s = S(), D = day(), mn = A.GAME.S.min | 0, h = hour(); sn('print');
    if (s.tk && s.tk.d === D && mn - s.tk.m < 90) { say('🎫 ' + (e ? 'One ticket per person. Your number is ' + s.tk.n + '.' : '번호표는 한 사람에 한 장이에요. 내 번호는 ' + s.tk.n + '번이에요.'), 3.6); log('tk again'); return 'again'; }
    const wait = h >= 11.5 && h < 13.5 ? 5 : h >= 15 ? 3 : h < 10.5 ? 1 : 2, n = 101 + ((D * 37 + (mn / 9 | 0)) % 80); s.tk = { d: D, m: mn, n }; A.GAME.mark();
    const why = wait === 5 ? (e ? ' It is lunchtime, so many people have come to the bank.' : ' 점심때라 은행에 온 사람이 많아요.') : wait === 3 ? (e ? ' It is busy before closing time.' : ' 문 닫기 전이라 조금 붐벼요.') : '';
    say('🎫 ' + (e ? 'You took ticket ' + n + '. ' + wait + ' people are ahead of you.' + why + ' Go when your number lights up above the counter.' : '번호표 ' + n + '번을 뽑았어요. 앞에 ' + wait + '명이 기다려요.' + why + ' 창구 위 빛판에 내 번호가 뜨면 가요.'), 4.6); log('tk ' + n + ' w' + wait); return 'w' + wait; }
  function atm() { const e = en(), n = bump('atm'), bal = ((((A.GAME.S.bldg || {}).bank) || {}).bal) | 0; sn('beep'); let t = '', br = '';
    if (n === 1 && bal <= 0) { br = 'nobook'; t = e ? 'A cash machine lets you put in or take out money with a bankbook or card. You don’t have a bankbook yet. You get one when you first save at the counter.' : '현금 지급기는 통장이나 카드로 돈을 넣고 찾는 기계예요. 아직 내 통장이 없어요. 창구에서 처음 저금하면 생겨요.'; }
    else if (n === 1) { br = 'print'; sn('print'); t = e ? 'You put in your bankbook and it gets updated. Money in the bankbook: ' + won(bal) + '.' : '통장을 넣으니 통장 정리가 돼요. 통장에 있는 돈: ' + won(bal) + '.'; }
    else if (n === 2) { br = 'pin'; t = e ? 'When you type a secret number, cover the keys with your other hand. Only you should know it.' : '비밀번호를 누를 땐 다른 손으로 가려요. 내 비밀번호는 나만 알아야 해요.'; }
    else { br = 'hours'; t = e ? 'Many cash machines work even when the counters are closed.' : '현금 지급기는 창구가 쉬는 때에도 쓸 수 있는 곳이 많아요.'; }
    say('🏧 ' + t, 4.6); log('atm ' + br); return br; }
  function height() { const e = en(), s = S(), D = day(), part = hour() < 11 ? 'am' : 'pm', cm = 135 + (part === 'am' ? 1 : 0), last = s.ht, n = bump('ht'); let t = '', br = '';
    tone(660, 0, 0.05, 'triangle', 0.04); tone(880, 0.08, 0.06, 'triangle', 0.04);
    if (last && last.part !== part && D - last.d <= 3) { if (part === 'pm') { br = 'shorter'; t = e ? 'About ' + cm + ' cm — 1 cm less than in the morning. Standing all day presses the soft discs in your back together. Sleep brings it back.' : cm + 'cm쯤이에요. 아침에 잰 것보다 1cm쯤 작아요. 하루 내내 서 있으면 등뼈 사이 물렁뼈가 눌려서 그래요. 자고 나면 돌아와요.'; } else { br = 'taller'; t = e ? 'About ' + cm + ' cm — 1 cm more than in the afternoon. While you sleep lying down, the discs in your back spread out again.' : cm + 'cm쯤이에요. 오후에 잰 것보다 1cm쯤 커요. 누워 자는 동안 등뼈 사이가 다시 펴져서 그래요.'; } }
    else if (n >= 2) { br = 'again'; t = e ? 'Still about ' + cm + ' cm. Your height changes a little between morning and evening. Come and measure at a different time.' : '아까와 같은 ' + cm + 'cm쯤이에요. 키는 아침과 저녁에 조금 달라요. 다른 때에 와서 다시 재 봐요.'; }
    else { br = 'first'; t = e ? 'You stand against the measuring stick. It says about ' + cm + ' cm.' : '막대 앞에 서서 재 보니 눈금이 ' + cm + 'cm쯤이에요.'; }
    s.ht = { d: D, part }; A.GAME.mark(); say('📏 ' + t, 4.8); log('ht ' + br); return br; }
  function clione() { const e = en(), n = bump('cl'), h = hotNear(/🐚/); let t = '', br = ''; sn('bubble');
    if (h && A.puff) A.puff(h.x, h.y + 1.7, h.z - 1.4, [0xf6f4ff, 0xcfeeff, 0xff8a6a], 0.4);
    if (n === 1) { br = 'what'; t = e ? 'Sea angels are tiny shell-less sea snails. They swim by flapping wing-like fins.' : '클리오네는 껍데기 없는 작은 바다 고둥 무리예요. 날개 같은 지느러미를 팔랑이며 헤엄쳐요.'; }
    else if (n === 2) { br = 'clear'; t = e ? 'Its body is see-through, so you can see the orange insides.' : '몸이 투명해서 속의 주황빛 내장이 비쳐 보여요.'; }
    else { br = 'cold'; t = e ? 'Sea angels live in very cold seas, so the tank water is kept cold too.' : '클리오네는 아주 차가운 바다에 살아요. 그래서 수조 물도 차갑게 맞춰 둬요.'; }
    say('🐚 ' + t, 4.4); log('cl ' + br); return br; }
  function smallAnimals() { const e = en(), n = bump('sa'), h = hotNear(/🐰/); let t = '', br = ''; sn('squeak');
    if (h && A.bubble) A.bubble({ x: h.x, y: h.y, z: h.z - 2.8, sc: 0.5 }, n === 2 ? (e ? 'Wheek wheek' : '뀨뀨') : (e ? '(sniff sniff)' : '(코 쫑긋)'));
    if (hour() < 11 && n === 1) { br = 'hay'; t = e ? 'It is morning, so the rabbits and guinea pigs are munching hay.' : '아침이라 토끼와 기니피그가 건초를 오물오물 먹고 있어요.'; }
    else if (n === 1) { br = 'nose'; t = e ? 'A rabbit twitches its nose. It is sniffing to check what is around.' : '토끼가 코를 쫑긋쫑긋 움직여요. 냄새로 둘레를 살피는 거예요.'; }
    else if (n === 2) { br = 'talk'; t = e ? 'A guinea pig squeaks “wheek wheek”. Guinea pigs live in groups and talk to each other with sounds.' : '기니피그가 "뀨뀨" 소리를 내요. 기니피그는 무리 지어 살며 소리로 서로 이야기해요.'; }
    else { br = 'gentle'; t = e ? 'Small animals get scared if you suddenly pick them up. Sitting and watching quietly is best.' : '작은 동물은 갑자기 들어 올리면 무서워해요. 앉아서 가만히 바라보는 게 가장 좋아요.'; }
    say('🐰 ' + t, 4.4); log('sa ' + br); return br; }
  // 바깥 E 다는 곳(town.js setEntries가 부름 · 다시 지을 때 ENTH와 같이 치워짐)
  function entries(push) { const e = en(); FARM = null; FQ = null;
    for (const f of (A.fountains ? A.fountains() : [])) push(map.interact.add({ kind: 'game', x: f.x, z: f.z, y: A.ty(f.x, f.z), r: 2.9, label: e ? '💧 Touch the fountain water' : '💧 분수 물 만져 보기', use: () => fountainUse(f) }));
    for (const Y of (A.yardDogs ? A.yardDogs() : [])) push(map.interact.add({ kind: 'game', x: Y.x, z: Y.z + 6.5, y: A.ty(Y.x, Y.z + 6.5), r: 2.6, label: e ? '🐕 Say hello to the yard dogs' : '🐕 마당 강아지에게 인사하기', use: () => yardUse(Y) }));
    const H9 = A.herd && A.herd(); if (H9 && H9.anNear) { FARM = map.interact.add({ kind: 'game', x: 0, z: 0, y: -999, r: 2.6, label: '🐑', use: () => farmUse() }); FARM.hot.off = true; push(FARM); } }

  // ───────── E 손잡이(방 extra · town_bldg.js use가 'why:'로 넘김) ─────────
  function use(kk) { if (dead || (A.panelOpen && A.panelOpen())) return; if (kk === 'why:c') return catPanel(); if (kk === 'why:tk') return ticket(); if (kk === 'why:atm') return atm(); if (kk === 'why:ht') return height(); if (kk === 'why:cl') return clione(); if (kk === 'why:sa') return smallAnimals(); const m = /^why:d(\d)$/.exec(kk); if (m) return dogPanel(+m[1]); }
  return {
    shelterRoom, roomLeft, use, entries,
    tick(dt) { if (dead) return; T += dt; if (R) roomTick(Math.min(dt, 0.1)); if (W) walkTick(Math.min(dt, 0.1)); if (FT > 0) { FT -= dt; if (FT <= 0 && FQ && A.herd && A.herd()) A.herd().anCalm(FQ); } if ((sec9 -= dt) <= 0) { sec9 = 0.4; farmSec(); } },
    info: () => ({ room: R ? { dogs: R.dogs.map(P => ({ id: P.d.id, act: P.act, br: P.br || '', x: +P.x.toFixed(2), z: +P.z.toFixed(2), wag: P.wag, lie: P.lie, up: +P.up.toFixed(2), roll: +P.roll.toFixed(2), vis: P.g.visible })), cats: R.cats.map(C => ({ id: C.c.id, act: C.act })), ball: { vis: R.ball.g.visible, own: R.ball.own, fly: R.ball.fly, nf: R.nf | 0, nb: R.nb | 0 } } : null,
      walk: W ? { st: W.st, m: Math.round(W.m), stop: W.stop, d: W.d.id, door: W.door } : null, s: JSON.parse(JSON.stringify(S())), dbg: DBG.slice() }),
    dbg: { farm: () => farmUse(), farmQ: () => (FQ ? { k: FQ.k, x: FQ.x, z: FQ.z } : null), farmHot: () => (FARM ? { off: !!FARM.hot.off, x: FARM.hot.x, z: FARM.hot.z, label: FARM.hot.label } : null), yard: Y => yardUse(Y), fountain: f => fountainUse(f), pet: i => dogPet(i), ball: i => dogBall(i), walk: i => dogWalk(i), cat: () => catPet(), toy: () => catToy(), walkM: v => { if (W) W.m = v; } },
    dispose() { dead = true; if (W) walkEnd(false, 'far'); R = null; },
  };
}
