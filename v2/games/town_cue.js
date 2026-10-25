// 👀 멀리서 보이는 단서(CUE-1 · 사용자 10-25 '수많은 콘텐츠를 만드는데 애들이 다 즐기질 못할 것 같아 · 자연스럽게 다가올 수 있게')
//   마을을 걷다 보면 눈과 귀에 먼저 걸리는 것 → '저기 뭐지?' 하고 가 보게 함 · 물음표·느낌표·화살표 아이콘 X · 현실에 있을 법한 빛·움직임·소리만
//   ① 영화관: 문 위 간판(다음 상영 시각) + 둘레 전구 · 저녁·밤엔 불이 켜지고 전구가 차례로 깜빡임 · 상영 25분 전부터 문 곁에 줄 선 이웃 둘셋(시작하면 들어감)
//   ② 공장: 일하는 때(09~18시 · 낮)에만 굴뚝 김이 피어오름(바람 쪽으로 기욺)
//   ③ 스키장(겨울): 리프트를 타고 오르는 이웃 하나(의자 돌리기 = town.js 260m 안 · 슬로프 스키어 = town.js 160m 안 그대로)
//   ④ 썰물섬: 썰물 때 바닷길 위를 걷는 이웃 하나(바구니 · 섬에서 조개 줍는 몸짓 → 돌아옴)
//   ⑤ 까망봉·층층골: 판 끝 길 들머리에 이정표(나무 판 · 판 자료 이름 + 거리) + 산악회 리본 셋이 바람에 흔들림 · 층층골 폭포 소리(50m 안 · 작게)
//   ⑥ 할 일이 있는 건물(경찰서·병원·보호센터·은행·우체국·영화관·공장·노인정·박물관): 문 연 때만 문 옆 입간판(그림 + 할 일 + 여는 시간) · 문으로 들고 나는 이웃 하나
//   또렷함: 그 콘텐츠를 한 번도 안 해 봤으면 다 보임 · 한 번 해 보면 기본만(간판·김·의자 = 그대로 · 줄은 둘 · 전구는 깜빡이지 않음 · 리본·드나드는 이웃·리프트 탄 이웃·바닷길 이웃 = 없음)
//     했는지 = 각 모듈 저장 값을 읽기만(GAME.S.bldg[갈래] · GAME.S.xp.fos/st/sc/il/cairn · GAME.S.xp.ski) — 이 파일은 저장하지 않음
//   렉: 매 프레임 = 보이는 것만(몸 넷까지 자리 · 김 덩이 · 전구 무늬 밀기 · 리본 흔들기) · 새 객체 X(스크래치) · 1초 칸에서 거리 컷·누가 보일지 고름 · 새 Light X(빛 = MeshBasicMaterial)
//     그리기: 몸 1(인스턴스 하나 · town_worker.js) · 김 1(인스턴스 하나) · 간판 2(영화관만) · 입간판·이정표·리본 = 보일 때만 하나씩(100~130m 컷)
//   지킴: 이웃 = 이름 없는 몸 · 판타지 X · 실제 상표 X · 소리는 배경(작게 · 가까이서만)
import { makeWorkerMesh } from './town_worker.js?v=6';
import { BD_HRS, POST_HRS, bldgKind } from './town_bldg.js?v=6';

export const CUE_V = 1;
const T2 = (a, b) => [a, b];
const SHOW0 = [600, 690, 780, 870, 960, 1050, 1140];   /* town_bldg.js SHOWS 시작 분과 같게(그 표를 바꾸면 여기도) */
const FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const NB = 4;   /* 몸 칸(town_routine 걷는 몸 상한과 같은 넷) */
const R_BODY = 140, R_BOARD = 100, R_SIGN = 130, R_CINE = 170, R_FAC = 280, R_SKI = 260, R_ISLE = 230, R_FALL = 50;
// 했는지(읽기만)
const DONE = {
  police: s => !!s.d112, clinic: s => !!s.dfa, shelter: s => (s.n | 0) > 0, bank: s => (s.n | 0) > 0, post: s => (s.n | 0) > 0,
  cinema: s => !!s.seen, factory: s => (s.made | 0) > 0, elder: s => !!s.heard, museum: s => Object.keys(s.got || {}).length > 0 };
const BTXT = {   /* 입간판 글(할 일 · 짧게) */
  police: T2('112 신고 연습', '112 call practice'), clinic: T2('응급 처치 배우기', 'Learn first aid'), shelter: T2('동물 밥 주기', 'Feed the animals'),
  bank: T2('저금하기', 'Save money'), post: T2('소포 보내기', 'Send a parcel'), cinema: T2('오늘 상영 시간표', 'Today’s films'),
  factory: T2('만드는 차례 견학', 'Factory tour'), elder: T2('옛 땅이름 이야기', 'Old place names'), museum: T2('옛 물건 알아보기', 'Old things') };

