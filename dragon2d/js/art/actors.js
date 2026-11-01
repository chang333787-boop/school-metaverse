/* 인물·드래곤 그림 — dragon2d (탑뷰 모험) · 손그림 그림책 결
 * 정본 약속: docs/dragon/art2d_contract.md v2 §1 · 알아볼 특징: docs/dragon/reference.md B·C
 *
 * 내보내는 것
 *   drawPerson(ctx, who, pose, t)        pose.dir = 'down'(앞 · 얼굴) | 'up'(뒤 · 등) | 'side'(옆 · 오른쪽을 봄 — 왼쪽은 엔진이 scale(-1,1)) · 기본 'down'
 *   drawDragon(ctx, kind, pose, t)       pose.dir = 'side'(모든 종 · 기본) | 'down'·'up'(투슬리스만 — 다른 종은 'side'로 그림) · 대장은 drawBoss로 넘김
 *   drawDragonTop(ctx, kind, pose, t)    바로 위에서 본 날개 편 모습 · 머리가 −y(화면 위) · 몸 중심이 (0,0) · 탄 사람(rider)도 위에서 · 엔진이 몸 방향으로 돌림
 *   drawFlockTop(ctx, kind, flap)        위에서 본 떼 실루엣 (몸 중심이 (0,0) · 머리 −y)
 *   drawFlockDragon(ctx, kind, flap)     (옛 옆 보기 떼 — 쓰지 않아도 됨)
 *   drawBoss(ctx, pose, t)               위에서 본 대장 드래곤 — pose.part = 'all'|'head'|'wing'|'body'
 *   SIZE                                 { 이름: [가로, 키] m }
 *
 * 그리기 기준점 (모두 ctx가 1단위 = 1m · 위쪽 = −y 로 맞춰진 상태에서 부른다 · 그림자는 엔진이 그림 — 이 파일은 그림자를 그리지 않음)
 *  - 사람·드래곤(앞·뒤·옆) = 발(발톱) 가운데가 (0,0). pose.z = 뛴/뜬 높이(m) → 그림만 위로.
 *  - drawDragonTop = 몸통 가운데가 (0,0), 머리는 −y, 꼬리는 +y. 날개 폭은 flap으로 줄었다 늘었다(위에서 본 날갯짓).
 *  - 대장(drawBoss) = **주둥이 앞 끝이 (0,0)**, 머리가 −y를 향하고 머리 뒤 목(+y 쪽 8~20m)·몸통(≈15~48m)·꼬리(≈46~64m)가 이어진다. 날개는 어깨(±7.5, 21)에서 옆으로 21m.
 *    pose: tell(목 부풂) · glow(입 안 밝아짐) · mouth · holes 0~8(날개 막 구멍 — 구멍으로 뒤 그림이 비친다) · eyes 0..1(감음~뜸) · sniff 0..1(콧구멍 벌름) · dizzy
 *  - 옆 모습의 대장은 없음(옛 v1 옆 대장은 버림).
 *
 * 결(약속): 종이 #f4ead2 · 먹선 #2b2118(끝 둥근 선 · 부품마다 굵기 조금씩) · 납작한 칠 + 그늘(3단 톤) · 칠이 선에서 어긋난 자리는 부품마다 미리 정한 값(매 프레임 안 바뀜 = 선이 떨지 않음).
 * 금지: glow·shadowBlur·네온·반짝 별·그라데이션. 영화 그림을 따라 그리지 않고 알아볼 특징만 새 모양으로.
 * 성능: Path2D·색 문자열은 모듈 위에서 한 번만 · 그릴 때 새 객체를 만들지 않음(스크래치 재사용).
 */

const TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, abs = Math.abs, max = Math.max, min = Math.min, sqrt = Math.sqrt, atan2 = Math.atan2;
const INK = '#2b2118', PAPER = '#f4ead2';
const LW = 0.035;             // 사람 외곽 굵기(m)
let LWc = LW;                 // 지금 그리는 것의 선 굵기(사람은 크기 보정)
const NOPOSE = {};

/* ───────── 색 ───────── */
function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function mix(a, b, k) { const A = rgb(a), B = rgb(b); let s = '#'; for (let i = 0; i < 3; i++) { const v = Math.round(A[i] + (B[i] - A[i]) * k); s += (v < 16 ? '0' : '') + v.toString(16); } return s; }
/* 3단 톤: [그늘, 바탕, 밝음] */
const T = (c, a, b) => [mix(c, '#34233f', a === undefined ? .3 : a), c, mix(c, '#fff3d6', b === undefined ? .3 : b)];
/* 먼 쪽 몸(뒤 팔다리): 그늘색을 바탕으로 */
const FAR = c => { const d = mix(c[0], '#1d1620', .22); return [d, mix(c[0], '#1d1620', .08), mix(c[0], '#1d1620', .08)]; };
const hz = i => { const s = sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };   // 미리 정한 흔들림(씨앗 → 0..1)

/* ───────── 부품 만들기 (한 번만 · Path2D) ───────── */
let MS = 1, PID = 0;          // MS = 이번에 만드는 것의 크기 눈금(흔들림·어긋남 폭)
function mk(pts, o) {
  o = o || {};
  const id = ++PID, J = (o.j === undefined ? .005 : o.j) * MS, n = pts.length >> 1, q = new Array(pts.length);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < n; i++) {
    const x = pts[2 * i] + (hz(id * 31 + i * 2) - .5) * 2 * J, y = pts[2 * i + 1] + (hz(id * 31 + i * 2 + 1) - .5) * 2 * J;
    q[2 * i] = x; q[2 * i + 1] = y;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const p = new Path2D();
  if (o.poly) {
    p.moveTo(q[0], q[1]); for (let i = 1; i < n; i++) p.lineTo(q[2 * i], q[2 * i + 1]);
    if (!o.open) p.closePath();
  } else if (o.open) {
    p.moveTo(q[0], q[1]);
    for (let i = 1; i < n - 1; i++) { const j = i + 1; p.quadraticCurveTo(q[2 * i], q[2 * i + 1], j === n - 1 ? q[2 * j] : (q[2 * i] + q[2 * j]) / 2, j === n - 1 ? q[2 * j + 1] : (q[2 * i + 1] + q[2 * j + 1]) / 2); }
    if (n === 2) p.lineTo(q[2], q[3]);
  } else {
    p.moveTo((q[2 * n - 2] + q[0]) / 2, (q[2 * n - 1] + q[1]) / 2);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; p.quadraticCurveTo(q[2 * i], q[2 * i + 1], (q[2 * i] + q[2 * j]) / 2, (q[2 * i + 1] + q[2 * j + 1]) / 2); }
    p.closePath();
  }
  const sz = min(x1 - x0, y1 - y0), ma = o.mis === undefined ? min(.034 * MS, max(.005 * MS, sz * .14)) : o.mis;
  return { pts, o, p, x0, y0, x1, y1, mx: (hz(id * 7 + 1) - .5) * 2 * ma, my: (hz(id * 7 + 2) - .5) * 2 * ma, w: .88 + .3 * hz(id * 5 + 3),
    ax: x0 + (x1 - x0) * (o.axf === undefined ? .22 : o.axf), ay: y0 + (y1 - y0) * (o.ayf === undefined ? .16 : o.ayf), sx: o.sx || .86, sy: o.sy || .86, hl: o.hl ? 1 : 0 };
}
function circ(cx, cy, rx, ry, n) { n = n || 8; const a = []; for (let i = 0; i < n; i++) { const th = i / n * TAU; a.push(cx + cos(th) * rx * 1.04, cy + sin(th) * ry * 1.04); } return a; }
function limb(len, r0, r1, o) {
  const m = (r0 + r1) / 2 + .004;
  return mk([-r0, 0, -m, len * .5, -r1, len, 0, len + r1 * .55, r1, len, m, len * .5, r0, 0, 0, -r0 * .5], Object.assign({ sx: .64, sy: .97 }, o));
}
/* 지그재그 점(털·가시 가장자리): (x0,y0)→(x1,y1) 따라 n개 이빨, 이빨 깊이 amp(법선 방향 +) */
function zig(x0, y0, x1, y1, n, amp) {
  const a = [], dx = x1 - x0, dy = y1 - y0, l = sqrt(dx * dx + dy * dy) || 1, nx = -dy / l * amp, ny = dx / l * amp;
  for (let i = 0; i < n; i++) { const u = i / n, v = (i + .5) / n; a.push(x0 + dx * u, y0 + dy * u, x0 + dx * v + nx, y0 + dy * v + ny); }
  a.push(x1, y1); return a;
}

/* 칠 = 그늘(전체) → 바탕(위왼쪽으로 줄임) → 밝음(더 작게) + 먹선. 칠은 부품마다 정한 만큼 선에서 어긋난다 */
function paint(ctx, q, c, wm) {
  const p = q.p;
  ctx.save();
  ctx.translate(q.mx, q.my);
  ctx.fillStyle = c[0]; ctx.fill(p);
  ctx.translate(q.ax, q.ay); ctx.scale(q.sx, q.sy); ctx.translate(-q.ax, -q.ay);
  ctx.fillStyle = c[1]; ctx.fill(p);
  if (q.hl) { ctx.translate(q.ax, q.ay); ctx.scale(.52, .46); ctx.translate(-q.ax, -q.ay); ctx.fillStyle = c[2]; ctx.fill(p); }
  ctx.restore();
  ctx.lineWidth = LWc * q.w * (wm || 1); ctx.strokeStyle = INK; ctx.stroke(p);
}
/* 작은 것: 칠 한 겹 + 먹선 */
function flat(ctx, q, col, wm) {
  ctx.translate(q.mx, q.my); ctx.fillStyle = col; ctx.fill(q.p); ctx.translate(-q.mx, -q.my);
  ctx.lineWidth = LWc * q.w * (wm || 1); ctx.strokeStyle = INK; ctx.stroke(q.p);
}
function fillOnly(ctx, q, col) { ctx.translate(q.mx, q.my); ctx.fillStyle = col; ctx.fill(q.p); ctx.translate(-q.mx, -q.my); }
function line(ctx, q, wm) { ctx.lineWidth = LWc * q.w * (wm || 1); ctx.strokeStyle = INK; ctx.stroke(q.p); }
/* 굵은 막대/선: 먹 테두리 + 안쪽 색 */
function thick(ctx, q, col, w) {
  ctx.lineWidth = w + LWc * 1.7; ctx.strokeStyle = INK; ctx.stroke(q.p);
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(q.p);
}
function ell(ctx, x, y, rx, ry, col, ink, rot) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  if (col) { ctx.fillStyle = col; ctx.fill(); }
  if (ink) { ctx.lineWidth = LWc * ink; ctx.strokeStyle = INK; ctx.stroke(); }
}

/* ───────── 사람 ───────── */
const L1 = .29, L2 = .27, FT = .04, AU = .23, AF = .2;     // 허벅지·정강이·발·위팔·아래팔 (기준 키 1.6m)
const SK = T('#f3cfa8');
const IRON = T('#98a0a8'), BONE = T('#eee2c6'), WOOD = T('#a9825a'), LEATHER = T('#8a6240');
const PR = {};
const PD = {
  hiccup:   { H: 1.55, bw: .82, hw: .112, sw: .128, lr: .88, ar: .85, hs: 1,    skin: SK, shirt: T('#6f9763'), pants: T('#7b5e45'), boots: T('#4c3b2e'), hair: T('#8f4f2c'), vest: T('#a77e50') },
  stoick:   { H: 2.1,  bw: 1.38, hw: .13, sw: .15, lr: 1.1, ar: 1.15, hs: 1.12, skin: SK, shirt: T('#85553d'), pants: T('#55453a'), boots: T('#3b2f27'), hair: T('#bc4b29'), vest: T('#d3b47c'), belly: .03 },
  gobber:   { H: 1.9,  bw: 1.2, hw: .13, sw: .15, lr: 1.02, ar: 1.05, hs: 1.08, skin: SK, shirt: T('#c29a43'), pants: T('#5c4b3d'), boots: T('#40322a'), hair: T('#e5c45c'), vest: T('#6e4d34'), belly: .045 },
  astrid:   { H: 1.6,  bw: .94, hw: .115, sw: .13, lr: .92, ar: .88, hs: 1,    skin: SK, shirt: T('#4f77ad'), pants: T('#4d3b3b'), boots: T('#45342b'), hair: T('#e9c95e'), vest: T('#7c3d49') },
  fishlegs: { H: 1.85, bw: 1.5, hw: .15, sw: .16, lr: 1.12, ar: 1.12, hs: 1.12, skin: SK, shirt: T('#90a65c'), pants: T('#6b5640'), boots: T('#4a392d'), hair: T('#ceac66'), vest: T('#7d6244'), belly: .08 },
  snotlout: { H: 1.55, bw: 1.18, hw: .125, sw: .15, lr: 1.04, ar: 1.05, hs: 1.04, skin: SK, shirt: T('#a14f40'), pants: T('#4d4349'), boots: T('#352d2d'), hair: T('#34302f'), vest: T('#3f3b4a') },
  ruffnut:  { H: 1.6,  bw: .88, hw: .11, sw: .125, lr: .9, ar: .85, hs: 1,     skin: SK, shirt: T('#b97a8d'), pants: T('#56463f'), boots: T('#40342d'), hair: T('#ecd070'), vest: T('#d6bc98') },
  tuffnut:  { H: 1.6,  bw: .92, hw: .115, sw: .13, lr: .92, ar: .88, hs: 1,    skin: SK, shirt: T('#788b4c'), pants: T('#56463f'), boots: T('#40342d'), hair: T('#e8cc6a'), vest: T('#d6bc98') },
  villager: { H: 1.65, bw: 1.02, hw: .12, sw: .14, lr: .96, ar: .95, hs: 1,    skin: T('#efc59c'), shirt: T('#c68a42'), pants: T('#6a5a48'), boots: T('#45372c'), hair: T('#6d4b2a'), vest: T('#8b6c4a') },
  villager2:{ H: 1.6,  bw: .96, hw: .115, sw: .13, lr: .9, ar: .9, hs: 1,      skin: T('#ebb892'), shirt: T('#4f8f93'), pants: T('#4f8f93'), boots: T('#45372c'), hair: T('#5a3d29'), vest: T('#e9dab2') },
  elder:    { H: 1.5,  bw: .96, hw: .12, sw: .13, lr: .88, ar: .88, hs: 1.02, skin: T('#e8c09a'), shirt: T('#715f90'), pants: T('#4f4560'), boots: T('#3d3330'), hair: T('#ece6d6'), vest: T('#a79876') },
};

/* 머리(중심 원점 · 반지름 ≈ .2 · 오른쪽 보기) */
const HEAD_PTS = [-.205, -.02, -.17, -.15, -.04, -.215, .1, -.19, .185, -.09, .2, -.01, .255, .035, .195, .075, .2, .115, .14, .18, .02, .215, -.11, .17, -.185, .08];

