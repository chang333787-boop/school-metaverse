// 🎬 영화관 짧은 영화(CINE-3 · 사용자 10-27 "영화관 영화가 짧은 영상 느낌 나면 좋겠어")
//   영화관 큰 화면(캔버스 512×216) 위에 움직이는 low-poly 그림 영화 — 장면마다 카메라가 밀고·당기고·따라가고, 인물·배경이 움직이고, 마디에 맞춰 장면이 바뀜
//   한 편 40~50초 · 세 편(갯벌 다큐 · 사계절 논 · 소방관의 하루) · 사실만 · 판타지 X · 실명 X · 무서운 장면 X(불은 작은 연기만)
//   그림 = 납작한 색 면(종이 교과서 결 · 그라데이션·빛 번짐 X) · 소리 = town_music.js playEv(마디 박자 · 장면이 바뀌는 마디에 북)
//   매 프레임 새 배열을 거의 만들지 않음(점 목록은 모듈 위 상수) · 마을 장면·빛에는 손대지 않음(캔버스 2D만)
export const CINE_V = 1;
const T2 = (ko, en) => [ko, en];
const FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const ease = q => q < 0 ? 0 : q > 1 ? 1 : q * q * (3 - 2 * q), lerp = (a, b, q) => a + (b - a) * q;
const hsh = i => { let h = (i * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return (h & 0xffff) / 65536; };
function poly(g, c, ...p) { g.fillStyle = c; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); }
function box(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function dot(g, c, x, y, r) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
function oval(g, c, x, y, rx, ry) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.2832); g.fill(); }
function hills(g, c, y, amp, step, off) { g.fillStyle = c; g.beginPath(); g.moveTo(-400, 400); for (let x = -400; x <= 1000; x += step) g.lineTo(x, y - amp * (0.5 + 0.5 * Math.sin((x + off) * 0.013) * Math.cos((x + off) * 0.007))); g.lineTo(1000, 400); g.closePath(); g.fill(); }
// ── 생물·탈것(가운데 x,y · 크기 s · 걸음 ph) ──
function crab(g, x, y, s, ph, up) { const c = '#b5523a', k = '#7a3324'; for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const a = Math.sin(ph * 9 + i + (sd > 0 ? 1.5 : 0)) * 2; g.strokeStyle = k; g.lineWidth = 1.6 * s; g.beginPath(); g.moveTo(x + sd * 6 * s, y - 1 * s + i * 2 * s); g.lineTo(x + sd * 12 * s, y - 4 * s + i * 2 * s + a); g.lineTo(x + sd * 14 * s, y + 4 * s + i * 2 * s); g.stroke(); }
  poly(g, c, x - 9 * s, y, x - 6 * s, y - 6 * s, x + 6 * s, y - 6 * s, x + 9 * s, y, x + 5 * s, y + 4 * s, x - 5 * s, y + 4 * s);
  const cl = up ? Math.sin(ph * 6) * 3 * s : 0; for (const sd of [-1, 1]) { poly(g, '#d0684a', x + sd * 8 * s, y - 6 * s - cl, x + sd * 13 * s, y - 10 * s - cl, x + sd * 11 * s, y - 4 * s - cl); }
  g.fillStyle = '#2b2420'; g.fillRect(x - 3 * s, y - 10 * s, 1.6 * s, 4 * s); g.fillRect(x + 1.6 * s, y - 10 * s, 1.6 * s, 4 * s); }
function skipper(g, x, y, s, ph, fin) { poly(g, '#6f7a5a', x - 16 * s, y, x - 4 * s, y - 6 * s, x + 12 * s, y - 4 * s, x + 16 * s, y, x + 10 * s, y + 3 * s, x - 12 * s, y + 3 * s); poly(g, '#8a9a6a', x - 18 * s, y - 3 * s, x - 14 * s, y, x - 18 * s, y + 3 * s);
  const f = fin * 7 * s; poly(g, '#4f5a40', x - 6 * s, y - 5 * s, x - 2 * s, y - 6 * s - f, x + 6 * s, y - 5 * s); dot(g, '#e8e0c8', x + 11 * s, y - 6 * s, 2.4 * s); dot(g, '#2b2420', x + 11.5 * s, y - 6.2 * s, 1.2 * s);
  const p = Math.sin(ph * 5) * 3 * s; poly(g, '#56604a', x + 2 * s, y + 2 * s, x + 6 * s + p, y + 7 * s, x - 1 * s + p, y + 6 * s); }
