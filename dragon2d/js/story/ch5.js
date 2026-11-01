// 5장 꼬리날개(#11·#12 · design §2 · 탑뷰) — 대장간 밤(고버 무용담 · 쇠가 주황일 때 망치 · 그을린 조각을 방패에 덧대기) → 코브: 뱀장어에 질겁 · 먹는 동안 꼬리로 · 움찔하면 멈췄다 다시(첫 치유)
// → 첫 들림(꼬리날개로 옆 비키기 · 바위 피하기 → 호수에 첨벙) → 훈련 3일 지플백(불티 머리에 물 · 가스 머리 X)
import { say, talk, wait, until, goal, useAt, near, dist, talking, throwFrom, previewArc, knock, bang, sfx, shoot, FX, burst, puff, faceTo } from './kit.js?v=1';
import { createFlight, addStack } from '../play/flight.js?v=1';

export const chapter = {
  id: 5, title: '꼬리날개', sub: '못 나는 드래곤에게 날개를', place: 'cove', time: 'day',
  end: '투슬리스 꼬리에 새 날개 — 부르면 오는 사이(레벨 1)',
  steps: [
    /* ① 대장간 — 쇠가 주황일 때 F(빨강·하양 = 탕 · 연타 = 엉킴) · 꼬리날개 다섯 번 + 방패 덧대기 둘 */
    { id: '5-1', verb: 'forge', place: 'forge', time: 'night', goal: '꼬리날개를 두드려 만들어라', at: [9, 7.4], face: [0, -1], limit: 90,
      hints: ['쇠가 주황색일 때만 Space', '빨갛거나 하얄 땐 기다려요'],
      *run(G) {
        G.cast.person('gobber', 5.6, 6.6, { dir: 'side', flip: 1, pose: { carry: 'hammer' } });
        G.P.lock = true; G.P.dir = 'up'; G.P.carry = 'hammer';
        yield* talk(G, [['gobber', '내가 젊을 땐 드래곤 둘을… 아니 다섯을…'], ['gobber', '날개나 꼬리를 노려라. 못 나는 드래곤은 못 도망가지!'], ['hiccup', '(못 나는 드래곤… 꼬리날개를 만들어 주면 되잖아!)', ['finNew']]]);
        const need = G.diff === 'easy' ? 4 : 5, shield = G.inv.scale ? 2 : 0;
        let good = 0, heat = 0, flash = 0;
        const COL = ['#7a2a1a', '#c8442e', '#e9772e', '#f6c24a', '#f8f0d0'], win = G.diff === 'easy' ? 0.5 : 0.36, per = G.diff === 'easy' ? 2.2 : 1.7;
        G.drawOver = (ctx, V) => {
          const x = V.sx(9), y = V.sy(5.55), k = V.S, h = heat < 0.5 ? heat * 2 : 2 - heat * 2, c = COL[Math.min(4, Math.floor(h * 4.99))];
          ctx.fillStyle = c; ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x - 0.5 * k, y); ctx.quadraticCurveTo(x, y - (0.15 + good * 0.06) * k, x + 0.5 * k, y - good * 0.05 * k); ctx.lineTo(x + 0.4 * k, y + 0.08 * k); ctx.lineTo(x - 0.5 * k, y + 0.08 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
          if (flash > 0) { ctx.fillStyle = '#f6d26a'; for (let i = 0; i < 6; i++) ctx.fillRect(x + Math.cos(i) * 30 * flash, y - Math.abs(Math.sin(i * 2)) * 30 * flash, 4, 4); }
          ctx.fillStyle = '#f4ead2'; ctx.font = `700 ${Math.round(k * 0.28)}px sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#2b2118';
          const tx = '꼬리날개 ' + Math.min(good, need) + '/' + need + (shield ? '  ·  방패 ' + Math.max(0, good - need) + '/' + shield : ''); ctx.strokeText(tx, x, y - 1.2 * k); ctx.fillText(tx, x, y - 1.2 * k);
        };
        while (good < need + shield) {
          const dt = yield; flash = Math.max(0, flash - dt * 3);
          heat = (heat + dt / per) % 1;
          const h = heat < 0.5 ? heat * 2 : 2 - heat * 2, orange = Math.abs(h - 0.6) < win * 0.5; G.flags.h = h; G.flags.win = win;
          if (G.I.pressed.use) {
            sfx(G, 'clang', 9);
            if (orange && !(G.P.mashT > 0)) { good++; flash = 1; burst('spark', 9, 6.2, 1, 6, 3, 0.35, 0.08, G.rng); if (good === need) { say(G, 'gobber', '오, 제법인데? 그건 뭐에 쓰는 거냐?', { secs: 2 }); say(G, 'hiccup', '어… 그냥… 발명품이요!', { secs: 1.8 }); if (shield) say(G, 'hiccup', '그을린 조각도 방패에 덧대 볼까.', { secs: 2 }); } }
            else { if (good > 0 && good !== need) good--; sfx(G, 'thud', 9); puff('smoke', 9, 6.2, 1.2, 0, 0, 0.5, 0.6, 0.2); }
          }
        }
        G.drawOver = null; G.P.lock = false; G.P.carry = null;
        G.inv.fin = 1; if (shield) { G.inv.shield = 2; G.hud.banner('방패를 덧댔다 — 덜 밀리고 소리가 커짐', 'shield', 2.6); }
        yield* wait(1.4);
        return true;
      },
      sense: (G) => ({ h: G.flags.h, win: G.flags.win }) },

    /* ② 코브 — 뱀장어에 질겁(꺼내서 던지기) · 먹는 동안 살금살금 꼬리까지 · F 꾹 = 묶기 · 움찔(동공 가늚)하면 손 떼고 기다렸다 다시 = 첫 치유 */
    { id: '5-2', verb: 'give', goal: '꼬리날개를 달아라', at: [12, 15], limit: 100, mood: 1,
      hints: ['바구니에서 뱀장어를 Space로 꺼내 던져요', '먹는 동안 꼬리 곁에서 Space 꾹 — 움찔하면 손을 떼요'],
      *run(G) {
        const D = G.cast.dragon('toothless', 23, 15, { flip: -1, fear: 0.3, pose: { pupil: 0.8, fin: 'none' } });
        const bask = G.W.prop('fish_basket', 18.5, 15.4, { n: 3, eel: 1 });
        let ph = 'eel', t = 0, prog = 0, flinch = 0, flN = 0, swatT = 0, tail = 25.4;
        D.to = [20.4, 15]; D.spd = 2;
        yield* until(() => !D.to, 3);
        D.fear = 1; D.to = [25, 15]; D.spd = 6; sfx(G, 'growl', D.x); bang(G, D, 2);
        yield* talk(G, [['hiccup', '뱀장어를 보고 질겁했어! 드래곤은 뱀장어를 싫어하는구나.', ['eel']]]);
        G.book.note('nightfury', 'hates', '칼 · 뱀장어');
        while (true) {
          const dt = yield; t += dt; G.flags.ph = ph;
          if (ph === 'eel') { goal(G, bask.x, bask.y); if (useAt(G, bask.x, bask.y, 1.5)) { G.P.carry = 'fish'; bask.o.eel = 0; ph = 'throw'; say(G, 'hiccup', '이건 저리 치워 줄게.', { secs: 1.4 }); } }
          else if (ph === 'throw') { if (G.I.pressed.use) { G.P.carry = null; G.P.fx = -1; G.P.fy = 0; throwFrom(G, 'eel'); ph = 'eat'; t = 0; D.fear = 0.2; D.to = [19.6, 15.2]; D.spd = 2.4; } }
          else if (ph === 'eat') {
            const look = (t % 4.2) > 3.0; D.pose.eat = look ? 0 : 1; D.look = look ? 1 : 0; D.flip = look ? 1 : -1;
            if (look) bang(G, D, 2.2);
            tail = D.x + 2.5; goal(G, tail, D.y + 0.3, { h: 1.4 });
            const at = near(G, tail, D.y + 0.3, 1.0);
            if (at) G.fspots.push({ x: tail, y: D.y + 0.3, label: 'Space 꾹' });
            if (look && at && G.P.crouch < 0.5 && Math.hypot(G.P.vx, G.P.vy) > 0.3) { knock(G, 1, 0, 0.5); prog = Math.max(0, prog - 0.3); }
            const hold = at && G.I.down.use && !look;
            if (flinch > 0) { flinch -= dt; D.pupilTo = 0.15; if (G.I.down.use && at) { swatT += dt; if (swatT > 0.35) { knock(G, 1, 0.3, 0.7); prog = Math.max(0, prog - 0.35); flinch = 0; swatT = 0; sfx(G, 'growl', D.x); } } }
            else { D.pupilTo = null; swatT = 0; if (hold) { prog += dt / (G.diff === 'easy' ? 2.4 : 3.2); G.P.handLock = 1; } else G.P.handLock = 0; }
            if ((prog > 0.35 && flN === 0) || (prog > 0.7 && flN === 1)) { flN++; flinch = 1.1; sfx(G, 'growl', D.x); bang(G, D, 2); G.marks.push({ k: 'text', x: tail, y: D.y - 1.4, t: '움찔!', s: 22 }); }
            G.marks.push({ k: 'text', x: tail, y: D.y - 2.1, t: Math.round(prog * 100) + '%', s: 16 });
            G.flags.tail = [tail, D.y + 0.3]; G.flags.look = look; G.flags.flinch = flinch > 0;
            if (prog >= 1) break;
          }
        }
        G.P.handLock = 0; D.pose.fin = 'new'; D.pose.eat = 0; D.pupilTo = null; G.flags.ph = 'done';
        G.hud.banner('첫 치유 — 아픈 곳은 움찔 · 멈췄다 다시 하면 돼', 'heart', 3);
        yield* wait(1);
        return true;
      },
      sense: (G) => ({ ph: G.flags.ph, basket: [18.5, 15.4], tail: G.flags.tail, look: G.flags.look, flinch: G.flags.flinch }) },

    /* ③ 첫 들림 — 투슬리스가 날아오르고, 히컵은 꼬리에 매달려 ←→로 꼬리날개 · 바위를 피해 → 호수에 첨벙(정해진 끝) */
    { id: '5-3', verb: 'fly', goal: '꼬리날개로 바위를 피해라', at: [20, 26], limit: 60,
      hints: ['←→로 꼬리날개를 돌려 옆으로 비켜요', '바위 사이 틈을 미리 봐요'],
      *run(G) {
        const F = G.Fl = createFlight(20, 26, { speed: 6.5, assist: G.diff === 'easy', fin: 'new', rider: 'hiccup', lane: [5, 34], z: 1.6 }); G.mode = 'fly'; G.flyPose = { saddle: 0 };
        [[14, 21], [26, 19.5], [20, 15.5], [11, 12], [28, 11.5], [18, 8]].forEach(([x, y]) => addStack(F, x, y, 1.1, { prop: 'rock' }));
        say(G, 'hiccup', '어어어… 뜬다! 꼬리를… 이쪽으로!', { secs: 2.2 });
        while (F.y > 5) {
          yield;
          if (F.hits > 0 || F.falls > 0) { say(G, 'hiccup', '으악! …다시 해 보자, 투슬리스.', { secs: 1.6 }); yield* wait(0.8); return 'retry'; }
        }
        F.lockH = 1;
        for (let t = 0; t < 1; t += yield) F.vx = 6;
        sfx(G, 'splash', F.x); burst('drop', F.x, F.y, 0.2, 18, 4, 0.8, 0.12, G.rng);
        G.Fl = null; G.mode = 'walk'; G.P.x = 24; G.P.y = 6.5;
        G.hud.banner('첫 들림 — 투슬리스는 날개가, 히컵은 꼬리가', 'finNew', 3);
        yield* talk(G, [['hiccup', '푸하! …첨벙했지만, 날았어!'], ['hiccup', '투슬리스는 날개, 나는 꼬리. 둘이 함께여야 날 수 있어.']]);
        return true;
      } },

    /* ④ 훈련 3일 지플백 — 초록 김 = 가스 머리 · 입가 불티 = 불꽃 머리 → 불꽃 머리에 물(젖으면 불꽃 X) · 쌍둥이가 서로 물을 끼얹는 사이 가스가 짙어짐 */
    { id: '5-4', verb: 'throw', place: 'arena', time: 'day', goal: '불꽃 머리를 적셔라', at: [8, 15], limit: 90,
      hints: ['입가에 불티가 튀는 쪽이 불꽃 머리예요', '통 앞에서 Space로 물 → 고리를 그 머리에 맞춰 Space'],
      *run(G) {
        const D = G.cast.dragon('zippleback', 18, 8, { flip: -1, pose: { pupil: 0.3 } });
        G.cast.person('ruffnut', 11, 10, { dir: 'side', flip: 1, pose: { carry: 'bucket' } }); G.cast.person('tuffnut', 12.2, 10.6, { dir: 'side', flip: -1, pose: { carry: 'bucket' } });
        const tub = G.W.prop('barrel', 5, 17, { water: 1 });
        G.W.findProp('cage', 22, 4).o.open = 1;
        say(G, 'gobber', '오늘은 지플백! 한 머리는 가스, 한 머리는 불꽃이다.', { secs: 2.6 });
        let gas = 0, wet = 0, t = 0, spark = 1, swapT = 3, fights = 0;
        const need = G.diff === 'easy' ? 1 : 2;
        say(G, 'ruffnut', '내가 먼저!', { secs: 1.2 }); say(G, 'tuffnut', '아니 내가!', { secs: 1.2 });
        while (wet < need) {
          const dt = yield; t += dt; swapT -= dt;
          if (swapT <= 0) { spark = -spark; swapT = 2.6 + G.rng() * 1.5; }
          const hs = [{ x: D.x - 2.4, y: D.y - 0.8 + Math.sin(t * 1.3) * 0.5 }, { x: D.x - 2.6, y: D.y + 1.1 + Math.sin(t * 1.1 + 2) * 0.4 }];
          const sp = spark > 0 ? hs[0] : hs[1], gh = spark > 0 ? hs[1] : hs[0]; G.flags.sp = sp; G.flags.gh = gh;
          D.pose.tell = 1; D.pose.sparkHead = spark > 0 ? 0 : 1;
          if (G.rng() < dt * 10) puff('spark', sp.x, sp.y, 2, -1 + G.rng() * 2, 0, 1, 0.3, 0.08);
          if (G.rng() < dt * 6) puff('gas', gh.x, gh.y, 2, -0.6, 0, 0.2, 1.6, 0.3);
          gas += dt * (G.diff === 'easy' ? 0.012 : 0.02) + (fights ? dt * 0.01 : 0);
          if (t > 8 && fights === 0) { fights = 1; say(G, 'tuffnut', '야, 물을 왜 나한테 부어!', { secs: 1.6 }); say(G, 'ruffnut', '네가 먼저 했잖아!', { secs: 1.6 }); }
          if (!G.P.carry) { goal(G, tub.x, tub.y); if (useAt(G, tub.x, tub.y, 1.5)) { G.P.carry = 'bucket'; sfx(G, 'splash', tub.x); } }
          else {
            goal(G, sp.x, sp.y, { h: 2.8 });
            previewArc(G);
            if (G.I.pressed.use) {
              G.P.carry = null;
              throwFrom(G, 'water', { shot: { land: (s) => {
                const S = G.flags.sp, H = G.flags.gh;
                if (Math.hypot(s.x - S.x, (s.y - S.y) * 1.2) < 1.0) { wet++; puff('steam', S.x, S.y, 2, 0, 0, 1, 1, 0.4); sfx(G, 'splash', S.x); if (wet < need) say(G, 'fishlegs', '맞았어! 젖은 머리는 불꽃이 안 나!', { secs: 1.8 }); }
                else if (Math.hypot(s.x - H.x, (s.y - H.y) * 1.2) < 1.0) { sfx(G, 'splash', H.x); say(G, 'hiccup', '(그건 가스 머리야…)', { secs: 1.4 }); }
              } } });
            }
          }
          if (gas > 0.55) G.marks.push({ k: 'text', x: D.x - 1, y: D.y - 3.6, t: '가스가 짙어져!', s: 18, c: '#4a6a2a' });
          if (gas >= 1) { burst('smoke', D.x - 2, D.y, 2, 14, 3, 1.5, 0.6, G.rng); sfx(G, 'boom', D.x); say(G, 'gobber', '펑! 가스에 불티가 닿으면 터진다니까!', { secs: 2 }); yield* wait(1); return 'retry'; }
        }
        D.pose.tell = 0; D.pose.pupil = 0.8;
        G.book.note('zippleback', 'weak', '젖은 머리는 불꽃 X');
        yield* talk(G, [['hiccup', '그리고… 이것도.', ['eel']]]);
        G.P.carry = 'fish'; D.fear = 1; D.to = [22, 5]; D.spd = 4; sfx(G, 'growl', D.x);   /* 뱀장어를 보이자 지플백이 우리로 물러남(영화 #12) */
        yield* wait(1.2); G.P.carry = null;
        yield* talk(G, [['gobber', '히컵이 또 해냈어! 어떻게 한 거냐?'], ['hiccup', '(투슬리스한테 배웠다고는… 못 하지.)']]);
        G.hud.banner('훈련장 순위판 — 히컵이 중간까지', 'shield', 2.6);
        yield* wait(1.6);
        return true;
      },
      sense: (G) => ({ sp: G.flags.sp, gh: G.flags.gh, tub: [5, 17], carry: G.P.carry }) },
  ],
};
