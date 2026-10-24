// 🏢 빈 건물에 할 일(BLDG-1 · 코덱스 10-24 표 13줄 '기존 놀이·창구를 역할이 맞는 건물 2~3곳에 연결' · 사용자 10-24 '빈 건물이 생각보다 많아')
//   경찰서 👮 = 112 신고 연습(긴급 출동 119 신고 창과 같은 번호판 꼴 · 상황 셋 + 위치 말하기) · 길 잃은 아이를 도운 뒤 들어가면 경찰관이 고맙다는 말 → 칭찬 게시판에 붙음
//   병원·보건소·보건실 🩹 = 응급 처치 배우기(긴급 출동 119 처치에서 쓴 것 그대로 · 문제 셋) · 넘어진 이웃을 도운 뒤 들어가면 나은 이웃이 기다리는 의자에 있음(E = 인사)
//   동물보호센터 🥣 = 하루 한 번 밥 주기(강아지·고양이 그릇에 알맞은 사료 고르기 → 그릇이 차고 강아지가 반김)
//   눈에 보이는 결과: 칭찬 게시판·응급 처치 판 글이 바뀜(캔버스 한 장) · 밥그릇이 참 · 나은 이웃의 몸
//   지킴: 판타지 X · 전투 X · 실명 X(경찰관·간호사·동물보호사·이웃 = 이름 없는 역할 · 몸 있음) · 피 X · 보상 = 솜씨만(꼬리표 bldg:<곳> → rwCheck 한 문 · 하루 한 번)
//   렉: 매 프레임 일 0 · 새 Light X · 방은 들어갈 때만 지음(town_indoor.js KIT) · 판 = 캔버스 한 장(나오면 버림) · 밥 = 합친 부품 1
export const BD_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// 건물 이름 → 방 갈래(town.js pubIn이 부름 · 동물병원은 보호센터 동물만 쓰는 곳이라 들어가지 않음)
export const bldgKind = nm => { const t = String(nm || ''); if (/경찰|파출소|지구대/.test(t)) return 'police'; if (/동물보호|보호 ?센터/.test(t)) return 'shelter'; if (/동물/.test(t)) return null; if (/병원|의원|보건소|보건실|진료소/.test(t)) return 'clinic'; return null; };
// 문 연 때(docs/systems/town_hours.md) — 경찰서 = 늘(24시간)
export const BD_HRS = { police: null, clinic: [9, 18], shelter: [10, 17] };
const TIP = { police: T2('112 신고 연습', '112 call practice'), clinic: T2('응급 처치 배우기', 'Learn first aid'), shelter: T2('동물 밥 주기', 'Feed the animals') };
const FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const CSS = `.twn-p .bd-pad{display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center;margin:8px 0}.twn-p .bd-pad button{min-height:52px;font-size:22px;padding:0}
.twn-p .bd-num{font:900 28px/1.2 ui-monospace,Menlo,monospace;text-align:center;letter-spacing:6px;min-height:36px;border:3px solid var(--ink,#2b2420);border-radius:10px;background:#fff;margin:4px auto;width:200px}
.twn-p .bd-ch{display:grid;gap:8px;margin:6px 0}.twn-p .bd-ch button{min-height:48px;font-size:15px;text-align:left}
.twn-p .bd-sit{background:#fff8dc;border:2px solid #b07a00;border-radius:12px;padding:8px 12px;margin:6px 0;font-size:16px;line-height:1.5}
.twn-p .bd-wd{background:#fffdf2;border:2px dashed #c9b27a;border-radius:12px;padding:6px 10px;margin:6px 0;font-size:15px;line-height:1.5}`;

// 112 연습 상황(실제 신고 번호 규칙만 · 무섭게 쓰지 않음)
const SIT = [
  [112, T2('시장에서 어린 동생이 엄마를 잃어버리고 울고 있어요.', 'At the market a little child has lost their mum and is crying.')],
  [119, T2('이웃이 계단에서 넘어져 발목을 다쳤어요. 일어나지 못해요.', 'A neighbour fell on the stairs and hurt an ankle. They cannot get up.')],
  [119, T2('옆집 창문에서 검은 연기가 나와요.', 'Black smoke is coming out of the window next door.')],
  [112, T2('학교 앞에 세워 둔 자전거가 없어졌어요.', 'The bike I left in front of school is gone.')],
  [112, T2('큰길 신호등이 꺼져서 차들이 엉켜 있어요.', 'The traffic lights on the main road are off and cars are stuck.')],
  [119, T2('더운 날 할머니가 길가에 주저앉아 어지럽다고 해요.', 'On a hot day a grandma sat down by the road and says she is dizzy.')],
];
const WHERE = [[1, T2('어디인지(칸 이름 · 가까운 건물)', 'Where it is (the cell · a building nearby)')], [0, T2('내가 좋아하는 음식', 'My favourite food')], [0, T2('오늘 날씨', 'Today’s weather')]];
// 응급 처치 문제(긴급 출동 119 처치 글과 같은 내용)
const AID = [
  [T2('발목을 삐었어요. 다친 발은 어떻게 할까요?', 'An ankle is twisted. What do we do with the hurt foot?'), [T2('움직이지 않고 차갑게 대요', 'Keep it still and cool it'), T2('세게 주물러 풀어요', 'Rub it hard'), T2('걸으면서 풀어요', 'Walk it off')], T2('다친 곳은 움직이면 더 아파요. 차갑게 대면 붓기가 덜해요.', 'Moving it hurts more. Cooling it keeps the swelling down.')],
  [T2('차갑게 댄 다음에는 다친 발을 어떻게 둘까요?', 'After cooling it, where should the hurt foot go?'), [T2('가방 같은 것으로 받쳐 높이 올려요', 'Prop it up high, on a bag for example'), T2('뜨거운 물에 담가요', 'Put it in hot water'), T2('바닥에 끌고 다녀요', 'Drag it along the floor')], T2('다친 곳을 심장보다 높이 두면 덜 부어요.', 'Raising it above the heart keeps the swelling down.')],
  [T2('더위를 먹고 어지러워해요. 먼저 어디로 옮길까요?', 'Someone is dizzy from the heat. Where do we move them first?'), [T2('시원한 그늘로', 'Into cool shade'), T2('햇볕이 드는 곳으로', 'Into the sunshine'), T2('달려서 집까지', 'Run all the way home')], T2('더위를 먹으면 몸을 먼저 식혀야 해요.', 'With heat sickness the body must cool down first.')],
  [T2('더위 먹은 이웃이 정신이 또렷해요. 무엇을 줄까요?', 'The neighbour with heat sickness is fully awake. What do we give?'), [T2('시원한 물', 'Cool water'), T2('뜨거운 국', 'Hot soup'), T2('아무것도 주지 않아요', 'Nothing at all')], T2('정신이 또렷하면 물을 조금씩 마시게 해요. 정신이 흐리면 아무것도 먹이지 않고 119를 기다려요.', 'If they are fully awake, give sips of water. If not, give nothing and wait for 119.')],
];
const FOOD = [T2('강아지 사료', 'Dog food'), T2('고양이 사료', 'Cat food'), T2('초콜릿 과자', 'Chocolate biscuits')];
const WORDS = {
  police: [[T2('신고', 'Report'), T2('도움이 필요한 일을 경찰서·소방서 같은 곳에 알리는 것', 'Telling the police or fire station about something that needs help')]],
  clinic: [[T2('응급 처치', 'First aid'), T2('구급대원이 오기 전에 다친 사람을 먼저 돌보는 것', 'Caring for a hurt person before the paramedics arrive')]],
  shelter: [[T2('입양', 'Adoption'), T2('보호하던 동물을 새 가족이 맞아 기르는 것', 'When a new family takes home an animal that was in care')]],
};