function pmk(who) {
  MS = 1;
  const S = PD[who], b = S.bw, R = { S, who, hb: [], hf: [], hm: [] };
  const hw = S.hw * 1.42, sw = S.sw * 1.36, bl = (S.belly || 0) * 1.3, lr = S.lr * 1.2, ar = S.ar * 1.2;
  R.torso = mk([-hw, .02, -(hw + sw) * .5 - .012, -.27, -sw - .01, -.49, -sw * .3, -.58, sw * .6, -.585, sw + .045, -.47, (hw + sw) * .5 + .03 + bl * .7, -.26, hw + bl * 1.1 + .01, .02, 0, .08], { sx: .84, sy: .9, hl: 1 });
  R.belt = mk([-hw - .01, -.055, hw + bl + .035, -.055, hw + bl + .04, .0, -hw - .01, .0], { poly: 1, mis: .004 });
  R.thigh = limb(L1, .074 * lr, .06 * lr); R.shin = limb(L2, .058 * lr, .046 * lr);
  R.foot = mk([-.058, -.045, .06, -.058, .17, -.035, .205, .015, .15, .048, -.058, .048], { sx: .8, sy: .78 });
  R.upper = limb(AU, .05 * ar, .043 * ar); R.fore = limb(AF, .043 * ar, .037 * ar);
  R.hand = mk(circ(0, .02, .052 * (.8 + .2 * ar), .052 * (.8 + .2 * ar), 7), { sx: .8, sy: .8 });
  R.thumb = mk(circ(.045, -.02, .022, .018, 6), { sx: .9, sy: .9 });
  R.neck = limb(.12, .05 * (.7 + .3 * b), .05 * (.7 + .3 * b), { sx: .7 });
  R.head = mk(HEAD_PTS, { sx: .86, sy: .84, hl: 1, mis: .014 });
  R.ear = mk(circ(0, 0, .036, .046, 6), { sx: .8, sy: .8 });
  R.c = { far: { pants: FAR(S.pants), shirt: FAR(S.shirt), skin: FAR(S.skin), boots: FAR(S.boots) } };
  R.hs = S.hs; R.hair = S.hair; R.beard = null; R.stoop = 0; R.flat = null;
  R.cheek = '#eca391'; R.brow = mix(S.hair[1], '#2b2118', .45);
  const bt = R.torso;
  /* 사람마다 다른 것 (옷·머리·모자·수염) */
  switch (who) {
    case 'hiccup':
      R.vest = mk(zig(-hw - .015, .02, hw + .02, .02, 6, .06).concat([sw + .018, -.46, .05, -.55, -.05, -.55, -sw - .018, -.46]), { poly: 1, sx: .92, sy: .94 });
      R.hm.push([mk([-.2, .1, -.245, -.03, -.27, -.16, -.15, -.2, -.17, -.3, -.04, -.25, .02, -.34, .09, -.25, .19, -.27, .17, -.17, .2, -.1, .1, -.14, 0, -.12, -.08, -.06, -.1, .04, -.14, .14], { poly: 1, hl: 1 }), S.hair]);
      R.helm = [mk([-.235, .0, -.23, -.17, -.1, -.3, .06, -.32, .18, -.25, .235, -.12, .21, -.07, 0, -.09, -.2, -.04], { hl: 1 }), T('#8a7d70'), mk([-.24, -.07, .23, -.1, .22, -.03, -.24, .0], { poly: 1 }), T('#6a5b4e')];
      R.hornN = mk([.09, -.28, .14, -.38, .2, -.3], { poly: 1 });
      R.peg = mk([0, 0, 0, .27], { poly: 1, open: 1 });
      R.eyeCol = '#2b2118';
      break;
    case 'stoick':
      R.tun = mk([-hw - .02, -.06, hw + .03, -.06, hw + .09, .2, hw + .1, .36, -hw - .1, .36, -hw - .09, .2], { poly: 1, sx: .92, sy: .92 });
      R.collar = mk(zig(-sw - .08, -.5, sw + .09, -.52, 7, -.05).concat([sw + .06, -.4, -sw - .06, -.4]), { poly: 1 });
      R.beard = [mk([-.17, .05, -.06, -.01, .12, .03, .21, .07, .22, .18, .14, .3, .03, .39, -.08, .28, -.17, .15], { hl: 1 }), S.hair, mk([.2, .06, .28, .09, .3, .14, .2, .13], { poly: 1 })];
      R.hf.push([mk([-.235, .0, -.23, -.17, -.1, -.31, .06, -.33, .19, -.26, .24, -.12, .22, -.06, 0, -.09, -.2, -.04], { hl: 1 }), IRON]);
      R.hb.push([mk([.04, -.2, -.02, -.36, .02, -.55, .2, -.66, .38, -.62, .26, -.53, .14, -.45, .12, -.32, .16, -.2]), BONE, 1]);
      R.hf.push([mk([-.12, -.2, -.21, -.36, -.15, -.56, .04, -.7, .24, -.66, .1, -.57, -.03, -.47, -.04, -.33, .05, -.2]), BONE]);
      R.hm.push([mk([-.22, .0, -.26, .1, -.2, .19, -.17, .08], { poly: 1 }), S.hair]);
      R.brow = S.hair[0]; R.bigBrow = 1;
      break;
    case 'gobber':
      R.apron = mk([-hw - .02, -.5, hw + .035, -.5, hw + .06, .22, -hw - .05, .22], { poly: 1, sx: .92, sy: .92 });
      R.tun = mk([-hw - .03, -.06, hw + .05, -.06, hw + .1, .22, -hw - .1, .22], { poly: 1, sx: .92, sy: .92 });
      R.hm.push([mk([-.2, .05, -.235, -.08, -.17, -.2, -.07, -.2, -.1, -.08, -.14, 0], { poly: 1, hl: 1 }), S.hair]);
      R.beard = [mk([.14, .075, .24, .08, .3, .15, .31, .26, .25, .33, .2, .26, .24, .2, .17, .14], { hl: 1 }), S.hair, null];
      R.noseBig = 1; R.stoop = .04; R.hook = mk([0, 0, 0, .12, 0, .2, .06, .26, .13, .22, .12, .15], { open: 1 }); R.peg = mk([0, 0, 0, .27], { poly: 1, open: 1 });
      break;
    case 'astrid':
      R.skirt = mk(zig(-hw - .12, .28, hw + .13, .28, 7, .06).concat([hw + .02, -.06, -hw - .02, -.06]), { poly: 1, sx: .92, sy: .92 });
      R.studs = mk([-.1, .28, -.08, .35, -.05, .28, .0, .28, .02, .35, .05, .28, .1, .28, .12, .35, .15, .28], { poly: 1, open: 1 });
      R.hm.push([mk([-.22, .08, -.235, -.08, -.14, -.22, 0, -.255, .14, -.21, .2, -.11, .1, -.13, -.02, -.1, -.1, -.03, -.13, .08], { hl: 1 }), S.hair]);
      R.braid = 7; R.shoulder = mk(circ(0, -.5, .1, .06, 6), { sx: .9, sy: .9 });
      break;
    case 'fishlegs':
      R.tun = mk([-hw - .03, -.06, hw + bl + .05, -.06, hw + bl + .12, .2, hw + bl + .13, .34, -hw - .12, .34, -hw - .11, .2], { poly: 1, sx: .92, sy: .92 });
      R.vest = mk(zig(-hw - .02, .0, hw + bl + .04, .0, 6, .05).concat([sw + .03, -.46, .05, -.55, -.05, -.55, -sw - .03, -.46]), { poly: 1 });
      R.hm.push([mk([-.215, .12, -.235, -.04, -.2, -.16, -.12, -.1, -.15, .02, -.16, .12], { poly: 1 }), S.hair]);
      R.hf.push([mk([-.235, -.01, -.22, -.15, -.09, -.27, .06, -.285, .17, -.23, .225, -.1, .2, -.05, 0, -.08, -.2, -.03], { hl: 1 }), T('#a49984')]);
      R.hf.push([mk([-.02, -.27, .05, -.4, .11, -.27], { poly: 1 }), BONE]); R.hf.push([mk([-.17, -.22, -.15, -.35, -.06, -.25], { poly: 1 }), BONE]);
      R.round = 1;
      break;
    case 'snotlout':
      R.vest = mk([-hw - .02, -.04, -sw - .02, -.47, -.05, -.55, .05, -.55, sw + .02, -.47, hw + .03, -.04], { poly: 1, sx: .92, sy: .92 });
      R.shoulder = mk(zig(-.12, -.52, .14, -.52, 5, -.05), { poly: 1 });
      R.hm.push([mk([-.215, .08, -.25, -.04, -.2, -.17, -.1, -.24, .06, -.27, .17, -.22, .2, -.13, .12, -.14, .0, -.14, -.1, -.08, -.14, .06], { poly: 1, hl: 1 }), S.hair]);
      R.hf.push([mk([-.235, -.01, -.22, -.15, -.09, -.275, .06, -.295, .17, -.235, .225, -.11, .2, -.06, 0, -.09, -.2, -.03], { hl: 1 }), T('#7e7567')]);
      R.hb.push([mk([-.16, -.14, -.28, -.16, -.34, -.04, -.27, .08, -.17, .05, -.2, -.02, -.26, -.05, -.22, -.12]), BONE, 1]);
      R.hf.push([mk([-.1, -.17, -.22, -.26, -.31, -.14, -.28, .0, -.2, .02, -.23, -.05, -.25, -.1, -.19, -.17]), BONE]);
      break;
    case 'ruffnut': case 'tuffnut': {
      const rf = who === 'ruffnut';
      R.vest = mk(zig(-hw - .03, .04, hw + .05, .04, 6, .06).concat([sw + .03, -.45, .0, -.54, -sw - .03, -.45]), { poly: 1 });
      R.skirt = mk(zig(-hw - .04, .2, hw + .06, .2, 6, .05).concat([hw + .02, -.06, -hw - .02, -.06]), { poly: 1, sx: .92, sy: .92 });
      R.hm.push([mk(rf ? [-.22, .08, -.235, -.08, -.14, -.22, 0, -.255, .14, -.21, .2, -.11, .1, -.13, -.02, -.1, -.1, -.03, -.13, .08]
        : [-.22, .1, -.26, -.05, -.2, -.2, -.1, -.27, .02, -.3, .1, -.25, .2, -.24, .17, -.15, .19, -.08, .1, -.12, -.02, -.1, -.1, -.04, -.14, .08], rf ? { hl: 1 } : { poly: 1, hl: 1 }), S.hair]);
      R.hf.push([mk([-.235, -.01, -.22, -.15, -.09, -.27, .06, -.29, .17, -.235, .225, -.11, .2, -.06, 0, -.09, -.2, -.03], { hl: 1 }), T('#8e8b86')]);
      R.hb.push([mk([-.04, -.25, -.1, -.5, .08, -.27], { poly: 1 }), BONE, 1]); R.hb.push([mk([.1, -.27, .24, -.52, .24, -.25], { poly: 1 }), BONE, 1]);
      R.hf.push([mk([-.12, -.24, -.2, -.5, .0, -.27], { poly: 1 }), BONE]);
      R.hf.push([mk([.02, -.27, .15, -.52, .14, -.24], { poly: 1 }), BONE]);
      R.braid = rf ? 6 : 4; R.braid2 = rf ? 1 : 0; R.teeth = mk([-.08, -.5, -.06, -.43, -.04, -.5, -.02, -.43, 0, -.5, .02, -.43, .04, -.5, .06, -.43, .08, -.5], { poly: 1, open: 1 });
      R.mad = rf ? 0 : 1; break; }
    case 'villager':
      R.tun = mk([-hw - .02, -.06, hw + .03, -.06, hw + .07, .2, -hw - .07, .2], { poly: 1, sx: .92, sy: .92 });
      R.hm.push([mk([-.215, .1, -.23, -.06, -.14, -.2, 0, -.23, .12, -.2, .19, -.12, .08, -.13, -.04, -.1, -.12, -.03, -.15, .09], { hl: 1 }), S.hair]);
      R.hf.push([mk([-.22, -.06, -.2, -.17, -.07, -.27, .08, -.27, .19, -.19, .22, -.1, .12, -.1, -.1, -.09], { hl: 1 }), T('#8c6c4c')]);
      break;
    case 'villager2':
      R.dress = mk([-hw - .02, -.07, hw + .03, -.07, hw + .09, .26, hw + .12, .52, -hw - .12, .52, -hw - .1, .26], { poly: 1, sx: .92, sy: .92 });
      R.apron = mk([-.1, -.45, .12, -.45, .13, .02, .17, .46, -.14, .46, -.1, .02], { poly: 1, sx: .94, sy: .94 });
      R.hm.push([mk([-.23, .13, -.25, -.04, -.18, -.2, -.02, -.25, .13, -.21, .21, -.12, .12, -.15, -.04, -.13, -.12, -.06, -.16, .08], { hl: 1 }), T('#c9634f')]);
      R.knot = mk([-.2, .0, -.32, -.06, -.36, .04, -.3, .1, -.2, .07], { poly: 1 });
      R.hm.push([mk([.14, -.17, .2, -.1, .18, -.02, .11, -.1], { poly: 1 }), S.hair]);
      break;
    case 'elder':
      R.dress = mk([-hw - .02, -.07, hw + .03, -.07, hw + .09, .26, hw + .1, .5, -hw - .1, .5, -hw - .09, .26], { poly: 1, sx: .92, sy: .92 });
      R.collar = mk(zig(-sw - .05, -.51, sw + .06, -.53, 7, -.04).concat([sw + .03, -.42, -sw - .03, -.42]), { poly: 1 });
      R.hm.push([mk([-.2, .1, -.25, -.0, -.22, -.1, -.12, -.12, -.1, -.04, -.12, .08], { hl: 1 }), S.hair]);
      R.beard = [mk([-.16, .04, -.04, .0, .13, .04, .21, .08, .21, .22, .15, .45, .06, .64, -.04, .5, -.13, .27], { hl: 1 }), S.hair, mk([.2, .06, .26, .1, .2, .14], { poly: 1 })];
      R.stoop = .26; R.bigBrow = 1; R.brow = '#d9d2c2'; R.noseBig = 1;
      break;
  }
  if (R.braid) { R.bl = mk(circ(0, 0, .042, .062, 6), { sx: .85, sy: .85 }); }
  R.iron = T('#8d949c'); R.rope = T('#b79a62');
  return R;
}
for (const w in PD) PR[w] = pmk(w);

/* 들고 있는 것 (손 자리 원점 · 하늘 쪽 = −y) */
MS = 1;
const ITEM = {
  bucket: { b: mk([-.115, .09, .115, .09, .09, .3, -.09, .3], { poly: 1, sx: .9 }), bc: T('#a9825a'), band: mk([-.12, .08, .12, .08, .115, .12, -.115, .12], { poly: 1 }), h: mk([-.1, .09, -.08, -.06, 0, -.1, .08, -.06, .1, .09], { open: 1, j: .002 }) },
  axe: { h: mk([-.022, -.52, .022, -.52, .026, .3, -.026, .3], { poly: 1, sx: .8 }), hc: T('#9a7650'), blade: mk([0, -.52, .13, -.58, .24, -.45, .2, -.3, .09, -.27, 0, -.34], { sx: .8 }), bc: T('#b4bcc4'), back: mk([-.02, -.52, -.08, -.55, -.1, -.47, -.04, -.4, -.02, -.34], { poly: 1 }) },
  hammer: { h: mk([-.025, -.38, .025, -.38, .03, .3, -.03, .3], { poly: 1, sx: .8 }), hc: T('#9a7650'), head: mk([-.13, -.5, .13, -.5, .13, -.3, -.13, -.3], { poly: 1, sx: .86 }), hdc: T('#6f757d') },
  knife: { h: mk([-.026, 0, .026, 0, .026, .12, -.026, .12], { poly: 1 }), hc: T('#6e4d34'), blade: mk([-.03, 0, .03, 0, .02, -.2, -.01, -.24], { poly: 1 }), bc: T('#c3c9cf') },
  fish: { b: mk([-.02, .05, -.065, .14, -.075, .25, -.035, .35, 0, .37, .035, .35, .075, .25, .065, .14, .02, .05], { hl: 1 }), bc: T('#9fb7c3'), tail: mk([0, .08, -.09, -.04, .09, -.04], { poly: 1 }), tc: T('#86a1b0'), fin: mk([.06, .17, .13, .22, .06, .24], { poly: 1 }) },
  bola: { r: mk([-.14, .3, -.05, .12, 0, .05, .05, .12, .14, .32], { poly: 1, open: 1, j: .002 }), r2: mk([0, .05, 0, .36], { poly: 1, open: 1, j: .002 }), ball: mk(circ(0, 0, .05, .05, 6), { sx: .8, sy: .8 }), bc: T('#6a6d74') },
  book: { b: mk([-.15, -.12, .15, -.12, .15, .14, -.15, .14], { poly: 1, sx: .9 }), bc: T('#7e4c37'), pg: mk([.15, -.1, .17, -.1, .17, .12, .15, .12], { poly: 1 }), band: mk([-.08, -.04, .1, -.04, .1, .03, -.08, .03], { poly: 1 }) },
  torch: { h: mk([-.025, .12, .025, .12, .032, -.42, -.032, -.42], { poly: 1 }), hc: T('#8a6644'), hd: mk([-.065, -.4, .065, -.4, .075, -.52, -.075, -.52], { poly: 1 }), f: mk([0, -.9, .09, -.7, .085, -.55, -.085, -.55, -.09, -.7], { sx: .8 }), f2: mk([0, -.78, .05, -.66, .045, -.56, -.045, -.56, -.05, -.66]) },
  bag: { b: mk([-.09, .04, -.14, .15, -.13, .27, 0, .32, .13, .27, .14, .15, .09, .04, 0, .0], { hl: 1 }), bc: T('#c9a66d'), tie: mk([-.1, .045, .1, .045, .1, .08, -.1, .08], { poly: 1 }) },
  shield: { b: mk(circ(.06, .0, .27, .27, 10), { hl: 1 }), bc: T('#b8864c'), boss: mk(circ(.06, 0, .075, .075, 6)), pl: mk([.06, -.26, .06, .26], { poly: 1, open: 1, j: .002 }), pl2: mk([-.14, -.17, -.14, .17], { poly: 1, open: 1, j: .002 }), pl3: mk([.26, -.17, .26, .17], { poly: 1, open: 1, j: .002 }) },
  staff: { r: mk([0, -.95, 0, .72], { poly: 1, open: 1 }), knob: mk(circ(0, -.97, .06, .06, 6)) },
};
ITEM.torch.sh = null;
const FLAME = [T('#ef8d33', .2, .1), T('#ffd05a', .2, .1)];

function drawItem(ctx, name, t, sp) {
  const I = ITEM[name]; if (!I) return;
  switch (name) {
    case 'bucket': ctx.rotate(.16 * sin(t * 4.5) * (.4 + sp)); paint(ctx, I.b, I.bc); flat(ctx, I.band, '#6e6f74', .8); line(ctx, I.h, 1); break;
    case 'axe': ctx.rotate(.5); thick(ctx, I.h, I.hc[1], .04); paint(ctx, I.blade, I.bc); flat(ctx, I.back, '#8b9199', .8); break;
    case 'hammer': ctx.rotate(.45); thick(ctx, I.h, I.hc[1], .045); paint(ctx, I.head, I.hdc); break;
    case 'knife': ctx.rotate(1.1); paint(ctx, I.h, I.hc); paint(ctx, I.blade, I.bc); break;
    case 'fish': ctx.rotate(.14 * sin(t * 6)); flat(ctx, I.tail, I.tc[1]); paint(ctx, I.b, I.bc); ell(ctx, .0, .31, .012, .012, INK); flat(ctx, I.fin, I.tc[1], .7); break;
    case 'bola': ctx.rotate(.1 * sin(t * 4)); line(ctx, I.r, .8); line(ctx, I.r2, .8); ctx.save(); ctx.translate(-.14, .32); paint(ctx, I.ball, I.bc); ctx.translate(.14, .06); paint(ctx, I.ball, I.bc); ctx.translate(.14, -.06); paint(ctx, I.ball, I.bc); ctx.restore(); break;
    case 'book': ctx.rotate(-.35); ctx.translate(.1, -.02); paint(ctx, I.b, I.bc); flat(ctx, I.pg, '#f1e6c9', .7); flat(ctx, I.band, '#c9a24a', .7); break;
    case 'torch': {
      thick(ctx, I.h, I.hc[1], .05); flat(ctx, I.hd, '#4d3b30');
      ctx.save(); ctx.translate(0, -.52); ctx.rotate(.14 * sin(t * 8.7)); ctx.translate(0, .52);
      paint(ctx, I.f, FLAME[0]); ctx.translate(0, -.0); flat(ctx, I.f2, FLAME[1][1], .6); ctx.restore(); break; }
    case 'bag': ctx.rotate(.1 * sin(t * 3)); paint(ctx, I.b, I.bc); flat(ctx, I.tie, '#8a6a43', .7); break;
    case 'shield': ctx.translate(.06, -.02); paint(ctx, I.b, I.bc); line(ctx, I.pl, .6); line(ctx, I.pl2, .6); line(ctx, I.pl3, .6); flat(ctx, I.boss, '#9aa1a9'); break;
    case 'staff': thick(ctx, I.r, '#8a6644', .05); flat(ctx, I.knob, '#6c4f38'); break;
  }
}

function axeBack(ctx, rot) { const I = ITEM.axe; ctx.rotate(rot); thick(ctx, I.h, I.hc[1], .04); paint(ctx, I.blade, I.bc); flat(ctx, I.back, '#8b9199', .8); }
function hh(f, k) { return L1 * cos(f) + L2 * cos(f - k) + FT; }

function limbLeg(ctx, R, f, kn, far, peg) {
  const c = R.c.far, S = R.S;
  ctx.save(); ctx.translate(far ? -.012 : .012, 0); ctx.rotate(-f);
  paint(ctx, R.thigh, far ? c.pants : S.pants);
  ctx.translate(0, L1); ctx.rotate(kn);
  if (peg) { thick(ctx, R.peg, peg === 2 ? '#8b6a47' : '#8d949c', .045); ctx.translate(0, L2); ctx.rotate(f - kn); ell(ctx, .03, .02, .06, .022, '#6a5a4a', .8); ctx.restore(); return; }
  paint(ctx, R.shin, far ? c.pants : S.pants);
  ctx.translate(0, L2); ctx.rotate((f - kn) * .88);
  paint(ctx, R.foot, far ? c.boots : S.boots);
  ctx.restore();
}
function limbArm(ctx, R, f1, bend, far, hand, hook, thumb) {
  const c = R.c.far, S = R.S;
  ctx.save(); ctx.rotate(-f1);
  paint(ctx, R.upper, far ? c.shirt : S.shirt);
  ctx.translate(0, AU); ctx.rotate(-bend);
  if (hook) { thick(ctx, R.hook, '#8d949c', .04); ctx.restore(); return; }
  paint(ctx, R.fore, far ? c.skin : S.skin);
  ctx.translate(0, AF);
  paint(ctx, R.hand, far ? c.skin : S.skin);
  if (thumb) paint(ctx, R.thumb, far ? c.skin : S.skin);
  ctx.restore();
}

/* 한 사람의 몸(엉덩이가 원점) — 타는 사람도 같은 함수 */
function personBody(ctx, R, P, t, ride) {
  const S = R.S, sp = P.speed || 0, air = P.air ? 1 : 0, cr = P.crouch || 0, hu = P.hurt || 0, sit = P.sit ? 1 : 0, ch = P.cheer ? 1 : 0, hand = P.hand || 0;
  const look = P.look === undefined ? 0 : P.look, carry = P.carry || (R.who === 'elder' ? 'staff' : null);
  const ph = (P.walk !== undefined ? P.walk : t * (.9 + 1.3 * sp)) * TAU, sph = sin(ph), cph = cos(ph);
  let fa, ka, fb, kb;
  if (ride) { fa = .95; ka = .75; fb = 1.05; kb = .9; }
  else if (sit) { fa = 1.5; ka = 1.5; fb = 1.46; kb = 1.46; }
  else if (air) { fa = .85; ka = 1.1; fb = -.3; kb = .9; }
  else {
    const A = sp, K = 1.5 * sp;
    fa = A * sph; fb = -A * sph; ka = K * max(0, cph); kb = K * max(0, -cph);
    if (cr) { fa += .95 * cr; fb += .95 * cr + .1; ka += 1.7 * cr; kb += 1.7 * cr; }
    else fb += .12 * (1 - min(1, sp * 3));
    if (hu) { fa = .6 * hu; fb = .2 * hu; ka = 1.1 * hu; kb = .7 * hu; }
  }
  const lean = sp * .15 + cr * .5 + air * .1 + R.stoop + (ride ? .12 : 0) + (hu ? -.2 * hu : 0) + sin(t * 1.9) * .01 * (1 - sp);
  const hipH = ride ? 0 : sit ? hh(fa, ka) : air ? .52 : hu ? max(hh(fa, ka), hh(fb, kb)) : max(hh(fa, ka), hh(fb, kb));
  /* 몸 전체 눕기 */
  ctx.save();
  if (!ride) ctx.translate(0, -hipH);
  const peg = R.who === 'gobber' ? 2 : (P.peg && R.who === 'hiccup') ? 1 : 0;
  /* 다리 (먼 → 가까운) */
  limbLeg(ctx, R, fb, kb, true, 0);
  limbLeg(ctx, R, fa, ka, false, R.who === 'gobber' ? 2 : 0);
  if (peg === 1) { /* 히컵 의족은 먼 쪽(왼다리) — 다시 그려 금속 정강이를 보임 */ limbLeg(ctx, R, fb, kb, true, 1); }
  /* 몸통 틀 */
  ctx.rotate(lean);
  if (R.dress) paint(ctx, R.dress, S.shirt === R.S.shirt && R.who === 'elder' ? S.shirt : S.shirt);
  if (R.tun && !R.dress) paint(ctx, R.tun, R.who === 'gobber' ? S.vest : R.who === 'stoick' ? S.pants : S.shirt);
  if (R.skirt) { paint(ctx, R.skirt, R.who === 'astrid' ? S.vest : S.vest); if (R.studs) flat(ctx, R.studs, '#a2a9b0', .7); }
  /* 먼 팔 */
  ctx.save(); ctx.translate(0, -.5);
  { let f1, bn;
    if (ride) { f1 = .9; bn = .5; } else if (ch) { f1 = 2.8 - .25 * sin(t * 9); bn = .1; } else if (hu) { f1 = 2.2 + .3 * sin(t * 7); bn = .3; } else if (air) { f1 = 2.3; bn = .2; }
    else { f1 = -.75 * sp * sph + .02 + .3 * cr; bn = .55 * sp + .1 * cr + .14; if (R.who === 'gobber') { bn = .5 * sp; } }
    ctx.translate(.0, 0); limbArm(ctx, R, f1, bn, true, 0, R.who === 'gobber'); }
  ctx.restore();
  if (R.who === 'astrid' && !carry && !hand) { ctx.save(); ctx.translate(-.1, -.2); axeBack(ctx, -.45); ctx.restore(); }   /* 등에 멘 도끼 */
  /* 몸통 */
  paint(ctx, R.torso, S.shirt);
  if (R.who === 'hiccup') paint(ctx, R.vest, S.vest);
  if (R.tun || R.skirt || R.who === 'hiccup' || R.who === 'snotlout') flat(ctx, R.belt, R.who === 'astrid' ? '#5a3a2a' : '#5e4330', .8);
  else if (R.vest && R.who !== 'astrid' && !R.skirt) paint(ctx, R.vest, S.vest);
  if (R.skirt && R.vest && R.who !== 'astrid') paint(ctx, R.vest, S.vest);
  if (R.apron) paint(ctx, R.apron, R.who === 'gobber' ? S.vest : S.vest);
  if (R.collar) paint(ctx, R.collar, S.vest);
  if (R.shoulder && R.who !== 'astrid') flat(ctx, R.shoulder, '#8d949c', .9);
  if (R.who === 'astrid') flat(ctx, R.shoulder, '#9a9fa6', .9);
  if (R.teeth) { ctx.save(); ctx.translate(.03, .02); flat(ctx, R.teeth, '#f2ead4', .7); ctx.restore(); }
  /* 목 + 머리 */
  ctx.save(); ctx.translate(.03, -.5);
  paint(ctx, R.neck, S.skin);
  ctx.restore();
  /* 가까운 팔 */
  ctx.save(); ctx.translate(0, -.5);
  { let f1, bn, withItem = carry;
    if (ride) { f1 = 1.0; bn = .45; } else if (ch) { f1 = 2.9 + .25 * sin(t * 9 + 1); bn = .1; withItem = null; } else if (hu) { f1 = 2.0 - .3 * sin(t * 7); bn = .3; withItem = null; } else if (air) { f1 = 2.0; bn = .3; }
    else if (hand) { f1 = (.75 * sp * sph) * (1 - hand) + 1.5 * hand; bn = .1 * hand; withItem = hand > .5 ? null : carry; }
    else if (carry === 'staff') { f1 = .35; bn = .35; }
    else if (carry) { f1 = .55 + .25 * sp * sph; bn = .9; if (carry === 'bucket' || carry === 'fish' || carry === 'bola' || carry === 'bag') { f1 = .22 + .5 * sp * sph; bn = .15; } }
    else { f1 = .75 * sp * sph + .1 + .3 * cr; bn = .55 * sp + .1 * cr + .2; }
    ctx.save(); ctx.rotate(-f1); paint(ctx, R.upper, S.shirt); ctx.translate(0, AU); ctx.rotate(-bn); paint(ctx, R.fore, S.skin); ctx.translate(0, AF);
    paint(ctx, R.hand, S.skin); if (hand > .3) paint(ctx, R.thumb, S.skin);
    if (withItem) { ctx.rotate(f1 + bn - lean); drawItem(ctx, withItem, t, sp); }
    ctx.restore(); }
  ctx.restore();
  /* 머리 */
  ctx.save();
  ctx.translate(.03 + lean * .06, -.5 - .25 - (cr ? 0 : 0));
  const hs = R.hs; ctx.scale(hs, hs); const lw0 = LWc; LWc = lw0 / hs;
  let flip = 0, tilt = 0;
  if (look < -.45) flip = 1; else tilt = look >= 0 ? -.22 * look : .3 * -look;
  if (hu) tilt = -.3 * hu;
  if (ride) tilt -= .1;
  if (flip) ctx.scale(-1, 1);
  ctx.rotate(tilt - lean * .6);
  face(ctx, R, P, t, flip, look);
  LWc = lw0; ctx.restore();
  ctx.restore();
}

