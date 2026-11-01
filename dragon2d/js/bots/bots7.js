// 7~9장 봇 — bots.js의 mkHand 손(H)을 받음 · 화면에 보이는 것(sense)만 읽고 키만 누름
// '무엇을 할지'(예고·기회)는 늦은 화면(H.late) + 지금 화면(H.now)이 둘 다 맞을 때 · 걷기·피하기는 지금 화면
import { flyBot } from './bots.js?v=1';

const dist = (a, b, x, y) => Math.hypot(a - x, b - y);

export const BOTS_7 = {
  /* 7-1 아빠 곁에 붙어 걷기 — 아빠가 지나간 자리를 따라감 */
  '7-1': (H) => { const x = H.now.x || {}, me = H.now.me; if (!x.st) return; if (dist(me.x, me.y, x.st[0], x.st[1]) > 1.6) H.walk(x.st[0], x.st[1], 0.8); },
  /* 7-2 그롱클 — 쏘기 전엔 옆에서 기다리며 피하기 · '휴…' 틈(늦은·지금 화면 둘 다)이면 다가가 F · 끝나면 게시판 */
  '7-2': (H) => {
    const x = H.now.x || {}, L = H.late.x || {}, me = H.now.me;
    if (x.board) { H.walk(x.board[0], x.board[1] + 0.9, 0.5); return; }
    if (!x.D || x.D.st === 'calm' || x.D.st === 'down') return;
    if (H.dodge()) return;
    const D = x.D, ld = L.D || D;
    if (ld.st === 'gap' && D.st === 'gap') { if (H.walk(D.x, D.y + 1.5, 0.4)) H.tap('use', 0.6); }
    else H.walk(D.x + (D.x < 15 ? 3.6 : -3.6), D.y + 2.5, 0.8);
  },
  /* 7-3 눈길 피하기 — 딴 데 보면(늦은·지금 화면) 걸어서 지나감 · 아니면 통 곁에서 숨음(C) · 통이 멀고 길을 보는 중이면 부채꼴 밖에서 기다림 */
  '7-3': (H) => {
    const x = H.now.x || {}, L = H.late.x || {}, me = H.now.me; if (!x.ws || !x.covers) return;
    let w = null, wi = -1;
    x.ws.forEach((q, i) => { if (me.x > q.x - 1.6 && (!w || q.x > w.x)) { w = q; wi = i; } });
    if (!w) { H.walk(2, 18, 0.8); return; }
    const lw = (L.ws || [])[wi] || w, cv = x.covers[wi];
    if (w.ph === 'away' && lw.ph === 'away') { H.walk(w.x - 2.2, 18.3, 0.4); return; }
    if (me.x > cv[0] + 0.7) {
      if (me.x > w.x + w.R + 0.6 && (w.ph === 'street' || me.x - cv[0] > 2.6)) { H.walk(w.x + w.R + 1.3, 18.2, 0.4); return; }
      H.walk(cv[0], cv[1] + 0.7, 0.3); return;
    }
    if (dist(me.x, me.y, cv[0], cv[1]) < 1.0) { H.sneak(true); return; }
    H.walk(cv[0], cv[1] + 0.7, 0.3);
  },
  /* 8-1 화난 비행 — 재주(늦은·지금 화면이 같은 재주)면 반대쪽 키를 새로 누름 */
  '8-1': (H) => { const tr = (H.now.x || {}).tr, lt = (H.late.x || {}).tr; if (tr && lt && tr.id === lt.id && !tr.done) H.tap(tr.need, 0.3); },
  /* 8-2 구름 틈 — 노란 고리 x로 */
  '8-2': (H) => { const h = (H.now.x || {}).hole; flyBot(H, { lane: [10, 38], target: h ? h[0] : 24 }); },
  /* 8-3 떼 — 가운데 줄을 따라감 · 밀려오는 드래곤이 보이면(늦은 화면) 그 반대쪽 2m */
  '8-3': (H) => {
    const x = H.now.x || {}, L = H.late.x || {}; if (x.cx == null) return;
    let tg = x.cx;
    if (x.intr && L.intr) tg = x.cx + (x.intr.tx - x.cx >= 0 ? -2.0 : 2.0);
    flyBot(H, { lane: [8, 40], target: tg });
  },
  /* 8-4 둥지 — 킁킁 예고·킁킁이면 낮추고 멈춤 · 아니면 낮게(C) 걸어감(바위 북쪽 길) */
  '8-4': (H) => {
    const x = H.now.x || {}, L = H.late.x || {};
    const danger = x.ph === 'pre' || x.ph === 'sniff' || L.ph === 'pre' || L.ph === 'sniff' || x.ph === 'wake';
    if (danger) { H.sneak(true); return; }
    H.walk(48.6, 5.4, 0.6, { sneak: true });
  },
  /* 9-1 나이트메어 — 7.5m 밖에서 나를 볼 때 F(무기 → 투구) → 살금살금 → 눈이 풀리면 F 꾹 · 불이면 피하기 */
  '9-1': (H) => {
    const x = H.now.x || {}, L = H.late.x || {}, me = H.now.me; if (!x.D) return;
    if (H.dodge()) return;
    if (x.fire) { H.sneak(false); H.walk(x.D[0] + (me.x < x.D[0] ? -4 : 4), x.D[1] + 6, 0.8); return; }
    const d = dist(me.x, me.y, x.D[0], x.D[1]);
    if (x.ph === 'weapon' || x.ph === 'helmet') { if (H.walk(x.D[0], x.D[1] + 7.5, 0.6)) { if (x.look === 1 && L.look === 1 && L.ph === x.ph) H.tap('use', 1.0); } return; }
    if (d > 2.9) { H.walk(x.D[0], x.D[1] + 2.6, 0.3, { sneak: true }); return; }
    H.sneak(true);
    if (x.fear < 0.35) H.hold('use');
  },
  /* 9-2 20초 버티기 — 붉은 고리·불 줄 피하기 · 나이트메어 비스듬히 6m */
  '9-2': (H) => {
    if (H.dodge()) return;
    const me = H.now.me, D = H.now.actors.find((a) => a.k === 'nightmare'); if (!D) return;
    const side = me.x < D.x ? -1 : 1;
    H.walk(Math.max(5, Math.min(25, D.x + side * 6)), Math.min(17, D.y + 4.5), 1.2);
  },
  /* 9-3 둘 사이 — 고리 가운데를 따라가며 F 꾹 */
  '9-3': (H) => { const z = (H.now.x || {}).zone, me = H.now.me; if (!z) return; H.walk(z[0], z[1], 0.25); if (Math.hypot(me.x - z[0], (me.y - z[1]) * 1.25) < z[2] * 0.85) H.hold('use'); },
  /* 9-4 회관 — 아빠 앞에서 F(보여 주기 · 한 번 더) */
  '9-4': (H) => { const x = H.now.x || {}; if (!x.dad) return; if (H.walk(x.dad[0], x.dad[1] + 1.3, 0.4) && (x.ph === 'show' || x.ph === 'again')) H.tap('use', 0.8); },
  /* 9-5 (이음) 선착장 — 갈 곳 ▼로 */
  '9-5': (H) => { const g = H.now.goalXY; if (g) H.walk(g[0], g[1], 0.8); },
  /* 9-6 친구 넷 — 문 앞 F → 그롱클 틈 F · 나이트메어 불 예고 동안 사이 고리에서 F 꾹 · 지플백 두 머리 함께 숙일 때 F · 내더 살금살금 턱 밑 F 꾹 */
  '9-6': (H) => {
    const x = H.now.x || {}, L = H.late.x || {}, me = H.now.me;
    if (x.ph === 'cage' && x.cage) { if (H.walk(x.cage[0], x.cage[1] + 1.2, 0.4)) H.tap('use', 0.8); return; }
    if (x.ph !== 'act' || !x.D) return;
    const D = x.D;
    if (x.pi === 0) {
      if (H.dodge()) return;
      const ld = L.D || D;
      if (L.pi === 0 && ld.st === 'gap' && D.st === 'gap') { if (H.walk(D.x, D.y + 1.4, 0.4)) H.tap('use', 0.6); }
      else H.walk(D.x + (D.x < 15 ? 3.6 : -3.6), D.y + 3.2, 0.8);
      return;
    }
    if (x.pi === 1) { if (!x.zone) return; if (H.walk(x.zone[0], x.zone[1], 0.25) && x.tell) H.hold('use'); return; }
    if (x.pi === 2) { if (H.walk(D.x - 0.5, D.y + 1.6, 0.4)) { if (x.both && L.both && L.pi === 2) H.tap('use', 0.8); } return; }
    const d = dist(me.x, me.y, D.x, D.y);
    if (d > 2.0) { H.walk(D.x, D.y + 1.6, 0.3, { sneak: true }); return; }
    H.sneak(true);
    if (D.fear < 0.35) H.hold('use');
  },
};
