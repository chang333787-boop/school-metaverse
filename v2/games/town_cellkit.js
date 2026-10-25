// 칸 키트(CELLKIT-1 · 사용자 10-24 '각 모든 격자마다 할 수 있는 것이 최소 몇 개는 · 아무 의미 없는 판이 아니도록' · 설계 docs/systems/town_cells.md)
//   칸마다 땅 결 서명(sig)을 자료로 한 번 셈 → 규칙표(땅 결 × 세 갈래: 생 = 살아 있는 것 만나기 · 손 = 법칙을 손으로 · 사 = 사람·길) → 그날(계절·비·밤) 켜지는 줄을 칸 번호로 돌려 고름
//   이미 있는 엔진(곤충·야생동물·웅덩이·빗자루·민들레)에 '이 칸의 자리'만 넘기고, 작은 새것(지렁이·개미 줄·분리수거·그늘 얼음·그림자·우편함·메아리·횡단보도·나방·공장 김)은 여기서 그림
//   유비식 X: 아이콘·물음표·'몇 칸 중'·% 0 — 찾는 길은 세상 단서(움직임·소리·비) · 지어내지 않음: 새 건물·명소·실명 인물 0 · 판타지 X
//   이 파일 위쪽(자료·규칙·고르기)은 순수 함수 — Node 하네스(tools/harness/town_cells.cjs)와 게임이 같은 함수를 씀
export const CK_V = 1;
const HG = '가나다라마바사아자차카타파하';
export const FAMS = ['생', '손', '사'];
export const SEAS = ['spring', 'summer', 'autumn', 'winter'];

// ───────── 줄 표(설계 §5-4) — f 갈래 · gen 흔한 줄(길 있는 뭍 칸 · 칸 번호로 돌림) · need 땅 결 조건(sig) · on 켜지는 때(E = { s 계절 0봄~3겨울 · rain · night · day }) · later = 남음(문서 §7 4·5번) ─────────
const DAY = E => !E.night, SUN = E => !E.rain;
export const LINES = [
  { id: 'tree', f: '생', gen: 1, t: ['가로수 곤충', 'Street-tree insects'], need: s => (s.big && s.landy) || s.fh >= 50, on: E => E.s === 1 || E.s === 3 },
  { id: 'bud', f: '생', gen: 1, t: ['겨울눈', 'Winter buds'], need: s => (s.big && s.landy) || s.fh >= 50, on: E => E.s === 3 && DAY(E) },
  { id: 'birds', f: '생', gen: 1, t: ['참새 떼', 'Sparrows'], need: s => s.road && s.landy, on: DAY },
  { id: 'worm', f: '생', gen: 1, t: ['비 온 뒤 지렁이', 'Worms after rain'], need: s => s.road && s.landy, on: E => E.rain && E.s !== 3 },
  { id: 'snail', f: '생', gen: 1, t: ['비 온 뒤 달팽이', 'Snails after rain'], need: s => s.road && s.landy, on: E => E.rain && E.s !== 3 },
  { id: 'ant', f: '생', gen: 1, t: ['개미 줄', 'Ant trail'], need: s => s.road && s.landy, on: E => SUN(E) && DAY(E) && E.s !== 3 },
  { id: 'dfly', f: '생', gen: 1, t: ['가을 잠자리', 'Autumn dragonflies'], need: s => s.landy, on: E => SUN(E) && DAY(E) && E.s === 2 },
  { id: 'moth', f: '생', gen: 1, t: ['가로등 나방', 'Moths at the lamp'], need: s => s.road && s.landy, on: E => E.night && SUN(E) && E.s !== 3 },
  { id: 'cat', f: '생', gen: 1, t: ['처마 밑 고양이', 'Cat under the eaves'], need: s => s.bld && s.road && s.landy, on: E => E.night || E.rain },   /* 이어서 ⑦ 시내 줄: 밤·비 오는 날 처마 밑에서 쉬는 길고양이 */
  { id: 'smoth', f: '생', t: ['간판 불빛 나방', 'Moths at the shop sign'], need: s => s.shop && s.landy, on: E => E.night && SUN(E) && E.s !== 3 },
  { id: 'cricket', f: '생', gen: 1, t: ['풀벌레 소리', 'Crickets chirping'], need: s => s.road && (s.landy || s.fh >= 50) && s.sea < 50, on: E => E.night && SUN(E) && (E.s === 1 || E.s === 2) },   /* 소리가 단서(가까이 가면 뚝 그침) */
  { id: 'frog', f: '생', t: ['봄밤 개구리 울음', 'Frogs calling on a spring night'], need: s => s.landy && s.road && (/green|paddy|field|park/.test(s.zs) || s.water > 0 || /공원|논|하우스|과수원|농촌|간척지|염전/.test(s.g)), on: E => E.night && E.s <= 1 },
  { id: 'flower', f: '생', t: ['화단 곤충', 'Flower-bed insects'], need: s => s.flw && s.landy, on: E => SUN(E) && E.s !== 2 && (DAY(E) || E.s === 3) },
  { id: 'pollen', f: '생', later: 5, t: ['꽃가루 돋보기', 'Pollen with a lens'], need: s => /과수원|하우스/.test(s.g), on: E => SUN(E) && E.s <= 1 },
  { id: 'fish', f: '생', later: 5, t: ['물고기 뜀·갈매기', 'Jumping fish · gulls'], need: s => s.sea >= 5, on: () => true },
  { id: 'puddle', f: '손', gen: 1, t: ['웅덩이', 'Puddles'], need: s => s.road && s.landy, on: E => E.rain },
  { id: 'rainflow', f: '손', gen: 1, later: 4, t: ['빗물 따라가기', 'Follow the rainwater'], need: s => s.road && s.landy, on: E => E.rain },
  { id: 'ice', f: '손', gen: 1, t: ['그늘 얼음', 'Ice in the shade'], need: s => s.shopNear && s.landy, on: E => SUN(E) && DAY(E) && E.s !== 3 },
  { id: 'seed', f: '손', gen: 1, t: ['보도 틈 민들레', 'Pavement dandelion'], need: s => s.road && s.landy, on: E => SUN(E) && DAY(E) && E.s <= 1 },
  { id: 'sweep', f: '손', gen: 1, t: ['골목 쓸기', 'Sweep the lane'], need: s => s.road && s.landy, on: E => E.s >= 2 },
  { id: 'drip', f: '손', gen: 1, t: ['처마 낙숫물', 'Rain dripping from the eaves'], need: s => s.bld && s.road && s.landy, on: E => E.rain },
  { id: 'icep', f: '손', gen: 1, t: ['웅덩이 살얼음', 'Thin ice on a puddle'], need: s => s.road && s.landy, on: E => E.s === 3 && DAY(E) && SUN(E) },   /* 처마 고드름은 4~5m 위라 눈에 안 띔(실측 사진) → 발밑 살얼음 */
  { id: 'box', f: '손', t: ['건물 뒤 빈 상자 묶기', 'Tie up the boxes behind the building'], need: s => (s.shop || s.g === '상가·공공') && s.bld && s.landy, on: SUN },
  { id: 'recycle', f: '손', t: ['분리수거', 'Sorting recycling'], need: s => s.live && s.landy, on: () => true },
  { id: 'shadow', f: '손', t: ['그림자 막대', 'Shadow of the lamp post'], need: s => /공원|아파트/.test(s.g) && s.road, on: E => SUN(E) && DAY(E) },
  { id: 'wind', f: '손', t: ['바람 읽기', 'Reading the wind'], need: s => s.g === '공장', on: () => true },
  { id: 'echo', f: '손', t: ['산 메아리', 'Mountain echo'], need: s => s.fh >= 70 && s.reg === '산', on: () => true },
  { id: 'boatfish', f: '손', later: 5, t: ['배 위 낚시', 'Fishing from a boat'], need: s => s.sea > 95, on: () => true },
  { id: 'mail', f: '사', gen: 1, t: ['우편함 배달', 'Mail to the right box'], need: s => s.bld && s.sea < 50, on: () => true },
  { id: 'cross', f: '사', gen: 1, t: ['횡단보도', 'Crossing'], need: s => s.nroad >= 2 && s.landy, on: () => true },
  { id: 'busk', f: '사', gen: 1, later: 'busk', t: ['버스킹 붐빔', 'Busking crowd'], need: s => s.road && s.landy && !s.live, on: E => SUN(E) && DAY(E) },
  { id: 'board', f: '사', gen: 1, t: ['주민 게시판', 'Neighbourhood notice board'], need: s => s.live && s.road && s.landy, on: () => true },
  { id: 'counter', f: '사', later: 'counter', t: ['창구', 'Counter'], need: s => s.card, on: DAY },
  { id: 'farmboat', f: '사', later: 5, t: ['양식장 배', 'Fish-farm boat'], need: s => s.sea > 95, on: () => true },
];
export const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));
// 흔한 줄 차례(갈래마다 · 돌림 기준)
const GEN = { 생: ['tree', 'bud', 'birds', 'worm', 'snail', 'ant', 'dfly', 'moth', 'cat', 'cricket'], 손: ['puddle', 'rainflow', 'ice', 'seed', 'sweep', 'drip', 'icep'], 사: ['mail', 'cross', 'busk', 'board'] };

// ───────── 칸 주소(town.js cellOf와 같은 규칙: 확장판 선 = 판 가장자리 + grid 선 · 행 한글 · 열 숫자 · rowcol) ─────────
export function gridOf(D) { const g = D.grid || {}, m = D.mat, XE = [m.x0, ...(g.xs || []), m.x0 + m.w], YE = [m.y0, ...(g.ys || []), m.y0 + m.h];
  const nk = (i, k) => k === 'num' ? String(i + 1) : k === 'hangul' ? (HG[i] || '?') : String.fromCharCode(65 + i);
  const name = (c, r) => g.order === 'rowcol' ? nk(r, g.rows) + nk(c, g.cols) : nk(c, g.cols) + nk(r, g.rows);
  const cells = []; for (let r = 0; r < YE.length - 1; r++) for (let c = 0; c < XE.length - 1; c++) cells.push({ n: name(c, r), c, r, rect: [XE[c], YE[r], XE[c + 1], YE[r + 1]] });
  return { XE, YE, cells, name, nC: XE.length - 1, nR: YE.length - 1 }; }
// 구역(town.js regionOfCell과 같음 — 가~차 × 1~14 판)
export function regionOfCell(nm) { const r = '가나다라마바사아자차'.indexOf(nm[0]), c = parseInt(nm.slice(1), 10); if (r < 0 || !(c >= 1)) return null;
  if ((r <= 1 && c >= 9) || (c >= 13 && r >= 2 && r <= 7)) return '바다'; if (r >= 8 || (r === 7 && c >= 6 && c <= 12)) return '시내'; if (['바8', '사8'].includes(nm) || (c >= 9 && c <= 12 && r >= 2 && r <= 6)) return '강';
  if (c <= 5 && r <= 3) return '산'; if (c <= 5 && r >= 4 && r <= 7) return ['마1', '마2', '바2', '사2'].includes(nm) ? '관광' : '들'; if (c >= 6 && c <= 8 && r <= 6) return '읍내'; return '시내'; }

// ───────── 땅 결 서명(자료만 · three X) — 칸 안 10×10 점을 자연 모양에 대 본 비율 + 갈래 + 이름 있는 블록 + 길 ─────────
const inPoly = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const segD = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t); };
const lineD = (x, y, P) => { let m = 1e9; for (let i = 0; i < P.length - 1; i++) m = Math.min(m, segD(x, y, P[i], P[i + 1])); return m; };
const natHit = (n, x, y) => n.poly ? inPoly(x, y, n.poly) : n.rect ? (x >= n.rect[0] && x <= n.rect[2] && y >= n.rect[1] && y <= n.rect[3]) : n.line ? lineD(x, y, n.line.pts) <= (n.line.w / 2 + (n.k === 'water' ? 2 : 0.4)) : false;
const segIn = (a, b, R, e) => { for (let t = 0; t <= 1; t += 0.02) { const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; if (x > R[0] - e && x < R[2] + e && y > R[1] - e && y < R[3] + e) return true; } return false; };
const SHOPRE = /편의점|마트|슈퍼|모두의 상점|식품|상점|빵|아이스크림|카페|초밥|마라탕|식당|시장|직판장|장터/;
export function sigsOf(D, L0) { const L1 = L0 || D.layers.now, L = { nature: L1.nature || [], zones: L1.zones || [], fills: L1.fills || [], areas: L1.areas || [], blocks: L1.blocks || [], roads: L1.roads || [], works: L1.works || [] }, G = gridOf(D), out = {};
  for (const C of G.cells) { const nm = C.n, R = C.rect, w = R[2] - R[0], h = R[3] - R[1], cnt = {};
    for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { const x = R[0] + (i + 0.5) / 10 * w, y = R[1] + (j + 0.5) / 10 * h; let k = 'land';
      for (const n of L.nature) if (natHit(n, x, y)) { const kk = n.k === 'water' ? (n.id === 'lake' ? 'lake' : n.id === 'apond' ? 'pond' : 'river') : n.k; if (['sea', 'sand', 'mudflat', 'lake', 'river', 'pond'].includes(kk) || k === 'land' || (k === 'hill' && kk === 'forest')) k = kk === 'canal' ? (k === 'land' ? 'canal' : k) : kk; }
      cnt[k] = (cnt[k] || 0) + 1; }
    const zs = [...L.zones.filter(z => z.cell === nm), ...(L.fills || []).filter(z => z.cell === nm), ...L.areas.filter(a => a.cell === nm && a.fill).map(a => a.fill)].map(z => (z.k || '') + ':' + (z.type || '') + (z.dens ? ':' + z.dens : '') + (z.crop ? ':' + z.crop : '')).join(' ');
    const ar = L.areas.filter(a => a.cell === nm).map(a => a.t + (a.style && a.style.length ? '[' + a.style.join(',') + ']' : '')).join(' ');
    const blk = L.blocks.filter(b => b.cell === nm), named = blk.filter(b => b.name || b.kind || b.sign || b.home).map(b => (b.name || b.sign || b.kind || '') + (b.kind ? '{' + b.kind + '}' : '') + (b.home ? '{home}' : '')).join(' ');
    const roads = L.roads.filter(rd => rd.pts.some((p, i) => i < rd.pts.length - 1 && segIn(rd.pts[i], rd.pts[i + 1], R, 0.01)));
    const P = k => cnt[k] || 0, sea = P('sea'), fh = P('forest') + P('hill');
    const s = { n: nm, c: C.c, r: C.r, reg: regionOfCell(nm), land: cnt, zs, ar, named, nblk: blk.length, works: (L.works || []).filter(q => q.cell === nm).map(q => q.k),
      roads: roads.map(rd => rd.id), nroad: roads.length, big: roads.some(rd => rd.w > 3), road: roads.length > 0, sea, fh, hill: P('hill'), forest: P('forest'), water: P('river') + P('lake') + P('pond'), river: P('river'),
      school: !!(D.school && R[0] <= D.school[0] && R[2] >= D.school[2] && R[1] <= D.school[1] && R[3] >= D.school[3]),
      mush: (D.extras || []).some(q => q.k === 'mushroom' && (q.in || []).includes(nm)) };
    s.landy = sea < 50 && fh < 70;
    s.live = /live:/.test(zs) || /home/.test(named);
    s.bld = s.nblk > 0 || /live:|work:/.test(zs);
    s.flw = /flowers|rooftop/.test(zs + ' ' + ar) || /green:park/.test(zs);
    s.shop = SHOPRE.test(named) || /work:shop/.test(zs);
    s.card = blk.some(b => b.name && !SHOPRE.test(b.name) && !b.home);
    s.g = gyeol(s);
    out[nm] = s; }
  const at = {}; for (const s of Object.values(out)) at[s.r + ',' + s.c] = s;
  for (const s of Object.values(out)) { let near = false; for (let a = s.r - 1; a <= s.r + 1; a++) for (let b = s.c - 1; b <= s.c + 1; b++) { const q = at[a + ',' + b]; if (q && q.shop) near = true; } s.shopNear = near; }
  return out; }
