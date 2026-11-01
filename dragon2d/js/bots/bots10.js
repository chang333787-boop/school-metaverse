// 10~11장 봇 — DRG2.sense()(화면에 보이는 것)만 읽고 키만 누름 · 무엇을 할지(기회·창)는 늦은 화면(H.late) · 피하기·겨누기·걷기는 지금 화면(H.now)
// 누름 상한은 bots.js 손(H.tap 0.26초)을 그대로 · 쏘기·던지기는 1초에 한 번 이하(연타 X)
const away = (v, c, half, lo, hi, pad = 0.8) => {           /* 띠(가운데 c · 반폭 half) 밖으로 나갈 쪽 — 벽(lo·hi) 안에서 가까운 쪽 */
  const up = c - half - pad, dn = c + half + pad, okU = up >= lo, okD = dn <= hi;
  if (okU && okD) return Math.abs(v - up) < Math.abs(v - dn) ? -1 : 1;
  return okD ? 1 : -1;
};

export const BOTS_10 = {
  /* ① 해변 — 굳은 불 띠는 위아래로 비킴 · 머리가 내려오면(늦은 화면도) 눈 밑 5m에 서서 위를 보고 F */
  '10-1': (H) => {
    const x = H.now.x || {}, L = H.late.x || {}, me = H.now.me; if (!x.B || !me) return;
    if (x.band && x.band.lock) {
      if (Math.abs(me.y - x.band.y) < x.band.h / 2 + 0.7) { H.hold(away(me.y, x.band.y, x.band.h / 2, x.gate[0], x.gate[1]) > 0 ? 'down' : 'up'); H.hold('run'); }
      return;
    }
    if (x.ph === 'stun') return;
    if (x.ph === 'low' && L.ph === 'low') {
      if (H.walk(x.eye[0], x.eye[1] + 5, 0.25, { run: true }) && H.face(0, -1) && Math.hypot(me.vx, me.vy) < 0.4 && x.carry) H.tap('use', 1.1);
      return;
    }
    H.walk(x.B[0], x.stand, 0.4);
  },
  /* ② 물속 — 가까운 덤불부터 · 투슬리스가 보이면 고리 앞에서 숨 고를 때(지금·늦은 화면 둘 다)만 F 꾹 */
  '10-2': (H) => {
    const x = H.now.x || {}, L = H.late.x || {}, me = H.now.me; if (!x.ends || !me) return;
    if (x.ring) { if (H.walk(x.ring[0], x.ring[1] + 0.6, 0.4) && x.calm && L.calm) H.hold('use'); return; }
    let e = null, bd = 1e9;
    for (const q of x.ends) if (!q.seen) { const d = Math.hypot(q.x - me.x, q.y - me.y); if (d < bd) { bd = d; e = q; } }
    if (e) H.walk(e.x, e.y + 0.8, 0.6);
  },
  /* ③ 하늘 싸움 — 굳은 띠 밖으로 · 구름에 숨어 날개 막(머리에서 2.4~6.6m)이 위로 올 때 1초에 한 발 · 들키면 다른 구름으로 */
  '10-3': (H) => {
    const x = H.now.x || {}, F = H.now.fly; if (!F || !x.B) return;
    const A = x.A, b = x.band, bx = x.B[0];
    if (b && b.lock) {
      if (b.k === 'col' && Math.abs(F.x - b.x) < b.w / 2 + 1.1) { H.hold(away(F.x, b.x, b.w / 2, A[0] + 0.5, A[2] - 0.5, 1.1) > 0 ? 'right' : 'left'); return; }
      if (b.k === 'row' && Math.abs(F.y - b.y) < b.h / 2 + 1.1) { H.hold(away(F.y, b.y, b.h / 2, A[1] + 0.3, A[3] - 0.3, 1.1) > 0 ? 'down' : 'up'); return; }
    }
    let tg = null, bs = -1e9;
    for (const c of F.ob || []) {
      if (c.k !== 'cloud') continue;
      const o = Math.abs(c.x - bx), sc = (o > 2.4 && o < 6.6 ? 60 : 0) + Math.min(o, 9) * 2 - Math.abs(c.x - F.x) * 0.8 - Math.abs(c.y - F.y) * 0.5;
      if (sc > bs) { bs = sc; tg = c; }
    }
    if (!tg) return;
    if (tg.x - F.x > 0.5) H.hold('right'); else if (tg.x - F.x < -0.5) H.hold('left');
    if (tg.y - F.y > 0.4) H.hold('down'); else if (tg.y - F.y < -0.4) H.hold('up');
    const o = Math.abs(F.x - bx);
    if (F.hidden && o > 2.2 && o < 6.8) H.tap('use', 1.0);
  },
  /* ④ 마지막 — 오르기 → (숨 들이켬) 입 x로 맞추고 ↓ → 입이 가장 밝을 때(늦은 화면도) F → ↑ */
  '10-4': (H) => {
    const x = H.now.x || {}, L = H.late.x || {}, F = H.now.fly; if (!F || !x.ph) return;
    const steer = (tx) => { if (tx - F.x > 0.3) H.hold('right'); else if (tx - F.x < -0.3) H.hold('left'); };
    if (x.ph === 'inhale' || x.ph === 'bright') {
      steer(x.mouth[0]);
      if (F.y < x.mouth[1] - 2.2) H.hold('down');
      if (x.ph === 'bright' && L.glow >= 0.75 && x.inZone) H.tap('use', 0.8);
      return;
    }
    H.hold('up'); steer(x.ph === 'fire' ? x.mouth[0] + 4.5 : x.mouth[0]);
  },
  /* ⑤ 연기 속(스토이크) — 투슬리스 옆으로 걸어가 F */
  '10-5': (H) => { const x = H.now.x || {}; if (x.T && H.walk(x.T[0] + 1.3, x.T[1] + 0.3, 0.4)) H.tap('use', 0.8); },
  /* 11장 ① 광장까지 */
  '11-1': (H) => { const x = H.now.x || {}; if (x.PL) H.walk(x.PL[0], x.PL[1], 0.6); },
  /* 11장 ② 바구니 → 배고픈 드래곤 밑 5m에서 위를 보고 F · 무늬는 F 세 번(0.6초 간격) */
  '11-2': (H) => {
    const x = H.now.x || {}, me = H.now.me; if (!x.ds || !me) return;
    if (x.paint) { if (x.paint.strokes < 3) H.tap('use', 0.6); return; }
    const flying = H.now.shots.some((s) => s.mine);
    if (!x.fish) { if (!flying && H.walk(x.basket[0], x.basket[1] + 0.9, 0.5)) H.tap('use', 0.8); return; }
    const d = x.ds.find((q) => q.hungry); if (!d) return;
    if (H.walk(d.stand[0], d.stand[1], 0.25) && H.face(0, -1) && Math.hypot(me.vx, me.vy) < 0.3 && !flying) H.tap('use', 1.1);
  },
  /* 11장 ③ 마을 위 — 가장 가까운 안 들른 곳으로 */
  '11-3': (H) => {
    const x = H.now.x || {}, F = H.now.fly; if (!F || !x.spots) return;
    let s = null, bd = 1e9; for (const q of x.spots) if (!q.seen) { const d = Math.hypot(q.x - F.x, q.y - F.y); if (d < bd) { bd = d; s = q; } }
    if (!s) return;
    if (s.x - F.x > 0.5) H.hold('right'); else if (s.x - F.x < -0.5) H.hold('left');
    if (s.y - F.y > 0.5) H.hold('down'); else if (s.y - F.y < -0.5) H.hold('up');
  },
};
