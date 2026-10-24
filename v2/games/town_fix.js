// 🔧 동네 고칠 곳 신고(FIX-1 · 코덱스 10-24 표 11줄 '행정복지센터 한 곳, 고장 신고 한 종류 → 다음 날 실제 수리' · docs/systems/town_emergency.md 사건 11 · 꼴 = town_emerg.js)
//   고리 = 생김(그날 씨앗 · 내 둘레 80~300m 인도 · 하루 하나 · 이야기·긴급 사건과 겹치면 그날 X) → 찾기(주황 고깔 · 가까이 가면 E 🔍 살펴보기)
//     → 신고(행정복지센터 앞 민원 안내 탁자 E · 09:00~18:00 · ① 지도 보고 칸 고르기 ② 무엇이 어떻게) → 다음 날 아침 고친 보도블록 + 「고쳤어요」 판(하루) + 아침 소식 한 줄
//   지킴: 판타지 X · 실명 X(직원 = 이름 없는 역할 · 몸 있음) · 보상 = 솜씨만(꼬리표 fix:report → rwCheck 한 문) · 돈 X
//   렉: 매 프레임 일 0(모두 1초 칸 sec) · 새 Light X · 고장 = 합친 부품 1 · 고친 뒤 = 부품 1 + 글씨판 1 · 직원·탁자 = 센터 80m 안 문 연 때만 1
export const FX_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = s => { let a = hashS(s) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const HRS = [9, 18];   /* 창구 여는 때(docs/systems/town_hours.md) */
const KIND = [[1, T2('보도블록이 깨지고 들떴어요', 'Paving stones are cracked and lifted')], [0, T2('가로등이 꺼졌어요', 'A streetlight is out')], [0, T2('수도관에서 물이 새요', 'A water pipe is leaking')]];
const WORDS = [[T2('민원', 'Request'), T2('주민이 불편한 것을 공공기관에 알리고 고쳐 달라고 하는 것', 'Telling a public office about a problem and asking them to fix it')], [T2('접수', 'Received'), T2('알린 것을 받아서 적어 두는 것', 'Taking down what someone reported')]];
const FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const CSS = `.twn-p .fx-ch{display:grid;gap:8px;margin:6px 0}.twn-p .fx-ch button{min-height:48px;font-size:15px;text-align:left}
.twn-p .fx-wd{background:#fffdf2;border:2px dashed #c9b27a;border-radius:12px;padding:6px 10px;margin:6px 0;font-size:15px;line-height:1.5}`;

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · lang() · esc · openP(h, wide, kind) · closeP() · panelOpen() · say(t, s) · sfx(k)
//   busy() · away() · open() 사건이 열렸나 · emOn() 긴급 사건 중 · storyHall() 지금 이야기 단계가 행정복지센터 · halls() [{x, z, door, name}]
//   sideSpot(rnd, cx, cz, r0, r1) 인도 자리 {x, z, y, ux, uz, px, pz, w} · okSpot(x, z) · inSchool(x, z) · cell(x, z) · place(x, z) · home() 문 자리
//   guide(to, info) · mapSnip(cv, pts) · skUp(k, n, src) · rec(k, o) · buildParts(fn) · gy(x, z)
export function createFix(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const S = () => { const g = A.GAME.S; let s = g.fix; if (!s || typeof s !== 'object' || s.v !== FX_V) s = g.fix = { v: FX_V, d: -1, cur: null, log: [], n: 0 }; if (!Array.isArray(s.log)) s.log = []; return s; };
  const mark = () => A.GAME.mark(), toast = (t, s) => A.say(t, s), sfx = k => A.sfx(k), day = () => A.GAME.S.day | 0;
  let dead = false, css = null, VIS = null, VKEY = '', LOOKH = null, HALLH = [], CLERK = null, told = '', tries = 0, tTx = '', tAt = 0, hq = 0, DBG = [];
  if (!document.getElementById('fx-css')) { css = document.createElement('style'); css.id = 'fx-css'; css.textContent = CSS; document.head.appendChild(css); }
  const me = () => map.player.pos(), dist = (x, z) => { const m = me(); return Math.hypot(x - m.x, z - m.z); };
  const log = t => { DBG.push(t); if (DBG.length > 20) DBG.shift(); };

  // ───────── 때(그날 상태 = 저장에서 셈 · 따로 넘기는 일 X) ─────────
  //   신고 X = 깨짐(사흘 지나면 다른 이웃이 알려 고침 · 흔적 X) · 신고한 날 = 깨짐(접수) · 다음 날 = 고침 + 판 · 그다음 날 = 고침 · 그 뒤 = 끝
  function phase(q, D) { if (!q) return ''; if (!q.rep) return D - q.d > 3 ? 'gone' : 'broken'; if (D <= q.rep) return 'broken'; if (D === q.rep + 1) return 'sign'; if (D === q.rep + 2) return 'fixed'; return 'gone'; }

  // ───────── 생김: 그날 씨앗 → 내 둘레 인도 한 곳 ─────────
  function plan(D) { const s = S(); if (s.d === D || s.cur) return; if (!A.open() || A.busy() || A.away()) return;
    if (A.emOn() || A.storyHall()) { s.d = D; s.skip = D; mark(); log('skip ' + D + (A.emOn() ? ' em' : ' story')); return; }
    const m0 = me(), R9 = rng('fix:' + D + ':' + (A.GAME.S.v || 0)), H = A.home(); let sp = null;
    for (let t = 0; t < 6 && !sp; t++) { const q = A.sideSpot(R9, m0.x, m0.z, 80, 300); if (q && !(H && Math.hypot(q.x - H[0], q.z - H[1]) < 25) && !halls().some(h => Math.hypot(q.x - h.door[0], q.z - h.door[1]) < 20)) sp = q; }
    s.d = D; if (!sp) { mark(); log('noSpot ' + D); return; }
    s.cur = { d: D, x: +sp.x.toFixed(2), z: +sp.z.toFixed(2), y: +sp.y.toFixed(3), ux: +sp.ux.toFixed(4), uz: +sp.uz.toFixed(4), px: +sp.px.toFixed(4), pz: +sp.pz.toFixed(4), w: +sp.w.toFixed(2), cell: A.cell(sp.x, sp.z), seen: 0, rep: 0, mis: 0 }; s.n = (s.n | 0) + 1; mark(); log('plan ' + D + ' ' + s.cur.cell); }
  function sec() { if (dead || !A.on()) return; const s = S(), D = day();
    if (s.cur && phase(s.cur, D) === 'gone') { const q = s.cur; s.log.unshift({ d: q.d, cell: q.cell, x: q.x, z: q.z, rep: q.rep, ok: q.rep ? 1 : 0 }); s.log.length = Math.min(s.log.length, 10); s.cur = null; mark(); }
    if (!s.cur && s.d !== D) plan(D); sync(); hallSync(); clerkSync();
    const q = s.cur, tk = q ? D + ':' + q.x : '', tEl = document.getElementById('toast'), now = performance.now(); if (tEl && tEl.textContent !== tTx) { tTx = tEl.textContent; tAt = now; } const tFree = !tEl || tEl.style.display === 'none' || now - tAt > 4000;   /* 다른 알림이 보이는 중이면 기다렸다가(덮이면 한 번 더 · 두 번까지) */
    if (tk !== told) { told = tk; tries = 0; }
    if (q && phase(q, D) === 'broken' && !q.seen && tries < 2 && tFree && dist(q.x, q.z) < 28 && !A.busy()) { tries++; toast('🚧 ' + (en() ? 'An orange cone stands on the pavement ahead. Go close and press E to look.' : '저 앞 인도에 주황 고깔이 서 있어요. 가까이 가서 E로 살펴봐요.'), 3.2); } }

  // ───────── 모습(합친 부품 · 인도 위 · 모두 인도 면보다 2cm 넘게 위 = 같은 평면 X) ─────────
  //   틀 = 인도 결(z = 길 방향 · x = 길 건너 방향) · 블록 0.38m · 4 × 2장
  function partsBroken(q) { const R9 = rng('fxb:' + q.d + q.x); return A.buildParts(put => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const lx = -0.2 + j * 0.4, lz = -0.6 + i * 0.4, g = [0xb3ad9f, 0xaea89a, 0xb8b2a4][R9() * 3 | 0];
      if (i === 2 && j === 0) { put('b', lx, -0.03, lz, 0.37, 0.05, 0.37, 0x6b5a45); put('b', lx - 0.07, 0.02, lz + 0.06, 0.13, 0.05, 0.11, 0xa49e91, 0, 0.5); put('b', lx + 0.09, 0.02, lz - 0.08, 0.1, 0.04, 0.12, 0x9d978a, 0, -0.7); continue; }   /* 빠진 자리 = 흙 + 깨진 조각 둘 */
      if (i === 1 && j === 0) { put('b', lx, -0.02, lz, 0.38, 0.08, 0.38, 0xa8a295, 0, 0.08, 0.16); continue; }   /* 들뜬 블록(앞이 들림) */
      if (i === 1 && j === 1) { put('b', lx - 0.1, -0.04, lz, 0.17, 0.09, 0.38, g, 0, 0.12, -0.05); put('b', lx + 0.1, -0.04, lz, 0.17, 0.08, 0.38, g, 0, -0.1); continue; }   /* 금 간 블록(두 쪽) */
      if (i === 2 && j === 1) { put('b', lx, -0.04, lz, 0.38, 0.09, 0.38, 0xaaa497, 0, 0.2, -0.1); continue; }   /* 기운 블록 */
      put('b', lx, -0.05, lz, 0.38, 0.08 + R9() * 0.02, 0.38, g); }
    put('b', 0, 0, 1.05, 0.36, 0.03, 0.36, 0x2b2b2b); put('k', 0, 0.03, 1.05, 0.15, 0.62, 0, 0xf26a1b); put('c', 0, 0.27, 1.05, 0.096, 0.1, 0, 0xf4f4ef);   /* 주황 고깔(밑판 · 흰 띠) */ }); }
  function partsFixed(q, sign) { const ox = q.ox; return A.buildParts(put => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) put('b', -0.2 + j * 0.4, -0.05, -0.6 + i * 0.4, 0.38, 0.075, 0.38, 0xe0dbcf);   /* 새 블록(밝은 색 · 하루 이틀 뒤면 둘레와 같아짐) */
    if (sign) { put('b', ox * 0.42, 0, 0, 0.05, 0.6, 0.05, 0x6a6e73); put('b', ox * 0.42, 0.6, 0, 0.8, 0.54, 0.03, 0x3f8f4e); } }); }   /* 판 기둥 · 초록 판(글씨는 따로 한 장) */
  function signText(q) { const c = document.createElement('canvas'); c.width = 256; c.height = 176; const g = c.getContext('2d'), e = en();
    g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, 256, 176); g.fillStyle = '#2b2420'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 50px ' + FONT; g.fillText(e ? 'Fixed!' : '고쳤어요', 128, 62); g.font = '800 25px ' + FONT; g.fillText(e ? 'Thanks for telling us' : '알려 줘서 고마워요', 128, 116); g.font = '700 18px ' + FONT; g.fillStyle = '#56606b'; g.fillText(e ? 'Community Centre' : '행정복지센터', 128, 150);
    const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2;
    const w = 0.37, h = 0.24, x = q.ox * 0.42, y = 0.87, f = 0.017, P = [], U = [], N = [];
    const quad = (z, s9) => { const xa = x - w * s9, xb = x + w * s9; for (const [px, py, u, v] of [[xa, y - h, 0, 0], [xb, y - h, 1, 0], [xb, y + h, 1, 1], [xa, y - h, 0, 0], [xb, y + h, 1, 1], [xa, y + h, 0, 1]]) { P.push(px, py, z); U.push(u, v); N.push(0, 0, s9); } };
    quad(f, 1); quad(-f, -1);   /* 앞뒤 두 면(뒤도 글씨가 바로 읽힘) = 한 덩이 */
    const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); geo.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); geo.computeBoundingSphere();
    const m = new T3.Mesh(geo, new T3.MeshLambertMaterial({ map: tx })); m.userData.own = 1; return m; }
  function visDrop() { if (!VIS) return; map.remove(VIS); VIS.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.userData.own) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } } }); VIS = null; }   /* 합친 부품 재질 = 같이 씀 → 모양만 */
  function sync() { const q = S().cur, D = day(), ph = phase(q, D), key = ph && ph !== 'gone' ? ph + ':' + q.x + ':' + q.z + ':' + A.lang() : '';
    if (key === VKEY) return; VKEY = key; visDrop(); if (LOOKH) { LOOKH.remove(); LOOKH = null; } if (!key) return;
    q.ox = (q.px * q.uz - q.pz * q.ux) >= 0 ? 1 : -1;   /* 인도 바깥쪽(길에서 먼 쪽) = 이 틀의 +x인가 */
    const g = ph === 'broken' ? partsBroken(q) : partsFixed(q, ph === 'sign'); if (ph === 'sign') g.add(signText(q));
    g.position.set(q.x, q.y, q.z); g.rotation.y = Math.atan2(q.ux, q.uz); g.userData.fx = 1; map.add(g); g.updateMatrixWorld(true); VIS = g;
    if (ph === 'broken') LOOKH = map.interact.add({ kind: 'game', x: q.x, z: q.z, y: A.gy(q.x, q.z), r: 2.2, label: '🔍 ' + (en() ? 'Look closely' : '살펴보기'), use: () => look() }); }
  function look() { const q = S().cur; if (!q || A.panelOpen()) return; const e = en(), rep = !!q.rep;
    if (!q.seen) { q.seen = day(); mark(); A.rec('fix', { ev: 'seen', cell: q.cell }); }
    const P = A.openP('<h3>🔍 ' + (e ? 'Look closely' : '살펴보기') + '</h3><div class="pc-tx">' + esc(e ? 'A few paving stones are cracked and lifted. Someone could trip and fall.' : '보도블록 몇 장이 깨지고 들떠 있어요. 걷다가 발이 걸려 넘어질 수 있어요.') + '</div>'
      + '<div class="sm">' + esc(rep ? (e ? 'You told the community centre. It will be fixed tomorrow morning.' : '행정복지센터에 알렸어요. 내일 아침에 고쳐요.') : (e ? 'Tell the community centre and they will fix it.' : '행정복지센터에 알리면 고쳐 줘요.')) + '</div>'
      + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button>' + (rep ? '' : '<button data-a="way">🧭 ' + (e ? 'Way to the centre' : '행정복지센터 길 안내') + '</button>') + '</div>', false, 'fixlook');
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); if (b.dataset.a === 'way') { const h = hallNear(); if (h) { A.guide(h.door, { icon: '🏛', name: L(T2('행정복지센터', 'Community centre')) }); toast(e ? 'Follow the red line.' : '빨간 선을 따라가요.', 2.2); } } }; }

  // ───────── 행정복지센터: 문 곁 민원 안내 탁자(E 자리 · 직원 몸은 문 연 때 80m 안만) ─────────
  const halls = () => { const out = []; for (const h of A.halls()) if (!out.some(o => Math.hypot(o.door[0] - h.door[0], o.door[1] - h.door[1]) < 40)) out.push(h); return out; };   /* 같은 센터가 장소 목록에 두 번(건물 · 칸 이름표) = 하나로 */
  function hallNear() { const H = halls(), m0 = me(); let b = null, bd = 1e18; for (const h of H) { const d = Math.hypot(h.door[0] - m0.x, h.door[1] - m0.z); if (d < bd) { bd = d; b = h; } } return b; }
  function deskSpot(h) { const ox = h.door[0] - h.x, oz = h.door[1] - h.z, l = Math.hypot(ox, oz) || 1, fx = ox / l, fz = oz / l, sx = -fz, sz = fx;   /* 문 밖 방향 · 옆 */
    for (const sd of [1.9, -1.9, 2.8, -2.8]) for (const out of [1.2, 2.0, 2.8]) { const cx = h.door[0] + fx * out + sx * sd, cz = h.door[1] + fz * out + sz * sd, ex = cx + fx * 1.3, ez = cz + fz * 1.3; if (A.okSpot(cx, cz) && A.okSpot(ex, ez)) return { cx, cz, ex, ez, ry: Math.atan2(fx, fz), ok: 1 }; }
    return { cx: h.door[0] + sx * 1.9 + fx * 1.2, cz: h.door[1] + sz * 1.9 + fz * 1.2, ex: h.door[0] + sx * 1.9 + fx * 2.5, ez: h.door[1] + sz * 1.9 + fz * 2.5, ry: Math.atan2(fx, fz) }; }
  const deskHot = h => map.interact.add({ kind: 'game', x: h.desk.ex, z: h.desk.ez, y: A.gy(h.desk.ex, h.desk.ez), r: 2.0, label: '🏛 ' + (en() ? 'Report something to fix' : '동네 고칠 곳 신고'), use: () => counter(h) });
  function hallSync() { if (!HALLH.length) { for (const h of halls()) { h.desk = deskSpot(h); HALLH.push({ h, hot: deskHot(h) }); } hq = 0; return; }
    if (hq > 90 || (++hq) % 15) return; for (const o of HALLH) { const s9 = deskSpot(o.h); if (Math.hypot(s9.ex - o.h.desk.ex, s9.ez - o.h.desk.ez) < 0.5) continue; o.h.desk = s9; o.hot.remove(); o.hot = deskHot(o.h); if (CLERK && CLERK.h === o.h) CLERK.h = null; } }   /* 처음 1분 반은 15초마다 자리 다시(건물 충돌이 늦게 들어오는 판 · 탁자가 벽 속에 서지 않게) */
  const openNow = () => A.GAME.open(HRS[0], HRS[1]);
  function clerkSync() { const h = HALLH.length ? hallNear() : null, want = h && openNow() && dist(h.door[0], h.door[1]) < 80 ? h : null;
    if (CLERK && CLERK.h === want) return; if (CLERK) { map.remove(CLERK.g); CLERK.g.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); CLERK = null; } if (!want) return; const s9 = want.desk;
    const g = A.buildParts(put => { for (const sg of [-1, 1]) put('b', sg * 0.09, 0, -0.35, 0.12, 0.8, 0.12, 0x33456b); put('c', 0, 0.8, -0.35, 0.18, 0.55, 0, 0x5b7fa8); for (const sg of [-1, 1]) put('b', sg * 0.23, 0.86, -0.33, 0.08, 0.46, 0.08, 0x5b7fa8);
      put('s', 0, 1.5, -0.35, 0.16, 1, 0, 0xf2c9a0); put('s', 0, 1.55, -0.36, 0.17, 0.75, 0, 0x3a2a1e); put('b', 0, 1.0, -0.17, 0.08, 0.1, 0.02, 0xf4f4ef);   /* 직원(이름 없는 역할 · 목걸이 이름표 = 흰 네모) */
      for (const sx of [-0.45, 0.45]) put('b', sx, 0, 0.25, 0.06, 0.7, 0.4, 0x8a6a4a); put('b', 0, 0.7, 0.25, 1.0, 0.05, 0.5, 0xd9c7a5); put('b', 0.2, 0.75, 0.25, 0.22, 0.02, 0.16, 0xffffff); });   /* 민원 안내 탁자 · 종이 */
    g.position.set(s9.cx, A.gy(s9.cx, s9.cz), s9.cz); g.rotation.y = s9.ry; g.userData.fx = 1; map.add(g); CLERK = { h: want, g }; }
  function counter(h) { if (A.panelOpen() || A.busy()) return; const e = en();
    if (!openNow()) { toast('🌙 ' + (e ? 'Closed now. Opens at 09:00' : '지금은 문 닫았어요 · 09:00에 열어요'), 2.6); return; }
    const q = S().cur, D = day();
    if (!q || !q.seen || phase(q, D) !== 'broken') { toast('🏛 ' + (e ? 'Clerk: “If you see something broken in town, come and tell us.”' : '직원: "동네에서 망가진 곳을 보면 와서 알려 줘요."'), 3); return; }
    if (q.rep) { toast('🏛 ' + (e ? 'Clerk: “We have it. It will be fixed tomorrow morning.”' : '직원: "접수했어요. 내일 아침에 고쳐요."'), 3); return; }
    report(h); }
  // 신고 창: ① 어디(지도 = 내가 살펴본 곳 빨간 점 · 칸 셋) → ② 무엇(셋) → 접수(낱말 둘) · 틀리면 직원이 되물음 · 창을 닫아도 탁자 E로 다시
  function report(h) { const q = S().cur, e = en(); let stage = 0; const cells = [q.cell];
    for (let r = 50; r <= 400 && cells.length < 3; r += 25) for (let a = 0; a < 8 && cells.length < 3; a++) { const c = A.cell(q.x + Math.cos(a * 0.785 + r) * r, q.z + Math.sin(a * 0.785 + r) * r); if (c && !cells.includes(c)) cells.push(c); }
    const at = cells.slice().sort((a, b) => hashS(a + q.d) - hashS(b + q.d)), KD = KIND.slice().sort((a, b) => hashS(L(a[1]) + q.d) - hashS(L(b[1]) + q.d));
    const draw = () => '<h3>🏛 ' + (e ? 'Report something to fix' : '동네 고칠 곳 신고') + '</h3>' + (stage === 0
      ? '<div class="pc-tx">' + esc(e ? 'Clerk: “Where did you see it?”' : '직원: "어디에서 보았나요?"') + '</div><div class="sm">' + esc(e ? 'Pick the cell with the red dot (the place you looked at).' : '빨간 점(내가 살펴본 곳)이 있는 칸을 골라요.') + '</div><canvas class="pc-map" width="560" height="260"></canvas><div class="fx-ch">' + at.map((c, i) => '<button class="sub" data-at="' + i + '">' + esc(c + (e ? ' cell' : ' 칸')) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : stage === 1 ? '<div class="pc-tx">' + esc(e ? 'Clerk: “What was wrong there?”' : '직원: "무엇이 어떻게 되어 있었나요?"') + '</div><div class="fx-ch">' + KD.map((k, i) => '<button class="sub" data-w="' + i + '">' + esc(L(k[1])) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : '<div class="pc-tx">' + esc(e ? 'Clerk: “Thank you. Your request is received. The repair team will fix it tomorrow morning.”' : '직원: "알려 줘서 고마워요. 민원을 접수했어요. 내일 아침에 고치는 분들이 가서 고쳐요."') + '</div><div class="fx-wd">' + WORDS.map(w => '<div>📖 <b>' + esc(L(w[0])) + '</b> = ' + esc(L(w[1])) + '</div>').join('') + '</div>')
      + '<div class="row"><button class="' + (stage === 2 ? '' : 'sub') + '" data-a="x">' + (stage === 2 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'fixrep'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); if (stage === 0) { const cv = P.querySelector('canvas'); if (cv) A.mapSnip(cv, [{ x: q.x, z: q.z, label: e ? 'Looked here' : '내가 본 곳', main: true }, { x: h.door[0], z: h.door[1], label: e ? 'Centre' : '행정복지센터' }]); } };
    const msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const q9 = S().cur; if (!q9 || q9 !== q) { A.closeP(); return; }
      if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.at != null) { const c = at[+b.dataset.at]; if (c === q.cell) { stage = 1; sfx('ding'); paint(); return; } q.mis++; mark(); sfx('tick'); msg(e ? 'Clerk: “' + c + '? Please look again at which cell the red dot is in.”' : '직원: "' + c + ' 칸이요? 빨간 점이 있는 칸을 다시 봐 주세요."'); return; }
      if (b.dataset.w != null) { if (KD[+b.dataset.w][0]) { stage = 2; q.rep = day(); mark(); sfx('ding'); A.skUp('explore', 3, 'fix:report'); A.rec('fix', { ev: 'rep', cell: q.cell, mis: q.mis }); paint(); return; } q.mis++; mark(); sfx('tick'); msg(e ? 'Clerk: “Think back to what you saw when you looked closely.”' : '직원: "살펴볼 때 본 것을 다시 떠올려 봐요."'); } };
    paint(); }

  // ───────── 아침 소식 · 장소 찾기 ─────────
  //   news(d) = [{ k, t, at, two }] — 어제 알린 곳을 고침(내가 한 일) · 오늘 새로 생긴 곳(오늘만 · 칸만 · 자리 X)
  function news(d) { const s = S(); if (!s.cur && s.d !== d) plan(d); const out = [], q = s.cur;
    for (const o of [q, ...s.log]) { if (!o || o.rep !== d - 1) continue; out.push({ k: 'fix', t: T2('🔧 어제 알린 ' + o.cell + ' 칸 보도블록을 고쳤어요. 「고쳤어요」 판이 섰어요', '🔧 The paving you reported in ' + o.cell + ' was fixed. A “Fixed!” sign stands there'), at: [o.x, o.z] }); break; }
    if (q && !q.rep && q.d === d) out.push({ k: 'new', two: 1, t: T2('🚧 ' + q.cell + ' 칸 길가 인도에 깨진 보도블록이 있대요', '🚧 Someone saw broken paving on a pavement in ' + q.cell), at: null });
    return out; }
  function findList() { const q = S().cur; if (!q || !q.seen || q.rep || phase(q, day()) !== 'broken') return []; const h = hallNear(); if (!h) return []; const s9 = h.desk || { ex: h.door[0], ez: h.door[1] };
    return [{ icon: '🏛', t: en() ? 'Tell the community centre (' + q.cell + ' paving)' : '행정복지센터에 알리기 · ' + q.cell + ' 칸 보도블록', at: [s9.ex, s9.ez] }]; }
  function dispose() { dead = true; visDrop(); if (LOOKH) { LOOKH.remove(); LOOKH = null; } for (const o of HALLH) o.hot.remove(); HALLH = []; if (CLERK) { map.remove(CLERK.g); CLERK.g.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); CLERK = null; } if (css) { css.remove(); css = null; } }
  const meshN = g => { let n = 0; if (g) g.traverse(o => { if (o.isMesh) n++; }); return n; };
  return { sec, news, findList, dispose,
    info: () => { const q = S().cur; return { cur: q ? { ...q } : null, phase: phase(q, day()), d: S().d, skip: S().skip || null, log: S().log.slice(0, 3), meshes: meshN(VIS), clerk: meshN(CLERK && CLERK.g), look: LOOKH ? LOOKH.label || (LOOKH.hot && LOOKH.hot.label) : null, halls: HALLH.map(o => ({ name: o.h.name, ok: !!o.h.desk.ok, at: [+o.h.desk.ex.toFixed(1), +o.h.desk.ez.toFixed(1)], cell: A.cell(o.h.door[0], o.h.door[1]) })), dbg: DBG.slice() }; },
    dbg: { plan: () => { const s = S(); s.d = -1; s.cur = null; plan(day()); sync(); return s.cur; }, near: () => { const q = S().cur; if (!q) return false; const x = q.x + q.ux * 2.4, z = q.z + q.uz * 2.4; map.player.teleport([x, map.q.groundAt(x, z, A.gy(x, z) + 2) + 0.05, z]); return true; }, sync: () => { sec(); return VKEY; } } };
}
