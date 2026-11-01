// 6장 하늘을 나는 법(#13~16 · design §2 · 탑뷰) — 코브에서 배운 셋(드래곤 풀 · 턱 밑 긁기 · 빛 점) → 훈련장 한 판(그롱클·내더·테러 · 공격 뒤 틈에만 먹힘 · 진정 = 묵은 비늘)
// → 첫 바다 비행(꼬리 쪽지 → 바람에 날아감 → 감으로 · 돌기둥 1m 스치면 바람 + 덤 빠르기)
import { say, wait, until, goal, useAt, near, dist, talking, hitsMe, knock, bang, sfx, shoot, FX, burst, puff, faceTo } from './kit.js?v=1';
import { createFlight, addStack, addCloud } from '../play/flight.js?v=1';

const TELL = { easy: 3, normal: 2.5, hard: 2 };
export const chapter = {
  id: 6, title: '하늘을 나는 법', sub: '투슬리스에게 배운 것', place: 'arena', time: 'day',
  end: '하늘 지도가 열렸다 — 마을 아이들이 히컵을 따라다녀요',
  steps: [
    /* ① 훈련장 한 판 — 셋이 한꺼번에 · 그롱클 = 쏜 뒤 틈에 풀(F) · 내더 = 가시 뒤 틈에 턱 밑 F 꾹 · 테러 = 햇빛 자리(☀)에서 방패 F → 빛 점을 쫓아 우리로 */
    { id: '6-1', verb: 'approach', goal: '셋 다 진정시켜라', at: [15, 18], limit: 120,
      hints: ['쏘고 난 뒤 "휴…" 할 때 가까이 가서 F', '테러는 햇빛 자리(☀)에서 F — 빛 점을 쫓아가요'],
      *run(G) {
        say(G, 'hiccup', '투슬리스한테 배웠어: 드래곤 풀 · 턱 밑 긁기 · 빛 점!', { icons: ['nip', 'hand', 'shield'] });
        for (const c of G.W.props.filter((p) => p.kind === 'cage')) c.o.open = 1;
        G.cast.person('gobber', 3.5, 18.6, { dir: 'side', flip: 1 });
        const ast = G.cast.person('astrid', 26, 18.2, { dir: 'side', flip: -1, pose: { carry: 'axe' } });
        const tell = TELL[G.diff];
        const mk = (kind, x, y) => { const d = G.cast.dragon(kind, x, y, { flip: -1, fear: 0.7, pose: { pupil: 0.3 } }); d.st = 'walk'; d.t = 0; d.calm = false; return d; };
        const Dg = mk('gronckle', 8, 9), Dn = mk('nadder', 22, 10), Dt = mk('terror', 15, 7);
        Dt.z = 1.6; Dt.pose.wing = 1; Dt.flapHz = 3;
        const sun = [15, 15], cageT = [22, 5.2];
        let hits = 0, light = null, lt = 0, chin = 0;
        G.P.carry = 'shield'; G.flags.d6 = [Dg, Dn, Dt]; G.flags.light = () => light;
        G.drawUnder = (ctx, V) => { const x = V.sx(sun[0]), y = V.sy(sun[1]); ctx.fillStyle = 'rgba(246,210,106,.4)'; ctx.beginPath(); ctx.ellipse(x, y, 1.2 * V.S, 0.7 * V.S, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#a8742a'; ctx.font = `700 ${Math.round(V.S * 0.4)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☀', x, y); };
        const hitMe = (s, ux, uy) => { if (hitsMe(G, s)) { if (knock(G, ux, uy, 0.7)) hits++; return true; } return false; };
        while (!(Dg.calm && Dn.calm && Dt.calm)) {
          const dt = yield;
          for (const D of [Dg, Dn]) {
            if (D.calm) continue;
            D.t += dt;
            if (D.st === 'walk') { faceTo(D, G.P.x, G.P.y); if (D.t > 1.6) { D.st = 'tell'; D.t = 0; sfx(G, 'cry_' + D.kind, D.x); } }
            else if (D.st === 'tell') {
              D.pose.tell = Math.min(1, D.t / (tell * 0.5)); bang(G, D, D.kind === 'nadder' ? 2.6 : 2.2); faceTo(D, G.P.x, G.P.y);
              if (D.t > tell) {
                D.st = 'shot'; D.t = 0; D.pose.tell = 0;
                let ux = G.P.x - D.x, uy = G.P.y - D.y; const d = Math.hypot(ux, uy) || 1; ux /= d; uy /= d;
                if (D.kind === 'gronckle') shoot({ kind: 'lava', x: D.x + ux * 1.2, y: D.y + uy * 1.2, z: 0.8, vx: ux * 8, vy: uy * 8, g: 0, r: 0.32, life: 2.6, hit: (s) => hitMe(s, ux, uy) });
                else for (const a of [-0.15, 0, 0.15]) { const c = Math.cos(a), sn = Math.sin(a); shoot({ kind: 'spike', x: D.x + ux * 1.3, y: D.y + uy * 1.3, z: 0.55, vx: (ux * c - uy * sn) * 10, vy: (uy * c + ux * sn) * 10, g: 0, life: 2.2, hit: (s) => hitMe(s, ux, uy) }); }
                sfx(G, D.kind === 'gronckle' ? 'fire' : 'whoosh', D.x);
              }
            } else if (D.st === 'shot') { if (D.t > 0.5) { D.st = 'gap'; D.t = 0; } }
            else if (D.st === 'gap') {
              /* 틈 — 숨 고르기(고개 숙임 · 눈 둥글게) · 여기서만 진정이 먹힘 */
              D.pose.pupil = 0.85; D.pose.eat = D.kind === 'nadder' ? 0.6 : 0;
              G.marks.push({ k: 'text', x: D.x, y: D.y - (D.kind === 'nadder' ? 2.8 : 2.3), t: '휴…', s: 18 });
              const d = Math.hypot(G.P.x - D.x, G.P.y - D.y);
              if (D.kind === 'gronckle' && d < 2.8) { G.fspots.push({ x: D.x, y: D.y + 0.6 }); if (G.I.pressed.use && !(G.P.mashT > 0)) { D.calm = true; D.pose.roll = 1; G.W.prop('nip', D.x - 0.6, D.y + 0.4, {}); sfx(G, 'purr', D.x); say(G, 'fishlegs', '드래곤 풀에 뒹굴어! 책에 없던 거야!', { secs: 2 }); G.book.note('gronckle', 'likes', '드래곤 풀'); } }
              if (D.kind === 'nadder' && d < 2.4) { G.fspots.push({ x: D.x, y: D.y + 0.6, label: 'F꾹' }); if (G.I.down.use) { chin += dt; G.P.handLock = 1; if (chin > 0.6) { D.calm = true; D.pose.sit = 1; D.pose.eat = 0; sfx(G, 'purr', D.x); say(G, 'snotlout', '저걸 어떻게… 턱을 긁었다고?', { secs: 2 }); G.book.note('nadder', 'likes', '턱 밑 긁기'); G.P.handLock = 0; } } else chin = 0; }
              if (D.t > (G.diff === 'easy' ? 3 : G.diff === 'hard' ? 1.6 : 2.2)) { D.st = 'walk'; D.t = 0; D.pose.eat = 0; D.pose.pupil = 0.3; chin = 0; G.P.handLock = 0; D.to = D.kind === 'nadder' ? [17 + G.rng() * 8, 7 + G.rng() * 6] : [5 + G.rng() * 8, 7 + G.rng() * 6]; D.spd = 2.4; }
            }
            if (D.calm) { D.pose.tell = 0; D.pose.pupil = 1; D.to = null; G.inv.oldScale = (G.inv.oldScale || 0) + 1; G.hud.banner('묵은 비늘 — 진정시키면 드래곤이 스스로 내려놔요', 'heart', 2.4); }
          }
          /* 테러 — 빛 점 */
          if (!Dt.calm) {
            if (!light) { Dt.x = 15 + Math.sin(G.t * 1.7) * 5; Dt.y = 8 + Math.sin(G.t * 2.9) * 2; Dt.flip = Math.cos(G.t * 1.7) > 0 ? 1 : -1; if (near(G, sun[0], sun[1], 1.2)) { G.fspots.push({ x: sun[0], y: sun[1] }); if (G.I.pressed.use) { light = { x: sun[0], y: sun[1] - 1.5 }; lt = 0; sfx(G, 'pluck', sun[0]); } } }
            else {
              lt += dt; const dx = cageT[0] - light.x, dy = cageT[1] - light.y, dd = Math.hypot(dx, dy); if (dd > 0.1) { light.x += dx / dd * Math.min(dd, dt * 3.2); light.y += dy / dd * Math.min(dd, dt * 3.2); }
              G.marks.push({ k: 'dot', x: light.x, y: light.y, r: 9, c: '#f6d26a' });
              Dt.x += (light.x - Dt.x) * Math.min(1, dt * 3); Dt.y += (light.y - Dt.y) * Math.min(1, dt * 3); Dt.z += (0.3 - Dt.z) * Math.min(1, dt * 3);
              if (!near(G, sun[0], sun[1], 1.8) && lt < 2.2) light = null;
              else if (dd < 0.3 && Math.hypot(Dt.x - cageT[0], Dt.y - cageT[1]) < 0.7) { Dt.calm = true; Dt.z = 0; Dt.pose.wing = 0; G.W.findProp('cage', 22, 4).o.open = 0.2; sfx(G, 'pop', cageT[0]); say(G, 'ruffnut', '빛 점을 쫓아 우리로 쏙!', { secs: 1.8 }); G.book.note('terror', 'likes', '빛 점'); G.inv.oldScale = (G.inv.oldScale || 0) + 1; }
            }
          }
          const left = [Dg, Dn, Dt].filter((d) => !d.calm);
          if (left.length) { const c = left[0]; if (c === Dt) goal(G, sun[0], sun[1], { h: 1.6 }); else goal(G, c.x, c.y); } else goal(G, null);
          if (hits >= 4 && G.diff !== 'easy') { say(G, 'gobber', '히컵! 셋 다 한꺼번엔 무리였나? 다시!'); yield* wait(1); return 'retry'; }
        }
        G.P.handLock = 0;
        say(G, 'gobber', '셋 다 진정이라니! 관중석이 들썩이는구나!');
        G.hud.banner('훈련장 순위판 1등 — 히컵', 'shield', 2.6);
        ast.to = [15, 21.5]; ast.spd = 3;
        say(G, 'astrid', '(…저 녀석, 뭔가 숨기고 있어.)', { secs: 2.2 });
        yield* wait(2);
        return true;
      },
      sense: (G) => ({ sun: [15, 15], light: !!(G.flags.light && G.flags.light()), ds: (G.flags.d6 || []).map((d) => ({ k: d.kind, x: +d.x.toFixed(2), y: +d.y.toFixed(2), st: d.st, calm: d.calm })) }) },

    /* ② 첫 바다 비행 — 꼬리 쪽지(그림) → 반쯤에서 바람에 날아감 → 감으로 · 돌기둥 사이 · 스치면 바람 + 덤 */
    { id: '6-2', verb: 'fly', place: 'sea', time: 'day', goal: '돌기둥 사이를 빠져나가라', at: [24, 0], limit: 120,
      hints: ['돌기둥이 오기 전에 ←→로 틈을 골라요', 'Space를 누르고 있으면 꼬리가 펴져 빨리 꺾여요'],
      *run(G) {
        const F = G.Fl = createFlight(24, 0, { speed: 10, assist: G.diff === 'easy', fin: 'new', rider: 'hiccup', lane: [10, 38] }); G.mode = 'fly';
        const R = G.rng, end = -320;
        for (let i = 0; i < 20; i++) {
          const y = -22 - i * 15 - R() * 3, gap = 10 + R() * 18;
          addStack(F, gap - 4.6, y, 1.4 + R() * 0.6); addStack(F, gap + 4.6, y - R() * 2, 1.4 + R() * 0.6);
          if (i % 3 === 1) addStack(F, gap > 24 ? 13 : 35, y + 6, 1.6);
        }
        for (let i = 0; i < 9; i++) addCloud(F, 12 + R() * 24, -30 - i * 36, 9, 5);
        const card = document.createElement('div'); card.className = 'stepui';
        card.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%) rotate(-2deg);z-index:21;background:#f4ead2;border:2px solid #2b2118;border-radius:8px 14px 10px 12px;padding:6px 12px;font:700 15px "Noto Sans KR",sans-serif;color:#2b2118;transition:transform 1.2s, opacity 1.2s;pointer-events:none';
        card.innerHTML = '꼬리 쪽지 — ←→ 비키기 · Space 꾹 = 꼬리 펴서 휙 · ↑ 빠르게 · ↓ 느리게';
        document.body.appendChild(card);
        say(G, 'hiccup', '쪽지대로 하면 돼… 꼬리 자리 맞추고!', { icons: ['map'] });
        let blown = false, saidG = false;
        while (F.y > end) {
          yield;
          F.checkY = Math.floor(F.y / 60) * 60 + 60;
          if (!blown && F.y < end * 0.45) { blown = true; card.style.transform = 'translate(260px,-420px) rotate(60deg)'; card.style.opacity = '0'; say(G, 'hiccup', '앗, 쪽지가! …괜찮아, 감으로 가자!'); G.hud.banner('쪽지가 바람에 날아갔다', 'wind', 2); }
          if (F.grazes >= 3 && !saidG) { saidG = true; say(G, 'hiccup', '휘익— 스칠 때 바람이 받쳐 줘!', { secs: 1.6 }); }
        }
        card.remove();
        G.hud.banner('하늘 지도가 열렸다', 'map', 2.6);
        G.book.note('nightfury', 'other', '둘이 함께여야 난다(꼬리 · 날개)', false);
        yield* wait(1.4);
        return true;
      } },
  ],
};
