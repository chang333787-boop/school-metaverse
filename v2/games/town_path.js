// 🛤 나의 길(PATH-1 · 성취 네 기둥 ④ '내 결과가 남는 마을' · 정본 docs/systems/town_achieve.md · 사용자 10-25 '성취가 뭔지 모르겠어 · 꼭 뭔가 생산하지 않고도 길이 있지 않을까 · 다음 날에는 이거 해야지가 없어')
//   여섯 길(탐험가·관찰가·이웃·마을 도우미·기록가·도전가) = 이미 있는 기록을 읽어 '걸음'으로 셈(새 놀이 X · 솜씨 숫자는 그대로 · 걸음으로 보여 줄 뿐)
//   길마다 표지판 둘(첫판) · 표지판을 지나면 = 마을이 실제로 바뀜(깃발·지도판·진열장·관찰 판·정자 방석·잔치 상·감사장·조끼 걸이·소식지·땅이름 팻말·기록판 둘) — 보상은 그 변화 자체
//   이미 해 둔 아이 = 들어올 때 이미 넘은 표지판은 하루 하나씩('어제 걸은 길') · 이번에 새로 넘은 것은 그 자리에서 바로(배너 한 줄 + 칩을 누르면 빨간 선 · 컷신 X)
//   수첩 🛤 나의 길 = 길 그림(발자국 · 다음 표지판 그림) · 숫자·%·n/m·체크칸 X · 하루 마무리 = '오늘 ○○ 길로 세 걸음' + '내일 한 걸음이면 …'(town_day.js 손잡이)
//   저장 GAME.S.path = { v, got: { 길: 지난 표지판 수 }, od: 지난 표지판을 마지막으로 연 날(하루 하나), ds: { d, s: { 길: 그날 처음 걸음 }, prev }, don: { 돌: 수 }, vest: 0|1 }
//     걸음 수 자체는 저장하지 않음(늘 기록에서 다시 셈 — 기록이 바뀌면 그대로 따라감)
//   지킴: 판타지·전투 X · 순위·남과 비교 X(기록판 = 내 최고만) · 실명 X(이웃 = 하는 일) · 학생 작품 X · 빈 칭찬 X(무엇을 했는지만) · 새 Light X · 매 프레임 일 0(1초 칸 sec · 걸음 셈 3초마다)
//     · 화석은 가져오지 않음(사실 — 진열장 = 찾은 자리를 본뜬 모형 + 찾은 곳 이름표 · 가방의 조약돌·송이 돌만 기증) · 글자 판(캔버스)에는 이모지 X
import { FINDS } from './town_xp.js?v=5';
import { WILD, drawWild } from './town_wild.js?v=9';
import { ladRows } from './town_lad.js?v=2';
import { getLook, setLook, PALS } from '../js/look.js?v=1';
import { chalSteps } from './town_orient.js?v=2';   /* CHAL-1 도전 모드로 찾아간 날 · ORIENT-1 길찾기 시험 코스 */
export const PATH_V = 1;
const T2 = (ko, en) => [ko, en];
const NW = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
const NWE = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const nWord = (n, en) => (en ? (n <= 10 ? NWE[n] : 'more than ten') : (n <= 10 ? NW[n] : '열 넘는'));
const FONT = '"Noto Sans KR","Noto Sans CJK KR","Apple SD Gothic Neo","Malgun Gothic","NanumGothic",sans-serif';
const keys = o => (o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o) : []);
const arr = a => (Array.isArray(a) ? a : []);
const fixN = fx => arr(fx && fx.log).filter(q => q && q.ok).length + (fx && fx.cur && fx.cur.rep ? 1 : 0);   /* 고칠 곳 신고 = 낸 것만(생긴 자리 수 n X) */
const has = (S, e) => (((S.bag || {})[e] | 0) > 0) || (S.dex || {})[e] != null;

// ───────── 길 여섯(표지판 둘 · need = 그 표지판까지 걸음) ─────────
//   at = 바뀌는 자리(town.js가 넘기는 자리 이름) · pic = 수첩 길 그림 끝 그림(HTML 글자 · 캔버스 X)
export const PATHS = {
  explore: { ic: '🧭', t: T2('탐험가', 'Explorer'), how: T2('새 칸에 가 보기, 산꼭대기·등대·징검다리, 썰물섬 돌탑, 층층골·까망봉, 숨은 놀람 찾기', 'New map cells, the summit, lighthouse and stepping stones, the isle cairn, the gorge and crater, hidden wonders'),
    signs: [{ need: 3, at: 'look', pic: '🚩', t: T2('전망대에 내 깃발이 꽂혀요', 'My flag goes up at the lookout'), past: T2('전망대에 내 깃발이 꽂혔어요', 'My flag is up at the lookout'), go: T2('깃발 보러 가기', 'See the flag') },
      { need: 8, at: 'look', pic: '🗺', t: T2('전망대에 내가 걸어 본 마을 지도판이 서요', 'A map board of the town I walked stands at the lookout'), past: T2('전망대에 내가 걸어 본 마을 지도판이 섰어요', 'A map of where I walked stands at the lookout'), go: T2('지도판 보러 가기', 'See the map board') }] },
  look: { ic: '🔍', t: T2('관찰가', 'Observer'), how: T2('곤충·물고기·바다 친구·별·동물을 도감에, 화석 찾기, 실험 규칙 알아내기, 박물관 옛 물건 알아보기', 'Insects, fish, shore life, stars and animals in the guide, fossils, experiment rules, old things at the museum'),
    signs: [{ need: 4, at: 'museum', pic: '🏺', t: T2('박물관에 내가 찾은 것 진열장이 생겨요', 'A showcase of my finds opens at the museum'), past: T2('박물관에 내가 찾은 것 진열장이 생겼어요', 'The museum has a showcase of my finds'), go: T2('박물관 가기', 'Go to the museum') },
      { need: 10, at: 'museum', pic: '📋', t: T2('학예사가 내 관찰 기록을 판에 붙이고 들려줘요', 'The curator pins up my observations and talks about them'), past: T2('학예사가 내 관찰 기록을 판에 붙였어요', 'The curator pinned up my observations'), go: T2('박물관 가기', 'Go to the museum') }] },
  nb: { ic: '🤝', t: T2('이웃', 'Neighbour'), how: T2('일꾼 곁에서 거들어 마음 쌓기, 요리 나눠 주기, 선물하기, 꾸러미를 채워 마을 바꾸기', 'Help workers and grow hearts, share dishes, give presents, fill bundles to change the town'),
    signs: [{ need: 3, at: 'pav', pic: '🟫', t: T2('정자에 내 방석이 놓여요', 'My cushion is set out at the pavilion'), past: T2('정자에 내 방석이 놓였어요', 'My cushion is at the pavilion'), go: T2('정자 가기', 'Go to the pavilion') },
      { need: 8, at: 'pav', pic: '🍲', t: T2('정자 앞에 잔치 상이 차려지고 초대장이 와요', 'A feast table and an invitation appear at the pavilion'), past: T2('정자 앞에 잔치 상이 차려졌어요', 'A feast table is set at the pavilion'), go: T2('정자 가기', 'Go to the pavilion') }] },
  help: { ic: '🚨', t: T2('마을 도우미', 'Town helper'), how: T2('긴급 출동, 고칠 곳 신고, 사건 수첩 풀기, 태풍 준비, 경찰서 신고 연습과 응급 처치, 보호센터 밥 주기', 'Emergencies, reporting repairs, solving cases, typhoon prep, police-call practice and first aid, feeding shelter animals'),
    signs: [{ need: 3, at: 'hall', pic: '📜', t: T2('행정복지센터 게시판에 내 감사장이 붙어요', 'A thank-you certificate goes up on the community centre board'), past: T2('행정복지센터 게시판에 내 감사장이 붙었어요', 'My certificate is on the community centre board'), go: T2('감사장 보러 가기', 'See the certificate') },
      { need: 8, at: 'hall', pic: '👕', t: T2('게시판 옆에 도우미 조끼가 걸려요(입어 볼 수 있어요)', 'A helper vest hangs by the board (you can wear it)'), past: T2('게시판 옆에 도우미 조끼가 걸렸어요', 'A helper vest hangs by the board'), go: T2('조끼 보러 가기', 'See the vest') }] },
  rec: { ic: '📷', t: T2('기록가', 'Recorder'), how: T2('사진 기사 내기, 요리 사진, 엽서, 노인정에서 옛 땅이름 듣기', 'Photo stories, dish photos, postcards, old place names at the seniors’ hall'),
    signs: [{ need: 3, at: 'post', pic: '📰', t: T2('우체국 벽 마을 소식지에 내 기록이 실려요', 'My records appear in the town newsletter at the post office'), past: T2('우체국 벽 마을 소식지에 내 기록이 실렸어요', 'My records are in the newsletter at the post office'), go: T2('소식지 보러 가기', 'See the newsletter') },
      { need: 8, at: 'elder', pic: '📌', t: T2('노인정 앞에 내가 들은 옛 땅이름 팻말이 서요', 'A sign of the old place names I heard stands by the seniors’ hall'), past: T2('노인정 앞에 내가 들은 땅이름 팻말이 섰어요', 'My place-name sign stands by the seniors’ hall'), go: T2('팻말 보러 가기', 'See the sign') }] },
  chal: { ic: '🏅', t: T2('도전가', 'Challenger'), how: T2('일 놀이 도전 칸 오르기, 판 놀이, 스키 기문 코스, 자전거 고리 코스, 길찾기 시험, 도전 모드로 찾아가기(하루 한 번)', 'Climb work-game steps, board games, ski gate courses, the bike ring course, orienteering, finding places in challenge mode (once a day)'),
    signs: [{ need: 3, at: 'stall', pic: '📋', t: T2('장터에 내 최고 기록판이 서요', 'My best-records board stands at the market'), past: T2('장터에 내 최고 기록판이 섰어요', 'My best-records board stands at the market'), go: T2('기록판 보러 가기', 'See the board') },
      { need: 8, at: 'ski', pic: '⛷', t: T2('스키장 아래에 내 최고 기록판이 서요', 'My best-runs board stands at the bottom of the ski slope'), past: T2('스키장 아래에 내 최고 기록판이 섰어요', 'My ski board stands at the bottom of the slope'), go: T2('스키 기록판 보러 가기', 'See the ski board') }] },
};
export const P_ORDER = ['explore', 'look', 'nb', 'help', 'rec', 'chal'];

