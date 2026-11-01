// 2장 숲의 자국(#4 · design §2 · 탑뷰) — 큰 회관 회의(횃불 지키며 듣기 · '바이킹은 겁나도 간다') → 안개 숲 흔적(멈춰서 F 꾹 · 꼬리날개 조각) → 묶인 나이트 퓨리(숨 고를 때만 밧줄 · 찌르는 동작 없음)
import { say, talk, wait, until, goal, useAt, near, dist, talking, bang, sfx, burst, puff, faceTo } from './kit.js?v=1';
import { mindStep } from '../play/actors.js?v=1';

export const chapter = {
  id: 2, title: '숲의 자국', sub: '아무도 안 믿으니, 내가 찾는다', place: 'forest', time: 'fog',
  end: '왜… 나를 안 해쳤지?',
  steps: [
    /* ① 큰 회관 회의 — 걸으며 듣기 + 흐려지는 횃불에 F(둘이 함께 꺼지면 다시) */
    { id: '2-1', verb: 'listen', place: 'hall', time: 'night', goal: '횃불을 지키며 회의 듣기', at: [15, 9], limit: 70,
      hints: ['흐려지는 횃불 앞에서 Space', '횃불 둘이 함께 꺼지면 안 돼요'],
      *run(G) {
        const T = G.W.props.filter((p) => p.kind === 'torch'); for (const p of T) { p.o.lit = 1; p.dim = 0; }
        G.cast.person('stoick', 15, 5.6, { dir: 'down' }); G.cast.person('gobber', 12.4, 6.2, { dir: 'down' });
        [[6, 8.6], [10, 8.6], [20, 8.6], [24, 13.6], [7, 13.6]].forEach(([x, y], i) => G.cast.person(i % 2 ? 'villager' : 'villager2', x, y, { dir: 'up' }));
        const lines = [['stoick', '얼음이 얼기 전에 둥지를 찾으러 간다. 마지막 원정이다.'], ['villager', '또 둥지 찾기라니… 다들 바쁜데.'], ['stoick', '바이킹은 겁나도 간다!'],
          ['gobber', '그럼 히컵은 누가 보나? …내가 훈련이나 시키지.'], ['stoick', '좋다. 드래곤 훈련, 내일부터다.'], ['hiccup', '(훈련? 난 숲에 볼일이 있는데…)']];
        let i = 0, dimT = 2;
        G.flags.T = T;
        while (true) {
          const dt = yield;
          if (i < lines.length && !talking(G)) { const [w, s] = lines[i++]; say(G, w, s, { secs: 3.6 }); }
          dimT -= dt;
          if (dimT <= 0) { const c = T.filter((p) => !p.dim && p.o.lit > 0.9); if (c.length) c[Math.floor(G.rng() * c.length)].dim = 1; dimT = G.diff === 'easy' ? 7 : 4.6; }
          let out = 0, worst = null;
          for (const p of T) {
            if (p.dim) { p.o.lit = Math.max(0, p.o.lit - dt * (G.diff === 'easy' ? 0.09 : 0.14)); if (!worst || p.o.lit < worst.o.lit) worst = p; }
            if (p.o.lit <= 0) out++;
            if (p.dim && useAt(G, p.x, p.y + 0.8, 1.3)) { p.dim = 0; p.o.lit = 1; sfx(G, 'pop', p.x); puff('ember', p.x, p.y, 2, 0, 0, 1, 0.5, 0.12); }
          }
          goal(G, worst ? worst.x : null, worst ? worst.y + 0.8 : 0);
          if (out >= 2) { say(G, 'stoick', '왜 이렇게 어두워? 히컵!', { secs: 2 }); yield* wait(1); return 'retry'; }
          if (i >= lines.length && !talking(G)) break;
        }
        goal(G, null);
        /* 저녁 — 둘의 말이 겹쳐 '싫어요'가 묻힘(design §2 2장) */
        yield* talk(G, [['stoick', '히컵, 할 말이 있다.'], ['hiccup', '아빠, 저도 할 말이 있어요.'], ['stoick', '넌 내일부터 드래곤 훈련을—'], ['hiccup', '저는 드래곤을 죽이는 건 싫—'],
          ['stoick', '—받는다! 좋은 소식이지? 바이킹은 겁나도 간다.'], ['hiccup', '(…싫다는 말은 또 묻혔다.)']]);
        return true;
      },
      sense: (G) => ({ torches: (G.flags.T || []).map((p) => ({ x: p.x, y: p.y + 0.8, lit: +p.o.lit.toFixed(2), dim: !!p.dim })) }) },

    /* ② 안개 숲 — 흔적 셋을 멈춰서 F 꾹 → 지도에 · 꼬리날개 조각 줍기 · 통나무는 점프 */
    { id: '2-2', verb: 'track', goal: '흔적을 따라가라', at: [2.5, 15], limit: 90,
      hints: ['안개 속 흔적 곁에 멈춰서 Space를 꾹', '쓰러진 통나무는 X로 넘어요'],
      *run(G) {
        const clues = G.W.A.clues.map(([x, y], i) => ({ x, y, n: ['부러진 나무', '파인 땅', '그을음', '꼬리날개 조각'][i], k: 0 }));
        for (const c of clues) c.p = G.W.prop(c.n === '꼬리날개 조각' ? '_fin' : '_clue', c.x, c.y, { n: c.n });
        yield* talk(G, [['hiccup', '아무도 안 믿어. 그럼 내가 찾아서 보여 줄 거야.'], ['hiccup', '분명히 이쪽 숲으로 떨어졌어. 흔적이 있을 거야.', ['map']]], { walk: true });
        let ci = 0; G.flags.clues = clues;
        while (ci < clues.length) {
          const dt = yield; const c = clues[ci];
          goal(G, c.x, c.y, { h: 1.4 });
          G.P.gate = [0, 0, c.x + 3, 30];
          const here = near(G, c.x, c.y, 1.4) && Math.hypot(G.P.vx, G.P.vy) < 0.6 && !G.P.air;
          G.fspots.push({ x: c.x, y: c.y, label: 'Space 꾹' });
          if (here && G.I.down.use) { c.k += dt; G.marks.push({ k: 'ring', x: c.x, y: c.y, r: 0.4 + c.k * 0.5, c: '#e6c464' }); } else c.k = Math.max(0, c.k - dt * 2);
          if (c.k > (G.diff === 'easy' ? 0.5 : 0.9)) {
            ci++; sfx(G, 'pluck', c.x); G.flags.ci = ci;
            if (c.n === '꼬리날개 조각') { G.W.removeProp(c.p); G.inv.finPiece = 1; G.hud.banner('주머니에 꼬리날개 조각 — 찢긴 자국이 있어', 'fin', 3); }
            else G.hud.banner('지도에 그렸어요 — ' + c.n, 'map', 2.2);
            if (ci === 2) say(G, 'hiccup', '나무가 일자로 쓰러졌어… 무언가 크게 떨어졌다는 뜻이야.');
          }
        }
        G.P.gate = null; goal(G, 41, 15);
        yield* until(() => G.P.x > 40, 40);
        return true;
      },
      sense: (G) => ({ clues: (G.flags.clues || []).map((c) => [c.x, c.y]), ci: G.flags.ci || 0, logs: [[18.5, 13.6, 17.6], [29, 11.6, 16]] }) },

    /* ③ 묶인 나이트 퓨리 — 숨이 고를 때(동공 둥글 때)만 말뚝 F · 버둥일 때 끊으면 한 줄 되감김 · 찌르는 동작 없음 */
    { id: '2-3', verb: 'cut', goal: '밧줄 넷을 풀어라', at: [39, 15], limit: 90, mood: 1,
      hints: ['눈이 동그래지고 숨이 느려질 때 말뚝 앞에서 Space', '버둥댈 땐 기다려요 — X를 누른 채 살금살금'],
      *run(G) {
        const D = G.cast.dragon('toothless', 45, 15.2, { flip: -1, fear: 0.9, pose: { pupil: 0.15, sit: 1, wing: 0.2, fin: 'none' } });
        const pegs = [[42.6, 13.6], [42.6, 16.9], [47.4, 13.6], [47.4, 16.9]].map(([x, y]) => ({ x, y, cut: false, p: G.W.prop('log', x, y, { len: 0.4, rope: 1, nobox: 1 }) }));
        G.P.carry = 'knife'; G.flags.pegs = pegs;
        let calmT = 0, thrash = 0, cut = 0;
        const words = ['할 수 있어… 해야 돼…', '할 수 있어…', '해야… 돼…'];
        say(G, 'hiccup', '저기 있다…! 진짜 나이트 퓨리야.');
        G.drawUnder = (ctx, V) => { ctx.strokeStyle = '#b08a5a'; ctx.lineWidth = 3; for (const pg of pegs) if (!pg.cut) { ctx.beginPath(); ctx.moveTo(V.sx(pg.x), V.sy(pg.y)); ctx.quadraticCurveTo(V.sx((pg.x + D.x) / 2), V.sy((pg.y + D.y) / 2 - 0.6), V.sx(D.x + (pg.x - D.x) * 0.25), V.sy(D.y - 0.7)); ctx.stroke(); } };
        while (cut < 4) {
          const dt = yield;
          mindStep(D, G.P, dt, { fastV: 2.2, near: 6, calmK: 0.18, minFear: 0.1 });
          thrash -= dt;
          if (thrash <= 0 && D.fear < 0.5) calmT += dt;
          if (calmT > (G.diff === 'easy' ? 3.8 : 2.8)) { calmT = 0; thrash = G.diff === 'easy' ? 1.6 : 2.2; D.fear = Math.min(1, D.fear + 0.55); }
          const calm = thrash <= 0 && D.fear < 0.45;
          D.pupilTo = calm ? 1 : 0.12;
          D.x = 45 + (thrash > 0 ? Math.sin(G.t * 22) * 0.12 : 0); D.pose.wing = thrash > 0 ? 0.35 + Math.sin(G.t * 18) * 0.15 : 0.15;
          if (thrash > 0 && G.rng() < dt * 6) burst('dust', D.x, D.y, 0.2, 2, 1.2, 0.5, 0.2, G.rng);
          const pg = pegs.find((q) => !q.cut && near(G, q.x, q.y, 1.1));
          const nx = pegs.find((q) => !q.cut) || pegs[0];
          goal(G, nx.x, nx.y, { h: 1.4 });
          if (pg) G.fspots.push({ x: pg.x, y: pg.y });
          if (pg && G.I.pressed.use) {
            if (calm && D.pose.pupil > 0.65) { pg.cut = true; cut++; sfx(G, 'pluck', pg.x); if (cut < 4) say(G, 'hiccup', words[cut - 1], { secs: 1.8 }); }
            else { const back = pegs.filter((q) => q.cut); if (back.length) { back[back.length - 1].cut = false; cut--; } D.fear = 1; thrash = 1.4; calmT = 0; sfx(G, 'growl', D.x); bang(G, D, 2.2); }
          }
        }
        G.drawUnder = null;
        /* 마지막 줄 → 덮쳐 울부짖음(예고 2초 · 소리는 낮게 시작 · 쉬움은 휙 날아감만) → 비틀대며 날아감 */
        D.pupilTo = 0.1; D.pose.sit = 0;
        for (let t = 0; t < 2; t += yield) { D.pose.tell = t / 2; bang(G, D, 2.4); faceTo(D, G.P.x, G.P.y); }
        if (G.diff !== 'easy') {
          D.to = [G.P.x + (G.P.x < D.x ? 1.3 : -1.3), G.P.y]; D.spd = 7; G.P.lock = true; G.P.hurtT = 2.2;
          yield* until(() => !D.to, 1.5);
          D.pose.mouth = 1; sfx(G, 'roar', D.x);
          yield* wait(1.4);
          D.pose.mouth = 0;
        }
        D.pose.wing = 1; D.pose.tell = 0; D.to = [70, 2]; D.spd = 6; D.flapHz = 2.5;
        for (let t = 0; t < 2.4; t += yield) D.z = t * 2 + Math.sin(t * 9) * 0.3;
        G.P.lock = false; G.P.carry = null;
        G.hud.veil.show('', ''); yield* wait(1.2); G.hud.veil.hide();
        yield* talk(G, [['hiccup', '…날 덮쳤는데, 해치지 않았어.'], ['hiccup', '나도 못 했어. 떨고 있는 눈을 보니까…'], ['hiccup', '왜 날 안 해쳤지?']]);
        return true;
      },
      sense: (G) => { const D = G.cast.find('toothless'); return { pegs: (G.flags.pegs || []).map((q) => ({ x: q.x, y: q.y, cut: q.cut })), pupil: D ? +D.pose.pupil.toFixed(2) : null, D: D ? [D.x, D.y] : null }; } },
  ],
};
