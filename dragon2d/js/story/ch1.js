// 1장 습격의 밤(#1~3 · design §2 · 탑뷰) — 무기 나르기 → 지붕 불(물통 · 바람 쪽으로 번짐) → 골목(종마다 다른 예고 → 비키기·점프) → 양 지키기(볼라 · 기절 = 그을린 조각)
// → 나이트 퓨리(바다에 비친 별이 가려지는 곳) → 아무도 안 믿어 줌 · 쉬움 = 해 질 녘 습격(design §4-2) · 깜짝 X: 공격 앞엔 늘 ! + 몸짓 예고 2~3초 · 심부름은 길 찾기 X(갈 곳 ▼)
import { say, wait, until, goal, useAt, near, dist, talking, throwFrom, previewArc, hitsMe, knock, bang, sfx, shoot, FX, burst, puff, faceTo } from './kit.js?v=1';
import { douse, onRoof } from '../play/fx.js?v=1';

const TELL = { easy: 3, normal: 2.5, hard: 2 };
/* 하늘을 지나가는 드래곤(높이 z · 그림자만 땅에) — 습격 분위기 */
function skyDragons(G) {
  return [['nadder', 1, 1], ['gronckle', -1, 9], ['terror', 1, 5], ['zippleback', -1, -4]].map(([k, f, dy]) => G.cast.dragon(k, G.P.x - f * 14, G.P.y + dy, { z: 6, flip: f, alpha: 0.85, pose: { wing: 1, pupil: 0.3 }, flapHz: 1.6, sky: 1 }));
}
function driftSky(list, dt, G) { for (const a of list) { a.x += a.flip * 5 * dt; if (Math.abs(a.x - G.P.x) > 22) a.x = G.P.x - a.flip * 20; } }
/* 공격 셋 — 종마다 다른 예고와 수(design §2 1장 ③) */
function attack(G, D, onHit) {
  const P = G.P, dx = P.x - D.x, dy = P.y - D.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  if (D.kind === 'nadder') for (const a of [-0.14, 0, 0.14]) { const c = Math.cos(a), s = Math.sin(a); shoot({ kind: 'spike', x: D.x + ux * 1.2, y: D.y + uy * 1.2, z: 0.55, vx: (ux * c - uy * s) * 10, vy: (uy * c + ux * s) * 10, g: 0, life: 2.2, hit: (q) => hitsMe(G, q) && onHit(q, ux, uy) }); }
  if (D.kind === 'gronckle') { const T = 1.0, tx = P.x, ty = P.y; const q = shoot({ kind: 'lava', x: D.x + ux, y: D.y + uy, z: 1, vx: (tx - D.x - ux) / T, vy: (ty - D.y - uy) / T, vz: 4.9 * T - 1 / T, g: 9.8, r: 0.5, life: 3, noWall: true, land: (s) => { burst('ember', s.x, s.y, 0.1, 8, 3, 0.6, 0.12, G.rng); if (Math.hypot(P.x - s.x, (P.y - s.y) * 1.3) < 1.3 && !P.dodge) onHit(s, ux, uy); } }); q.zone = [tx, ty]; }
  if (D.kind === 'nightmare') for (let i = -4; i <= 4; i++) shoot({ kind: 'fire', x: D.x + ux * 1.5 - uy * i * 0.55, y: D.y + uy * 1.5 + ux * i * 0.55, z: 0.25, vx: ux * 8, vy: uy * 8, g: 0, r: 0.3, life: 2.2, noWall: true, hit: (q) => hitsMe(G, q, { low: 0.6 }) && onHit(q, ux, uy) });
  sfx(G, D.kind === 'nadder' ? 'whoosh' : 'fire', D.x);
}
const zones = (G) => { for (const s of FX.shots) if (s.zone) G.marks.push({ k: 'zone', x: s.zone[0], y: s.zone[1], r: 1.2 }); };

