// 11장 함께 사는 버크(#28 · design §2 종장 · 탑뷰) — ① 깨어남: 첫걸음 비틀(처음 몇 걸음 느림) → 투슬리스가 머리로 받쳐 나란히 → 꼬리 끝을 다리 옆에(말 없음) → 다리 친구 · 그 공책
// ② 지붕 위 배고픈 드래곤 셋에게 생선 던지기(떨어질 곳 고리) → 고버의 새 꼬리날개에 무늬 칠하기(←→ 고르기 · F 칠하기) ③ 마을 위를 함께 날기(실패 없음 · 손 흔드는 이웃) → 엔딩
// 다리는 고버 한 줄 + 몸짓으로만(design §8) · 대사는 우리 말로 새로(영화 원문 X)
import { say, wait, until, goal, near, dist, talking, useAt, throwFrom, previewArc, sfx, burst, puff, faceTo } from './kit.js?v=1';
import { createFlight } from '../play/flight.js?v=1';

const INK = '#2b2118', FINC = '#a9623b', HEART = '#c97a6a';
const r2 = (v) => Math.round(v * 100) / 100;
const text = (G, x, y, t, s = 20, c) => G.marks.push({ k: 'text', x, y, t, s, c });
const PATS = [['stripe', '줄무늬'], ['dots', '점무늬'], ['sun', '해 무늬']];
const DOTS = [[-0.55, 0.3], [-0.2, -0.15], [0.2, -0.4], [0.15, 0.2], [0.55, -0.2], [-0.5, -0.05], [0.5, 0.35]];

