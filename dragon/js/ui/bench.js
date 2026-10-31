// 작업대 판(5장 대장간 · 6장 안장·무늬) — 종이 위 손그림 판 하나에 박자 놀이 · 막대 채우기 X(눈으로 보는 모양: 칼날 길 · 풀무 주머니 · 쇠 색 · 바늘)
// 자르기(모서리에 닿을 때 Space) · 풀무 바람 시험(주머니가 찰 때 Space · 휘는 쪽 보고 A/D로 살 옮기기) · 망치(쇠가 주황~노랑일 때 F) · 바느질(바늘이 구멍 위일 때 Space) · 무늬 그리기
// 각 놀이 = 생성기(yield dt) → true(끝) · 실패 자리는 그 마디만 다시(5초 안) · 연타 = 엉킴/쨍(손해)
const CSS = `#bench { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); z-index:28; width:min(760px,94vw); height:min(470px,74vh); background:#efe2c4; border:3px solid #2b2118; border-radius:12px 18px 14px 20px / 18px 12px 20px 14px; box-shadow:4px 5px 0 rgba(43,33,24,.35); pointer-events:none; }
#bench canvas { width:100%; height:100%; display:block; } #bench.gone { display:none; }`;
const INK = '#2b2118';
export function createBench() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'bench'; el.className = 'gone'; const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 620; el.appendChild(cv); document.body.appendChild(el);
  const X = cv.getContext('2d');
  const B = { el, S: {} };
  const clear = (title) => { X.fillStyle = '#efe2c4'; X.fillRect(0, 0, 1000, 620); X.fillStyle = INK; X.font = 'bold 30px sans-serif'; X.fillText(title, 30, 48); };
  B.show = () => el.classList.remove('gone'); B.hide = () => el.classList.add('gone');
  const tapped = (I, k) => I.tap(k);

  /* ① 가죽 자르기 — 오른 날개를 뒤집은 모양 · 칼날이 선을 따라가다 모서리(점)에 닿는 순간 Space로 꺾음 · 놓치면 그 마디를 다시 */
  B.cut = function* (I, easy) {
    B.show();
    const P = [[180, 470], [260, 200], [430, 130], [600, 160], [760, 290], [820, 470], [500, 420], [180, 470]];   // 날개 뒤집은 바깥 선(모서리 일곱)
    let seg = 0, t = 0, miss = 0, ok = [];
    const spd = easy ? 0.32 : 0.48, win = easy ? 0.16 : 0.1;          // 마디당 걸음 · 모서리 창(비율)
    B.S = { kind: 'cut' };
    while (seg < P.length - 1) {
      const dt = yield; t += dt * spd;
      const a = P[seg], b = P[seg + 1], x = a[0] + (b[0] - a[0]) * Math.min(1, t), y = a[1] + (b[1] - a[1]) * Math.min(1, t);
      const near = t > 1 - win && t < 1 + win;
      B.S.corner = near; B.S.t = +t.toFixed(2); B.S.seg = seg;
      if (tapped(I, 'jump')) { if (near) { ok.push(seg); seg++; t = 0; } else { miss++; t = 0; B.S.oops = 0.6; } }
      if (t > 1 + win) { miss++; t = 0; B.S.oops = 0.6; }                       // 지나침 = 그 마디 다시
      if (B.S.oops > 0) B.S.oops -= dt;
      clear('가죽 자르기 — 모서리에 닿을 때 Space');
      X.setLineDash([10, 10]); X.lineWidth = 4; X.strokeStyle = '#8a7a62'; X.beginPath(); P.forEach(([px, py], i) => (i ? X.lineTo(px, py) : X.moveTo(px, py))); X.stroke(); X.setLineDash([]);
      X.strokeStyle = INK; X.lineWidth = 6; X.beginPath(); X.moveTo(P[0][0], P[0][1]); for (let i = 0; i < seg; i++) X.lineTo(P[i + 1][0], P[i + 1][1]); X.lineTo(x, y); X.stroke();
      P.forEach(([px, py], i) => { X.fillStyle = i <= seg ? INK : '#a83e1e'; X.beginPath(); X.arc(px, py, i === seg + 1 ? 13 : 8, 0, 6.3); X.fill(); });
      X.fillStyle = B.S.oops > 0 ? '#a83e1e' : '#cfd4d6'; X.beginPath(); X.moveTo(x, y); X.lineTo(x - 14, y - 40); X.lineTo(x + 14, y - 40); X.closePath(); X.fill(); X.stroke();
      X.fillStyle = INK; X.font = '24px sans-serif'; X.fillText('남은 날개를 뒤집은 모양', 600, 590);
    }
    B.S = {}; return { miss };
  };
  /* ② 바람 시험 — 풀무 주머니가 가득 찰 때 Space(박자) → 바람 → 날개가 휘는 쪽을 보고 A/D로 살을 옮겨 곧게 · 곧으면 끝 */
  B.wind = function* (I, easy, G) {
    B.show();
    let ph = 0, gust = 0, bend = (G && G.rng() < 0.5 ? -1 : 1) * (0.7 + (G ? G.rng() : 0.5) * 0.3), strut = 0, good = 0, puffs = 0, tangle = 0;
    B.S = { kind: 'wind' };
    while (good < (easy ? 2 : 3)) {
      const dt = yield; ph += dt * 1.1; const full = (Math.sin(ph * Math.PI * 2) + 1) / 2;   // 주머니 0~1
      if (tapped(I, 'jump')) { if (full > 0.8 && tangle <= 0) { gust = 1; puffs++; } else { tangle = 0.9; } }
      if (tangle > 0) tangle -= dt;
      gust = Math.max(0, gust - dt * 1.2);
      const res = bend - strut * 0.35, straight = Math.abs(res) < 0.2, shown = res * gust;   // 바람이 불 때만 휨이 보임
      if (I.tap('left') || I.tap('right')) { if (!straight) strut += I.tap('right') ? 1 : -1; }
      if (straight && gust > 0.6 && !B.S.counted) { B.S.counted = true; good++; }
      if (gust < 0.1) B.S.counted = false;
      B.S.full = +full.toFixed(2); B.S.bend = +shown.toFixed(2); B.S.straight = straight; B.S.tangle = tangle > 0;
      clear('바람 시험 — 풀무가 찰 때 Space · 휘면 A/D로 살 옮기기');
      /* 풀무 주머니 */
      X.fillStyle = '#8a5a32'; X.beginPath(); X.ellipse(170, 380, 80 + full * 50, 50 + full * 50, 0, 0, 6.3); X.fill(); X.strokeStyle = INK; X.lineWidth = 4; X.stroke();
      X.beginPath(); X.moveTo(250 + full * 50, 380); X.lineTo(360, 380); X.lineWidth = 12; X.stroke();
      if (tangle > 0) { X.fillStyle = '#a83e1e'; X.font = 'bold 26px sans-serif'; X.fillText('엉켰다!', 110, 260); }
      /* 바람 줄 */
      if (gust > 0.05) { X.strokeStyle = 'rgba(43,33,24,' + gust + ')'; X.lineWidth = 3; for (let k = 0; k < 4; k++) { X.beginPath(); X.moveTo(380, 330 + k * 30); X.lineTo(460 + gust * 60, 330 + k * 30); X.stroke(); } }
      /* 꼬리날개(살 셋) — 바람에 휨 */
      const bx = 640, by = 380; X.strokeStyle = INK; X.lineWidth = 4;
      X.fillStyle = '#8a5a32'; X.beginPath(); X.moveTo(bx - 120, by); X.quadraticCurveTo(bx, by - 150 + shown * 30, bx + 150 + shown * 70, by - 40 + shown * 60); X.quadraticCurveTo(bx + 40, by + 40, bx - 120, by); X.fill(); X.stroke();
      for (let k = 0; k < 3; k++) { const sx = bx - 60 + k * 60 + strut * 18 * (k === 1 ? 1 : 0.4); X.beginPath(); X.moveTo(bx - 110, by); X.lineTo(sx + shown * 30 * (k + 1) / 3, by - 120 + k * 30); X.stroke(); }
      X.fillStyle = INK; X.font = '24px sans-serif'; X.fillText(B.S.straight ? '곧다!' : '', 860, 220);
    }
    B.S = {}; return { puffs };
  };
  /* ③ 망치 — 쇠 색이 어두운 빨강 → 주황 → 노랑 → 식음을 되풀이 · 주황~노랑일 때 F · 식었을 때 치면 쨍(그 번은 무효 + 잠깐 손 저림) */
  B.hammer = function* (I, easy, n = 4, title = '방패 덧대기 — 쇠가 주황·노랑일 때 F') {
    B.show();
    let k = 0, ph = 0.15, numb = 0, crack = 0;
    B.S = { kind: 'hammer' };
    const cols = ['#4a1c14', '#8a2a14', '#c8501e', '#f08a2a', '#ffc85a', '#f08a2a', '#c8501e', '#8a2a14'];
    while (k < n) {
      const dt = yield; ph = (ph + dt * (easy ? 0.32 : 0.42)) % 1;
      const c = Math.floor(ph * cols.length), hot = c >= 3 && c <= 5;
      if (numb > 0) numb -= dt; if (crack > 0) crack -= dt;
      if (I.tap('use') && numb <= 0) { if (hot) { k++; B.S.hitT = 0.25; ph = 0.05; } else { numb = 0.8; crack = 0.6; } }
      if (B.S.hitT > 0) B.S.hitT -= dt;
      B.S.hot = hot; B.S.k = k; B.S.numb = numb > 0;
      clear(title);
      X.fillStyle = '#5a5650'; X.beginPath(); X.moveTo(300, 470); X.lineTo(700, 470); X.lineTo(640, 400); X.lineTo(360, 400); X.closePath(); X.fill();
      X.fillStyle = cols[c]; X.beginPath(); X.ellipse(500, 380, 150, 40, 0, 0, 6.3); X.fill(); X.strokeStyle = INK; X.lineWidth = 4; X.stroke();
      const up = B.S.hitT > 0 ? 0 : 1; X.save(); X.translate(640, 300 - up * 60); X.rotate(-0.6 * up); X.fillStyle = '#8d8a82'; X.fillRect(-60, -30, 120, 60); X.fillStyle = '#6a4a2e'; X.fillRect(40, -8, 160, 16); X.restore();
      if (crack > 0) { X.fillStyle = '#a83e1e'; X.font = 'bold 34px sans-serif'; X.fillText('쨍!', 470, 300); }
      for (let q = 0; q < n; q++) { X.beginPath(); X.arc(380 + q * 60, 560, 16, 0, 6.3); X.fillStyle = q < k ? INK : '#efe2c4'; X.fill(); X.stroke(); }
    }
    B.S = {}; return { k };
  };
  /* ④ 바느질(안장) — 바늘이 좌우로 오가다 구멍 위에 올 때 Space · 엇박 = 실 엉킴 */
  B.stitch = function* (I, easy, n = 6) {
    B.show();
    let k = 0, ph = 0, tangle = 0;
    const holes = []; for (let q = 0; q < n; q++) holes.push(260 + q * 90);
    B.S = { kind: 'stitch' };
    while (k < n) {
      const dt = yield; ph += dt * (easy ? 0.9 : 1.25);
      const x = 500 + Math.sin(ph * Math.PI) * 330, tgt = holes[k], on = Math.abs(x - tgt) < (easy ? 26 : 18);
      if (tangle > 0) tangle -= dt;
      if (I.tap('jump')) { if (on && tangle <= 0) k++; else tangle = 0.8; }
      B.S.on = on; B.S.k = k; B.S.tangle = tangle > 0;
      clear('안장 바느질 — 바늘이 구멍 위일 때 Space');
      X.fillStyle = '#7a4a26'; X.beginPath(); X.ellipse(500, 360, 380, 110, 0, 0, 6.3); X.fill(); X.strokeStyle = INK; X.lineWidth = 4; X.stroke();
      holes.forEach((h, q) => { X.beginPath(); X.arc(h, 360, 10, 0, 6.3); X.fillStyle = q < k ? '#e8dcc0' : q === k ? '#2b2118' : '#5a3a20'; X.fill(); });
      X.strokeStyle = '#e8dcc0'; X.lineWidth = 4; X.beginPath(); for (let q = 0; q < k; q++) { X.moveTo(holes[q], 360); X.lineTo(holes[q] + 45, 340); } X.stroke();
      X.strokeStyle = tangle > 0 ? '#a83e1e' : INK; X.lineWidth = 5; X.beginPath(); X.moveTo(x, 300); X.lineTo(x, 372); X.stroke();
    }
    B.S = {}; return { k };
  };
  /* ⑤ 꼬리날개 무늬 — 모은 물감(숯·열매·흙) · 끌기·방향키 = 붓 · F 누르는 동안 칠함 · Space = 물감 바꾸기 · 칠한 무늬는 비행 내내 보임(캔버스를 돌려줌) */
  B.paint = function* (I, paints, minSec = 6) {
    B.show();
    const pc = document.createElement('canvas'); pc.width = 256; pc.height = 128; const PX = pc.getContext('2d'); PX.fillStyle = '#8a5a32'; PX.fillRect(0, 0, 256, 128);
    let bx = 128, by = 64, ci = 0, t = 0, ink = 0;
    B.S = { kind: 'paint' };
    while (t < minSec || ink < 40) {
      const dt = yield; t += dt;
      const lk = I.look(); bx = Math.max(0, Math.min(256, bx + lk.x * 0.4 + I.axis('left', 'right') * 120 * dt)); by = Math.max(0, Math.min(128, by + lk.y * 0.4 + I.axis('fwd', 'back') * 120 * dt));
      if (I.tap('jump')) ci = (ci + 1) % paints.length;
      if (I.on('use')) { PX.fillStyle = paints[ci].c; PX.beginPath(); PX.arc(bx, by, 7, 0, 6.3); PX.fill(); ink++; }
      if (t > 25) break;
      B.S.ink = ink; B.S.t = +t.toFixed(1);
      clear('꼬리날개 무늬 — F 누르며 칠하기 · Space 물감 바꾸기');
      X.save(); X.translate(250, 140); X.scale(2, 2.4); X.beginPath(); X.moveTo(0, 0); X.quadraticCurveTo(140, -30, 256, 60); X.quadraticCurveTo(130, 140, 0, 128); X.closePath(); X.clip(); X.drawImage(pc, 0, 0); X.restore();
      X.strokeStyle = INK; X.lineWidth = 4; X.save(); X.translate(250, 140); X.scale(2, 2.4); X.beginPath(); X.moveTo(0, 0); X.quadraticCurveTo(140, -30, 256, 60); X.quadraticCurveTo(130, 140, 0, 128); X.closePath(); X.restore(); X.stroke();
      X.beginPath(); X.arc(250 + bx * 2, 140 + by * 2.4, 12, 0, 6.3); X.stroke();
      paints.forEach((p, q) => { X.fillStyle = p.c; X.beginPath(); X.arc(80, 200 + q * 70, q === ci ? 26 : 18, 0, 6.3); X.fill(); X.stroke(); X.fillStyle = INK; X.font = '20px sans-serif'; X.fillText(p.n, 40, 245 + q * 70); });
    }
    B.S = {}; return { canvas: pc, ink };
  };
  B.sense = () => B.S;
  return B;
}
