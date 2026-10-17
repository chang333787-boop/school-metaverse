// 🎬 장소 쇼(SHOW-1 · LIVING-1 4번 · 사용자 10-17 '모션그래픽으로 아쿠아리움 쇼 같은 거'): 극장 창 안 캔버스 그림 — 견본 한 편(🐠 대형 아쿠아리움 '바다 친구 이야기')만, 확인 뒤 수달·나비로 늘림
//   규칙(town_lessons.md G · 교과서 모션그래픽): 움직여야 보이는 것만 보여 줌 — 깊이 따라 햇빛이 사라지는 것 · 해파리가 빛을 번쩍이는 때 · 바다거북이 먼 길을 갔다 돌아오는 지도 위 길 · 고래 노래가 퍼지는 것과 물속 소리 빠르기
//     종이·바다 지도 색 + 잉크 선 · 평평한 색(그라데이션·글로우·네온·떠다니는 알갱이·바운스 X) · 천천히 하나씩 · 자막 = 짧은 한 문장씩(한국어·영어 짝) · 멈춤·5초 뒤로·막대 눌러 옮기기 · 59초
//   글 = 사실만(4학년 눈높이) · 소리 = 고래 노래 자리에서만 map.tone 낮은 소리 둘 · 끝 = 배울 개념 하나(GAME.S.learn 'nature:sound_water' — 배움 팀 town_quiz.js 문제 은행 이름)
//   렉: 창이 열려 있고 멈춤이 아닐 때만 그림(초당 30장 · 창을 닫으면 그 자리에서 멈춤 = 평소 일 0) · 그리는 동안 새 객체 X(잉크 선 흔들림 값은 열 때 한 번)
//   여는 곳 = 장소 카드 '여기서 할 수 있는 것'(실내 팀) → town.js openShow(id) · showFor(장소 이름) = 그 장소의 쇼 id(없으면 null)
const T2 = (ko, en) => [ko, en];
const VW = 960, VH = 540, FONT = '"Pretendard","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
const C = { pap: '#efe6d2', pap2: '#e6dac0', ink: '#2b2320', sea: '#9fc2cc', sea2: '#6f9cae', sea3: '#3f6a80', sea4: '#243f52', land: '#d9c79c', sand: '#e8d6a8', turt: '#7d9a5e', jel: '#e2b9bf', lit: '#f3df8f', fish: '#c98f5a', whale: '#5d7486', red: '#b8573e' };
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x), ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }, lerp = (a, b, t) => a + (b - a) * t;
const rng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

// ── 그리기 도구 ── D = { g, t 장면 안 초, T 쇼 초, en, J 잉크 흔들림 표(열 때 한 번) }
const ink = (g, w = 2.5) => { g.strokeStyle = C.ink; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; };
function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, 6.2832); }
function line(D, pts, u = 1, w = 2.5, dash = null) {   // 잉크 선(점 목록 · u = 앞에서부터 그린 몫 · 손맛 = 열 때 정한 작은 흔들림)
  const g = D.g, n = pts.length; if (n < 2 || u <= 0) return; ink(g, w); if (dash) g.setLineDash(dash); g.beginPath(); const L = (n - 1) * clamp(u), m = Math.floor(L);
  for (let i = 0; i <= Math.min(m, n - 1); i++) { const j = D.J[i % D.J.length]; g[i ? 'lineTo' : 'moveTo'](pts[i][0] + j[0], pts[i][1] + j[1]); }
  if (m < n - 1) { const f = L - m, a = pts[m], b = pts[m + 1]; g.lineTo(lerp(a[0], b[0], f), lerp(a[1], b[1], f)); } g.stroke(); if (dash) g.setLineDash([]); }