// 땅 결(설계 §1 표의 갈래)
function gyeol(v) { const P = k => v.land[k] || 0, z = v.zs, a = v.ar, n = v.named;
  if (v.school) return '학교'; if (P('sea') >= 70) return '바다'; if (P('sand') >= 50) return '모래사장'; if (P('mudflat') >= 50) return '갯벌';
  if (v.n === '다13') return '간척지'; if (v.n === '라13') return '염전·하구'; if (P('lake') >= 15) return '호수'; if (P('river') >= 20) return '강가';
  if (P('forest') >= 70) return /집|home/.test(n) ? '숲 속 집' : '숲'; if (P('hill') >= 70) return /집|마을|상점|home/.test(a + n) ? '산마을' : '산비탈';
  if (/paddy/.test(z)) return '논'; if (/greenhouses/.test(z)) return '하우스'; if (/orchard/.test(z)) return '과수원';
  if (/park/.test(z) || /산책로|쉼터|동물 쉬는|놀이터|공원|축구장/.test(a)) return '공원·풀밭'; if (/factory/.test(z) || /공장/.test(n)) return '공장'; if (/농촌/.test(a)) return '농촌 마을';
  if (/live:apt|live:mix|아파트/.test(z + a)) return '아파트'; if (/live:house|네 집|빌라|마을|^집/.test(z + ' ' + a + ' ' + n) || /home/.test(n)) return '주택가'; return '상가·공공'; }

// ───────── 이미 있는 것(자료로 어림 · 갈래와 켜지는 때) — 셋 이상 + 보이는 것 VMIN 이상이면 키트를 안 붙이는 근거(산·논은 대개 여기서 끝) ─────────
//   어디서나 되는 것(웅덩이 첨벙·빗자루·삽·바람·버스킹·별 보기)은 칸을 가르지 못해 세지 않음(설계 §0)
//   free = 그 칸 어디서나 도구로 하는 것(숲 줍기·낚시·물 실험·나뭇잎 배·모래성·헤엄·꽃밭 물 주기) — 세상에 보이는 단서(E·움직이는 것)가 없어 '보이는 것' VMIN에는 안 셈(게임 실측 SM_TOWN.cells와 맞춤 · 이어서 ⑦)
export function haveOf(s) { const it = [], add = (t, f, on, free) => it.push({ t, f, on: on || (() => true), free: !!free }), wk = E => !E.night, P = k => s.land[k] || 0;
  if (s.school) return [{ t: '학교 안 놀이', f: '사', on: () => true }, { t: '텃밭', f: '손', on: () => true }, { t: '학교 친구', f: '생', on: () => true }];
  for (const k of s.works) add('일:' + k, '사', wk);
  if (!s.works.length) { if (/paddy/.test(s.zs)) add('일:논', '사', wk); else if (/greenhouses/.test(s.zs)) add('일:딸기', '사', wk); else if (/orchard/.test(s.zs)) add('일:배', '사', wk); }   /* 논·하우스·과수원 일꾼(칸 없는 works 자료) */
  if (s.shop) add('가게', '사', wk);
  if (/home/.test(s.named)) add('아이 집', '사');
  if (/paddy/.test(s.zs)) add('논 생물·물 대기', '손', E => E.s === 0 || E.s === 2);
  if (s.mush) add('버섯', '손', E => E.s !== 3);
  if (s.fh >= 50) { add('숲 줍기', '손', null, 1); add('다람쥐', '생', E => wk(E) && E.s !== 3); }
  if (P('river') >= 10) add('왜가리', '생', wk, 1); if (s.water >= 10 || P('pond') > 0) add('오리', '생', wk, 1);   /* 물새는 물가 몇 자리에만 앉아 칸에 따라 없음(실측 라12 0) → 보이는 것으로 세지 않음 */
  if (s.water >= 10 || P('pond') > 0 || (s.sea >= 5 && s.sea <= 95)) { add('낚시', '손', null, 1); add('물 실험', '손', null, 1); }
  if (P('river') >= 20) add('나뭇잎 배', '손', E => E.s !== 3, 1);
  if (s.sea > 95) add('배·부표', '손');
  if (s.sea > 0 && P('sand') > 10) { add('모래성·연', '손', E => wk(E) && !E.rain, 1); add('헤엄', '손', E => wk(E) && !E.rain && E.s === 1, 1); }
  if (P('mudflat') >= 50) add('갯벌 관찰', '생');
  if (/green:park/.test(s.zs)) add('민들레', '손', E => !E.rain && wk(E) && E.s <= 1);
  if (/flowers/.test(s.ar)) add('꽃밭 물 주기', '손', null, 1);
  return it; }

// ───────── 고르기(순수) — 칸 하나 · 그날 E · can(줄) = 게임에선 실제 자리를 찾았나(Node = 늘 참) ─────────
const hashS = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
//   차례: ① 이미 있는 것 중 그날 켜진 것을 셈 ② 갈래마다 '모자라면'(합 < 3 또는 보이는 것 < VMIN 또는 갈래 하나뿐) 하나 — 결 전용 줄 먼저, 흔한 줄은 (행 + k × 열 + 날) 번째(이웃 넷과 늘 다름) ③ 그래도 모자라면 다른 줄로 채움
export const VMIN = 3;
export function choose(s, E, can, have) { const H = (have || haveOf(s)).filter(q => q.on(E)), fam = new Set(H.map(q => q.f)); let t = H.length, v = H.filter(q => !q.free).length; const out = [];
  if (t >= 3 && v >= VMIN && fam.size >= 2) return out;
  const ok = l => !l.later && l.need(s) && l.on(E) && (!can || can(l.id));
  const pick = f => { const L9 = LINES.filter(l => l.f === f && ok(l) && !out.includes(l.id)); if (!L9.length) return null; const sp = L9.filter(l => !l.gen);
    if (sp.length) return sp[sp.length > 1 ? hashS(s.n + ':' + (E.day || 0)) % sp.length : 0].id;
    const G9 = L9.sort((a, b) => GEN[f].indexOf(a.id) - GEN[f].indexOf(b.id)), m = G9.length; return G9[(s.r + (m === 2 ? 1 : 2) * (s.c + 1) + (E.day || 0)) % m].id; };
  const off = (s.r + 2 * (s.c + 1) + (E.day || 0)) % 3, ord = [FAMS[off], FAMS[(off + 1) % 3], FAMS[(off + 2) % 3]];   /* 칸마다 먼저 채우는 갈래를 돌림 → 이웃과 겹침·한 줄 쏠림을 줄임 */
  for (const f of ord) if (fam.size < 2 && !fam.has(f)) { const id = pick(f); if (id) { out.push(id); t++; v++; fam.add(f); } }
  for (const f of [ord[0], ord[1], ord[0], ord[2], ord[1], ord[2]]) { if (t >= 3 && v >= VMIN) break; const id = pick(f); if (id) { out.push(id); t++; v++; fam.add(f); } }
  return out; }
// 하루 판 여덟(계절 4 × 맑음·비) + 밤 넷
export const CONDS = [...[0, 1, 2, 3].flatMap(s => [{ s, rain: false, night: false, k: SEAS[s] + ' 맑음 낮' }, { s, rain: true, night: false, k: SEAS[s] + ' 비 낮' }]), ...[0, 1, 2, 3].map(s => ({ s, rain: false, night: true, k: SEAS[s] + ' 맑음 밤' }))];