function face(ctx, R, P, t, flip, look) {
  const S = R.S, hu = P.hurt || 0, talk = P.talk ? 1 : 0, ch = P.cheer ? 1 : 0;
  /* 뒤 머리·뿔 */
  for (let i = 0; i < R.hb.length; i++) { const e = R.hb[i]; paint(ctx, e[0], e[1]); }
  if (R.braid) braid(ctx, R, P, t);
  paint(ctx, R.head, S.skin);
  /* 귀 */
  ctx.save(); ctx.translate(-.06, .03); paint(ctx, R.ear, S.skin); ctx.restore();
  if (R.noseBig) { ell(ctx, .235, .03, .045, .04, S.skin[1], 1); }
  /* 눈 · 눈썹 · 입 */
  const closed = flip || hu || ((t * .37 + R.hs * 3.1) % 1) < .035;
  if (closed) { ctx.beginPath(); ctx.moveTo(.075, -.03); ctx.quadraticCurveTo(.105, hu ? -.06 : -.005, .135, -.03); ctx.lineWidth = LWc * 1.1; ctx.strokeStyle = INK; ctx.stroke(); }
  else {
    const ex = .105 + (look < 0 ? -.01 : 0) + (look > 0 ? .005 : 0), ey = -.035 - (look > 0 ? .01 * look : 0);
    ell(ctx, ex, ey, .029, .04, INK); ell(ctx, ex + .008, ey - .014, .009, .01, PAPER);
  }
  ctx.beginPath(); ctx.strokeStyle = R.brow; ctx.lineWidth = LWc * (R.bigBrow ? 2.4 : 1.1);
  const mad = R.mad ? -.012 : 0;
  ctx.moveTo(.065, -.095 + (hu ? -.02 : 0)); ctx.lineTo(.145, -.1 + (hu ? .0 : 0) + (ch ? -.015 : 0) + mad); ctx.stroke();
  ell(ctx, .1, .075, .042, .028, R.cheek);
  ctx.beginPath(); ctx.strokeStyle = INK; ctx.lineWidth = LWc * 1.05;
  if (hu || ch || talk) {
    const op = hu ? .035 : ch ? .045 : .012 + .028 * abs(sin(t * 13.3));
    ctx.beginPath(); ctx.ellipse(.15, .122, .032, op, 0, 0, TAU); ctx.fillStyle = '#7d2f33'; ctx.fill(); ctx.stroke();
  } else { ctx.moveTo(.1, .115); ctx.quadraticCurveTo(.145, .15, .19, .113); ctx.stroke(); }
  if (R.who === 'hiccup') { ctx.fillStyle = '#c98e68'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(.07 + i * .028, .03 + (i & 1) * .02, .006, 0, TAU); ctx.fill(); } }
  /* 수염·머리·모자 */
  if (R.beard) { paint(ctx, R.beard[0], R.beard[1]); if (R.beard[2]) paint(ctx, R.beard[2], R.beard[1]); }
  for (let i = 0; i < R.hm.length; i++) { const e = R.hm[i]; if (R.helm && P.helmet && false) continue; paint(ctx, e[0], e[1]); }
  if (R.helm && P.helmet) { paint(ctx, R.helm[0], R.helm[1]); flat(ctx, R.helm[2], R.helm[3][1], .9); flat(ctx, R.hornN, '#eee2c6', .8); }
  for (let i = 0; i < R.hf.length; i++) { const e = R.hf[i]; paint(ctx, e[0], e[1]); }
}
function braid(ctx, R, P, t) {
  const sp = P.speed || 0, sw = sin(((P.walk !== undefined ? P.walk : t * (.9 + 1.3 * sp)) * TAU) - .8) * .35 * sp + sin(t * 1.7) * .04;
  const n = R.braid, hur = (P.hurt || 0);
  ctx.save(); ctx.translate(-.17, .0 + (R.braid2 ? -.02 : 0)); ctx.rotate(-.5 - sw * .5 + hur * .2);
  for (let i = 0; i < n; i++) {
    ctx.translate(0, .075); ctx.rotate(sw * .12 * (i + 1) * .5);
    ctx.save(); ctx.scale(1 - i * .045, 1 - i * .02); flat(ctx, R.bl, i & 1 ? R.hair[0] : R.hair[1], .8); ctx.restore();
  }
  ell(ctx, 0, .05, .028, .02, '#b34a3a', .7);
  ctx.restore();
}

/* 인물 ─ drawPerson */
function personSide(ctx, who, pose, t) {
  const R = PR[who]; if (!R) return;
  const P = pose || NOPOSE, k = R.S.H / 1.6, hu = P.hurt || 0;
  ctx.save(); ctx.scale(k, k); LWc = LW / k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (hu) { ctx.translate(.75 * hu, -.17 * hu); ctx.rotate(-hu * 1.5); }
  personBody(ctx, R, P, t || 0, false);
  ctx.restore();
}

/* ───────── 사람 앞(down)·뒤(up) — 위에서 비스듬히 내려다보는 탑뷰 게임용 (포켓몬 결: 머리 크게 · 발이 땅에) ─────────
 * 앞 = 얼굴 · 뒤 = 등과 머리 뒤. 몸틀은 옆 모습과 같은 색·옷·모자를 쓰고, 폭만 앞에서 본 크기로 다시 만든다. */
const FB = {};
function wx(q, k) { const a = new Array(q.pts.length); for (let i = 0; i < a.length; i++) a[i] = (i & 1) ? q.pts[i] : q.pts[i] * k; return mk(a, q.o); }
const DOME = [-.255, .01, -.25, -.16, -.13, -.295, .13, -.295, .25, -.16, .255, .01, .12, -.06, -.12, -.06];
const HCAP = [-.255, .07, -.275, -.1, -.2, -.245, -.1, -.295, .1, -.295, .2, -.245, .275, -.1, .255, .07, .19, .15, 0, .175, -.19, .15];
const HMESSY = [-.235, .05, -.27, -.1, -.2, -.21, -.2, -.33, -.09, -.26, -.03, -.36, .04, -.27, .13, -.34, .15, -.23, .24, -.21, .26, -.08, .24, .05, .17, -.04, .12, -.13, .04, -.08, -.04, -.14, -.12, -.08, -.17, -.04];
const HMESSYB = [-.255, .08, -.285, -.1, -.21, -.24, -.2, -.35, -.09, -.28, -.03, -.375, .04, -.29, .13, -.36, .16, -.25, .25, -.23, .285, -.1, .255, .08, .19, .16, 0, .185, -.19, .16];
function fbmk(who) {
  MS = 1;
  const R = PR[who], S = R.S, hw = S.hw * 1.5, sw = S.sw * 1.5, bl = (S.belly || 0) * 1.5, lr = S.lr * 1.2, ar = S.ar * 1.2, F = { f: [], b: [] };
  F.hw = hw; F.sw = sw; F.bl = bl;
  F.torso = mk([-hw - bl, .02, -hw - bl * .8, -.28, -sw - .01, -.5, -sw * .5, -.585, sw * .5, -.585, sw + .01, -.5, hw + bl * .8, -.28, hw + bl, .02, 0, .08], { sx: .86, sy: .9, hl: 1 });
  F.leg = limb(.56, .078 * lr, .062 * lr, { sx: .7 }); F.boot = mk([-.085, -.05, .085, -.05, .108, .02, .095, .062, -.095, .062, -.108, .02], { sx: .85, sy: .8 });
  F.arm = limb(.4, .052 * ar, .044 * ar, { sx: .7 });
  F.head = mk([-.215, -.02, -.2, -.14, -.09, -.2, .09, -.2, .2, -.14, .215, -.02, .18, .1, .08, .19, -.08, .19, -.18, .1], { hl: 1, sx: .88, sy: .86, mis: .014 });
  F.belt = mk([-hw - bl - .005, -.06, hw + bl + .005, -.06, hw + bl + .01, .0, -hw - bl - .01, .0], { poly: 1, mis: .004 });
  F.peg = mk([0, 0, 0, .5], { poly: 1, open: 1 });
  F.hook = R.hook; F.thumb = R.thumb;
  for (const k of ['skirt', 'apron', 'collar', 'vest', 'studs']) if (R[k]) F[k] = wx(R[k], 1.06);
  if (R.tun) { const len = R.tun.y1, w0 = hw + bl + .03, w1 = hw + bl + .1; F.tun = mk([-w0, -.06, w0, -.06, w1, len, -w1, len], { poly: 1, sx: .92, sy: .92 }); }
  if (R.dress) { const len = R.dress.y1, w0 = hw + .03; F.dress = mk([-w0, -.07, w0, -.07, hw + .1, len * .5, hw + .13, len, -hw - .13, len, -hw - .1, len * .5], { poly: 1, sx: .92, sy: .92 }); }
  F.bl2 = mk(circ(0, 0, .042, .062, 6), { sx: .85, sy: .85 });
  F.chain = mk([-.12, 0, -.08, .07, 0, .09, .08, .07, .12, 0, .1, -.05, -.1, -.05], { poly: 1 });
  const hair = S.hair, hornBig = mk([-.2, -.1, -.32, -.14, -.44, -.28, -.46, -.5, -.38, -.4, -.33, -.3, -.22, -.22]), nub = mk([-.22, -.14, -.31, -.27, -.2, -.25], { poly: 1 });
  const L = (q, c, m) => F.f.push([q, c, m]), B = (q, c, m) => F.b.push([q, c, m]);
  const dome = (c) => mk(DOME, { hl: 1 });
  switch (who) {
    case 'hiccup':
      L(mk(HMESSY, { poly: 1, hl: 1 }), hair); B(mk(HMESSYB, { poly: 1, hl: 1 }), hair);
      F.helmQ = [mk(DOME, { hl: 1 }), T('#8a7d70'), nub]; break;
    case 'stoick': {
      const bd = mk([-.2, .04, -.24, .18, -.14, .36, 0, .47, .14, .36, .24, .18, .2, .04, .1, .1, 0, .12, -.1, .1], { hl: 1 });
      L(mk([-.23, -.02, -.28, .08, -.23, .17, -.19, .06], { poly: 1 }), hair, 1);
      L(bd, hair); L(mk([-.14, .1, -.02, .07, .0, .13, -.11, .17], { poly: 1 }), hair, 1);
      L(hornBig, BONE, 1); L(mk(DOME, { hl: 1 }), IRON);
      B(mk(HCAP.map((v, i) => (i & 1) && v > .1 ? v + .13 : v), { hl: 1 }), hair); B(hornBig, BONE, 1); B(mk(DOME, { hl: 1 }), IRON); break; }
    case 'gobber':
      L(mk([-.2, -.03, -.29, -.1, -.28, .04, -.21, .06], { poly: 1 }), hair, 1);
      L(mk([-.03, .1, -.17, .12, -.21, .25, -.15, .32, -.12, .22, -.05, .17], { hl: 1 }), hair, 1);
      B(mk([-.21, -.02, -.17, .12, 0, .17, .17, .12, .21, -.02, .1, .0, -.1, .0], { poly: 1 }), hair); F.backSkin = 1; break;
    case 'astrid':
      L(mk([-.255, .09, -.275, -.08, -.19, -.23, -.05, -.285, .05, -.285, .19, -.23, .275, -.08, .255, .09, .2, -.02, .1, -.1, 0, -.15, -.1, -.1, -.2, -.02]), hair);
      B(mk(HCAP, { hl: 1 }), hair); F.braid = 7; F.braidSide = 1; break;
    case 'fishlegs':
      L(mk([-.215, .12, -.245, -.04, -.2, .0, -.17, .1], { poly: 1 }), hair, 1);
      L(nub, BONE, 1); L(mk([-.255, .01, -.25, -.15, -.13, -.28, .13, -.28, .25, -.15, .255, .01, .12, -.06, -.12, -.06], { hl: 1 }), T('#a49984'));
      B(mk(HCAP, { hl: 1 }), hair); B(nub, BONE, 1); B(mk(DOME, { hl: 1 }), T('#a49984')); break;
    case 'snotlout':
      L(mk(HMESSY, { poly: 1, hl: 1 }), hair); F.ram = 1; L(mk(DOME, { hl: 1 }), T('#7e7567'));
      B(mk(HMESSYB, { poly: 1, hl: 1 }), hair); B(mk(DOME, { hl: 1 }), T('#7e7567')); break;
    case 'ruffnut': case 'tuffnut': {
      const rf = who === 'ruffnut', h1 = mk([-.12, -.22, -.2, -.5, -.01, -.27], { poly: 1 }), h2 = mk([-.2, -.1, -.4, -.34, -.26, -.18], { poly: 1 });
      if (rf) L(mk([-.25, .1, -.27, -.08, -.19, -.23, -.05, -.285, .05, -.285, .19, -.23, .27, -.08, .25, .1, .2, -.0, .1, -.1, 0, -.13, -.1, -.1, -.2, -.0], { hl: 1 }), hair);
      else L(mk(HMESSY, { poly: 1, hl: 1 }), hair);
      L(h1, BONE, 1); L(h2, BONE, 1); L(mk(DOME, { hl: 1 }), T('#8e8b86'));
      B(mk(rf ? HCAP : HMESSYB, rf ? { hl: 1 } : { poly: 1, hl: 1 }), hair); B(h1, BONE, 1); B(h2, BONE, 1); B(mk(DOME, { hl: 1 }), T('#8e8b86'));
      F.braid = rf ? 6 : 4; F.braidSide = rf ? 2 : 1; F.teeth = 1; F.mad = rf ? 0 : 1; break; }
    case 'villager':
      L(mk([-.24, .05, -.27, -.1, -.2, -.24, -.1, -.28, .1, -.28, .2, -.24, .27, -.1, .24, .05, .18, -.05, 0, -.1, -.18, -.05], { hl: 1 }), hair);
      L(mk([-.255, -.06, -.23, -.2, -.1, -.29, .1, -.29, .23, -.2, .255, -.06, .1, -.1, -.1, -.1], { hl: 1 }), T('#8c6c4c'));
      B(mk(HCAP, { hl: 1 }), hair); B(mk([-.265, -.05, -.235, -.21, -.1, -.3, .1, -.3, .235, -.21, .265, -.05, .1, .02, -.1, .02], { hl: 1 }), T('#8c6c4c')); break;
    case 'villager2':
      L(mk([-.26, .14, -.275, -.05, -.19, -.23, 0, -.28, .19, -.23, .275, -.05, .26, .14, .21, -.02, .1, -.12, 0, -.15, -.1, -.12, -.21, -.02], { hl: 1 }), T('#c9634f'));
      L(mk([-.2, .06, -.25, .16, -.2, .21, -.16, .1], { poly: 1 }), hair, 1);
      B(mk(HCAP.map((v, i) => (i & 1) && v > .1 ? v + .03 : v), { hl: 1 }), T('#c9634f')); B(mk([-.06, .12, -.14, .3, -.04, .27, 0, .34, .04, .27, .14, .3, .06, .12], { poly: 1 }), T('#c9634f')); break;
    case 'elder': {
      L(mk([-.2, -.1, -.28, .02, -.25, .16, -.18, .1], { poly: 1 }), hair, 1);
      L(mk([-.2, .04, -.24, .2, -.14, .42, -.04, .66, 0, .72, .04, .66, .14, .42, .24, .2, .2, .04, .1, .1, 0, .12, -.1, .1], { hl: 1 }), hair);
      B(mk([-.2, -.1, -.28, .02, -.25, .14, -.18, .17, 0, .19, .18, .17, .25, .14, .28, .02, .2, -.1, .12, -.18, -.12, -.18], { hl: 1 }), hair); break; }
  }
  return F;
}
for (const w in PR) FB[w] = fbmk(w);

function mpaint(ctx, e) { paint(ctx, e[0], e[1]); if (e[2]) { ctx.save(); ctx.scale(-1, 1); paint(ctx, e[0], e[1]); ctx.restore(); } }
function braidF(ctx, R, F, x, y0, n, sway) {
  ctx.save(); ctx.translate(x, y0);
  for (let i = 0; i < n; i++) { ctx.translate(sway * .02, .072); ctx.save(); ctx.scale(1 - i * .04, 1 - i * .02); flat(ctx, F.bl2, i & 1 ? R.hair[0] : R.hair[1], .8); ctx.restore(); }
  ell(ctx, 0, .05, .03, .02, '#b34a3a', .7); ctx.restore();
}
function ramF(ctx, s, who) {
  ctx.save(); ctx.scale(s, 1);
  ctx.beginPath(); ctx.arc(-.31, -.08, .11, -1.2, 3.9); ctx.lineWidth = .075; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = .045; ctx.strokeStyle = BONE[1]; ctx.stroke();
  ctx.restore();
}

function faceF(ctx, R, F, P, t, hu, talk, ch, look) {
  const closed = hu || ((t * .37 + R.hs * 3.1) % 1) < .035;
  const gy = look > 0 ? -.012 * look : 0;
  for (let s = -1; s <= 1; s += 2) {
    const x = s * .085;
    if (closed) { ctx.beginPath(); ctx.moveTo(x - .032, -.005); ctx.quadraticCurveTo(x, hu ? -.04 : .018, x + .032, -.005); ctx.lineWidth = LWc * 1.1; ctx.strokeStyle = INK; ctx.stroke(); }
    else { ell(ctx, x, -.005 + gy, .031, .043, INK); ell(ctx, x + .008, -.02 + gy, .01, .011, PAPER); }
    ctx.beginPath(); ctx.strokeStyle = R.brow; ctx.lineWidth = LWc * (R.bigBrow ? 2.4 : 1.1);
    const my = F.mad ? .012 : 0, up = hu ? -.02 : ch ? -.015 : 0;
    ctx.moveTo(x - s * .04, -.075 + up + (s > 0 ? my : 0)); ctx.lineTo(x + s * .045, -.085 + up - my * (s > 0 ? 0 : -1)); ctx.stroke();
    ell(ctx, s * .125, .075, .04, .026, R.cheek);
  }
  ctx.fillStyle = '#c98e68'; ctx.beginPath(); ctx.ellipse(0, .07, .014, .01, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.strokeStyle = INK; ctx.lineWidth = LWc * 1.05;
  if (hu || ch || talk) { const op = hu ? .04 : ch ? .05 : .012 + .03 * abs(sin(t * 13.3)); ctx.beginPath(); ctx.ellipse(0, .13, .036, op, 0, 0, TAU); ctx.fillStyle = '#7d2f33'; ctx.fill(); ctx.stroke(); }
  else { ctx.moveTo(-.045, .118); ctx.quadraticCurveTo(0, .158, .045, .118); ctx.stroke(); }
  if (R.who === 'hiccup') { ctx.fillStyle = '#c98e68'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-.15 + i * .02, .05 + (i & 1) * .02, .006, 0, TAU); ctx.arc(.15 - i * .02, .05 + (i & 1) * .02, .006, 0, TAU); ctx.fill(); } }
}

function armFB(ctx, R, F, s, ang, scl, hookHand, big, thumb) {
  const S = R.S;
  ctx.save(); ctx.translate(s * (F.sw + .012), -.5); ctx.rotate(-s * ang); ctx.scale(1, scl); const lw0 = LWc;
  paint(ctx, F.arm, S.shirt); ctx.restore();
  /* 손 자리 (몸틀 기준) */
  const hx = s * (F.sw + .012) + s * sin(ang) * .4 * scl, hy = -.5 + cos(ang) * .4 * scl;
  ctx.save(); ctx.translate(hx, hy);
  if (hookHand) { ctx.translate(0, .02); thick(ctx, R.hook, '#8d949c', .04); }
  else { if (big) ctx.scale(1.3, 1.3); paint(ctx, R.hand, S.skin); if (thumb) { ctx.save(); ctx.scale(-s, 1); paint(ctx, R.thumb, S.skin); ctx.restore(); } }
  ctx.restore();
  return hx * 0 + hx;
}
let HANDX = 0, HANDY = 0;

