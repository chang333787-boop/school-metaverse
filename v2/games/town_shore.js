// 🦀 갯벌 물때 + 바다 친구 관찰(SHORE-1 · 발전 방향 #35 · 교사 10-17): 놀이 코드와 떼어 둔 자료·규칙·그림(곤충 관찰 town_bugs.js와 같은 결 — 잡지 않고 돋보기로 보기만)
//   물때 = 실제 결(하루에 밀물·썰물이 두 번씩 · 한 바퀴 약 12시간 25분 · 날마다 약 50분씩 늦어짐) · 썰물(간조 앞뒤 약 1시간 반) 동안만 갯벌이 드러남 → 바다 친구·조개 캐기
//   밀물 = 갯벌 위로 물낯 한 장이 올라옴(1초마다 높이만 바꿈 · 썰물엔 숨김) · 갯벌 가까이 있을 때만 '물이 들어와요' 알림 · 물때 칩은 갯벌 가까이 갔을 때만
//   바다 친구 = 우리나라 갯벌에서 흔히 보는 것 — 실제 사실만(지어낸 이야기 X) · 겨울엔 게·망둥어가 굴 속에서 지내서 고둥·갯지렁이만
import { photoHtml } from './town_places.js?v=1';   // LIVING-1 실제 사진(창 안에서만 · 출처 한 줄)
export const SHORE_V = 1;
const ALL = ['spring', 'summer', 'autumn', 'winter'], WARM = ['spring', 'summer', 'autumn'];
export const SHORE = [
  { id: 'chilge', sea: WARM, draw: 'crab', c: ['#8f8068', '#5a4c3a'], t: ['칠게', 'Chilge mud crab'], line: ['긴 눈자루를 세우고, 집게발로 펄을 떠서 먹이를 골라 먹어요', 'Raises its long eye stalks and scoops up mud with its claws to pick out food'] },
  { id: 'nongge', sea: WARM, draw: 'fiddler', c: ['#5e5040', '#e0453a'], t: ['농게', 'Fiddler crab'], line: ['수컷은 한쪽 집게발이 아주 크고 빨개요', 'The male has one very big red claw'] },
  { id: 'godung', sea: ALL, draw: 'snail', c: ['#6d5f50', '#b3a58f'], t: ['갯고둥', 'Mud snail'], line: ['펄 위를 천천히 기어 다니며 먹이를 먹어요 — 껍데기는 나선 모양', 'Crawls slowly over the mud eating — its shell is a spiral'] },
  { id: 'worm', sea: ALL, draw: 'worm', c: ['#cf7a66', '#8a3a2e'], t: ['갯지렁이', 'Lugworm'], line: ['펄 속에 굴을 파고 살아요 — 펄 속 찌꺼기를 먹어 갯벌을 깨끗하게 해요', 'Lives in a burrow — it eats bits in the mud and helps keep the mudflat clean'] },
  { id: 'skipper', sea: WARM, draw: 'skipper', c: ['#7d6d55', '#4a7ad8'], t: ['말뚝망둥어', 'Mudskipper'], line: ['가슴지느러미로 펄 위를 기고 폴짝 뛰어요 — 물 밖에서도 한동안 지내요', 'Crawls and hops on the mud with its fins — it can stay out of water for a while'] },
];
for (const b of SHORE) { b.icon = '🦀'; b.hint = b.sea.length === 4 ? ['썰물 때 갯벌에서 (언제나)', 'On the mudflat at low tide (all year)'] : ['썰물 때 갯벌에서 (봄~가을)', 'On the mudflat at low tide (spring to autumn)']; }
export const shoreAt = (sea, k) => { const L = SHORE.filter(b => b.sea.includes(sea)); return L.length ? L[(k >>> 0) % L.length] : null; };