// ════════════════════ 게임 쪽(createCellKit) ════════════════════
//   짓기 때 한 번: 칸 서명(자료) · 칸마다 줄의 자리(있는 것 = 가로수·화단·가로등·분리수거장·신호·건물 문·인도 점 — 새 3D 0) → can(칸)
//   0.5초 칸: 내 칸 + 이웃 여덟만 그날 줄을 고르고(캐시) 키트가 그리는 줄만 켬(E 자리 · chem 둥근 판 칸) · 먼 칸은 끔
//   매 프레임 = 0.1초 거름 뒤 가까운(30m) 움직이는 것만(지렁이 꿈틀·개미 걸음·나방 맴돌기·얼음 녹기·신호 기다리기) · 새 객체 X
//   이미 있는 엔진이 그리는 줄(가로수·화단 곤충·가을 잠자리 = 곤충 자리 · 참새 = 야생동물 · 웅덩이 = chem · 골목 쓸기 = 빗자루 더미)은 isOn(칸, 줄)으로 그날만 켬
//   보상 = 솜씨(skUp 꼬리표 'kit:<줄>' — rwCheck 한 문 · RW_XP.kit) · 저장 = GAME.S.ck(그날 한 것만)
// 마을 쪽이 넘기는 것(A): map · T3 · GAME · D · L(지금 층) · on() · lang() · cell(x, z) · toW(mx, my) → [x, z] · gy · okGround · side(인도) · walk · roads() · blds() · trees() · lamps() · bins() · sigs() · sigSt(s9, ax)
//   shop(B9) · chem() · season() · wx() · night() · min() · busy() · inb() · say · openP · closeP · esc · skUp(k, n, src) · has(e) · guide(to, nm) · routeBusy()
const T2 = (ko, en9) => [ko, en9];
const TX = {
  bud: { e: T2('🌳 나뭇가지 겨울눈 살펴보기', '🌳 Look at the winter buds'), hint: T2('가로수 가지 끝에 작고 동그란 눈이 달려 있어요', 'Small round buds sit at the tips of the twigs'), done: T2('가지 끝에 작은 겨울눈이 있어요. 비늘이나 털로 싸여 있어서 봄에 나올 새잎과 꽃을 추위에서 지켜 줘요.', 'Small winter buds sit at the twig tips. Scales or fuzz keep next spring’s leaves and flowers safe from the cold.') },
  worm: { e: T2('🐛 지렁이를 흙으로 옮겨 주기', '🐛 Move the worm onto the soil'), hint: T2('비 온 뒤라 보도에 지렁이가 나와 있어요', 'After the rain, a worm is out on the pavement'), done: T2('지렁이를 화단 흙으로 옮겨 줬어요. 지렁이는 흙 속을 다니며 흙을 부드럽고 기름지게 해요.', 'You moved the worm onto the soil. Worms tunnel through soil and make it soft and rich.') },
  snail: { e: T2('🐌 달팽이 살펴보기', '🐌 Look at the snail'), hint: T2('젖은 풀 위에 달팽이가 천천히 기어가요', 'A snail is creeping over the wet grass'), done: T2('달팽이는 축축한 날 잘 나와요. 긴 더듬이 끝에 눈이 있고, 날이 마르면 껍데기 속에 들어가 쉬어요.', 'Snails come out on damp days. Their eyes are at the tips of the long feelers, and they rest inside the shell when it is dry.') },
  ant: { e: T2('🐜 개미 줄 가만히 보기', '🐜 Watch the ant trail'), e2: T2('🍞 빵 부스러기 조금 놓아 보기', '🍞 Put down a few bread crumbs'), hint: T2('보도 틈으로 개미들이 줄지어 지나가요', 'Ants are marching in a line along the pavement'), done: T2('개미는 먹이를 찾으면 냄새를 남기고, 다른 개미들이 그 냄새 길을 따라 줄지어 다녀요.', 'When an ant finds food it leaves a scent, and the others follow that scent trail in a line.'), done2: T2('개미들이 빵 부스러기 쪽으로 길을 바꿨어요. 먼저 찾은 개미가 남긴 냄새 길을 따라가요.', 'The ants turned toward the crumbs, following the scent left by the first ant to find them.') },
  moth: { e: T2('🔍 가로등 나방 살펴보기', '🔍 Look at the moths by the lamp'), hint: T2('가로등 불빛 둘레에 나방이 맴돌아요', 'Moths are circling the street lamp'), done: T2('나방은 밤에 불빛 쪽으로 모여드는 성질이 있어요. 낮에는 나뭇잎 뒤나 그늘에서 쉬어요.', 'Moths are drawn toward lights at night. By day they rest under leaves or in the shade.') },
  ice: { e: T2('❄ 얼음 녹이기 견주기(햇볕과 그늘)', '❄ Melt ice: sun vs shade'), go: T2('가게에서 얼음 두 조각을 얻었어요. 하나는 햇볕에, 하나는 처마 그늘에 놓았어요 — 지켜봐요', 'The shop gave you two ice cubes. One is in the sun, one under the eaves — watch them'), done: T2('햇볕 쪽 얼음은 다 녹아 물이 되었고, 그늘 쪽 얼음은 아직 남았어요. 햇볕을 덜 받는 그늘이 더 시원해서 얼음이 천천히 녹아요.', 'The ice in the sun melted into water, but the ice in the shade is still there. Shade gets less sunlight, so it is cooler and ice melts slowly.') },
  seed: { e: T2('🌬 보도 틈 민들레 홀씨 후~ 불기', '🌬 Blow the pavement dandelion'), hint: T2('보도블록 틈에 민들레 홀씨가 동그랗게 맺혔어요', 'A dandelion clock has grown in a crack in the pavement') },
  recycle: { e: T2('♻ 분리수거장 정리하기', '♻ Sort the recycling'), hint: T2('분리수거장 앞에 섞인 쓰레기가 놓여 있어요', 'Mixed rubbish is piled in front of the recycling bins'), done: T2('종이·플라스틱·캔·유리를 나눠 버리면 다시 녹이고 만들어 새 물건으로 쓸 수 있어요.', 'Sorted paper, plastic, cans and glass can be melted and made into new things.') },
  shadow: { e: T2('📏 그림자 끝에 분필로 표시하기', '📏 Mark the tip of the shadow with chalk'), hint: T2('가로등 그림자가 땅에 길게 드리워졌어요', 'The lamp post casts a long shadow on the ground') },
  wind: { e: T2('🌬 공장 김으로 바람 읽기', '🌬 Read the wind from the factory steam') },
  echo: { e: T2('📣 "야호!" 외쳐 보기', '📣 Shout "Yaho!"'), done: T2('소리가 맞은편 산에 부딪혀 되돌아왔어요 — 메아리예요. 멀리서 부딪힐수록 늦게 들려요.', 'Your voice bounced off the hills and came back — an echo. The farther away it bounces, the later you hear it.') },
  mail: { e: T2('📮 우편함 살펴보기', '📮 Check the mailbox'), e2: T2('📮 편지 넣기', '📮 Put the letter in') },
  cat: { e: T2('🐈 고양이 가만히 지켜보기', '🐈 Quietly watch the cat'), hint: T2('처마 밑에서 고양이가 꼬리를 살랑거려요', 'A cat is flicking its tail under the eaves'),
    done: T2('고양이는 어두운 곳에서도 잘 봐요. 눈 안쪽에 빛을 되비추는 막이 있어서, 밤에 불빛을 받으면 눈이 반짝여 보여요. 길고양이는 손을 내밀지 말고 멀리서 지켜봐요.', 'Cats see well in the dark. A layer at the back of the eye reflects light, so their eyes seem to shine at night. Don’t reach out to a street cat — watch it from a distance.'),
    done2: T2('고양이는 털이 젖는 것을 싫어해서, 비 오는 날엔 처마 밑처럼 비가 안 닿는 곳에서 쉬어요. 길고양이는 손을 내밀지 말고 멀리서 지켜봐요.', 'Cats don’t like wet fur, so on rainy days they rest where the rain can’t reach, like under the eaves. Don’t reach out to a street cat — watch it from a distance.') },
  cricket: { e: T2('🎵 풀벌레 소리에 귀 기울이기', '🎵 Listen to the crickets'), hint: T2('풀숲에서 귀뚤귀뚤 소리가 나요', 'A chirping sound comes from the grass'), done: T2('귀뚜라미는 양 날개를 비벼서 소리를 내요. 수컷이 짝을 부르는 소리이고, 날이 따뜻할수록 더 빠르게 울어요. 가까이 다가가면 놀라서 뚝 그쳐요.', 'Crickets chirp by rubbing their wings together. It is the males calling for a mate, and they chirp faster when it is warmer. Get close and they suddenly go quiet.') },
  frog: { e: T2('🐸 개구리 울음주머니 살펴보기', '🐸 Look at the frog’s vocal sac'), hint: T2('풀밭 쪽에서 개굴개굴 소리가 들려요', 'Croaking comes from the grass'), done: T2('개구리는 목 아래 울음주머니를 풍선처럼 부풀려 큰 소리를 내요. 봄밤에 우는 것은 수컷이 짝을 부르는 소리예요.', 'A frog puffs up the sac under its throat like a balloon to make a loud call. On spring nights it is the males calling for a mate.') },
  smoth: { e: T2('🔍 간판 불빛 나방 살펴보기', '🔍 Look at the moths by the shop sign'), hint: T2('가게 간판 불빛 둘레에 나방이 맴돌아요', 'Moths are circling the lit shop sign'), done: T2('가게 간판 불빛에 나방이 모였어요. 나방 같은 밤 곤충은 밝은 빛 쪽으로 날아드는 성질이 있어서, 불이 켜진 곳에 많이 모여요.', 'Moths gathered at the lit sign. Night insects like moths fly toward bright light, so many gather wherever lights are on.') },
  drip: { e: T2('💧 처마 끝 낙숫물 보기', '💧 Watch the drips from the eaves'), hint: T2('처마 끝에서 빗방울이 똑똑 떨어져요', 'Raindrops are dripping from the edge of the roof'), done: T2('지붕에 떨어진 빗물이 기울기를 따라 모여 처마 끝에서 떨어져요 — 낙숫물이에요. 처마 밑은 비가 덜 닿아서 잠깐 비를 피할 수 있어요.', 'Rain on the roof runs down the slope and drips from the edge — that is why a line of drops falls there. Under the eaves the rain hardly reaches, so you can shelter for a moment.') },
  icep: { e: T2('👟 살얼음 살짝 밟아 보기', '👟 Step lightly on the thin ice'), hint: T2('보도 웅덩이가 하얗게 얼어 있어요', 'A puddle on the pavement has frozen white'), done: T2('밤사이 기온이 0도 아래로 내려가 웅덩이 물이 겉부터 얼었어요. 얼음은 물보다 가벼워 위에 뜨기 때문에, 물은 위에서부터 얼어요. 얼음 낀 길은 미끄러우니 천천히 걸어요.', 'Overnight it dropped below 0°C and the puddle froze from the top. Ice is lighter than water and floats, so water freezes from the top down. Icy paths are slippery — walk slowly.') },
  box: { e: T2('📦 빈 상자 모아 포개 묶기', '📦 Stack and tie the empty boxes'), hint: T2('건물 뒤에 빈 종이 상자가 흩어져 있어요', 'Empty cardboard boxes are scattered behind the building'), done: T2('상자는 테이프와 붙은 송장을 떼고 납작하게 접어 묶어 내놓아요. 부피가 줄어 수거차에 많이 실을 수 있고, 다시 종이로 만들기도 쉬워요.', 'Peel off the tape and labels, flatten the boxes and tie them up. They take less space in the collection truck and are easier to make into new paper.') },
  board: { e: T2('📋 주민 게시판 읽기', '📋 Read the notice board'), hint: T2('게시판에 새 안내문이 붙어 있어요', 'A new notice is pinned on the board'),
    done: [T2('안내문: "재활용품은 정해진 요일에 종류별로 나눠 내놓아요." 함께 사는 곳은 이런 약속을 게시판으로 나눠요.', 'Notice: "Put recycling out by type on the set day." People who live together share rules like this on the board.'),
      T2('안내문: "물탱크 청소로 낮에 잠깐 물이 나오지 않아요." 미리 알리면 이웃이 물을 받아 두고 기다릴 수 있어요.', 'Notice: "The water tank is being cleaned, so the water will be off for a while today." Telling people early lets neighbours store water and wait.'),
      T2('안내문: "밤늦게는 뛰거나 큰 소리를 내지 않아요." 벽과 바닥을 나눠 쓰는 이웃을 배려하는 약속이에요.', 'Notice: "No running or loud noise late at night." It is a promise to care for the neighbours who share our walls and floors.'),
      T2('안내문: "눈이 오면 집 앞 길은 함께 쓸어요." 내 집 앞을 쓸면 모두가 덜 미끄러운 길을 걸어요.', 'Notice: "When it snows, let’s sweep the path in front of our homes." If everyone sweeps their part, the whole street is less slippery.')] },
  cross: { ok: T2('초록불이 켜졌어요. 그래도 왼쪽·오른쪽을 한 번 보고 건너요.', 'The light is green. Still, look left and right once before you cross.'), red: T2('빨간불이에요. 초록불을 기다려요.', 'The light is red. Wait for green.') },
};
const DIR8K = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'], DIR8E = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
// 분리수거 물건(헷갈리는 종이팩·비닐은 넣지 않음 — 4학년 사실만) · [이름, 통 번호, 한 줄]
const RC_ITEMS = [[T2('신문지', 'Newspaper'), 0, T2('종이는 물에 젖지 않게 모아요', 'Keep paper dry')], [T2('종이 상자', 'Cardboard box'), 0, T2('상자는 테이프를 떼고 접어요', 'Remove tape and flatten boxes')],
  [T2('빈 페트병', 'Empty plastic bottle'), 1, T2('페트병은 비우고 라벨을 떼요', 'Empty plastic bottles and peel off the label')], [T2('플라스틱 컵', 'Plastic cup'), 1, T2('남은 음료는 비우고 헹궈요', 'Empty and rinse the cup')],
  [T2('빈 통조림 캔', 'Empty tin can'), 2, T2('캔은 헹궈서 넣어요', 'Rinse cans first')], [T2('빈 음료 캔', 'Empty drink can'), 2, T2('캔은 찌그러뜨리면 자리를 덜 차지해요', 'Squashed cans take less space')],
  [T2('빈 유리병', 'Empty glass bottle'), 3, T2('유리병은 깨지지 않게 살살 넣어요', 'Put glass bottles in gently so they don’t break')], [T2('빈 잼 병', 'Empty jam jar'), 3, T2('병뚜껑은 따로 모아요', 'Keep lids separate')]];
