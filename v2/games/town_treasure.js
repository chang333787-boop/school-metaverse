// 🗺 보물 지도(TREASURE-1 · docs/systems/town_treasure.md · 사용자 10-18 '슴슴 1·2·3·5 좋은 듯' + 'ㄱ' · town_minis.md 상위 1위)
//   낡은 지도 조각(창 안 그림) = 기호·방위표·축척 막대·등고선만(빨간 선 X) → 아이가 큰 지도·나침반 띠·축척으로 직접 찾아감 → 상자 자리 30m 안 = 흙더미 → 8m 안 E 꾹 = 파기 → 상자(엔진 map.prop)
//   단계 셋: ★ 기호와 범례(4-1-04) · ★★ 방위 + 축척 거리(4-1-03·07) · ★★★ 등고선(4-1-05) · 받는 곳 = 본부 의뢰 게시판 옆 · 하루 하나 · 보상 = 상자마다 정해진 옛 물건(도감 '🗺 보물 상자' 칸) + 단계 칭호(뽑기 X)
//   상자 자리 = ⑤ 숨은 놀람 1차 자리(TSURP id 그대로 — 놀람 틀이 이어 씀) 곁의 흙·풀 땅 · 아이 판에 그 장소가 있을 때만(지어내지 않음)
//   렉: 매 프레임 일 = 파는 동안만(비교 몇 줄) · 나머지는 0.25초 칸 · 그리기 +1(흙더미 한 메시 · 30m 안에서만) · 새 Light X · 조각 그림 = 받을 때 캔버스 한 번
export const TMAP_V = 1;
const LVMAX = 3;   /* 지은 단계까지만 내줌(차례: ★ → ★★ → ★★★) */
const T2 = (ko, en) => [ko, en];
const DIRN = [T2('북', 'north'), T2('북동', 'north-east'), T2('동', 'east'), T2('남동', 'south-east'), T2('남', 'south'), T2('남서', 'south-west'), T2('서', 'west'), T2('북서', 'north-west')];
// 단계(link = 교과서 차시 id · learn = 배움 별 id(town_quiz.js) · words = 새 낱말 둘 · title = 그 단계를 처음 해내면 칭호 · need = 칭호까지 찾을 수)
export const TLV = [null,
  { star: '★', link: ['4-1-04'], learn: ['map:symbol', 'map:legend'], need: 2, dig: 3, see: 32, title: T2('🗺 기호 탐정', '🗺 Symbol detective'),
    words: [[T2('기호', 'symbol'), T2('지도에서 장소를 나타내는 약속된 그림', 'a picture that stands for a place on a map')], [T2('범례', 'legend'), T2('지도의 기호 뜻을 모아 적어 둔 곳', 'the box that lists what the symbols mean')]] },
  { star: '★★', link: ['4-1-03', '4-1-07'], learn: ['map:dir8', 'map:scale'], need: 2, dig: 3, see: 40, title: T2('🧭 방위 탐험가', '🧭 Direction explorer'),
    words: [[T2('방위', 'direction'), T2('동서남북처럼 어느 쪽인지 나타내는 말', 'words like north, south, east and west')], [T2('축척', 'scale'), T2('실제 거리를 지도에 얼마나 줄였는지 나타낸 것', 'how much real distance is shrunk on the map')]] },
  { star: '★★★', link: ['4-1-05'], learn: ['map:contour'], need: 1, dig: 3, see: 40, title: T2('⛰ 등고선 탐험가', '⛰ Contour explorer'),
    words: [[T2('등고선', 'contour line'), T2('높이가 같은 곳을 이은 선', 'a line joining places of the same height')], [T2('비탈', 'slope'), T2('기울어진 땅', 'land that tilts up or down')]] },
];
// 상자 자리 = ⑤ 숨은 놀람 1차 자리(town_minis.md §5.1) — id는 놀람 틀이 그대로 이어 씀 · box = 상자 안 정해진 옛 물건 · fact = 사실 한 줄
export const TSURP = [
  { id: 'post', surp: T2('우체통', 'Mailbox'), box: '📯', t: T2('우편 나팔', 'Post horn'), fact: T2('옛 우편 마차는 나팔을 불어 편지가 온 것을 알렸어요.', 'Old mail coaches blew a horn to say the post had come.') },
  { id: 'fire', surp: T2('소방서', 'Fire station'), box: '🔔', t: T2('작은 종', 'Little bell'), fact: T2('종소리는 멀리 퍼져서 옛날에는 종을 쳐 마을에 일을 알렸어요.', 'A bell carries far, so long ago people rang bells to tell the village news.') },
  { id: 'pav', surp: T2('정자', 'Pavilion'), box: '🎐', t: T2('풍경', 'Wind bell'), fact: T2('풍경은 바람이 불면 맑은 소리를 내요.', 'A wind bell rings clearly when the wind blows.') },
  { id: 'bridge', surp: T2('다리', 'Bridge'), box: '🧭', t: T2('나침반', 'Compass'), fact: T2('나침반 바늘은 늘 북쪽과 남쪽을 가리켜요.', 'A compass needle always points north and south.') },
  { id: 'lake', surp: T2('호수 둑', 'Lake bank'), box: '🏺', t: T2('항아리', 'Clay jar'), fact: T2('옛 사람들은 항아리를 땅에 묻어 김치를 시원하게 두었어요.', 'People long ago buried jars in the ground to keep kimchi cool.') },
  { id: 'trail', surp: T2('등산로 입구', 'Trailhead'), box: '⏳', t: T2('모래시계', 'Hourglass'), fact: T2('모래시계는 모래가 다 떨어지는 시간으로 때를 재요.', 'An hourglass measures time by how long the sand takes to fall.') },
  { id: 'view', surp: T2('산 비탈', 'Hillside'), box: '🗺', t: T2('옛 지도', 'Old map'), fact: T2('김정호는 산줄기와 물줄기를 그려 대동여지도를 만들었어요.', 'Kim Jeong-ho drew mountain ridges and rivers to make the Daedongyeojido map.'), lv3: true },
];
const KOF = Object.fromEntries(TSURP.map(k => [k.id, k]));
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = s => { let a = hashS(s) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const bearing = (dx, dz) => (Math.atan2(dx, -dz) * 57.29578 + 360) % 360;   /* 0 = 북(−z) · 90 = 동(+x) */
const dir8 = b => Math.round(b / 45) % 8;
const r10 = d => Math.max(10, Math.round(d / 10) * 10);

// 흙더미 + 말뚝(한 메시 · 정점 색): 갓 판 흙 · 흙덩이 셋 · 끈 묶은 나무 말뚝
function moundGeo(T3) { const P = [], N = [], C = [], col = new T3.Color(), part = (g, m, hex) => { g.applyMatrix4(m); const q = g.index ? g.toNonIndexed() : g, p = q.attributes.position, n = q.attributes.normal; col.setHex(hex); for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)); C.push(col.r, col.g, col.b); } if (q !== g) q.dispose(); g.dispose(); };
  const M = new T3.Matrix4(), Q = new T3.Quaternion(), E = new T3.Euler(), V = new T3.Vector3(), S = new T3.Vector3(), mk = (x, y, z, rx, ry, rz, sx, sy, sz) => M.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(sx, sy, sz));
  part(new T3.DodecahedronGeometry(1, 0), mk(0, 0.02, 0, 0, 0.3, 0, 0.75, 0.24, 0.62), 0x7a5634);
  for (const [x, z, s] of [[0.78, 0.2, 0.13], [-0.62, 0.42, 0.1], [0.2, -0.66, 0.12]]) part(new T3.BoxGeometry(1, 1, 1), mk(x, s * 0.4, z, 0.3, x * 2, 0.2, s, s * 0.8, s), 0x6a4a2c);
  part(new T3.BoxGeometry(0.07, 0.95, 0.07), mk(0.38, 0.42, 0.3, 0.12, 0, -0.1, 1, 1, 1), 0x9a7448);
  part(new T3.BoxGeometry(0.1, 0.08, 0.1), mk(0.43, 0.78, 0.34, 0.12, 0.4, -0.1, 1, 1, 1), 0xc9b48a);
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.computeBoundingSphere(); return g; }