function txt(g, s, x, y, size = 22, col = C.ink, al = 'center', wt = 800) { g.font = wt + ' ' + size + 'px ' + FONT; g.fillStyle = col; g.textAlign = al; g.fillText(s, x, y); }
function paper(g, col = C.pap) { g.fillStyle = col; g.fillRect(0, 0, VW, VH); }
function along(P, u) { const n = P.length - 1, L = clamp(u) * n, i = Math.min(n - 1, Math.floor(L)), f = L - i; return [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f), Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0])]; }
// 생물(평평한 색 + 잉크 테두리)
function jellyD(g, x, y, s, c) { const w = s * (1 - 0.15 * c), h = s * (0.75 + 0.12 * c); ink(g, 2.2); g.fillStyle = C.jel; g.beginPath(); g.moveTo(x - w, y); g.bezierCurveTo(x - w, y - h * 1.3, x + w, y - h * 1.3, x + w, y); g.closePath(); g.fill(); g.stroke();
  for (let i = 0; i < 5; i++) { const bx = x - w * 0.7 + i * w * 0.35; g.beginPath(); g.moveTo(bx, y); for (let k = 1; k <= 8; k++) g.lineTo(bx + Math.sin(k * 0.9 + i + c * 1.2) * s * 0.07, y + k * s * (0.19 - 0.02 * c)); g.stroke(); } }
function turtleD(g, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); ink(g, 2.4 / s); g.fillStyle = C.turt; for (const k of [-1, 1]) { ell(g, 8, k * 15, 14, 5, k * 0.7); g.fill(); g.stroke(); ell(g, -16, k * 11, 7, 3.5, -k * 0.6); g.fill(); g.stroke(); }
  ell(g, 25, 0, 8, 6); g.fill(); g.stroke(); g.fillStyle = '#9db27d'; ell(g, 0, 0, 20, 15); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.moveTo(-4, -13); g.lineTo(-4, 13); g.moveTo(6, -12); g.lineTo(6, 12); g.stroke(); g.restore(); }
function whaleD(g, x, y, s, dir) { g.save(); g.translate(x, y); g.scale(s * dir, s); ink(g, 2.4 / s); g.fillStyle = C.whale; g.beginPath(); g.moveTo(60, 2); g.bezierCurveTo(52, -16, 10, -20, -24, -10); g.lineTo(-52, -2); g.lineTo(-66, -14); g.lineTo(-62, 0); g.lineTo(-66, 14); g.lineTo(-52, 2); g.bezierCurveTo(-20, 14, 30, 16, 60, 2); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(20, 8); g.quadraticCurveTo(6, 24, -14, 28); g.quadraticCurveTo(4, 16, 10, 8); g.fill(); g.stroke(); g.fillStyle = C.ink; ell(g, 42, 0, 2, 2); g.fill(); g.restore(); }
function fishD(g, x, y, s, dir) { g.save(); g.translate(x, y); g.scale(s * dir, s); ink(g, 2 / s); g.fillStyle = C.fish; g.beginPath(); g.moveTo(16, 0); g.quadraticCurveTo(2, -10, -10, 0); g.quadraticCurveTo(2, 10, 16, 0); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-8, 0); g.lineTo(-20, -8); g.lineTo(-20, 8); g.closePath(); g.fill(); g.stroke(); g.fillStyle = C.ink; ell(g, 9, -2, 1.5, 1.5); g.fill(); g.restore(); }

// 지도(바다거북 · 고래 장면 같이 씀): 왼쪽·오른쪽 땅 + 바다 + 축척 막대
const COAST_L = [[0, 40], [70, 70], [110, 140], [96, 210], [140, 280], [120, 360], [150, 430], [110, 500], [0, 540]], COAST_R = [[960, 30], [880, 80], [850, 150], [880, 230], [840, 300], [860, 380], [820, 460], [860, 540]];
function seaMap(D, scale) { const g = D.g; paper(g, C.sea); g.strokeStyle = 'rgba(43,35,32,.18)'; g.lineWidth = 1; for (let y = 60; y < VH; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(VW, y); g.stroke(); } for (let x = 80; x < VW; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, VH); g.stroke(); }
  for (const P of [COAST_L, COAST_R]) { g.fillStyle = C.land; g.beginPath(); P.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.closePath(); g.fill(); line(D, P, 1, 2.6); }
  if (scale) { ink(g, 3); g.beginPath(); g.moveTo(680, 505); g.lineTo(800, 505); g.moveTo(680, 498); g.lineTo(680, 512); g.moveTo(800, 498); g.lineTo(800, 512); g.stroke(); txt(g, scale, 740, 492, 17); } }