const RC_BINS = [[T2('종이', 'Paper'), '#2f6fd0'], [T2('플라스틱', 'Plastic'), '#c99a10'], [T2('캔', 'Cans'), '#6f777d'], [T2('유리', 'Glass'), '#2f9a55']];
const NS = { bud: 0, worm: 5, snail: 6, ant: 12, moth: 4, ice: 4, seed: 4, recycle: 5, shadow: 3, wind: 0, echo: 0, mail: 3, cross: 0, _m: 4, _mt: 3, cat: 8, cricket: 2, frog: 4, smoth: 4, drip: 4, icep: 4, box: 4, board: 6 };   /* 줄마다 쓰는 둥근 판 칸 수(키트가 그리는 줄만) */
export function createCellKit(A) {
  const en = () => A.lang() === 'en', tx = a => a[en() ? 1 : 0], map = A.map, S = () => A.GAME.S;
  const ST = () => { let c = S().ck; if (!c || typeof c !== 'object' || c.v !== CK_V) c = S().ck = { v: CK_V }; for (const k of ['wm', 'sd', 'ic', 'rc', 'mu', 'n', 'hint', 'ml0', 'bx', 'ip']) if (!c[k] || typeof c[k] !== 'object') c[k] = {}; return c; };
  let NT = false, SUNY = false;   /* 0.5초 칸에서 한 번 셈(밤 · 맑은 낮 해) — 0.1초 그리기에서 새 객체 X */
  let on = false, off = false, SIG = {}, G = null, CEL = {}, BYRC = {}, TODAY = new Map(), tkey = '', gen = -1, buildMs = 0, secMs = 0, secMax = 0, forced = null, SHM = null, steamQ = 0;
  const SIGC = new WeakMap(), INST = new Map(), NK = 192, SLOT = new Uint8Array(NK), WANT = new Set(), M4 = A.T3 ? new A.T3.Matrix4() : null, Q4 = A.T3 ? new A.T3.Quaternion() : null, V4 = A.T3 ? new A.T3.Vector3() : null, S4 = A.T3 ? new A.T3.Vector3() : null, E4 = A.T3 ? new A.T3.Euler() : null;
  const pickBy = (a, k) => a.length ? a[pickH(k) % a.length] : null;
  const pickH = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const CH = () => { const c = A.chem && A.chem(); return c && c.kitReady && c.kitReady() ? c : null; };
  const put = (i, ...a) => { const c = CH(); if (c && i >= 0) c.kitPut(i, ...a); };
  const toast = (t, s) => map.hud.toast(t, s || 4);
  // ── 그날 판(E): 비 = 지금 비 또는 비 온 뒤 땅이 젖음(웅덩이 물기) · 밤 = 해 진 뒤 ──
  function cond() { if (forced) return forced; const s = Math.max(0, SEAS.indexOf(A.season())), w = A.wx(), wet = (S().chem && S().chem.w) || 0; return { s, rain: w === 'rain' || (w !== 'snow' && wet > 0.25), night: !!A.night(), day: S().day | 0 }; }
  const ekey = E => E.s + '|' + (E.rain ? 1 : 0) + '|' + (E.night ? 1 : 0) + '|' + E.day;
  function today(n) { const E = cond(), k = ekey(E); if (k !== tkey) { tkey = k; TODAY.clear(); } let L9 = TODAY.get(n); if (L9) return L9; const C9 = CEL[n]; if (C9 && !C9.full) return []; L9 = C9 && C9.s && !C9.s.school ? choose(C9.s, E, id => C9.can.has(id), C9.have) : []; TODAY.set(n, L9); return L9; }
  const isOn = (n, id) => on && !off && !!n && today(n).includes(id);

  // ───────── 짓기: 칸마다 자리(있는 것만) ─────────
  function init() { const t0 = performance.now(); clear(); if (!A.on()) return; on = true; G = gridOf(A.D); SIG = SIGC.get(A.L) || sigsOf(A.D, A.L); SIGC.set(A.L, SIG); CEL = {}; BYRC = {};   /* 서명은 층마다 한 번(다시 지을 때 재사용) */
    for (const C of G.cells) { const [ax, az] = A.toW(C.rect[0], C.rect[1]), [bx, bz] = A.toW(C.rect[2], C.rect[3]), s = SIG[C.n]; CEL[C.n] = { n: C.n, c: C.c, r: C.r, s, box: [Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz)], have: s ? haveOf(s) : [], sp: {}, can: new Set(), side: [], verge: [], tr: [], fl: [], lm: [], bin: [], bl: [], fac: [], sg: [] }; BYRC[C.r + ',' + C.c] = CEL[C.n]; }
    const at = (x, z) => CEL[A.cell(x, z)];
    for (const sg of A.roads()) { const a = sg.a, b = sg.b, L0 = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L0 < 10) continue; const ux = (b[0] - a[0]) / L0, uz = (b[1] - a[1]) / L0, px = -uz, pz = ux, big = !!(sg.r && sg.r.big), sw = big ? 2.2 : 1.4, o = sg.hw - (sw - 0.24) / 2;
      for (let t = sg.hw + 4; t < L0 - sg.hw - 4; t += 9) for (const k of [-1, 1]) { const x = a[0] + ux * t + px * o * k, z = a[1] + uz * t + pz * o * k, C9 = at(x, z); if (C9 && C9.side.length < 24) C9.side.push({ x, z, ux, uz, px: px * k, pz: pz * k, big });
        const vx = a[0] + ux * t + px * (sg.hw + 1.3) * k, vz = a[1] + uz * t + pz * (sg.hw + 1.3) * k, V9 = at(vx, vz); if (V9 && V9.verge.length < 24) V9.verge.push({ x: vx, z: vz, ux, uz, px: px * k, pz: pz * k, big }); } }
    const T9 = A.trees(); for (const t of [...(T9.round || []), ...(T9.pine || []), ...(T9.poplar || [])]) { if (t.kid || !(t.s >= 0.8)) continue; const C9 = at(t.x, t.z); if (C9 && C9.tr.length < 40) C9.tr.push(t); }
    for (const f of T9.flower || []) { if (f.kid) continue; const C9 = at(f.x, f.z); if (C9 && C9.fl.length < 20) C9.fl.push(f); }
    for (const l of A.lamps()) { const C9 = at(l.x, l.z); if (C9) C9.lm.push(l); }
    for (const q of A.bins()) { const C9 = at(q.x, q.z); if (C9) C9.bin.push(q); }
    for (const B9 of A.blds()) { if (!B9 || !B9.door) continue; const C9 = at(B9.door[0], B9.door[1]); if (!C9) continue; if (B9.kind === 'factory' || /공장/.test(B9.name || '')) C9.fac.push(B9); if (!/green|pitch|park|lot|school|play|grass/.test(B9.kind || '')) C9.bl.push(B9); }
    for (const s9 of A.sigs()) { const C9 = at(s9.x, s9.z); if (C9) C9.sg.push(s9); }
    QUE.length = 0; for (const C9 of Object.values(CEL)) { if (!C9.s || C9.s.school) continue; for (const id of ENG) { const l = LINE[id]; if (!l.need(C9.s)) continue; const sp = spotOf(C9, id); if (sp) { C9.sp[id] = sp; C9.can.add(id); } } QUE.push(C9); }
    buildMs = Math.round(performance.now() - t0); }
  // 칸 마저 짓기(키트가 그리는 줄의 자리) — 다 지은 칸만 그날 줄을 고름(isOn·today)
  const ENG = ['tree', 'flower', 'dfly', 'birds', 'puddle', 'sweep'], QUE = [];
  function full(C9) { if (C9.full || !C9.s || C9.s.school) return; for (const l of LINES) { if (l.later || ENG.includes(l.id) || !l.need(C9.s)) continue; const sp = spotOf(C9, l.id); if (sp) { C9.sp[l.id] = sp; C9.can.add(l.id); } } C9.full = true; TODAY.delete(C9.n); }
  function fillSome(ms) { const t0 = performance.now(); while (QUE.length && performance.now() - t0 < ms) full(QUE.shift()); }
  const allFull = () => { while (QUE.length) full(QUE.shift()); };
  // 자리 찾기(줄마다 · 결정적 = 칸 이름 해시) — 못 찾으면 null(그 칸에선 그 줄을 고르지 않음)
  const okG = (x, z) => A.okGround(x, z), sideOk = (x, z) => A.side(x, z), stand = (x, z) => okG(x, z) || sideOk(x, z);
  const free = (x, z) => A.walk(x, z) && !(map.q.blocked || map.q.blockedAt)(x, z, A.gy(x, z) + 0.6) && !(map.q.blocked || map.q.blockedAt)(x + 0.3, z, A.gy(x, z) + 0.6) && !(map.q.blocked || map.q.blockedAt)(x - 0.3, z, A.gy(x, z) + 0.6);
  function soilNear(x, z, r0, r1) { for (let r = r0; r <= r1; r += 0.5) for (let k = 0; k < 8; k++) { const a = k * 0.785 + r, qx = x + Math.cos(a) * r, qz = z + Math.sin(a) * r; if (okG(qx, qz)) return [qx, qz]; } return null; }
  function spotOf(C9, id) { const n = C9.n, H = k => pickH(n + ':' + id + ':' + k);
    const sidePt = () => { const L9 = C9.side; for (let i = 0; i < Math.min(10, L9.length); i++) { const p = L9[(H(0) + i) % L9.length]; if (sideOk(p.x, p.z)) return p; } return null; };
    const vergePt = () => { if (C9.vp !== undefined) return C9.vp; const L9 = C9.verge; C9.vp = null; for (let i = 0; i < Math.min(10, L9.length); i++) { const p = L9[(pickH(n + ':v') + i) % L9.length]; if (okG(p.x, p.z)) { C9.vp = p; break; } } return C9.vp; };   /* 칸마다 한 번(참새·잠자리·달팽이가 같이 씀 · 짓기 시간) */
    const openPt = () => { const v = vergePt(); if (v) return v; const [x0, z0, x1, z1] = C9.box; for (let i = 0; i < 6; i++) { const x = x0 + 8 + ((H(i + 5) % 1000) / 1000) * (x1 - x0 - 16), z = z0 + 8 + ((H(i + 50) % 1000) / 1000) * (z1 - z0 - 16); if (okG(x, z)) return { x, z, ux: 1, uz: 0, px: 0, pz: 1 }; } return null; };
    switch (id) {
      case 'tree': { const t = pickBy(C9.tr, n + ':tree'); return t ? { x: t.x, z: t.z, s: t.s || 1, bx: t.x + 0.6 * (t.s || 1), bz: t.z, ex: t.x + 1.6 * (t.s || 1), ez: t.z } : null; }
      case 'bud': { const L9 = C9.tr.slice().sort((a, b) => pickH(n + id + a.x) - pickH(n + id + b.x)); for (const t of L9) { const s9 = t.s || 1; for (const [dx, dz] of [[1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6]]) { const ex = t.x + dx * s9, ez = t.z + dz * s9; if (stand(ex, ez)) return { x: t.x, z: t.z, s: s9, bx: t.x + dx * 0.4 * s9, bz: t.z + dz * 0.4 * s9, ex, ez }; } } return null; }
      case 'flower': { const f = pickBy(C9.fl, n + ':fl'); if (f) return { x: f.x + 0.6, z: f.z }; return /공원/.test(C9.s.g) ? openPt() : null; }
      case 'dfly': { const v = openPt(); return v ? { x: v.x + (v.ux || 0) * 3, z: v.z + (v.uz || 0) * 3 } : null; }   /* 참새 자리에서 길 따라 3m(떠서 맴돎) */
      case 'birds': { const v = vergePt() || sidePt(); if (!v) return null; const pts = [[v.x, v.z]]; for (let k = 0; k < 4 && pts.length < 3; k++) { const a = k * 1.571, x = v.x + Math.cos(a) * 1.3, z = v.z + Math.sin(a) * 1.3; if (stand(x, z)) pts.push([x, z]); } return pts.length >= 2 ? { x: v.x, z: v.z, pts } : null; }
      case 'worm': { const L9 = C9.side; for (let i = 0; i < Math.min(6, L9.length); i++) { const p = L9[(H(2) + i) % L9.length]; if (!sideOk(p.x, p.z)) continue; const q = soilNear(p.x, p.z, 1.5, 3.5); if (q) return { x: p.x, z: p.z, tx: q[0], tz: q[1], ry: Math.atan2(q[0] - p.x, q[1] - p.z) }; } return null; }
      case 'snail': { const v = vergePt(); return v ? { x: v.x, z: v.z, ux: v.ux, uz: v.uz } : null; }
      case 'ant': { const L9 = C9.side; for (let i = 0; i < L9.length; i++) { const p = L9[(H(3) + i) % L9.length], bx = p.x + p.ux * 2.4, bz = p.z + p.uz * 2.4; if (sideOk(p.x, p.z) && sideOk(bx, bz)) { const ox = p.px * 0.35, oz = p.pz * 0.35; return { x: p.x + ox, z: p.z + oz, bx: bx + ox, bz: bz + oz, px: p.px, pz: p.pz }; } } return null; }
      case 'moth': case 'shadow': { const L9 = C9.lm.filter(l => stand(l.x + 1.2, l.z) || stand(l.x - 1.2, l.z) || stand(l.x, l.z + 1.2) || stand(l.x, l.z - 1.2)); return L9.length ? L9[H(4) % L9.length] : null; }
      case 'puddle': case 'sweep': return C9.side.length ? { x: C9.side[0].x, z: C9.side[0].z } : null;
      case 'seed': { const p = sidePt(); if (!p) return null; for (const e of [0.45, 0.25, 0]) { const x = p.x + p.px * e, z = p.z + p.pz * e; if (sideOk(x, z)) return { x, z }; } return null; }
      case 'ice': { const L9 = []; for (let a = C9.r - 1; a <= C9.r + 1; a++) for (let b = C9.c - 1; b <= C9.c + 1; b++) { const N9 = BYRC[a + ',' + b]; if (N9) for (const B9 of N9.bl) if (A.shop(B9)) L9.push([B9, a === C9.r && b === C9.c ? 0 : 1]); }
        L9.sort((p, q) => p[1] - q[1] || pickH(n + p[0].cx) - pickH(n + q[0].cx)); const ch = A.chem && A.chem();
        for (const [B9] of L9) { const dx = B9.door[0] - B9.cx, dz = B9.door[1] - B9.cz, dl = Math.hypot(dx, dz) || 1, nx = dx / dl, nz = dz / dl, tx9 = -nz, tz9 = nx;
          for (const sd of [1.6, -1.6, 2.4, -2.4, 1.0, -1.0]) { const hx = B9.door[0] + nx * 0.7 + tx9 * sd, hz = B9.door[1] + nz * 0.7 + tz9 * sd; if (!free(hx, hz) || !eav(B9, hx, hz)) continue;
            for (const d9 of [4.5, 5.5, 6.5, 3.6]) { const sx = hx + nx * d9, sz = hz + nz * d9; if ((stand(sx, sz) || free(sx, sz)) && !eav(B9, sx, sz) && !(ch && ch.eaves && ch.eaves(sx, sz))) return { x: B9.door[0] + nx * 1.2, z: B9.door[1] + nz * 1.2, hx, hz, sx, sz }; } } } return null; }
      case 'recycle': { const q = C9.bin[0]; if (!q) return null; for (const d9 of [2.0, -2.0]) { const fx = q.x + Math.sin(q.ry + Math.PI / 2) * d9, fz = q.z + Math.cos(q.ry + Math.PI / 2) * d9; if (stand(fx, fz)) return { x: q.x, z: q.z, fx, fz, ry: q.ry }; } return null; }
      case 'wind': { for (const B9 of C9.fac) { const ex = B9.door[0], ez = B9.door[1]; if (stand(ex, ez) || !(map.q.blocked || map.q.blockedAt)(ex, ez, A.gy(ex, ez) + 0.6)) return { x: ex, z: ez, sx: B9.cx, sy: (B9.y0 ?? A.gy(B9.cx, B9.cz)) + (B9.drawnH ?? B9.h ?? 8) + 0.4, sz: B9.cz }; } return null; }
      case 'echo': { const [x0, z0, x1, z1] = C9.box; let best = null, bh = -1e9; for (let i = 1; i < 7; i++) for (let j = 1; j < 7; j++) { const x = x0 + (x1 - x0) * i / 7, z = z0 + (z1 - z0) * j / 7, g = A.gy(x, z); if (g > bh && A.walk(x, z) && !(map.q.blocked || map.q.blockedAt)(x, z, g + 0.6)) { bh = g; best = { x, z }; } } return best; }
      case 'mail': { const L9 = C9.bl.filter(B9 => /house|apt|shop|office/.test(B9.kind || '') || B9.name); for (let i = 0; i < L9.length; i++) { const m = mailAt(L9[(H(6) + i) % L9.length]); if (m) return m; } return null; }
      case 'cricket': case 'frog': { const v = openPt(); if (!v) return null; const o = id === 'frog' ? 1.6 : -1.6, x = v.x + (v.ux || 0) * o, z = v.z + (v.uz || 0) * o; return stand(x, z) ? { x, z, ry: pickH(n + id) % 628 / 100 } : { x: v.x, z: v.z, ry: 0 }; }   /* 길가 풀밭(참새 자리에서 길 따라 1.6m) */
      case 'cat': case 'drip': { const d0 = id === 'cat' ? [0.65, 0.85] : [1.0], L9 = bldsBy(C9, n + id, B9 => B9.h >= 2.5 && (id === 'cat' || lowB(B9)));
        for (const B9 of L9) { const F = faceOf(B9), tw = F.tw - 0.4; for (const sd of [1.6, -1.6, 2.4, -2.4, 0.9, -0.9]) { if (Math.abs(sd) > tw) continue; for (const o of d0) { const hx = F.fx + F.nx * o + F.tx * sd, hz = F.fz + F.nz * o + F.tz * sd; if (!free(hx, hz) || !eav(B9, hx, hz)) continue;
          const eo = id === 'cat' ? 1.9 : -0.45, ex = hx + F.nx * eo, ez = hz + F.nz * eo; if (!(stand(ex, ez) || free(ex, ez))) continue;
          return { x: hx, z: hz, ex, ez, ry: Math.atan2(F.nx, F.nz) + (sd > 0 ? 0.7 : -0.7), top: gy(F.fx + F.nx * 0.5, F.fz + F.nz * 0.5) + (B9.wallH ?? B9.h), col: [0xd9a066, 0x6f6a66, 0x2e2a28, 0xe8e2d8][pickH(n + 'cc') % 4] }; } } } return null; }   /* 고양이 = 벽 곁 0.65m(처마 밑) · E는 처마 밖 1.9m(가까이 X) · 낙숫물 = 처마 끝 1.0m에 떨어지고 E는 처마 밑(비를 피하며 봄) */
      case 'icep': { const L9 = C9.side; for (let i = 0; i < Math.min(10, L9.length); i++) { const p = L9[(H(9) + i) % L9.length]; for (const e9 of [0.3, -0.3, 0]) { const x = p.x + p.px * e9, z = p.z + p.pz * e9; if (sideOk(x, z) && !okG(x, z) && sideOk(x + p.ux * 0.4, z + p.uz * 0.4) && sideOk(x - p.ux * 0.4, z - p.uz * 0.4)) return { x, z, ry: Math.atan2(p.ux, p.uz) }; } } return null; }   /* 보도 위(앞뒤 0.4m도 보도) */
      case 'smoth': { for (const B9 of bldsBy(C9, n + id, B9 => A.shop(B9) && B9.h >= 2.5)) { const F = faceOf(B9), ex = F.fx + F.nx * 2.0, ez = F.fz + F.nz * 2.0; if (!(stand(ex, ez) || free(ex, ez))) continue;
          return { x: F.fx + F.nx * 0.45, z: F.fz + F.nz * 0.45, hx: F.fx + F.nx * 0.45, hz: F.fz + F.nz * 0.45, hy: gy(F.fx + F.nx * 0.5, F.fz + F.nz * 0.5) + Math.min(3.3, B9.h - 0.4), ex, ez }; } return null; }   /* 간판 높이 = 앞면 밖 땅 + 3.3m 안 */
      case 'box': { for (const B9 of bldsBy(C9, n + id, B9 => B9.h >= 2.5 && (A.shop(B9) || /shop|office/.test(B9.kind || '')))) { const F = faceOf(B9);
          for (const [ux, uz] of [[-F.nx, -F.nz], [F.tx, F.tz], [-F.tx, -F.tz]]) { const e9 = edgeT(B9, ux, uz) + 0.7, bx = B9.cx + ux * e9, bz = B9.cz + uz * e9, ex = bx + ux * 1.2, ez = bz + uz * 1.2; if (free(bx, bz) && (stand(ex, ez) || free(ex, ez))) return { x: bx, z: bz, ex, ez, ry: Math.atan2(ux, uz) }; } } return null; }   /* 가게 뒤(없으면 옆) 벽 곁 0.7m = 뒷골목 */
      case 'board': { for (const B9 of bldsBy(C9, n + id, B9 => /house|apt/.test(B9.kind || '') || !!B9.home)) { const F = faceOf(B9); for (const sd of [3.2, -3.2, 4.2, -4.2]) { if (Math.abs(sd) > F.tw + 1.5) continue; const x = F.fx + F.nx * 1.3 + F.tx * sd, z = F.fz + F.nz * 1.3 + F.tz * sd, ex = x + F.nx * 1.3, ez = z + F.nz * 1.3;
          if (free(x, z) && free(x + F.tx * 0.6, z + F.tz * 0.6) && free(x - F.tx * 0.6, z - F.tz * 0.6) && (stand(ex, ez) || free(ex, ez))) return { x, z, ex, ez, ry: Math.atan2(F.nx, F.nz), tx: F.tx, tz: F.tz }; } } return null; }   /* 집·아파트 앞 마당 가장자리(문 앞을 가리지 않게 3m 옆) */
      case 'cross': { for (const s9 of C9.sg) { const t0 = s9.t[0], hwA = s9.hw[0], hwB = s9.hw[1]; for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const x = s9.x - t0[1] * (hwA - 0.7) * a + t0[0] * (hwB - 0.7) * b, z = s9.z + t0[0] * (hwA - 0.7) * a + t0[1] * (hwB - 0.7) * b; if (stand(x, z) || free(x, z)) return { x, z, s9 }; } } return null; }
    } return null; }
  // 처마 밑(chem eaves와 같은 규칙: 건물 상자 밖 1.1m 안 · 키 2.5m 넘는 건물) — 짓기 때는 chem이 아직 없어 건물로 직접 셈
  function eav(B9, x, z) { if (!(B9.h >= 2.5) || !(B9.w > 0) || !(B9.d > 0)) return false; const c = Math.cos(B9.ry || 0), s9 = Math.sin(B9.ry || 0), dx = x - B9.cx, dz = z - B9.cz, lx = Math.abs(dx * c - dz * s9), lz = Math.abs(dx * s9 + dz * c); return lx < B9.w / 2 + 1.1 && lz < B9.d / 2 + 1.1 && (lx > B9.w / 2 || lz > B9.d / 2); }
  // 건물 상자 가운데에서 방향 (ux, uz)로 벽까지 거리(eav와 같은 돌림) · 앞면(fw) 가운데 점·접선·앞면 반폭
  function edgeT(B9, ux, uz) { const c = Math.cos(B9.ry || 0), s9 = Math.sin(B9.ry || 0), lx = Math.abs(ux * c - uz * s9), lz = Math.abs(ux * s9 + uz * c); return Math.min(lx > 1e-4 ? B9.w / 2 / lx : 1e9, lz > 1e-4 ? B9.d / 2 / lz : 1e9); }
  function faceOf(B9) { let nx = B9.fw ? B9.fw[0] : B9.door[0] - B9.cx, nz = B9.fw ? B9.fw[1] : B9.door[1] - B9.cz; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; const t = edgeT(B9, nx, nz); return { nx, nz, tx: -nz, tz: nx, fx: B9.cx + nx * t, fz: B9.cz + nz * t, tw: edgeT(B9, -nz, nx) }; }
  const lowB = B9 => B9.h <= 6.5 && (/house|shop/.test(B9.kind || '') || !!B9.home);   /* 처마가 있는 낮은 집·가게 */
  const bldsBy = (C9, k, f) => C9.bl.filter(f).sort((a, b) => pickH(k + a.cx) - pickH(k + b.cx)).slice(0, 8);
  // 우편함 자리 = 건물 문 옆 2m 안팎(넓은 출입문 앞을 가리지 않게 · 걸어서 설 수 있는 곳)
  function mailAt(B9) { const dx = B9.door[0] - B9.cx, dz = B9.door[1] - B9.cz, dl = Math.hypot(dx, dz) || 1, nx = dx / dl, nz = dz / dl; const bl = map.q.blocked || map.q.blockedAt;
    for (const sd of [2.0, -2.0, 2.6, -2.6, 1.5, -1.5]) { const x = B9.door[0] + nx * 0.35 - nz * sd, z = B9.door[1] + nz * 0.35 + nx * sd, y = A.gy(x, z); if (bl(x, z, y + 0.6)) continue; const sx = x + nx * 1.1, sz = z + nz * 1.1; if (bl(sx, sz, A.gy(sx, sz) + 0.6)) continue; return { x, z, ry: Math.atan2(nx, nz), sx, sz }; } return null; }
  // E 서는 자리(줄마다)
  function ePos(id, sp) { if (!sp) return null; switch (id) { case 'bud': return [sp.ex, sp.ez]; case 'ant': return [(sp.x + sp.bx) / 2, (sp.z + sp.bz) / 2]; case 'recycle': return [sp.fx, sp.fz]; case 'mail': case '_mt': return [sp.sx, sp.sz]; case 'cat': case 'drip': case 'smoth': case 'box': case 'board': return [sp.ex, sp.ez];
    case 'moth': case 'shadow': { for (const [dx, dz] of [[1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) if (stand(sp.x + dx, sp.z + dz)) return [sp.x + dx, sp.z + dz]; return [sp.x + 1.2, sp.z]; } default: return [sp.x, sp.z]; } }

  // ───────── 켜진 줄 = 인스턴스(가까운 칸만 · 들어올 때 E 자리·둥근 판 칸을 받고 나갈 때 돌려줌) ─────────
  function alloc(n) { if (!n) return -1; for (let i = 0; i + n <= NK; i++) { let j = 0; while (j < n && !SLOT[i + j]) j++; if (j === n) { SLOT.fill(1, i, i + n); return i; } i += j; } return -2; }
  function release(I) { if (I.sl >= 0) { for (let j = 0; j < I.ns; j++) put(I.sl + j, 0); SLOT.fill(0, I.sl, I.sl + I.ns); const c = CH(); if (c) c.kitFlush(); } I.sl = -1; }
  function mkHot(I, label, r) { const p = ePos(I.id, I.sp); if (!p) return; if (I.h) I.h.remove(); I.h = map.interact.add({ kind: 'game', x: p[0], z: p[1], y: A.gy(p[0], p[1]), r: r || 2.0, label, use: () => use(I) }); I.h.hot.ck = I.id; I.ex = p[0]; I.ez = p[1]; }   /* ck = 칸 키트 E(실측 SM_TOWN.cells가 따로 셈) */
  const hotOff = I => { if (I.h) { I.h.remove(); I.h = null; } };
  function make(k, n, id) { const day = S().day, c = ST(), sp = id === '_mt' ? c.ml0 : id === '_m' ? c.wm[n] : CEL[n].sp[id], I = { k, n, id, sp, h: null, sl: -1, ns: NS[id] || 0, st: '', t: (pickH(k) % 100) / 10, d: 1e9, dr: false, peek: 0, ex: sp ? sp.x : 0, ez: sp ? sp.z : 0, wait: 0, prev: -1 };
    INST.set(k, I); const e = tx;
    switch (id) {
      case 'bud': mkHot(I, e(TX.bud.e), 2.2); break;
      case 'worm': I.st = c.wm[n] && c.wm[n].d === day ? 'saved' : 'out'; if (I.st === 'out') mkHot(I, e(TX.worm.e), 1.8); break;
      case 'snail': mkHot(I, e(TX.snail.e), 1.8); break;
      case 'ant': mkHot(I, A.has('🍞') && c.an !== day + ':' + n ? e(TX.ant.e2) : e(TX.ant.e), 1.9); break;
      case 'moth': mkHot(I, e(TX.moth.e), 2.6); break;
      case 'ice': I.st = c.ic[n] === day ? 'done' : 'idle'; if (I.st === 'idle') mkHot(I, e(TX.ice.e), 2.2); break;
      case 'seed': I.st = c.sd[n] != null && day < c.sd[n] + 2 ? 'blown' : 'head'; if (I.st === 'head') mkHot(I, e(TX.seed.e), 1.7); break;
      case 'recycle': I.st = c.rc[n] === day ? 'done' : 'pile'; if (I.st === 'pile') mkHot(I, e(TX.recycle.e), 2.2); break;
      case 'shadow': mkHot(I, e(TX.shadow.e), 2.4); break;
      case 'wind': mkHot(I, e(TX.wind.e), 2.6); break;
      case 'echo': mkHot(I, e(TX.echo.e), 2.4); break;
      case 'mail': if (!(c.ml0 && c.ml0.d === day && c.ml0.from === n)) mkHot(I, e(TX.mail.e), 1.8); break;
      case '_mt': if (!sp.done) mkHot(I, e(TX.mail.e2), 1.8); break;
      case 'cat': I.peek = 0; mkHot(I, e(TX.cat.e), 2.0); break;
      case 'cricket': case 'frog': I.q = 0; I.ct = 0; mkHot(I, e(TX[id].e), 2.0); break;
      case 'smoth': mkHot(I, e(TX.smoth.e), 2.4); break;
      case 'drip': mkHot(I, e(TX.drip.e), 1.9); break;
      case 'icep': I.st = c.ip[n] === day ? 'crack' : 'ice'; mkHot(I, e(TX.icep.e), 1.8); break;
      case 'box': I.st = c.bx[n] === day ? 'done' : 'pile'; if (I.st === 'pile') mkHot(I, e(TX.box.e), 2.0); break;
      case 'board': mkHot(I, e(TX.board.e), 2.0); break;
    } return I; }
  function drop(I) { release(I); hotOff(I); INST.delete(I.k); }
  function clearInst() { for (const I of [...INST.values()]) drop(I); if (SHM) SHM.m.visible = false; }

  // ───────── 그리기(chem 둥근 판 칸 · 반구 하나를 늘이고 눌러 씀) ─────────
  const gy = (x, z) => A.gy(x, z);
  function drawI(I) { const sp = I.sp, b = I.sl, day = S().day; if (I.ns && b < 0) return; if (!sp && I.id !== '_m') return;
    switch (I.id) {
      case 'worm': if (I.st === 'out') wormAt(I, sp.x, sp.z); else for (let j = 0; j < 4; j++) put(b + j, 0); break;
      case '_m': { const y = gy(sp.x, sp.z); if (day === sp.d) { put(b, sp.x, y + 0.004, sp.z, 0.2, 0.05, 0.2, 0x6b4a2e); for (let j = 1; j < 4; j++) put(b + j, 0); } else { put(b, 0); put(b + 1, sp.x, y + 0.01, sp.z, 0.13, 0.025, 0.13, 0x5a9a40); put(b + 2, sp.x, y + 0.01, sp.z, 0.012, 0.24, 0.012, 0x6fae45); put(b + 3, sp.x, y + 0.24, sp.z, 0.075, 0.04, 0.075, 0xf6d23c); } break; }
      case 'snail': snailAt(I); break;
      case 'ant': antAt(I); break;
      case 'moth': mothAt(I); break;
      case 'ice': iceAt(I); break;
      case 'seed': { const y = gy(sp.x, sp.z); put(b, sp.x, y + 0.012, sp.z, 0.14, 0.03, 0.14, 0x5a9a40); put(b + 1, sp.x, y + 0.01, sp.z, 0.013, 0.32, 0.013, 0x7fae4a); if (I.st === 'head') { put(b + 2, sp.x, y + 0.4, sp.z, 0.1, 0.1, 0.1, 0xf2f2ea); put(b + 3, sp.x, y + 0.4, sp.z, 0.1, 0.1, 0.1, 0xe8e8de, 0, false, 0, Math.PI); } else { put(b + 2, 0); put(b + 3, 0); } break; }
      case 'recycle': { if (I.st !== 'pile') { for (let j = 0; j < 5; j++) put(b + j, 0); break; } const cx = sp.x + (sp.fx - sp.x) * 0.55, cz = sp.z + (sp.fz - sp.z) * 0.55, y = gy(cx, cz), ux = Math.sin(sp.ry), uz = Math.cos(sp.ry);
        [[-0.55, 0.12, 0xc8a070, 0.17, 0.15, 0.13, true], [-0.22, -0.1, 0xe8e4d8, 0.18, 0.03, 0.13, true], [0.08, 0.12, 0xbfe0f0, 0.05, 0.23, 0.05, false], [0.3, -0.06, 0xb8bec4, 0.05, 0.12, 0.05, false], [0.55, 0.1, 0x4f9a5a, 0.05, 0.25, 0.05, false]].forEach(([u, v, hx, a, h, c9, sq], j) => put(b + j, cx + ux * u + uz * v, y + 0.004, cz + uz * u - ux * v, a, h, c9, hx, sp.ry + j, sq)); break; }
      case 'shadow': { const m = ST().sh; for (let j = 0; j < 3; j++) { const q = m && m.d === day && m.n === I.n ? m.m[j] : null; if (q) put(b + j, q[1], gy(q[1], q[2]) + 0.012, q[2], 0.09, 0.006, 0.09, 0xf4f4ee); else put(b + j, 0); } break; }
      case 'cat': catAt(I); break;
      case 'cricket': case 'frog': singAt(I); break;
      case 'smoth': mothAt(I); break;
      case 'drip': dripAt(I); break;
      case 'icep': icepAt(I); break;
      case 'box': boxAt(I); break;
      case 'board': { const y = gy(sp.x, sp.z), fx = Math.sin(sp.ry), fz = Math.cos(sp.ry), k = pickH(I.n + day) % 3;
        put(b, sp.x + sp.tx * 0.5, y, sp.z + sp.tz * 0.5, 0.04, 0.95, 0.04, 0x6b5a48, sp.ry); put(b + 1, sp.x - sp.tx * 0.5, y, sp.z - sp.tz * 0.5, 0.04, 0.95, 0.04, 0x6b5a48, sp.ry);
        put(b + 2, sp.x, y + 0.62, sp.z, 0.6, 0.62, 0.035, 0x8a6f52, sp.ry); put(b + 3, sp.x + fx * 0.012, y + 0.66, sp.z + fz * 0.012, 0.52, 0.52, 0.03, 0xd9cdb4, sp.ry);
        [[-0.2, 0xf6f2e8], [0.17, k === 0 ? 0xf3e6a0 : k === 1 ? 0xcfe3f2 : 0xf2d9d0]].forEach(([u, hx], j) => put(b + 4 + j, sp.x + sp.tx * u + fx * 0.03, y + 0.72, sp.z + sp.tz * u + fz * 0.03, 0.13, 0.3, 0.012, hx, sp.ry)); break; }   /* 기둥 둘 + 둥근 머리 판 + 코르크 + 안내문 둘(날마다 하나 색이 바뀜) */
      case 'mail': case '_mt': { const y = gy(sp.x, sp.z), up = I.id === '_mt' && !!sp.done, px = Math.cos(sp.ry) * 0.17, pz = -Math.sin(sp.ry) * 0.17;
        put(b, sp.x, y, sp.z, 0.035, 0.95, 0.035, 0x5f666d); put(b + 1, sp.x, y + 0.88, sp.z, 0.15, 0.24, 0.19, 0x2f6fb0, sp.ry, true);   /* 집 우편함 = 파랑(길가 빨간 우체통 HEAL-1과 헷갈리지 않게) */ put(b + 2, sp.x + px, y + (up ? 1.04 : 0.92), sp.z + pz, 0.012, up ? 0.17 : 0.07, 0.05, 0xf2c230, sp.ry, true); break; }
    } }
  function wormAt(I, x, z) { const sp = I.sp, b = I.sl, ry = sp.ry + 1.2, fx = Math.sin(ry), fz = Math.cos(ry), y = gy(x, z); for (let j = 0; j < 4; j++) { const w = Math.sin(I.t * 3 + j * 1.3) * 0.025, u = (j - 1.5) * 0.075; put(b + j, x + fx * u + fz * w, y + 0.012, z + fz * u - fx * w, 0.034, 0.03, 0.055, j === 1 ? 0xc06c64 : 0xd08078, ry + Math.cos(I.t * 3 + j) * 0.3); } }
  function snailAt(I) { const s = I.sp, b = I.sl, ph = I.t * 0.12, o = Math.sin(ph) * 0.25, x = s.x + s.ux * o, z = s.z + s.uz * o, y = gy(x, z), ry = Math.atan2(s.ux, s.uz) + (Math.cos(ph) < 0 ? Math.PI : 0), fx = Math.sin(ry), fz = Math.cos(ry), cx = x - fx * 0.02, cz = z - fz * 0.02, st = 0.05 + 0.05 * I.peek;
    put(b, x, y + 0.003, z, 0.035, 0.028, 0.12, 0xb8a58a, ry); put(b + 1, cx, y + 0.075, cz, 0.07, 0.07, 0.04, 0xa8743e, ry + Math.PI / 2, false, 0, Math.PI / 2); put(b + 2, cx, y + 0.075, cz, 0.07, 0.07, 0.04, 0x9a6634, ry + Math.PI / 2, false, 0, -Math.PI / 2);
    put(b + 3, cx + fz * 0.04, y + 0.08, cz - fx * 0.04, 0.03, 0.03, 0.012, 0x6e4a26, ry + Math.PI / 2, false, 0, Math.PI / 2); put(b + 4, x + fx * 0.1 + fz * 0.015, y + 0.02, z + fz * 0.1 - fx * 0.015, 0.008, st, 0.008, 0x9a8a70); put(b + 5, x + fx * 0.1 - fz * 0.015, y + 0.02, z + fz * 0.1 + fx * 0.015, 0.008, st, 0.008, 0x9a8a70); }
  function antAt(I) { const s = I.sp, b = I.sl, c = ST(), crumb = c.an === S().day + ':' + I.n, ax = s.x, az = s.z, bx = crumb ? s.cx ?? s.bx : s.bx, bz = crumb ? s.cz ?? s.bz : s.bz, dx = bx - ax, dz = bz - az, ry = Math.atan2(dx, dz), L = Math.hypot(dx, dz) || 1, px = -dz / L, pz = dx / L, y = gy(ax, az);
    for (let j = 0; j < 10; j++) { const u = (I.t * 0.1 + j / 10) % 1, w = Math.sin(u * 9.4 + j) * 0.04, back = j % 2 ? 1 - u : u; put(b + j, ax + dx * back + px * w, y + 0.006, az + dz * back + pz * w, 0.02, 0.018, 0.045, 0x2b211a, j % 2 ? ry + Math.PI : ry); }
    if (crumb && s.cx != null) put(b + 10, s.cx, gy(s.cx, s.cz) + 0.006, s.cz, 0.05, 0.025, 0.05, 0xd8a85a); else put(b + 10, 0); put(b + 11, ax, y + 0.003, az, 0.06, 0.008, 0.06, 0x3a2a1e); }
  function mothAt(I) { const s = I.sp, b = I.sl; for (let j = 0; j < 4; j++) { const a = I.t * 2.2 + j * 1.571, r = 0.35 + 0.08 * Math.sin(I.t * 3 + j); put(b + j, s.hx + Math.cos(a) * r, s.hy - 0.28 + 0.12 * Math.sin(I.t * 4 + j * 2), s.hz + Math.sin(a) * r, 0.06, 0.01, 0.04, 0xe8dcc0, -a); } }
  function iceAt(I) { const s = I.sp, b = I.sl; if (I.st !== 'run' && I.st !== 'melted') { for (let j = 0; j < 4; j++) put(b + j, 0); return; } const t = I.t, ks = Math.max(0, 1 - t / 18), kh = Math.max(0, 1 - t / 70);
    for (const [j, x, z, k] of [[0, s.sx, s.sz, ks], [1, s.hx, s.hz, kh]]) { const y = gy(x, z); if (k > 0.04) put(b + j, x, y + 0.004, z, 0.1 * k + 0.02, 0.14 * k + 0.01, 0.1 * k + 0.02, 0xe6f5fc, 0.5, true, 0.3); else put(b + j, 0); const w = 0.1 + 0.2 * (1 - k); put(b + 2 + j, x, y + 0.003, z, w, 0.004, w * 0.9, 0x86a2b8, 0.2, true); } }

  // 고양이(웅크린 몸 · 머리 위아래 반구 · 귀 둘 · 꼬리 · 눈 둘 — 밤엔 불빛을 되비춰 반짝) · peek = E 뒤 고개를 들어 이쪽을 봄
  function catAt(I) { const s = I.sp, b = I.sl, x = s.x, z = s.z, y = gy(x, z), col = s.col, me = map.player.pos(), look = I.d < 6 || I.peek > 0, ry = s.ry, hy = ry + (look ? Math.atan2(me.x - x, me.z - z) - ry : Math.sin(I.t * 0.4) * 0.4) * 0.7, fx = Math.sin(ry), fz = Math.cos(ry), hfx = Math.sin(hy), hfz = Math.cos(hy), px = fz, pz = -fx, hpx = hfz, hpz = -hfx, sw = Math.sin(I.t * (I.peek > 0 ? 4 : 1.6)), nt = NT;
    const hx = x + fx * 0.15, hz = z + fz * 0.15, hh = y + 0.17;
    put(b, x - fx * 0.04, y, z - fz * 0.04, 0.12, 0.16, 0.22, col, ry); put(b + 1, hx, hh, hz, 0.08, 0.075, 0.075, col, hy); put(b + 2, hx, hh, hz, 0.08, 0.055, 0.075, col, Math.PI - hy, false, 0, Math.PI);
    for (const k of [1, -1]) put(b + (k > 0 ? 3 : 4), hx + hpx * 0.045 * k, hh + 0.05, hz + hpz * 0.045 * k, 0.024, 0.05, 0.016, col, hy);
    put(b + 5, x - fx * 0.2 + px * 0.06 * sw, y + 0.012, z - fz * 0.2 + pz * 0.06 * sw, 0.022, 0.026, 0.15, col, ry + 1.3 + sw * 0.35);
    for (const k of [1, -1]) put(b + (k > 0 ? 6 : 7), hx + hfx * 0.068 + hpx * 0.028 * k, hh + 0.02, hz + hfz * 0.068 + hpz * 0.028 * k, 0.012, 0.012, 0.01, nt ? 0xc8e86a : 0x2a2a20, hy, false, nt ? 0.9 : 0); }
  // 풀벌레(풀 밑 작은 몸) · 개구리(몸 + 눈 둘 + 울 때 부푸는 울음주머니) — 소리는 tick에서(14m 안 · 가까울수록 크게 · 2m 안에 들면 뚝 그침)
  function singAt(I) { const s = I.sp, b = I.sl, y = gy(s.x, s.z), fx = Math.sin(s.ry), fz = Math.cos(s.ry);
    if (I.id === 'cricket') { put(b, s.x, y + 0.004, s.z, 0.016, 0.014, 0.04, 0x3a2a1e, s.ry); put(b + 1, s.x + fx * 0.05, y + 0.012, s.z + fz * 0.05, 0.004, 0.004, 0.05, 0x5a4632, s.ry + 0.3, true); return; }
    const pf = I.q > 0 ? 0 : Math.max(0, Math.sin(I.t * 5.5)); put(b, s.x, y, s.z, 0.055, 0.045, 0.07, 0x5f9a3a, s.ry);
    for (const k of [1, -1]) put(b + (k > 0 ? 1 : 2), s.x + fx * 0.04 + fz * 0.025 * k, y + 0.04, s.z + fz * 0.04 - fx * 0.025 * k, 0.014, 0.014, 0.014, 0x3f6a26, s.ry);
    if (pf > 0.05) put(b + 3, s.x + fx * 0.06, y + 0.018, s.z + fz * 0.06, 0.02 + 0.02 * pf, 0.02 + 0.018 * pf, 0.02 + 0.02 * pf, 0xe8e4c8, s.ry); else put(b + 3, 0); }
  function singTick(I, el) { if (I.q > 0) { I.q -= el; return; } if (I.d < 2) { if (I.ct >= 0) { I.ct = -1; I.q = 4; } return; } if (I.d > 14 || !map.tone || A.busy() || A.inb()) return; const v = 0.035 * (1 - I.d / 14) + 0.004;
    if ((I.ct = Math.max(0, I.ct) + el) < (I.id === 'cricket' ? 0.8 : 1.3)) return; I.ct = 0;
    if (I.id === 'cricket') for (let k = 0; k < 3; k++) map.tone(4200, k * 0.07, 0.04, 'sine', v); else for (let k = 0; k < 2; k++) map.tone(520, k * 0.16, 0.11, 'triangle', v * 1.4, -160); }
  // 낙숫물(처마 끝에서 떨어지는 물방울 셋 + 땅에 젖은 자국) · 땅에 닿을 때 작은 소리(가까울 때만)
  function dripAt(I, snd) { const s = I.sp, b = I.sl, g0 = gy(s.x, s.z), H = Math.max(1, s.top - g0), T0 = Math.sqrt(2 * H / 9.8), T = T0 + 0.25;
    for (let j = 0; j < 3; j++) { const u = (I.t + j * T / 3) % T, h = s.top - 4.9 * u * u, ox = (j - 1) * 0.35, x = s.x + Math.cos(s.ry) * ox, z = s.z - Math.sin(s.ry) * ox; if (h > g0) put(b + j, x, h, z, 0.022, 0.05, 0.022, 0x9cc4dc, 0, false, 0.35); else { put(b + j, 0); if (snd && I.d < 7 && map.tone && u - T0 < 0.1) map.tone(1400 + j * 160, 0, 0.05, 'sine', 0.02); } }
    put(b + 3, s.x, g0 + 0.004, s.z, 0.55, 0.004, 0.16, 0x6f8fa4, s.ry + Math.PI / 2, true); }
  // 웅덩이 살얼음(바닥 네모 둘 · 조금 빛남) → 밟으면 금 두 줄(오늘)
  function icepAt(I) { const s = I.sp, b = I.sl, y = gy(s.x, s.z); put(b, s.x, y + 0.006, s.z, 0.42, 0.01, 0.3, 0xcfe3ec, s.ry, true, 0.25); put(b + 1, s.x + 0.05, y + 0.008, s.z - 0.03, 0.28, 0.01, 0.18, 0xeaf5fa, s.ry + 0.3, true, 0.35);
    if (I.st === 'crack') { put(b + 2, s.x, y + 0.01, s.z, 0.014, 0.01, 0.26, 0x6f8a9a, s.ry + 0.6, true); put(b + 3, s.x + 0.06, y + 0.01, s.z + 0.04, 0.012, 0.01, 0.17, 0x6f8a9a, s.ry - 0.5, true); } else { put(b + 2, 0); put(b + 3, 0); } }
  // 빈 상자 셋(아무렇게나 쌓임) → 접어 묶은 한 묶음(오늘)
  function boxAt(I) { const s = I.sp, b = I.sl, y = gy(s.x, s.z), ux = Math.sin(s.ry), uz = Math.cos(s.ry), px = uz, pz = -ux, k = I.st === 'fold' ? Math.min(1, I.mt / 1.4) : I.st === 'done' ? 1 : 0;
    [[-0.45, 0.15, 0.3, 0.24, 0.5], [0.4, -0.1, 0.34, 0.26, -0.7], [0.05, 0.35, 0.28, 0.22, 1.3]].forEach(([u, v, a, c9, r], j) => { const ex = s.x + (px * u + ux * v) * (1 - k), ez = s.z + (pz * u + uz * v) * (1 - k); put(b + j, ex, y + 0.012 + 0.035 * j * k, ez, a + (0.32 - a) * k, 0.01, c9 + (0.24 - c9) * k, j === 1 ? 0xb88a58 : 0xc8a070, s.ry + r * (1 - k), true); });
    if (k >= 1) put(b + 3, s.x, y + 0.02, s.z, 0.025, 0.1, 0.27, 0xf2efe6, s.ry); else put(b + 3, 0); }   /* 바닥에 흩어진 납작 상자 셋 → 한자리에 포개짐(1.4초) → 흰 끈 */

  // ───────── 해 · 그림자(가로등 기둥 6.2m · 방위 0 = 북 = −z · 해는 아침 동 → 한낮 남 → 저녁 서) ─────────
  function sunNow() { const h = A.min() / 60; if (h < 6.6 || h > 17.8) return null; const az = (90 + (h - 6) * 15) * Math.PI / 180, mx = [53, 76, 53, 30][Math.max(0, SEAS.indexOf(A.season()))], el = Math.max(8, mx * Math.sin(Math.PI * (h - 6) / 12)) * Math.PI / 180;
    return { dx: -Math.sin(az), dz: Math.cos(az), len: Math.min(18, 6.2 / Math.tan(el)), h }; }
  function shadowMesh() { if (SHM || !A.T3) return SHM; const T3 = A.T3, cv = document.createElement('canvas'); cv.width = 32; cv.height = 128; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(0.8, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(6, 0, 20, 128);
    const tex = new T3.CanvasTexture(cv), geo = new T3.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5), mat = new T3.MeshBasicMaterial({ map: tex, color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false, fog: true }), m = new T3.InstancedMesh(geo, mat, 6);
    m.frustumCulled = false; m.matrixAutoUpdate = false; m.count = 0; m.visible = false; m.renderOrder = 2; m.userData.fx = 1; const root = A.root && A.root(); if (root) root.add(m); SHM = { m, geo, mat, tex }; return SHM; }
  function shadowSec() { const L9 = []; for (const I of INST.values()) if (I.id === 'shadow' && I.d < 70) L9.push(I); const sun = L9.length && !cond().rain && !A.inb() ? sunNow() : null; if (!sun) { if (SHM && SHM.m.visible) SHM.m.visible = false; return; }
    const M = shadowMesh(); if (!M) return; let k = 0; const me = map.player.pos();
    for (const I of L9) for (const l of CEL[I.n].lm) { if (k >= 6) break; if (Math.hypot(l.x - me.x, l.z - me.z) > 55) continue; M4.compose(V4.set(l.x, (l.y ?? gy(l.x, l.z)) + 0.035, l.z), Q4.setFromEuler(E4.set(0, Math.atan2(sun.dx, sun.dz), 0)), S4.set(0.32, 1, sun.len)); M.m.setMatrixAt(k++, M4); }
    M.m.count = k; M.m.visible = k > 0; if (k) M.m.instanceMatrix.needsUpdate = true; }

  // ───────── 해 보기(E) ─────────
  function reward(id, k) { const c = ST(), n0 = c.n[id] || 0; c.n[id] = n0 + 1; A.GAME.mark(); A.skUp(k || 'look', n0 ? 1 : 2, 'kit:' + id); }
  const act = (k, at) => { try { map.player.act(k, at ? { at, msg: null } : { msg: null }); } catch (e) { /* 몸짓 없음 */ } };
  function use(I) { if (A.busy() || A.inb()) return; const c = ST(), day = S().day, sp = I.sp, e = tx;
    switch (I.id) {
      case 'bud': act('look'); toast(e(TX.bud.done), 4.5); reward('bud'); hotOff(I); break;
      case 'worm': if (I.st !== 'out') return; act('reach', [sp.x, gy(sp.x, sp.z), sp.z]); I.st = 'moving'; I.mt = 0; hotOff(I); break;
      case 'snail': act('shoes', [sp.x, gy(sp.x, sp.z), sp.z]); I.peek = 1; toast(e(TX.snail.done), 4.5); reward('snail'); hotOff(I); break;
      case 'ant': { const bread = A.has('🍞') && c.an !== day + ':' + I.n; act('shoes', [I.ex, gy(I.ex, I.ez), I.ez]);
        if (bread) { const mx = sp.x + (sp.bx - sp.x) * 0.6, mz = sp.z + (sp.bz - sp.z) * 0.6; let C9 = null; for (const k of [0.7, -0.7, 0.45, -0.45]) { const x = mx + sp.px * k, z = mz + sp.pz * k; if (stand(x, z)) { C9 = [x, z]; break; } } if (C9) { sp.cx = C9[0]; sp.cz = C9[1]; c.an = day + ':' + I.n; A.GAME.mark(); } toast(e(C9 ? TX.ant.done2 : TX.ant.done), 4.5); }
        else toast(e(TX.ant.done), 4.5); reward('ant'); hotOff(I); break; }
      case 'moth': act('look'); toast(e(TX.moth.done), 4.5); reward('moth'); hotOff(I); break;
      case 'ice': if (I.st !== 'idle') return; act('reach', [sp.hx, gy(sp.hx, sp.hz), sp.hz]); I.st = 'run'; I.t = 0; I.told = false; toast(e(TX.ice.go), 4); hotOff(I); break;
      case 'seed': { const ch = CH(); if (!ch || !ch.blowAt) return; const y = gy(sp.x, sp.z); try { map.player.act('shoes', { at: [sp.x, y, sp.z] }); } catch (e9) { /* 몸짓 없음 */ } ch.blowAt(sp.x, y, sp.z); c.sd[I.n] = day; A.GAME.mark(); I.st = 'blown'; I.dr = false; reward('seed'); hotOff(I); break; }
      case 'recycle': recycleOpen(I); break;
      case 'shadow': shadowMark(I); break;
      case 'wind': { const ch = A.chem && A.chem(), W = ch && ch.wind ? ch.wind(day) : null; if (!W) return; act('look'); const to = (W.k % 8 + 8) % 8, fr = (to + 4) % 8;
        toast(en() ? 'The steam drifts ' + DIR8E[to] + '. The wind comes from the opposite side, the ' + DIR8E[fr] + ' — so we call it a ' + DIR8E[fr] + ' wind.' : '김이 ' + DIR8K[to] + '쪽으로 흘러가요. 바람은 반대쪽인 ' + DIR8K[fr] + '쪽에서 불어와요 — 그래서 ' + DIR8K[fr] + '풍이라고 불러요.', 5); reward('wind', 'explore'); break; }
      case 'echo': { act('sing'); const tone = map.tone ? (...a) => map.tone(...a) : null; if (tone) for (const [t0, v] of [[0, 0.22], [0.75, 0.1], [1.5, 0.05], [2.25, 0.025]]) { tone(660, t0, 0.18, 'triangle', v, 40); tone(880, t0 + 0.2, 0.3, 'triangle', v, 120); }
        setTimeout(() => { if (on) toast(e(TX.echo.done), 4.5); }, 2600); reward('echo', 'explore'); break; }
      case 'mail': mailTake(I); break;
      case '_mt': mailGive(I); break;
      case 'cricket': case 'frog': act('shoes', [sp.x, gy(sp.x, sp.z), sp.z]); I.q = 4; toast(e(TX[I.id].done), 5); reward(I.id); hotOff(I); break;
      case 'cat': act('shoes', [sp.x, gy(sp.x, sp.z), sp.z]); I.peek = 4; toast(e(cond().night ? TX.cat.done : TX.cat.done2), 5); reward('cat'); hotOff(I); break;
      case 'smoth': act('look'); toast(e(TX.smoth.done), 4.5); reward('smoth'); hotOff(I); break;
      case 'drip': act('look'); toast(e(TX.drip.done), 4.5); reward('drip', 'explore'); hotOff(I); break;
      case 'icep': { const c9 = ST(); act('shoes', [sp.x, gy(sp.x, sp.z), sp.z]); if (I.st !== 'crack') { I.st = 'crack'; c9.ip[I.n] = day; A.GAME.mark(); I.dr = false; if (map.tone) for (let k = 0; k < 3; k++) map.tone(240 - k * 30, 0.05 + k * 0.06, 0.05, 'square', 0.025); } toast(e(TX.icep.done), 5); reward('icep', 'explore'); hotOff(I); break; }
      case 'box': if (I.st !== 'pile') return; act('reach', [sp.x, gy(sp.x, sp.z) + 0.2, sp.z]); I.st = 'fold'; I.mt = 0; hotOff(I); break;
      case 'board': { act('look'); const k = cond().s === 3 ? 3 : pickH(I.n + day) % 3; toast(e(TX.board.done[k]), 5); reward('board', 'explore'); hotOff(I); break; }
    } }
  // 지렁이: 손에 올려 흙으로(1.6초 · 순간이동 X — 꿈틀대며 옮겨짐) → 흙 둔덕(오늘) → 다음 날부터 닷새 꽃 한 송이(_m)
  function wormDone(I) { const c = ST(), sp = I.sp; c.wm[I.n] = { d: S().day, x: +sp.tx.toFixed(2), z: +sp.tz.toFixed(2) }; A.GAME.mark(); I.st = 'saved'; for (let j = 0; j < 4; j++) put(I.sl + j, 0); toast(tx(TX.worm.done), 4.5); reward('worm'); }
  // 그림자: 지금 그림자 끝(해 반대쪽 · 기둥 6.2m)에 분필 점 · 90분 넘게 지나 또 찍으면 견줌
  function shadowMark(I) { const sun = sunNow(); if (!sun || cond().rain) { toast(en() ? 'No clear shadow right now — try on a sunny day' : '지금은 그림자가 또렷하지 않아요 — 맑은 낮에 해 봐요', 3); return; } const l = I.sp, x = l.x + sun.dx * sun.len, z = l.z + sun.dz * sun.len, c = ST(), day = S().day, h = Math.round(A.min() / 60);
    if (!c.sh || c.sh.d !== day || c.sh.n !== I.n) c.sh = { d: day, n: I.n, m: [] }; const M = c.sh.m, last = M[M.length - 1];
    if (last && A.min() - last[0] < 90) { toast(en() ? 'You marked it ' + Math.round((A.min() - last[0]) / 60 * 10) / 10 + ' h ago. Come back a bit later and compare' : '조금 전에 표시했어요. 시간이 더 지난 뒤 다시 와서 견주어 봐요', 3.4); return; }
    act('write', [x, gy(x, z), z]); M.push([A.min(), +x.toFixed(2), +z.toFixed(2), +sun.len.toFixed(1)]); if (M.length > 3) M.shift(); A.GAME.mark(); I.dr = false; const dk = ((Math.round(Math.atan2(sun.dx, -sun.dz) / (Math.PI / 4)) % 8) + 8) % 8;
    if (M.length === 1) { toast(en() ? 'Marked the shadow tip at ' + h + ':00 — it points ' + DIR8E[dk] + '. Come back later and compare.' : h + '시 그림자 끝에 표시했어요 — 그림자가 ' + DIR8K[dk] + '쪽으로 뻗어요. 시간이 지난 뒤 다시 와서 견주어 봐요.', 4.5); reward('shadow', 'explore'); return; }
    const a = M[M.length - 2], h0 = Math.round(a[0] / 60), longer = sun.len > a[3] + 0.3, shorter = sun.len < a[3] - 0.3;
    toast(en() ? 'At ' + h0 + ':00 and ' + h + ':00 the shadow moved and got ' + (longer ? 'longer' : shorter ? 'shorter' : 'about the same') + '. A shadow is always on the side opposite the sun, and it is shortest around noon when the sun is highest.' : h0 + '시와 ' + h + '시 사이에 그림자가 옮겨 가고 ' + (longer ? '더 길어졌어요' : shorter ? '더 짧아졌어요' : '길이는 비슷해요') + '. 그림자는 늘 해 반대쪽에 생기고, 해가 가장 높은 한낮에 가장 짧아요.', 6); reward('shadow', 'explore'); }
  // 우편함: 이웃집 편지 → 이웃 칸 파란 우편함(그 칸에만 그림 · 빨간 우체통 = 엽서 HEAL-1과 다름) · 넣으면 깃발이 올라가 저녁까지
  function mailTake(I) { const c = ST(), day = S().day; if (c.ml0 && c.ml0.d === day && !c.ml0.done) { toast(en() ? 'You are already carrying a letter for ' + c.ml0.to : '이미 ' + c.ml0.to + ' 칸으로 갈 편지를 들고 있어요', 3); return; }
    const C9 = CEL[I.n], L9 = []; for (let a = C9.r - 1; a <= C9.r + 1; a++) for (let b = C9.c - 1; b <= C9.c + 1; b++) { const N9 = BYRC[a + ',' + b]; if (!N9 || N9 === C9 || !N9.s || N9.s.school) continue; for (const B9 of N9.bl) if (/house|apt|shop|office/.test(B9.kind || '') || B9.name) L9.push([N9.n, B9]); }
    L9.sort((p, q) => pickH(I.n + day + p[0] + p[1].cx) - pickH(I.n + day + q[0] + q[1].cx)); let tgt = null; for (const [n2, B9] of L9) { const m = mailAt(B9); if (m) { tgt = { ...m, to: n2 }; break; } }
    act('reach', [I.sp.x, gy(I.sp.x, I.sp.z) + 0.9, I.sp.z]); hotOff(I);
    if (!tgt) { toast(en() ? 'Nothing in the mailbox today' : '오늘은 우편함이 비어 있어요', 2.5); return; }
    c.ml0 = { d: day, from: I.n, to: tgt.to, x: +tgt.x.toFixed(2), z: +tgt.z.toFixed(2), ry: +tgt.ry.toFixed(3), sx: +tgt.sx.toFixed(2), sz: +tgt.sz.toFixed(2), done: 0 }; A.GAME.mark();
    toast(en() ? 'A neighbour’s letter was put in here by mistake. The envelope says “' + tgt.to + '”. Find the blue mailbox in that square and post it.' : '이웃집 편지가 잘못 들어 있어요. 봉투에 「' + tgt.to + '」 칸이라고 적혀 있어요 — 그 칸의 파란 우편함에 넣어 줘요.', 6);
    if (!A.routeBusy() && A.guide) A.guide([tgt.sx, tgt.sz], tgt.to + (en() ? ' mailbox' : ' 우편함')); }
  function mailGive(I) { const c = ST(); if (!c.ml0 || c.ml0.done) return; c.ml0.done = 1; A.GAME.mark(); act('reach', [I.sp.x, gy(I.sp.x, I.sp.z) + 0.9, I.sp.z]); hotOff(I); I.dr = false;
    toast(en() ? 'You posted the letter in the right box and raised the flag. Reading the address helps you find the house.' : '편지를 제자리에 넣고 깃발을 올렸어요. 주소(칸 이름)를 읽으면 집을 찾을 수 있어요.', 4.5); reward('mail', 'explore'); }
  // 분리수거 창: 물건 다섯을 종류대로(누르고 → 통) · 틀리면 '무엇으로 만들었나' 한 줄(답 X)
  function recycleOpen(I) { if (I.st !== 'pile') return; const e = en(), day = S().day, L9 = RC_ITEMS.slice().sort((p, q) => pickH(I.n + day + p[0][0]) - pickH(I.n + day + q[0][0])).slice(0, 5); let sel = -1; const left = new Set(L9.map((_, i) => i));
    const P = A.openP('<h3>♻ ' + (e ? 'Sorting recycling' : '분리수거') + '</h3><div class="sm">' + (e ? 'Task: put each thing in the right bin. Tap a thing, then tap its bin.' : '할 일: 물건을 종류대로 통에 넣어요. 물건을 누르고, 넣을 통을 눌러요.') + '</div>'
      + '<div class="row" data-it style="flex-wrap:wrap;justify-content:flex-start">' + L9.map((q, i) => '<button class="sub" data-i="' + i + '">' + A.esc(tx(q[0])) + '</button>').join('') + '</div>'
      + '<div class="row" data-bn style="flex-wrap:wrap">' + RC_BINS.map((q, j) => '<button data-b="' + j + '" style="background:' + q[1] + ';min-width:96px">' + A.esc(tx(q[0])) + '</button>').join('') + '</div>'
      + '<div class="sm" data-m style="min-height:1.4em"></div><div class="row"><button class="sub" data-a="x">' + (e ? 'Close' : '닫기') + '</button></div>', false, 'ck');
    if (!P) return; const msg = t => { const m = P.querySelector('[data-m]'); if (m) m.textContent = t; };
    P.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') { A.closeP(); return; }
      if (b.dataset.i != null) { sel = +b.dataset.i; for (const q of P.querySelectorAll('[data-i]')) q.style.outline = +q.dataset.i === sel ? '3px solid #1d2b3a' : ''; return; }
      if (b.dataset.b != null) { if (sel < 0) { msg(e ? 'First tap a thing to sort' : '먼저 넣을 물건을 눌러요'); return; } const it = L9[sel]; if (+b.dataset.b !== it[1]) { msg(e ? 'Not this bin — what is it made of?' : '이 통이 아니에요 — 무엇으로 만들었는지 살펴봐요'); map.sfx && map.sfx('tick'); return; }
        left.delete(sel); const bt = P.querySelector('[data-i="' + sel + '"]'); if (bt) bt.remove(); sel = -1; msg(tx(it[2])); map.sfx && map.sfx('ding');
        if (!left.size) { const c = ST(); c.rc[I.n] = day; A.GAME.mark(); I.st = 'done'; I.dr = false; hotOff(I); setTimeout(() => { A.closeP(); if (on) toast(tx(TX.recycle.done), 4.5); }, 900); reward('recycle', 'work'); } } }; }

  // ───────── 0.5초 칸(마을이 부름) ─────────
  const DROP = [];
  function sec() { if (!on) return; const t0 = performance.now(), c9 = CH(), day = S().day, E9 = cond(); NT = !!E9.night; SUNY = !E9.rain && !!sunNow(); if (c9 && c9.kitGen() !== gen) { gen = c9.kitGen(); for (const I of INST.values()) I.dr = false; }
    WANT.clear(); const me = map.player.pos();
    if (!off && A.on() && !A.inb()) { const C0 = CEL[A.cell(me.x, me.z)], c = ST(); if (C0) for (let a = C0.r - 1; a <= C0.r + 1; a++) for (let b = C0.c - 1; b <= C0.c + 1; b++) { const C9 = BYRC[a + ',' + b]; if (!C9 || !C9.s || C9.s.school) continue; full(C9);
      for (const id of today(C9.n)) if (NS[id] != null && C9.sp[id]) WANT.add(C9.n + ':' + id); const wm = c.wm[C9.n]; if (wm && day >= wm.d && day <= wm.d + 5) WANT.add(C9.n + ':_m'); if (c.ml0 && c.ml0.d === day && c.ml0.to === C9.n) WANT.add(C9.n + ':_mt'); } }
    DROP.length = 0; for (const I of INST.values()) if (!WANT.has(I.k)) DROP.push(I); for (const I of DROP) drop(I);
    for (const k of WANT) if (!INST.has(k)) { const i = k.indexOf(':'); make(k, k.slice(0, i), k.slice(i + 1)); }
    let fl = false; const busy = A.busy(), W = I9 => I9.id === 'wind' && I9.d < 90 && c9 && c9.kitEmit;
    for (const I of INST.values()) { I.d = Math.hypot(I.ex - me.x, I.ez - me.z);
      if (!I.dr && c9) { if (I.ns && I.sl < 0) I.sl = alloc(I.ns); if (I.sl !== -2) { drawI(I); fl = true; } else hotOff(I); I.dr = true; }   /* 칸이 모자라면(드묾) 그림 없는 E를 남기지 않음 */
      if (I.h && TX[I.id] && TX[I.id].hint && I.d < 9 && !busy) { const c = ST(); if (c.hint[I.id] !== day) { c.hint[I.id] = day; A.say(tx(TX[I.id].hint), 3); } }
      if (W(I) && (steamQ = (steamQ + 1) % 2) === 0) { const ch = A.chem && A.chem(), Wd = ch && ch.wind ? ch.wind(day) : { x: 0.7, z: 0.7 }, s = I.sp; c9.kitEmit(0, s.sx + (Math.random() - 0.5) * 1.5, s.sy, s.sz + (Math.random() - 0.5) * 1.5, Wd.x * 1.3, 0.7, Wd.z * 1.3, 4, 1.3, 0.6); } }
    if (fl) c9.kitFlush(); shadowSec(); if (QUE.length) fillSome(1.5);
    const ms = performance.now() - t0; secMs = ms; if (ms > secMax) secMax = ms; }
  // ───────── 0.1초 거름(마을 tick) — 가까운 움직이는 것만 ─────────
  let q = 0;
  function tick(dt) { if (!on || !INST.size) return; if ((q += dt) < 0.1) return; const el = q; q = 0; let fl = false; const c9 = CH(); if (!c9) return;
    for (const I of INST.values()) { if (I.d > 32 || I.sl < 0 && I.ns) continue; I.t += el;
      switch (I.id) {
        case 'worm': if (I.st === 'out') { wormAt(I, I.sp.x, I.sp.z); fl = true; } else if (I.st === 'moving') { I.mt += el; const u = Math.min(1, I.mt / 1.6), sp = I.sp; wormAt(I, sp.x + (sp.tx - sp.x) * u, sp.z + (sp.tz - sp.z) * u); fl = true; if (u >= 1) wormDone(I); } break;
        case 'snail': if (I.peek > 0) I.peek = Math.max(0, I.peek - el / 3); snailAt(I); fl = true; break;
        case 'ant': if (I.d < 20) { antAt(I); fl = true; } break;
        case 'moth': mothAt(I); fl = true; break;
        case 'ice': if (I.st === 'run' || I.st === 'melted') { iceAt(I); fl = true; if (I.st === 'run' && I.t >= 24) { I.st = 'melted'; ST().ic[I.n] = S().day; A.GAME.mark(); if (I.d < 40) toast(tx(TX.ice.done), 5.5); reward('ice'); } } break;
        case 'cross': if (I.d < 10) crossTick(I, el); break;
        case 'cat': if (I.peek > 0) I.peek = Math.max(0, I.peek - el); catAt(I); fl = true; break;
        case 'cricket': singTick(I, el); break;
        case 'frog': singTick(I, el); singAt(I); fl = true; break;
        case 'smoth': mothAt(I); fl = true; break;
        case 'drip': dripAt(I, true); fl = true; break;
        case 'box': if (I.st === 'fold') { I.mt += el; boxAt(I); fl = true; if (I.mt >= 1.4) { I.st = 'done'; ST().bx[I.n] = S().day; A.GAME.mark(); boxAt(I); toast(tx(TX.box.done), 5); reward('box', 'work'); } } break;
      } }
    if (fl) c9.kitFlush(); }
  // 횡단보도: 빨간불에 연석 곁(2.6m)에서 기다렸다가 초록불이 켜지면 = 보행 신호 소리 + 한 줄(하루 처음 솜씨) · 빨간불에 차도로 들어서면 한 번 알림
  function crossTick(I, el) { const sp = I.sp, s9 = sp.s9, me = map.player.pos(), st = A.sigSt(s9, 1), near = Math.hypot(me.x - sp.x, me.z - sp.z) < 2.6, day = S().day, c = ST();
    const dx = me.x - s9.x, dz = me.z - s9.z, t0 = s9.t[0], ga = Math.abs(dx * -t0[1] + dz * t0[0]), gb = Math.abs(dx * t0[0] + dz * t0[1]), road = (ga < s9.hw[0] - 1.2 && gb < 30) || (gb < s9.hw[1] - 1.2 && ga < 30);   /* 이 신호의 두 길 차도 안(배열 훑기 X) */
    if (near && st === 2 && !road) I.wait += el; else if (st !== 0 && !near) I.wait = 0;
    if (st === 0 && I.prev !== 0 && I.wait > 1.5) { I.wait = 0; if (map.tone) for (let k = 0; k < 3; k++) { map.tone(1047, k * 0.42, 0.12, 'sine', 0.06); map.tone(1319, k * 0.42 + 0.14, 0.12, 'sine', 0.06); } toast(tx(TX.cross.ok), 3.6); if (c.n.crossD !== day) { c.n.crossD = day; reward('cross', 'explore'); } }
    if (st === 2 && road && Math.hypot(me.x - sp.x, me.z - sp.z) < 9 && c.n.redD !== day) { c.n.redD = day; A.GAME.mark(); toast(tx(TX.cross.red), 2.6); }
    I.prev = st; }

  // ───────── 다른 엔진에 넘기는 자리 · 시험 ─────────
  function clear() { clearInst(); on = false; }
  function dispose() { clear(); if (SHM) { if (SHM.m.parent) SHM.m.parent.remove(SHM.m); SHM.m.dispose(); SHM.geo.dispose(); SHM.mat.dispose(); SHM.tex.dispose(); SHM = null; } }
  const bugSpots = () => { const o = []; for (const C9 of Object.values(CEL)) { const t = C9.sp.tree, f = C9.sp.flower, d = C9.sp.dfly; if (t) o.push({ hab: 'tree', x: t.bx, z: t.bz, yo: 1.5, kc: C9.n, kl: 'tree' }); if (f) o.push({ hab: 'flower', x: f.x, z: f.z, yo: 0.9, kc: C9.n, kl: 'flower' }); if (d) o.push({ hab: 'open', x: d.x, z: d.z, yo: 0, kc: C9.n, kl: 'dfly' }); } return o; };
  const birdSpots = () => { const o = []; for (const C9 of Object.values(CEL)) { const b = C9.sp.birds; if (b) for (const [x, z] of b.pts) o.push({ x, z, kc: C9.n, kl: 'birds' }); } return o; };
  const pdCells = () => { const o = new Set(); for (const C9 of Object.values(CEL)) if (C9.sp.puddle) o.add(C9.n); return o; };
  function audit() { allFull(); const out = { cells: 0, low: [], nlow: [], sea: [], lines: {}, spots: 0, bad: [], day: {}, night: {} }, d0 = S().day;
    for (const C9 of Object.values(CEL)) { if (!C9.s || C9.s.school) continue; out.cells++; let mn = 99, nm = 99; for (const E0 of CONDS) { const E = { ...E0, day: d0 }, t = C9.have.filter(q9 => q9.on(E)).length + choose(C9.s, E, id => C9.can.has(id), C9.have).length; if (E.night) nm = Math.min(nm, t); else mn = Math.min(mn, t); }
      out.day[C9.n] = mn; out.night[C9.n] = nm; const seaish = C9.s.sea >= 50 || ['모래사장', '갯벌', '바다'].includes(C9.s.g); if (mn < 3 || nm < 2) (seaish ? out.sea : mn < 3 ? out.low : out.nlow).push(C9.n + ':' + mn + '/' + nm);
      for (const id of C9.can) { out.lines[id] = (out.lines[id] || 0) + 1; out.spots++; if (NS[id] == null) continue; const p = ePos(id, C9.sp[id]); if (p && (!A.walk(p[0], p[1]) || (map.q.blocked || map.q.blockedAt)(p[0], p[1], gy(p[0], p[1]) + 0.6))) out.bad.push(C9.n + ':' + id); } }
    return out; }
  const api = { get on() { return on && !off; }, isOn: (n, id) => isOn(n, id), today: n => { const C9 = CEL[n]; if (C9) full(C9); return today(n).slice(); }, cond: () => cond(),
    info: () => ({ on, off, buildMs, left: QUE.length, secMs: +secMs.toFixed(3), secMax: +secMax.toFixed(3), cells: Object.keys(CEL).length, slots: SLOT.reduce((a, b) => a + b, 0), shadow: SHM ? SHM.m.count : 0, inst: [...INST.values()].map(I => ({ k: I.k, st: I.st, d: +I.d.toFixed(1), sl: I.sl, hot: !!I.h, ex: +I.ex.toFixed(1), ez: +I.ez.toFixed(1) })) }),
    can: () => { allFull(); const o = {}; for (const C9 of Object.values(CEL)) if (C9.can.size) o[C9.n] = [...C9.can]; return o; }, spot: (n, id) => CEL[n] && (full(CEL[n]), CEL[n].sp[id]) ? { ...CEL[n].sp[id], e: ePos(id, CEL[n].sp[id]) } : null,
    box: n => CEL[n] && CEL[n].box.slice(), audit, off: v => { off = !!v; tkey = ''; TODAY.clear(); if (off) clearInst(); sec(); return off; },
    force: E => { forced = E ? { s: E.s | 0, rain: !!E.rain, night: !!E.night, day: E.day ?? S().day } : null; tkey = ''; TODAY.clear(); sec(); return cond(); },
    use: k => { const I = INST.get(k); if (I) use(I); return !!I; }, sec: () => sec(), tick: dt => tick(dt), sun: () => sunNow(), st: () => ST() };
  return { init, sec, tick, dispose, isOn, bugSpots, birdSpots, pdCells, api };
}
