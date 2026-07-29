// 캔버스로 그리는 텍스처들 (외부 이미지 의존 0)
import * as THREE from 'three';

const KR_FONT = "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif";

function canvasTex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---------- 글자 팻말 (텍스처·지오메트리 캐시 — 같은 글자는 GPU에 1장만) ----------
const SIGN_CACHE = new Map();
export function textSign(text, { h = 0.6, bg = '#ffffff', fg = '#1d3557', border = '#1d3557', pad = 26, fontPx = 72 } = {}) {
  const key = `${text}|${h}|${bg}|${fg}|${border}|${pad}|${fontPx}`;
  let entry = SIGN_CACHE.get(key);
  if (!entry) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = `bold ${fontPx}px ${KR_FONT}`;
    const tw = Math.ceil(ctx.measureText(text).width);
    c.width = tw + pad * 2;
    c.height = fontPx + pad * 1.4;
    const x = ctx; // re-grab after resize
    x.font = `bold ${fontPx}px ${KR_FONT}`;
    x.fillStyle = bg;
    x.beginPath();
    x.roundRect(3, 3, c.width - 6, c.height - 6, 18);
    x.fill();
    if (border) { x.lineWidth = 6; x.strokeStyle = border; x.stroke(); }
    x.fillStyle = fg;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(text, c.width / 2, c.height / 2 + 4);
    const tex = canvasTex(c);
    const w = h * (c.width / c.height);
    entry = { geo: new THREE.PlaneGeometry(w, h), mat: new THREE.MeshBasicMaterial({ map: tex }) };
    SIGN_CACHE.set(key, entry);
  }
  // 앞뒤 어느 쪽에서 봐도 글자가 똑바로 보이게 양면 구성
  const group = new THREE.Group();
  const front = new THREE.Mesh(entry.geo, entry.mat);
  const back = new THREE.Mesh(entry.geo, entry.mat);
  back.rotation.y = Math.PI;
  group.add(front, back);
  return group;
}

// ---------- 태극기 (근사) ----------
export function taegeukTexture() {
  const c = document.createElement('canvas');
  c.width = 600; c.height = 400;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, 600, 400);
  const cx = 300, cy = 200, r = 96;
  // 위 빨강 반원 (canvas는 y가 아래로 증가: 각도 π→2π 가 위쪽)
  x.fillStyle = '#cd2e3a';
  x.beginPath(); x.arc(cx, cy, r, Math.PI, Math.PI * 2, false); x.fill();
  x.fillStyle = '#0047a0';
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI, false); x.fill();
  x.fillStyle = '#cd2e3a';
  x.beginPath(); x.arc(cx - r / 2, cy, r / 2, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#0047a0';
  x.beginPath(); x.arc(cx + r / 2, cy, r / 2, 0, Math.PI * 2); x.fill();
  // 4괘
  const bar = 96, bh = 15, gap = 11, broken = 41;
  const drawTrigram = (tx, ty, pattern) => {
    const ang = Math.atan2(cy - ty, cx - tx) + Math.PI / 2;
    x.save();
    x.translate(tx, ty);
    x.rotate(ang);
    x.fillStyle = '#111';
    pattern.forEach((solid, i) => {
      const y = (i - 1) * (bh + gap) - bh / 2;
      if (solid) x.fillRect(-bar / 2, y, bar, bh);
      else {
        x.fillRect(-bar / 2, y, broken, bh);
        x.fillRect(bar / 2 - broken, y, broken, bh);
      }
    });
    x.restore();
  };
  drawTrigram(140, 95, [1, 1, 1]);   // 건
  drawTrigram(460, 95, [0, 1, 0]);   // 감
  drawTrigram(140, 305, [1, 0, 1]);  // 리
  drawTrigram(460, 305, [0, 0, 0]);  // 곤
  return canvasTex(c);
}