export const chapter = {
  id: 1, title: '습격의 밤', sub: '드래곤이 오는 밤', place: 'village', time: 'night', timeEasy: 'sunset',
  end: '아무도 안 믿어 줬다 — 그래도 분명히 맞혔어',
  steps: [
    /* ① 무기 나르기 — 대장간 앞 무기 더미 → 바이킹 셋(골목 따라 오른쪽) */
    { id: '1-1', verb: 'carry', goal: '무기를 바이킹들에게 날라라', at: [8, 29], limit: 70,
      hints: ['대장간 앞 무기 더미에서 F', '▼ 표시된 바이킹 앞에서 F로 건네요'],
      *run(G) {
        const gob = G.cast.person('gobber', 9.4, 28.6, { dir: 'side', flip: -1, pose: { carry: 'hammer' } });
        const pile = G.W.prop('weapon_pile', 4.6, 29.4, { n: 6 });
        const vik = [[18, 29.4], [27.5, 30.4], [36, 29.2]].map(([x, y], i) => G.cast.person(i === 1 ? 'villager2' : 'villager', x, y, { dir: 'side', flip: -1 }));
        const sky = skyDragons(G);
        say(G, 'gobber', '히컵! 넌 대장간에 있어라.');
        say(G, 'gobber', '…아니다, 일손이 모자라. 저 무기 좀 날라 줘!', { icons: ['axe'] });
        let have = 0, given = 0;
        while (given < 3) {
          const dt = yield; driftSky(sky, dt, G);
          if (!have) { goal(G, pile.x, pile.y); if (useAt(G, pile.x, pile.y, 1.6)) { have = 3 - given; G.P.carry = 'axe'; sfx(G, 'clang', pile.x); say(G, 'hiccup', '으, 무겁다… 그래도 할 수 있어!'); } }
          else {
            const v = vik[given]; goal(G, v.x, v.y);
            if (useAt(G, v.x, v.y, 1.7)) {
              given++; have--; v.pose.carry = 'axe'; v.pose.cheer = 1; sfx(G, 'clang', v.x); faceTo(v, G.P.x, G.P.y);
              say(G, 'villager', ['고맙다, 꼬마!', '오, 날이 잘 섰네!', '이제 들어가 있어라!'][given - 1], { actor: v, secs: 1.8 });
              if (!have) G.P.carry = null;
            }
          }
        }
        goal(G, null); gob.to = [2, 30]; gob.spd = 4;
        yield* wait(1.2);
        return true;
      } },

    /* ② 지붕 불 — 물통(통 앞 F) → 지붕을 향해 F(떨어질 곳 고리) · 바람 쪽(동쪽)으로 번짐 · 둘은 지켜야 함 */
    { id: '1-2', verb: 'throw', goal: '지붕 불을 꺼라', at: [36, 30.6], limit: 80,
      hints: ['물통 앞에서 F로 물을 받아요', '불붙은 지붕 쪽을 보고 F — 고리가 떨어질 곳'],
      *run(G) {
        FX.wind = [1.2, 0];
        const tubs = [G.W.prop('barrel', 37.2, 31.6, { water: 1 }), G.W.prop('barrel', 45.4, 31.6, { water: 1 })];
        const line = [['astrid', 35.8, 32.4], ['fishlegs', 38.6, 32.3], ['snotlout', 34.6, 32.6], ['ruffnut', 39.8, 32.5], ['tuffnut', 40.8, 32.6]].map(([w, x, y]) => G.cast.person(w, x, y, { dir: 'up', pose: { carry: 'bucket' } }));
        const sky = skyDragons(G);
        const H = [33, 41, 49].map((x) => G.W.findProp('house', x, 27));
        const F = H.map((p, i) => ({ x: p.x, y: p.y, w: p.o.w * 0.95, d: p.o.d, h: 3, burn: [0.62, 0.45, 0.3][i], next: 6, delay: 5, prop: p, saved: false, lost: false, full: 0, grow: G.diff === 'easy' ? 0.014 : G.diff === 'hard' ? 0.03 : 0.02 }));
        F[0].spread = () => F[1]; F[1].spread = () => F[2];
        FX.fires.push(...F); G.flags.fires = F; G.camOpt = { fixY: 26.6 };   /* 지붕 불과 물통 자리가 한 화면에 */
        say(G, 'astrid', '불이야! 물 받아!', { icons: ['bucket'] });
        say(G, 'hiccup', '바람이 동쪽으로 분다… 불도 그쪽으로 번지겠어.', { icons: ['wind'] });
        let helpT = 5;
        while (true) {
          const dt = yield; driftSky(sky, dt, G);
          /* 친구들 물통 줄도 거듦(조금씩 · 혼자서는 못 끔) */
          helpT -= dt; if (helpT <= 0) { helpT = 6; const f = F.filter((q) => q.burn > 0).sort((a, b) => a.x - b.x)[0]; if (f) { const a = line[Math.floor(G.rng() * 2)]; shoot({ kind: 'water', x: a.x, y: a.y - 0.4, z: 1.2, vx: (f.x - a.x) / 0.9, vy: (f.y - 1.5 - a.y) / 0.9, vz: 3.1, g: 9.8, noWall: true, land: () => { if (f.burn > 0) douse(f, 0.15); } }); } }
          const tub = tubs.reduce((a, b) => (Math.hypot(b.x - G.P.x, b.y - G.P.y) < Math.hypot(a.x - G.P.x, a.y - G.P.y) ? b : a));
          if (!G.P.carry) { for (const tb of tubs) if (useAt(G, tb.x, tb.y, 1.6)) { G.P.carry = 'bucket'; sfx(G, 'splash', tb.x); } }
          else {
            previewArc(G);
            if (G.I.pressed.use) {
              G.P.carry = null; sfx(G, 'whoosh', G.P.x);
              throwFrom(G, 'water', { shot: { land(s) { for (const f of F) if (f.burn > 0 && onRoof(f, s.x, s.y)) { douse(f, 0.5); sfx(G, 'splash', f.x); if (f.saved) say(G, 'fishlegs', '꺼졌다! 하나 지켰어!', { secs: 1.6 }); return; } } } });
            }
          }
          for (const f of F) if (f.burn >= 1) { f.full += dt; if (f.full > 8 && G.diff !== 'easy') { f.burn = 0; f.lost = true; f.prop.o.scorch = 1; f.prop.o.burn = 0; burst('smoke', f.x, f.y - 2, 3, 10, 1.5, 2, 0.6, G.rng); say(G, 'villager', '아이고, 우리 집 지붕이…', { secs: 2 }); } }
          const burning = F.filter((f) => f.burn > 0);
          if (burning.length) { const tg = burning.reduce((a, b) => (b.burn > a.burn ? b : a)); if (G.P.carry) goal(G, tg.x, tg.y - 1, { h: 3.6 }); else goal(G, tub.x, tub.y); }
          if (!burning.length) {
            if (F.filter((f) => f.lost).length >= 2) { say(G, 'hiccup', '안 돼… 다시 해 보자.'); yield* wait(1); return 'retry'; }
            break;
          }
        }
        FX.wind = [0.3, 0]; goal(G, null);
        say(G, 'snotlout', '야, 히컵! 넌 방해만 돼. 들어가!', { secs: 2.2 });
        yield* wait(1.5);
        return true;
      },
      sense: (G) => ({ tubs: [[37.2, 31.6], [45.4, 31.6]], carry: G.P.carry, fires: (G.flags.fires || []).map((f) => ({ x: f.x, y: f.y, w: f.w, d: f.d, burn: +f.burn.toFixed(2), lost: f.lost })) }) },

    /* ③ 골목 — 망루까지 · 내더 가시(세움 → 부채꼴 셋) · 그롱클 불덩이(볼 부풂 → 떨어질 자리 붉은 고리) · 나이트메어 불길(몸이 달아오름 → 길 가득한 불 줄 = 점프) */
    { id: '1-3', verb: 'dodge', goal: '망루까지 가라', at: [22, 29], limit: 70,
      hints: ['! 가 뜨면 곧 쏴요 — 붉은 고리 밖으로, 불 줄은 점프', '가시는 옆으로 비키거나 Space'],
      *run(G) {
        for (const p of G.W.props) if (p.kind === 'house' && p.y === 27 && p.x > 30) p.o.scorch = Math.max(p.o.scorch || 0, 0.5);
        const sky = skyDragons(G), order = ['nadder', 'gronckle', 'nightmare'], tell = TELL[G.diff];
        let k = 0, hits = 0, D = null, ph = 'in', pt = 0;
        const onHit = (q, ux, uy) => { if (knock(G, ux, uy, 0.9)) hits++; return true; };
        say(G, 'hiccup', '몰래 망루로… 내 발사기가 거기 있어!');
        goal(G, 57, 30.6);
        while (dist(G, 57, 30.6) > 1.5) {
          const dt = yield; driftSky(sky, dt, G); pt += dt; zones(G);
          if (!D && pt > (k ? 0.5 : 0.2)) {
            const kind = order[k % 3]; k++;
            const x = Math.min(G.P.x + 6.5, 60), y = k % 2 ? 31.9 : 27.5;          /* 길가(남쪽 풀밭 · 북쪽 집 앞)에 내려앉아 길 쪽으로 쏨 */
            D = G.cast.dragon(kind, x, y, { z: 7, flip: -1, pose: { wing: 1, pupil: 0.25 } }); ph = 'in'; pt = 0;
          }
          if (D) {
            if (ph === 'in') { D.z = Math.max(0, D.z - dt * 10); if (D.z <= 0) { D.pose.wing = 0; ph = 'tell'; pt = 0; sfx(G, 'cry_' + D.kind, D.x); } }
            else if (ph === 'tell') { D.pose.tell = Math.min(1, pt / (tell * 0.6)); bang(G, D, D.kind === 'nightmare' ? 3.2 : 2.6); faceTo(D, G.P.x, G.P.y); if (pt > tell) { ph = 'fire'; pt = 0; attack(G, D, onHit); D.pose.mouth = 0.8; } }
            else if (ph === 'fire') { D.pose.tell = Math.max(0, D.pose.tell - dt * 2); if (pt > 1.2) { ph = 'out'; pt = 0; D.pose.wing = 1; D.pose.mouth = 0; } }
            else { D.z += dt * 8; D.x += dt * 3; if (pt > 1) { G.cast.remove(D); D = null; pt = 0; } }
          }
          if (hits >= 3 && G.diff !== 'easy') { say(G, 'hiccup', '으… 이 길은 너무 위험해. 다시!'); yield* wait(0.8); return 'retry'; }
        }
        goal(G, null);
        return true;
      },
      sense: (G) => ({ hits: G.P.hits }) },

    /* ④ 양 지키기 — 테러가 양을 물고 우리 위를 돎 → 볼라(F · 떨어질 곳 고리)로 기절 → 그을린 비늘 조각(기절 = 가장 낮은 재료) */
    { id: '1-4', verb: 'throw', goal: '양을 지켜라', at: [55, 28.5], face: [-1, 0], limit: 60,
      hints: ['테러가 고리 안으로 올 때 F로 볼라를', '볼라는 바구니에서 F로 또 집어요'],
      *run(G) {
        const bask = G.W.prop('crate', 57.5, 27.8, {});
        const T = G.cast.dragon('terror', 54, 23.5, { z: 1.3, flip: -1, pose: { wing: 1, pupil: 0.3 }, flapHz: 3 });
        const sheep = G.W.findProp('sheep', 51, 23.5);
        let bolas = G.diff === 'easy' ? 99 : 3, held = true, ph = 'fly', t = 0, scale = null;
        G.P.carry = 'bola';
        say(G, 'hiccup', '양을 물고 간다! 볼라로…', { icons: ['bola', 'sheep'] });
        while (true) {
          const dt = yield; t += dt;
          if (ph === 'fly') {
            T.x = 53.5 + Math.sin(t * 0.8) * 3; T.y = 23.4 + Math.sin(t * 1.6) * 1.4; T.flip = Math.cos(t * 0.8) > 0 ? 1 : -1; sheep.x = T.x; sheep.y = T.y + 0.05; sheep.o.lift = 1;
            goal(G, T.x, T.y, { h: 2.6 });
            if (held && G.P.carry) previewArc(G);
            if (held && G.I.pressed.use && bolas > 0) {
              held = false; bolas--; G.P.carry = null; sfx(G, 'whoosh', G.P.x);
              throwFrom(G, 'bola', { shot: { hit: (s) => { if (Math.hypot(s.x - T.x, (s.y - T.y) * 1.2) < 0.9 && Math.abs(s.z - T.z) < 1) { ph = 'fall'; t = 0; sfx(G, 'thud', T.x); return true; } return false; } } });
            }
            if (!held && !FX.shots.length) { if (bolas > 0) { goal(G, bask.x, bask.y); if (useAt(G, bask.x, bask.y, 1.5)) { held = true; G.P.carry = 'bola'; } } else { say(G, 'hiccup', '볼라가 다 떨어졌어… 다시!'); yield* wait(0.8); return 'retry'; } }
          } else if (ph === 'fall') {
            T.z = Math.max(0, T.z - dt * 4); T.pose.dizzy = 1; T.pose.wing = 0; sheep.o.lift = 0;
            if (T.z <= 0) { ph = 'down'; scale = G.W.prop('_scale', T.x + 0.8, T.y + 0.4, {}); say(G, 'hiccup', '기절했어… 떨어진 건 그을린 비늘 조각 하나.', { icons: ['x'] }); }
          } else {
            goal(G, scale.x, scale.y);
            if (useAt(G, scale.x, scale.y, 1.4)) { G.W.removeProp(scale); G.inv.scale = (G.inv.scale || 0) + 1; G.hud.banner('그을린 비늘 조각 — 기절시키면 이것뿐', 'x', 3); break; }
          }
        }
        G.P.carry = null; goal(G, null);
        yield* wait(1.2);
        T.pose.dizzy = 0; T.pose.wing = 1; T.to = [70, 10]; T.spd = 6; T.z = 2;
        return true;
      },
      sense: (G) => { const T = G.cast.find('terror'); const sc = G.W.findProp('_scale', 54, 24); return { basket: [57.5, 27.8], carry: G.P.carry, T: T ? { x: +T.x.toFixed(2), y: +T.y.toFixed(2), z: +T.z.toFixed(2), dizzy: T.pose.dizzy || 0 } : null, scale: sc ? [sc.x, sc.y] : null }; } },

    /* ⑤ 나이트 퓨리 — 바닷가 볼라 발사기 · ←→ 겨누기 · F 쏘기 · 바다에 비친 별이 가려지며 빛 꼬리가 지나가는 곳 · 기회 셋(쉬움 무한) */
    { id: '1-5', verb: 'aim', goal: '밤바다 위 그림자를 맞혀라', at: [57.4, 31.6], limit: 70,
      hints: ['바다에 비친 별이 꺼졌다 켜지는 줄을 봐요', '←→로 겨누고, 그림자보다 조금 앞을 쏴요'],
      *run(G) {
        const cat = G.W.findProp('catapult', 58.5, 32), piv = [58.5, 32.4];
        G.P.lock = true; G.P.dir = 'down'; G.camOpt = { fixX: 54, fixY: 37 };
        const R = G.rng, stars = [];
        for (let i = 0; i < 90; i++) stars.push([36 + R() * 34, 35.6 + R() * 9, R()]);
        const fury = { x: 80, y: 39, on: false, vx: G.diff === 'easy' ? -9 : -12, wait: 2 };
        let ang = 0, shots = G.diff === 'easy' ? 99 : 3, cool = 0, hit = false, ft = 0, said = false;
        G.drawUnder = (ctx, V) => {
          for (const [x, y, k] of stars) { if (fury.on && Math.hypot(x - fury.x, (y - fury.y) * 1.4) < 1.9) continue; const r = 1.2 + k * 1.6; ctx.fillStyle = '#f4ead2'; ctx.fillRect(V.sx(x) - r / 2, V.sy(y) - r / 2, r, r); }
          if (fury.on) { ctx.strokeStyle = 'rgba(170,190,240,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(V.sx(fury.x + 0.8), V.sy(fury.y)); ctx.lineTo(V.sx(fury.x + 6), V.sy(fury.y + 0.2)); ctx.stroke(); }
        };
        const shadow = G.cast.dragon('toothless', 80, 39, { z: 6, flip: -1, alpha: 0.32, pose: { wing: 1, pupil: 0.2 }, flapHz: 2 });
        say(G, 'hiccup', '나이트 퓨리… 아무도 본 적이 없대. 바다에 비친 별을 가린대.');
        while (true) {
          const dt = yield;
          ang = Math.max(-0.2, Math.min(2.2, ang + G.I.dir() * 0.9 * dt)); cat.o.ang = ang;
          if (G.diff !== 'hard') for (let i = 1; i <= 7; i++) G.marks.push({ k: 'dot', x: piv[0] + Math.cos(ang) * i * 0.9, y: piv[1] + Math.sin(ang) * i * 0.9, r: 2.5, c: 'rgba(244,234,210,.75)' });
          if (!fury.on) { fury.wait -= dt; if (fury.wait <= 0 && !hit) { fury.on = true; fury.x = 76; fury.y = 37 + R() * 5; sfx(G, 'whistle', 70); } }
          else if (!hit) { fury.x += fury.vx * dt; if (fury.x < 34) { fury.on = false; fury.wait = 1.8 + R() * 1.2; } }
          shadow.x = fury.x; shadow.y = fury.y; shadow.hide = !fury.on;
          cool -= dt;
          if (G.I.pressed.use && cool <= 0 && shots > 0 && !hit) {
            cool = 1.1; shots--; sfx(G, 'bang', piv[0]); cat.o.kick = 1;
            shoot({ kind: 'bola', x: piv[0], y: piv[1], z: 2, vx: Math.cos(ang) * 16, vy: Math.sin(ang) * 16, vz: 0, g: 0, mine: true, life: 0.9, noWall: true,
              hit: (s) => { if (fury.on && Math.hypot(s.x - fury.x, s.y - fury.y) < 1.4) { hit = true; ft = 0; sfx(G, 'thud', s.x); return true; } return false; } });
          }
          if (hit) {
            ft += dt; shadow.alpha = 0.85; shadow.pose.wing = 0.3; shadow.pose.dizzy = 1;
            fury.x -= 4 * dt; fury.y -= 3 * dt; shadow.z = Math.max(0.5, 6 - ft * 3); shadow.flip = (ft * 4 % 2) < 1 ? -1 : 1; shadow.x = fury.x; shadow.y = fury.y;
            if (ft > 0.4 && !said) { said = true; G.hud.banner('맞혔다! …저 너머 숲으로 떨어졌어', 'bola', 3); say(G, 'hiccup', '맞혔어! 내가 맞혔다고!'); }
            if (ft > 2.2) break;
          } else if (shots <= 0 && !FX.shots.length && cool < 0) { say(G, 'hiccup', '볼라가 다 떨어졌어…'); yield* wait(0.8); return 'retry'; }
        }
        G.P.lock = false; G.camOpt = {};
        return true;
      },
      sense: (G) => { const s = G.cast.find('toothless'); const c = G.W.findProp('catapult', 58.5, 32); return { ang: c ? +c.o.ang.toFixed(3) : 0, piv: [58.5, 32.4], fury: s && !s.hide ? [+s.x.toFixed(2), +s.y.toFixed(2)] : null }; } },

    /* ⑥ (이음) 나이트메어가 쫓아옴(예고 → 불 줄 = 점프) → 아빠가 막음 → 아무도 안 믿어 줌 · '낙서' 공책 */
    { id: '1-6', goal: '마을로 돌아가기', at: [57, 30.4], limit: 60,
      *run(G) {
        const N = G.cast.dragon('nightmare', 61, 29.5, { flip: -1, pose: { pupil: 0.2 } });
        for (let t = 0; t < TELL[G.diff]; t += yield) { N.pose.tell = Math.min(1, t / 2); bang(G, N, 3.2); faceTo(N, G.P.x, G.P.y); }
        attack(G, N, (q, ux, uy) => { knock(G, ux, uy, 0.6); return true; });
        yield* wait(1.6);
        const st = G.cast.person('stoick', 46, 29, { dir: 'side', flip: 1 }); st.to = [55, 29.4]; st.spd = 6;
        yield* until(() => !st.to, 4);
        N.pose.tell = 0; sfx(G, 'roar', N.x);
        say(G, 'stoick', '물러가라!', { secs: 1.4 });
        N.pose.wing = 1; N.z = 0.5; N.to = [75, 20]; N.spd = 9;
        for (let t = 0; t < 1.4; t += yield) N.z += 0.1;
        const gob = G.cast.person('gobber', 44, 28.8, { dir: 'side', flip: 1 }), v = G.cast.person('villager', 50, 30.2, { dir: 'side', flip: 1 });
        say(G, 'hiccup', '아빠! 제가 나이트 퓨리를 맞혔어요!');
        say(G, 'stoick', '그만. 오늘 밤 일로도 충분하다.');
        say(G, 'villager', '낙서나 하던 녀석이 또…', { actor: v });
        say(G, 'gobber', '가자, 꼬마. 집에 가자.');
        say(G, 'hiccup', '진짜 맞혔단 말이야… 저 숲 너머로.');
        goal(G, 46, 29.2);
        st.to = [30, 29]; st.spd = 2.2; gob.to = [40, 29]; gob.spd = 3.2;
        yield* until(() => !talking(G) && G.P.x < 48, 60);
        return true;
      } },
  ],
};