function personFB(ctx, who, P, t, back) {
  const R = PR[who], F = FB[who]; if (!R) return;
  const S = R.S, k = S.H / 1.6, sp = P.speed || 0, air = P.air ? 1 : 0, cr = P.crouch || 0, hu = P.hurt || 0, sit = P.sit ? 1 : 0, ch = P.cheer ? 1 : 0, hand = P.hand || 0, look = P.look === undefined ? 0 : P.look, talk = P.talk ? 1 : 0;
  const carry = P.carry || (who === 'elder' ? 'staff' : null);
  const ph = (P.walk !== undefined ? P.walk : t * (.9 + 1.3 * sp)) * TAU, sn = sin(ph);
  ctx.save(); ctx.scale(k, k); LWc = LW / k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (hu) { ctx.translate(.75 * hu, -.17 * hu); ctx.rotate(-hu * 1.5); }
  const drop = cr * .2 + sit * .3 + (hu ? .05 : 0), bob = (air || hu ? 0 : -abs(sn) * .035 * (.3 + sp)) + sin(t * 1.9) * .006 * (1 - sp);
  const hs = back ? 1 : -1;                         /* 들고 있는 손 쪽 (캐릭터의 오른손 = 앞에서는 화면 왼쪽) */
  const pegS = who === 'gobber' ? hs : (P.peg && who === 'hiccup') ? -hs : 0;
  const hipY = -(.6 - drop) + bob;
  /* 다리 */
  for (let s = -1; s <= 1; s += 2) {
    const la = air ? .14 : (s > 0 ? max(0, sn) : max(0, -sn)) * .36 * sp, lenv = (.6 - drop - .044) - la, ls = max(.25, lenv / .56);
    ctx.save(); ctx.translate(s * F.hw * .55, hipY + bob * 0);
    if (air) ctx.translate(s * .06, 0);
    if (s === pegS) {
      ctx.save(); ctx.scale(1, ls); thick(ctx, F.peg, who === 'gobber' ? '#8b6a47' : '#8d949c', .05); ctx.restore(); ctx.translate(0, .5 * ls); ell(ctx, 0, .02, .07, .024, '#6a5a4a', .8);
    } else {
      ctx.save(); ctx.scale(1, ls); paint(ctx, F.leg, S.pants); ctx.restore();
      ctx.translate(0, .56 * ls); paint(ctx, F.boot, S.boots);
    }
    ctx.restore();
  }
  ctx.save(); ctx.translate(sin(ph) * .012 * sp, hipY);
  /* 옷자락 · 몸통 */
  if (F.dress) paint(ctx, F.dress, S.shirt);
  if (F.tun && !F.dress) paint(ctx, F.tun, who === 'gobber' ? S.vest : who === 'stoick' ? S.pants : S.shirt);
  if (F.skirt) { paint(ctx, F.skirt, S.vest); if (F.studs && who === 'astrid') flat(ctx, F.studs, '#a2a9b0', .7); }
  const axeB = who === 'astrid' && !carry && !hand;
  if (axeB && !back) { ctx.save(); ctx.translate(-F.sw * .55, -.3); axeBack(ctx, -.5); ctx.restore(); }
  paint(ctx, F.torso, S.shirt);
  if (axeB && back) { ctx.save(); ctx.translate(-.06, -.25); axeBack(ctx, .62); ctx.restore(); }
  if (F.vest) paint(ctx, F.vest, S.vest);
  if (F.apron) paint(ctx, F.apron, S.vest);
  if (F.tun || F.skirt || who === 'hiccup' || who === 'snotlout') flat(ctx, F.belt, '#5e4330', .8);
  if (F.collar) paint(ctx, F.collar, S.vest);
  if (F.teeth && !back) { ctx.save(); ctx.translate(0, -.5); flat(ctx, F.chain, '#f2ead4', .7); ctx.restore(); }
  /* 땋은 머리 (등 가운데 · 앞에서는 어깨 쪽) */
  if (F.braid) {
    const sw2 = sin(ph - .8) * .6 * sp;
    if (back) braidF(ctx, R, F, F.braidSide === 2 ? -.1 : 0, -.5, F.braid, sw2);
    else { braidF(ctx, R, F, (F.braidSide === 2 ? -1 : 1) * (F.sw - .02), -.5, F.braid - 1, sw2); if (F.braidSide === 2) braidF(ctx, R, F, F.sw - .02, -.5, F.braid - 1, -sw2); }
  }
  /* 팔 */
  const sx = air || ch || hu;
  for (let s = -1; s <= 1; s += 2) {
    const mine = s === hs, hookS = who === 'gobber' && s === -hs;
    let ang = .1 + (sx ? 0 : .0), scl = 1, big = 0, th = 0, it = null, itx = 0;
    if (ch) { ang = 2.5 - .2 * sin(t * 9 + s); }
    else if (hu) { ang = 1.9 + .3 * sin(t * 7 + s); }
    else if (air) { ang = 2.1; }
    else if (mine && hand) { ang = .1 + .75 * hand; scl = 1 - .3 * hand; big = hand > .3; th = hand > .3; if (!back) { ang = -.7 * hand + .1; scl = 1 - .25 * hand; } }
    else if (mine && carry) { ang = .25; scl = carry === 'staff' ? 1 : .8; it = carry; }
    else { ang = .1 + (s > 0 ? 1 : -1) * 0; scl = 1 - .08 * abs(sn) * sp * 2; ang += sn * sp * (s > 0 ? 1 : -1) * .36; }
    armFB(ctx, R, F, s, ang, scl, hookS, big, th);
    if (it && !hand) {
      ctx.save(); ctx.translate(s * (F.sw + .012) + s * sin(ang) * .4 * scl, -.5 + cos(ang) * .4 * scl);
      if (it === 'shield') ctx.translate(-s * .1, -.14); else if (it === 'book') ctx.translate(-s * .16, -.2);
      drawItem(ctx, it, t, sp); ctx.restore();
    }
  }
  /* 머리 */
  ctx.save(); ctx.translate(0, -.5 - .27 - (cr ? .0 : 0)); const hsc = R.hs; ctx.scale(hsc, hsc); const lw1 = LWc; LWc = lw1 / hsc;
  let showBack = back || look < -.45;
  if (!showBack && look > 0) ctx.translate(0, -.01 * look);
  if (hu) ctx.rotate(-.25 * hu);
  paint(ctx, F.head, showBack && !F.backSkin ? R.hair : S.skin);
  if (!showBack) {
    ctx.save(); ctx.translate(-.215, .02); paint(ctx, R.ear, S.skin); ctx.restore(); ctx.save(); ctx.translate(.215, .02); paint(ctx, R.ear, S.skin); ctx.restore();
    faceF(ctx, R, F, P, t, hu, talk, ch, look);
    for (let i = 0; i < F.f.length; i++) { const e = F.f[i]; mpaint(ctx, e); if (i === 0 && F.ram) { ramF(ctx, 1); ramF(ctx, -1); } }
    if (who === 'hiccup' && P.helmet) { paint(ctx, F.helmQ[0], F.helmQ[1]); flat(ctx, F.helmQ[2], '#eee2c6', .8); ctx.save(); ctx.scale(-1, 1); flat(ctx, F.helmQ[2], '#eee2c6', .8); ctx.restore(); }
  } else {
    for (let i = 0; i < F.b.length; i++) mpaint(ctx, F.b[i]);
    if (F.ram) { ramF(ctx, 1); ramF(ctx, -1); }
    if (who === 'hiccup' && P.helmet) paint(ctx, F.helmQ[0], F.helmQ[1]);
    if (who === 'elder' || who === 'gobber') { /* 뒤통수 비침 */ }
  }
  LWc = lw1; ctx.restore();
  ctx.restore();
  ctx.restore();
}

export function drawPerson(ctx, who, pose, t) {
  const P = pose || NOPOSE, d = P.dir || 'down'; t = t || 0;
  if (P.z) { ctx.save(); ctx.translate(0, -P.z); }
  if (d === 'side') personSide(ctx, who, P, t); else personFB(ctx, who, P, t, d === 'up');
  if (P.z) ctx.restore();
}

/* ═════════════════ 드래곤 ═════════════════ */
/* 몸 중심이 원점인 틀 안에서 만든다(땅은 y=+cy). 목·꼬리는 구부러진 띠(ribbon), 날개·머리·다리는 한 번 만든 Path2D. */
const T3 = (a, b, c) => [a, b, c];
const sgn = v => v < 0 ? -1 : 1;
function blob(hl, hh, o) {
  o = o || {}; const n = o.n || 12, pw = o.pw || .85, a = [];
  for (let i = 0; i < n; i++) {
    const th = i / n * TAU, c = cos(th), s = sin(th);
    let x = hl * sgn(c) * Math.pow(abs(c), pw), y = hh * sgn(s) * Math.pow(abs(s), pw);
    y *= x < 0 ? (o.rear || 1) : (o.front || 1); y *= y > 0 ? (o.belly || 1) : (o.back || 1);
    a.push(x * 1.04, y * 1.04);
  }
  return a;
}
/* 띠 — 스크래치 */
const RX = new Float32Array(16), RY = new Float32Array(16), RR = new Float32Array(16), OX = new Float32Array(40), OY = new Float32Array(40);
function bez(u, a, b, c, d) { const v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; }
function ribSet(n, x0, y0, x1, y1, x2, y2, x3, y3, r0, r1, rpow) {
  for (let i = 0; i < n; i++) { const u = i / (n - 1); RX[i] = bez(u, x0, x1, x2, x3); RY[i] = bez(u, y0, y1, y2, y3); RR[i] = r0 + (r1 - r0) * Math.pow(u, rpow || .8); }
}
function ribPath(ctx, n, rk, sh, ox, oy) {
  /* 윤곽점: 왼쪽(앞→끝) · 끝 · 오른쪽(끝→앞) · 시작 마개 */
  let m = 0;
  for (let i = 0; i < n; i++) {
    const a = i > 0 ? i - 1 : 0, b = i < n - 1 ? i + 1 : n - 1, dx = RX[b] - RX[a], dy = RY[b] - RY[a], l = sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l, r = RR[i] * rk;
    OX[m] = RX[i] + nx * r + ox; OY[m] = RY[i] + ny * r - RR[i] * sh + oy; m++;
  }
  { const a = n - 2, b = n - 1, dx = RX[b] - RX[a], dy = RY[b] - RY[a], l = sqrt(dx * dx + dy * dy) || 1; OX[m] = RX[b] + dx / l * RR[b] * rk * 1.1 + ox; OY[m] = RY[b] + dy / l * RR[b] * rk * 1.1 - RR[b] * sh + oy; m++; }
  for (let i = n - 1; i >= 0; i--) {
    const a = i > 0 ? i - 1 : 0, b = i < n - 1 ? i + 1 : n - 1, dx = RX[b] - RX[a], dy = RY[b] - RY[a], l = sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l, r = RR[i] * rk;
    OX[m] = RX[i] - nx * r + ox; OY[m] = RY[i] - ny * r - RR[i] * sh + oy; m++;
  }
  { const dx = RX[1] - RX[0], dy = RY[1] - RY[0], l = sqrt(dx * dx + dy * dy) || 1; OX[m] = RX[0] - dx / l * RR[0] * rk * .9 + ox; OY[m] = RY[0] - dy / l * RR[0] * rk * .9 - RR[0] * sh + oy; m++; }
  ctx.beginPath(); ctx.moveTo((OX[m - 1] + OX[0]) / 2, (OY[m - 1] + OY[0]) / 2);
  for (let i = 0; i < m; i++) { const j = (i + 1) % m; ctx.quadraticCurveTo(OX[i], OY[i], (OX[i] + OX[j]) / 2, (OY[i] + OY[j]) / 2); }
  ctx.closePath();
}
function ribbon(ctx, n, c, mis, wm) {
  ribPath(ctx, n, 1, 0, mis, -mis * .6); ctx.fillStyle = c[0]; ctx.fill();
  ribPath(ctx, n, .8, .24, mis, -mis * .6); ctx.fillStyle = c[1]; ctx.fill();
  ribPath(ctx, n, 1, 0, 0, 0); ctx.lineWidth = LWc * (wm || 1); ctx.strokeStyle = INK; ctx.stroke();
}

/* 날개 — 어깨가 원점, 위(−y)로 뻗는 모양. 막 · 뼈(손가락) */
function wrapPath(p, x0, y0, x1, y1, o) {
  o = o || {}; const id = ++PID, ma = min(.04 * MS, max(.006, min(x1 - x0, y1 - y0) * .05));
  return { p, x0, y0, x1, y1, mx: (hz(id * 7 + 1) - .5) * 2 * ma, my: (hz(id * 7 + 2) - .5) * 2 * ma, w: .95 + .2 * hz(id * 5 + 3),
    ax: x0 + (x1 - x0) * .5, ay: y0 + (y1 - y0) * .55, sx: o.sx || .9, sy: o.sy || .88, hl: 0 };
}
function mkWing(L, tips) {
  tips = tips || [[-.4, -1.2], [-.86, -1.0], [-1.14, -.62], [-1.0, -.24]];
  const p = new Path2D(), fp = new Path2D(), wr = [.07 * L, -.9 * L], rear = [-.5 * L, .03 * L];
  p.moveTo(0, 0); p.lineTo(wr[0], wr[1]);
  fp.moveTo(0, 0); fp.lineTo(wr[0], wr[1]);
  for (let i = 0; i < tips.length; i++) {
    const tx = tips[i][0] * L, ty = tips[i][1] * L;
    p.lineTo(tx, ty); fp.moveTo(wr[0], wr[1]); fp.lineTo(tx, ty);
    const nx = i + 1 < tips.length ? tips[i + 1][0] * L : rear[0], ny = i + 1 < tips.length ? tips[i + 1][1] * L : rear[1];
    const mx = (tx + nx) / 2, my = (ty + ny) / 2;
    p.quadraticCurveTo(mx + (wr[0] - mx) * .5, my + (wr[1] - my) * .5, nx, ny);
  }
  p.closePath();
  return { mem: wrapPath(p, -1.2 * L, -1.2 * L, .1 * L, 0), bones: wrapPath(fp, -1.2 * L, -1.2 * L, .1 * L, 0), L, wr };
}
const HOLE = [[-.5, -.62, .07, .3], [-.85, -.42, .06, -.2], [-.3, -.4, .045, 0], [-.68, -.2, .05, .5], [-.55, -.82, .05, 0], [-.95, -.62, .045, 0], [-.18, -.62, .04, 0], [-.4, -.2, .04, 0]];
function wingDraw(ctx, W, wx, wy, ang, sc, col, boneCol, holes) {
  ctx.save(); ctx.translate(wx, wy); ctx.rotate(ang); ctx.scale(sc, sc);
  const lw0 = LWc; LWc = lw0 / sc;
  if (holes) {
    /* 구멍 뚫린 막: 구멍 도형을 같은 길에 더해 evenodd로 비운다 (뒤 그림이 비쳐 보임) */
    const p = new Path2D(); p.addPath(W.mem.p);
    for (let i = 0; i < holes; i++) { const u = HOLE[i], L = W.L; p.moveTo(u[0] * L + u[2] * L, u[1] * L); p.ellipse(u[0] * L, u[1] * L, u[2] * L, u[2] * L * .8, u[3], 0, TAU); }
    ctx.save(); ctx.translate(W.mem.mx, W.mem.my); ctx.fillStyle = col[0]; ctx.fill(p, 'evenodd'); ctx.restore();
    ctx.save(); ctx.translate(W.mem.ax, W.mem.ay); ctx.scale(.93, .9); ctx.translate(-W.mem.ax + W.mem.mx, -W.mem.ay + W.mem.my); ctx.fillStyle = col[1]; ctx.fill(p, 'evenodd'); ctx.restore();
    ctx.lineWidth = LWc * W.mem.w; ctx.strokeStyle = INK; ctx.stroke(p);
  } else paint(ctx, W.mem, col);
  ctx.lineWidth = LWc * .9; ctx.strokeStyle = INK; ctx.stroke(W.bones.p);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W.wr[0], W.wr[1]);
  ctx.lineWidth = LWc * 4.4; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = LWc * 2.4; ctx.strokeStyle = boneCol; ctx.stroke();
  LWc = lw0; ctx.restore();
}

/* 발 */
function mkPaw(s) { return mk([-.1 * s, -.05 * s, .07 * s, -.07 * s, .2 * s, -.03 * s, .24 * s, .05 * s, .12 * s, .1 * s, -.1 * s, .08 * s], { sx: .8, sy: .78 }); }

/* 입 안 색 (불 뿜기 예고 = 안쪽이 따뜻해짐 · 번쩍임 없이 납작한 색) */
const CAVC = [T('#7c2f3b', .2, .1), T('#a8453a', .2, .1), T('#e17c33', .2, .1), T('#f2a446', .2, .1)];
const GLOWIN = '#ffd467';
const TONG = T('#e58a98'); const GUM = '#e08b98';
const TEETH = '#f6efdc';

