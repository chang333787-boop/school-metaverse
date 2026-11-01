/* 보기 판 — ?k=actors (인물 열하나 × 앞·뒤·옆 · 드래곤 · 탑뷰 드래곤 · 대장) · ?k=sil (64px 실루엣 시험 · 옆 모습) · ?k=perf (그리기 시간)
 * &g=ppl|dr|top|boss 로 한 묶음만 볼 수 있다. ?t=숫자 로 시간을 멈춰 같은 그림을 다시 본다.
 * 배경 팀의 scenery.js는 부르지 않는다(없어도 열림).
 */
import * as A from './actors.js';

const q = new URLSearchParams(location.search), K = q.get('k') || 'actors', G = q.get('g');
const cv = document.getElementById('cv'), note = document.getElementById('note');
const el = document.getElementById('k-' + K); if (el) el.className = 'on';
const FIX = q.get('t') !== null ? parseFloat(q.get('t')) : null;     // 시간을 멈춤
const ERR = [];
const SLOW = .45;                                                   // 천천히
const PAPER = '#f4ead2', INK = '#2b2118';
const max = (a, b) => a > b ? a : b;

const PEOPLE = [['hiccup', '히컵'], ['stoick', '스토이크'], ['gobber', '고버'], ['astrid', '아스트리드'], ['fishlegs', '피시레그'], ['snotlout', '스노트라우트'],
  ['ruffnut', '러프넛'], ['tuffnut', '터프넛'], ['villager', '마을 사람'], ['villager2', '마을 사람2'], ['elder', '원로']];
const DRAGONS = [['toothless', '투슬리스'], ['nadder', '내더'], ['gronckle', '그롱클'], ['nightmare', '나이트메어'], ['zippleback', '지플백'], ['terror', '테러'], ['scauldron', '스콜드런'], ['boss', '대장']];
const DN = { toothless: '투슬리스', nadder: '내더', gronckle: '그롱클', nightmare: '나이트메어', zippleback: '지플백', terror: '테러', scauldron: '스콜드런' };

/* ───────── 실루엣 시험 (옆 모습) ───────── */
function drawFig(ctx, kind, id, pose, t) { const p = Object.assign({ dir: 'side' }, pose); if (kind === 'p') A.drawPerson(ctx, id, p, t); else A.drawDragon(ctx, id, p, t); }
function bboxOf(kind, id, pose, t, ppm) {
  const c = document.createElement('canvas'), W = 900, H = 640; c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true }); x.translate(W * .66, H - 60); x.scale(ppm, ppm); drawFig(x, kind, id, pose, t);
  const d = x.getImageData(0, 0, W, H).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (d[(j * W + i) * 4 + 3] > 20) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
  return { c, x0, y0, x1, y1 };
}
function silhouette(kind, id, box) {
  const ppm = kind === 'p' ? 100 : 60, b = bboxOf(kind, id, {}, 0, ppm), w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
  const s = box / max(w, h), c = document.createElement('canvas'); c.width = box; c.height = box;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingQuality = 'high';
  if (kind === 'p') { const s2 = 24 / ppm; x.drawImage(b.c, 0, 0, 900, 640, box / 2 - 594 * s2, box - 3 - 580 * s2, 900 * s2, 640 * s2); }   /* 사람은 같은 눈금(64px ≈ 2.7m) · 발 맞춤 → 키·덩치 차이도 보임 */
  else x.drawImage(b.c, b.x0, b.y0, w, h, (box - w * s) / 2, (box - h * s) / 2, w * s, h * s);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = '#707070'; x.fillRect(0, 0, box, box);
  return { c, x };
}
function iou(a, b, box) {
  const da = a.x.getImageData(0, 0, box, box).data, db = b.x.getImageData(0, 0, box, box).data; let i1 = 0, u = 0;
  for (let i = 3; i < da.length; i += 4) { const A_ = da[i] > 100, B_ = db[i] > 100; if (A_ && B_) i1++; if (A_ || B_) u++; }
  return i1 / (u || 1);
}
function runSil() {
  const BOX = 64, ZOOM = 4, ps = ['hiccup', 'stoick', 'gobber', 'astrid', 'fishlegs'], ds = ['toothless', 'nadder', 'gronckle', 'nightmare', 'zippleback'];
  const pn = { hiccup: '히컵', stoick: '스토이크', gobber: '고버', astrid: '아스트리드', fishlegs: '피시레그', toothless: '투슬리스', nadder: '내더', gronckle: '그롱클', nightmare: '나이트메어', zippleback: '지플백' };
  const W = 1366, H = 700; cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); ctx.fillStyle = INK; ctx.font = '16px sans-serif';
  const S = { p: [], d: [] };
  ctx.fillText('64px 회색 실루엣 · 옆 모습 (왼쪽 = 실제 크기, 오른쪽 = 4배로 키움 · 사람은 같은 눈금에 발 맞춤 · 드래곤은 가장 긴 변을 64px에 맞춤)', 12, 24);
  const draw = (arr, kind, y0) => arr.forEach((id, i) => {
    const s = silhouette(kind, id, BOX); S[kind].push(s);
    const x = 20 + i * 262;
    ctx.fillStyle = INK; ctx.fillText(pn[id], x, y0 - 8);
    ctx.drawImage(s.c, x, y0, BOX, BOX); ctx.drawImage(s.c, x + 76, y0, BOX * ZOOM / 1.35, BOX * ZOOM / 1.35);
  });
  draw(ps, 'p', 60); draw(ds, 'd', 380);
  const rep = (S_, ids, name) => {
    let mx = 0, who = '', rows = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const v = iou(S_[i], S_[j], BOX); rows.push(pn[ids[i]] + '–' + pn[ids[j]] + ' ' + v.toFixed(2)); if (v > mx) { mx = v; who = pn[ids[i]] + '–' + pn[ids[j]]; } }
    return name + ' 겹침(IoU) 가장 큰 쌍: ' + who + ' ' + mx.toFixed(2) + (mx < .75 ? '  → 통과(< 0.75)' : '  → 비슷함') + '\n  ' + rows.join(' · ');
  };
  const txt = rep(S.p, ps, '인물') + '\n' + rep(S.d, ds, '드래곤');
  note.textContent = txt; window.__sil = txt; document.title = 'sil done';
}

