// 🏡 내 집 꾸미기 · 선물 귀띔(COZY-1 · 사용자 10-24 차례 '가벼운 재미 — 꾸미기·선물' · 친구 거래·서버 규칙은 뺌 · 이 기기 안에서만)
//   꾸미기 = 우리 집 대문 앞 마당 자리 셋(town.js homeDeco가 고름 · 화분·칠판·선물·등과 1.3m 떨어짐 · 빈 자리는 안 보임)에 가방 물건 하나씩
//     놓을 수 있는 것 = 가게에서 산 물건(곰 인형·칠교·고누·티셔츠·모자·키링) · 주운 것·거둔 것(솔방울·조약돌·송이 돌·양털·마른 가지·옥수수)
//     놓기 = 가방에서 하나 빠짐(GAME.take) · 돌려놓기 = 가방으로 하나(옮김 'mv:deco' · 생김 아님 → rwCheck 밖 · 되팔기 구멍 X)
//     저장 = S.home.yard [e|null ×3](새로고침 뒤 그대로) · 놓으면 행적(deed 'deco') → 기억하는 이웃(town_nb)이 며칠 뒤 그 일을 말함
//     지나가는 이웃 = 하루 한 번 집 앞(14m 안)에서 몸 있는 사람(길 가는 어른 → 가까운 일꾼)이 놓은 것 하나를 두고 한마디(몸이 없으면 말 안 함)
//   선물 귀띔 = 이웃마다 들은 말(S.nbk[hk] = { l:[좋아함], n:싫어함 })을 가방 선물 창에 '이 이웃이 한 말'로 · 아직 못 들었으면 고르는 기준 한 줄(일하는 곳과 다른 곳에서 나는 것)
//     좋아하는 것을 주면 → 그 자리에서 기억 · 다음 아침 문 앞 답례(town.js nbMark 'like' · 하루 하나 그대로)
//     싫어하는 것을 주면 → 돌려받고(+0) 1.9초 뒤 그 이웃이 대신 반가운 것 하나를 귀띔(들은 말로 남음)
//   지키는 선: 매 프레임 일 0(1초 칸 sec) · 그리기 +1(인스턴스 메시 하나 · 새 Light X) · 아이 실명 X(이웃 = 자리·일) · 셈 X · 이모지는 줄 머리 하나
export const COZY_V = 1;
export const YARD_N = 3;
const W = 0x9a6a3e, WD = 0x6e4a2a, WL = 0xc49a6a, BK = 0xb07a3c, BKD = 0x8a5a2a;
const table = top => [[0.66, 0.05, 0.46, 0, 0.34, 0, WL], ...[[-0.28, -0.18], [0.28, -0.18], [-0.28, 0.18], [0.28, 0.18]].map(([x, z]) => [0.05, 0.34, 0.05, x, 0, z, WD]), ...top];
const basket = top => [[0.42, 0.2, 0.34, 0, 0, 0, BK], [0.46, 0.04, 0.38, 0, 0.2, 0, BKD], ...top];
/* 모양 = 상자 [폭, 높이, 깊이, 옆, 밑 높이, 앞, 색] · 옆 = 대문 옆 방향 · 앞 = 길 쪽 · 같은 쪽을 보는 두 면이 같은 평면에서 겹치지 않게(반짝임 X) */
export const DECO = {
  '🧸': { p: [[0.46, 0.06, 0.36, 0, 0.26, 0, WL], ...[[-0.18, -0.13], [0.18, -0.13], [-0.18, 0.13], [0.18, 0.13]].map(([x, z]) => [0.05, 0.26, 0.05, x, 0, z, WD]),
    [0.24, 0.26, 0.18, 0, 0.32, 0, 0xa8743f], [0.22, 0.2, 0.18, 0, 0.58, 0, 0xa8743f], [0.07, 0.07, 0.04, -0.08, 0.78, 0, 0x8a5a30], [0.07, 0.07, 0.04, 0.08, 0.78, 0, 0x8a5a30], [0.1, 0.07, 0.04, 0, 0.62, 0.11, 0xe8d8b8], [0.08, 0.08, 0.16, -0.07, 0.325, 0.12, 0xa8743f], [0.08, 0.08, 0.16, 0.07, 0.325, 0.12, 0xa8743f]],
    say: ['마당 의자에 곰 인형이 앉아 있네요. 지나갈 때마다 반가워요.', 'A teddy bear sitting in your yard. It makes me smile every time I pass.'] },
  '🧩': { p: table([[0.2, 0.02, 0.2, -0.16, 0.39, -0.06, 0xd94a4a], [0.14, 0.02, 0.22, 0.06, 0.39, 0.06, 0x5aa0d8], [0.12, 0.02, 0.12, 0.2, 0.39, -0.1, 0xf2c84b], [0.1, 0.02, 0.1, -0.12, 0.39, 0.14, 0x5fa04a]]),
    say: ['마당 탁자에 칠교 조각이 놓여 있네요. 저도 어릴 때 많이 맞춰 봤어요.', 'Tangram pieces on the yard table. I used to play that a lot as a kid.'] },
  '🔳': { p: table([[0.42, 0.03, 0.42, 0, 0.39, 0, 0xe8d4a8], ...[[-0.12, -0.12], [0, -0.12], [0.12, -0.12]].map(([x, z]) => [0.05, 0.03, 0.05, x, 0.42, z, 0xf4f1e8]), ...[[-0.12, 0.12], [0, 0.12], [0.12, 0.12]].map(([x, z]) => [0.05, 0.03, 0.05, x, 0.42, z, 0x2f2f33])]),
    say: ['마당에 고누 판이 있네요. 누가 이겼는지 궁금해요.', 'A gonu board in your yard. I wonder who won.'] },
  '👕': { p: [[0.06, 1.3, 0.06, -0.6, 0, 0, WD], [0.06, 1.3, 0.06, 0.6, 0, 0, WD], [1.14, 0.02, 0.02, 0, 1.2, 0, 0xeeeeee], [0.4, 0.34, 0.03, 0, 0.82, 0, 0x5aa0d8], [0.13, 0.12, 0.03, -0.265, 1.02, 0, 0x5aa0d8], [0.13, 0.12, 0.03, 0.265, 1.02, 0, 0x5aa0d8], [0.03, 0.07, 0.04, -0.12, 1.16, 0, 0xf2c84b], [0.03, 0.07, 0.04, 0.12, 1.16, 0, 0xf2c84b]],
    say: ['빨랫줄에 티셔츠가 걸려 있네요. 바람이 불면 펄럭이겠어요.', 'A T-shirt on the washing line. It will flap when the wind blows.'] },
  '🧢': { p: [[0.3, 0.06, 0.3, 0, 0, 0, 0x5e4026], [0.07, 1.05, 0.07, 0, 0, 0, WD], [0.2, 0.11, 0.2, 0, 1.05, 0, 0xc8453a], [0.16, 0.025, 0.12, 0, 1.055, 0.14, 0xc8453a]],
    say: ['모자 걸이에 빨간 모자가 걸려 있네요. 멀리서도 눈에 띄어요.', 'A red cap on the hat stand. You can spot it from far away.'] },
  '🔑': { p: [[0.26, 0.05, 0.26, 0, 0, 0, 0x5e4026], [0.07, 1.0, 0.07, 0, 0, 0, WD], [0.36, 0.24, 0.04, 0, 0.86, 0.055, WL], [0.06, 0.08, 0.03, 0, 0.92, 0.09, 0xe2b03a]],
    say: ['대문 옆에 열쇠 걸이가 생겼네요. 이제 열쇠 찾을 일이 줄겠어요.', 'A key rack by the gate. No more hunting for keys.'] },
  '🌰': { p: basket([[0.09, 0.12, 0.09, -0.1, 0.24, -0.05, 0x7a4a2a], [0.09, 0.12, 0.09, 0.08, 0.24, -0.06, 0x8a5a32], [0.09, 0.12, 0.09, 0, 0.24, 0.08, 0x6e4026], [0.09, 0.12, 0.09, 0.12, 0.24, 0.08, 0x8a5a32]]),
    say: ['솔방울 바구니네요. 숲에서 하나씩 주워 왔군요.', 'A basket of pine cones. You picked them up one by one in the woods.'] },
  '⚪': { p: [...[0, 1, 2, 3, 4, 5, 6].map(i => { const a = i / 7 * Math.PI * 2; return [0.15, 0.08, 0.11, +(Math.cos(a) * 0.32).toFixed(3), 0, +(Math.sin(a) * 0.32).toFixed(3), i % 2 ? 0xc9c6bd : 0xaaa79e]; }), [0.03, 0.22, 0.03, 0, 0, 0, 0x477f3a], [0.09, 0.07, 0.09, 0, 0.22, 0, 0xf2c84b]],
    say: ['조약돌로 둘레를 꾸몄네요. 가운데 꽃이 더 잘 보여요.', 'You edged it with pebbles. The flower in the middle stands out.'] },
  '⚫': { p: [[0.34, 0.14, 0.3, 0, 0, 0, 0x3d3a3a], [0.24, 0.12, 0.2, 0.02, 0.14, 0.01, 0x4a4646], [0.12, 0.1, 0.12, -0.01, 0.26, 0, 0x2f2f33]],
    say: ['송이 돌을 쌓아 두었네요. 구멍이 숭숭 나서 가벼운 돌이지요.', 'A pile of scoria stones. All those little holes make them light.'] },
  '🧶': { p: basket([[0.24, 0.18, 0.22, 0, 0.205, 0, 0xf4f1e8]]),
    say: ['바구니에 양털이 담겨 있네요. 목장 일을 거들고 받은 거지요.', 'Wool in a basket. That’s from helping at the pasture.'] },
  '🍂': { p: [[0.6, 0.1, 0.1, 0, 0, -0.11, W], [0.6, 0.1, 0.1, 0, 0, 0, 0x8a5a32], [0.6, 0.1, 0.1, 0, 0, 0.11, W], [0.6, 0.1, 0.1, 0, 0.1, -0.055, 0x8a5a32], [0.6, 0.1, 0.1, 0, 0.1, 0.055, W], [0.04, 0.24, 0.34, -0.2, 0, 0, 0x5e4026], [0.04, 0.24, 0.34, 0.2, 0, 0, 0x5e4026]],
    say: ['마른 가지를 단으로 묶어 두었네요. 겨울에 불 피울 때 좋겠어요.', 'Dry twigs tied in a bundle. Good for lighting a fire in winter.'] },
  '🌽': { p: [[0.06, 1.2, 0.06, -0.35, 0, 0, WD], [0.06, 1.2, 0.06, 0.35, 0, 0, WD], [0.64, 0.05, 0.05, 0, 1.12, 0, W], ...[-0.18, 0, 0.18].map(x => [0.09, 0.28, 0.09, x, 0.84, 0, 0xf2c230])],
    say: ['옥수수를 걸어 말리네요. 바람이 잘 통해야 잘 말라요.', 'Corn hung up to dry. It dries well where the wind can get through.'] },
};
const ORDER = Object.keys(DECO);
const GET = { goods: ['가게(도시 상점·놀이 도구 가게)에서 산 물건', 'things from shops (gift shop, games shop)'], wild: ['숲에서 주운 솔방울·조약돌·마른 가지', 'pine cones, pebbles and twigs from the woods'] };
const GRP = { f: ['들에서 일하는 이웃이에요. 산이나 바다에서 나는 것을 반가워할지 몰라요.', 'This neighbour works in the fields. Things from the mountains or the sea might be welcome.'],
  m: ['산에서 일하는 이웃이에요. 들이나 바다에서 나는 것을 반가워할지 몰라요.', 'This neighbour works in the mountains. Things from the fields or the sea might be welcome.'],
  s: ['바다에서 일하는 이웃이에요. 들이나 산에서 나는 것을 반가워할지 몰라요.', 'This neighbour works by the sea. Things from the fields or the mountains might be welcome.'] };