/* 머리 틀 (머리 뿌리가 원점, +x가 앞) */
function mkHeadRig(h) {
  const r = { h, sk: mk(h.sk, { hl: 1, sx: .88, sy: .86, j: .008 }), jw: mk(h.jw, { sx: .88, sy: .85, j: .008 }), cav: mk(h.cav, { j: .004 }), dec: [] };
  r.cav2 = mk(h.cav.map((v, i) => (i & 1) ? v * .55 + h.cav[1] * .45 : v * .55 + h.cav[0] * .45 + h.eye[0] * .2), { j: .004 });
  for (const d of (h.dec || [])) r.dec.push({ q: mk(d.pts, { poly: d.poly === undefined ? 1 : d.poly, hl: d.hl, j: .006 }), col: d.col, pv: d.pv, ear: d.ear, back: d.back, far: d.far, r0: d.r0, r1: d.r1, tellS: d.tellS });
  r.tongue = mk([0, 0, .1, -.04, .22, -.02, .2, .1, .08, .12], { j: .004 });
  r.ln = h.lip ? mk([h.lip[0], h.lip[1], (h.lip[0] + h.lip[2]) / 2, h.lip[3] + .03, h.lip[2], h.lip[3]], { open: 1, j: .003 }) : null;
  r.tU = h.teethU ? mk(h.teethU, { poly: 1, open: 1, j: .002 }) : null; r.tL = h.teethL ? mk(h.teethL, { poly: 1, open: 1, j: .002 }) : null;
  return r;
}
function tri(x, y, w, hgt) { return [x - w, y, x, y - hgt, x + w, y]; }
const HEAD = {};
HEAD.toothless = {
  sk: [-.12, -.02, -.1, -.28, .08, -.42, .32, -.4, .55, -.24, .74, -.06, .78, .05, .64, .14, .4, .17, .1, .17, -.1, .14],
  jw: [-.08, .1, .18, .14, .5, .15, .7, .12, .72, .22, .52, .35, .2, .39, -.05, .3], hinge: [0, .2], open: .6,
  cav: [0, .06, .72, .08, .7, .3, 0, .34], eye: [.38, -.12, .15, .18], nos: [.69, -.01], lip: [.76, .11, .15, .15],
  teethU: [.46, .15, .5, .24, .54, .15, .6, .15, .64, .24, .68, .15], teethL: [.46, .15, .5, .06, .55, .15, .6, .15, .65, .07, .69, .14],
  dec: [
    { pts: [-.07, .02, -.06, -.2, 0, -.5, .07, -.2, .08, .02], pv: [.0, -.34], ear: 1, r0: -1.55, r1: .12, col: 'body', far: 1 },
    { pts: [-.07, .02, -.06, -.2, 0, -.5, .07, -.2, .08, .02], pv: [.09, -.37], ear: 1, r0: -1.35, r1: .3, col: 'body' }],
};
HEAD.nadder = {
  sk: [-.1, -.05, -.04, -.2, .22, -.27, .6, -.2, 1.0, -.08, 1.3, .0, 1.28, .05, .95, .09, .5, .12, .1, .12, -.08, .08],
  jw: [-.02, .08, .5, .1, .95, .07, 1.15, .07, 1.0, .15, .5, .22, .12, .24, -.03, .17], hinge: [0, .15], open: .5,
  cav: [0, .05, 1.2, .06, 1.0, .2, 0, .22], eye: [.46, -.1, .07, .09], nos: [1.2, -.02], lip: [1.26, .05, .2, .1],
  teethU: [.8, .1, .84, .17, .88, .1, .98, .09, 1.02, .16, 1.06, .08], teethL: [.82, .09, .86, .03, .9, .09, 1, .08, 1.04, .03, 1.08, .07],
  dec: [{ pts: [-.08, 0, -.2, -.28, .04, -.05], pv: [.05, -.2], ear: 1, r0: -1.2, r1: -.2, col: 'crest' },
    { pts: tri(.15, -.22, .06, .22), pv: [0, 0], col: 'crest', tellS: 1 }, { pts: tri(.33, -.24, .06, .2), pv: [0, 0], col: 'crest', tellS: 1 }, { pts: tri(.5, -.22, .05, .16), pv: [0, 0], col: 'crest', tellS: 1 }],
};
HEAD.gronckle = {
  sk: [-.3, -.05, -.2, -.4, .1, -.55, .5, -.47, .78, -.25, .9, -.03, .8, .1, .45, .14, 0, .15, -.3, .1],
  jw: [-.2, .1, .35, .12, .8, .1, .9, .2, .78, .4, .4, .54, -.05, .52, -.25, .32], hinge: [-.05, .22], open: .45,
  cav: [-.1, .06, .85, .08, .8, .38, -.1, .42], eye: [.46, -.27, .065, .075], nos: [.84, -.04], lip: [.9, .12, .1, .2],
  teethU: [.55, .13, .59, .21, .63, .13, .72, .12, .76, .2, .8, .11], teethL: [.55, .14, .59, .07, .63, .14, .72, .12, .76, .05, .8, .12],
  dec: [{ pts: [.1, -.5, .16, -.62, .24, -.5], pv: [0, 0], col: 'spike' }, { pts: [.32, -.47, .38, -.6, .46, -.46], pv: [0, 0], col: 'spike' }],
};
HEAD.nightmare = {
  sk: [-.18, -.1, 0, -.36, .45, -.44, 1.0, -.28, 1.5, -.09, 1.72, .03, 1.5, .14, .9, .18, .25, .18, -.1, .1],
  jw: [0, .1, .6, .16, 1.2, .15, 1.55, .1, 1.3, .26, .8, .38, .25, .43, -.05, .3], hinge: [0, .22], open: .55,
  cav: [0, .06, 1.62, .08, 1.4, .28, 0, .38], eye: [.72, -.18, .1, .115], nos: [1.62, 0], lip: [1.7, .12, .25, .2],
  teethU: [.95, .16, 1, .25, 1.05, .16, 1.2, .15, 1.25, .25, 1.3, .14, 1.45, .13, 1.49, .21, 1.53, .12], teethL: [1, .15, 1.05, .05, 1.1, .15, 1.25, .14, 1.3, .04, 1.35, .13],
  dec: [{ pts: [-.1, -.2, -.5, -.55, -.9, -.5, -.45, -.4, -.05, -.05], pv: [.1, -.1], ear: 1, r0: -.3, r1: .05, col: 'horn' },
    { pts: [-.1, -.2, -.45, -.62, -.8, -.62, -.4, -.45, -.05, -.05], pv: [.3, -.3], ear: 1, r0: -.1, r1: .1, col: 'horn', far: 1 },
    { pts: tri(.45, -.43, .08, .2), pv: [0, 0], col: 'horn' }, { pts: tri(.8, -.34, .07, .16), pv: [0, 0], col: 'horn' }],
};
HEAD.zippleback = {
  sk: [-.1, -.03, -.05, -.2, .2, -.3, .55, -.25, .85, -.1, 1.02, .02, .95, .09, .6, .13, .15, .13, -.08, .09],
  jw: [-.02, .08, .45, .11, .9, .09, 1, .14, .85, .26, .45, .33, .1, .33, -.04, .2], hinge: [0, .16], open: .5,
  cav: [0, .05, .95, .06, .85, .26, 0, .3], eye: [.46, -.12, .085, .1], nos: [.96, -.01], lip: [1.0, .08, .2, .13],
  teethU: [.55, .12, .59, .2, .63, .12, .75, .11, .79, .19, .83, .1], teethL: [.55, .12, .6, .05, .65, .12, .75, .11, .8, .05, .85, .1],
  dec: [{ pts: [-.05, -.05, -.18, -.35, .05, -.2], pv: [.05, -.12], ear: 1, r0: -1.0, r1: -.1, col: 'spike' }, { pts: tri(.25, -.27, .05, .14), pv: [0, 0], col: 'spike' }],
};
HEAD.terror = {
  sk: [-.03, -.02, -.01, -.13, .09, -.21, .22, -.19, .31, -.07, .34, .03, .25, .07, .08, .08],
  jw: [0, .05, .2, .06, .32, .05, .3, .12, .18, .17, .04, .15], hinge: [0, .09], open: .6,
  cav: [0, .03, .32, .04, .3, .13, 0, .15], eye: [.17, -.08, .065, .075], nos: [.3, 0], lip: [.33, .07, .08, .09],
  teethU: [.2, .06, .22, .1, .24, .06], teethL: [.2, .06, .22, .03, .24, .06],
  dec: [{ pts: [-.02, 0, -.05, -.2, .03, -.02], pv: [.06, -.17], ear: 1, r0: -1.1, r1: -.1, col: 'body' }, { pts: tri(.2, -.2, .03, .08), pv: [0, 0], col: 'spike' }],
};
HEAD.scauldron = {
  sk: [-.15, -.03, -.1, -.25, .2, -.34, .6, -.28, 1.0, -.12, 1.3, .0, 1.25, .08, .9, .13, .4, .16, .05, .15, -.12, .1],
  jw: [-.05, .1, .5, .13, 1.0, .1, 1.2, .12, 1.0, .24, .5, .32, .1, .34, -.08, .22], hinge: [0, .2], open: .5,
  cav: [0, .06, 1.2, .08, 1.0, .22, 0, .3], eye: [.5, -.13, .1, .12], nos: [1.2, 0], lip: [1.25, .09, .2, .14],
  teethU: [.8, .12, .84, .2, .88, .12, .98, .11, 1.02, .19, 1.06, .1], teethL: [.82, .11, .86, .05, .9, .11, 1, .1, 1.04, .04, 1.08, .09],
  dec: [{ pts: [-.1, -.1, -.4, -.45, -.5, -.3, -.3, -.1, -.1, 0], pv: [.1, -.2], ear: 1, r0: -1.0, r1: -.15, col: 'fin' },
    { pts: [1.18, .1, 1.3, .32, 1.1, .2], pv: [0, 0], col: 'fin' }],
};

/* 종마다 틀 (nk/tl 숫자 = 목: 뿌리x,y, 머리뿌리x,y, 조절점1(dx,dy), 조절점2(dx,dy), 굵기 시작·끝 / 꼬리: 같은 순서 + 흔들림) */
const DK = {
  toothless: { lw: .05, ms: 2.2, cy: 1.02, hl: .9, hh: .6, hs: 1.3, bo: { rear: .85 }, flapHz: 1.2, flapBase: -1.0, flapAmp: 1.15,
    col: { body: T3('#22232c', '#383a47', '#565a6d'), belly: '#4a4d5d', wing: T3('#2a2a34', '#42404f', '#5f5c70'), bone: '#2f2f3a', spike: T3('#1e1f27', '#30323e', '#4b4e60'), crest: T3('#1e1f27', '#30323e', '#4b4e60'), iris: ['#b6dc47', '#6b9a25'] },
    legs: [[.52, .3, 1, 1], [-.58, .32, 0, 1], [.38, .3, 1, 0], [-.44, .32, 0, 0]], legLen: .62, lr: [.18, .13, .23],
    nk: [.6, -.25, 1.12, -.28, .3, -.3, -.35, .05, .4, .34], tl: [-.8, -.1, -2.35, .1, -.6, .3, .6, -.3, .36, .08, .18], wg: [-.12, -.55, 2.3],
    saddle: [.34, -.62], head: 'toothless', ha: .1, plates: [6, .6, -.85, .11], paw: 1, tailEnd: 'fin' },
  nadder: { lw: .045, ms: 2, cy: 1.35, hl: .85, hh: .55, hs: 1.15, bo: { rear: .9, front: .95 }, flapHz: 1.5, flapBase: -1.0, flapAmp: 1.0,
    col: { body: T3('#33579a', '#4d78bb', '#7aa0d6'), belly: '#ecc562', wing: T3('#5f4a9a', '#7a65b4', '#a090d0'), bone: '#3b3270', spike: T3('#c9792a', '#ee9f3c', '#ffcb6a'), crest: T3('#c9792a', '#ee9f3c', '#ffcb6a'), iris: ['#f1e45a', '#a5921c'] },
    legs: [[0, .32, 1, 1], [-.14, .32, 0, 0]], legLen: .88, lr: [.26, .15, .24],
    nk: [.6, -.28, 1.18, -1.0, .45, -.6, -.6, .25, .26, .17], tl: [-.8, -.08, -2.7, -.9, -.8, .5, .6, .35, .22, .05, .25], wg: [-.08, -.42, 1.5],
    saddle: [.2, -.5], head: 'nadder', ha: .3, plates: [5, .5, -.7, .12], paw: 1, tailEnd: 'spikes' },
  gronckle: { lw: .045, ms: 2, cy: .96, hl: .95, hh: .82, hs: 1.1, bo: { pw: .95 }, flapHz: 3.2, flapBase: -.8, flapAmp: .75,
    col: { body: T3('#8a6a3d', '#ad8a55', '#d0b27c'), belly: '#d8c08c', wing: T3('#9a7a4a', '#bd9a62', '#dcc088'), bone: '#6d5230', spike: T3('#7a5c34', '#98774a', '#bb9a68'), crest: T3('#7a5c34', '#98774a', '#bb9a68'), iris: ['#f0d04a', '#a3841c'] },
    legs: [[.48, .55, 1, 1], [-.5, .55, 0, 1], [.3, .55, 1, 0], [-.3, .55, 0, 0]], legLen: .3, lr: [.2, .15, .2],
    nk: [.6, .1, 1.0, .25, .2, 0, -.1, 0, .5, .46], tl: [-.9, .25, -1.85, .55, -.45, .25, .45, 0, .2, .1, .05], wg: [-.08, -.74, 1.05],
    saddle: [.15, -.78], head: 'gronckle', ha: .1, plates: [0, 0, 0, 0], paw: 1.2, tailEnd: 'club', lumps: 1 },
  nightmare: { lw: .055, ms: 3, cy: 1.6, hl: 1.45, hh: .88, hs: 1.2, bo: { rear: .85 }, flapHz: .9, flapBase: -1.0, flapAmp: 1.1,
    col: { body: T3('#8a2f26', '#bd4a3a', '#e07a60'), belly: '#e9a24a', wing: T3('#9c3329', '#c85a42', '#e8906c'), bone: '#6a2018', spike: T3('#b99a62', '#e7d6a6', '#fff0c8'), crest: T3('#b99a62', '#e7d6a6', '#fff0c8'), horn: T3('#b99a62', '#e7d6a6', '#fff0c8'), iris: ['#f3c94a', '#a2761b'] },
    legs: [[.95, .5, 1, 1], [-.95, .55, 0, 1], [.75, .5, 1, 0], [-.75, .55, 0, 0]], legLen: .78, lr: [.26, .17, .3],
    nk: [1.2, -.3, 2.55, -1.2, .8, -.6, -.9, .1, .46, .32], tl: [-1.35, -.1, -4.0, .55, -1.2, .5, 1.0, -.5, .5, .08, .4], wg: [-.2, -.78, 3.7],
    saddle: [.7, -.84], head: 'nightmare', ha: .18, plates: [8, 1.1, -1.2, .2], paw: 1.5, tailEnd: 'spade', flames: 1 },
  zippleback: { lw: .05, ms: 2.4, cy: 1.0, hl: 1.35, hh: .55, hs: 1.15, bo: { rear: .9 }, flapHz: 1.3, flapBase: -1.0, flapAmp: 1.0,
    col: { body: T3('#5d8a3c', '#7fae56', '#a8d07e'), belly: '#ead998', stripe: '#e1b84a', wing: T3('#6f9b45', '#90bb62', '#b4d88a'), bone: '#476a2a', spike: T3('#c78d2c', '#e8b23f', '#ffd678'), crest: T3('#c78d2c', '#e8b23f', '#ffd678'), iris: ['#ffd84a', '#b08a10'] },
    legs: [[.85, .26, 1, 1], [-.9, .28, 0, 1], [.65, .26, 1, 0], [-.7, .28, 0, 0]], legLen: .62, lr: [.17, .12, .2],
    nk: [1.15, -.2, 2.35, -1.0, .35, -.35, -.5, .3, .26, .17], tl: [-1.3, 0, -2.9, .25, -.7, .25, .6, -.3, .34, .08, .12], wg: [-.1, -.46, 2.1],
    saddle: [.6, -.5], head: 'zippleback', ha: .1, plates: [7, 1.0, -1.1, .13], paw: 1, tailEnd: 'split', two: [2.55, -.35, .3, -.2, -.5, .0, .22, .14] },
  terror: { lw: .022, ms: .25, cy: .24, hl: .24, hh: .14, hs: 1.4, bo: { rear: .85 }, flapHz: 3.5, flapBase: -.9, flapAmp: .9,
    col: { body: T3('#4f8a3a', '#6cae4f', '#95d076'), belly: '#f0d27a', wing: T3('#6a9f4a', '#8dc062', '#b2dd88'), bone: '#3f6a2a', spike: T3('#c99a38', '#e9bf4e', '#ffe084'), crest: T3('#c99a38', '#e9bf4e', '#ffe084'), iris: ['#ffe05a', '#b3951b'] },
    legs: [[.14, .08, 1, 1], [-.12, .09, 0, 1], [.06, .08, 1, 0], [-.06, .09, 0, 0]], legLen: .12, lr: [.04, .03, .05],
    nk: [.18, -.04, .3, -.14, .1, -.06, -.05, .05, .08, .06], tl: [-.2, 0, -.7, .1, -.2, .1, .15, -.1, .07, .015, .05], wg: [-.02, -.1, .4],
    saddle: [0, -.14], head: 'terror', ha: .05, plates: [0, 0, 0, 0], paw: .3, tailEnd: 'tip', puff: 1 },
  scauldron: { lw: .05, ms: 2.2, cy: .95, hl: 1.1, hh: .58, hs: 1.15, bo: { rear: .9 }, flapHz: 1, flapBase: -1.0, flapAmp: 1.0,
    col: { body: T3('#2f6f93', '#4a8fb2', '#7ab8d4'), belly: '#e9e2bf', wing: T3('#4c93b7', '#76b8d6', '#a6d6e8'), bone: '#2a6280', spike: T3('#3a84a8', '#68b0cc', '#a0d4e6'), crest: T3('#3a84a8', '#68b0cc', '#a0d4e6'), fin: T3('#3a84a8', '#68b0cc', '#a0d4e6'), iris: ['#f1e65a', '#b3a21a'] },
    legs: [[.62, .28, 1, 1], [-.68, .3, 0, 1], [.48, .28, 1, 0], [-.52, .3, 0, 0]], legLen: .52, lr: [.17, .12, .2],
    nk: [.92, -.18, 1.92, -.85, .35, -.4, -.5, .2, .3, .2], tl: [-1.0, 0, -2.6, .3, -.6, .3, .6, -.3, .34, .08, .12], wg: [-.1, -.45, 1.7],
    saddle: [.45, -.5], head: 'scauldron', ha: .15, plates: [6, .75, -.85, .14], paw: 1, tailEnd: 'fan' },
};

/* 틀 만들기 (한 번만) */
const DR = {};
function mkDragon(kind) {
  const S = DK[kind]; MS = S.ms;
  const R = { S, kind, head: mkHeadRig(HEAD[S.head]) };
  R.body = mk(blob(S.hl, S.hh, S.bo), { hl: 1, sx: .9, sy: .84, j: .008 });
  R.belly = mk(blob(S.hl * .98, S.hh * .5, { n: 10 }).map((v, i) => (i & 1) ? v + S.hh * .72 : v), { j: .004 });
  R.leg = []; for (let i = 0; i < 3; i++) R.leg.push(limb(S.legLen, S.lr[0 + (i === 2 ? 2 : 0)], S.lr[1], { sx: .66, sy: .97 }));
  R.legF = limb(S.legLen, S.lr[0], S.lr[1]); R.legR = limb(S.legLen, S.lr[2], S.lr[1]);
  R.paw = mkPaw(S.paw * (S.hl > 1 ? 1.2 : 1) * (S.cy < .5 ? 1 : S.cy < 1 ? 1 : 1.1));
  R.wing = mkWing(S.wg[2]);
  R.claw = mk([.15, .07, .24, .14, .17, .12], { poly: 1, j: .001 });
  R.plate = mk(tri(0, 0, 1, 1.5), { poly: 1, j: .0005 });
  R.fin1 = mk([0, .02, .3, -.38, .75, -.58, 1.2, -.5, .85, -.24, .45, -.05], { sx: .86, sy: .8 }); R.fin2 = mk([0, -.02, .3, .38, .75, .58, 1.2, .5, .85, .24, .45, .05], { sx: .86, sy: .8 });
  R.burn = mk([0, 0, .25, .32, .42, .1, .62, .4, .7, .12, .92, .3, .72, -.06, .3, -.12], { poly: 1 });
  R.club = mk(circ(0, 0, .3, .26, 9), { hl: 1 }); R.spk = mk([0, 0, .1, -.4, .2, 0], { poly: 1, j: .001 });
  R.lump = mk(circ(0, 0, .12, .09, 6), { sx: .8, sy: .8 });
  R.saddleQ = mk([-.32, 0, -.3, -.1, .05, -.14, .3, -.1, .32, 0, .1, .06, -.15, .06], { sx: .9, sy: .8 });
  return R;
}
for (const k in DK) DR[k] = mkDragon(k);

/* ───────── 드래곤 그리기 ───────── */
for (const k in DR) {
  const R = DR[k], S = R.S, c = S.col; MS = S.ms;
  R.farBody = FAR(c.body); R.farWing = FAR(c.wing); R.seed = hz(k.length * 17 + k.charCodeAt(0));
  for (const d of R.head.dec) { const base = d.col === 'body' ? c.body : c[d.col]; d.cT = base; d.cF = FAR(base); }
  R.claw = mk([.15 * S.paw, .06 * S.paw, .27 * S.paw, .12 * S.paw, .21 * S.paw, .15 * S.paw, .16 * S.paw, .11 * S.paw], { poly: 1, j: .001 });
}
const FINNEW = T('#a9623b'), FINBURN = T('#3d3736', .1, .12), ASH = '#8d8683';
const HO = { mouth: 0, glow: 0, smile: 0, pupil: .6, ears: .3, dz: 0, tell: 0, eat: 0, blink: 0, t: 0, gas: 0 };
const RP = { look: .15, speed: 0 };
const RIDERS = { hiccup: [['hiccup', 0]], 'hiccup+astrid': [['astrid', -.5], ['hiccup', 0]], astrid: [['astrid', 0]], fishlegs: [['fishlegs', 0]], snotlout: [['snotlout', 0]], twins: [['tuffnut', -.5], ['ruffnut', 0]] };
const SADDLE = T('#8a5a3c');

