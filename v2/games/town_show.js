// 🎬 장소 쇼(SHOW-1·2 · LIVING-1 4번 · 사용자 10-17 '모션그래픽으로 아쿠아리움 쇼 같은 거'): 극장 창 안 캔버스 그림 — 셋: 🐠 대형 아쿠아리움 '바다 친구 이야기' · 🦦 천연기념물 보호소 '수달 가족 하루' · 🦋 곤충 박물관 '애벌레에서 나비까지'
//   한 편에 '정지 그림으로는 안 되는, 시간에 따라 바뀌는 개념' 하나(SHOW-2 · 견본 확인 뒤): 강이 맑아지면 물고기가 늘고 수달이 돌아옴(맑기·물고기 막대가 같이 오름) · 시간 막대 위 갖춘탈바꿈(허물 벗을 때마다 몸이 한 번에 커짐)
//   규칙(town_lessons.md G · 교과서 모션그래픽): 움직여야 보이는 것만 보여 줌 — 깊이 따라 햇빛이 사라지는 것 · 해파리가 빛을 번쩍이는 때 · 바다거북이 먼 길을 갔다 돌아오는 지도 위 길 · 고래 노래가 퍼지는 것과 물속 소리 빠르기
//     종이·바다 지도 색 + 잉크 선 · 평평한 색(그라데이션·글로우·네온·떠다니는 알갱이·바운스 X) · 천천히 하나씩 · 자막 = 짧은 한 문장씩(한국어·영어 짝) · 멈춤·5초 뒤로·막대 눌러 옮기기 · 59초
//   글 = 사실만(4학년 눈높이) · 소리 = 고래 노래 자리에서만 map.tone 낮은 소리 둘 + 끝 두 음 · 끝 = 배울 개념 하나(GAME.S.learn — 배움 팀 town_quiz.js 문제 은행 이름: nature:sound_water · nature:otter · nature:metamorph)
//   작은 화면(휴대폰 세로): 캔버스 안 이름표 글씨를 키움(D.fs) · 자막은 캔버스 아래 따로(그림을 가리지 않음)
//   렉: 창이 열려 있고 멈춤이 아닐 때만 그림(초당 30장 · 창을 닫으면 그 자리에서 멈춤 = 평소 일 0) · 그리는 동안 새 객체 X(잉크 선 흔들림 값은 열 때 한 번)
//   여는 곳 = 장소 카드 '여기서 할 수 있는 것'(실내 팀) → town.js openShow(id) · showFor(장소 이름) = 그 장소의 쇼 id(없으면 null — 동물보호센터(반려동물)·주차장은 null)
const T2 = (ko, en) => [ko, en];
const VW = 960, VH = 540, FONT = '"Pretendard","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
const C = { pap: '#efe6d2', pap2: '#e6dac0', ink: '#2b2320', sea: '#9fc2cc', sea2: '#6f9cae', sea3: '#3f6a80', sea4: '#243f52', land: '#d9c79c', sand: '#e8d6a8', turt: '#7d9a5e', jel: '#e2b9bf', lit: '#f3df8f', fish: '#c98f5a', whale: '#5d7486', red: '#b8573e',
  otter: '#8a6142', otter2: '#c9a982', bed: '#b9ab8c', reed: '#6f8a4a', night: '#3c4a5c', leaf: '#9cc86a', cat: '#7fb24e', cat2: '#a6cf72', pupa: '#b7c98a', wing: '#f7f4ea', egg: '#f1d97a' };
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
const lab = (D, s, x, y, size, col, al, wt) => txt(D.g, s, x, y, size * D.fs, col, al, wt);   // 이름표 = 작은 화면에서 키움
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

function otterD(g, x, y, s, dir, pose) {   // 수달(옆모습 · pose 0 걷기/서기 · 1 헤엄 · 평평한 갈색 + 잉크)
  g.save(); g.translate(x, y); g.scale(s * dir, s); ink(g, 2.4 / s); g.fillStyle = C.otter; const sw = pose === 1;
  g.beginPath(); g.moveTo(-40, -2); g.quadraticCurveTo(-70, 0, -92, sw ? -2 : 10); g.quadraticCurveTo(-70, 10, -40, 10); g.closePath(); g.fill(); g.stroke();   /* 굵은 꼬리 */
  ell(g, 0, 0, 46, sw ? 14 : 17); g.fill(); g.stroke(); if (!sw) for (const lx of [-28, -14, 18, 30]) { ell(g, lx, 17, 5, 8); g.fill(); g.stroke(); }
  ell(g, 48, -8, 18, 14); g.fill(); g.stroke(); g.fillStyle = C.otter2; ell(g, 58, -3, 10, 7); g.fill(); g.fillStyle = C.otter; ell(g, 40, -21, 4.5, 4.5); g.fill(); g.stroke();
  g.fillStyle = C.ink; ell(g, 52, -12, 2.2, 2.2); g.fill(); ell(g, 66, -6, 2.6, 2); g.fill(); ink(g, 1.2 / s); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(64, -2 + i * 2.5); g.lineTo(80, -6 + i * 4); g.stroke(); } g.restore(); }
function leafD(g, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); ink(g, 2.6 / s); g.fillStyle = C.leaf; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(60, -80, 200, -70, 250, 0); g.bezierCurveTo(200, 70, 60, 80, 0, 0); g.closePath(); g.fill(); g.stroke();
  ink(g, 1.6 / s); g.beginPath(); g.moveTo(0, 0); g.lineTo(240, 0); for (let i = 1; i < 6; i++) { g.moveTo(i * 38, 0); g.lineTo(i * 38 + 28, -30 - i * 3); g.moveTo(i * 38, 0); g.lineTo(i * 38 + 28, 30 + i * 3); } g.stroke(); g.restore(); }
