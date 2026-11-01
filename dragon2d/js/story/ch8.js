// 8장 아스트리드와 둥지(#19·#20 · design §2 · 탑뷰) — 짐을 본 아스트리드를 투슬리스가 낚아챔 → 화난 비행(구르기·곤두박질 · ! + 화살표 → 반대쪽 키 · 손 셋)
// → "미안해!" → 노을 구름 틈으로 올라 오로라 아래로(실패 없음) → 안개 속 드래곤 떼에 섞여 따라가기(떼 가운데 줄 · 밖이면 떼 눈이 이쪽 · 밀려오면 비키기)
// → 둥지 둘레 길로 빠져나가기(대장 킁킁 = 콧구멍 벌름 → 낮추고 멈추기 · 1장 그 양 · 생선 한 마리 그롱클은 화면 밖 · 겁먹은 눈 → 책 '대장만 나쁘다')
import { say, wait, until, goal, near, talking, bang, sfx, shoot, FX, burst, puff, faceTo } from './kit.js?v=1';
import { createFlight, addCloud } from '../play/flight.js?v=1';
import { drawFlockTop } from '../art/actors.js?v=1';

const TELL = { easy: 3, normal: 2.5, hard: 2 };
const DIRS = ['left', 'right', 'up', 'down'];
const KEY = { left: '◀', right: '▶', up: '▲' };
/* 노을 → 오로라 화면 색(미리 만든 21단) */
const SKY = []; for (let i = 0; i <= 20; i++) { const k = i / 20; SKY.push('rgba(' + Math.round(240 + (14 - 240) * k) + ',' + Math.round(140 + (22 - 140) * k) + ',' + Math.round(90 + (44 - 90) * k) + ',' + (0.1 + 0.26 * k).toFixed(3) + ')'); }
const AUR = [['rgba(120,196,150,0.5)', 0.18, 0], ['rgba(104,170,196,0.5)', 0.27, 1.7], ['rgba(164,140,196,0.5)', 0.36, 3.1]];
/* 오로라 띠 — 평평한 반투명 띠(빛 번짐 X) · 화면 좌표 */
function aurora(ctx, V, t, k) {
  if (k <= 0.01) return;
  const W = V.W, H = V.H;
  for (const [c, yk, ph] of AUR) {
    const y0 = H * yk, th = H * 0.07;
    ctx.globalAlpha = k * 0.7; ctx.fillStyle = c; ctx.beginPath();
    for (let x = 0; x <= W + 40; x += 40) { const y = y0 + Math.sin(x * 0.006 + t * 0.25 + ph) * H * 0.05; if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    for (let x = W + 40; x >= 0; x -= 40) { const y = y0 + th + Math.sin(x * 0.006 + t * 0.25 + ph + 0.6) * H * 0.04; ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export const chapter = {
  id: 8, title: '아스트리드와 둥지', sub: '들킨 비밀 · 그리고 안개 너머', place: 'sea', time: 'sunset',
  end: '드래곤 책에 둥지 쪽이 생겼다 — 대장만 나쁘다',
  steps: [
    /* ① 화난 비행 — 2초쯤마다 구르기(◀▶) 또는 곤두박질(▼ · 작아짐) · ! + 화살표가 뜨면 반대쪽 키(곤두박질은 ↑)를 1초(쉬움 1.5) 안에 새로 누름
       놓치거나 엉뚱한 키 = 아스트리드 손 하나 미끄러짐(셋 다 = 다시) · 미리 누르고 있던 키는 안 침 · 여섯 번 버티면 "미안해!" */
    { id: '8-1', verb: 'cling', goal: '투슬리스 등에서 버텨라', at: [24, 0], helmet: 1, limit: 70,
      hints: ['몸이 기우는 반대쪽 방향키를 눌러요 — ◀ 이면 ▶', '곤두박질(작아짐)엔 ↑ — ! 가 뜨면 바로 새로 눌러요'],
      *run(G) {
        const F = G.Fl = createFlight(24, 0, { speed: 9, rider: 'hiccup+astrid', fin: 'new', lane: [14, 34] }); G.mode = 'fly';
        F.lockH = true; F.lockV = true; F.noShoot = true;
        const R = G.rng; for (let i = 0; i < 12; i++) addCloud(F, 12 + R() * 24, -18 - i * 26, 7 + R() * 3, 4);
        const WIN = { easy: 1.5, normal: 1.0, hard: 0.8 }[G.diff], NEED = 6;
        const tr = { id: 0, k: 'L', need: 'right', t: 0, done: false };
        let hands = 3, ok = 0, ph = 'calm', t = 0, prev = '', rep = 0, flash = 0, flashT = '';
        G.flags.tr = null; G.flags.hands = 3; G.flags.ok = 0;
        G.hud.banner('아스트리드가 짐을 봤다 — 투슬리스가 낚아채 하늘로!', 'wind', 3);
        say(G, 'astrid', '이 짐은 뭐야? 어디 가려고— 으아악!', { secs: 2.4 });
        say(G, 'hiccup', '투슬리스, 착하게… 착하게 좀 날아!', { secs: 2.2 });
        const yells = ['내려 줘! 지금 당장!', '히컵! 얘 좀 어떻게 해 봐!', '알았어, 알았다고!', '바다가 코앞이잖아!'];
        G.drawOver = (ctx, V) => {
          V.reset();
          const s = V.H / 768, x = V.W - 110 * s, y = V.H - 112 * s;          /* 오른쪽 아래(책 단추 위 · 말풍선과 안 겹침) */
          ctx.fillStyle = '#f4ead2'; ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.roundRect(x - 92 * s, y - 20 * s, 184 * s, 40 * s, 10 * s); ctx.fill(); ctx.stroke();
          ctx.font = `700 ${Math.round(14 * s)}px sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b2118'; ctx.fillText('아스트리드 손', x - 82 * s, y);
          for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.arc(x + 30 * s + i * 24 * s, y, 8 * s, 0, 7);
            ctx.lineWidth = 2.5 * s; ctx.strokeStyle = '#2b2118';
            if (i < hands) { ctx.fillStyle = '#e8b48a'; ctx.fill(); ctx.stroke(); } else { ctx.setLineDash([4 * s, 4 * s]); ctx.stroke(); ctx.setLineDash([]); }
          }
        };
        while (ok < NEED) {
          const dt = yield; t += dt;
          if (flash > 0) { flash -= dt; G.marks.push({ k: 'text', x: F.x + 2.6, y: F.y - F.z * 0.4 - 2.4, t: flashT, s: 22, c: flashT === '버팀!' ? '#3a6a3a' : '#a83e1e' }); }
          if (ph === 'calm') {
            F.rot = 0; F.scale = 1; F.x = 24;
            if (t > (tr.id === 0 ? 3.4 : 0.9)) {
              let k = ['L', 'R', 'D'][Math.floor(R() * 3)]; if (k === prev && rep >= 1) k = k === 'D' ? 'L' : 'D';
              rep = k === prev ? rep + 1 : 0; prev = k;
              tr.id++; tr.k = k; tr.need = k === 'L' ? 'right' : k === 'R' ? 'left' : 'up'; tr.t = 0; tr.done = false;
              ph = 'act'; t = 0; G.flags.tr = tr; sfx(G, 'whoosh', F.x);
            }
            continue;
          }
          /* 재주 한 번 — 몸이 기울며(구르기) 옆으로 쏠리거나, 작아지며(곤두박질) 바다 쪽으로 */
          const T = WIN + 0.5, q = Math.min(1, t / T), s = Math.sin(Math.PI * q);
          tr.t = t;
          if (tr.k === 'D') { F.scale = 1 - 0.32 * s; F.rot = 0; F.x = 24; if (q > 0.4 && q < 0.6 && R() < 0.5) puff('drop', F.x + (R() - 0.5) * 2, F.y + 0.5, 0, 0, 0, 1.5, 0.4, 0.12); }
          else { const sg = tr.k === 'L' ? -1 : 1; F.rot = sg * 0.85 * s; F.x = 24 + sg * 1.8 * s; F.scale = 1; }
          if (!tr.done) {
            const vy = F.y - F.z * 0.4;          /* 그려지는 몸 가운데 */
            bang(G, { x: F.x, y: vy, z: 0 }, 3.6);
            const ax = tr.k === 'L' ? F.x - 3.2 : tr.k === 'R' ? F.x + 3.2 : F.x + 1.2, ay = tr.k === 'D' ? vy - 3.6 : vy;
            G.marks.push({ k: 'text', x: ax, y: ay, t: tr.k === 'L' ? '◀' : tr.k === 'R' ? '▶' : '▼', s: 38, c: '#a83e1e' });
            G.fspots.push({ x: F.x, y: vy + 5.6, label: KEY[tr.need] });
            const I = G.I; let wrong = false;
            for (const a of DIRS) if (a !== tr.need && I.pressed[a]) wrong = true;
            const good = I.down[tr.need] && I.held[tr.need] <= t + 0.15;
            if (good && !wrong) { tr.done = true; ok++; G.flags.ok = ok; flash = 0.8; flashT = '버팀!'; sfx(G, 'ok'); if (ok === 2 || ok === 4) say(G, 'astrid', yells[ok / 2], { secs: 1.6 }); }
            else if (wrong || t > WIN) {
              tr.done = true; hands--; G.flags.hands = hands; flash = 0.9; flashT = '으악!'; sfx(G, 'thud', F.x);
              if (hands <= 0) { G.flags.tr = null; say(G, 'astrid', '으아아— 손이…!', { secs: 1.4 }); yield* wait(1); return 'retry'; }
              say(G, 'astrid', hands === 2 ? '손이 미끄러져!' : '히컵, 꽉 잡아!', { secs: 1.4 });
            }
          }
          if (t > T) { ph = 'calm'; t = 0; G.flags.tr = null; }
        }
        F.rot = 0; F.scale = 1; F.x = 24; G.flags.tr = null;
        say(G, 'astrid', '알았어, 알았어! 미안해! 다 미안해!');
        say(G, 'hiccup', '…투슬리스, 이제 됐어. 천천히.', { secs: 2 });
        yield* until(() => !talking(G), 6);
        return true;
      },
      sense: (G) => { const tr = G.flags.tr; return { tr: tr ? { id: tr.id, k: tr.k, need: tr.need, t: +tr.t.toFixed(2), done: tr.done } : null, hands: G.flags.hands, ok: G.flags.ok }; } },

    /* ② 노을 구름 위 → 오로라 — 실패 없음 · 구름 틈(노란 고리)으로 넷(쉬움 셋) 지나면 구름 위로 · 놓친 틈은 다음 틈이 옴 · 화면 색이 노을에서 밤으로 */
    { id: '8-2', verb: 'fly', time: 'sunset', goal: '구름 틈으로 올라가라', at: [24, 0], limit: 70,
      hints: ['노란 고리가 있는 구름 틈으로 ←→', '틈을 놓쳐도 괜찮아요 — 다음 틈이 와요'],
      *run(G) {
        const F = G.Fl = createFlight(24, 0, { speed: 8, rider: 'hiccup+astrid', fin: 'new', lane: [10, 38] }); G.mode = 'fly'; F.noShoot = true;
        G.tint = 'clear';
        const NEED = G.diff === 'easy' ? 3 : 4, R = G.rng, holes = [];
        let ny = -26, side = R() < 0.5 ? -1 : 1, got = 0, rev = 0, tEnd = 0, missT = -9;
        const addHole = () => { side = -side; const h = { x: 24 + side * (5 + R() * 3), y: ny }; ny -= 30; holes.push(h); addCloud(F, h.x - 5.6, h.y, 7.6, 4.2); addCloud(F, h.x + 5.6, h.y, 7.6, 4.2); };
        for (let i = 0; i < NEED; i++) addHole();
        for (let i = 0; i < 8; i++) addCloud(F, 11 + R() * 26, -12 - i * 19, 4 + R() * 2, 2.5);
        G.flags.holes = holes;
        say(G, 'astrid', '…미안해. 짐을 보고 화가 났었어.');
        say(G, 'hiccup', '나도. 저기 구름 틈으로 올라가 보자.', { secs: 2 });
        G.drawOver = (ctx, V, t) => {
          V.reset();
          const k = Math.min(1, got / NEED * 0.55 + rev * 0.45);
          ctx.fillStyle = SKY[Math.round(k * 20)]; ctx.fillRect(0, 0, V.W, V.H);
          aurora(ctx, V, t, rev);
        };
        while (true) {
          const dt = yield;
          const h = holes[0];
          if (got < NEED && h) {
            goal(G, h.x, h.y, { h: 0.8 }); G.marks.push({ k: 'ring', x: h.x, y: h.y, r: 1.7, c: '#e6c464' });
            if (F.y < h.y - 0.5) {
              holes.shift();
              if (Math.abs(F.x - h.x) < 1.9) { got++; sfx(G, 'whoosh', F.x); burst('steam', h.x, h.y, 1, 8, 2, 0.8, 0.4, R); G.hud.banner('구름 틈 ' + got + ' / ' + NEED, 'cloud', 1.4); }
              else { addHole(); if (G.t - missT > 6) { missT = G.t; say(G, 'hiccup', '괜찮아, 다음 틈으로!', { secs: 1.4 }); } }
            }
          } else {
            goal(G, null);
            if (rev === 0) { G.hud.banner('구름 위 — 오로라 아래로!', 'cloud', 3); say(G, 'astrid', '…예쁘다.', { secs: 1.8 }); say(G, 'hiccup', '그치? 이게 투슬리스가 보여 주는 하늘이야.'); }
            rev = Math.min(1, rev + dt / 3); tEnd += dt;
            if (tEnd > 6.5) break;
          }
        }
        G.tint = 'aurora';
        return true;
      },
      sense: (G) => ({ hole: (G.flags.holes || [])[0] ? [+G.flags.holes[0].x.toFixed(2), +G.flags.holes[0].y.toFixed(2)] : null }) },

    /* ③ 안개 속 드래곤 떼 — 떼 가운데 줄이 좌우로 흔들림 · 떼 띠 밖이면 가까운 떼 눈이 이쪽(3초 넘게 밖 = 다시)
       떼 드래곤 하나가 ! 뒤에 점선 고리 자리(내 칸)로 밀려옴 → 비키기 · 부딪힘 셋(쉬움 X) = 다시 */
    { id: '8-3', verb: 'flock', time: 'fog', goal: '드래곤 떼 속에 섞여 따라가라', at: [24, 0], limit: 80,
      hints: ['떼 가운데 점 줄을 따라 ←→ — 밖으로 나가면 눈이 이쪽을 봐요', '! 가 뜬 드래곤은 점선 고리로 밀려와요 — 옆으로 비켜요'],
      *run(G) {
        const F = G.Fl = createFlight(24, 0, { speed: 9, rider: 'hiccup+astrid', fin: 'new', lane: [8, 40] }); G.mode = 'fly'; F.noShoot = true;
        const Dk = G.diff, A1 = { easy: 3.5, normal: 5, hard: 6 }[Dk], A2 = { easy: 1, normal: 1.8, hard: 2.2 }[Dk], BAND = { easy: 4.5, normal: 3.4, hard: 3 }[Dk], END = 250;
        const IV = { easy: 6.5, normal: 5, hard: 4 }[Dk], tell = TELL[Dk];
        const cx = (y) => 24 + A1 * Math.sin(-y * 0.035) + A2 * Math.sin(-y * 0.09 + 1);
        const KINDS = ['nadder', 'gronckle', 'nightmare', 'zippleback', 'terror'], R = G.rng, flock = [];
        [-16, -12.5, -9, -5.5, 5.5, 9].forEach((dy, r) => { const offs = r % 2 ? [-3.9, -1.5, 0.9, 3.3] : [-3.3, -1.0, 1.4, 3.7]; for (const ox of offs) flock.push({ kind: KINDS[flock.length % 5], dy, ox, wob: R() * 6.28, fl: R(), x: 24 + ox, y: dy, st: 'slot', t: 0, off: 0, tx: 0 }); });
        let outT = 0, hits = 0, nextI = 3.5, intr = null;
        const f8 = G.flags.F8 = { cx: 24, band: BAND, out: 0, intr: null }, iv8 = { st: '', tx: 0, x: 0, y: 0 };
        say(G, 'hiccup', '안개다… 드래곤 떼 한가운데야. 쉿, 섞여서 가자.', { icons: ['flock'] });
        G.drawOver = (ctx, V, t) => {
          V.reset();
          const out = Math.abs(F.x - cx(F.y)) > BAND;
          for (const m of flock) {
            if (!V.onScreen(m.x, m.y, 3)) continue;
            V.at(m.x, m.y, 1, 2.1); ctx.globalAlpha = 0.86; drawFlockTop(ctx, m.kind, (t * 1.4 + m.fl) % 1); ctx.globalAlpha = 1;
          }
          V.reset();
          if (out) {          /* 가까운 떼 넷의 눈이 이쪽 */
            const s = V.H / 768;
            const near4 = flock.slice().sort((a, b) => Math.hypot(a.x - F.x, a.y - F.y) - Math.hypot(b.x - F.x, b.y - F.y)).slice(0, 4);
            for (const m of near4) {
              const x = V.sx(m.x), y = V.sy(m.y) - 26 * s, a = Math.atan2(F.y - m.y, F.x - m.x);
              ctx.fillStyle = '#f4ead2'; ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.ellipse(x, y, 11 * s, 7 * s, 0, 0, 7); ctx.fill(); ctx.stroke();
              ctx.fillStyle = '#2b2118'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 5 * s, y + Math.sin(a) * 3 * s, 3.5 * s, 0, 7); ctx.fill();
            }
            /* 들키기까지 남은 시간 — 히컵 곁 고리가 줄어듦 */
            const fx = V.sx(F.x), fy = V.sy(F.y);
            ctx.strokeStyle = '#a83e1e'; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.arc(fx, fy, 2.0 * V.S, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, 1 - outT / 3)); ctx.stroke();
          }
        };
        while (-F.y < END) {
          const dt = yield;
          const c0 = cx(F.y);
          for (const m of flock) {
            const bx = cx(F.y + m.dy) + m.ox + Math.sin(G.t * 1.3 + m.wob) * 0.3, by = F.y + m.dy + Math.sin(G.t * 0.9 + m.wob) * 0.25;
            m.t += dt;
            if (m.st === 'slot') { m.x = bx; m.y = by; }
            else {
              m.tx = c0 + m.off;
              if (m.st === 'tell') { m.x = bx; m.y = by; bang(G, { x: m.x, y: m.y, z: 0 }, 1.6); G.marks.push({ k: 'ring', x: m.tx, y: F.y, r: 1.35, c: '#a83e1e' }); if (m.t > tell) { m.st = 'in'; m.t = 0; } }
              else if (m.st === 'in') { const k = Math.min(1, m.t / 0.9); m.x = bx + (m.tx - bx) * k; m.y = by + (F.y - by) * k; if (k >= 1) { m.st = 'stay'; m.t = 0; } }
              else if (m.st === 'stay') { m.x = m.tx; m.y = F.y; if (m.t > 1.3) { m.st = 'back'; m.t = 0; } }
              else { const k = Math.min(1, m.t / 0.8); m.x = m.tx + (bx - m.tx) * k; m.y = F.y + (by - F.y) * k; if (k >= 1) { m.st = 'slot'; intr = null; } }
              if ((m.st === 'in' || m.st === 'stay') && F.invT <= 0 && Math.hypot(F.x - m.x, F.y - m.y) < 1.35) {
                F.vx = (F.x >= m.x ? 1 : -1) * 7; F.invT = 1.1; sfx(G, 'thud', F.x); G.marks.push({ k: 'text', x: F.x, y: F.y - 2.4, t: '쿵!', s: 24 });
                if (G.diff !== 'easy') { hits++; if (hits >= 3) { say(G, 'hiccup', '으… 자꾸 부딪히면 들켜! 다시!', { secs: 1.6 }); yield* wait(1); return 'retry'; } say(G, 'astrid', '조심해!', { secs: 1 }); }
              }
            }
          }
          /* 밀려오기 — 앞뒤 줄(±5.5)에서 내 쪽에 가까운 하나 */
          nextI -= dt;
          if (!intr && nextI <= 0) {
            nextI = IV; let best = null, bd = 1e9;
            for (const m of flock) if (Math.abs(m.dy) === 5.5 && m.st === 'slot') { const d = Math.abs(m.x - F.x); if (d < bd) { bd = d; best = m; } }
            if (best) { intr = best; best.st = 'tell'; best.t = 0; best.off = Math.max(-BAND + 0.8, Math.min(BAND - 0.8, F.x - c0)); }
          }
          /* 떼 가운데 줄 — 앞쪽 점(어려움 X) */
          if (G.diff !== 'hard') for (let i = 1; i <= 5; i++) { const yy = F.y - 2 - i * 2.2; G.marks.push({ k: 'dot', x: cx(yy), y: yy, r: 3, c: 'rgba(244,234,210,.75)' }); }
          const out = Math.abs(F.x - c0) > BAND;
          outT = out ? outT + dt : Math.max(0, outT - dt * 2);
          if (outT > 3) { say(G, 'hiccup', '떼가 우릴 봤어…! 다시 섞여 보자.', { secs: 1.8 }); yield* wait(1); return 'retry'; }
          f8.cx = c0; f8.out = outT; f8.intr = intr ? iv8 : null;
          if (intr) { iv8.st = intr.st; iv8.tx = intr.st === 'tell' ? c0 + intr.off : intr.x; iv8.x = intr.x; iv8.y = intr.y; }
        }
        G.hud.banner('안개 너머 — 드래곤들이 가는 섬', 'flock', 2.6);
        say(G, 'hiccup', '드래곤들이 다 어디로 가는 거지…?', { secs: 2 });
        yield* wait(1.6);
        return true;
      },
      sense: (G) => { const f = G.flags.F8 || {}; return { cx: f.cx != null ? +f.cx.toFixed(2) : null, band: f.band, out: f.out != null ? +f.out.toFixed(2) : 0, intr: f.intr ? { st: f.intr.st, tx: +f.intr.tx.toFixed(2), x: +f.intr.x.toFixed(2) } : null }; } },

    /* ④ 둥지 — 둘레 길(북쪽)을 서쪽 → 동쪽 · 구멍 속 대장(머리만 · 눈 감음) · 킁킁 예고(콧구멍 벌름 · !) → 킁킁(2.6초): C로 낮추고 멈춤(바위 곁이면 낮게 움직여도 됨) · 아니면 눈을 뜸 → 다시
       1장 그 양이 구멍으로 · 생선 한 마리뿐인 그롱클은 화면 밖으로(그림자·소리만) · 겁먹은 눈 셋 → 책 둥지 쪽 */
    { id: '8-4', verb: 'sniff', place: 'nest', time: 'fog', goal: '들키지 말고 둥지를 빠져나가라', at: [3.6, 5.6], face: [1, 0], helmet: 1, limit: 110, zoom: 0.78,
      hints: ['콧구멍이 벌름하면 C로 낮추고 멈춰요', '서서 걸으면 대장이 꿈틀해요 — 낮게(C), 바위 곁이면 조금 움직여도 돼요'],
      *run(G) {
        G.camOpt = { fixY: 9.6 };
        const rocks = G.W.props.filter((p) => p.kind === 'rock');
        const B = G.boss = { x: 25, y: 12.4, scale: 0.8, alpha: 0.95, rot: 0, pose: { part: 'head', eyes: 0, sniff: 0 } };
        const nose = { x: 25, y: 12.4 + 2.2, z: 0 };
        const ast = G.cast.person('astrid', 2.4, 6.2, { dir: 'side', flip: 1, spd: 4.6 }), tl = G.cast.dragon('toothless', 0.9, 7, { flip: 1, spd: 4.6, fear: 0.2, pose: { pupil: 0.5 } });
        const scared = [['terror', 14, 9.6], ['zippleback', 36, 10], ['nadder', 43.5, 10.6]].map(([k, x, y]) => G.cast.dragon(k, x, y, { flip: -1, fear: 1, pupilTo: 0.06, pose: { pupil: 0.1, ears: -1 } }));
        /* 따라오기 — 지나온 자리(0.08초마다)를 아스트리드·투슬리스가 밟음 */
        const TN = 64, trail = new Float32Array(TN * 2); let tn = 0, tacc = 0;
        for (let i = 0; i < TN; i++) { trail[i * 2] = 0.8 + 2.8 * (i / TN); trail[i * 2 + 1] = 7 - 1.4 * (i / TN); }
        tn = TN;
        const at = (back) => { const j = ((tn - back) % TN + TN) % TN; return j * 2; };
        const tell = TELL[G.diff], SN = 2.6;
        const bs = { ph: 'calm', t: 0, dur: 4.2 };
        let ev = 0, evT = 0, noted = false, gr = null, sheep = null, bask = null, ter = null, nad = null;
        G.flags.bs = bs;
        const nearRock = (x, y) => { for (const r of rocks) { const b = r.box; const dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]); if (Math.hypot(dx, dy) < 1.1) return true; } return false; };
        say(G, 'hiccup', '여기가… 드래곤 둥지야. 쉿.', { secs: 2 });
        say(G, 'astrid', '저 구멍 속에 뭐가 있어. 엄청 커.', { secs: 2.2 });
        while (true) {
          const dt = yield; const P = G.P;
          /* 동무 둘 */
          tacc += dt; if (tacc > 0.08) { tacc = 0; const j = (tn % TN) * 2; trail[j] = P.x; trail[j + 1] = P.y; tn++; }
          const ia = at(7), it = at(15);
          ast.to = [trail[ia], trail[ia + 1] + 0.1]; ast.pose.crouch = P.crouch; tl.to = [trail[it], trail[it + 1] + 0.2]; tl.pose.sit = P.crouch > 0.5 && !tl.moving ? 1 : 0;
          for (const d of scared) { d.x += Math.sin(G.t * 31 + d.y) * 0.004; if (!noted && Math.hypot(P.x - d.x, P.y - d.y) < 4.5) { noted = true; G.book.note('nest', 'sign', '모두 겁먹은 눈 — 1장 그 밤의 눈이야'); say(G, 'hiccup', '(1장에서 본 그 눈이야… 다들 겁먹었어.)'); } }
          /* 대장 킁킁 차례 */
          bs.t += dt;
          if (bs.ph === 'calm') {
            /* 서서 걷는 소리 — 14m 안이면 대장이 꿈틀(다음 킁킁이 빨리 옴) */
            if (P.crouch < 0.5 && Math.hypot(P.vx, P.vy) > 1 && Math.hypot(P.x - nose.x, P.y - nose.y) < 14) { bs.t += dt * 1.5; G.marks.push({ k: 'text', x: nose.x + 2.2, y: nose.y - 0.8, t: '꿈틀', s: 15 }); }
            B.pose.sniff = Math.max(0, B.pose.sniff - dt * 2); if (bs.t > bs.dur) { bs.ph = 'pre'; bs.t = 0; sfx(G, 'inhale', B.x); }
          } else if (bs.ph === 'pre') { B.pose.sniff = Math.min(0.6, bs.t / tell * 0.6); bang(G, nose, 0.4); G.marks.push({ k: 'text', x: nose.x + 2.2, y: nose.y, t: '킁…', s: 18 }); if (bs.t > tell) { bs.ph = 'sniff'; bs.t = 0; } }
          else if (bs.ph === 'sniff') {
            B.pose.sniff = 1; G.marks.push({ k: 'text', x: nose.x + 2.4, y: nose.y, t: '킁킁', s: 22, c: '#a83e1e' });
            const still = Math.hypot(P.vx, P.vy) < 0.35, low = P.crouch > 0.5;
            if (!(low && (still || nearRock(P.x, P.y)))) {
              /* 들킴 — 눈을 천천히 뜸(깜짝 X) → 다시 */
              bs.ph = 'wake'; sfx(G, 'growl', B.x); say(G, 'hiccup', '(눈을 떴어… 너무 시끄러웠나 봐!)', { secs: 1.6 });
              for (let t = 0; t < 1.2; t += yield) B.pose.eyes = Math.min(1, t / 0.8);
              return 'retry';
            }
            if (bs.t > SN) { bs.ph = 'calm'; bs.t = 0; bs.dur = 2.8 + G.rng() * 2; }
          } else if (bs.ph === 'busy') {
            /* 생선 한 마리뿐인 그롱클 — 화면 밖으로 · 대장 머리가 구멍 깊이 따라 들어갔다 돌아옴(삼키는 건 안 보임 · 소리·먼지만) */
            evT += dt;
            if (gr) { gr.to = [25, 36]; gr.spd = 7; gr.z = 2; }
            if (evT < 1.3) { const k = evT / 1.3; B.y = 12.4 + k * 10; B.alpha = 0.95 - k * 0.75; }
            else if (evT < 1.8) { if (gr) { sfx(G, 'boom', 25); sfx(G, 'roar', 25); burst('dust', 25, 17, 0.5, 10, 2, 0.8, 0.5, G.rng); G.cast.remove(gr); gr = null; } G.marks.push({ k: 'text', x: 25, y: 16.4, t: '쿵…', s: 20 }); }
            else if (evT < 3.4) { const k = (evT - 1.8) / 1.6; B.y = 22.4 - k * 10; B.alpha = 0.2 + 0.75 * k; }
            else { B.y = 12.4; B.alpha = 0.95; bs.ph = 'calm'; bs.t = 0; bs.dur = 3.4; say(G, 'hiccup', '…생선이 한 마리뿐이라서.'); say(G, 'astrid', '저 큰 녀석 혼자만 배부른 거야. 다른 애들은 바치기만 하고.'); }
          }
          /* 사건 — 1장 그 양 · 생선 바구니 · 한 마리 그롱클 */
          if (ev === 0 && P.x > 11) {
            ev = 1; evT = 0;
            ter = G.cast.dragon('terror', 12, 1.5, { z: 3, flip: 1, flapHz: 3, pose: { wing: 1, pupil: 0.2 } }); ter.to = [21, 12.5]; ter.spd = 4.5;
            nad = G.cast.dragon('nadder', 30, 1.5, { z: 3.5, flip: -1, pose: { wing: 1, pupil: 0.2 } }); nad.to = [27.5, 13]; nad.spd = 4;
            sheep = G.W.prop('sheep', 12, 1.5, { nobox: 1, lift: 1 }); bask = G.W.prop('fish_basket', 30, 1.5, { nobox: 1, n: 3 });
            say(G, 'hiccup', '저 양… 1장 그 밤에 끌려간 양이야!', { icons: ['sheep'] });
          }
          if (ev === 1) {
            if (ter.to) { sheep.x = ter.x; sheep.y = ter.y + 0.05; } else if (!sheep.hide) { sheep.y += dt * 4; if (sheep.y > 16) { sheep.hide = true; puff('dust', 21, 15, 0.3, 0, 0, 0.5, 0.6, 0.4); ter.to = [8, -3]; ter.spd = 5; } }
            if (nad.to && !bask.hide) { bask.x = nad.x; bask.y = nad.y + 0.05; } else if (!bask.hide) { bask.y += dt * 4; if (bask.y > 16) { bask.hide = true; nad.to = [40, -3]; nad.spd = 5; say(G, 'astrid', '다들 먹이를 여기로 가져와… 왜?'); } }
            if (sheep.hide && bask.hide) ev = 2;
          }
          if (ev === 2 && P.x > 22.5 && bs.ph === 'calm') {
            ev = 3; bs.ph = 'busy'; bs.t = 0; evT = 0; B.pose.sniff = 0;
            gr = G.cast.dragon('gronckle', 25, 13.5, { z: 2.4, flip: 1, flapHz: 2.4, pose: { wing: 1, pupil: 0.15 } });
            shoot({ kind: 'fish', x: 25, y: 13.6, z: 2.2, vx: 0, vy: 0.4, g: 9.8, r: 0.2, life: 1.5, noWall: true });
            G.marks.push({ k: 'text', x: 25, y: 10.6, t: '한 마리…', s: 16 });
          }
          goal(G, 47.6, 6.6, { h: 1.6 });
          if (P.x > 46.5) break;
        }
        goal(G, null);
        G.book.note('nest', 'other', '대장만 나쁘다 — 다른 드래곤은 먹이를 바칠 뿐');
        G.book.note('boss', 'sign', '냄새로 찾음 — 콧구멍이 벌름', false);
        G.hud.banner('책에 둥지 쪽이 생겼다 — 대장만 나쁘다', 'book', 3);
        say(G, 'astrid', '마을에 알려야 해!');
        say(G, 'hiccup', '안 돼, 그럼 투슬리스가… 생각할 시간이 필요해.');
        yield* wait(2.4);
        G.boss = null;
        return true;
      },
      sense: (G) => { const b = G.flags.bs || {}; return { ph: b.ph, t: b.t != null ? +b.t.toFixed(2) : 0, exit: [47.6, 6.6] }; } },
  ],
};
