// (임시 자리 — 배경 팀 탑뷰 그림이 오면 바뀜) 약속 = docs/dragon/art2d_contract.md v2 §2
const C = { void: '#1d2730', grass: '#8fae62', grass2: '#6f9150', path: '#c9a878', stone: '#a8a294', sand: '#e2cf9a', snow: '#eef0ec', water: '#5f9ab0', sea: '#3f7f8a', deep: '#2f5a6a', wood: '#b08a5a', arena: '#9a958a', rockfloor: '#6a5a58', plank: '#a07a4a', wall: '#5a4a3a', cliff: '#6a6460' };
export function bakeChunk(map, cx, cy, N, PX) {
  const c = document.createElement('canvas'); c.width = c.height = N * PX; const x = c.getContext('2d');
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { x.fillStyle = C[map.kind(cx * N + i, cy * N + j)] || '#000'; x.fillRect(i * PX, j * PX, PX, PX); }
  return c;
}
export function drawProp(ctx, kind, o) {
  ctx.lineWidth = 0.04; ctx.strokeStyle = '#2b2118';
  const w = o.w || (kind === 'cage' ? 4 : kind === 'catapult' ? 2 : 1), h = kind === 'house' || kind === 'hall' || kind === 'forge' ? 3.4 : kind === 'tower' ? 4 : kind === 'tree' || kind === 'pine' ? 3 : kind === 'cage' ? 2.2 : 0.9;
  if (kind === 'net_roof') { ctx.globalAlpha = 0.25; ctx.strokeRect(-o.w / 2, -o.d, o.w, o.d); ctx.globalAlpha = 1; return; }
  if (kind === 'cloud') { ctx.fillStyle = 'rgba(244,240,230,.9)'; ctx.beginPath(); ctx.ellipse(0, 0, o.w / 2, o.h / 2, 0, 0, 7); ctx.fill(); return; }
  if (kind === 'seastack') { ctx.fillStyle = '#7a7266'; ctx.beginPath(); ctx.arc(0, 0, o.r || 1.2, 0, 7); ctx.fill(); ctx.stroke(); return; }
  ctx.fillStyle = kind === 'house' ? (o.burn ? '#c0603a' : '#8a6a42') : kind === 'tree' || kind === 'pine' ? '#4f7a3a' : kind === 'torch' ? '#f2a63a' : '#9a958a';
  ctx.fillRect(-w / 2, -h, w, h); ctx.strokeRect(-w / 2, -h, w, h);
}
