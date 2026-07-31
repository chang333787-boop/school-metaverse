// 캔버스로 그리는 텍스처들 (외부 이미지 의존 0)
import * as THREE from 'three';
import { mergeGeometries } from '../lib/BufferGeometryUtils.js';

const KR_FONT = "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif";

// ============================================================
// 팔레트 규율 + 알베도 — 아트 디렉션 조사 반영 (docs/art_direction_20260731.md)
//
// ① 색상(hue)을 8개 앵커로 수렴시킨다.
//    실측: 서로 다른 색 200종 중 절반이 딱 한 번만 쓰였고, 구분 불가한 색 쌍이 348개였다.
//    = 팔레트가 아니라 그때그때 고른 색 → "한 사람이 그린 그림"으로 안 보이는 이유.
// ② 알베도를 낮춘다. Inigo Quilez: "화면이 더 밝아야 하면 재질이 아니라 조명을 밝게 하라."
//    알베도가 0.9면 그늘에서 밝기를 10%밖에 못 잃는다 → 모든 형태가 조명 안 받은 플라스틱.
//    실측: 200색 중 164색이 명도 0.4 이상이었다(= 어두운 앵커 없음).
//
// ⚠️ 색을 바꾸고 싶으면 개별 hex 가 아니라 이 세 상수를 만질 것.
//    ⚠️ ALBEDO_HI 를 0.6 위로 올리면 다시 플라스틱처럼 보인다.
// ============================================================
// ⚠️ 실패에서 배운 것 (한 번 되돌림):
//  · 알베도를 **HSL 명도**로 낮추면 채도가 상대적으로 올라 전부 탁한 겨자색이 된다.
//    반드시 **RGB 배율**로 낮출 것 — 그래야 색끼리의 관계(어느 게 더 밝은지)가 보존된다.
//  · 색상 앵커를 8개까지 줄이면 모래(38°)·외벽(45°)·목재(28°)가 한 색으로 뭉친다.
//    12개(30° 간격)가 중복 색을 정리하면서 재료 구분은 남기는 지점.
const HUE_ANCHORS = [8, 25, 45, 70, 95, 125, 155, 190, 210, 250, 285, 330];
// 0.66 까지 낮췄더니 '노란 외벽'이 베이지가 되어 학교 인식성(스타일 1순위)을 잃었다.
// 0.84 = 형태에 볼륨은 생기되 밝고 명랑한 학교 색은 유지되는 지점.
const ALBEDO_K = 0.84;    // RGB 배율. 낮출수록 볼륨이 생기고 높이면 플라스틱이 된다
const SAT_CAP = 0.62;

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (mx === r) h = 60 * (((g - b) / d) % 6);
  else if (mx === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  return [(h + 360) % 360, s, l];
}
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  const q = v => Math.max(0, Math.min(255, Math.round((v + m) * 255)));
  return (q(r) << 16) | (q(g) << 8) | q(b);
}

const SHADE_CACHE = new Map();
/** 모든 단색이 반드시 통과하는 관문. hex(number) → 팔레트·알베도 적용된 hex(number) */
export function shade(hex, opt) {
  const key = hex + (opt || '');
  if (SHADE_CACHE.has(key)) return SHADE_CACHE.get(key);
  let [h, s, l] = rgbToHsl((hex >> 16) & 255, (hex >> 8) & 255, hex & 255);
  if (s > 0.12 && opt !== 'keepHue') {          // 무채색·거의 무채색은 색상 스냅 대상이 아님
    let best = HUE_ANCHORS[0], bd = 999;
    for (const a of HUE_ANCHORS) {
      const d = Math.min(Math.abs(h - a), 360 - Math.abs(h - a));
      if (d < bd) { bd = d; best = a; }
    }
    h = best;
    s = Math.min(s, SAT_CAP);
  }
  // 알베도는 RGB 배율로 (명도로 누르면 탁해진다)
  // opt==='bright' = 캐릭터 피부처럼 시선의 초점인 것은 낮추지 않는다
  const snapped = hslToHex(h, s, l);
  const k = opt === 'bright' ? 1 : ALBEDO_K;
  const q = v => Math.max(0, Math.min(255, Math.round(v * k)));
  const out = (q((snapped >> 16) & 255) << 16) | (q((snapped >> 8) & 255) << 8) | q(snapped & 255);
  SHADE_CACHE.set(key, out);
  return out;
}
/** 캔버스 텍스처 안에서 쓰는 문자열 버전 */
export function shadeCss(css) {
  const n = parseInt(css.replace('#', ''), 16);
  return '#' + shade(n).toString(16).padStart(6, '0');
}