function caterD(g, x, y, s, wig) { g.save(); g.translate(x, y); g.scale(s, s); ink(g, 1.8 / s); for (let i = 7; i >= 0; i--) { g.fillStyle = i % 2 ? C.cat : C.cat2; ell(g, -i * 9, Math.sin(wig - i * 0.8) * 1.6, 7.5, 7.5); g.fill(); g.stroke(); } g.fillStyle = C.ink; ell(g, 3, -2, 1.5, 1.5); g.fill(); g.restore(); }
function pupaD(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); ink(g, 2 / s); g.fillStyle = C.pupa; g.beginPath(); g.moveTo(0, -46); g.lineTo(15, -20); g.lineTo(11, 26); g.lineTo(0, 44); g.lineTo(-11, 26); g.lineTo(-15, -20); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-12, -6); g.lineTo(12, -6); g.stroke(); g.restore(); }
function flyD(g, x, y, s, open) {   // 배추흰나비(위에서 본 모습 · open 0 접힘 ~ 1 활짝)
  g.save(); g.translate(x, y); g.scale(s, s); ink(g, 1.8 / s); for (const sd of [-1, 1]) { g.save(); g.scale(sd * (0.2 + 0.8 * open), 1); g.fillStyle = C.wing; g.beginPath(); g.moveTo(2, -3); g.bezierCurveTo(26, -42, 58, -30, 50, -6); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(2, 2); g.bezierCurveTo(38, 4, 44, 32, 20, 32); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C.ink; ell(g, 42, -28, 6, 4, -0.5); g.fill(); ell(g, 32, -14, 2.8, 2.8); g.fill(); g.restore(); } g.fillStyle = '#5a5550'; ell(g, 0, 0, 3, 16); g.fill(); ink(g, 1.2 / s); g.beginPath(); g.moveTo(-1, -14); g.lineTo(-7, -27); g.moveTo(1, -14); g.lineTo(7, -27); g.stroke(); g.restore(); }
function stamp(D, s, x, y, a) { const g = D.g, k = Math.min(1.4, D.fs), q = s.length > 6 ? 0.6 : 1, w = (s.length * 26 * q + 34) * k; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(-0.06); g.strokeStyle = C.red; g.lineWidth = 4; g.strokeRect(-w / 2, -26 * k, w, 52 * k); txt(g, s, 0, 10 * k, 26 * k * q, C.red, 'center', 900); g.restore(); }
// 막대(이름 · 0~1 · 칸 수): 시간에 따라 오르는 양을 한 칸씩
function meter(D, x, y, w, name, v, col) { const g = D.g, n = 10, k = Math.round(clamp(v) * n); lab(D, name, x - 10, y + 16, 17, C.ink, 'right', 900); for (let i = 0; i < n; i++) { g.fillStyle = i < k ? col : C.pap; g.fillRect(x + i * w / n, y, w / n - 4, 22); ink(g, 1.6); g.strokeRect(x + i * w / n, y, w / n - 4, 22); } }
// 강 단면(수달 쇼): 맑기 0~1(물 색 = 열 칸 · 한 칸씩 맑아짐) · 쓰레기 · 갈대 · 둑
const WATER = Array.from({ length: 11 }, (_, i) => { const a = [0x8a, 0x84, 0x5a], b = [0x9f, 0xc2, 0xcc], q = i / 10; return '#' + a.map((v, k) => Math.round(v + (b[k] - v) * q).toString(16).padStart(2, '0')).join(''); });
const TRASH = [[300, 252, 0], [520, 448, 1], [660, 256, 2], [410, 440, 0], [760, 430, 1]];
function riverX(D, clean, night) { const g = D.g; paper(g, night ? C.night : C.pap); if (night) { g.fillStyle = C.pap; ell(g, 820, 70, 24, 24); g.fill(); ink(g, 2); g.stroke(); }
  g.fillStyle = WATER[Math.round(clamp(clean) * 10)]; g.fillRect(0, 240, VW, 230); g.fillStyle = C.bed; g.fillRect(0, 470, VW, 70); ink(g, 2.4); g.beginPath(); g.moveTo(0, 240); for (let x = 0; x <= VW; x += 40) g.lineTo(x, 240 + Math.sin(x * 0.05 + D.T * 0.8) * 3); g.stroke(); g.beginPath(); g.moveTo(0, 470); g.lineTo(VW, 470); g.stroke();
  g.fillStyle = C.land; for (const P of [[[0, 150], [150, 170], [210, 240], [250, 300], [0, 300]], [[960, 140], [800, 160], [740, 240], [700, 300], [960, 300]]]) { g.beginPath(); P.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.closePath(); g.fill(); line(D, P.slice(0, 4), 1, 2.4); }
  const rd = ss(0.4, 1, clean); if (rd > 0) { ink(g, 2); g.strokeStyle = C.reed; for (let i = 0; i < 9; i++) { const x = i < 5 ? 60 + i * 30 : 760 + (i - 5) * 34; g.beginPath(); g.moveTo(x, 172); g.lineTo(x + 4, 172 - rd * (50 + (i % 3) * 12)); g.stroke(); } } }
// 시간 막대(나비 쇼): 알 4 · 애벌레 15 · 번데기 8 · 어른벌레(끝) — 날 수 어림(배추흰나비 · 따뜻한 철)
const LIFE = [[T2('알', 'Egg'), 4, '#f1d97a'], [T2('애벌레', 'Larva'), 15, '#9cc86a'], [T2('번데기', 'Pupa'), 8, '#b7c98a'], [T2('어른벌레', 'Adult'), 4, '#f4f1e6']], LDAY = 31;
function lifeBar(D, day, molts) { const g = D.g, x0 = 80, W = 800, y = 44, h = 24; let x = x0;
  for (const [nm, d, col] of LIFE) { const w = W * d / LDAY; g.fillStyle = col; g.fillRect(x, y, w, h); ink(g, 2); g.strokeRect(x, y, w, h); lab(D, nm[D.en ? 1 : 0], x + w / 2, y + h + 20, 15, C.ink, 'center', 800); x += w; }
  const mx = x0 + W * 4 / LDAY; for (let i = 0; i < 4; i++) { const xx = mx + W * 15 / LDAY * (i + 1) / 5; g.fillStyle = i < molts ? C.ink : C.pap; ell(g, xx, y + h / 2, 5, 5); g.fill(); ink(g, 1.4); g.stroke(); }   /* 허물 벗기 넷 */
  const px = x0 + W * clamp(day / LDAY); g.fillStyle = C.red; g.beginPath(); g.moveTo(px, y - 2); g.lineTo(px - 9, y - 16); g.lineTo(px + 9, y - 16); g.closePath(); g.fill(); ink(g, 3); g.strokeStyle = C.red; g.beginPath(); g.moveTo(px, y - 2); g.lineTo(px, y + h + 2); g.stroke(); }   /* 빨간 표 = 지금 */
