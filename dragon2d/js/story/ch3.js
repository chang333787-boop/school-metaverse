// 3장 숨은 호수(#5~7 · design §2 · 탑뷰) — 훈련 첫날 그롱클(볼이 부풀 때 방패 · 나무벽 뒤 · 여섯 발) → 숨은 호수 관찰(바위 뒤 살금살금 · F 꾹 스케치 · 왼 꼬리날개 없음) → 큰 회관 밤 드래곤 책(빈칸에 내 그림)
import { say, talk, wait, until, goal, useAt, near, dist, talking, hitsMe, knock, bang, sfx, shoot, FX, burst, puff, faceTo } from './kit.js?v=1';

const TELL = { easy: 3, normal: 2.5, hard: 2 };
export const chapter = {
  id: 3, title: '숨은 호수', sub: '훈련 첫날 · 그리고 숲 속 호수', place: 'arena', time: 'day',
  end: '드래곤 책 빈칸에 내 그림이 생겼다',
  steps: [
    /* ⓪ (이음) 선착장 배웅 — 아빠가 둥지를 찾으러 떠남 · 고버가 훈련을 맡음(스토이크 셋째 박자) */
    { id: '3-0', place: 'dock', time: 'day', goal: '아빠 배웅하기', at: [20, 10.6], limit: 60,
      *run(G) {
        const st = G.cast.person('stoick', 20.4, 22.6, { dir: 'up' }), ship = G.W.findProp('ship', 30, 22);
        G.cast.person('gobber', 18.4, 15, { dir: 'side', flip: 1 }); G.cast.person('villager', 24, 13.2, { dir: 'down' });
        goal(G, 20, 21);
        yield* until(() => near(G, 20, 21, 2.4), 40);
        goal(G, null);
        yield* talk(G, [['stoick', '얼음이 얼기 전에 다녀오마. 둥지를 찾으면 습격도 끝이다.'], ['hiccup', '…다녀오세요, 아빠.'], ['stoick', '고버, 이 녀석 훈련 잘 시켜 주게.'],
          ['gobber', '걱정 마! 히컵, 내일부터 훈련장이다.'], ['hiccup', '(훈련장… 드래곤을 처치하는 법을 배우는 곳.)']]);
        st.to = [27, 22.4]; st.spd = 3;
        for (let t = 0; t < 2.6; t += yield) { if (t > 1.2) { st.hide = 1; if (ship) ship.y += 0.03; } puff('drop', G.P.x + (G.rng() - 0.5) * 12, G.P.y - 6 + G.rng() * 8, 3, -0.5, 0, -2, 0.8, 0.06); }
        return true;
      } },
    /* ① 훈련 1일 그롱클 — 볼이 부풀 때 방패 두드리기(조준 흐림 · 연타 = 익숙해짐) · 나무벽 뒤 · 점프 · 여섯 발이면 끝(피시레그) */
    { id: '3-1', verb: 'shield', goal: '그롱클의 여섯 발을 버텨라', at: [11, 15], limit: 80,
      hints: ['볼이 부풀면 Space로 방패를 두드려요', '나무벽 뒤에 숨거나, 날아오면 점프'],
      *run(G) {
        G.W.prop('barricade', 13, 12, { w: 1.8 }); G.W.prop('barricade', 18.5, 15.5, { w: 1.8 });
        G.cast.person('gobber', 15, 18.6, { dir: 'up', pose: { carry: 'hammer' } });
        [['fishlegs', 6, 9], ['astrid', 24, 14], ['snotlout', 22, 17], ['ruffnut', 7, 16], ['tuffnut', 8, 17]].forEach(([w, x, y]) => G.cast.person(w, x, y, { dir: 'side', flip: x < 15 ? 1 : -1, pose: { carry: 'shield' } }));
        const D = G.cast.dragon('gronckle', 16, 7, { flip: -1, fear: 0.7, pose: { pupil: 0.3 } });
        G.P.carry = 'shield'; G.W.findProp('cage', 15, 4).o.open = 1;
        yield* talk(G, [['gobber', '훈련 첫날이다! 마을을 지키려면 드래곤을 알아야지.'], ['gobber', '첫 손님은 그롱클. 방패가 제일 중요하다!', ['shield']], ['fishlegs', '그롱클은 여섯 발! 내가 셀게!']]);
        const tell = TELL[G.diff], NUM = ['하나!', '둘!', '셋!', '넷!', '다섯!', '여섯! 끝!'];
        let shots = 0, ph = 'walk', t = 0, hits = 0, lastBang = -9, blurred = false, dropped = null, blurN = 0;
        D.to = [14, 8];
        while (shots < 6 || FX.shots.length) {
          const dt = yield; t += dt;
          if (dropped) { goal(G, dropped.x, dropped.y); if (useAt(G, dropped.x, dropped.y, 1.3)) { G.W.removeProp(dropped); dropped = null; G.P.carry = 'shield'; goal(G, null); } }
          if (G.I.pressed.use && G.P.carry === 'shield') {
            sfx(G, 'clang', G.P.x);
            if (ph === 'tell' && G.t - lastBang > 0.8 && !(G.P.mashT > 0)) { if (!blurred) blurN++; blurred = true; D.pose.pupil = 0.9; burst('spark', G.P.x, G.P.y, 1.1, 4, 2, 0.3, 0.08, G.rng); }
            lastBang = G.t;
          }
          if (ph === 'walk') { faceTo(D, G.P.x, G.P.y); if (!D.to && t > 1.2) { ph = 'tell'; t = 0; blurred = false; sfx(G, 'cry_gronckle', D.x); } }
          else if (ph === 'tell') {
            D.pose.tell = Math.min(1, t / (tell * 0.5)); bang(G, D, 2.2); faceTo(D, G.P.x, G.P.y);
            if (t > tell) {
              ph = 'shot'; t = 0; shots++; D.pose.tell = 0; D.pose.mouth = 1;
              let ux = G.P.x - D.x, uy = G.P.y - D.y; const d = Math.hypot(ux, uy) || 1; ux /= d; uy /= d;
              if (blurred) { const a = (G.rng() < 0.5 ? 1 : -1) * 0.7, c = Math.cos(a), s = Math.sin(a); [ux, uy] = [ux * c - uy * s, uy * c + ux * s]; }
              shoot({ kind: 'lava', x: D.x + ux * 1.2, y: D.y + uy * 1.2, z: 0.8, vx: ux * 9, vy: uy * 9, g: 0, r: 0.32, life: 3,
                hit: (s) => { if (hitsMe(G, s)) { if (knock(G, ux, uy, 0.8)) { hits++; if (G.diff !== 'easy' && G.P.carry) { G.P.carry = null; dropped = G.W.prop('_shield', G.P.x - ux * 1.6, G.P.y - uy * 1.6, {}); } } return true; } return false; } });
              sfx(G, 'fire', D.x);
              say(G, 'fishlegs', NUM[shots - 1], { secs: 1 });
              if (blurred) say(G, 'gobber', '좋아! 소리에 조준이 흐려졌어!', { secs: 1.6 });
            }
          } else if (ph === 'shot' && t > 0.8) { ph = 'walk'; t = 0; D.pose.mouth = 0; D.to = [8 + G.rng() * 14, 6 + G.rng() * 4]; D.spd = 2.4; }
          if (hits >= 3 && G.diff !== 'easy') { say(G, 'gobber', '히컵, 일어나! 처음부터 다시!'); yield* wait(1); return 'retry'; }
        }
        if (blurN < 2 && G.P.moved < 8) { say(G, 'gobber', '가만히 서 있으면 훈련이 안 되지! 다시!'); yield* wait(1); return 'retry'; }   /* 두드리거나 움직여서 버텨야 함 */
        D.pose.sit = 1; D.pose.pupil = 0.8;
        say(G, 'gobber', '여섯 발 끝! 오늘은 히컵이 살아남았구나.');
        G.hud.banner('훈련장 순위판에 히컵 이름 — 맨 아래', 'shield', 2.6);
        yield* wait(2);
        return true;
      },
      sense: (G) => ({ carry: G.P.carry, shield: (() => { const p = G.W.findProp('_shield', G.P.x, G.P.y); return p ? [p.x, p.y] : null; })(), walls: [[13, 12], [18.5, 15.5]] }) },

    /* ② 숨은 호수 — 바위 곁에서 C(살금살금) + F 꾹 = 스케치 · 바위가 투슬리스와 나 사이에 있어야 숨음 · 들키면 멀리 날아감 */
    { id: '3-2', verb: 'hide', place: 'cove', time: 'day', goal: '들키지 않고 그려라', at: [3, 15], limit: 90, mood: 1,
      hints: ['바위 뒤에서 X를 누르고 살금살금 + Space를 꾹', '투슬리스가 이쪽을 볼 땐 바위 뒤에'],
      *run(G) {
        const rocks = G.W.A.rocks;
        const D = G.cast.dragon('toothless', 30, 22.5, { flip: 1, fear: 0.6, pose: { pupil: 0.5, fin: 'none', wing: 0.2 } });
        const sk = G.hud.sketch(true), X = sk.getContext('2d');
        X.fillStyle = '#efe2c4'; X.fillRect(0, 0, 400, 300);
        const path = [[40, 200], [90, 170], [150, 160], [200, 120], [230, 80], [250, 130], [300, 150], [340, 140], [360, 160], [330, 190], [250, 200], [160, 205], [100, 215], [60, 240], [30, 250], [20, 230]];
        let prog = 0, alert = 0, ph = 'climb', t = 0, drawn = 0;
        say(G, 'hiccup', '여기 숨어 있었구나… 왜 안 날아가지?');
        const hidden = () => { const P = G.P; if (P.crouch < 0.5) return false; for (const [rx, ry] of rocks) { if (Math.hypot(P.x - rx, P.y - ry) > 2.6) continue; const ax = D.x - P.x, ay = D.y - P.y, L = Math.hypot(ax, ay) || 1, k = Math.max(0, Math.min(L, ((rx - P.x) * ax + (ry - 0.4 - P.y) * ay) / L)); if (Math.hypot(P.x + ax / L * k - rx, P.y + ay / L * k - (ry - 0.4)) < 1.4) return true; } return false; };
        while (prog < 1) {
          const dt = yield; t += dt;
          /* 돌벽 오르기 → 미끄러짐(날지 못함) */
          if (ph === 'climb') { if (!D.to) D.to = [36.2, 22.5 - (t % 3)]; D.spd = 4; if (!D.to || D.x > 36) { D.to = null; ph = 'jump'; t = 0; } }
          else if (ph === 'jump') { D.z = Math.sin(Math.min(1, t / 0.9) * Math.PI / 2) * 3; D.pose.wing = 1; if (t > 1.1) { ph = 'slide'; t = 0; burst('dust', D.x + 1, D.y, 2, 4, 1, 0.5, 0.3, G.rng); } }
          else if (ph === 'slide') { D.z = Math.max(0, 3 - t * 4); D.pose.wing = 0.4; if (D.z <= 0) { ph = 'look'; t = 0; D.flip = -1; } }
          else if (ph === 'look') { D.pose.wing = 0.1; D.flip = -1; if (t > 2.4) { ph = 'climb'; t = 0; D.to = [36.2, 21]; } }
          else if (ph === 'flee') { if (t > 2.5) { ph = 'look'; t = 0; } }
          const P = G.P, hid = hidden(), d = Math.hypot(D.x - P.x, D.y - P.y), facing = D.flip === Math.sign(P.x - D.x);
          if (!hid && facing && d < 17) alert += dt * (Math.hypot(P.vx, P.vy) > 3 ? 2 : 0.9); else alert = Math.max(0, alert - dt * 0.5);
          if (alert > 1) { alert = 0; prog = Math.max(0, prog - 0.25); D.to = [33, 6]; D.spd = 7; ph = 'flee'; t = 0; sfx(G, 'growl', D.x); bang(G, D, 2.2); say(G, 'hiccup', '들켰다! …숨어야 해.', { secs: 1.6 }); }
          if (hid && G.I.down.use && ph !== 'flee' && d < 24) { prog += dt * (d < 15 ? 0.17 : 0.11) * (G.diff === 'easy' ? 1.4 : 1); P.look = 1; }
          const [hx, hy] = rocks[1]; goal(G, hid ? null : hx - 1.3, hid ? 0 : hy + 0.2, { h: 1.6 });
          G.fspots.push({ x: hx - 1.3, y: hy + 0.2, label: 'Space 꾹' }); G.flags.hid = hid;
          const want = Math.floor(prog * path.length);
          if (want > drawn) { X.strokeStyle = '#2b2118'; X.lineWidth = 3; X.lineCap = 'round'; X.beginPath(); X.moveTo(path[Math.max(0, drawn - 1)][0], path[Math.max(0, drawn - 1)][1]); for (let i = drawn; i < want; i++) X.lineTo(path[i][0], path[i][1]); X.stroke(); drawn = want; }
          if (alert > 0.3) G.marks.push({ k: 'text', x: D.x, y: D.y - 2.6, t: '?', s: 30 });
        }
        X.strokeStyle = '#a83e1e'; X.lineWidth = 4; X.beginPath(); X.arc(36, 238, 22, 0, 7); X.stroke();
        X.fillStyle = '#a83e1e'; X.font = 'bold 22px sans-serif'; X.fillText('왼 꼬리날개 없음!', 120, 280);
        G.hud.banner('왼 꼬리날개가 없다 — 숲에서 주운 조각과 꼭 맞아', 'fin', 3.2);
        yield* wait(1.2);
        yield* talk(G, [['hiccup', '왼쪽 꼬리날개가 없어. 숲에서 주운 조각이 바로 그거야.', ['fin']], ['hiccup', '그래서 날지 못하고 이 호수에 갇힌 거구나…']]);
        G.hud.sketch(false);
        return true;
      },
      sense: (G) => { const D = G.cast.find('toothless'); return { rocks: G.W.A.rocks, hid: !!G.flags.hid, D: D ? [D.x, D.y] : null }; } },

    /* ③ 큰 회관 밤 — 고버가 드래곤 책을 줌 · 쌍둥이·스노트라우트는 나감 · 나이트 퓨리 칸 '알 수 없음'에 점 여섯 잇기 */
    { id: '3-3', verb: 'draw', place: 'hall', time: 'night', goal: '드래곤 책 빈칸에 그려라', at: [22, 13], limit: 80,
      hints: ['방향키로 펜을 다음 점까지', '숫자 차례대로 이어요'],
      *run(G) {
        const gob = G.cast.person('gobber', 24, 13, { dir: 'side', flip: -1, pose: { carry: 'book' } });
        const tw = [G.cast.person('ruffnut', 25.5, 11.5, { dir: 'side', flip: -1 }), G.cast.person('tuffnut', 26.5, 12.2, { dir: 'side', flip: -1 }), G.cast.person('snotlout', 27, 13.6, { dir: 'side', flip: -1 })];
        G.P.lock = true;
        yield* talk(G, [['gobber', '드래곤 책이다. 밤새 비가 오니 읽기 좋겠지.', ['book']], ['tuffnut', '읽으라고? 책을?'], ['snotlout', '난 싸우면서 배울래.']]);
        for (const a of tw) { a.to = [15, 17.5]; a.spd = 3; }
        gob.pose.carry = null; G.book.give();
        G.book.startDraw(G.diff === 'easy');
        say(G, 'hiccup', '나이트 퓨리… 알 수 없음? 그럼 내가 그려 넣을래.');
        while (!G.book.drawStep(yield, G.I)) { /* 그리는 중 */ }
        G.book.note('nightfury', 'other', '왼 꼬리날개가 없음', false);
        yield* wait(0.8);
        G.book.endDraw(); G.P.lock = false;
        G.hud.banner('드래곤 책에 내 그림 첫 장', 'pencil', 3);
        yield* talk(G, [['hiccup', '책에는 "보면 처치"뿐이야. 나이트 퓨리는 "알 수 없음".'], ['hiccup', '아무도 모르는 걸 내가 봤어. 내가 처음 그려 넣은 거야.']]);
        return true;
      },
      sense: (G) => ({ draw: G.book.drawSense() }) },
  ],
};
