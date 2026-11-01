// 9장 마지막 시험(#21~23 · design §2 · 탑뷰) — 모두 앞 나이트메어(볼 때 무기 → 투구 → 살금살금 → 손 내밀기) → 아빠가 철창을 쾅(예고) → 20초 버티기
// → 투슬리스가 그물 지붕으로(그림자가 커지는 예고) → 둘 사이에 서서 손 내밀기 3초 → 바이킹들이 붙잡음(내 탓 X) → 큰 회관(말로 하는 설득 실패 · '이제 넌 우리 편이 아니다'까지만)
// → 선착장(앞배가 안개로 · 아빠가 한 번 돌아봄 · 아스트리드) → 우리 문을 열고 친구 넷을 드래곤과 잇기(성격마다 다른 수) → 다섯 드래곤이 솟아오름 · 슬픈 셋(회관·선착장·아스트리드)은 합쳐 90초 안
import { say, wait, until, goal, useAt, near, talking, hitsMe, knock, bang, sfx, shoot, FX, burst, puff, faceTo } from './kit.js?v=1';
import { mindStep } from '../play/actors.js?v=1';

const TELL = { easy: 3, normal: 2.5, hard: 2 };
const CROWD = [['villager', 5.5, 1.7], ['villager2', 9.5, 1.6], ['gobber', 19.5, 1.7], ['villager', 23.5, 1.6], ['villager2', 26.5, 1.7], ['villager', 1.0, 9], ['villager2', 1.0, 14], ['villager2', 29, 8], ['villager', 29, 13.5]];
const stands = (G) => CROWD.map(([w, x, y]) => G.cast.person(w, x, y, { dir: y < 3 ? 'down' : 'side', flip: x < 15 ? 1 : -1 }));
const zones = (G) => { for (const s of FX.shots) if (s.zone) G.marks.push({ k: 'zone', x: s.zone[0], y: s.zone[1], r: 1.2 }); };
/* 불 줄 — 나이트메어 앞에서 히컵 쪽으로 · 길 가득(점프로 넘음) */
function fireLine(G, D, onHit) {
  const P = G.P, dx = P.x - D.x, dy = P.y - D.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  for (let i = -4; i <= 4; i++) shoot({ kind: 'fire', x: D.x + ux * 1.5 - uy * i * 0.55, y: D.y + uy * 1.5 + ux * i * 0.55, z: 0.25, vx: ux * 8, vy: uy * 8, g: 0, r: 0.3, life: 2.2, noWall: true, hit: (q) => hitsMe(G, q, { low: 0.6 }) && onHit(q, ux, uy) });
  sfx(G, 'fire', D.x);
}
/* 불덩이 — 떨어질 자리에 붉은 고리(밖으로 비키기) */
function lob(G, x0, y0, tx, ty, onHit, T = 1.0, z0 = 1.4) {
  const P = G.P;
  const q = shoot({ kind: 'lava', x: x0, y: y0, z: z0, vx: (tx - x0) / T, vy: (ty - y0) / T, vz: 4.9 * T - z0 / T, g: 9.8, r: 0.5, life: T + 1, noWall: true,
    land: (s) => { burst('ember', s.x, s.y, 0.1, 8, 3, 0.6, 0.12, G.rng); if (Math.hypot(P.x - s.x, (P.y - s.y) * 1.3) < 1.3 && !P.dodge) onHit(s, (P.x - s.x) || 0.01, P.y - s.y); } });
  q.zone = [tx, ty];
  return q;
}
/* 놀라 물러남 — 나에게서 멀어지는 쪽으로 */
function backoff(D, P, m) { const dx = D.x - P.x, dy = D.y - P.y, d = Math.hypot(dx, dy) || 1; D.to = [Math.max(3, Math.min(27, D.x + dx / d * m)), Math.max(6, Math.min(18, D.y + dy / d * m))]; D.spd = 3; }