// 지도(바다거북 · 고래 장면 같이 씀): 왼쪽·오른쪽 땅 + 바다 + 축척 막대
const COAST_L = [[0, 40], [70, 70], [110, 140], [96, 210], [140, 280], [120, 360], [150, 430], [110, 500], [0, 540]], COAST_R = [[960, 30], [880, 80], [850, 150], [880, 230], [840, 300], [860, 380], [820, 460], [860, 540]];
function seaMap(D, scale) { const g = D.g; paper(g, C.sea); g.strokeStyle = 'rgba(43,35,32,.18)'; g.lineWidth = 1; for (let y = 60; y < VH; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(VW, y); g.stroke(); } for (let x = 80; x < VW; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, VH); g.stroke(); }
  for (const P of [COAST_L, COAST_R]) { g.fillStyle = C.land; g.beginPath(); P.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.closePath(); g.fill(); line(D, P, 1, 2.6); }
  if (scale) { ink(g, 3); g.beginPath(); g.moveTo(680, 505); g.lineTo(800, 505); g.moveTo(680, 498); g.lineTo(680, 512); g.moveTo(800, 498); g.lineTo(800, 512); g.stroke(); lab(D, scale, 740, 492, 17); } }

// ── 견본 쇼 ── 장면 = { d 초, cap: [[시작 초, [ko, en]] …], draw(D), beat: [[초, tone => …]] }
const TURTLE = [[150, 300], [230, 330], [330, 380], [450, 410], [580, 400], [700, 330], [760, 230], [700, 140], [560, 100], [420, 120], [300, 170], [200, 240], [160, 290]];
const SHOWS = {
  aquarium: { icon: '🐠', t: T2('바다 친구 이야기', 'Sea Friends'), place: /아쿠아리움|수족관/, col: '#2f78c4',
    learn: 'nature:sound_water', concept: T2('소리는 공기보다 물속에서|더 빠르게, 더 멀리 가요.', 'Sound travels faster and farther|in water than in air.'),
    scenes: [
      { d: 4, cap: [[0, T2('바다에 사는 친구 셋을 만나요.', 'Meet three friends who live in the sea.')]],
        draw(D) { const g = D.g; paper(g); txt(g, D.tt, VW / 2, 250, 54, C.ink, 'center', 900); const W = []; for (let i = 0; i <= 24; i++) W.push([240 + i * 20, 300 + Math.sin(i * 0.9) * 8]); line(D, W, ss(0.3, 2.6, D.t), 3); } },
      { d: 16, cap: [[0, T2('깊은 바다에는 햇빛이 닿지 않아 깜깜해요.', 'Sunlight cannot reach the deep sea, so it is dark.')], [7, T2('어떤 해파리는 몸에서 빛을 낼 수 있어요.', 'Some jellyfish can make light in their bodies.')], [11.5, T2('빛을 번쩍여 다가오는 적을 놀라게 해요.', 'They flash to startle animals coming to eat them.')]],
        draw(D) { const g = D.g, t = D.t, dn = ss(0.8, 6, t), off = dn * 900;   /* 깊이 띠가 위로 지나감 = 내려가는 것 */
          const band = (y0, y1, col) => { g.fillStyle = col; g.fillRect(0, y0 - off, VW, y1 - y0); }; band(-20, 200, C.sea); band(200, 520, C.sea2); band(520, 900, C.sea3); band(900, 1500, C.sea4);
          ink(g, 2); g.strokeStyle = 'rgba(43,35,32,.5)'; g.setLineDash([3, 6]); for (const y of [200, 520, 900]) { g.beginPath(); g.moveTo(0, y - off); g.lineTo(VW, y - off); g.stroke(); } g.setLineDash([]);
          for (const [y, s] of [[200, '200 m'], [520, '1000 m'], [900, '2000 m']]) lab(D, s, 900, y - off - 10, 18, y > 500 ? C.pap : C.ink, 'right');
          g.strokeStyle = C.lit; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const x = 120 + i * 150; g.beginPath(); g.moveTo(x, -off); g.lineTo(x + 40, 230 - off); g.stroke(); }   /* 햇빛 = 200m 근처에서 끝남 */
          g.fillStyle = C.lit; ell(g, 80, 40 - off, 26, 26); g.fill(); ink(g, 2.4); g.stroke();
          if (t > 5.5) { const a = ss(5.5, 7, t), c = 0.5 + 0.5 * Math.sin(D.T * 1.6), jx = 400, jy = 250 - Math.sin(D.T * 0.5) * 8, fx = lerp(980, 600, ss(8, 11.2, t)) + ss(12.2, 15, t) * 420, fl = (t > 11.3 && t < 11.8) || (t > 12.1 && t < 12.6);
            g.save(); g.globalAlpha = a; if (fl) { g.fillStyle = C.lit; for (let i = 0; i < 12; i++) { const q = i * 0.5236; ell(g, jx + Math.cos(q) * 78, jy + 10 + Math.sin(q) * 62, 7, 7); g.fill(); } ink(g, 2); for (let i = 0; i < 12; i++) { const q = i * 0.5236 + 0.26; g.beginPath(); g.moveTo(jx + Math.cos(q) * 92, jy + 10 + Math.sin(q) * 74); g.lineTo(jx + Math.cos(q) * 114, jy + 10 + Math.sin(q) * 92); g.stroke(); } }
            jellyD(g, jx, jy, 62, c); if (t > 7.5) fishD(g, fx, 280, 2.4, t > 12.2 ? 1 : -1); g.restore(); } } },
      { d: 17, cap: [[0, T2('바다거북은 모래밭에서 태어나 바다로 가요.', 'Sea turtles hatch on sandy beaches and head to the sea.')], [6, T2('자라는 동안 수천 km를 헤엄쳐 여행해요.', 'As they grow, they swim thousands of kilometers.')], [12.5, T2('알을 낳을 때는 태어난 바닷가 근처로 돌아와요.', 'To lay eggs, they come back near the beach where they hatched.')]],
        draw(D) { const g = D.g, t = D.t; seaMap(D, '1000 km'); g.fillStyle = C.sand; ell(g, 140, 300, 26, 16); g.fill(); ink(g, 2.2); g.stroke(); lab(D, D.en ? 'its beach' : '태어난 바닷가', 12, 336, 15, C.ink, 'left');   /* 땅 위(길과 겹치지 않게) */
          const u = ss(4, 15.5, t); line(D, TURTLE, u, 3, [9, 8]); const [x, y, a] = t < 4 ? [lerp(140, 230, ss(1, 4, t)), lerp(300, 330, ss(1, 4, t)), 0.3] : along(TURTLE, u);
          turtleD(g, x, y, t < 4 ? 0.6 : lerp(0.6, 1.3, ss(4, 10, t)) - ss(14, 16, t) * 0.3, a); if (t > 15.6) { g.fillStyle = C.pap; for (let i = 0; i < 4; i++) { ell(g, 118 + i * 9, 296 + (i % 2) * 6, 4, 4); g.fill(); ink(g, 1.4); g.stroke(); } } } },
      { d: 16, cap: [[0, T2('혹등고래는 물속에서 노래를 해요.', 'Humpback whales sing under water.')], [4, T2('노래는 물속으로 아주 멀리 퍼져 나가요.', 'Their songs spread very far through the water.')], [8.5, T2('소리는 물속에서 공기보다 네 배쯤 빠르게 가요.', 'Sound moves about four times faster in water than in air.')], [12.5, T2('고래는 노래로 멀리 있는 고래에게 소리를 전해요.', 'Whales send their songs to whales far away.')]],
        beat: [[0.6, T => T(196, 0, 1.6, 'sine', 0.06, 147)], [3.2, T => T(247, 0, 1.4, 'sine', 0.05, 185)]],
        draw(D) { const g = D.g, t = D.t;
          if (t < 8.5) { seaMap(D, '10 km'); const wx = 230, wy = 270; whaleD(g, wx, wy, 1, 1); whaleD(g, 620, 210, 0.7, -1);   /* 멀리 있는 고래 = 30 km쯤(혹등고래 노래가 들리는 거리 안) */ ink(g, 2); g.strokeStyle = C.ink;
            for (let i = 0; i < 4; i++) { const r = (t - i * 1.6) * 75; if (r > 0 && r < 620) { g.globalAlpha = 1 - r / 640; g.beginPath(); g.arc(wx + 50, wy, r, -1.2, 1.2); g.stroke(); } } g.globalAlpha = 1;
            if (t > 4.8) { txt(g, '!', 620, 172, 34, C.red, 'center', 900); } }
          else { const k = t - 8.5; paper(g); lab(D, D.en ? 'Air' : '공기', 60, 186, 26, C.ink, 'left', 900); lab(D, D.en ? 'Water' : '물', 60, 346, 26, C.ink, 'left', 900);
            g.fillStyle = C.pap2; g.fillRect(200, 150, 680, 54); g.fillStyle = C.sea; g.fillRect(200, 310, 680, 54); ink(g, 2.4); g.strokeRect(200, 150, 680, 54); g.strokeRect(200, 310, 680, 54);
            const pA = clamp(k / 7 * 0.23), pW = clamp(k / 7);   /* 물 = 공기의 네 배쯤(1500 : 340 m/s) */
            for (const [p, y] of [[pA, 177], [pW, 337]]) { const x = 210 + p * 660; ink(g, 3); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x - i * 14, y, 16, -1, 1); g.stroke(); } }
            if (k > 4) { whaleD(g, 690, 450, 0.75, -1); whaleD(g, 300, 450, 0.75, 1); line(D, [[360, 450], [620, 450]], ss(4, 6.5, k), 2.4, [8, 8]); } } } },
      { d: 6, end: 1, cap: [[0, T2('오늘 배운 것을 수첩에 담았어요.', 'Saved to your notebook.')]], beat: [[0.3, T => { T(523, 0, 0.25, 'triangle', 0.05); T(659, 0.18, 0.35, 'triangle', 0.05); }]],
        draw(D) { const g = D.g, a = ss(0, 0.8, D.t); paper(g); g.globalAlpha = a; txt(g, D.en ? 'What we learned' : '오늘 배운 것', VW / 2, 170, 26, C.red, 'center', 900); D.cc.forEach((l, i) => txt(g, l, VW / 2, 250 + i * 50, 36, C.ink, 'center', 900));
          whaleD(g, VW / 2, 420, 0.9, 1); g.globalAlpha = 1; } },
    ] },
  otter: { icon: '🐾',   /* 🦦 = 이모지 12.0(윈도 10에서 깨짐) */  t: T2('수달 가족 하루', 'A Day with an Otter Family'), place: /천연기념물|수달/, col: '#3f8a5a',
    learn: 'nature:otter', concept: T2('강이 맑아야 물고기가 살고,|물고기가 있어야 수달이 살아요.', 'Clean rivers keep fish alive,|and fish keep otters alive.'),
    scenes: [
      { d: 4, cap: [[0, T2('강에 사는 수달 가족을 만나요.', 'Meet an otter family living in a river.')]],
        draw(D) { const g = D.g; paper(g); txt(g, D.tt, VW / 2, 250, 52, C.ink, 'center', 900); const W = []; for (let i = 0; i <= 24; i++) W.push([240 + i * 20, 300 + Math.sin(i * 0.9) * 8]); line(D, W, ss(0.3, 2.6, D.t), 3); } },
      { d: 12, cap: [[0, T2('수달은 나라가 정해 지키는 천연기념물이에요.', 'Otters are a natural monument protected by the country.')], [4, T2('천연기념물은 드물고 귀해서 법으로 보호하는 동물·식물·자연이에요.', 'Natural monuments are rare animals, plants and places protected by law.')], [8, T2('한번 사라진 생물은 다시 되살릴 수 없어서 지켜야 해요.', 'Once a living thing is gone, it cannot come back. So we protect it.')]],
        draw(D) { const g = D.g, t = D.t; paper(g); g.fillStyle = C.bed; ell(g, 330, 380, 190, 34); g.fill(); ink(g, 2.4); g.stroke(); otterD(g, 330, 330, 2.1, 1, 0); stamp(D, D.en ? 'NATURAL MONUMENT' : '천연기념물', 690, 210, ss(0.6, 1.6, t));
          if (t > 4) { const a = ss(4, 5, t), y = 360; g.save(); g.globalAlpha = a; ink(g, 2.2); g.fillStyle = C.leaf; ell(g, 610, y, 26, 14, -0.4); g.fill(); g.stroke(); g.fillStyle = C.bed; g.beginPath(); g.moveTo(700, y + 18); g.lineTo(726, y - 22); g.lineTo(752, y + 18); g.closePath(); g.fill(); g.stroke(); otterD(g, 830, y + 4, 0.55, -1, 0);
            lab(D, D.en ? 'plants' : '식물', 610, y + 52, 16); lab(D, D.en ? 'nature' : '자연', 726, y + 52, 16); lab(D, D.en ? 'animals' : '동물', 828, y + 52, 16); g.restore(); } } },
      { d: 24, cap: [[0, T2('강물이 더러우면 물고기가 살기 어려워요.', 'Fish find it hard to live in dirty rivers.')], [7, T2('쓰레기를 치우고 더러운 물이 흘러들지 않게 하면 강이 맑아져요.', 'Clearing trash and stopping dirty water makes a river clean.')], [16, T2('물이 맑아지면 물고기가 늘어나요.', 'As the water gets clean, more fish live there.')]],
        draw(D) { const g = D.g, t = D.t, clean = ss(6, 15, t), fish = ss(13, 22, t); riverX(D, clean, false);
          ink(g, 2.4); g.fillStyle = '#8f8f8f'; g.fillRect(150, 200, 70, 24); g.strokeRect(150, 200, 70, 24); const fl = 1 - ss(7.5, 9.5, t); if (fl > 0) { g.save(); g.globalAlpha = fl; g.strokeStyle = '#6b5a3a'; g.lineWidth = 5; g.beginPath(); g.moveTo(220, 212); g.quadraticCurveTo(250, 220, 258, 262); g.stroke(); g.restore(); }   /* 더러운 물 = 관에서 흘러듦 → 멈춤 */
          TRASH.forEach(([x, y, k], i) => { const a = 1 - ss(8 + i * 1.2, 8.8 + i * 1.2, t); if (a <= 0) return; g.save(); g.globalAlpha = a; ink(g, 2.2); g.fillStyle = C.pap2; if (k === 0) { g.fillRect(x - 10, y - 14, 20, 28); g.strokeRect(x - 10, y - 14, 20, 28); } else if (k === 1) { g.beginPath(); g.moveTo(x - 18, y + 10); g.quadraticCurveTo(x - 4, y - 24, x + 18, y + 8); g.closePath(); g.fill(); g.stroke(); } else { g.fillRect(x - 6, y - 20, 12, 34); g.strokeRect(x - 6, y - 20, 12, 34); } g.restore(); });
          for (let i = 0; i < 10; i++) { if (fish * 10 < i + 1) break; const x = 120 + ((i * 137) % 700) + Math.sin(D.T * 0.6 + i) * 14, y = 300 + (i * 53) % 150; fishD(g, x, y, 1.6, i % 2 ? 1 : -1); }
          meter(D, 600, 24, 300, D.en ? 'Clean' : '맑기', 0.1 + clean * 0.9, C.sea); meter(D, 600, 60, 300, D.en ? 'Fish' : '물고기', 0.1 + fish * 0.9, C.fish);
          const tb = ss(1, 22, t); ink(g, 2.4); g.strokeRect(120, 506, 720, 14); g.fillStyle = C.ink; g.fillRect(120, 506, 720 * tb, 14); lab(D, D.en ? 'years of care' : '강을 가꾼 시간', 480, 500, 15, C.ink, 'center'); } },
      { d: 13, cap: [[0, T2('먹이가 많아지자 수달이 다시 찾아와요.', 'With plenty of food, otters come back.')], [6.5, T2('수달은 주로 밤에 물고기를 잡아요.', 'Otters mostly catch fish at night.')]],
        draw(D) { const g = D.g, t = D.t, nt = t > 6.5; riverX(D, 1, nt); for (let i = 0; i < 8; i++) { const caught = nt && i === 2 && t > 10; if (caught) continue; fishD(g, 120 + ((i * 137) % 700) + Math.sin(D.T * 0.6 + i) * 14, 300 + (i * 53) % 150, 1.6, i % 2 ? 1 : -1); }
          ink(g, 2.4); g.fillStyle = C.ink; ell(g, 860, 222, 30, 18); g.fill(); g.strokeStyle = C.otter; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(820 + i * 22, 180); g.quadraticCurveTo(830 + i * 20, 210, 812 + i * 26, 236); g.stroke(); }   /* 둑 굴 + 나무뿌리 */
          if (!nt) { const p = ss(0.5, 6, t); otterD(g, lerp(-60, 420, p), 252, 1.15, 1, 1); otterD(g, lerp(-160, 300, p), 256, 0.7, 1, 1); otterD(g, lerp(-240, 210, p), 256, 0.7, 1, 1); }
          else { const k = t - 6.5, dv = ss(1, 3.5, k); otterD(g, lerp(480, 360, dv), lerp(252, 390, dv) - ss(4.5, 6, k) * 130, 1.15, -1, 1); if (k > 3.6) fishD(g, lerp(360, 360, 0) - 78, lerp(390, 260, ss(4.5, 6, k)) - 6, 1.2, -1); otterD(g, 250, 256, 0.7, 1, 1); otterD(g, 170, 256, 0.7, 1, 1); } } },
      { d: 6, end: 1, cap: [[0, T2('오늘 배운 것을 수첩에 담았어요.', 'Saved to your notebook.')]], beat: [[0.3, T => { T(523, 0, 0.25, 'triangle', 0.05); T(659, 0.18, 0.35, 'triangle', 0.05); }]],
        draw(D) { const g = D.g, a = ss(0, 0.8, D.t); paper(g); g.globalAlpha = a; txt(g, D.en ? 'What we learned' : '오늘 배운 것', VW / 2, 120, 26, C.red, 'center', 900); D.cc.forEach((l, i) => txt(g, l, VW / 2, 190 + i * 48, 34, C.ink, 'center', 900));
          g.fillStyle = C.sea; g.fillRect(170, 330, 160, 90); ink(g, 2.4); g.strokeRect(170, 330, 160, 90); fishD(g, 480, 375, 2.6, 1); otterD(g, 740, 380, 1.2, 1, 0); txt(g, '→', 380, 390, 40, C.ink, 'center', 900); txt(g, '→', 600, 390, 40, C.ink, 'center', 900);
          lab(D, D.en ? 'clean river' : '맑은 강', 250, 452, 18); lab(D, D.en ? 'fish' : '물고기', 480, 452, 18); lab(D, D.en ? 'otter' : '수달', 740, 452, 18); g.globalAlpha = 1; } },
    ] },
  butterfly: { icon: '🦋', t: T2('애벌레에서 나비까지', 'From Caterpillar to Butterfly'), place: /곤충\s?박물관|곤충관/, col: '#c27a1a',
    learn: 'nature:metamorph', concept: T2('알 → 애벌레 → 번데기 → 어른벌레|번데기를 거치는 한살이 = 갖춘탈바꿈', 'Egg → larva → pupa → adult|A life cycle with a pupa = complete metamorphosis'),
    scenes: [
      { d: 4, cap: [[0, T2('배추흰나비가 자라는 차례를 시간 막대로 따라가요.', 'Follow a cabbage white as it grows, on a time bar.')]],
        draw(D) { const g = D.g; paper(g); txt(g, D.tt, VW / 2, 250, 52, C.ink, 'center', 900); const W = []; for (let i = 0; i <= 24; i++) W.push([240 + i * 20, 300 + Math.sin(i * 0.9) * 8]); line(D, W, ss(0.3, 2.6, D.t), 3); } },
      { d: 9, cap: [[0, T2('배추흰나비는 배추나 무 잎에 알을 하나씩 낳아요.', 'It lays eggs one by one on cabbage or radish leaves.')], [5, T2('알은 옥수수처럼 길쭉하고 노란빛이에요.', 'Each egg is long like a corn kernel and yellowish.')]],
        draw(D) { const g = D.g, t = D.t; paper(g); leafD(g, 90, 360, 3.1, -0.06); lifeBar(D, 4 * ss(0, 9, t), 0); const fx = t < 4.2 ? lerp(-80, 470, ss(0, 3.2, t)) : lerp(470, 1040, ss(4.2, 6.5, t)), fy = t < 4.2 ? lerp(140, 300, ss(0, 3.2, t)) : lerp(300, 120, ss(4.2, 6.5, t));
          if (t < 6.5) flyD(g, fx, fy, 1, t > 3.2 && t < 4.2 ? 0.25 : 0.55 + 0.45 * Math.abs(Math.sin(D.T * 3)));
          if (t > 3.8) { ink(g, 1.6); g.fillStyle = C.egg; ell(g, 470, 330, 4, 8); g.fill(); g.stroke(); }
          if (t > 5) { const a = ss(5, 6, t); g.save(); g.globalAlpha = a; g.fillStyle = C.pap; ell(g, 760, 300, 92, 92); g.fill(); ink(g, 3); g.stroke(); line(D, [[478, 324], [672, 290]], 1, 1.6, [6, 6]); g.fillStyle = C.egg; g.beginPath(); g.ellipse(760, 300, 26, 56, 0, 0, 6.2832); g.fill(); ink(g, 2.2); g.stroke(); ink(g, 1.2); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(760 + i * 9, 248); g.lineTo(760 + i * 10, 352); g.stroke(); } lab(D, '1 mm', 760, 380, 16); g.restore(); } } },
      { d: 18, cap: [[0, T2('알에서 나온 애벌레는 먼저 알껍데기를 먹어요.', 'A newly hatched caterpillar first eats its eggshell.')], [5.5, T2('잎을 먹고 자라며 허물을 네 번 벗어요.', 'It eats leaves, grows and sheds its skin four times.')], [11.5, T2('허물을 벗을 때마다 몸이 커져요.', 'Each time it sheds its skin, its body gets bigger.')]],
        draw(D) { const g = D.g, t = D.t, MT = [6, 9.5, 13, 16.5], m = MT.filter(q => t >= q).length; paper(g); leafD(g, 90, 360, 3.1, -0.06); lifeBar(D, 4 + 15 * ss(0, 18, t), m);
          g.fillStyle = C.pap; for (let i = 0; i < 7; i++) { const r = clamp((t - 4 - i * 1.8) / 1.8) * 34; if (r > 0) { ell(g, 840 - i * 52, 300 + (i % 2) * 18, r, r * 0.9); g.fill(); } }   /* 잎을 갉아 먹은 자리 */
          const sh = 1 - ss(1, 4, t); if (sh > 0.02) { ink(g, 1.4); g.fillStyle = C.egg; ell(g, 470, 330, 4 * sh, 8 * sh); g.fill(); g.stroke(); }
          MT.forEach((q, i) => { if (t > q) { g.fillStyle = '#e8e1c8'; ink(g, 1.2); ell(g, lerp(480, 760, q / 18) - 10, 380, 9 + i * 4, 4); g.fill(); g.stroke(); } });   /* 벗은 허물 */
          caterD(g, t < 4.5 ? 466 : lerp(480, 760, ss(4.5, 17.5, t)), 352, [0.7, 1.0, 1.3, 1.65, 2.0][m], D.T * 2); } },   /* 허물 벗을 때마다 한 번에 커짐 */
      { d: 12, cap: [[0, T2('다 자란 애벌레는 실로 몸을 붙이고 번데기가 돼요.', 'A grown caterpillar fixes itself with silk and becomes a pupa.')], [6, T2('번데기는 아무것도 먹지 않아요.', 'A pupa does not eat anything.')]],
        draw(D) { const g = D.g, t = D.t, m = ss(2.5, 5, t); paper(g); lifeBar(D, 19 + 8 * ss(0, 12, t), 4); ink(g, 10); g.strokeStyle = '#a07c52'; g.beginPath(); g.moveTo(560, 80); g.quadraticCurveTo(520, 300, 600, 540); g.stroke();
          if (m < 1) { g.save(); g.globalAlpha = 1 - m; g.translate(548, 300); g.rotate(-1.45); caterD(g, 0, 0, 1.3, 0); g.restore(); } if (m > 0) { g.save(); g.globalAlpha = m; pupaD(g, 548, 300, 1.4); g.restore(); ink(g, 1.4); g.beginPath(); g.moveTo(530, 292); g.lineTo(552, 286); g.stroke(); }
          if (t > 6) for (let i = 0; i < 8; i++) { const on = (t - 6) * 1.3 > i; g.fillStyle = on ? C.ink : C.pap; ell(g, 140 + i * 34, 470, 9, 9); g.fill(); ink(g, 1.4); g.stroke(); }   /* 지나간 날(점 하나 = 하루) */
          if (t > 6) lab(D, D.en ? 'days pass' : '날이 지나요', 140, 446, 16, C.ink, 'left'); } },
      { d: 9, cap: [[0, T2('번데기에서 어른벌레인 나비가 나와요.', 'The adult butterfly comes out of the pupa.')], [4.5, T2('날개를 말린 뒤 날아올라 꽃꿀을 먹어요.', 'It dries its wings, flies up and drinks nectar.')]],
        draw(D) { const g = D.g, t = D.t, op = ss(1, 4, t), fl = ss(4.5, 8, t); paper(g); lifeBar(D, 27 + 4 * ss(0, 9, t), 4); ink(g, 10); g.strokeStyle = '#a07c52'; g.beginPath(); g.moveTo(560, 80); g.quadraticCurveTo(520, 300, 600, 540); g.stroke();
          g.fillStyle = '#e4e8d6'; g.beginPath(); g.moveTo(548, 254); g.lineTo(563, 280); g.lineTo(559, 326); g.lineTo(548, 344); g.lineTo(537, 326); g.lineTo(533, 280); g.closePath(); g.fill(); ink(g, 1.6); g.stroke();   /* 빈 번데기 껍질 */
          ink(g, 3); g.strokeStyle = '#6f8a4a'; g.beginPath(); g.moveTo(230, 540); g.lineTo(230, 380); g.stroke(); g.fillStyle = '#e9a7c0'; for (let k = 0; k < 6; k++) { ell(g, 230 + Math.cos(k * 1.047) * 18, 366 + Math.sin(k * 1.047) * 18, 12, 12); g.fill(); ink(g, 1.6); g.stroke(); } g.fillStyle = C.egg; ell(g, 230, 366, 10, 10); g.fill(); g.stroke();
          const x = lerp(548, 236, fl), y = lerp(282, 336, fl) - Math.sin(fl * 3.14) * 90; flyD(g, x, y, 0.5 + op * 0.6, fl > 0.02 && fl < 0.98 ? 0.4 + 0.6 * Math.abs(Math.sin(D.T * 3)) : 0.2 + op * 0.8); } },
      { d: 7, end: 1, cap: [[0, T2('오늘 배운 것을 수첩에 담았어요.', 'Saved to your notebook.')]], beat: [[0.3, T => { T(523, 0, 0.25, 'triangle', 0.05); T(659, 0.18, 0.35, 'triangle', 0.05); }]],
        draw(D) { const g = D.g, a = ss(0, 0.8, D.t); paper(g); g.globalAlpha = a; txt(g, D.en ? 'What we learned' : '오늘 배운 것', VW / 2, 110, 26, C.red, 'center', 900); D.cc.forEach((l, i) => txt(g, l, VW / 2, 180 + i * 48, 32, C.ink, 'center', 900));
          ink(g, 1.6); g.fillStyle = C.egg; ell(g, 220, 380, 14, 28); g.fill(); g.stroke(); caterD(g, 470, 380, 1.4, 0); pupaD(g, 620, 380, 1); flyD(g, 790, 380, 0.9, 1); for (const x of [300, 545, 700]) txt(g, '→', x, 392, 36, C.ink, 'center', 900); g.globalAlpha = 1; } },
    ] },
};