function dEye(ctx, S, x, y, rx, ry, pupil, dz, t, blink) {
  if (blink) { ctx.beginPath(); ctx.moveTo(x - rx, y); ctx.quadraticCurveTo(x, y + ry * .8, x + rx, y); ctx.lineWidth = LWc * 1.1; ctx.strokeStyle = INK; ctx.stroke(); return; }
  if (dz) {
    ell(ctx, x, y, rx, ry, PAPER, 1);
    ctx.beginPath(); for (let i = 0; i <= 22; i++) { const th = i * .62 + t * 6, r = i / 22 * .88, px = x + cos(th) * rx * r, py = y + sin(th) * ry * r; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.lineWidth = LWc * .75; ctx.strokeStyle = INK; ctx.stroke(); return;
  }
  const ir = S.col.iris;
  ell(ctx, x, y, rx, ry, ir[1], 1);
  ell(ctx, x - rx * .04, y - ry * .08, rx * .86, ry * .82, ir[0]);
  ctx.beginPath(); ctx.ellipse(x + rx * .04, y, max(rx * (.1 + .62 * pupil), .006), ry * .86, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  ell(ctx, x - rx * .3, y - ry * .38, max(rx * .2, .008), max(rx * .2, .008), PAPER);
}

function dDec(ctx, d, o) {
  ctx.save(); ctx.translate(d.pv[0], d.pv[1]);
  if (d.ear) ctx.rotate(d.r0 + (d.r1 - d.r0) * (o.ears + 1) * .5);
  else if (d.tellS) ctx.scale(1, 1 + o.tell * 1.15);
  paint(ctx, d.q, d.far ? d.cF : d.cT); ctx.restore();
}

/* 머리 (뿌리가 원점 · 앞이 +x) */
function dHead(ctx, R, o) {
  const h = R.head, H = h.h, S = R.S, c = S.col, body = c.body, op = o.mouth * H.open;
  for (let i = 0; i < h.dec.length; i++) { const d = h.dec[i]; if (d.far) dDec(ctx, d, o); }
  if (op > .03 || o.glow > .1) {
    const lv = o.glow < .12 ? 0 : o.glow < .4 ? 1 : o.glow < .75 ? 2 : 3;
    flat(ctx, h.cav, CAVC[lv][1], .7); if (lv > 1) fillOnly(ctx, h.cav2, lv === 3 ? GLOWIN : CAVC[3][1]);
    if (o.dz) { ctx.save(); ctx.translate(H.hinge[0] + (H.lip[0] - H.hinge[0]) * .6, H.hinge[1] + .1); ctx.scale(H.lip[0] * .45, H.lip[0] * .5); const lw0 = LWc; LWc = lw0 / (H.lip[0] * .45); paint(ctx, h.tongue, TONG, .8); LWc = lw0; ctx.restore(); }
  }
  ctx.save(); ctx.translate(H.hinge[0], H.hinge[1]); ctx.rotate(op); ctx.translate(-H.hinge[0], -H.hinge[1]);
  paint(ctx, h.jw, body);
  if (op > .08 && o.smile < .5 && h.tL) flat(ctx, h.tL, TEETH, .55);
  ctx.restore();
  if (op > .08) { if (o.smile < .5 && h.tU) flat(ctx, h.tU, TEETH, .55); else if (o.smile >= .5) { ctx.beginPath(); ctx.moveTo(H.eye[0] + .1, H.lip[1] + .02); ctx.quadraticCurveTo(H.lip[0] * .8, H.lip[1] + .09, H.lip[0] * .96, H.lip[1] + .005); ctx.lineWidth = LWc * 3.2; ctx.strokeStyle = GUM; ctx.stroke(); } }
  paint(ctx, h.sk, body);
  /* 눈 · 눈썹 · 콧구멍 */
  const e = H.eye; dEye(ctx, S, e[0], e[1], e[2], e[3], o.pupil, o.dz, o.t, o.blink);
  ctx.beginPath(); { const dl = (.5 - o.pupil) * .8 * e[3] * (e[2] > .12 ? 1 : .6); ctx.moveTo(e[0] - e[2] * 1.15, e[1] - e[3] * 1.18 - dl * .6); ctx.lineTo(e[0] + e[2] * 1.15, e[1] - e[3] * 1.18 + dl); }
  ctx.lineWidth = LWc * 1.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(H.nos[0], H.nos[1], .018 * (S.hl + .4), .012 * (S.hl + .4), -.3, 0, TAU); ctx.fillStyle = INK; ctx.fill();
  if (op <= .05) {                       /* 닫힌 입 선 — 웃음이면 뒤끝이 올라감 */
    ctx.beginPath(); ctx.moveTo(H.lip[0], H.lip[1]); ctx.quadraticCurveTo((H.lip[0] + H.lip[2]) / 2, (H.lip[1] + H.lip[3]) / 2 + .03 + .025 * o.smile, H.lip[2], H.lip[3] - o.smile * .13);
    ctx.lineWidth = LWc * 1.1; ctx.strokeStyle = INK; ctx.stroke();
  }
  if (o.eat) {                            /* 입에 문 물고기: 꼬리가 삐죽 */
    const fx = H.lip[0], fy = H.lip[1] + .06;
    ctx.beginPath(); ctx.moveTo(fx - .1, fy - .04); ctx.lineTo(fx + .06, fy - .04); ctx.lineTo(fx + .2, fy - .16); ctx.lineTo(fx + .15, fy + .02); ctx.lineTo(fx + .22, fy + .15); ctx.lineTo(fx + .05, fy + .06); ctx.lineTo(fx - .1, fy + .06); ctx.closePath();
    ctx.fillStyle = '#9fb7c3'; ctx.fill(); ctx.lineWidth = LWc * .9; ctx.strokeStyle = INK; ctx.stroke();
  }
  for (let i = 0; i < h.dec.length; i++) { const d = h.dec[i]; if (!d.far) dDec(ctx, d, o); }
  if (S.head === 'gronckle' && o.tell > 0) {            /* 볼 부풂 */
    const r = .12 + .3 * o.tell; ell(ctx, .52, .26, r * 1.15, r, c.belly, 1.1);
  }
}

function dLeg(ctx, R, L, ang, scl, far) {
  const S = R.S, col = far ? R.farBody : S.col.body, q = L[2] ? R.legF : R.legR;
  ctx.save(); ctx.translate(L[0], L[1]); ctx.rotate(ang);
  if (scl !== 1) { ctx.save(); ctx.scale(1, scl); paint(ctx, q, col); ctx.restore(); } else paint(ctx, q, col);
  ctx.translate(0, S.legLen * scl); ctx.rotate(-ang * .85);
  paint(ctx, R.paw, col); flat(ctx, R.claw, '#efe4c8', .6);
  ctx.restore();
}

function tailEnd(ctx, R, P, t, tell) {
  const S = R.S, k = S.tailEnd, lw0 = LWc;
  switch (k) {
    case 'fin': {
      ctx.save(); ctx.translate(-.1, 0);
      const sc = 1.1, f = P.fin || 'none'; LWc = lw0 / sc;
      ctx.save(); ctx.rotate(-.05); ctx.scale(sc, sc); paint(ctx, R.fin1, S.col.body); ctx.restore();
      if (f === 'new') {
        ctx.save(); ctx.rotate(.05); ctx.scale(sc, sc); paint(ctx, R.fin2, FINNEW);
        ctx.lineWidth = LWc * .8; ctx.strokeStyle = '#5a3320'; ctx.beginPath(); ctx.moveTo(.12, .03); ctx.lineTo(1.0, .46); ctx.moveTo(.12, .03); ctx.lineTo(.72, .44); ctx.moveTo(.12, .03); ctx.lineTo(1.05, .3); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.scale(sc, sc); ell(ctx, .08, .05, .1, .1, '#8d949c', 1); ctx.restore();
      } else if (f === 'burnt') {
        ctx.save(); ctx.rotate(.15); ctx.scale(sc * .55, sc * .5); LWc = lw0 / (sc * .5); paint(ctx, R.burn, FINBURN);
        ctx.fillStyle = ASH; ctx.beginPath(); ctx.arc(.5, .05, .1, 0, TAU); ctx.fill(); ctx.restore();
      } else { ctx.save(); ctx.scale(sc, sc); LWc = lw0 / sc; ctx.beginPath(); ctx.moveTo(0, .1); ctx.quadraticCurveTo(.2, .35, .02, .42); ctx.lineWidth = LWc * .8; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
      ctx.restore(); break; }
    case 'spikes': {
      const sp = .2 + .22 * tell;
      for (let i = -2; i <= 2; i++) {
        const a = i * sp, L = .55 + .12 * (2 - abs(i)) + .2 * tell;
        ctx.beginPath(); ctx.moveTo(0, -.07 * cos(0)); ctx.lineTo(cos(a) * L, sin(a) * L); ctx.lineTo(0, .07);
        ctx.closePath(); ctx.fillStyle = S.col.spike[1]; ctx.fill(); ctx.lineWidth = LWc; ctx.strokeStyle = INK; ctx.stroke();
      } break; }
    case 'club': ctx.save(); ctx.translate(.12, 0); paint(ctx, R.club, S.col.body);
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(.12 + i * .02, (i - 1) * .22); ctx.rotate((i - 1) * .7); ctx.scale(1, 1); flat(ctx, R.spk, S.col.spike[1], .8); ctx.restore(); } ctx.restore(); break;
    case 'spade': ctx.save(); ctx.translate(-.1, 0); ctx.scale(.7, .7); LWc = lw0 / .7; paint(ctx, R.fin1, S.col.spike); ctx.rotate(.1); paint(ctx, R.fin2, S.col.spike); ctx.restore(); break;
    case 'split': for (let i = -1; i <= 1; i += 2) { const a = i * .28; ctx.beginPath(); ctx.moveTo(0, -.09); ctx.lineTo(cos(a) * .85, sin(a) * .85); ctx.lineTo(0, .09); ctx.closePath(); ctx.fillStyle = S.col.spike[1]; ctx.fill(); ctx.lineWidth = LWc; ctx.strokeStyle = INK; ctx.stroke(); } break;
    case 'tip': ctx.save(); ctx.scale(.14, .14); LWc = lw0 / .14; paint(ctx, R.fin1, S.col.spike); ctx.restore(); break;
    case 'fan': ctx.save(); ctx.translate(-.1, 0); ctx.scale(.62, .62); LWc = lw0 / .62; paint(ctx, R.fin1, S.col.fin); ctx.rotate(.15); paint(ctx, R.fin2, S.col.fin); ctx.restore(); break;
  }
  LWc = lw0;
}

function dTail(ctx, R, P, t, fly, mv, tell) {
  const S = R.S, a = S.tl, w = (fly ? .4 : mv ? .15 : .08) * (S.hl > .5 ? 1 : .5), sn = sin(t * 1.9), sn2 = sin(t * 1.9 - 1.1), sn3 = sin(t * 1.9 - 2.3);
  ribSet(10, a[0], a[1], a[0] + a[4], a[1] + a[5] + sn * w, a[2] + a[6], a[3] + a[7] + sn2 * w, a[2], a[3] + sn3 * w * .8, a[8], a[9], .85);
  ribbon(ctx, 10, S.col.body, S.ms * .01, 1);
  const dx = RX[9] - RX[8], dy = RY[9] - RY[8];
  ctx.save(); ctx.translate(RX[9], RY[9]); ctx.rotate(atan2(dy, dx)); if (dx < 0) ctx.scale(1, -1); tailEnd(ctx, R, P, t, tell); ctx.restore();
}

function dWings(ctx, R, P, t, fly, wingK, far, dz) {
  const S = R.S, W = R.wing, wg = S.wg, flapOn = fly || P.flap !== undefined;
  const fl = P.flap !== undefined ? P.flap : (t * S.flapHz) % 1;
  let ang = wingK < .05 ? -1.2 : (flapOn ? S.flapBase + S.flapAmp * sin(fl * TAU) : -.55 + sin(t * 1.4) * .04);
  if (wingK >= .05 && wingK < 1) ang = -1.2 + (ang + 1.2) * wingK;
  if (dz) ang = -1.2 + sin(t * 2) * .05;
  const sc = .42 + .58 * min(1, wingK * 1.4);
  if (far) wingDraw(ctx, W, wg[0] - .06 * S.hl, wg[1] + .03, ang - .5 + (flapOn ? .12 * sin(fl * TAU + .4) : 0), sc * .93, R.farWing, S.col.bone, 0);
  else wingDraw(ctx, W, wg[0], wg[1], ang, sc, S.col.wing, S.col.bone, 0);
}

function dPlates(ctx, R, tell) {
  const S = R.S, p = S.plates, n = p[0]; if (!n) return;
  const sp = S.head === 'nadder' ? 1 + tell * 1.3 : 1;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), x = p[1] + (p[2] - p[1]) * u, yt = -S.hh * Math.sqrt(max(0, 1 - (x / S.hl) * (x / S.hl))) * 1.0, hg = p[3] * (1 - .35 * abs(u - .4)) * sp, w = hg * .55;
    ctx.beginPath(); ctx.moveTo(x - w, yt + .06); ctx.lineTo(x - hg * .28, yt - hg); ctx.lineTo(x + w, yt + .06); ctx.closePath();
    ctx.fillStyle = S.col.spike[1]; ctx.fill(); ctx.lineWidth = LWc * .9; ctx.strokeStyle = INK; ctx.stroke();
  }
}

function dFlame(ctx, x, y, s, t, i) {
  const sw = sin(t * 7 + i * 1.7) * .22 * s;
  ctx.beginPath(); ctx.moveTo(x - .5 * s, y); ctx.quadraticCurveTo(x - .62 * s, y - .8 * s, x + sw, y - 1.7 * s); ctx.quadraticCurveTo(x + .62 * s, y - .8 * s, x + .5 * s, y); ctx.closePath();
  ctx.fillStyle = FLAME[0][1]; ctx.fill(); ctx.lineWidth = LWc * .7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - .25 * s, y); ctx.quadraticCurveTo(x - .3 * s, y - .5 * s, x + sw * .6, y - 1.0 * s); ctx.quadraticCurveTo(x + .3 * s, y - .5 * s, x + .25 * s, y); ctx.closePath();
  ctx.fillStyle = FLAME[1][1]; ctx.fill();
}

const SMOKEC = '#cfe3a0', SPARKC = ['#f0922f', '#ffd35c'];
function dRiders(ctx, R, P, t) {
  const list = RIDERS[P.rider]; if (!list) return;
  const S = R.S, s = S.hl > 1.2 ? 1.25 : S.hl > .5 ? 1 : .5;
  for (let i = 0; i < list.length; i++) {
    const who = list[i][0], rp = PR[who]; if (!rp) continue; const k = rp.S.H / 1.6;
    ctx.save(); ctx.translate(S.saddle[0] + list[i][1] * s * (list[i][1] < 0 ? 1 : 1), S.saddle[1] + .0); ctx.scale(k, k); LWc = LW / k;
    RP.look = .15; RP.speed = 0; RP.talk = 0; RP.cheer = P.rcheer || 0;
    personBody(ctx, rp, RP, t, true);
    ctx.restore(); LWc = S.lw;
  }
}

function dragonSide(ctx, kind, pose, t) {
  const R = DR[kind]; if (!R) return;
  const P = pose || NOPOSE, S = R.S; t = t || 0;
  const fly = P.fly ? 1 : 0, sit = P.sit ? 1 : 0, eat = P.eat || 0, dz = P.dizzy || 0, roll = P.roll || 0, tell = P.tell || 0, glow = P.glow || 0, smile = P.smile || 0;
  const wingK = P.wing !== undefined ? P.wing : fly ? 1 : 0, mv = P.walk !== undefined && !fly && !sit, ph = (mv ? P.walk : 0) * TAU, u = S.hl / .95;
  ctx.save(); LWc = S.lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.translate(0, -S.cy);
  if (roll) ctx.rotate(roll * TAU);
  ctx.translate(0, (fly ? sin(t * 2.4) * .07 : mv ? abs(sin(ph)) * .035 : sin(t * 1.6) * .012) * u);
  const sitAng = sit ? -.45 : 0, pivx = -S.hl * .6;
  if (dz) ctx.rotate(sin(t * 2.3) * .045 * dz);
  if (sit) { ctx.translate(pivx, S.cy); ctx.rotate(sitAng); ctx.translate(-pivx, -S.cy); } else if (fly) ctx.rotate(-.1 - .05 * sin(t * 2.4));
  if (tell && S.puff) { const k = 1 + .45 * tell; ctx.scale(k, k); }
  /* 입·눈 신호 값 */
  const HOp = HO; HOp.mouth = eat ? .22 + .2 * abs(sin(t * 8)) : max(P.mouth || 0, glow > .5 ? .35 : 0, dz ? .22 : 0); HOp.glow = glow; HOp.smile = smile; HOp.pupil = P.pupil === undefined ? .65 : P.pupil;
  HOp.ears = P.ears === undefined ? .3 : P.ears; HOp.dz = dz; HOp.tell = tell; HOp.eat = eat; HOp.t = t; HOp.blink = ((t * .27 + R.seed) % 1) < .035 ? 1 : 0;
  /* 목 · 머리 자리 */
  const nk = S.nk; let hx = nk[2], hy = nk[3];
  hy += sin(t * 1.7) * .03 * u; if (eat) { hy += .34 * eat * u; hx += .08 * eat * u; } if (dz) { hy += .2 * dz * u; hx += .05 * dz * u; } if (fly) hy -= .06 * u;
  if (P.alert) { hy -= .12 * u * P.alert; }
  const ha = S.ha + eat * .5 + dz * .32 - fly * .08 + sin(t * 1.7 + .5) * .02;
  /* 먼 날개 → 먼 다리 → 꼬리 → 목 */
  dWings(ctx, R, P, t, fly, wingK, true, dz);
  const A = S.cy < .5 ? .6 : .48;
  let gh = 0;
  for (let i = 0; i < S.legs.length; i++) {
    const L = S.legs[i]; if (L[3]) continue;
    dLeg(ctx, R, L, legAng(L, fly, sit, mv, ph, A, sitAng) + (fly || sit ? 0 : .1), legScl(R, L, sit, sitAng), true);
  }
  dTail(ctx, R, P, t, fly, mv, tell);
  const two = S.two;
  ribSet(8, nk[0], nk[1], nk[0] + nk[4], nk[1] + nk[5] + sin(t * 1.7) * .03 * u, hx + nk[6], hy + nk[7], hx, hy, nk[8], nk[9], .9);
  ribbon(ctx, 8, S.col.body, S.ms * .01, 1);
  const nx5 = RX[5], ny5 = RY[5], nr5 = RR[5];
  if (glow > .2) ell(ctx, nx5, ny5 + nr5 * .3, nr5 * .55, nr5 * .4, CAVC[2][1], 0);
  let h2x = 0, h2y = 0;
  if (two) { h2x = two[0]; h2y = two[1] + sin(t * 1.7 + 2) * .05 * u; ribSet(8, nk[0], nk[1], nk[0] + two[2], nk[1] + two[3], h2x + two[4], h2y + two[5], h2x, h2y, two[6], two[7], .9); ribbon(ctx, 8, S.col.body, S.ms * .01, 1); }
  dPlates(ctx, R, tell);
  /* 몸 */
  paint(ctx, R.body, S.col.body);
  ctx.save(); ctx.clip(R.body.p); ctx.fillStyle = S.col.belly; ctx.fill(R.belly.p);
  bodyDeco(ctx, R, tell);
  ctx.restore();
  ctx.lineWidth = LWc * R.body.w; ctx.strokeStyle = INK; ctx.stroke(R.body.p);
  /* 가까운 다리 */
  for (let i = 0; i < S.legs.length; i++) { const L = S.legs[i]; if (!L[3]) continue; dLeg(ctx, R, L, legAng(L, fly, sit, mv, ph, A, sitAng), legScl(R, L, sit, sitAng), false); }
  if (P.saddle || P.rider) { ctx.save(); ctx.translate(S.saddle[0] + (S.hl > 1.2 ? .05 : 0), S.saddle[1] + .06); if (S.hl < .5) ctx.scale(.3, .3); else if (S.hl > 1.2) ctx.scale(1.3, 1.3); const lw0 = LWc; LWc = lw0 / (S.hl < .5 ? .3 : S.hl > 1.2 ? 1.3 : 1); paint(ctx, R.saddleQ, SADDLE); LWc = lw0; ctx.restore(); }
  dWings(ctx, R, P, t, fly, wingK, false, dz);
  if (P.rider) dRiders(ctx, R, P, t);
  /* 머리(들) */
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ha); ctx.scale(S.hs, S.hs); LWc = S.lw / S.hs; dHead(ctx, R, HOp);
  if (S.head === 'zippleback' && tell > 0) gas(ctx, R, tell, t);
  ctx.restore(); LWc = S.lw;
  if (two) { ctx.save(); ctx.translate(h2x, h2y); ctx.rotate(S.ha - .22 + eat * .5 + dz * .3 + sin(t * 1.7 + 2.5) * .03); ctx.scale(S.hs * .88, S.hs * .88); const lw0 = LWc; LWc = lw0 / (S.hs * .88); HOp.blink = ((t * .27 + R.seed + .4) % 1) < .035 ? 1 : 0; dHead(ctx, R, HOp); if (tell > 0) sparks(ctx, R, tell, t); LWc = lw0; ctx.restore(); }
  if (S.flames && tell > 0) { const n = 7; for (let i = 0; i < n; i++) { const x = -1.15 + i * .34, yt = -S.hh * Math.sqrt(max(0, 1 - (x / S.hl) * (x / S.hl))) + .05; dFlame(ctx, x, yt, (.2 + .17 * abs(sin(i * 2.1 + 1))) * tell * 1.5, t, i); } for (let i = 0; i < 4; i++) dFlame(ctx, RX[1 + i], RY[1 + i] - RR[1 + i] * .8, (.14 + .05 * i % 3) * tell * 1.7, t, i + 9); }
  ctx.restore();
}
function legAng(L, fly, sit, mv, ph, A, sitAng) {
  if (fly) return L[2] ? -.6 : 1.15;
  if (sit) return L[2] ? -sitAng : -.9;
  return mv ? A * sin(ph + (L[2] === L[3] ? 0 : Math.PI)) : 0;
}
function legScl(R, L, sit, sitAng) {
  if (!sit) return 1; const S = R.S;
  if (!L[2]) return .62;
  const pivx = -S.hl * .6, dx = L[0] - pivx, dy = L[1] - S.cy, hgt = -(dx * sin(sitAng) + dy * cos(sitAng));
  return max(.5, (hgt - .1 * S.paw) / S.legLen);
}
function bodyDeco(ctx, R, tell) {
  const S = R.S, k = S.head;
  if (k === 'zippleback') { ctx.fillStyle = S.col.stripe; for (let i = 0; i < 6; i++) { const x = -S.hl * .85 + i * .5; ctx.beginPath(); ctx.moveTo(x, -S.hh); ctx.lineTo(x + .16, -S.hh); ctx.lineTo(x + .02, S.hh * .3); ctx.lineTo(x - .14, S.hh * .3); ctx.closePath(); ctx.fill(); } }
  else if (k === 'nightmare') { ctx.fillStyle = S.col.belly; for (let i = 0; i < 4; i++) ctx.fillRect(-S.hl, S.hh * (.28 + i * .17), S.hl * 2, .05); }
  else if (k === 'gronckle') { ctx.fillStyle = S.col.body[0]; for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(-.6 + (i % 4) * .4 + (i > 3 ? .2 : 0), -.35 + (i / 4 | 0) * .45 + (i & 1) * .1); ctx.scale(1.3, 1.3); ctx.fill(R.lump.p); ctx.restore(); } }
  else if (k === 'nadder') { ctx.strokeStyle = S.col.belly; ctx.lineWidth = .02; for (let i = 0; i < 5; i++) { const x = -.5 + i * .25; ctx.beginPath(); ctx.moveTo(x, S.hh * .3); ctx.lineTo(x + .05, S.hh); ctx.stroke(); } }
}
function gas(ctx, R, tell, t) {
  const lx = R.head.h.lip[0];
  for (let i = 0; i < 4; i++) { const u = (t * .6 + i * .25) % 1, r = (.08 + .16 * u) * tell + .03; ell(ctx, lx + .05 + u * .55, R.head.h.lip[1] + .02 - u * .15 + sin(i * 3 + t) * .03, r, r * .85, SMOKEC, .8); }
}
function sparks(ctx, R, tell, t) {
  const lx = R.head.h.lip[0];
  for (let i = 0; i < 6; i++) {
    const u = (t * 1.3 + i * .17) % 1, x = lx + .1 + u * .5, y = R.head.h.lip[1] + sin(i * 2.7) * .12 - u * .08, s = (.03 + .03 * abs(sin(i * 1.9))) * (.6 + .6 * tell);
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fillStyle = SPARKC[i & 1]; ctx.fill(); ctx.lineWidth = LWc * .5; ctx.strokeStyle = INK; ctx.stroke();
  }
}

