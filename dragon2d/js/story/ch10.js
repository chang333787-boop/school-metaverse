// 10장 대장 드래곤(#24~27 · design §2 · 탑뷰) — ① 해변: 숨 들이켬(목 부풂 + 입 안 밝아짐) → 가로 불 띠(0.5초 전에 굳음) → 머리가 내려오면 눈에 볼라 → 친구 기술 · 어른이 무기를 내려놓음
// ② 물속(밝은 물빛 · 거품): 사슬 셋 가운데 투슬리스 고리 → 숨 고를 때 F 꾹 → 아빠가 끊음 → 서로 구함 → 해변 말 ③ 하늘 싸움(구름 숨기 · 킁킁 · 세로 불 띠 · 날갯바람 · 날개 막 구멍)
// ④ 마지막: 꼬리날개 불(4초 예고) → 둔해진 조종으로 오르기 → 숨 들이켬 → 급강하 · 입이 밝을 때 F → 곧바로 솟구치기 ⑤ 연기 속 스토이크로 걷기 → 날개를 편 투슬리스 → "고맙다."
// 깜짝 X: 공격 앞엔 늘 ! + 몸짓 예고(쉬움 3 · 보통 2.5 · 어려움 2초) · 불 겨눔은 뿜기 0.5초 전에 굳음(design §17-10) · 대장만 무찌름 · 떨어지는 장면은 먼 구도 · 폭발 소리는 작게
import { say, talk, wait, until, goal, near, dist, talking, useAt, throwFrom, previewArc, knock, sfx, shoot, burst, puff, faceTo } from './kit.js?v=1';
import { createFlight, addCloud } from '../play/flight.js?v=1';
import { makePlace } from '../play/world.js?v=1';
import { clearFx } from '../play/fx.js?v=1';

const TELL = { easy: 3, normal: 2.5, hard: 2 };
const LOCK = 0.5;                                            // 겨눔이 굳는 때(뿜기 전 초)
const INK = '#2b2118';
const r2 = (v) => Math.round(v * 100) / 100;
const ease = (a, b, k) => a + (b - a) * Math.min(1, k);
const zone = (G, x, y, w, h, lock) => G.marks.push({ k: 'zone', x, y, w, h, c: lock ? 'rgba(200,68,46,.34)' : 'rgba(200,68,46,.14)', s: lock ? 'rgba(168,62,30,.95)' : 'rgba(168,62,30,.5)' });
const text = (G, x, y, t, s = 20, c) => G.marks.push({ k: 'text', x, y, t, s, c });
const warn = (G, x, y) => G.marks.push({ k: '!', x, y });
function mkBoss(G, x, y, rot, scale) { return (G.boss = { x, y, rot, scale, alpha: null, pose: { tell: 0, glow: 0, mouth: 0, holes: 0, eyes: 1, sniff: 0, dizzy: 0 } }); }
/* 곁일(생성기 여럿) — 차례 걸음마다 함께 돎 */
function jobs(list, dt) { for (let i = list.length - 1; i >= 0; i--) if (list[i].next(dt).done) list.splice(i, 1); }

/* ① 친구 기술 — 맞힌 차례마다 한 친구(나이트메어 불 · 지플백 가스 + 불티 = 펑 · 그롱클 돌) */
function* friend(G, B, d, k) {
  d.busy = true;
  const side = d.home[0] < 25 ? -1 : 1, hx = B.x, hy = B.y - 1.4;
  say(G, 'hiccup', ['눈이야! 스노트라우트!', '쌍둥이, 지금이야!', '피시레그, 부탁해!'][k - 1], { secs: 1.3 });
  d.to = [B.x + side * 3.4, B.y + 3.2]; d.spd = 11;
  yield* until(() => !d.to, 3);
  d.flip = side > 0 ? -1 : 1; d.pose.mouth = 0.8; d.pose.tell = 1;
  if (d.kind === 'nightmare') {
    sfx(G, 'fire', hx);
    for (let t = 0; t < 1.1;) { t += yield; const q = G.rng(); puff('flame', d.x + (hx - d.x) * q, d.y - d.z + (hy - d.y + d.z) * q, 0.3, 0, 0, 0.6, 0.4, 0.35); }
    burst('ember', hx, hy, 0.6, 10, 3, 0.6, 0.12, G.rng);
    say(G, 'snotlout', '불꽃 한 방! 눈앞이 캄캄하지?', { secs: 1.8 });
  } else if (d.kind === 'zippleback') {
    for (let t = 0; t < 0.9;) { t += yield; if (G.rng() < 0.5) puff('gas', hx + (G.rng() - 0.5) * 3, hy + (G.rng() - 0.5) * 1.6, 0.6, 0, 0, 0.2, 1.4, 0.45); }
    sfx(G, 'pop', hx); burst('spark', hx, hy, 0.6, 10, 4, 0.5, 0.12, G.rng); burst('flame', hx, hy, 0.4, 8, 3, 0.5, 0.4, G.rng);
    for (let t = 0; t < 0.9;) { t += yield; text(G, hx, hy - 0.8, '펑!', 30, '#a83e1e'); }
    say(G, 'tuffnut', '봤지? 내 가스!', { secs: 1.3 }); say(G, 'ruffnut', '불티는 내가 냈거든!', { secs: 1.5 });
  } else {
    const T = 0.5; shoot({ kind: 'lava', x: d.x, y: d.y, z: d.z, vx: (hx - d.x) / T, vy: (hy + 1.2 - d.y) / T, vz: (1.2 - d.z) / T, g: 0, r: 0.4, life: T, noWall: true, noShadow: true });
    yield* wait(T);
    sfx(G, 'thud', hx); burst('ember', hx, hy, 0.6, 8, 3, 0.6, 0.12, G.rng); burst('dust', hx, hy, 0.6, 6, 2, 0.6, 0.3, G.rng);
    say(G, 'fishlegs', '그롱클 돌 한 방! …이건 책에 꼭 쓸 거야.', { secs: 2 });
  }
  d.pose.mouth = 0; d.pose.tell = 0;
  yield* wait(0.5);
  d.to = d.home.slice(); d.spd = 8; d.busy = false;
}
/* ① 어른이 무기를 내려놓음 — 보여 줘서 하는 설득(해변 무기 더미) */
function* drop(G, v, pile, k) {
  yield* wait(1.4);
  v.to = [pile.x + (k - 2) * 0.9, pile.y + 0.7]; v.spd = 3.4;
  yield* until(() => !v.to, 6);
  v.pose.carry = null; v.dir = 'up'; pile.o.n = k * 2; sfx(G, 'clang', pile.x); burst('dust', pile.x, pile.y, 0.2, 5, 1.2, 0.5, 0.2, G.rng);
  say(G, v.who, ['…무기를 내려놓겠다. 저 아이들 말이 맞아.', '나도 내려놓겠네.', '우리도! 대장만 막으면 되잖아.'][k - 1], { actor: v, icons: ['x'], secs: 2.2 });
  if (k === 1) G.hud.banner('어른들이 무기를 내려놓는다', 'axe', 2.2);
  yield* wait(0.8);
  v.to = [v.x + (k - 2) * 1.4, v.y - 0.6]; v.spd = 2;
}