// 장소 이름 → 쇼 id(없으면 null)
export function showFor(name) { const n = String(name || ''); if (/주차장|정류장|화장실/.test(n)) return null; for (const id in SHOWS) if (SHOWS[id].place.test(n)) return id; return null; }
// o = { openP(html) → 창, closeP(), tone(…), en() → bool, learn(id), say(글) }
export function createShow(o) {
  let S = null;   // 지금 쇼
  const total = sh => sh.scenes.reduce((a, s) => a + s.d, 0);
  function stop() { if (!S) return; cancelAnimationFrame(S.raf); if (S.mo) S.mo.disconnect(); S = null; }
  function close() { const was = !!S; stop(); if (was) o.closeP(); }
  function open(id, from) { const sh = SHOWS[id]; if (!sh) return false; stop(); const en = !!o.en(), L = a => a[en ? 1 : 0];
    const h = '<style>.twn-p .shw{position:relative;width:min(100%,calc((88vh - 170px) * 1.7778));aspect-ratio:16/9;margin:0 auto;border:4px solid var(--ink);border-radius:10px;overflow:hidden;background:' + C.pap + '}'
      + '.twn-p .shw canvas{display:block;width:100%;height:100%}.twn-p .scap{width:min(100%,calc((88vh - 170px) * 1.7778));margin:8px auto 0;min-height:2.7em;box-sizing:border-box;text-align:center;font-weight:800;font-size:clamp(14px,2.2vw,19px);line-height:1.35;color:' + C.ink + ';background:' + C.pap + ';border:2px solid ' + C.ink + ';border-radius:8px;padding:6px 10px;display:flex;align-items:center;justify-content:center}'
      + '.twn-p .sbar{height:12px;margin:8px auto 0;width:min(100%,calc((88vh - 170px) * 1.7778));background:' + C.pap2 + ';border:2px solid var(--ink);border-radius:6px;cursor:pointer;overflow:hidden}.twn-p .sbar i{display:block;height:100%;width:0;background:#c9a24a}</style>'
      + '<h3>' + sh.icon + ' ' + L(sh.t) + (from ? ' <span class="sm">' + from + '</span>' : '') + '</h3><div class="shw"><canvas></canvas></div><div class="scap" aria-live="polite"></div><div class="sbar" title="' + (en ? 'Click to move' : '눌러서 옮기기') + '"><i></i></div>'
      + '<div class="row"><button class="sub" data-a="back">' + (en ? 'Back 5 s' : '5초 뒤로') + '</button><button class="sub" data-a="pause">' + (en ? 'Pause' : '멈춤') + '</button><button data-a="x">' + (en ? 'Close' : '닫기') + '</button></div>';
    const P9 = o.openP(h); if (!P9) return false; const cv = P9.querySelector('canvas'), r = cv.getBoundingClientRect(), dpr = Math.min(1.5, window.devicePixelRatio || 1);
    cv.width = Math.max(320, Math.round(r.width * dpr)); cv.height = Math.round(cv.width * 9 / 16); const g = cv.getContext('2d'), R = rng(11);
    S = { id, sh, cv, g, P9, cap: P9.querySelector('.scap'), bar: P9.querySelector('.sbar i'), pb: P9.querySelector('[data-a="pause"]'), T: 0, last: 0, acc: 0, ci: '', bsc: -1, bi: 0, raf: 0, paused: false, ended: false, learned: false, tot: total(sh), nb: 0,
      D: { g, t: 0, T: 0, en, fs: clamp(620 / Math.max(1, r.width), 1, 2.2), tt: L(sh.t), cc: L(sh.concept).split('|'), J: Array.from({ length: 31 }, () => [(R() - 0.5) * 1.6, (R() - 0.5) * 1.6]) } };
    const seek = T => { if (!S) return; S.T = clamp(T, 0, S.tot); S.bsc = -1; S.ended = false; frame(); if (!S.paused) go(); };
    P9.addEventListener('click', e => { if (!S) return; const sb = e.target.closest && e.target.closest('.sbar'); if (sb) { const q = sb.getBoundingClientRect(); seek((e.clientX - q.left) / q.width * S.tot); return; }
      const b = e.target.closest && e.target.closest('button'); if (!b) return; const a = b.dataset.a; if (a === 'x') close(); else if (a === 'back') seek(S.T - 5); else if (a === 'pause') { if (S.ended) { S.paused = false; seek(0); } else { S.paused = !S.paused; if (!S.paused) go(); } btn(); } });
    P9.addEventListener('keydown', e => { if (e.code === 'Escape') close(); else if (e.code === 'Space') { e.preventDefault(); S && S.pb.click(); } });
    S.mo = new MutationObserver(() => { if (S && S.cv === cv && !cv.isConnected) stop(); }); S.mo.observe(document.body, { childList: true });   /* 멈춤·끝난 채 Esc·다른 창으로 닫혀도 바로 놓음(그리기 고리가 없을 때) */
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
    if (sc.end && !S.learned) { S.learned = true; o.learn(sh.learn); if (o.seen) o.seen(S.id); }   /* REC-0 끝까지 본 쇼 */
    if ((S.nb += 1) % 6 === 0 || S.T >= S.tot || S.paused) S.bar.style.width = (S.T / S.tot * 100).toFixed(1) + '%'; }
  return { open, close, halt: stop, get on() { return !!S; }, info: () => S ? { id: S.id, T: +S.T.toFixed(1), tot: S.tot, ended: S.ended, paused: S.paused, cap: S.cap.textContent } : null, seek: T => { if (S) { S.T = clamp(T, 0, S.tot); S.bsc = -1; frame(); } }, pause: v => { if (S) { S.paused = !!v; if (!S.paused) go(); btn(); } },
    list: () => Object.keys(SHOWS).map(k => ({ id: k, d: total(SHOWS[k]), learn: SHOWS[k].learn, t: SHOWS[k].t })) };
}
