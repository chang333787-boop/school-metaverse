// 🎿 스키 기문 코스(SLALOM-1 · 설계 docs/systems/town_explore.md '34 스키 기문' · town_minis.md §4 · 짓는 조각 차례 7)
//   스키장(town.js skiArea·skiTick·SKR) 위에 기문(깃발 문) 코스 셋 — 초급(본 슬로프 · A/D만) → 중급(본 슬로프 · S 꾹 = 눈쟁기) → 상급(둘째 슬로프 · W 꾹 = 웅크리기)
//     열리는 차례: 초급을 다 지나 완주 → 중급 → 상급 · 같은 마을은 늘 같은 코스(씨앗 = 마을 판 id · 연습이 됨)
//     ※ 설계 '상급 = 둘째 슬로프로 이어 내려가는 긴 코스'는 두 슬로프 사이 숲 띠 8m(아이 판 '산림 보호')를 베어야 해서, 상급은 둘째 슬로프(폭 12m · 더 좁고 촘촘)에 따로 둠
//   문 판정 = 지난 프레임 a와 이번 a 사이에 기문이 있으면 그 자리의 옆 거리(lat)가 두 막대 사이인지(비교 몇 줄 · 새 객체 X)
//     지나면 딩(한 칸씩 높게) + 그 깃발이 흔들림 · 놓치면 한 줄(벌 X · 시간 더하기 X) · 다 지난 판만 '내 기록'에
//   초 숫자는 수첩(🎿 스키 기록 탭) 안에만 · 끝 창은 '내 지난 최고와의 차이'만 · 순위·남과 견주기 X
//   그림자 스키어 = 내 최고 판을 반투명으로 다시 탐(나와 겨루기) · 처음 앞지르면 한 줄
//   보상 = 솜씨만(탐험 · rwCheck 꼬리표 'xp:chal' 하루 한도) — 코스마다 처음 완주 +3 · 내 최고를 깨면 +1 · 잠·되풀이로 생기는 보상 없음(일이 생길 때만)
//   그리기: 기문 막대 = 인스턴스 한 벌(겨울 · 160m 안 · +1) · 다음 기문 노란 테(탈 때만 +1) · 그림자 사람(탈 때만 +1) · 새 Light X · 매 프레임 = 탈 때 비교 몇 줄 · 흔들리는 깃발만 행렬 다시 씀
//   저장 GAME.S.xp.ski = { c1: { best, last, n }, c2, c3, ghost: { c1: [a×10, lat×10, …] (0.1초마다) } } · 학급 기록 REC.add('ski', { c, t, g, n })
//   홍보판(SM_PROMO)에서는 마을 쪽이 이 모듈을 만들지 않음(예전 스키 그대로)
//   출발 준비(JUDGE-2 · 10-26 '꾹은 탈것 조작이라 남김 · 대신 판단 하나 더'): 출발 전 창 하나 = 오늘 눈(때 → 단단함·알맞음·무름) + 기온 + 바람을 보고 왁스 고르기
//     눈: 아침(11시 전) = 밤새 얼어 단단하고 반들반들 · 한낮 = 알맞음 · 오후(13시 반부터 · 맑은 날) = 햇볕에 녹아 무르고 무거움 · 눈 오는 날은 녹지 않음 · 비 오는 날은 늘 무름
//     왁스: 파란 = 영하 1도보다 추운 날의 단단한 눈 · 빨간 = 0도 가까운 날의 물기 있는 눈(실제 스키 왁스는 통에 맞는 기온이 적혀 있음) · 안 맞으면 덜 미끄러짐(빨라지기 ×0.75 · 최고 −1.5) = 내 기록이 늦어짐(시간 비용 · 벌 X)
//     눈 결: 단단한 눈 = 눈쟁기가 덜 먹힘(초당 −2.5 · 날이 미끄러져 돌기도 덜) → 일찍 눈쟁기 · 무른 눈 = 무거워 덜 빨라짐(×0.9) · 눈쟁기가 잘 먹힘(−5.5)
//     바람: 슬로프를 가로지르는 바람 = 몸이 옆으로 밀림(바람 센 날 초당 0.6m · 보통 0.2m) → 기문보다 바람 불어오는 쪽을 겨눔 · 깃발 막대가 바람 쪽으로 기울어 보임 · 맞바람 = 최고 −0.8 · 뒷바람 = +0.8
export const SKI_V = 1;
const T2 = (ko, en) => [ko, en];
// 코스: b = 슬로프(0 본 · 1 둘째) · n 기문 수 · w 막대 사이 · amp 좌우 엇갈림 · pat 엇갈림 꼴(작은 값 = 곧은 구간 · 웅크리기 자리) · need 열리는 조건 · pl 눈쟁기 · tu 웅크리기
const CO = [
  { id: 'c1', b: 0, n: 5, w: 4.5, amp: 2.6, pat: [1, -1, 1, -1, 1], need: null, pl: 0, tu: 0, nm: T2('초급', 'Easy') },
  { id: 'c2', b: 0, n: 7, w: 3.8, amp: 3.2, pat: [1, -1, 1, -1, 1, -1, 1], need: 'c1', pl: 1, tu: 0, nm: T2('중급', 'Medium') },
  { id: 'c3', b: 1, n: 8, w: 3.2, amp: 2.6, pat: [1, -1, 1, 0.15, -0.15, 0.15, -1, 1], need: 'c2', pl: 1, tu: 1, nm: T2('상급', 'Hard') }];