export const chapter = {
  id: 9, title: '마지막 시험', sub: '마을 모두가 보는 앞에서', place: 'arena', time: 'day',
  howto: { '9-4': 'give' },
  end: '열린 우리 문 — 친구 넷이 드래곤에 올라탔다',
  steps: [
    /* ① 모두 앞 나이트메어 — 나를 볼 때(노란 점) F = 무기 내려놓기 → 한 번 더 F = 투구 벗기 → C 살금살금 → F 꾹(고개 돌려 손 내밀기 · 믿음) · 서두르면 불(! 예고 → 점프) · 세 번 맞으면 다시 */
    { id: '9-1', verb: 'give', goal: '모두 앞에서 나이트메어와 친구가 되어라', at: [15, 18.4], face: [0, -1], helmet: 1, limit: 110, zoom: 0.85,
      hints: ['나이트메어가 나를 볼 때 F — 무기를, 다음에 또 볼 때 F — 투구를', 'C로 살금살금 다가가 F를 꾹 — 고개 돌려 손 내밀기'],
      *run(G) {
        G.camOpt = { focus: [15, 7.5] };
        for (const c of G.W.props) if (c.kind === 'cage') c.o.open = c.x === 15 ? 1 : 0;
        const cr = stands(G);
        G.cast.person('elder', 15, 1.6, { dir: 'down' }); G.cast.person('stoick', 12.4, 1.7, { dir: 'down' }); G.cast.person('astrid', 17.4, 1.7, { dir: 'down' });
        const D = G.cast.dragon('nightmare', 15, 5.4, { flip: 1, fear: 0.75, pose: { pupil: 0.25 } }); D.to = [15, 8.4]; D.spd = 2; D.look = 0;
        const tell = TELL[G.diff], easy = G.diff === 'easy';
        let ph = 'weapon', lookT = 1.6, lastF = -9, dropT = -9, hits = 0, fire = null, ft = 0, helm = null, lookN = 0, dropN = -1;
        G.P.carry = 'knife';
        G.flags.D = D; G.flags.ph = ph;
        G.drawUnder = (ctx, V) => {
          if (!helm) return;
          const x = V.sx(helm[0]), y = V.sy(helm[1]), s = V.S;
          ctx.lineWidth = 0.035 * s; ctx.strokeStyle = '#2b2118'; ctx.fillStyle = '#8d8a82';
          ctx.beginPath(); ctx.ellipse(x, y - 0.12 * s, 0.32 * s, 0.2 * s, 0, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#eee2c6';
          for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + k * 0.28 * s, y - 0.18 * s); ctx.quadraticCurveTo(x + k * 0.52 * s, y - 0.3 * s, x + k * 0.48 * s, y - 0.5 * s); ctx.lineTo(x + k * 0.36 * s, y - 0.22 * s); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        };
        say(G, 'gobber', '히컵의 마지막 시험이다! 모두 조용!');
        say(G, 'hiccup', '(할 수 있어… 해야 돼.)', { secs: 1.8 });
        const onHit = (q, ux, uy) => { if (knock(G, ux, uy, 0.8)) hits++; return true; };
        while (true) {
          const dt = yield; const P = G.P;
          const d = Math.hypot(D.x - P.x, D.y - P.y);
          zones(G);
          /* 서두름 → 불(예고 2~3초 → 불 줄) */
          if (fire) {
            ft += dt; P.lock = false; P.handLock = 0; P.look = 0;
            if (fire === 'tell') { D.pose.tell = Math.min(1, ft / (tell * 0.6)); D.pose.glow = 1; bang(G, D, 3.4); faceTo(D, P.x, P.y); if (ft > tell) { fire = 'go'; ft = 0; fireLine(G, D, onHit); D.pose.mouth = 0.8; } }
            else if (ft > 1.3) { fire = null; D.pose.tell = 0; D.pose.glow = 0; D.pose.mouth = 0; D.fear = 0.6; }
            G.flags.fire = !!fire;
            if (hits >= 3 && !easy) { say(G, 'hiccup', '(서두르면 안 돼… 처음부터 천천히.)'); yield* wait(1); return 'retry'; }
            continue;
          }
          G.flags.fire = false;
          /* 바라보기 — 앞의 둘(무기·투구)은 보다 말다 · 노란 점 = 나를 봄 */
          if (ph !== 'near') { lookT -= dt; if (lookT <= 0) { D.look = D.look ? 0 : 1; lookT = D.look ? 3 : 2.4; if (D.look) lookN++; } } else D.look = 1;
          if (!D.to) { if (D.look) { faceTo(D, P.x, P.y); if (ph !== 'near') G.marks.push({ k: 'dot', x: D.x, y: D.y - 3.7, r: 6, c: '#e6c464' }); } else D.flip = P.x > D.x ? -1 : 1; }
          G.flags.look = D.look;
          if (ph === 'weapon' || ph === 'helmet') {
            if (mindStep(D, P, dt, { fastV: 2.6, near: 5, calmK: 0.1, minFear: 0.5 })) { fire = 'tell'; ft = 0; sfx(G, 'cry_nightmare', D.x); continue; }
            D.pupilTo = D.look && d < 12 ? 0.15 : 0.35;
            goal(G, D.x, D.y + 7.2, { h: 1.2 });
            if (G.I.pressed.use && G.t - lastF > 0.6) {
              lastF = G.t;
              if (P.mashT > 0) say(G, 'hiccup', '(마구 누르면 놀라… 천천히.)', { secs: 1.4 });
              else if (D.look && d < 11.5) {
                if (ph === 'weapon') { ph = 'helmet'; dropT = G.t; dropN = lookN; P.carry = null; G.W.prop('_knife', P.x + 0.7, P.y + 0.3, {}); sfx(G, 'clang', P.x); D.fear = 0.55; say(G, 'hiccup', '봐, 칼은 필요 없어.', { secs: 1.6 }); for (let i = 0; i < cr.length; i += 3) cr[i].pose.hand = 1; }
                else if (lookN === dropN) say(G, 'hiccup', '(한 번 고개를 돌렸다가 다시 볼 때…)', { secs: 1.4 });
                else if (G.t - dropT > 0.8) { ph = 'near'; P.helmet = 0; helm = [P.x - 0.8, P.y + 0.4]; sfx(G, 'clang', P.x); D.fear = 0.5; D.pupilTo = null; say(G, 'hiccup', '투구도 벗을게. 난 너를 해치러 온 게 아니야.'); say(G, 'stoick', '히컵?!', { secs: 1.2 }); }
              } else if (d < 14) say(G, 'hiccup', '(나를 볼 때 해야 해.)', { secs: 1.4 });
            }
          } else {
            const on = G.I.down.use && !P.air; P.handLock = on ? 1 : 0; P.look = on ? -1 : 0; P.lock = on;
            if (mindStep(D, P, dt, { fastV: 2.3, near: 5, calmK: 0.16, minFear: 0, handR: 3.6, trustK: easy ? 0.38 : 0.22 })) { fire = 'tell'; ft = 0; sfx(G, 'cry_nightmare', D.x); continue; }
            if (!on && D.trust > 0) D.trust = Math.max(0, D.trust - dt * 0.3);
            goal(G, D.x, D.y + 2.5, { h: 1.6 });
            if (d < 4.6) G.fspots.push({ x: P.x, y: P.y, label: 'F꾹' });
            if (on && D.trust >= 1 && d < 4) break;
          }
          G.flags.ph = ph; G.flags.fear = D.fear; G.flags.trust = D.trust;
        }
        /* 코가 손에 — 마을이 숨을 죽임 */
        goal(G, null);
        D.to = [G.P.x + (D.x < G.P.x ? -2.4 : 2.4), G.P.y - 0.5]; D.spd = 0.8;
        yield* until(() => !D.to, 3);
        faceTo(D, G.P.x, G.P.y); D.pose.pupil = 1; sfx(G, 'purr', D.x);
        for (const c of cr) c.pose.hand = 0;
        G.hud.banner('나이트메어가 코를 댔다 — 마을이 숨을 죽였다', 'hand', 3);
        say(G, 'hiccup', '봐요. 드래곤은 우리가 알던 그런 게 아니에요.');
        yield* wait(2.4);
        G.P.lock = false; G.P.handLock = 0; G.P.look = 0;
        return true;
      },
      sense: (G) => { const D = G.flags.D; return D ? { ph: G.flags.ph, look: D.look, fear: +D.fear.toFixed(2), trust: +D.trust.toFixed(2), fire: !!G.flags.fire, D: [+D.x.toFixed(2), +D.y.toFixed(2)] } : {}; } },

    /* ② 아빠가 망치를 듦(! · 몸짓 예고) → 철창 쾅 → 나이트메어 몸에 불 → 20초 버티기 · 불 줄 = 점프 · 불덩이 = 붉은 고리 밖 · 세 번 맞으면 다시(쉬움은 안 넘어지고 계속) */
    { id: '9-2', verb: 'dodge', goal: '투슬리스가 올 때까지 버텨라', at: [15, 11.6], face: [0, -1], helmet: 0, limit: 60, zoom: 0.8,
      hints: ['! 가 뜨면 곧 불 — 불 줄은 Space로 넘고, 붉은 고리는 밖으로', '나이트메어 바로 앞에 서 있지 말고 옆으로 돌아요'],
      *run(G) {
        G.camOpt = { focus: [15, 7] };
        for (const c of G.W.props) if (c.kind === 'cage') c.o.open = c.x === 15 ? 1 : 0;
        stands(G);
        const dad = G.cast.person('stoick', 5.6, 5.4, { dir: 'side', flip: 1, pose: { carry: 'hammer' } });
        const D = G.cast.dragon('nightmare', 15, 8.6, { flip: 1, fear: 0.1, pose: { pupil: 0.9 } });
        const tell = TELL[G.diff], DUR = 20;
        let T = 0, hits = 0, a = 0, ph = 'tell', pt = 0, kind = 'line', bangT = 0;
        G.flags.T = 0;
        say(G, 'stoick', '그만둬라!', { secs: 1.4 });
        /* 예고 — 아빠가 망치를 높이 듦(소리가 꺼져 있어도 보이게 ! ) */
        for (let t = 0; t < tell; t += yield) { dad.pose.cheer = 1; bang(G, dad, 2.6); }
        dad.pose.cheer = 0; bangT = 1.2; sfx(G, 'clang', 8); burst('spark', 8, 4, 1.2, 8, 3, 0.4, 0.1, G.rng);
        D.pose.glow = 1; D.pose.pupil = 0.1; D.fear = 1; D.pupilTo = 0.08; sfx(G, 'roar', D.x);
        say(G, 'hiccup', '아빠, 안 돼요!', { secs: 1.4 });
        const onHit = (q, ux, uy) => { if (knock(G, ux, uy, 0.85)) hits++; return true; };
        G.drawOver = (ctx, V) => {
          V.reset(); const s = V.H / 768, w = 300 * s, h = 16 * s, x = V.W / 2 - w / 2, y = 70 * s;
          ctx.fillStyle = '#f4ead2'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#5a7a9a'; ctx.fillRect(x, y, w * Math.min(1, T / DUR), h);
          ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 2 * s; ctx.strokeRect(x, y, w, h);
          ctx.font = `700 ${Math.round(14 * s)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#2b2118'; ctx.fillText('투슬리스가 오기까지', V.W / 2, y - 3 * s);
        };
        while (T < DUR) {
          const dt = yield; T += dt; pt += dt; G.flags.T = T;
          zones(G);
          if (bangT > 0) { bangT -= dt; G.marks.push({ k: 'text', x: 8, y: 2.3, t: '쾅!', s: 30, c: '#a83e1e' }); }
          if (G.rng() < dt * 5) burst('ember', D.x + (G.rng() - 0.5) * 3, D.y, 1.4, 1, 1, 0.6, 0.12, G.rng);
          if (ph === 'move') { faceTo(D, G.P.x, G.P.y); if (pt > 0.4 && !D.to) { ph = 'tell'; pt = 0; } }
          else if (ph === 'tell') {
            if (pt === dt) { kind = a % 2 ? 'ball' : 'line'; a++; sfx(G, 'cry_nightmare', D.x); }
            D.pose.tell = Math.min(1, pt / (tell * 0.6)); bang(G, D, 3.4); faceTo(D, G.P.x, G.P.y);
            if (pt > tell) {
              ph = 'fire'; pt = 0; D.pose.mouth = 0.8;
              if (kind === 'line') fireLine(G, D, onHit);
              else { lob(G, D.x, D.y - 0.4, G.P.x, G.P.y, onHit); if (G.diff !== 'easy') lob(G, D.x, D.y - 0.4, G.P.x + (G.rng() < 0.5 ? -2.6 : 2.6), G.P.y + 0.8, onHit, 1.15); sfx(G, 'fire', D.x); }
            }
          } else if (pt > 1.0) { ph = 'move'; pt = 0; D.pose.mouth = 0; D.pose.tell = 0; D.to = [Math.max(8, Math.min(22, D.x + (G.rng() - 0.5) * 6)), 6.5 + G.rng() * 3]; D.spd = 3; }
          if (hits >= 3 && G.diff !== 'easy') { say(G, 'hiccup', '으… 세 번이나 맞았어. 다시!'); yield* wait(1); return 'retry'; }
        }
        sfx(G, 'whistle'); G.hud.banner('저 소리… 나이트 퓨리!', 'eye', 2);
        yield* wait(0.8);
        return true;
      },
      sense: (G) => ({ T: +(G.flags.T || 0).toFixed(1) }) },

    /* ③ 투슬리스가 그물 지붕으로 — 그림자가 커지는 예고(! · 깜짝 X) → 아빠와 투슬리스가 천천히 맴돎 · 둘 사이 고리 안에서 F 꾹 3초(고리를 벗어나면 처음부터 · 고리가 움직이니 따라가야)
       → 투슬리스가 멈춤 → 아빠가 미리 부른 바이킹들이 붙잡음(내 탓 X) */
    { id: '9-3', verb: 'between', goal: '투슬리스와 아빠 사이에 서라', at: [15, 13.5], face: [0, -1], helmet: 0, limit: 90, zoom: 0.8,
      hints: ['둘 사이 고리 안에 서서 F를 꾹', '둘이 움직이면 고리도 움직여요 — F를 누른 채 따라가요'],
      *run(G) {
        G.camOpt = { focus: [15, 11] };
        stands(G);
        const D = G.cast.dragon('nightmare', 15, 7.6, { flip: 1, fear: 0.9, pose: { pupil: 0.15, glow: 1 } });
        const tell = TELL[G.diff], ZR = { easy: 1.35, normal: 1.0, hard: 0.85 }[G.diff];
        let sh = 0;
        G.drawUnder = (ctx, V) => { if (sh <= 0) return; ctx.fillStyle = 'rgba(30,24,20,' + (0.12 + 0.22 * sh).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(V.sx(12.5), V.sy(11), (0.5 + 2.1 * sh) * V.S, (0.25 + 0.95 * sh) * V.S, 0, 0, 7); ctx.fill(); };
        say(G, 'hiccup', '저 그림자… 투슬리스?!', { secs: 1.8 });
        for (let t = 0; t < tell + 0.5; t += yield) { sh = Math.min(1, t / (tell + 0.5)); bang(G, { x: 12.5, y: 11, z: 0 }, 1.4); }
        sh = 0;
        const net = G.W.findProp('net_roof'); if (net) net.hide = true;
        const T = G.cast.dragon('toothless', 12.5, 11, { z: 6, flip: 1, fear: 0.9, pose: { pupil: 0.15, wing: 1 } });
        for (let t = 0; t < 0.6; t += yield) T.z = Math.max(0, 6 - t * 10);
        T.z = 0; T.pose.wing = 0; burst('dust', 12.5, 11, 0.3, 14, 3, 0.7, 0.4, G.rng); sfx(G, 'boom', 12.5); sfx(G, 'roar', 12.5);
        D.to = [15, 4.8]; D.spd = 4;
        const dad = G.cast.person('stoick', 3.4, 12.5, { dir: 'side', flip: 1, spd: 5, pose: { carry: 'hammer' } }); dad.to = [8, 12.5];
        say(G, 'stoick', '나이트 퓨리다! 모두 내려와라!', { secs: 1.8 });
        yield* until(() => !dad.to, 3);
        D.hide = true;
        const loop = [[9.5, 16], [15, 17.2], [20.5, 15], [21, 10.5], [16, 8.8], [9.5, 10.5]];
        let li = 0, hold = 0;
        dad.spd = 0.95; T.spd = 1.05;
        G.flags.zone = null; G.flags.hold = 0;
        while (hold < 3) {
          const dt = yield; const P = G.P;
          if (!dad.to) { dad.to = loop[li]; li = (li + 1) % loop.length; }
          const dx = dad.x - T.x, dy = dad.y - T.y, dd = Math.hypot(dx, dy) || 1;
          if (dd > 4.2) T.to = [dad.x - dx / dd * 4, dad.y - dy / dd * 4]; else { T.to = null; faceTo(T, dad.x, dad.y); }
          T.pose.pupil = 0.15; T.pose.ears = -1;
          if (G.rng() < dt * 0.5) sfx(G, 'growl', T.x);
          const zx = (dad.x + T.x) / 2, zy = (dad.y + T.y) / 2;
          const inZ = Math.hypot(P.x - zx, (P.y - zy) * 1.25) < ZR;
          const on = G.I.down.use && !(P.mashT > 0);
          P.handLock = on ? 1 : 0; P.look = on ? -1 : 0;
          if (inZ && on) hold += dt; else hold = Math.max(0, hold - dt * (G.diff === 'easy' ? 1.5 : 5));
          G.marks.push({ k: 'ring', x: zx, y: zy, r: ZR, c: inZ ? '#3a6a3a' : '#e6c464' });
          G.fspots.push({ x: zx, y: zy, label: 'F꾹' });
          if (hold > 0.05) G.marks.push({ k: 'text', x: P.x, y: P.y - 2.3, t: String(Math.ceil(3 - hold)), s: 24, c: '#3a6a3a' });
          goal(G, zx, zy, { h: 1.2 });
          G.flags.zone = [+zx.toFixed(2), +zy.toFixed(2), ZR]; G.flags.hold = hold;
        }
        /* 멈춤 → 붙잡힘 */
        goal(G, null); T.to = null; dad.to = null; T.pose.sit = 1; T.pose.pupil = 1; T.pose.ears = 0; T.fear = 0; sfx(G, 'purr', T.x);
        G.hud.banner('투슬리스가 멈췄다', 'hand', 2);
        say(G, 'hiccup', '투슬리스, 괜찮아. 아빠도… 괜찮아요.', { secs: 2 });
        yield* wait(1.6);
        const around = [[-1.6, -0.6], [1.6, -0.6], [-1.4, 0.8], [1.4, 0.8]];
        const vk = [[13.6, 21], [16.4, 21], [12, 21.5], [18, 21.5]].map(([x, y], i) => { const v = G.cast.person(i % 2 ? 'villager2' : 'villager', x, y, { dir: 'up', spd: 5 }); v.to = [T.x + around[i][0], T.y + around[i][1]]; return v; });
        say(G, 'stoick', '붙잡아라!', { secs: 1.2 });
        say(G, 'hiccup', '안 돼요! 투슬리스는 멈췄잖아요!', { secs: 2 });
        yield* until(() => vk.every((v) => !v.to), 4);
        T.pose.sit = 0; T.pose.pupil = 0.1; T.pose.ears = -1;
        G.hud.banner('바이킹들이 투슬리스를 붙잡았다', 'x', 2.6);
        G.P.handLock = 0; G.P.look = 0;
        yield* wait(2.2);
        return true;
      },
      sense: (G) => ({ zone: G.flags.zone, hold: +(G.flags.hold || 0).toFixed(2) }) },

    /* ④ 큰 회관 — 책 둥지 쪽을 보여 줌(F) → 아빠는 '둥지'만 붙잡음 → 한 번 더 설득(F) → 말실수 → '이제 넌 우리 편이 아니다'까지만 · 등을 돌려 나감 */
    { id: '9-4', verb: 'listen', place: 'hall', time: 'day', goal: '아빠에게 책을 보여 줘라', at: [15, 15.4], face: [0, -1], helmet: 0, limit: 80,
      hints: ['아빠(▼) 앞에서 F — 책을 보여 줘요', '아빠 말이 끝나면 한 번 더 F'],
      *run(G) {
        const dad = G.cast.person('stoick', 15, 12.2, { dir: 'up' });
        G.P.carry = 'book'; G.flags.ph = 'show'; G.flags.dad = [15, 12.2];
        say(G, 'hiccup', '(아빠한테 둥지 쪽을 보여 드리자. 대장만 나쁘다고.)', { icons: ['book'] });
        goal(G, dad.x, dad.y, { h: 2.6 });
        yield* until(() => useAt(G, dad.x, dad.y + 0.8, 1.8) && !(G.P.mashT > 0));
        goal(G, null); faceTo(dad, G.P.x, G.P.y); G.flags.ph = 'talk';
        G.hud.banner('드래곤 책 · 둥지(내가 쓴 쪽) — 대장만 나쁘다', 'book', 3);
        say(G, 'hiccup', '아빠, 이것 좀 봐요. 둥지 드래곤들은 먹이를 바치는 거예요.');
        say(G, 'hiccup', '진짜 나쁜 건 구멍 속 대장 하나뿐이라고요!');
        say(G, 'stoick', '둥지…? 너, 둥지에 갔었냐?');
        yield* until(() => !talking(G), 20);
        G.flags.ph = 'again'; G.hud.goal('아빠를 한 번 더 설득해라');
        goal(G, dad.x, dad.y, { h: 2.6 });
        yield* until(() => useAt(G, dad.x, dad.y + 0.8, 1.8) && !(G.P.mashT > 0));
        goal(G, null); G.flags.ph = 'talk';
        say(G, 'hiccup', '그게 중요한 게 아니라요, 드래곤들은 싸우기 싫어해요!');
        say(G, 'stoick', '몇 대째 찾던 곳이다. 어떻게 갔지?');
        say(G, 'hiccup', '(안 돼…) 그 섬은 드래곤만 찾아요. 아, 아니…');
        say(G, 'stoick', '드래곤만 찾는다… 그렇군.', { secs: 2.2 });
        say(G, 'stoick', '이제 넌 우리 편이 아니다.', { secs: 2.6 });
        yield* until(() => !talking(G), 30);
        dad.to = [17.2, 17.6]; dad.spd = 2.6;
        say(G, 'hiccup', '아빠…', { secs: 1.6 });
        yield* until(() => !dad.to, 5);
        dad.hide = true;
        yield* wait(0.6);
        return true;
      },
      sense: (G) => ({ ph: G.flags.ph, dad: G.flags.dad }) },

    /* ⑤ (이음) 선착장 — 사슬에 묶인 투슬리스를 실은 앞배가 안개로 · 아빠가 한 번 돌아봄 · 아스트리드 "왜 안 죽였어?" → 그림 → 훈련장으로 걷기 */
    { id: '9-5', place: 'dock', time: 'fog', goal: '훈련장으로 가라', at: [20, 25.2], face: [0, 1], helmet: 0, limit: 60,
      *run(G) {
        G.camOpt = { fixX: 22, fixY: 21 };
        const ship = G.W.findProp('ship', 30, 22), ship2 = G.W.prop('ship', 9, 23.5, { w: 9, d: 3, nobox: 1 });
        const T = G.cast.dragon('toothless', ship.x + 1.6, ship.y - 0.3, { flip: 1, z: 0.9, ySort: 0.6, fear: 1, pupilTo: 0.12, pose: { pupil: 0.12, ears: -1 } });
        const dad = G.cast.person('stoick', ship.x - 2.6, ship.y - 0.2, { dir: 'down', z: 0.9, ySort: 0.6 });
        const vk = G.cast.person('villager', ship2.x, ship2.y - 0.2, { dir: 'down', z: 0.9, ySort: 0.6 });
        const mv = [[ship, 0.5, 1.3, [T, dad]], [ship2, -0.2, 1.2, [vk]]];
        say(G, 'hiccup', '(투슬리스…)', { secs: 2.2 });
        for (let t = 0; t < 7.5; ) {
          const dt = yield; t += dt;
          for (const [p, vx, vy, kids] of mv) { p.x += vx * dt; p.y += vy * dt; for (const k of kids) { k.x += vx * dt; k.y += vy * dt; } }
          if (t > 2.6 && t < 4.4) { dad.dir = 'up'; G.marks.push({ k: 'text', x: dad.x, y: dad.y - 3.1, t: '…', s: 22 }); } else dad.dir = 'down';
          if (t > 5) { const al = Math.max(0, 1 - (t - 5) / 2.5); T.alpha = dad.alpha = vk.alpha = al; }
        }
        ship.hide = ship2.hide = true; T.hide = dad.hide = vk.hide = true;
        G.camOpt = {};
        const ast = G.cast.person('astrid', 20.6, 13, { dir: 'down', spd: 3.6 }); ast.to = [21.1, 23.9];
        yield* until(() => !ast.to, 5);
        faceTo(ast, G.P.x, G.P.y);
        say(G, 'astrid', '왜 안 죽였어? 그때 훈련장에서.', { secs: 2.2 });
        G.hud.banner('3장에서 그린 그림을 펼쳤다', 'pencil', 2.6);
        say(G, 'hiccup', '칼을 들었는데, 떨고 있는 건 나만이 아니더라.');
        say(G, 'astrid', '…그래서 이제?', { secs: 1.8 });
        say(G, 'hiccup', '훈련장으로 가자. 친구들도 불러 줘.', { secs: 2.2 });
        yield* until(() => !talking(G), 20);
        goal(G, 20, 10.5); ast.to = [21.4, 11.2]; ast.spd = 3;
        yield* until(() => G.P.y < 11.8);
        goal(G, null);
        return true;
      } },

    /* ⑥ 우리 문을 직접 열고 친구 넷 잇기 — 문 앞 F → 드래곤마다 다른 수 · 서두르면 물러남
       피시레그+그롱클 = 쏜 뒤 '휴…' 틈에 풀(F) · 스노트라우트+나이트메어 = 고함 → 몸에 불(! 예고) 동안 둘 사이 고리에서 F 꾹 · 쌍둥이+지플백 = 두 머리가 함께 숙일 때 F · 아스트리드+내더 = 살금살금 턱 밑 F 꾹
       → 다섯 드래곤이 솟아오름 */
    { id: '9-6', verb: 'approach', goal: '우리 문을 열고 친구 넷을 드래곤과 이어 줘라', at: [15, 18.4], face: [0, -1], helmet: 0, limit: 170,
      hints: ['우리 문 앞(▼)에서 F — 드래곤마다 성격이 달라요', '서두르면 물러나요 — 쏜 다음 틈 · 둘 사이 · 두 머리가 함께 · 턱 밑'],
      *run(G) {
        const cages = [8, 15, 22].map((x) => G.W.findProp('cage', x, 4)); cages.push(G.W.prop('cage', 4.6, 13.2, { open: 0 }));
        for (const c of cages) c.o.open = 0;
        const tell = TELL[G.diff], easy = G.diff === 'easy', gapT = easy ? 2.4 : G.diff === 'hard' ? 1.4 : 1.8;
        const fr = {};
        for (const [w, x, y] of [['fishlegs', 11.4, 17.2], ['snotlout', 13.2, 17.6], ['ruffnut', 16.8, 17.6], ['tuffnut', 17.9, 17.2], ['astrid', 19.6, 17.0]]) fr[w] = G.cast.person(w, x, y, { dir: 'up', spd: 3, pose: w === 'snotlout' ? { carry: 'axe' } : w === 'astrid' ? { carry: 'axe' } : {} });
        const PAIRS = [
          { k: 'gronckle', who: ['fishlegs'], c: cages[0], S: [8, 8.8], stand: [[11.2, 10.4]] },
          { k: 'nightmare', who: ['snotlout'], c: cages[1], S: [14.6, 9], stand: [[19.4, 10.6]] },
          { k: 'zippleback', who: ['ruffnut', 'tuffnut'], c: cages[2], S: [23.6, 9.4], stand: [[20.6, 11.8], [26.6, 11.8]] },
          { k: 'nadder', who: ['astrid'], c: cages[3], S: [6.8, 16.3], stand: [[10, 17.8]] },
        ];
        const s96 = G.flags.s96 = { pi: 0, ph: 'cage', cage: null, D: null, zone: null, tell: false, both: false };
        let pi = 0, ph = 'cage', D = null, t = 0, early = -9, hold = 0, chin = 0, lastBoth = -9, tellT = 0, ruffT = -9;
        const rides = [];
        const onHit = (q, ux, uy) => { knock(G, ux, uy, 0.6); return true; };
        say(G, 'hiccup', '모두 들어 봐. 드래곤은 싸워서 이기는 게 아니야.', { icons: ['hand'] });
        say(G, 'fishlegs', '그, 그럼 어떻게 하는데?', { secs: 1.8 });
        while (pi < 4) {
          const dt = yield; const P = G.P, pr = PAIRS[pi];
          zones(G);
          s96.pi = pi; s96.ph = ph; s96.tell = false; s96.both = false; s96.zone = null;
          if (ph === 'cage') {
            const c = pr.c; s96.cage = [c.x, c.y]; goal(G, c.x, c.y + 0.4, { h: 2.6 });
            if (useAt(G, c.x, c.y + 0.8, 1.7) && !(P.mashT > 0)) {
              c.o.open = 1; sfx(G, 'clang', c.x); ph = 'out'; t = 0; hold = 0; chin = 0;
              D = G.cast.dragon(pr.k, c.x, c.y - 0.6, { flip: pr.k === 'nadder' ? -1 : 1, fear: 0.7, pose: { pupil: 0.3 } }); D.to = pr.S.slice(); D.spd = 2.2; D.st = 'walk'; D.t = 0;
              s96.D = D;
              pr.who.forEach((w, i) => { fr[w].to = pr.stand[i]; });
              if (pi === 0) say(G, 'hiccup', '피시레그, 그롱클은 쏘고 나면 숨을 골라. 그때야.', { secs: 2.4 });
              if (pi === 1) say(G, 'snotlout', '내가 제일 무섭다는 걸 보여 주지!', { secs: 2 });
              if (pi === 2) { say(G, 'ruffnut', '내가 왼쪽 머리!', { secs: 1.4 }); say(G, 'tuffnut', '아니, 내가 왼쪽!', { secs: 1.4 }); }
              if (pi === 3) say(G, 'astrid', '…내더는 내가 해. 어떻게 하는지만 보여 줘.', { secs: 2.4 });
            }
            continue;
          }
          if (ph === 'out') { goal(G, D.x, D.y); if (!D.to) { ph = 'act'; t = 0; D.t = 0; } continue; }
          if (ph === 'mount') {
            t += dt; let all = true;
            pr.who.forEach((w, i) => { const f = fr[w]; if (!f.to && !f.z) { f.z = 1.1; f.pose.sit = 1; f.ySort = 0.1 + i * 0.02; f.dir = 'side'; f.flip = D.flip; f.pose.carry = null; } if (f.to) all = false; });
            if (all && t > 1.2) { rides.push(D); pi++; ph = 'cage'; D = null; s96.D = null; }
            continue;
          }
          /* 차례마다 다른 수 */
          D.t += dt; t += dt;
          const d = Math.hypot(P.x - D.x, P.y - D.y);
          let calm = false;
          if (pi === 0) {
            /* 그롱클 — 볼 부풂(!) → 제자리 둘레에 불덩이(붉은 고리) → '휴…' 틈에 풀 */
            if (D.st === 'walk') { faceTo(D, P.x, P.y); if (D.t > 1.4 && !D.to) { D.st = 'tell'; D.t = 0; sfx(G, 'cry_gronckle', D.x); } }
            else if (D.st === 'tell') {
              D.pose.tell = Math.min(1, D.t / (tell * 0.5)); bang(G, D, 2.2);
              if (D.t > tell) { D.st = 'shot'; D.t = 0; D.pose.tell = 0; D.pose.mouth = 1; const a = G.rng() * Math.PI; lob(G, D.x, D.y - 0.5, D.x + Math.cos(a) * 2.8, D.y + 0.8 + Math.sin(a) * 2.2, onHit); sfx(G, 'fire', D.x); }
            } else if (D.st === 'shot') { if (D.t > 1.15) { D.st = 'gap'; D.t = 0; D.pose.mouth = 0; } }
            else if (D.st === 'gap') {
              D.pose.pupil = 0.85; G.marks.push({ k: 'text', x: D.x, y: D.y - 2.3, t: '휴…', s: 18 });
              if (d < 2.8) { G.fspots.push({ x: D.x, y: D.y + 0.6 }); if (G.I.pressed.use && !(P.mashT > 0)) calm = true; }
              if (!calm && D.t > gapT) { D.st = 'walk'; D.t = 0; D.pose.pupil = 0.3; D.to = [pr.S[0] + (G.rng() - 0.5) * 3, pr.S[1] + (G.rng() - 0.5) * 2]; D.spd = 1.8; }
            }
            if (!calm && D.st !== 'gap' && d < 2.8 && G.I.pressed.use && G.t - early > 1.5) { early = G.t; backoff(D, P, 1.6); say(G, 'fishlegs', '아, 아직이야! 볼이 부풀었잖아!', { secs: 1.4 }); }
            s96.D = D; goal(G, D.x, D.y);
            if (calm) { D.pose.roll = 1; G.W.prop('nip', D.x - 0.6, D.y + 0.4, {}); say(G, 'fishlegs', '턱 힘 8… 아니, 이제 친구 1이야!', { secs: 2 }); say(G, 'snotlout', '피시레그도 했는데 내가 못 할 리가!', { secs: 2 }); fr.snotlout.pose.carry = null; G.W.prop('_knife', fr.snotlout.x + 0.6, fr.snotlout.y + 0.3, {}); }
          } else if (pi === 1) {
            /* 나이트메어 — 스노트라우트가 으스댐 → 고함 → 몸에 불(! 예고) · 그동안 둘 사이 고리에서 F 꾹 → 진정 · 못 하면 스노트라우트 발치에 작은 불 */
            const sn = fr.snotlout, zx = (sn.x + D.x) / 2, zy = (sn.y + D.y) / 2, ZR = easy ? 1.3 : 1.05, need = easy ? 0.9 : 1.3;
            const inZ = Math.hypot(P.x - zx, (P.y - zy) * 1.25) < ZR, on = G.I.down.use && !(P.mashT > 0);
            P.handLock = on && inZ ? 1 : 0; P.look = on && inZ ? -1 : 0;
            G.marks.push({ k: 'ring', x: zx, y: zy, r: ZR, c: inZ ? '#3a6a3a' : '#e6c464' }); s96.zone = [+zx.toFixed(2), +zy.toFixed(2), ZR];
            faceTo(D, sn.x, sn.y);
            if (D.st === 'walk') { if (!sn.to && D.t > 0.9) sn.to = (sn.x > 19.9 ? pr.stand[0] : [20.4, 11.4]); if (D.t > 1.8) { D.st = 'yell'; D.t = 0; sn.to = null; } }
            else if (D.st === 'yell') { sn.pose.cheer = 1; G.marks.push({ k: 'text', x: sn.x, y: sn.y - 2.2, t: '내가 제일 세다!', s: 16 }); if (D.t > 0.7) { sn.pose.cheer = 0; D.st = 'tell'; D.t = 0; hold = 0; sfx(G, 'cry_nightmare', D.x); } }
            else if (D.st === 'tell') {
              s96.tell = true; D.pose.tell = Math.min(1, D.t / (tell * 0.6)); D.pose.glow = 1; bang(G, D, 3.4);
              if (inZ && on) hold += dt;
              if (hold > 0.05) G.marks.push({ k: 'text', x: P.x, y: P.y - 2.3, t: '진정…', s: 18, c: '#3a6a3a' });
              if (hold >= need) calm = true;
              else if (D.t > tell) {
                D.st = 'fire'; D.t = 0; D.pose.mouth = 0.8; const ux = (sn.x - D.x) / (Math.hypot(sn.x - D.x, sn.y - D.y) || 1), uy = (sn.y - D.y) / (Math.hypot(sn.x - D.x, sn.y - D.y) || 1);
                for (let i = -1; i <= 1; i++) shoot({ kind: 'fire', x: D.x + ux * 1.6 - uy * i * 0.5, y: D.y + uy * 1.6 + ux * i * 0.5, z: 0.3, vx: ux * 7, vy: uy * 7, g: 0, r: 0.3, life: 0.45, noWall: true, hit: (q) => hitsMe(G, q, { low: 0.6 }) && onHit(q, ux, uy) });
                sfx(G, 'fire', D.x);
              }
            } else if (D.st === 'fire') { if (D.t > 0.5 && D.t - dt <= 0.5) { sn.z = 0.6; G.marks.push({ k: 'text', x: sn.x, y: sn.y - 2.4, t: '앗 뜨거!', s: 18 }); } if (D.t > 0.9) { sn.z = 0; D.st = 'walk'; D.t = 0; D.pose.tell = 0; D.pose.glow = 0; D.pose.mouth = 0; } }
            goal(G, zx, zy, { h: 1.2 });
            if (calm) { D.pose.tell = 0; D.pose.glow = 0; P.handLock = 0; P.look = 0; say(G, 'snotlout', '봤지? 이 녀석이 날 좋아해!', { secs: 1.8 }); say(G, 'ruffnut', '다음은 우리! 내가 먼저!', { secs: 1.4 }); say(G, 'tuffnut', '아니, 내가 먼저!', { secs: 1.4 }); }
          } else if (pi === 2) {
            /* 지플백 — 두 머리(초록 김 · 불티)가 따로 끄덕 · 둘이 함께 숙일 때 F · 아니면 머리를 쳐들고 물러남 */
            const PA = easy ? 2.4 : 2.0, PB = PA * 1.5, DW = easy ? 1.3 : G.diff === 'hard' ? 0.7 : 0.9;
            const downA = (D.t % PA) < DW, downB = (D.t % PB) < DW, both = downA && downB;
            if (both) lastBoth = G.t;
            const okWin = G.t - lastBoth < 0.15; s96.both = both;
            const hx = D.x + D.flip * 1.8;
            G.marks.push({ k: 'dot', x: hx - 0.45, y: D.y - (downA ? 1.0 : 2.5), r: 9, c: '#7fae56' });
            G.marks.push({ k: 'dot', x: hx + 0.45, y: D.y - (downB ? 1.0 : 2.5), r: 9, c: '#c8a040' });
            if (!downA && G.rng() < dt * 4) puff('steam', hx - 0.45, D.y, 2.5, 0, 0, 0.6, 0.7, 0.22);
            if (!downB && G.rng() < dt * 4) puff('spark', hx + 0.45, D.y, 2.5, 0, 0, 0.6, 0.4, 0.08);
            if (both) G.marks.push({ k: 'text', x: hx, y: D.y - 3.3, t: '꾸벅', s: 18 });
            if (d < 2.8) G.fspots.push({ x: D.x, y: D.y + 0.6 });
            if (G.I.pressed.use && d < 2.8 && !(P.mashT > 0) && G.t - early > 0.6) {
              if (okWin) calm = true;
              else { early = G.t; backoff(D, P, 1.4); puff('steam', hx, D.y, 2.4, 0, 0, 0.8, 1, 0.4); if (G.t - ruffT > 5) { ruffT = G.t; say(G, 'ruffnut', '봐, 네가 서두르니까!', { secs: 1.4 }); say(G, 'tuffnut', '내가 아니라 쟤가!', { secs: 1.4 }); } }
            }
            if (!D.to && Math.hypot(D.x - pr.S[0], D.y - pr.S[1]) > 1 && G.t - early > 1.6) { D.to = pr.S.slice(); D.spd = 1.4; }
            goal(G, D.x, D.y);
            if (calm) { D.pose.pupil = 1; sfx(G, 'purr', D.x); say(G, 'ruffnut', '같이 꾸벅할 때 하니까 되네?', { secs: 1.8 }); say(G, 'tuffnut', '내 덕이지.', { secs: 1.2 }); say(G, 'astrid', '…보여 줘. 어떻게 하는 건지.', { secs: 1.8 }); }
          } else {
            /* 내더 — 살금살금(빠르면 가시를 세우고 물러남) · 눈이 둥글어지면 턱 밑에서 F 꾹 */
            if (mindStep(D, P, dt, { fastV: 2.2, near: 4.5, calmK: 0.2, minFear: 0, calmR: 7 })) { backoff(D, P, 2.2); D.fear = 0.7; tellT = 0.9; if (G.t - early > 4) { early = G.t; say(G, 'astrid', '너무 빨랐어. 천천히.', { secs: 1.4 }); } }
            if (tellT > 0) { tellT -= dt; D.pose.tell = 0.6; } else D.pose.tell = 0;
            if (D.fear > 0.5 && !D.to && D.t > 2.5) { D.t = 0; D.to = [pr.S[0] + (G.rng() - 0.5) * 2.5, pr.S[1] + (G.rng() - 0.5) * 1.6]; D.spd = 1.4; }
            if (!D.to) faceTo(D, P.x, P.y);
            const on = G.I.down.use && !P.air; P.handLock = on ? 1 : 0; P.look = on ? -1 : 0; P.lock = on;
            if (d < 2.4) G.fspots.push({ x: D.x, y: D.y + 0.6, label: 'F꾹' });
            if (on && d < 2.4 && D.fear < 0.35) chin += dt; else chin = Math.max(0, chin - dt * 2);
            if (chin > (easy ? 0.9 : 1.2)) calm = true;
            goal(G, D.x, D.y);
            if (calm) { P.lock = false; P.handLock = 0; P.look = 0; D.pose.sit = 1; sfx(G, 'purr', D.x); say(G, 'astrid', '턱 밑… 이렇게?', { secs: 1.8 }); }
          }
          if (calm) {
            D.calm = true; D.to = null; D.st = 'calm'; D.pose.tell = 0; D.pose.pupil = 1; D.fear = 0; sfx(G, 'purr', D.x);
            G.hud.banner(['피시레그와 그롱클', '스노트라우트와 나이트메어', '쌍둥이와 지플백', '아스트리드와 내더'][pi] + ' — 친구가 됐다', 'heart', 2.2);
            pr.who.forEach((w, i) => { fr[w].to = [D.x + (i ? 0.7 : -0.3), D.y + 0.08]; fr[w].spd = 3; });
            ph = 'mount'; t = 0; goal(G, null);
          }
        }
        /* 다섯 드래곤 — 테러도 날아와 내 어깨에 · 나는 아스트리드 뒤 내더에 */
        goal(G, null); G.P.lock = false; G.P.handLock = 0; G.P.look = 0;
        const ter = G.cast.dragon('terror', 15, 1.5, { z: 4, flip: 1, flapHz: 3, pose: { wing: 1, pupil: 0.9 } }); ter.to = [G.P.x + 0.6, G.P.y - 0.3]; ter.spd = 5;
        yield* until(() => !ter.to, 4);
        const nad = rides[3]; G.P.hide = true;
        const hc = G.cast.person('hiccup', nad.x - 0.75, nad.y + 0.04, { dir: 'side', flip: nad.flip, ySort: 0.06, pose: { sit: 1 } }); hc.z = 1.1;
        ter.to = [nad.x - 0.75, nad.y + 0.1]; ter.spd = 4;
        G.hud.banner('친구 넷이 드래곤에 올라탔다', 'heart', 3.2);
        sfx(G, 'flap'); sfx(G, 'roar', 15);
        const riders = G.cast.list.filter((a) => a.type === 'person' && a.z > 0.5);
        for (let k = 0; k < 3; k += yield) {
          const up = Math.min(1, k / 2.6) * 6;
          for (const r of rides) { r.pose.wing = 1; r.z = up; r.pose.sit = 0; r.pose.roll = 0; }
          ter.z = up + 2;
          for (const r of riders) r.z = up + 1.1;
        }
        return true;
      },
      sense: (G) => { const s = G.flags.s96 || {}, D = s.D; return { pi: s.pi, ph: s.ph, cage: s.cage, D: D ? { x: +D.x.toFixed(2), y: +D.y.toFixed(2), st: D.st, fear: +D.fear.toFixed(2) } : null, zone: s.zone, tell: s.tell, both: s.both }; } },
  ],
};