function wader(g, x, y, s, peck) { const hy = y - 26 * s + peck * 14 * s, hx = x + 10 * s + peck * 4 * s; g.strokeStyle = '#4a3a2a'; g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo(x - 2 * s, y - 8 * s); g.lineTo(x - 3 * s, y); g.moveTo(x + 3 * s, y - 8 * s); g.lineTo(x + 4 * s, y); g.stroke();
  oval(g, '#9a7a56', x, y - 14 * s, 11 * s, 7 * s); poly(g, '#7a5a3e', x - 11 * s, y - 15 * s, x - 18 * s, y - 12 * s, x - 9 * s, y - 11 * s); g.strokeStyle = '#9a7a56'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x + 7 * s, y - 18 * s); g.lineTo(hx, hy); g.stroke();
  dot(g, '#a8865e', hx, hy, 4 * s); g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.6 * s; g.beginPath(); g.moveTo(hx + 3 * s, hy); g.lineTo(hx + 18 * s, hy + 6 * s + peck * 6 * s); g.stroke(); dot(g, '#2b2420', hx + 1 * s, hy - 1 * s, 1 * s); }
function gull(g, x, y, s, ph) { const w = Math.sin(ph * 7) * 4 * s; g.strokeStyle = '#f6f4ee'; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(x - 9 * s, y - w); g.lineTo(x, y); g.lineTo(x + 9 * s, y - w); g.stroke(); }
function person(g, x, y, s, c, ph, o) { o = o || 0; const lg = Math.sin(ph * 8) * 3 * s * (o & 1 ? 0 : 1), hel = c === 'fire' ? '#e0b43a' : '#3a2a1e', bd = c === 'fire' ? '#2f4a6a' : c;
  g.strokeStyle = c === 'fire' ? '#24364e' : '#3a3a48'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x - 2 * s, y - 10 * s); g.lineTo(x - 2 * s + lg, y); g.moveTo(x + 2 * s, y - 10 * s); g.lineTo(x + 2 * s - lg, y); g.stroke();
  box(g, bd, x - 5 * s, y - 24 * s, 10 * s, 15 * s); if (c === 'fire') { box(g, '#e8d24a', x - 5 * s, y - 15 * s, 10 * s, 2 * s); box(g, '#e8d24a', x - 5 * s, y - 20 * s, 10 * s, 1.6 * s); }
  const ar = o & 2 ? -1.2 : Math.sin(ph * 8) * 0.4; g.strokeStyle = bd; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x + 4 * s, y - 22 * s); g.lineTo(x + 4 * s + Math.sin(1.6 + ar) * 9 * s, y - 22 * s + Math.cos(1.6 + ar) * 9 * s); g.stroke();
  dot(g, '#f2c9a0', x, y - 28 * s, 4.4 * s); poly(g, hel, x - 5 * s, y - 29 * s, x, y - 34 * s, x + 5 * s, y - 29 * s); }
function truck(g, x, y, s, lit, t) { box(g, '#d23a2e', x - 40 * s, y - 22 * s, 64 * s, 18 * s); poly(g, '#d23a2e', x + 24 * s, y - 4 * s, x + 24 * s, y - 24 * s, x + 34 * s, y - 24 * s, x + 42 * s, y - 12 * s, x + 42 * s, y - 4 * s); poly(g, '#bfe0f0', x + 27 * s, y - 21 * s, x + 33 * s, y - 21 * s, x + 39 * s, y - 13 * s, x + 27 * s, y - 13 * s);
  box(g, '#f6f4ee', x - 40 * s, y - 13 * s, 64 * s, 2.4 * s); box(g, '#c9ced4', x - 36 * s, y - 27 * s, 56 * s, 3 * s); for (let i = 0; i < 6; i++) box(g, '#9aa2aa', x - 34 * s + i * 9 * s, y - 29 * s, 1.6 * s, 5 * s);
  if (lit) { const on = ((t * 4) | 0) % 2; box(g, on ? '#ff4a3a' : '#7a2a22', x + 26 * s, y - 28 * s, 5 * s, 4 * s); box(g, on ? '#3a5a8a' : '#4a8aff', x + 32 * s, y - 28 * s, 5 * s, 4 * s); }
  for (const wx of [-26, 4, 30]) { dot(g, '#2b2420', x + wx * s, y - 3 * s, 6 * s); dot(g, '#9aa2aa', x + wx * s, y - 3 * s, 2.4 * s); } }