/* ───────── 그리기 시간 ───────── */
function runPerf() {
  const c = document.createElement('canvas'); c.width = 900; c.height = 700; cv.width = 900; cv.height = 50;
  const x = c.getContext('2d'); const out = [];
  const bench = (name, fn, N) => {
    for (let i = 0; i < 60; i++) { x.save(); x.translate(450, 640); x.scale(70, 70); fn(i * .016); x.restore(); }
    x.clearRect(0, 0, 900, 700); x.getImageData(0, 0, 900, 700);
    const r0 = performance.now(); for (let i = 0; i < N / 10; i++) { x.clearRect(0, 0, 900, 700); x.getImageData(0, 0, 900, 700); } const base = (performance.now() - r0) / (N / 10);   /* 읽어 오기만 하는 시간 */
    const t0 = performance.now();
    for (let i = 0; i < N; i++) { x.save(); x.translate(450, 640); x.scale(70, 70); fn(i * .016); x.restore(); if (i % 10 === 9) { x.getImageData(0, 0, 900, 700); x.clearRect(0, 0, 900, 700); } }   // 열 번마다 칠하기를 끝까지 시킴 (이 시험의 크로미움은 소프트웨어 그리기 = 맥/크롬북 GPU보다 느린 쪽)
    const per = ((performance.now() - t0) / N) - base / 10;
    x.clearRect(0, 0, 900, 700); const c0 = performance.now();
    for (let i = 0; i < N; i++) { x.save(); x.translate(450, 640); x.scale(70, 70); fn(i * .016); x.restore(); if (i % 40 === 39) x.clearRect(0, 0, 900, 700); }
    const cmd = (performance.now() - c0) / N; x.getImageData(0, 0, 1, 1);
    out.push(name + ' · 명령 ' + cmd.toFixed(3) + ' · 칠하기까지 ' + per.toFixed(3) + ' ms');
  };
  for (const d of ['down', 'up', 'side']) for (const [id, nm] of PEOPLE) bench('사람 ' + d + ' ' + nm + '(걷기)', t => A.drawPerson(x, id, { dir: d, speed: .5, walk: (t * 1.3) % 1 }, t), 500);
  for (const [id] of DRAGONS) { if (id === 'boss') continue; bench('드래곤 옆 ' + DN[id] + '(걷기)', t => A.drawDragon(x, id, { dir: 'side', walk: (t * .8) % 1 }, t), 300); bench('드래곤 옆 ' + DN[id] + '(날기)', t => A.drawDragon(x, id, { dir: 'side', fly: 1, flap: (t * 1.6) % 1 }, t), 300); }
  bench('투슬리스 앞', t => A.drawDragon(x, 'toothless', { dir: 'down', walk: (t * .8) % 1 }, t), 300);
  bench('투슬리스 뒤', t => A.drawDragon(x, 'toothless', { dir: 'up' }, t), 300);
  bench('투슬리스 옆 + 히컵 타고 날기', t => A.drawDragon(x, 'toothless', { dir: 'side', fly: 1, flap: (t * 1.6) % 1, saddle: 1, rider: 'hiccup' }, t), 300);
  for (const k of ['toothless', 'nadder', 'gronckle', 'nightmare', 'zippleback', 'terror']) bench('위에서 ' + DN[k], t => A.drawDragonTop(x, k, { flap: (t * 1.6) % 1 }, t), 300);
  bench('위에서 투슬리스+히컵+아스트리드', t => A.drawDragonTop(x, 'toothless', { flap: (t * 1.6) % 1, rider: 'hiccup+astrid', fin: 'new' }, t), 300);
  bench('대장(위에서 · 전체)', t => { x.scale(.1, .1); A.drawBoss(x, { holes: 4, tell: .5 }, t); }, 200);
  bench('대장 머리만', t => { x.scale(.5, .5); A.drawBoss(x, { part: 'head' }, t); }, 200);
  for (const k of ['toothless', 'nadder', 'gronckle', 'nightmare', 'zippleback', 'terror']) bench('떼(위) ' + DN[k] + ' 30마리', t => { for (let i = 0; i < 30; i++) { x.save(); x.translate(i % 10 - 5, -(i / 10 | 0) * 1.5); A.drawFlockTop(x, k, (t * 1.5 + i * .13) % 1); x.restore(); } }, 300);
  note.textContent = out.join('\n'); window.__perf = out; document.title = 'perf done';
}

