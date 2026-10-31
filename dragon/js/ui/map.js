// 손그림 지도(2장 추적 · 6장 하늘 지도) — 큰 지형(바위·개울·고사목·벼랑·큰 나무·통나무)과 히컵이 짐작한 X만 · 내 위치는 없음(방위·지형으로 맞대기)
// 종이 캔버스 하나 · 그릴 때 한 번(매 프레임 X) · 북쪽 화살표 · 글은 우리 말 이름만
const CSS = `#map { position:fixed; right:14px; top:14px; z-index:21; width:250px; height:250px; padding:6px; background:#efe2c4; border:2px solid #2b2118; border-radius:12px 18px 14px 20px / 18px 12px 20px 14px; box-shadow:3px 4px 0 rgba(43,33,24,.35); pointer-events:none; transition:width .3s, height .3s; }
#map canvas { width:100%; height:100%; display:block; } #map.big { width:min(520px,70vw); height:min(520px,70vh); } #map.gone { display:none; }`;
export function createMap() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'map'; el.className = 'gone'; const cv = document.createElement('canvas'); cv.width = cv.height = 600; el.appendChild(cv); document.body.appendChild(el);
  const X = cv.getContext('2d');
  const M = { el };
  /* data = place.mapSketch() → { bounds:{x0,z0,x1,z1}, path:[[x,z]…](그리지 않음 — 길은 땅에서 찾음), landmarks:[{kind,x,z,r,label}] } · guess = {x,z,r} 히컵이 짐작한 자리 */
  M.draw = (data, guess, opt = {}) => {
    const b = data.bounds, S = 560 / Math.max(b.x1 - b.x0, b.z1 - b.z0), ox = 20, oz = 20;
    const px = (x) => ox + (x - b.x0) * S, pz = (z) => oz + (b.z1 - z) * S;      // 위 = +z(북)
    X.clearRect(0, 0, 600, 600); X.fillStyle = '#efe2c4'; X.fillRect(0, 0, 600, 600);
    X.strokeStyle = '#2b2118'; X.fillStyle = '#2b2118'; X.lineCap = 'round'; X.lineJoin = 'round';
    /* 흔들리는 손 선 */
    const wob = (i) => Math.sin(i * 12.9898) * 1.6;
    for (const L of data.landmarks || []) {
      const x = px(L.x), y = pz(L.z), r = Math.max(8, (L.r || 4) * S);
      X.lineWidth = 3;
      if (L.kind === 'rock' || L.kind === 'boulders') { X.beginPath(); for (let k = 0; k <= 9; k++) { const a = k / 9 * 6.283, rr = r * (0.8 + 0.2 * Math.sin(k * 2.1 + x)); X.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75); } X.closePath(); X.fillStyle = '#b8ad98'; X.fill(); X.stroke(); if (L.kind === 'boulders') { X.beginPath(); X.arc(x + r * 0.9, y + r * 0.3, r * 0.45, 0, 6.3); X.fill(); X.stroke(); } }
      else if (L.kind === 'stream') { X.strokeStyle = '#5f8aa8'; X.lineWidth = 5; X.beginPath(); const pts = L.pts || [[L.x - (L.r || 20), L.z], [L.x + (L.r || 20), L.z]]; pts.forEach(([a, c], i) => (i ? X.lineTo(px(a) + wob(i), pz(c)) : X.moveTo(px(a), pz(c)))); X.stroke(); X.strokeStyle = '#2b2118'; }
      else if (L.kind === 'deadtree') { X.beginPath(); X.moveTo(x, y + 14); X.lineTo(x, y - 14); X.moveTo(x, y - 4); X.lineTo(x - 9, y - 12); X.moveTo(x, y - 8); X.lineTo(x + 8, y - 16); X.stroke(); }
      else if (L.kind === 'bigtree') { X.beginPath(); X.moveTo(x, y + 14); X.lineTo(x, y); X.stroke(); X.beginPath(); X.arc(x, y - 8, 12, 0, 6.3); X.fillStyle = '#7a9a62'; X.fill(); X.stroke(); }
      else if (L.kind === 'cliff') { X.beginPath(); X.moveTo(x - r, y); X.lineTo(x + r, y); X.stroke(); for (let k = -r; k <= r; k += 8) { X.beginPath(); X.moveTo(x + k, y); X.lineTo(x + k + 4, y + 9); X.stroke(); } }
      else if (L.kind === 'log') { X.beginPath(); X.moveTo(x - r, y - 3); X.lineTo(x + r, y + 3); X.lineWidth = 7; X.strokeStyle = '#8a6a42'; X.stroke(); X.strokeStyle = '#2b2118'; X.lineWidth = 3; }
      else { X.beginPath(); X.arc(x, y, 6, 0, 6.3); X.stroke(); }
      if (L.label) { X.font = 'bold 22px sans-serif'; X.fillStyle = '#2b2118'; X.fillText(L.label, x + r + 6, y + 6); }
    }
    if (guess) {                                            // 히컵의 짐작(빨간 X + 둘레 동그라미)
      const x = px(guess.x), y = pz(guess.z), r = (guess.r || 12) * S; X.strokeStyle = '#a83e1e'; X.lineWidth = 4;
      X.beginPath(); X.moveTo(x - 12, y - 12); X.lineTo(x + 12, y + 12); X.moveTo(x + 12, y - 12); X.lineTo(x - 12, y + 12); X.stroke();
      X.setLineDash([8, 7]); X.beginPath(); X.arc(x, y, r, 0, 6.3); X.stroke(); X.setLineDash([]); X.strokeStyle = '#2b2118';
    }
    if (opt.start) { const x = px(opt.start.x), y = pz(opt.start.z); X.font = 'bold 20px sans-serif'; X.fillText(opt.start.label || '마을 길', x - 30, y + 26); X.beginPath(); X.moveTo(x - 10, y + 6); X.lineTo(x + 10, y + 6); X.lineWidth = 4; X.stroke(); }
    /* 북쪽 화살표 */
    X.lineWidth = 3; X.beginPath(); X.moveTo(560, 70); X.lineTo(560, 22); X.moveTo(550, 36); X.lineTo(560, 22); X.lineTo(570, 36); X.stroke(); X.font = 'bold 24px sans-serif'; X.fillText('북', 548, 96);
    el.classList.remove('gone');
  };
  M.hide = () => el.classList.add('gone');
  M.big = (on) => el.classList.toggle('big', !!on);
  return M;
}