function car(g, x, y, s, c) { box(g, c, x - 16 * s, y - 10 * s, 32 * s, 7 * s); poly(g, c, x - 9 * s, y - 10 * s, x - 5 * s, y - 16 * s, x + 7 * s, y - 16 * s, x + 11 * s, y - 10 * s); poly(g, '#cfe6f0', x - 6 * s, y - 10.5 * s, x - 3.5 * s, y - 14.5 * s, x + 5.5 * s, y - 14.5 * s, x + 8 * s, y - 10.5 * s); dot(g, '#2b2420', x - 9 * s, y - 3 * s, 3.6 * s); dot(g, '#2b2420', x + 9 * s, y - 3 * s, 3.6 * s); }
function sprout(g, x, y, h, c, sw) { g.strokeStyle = c; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sw * 0.5, y - h * 0.6, x + sw - 3, y - h); g.moveTo(x, y); g.quadraticCurveTo(x + sw * 0.5, y - h * 0.5, x + sw + 3, y - h * 0.9); g.stroke(); }
function smoke(g, x, y, k, t) { if (k <= 0.02) return; for (let i = 0; i < 6; i++) { const q = ((t * 0.35 + i / 6) % 1), r = (5 + q * 16) * k; g.globalAlpha = (1 - q) * 0.7 * Math.min(1, k * 1.5); dot(g, '#8a8f99', x + Math.sin(q * 5 + i) * 8 + q * 14, y - q * 70, r); } g.globalAlpha = 1; }
// ── 장면 그리기: fn(g, q 장면 안 0~1, t 장면 초, d 장면 길이) · cam = [cx0, cy0, z0, cx1, cy1, z1] ──
const SKY = '#bfe0ef';
const FILMS = [
  { id: 'mud', t: T2('갯벌 친구들', 'Friends of the Mudflat'), bg: '#8a6a4a', bpm: 84, key: 57, inst: 'marimba', shots: [
    { bars: 1, title: 1 },
    { bars: 3, cap: T2('썰물이 되면 바닷물이 빠지고 갯벌이 드러나요.', 'At low tide the sea pulls back and the mudflat appears.'), cam: [170, 108, 1.0, 330, 112, 1.08],
      fn(g, q, t) { box(g, SKY, -200, -100, 1000, 300); hills(g, '#8fae7a', 86, 26, 30, 0); box(g, '#7a6248', -200, 100, 1000, 200); const wx = lerp(120, 470, ease(q));
        poly(g, '#5a9ac4', wx, 96, 900, 96, 900, 300, wx - 60, 300); for (let i = 0; i < 6; i++) { const yy = 118 + i * 16, x0 = wx - 10 * i + Math.sin(t * 2 + i) * 6; box(g, '#8fc0de', x0, yy, 30, 2); }
        for (let i = 0; i < 12; i++) { const x = 30 + i * 36, y = 130 + (i % 3) * 22; if (x < wx - 30) { oval(g, '#5e4a36', x, y, 6, 2.4); oval(g, '#9a8266', x + 2, y - 1, 3, 1); } } for (let i = 0; i < 3; i++) gull(g, 80 + ((t * 26 + i * 120) % 600), 40 + i * 10, 1, t + i); } },
    { bars: 3, cap: T2('칠게는 옆으로 걸어요. 집게발로 갯벌 흙을 떠서 먹이를 골라 먹어요.', 'Mud crabs walk sideways and scoop up mud with their claws to pick out food.'), cam: [256, 120, 1.0, 256, 132, 1.5],
      fn(g, q, t) { box(g, '#7a6248', -200, -100, 1000, 400); for (let i = 0; i < 9; i++) { const x = 60 + i * 52, y = 120 + (i % 2) * 34; oval(g, '#3e3024', x, y, 8, 3.2); }
        for (let i = 0; i < 7; i++) { const x0 = 60 + i * 52 + (i % 2 ? 26 : 0), y0 = 120 + (i % 2) * 34, up = ease((t - i * 0.4) / 1.2), dx = Math.max(0, t - 2 - i * 0.3) * (i % 2 ? -9 : 9); if (up <= 0) continue; crab(g, x0 + dx + 4, y0 - up * 6, 0.9, t + i, dx !== 0); } } },
    { bars: 3, cap: T2('짱뚱어는 물고기지만 가슴지느러미로 갯벌 위를 기어 다녀요.', 'The mudskipper is a fish, but it crawls over the mud on its chest fins.'), cam: [150, 132, 1.6, 360, 128, 1.6],
      fn(g, q, t) { box(g, '#7a6248', -200, -100, 1000, 400); for (let i = 0; i < 14; i++) oval(g, '#6a5440', i * 40 + 10, 150 + (i % 3) * 8, 14, 3); const x = 120 + t * 30, hop = Math.max(0, Math.sin(t * 2.2)) ** 6 * 16;
        for (let i = 0; i < 8; i++) { const fx = x - 16 - i * 14; if (fx > 60) oval(g, '#5e4a36', fx, 140 + (i % 2) * 3, 2, 1); } skipper(g, x, 136 - hop, 1.2, t, Math.max(0, Math.sin(t * 0.9))); } },
    { bars: 3, cap: T2('도요새는 긴 부리를 갯벌에 꽂아 숨은 먹이를 찾아요.', 'A sandpiper pushes its long beak into the mud to find hidden food.'), cam: [210, 104, 1.25, 290, 110, 1.4],
      fn(g, q, t) { box(g, SKY, -200, -100, 1000, 180); box(g, '#7a6248', -200, 80, 1000, 400); box(g, '#5a9ac4', -200, 78, 1000, 8); for (let i = 0; i < 2; i++) { const x = 170 + i * 120 + t * 6, pk = Math.max(0, Math.sin(t * 2.6 + i * 1.7)) ** 3; wader(g, x, 140 - i * 6, 1.25 - i * 0.2, pk); for (let k = 1; k < 6; k++) { const fx = x - k * 12; poly(g, '#5e4a36', fx, 142 - i * 6, fx - 4, 139 - i * 6, fx - 4, 145 - i * 6); } } } },
    { bars: 3, cap: T2('밀물이 들어오면 갯벌 친구들은 다시 구멍 속으로 숨어요.', 'When the tide comes back in, the mudflat animals hide in their holes again.'), cam: [256, 120, 1.35, 256, 108, 0.95],
      fn(g, q, t) { box(g, SKY, -200, -100, 1000, 300); hills(g, '#8fae7a', 86, 26, 30, 0); box(g, '#7a6248', -200, 100, 1000, 300); for (let i = 0; i < 9; i++) { const x = 60 + i * 52, y = 124 + (i % 2) * 30; oval(g, '#3e3024', x, y, 8, 3.2); const dn = ease(q * 2.2 - i * 0.12); if (dn < 1) crab(g, x, y - 4 + dn * 8, 0.7 * (1 - dn * 0.6), t + i, false); }
        const wx = lerp(560, 30, ease(q)); poly(g, '#5a9ac4', wx, 96, 900, 96, 900, 300, wx - 80, 300); for (let i = 0; i < 6; i++) box(g, '#8fc0de', wx - 8 * i + Math.sin(t * 2 + i) * 6, 118 + i * 16, 30, 2); } },
    { bars: 1, end: 1 } ] },
  { id: 'rice', t: T2('사계절 논', 'Rice Fields in Four Seasons'), bg: '#5a9a5a', bpm: 90, key: 60, inst: 'flute', shots: [
    { bars: 1, title: 1 },
    { bars: 3, cap: T2('봄에는 논에 물을 대고 이앙기로 모를 줄 맞춰 심어요.', 'In spring the field is flooded and a rice planter sets the seedlings in straight rows.'), cam: [140, 110, 1.15, 340, 116, 1.15],
      fn(g, q, t) { box(g, SKY, -200, -100, 1000, 300); hills(g, '#7fae6a', 70, 30, 24, 40); for (let i = 0; i < 5; i++) dot(g, '#f6d8e2', 30 + i * 110, 66 - (i % 2) * 6, 10); box(g, '#9ab8c8', -200, 92, 1000, 300); box(g, '#6b4a2f', -200, 90, 1000, 4);
        const mx = lerp(40, 470, q); for (let r = 0; r < 5; r++) for (let x = 30; x < mx - 24; x += 16) sprout(g, x, 112 + r * 18, 8, '#5f9a3a', 1);
        box(g, '#3d74c9', mx - 22, 98 + 0, 40, 14); box(g, '#2b2420', mx - 6, 84, 12, 14); person(g, mx, 98, 0.7, '#e0453a', t, 1); for (const k of [-14, 12]) dot(g, '#2b2420', mx + k, 114, 6); for (let r = 0; r < 4; r++) box(g, '#5f9a3a', mx - 28, 102 + r * 4, 6, 2); } },
    { bars: 3, cap: T2('여름에는 비와 햇볕을 듬뿍 받아 벼가 쑥쑥 자라요.', 'In summer the rice grows fast with plenty of rain and sunshine.'), cam: [256, 130, 1.3, 256, 104, 1.05],
      fn(g, q, t) { const rain = q < 0.5; box(g, rain ? '#9aa8b4' : SKY, -200, -100, 1000, 300); if (!rain) dot(g, '#f2c230', 430, 24, 16); hills(g, '#5f9a4a', 70, 30, 24, 40); box(g, '#6a9a3a', -200, 92, 1000, 300);
        const h = lerp(14, 30, q); for (let r = 0; r < 7; r++) for (let x = 8; x < 520; x += 12) sprout(g, x + (r % 2) * 6, 106 + r * 16, h, r % 2 ? '#3f7a2a' : '#4f8a34', Math.sin(t * 2 + x * 0.05) * 4);
        if (rain) { g.strokeStyle = '#e8f0f6'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i < 50; i++) { const x = hsh(i) * 560 - 20, y = ((hsh(i + 77) * 220 + t * 260) % 230) - 20; g.moveTo(x, y); g.lineTo(x - 3, y + 10); } g.stroke(); }
        const hx = 380; g.strokeStyle = '#d8dce0'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx, 120); g.lineTo(hx, 100); g.stroke(); oval(g, '#f6f4ee', hx + 4, 92, 12, 6); g.strokeStyle = '#f6f4ee'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx + 12, 88); g.lineTo(hx + 16, 76); g.stroke(); poly(g, '#e0b43a', hx + 16, 76, hx + 26, 79, hx + 16, 80); } },
    { bars: 4, cap: T2('가을이 되면 벼가 누렇게 익어 고개를 숙이고, 콤바인으로 거두어요.', 'In autumn the rice turns golden and bows its heads, and a combine harvests it.'), cam: [120, 112, 1.2, 360, 112, 1.2],
      fn(g, q, t) { box(g, '#cfe3ef', -200, -100, 1000, 300); hills(g, '#c98a3a', 70, 30, 24, 40); box(g, '#c9a14a', -200, 92, 1000, 300); const cx = lerp(560, 30, q);
        for (let r = 0; r < 7; r++) for (let x = 8; x < 520; x += 12) { const xx = x + (r % 2) * 6, y = 106 + r * 16; if (xx < cx + 20) { g.strokeStyle = '#e8c45a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(xx, y); g.lineTo(xx + 3, y - 22); g.stroke(); dot(g, '#d9a83a', xx + 7, y - 20, 3); } else box(g, '#a8823a', xx, y - 3, 2, 3); }
        box(g, '#2f9a55', cx - 4, 96, 44, 20); box(g, '#2b2420', cx + 26, 84, 12, 12); box(g, '#9a9488', cx - 14, 112, 16, 6); for (const k of [6, 30]) dot(g, '#2b2420', cx + k, 118, 5);
        for (let i = 0; i < 3; i++) { const dx = 100 + i * 140 + Math.sin(t * 1.3 + i) * 30, dy = 50 + Math.cos(t * 1.7 + i) * 10; box(g, '#e0402e', dx - 6, dy, 12, 2); const w = Math.sin(t * 30 + i) * 3; box(g, '#cfe6f0', dx - 4, dy - 4 + w * 0.3, 8, 2); } } },
    { bars: 3, cap: T2('겨울 논은 쉬어요. 볏짚을 둥글게 말아 소 먹이로 써요.', 'In winter the field rests. Rice straw is rolled into bales to feed cattle.'), cam: [256, 110, 1.35, 256, 104, 0.95],
      fn(g, q, t) { box(g, '#d8e2ea', -200, -100, 1000, 300); hills(g, '#eef2f4', 70, 30, 24, 40); box(g, '#e8ece6', -200, 92, 1000, 300); for (let r = 0; r < 7; r++) for (let x = 8; x < 520; x += 18) box(g, '#a8925a', x + (r % 2) * 9, 104 + r * 16, 2, 3);
        for (let i = 0; i < 4; i++) { const x = 90 + i * 110, y = 124 + (i % 2) * 18; oval(g, '#c9ced4', x, y + 10, 22, 4); dot(g, '#f6f4ee', x, y, 18); dot(g, '#e4e6e2', x - 4, y - 3, 8); }
        for (let i = 0; i < 2; i++) { const x = 200 + i * 60 + Math.sin(t + i) * 6; oval(g, '#2b2420', x, 150, 7, 4); box(g, '#f6f4ee', x - 3, 148, 6, 3); poly(g, '#2b2420', x - 6, 150, x - 18, 146, x - 6, 152); }
        g.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) { const x = (hsh(i) * 560 + Math.sin(t + i) * 10) - 20, y = ((hsh(i + 9) * 230 + t * 30) % 240) - 20; g.fillRect(x, y, 2, 2); } } },
    { bars: 1, end: 1 } ] },
  { id: 'fire', t: T2('소방관의 하루', 'A Day with Firefighters'), bg: '#b5483a', bpm: 100, key: 62, inst: 'piano', shots: [
    { bars: 1, title: 1 },
    { bars: 4, cap: T2('아침마다 소방차와 호스, 장비를 하나하나 점검해요.', 'Every morning they check the fire engine, the hoses and all the gear one by one.'), cam: [170, 112, 1.4, 330, 116, 1.4],
      fn(g, q, t) { box(g, SKY, -200, -100, 1000, 300); box(g, '#e8e0cf', 60, 20, 420, 140); box(g, '#b5483a', 60, 12, 420, 12); for (let i = 0; i < 3; i++) box(g, '#3a3a48', 90 + i * 130, 50, 110, 110); box(g, '#9a9488', -200, 158, 1000, 200);
        truck(g, 240, 158, 1.3, false, t); const px = lerp(170, 320, q); person(g, px, 160, 1.0, 'fire', t, q > 0.4 && q < 0.6 ? 3 : 0);
        const hr = ease((q - 0.55) / 0.4); if (hr > 0) { g.strokeStyle = '#e8d8b0'; g.lineWidth = 4; g.beginPath(); g.moveTo(200, 150); g.lineTo(200 - hr * 120, 160); g.stroke(); dot(g, '#c9a14a', 200 - hr * 120, 160, 4); } } },
    { bars: 4, cap: T2('출동할 때 소방차는 경광등과 사이렌을 켜요. 다른 차들은 길을 비켜 줘요.', 'On a call the fire engine turns on its lights and siren, and other cars make way.'), cam: [256, 116, 1.15, 256, 116, 1.15],
      fn(g, q, t) { box(g, SKY, -200, -100, 1000, 300); for (let i = 0; i < 10; i++) { const x = ((i * 90 - t * 60) % 900 + 900) % 900 - 200, h = 40 + (i * 37) % 60; box(g, ['#c8b89a', '#a8b8c8', '#d8c8b0'][i % 3], x, 120 - h, 70, h); for (let k = 0; k < 3; k++) box(g, '#f6f4ee', x + 10 + k * 20, 130 - h, 10, 10); }
        box(g, '#5a5f66', -200, 120, 1000, 100); for (let i = 0; i < 12; i++) box(g, '#f6f4ee', ((i * 70 - t * 260) % 840 + 840) % 840 - 200, 150, 30, 3); box(g, '#c9ced4', -200, 118, 1000, 4);
        for (let i = 0; i < 3; i++) { const cx = 140 + i * 130 - q * 40, side = ease((q * 4 - i * 0.8)), y = 178 - side * 36; car(g, cx, y, 1.0, ['#3d74c9', '#f2c230', '#f6f4ee'][i]); }
        truck(g, lerp(-60, 300, ease(q * 1.2)), 176, 1.0, true, t); } },
    { bars: 4, cap: T2('호스로 물을 뿌려 불을 끄고, 연기가 다 걷힐 때까지 살펴요.', 'They spray water from the hose to put out the fire and keep watching until the smoke is gone.'), cam: [300, 100, 1.3, 260, 108, 1.15],
      fn(g, q, t) { box(g, SKY, -200, -100, 1000, 300); box(g, '#9a9488', -200, 150, 1000, 200); box(g, '#f2e6c8', 300, 70, 120, 80); poly(g, '#8a5a3e', 290, 72, 360, 30, 430, 72); box(g, '#3a3a48', 340, 110, 22, 40);
        const fire = Math.max(0, 1 - ease((q - 0.15) / 0.6)); box(g, fire > 0.05 ? '#f2a03a' : '#bfe0f0', 380, 90, 24, 20); if (fire > 0.05) dot(g, '#e0453a', 392, 102, 6 * fire); smoke(g, 392, 88, Math.max(0.15 * (1 - q), fire), t);
        truck(g, 120, 160, 1.0, true, t); person(g, 210, 160, 1.0, 'fire', t, 3); person(g, 196, 160, 0.95, 'fire', t + 1, 1);
        if (q > 0.08 && q < 0.85) { g.fillStyle = '#8fc8f0'; for (let i = 0; i < 26; i++) { const u = ((t * 1.6 + i / 26) % 1), x = 218 + u * 168, y = 136 - Math.sin(u * Math.PI) * 50 + u * 10 + hsh(i) * 4; g.fillRect(x, y, 3, 3); } } } },
    { bars: 4, cap: T2('연기가 나면 몸을 낮추고 코와 입을 막은 채 비상구로 대피해요.', 'If there is smoke, stay low, cover your nose and mouth, and leave by the emergency exit.'), cam: [200, 110, 1.2, 300, 112, 1.25],
      fn(g, q, t) { box(g, '#f2ecd8', -200, -100, 1000, 300); box(g, '#c9b48a', -200, 160, 1000, 200); box(g, '#2f9a55', 440, 60, 50, 24); g.fillStyle = '#ffffff'; g.fillRect(450, 66, 8, 12); poly(g, '#ffffff', 462, 72, 474, 66, 474, 78); box(g, '#8a6a4a', 440, 90, 50, 70);
        person(g, 110, 160, 1.1, 'fire', t, 2); for (let i = 0; i < 4; i++) { const x = lerp(160 + i * 26, 410 + i * 8, ease(q * 1.3 - i * 0.08)), cr = q > 0.12 ? 0.62 : 1; g.save(); g.translate(x, 160); g.scale(1, cr); person(g, 0, 0, 0.75, ['#e0453a', '#3d74c9', '#f2c230', '#5fae5a'][i], t * 0.7 + i); g.restore(); if (q > 0.12) box(g, '#f6f4ee', x + 1, 160 - 28 * 0.75 * cr - 1, 4, 3); } } },
    { bars: 3, cap: T2('돌아오면 소방차를 씻고 다음 출동을 준비해요.', 'Back at the station they wash the fire engine and get ready for the next call.'), cam: [240, 110, 1.15, 260, 116, 1.35],
      fn(g, q, t) { box(g, '#f2b46a', -200, -100, 1000, 300); dot(g, '#f6d06a', 420, 60, 22); box(g, '#e8e0cf', 60, 20, 420, 140); box(g, '#b5483a', 60, 12, 420, 12); for (let i = 0; i < 3; i++) box(g, i === 1 ? '#f2d27a' : '#3a3a48', 90 + i * 130, 50, 110, 110); box(g, '#9a9488', -200, 158, 1000, 200);
        truck(g, 240, 158, 1.3, false, t); person(g, 340, 160, 1.0, 'fire', t, 3); g.fillStyle = '#bfe8ff'; for (let i = 0; i < 20; i++) { const u = (t * 1.4 + i / 20) % 1; g.fillRect(332 - u * 60, 138 - Math.sin(u * 3) * 14 + u * 10, 3, 3); }
        for (let i = 0; i < 6; i++) { const u = (t * 0.5 + i / 6) % 1; g.globalAlpha = 1 - u; dot(g, '#ffffff', 220 + i * 18, 150 - u * 30, 4); } g.globalAlpha = 1; } },
    { bars: 1, end: 1 } ] },
];
export const CINE = FILMS;
const barS = f => 240 / f.bpm;
export const filmLen = f => f.shots.reduce((a, s) => a + s.bars, 0) * barS(f);
// 한 장(그 영화 T초) — 돌려줌 = 장면 번호(시험이 장면이 바뀌는지 셈)
export function filmDraw(g, W, H, f, T, en) { const b = barS(f); let t0 = 0, si = 0; for (; si < f.shots.length; si++) { const d = f.shots[si].bars * b; if (T < t0 + d || si === f.shots.length - 1) break; t0 += d; }
  const sh = f.shots[si], d = sh.bars * b, t = Math.max(0, T - t0), q = Math.min(1, t / d), L = x => x[en ? 1 : 0];
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.textBaseline = 'middle';
  if (sh.title || sh.end) { g.fillStyle = '#15121c'; g.fillRect(0, 0, W, H); const a = ease(Math.min(t / 0.6, (d - t) / 0.5)); g.globalAlpha = a; g.fillStyle = f.bg; g.fillRect(W / 2 - 160, H / 2 - 2, 320, 4); g.fillStyle = '#f6f4ee'; g.textAlign = 'center';
    g.font = '900 ' + (sh.title ? 34 : 26) + 'px ' + FONT; g.fillText(sh.title ? L(f.t) : (en ? 'The End' : '끝'), W / 2, H / 2 - 26); g.font = '700 15px ' + FONT; g.fillStyle = '#c9c2b0'; g.fillText(sh.title ? (en ? 'A short film about our town' : '우리 마을 짧은 영화') : L(f.t), W / 2, H / 2 + 24); g.globalAlpha = 1; return si; }
  const c = sh.cam, k = ease(q), cx = lerp(c[0], c[3], k), cy = lerp(c[1], c[4], k), z = lerp(c[2], c[5], k);
  g.fillStyle = '#15121c'; g.fillRect(0, 0, W, H);   /* 장면이 덮지 않는 띠에 앞 장이 남지 않게 */
  g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip(); g.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z); sh.fn(g, q, t, d); g.restore(); g.setTransform(1, 0, 0, 1, 0, 0);
  const fade = Math.max(0, 1 - t / 0.35, 1 - (d - t) / 0.35); if (fade > 0) { g.globalAlpha = Math.min(1, fade); g.fillStyle = '#15121c'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }   /* 장면 사이 = 짧게 어두워졌다 밝아짐 */
  if (sh.cap) { g.font = '800 17px ' + FONT; g.textAlign = 'center'; const txt = L(sh.cap), ln = wrap(g, txt, W - 40); const y0 = H - 12 - (ln.length - 1) * 21; g.globalAlpha = 0.6; g.fillStyle = '#15121c'; g.fillRect(0, y0 - 14, W, ln.length * 21 + 12); g.globalAlpha = Math.min(1, t / 0.5); g.fillStyle = '#ffffff'; ln.forEach((s, i) => g.fillText(s, W / 2, y0 + i * 21)); g.globalAlpha = 1; }
  return si; }
