// 4장 생선과 이름(#8~10 · design §2 · 탑뷰) — 고기잡이(찌가 쏙 = 당기기 · 끄는 반대쪽 버티기 · 뱀장어도 걸림) → 코브: 투슬리스가 볼 때 칼 내려놓기 · 생선 · 이빨이 쏙 = 이름 · 게워 낸 반 토막 한 입
// → 모래 선(밟지 않고 틈으로 · 점프로 넘기) · 고개 돌려 손 내밀기(F 꾹 · 기다리기) → 코가 손바닥에 · 휙 가 버림
import { say, wait, until, goal, useAt, near, dist, talking, bang, sfx, burst, puff, faceTo } from './kit.js?v=1';
import { mindStep } from '../play/actors.js?v=1';

/* 손 내밀기 — F를 누르는 동안 멈춰 팔 뻗고 고개 돌림 */
function hand(G) { const on = G.I.down.use && !G.P.air; G.P.handLock = on ? 1 : 0; G.P.look = on ? -1 : 0; G.P.lock = on; return on && G.P.hand > 0.6; }

export const chapter = {
  id: 4, title: '생선과 이름', sub: '먹이를 들고 다시 호수로', place: 'cove', time: 'day',
  end: '투슬리스 — 이 없는 줄 알았는데!',
  steps: [
    /* ① 고기잡이 — F 던지기 · 찌가 쏙 들어갈 때 F · 물고기가 끄는 반대쪽(←→) 버티기 */
    { id: '4-1', verb: 'fish', place: 'dock', time: 'day', goal: '생선을 잡아라', at: [20, 25.6], face: [0, 1], limit: 90,
      hints: ['F로 던지고, 찌가 쏙 들어가면 바로 F', '물고기가 오른쪽으로 끌면 ←, 왼쪽이면 →'],
      *run(G) {
        const need = G.diff === 'easy' ? 2 : 3, kinds = ['cod', 'eel', 'salmon'];
        let ph = 'idle', t = 0, bite = 0, caught = 0, pull = 0, pullT = 0, bad = 0, fightT = 0, eel = false;
        const bob = { x: 20, y: 30, dip: 0 }, basket = G.W.findProp('fish_basket', 21.4, 25.6);
        say(G, 'hiccup', '투슬리스는 뭘 먹을까? …생선이겠지?', { icons: ['cod'] });
        G.drawOver = (ctx, V) => {
          if (ph === 'idle') return;
          const tx = G.P.x + 0.5, ty = G.P.y - 1.9;
          ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(V.sx(tx), V.sy(ty)); ctx.quadraticCurveTo(V.sx((tx + bob.x) / 2), V.sy((ty + bob.y) / 2 + (ph === 'fight' ? 0 : 0.6)), V.sx(bob.x), V.sy(bob.y)); ctx.stroke();
          ctx.fillStyle = '#c8442e'; ctx.beginPath(); ctx.arc(V.sx(bob.x), V.sy(bob.y + bob.dip * 0.15), 6 - bob.dip * 3, 0, 7); ctx.fill(); ctx.stroke();
          if (ph === 'fight') { ctx.fillStyle = 'rgba(30,40,50,.4)'; ctx.beginPath(); ctx.ellipse(V.sx(bob.x + pull * 0.7), V.sy(bob.y + 0.3), 22, 8, 0, 0, 7); ctx.fill(); }
        };
        while (caught < need) {
          const dt = yield; t += dt;
          G.P.lock = ph !== 'idle'; G.flags.ph = ph; G.flags.pull = pull;
          if (ph === 'idle') {
            G.fspots.push({ x: G.P.x, y: G.P.y });
            if (G.I.pressed.use) { ph = 'wait'; t = 0; bob.x = G.P.x + (G.rng() - 0.5) * 2; bob.y = G.P.y + 4.6; bite = 1.5 + G.rng() * 2.5; sfx(G, 'splash', bob.x); }
          } else if (ph === 'wait') {
            bob.dip = 0;
            if (t > bite) { ph = 'dip'; t = 0; sfx(G, 'pop', bob.x); }
            else if (G.I.pressed.use) { bite = t + 1.2 + G.rng() * 1.5; puff('drop', bob.x, bob.y, 0, 0, 0, 1, 0.3, 0.1); }      // 너무 일찍 = 놀라 다시 기다림
            if (G.rng() < dt * 1.2) G.marks.push({ k: 'ring', x: bob.x, y: bob.y, r: 0.4 + G.rng() * 0.3, c: 'rgba(244,234,210,.7)' });
          } else if (ph === 'dip') {
            bob.dip = 1; G.marks.push({ k: 'ring', x: bob.x, y: bob.y, r: 0.6 + t, c: '#f4ead2' }); G.marks.push({ k: 'text', x: bob.x, y: bob.y - 1.2, t: '쏙!', s: 22 });
            if (G.I.pressed.use) { ph = 'fight'; t = 0; fightT = 0; bad = 0; pull = G.rng() < 0.5 ? -1 : 1; pullT = 0.9; eel = kinds[caught % 3] === 'eel'; sfx(G, 'pluck', bob.x); }
            else if (t > (G.diff === 'easy' ? 1.1 : 0.75)) { ph = 'wait'; t = 0; bite = 1.2 + G.rng() * 2; bob.dip = 0; }
          } else if (ph === 'fight') {
            fightT += dt; pullT -= dt;
            if (pullT <= 0) { pull = -pull; pullT = (G.diff === 'easy' ? 1.0 : 0.65) + G.rng() * 0.6; }
            bob.x += pull * dt * 0.8; bob.dip = 0.6;
            G.marks.push({ k: 'text', x: bob.x + pull * 1.3, y: bob.y - 0.8, t: pull > 0 ? '▶' : '◀', s: 26, c: '#a83e1e' });
            if (G.I.dir() === -pull) bad = Math.max(0, bad - dt * 1.5); else bad += dt;
            if (bad > (G.diff === 'easy' ? 1.1 : 0.7)) { ph = 'idle'; sfx(G, 'pop', bob.x); say(G, 'hiccup', '줄이 끊겼어… 다시 던지자.', { secs: 1.6 }); }
            if (fightT > (G.diff === 'easy' ? 2.2 : 3)) {
              caught++; ph = 'idle'; sfx(G, 'splash', bob.x); if (basket) basket.o.n = caught;
              if (eel) { G.inv.eel = 1; say(G, 'hiccup', '뱀장어…? 드래곤들이 싫어한다던데. 일단 넣어 두자.', { icons: ['eel'] }); }
              else { G.inv.fish = (G.inv.fish || 0) + 1; G.hud.banner(caught + '마리째 — ' + (kinds[(caught - 1) % 3] === 'salmon' ? '연어' : '대구'), 'cod', 1.6); }
            }
          }
        }
        G.P.lock = false; G.drawOver = null; G.P.carry = 'fish';
        say(G, 'hiccup', '이 정도면 됐다. 호수로!');
        yield* wait(1.2);
        return true;
      },
      sense: (G) => ({ ph: G.flags.ph, pull: G.flags.ph === 'fight' ? G.flags.pull : 0 }) },

    /* ② 코브 — 칼은 투슬리스가 나를 볼 때 F로 내려놓기 · 살금살금 다가가 생선(F) · 이빨이 쏙 = 이름 → 게워 낸 반 토막을 '나를 볼 때' F 꾹 */
    { id: '4-2', verb: 'give', goal: '투슬리스와 친해져라', at: [4, 15], limit: 100, mood: 1,
      hints: ['투슬리스가 나를 볼 때 F — 칼을 내려놔요', 'C로 살금살금 다가가 생선을 F로 내밀어요'],
      *run(G) {
        const D = G.cast.dragon('toothless', 22, 15, { flip: -1, dir: 'down', fear: 0.75, pose: { pupil: 0.3, fin: 'none', sit: 1 } });
        G.P.carry = 'knife';
        let ph = 'knife', lookT = 0, t = 0, held = 0;
        say(G, 'hiccup', '칼을 보면 무서워할지도 몰라.', { icons: ['knife'] });
        while (true) {
          const dt = yield; t += dt;
          const d = Math.hypot(D.x - G.P.x, D.y - G.P.y);
          lookT -= dt;
          if (lookT <= 0) { D.look = D.look ? 0 : 1; lookT = D.look ? 3 : 2; }
          if (D.look) { faceTo(D, G.P.x, G.P.y); if (d < 12) G.marks.push({ k: 'dot', x: D.x, y: D.y - 2.2, r: 4, c: '#e6c464' }); } else { D.dir = 'up'; }
          G.flags.look = D.look; G.flags.ph = ph;
          if (ph === 'knife') {
            D.fear = Math.max(D.fear, d < 13 ? 0.75 : 0.5); D.pupilTo = d < 13 && D.look ? 0.1 : 0.4;
            if (d < 13 && D.look && G.rng() < dt * 0.8) sfx(G, 'growl', D.x);
            goal(G, D.x - 9, D.y);
            if (G.I.pressed.use) {
              if (D.look && d < 11) { ph = 'fish'; G.P.carry = 'fish'; G.W.prop('_knife', G.P.x + 0.7, G.P.y + 0.3, {}); sfx(G, 'clang', G.P.x); D.fear = 0.35; D.pupilTo = null; G.book.note('nightfury', 'hates', '칼'); say(G, 'hiccup', '봐, 아무것도 없어.', { secs: 1.8 }); }
              else if (d < 14) say(G, 'hiccup', '(투슬리스가 나를 볼 때 내려놔야 해.)', { secs: 1.6 });
            }
          } else if (ph === 'fish') {
            if (mindStep(D, G.P, dt, { fastV: 2.3, near: 5, calmK: 0.18, minFear: 0.05 })) { D.to = [Math.min(27, D.x + 2), D.y]; D.spd = 4; D.fear = 0.7; sfx(G, 'growl', D.x); }
            goal(G, D.x, D.y);
            if (d < 3) G.fspots.push({ x: D.x - 1.4, y: D.y });
            if (G.I.pressed.use && d < 3) {
              if (D.fear < 0.4 && !(G.P.mashT > 0)) { ph = 'eat'; t = 0; G.P.carry = null; D.pose.eat = 1; D.look = 1; sfx(G, 'pop', D.x); }
              else { D.to = [Math.min(27, D.x + 1.6), D.y]; D.spd = 3; D.fear = Math.min(1, D.fear + 0.3); say(G, 'hiccup', '(아직 무서워해… 천천히.)', { secs: 1.4 }); }
            }
          } else if (ph === 'eat') {
            faceTo(D, G.P.x, G.P.y); D.look = 1; lookT = 9; D.pose.smile = t > 1.2 ? 1 : 0;
            if (t > 2.4) {
              D.pose.eat = 0; D.pose.smile = 0; ph = 'half'; t = 0; held = 0; lookT = 2.5;
              G.hud.banner('이빨이 쏙! — 이름은 투슬리스', 'heart', 3.2); G.book.note('nightfury', 'likes', '생선'); G.book.note('nightfury', 'sign', '동공이 둥글면 편안', false);
              say(G, 'hiccup', '이가 없는 줄 알았는데… 투슬리스! 네 이름이야.');
              say(G, 'hiccup', '어… 반 토막을 뱉었네? 나도 먹으라고?', { icons: ['cod'] });
              G.W.prop('_fish', (D.x + G.P.x) / 2, D.y + 0.3, { half: 1 });
            }
          } else if (ph === 'half') {
            G.fspots.push({ x: G.P.x, y: G.P.y, label: 'F꾹' });
            if (G.I.down.use && d < 4 && D.look) { held += dt; G.P.carry = 'fish'; } else held = Math.max(0, held - dt * 2);
            if (!D.look && G.I.down.use) G.marks.push({ k: 'text', x: D.x, y: D.y - 2.6, t: '…?', s: 22 });
            if (held > 1.6) { G.P.carry = null; D.pose.smile = 1; D.look = 1; lookT = 9; sfx(G, 'purr', D.x); say(G, 'hiccup', '으웩… 맛있다! (투슬리스가 내 웃음을 따라 하네?)'); yield* wait(2.2); break; }
          }
        }
        goal(G, null);
        return true;
      },
      sense: (G) => { const D = G.cast.find('toothless'); return D ? { ph: G.flags.ph, look: D.look, fear: +D.fear.toFixed(2), D: [D.x, D.y] } : {}; } },

    /* ③ 모래 선 — 밟으면 으르렁(뒤로) · 틈으로 지나거나 점프로 넘기 · 고개 돌려 손 내밀기(F 꾹 · 움직이면 처음부터) → 코가 손바닥에 */
    { id: '4-3', verb: 'sand', goal: '손을 내밀어 기다려라', at: [8, 15], limit: 100, mood: 1,
      hints: ['모래 선은 틈으로 지나거나 Space로 넘어요', '가까이 가서 F를 꾹 누르고 기다려요'],
      *run(G) {
        const D = G.cast.dragon('toothless', 25, 15, { flip: -1, fear: 0.3, pose: { pupil: 0.8, fin: 'none' } });
        /* 세로 선 넷 — 틈이 위·아래 번갈아 */
        const L = [[12, 6, 18.5], [15, 11.5, 24], [18, 6, 18.5], [21, 11.5, 24]].map(([x, y0, y1]) => ({ x, y0, y1, p: G.W.prop('sand_line', x, y1, { len: y1 - y0, v: 1 }) }));
        G.flags.lines = L.map((l) => [l.x, l.y0, l.y1]);
        say(G, 'hiccup', '투슬리스가 모래에 그림을 그려…', { secs: 2 });
        let ph = 'lines';
        while (true) {
          const dt = yield; const P = G.P;
          if (ph === 'lines') {
            for (const l of L) if (!P.air && Math.abs(P.x - l.x) < 0.3 && P.y > l.y0 && P.y < l.y1) { P.x = l.x - (P.vx > 0 ? 0.75 : -0.75); P.vx = -Math.sign(P.vx || 1) * 2.5; D.fear = 1; sfx(G, 'growl', D.x); bang(G, D, 2); }
            goal(G, 23, 15, { h: 1.4 });
            if (P.x > 22.2) { ph = 'hand'; say(G, 'hiccup', '여기서부터는… 손을 내밀고 기다려 보자.', { secs: 2 }); }
          }
          const on = hand(G);
          mindStep(D, P, dt, { fastV: 2.2, near: 4, calmK: 0.25, handR: 4, trustK: G.diff === 'easy' ? 0.42 : 0.3, minFear: 0 });
          if (ph === 'hand') {
            goal(G, D.x - 2.2, D.y, { h: 1.4 });
            if (Math.hypot(D.x - P.x, D.y - P.y) < 4.5) G.fspots.push({ x: P.x, y: P.y, label: 'F꾹' });
            if (!on && D.trust > 0) D.trust = Math.max(0, D.trust - dt * 0.4);
            if (on && D.trust > 0.5) { D.to = [P.x + 1.1, P.y]; D.spd = 0.8; faceTo(D, P.x, P.y); }
            if (on && D.trust >= 1 && Math.hypot(D.x - P.x, D.y - P.y) < 1.4) break;
          }
          G.flags.trust = D.trust; G.flags.fear = D.fear;
        }
        sfx(G, 'purr', D.x); D.pose.pupil = 1;
        G.hud.banner('코가 손바닥에 닿았다', 'hand', 3);
        G.book.note('nightfury', 'other', '손을 내밀고 기다리면 먼저 다가옴', false);
        yield* wait(1.6);
        G.P.handLock = 0; G.P.look = 0; G.P.lock = false;
        puff('dust', D.x + 0.8, D.y, 0.5, 2, 0, 0.5, 0.6, 0.3); sfx(G, 'whoosh', D.x);
        D.pose.wing = 1; D.to = [34, 4]; D.spd = 7;
        for (let t = 0; t < 1.6; t += yield) D.z = t * 3;
        say(G, 'hiccup', '…휙 가 버렸네. 그래도 됐어!');
        yield* wait(1.5);
        return true;
      },
      sense: (G) => { const D = G.cast.find('toothless'); return { lines: G.flags.lines, trust: +(G.flags.trust || 0).toFixed(2), fear: +(G.flags.fear || 0).toFixed(2), D: D ? [D.x, D.y] : null }; } },
  ],
};