/* ───────── 떼 드래곤 (작은 실루엣 — 선 하나 · 칠 하나) ───────── */
const FLK = {
  toothless: { c: '#383a47', bx: .5, by: .16, w: .8, tl: .75, hd: .17, hx: .5 },
  nadder: { c: '#4d78bb', bx: .55, by: .11, w: .7, tl: 1.0, hd: .09, hx: .62, nk: 1 },
  gronckle: { c: '#ad8a55', bx: .36, by: .31, w: .42, tl: .22, hd: .2, hx: .36 },
  nightmare: { c: '#bd4a3a', bx: .6, by: .2, w: 1.1, tl: .85, hd: .2, hx: .62 },
  zippleback: { c: '#7fae56', bx: .75, by: .13, w: .62, tl: .7, hd: .1, hx: .8, dbl: 1 },
  terror: { c: '#6cae4f', bx: .27, by: .1, w: .32, tl: .4, hd: .09, hx: .3 },
  scauldron: { c: '#4a8fb2', bx: .6, by: .15, w: .8, tl: .8, hd: .13, hx: .62 },
};
export function drawFlockDragon(ctx, kind, flap) {
  const F = FLK[kind] || FLK.toothless, s = sin(flap * TAU), w = F.w, ty = -w * .9 * s;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, F.bx, F.by, 0, 0, TAU);
  ctx.moveTo(F.hx, -F.by * .6); ctx.arc(F.hx, -F.by * .6, F.hd, 0, TAU);
  ctx.moveTo(-F.bx * .7, -.02); ctx.lineTo(-F.bx - F.tl, F.by * .4 - .03); ctx.lineTo(-F.bx * .7, .07);
  ctx.moveTo(.12, -F.by * .6); ctx.quadraticCurveTo(.05 * w, ty * .8, -.25 * w, ty); ctx.quadraticCurveTo(-.3 * w, ty * .55, -.5 * w, ty * .62); ctx.quadraticCurveTo(-.5 * w, ty * .25, -.72 * w, ty * .1); ctx.quadraticCurveTo(-.45 * w, -F.by * .2, -.22 * w, -F.by * .3);
  if (F.nk) { ctx.moveTo(F.bx * .6, -F.by * .5); ctx.lineTo(F.hx - .04, -F.by * 1.7); ctx.lineTo(F.hx + .08, -F.by * 1.2); }
  if (F.dbl) { ctx.moveTo(F.hx + .1, F.by * .1); ctx.arc(F.hx + .12, F.by * .1, F.hd * .85, 0, TAU); }
  ctx.fillStyle = F.c; ctx.fill(); ctx.lineWidth = .03; ctx.strokeStyle = INK; ctx.stroke();
}


/* ═════════════════ 탑뷰판 — 투슬리스 앞·뒤 · 위에서 본 드래곤 · 대장 · 떼 ═════════════════ */
function sh(p, dx, dy) { const a = new Array(p.length); for (let i = 0; i < p.length; i += 2) { a[i] = p[i] + dx; a[i + 1] = p[i + 1] + dy; } return a; }
function mir(ctx, fn) { fn(); ctx.save(); ctx.scale(-1, 1); fn(); ctx.restore(); }