// ── 견본 쇼 ── 장면 = { d 초, cap: [[시작 초, [ko, en]] …], draw(D), beat: [[초, tone => …]] }
const TURTLE = [[150, 300], [230, 330], [330, 380], [450, 410], [580, 400], [700, 330], [760, 230], [700, 140], [560, 100], [420, 120], [300, 170], [200, 240], [160, 290]];
const SHOWS = {
  aquarium: { icon: '🐠', t: T2('바다 친구 이야기', 'Sea Friends'), place: /아쿠아리움|수족관|해양관/, col: '#2f78c4',
    learn: 'nature:sound_water', concept: T2('소리는 공기보다 물속에서|더 빠르게, 더 멀리 가요.', 'Sound travels faster and farther|in water than in air.'),
    scenes: [
      { d: 4, cap: [[0, T2('바다에 사는 친구 셋을 만나요.', 'Meet three friends who live in the sea.')]],
        draw(D) { const g = D.g; paper(g); txt(g, D.tt, VW / 2, 250, 54, C.ink, 'center', 900); const W = []; for (let i = 0; i <= 24; i++) W.push([240 + i * 20, 300 + Math.sin(i * 0.9) * 8]); line(D, W, ss(0.3, 2.6, D.t), 3); } },
      { d: 16, cap: [[0, T2('깊은 바다에는 햇빛이 닿지 않아 깜깜해요.', 'Sunlight cannot reach the deep sea, so it is dark.')], [7, T2('어떤 해파리는 몸에서 빛을 낼 수 있어요.', 'Some jellyfish can make light in their bodies.')], [11.5, T2('빛을 번쩍여 다가오는 적을 놀라게 해요.', 'They flash to startle animals coming to eat them.')]],
        draw(D) { const g = D.g, t = D.t, dn = ss(0.8, 6, t), off = dn * 900;   /* 깊이 띠가 위로 지나감 = 내려가는 것 */
          const band = (y0, y1, col) => { g.fillStyle = col; g.fillRect(0, y0 - off, VW, y1 - y0); }; band(-20, 200, C.sea); band(200, 520, C.sea2); band(520, 900, C.sea3); band(900, 1500, C.sea4);
          ink(g, 2); g.strokeStyle = 'rgba(43,35,32,.5)'; g.setLineDash([3, 6]); for (const y of [200, 520, 900]) { g.beginPath(); g.moveTo(0, y - off); g.lineTo(VW, y - off); g.stroke(); } g.setLineDash([]);
          for (const [y, s] of [[200, '200 m'], [520, '1000 m'], [900, '2000 m']]) txt(g, s, 900, y - off - 10, 18, y > 500 ? C.pap : C.ink, 'right');
          g.strokeStyle = C.lit; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const x = 120 + i * 150; g.beginPath(); g.moveTo(x, -off); g.lineTo(x + 40, 230 - off); g.stroke(); }   /* 햇빛 = 200m 근처에서 끝남 */
          g.fillStyle = C.lit; ell(g, 80, 40 - off, 26, 26); g.fill(); ink(g, 2.4); g.stroke();
          if (t > 5.5) { const a = ss(5.5, 7, t), c = 0.5 + 0.5 * Math.sin(D.T * 1.6), jx = 400, jy = 250 - Math.sin(D.T * 0.5) * 8, fx = lerp(980, 600, ss(8, 11.2, t)) + ss(12.2, 15, t) * 420, fl = (t > 11.3 && t < 11.8) || (t > 12.1 && t < 12.6);
            g.save(); g.globalAlpha = a; if (fl) { g.fillStyle = C.lit; for (let i = 0; i < 12; i++) { const q = i * 0.5236; ell(g, jx + Math.cos(q) * 78, jy + 10 + Math.sin(q) * 62, 7, 7); g.fill(); } ink(g, 2); for (let i = 0; i < 12; i++) { const q = i * 0.5236 + 0.26; g.beginPath(); g.moveTo(jx + Math.cos(q) * 92, jy + 10 + Math.sin(q) * 74); g.lineTo(jx + Math.cos(q) * 114, jy + 10 + Math.sin(q) * 92); g.stroke(); } }
            jellyD(g, jx, jy, 62, c); if (t > 7.5) fishD(g, fx, 280, 2.4, t > 12.2 ? 1 : -1); g.restore(); } } },
      { d: 17, cap: [[0, T2('바다거북은 모래밭에서 태어나 바다로 가요.', 'Sea turtles hatch on sandy beaches and head to the sea.')], [6, T2('자라는 동안 수천 km를 헤엄쳐 여행해요.', 'As they grow, they swim thousands of kilometers.')], [12.5, T2('알을 낳을 때는 태어난 바닷가 근처로 돌아와요.', 'To lay eggs, they come back near the beach where they hatched.')]],
        draw(D) { const g = D.g, t = D.t; seaMap(D, '1000 km'); g.fillStyle = C.sand; ell(g, 140, 300, 26, 16); g.fill(); ink(g, 2.2); g.stroke(); txt(g, D.en ? 'its beach' : '태어난 바닷가', 12, 336, 15, C.ink, 'left');   /* 땅 위(길과 겹치지 않게) */
          const u = ss(4, 15.5, t); line(D, TURTLE, u, 3, [9, 8]); const [x, y, a] = t < 4 ? [lerp(140, 230, ss(1, 4, t)), lerp(300, 330, ss(1, 4, t)), 0.3] : along(TURTLE, u);
          turtleD(g, x, y, t < 4 ? 0.6 : lerp(0.6, 1.3, ss(4, 10, t)) - ss(14, 16, t) * 0.3, a); if (t > 15.6) { g.fillStyle = C.pap; for (let i = 0; i < 4; i++) { ell(g, 118 + i * 9, 296 + (i % 2) * 6, 4, 4); g.fill(); ink(g, 1.4); g.stroke(); } } } },
      { d: 16, cap: [[0, T2('혹등고래는 물속에서 노래를 해요.', 'Humpback whales sing under water.')], [4, T2('노래는 물속으로 아주 멀리 퍼져 나가요.', 'Their songs spread very far through the water.')], [8.5, T2('소리는 물속에서 공기보다 네 배쯤 빠르게 가요.', 'Sound moves about four times faster in water than in air.')], [12.5, T2('고래는 노래로 멀리 있는 고래에게 소리를 전해요.', 'Whales send their songs to whales far away.')]],
        beat: [[0.6, T => T(196, 0, 1.6, 'sine', 0.06, 147)], [3.2, T => T(247, 0, 1.4, 'sine', 0.05, 185)]],
        draw(D) { const g = D.g, t = D.t;
          if (t < 8.5) { seaMap(D, '10 km'); const wx = 230, wy = 270; whaleD(g, wx, wy, 1, 1); whaleD(g, 620, 210, 0.7, -1);   /* 멀리 있는 고래 = 30 km쯤(혹등고래 노래가 들리는 거리 안) */ ink(g, 2); g.strokeStyle = C.ink;
            for (let i = 0; i < 4; i++) { const r = (t - i * 1.6) * 75; if (r > 0 && r < 620) { g.globalAlpha = 1 - r / 640; g.beginPath(); g.arc(wx + 50, wy, r, -1.2, 1.2); g.stroke(); } } g.globalAlpha = 1;
            if (t > 4.8) { txt(g, '!', 620, 172, 34, C.red, 'center', 900); } }
          else { const k = t - 8.5; paper(g); txt(g, D.en ? 'Air' : '공기', 110, 186, 26, C.ink, 'left', 900); txt(g, D.en ? 'Water' : '물', 110, 346, 26, C.ink, 'left', 900);
            g.fillStyle = C.pap2; g.fillRect(200, 150, 680, 54); g.fillStyle = C.sea; g.fillRect(200, 310, 680, 54); ink(g, 2.4); g.strokeRect(200, 150, 680, 54); g.strokeRect(200, 310, 680, 54);
            const pA = clamp(k / 7 * 0.23), pW = clamp(k / 7);   /* 물 = 공기의 네 배쯤(1500 : 340 m/s) */
            for (const [p, y] of [[pA, 177], [pW, 337]]) { const x = 210 + p * 660; ink(g, 3); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x - i * 14, y, 16, -1, 1); g.stroke(); } }
            if (k > 4) { whaleD(g, 690, 450, 0.75, -1); whaleD(g, 300, 450, 0.75, 1); line(D, [[360, 450], [620, 450]], ss(4, 6.5, k), 2.4, [8, 8]); } } } },
      { d: 6, end: 1, cap: [[0, T2('오늘 배운 것을 수첩에 담았어요.', 'Saved to your notebook.')]], beat: [[0.3, T => { T(523, 0, 0.25, 'triangle', 0.05); T(659, 0.18, 0.35, 'triangle', 0.05); }]],
        draw(D) { const g = D.g, a = ss(0, 0.8, D.t); paper(g); g.globalAlpha = a; txt(g, D.en ? 'What we learned' : '오늘 배운 것', VW / 2, 170, 26, C.red, 'center', 900); D.cc.forEach((l, i) => txt(g, l, VW / 2, 250 + i * 50, 36, C.ink, 'center', 900));
          whaleD(g, VW / 2, 420, 0.9, 1); g.globalAlpha = 1; } },
    ] },
};