// 마을 쪽이 넘기는 것(A): GAME · T3 · lang() · esc · openP(h, wide, kind) · closeP() · panelOpen() · say(t, s) · sfx(k) · dialog(o) · bubble(o, t) · skUp(k, n, src) · rec(k, o) · open(h0, h1)
export function createBldg(A) {
  const T3 = A.T3, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t), day = () => A.GAME.S.day | 0, mark = () => A.GAME.mark(), sfx = k => A.sfx(k), toast = (t, s) => A.say(t, s);
  const S = () => { const g = A.GAME.S; let s = g.bldg; if (!s || typeof s !== 'object' || s.v !== BD_V) s = g.bldg = { v: BD_V, police: {}, clinic: {}, shelter: {} }; for (const k of ['police', 'clinic', 'shelter']) if (!s[k] || typeof s[k] !== 'object') s[k] = {}; return s; };
  let css = null, CUR = null, DBG = [];
  if (!document.getElementById('bd-css')) { css = document.createElement('style'); css.id = 'bd-css'; css.textContent = CSS; document.head.appendChild(css); }
  const log = t => { DBG.push(t); if (DBG.length > 20) DBG.shift(); };
  const emLog = () => { const e = A.GAME.S.emerg; return e && Array.isArray(e.log) ? e.log : []; };
  const keyOf = q => q.k + ':' + q.d + ':' + q.x + ',' + q.z;
  const ago = n => en() ? (n === 1 ? 'yesterday' : n + ' days ago') : (n === 1 ? '어제' : n === 2 ? '그저께' : '사흘 전');
  // 도운 일 가운데 아직 인사를 못 받은 것(어제~사흘 전 · 오늘 일은 다음 날부터)
  const pending = (k, seen) => { const D = day(); return emLog().find(q => q && q.k === k && q.ok && q.d < D && D - q.d <= 3 && !(seen || []).includes(keyOf(q))) || null; };
  const helped = k => emLog().filter(q => q && q.k === k && q.ok).length;
  const open = k => { const H = BD_HRS[k]; return !H || A.open(H[0], H[1]); };
  const hh = h => String(h).padStart(2, '0') + ':00';

  // ───────── 바깥(town.js) 연결 ─────────
  function tip(k) { return TIP[k] ? L(TIP[k]) : ''; }
  function canIn(k, B9) { if (!BD_HRS[k] || open(k)) return true; const nm = (B9 && B9.name) || '', H = BD_HRS[k]; toast('🌙 ' + (en() ? nm + ' is closed now. It opens at ' + hh(H[0]) + '.' : nm + '은 지금 문을 닫았어요. ' + hh(H[0]) + '에 열어요.'), 3); return false; }
  function opts(B9, k) { if (!TIP[k]) return {}; return { room: (at, K) => build(k, at, K, B9), onExtra: kk => use(kk) }; }
  function left() { if (!CUR) return; if (CUR.board) { CUR.board.m.material.map.dispose(); CUR.board.m.material.dispose(); } CUR = null; }   /* 방 모양(geometry)은 town_indoor exit()이 치움 · 캔버스 재질만 여기서 */

  // ───────── 벽 판(캔버스 한 장 · 글이 바뀌면 다시 그림) ─────────
  function boardMesh(K, S9, x, y, z, ry, w, h) { const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2;
    const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ map: tx })); m.position.set(S9.at[0] + x, S9.at[1] + y, S9.at[2] + z); m.rotation.y = ry; m.updateMatrix(); m.matrixAutoUpdate = false; m.userData.fx = 1; (S9.extra || (S9.extra = [])).push(m); return { m, c, tx }; }
  function boardDraw() { if (!CUR || !CUR.board) return; const { c, tx } = CUR.board, g = c.getContext('2d'), W = c.width, H = c.height, e = en(), k = CUR.k, s = S()[k], D = day();
    g.fillStyle = '#c8945a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.fillRect(10, 10, W - 20, H - 20); g.fillStyle = '#2b2420'; g.textAlign = 'left'; g.textBaseline = 'top';
    const title = k === 'police' ? (e ? 'Praise board' : '칭찬 게시판') : k === 'clinic' ? (e ? 'First aid board' : '응급 처치 판') : (e ? 'Waiting for a new family' : '새 가족을 기다려요');
    g.font = '900 40px ' + FONT; g.fillText(title, 28, 24); const lines = [];
    if (k === 'police') { if (s.d112) lines.push(['★', e ? '112 helper: practised ' + (s.n112 | 0) + ' time(s)' : '112 어린이 도우미 · 연습 ' + (s.n112 | 0) + '번']); const n = helped('lost'); if (n) lines.push(['♥', e ? 'Helped ' + n + ' lost child(ren) find family' : '길 잃은 아이 ' + n + '명을 가족에게']); if ((s.thx || []).length) lines.push(['✉', e ? 'Thank-you notes from families: ' + s.thx.length : '아이 가족이 보낸 고맙다는 쪽지 ' + s.thx.length + '장']); if (!lines.length) lines.push(['·', e ? 'Practise 112 calls at the counter.' : '창구에서 112 신고를 연습해요.']); }
    else if (k === 'clinic') { if (s.dfa) { lines.push(['✓', e ? 'Twisted ankle: keep still, cool, raise' : '발목을 삐면: 움직이지 않기, 차갑게, 높이']); lines.push(['✓', e ? 'Heat sickness: shade, water, fan' : '더위를 먹으면: 그늘, 물, 부채질']); } const n = (s.hi || []).length; if (n) lines.push(['♥', e ? 'Neighbours who got better and said thanks: ' + n : '나아서 고맙다고 한 이웃 ' + n + '명']); if (!lines.length) lines.push(['·', e ? 'Learn first aid with the nurse.' : '간호사 선생님께 응급 처치를 배워요.']); }
    else { lines.push(['♥', e ? 'Dogs 3 and cats 2 are waiting' : '강아지 셋, 고양이 둘이 기다려요']); lines.push([s.fed === D ? '✓' : '·', s.fed === D ? (e ? 'Fed today. Thank you!' : '오늘 밥을 먹었어요. 고마워요!') : (e ? 'Not fed yet today' : '오늘 아직 밥을 못 먹었어요')]); if (s.n) lines.push(['★', e ? 'Meals you gave: ' + s.n : '내가 준 밥 ' + s.n + '번']); }
    g.font = '800 30px ' + FONT; lines.slice(0, 4).forEach(([ic, t], i) => { const y = 92 + i * 52; g.fillStyle = ic === '·' ? '#8a8f99' : '#b5483a'; g.fillText(ic, 30, y); g.fillStyle = '#2b2420'; let tt = t; while (g.measureText(tt).width > W - 110 && tt.length > 4) tt = tt.slice(0, -1); g.fillText(tt === t ? t : tt + '…', 68, y); });
    tx.needsUpdate = true; }

  // ───────── 방 짓기(로컬 = 방 가운데 · 문 = 앞벽 +z · 뒤 = −z) ─────────
  const LP = (x, z, ry) => (lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
  function dog(K, S9, x, z, y, ry, hex) { const Q = LP(x, z, ry), P = (k, lx, ly, lz, sx, sy, sz, c, rx) => { const [a, b] = Q(lx, lz); K.part(S9, k, a, y + ly, b, sx, sy, sz, c, 0, ry, rx || 0); }, dk = 0x2b2b2b;
    for (const [a, b] of [[-0.1, 0.22], [0.1, 0.22], [-0.1, -0.22], [0.1, -0.22]]) P('b', a, 0, b, 0.08, 0.26, 0.08, hex); P('b', 0, 0.24, 0, 0.3, 0.26, 0.66, hex); P('b', 0, 0.4, 0.36, 0.26, 0.26, 0.26, hex);
    P('b', 0, 0.42, 0.52, 0.13, 0.11, 0.1, hex); P('b', 0, 0.49, 0.575, 0.05, 0.04, 0.02, dk); for (const s9 of [-1, 1]) { P('b', s9 * 0.07, 0.55, 0.495, 0.035, 0.035, 0.02, dk); P('b', s9 * 0.1, 0.6, 0.33, 0.06, 0.12, 0.08, 0x6b4a2f); } P('b', 0, 0.42, -0.42, 0.05, 0.05, 0.2, hex, -0.6); }   /* 강아지(마을 마당 강아지와 같은 상자 꼴 · 귀 · 눈 · 꼬리) */
  function cat(K, S9, x, z, y, ry, hex) { const Q = LP(x, z, ry), P = (k, lx, ly, lz, sx, sy, sz, c, rx) => { const [a, b] = Q(lx, lz); K.part(S9, k, a, y + ly, b, sx, sy, sz, c, 0, ry, rx || 0); };
    for (const [a, b] of [[-0.07, 0.15], [0.07, 0.15], [-0.07, -0.15], [0.07, -0.15]]) P('b', a, 0, b, 0.06, 0.18, 0.06, hex); P('b', 0, 0.17, 0, 0.22, 0.19, 0.44, hex); P('b', 0, 0.28, 0.27, 0.2, 0.19, 0.18, hex);
    for (const s9 of [-1, 1]) { P('k', s9 * 0.06, 0.47, 0.27, 0.045, 0.09, 0, hex); P('b', s9 * 0.05, 0.4, 0.365, 0.03, 0.03, 0.02, 0x2b2b2b); } P('b', 0, 0.3, -0.25, 0.04, 0.3, 0.04, hex, -0.3); }   /* 고양이(뾰족 귀 · 선 꼬리) */
  const bowl = (K, S9, x, z, c) => K.part(S9, 'c16', x, 0.012, z, 0.13, 0.055, 0, c);

  function build(k, at, K, B9) { left(); const name = (B9 && B9.name) || '', made = k === 'police' ? roomPolice(at, K, name) : k === 'clinic' ? roomClinic(at, K, name) : roomShelter(at, K, name); CUR = { k, at, name, made, board: made.board || null, food: made.food || null }; boardDraw(); log('build ' + k); return made; }
  function roomPolice(at, K, name) { const W = 11, D = 9, H = 3.4, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], navy = 0x2b3a5c;
    const S9 = K.shell(at, W, D, H, { wall: 0xf1f3f6, wains: navy, winY: [], noLights: true, ft: ['tile', 1.0, 0xe9edf2] }), P = S9.put; S9.ac = K.cs(navy);
    { const cx = -1.0, zc = -hd + 1.5; P('b', cx, 0, zc, 4.4, 1.0, 0.6, 0xf6f4ee); P('b', cx, 0.1, zc + 0.306, 4.3, 0.5, 0.012, 0x3d5a8a); P('b', cx, 1.0, zc, 4.46, 0.04, 0.66, 0xd8dce0); K.colL(S9, cx, zc, 2.23, 0.33, -0.5, 1.1);   // 민원 창구 탁자
      P('b', cx + 1.3, 1.04, zc - 0.05, 0.42, 0.3, 0.05, 0x2b2d31); P('b', cx + 1.3, 1.08, zc - 0.022, 0.36, 0.22, 0.012, 0x7fb8e0, 1); P('b', cx - 1.2, 1.04, zc, 0.32, 0.02, 0.24, 0xffffff);   // 화면(빛) · 종이
      K.sign(S9, en() ? 'Help desk' : '민원 창구', cx, 0.42, zc + 0.33, 0, 1.4, 0.26, { bg: '#3d5a8a', fr: false }); K.standGuest(S9, ox + cx, oy, oz + zc - 0.7, 0, 1); P('c16', cx, 1.6, zc - 0.7, 0.17, 0.08, 0, navy); P('b', cx, 1.6, zc - 0.56, 0.2, 0.02, 0.1, 0x1c2638);   // 경찰관(이름 없음 · 모자)
      K.sign(S9, '112', cx, 2.45, -hd + 0.02, 0, 1.2, 0.6, { bg: '#2b3a5c', fr: 0xf6f4ee, fs: 1.2 }); }
    K.mainSign(S9, name, 2.9, 2.75, -hd + 0.02, 0, { bg: '#2b3a5c' });
    { const bz = -0.6; P('b', hw - 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); }   // 칭찬 게시판 틀(글 = 캔버스)
    const board = boardMesh(K, S9, hw - 0.046, 1.67, -0.6, -Math.PI / 2, 2.4, 1.5);
    for (const z of [-0.2, 0.55, 1.3]) K.chair(S9, seats, -hw + 1.3, z, Math.PI / 2, 0x3d5a8a); K.stable(S9, -hw + 0.55, 2.2, 0.6, 0.6, 0xb07d4a, 0.5); K.plant(S9, -hw + 0.5, -hd + 0.5, 1);   // 기다리는 의자 · 낮은 탁자 · 화분
    K.sign(S9, en() ? 'Call 112 if someone is lost or in danger' : '길을 잃거나 위험할 때는 112', -hw + 0.02, 2.2, 0.55, Math.PI / 2, 2.6, 0.3, { bg: '#3d5a8a', fr: 0xf6f4ee });
    K.wwin(S9, 'F', -3.3, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 3.3, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-2.6, 0, 2.6]) for (const z of [-1.6, 1.6]) K.panelL(S9, x, z);
    return { S: S9, W, D, H, seats, items: ['민원 창구 · 경찰관(이름 없음)', '112 간판', '칭찬 게시판(112 연습 · 도운 일)', '기다리는 의자'], board, extra: [{ k: 'bd:112', stand: [-1.0, 0, -hd + 2.35], r: 1.3, label: '👮 ' + L(TIP.police) }, { k: 'bd:board', stand: [hw - 1.0, 0, -0.6], r: 1.2, label: '📋 ' + (en() ? 'Read the praise board' : '칭찬 게시판 보기') }], cam: { d: 3.8, p: 0.55 } }; }
  function roomClinic(at, K, name) { const W = 11, D = 9, H = 3.4, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], teal = 0x3f9f8a;
    const S9 = K.shell(at, W, D, H, { wall: 0xf7faf9, wains: teal, winY: [], noLights: true, ft: ['tile', 1.0, 0xeef4f2] }), P = S9.put; S9.ac = K.cs(teal);
    { const cx = -2.6, zc = -hd + 1.4; P('b', cx, 0, zc, 3.0, 1.0, 0.6, 0xf6f4ee); P('b', cx, 0.1, zc + 0.306, 2.9, 0.5, 0.012, teal); P('b', cx, 1.0, zc, 3.06, 0.04, 0.66, 0xd8dce0); K.colL(S9, cx, zc, 1.53, 0.33, -0.5, 1.1);   // 접수대
      P('b', cx + 0.8, 1.04, zc - 0.05, 0.42, 0.3, 0.05, 0x2b2d31); P('b', cx + 0.8, 1.08, zc - 0.022, 0.36, 0.22, 0.012, 0x9fe0c8, 1); K.sign(S9, en() ? 'Reception' : '접수', cx, 0.42, zc + 0.33, 0, 0.9, 0.26, { bg: K.cs(teal), fr: false });
      K.standGuest(S9, ox + cx, oy, oz + zc - 0.7, 0, 4); P('b', cx, 1.0, zc - 0.55, 0.36, 0.5, 0.02, 0xffffff); }   // 간호사(이름 없음 · 흰 앞치마)
    { const x0 = 0.8, x1 = hw - 0.2, zc = -hd + 1.0; P('b', (x0 + x1) / 2, 2.25, zc + 0.6, x1 - x0, 0.05, 0.05, 0xb8bec4); for (let i = 0; i < 6; i++) P('b', x0 + 0.3 + i * (x1 - x0 - 0.6) / 5, 0.12, zc + 0.6, 0.62, 2.1, 0.04, i % 2 ? 0xcfe8e0 : 0xbfe0d6); K.colL(S9, (x0 + x1) / 2, zc + 0.6, (x1 - x0) / 2, 0.06, -0.5, 2.3);   // 진료실 커튼
      K.sign(S9, en() ? 'Exam room' : '진료실', (x0 + x1) / 2, 2.6, -hd + 0.02, 0, 1.4, 0.36, { bg: K.cs(teal), fr: 0xf6f4ee }); }
    K.mainSign(S9, name, -2.6, 2.75, -hd + 0.02, 0, { bg: K.cs(teal) });
    { const x = -hw + 0.06; P('b', x, 0.9, -1.6, 0.04, 1.4, 0.24, 0xffffff); for (let i = 0; i < 8; i++) P('b', x + 0.025, 0.95 + i * 0.17, -1.6, 0.01, 0.015, i % 2 ? 0.1 : 0.18, 0x3f9f8a); K.sign(S9, en() ? 'Height' : '키 재기', -hw + 0.02, 2.5, -1.6, Math.PI / 2, 0.8, 0.24, { bg: K.cs(teal), fr: 0xf6f4ee }); }   // 키 재는 막대(눈금)
    { const x = -hw + 0.25; P('b', x, 0, 0.8, 0.4, 1.6, 1.4, 0xf2f2ee); for (const y of [0.5, 1.0, 1.5]) P('b', x + 0.06, y, 0.8, 0.3, 0.02, 1.3, 0xd8dce0); for (let i = 0; i < 9; i++) K.I(S9, 'b', x + 0.04, 0.52 + ((i / 3) | 0) * 0.5, 0.25 + (i % 3) * 0.5, 0.18, 0.12, 0.14, [0xffffff, 0xf2c230, 0x5aa6e0][i % 3]); K.colL(S9, x, 0.8, 0.21, 0.71, -0.5, 1.6); }   // 약 선반(약 상자)
    for (let i = 0; i < 4; i++) K.chair(S9, seats, -0.6 + i * 0.75, 0.0, Math.PI, 0x3f9f8a);   // 기다리는 의자 줄(접수대 쪽을 봄)
    { const bz = 1.7; P('b', hw - 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); }
    const board = boardMesh(K, S9, hw - 0.046, 1.67, 1.7, -Math.PI / 2, 2.4, 1.5);
    const hi = pending('hurt', S().clinic.hi); let nb = null; if (hi) { const nx = 2.6, nz = 2.0; K.standGuest(S9, ox + nx, oy, oz + nz, Math.PI, 2); nb = { q: hi, at: [ox + nx, oy, oz + nz] }; }   // 나은 이웃(이름 없는 역할 · 기다리는 의자 곁에 섬)
    K.wwin(S9, 'F', -3.3, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 3.3, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-2.6, 0, 2.6]) for (const z of [-1.6, 1.6]) K.panelL(S9, x, z);
    const ex = [{ k: 'bd:aid', stand: [-2.6, 0, -hd + 2.25], r: 1.3, label: '🩹 ' + L(TIP.clinic) }, { k: 'bd:board', stand: [hw - 1.0, 0, 1.7], r: 1.1, label: '📋 ' + (en() ? 'Read the first aid board' : '응급 처치 판 보기') }];
    if (nb) ex.push({ k: 'bd:hi', stand: [2.6, 0, 1.2], r: 1.1, label: '🙂 ' + (en() ? 'Say hello to the neighbour who got better' : '나은 이웃에게 인사') });
    return { S: S9, W, D, H, seats, items: ['접수대 · 간호사(이름 없음)', '기다리는 의자 줄', '진료실 커튼', '키 재는 막대', '응급 처치 판', '약 선반'], board, nb, extra: ex, cam: { d: 3.8, p: 0.55 } }; }
  function roomShelter(at, K, name) { const W = 12, D = 10, H = 3.4, hw = W / 2, hd = D / 2, seats = [], grn = 0x5cbf73, [ox, oy, oz] = at;
    const S9 = K.shell(at, W, D, H, { wall: 0xf6f0e4, wains: grn, winY: [], noLights: true, ft: ['wood', 1.0, 0xf2e2c8] }), P = S9.put; S9.ac = K.cs(grn);
    const pens = [-2.7, 0, 2.7], z0 = -hd, z1 = -hd + 2.4, DOG = [0xc8a070, 0xf2ede0, 0x3a3a3a], bowls = [];
    for (let i = 0; i < 3; i++) { const cx = pens[i], x0 = cx - 1.35, x1 = cx + 1.35; P('b', cx, 0.006, (z0 + z1) / 2, 2.66, 0.02, 2.36, 0x9ccf7a);   // 칸 바닥 깔개
      P('b', cx, 0.62, z1, 2.7, 0.06, 0.06, 0xf6f4ee); P('b', cx, 0.3, z1 + 0.003, 2.7, 0.06, 0.05, 0xf6f4ee); for (let k = i ? 1 : 0; k <= 6; k++) P('b', x0 + k * 0.45, 0, z1, 0.05, 0.7, 0.05, 0xe9e5dc);   // 앞 울타리(문살 · 이웃 칸과 같은 기둥은 한 번만)
      for (const xs of [x0, x1]) { if (i && xs === x0) continue; P('b', xs, 0, (z0 + z1) / 2 - 0.03, 0.06, 0.66, 2.34, 0xe9e5dc); }   // 칸막이(위 = 울타리 위 가로대보다 낮게 · 앞 끝은 기둥 뒤에서 멈춤 — 같은 평면 X)
      K.colL(S9, cx, (z0 + z1) / 2, 1.38, 1.24, -0.5, 0.75); dog(K, S9, cx - 0.35, z0 + 1.2, 0, 0.5 - i * 0.5, DOG[i]);
      bowl(K, S9, cx + 0.55, z1 - 0.35, 0x3d74c9); K.part(S9, 'c16', cx + 0.55, 0.06, z1 - 0.35, 0.11, 0.008, 0, 0x6fc3dc); bowl(K, S9, cx + 0.95, z1 - 0.35, 0xe0453a); bowls.push([cx + 0.95, z1 - 0.35, 'd']);   // 물그릇(물) · 밥그릇
      K.sign(S9, [en() ? 'Bori' : '보리', en() ? 'Kongi' : '콩이', en() ? 'Duri' : '두리'][i], cx, 1.15, z1 + 0.04, 0, 0.7, 0.24, { bg: '#5cbf73', fr: 0xf6f4ee }); P('b', cx, 0.7, z1 + 0.04, 0.03, 0.33, 0.03, 0x8a6a4a); }   // 칸 이름표(동물 이름 = 보호소가 지어 준 이름 · 사람 이름 X)
    { const tx = -hw + 1.0, tz = 1.4; P('b', tx, 0, tz, 0.9, 0.06, 0.9, 0xc8a070); P('c', tx, 0.06, tz, 0.1, 1.1, 0, 0xd9c7a5); P('b', tx, 0.6, tz, 0.7, 0.05, 0.7, 0xc8a070); P('b', tx, 1.16, tz, 0.8, 0.06, 0.8, 0xc8a070); K.colL(S9, tx, tz, 0.48, 0.48, -0.5, 1.25);   // 고양이 쉼터 탑
      cat(K, S9, tx, tz, 1.22, 0.8, 0x7a7a7a); cat(K, S9, tx + 0.05, tz - 0.05, 0.65, -0.6, 0xef9b4a); bowl(K, S9, tx + 0.9, tz - 0.3, 0xf2c230); bowls.push([tx + 0.9, tz - 0.3, 'c']); K.sign(S9, en() ? 'Cats' : '고양이', tx, 1.9, tz, Math.PI / 2, 0.8, 0.24, { bg: '#ef8b33', fr: 0xf6f4ee, two: true }); P('b', tx, 1.22, tz, 0.03, 0.56, 0.03, 0x8a6a4a); }
    { const x = hw - 0.3, z = 0.6; P('b', x, 0, z, 0.5, 1.6, 2.2, 0xb07d4a); for (const y of [0.55, 1.1]) P('b', x - 0.26, y, z, 0.02, 0.03, 2.1, 0x8a5a34);   // 사료 선반(포대 · 통)
      for (let i = 0; i < 3; i++) { K.I(S9, 'b', x - 0.05, 0.02, z - 0.7 + i * 0.7, 0.36, 0.48, 0.3, [0xd9473b, 0x3d74c9, 0xd9473b][i]); K.I(S9, 'b', x - 0.05, 0.58, z - 0.7 + i * 0.7, 0.32, 0.4, 0.28, [0xf2c230, 0x3cc76a, 0xf2c230][i]); } K.colL(S9, x, z, 0.27, 1.12, -0.5, 1.6);
      K.sign(S9, en() ? 'Pet food' : '사료', x - 0.27, 1.9, z, -Math.PI / 2, 1.0, 0.3, { bg: '#5cbf73', fr: 0x8a6a4a }); K.standGuest(S9, ox + x - 1.2, oy, oz + z + 1.5, -Math.PI / 2, 6); }   // 동물보호사(이름 없음)
    K.mainSign(S9, name, 0, 2.85, -hd + 0.02, 0, { bg: '#3f8f4e' });
    { const bz = 2.6; P('b', -hw + 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); }
    const board = boardMesh(K, S9, -hw + 0.046, 1.67, 2.6, Math.PI / 2, 2.4, 1.5);
    const food = K.parts(put => { for (const [bx, bz, t] of bowls) { put('c16', ox + bx, oy + 0.067, oz + bz, 0.108, 0.014, 0, t === 'c' ? 0xb07d4a : 0x8a5a34); for (let k = 0; k < 4; k++) put('s', ox + bx + Math.cos(k * 1.6) * 0.05, oy + 0.084, oz + bz + Math.sin(k * 1.6) * 0.05, 0.025, 0.6, 0, t === 'c' ? 0xc8945a : 0x9a6a3c); } });   // 밥(그릇 속 사료 · 밥을 주면 보임)
    food.visible = S().shelter.fed === day(); S9.extra = S9.extra || []; S9.extra.push(food);
    K.wwin(S9, 'F', -3.6, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 3.6, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-3, 0, 3]) for (const z of [-1.4, 2.0]) K.panelL(S9, x, z);
    return { S: S9, W, D, H, seats, items: ['강아지 칸 셋(울타리 · 물그릇 · 밥그릇)', '고양이 쉼터 탑 · 고양이 둘', '사료 선반', '동물보호사(이름 없음)', '새 가족을 기다려요 판'], board, food, dogs: pens.map(cx => [ox + cx - 0.35, oy, oz + z0 + 1.2]),
      extra: [{ k: 'bd:feed', stand: [hw - 1.2, 0, 0.6], r: 1.3, label: '🥣 ' + (en() ? 'Feed the animals (once a day)' : '동물 밥 주기 (하루 한 번)') }, { k: 'bd:board', stand: [-hw + 1.0, 0, 2.6], r: 1.1, label: '📋 ' + (en() ? 'Read the board' : '알림판 보기') }], cam: { d: 3.8, p: 0.55 } }; }

  // ───────── E ─────────
  function use(kk) { if (!CUR || A.panelOpen()) return; if (kk === 'bd:112') return police(); if (kk === 'bd:aid') return clinic(); if (kk === 'bd:hi') return greet(); if (kk === 'bd:feed') return feed(); if (kk === 'bd:board') return readBoard(); }
  const pick = (L9, n, seed) => L9.map((x, i) => [hashS(seed + ':' + i), x]).sort((a, b) => a[0] - b[0]).slice(0, n).map(q => q[1]);
  const shuf = (L9, seed) => L9.map((x, i) => [hashS(seed + ':' + L(x[1] || x)), x, i]).sort((a, b) => a[0] - b[0]);
  const wordBox = k => '<div class="bd-wd">' + WORDS[k].map(w => '<div>📖 <b>' + esc(L(w[0])) + '</b> = ' + esc(L(w[1])) + '</div>').join('') + '</div>';
  function reward(k, sk, n) { const s = S()[k], D = day(); if (s.rw === D) return false; s.rw = D; mark(); A.skUp(sk, n, 'bldg:' + k); return true; }

  // 👮 경찰서: 도운 아이 가족의 인사(있으면 먼저) → 112 연습(상황 셋 · 번호판 · 마지막 = 무엇을 꼭 말하나)
  async function police() { const s = S().police, e = en(), q = pending('lost', s.thx);
    if (q) { const n = day() - q.d; await A.dialog({ who: e ? 'Police officer' : '경찰관', icon: '👮', text: e ? 'You took a lost child back to their family ' + ago(n) + ' in ' + q.cell + '. The family asked me to say thank you. I will pin their note on the praise board.' : ago(n) + ' ' + q.cell + ' 칸에서 길 잃은 아이를 가족에게 데려다줬지요? 아이 가족이 고맙다고 전해 달래요. 쪽지를 칭찬 게시판에 붙여 둘게요.' });
      (s.thx || (s.thx = [])).push(keyOf(q)); s.thx = s.thx.slice(-6); mark(); boardDraw(); sfx('ding'); A.skUp('explore', 1, 'bldg:thx'); A.rec('bldg', { k: 'police', ev: 'thx', cell: q.cell }); toast('📋 ' + (e ? 'A thank-you note is on the praise board.' : '칭찬 게시판에 고맙다는 쪽지가 붙었어요.'), 2.8); return; }
    const D = day(), cases = (() => { const L9 = pick(SIT, 3, 'p112:' + D); if (!L9.some(x => x[0] === 112)) L9[0] = SIT[0]; if (!L9.some(x => x[0] === 119)) L9[2] = SIT[1]; return L9; })();
    let i = 0, num = '', mis = 0, stage = 0; const WH = shuf(WHERE, 'w' + D);
    const draw = () => '<h3>👮 ' + esc(L(TIP.police)) + '</h3>' + (stage === 0
      ? '<div class="sm">' + esc(e ? 'Police officer: “Which number would you call? Press it, then 📞.” (' + (i + 1) + ' of 3)' : '경찰관: "이럴 때는 몇 번에 전화할까요? 번호를 누르고 📞를 눌러요." (' + (i + 1) + '/3)') + '</div><div class="bd-sit">' + esc(L(cases[i][1])) + '</div><div class="bd-num">' + (num || '&nbsp;') + '</div><div class="bd-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '📞'].map(k => '<button class="' + (k === '📞' ? '' : 'sub') + '" data-k="' + k + '">' + k + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : stage === 1 ? '<div class="pc-tx">' + esc(e ? 'Police officer: “When you call, what must you say clearly?”' : '경찰관: "신고할 때 꼭 또렷하게 말해야 하는 것은 무엇일까요?"') + '</div><div class="bd-ch">' + WH.map(([, w], j) => '<button class="sub" data-w="' + j + '">' + esc(L(w[1])) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : '<div class="pc-tx">' + esc(e ? 'Police officer: “Well done. 112 is for the police: someone lost, something stolen, roads in trouble. 119 is for fires, injuries and sudden illness. Never make joke calls.”' : '경찰관: "잘했어요. 112는 경찰이에요. 길을 잃었을 때, 물건을 도둑맞았을 때, 길에 사고가 났을 때 걸어요. 119는 불이 나거나 다치고 아플 때예요. 장난 전화는 하지 않아요."') + '</div>' + wordBox('police'))
      + '<div class="row"><button class="' + (stage === 2 ? '' : 'sub') + '" data-a="x">' + (stage === 2 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'bd112'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); }, msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.k != null) { const k = b.dataset.k; if (k === '⌫') num = num.slice(0, -1); else if (k === '📞') { const want = String(cases[i][0]); if (num === want) { sfx('ding'); num = ''; i++; if (i >= cases.length) stage = 1; paint(); return; } mis++; msg(num === '112' || num === '119' ? (want === '112' ? (e ? 'Officer: “Nobody is hurt and there is no fire. Who helps find lost people and lost things?”' : '경찰관: "다친 사람도 불도 없어요. 길 잃은 사람과 잃어버린 물건은 누가 찾아 줄까요?"') : (e ? 'Officer: “Someone is hurt or there is a fire. Who comes with an ambulance or a fire engine?”' : '경찰관: "다쳤거나 불이 났어요. 구급차와 소방차는 어디에서 올까요?"')) : (e ? 'Officer: “Emergency numbers are 112 (police) and 119 (fire and ambulance).”' : '경찰관: "급할 때 거는 번호는 112(경찰)와 119(소방·구급)예요."')); num = ''; sfx('tick'); } else if (num.length < 4) num += k; sfx('tick'); const n9 = P.querySelector('.bd-num'); if (n9) n9.innerHTML = num || '&nbsp;'; return; }
      if (b.dataset.w != null) { if (WH[+b.dataset.w][1][0]) { stage = 2; s.d112 = D; s.n112 = (s.n112 | 0) + 1; mark(); sfx('ding'); reward('police', 'explore', 2); A.rec('bldg', { k: 'police', ev: '112', mis }); boardDraw(); paint(); return; } mis++; sfx('tick'); msg(e ? 'Officer: “Police cars need to know where to go first.”' : '경찰관: "경찰차가 먼저 알아야 하는 것은 어디로 가야 하는지예요."'); } };
    log('police'); }

  // 🩹 병원·보건소: 응급 처치 문제 셋(같은 날은 같은 문제)
  function clinic() { const s = S().clinic, e = en(), D = day(), Q = pick(AID, 3, 'aid:' + D); let i = 0, mis = 0, done = false;
    const opts9 = q => q[1].map((t, j) => [hashS(D + L(t)), t, j]).sort((a, b) => a[0] - b[0]);
    const draw = () => '<h3>🩹 ' + esc(L(TIP.clinic)) + '</h3>' + (!done
      ? '<div class="sm">' + esc(e ? 'Nurse: “Let’s go over what to do before the ambulance comes.” (' + (i + 1) + ' of 3)' : '간호사 선생님: "구급차가 오기 전에 할 일을 같이 알아봐요." (' + (i + 1) + '/3)') + '</div><div class="bd-sit">' + esc(L(Q[i][0])) + '</div><div class="bd-ch">' + opts9(Q[i]).map(([, t, j]) => '<button class="sub" data-o="' + j + '">' + esc(L(t)) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : '<div class="pc-tx">' + esc(e ? 'Nurse: “Good. I put the first aid card on the board. If someone is badly hurt, call 119 first and stay with them.”' : '간호사 선생님: "잘했어요. 응급 처치 카드를 판에 붙여 둘게요. 많이 다친 사람을 보면 먼저 119에 알리고 곁에 있어 줘요."') + '</div>' + wordBox('clinic'))
      + '<div class="row"><button class="' + (done ? '' : 'sub') + '" data-a="x">' + (done ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'bdaid'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); }, msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.o != null) { if (+b.dataset.o === 0) { sfx('ding'); toast('🩹 ' + L(Q[i][2]), 3.2); i++; if (i >= Q.length) { done = true; s.dfa = D; s.nfa = (s.nfa | 0) + 1; mark(); reward('clinic', 'work', 2); A.rec('bldg', { k: 'clinic', ev: 'aid', mis }); boardDraw(); } paint(); return; } mis++; sfx('tick'); msg((e ? 'Nurse: “Think again. ' : '간호사 선생님: "다시 생각해 봐요. ') + L(Q[i][2]) + '"'); } };
    log('clinic'); }
  async function greet() { const s = S().clinic, nb = CUR && CUR.made.nb, e = en(); if (!nb || (s.hi || []).includes(keyOf(nb.q))) { if (nb) A.bubble({ x: nb.at[0], y: nb.at[1], z: nb.at[2], sc: 1 }, e ? 'See you around!' : '또 만나요!'); return; }
    const heat = nb.q.v === 'heat', n = day() - nb.q.d; await A.dialog({ who: e ? 'Neighbour' : '이웃', icon: '🙂', text: heat ? (e ? 'You helped me ' + ago(n) + ' when I was sick from the heat. I came for a check-up, and I am all better now. Thank you!' : ago(n) + ' 더위를 먹었을 때 도와줘서 고마워요. 오늘 검사를 받으러 왔는데 이제 다 나았대요!') : (e ? 'You called 119 for me ' + ago(n) + ' when I hurt my ankle. The doctor says it has healed. Thank you!' : ago(n) + ' 발목을 다쳤을 때 119에 알려 줘서 고마워요. 의사 선생님이 이제 다 나았대요!') });
    (s.hi || (s.hi = [])).push(keyOf(nb.q)); s.hi = s.hi.slice(-6); mark(); boardDraw(); sfx('ding'); A.skUp('work', 1, 'bldg:hi'); A.rec('bldg', { k: 'clinic', ev: 'hi', cell: nb.q.cell }); A.bubble({ x: nb.at[0], y: nb.at[1], z: nb.at[2], sc: 1 }, e ? 'Thank you!' : '고마워요!'); }

  // 🥣 보호센터: 강아지 그릇 → 고양이 그릇(알맞은 사료 고르기) → 그릇이 참
  function feed() { const s = S().shelter, e = en(), D = day();
    if (s.fed === D) { toast('🥣 ' + (e ? 'Animal carer: “They have eaten today. Come again tomorrow!”' : '동물보호사: "오늘은 벌써 밥을 먹었어요. 내일 또 와 줘요!"'), 3); return; }
    let st = 0, mis = 0; const OR = FOOD.map((t, j) => [hashS(D + L(t)), t, j]).sort((a, b) => a[0] - b[0]);
    const why = (want, got) => got === 2 ? (e ? 'Chocolate is harmful to dogs and cats. We never give them people snacks.' : '초콜릿은 개와 고양이 몸에 해로워요. 사람 간식은 주지 않아요.') : want === 0 ? (e ? 'Cat food is made for cats. Dogs eat dog food.' : '고양이 사료는 고양이 몸에 맞춘 거예요. 강아지는 강아지 사료를 먹어요.') : (e ? 'Cats need more of the nutrients that come from meat, so they eat cat food.' : '고양이는 고기에서 얻는 영양이 더 많이 필요해서 고양이 사료를 먹어요.');
    const draw = () => '<h3>🥣 ' + esc(L(TIP.shelter)) + '</h3>' + (st < 2
      ? '<div class="sm">' + esc(e ? 'Animal carer: “Please fill the bowls. Pick the right food.”' : '동물보호사: "밥그릇을 채워 줄래요? 알맞은 밥을 골라요."') + '</div><div class="bd-sit">' + esc(st === 0 ? (e ? 'The dogs’ bowls (Bori, Kongi, Duri)' : '강아지 밥그릇 (보리 · 콩이 · 두리)') : (e ? 'The cats’ bowl' : '고양이 밥그릇')) + '</div><div class="bd-ch">' + OR.map(([, t, j]) => '<button class="sub" data-f="' + j + '">' + esc(L(t)) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : '<div class="pc-tx">' + esc(e ? 'Animal carer: “Thank you. These animals are waiting for a new family. Fresh water and the right food every day keep them healthy.”' : '동물보호사: "고마워요. 이 아이들은 새 가족을 기다리고 있어요. 날마다 깨끗한 물과 알맞은 밥을 먹어야 건강해요."') + '</div>' + wordBox('shelter'))
      + '<div class="row"><button class="' + (st === 2 ? '' : 'sub') + '" data-a="x">' + (st === 2 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'bdfeed'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); }, msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); if (st === 2 && CUR && CUR.made.dogs) { const d0 = CUR.made.dogs[1]; A.bubble({ x: d0[0], y: d0[1], z: d0[2], sc: 0.6 }, e ? 'Woof!' : '멍멍!'); } return; }
      if (b.dataset.f != null) { const f = +b.dataset.f; if (f === st) { sfx('pop'); st++; if (st === 2) { s.fed = D; s.n = (s.n | 0) + 1; mark(); if (CUR && CUR.food) CUR.food.visible = true; reward('shelter', 'look', 2); A.rec('bldg', { k: 'shelter', ev: 'feed', mis }); boardDraw(); } paint(); return; } mis++; sfx('tick'); msg((e ? 'Animal carer: “' : '동물보호사: "') + why(st, f) + '"'); } };
    log('feed'); }
  function readBoard() { const e = en(), k = CUR.k, s = S()[k], D = day(); let body = '';
    if (k === 'police') { const n = helped('lost'); body = (s.d112 ? (e ? '★ 112 helper: practised ' + (s.n112 | 0) + ' time(s).' : '★ 112 어린이 도우미: 연습 ' + (s.n112 | 0) + '번') : (e ? 'Practise 112 calls at the counter to get your name here.' : '창구에서 112 신고 연습을 하면 여기에 붙어요.')) + '<br>' + (n ? (e ? '♥ Lost children you helped home: ' + n : '♥ 가족에게 데려다준 길 잃은 아이: ' + n + '명') : (e ? 'When a 112 call comes, help a lost child find family.' : '112 출동이 오면 길 잃은 아이의 가족을 찾아 줘요.')); }
    else if (k === 'clinic') body = (s.dfa ? (e ? '✓ Twisted ankle: keep still, cool it, raise it.<br>✓ Heat sickness: shade, water if awake, fan.' : '✓ 발목을 삐면: 움직이지 않기, 차갑게, 높이 올리기<br>✓ 더위를 먹으면: 그늘로, 정신이 또렷하면 물, 부채질') : (e ? 'Learn first aid with the nurse to fill this board.' : '간호사 선생님께 응급 처치를 배우면 이 판이 채워져요.')) + ((s.hi || []).length ? '<br>' + (e ? '♥ Neighbours who said thanks: ' : '♥ 고맙다고 한 이웃: ') + s.hi.length : '');
    else body = (s.fed === D ? (e ? '✓ Fed today.' : '✓ 오늘 밥을 먹었어요.') : (e ? 'Not fed yet today. Ask at the food shelf.' : '오늘 아직 밥을 못 먹었어요. 사료 선반에서 도와요.')) + (s.n ? '<br>' + (e ? '★ Meals you gave: ' + s.n : '★ 내가 준 밥: ' + s.n + '번') : '');
    const P = A.openP('<h3>📋 ' + esc(CUR.name) + '</h3><div class="pc-tx">' + body + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'bdboard'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; }

  function dispose() { left(); if (css) { css.remove(); css = null; } }
  return { tip, canIn, opts, left, dispose, open,
    info: () => ({ cur: CUR ? { k: CUR.k, name: CUR.name, food: CUR.food ? CUR.food.visible : null, nb: !!(CUR.made && CUR.made.nb), at: CUR.at, extra: (CUR.made.extra || []).map(h => ({ k: h.k, label: h.label, at: [CUR.at[0] + h.stand[0], CUR.at[1] + h.stand[1], CUR.at[2] + h.stand[2]] })) } : null, s: JSON.parse(JSON.stringify(S())), dbg: DBG.slice() }),
    dbg: { use: kk => use(kk), board: () => (CUR && CUR.board ? CUR.board.c.toDataURL().length : 0) } };
}