// ---------- 🧻 골판지 스킨 톤 (원래 밝기 → 골판지 색) ----------
const CARD_STEPS = [[0.22, 0x5e442c], [0.40, 0x7d5c3a], [0.56, 0x9c7448], [0.72, 0xba8f5d], [1.01, 0xd3ad78]];
const CARD_HUE_KEEP = 0.16;   // 원래 색을 조금 남겨 나무·칠판이 아직 구분되게
export function cardTone(r, g, b) {
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let c = CARD_STEPS[CARD_STEPS.length - 1][1];
  for (const [t, v] of CARD_STEPS) if (l <= t) { c = v; break; }
  const k = CARD_HUE_KEEP;
  return [((c >> 16 & 255) / 255) * (1 - k) + r * k,
          ((c >> 8 & 255) / 255) * (1 - k) + g * k,
          ((c & 255) / 255) * (1 - k) + b * k];
}

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
    // 앞뒤를 지오메트리 1개로 병합 (π 회전만으로 뒷면 글자도 똑바로 보임 — UV 뒤집기 금지)
    const front = new THREE.PlaneGeometry(w, h).toNonIndexed();
    const back = new THREE.PlaneGeometry(w, h).toNonIndexed();
    back.rotateY(Math.PI);
    entry = { geo: mergeGeometries([front, back], false), mat: new THREE.MeshBasicMaterial({ map: tex }) };
    SIGN_CACHE.set(key, entry);
  }
  return new THREE.Mesh(entry.geo, entry.mat);
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
  x.fillStyle = shadeCss('#d9bd8f');
  x.fillRect(0, 0, c.width, c.height);
  // 모래 질감 점 + 옅은 얼룩 (크고 진하면 구름 그림자로 오인 — 작고 옅게)
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = 'rgba(150,120,75,0.07)';
  for (let i = 0; i < 46; i++) {
    x.beginPath();
    x.ellipse(rnd() * 1024, rnd() * 564, 14 + rnd() * 34, 9 + rnd() * 20, rnd() * 3.14, 0, Math.PI * 2);
    x.fill();
  }
  x.fillStyle = 'rgba(160,130,80,0.25)';
  for (let i = 0; i < 1500; i++) x.fillRect(rnd() * 1024, rnd() * 564, 2, 2);
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
  x.fillStyle = shadeCss('#cf9f63');
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

// ---------- 하늘 그라디언트 (EquirectangularReflectionMapping 필수) ----------
// mode: day | sunset | night — 지평선 색은 main.js의 fog 색과 맞춰야 함
export function skyTexture(mode = 'day') {
  const stops = {
    day: [[0, '#3d8edb'], [0.42, '#7cc0ee'], [0.5, '#cfe9f8'], [1, '#dfeef7']],
    sunset: [[0, '#3f4e8f'], [0.3, '#b06a9a'], [0.44, '#ee9a5f'], [0.5, '#f7c48e'], [1, '#e8b284']],
    night: [[0, '#070d22'], [0.35, '#141f42'], [0.5, '#253a63'], [1, '#1d2c4a']],
  }[mode] || [[0, '#3d8edb'], [1, '#dfeef7']];
  const c = document.createElement('canvas');
  c.width = mode === 'night' ? 512 : 16;
  c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, 256);
  if (mode === 'night') {
    let seed = 42;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // 별은 지평선(y=128) 근처까지 자연스럽게 옅어지며 이어짐 (뚝 끊긴 띠 방지)
    for (let i = 0; i < 420; i++) {
      const sy = rnd() * 126;
      const fade = sy > 90 ? (126 - sy) / 36 : 1;
      x.fillStyle = `rgba(255,255,${230 + Math.floor(rnd() * 25)},${(0.3 + rnd() * 0.65) * fade})`;
      const r = rnd() < 0.1 ? 1.8 : 1;
      x.fillRect(rnd() * 512, sy, r, r);
    }
  }
  const t = canvasTex(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

// ---------- 얼굴 ----------
export function faceTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#' + shade(0xf6cfa4, 'bright').toString(16).padStart(6,'0');   // 머리 상자와 같은 톤
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

// ---------- 초록 그물 펜스 (대각 격자 — RepeatWrapping으로 타일링) ----------
export function netTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 64, 64);
  x.strokeStyle = '#2f8f4f';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(0, 0); x.lineTo(64, 64);
  x.moveTo(64, 0); x.lineTo(0, 64);
  // 타일 경계에서 이어지도록 모서리 보강
  x.moveTo(-32, 32); x.lineTo(32, 96);
  x.moveTo(32, -32); x.lineTo(96, 32);
  x.moveTo(96, 32); x.lineTo(32, 96);
  x.moveTo(32, -32); x.lineTo(-32, 32);
  x.stroke();
  return canvasTex(c);
}