const FACT = [T2('회전 경기 기문은 빨강과 파랑이 번갈아 서 있어요.', 'Slalom gates alternate red and blue.'),
  T2('눈쟁기는 스키 앞을 A자로 모아 눈을 밀어내며 속도를 줄이는 자세예요.', 'The snowplough points the ski tips together in an A to push snow and slow down.'),
  T2('몸을 웅크리면 바람에 덜 부딪혀서 더 빨라져요.', 'Tucking down means less wind hits you, so you go faster.'),
  T2('스키 바닥에 왁스를 바르면 눈과 덜 비벼져서 잘 미끄러져요.', 'Waxing the bottom of skis means less rubbing on snow, so they glide better.'),
  T2('산이 많은 고장은 겨울에 스키장을 열어 관광객이 오고 일자리가 생겨요.', 'Mountain towns open ski resorts in winter, which brings visitors and jobs.')];
const NOTE = [784, 880, 988, 1047, 1175, 1319, 1397, 1568, 1760];
const RED = 0xe0453a, BLUE = 0x3d74c9, MISS = 0x9aa0a6;
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = s => { let a = hashS(s) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// 마을 쪽이 넘기는 것(A): T3 · map · GAME(게터) · lang() · esc · openP(h, wide, kind) · closeP() · say(t, s) · banner(t, s) · goal(t) · tone(...) · sfx(k)
//   ski() SKI(Ls · ux·uz·px·pz · top · oB · ryS) · skiAt(a, o) → [x, z] · ty(x, z) · winter() · touch() · seed() 씨앗 글
//   start(ci) 마을 skiStart(코스) · lift() 리프트 타기 · skUp(k, n, src) · rec(k, o) · stamp() ⛷ 도장(없을 때만)
export function createSki(A) {
  const T3 = A.T3, map = A.map, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const O = new T3.Object3D(), CLR = new T3.Color(), CW = new T3.Color(0xffffff);
  let CS = [], M = null, RING = null, GH = null, GMAT = null, MAT = null, GEOS = [], SHOWK = '', dead = false, R = null, TB = null;
  const IN = { turn: 0, pl: false, tu: false }, TBS = { pl: false, tu: false }, WN = { lat: 0, al: 0, k: 0 };   /* 오늘 바람(슬로프 기준 · 가로 lat · 세로 al(+ = 뒷바람)) — 짓기·출발 때 한 번 읽음 */
  // 오늘 눈·기온·바람(출발 준비 창과 물리가 같이 씀 · 같은 날 같은 때 = 같은 값)
  function today() { const G = A.GAME.S, m = G.min | 0, wx = A.wx ? A.wx() : 'clear', R9 = rng('ski-day:' + A.seed() + ':' + G.day), snow = wx === 'rain' ? 'soft' : m < 660 ? 'hard' : m >= 810 && wx === 'clear' ? 'soft' : 'mid';
    const tC = snow === 'hard' ? -9 + Math.floor(R9() * 4) : snow === 'soft' ? 1 + Math.floor(R9() * 2) : -4 + Math.floor(R9() * 2); return { snow, tC, wax: tC <= -1 ? 'cold' : 'warm', wx }; }
  function windRead() { const S9 = A.ski(), W = A.wind ? A.wind() : null; WN.lat = WN.al = 0; WN.k = 0; if (!S9 || !W || !Number.isFinite(W.x)) return; const k = A.windy && A.windy() ? 0.6 : 0.2; WN.k = k; WN.lat = (W.x * S9.px + W.z * S9.pz) * k; WN.al = (W.x * S9.ux + W.z * S9.uz) * (k > 0.3 ? 0.8 : 0.3); }
  const ST = () => { const S = A.GAME.S, X = S.xp || (S.xp = {}); return X.ski || (X.ski = {}); };
  const rec = id => ST()[id] || null;
  const open = c => !c.need || !!(rec(c.need) && rec(c.need).best != null);
  // ── 코스 짓기(짓기 때 한 번 · 마을마다 같은 씨앗) ──
  function build() { const S9 = A.ski(); CS = []; SHOWK = ''; if (!S9) return; windRead(); const r9 = rng('ski-gates:' + A.seed());
    for (const d of CO) { const b = d.b && S9.oB ? 1 : 0, o0 = b ? S9.oB : 0, hw = (b ? 6 : 8) - 1.2, Ls = S9.Ls, g = [];
      for (let i = 0; i < d.n; i++) { const a = 10 + i * (Ls - 16) / (d.n - 1), lim = hw - d.w / 2 + 0.6; let o = d.pat[i] * d.amp + (r9() - 0.5) * 0.6; o = Math.max(-lim, Math.min(lim, o)); g.push({ a, o: o0 + o, st: 0, wob: 0 }); }
      CS.push({ ...d, b, o0, hw, g, i0: 0 }); }
    let k = 0; for (const c of CS) { c.i0 = k; k += c.g.length * 2; } }
  function geo(list) { const P = [], N = []; for (const [sx, sy, sz, x, y, z] of list) { const g = new T3.BoxGeometry(sx, sy, sz).translate(x, y, z).toNonIndexed(); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); g.dispose(); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); GEOS.push(g); return g; }
  function meshes() { if (M || !CS.length) return; MAT = new T3.MeshLambertMaterial({ color: 0xffffff });
    const n = CS.reduce((s, c) => s + c.g.length * 2, 0);
    M = new T3.InstancedMesh(geo([[0.06, 1.75, 0.06, 0, 0.8, 0], [0.62, 0.48, 0.03, 0.34, 1.36, 0]]), MAT, n);   /* 막대 + 안쪽으로 뻗은 깃발 판(깃발 판 아래·위 = 막대 중간 · 같은 평면 없음) */
    M.instanceMatrix.setUsage(T3.DynamicDrawUsage); M.frustumCulled = false; M.matrixAutoUpdate = false; M.userData.fx = 1; M.visible = false;
    for (let i = 0; i < n; i++) M.setColorAt(i, CW); map.add(M);
    RING = new T3.InstancedMesh(geo([[0.2, 0.16, 0.2, 0, 0, 0]]), new T3.MeshBasicMaterial({ color: 0xffd23a }), 2); RING.frustumCulled = false; RING.matrixAutoUpdate = false; RING.userData.fx = 1; RING.visible = false; map.add(RING);
    GMAT = new T3.MeshLambertMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.45, depthWrite: false });
    GH = new T3.Mesh(geo([[0.42, 0.55, 0.3, 0, 0.92, 0], [0.3, 0.3, 0.3, 0, 1.36, 0], [0.14, 0.6, 0.14, -0.1, 0.4, 0.04], [0.14, 0.6, 0.14, 0.1, 0.4, 0.04], [0.09, 0.03, 1.4, -0.13, 0.02, 0.1], [0.09, 0.03, 1.4, 0.13, 0.02, 0.1]]), GMAT); GH.visible = false; GH.userData.fx = 1; map.add(GH); }
  const gateCol = (c, i) => { const s = c.g[i].st; CLR.setHex(s < 0 ? MISS : i % 2 ? BLUE : RED); if (s > 0) CLR.lerp(CW, 0.5); return CLR; };
  function poleSet(c, i, show) { const S9 = A.ski(), G = c.g[i], th = Math.atan2(-S9.pz, S9.px), w9 = G.wob > 0 ? Math.sin(G.wob * 22) * 0.28 * G.wob : 0;
    for (let s = 0; s < 2; s++) { const k = c.i0 + i * 2 + s, o = G.o + (s ? 1 : -1) * c.w / 2, [x, z] = A.skiAt(G.a, o); O.position.set(x, A.ty(x, z) - 0.08, z); O.rotation.set(0, th + (s ? Math.PI : 0), w9 + (s ? 1 : -1) * WN.lat * 0.18);   /* 바람에 기운 막대(둘 다 바람 가는 쪽 · 둘째 막대는 반 바퀴 돌아 있어 부호 반대) */ O.scale.setScalar(show ? 1 : 0); O.updateMatrix(); M.setMatrixAt(k, O.matrix); M.setColorAt(k, gateCol(c, i)); } }
  function showSet(key, list) { if (key === SHOWK) return; SHOWK = key; for (const c of CS) for (let i = 0; i < c.g.length; i++) poleSet(c, i, list.includes(c)); M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true; }
  function ringAt(c, i) { if (!c || i >= c.g.length) { RING.visible = false; return; } const G = c.g[i]; for (let s = 0; s < 2; s++) { const [x, z] = A.skiAt(G.a, G.o + (s ? 1 : -1) * c.w / 2); O.position.set(x, A.ty(x, z) + 1.62, z); O.rotation.set(0, 0, 0); O.scale.setScalar(1); O.updateMatrix(); RING.setMatrixAt(s, O.matrix); } RING.instanceMatrix.needsUpdate = true; RING.visible = true; }
  // ── 매 프레임(마을 skiTick이 부름 · 보일 때만 · 새 객체 X) ──
  function tick(dt, near, win) { if (dead || !CS.length) return; const vis = near && win; if (!vis && !M) return; meshes(); M.visible = vis || !!R;
    if (!M.visible) { RING.visible = false; GH.visible = false; return; }
    if (R) showSet('r' + R.c.id, [R.c]); else { const main = open(CS[1]) ? CS[1] : CS[0], side = CS[2].b ? [main, CS[2]] : [main]; showSet('i' + main.id, side); }
    let dirty = false; for (const c of CS) for (let i = 0; i < c.g.length; i++) { const G = c.g[i]; if (G.wob > 0) { G.wob = Math.max(0, G.wob - dt * 0.9); poleSet(c, i, true); dirty = true; } }
    if (dirty) { M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true; } }
  // ── 한 판 ──
  function begin(ci) { const c = CS[ci]; if (!c) return null; for (const C of CS) for (const G of C.g) { G.st = 0; G.wob = 0; } SHOWK = '';
    const gh = (ST().ghost || {})[c.id]; windRead(); const D = today(); R = { c, ph: 'prep', cd: 1.9, t: 0, k: 0, pass: 0, miss: 0, samp: [], sT: 0, gh: gh && gh.length >= 4 ? gh : null, gAhead: null, said: false, cdS: 9, fin: 0, pl: false, tu: false, plT: 0, tuT: 0, day: D, wax: null, reT: 0 };
    meshes(); SHOWK = ''; ringAt(c, 0); A.goal(L(T2('🎿 ' + c.nm[0] + ' 기문 — 출발 준비', '🎿 ' + c.nm[1] + ' gates — getting ready'))); prep();
    return { a: 3, lat: c.o0 }; }
  // 출발 준비 창(JUDGE-2): 눈 · 기온 · 바람(본 것) → 왁스 고르기(보기 차례는 날마다 섞임) · 고르면 3·2·1
  function prep() { if (!R || R.ph !== 'prep') return; const D = R.day, c = R.c;
    const snowT = { hard: T2('밤새 얼어 단단하고 반들반들해요. 스키가 잘 미끄러지고, 멈추기는 어려워요.', 'It froze overnight — hard and shiny. Skis glide easily, but stopping is harder.'), mid: T2('알맞게 단단해요.', 'Nicely firm.'), soft: T2('햇볕에 녹아 무르고 물기가 있어요. 발이 푹 들어가요.', 'Softened by the sun — wet and slushy. Your boots sink in.') }[D.snow];
    const wl = Math.abs(WN.lat), windT = WN.k > 0.3 && wl > 0.15 ? T2('바람이 세게 슬로프를 가로질러 불어요. 깃발 막대가 기울어 있어요.', 'A strong wind blows across the slope. The flag poles are leaning.') : WN.k > 0.3 ? T2('바람이 세게 불지만 슬로프를 따라 불어요.', 'The wind is strong but blows along the slope.') : T2('바람이 약해요.', 'The wind is light.');
    const W2 = [['cold', T2('파란 왁스 — 영하 1도보다 추운 날, 단단한 눈', 'Blue wax — colder than −1°C, hard snow'), '#cfe3fb'], ['warm', T2('빨간 왁스 — 0도 가까운 날, 물기 있는 눈', 'Red wax — near 0°C, wet snow'), '#fbd6cf']].sort((a, b) => hashS(a[0] + A.GAME.S.day) - hashS(b[0] + A.GAME.S.day));
    const P9 = A.openP('<h3>' + esc(L(T2('🎿 출발 준비 — ' + c.nm[0], '🎿 Getting ready — ' + c.nm[1]))) + '</h3>'
      + '<div style="display:grid;grid-template-columns:auto 1fr;gap:4px 10px;margin:6px 0;font-size:15px;line-height:1.4"><b>' + esc(L(T2('눈', 'Snow'))) + '</b><span>' + esc(L(snowT)) + '</span><b>' + esc(L(T2('기온', 'Temp'))) + '</b><span>' + esc((D.tC < 0 ? (en() ? '−' : '영하 ') + (-D.tC) : (en() ? '' : '영상 ') + D.tC) + (en() ? '°C' : '도')) + '</span><b>' + esc(L(T2('바람', 'Wind'))) + '</b><span>' + esc(L(windT)) + '</span></div>'
      + '<div class="sm">' + esc(L(T2('스키 바닥에 바를 왁스를 골라요. 왁스 통에 맞는 기온이 적혀 있어요.', 'Pick the wax for the bottom of your skis. Each tin shows the temperature it suits.'))) + '</div>'
      + '<div style="display:grid;gap:8px;margin-top:8px">' + W2.map(w => '<button data-wax="' + w[0] + '" class="sub" style="text-align:left;min-height:48px;background:' + w[2] + ';color:#2b2420">' + esc(L(w[1])) + '</button>').join('') + '</div>', false, 'skiprep');
    P9.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button[data-wax]'); if (!b || !R || R.ph !== 'prep') return; R.wax = b.dataset.wax; R.ph = 'count'; A.closeP(); A.tone(R.wax === D.wax ? 880 : 523, 0, 0.12, 'triangle', 0.05); A.goal(L(T2('🎿 ' + c.nm[0] + ' 기문 — 준비…', '🎿 ' + c.nm[1] + ' gates — ready…'))); tbOn(c); }); }
  const goalRun = () => { const c = R.c, g9 = L(T2('🎿 기문 ' + R.k + '/' + c.g.length, '🎿 Gate ' + R.k + '/' + c.g.length)), h = A.touch() ? ''   /* 휴대폰 = 줄이 잘리지 않게 수만(단추에 글이 있음) */
    : L(T2(' · A/D 좌우', ' · A/D steer')) + (c.pl ? L(T2(' · S 꾹 = 눈쟁기', ' · hold S = plough')) : '') + (c.tu ? L(T2(' · W 꾹 = 웅크리기', ' · hold W = tuck')) : ''); A.goal(g9 + h); };
  // 물리(설계 §4.2): 옆 빠르기 = 4.2 × 8 ÷ (v + 4)(느릴수록 날카롭게) · 눈쟁기 = 초당 −4(최저 3) · 웅크리기 = 최고 13 · 가속 +1 · 돌기 × 0.6
  function step(dt, SK, inp) { if (!R) return 'end'; const c = R.c, S9 = A.ski(); const I = API.inp || inp;
    if (R.ph === 'prep') { SK.sl = 0; if ((R.reT += dt) > 0.4) { R.reT = 0; prep(); } return ''; }   /* 준비 창을 Esc로 닫으면 다시 엶(고를 때까지 출발 X) */
    if (R.ph === 'count') { R.cd -= dt; const n9 = Math.ceil(R.cd / 0.63); if (n9 !== R.cdS && n9 > 0) { R.cdS = n9; A.tone(523, 0, 0.12, 'triangle', 0.05); A.goal('🎿 ' + n9 + '…'); } if (R.cd <= 0) { R.ph = 'go'; A.tone(1047, 0, 0.22, 'triangle', 0.06); goalRun(); } SK.sl = 0; return ''; }
    if (R.ph === 'go') { R.t += dt; const turn = Math.max(-1, Math.min(1, I.turn || 0)), pl = !!(c.pl && (I.pl || TBS.pl)), tu = !!(c.tu && (I.tu || TBS.tu)) && !pl; R.pl = pl; R.tu = tu; if (pl) R.plT += dt; if (tu) R.tuT += dt;
      const sn = R.day.snow, wxOk = R.wax === R.day.wax, brk = sn === 'hard' ? 2.5 : sn === 'soft' ? 5.5 : 4, acc = (wxOk ? 1 : 0.75) * (sn === 'soft' ? 0.9 : 1), topK = (wxOk ? 0 : -1.5) + WN.al;   /* JUDGE-2 왁스·눈 결·바람 */
      if (pl) SK.v = SK.v > 3 ? Math.max(3, SK.v - brk * dt) : Math.min(3, SK.v + 2 * dt);
      else { const top = (tu ? 13 : 10) + topK; SK.v += (3.2 - Math.abs(turn) * 1.2 + (tu ? 1 : 0)) * acc * dt; if (SK.v > top) SK.v = Math.max(top, SK.v - 3 * dt); }
      const vl = 4.2 * 8 / (SK.v + 4) * (tu ? 0.6 : 1) * (sn === 'hard' ? 0.85 : 1), lat0 = SK.lat, a0 = SK.a; SK.sl = turn * vl + WN.lat; SK.lat = Math.max(c.o0 - c.hw, Math.min(c.o0 + c.hw, SK.lat + (turn * vl + WN.lat) * dt)); SK.a += SK.v * dt;
      while (R.k < c.g.length && SK.a >= c.g[R.k].a) { const G = c.g[R.k], f = (G.a - a0) / Math.max(1e-4, SK.a - a0), la = lat0 + (SK.lat - lat0) * f, ok = Math.abs(la - G.o) <= c.w / 2;
        if (ok) { G.st = 1; G.wob = 1; R.pass++; A.tone(NOTE[Math.min(NOTE.length - 1, R.pass - 1)], 0, 0.16, 'triangle', 0.06); }
        else { G.st = -1; R.miss++; A.tone(262, 0, 0.18, 'sine', 0.04, 196); A.say(L(T2('🚩 깃발 하나를 놓쳤어요 — 다음 깃발로!', '🚩 Missed a gate — on to the next one!')), 1.6); }
        poleSet(c, R.k, true); M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true; R.k++; ringAt(c, R.k); goalRun(); }
      R.sT += dt; if (R.sT >= 0.1 || !R.samp.length) { R.sT = R.samp.length ? R.sT - 0.1 : 0; if (R.samp.length < 800) R.samp.push(Math.round(SK.a * 10), Math.round(SK.lat * 10)); }
      if (R.gh) { const j = Math.min(R.gh.length / 2 - 1, Math.floor(R.t * 10)), j2 = Math.min(R.gh.length / 2 - 1, j + 1), f = R.t * 10 - j, ga = (R.gh[j * 2] + (R.gh[j2 * 2] - R.gh[j * 2]) * f) / 10, gl = (R.gh[j * 2 + 1] + (R.gh[j2 * 2 + 1] - R.gh[j * 2 + 1]) * f) / 10, [x, z] = A.skiAt(ga, gl);
        GH.position.set(x, A.ty(x, z) + 0.05, z); GH.rotation.set(0.12, S9.ryS, 0); GH.updateMatrixWorld(true); GH.visible = true;
        const ahead = SK.a > ga + 0.3; if (R.gAhead === false && ahead && !R.said && R.t > 1.2) { R.said = true; A.say(L(T2('👀 그림자(내 최고 길)를 앞질렀어요!', '👀 You passed your shadow (your best run)!')), 1.8); } if (!ahead && SK.a < ga - 0.3) R.gAhead = false; else if (R.gAhead == null) R.gAhead = ahead; }
      if (SK.a >= S9.Ls - 4) { R.fin = R.t; R.ph = 'stop'; R.k = c.g.length; RING.visible = false; A.tone(1319, 0, 0.3, 'triangle', 0.06); } return ''; }
    const left = Math.max(0.4, S9.Ls - 0.4 - SK.a), dec = Math.max(4, SK.v * SK.v / (2 * left)); SK.v = Math.max(0, SK.v - dec * dt); SK.a += SK.v * dt; SK.sl = (SK.lat >= c.o0 ? -1 : 1) * (2 + SK.v * 1.6);   /* 결승선 뒤 = 옆으로 틀어 멈춤(눈 위에서 · 슬로프 끝 안) */
    if (R.gh && GH.visible) { const j = R.gh.length / 2 - 1, [x, z] = A.skiAt(R.gh[j * 2] / 10, R.gh[j * 2 + 1] / 10); GH.position.set(x, A.ty(x, z) + 0.05, z); GH.updateMatrixWorld(true); }
    return SK.v < 0.4 || SK.a >= S9.Ls - 0.2 ? 'end' : ''; }
  const pose = () => (R ? { pl: R.pl, tu: R.tu } : { pl: false, tu: false });
  // ── 터치 단추(꾹 · 오른쪽 아래 점프·행동 단추 위 줄 · 세로 화면은 웅크리기(⬇) 단추 위 · 키 글자 X) ──
  let CRV = null; function tbOn(c) { tbOff(); if (!A.touch() || !(c.pl || c.tu)) return; TB = []; const cr = document.getElementById('tCrouch'); if (cr) { CRV = [cr, cr.style.visibility]; cr.style.visibility = 'hidden'; }   /* 판 동안 몸 ⬇ 웅크리기 단추는 숨김(같은 이름 단추 둘 X) */
    const bot9 = innerHeight > innerWidth ? 158 : 112, mk = (k, txt, right, bg) => { const b = document.createElement('button'); b.className = 'twn-ski-b'; b.dataset.k = k; b.textContent = txt;
      b.style.cssText = 'position:fixed;right:calc(' + right + 'px + env(safe-area-inset-right));bottom:calc(' + bot9 + 'px + env(safe-area-inset-bottom));width:74px;height:74px;border-radius:50%;border:3px solid #2b2622;background:' + bg + ';color:#14240c;font-family:inherit;font-weight:900;font-size:15px;line-height:1.1;z-index:60;box-shadow:0 4px 0 #2b2622;touch-action:none;padding:0';
      const dn = e => { e.preventDefault(); e.stopPropagation(); TBS[k] = true; b.style.transform = 'scale(.92)'; }, up = e => { if (e) e.stopPropagation(); TBS[k] = false; b.style.transform = ''; };
      b.addEventListener('pointerdown', dn); for (const t of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(t, up); document.body.appendChild(b); TB.push(b); };
    if (c.pl) mk('pl', L(T2('눈쟁기', 'Plough')), 14, '#9fd0f0'); if (c.tu) mk('tu', L(T2('웅크리기', 'Tuck')), 96, '#ffd23a'); }
  function tbOff() { if (TB) for (const b of TB) b.remove(); TB = null; TBS.pl = TBS.tu = false; if (CRV) { CRV[0].style.visibility = CRV[1]; CRV = null; } }
  // ── 끝 ──
  function stopRun() { tbOff(); if (RING) RING.visible = false; if (GH) GH.visible = false; SHOWK = ''; }
  function abort() { if (!R) return; const pr = R.ph === 'prep'; R = null; stopRun(); if (pr) A.closeP(); }
  function done() { if (!R) return; const r = R, c = r.c, N = c.g.length, all = r.pass === N && r.fin > 0, t = Math.round(r.fin * 10) / 10, S = ST(), P = S[c.id] || (S[c.id] = { best: null, last: null, n: 0 }), prev = P.best, wasOpen = CS.map(open);
    R = null; stopRun(); P.n = (P.n || 0) + 1; let isBest = false;
    if (all) { P.last = t; if (prev == null || t < prev - 0.05) { isBest = true; P.best = t; (S.ghost || (S.ghost = {}))[c.id] = r.samp.slice(); } }
    A.GAME.mark(); A.rec('ski', { c: c.id, t: all ? t : null, g: r.pass, n: N, wax: r.wax, snow: r.day.snow });
    const nowOpen = CS.map(open), neu = CS.find((C, i) => nowOpen[i] && !wasOpen[i]);
    const fact = FACT[P.n % 2 ? CS.indexOf(c) : 3 + ((P.n >> 1) % 2)];   /* 코스마다 그 동작 사실 · 짝수 판엔 왁스·산지 관광 */
    const d = prev != null && all ? Math.round((prev - t) * 10) / 10 : null;
    const head = all ? L(T2('🎿 ' + c.nm[0] + ' 기문 — 완주!', '🎿 ' + c.nm[1] + ' gates — finished!')) : L(T2('🎿 ' + c.nm[0] + ' 기문 — 연습 판', '🎿 ' + c.nm[1] + ' gates — practice run'));
    const big = L(T2('기문 ' + r.pass + '/' + N, 'Gates ' + r.pass + '/' + N));
    const line = !all ? L(T2('기문 ' + (N - r.pass) + '개를 놓쳤어요. 다 지나야 내 기록에 올라요.', 'You missed ' + (N - r.pass) + '. Pass them all to set a record.'))
      : prev == null ? L(T2('처음 완주했어요! 다음 판부터 그림자(이번 내 길)가 같이 내려가요.', 'First finish! From next time your shadow (this run) skis with you.'))
      : isBest ? L(T2('내 최고보다 ' + d.toFixed(1) + '초 빨라요. 새 내 기록!', d.toFixed(1) + 's faster than your best. New record!'))
      : L(T2('내 최고보다 ' + (-d).toFixed(1) + '초 늦었어요. 그림자를 따라가 봐요.', (-d).toFixed(1) + 's slower than your best. Try following your shadow.'));
    const up = neu ? L(T2('🔓 ' + neu.nm[0] + ' 코스가 열렸어요', '🔓 ' + neu.nm[1] + ' course is open')) + ' — ' + (neu.tu ? L(T2('W 꾹 = 웅크리기(빠르게) · 둘째 슬로프 꼭대기에서 출발', 'hold W = tuck · starts at the top of the second slope')) : L(T2('S 꾹 = 눈쟁기(느리게)', 'hold S = plough (slow down)'))) : '';
    const nx = all && neu && neu.b === c.b ? CS.indexOf(neu) : -1, wOk = r.wax === r.day.wax;
    const waxL = wOk ? L(T2('왁스가 오늘 눈과 잘 맞았어요.', 'Your wax suited today’s snow.')) + (r.day.snow === 'hard' && c.pl ? ' ' + L(T2('단단한 눈에서는 눈쟁기가 덜 먹혀요 — 깃발 앞에서 일찍 시작해요.', 'On hard snow the plough grips less — start it early before a gate.')) : '') : L(T2('왁스가 오늘 눈과 맞지 않아 덜 미끄러졌어요. 다음엔 기온을 보고 골라요.', 'The wax didn’t suit today’s snow, so you glided less. Next time, check the temperature.'));
    const P9 = A.openP('<h3>' + esc(head) + '</h3><div style="font-size:30px;font-weight:900;margin:6px 0">' + esc(big) + '</div><div>' + esc(line) + '</div>' + (up ? '<div style="margin-top:6px;font-weight:700">' + esc(up) + '</div>' : '') + '<div style="margin-top:6px">' + esc(waxL) + '</div>'
      + '<div class="sm" style="margin-top:8px">💡 ' + esc(L(fact)) + '</div><div class="row" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center">'
      + (nx >= 0 ? '<button data-a="go" data-c="' + nx + '">' + esc(L(T2('바로 ' + neu.nm[0] + ' 타기', 'Try ' + neu.nm[1] + ' now'))) + '</button>' : '')
      + '<button data-a="again" data-c="' + CS.indexOf(c) + '">' + esc(L(T2('🚡 리프트 타고 또 하기', '🚡 Lift up and go again'))) + '</button><button data-a="x" class="sub">' + esc(L(T2('그만', 'Done'))) + '</button></div>', false, 'skirun');
    P9.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button[data-a]'); if (!b) return; const a = b.dataset.a; A.closeP(); if (a === 'again') A.lift(); else if (a === 'go') A.start(+b.dataset.c); });
    if (all) { A.stamp(); if (prev == null) A.skUp('explore', 3, 'xp:chal'); else if (isBest) A.skUp('explore', 1, 'xp:chal'); }   /* 솜씨만 · 창을 연 뒤(레벨업 창은 마을 쪽이 미룸) · 처음 완주 = 코스마다 한 번 · 최고 기록 = 깰 때만 */
    return { all, t, isBest, pass: r.pass }; }
  // ── 출발 창(E) — slope 0 = 본 슬로프(초급·중급) · 1 = 둘째 슬로프(상급) ──
  function menu(sl) { if (!CS.length) return false; const first = !ST().how, list = CS.filter(c => c.b === (sl ? 1 : 0)), other = CS.filter(c => c.b !== (sl ? 1 : 0)), tch = A.touch();
    const how = [T2('빨강·파랑 깃발 두 개 사이로 지나가요.', 'Go between the red and blue flag poles.'), tch ? T2('왼쪽 손잡이를 좌우로 밀면 몸을 옮겨 돌아요.', 'Push the stick left or right to shift your weight and turn.') : T2('A/D(←→)로 몸을 옮겨 돌아요. 느릴수록 날카롭게 돌아요.', 'A/D (←→) shifts your weight to turn. Slower = sharper turns.'),
      tch ? T2('중급에서는 눈쟁기(느리게) 단추, 상급에서는 웅크리기(빠르게) 단추가 생겨요.', 'From Medium you get a Plough button (slow), and Tuck (fast) on Hard.') : T2('중급에서는 S를 꾹 누르면 눈쟁기(느리게), 상급에서는 W를 꾹 누르면 웅크리기(빠르게)예요.', 'From Medium: hold S = plough (slow) · Hard: hold W = tuck (fast)')];
    const btn = c => { const i = CS.indexOf(c), P = rec(c.id), ok = open(c), need = c.need && CS.find(C => C.id === c.need);
      return '<button data-c="' + i + '"' + (ok ? '' : ' class="sub" data-lock="1"') + ' style="display:block;width:100%;margin:6px 0;text-align:left">' + (ok ? '🎿 ' : '🔒 ') + esc(L(c.nm)) + ' · ' + esc(L(T2('기문 ' + c.g.length + '개', c.g.length + ' gates')))
        + (ok ? (P && P.best != null ? ' · ' + esc(L(T2('완주함', 'finished'))) : '') : ' — ' + esc(L(T2(need.nm[0] + '을 완주하면 열려요', 'finish ' + need.nm[1] + ' to open')))) + '</button>'; };
    const P9 = A.openP('<h3>' + esc(L(T2('🎿 스키 기문 코스', '🎿 Ski gate course'))) + '</h3>' + (first ? '<ol style="margin:4px 0 8px 18px;padding:0">' + how.map(h => '<li>' + esc(L(h)) + '</li>').join('') + '</ol>' : '<div class="sm">' + esc(L(how[0])) + '</div>')
      + list.map(btn).join('') + (other.length ? '<div class="sm" style="margin-top:6px">' + esc(sl ? L(T2('초급·중급은 옆 넓은 슬로프 꼭대기에서 타요.', 'Easy and Medium start at the top of the wide slope next door.')) : L(T2('상급은 옆 둘째 슬로프 꼭대기에서 타요.', 'Hard starts at the top of the second slope next door.'))) + '</div>' : '')
      + '<div class="row" style="margin-top:10px;display:flex;gap:8px;justify-content:center">' + (sl ? '' : '<button data-a="free" class="sub">' + esc(L(T2('⛷ 그냥 내려가기', '⛷ Just ski down'))) + '</button>') + '<button data-a="x" class="sub">' + esc(L(T2('닫기', 'Close'))) + '</button></div>', false, 'skirun');
    if (first) { ST().how = 1; A.GAME.mark(); }
    P9.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button'); if (!b) return; if (b.dataset.lock) { A.say(L(T2('🔒 앞 코스를 완주하면 열려요', '🔒 Finish the course before this one first')), 2); return; }
      if (b.dataset.c != null) { A.closeP(); A.start(+b.dataset.c); } else if (b.dataset.a === 'free') { A.closeP(); A.start(null); } else if (b.dataset.a === 'x') A.closeP(); });
    return true; }
  // ── 수첩 🎿 스키 기록(초 숫자는 여기에만 · 나만) ──
  function has() { const S = (A.GAME.S.xp || {}).ski; return !!(S && CO.some(c => S[c.id] && S[c.id].n)); }
  function openRec() { const S = ST(), row = c => { const P = S[c.id]; return '<tr><td>' + esc(L(c.nm)) + '</td><td>' + (P && P.best != null ? P.best.toFixed(1) + L(T2('초', 's')) : '—') + '</td><td>' + (P && P.last != null ? P.last.toFixed(1) + L(T2('초', 's')) : '—') + '</td><td>' + (P ? P.n || 0 : 0) + '</td></tr>'; };
    A.openP('<h3>' + esc(L(T2('🎿 스키 기록', '🎿 Ski records'))) + '</h3><div class="sm">' + esc(L(T2('이 기기에서 나만 보는 기록이에요. 다 지난 판만 올라요.', 'Only you see these, on this device. Only full runs count.'))) + '</div>'
      + '<table style="width:100%;margin-top:8px;border-collapse:collapse;text-align:center"><tr><th>' + esc(L(T2('코스', 'Course'))) + '</th><th>' + esc(L(T2('내 최고 기록', 'My best'))) + '</th><th>' + esc(L(T2('지난 기록', 'Last'))) + '</th><th>' + esc(L(T2('탄 수', 'Runs'))) + '</th></tr>' + CO.map(row).join('') + '</table>'
      + '<div class="sm" style="margin-top:8px">' + esc(L(T2('최고 기록을 낸 판은 다음에 그림자로 같이 내려가요.', 'Your best run skis with you next time as a shadow.'))) + '</div>', false, 'ski'); }
  function dispose() { dead = true; tbOff(); for (const m of [M, RING, GH]) if (m) { if (m.parent) m.parent.remove(m); } for (const g of GEOS) g.dispose(); GEOS = []; for (const m of [MAT, GMAT, RING && RING.material]) if (m) m.dispose(); M = RING = GH = null; R = null; }
  const API = { build, tick, begin, step, done, abort, menu, has, openRec, dispose, pose, inp: null, running: () => !!R,
    dbg: { courses: () => CS.map(c => ({ id: c.id, b: c.b, o0: c.o0, hw: c.hw, w: c.w, pl: c.pl, tu: c.tu, open: open(c), g: c.g.map(G => ({ a: +G.a.toFixed(2), o: +G.o.toFixed(2), st: G.st })) })),
      prep: () => (R ? { ph: R.ph, ok: R.day.wax, snow: R.day.snow, tC: R.day.tC, wax: R.wax, wind: { ...WN } } : null), wind: () => ({ ...WN }), today: () => today(), windSet: (lat, al, k) => { WN.lat = lat; WN.al = al || 0; WN.k = k == null ? 0.6 : k; SHOWK = ''; },
      run: () => (R ? { c: R.c.id, ph: R.ph, t: +R.t.toFixed(2), k: R.k, pass: R.pass, miss: R.miss, ghost: !!R.gh, ghV: !!(GH && GH.visible), pl: R.pl, tu: R.tu, plT: +R.plT.toFixed(2), tuT: +R.tuT.toFixed(2) } : null),
      vis: () => ({ gates: !!(M && M.visible), ring: !!(RING && RING.visible), ghost: !!(GH && GH.visible), shown: SHOWK, tb: TB ? TB.map(b => b.dataset.k) : [] }), st: () => JSON.parse(JSON.stringify(ST())), tbs: TBS, go: ci => A.start(ci) } };
  return API;
}
