// 7장 아빠의 투구(#17·#18 · design §2 · 탑뷰) — 아빠와 나란히 걸으며 듣기(엇갈리는 오해 대화 · 3.5m 안 · 가운데에서 투구 선물)
// → 최종 선발(아스트리드가 도끼로 기절시키기 전에 그롱클을 진정 · 쏜 뒤 '휴…' 틈에 드래곤 풀) → 원로가 히컵을 가리킴 · 관중석이 들썩 → 게시판 앞에서 웃음이 사라짐
// → 해 질 녘 짐을 들고 마을 빠져나가기(마을 사람 셋의 눈길 부채꼴 · 돌아보기 전 ! · 통 곁에서 C면 숨음 · 들키면 지난 통으로)
import { say, talk, wait, until, goal, near, talking, hitsMe, knock, bang, sfx, shoot, faceTo } from './kit.js?v=1';

const TELL = { easy: 3, normal: 2.5, hard: 2 };
/* 관중석(벽 위) — 이름 없는 마을 사람 · 고버 */
const CROWD = [['villager', 5.5, 1.7], ['villager2', 9.5, 1.6], ['gobber', 19.5, 1.7], ['villager', 23.5, 1.6], ['villager2', 26.5, 1.7], ['villager', 1.0, 9], ['villager2', 1.0, 14], ['villager2', 29, 8], ['villager', 29, 13.5]];