// 물때(분 = 게임 시각 0~1440): 그날 첫 간조 = 날마다 50분씩 늦어짐(1일째 = 10:00 · 한 주기 745분을 넘으면 앞 썰물로 이어짐)
export const TIDE_P = 745, LOW_W = 94;
export const lowAt = d => 300 + ((d * 50 + 250) % TIDE_P);   /* FIX-CX6(코덱스 점검): % 540이면 열흘쯤마다 간조가 거꾸로 뛰어 '날마다 50분 늦어짐'과 어긋남 → 한 물때 주기(745분)로 돌면 c와 c−745가 같은 물때라 끊김 없음 · 그날 낮(05:00~17:25)에 썰물이 늘 하나 이상 */
export const tideLvl = (d, m) => (1 - Math.cos(2 * Math.PI * (m - lowAt(d)) / TIDE_P)) / 2;   // 0 = 가장 빠짐 · 1 = 가장 참
export const isLow = (d, m) => { const x = ((m - lowAt(d)) % TIDE_P + TIDE_P) % TIDE_P; return x <= LOW_W || x >= TIDE_P - LOW_W; };
export function lowsOf(d) { const c = lowAt(d), out = []; for (const k of [-1, 0, 1]) { const a = c + k * TIDE_P - LOW_W, b = c + k * TIDE_P + LOW_W; if (b > 360 && a < 1440) out.push([Math.max(360, a), Math.min(1440, b)]); } return out; }   // 그날(06~24시) 썰물 때
export const hm = m => { m = Math.round(m); const h = m > 1440 ? ((m / 60) | 0) % 24 : (m / 60) | 0, n = m % 60; return (h < 10 ? '0' : '') + h + ':' + (n < 10 ? '0' : '') + n; };