// 종이 지도 잉크(보물 지도 조각 · 길찾기 시험 지도가 함께 씀 · ORIENT-1): 종이 결 · 기호 동그라미 · ✕ · 방위표 · 축척 막대 · 범례 — F() = 글꼴 · en() = 영어인가
export function mapInk(F, en) {
  function paper(g, w, h, seed) { const R = rng('paper:' + seed), pts = []; for (let x = 0; x <= w; x += 16) pts.push([x, 2 + R() * 7]); for (let y = 16; y <= h; y += 16) pts.push([w - 2 - R() * 7, y]); for (let x = w - 16; x >= 0; x -= 16) pts.push([x, h - 2 - R() * 7]); for (let y = h - 16; y > 0; y -= 16) pts.push([2 + R() * 7, y]);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#efe0bc'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(122,86,40,.10)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(R() * w, R() * h, 18 + R() * 30, 10 + R() * 18, R() * 3, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(90,62,30,.22)'; g.lineWidth = 1; g.beginPath(); g.moveTo(w / 2 + (R() - 0.5) * 8, 0); g.lineTo(w / 2 + (R() - 0.5) * 8, h); g.moveTo(0, h / 2 + (R() - 0.5) * 8); g.lineTo(w, h / 2 + (R() - 0.5) * 8); g.stroke();
    g.globalCompositeOperation = 'destination-in'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = '#000'; g.fill(); g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#6b5434'; g.lineWidth = 2; g.stroke(); g.restore(); }
  function symAt(g, x, y, sym, big) { const r = big ? 14 : 11; g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#2b2420'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#2b2420'; g.font = '800 ' + (big ? 16 : 13) + 'px ' + F(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, x, y + 1); }
  function xMark(g, x, y) { g.strokeStyle = '#8f2d22'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 9, y - 9); g.lineTo(x + 9, y + 9); g.moveTo(x + 9, y - 9); g.lineTo(x - 9, y + 9); g.stroke(); }
  function compass(g, cx, cy) { g.save(); g.translate(cx, cy); g.strokeStyle = '#2b2420'; g.lineWidth = 1.5; g.fillStyle = '#2b2420'; g.beginPath(); g.moveTo(0, -20); g.lineTo(6, 0); g.lineTo(0, 20); g.lineTo(-6, 0); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(0, -20); g.lineTo(6, 0); g.lineTo(-6, 0); g.closePath(); g.fill();
    g.font = '900 13px ' + F(); g.textAlign = 'center'; g.textBaseline = 'middle'; const D = en() ? ['N', 'S', 'E', 'W'] : ['북', '남', '동', '서']; g.fillText(D[0], 0, -30); g.fillText(D[1], 0, 31); g.fillText(D[2], 16, 0); g.fillText(D[3], -16, 0); g.restore(); }
  function scaleBar(g, x, y, sc) { const m = 50, bw = m * sc; g.fillStyle = '#2b2420'; g.fillRect(x, y, bw / 2, 5); g.strokeStyle = '#2b2420'; g.lineWidth = 1.5; g.strokeRect(x, y, bw, 5); g.font = '700 12px ' + F(); g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText('0', x - 3, y - 2); g.textAlign = 'right'; g.fillText(m + ' m', x + bw + 4, y - 2); }
  function legend(g, x, y, rows) { const lh = 20, wd = 168; g.fillStyle = 'rgba(255,253,246,.92)'; g.fillRect(x, y, wd, 22 + rows.length * lh); g.strokeStyle = '#2b2420'; g.lineWidth = 1.5; g.strokeRect(x, y, wd, 22 + rows.length * lh); g.fillStyle = '#2b2420'; g.font = '900 13px ' + F(); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(en() ? 'Legend' : '범례', x + 8, y + 12);
    rows.forEach(([s, t, kind], i) => { const yy = y + 32 + i * lh; if (kind === 'x') xMark(g, x + 17, yy); else if (kind === 'line') { g.strokeStyle = s; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 8, yy); g.lineTo(x + 27, yy); g.stroke(); } else if (kind === 'fill') { g.fillStyle = s; g.fillRect(x + 8, yy - 6, 19, 12); } else if (kind === 'peak') { g.fillStyle = s; g.beginPath(); g.moveTo(x + 17, yy - 8); g.lineTo(x + 25, yy + 6); g.lineTo(x + 9, yy + 6); g.closePath(); g.fill(); } else symAt(g, x + 17, yy, s); g.fillStyle = '#2b2420'; g.font = '700 12px ' + F(); g.textAlign = 'left'; g.fillText(t, x + 34, yy); }); }
  return { paper, symAt, xMark, compass, scaleBar, legend }; }