/* ───── 투슬리스 앞(down)·뒤(up) ───── */
MS = 2.2;
const TFc = DK.toothless.col;
const TF = {
  body: mk(sh(blob(.5, .46, { n: 10, pw: .9 }), 0, -.6), { hl: 1, sx: .9, sy: .86, j: .008 }),
  belly: mk(sh(circ(0, 0, .3, .33, 8), 0, -.48), { j: .004 }),
  head: mk(sh([-.56, -.04, -.52, -.34, -.28, -.47, 0, -.51, .28, -.47, .52, -.34, .56, -.04, .48, .27, .26, .4, 0, .44, -.26, .4, -.48, .27], 0, -1.02), { hl: 1, sx: .9, sy: .88, j: .008 }),
  headB: mk(sh([-.54, -.04, -.5, -.34, -.27, -.47, 0, -.51, .27, -.47, .5, -.34, .54, -.04, .46, .27, .24, .4, 0, .43, -.24, .4, -.46, .27], 0, -1.02), { hl: 1, sx: .9, sy: .88, j: .008 }),
  leg: limb(.42, .17, .12, { sx: .7 }), paw: mk([-.15, -.06, .15, -.06, .19, .03, .13, .08, -.13, .08, -.19, .03], { sx: .85, sy: .8 }),
  haunch: mk(sh(circ(0, 0, .2, .26, 8), 0, 0), { sx: .86, sy: .86 }),
  ear: mk([-.08, .02, -.07, -.2, 0, -.48, .08, -.2, .09, .02], { j: .006 }),
  wing: mkWing(1.55), jaw: mk([-.3, -.02, -.3, .12, -.14, .22, 0, .25, .14, .22, .3, .12, .3, -.02]),
  teeth: mk([-.21, .0, -.17, .08, -.12, .0, .12, .0, .17, .08, .21, .0], { poly: 1, j: .002 }),
  plate: mk([-.08, .04, 0, -.16, .08, .04], { poly: 1, j: .002 }),
  tongue: mk([-.08, 0, .0, -.02, .08, 0, .08, .13, 0, .17, -.08, .13], { j: .003 }),
};
function tfWings(ctx, P, t, fly, wingK, dz, y0) {
  const flapOn = fly || P.flap !== undefined, fl = P.flap !== undefined ? P.flap : (t * 1.2) % 1;
  let r = .3 + (flapOn ? 1.0 * wingK + .4 * sin(fl * TAU) : 1.0 * wingK * .8), sc = .5 + .5 * min(1, wingK * 1.4);
  if (dz) { r = .5; sc = .6; }
  for (let s = -1; s <= 1; s += 2) {
    ctx.save(); ctx.translate(s * .38, y0); ctx.rotate(s * r); if (s > 0) ctx.scale(-1, 1); ctx.scale(sc, sc);
    const lw0 = LWc; LWc = lw0 / sc;
    paint(ctx, TF.wing.mem, TFc.wing); ctx.lineWidth = LWc * .9; ctx.strokeStyle = INK; ctx.stroke(TF.wing.bones.p);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TF.wing.wr[0], TF.wing.wr[1]); ctx.lineWidth = LWc * 4.4; ctx.stroke(); ctx.lineWidth = LWc * 2.4; ctx.strokeStyle = TFc.bone; ctx.stroke();
    LWc = lw0; ctx.restore();
  }
}
function tfTail(ctx, P, t, back) {
  const sg = back ? -1 : 1, sn = sin(t * 1.9) * .06;
  ribSet(9, sg * .22, -.3, sg * (.22 + .5), -.3 + .35, sg * (1.15 - .45), .22 + sn, sg * 1.18, .12 + sn, .3, .06, .85);
  ribbon(ctx, 9, TFc.body, .02, 1);
  const dx = RX[8] - RX[7], dy = RY[8] - RY[7];
  ctx.save(); ctx.translate(RX[8], RY[8]); ctx.rotate(atan2(dy, dx)); if (dx < 0) ctx.scale(1, -1); ctx.scale(.8, .8); const lw0 = LWc; LWc = lw0 / .8; tailEnd(ctx, DR.toothless, P, t, 0); LWc = lw0; ctx.restore();
}
function tfRiders(ctx, P, t, back) {
  const list = RIDERS[P.rider]; if (!list) return;
  for (let i = 0; i < list.length; i++) {
    const who = list[i][0];
    ctx.save(); ctx.translate(0, back ? -.5 : -.82);
    if (list.length > 1) ctx.translate(i === 0 ? (back ? -.3 : .0) : (back ? .3 : -.0), i === 0 ? (back ? -.1 : -.18) : 0);
    RP.speed = 0; RP.sit = 1; RP.look = .1; RP.dir = back ? 'up' : 'down';
    drawPerson(ctx, who, RP, t);
    ctx.restore();
  }
  RP.sit = 0;
}
function toothlessFB(ctx, P, t, back) {
  const S = DK.toothless, R = DR.toothless;
  const fly = P.fly ? 1 : 0, sit = P.sit ? 1 : 0, eat = P.eat || 0, dz = P.dizzy || 0, roll = P.roll || 0, glow = P.glow || 0, smile = P.smile || 0, mv = P.walk !== undefined && !fly && !sit, ph = (mv ? P.walk : 0) * TAU;
  const wingK = P.wing !== undefined ? P.wing : fly ? 1 : 0, pupil = P.pupil === undefined ? .65 : P.pupil, ears = P.ears === undefined ? .3 : P.ears;
  const mouth = eat ? .25 + .25 * abs(sin(t * 8)) : max(P.mouth || 0, glow > .5 ? .4 : 0, dz ? .25 : 0);
  ctx.save(); LWc = S.lw; ctx.lineCap = ctx.lineJoin = 'round';
  if (roll) { ctx.translate(0, -.6); ctx.rotate(roll * TAU); ctx.translate(0, .6); }
  const bob = (fly ? sin(t * 2.4) * .05 : mv ? -abs(sin(ph)) * .03 : sin(t * 1.6) * .01) + (sit ? .12 : 0);
  ctx.translate(dz ? sin(t * 2.3) * .03 : 0, bob);
  /* 날개(몸 뒤) */
  tfWings(ctx, P, t, fly, wingK, dz, -.85);
  if (back) {
    /* 뒤: 뒷다리 발 → 몸 → 등 판 → 머리 뒤 → 꼬리(앞으로 나옴) */
    for (let s = -1; s <= 1; s += 2) { ctx.save(); ctx.translate(s * .46, 0); paint(ctx, TF.paw, TFc.body); ctx.restore(); }
    paint(ctx, TF.body, TFc.body);
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(0, -.95 + i * .2); ctx.scale(1 - i * .08, 1 - i * .08); const lw0 = LWc; LWc = lw0 / (1 - i * .08); flat(ctx, TF.plate, TFc.spike[1], .8); LWc = lw0; ctx.restore(); }
    if (P.saddle || P.rider) { ctx.save(); ctx.translate(0, -.7); flat(ctx, R.saddleQ, SADDLE[1], .9); ctx.restore(); }
    tfTail(ctx, P, t, true);
    ctx.save(); ctx.translate(0, dz ? .04 : 0);
    paint(ctx, TF.headB, TFc.body);
    mir(ctx, () => { ctx.save(); ctx.translate(.34, -1.4); ctx.rotate(.1 + (1 - ears) * .65); paint(ctx, TF.ear, TFc.body); ctx.restore(); });
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(0, -1.4 + i * .17); flat(ctx, TF.plate, TFc.spike[1], .8); ctx.restore(); }
    ctx.restore();
    if (P.rider) tfRiders(ctx, P, t, true);
  } else {
    if (P.rider) tfRiders(ctx, P, t, false);
    tfTail(ctx, P, t, false);
    /* 뒷다리 허벅지 + 발 */
    for (let s = -1; s <= 1; s += 2) { ctx.save(); ctx.translate(s * .52, -.26); paint(ctx, TF.haunch, FAR(TFc.body)); ctx.restore(); ctx.save(); ctx.translate(s * .5, 0); paint(ctx, TF.paw, FAR(TFc.body)); ctx.restore(); }
    paint(ctx, TF.body, TFc.body);
    ctx.save(); ctx.clip(TF.body.p); ctx.fillStyle = TFc.belly; ctx.fill(TF.belly.p); ctx.restore(); ctx.lineWidth = LWc * TF.body.w; ctx.strokeStyle = INK; ctx.stroke(TF.body.p);
    /* 앞다리 · 발 (걸을 때 번갈아 듦) */
    for (let s = -1; s <= 1; s += 2) {
      const lift = mv ? max(0, sin(ph) * s) * .1 : 0;
      ctx.save(); ctx.translate(s * .3, -.42 - lift * .5); ctx.save(); ctx.scale(1, 1 - lift * .5); paint(ctx, TF.leg, TFc.body); ctx.restore(); ctx.translate(0, .4 - lift); paint(ctx, TF.paw, TFc.body); flat(ctx, R.claw, '#efe4c8', .6); ctx.restore();
    }
    if (P.saddle || P.rider) { ctx.save(); ctx.translate(0, -.98); ctx.scale(.7, .5); const lw0 = LWc; LWc = lw0 / .6; paint(ctx, R.saddleQ, SADDLE); LWc = lw0; ctx.restore(); }
    /* 머리 */
    ctx.save(); ctx.translate(sin(t * 1.7) * .01, (eat ? .12 * eat : 0) + (dz ? .1 * dz : 0) + sin(t * 1.7) * .012);
    if (dz) ctx.rotate(sin(t * 2.3) * .08 * dz);
    mir(ctx, () => { ctx.save(); ctx.translate(.34, -1.42); ctx.rotate(.1 + (1 - ears) * .7); paint(ctx, TF.ear, TFc.body); ctx.restore(); });
    paint(ctx, TF.head, TFc.body);
    /* 눈 · 콧구멍 · 입 */
    const blink = ((t * .27 + .31) % 1) < .035 ? 1 : 0, ex = .245, ey = -1.07;
    for (let s = -1; s <= 1; s += 2) {
      ctx.save(); ctx.translate(s * ex, ey); const rS = 1;
      dEye(ctx, S, 0, 0, .17, .2, pupil, dz, t, blink); ctx.restore();
      ctx.beginPath(); { const dl = (.5 - pupil) * .16; ctx.moveTo(s * ex - s * .2, ey - .26 - dl); ctx.lineTo(s * ex + s * .15, ey - .27 + dl * 1.0); } ctx.lineWidth = LWc * 1.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * .075, -.87, .025, .016, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    }
    const my = -.74;
    if (mouth > .04) {
      const lv = glow < .12 ? 0 : glow < .4 ? 1 : glow < .75 ? 2 : 3, op = mouth * .34;
      ctx.beginPath(); ctx.ellipse(0, my + op * .5, .27, op * .7 + .02, 0, 0, TAU); ctx.fillStyle = CAVC[lv][1]; ctx.fill(); ctx.lineWidth = LWc; ctx.strokeStyle = INK; ctx.stroke();
      if (lv > 2) { ctx.beginPath(); ctx.ellipse(0, my + op * .6, .15, op * .4 + .01, 0, 0, TAU); ctx.fillStyle = GLOWIN; ctx.fill(); }
      if (dz) { ctx.save(); ctx.translate(0, my + op * .7); paint(ctx, TF.tongue, TONG, .8); ctx.restore(); }
      if (smile < .5) { ctx.save(); ctx.translate(0, my - .01); flat(ctx, TF.teeth, TEETH, .55); ctx.restore(); }
      else { ctx.beginPath(); ctx.moveTo(-.22, my + .01); ctx.quadraticCurveTo(0, my + .06, .22, my + .01); ctx.lineWidth = LWc * 3.2; ctx.strokeStyle = GUM; ctx.stroke(); }
      if (eat) { ctx.beginPath(); ctx.moveTo(.18, my + op * .5); ctx.lineTo(.4, my - .05); ctx.lineTo(.36, my + op * .5 + .03); ctx.lineTo(.42, my + .14 + op); ctx.lineTo(.18, my + op * .8); ctx.closePath(); ctx.fillStyle = '#9fb7c3'; ctx.fill(); ctx.lineWidth = LWc * .9; ctx.strokeStyle = INK; ctx.stroke(); }
    } else {
      ctx.beginPath(); ctx.moveTo(-.28, my - smile * .08); ctx.quadraticCurveTo(0, my + .08 + .08 * smile, .28, my - smile * .08); ctx.lineWidth = LWc * 1.2; ctx.strokeStyle = INK; ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/* ───── 위에서 본 드래곤 ───── */
function mkWingTop(L) {
  const p = new Path2D(), fp = new Path2D(), W = [.55 * L, -.26 * L], T = [[1.0 * L, -.06 * L], [.92 * L, .3 * L], [.64 * L, .55 * L]], Rr = [.06 * L, .5 * L];
  p.moveTo(0, 0); p.lineTo(W[0], W[1]); fp.moveTo(0, 0); fp.lineTo(W[0], W[1]);
  for (let i = 0; i < 3; i++) {
    p.lineTo(T[i][0], T[i][1]); fp.moveTo(W[0], W[1]); fp.lineTo(T[i][0], T[i][1]);
    const nx = i < 2 ? T[i + 1][0] : Rr[0], ny = i < 2 ? T[i + 1][1] : Rr[1], mx = (T[i][0] + nx) / 2, my = (T[i][1] + ny) / 2;
    p.quadraticCurveTo(mx + (W[0] - mx) * .42, my + (W[1] - my) * .42, nx, ny);
  }
  p.closePath();
  return { mem: wrapPath(p, 0, -.3 * L, 1.02 * L, .6 * L), bones: wrapPath(fp, 0, -.3 * L, 1.02 * L, .6 * L), L, wr: W };
}
const HOLET = [[.62, .08, .07, .3], [.8, .27, .06, -.2], [.45, .27, .05, 0], [.7, .4, .05, .5], [.58, -.1, .05, 0], [.9, .1, .045, 0], [.3, .16, .04, 0], [.5, .44, .04, 0]];
function wingTop(ctx, W, side, x, y, f, ang, col, boneCol, holes) {
  ctx.save(); ctx.translate(x * side, y); ctx.rotate(ang * side); ctx.scale(side * f, 1);
  const lw0 = LWc; LWc = lw0 / f;
  if (holes) {
    const p = new Path2D(); p.addPath(W.mem.p);
    for (let i = 0; i < holes; i++) { const u = HOLET[i], L = W.L; p.moveTo(u[0] * L + u[2] * L, u[1] * L); p.ellipse(u[0] * L, u[1] * L, u[2] * L, u[2] * L * .8, u[3], 0, TAU); }
    ctx.save(); ctx.translate(W.mem.mx, W.mem.my); ctx.fillStyle = col[0]; ctx.fill(p, 'evenodd'); ctx.restore();
    ctx.save(); ctx.translate(W.mem.ax, W.mem.ay); ctx.scale(.93, .9); ctx.translate(-W.mem.ax + W.mem.mx, -W.mem.ay + W.mem.my); ctx.fillStyle = col[1]; ctx.fill(p, 'evenodd'); ctx.restore();
    ctx.lineWidth = LWc * W.mem.w; ctx.strokeStyle = INK; ctx.stroke(p);
  } else paint(ctx, W.mem, col);
  ctx.lineWidth = LWc * .9; ctx.strokeStyle = INK; ctx.stroke(W.bones.p);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W.wr[0], W.wr[1]); ctx.lineWidth = LWc * 4.4; ctx.stroke(); ctx.lineWidth = LWc * 2.4; ctx.strokeStyle = boneCol; ctx.stroke();
  LWc = lw0; ctx.restore();
}
const TK = {
  toothless: { bw: .4, bl: .9, sx: .3, sy: -.3, L: 2.3, hl: .4, hw: .4, hy: -1.42, tl: 1.75, eye: [.27, -.05, .15, .17], ear: .5, ms: 2.2 },
  nadder: { bw: .28, bl: .85, sx: .22, sy: -.28, L: 1.7, hl: .75, hw: .2, hy: -1.95, tl: 1.6, eye: [.15, -.12, .065, .08], ear: .3, ms: 2, beak: 1 },
  gronckle: { bw: .85, bl: .82, sx: .55, sy: -.15, L: 1.1, hl: .42, hw: .55, hy: -1.1, tl: .65, eye: [.3, -.12, .07, .08], ear: 0, ms: 2 },
  nightmare: { bw: .6, bl: 1.6, sx: .4, sy: -.7, L: 4.0, hl: .85, hw: .45, hy: -2.85, tl: 3.2, eye: [.28, -.15, .1, .12], ear: .8, ms: 3 },
  zippleback: { bw: .42, bl: 1.4, sx: .3, sy: -.6, L: 2.3, hl: .55, hw: .26, hy: -2.15, tl: 2.2, eye: [.17, -.1, .075, .09], ear: .3, ms: 2.4, two: 1 },
  terror: { bw: .12, bl: .27, sx: .08, sy: -.08, L: .55, hl: .13, hw: .13, hy: -.42, tl: .38, eye: [.08, -.02, .045, .055], ear: .12, ms: .25 },
};
for (const k in TK) {
  const K = TK[k], c = DK[k].col; MS = K.ms;
  K.body = mk(circ(0, 0, K.bw, K.bl, 12), { hl: 1, sx: .9, sy: .86, j: .008 });
  K.head = mk(K.beak ? [0, -K.hl, K.hw * .5, -K.hl * .5, K.hw, K.hl * .1, K.hw * .8, K.hl * .8, 0, K.hl, -K.hw * .8, K.hl * .8, -K.hw, K.hl * .1, -K.hw * .5, -K.hl * .5]
    : [0, -K.hl, K.hw * .7, -K.hl * .7, K.hw, -K.hl * .1, K.hw * .85, K.hl * .6, 0, K.hl, -K.hw * .85, K.hl * .6, -K.hw, -K.hl * .1, -K.hw * .7, -K.hl * .7], { hl: 1, sx: .9, sy: .86, j: .006 });
  K.wing = mkWingTop(K.L); K.ear_ = mk([-.1 * K.ear / .5, .02, 0, -K.ear, .1 * K.ear / .5, .02, 0, .1 * K.ear], { poly: 1, j: .003 });
  K.cheek = mk(circ(0, 0, .2 * K.hw / .4, .2 * K.hw / .4, 7), { hl: 1 });
}
const TOPRC = { hiccup: ['#8f4f2c', '#6f9763'], astrid: ['#e9c95e', '#4f77ad'], fishlegs: ['#a49984', '#90a65c'], snotlout: ['#7e7567', '#a14f40'], ruffnut: ['#8e8b86', '#b97a8d'], tuffnut: ['#8e8b86', '#788b4c'] };
function riderTop(ctx, who, y, t) {
  const c = TOPRC[who]; if (!c) return;
  ctx.save(); ctx.translate(0, y); ctx.scale(1.4, 1.4); const lw0 = LWc; LWc = LW / 1.4;
  for (let s = -1; s <= 1; s += 2) { ell(ctx, s * .26, .12, .09, .06, '#4a392d', 1); ell(ctx, s * .2, -.16, .06, .13, c[1], 1, s * .2); }
  ell(ctx, 0, .02, .26, .17, c[1], 1.1);
  if (who === 'astrid' || who === 'ruffnut') ell(ctx, 0, .26, .045, .17, c[0], .9);
  ell(ctx, 0, -.07, .2, .19, c[0], 1.1);
  if (who === 'hiccup') { ell(ctx, -.05, -.12, .07, .05, '#a7603a'); ell(ctx, .07, -.02, .06, .05, '#a7603a'); } else if (who === 'astrid') ell(ctx, 0, -.12, .04, .1, '#f2d27a');
  if (who === 'ruffnut' || who === 'tuffnut' || who === 'snotlout' || who === 'fishlegs') { for (let s = -1; s <= 1; s += 2) { ell(ctx, s * .22, -.1, .04, .07, '#eee2c6', .9); } }
  LWc = lw0; ctx.restore();
}
function topDragon(ctx, kind, P, t) {
  const K = TK[kind], R = DR[kind], S = R.S, c = S.col; if (!K) return;
  const flap = P.flap !== undefined ? P.flap : (t * S.flapHz) % 1, wingK = P.wing !== undefined ? P.wing : 1, tell = P.tell || 0, glow = P.glow || 0;
  ctx.save(); LWc = S.lw; ctx.lineCap = ctx.lineJoin = 'round';
  const sn = sin(flap * TAU), f = (.62 + .38 * (.5 + .5 * sn)) * (.45 + .55 * wingK), ang = .22 * sn * wingK + (1 - wingK) * .9;
  if (kind === 'terror' && tell) { const k = 1 + .45 * tell; ctx.scale(k, k); }
  /* 꼬리 */
  const tw = sin(t * 1.9) * .1 * K.tl / 1.7;
  ribSet(9, 0, K.bl * .7, tw * .3, K.bl + K.tl * .35, tw, K.bl + K.tl * .7, tw * 1.3, K.bl + K.tl, kind === 'terror' ? .05 : S.tl[8] * .72, S.tl[9] * .8, .85);
  ribbon(ctx, 9, c.body, S.ms * .01, 1);
  { const dx = RX[8] - RX[7], dy = RY[8] - RY[7]; ctx.save(); ctx.translate(RX[8], RY[8]); ctx.rotate(atan2(dy, dx)); tailEnd(ctx, R, P, t, tell); ctx.restore(); }
  /* 날개(양쪽) → 몸 → 목 → 머리 */
  for (let s = -1; s <= 1; s += 2) wingTop(ctx, K.wing, s, K.sx, K.sy, f, ang, c.wing, c.bone, 0);
  if (kind === 'nightmare' && tell > 0) for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate((i % 2 ? 1 : -1) * (.3 + .35 * (i >> 1)), -.9 + (i >> 1) * .7); dFlame(ctx, 0, 0, .28 * tell, t, i); ctx.restore(); }
  /* 목(들) → 몸(+탄 사람) → 머리(들) */
  const twoH = K.two ? 2 : 1;
  for (let h = 0; h < twoH; h++) {
    const hx = twoH === 2 ? (h ? .36 : -.36) : 0, hy = K.hy + (h ? -.2 : 0) + sin(t * 1.7 + h * 2) * .02;
    ribSet(6, hx * .3, -K.bl * .75, hx * .5, (-K.bl * .75 + hy) / 2, hx * .9, hy + K.hl * .9, hx, hy + K.hl * .4, K.bw * .55, K.bw * .4, .9);
    ribbon(ctx, 6, c.body, S.ms * .01, 1);
    if (glow > .2 && !h) ell(ctx, RX[3], RY[3], RR[3] * .5, RR[3] * .5, CAVC[2][1], 0);
  }
  paint(ctx, K.body, c.body);
  if (kind !== 'terror') { ctx.save(); ctx.clip(K.body.p); ctx.fillStyle = c.belly; ctx.fillRect(-.06, -K.bl, .12, K.bl * 2); ctx.restore(); ctx.lineWidth = LWc * K.body.w; ctx.strokeStyle = INK; ctx.stroke(K.body.p); }
  if (P.rider && kind !== 'terror') { const list = RIDERS[P.rider]; if (list) for (let i = 0; i < list.length; i++) riderTop(ctx, list[i][0], list.length > 1 ? (i === 0 ? .55 : -.15) : -.1, t); }
  for (let h = 0; h < twoH; h++) {
    const hx = twoH === 2 ? (h ? .36 : -.36) : 0, hy = K.hy + (h ? -.2 : 0) + sin(t * 1.7 + h * 2) * .02;
    ctx.save(); ctx.translate(hx, hy);
    if (kind === 'gronckle' && tell > 0) mir(ctx, () => { const r = 1 + 1.4 * tell; ctx.save(); ctx.translate(.55, .1); ctx.scale(r, r); const lw0 = LWc; LWc = lw0 / r; paint(ctx, K.cheek, c.belly); LWc = lw0; ctx.restore(); });
    /* 귀 (위에서 본 길이는 쫑긋할수록 짧음) */
    const ek = 1 - .55 * ((P.ears === undefined ? .3 : P.ears) + 1) / 2;
    mir(ctx, () => { ctx.save(); ctx.translate(K.hw * .8, K.hl * .45); ctx.rotate(-2.3 + (1 - ((P.ears === undefined ? .3 : P.ears) + 1) / 2) * .0); ctx.scale(1, ek); if (kind !== 'gronckle') flat(ctx, K.ear_, c.body[1], .8); ctx.restore(); });
    paint(ctx, K.head, c.body);
    if (kind === 'nadder') { for (let i = 0; i < 3; i++) { ctx.beginPath(); const yy = K.hl * (.2 + i * .25), w = .05; ctx.moveTo(-w, yy); ctx.lineTo(0, yy + .22 * (1 + tell * 1.3)); ctx.lineTo(w, yy); ctx.closePath(); ctx.fillStyle = c.spike[1]; ctx.fill(); ctx.lineWidth = LWc * .8; ctx.strokeStyle = INK; ctx.stroke(); } }
    /* 눈 두 개 */
    const e = K.eye, pu = P.pupil === undefined ? .65 : P.pupil;
    for (let s = -1; s <= 1; s += 2) { ctx.save(); ctx.translate(s * e[0], e[1]); dEye(ctx, S, 0, 0, e[2], e[3], pu, 0, t, 0); ctx.restore(); }
    ctx.beginPath(); ctx.ellipse(-K.hw * .12, -K.hl * .86, .015 * (K.hl + .4), .012 * (K.hl + .4), 0, 0, TAU); ctx.ellipse(K.hw * .12, -K.hl * .86, .015 * (K.hl + .4), .012 * (K.hl + .4), 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    if (glow > .15 || (P.mouth || 0) > .3) { const lv = glow < .4 ? 1 : glow < .75 ? 2 : 3; ctx.beginPath(); ctx.ellipse(0, -K.hl + .02, K.hw * .35, K.hl * .12, 0, 0, TAU); ctx.fillStyle = CAVC[lv][1]; ctx.fill(); ctx.lineWidth = LWc * .8; ctx.strokeStyle = INK; ctx.stroke(); }
    if (kind === 'zippleback' && tell > 0) { ctx.save(); ctx.translate(0, -K.hl); ctx.scale(h ? 1 : 1, 1); if (!h) { for (let i = 0; i < 3; i++) { const u = (t * .6 + i * .33) % 1, r = (.06 + .13 * u) * tell + .02; ell(ctx, sin(i * 3 + t) * .06, -.1 - u * .6, r, r, SMOKEC, .8); } } else { for (let i = 0; i < 5; i++) { const u = (t * 1.3 + i * .2) % 1, x = sin(i * 2.7) * .15, y = -.1 - u * .5, s = .035 * (.6 + .6 * tell); ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fillStyle = SPARKC[i & 1]; ctx.fill(); ctx.lineWidth = LWc * .5; ctx.strokeStyle = INK; ctx.stroke(); } } ctx.restore(); }
    ctx.restore();
  }
  ctx.restore();
}

/* ───── 떼 (위에서 본 작은 실루엣 — 선 하나 · 칠 하나) ───── */
const FLT = {
  toothless: { c: '#383a47', bw: .17, bl: .42, sp: .85, tl: .5, hd: .1 }, nadder: { c: '#4d78bb', bw: .1, bl: .45, sp: .65, tl: .75, hd: .07, nk: 1 },
  gronckle: { c: '#ad8a55', bw: .3, bl: .3, sp: .42, tl: .15, hd: .13 }, nightmare: { c: '#bd4a3a', bw: .22, bl: .55, sp: 1.2, tl: .75, hd: .12 },
  zippleback: { c: '#7fae56', bw: .13, bl: .6, sp: .7, tl: .55, hd: .07, dbl: 1 }, terror: { c: '#6cae4f', bw: .09, bl: .2, sp: .3, tl: .25, hd: .06 }, scauldron: { c: '#4a8fb2', bw: .16, bl: .5, sp: .8, tl: .6, hd: .1 },
};
export function drawFlockTop(ctx, kind, flap) {
  const F = FLT[kind] || FLT.toothless, s = sin(flap * TAU), f = .65 + .35 * s;
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(0, 0, F.bw, F.bl, 0, 0, TAU);
  ctx.moveTo(0, -F.bl - F.hd * .4); ctx.arc(0, -F.bl - F.hd * .4, F.hd, 0, TAU);
  if (F.dbl) { ctx.moveTo(-.09, -F.bl - .2); ctx.arc(-.09, -F.bl - .2, F.hd * .8, 0, TAU); }
  ctx.moveTo(-F.bw * .3, F.bl * .8); ctx.lineTo(0, F.bl + F.tl); ctx.lineTo(F.bw * .3, F.bl * .8);
  for (let q = -1; q <= 1; q += 2) {
    ctx.moveTo(q * F.bw * .6, -F.bl * .35);
    ctx.lineTo(q * F.sp * f, -F.bl * .2 - .1 * s * F.sp); ctx.quadraticCurveTo(q * F.sp * f * .9, F.bl * .35, q * F.sp * f * .55, F.bl * .42);
    ctx.quadraticCurveTo(q * F.sp * f * .35, F.bl * .1, q * F.bw * .7, F.bl * .55);
  }
  ctx.fillStyle = F.c; ctx.fill(); ctx.lineWidth = .03; ctx.strokeStyle = INK; ctx.stroke();
}

/* ───── 대장 드래곤 (위에서 본 모습 · 머리 앞 끝이 (0,0) · 머리 = −y 쪽, 몸은 +y 쪽으로 이어짐) ─────
 * 머리 길이 ≈ 8.6m · 폭 4.6m · 목 ≈ 11m · 몸통 ≈ 33m 쯤까지 · 꼬리 끝 ≈ 64m · 날개는 어깨(±7.5, 21)에서 옆으로 21m */
MS = 6;
const BT = {
  col: T('#7d7a89', .34, .3), neckGlow: T('#9a8a8e', .3, .3), dark: T('#5d5a6b', .2, .2), belly: '#aaa6b6', eye: ['#ecd27c', '#b89a3a'],
  head: mk([0, 0, 1.0, .9, 1.9, 2.6, 2.3, 4.6, 2.0, 6.8, 1.0, 8.2, 0, 8.6, -1.0, 8.2, -2.0, 6.8, -2.3, 4.6, -1.9, 2.6, -1.0, .9], { hl: 1, sx: .9, sy: .88, j: .01 }),
  body: mk([0, -16, 6.5, -13, 11, -4, 11, 6, 7, 14, 0, 17, -7, 14, -11, 6, -11, -4, -6.5, -13], { hl: 1, sx: .92, sy: .88, j: .02, mis: .5 }),
  jaw: mk([0, -2.4, .9, -.8, 1.0, .8, -1.0, .8, -.9, -.8], { j: .01 }), jawIn: mk([0, -1.9, .5, -.6, .6, .5, -.6, .5, -.5, -.6], { j: .005 }),
  wing: mkWingTop(21), rock: mk(circ(0, 0, 1.5, 1.2, 7), { hl: 1, j: .02 }), horn: mk([0, 0, -.5, 1.4, -1.7, 3.0, -2.6, 2.6, -1.5, .9], { j: .01 }),
  tongue: mk([0, 0, .3, .6, .2, 1.4, -.2, 1.4, -.3, .6], { j: .01 }), paw: mk(circ(0, 0, 2.3, 3.0, 8), { hl: 1, j: .02 }), claw: mk([0, 0, .4, -1.8, .9, 0], { poly: 1, j: .01 }),
};
export function drawBoss(ctx, pose, t) {
  const P = pose || NOPOSE, B = BT, part = P.part || 'all'; t = t || 0;
  const tell = P.tell || 0, glow = P.glow || 0, dz = P.dizzy || 0, mouth = max(P.mouth || 0, glow > .5 ? .3 : 0, dz ? .2 : 0), eyes = P.eyes === undefined ? 1 : P.eyes, sniff = P.sniff || 0, holes = P.holes | 0;
  ctx.save(); LWc = .065; ctx.lineCap = ctx.lineJoin = 'round';
  const bob = sin(t * 1.1) * .1 + (dz ? sin(t * 2.2) * .1 : 0);
  if (part === 'all' || part === 'wing') for (let s = -1; s <= 1; s += 2) wingTop(ctx, B.wing, s, 7.5, 21 + bob * .3, .92 + .05 * sin(t * 1.3 + s), (.12 + (dz ? .1 : 0)), B.dark, '#4a4757', holes);
  if (part === 'all' || part === 'body') {
    /* 발 · 꼬리 · 몸 · 목 */
    for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 2; k++) { ctx.save(); ctx.translate(s * (11.2 - k * 1.2), 23 + k * 20); ctx.scale(s, 1); paint(ctx, B.paw, B.dark); for (let c = 0; c < 3; c++) { ctx.save(); ctx.translate(-1.5 + c * 1.5, -2.7); flat(ctx, B.claw, '#d8d0bc', .7); ctx.restore(); } ctx.restore(); }
    ribSet(8, 0, 46, 0, 51, 1.2, 57, 1.8, 64, 4.4, .6, .8); ribbon(ctx, 8, B.col, .2, 1);
    ctx.save(); ctx.translate(0, 31 + bob * .3); paint(ctx, B.body, B.col);
    for (let i = 0; i < 7; i++) { const sc = 1.15 - i * .09; ctx.save(); ctx.translate((i & 1 ? .6 : -.6) * (i > 0), -9 + i * 4.3); ctx.scale(sc, sc); const lw0 = LWc; LWc = lw0 / sc; flat(ctx, B.rock, B.dark[1], .8); LWc = lw0; ctx.restore(); }
    for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(s * (6.5 + (i & 1) * 1.2), -2 + i * 6); ctx.scale(.9, .8); const lw0 = LWc; LWc = lw0 / .9; flat(ctx, B.rock, B.dark[1], .8); LWc = lw0; ctx.restore(); }
    ctx.restore();
    ribSet(8, 0, 8, 0, 12, 0, 16, 0, 20, 3.3, 6, .9);       /* 목 — 부풀면 가운데가 불룩 */
    for (let i = 0; i < 8; i++) RR[i] *= 1 + .6 * tell * sin(Math.PI * i / 7) + .06;
    ribbon(ctx, 8, glow > .4 ? B.neckGlow : B.col, .2, 1);
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate((i & 1 ? .5 : -.5), 11 + i * 3); ctx.scale(.55, .55); const lw0 = LWc; LWc = lw0 / .55; flat(ctx, B.rock, B.dark[1], .8); LWc = lw0; ctx.restore(); }
  }
  if (part === 'all' || part === 'head') {
    ctx.save(); ctx.translate(0, bob); ctx.rotate(dz ? .06 * sin(t * 2.2) : 0);
    const lv = glow < .12 ? 0 : glow < .4 ? 1 : glow < .75 ? 2 : 3;
    for (let s = -1; s <= 1; s += 2) { ctx.save(); ctx.translate(s * 1.9, 6.9); ctx.scale(-s * .65, .65); const lw0 = LWc; LWc = lw0 / .65; paint(ctx, B.horn, B.dark); LWc = lw0; ctx.restore(); }
    if (mouth > .04) {            /* 벌린 입: 아래턱이 주둥이 앞으로 나옴 · 안쪽이 따뜻해짐 */
      ctx.save(); ctx.translate(0, 1.0); const k = (1 + 2.5 * mouth) / 2.4, kk = 1 + .4 * mouth; ctx.scale(kk, k); const lw0 = LWc; LWc = lw0 / k; paint(ctx, B.jaw, B.col); fillOnly(ctx, B.jawIn, CAVC[lv][1]); if (lv > 1) { ctx.translate(0, .1); ctx.scale(.6, .6); fillOnly(ctx, B.jawIn, lv === 3 ? GLOWIN : CAVC[3][1]); } LWc = lw0; ctx.restore();
      if (dz) { ctx.save(); ctx.translate(0, -mouth * 2.2 + .2); paint(ctx, B.tongue, TONG, .8); ctx.restore(); }
    }
    paint(ctx, B.head, B.col);
    if (mouth <= .04) { ctx.beginPath(); ctx.moveTo(-.9, 1.0); ctx.quadraticCurveTo(0, 1.4, .9, 1.0); ctx.lineWidth = LWc; ctx.strokeStyle = INK; ctx.stroke(); }
    /* 콧구멍 (킁킁) */
    const nr = .3 + .22 * sniff * (.6 + .4 * sin(t * 9));
    for (let s = -1; s <= 1; s += 2) { ctx.beginPath(); ctx.ellipse(s * .55, 2.7, nr * .8, nr * 1.1, s * .3, 0, TAU); ctx.fillStyle = INK; ctx.fill(); }
    /* 눈 여섯: 양쪽에 셋씩 */
    const ey = [[1.45, 3.4, .42], [1.75, 4.6, .36], [1.7, 5.8, .31]];
    for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 3; i++) {
      const e = ey[i], x = s * e[0], y = e[1], r = e[2];
      ell(ctx, x, y, r * 1.12, r * 1.12, PAPER, .9);
      if (dz) { ctx.beginPath(); for (let j = 0; j <= 20; j++) { const th = j * .62 + t * 6, rr = j / 20 * .9, px = x + cos(th) * r * rr, py = y + sin(th) * r * rr; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.lineWidth = LWc * .5; ctx.strokeStyle = INK; ctx.stroke(); continue; }
      if (eyes < .12) { ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x, y + r * .5, x + r, y); ctx.lineWidth = LWc * .9; ctx.strokeStyle = INK; ctx.stroke(); continue; }
      ell(ctx, x, y, r, r, B.eye[1], 0); ell(ctx, x - r * .04, y - r * .06, r * .86, r * .86, B.eye[0], 0);
      ctx.beginPath(); ctx.ellipse(x, y, max(r * .16, .03), r * .8, 0, 0, TAU); ctx.fillStyle = INK; ctx.fill();
      ell(ctx, x - r * .3, y - r * .35, r * .17, r * .17, PAPER, 0);
      if (eyes < .95) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * 1.02, 0, TAU); ctx.clip(); ctx.fillStyle = B.col[1]; ctx.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4 * (1 - eyes)); ctx.restore(); ctx.beginPath(); ctx.moveTo(x - r * 1.05, y - r + r * 2 * (1 - eyes)); ctx.lineTo(x + r * 1.05, y - r + r * 2 * (1 - eyes)); ctx.lineWidth = LWc * .8; ctx.strokeStyle = INK; ctx.stroke(); }
    }
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(0, 3.6 + i * 1.7); ctx.scale(.42, .42); const lw0 = LWc; LWc = lw0 / .42; flat(ctx, B.rock, B.dark[1], .8); LWc = lw0; ctx.restore(); }
    ctx.restore();
  }
  ctx.restore();
}

/* ───── 크기 · 방향별 드래곤 ───── */
export const SIZE = {
  hiccup: [.5, 1.55], stoick: [.9, 2.1], gobber: [.8, 1.9], astrid: [.55, 1.6], fishlegs: [.95, 1.85], snotlout: [.7, 1.55], ruffnut: [.5, 1.6], tuffnut: [.5, 1.6], villager: [.55, 1.65], villager2: [.55, 1.6], elder: [.6, 1.5],
  toothless: [3.2, 1.5], nadder: [3.2, 2.3], gronckle: [2.4, 1.8], nightmare: [6, 3.4], zippleback: [5.2, 2.4], terror: [.7, .5], scauldron: [4, 2.2], boss: [48, 64],
};
export function drawDragonTop(ctx, kind, pose, t) { if (!TK[kind]) return; const P = pose || NOPOSE; if (P.z) { ctx.save(); ctx.translate(0, -P.z); } topDragon(ctx, kind, P, t || 0); if (P.z) ctx.restore(); }
export function drawDragon(ctx, kind, pose, t) {
  const P = pose || NOPOSE, d = P.dir || 'side'; t = t || 0;
  if (kind === 'boss') { drawBoss(ctx, P, t); return; }
  if (P.z) { ctx.save(); ctx.translate(0, -P.z); }
  if (kind === 'toothless' && (d === 'down' || d === 'up')) toothlessFB(ctx, P, t, d === 'up'); else dragonSide(ctx, kind, P, t);
  if (P.z) ctx.restore();
}