// 그림: 128×128(가운데 = 몸) · 위에서 본 모습(망둥어·고둥은 옆모습) · bg = 돋보기 창(동그란 펄 바탕)
export function drawShore(cv, b, bg) { const g = cv.getContext('2d'), W = cv.width, k = W / 128; g.clearRect(0, 0, W, W); g.save(); g.scale(k, k);
  if (bg) { const r = g.createRadialGradient(64, 64, 10, 64, 64, 64); r.addColorStop(0, '#d9c9a8'); r.addColorStop(1, '#a8916c'); g.fillStyle = r; g.beginPath(); g.arc(64, 64, 63, 0, 7); g.fill(); g.fillStyle = 'rgba(90,72,50,.35)'; for (const [x, y, s] of [[30, 34, 4], [96, 40, 3], [88, 98, 5], [34, 92, 3], [64, 20, 2.5]]) { g.beginPath(); g.ellipse(x, y, s, s * 0.7, 0, 0, 7); g.fill(); } }
  g.translate(64, 66); g.lineJoin = 'round'; g.lineCap = 'round'; const [c0, c1] = b.c, ell = (x, y, rx, ry, r, f, s, lw) => { g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, 7); if (f) { g.fillStyle = f; g.fill(); } if (s) { g.strokeStyle = s; g.lineWidth = lw || 2.5; g.stroke(); } };
  const legs = (col, sp) => { g.strokeStyle = col; g.lineWidth = 3; for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const y = -2 + i * 6; g.beginPath(); g.moveTo(sx * 18, y); g.lineTo(sx * (30 + sp), y - 4 + i * 2); g.lineTo(sx * (38 + sp), y + 6 + i * 3); g.stroke(); } };
  switch (b.draw) {
    case 'crab': { legs(c1, 0); g.strokeStyle = c1; g.lineWidth = 2.5; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 8, -14); g.lineTo(sx * 13, -34); g.stroke(); ell(sx * 13, -36, 3.5, 3.5, 0, '#1d1d1d'); }   /* 긴 눈자루 */
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 14, -10); g.quadraticCurveTo(sx * 26, -22, sx * 20, -28); g.stroke(); ell(sx * 20, -28, 6, 4.5, sx * 0.4, c0, c1, 2); } ell(0, 0, 28, 17, 0, c0, c1); g.strokeStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(-16, -4); g.quadraticCurveTo(0, 6, 16, -4); g.stroke(); break; }
    case 'fiddler': { legs('#3a2e24', -2); for (const sx of [-1, 1]) { g.strokeStyle = '#3a2e24'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(sx * 6, -12); g.lineTo(sx * 8, -22); g.stroke(); ell(sx * 8, -23, 3, 3, 0, '#1d1d1d'); }
      ell(-17, -16, 5, 3.5, 0.5, c0, '#3a2e24', 2); g.fillStyle = c1; g.strokeStyle = '#7a1e16'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(16, -8); g.quadraticCurveTo(44, -16, 50, -40); g.quadraticCurveTo(38, -44, 30, -30); g.quadraticCurveTo(26, -22, 14, -14); g.closePath(); g.fill(); g.stroke();   /* 수컷의 크고 빨간 집게발 */
      ell(0, 0, 22, 16, 0, c0, '#3a2e24'); ell(-6, -4, 6, 3, 0.2, 'rgba(255,255,255,.15)'); break; }
    case 'snail': { ell(0, 22, 34, 6, 0, 'rgba(60,45,30,.25)'); g.fillStyle = '#9a8a74'; g.beginPath(); g.moveTo(-34, 22); g.quadraticCurveTo(-30, 12, -14, 14); g.lineTo(26, 16); g.quadraticCurveTo(36, 18, 34, 24); g.closePath(); g.fill();
      g.strokeStyle = '#9a8a74'; g.lineWidth = 2; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(-28, 14); g.lineTo(-32 + sx * 4, 2); g.stroke(); }
      g.fillStyle = c0; g.strokeStyle = '#3e3328'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-18, 16); g.lineTo(30, 16); g.lineTo(8, -42); g.closePath(); g.fill(); g.stroke();   /* 원뿔 껍데기 + 나선 줄 */
      g.strokeStyle = c1; g.lineWidth = 2.5; for (const y of [6, -6, -18, -29]) { const w9 = (y + 46) / 62; g.beginPath(); g.moveTo(8 - 22 * w9, y + 4); g.quadraticCurveTo(8, y - 3, 8 + 20 * w9, y + 1); g.stroke(); } break; }
    case 'worm': { g.strokeStyle = c1; g.lineWidth = 15; g.beginPath(); g.moveTo(-48, 16); g.bezierCurveTo(-26, -26, -4, 34, 18, -4); g.quadraticCurveTo(32, -26, 46, -12); g.stroke(); g.strokeStyle = c0; g.lineWidth = 11; g.stroke();
      g.strokeStyle = 'rgba(120,40,30,.55)'; g.lineWidth = 1.6; for (let i = 0; i <= 12; i++) { const t = i / 12, x = -48 + t * 94, y = Math.sin(t * 7) * 14 - 2; g.beginPath(); g.moveTo(x - 2, y - 5); g.lineTo(x + 2, y + 5); g.stroke(); } ell(-48, 16, 6, 6, 0, '#5e2a20'); ell(0, 40, 9, 4, 0, 'rgba(60,45,30,.4)'); break; }   /* 마디 + 굴 구멍 */
    case 'skipper': { ell(0, 18, 40, 6, 0, 'rgba(60,45,30,.25)'); g.fillStyle = c0; g.strokeStyle = '#3e3328'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-36, 6); g.quadraticCurveTo(-30, -16, -6, -14); g.quadraticCurveTo(22, -10, 38, 0); g.lineTo(50, -8); g.lineTo(50, 14); g.lineTo(38, 8); g.quadraticCurveTo(10, 18, -30, 14); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#a89070'; g.beginPath(); g.moveTo(-10, 8); g.quadraticCurveTo(-20, 24, -2, 20); g.closePath(); g.fill(); g.beginPath(); g.moveTo(4, -12); g.quadraticCurveTo(12, -30, 24, -10); g.closePath(); g.fill();   /* 가슴지느러미 · 등지느러미 */
      g.fillStyle = c1; for (const [x, y] of [[0, -2], [12, 0], [24, 2], [-8, 2]]) { g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); } ell(-26, -14, 6, 6, 0, '#f4f0e6', '#3e3328', 2); ell(-24, -15, 3, 3, 0, '#1d1d1d'); break; }   /* 머리 위로 튀어나온 큰 눈 */
  }
  g.restore(); }

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · muds() → 갯벌 모양들 · sdOf · bboxOf · seaSd · gy(x, z) · rng(씨앗) · id · root() · TEX · enth · on() · inb() · lang() · sea() · panel() · openP · closeP · esc · skUp · bagShow · alive() · TY · SEA_H · seaMat
export function createShore(A) {
  const T3 = A.T3, SP = [], VIS = [], TXC = new Map(); let W = null, WG = null, CEN = [], lowS = null, told = -1, tdq = 0, quietT = 0;
  const S = () => A.GAME.S, low = () => isLow(S().day, S().min), lvl = () => tideLvl(S().day, S().min), en = () => A.lang() === 'en';
  const tex = b => { let t = TXC.get(b.id); if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 64; drawShore(c, b, false); t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; A.TEX.push(t); TXC.set(b.id, t); return t; };
  const nearMud = (x, z, r) => CEN.some(c => Math.hypot(c[0] - x, c[1] - z) < c[2] + r);
  function clear() { for (const s of SP) if (s.spr) { A.map.remove(s.spr); s.spr.material.dispose(); } SP.length = 0; VIS.length = 0; CEN = []; if (W) { if (W.parent) W.parent.remove(W); W = null; } if (WG) { WG.dispose(); WG = null; } lowS = null; }
  // 밀물 물낯: 갯벌 둘레 4m 칸(한 격자 — 갯벌 둘이 붙어도 겹치는 면 없음) · 높이 = 정점 y(0~1 · 바다 쪽 가장자리 = 0 → 바닷물 밑) × scale.y(물 높이) · 땅이 높은 뭍 쪽은 땅 밑으로 숨음
  function water() { const P = [], C = [], U = [], N = [], seen = new Set(), st = 4, c0 = [0.5, 0.82, 0.82], c1 = [0.42, 0.74, 0.78];
    const wv = (x, z) => Math.max(0, Math.min(1, A.seaSd(x, z) / 5)), put = (x, z) => { P.push(x, wv(x, z), z); N.push(0, 1, 0); U.push(x / 14, z / 14); const t = (Math.sin(x * 0.07) + Math.cos(z * 0.09) + 2) / 4; C.push(c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t); };
    for (const sh of A.muds()) { const [x0, z0, x1, z1] = A.bboxOf(sh); for (let z = Math.floor((z0 - 8) / st) * st; z < z1 + 8; z += st) for (let x = Math.floor((x0 - 8) / st) * st; x < x1 + 8; x += st) { const k = x + ':' + z; if (seen.has(k) || A.sdOf(sh, x + st / 2, z + st / 2) > 5) continue; seen.add(k); put(x, z); put(x, z + st); put(x + st, z + st); put(x, z); put(x + st, z + st); put(x + st, z); } }
    if (!P.length) return; WG = new T3.BufferGeometry(); WG.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); WG.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); WG.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); WG.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); WG.computeBoundingSphere();
    W = new T3.Mesh(WG, A.seaMat); W.position.y = A.TY + A.SEA_H - 0.04; W.scale.y = 0.01; W.visible = false; W.userData.fx = 1; W.frustumCulled = true; A.root().add(W); }
  // 짓기 때: 갯벌마다 안쪽(가장자리 5m 안 · 바닷물 2m 밖) 자리 셋까지(20m 넘게 떨어짐 · 모두 여섯까지) + 밀물 물낯
  function init() { clear(); if (!A.on()) return; const M = A.muds(); if (!M.length) return; const rnd = A.rng('shore:' + A.id);
    for (const sh of M) { const [x0, z0, x1, z1] = A.bboxOf(sh); CEN.push([(x0 + x1) / 2, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) / 2]); const C9 = [];
      for (let z = z0 + 3; z < z1; z += 6) for (let x = x0 + 3; x < x1; x += 6) { const px = x + (rnd() - 0.5) * 4, pz = z + (rnd() - 0.5) * 4; if (A.sdOf(sh, px, pz) < -5 && A.seaSd(px, pz) > 2) C9.push([px, pz, rnd()]); }
      C9.sort((a, b) => a[2] - b[2]); let n = 0; for (const [x, z] of C9) { if (n >= 3 || SP.length >= 6) break; if (SP.some(s => Math.hypot(s.x - x, s.z - z) < 20)) continue; SP.push({ x, z, y: A.gy(x, z), k: SP.length }); n++; } }
    for (const s of SP) { const h = A.map.interact.add({ kind: 'game', x: s.x, z: s.z, y: s.y, r: 2.4, label: '🔍', use: () => look(s) }); h.hot.off = true; s.h = h; A.enth.push(h); }
    water(); sec(true); }
  // 1초마다: 물때(물낯 높이·숨김 · 바뀌면 가까이 있을 때 알림) · 바다 친구(썰물 + 계절 · 60m 안만 그림 · 12m 안 처음 = 알림 한 번)
  function sec(quiet) { if (!CEN.length) return; const me = A.map.player.pos(), lo = low(), L9 = lvl(), e = en(), in9 = A.inb(), near = !in9 && nearMud(me.x, me.z, 180);
    if (W) { const v = !in9 && L9 > 0.1 && nearMud(me.x, me.z, 420); if (W.visible !== v) W.visible = v; if (v) W.scale.y = Math.max(0.01, 0.5 * L9); }
    if (lowS !== null && lo !== lowS && !quiet && near) { quietT = performance.now() + 4000; const nx = nextLow();   /* 물때 알림 뒤 4초는 다른 알림 미룸 */ A.map.hud.toast(lo ? (e ? '🏖 The tide went out — the mudflat is open! (low tide ' + nx + ')' : '🏖 물이 빠졌어요 — 갯벌이 드러났어요! (썰물 ' + nx + ')') : (e ? '🌊 The tide is coming in! Leave the mudflat — next low tide ' + nx : '🌊 물이 들어왔어요! 갯벌에서 나와요 — 다음 썰물 ' + nx), 3.6); A.map.sfx && A.map.sfx(lo ? 'ding' : 'buzz'); }
    lowS = lo; VIS.length = 0; const sea = A.sea();
    for (const s of SP) { const b = lo ? shoreAt(sea, s.k) : null, d = Math.hypot(s.x - me.x, s.z - me.z); s.b = b;
      if (s.h) { const off = !b || in9; if (s.h.hot.off !== off) s.h.hot.off = off; if (b) { const lb = '🔍 ' + b.t[e ? 1 : 0] + (e ? ' — look closely' : ' 관찰하기'); if (s.h.hot.label !== lb) s.h.hot.label = lb; } }
      if (b && d < 60 && !in9 && A.on()) { if (!s.spr || s.sid !== b.id) { if (s.spr) { A.map.remove(s.spr); s.spr.material.dispose(); } s.spr = new T3.Sprite(new T3.SpriteMaterial({ map: tex(b), transparent: true, depthWrite: false })); s.sid = b.id; s.sc = b.draw === 'worm' ? 0.42 : 0.38; s.spr.scale.set(s.sc, s.sc, 1); s.y0 = s.y + 0.16; s.t = s.k * 1.3; s.spr.position.set(s.x, s.y0, s.z); s.spr.userData.fx = 1; A.map.add(s.spr); }
        s.spr.visible = true; VIS.push(s); if (d < 12 && performance.now() > quietT && !(S().dex || {})['shore:' + b.id] && told !== S().day) { told = S().day; A.map.hud.toast(e ? '🦀 Something is moving on the mudflat — get close and press E' : '🦀 갯벌에서 뭔가 움직여요 — 가까이 가서 E', 2.6); } }
      else if (s.spr) s.spr.visible = false; } }
  // 매 프레임: 보이는 것만(보통 0~2) · 새 객체 X — 게는 옆으로 종종 · 망둥어는 폴짝 · 고둥은 느릿느릿 · 갯지렁이는 꿈틀
  function tick(dt) { if ((tdq += dt) >= 1) { tdq = 0; sec(false); }
    for (const s of VIS) { const b = s.b, sp = s.spr; if (!b || !sp) continue; const t = (s.t += dt), dr = b.draw;
      if (dr === 'crab' || dr === 'fiddler') { const p = Math.sin(t * 0.9); sp.position.x = s.x + p * 0.7 + (Math.abs(Math.sin(t * 9)) * 0.03); }
      else if (dr === 'skipper') sp.position.y = s.y0 + Math.pow(Math.max(0, Math.sin(t * 1.6)), 6) * 0.35;
      else if (dr === 'snail') sp.position.x = s.x + Math.sin(t * 0.12) * 0.4;
      else if (dr === 'worm') sp.scale.x = s.sc * (0.85 + 0.15 * Math.sin(t * 3)); } }
  function look(s) { const b = s.b; if (!b || A.panel()) return; const e = en(), neu = A.GAME.found('shore:' + b.id); A.skUp('look', neu ? 3 : 1);
    const P9 = A.openP('<h3>🔍 ' + A.esc(b.t[e ? 1 : 0]) + '</h3>' + (/crab|fiddler/.test(b.draw) ? photoHtml('suncheon', e) : '') + '<div class="st"><canvas class="twn-shore" width="200" height="200" style="flex:none;width:150px;height:150px"></canvas><div>' + A.esc(b.line[e ? 1 : 0]) + '<div class="sm">' + A.esc(b.hint[e ? 1 : 0]) + (e ? ' · we only look, then let it be' : ' · 잡지 않고 보기만 해요') + '</div>' + (neu ? '<div class="sm"><b>📖 ' + (e ? 'New in your codex!' : '도감에 새로 적었어요!') + '</b></div>' : '') + '</div></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'shore');
    drawShore(P9.querySelector('.twn-shore'), b, true); P9.onclick = ev => { const bt = ev.target.closest('button'); if (bt && bt.dataset.a === 'x') A.closeP(); }; A.map.sfx && A.map.sfx(neu ? 'ding' : 'tick'); if (neu) A.bagShow(); }
  // 다음 썰물(지금 썰물이면 끝나는 시각) — 칩·알림·조개 캐기 안내가 같이 씀
  function nextLow() { const d = S().day, m = S().min, e = en(); for (const [a, b] of lowsOf(d)) { if (m >= a && m < b) return '~' + hm(b); if (a > m) return hm(a); } return e ? 'tomorrow ' + hm(Math.max(360, lowAt(d + 1) - LOW_W)) : '내일 ' + hm(Math.max(360, lowAt(d + 1) - LOW_W)); }
  // 물때 칩 글(갯벌 가까이 · 바깥일 때만 — 아니면 null = 숨김)
  function chip() { if (!CEN.length || A.inb() || !A.on()) return null; const me = A.map.player.pos(); if (!nearMud(me.x, me.z, 220)) return null; const e = en(), lo = low();
    return lo ? (e ? '🏖 Low tide ' + nextLow() : '🏖 썰물 ' + nextLow()) : (e ? '🌊 High tide · low ' + nextLow() : '🌊 밀물 · 썰물 ' + nextLow()); }
  function openTide() { const e = en(), d = S().day, m = S().min, lo = low(), L9 = lowsOf(d);
    const row = (ic, t, s9) => '<div class="st"><b class="n">' + ic + '</b><span><b>' + t + '</b>' + (s9 ? '<div class="sm">' + s9 + '</div>' : '') + '</span></div>';
    A.openP('<h3>🌊 ' + (e ? 'Tides' : '물때') + '</h3><div class="sm">' + (e ? 'The sea comes in (high tide) and goes out (low tide) about twice a day — about 50 minutes later each day. The moon’s pull makes the tides.' : '바닷물은 하루에 두 번쯤 들어오고(밀물) 두 번쯤 빠져요(썰물) — 날마다 50분쯤 늦어져요. 달이 바닷물을 끌어당겨서 생겨요.') + '</div>'
      + row(lo ? '🏖' : '🌊', lo ? (e ? 'Now: low tide — the mudflat is open' : '지금: 썰물 — 갯벌이 드러났어요') : (e ? 'Now: high tide — the mudflat is under water' : '지금: 밀물 — 갯벌이 물에 잠겼어요'), (e ? 'Day ' + d + ' ' : d + '일째 ') + hm(m))
      + '<div class="grp">' + (e ? 'Low tide today' : '오늘 썰물') + '</div>' + (L9.length ? L9.map(([a, b]) => row(m >= a && m < b ? '👉' : m >= b ? '✔' : '🕐', hm(a) + ' ~ ' + hm(b), '')).join('') : row('🌙', e ? 'No low tide in daytime today' : '오늘 낮엔 썰물이 없어요', ''))
      + row('⚠️', e ? 'Go out only at low tide, and come back before the sea returns' : '갯벌에는 썰물 때만 · 밀물이 들어오기 전에 꼭 나와요', '')
      + '<div class="row"><button class="sub" data-a="wx">☀️ ' + (e ? 'Weather' : '날씨') + '</button><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'tide').onclick = ev => { const bt = ev.target.closest('button'); if (!bt) return; if (bt.dataset.a === 'x') A.closeP(); else if (bt.dataset.a === 'wx') A.wx(); }; }
  function dispose() { clear(); for (const [, t] of TXC) t.dispose(); TXC.clear(); }
  return { init, tick, dispose, low: () => !CEN.length || low(), nextLow, chip, openTide, get on() { return CEN.length > 0; }, list: () => SHORE, spots: () => SP.map(s => ({ x: +s.x.toFixed(1), z: +s.z.toFixed(1), b: s.b ? s.b.id : null, on: !!(s.h && !s.h.hot.off) })), get water() { return W ? { vis: W.visible, h: +W.scale.y.toFixed(3) } : null; } };
}