// ---------- 책꽂이 줄무늬 ----------
export function bookStripes() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const x = c.getContext('2d');
  const colors = ['#e76f51', '#2a9d8f', '#e9c46a', '#457b9d', '#b56576', '#6d9f71', '#f4a261', '#5e60ce'].map(shadeCss);
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

// ---------- 컬러 모자이크 옹벽 (실사: 구령대 계단 왼쪽 옹벽) ----------
// 파스텔 돌조각이 흰 줄눈으로 불규칙하게 붙은 벽. 조각 크기·색이 제각각인 게 특징.
export function mosaicTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = shadeCss('#f2efe6');            // 줄눈(흰 시멘트)
  x.fillRect(0, 0, 256, 128);
  // 실물은 파스텔 조각이 **크기도 모양도 제각각**이라 격자로 보이면 안 된다.
  const cols = ['#e3c274', '#dd93a4', '#8fb4cf', '#9ec089', '#e2ddd0', '#cba071'].map(shadeCss);
  let seed = 29;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rows = 4, rh = 128 / rows;
  for (let r = 0; r < rows; r++) {
    let px = -rnd() * 40;
    const yBase = r * rh;
    while (px < 264) {
      const w = 12 + rnd() * 44;                    // 폭 편차를 크게 (12~56)
      const hj = rnd() * 7 - 3.5;                   // 줄 높이도 흔든다
      const y = yBase + 2 + rnd() * 3;
      const h = rh - 4 + hj;
      x.fillStyle = cols[Math.floor(rnd() * cols.length)];
      x.beginPath();
      // 5각형으로 찍어 돌조각처럼 (모서리마다 다른 크기로 어긋냄)
      x.moveTo(px + rnd() * 5, y + rnd() * 3);
      x.lineTo(px + w * (0.45 + rnd() * 0.2), y - rnd() * 3);
      x.lineTo(px + w - rnd() * 5, y + rnd() * 4);
      x.lineTo(px + w - rnd() * 4, y + h - rnd() * 3);
      x.lineTo(px + rnd() * 6, y + h + rnd() * 2);
      x.closePath();
      x.fill();
      px += w * (0.82 + rnd() * 0.2);               // 겹쳐 붙여 줄눈 폭도 제각각
    }
  }
  return canvasTex(c);
}

// ---------- 흰 마름돌 무늬 (계단 오른쪽 옹벽 — 색 없이 돌 조각만) ----------
export function rubbleTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = shadeCss('#efece2');
  x.fillRect(0, 0, 128, 128);
  x.strokeStyle = shadeCss('#b9b3a4');
  x.lineWidth = 2;
  let seed = 91;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) {
    const cx2 = rnd() * 128, cy2 = rnd() * 128, r = 9 + rnd() * 13;
    x.beginPath();
    for (let a = 0; a < 5; a++) {
      const th = (a / 5) * Math.PI * 2 + rnd() * 0.4;
      const rr = r * (0.7 + rnd() * 0.5);
      const px2 = cx2 + Math.cos(th) * rr, py2 = cy2 + Math.sin(th) * rr;
      a === 0 ? x.moveTo(px2, py2) : x.lineTo(px2, py2);
    }
    x.closePath();
    x.stroke();
  }
  return canvasTex(c);
}

// ---------- 탑시계 문자판 (실사: 정면 광장의 4면 기둥형 시계) ----------
export function clockFace() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = shadeCss('#fbf8f0');
  x.fillRect(0, 0, 128, 128);
  x.strokeStyle = shadeCss('#2f3438');
  x.lineWidth = 6;
  x.beginPath(); x.arc(64, 64, 55, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 4;
  for (let i = 0; i < 12; i++) {                       // 눈금
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 40 : 46;
    x.beginPath();
    x.moveTo(64 + Math.sin(a) * r0, 64 - Math.cos(a) * r0);
    x.lineTo(64 + Math.sin(a) * 51, 64 - Math.cos(a) * 51);
    x.stroke();
  }
  x.lineWidth = 7; x.lineCap = 'round';
  x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + 24, 64 - 14); x.stroke();   // 시침 ~2시
  x.lineWidth = 5;
  x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + 6, 64 - 40); x.stroke();    // 분침 ~12시
  x.fillStyle = shadeCss('#2f3438');
  x.beginPath(); x.arc(64, 64, 5, 0, Math.PI * 2); x.fill();
  return canvasTex(c);
}