/* ───────── 인물·드래곤 보기 ───────── */
const W = 1366;
function layout() {
  const R = [], wk = tt => (tt * .6) % 1;
  const PP = (title, dirName, o, h, sc) => R.push({ tag: 'ppl', title, scale: sc || 90, h: h || 262, base: 226, cells: PEOPLE.map(([id, nm]) => ({ label: nm, fn: (ctx, tt) => A.drawPerson(ctx, id, Object.assign({ dir: dirName }, typeof o === 'function' ? o(tt) : o), tt) })) });
  PP('인물 열하나 — 앞 (dir:down · 얼굴이 보임)', 'down', {});
  PP('인물 열하나 — 뒤 (dir:up · 등)', 'up', {});
  PP('인물 열하나 — 옆 (dir:side · 오른쪽을 봄)', 'side', {});
  PP('걷기 앞 (speed .5 · 다리 엇갈림 + 몸 위아래)', 'down', tt => ({ speed: .5, walk: wk(tt) }));
  PP('걷기 뒤', 'up', tt => ({ speed: .5, walk: wk(tt) }));
  PP('걷기 옆', 'side', tt => ({ speed: .5, walk: wk(tt) }));
  /* 자세 */
  const POSES = [['서기', {}], ['걷기', tt => ({ speed: .5, walk: wk(tt) })], ['달리기', tt => ({ speed: 1, walk: (tt * .9) % 1 })], ['점프(air)', { air: 1 }], ['살금살금', tt => ({ crouch: 1, speed: .2, walk: wk(tt) })],
    ['손 내밀기', { hand: 1, look: 1, crouch: .3 }], ['고개 돌림', { hand: 1, look: -1, crouch: .3 }], ['넘어짐', { hurt: .85 }], ['말하기', { talk: 1 }], ['앉기', { sit: 1 }], ['만세', { cheer: 1 }], ['투구+의족', { helmet: 1, peg: 1, speed: .5, walk: .1 }]];
  for (const [dn, nm] of [['down', '앞'], ['up', '뒤'], ['side', '옆']]) R.push({ tag: 'ppl', title: '자세 — 히컵 ' + nm + ' (서기 · 걷기 · 달리기 · 점프 · 살금살금 · 손 내밀기 · 고개 돌림 · 넘어짐 · 말하기 · 앉기 · 만세 · 투구+의족)', scale: 90, h: 262, base: 226, cw: W / 12, cells: POSES.map(([l, o]) => ({ label: l, fn: (ctx, tt) => A.drawPerson(ctx, 'hiccup', Object.assign({ dir: dn }, typeof o === 'function' ? o(tt) : o), tt) })) });
  const items = [['bucket', '양동이', 'villager2'], ['axe', '도끼', 'astrid'], ['hammer', '망치', 'gobber'], ['shield', '방패', 'stoick'], ['knife', '칼', 'snotlout'], ['fish', '물고기', 'hiccup'],
    ['bola', '볼라', 'tuffnut'], ['book', '책', 'fishlegs'], ['torch', '횃불', 'ruffnut'], ['bag', '가방', 'villager']];
  for (const [dn, nm] of [['down', '앞'], ['up', '뒤'], ['side', '옆']]) R.push({ tag: 'ppl', title: '손에 든 것 ' + nm + ' (carry · 걷는 중)', scale: 90, h: 262, base: 226, cw: W / 10, cells: items.map(([it, l, who]) => ({ label: l + ' · ' + PEOPLE.find(p => p[0] === who)[1], fn: (ctx, tt) => A.drawPerson(ctx, who, { dir: dn, carry: it, speed: .3, walk: wk(tt) }, tt) })) });
  /* 드래곤 옆 */
  const D = (id, o, sc) => ({ label: DN[id], fn: (ctx, tt) => A.drawDragon(ctx, id, Object.assign({ dir: 'side', walk: wk(tt) }, typeof o === 'function' ? o(tt) : o), tt), sc });
  R.push({ tag: 'dr', title: '드래곤 옆 (dir:side) — 걷기/서기 (40px/m)', scale: 40, h: 250, base: 205, cw: W / 4, cells: [D('toothless', { pupil: 1, ears: .6 }), D('nadder', {}), D('gronckle', {}), D('scauldron', {})] });
  R.push({ tag: 'dr', title: '드래곤 옆 — 나이트메어(30px/m) · 지플백(34px/m) · 테러(130px/m)', scale: 30, h: 290, base: 255, cw: W / 3, cells: [Object.assign(D('nightmare', {}), { sc: 36 }), Object.assign(D('zippleback', {}), { sc: 38 }), Object.assign(D('terror', {}), { sc: 130 })] });
  /* 투슬리스 앞·뒤 */
  const TD = (l, dn, o, sc) => ({ label: l, fn: (ctx, tt) => A.drawDragon(ctx, 'toothless', Object.assign({ dir: dn }, typeof o === 'function' ? o(tt) : o), tt), sc });
  R.push({ tag: 'dr', title: '투슬리스 앞 (dir:down) — 편안(둥근 눈·귀 쫑긋·잇몸 웃음) · 경계(가는 눈·귀 납작·이빨) · 불 예고 · 기절 · 먹기 · 걷기', scale: 70, h: 240, base: 205, cw: W / 6, cells: [
    TD('편안 · 잇몸 웃음', 'down', { pupil: 1, ears: 1, mouth: .5, smile: 1 }), TD('경계 · 이빨', 'down', { pupil: 0, ears: -1, mouth: .45 }), TD('불 예고 (glow)', 'down', { pupil: .15, ears: -.4, mouth: .6, glow: .85 }),
    TD('기절 (dizzy)', 'down', { dizzy: 1 }), TD('먹기', 'down', { eat: 1, pupil: 1 }), TD('걷기', 'down', tt => ({ walk: wk(tt), pupil: .8, ears: .6, smile: .6 }))] });
  R.push({ tag: 'dr', title: '투슬리스 앞 — fin none / new / burnt · 안장 · 날개 폄/날기 · 탄 사람 (히컵 · 히컵+아스트리드)', scale: 66, h: 300, base: 255, cw: W / 6, cells: [
    TD('fin none', 'down', { fin: 'none' }), TD('fin new', 'down', { fin: 'new', saddle: 1 }), TD('fin burnt', 'down', { fin: 'burnt' }), TD('날개 폄', 'down', { wing: 1, pupil: .7 }),
    TD('히컵이 탐', 'down', { rider: 'hiccup', saddle: 1, fin: 'new', smile: .7, pupil: 1 }), TD('히컵+아스트리드', 'down', { rider: 'hiccup+astrid', saddle: 1, fin: 'new' })] });
  R.push({ tag: 'dr', title: '투슬리스 뒤 (dir:up) — 서기 · 걷기 · 날개 폄 · 귀 쫑긋/납작 · 히컵이 탐 · 히컵+아스트리드 · fin burnt', scale: 62, h: 300, base: 255, cw: W / 7, cells: [
    TD('서기', 'up', {}), TD('걷기', 'up', tt => ({ walk: wk(tt) })), TD('날개 폄', 'up', { wing: 1 }), TD('귀 쫑긋', 'up', { ears: 1 }), TD('히컵이 탐', 'up', { rider: 'hiccup', saddle: 1, fin: 'new' }), TD('히컵+아스트리드', 'up', { rider: 'hiccup+astrid', saddle: 1, fin: 'new' }), TD('fin burnt', 'up', { fin: 'burnt' })] });
  /* 투슬리스 옆 */
  const TL = (l, o) => ({ label: l, fn: (ctx, tt) => A.drawDragon(ctx, 'toothless', Object.assign({ dir: 'side' }, typeof o === 'function' ? o(tt) : o), tt) });
  R.push({ tag: 'dr', title: '투슬리스 옆 기분 — 편안 / 경계 / 불 예고 / 기절 / 먹기 / 앉기 (38px/m)', scale: 38, h: 230, base: 190, cw: W / 6, cells: [
    TL('편안 · 잇몸 웃음', { pupil: 1, ears: 1, mouth: .5, smile: 1 }), TL('경계 · 이빨', { pupil: 0, ears: -1, mouth: .45 }), TL('불 예고', { pupil: .15, ears: -.4, mouth: .6, glow: .85 }),
    TL('기절', { dizzy: 1, mouth: .25 }), TL('먹기', { eat: 1, pupil: 1, ears: .5 }), TL('앉기', { sit: 1, pupil: 1, ears: .8, smile: .6, mouth: .2 })] });
  R.push({ tag: 'dr', title: '투슬리스 옆 — fin none/new/burnt · 뒹굴기 · 날기 · 탄 사람', scale: 36, h: 290, base: 235, cw: W / 6, cells: [
    TL('fin none', { fin: 'none' }), TL('fin new', { fin: 'new', saddle: 1 }), TL('fin burnt', { fin: 'burnt' }), TL('날기+히컵', tt => ({ fly: 1, flap: (tt * 1.2) % 1, rider: 'hiccup', saddle: 1, fin: 'new' })),
    TL('날기+둘', tt => ({ fly: 1, flap: (tt * 1.2) % 1, rider: 'hiccup+astrid', saddle: 1, fin: 'new' })), TL('뒹굴기 .3', { roll: .3 })] });
  const TE = (id, tl, sc) => ({ label: DN[id] + ' tell ' + tl, fn: (ctx, tt) => A.drawDragon(ctx, id, { dir: 'side', tell: tl, pupil: .1, ears: -.5, mouth: .2 }, tt), sc });
  R.push({ tag: 'dr', title: '옆 — 공격 예고 tell: 내더(가시) · 그롱클(볼) · 나이트메어(불꽃) · 지플백(김/불티) · 테러(몸 부풂)', scale: 34, h: 270, base: 230, cw: W / 5, cells: [TE('nadder', 1, 34), TE('gronckle', 1, 40), TE('nightmare', 1, 30), TE('zippleback', 1, 34), TE('terror', 1, 120)] });
  /* 위에서 */
  const TO = (k, o, sc) => ({ label: DN[k] + (o.tell ? ' tell' : ''), fn: (ctx, tt) => A.drawDragonTop(ctx, k, Object.assign({ flap: (tt * .9) % 1 }, typeof o === 'function' ? o(tt) : o), tt), sc });
  R.push({ tag: 'top', title: '위에서 본 드래곤 (drawDragonTop · 머리가 위쪽) — 투슬리스(fin new) · 내더 · 그롱클 · 나이트메어 · 지플백 · 테러', scale: 44, h: 390, base: 195, cw: W / 6, cells: [
    TO('toothless', { fin: 'new' }, 46), TO('nadder', {}, 46), TO('gronckle', {}, 52), TO('nightmare', {}, 26), TO('zippleback', {}, 40), TO('terror', {}, 150)] });
  R.push({ tag: 'top', title: '위에서 — 투슬리스 fin none · burnt · 히컵이 탐 · 히컵+아스트리드 · 글로우 · 날개 접음(wing .2)', scale: 50, h: 390, base: 195, cw: W / 6, cells: [
    TO('toothless', { fin: 'none' }, 50), TO('toothless', { fin: 'burnt' }, 50), TO('toothless', { rider: 'hiccup', fin: 'new' }, 50), TO('toothless', { rider: 'hiccup+astrid', fin: 'new' }, 50), TO('toothless', { glow: .9, mouth: .5, ears: -1, pupil: .1 }, 50), TO('toothless', { wing: .2, fin: 'new' }, 50)] });
  R.push({ tag: 'top', title: '위에서 — 공격 예고 tell: 내더(가시·꼬리 부채) · 그롱클(볼 부풂) · 나이트메어(불꽃) · 지플백(김/불티) · 테러(몸 부풂)', scale: 40, h: 390, base: 195, cw: W / 5, cells: [
    TO('nadder', { tell: 1 }, 46), TO('gronckle', { tell: 1 }, 50), TO('nightmare', { tell: 1 }, 24), TO('zippleback', { tell: 1 }, 40), TO('terror', { tell: 1 }, 150)] });
  const FLT = k => ({ label: DN[k], fn: (ctx, tt) => { for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(-1.3 + (i % 2) * 1.5, -2.2 + (i >> 1) * 1.5 + (i & 1) * -.3); A.drawFlockTop(ctx, k, (tt * 1.4 + i * .27) % 1); ctx.restore(); } } });
  R.push({ tag: 'top', title: '떼 드래곤 (위 · drawFlockTop · 선 하나 · 칠 하나 · 네 마리씩)', scale: 46, h: 190, base: 150, cw: W / 6, cells: ['toothless', 'nadder', 'gronckle', 'nightmare', 'zippleback', 'terror'].map(FLT) });
  /* 대장 */
  const BS = (l, o, sc, x) => ({ label: l, fn: (ctx, tt) => { ctx.translate(x || 0, 0); A.drawBoss(ctx, o, tt); }, sc });
  R.push({ tag: 'boss', title: '대장 드래곤 (위에서 · 머리 앞 끝이 기준점 · 머리가 위쪽) — 전체 모습 8px/m', scale: 9, h: 520, base: 22, cw: W / 3, cells: [BS('기본', {}, 7.2, 0), BS('날개 구멍 4 + tell .6', { holes: 4, tell: .6 }, 7.2, 0), BS('날개 구멍 8 · 기절', { holes: 8, dizzy: 1, mouth: .2 }, 7.2, 0)] });
  R.push({ tag: 'boss', title: '대장 머리 가까이 (part:head) — 기본 · 눈 감음(eyes 0) · 입 안 밝아짐(glow .9) · 킁킁(sniff) · 기절', scale: 36, h: 340, base: 12, cw: W / 5, cells: [
    BS('기본', { part: 'head' }, 28, 0), BS('eyes .1', { part: 'head', eyes: .1 }, 28, 0), BS('glow .9 + mouth', { part: 'head', glow: .9, mouth: .6 }, 28, 0), BS('sniff 1', { part: 'head', sniff: 1 }, 28, 0), BS('dizzy', { part: 'head', dizzy: 1, mouth: .2 }, 28, 0)] });
  return R.filter(r => !G || r.tag === G);
}