// ───────── 걸음 셈(순수 · 저장 S만 읽음 — 시험이 그대로 부름) ─────────
export function stepsOf(S) { S = S || {}; const xp = S.xp && typeof S.xp === 'object' ? S.xp : {}, bd = S.bldg && typeof S.bldg === 'object' ? S.bldg : {}, P = S.path && typeof S.path === 'object' ? S.path : {};
  const explore = Math.floor(keys(S.cells).length / 5) + ['⛰', '🗼', '👣'].filter(e => has(S, e)).length + (xp.il ? 1 : 0) + (xp.cairn ? 1 : 0) + (xp.sc ? 1 : 0) + (keys(xp.fos).length ? 1 : 0) + keys(xp.surp).length;
  const chem = S.chem && typeof S.chem === 'object' ? S.chem : {}, don = P.don && typeof P.don === 'object' ? P.don : {};
  const look = keys(S.dex).filter(k => /^(bug|fish|shore|star|wild):/.test(k)).length + keys(xp.fos).length + (xp.q ? 1 : 0) + keys(chem.found).length + keys((bd.museum || {}).got).length + (has(S, '🔭') ? 1 : 0) + Math.min(3, keys(don).reduce((a, k) => a + (don[k] | 0), 0));
  const H = S.hearts && typeof S.hearts === 'object' ? S.hearts : {};
  const nb = keys(H).reduce((a, k) => a + Math.min(5, ((H[k] || 0) / 3) | 0), 0) + Math.min(5, S.shared | 0) + Math.min(5, arr(S.deeds).filter(q => q && q.t === 'gift').length) + keys(S.bun2 && S.bun2.on).length;   /* BUNDLE-2 꾸러미로 바뀐 곳마다 한 걸음 */
  const em = S.emerg && typeof S.emerg === 'object' ? S.emerg : {}, fx = S.fix && typeof S.fix === 'object' ? S.fix : {}, cs = S.case && typeof S.case === 'object' ? S.case : {}, ty = S.typh && typeof S.typh === 'object' ? S.typh : {};
  const help = arr(em.log).filter(q => q && q.ok).length * 2 + fixN(fx) + keys(cs.done).length * 2 + arr(ty.reqs).filter(q => q && q.st === 'done').length
    + ((bd.police || {}).d112 ? 1 : 0) + ((bd.clinic || {}).dfa ? 1 : 0) + Math.min(3, (bd.shelter || {}).n | 0);
  const pr = S.press && typeof S.press === 'object' ? S.press : {};
  const rec = arr(pr.news).length * 2 + Math.min(5, arr(pr.list).length) + Math.min(4, arr(S.album).length) + arr((bd.elder || {}).got).length + ((S.dex || {})['✉'] != null ? 1 : 0);
  const sk = xp.ski && typeof xp.ski === 'object' ? xp.ski : {}, mg = S.lad && S.lad.mg && typeof S.lad.mg === 'object' ? S.lad.mg : {}, tg = S.tbl && S.tbl.g && typeof S.tbl.g === 'object' ? S.tbl.g : {};
  const chal = ['c1', 'c2', 'c3'].filter(c => sk[c] && sk[c].best != null).length + keys(mg).reduce((a, k) => a + ((mg[k] && mg[k].best && mg[k].best.lv) | 0), 0) + keys(tg).reduce((a, k) => a + ((tg[k] && tg[k].lv) | 0) + ((tg[k] && tg[k].w) > 0 ? 1 : 0), 0) + ['🥇', '🥈', '🥉'].filter(e => has(S, e)).length + chalSteps(S);
  return { explore, look, nb, help, rec, chal }; }
export const reachedOf = (k, n) => PATHS[k].signs.filter(s => n >= s.need).length;

