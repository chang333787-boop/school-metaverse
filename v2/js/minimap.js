// v2 미니맵(GAME-FIND-1 · 09-26) — 모든 게임이 같이 쓰는 작은 지도. mapapi.js가 만들어 map.minimap으로 내보낸다(정본 docs/map_api.md §9).
//   그림: 정적 층(건물·운동장·길 — mapapi의 drawMap/mapData 그대로)을 층·크기마다 **한 번만** 오프스크린 캔버스에 굽고,
//         갱신 때는 그 조각 + 표식 + 플레이어 화살표만 덧그린다(움직였거나·돌았거나·깜빡임 단계가 바뀐 때만 · 최대 30Hz).
//   작게 = 플레이어 중심 반경 40m(북쪽이 위) · 크게(M키·지도 클릭) = 학교 전체. 플레이어가 2층(y ≥ 3)이면 2층 그림.
//   자리 = 오른쪽 위 fps 칩 아래(right 10 · top 46). 게임 칩은 mapapi layoutChips가 이 상자(rect) 아래/왼쪽으로 비켜 세운다.
//   import 없음 — 필요한 것은 mapapi가 ctx로 준다. 매 프레임 새 객체·전체 순회 없음(표식 수만큼만).
export function createMinimap(ctx) {
  const { mapData, drawMap, P, getYaw, onLayout } = ctx;
  const SMALL = 170, R = 40, TOP = 46, RIGHT = 10, PAD = 5, CAPH = 15, BG = '#d5dccb';
  const box = document.createElement('div');
  box.className = 'chip';
  box.style.cssText = `right:${RIGHT}px;top:${TOP}px;padding:${PAD}px;border-radius:14px;background:rgba(29,53,87,.55);display:none;cursor:pointer;user-select:none;line-height:0`;
  const cv = document.createElement('canvas'); cv.style.cssText = 'display:block;border-radius:10px';
  const cap = document.createElement('div'); cap.style.cssText = `font-size:11px;line-height:${CAPH}px;height:${CAPH}px;text-align:center;opacity:.9;white-space:nowrap`;
  box.append(cv, cap); document.body.appendChild(box);
  const g = cv.getContext('2d');
  const S = { vis: false, big: false, marks: [], dirty: true, dpr: 1, w: SMALL, h: SMALL, sB: 1, bb: null, fl: 1,
    px: 1e9, pz: 1e9, yaw: 1e9, ph: -1, t: 0, since: 1, ms: 0, drawN: 0, acc: 0, accT: 0, accN: 0 };
  const cache = new Map();   // 정적 층: 'small:층' · 'big:층' → 캔버스(크기·dpr이 바뀌면 비운다)
  const D0 = mapData(1), NB = D0.bounds;   // 길격자 범위 [x0, z0, x1, z1] — 작은 지도 정적 층이 덮는 범위
  { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of D0.boundary) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    S.bb = [x0 - 3, z0 - 3, x1 + 3, z1 + 3]; }   // 큰 지도 = 학교 둘레 + 3m

  function size() {   // 작게 170px 정사각 · 크게 = 화면 높이에 맞춘 학교 전체(아래 🎮 칩·시간 칩 자리 96px는 비운다)
    S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [x0, z0, x1, z1] = S.bb;
    if (S.big) { const hMax = Math.max(200, innerHeight - TOP - 96 - PAD * 2 - CAPH), wMax = Math.max(200, innerWidth * 0.55);
      S.sB = Math.min(hMax / (z1 - z0), wMax / (x1 - x0)); S.w = Math.round((x1 - x0) * S.sB); S.h = Math.round((z1 - z0) * S.sB); }
    else { S.w = S.h = SMALL;
      // TOUCH-1 리뷰(09-26): 터치 화면이면 오른쪽 아래 점프·행동·시점 버튼 위에서 멈춘다(iPhone SE 가로 320px에선 170px 지도가 버튼을 덮었다)
      if (document.body.classList.contains('touch')) { let bt = innerHeight;
        for (const id of ['tJump', 'tAct', 'tView']) { const b = document.getElementById(id); if (!b) continue; const r = b.getBoundingClientRect(); if (r.height > 0) bt = Math.min(bt, r.top); }   // position:fixed라 offsetParent는 늘 null — 크기로 본다
        S.w = S.h = Math.max(96, Math.min(SMALL, Math.floor(bt - 6 - TOP - PAD * 2 - CAPH))); } }
    cv.width = Math.round(S.w * S.dpr); cv.height = Math.round(S.h * S.dpr); cv.style.width = S.w + 'px'; cv.style.height = S.h + 'px';
    cap.textContent = (document.body.classList.contains('touch') ? '' : 'M · ') + (S.big ? '누르면 작게' : '누르면 크게');   // 터치엔 M 키가 없다
    S.dirty = true;
  }
  // 이름표(정적 층에 굽는다): 구역 폭 안에 들어가는 것만 · 같은 이름은 한 번 · 겹치면 건너뜀 · 흰 테두리
  function labels(c, D, s, ox, oz, px) {
    c.font = `700 ${px}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    const used = [], seen = new Set();
    for (const z of D.zones.slice().sort((a, b) => b.area - a.area)) {
      if (seen.has(z.label)) continue;
      const w = c.measureText(z.label).width, zw = (z.x1 - z.x0) * s, zh = (z.z1 - z.z0) * s;
      if (zw < w * 0.8 || zh < px * 0.9) continue;
      const cx = ((z.x0 + z.x1) / 2 - ox) * s, cy = ((z.z0 + z.z1) / 2 - oz) * s;
      if (used.some(u => Math.abs(u[0] - cx) < (u[2] + w) / 2 + 2 && Math.abs(u[1] - cy) < px + 2)) continue;
      used.push([cx, cy, w]); seen.add(z.label);
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = px * 0.3; c.strokeText(z.label, cx, cy); c.fillStyle = '#2b2419'; c.fillText(z.label, cx, cy);
    }
  }
  function layer(fl) {
    const key = (S.big ? 'big:' : 'small:') + fl; let c = cache.get(key); if (c) return c;
    c = document.createElement('canvas'); const x = c.getContext('2d');
    if (S.big) { const [x0, z0, x1, z1] = S.bb, s = S.sB * S.dpr; c.width = Math.round((x1 - x0) * s); c.height = Math.round((z1 - z0) * s);
      drawMap(x, { floor: fl, scale: s, x0, z0, labels: false, player: false }); labels(x, mapData(fl), s, x0, z0, 10 * S.dpr); }
    else { const s = SMALL / (2 * R) * S.dpr; c.width = Math.round((NB[2] - NB[0]) * s); c.height = Math.round((NB[3] - NB[1]) * s);
      drawMap(x, { floor: fl, scale: s, x0: NB[0], z0: NB[1], labels: false, player: false }); labels(x, mapData(fl), s, NB[0], NB[1], 10 * S.dpr); }
    cache.set(key, c); return c;
  }

  // ---------- 그리기(바뀐 때만) ----------
  const TAU = Math.PI * 2;
  function star(c, x, y, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
  function draw() {
    const t0 = performance.now(), d = S.dpr, W = cv.width, H = cv.height, fl = S.fl, st = layer(fl);
    let sc, ox, oz;   // 월드 → 캔버스: X = (x - ox)·sc
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    if (S.big) { sc = S.sB * d; ox = S.bb[0]; oz = S.bb[1]; g.drawImage(st, 0, 0); }
    else {
      sc = SMALL / (2 * R) * d; ox = P.x - W / 2 / sc; oz = P.z - H / 2 / sc;
      const sx = (ox - NB[0]) * sc, sy = (oz - NB[1]) * sc, ix0 = Math.max(0, sx), iy0 = Math.max(0, sy), ix1 = Math.min(st.width, sx + W), iy1 = Math.min(st.height, sy + H);
      g.fillStyle = BG; g.fillRect(0, 0, W, H);
      if (ix1 > ix0 && iy1 > iy0) g.drawImage(st, ix0, iy0, ix1 - ix0, iy1 - iy0, ix0 - sx, iy0 - sy, ix1 - ix0, iy1 - iy0);
      g.font = `700 ${10 * d}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineJoin = 'round';
      g.lineWidth = 3 * d; g.strokeStyle = 'rgba(255,255,255,.9)'; g.strokeText('북', W / 2, 3 * d); g.fillStyle = '#b3261e'; g.fillText('북', W / 2, 3 * d);
    }
    // 표식: 작은 지도 밖이면 가장자리에 붙여(방향만) 작게 · 다른 층이면 속 빈 점 + '2층' · blink = 깜빡임(완전히 사라지지는 않음)
    const on = S.ph % 2 === 0, e = 9 * d;
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `700 ${11 * d}px sans-serif`;
    for (const m of S.marks) {
      let X = (m.x - ox) * sc, Y = (m.z - oz) * sc, out = false;
      if (!S.big && (X < e || X > W - e || Y < e || Y > H - e)) { out = true; const dx = X - W / 2, dy = Y - H / 2, k = Math.min((W / 2 - e) / Math.max(Math.abs(dx), 1e-6), (H / 2 - e) / Math.max(Math.abs(dy), 1e-6)); X = W / 2 + dx * k; Y = H / 2 + dy * k; }
      const other = m.floor && m.floor !== fl, col = m.color || '#e0503c', r = (m.r || (m.shape === 'star' ? 5 : 5.5)) * d * (out ? 0.8 : 1);
      g.globalAlpha = m.blink && !on ? 0.3 : 1;
      if (m.shape === 'star') star(g, X, Y, r * 1.25); else { g.beginPath(); g.arc(X, Y, r, 0, TAU); }
      if (other || m.shape === 'ring') { g.lineWidth = 2.5 * d; g.strokeStyle = col; g.stroke(); }
      else { g.fillStyle = col; g.fill(); g.lineWidth = 1.5 * d; g.strokeStyle = '#fff'; g.stroke(); }
      if (out) { const a = Math.atan2(Y - H / 2, X - W / 2); g.beginPath(); g.moveTo(X + Math.cos(a) * (r + 5 * d), Y + Math.sin(a) * (r + 5 * d));
        g.lineTo(X + Math.cos(a + 2.4) * (r + 1 * d), Y + Math.sin(a + 2.4) * (r + 1 * d)); g.lineTo(X + Math.cos(a - 2.4) * (r + 1 * d), Y + Math.sin(a - 2.4) * (r + 1 * d)); g.closePath(); g.fillStyle = col; g.fill(); }
      g.globalAlpha = 1;
      const lab = m.label ? m.label + (other ? ' (' + m.floor + '층)' : '') : '';
      if (lab) { const w = g.measureText(lab).width; let lx = X + r + 4 * d; if (lx + w > W - 2 * d) lx = X - r - 4 * d - w; const ly = Math.min(H - 8 * d, Math.max(8 * d, Y));
        g.lineWidth = 3 * d; g.strokeStyle = 'rgba(255,255,255,.92)'; g.strokeText(lab, lx, ly); g.fillStyle = '#1d3557'; g.fillText(lab, lx, ly); }
    }
    // 플레이어 화살표(카메라가 보는 쪽 · 방위 0 = 위)
    const X = (P.x - ox) * sc, Y = (P.z - oz) * sc;
    g.translate(X, Y); g.rotate(-getYaw());
    g.beginPath(); g.moveTo(0, -9 * d); g.lineTo(6.5 * d, 7 * d); g.lineTo(0, 3.5 * d); g.lineTo(-6.5 * d, 7 * d); g.closePath();
    g.fillStyle = '#2f6fd0'; g.fill(); g.lineWidth = 2 * d; g.strokeStyle = '#fff'; g.stroke();
    g.setTransform(1, 0, 0, 1, 0, 0);
    S.drawN++; return performance.now() - t0;
  }

  // ---------- 틱(mapapi.tick — 매 프레임) ----------
  function tick(dt) {
    if (!S.vis) return;
    S.t += dt; S.since += dt; S.accT += dt; S.accN++;
    const fl = P.y >= 3 ? 2 : 1, yaw = getYaw(), ph = S.marks.some(m => m.blink) ? Math.floor(S.t * 3.2) : 0;
    if (fl !== S.fl) { S.fl = fl; S.dirty = true; }
    if (ph !== S.ph) { S.ph = ph; S.dirty = true; }
    if (Math.abs(P.x - S.px) > 0.12 || Math.abs(P.z - S.pz) > 0.12 || Math.abs(yaw - S.yaw) > 0.03) S.dirty = true;
    if (S.dirty && S.since >= 1 / 30) { S.since = 0; S.dirty = false; S.px = P.x; S.pz = P.z; S.yaw = yaw; S.acc += draw(); }
    if (S.accT >= 2) { S.ms = S.acc / Math.max(1, S.accN); S.acc = S.accT = S.accN = 0; }   // 한 프레임 평균(그리지 않은 프레임 포함) — 예산 0.3ms
  }
  function show(o = {}) {
    if (o.marks) setMarks(o.marks);
    if (o.big !== undefined && !!o.big !== S.big) S.big = !!o.big;
    if (!S.vis) { S.vis = true; box.style.display = ''; S.fl = P.y >= 3 ? 2 : 1; }
    size(); onLayout && onLayout(); S.since = 1; tick(0);
    return { remove: hide };
  }
  function hide() { if (!S.vis) return; S.vis = false; box.style.display = 'none'; S.big = false; onLayout && onLayout(); }   // 표식은 남긴다(게임 범위 파사드가 stop 때 setMarks([]))
  function setMarks(list) { S.marks = (list || []).filter(m => m && isFinite(m.x) && isFinite(m.z)); S.dirty = true; }
  function toggle(v) { if (!S.vis) return false; S.big = v === undefined ? !S.big : !!v; size(); onLayout && onLayout(); S.since = 1; tick(0); return S.big; }
  box.addEventListener('click', e => { e.stopPropagation(); toggle(); });
  addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat && S.vis) toggle(); });
  addEventListener('resize', () => { cache.clear(); if (S.vis) { size(); onLayout && onLayout(); } });
  // 칩 배치용 — 보일 때 상자의 화면 자리(CSS px)
  const rect = () => S.vis ? { right: RIGHT, top: TOP, w: S.w + PAD * 2, h: S.h + PAD * 2 + CAPH, big: S.big } : null;
  return { show, hide, setMarks, toggle, tick, rect, el: box, canvas: cv,
    get visible() { return S.vis; }, get big() { return S.big; }, get marks() { return S.marks.slice(); }, get ms() { return S.ms; }, get draws() { return S.drawN; } };
}