function runActors() {
  const R = layout(); let y = 0;
  for (const r of R) { r.y = y + 26; y += r.h + 26; }
  cv.width = W; cv.height = y + 10;
  const ctx = cv.getContext('2d');
  const frame = (now) => {
    const tt = FIX !== null ? FIX : now / 1000 * SLOW;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, cv.height);
    for (const r of R) {
      ctx.fillStyle = INK; ctx.font = '13px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(r.title, 8, r.y - 8);
      ctx.strokeStyle = 'rgba(43,33,24,.18)'; ctx.lineWidth = 1;
      const cw = r.cw || (W / r.cells.length);
      r.cells.forEach((c, i) => {
        const cx = i * cw + cw / 2, gy = r.y + r.base, sc = c.sc || r.scale;
        if (r.tag !== 'top' && r.tag !== 'boss') { ctx.beginPath(); ctx.moveTo(i * cw + 8, gy); ctx.lineTo((i + 1) * cw - 8, gy); ctx.stroke(); }
        ctx.save(); ctx.translate(cx, gy); ctx.scale(sc, sc);
        try { c.fn(ctx, tt); } catch (e) { console.error(c.label, e); ERR.push(c.label + ': ' + e.message); ctx.reset(); }
        ctx.restore();
        if (c.label) { ctx.fillStyle = INK; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, cx, r.tag === 'top' || r.tag === 'boss' ? r.y + 12 : gy + 17); }
      });
    }
    if (ERR.length) note.textContent = '오류 ' + ERR.slice(0, 6).join('\n');
    if (FIX === null) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  window.__rows = R.map(r => ({ title: r.title, y: r.y, h: r.h }));
  document.title = 'actors ready';
}

try { if (K === 'sil') runSil(); else if (K === 'perf') runPerf(); else runActors(); }
catch (e) { note.textContent = '오류: ' + e.stack; console.error(e); }