// ---------- 운동장 (흙 마당 — 위성사진: 트랙 없는 맨 흙 + 축구장 라인만) ----------
export function trackTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 564;
  const x = c.getContext('2d');
  x.fillStyle = '#d9bd8f';
  x.fillRect(0, 0, c.width, c.height);
  // 모래 질감 점 + 옅은 얼룩
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = 'rgba(150,120,75,0.18)';
  for (let i = 0; i < 26; i++) {
    x.beginPath();
    x.ellipse(rnd() * 1024, rnd() * 564, 30 + rnd() * 90, 18 + rnd() * 50, rnd() * 3.14, 0, Math.PI * 2);
    x.fill();
  }
  x.fillStyle = 'rgba(160,130,80,0.25)';
  for (let i = 0; i < 900; i++) x.fillRect(rnd() * 1024, rnd() * 564, 2, 2);
  const cx = 512, cy = 282;
  // 축구장
  x.strokeStyle = 'rgba(255,255,255,0.75)';
  x.lineWidth = 5;
  x.strokeRect(cx - 260, cy - 130, 520, 260);
  x.beginPath(); x.moveTo(cx, cy - 130); x.lineTo(cx, cy + 130); x.stroke();
  x.beginPath(); x.arc(cx, cy, 55, 0, Math.PI * 2); x.stroke();
  x.strokeRect(cx - 260, cy - 70, 70, 140);
  x.strokeRect(cx + 190, cy - 70, 70, 140);
  return canvasTex(c);
}

// ---------- 체육관 바닥 (마루+코트) ----------
export function courtTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 709;
  const x = c.getContext('2d');
  x.fillStyle = '#cf9f63';
  x.fillRect(0, 0, c.width, c.height);
  // 마루판
  x.strokeStyle = 'rgba(120,80,35,0.28)';
  x.lineWidth = 2;
  for (let i = 0; i < 1024; i += 34) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 709); x.stroke();
  }
  const cx = 512, cy = 354;
  // 코트
  x.strokeStyle = '#ffffff'; x.lineWidth = 6;
  x.strokeRect(cx - 400, cy - 240, 800, 480);
  x.beginPath(); x.moveTo(cx, cy - 240); x.lineTo(cx, cy + 240); x.stroke();
  x.beginPath(); x.arc(cx, cy, 70, 0, Math.PI * 2); x.stroke();
  // 양쪽 키(자유투 구역)
  x.fillStyle = 'rgba(220,90,60,0.55)';
  x.fillRect(cx - 400, cy - 105, 150, 210);
  x.fillRect(cx + 250, cy - 105, 150, 210);
  x.strokeRect(cx - 400, cy - 105, 150, 210);
  x.strokeRect(cx + 250, cy - 105, 150, 210);
  x.beginPath(); x.arc(cx - 250, cy, 70, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.arc(cx + 250, cy, 70, 0, Math.PI * 2); x.stroke();
  return canvasTex(c);
}

// ---------- 얼굴 ----------
export function faceTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#f6cfa4';
  x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#2b2b2b';
  x.beginPath(); x.arc(84, 112, 15, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(172, 112, 15, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#ffffff';
  x.beginPath(); x.arc(89, 106, 5, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(177, 106, 5, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#c96f4a'; x.lineWidth = 9; x.lineCap = 'round';
  x.beginPath(); x.arc(128, 148, 38, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
  x.fillStyle = 'rgba(240,130,130,0.55)';
  x.beginPath(); x.arc(58, 160, 18, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(198, 160, 18, 0, Math.PI * 2); x.fill();
  return canvasTex(c);
}

// ---------- 책꽂이 줄무늬 ----------
export function bookStripes() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const x = c.getContext('2d');
  const colors = ['#e76f51', '#2a9d8f', '#e9c46a', '#457b9d', '#b56576', '#6d9f71', '#f4a261', '#5e60ce'];
  let seed = 13;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let px = 0;
  while (px < 256) {
    const w = 10 + rnd() * 16;
    x.fillStyle = colors[Math.floor(rnd() * colors.length)];
    x.fillRect(px, 3, w - 2, 61);
    px += w;
  }
  return canvasTex(c);
}