export const chapter = {
  id: 7, title: '아빠의 투구', sub: '아빠가 돌아왔다', place: 'village', time: 'day',
  howto: { '7-1': 'walk' },
  end: '내일이 마지막 시험 — 히컵은 짐을 쌌다',
  steps: [
    /* ① 아빠와 걸으며 듣기 — 대장간 앞 → 우물 → 큰길 → 큰 회관(40m쯤) · 3.5m(쉬움 4.5) 안에 있을 때만 아빠가 걸음 · 멀면 기다리며 "히컵?" · 큰길 모퉁이에서 투구 선물
       대화창(talk): 엇갈린 오해(아빠는 훈련 얘기 · 히컵은 들킨 줄) 앞 셋은 서서 · 뒤 넷은 걸으며(아빠가 몇 걸음 앞서 감) · 모퉁이 투구 선물은 서서 */
    { id: '7-1', verb: 'listen', goal: '아빠와 나란히 걸어라', at: [9, 29.3], face: [1, 0], helmet: 0, limit: 120,
      hints: ['아빠(▼) 곁 고리 안에 붙어 걸어요 — 멀어지면 아빠가 기다려요', '너무 앞서도, 뒤처져도 안 돼요 — 같이 걸어요'],
      *run(G) {
        const st = G.cast.person('stoick', 11, 29, { dir: 'side', flip: 1, spd: 1.8 });
        G.cast.person('gobber', 6.4, 28.5, { dir: 'side', flip: 1, pose: { carry: 'hammer' } });
        const fans = [G.cast.person('villager', 20.6, 31, { dir: 'up' }), G.cast.person('villager2', 28.4, 20.4, { dir: 'side', flip: -1 })];
        const R = G.diff === 'easy' ? 4.5 : 3.5;
        const path = [[22.6, 29.1], [22.6, 18.7], [31.4, 18.3], [31.8, 11.4]];
        let wp = 0, gave = false, farT = 0;
        G.flags.st = st;
        faceTo(st, G.P.x, G.P.y);
        yield* talk(G, [['stoick', '히컵! 원정에서 돌아왔다. 같이 좀 걷자.'], ['stoick', '다 들었다. 이제 숨길 것 없다.'], ['hiccup', '(헉… 투슬리스를 들켰나?) 아, 아빠, 그게요…']]);
        st.to = [15.6, 29.1];                                       /* 걸으며 듣기 — 아빠가 몇 걸음 앞서 감 */
        yield* talk(G, [['stoick', '그렇게 잘하면서 왜 말을 안 했냐!'], ['hiccup', '(역시 들켰어!) 일부러 숨긴 건 아니고요…'], ['stoick', '훈련장 말이다! 드래곤 셋을 다 진정시켰다며?'], ['hiccup', '아… 훈련장. 네, 훈련장이요. 휴우.']], { walk: true });
        while (true) {
          const dt = yield;
          const d = Math.hypot(G.P.x - st.x, (G.P.y - st.y) * 1.25), close = d < R;
          G.marks.push({ k: 'ring', x: st.x, y: st.y, r: R, c: close ? 'rgba(244,234,210,.5)' : 'rgba(168,62,30,.7)' });
          goal(G, st.x, st.y, { h: 2.7 });
          /* 큰길 모퉁이 — 투구 선물(아빠는 서서 말함) */
          if (wp === 2 && !gave) {
            gave = true; st.to = null; faceTo(st, G.P.x, G.P.y);
            yield* talk(G, [['stoick', '잠깐. 너한테 줄 게 있다.'], ['stoick', '네 엄마 가슴판 반쪽으로 만든 투구야.', ['helmet']]]);
            G.P.helmet = 1; sfx(G, 'clang', G.P.x); G.hud.banner('아빠와 같은 무늬 투구', 'helmet', 2.6);
            yield* wait(0.7);
            yield* talk(G, [['stoick', '나머지 반쪽은 내 투구고. 이제 우린 같은 무늬다.'], ['hiccup', '(기쁜데… 무겁다.)'], ['stoick', '내일은 최종 선발이다. 이겨서 체면 좀 세워 다오!'], ['hiccup', '(이기면… 모두 앞에서 드래곤을 처치해야 하는데.)']]);
            continue;
          }
          if (wp >= path.length) { if (!talking(G)) break; continue; }
          const tg = path[wp];
          if (close) { farT = 0; st.to = tg; if (Math.hypot(st.x - tg[0], st.y - tg[1]) < 0.15) { wp++; st.to = null; } }
          else { st.to = null; farT += dt; if (farT > 0.6) { faceTo(st, G.P.x, G.P.y); G.marks.push({ k: 'text', x: st.x, y: st.y - 2.6, t: '히컵?', s: 20 }); } }
          /* 지나가는 길의 마을 사람 — 경기장 자리 얘기(이름 없는 역할) */
          for (const f of fans) if (Math.hypot(st.x - f.x, st.y - f.y) < 4) { faceTo(f, st.x, st.y); f.pose.cheer = 1; G.marks.push({ k: 'text', x: f.x, y: f.y - 2.3, t: '내일 자리 맡았어요!', s: 15 }); } else f.pose.cheer = 0;
        }
        goal(G, null); st.to = [32, 9.6];
        G.hud.banner('투구가 생겼다 — 아빠와 같은 무늬', 'helmet', 2.4);
        yield* wait(1.2);
        return true;
      },
      sense: (G) => { const s = G.flags.st; return s ? { st: [+s.x.toFixed(2), +s.y.toFixed(2)], R: G.diff === 'easy' ? 4.5 : 3.5 } : {}; } },

    /* ② 최종 선발 — 그롱클: 걷기 → 볼 부풂(! · 예고) → 쏘기 → '휴…' 틈(여기서만 드래곤 풀 F) · 아스트리드는 그롱클이 걷거나 쉴 때만 다가가고 볼이 부풀면 멈칫 · 먼저 닿으면 기절 → 다시 */
    { id: '7-2', verb: 'approach', place: 'arena', time: 'day', goal: '아스트리드보다 먼저 그롱클을 진정시켜라', at: [15, 18], face: [0, -1], helmet: 1, limit: 110,
      hints: ['그롱클이 쏘고 "휴…" 할 때 가까이 가서 Space — 풀을 두 번', '! 가 뜨면 곧 쏴요 — X로 피하고, 쏜 다음이 기회'],
      *run(G) {
        for (const c of G.W.props) if (c.kind === 'cage') c.o.open = c.x === 8 ? 1 : 0;
        const crowd = CROWD.map(([w, x, y]) => G.cast.person(w, x, y, { dir: y < 3 ? 'down' : 'side', flip: x < 15 ? 1 : -1 }));
        const elder = G.cast.person('elder', 15, 1.6, { dir: 'down' }), dad = G.cast.person('stoick', 12.4, 1.7, { dir: 'down' });
        const ast = G.cast.person('astrid', 26, 17, { dir: 'side', flip: -1, spd: { easy: 1.1, normal: 1.1, hard: 1.5 }[G.diff], pose: { carry: 'axe' } });
        const D = G.cast.dragon('gronckle', 8, 7.4, { flip: 1, fear: 0.7, pose: { pupil: 0.3 } });
        D.st = 'walk'; D.t = 0; D.to = [9.5, 9.5]; D.spd = 2.2;
        const tell = TELL[G.diff], gapT = G.diff === 'easy' ? 2.4 : G.diff === 'hard' ? 1.4 : 1.8;
        const NEED = G.diff === 'easy' ? 1 : 2;
        let hits = 0, calm = false, early = -9, fed = 0;
        G.P.carry = 'shield'; G.flags.D = D; G.flags.ast = ast; G.flags.board = null;
        yield* talk(G, [['gobber', '최종 선발이다! 그롱클을 먼저 눕히는 사람이 1등!', ['shield']], ['astrid', '이번엔 내가 이겨.'], ['hiccup', '(도끼로 기절시키기 전에… 내가 먼저 진정시킬 거야.)', ['nip']]]);
        say(G, 'gobber', '내가 너만 할 땐 그롱클 스무 마리… 아니, 서른 마리를!', { secs: 2.4 });
        const hitMe = (s, ux, uy) => { if (hitsMe(G, s)) { if (knock(G, ux, uy, 0.7)) hits++; return true; } return false; };
        while (!calm) {
          const dt = yield; D.t += dt;
          const d = Math.hypot(G.P.x - D.x, G.P.y - D.y);
          if (D.st === 'walk') { faceTo(D, G.P.x, G.P.y); if (D.t > 1.6) { D.st = 'tell'; D.t = 0; sfx(G, 'cry_gronckle', D.x); } }
          else if (D.st === 'tell') {
            D.pose.tell = Math.min(1, D.t / (tell * 0.5)); bang(G, D, 2.2); faceTo(D, G.P.x, G.P.y);
            if (D.t > tell) {
              D.st = 'shot'; D.t = 0; D.pose.tell = 0; D.pose.mouth = 1;
              let ux = G.P.x - D.x, uy = G.P.y - D.y; const n = Math.hypot(ux, uy) || 1; ux /= n; uy /= n;
              shoot({ kind: 'lava', x: D.x + ux * 1.2, y: D.y + uy * 1.2, z: 0.8, vx: ux * 8, vy: uy * 8, g: 0, r: 0.32, life: 2.6, hit: (s) => hitMe(s, ux, uy) });
              sfx(G, 'fire', D.x);
            }
          } else if (D.st === 'shot') { if (D.t > 0.5) { D.st = 'gap'; D.t = 0; D.pose.mouth = 0; } }
          else if (D.st === 'gap') {
            D.pose.pupil = 0.85; G.marks.push({ k: 'text', x: D.x, y: D.y - 2.3, t: '휴…', s: 18 });
            if (d < 2.8) {
              G.fspots.push({ x: D.x, y: D.y + 0.6 });
              if (G.I.pressed.use && !(G.P.mashT > 0)) {
                fed++; if (fed >= NEED) { calm = true; break; }
                /* 첫 풀 — 냄새만 맡음(눈이 둥글어짐) · 다음 틈에 한 번 더 */
                D.fear = 0.45; G.W.prop('nip', D.x + 0.7, D.y + 0.5, {}); sfx(G, 'pop', D.x);
                say(G, 'hiccup', '(냄새를 맡았어! 다음 틈에 한 번 더.)', { secs: 1.6 });
                D.st = 'walk'; D.t = 0; D.pose.pupil = 0.5; D.to = [5 + G.rng() * 8, 7 + G.rng() * 6]; D.spd = 2.4;
              }
            }
            if (D.st === 'gap' && D.t > gapT) { D.st = 'walk'; D.t = 0; D.pose.pupil = 0.3; D.to = [5 + G.rng() * 8, 7 + G.rng() * 6]; D.spd = 2.4; }
          }
          /* 틈이 아닐 때 F = 서두름 → 그롱클이 놀라 한 걸음 물러남 */
          if (D.st !== 'gap' && d < 2.8 && G.I.pressed.use && G.t - early > 1.5) { early = G.t; D.to = [D.x + (D.x - G.P.x) / (d || 1) * 1.5, D.y + (D.y - G.P.y) / (d || 1) * 1.5]; D.spd = 3; say(G, 'hiccup', '(아직 아니야… 쏘고 난 다음에.)', { secs: 1.4 }); }
          /* 아스트리드 — 그롱클이 걷거나 쉴 때만 달려듦 · 볼이 부풀거나 쏘면 멈칫(몸을 낮춤) */
          if (D.st === 'walk' || D.st === 'gap') { ast.pose.crouch = 0; ast.to = [D.x + (ast.x > D.x ? 1.3 : -1.3), D.y + 0.3]; }
          else { ast.to = null; ast.pose.crouch = 1; G.marks.push({ k: 'text', x: ast.x, y: ast.y - 2.1, t: '멈칫', s: 15 }); }
          if (Math.hypot(ast.x - D.x, ast.y - D.y) < 1.7) {
            ast.to = null; ast.pose.crouch = 0; ast.pose.cheer = 1; D.pose.dizzy = 1; D.pose.tell = 0; D.st = 'down'; sfx(G, 'thud', D.x);
            G.hud.banner('아스트리드가 먼저 — 그롱클이 기절했다', 'x', 2.4);
            say(G, 'astrid', '내가 먼저야!', { secs: 1.4 });
            say(G, 'hiccup', '(기절시키면… 그을린 비늘뿐인데.)', { secs: 1.8 });
            yield* wait(2.2);
            return 'retry';
          }
          goal(G, D.x, D.y);
          if (NEED > 1) G.marks.push({ k: 'text', x: D.x, y: D.y - 3.0, t: fed ? '풀 ●○' : '풀 ○○', s: 15, c: '#3a6a3a' });
          if (hits >= 4 && G.diff !== 'easy') { say(G, 'gobber', '히컵, 그렇게 맞기만 하면 안 되지! 다시!'); yield* wait(1); return 'retry'; }
        }
        /* 진정 — 드래곤 풀에 뒹굴기 → 원로가 가리킴 → 관중석이 들썩 */
        D.pose.roll = 1; D.pose.tell = 0; D.pose.pupil = 1; D.to = null; D.st = 'calm';
        G.W.prop('nip', D.x - 0.6, D.y + 0.4, {}); sfx(G, 'purr', D.x);
        ast.to = null; ast.pose.crouch = 0; faceTo(ast, D.x, D.y);
        goal(G, null);
        say(G, 'astrid', '…뭐야, 지금?', { secs: 1.6 });
        yield* wait(1.2);
        G.camOpt = { fixX: 15, fixY: 6 };
        yield* wait(0.9);
        elder.pose.hand = 1; faceTo(elder, G.P.x, G.P.y);
        for (const c of crowd) c.pose.cheer = 1;
        dad.pose.cheer = 1; sfx(G, 'ok');
        G.hud.banner('원로가 히컵을 골랐다 — 관중석이 들썩!', 'heart', 3);
        say(G, 'gobber', '우리 히컵이! 내가 가르쳤지, 암!', { secs: 2 });
        for (let t = 0; t < 2.8; t += yield) for (let i = 0; i < crowd.length; i += 2) G.marks.push({ k: 'text', x: crowd[i].x, y: crowd[i].y - 2.2, t: '와아!', s: 16 });
        G.camOpt = {};
        yield* talk(G, [['gobber', '1등은 히컵! 내일 마지막 시험은 히컵이 치른다!'], ['stoick', '봤느냐! 저게 내 아들이다!', ['heart']]]);
        /* 게시판 — 웃음이 사라짐 */
        const board = G.W.prop('board', 11.2, 19.3, {}); G.flags.board = [board.x, board.y];
        goal(G, board.x, board.y, { h: 1.8 });
        say(G, 'hiccup', '(문 옆 게시판에 뭐가 붙었네…)', { secs: 1.8 });
        yield* until(() => near(G, board.x, board.y + 0.5, 1.8));
        goal(G, null);
        for (const c of crowd) c.pose.cheer = 0;
        dad.pose.cheer = 0;
        G.hud.banner('마지막 시험 — 내일, 마을 모두 앞에서 나이트메어를 처치한다', 'x', 3.6);
        yield* talk(G, [['hiccup', '(1등은 내일… 모두 앞에서 나이트메어를 처치한다고?)', ['x']], ['hiccup', '(처치…? 내가? 이제 드래곤은 못 해쳐.)']]);
        yield* wait(0.8);
        return true;
      },
      sense: (G) => { const D = G.flags.D, a = G.flags.ast; return { D: D ? { x: +D.x.toFixed(2), y: +D.y.toFixed(2), st: D.st } : null, ast: a ? [+a.x.toFixed(2), +a.y.toFixed(2)] : null, board: G.flags.board }; } },

    /* ③ 해 질 녘 몰래 떠나기 — 큰길(울타리로 막힌 골목)을 동 → 서로 · 마을 사람 셋: 딴 데 봄 → 돌아봄 예고(! · 점선 부채꼴) → 길을 봄(부채꼴 안 = 들킴)
       통 곁(1.15m)에서 X 꾹(살금살금)이면 숨음 · 들키면 "히컵, 어디 가니?" → 지난 통 곁으로 · 세 번(쉬움 다섯) 들키면 다시 */
    { id: '7-3', verb: 'sneak', place: 'village', time: 'sunset', goal: '짐을 들고 몰래 마을을 빠져나가라', at: [57.5, 18], face: [-1, 0], helmet: 1, limit: 110,
      hints: ['부채꼴 눈길에 들면 들켜요 — 달리면 발소리에 돌아봐요', '통 곁에서 X를 꾹(살금살금) 누르면 숨어요 — 눈길이 딴 데로 가면 걸어서 지나가요'],
      *run(G) {
        G.P.carry = 'bag';
        /* 골목 — 집 사이 틈 · 길 남쪽을 울타리로(길 찾기 X · 길은 하나) */
        for (const [x, len] of [[13, 2], [23, 6], [29, 6], [35, 6], [45, 2], [55, 6], [61, 6]]) G.W.prop('fence', x, 16.6, { len });
        for (let x = 9; x <= 57; x += 6) G.W.prop('fence', x, 20.5, { len: 6 });
        G.W.prop('fence', 62, 20.5, { len: 4 });
        const tell = TELL[G.diff], AWAY = G.diff === 'easy' ? 3.4 : 2.8, LOOK = G.diff === 'easy' ? 2.8 : 3.4, RR = 7.2, HALF = 0.5, LIM = G.diff === 'easy' ? 5 : 3;
        const ws = [[48.5, 'villager2', 'street', 0.6], [37, 'villager', 'away', 0], [25.5, 'villager2', 'street', 1], [14, 'villager', 'tell', 0.5]].map(([x, who, ph, t]) => {
          const p = G.cast.person(who, x, 19.8, { dir: ph === 'away' ? 'down' : 'side', flip: 1 });
          return { p, x, y: 19.8, ph, t, R: RR, a: ph === 'street' ? -0.25 : Math.PI / 2, said: 0, heard: 0 };
        });
        const covers = ws.map((w) => { const b = G.W.prop('barrel', w.x + 4.2, 17.25, {}); return [b.x, b.y]; });
        let cp = [57.5, 18], spots = 0, grace = 0;
        G.flags.ws = ws; G.flags.covers = covers; G.flags.spots = 0;
        G.drawUnder = (ctx, V) => {
          for (const w of ws) {
            if (!V.onScreen(w.x, w.y, 9)) continue;
            const cx = V.sx(w.x), cy = V.sy(w.y), r = w.R * V.S;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, w.a - HALF, w.a + HALF); ctx.closePath();
            ctx.fillStyle = w.ph === 'street' ? 'rgba(200,68,46,.30)' : 'rgba(246,226,150,.20)'; ctx.fill();
            if (w.ph === 'tell') {      /* 곧 볼 자리 — 점선 */
              ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -0.25 - HALF, -0.25 + HALF); ctx.closePath();
              ctx.fillStyle = 'rgba(200,68,46,' + (0.05 + 0.12 * Math.min(1, w.t / tell)).toFixed(2) + ')'; ctx.fill();
              ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(168,62,30,.8)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
            }
          }
        };
        yield* talk(G, [['hiccup', '(내일 나이트메어를 처치할 순 없어.)'], ['hiccup', '(투슬리스랑 같이 떠나자. 아무한테도 들키면 안 돼.)', ['map']]]);
        while (true) {
          const dt = yield; const P = G.P;
          grace -= dt;
          /* 눈길 차례 — 딴 데 → 돌아봄 예고 → 길 · 달리는 발소리(10m 안)엔 딴 데 보던 사람도 돌아보기 시작 */
          const running = G.I.down.run && Math.hypot(P.vx, P.vy) > 5;
          for (const w of ws) {
            w.t += dt;
            if (running && w.ph === 'away' && Math.abs(P.x - w.x) < 10) { w.ph = 'tell'; w.t = 0; w.heard = 1.2; }
            if (w.heard > 0) { w.heard -= dt; G.marks.push({ k: 'text', x: w.x, y: w.y - 3.3, t: '발소리?', s: 15 }); }
            if (w.ph === 'away') { w.a = Math.PI / 2; w.p.dir = 'down'; if (w.t > AWAY) { w.ph = 'tell'; w.t = 0; } }
            else if (w.ph === 'tell') { w.p.dir = 'side'; w.p.flip = 1; bang(G, w.p, 2.3); if (w.t > tell) { w.ph = 'street'; w.t = 0; w.a = -0.25; } }
            else if (w.t > LOOK) { w.ph = 'away'; w.t = 0; }
            if (w.said > 0) { w.said -= dt; G.marks.push({ k: 'text', x: w.x, y: w.y - 2.4, t: '히컵, 어디 가니?', s: 17 }); }
          }
          /* 통 곁 = 지난 자리 · 숨음 */
          let hidden = false;
          for (const c of covers) { const dc = Math.hypot(P.x - c[0], P.y - c[1]); if (dc < 1.15) { cp = [c[0], c[1] + 0.65]; if (P.crouch > 0.5) hidden = true; } }
          G.flags.hidden = hidden;
          if (hidden) G.marks.push({ k: 'text', x: P.x, y: P.y - 2.1, t: '숨음', s: 15, c: '#3a6a3a' });
          if (grace <= 0 && !hidden) for (const w of ws) {
            if (w.ph !== 'street') continue;
            const dx = P.x - w.x, dy = P.y - w.y, dd = Math.hypot(dx, dy);
            if (dd > w.R || dd < 0.2) continue;
            let da = Math.atan2(dy, dx) - w.a; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
            if (Math.abs(da) > HALF) continue;
            /* 들킴 — 지난 통 곁으로(숨은 채) */
            spots++; G.flags.spots = spots; w.said = 1.8; grace = 1.4; sfx(G, 'pop', w.x);
            P.x = cp[0]; P.y = cp[1]; P.vx = P.vy = 0; P.sneak = true; P.crouch = 1;
            say(G, 'hiccup', ['(헉!) 산책이요, 산책!', '(으…) 짐이요? 빨래예요!', '(또…) 그냥 바람 쐬러요!'][(spots - 1) % 3], { secs: 1.6 });
            if (spots >= LIM) { yield* wait(1); return 'retry'; }
            break;
          }
          goal(G, 2.5, 18);
          if (P.x < 4) break;
        }
        goal(G, null);
        G.hud.banner('마을을 빠져나왔다 — 숨은 호수로', 'map', 2.6);
        yield* talk(G, [['hiccup', '(숨은 호수로 가자. 이제 투슬리스랑 둘이서…)']]);
        yield* wait(0.6);
        return true;
      },
      sense: (G) => ({ ws: (G.flags.ws || []).map((w) => ({ x: w.x, y: w.y, ph: w.ph, R: w.R })), covers: G.flags.covers, spots: G.flags.spots, hidden: !!G.flags.hidden }) },
  ],
};