export function createCue(A) {
  const { T3, map } = A, en = () => A.lang() === 'en', L = t => t[en() ? 1 : 0];
  const _O = new T3.Object3D(), _c = new T3.Color();
  let dead = false, OFF = false, key = '', CU = [], SKI0 = null, secQ = 0.37, qq = 0, T = 0, tickMs = 0, tickMax = 0, built = false;
  const MESH = [], GEO = [], MATS = [], TEX = [];
  const S = () => A.GAME.S, gy = (x, z) => A.gy(x, z, A.ty(x, z) + 3);
  const bdS = k => { const b = S().bldg; return (b && b[k]) || {}; };
  const xpS = () => S().xp || {};
  const hrsOf = k => k === 'post' ? POST_HRS : BD_HRS[k];
  const openK = k => { const H = hrsOf(k); return !H || A.open(H[0], H[1]); };
  const cam = () => map.camera.position;
  const keep = m => { m.userData.fx = 1; m.matrixAutoUpdate = false; m.visible = false; map.add(m); MESH.push(m); return m; };

  // ───────── 몸(인스턴스 하나 · 일꾼 몸과 같은 그림체) ─────────
  const BL = []; for (let i = 0; i < NB; i++) BL.push({ x: 0, z: 0, g: -500, ry: 0, role: 'guest', ph: i * 1.7 });
  const BODY = makeWorkerMesh(T3, BL, { guest: { sh: [0xd9694a, 0x4f7fc0, 0x6aa35a, 0xc9a040], pa: 0x3b4a5c, hat: null } });
  BODY.m.visible = false; map.add(BODY.m); MESH.push(BODY.m);
  const SLOT = []; for (let i = 0; i < NB; i++) { SLOT.push({ c: null, j: 0, on: false, act: -1, tool: -1 }); BODY.vis(i, false); }
  const bAct = (i, a, t) => { const s = SLOT[i]; if (s.act === a && s.tool === t) return; s.act = a; s.tool = t; BODY.act(i, a, t); };

  // ───────── 김(인스턴스 하나 · 덩이) ─────────
  const NP = 14, NPF = 3;
  const STG = new T3.IcosahedronGeometry(1, 1), STM = new T3.MeshLambertMaterial({ color: 0xf2f2ee, transparent: true, opacity: 0.72, depthWrite: false, flatShading: true });
  GEO.push(STG); MATS.push(STM);
  const STEAM = new T3.InstancedMesh(STG, STM, NP * NPF); STEAM.instanceMatrix.setUsage(T3.DynamicDrawUsage); STEAM.frustumCulled = false; STEAM.count = 0; STEAM.renderOrder = 3; keep(STEAM);

  // ───────── 캔버스 도우미 ─────────
  const canv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2; TEX.push(tx); return { c, g: c.getContext('2d'), tx }; };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const fitT = (g, t, w, px, wt) => { let s = px; g.font = wt + ' ' + s + 'px ' + FONT; while (g.measureText(t).width > w && s > 14) { s -= 2; g.font = wt + ' ' + s + 'px ' + FONT; } };
  // 입간판 그림(아이콘 글자 X · 선과 면으로 그린 작은 그림)
  function pic(g, k, cx, cy) { g.lineWidth = 6; g.lineJoin = 'round'; g.strokeStyle = '#2b2420';
    const F = (c) => { g.fillStyle = c; g.fill(); g.stroke(); };
    if (k === 'bank') { for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(cx - 20, cy + 34 - i * 18, 42, 13, 0, 0, 6.2832); F('#f2c230'); } rr(g, cx + 14, cy - 34, 58, 74, 6); F('#4f7fc0'); g.fillStyle = '#fff'; g.fillRect(cx + 24, cy - 18, 38, 6); g.fillRect(cx + 24, cy - 4, 38, 6); }
    else if (k === 'post') { g.beginPath(); g.rect(cx - 56, cy - 34, 112, 78); F('#c8945a'); g.beginPath(); g.moveTo(cx, cy - 34); g.lineTo(cx, cy + 44); g.moveTo(cx - 56, cy + 4); g.lineTo(cx + 56, cy + 4); g.stroke(); g.fillStyle = '#fbf7ec'; g.fillRect(cx + 14, cy + 14, 32, 20); g.strokeRect(cx + 14, cy + 14, 32, 20); }
    else if (k === 'cinema') { g.beginPath(); g.rect(cx - 66, cy - 36, 132, 76); F('#3a3530'); g.fillStyle = '#fbf7ec'; for (let i = 0; i < 6; i++) { g.fillRect(cx - 58 + i * 22, cy - 30, 10, 9); g.fillRect(cx - 58 + i * 22, cy + 25, 10, 9); } g.fillStyle = '#7fb8d0'; g.fillRect(cx - 50, cy - 14, 44, 32); g.fillStyle = '#f2c230'; g.fillRect(cx + 6, cy - 14, 44, 32); }
    else if (k === 'factory') { g.beginPath(); g.rect(cx - 52, cy - 30, 104, 74); F('#c8945a'); g.fillStyle = '#e8d38a'; g.fillRect(cx - 52, cy - 4, 104, 16); g.strokeRect(cx - 52, cy - 4, 104, 16); g.beginPath(); g.moveTo(cx - 52, cy - 30); g.lineTo(cx - 34, cy - 50); g.lineTo(cx + 70, cy - 50); g.lineTo(cx + 52, cy - 30); F('#d9b07a'); }
    else if (k === 'elder') { g.beginPath(); g.moveTo(cx - 44, cy - 14); g.lineTo(cx + 30, cy - 14); g.lineTo(cx + 22, cy + 40); g.lineTo(cx - 36, cy + 40); g.closePath(); F('#e8f0e0'); g.beginPath(); g.arc(cx + 40, cy + 10, 14, -1.4, 1.4); g.stroke(); g.lineWidth = 5; for (const dx of [-24, -6, 12]) { g.beginPath(); g.moveTo(cx + dx, cy - 24); g.quadraticCurveTo(cx + dx + 10, cy - 38, cx + dx, cy - 52); g.stroke(); } }
    else if (k === 'museum') { g.beginPath(); g.moveTo(cx - 18, cy - 50); g.lineTo(cx + 18, cy - 50); g.quadraticCurveTo(cx + 22, cy - 34, cx + 44, cy - 10); g.quadraticCurveTo(cx + 54, cy + 30, cx + 22, cy + 46); g.lineTo(cx - 22, cy + 46); g.quadraticCurveTo(cx - 54, cy + 30, cx - 44, cy - 10); g.quadraticCurveTo(cx - 22, cy - 34, cx - 18, cy - 50); F('#c26a3a'); g.beginPath(); g.moveTo(cx - 40, cy + 4); g.lineTo(cx + 40, cy + 4); g.stroke(); }
    else if (k === 'police') { g.beginPath(); g.moveTo(cx, cy - 52); g.lineTo(cx + 46, cy - 34); g.quadraticCurveTo(cx + 44, cy + 26, cx, cy + 50); g.quadraticCurveTo(cx - 44, cy + 26, cx - 46, cy - 34); g.closePath(); F('#2f5f9a'); g.fillStyle = '#fbf7ec'; g.font = '900 34px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('112', cx, cy); }
    else if (k === 'clinic') { g.save(); g.translate(cx, cy); g.rotate(-0.5); rr(g, -66, -20, 132, 40, 18); F('#f2d0a8'); g.fillStyle = '#e8b888'; g.fillRect(-22, -20, 44, 40); g.strokeRect(-22, -20, 44, 40); g.restore(); }
    else { g.beginPath(); g.moveTo(cx - 56, cy - 2); g.lineTo(cx + 56, cy - 2); g.lineTo(cx + 40, cy + 40); g.lineTo(cx - 40, cy + 40); g.closePath(); F('#d9694a'); g.fillStyle = '#8a5a3a'; for (const [x, y] of [[-24, -12], [0, -18], [24, -12], [-10, -26], [12, -28]]) { g.beginPath(); g.arc(cx + x, cy + y, 9, 0, 6.2832); g.fill(); } } }
  const hhmm = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const BTX = {};   /* 입간판 재질(갈래 + 말) */
  function boardMat(k) { const id = k + ':' + (en() ? 'en' : 'ko'); if (BTX[id]) return BTX[id];
    const { c, g, tx } = canv(256, 352), W = c.width, H = c.height; g.fillStyle = '#6b4a2f'; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; rr(g, 12, 12, W - 24, H - 24, 14); g.fill();
    pic(g, k, W / 2, 104); g.fillStyle = '#2b2420'; g.textAlign = 'center'; g.textBaseline = 'middle'; fitT(g, L(BTXT[k]), W - 44, 38, '900'); g.fillText(L(BTXT[k]), W / 2, 218);
    const H9 = hrsOf(k); g.fillStyle = '#b5483a'; fitT(g, H9 ? hhmm(H9[0] * 60) + '~' + hhmm(H9[1] * 60) : (en() ? 'Open 24 h' : '24시간'), W - 50, 30, '800'); g.fillText(H9 ? hhmm(H9[0] * 60) + '~' + hhmm(H9[1] * 60) : (en() ? 'Open 24 h' : '24시간'), W / 2, 282);
    tx.needsUpdate = true; const m = new T3.MeshLambertMaterial({ map: tx }); MATS.push(m); BTX[id] = m; return m; }
  // 입간판 모양(A자 두 판 · 앞뒤 같은 그림)
  const AGEO = (() => { const w = 0.66, h = 0.92, lean = 0.2, P = [], U = [], I = []; let n = 0;
    for (const sg of [1, -1]) { const zb = sg * 0.26, zt = sg * 0.03, V = [[-w / 2, 0, zb], [w / 2, 0, zb], [w / 2, h, zt], [-w / 2, h, zt]], UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const ord = sg > 0 ? [0, 1, 2, 3] : [1, 0, 3, 2]; for (const q of ord) { P.push(...V[q]); U.push(...UV[sg > 0 ? q : [1, 0, 3, 2][q]]); } I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; }
    void lean; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); GEO.push(g); return g; })();

  // ───────── 영화관 간판(글 판 + 전구 판) ─────────
  let RIBM = null, fq = 0;
  // 간판 하나(캔버스 512×160 · 둘레 전구 + 가운데 글) — 깜빡일 때만 1초에 다섯 번 다시 그림(그리기 1)
  function cineBoard(cu) { const { c, g, tx } = canv(512, 160); const m = new T3.MeshBasicMaterial({ map: tx }); MATS.push(m); const pg = new T3.PlaneGeometry(4.0, 1.25); GEO.push(pg); const me = keep(new T3.Mesh(pg, m));
    me.position.set(cu.mx + cu.ux * 0.12, cu.my, cu.mz + cu.uz * 0.12); me.rotation.set(0, cu.ry, 0); me.updateMatrix(); cu.board = { me, c, g, tx, txt: '', key: '' }; }
  const BLB = []; for (let x = 18; x <= 494; x += 28) { BLB.push([x, 16]); BLB.push([x, 144]); } for (let y = 44; y <= 116; y += 28) { BLB.push([18, y]); BLB.push([494, y]); }
  function cineDraw(cu, step) { const B9 = cu.board, now = S().min | 0, e = en(); let nx = -1; for (const s of SHOW0) if (s > now) { nx = s; break; }
    const t = nx >= 0 ? (e ? 'Next film ' : '다음 상영 ') + hhmm(nx) : (e ? 'Films again tomorrow 10:00' : '내일 10:00부터 상영'), k9 = t + '|' + (cu.lit ? 1 : 0) + (cu.chase ? step % 3 : 'x'); if (k9 === B9.key) return; B9.key = k9; B9.txt = t;
    const { g, c, tx } = B9, W = c.width, H = c.height; g.fillStyle = '#5a1e1a'; g.fillRect(0, 0, W, H); g.fillStyle = '#2b1a18'; g.fillRect(36, 34, W - 72, H - 68);
    BLB.forEach(([x, y], i) => { g.beginPath(); g.arc(x, y, 8, 0, 6.2832); g.fillStyle = !cu.lit ? '#9a8a78' : cu.chase ? ((i >> 1) + step) % 3 === 0 ? '#fff4b0' : '#c88a3a' : '#ffe9a0'; g.fill(); });
    g.fillStyle = cu.lit ? '#fff4d0' : '#d8cbb8'; g.textAlign = 'center'; g.textBaseline = 'middle'; fitT(g, t, W - 110, 54, '900'); g.fillText(t, W / 2, H / 2 + 2); tx.needsUpdate = true; }
  // ───────── 이정표(기둥 + 화살 꼴 판 · 캔버스 하나) + 산악회 리본 ─────────
  function trailSign(cu) { const { c, g, tx } = canv(512, 160), W = 512, ts = cu.tip, bw = 2.1, bh = 0.52, tip = 0.38, yb = 1.95, ut = tip / bw;   /* ts = 뾰족한 끝 쪽(로컬 +x = 1 · −x = −1) */
    g.fillStyle = '#7a5434'; g.fillRect(0, 0, W, 160); g.fillStyle = '#6b4a2f'; g.fillRect(0, 128, W, 32);   /* 아래 띠 = 기둥·뒷면 빛깔 */
    const tc = ts > 0 ? W * (1 - ut) / 2 : W * (1 + ut) / 2; g.fillStyle = '#fbf2d8'; g.textAlign = 'center'; g.textBaseline = 'middle'; fitT(g, cu.label, W * (1 - ut) - 40, 64, '900'); g.fillText(cu.label, tc, 64); tx.needsUpdate = true;
    const m = new T3.MeshLambertMaterial({ map: tx }); MATS.push(m);
    const P = [], U = [], I = []; let n = 0; const vB = 128 / 160, BR = [[0, 0], [1, 0], [1, 0.1], [0, 0.1]];
    const poly = (V, front) => { const n0 = n; for (const v of V) { P.push(v[0], v[1], v[2]); U.push(front ? (v[0] + bw / 2) / bw : 0.5, front ? vB + (1 - vB) * (v[1] - yb) / bh : 0.05); n++; } for (let q = 1; q < V.length - 1; q++) { if (front) I.push(n0, n0 + q, n0 + q + 1); else I.push(n0, n0 + q + 1, n0 + q); } };
    const quad = (V, UV) => { for (let q = 0; q < 4; q++) { P.push(...V[q]); U.push(...UV[q]); } I.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; };
    // 판(앞 = +z · 글) — 다섯 모 꼴: 끝 쪽이 뾰족
    for (const [z, fr] of [[0.03, 1], [-0.03, 0]]) { const xa = -ts * bw / 2, xb = ts * (bw / 2 - tip), xt = ts * bw / 2, V = [[xa, yb, z], [xb, yb, z], [xt, yb + bh / 2, z], [xb, yb + bh, z], [xa, yb + bh, z]]; if (ts < 0) V.reverse(); poly(V, fr); }
    // 기둥(판 뒤 · 끝 반대쪽)
    const px = -ts * (bw / 2 - 0.26), s9 = 0.075, h = 2.65; for (const [ax, az, bx, bz] of [[-s9, s9, s9, s9], [s9, s9, s9, -s9], [s9, -s9, -s9, -s9], [-s9, -s9, -s9, s9]]) quad([[px + ax, 0, az - 0.1], [px + bx, 0, bz - 0.1], [px + bx, h, bz - 0.1], [px + ax, h, az - 0.1]], BR); quad([[px - s9, h, s9 - 0.1], [px + s9, h, s9 - 0.1], [px + s9, h, -s9 - 0.1], [px - s9, h, -s9 - 0.1]], BR);
    const g9 = new T3.BufferGeometry(); g9.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g9.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); g9.setIndex(I); g9.computeVertexNormals(); GEO.push(g9);
    const ms = keep(new T3.Mesh(g9, m)); ms.position.set(cu.x, cu.y, cu.z); ms.rotation.set(0, cu.ry, 0); ms.updateMatrix(); cu.sign = ms;
    // 리본 셋(기둥 1.8m에 묶음 · 빨강·노랑·파랑)
    const RP = [], RC = [], RI = []; let rn = 0; [[0xd33a2c, -0.07, 0.62], [0xf2c230, 0, 0.5], [0x2f6fd0, 0.07, 0.56]].forEach(([hex, dx, len]) => { _c.setHex(hex); const w = 0.08; for (const [x, y] of [[dx - w / 2, 0], [dx + w / 2, 0], [dx + w / 2 + 0.03, -len], [dx - w / 2 + 0.03, -len]]) { RP.push(x, y, 0); RC.push(_c.r, _c.g, _c.b); } RI.push(rn, rn + 1, rn + 2, rn, rn + 2, rn + 3); rn += 4; });
    const rg = new T3.BufferGeometry(); rg.setAttribute('position', new T3.Float32BufferAttribute(RP, 3)); rg.setAttribute('color', new T3.Float32BufferAttribute(RC, 3)); rg.setIndex(RI); rg.computeVertexNormals(); GEO.push(rg);
    if (!RIBM) { RIBM = new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide }); MATS.push(RIBM); }
    const ry = cu.ry, lx = px, lz = -0.1 + 0.075; cu.rib = keep(new T3.Mesh(rg, RIBM)); cu.ribAt = [cu.x + Math.cos(ry) * lx + Math.sin(ry) * lz, cu.y + 1.8, cu.z - Math.sin(ry) * lx + Math.cos(ry) * lz]; }

  // ───────── 자리 잡기(짓기가 바뀔 때마다) ─────────
  function fp(B9, x, z) { const dx = x - B9.cx, dz = z - B9.cz; return Math.abs(dx * B9.c - dz * B9.s) < B9.w / 2 && Math.abs(dx * B9.s + dz * B9.c) < B9.d / 2; }
  const free = (x, z, y) => !A.blocked(x, z, y + 0.5) && !A.onRoad(x, z, 0.7) && !A.wAt(x, z);
  function clear() { for (const cu of CU) for (const k of ['sign', 'rib']) if (cu[k]) { const m = cu[k]; if (m.parent) m.parent.remove(m); const i = MESH.indexOf(m); if (i >= 0) MESH.splice(i, 1); if (k === 'sign') { m.geometry.dispose(); if (m.material.map) m.material.map.dispose(); m.material.dispose(); } else m.geometry.dispose(); }
    for (const cu of CU) if (cu.board) { const m = cu.board.me; if (m.parent) m.parent.remove(m); const i = MESH.indexOf(m); if (i >= 0) MESH.splice(i, 1); m.geometry.dispose(); m.material.map.dispose(); m.material.dispose(); }
    for (const cu of CU) if (cu.ab) { if (cu.ab.parent) cu.ab.parent.remove(cu.ab); const i = MESH.indexOf(cu.ab); if (i >= 0) MESH.splice(i, 1); }
    CU = []; for (let i = 0; i < NB; i++) { SLOT[i].c = null; BODY.vis(i, false); } }
  function scan() { clear(); built = true; const DOORS = A.doors() || [], seen = new Set();
    for (const d of DOORS) { const B9 = d.B9, nm = (B9 && B9.name) || ''; if (!nm) continue; const k = /우체국/.test(nm) ? 'post' : bldgKind(nm); if (!k || !DONE[k] || seen.has(B9)) continue; seen.add(B9);
      const ux = d.ux, uz = d.uz, sx = uz, sz = -ux, y = d.y, ry = Math.atan2(ux, uz);
      const cu = { k: 'door', bk: k, id: k + '@' + Math.round(d.x) + ',' + Math.round(d.z), name: nm, x: d.x, z: d.z, y, ux, uz, sx, sz, ry, st: 0, t: Math.random() * 6, B9 };
      // 입간판: 문 옆(양쪽 · 1.3~2.4m)에서 빈 곳
      let ab = null; for (const dd of [1.6, 2.1, 2.6]) { for (const sg of [1, -1]) { const ax = d.x + sx * sg * dd + ux * 0.4, az = d.z + sz * sg * dd + uz * 0.4; if (free(ax, az, gy(ax, az))) { ab = [ax, az, sg]; break; } } if (ab) break; }
      const putAB = () => { if (!ab) return; const m = keep(new T3.Mesh(AGEO, boardMat(k))); m.position.set(ab[0], gy(ab[0], ab[1]) + 0.01, ab[1]); m.rotation.set(0, ry, 0); m.updateMatrix(); cu.ab = m; };   /* 영화관 = 문 위 간판이 대신(그리기 줄임) */
      // 드나드는 이웃 길: 문 → 앞 4m → 길 따라 11m(입간판 반대쪽)
      const sg = ab ? -ab[2] : 1, D = [d.x - ux * 0.2, d.z - uz * 0.2], M = [d.x + ux * 4.2, d.z + uz * 4.2]; let F = [M[0] + sx * sg * 11, M[1] + sz * sg * 11]; if (!free(F[0], F[1], gy(F[0], F[1]))) F = [d.x + ux * 13, d.z + uz * 13];
      cu.path = mkPath([D, M, F]);
      if (k === 'cinema') { let w9 = null; for (let q = 0.3; q < 7; q += 0.15) { const x = d.x - ux * q, z = d.z - uz * q; if (fp(B9, x, z)) { w9 = [x + ux * 0.07, z + uz * 0.07]; break; } }
        if (w9) { cu.k = 'cine'; cu.mx = w9[0]; cu.mz = w9[1]; cu.my = Math.max(y, B9.y0 ?? y) + 4.75;   /* 문 위 차양(3.7m 안팎) 위 */ cineBoard(cu); cineDraw(cu, 0);
          cu.q = []; for (let i = 0; i < 3; i++) { const qx = w9[0] + ux * 1.25 + sx * sg * (1.7 + 0.85 * i), qz = w9[1] + uz * 1.25 + sz * sg * (1.7 + 0.85 * i); cu.q.push([qx, gy(qx, qz) + 0.02, qz]); } cu.qry = Math.atan2(-sx * sg, -sz * sg); } }
      if (cu.k !== 'cine') putAB();
      CU.push(cu); }
    // 공장 굴뚝(문 있는 공장 + 그린 굴뚝)
    for (const cu of CU.slice()) if (cu.bk === 'factory' && cu.B9.chim) CU.push({ k: 'fac', id: 'fac@' + cu.id, x: cu.B9.chim[0], y: cu.B9.chim[1], z: cu.B9.chim[2], ph: Math.random(), on: false, n: 0 });
    // 판 끝 들머리(층층골·까망봉) · 썰물섬 · 폭포
    const XP = A.xp(), api = XP && XP.api; if (api) { const G9 = A.geo(); let E9 = []; try { E9 = api.edges(); } catch (e) { E9 = []; }
      for (const e of E9) { if (e.k !== 'gorge' && e.k !== 'crater') continue; const P = (XP.places && XP.places() || []).find(p => p.id === 'xp_' + e.id); const nm = P ? (en() ? P.en || P.name : P.name) : e.id;
        const ax = e.k === 'gorge' ? e.gx + 1 : e.cx, to = P ? [P.x, P.z] : [ax, G9.BZ1 + 60]; let at = null;
        for (const dz of [-3, -6, -9, -1]) { for (const dx of [5.5, -5.5, 7.5, -7.5]) { const x = ax + dx, z = G9.EZ1 + dz; if (!A.blocked(x, z, A.ty(x, z) + 0.5) && !A.onRoad(x, z, 0.9) && !A.wAt(x, z)) { at = [x, z, dx]; break; } } if (at) break; }
        if (!at) continue; const dist = Math.max(10, Math.round(Math.hypot(to[0] - at[0], to[1] - at[1]) / 10) * 10);
        const cu = { k: 'trail', id: 'trail@' + e.id, eid: e.k, x: at[0], z: at[1], y: gy(at[0], at[1]), ry: Math.PI, tip: at[2] > 0 ? 1 : -1, label: nm + '  ' + dist + 'm', ph: Math.random() * 6 };   /* 판 = 마을 쪽(−z)을 봄(ry π) · 길 동쪽에 서면 로컬 +x(= 서쪽 · 길 쪽)가 뾰족 */ trailSign(cu);
        CU.push(cu);
        if (e.k === 'gorge' && e.pool) CU.push({ k: 'fall', id: 'fall@' + e.id, x: e.pool[0], z: e.pool[1] + 6, y: e.poolY || 0 }); }
      const I9 = api.isle && api.isle(), W9 = XP.isleWay && XP.isleWay(); if (I9 && W9 && W9.pts && W9.pts.length > 1) { const pts = W9.pts, X = [], Z = [], Y = [], B = []; let len = 0;
        for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l)); for (let s = i === 1 ? 0 : 1; s <= n; s++) { const x = a[0] + (b[0] - a[0]) * s / n, z = a[1] + (b[1] - a[1]) * s / n, w = api.isleAt(x, z); X.push(x); Z.push(z); B.push(w === 'bar' ? 1 : 0); Y.push(w === 'bar' ? 0 : A.gy(x, z, 90)); } len += l; }
        const mid = Math.floor(X.length / 2); CU.push({ k: 'isle', id: 'isle', x: X[mid], z: Z[mid], X: new Float32Array(X), Z: new Float32Array(Z), Y: new Float32Array(Y), B: new Uint8Array(B), n: X.length, st: 0, t: 0, s: 0, bar: I9.TY + I9.SH + 0.18 }); } }
    // 스키 리프트(의자 돌리기 · 탄 이웃)
    SKI0 = A.ski(); if (SKI0) CU.push({ k: 'ski', id: 'ski', x: SKI0.cx, z: SKI0.cz, ch: -1 });
    for (const cu of CU) { cu.d = 1e9; cu.want = 0; cu.vis = false; cu.strong = false; } FALL = CU.find(c => c.k === 'fall') || null; }
  function mkPath(P) { const C = [0]; for (let i = 1; i < P.length; i++) C.push(C[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return { P, C, Y: P.map(p => gy(p[0], p[1])), len: C[C.length - 1] }; }
  function along(pa, s, out) { const C = pa.C, P = pa.P; let i = 1; while (i < C.length - 1 && C[i] < s) i++; const a = P[i - 1], b = P[i], l = C[i] - C[i - 1] || 1, t = Math.max(0, Math.min(1, (s - C[i - 1]) / l));
    out[0] = a[0] + (b[0] - a[0]) * t; out[1] = pa.Y[i - 1] + (pa.Y[i] - pa.Y[i - 1]) * t; out[2] = a[1] + (b[1] - a[1]) * t; out[3] = Math.atan2(b[0] - a[0], b[1] - a[1]); return out; }
  const _p = [0, 0, 0, 0];

  // ───────── 1초 칸: 거리 · 조건 · 또렷함 · 몸 나누기 ─────────
  const strongOf = cu => { const X = xpS(); if (cu.k === 'door' || cu.k === 'cine') return !DONE[cu.bk](bdS(cu.bk)); if (cu.k === 'fac') return !DONE.factory(bdS('factory'));
    if (cu.k === 'trail') return cu.eid === 'gorge' ? !(Object.keys(X.fos || {}).length || Object.keys(X.st || {}).length) : !X.sc;
    if (cu.k === 'isle') return !(X.il || X.cairn); if (cu.k === 'ski') { const K = X.ski || {}; return !Object.keys(K).some(c => K[c] && K[c].n); } return false; };
  function sec() { if (dead) return; const t0 = performance.now(); const k9 = A.key(); if (k9 !== key) { key = k9; if ((A.doors() || []).length) scan(); else { clear(); built = false; } }
    const hid = OFF || !A.on() || A.hide(), cp = cam(), N9 = A.night(), min = S().min | 0;
    const want = []; for (const cu of CU) { cu.d = hid ? 1e9 : Math.hypot(cp.x - cu.x, cp.z - cu.z); cu.strong = strongOf(cu); cu.want = 0;
      if (cu.k === 'door' || cu.k === 'cine') { const op = openK(cu.bk); if (cu.ab) cu.ab.visible = !hid && op && cu.d < R_BOARD; if (cu.k === 'cine') { const v = !hid && cu.d < R_CINE; cu.board.me.visible = v; cu.lit = op && (N9 >= 0.5 || min >= 17 * 60 + 20);   /* 해 질 녘(17:20)부터 간판 불 */ cu.chase = cu.lit && cu.strong; if (v) cineDraw(cu, cu.step | 0);
          cu.board.me.material.color.setScalar(cu.lit ? 1 : 0.62); let nx = -1; for (const s of SHOW0) if (s > min) { nx = s; break; } cu.qn = op && nx >= 0 && nx - min <= 25 ? (cu.strong ? 3 : 2) : 0; if (cu.qn && cu.d < R_BODY) want.push([cu, cu.qn]); }
        else { cu.walk = op && cu.strong && N9 < 1; if (cu.walk && cu.d < R_BODY) want.push([cu, 1]); } }
      else if (cu.k === 'fac') { cu.on = !hid && cu.d < R_FAC && A.open(9, 18) && N9 < 1; }
      else if (cu.k === 'trail') { const v = !hid && cu.d < R_SIGN; cu.sign.visible = v; cu.rib.visible = v && cu.strong; }
      else if (cu.k === 'isle') { const XP = A.xp(), I9 = XP && XP.api && XP.api.isle ? XP.api.isle() : null; cu.open = !!(I9 && I9.open); if (I9) cu.bar = I9.TY + I9.SH + I9.top + 0.06; cu.walk = cu.open && cu.strong && N9 < 1; if (cu.walk && cu.d < R_ISLE) want.push([cu, 1]); else if (!cu.open) cu.st = 0; }
      else if (cu.k === 'ski') { SKI0 = A.ski(); cu.run = !!SKI0 && A.skiWin() && cu.d < R_SKI; if (!cu.run) cu.ch = -1; cu.ride = cu.run && cu.strong && N9 < 1 && !A.riding(); if (cu.ride && cu.d < R_SKI - 40) want.push([cu, 1]); } }
    // 몸 나누기(가까운 단서부터 · 넷까지) — 주인이 그대로면 칸도 그대로
    want.sort((a, b) => a[0].d - b[0].d); const give = new Map(); let left = NB; for (const [cu, n] of want) { const m = Math.min(n, left); if (m <= 0) break; give.set(cu, m); left -= m; }
    for (let i = 0; i < NB; i++) { const s = SLOT[i]; if (s.c && (give.get(s.c) || 0) > 0) { give.set(s.c, give.get(s.c) - 1); s.keep = 1; } else s.keep = 0; }
    for (let i = 0; i < NB; i++) { const s = SLOT[i]; if (s.keep) continue; s.c = null; for (const [cu, n] of give) if (n > 0) { s.c = cu; give.set(cu, n - 1); break; } }
    for (const cu of CU) cu.nb = 0; for (let i = 0; i < NB; i++) { const s = SLOT[i]; if (s.c) { s.j = s.c.nb++; } }
    // 단서 안 여러 몸의 차례(줄 = 0·1·2)
    for (let i = 0; i < NB; i++) { const s = SLOT[i]; if (!s.c) { if (s.on) { s.on = false; BODY.vis(i, false); } } }
    tickMs = performance.now() - t0; if (tickMs > tickMax) tickMax = tickMs; }

  // ───────── 매 프레임(보이는 것만) ─────────
  const _wind = { x: 0.7071, z: 0.7071 };
  function tick(dt) { if (dead) return; T += dt; if ((secQ += dt) >= 1) { secQ = 0; sec(); } if (!built) return; const hid = OFF || !A.on() || A.hide();
    let nP = 0, bodyOn = false; if ((qq += dt) > 0.25) { qq = 0; const w = A.wind && A.wind(); if (w) { const l = Math.hypot(w.x, w.z) || 1; _wind.x = w.x / l; _wind.z = w.z / l; } }
    for (const cu of CU) { const k = cu.k;
      if (k === 'fac') { if (!cu.on || hid || nP + NP > NP * NPF) continue; const n = cu.strong ? NP : 8, sc = cu.strong ? 1 : 0.62, rise = cu.strong ? 16 : 10;
        for (let i = 0; i < n; i++) { const s = (T * 0.075 + cu.ph + i / n) % 1, r = (0.55 + s * 2.4) * sc * (s > 0.86 ? (1 - s) / 0.14 : 1), dr = s * s * 9 * sc;
          _O.position.set(cu.x + _wind.x * dr + Math.sin(i * 2.1 + T * 0.3) * 0.25, cu.y + 0.4 + s * rise, cu.z + _wind.z * dr + Math.cos(i * 1.7 + T * 0.27) * 0.25); _O.rotation.set(i, i * 0.7, 0); _O.scale.setScalar(Math.max(0.01, r)); _O.updateMatrix(); STEAM.setMatrixAt(nP++, _O.matrix); } }
      else if (k === 'cine' && cu.chase && cu.board.me.visible) { const st = Math.floor(T * 4); if (st !== cu.step) { cu.step = st; cineDraw(cu, st); } }
      else if (k === 'trail' && cu.rib.visible) { const a = cu.ribAt; cu.rib.position.set(a[0], a[1], a[2]); cu.rib.rotation.set(Math.sin(T * 2.3 + cu.ph) * 0.22, cu.ry, Math.sin(T * 3.1 + cu.ph) * 0.18 + 0.08); cu.rib.updateMatrix(); }
      else if (k === 'ski' && cu.run && !hid) skiStep(cu); }
    STEAM.count = nP; STEAM.visible = nP > 0; if (nP) STEAM.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < NB; i++) { const s = SLOT[i], cu = s.c; if (!cu || hid) { if (s.on) { s.on = false; BODY.vis(i, false); } continue; } const on = bodyStep(i, s, cu, dt); if (on !== s.on) { s.on = on; BODY.vis(i, on); } if (on) bodyOn = true; }
    BODY.m.visible = bodyOn; if (bodyOn) { const cp = cam(); BODY.near(cp.x, cp.z, R_BODY + 20); BODY.tick(T); }
    if ((fq += dt) > 0.25) { fq = 0; fallSound(hid); } }
  // 몸 한 칸 움직이기 → 보이나
  const put = (i, x, y, z, ry) => { const s = SLOT[i]; s.x = x; s.z = z; BODY.set(i, x, y, z, ry); };
  function bodyStep(i, s, cu, dt) {
    if (cu.k === 'cine') { if (!cu.qn || s.j >= cu.qn) return false; const q = cu.q[s.j]; put(i, q[0], q[1], q[2], cu.qry); bAct(i, s.j === 0 ? 'stand' : s.j === 1 ? 'nod' : 'stand', 'none'); return true; }
    if (cu.k === 'door') { if (!cu.walk) return false; const pa = cu.path, V = 1.1; cu.t += dt;
      if (cu.st === 0) { const s9 = Math.min(pa.len, cu.t * V); along(pa, pa.len - s9, _p); put(i, _p[0], _p[1] + 0.02, _p[2], _p[3] + Math.PI); bAct(i, 'walk', 'none'); if (s9 >= pa.len) { cu.st = 1; cu.t = 0; } return true; }
      if (cu.st === 1) { if (cu.t > 9) { cu.st = 2; cu.t = 0; } return false; }
      if (cu.st === 2) { const s9 = Math.min(pa.len, cu.t * V); along(pa, s9, _p); put(i, _p[0], _p[1] + 0.02, _p[2], _p[3]); bAct(i, 'walk', cu.bk === 'post' || cu.bk === 'factory' ? 'none' : 'carry'); if (s9 >= pa.len) { cu.st = 3; cu.t = 0; } return true; }
      if (cu.st === 3) { const e = pa.P[pa.P.length - 1], cp = cam(); if (Math.hypot(cp.x - e[0], cp.z - e[1]) < 28 && cu.t < 25) { bAct(i, 'stand', 'none'); return true; } if (cu.t > 5) { cu.st = 0; cu.t = 0; } return false; } return false; }
    if (cu.k === 'isle') { if (!cu.walk) return false; const V = 1.0; cu.t += dt;
      if (cu.st === 0) { cu.s = Math.min(cu.n - 1, cu.t * V); if (cu.s >= cu.n - 1) { cu.st = 1; cu.t = 0; } }
      else if (cu.st === 1) { if (cu.t > 14) { cu.st = 2; cu.t = 0; } }
      else if (cu.st === 2) { cu.s = Math.max(0, cu.n - 1 - cu.t * V); if (cu.s <= 0) { cu.st = 3; cu.t = 0; } }
      else { const cp = cam(); if (Math.hypot(cp.x - cu.X[0], cp.z - cu.Z[0]) < 28 && cu.t < 25) { bAct(i, 'stand', 'carry'); return true; } if (cu.t > 6) { cu.st = 0; cu.t = 0; } return false; }
      const a = Math.floor(cu.s), b = Math.min(cu.n - 1, a + 1), f = cu.s - a, x = cu.X[a] + (cu.X[b] - cu.X[a]) * f, z = cu.Z[a] + (cu.Z[b] - cu.Z[a]) * f, ya = cu.B[a] ? cu.bar : cu.Y[a], yb = cu.B[b] ? cu.bar : cu.Y[b], back = cu.st === 2;
      const dx = cu.X[b] - cu.X[a], dz = cu.Z[b] - cu.Z[a]; put(i, x, ya + (yb - ya) * f + 0.02, z, Math.atan2(back ? -dx : dx, back ? -dz : dz)); bAct(i, cu.st === 1 ? 'pick' : 'walk', cu.st === 1 ? 'basket' : 'carry'); return true; }
    if (cu.k === 'ski') { if (!cu.ride || cu.ch < 0 || !SKI0) return false; const S9 = SKI0, s9 = (S9.t * 2 + cu.ch * S9.LOOP / S9.NC) % S9.LOOP; if (s9 >= S9.Ls - 1.5) { cu.ch = -1; return false; }
      const a = S9.Ls - s9, x = S9.top[0] + S9.ux * a + S9.px * (S9.oL + 1.2), z = S9.top[1] + S9.uz * a + S9.pz * (S9.oL + 1.2); put(i, x, yAt(S9, a) - 1.62 - 0.5, z, S9.ryS + Math.PI); bAct(i, 'sit', 'none'); return true; }
    return false; }
  function yAt(S9, a) { const TW = S9.TW; for (let i = 0; i < TW.length - 1; i++) if (a <= TW[i + 1][3]) { const t = (a - TW[i][3]) / (TW[i + 1][3] - TW[i][3]); return TW[i][1] + (TW[i + 1][1] - TW[i][1]) * t; } return TW[TW.length - 1][1]; }
  // 탈 의자 = 막 오르기 시작한 것(의자 돌리기는 town.js가 260m 안에서 이미 함 · SKI.t)
  function skiStep(cu) { const S9 = SKI0; if (!S9 || cu.ch >= 0 || !cu.ride) return; let best = -1, bs = 1e9;
    for (let k = 0; k < S9.NC; k++) { const s9 = (S9.t * 2 + k * S9.LOOP / S9.NC) % S9.LOOP; if (s9 < S9.Ls && s9 > 1.5 && s9 < bs) { bs = s9; best = k; } } cu.ch = best; }

  // ───────── 층층골 폭포 소리(50m 안 · 작게 · 자연 소리 켬일 때만) ─────────
  let FS = null, FALL = null;
  function fallSound(hid) { const f = FALL; const AMB = A.amb && A.amb(); if (!f || !AMB || !AMB.ac || !AMB.master) { if (FS) FS.g.gain.setTargetAtTime(0, FS.ac.currentTime, 0.4); return; }
    const d = hid ? 1e9 : Math.hypot(cam().x - f.x, cam().z - f.z), v = d < R_FALL ? 0.05 * (1 - d / R_FALL) * (1 - d / R_FALL) : 0;
    if (!FS && v > 0) { try { const ac = AMB.ac, n = ac.sampleRate * 2, b = ac.createBuffer(1, n, ac.sampleRate), D = b.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; l = 0.82 * l + 0.18 * w; D[i] = l * 0.9 + w * 0.12; }
        const src = ac.createBufferSource(); src.buffer = b; src.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; const g = ac.createGain(); g.gain.value = 0; src.connect(lp).connect(g).connect(AMB.master); src.start(); FS = { ac, src, g, v: 0 }; } catch (e) { FS = null; } }
    if (FS && Math.abs(FS.v - v) > 0.002) { FS.v = v; FS.g.gain.setTargetAtTime(v, FS.ac.currentTime, 0.5); } }

  function dispose() { dead = true; clear(); for (const m of MESH) if (m.parent) m.parent.remove(m); for (const g of GEO) g.dispose(); for (const m of MATS) m.dispose(); for (const t of TEX) t.dispose(); BODY.dispose(); if (FS) { try { FS.src.stop(); FS.g.disconnect(); } catch (e) { /* 이미 멈춤 */ } FS = null; } }
  // 시험(town_cue.cjs)
  const info = () => ({ built, n: CU.length, tickMax: +tickMax.toFixed(3), slots: SLOT.map(s => s.c ? s.c.id + '#' + s.j + (s.on ? '' : ' off') : null), pos: SLOT.map(s => s.c && s.on ? [+(+s.x).toFixed(2), +(+s.z).toFixed(2)] : null), steam: STEAM.count, bodyVis: BODY.m.visible, bodyN: BODY.count, fall: FS ? +FS.v.toFixed(3) : 0,
    list: CU.map(cu => ({ id: cu.id, k: cu.k, bk: cu.bk, x: +cu.x.toFixed(1), z: +cu.z.toFixed(1), u: cu.ux != null ? [+cu.ux.toFixed(3), +cu.uz.toFixed(3)] : null, d: Math.round(cu.d), strong: cu.strong, board: cu.ab ? cu.ab.visible : null, sign: cu.sign ? cu.sign.visible : null, rib: cu.rib ? cu.rib.visible : null, mq: cu.board ? cu.board.me.visible : null, lit: cu.lit, chase: cu.chase, qn: cu.qn, walk: cu.walk, on: cu.on, run: cu.run, ride: cu.ride, ch: cu.ch, open: cu.open, st: cu.st, nb: cu.nb, label: cu.label, txt: cu.board ? cu.board.txt : undefined, path: cu.path ? +cu.path.len.toFixed(1) : undefined, n: cu.n })) });
  const draws = () => MESH.filter(m => m.visible).length;
  return { tick, sec, dispose, info, draws, rescan: () => { key = ''; sec(); }, off: v => { OFF = !!v; sec(); }, ski: () => SKI0 ? { t: SKI0.t } : null };
}