// ---------- 로비 바닥 컴퍼스 로즈 (실사: 현관 로비 중앙 8각 별 모자이크) ----------
export function compassRose() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = shadeCss('#dedbd2');            // 테라조 바탕
  x.fillRect(0, 0, 256, 256);
  x.strokeStyle = shadeCss('#8f8b80');
  x.lineWidth = 5;
  x.beginPath(); x.arc(128, 128, 112, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.arc(128, 128, 92, 0, Math.PI * 2); x.stroke();
  const star = (n, r0, r1, col, rot) => {
    x.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      const b1 = a - Math.PI / n, b2 = a + Math.PI / n;
      x.beginPath();
      x.moveTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
      x.lineTo(128 + Math.cos(b1) * r0, 128 + Math.sin(b1) * r0);
      x.lineTo(128, 128);
      x.closePath(); x.fill();
      x.beginPath();
      x.moveTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
      x.lineTo(128 + Math.cos(b2) * r0, 128 + Math.sin(b2) * r0);
      x.lineTo(128, 128);
      x.closePath(); x.fill();
    }
  };
  star(4, 30, 88, shadeCss('#7a4e36'), Math.PI / 4);   // 사선 4방(적갈)
  star(4, 34, 104, shadeCss('#2f3033'), 0);            // 정방 4방(검정)
  x.fillStyle = shadeCss('#f2efe6');
  x.beginPath(); x.arc(128, 128, 16, 0, Math.PI * 2); x.fill();
  return canvasTex(c);
}

// ---------- 자전거 교통코스 바닥 (실사: 컬러 회전교차로 원 + 차선 + 사방치기) ----------
export function courseTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = shadeCss('#b4b8bd');                 // 회색 포장 바탕
  x.fillRect(0, 0, 512, 512);
  const cx = 236, cy = 250;
  // 회전교차로 — 컬러 링 3겹 + 분홍 중앙
  [[110, '#e8c33c'], [86, '#4d9bd6'], [62, '#8fc47a']].forEach(([r, col]) => {
    x.strokeStyle = shadeCss(col); x.lineWidth = 20;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  });
  x.fillStyle = shadeCss('#e39bb0');
  x.beginPath(); x.arc(cx, cy, 46, 0, Math.PI * 2); x.fill();
  // 진입 차선 4방 (흰 점선)
  x.strokeStyle = shadeCss('#f2f2ee'); x.lineWidth = 8; x.setLineDash([18, 14]);
  [[cx, 0, cx, 128], [cx, 372, cx, 512], [0, cy, 114, cy], [358, cy, 512, cy]].forEach(([a, b, d, e]) => {
    x.beginPath(); x.moveTo(a, b); x.lineTo(d, e); x.stroke();
  });
  x.setLineDash([]);
  // 사방치기 (우상단) — 숫자 1·2·3 + 강아지 얼굴
  const hx = 420, hy = 78, cell = 52;
  x.strokeStyle = shadeCss('#f2f2ee'); x.lineWidth = 6;
  x.font = `bold 30px sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  [0, 1, 2].forEach(i => {
    x.strokeRect(hx - cell / 2, hy + i * cell, cell, cell);
    x.fillStyle = shadeCss(['#e8c33c', '#4d9bd6', '#e39bb0'][i]);
    x.fillRect(hx - cell / 2 + 3, hy + i * cell + 3, cell - 6, cell - 6);
    x.fillStyle = shadeCss('#2f3033');
    x.fillText(String(i + 1), hx, hy + i * cell + cell / 2);
  });
  // 강아지 얼굴 (동그라미+귀+점눈코)
  const dx = 420, dy = 300;
  x.fillStyle = shadeCss('#d9a05b');
  x.beginPath(); x.arc(dx, dy, 26, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(dx - 20, dy - 20, 10, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.arc(dx + 20, dy - 20, 10, 0, Math.PI * 2); x.fill();
  x.fillStyle = shadeCss('#2f3033');
  [[-9, -4], [9, -4]].forEach(([ex, ey]) => { x.beginPath(); x.arc(dx + ex, dy + ey, 3, 0, Math.PI * 2); x.fill(); });
  x.beginPath(); x.arc(dx, dy + 8, 4.5, 0, Math.PI * 2); x.fill();
  return canvasTex(c);
}