function wrap(g, t, w) { const out = []; let cur = ''; for (const ch of t) { if (g.measureText(cur + ch).width > w && cur) { const sp = cur.lastIndexOf(' '); if (sp > 4) { out.push(cur.slice(0, sp)); cur = cur.slice(sp + 1) + ch; } else { out.push(cur); cur = ch; } } else cur += ch; } if (cur) out.push(cur); return out.slice(0, 2); }
// 소리(town_music.js playEv 사건) — 마디마다 화음 판 + 낮은 소리 + 5음 가락(씨앗으로 고정) · 장면이 바뀌는 마디 첫 박 = 북 · 소방 출동 장면 = 두 음 번갈아(사이렌 흉내 · 작게)
const PENT = [0, 2, 4, 7, 9], PROG = [0, 7, 9, 5];
export function filmMusic(f) { const ev = [], b = 60 / f.bpm, B = 4 * b, K = f.key; let bar = 0, si = 0;
  for (const sh of f.shots) { for (let j = 0; j < sh.bars; j++, bar++) { const t = bar * B, r = K + PROG[bar % 4] - 12, fin = sh.end && j === sh.bars - 1;
      if (j === 0) ev.push({ t, ch: 'dk', d: 'G', v: si ? 0.32 : 0.4 }); ev.push({ t, ch: 'r2', i: 'bass', m: r, l: B * 0.9, v: 0.07 });
      for (const iv of [12, 16, 19]) ev.push({ t, ch: 'r1', i: 'pad', m: r + iv, l: B * 0.95, v: 0.028 });
      if (!sh.title && !fin) for (let e = 0; e < 8; e++) { if (hsh(bar * 8 + e + si * 31) < 0.34) continue; const deg = (hsh(bar * 13 + e) * 5) | 0, oc = hsh(bar * 7 + e * 3) < 0.3 ? 12 : 0; ev.push({ t: t + e * b / 2, ch: 'lead', i: f.inst, m: K + PENT[deg] + oc, l: b * 0.45, v: 0.06 }); }
      if (f.id === 'fire' && si === 2) for (let e = 0; e < 4; e++) ev.push({ t: t + e * b, ch: 'r1', i: 'flute', m: K + (e % 2 ? 7 : 12), l: b * 0.9, v: 0.025 });
      if (f.id === 'fire' && !sh.title && !fin) for (let e = 0; e < 4; e++) ev.push({ t: t + e * b, ch: 'dk', d: e % 2 ? 'D' : 'G', v: 0.12 });
      if (fin) ev.push({ t, ch: 'lead', i: f.inst, m: K + 12, l: B * 0.9, v: 0.06 }); }
    si++; }
  return ev; }
