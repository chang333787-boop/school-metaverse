// 🏢 빈 건물에 할 일(BLDG-1 · 코덱스 10-24 표 13줄 '기존 놀이·창구를 역할이 맞는 건물 2~3곳에 연결' · 사용자 10-24 '빈 건물이 생각보다 많아')
//   경찰서 👮 = 112 신고 연습(긴급 출동 119 신고 창과 같은 번호판 꼴 · 상황 셋 + 위치 말하기) · 길 잃은 아이를 도운 뒤 들어가면 경찰관이 고맙다는 말 → 칭찬 게시판에 붙음
//   병원·보건소·보건실 🩹 = 응급 처치 배우기(긴급 출동 119 처치에서 쓴 것 그대로 · 문제 셋) · 넘어진 이웃을 도운 뒤 들어가면 나은 이웃이 기다리는 의자에 있음(E = 인사)
//   동물보호센터 🥣 = 하루 한 번 밥 주기(강아지·고양이 그릇에 알맞은 사료 고르기 → 그릇이 차고 강아지가 반김)
//   눈에 보이는 결과: 칭찬 게시판·응급 처치 판 글이 바뀜(캔버스 한 장) · 밥그릇이 참 · 나은 이웃의 몸
//   지킴: 판타지 X · 전투 X · 실명 X(경찰관·간호사·동물보호사·이웃 = 이름 없는 역할 · 몸 있음) · 피 X · 보상 = 솜씨만(꼬리표 bldg:<곳> → rwCheck 한 문 · 하루 한 번)
//   은행 🏦 = 저금하기(BANK-1 · 코덱스 표 11줄 '창구·센터·은행·우체국') — 지갑 돈을 통장에 넣고 꺼냄(옮김 · 돈이 늘지 않음) · 7일마다 이자 한 줄(아주 작게 · 문 bldg:bankint) · 벽 '내 통장' 판에 줄이 적힘 · 09:00~16:00
//   우체국 📦 = 소포 보내기(town_indoor.js 우체국 방에 E 하나를 더함 · deco) — 가방 물건 하나 → 받을 이웃(이름 없는 일꾼 역할) → 지도 보고 주소 칸 고르기 → 소포 값 → 다음 날 그 이웃 곁에 가면 고맙다는 말풍선 + 하트 · 창구 09:00~18:00
//   렉: 매 프레임 일 0 · 새 Light X · 방은 들어갈 때만 지음(town_indoor.js KIT) · 판 = 캔버스 한 장(나오면 버림) · 밥 = 합친 부품 1
export const BD_V = 1;
const T2 = (ko, en) => [ko, en];
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// 건물 이름 → 방 갈래(town.js pubIn이 부름 · 동물병원은 보호센터 동물만 쓰는 곳이라 들어가지 않음)
export const bldgKind = nm => { const t = String(nm || ''); if (/경찰|파출소|지구대/.test(t)) return 'police'; if (/은행/.test(t)) return 'bank'; if (/동물보호|보호 ?센터/.test(t)) return 'shelter'; if (/동물/.test(t)) return null; if (/병원|의원|보건소|보건실|진료소/.test(t)) return 'clinic'; return null; };
// 문 연 때(docs/systems/town_hours.md) — 경찰서 = 늘(24시간)
export const BD_HRS = { police: null, clinic: [9, 18], shelter: [10, 17], bank: [9, 16] };
export const POST_HRS = [9, 18];   /* 우체국 창구(방은 집배원 체험 자리라 늘 들어감 · 창구 E만 시간을 봄) */
const TIP = { police: T2('112 신고 연습', '112 call practice'), clinic: T2('응급 처치 배우기', 'Learn first aid'), shelter: T2('동물 밥 주기', 'Feed the animals'), bank: T2('저금하기', 'Save money'), post: T2('소포 보내기', 'Send a parcel') };
const PARCEL = 500, SENDK = ['food', 'treat', 'goods', 'wild'];   /* 소포 값(엽서 우표 200원보다 조금 비쌈) · 보낼 수 있는 물건 갈래(도장·도구·요리 X) */
const FONT = '"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const CSS = `.twn-p .bd-pad{display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center;margin:8px 0}.twn-p .bd-pad button{min-height:52px;font-size:22px;padding:0}
.twn-p .bd-num{font:900 28px/1.2 ui-monospace,Menlo,monospace;text-align:center;letter-spacing:6px;min-height:36px;border:3px solid var(--ink,#2b2420);border-radius:10px;background:#fff;margin:4px auto;width:200px}
.twn-p .bd-ch{display:grid;gap:8px;margin:6px 0}.twn-p .bd-ch button{min-height:48px;font-size:15px;text-align:left}
.twn-p .bd-sit{background:#fff8dc;border:2px solid #b07a00;border-radius:12px;padding:8px 12px;margin:6px 0;font-size:16px;line-height:1.5}
.twn-p .bd-wd{background:#fffdf2;border:2px dashed #c9b27a;border-radius:12px;padding:6px 10px;margin:6px 0;font-size:15px;line-height:1.5}
.twn-p .bd-bar{display:grid;grid-template-columns:76px 1fr auto;gap:8px;align-items:center;margin:4px 0;font-size:15px}.twn-p .bd-bar i{display:block;height:18px;border:2px solid var(--ink,#2b2420);border-radius:4px;min-width:2px}
.twn-p .bd-pb{width:100%;border-collapse:collapse;font-size:14px;margin:6px 0;background:#fff}.twn-p .bd-pb td,.twn-p .bd-pb th{border:1px solid #c9b27a;padding:3px 6px;text-align:right}.twn-p .bd-pb td:first-child,.twn-p .bd-pb th:first-child,.twn-p .bd-pb td:nth-child(2){text-align:left}
.twn-p .bd-two{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0}.twn-p .bd-two button{min-height:48px;font-size:15px}
.twn-p canvas.bd-map{display:block;width:100%;max-width:340px;margin:6px auto;border-radius:8px;cursor:pointer}`;

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
  bank: [[T2('저축', 'Saving'), T2('돈을 바로 쓰지 않고 모아 두는 것', 'Keeping money instead of spending it straight away')], [T2('이자', 'Interest'), T2('돈을 맡긴 값으로 은행이 조금 더 얹어 주는 돈', 'A little extra money the bank adds for keeping your money')]],
  post: [[T2('주소', 'Address'), T2('받는 사람이 사는 곳·일하는 곳을 적은 글', 'Words that say where the person lives or works')], [T2('우편', 'Post'), T2('편지·소포를 받는 곳까지 날라 주는 일', 'Carrying letters and parcels to where they need to go')]],
};

// 마을 쪽이 넘기는 것(A): GAME · T3 · lang() · esc · openP(h, wide, kind) · closeP() · panelOpen() · say(t, s) · sfx(k) · dialog(o) · bubble(o, t) · skUp(k, n, src) · rec(k, o) · open(h0, h1)
//   은행·우체국(BANK-1): money() · pay(v) · refund(v) · won(v) · bag() · items · itemName(e) · take(e) · nbs() · heartTo(hk, n, src) · me() · mapGrid(cv, pts) · parts(fn)
export function createBldg(A) {
  const T3 = A.T3, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t), day = () => A.GAME.S.day | 0, mark = () => A.GAME.mark(), sfx = k => A.sfx(k), toast = (t, s) => A.say(t, s);
  const S = () => { const g = A.GAME.S; let s = g.bldg; if (!s || typeof s !== 'object' || s.v !== BD_V) s = g.bldg = { v: BD_V, police: {}, clinic: {}, shelter: {}, bank: {}, post: {} }; for (const k of ['police', 'clinic', 'shelter', 'bank', 'post']) if (!s[k] || typeof s[k] !== 'object') s[k] = {}; return s; };
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
  const dayT = d => en() ? 'Day ' + d : d + '일째', kindT = k => k === 'in' ? (en() ? 'in' : '넣음') : k === 'out' ? (en() ? 'out' : '꺼냄') : (en() ? 'interest' : '이자');

  // ───────── 바깥(town.js) 연결 ─────────
  function tip(k) { return TIP[k] ? L(TIP[k]) : ''; }
  function canIn(k, B9) { if (!BD_HRS[k] || open(k)) return true; const nm = (B9 && B9.name) || '', H = BD_HRS[k]; toast('🌙 ' + (en() ? nm + ' is closed now. It opens at ' + hh(H[0]) + '.' : nm + '은 지금 문을 닫았어요. ' + hh(H[0]) + '에 열어요.'), 3); return false; }
  function opts(B9, k) { if (!TIP[k]) return {}; if (k === 'post') return { deco: (S9, made) => postDeco(S9, made, B9), onExtra: kk => use(kk) }; return { room: (at, K) => build(k, at, K, B9), onExtra: kk => use(kk) }; }
  function left() { if (!CUR) return; if (CUR.board) { CUR.board.m.material.map.dispose(); CUR.board.m.material.dispose(); } CUR = null; }   /* 방 모양(geometry)은 town_indoor exit()이 치움 · 캔버스 재질만 여기서 */

  // ───────── 벽 판(캔버스 한 장 · 글이 바뀌면 다시 그림) ─────────
  function boardMesh(K, S9, x, y, z, ry, w, h) { const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2;
    const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ map: tx })); m.position.set(S9.at[0] + x, S9.at[1] + y, S9.at[2] + z); m.rotation.y = ry; m.updateMatrix(); m.matrixAutoUpdate = false; m.userData.fx = 1; (S9.extra || (S9.extra = [])).push(m); return { m, c, tx }; }
  function boardDraw() { if (!CUR || !CUR.board) return; const { c, tx } = CUR.board, g = c.getContext('2d'), W = c.width, H = c.height, e = en(), k = CUR.k, s = S()[k], D = day();
    g.fillStyle = '#c8945a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.fillRect(10, 10, W - 20, H - 20); g.fillStyle = '#2b2420'; g.textAlign = 'left'; g.textBaseline = 'top';
    const title = k === 'police' ? (e ? 'Praise board' : '칭찬 게시판') : k === 'clinic' ? (e ? 'First aid board' : '응급 처치 판') : k === 'bank' ? (e ? 'My bankbook' : '내 통장') : (e ? 'Waiting for a new family' : '새 가족을 기다려요');
    g.font = '900 40px ' + FONT; g.fillText(title, 28, 24); const lines = [];
    if (k === 'police') { if (s.d112) lines.push(['★', e ? '112 helper: practised ' + (s.n112 | 0) + ' time(s)' : '112 어린이 도우미 · 연습 ' + (s.n112 | 0) + '번']); const n = helped('lost'); if (n) lines.push(['♥', e ? 'Helped ' + n + ' lost child(ren) find family' : '길 잃은 아이 ' + n + '명을 가족에게']); if ((s.thx || []).length) lines.push(['✉', e ? 'Thank-you notes from families: ' + s.thx.length : '아이 가족이 보낸 고맙다는 쪽지 ' + s.thx.length + '장']); if (!lines.length) lines.push(['·', e ? 'Practise 112 calls at the counter.' : '창구에서 112 신고를 연습해요.']); }
    else if (k === 'clinic') { if (s.dfa) { lines.push(['✓', e ? 'Twisted ankle: keep still, cool, raise' : '발목을 삐면: 움직이지 않기, 차갑게, 높이']); lines.push(['✓', e ? 'Heat sickness: shade, water, fan' : '더위를 먹으면: 그늘, 물, 부채질']); } const n = (s.hi || []).length; if (n) lines.push(['♥', e ? 'Neighbours who got better and said thanks: ' + n : '나아서 고맙다고 한 이웃 ' + n + '명']); if (!lines.length) lines.push(['·', e ? 'Learn first aid with the nurse.' : '간호사 선생님께 응급 처치를 배워요.']); }
    else if (k === 'bank') { const H9 = (s.hist || []).slice(-3); for (const r of H9) lines.push([r[1] === 'in' ? '+' : r[1] === 'out' ? '−' : '★', dayT(r[0]) + '  ' + kindT(r[1]) + ' ' + A.won(r[2]) + '  →  ' + A.won(r[3])]); lines.unshift(['■', (e ? 'In the bankbook: ' : '통장에 있는 돈: ') + A.won(s.bal | 0)]); if (!H9.length) lines.push(['·', e ? 'Save at the counter and a line is written here.' : '창구에서 저금하면 여기에 한 줄씩 적혀요.']); }
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

  function build(k, at, K, B9) { left(); const name = (B9 && B9.name) || '', made = k === 'police' ? roomPolice(at, K, name) : k === 'clinic' ? roomClinic(at, K, name) : k === 'bank' ? (bankInt(), roomBank(at, K, name)) : roomShelter(at, K, name); CUR = { k, at, name, made, board: made.board || null, food: made.food || null }; boardDraw(); log('build ' + k); return made; }
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
    { const q = emLog().find(q9 => q9 && q9.k === 'pet' && q9.ok && q9.d < day() && day() - q9.d <= 4); if (q) { const px = 1.8, pz = 1.0, ry = -2.4, [cx9, cz9] = LP(px, pz, ry)(0, 0.25); P('b', px, 0.006, pz, 1.2, 0.02, 0.9, 0xe8d5b0); dog(K, S9, px, pz, 0.026, ry, q.pc || 0xc8a070); K.part(S9, 'b', cx9, 0.386, cz9, 0.3, 0.07, 0.09, q.cc || 0xe0453a, 0, ry, 0); bowl(K, S9, px + 0.75, pz + 0.15, 0x3d74c9); S().shelter.pet = keyOf(q); } }   /* PET-1(town_emerg.js pet): 비 오는 날 데려온 강아지 = 다음 날부터 나흘 · 같은 털·목줄 색 · 담요 · 물그릇 */
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

  // 은행(11×9): 뒤 = 예금 창구 둘(번호 빛판 · 은행원 둘) · 왼쪽 뒤 = 번호표 기계 · 왼벽 = 기다리는 의자 · 오른벽 = '내 통장' 판(캔버스) · 오른쪽 앞 = 현금 지급기(소품)
  function roomBank(at, K, name) { const W = 11, D = 9, H = 3.4, hw = W / 2, hd = D / 2, [ox, oy, oz] = at, seats = [], grn = 0x2f6d5a;
    const S9 = K.shell(at, W, D, H, { wall: 0xf6f4ee, wains: grn, winY: [], noLights: true, ft: ['tile', 1.0, 0xeceae4] }), P = S9.put; S9.ac = K.cs(grn);
    { const cx = -0.5, zc = -hd + 1.5; P('b', cx, 0, zc, 5.0, 1.0, 0.6, 0xf6f4ee); P('b', cx, 0.1, zc + 0.306, 4.9, 0.5, 0.012, grn); P('b', cx, 1.0, zc, 5.06, 0.04, 0.66, 0xd8dce0); K.colL(S9, cx, zc, 2.53, 0.33, -0.5, 1.1);   /* 예금 창구 탁자 */
      P('b', cx, 1.04, zc, 0.04, 0.62, 0.6, 0xc0c4c8);   /* 두 창구 사이 칸막이 */
      for (let k = 0; k < 2; k++) { const x = cx + (k ? 1.25 : -1.25); K.sign(S9, String(k + 1), x, 2.42, -hd + 0.02, 0, 0.4, 0.34, { bg: '#1c2a22', fg: '#ff6a4a', fr: 0x3a3d42 }); P('b', x + 0.6, 1.04, zc - 0.05, 0.42, 0.3, 0.05, 0x2b2d31); P('b', x + 0.6, 1.08, zc - 0.022, 0.36, 0.22, 0.012, 0x9fd8c0, 1); P('b', x - 0.5, 1.04, zc, 0.3, 0.02, 0.22, 0xffffff); K.standGuest(S9, ox + x, oy, oz + zc - 0.7, 0, k ? 6 : 1); }   /* 창구 번호(빛) · 화면(빛) · 종이 · 은행원 둘(이름 없음) */
      K.sign(S9, en() ? 'Savings counter' : '예금 창구', cx, 0.42, zc + 0.33, 0, 1.6, 0.26, { bg: '#2f6d5a', fr: false }); }
    { const x = -4.4, z = -hd + 0.17; P('b', x, 0, z, 0.42, 1.25, 0.3, 0xe9edf2); P('b', x, 1.0, z + 0.16, 0.3, 0.16, 0.02, 0x9fd8c0, 1); P('b', x, 0.82, z + 0.16, 0.08, 0.08, 0.02, 0xe0453a); P('b', x, 0.66, z + 0.16, 0.18, 0.03, 0.02, 0xffffff); K.colL(S9, x, z, 0.21, 0.15, -0.5, 1.3);   /* 번호표 기계(빛 화면 · 빨간 단추 · 표 나오는 틈) */
      K.sign(S9, en() ? 'Take a number' : '번호표', x, 1.75, -hd + 0.02, 0, 0.8, 0.24, { bg: '#2f6d5a', fr: 0xf6f4ee }); }
    K.mainSign(S9, name, 3.7, 2.75, -hd + 0.02, 0, { bg: '#2f6d5a' }); K.plant(S9, hw - 0.5, -hd + 0.5, 1);
    for (const z of [-0.6, 0.2, 1.0]) K.chair(S9, seats, -hw + 1.3, z, Math.PI / 2, grn);   /* 기다리는 의자 */
    K.sign(S9, en() ? 'Save a little, again and again' : '조금씩, 꾸준히 모아요', -hw + 0.02, 2.2, 0.2, Math.PI / 2, 2.4, 0.3, { bg: '#2f6d5a', fr: 0xf6f4ee });
    { const bz = -0.6; P('b', hw - 0.02, 0.88, bz, 0.04, 1.58, 2.48, 0x8a6a4a); }   /* 통장 판 틀(글 = 캔버스) */
    const board = boardMesh(K, S9, hw - 0.046, 1.67, -0.6, -Math.PI / 2, 2.4, 1.5);
    { const x = hw - 0.3, z = 2.7; P('b', x, 0, z, 0.5, 2.0, 0.7, 0xc9ced4); P('b', x - 0.256, 1.12, z, 0.012, 0.3, 0.42, 0x7fb8e0, 1); P('b', x - 0.28, 0.92, z, 0.06, 0.04, 0.36, 0x3a3d42); K.colL(S9, x, z, 0.25, 0.35, -0.5, 2.0);   /* 현금 지급기(소품 · 빛 화면 · 손잡이 판) */
      K.sign(S9, en() ? 'Cash machine' : '현금 지급기', x - 0.262, 1.75, z, -Math.PI / 2, 0.66, 0.2, { bg: '#2f6d5a', fr: false }); }
    K.wwin(S9, 'F', -3.3, 0.9, 1.8, 1.3, { sun: true }); K.wwin(S9, 'F', 2.6, 0.9, 1.8, 1.3, { sun: true }); for (const x of [-2.6, 0, 2.6]) for (const z of [-1.6, 1.6]) K.panelL(S9, x, z);
    return { S: S9, W, D, H, seats, items: ['예금 창구 둘 · 은행원(이름 없음)', '번호표 기계', '기다리는 의자', '내 통장 판', '현금 지급기(소품)'], board,
      extra: [{ k: 'bd:bank', stand: [-1.75, 0, -hd + 2.35], r: 1.3, label: '🏦 ' + L(TIP.bank) }, { k: 'bd:board', stand: [hw - 1.0, 0, -0.6], r: 1.2, label: '📒 ' + (en() ? 'Read my bankbook board' : '내 통장 판 보기') }], cam: { d: 3.8, p: 0.55 } }; }

  // 우체국(town_indoor.js 방 그대로): 1번 창구(직원 앞) = 소포 접수 E · 보낸 날엔 저울 위에 소포 상자(합친 부품 1 · 다음 날 아침 닿으면 사라짐)
  function postDeco(S9, made, B9) { left(); const [ox, oy, oz] = S9.at, x = -2.98, z = -2.525, D = day(), s = S().post;
    const box = A.parts(put => { put('b', ox + x, oy + 1.10, oz + z, 0.26, 0.2, 0.22, 0xc8945a); put('b', ox + x, oy + 1.30, oz + z, 0.06, 0.012, 0.23, 0xd9b27a); put('b', ox + x, oy + 1.15, oz + z + 0.112, 0.14, 0.08, 0.004, 0xffffff); });   /* 상자 · 테이프 · 주소 쪽지(앞면 2mm 앞 — 같은 면 X) */
    box.visible = (s.box || []).some(q => q.d === D && !q.ok); (S9.extra || (S9.extra = [])).push(box);
    (made.extra || (made.extra = [])).push({ k: 'bd:post', stand: [-3.33, 0, -1.55], r: 1.2, label: '📦 ' + L(TIP.post) });
    CUR = { k: 'post', at: S9.at, name: (B9 && B9.name) || '', made, board: null, box, door: B9 && B9.door ? B9.door.slice(0, 2) : null }; log('build post'); }

  // ───────── E ─────────
  function use(kk) { if (!CUR || A.panelOpen()) return; if (kk === 'bd:112') return police(); if (kk === 'bd:aid') return clinic(); if (kk === 'bd:hi') return greet(); if (kk === 'bd:feed') return feed(); if (kk === 'bd:bank') return bank(); if (kk === 'bd:post') return post(); if (kk === 'bd:board') return readBoard(); }
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
  // 🏦 은행: 이자(7일마다 · 통장 돈 100원에 2원꼴 · 10원 단위 · 한 번에 200원까지 · 500원보다 적으면 0) — 들어갈 때·창을 열 때 지난 주를 셈
  function bankInt() { const s = S().bank, D = day(); if (!s.wk) return 0; let n = 0, sum = 0;
    while (D - s.wk >= 7 && n < 8) { s.wk += 7; n++; const b = s.bal | 0, v0 = b >= 500 ? Math.min(200, Math.max(10, Math.floor(b * 0.02 / 10) * 10)) : 0; if (!v0) continue; const v = A.GAME.rw('money', 'bldg:bankint', v0) | 0; if (v > 0) { s.bal = b + v; sum += v; (s.hist || (s.hist = [])).push([s.wk, 'int', v, s.bal]); } }
    if (n) { if (s.hist) s.hist = s.hist.slice(-12); mark(); } if (sum) toast('🏦 ' + (en() ? 'Interest of ' + A.won(sum) + ' was added to your bankbook.' : '이자 ' + A.won(sum) + '이 통장에 붙었어요.'), 3); return sum; }
  function bank() { const s = S().bank, e = en(); bankInt(); let say9 = '';
    const pb = () => { const H9 = (s.hist || []).slice(-5); return '<table class="bd-pb"><tr><th>' + (e ? 'Day' : '날') + '</th><th>' + (e ? 'What' : '적은 것') + '</th><th>' + (e ? 'Amount' : '돈') + '</th><th>' + (e ? 'Balance' : '남은 돈') + '</th></tr>' + (H9.length ? H9.map(r => '<tr><td>' + esc(dayT(r[0])) + '</td><td>' + esc(kindT(r[1])) + '</td><td>' + esc(A.won(r[2])) + '</td><td>' + esc(A.won(r[3])) + '</td></tr>').join('') : '<tr><td colspan="4" style="text-align:center;color:#8a8f99">' + (e ? 'Nothing written yet' : '아직 적힌 줄이 없어요') + '</td></tr>') + '</table>'; };
    const bar = (lb, v, mx, c) => '<div class="bd-bar"><span>' + lb + '</span><i style="width:' + Math.max(1, Math.round(100 * v / mx)) + '%;background:' + c + '"></i><b>' + esc(A.won(v)) + '</b></div>';
    const draw = () => { const m = A.money() | 0, b = s.bal | 0, mx = Math.max(m, b, 1), half = Math.floor(m / 2 / 100) * 100, nx = s.wk ? 7 - (day() - s.wk) : 0;
      return '<h3>🏦 ' + esc(L(TIP.bank)) + '</h3><div class="sm">' + esc(say9 || (e ? 'Bank clerk: “Money you put in the bankbook is kept safe. Every 7 days the bank adds a little interest.”' : '은행원: "통장에 넣은 돈은 은행이 안전하게 지켜 줘요. 7일마다 이자를 조금 얹어 줘요."')) + '</div>'
        + bar(e ? '💰 Wallet' : '💰 지갑', m, mx, '#f2c230') + bar(e ? '📒 Bankbook' : '📒 통장', b, mx, '#5cbf8a') + pb()
        + '<div class="bd-two"><button data-d="1000"' + (m < 1000 ? ' disabled' : '') + '>' + (e ? 'Put in 1,000 won' : '1,000원 넣기') + '</button><button data-d="half"' + (half < 100 ? ' disabled' : '') + '>' + (e ? 'Put in half my money' : '가진 돈의 반 넣기') + '</button><button class="sub" data-w="1000"' + (b < 1000 ? ' disabled' : '') + '>' + (e ? 'Take out 1,000 won' : '1,000원 꺼내기') + '</button><button class="sub" data-w="all"' + (b < 1 ? ' disabled' : '') + '>' + (e ? 'Take it all out' : '다 꺼내기') + '</button></div>'
        + '<div class="sm">' + esc(s.wk ? (e ? 'Next interest in ' + nx + ' day(s).' : '다음 이자까지 ' + nx + '일 남았어요.') : (e ? 'Interest starts 7 days after your first saving.' : '처음 넣은 날부터 7일마다 이자가 붙어요.')) + '</div><div class="sm" data-m></div>' + wordBox('bank')
        + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>'; };
    const P = A.openP(draw(), false, 'bdbank'), paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); }, msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.a === 'x') { A.closeP(); return; } const D = day(), H = s.hist || (s.hist = []);
      if (b.dataset.d) { const m = A.money() | 0, v = b.dataset.d === 'half' ? Math.floor(m / 2 / 100) * 100 : 1000; if (v < 100 || !A.pay(v)) { sfx('tick'); msg(e ? 'Not enough money in your wallet.' : '지갑에 돈이 모자라요.'); return; }
        s.bal = (s.bal | 0) + v; if (!s.wk) s.wk = D; H.push([D, 'in', v, s.bal]); s.hist = H.slice(-12); s.n = (s.n | 0) + 1; mark(); sfx('ding'); reward('bank', 'trade', 2); A.rec('bldg', { k: 'bank', ev: 'in', v }); boardDraw();
        say9 = e ? 'Bank clerk: “I wrote ' + A.won(v) + ' in your bankbook.”' : '은행원: "통장에 ' + A.won(v) + '을 넣고 한 줄 적었어요."'; paint(); return; }
      if (b.dataset.w) { const bl = s.bal | 0, v = b.dataset.w === 'all' ? bl : Math.min(1000, bl); if (v < 1) return; s.bal = bl - v; A.refund(v); H.push([D, 'out', v, s.bal]); s.hist = H.slice(-12); mark(); sfx('pop'); A.rec('bldg', { k: 'bank', ev: 'out', v }); boardDraw();
        say9 = e ? 'Bank clerk: “Here is ' + A.won(v) + '. It is back in your wallet.”' : '은행원: "' + A.won(v) + '을 꺼내 드렸어요. 지갑으로 돌아갔어요."'; paint(); } };
    log('bank'); }

  // 📦 우체국: 물건 고르기 → 받을 이웃 → 지도 보고 주소 칸 → 소포 값 → 접수증(다음 날 닿음)
  function nbPick(D) { const seen = new Set(), cells = new Set(), out = [], at = (CUR && CUR.door) || [0, 0];   /* 받을 이웃 = 이 우체국에서 가까운 아홉 가운데 셋(다음 날 걸어가 인사할 수 있게) · 날마다 바뀜 */
    const L9 = (A.nbs() || []).filter(q => q && q.hk && q.cell && !seen.has(q.hk) && seen.add(q.hk)).map(q => [Math.hypot(q.x - at[0], q.z - at[1]), q]).sort((a, b) => a[0] - b[0]).slice(0, 9).map(q => [hashS('nb:' + D + ':' + q[1].hk), q[1]]).sort((a, b) => a[0] - b[0]).map(q => q[1]);
    for (const q of L9) { if (out.length >= 3) break; if (cells.has(q.cell)) continue; cells.add(q.cell); out.push(q); } return { pick: out, all: L9 }; }
  function post() { const s = S().post, e = en(), D = day();
    if (!A.open(POST_HRS[0], POST_HRS[1])) { toast('🌙 ' + (e ? 'The post counter is closed now. It opens at ' + hh(POST_HRS[0]) + '.' : '우체국 창구는 지금 문을 닫았어요. ' + hh(POST_HRS[0]) + '에 열어요.'), 3); return; }
    if ((s.box || []).some(q => q.d === D)) { toast('📦 ' + (e ? 'Post clerk: “Your parcel for today is with us. It arrives tomorrow morning. Come again tomorrow!”' : '우체국 직원: "오늘 소포는 벌써 받았어요. 내일 아침에 닿아요. 내일 또 와요!"'), 3.2); return; }
    const bag = A.bag(), goods = Object.keys(bag).filter(k => bag[k] > 0 && SENDK.includes((A.items[k] || [])[2])).slice(0, 8);
    if (!goods.length) { toast('📦 ' + (e ? 'Post clerk: “You have nothing to send. Bring food or a small thing in your bag.”' : '우체국 직원: "보낼 물건이 없어요. 가방에 먹거리나 작은 물건을 담아 와요."'), 3.2); return; }
    const NB = nbPick(D); if (!NB.pick.length) { toast('📦 ' + (e ? 'There is nobody to send to yet.' : '아직 소포를 받을 이웃이 없어요.'), 3); return; }
    let st = 0, it = null, nb = null, mis = 0, ADDR = [];
    const draw = () => '<h3>📦 ' + esc(L(TIP.post)) + '</h3>' + (st === 0
      ? '<div class="sm">' + esc(e ? 'Post clerk: “What would you like to send?” (1 of 4)' : '우체국 직원: "무엇을 보낼까요?" (1/4)') + '</div><div class="bd-two">' + goods.map(k => '<button class="sub" data-e="' + esc(k) + '">' + esc(k + ' ' + A.itemName(k)) + ' ×' + bag[k] + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : st === 1 ? '<div class="sm">' + esc(e ? 'Post clerk: “Who is it for?” (2 of 4)' : '우체국 직원: "누구에게 보낼까요?" (2/4)') + '</div><div class="bd-ch">' + NB.pick.map((q, j) => '<button class="sub" data-n="' + j + '">' + esc(q.icon + ' ' + q.who) + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : st === 2 ? '<div class="sm">' + esc(e ? 'Post clerk: “Write the address. Which cell is the red dot in? Read the letter on top and the number on the left.” (3 of 4)' : '우체국 직원: "주소를 써요. 빨간 점은 어느 칸에 있나요? 위 글자와 왼쪽 숫자를 이어 읽어요." (3/4)') + '</div><canvas class="bd-map" width="340" height="220"></canvas><div class="bd-two">' + ADDR.map(c => '<button class="sub" data-c="' + esc(c) + '">' + esc(e ? 'Cell ' + c : c + ' 칸') + '</button>').join('') + '</div><div class="sm" data-m></div>'
      : st === 3 ? '<div class="bd-sit">' + [e ? 'Item: ' + it + ' ' + A.itemName(it) : '보내는 물건: ' + it + ' ' + A.itemName(it), e ? 'To: ' + nb.who : '받는 사람: ' + nb.who, e ? 'Address: cell ' + nb.cell : '주소: ' + nb.cell + ' 칸'].map(t => esc(t)).join('<br>') + '</div><div class="sm">' + esc(e ? 'Post clerk: “The parcel costs ' + A.won(PARCEL) + '. It arrives tomorrow.” (4 of 4)' : '우체국 직원: "소포 값은 ' + A.won(PARCEL) + '이에요. 내일 닿아요." (4/4)') + '</div><div class="row"><button data-p="1"' + ((A.money() | 0) < PARCEL ? ' disabled' : '') + '>' + (e ? 'Pay ' + A.won(PARCEL) + ' and send' : A.won(PARCEL) + ' 내고 보내기') + '</button></div><div class="sm" data-m>' + ((A.money() | 0) < PARCEL ? esc(e ? 'Not enough money. Help a worker or sell at a market first.' : '돈이 모자라요. 일꾼을 거들거나 장터에서 팔고 와요.') : '') + '</div>'
      : '<div class="pc-tx">' + esc(e ? 'Post clerk: “Thank you. Your parcel goes in the mail bag tonight and reaches ' + nb.who + ' in cell ' + nb.cell + ' tomorrow. Go and say hello!”' : '우체국 직원: "고마워요. 소포는 오늘 밤 우편 가방에 실려 내일 ' + nb.cell + ' 칸 ' + nb.who + '께 닿아요. 내일 가서 인사해 봐요!"') + '</div>' + wordBox('post'))
      + '<div class="row"><button class="' + (st === 4 ? '' : 'sub') + '" data-a="x">' + (st === 4 ? (e ? 'OK' : '좋아요') : (e ? 'Close' : '닫기')) + '</button></div>';
    const P = A.openP(draw(), false, 'bdpost'), msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    let hit = null; const paint = () => { const bx = P.querySelector('.bx'); (bx || P).innerHTML = draw(); hit = null; const cv = P.querySelector('canvas.bd-map'); if (cv && nb) { const me = A.me(); try { hit = A.mapGrid(cv, [{ x: nb.x, z: nb.z, label: nb.icon, main: true }, { x: me.x, z: me.z, label: e ? 'Me' : '나' }]); } catch (x9) { hit = null; } } };
    const addr = c => { if (c === nb.cell) { sfx('ding'); st = 3; paint(); return; } mis++; sfx('tick'); msg(e ? 'Post clerk: “Find the red dot, then go straight up to the letter and straight left to the number.”' : '우체국 직원: "빨간 점에서 위로 곧장 올라가면 글자, 왼쪽으로 곧장 가면 숫자가 있어요."'); };
    P.onclick = ev => { const cv = ev.target.closest && ev.target.closest('canvas.bd-map'); if (cv && typeof hit === 'function' && st === 2) { const r = cv.getBoundingClientRect(), c = hit((ev.clientX - r.left) * cv.width / r.width, (ev.clientY - r.top) * cv.height / r.height); if (c) addr(c); return; }
      const b = ev.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.e) { it = b.dataset.e; st = 1; sfx('tick'); paint(); return; }
      if (b.dataset.n != null) { nb = NB.pick[+b.dataset.n]; const oth = NB.all.map(q => q.cell).filter((c, i, a) => c && c !== nb.cell && a.indexOf(c) === i), two = pick(oth, 2, 'ad:' + D + nb.cell); ADDR = shuf([nb.cell, ...two].map(c => [c, c]), 'ad' + D).map(q => q[1][0]); st = 2; log('addr ' + nb.cell); sfx('tick'); paint(); return; }
      if (b.dataset.c) { addr(b.dataset.c); return; }
      if (b.dataset.p) { if (!((A.bag()[it] | 0) > 0)) { msg(e ? 'That item is no longer in your bag.' : '그 물건이 가방에 없어요.'); return; } if (!A.pay(PARCEL)) { sfx('tick'); msg(e ? 'Not enough money.' : '돈이 모자라요.'); return; } A.take(it);
        const B = (s.box || []).filter(q => !q.ok || D - q.ok < 3); B.push({ id: 'p' + D + '-' + ((s.n | 0) + 1), e: it, to: nb.hk, k: nb.k, who: nb.who, icon: nb.icon, cell: nb.cell, x: +nb.x.toFixed(1), z: +nb.z.toFixed(1), g: +(+nb.g).toFixed(2), d: D, ok: 0 }); s.box = B.slice(-8); s.n = (s.n | 0) + 1; mark();
        if (CUR && CUR.box) CUR.box.visible = true; sfx('ding'); reward('post', 'explore', 2); A.rec('bldg', { k: 'post', ev: 'send', e: it, cell: nb.cell, mis }); st = 4; paint(); } };
    log('post'); }
  // 1초마다(town.js): 어제 넘게 보낸 소포 = 아침에 한 줄 · 받는 이웃 10m 안에 가면 말풍선 + 하트(문 bldg:post)
  function sec() { const s = S().post, D = day(), L9 = (s.box || []).filter(q => q && !q.ok && q.d < D); if (!L9.length) return; const e = en();
    if (s.told !== D && !A.panelOpen()) { s.told = D; mark(); const q = L9[0]; toast('📦 ' + (e ? 'Your parcel reached ' + q.who + ' in cell ' + q.cell + '. Go and say hello!' : '보낸 소포가 ' + q.cell + ' 칸 ' + q.who + '께 닿았어요. 가서 인사해 봐요.'), 4); return; }
    const me = A.me(); if (!me) return;
    for (const q of L9) { if (Math.hypot(me.x - q.x, me.z - q.z) > 10 || Math.abs(me.y - q.g) > 4) continue; q.ok = D; mark(); A.bubble({ x: q.x, y: q.g, z: q.z, sc: 1 }, e ? 'Got your parcel. Thank you!' : '소포 잘 받았어요. 고마워요!'); A.heartTo(q.to, 1, 'bldg:post'); sfx('ding');
      toast('📦 ' + (e ? q.who + ' got your ' + A.itemName(q.e) + ' and says thank you. ❤' : q.who + '이 ' + A.itemName(q.e) + ' 소포를 받고 고맙대요. ❤'), 3); A.rec('bldg', { k: 'post', ev: 'thx', cell: q.cell }); if (CUR && CUR.box) CUR.box.visible = false; break; } }
  function readBoard() { const e = en(), k = CUR.k, s = S()[k], D = day(); let body = '';
    if (k === 'police') { const n = helped('lost'); body = (s.d112 ? (e ? '★ 112 helper: practised ' + (s.n112 | 0) + ' time(s).' : '★ 112 어린이 도우미: 연습 ' + (s.n112 | 0) + '번') : (e ? 'Practise 112 calls at the counter to get your name here.' : '창구에서 112 신고 연습을 하면 여기에 붙어요.')) + '<br>' + (n ? (e ? '♥ Lost children you helped home: ' + n : '♥ 가족에게 데려다준 길 잃은 아이: ' + n + '명') : (e ? 'When a 112 call comes, help a lost child find family.' : '112 출동이 오면 길 잃은 아이의 가족을 찾아 줘요.')); }
    else if (k === 'clinic') body = (s.dfa ? (e ? '✓ Twisted ankle: keep still, cool it, raise it.<br>✓ Heat sickness: shade, water if awake, fan.' : '✓ 발목을 삐면: 움직이지 않기, 차갑게, 높이 올리기<br>✓ 더위를 먹으면: 그늘로, 정신이 또렷하면 물, 부채질') : (e ? 'Learn first aid with the nurse to fill this board.' : '간호사 선생님께 응급 처치를 배우면 이 판이 채워져요.')) + ((s.hi || []).length ? '<br>' + (e ? '♥ Neighbours who said thanks: ' : '♥ 고맙다고 한 이웃: ') + s.hi.length : '');
    else if (k === 'bank') body = (e ? 'In the bankbook: ' : '통장에 있는 돈: ') + esc(A.won(s.bal | 0)) + '<br>' + ((s.hist || []).slice(-5).map(r => esc(dayT(r[0]) + ' · ' + kindT(r[1]) + ' ' + A.won(r[2]) + ' → ' + A.won(r[3]))).join('<br>') || (e ? 'Save at the counter and a line is written here.' : '창구에서 저금하면 여기에 한 줄씩 적혀요.'));
    else body = (s.fed === D ? (e ? '✓ Fed today.' : '✓ 오늘 밥을 먹었어요.') : (e ? 'Not fed yet today. Ask at the food shelf.' : '오늘 아직 밥을 못 먹었어요. 사료 선반에서 도와요.')) + (s.n ? '<br>' + (e ? '★ Meals you gave: ' + s.n : '★ 내가 준 밥: ' + s.n + '번') : '');
    const P = A.openP('<h3>📋 ' + esc(CUR.name) + '</h3><div class="pc-tx">' + body + '</div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'bdboard'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; }

  function dispose() { left(); if (css) { css.remove(); css = null; } }
  return { tip, canIn, opts, left, dispose, open, sec, pend: () => { const b = (A.GAME.S.bldg || {}).post; return !!(b && Array.isArray(b.box) && b.box.some(q => q && !q.ok)); },
    info: () => ({ cur: CUR ? { k: CUR.k, name: CUR.name, food: CUR.food ? CUR.food.visible : null, box: CUR.box ? CUR.box.visible : null, nb: !!(CUR.made && CUR.made.nb), at: CUR.at, extra: (CUR.made.extra || []).map(h => ({ k: h.k, label: h.label, at: [CUR.at[0] + h.stand[0], CUR.at[1] + h.stand[1], CUR.at[2] + h.stand[2]] })) } : null, s: JSON.parse(JSON.stringify(S())), dbg: DBG.slice() }),
    dbg: { use: kk => use(kk), sec: () => sec(), int: () => bankInt(), board: () => (CUR && CUR.board ? CUR.board.c.toDataURL().length : 0) } };
}