/* 꼬리날개 + 무늬(화면 좌표 · k = 반지름 px) — frac = 왼쪽부터 칠한 만큼 */
function finPath(ctx, x, y, k) { ctx.beginPath(); ctx.moveTo(x - k, y + 0.55 * k); ctx.quadraticCurveTo(x - 0.25 * k, y - 1.15 * k, x + k, y - 0.5 * k); ctx.lineTo(x + 0.45 * k, y + 0.05 * k); ctx.lineTo(x + 0.85 * k, y + 0.7 * k); ctx.closePath(); }
function drawFin(ctx, x, y, k, pat, frac = 1) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  finPath(ctx, x, y, k); ctx.fillStyle = FINC; ctx.fill();
  if (frac > 0) {
    ctx.save(); finPath(ctx, x, y, k); ctx.clip(); ctx.beginPath(); ctx.rect(x - k * 1.1, y - k * 1.3, k * 2.3 * frac, k * 2.4); ctx.clip();
    ctx.fillStyle = '#f4ead2'; ctx.strokeStyle = '#f4ead2';
    if (pat === 'stripe') { ctx.lineWidth = k * 0.13; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 0.42 * k - 0.3 * k, y + 0.8 * k); ctx.lineTo(x + i * 0.42 * k + 0.4 * k, y - 0.9 * k); ctx.stroke(); } }
    else if (pat === 'dots') { for (const [dx, dy] of DOTS) { ctx.beginPath(); ctx.arc(x + dx * k, y + dy * k, 0.11 * k, 0, 7); ctx.fill(); } }
    else { const cx = x + 0.05 * k, cy = y - 0.12 * k; ctx.beginPath(); ctx.arc(cx, cy, 0.22 * k, 0, 7); ctx.fill(); ctx.lineWidth = k * 0.07; for (let i = 0; i < 8; i++) { const a = i * 0.785; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 0.32 * k, cy + Math.sin(a) * 0.32 * k); ctx.lineTo(cx + Math.cos(a) * 0.5 * k, cy + Math.sin(a) * 0.5 * k); ctx.stroke(); } }
    ctx.restore();
  }
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, k * 0.05); finPath(ctx, x, y, k); ctx.stroke();
}
function label(ctx, t, x, y, px) { ctx.fillStyle = INK; ctx.font = `700 ${Math.round(px)}px "Noto Sans KR",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y); }
/* 무늬 칠하기 판 — 큰 꼬리날개(칠한 만큼) + 고를 무늬 셋 */
function paintCard(ctx, V, sel, strokes) {
  const k = V.H / 768, w = 440 * k, h = 310 * k, x0 = V.W / 2 - w / 2, y0 = V.H * 0.16;
  V.reset(); ctx.fillStyle = '#f4ead2'; ctx.strokeStyle = INK; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 14 * k); ctx.fill(); ctx.stroke();
  drawFin(ctx, x0 + w / 2, y0 + 100 * k, 78 * k, PATS[sel][0], strokes / 3);
  for (let i = 0; i < 3; i++) {
    const cx = x0 + w * (0.2 + i * 0.3), cy = y0 + 214 * k;
    drawFin(ctx, cx, cy, 30 * k, PATS[i][0], 1);
    if (i === sel) { ctx.strokeStyle = '#a83e1e'; ctx.lineWidth = 3 * k; ctx.strokeRect(cx - 44 * k, cy - 40 * k, 88 * k, 92 * k); }
    label(ctx, PATS[i][1], cx, cy + 40 * k, 15 * k);
  }
  label(ctx, strokes ? 'F 칠하기 (' + strokes + ' / 3)' : '←→ 고르기 · F 칠하기', x0 + w / 2, y0 + h - 16 * k, 16 * k);
}
/* 하늘에서 — 내가 그린 꼬리날개(작은 쪽지) */
function finBadge(ctx, V, pat) {
  const k = V.H / 768, w = 120 * k, h = 92 * k, x0 = V.W - w - 14 * k, y0 = 14 * k;
  V.reset(); ctx.fillStyle = '#f4ead2'; ctx.strokeStyle = INK; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 10 * k); ctx.fill(); ctx.stroke();
  drawFin(ctx, x0 + w / 2, y0 + 40 * k, 26 * k, pat, 1); label(ctx, '새 꼬리날개', x0 + w / 2, y0 + h - 14 * k, 13 * k);
}
/* 함께 사는 마을 — 지붕 위 드래곤 · 양 우리 위 테러 · 이웃(이름 없는 역할) */
function life(G) {
  const roof = (k, hx, hy, f, o = {}) => { const d = G.cast.dragon(k, hx, hy - 2.2, Object.assign({ z: 3.3, flip: f, fear: 0 }, o)); d.ySort = 2.6; return d; };
  const L = { nad: roof('nadder', 41, 16, -1), gro: roof('gronckle', 49, 16, -1, { pose: { sit: 1 } }) };
  L.ter = G.cast.dragon('terror', 52, 23.5, { z: 1.4, flip: 1, fear: 0, pose: { wing: 1 }, flapHz: 3 });
  L.zip = G.cast.dragon('zippleback', 36.5, 23.4, { flip: -1, fear: 0 });
  G.cast.person('villager', 38.8, 22.6, { dir: 'side', flip: -1, pose: { cheer: 1 } });
  G.cast.person('villager2', 50.2, 25.4, { dir: 'up' });
  return L;
}
const lifeStep = (G, L) => { L.ter.x = 52 + Math.sin(G.t * 0.9) * 1.6; L.ter.flip = Math.cos(G.t * 0.9) > 0 ? 1 : -1; L.ter.z = 1.4 + Math.sin(G.t * 2.3) * 0.2; };

export const chapter = {
  id: 11, title: '함께 사는 버크', sub: '그 뒤의 버크', place: 'village', time: 'day',
  end: '버크는 이제 드래곤과 함께 산다',
  steps: [
    /* ① 깨어남 — 첫걸음 비틀(처음 몇 걸음 느림) → 투슬리스가 머리로 받쳐 나란히 → 꼬리 끝을 다리 옆에(말 없음) → 광장: 다리 친구 · 그 공책 */
    { id: '11-1', verb: 'walk', goal: '마을 광장까지 걸어가라', at: [17, 17.4], face: [0, 1], limit: 90,
      hints: ['▼ 쪽으로 걸어요 — 처음엔 천천히', '투슬리스가 옆에서 받쳐 줘요 — 곧 괜찮아져요'],
      *run(G) {
        const P = G.P; P.peg = 1;
        const gob = G.cast.person('gobber', 19.6, 18.4, { dir: 'side', flip: -1, pose: { carry: 'hammer' } });
        const T = G.cast.dragon('toothless', 14.8, 18, { flip: 1, fear: 0, pose: { sit: 1 } });
        const st = G.cast.person('stoick', 27.4, 25.4, { dir: 'side', flip: -1, pose: { carry: 'book' } });
        const L = life(G), PL = [24.6, 25.8];
        say(G, 'gobber', '깼구나! 큰 불에서 다쳤지만, 이제 괜찮아.');
        let lx = P.x, ly = P.y, walked = 0, beat = 0, bt = 0, gm = false;
        G.flags.x11 = () => ({ PL, walked: r2(walked) });
        while (!(walked > 3 && near(G, PL[0], PL[1], 1.7))) {
          const dt = yield; lifeStep(G, L);
          /* 첫걸음 비틀 — 처음 1.6m는 아주 천천히 · 3.2m까지 조금 천천히 */
          const mv = Math.hypot(P.x - lx, P.y - ly), lim = (walked < 1.6 ? 1.0 : walked < 3.2 ? 2.4 : 99) * dt;
          if (mv > lim && mv > 0) { const k = lim / mv; P.x = lx + (P.x - lx) * k; P.y = ly + (P.y - ly) * k; P.vx *= 0.6; P.vy *= 0.6; }
          walked += Math.min(mv, lim); lx = P.x; ly = P.y;
          if (walked < 1.6 && mv > 0.001) text(G, P.x + 0.7, P.y - 2, '비틀…', 15);
          /* 투슬리스가 머리로 받쳐 나란히 */
          if (walked > 0.3 && beat !== 1) {
            T.pose.sit = 0; const tx = P.x - 1.1, ty = P.y + 0.3;
            if (Math.hypot(T.x - tx, T.y - ty) > 0.5) { T.to = [tx, ty]; T.spd = Math.max(2.2, Math.hypot(P.vx, P.vy) + 0.8); }
          }
          P.handLock = walked > 0.3 && walked < 3.2 ? 0.8 : 0;
          if (walked > 0.4 && !gm) { gm = true; gob.to = [PL[0] - 1.6, PL[1] - 0.3]; gob.spd = 2.4; }
          /* 꼬리 끝을 다리 옆에(말 없음) */
          if (!beat && walked > 4 && dist(G, PL[0], PL[1]) < 8) { beat = 1; bt = 0; T.to = null; }
          if (beat === 1) { bt += dt; T.flip = P.x > T.x ? -1 : 1; text(G, (P.x + T.x) / 2, P.y - 2.3, '♥', 22, HEART); if (bt > 2.2) beat = 2; }
          goal(G, PL[0], PL[1]);
        }
        goal(G, null); P.handLock = 0;
        faceTo(gob, P.x, P.y); faceTo(st, P.x, P.y); T.to = [P.x - 1.2, P.y + 0.4];
        say(G, 'gobber', '(막대 다리를 툭) 이제 너랑 나랑 다리 친구다.');
        say(G, 'stoick', '이 낙서가 버크를 바꿨구나.', { icons: ['book'] });
        say(G, 'hiccup', '지붕 위에서 드래곤이 낮잠이라니… 여기 버크 맞아?');
        for (let t = 0; t < 1 || talking(G);) { const dt = yield; t += dt; lifeStep(G, L); if (t > 20) break; }
        return true;
      },
      sense: (G) => (G.flags.x11 ? G.flags.x11() : {}) },

    /* ② 먹이 주기 — 생선 바구니(F = 세 마리) → 지붕 위 배고픈 드래곤 쪽을 보고 F(떨어질 곳 고리) → 하트 · 셋 다 먹이면 고버의 새 꼬리날개에 무늬 칠하기 */
    { id: '11-2', verb: 'feed', goal: '배고픈 드래곤에게 생선을', at: [24.6, 25.8], face: [0, 1], limit: 140,
      hints: ['생선 바구니에서 F — 지붕 위 드래곤을 바라보고 F', '드래곤에서 다섯 걸음쯤 떨어져 바라보면 고리가 닿아요'],
      *run(G) {
        const P = G.P; P.peg = 1;
        const basket = G.W.prop('fish_basket', 24.6, 29.1, { n: 3 });
        const HD = [['nadder', 33, 27, -1], ['gronckle', 41, 16, -1], ['nightmare', 9, 16, 1]].map(([k, hx, hy, f]) => { const d = G.cast.dragon(k, hx, hy - 2.2, { z: 3.3, flip: f, fear: 0 }); d.ySort = 2.6; d.hungry = true; d.eatT = 0; d.stand = [hx, hy - 2.2 + 5]; return d; });
        const gob = G.cast.person('gobber', 21.4, 25.4, { dir: 'side', flip: 1 });
        G.cast.dragon('toothless', 26.6, 26.2, { flip: -1, fear: 0 });
        G.cast.person('astrid', 28.2, 25.2, { dir: 'side', flip: -1 });
        say(G, 'astrid', '새로 온 드래곤들이야. 지붕 위에서 배고프대.');
        say(G, 'hiccup', '생선부터!', { icons: ['cod'] });
        let fish = 0, fed = 0, paint = null;
        G.flags.x11 = () => ({ fish, basket: [basket.x, basket.y], ds: HD, paint });
        const LINES = [['astrid', '배고팠구나. 이제 지붕은 덜 긁겠지?'], ['villager', '우리 지붕 위 손님이 웃네!'], ['fishlegs', '먹는 모습도 드래곤 책에 그려야지!']];
        const land = (q) => {
          for (const d of HD) if (d.hungry && Math.hypot(q.x - d.x, (q.y - d.y) * 1.25) < 1.5) {
            d.hungry = false; d.eatT = 1.4; d.pose.eat = 1; fed++; sfx(G, 'purr', d.x); burst('spark', d.x, d.y, d.z + 1, 6, 1.5, 0.5, 0.1, G.rng);
            const [w, t] = LINES[fed - 1]; say(G, w, t, { secs: 2, name: w === 'villager' ? '지붕 집 이웃' : undefined });
            return;
          }
        };
        while (fed < 3) {
          const dt = yield;
          for (const d of HD) {
            if (d.hungry) text(G, d.x, d.y - d.z - 2.4 + Math.sin(G.t * 3 + d.x) * 0.12, '꼬르륵', 15);
            else if (d.eatT > 0) { d.eatT -= dt; text(G, d.x, d.y - d.z - 2.4, '♥', 24, HEART); if (d.eatT <= 0) d.pose.eat = 0; }
          }
          if (!fish) { goal(G, basket.x, basket.y); if (useAt(G, basket.x, basket.y, 1.6)) { fish = 3; P.carry = 'fish'; sfx(G, 'pluck', basket.x); } continue; }
          previewArc(G);
          let tg = null, bd = 1e9; for (const d of HD) if (d.hungry) { const dd = dist(G, d.x, d.y); if (dd < bd) { bd = dd; tg = d; } }
          if (tg) { goal(G, tg.x, tg.y, { h: tg.z + 2.4 }); if (G.diff === 'easy') { G.marks.push({ k: 'ring', x: tg.stand[0], y: tg.stand[1], r: 0.5, c: '#e6c464' }); G.fspots.push({ x: tg.stand[0], y: tg.stand[1] }); } }
          if (G.I.pressed.use && !(P.mashT > 0)) { fish--; if (!fish) P.carry = null; sfx(G, 'whoosh', P.x); throwFrom(G, 'fish', { shot: { land } }); }
        }
        /* 고버의 새 꼬리날개 — 무늬 고르기(←→) · 칠하기(F 세 번 · 마구 누르면 안 칠해짐) */
        goal(G, null); P.carry = null;
        for (let t = 0; t < 1.4;) { const dt = yield; t += dt; for (const d of HD) if (d.eatT > 0) { d.eatT -= dt; text(G, d.x, d.y - d.z - 2.4, '♥', 24, HEART); if (d.eatT <= 0) d.pose.eat = 0; } }
        gob.to = [P.x - 1.4, P.y - 0.2]; gob.spd = 3;
        say(G, 'gobber', '새 꼬리날개다! 무늬는 네가 그려라.', { icons: ['finNew'] });
        yield* until(() => !gob.to, 4);
        faceTo(gob, P.x, P.y); G.hud.howto('paint', 9);
        P.lock = true; paint = { sel: 0, strokes: 0 };
        G.drawOver = (ctx, V) => paintCard(ctx, V, paint.sel, paint.strokes);
        let saidM = false;
        while (paint.strokes < 3) {
          yield;
          if (!paint.strokes) { if (G.I.pressed.left) paint.sel = (paint.sel + 2) % 3; if (G.I.pressed.right) paint.sel = (paint.sel + 1) % 3; }
          if (G.I.pressed.use) { if (P.mashT > 0) { if (!saidM) { saidM = true; say(G, 'gobber', '살살! 붓은 천천히.', { secs: 1.4 }); } } else { paint.strokes++; sfx(G, 'pluck', P.x); } }
        }
        G.inv.finMark = PATS[paint.sel][0];
        G.hud.banner('새 꼬리날개 — ' + PATS[paint.sel][1], 'finNew', 2.6);
        say(G, 'gobber', '멋지다! 이번 건 투슬리스 혼자서도 펼 수 있지!');
        yield* wait(2);
        G.drawOver = null; P.lock = false;
        yield* until(() => !talking(G), 6);
        return true;
      },
      sense: (G) => { const f = G.flags.x11 && G.flags.x11(); if (!f || !f.ds) return {}; return { fish: f.fish, basket: f.basket, ds: f.ds.map((d) => ({ k: d.kind, x: r2(d.x), y: r2(d.y), hungry: d.hungry, stand: d.stand })), paint: f.paint ? { sel: f.paint.sel, strokes: f.paint.strokes } : null }; } },

    /* ③ 마을 위를 함께(이음 비행 · 실패 없음) — 손 흔드는 이웃·친구에게 날아가면 손을 흔들어 줌(하트) → 다섯 곳 → 장 끝 = 엔딩 */
    { id: '11-3', place: 'village', time: 'day', goal: '마을 위를 함께 날아라', at: [24.6, 25.8], zoom: 0.8, limit: 90,
      hints: ['방향키로 날아요 — ▼ 쪽 친구들에게', '가까이 지나가면 손을 흔들어 줘요'],
      *run(G) {
        const F = G.Fl = createFlight(24.6, 25.8, { arena: [3, 4, 61, 38], fin: 'new', rider: 'hiccup' }); G.mode = 'fly'; F.noShoot = true;
        G.camOpt = { fixX: F.x, fixY: F.y - 1.2 };
        const SP = [
          [41, 20.4, ['astrid', 'snotlout'], 'nadder', ['astrid', '꼬리날개 무늬 멋지다!']],
          [52, 24.6, ['villager2'], 'terror', ['villager2', '우리 양도 이제 안 놀라!']],
          [46.5, 33.4, ['fishlegs', 'gobber'], 'gronckle', ['fishlegs', '드래곤 책 마지막 쪽은 오늘이야!']],
          [32, 12.4, ['stoick', 'elder'], null, ['stoick', '저기 봐라, 내 아들이다!']],
          [9, 20.4, ['ruffnut', 'tuffnut'], 'zippleback', ['ruffnut', '우리 가스 머리가 더 빨라!']],
        ].map(([x, y, who, dk, ln]) => ({ x, y, ln, seen: false, wt: 0, ppl: who.map((w, i) => G.cast.person(w, x - 0.7 * (who.length - 1) + i * 1.4, y, { dir: 'down' })), d: dk ? G.cast.dragon(dk, x + 2.4, y + 0.3, { flip: -1, fear: 0 }) : null }));
        G.drawOver = (ctx, V) => finBadge(ctx, V, G.inv.finMark || 'stripe');
        G.flags.x11 = () => ({ spots: SP.map((s) => ({ x: s.x, y: s.y, seen: s.seen })) });
        say(G, 'hiccup', '가자, 투슬리스! 마을 한 바퀴!', { icons: ['finNew'] });
        const wave = (dt) => { for (const s of SP) if (s.wt > 0) { s.wt -= dt; const w = (s.wt * 4 % 1) < 0.5 ? 1 : 0; for (const p of s.ppl) p.pose.cheer = w; text(G, s.x, s.y - 2.6, '♥', 22, HEART); } };
        let n = 0;
        while (n < SP.length) {
          const dt = yield; G.camOpt.fixX = F.x; G.camOpt.fixY = F.y - 1.2; wave(dt);
          let best = null, bd = 1e9;
          for (const s of SP) {
            if (s.seen) continue;
            const d = Math.hypot(F.x - s.x, F.y - s.y);
            if (d < 3.2) { s.seen = true; s.wt = 2.4; n++; sfx(G, 'ok', s.x); if (s.d) { s.d.pose.wing = 1; s.d.z = 0.6; } say(G, s.ln[0], s.ln[1], { secs: 1.8, name: s.ln[0] === 'villager2' ? '양 치는 이웃' : undefined }); }
            else if (d < bd) { bd = d; best = s; }
          }
          if (best) goal(G, best.x, best.y, { h: 2.4 }); else goal(G, null);
        }
        say(G, 'hiccup', '여기는 버크. 눈이 많고, 바람이 세고…');
        say(G, 'hiccup', '이제는 드래곤이 함께 사는 마을.', { icons: ['heart'] });
        for (let t = 0; t < 1 || talking(G);) { const dt = yield; t += dt; G.camOpt.fixX = F.x; G.camOpt.fixY = F.y - 1.2; wave(dt); if (t > 14) break; }
        return true;
      },
      sense: (G) => (G.flags.x11 ? G.flags.x11() : {}) },
  ],
};