// 마을 쪽이 넘기는 것(A): map · T3 · GAME · id · root() · enth · on() · inb() · lang() · busy() · ready() 큰 지도가 열렸나 · hub() 본부 · places() · props() · bridges() · waters() [{ sh, name }] · inShape · sdOf · bboxOf
//   ty(x, z) 땅 높이 · gy(x, z) 서는 높이 · ok(x, z) 흙·풀 빈 땅인가(학교·물·길·건물·마당·막힘·비탈 X) · route(a, b) · walkLen(a, b, rr, mg) · drawMap(ctx, o) · SFONT · openP · closeP · esc · guide(to, name) · guideOff() · skUp · rec · learn(ids) · big() 큰 지도 · dex() 도감 · cellOf
export function createTreasure(A) {
  const T3 = A.T3, en = () => A.lang() === 'en', L = t => (Array.isArray(t) ? t[en() ? 1 : 0] : String(t)), esc = t => A.esc(t);
  const S = () => { const g = A.GAME.S; let s = g.tmap; if (!s || typeof s !== 'object' || s.v !== TMAP_V) s = g.tmap = { v: TMAP_V, cur: null, got: {}, n: [0, 0, 0], last: 0, title: [] }; if (!Array.isArray(s.n)) s.n = [0, 0, 0]; if (!s.got || typeof s.got !== 'object') s.got = {}; if (!Array.isArray(s.title)) s.title = []; return s; };
  const day = () => A.GAME.S.day || 1, mark = () => A.GAME.mark();
  let shovelTold = false;   /* TOOL-1 */
  const DBG = []; let shT = 0, rwd = null, rwT = 0, rwN = { d: false, t: null }, SRC = null, HB = null, HD = null, MD = null, MG = null, MM = null, CHEST = null, chestT = 0, CARD = null, CV = null, CVK = '', q = 0, qs = 0, dig = null, dg = 0, tq = 0, CAND = null, cardTop = -1, cardSig = '', lastHint = '';

  // ── 받는 곳: 본부 의뢰 게시판 옆(문 반대쪽으로 3.2m) · 본부가 없는 마을 = 끔 ──
  function srcSpot() { const H = A.hub && A.hub(); if (!H || !H.spots) return null; const b = H.spots.find(s => s.k === 'board'), m = H.spots.find(s => s.k === 'map'); if (!b) return null; const bx = b.ex ?? b.x, bz = b.ez ?? b.z;
    let tx = m ? b.x - m.x : bx - H.door[0], tz = m ? b.z - m.z : bz - H.door[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;   /* 벽을 따라 지도 판 반대쪽으로 */
    for (const k of [3.0, 4.0, 2.2, 5.0]) { const x = bx + tx * k, z = bz + tz * k; if (!A.blocked(x, z)) return { x, z, name: H.name, door: H.door }; }
    return { x: bx + tx * 3, z: bz + tz * 3, name: H.name, door: H.door }; }
  // ── 상자 자리 후보: ⑤ 놀람 자리 곁 흙·풀 땅(장소 갈래마다 받는 곳에서 가장 가까운 하나) ──
  function soilNear(cx, cz, r0, r1, a0) { for (let r = r0; r <= r1; r += 1.5) for (let i = 0; i < 24; i++) { const a = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.2618, x = cx + Math.sin(a) * r, z = cz - Math.cos(a) * r; if (A.ok(x, z)) return [x, z]; } return null; }
  function landmarks() { const out = [], P9 = A.places(), add = (k, x, z, sym, nm, lm, a0) => out.push({ k, x, z, sym, nm, lm, a0 });
    for (const p of P9) { if (p.school || p.area) continue; const nm = p.name || '';
      if (p.kind === 'post' || (!p.prop && /우체국/.test(nm))) add('post', p.x, p.z, p.sym || '✉', p, [p.x, p.z], p.door ? bearing(p.x - p.door[0], p.z - p.door[1]) : 0);
      else if (p.kind === 'fire' || (!p.prop && /소방서/.test(nm))) add('fire', p.x, p.z, p.sym || '🚒', p, [p.x, p.z], p.door ? bearing(p.x - p.door[0], p.z - p.door[1]) : 0);
      else if (/노인정|경로당/.test(nm)) add('pav', p.x, p.z, p.sym || '◉', p, [p.x, p.z], p.door ? bearing(p.x - p.door[0], p.z - p.door[1]) : 0); }
    for (const P of A.props()) { if (P.k === 'pavilion') add('pav', P.x, P.z, '⛱', { name: P.label, sym: '⛱' }, [P.x, P.z], 0); else if (P.k === 'trailhead') add('trail', P.x, P.z, '⛰', { name: P.label, sym: '⛰' }, [P.x, P.z], 0); else if (P.k === 'mailbox') add('post', P.x, P.z, '📮', { name: P.label, sym: '📮' }, [P.x, P.z], 0); }
    for (const b of A.bridges()) { const lx = b.x1 - b.x0, lz = b.z1 - b.z0, along = lx > lz, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2; for (const s of [-1, 1]) { const ex = along ? (s < 0 ? b.x0 : b.x1) : cx, ez = along ? cz : (s < 0 ? b.z0 : b.z1); add('bridge', ex, ez, '▬', { name: b.kind || (en() ? 'Bridge' : '다리'), sym: '▬' }, [cx, cz], 0); } }
    for (const W of A.waters()) { if (!W.sh || W.sh.line) continue; const bb = A.bboxOf(W.sh), cx = (bb[0] + bb[2]) / 2, cz = (bb[1] + bb[3]) / 2, rr = Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) / 2; if (rr < 8) continue;
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; let ex = cx, ez = cz; for (let r = 2; r < rr + 30; r += 2) { const x = cx + Math.sin(a) * r, z = cz - Math.cos(a) * r; if (A.sdOf(W.sh, x, z) > 3) { ex = x; ez = z; break; } } add('lake', ex, ez, '〰', { name: W.name || (en() ? 'Lake' : '호수'), sym: '〰' }, [cx, cz], 0); } }
    return out; }
  // 걸어서 닿나: 본부에서 길이 이어지고(SM_TOWN.routeXY와 같은 route) · 길 끝에서 상자까지 몸 규칙 걷기
  function legOK(a, b) { for (const q of [a, b]) if (A.tun && A.tun(q[0], q[1], 1)) { DBG.push(['tun', Math.round(q[0]), Math.round(q[1])]); return false; } if (A.deck && A.deck(a[0], a[1]) && A.deck(b[0], b[1])) return true; const TP = A.trail && A.trail(); if (TP && [a, b].every(q => TP.some(t => Math.hypot(t[0] - q[0], t[1] - q[1]) < 2))) return true;   /* 등산로 토막 = 마을이 걸어 오르라고 낸 길(3막 전망대 길과 같음) */ if (A.leg && !A.leg(a, b)) { DBG.push(['leg', Math.round(a[0]), Math.round(a[1]), Math.round(b[0]), Math.round(b[1])]); if (DBG.length > 40) DBG.shift(); return false; } return true; }   /* 곧은 줄을 몸 규칙으로 걸을 수 있나(마을 legOK — 길 안내가 걸어서 닿는 길을 고를 때와 같은 검사) · 굴 X · 길·다리 위는 길이 맡음 */
  function reach(x, z) { if (!SRC) return false; const R = A.route([SRC.x, SRC.z], [x, z]); if (!R || !R.ok || !R.pts || R.pts.length < 2) return false; const lb = R.pts[R.pts.length - 2]; if (A.tun && A.tun(lb[0], lb[1], 2)) return false;   /* 길 끝이 굴 속 = 땅 위 상자에 못 닿음 */
    for (let i = R.pts.length - 1, acc = 0; i > 0 && acc < 120; i--) { const a = R.pts[i - 1], b = R.pts[i]; acc += Math.hypot(b[0] - a[0], b[1] - a[1]); if (!legOK(a, b)) return false; }   /* 끝 120m = 빨간 선(도움 셋째)도 그대로 걸어갈 수 있게 */ if (Math.hypot(lb[0] - x, lb[1] - z) < 2.5) return R.len; const w = A.walkLen(lb, [x, z], 2.2, 30); return w >= 0 ? R.len : false; }
  function cands() { if (CAND) return CAND; CAND = []; if (!SRC) return CAND; const LM = landmarks(), best = {};
    for (const m of LM) { const d = Math.hypot(m.x - SRC.x, m.z - SRC.z); (best[m.k] = best[m.k] || []).push([d, m]); }
    for (const k of Object.keys(best)) { best[k].sort((a, b) => a[0] - b[0]); for (const [, m] of best[k].slice(0, 6)) { const r0 = m.k === 'post' || m.k === 'fire' ? 9 : m.k === 'pav' ? 5 : 4, sp = soilNear(m.x, m.z, r0, r0 + 16, (m.a0 || 0) * 0.01745 + Math.PI * 0.6); if (!sp) continue; const len = reach(sp[0], sp[1]); if (len === false) continue;
      CAND.push({ id: k + ':' + Math.round(m.x) + ',' + Math.round(m.z), k, x: +sp[0].toFixed(1), z: +sp[1].toFixed(1), lm: m.lm.map(v => +v.toFixed(1)), sym: m.sym, nm: m.nm.name || '', walk: Math.round(len) }); break; } }
    const H = hill(); if (H) CAND.push(H); CAND.sort((a, b) => a.walk - b.walk); return CAND; }

  // ── ★★★ 산: 아이 판 '산'(hill) 둘레 꼭대기 · 그 비탈 가운데쯤 등고선 위 · 받는 곳 쪽 비탈 먼저 ──
  function hill() { const HP = A.places().filter(p => p.kind === 'hill'); for (const p of HP) { let px = p.x, pz = p.z, ph = -1e9;
      for (let j = -26; j <= 26; j++) for (let i = -26; i <= 26; i++) { const x = p.x + i * 6, z = p.z + j * 6, h = A.ty(x, z); if (h > ph) { ph = h; px = x; pz = z; } }
      let lo = 1e9; for (let j = -20; j <= 20; j++) for (let i = -20; i <= 20; i++) lo = Math.min(lo, A.ty(px + i * 6, pz + j * 6)); const rel = ph - lo; if (rel < 12) continue;
      const iv = rel >= 40 ? 10 : 5, base = Math.floor(lo / iv) * iv, b0 = SRC ? bearing(SRC.x - px, SRC.z - pz) : 180, mids = [Math.round(((ph + lo) / 2 - base) / iv), Math.round(((ph + lo) / 2 - base) / iv) - 1, Math.round(((ph + lo) / 2 - base) / iv) + 1];
      for (const far of [6, 0]) for (const mI of mids) { const Lh = base + mI * iv; if (Lh <= lo + iv * 0.6 || Lh >= ph - iv * 0.6) continue; const okH = (x, z) => A.ok(x, z) && !(far && A.road && A.road(x, z, far));
        for (let k = 0; k < 8; k++) { const d8 = (dir8(b0) + (k % 2 ? 1 : -1) * Math.ceil(k / 2) + 8) % 8, a = d8 * 0.7854; let sp = null;
          for (let r = 4; r < 260; r += 2) { const x = px + Math.sin(a) * r, z = pz - Math.cos(a) * r, h = A.ty(x, z); if (h <= Lh) { if (okH(x, z)) sp = [x, z]; else for (const o of [-3, 3, -6, 6]) { const x2 = x + Math.cos(a) * o, z2 = z + Math.sin(a) * o; if (okH(x2, z2) && Math.abs(A.ty(x2, z2) - Lh) < iv * 0.35) { sp = [x2, z2]; break; } } break; } }
          if (!sp) continue; const len = reach(sp[0], sp[1]); if (len === false) continue;
          return { id: 'view:' + Math.round(px) + ',' + Math.round(pz), k: 'view', x: +sp[0].toFixed(1), z: +sp[1].toFixed(1), lm: [+px.toFixed(1), +pz.toFixed(1)], sym: '▲', nm: p.name || '', walk: Math.round(len), hill: { px: +px.toFixed(1), pz: +pz.toFixed(1), ph: +ph.toFixed(1), lo: +lo.toFixed(1), base, iv, Lh, d8 } }; } } }
    return null; }

  // ── 하루 지도 짓기: 단계 = 찾은 수(★ 둘 → ★★ 둘 → ★★★) · 아직 안 찾은 자리 가운데 가까운 것 ──
  function lvNow() { const s = S(), C = cands(), has3 = LVMAX >= 3 && C.some(c => c.k === 'view' && !s.got[c.id]); let lv; if (s.n[0] < TLV[1].need) lv = 1; else if (s.n[1] < TLV[2].need) lv = 2; else if (has3 && s.n[2] < TLV[3].need) lv = 3; else lv = [1, 2, 3][(s.n[0] + s.n[1] + s.n[2]) % (has3 ? 3 : 2)]; return Math.min(LVMAX, lv); }
  function anchorFor(c) { let best = null, be = 1e9; for (const p of A.places()) { if (p.school || p.area || p.prop || p.nat || !p.door || ['house', 'apt'].includes(p.kind)) continue; if (Math.hypot(p.x - c.lm[0], p.z - c.lm[1]) < 25) continue;
      const ax = p.door[0], az = p.door[1], dx = c.x - ax, dz = c.z - az, d = Math.hypot(dx, dz); if (d < 60 || d > 230) continue; const b = bearing(dx, dz), k = dir8(b), er = Math.abs(((b - k * 45) % 360 + 540) % 360 - 180); if (er > 9) continue;
      const sc = er * 6 + Math.abs(d - 130) * 0.4 + (['shop', 'hospital'].includes(p.kind) ? 25 : 0); if (sc < be) { be = sc; best = { x: +ax.toFixed(1), z: +az.toFixed(1), sym: p.sym || p.icon || '◉', nm: p.name || '', d8: k, dist: r10(d), er: +er.toFixed(1) }; } }
    return best; }
  function plan() { const s = S(), C = cands().filter(c => !s.got[c.id]); if (!C.length) return lostPlan(); let lv = lvNow(), c = null, anc = null;
    if (lv === 3) c = C.find(q9 => q9.k === 'view') || null; if (!c && lv === 3) lv = 2;
    if (lv === 2) { for (const q9 of C) { if (q9.k === 'view') continue; const a = anchorFor(q9); if (a) { c = q9; anc = a; break; } } if (!c) lv = 1; }
    if (lv === 1) c = C.find(q9 => q9.k !== 'view') || null; if (!c) { c = LVMAX >= 3 ? C[0] : null; if (!c) return null; lv = c.k === 'view' ? 3 : 1; }
    return { id: c.id, k: c.k, lv, x: c.x, z: c.z, lm: c.lm, sym: c.sym, nm: c.nm, anc, hill: c.hill || null, day: day(), el: 0, h: 0, dp: 0, mz: 0 }; }

  // ── REGEN-1 상자 일곱 뒤 = 이웃이 잃어버린 물건 지도(하루 하나 · 자리·이웃·물건 = 날 씨앗 · 최근 갈래 되풀이 X · town_regen.js lostPick) ──
  function lostPlan() { const RG = A.rg && A.rg(); if (!RG) return null; const pk = RG.lostPick(cands()); if (!pk) return null; const R9 = pk.r;
    for (const c of pk.order) { let x = c.x, z = c.z, lv = 3, anc = null;
      if (c.k !== 'view') { const sp = soilNear(c.lm[0], c.lm[1], 6 + R9() * 8, 30, R9() * 6.2832); if (!sp || reach(sp[0], sp[1]) === false) continue; x = +sp[0].toFixed(1); z = +sp[1].toFixed(1); lv = 1; if (R9() < 0.6) { const a = anchorFor({ x, z, lm: c.lm }); if (a) { lv = 2; anc = a; } } }   /* ★★(방위·축척)이 되면 ★★ · 아니면 ★(기호) */
      return { id: 'lost:' + day() + ':' + c.k, k: c.k, lv, x, z, lm: c.lm, sym: c.sym, nm: c.nm, anc, hill: c.k === 'view' ? c.hill : null, day: day(), el: 0, h: 0, dp: 0, mz: 0, lost: { hk: pk.owner.hk, who: pk.owner.who, it: pk.it, why: pk.why } }; }
    return null; }
  const jo = (w, a, b) => { const k = String(w).charCodeAt(String(w).length - 1); return k >= 0xAC00 && k <= 0xD7A3 && (k - 0xAC00) % 28 ? a : b; };
  // ── 지시문 한 문장 ──
  function say(c, short) { const e = en();
    if (c.lv === 1) return short ? (e ? '✕ is beside a symbol — check the legend' : '✕ 곁 기호를 범례에서 찾아요') : (e ? 'Find what the symbol next to ✕ means in the legend, then go there.' : '범례에서 ✕ 곁 기호의 뜻을 찾아 그곳으로 가요.');
    if (c.lv === 2) { const a = c.anc, dn = L(DIRN[a.d8]); return e ? 'Go ' + a.dist + ' m ' + dn + ' from ' + a.sym + ' ' + a.nm + (short ? '' : ' and dig.') : a.sym + ' ' + a.nm + '에서 ' + dn + '쪽으로 ' + a.dist + 'm' + (short ? '' : ' 가서 파요.'); }
    const H = c.hill, dn = L(DIRN[H.d8]), lh = Math.round(H.Lh - H.base); return e ? 'Dig on the ' + lh + ' m contour, on the ' + dn + ' slope from the top' + (short ? '' : '.') : '꼭대기 ' + dn + '쪽 비탈의 ' + lh + 'm 등고선 위' + (short ? '' : '를 파요.'); }

  // ── 종이 지도 조각 그리기(받을 때 한 번 · 캐시) ──
  const { paper, symAt, xMark, compass, scaleBar, legend } = mapInk(() => A.SFONT, en);   /* ORIENT-1: 잉크는 모듈 위(mapInk)로 옮김 — 길찾기 시험 지도도 같은 결 */
  function contours(g, H, x0, z0, sc, w, h) { const st = 4, nx = Math.ceil(w / sc / st) + 1, nz = Math.ceil(h / sc / st) + 1, G = new Float32Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) G[j * nx + i] = A.ty(x0 + i * st, z0 + j * st);
    const lv = []; for (let v = H.base + H.iv; v < H.ph; v += H.iv) lv.push(v); g.save(); g.lineCap = 'round';
    for (const v of lv) { g.strokeStyle = v === H.Lh ? '#6b3f1e' : '#9a6a3a'; g.lineWidth = v === H.Lh ? 2.4 : 1.4; g.beginPath();
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = G[j * nx + i], b = G[j * nx + i + 1], c = G[(j + 1) * nx + i + 1], d = G[(j + 1) * nx + i], E9 = []; const px = (i * st) * sc, pz = (j * st) * sc, s9 = st * sc;
        if ((a < v) !== (b < v)) E9.push([px + s9 * (v - a) / (b - a), pz]); if ((b < v) !== (c < v)) E9.push([px + s9, pz + s9 * (v - b) / (c - b)]); if ((d < v) !== (c < v)) E9.push([px + s9 * (v - d) / (c - d), pz + s9]); if ((a < v) !== (d < v)) E9.push([px, pz + s9 * (v - a) / (d - a)]);
        if (E9.length >= 2) { g.moveTo(E9[0][0], E9[0][1]); g.lineTo(E9[1][0], E9[1][1]); } if (E9.length === 4) { g.moveTo(E9[2][0], E9[2][1]); g.lineTo(E9[3][0], E9[3][1]); } } g.stroke(); }
    const a = H.d8 * 0.7854; g.font = '800 11px ' + A.SFONT; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const v of lv) { for (let r = 2; r < 260; r += 2) { const x = H.px + Math.sin(a) * r, z = H.pz - Math.cos(a) * r; if (A.ty(x, z) <= v) { const qx = (x - x0) * sc + Math.cos(a) * 16, qz = (z - z0) * sc + Math.sin(a) * 16, t9 = Math.round(v - H.base) + 'm'; g.fillStyle = 'rgba(255,253,246,.9)'; g.fillRect(qx - 15, qz - 7, 30, 14); g.fillStyle = '#6b3f1e'; g.fillText(t9, qx, qz); break; } } }
    g.restore(); }
  function drawFrag(c, cv) { const w = cv.width, h = cv.height, g = cv.getContext('2d'); g.clearRect(0, 0, w, h); let cx, cz, wm;
    if (c.lv === 1) { cx = (c.x + c.lm[0]) / 2; cz = (c.z + c.lm[1]) / 2; wm = 290; } else if (c.lv === 2) { cx = c.anc.x; cz = c.anc.z; wm = 200; } else { cx = (c.hill.px + c.x) / 2; cz = (c.hill.pz + c.z) / 2; wm = Math.max(200, Math.abs(c.x - c.hill.px) + 90, (Math.abs(c.z - c.hill.pz) + 90) * w / h); }   /* 꼭대기와 ✕가 둘 다 들어오게(가로·세로 비 따라) */
    const sc = w / wm, x0 = cx - w / 2 / sc, z0 = cz - h / 2 / sc, P = (x, z) => [(x - x0) * sc, (z - z0) * sc];
    try { A.drawMap(g, { x0, z0, sc, w, h, symbols: false, doors: false }); } catch (e) { g.fillStyle = '#e9efe2'; g.fillRect(0, 0, w, h); }
    if (c.lv === 3) { g.fillStyle = 'rgba(244,234,208,.55)'; g.fillRect(0, 0, w, h); contours(g, c.hill, x0, z0, sc, w, h); }
    paper(g, w, h, c.id + ':' + c.lv);
    const rows = [];
    if (c.lv === 1) { const seen = new Set(), list = A.places().filter(p => !p.school && !p.area && !p.nat && !['house', 'apt'].includes(p.kind) && (p.sym || p.icon)).map(p => [Math.hypot(p.x - cx, p.z - cz), p]).filter(([d, p]) => { const [a, b] = P(p.x, p.z); return a > 18 && b > 18 && a < w - 18 && b < h - 18 && d < wm; }).sort((a, b) => a[0] - b[0]);
      let n = 0; for (const [, p] of list) { if (n >= 5) break; const s9 = p.sym || p.icon, [a, b] = P(p.x, p.z); symAt(g, a, b, s9); if (!seen.has(s9)) { seen.add(s9); rows.push([s9, (p.name || '').slice(0, 9)]); } n++; }
      if (c.k === 'bridge') rows.unshift(['#8a5a36', en() ? 'Bridge' : '다리', 'line']); else if (c.k === 'lake') rows.unshift(['#4fa8d8', en() ? 'Water' : '물(호수)', 'fill']); else if (!seen.has(c.sym)) { const [a, b] = P(c.lm[0], c.lm[1]); symAt(g, a, b, c.sym); rows.unshift([c.sym, (c.nm || L(KOF[c.k].surp)).slice(0, 9)]); }
      if (SRC) { const [a, b] = P(SRC.x, SRC.z); if (a > 0 && b > 0 && a < w && b < h) { g.fillStyle = '#2b2420'; g.font = '800 11px ' + A.SFONT; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(en() ? 'you got it here' : '받은 곳', a, b + 13); g.beginPath(); g.arc(a, b, 4, 0, 7); g.fill(); } }
      const [xa, xb] = P(c.x, c.z); xMark(g, xa, xb); rows.push(['', c.lost ? L(c.lost.it.t) : en() ? 'Treasure chest' : '보물 상자', 'x']); legend(g, w - 182, 14, rows.slice(0, 6)); compass(g, 38, 56); scaleBar(g, 22, h - 24, sc); }
    else if (c.lv === 2) { const [a, b] = P(c.anc.x, c.anc.z); symAt(g, a, b, c.anc.sym, true); g.fillStyle = '#2b2420'; g.font = '800 12px ' + A.SFONT; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(c.anc.nm.slice(0, 10), a, b + 17);
      compass(g, w - 46, 56); scaleBar(g, 22, h - 24, sc); }
    else { const H = c.hill, [a, b] = P(H.px, H.pz); g.fillStyle = '#6b3f1e'; g.beginPath(); g.moveTo(a, b - 9); g.lineTo(a + 8, b + 6); g.lineTo(a - 8, b + 6); g.closePath(); g.fill(); const [xa, xb] = P(c.x, c.z); xMark(g, xa, xb);
      const lyT = 14, lyB = h - 112, dT = Math.min(Math.hypot(a - (w - 98), b - 55), Math.hypot(xa - (w - 98), xb - 55)), dB = Math.min(Math.hypot(a - (w - 98), b - (lyB + 41)), Math.hypot(xa - (w - 98), xb - (lyB + 41))); legend(g, w - 182, dB > dT + 20 ? lyB : lyT, [['#9a6a3a', (en() ? 'Contour, every ' : '등고선(') + H.iv + (en() ? ' m' : 'm마다)'), 'line'], ['#6b3f1e', en() ? 'Hilltop' : '꼭대기', 'peak'], ['', c.lost ? L(c.lost.it.t) : en() ? 'Treasure chest' : '보물 상자', 'x']]); compass(g, 38, 56); scaleBar(g, 22, h - 24, sc); }
    g.fillStyle = '#5a4630'; g.font = '800 12px ' + A.SFONT; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(c.lost ? (en() ? 'Lost: ' : '잃은 것: ') + c.lost.it.e : (en() ? 'In the chest: ' : '상자 안: ') + KOF[c.k].box, w - 16, h - 12); }
  function frag(c) { const k = c.id + ':' + c.lv + ':' + A.lang(); if (CV && CVK === k) return CV; const cv = document.createElement('canvas'); cv.width = 460; cv.height = 300; try { drawFrag(c, cv); } catch (e) { console.warn('[보물] 조각 그리기', e); } CV = cv; CVK = k; return cv; }

  // ── 창: 지도 조각 크게 ──
  function openMap() { const c = S().cur; if (!c) return; const LV = TLV[c.lv], e = en();
    const lo = c.lost, loH = lo ? '<div class="st"><b class="n">' + lo.it.e + '</b><span><b>' + esc(L(lo.who)) + '</b><br>' + esc(e ? '“I lost my ' + L(lo.it.t) + '. ' + L(lo.why) + '. I drew where I went.”' : '“' + L(lo.it.t) + jo(L(lo.it.t), '을', '를') + ' 잃어버렸어요. ' + L(lo.why) + '. 다닌 곳을 지도에 그렸어요.”') + '</span></div>' : '';
    const P = A.openP('<h3>🗺 ' + (lo ? (e ? 'A neighbour’s map ' : '이웃이 그린 지도 ') : (e ? 'Old map piece ' : '낡은 지도 조각 ')) + LV.star + '</h3>' + loH + '<div style="font-weight:800;margin:2px 0 6px">' + esc(say(c)) + '</div><div class="tm-cv" style="text-align:center"></div>'
      + '<div class="sm" style="margin:4px 0">📘 ' + (e ? 'Words: ' : '낱말 상자: ') + LV.words.map((w, i) => '<button class="sub" data-w="' + i + '" style="min-height:30px;padding:2px 10px">' + esc(L(w[0])) + '</button>').join(' ') + ' <span class="tm-wd"></span></div>'
      + (c.lv === 2 ? '<div class="sm">' + (e ? 'Stand at the door of ' + c.anc.nm + ' and your steps are measured on the card.' : c.anc.nm + ' 문 앞에 서면 카드에서 걸음을 재 줘요.') + '</div>' : c.lv === 3 ? '<div class="sm">' + (e ? 'Near the hill, the card shows your height.' : '산 둘레에서는 카드에 지금 높이가 나와요.') + '</div>' : '')
      + (lastHint ? '<div class="sm">💡 ' + esc(lastHint) + '</div>' : '')
      + '<div class="row"><button class="sub" data-a="big">🗺 ' + (e ? 'Big map' : '큰 지도') + '</button><button data-a="x">' + (e ? 'Take it and go' : '가지고 가기') + '</button></div>', false, 'tmap');
    const cv = frag(c), box = P.querySelector('.tm-cv'), cp = document.createElement('canvas'); cp.width = cv.width; cp.height = cv.height; cp.getContext('2d').drawImage(cv, 0, 0); cp.style.cssText = 'width:min(460px,86vw);height:auto'; box.appendChild(cp);
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.w != null) { const w = LV.words[+b.dataset.w], sp = P.querySelector('.tm-wd'); if (sp) sp.textContent = L(w[0]) + ' = ' + L(w[1]); return; } if (b.dataset.a === 'big') { A.closeP(); if (A.big) A.big(); return; } if (b.dataset.a === 'x') A.closeP(); }; }

  // ── 받기(게시판 옆 E) ──
  function take() { const e = en(); if (!A.ready()) { A.map.hud.toast(e ? '🔒 Map pieces open once you have the big map (follow the story)' : '🔒 큰 지도가 생기면 지도 조각을 받을 수 있어요(이야기를 따라가요)', 3); return; }
    const s = S(), d = day(); if (s.cur) { openMap(); return; } if (s.last === d) { A.map.hud.toast(e ? '🗺 You found today’s treasure. A new piece goes up tomorrow.' : '🗺 오늘 보물은 찾았어요. 내일 새 조각이 붙어요.', 3); return; }
    const c = plan(); if (!c) { A.map.hud.toast(e ? '🗺 You have found every chest on these maps!' : '🗺 지도 조각의 상자를 모두 찾았어요!', 3); return; }
    s.cur = c; lastHint = ''; mark(); A.GAME.flush && A.GAME.flush(); A.map.sfx && A.map.sfx('tick'); openMap(); cardSig = ''; }

  // ── 쪽지 카드(왼쪽 할 일 줄 밑 · 누르면 다시 크게) ──
  function card() { const c = S().cur, on = !!c && A.on() && !A.inb(); if (!on) { if (CARD) CARD.style.display = 'none'; return; }
    if (!CARD) { CARD = document.createElement('div'); CARD.className = 'twn-tmap ttl-keep'; CARD.style.cssText = 'position:fixed;left:10px;top:180px;z-index:29;cursor:pointer;box-sizing:border-box;background:#fff8ea;color:#2b2420;border:3px solid #2b2420;border-radius:12px;box-shadow:0 3px 0 #2b2420;padding:6px 8px;font:800 13px/1.3 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif,SMEmoji;width:188px';
      CARD.innerHTML = '<canvas width="172" height="112" style="display:block;width:100%;height:auto"></canvas><div class="tm-t" style="margin-top:3px"></div><div class="tm-m" style="font-weight:900;color:#5a3a1a"></div><button class="tm-h" style="display:none;margin-top:4px;font:inherit;font-weight:800;border:2px solid #2b2420;border-radius:9px;background:#f4e6c8;color:#2b2420;padding:2px 8px;min-height:30px;cursor:pointer"></button>';
      CARD.addEventListener('click', ev => { ev.stopPropagation(); if (ev.target.closest('.tm-h')) { hint(); return; } openMap(); }); document.body.appendChild(CARD); }
    const sm = document.body.classList.contains('small') || innerHeight < 500 || innerWidth < 700; CARD.style.width = sm ? '150px' : '188px'; CARD.style.fontSize = sm ? '11px' : '13px'; CARD.firstChild.style.display = sm ? 'none' : 'block';   /* 휴대폰 = 그림 없이 글 두 줄(누르면 크게 · 이동 막대를 가리지 않게) */
    const k = c.id + ':' + c.lv + ':' + A.lang(); if (CARD.dataset.k !== k) { CARD.dataset.k = k; const cv = frag(c), g = CARD.firstChild.getContext('2d'); g.clearRect(0, 0, 172, 112); g.drawImage(cv, 0, 0, 172, 112); CARD.querySelector('.tm-t').textContent = TLV[c.lv].star + ' ' + say(c, true); }
    if (CARD.style.display === 'none') CARD.style.display = ''; let top = 92; for (const el of document.querySelectorAll('.twn-task,.twn-waitb,.twn-bag,.twn-day')) { const r = el.getBoundingClientRect(); if (r.width && r.left < 140 && r.top < 320 && r.bottom > top - 8) top = r.bottom + 8; } if (top !== cardTop) { cardTop = top; CARD.style.top = top + 'px'; } }
  function cardLine(c, me) { const e = en(); let m = '';
    if (c.lv === 2) { const a = c.anc; if (!c.mz && Math.hypot(me.x - a.x, me.z - a.z) < 7) { c.mz = 1; mark(); A.map.hud.toast(e ? '📏 Step counter on — walk and watch the card' : '📏 걸음 재기 시작! 걸으면서 카드를 봐요', 2.6); } if (c.mz) m = '📏 ' + (e ? Math.round(Math.hypot(me.x - a.x, me.z - a.z)) + ' m from ' + a.nm : a.nm + '에서 ' + Math.round(Math.hypot(me.x - a.x, me.z - a.z)) + 'm'); }
    else if (c.lv === 3) { const H = c.hill; if (Math.hypot(me.x - H.px, me.z - H.pz) < 300) m = '⛰ ' + (e ? 'Height now about ' : '지금 높이 약 ') + Math.max(0, Math.round(A.ty(me.x, me.z) - H.base)) + 'm'; }
    if (c.lost && Math.hypot(me.x - c.x, me.z - c.z) < 14) m = (m ? m + ' · ' : '') + '👀 ' + (e ? 'It should be in the grass around here' : '이 둘레 풀숲 어딘가예요');   /* REGEN-1 흙더미 대신 */
    const hn = hintReady(c), sig = m + '|' + hn + '|' + c.h; if (CARD && sig !== cardSig) { cardSig = sig; CARD.querySelector('.tm-m').textContent = m; const hb = CARD.querySelector('.tm-h'); hb.style.display = hn ? '' : 'none'; hb.textContent = '💡 ' + (e ? 'Help ' : '도움 ') + (c.h + 1) + '/3'; } }

  // ── 도움 셋(1·2·3분 · 쓴 수는 기록에만 · 벌 X) ──
  const hintReady = c => c.h < 3 && c.el >= 60 * (c.h + 1);
  function hint() { const c = S().cur; if (!c || !hintReady(c)) return; const e = en(), me = A.map.player.pos(); c.h++; mark(); let t = '';
    if (c.h === 1) t = c.lv === 1 ? (c.k === 'bridge' ? (e ? 'Find a bridge near ✕ on the big map (M) first.' : '큰 지도(M)에서 ✕ 곁 다리를 먼저 찾아요.') : c.k === 'lake' ? (e ? 'Find the blue water near ✕ on the big map (M) first.' : '큰 지도(M)에서 ✕ 곁 파란 물을 먼저 찾아요.') : (e ? 'Find the ' + c.sym + ' symbol on the big map (M) first.' : '큰 지도(M)에서 ' + c.sym + ' 기호를 먼저 찾아요.'))
      : c.lv === 2 ? (e ? 'Stand at the door of ' + c.anc.nm + ', then follow the compass strip at the top.' : c.anc.nm + ' 문 앞에 선 다음 화면 위 나침반 띠를 보고 걸어요.') : (e ? 'Walk up and down the slope and match the height on the card.' : '비탈을 오르내리며 카드의 높이를 등고선 숫자와 맞춰요.');
    else if (c.h === 2) { const dx = c.x - me.x, dz = c.z - me.z, d = Math.hypot(dx, dz); t = e ? 'The chest is ' + L(DIRN[dir8(bearing(dx, dz))]) + ' of you, about ' + r10(d) + ' m.' : '보물은 지금 자리에서 ' + L(DIRN[dir8(bearing(dx, dz))]) + '쪽, ' + r10(d) + 'm쯤이에요.'; }
    else { const r = A.guide([c.x, c.z], e ? 'Treasure' : '보물 상자'); t = r ? (e ? 'Follow the red line.' : '빨간 선을 따라가요.') : (e ? 'Look for the fresh dirt pile.' : '갓 판 흙더미를 찾아봐요.'); }
    lastHint = t; cardSig = ''; A.map.hud.toast('💡 ' + t, 4.5); }

  // ── 흙더미(30m 안에서만) · 파기 E ──
  function mound(c) { if (!MD) { MG = moundGeo(T3); MM = new T3.MeshLambertMaterial({ vertexColors: true, flatShading: true }); MD = new T3.Mesh(MG, MM); MD.matrixAutoUpdate = false; MD.userData.fx = 1; MD.visible = false; }
    if (!MD.parent) { const r = A.root(); if (r) r.add(MD); } const y = A.gy(c.x, c.z); MD.position.set(c.x, y, c.z); MD.rotation.set(0, (hashS(c.id) % 628) / 100, 0); MD.scale.set(1.25, 1.25, 1.25); MD.updateMatrix(); MD.userData.y = y; }
  function digLabel(c) { if (c.lost) return '🔍 ' + (en() ? 'Search the grass here' : '풀숲 살펴보기'); const tch = document.body.classList.contains('touch'), p = dig ? dig.p : c.dp || 0, e = en(); return '⛏️ ' + (p > 0 ? (e ? 'Digging… ' : '파는 중… ') + Math.round(p * 100) + '%' : (e ? 'Dig here' : '땅 파기')) + (tch ? (e ? ' (tap again and again)' : ' (여러 번 톡톡)') : (e ? ' (hold E)' : ' (E 꾹)')); }
  function digUse() { const c = S().cur; if (!c || A.busy()) return; if (A.bike && A.bike()) { A.map.hud.toast(en() ? '🚲 Get off the bike to dig (B)' : '🚲 자전거에서 내려서 파요 (B)', 2.4); return; } if (c.lost) { reveal(c); return; }   /* REGEN-1 잃은 물건 = 꾹 X · 찾아온 자리에서 한 번 */ if (!dig && !shovelTold) { shovelTold = true; A.map.hud.toast(document.body.classList.contains('touch') ? (en() ? '⛏ Tip: hold the shovel (☰ → 🧰 Tools) and use it here to dig in one go' : '⛏ 삽으로 파 봐요 — ☰ → 🧰 도구에서 삽을 들고 쓰면 한 번에 파져요') : (en() ? '⛏ Tip: press 2 for the shovel and click here to dig in one go' : '⛏ 삽으로 파 봐요 — 2를 눌러 삽을 들고 클릭하면 한 번에 파져요'), 3.4); }   /* TOOL-1 귀띔(E 꾹도 그대로 됨) */ if (!dig) { dig = { p: c.dp || 0, tap: 0, snd: 0 }; A.map.player.freeze(true); A.map.player.pose('dig'); if (A.map.player.shoulder) A.map.player.shoulder(0.9); const me = A.map.player.pos(); A.map.player.face(bearing(c.x - me.x, c.z - me.z)); } dig.tap = 0.5; }
  function digStop() { if (!dig) return; const c = S().cur; if (c) { c.dp = dig.p; mark(); } dig = null; A.map.player.pose(null); if (A.map.player.shoulder) A.map.player.shoulder(0); if (!A.busy()) A.map.player.freeze(false); }
  function digFrame(dt) { const c = S().cur; if (!c || A.busy()) { digStop(); return; } const hold = A.map.player.held('KeyE') || dig.tap > 0; dig.tap -= dt; if (!hold) { digStop(); if (HD) HD.hot.label = digLabel(c); return; }
    dig.p = Math.min(1, dig.p + dt / 1.6); dig.snd -= dt; if (dig.snd <= 0) { dig.snd = 0.27; if (A.map.tone) A.map.tone(140 + ((dig.p * 97) % 40), 0, 0.09, 'triangle', 0.12, 90); }
    if (MD) { MD.scale.set(1.25, 1.25 * Math.max(0.25, 1 - dig.p * 0.75), 1.25); MD.updateMatrix(); } if ((dg += dt) > 0.2) { dg = 0; if (HD) HD.hot.label = digLabel(c); } if (dig.p >= 1) reveal(c); }
  function reveal(c) { if (c.lost) { lostReveal(c); return; } dig = null; A.map.player.pose(null); shT = 2.4; if (HD) HD.hot.off = true; if (MD) MD.visible = false; const s = S(), LV = TLV[c.lv], y = MD ? MD.userData.y : A.gy(c.x, c.z), me = A.map.player.pos();
    try { if (A.map.prop && A.map.prop.spawn) { if (CHEST) CHEST.remove(); CHEST = A.map.prop.spawn('chest', c.x, y, c.z, { h: bearing(me.x - c.x, me.z - c.z), s: 1.35, rise: 0.7 }); chestT = 14; } } catch (er) { console.warn('[보물] 상자', er); }
    A.map.sfx && A.map.sfx('ding'); s.got[c.id] = day(); s.n[c.lv - 1] = (s.n[c.lv - 1] || 0) + 1; s.last = day(); s.cur = null; let neuT = null; if (s.n[c.lv - 1] >= LV.need && !s.title.includes(c.lv)) { s.title.push(c.lv); neuT = LV.title; }
    const neuD = A.GAME.found('tmap:' + c.k); rwN = { d: neuD, t: neuT }; if (A.learn) A.learn(LV.learn); A.skUp('explore', 3, 'tmap:' + c.k); if (A.rec) A.rec('tmap', { id: c.k, lv: c.lv, h: c.h, t: Math.round(c.el) }); if (c.h >= 3 && A.guideOff) A.guideOff(); mark(); if (A.GAME.flush) A.GAME.flush(); lastHint = ''; cardSig = '';
    rwd = c; rwT = 2.2; }
  function lostReveal(c) { dig = null; A.map.player.pose(null); if (HD) HD.hot.off = true; if (MD) MD.visible = false; const s = S(); s.last = day(); s.cur = null; const up = A.rg().lostFound(c);
    if (A.learn) A.learn(TLV[c.lv].learn); if (A.rec) A.rec('tmap', { id: 'lost', lv: c.lv, h: c.h, t: Math.round(c.el) }); if (c.h >= 3 && A.guideOff) A.guideOff(); mark(); if (A.GAME.flush) A.GAME.flush(); lastHint = ''; cardSig = ''; A.map.sfx && A.map.sfx('ding'); rwN = { d: false, t: null, up }; rwd = c; rwT = 1.0; }
  function lostReward(c) { const lo = c.lost, e = en(), LV = TLV[c.lv], it = L(lo.it.t), who = L(lo.who); const P = A.openP('<h3>' + lo.it.e + ' ' + (e ? 'Found it!' : '찾았어요!') + '</h3><div class="sm">' + esc(e ? 'You found the ' + it + ' in the grass and took it back to the ' + who.toLowerCase() + '.' : '풀숲에서 ' + it + jo(it, '을', '를') + ' 찾아 ' + who + '에게 돌려줬어요.') + (rwN.up ? ' ' + esc(e ? 'They are glad — you are closer friends now.' : '이웃이 반가워해요. 한결 친해졌어요.') : '') + '</div>'
      + '<div class="sm">' + (e ? 'You read a ' + LV.star + ' map' + (c.h ? ' with ' + c.h + ' help' + (c.h > 1 ? 's.' : '.') : ' with no help.') : LV.star + ' 지도를 ' + (c.h ? '도움 ' + c.h + '번으로' : '도움 없이') + ' 읽었어요.') + ' ' + (e ? 'Another neighbour may need you tomorrow.' : '내일은 다른 이웃이 부탁할지도 몰라요.') + '</div>'
      + '<div class="row"><button data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'tmap'); P.onclick = ev => { if (ev.target.closest('button')) A.closeP(); }; }
  function reward(c) { if (c.lost) { lostReward(c); return; } const K = KOF[c.k], LV = TLV[c.lv], e = en(), neuD = rwN.d, neuT = rwN.t; { const P = A.openP('<h3>📦 ' + (e ? 'You found the chest!' : '보물 상자를 찾았어요!') + '</h3><div style="display:flex;gap:14px;align-items:center;margin:6px 0"><div style="font-size:54px;line-height:1">' + K.box + '</div><div><b style="font-size:18px">' + esc(L(K.t)) + '</b><div class="sm">' + esc(L(K.fact)) + '</div></div></div>'
      + '<div class="sm">' + (neuD ? (e ? 'Added to the codex: 🗺 Treasure chests.' : '도감 「🗺 보물 상자」 칸에 넣었어요.') : (e ? 'Already in your codex.' : '도감에 이미 있는 물건이에요.')) + ' ' + (e ? 'You read a ' + LV.star + ' map' + (c.h ? ' with ' + c.h + ' help' + (c.h > 1 ? 's.' : '.') : ' with no help.') : LV.star + ' 지도를 ' + (c.h ? '도움 ' + c.h + '번으로' : '도움 없이') + ' 읽었어요.') + '</div>'
      + (neuT ? '<div style="margin-top:6px;font-weight:900">🏅 ' + (e ? 'New title: ' : '새 칭호: ') + esc(L(neuT)) + '</div>' : '') + '<div class="sm" style="margin-top:4px">' + (e ? 'A new map piece goes up on the board tomorrow.' : '내일 게시판에 새 지도 조각이 붙어요.') + '</div>'
      + '<div class="row">' + (A.dex ? '<button class="sub" data-a="dex">📖 ' + (e ? 'Codex' : '도감') + '</button>' : '') + '<button data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'tmap');
      P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; A.closeP(); chestT = Math.min(chestT, 3); if (b.dataset.a === 'dex' && A.dex) A.dex(); }; } }

  // ── 짓기 · 0.25초 칸 ──
  function init() { clear(); if (!A.on()) return; SRC = srcSpot(); if (!SRC) return; CAND = null;
    HB = A.map.interact.add({ kind: 'game', x: SRC.x, z: SRC.z, y: A.gy(SRC.x, SRC.z), r: 1.8, label: '🗺', use: () => take() }); A.enth.push(HB);
    HD = A.map.interact.add({ kind: 'game', x: SRC.x, z: SRC.z, y: A.gy(SRC.x, SRC.z), r: 6, label: '⛏', use: () => digUse() }); HD.hot.off = true; A.enth.push(HD); q = 1; }
  function boardLabel() { const s = S(), e = en(); if (!A.ready()) return '🔒 🗺 ' + (e ? 'Old map piece — opens with the big map' : '낡은 지도 조각 — 큰 지도가 생기면 열려요'); if (s.cur) return '🗺 ' + (e ? 'Look at my map piece again' : '내 지도 조각 다시 보기'); if (s.last === day()) return '🗺 ' + (e ? 'Old map piece — next one tomorrow' : '낡은 지도 조각 — 내일 또 붙어요'); if (allDone()) return '🗺 ' + (e ? 'Old map pieces — all chests found' : '낡은 지도 조각 — 상자를 모두 찾았어요'); if (chestsDone()) return '🗺 ' + (e ? 'A neighbour’s lost-item map (one a day)' : '이웃이 잃은 물건 지도 받기 (하루 하나)'); return '🗺 ' + (e ? 'Old map piece (one a day)' : '낡은 지도 조각 받기 (하루 하나)'); }
  const chestsDone = () => { const s = S(); return cands().every(c => s.got[c.id] || (c.k === 'view' && LVMAX < 3)); }, allDone = () => chestsDone() && !(A.rg && A.rg() && cands().length);   /* REGEN-1 상자 뒤에도 잃은 물건 지도 */
  function tick(dt) { if (!HB) return; if (dig) { digFrame(dt); return; } if (shT > 0 && (shT -= dt) <= 0) { if (A.map.player.shoulder) A.map.player.shoulder(0); if (!A.busy()) A.map.player.freeze(false); } if (rwd && (rwT -= dt) <= 0) { if (!A.busy()) { const c9 = rwd; rwd = null; reward(c9); } else rwT = 0.5; } if (chestT > 0 && (chestT -= dt) <= 0 && CHEST) { CHEST.remove(); CHEST = null; }
    if ((q += dt) < 0.25) return; const step = q; q = 0; const s = S(), c = s.cur;
    { const lb = boardLabel(); if (HB.hot.label !== lb) HB.hot.label = lb; }
    if (!c || A.inb()) { if (MD && MD.visible) MD.visible = false; if (HD && !HD.hot.off) HD.hot.off = true; if ((qs += step) > 1) { qs = 0; card(); } return; }
    const me = A.map.player.pos(), d = Math.hypot(me.x - c.x, me.z - c.z), busy = A.busy();
    if (!busy) { c.el += step; if ((tq += step) > 5) { tq = 0; mark(); } }
    if (!c.lost && d < TLV[c.lv].see) { if (!MD || !MD.parent || MD.position.x !== c.x || MD.position.z !== c.z) mound(c); if (!MD.visible) MD.visible = true; } else if (MD && MD.visible) MD.visible = false;
    const r = TLV[c.lv].dig, near = d < r && Math.abs((MD && !c.lost ? MD.userData.y : c.lost ? A.gy(c.x, c.z) : me.y) - me.y) < 3; if (HD) { const h = HD.hot; if (near) { if (h.x !== c.x || h.z !== c.z) { h.x = c.x; h.z = c.z; h.y = A.gy(c.x, c.z); h.r = r; } const lb = digLabel(c); if (h.label !== lb) h.label = lb; if (h.off) h.off = false; } else if (!h.off) h.off = true; }
    cardLine(c, me); if ((qs += step) > 1) { qs = 0; card(); } }
  function clear() { if (dig) digStop(); if (CHEST) { try { CHEST.remove(); } catch (e) { /* 이미 치움 */ } CHEST = null; } if (MD && MD.parent) MD.parent.remove(MD); if (MD) MD.visible = false; HB = HD = null; SRC = null; CAND = null; }
  function dispose() { clear(); if (MG) MG.dispose(); if (MM) MM.dispose(); MD = MG = MM = null; if (CARD) { CARD.remove(); CARD = null; } CV = null; CVK = ''; }
  // 도감 갈래(town_dex.js dexBook 마지막 인자): 이 마을에 있는 상자 자리 갈래만 · 빈칸 귀띔 = 놀람 자리 이름(장소 이름 X)
  function dex() { const ks = [...new Set(cands().map(c => c.k))]; return ks.map(k => { const K = KOF[k]; return { id: k, icon: K.box, t: K.t, hint: ['지도 조각을 따라 ' + K.surp[0] + ' 곁에서', 'Follow a map piece to a ' + K.surp[1].toLowerCase()] }; }); }
  const titleNow = () => { const s = S(); return s.title.length ? TLV[Math.max(...s.title)].title : null; };
  return { init, tick, dispose, dex, titleNow, take, openMap, hint, get on() { return !!HB; }, free: () => { const s = S(); return !!HB && A.ready() && !s.cur && s.last !== day() && !allDone(); },   /* WAKE-1b: 오늘 새 조각을 받을 수 있나(바람에 날아온 종이 — town_road.js) */ dir8: () => { const c = S().cur; return !!(c && c.lv === 2); },   /* ★★ 지도를 든 동안 = 나침반 띠 8방위(town.js compStrip) */ get digging() { return !!dig; },
    info: () => { const s = S(); return { src: SRC && { x: +SRC.x.toFixed(1), z: +SRC.z.toFixed(1), name: SRC.name }, cur: s.cur && JSON.parse(JSON.stringify(s.cur)), got: { ...s.got }, n: s.n.slice(), last: s.last, title: s.title.slice(), lv: lvNow(), card: !!(CARD && CARD.style.display !== 'none'), mound: !!(MD && MD.visible), dig: HD && !HD.hot.off ? HD.hot.label : null, board: HB && HB.hot.label, chest: !!CHEST }; },
    near: (x, z) => { const c = S().cur; if (!c || !HD || HD.hot.off || dig) return null; return Math.hypot(x - c.x, z - c.z) < 2.6 ? { x: c.x, z: c.z, y: MD ? MD.userData.y : A.gy(c.x, c.z) } : null; },   /* TOOL-1 삽: 고리가 흙더미 곁인가 */
    shovel: () => { const c = S().cur; if (!c || !HD || HD.hot.off || dig || A.busy()) return false; reveal(c); return true; },   /* TOOL-1 삽으로 판 순간 = 상자(E 꾹 1.6초 대신) */
    mesh: () => MD, dbg: () => DBG.slice(), spots: () => cands().map(c => ({ id: c.id, k: c.k, x: c.x, z: c.z, walk: c.walk, lm: c.lm, hill: !!c.hill })), plan: () => plan() };
}