const CSS = `.twn-p .pth-row{border:3px solid #2b2420;border-left:9px solid var(--pc,#3b6fb6);border-radius:12px;background:#fffdf6;padding:8px 10px;margin:8px 0}
.twn-p .pth-row h4{margin:0 0 2px;font-size:16px}.twn-p .pth-row svg{display:block;width:100%;height:auto;max-width:560px}
.twn-p .pth-nx{font-size:15px;font-weight:800;margin:2px 0}.twn-p .pth-how{font-size:13px;opacity:.82}.twn-p .pth-past{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.twn-p .pth-past button{min-height:40px;font-size:14px;text-align:left}`;
const PCOL = { explore: '#2f8a4e', look: '#3b6fb6', nb: '#d9822b', help: '#c8553d', rec: '#7d5bb8', chal: '#c9931a' };

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · on() · lang() · esc · openP(h, wide, kind) · closeP() · panel() · busy() · say(t, s) · sfx(k) · banner(t, s) · chip(k, t, o) · route(p) · dialog(o) · rec(k, o)
//   gy(x, z) · okSpot(x, z) · buildParts(fn) · take(e) · bag() · diary(t)
//   자리: spots() = { look: { x, z } | null, hall/post/elder: { name, door, fw, c } | null, stall: [x, z] | null, ski: { at, u } | null, pav: { seat, all } | null, museum: { name, door } | null }
//   drawVisited(cv) 내가 가 본 칸 지도(캔버스) · cellName(x, z)
export function createPath(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t ?? '')), esc = t => A.esc(t);
  const G = () => A.GAME.S, day = () => G().day | 0, mark = () => A.GAME.mark();
  const S = () => { const g = G(); let s = g.path; if (!s || typeof s !== 'object' || s.v !== PATH_V) s = g.path = { v: PATH_V, got: {}, od: -1, ds: null, don: {}, vest: 0 }; if (!s.got || typeof s.got !== 'object') s.got = {}; if (!s.don || typeof s.don !== 'object') s.don = {}; return s; };
  let css = null, dead = false, ST = null, stT = 0, BOOT = null, VIS = {}, HOT = {}, SPOT = null, chipT = 0, chipK = '', BKEY = {}, vestOn = false; const DBG = [];
  const log = t => { DBG.push(t); if (DBG.length > 30) DBG.shift(); };
  if (!document.getElementById('pth-css')) { css = document.createElement('style'); css.id = 'pth-css'; css.textContent = CSS; document.head.appendChild(css); }
  const steps = force => { const t = performance.now(); if (!ST || force || t - stT > 3000) { ST = stepsOf(G()); stT = t; } return ST; };
  const spots = () => SPOT || (SPOT = (A.spots && A.spots()) || {});

  // ───────── 바뀌는 것(합친 부품 + 글자 판) ─────────
  const addG = (g, x, z, ry, y) => { g.position.set(x, y == null ? A.gy(x, z) : y, z); g.rotation.y = ry || 0; g.userData.fx = 1; map.add(g); g.updateMatrixWorld(true); return g; };
  function board(w, h, draw) { const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; tx.anisotropy = 2;
    const m = new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshLambertMaterial({ map: tx })); m.userData.fx = 1; const B = { m, c, tx, draw }; B.redraw = () => { draw(c.getContext('2d'), c.width, c.height); tx.needsUpdate = true; }; B.redraw(); return B; }
  const paper = (g, W, H, frame, head) => { g.fillStyle = frame; g.fillRect(0, 0, W, H); g.fillStyle = '#fbf7ec'; g.fillRect(12, 12, W - 24, H - 24); g.fillStyle = '#2b2420'; g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '900 38px ' + FONT; g.fillText(head, 30, 26); };
  const fitT = (g, t, w) => { let s = String(t); if (g.measureText(s).width <= w) return s; while (s.length > 2 && g.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; };
  const lines = (g, L9, y0, W, step) => { g.font = '800 27px ' + FONT; L9.slice(0, 6).forEach((t, i) => { const y = y0 + i * (step || 44); g.fillStyle = '#b5483a'; g.fillRect(32, y + 11, 10, 10); g.fillStyle = '#2b2420'; g.fillText(fitT(g, t, W - 92), 54, y); }); };
  /* 판 하나 = 기둥 둘 + 판 뒤 널 + 글자 판(앞면) · 바깥 판은 땅에 서 있음(지지 없는 부재 X) */
  function standBoard(x, z, ry, w, h, y, draw, frame) { const g = A.buildParts(put => { for (const s of [-1, 1]) put('b', s * (w / 2 + 0.03), 0, -0.04, 0.09, y + h + 0.08, 0.09, 0x6b4a2f); put('b', 0, y - 0.06, -0.07, w + 0.14, h + 0.14, 0.05, frame || 0x8a6a4a); }); addG(g, x, z, ry);
    const B = board(w, h, draw); B.m.position.set(0, y + h / 2 + 0.01, -0.035); B.m.rotation.y = 0; g.add(B.m); B.m.updateMatrixWorld(true); return { g, B }; }
  const fwRy = fw => Math.atan2(fw[0], fw[1]);
  /* 자리 고르기: 기준점 둘레 반지름 r0~r0+3 · 16 방향 · okSpot */
  function near(cx, cz, r0, pref) { const A9 = pref != null ? [pref, pref + 0.4, pref - 0.4, pref + 0.8, pref - 0.8] : []; for (let i = 0; i < 16; i++) A9.push(i / 16 * Math.PI * 2);
    for (const r of [r0, r0 + 1.5, r0 + 3]) for (const a of A9) { const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; if (A.okSpot(x, z) && !(A.avoid && A.avoid(x, z))) return [x, z]; } return null; }   /* avoid = 꾸러미로 생긴 물건 곁(BUNDLE-2) */
  /* 건물 문 옆(옆으로 3m · 문 앞 0.6m) · 판은 바깥을 봄 */
  function byDoor(B9, side) { if (!B9 || !B9.door) return null; const fw = B9.fw || [0, 1], sx = -fw[1], sz = fw[0];
    for (const s of [side, -side, side * 1.6, -side * 1.6, side * 2.3]) { const x = B9.door[0] + sx * 3 * s - fw[0] * 0.6, z = B9.door[1] + sz * 3 * s - fw[1] * 0.6; if (A.okSpot(x, z) && !(A.avoid && A.avoid(x, z))) return { x, z, ry: fwRy(fw) }; }
    return { x: B9.door[0] + sx * 3 * side, z: B9.door[1] + sz * 3 * side, ry: fwRy(fw) }; }
  const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

  // 판 글(기록에서 · 그릴 때마다 다시 읽음)
  const visitedN = () => keys(G().cells).length;
  function certLines() { const s = G(), e = en(), o = [], em = arr((s.emerg || {}).log).filter(q => q && q.ok), n = k => em.filter(q => q.k === k).length;
    if (n('lost')) o.push(e ? 'Took ' + nWord(n('lost'), 1) + ' lost child(ren) back to family' : '길 잃은 아이를 가족에게 ' + nWord(n('lost')) + ' 번 데려다줌');
    { const m = em.length - n('lost'); if (m > 0) o.push(e ? 'Called for help in ' + nWord(m, 1) + ' emergency(ies)' : '긴급 출동에서 ' + nWord(m) + ' 번 도움'); }
    { const f = fixN(s.fix); if (f) o.push(e ? 'Reported ' + nWord(f, 1) + ' broken spot(s) to fix' : '고칠 곳을 ' + nWord(f) + ' 번 신고함'); }
    { const c = keys((s.case || {}).done).length; if (c) o.push(e ? 'Solved ' + nWord(c, 1) + ' case(s) in the case notebook' : '사건 수첩 사건을 ' + nWord(c) + ' 개 풀어냄'); }
    { const t = arr((s.typh || {}).reqs).filter(q => q && q.st === 'done').length; if (t) o.push(e ? 'Got ' + nWord(t, 1) + ' place(s) ready for the typhoon' : '태풍 오기 전에 ' + nWord(t) + ' 곳을 준비함'); }
    const bd = s.bldg || {}; if ((bd.police || {}).d112) o.push(e ? 'Practised 112 calls' : '112 신고를 연습함'); if ((bd.clinic || {}).dfa) o.push(e ? 'Learned first aid' : '응급 처치를 배움'); if ((bd.shelter || {}).n) o.push(e ? 'Fed the shelter animals' : '보호센터 동물에게 밥을 줌');
    return o; }
  function newsLines() { const s = G(), e = en(), o = [], pr = s.press || {}; for (const q of arr(pr.news).slice(-3).reverse()) if (q && q.h) o.push(String(q.h[e ? 1 : 0] || q.h[0] || ''));
    const al = arr(s.album); if (al.length) o.push(e ? 'Dish photos in my album: ' + nWord(Math.min(10, al.length), 1) : '내 앨범 요리 사진 ' + nWord(Math.min(10, al.length)) + ' 장');
    const eg = arr(((s.bldg || {}).elder || {}).got); if (eg.length) o.push((e ? 'Old place names I heard: ' : '어르신께 들은 땅이름: ') + eg.slice(-3).join(', '));
    if ((s.dex || {})['✉'] != null) o.push(e ? 'Sent a postcard from the town' : '마을 엽서를 보냄'); return o; }
  function bestLines(kind) { const e = en(), s = G(), o = [];
    if (kind === 'ski') { const sk = (s.xp || {}).ski || {}; [['c1', T2('쉬운 기문 코스', 'Easy gate course')], ['c2', T2('중간 기문 코스', 'Middle gate course')], ['c3', T2('어려운 기문 코스', 'Hard gate course')]].forEach(([c, t]) => { const r = sk[c]; if (r && r.best != null) o.push(L(t) + ' — ' + (+r.best).toFixed(1) + (e ? ' s' : '초')); }); if (!o.length) o.push(e ? 'No ski run yet — ride the lift and try the gates' : '아직 탄 기록이 없어요. 리프트 타고 기문 코스로'); return o; }
    let R = []; try { R = ladRows(s, e) || []; } catch (x) { R = []; } for (const r of R) if (r.best) o.push(r.name + ' — ' + r.best);
    for (const k of keys((s.tbl || {}).g)) { const g = s.tbl.g[k]; if (g && g.w > 0) o.push((e ? 'Board game ' + k + ': won ' + nWord(Math.min(10, g.w), 1) : '판 놀이 이긴 판 ' + nWord(Math.min(10, g.w)) + ' 번')); }
    for (const [m, t] of [['🥇', T2('자전거 고리 코스 금', 'Bike ring course gold')], ['🥈', T2('자전거 고리 코스 은', 'Bike ring course silver')], ['🥉', T2('자전거 고리 코스 동', 'Bike ring course bronze')]]) if (has(s, m)) { o.push(L(t)); break; }
    if (!o.length) o.push(e ? 'Do work games and your best shows here' : '일 놀이를 하면 내 최고가 여기에 적혀요'); return o; }
  function obsNames() { const s = G(), e = en(), o = [], xp = s.xp || {};
    for (const f of FINDS) if ((xp.fos || {})[f.id]) o.push(L(f.t)); for (const k of keys(s.dex)) { if (!/^wild:/.test(k)) continue; const w = WILD.find(q => q.id === k.slice(5)); if (w) o.push(L(w.t)); }
    const nb = keys(s.dex).filter(k => /^bug:/.test(k)).length, nf = keys(s.dex).filter(k => /^fish:/.test(k)).length, nc = keys((s.chem || {}).found).length;
    if (nb) o.push(e ? 'insects in my guide: ' + nWord(Math.min(10, nb), 1) : '도감 곤충 ' + nWord(Math.min(10, nb)) + ' 가지'); if (nf) o.push(e ? 'fish: ' + nWord(Math.min(10, nf), 1) : '물고기 ' + nWord(Math.min(10, nf)) + ' 가지'); if (nc) o.push(e ? 'experiment rules found: ' + nWord(Math.min(10, nc), 1) : '알아낸 실험 규칙 ' + nWord(Math.min(10, nc)) + ' 개'); return o; }

  // 표지판마다 짓기(k:i) — 자리가 없으면 null(그 마을엔 그 자리가 없음 · 수첩엔 그대로)
  const hot = (id, x, z, label, use, r) => { if (HOT[id]) HOT[id].remove(); HOT[id] = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: r || 1.6, label, use }); };
  const myTop = () => { try { const l = getLook(); return PALS.top[l.top | 0][0]; } catch (x) { return 0x5aa6e0; } };
  function build(k, i) { const id = k + ':' + i, P = spots(); drop(id); let out = null;
    if (k === 'explore') { const v = P.look; if (!v) return null;
      if (i === 0) { const sp = near(v.x, v.z, 5.5, 0.6); if (!sp) return null; const col = myTop(); const g = A.buildParts(put => { put('c', 0, 0, 0, 0.05, 3.2, 0, 0x8a8f99); put('s', 0, 3.22, 0, 0.08, 1, 0, 0xd9c7a5); put('b', 0.47, 2.45, 0, 0.9, 0.62, 0.03, col); put('b', 0.47, 2.45, 0.02, 0.5, 0.06, 0.012, 0xfbf7ec); put('c', 0, 0, 0, 0.32, 0.18, 0, 0x8d8a80); for (let j = 0; j < 5; j++) put('b', Math.cos(j * 1.26) * 0.42, 0, Math.sin(j * 1.26) * 0.42, 0.22, 0.14 + (j % 2) * 0.06, 0.2, 0x9aa0a6, 0, j); });   /* 깃대 · 꼭지 · 깃발(내 윗옷 색) · 흰 띠 · 받침돌 · 돌 다섯 */
        out = { g: addG(g, sp[0], sp[1], faceTo(sp[0], sp[1], v.x, v.z) + Math.PI / 2), at: sp }; }
      else { const sp = near(v.x, v.z, 6.5, -0.9); if (!sp) return null; const ry = faceTo(sp[0], sp[1], v.x, v.z), drawMap = (g, W, H) => { g.fillStyle = '#6b4a2f'; g.fillRect(0, 0, W, H); const c = document.createElement('canvas'); c.width = W - 28; c.height = H - 78; try { A.drawVisited(c); } catch (x) { /* 지도 없음 */ } g.drawImage(c, 14, 64); g.fillStyle = '#fbf7ec'; g.textBaseline = 'top'; g.textAlign = 'left'; g.font = '900 34px ' + FONT; g.fillText(en() ? 'The town I walked' : '내가 걸어 본 마을', 24, 16); };
        const sb = standBoard(sp[0], sp[1], ry, 1.9, 1.5, 0.75, drawMap, 0x6b4a2f); out = { g: sb.g, B: sb.B, at: sp, key: () => 'v' + visitedN() }; } }
    else if (k === 'look') return null;   /* 박물관 방 안(room()이 지음 · 들어갈 때만) */
    else if (k === 'nb') { const pv = P.pav; if (!pv || !pv.seat) return null; const st = pv.seat;
      if (i === 0) { const g = A.buildParts(put => { put('b', 0, 0, 0, 0.56, 0.06, 0.52, 0xc0504a); put('b', 0, 0.055, 0, 0.5, 0.012, 0.46, 0xe9b04a); put('b', 0, 0.06, 0, 0.12, 0.016, 0.12, 0xc0504a); }); out = { g: addG(g, st.x, st.z, st.yaw, st.y + 0.43), at: [st.x, st.z] }; }   /* 방석(붉은 천 · 노란 테 · 가운데 매듭) — 앉는 자리 위 */
      else { const sp = near(pv.c[0], pv.c[1], 4.2, st.yaw); if (!sp) return null; const g = A.buildParts(put => { for (const [a, b] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) put('b', a, 0, b, 0.07, 0.36, 0.07, 0x7a5232); put('b', 0, 0.36, 0, 1.2, 0.05, 0.8, 0x9b6a3c);
          for (const [a, b, c] of [[-0.35, -0.15, 0xf6f4ee], [0.0, -0.18, 0xf6f4ee], [0.35, -0.12, 0xf6f4ee], [-0.2, 0.18, 0xf6f4ee], [0.25, 0.2, 0xf6f4ee]]) { put('c', a, 0.41, b, 0.13, 0.05, 0, c); } put('s', -0.35, 0.47, -0.15, 0.08, 0.5, 0, 0xe0453a); put('s', 0.0, 0.47, -0.18, 0.09, 0.5, 0, 0xf2c230); put('s', 0.35, 0.47, -0.12, 0.08, 0.5, 0, 0x6aa84f); put('s', -0.2, 0.47, 0.18, 0.08, 0.45, 0, 0xc98a4a); put('s', 0.25, 0.47, 0.2, 0.08, 0.45, 0, 0xffffff);
          put('b', 0.5, 0.41, 0.32, 0.22, 0.02, 0.16, 0xfbf7ec); put('b', 0.5, 0.43, 0.32, 0.2, 0.004, 0.02, 0xc0504a); });   /* 낮은 상 · 그릇 다섯(나물·전·떡·밤·밥) · 초대장 */
        out = { g: addG(g, sp[0], sp[1], st.yaw), at: sp }; hot(id, sp[0], sp[1], '✉ ' + (en() ? 'Read the feast invitation' : '잔치 초대장 읽기'), () => invite(), 1.5); } }
    else if (k === 'help') { const B9 = P.hall; if (!B9) return null;
      if (i === 0) { const sp = byDoor(B9, 1); const sb = standBoard(sp.x, sp.z, sp.ry, 1.6, 1.15, 0.85, (g, W, H) => { paper(g, W, H, '#8a6a4a', en() ? 'Thank-you certificate' : '감사장'); g.font = '800 26px ' + FONT; g.fillStyle = '#5a4a3a'; g.fillText(en() ? 'For the young helper of our town' : '우리 마을 어린이 도우미에게', 32, 80); lines(g, certLines(), 130, W, 46); g.strokeStyle = '#c8553d'; g.lineWidth = 6; g.beginPath(); g.arc(W - 70, H - 64, 34, 0, 6.2832); g.stroke(); g.font = '900 24px ' + FONT; g.fillStyle = '#c8553d'; g.textAlign = 'center'; g.fillText(en() ? 'Town' : '센터', W - 70, H - 78); }, 0x7a5232);
        out = { g: sb.g, B: sb.B, at: [sp.x, sp.z], key: () => certLines().join('|') }; hot(id, sp.x + Math.sin(sp.ry) * 1.2, sp.z + Math.cos(sp.ry) * 1.2, '📜 ' + (en() ? 'Read my certificate' : '내 감사장 읽기'), () => readCert(), 1.4); }
      else { const sp = byDoor(B9, -1); const g = A.buildParts(put => { put('b', -0.55, 0, 0, 0.08, 1.7, 0.08, 0x6b4a2f); put('b', 0.55, 0, 0, 0.08, 1.7, 0.08, 0x6b4a2f); put('b', 0, 1.62, 0, 1.2, 0.06, 0.06, 0x6b4a2f); put('b', 0, 1.5, 0, 0.04, 0.12, 0.04, 0x3a3f4a);
          put('b', 0, 0.85, 0, 0.7, 0.66, 0.08, 0xf2a93b); put('b', 0, 1.42, 0, 0.5, 0.1, 0.09, 0xf2a93b); for (const y of [1.0, 1.18]) put('b', 0, y, 0.045, 0.72, 0.05, 0.01, 0xeef4ee, 1); put('b', 0, 1.0, -0.05, 0.3, 0.3, 0.01, 0xfbf7ec); });   /* 옷걸이 틀 · 조끼(주황 · 빛 띠 둘) */
        out = { g: addG(g, sp.x, sp.z, sp.ry), at: [sp.x, sp.z] }; hot(id, sp.x + Math.sin(sp.ry) * 1.1, sp.z + Math.cos(sp.ry) * 1.1, vestOn ? '👕 ' + (en() ? 'Take off the helper vest' : '도우미 조끼 벗기') : '👕 ' + (en() ? 'Wear the helper vest' : '도우미 조끼 입기'), () => vest(!vestOn), 1.4); } }
    else if (k === 'rec') { const B9 = i === 0 ? P.post : (P.elder || P.post); if (!B9) return null;
      if (i === 0) { const sp = byDoor(B9, 1); const sb = standBoard(sp.x, sp.z, sp.ry, 1.7, 1.25, 0.8, (g, W, H) => { paper(g, W, H, '#7d5bb8', en() ? 'Town newsletter' : '마을 소식지'); const pr = (G().press || {}), last = arr(pr.list).filter(q => q && q.id).slice(-1)[0], w = last ? WILD.find(q => q.id === last.id) : null;
          if (w) { const c = document.createElement('canvas'); c.width = 150; c.height = 110; try { drawWild(c, w); } catch (x) { /* 그림 없음 */ } g.fillStyle = '#dfe9f2'; g.fillRect(W - 186, 22, 160, 120); g.drawImage(c, W - 181, 27); g.strokeStyle = '#2b2420'; g.lineWidth = 3; g.strokeRect(W - 186, 22, 160, 120); }
          g.font = '800 24px ' + FONT; g.fillStyle = '#5a4a3a'; g.fillText(en() ? 'What our recorder saw' : '우리 마을 기록가가 남긴 것', 32, 80); lines(g, newsLines(), 150, W, 46); }, 0x5b4a7a);
        out = { g: sb.g, B: sb.B, at: [sp.x, sp.z], key: () => newsLines().join('|') }; }
      else { const sp = byDoor(B9, P.elder ? 1 : -1); const sb = standBoard(sp.x, sp.z, sp.ry, 1.5, 1.0, 0.7, (g, W, H) => { paper(g, W, H, '#6b4a2f', en() ? 'Old place names I heard' : '내가 들은 옛 땅이름'); const eg = arr(((G().bldg || {}).elder || {}).got); lines(g, eg.length ? eg.slice(-5) : [en() ? 'Hear them from the elder inside' : '안에서 어르신께 들어요'], 92, W, 48); }, 0x5a3e28);
        out = { g: sb.g, B: sb.B, at: [sp.x, sp.z], key: () => arr(((G().bldg || {}).elder || {}).got).join('|') }; } }
    else if (k === 'chal') { if (i === 0) { const st = P.stall; if (!st) return null; const sp = near(st[0], st[1], 3.6); if (!sp) return null; const sb = standBoard(sp[0], sp[1], faceTo(sp[0], sp[1], st[0], st[1]), 1.6, 1.15, 0.8, (g, W, H) => { paper(g, W, H, '#c9931a', en() ? 'My best' : '내 최고'); g.font = '800 23px ' + FONT; g.fillStyle = '#5a4a3a'; g.fillText(en() ? 'Only me against me' : '나와만 견주는 기록', 32, 74); lines(g, bestLines('lad'), 120, W, 46); }, 0x8a6a1a);
        out = { g: sb.g, B: sb.B, at: sp, key: () => bestLines('lad').join('|') }; }
      else { const sk = P.ski, st = sk ? sk.at : P.stall; if (!st) return null; const sp = near(st[0], st[1], sk ? 5 : 6.5); if (!sp) return null; const sb = standBoard(sp[0], sp[1], faceTo(sp[0], sp[1], st[0], st[1]), 1.6, 1.0, 0.8, (g, W, H) => { paper(g, W, H, '#3b6fb6', en() ? 'My best ski runs' : '내 스키 최고'); lines(g, bestLines('ski'), 96, W, 48); }, 0x2b4a7a);
        out = { g: sb.g, B: sb.B, at: sp, key: () => bestLines('ski').join('|') }; } }
    if (out) { VIS[id] = out; if (out.key) BKEY[id] = out.key(); log('build ' + id); } return out; }
  function drop(id) { const v = VIS[id]; if (v) { map.remove(v.g); v.g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.material && o.material.map) { o.material.map.dispose(); o.material.dispose(); } } }); delete VIS[id]; } if (HOT[id]) { HOT[id].remove(); delete HOT[id]; } }
  function buildAll() { const s = S(); for (const k of P_ORDER) for (let i = 0; i < (s.got[k] | 0); i++) if (!VIS[k + ':' + i]) build(k, i); }

  // ───────── E ─────────
  async function invite() { const e = en(), s = G(), H = s.hearts || {}, who = keys(H).filter(k => ((H[k] || 0) / 3 | 0) >= 2).length;
    await A.dialog({ who: e ? 'Invitation' : '초대장', icon: '✉', text: [e ? 'On clear days at 18:00, the neighbours meet at the pavilion after work.' : '맑은 날 18:00, 일을 마친 이웃들이 정자에 모여요.', (e ? 'Your cushion is ready there. ' : '네 방석도 거기 놓아 두었어. ') + (who ? (e ? nWord(who, 1) + ' neighbour(s) who know you well will be there.' : '너를 잘 아는 이웃 ' + nWord(who) + ' 명도 와.') : (e ? 'Come and sit with us.' : '와서 같이 앉자.')), e ? 'Rain or snow means no gathering that day.' : '비나 눈이 오면 그날은 안 모여.'] }); A.sfx('tick'); log('invite'); }
  async function readCert() { const e = en(), L9 = certLines(); await A.dialog({ who: e ? 'Community centre' : '행정복지센터', icon: '📜', text: [e ? 'This certificate lists what you did for the town:' : '이 감사장에는 네가 마을을 위해 한 일이 적혀 있어요.', L9.length ? L9.join(e ? '. ' : '. ') + '.' : (e ? 'Nothing yet.' : '아직 적힌 일이 없어요.')] }); log('cert'); }
  function vest(on) { if (on === vestOn) return; try { const l = getLook(); if (on) { S().vest = 1; S().top0 = l.top | 0; setLook({ ...l, top: 2 }, { noSave: true }); } else { S().vest = 0; setLook({ ...l, top: S().top0 | 0 }, { noSave: true }); } } catch (x) { /* 모습 없음 */ } vestOn = on; mark(); A.sfx('pop');
    A.say(on ? (en() ? '👕 You put on the orange helper vest.' : '👕 주황 도우미 조끼를 입었어요.') : (en() ? '👕 You hung the vest back up.' : '👕 조끼를 다시 걸어 두었어요.'), 2.4); if (VIS['help:1']) build('help', 1); log('vest ' + on); }

  // 박물관 방(town_bldg.js roomMuseum이 부름 · 들어갈 때만) — 표지판 하나 = 진열장 + 기증 E · 둘 = 관찰 기록 판 + 학예사 E
  function room(kind, K, S9) { if (kind !== 'museum') return []; const s = S(), n = s.got.look | 0, ex = []; if (!n) return ex; const P = S9.put, X0 = -2.6, Z0 = 2.3, xp = G().xp || {};
    P('b', X0, 0, Z0, 2.2, 0.82, 0.8, 0x8a5a34); P('b', X0, 0.82, Z0, 2.26, 0.05, 0.86, 0x6b4a2f); P('b', X0, 0.87, Z0, 2.1, 0.02, 0.7, 0xeae2cf); K.colL(S9, X0, Z0, 1.13, 0.43, -0.5, 1.2);   /* 진열장(나무 받침 · 테 · 천) */
    for (const [a, b] of [[-1.08, -0.38], [1.08, -0.38], [-1.08, 0.38], [1.08, 0.38]]) P('b', X0 + a, 0.87, Z0 + b, 0.04, 0.34, 0.04, 0xc9d6dc);   /* 유리 모서리 기둥 */
    for (const b of [-0.38, 0.38]) P('b', X0, 1.21, Z0 + b, 2.2, 0.04, 0.04, 0xc9d6dc); for (const a of [-1.08, 1.08]) P('b', X0 + a, 1.21, Z0, 0.04, 0.04, 0.72, 0xc9d6dc);   /* 위 테(뚜껑 판 X — 위에서 내려다봐도 안이 보이게) */
    const F9 = FINDS.filter(f => (xp.fos || {})[f.id]); FINDS.forEach((f, j) => { const x = X0 - 0.78 + j * 0.52, z = Z0 - 0.12, got = F9.includes(f);   /* 본뜬 모형(찾은 것만 · 못 찾은 자리 = 빈 받침) */
      P('b', x, 0.89, z, 0.34, 0.03, 0.26, 0xd9cfb9);
      if (!got) return; if (f.id === 'f1') { P('b', x, 0.92, z, 0.3, 0.05, 0.22, 0x8d8475); for (let q = 0; q < 4; q++) P('b', x - 0.08 + q * 0.05, 0.97, z, 0.02, 0.008, 0.16, 0x5f7a52); }
      else if (f.id === 'f2') { P('c16', x, 0.92, z, 0.12, 0.05, 0, 0xcbbb9e); for (let q = 0; q < 5; q++) P('b', x - 0.08 + q * 0.04, 0.97, z, 0.012, 0.008, 0.18, 0x9a8a6e, 0, (q - 2) * 0.25); }
      else if (f.id === 'f3') { P('b', x, 0.92, z, 0.3, 0.05, 0.22, 0x86684f); for (let q = 0; q < 4; q++) P('b', x, 0.97, z - 0.08 + q * 0.055, 0.26, 0.01, 0.018, 0x6e5440); }
      else for (const [a, b] of [[-0.06, 0], [0.05, 0.04], [0.02, -0.06]]) P('s', x + a, 0.97, z + b, 0.045, 0.75, 0, 0x9b958b); });
    const don = s.don || {}; let di = 0; for (const [e9, c] of [['⚪', 0xd8d4cc], ['⚫', 0x7a3a2a]]) for (let q = 0; q < Math.min(3, don[e9] | 0); q++) { P('s', X0 - 0.7 + di * 0.28, 0.93, Z0 + 0.22, 0.06, 0.7, 0, c); di++; }   /* 내가 기증한 돌 */
    ex.push({ k: 'pth:don', stand: [X0, 0, Z0 + 1.1], r: 1.1, label: '🎁 ' + (en() ? 'Donate a pebble from my bag' : '가방의 돌 기증하기') });
    ex.push({ k: 'pth:case', stand: [X0 + 1.4, 0, Z0 + 0.9], r: 0.9, label: '🏺 ' + (en() ? 'Look at my showcase' : '내가 찾은 것 진열장 보기') });
    if (n >= 2) { P('b', X0, 0, Z0 - 0.5, 1.2, 2.2, 0.06, 0x6b4a2f);   /* 진열장 뒤 관찰 기록 판(바닥에 선 판 · 틀) */
      const B = board(1.1, 0.95, (g, W, H) => { paper(g, W, H, '#3b6fb6', en() ? 'What I observed' : '내가 관찰한 것'); lines(g, obsNames().slice(0, 6), 80, W, 44); }); B.m.position.set(S9.at[0] + X0, S9.at[1] + 1.68, S9.at[2] + Z0 - 0.465); B.m.updateMatrix(); B.m.matrixAutoUpdate = false; (S9.extra || (S9.extra = [])).push(B.m);
      ex.push({ k: 'pth:cur', stand: [0, 0, -2.9], r: 1.1, label: '🗣 ' + (en() ? 'Ask the curator about my finds' : '학예사에게 내 발견 듣기') }); }
    log('room museum ' + n); return ex; }
  async function use(kk) { const e = en(), s = S(), xp = G().xp || {};
    if (kk === 'pth:don') { const B9 = A.bag() || {}, e9 = (B9['⚪'] | 0) > 0 ? '⚪' : (B9['⚫'] | 0) > 0 ? '⚫' : null;
      if (!e9) { A.say(e ? '🎁 No pebble in my bag. Pick one up on the forest floor or at the crater.' : '🎁 가방에 돌이 없어요. 숲 바닥이나 까망봉에서 주워 와요.', 3); return; }
      if (((s.don[e9] | 0) >= 3)) { A.say(e ? '🎁 The showcase already has three of those.' : '🎁 진열장에 그 돌은 벌써 셋이 있어요.', 2.6); return; }
      if (!A.take(e9)) return; s.don[e9] = (s.don[e9] | 0) + 1; mark(); ST = null; A.sfx('ding'); A.say(e ? '🎁 You donated a ' + (e9 === '⚪' ? 'pebble' : 'scoria pebble') + '. It is in the showcase next time you come in.' : '🎁 ' + (e9 === '⚪' ? '조약돌' : '송이 돌') + '을 기증했어요. 다음에 들어오면 진열장에 놓여 있어요.', 3.2); A.rec('path', { ev: 'don', e: e9 }); return; }
    if (kk === 'pth:case') { const F9 = FINDS.filter(f => (xp.fos || {})[f.id]); await A.dialog({ who: e ? 'Curator' : '학예사', icon: '🏺', text: [F9.length ? (e ? 'These are casts of what you found in the gorge: ' : '층층골에서 찾은 것을 본떠 만든 모형이에요: ') + F9.map(f => L(f.t)).join(', ') + '.' : (e ? 'The trays are waiting for fossils you find in the layered gorge.' : '층층골에서 화석을 찾으면 이 빈 받침에 본뜬 모형이 놓여요.'), e ? 'Real fossils stay where they were found, so the next person can see the layers too.' : '진짜 화석은 찾은 자리에 두어요. 그래야 다음 사람도 지층과 함께 볼 수 있어요.'] }); return; }
    if (kk === 'pth:cur') { const O = obsNames(); await A.dialog({ who: e ? 'Curator' : '학예사', icon: '🗣', text: [O.length ? (e ? 'From your notebook: ' : '네 수첩에서 옮겨 적었어요. ') + O.slice(0, 4).join(', ') + '.' : (e ? 'Your notebook is still empty.' : '아직 수첩이 비어 있어요.'), keys(G().dex).some(k => /^wild:/.test(k)) ? (e ? 'You wrote where and when you saw each animal. That is how scientists keep records too.' : '동물마다 어디서, 언제 봤는지 적었지요. 과학자도 그렇게 기록해요.') : (e ? 'Write down where and when you see things. That is how scientists keep records.' : '어디서, 언제 봤는지 적어 두면 과학자처럼 기록하는 거예요.')] }); return; } }

  // ───────── 표지판 지나기 ─────────
  function where(k, i) { const P = spots(), sg = PATHS[k].signs[i], v = VIS[k + ':' + i];
    const at = v && v.at ? v.at : sg.at === 'museum' ? (P.museum && P.museum.door) : sg.at === 'look' ? (P.look ? [P.look.x, P.look.z] : null) : sg.at === 'pav' ? (P.pav ? P.pav.c : null) : sg.at === 'stall' ? P.stall : sg.at === 'ski' ? (P.ski ? P.ski.at : P.stall) : ((P[sg.at] || P.post || {}).door || null);
    return at ? { icon: PATHS[k].ic, name: L(PATHS[k].t) + (en() ? ' path' : ' 길'), door: [at[0], at[1]] } : null; }
  function pass(k, back) { const s = S(), i = s.got[k] | 0, R = PATHS[k], sg = R.signs[i]; if (!sg) return false; s.got[k] = i + 1; if (back) s.od = day(); mark(); build(k, i);
    const e = en(), head = R.ic + ' ' + (back ? (e ? 'The path you walked: ' : '어제까지 걸은 길: ') : '') + L(R.t) + (e ? ' path sign — ' : ' 길 표지판: ') + L(sg.past);
    A.banner(head, 4.2); A.sfx('done'); A.rec('path', { ev: 'sign', k, i, back: !!back }); if (A.diary) A.diary(L(R.t) + (e ? ' path: ' : ' 길: ') + L(sg.past));
    const p = where(k, i); chipK = k + ':' + i; chipT = performance.now(); A.chip('twn-path', R.ic + ' ' + L(sg.go), p ? { onClick: () => { A.chip('twn-path', null); chipK = ''; A.route(p); log('go ' + k + i); } } : undefined);
    log('pass ' + k + i + (back ? ' back' : '')); return true; }
  function sec(force) { if (dead || !A.on()) return; const s = S(), st = steps(force); if (!BOOT) { BOOT = {}; for (const k of P_ORDER) BOOT[k] = reachedOf(k, st[k]); vestOn = !!s.vest; if (vestOn) { try { setLook({ ...getLook(), top: 2 }, { noSave: true }); } catch (x) { /* 모습 없음 */ } } buildAll(); log('boot ' + JSON.stringify(BOOT)); }
    const ds = s.ds; if (!ds || ds.d !== day()) { s.ds = { d: day(), s: { ...st }, prev: ds && ds.d === day() - 1 ? { d: ds.d, s: ds.s } : null }; mark(); }
    if (chipK && performance.now() - chipT > 90000) { A.chip('twn-path', null); chipK = ''; }
    if (!A.busy() && !A.panel()) for (const k of P_ORDER) { const got = s.got[k] | 0, R = reachedOf(k, st[k]); if (got >= R) continue; const back = got < BOOT[k]; if (back && s.od === day()) continue; if (pass(k, back)) break; }
    for (const id of keys(VIS)) { const v = VIS[id]; if (!v.B || !v.key) continue; const kk = v.key(); if (kk !== BKEY[id]) { BKEY[id] = kk; v.B.redraw(); } } }

  // ───────── 수첩 🛤 나의 길(길 그림 · 숫자·% X) ─────────
  function pathSvg(k, n) { const R = PATHS[k], s = S(), got = s.got[k] | 0, sg = R.signs[got], prev = got ? R.signs[got - 1].need : 0, W = 560, H = 92, col = PCOL[k];
    const pt = t => { const x = 26 + t * (W - 110), y = 52 + Math.sin(t * Math.PI * 2) * 16; return [x, y]; }; let d = ''; for (let i = 0; i <= 40; i++) { const [x, y] = pt(i / 40); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    let h = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(L(R.t)) + '"><path d="' + d + '" fill="none" stroke="#e4d8bd" stroke-width="18" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#cdbb94" stroke-width="2" stroke-dasharray="6 8"/>';
    for (let j = 0; j < got; j++) h += '<g transform="translate(' + (14 + j * 22) + ',20)"><rect x="-2" y="0" width="4" height="22" fill="#6b4a2f"/><rect x="-9" y="-10" width="18" height="12" rx="2" fill="' + col + '"/></g>';   /* 지난 표지판(작은 팻말) */
    const span = sg ? sg.need - prev : 1, fs = sg ? Math.min(10, span) : 8, done = sg ? Math.max(0, Math.min(span, n - prev)) : span, lit = sg ? Math.round(done / span * fs) : fs;   /* 다 지난 길 = 발자국 여덟 모두 진하게 */
    for (let j = 0; j < fs; j++) { const t = (j + 0.6) / (fs + 0.6), [x, y] = pt(t), on = j < lit, ry = (j % 2 ? 6 : -6); h += '<g transform="translate(' + x.toFixed(1) + ',' + (y + ry).toFixed(1) + ') rotate(90)"><ellipse rx="7" ry="4.6" fill="' + (on ? '#5a3e28' : 'none') + '" stroke="' + (on ? '#5a3e28' : '#bfae8c') + '" stroke-width="1.6"/><circle cx="-9" cy="0" r="2.4" fill="' + (on ? '#5a3e28' : 'none') + '" stroke="' + (on ? '#5a3e28' : '#bfae8c') + '" stroke-width="1.2"/></g>'; }   /* 발자국(걸은 것 = 진하게 · 남은 것 = 빈 테) */
    const [ex, ey] = pt(1); h += '<g transform="translate(' + (ex + 34) + ',' + (ey - 2) + ')"><rect x="-3" y="-6" width="6" height="40" fill="#6b4a2f"/><rect x="-30" y="-40" width="60" height="38" rx="6" fill="' + (sg ? '#fffdf6' : col) + '" stroke="' + col + '" stroke-width="4"/><text x="0" y="-14" text-anchor="middle" font-size="22">' + esc(sg ? sg.pic : R.ic) + '</text></g>';
    return h + '</svg>'; }
  function open() { const e = en(), s = S(), st = steps(true);
    const rows = P_ORDER.map(k => { const R = PATHS[k], got = s.got[k] | 0, sg = R.signs[got], R9 = reachedOf(k, st[k]);
      const nx = sg ? (got < R9 ? (e ? 'You reached the next sign. It opens on a new day: ' : '다음 표지판에 닿았어요. 새 하루에 열려요: ') + L(sg.t) : (e ? 'Next sign: ' : '다음 표지판: ') + L(sg.t)) : (e ? 'You passed both signs on this path. They stay in town.' : '이 길의 표지판 둘을 다 지났어요. 바뀐 것은 마을에 그대로 있어요.');
      const past = R.signs.slice(0, got).map((q, i) => '<button class="sub" data-pk="' + k + '" data-pi="' + i + '">' + esc(q.pic + ' ' + L(q.past)) + ' 🧭</button>').join('')
        + (k === 'nb' && A.tales ? A.tales().map(q => '<button class="sub" data-tale="' + esc(q.k) + '">' + esc('💬 ' + q.who + (e ? '’s story' : '의 사연')) + '</button>').join('') : '');   /* BUNDLE-2 들은 이웃 사연(다시 읽기) */
      return '<div class="pth-row" style="--pc:' + PCOL[k] + '" data-path="' + k + '"><h4>' + R.ic + ' ' + esc(L(R.t)) + (e ? ' path' : ' 길') + '</h4>' + pathSvg(k, st[k]) + '<div class="pth-nx">' + esc(nx) + '</div><div class="pth-how">' + esc((e ? 'Steps come from: ' : '걸음이 되는 것: ') + L(R.how)) + '</div>' + (past ? '<div class="pth-past">' + past + '</div>' : '') + '</div>'; }).join('');
    const h = '<h3>🛤 ' + (e ? 'My paths' : '나의 길') + '</h3><div class="sm">' + esc(e ? 'Each path grows from what you do in town. Pass a sign and something in town changes.' : '마을에서 한 일이 길마다 발자국이 돼요. 표지판을 지나면 마을에 무언가 생겨요.') + '</div>' + rows + '<div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>';
    const W = A.openP(h, false, 'path'); W.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.pk) { const p = where(b.dataset.pk, +b.dataset.pi); A.closeP(); if (p) A.route(p); return; } if (b.dataset.tale && A.tale) { A.tale(b.dataset.tale); return; } if (b.dataset.a === 'x') A.closeP(); }; log('open'); return W; }

  // ───────── 하루 마무리 손잡이(town_day.js) ─────────
  function todaySteps(d) { const s = S(), st = steps(true), ds = s.ds && s.ds.d === d ? s.ds : s.ds && s.ds.prev && s.ds.prev.d === d ? s.ds.prev : null; if (!ds) return []; return P_ORDER.map(k => [k, Math.max(0, st[k] - (ds.s[k] | 0))]).filter(q => q[1] > 0).sort((a, b) => b[1] - a[1]); }
  function dayRow(d) { const T = todaySteps(d), e = en(); if (!T.length) return null; const t = T.slice(0, 2).map(([k, n]) => (e ? nWord(n, 1) + ' step' + (n > 1 ? 's' : '') + ' on the ' + L(PATHS[k].t) + ' path' : L(PATHS[k].t) + ' 길로 ' + nWord(n) + ' 걸음')).join(e ? ', ' : ', ');
    return ['path', '🛤', e ? 'My paths' : '나의 길', esc((e ? 'Today: ' : '오늘 ') + t)]; }
  function dayWait() { const s = S(), st = steps(true), e = en(); let best = null;
    for (const k of P_ORDER) { const got = s.got[k] | 0, sg = PATHS[k].signs[got]; if (!sg) continue; const left = got < reachedOf(k, st[k]) ? 0 : sg.need - st[k]; if (!best || left < best.left) best = { k, left, sg, got }; }
    if (!best || best.left > 3) return null; const R = PATHS[best.k], p = where(best.k, best.got);
    const t = best.left <= 0 ? (e ? R.t[1] + ' path: tomorrow the next sign opens — ' + best.sg.t[1] : R.t[0] + ' 길: 내일 다음 표지판이 열려요. ' + best.sg.t[0]) : (e ? R.t[1] + ' path: ' + nWord(best.left, 1) + ' more step' + (best.left > 1 ? 's' : '') + ' and ' + best.sg.t[1].charAt(0).toLowerCase() + best.sg.t[1].slice(1) : R.t[0] + ' 길: ' + nWord(best.left) + ' 걸음이면 ' + best.sg.t[0]);
    return { k: 'path', ic: R.ic, s: T2(R.t[0] + ' 길', R.t[1] + ' path'), t: [t, t], p: best.left <= 0 ? p : null }; }

  function dispose() { dead = true; for (const id of keys(VIS)) drop(id); for (const id of keys(HOT)) { HOT[id].remove(); } HOT = {}; A.chip('twn-path', null); if (vestOn) { try { setLook({ ...getLook(), top: S().top0 | 0 }, { noSave: true }); } catch (x) { /* */ } } if (css) { css.remove(); css = null; } }
  function rebuild() { SPOT = null; for (const id of keys(VIS)) drop(id); buildAll(); }
  return { sec, open, room, use, dayRow, dayWait, dispose, rebuild, has: () => true, steps: () => ({ ...steps(true) }),
    busyNow: () => [!!A.busy(), !!A.panel(), !!A.on()], vest: on => vest(!!on), cert: () => certLines(), news: () => newsLines(), obs: () => obsNames(), best: k => bestLines(k),
    info: () => ({ got: { ...S().got }, od: S().od, boot: BOOT ? { ...BOOT } : null, vis: keys(VIS), vat: Object.fromEntries(keys(VIS).map(id => { const g = VIS[id].g; return [id, [+g.position.x.toFixed(2), +g.position.z.toFixed(2), +g.rotation.y.toFixed(3), !!g.parent, +g.position.y.toFixed(2)]]; })), hot: keys(HOT), vest: vestOn, don: { ...S().don }, chip: chipK, ds: S().ds }), dbg: () => DBG.slice(), redraw: () => { for (const id of keys(VIS)) if (VIS[id].B) VIS[id].B.redraw(); } };
}