// 장소 이름 → 쇼 id(없으면 null)
export function showFor(name) { const n = String(name || ''); for (const id in SHOWS) if (SHOWS[id].place.test(n)) return id; return null; }
// o = { openP(html) → 창, closeP(), tone(…), en() → bool, learn(id), say(글) }
export function createShow(o) {
  let S = null;   // 지금 쇼
  const total = sh => sh.scenes.reduce((a, s) => a + s.d, 0);
  function stop() { if (!S) return; cancelAnimationFrame(S.raf); S = null; }
  function close() { const was = !!S; stop(); if (was) o.closeP(); }
  function open(id, from) { const sh = SHOWS[id]; if (!sh) return false; stop(); const en = !!o.en(), L = a => a[en ? 1 : 0];
    const h = '<style>.twn-p .shw{position:relative;width:min(100%,calc((88vh - 170px) * 1.7778));aspect-ratio:16/9;margin:0 auto;border:4px solid var(--ink);border-radius:10px;overflow:hidden;background:' + C.pap + '}'
      + '.twn-p .shw canvas{display:block;width:100%;height:100%}.twn-p .shw .cap{position:absolute;left:5%;right:5%;bottom:4%;text-align:center;font-weight:800;font-size:clamp(14px,2.2vw,20px);line-height:1.35;color:' + C.ink + ';background:' + C.pap + ';border:2px solid ' + C.ink + ';border-radius:8px;padding:6px 10px}'
      + '.twn-p .shw .cap:empty{display:none}.twn-p .sbar{height:12px;margin:8px 0 0;background:' + C.pap2 + ';border:2px solid var(--ink);border-radius:6px;cursor:pointer;overflow:hidden}.twn-p .sbar i{display:block;height:100%;width:0;background:#c9a24a}</style>'
      + '<h3>' + sh.icon + ' ' + L(sh.t) + (from ? ' <span class="sm">' + from + '</span>' : '') + '</h3><div class="shw"><canvas></canvas><div class="cap"></div></div><div class="sbar" title="' + (en ? 'Click to move' : '눌러서 옮기기') + '"><i></i></div>'
      + '<div class="row"><button class="sub" data-a="back">' + (en ? 'Back 5 s' : '5초 뒤로') + '</button><button class="sub" data-a="pause">' + (en ? 'Pause' : '멈춤') + '</button><button data-a="x">' + (en ? 'Close' : '닫기') + '</button></div>';
    const P9 = o.openP(h); if (!P9) return false; const cv = P9.querySelector('canvas'), r = cv.getBoundingClientRect(), dpr = Math.min(1.5, window.devicePixelRatio || 1);
    cv.width = Math.max(320, Math.round(r.width * dpr)); cv.height = Math.round(cv.width * 9 / 16); const g = cv.getContext('2d'), R = rng(11);
    S = { id, sh, cv, g, P9, cap: P9.querySelector('.cap'), bar: P9.querySelector('.sbar i'), pb: P9.querySelector('[data-a="pause"]'), T: 0, last: 0, acc: 0, ci: '', bsc: -1, bi: 0, raf: 0, paused: false, ended: false, learned: false, tot: total(sh), nb: 0,
      D: { g, t: 0, T: 0, en, tt: L(sh.t), cc: L(sh.concept).split('|'), J: Array.from({ length: 31 }, () => [(R() - 0.5) * 1.6, (R() - 0.5) * 1.6]) } };
    const seek = T => { if (!S) return; S.T = clamp(T, 0, S.tot); S.bsc = -1; S.ended = false; frame(); if (!S.paused) go(); };
    P9.addEventListener('click', e => { if (!S) return; const sb = e.target.closest && e.target.closest('.sbar'); if (sb) { const q = sb.getBoundingClientRect(); seek((e.clientX - q.left) / q.width * S.tot); return; }
      const b = e.target.closest && e.target.closest('button'); if (!b) return; const a = b.dataset.a; if (a === 'x') close(); else if (a === 'back') seek(S.T - 5); else if (a === 'pause') { if (S.ended) { S.paused = false; seek(0); } else { S.paused = !S.paused; if (!S.paused) go(); } btn(); } });
    P9.addEventListener('keydown', e => { if (e.code === 'Escape') close(); else if (e.code === 'Space') { e.preventDefault(); S && S.pb.click(); } });
    frame(); go(); return true; }
  function btn() { if (S) S.pb.textContent = S.ended ? (S.D.en ? 'Watch again' : '다시 보기') : S.paused ? (S.D.en ? 'Play' : '이어 보기') : (S.D.en ? 'Pause' : '멈춤'); }
  function go() { cancelAnimationFrame(S.raf); S.last = performance.now(); S.acc = 0; const cv = S.cv;
    const run = now => { if (!S || S.cv !== cv) return; if (!cv.isConnected) { stop(); return; } if (S.paused) return; S.raf = requestAnimationFrame(run); const dt = Math.min(0.1, (now - S.last) / 1000); S.last = now; S.acc += dt; if (S.acc < 0.031) return;   /* 초당 30장 */
      S.T = Math.min(S.tot, S.T + S.acc); S.acc = 0; frame(); if (S.T >= S.tot) { S.ended = true; cancelAnimationFrame(S.raf); btn(); } };
    S.raf = requestAnimationFrame(run); btn(); }
  function frame() { const { sh, g, cv, D } = S; let t0 = 0, si = 0; while (si < sh.scenes.length - 1 && S.T >= t0 + sh.scenes[si].d) { t0 += sh.scenes[si].d; si++; } const sc = sh.scenes[si], t = S.T - t0;
    D.t = t; D.T = S.T; g.setTransform(cv.width / VW, 0, 0, cv.height / VH, 0, 0); g.globalAlpha = 1; sc.draw(D);
    const fd = Math.min(ss(0, 0.4, t), 1 - ss(sc.d - 0.4, sc.d, t)); if (fd < 1 && !(sc.end && t > 1)) { g.globalAlpha = 1 - fd; g.fillStyle = C.pap; g.fillRect(0, 0, VW, VH); g.globalAlpha = 1; }   /* 장면 사이 = 종이색으로 잠깐 */
    let c = sc.cap[0]; for (const q of sc.cap) if (t >= q[0]) c = q; const ck = si + ':' + c[0]; if (ck !== S.ci) { S.ci = ck; S.cap.textContent = c[1][D.en ? 1 : 0]; if (o.say && !S.paused) o.say(S.cap.textContent); }
    const B = sc.beat || []; if (S.bsc !== si) { S.bsc = si; S.bi = 0; while (S.bi < B.length && B[S.bi][0] < t - 0.3) S.bi++; } if (!S.paused) while (S.bi < B.length && B[S.bi][0] <= t) { B[S.bi][1](o.tone); S.bi++; }
    if (sc.end && !S.learned) { S.learned = true; o.learn(sh.learn); }
    if ((S.nb += 1) % 6 === 0 || S.T >= S.tot || S.paused) S.bar.style.width = (S.T / S.tot * 100).toFixed(1) + '%'; }
  return { open, close, halt: stop, get on() { return !!S; }, info: () => S ? { id: S.id, T: +S.T.toFixed(1), tot: S.tot, ended: S.ended, paused: S.paused, cap: S.cap.textContent } : null, seek: T => { if (S) { S.T = clamp(T, 0, S.tot); S.bsc = -1; frame(); } }, pause: v => { if (S) { S.paused = !!v; if (!S.paused) go(); btn(); } },
    list: () => Object.keys(SHOWS).map(k => ({ id: k, d: total(SHOWS[k]), learn: SHOWS[k].learn })) };
}