const hs = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const jo = (s, a, b) => { const c = (s || '').charCodeAt((s || '').length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 ? a : b; };

export function createCozy(A) {
  const { map, T3 } = A, en = () => A.lang() === 'en', L = a => a[en() ? 1 : 0], G = () => A.GAME, S = () => A.GAME.S, day = () => S().day | 0;
  const H = () => { const h = S().home; if (!h || typeof h !== 'object') return null; if (!Array.isArray(h.yard)) h.yard = [null, null, null]; return h; };
  const KN = () => { const s = S(); if (!s.nbk || typeof s.nbk !== 'object') s.nbk = {}; return s.nbk; };
  const nm = e => A.itemName(e, en());
  const REC = {}, rec = k => { REC[k] = (REC[k] || 0) + 1; };
  let M = null, HOTS = [], COLS = [], dead = false, LASTSAY = null, LASTTIP = null, TIPT = 0;
  const O = new T3.Object3D(), CL = new T3.Color();
  // ── 짓기(우리 집이 지어질 때 · 다시 지을 때) ──
  function drop() { for (const h of HOTS) h.remove(); HOTS = []; for (const c of COLS) c.remove(); COLS = []; if (M) { if (M.parent) M.parent.remove(M); M.geometry.dispose(); M.material.dispose(); M.dispose(); M = null; } }
  function build() { drop(); if (dead || window.SM_PROMO) return; const h = A.home(), root = A.root(); if (!h || !h.yd.length || !root) return;
    M = new T3.InstancedMesh(new T3.BoxGeometry(1, 1, 1), new T3.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), YARD_N * 14); M.count = 0; M.frustumCulled = true; M.matrixAutoUpdate = false; M.userData.fx = 1; root.add(M);
    h.yd.forEach((p, i) => { const hot = map.interact.add({ kind: 'game', x: p[0], z: p[2], y: p[1], r: 1.25, label: '🏡', use: () => open(i) }); HOTS.push(hot); A.enth.push(hot); });
    sync(); }
  const placeable = () => { const B = A.bag(); return ORDER.filter(e => B[e] > 0); };
  function labels() { const Y = H(), any = placeable().length > 0; HOTS.forEach((h, i) => { const e = Y && Y.yard[i]; h.hot.off = !e && !any; h.hot.label = e ? '🏡 ' + (en() ? 'Yard — ' + nm(e) : '마당 꾸미기 — ' + nm(e)) : '🏡 ' + (en() ? 'Yard — put something here' : '마당 꾸미기 — 빈 자리'); }); }
  function sync() { const h = A.home(), Y = H(); if (!M || !h || !Y) return; for (const c of COLS) c.remove(); COLS = []; let k = 0; const ry = h.ry, c = Math.cos(ry), sn = Math.sin(ry);
    h.yd.forEach((p, i) => { const e = Y.yard[i], D = e && DECO[e]; if (!D) return; let top = 0;
      for (const [w, hh, d, x, y, z, col] of D.p) { const wx = p[0] + x * c + z * sn, wz = p[2] - x * sn + z * c; O.rotation.set(0, ry, 0); O.position.set(wx, p[1] + y + hh / 2, wz); O.scale.set(w, hh, d); O.updateMatrix(); M.setMatrixAt(k, O.matrix); M.setColorAt(k++, CL.setHex(col)); top = Math.max(top, y + hh); }
      COLS.push(map.collider.add({ x0: p[0] - 0.28, x1: p[0] + 0.28, z0: p[2] - 0.28, z1: p[2] + 0.28, y0: p[1], y1: p[1] + Math.max(0.3, top), nc: true })); });   /* 몸이 뚫고 지나가지 않게(작은 상자 하나) */
    M.count = k; M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true; M.computeBoundingSphere(); labels(); }
  // ── 창(그 자리 하나만 · 한 번에 한 동작) ──
  function open(i) { const Y = H(); if (!Y || !A.home()) return; const e9 = en(), e = Y.yard[i], P = placeable(), B = A.bag();
    let h = '<h3>🏡 ' + (e9 ? 'Our yard' : '우리 집 마당 꾸미기') + '</h3><div class="sm">' + (e9 ? 'Put one thing from your bag here. It stays when you come back.' : '가방 물건 하나를 이 자리에 놓아요. 다음에 와도 그대로 있어요.') + '</div>';
    if (e) h += '<div class="st" data-cz="here"><b class="n">' + e + '</b><span>' + (e9 ? 'Here now: ' : '지금 이 자리: ') + A.esc(nm(e)) + '</span><button class="sub" data-back="' + i + '" style="min-height:34px;padding:4px 10px">' + (e9 ? 'Back to bag' : '가방으로') + '</button></div>';
    if (P.length) h += '<div class="grp">' + (e ? (e9 ? 'Swap for' : '바꿔 놓기') : (e9 ? 'Put here' : '여기에 놓기')) + '</div><div class="row">' + P.map(q => '<button data-put="' + q + '" data-at="' + i + '">' + q + ' ' + A.esc(nm(q)) + ' <small>×' + B[q] + '</small></button>').join('') + '</div>';
    else h += '<div class="sm" data-cz="none">' + (e9 ? 'Nothing to put out yet. Try ' + GET.goods[1] + ' or ' + GET.wild[1] + '.' : '아직 놓을 것이 없어요. ' + GET.goods[0] + '이나 ' + GET.wild[0] + '를 가져와요.') + '</div>';
    h += '<div class="row"><button class="sub" data-a="x">' + (e9 ? 'Close' : '닫기') + '</button></div>';
    const P9 = A.openP(h, false, 'cozy'); P9.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; } if (b.dataset.put) put(+b.dataset.at, b.dataset.put); else if (b.dataset.back) back(+b.dataset.back); }; rec('open'); return true; }
  function put(i, e) { const Y = H(), h = A.home(); if (!Y || !h || !h.yd[i] || !DECO[e]) return false; if (!G().take(e, 1)) return false; const old = Y.yard[i]; if (old) G().add(old, 1, 'mv:deco');
    Y.yard[i] = e; Y.ylast = e; G().mark(); sync(); A.bagShow(); A.closeP(); A.sfx('pop'); const p = h.yd[i]; A.deed('deco', p[0], p[2], e); rec('put');
    A.say('🏡 ' + (en() ? 'Put ' + nm(e) + ' in the yard. It stays there next time too.' : '마당에 ' + nm(e) + jo(nm(e), '을', '를') + ' 놓았어요. 다음에 와도 그대로 있어요.') + (old ? (en() ? ' (' + nm(old) + ' → bag)' : ' (' + nm(old) + '는 가방으로)') : ''), 3); return true; }
  function back(i) { const Y = H(); if (!Y || !Y.yard[i]) return false; const e = Y.yard[i]; Y.yard[i] = null; G().add(e, 1, 'mv:deco'); G().mark(); sync(); A.bagShow(); A.bagPop(e, 1); A.closeP(); A.sfx('tick'); rec('back');
    A.say('🎒 ' + (en() ? nm(e) + ' is back in the bag' : nm(e) + jo(nm(e), '을', '를') + ' 가방에 넣었어요'), 2.4); return true; }
  // ── 1초 칸: 첫 귀띔 한 번 · 지나가는 이웃 한마디(하루 한 번 · 몸 있는 사람만) ──
  function sec(me) { if (dead || !A.on() || !M || !me) return; const Y = H(), h = A.home(); if (!Y || !h || !h.door) return; labels(); if (A.busy() || A.panelOpen()) return;
    const dd = Math.hypot(me.x - h.door[0], me.z - h.door[1]); if (dd > 14) return;
    if (!Y.yh && dd < 8 && placeable().length && !Y.yard.some(Boolean)) { Y.yh = 1; G().mark(); A.say('🏡 ' + (en() ? 'You can put things from your bag in the yard spots by the gate (E)' : '대문 앞 마당 자리에 가방 물건을 놓을 수 있어요 (E)'), 3.6); return; }
    talk(me, false); }
  function talk(me, force) { const Y = H(); if (!Y) return null; const L9 = Y.yard.filter(Boolean); if (!L9.length || (!force && (Y.yc === day() || A.bubbleBusy()))) return null;
    let who = null, o = null; const h = A.home(), c0 = h && h.door ? h.door : [me.x, me.z], g = A.ped(c0[0], c0[1], 28);   /* 집 앞 길을 지나는 어른(대문에서 28m 안 · 길가 보도) */ if (g) { who = 'ped'; o = { x: g.x, y: me.y, z: g.z, sc: g.sc || 1 }; g.gest = 3.4; }
    else { let b = null, bd = 18; for (const w of A.workers() || []) { if (w.rep === false || w.party) continue; const d = Math.hypot(w.x - me.x, w.z - me.z); if (d < bd && Math.abs((w.g || 0) - me.y) < 4) { bd = d; b = w; } } if (b) { who = 'worker'; o = { x: b.x, y: b.g, z: b.z, sc: 1 }; } }
    if (!o) return null;   /* 말하는 이는 몸이 있어야(몸 없으면 다음 1초에 다시) */
    const e = Y.ylast && L9.includes(Y.ylast) && Y.ysay !== Y.ylast ? Y.ylast : L9[hs(day() + ':yard') % L9.length], t = L(DECO[e].say);
    A.bubble(o, t); Y.yc = day(); Y.ysay = e; G().mark(); LASTSAY = { t, who, e, d: day() }; rec('talk'); return LASTSAY; }
  // ── 선물 귀띔 ──
  function heard(hk, k, e) { if (!hk || !e) return; const K = KN(), q = K[hk] || (K[hk] = { l: [], n: '' }); if (!Array.isArray(q.l)) q.l = [];
    if (k === 'l') { if (!q.l.includes(e)) { q.l.push(e); if (q.l.length > 4) q.l.shift(); } } else if (k === 'n') q.n = e; G().mark(); }
  function noTip(w, hk, e) { heard(hk, 'n', e); const lk = (A.likes(w.k) || []).filter(q => q !== e); if (!lk.length) return; const x = lk[hs(hk + ':cz') % lk.length], r = A.repOf(w) || w; clearTimeout(TIPT);
    TIPT = setTimeout(() => { if (dead || !A.alive()) return; heard(hk, 'l', x); const t = A.nbSay('tip', hk, { t: en() ? 'Instead, ' + nm(x) + ' would be lovely. We don’t get much of it around here.' : '그 대신 ' + nm(x) + jo(nm(x), '이', '가') + ' 반가워요. 우리 동네엔 잘 안 나거든요.' }) || (en() ? nm(x) + ' would be lovely.' : nm(x) + jo(nm(x), '이', '가') + ' 반가워요.');
      A.bubble({ x: r.x, y: r.g, z: r.z, sc: 1 }, t); LASTTIP = { hk, no: e, like: x, t }; rec('tip'); }, 1900); }
  function note(w, hk) { if (!w) return ''; const q = KN()[hk], e9 = en(), said = [];
    if (q && q.l && q.l.length) said.push(e9 ? '“' + q.l.map(nm).join(', ') + ' would be lovely.”' : '“' + q.l.map(nm).join('·') + jo(nm(q.l[q.l.length - 1]), '이', '가') + ' 반가워요.”');
    if (q && q.n) said.push(e9 ? '“I can’t really eat ' + nm(q.n) + '.”' : '“' + nm(q.n) + jo(nm(q.n), '은', '는') + ' 잘 못 먹어요.”');
    if (said.length) return '<div class="sm" data-cz="note" style="color:#5a3a6b">💬 ' + (e9 ? 'This neighbour said: ' : '이 이웃이 한 말: ') + A.esc(said.join(' ')) + '</div>';
    const g = GRP[A.likeGrp(w.k)]; return g ? '<div class="sm" data-cz="rule" style="color:#5a3a6b">💬 ' + A.esc(L(g)) + '</div>' : ''; }
  function mark(w, hk, e) { const q = KN()[hk]; if (!q) return ''; if (q.l && q.l.includes(e)) return ' 💖'; if (q.n === e) return en() ? ' (can’t eat)' : ' (못 먹어요)'; return ''; }
  function regTag(e) { const r = (A.items()[e] || [])[4]; return r ? '<br><small>' + (en() ? 'from: ' : '나는 곳 ') + A.esc(r) + '</small>' : ''; }
  function init() { if (window.SM_PROMO) return; dead = false; if (A.home() && !M) build(); }
  function dispose() { dead = true; clearTimeout(TIPT); drop(); }
  const API = { info: () => { const Y = H(), h = A.home(); return { slots: h ? h.yd.map(p => p.map(v => +v.toFixed(2))) : [], yard: Y ? Y.yard.slice() : null, n: M ? M.count : 0, on: !!M, cols: COLS.length, hots: HOTS.map(x => ({ label: x.hot.label, off: !!x.hot.off })), nbk: JSON.parse(JSON.stringify(KN())), say: LASTSAY, tip: LASTTIP, rec: { ...REC }, yc: Y ? Y.yc || 0 : 0 }; },
    put: (i, e) => put(i, e), back: i => back(i), open: i => open(i), talk: (me, f) => talk(me, f), note: (w, hk) => note(w, hk), mark: (w, hk, e) => mark(w, hk, e), giftPick: () => A.giftPick(), deco: () => ORDER.slice() };
  return { init, build, drop, dispose, sync, sec, heard, noTip, note, mark, regTag, rec, api: API };
}