/* ② 물속 그림 — 가라앉는 배 밑바닥 · 사슬 셋 · 사슬 끝(해초 덤불에 가림 → 가까이 가면 닻·돛대·투슬리스) */
function chain(ctx, x0, y0, x1, y1, sh, t) {
  ctx.strokeStyle = '#6e6c66'; ctx.lineWidth = 0.07;
  for (let i = 0; i <= 14; i++) { const q = i / 14, x = x0 + (x1 - x0) * q + Math.sin(q * 3.1416) * Math.sin(t * 1.3 + x0) * sh, y = y0 + (y1 - y0) * q; ctx.beginPath(); ctx.ellipse(x, y, 0.09, 0.16, i & 1 ? 0 : 1.57, 0, 7); ctx.stroke(); }
}
function weed(ctx, x, y, t) {
  ctx.fillStyle = 'rgba(28,72,66,.55)'; ctx.beginPath(); ctx.ellipse(x, y - 0.7, 1.5, 1.1, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3f7a52'; ctx.lineWidth = 0.13; ctx.lineCap = 'round';
  for (let j = 0; j < 6; j++) { const bx = x - 1 + j * 0.4, w = Math.sin(t * 1.6 + j) * 0.3; ctx.beginPath(); ctx.moveTo(bx, y + 0.3); ctx.quadraticCurveTo(bx + w, y - 0.8, bx + w * 1.6, y - 1.9 - (j % 3) * 0.3); ctx.stroke(); }
}
function anchor(ctx, x, y) {
  ctx.strokeStyle = INK; ctx.lineWidth = 0.05; ctx.fillStyle = '#7d7a74';
  ctx.fillRect(x - 0.1, y - 1.5, 0.2, 1.4); ctx.strokeRect(x - 0.1, y - 1.5, 0.2, 1.4); ctx.fillRect(x - 0.5, y - 1.3, 1, 0.16); ctx.strokeRect(x - 0.5, y - 1.3, 1, 0.16);
  ctx.beginPath(); ctx.moveTo(x - 0.7, y - 0.6); ctx.quadraticCurveTo(x, y + 0.3, x + 0.7, y - 0.6); ctx.lineWidth = 0.16; ctx.strokeStyle = '#7d7a74'; ctx.stroke();
}
function mast(ctx, x, y) {
  ctx.save(); ctx.translate(x, y - 0.4); ctx.rotate(-0.5); ctx.fillStyle = '#8a6a43'; ctx.strokeStyle = INK; ctx.lineWidth = 0.05;
  ctx.fillRect(-1.3, -0.14, 2.6, 0.28); ctx.strokeRect(-1.3, -0.14, 2.6, 0.28); ctx.fillStyle = '#d8c8a0'; ctx.beginPath(); ctx.moveTo(-0.6, 0.14); ctx.lineTo(0.5, 0.14); ctx.lineTo(0.1, 0.9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
/* ⑤ 연기 — 스토이크 둘레만 보임(두 겹 가장자리) */
const SMOKE_RINGS = [[0.5, 1.45], [0.5, 1]];

export const chapter = {
  id: 10, title: '대장 드래곤', sub: '친구들과 함께 — 대장만 막으면 돼', place: 'beach', time: 'fog',
  end: '대장이 쓰러지고, 둥지 섬 하늘이 맑아졌다',
  steps: [
    /* ① 해변 — 대장 머리(화면 위 · 머리가 아래) · 숨 들이켬 → 가로 불 띠(내 줄을 따라오다 0.5초 전에 굳음) → 위아래로 비키기 · 머리가 내려오면 눈에 볼라 · 셋 맞히면 끝 */
    { id: '10-1', verb: 'throw', goal: '대장 드래곤을 막아라', at: [25, 14.5], face: [0, -1], zoom: 0.75, limit: 150,
      hints: ['불을 뿜고 나면 머리가 내려와요 — 그때 눈에 볼라(Space)', '▼ 자리에서 위를 보고 Space · 붉은 띠가 굳으면 위아래로 비켜요'],
      *run(G) {
        const s = 0.55, UP = 7.2, LOW = 8.8, EYE = 4.6 * s, tell = TELL[G.diff], win = { easy: 5, normal: 3.6, hard: 3 }[G.diff], maxHits = { easy: 99, normal: 4, hard: 3 }[G.diff];
        const W = G.W, P = G.P, B = mkBoss(G, 25, UP, Math.PI, s);
        const old = W.findProp('weapon_pile'); if (old) { old.hide = true; if (old.box) old.box.off = true; }
        const ship = W.findProp('ship', 38, 28.5); ship.hide = false; if (ship.box) ship.box.off = false; ship.o.burn = 0;
        const pile = W.prop('weapon_pile', 25, 16.9, { n: 0 });
        const T = G.cast.dragon('toothless', 37.5, 26.3, { flip: -1, fear: 0.5 }); T.ySort = 3;
        G.cast.person('stoick', 11, 13.4, { dir: 'side', flip: 1 });
        const vik = [[14.5, 16.4, 'villager'], [17.5, 16.9, 'villager2'], [32.5, 16.9, 'villager'], [35.5, 16.4, 'villager2']].map(([x, y, w]) => G.cast.person(w, x, y, { dir: 'up', pose: { carry: 'axe' } }));
        const FR = [['nightmare', 'snotlout', 11, 12.6], ['zippleback', 'twins', 39, 12.6], ['gronckle', 'fishlegs', 13.5, 15.4]].map(([k, r, x, y], i) => { const d = G.cast.dragon(k, x, y, { z: 3.4, flip: x < 25 ? 1 : -1, fear: 0, pose: { wing: 1, rider: r }, flapHz: 1.5 }); d.home = [x, y]; d.ph = i * 2.1; d.busy = false; return d; });
        const ast = G.cast.dragon('nadder', 36.5, 15.4, { z: 3.2, flip: -1, fear: 0, pose: { wing: 1, rider: 'astrid' }, flapHz: 1.6 });
        P.carry = 'bola'; P.gate = [3, 10.4, 47, 16.4];
        G.camOpt = { fixY: 10.2 };
        /* 둥지 도착 — 대장이 깨어나 어른들 배가 탐 → 역할 나누기(누가 무엇을 맡나) · 대장은 아직 머리만 든 채(공격 차례는 말이 끝난 뒤) */
        const ship0 = W.findProp('ship', 10, 28); if (ship0) ship0.o.burn = 1;
        G.camOpt = { fixX: 25, fixY: 20.5 };
        yield* talk(G, [['astrid', '둥지 섬이야! 어른들 배가… 불타고 있어!', ['ship']], ['stoick', '히컵?! 여긴 위험하다! 물러나라!']]);
        G.camOpt = { fixY: 10.2 }; sfx(G, 'roar', B.x);
        yield* talk(G, [['hiccup', '아빠가 둥지를 쳐서, 구멍 속 대장이 깨어났어.', ['nose']], ['fishlegs', '저렇게 큰 건 책에도 없어!']]);
        yield* talk(G, [['hiccup', '다들 맡을 일을 나누자! 나는 볼라로 대장 눈을 맞힐게.', ['eye', 'bola']], ['hiccup', '스노트라우트는 불꽃으로 눈앞을 캄캄하게!'], ['hiccup', '쌍둥이는 가스에 불티를 붙여서 — 펑!'], ['hiccup', '피시레그는 그롱클 돌로 쿵, 큰 소리를 내 줘!'], ['hiccup', '아스트리드는 불 속 어른들을 구해 줘!', ['axe']], ['astrid', '맡겨 둬. 다들, 가자!']]);
        say(G, 'hiccup', '불을 뿜고 머리가 내려올 때 — 눈이야!', { icons: ['eye'], secs: 2.4 });
        const X = [18, 25, 32], job = [];
        let ph = 'move', pt = 0, tx = 25, lockY = P.y, hits = 0, got = 0, reload = 0, blindT = -9, saidBlind = false;
        G.flags.x10 = () => ({ ph, lockY, lock: ph === 'fire' || (ph === 'tell' && pt >= tell - LOCK), got, hits });
        const land = (q) => {
          const ex = B.x, ey = B.y - EYE, d = Math.hypot(q.x - ex, (q.y - ey) * 1.25);
          if (ph === 'low' && d < 1.5) {
            got++; ph = 'stun'; pt = 0; B.pose.dizzy = 1; B.pose.eyes = 1; sfx(G, 'thud', ex); burst('dust', ex, ey, 1, 8, 2, 0.5, 0.25, G.rng);
            job.push(friend(G, B, FR[got - 1], got), drop(G, vik[got - 1], pile, got));
            return;
          }
          if (ph !== 'stun' && d < 3.2 && G.t - blindT > 5) {          /* 머리를 들고 있을 땐 눈 여섯이 다 봄 — 숨 고를 때 노려야 */
            blindT = G.t; B.pose.eyes = 1;
            if (!saidBlind) { saidBlind = true; say(G, 'fishlegs', '사각이 없어! 눈이 여섯 개야 — 숨 고를 때 노려!', { icons: ['eye'], secs: 2.6 }); }
            else say(G, 'hiccup', '다 보고 있어… 머리가 내려올 때!', { secs: 1.6 });
          }
        };
        while (true) {
          const dt = yield; pt += dt; jobs(job, dt);
          for (const d of FR) if (!d.busy && !d.to) d.z = 3.4 + Math.sin(G.t * 1.8 + d.ph) * 0.25;
          ast.z = 3.2 + Math.sin(G.t * 1.6 + 5) * 0.25;
          /* 대장 */
          if (ph === 'move') {
            B.x += Math.sign(tx - B.x) * Math.min(Math.abs(tx - B.x), dt * 3); B.y = ease(B.y, UP, dt * 4); B.pose.eyes = 1;
            if (pt > 1.4 && Math.abs(B.x - tx) < 0.05) { ph = 'tell'; pt = 0; lockY = P.y; sfx(G, 'inhale', B.x); }
          } else if (ph === 'tell') {
            B.pose.tell = Math.min(1, pt / (tell * 0.6)); B.pose.glow = Math.min(1, pt / tell); warn(G, B.x + 3, B.y - 1.6);
            const lk = pt >= tell - LOCK; if (!lk) lockY = ease(lockY, P.y, dt * 8);
            zone(G, 25, lockY, 44, 2.2, lk);
            if (pt >= tell) { ph = 'fire'; pt = 0; B.pose.mouth = 1; sfx(G, 'fire', B.x); }
          } else if (ph === 'fire') {
            const reach = Math.min(1, pt / 0.5) * 24;               /* 머리 아래에서 양옆으로 번지는 불 줄 */
            zone(G, 25, lockY, 44, 2.2, true);
            for (let i = 0; i < 3; i++) puff('flame', B.x + (G.rng() * 2 - 1) * reach, lockY + (G.rng() - 0.5) * 1.6, 0.1, 0, 0, 0.5, 0.5 + G.rng() * 0.3, 0.45);
            for (let i = 0; i < 2; i++) { const q = G.rng(); puff('flame', B.x + (G.rng() - 0.5) * 0.6, B.y + (lockY - B.y) * q, 0.4, 0, 0, 0.3, 0.3, 0.35); }
            if (Math.abs(P.y - lockY) < 1.35 && Math.abs(P.x - B.x) <= reach && pt < 1.0 && knock(G, 0, P.y >= lockY ? 1 : -1, 0.8)) hits++;
            if (pt > 1.1) { ph = 'low'; pt = 0; B.pose.tell = 0; B.pose.glow = 0; B.pose.mouth = 0.25; }
          } else if (ph === 'low') {
            B.y = ease(B.y, LOW, dt * 8); B.pose.eyes = 0.55;
            G.marks.push({ k: 'ring', x: B.x, y: B.y - EYE, r: 1.1, c: '#f4ead2' });
            if (G.diff === 'easy') G.fspots.push({ x: B.x, y: B.y - EYE + 5 });
            if (pt > win) { ph = 'raise'; pt = 0; }
          } else if (ph === 'raise') {
            B.y = ease(B.y, UP, dt * 5); B.pose.eyes = 1; B.pose.mouth = 0;
            if (pt > 0.6) { ph = 'move'; pt = 0; let n = tx; while (n === tx) n = X[Math.floor(G.rng() * 3)]; tx = n; }
          } else if (ph === 'stun') {
            B.y = ease(B.y, LOW, dt * 4); B.pose.mouth = 0.2;
            if (pt > 1 && !FR[got - 1].busy) { if (got >= 3) break; B.pose.dizzy = 0; ph = 'raise'; pt = 0; }
          }
          /* 볼라 — 1초에 하나 · 마구 누르면 안 나감 */
          if (reload > 0) { reload -= dt; if (reload <= 0) P.carry = 'bola'; }
          if (P.carry === 'bola' && ph !== 'stun') {
            previewArc(G);
            if (G.I.pressed.use && !(P.mashT > 0)) { P.carry = null; reload = 1.0; sfx(G, 'whoosh', P.x); throwFrom(G, 'bola', { shot: { land } }); }
          }
          goal(G, ph === 'low' || ph === 'stun' ? B.x : tx, LOW - EYE + 5);
          if (hits >= maxHits) { say(G, 'astrid', '히컵, 숨 돌리고 다시!'); yield* wait(1); return 'retry'; }
        }
        /* 대장이 비틀 → 투슬리스가 묶인 배에 불 → 가라앉음(보이는 변화 · 다음 차례로) */
        goal(G, null); P.carry = null; B.pose.dizzy = 0;
        say(G, 'astrid', '대장이 비틀거려! …어, 배 쪽으로!');
        G.camOpt = { fixX: 36, fixY: 20.5 };
        for (let t = 0; t < 2.4;) {
          const dt = yield; t += dt; jobs(job, dt);
          B.rot = ease(B.rot, Math.PI - 0.45, dt * 2); B.pose.tell = Math.min(1, t); B.pose.glow = Math.min(1, t);
          if (t > 1) { B.pose.mouth = 1; for (let i = 0; i < 2; i++) puff('flame', ship.x + (G.rng() - 0.5) * 9, 27.2 + (G.rng() - 0.5) * 1.6, 0.4, 0, 0, 0.6, 0.6, 0.45); }
          if (t > 1.6) ship.o.burn = 1;
        }
        sfx(G, 'splash', ship.x); burst('drop', ship.x, 27.4, 0.6, 14, 3, 0.8, 0.12, G.rng);
        for (let i = 0; i < 8; i++) puff('bubble', ship.x + (G.rng() - 0.5) * 8, 27.6, 0.2, 0, 0, 1.2, 1.6, 0.14);
        ship.hide = true; if (ship.box) ship.box.off = true; T.hide = true; B.pose.mouth = 0; B.pose.glow = 0; B.pose.tell = 0;
        G.hud.banner('투슬리스가 묶인 배가 가라앉는다', 'ship', 2.4);
        yield* talk(G, [['astrid', '히컵! 투슬리스가 묶인 배가 가라앉고 있어!', ['ship']], ['hiccup', '…투슬리스! 사슬을 풀어야 해 — 물속으로!', ['rope']]]);
        return true;
      },
      sense: (G) => { const f = G.flags.x10 && G.flags.x10(), B = G.boss; if (!f || !B) return {}; const s = 0.55; return { ph: f.ph, B: [r2(B.x), r2(B.y)], eye: [r2(B.x), r2(B.y - 4.6 * s)], stand: r2(8.8 - 4.6 * s + 5), band: f.ph === 'tell' || f.ph === 'fire' ? { y: r2(f.lockY), h: 2.2, lock: f.lock } : null, carry: G.P.carry, got: f.got, hits: f.hits, gate: [10.4, 16.4] }; } },

    /* ② 물속(밝은 물빛 · 거품) — 사슬 셋(끝은 해초 덤불에 가림) → 가까이 가면 보임(투슬리스 = 동그란 눈) → 숨 고를 때 고리 앞에서 F 꾹 → 아빠가 끊음 → 서로 구함 → 해변 말 */
    { id: '10-2', verb: 'ring', place: 'under', time: 'day', goal: '투슬리스를 구해라', at: [12, 3.4], face: [0, 1], zoom: 0.85, limit: 110,
      hints: ['사슬 끝 덤불에 가까이 가 봐요 — 동그란 눈이 보이는 쪽', '투슬리스가 숨 고를 때 고리 앞에서 Space를 꾹'],
      *run(G) {
        const P = G.P, ti = Math.floor(G.rng() * 3);
        const ends = G.W.A.chains.map(([x, y], i) => ({ x, y, x0: 6 + i * 6, seen: false, kind: i === ti ? 'toothless' : i === (ti + 1) % 3 ? 'anchor' : 'mast' }));
        const E = ends[ti], ring = [E.x, E.y - 0.7];
        const T = G.cast.dragon('toothless', E.x + 0.3, E.y + 0.4, { flip: -1, fear: 0 }); T.hide = true; T.pupilTo = 1;
        const calmT = { easy: 3.2, normal: 2.4, hard: 2 }[G.diff], thrT = { easy: 1, normal: 1.3, hard: 1.5 }[G.diff], need = { easy: 0.8, normal: 1, hard: 1.2 }[G.diff];
        let prog = 0, grabbed = false, cut = false, saidSlip = false, cyc = 0, thr = false, bub = 0;
        G.flags.x10 = () => ({ ends, ring, ringOn: E.seen && !grabbed, calm: !thr, prog });
        G.drawUnder = (ctx, V, t) => {
          V.at(0, 0);
          ctx.fillStyle = '#5a4030'; ctx.strokeStyle = INK; ctx.lineWidth = 0.06;
          ctx.beginPath(); ctx.moveTo(2, -0.4); ctx.quadraticCurveTo(12, 2.6, 22, -0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
          for (const e of ends) {
            if (!(cut && e === E)) chain(ctx, e.x0, 1.2, e.x, e.y - 0.7, e === E && thr ? 0.4 : 0.15, t);
            if (!e.seen) { weed(ctx, e.x, e.y, t); continue; }
            if (e.kind === 'anchor') anchor(ctx, e.x, e.y); else if (e.kind === 'mast') mast(ctx, e.x, e.y);
            else if (!cut) { ctx.strokeStyle = '#8d8a82'; ctx.lineWidth = 0.1; ctx.beginPath(); ctx.ellipse(ring[0], ring[1], 0.3, 0.22, 0, 0, 7); ctx.stroke(); }
          }
        };
        G.drawOver = (ctx, V) => {
          if (!E.seen || grabbed || prog <= 0) return;
          V.at(0, 0); ctx.strokeStyle = '#e6c464'; ctx.lineWidth = 0.14; ctx.beginPath(); ctx.arc(ring[0], ring[1], 0.6, -1.5708, -1.5708 + 6.2832 * Math.min(1, prog / need)); ctx.stroke();
        };
        say(G, 'hiccup', '(사슬이 셋… 어느 게 투슬리스 거지?)', { icons: ['rope'] });
        while (!grabbed) {
          const dt = yield;
          bub += dt; if (bub > 0.9) { bub = 0; puff('bubble', P.x + 0.1, P.y, 1.5, 0, 0, 1.2, 1.6, 0.1); puff('bubble', 2 + G.rng() * 20, 6 + G.rng() * 10, 0, 0, 0, 1.2, 2.4, 0.12); }
          for (const e of ends) if (!e.seen && dist(G, e.x, e.y) < 3.2) {
            e.seen = true;
            if (e === E) { T.hide = false; say(G, 'hiccup', '투슬리스! 눈이 동그래졌어 — 나를 알아봐!', { secs: 2 }); }
            else say(G, 'hiccup', e.kind === 'anchor' ? '이건 닻 사슬이야.' : '이건 부러진 돛대야.', { secs: 1.4 });
          }
          if (E.seen) goal(G, ring[0], ring[1], { h: 1.2 });
          else { let b = null, bd = 1e9; for (const e of ends) if (!e.seen) { const d = dist(G, e.x, e.y); if (d < bd) { bd = d; b = e; } } goal(G, b.x, b.y, { h: 2.4 }); }
          if (!E.seen) continue;
          /* 숨 고르기 ↔ 버둥 — 버둥일 땐 고리를 놓침(누르고만 있기 막기 · design §1) */
          cyc += dt;
          if (!thr && cyc > calmT) { thr = true; cyc = 0; } else if (thr && cyc > thrT) { thr = false; cyc = 0; }
          if (thr) { T.x = E.x + 0.3 + Math.sin(G.t * 30) * 0.12; T.pupilTo = 0.2; T.pose.wing = 1; text(G, T.x, T.y - 2.2, '버둥버둥', 16); if (G.rng() < 0.3) puff('bubble', T.x + (G.rng() - 0.5), T.y - 0.5, 0.5, 0, 0, 1.2, 1.2, 0.12); }
          else { T.x = E.x + 0.3; T.pupilTo = 1; T.pose.wing = 0; faceTo(T, P.x, P.y); }
          const at = dist(G, ring[0], ring[1]) < 1.6;
          if (at) G.fspots.push({ x: ring[0], y: ring[1], label: 'F꾹' });
          if (at && G.I.down.use) {
            P.handLock = 1;
            if (thr) { if (prog > 0.05 && !saidSlip) { saidSlip = true; say(G, 'hiccup', '버둥거릴 땐 놓쳐! 숨 고를 때.', { secs: 1.6 }); } prog = 0; }
            else { prog += dt; if (prog >= need) grabbed = true; }
          } else { P.handLock = 0; prog = Math.max(0, prog - dt * 2); }
        }
        goal(G, null); thr = false; T.x = E.x + 0.3; T.pupilTo = 1; T.pose.wing = 0; sfx(G, 'clang', ring[0]);
        say(G, 'hiccup', '안 끊어져…!', { secs: 1.6 });
        const st = G.cast.person('stoick', 12, -1.5, { dir: 'down' }); st.to = [ring[0] + 0.9, ring[1] - 0.3]; st.spd = 4.5;
        yield* until(() => !st.to, 6);
        cut = true; P.handLock = 0; sfx(G, 'clang', ring[0]); burst('spark', ring[0], ring[1], 0.5, 8, 2, 0.4, 0.1, G.rng);
        yield* talk(G, [['stoick', '끊었다! 아빠가 왔다, 히컵.'], ['hiccup', '아빠…!']]);
        T.pose.wing = 1; T.flapHz = 2; T.to = [T.x, -3]; T.spd = 3.2; st.to = [st.x, -3]; st.spd = 3.2;
        say(G, 'hiccup', '투슬리스가 아빠를 물 밖으로 끌어올려!', { secs: 2.4 });
        for (let t = 0; t < 2.6;) { t += yield; if (G.rng() < 0.4) puff('bubble', T.x + (G.rng() - 0.5), T.y, 0.5, 0, 0, 1.2, 1.2, 0.12); }
        /* 해변 — 서로 구한 뒤 한마디(아들 이야기는 여기서만 · design §2) */
        yield* until(() => !talking(G), 4);
        G.hud.veil.show('', ''); yield* wait(0.5);
        G.W = G.place = makePlace('beach', 'fog'); G.cast.clear(); clearFx(); G.drawUnder = null; G.drawOver = null;
        P.x = 24; P.y = 22.4; P.vx = P.vy = 0; P.handLock = 0; P.dir = 'side'; P.flip = 1; P.fx = 1; P.fy = 0;
        G.V.setZoom(1); G.V.snap(24, 21.6, G.W.bounds);
        const pile = G.W.findProp('weapon_pile'); if (pile) pile.o.n = 6;
        const sh = G.W.findProp('ship', 38, 28.5); if (sh) { sh.hide = true; if (sh.box) sh.box.off = true; }
        const sk = G.cast.person('stoick', 26.4, 22, { dir: 'side', flip: -1 }); G.cast.dragon('toothless', 20.4, 22.6, { flip: 1, fear: 0 });
        G.hud.veil.hide();
        faceTo(sk, P.x, P.y);
        yield* talk(G, [['stoick', '네 드래곤이… 나를 물 밖으로 꺼내 줬다.'], ['hiccup', '아빠도 투슬리스 사슬을 끊어 주셨잖아요.'], ['hiccup', '회의 때 그러셨죠. "바이킹은 겁나도 간다."'], ['stoick', '…그래. 겁나도 가는 건 너였구나.'], ['stoick', '내가 틀렸다. 넌 내 자랑이야.', ['heart']], ['hiccup', '가자, 투슬리스. 이번엔 같이.', ['saddle']]]);
        return true;
      },
      sense: (G) => { const f = G.flags.x10 && G.flags.x10(); if (!f || !f.ends) return {}; return { ends: f.ends.map((e) => ({ x: e.x, y: e.y, seen: e.seen, kind: e.seen ? e.kind : null })), ring: f.ringOn ? f.ring : null, calm: f.calm, prog: r2(f.prog) }; } },

    /* ③ 하늘 싸움(싸움터 비행) — 대장이 화면 위(머리가 아래) · 구름 속 = 못 겨눔(킁킁만) · 숨 들이켬 → 내 x로 머리를 옮기다 0.5초 전에 굳음 → 세로 불 띠
       · 날갯바람(보통부터) = 내 줄 가로 띠 · F = 위로 플라스마(한 발씩 · 마구 쏘면 숨이 참) → 날개 막에 구멍 · 쉬움 4 · 보통 6 */
    { id: '10-3', verb: 'boss', place: 'sea', time: 'fog', goal: '대장의 날개를 뚫어라', at: [24, 20.5], zoom: 0.62, limit: 150,
      hints: ['가운데 머리 말고 양옆 날개 막 밑에서 Space — 한 발씩', '목이 부풀면 곧 불 — 붉은 띠가 굳으면 옆으로 비켜요'],
      *run(G) {
        const A = [10, 15.5, 38, 22.5], s = 0.25;
        const F = G.Fl = createFlight(24, 20.5, { arena: A, fin: 'new', rider: 'hiccup', assist: G.diff === 'easy' }); G.mode = 'fly';
        G.camOpt = { fixX: 24, fixY: 14 }; G.V.snap(24, 14);
        const B = mkBoss(G, 24, 13.5, Math.PI, s);
        for (const [x, y] of [[15, 18.8], [24, 21], [33, 18.8]]) addCloud(F, x, y, 5.2, 3);
        const need = G.diff === 'easy' ? 4 : 6, maxHits = { easy: 99, normal: 3, hard: 2 }[G.diff], tell = TELL[G.diff], idle = { easy: 1.6, normal: 0.8, hard: 0.5 }[G.diff], idleHid = { easy: 2.6, normal: 2, hard: 1.6 }[G.diff];
        const gone = [], clampX = (x) => Math.max(A[0] + 3, Math.min(A[2] - 3, x));
        const BAND = { k: 'col', x: 0, y: 0, w: 0, h: 0, lock: false };      /* 띠 하나를 돌려 씀(걸음마다 새 객체 X) */
        let ph = 'idle', pt = 0, holes = 0, hits = 0, sway = 0, lockY = 20, reveal = 0, sniffC = null, moveN = 0, band = null, saidBody = -9, saidMash = false;
        G.flags.x10 = () => ({ ph, A, holes, need, hits, band });
        const cloudOf = () => { for (const o of F.ob) if (o.k === 'cloud' && Math.abs(F.x - o.x) < o.w / 2 && Math.abs(F.y - o.y) < o.h / 2) return o; return null; };
        const hurt = (ux, uy) => {
          if (F.invT > 0) return; F.invT = 1.3; hits++; F.vx += ux * 8; F.vy += uy * 9; sfx(G, 'thud', F.x); burst('smoke', F.x, F.y, 1, 5, 1.5, 0.8, 0.3, G.rng);
          say(G, 'hiccup', hits === 1 ? '으앗! 한 번 맞았어.' : '뜨거워! …괜찮아, 계속!', { secs: 1.2 });
        };
        const shotHit = (q) => {
          const dx = Math.abs(q.x - B.x);
          if (dx < 8 * s && q.y < B.y - 0.3) { burst('spark', q.x, q.y, q.z, 6, 3, 0.4, 0.1, G.rng); if (G.t - saidBody > 6) { saidBody = G.t; say(G, 'hiccup', '몸은 너무 단단해 — 날개 막!', { secs: 1.2 }); } return true; }
          if (dx >= 8 * s && dx <= 28.5 * s && q.y < B.y - 17 * s) {
            holes++; B.pose.holes = Math.min(8, holes); B.flinch = 0.4; sfx(G, 'pop', q.x); burst('spark', q.x, q.y, q.z, 8, 3, 0.4, 0.12, G.rng); puff('smoke', q.x, q.y, q.z, 0, 0, 0.5, 1, 0.4);
            if (holes === 1) say(G, 'hiccup', '맞았다! 날개 막에 구멍!', { secs: 1.4 });
            else if (holes === need - 1) say(G, 'astrid', '하나만 더!', { secs: 1.2 });
            return true;
          }
          return false;
        };
        F.onShoot = () => {
          F.cool = 0.9;
          if (G.P.mashT > 0) { burst('plasma', F.x, F.y - 1.4, 1.2, 4, 1, 0.3, 0.12, G.rng); if (!saidMash) { saidMash = true; say(G, 'hiccup', '마구 쏘면 투슬리스 숨이 차! 한 발씩.', { secs: 1.8 }); } return; }
          if (F.hidden) reveal = 1.6;                               /* 구름에 숨어 쏘면 자리가 드러남 → 쏘고 옮기기 */
          sfx(G, 'whoosh', F.x);
          shoot({ kind: 'plasma', x: F.x, y: F.y - 1.6, z: 1.2, vx: 0, vy: -20, g: 0, life: 1.3, mine: true, noWall: true, noShadow: true, hit: shotHit });
        };
        yield* talk(G, [['astrid', '대장이 날아올랐어! 하늘은 너희 둘한테 맡길게!'], ['hiccup', '날개 막을 노리자. 구름에 숨었다가 쏘고 — 바로 옮겨!', ['cloud', 'eye']]]);
        while (holes < need) {
          const dt = yield; pt += dt; if (reveal > 0) reveal -= dt;
          const see = !F.hidden || reveal > 0;
          for (let i = gone.length - 1; i >= 0; i--) if ((gone[i].back -= dt) <= 0) { F.ob.push(gone[i]); gone.splice(i, 1); }
          if (ph === 'idle') {
            /* 보이면 머리가 나를 따라옴(몸통이 막음 · 곧 공격) · 구름 속이면 못 찾고 흔들림 → 날개가 내 위로 지나감 = 쏠 때 */
            B.pose.sniff = 0;
            if (see) { B.x = ease(B.x, clampX(F.x), dt * 1.3); sway = Math.asin(Math.max(-1, Math.min(1, (B.x - 24) / 5))); }
            else { sway += dt * 0.5 * (1 - holes * 0.05); B.x = ease(B.x, 24 + Math.sin(sway) * 5, dt * 1.5); }
            if (pt > (see ? idle : idleHid)) {
              pt = 0; moveN++;
              if (!see) { ph = 'sniff'; sniffC = cloudOf(); }
              else if (G.diff !== 'easy' && moveN % 3 === 0) { ph = 'gust'; lockY = F.y; sfx(G, 'flap', B.x); }
              else { ph = 'tell'; sfx(G, 'inhale', B.x); }
            }
          } else if (ph === 'tell') {
            B.pose.tell = Math.min(1, pt / (tell * 0.6)); B.pose.glow = Math.min(1, pt / tell); warn(G, B.x + 2.6, B.y - 0.8);
            const lk = pt >= tell - LOCK; if (!lk && see) B.x = ease(B.x, clampX(F.x), dt * 1.6);
            band = BAND; BAND.k = 'col'; BAND.x = r2(B.x); BAND.w = 3.2; BAND.lock = lk; zone(G, B.x, (B.y + A[3] + 0.6) / 2, 3.2, A[3] + 0.6 - B.y, lk);
            if (pt >= tell) { ph = 'fire'; pt = 0; B.pose.mouth = 1; band.lock = true; sfx(G, 'fire', B.x); }
          } else if (ph === 'fire') {
            zone(G, B.x, (B.y + A[3] + 0.6) / 2, 3.2, A[3] + 0.6 - B.y, true);
            for (let i = 0; i < 4; i++) puff('flame', B.x + (G.rng() - 0.5) * 2.6, B.y + 0.5 + G.rng() * (A[3] + 0.5 - B.y), 0.4, 0, 6, 0.4, 0.45, 0.42);
            if (Math.abs(F.x - B.x) < 2.15 && F.y > B.y && pt < 1.0) hurt(F.x >= B.x ? 1 : -1, 0);
            if (pt > 1.1) { ph = 'idle'; pt = 0; band = null; B.pose.tell = 0; B.pose.glow = 0; B.pose.mouth = 0; sway = Math.asin(Math.max(-1, Math.min(1, (B.x - 24) / 5))); }
          } else if (ph === 'gust') {
            B.scale = s * (1 + 0.1 * Math.min(1, pt / (tell * 0.6))); warn(G, B.x + 2.6, B.y - 0.8);
            const wv = Math.sin(G.t * 8) * 0.2; text(G, B.x - 6, B.y - 5 + wv, '휘잉', 18); text(G, B.x + 6, B.y - 5 - wv, '휘잉', 18);
            const lk = pt >= tell - LOCK; if (!lk && see) lockY = ease(lockY, F.y, dt * 6);
            band = BAND; BAND.k = 'row'; BAND.y = r2(lockY); BAND.h = 2.4; BAND.lock = lk; zone(G, (A[0] + A[2]) / 2, lockY, A[2] - A[0] + 2, 2.4, lk);
            if (pt >= tell) { ph = 'gustgo'; pt = 0; band.lock = true; sfx(G, 'wind', B.x); }
          } else if (ph === 'gustgo') {
            zone(G, (A[0] + A[2]) / 2, lockY, A[2] - A[0] + 2, 2.4, true); B.scale = ease(B.scale, s, dt * 4);
            for (let i = 0; i < 3; i++) puff('steam', A[0] + G.rng() * (A[2] - A[0]), lockY + (G.rng() - 0.5) * 2, 0.6, (G.rng() < 0.5 ? -1 : 1) * 3, 7, 0, 0.5, 0.3);
            if (Math.abs(F.y - lockY) < 1.75 && pt < 0.8) hurt(0, 1);
            if (pt > 0.9) { ph = 'idle'; pt = 0; band = null; B.scale = s; sway = Math.asin(Math.max(-1, Math.min(1, (B.x - 24) / 5))); }
          } else if (ph === 'sniff') {
            B.pose.sniff = 1; text(G, B.x, B.y + 1.4, '킁킁', 20); if (sniffC) B.x = ease(B.x, clampX(sniffC.x), dt * 1.2);
            if (pt > 2.4) {
              B.pose.sniff = 0; const c = cloudOf();
              if (F.hidden && c && c === sniffC) {                   /* 냄새로 찾음 → 그 구름을 불어 날림(맞지는 않음) */
                F.ob.splice(F.ob.indexOf(c), 1); c.back = 7; gone.push(c); reveal = 1.5;
                burst('steam', c.x, c.y, 1, 12, 3, 1.2, 0.5, G.rng); sfx(G, 'whoosh', c.x); say(G, 'fishlegs', '냄새로 찾았어! 거기서 나와!', { secs: 1.6 });
              }
              ph = 'idle'; pt = 0; sway = Math.asin(Math.max(-1, Math.min(1, (B.x - 24) / 5)));
            }
          }
          if (B.flinch > 0) { B.flinch -= dt; B.pose.eyes = 0.4; } else B.pose.eyes = 1;
          if (hits >= maxHits) { say(G, 'astrid', '히컵, 너무 많이 맞았어! 다시 — 구름 사이로!'); yield* wait(1); return 'retry'; }
        }
        band = null; F.noShoot = true; B.pose.tell = 0; B.pose.glow = 0; B.pose.mouth = 0.3; B.pose.dizzy = 1;
        say(G, 'hiccup', '날개 막이 약해! 구멍이 났어!'); say(G, 'astrid', '대장이 낮게 날기 시작했어!');
        for (let t = 0; t < 3.4 || talking(G);) { const dt = yield; t += dt; B.y += dt * 0.4; if (t > 9) break; }
        return true;
      },
      sense: (G) => { const f = G.flags.x10 && G.flags.x10(), B = G.boss; if (!f || !B || !f.A) return {}; return { ph: f.ph, A: f.A, B: [r2(B.x), r2(B.y)], wing: [2, 7.1], holes: f.holes, need: f.need, hits: f.hits, band: f.band }; } },

    /* ④ 마지막(영화대로 고정) — 대장이 아래에서 쫓아옴(머리가 위) · 꼬리날개 불(4초 예고 → 조종이 둔해짐) → ↑ 높이(그림이 커짐) → 숨 들이켬(입 안 밝아짐)
       → ↓ 급강하해 입 고리 위로 · 입이 가장 밝을 때 F → 곧바로 ↑ 솟구치기 · 놓치면 오르기부터 다시(짧게) · 와! = 쏘고 솟구치는 1초 */
    { id: '10-4', verb: 'dive', place: 'sea', time: 'fog', tint: 'storm', goal: '대장을 끝내라', at: [24, 10], zoom: 0.56, limit: 120,
      hints: ['↑로 높이 오른 뒤, 입이 밝아지면 ↓로 곧장 내려가요', '입 고리 바로 위에서 입이 가장 밝을 때 Space — 그리고 바로 ↑'],
      *run(G) {
        const A = [12, 2.5, 36, 13.6], MX = 24, MY = 15.6;                 /* 입이 말풍선(화면 아래 가운데) 위에 오게 */
        const F = G.Fl = createFlight(24, 10, { arena: A, fin: 'new', rider: 'hiccup' }); G.mode = 'fly';
        G.camOpt = { fixX: 24, fixY: 10.5 }; G.V.snap(24, 10.5);
        const B = mkBoss(G, MX, MY, 0, 0.45);
        G.flyPose = { fin: 'new' };
        const tell = TELL[G.diff], bright = { easy: 2.2, normal: 1.4, hard: 1 }[G.diff], upT = { easy: 1.8, normal: 1.3, hard: 1 }[G.diff];
        let ph = 'fin', pt = 0, vx0 = 0, vy0 = 0, shotY = 0, saidEarly = -9, hitNow = false;
        const inZone = () => Math.abs(F.x - MX) < 1.8 && F.y > MY - 4.6;
        G.flags.x10 = () => ({ ph, glow: B.pose.glow, inZone: inZone(), mouth: [MX, MY - 0.9], A });
        F.onShoot = () => {
          F.cool = 0.6;
          if (G.P.mashT > 0) return;
          if (ph === 'bright' && inZone()) {
            shoot({ kind: 'plasma', x: F.x, y: F.y + 0.8, z: 1.2, vx: (MX - F.x) * 3, vy: 16, g: 0, life: Math.max(0.05, (MY - 0.8 - F.y) / 16), mine: true, noWall: true, noShadow: true });
            ph = 'up'; pt = 0; shotY = F.y; B.pose.mouth = 0.05; sfx(G, 'whoosh', F.x);
            say(G, 'hiccup', '입 안에 들어갔다! 위로!', { secs: 1.2 });
          } else if (ph === 'inhale' && G.t - saidEarly > 3) { saidEarly = G.t; say(G, 'hiccup', '아직! 입이 더 밝아질 때.', { secs: 1.2 }); }
        };
        yield* talk(G, [['hiccup', '꼬리날개에 불티가 붙었어…!', ['finNew']], ['hiccup', '다 타 버리기 전에 끝내야 해. 투슬리스, 조금만 더!']]);
        while (true) {
          const dt = yield; pt += dt;
          /* 탄 꼬리 = 둔한 조종(솟구칠 때만 투슬리스가 힘을 짜냄) */
          if (ph !== 'fin' && ph !== 'up') { F.vx = vx0 + (F.vx - vx0) * 0.35; F.vy = vy0 + (F.vy - vy0) * 0.35; }
          vx0 = F.vx; vy0 = F.vy;
          F.scale = 0.78 + (A[3] - F.y) / (A[3] - A[1]) * 0.5;      /* 높을수록 크게(가까이) */
          if (G.rng() < 0.6) puff('flame', F.x + (G.rng() - 0.5) * 0.4, F.y + 1.8 * F.scale, 1.2, 0, 0.6, 0.4, 0.35, 0.16 + Math.min(1, pt / 4) * 0.1);
          if (ph === 'fin') {
            if (pt > 2) G.flyPose.fin = 'burnt';
            if (pt > 4) { ph = 'climb'; pt = 0; say(G, 'hiccup', '꼬리가 타서 말을 잘 안 들어! 일단 위로!', { secs: 1.8 }); }
          } else if (ph === 'climb') {
            goal(G, 24, A[1] + 0.4, { h: 1.2 }); B.pose.tell = 0; B.pose.glow = 0; B.pose.mouth = 0;
            if (F.y < A[1] + 1.4) { ph = 'inhale'; pt = 0; sfx(G, 'inhale', MX); }
          } else if (ph === 'inhale') {
            B.pose.tell = Math.min(1, pt / (tell * 0.6)); B.pose.glow = 0.74 * Math.min(1, pt / tell); B.pose.mouth = 0.4 + 0.4 * Math.min(1, pt / tell); warn(G, MX + 2.6, MY + 0.6);
            G.marks.push({ k: 'ring', x: MX, y: MY - 0.9, r: 1.3, c: '#f4ead2' }); zone(G, MX, (A[1] + MY) / 2, 3.6, MY - A[1], false); goal(G, MX, MY - 2.6, { h: 1.2 });
            if (pt >= tell) { ph = 'bright'; pt = 0; }
          } else if (ph === 'bright') {
            B.pose.glow = 1; B.pose.mouth = 1; warn(G, MX + 2.6, MY + 0.6);
            G.marks.push({ k: 'ring', x: MX, y: MY - 0.9, r: 1.3, c: '#f6d26a' }); zone(G, MX, (A[1] + MY) / 2, 3.6, MY - A[1], true); goal(G, MX, MY - 2.6, { h: 1.2 });
            if (G.diff === 'easy') G.fspots.push({ x: MX, y: MY - 2.6, h: 1.2 });
            if (pt >= bright) { ph = 'fire'; pt = 0; hitNow = false; sfx(G, 'fire', MX); }
          } else if (ph === 'fire') {
            zone(G, MX, (A[1] + MY) / 2, 3.6, MY - A[1], true);
            for (let i = 0; i < 4; i++) puff('flame', MX + (G.rng() - 0.5) * 3, MY - G.rng() * (MY - A[1]), 0.5, 0, -7, 0.4, 0.45, 0.42);
            if (Math.abs(F.x - MX) < 2.4 && pt < 0.9 && F.invT <= 0) { F.invT = 1.3; hitNow = true; F.vx += F.x >= MX ? 7 : -7; sfx(G, 'thud', F.x); burst('smoke', F.x, F.y, 1, 5, 1.5, 0.8, 0.3, G.rng); say(G, 'hiccup', '놓쳤다 — 다시 위로!', { secs: 1.4 }); }
            if (pt > 1) { if (!hitNow) say(G, 'hiccup', '타이밍을 놓쳤어. 다시 위로!', { secs: 1.4 }); ph = 'climb'; pt = 0; B.pose.tell = 0; B.pose.glow = 0; B.pose.mouth = 0; }
          } else if (ph === 'up') {
            goal(G, F.x, shotY - 3.2, { h: 1.2 }); B.pose.tell = 1; B.pose.glow = 1; B.pose.mouth = 0.05;
            if (F.y < shotY - 2.6) break;
            if (pt > upT) { burst('flame', MX, MY - 1, 1, 12, 4, 0.6, 0.4, G.rng); G.sfx.play('boom', { x: MX }, 0.3); F.invT = 1.5; say(G, 'hiccup', '늦었다! 다시 위로…', { secs: 1.4 }); ph = 'climb'; pt = 0; B.pose.tell = 0; B.pose.glow = 0; }
          }
        }
        /* 와! — 솟구침 · 대장이 쓰러지는 건 먼 구도(크기·흐려짐) · 폭발 소리는 작게 · 그 뒤는 연기 속(화면 밖) */
        goal(G, null); F.noShoot = true; F.lockH = F.lockV = true; F.arena = [12, -60, 36, A[3]];
        burst('flame', MX, MY - 0.6, 1, 16, 5, 0.8, 0.45, G.rng); G.sfx.play('boom', { x: MX }, 0.35);
        G.hud.banner('와! 솟구쳤다!', 'wind', 1.6);
        G.V.setZoom(0.42); G.camOpt = { fixX: 24, fixY: 9 };
        let said = false;
        for (let t = 0; t < 3.4;) {
          const dt = yield; t += dt;
          F.y -= dt * 4; B.y += dt * 2.2; B.scale = Math.max(0.15, 0.45 - t * 0.08); B.alpha = Math.max(0.1, 1 - t * 0.28); B.pose.dizzy = 1; B.pose.tell = Math.max(0, 1 - t); B.pose.glow = Math.max(0, 1 - t);
          if (G.rng() < 0.5) puff('smoke', MX + (G.rng() - 0.5) * 10, B.y - G.rng() * 5, 0.5, 0, -0.6, 0.8, 2.2, 0.9);
          if (t > 1.2 && !said) { said = true; G.hud.banner('대장 드래곤이 쓰러졌다', 'heart', 2.6); }
        }
        let fog = 0;
        G.drawOver = (ctx, V) => { if (fog <= 0) return; V.reset(); ctx.globalAlpha = Math.min(1, fog); ctx.fillStyle = '#6a6460'; ctx.fillRect(0, 0, V.W, V.H); ctx.globalAlpha = 1; };
        for (let t = 0; t < 1.6;) { const dt = yield; t += dt; fog = t / 1.4; F.y -= dt * 4; }
        return true;
      },
      sense: (G) => { const f = G.flags.x10 && G.flags.x10(); if (!f || !f.mouth) return {}; return { ph: f.ph, glow: r2(f.glow), inZone: f.inZone, mouth: f.mouth, A: f.A }; } },

    /* ⑤ (이음 + 걷기) 연기 속 — 잠깐 스토이크로 걷기 · 날개로 몸을 감싼 투슬리스 앞에서 F → 날개를 펴 히컵을 보여 줌 → 머리에 손 얹고 "고맙다."
       · 변화: 하늘이 맑아짐 · 드래곤들이 흩어져 날아감 · 해변 무기 더미 */
    { id: '10-5', verb: 'walk', place: 'beach', time: 'fog', tint: 'storm', goal: '연기 속에서 히컵을 찾아라', at: [37, 21], face: [-1, 0], limit: 80,
      hints: ['▼ 쪽으로 걸어요 — 연기 속 검은 날개', '날개로 몸을 감싼 투슬리스 앞에서 Space'],
      *run(G) {
        const P = G.P; P.who = 'stoick';
        const T = G.cast.dragon('toothless', 14, 12.6, { flip: 1, fear: 0, pose: { wing: 0, sit: 1 } }); T.pupilTo = 0.1;
        const hic = G.cast.person('hiccup', 15.4, 13.1, { dir: 'side', flip: -1, pose: { sit: 1 } }); hic.hide = true;
        const pile = G.W.findProp('weapon_pile'); if (pile) pile.o.n = 6;
        const sh = G.W.findProp('ship', 38, 28.5); if (sh) { sh.hide = true; if (sh.box) sh.box.off = true; }
        let fogA = 0.62, smk = 0, saw = false, ban = false;
        G.flags.x10 = () => ({ T: [r2(T.x), r2(T.y)] });
        G.drawOver = (ctx, V) => {
          if (fogA <= 0.02) return;
          V.reset(); const px = V.sx(P.x), py = V.sy(P.y - 1), r = 5 * V.S; ctx.fillStyle = '#5e5a56';
          for (const [k, rr] of SMOKE_RINGS) { ctx.globalAlpha = fogA * k; ctx.beginPath(); ctx.rect(0, 0, V.W, V.H); ctx.moveTo(px + r * rr, py); ctx.arc(px, py, r * rr, 0, 7); ctx.fill('evenodd'); }
          ctx.globalAlpha = 1;
        };
        say(G, 'stoick', '히컵! …히컵!', { secs: 2.2 });
        while (true) {
          const dt = yield;
          smk += dt; if (smk > 0.12) { smk = 0; puff('smoke', P.x + (G.rng() - 0.5) * 18, P.y + (G.rng() - 0.5) * 10, 0.3, 0.4, -0.2, 0.4, 2.6, 0.7); if (G.rng() < 0.5) puff('ember', P.x + (G.rng() - 0.5) * 12, P.y + (G.rng() - 0.5) * 8, 2.5, 0, 0, -0.3, 1.6, 0.08); }
          goal(G, T.x, T.y);
          if (!saw && dist(G, T.x, T.y) < 4.5) { saw = true; yield* talk(G, [['stoick', '…안장이 비었구나. 히컵, 어디 있니?', ['saddle']]]); }
          if (useAt(G, T.x, T.y, 1.9)) break;
        }
        goal(G, null); P.fx = T.x < P.x ? -1 : 1; P.fy = 0; P.dir = 'side'; P.flip = P.fx; P.lock = true;
        sfx(G, 'purr', T.x);
        for (let t = 0; t < 0.8;) { t += yield; T.pose.wing = Math.min(1, t / 0.6); }
        hic.hide = false; T.pupilTo = 1; T.pose.sit = 0;
        yield* talk(G, [['stoick', '날개로 감싸고 있었구나… 살아 있어! 숨을 쉬어!']]);
        P.handLock = 1;
        yield* talk(G, [['stoick', '고맙다. 내 아들을 지켜 줘서.', ['heart']]]);
        const fly = ['nadder', 'gronckle', 'zippleback', 'terror', 'nightmare'].map((k, i) => { const a = i * 1.256 + 0.3, d = G.cast.dragon(k, P.x + Math.cos(a) * 6, P.y - 4 + Math.sin(a) * 3, { z: 2, flip: Math.cos(a) > 0 ? 1 : -1, fear: 0, pose: { wing: 1 }, flapHz: 1.7 }); d.to = [d.x + Math.cos(a) * 30, d.y + Math.sin(a) * 18]; d.spd = 5; return d; });
        G.tint = 'dawn';
        for (let t = 0; t < 4.5 || talking(G);) {
          const dt = yield; t += dt; fogA = Math.max(0, fogA - dt * 0.35);
          for (const d of fly) d.z += dt * 1.2;
          if (t > 1.2 && !ban) { ban = true; G.hud.banner('둥지 섬 하늘이 맑아졌다 — 드래곤들이 흩어져 날아가요', 'flock', 3); }
          if (t > 12) break;
        }
        P.handLock = 0; P.lock = false;
        return true;
      },
      sense: (G) => (G.flags.x10 ? G.flags.x10() : {}) },
  ],
};
