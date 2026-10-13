// 🏘 마을 세계(TOWN-1 · 10-12 교사 설계안 · 인터뷰) — 자료 한 장(v2/towns/<id>.js)을 넣으면 학교 정문 밖에 마을이 선다
//   하나의 세계: 우리 학교 → 정문 → 우리 마을(아이들이 매트로 설계) → 자연환경(마을이 서는 땅). 마을 내용은 아이들 것 — Claude는 사진을 자료로 옮길 뿐(빈칸은 'AI가 채운 빈칸'으로 드러냄)
//   주소 ?town=<id>(main.js) · registry dev(메뉴에 없음) · 홍보판(SM_PROMO)엔 열리지 않음 · 다른 놀이의 경계·길격자·성능은 그대로(이 놀이가 켤 때만 학교 밖이 바뀜 — map.world.outside)
//   자료 형식 정본 = docs/systems/town.md · 좌표 = 매트 cm(왼쪽 위 0,0 · 위 = 북 · 1:500 = 1cm 5m) · 판(layers) = 오늘·개발 전·옛날… 같은 땅의 여러 모습
//   그리기: 땅(5m 격자 · 부드러운 음영 · 높낮이·물가 색) · 물(흐르는 강 띠 · 연못 · 다리) · 길(인도·차선·건널목) · 나무 4종(바람에 흔들림) · 논·밭·과수원·공원 · 건물(🧱 매트 모습 ↔ 🏘 마을 모습)
//   — 150m 구역마다 메시 둘(땅 · 나머지)로 묶음(멀리 구역은 절두체·안개로 빠짐) · 새 조명 없음
export const meta = { id: 'town', title: '마을 세계', api: 1 };

// 매트 색(블록 색 이름 → 색) · 색 규칙(교사 10-12): 빨강·주황 = 사는 곳 · 노랑 = 일하는 곳 · 파랑(남색) = 모두가 쓰는 곳 · 흰색 = 병원 · 초록 = 자연
const COL = { mred: 0xa9665a, mbrown: 0x8c6a55, mslate: 0x6f7d8a, mor: 0xb98a62, mtan: 0xc2a77c, msand: 0xb7ab92, red: 0xd9473b, orange: 0xef8b33, yellow: 0xf2c230, green: 0x4f9e4a, navy: 0x2f4a8a, blue: 0x3d74c9, white: 0xf2f1ea, black: 0x3a3a3a, brown: 0x8a5a36, pink: 0xf08fb2, purple: 0x8a5bd1, gray: 0x9a9fa5, sky: 0x8fd0f0 };
const KIND_OF_COLOR = { mred: 'house', mbrown: 'house', mslate: 'house', mor: 'house', mtan: 'shop', msand: 'shop', red: 'house', orange: 'house', pink: 'house', yellow: 'shop', navy: 'public', blue: 'public', purple: 'public', white: 'hospital', green: 'green', brown: 'house', gray: 'public', black: 'public' };
const NAMEKIND = [[/소방/, 'fire'], [/경찰|파출소|지구대/, 'police'], [/병원|보건|의원|약국/, 'hospital'], [/학교|초등|중학|고등|유치원/, 'school'], [/공장/, 'factory'], [/아파트|빌라/, 'apt'],
  [/도서관/, 'library'], [/우체국/, 'post'], [/공원|놀이터|쉼터/, 'park'], [/마트|가게|시장|상점|빵|편의점|슈퍼|카페|식당|문구|꽃집|가판/, 'shop'], [/회사|사무실|은행/, 'office'], [/시청|구청|주민|복지|센터|체육관|박물관|교회|성당|절/, 'public']];
// 종류마다: 이름(ko·en) · 지도 기호 · 범례 묶음
const KIND = {
  house: { ko: '집', en: 'House', sym: '⌂', emo: '🏠', g: 'live' }, apt: { ko: '아파트', en: 'Apartment', sym: '▥', emo: '🏢', g: 'live' },
  shop: { ko: '가게', en: 'Shop', sym: '◆', emo: '🏪', g: 'work' }, office: { ko: '회사', en: 'Office', sym: '▤', emo: '🏢', g: 'work' }, factory: { ko: '공장', en: 'Factory', sym: '⚙', emo: '🏭', g: 'work' },
  public: { ko: '공공 기관', en: 'Public Building', sym: '◉', emo: '🏛', g: 'pub' }, library: { ko: '도서관', en: 'Library', sym: '📖', emo: '📚', g: 'pub' }, post: { ko: '우체국', en: 'Post Office', sym: '✉', emo: '📮', g: 'pub' },
  fire: { ko: '소방서', en: 'Fire Station', sym: '🚒', emo: '🚒', g: 'pub' }, police: { ko: '경찰서', en: 'Police Station', sym: '🚓', emo: '🚓', g: 'pub' }, hospital: { ko: '병원', en: 'Hospital', sym: '✚', emo: '🏥', g: 'pub' }, school: { ko: '학교', en: 'School', sym: '文', emo: '🏫', g: 'pub' },
  park: { ko: '공원', en: 'Park', sym: '♣', emo: '🌳', g: 'nat' }, green: { ko: '자연', en: 'Nature', sym: '♣', emo: '🌳', g: 'nat' },
};
const NATK = { hill: { ko: '산', en: 'Hill' }, water: { ko: '물', en: 'Water' }, forest: { ko: '숲', en: 'Forest' }, rice: { ko: '논', en: 'Rice Field' }, farm: { ko: '밭', en: 'Farm' }, orchard: { ko: '과수원', en: 'Orchard' }, grass: { ko: '풀밭', en: 'Meadow' }, park: { ko: '공원', en: 'Park' }, sand: { ko: '모래밭', en: 'Sand' } };
// 종이 소품 종류(PROPS-1 · 교사 10-13 인쇄지) · 빈 카드에 아이가 쓴 이름 → 종류 · 칸 이름표 꾸밈 낱말(AREA-1)
const PROPK = {
  streetlight: { ko: '가로등', en: 'Street Light', ic: '💡', side: true }, signal: { ko: '신호등', en: 'Traffic Light', ic: '🚦', side: true },
  pavilion: { ko: '정자', en: 'Pavilion', ic: '⛱', place: true, r: 3.2 }, busstop: { ko: '버스 정류장', en: 'Bus Stop', ic: '🚏', side: true, place: true },
  scarecrow: { ko: '허수아비', en: 'Scarecrow', ic: '🌾', r: 1 }, greenhouse: { ko: '비닐하우스', en: 'Greenhouse', ic: '🌱', place: true, r: 11 },
  tiller: { ko: '경운기', en: 'Power Tiller', ic: '🚜', r: 2.4 }, bench: { ko: '벤치', en: 'Bench', ic: '💺', r: 1.2 },
  schoolzone: { ko: '어린이 보호구역 표지', en: 'School Zone Sign', ic: '🚸', side: true }, trailhead: { ko: '등산로 입구', en: 'Trailhead', ic: '⛰', place: true, r: 2.2 },
  spring: { ko: '약수터', en: 'Spring', ic: '⛲', place: true, r: 1.6 }, firesign: { ko: '산불 조심 팻말', en: 'Fire Warning Sign', ic: '🔥', r: 1.2 },
  fishing: { ko: '낚시터', en: 'Fishing Spot', ic: '🎣', place: true, r: 1 }, signpost: { ko: '이정표', en: 'Signpost', ic: '➡', r: 1 },
  card: { ko: '그림 카드', en: 'Picture Card', ic: '📍', place: true, r: 1.4 },
  fountain: { ko: '분수', en: 'Fountain', ic: '⛲', place: true, r: 2.2 }, flowerbed: { ko: '꽃밭', en: 'Flower Bed', ic: '🌷', r: 1.8 }, tree: { ko: '나무', en: 'Tree', ic: '🌳', r: 2 },
  statue: { ko: '동상', en: 'Statue', ic: '🗿', place: true, r: 1 }, toilet: { ko: '화장실', en: 'Restroom', ic: '🚻', place: true, r: 2.6 }, mailbox: { ko: '우체통', en: 'Mailbox', ic: '📮', r: 0.6 }, bin: { ko: '쓰레기통', en: 'Trash Bins', ic: '🚮', r: 0.8 },
  crosswalk: { ko: '횡단보도', en: 'Crosswalk', ic: '🚶', flat: true }, bridge: { ko: '다리', en: 'Bridge', ic: '🌉', flat: true }, trail: { ko: '산책로', en: 'Walking Trail', ic: '👣', flat: true }, parking: { ko: '주차장', en: 'Parking Lot', ic: '🅿', flat: true, place: true },
};
const NAMEPROP = [[/가로등/, 'streetlight'], [/신호등/, 'signal'], [/정자|원두막/, 'pavilion'], [/정류장|버스/, 'busstop'], [/허수아비/, 'scarecrow'], [/비닐|하우스|온실/, 'greenhouse'], [/경운기|트랙터/, 'tiller'], [/벤치|의자/, 'bench'],
  [/보호구역/, 'schoolzone'], [/등산/, 'trailhead'], [/약수/, 'spring'], [/산불/, 'firesign'], [/낚시/, 'fishing'], [/이정표/, 'signpost'], [/분수/, 'fountain'], [/꽃밭|화단|꽃/, 'flowerbed'], [/동상|조각|석상/, 'statue'],
  [/화장실/, 'toilet'], [/우체통/, 'mailbox'], [/쓰레기|휴지통|분리수거/, 'bin'], [/나무/, 'tree'], [/주차/, 'parking'], [/횡단/, 'crosswalk'], [/산책|둘레길/, 'trail'], [/다리/, 'bridge']];
const STYK = { rooftop: '옥상 정원', vines: '덩굴 벽', woods: '나무 숲', trail: '숲길', flowers: '꽃길', solar: '태양광 지붕', bigtree: '큰 나무' };
// 간판 이름(SIGN-1 · 이름표 없는 가게·회사에 AI가 붙임 ✨ — 실제 상호·상표 없음)
const SIGNPOOL = { shop: ['편의점', '빵집', '꽃집', '문구점', '약국', '미용실', '세탁소', '분식', '카페', '치킨', '서점', '안경점', '과일 가게', '철물점', '반찬 가게', '떡집', '사진관', '슈퍼', '김밥', '아이스크림', '장난감 가게', '자전거 가게', '신발 가게', '국숫집'],
  food: ['분식', '김밥', '국숫집', '치킨', '피자', '돈가스', '떡볶이', '빵집', '중국집', '죽집', '비빔밥'], office: ['치과', '소아과', '안과', '부동산', '공부방', '여행사', '태권도', '피아노 학원', '영어 학원', '수학 학원', '보험', '사진관'], factory: ['공장', '물류 창고', '빵 공장', '가구 공장', '종이 공장'] };
// 계절 색(지금은 여름 — 봄·가을·겨울은 2단계에서 칩으로 · 색만 바꾸면 다시 지어짐)
const SEASON = {
  summer: { grass: [0x7fb85a, 0x6aa84c], hill: 0x4f8f45, rock: 0x8c8a78, bank: 0xb9a77a, bed: 0x5f6f58, tree: [0x3f8a3c, 0x4e9a43, 0x5aa54a, 0x2f7a3a], pine: [0x2f6b3a, 0x376f3e], rice: 0x9cc95a, farm: 0x8a6440, crop: 0x5f9a3f, fruit: 0xe0453a, flower: [0xf6d23c, 0xf28bb0, 0xffffff, 0xb48cf0] },
};

export default async function start(map, params) {
  const T3 = map.three; let dead = false;
  const id = String(params.town || params.id || '').trim();
  const bail = (msg) => { map.hud.toast(msg, 4); setTimeout(() => { if (!dead) map.quit(); }, 50); return { stop() { dead = true; } }; };
  if (!/^[a-z0-9_-]{1,40}$/i.test(id)) return bail('🏘 마을 이름이 올바르지 않아요(?town=마을이름)');
  let D = null; try { D = (await import(new URL('../towns/' + id + '.js?t=' + Date.now(), import.meta.url))).TOWN; } catch (e) { console.error('[마을] 자료를 읽지 못했어요', e); }
  if (!D || !D.layers) return bail('🏘 「' + id + '」 마을 자료가 없어요');
  if (map.gone) return {};

  // ───────── 좌표: 매트 cm ↔ 세계 m(학교 자리를 실제 학교에 맞춤) ─────────
  const S = (D.scale || 500) / 100, MSZ = D.mat || { w: 250, h: 140 };
  const MD = map.mapData(1), SB = MD.boundary, SBX = SB.map(p => p[0]), SBZ = SB.map(p => p[1]);
  const SR = [Math.min(...SBX), Math.min(...SBZ), Math.max(...SBX), Math.max(...SBZ)];   // 학교 상자(울타리 바깥 테두리)
  const MS = D.school || [110.5, 1, 139.5, 31], MCX = (MS[0] + MS[2]) / 2, MCY = (MS[1] + MS[3]) / 2, WCX = (SR[0] + SR[2]) / 2, WCZ = (SR[1] + SR[3]) / 2;
  // 학교 칸 = 실제 학교 담 상자(교사 10-13 '학교 모델은 줄이지 말고 · 마을 쪽 1:500은 그대로') — 칸 네 변을 담 상자에 맞추고, 칸 밖은 그 가장자리에서부터 정확히 1:500
  //   (예전 = 가운데 맞춤 · 칸 125m < 학교 146m라 둘레 길이 학교를 파고듦) · school 칸이 판 가장자리에 붙으면(위쪽 0) 그쪽은 담에서 바로 끝
  const pw = (v, a0, a1, b0, b1) => v < a0 ? b0 - (a0 - v) * S : v > a1 ? b1 + (v - a1) * S : b0 + (v - a0) / Math.max(1e-6, a1 - a0) * (b1 - b0);
  const pwInv = (w, a0, a1, b0, b1) => w < b0 ? a0 - (b0 - w) / S : w > b1 ? a1 + (w - b1) / S : a0 + (w - b0) / Math.max(1e-6, b1 - b0) * (a1 - a0);
  const X = mx => pw(mx, MS[0], MS[2], SR[0], SR[2]), Z = my => pw(my, MS[1], MS[3], SR[1], SR[3]), MXof = x => pwInv(x, MS[0], MS[2], SR[0], SR[2]), MYof = z => pwInv(z, MS[1], MS[3], SR[1], SR[3]); void MCX; void MCY; void WCX; void WCZ;
  const inMatSchool = (mx, my) => mx > MS[0] && mx < MS[2] && my > MS[1] && my < MS[3];
  const TX0 = X(0), TZ0 = Z(0), TX1 = X(MSZ.w), TZ1 = Z(MSZ.h);
  const TY = -1.30;   // 마을 땅 높이(운동장 흙 -1.35보다 5cm 위 — 바깥 잔디 무늬 -1.362를 덮음 · 정문과 한 발 높이)
  // 칸 주소(판 가장자리에 적은 그대로 — 아이들이 '내 집은 다3'처럼 말함) · 자료 grid = { cell: 30, cols: 'num', rows: 'hangul', order: 'rowcol' } · 없으면 10cm A1~
  const GRD = { cell: 10, cols: 'alpha', rows: 'num', order: 'colrow', ...(D.grid || {}) }, HG = '가나다라마바사아자차카타파하';
  const nameK = (i, kind) => kind === 'num' ? String(i + 1) : kind === 'hangul' ? (HG[i] || '?') : (i < 26 ? String.fromCharCode(65 + i) : 'A' + String.fromCharCode(65 + i - 26));
  const colName = c => nameK(c, GRD.cols), rowName = r => nameK(r, GRD.rows);
  // 선 자리(cm) — grid.xs·ys를 적으면 그 선으로(첫·끝 칸이 다른 판) · 없으면 cell 간격
  const GXS = GRD.xs || Array.from({ length: Math.max(0, Math.ceil(MSZ.w / GRD.cell) - 1) }, (_, i) => (i + 1) * GRD.cell), GYS = GRD.ys || Array.from({ length: Math.max(0, Math.ceil(MSZ.h / GRD.cell) - 1) }, (_, i) => (i + 1) * GRD.cell);
  const idxOf = (v, L9) => { let i = 0; while (i < L9.length && v >= L9[i]) i++; return i; };
  const cellOf = (x, z) => { const mx = MXof(x), my = MYof(z), c = colName(idxOf(mx, GXS)), r = rowName(idxOf(my, GYS)); return GRD.order === 'rowcol' ? r + c : c + r; };   // 세계 → 격자 주소
  // 칸 주소 → 칸 네모(매트 cm) — '다3'(rowcol) · 'C2'(colrow) · part = 'left'|'right'|'top'|'bottom' 반쪽(한 칸에 두 색)
  const XLn = () => [0, ...GXS, MSZ.w], YLn = () => [0, ...GYS, MSZ.h];
  const parseCell = (a) => { const t = String(a || '').trim(); let rp, cp; if (GRD.order === 'rowcol') { const m = t.match(/^(\D+)(\d+)$/); if (!m) return null; rp = m[1]; cp = m[2]; } else { const m = t.match(/^([A-Za-z]+)(\d+)$/); if (!m) return null; cp = m[1]; rp = m[2]; }
    const ix = s9 => (s9.length === 1 && /[A-Za-z]/.test(s9) ? s9.toUpperCase().charCodeAt(0) - 65 : /^\d+$/.test(s9) ? +s9 - 1 : HG.indexOf(s9));
    const c = GRD.cols === 'num' ? +cp - 1 : ix(cp), r = GRD.rows === 'num' ? +rp - 1 : ix(rp), XL = XLn(), YL = YLn(); if (c < 0 || r < 0 || c >= XL.length - 1 || r >= YL.length - 1) return null; return [XL[c], YL[r], XL[c + 1], YL[r + 1]]; };
  const cellRect = (a, part) => { const R = parseCell(a); if (!R || !part) return R; const mx = (R[0] + R[2]) / 2, my = (R[1] + R[3]) / 2; return part === 'left' ? [R[0], R[1], mx, R[3]] : part === 'right' ? [mx, R[1], R[2], R[3]] : part === 'top' ? [R[0], R[1], R[2], my] : part === 'bottom' ? [R[0], my, R[2], R[3]] : R; };
  const inPoly = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const inSchool = (x, z) => x >= SR[0] && x <= SR[2] && z >= SR[1] && z <= SR[3] && inPoly(x, z, SB);   // 울타리 안
  const inRect = (x, z) => x >= SR[0] && x <= SR[2] && z >= SR[1] && z <= SR[3];

  let LANG = 'ko';
  const PAL = SEASON.summer;
  const rng0 = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hashS = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const vnoise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, h = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
    const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf); return (h(xi, zi) * (1 - u) + h(xi + 1, zi) * u) * (1 - v) + (h(xi, zi + 1) * (1 - u) + h(xi + 1, zi + 1) * u) * v; };
  const C3 = new T3.Color(), mix = (a, b, t) => { C3.setHex(a); const r = C3.r, g = C3.g, bb = C3.b; C3.setHex(b); return [r + (C3.r - r) * t, g + (C3.g - g) * t, bb + (C3.b - bb) * t]; };
  const rgb = (hex, k = 1) => { C3.setHex(hex); return [C3.r * k, C3.g * k, C3.b * k]; };

  // ───────── 판(layers): from + drop + 덧붙이기 ─────────
  const ARR = ['nature', 'roads', 'blocks', 'labels', 'zones', 'fac', 'props', 'areas', 'fills'];
  function resolve(lid, seen = new Set()) {
    const L = D.layers[lid]; if (!L || seen.has(lid)) return null; seen.add(lid);
    const B = L.from ? resolve(L.from, seen) : null, out = { id: lid, name: L.name || lid, en: L.en, note: L.note || null };
    const drop = new Set(L.drop || []);
    for (const k of ARR) { const base = B ? B[k].filter(it => !drop.has(it.id)) : [], own = L[k] || [], ids = new Set(own.filter(o => o.id).map(o => o.id));
      out[k] = base.filter(it => !it.id || !ids.has(it.id)).concat(own); }
    // 칸 주소 + 칸 안 자리(at = 0~1 · 테이프 안쪽 기준)로 적은 블록·소품 → 판 cm(교사 10-13 '칸 주소로 격자에 붙여 읽기') · t = 블록 모양 줄임말
    const TS = { c2: [2, 2, 2], c3: [3, 3, 3], c4: [4, 4, 4], pl: [6, 3, 1], pe: [3, 1, 6], ps: [6, 1, 3] }, TAPE = 2.6;
    const atXY = (o, hw = 0) => { const R9 = cellRect(o.cell); if (!R9) return null; const m = TAPE + hw, x0 = R9[0] + m, x1 = R9[2] - m, y0 = R9[1] + m, y1 = R9[3] - m, u = o.at ? o.at[0] : 0.5, v = o.at ? o.at[1] : 0.5;
      return [x1 > x0 ? x0 + u * (x1 - x0) : (R9[0] + R9[2]) / 2, y1 > y0 ? y0 + v * (y1 - y0) : (R9[1] + R9[3]) / 2]; };
    out.blocks = out.blocks.map(b => { if (b.x != null || !b.cell) return b; const T9 = TS[b.t] || [2, 2, 2], w = b.w ?? T9[0], d = b.d ?? T9[1], h = b.h ?? T9[2], r = (b.rot || 0) * Math.PI / 180, hw = (Math.abs(w * Math.cos(r)) + Math.abs(d * Math.sin(r))) / 2, hd = (Math.abs(w * Math.sin(r)) + Math.abs(d * Math.cos(r))) / 2;
      const P = atXY(b, Math.max(hw, hd) * 0.85); return P ? { ...b, x: P[0], y: P[1], w, d, h } : null; }).filter(Boolean);
    out.props = out.props.map(p => { if (p.x != null || !p.cell || !p.at) return p; const P = atXY(p); return P ? { ...p, x: P[0], y: P[1] } : p; });
    out.nature = out.nature.map(n => { if (!n.cell || n.rect || n.poly || n.cells) return n; const R9 = cellRect(n.cell); if (!R9) return n; const m = n.inset ?? (n.k === 'hill' ? 1.4 : 2.2); return { ...n, rect: [R9[0] + m, R9[1] + m, R9[2] - m, R9[3] - m] }; });
    // 칸 채우기(fills — 이름표 없는 칸·이름이 건물에 붙은 칸을 둘레에 맞게 · ✨) → 구역 + 꾸밈 낱말(이름표 돌 없이)
    for (const f of out.fills) { if (f.k) out.zones.push({ id: 'fl_' + f.cell, k: f.k, type: f.type, dens: f.dens, cell: f.cell, note: '', ai: true }); if (f.style) out.areas.push({ cell: f.cell, t: '', style: f.style, noStone: true }); }
    // 선으로 적은 강의 모서리 깎기(smooth = Chaikin 횟수 · 끝점은 그대로)
    out.nature = out.nature.map(n => { if (!n.poly || !n.smooth) return n; let pts = n.poly; for (let it = 0; it < n.smooth; it++) { const Q = []; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; Q.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); } pts = Q; } return { ...n, poly: pts }; });   // 닫힌 모양(호수)도 둥글게
    out.nature = out.nature.map(n => { if (!n.line || !n.smooth) return n; let pts = n.line.pts; for (let it = 0; it < n.smooth; it++) { const Q = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1]; Q.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); } Q.push(pts[pts.length - 1]); pts = Q; } return { ...n, line: { ...n.line, pts } }; });
    // 칸 주소로 적은 강(water.cells — 파란 색종이가 놓인 칸 차례) → 칸 가운데를 잇는 선 · 양 끝은 반 칸 더(교사 10-13 실제 수업 판)
    //   대각선 칸(모서리 하나만 닿음)은 그대로 이으면 길 교차로 한가운데를 지나 다리가 십자로 겹침 → 옆 칸 가운데를 거치는 ㄱ자로(번갈아 → 물굽이) 잡고
    //   모서리 깎기(Chaikin 3번) — 강이 칸 변 한가운데에서 길을 직각으로 건넘(다리 짧고 교차로와 반 칸 떨어짐) · 굽는 곳 반지름 ≈ 반 칸/√2라 물 띠가 접히지 않음 · ✨ 어림에 적음
    out.nature = out.nature.map(n => { if (n.k !== 'water' || !n.cells || n.line) return n; const RC = n.cells.map(c => parseCell(c)).filter(Boolean), C = RC.map(R => [(R[0] + R[2]) / 2, (R[1] + R[3]) / 2]); if (C.length < 2) return n;
      let pts = [C[0]], flip = 0, bent = 0; const eq = (u, v) => Math.abs(u - v) < 1e-6;
      for (let i = 1; i < C.length; i++) { const a = RC[i - 1], b = RC[i], cx = eq(a[2], b[0]) ? a[2] : eq(a[0], b[2]) ? a[0] : null, cz = eq(a[3], b[1]) ? a[3] : eq(a[1], b[3]) ? a[1] : null;
        if (cx != null && cz != null && n.bend !== false) { pts.push(flip++ % 2 ? [C[i - 1][0], C[i][1]] : [C[i][0], C[i - 1][1]]); bent++; }   // bend: false = 대각선 그대로(작은길은 어차피 끊김 · 큰길은 교차로째 다리)
        pts.push(C[i]); }
      for (let it = 0; it < 3; it++) { const Q = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1]; Q.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); } Q.push(pts[pts.length - 1]); pts = Q; }
      const E2 = n.ext || [14, 14], ext = (a, b, L9) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [a[0] + dx / l * L9, a[1] + dy / l * L9]; };   // ext = [처음,끝] 더 늘이는 길이(cm · 0 = 호수 같은 데서 시작)
      const P9 = [...(E2[0] ? [ext(pts[0], pts[1], E2[0])] : []), ...pts, ...(E2[1] ? [ext(pts[pts.length - 1], pts[pts.length - 2], E2[1])] : [])];
      return { ...n, bent, line: { pts: P9.map(p => [Math.max(0, Math.min(MSZ.w, p[0])), Math.max(0, Math.min(MSZ.h, p[1]))]), w: n.w || 6 } }; });
    // 칸 이름표의 fill(블록 없는 칸을 이름표 말대로 채움) → 구역처럼 · 빈 카드에 건물 이름(소방서·카페…) → 2cm 블록처럼 그 건물(🧱 아이 것)
    for (const a of out.areas) if (a.fill) out.zones.push({ id: 'af_' + (a.id || a.t), k: a.fill.k || 'live', type: a.fill.type, dens: a.fill.dens, cells: a.cells || (a.cell ? [a.cell] : []), note: a.t, area: a.id || a.t });
    { const GC = { live: 'red', work: 'yellow', pub: 'navy', nat: 'green' }, keep = [];
      for (const p of out.props) { const isCard = (p.k === 'card' || !PROPK[p.k]) && p.name && !NAMEPROP.some(([re]) => re.test(p.name)), k9 = isCard ? (NAMEKIND.find(([re]) => re.test(p.name)) || [])[1] : null;
        if (!k9) { keep.push(p); continue; } let x = p.x, y = p.y; if (x == null && p.cell) { const R9 = cellRect(p.cell); if (R9) { x = (R9[0] + R9[2]) / 2; y = (R9[1] + R9[3]) / 2; } } if (x == null) continue;
        out.blocks.push({ id: p.id || ('cb' + out.blocks.length), x, y, w: 2, d: 2, h: 2, c: k9 === 'hospital' ? 'white' : GC[(KIND[k9] || {}).g] || 'navy', name: p.name, en: p.en, card: true }); }
      out.props = keep; }
    // 칸 주소로 적은 구역(cell · cells · part) → 칸 네모 — 색종이가 칸을 다 덮지 않아도 그 칸 전체가 구역(교사 10-13)
    out.zones = out.zones.flatMap(z => { if (z.rect || z.poly) return [z]; const C = z.cells || (z.cell ? [z.cell] : []); return C.map((c, i) => { const R = cellRect(c, z.part); return R ? { ...z, id: (z.id || 'z') + (C.length > 1 ? '_' + i : ''), rect: R, cellName: c } : null; }).filter(Boolean); });
    return out;
  }
  const LAYERS = Object.keys(D.layers);
  let LID = D.layers[params.layer] ? params.layer : D.base && D.layers[D.base] ? D.base : LAYERS[0], L = resolve(LID);

  // ───────── 자연환경 엔진: 높이 격자(5m) — 산(쌓은 높이 → 부드러운 봉우리) · 물(강·연못 바닥) · 다리 ─────────
  const G = 5, NX = Math.ceil((TX1 - TX0) / G) + 1, NZ = Math.ceil((TZ1 - TZ0) / G) + 1, NN = NX * NZ;
  const HF = new Float32Array(NN), WD = new Float32Array(NN), WK = new Uint8Array(NN), NR = new Uint8Array(NN), BRM = new Uint8Array(NN), GT = new Float32Array(NN * 3), GTW = new Float32Array(NN), FPK = new Uint8Array(NN), SDW = new Float32Array(NN);   // … · SDW = 물가까지 거리(물 안 −) — 강·호수 하나로(석축·둔치·물 울타리의 기준)
  const CAPY = -0.70, FPD = 0.78, WLY = -1.0, FPW = 10;
  const RCAP = new Float32Array(NN); let HILLS = [], MWALL = [], RDY = null;   // 고갯길 둔덕 높이(땅 격자 · 없으면 −1e9) · 산 목록 · 옹벽 자리
  function hillAt(x, z) { let best = 0; for (const H9 of HILLS) { if (x < H9.bb[0] - 40 || x > H9.bb[2] + 40 || z < H9.bb[1] - 40 || z > H9.bb[3] + 40) continue; const sh = H9.sh; if (!inShape(sh, x, z)) continue;
      const de = edgeD(sh, x, z), ridge = 0.86 + 0.28 * (vnoise(x / 23 + H9.sd, z / 23) - 0.5) + 0.12 * (vnoise(x / 9, z / 9 + H9.sd) - 0.5);
      let h; if (H9.pk && H9.rp) { const t = Math.max(0, 1 - Math.hypot(x - H9.pk[0], z - H9.pk[1]) / H9.rp), e = Math.min(1, de / 70), ee = e * e * (3 - 2 * e), gl = 0.75 + 0.5 * vnoise(x / 61 + H9.sd, z / 61);   // 봉우리 하나(종 모양) · 산자락은 가장자리 70m에 걸쳐 · 골짜기·능선 잡음
        h = H9.Hm * t * t * (3 - 2 * t) * ee * ridge * Math.min(1.08, gl + t * 0.25); }
      else { const t = H9.pk ? Math.min(1, de / (de + Math.hypot(x - H9.pk[0], z - H9.pk[1]) + 1e-6) * 1.15) : Math.min(1, de / (H9.dmax * 0.92)); h = H9.Hm * Math.sin(t * Math.PI / 2) ** 1.35 * ridge; }
      if (h > best) best = h; } return best; }   // 둔치 덮개 높이(마을 땅 기준) · 땅 격자의 둔치 깊이(덮개보다 8cm 아래 — 덮개가 덮음) · 물낯 · 둔치 너비(m)   // … · 땅 물감(공원·풀밭·모래 — 땅 메시 꼭짓점에 직접 칠함: 비탈에서도 뜨거나 묻히지 않음)   // 높이 · 물 깊이 · 물 종류(1 강 2 연못) · 길 위 · 다리 아래(물 울타리를 비움)
  const nx = i => TX0 + i * G, nz = j => TZ0 + j * G;
  const shapeOf = it => it.rect ? { rect: [X(it.rect[0]), Z(it.rect[1]), X(it.rect[2]), Z(it.rect[3])] } : it.poly ? { poly: it.poly.map(p => [X(p[0]), Z(p[1])]) } : it.line ? { line: it.line.pts.map(p => [X(p[0]), Z(p[1])]), w: (it.line.w || 2) * S } : null;
  const inShape = (sh, x, z) => sh.rect ? x >= Math.min(sh.rect[0], sh.rect[2]) && x <= Math.max(sh.rect[0], sh.rect[2]) && z >= Math.min(sh.rect[1], sh.rect[3]) && z <= Math.max(sh.rect[1], sh.rect[3]) : sh.poly ? inPoly(x, z, sh.poly) : false;
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / L2; t = Math.max(0, Math.min(1, t)); const px = a[0] + dx * t, pz = a[1] + dz * t; return [Math.hypot(x - px, z - pz), t, px, pz]; };
  const lineD = (x, z, P) => { let best = [1e9, 0, 0, 0, 0]; for (let i = 0; i < P.length - 1; i++) { const r = segD(x, z, P[i], P[i + 1]); if (r[0] < best[0]) best = [r[0], i + r[1], r[2], r[3], i]; } return best; };
  const edgeD = (sh, x, z) => { if (sh.rect) { const r = sh.rect; return Math.min(x - Math.min(r[0], r[2]), Math.max(r[0], r[2]) - x, z - Math.min(r[1], r[3]), Math.max(r[1], r[3]) - z); }
    let d = 1e9; for (let i = 0, j = sh.poly.length - 1; i < sh.poly.length; j = i++) d = Math.min(d, segD(x, z, sh.poly[j], sh.poly[i])[0]); return d; };
  const bboxOf = sh => { const P = sh.rect ? [[sh.rect[0], sh.rect[1]], [sh.rect[2], sh.rect[3]]] : sh.poly || sh.line; const xs = P.map(p => p[0]), zs = P.map(p => p[1]), m = sh.w ? sh.w / 2 + 6 : 0;
    return [Math.min(...xs) - m, Math.min(...zs) - m, Math.max(...xs) + m, Math.max(...zs) + m]; };
  const sdOf = (sh, x, z) => sh.line ? lineD(x, z, sh.line)[0] - sh.w / 2 : inShape(sh, x, z) ? -edgeD(sh, x, z) : -edgeDOut(sh, x, z);   // 물가까지 거리(물 안 −)
  const nodeRange = (bb, pad = 0) => [Math.max(0, Math.floor((bb[0] - pad - TX0) / G)), Math.max(0, Math.floor((bb[1] - pad - TZ0) / G)), Math.min(NX - 1, Math.ceil((bb[2] + pad - TX0) / G)), Math.min(NZ - 1, Math.ceil((bb[3] + pad - TZ0) / G))];
  let ROADS = [], RSEG = [];   // 길(세계 좌표) — 다리·물가·나무 피하기에도 씀
  function buildTerrain() {
    HF.fill(0); WD.fill(0); WK.fill(0); NR.fill(0); BRM.fill(0); FPK.fill(0); SDW.fill(1e9);
    // 산·언덕: 발자국 안 = 가장자리에서 안쪽으로 둥글게 솟는 봉우리(사인 돔 · peak 쪽이 가장 높음) + 능선 잡음 → 흐리게(산자락) · 판 밖으로도 이어짐(skirt)
    HILLS = []; for (const it of L.nature) { if (it.k !== 'hill') continue; const sh = shapeOf(it); if (!sh || sh.line) continue; const bb = bboxOf(sh), st = 8; let dmax = 0;
      for (let z = bb[1]; z <= bb[3]; z += st) for (let x = bb[0]; x <= bb[2]; x += st) if (inShape(sh, x, z)) dmax = Math.max(dmax, edgeD(sh, x, z));
      if (dmax > 0) HILLS.push({ sh, bb, Hm: (it.h || 2) * S, dmax, sd: hashS(it.id || it.name || 'h') % 997, pk: it.peak ? [X(it.peak[0]), Z(it.peak[1])] : null, rp: (it.r || 0) * S }); }
    const HL = new Float32Array(NN); for (let k = 0; k < NN; k++) HL[k] = hillAt(nx(k % NX), nz((k / NX) | 0));
    blur(HL, 2); blur(HL, 1);
    // 산 위 아이 블록 자리 = 평평하게 고름(둘레 10m에 걸쳐 산비탈로 이어짐 — 남는 단차는 석축 단 terraceOf)
    for (const b of L.blocks) { if (b.x == null || b.c === 'green') continue; const cx = X(b.x), cz = Z(b.y), r0 = Math.max(b.w || 2, b.d || 2) * S / 2 + 5, r1 = r0 + 10, [i0, j0, i1, j1] = nodeRange([cx - r1, cz - r1, cx + r1, cz + r1]); let pad = 0, n9 = 0;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (Math.hypot(nx(i) - cx, nz(j) - cz) < r0) { pad += HL[j * NX + i]; n9++; } if (!n9) continue; pad /= n9; if (pad < 1) continue;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(nx(i) - cx, nz(j) - cz); if (d >= r1) continue; const t = d <= r0 ? 0 : (d - r0) / (r1 - r0), k = j * NX + i; HL[k] = pad + (HL[k] - pad) * t * t * (3 - 2 * t); } }
    // 산을 지나는 길 = 고갯길(MTN-1 · 10-13 교사 '산 높이 · 절개면에 옹벽'): 길 높이 = 산을 크게 흐린 높이의 절반(교차로에서 두 길이 같은 높이) · 길 둘레 8m는 길 높이로 깎거나 돋움
    //   깎은 면 = 옹벽(돌) + 그 위 풀 둔덕(덮개 · 땅 격자 톱니를 덮음) · 둔덕 너머는 산비탈 그대로
    RCAP.fill(-1e9); MWALL = []; { const HB = HL.slice(); for (let r = 0; r < 3; r++) blur(HB, 6); RDY = HB;
      for (let k = 0; k < NN; k++) HB[k] *= 0.64;   // 길 높이 = 크게 흐린 산 높이의 0.64(덜 깎음 — 산이 한 덩어리로 보이게)
      const HL0 = HL.slice(), hAt = (A, x, z) => { const u = Math.max(0, Math.min(NX - 1.001, (x - TX0) / G)), v = Math.max(0, Math.min(NZ - 1.001, (z - TZ0) / G)), i = u | 0, j = v | 0, fx = u - i, fz = v - j, k = j * NX + i; return (A[k] * (1 - fx) + A[k + 1] * fx) * (1 - fz) + (A[k + NX] * (1 - fx) + A[k + NX + 1] * fx) * fz; };
      for (const r of RSEG) { const L0 = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]), tx = (r.b[0] - r.a[0]) / L0, tz = (r.b[1] - r.a[1]) / L0, px = -tz, pz = tx, hw = r.hw;
        if (Math.max(hAt(HL0, r.a[0], r.a[1]), hAt(HL0, (r.a[0] + r.b[0]) / 2, (r.a[1] + r.b[1]) / 2), hAt(HL0, r.b[0], r.b[1]), ...Array.from({ length: 9 }, (_, q) => hAt(HL0, r.a[0] + tx * L0 * (q + 0.5) / 9, r.a[1] + tz * L0 * (q + 0.5) / 9))) < 1.2) continue;   // 산을 안 지나는 길은 그대로
        const [i0, j0, i1, j1] = nodeRange([Math.min(r.a[0], r.b[0]), Math.min(r.a[1], r.b[1]), Math.max(r.a[0], r.b[0]), Math.max(r.a[1], r.b[1])], hw + 18);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * NX + i, d = segD(nx(i), nz(j), r.a, r.b)[0]; if (d < hw + 8.1) HL[k] = HB[k]; }
        const WP = { '-1': [], '1': [] }; for (const sg of [-1, 1]) for (let t = 0, q = 0; t <= L0 + 0.01; t += 2.5, q++) { const cx = r.a[0] + tx * t, cz = r.a[1] + tz * t, road = hAt(HB, cx, cz), nat = hAt(HL0, cx + px * sg * (hw + 16), cz + pz * sg * (hw + 16)), W = Math.min(3.6, Math.max(0, (nat - road) * 0.35));
          const ok = W >= 0.6 && !inSchool(cx, cz); WP[sg][q] = ok ? W : 0; if (ok) MWALL.push({ rid: r.ri + ':' + RSEG.indexOf(r) + ':' + sg, q, cx, cz, px: px * sg, pz: pz * sg, tx, tz, road, W, hw }); }
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = nx(i), z = nz(j), [d, u] = segD(x, z, r.a, r.b); if (d < hw + 1 || d > hw + 16 || u <= 0 || u >= 1) continue; const sg = ((x - r.a[0]) * px + (z - r.a[1]) * pz) >= 0 ? 1 : -1, W = WP[sg][Math.round(u * L0 / 2.5)] || 0; if (!W) continue;
          const k = j * NX + i, top = HB[k] + W; if (d <= hw + 15.5) RCAP[k] = Math.max(RCAP[k], top); if (d > hw + 8.1 && HL[k] < top) HL[k] = top; } } }
    // 물(WATER-2 · 10-13 교사 '둑과 둔치 · 물이 길·건물을 뚫으면 안 돼'): 강·호수를 물가까지 거리 하나(SDW)로 — 물 안(SD<2.5 · 석축 아래로 깊게) · 둔치(SD 2.5~FPW · 덮개 아래 FPD) · 둑 비탈(FPW~FPW+5)
    //   보이는 물가 = 석축(매끈한 벽 · drawBanks) + 둔치 덮개(매끈한 판) — 5m 땅 격자의 톱니는 덮개·물 아래에 숨음
    for (const it of L.nature) { if (it.k !== 'water') continue; const sh = shapeOf(it); if (!sh) continue; const [i0, j0, i1, j1] = nodeRange(bboxOf(sh), FPW + 12);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = nx(i), z = nz(j), k = j * NX + i, sd = sdOf(sh, x, z); if (sd < SDW[k]) { SDW[k] = sd; if (sd < 0) WK[k] = sh.line ? 1 : 2; } } }
    for (let k = 0; k < NN; k++) { const sd = SDW[k]; if (sd >= FPW + 5) continue; WD[k] = Math.max(WD[k], sd < 2.5 ? 1.6 + 0.9 * Math.min(1, Math.max(0, -sd) / 8) : sd < FPW ? FPD : FPD * (1 - (sd - FPW) / 5)); }
    // 길 아래 = 길(다리 칸 표시) · 학교 상자 안은 높이 0
    for (const r of RSEG) { const [i0, j0, i1, j1] = nodeRange([Math.min(r.a[0], r.b[0]), Math.min(r.a[1], r.b[1]), Math.max(r.a[0], r.b[0]), Math.max(r.a[1], r.b[1])], r.hw + 2);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (segD(nx(i), nz(j), r.a, r.b)[0] < r.hw + 1.5) NR[j * NX + i] = 1; }
    for (let k = 0; k < NN; k++) if (NR[k] && !WK[k]) WD[k] = 0;   // 길 아래 둑은 평평하게(둑 비탈이 길 띠 위로 솟아 풀이 비치지 않게 · 다리 판이 물 위를 덮음)
    for (let k = 0; k < NN; k++) { const i = k % NX, j = (k / NX) | 0; if (inRect(nx(i), nz(j))) { HF[k] = 0; WD[k] = 0; WK[k] = 0; continue; } HF[k] = HL[k] - WD[k]; }
  }
  function edgeDOut(sh, x, z) { if (sh.rect) { const r = sh.rect, x0 = Math.min(r[0], r[2]), x1 = Math.max(r[0], r[2]), z0 = Math.min(r[1], r[3]), z1 = Math.max(r[1], r[3]); const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1); return -Math.hypot(dx, dz); }
    let d = 1e9; for (let i = 0, j = sh.poly.length - 1; i < sh.poly.length; j = i++) d = Math.min(d, segD(x, z, sh.poly[j], sh.poly[i])[0]); return -d; }
  function blur(A, r) { const T = new Float32Array(NN);
    for (let j = 0; j < NZ; j++) { let s = 0, n = 0; for (let i = -r; i < NX + r; i++) { const a = i + r, b = i - r - 1; if (a < NX && a >= 0) { s += A[j * NX + a]; n++; } if (b >= 0) { s -= A[j * NX + b]; n--; } if (i >= 0 && i < NX) T[j * NX + i] = s / Math.max(1, n); } }
    for (let i = 0; i < NX; i++) { let s = 0, n = 0; for (let j = -r; j < NZ + r; j++) { const a = j + r, b = j - r - 1; if (a < NZ && a >= 0) { s += T[a * NX + i]; n++; } if (b >= 0) { s -= T[b * NX + i]; n--; } if (j >= 0 && j < NZ) A[j * NX + i] = s / Math.max(1, n); } } }
  // 땅 높이(세계 y) — 메시와 같은 삼각형으로 나눠 읽는다(물리 = 보이는 땅)
  const sdAt = (x, z) => { const u = (x - TX0) / G, v = (z - TZ0) / G; if (!(u >= 0 && v >= 0 && u < NX - 1 && v < NZ - 1)) return 1e9; const i = u | 0, j = v | 0, fx = u - i, fz = v - j, k = j * NX + i, a = Math.min(SDW[k], 1e4), b = Math.min(SDW[k + 1], 1e4), c = Math.min(SDW[k + NX], 1e4), d = Math.min(SDW[k + NX + 1], 1e4);
    return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz; };   // 물가까지 거리(땅 격자 보간)
  const tH = (x, z) => { let h = tH0(x, z); if (MWALL.length) { const u = (x - TX0) / G, v = (z - TZ0) / G; if (u >= 0 && v >= 0 && u < NX - 1 && v < NZ - 1) { const i = u | 0, j = v | 0, k = j * NX + i, a = RCAP[k], b = RCAP[k + 1], c = RCAP[k + NX], d = RCAP[k + NX + 1];   // 고갯길 둔덕 위(네 모서리가 모두 둔덕일 때)
      if (a > -1e8 && b > -1e8 && c > -1e8 && d > -1e8) { const fx = u - i, fz = v - j, rc = (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz; if (rc > h) h = rc; } } } if (h > CAPY + 0.5) return h; const sd = sdAt(x, z); return sd > -0.3 && sd < FPW + 0.8 ? Math.max(h, CAPY) : h; };   // 둔치에서는 덮개 높이(사람·나무·벤치가 덮개 위에)
  const tH0 = (x, z) => { const u = (x - TX0) / G, v = (z - TZ0) / G; if (!(u >= 0 && v >= 0 && u < NX - 1 && v < NZ - 1)) return 0;
    const i = u | 0, j = v | 0, fx = u - i, fz = v - j, k = j * NX + i, h00 = HF[k], h10 = HF[k + 1], h01 = HF[k + NX], h11 = HF[k + NX + 1];
    return fx >= fz ? h00 + (h10 - h00) * fx + (h11 - h10) * fz : h00 + (h11 - h01) * fx + (h01 - h00) * fz; };
  const ty = (x, z) => TY + tH(x, z);
  const wdI = (x, z) => { const u = (x - TX0) / G, v = (z - TZ0) / G; if (!(u >= 0 && v >= 0 && u < NX - 1 && v < NZ - 1)) return 0;   // 물 깊이(땅 메시와 같은 삼각형 보간) — 다리 구간 잡기
    const i = u | 0, j = v | 0, fx = u - i, fz = v - j, k = j * NX + i, h00 = WD[k], h10 = WD[k + 1], h01 = WD[k + NX], h11 = WD[k + NX + 1];
    return fx >= fz ? h00 + (h10 - h00) * fx + (h11 - h10) * fz : h00 + (h11 - h01) * fx + (h01 - h00) * fz; };
  const wAt = (x, z) => { const i = Math.round((x - TX0) / G), j = Math.round((z - TZ0) / G); if (!(i >= 0 && j >= 0 && i < NX && j < NZ)) return 0; if (SDW[j * NX + i] > FPW + 8) return 0; return sdAt(x, z) < 0.8 ? (WK[j * NX + i] || 1) : 0; };   // 물(석축 안쪽 + 0.8m)

  // ───────── 그리기 그릇: 150m 구역마다 정점색 삼각형 ─────────
  const REG = 150, BK = new Map(), OBJ = [], MATS = [], GEOS = [], TEX = [];
  const bucket = (x, z) => { const rx = Math.floor((x - TX0) / REG), rz = Math.floor((z - TZ0) / REG), k = rx + ':' + rz; let b = BK.get(k); if (!b) { b = { p: [], n: [], c: [], u: [] }; BK.set(k, b); } return b; };
  const DBK = new Map(), dbucket = (x, z) => { const rx = Math.floor((x - TX0) / REG), rz = Math.floor((z - TZ0) / REG), k = rx + ':' + rz; let b = DBK.get(k); if (!b) { b = { p: [], n: [], c: [], u: [], cx: TX0 + (rx + 0.5) * REG, cz: TZ0 + (rz + 0.5) * REG }; DBK.set(k, b); } return b; };   // 작은 장식(창틀·창턱·실외기·옥상 기계) — 가까운 구역만 그림
  const GBK = new Map(), gbucket = (x, z) => { const k = Math.floor((x - TX0) / REG) + ':' + Math.floor((z - TZ0) / REG); let b = GBK.get(k); if (!b) { b = { p: [], n: [], c: [], u: [] }; GBK.set(k, b); } return b; };   // 창 유리(밤에 불 켜짐)
  const FBK = new Map(), fbucket = (kind, x, z) => { const k = kind + ':' + Math.floor((x - TX0) / REG) + ':' + Math.floor((z - TZ0) / REG); let b = FBK.get(k); if (!b) { b = { kind, p: [], n: [], u: [] }; FBK.set(k, b); } return b; };
  const TBK = new Map(), tbucket = (x, z) => { const rx = Math.floor((x - TX0) / REG), rz = Math.floor((z - TZ0) / REG), k = rx + ':' + rz; let b = TBK.get(k); if (!b) { b = { p: [], n: [], c: [], w: [] }; TBK.set(k, b); } return b; };
  // uv = 면 방향에 맞춘 세계 좌표(4m에 한 번) — 은은한 결 무늬(길 아스팔트 알갱이·벽·흙)가 크기와 상관없이 같은 크기로
  const uvOf = (v, n) => Math.abs(n[1]) > 0.6 ? [v[0] / 4, v[2] / 4] : Math.abs(n[0]) >= Math.abs(n[2]) ? [v[2] / 4, v[1] / 4] : [v[0] / 4, v[1] / 4];
  const tri = (B, a, b, c, n, ca, cb = ca, cc = ca) => { B.p.push(...a, ...b, ...c); B.n.push(...n, ...n, ...n); B.c.push(...ca, ...cb, ...cc); B.u.push(...uvOf(a, n), ...uvOf(b, n), ...uvOf(c, n)); };
  const nrm = (a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  const quad = (B, a, b, c, d, col, shade = [1, 1, 1, 1]) => { const n = nrm(a, b, c); const k = i => col.map(v => v * shade[i]); tri(B, a, b, c, n, k(0), k(1), k(2)); tri(B, a, c, d, n, k(0), k(2), k(3)); };
  // 상자: 가운데 아래(cx, y0, cz) · 크기 · ry(라디안) · 색 · 아래쪽은 조금 어둡게(그림체 — 학교 AO와 비슷하게)
  function box(cx, y0, cz, sx, sy, sz, ry, hex, o = {}) {
    const B = o.B || bucket(cx, cz), c = Math.cos(ry), s = Math.sin(ry), hx = sx / 2, hz = sz / 2, col = Array.isArray(hex) ? hex : rgb(hex), top = o.top ? rgb(o.top) : col;
    const P = (lx, ly, lz) => [cx + lx * c + lz * s, y0 + ly, cz - lx * s + lz * c], lo = o.ao ?? 0.84, sh = [lo, lo, 1, 1];
    const v = [P(-hx, 0, -hz), P(hx, 0, -hz), P(hx, 0, hz), P(-hx, 0, hz), P(-hx, sy, -hz), P(hx, sy, -hz), P(hx, sy, hz), P(-hx, sy, hz)];
    quad(B, v[4], v[7], v[6], v[5], top);                                   // 위
    if (!o.noSide) { quad(B, v[3], v[2], v[6], v[7], col, sh); quad(B, v[1], v[0], v[4], v[5], col, sh); quad(B, v[2], v[1], v[5], v[6], col.map(x => x * 0.94), sh); quad(B, v[0], v[3], v[7], v[4], col.map(x => x * 0.94), sh); }
    if (o.bottom) quad(B, v[0], v[1], v[2], v[3], col.map(x => x * 0.6));
  }
  // 박공지붕: 용마루 = 긴 변 방향 · 처마 0.45m
  function gable(cx, y0, cz, sx, sz, h, ry, hex, o = {}) {
    const B = bucket(cx, cz), alongX = sx >= sz, c = Math.cos(ry), s = Math.sin(ry), e = o.eave ?? 0.45, hx = sx / 2 + e, hz = sz / 2 + e, col = rgb(hex), col2 = col.map(v => v * 0.86), wall = rgb(o.wall ?? 0xf3ead8);
    const P = (lx, ly, lz) => [cx + lx * c + lz * s, y0 + ly, cz - lx * s + lz * c];
    if (alongX) { const r0 = P(-hx, h, 0), r1 = P(hx, h, 0); quad(B, P(-hx, 0, hz), P(hx, 0, hz), r1, r0, col); quad(B, P(hx, 0, -hz), P(-hx, 0, -hz), r0, r1, col2);
      const a = [P(hx - e, 0, sz / 2), P(hx - e, 0, -sz / 2), P(hx - e, h - 0.05, 0)], b = [P(-hx + e, 0, -sz / 2), P(-hx + e, 0, sz / 2), P(-hx + e, h - 0.05, 0)];
      tri(B, a[0], a[1], a[2], nrm(a[0], a[1], a[2]), wall); tri(B, b[0], b[1], b[2], nrm(b[0], b[1], b[2]), wall); }
    else { const r0 = P(0, h, -hz), r1 = P(0, h, hz); quad(B, P(hx, 0, hz), P(hx, 0, -hz), r0, r1, col); quad(B, P(-hx, 0, -hz), P(-hx, 0, hz), r1, r0, col2);
      const a = [P(-sx / 2, 0, hz - e), P(sx / 2, 0, hz - e), P(0, h - 0.05, hz - e)], b = [P(sx / 2, 0, -hz + e), P(-sx / 2, 0, -hz + e), P(0, h - 0.05, -hz + e)];
      tri(B, a[0], a[1], a[2], nrm(a[0], a[1], a[2]), wall); tri(B, b[0], b[1], b[2], nrm(b[0], b[1], b[2]), wall); }
  }
  function cyl(cx, y0, cz, r, h, hex, seg = 8, o = {}) { const B = bucket(cx, cz), col = rgb(hex), top = rgb(o.top ?? hex);
    for (let i = 0; i < seg; i++) { const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, p = (a, y) => [cx + Math.cos(a) * r, y0 + y, cz + Math.sin(a) * r];
      quad(B, p(a1, 0), p(a0, 0), p(a0, h), p(a1, h), col, [0.85, 0.85, 1, 1]); tri(B, [cx, y0 + h, cz], p(a1, h), p(a0, h), [0, 1, 0], top); } }
  const flat = (x0, z0, x1, z1, y, hex, o = {}) => { const B = o.B || bucket((x0 + x1) / 2, (z0 + z1) / 2), col = rgb(hex); quad(B, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col); };
  // 땅에 붙은 띠(길·인도·선) — a→b, 너비 w, 땅 위 dy · 5m마다 땅을 따라감
  function strip(a, b, w, dy, hex, o = {}) {
    const L0 = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L0 < 0.05) return; const tx = (b[0] - a[0]) / L0, tz = (b[1] - a[1]) / L0, px = -tz * w / 2, pz = tx * w / 2, n = Math.max(1, Math.ceil(L0 / (o.step || 5))), col = rgb(hex);
    for (let i = 0; i < n; i++) { const T0 = i / n * L0, T1 = (i + 1) / n * L0;
      if (o.skip && o.skip(a[0] + tx * (T0 + T1) / 2, a[1] + tz * (T0 + T1) / 2)) continue;
      let parts = [[T0, T1]]; if (o.cut) for (const [c0, c1] of o.cut) parts = parts.flatMap(([u0, u1]) => c1 <= u0 || c0 >= u1 ? [[u0, u1]] : [[u0, c0], [c1, u1]].filter(([v0, v1]) => v1 - v0 > 0.05));   // 다리 판 구간은 딱 맞게 잘라 냄(틈 없음)
      for (const [t0, t1] of parts) { const x0 = a[0] + tx * t0, z0 = a[1] + tz * t0, x1 = a[0] + tx * t1, z1 = a[1] + tz * t1;
      const y = (x, z) => (o.y != null ? o.y : ty(x, z)) + dy, B = bucket((x0 + x1) / 2, (z0 + z1) / 2);
      const p0 = [x0 + px, y(x0 + px, z0 + pz), z0 + pz], p1 = [x1 + px, y(x1 + px, z1 + pz), z1 + pz], p2 = [x1 - px, y(x1 - px, z1 - pz), z1 - pz], p3 = [x0 - px, y(x0 - px, z0 - pz), z0 - pz];
      quad(B, p0, p1, p2, p3, col); } } }

  // ───────── 길: 테이프 → 차도(아스팔트) · 인도 · 가운데 선 · 건널목 · 물 위 = 다리 ─────────
  function prepRoads() {
    const edgeShift = (p, hw) => { const T9 = 1.2; let [x, z] = [X(p[0]), Z(p[1])]; if (p[1] >= MS[1] - T9 && p[1] <= MS[3] + T9) { if (Math.abs(p[0] - MS[0]) < T9) x = SR[0] - hw - 1; else if (Math.abs(p[0] - MS[2]) < T9) x = SR[2] + hw + 1; }
      if (p[0] >= MS[0] - T9 && p[0] <= MS[2] + T9) { if (Math.abs(p[1] - MS[3]) < T9) z = SR[3] + hw + 1; else if (Math.abs(p[1] - MS[1]) < T9 && MS[1] > 0.5) z = SR[1] - hw - 1; } return [x, z]; };   // 학교 칸 변 위 = 담 바깥(학교를 파고들지 않게)
    const onEdgeLine = (r) => { const P = r.pts || [r.a, r.b], T9 = 1.2; return P.length === 2 && ((Math.abs(P[0][0] - P[1][0]) < 0.5 && (Math.abs(P[0][0] - MS[0]) < T9 || Math.abs(P[0][0] - MS[2]) < T9)) || (Math.abs(P[0][1] - P[1][1]) < 0.5 && (Math.abs(P[0][1] - MS[3]) < T9 || (Math.abs(P[0][1] - MS[1]) < T9 && MS[1] > 0.5)))); };
    ROADS = L.roads.map((r, ri) => ({ ...r, ri, P: (r.pts || [r.a, r.b]).map(p => onEdgeLine(r) ? (() => { const hw0 = (r.wm || D.roadWm || (r.w || D.roadW || 2.4) * S) / 2, q = [p[0], p[1]], P2 = r.pts || [r.a, r.b], vert = Math.abs(P2[0][0] - P2[1][0]) < 0.5; if (vert) q[1] = MS[1] + 1; else q[0] = MS[0] + 1; const sh = edgeShift(q, hw0); return vert ? [sh[0], Z(p[1])] : [X(p[0]), sh[1]]; })() : [X(p[0]), Z(p[1])]), hw: (r.wm || D.roadWm || (r.w || D.roadW || 2.4) * S) / 2, big: r.big != null ? !!r.big : (r.wm || D.roadWm || (r.w || D.roadW || 2.4) * S) >= 18 }));
    RSEG = []; for (const r of ROADS) for (let i = 0; i < r.P.length - 1; i++) RSEG.push({ r, a: r.P[i], b: r.P[i + 1], hw: r.hw });
  }
  const onRoad = (x, z, pad = 0, except = null) => { for (const s of RSEG) if (s.r !== except && segD(x, z, s.a, s.b)[0] < s.hw + pad) return s; return null; };
  const BRIDGES = [];
  function drawRoads() {
    if (LOOK === 'mat') { for (const s of RSEG) { const cut = bridgesOn(s); strip(s.a, s.b, s.hw * 2, 0.08, 0xc8352e, { skip: (x, z) => inSchool(x, z), cut, step: 5 }); } return; }   // 🧱 매트 모습: 길 = 빨간 테이프 그대로
    for (const s of RSEG) {
      const { a, b, hw, r } = s, sw = r.big ? 2.2 : 1.4, cw = hw - sw;   // 인도 폭 · 차도 반폭
      const cut = bridgesOn(s), L0 = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L0, tz = (b[1] - a[1]) / L0, px = -tz, pz = tx;   // 다리 먼저 → 다리 판 구간은 길 띠에서 잘라 냄
      const skipSchool = (x, z) => inSchool(x, z), overW = (x, z) => { const t = (x - a[0]) * tx + (z - a[1]) * tz; return cut.some(([c0, c1]) => t > c0 - 0.5 && t < c1 + 0.5); };
      strip(a, b, cw * 2, 0.06, r.big ? 0x5d6166 : 0x6a6e73, { skip: skipSchool, cut });
      for (const sg of [-1, 1]) { const o = sg * (cw + sw / 2), A = [a[0] + px * o, a[1] + pz * o], B9 = [b[0] + px * o, b[1] + pz * o];
        strip(A, B9, sw, 0.14, 0xc9c4b8, { skip: (x, z) => skipSchool(x, z) || !!onRoad(x, z, -0.2, r), cut });                    // 인도(보도블록)
        const oc = sg * (cw + 0.12), Ac = [a[0] + px * oc, a[1] + pz * oc], Bc = [b[0] + px * oc, b[1] + pz * oc];
        strip(Ac, Bc, 0.24, 0.2, 0xe2ded4, { skip: (x, z) => skipSchool(x, z) || !!onRoad(x, z, -0.2, r), cut }); }             // 연석
      // 가운데 선: 큰길 = 노란 두 줄 · 작은길 = 흰 점선(교차로 안은 그리지 않음)
      const skipX = (x, z) => skipSchool(x, z) || overW(x, z) || !!onRoad(x, z, 0.5, r);
      if (r.big) for (const sg of [-1, 1]) { const o = sg * 0.18; strip([a[0] + px * o, a[1] + pz * o], [b[0] + px * o, b[1] + pz * o], 0.16, 0.075, 0xf2c230, { skip: skipX, step: 3 }); }
      else for (let t = 1; t < L0 - 2; t += 6) { const p0 = [a[0] + tx * t, a[1] + tz * t], p1 = [a[0] + tx * (t + 3), a[1] + tz * (t + 3)]; if (!skipX((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)) strip(p0, p1, 0.15, 0.075, 0xf4f2ea, { step: 3 }); }
    }
    // 교차로 모퉁이: 두 길의 인도가 만나는 네모를 보도로 채움 + 연석 모서리(길의 기본 구성 — 생활 시설 아님)
    for (const c of crossings(false)) { const FA = segFrame(c.A), FB = segFrame(c.B), cwA = c.A.hw - FA.sw, cwB = c.B.hw - FB.sw;
      for (const [sa, sb] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const x = c.x + FA.px * sa * (cwA + FA.sw / 2) + FB.px * sb * (cwB + FB.sw / 2), z = c.z + FA.pz * sa * (cwA + FA.sw / 2) + FB.pz * sb * (cwB + FB.sw / 2);
        if (inSchool(x, z) || wAt(x, z)) continue; box(x, ty(x, z) + 0.02, z, FB.sw + 0.05, 0.14, FA.sw + 0.05, Math.atan2(-FA.tz, FA.tx), 0xc9c4b8, { top: 0xc9c4b8 });
        const kx = c.x + FA.px * sa * (cwA + 0.12) + FB.px * sb * (cwB + 0.12), kz = c.z + FA.pz * sa * (cwA + 0.12) + FB.pz * sb * (cwB + 0.12); box(kx, ty(kx, kz) + 0.05, kz, 0.3, 0.16, 0.3, 0, 0xe2ded4); } }
  }
  // ───────── 길 × 물 건너는 곳(교사 10-13 '다리를 어디에 놓을지는 아이들이 정함') ─────────
  //   큰길 = 다리 저절로(✨ 처음 계획 '큰길 테이프가 강을 지나는 곳 = 다리') · 작은길 = 강가에서 끊김(막다른 길 · 줄무늬 차단봉 · 길 찾기도 끊김) — 아이가 '다리' 소품을 놓은 곳만 다리(🧱)
  //   건너는 곳 = 길 폭 전체(가운데·양 가장자리)로 물 깊이가 닿는 구간 + 1.5m(물 칸이 실제로 있을 때만) · 길 띠는 이 구간을 정확히 잘라 냄
  let XCROSS = [];
  function wetRanges(s) { const { a, b } = s, L0 = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L0, tz = (b[1] - a[1]) / L0, px = -tz, pz = tx, n = Math.ceil(L0), R = []; let on = -1, hit = false;
    const wet = (x, z) => [0, s.hw, -s.hw].some(o => wdI(x + px * o, z + pz * o) > 0.02), water = (x, z) => [0, s.hw, -s.hw].some(o => wAt(x + px * o, z + pz * o) > 0);
    for (let i = 0; i <= n; i++) { const t = i / n * L0, x = a[0] + tx * t, z = a[1] + tz * t, w = i < n && wet(x, z);
      if (w && on < 0) { on = Math.max(0, t - 1.5); hit = false; } if (w && water(x, z)) hit = true;
      if ((!w || i === n) && on >= 0) { if (hit) R.push([on, Math.min(L0, t + 1.5)]); on = -1; } } return R; }
  function prepCross() {
    XCROSS = []; for (const s of RSEG) { const L0 = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]); s.L0 = L0;
      s.wr = wetRanges(s).map(([t0, t1]) => { const tm = (t0 + t1) / 2, X9 = { s, t0, t1, c: [s.a[0] + (s.b[0] - s.a[0]) * tm / L0, s.a[1] + (s.b[1] - s.a[1]) * tm / L0], br: s.r.big ? 'auto' : null }; XCROSS.push(X9); return X9; }); }
    // 아이 '다리' 소품 → 가장 가까운 건너는 곳(그 길에서 떨어진 만큼 더해 셈 · 80m = 판 16cm 안 · road: '길 id'면 그 길만) · 없으면 놓은 자리 물에 걸친 나무다리(걷는 다리)
    for (const P of PROPS) { if (P.k !== 'bridge') continue; if (P.src.stones) { P.foot = true; continue; } let best = null, bd = 80;   // 돌다리(stones) = 놓은 자리 그대로(길에 붙이지 않음)
      for (const X9 of XCROSS) { if (X9.br === 'kid' || (P.road && X9.s.r.id !== P.road)) continue; const d = Math.hypot(X9.c[0] - P.x, X9.c[1] - P.z) + segD(P.x, P.z, X9.s.a, X9.s.b)[0]; if (d < bd) { bd = d; best = X9; } }
      if (best) { best.br = 'kid'; best.prop = P; P.cross = best; } else P.foot = true; }
  }
  function bridgesOn(s) {   // 다리(건너는 곳마다 · 큰길 저절로 · 아이 다리) 또는 막다른 길 — 길 띠에서 잘라 낼 구간을 돌려줌
    const { a, b } = s, L0 = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L0, tz = (b[1] - a[1]) / L0, px = -tz, pz = tx;
    for (const X9 of s.wr || []) { if (X9.br) bridge(s, X9.t0, X9.t1, tx, tz, px, pz, X9.br === 'kid'); else deadEnd(s, X9, L0, tx, tz, px, pz); }
    return (s.wr || []).map(X9 => [X9.t0, X9.t1]); }
  function deadEnd(s, X9, L0, tx, tz, px, pz) {   // 다리 없는 길: 끊긴 끝마다 줄무늬 차단봉(빨강·하양) — "여기 길이 끊겼네, 다리가 있어야겠다"
    const ry = Math.atan2(-pz, px), hw = s.hw;
    for (const [t, sg] of [[X9.t0, -1], [X9.t1, 1]]) { if (t < 0.6 || t > L0 - 0.6) continue; const x = s.a[0] + tx * (t + sg * 0.7), z = s.a[1] + tz * (t + sg * 0.7), y = ty(x, z);
      for (const o of [-(hw - 0.5), hw - 0.5]) box(x + px * o, y, z + pz * o, 0.14, 1.05, 0.14, 0, 0x5f666d);
      const n = Math.max(2, Math.round((hw - 0.5) * 2 / 0.9)), L9 = (hw - 0.5) * 2 / n; for (let k = 0; k < n; k++) { const o = -(hw - 0.5) + L9 * (k + 0.5); box(x + px * o, y + 0.72, z + pz * o, L9, 0.24, 0.1, ry, k % 2 ? 0xf4f2ea : 0xe0453a); }
      PCOL.push(col9(x, z, hw - 0.4, 0.15, ry, y - 1, y + 1.1)); } }
  const segX = (a, b, c, d) => { const r1 = [b[0] - a[0], b[1] - a[1]], r2 = [d[0] - c[0], d[1] - c[1]], den = r1[0] * r2[1] - r1[1] * r2[0]; if (Math.abs(den) < 1e-9) return null;
    const t = ((c[0] - a[0]) * r2[1] - (c[1] - a[1]) * r2[0]) / den, u = ((c[0] - a[0]) * r1[1] - (c[1] - a[1]) * r1[0]) / den; return t >= -0.001 && t <= 1.001 && u >= -0.001 && u <= 1.001 ? { t, u, x: a[0] + r1[0] * t, z: a[1] + r1[1] * t } : null; };
  const markBR = (x0, z0, x1, z1) => { const [i0, j0, i1, j1] = nodeRange([x0, z0, x1, z1]); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = nx(i), z = nz(j); if (x >= x0 - 0.5 && x <= x1 + 0.5 && z >= z0 - 0.5 && z <= z1 + 0.5) BRM[j * NX + i] = 1; } };
  function bridge(s, t0, t1, tx, tz, px, pz, kid = false) {   // kid = 아이가 놓은 다리(손잡이·기둥 = 나무색 — 우리가 놓은 다리를 알아보게) · 길과 같은 높이로 이어짐(차선·인도·연석이 다리 위로 계속)
    const { a, hw } = s, len = t1 - t0, cx = a[0] + tx * (t0 + t1) / 2, cz = a[1] + tz * (t0 + t1) / 2, ry = Math.atan2(-tz, tx), top = TY + 0.1, big = s.r.big, sw = big ? 2.2 : 1.4, cw = hw - sw, P = (u, v) => [cx + tx * u + px * v, cz + tz * u + pz * v];
    box(cx, top - 0.55, cz, len, 0.55, hw * 2, ry, 0xb7b2a6, { top: big ? 0x5d6166 : 0x6a6e73, bottom: true });   // 상판(아스팔트)
    for (const sg of [-1, 1]) { const [sx, sz] = P(0, sg * (cw + sw / 2)); box(sx, top, sz, len, 0.15, sw, ry, 0xc9c4b8, { top: 0xc9c4b8 }); const [kx, kz] = P(0, sg * (cw + 0.06)); dbx(kx, top, kz, len, 0.17, 0.12, ry, 0xe2ded4); }   // 인도 · 연석
    if (big) for (const sg of [-1, 1]) { const [lx, lz] = P(0, sg * 0.18); box(lx, top + 0.005, lz, len, 0.01, 0.16, ry, 0xf2c230, { noSide: true }); }
    else for (let u = -len / 2 + 1; u < len / 2 - 2; u += 6) { const [lx, lz] = P(u + 1.5, 0); box(lx, top + 0.005, lz, 3, 0.01, 0.15, ry, 0xf4f2ea, { noSide: true }); }   // 가운데 선
    box(cx, top - 1.25, cz, len, 0.7, hw * 2 - 1.2, ry, 0x9d998e);   // 거더(상판 아래 보)
    const nP = Math.max(0, Math.floor(len / 18)); for (let k = 1; k <= nP; k++) { const u = -len / 2 + k * len / (nP + 1); for (const sg of [-1, 1]) { const [qx, qz] = P(u, sg * (hw - 2.2)); cyl(qx, TY + WLY - 1.5, qz, 0.55, top - 1.25 - (TY + WLY - 1.5), 0xa9a499, 10); } const [hx, hz] = P(u, 0); box(hx, top - 1.6, hz, 1.4, 0.4, hw * 2 - 1.6, ry, 0x9d998e); }   // 교각(물속 기둥 + 머리 보)
    for (const sg of [-1, 1]) { const ox = cx + px * sg * (hw - 0.15), oz = cz + pz * sg * (hw - 0.15), y9 = top + 0.15;
      box(ox, y9, oz, len, 0.95, 0.12, ry, kid ? 0xf2e2c4 : 0xf4f2ea, { noSide: false }); box(ox, y9 + 0.95, oz, len + 0.1, 0.12, 0.22, ry, kid ? 0x9b6a3c : 0x7a8592);   // 난간 판 + 손잡이
      for (let k = -len / 2 + 0.6; k <= len / 2 - 0.5; k += 2.4) box(ox + tx * k, y9, oz + tz * k, 0.22, 1.07, 0.22, ry, kid ? 0x7a5232 : 0x7a8592);
      if (!kid && len > 14) for (const u of [-len / 2 + 3, len / 2 - 3]) { const [lx, lz] = P(u, sg * (hw - 0.45)); streetlight(lx, lz, Math.atan2(-px * sg, -pz * sg), y9); } }   // 다리 가로등
    const xs = [a[0] + tx * t0 + px * hw, a[0] + tx * t0 - px * hw, a[0] + tx * t1 + px * hw, a[0] + tx * t1 - px * hw], zs = [a[1] + tz * t0 + pz * hw, a[1] + tz * t0 - pz * hw, a[1] + tz * t1 + pz * hw, a[1] + tz * t1 - pz * hw];
    BRIDGES.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y1: top }); markBR(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs));
  }

  // ───────── 땅 메시(구역마다 하나 · 공유 정점 · 높이 기울기로 부드러운 음영) ─────────
  const FPC = rgb(0x8fbf62), capColor = (x, z) => FPC.map(v => v * (0.92 + 0.12 * vnoise(x / 17, z / 17)));   // 둔치 풀색(땅 격자·덮개 같은 식)
  function groundColor(k, x, z) {
    const h = HF[k], wd = WD[k], n1 = vnoise(x / 17, z / 17), n2 = vnoise(x / 5.3 + 31, z / 5.3);
    let c = mix(PAL.grass[0], PAL.grass[1], n1 * 0.8 + n2 * 0.2);
    if (h > 0.4) { const t = Math.min(1, h / 30); c = c.map((v, i) => v + (rgb(PAL.hill)[i] - v) * t * 0.85); if (h > 56) { const r = rgb(PAL.rock), t2 = Math.min(1, (h - 56) / 16) * (0.35 + 0.5 * n2); c = c.map((v, i) => v + (r[i] - v) * t2); } }   // 산 = 숲 초록 · 바위빛은 꼭대기 근처만
    if (GTW[k] > 0) { const t = GTW[k]; c = c.map((v, i) => v + (GT[k * 3 + i] * (0.94 + 0.12 * n2) - v) * t); }   // 공원·풀밭·모래 물감
    if (SDW[k] < FPW + 6) { if (SDW[k] < 2.5) c = rgb(PAL.bed).map(v => v * (0.9 + 0.1 * n2)); else { const t = Math.min(1, wd / FPD); c = c.map((v, i) => v + (FPC[i] * (0.92 + 0.12 * n1) - v) * t); } }   // 물 바닥 · 둔치·둑(둔치 덮개와 같은 색 — 경계가 안 보이게)
    else if (wd > 0.02) { const t = Math.min(1, wd / 0.5), bank = rgb(PAL.bank), bed = rgb(PAL.bed); c = WK[k] ? bed.map(v => v * (0.9 + 0.1 * n2)) : c.map((v, i) => v + (bank[i] - v) * t); }
    const sl = Math.min(1, Math.hypot((HF[k + 1 < NN ? k + 1 : k] - HF[k > 0 ? k - 1 : k]), (HF[k + NX < NN ? k + NX : k] - HF[k - NX >= 0 ? k - NX : k])) / (G * 2) * 1.6);
    if (sl > 0.3) { const r = rgb(0x8a7a58); c = c.map((v, i) => v + (r[i] - v) * (sl - 0.3) * 0.7); }
    return c;
  }
  function prepTints() {   // 들 물감(공원·풀밭·모래) → 꼭짓점 · 가장자리는 부드럽게
    GT.fill(0); GTW.fill(0); const HEX = { park: 0x8fd06a, grass: 0x9ccf72, sand: 0xe6d3a0, lawn: 0x86c95c };
    for (const it of L.nature) { if (it.k !== 'field' && it.k !== 'sand') continue; const sub = it.k === 'sand' ? 'sand' : it.sub || 'grass'; if (!HEX[sub]) continue; const sh = shapeOf(it); if (!sh) continue; const col = rgb(HEX[sub]), [i0, j0, i1, j1] = nodeRange(bboxOf(sh), 2);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = nx(i), z = nz(j), k = j * NX + i; if (!inShape(sh, x, z) || WK[k]) continue; const e = sh.rect ? edgeD(sh, x, z) : 3, w = Math.min(1, 0.35 + e / 4) * 0.85; if (w > GTW[k]) { GTW[k] = w; GT[k * 3] = col[0]; GT[k * 3 + 1] = col[1]; GT[k * 3 + 2] = col[2]; } } } }
  function drawGround(group) {
    const RN = Math.round(REG / G);
    for (let rj = 0; rj * RN < NZ - 1; rj++) for (let ri = 0; ri * RN < NX - 1; ri++) {
      const i0 = ri * RN, j0 = rj * RN, i1 = Math.min(NX - 1, i0 + RN), j1 = Math.min(NZ - 1, j0 + RN), w = i1 - i0 + 1, hh = j1 - j0 + 1;
      const pos = new Float32Array(w * hh * 3), nor = new Float32Array(w * hh * 3), col = new Float32Array(w * hh * 3), uv = new Float32Array(w * hh * 2), idx = [];
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * NX + i, v = ((j - j0) * w + (i - i0)) * 3, x = nx(i), z = nz(j);
        pos[v] = x; pos[v + 1] = TY + HF[k]; pos[v + 2] = z; uv[v / 3 * 2] = x / 6.5; uv[v / 3 * 2 + 1] = z / 6.5;
        const hx = (HF[j * NX + Math.min(NX - 1, i + 1)] - HF[j * NX + Math.max(0, i - 1)]) / (2 * G), hz = (HF[Math.min(NZ - 1, j + 1) * NX + i] - HF[Math.max(0, j - 1) * NX + i]) / (2 * G), l = Math.hypot(hx, 1, hz);
        nor[v] = -hx / l; nor[v + 1] = 1 / l; nor[v + 2] = -hz / l; const c = groundColor(k, x, z); col[v] = c[0]; col[v + 1] = c[1]; col[v + 2] = c[2]; }
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) { const x0 = nx(i), z0 = nz(j);
        if (x0 + G > SR[0] && x0 < SR[2] && z0 + G > SR[1] && z0 < SR[3]) continue;   // 학교 상자에 걸친 칸은 비움(학교 땅 그대로)
        const a = (j - j0) * w + (i - i0), b = a + 1, c = a + w, d = c + 1; idx.push(a, d, b, a, c, d); }
      if (!idx.length) continue;
      const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.BufferAttribute(nor, 3)); g.setAttribute('color', new T3.BufferAttribute(col, 3)); g.setAttribute('uv', new T3.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere(); g.computeBoundingBox();
      const m = new T3.Mesh(g, MAT.ground); m.matrixAutoUpdate = false; m.receiveShadow = true; m.userData.fx = 1; group.add(m); GEOS.push(g); }
  }

  // ───────── 물: 강 = 흐르는 띠(물결 무늬가 흐름 방향으로) · 연못 = 칸 판 · 물가 밝게 ─────────
  function rippleTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128);
    const R = rng0(7); for (let i = 0; i < 46; i++) { const x = R() * 128, y = R() * 128, w = 10 + R() * 26; g.strokeStyle = 'rgba(200,235,255,' + (0.35 + R() * 0.5) + ')'; g.lineWidth = 1.2 + R() * 1.8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 3 - R() * 3, x + w, y); g.stroke();
      for (const dx of [-128, 128]) { g.beginPath(); g.moveTo(x + dx, y); g.quadraticCurveTo(x + dx + w / 2, y - 3, x + dx + w, y); g.stroke(); } }
    const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; t.colorSpace = T3.SRGBColorSpace; TEX.push(t); return t; }
  function drawWater(group) {
    const WY = TY - 0.22, WYR = TY - 1.0, deep = rgb(0x2f8fa8), shallow = rgb(0x7fd0d8), foam = rgb(0xdff6f4);   // 연못 물낯 · 강 물낯(둔치 아래)
    // 강(띠): 점마다 왼쪽·오른쪽 · u = 가로(물가 0/1) · v = 흐름 길이(m/6)
    { const P = [], N = [], C = [], U = [], I = [];
      const PONDS = L.nature.filter(n => n.k === 'water' && !n.line).map(n => shapeOf(n)).filter(Boolean);
      for (const it of L.nature) { if (it.k !== 'water' || !it.line) continue; const sh = shapeOf(it), Q = densify(sh.line, 4), hw = sh.w / 2 + 1.2, inP = q => PONDS.some(ps => inShape(ps, q[0], q[1]) && edgeD(ps, q[0], q[1]) > hw + 2); let along = 0;   // 호수 깊이 들어간 강 띠는 그리지 않음(호수 물낯과 겹치지 않게)
        for (let i = 0; i < Q.length; i++) { const p = Q[i], q = Q[Math.min(Q.length - 1, i + 1)], o = Q[Math.max(0, i - 1)], dx = q[0] - o[0], dz = q[1] - o[1], l = Math.hypot(dx, dz) || 1, px = -dz / l, pz = dx / l;
          if (i) along += Math.hypot(p[0] - Q[i - 1][0], p[1] - Q[i - 1][1]); const base = P.length / 3;
          for (const [sg, u] of [[1, 0], [0.55, 0.22], [0, 0.5], [-0.55, 0.78], [-1, 1]]) { P.push(p[0] + px * hw * sg, WYR, p[1] + pz * hw * sg); N.push(0, 1, 0); const e = Math.abs(sg), c = e > 0.9 ? foam : e > 0.5 ? shallow : deep; C.push(...c); U.push(u * 1.2, along / 7); }
          if (i && !(inP(p) && inP(Q[i - 1]))) { const b0 = base - 5; for (let k = 0; k < 4; k++) I.push(b0 + k, base + k, b0 + k + 1, b0 + k + 1, base + k, base + k + 1); } } }
      if (I.length) { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeBoundingSphere(); GEOS.push(g);
        const m = new T3.Mesh(g, MAT.river); m.matrixAutoUpdate = false; m.userData.fx = 1; group.add(m); } }
    // 연못·호수: 모양(다각형) 그대로 한 장 — 가장자리를 2.5m 밖으로 늘려 물가 = 땅과 물이 만나는 곳(5m 칸 계단이 안 보이게) · 가운데 깊은 색 → 물가 밝게
    { const P = [], N = [], C = [], U = [], push = (p9, c9) => { P.push(p9[0], WY + 0.004, p9[1]); N.push(0, 1, 0); C.push(...c9); U.push(p9[0] / 9, p9[1] / 9); };
      for (const it of L.nature) { if (it.k !== 'water' || it.line) continue; const sh = shapeOf(it); if (!sh) continue; const WY = WYR; const poly = sh.rect ? [[sh.rect[0], sh.rect[1]], [sh.rect[2], sh.rect[1]], [sh.rect[2], sh.rect[3]], [sh.rect[0], sh.rect[3]]] : sh.poly;
        const cx = poly.reduce((a, q) => a + q[0], 0) / poly.length, cz = poly.reduce((a, q) => a + q[1], 0) / poly.length, Q = densify([...poly, poly[0]], 4).slice(0, -1), out9 = Q.map(q => { const dx = q[0] - cx, dz = q[1] - cz, l = Math.hypot(dx, dz) || 1; return [q[0] + dx / l * 2.5, q[1] + dz / l * 2.5]; }), mid = Q.map(q => [cx + (q[0] - cx) * 0.55, cz + (q[1] - cz) * 0.55]);
        for (let i = 0; i < Q.length; i++) { const j = (i + 1) % Q.length; push([cx, cz], deep); push(mid[j], deep); push(mid[i], deep);
          push(mid[i], deep); push(mid[j], deep); push(Q[j], shallow); push(mid[i], deep); push(Q[j], shallow); push(Q[i], shallow);
          push(Q[i], shallow); push(Q[j], shallow); push(out9[j], foam); push(Q[i], shallow); push(out9[j], foam); push(out9[i], foam); } }
      if (P.length) { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); g.computeBoundingSphere(); GEOS.push(g);
        const m = new T3.Mesh(g, MAT.pond); m.matrixAutoUpdate = false; m.userData.fx = 1; group.add(m); } }
  }
  const densify = (P, step) => { const out = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return out; };

  // ───────── 나무 4종(둥근 활엽수 · 소나무 · 미루나무 · 떨기나무) + 과일 · 꽃 — 인스턴스(종류마다 2메시) · 바람에 흔들림(셰이더) ─────────
  const TREES = { round: [], pine: [], poplar: [], bush: [], fruit: [], flower: [] };
  const addTree = (sp, x, z, s = 1, hex = null, ry = 0) => { if (inSchool(x, z) || wAt(x, z) || onRoad(x, z, 1.2)) return false; TREES[sp].push({ x, y: ty(x, z), z, s, hex, ry }); return true; };
  function treeGeo(sp) {   // 줄기 · 수관(정점색 = 흰색 위 명암 — 인스턴스 색이 곱해짐)
    const jit = (g, a, sd) => { const p = g.attributes.position, R = rng0(sd); for (let i = 0; i < p.count; i++) { const k = 1 + (R() - 0.5) * a; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } g.computeVertexNormals(); return g; };
    const shade = g => { const p = g.attributes.position, c = []; let y0 = 1e9, y1 = -1e9; for (let i = 0; i < p.count; i++) { y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); } for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - y0) / (y1 - y0 || 1), v = 0.72 + 0.32 * t; c.push(v, v, v); } g.setAttribute('color', new T3.Float32BufferAttribute(c, 3)); return g; };
    const merge = (...gs) => { const P = [], N = [], C = []; for (const g of gs) { const q = g.index ? g.toNonIndexed() : g.clone(); P.push(...q.attributes.position.array); N.push(...q.attributes.normal.array); C.push(...q.attributes.color.array); q.dispose(); g.dispose(); } const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); return g; };
    if (sp === 'round') return { trunk: shade(new T3.CylinderGeometry(0.16, 0.26, 2.6, 6, 1, true).translate(0, 1.3, 0)), crown: merge(shade(jit(new T3.IcosahedronGeometry(2.3, 0), 0.2, 3).translate(0, 3.9, 0)), shade(jit(new T3.IcosahedronGeometry(1.6, 0), 0.22, 5).translate(1.1, 4.9, 0.4)), shade(jit(new T3.IcosahedronGeometry(1.5, 0), 0.22, 9).translate(-1.0, 4.6, -0.6))) };
    if (sp === 'pine') return { trunk: shade(new T3.CylinderGeometry(0.14, 0.24, 2.0, 6, 1, true).translate(0, 1.0, 0)), crown: merge(shade(jit(new T3.ConeGeometry(2.1, 3.0, 7), 0.12, 2).translate(0, 3.0, 0)), shade(jit(new T3.ConeGeometry(1.7, 2.7, 7), 0.12, 4).translate(0, 4.6, 0)), shade(jit(new T3.ConeGeometry(1.15, 2.4, 7), 0.12, 6).translate(0, 6.1, 0))) };
    if (sp === 'poplar') return { trunk: shade(new T3.CylinderGeometry(0.13, 0.2, 2.2, 6, 1, true).translate(0, 1.1, 0)), crown: shade(jit(new T3.IcosahedronGeometry(1.4, 1), 0.18, 8).scale(1, 2.8, 1).translate(0, 5.6, 0)) };
    if (sp === 'bush') return { trunk: null, crown: merge(shade(jit(new T3.IcosahedronGeometry(0.9, 0), 0.25, 11).scale(1.3, 0.8, 1.1).translate(0, 0.6, 0)), shade(jit(new T3.IcosahedronGeometry(0.7, 0), 0.25, 13).translate(0.7, 0.75, 0.3))) };
    if (sp === 'fruit') return { trunk: null, crown: shade(new T3.OctahedronGeometry(0.24, 0)) };
    if (sp === 'flower') return { trunk: null, crown: shade(new T3.OctahedronGeometry(0.1, 0).scale(1, 0.7, 1).translate(0, 0.14, 0)) };   // 작은 꽃송이(땅에 붙게)
  }
  const TPL = {};   // 종류마다 본(정점 배열 · sw = 줄기 위로 올라간 만큼 — 바람에 흔들리는 무게)
  function tpl(sp, far) { const key = sp + (far ? ':f' : ''); if (TPL[key]) return TPL[key]; const gg = far ? treeGeoFar(sp) : treeGeo(sp), P = [], N = [], C = [], W = [], trunkTop = { round: 2.4, pine: 1.8, poplar: 2.0 }[sp] ?? 0;
    for (const [part, g] of [['trunk', gg.trunk], ['crown', gg.crown]]) { if (!g) continue; const q = g.index ? g.toNonIndexed() : g; if (!q.attributes.normal) q.computeVertexNormals(); const pa = q.attributes.position, na = q.attributes.normal, ca = q.attributes.color;
      for (let i = 0; i < pa.count; i++) { P.push(pa.getX(i), pa.getY(i), pa.getZ(i)); N.push(na.getX(i), na.getY(i), na.getZ(i)); const v = ca ? ca.getX(i) : 1; C.push(part === 'trunk' ? -v : v); W.push(part === 'trunk' ? 0 : Math.max(0, pa.getY(i) - trunkTop)); }
      if (q !== g) q.dispose(); g.dispose(); }
    return (TPL[key] = { P, N, C, W }); }
  function treeGeoFar(sp) {   // 먼 나무(LOD-1 · 180m 밖): 수관 한 덩이 + 네모 줄기 — 삼각형 ⅓
    const shade = g => { const p = g.attributes.position, c = []; let y0 = 1e9, y1 = -1e9; for (let i = 0; i < p.count; i++) { y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); } for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - y0) / (y1 - y0 || 1), v = 0.72 + 0.32 * t; c.push(v, v, v); } g.setAttribute('color', new T3.Float32BufferAttribute(c, 3)); return g; };
    if (sp === 'pine') return { trunk: shade(new T3.CylinderGeometry(0.16, 0.24, 2.0, 4, 1, true).translate(0, 1.0, 0)), crown: shade(new T3.ConeGeometry(2.0, 5.6, 6).translate(0, 4.4, 0)) };
    if (sp === 'poplar') return { trunk: shade(new T3.CylinderGeometry(0.13, 0.2, 2.2, 4, 1, true).translate(0, 1.1, 0)), crown: shade(new T3.IcosahedronGeometry(1.4, 0).scale(1, 2.8, 1).translate(0, 5.6, 0)) };
    return { trunk: shade(new T3.CylinderGeometry(0.18, 0.26, 2.6, 4, 1, true).translate(0, 1.3, 0)), crown: shade(new T3.IcosahedronGeometry(2.6, 0).translate(0, 4.2, 0)) }; }
  function drawTrees(group) {   // 가까운 구역 = 자세한 나무 + 떨기나무·꽃·열매 · 먼 구역(180m 밖) = 단순한 나무만(LOD-1 · tick이 바꿈)
    const TR = rgb(0x7a5636), FB = new Map(), fb = (x, z) => { const rx = Math.floor((x - TX0) / REG), rz = Math.floor((z - TZ0) / REG), k = rx + ':' + rz; let b = FB.get(k); if (!b) FB.set(k, b = { p: [], n: [], c: [], w: [] }); return b; };
    const put = (B, T9, t, sp, c, s9, k, col, hy) => { for (let i = 0; i < T9.P.length; i += 3) { const lx = T9.P[i] * k, ly = T9.P[i + 1] * k * hy, lz = T9.P[i + 2] * k; B.p.push(t.x + lx * c + lz * s9, t.y - 0.05 + ly, t.z - lx * s9 + lz * c);
      const nx9 = T9.N[i], nz9 = T9.N[i + 2]; B.n.push(nx9 * c + nz9 * s9, T9.N[i + 1], -nx9 * s9 + nz9 * c); const v = T9.C[i / 3]; if (v < 0) B.c.push(TR[0] * -v, TR[1] * -v, TR[2] * -v); else B.c.push(col[0] * v, col[1] * v, col[2] * v); B.w.push(T9.W[i / 3] * k * (sp === 'flower' ? 0.3 : 1)); } };
    for (const sp of Object.keys(TREES)) { const A = TREES[sp]; if (!A.length) continue; const T9 = tpl(sp), TF = sp === 'round' || sp === 'pine' || sp === 'poplar' ? tpl(sp, true) : null;
      for (const t of A) { const c = Math.cos(t.ry || 0), s9 = Math.sin(t.ry || 0), k = t.s || 1, col = rgb(t.hex ?? 0x4e9a43), hy = sp === 'fruit' || sp === 'flower' ? 1 : 0.92 + ((t.x * 3 + t.z) % 5 + 5) % 5 * 0.04;
        put(tbucket(t.x, t.z), T9, t, sp, c, s9, k, col, hy); if (TF) put(fb(t.x, t.z), TF, t, sp, c, s9, k, col, hy); } }
    const mk = (b, key, far) => { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.setAttribute('sw', new T3.Float32BufferAttribute(b.w, 1)); g.computeBoundingSphere(); GEOS.push(g);
      const m = new T3.Mesh(g, MAT.tree); m.matrixAutoUpdate = false; m.userData.fx = 1; group.add(m); const [rx, rz] = key.split(':').map(Number), e = TLOD.get(key) || { cx: TX0 + (rx + 0.5) * REG, cz: TZ0 + (rz + 0.5) * REG }; if (far) e.far = m; else e.near = m; TLOD.set(key, e); };
    TLOD.clear(); for (const [key, b] of TBK) if (b.p.length) mk(b, key, false); for (const [key, b] of FB) if (b.p.length) mk(b, key, true); lodTick(true);
  }
  const TLOD = new Map(); let lodQ = 0;
  function lodTick(force) { const cp = map.camera.position, topv = !!(map.top && map.top.on); for (const [, e] of TLOD) { const d = Math.hypot(cp.x - e.cx, cp.z - e.cz), nearOn = !topv ? d < 180 + REG * 0.5 : d < 260; if (!force && e.n9 === nearOn) continue; e.n9 = nearOn; if (e.near) e.near.visible = nearOn || !e.far; if (e.far) e.far.visible = !nearOn; } }
  const pickTree = (R, sub) => sub === 'pine' ? 'pine' : sub === 'broad' ? (R() < 0.85 ? 'round' : 'poplar') : R() < 0.5 ? 'round' : R() < 0.78 ? 'pine' : R() < 0.9 ? 'poplar' : 'bush';
  const treeHex = (sp, R) => sp === 'pine' ? PAL.pine[(R() * PAL.pine.length) | 0] : PAL.tree[(R() * PAL.tree.length) | 0];
  function scatter(sh, step, f, sd) { const [x0, z0, x1, z1] = bboxOf(sh), R = rng0(sd); for (let z = z0 + step / 2; z < z1; z += step) for (let x = x0 + step / 2; x < x1; x += step) { const px = x + (R() - 0.5) * step * 0.8, pz = z + (R() - 0.5) * step * 0.8; if (inShape(sh, px, pz)) f(px, pz, R); } }

  // ───────── 들: 논(물 비친 줄 + 벼 줄) · 밭(이랑) · 과수원(줄 맞춘 과일나무) · 공원·풀밭(밝은 잔디 + 꽃 + 나무) ─────────
  function drawNature() {
    for (const it of L.nature) { const sh = shapeOf(it); if (!sh) continue; const sd = hashS(it.id || it.name || it.k);
      if (it.k === 'forest') { scatter(sh, 6.5, (x, z, R) => { const sp = pickTree(R, it.sub); addTree(sp, x, z, 0.8 + R() * 0.55, treeHex(sp, R), R() * 6); if (R() < 0.25) addTree('bush', x + 2, z + 1.5, 0.8 + R() * 0.4, treeHex('bush', R)); }, sd); continue; }
      if (it.k === 'hill') { scatter(sh, 7, (x, z, R) => { if (x < TX0 + 3 || x > TX1 - 3 || z < TZ0 + 3 || z > TZ1 - 3) return; const h = tH(x, z), pr = Math.min(0.92, 0.18 + h / 38) * (0.55 + 0.9 * vnoise(x / 47, z / 47));   // 산 숲: 높을수록 빽빽 · 숲 경계는 잡음(칸 모양이 안 보이게)
        if (R() < pr) { const sp = R() < 0.35 + Math.min(0.4, h / 120) ? 'pine' : R() < 0.85 ? 'round' : 'poplar'; addTree(sp, x, z, 0.85 + R() * 0.55, treeHex(sp, R), R() * 6); } }, sd); continue; }
      if (it.k !== 'field' && it.k !== 'sand') continue;
      const sub = it.k === 'sand' ? 'sand' : it.sub || 'grass', [x0, z0, x1, z1] = sh.rect ? [Math.min(sh.rect[0], sh.rect[2]), Math.min(sh.rect[1], sh.rect[3]), Math.max(sh.rect[0], sh.rect[2]), Math.max(sh.rect[1], sh.rect[3])] : bboxOf(sh);
      const along = (x1 - x0) >= (z1 - z0);   // 이랑 방향 = 긴 변
      if (sub === 'rice' || sub === 'farm') {   // 결 그림(물 비친 논 + 벼 포기 줄 / 흙 이랑 + 잎채소) 위에 같은 자리 입체 줄(낮은 띠) — 땅 높이에서도 줄이 보이게
        const gap = sub === 'rice' ? 1.6 : 1.9, tile = gap * 4, ox = x0, oz = z0;
        cellsIn(sh, 2.5, (cx, cz, s2) => { const B = fbucket(sub, cx, cz), P4 = [[cx - s2, cz + s2], [cx + s2, cz + s2], [cx + s2, cz - s2], [cx - s2, cz - s2]];
          const v = P4.map(([x, z]) => [x, ty(x, z) + 0.05, z]), uv = P4.map(([x, z]) => along ? [(z - oz) / tile, (x - ox) / 8] : [(x - ox) / tile, (z - oz) / 8]);
          for (const t of [[0, 1, 2], [0, 2, 3]]) for (const k of t) { B.p.push(...v[k]); B.n.push(0, 1, 0); B.u.push(...uv[k]); } });
        const n = Math.floor(((along ? z1 - z0 : x1 - x0)) / gap), row = sub === 'rice' ? 0x86bf4e : 0x5f9a3f;
        for (let k = 0; k < n; k++) { const o = (k + 0.5) * gap; const a = along ? [x0 + 0.8, z0 + o] : [x0 + o, z0 + 0.8], b = along ? [x1 - 0.8, z0 + o] : [x0 + o, z1 - 0.8];
          strip(a, b, sub === 'rice' ? 0.42 : 0.55, sub === 'rice' ? 0.22 : 0.26, row, { skip: (x, z) => !inShape(sh, x, z) || inSchool(x, z), step: 4 }); }
        if (sh.rect) for (const [a, b] of [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]], [[x0, z1], [x0, z0]]]) strip(a, b, 0.9, 0.16, sub === 'rice' ? 0x9c8a5a : 0x7a5a3a, { step: 4 });   // 논둑·밭둑
        if (sub === 'rice') { const R = rng0(sd); scatter(sh, 9, (x, z) => { if (R() < 0.12) TREES.flower.push({ x, y: ty(x, z) + 0.1, z, s: 1.4, hex: 0xffffff, ry: 0 }); }, sd + 3); }   // 백로(흰 점) 몇
      } else if (sub === 'orchard') {
        cellsIn(sh, 2.5, (cx, cz, s2) => flat(cx - s2, cz - s2, cx + s2, cz + s2, ty(cx, cz) + 0.04, 0x9cc46a));
        const R = rng0(sd); for (let z = z0 + 3; z < z1 - 1; z += 5.5) for (let x = x0 + 3; x < x1 - 1; x += 5.5) { if (!inShape(sh, x, z)) continue;
          if (addTree('round', x, z, 0.55 + R() * 0.12, 0x5aa54a, R() * 6)) for (let f = 0; f < 5; f++) { const a = R() * 6.28, r = 1.0 + R() * 0.3; TREES.fruit.push({ x: x + Math.cos(a) * r * 0.62, y: ty(x, z) + 2.1 + R() * 0.7, z: z + Math.sin(a) * r * 0.62, s: 1, hex: PAL.fruit, ry: 0 }); } }
      } else {   // grass · park · sand
        // 바닥색은 땅 꼭짓점 물감(prepTints) — 평평한 판을 깔지 않음(비탈·물가에서 뜨거나 묻히지 않게)
        if (sub !== 'sand') scatter(sh, 2.6, (x, z, R) => { if (R() < 0.35 && !onRoad(x, z, 0.5)) TREES.flower.push({ x, y: ty(x, z), z, s: 0.8 + R() * 0.5, hex: PAL.flower[(R() * 4) | 0], ry: 0 }); }, sd + 1);
        if (sub === 'park') { scatter(sh, 11, (x, z, R) => { if (R() < 0.5) { const sp = R() < 0.7 ? 'round' : 'poplar'; addTree(sp, x, z, 0.7 + R() * 0.35, treeHex(sp, R), R() * 6); } }, sd + 2);
          const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, dryP = (x, z) => wAt(x, z) > 0 || wdI(x, z) > 0.05 || inSchool(x, z) || !!onRoad(x, z, 0.3); strip([x0 + 2, cz], [x1 - 2, cz], 2.2, 0.08, 0xd8c9a2, { step: 3, skip: dryP }); strip([cx, z0 + 2], [cx, z1 - 2], 2.2, 0.081, 0xd8c9a2, { step: 3, skip: dryP });   // 산책길 십자(물·물가·길 위는 비움)
          for (const [bx, bz] of [[cx + 3, cz + 2.2], [cx - 3, cz - 2.2]]) if (!dryP(bx, bz)) bench(bx, bz, 0); }
      }
    }
  }
  // 물가(WATER-2): 석축 호안(물낯 아래 → 둔치 높이 · 매끈한 벽) + 둔치 덮개(매끈한 풀판) — 1.5m 칸 마칭 스퀘어로 물가 선을 그대로 따라감 · 벽 선 = 물 울타리
  let WALLSEG = [];
  function drawBanks(group) {
    WALLSEG = []; const WI = L.nature.filter(n => n.k === 'water').map(n => shapeOf(n)).filter(Boolean); if (!WI.length) return;
    const STP = 1.5, sdF = (x, z) => { let m = 1e9; for (const sh of WI) { const v = sdOf(sh, x, z); if (v < m) m = v; } return m; }, cache = new Map(), sdC = (i, j) => { const k = i + ':' + j; let v = cache.get(k); if (v == null) { v = sdF(i * STP, j * STP); cache.set(k, v); } return v; };
    const CB = new Map(), cb = (x, z) => { const k = Math.floor((x - TX0) / REG) + ':' + Math.floor((z - TZ0) / REG); let b = CB.get(k); if (!b) { b = { p: [], n: [], c: [], u: [] }; CB.set(k, b); } return b; };
    const cy = TY + CAPY, wb = TY + WLY - 0.4, wm = TY + WLY + 0.06, done = new Set(), stoneA = rgb(0xa8a295), stoneB = rgb(0x6f7766);
    const capV = (B9, x, z) => { B9.p.push(x, cy, z); B9.n.push(0, 1, 0); B9.c.push(...capColor(x, z)); B9.u.push(x / 6.5, z / 6.5); };
    for (const sh of WI) { const bb = bboxOf(sh), x0 = Math.floor((Math.max(TX0, bb[0] - FPW - 14)) / STP), x1 = Math.ceil(Math.min(TX1, bb[2] + FPW + 14) / STP), z0 = Math.floor(Math.max(TZ0, bb[1] - FPW - 14) / STP), z1 = Math.ceil(Math.min(TZ1, bb[3] + FPW + 14) / STP);
      for (let j = z0; j < z1; j++) for (let i = x0; i < x1; i++) { const key = i + ':' + j; if (done.has(key)) continue; done.add(key);
        const V = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => ({ x: a * STP, z: b * STP, s: sdC(a, b) })); const mn = Math.min(...V.map(v => v.s)), mx = Math.max(...V.map(v => v.s));
        if (mn > FPW + 1.5 || mx < 0) continue; const cx = (i + 0.5) * STP, cz = (j + 0.5) * STP; if (inSchool(cx, cz) || cx < TX0 || cx > TX1 || cz < TZ0 || cz > TZ1) continue;
        const poly = [], cut = []; for (let e = 0; e < 4; e++) { const a = V[e], b = V[(e + 1) % 4]; if (a.s >= 0) poly.push([a.x, a.z]); if ((a.s >= 0) !== (b.s >= 0)) { const t = a.s / (a.s - b.s), q = [a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t]; poly.push(q); cut.push(q); } }
        if (poly.length >= 3) { const B9 = cb(cx, cz); for (let t = 1; t < poly.length - 1; t++) { capV(B9, ...poly[0]); capV(B9, ...poly[t + 1]); capV(B9, ...poly[t]); } }   // 위에서 반시계(앞면 = 위)
        for (let c = 0; c + 1 < cut.length; c += 2) { const p = cut[c], q = cut[c + 1], wet = V.filter(v => v.s < 0), wx = wet.reduce((a, v) => a + v.x, 0) / wet.length, wz = wet.reduce((a, v) => a + v.z, 0) / wet.length, nx9 = wx - (p[0] + q[0]) / 2, nz9 = wz - (p[1] + q[1]) / 2;
          const B = bucket((p[0] + q[0]) / 2, (p[1] + q[1]) / 2), face = (y0, y1, col) => { let a = [p[0], y0, p[1]], b = [q[0], y0, q[1]], c9 = [q[0], y1, q[1]], d = [p[0], y1, p[1]]; const n0 = nrm(a, b, c9); if (n0[0] * nx9 + n0[2] * nz9 < 0) { [a, b] = [b, a]; [c9, d] = [d, c9]; } quad(B, a, b, c9, d, col); };
          const k9 = 0.9 + 0.12 * vnoise(p[0] / 3.1, p[1] / 3.1); face(wb, wm, stoneB.map(v => v * k9)); face(wm, cy, stoneA.map(v => v * k9));   // 젖은 아랫단(이끼빛) · 마른 윗단(돌빛)
          const l9 = Math.hypot(nx9, nz9) || 1; WALLSEG.push([p, q, [nx9 / l9, nz9 / l9]]); } } }
    for (const [, b] of CB) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(b.u, 2)); g.computeBoundingSphere(); GEOS.push(g);
      const m = new T3.Mesh(g, MAT.ground); m.matrixAutoUpdate = false; m.receiveShadow = true; m.userData.fx = 1; group.add(m); }
  }
  // ───────── 이름표 뜻 꾸밈(AREA-2 · ✨): 동물(마당·개집·강아지) · 캠핑(텐트·모닥불·식탁·캠핑카) · 축구장 · 주차장 — 칸 안 빈자리에(아이 블록·길·물 비킴) ─────────
  function spotIn(A, hw9, hd9, pref, R) {   // 칸 안 빈 네모 자리(축 맞춤) — pref 가까운 곳부터
    let best = null; for (const r of A.R) for (let z = r[1] + hd9 + 4; z <= r[3] - hd9 - 4; z += 4) for (let x = r[0] + hw9 + 4; x <= r[2] - hw9 - 4; x += 4) {
      if (occHit(x - hw9, z - hd9, x + hw9, z + hd9) || inSchool(x, z) || [[x - hw9, z - hd9], [x + hw9, z - hd9], [x + hw9, z + hd9], [x - hw9, z + hd9], [x, z]].some(([a, b]) => onRoad(a, b, 1.2) || wAt(a, b) || tH(a, b) > 3)) continue;
      const dd = pref ? Math.hypot(x - pref[0], z - pref[1]) : R() * 50; if (!best || dd < best.d) best = { x, z, d: dd }; }
    if (best) occAdd(best.x - hw9, best.z - hd9, best.x + hw9, best.z + hd9); return best; }
  function dog(x, z, ry, hex) { const y = ty(x, z), Q = LP(x, z, ry); box(x, y + 0.3, z, 0.3, 0.3, 0.72, ry, hex); const [hx, hz] = Q(0, 0.42); box(hx, y + 0.5, hz, 0.28, 0.28, 0.3, ry, hex); const [nx9, nz9] = Q(0, 0.6); dbx(nx9, y + 0.52, nz9, 0.14, 0.12, 0.08, ry, 0x2b2b2b);
    for (const s9 of [-1, 1]) { const [ex, ez] = Q(s9 * 0.1, 0.42); dbx(ex, y + 0.76, ez, 0.08, 0.12, 0.06, ry, hex); for (const f9 of [-0.26, 0.26]) { const [lx, lz] = Q(s9 * 0.1, f9); dbx(lx, y, lz, 0.08, 0.3, 0.08, ry, hex); } } const [tx9, tz9] = Q(0, -0.42); dbx(tx9, y + 0.55, tz9, 0.06, 0.06, 0.3, ry + 0.4, hex); }
  function areaFeatures(group) {
    for (const A of AREAS) { const R = rng0(hashS('af:' + A.id + LID)), n9 = A.n || (A.n = {}), kids = BLD.filter(b => !b.gen && areaAt(b.cx, b.cz) === A), pref = kids.length ? [kids[0].cx, kids[0].cz] : [A.cx, A.cz];
      if (A.st.has('pets')) for (let y9 = 0; y9 < 2; y9++) { const sp = spotIn(A, 7, 6, pref, R); if (!sp) break; const { x, z } = sp, y = ty(x, z);   // 동물 마당: 낮은 울타리 · 개집 · 물그릇 · 강아지 셋
        box(x, y + 0.02, z, 13.6, 0.04, 11.6, 0, 0x86c95c, { noSide: true }); for (const [a, b, sx, sz] of [[0, -5.8, 13.6, 0.08], [0, 5.8, 13.6, 0.08], [-6.8, 0, 0.08, 11.6], [6.8, 0, 0.08, 11.6]]) { box(x + a, y + 0.55, z + b, sx, 0.08, sz, 0, 0xf6f4ee); box(x + a, y + 0.25, z + b, sx, 0.08, sz, 0, 0xf6f4ee); }
        for (let k = -6; k <= 6; k += 1.5) for (const b of [-5.8, 5.8]) dbx(x + k, y, z + b, 0.08, 0.7, 0.08, 0, 0xf6f4ee); for (let k = -5; k <= 5; k += 1.5) for (const a of [-6.8, 6.8]) dbx(x + a, y, z + k, 0.08, 0.7, 0.08, 0, 0xf6f4ee);
        box(x - 4.2, y, z - 3.2, 1.6, 1.0, 1.4, 0, 0xd9473b); gable(x - 4.2, y + 1.0, z - 3.2, 1.6, 1.4, 0.7, 0, 0x8a5a36, { eave: 0.15 }); dbx(x - 4.2, y + 0.2, z - 2.5, 0.6, 0.55, 0.04, 0, 0x3a2a1a);   // 개집
        cyl(x + 3.5, y, z + 3.4, 0.22, 0.1, 0x3d74c9, 10, { top: 0x6fc3dc }); for (let d9 = 0; d9 < 3; d9++) dog(x - 2 + d9 * 2.3 + R() * 0.8, z + (R() - 0.5) * 6, R() * 6.28, [0xc8a070, 0xf2ede0, 0x3a3a3a, 0xe0b070][(d9 + y9) % 4]);
        PCOL.push({ x0: x - 6.85, x1: x - 6.75, y0: y - 1, y1: y + 0.7, z0: z - 5.8, z1: z + 5.8 }, { x0: x + 6.75, x1: x + 6.85, y0: y - 1, y1: y + 0.7, z0: z - 5.8, z1: z + 5.8 }, { x0: x - 6.8, x1: x + 6.8, y0: y - 1, y1: y + 0.7, z0: z - 5.85, z1: z - 5.75 }); n9['동물 마당'] = (n9['동물 마당'] || 0) + 1; }
      if (A.st.has('camp')) { let nT = 0; const cols = [0xef8b33, 0x3cc76a, 0x3d74c9, 0xf2c230, 0xe0453a];   // 캠핑장: 강 둔치·칸 빈자리에 텐트 · 모닥불 · 식탁
        for (let t9 = 0; t9 < 7; t9++) { const sp = spotIn(A, 3.5, 3.5, [A.cx + (R() - 0.5) * 70, A.cz + (R() - 0.5) * 70], R); if (!sp) break; const { x, z } = sp, y = ty(x, z), r9 = R() * 6.28, Q = LP(x, z, r9);
          gable(x, y, z, 2.6, 2.2, 1.7, r9, cols[t9 % 5], { eave: 0.05, wall: cols[t9 % 5] }); const [dx9, dz9] = Q(1.32, 0); dbx(dx9, y, dz9, 0.03, 1.2, 0.9, r9, 0x2b2b2b);   // 텐트 + 입구
          const [fx, fz] = Q(3.2, 0.6); for (let k = 0; k < 8; k++) { const a9 = k / 8 * 6.28; dbx(fx + Math.cos(a9) * 0.55, y, fz + Math.sin(a9) * 0.55, 0.22, 0.16, 0.22, a9, 0x8d8a80); } dbx(fx, y + 0.05, fz, 0.7, 0.1, 0.12, 0.6, 0x6b4a2f); box(fx, y + 0.1, fz, 0.3, 0.45, 0.3, 0.8, 0xffa040, { B: lbucket(fx, fz) });   // 모닥불(밤에 빛남)
          if (t9 % 2 === 0) { const [bx, bz] = Q(-0.6, 3.0); box(bx, y + 0.7, bz, 1.8, 0.08, 0.9, r9, 0x9b6a3c); for (const s9 of [-1, 1]) { const [px, pz] = Q(-0.6 + s9 * 0.75, 3.0); dbx(px, y, pz, 0.08, 0.7, 0.8, r9, 0x6b4a2f); } }   // 식탁
          PCOL.push(col9(x, z, 1.3, 1.1, r9, y - 1, y + 1.5)); nT++; }
        const sp = spotIn(A, 4, 2.5, pref, R); if (sp) { vehicle(sp.x, sp.z, 0, 'car', 0xf6f4ee); box(sp.x - 0.3, ty(sp.x, sp.z) + 1.3, sp.z, 3.2, 1.2, 1.9, 0, 0xf6f4ee, { top: 0xe8e4da }); }   // 캠핑카
        n9['텐트'] = nT; }
      if (A.st.has('soccer')) { let sp = null, FW = 0, FD = 0; for (const [a, b] of [[48, 30], [40, 26], [32, 21]]) { sp = spotIn(A, a, b, null, R); if (sp) { FW = a; FD = b; break; } }   // 축구장: 잔디(줄무늬) · 흰 선 · 골대 · 관중석 · 조명탑
        if (sp) { const { x, z } = sp, y = ty(x, z); for (let k = 0; k < 8; k++) box(x - FW + (k + 0.5) * FW / 4, y + 0.03, z, FW / 4, 0.04, FD * 2, 0, k % 2 ? 0x5fae48 : 0x6cbb52, { noSide: true });
          const ln = (x0, z0, x1, z1) => box((x0 + x1) / 2, y + 0.075, (z0 + z1) / 2, Math.max(0.15, Math.abs(x1 - x0)), 0.01, Math.max(0.15, Math.abs(z1 - z0)), 0, 0xffffff, { noSide: true });
          ln(-FW * 0.92 + x, -FD * 0.9 + z, FW * 0.92 + x, -FD * 0.9 + z); ln(-FW * 0.92 + x, FD * 0.9 + z, FW * 0.92 + x, FD * 0.9 + z); ln(-FW * 0.92 + x, -FD * 0.9 + z, -FW * 0.92 + x, FD * 0.9 + z); ln(FW * 0.92 + x, -FD * 0.9 + z, FW * 0.92 + x, FD * 0.9 + z); ln(x, z - FD * 0.9, x, z + FD * 0.9);
          for (let k = 0; k < 24; k++) { const a9 = k / 24 * 6.28; dbx(x + Math.cos(a9) * FD * 0.3, y + 0.075, z + Math.sin(a9) * FD * 0.3, 0.9, 0.01, 0.15, -a9 + Math.PI / 2, 0xffffff, { noSide: true }); }
          for (const s9 of [-1, 1]) { const gx = x + s9 * FW * 0.92; ln(gx - s9 * FW * 0.25, z - FD * 0.45, gx - s9 * FW * 0.25, z + FD * 0.45); ln(gx, z - FD * 0.45, gx - s9 * FW * 0.25, z - FD * 0.45); ln(gx, z + FD * 0.45, gx - s9 * FW * 0.25, z + FD * 0.45);
            for (const b of [-3.6, 3.6]) box(gx, y, z + b, 0.14, 2.44, 0.14, 0, 0xffffff); box(gx, y + 2.4, z, 0.14, 0.14, 7.3, 0, 0xffffff); box(gx + s9 * 1.0, y + 1.2, z, 0.04, 2.4, 7.2, 0, 0xe8e8e8); }   // 페널티 박스 · 골대 · 그물
          for (let k = 0; k < 4; k++) box(x, y + k * 0.5, z - FD - 2.5 - k * 0.9, FW * 1.2, 0.5, 1.0, 0, [0x3d74c9, 0xe0453a][k % 2], { top: 0xd8d4ca });   // 관중석
          for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const lx = x + a * (FW + 3), lz = z + b * (FD + 3); cyl(lx, y, lz, 0.25, 14, 0x9aa0a6, 8); box(lx, y + 14, lz, 2.2, 1.0, 0.6, Math.atan2(-a, -b), 0xfff3c4, { B: lbucket(lx, lz) }); }   // 조명탑
          PCOL.push({ x0: x - FW * 0.6, x1: x + FW * 0.6, y0: y - 1, y1: y + 2, z0: z - FD - 6.5, z1: z - FD - 2 }); n9['축구장'] = 1; } }
      if (A.st.has('parking')) { const big = kids.sort((a, b) => b.w * b.d - a.w * a.d)[0]; if (big) { const sp = spotIn(A, 14, 9, [big.door[0], big.door[1]], R); if (sp) { parking(group, { id: 'pk' + A.id, x: sp.x, z: sp.z, w: 26, d: 16, ry: 0 }); n9['주차장'] = 1; } } }
    } }
  function paddy(zn) {   // 다랑이 논(10-13 교사 '평평한 다랑이 · 논두렁·물길·농로 · 농가는 흩어'): 가운데 농로 + 물길 · 양쪽에 논배미(논두렁으로 나눔 · 가끔 밭) · 칸 모서리에 농가(✨)
    const sh = shapeOf(zn); if (!sh || !sh.rect) return; let [x0, z0, x1, z1] = [Math.min(sh.rect[0], sh.rect[2]), Math.min(sh.rect[1], sh.rect[3]), Math.max(sh.rect[0], sh.rect[2]), Math.max(sh.rect[1], sh.rect[3])];
    const inset = (a, b) => { while (a < b && [0.25, 0.5, 0.75].some(t => onRoad(a, z0 + (z1 - z0) * t, 2.5))) a += 1; return a; }; x0 = inset(x0, x1); while (x1 > x0 && [0.25, 0.5, 0.75].some(t => onRoad(x1, z0 + (z1 - z0) * t, 2.5))) x1 -= 1; while (z1 > z0 && [0.25, 0.5, 0.75].some(t => onRoad(x0 + (x1 - x0) * t, z0, 2.5))) z0 += 1; while (z1 > z0 && [0.25, 0.5, 0.75].some(t => onRoad(x0 + (x1 - x0) * t, z1, 2.5))) z1 -= 1;
    if (x1 - x0 < 30 || z1 - z0 < 30) return; const R = rng0(hashS('pd' + zn.id)), mz = (z0 + z1) / 2, y = ty((x0 + x1) / 2, mz), rec = { id: zn.id, k: 'green', note: zn.note || '', dens: '', n: { 논배미: 0, 밭: 0, 농가: 0 } };
    strip([x0, mz], [x1, mz], 3.2, 0.06, 0xc9b48a, { step: 4 }); strip([x0, mz - 2.4], [x1, mz - 2.4], 1.1, 0.02, 0x5fa9c4, { step: 4 }); for (const s9 of [-1, 1]) strip([x0, mz - 2.4 + s9 * 0.6], [x1, mz - 2.4 + s9 * 0.6], 0.18, 0.1, 0x9d978b, { step: 4 });   // 농로(흙길) · 물길(시멘트 수로)
    const lev = (ax, az, bx, bz) => { const L9 = Math.hypot(bx - ax, bz - az); box((ax + bx) / 2, y, (az + bz) / 2, Math.abs(bx - ax) + 0.7, 0.32, Math.abs(bz - az) + 0.7, 0, 0x7fae58, { top: 0x8fbe62 }); void L9; };   // 논두렁(풀 둑)
    for (const [za, zb] of [[z0 + 1, mz - 3.2], [mz + 1.8, z1 - 1]]) { const n = Math.max(2, Math.round((x1 - x0) / 32)), pw = (x1 - x0) / n; lev(x0, za, x1, za); lev(x0, zb, x1, zb);
      for (let i = 0; i <= n; i++) lev(x0 + i * pw, za, x0 + i * pw, zb);
      for (let i = 0; i < n; i++) { const farm = R() < 0.22, a = x0 + i * pw + 0.5, b = x0 + (i + 1) * pw - 0.5; L.nature.push({ id: '__p' + zn.id + za.toFixed(0) + i, k: 'field', sub: farm ? 'farm' : 'rice', rect: [MXof(a), MYof(za + 0.5), MXof(b), MYof(zb - 0.5)], gen: zn.id }); rec.n[farm ? '밭' : '논배미']++; } }
    for (let h9 = 0; h9 < 2; h9++) { const fx = h9 ? x1 - 9 : x0 + 9, fz = h9 ? z1 - 9 : z0 + 9; if (occHit(fx - 6, fz - 6, fx + 6, fz + 6) || onRoad(fx, fz, 6)) continue; const B9 = mkGen({ kind: 'house', cx: fx, cz: fz, w: 9, d: 7, h: 4.5, ry: h9 ? Math.PI : 0, c: 'orange', gen: zn.id }); if (B9) rec.n.농가++; }   // 농가(✨)
    ZFILL.push(rec); }
  function mkGen(o) {   // AI가 채운 건물 하나(구역 채우기 밖 — 농가 등)
    const c = Math.cos(o.ry), s9 = Math.sin(o.ry), corners = [[-o.w / 2, -o.d / 2], [o.w / 2, -o.d / 2], [o.w / 2, o.d / 2], [-o.w / 2, o.d / 2]].map(([lx, lz]) => [o.cx + lx * c + lz * s9, o.cz - lx * s9 + lz * c]); if (corners.some(([x, z]) => onRoad(x, z, 1) || wAt(x, z) || inRect(x, z))) return null;
    const best = nearSeg(o.cx, o.cz, 200); let fl = [0, 1]; if (best) { const dx = best.p[0] - o.cx, dz = best.p[1] - o.cz, lx = dx * c - dz * s9, lz = dx * s9 + dz * c; fl = Math.abs(lx) / o.w > Math.abs(lz) / o.d ? [Math.sign(lx) || 1, 0] : [0, Math.sign(lz) || 1]; }
    const fw = [fl[0] * c + fl[1] * s9, -fl[0] * s9 + fl[1] * c], half = fl[0] ? o.w / 2 : o.d / 2, y0 = Math.min(...corners.map(([x, z]) => ty(x, z))); occAdd(o.cx - o.w / 2 - 2, o.cz - o.d / 2 - 2, o.cx + o.w / 2 + 2, o.cz + o.d / 2 + 2);
    const B9 = { b: { id: 'g' + o.gen + '_' + BLD.length, c: o.c, h: o.h / S, w: o.w / S, d: o.d / S }, kind: o.kind, cx: o.cx, cz: o.cz, w: o.w, d: o.d, h: o.h, ry: o.ry, c, s: s9, y0, fl, fw, door: [o.cx + fw[0] * (half + 2.5), o.cz + fw[1] * (half + 2.5)], gap: 3, name: null, corners, gen: o.gen }; BLD.push(B9); return B9; }
  // 고갯길 옹벽 + 둔덕(MTN-1): 길 가장자리 1m 뒤 돌 옹벽(줄눈·갓돌) · 그 위 풀 둔덕(산 색 · 땅 격자 톱니를 덮음) · 옹벽 = 몸이 막힘
  const hillCol = (x, z, h) => { const n1 = vnoise(x / 17, z / 17), n2 = vnoise(x / 5.3 + 31, z / 5.3); let c = mix(PAL.grass[0], PAL.grass[1], n1 * 0.8 + n2 * 0.2); const t = Math.min(1, Math.max(0, h) / 30), hc = rgb(PAL.hill); return c.map((v, i) => v + (hc[i] - v) * t * 0.85); };
  function drawMountainRoads(group) {
    if (!MWALL.length) return; const runs = new Map(); for (const w of MWALL) { let a = runs.get(w.rid); if (!a) runs.set(w.rid, a = []); a[w.q] = w; }
    const CB = new Map(), cb = (x, z) => { const k = Math.floor((x - TX0) / REG) + ':' + Math.floor((z - TZ0) / REG); let b = CB.get(k); if (!b) CB.set(k, b = { p: [], n: [], c: [], u: [] }); return b; }, stone = rgb(0xa39d90), stone2 = rgb(0x8f897c), cop = rgb(0xc9c3b4);
    for (const [, A] of runs) for (let q = 0; q < A.length - 1; q++) { const a = A[q], b = A[q + 1]; if (!a || !b) continue; const o0 = a.hw + 1, o1 = a.hw + 15.5;
      const P = (w, o, y) => [w.cx + w.px * o, TY + y, w.cz + w.pz * o], ya = a.road + a.W, yb = b.road + b.W, B = bucket(a.cx, a.cz), wn = [-a.px, 0, -a.pz];
      { let v0 = P(a, o0, a.road - 0.3), v1 = P(b, o0, b.road - 0.3), v2 = P(b, o0, yb), v3 = P(a, o0, ya); const n0 = nrm(v0, v1, v2); if (n0[0] * wn[0] + n0[2] * wn[2] < 0) { [v0, v1] = [v1, v0]; [v2, v3] = [v3, v2]; } quad(B, v0, v1, v2, v3, (q % 2 ? stone : stone2), [0.86, 0.86, 1, 1]); }   // 옹벽 면
      for (let lv = 0.7; lv < Math.min(a.W, b.W) - 0.15; lv += 0.7) { const c1 = P(a, o0 - 0.02, a.road + lv), c2 = P(b, o0 - 0.02, b.road + lv); box((c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2 - 0.03, (c1[2] + c2[2]) / 2, 2.5, 0.06, 0.04, Math.atan2(-a.tz, a.tx), 0x7f796d, { B: dbucket(a.cx, a.cz) }); }   // 줄눈
      { const c1 = P(a, o0 + 0.15, ya), c2 = P(b, o0 + 0.15, yb); box((c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2, (c1[2] + c2[2]) / 2, 2.55, 0.18, 0.5, Math.atan2(-a.tz, a.tx), 0xc9c3b4, { top: 0xd3cdbe }); void cop; }   // 갓돌
      const C9 = cb(a.cx, a.cz), V = (w, o, y) => { const v = P(w, o, y); C9.p.push(...v); C9.n.push(0, 1, 0); C9.c.push(...hillCol(v[0], v[2], y)); C9.u.push(v[0] / 6.5, v[2] / 6.5); };
      const cw = [[a, o0 + 0.3, ya], [b, o0 + 0.3, yb], [b, o1, yb], [a, o1, ya]], up = nrm(P(...cw[0]), P(...cw[1]), P(...cw[2]))[1] > 0;   // 둔덕 판(위가 앞면)
      for (const t of up ? [[0, 1, 2], [0, 2, 3]] : [[0, 2, 1], [0, 3, 2]]) for (const k of t) V(...cw[k]);
      COLS9.push({ x0: Math.min(P(a, o0, 0)[0], P(b, o0, 0)[0]) - 0.3, x1: Math.max(P(a, o0, 0)[0], P(b, o0, 0)[0]) + 0.3, y0: TY + Math.min(a.road, b.road) - 2, y1: TY + Math.max(ya, yb) + 0.3, z0: Math.min(P(a, o0, 0)[2], P(b, o0, 0)[2]) - 0.3, z1: Math.max(P(a, o0, 0)[2], P(b, o0, 0)[2]) + 0.3 }); }
    for (const [, b] of CB) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(b.u, 2)); g.computeBoundingSphere(); GEOS.push(g);
      const m = new T3.Mesh(g, MAT.ground); m.matrixAutoUpdate = false; m.receiveShadow = true; m.userData.fx = 1; group.add(m); } }
  let COLS9 = [];
  // 판 밖 땅(SKIRT-1 · 10-13): 판 가장자리에서 들판·산이 그대로 이어짐(뒷산은 판 밖으로 계속 · 멀리 낮은 구릉) — 판 가장자리 칸은 땅 아래로 겹쳐 틈 없음 · 들어갈 수는 없음(마을 끝)
  function drawSkirt(group) {
    const SP = 20, EXT = 420, x0 = TX0 - EXT, z0 = TZ0 - EXT, nx9 = Math.ceil((TX1 + EXT - x0) / SP) + 1, nz9 = Math.ceil((TZ1 + EXT - z0) / SP) + 1, N9 = nx9 * nz9, H = new Float32Array(N9), IN = new Uint8Array(N9), P = [], Cc = [], U = [], I = [];
    const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    for (let j = 0; j < nz9; j++) for (let i = 0; i < nx9; i++) { const x = x0 + i * SP, z = z0 + j * SP, k = j * nx9 + i;
      if (x > TX0 + SP && x < TX1 - SP && z > TZ0 + SP && z < TZ1 - SP) { IN[k] = 1; continue; }
      const dx = Math.max(TX0 - x, 0, x - TX1), dz = Math.max(TZ0 - z, 0, z - TZ1), dOut = Math.hypot(dx, dz), ex = Math.min(TX1 - 0.5, Math.max(TX0 + 0.5, x)), ez = Math.min(TZ1 - 0.5, Math.max(TZ0 + 0.5, z));
      let h; if (dOut <= 0) h = tH0(x, z) - 0.3; else { const edgeH = tH0(ex, ez), far = hillAt(x, z) * (1 - ss(180, 420, dOut)) + (vnoise(x / 95, z / 95) - 0.35) * 9 * ss(70, 240, dOut); h = edgeH + (Math.max(-0.2, far) - edgeH) * ss(0, 45, dOut) - 0.05; }
      H[k] = h; P.push(x, TY + h, z); const c = hillCol(x, z, h), dk = 1 - 0.12 * ss(100, 400, dOut); Cc.push(c[0] * dk, c[1] * dk, c[2] * dk); U.push(x / 6.5, z / 6.5); }
    // 정점 번호(안쪽 칸은 건너뜀)
    const idx = new Int32Array(N9).fill(-1); let n = 0; for (let k = 0; k < N9; k++) if (!IN[k]) idx[k] = n++;
    for (let j = 0; j < nz9 - 1; j++) for (let i = 0; i < nx9 - 1; i++) { const a = j * nx9 + i, b = a + 1, c = a + nx9, d = c + 1; if (IN[a] || IN[b] || IN[c] || IN[d]) continue; I.push(idx[a], idx[d], idx[b], idx[a], idx[c], idx[d]); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(Cc, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere(); GEOS.push(g);
    const m = new T3.Mesh(g, MAT.ground); m.matrixAutoUpdate = false; m.receiveShadow = true; m.userData.fx = 1; group.add(m);
    // 판 밖 나무(숲띠 · 산 쪽은 빽빽이) — 판 가장자리 25m 밖부터
    const R = rng0(4242); for (let j = 0; j < nz9 - 1; j++) for (let i = 0; i < nx9 - 1; i++) { const k = j * nx9 + i; if (IN[k]) continue; const x = x0 + (i + R()) * SP, z = z0 + (j + R()) * SP, dx = Math.max(TX0 - x, 0, x - TX1), dz = Math.max(TZ0 - z, 0, z - TZ1), dOut = Math.hypot(dx, dz);
      if (dOut < 25 || dOut > 300) continue; const hh = hillAt(x, z), pr = hh > 4 ? 0.85 : 0.32 * (1 - dOut / 300); if (R() > pr) continue; const u = (x - x0) / SP, v = (z - z0) / SP, ii = u | 0, jj = v | 0, fx = u - ii, fz = v - jj, kk = jj * nx9 + ii;
      const y = TY + (H[kk] * (1 - fx) + H[kk + 1] * fx) * (1 - fz) + (H[kk + nx9] * (1 - fx) + H[kk + nx9 + 1] * fx) * fz, sp = hh > 4 || R() < 0.45 ? 'pine' : 'round'; TREES[sp].push({ x, y, z, s: 1.0 + R() * 0.6, hex: treeHex(sp, R), ry: R() * 6 }); } }
  function drawRiverside() {   // 강 둔치: 산책길(양쪽) · 물가 갈대 · 강을 보는 벤치(✨ 완성된 동네) — 길·다리 밑·학교는 비움
    for (const it of L.nature) { if (it.k !== 'water' || !it.line) continue; const sh = shapeOf(it), hw = sh.w / 2, fp = FPW, Q = densify(sh.line, 3), R = rng0(hashS('rs' + (it.id || ''))), ok = (x, z) => { const s9 = sdAt(x, z); return s9 > 0.9 && s9 < FPW - 0.8 && !onRoad(x, z, 1.5) && !inSchool(x, z) && x > TX0 + 2 && x < TX1 - 2 && z > TZ0 + 2 && z < TZ1 - 2; };
      for (const sg of [-1, 1]) { let prev = null;
        for (let i = 1; i < Q.length; i++) { const a = Q[i - 1], b = Q[i], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, px = -dz / l * sg, pz = dx / l * sg, o = hw + fp * 0.55, p0 = [a[0] + px * o, a[1] + pz * o], p1 = [b[0] + px * o, b[1] + pz * o];
          if (ok((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)) { strip(p0, p1, 2.0, 0.12, 0xd9ccb0, { step: 3 }); prev = p1; } else prev = null;
          const rx = a[0] + px * (hw + 1.4), rz = a[1] + pz * (hw + 1.4); if (R() < 0.55 && ok(rx, rz)) TREES.bush.push({ x: rx, y: ty(rx, rz), z: rz, s: 0.38 + R() * 0.2, hex: [0x9cc46a, 0x86b85a, 0xb5cf7a][(R() * 3) | 0], ry: R() * 6, kid: true });   // 갈대 덤불
          if (i % 14 === 7) { const bx = a[0] + px * (hw + fp - 1.3), bz = a[1] + pz * (hw + fp - 1.3); if (ok(bx, bz)) bench2(bx, bz, Math.atan2(-px, -pz)); } } } } }
  const cellsIn = (sh, step, f) => { const [x0, z0, x1, z1] = bboxOf(sh); for (let z = z0; z < z1 - 0.01; z += step) for (let x = x0; x < x1 - 0.01; x += step) { const cx = x + step / 2, cz = z + step / 2; if (inShape(sh, cx, cz) && !inSchool(cx, cz) && !wAt(cx, cz)) f(cx, cz, step / 2 + 0.01); } };
  function bench(x, z, ry) { const y = ty(x, z); box(x, y + 0.42, z, 1.8, 0.1, 0.5, ry, 0x9b6a3c); box(x, y + 0.52, z - 0.22, 1.8, 0.45, 0.08, ry, 0x9b6a3c); for (const s of [-0.75, 0.75]) box(x + s, y, z, 0.1, 0.42, 0.4, ry, 0x55595e); }

  // ───────── 블록 → 건물(두 겹: 🧱 매트 모습 = 블록 그대로 · 🏘 마을 모습 = 부품 조립) ─────────
  let LOOK = params.look === 'mat' ? 'mat' : 'town';
  // 블록 모양 → 종류(교사 10-13 범례 · 1cm = 5m): 2cm 정육면체 = 집·작은 가게 · 3cm = 빌라·상가 · 4cm = 랜드마크 · 판 눕힘 = 낮고 넓은 건물(마트·공장) · 판을 끝으로 세움 = 아파트 한 동 · 옆으로 세움 = 길쭉한 5층
  const kindOf = b => { if (b.kind) return b.kind; if (b.name) { const k9 = (NAMEKIND.find(([re]) => re.test(b.name)) || [])[1]; if (k9) return k9; }
    const base = KIND_OF_COLOR[b.c] || 'house', h = (b.h || 2) * S, w = (b.w || 2) * S, d = (b.d || 2) * S, slender = Math.max(w, d) / Math.max(0.1, Math.min(w, d)) >= 2.5;
    if (base === 'house') return h >= 20 || (h >= 14 && slender) ? 'apt' : 'house'; if (base === 'shop') return h >= 16 ? 'office' : 'shop'; return base; };
  const isMark = b => (b.w || 0) >= 3.8 && (b.d || 0) >= 3.8 && (b.h || 0) >= 3.8;   // 4cm 정육면체 = 마을 자랑 랜드마크(노랑·빨강·파랑 셋)
  const BLD = []; let SCHOOLB = 0;   // {b, kind, cx, cz, w, d, h, ry, y0, front:[fx,fz], door:[x,z], name}
  function prepBlocks() {
    BLD.length = 0;
    SCHOOLB = 0; for (const b of L.blocks) { const cx = X(b.x), cz = Z(b.y); if (inMatSchool(b.x, b.y) || inSchool(cx, cz)) { SCHOOLB++; continue; }   // 학교 칸 블록(이름표·남색 판) = 실제 학교 모델로 대신
      const BG = b.big && LOOK === 'town' ? [2.8, 2.0, 0.7] : [1, 1, 1], w = (b.w || 2) * S * BG[0], d = (b.d || 2) * S * BG[1], h = (b.h || 2) * S * BG[2], ry = -(b.rot || 0) * Math.PI / 180, c = Math.cos(ry), s = Math.sin(ry);   // big = 대형(마트 — ✨ 넓게)
      const corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [cx + lx * c + lz * s, cz - lx * s + lz * c]);
      // 비탈 위 건물(10-13 교사 '비탈에 건물을 짓지 않아요' — 아이 블록은 옮기지 않음): 평평한 터(석축 단)를 쌓고 그 위에 — 내려가는 쪽은 옹벽이 보임
      const pad = [[-w / 2 - 2, -d / 2 - 2], [w / 2 + 2, -d / 2 - 2], [w / 2 + 2, d / 2 + 2], [-w / 2 - 2, d / 2 + 2], [0, 0]].map(([lx, lz]) => ty(cx + lx * c + lz * s, cz - lx * s + lz * c)), lo = Math.min(...pad), hi = Math.max(...pad);
      const terrace = hi - lo > 0.45 && !b.flat ? { lo: lo - 0.35, hi: hi + 0.12 } : null, y0 = (terrace ? terrace.hi : Math.min(...corners.map(([x, z]) => ty(x, z)))) + (b.z || 0) * S;
      // 앞(문) = 가장 가까운 길 쪽 면
      let best = null, bseg = null; for (const sg of RSEG) { const r = segD(cx, cz, sg.a, sg.b); if (!best || r[0] < best[0]) { best = r; bseg = sg; } }
      let fl = [0, 1]; if (best) { const dx = best[2] - cx, dz = best[3] - cz, lx = dx * c - dz * s, lz = dx * s + dz * c; fl = Math.abs(lx) / w > Math.abs(lz) / d ? [Math.sign(lx) || 1, 0] : [0, Math.sign(lz) || 1]; }
      const fw = [fl[0] * c + fl[1] * s, -fl[0] * s + fl[1] * c], half = fl[0] ? w / 2 : d / 2;
      const kind = kindOf(b), door = [cx + fw[0] * (half + 2.5), cz + fw[1] * (half + 2.5)];
      const gap = best ? best[0] - bseg.hw - half : 4;   // 건물 앞면 → 길 가장자리(앞마당 너비)
      BLD.push({ b, kind, cx, cz, w, d, h, ry, c, s, y0, fl, fw, door, gap, name: b.name || null, corners, stacked: !!b.z, terrace });
      if (kind === 'green' && (b.h || 2) <= 1.2 && LOOK === 'town') L.nature.push({ id: '__lawn' + (b.id || BLD.length), k: 'field', sub: 'lawn', poly: corners.map(([x, z]) => [MXof(x), MYof(z)]), gen: 'kid' });   // 눕힌 초록 판 = 잔디밭(판 모양 그대로 · 땅에 칠함)
    }
  }
  const WALL = 0xf3ead8, GLASS = 0x9fcbe0, FRAME = 0xf7f6f2, DOOR = 0x6b4a32, DARK = 0x4a4f57;
  // ── 건물 겉모습(GTA 산안드레아스만큼 꽉 찬 동네 — 그림체는 v2 그대로) · 같은 종류도 건물마다 씨앗(R)으로 조금씩 다르게 · 창 = 유리 그릇(밤에 불 켜짐)
  const L2W = (B9, lx, lz) => [B9.cx + lx * B9.c + lz * B9.s, B9.cz - lx * B9.s + lz * B9.c];
  const FACES = B9 => [[1, 0, B9.d, B9.w / 2], [-1, 0, B9.d, B9.w / 2], [0, 1, B9.w, B9.d / 2], [0, -1, B9.w, B9.d / 2]];
  const isFront = (B9, f) => f[0] === B9.fl[0] && f[1] === B9.fl[1];
  const frontF = B9 => FACES(B9).find(f => isFront(B9, f));
  function fbox(B9, f, u, y, sw, sh, dep, hex, o = {}) { const [nx, nz, , half] = f, off = (o.out || 0) + dep / 2, lx = nx ? nx * (half + off) : u, lz = nz ? nz * (half + off) : u, [x, z] = L2W(B9, lx, lz);
    if (o.quad) {   // 벽에 붙은 판 한 장(창 유리 — 삼각형 2개)
      const P = (uu, yy) => { const l = nx ? [nx * (half + (o.out || 0.03)), uu] : [uu, nz * (half + (o.out || 0.03))], q = L2W(B9, l[0], l[1]); return [q[0], B9.y0 + yy, q[1]]; };
      let a = P(u - sw / 2, y), b = P(u + sw / 2, y), c = P(u + sw / 2, y + sh), d = P(u - sw / 2, y + sh); const on = [nx * B9.c + nz * B9.s, -nx * B9.s + nz * B9.c], n0 = nrm(a, b, c); if (n0[0] * on[0] + n0[2] * on[1] < 0) { [a, b] = [b, a]; [c, d] = [d, c]; }
      quad(o.glass ? gbucket(x, z) : o.D ? dbucket(x, z) : bucket(x, z), a, b, c, d, rgb(hex)); return; }
    box(x, B9.y0 + y, z, sw, sh, dep, B9.ry + (nx ? Math.PI / 2 : 0), hex, o.glass ? { ...o, B: gbucket(x, z) } : o.D ? { ...o, B: dbucket(x, z) } : o); }
  // 창 줄: 층마다 · 면마다(앞면 1층 문 자리는 비움) · 창틀 · 창턱 · 실외기 · 꽃상자
  function winRows(B9, o) { const R = B9.R, ww = o.ww || 1.3, fh = o.fh || 1.5;
    for (const f of FACES(B9)) { if (o.front && !isFront(B9, f)) continue; const len = f[2], n = Math.max(1, Math.floor((len - 1.2) / (o.every || 3.2)));
      for (let y = o.y0; y + fh <= o.y1 + 0.01; y += o.step || 3.3) for (let k = 0; k < n; k++) { const u = -len / 2 + (k + 0.5) * len / n;
        if (isFront(B9, f) && y < o.y0 + 0.2 && Math.abs(u) < (o.doorW || 1.6)) continue;
        if (o.skip && o.skip(f, u, y)) continue;
        fbox(B9, f, u, y - 0.09, ww + 0.22, fh + 0.18, 0, o.frame || FRAME, { quad: true, out: 0.025 }); fbox(B9, f, u, y, ww, fh, 0, (R() < 0.18 ? (o.glass2 || 0x6f9fb8) : (o.glass || GLASS)), { quad: true, out: 0.04, glass: true });   // 창틀(판) + 유리(판 — 밤에 불)
        if (o.mull) fbox(B9, f, u, y, 0.07, fh, 0.08, o.frame || FRAME, { out: 0.04, D: true });   // 가운데 창살(집만)
        if (o.sill) fbox(B9, f, u, y - 0.16, ww + 0.4, 0.1, 0.24, o.sillHex || 0xd6cfbf, { D: true });
        if (o.ac && R() < o.ac) fbox(B9, f, u + (k % 2 ? -1 : 1) * (ww / 2 + 0.55), y - 0.1, 0.78, 0.56, 0.46, 0xe7e9ea, { out: 0.01, D: true });
        if (o.flower && R() < o.flower) { fbox(B9, f, u, y - 0.42, ww * 0.95, 0.26, 0.34, 0x9a6a3c, { D: true }); fbox(B9, f, u, y - 0.16, ww * 0.85, 0.18, 0.26, [0xe0453a, 0xf2c230, 0xf08fb2, 0x7cc35a][(R() * 4) | 0], { out: 0.04, D: true }); } } } }
  // 평지붕 옥상: 바닥 · 난간벽 · 물탱크 · 실외기 · (태양광 · 안테나 · 계단실)
  function roofTop(B9, o = {}) { const R = B9.R, { w, d, h, ry } = B9, top = B9.y0 + h; box(B9.cx, top, B9.cz, w, 0.22, d, ry, o.deck || 0xbfbab0, { top: o.deck || 0xbfbab0 }); ROOFS.push({ cx: B9.cx, cz: B9.cz, w, d, ry, y: top + 0.22 });   // 평지붕 목록(이름표 꾸밈 — 옥상 정원·태양광)
    for (const f of FACES(B9)) fbox(B9, f, 0, h, f[2] + (f[0] ? 0.3 : 0), 0.7, 0.3, o.para || 0xe8e4da, { out: -0.3, top: 0xd3cec4 });
    const spot = (fx, fz) => L2W(B9, fx * (w / 2 - 1.6), fz * (d / 2 - 1.6)), y = top + 0.22;
    if (o.tank !== false && w > 6 && d > 6) { const [x, z] = spot(R() < 0.5 ? -0.6 : 0.6, R() < 0.5 ? -0.5 : 0.5); for (const [a, b] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) box(x + a, y, z + b, 0.15, 0.9, 0.15, 0, 0x8a8f95, { B: dbucket(x, z) }); cyl(x, y + 0.9, z, 0.95, 1.5, o.tankHex || [0x4f8fd0, 0xe8e6df, 0x6aa84c][(R() * 3) | 0], 10); }
    const nAC = o.ac ?? (1 + (R() * 3 | 0)); for (let i = 0; i < nAC; i++) { const [x, z] = spot((R() - 0.5) * 1.4, (R() - 0.5) * 1.4); box(x, y, z, 1.1, 0.75, 0.8, ry, 0xe3e5e6, { top: 0xb9bdc0, B: dbucket(x, z) }); }
    if (o.solar && w > 8) { const [x, z] = spot(R() < 0.5 ? 0.5 : -0.5, R() < 0.5 ? 0.6 : -0.6); for (let i = -1; i <= 1; i++) { const q = L2W(B9, 0, 0); void q; box(x + i * 1.2 * B9.c, y + 0.5, z - i * 1.2 * B9.s, 1.1, 0.08, 1.8, ry, 0x2f4466, { top: 0x3a5a8a }); } }
    if (o.stairs) { const [x, z] = spot(o.stairs[0], o.stairs[1]); box(x, y, z, 3.0, 2.6, 3.2, ry, o.para || 0xe8e4da); box(x, y + 2.6, z, 3.3, 0.2, 3.5, ry, 0x9aa0a6); }
    if (o.antenna && R() < 0.6) { const [x, z] = spot(0.4, -0.4); box(x, y, z, 0.08, 3.2, 0.08, 0, 0x9aa0a6, { B: dbucket(x, z) }); box(x, y + 2.4, z, 1.6, 0.06, 0.06, ry, 0x9aa0a6, { B: dbucket(x, z) }); } }
  function entrance(B9, o = {}) { const f = frontF(B9), wd = o.w || 1.8;
    fbox(B9, f, 0, 0, wd + 0.3, (o.h || 2.4) + 0.2, 0.1, o.frame || 0xe9e5dc); fbox(B9, f, 0, 0, wd, o.h || 2.4, 0.1, o.hex || DOOR, { out: 0.03 });
    if (o.canopy !== false) fbox(B9, f, 0, (o.h || 2.4) + 0.35, wd + 1.6, 0.18, 1.3, o.canopyHex || 0x8a929b, { top: o.canopyHex || 0x8a929b });
    fbox(B9, f, 0, 0, wd + 1.2, 0.18, 1.0, 0xcfc9bd);   // 계단 한 단
  }
  // 박공·모임지붕(용마루 = 긴 변) — 모임 = 네 쪽 모두 비탈
  function hipRoof(cx, y0, cz, sx, sz, h, ry, hex) { const B = bucket(cx, cz), c = Math.cos(ry), s = Math.sin(ry), e = 0.45, hx = sx / 2 + e, hz = sz / 2 + e, col = rgb(hex), col2 = col.map(v => v * 0.86), col3 = col.map(v => v * 0.93);
    const P = (lx, ly, lz) => [cx + lx * c + lz * s, y0 + ly, cz - lx * s + lz * c], alongX = sx >= sz, r = alongX ? Math.max(0, hx - hz) : Math.max(0, hz - hx);
    if (alongX) { const r0 = P(-r, h, 0), r1 = P(r, h, 0); quad(B, P(-hx, 0, hz), P(hx, 0, hz), r1, r0, col); quad(B, P(hx, 0, -hz), P(-hx, 0, -hz), r0, r1, col2); tri(B, P(hx, 0, hz), P(hx, 0, -hz), r1, nrm(P(hx, 0, hz), P(hx, 0, -hz), r1), col3); tri(B, P(-hx, 0, -hz), P(-hx, 0, hz), r0, nrm(P(-hx, 0, -hz), P(-hx, 0, hz), r0), col3); }
    else { const r0 = P(0, h, -r), r1 = P(0, h, r); quad(B, P(hx, 0, hz), P(hx, 0, -hz), r0, r1, col); quad(B, P(-hx, 0, -hz), P(-hx, 0, hz), r1, r0, col2); tri(B, P(-hx, 0, hz), P(hx, 0, hz), r1, nrm(P(-hx, 0, hz), P(hx, 0, hz), r1), col3); tri(B, P(hx, 0, -hz), P(-hx, 0, -hz), r0, nrm(P(hx, 0, -hz), P(-hx, 0, -hz), r0), col3); } }
  // 차(건물에 딸린 것: 소방차·구급차·순찰차 — 생활 시설 '주차된 차'와 같은 부품)
  function vehicle(x, z, ry, kind = 'car', hex = 0x3d74c9) { const y = ty(x, z) + 0.06, big = kind === 'fire', L9 = big ? 7.2 : kind === 'amb' ? 5.2 : 4.3, W9 = big ? 2.4 : 1.85, body = { fire: 0xd9342b, amb: 0xf4f4f0, police: 0xf4f4f0 }[kind] ?? hex;
    const P = (lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
    box(x, y + 0.42, z, L9, big ? 1.5 : 0.85, W9, ry, body, { top: body }); const [cx9, cz9] = P(big ? L9 / 2 - 1.2 : -0.2, 0);
    box(cx9, y + (big ? 1.92 : 1.27), cz9, big ? 2.2 : 2.3, big ? 1.0 : 0.72, W9 * 0.92, ry, 0x2e3a48, { top: body });   // 창 칸
    for (const [a, b] of [[L9 / 2 - 0.9, W9 / 2], [L9 / 2 - 0.9, -W9 / 2], [-L9 / 2 + 0.9, W9 / 2], [-L9 / 2 + 0.9, -W9 / 2]]) { const [wx, wz] = P(a, b * 0.98); box(wx, y, wz, 0.75, 0.75, 0.3, ry, 0x26282b); }
    if (kind === 'police' || kind === 'amb') { const [bx, bz] = P(-0.2, 0); box(bx, y + 1.99, bz, 0.5, 0.18, 1.1, ry, kind === 'police' ? 0x2f6fe0 : 0xe23a3a); box(x, y + 0.75, z, L9 + 0.02, 0.18, W9 + 0.02, ry, kind === 'police' ? 0x2f4a8a : 0xe0453a); }
    if (big) { const [lx9, lz9] = P(-0.8, 0); box(lx9, y + 1.95, lz9, 4.6, 0.25, 0.9, ry, 0xc9ccd0); box(x, y + 0.9, z, L9 + 0.02, 0.16, W9 + 0.02, ry, 0xf2f1ea); } }
  function buildMat(B9) {   // 🧱 블록 그대로(크기·색 정확히)
    terraceOf(B9);   // 비탈 위 블록은 매트 모습에서도 평평한 터 위에
    const col = COL[B9.b.c] ?? 0xcccccc; box(B9.cx, B9.y0, B9.cz, B9.w, B9.h, B9.d, B9.ry, col, { top: col, ao: 0.78 });
    box(B9.cx, B9.y0 + B9.h, B9.cz, B9.w * 0.98, 0.02, B9.d * 0.98, B9.ry, rgb(col, 1.08));
  }
  // ───────── 생활 시설(FAC-1 · 교사 10-12 '저절로 채우지 않음 — 아이가 둘러보고 요구하면 그때 · 부품은 미리 준비해 두고 꺼 둠') ─────────
  //   자료 fac = [{ k, rule? | at?: [x, y] 매트 cm | pts, by: 요구한 아이(모둠), why: 아이가 한 말 }] — 기록 '🙋 아이가 요구해서 생긴 것'(AI가 채운 것과 따로)
  const FACK = { streetlight: { ko: '가로등', en: 'Street Light' }, crosswalk: { ko: '횡단보도', en: 'Crosswalk' }, signal: { ko: '신호등', en: 'Traffic Light' }, streettree: { ko: '가로수', en: 'Street Tree' }, bench: { ko: '벤치', en: 'Bench' },
    busstop: { ko: '버스 정류장', en: 'Bus Stop' }, fence: { ko: '울타리', en: 'Fence' }, flowerbed: { ko: '화단', en: 'Flower Bed' }, parkedcar: { ko: '주차된 차', en: 'Parked Car' }, schoolzone: { ko: '어린이 보호구역', en: 'School Zone' } };
  const RULEK = { bigroads: '모든 큰길', allroads: '모든 길', crossings: '모든 교차로', bigcross: '큰길 교차로', houses: '모든 집', parks: '모든 공원', shops: '모든 가게 앞', school: '학교 둘레' };
  function crossings(bigOnly) { const out = []; for (let i = 0; i < RSEG.length; i++) for (let j = i + 1; j < RSEG.length; j++) { const A = RSEG[i], B = RSEG[j]; if (A.r === B.r || (bigOnly && !(A.r.big && B.r.big))) continue; const X9 = segX(A.a, A.b, B.a, B.b); if (X9 && !inSchool(X9.x, X9.z)) out.push({ x: X9.x, z: X9.z, A, B, ta: X9.t, tb: X9.u }); } return out; }
  const segFrame = s9 => { const L0 = Math.hypot(s9.b[0] - s9.a[0], s9.b[1] - s9.a[1]), tx = (s9.b[0] - s9.a[0]) / L0, tz = (s9.b[1] - s9.a[1]) / L0; return { L0, tx, tz, px: -tz, pz: tx, sw: s9.r.big ? 2.2 : 1.4 }; };
  function zebra(s9, t) { const F = segFrame(s9), cw = s9.hw - F.sw, cx = s9.a[0] + F.tx * t, cz = s9.a[1] + F.tz * t; if (inSchool(cx, cz) || wAt(cx, cz)) return;
    for (let k = -cw + 0.6; k < cw - 0.4; k += 1.0) strip([cx + F.px * k - F.tx * 1.4, cz + F.pz * k - F.tz * 1.4], [cx + F.px * k + F.tx * 1.4, cz + F.pz * k + F.tz * 1.4], 0.5, 0.077, 0xf4f2ea, { step: 3 });
    for (const sg of [-1, 1]) strip([cx + F.px * sg * 0.2 * 0 - F.tx * (1.9 * sg) + F.px * 0, cz - F.tz * (1.9 * sg)], [cx - F.tx * (1.9 * sg) + F.px * sg * cw, cz - F.tz * (1.9 * sg) + F.pz * sg * cw], 0.3, 0.078, 0xf4f2ea, { step: 3 }); }   // 정지선(차선 반쪽)
  const LB = new Map(), lbucket = (x, z) => { const k = Math.floor((x - TX0) / REG) + ':' + Math.floor((z - TZ0) / REG); let b = LB.get(k); if (!b) { b = { p: [], n: [], c: [], u: [] }; LB.set(k, b); } return b; };   // 불빛(가로등 머리·신호) — 밤에 밝게
  function streetlight(x, z, ry, y0) { const y = y0 ?? ty(x, z); cyl(x, y, z, 0.11, 6.2, 0x6f767d, 6); const hx = x + Math.sin(ry) * 1.1, hz = z + Math.cos(ry) * 1.1; box((x + hx) / 2, y + 6.0, (z + hz) / 2, 0.12, 0.12, 1.3, ry, 0x6f767d); box(hx, y + 5.82, hz, 0.42, 0.18, 0.7, ry, 0xfff3c4, { B: lbucket(hx, hz) }); }
  function signalPole(x, z, ry) { const y = ty(x, z); cyl(x, y, z, 0.12, 5.4, 0x5f666d, 6); const hx = x + Math.sin(ry) * 2.4, hz = z + Math.cos(ry) * 2.4; box((x + hx) / 2, y + 5.2, (z + hz) / 2, 0.14, 0.14, 2.6, ry, 0x5f666d);
    box(hx, y + 4.6, hz, 1.25, 0.42, 0.3, ry + Math.PI / 2, 0x26282b); [0xe23a3a, 0xf2c230, 0x3cc76a].forEach((c, i) => box(hx + Math.cos(ry) * (i - 1) * 0.36, y + 4.66, hz - Math.sin(ry) * (i - 1) * 0.36, 0.26, 0.26, 0.06, ry, c, { B: lbucket(hx, hz) })); }
  function busstop(x, z, ry) { const y = ty(x, z), c = Math.cos(ry), s9 = Math.sin(ry), P = (lx, lz) => [x + lx * c + lz * s9, z - lx * s9 + lz * c];
    box(x, y + 2.55, z, 4.4, 0.16, 1.9, ry, 0x2f6fd0, { top: 0x3d7fe0 }); for (const a of [-2.0, 2.0]) { const [px, pz] = P(a, -0.75); box(px, y, pz, 0.12, 2.55, 0.12, ry, 0x7a8592); } const [bx, bz] = P(0, -0.85); box(bx, y + 0.3, bz, 4.2, 2.1, 0.06, ry, 0xbfe0ee, { B: gbucket(bx, bz) });
    const [sx, sz] = P(0, -0.35); box(sx, y + 0.45, sz, 2.8, 0.1, 0.5, ry, 0x9b6a3c); const [px9, pz9] = P(2.6, 0.6); cyl(px9, y, pz9, 0.07, 2.8, 0x7a8592, 6); box(px9, y + 2.5, pz9, 0.9, 0.6, 0.06, ry, 0x2f6fd0); }
  function fenceAround(B9) { const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => L2W(B9, a * (B9.w / 2 + 2.4), b * (B9.d / 2 + 2.4)));
    for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4], Lf = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(Lf / 1.2));
      for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; if (onRoad(x, z, 0.3) || Math.hypot(x - B9.door[0], z - B9.door[1]) < 3.2) continue; box(x, ty(x, z), z, 0.1, 1.0, 0.1, 0, 0xf6f4ee); }
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; if (!onRoad(mx, mz, 0.3)) for (const hy of [0.45, 0.85]) box(mx, ty(mx, mz) + hy, mz, Lf, 0.07, 0.05, Math.atan2(-(b[1] - a[1]), b[0] - a[0]), 0xf6f4ee); } }
  function roadTrees() {   // 길의 기본 구성 가로수(road.trees — 교사 10-13 '큰길 = 넓게 · 인도·가로수 포함') — 아이가 요구한 시설(fac)과 따로 · 같은 길에 fac 가로수가 와도 겹쳐 심지 않음
    for (const s9 of RSEG) { if (!s9.r.trees) continue; const F = segFrame(s9);
      for (const sg of [-1, 1]) for (let t = 5.5 + (sg > 0 ? 5.5 : 0); t < F.L0 - 4; t += 11) { const off = s9.hw - F.sw * 0.35, x = s9.a[0] + F.tx * t + F.px * sg * off, z = s9.a[1] + F.tz * t + F.pz * sg * off;
        if (inSchool(x, z) || wAt(x, z) || onRoad(x, z, -0.5, s9.r)) continue; TREES.round.push({ x, y: ty(x, z), z, s: 0.62, hex: PAL.tree[((x * 7 + z) % 4 + 4) % 4 | 0], ry: x % 6 }); box(x, ty(x, z) + 0.01, z, 1.4, 0.12, 1.4, 0, 0x8a6a4a, { noSide: false }); } } }
  function drawFacilities() {
    const F9 = L.fac || [];
    for (const f of F9) {
      const at = f.at ? [X(f.at[0]), Z(f.at[1])] : null, k = f.k, rule = f.rule;
      const along = (bigOnly, step, fn) => { for (const s9 of RSEG) { if (bigOnly && !s9.r.big) continue; const F = segFrame(s9);
        for (const sg of [-1, 1]) for (let t = step / 2 + (sg > 0 ? step / 2 : 0); t < F.L0 - 4; t += step) { const off = s9.hw - F.sw * 0.35, x = s9.a[0] + F.tx * t + F.px * sg * off, z = s9.a[1] + F.tz * t + F.pz * sg * off;
          if (inSchool(x, z) || wAt(x, z) || onRoad(x, z, -0.5, s9.r)) continue; fn(x, z, Math.atan2(-F.px * sg, -F.pz * sg), s9, sg); } } };
      if (k === 'streetlight') { if (at) streetlight(at[0], at[1], 0); else along(rule !== 'allroads', rule === 'allroads' ? 32 : 26, (x, z, ry) => streetlight(x, z, ry)); }
      else if (k === 'streettree') { if (at) addTree('round', at[0], at[1], 0.75, 0x4e9a43); else along(rule !== 'allroads', 11, (x, z, ry, s9) => { if (s9.r.trees) return; TREES.round.push({ x, y: ty(x, z), z, s: 0.62, hex: PAL.tree[((x * 7 + z) % 4 + 4) % 4 | 0], ry: x % 6 }); box(x, ty(x, z) + 0.01, z, 1.4, 0.12, 1.4, 0, 0x8a6a4a, { noSide: false }); }); }
      else if (k === 'crosswalk' || k === 'signal') { const X9 = crossings(rule === 'bigcross'), pick = at ? [X9.sort((p, q) => Math.hypot(p.x - at[0], p.z - at[1]) - Math.hypot(q.x - at[0], q.z - at[1]))[0]].filter(Boolean) : X9;
        for (const c of pick) { const FA = segFrame(c.A), FB = segFrame(c.B);
          if (k === 'crosswalk') { for (const [S9, F, t0, o] of [[c.A, FA, c.ta, c.B], [c.B, FB, c.tb, c.A]]) for (const sg of [-1, 1]) { const t = t0 * F.L0 + sg * (o.hw + 2.6); if (t > 1 && t < F.L0 - 1) zebra(S9, t); } }
          else for (const [sa, sb] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const x = c.x + FA.px * sa * (c.A.hw - 0.6) + FA.tx * sb * (c.B.hw + 0.8), z = c.z + FA.pz * sa * (c.A.hw - 0.6) + FA.tz * sb * (c.B.hw + 0.8); if (!wAt(x, z)) signalPole(x, z, Math.atan2(-FA.px * sa, -FA.pz * sa)); } } }
      else if (k === 'bench') { if (at) bench(at[0], at[1], 0); else if (rule === 'parks') { for (const n of L.nature) { if (n.k !== 'field' || (n.sub !== 'park')) continue; const sh = shapeOf(n), bb = bboxOf(sh), cx = (bb[0] + bb[2]) / 2, cz = (bb[1] + bb[3]) / 2; for (const [dx, dz] of [[6, 3], [-6, -3], [3, -7], [-3, 7]]) bench(cx + dx, cz + dz, dx ? 0 : Math.PI / 2); } } else along(true, 70, (x, z, ry) => bench(x, z, ry)); }
      else if (k === 'busstop') { if (at) busstop(at[0], at[1], 0); else along(true, 220, (x, z, ry) => busstop(x, z, ry)); }
      else if (k === 'fence') { for (const B9 of BLD) if (B9.kind === 'house' && (rule === 'houses' || (at && Math.hypot(B9.cx - at[0], B9.cz - at[1]) < 20))) fenceAround(B9); }
      else if (k === 'flowerbed') { if (at) { box(at[0], ty(at[0], at[1]), at[1], 3, 0.5, 1.2, 0, 0xb9b2a4); for (let i = -1; i <= 1; i++) TREES.flower.push({ x: at[0] + i, y: ty(at[0], at[1]) + 0.4, z: at[1], s: 1.3, hex: PAL.flower[(i + 1) % 4], ry: 0 }); } else along(true, 18, (x, z, ry) => { box(x, ty(x, z) + 0.14, z, 2.4, 0.42, 0.9, ry + Math.PI / 2, 0xb9b2a4); for (let i = -1; i <= 1; i++) TREES.flower.push({ x: x + Math.cos(ry) * i * 0.7, y: ty(x, z) + 0.5, z: z - Math.sin(ry) * i * 0.7, s: 1.2, hex: PAL.flower[(i + 2) % 4], ry: 0 }); }); }
      else if (k === 'parkedcar') { const cols = [0x3d74c9, 0xe0453a, 0xf2f1ea, 0x3a3a3a, 0x9aa0a6, 0xf2c230]; let i = 0; if (at) vehicle(at[0], at[1], 0, 'car', cols[0]); else for (const B9 of BLD) { if (!['shop', 'office', 'apt', 'public', 'library', 'post'].includes(B9.kind) || (rule === 'shops' && B9.kind !== 'shop')) continue; const f9 = frontF(B9);
        for (let u = -f9[2] / 2 + 2; u < f9[2] / 2 - 1; u += 3.2) { const lx = B9.fl[0] ? B9.fl[0] * (B9.w / 2 + Math.min(5, (B9.gap ?? 4) - 1)) : u, lz = B9.fl[1] ? B9.fl[1] * (B9.d / 2 + Math.min(5, (B9.gap ?? 4) - 1)) : u, [x, z] = L2W(B9, lx, lz); if (onRoad(x, z, 0.5) || (i * 7919) % 3 === 0 && (i++, true)) continue; i++; vehicle(x, z, B9.ry + (B9.fl[0] ? 0 : Math.PI / 2), 'car', cols[i % cols.length]); } } }
      else if (k === 'schoolzone') { for (const s9 of RSEG) { const F = segFrame(s9), cw = s9.hw - F.sw; for (let t = 2; t < F.L0 - 2; t += 5) { const x = s9.a[0] + F.tx * t, z = s9.a[1] + F.tz * t; if (Math.hypot(x - 16.5, z - 58) > 180 || inSchool(x, z) || wAt(x, z) || onRoad(x, z, 0.3, s9.r)) continue; strip([x, z], [x + F.tx * 5, z + F.tz * 5], cw * 2, 0.07, 0xc8473f, { step: 5 }); } } }
    }
  }
  // ───────── 구역 채우기(ZONE-1 · 교사 10-12 '색종이 = 구역 · 아이가 정한 구역을 Claude가 밀도에 맞게 채움') ─────────
  //   zone = { id, k: 'live'|'work'|'green', rect|poly, dens: 'dense'|'normal'|'sparse', type?: 'house'|'apt'|'mix'|'shop'|'office'|'factory'|'park'|'field', note: 아이가 종이에 적은 말 }
  //   길을 따라 필지(가로 폭 × 깊이)를 나누고 → 줄마다 건물(길 쪽이 앞) → 아이 블록·길·물·산은 비켜 감 · 씨앗 = 구역 id(다시 지어도 같은 자리)
  //   기록: BLD[i].gen = 구역 id(🏘 Claude가 구역에 채운 것) — 아이 블록(🧱)과 섞이지 않게
  const ZT = {   // 종류마다 필지 폭 W · 깊이 D · 건물 폭·깊이 범위 · 높이(m) 범위 · 종류
    house: { W: 15, D: 17, bw: [8.5, 11], bd: [8, 10], h: [7, 10.5], kind: 'house' }, apt: { W: 36, D: 26, bw: [26, 32], bd: [12, 14], h: [20, 42], kind: 'apt' },
    shop: { W: 13, D: 15, bw: [9, 11.5], bd: [9, 12], h: [4.5, 9.5], kind: 'shop' }, office: { W: 28, D: 22, bw: [20, 25], bd: [14, 18], h: [16, 36], kind: 'office' },
    factory: { W: 44, D: 36, bw: [30, 38], bd: [20, 28], h: [8, 11], kind: 'factory' } };
  const ZCOL = { live: ['red', 'orange'], work: ['yellow'], green: ['green'] }, ZCOLG = { live: ['mred', 'mbrown', 'mslate', 'mor'], work: ['mtan', 'mslate', 'msand'], green: ['green'] };   // AI가 채운 건물 = 차분한 색(아이 블록의 밝은 색이 돋보이게)
  const occ = new Map(), occKey = (gx, gz) => gx + ':' + gz;
  const occAdd = (x0, z0, x1, z1) => { for (let gx = Math.floor(x0 / 10); gx <= Math.floor(x1 / 10); gx++) for (let gz = Math.floor(z0 / 10); gz <= Math.floor(z1 / 10); gz++) { const k = occKey(gx, gz); let a = occ.get(k); if (!a) occ.set(k, a = []); a.push([x0, z0, x1, z1]); } };
  const occHit = (x0, z0, x1, z1) => { for (let gx = Math.floor(x0 / 10); gx <= Math.floor(x1 / 10); gx++) for (let gz = Math.floor(z0 / 10); gz <= Math.floor(z1 / 10); gz++) { const a = occ.get(occKey(gx, gz)); if (a) for (const r of a) if (x0 < r[2] && x1 > r[0] && z0 < r[3] && z1 > r[1]) return true; } return false; };
  const ZFILL = [];   // 구역마다 채운 수(기록)
  function fillZones() {
    occ.clear();
    for (const P of PROPS) { const r = P.k === 'parking' ? Math.max(P.w, P.d) / 2 + 1 : (PROPK[P.k].r || 1) + 1.5; if (!P.pts) occAdd(P.x - r, P.z - r, P.x + r, P.z + r); }   // 아이 소품 자리는 비켜 채움
    for (const A of AREAS) occAdd(A.sx - 3, A.sz - 2, A.sx + 3, A.sz + 2);
    for (const B9 of BLD) { const xs = B9.corners.map(p => p[0]), zs = B9.corners.map(p => p[1]), m9 = B9.gen ? 2 : B9.kind === 'green' ? 3 : 9; occAdd(Math.min(...xs) - m9, Math.min(...zs) - m9, Math.max(...xs) + m9, Math.max(...zs) + m9); }   // 아이 블록 둘레 9m는 비움(마당·조경 — 아이 것이 묻히지 않게)
    for (const zn of L.zones || []) { const sh = shapeOf(zn); if (!sh || sh.line) continue; const R = rng0(hashS((zn.id || 'z') + ':' + LID)), dens = zn.dens || 'normal', rec = { id: zn.id, k: zn.k, note: zn.note || '', dens, n: {} };
      if (zn.k === 'green') { if (zn.type !== 'paddy') ZFILL.push(rec); continue; }   // 공원·들은 자연 그리기(drawZoneGreen)가
      if (BLD.some(b => !b.gen && b.kind !== 'green' && inShape(sh, b.cx, b.cz))) rec.around = true;   // 교사 10-13 최종: 블록이 있는 칸도 나머지는 동네로 채움(✨ · 블록 둘레는 비움)
      const pickT = () => { const t = zn.type || (zn.k === 'work' ? 'shop' : 'mix'); if (t === 'mix') return R() < (dens === 'dense' ? 0.35 : dens === 'sparse' ? 0.05 : 0.18) ? 'apt' : 'house'; if (t === 'work' || t === 'shop') return dens === 'dense' && R() < 0.35 ? 'office' : 'shop'; return ZT[t] ? t : 'house'; };
      const rowsMax = dens === 'dense' ? 4 : dens === 'sparse' ? 2 : 3, skipP = dens === 'sparse' ? 0.38 : dens === 'dense' ? 0.02 : 0.1, gapK = dens === 'dense' ? 0.86 : dens === 'sparse' ? 1.35 : 1.0, hK = dens === 'dense' ? 1.25 : dens === 'sparse' ? 0.8 : 1;
      const cols = (zn.ai || rec.around ? ZCOLG : ZCOL)[zn.k] || ZCOLG.live, put = (cx, cz, ry, T, bw, bd) => {
        const c = Math.cos(ry), s9 = Math.sin(ry), corners = [[-bw / 2, -bd / 2], [bw / 2, -bd / 2], [bw / 2, bd / 2], [-bw / 2, bd / 2]].map(([lx, lz]) => [cx + lx * c + lz * s9, cz - lx * s9 + lz * c]);
        const xs = corners.map(p => p[0]), zs = corners.map(p => p[1]), x0 = Math.min(...xs) - 1.5, x1 = Math.max(...xs) + 1.5, z0 = Math.min(...zs) - 1.5, z1 = Math.max(...zs) + 1.5;
        if (corners.some(([x, z]) => !inShape(sh, x, z) || onRoad(x, z, 1.0) || wAt(x, z) || inRect(x, z) || tH(x, z) > 3) || occHit(x0, z0, x1, z1)) return false;
        occAdd(x0, z0, x1, z1); const h = Math.min(60, (T.h[0] + R() * (T.h[1] - T.h[0])) * (T.kind === 'house' || T.kind === 'factory' ? 1 : hK)), y0 = Math.min(...corners.map(([x, z]) => ty(x, z)));
        const fl = [0, 1], fw = [s9, c], half = bd / 2, door = [cx + fw[0] * (half + 2.5), cz + fw[1] * (half + 2.5)];
        BLD.push({ b: { id: 'g' + (zn.id || 'z') + '_' + BLD.length, c: cols[(R() * cols.length) | 0], h: h / S, w: bw / S, d: bd / S }, kind: T.kind, cx, cz, w: bw, d: bd, h, ry, c, s: s9, y0, fl, fw, door, gap: put.gap || 0, name: null, corners, gen: zn.id || 'z' });
        rec.n[T.kind] = (rec.n[T.kind] || 0) + 1; return true; };
      // 길을 따라(양쪽) — 줄 1 = 길 앞 · 줄 2·3… = 뒤로(골목 4m)
      for (const sg9 of RSEG) { const { a, b, hw } = sg9, L0 = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L0, tz = (b[1] - a[1]) / L0, px = -tz, pz = tx;
        for (const side of [-1, 1]) { let depth0 = hw + 0.8;
          for (let row = 0; row < rowsMax; row++) { let t = 6 + R() * 4, rowD = 0;
            while (t < L0 - 6) { const T = ZT[pickT()], W = T.W * gapK, D9 = T.D, bw = T.bw[0] + R() * (T.bw[1] - T.bw[0]), bd = T.bd[0] + R() * (T.bd[1] - T.bd[0]);
              const setback = (T.kind === 'house' ? 3 : T.kind === 'apt' ? 7 : T.kind === 'factory' ? 6 : 2.5) * (dens === 'sparse' ? 1.5 : 1), off = depth0 + setback + bd / 2;
              const cx = a[0] + tx * (t + W / 2) + px * side * off, cz = a[1] + tz * (t + W / 2) + pz * side * off, ry = Math.atan2(-px * side * -1, -pz * side * -1) ;
              // 앞(로컬 +z)이 길 쪽(-side·p)을 보게: 로컬 z축 = (sin ry, cos ry) = (-side·px, -side·pz)
              const ry2 = Math.atan2(-side * px, -side * pz); void ry;
              put.gap = row === 0 ? setback - 0.6 : 2; if (R() >= skipP) put(cx, cz, ry2, T, bw, bd);
              rowD = Math.max(rowD, setback + D9); t += W; }
            depth0 += rowD + 4; } } }
      ZFILL.push(rec); }
  }
  // 블록이 있는 칸의 조경(교사 10-13 '아파트 6동 했으면 조경이나 나머지는 상상으로'): 나무 · 주차장 · 놀이터 · 벤치 — 건물은 더 넣지 않음 · 기록 = 🏘 Claude 채움(조경)
  function landscape() {
    const XL = XLn(), YL = YLn();
    for (let ci = 0; ci < XL.length - 1; ci++) for (let ri = 0; ri < YL.length - 1; ri++) {
      const x0 = X(XL[ci]), x1 = X(XL[ci + 1]), z0 = Z(YL[ri]), z1 = Z(YL[ri + 1]), inC = (x, z) => x >= x0 && x < x1 && z >= z0 && z < z1;
      if (inRect((x0 + x1) / 2, (z0 + z1) / 2)) continue;   // 학교 칸(가운데가 학교 상자 안)
      const kids = BLD.filter(b => !b.gen && b.kind !== 'green' && inC(b.cx, b.cz)), A = areaAt((x0 + x1) / 2, (z0 + z1) / 2); if (!kids.length && !A) continue;   // 이름표 칸은 블록이 없어도 이름표대로
      const zn = (L.zones || []).find(q => { const sh = shapeOf(q); return sh && !sh.line && inShape(sh, (x0 + x1) / 2, (z0 + z1) / 2); });
      const grp = zn ? zn.k : (() => { const c = { live: 0, work: 0, pub: 0 }; for (const b of kids) c[(KIND[b.kind] || {}).g || 'pub']++; return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; })();
      const R = rng0(hashS('land:' + ci + ':' + ri + ':' + LID)), n = { 나무: 0, '주차 칸': 0, 놀이터: 0, 벤치: 0 }, free = (x, z, r = 1.5) => !onRoad(x, z, 1.2) && !wAt(x, z) && !inSchool(x, z) && tH(x, z) < 4 && !occHit(x - r, z - r, x + r, z + r);
      const woods = !!(A && A.st.has('woods')), near = (x, z, m) => woods || kids.some(b => Math.hypot(x - b.cx, z - b.cz) < Math.max(b.w, b.d) / 2 + m);   // 블록 사이·둘레만(칸 전체를 숲으로 만들지 않음) — 이름표 '숲'이면 칸 전체
      if (A) { Object.assign(n, A.n || {});
        if (A.st.has('trail')) { let pts = [[x0 + 14, z0 + 14], [x1 - 14, z0 + 14], [x1 - 14, z1 - 14], [x0 + 14, z1 - 14], [x0 + 14, z0 + 14]]; for (let it = 0; it < 2; it++) { const Q = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1]; Q.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); } pts = Q; }   // 칸 안 둘레 숲길(모서리 둥글게)
          let len = 0; const fl = A.st.has('flowers'), segs = densify(pts, 3).reduce((a9, p, i, arr) => (i && a9.push([arr[i - 1], p]), a9), []).filter(P9 => { const mx = (P9[0][0] + P9[1][0]) / 2, mz = (P9[0][1] + P9[1][1]) / 2; return !(onRoad(mx, mz, 1.5) || wAt(mx, mz) || occHit(mx - 1.2, mz - 1.2, mx + 1.2, mz + 1.2) || tH(mx, mz) > 4); });   // 빈 자리 조각을 먼저 고르고(제 자리끼리 막지 않게) 그다음 차지
          for (const P9 of segs) { const mx = (P9[0][0] + P9[1][0]) / 2, mz = (P9[0][1] + P9[1][1]) / 2;
            strip(P9[0], P9[1], 2.2, 0.05, 0xc9a77c, { step: 3 }); occAdd(mx - 1.4, mz - 1.4, mx + 1.4, mz + 1.4); len += Math.hypot(P9[1][0] - P9[0][0], P9[1][1] - P9[0][1]);
            if (fl) { const F = [P9[1][1] - P9[0][1], P9[0][0] - P9[1][0]], l = Math.hypot(F[0], F[1]) || 1; for (const sg of [-1, 1]) if (R() < 0.7) TREES.flower.push({ x: mx + F[0] / l * 1.6 * sg, y: ty(mx, mz), z: mz + F[1] / l * 1.6 * sg, s: 1.1, hex: PAL.flower[(R() * 4) | 0], ry: 0 }); } }
          n['숲길(m)'] = Math.round(len); }
        if (A.st.has('flowers')) { let nf = 0; for (const b of kids) for (let k9 = 0; k9 < 16; k9++) { const a9 = k9 / 16 * 6.2832, rr = Math.max(b.w, b.d) / 2 + 1.6, x = b.cx + Math.cos(a9) * rr, z = b.cz + Math.sin(a9) * rr; if (R() < 0.6 && !onRoad(x, z, 0.5) && !wAt(x, z)) { TREES.flower.push({ x, y: ty(x, z), z, s: 1.1, hex: PAL.flower[(R() * 4) | 0], ry: 0 }); nf++; } } n['꽃'] = nf; } }
      // 주차장: 칸 안 길가(아파트·일하는 곳·공공)
      if (grp !== 'nat' && kids.some(b => b.kind === 'apt' || (KIND[b.kind] || {}).g !== 'live')) { let left = grp === 'live' ? 16 : 12;
        for (const sg9 of RSEG) { if (left <= 0) break; const F = segFrame(sg9); for (const side of [-1, 1]) for (let t = 4; t < F.L0 - 4 && left > 0; t += 2.6) { const off = sg9.hw + 4.6, x = sg9.a[0] + F.tx * t + F.px * side * off, z = sg9.a[1] + F.tz * t + F.pz * side * off;
          if (!inC(x, z) || !near(x, z, 45) || !free(x, z, 2.4)) continue; occAdd(x - 1.3, z - 2.6, x + 1.3, z + 2.6); const ry9 = Math.atan2(-F.tz, F.tx); box(x, ty(x, z) + 0.045, z, 2.5, 0.01, 5.0, ry9, 0x5f6368, { noSide: true }); box(x + F.tx * 1.25, ty(x, z) + 0.05, z + F.tz * 1.25, 0.12, 0.01, 4.4, ry9, 0xf2f1ea, { noSide: true });
          if (R() < 0.45) vehicle(x, z, ry9 + Math.PI / 2, 'car', [0x3d74c9, 0xe0453a, 0xf2f1ea, 0x3a3a3a, 0x9aa0a6][(R() * 5) | 0]); n['주차 칸']++; left--; } } }
      // 놀이터(사는 곳 · 블록 둘 이상): 칸 가운데 쪽 빈자리
      if (grp === 'live' && kids.length >= 2) { const cx = kids.reduce((a, b) => a + b.cx, 0) / kids.length, cz = kids.reduce((a, b) => a + b.cz, 0) / kids.length; let spot = null;
        for (let r = 0; r < 60 && !spot; r += 6) for (let a = 0; a < 6.28 && !spot; a += 0.7) { const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (inC(x - 7, z - 6) && inC(x + 7, z + 6) && [[-6, -5], [6, -5], [-6, 5], [6, 5], [0, 0]].every(([a9, b9]) => free(x + a9, z + b9, 1))) spot = [x, z]; }
        if (spot) { const [px, pz] = spot, y = ty(px, pz); occAdd(px - 7, pz - 6, px + 7, pz + 6); box(px, y + 0.03, pz, 12, 0.06, 10, 0, 0xe6d3a0, { noSide: true });   // 모래 바닥
          box(px - 2.5, y, pz - 2, 0.9, 2.2, 0.9, 0, 0xe0453a); box(px - 2.5, y + 1.0, pz - 0.2, 0.7, 0.12, 3.2, -0.5, 0xf2c230); box(px - 2.5, y + 2.2, pz - 2, 1.2, 0.2, 1.2, 0, 0x3d74c9);   // 미끄럼틀
          for (const sx of [1.5, 4.5]) box(px + sx, y, pz + 2, 0.14, 2.6, 0.14, 0, 0x5f6670); box(px + 3, y + 2.5, pz + 2, 3.3, 0.14, 0.14, 0, 0x5f6670); for (const sx of [2.3, 3.7]) box(px + sx, y + 0.5, pz + 2, 0.6, 0.08, 0.4, 0, 0x9b6a3c);   // 그네
          bench(px - 5.5, pz + 4.2, 0); bench(px + 5.5, pz - 4.2, Math.PI); n.놀이터++; n.벤치 += 2; } }
      // 나무(칸 안 빈자리)
      const pT = woods ? 0.82 : grp === 'live' ? 0.5 : grp === 'work' ? 0.25 : 0.4;
      for (let z = z0 + 4; z < z1 - 2; z += 8) for (let x = x0 + 4; x < x1 - 2; x += 8) { const px = x + (R() - 0.5) * 5, pz = z + (R() - 0.5) * 5, ed = Math.min(px - x0, x1 - px, pz - z0, z1 - pz), soft = woods ? Math.min(1, ed / 26) * (0.55 + 0.9 * vnoise(px / 37, pz / 37)) : 1; if (R() > pT * soft || !near(px, pz, 30) || !free(px, pz, 1.6)) continue; /* 숲 이름표 칸: 칸 가장자리로 갈수록 성기게(네모난 숲 경계가 안 보이게) */ const sp = R() < 0.65 ? 'round' : R() < 0.5 ? 'poplar' : 'pine';
        TREES[sp].push({ x: px, y: ty(px, pz), z: pz, s: 0.7 + R() * 0.35, hex: treeHex(sp, R), ry: R() * 6 }); n.나무++; }
      ZFILL.push({ id: 'land:' + cellOf((x0 + x1) / 2, (z0 + z1) / 2), k: 'land', cell: cellOf((x0 + x1) / 2, (z0 + z1) / 2), note: A ? '🔖 ' + A.t : zn ? zn.note || '' : '', dens: '', n }); }
  }
  // ───────── 종이 소품(PROPS-1 · 교사 10-13 인쇄지 — 아이들이 오려 판에 놓음 · 소품마다 이름이 인쇄됨) ─────────
  //   규칙 = 블록과 같음: 놓은 자리·개수 그대로(엔진이 더 넣지 않음) · 기록 = 🧱 아이 것 · 세우는 카드 = 실제 크기(가로등 6m · 정자 5m · 비닐하우스 22m) · 납작한 것 = 길·강·땅 위에
  //   자료 layer.props = [{ id, k, x, y | cell, face?: 'n'|'s'|'e'|'w'(앞이 보는 쪽 — 없으면 가까운 길 쪽), along?: 'ns'|'ew'(긴 쪽 — 비닐하우스·주차장), name?(빈 카드에 아이가 쓴 이름), to?: ['장소', '장소'](이정표), pts?(산책로 띠), w?·d?(주차장 cm), road?(다리 — 길 id) }]
  //   빈 카드(k 'card') = 아이가 쓴 이름으로 종류를 찾음(가로등·분수·화장실…) → 건물 이름이면 2cm 블록처럼 그 건물 · 모르는 말이면 이름 팻말로 어림(✨)
  let PROPS = [], PNOTE = [], PCOL = [], AREAS = [], ROOFS = [];
  const PTX = [];   // 글자 판(이정표·팻말·이름표 돌) 텍스처·재질 — 다시 지을 때·끝낼 때 버림
  const LP = (x, z, ry) => (lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];   // 로컬 → 세계(앞 = 로컬 +z = (sin ry, cos ry))
  const col9 = (x, z, hx, hz, ry, y0, y1) => { const Q = LP(x, z, ry), C = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([a, b]) => Q(a, b)), xs = C.map(p => p[0]), zs = C.map(p => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0, y1 }; };
  const dbx = (x, y, z, sx, sy, sz, ry, hex, o = {}) => box(x, y, z, sx, sy, sz, ry, hex, { ...o, B: dbucket(x, z) });   // 작은 부재 = 디테일 층(가까울 때만 · DETAIL-1과 같은 뜻)
  function rock(x, y, z, ry, w, h, d, hex, R, o = {}) {   // 자연석: 앞면은 반듯(글씨판) · 옆·뒤는 울퉁불퉁 · 위는 둥긋 · 면마다 명암
    const B = o.D ? dbucket(x, z) : bucket(x, z), Q = LP(x, z, ry), col = rgb(hex), F = [[-w / 2, d / 2], [w / 2, d / 2], [w / 2 + 0.08, d * 0.05], [w / 2 - 0.14, -d / 2 + 0.05], [w * 0.1, -d / 2 - 0.07], [-w / 2 + 0.12, -d / 2 + 0.02], [-w / 2 - 0.08, d * 0.12]];
    const T = F.map(([a, b], i) => i < 2 ? [a, b] : [a * 0.84, b * 0.84]), H = F.map((_, i) => h * (i < 2 ? 1 : 0.86 + R() * 0.14)), V = (p9, yy) => { const [px, pz] = Q(p9[0], p9[1]); return [px, y + yy, pz]; }, C = V([0, -d * 0.1], h * 1.06);
    for (let i = 0; i < F.length; i++) { const j = (i + 1) % F.length, k = 0.84 + R() * 0.14; quad(B, V(F[i], 0), V(F[j], 0), V(T[j], H[j]), V(T[i], H[i]), col.map(v => v * k), [0.8, 0.8, 1, 1]); const a = V(T[i], H[i]), b = V(T[j], H[j]); tri(B, a, b, C, nrm(a, b, C), col.map(v => v * (1.02 + R() * 0.06))); } }
  const nearSeg = (x, z, max = 1e9) => { let best = null; for (const sg of RSEG) { const r = segD(x, z, sg.a, sg.b); if (r[0] < max && (!best || r[0] < best.d)) best = { d: r[0], sg, t: r[1], p: [r[2], r[3]] }; } return best; };
  const FACEV = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
  function prepProps() {
    PROPS = []; PNOTE = []; const taken = [];
    const facing = (P, f) => { const v = FACEV[f]; if (v) return Math.atan2(v[0], v[1]); const r = nearSeg(P.x, P.z, 90); return r ? Math.atan2(r.p[0] - P.x, r.p[1] - P.z) : 0; };
    const bad = (x, z, r) => inSchool(x, z) || x < TX0 + 4 || x > TX1 - 4 || z < TZ0 + 4 || z > TZ1 - 4 || !!onRoad(x, z, r + 0.8) || wAt(x, z) > 0 || wdI(x, z) > 0.05 || BLD.some(b => Math.hypot(x - b.cx, z - b.cz) < Math.max(b.w, b.d) / 2 + r) || taken.some(o => Math.hypot(o[0] - x, o[1] - z) < o[2] + r);
    const settle = (P, r) => { if (!bad(P.x, P.z, r)) return; const x0 = P.x, z0 = P.z; for (let d = 3; d <= 48; d += 3) for (let a = 0; a < 16; a++) { const x = x0 + Math.cos(a / 16 * 6.2832) * d, z = z0 + Math.sin(a / 16 * 6.2832) * d; if (!bad(x, z, r)) { P.x = x; P.z = z; if (d > 6) PNOTE.push({ t: '「' + P.label + '」은 길·물·건물과 겹쳐서 ' + Math.round(d) + 'm 옆에 세웠어요', at: [x, z] }); return; } } };
    for (const p of L.props || []) {
      let k = p.k; const nm = p.name || null; if (!PROPK[k] || k === 'card') k = (nm && (NAMEPROP.find(([re]) => re.test(nm)) || [])[1]) || 'card';
      let mx = p.x, my = p.y; if (mx == null && p.cell) { const R9 = cellRect(p.cell); if (R9) { mx = (R9[0] + R9[2]) / 2; my = (R9[1] + R9[3]) / 2; } }
      if (mx == null && !(p.pts && p.pts.length > 1)) continue;
      const K = PROPK[k], P = { id: p.id || ('p' + PROPS.length), k, src: p, name: nm, en: p.en || null, label: nm || K.ko, x: mx != null ? X(mx) : X(p.pts[0][0]), z: my != null ? Z(my) : Z(p.pts[0][1]), to: p.to || null, road: p.road || null, card: p.k === 'card' || !PROPK[p.k], guess: k === 'card', ai: p.ai || null };
      if (k === 'trail') { P.pts = (p.pts || [[mx - 4, my], [mx + 4, my]]).map(q => [X(q[0]), Z(q[1])]); P.w = p.w ? p.w * S : 2.4; PROPS.push(P); continue; }
      if (k === 'crosswalk') { const r = nearSeg(P.x, P.z, 30); if (!r) { PNOTE.push({ t: '「횡단보도」 둘레 30m 안에 길이 없어 놓지 못했어요', at: [P.x, P.z] }); continue; } P.sg = r.sg; P.t = r.t * Math.hypot(r.sg.b[0] - r.sg.a[0], r.sg.b[1] - r.sg.a[1]); P.x = r.p[0]; P.z = r.p[1]; PROPS.push(P); continue; }
      if (k === 'bridge') { PROPS.push(P); continue; }
      if (k === 'fishing') {   // 물가 찾기(40m 안) → 팻말은 둑 위 · 나무 데크가 물로
        let W = null; for (let d = 0; d <= 40 && !W; d += 2) for (let a = 0; a < 16 && !W; a++) { const x = P.x + Math.cos(a / 16 * 6.2832) * d, z = P.z + Math.sin(a / 16 * 6.2832) * d; if (wAt(x, z) > 0) W = [x, z]; }
        if (W) { const dx = P.x - W[0], dz = P.z - W[1], l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l; let bx = W[0], bz = W[1]; for (let t = 0; t < 40; t += 0.5) { bx = W[0] + ux * t; bz = W[1] + uz * t; if (wdI(bx, bz) < 0.04 && !wAt(bx, bz)) break; }
          P.x = bx + ux * 2; P.z = bz + uz * 2; P.ry = Math.atan2(-ux, -uz); P.deck = [bx + ux * 0.5, bz + uz * 0.5, W[0] - ux * 1.5, W[1] - uz * 1.5]; }
        else PNOTE.push({ t: '「낚시터」 둘레 40m 안에 물이 없어 팻말만 세웠어요', at: [P.x, P.z] }); }
      if (K.side) { const r = nearSeg(P.x, P.z, 60); if (r) { /* 학교 칸 줄은 판 1cm가 실제보다 넓게 펴져서(학교 = 실제 크기) 넉넉히 */ const ax = r.sg.b[0] - r.sg.a[0], az = r.sg.b[1] - r.sg.a[1], L0 = Math.hypot(ax, az), sg = Math.sign((P.x - r.p[0]) * -az + (P.z - r.p[1]) * ax) || 1, nx9 = -az / L0 * sg, nz9 = ax / L0 * sg, sw = r.sg.r.big ? 2.2 : 1.4, off = k === 'busstop' ? r.sg.hw + 1.4 : r.sg.hw - sw * 0.35;
          P.x = r.p[0] + nx9 * off; P.z = r.p[1] + nz9 * off; P.ry = Math.atan2(-nx9, -nz9); P.roadside = true; } }
      if (k === 'parking') { P.w = (p.w || 5) * S; P.d = (p.d || 3) * S; }
      if (!P.roadside && !P.deck) settle(P, k === 'parking' ? Math.max(P.w, P.d) / 2 : K.r || 1);
      if (P.ry == null) { if (k === 'greenhouse' || k === 'parking') { const r = nearSeg(P.x, P.z, 120); P.ry = p.along === 'ew' ? 0 : p.along === 'ns' ? -Math.PI / 2 : r ? Math.atan2(-(r.sg.b[1] - r.sg.a[1]), r.sg.b[0] - r.sg.a[0]) : 0; } else P.ry = facing(P, p.face); }
      taken.push([P.x, P.z, k === 'parking' ? Math.max(P.w, P.d) / 2 : K.r || 1]); PROPS.push(P); }
  }
  // 글자 판(SIGN-1): 간판·팻말·표지석 글씨를 글씨 묶음 한 장(아틀라스)에 모아 구역마다 한 메시로 — 글씨가 수백 개여도 그리기 몇 번(크롬북) · 밤에는 간판이 은은히 빛남
  //   글꼴 = 크롬북(Noto Sans CJK KR) · 윈도(맑은 고딕) · 맥(Apple SD Gothic Neo) 순 — 한글 깨짐 없음 · 이모지는 글자 판에 쓰지 않음
  const SFONT = '"Noto Sans KR","Noto Sans CJK KR","Apple SD Gothic Neo","Malgun Gothic","NanumGothic",sans-serif';
  let SQ = []; const mctx = document.createElement('canvas').getContext('2d');
  function textPlane(group, t, cx, cy, cz, ry, maxW, h, o = {}) { void group; mctx.font = '800 56px ' + SFONT; const tw = Math.ceil(mctx.measureText(t).width) + 36, asp = tw / 80; let ph = h, pw = h * asp; if (pw > maxW) { pw = maxW; ph = maxW / asp; }
    for (const sg of o.one ? [1] : [1, -1]) { const off = (o.off || 0.045) * sg; SQ.push({ t, bg: o.bgc || '#f6f4ee', fg: o.fg || '#1d2b3a', x: cx + Math.sin(ry) * off, y: cy, z: cz + Math.cos(ry) * off, ry: ry + (sg < 0 ? Math.PI : 0), w: pw, h: ph, glow: !!o.glow }); } }
  function flushSigns(group) {
    if (!SQ.length) return; const keyOf = q => q.t + '|' + q.bg + '|' + q.fg, U = new Map(); for (const q of SQ) { const k = keyOf(q); if (!U.has(k)) U.set(k, q); }
    const W = 2048, RH = 80, PAD = 6; let x = 0, y = 0; const pos = new Map(); mctx.font = '800 56px ' + SFONT;
    for (const [k, q] of U) { const tw = Math.min(W - 2 * PAD, Math.ceil(mctx.measureText(q.t).width) + 36); if (x + tw + PAD * 2 > W) { x = 0; y += RH + PAD * 2; } pos.set(k, [x + PAD, y + PAD, tw]); x += tw + PAD * 2; }
    const H = Math.pow(2, Math.ceil(Math.log2(y + RH + PAD * 2))), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [k, q] of U) { const [px, py, tw] = pos.get(k); g.fillStyle = q.bg; g.fillRect(px - PAD, py - PAD, tw + PAD * 2, RH + PAD * 2); g.font = '800 56px ' + SFONT; g.fillStyle = q.fg; g.fillText(q.t, px + tw / 2, py + 43, tw - 16); }
    const tex = new T3.CanvasTexture(c); tex.colorSpace = T3.SRGBColorSpace; tex.anisotropy = 4; const mat = new T3.MeshLambertMaterial({ map: tex, emissive: 0x000000, emissiveMap: tex }); PTX.push(tex, mat); SMAT = mat;
    const RB = new Map(); for (const q of SQ) { const [px, py, tw] = pos.get(keyOf(q)), u0 = px / W, u1 = (px + tw) / W, v1 = 1 - py / H, v0 = 1 - (py + RH) / H, k = Math.floor((q.x - TX0) / REG) + ':' + Math.floor((q.z - TZ0) / REG); let b = RB.get(k); if (!b) RB.set(k, b = { p: [], n: [], u: [] });
      const cR = Math.cos(q.ry), sR = Math.sin(q.ry), hw9 = q.w / 2, hh = q.h / 2, P9 = (lx, ly) => [q.x + lx * cR, q.y + ly, q.z - lx * sR], nn = [sR, 0, cR];
      const A = P9(-hw9, -hh), B2 = P9(hw9, -hh), C = P9(hw9, hh), Dd = P9(-hw9, hh); for (const [v, uv] of [[A, [u0, v0]], [B2, [u1, v0]], [C, [u1, v1]], [A, [u0, v0]], [C, [u1, v1]], [Dd, [u0, v1]]]) { b.p.push(...v); b.n.push(...nn); b.u.push(...uv); } }
    for (const [, b] of RB) { const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); geo.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); geo.setAttribute('uv', new T3.Float32BufferAttribute(b.u, 2)); geo.computeBoundingSphere(); GEOS.push(geo);
      const m = new T3.Mesh(geo, mat); m.matrixAutoUpdate = false; m.userData.fx = 1; group.add(m); }
    SQ = []; applySignNight(); }
  let SMAT = null, NIGHT9 = 0, LIFE = null; const applySignNight = () => { if (SMAT) SMAT.emissive.setHex(NIGHT9 >= 1 ? 0x8a8070 : NIGHT9 ? 0x3a3428 : 0x000000); };
  function signBoard(group, x, z, ry, t, o = {}) { const y = o.y0 ?? ty(x, z), Q = LP(x, z, ry), bw = o.w || 1.8, bh = o.h || 0.8, by = o.y || 1.1, bg = o.bg ?? 0xf6f4ee, fr = o.frame ?? 0x6b4a2f;
    for (const s9 of o.one ? [0] : [-1, 1]) { const [px, pz] = Q(s9 * (bw / 2 - 0.15), -0.1), ph = by + bh * 0.85; box(px, y, pz, 0.1, ph, 0.1, ry, o.post ?? 0x7a5232); dbx(px, y + ph, pz, 0.14, 0.05, 0.14, ry, fr); dbx(px, y, pz, 0.18, 0.12, 0.18, ry, 0x8d8a80); }   // 기둥 · 기둥 머리 · 밑동 돌
    box(x, y + by, z, bw, bh, 0.08, ry, bg, { top: bg });
    for (const [u, v, sw, sh] of [[0, by + bh - 0.03, bw + 0.06, 0.06], [0, by - 0.03, bw + 0.06, 0.06], [-bw / 2, by, 0.06, bh], [bw / 2, by, 0.06, bh]]) { const [fx, fz] = Q(u, 0); dbx(fx, y + v, fz, sw, sh, 0.1, ry, fr); }   // 테두리
    textPlane(group, t, x, y + by + bh / 2, z, ry, bw * 0.88, bh * 0.74, { bgc: o.bgc, fg: o.fg, off: 0.046 }); }
  function bench2(x, z, ry) { const y = ty(x, z), Q = LP(x, z, ry);
    for (let i = 0; i < 3; i++) { const [sx, sz] = Q(0, -0.16 + i * 0.16); box(sx, y + 0.42, sz, 1.8, 0.06, 0.13, ry, 0x9b6a3c); }   // 앉는 널 셋
    for (let i = 0; i < 2; i++) { const [bx, bz] = Q(0, -0.26); box(bx, y + 0.58 + i * 0.2, bz, 1.8, 0.13, 0.05, ry, 0x9b6a3c); }   // 등 널 둘
    for (const s9 of [-0.82, 0.82]) { const [lx, lz] = Q(s9, 0); box(lx, y, lz, 0.08, 0.42, 0.46, ry, 0x4a4f57); dbx(lx, y + 0.6, lz, 0.07, 0.06, 0.42, ry, 0x4a4f57); const [px9, pz9] = Q(s9, -0.27); dbx(px9, y + 0.42, pz9, 0.06, 0.4, 0.06, ry, 0x4a4f57); } }   // 다리·팔걸이(무쇠)
  function tentCard(x, z, ry, hex) {   // 🧱 판 모습: 접어 세운 종이 카드(2.4 × 1.2cm · 높이 1.4cm)
    const y = ty(x, z) + 0.02, Q = LP(x, z, ry), B = bucket(x, z), w = 2.4 * S / 2, d = 1.2 * S / 2, h = 1.4 * S, V = (a, b, yy) => { const [px, pz] = Q(a, b); return [px, y + yy, pz]; }, wc = rgb(0xf6f4ee), kc = rgb(hex);
    quad(B, V(-w, d, 0), V(w, d, 0), V(w, 0, h), V(-w, 0, h), wc); quad(B, V(w, -d, 0), V(-w, -d, 0), V(-w, 0, h), V(w, 0, h), wc.map(v => v * 0.9));
    for (const [a, b, c9] of [[V(w, d, 0), V(w, -d, 0), V(w, 0, h)], [V(-w, -d, 0), V(-w, d, 0), V(-w, 0, h)]]) tri(B, a, b, c9, nrm(a, b, c9), kc); }
  function pavilion(x, z, ry) { const y = ty(x, z), Q = LP(x, z, ry);
    box(x, y - 0.3, z, 5.8, 0.55, 5.8, ry, 0xb3ad9f, { top: 0xbfb9ab }); box(x, y + 0.25, z, 5.2, 0.2, 5.2, ry, 0xc3bdaf, { top: 0xcdc7b9 });   // 두 단 기단(장대석)
    for (let i = -2; i <= 2; i++) { const [lx, lz] = Q(i * 1.16, 2.62); dbx(lx, y + 0.25, lz, 0.03, 0.2, 0.04, ry, 0x9a9486); }   // 기단 돌 이음
    box(x, y + 0.45, z, 4.6, 0.22, 4.6, ry, 0xa8743f, { top: 0xb88350 }); for (let i = -5; i <= 5; i++) { const [fx, fz] = Q(i * 0.42, 0); dbx(fx, y + 0.67, fz, 0.03, 0.006, 4.5, ry, 0x8a5a30, { noSide: true }); }   // 우물마루 · 널 이음
    for (const [a, b] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { const [px, pz] = Q(a, b); dbx(px, y + 0.45, pz, 0.42, 0.12, 0.42, ry, 0x9a9486); cyl(px, y + 0.57, pz, 0.15, 2.45, 0x8e3b2a, 10); dbx(px, y + 2.86, pz, 0.38, 0.2, 0.38, ry, 0x2f6fb0); }   // 주춧돌 · 둥근 기둥(주칠) · 주두(단청 파랑)
    for (const [a, b, sx, sz] of [[0, -2, 4.3, 0.26], [0, 2, 4.3, 0.26], [-2, 0, 0.26, 4.3], [2, 0, 0.26, 4.3]]) { const [px, pz] = Q(a, b); box(px, y + 2.86, pz, sx, 0.32, sz, ry, 0x3f7a5a); dbx(px, y + 2.8, pz, sx * 0.99 + (sx < 1 ? 0.02 : 0), 0.07, sz * 0.99 + (sz < 1 ? 0.02 : 0), ry, 0xd9473b); dbx(px, y + 3.15, pz, sx + (sx < 1 ? 0.04 : 0), 0.06, sz + (sz < 1 ? 0.04 : 0), ry, 0xf2c230); }   // 창방(단청 초록) · 붉은 띠 · 금빛 띠
    for (const [a, b, sx, sz] of [[0, -2.12, 3.7, 0.09], [-2.12, 0, 0.09, 3.7], [2.12, 0, 0.09, 3.7]]) { const [px, pz] = Q(a, b); dbx(px, y + 1.18, pz, sx, 0.08, sz, ry, 0x7a4a2a); dbx(px, y + 0.88, pz, sx, 0.05, sz, ry, 0x7a4a2a);
      const n = 10; for (let k = 0; k < n; k++) { const t = -0.5 + (k + 0.5) / n, [bx, bz] = Q(a + (sx > 1 ? t * sx : 0), b + (sz > 1 ? t * sz : 0)); dbx(bx, y + 0.67, bz, 0.06, 0.51, 0.06, ry, 0x8a5a30); } }   // 계자 난간(살대) — 앞은 트임
    box(x, y + 3.2, z, 4.9, 0.06, 4.9, ry, 0x6b4a2f, { bottom: true }); for (let i = -4; i <= 4; i++) { const [rx, rz] = Q(i * 0.6, 0); dbx(rx, y + 3.12, rz, 0.1, 0.08, 4.8, ry, 0x5a3c26); }   // 천장 · 서까래
    hipRoof(x, y + 3.24, z, 5.4, 5.4, 0.55, ry, 0x3d464f); hipRoof(x, y + 3.62, z, 4.6, 4.6, 1.75, ry, 0x4a535c);   // 처마 겹(살짝 들린 느낌) · 기와지붕
    const ap = y + 3.62 + 1.75; { const [tx9, tz9] = [x, z]; cyl(tx9, ap - 0.05, tz9, 0.16, 0.3, 0x2f343a, 8); cyl(tx9, ap + 0.25, tz9, 0.08, 0.22, 0x2f343a, 6); }   // 절병통
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const c0 = Q(a * 2.75, b * 2.75), B = bucket(x, z), col = rgb(0x2f343a); const p0 = [c0[0], y + 3.62 + 0.04, c0[1]], p1 = [x, ap + 0.04, z], [ox, oz] = Q(-b * 0.07, a * 0.07), [ox0, oz0] = Q(0, 0), dx = ox - ox0, dz = oz - oz0;
      const r0 = [p0[0] - dx, p0[1] + 0.12, p0[2] - dz], r1 = [p0[0] + dx, p0[1] + 0.12, p0[2] + dz], r2 = [p1[0] + dx, p1[1] + 0.12, p1[2] + dz], r3 = [p1[0] - dx, p1[1] + 0.12, p1[2] - dz]; quad(B, r0, r1, r2, r3, col); quad(B, r3, r2, r1, r0, col); }   // 내림마루(검은 선 · 양면)
    for (let i = 0; i < 2; i++) { const [sx, sz] = Q(0, 3.05 + i * 0.35); box(sx, y, sz, 1.6 - i * 0.2, 0.3 - i * 0.14, 0.4, ry, 0xb3ad9f); }   // 돌계단
    PCOL.push(col9(x, z, 2.9, 2.9, ry, y - 1, y + 0.25), col9(x, z, 2.6, 2.6, ry, y - 1, y + 0.45), col9(x, z, 2.3, 2.3, ry, y - 1, y + 0.67)); }
  function scarecrow(x, z, ry) { const y = ty(x, z), Q = LP(x, z, ry);
    box(x, y, z, 0.12, 2.1, 0.12, ry, 0x7a5232); box(x, y + 1.45, z, 1.7, 0.1, 0.1, ry, 0x7a5232); box(x, y + 0.95, z, 0.72, 0.62, 0.34, ry, 0x3f6fb5); box(x, y + 1.4, z, 1.5, 0.22, 0.3, ry, 0x4f7fc5);   // 막대 · 팔 · 저고리 · 소매
    for (const s9 of [-1, 1]) { const [hx, hz] = Q(s9 * 0.84, 0); box(hx, y + 1.22, hz, 0.2, 0.3, 0.2, ry, 0xe2c46a); }
    box(x, y + 1.62, z, 0.42, 0.4, 0.38, ry, 0xe8cf86); cyl(x, y + 2.02, z, 0.55, 0.06, 0xd9b25a, 10); cyl(x, y + 2.08, z, 0.26, 0.26, 0xcfa64e, 8);   // 짚 얼굴 · 밀짚모자
    const [fx, fz] = Q(0, 0.2); dbx(fx, y + 1.7, fz, 0.24, 0.04, 0.02, ry, 0x3a2a1a); for (const s9 of [-1, 1]) { const [ex, ez] = Q(s9 * 0.1, 0.2); dbx(ex, y + 1.84, ez, 0.06, 0.06, 0.02, ry, 0x3a2a1a); const [cx9, cz9] = Q(s9 * 0.13, 0.2); dbx(cx9, y + 1.74, cz9, 0.07, 0.05, 0.015, ry, 0xf08fb2); }   // 웃는 입 · 눈 · 볼
    box(x, y + 0.72, z, 0.62, 0.26, 0.3, ry, 0xe2c46a); dbx(x, y + 0.93, z, 0.76, 0.06, 0.36, ry, 0x8a5a30); for (let i = -2; i <= 2; i++) { const [tx9, tz9] = Q(i * 0.13, 0.17); dbx(tx9, y + 0.6, tz9, 0.05, 0.14, 0.02, ry, 0xd9b25a); } }   // 짚 치마 · 새끼줄 띠 · 짚 끝
  function greenhouse(x, z, ry) { const y = ty(x, z), L9 = 22, W9 = 7, H9 = 3.2, B = bucket(x, z), Q = LP(x, z, ry), seg = 8, film = rgb(0xe9f1ec), rib = rgb(0x8f989d), endc = rgb(0xdbe6de);
    const arc = (i, k = 1) => { const a = Math.PI * i / seg; return [-Math.cos(a) * W9 / 2 * k, Math.sin(a) * H9 * k]; }, V = (lx, lz, yy) => { const [px, pz] = Q(lx, lz); return [px, y + yy, pz]; };
    for (let i = 0; i < seg; i++) { const [z0, y0] = arc(i), [z1, y1] = arc(i + 1); const open = i === 0 || i === seg - 1; if (open) { const t = 0.55, za = z0 + (z1 - z0) * t, ya = y0 + (y1 - y0) * t; quad(B, V(-L9 / 2, z1, y1), V(L9 / 2, z1, y1), V(L9 / 2, za, ya), V(-L9 / 2, za, ya), film); const [rx, rz] = Q(0, za * 1.01); box(rx, y + ya - 0.12, rz, L9, 0.18, 0.18, ry, 0xd5ddd8); continue; }   // 옆 비닐을 말아 올림(안이 보이게)
      quad(B, V(-L9 / 2, z1, y1), V(L9 / 2, z1, y1), V(L9 / 2, z0, y0), V(-L9 / 2, z0, y0), film.map(v => v * (0.93 + 0.07 * Math.sin(Math.PI * (i + 0.5) / seg)))); }   // 비닐(반원 터널)
    box(x, y, z, L9 - 0.4, 0.05, W9 - 0.6, ry, 0x7a5a3a, { noSide: true }); for (const zz of [-2.1, 0, 2.1]) { const [cx9, cz9] = Q(0, zz); box(cx9, y + 0.05, cz9, L9 - 1.6, 0.18, 0.9, ry, 0x8a6440, { top: 0x8a6440 }); for (let k = -L9 / 2 + 1.4; k < L9 / 2 - 1; k += 0.9) { const [px, pz] = Q(k, zz); dbx(px, y + 0.23, pz, 0.5, 0.32, 0.5, ry + k, k % 1.8 < 0.9 ? 0x5f9a3f : 0x6aa84c); } }   // 흙 바닥 · 두둑 셋 · 작물
    for (let r = -L9 / 2 + 1.5; r < L9 / 2 - 1; r += 2.6) for (let i = 0; i < seg; i++) { const [z0, y0] = arc(i, 1.012), [z1, y1] = arc(i + 1, 1.012); quad(B, V(r - 0.06, z1, y1), V(r + 0.06, z1, y1), V(r + 0.06, z0, y0), V(r - 0.06, z0, y0), rib); }   // 철 골조
    for (const e of [-1, 1]) for (let i = 0; i < seg; i++) { const [z0, y0] = arc(i), [z1, y1] = arc(i + 1), a = V(e * L9 / 2, 0, 0), b = V(e * L9 / 2, z0, y0), c9 = V(e * L9 / 2, z1, y1); if (e > 0) tri(B, a, b, c9, nrm(a, b, c9), endc); else tri(B, a, c9, b, nrm(a, c9, b), endc); }   // 양 끝 막
    for (const e of [-1, 1]) { const [dx, dz] = Q(e * (L9 / 2 + 0.03), 0); box(dx, y, dz, 0.05, 2.0, 1.4, ry, 0x7f9a86); }   // 문
    PCOL.push(col9(x, z, L9 / 2, W9 / 2, ry, y - 1, y + H9)); }
  function tiller(x, z, ry) { const y = ty(x, z), Q = LP(x, z, ry);
    const [ex, ez] = Q(0, 1.4); box(ex, y + 0.55, ez, 0.8, 0.6, 0.9, ry, 0x2f7fc1, { top: 0x3d8fd5 }); const [rx, rz] = Q(0, 1.95); box(rx, y + 0.6, rz, 0.5, 0.5, 0.2, ry, 0xd9dcdf);   // 엔진 · 라디에이터
    for (const s9 of [-1, 1]) { const [wx, wz] = Q(s9 * 0.6, 1.3); box(wx, y, wz, 0.24, 0.78, 0.78, ry, 0x26282b); const [hx, hz] = Q(s9 * 0.35, 0.2); box(hx, y + 0.95, hz, 0.08, 0.08, 2.0, ry, 0x5f666d); }   // 앞바퀴 · 손잡이
    const [tx9, tz9] = Q(0, -1.35); box(tx9, y + 0.42, tz9, 1.5, 0.45, 1.9, ry, 0x8a8f94, { top: 0x8a6440 }); for (const s9 of [-1, 1]) { const [wx, wz] = Q(s9 * 0.86, -1.45); box(wx, y, wz, 0.2, 0.6, 0.6, ry, 0x26282b); }   // 짐칸(흙) · 바퀴
    PCOL.push(col9(x, z, 0.9, 2.1, ry, y - 1, y + 1.1)); }
  function trailhead(group, x, z, ry) { const y = ty(x, z), Q = LP(x, z, ry);
    for (const s9 of [-1, 1]) { const [px, pz] = Q(s9 * 1.5, 0); cyl(px, y, pz, 0.17, 2.9, 0x7a5232, 7); } box(x, y + 2.6, z, 3.4, 0.28, 0.28, ry, 0x6b4a2f);   // 통나무 문
    box(x, y + 1.9, z, 1.6, 0.5, 0.07, ry, 0x9b6a3c); textPlane(group, '등산로', x, y + 2.15, z, ry, 1.45, 0.38, { bgc: '#9b6a3c', fg: '#fff7e0', off: 0.04 });
    for (let i = 0; i < 3; i++) { const [sx, sz] = Q(0, -1.2 - i * 0.9); box(sx, y, sz, 1.6, 0.16 * (i + 1), 0.8, ry, 0x9a9488); }   // 돌계단(산 쪽으로)
    for (const s9 of [-1, 1]) { for (let k = 0; k < 4; k++) { const [fx, fz] = Q(s9 * 1.5, -0.9 - k * 1.3); cyl(fx, y, fz, 0.08, 0.75, 0x7a5232, 6); } const [rx, rz] = Q(s9 * 1.5, -2.85); dbx(rx, y + 0.62, rz, 0.05, 0.05, 3.9, ry, 0xd9c79a); }   // 밧줄 울타리
    const [mx9, mz9] = Q(2.9, 0.3); signBoard(group, mx9, mz9, ry, '등산 안내도', { w: 1.6, h: 1.0, y: 0.7, bg: 0x2f6b3a, bgc: '#2f6b3a', fg: '#fff7e0' }); }
  function spring(group, x, z, ry) { const y = ty(x, z), Q = LP(x, z, ry);
    box(x, y, z, 3.4, 0.06, 2.8, ry, 0xb7b2a6, { top: 0xc4bfb3 }); for (let i = -2; i <= 2; i++) { const [lx, lz] = Q(i * 0.68, 0); dbx(lx, y + 0.06, lz, 0.025, 0.006, 2.7, ry, 0x9a9488, { noSide: true }); }   // 박석 바닥
    const [wx, wz] = Q(0, -0.75); rock(wx, y + 0.06, wz, ry, 2.0, 1.35, 0.5, 0x8d8a80, rng0(hashS('sp' + x)));   // 돌벽(자연석)
    box(x, y + 0.06, z, 1.3, 0.5, 0.8, ry, 0x9a978c, { top: 0x6fc3dc }); dbx(x, y + 0.5, z, 1.36, 0.08, 0.86, ry, 0x8a877c, { noSide: false });   // 돌확(물) · 테
    const [px, pz] = Q(0, -0.42); dbx(px, y + 0.95, pz, 0.08, 0.08, 0.36, ry, 0x8a8f95); const [dx9, dz9] = Q(0, -0.23); dbx(dx9, y + 0.62, dz9, 0.04, 0.33, 0.04, ry, 0x9fd8e6);   // 대롱 · 떨어지는 물
    for (const s9 of [-1, 1]) { const [cx9, cz9] = Q(s9 * 1.35, 0.55); box(cx9, y, cz9, 0.14, 2.35, 0.14, ry, 0x7a5232); const [bx, bz] = Q(s9 * 1.35, -0.95); box(bx, y, bz, 0.14, 2.35, 0.14, ry, 0x7a5232); }
    { const [gx0, gz0] = Q(0, -0.2); gable(gx0, y + 2.35, gz0, 3.0, 1.9, 0.75, ry, 0x6b4a2f, { eave: 0.35, wall: 0x8a5a30 }); }   // 작은 맞배지붕
    const [hx, hz] = Q(0, 0.55); dbx(hx, y + 1.85, hz, 2.7, 0.07, 0.07, ry, 0x7a5232); for (let i = -1; i <= 1; i++) { const [gx, gz] = Q(i * 0.5, 0.55); dbx(gx, y + 1.5, gz, 0.03, 0.35, 0.03, ry, 0x7a5232); cyl(gx, y + 1.36, gz, 0.11, 0.16, 0xe2c46a, 7); }   // 표주박 셋
    const [sx, sz] = Q(1.9, 0.4); signBoard(group, sx, sz, ry, '약수터', { w: 1.0, h: 0.42, y: 1.0, one: true, bg: 0x9b6a3c, bgc: '#9b6a3c', fg: '#fff7e0' });
    PCOL.push(col9(x, z, 0.7, 0.45, ry, y - 1, y + 0.56), col9(wx, wz, 1.0, 0.25, ry, y - 1, y + 1.4)); }
  function schoolSign(group, x, z, ry) { const y = ty(x, z); box(x, y, z, 0.09, 2.6, 0.09, 0, 0x8a8f95);
    box(x, y + 1.85, z, 0.95, 0.95, 0.06, ry, 0xe0453a); box(x, y + 1.92, z, 0.8, 0.8, 0.075, ry, 0xf2c230);   // 노란 판 + 빨간 테
    box(x, y + 1.35, z, 1.3, 0.38, 0.06, ry, 0xffffff); textPlane(group, '어린이 보호구역', x, y + 1.54, z, ry, 1.2, 0.3, { bgc: '#ffffff', fg: '#c0392b', off: 0.036 });
    textPlane(group, '어린이', x, y + 2.32, z, ry, 0.72, 0.3, { bgc: '#f2c230', fg: '#1d2b3a', off: 0.044 }); }
  function signpost(group, P) { const { x, z } = P, y = ty(x, z), B = bucket(x, z); cyl(x, y, z, 0.09, 3.0, 0x7a5232, 7);
    (P.to || []).slice(0, 4).forEach((nm, i) => { const pl = findPlace(nm); let dx, dz, dist = null;
      if (pl) { dx = pl.x - x; dz = pl.z - z; dist = Math.max(10, Math.round(Math.hypot(dx, dz) / 10) * 10); } else { const r = nearSeg(x, z, 200); if (r) { dx = r.sg.b[0] - r.sg.a[0]; dz = r.sg.b[1] - r.sg.a[1]; if (i % 2) { dx = -dx; dz = -dz; } } else { dx = i % 2 ? -1 : 1; dz = 0; } P.miss = (P.miss || []).concat(nm); }
      const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const by = y + 2.55 - i * 0.48, br = Math.atan2(-dz, dx), cx = x + dx * 0.95, cz = z + dz * 0.95, col = rgb(0x9b6a3c);
      box(cx, by - 0.18, cz, 1.7, 0.36, 0.06, br, 0x9b6a3c); const ex = x + dx * 1.8, ez = z + dz * 1.8, a = [ex, by + 0.26, ez], b = [ex, by - 0.26, ez], c9 = [x + dx * 2.15, by, z + dz * 2.15];
      tri(B, a, b, c9, nrm(a, b, c9), col); tri(B, a, c9, b, nrm(a, c9, b), col);   // 화살 끝
      textPlane(group, nm + (dist ? ' ' + dist + 'm' : ''), cx, by, cz, br, 1.6, 0.28, { bgc: '#9b6a3c', fg: '#fff7e0', off: 0.036 }); }); }
  function fountain(x, z) { const y = ty(x, z); cyl(x, y, z, 2.0, 0.55, 0xbdb8ae, 16, { top: 0xcfcac0 }); cyl(x, y, z, 1.75, 0.57, 0x6fc3dc, 16); cyl(x, y, z, 0.24, 1.3, 0xd8d4ca, 8); cyl(x, y + 1.25, z, 0.7, 0.16, 0xd8d4ca, 12); cyl(x, y + 1.25, z, 0.58, 0.18, 0x9fd8e6, 12);   // 돌 수반 · 물 · 기둥 · 윗 수반
    cyl(x, y + 1.4, z, 0.07, 0.75, 0xe6f7fb, 6); cyl(x, y + 2.1, z, 0.16, 0.12, 0xe6f7fb, 8);   // 가운데 물줄기
    for (let i = 0; i < 8; i++) { const a9 = i / 8 * 6.2832, r9 = 0.62; dbx(x + Math.cos(a9) * r9, y + 1.05, z + Math.sin(a9) * r9, 0.05, 0.25, 0.05, a9, 0xdff6f4); dbx(x + Math.cos(a9) * 1.2, y + 0.57, z + Math.sin(a9) * 1.2, 0.12, 0.03, 0.12, a9, 0xffffff, { noSide: true }); }   // 떨어지는 물 · 물보라
    for (let i = 0; i < 4; i++) { const a9 = (i + 0.5) / 4 * 6.2832; bench2(x + Math.cos(a9) * 4.2, z + Math.sin(a9) * 4.2, Math.atan2(-Math.cos(a9), -Math.sin(a9))); }   // 둘레 벤치(분수 쪽)
    PCOL.push(col9(x, z, 1.9, 1.9, 0, y - 1, y + 0.55)); }
  function flowerbed(x, z, ry) { const y = ty(x, z), Q = LP(x, z, ry); box(x, y, z, 3, 0.35, 1.4, ry, 0xb9b2a4); box(x, y, z, 2.8, 0.37, 1.2, ry, 0x6a4a30);
    for (let i = 0; i < 12; i++) { const [fx, fz] = Q(-1.2 + (i % 6) * 0.48, i < 6 ? -0.3 : 0.3); TREES.flower.push({ x: fx, y: y + 0.36, z: fz, s: 1.2, hex: PAL.flower[i % 4], ry: 0 }); } }
  function statue(x, z, ry) { const y = ty(x, z), Q = LP(x, z, ry); box(x, y, z, 1.3, 1.3, 1.3, ry, 0xbdb8ae, { top: 0xc9c4b8 }); box(x, y + 1.3, z, 0.55, 1.15, 0.38, ry, 0x8a6a3a); box(x, y + 2.45, z, 0.34, 0.34, 0.32, ry, 0x8a6a3a);
    for (const s9 of [-1, 1]) { const [ax, az] = Q(s9 * 0.36, 0); box(ax, y + 1.75, az, 0.16, 0.6, 0.18, ry, 0x7f6034); } PCOL.push(col9(x, z, 0.65, 0.65, ry, y - 1, y + 1.3)); }
  function toilet(group, x, z, ry) { const y = ty(x, z), Q = LP(x, z, ry); box(x, y, z, 4.2, 2.7, 3.0, ry, 0xe8e2cf); gable(x, y + 2.7, z, 4.2, 3.0, 1.0, ry, 0x6b7480);
    for (const s9 of [-1, 1]) { const [dx, dz] = Q(s9 * 1.0, 1.52); box(dx, y, dz, 0.9, 2.0, 0.05, ry, s9 < 0 ? 0x3d74c9 : 0xe0453a); }   // 문 둘(파랑·빨강)
    const [tx9, tz9] = Q(0, 1.5); box(tx9, y + 2.15, tz9, 1.6, 0.42, 0.05, ry, 0xffffff); textPlane(group, '화장실', tx9, y + 2.36, tz9, ry, 1.5, 0.34, { bgc: '#ffffff', off: 0.03, one: true });
    for (const s9 of [-1, 1]) { const [sx, sz] = Q(s9 * 2.11, 0); dbx(sx, y + 1.9, sz, 0.04, 0.45, 1.6, ry, GLASS, {}); const [ix, iz] = Q(s9 * 1.0, 1.55); dbx(ix, y + 1.7, iz, 0.32, 0.32, 0.02, ry, s9 < 0 ? 0x3d74c9 : 0xe0453a); }   // 높은 창 · 문 위 그림 표지
    const [vx, vz] = Q(1.4, -0.9); dbx(vx, y + 3.1, vz, 0.2, 0.7, 0.2, ry, 0x8a8f95); const [stx, stz] = Q(0, 1.75); box(stx, y, stz, 3.2, 0.12, 0.5, ry, 0xc9c4b8); PCOL.push(col9(x, z, 2.1, 1.5, ry, y - 1, y + 2.7)); }   // 환기통 · 문 앞 디딤
  function parking(group, P) { const { x, z, w, d, ry } = P, y = ty(x, z), Q = LP(x, z, ry), R = rng0(hashS(P.id)); box(x, y + 0.03, z, w, 0.04, d, ry, 0x5f6368, { top: 0x62666b });
    const rows = d >= 11 ? [-d / 2 + 2.6, d / 2 - 2.6] : [0]; for (const rz of rows) { const n = Math.floor((w - 1) / 2.6); for (let i = 0; i <= n; i++) { const lx = -n * 1.3 + i * 2.6, [px, pz] = Q(lx, rz); box(px, y + 0.07, pz, 0.12, 0.01, 4.6, ry, 0xf2f1ea, { noSide: true });
      if (i < n) { const [ws, wz9] = Q(lx + 1.3, rz + (rz > 0 ? 1.9 : rz < 0 ? -1.9 : -1.9)); dbx(ws, y + 0.07, wz9, 1.4, 0.12, 0.18, ry, 0xc9c4b8); }   // 차 멈춤 턱
      if (i < n && R() < 0.45) { const [cx, cz] = Q(lx + 1.3, rz); vehicle(cx, cz, ry + Math.PI / 2, 'car', [0x3d74c9, 0xe0453a, 0xf2f1ea, 0x3a3a3a, 0x9aa0a6][(R() * 5) | 0]); } } }
    for (const [u, v] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]) { const [kx, kz] = Q(u, v); dbx(kx, y + 0.07, kz, 0.3, 0.12, 0.3, ry, 0xe2ded4); }   // 모서리 연석
    const [sx, sz] = Q(-w / 2 + 0.6, d / 2 + 0.6); signBoard(group, sx, sz, ry, 'P', { w: 0.8, h: 0.8, y: 1.9, one: true, bg: 0x2f6fd0, bgc: '#2f6fd0', fg: '#ffffff', post: 0x8a8f95 }); }
  function footbridge(P) {   // 아이가 물 위에 놓은 다리(길이 없는 곳) — 가장 짧게 건너는 방향 · 나무 판 + 난간 · 걸어서 건넘
    let cx = P.x, cz = P.z; if (!wAt(cx, cz)) { let W = null; for (let d = 2; d <= 30 && !W; d += 2) for (let a = 0; a < 16 && !W; a++) { const x = cx + Math.cos(a / 16 * 6.2832) * d, z = cz + Math.sin(a / 16 * 6.2832) * d; if (wAt(x, z)) W = [x, z]; } if (!W) { PNOTE.push({ t: '「다리」 둘레 30m 안에 물이 없어 놓지 못했어요', at: [cx, cz] }); return; } [cx, cz] = W; }
    const dry = (x, z) => !wAt(x, z) && wdI(x, z) < 0.02, run = (ux, uz) => { for (let t = 0; t < 90; t += 0.5) if (dry(cx + ux * t, cz + uz * t)) return t; return null; };
    let best = null; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI, ux = Math.cos(a), uz = Math.sin(a), d1 = run(ux, uz), d2 = run(-ux, -uz); if (d1 != null && d2 != null && (!best || d1 + d2 < best.L)) best = { ux, uz, d1, d2, L: d1 + d2 }; }
    if (!best) return; if (P.src.stones) return steppingStones(P, cx, cz, best); const { ux, uz } = best, a0 = [cx - ux * (best.d2 + 1.5), cz - uz * (best.d2 + 1.5)], a1 = [cx + ux * (best.d1 + 1.5), cz + uz * (best.d1 + 1.5)], mx = (a0[0] + a1[0]) / 2, mz = (a0[1] + a1[1]) / 2, len = best.L + 3, ry = Math.atan2(-uz, ux), top = TY + 0.42, px = -uz, pz = ux;
    box(mx, top - 0.3, mz, len, 0.3, 2.4, ry, 0xa0784a, { top: 0xb88a56, bottom: true });
    for (const sg of [-1, 1]) { const ox = mx + px * sg * 1.12, oz = mz + pz * sg * 1.12; box(ox, top + 0.9, oz, len, 0.1, 0.12, ry, 0x7a5232); for (let k = -len / 2 + 0.4; k <= len / 2 - 0.3; k += 1.8) box(ox + ux * k, top, oz + uz * k, 0.12, 0.95, 0.12, ry, 0x7a5232); }
    const xs = [a0[0] + px * 1.2, a0[0] - px * 1.2, a1[0] + px * 1.2, a1[0] - px * 1.2], zs = [a0[1] + pz * 1.2, a0[1] - pz * 1.2, a1[1] + pz * 1.2, a1[1] - pz * 1.2];
    BRIDGES.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y1: top }); markBR(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)); P.built = [a0, a1]; }
  function steppingStones(P, cx, cz, best) {   // 돌다리(아이가 남색 정육면체를 강 위에 줄지어 놓음 · 🧱): 넓적한 디딤돌이 물 위로 · 돌 사이로 물이 흐름 · 걸어서 건넘
    const { ux, uz } = best, a = [cx - ux * (best.d2 + 0.6), cz - uz * (best.d2 + 0.6)], L9 = best.L + 1.2, n = Math.max(3, Math.round(L9 / 1.25)), top = TY + CAPY - 0.02, R = rng0(hashS(P.id)), ry = Math.atan2(-uz, ux);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n * L9, x = a[0] + ux * t + (R() - 0.5) * 0.25, z = a[1] + uz * t + (R() - 0.5) * 0.25, sz = 0.95 + R() * 0.25; box(x, TY + WLY - 1.2, z, sz, top - (TY + WLY - 1.2), sz * 1.25, ry + (R() - 0.5) * 0.4, [0x8f8a80, 0x9d978b, 0x858075][i % 3], { top: 0xaaa497 }); }
    const px = -uz, pz = ux, xs = [a[0] + px * 0.8, a[0] - px * 0.8, a[0] + ux * L9 + px * 0.8, a[0] + ux * L9 - px * 0.8], zs = [a[1] + pz * 0.8, a[1] - pz * 0.8, a[1] + uz * L9 + pz * 0.8, a[1] + uz * L9 - pz * 0.8];
    BRIDGES.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y1: top }); markBR(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)); P.built = [a, [a[0] + ux * L9, a[1] + uz * L9]]; }
  function pier(P) { const [bx, bz, wx, wz] = P.deck, len = Math.hypot(wx - bx, wz - bz), ux = (wx - bx) / (len || 1), uz = (wz - bz) / (len || 1), mx = (bx + wx) / 2, mz = (bz + wz) / 2, ry = Math.atan2(-uz, ux), top = TY + 0.4;
    box(mx, top - 0.2, mz, len, 0.2, 1.6, ry, 0xa0784a, { top: 0xb88a56, bottom: true }); for (const [a, b] of [[0.3, 0.7], [0.3, -0.7], [len - 0.3, 0.7], [len - 0.3, -0.7]]) box(bx + ux * a - uz * b, top - 1.6, bz + uz * a + ux * b, 0.14, 1.4, 0.14, 0, 0x7a5232);
    for (const sg of [-1, 1]) { for (let k = 0.4; k < len; k += 1.2) dbx(bx + ux * k - uz * 0.72 * sg, top, bz + uz * k + ux * 0.72 * sg, 0.08, 0.9, 0.08, ry, 0x7a5232); dbx(mx - uz * 0.72 * sg, top + 0.86, mz + ux * 0.72 * sg, len, 0.07, 0.08, ry, 0x7a5232); }   // 난간
    { const sx = bx + ux * (len - 1.0), sz = bz + uz * (len - 1.0); dbx(sx, top, sz, 0.4, 0.4, 0.4, 0, 0x3d74c9); dbx(sx + ux * 0.6, top, sz + uz * 0.6, 0.35, 0.3, 0.25, ry, 0x8a5a30); }   // 낚시 의자 · 통
    const xs = [bx - uz * 0.8, bx + uz * 0.8, wx - uz * 0.8, wx + uz * 0.8], zs = [bz + ux * 0.8, bz - ux * 0.8, wz + ux * 0.8, wz - ux * 0.8]; BRIDGES.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y1: top }); markBR(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)); }
  function clearAroundProps() {   // 숲·조경 나무가 아이 소품·이름표 돌·산책로를 덮지 않게(소품 자리 = 아이가 정한 것이 먼저)
    const C = []; for (const P of PROPS) { if (P.k === 'trail') { for (let i = 0; i < P.pts.length - 1; i++) for (const q of densify([P.pts[i], P.pts[i + 1]], 2)) C.push([q[0], q[1], P.w / 2 + 1.2]); continue; } if (P.k === 'bridge' || P.k === 'crosswalk' || P.k === 'tree') continue; C.push([P.x, P.z, P.k === 'parking' ? Math.max(P.w, P.d) / 2 + 2 : (PROPK[P.k].r || 1) + 2]); }
    for (const A of AREAS) C.push([A.sx, A.sz, 3.5]); if (!C.length) return;
    for (const sp of ['round', 'pine', 'poplar', 'bush', 'fruit']) TREES[sp] = TREES[sp].filter(t => { if (t.kid || t.y > ty(t.x, t.z) + 1) return true; const cr = c => c[2] + 2.3 * (t.s || 1); return !C.some(c => Math.abs(t.x - c[0]) < cr(c) && Math.abs(t.z - c[1]) < cr(c) && Math.hypot(t.x - c[0], t.z - c[1]) < cr(c)); }); }   // 수관 반지름(≈2.3 × 크기)까지 비킴
  function drawProps(group) {
    const mat = LOOK === 'mat';
    for (const P of PROPS) { const { k, x, z } = P, ry = P.ry ?? 0, K = PROPK[k];
      if (k === 'bridge') { if (P.foot) footbridge(P); continue; }   // 길 위 다리는 bridgesOn이(아이 다리 = 🧱)
      if (k === 'crosswalk') { if (mat) { const F = segFrame(P.sg), y = ty(x, z); for (let i = -2; i <= 2; i++) box(x + F.tx * i * 1.2, y + 0.1, z + F.tz * i * 1.2, 0.6, 0.02, P.sg.hw * 1.6, Math.atan2(-F.tz, F.tx), 0xf6f4ee, { noSide: true }); } else zebra(P.sg, P.t); continue; }
      if (k === 'trail') { for (let i = 0; i < P.pts.length - 1; i++) strip(P.pts[i], P.pts[i + 1], P.w, 0.05, mat ? 0x8fc46a : 0xc9a77c, { skip: (x9, z9) => wAt(x9, z9) > 0 || inSchool(x9, z9) || !!onRoad(x9, z9, 0), step: 3 }); continue; }
      if (k === 'parking') { if (mat) box(x, ty(x, z) + 0.03, z, P.w, 0.04, P.d, ry, 0x9a9fa5, { noSide: true }); else parking(group, P); continue; }
      if (mat) { tentCard(x, z, ry, { streetlight: 0xf2c230, signal: 0x3cc76a, busstop: 0x2f6fd0, schoolzone: 0xf2c230, firesign: 0xd33a2c, fishing: 0x2f6fd0, greenhouse: 0x8fd06a, scarecrow: 0xe2c46a, tiller: 0x2f7fc1 }[k] ?? 0x9b6a3c); if (P.deck) pier(P); continue; }
      if (k === 'streetlight') streetlight(x, z, ry); else if (k === 'signal') signalPole(x, z, ry); else if (k === 'busstop') busstop(x, z, ry); else if (k === 'bench') bench2(x, z, ry);
      else if (k === 'pavilion') pavilion(x, z, ry); else if (k === 'scarecrow') scarecrow(x, z, ry); else if (k === 'greenhouse') greenhouse(x, z, ry); else if (k === 'tiller') tiller(x, z, ry);
      else if (k === 'schoolzone') schoolSign(group, x, z, ry); else if (k === 'trailhead') trailhead(group, x, z, ry); else if (k === 'spring') spring(group, x, z, ry);
      else if (k === 'firesign') signBoard(group, x, z, ry, '산불 조심', { w: 1.9, h: 0.85, y: 1.0, bg: 0xd33a2c, bgc: '#d33a2c', fg: '#ffffff' });
      else if (k === 'fishing') { signBoard(group, x, z, ry, '낚시터', { w: 1.4, h: 0.6, y: 1.1, bg: 0x2f6fd0, bgc: '#2f6fd0', fg: '#ffffff' }); if (P.deck) pier(P); }
      else if (k === 'signpost') signpost(group, P); else if (k === 'fountain') fountain(x, z); else if (k === 'flowerbed') flowerbed(x, z, ry); else if (k === 'statue') statue(x, z, ry); else if (k === 'toilet') toilet(group, x, z, ry);
      else if (k === 'tree') TREES.round.push({ x, y: ty(x, z), z, s: 1.25, hex: PAL.tree[1], ry: 0, kid: true });
      else if (k === 'mailbox') { const y = ty(x, z); box(x, y, z, 0.5, 1.1, 0.45, ry, 0xe0453a, { top: 0xc0392b }); }
      else if (k === 'bin') { const y = ty(x, z), Q = LP(x, z, ry); [[0x3f8a3c, -0.32], [0x2f6fd0, 0.32]].forEach(([c9, o]) => { const [bx, bz] = Q(o, 0); box(bx, y, bz, 0.55, 0.9, 0.5, ry, c9); }); }
      else { signBoard(group, x, z, ry, P.label, { w: 3.0, h: 1.3, y: 0.8, bg: 0xfff7d6, bgc: '#fff7d6' }); const y = ty(x, z); box(x, y + 2.1, z, 3.2, 0.14, 0.14, ry, 0xf2c230); box(x, y + 0.66, z, 3.2, 0.14, 0.14, ry, 0xf2c230); }   // 모르는 그림 카드 = 아이가 쓴 이름 팻말(노란 테 · ✨)   // 모르는 그림 카드 = 아이가 쓴 이름 팻말(✨)
    }
  }
  // ───────── 칸 이름표(AREA-1 · 교사 10-13 '큰 틀은 내가, 나머지는 아이들에게 자유도' — 아이 손글씨 이름표가 범례보다 먼저) ─────────
  //   자료 layer.areas = [{ id, cell | cells, t: '자연친화 도시', en?, style: ['rooftop','vines','woods','trail','flowers','solar','bigtree'], fill?: { k, type, dens }, ai: '풀이 한 줄' }]
  //   이름표의 말뜻 → 꾸밈 낱말(style)로 푸는 건 Claude가 자료에서(✨ ai에 풀이를 남김 — 아이들이 "이게 우리가 생각한 거 맞아?"를 확인·고침) · 엔진은 낱말대로 지음 · fill = 블록 없는 칸을 이 말대로 채움(구역처럼)
  function prepAreas() {
    AREAS = []; for (const a of L.areas || []) { const C = a.cells || (a.cell ? [a.cell] : []), R = C.map(c => cellRect(c)).filter(Boolean).map(r => [X(r[0]), Z(r[1]), X(r[2]), Z(r[3])]); if (!R.length) continue;
      const st = new Set(a.style || []), cx = R.reduce((s9, r) => s9 + (r[0] + r[2]) / 2, 0) / R.length, cz = R.reduce((s9, r) => s9 + (r[1] + r[3]) / 2, 0) / R.length;
      const A = { id: a.id || ('a' + AREAS.length), t: a.t || '', en: a.en || null, cells: C, R, st, cx, cz, ai: a.ai || null, sign: a.sign || null, noStone: !!a.noStone };
      // 이름표 돌: 칸 안 · 가장 가까운 길가(길 폭 + 3m 안쪽)
      const r = nearSeg(cx, cz, 200); if (r) { const dx = cx - r.p[0], dz = cz - r.p[1], l = Math.hypot(dx, dz) || 1; A.sx = r.p[0] + dx / l * (r.sg.hw + 3.2); A.sz = r.p[1] + dz / l * (r.sg.hw + 3.2); A.sry = Math.atan2(-dx / l, -dz / l); } else { A.sx = cx; A.sz = cz; A.sry = 0; }
      AREAS.push(A); } }
  const areaAt = (x, z) => AREAS.find(A => A.R.some(r => x >= r[0] && x < r[2] && z >= r[1] && z < r[3])) || null;
  function areaStones(group) {   // 아이 이름표 = 자연석 표지석(반듯한 앞면에 연마한 글씨판 · 아이 글씨 그대로) + 돌 단 + 둘레 꽃·떨기나무
    for (const A of AREAS) { if (!A.t || A.noStone) continue; const x = A.sx, z = A.sz, ry = A.sry, y = ty(x, z), w = Math.min(4.6, 1.4 + A.t.length * 0.42), Q = LP(x, z, ry), R = rng0(hashS(A.id));
      box(x, y, z, w + 1.0, 0.22, 1.7, ry, 0xa8a294, { top: 0xb4ae9f });   // 돌 단
      for (let i = 0; i < 14; i++) { const a9 = i / 14 * 6.2832, [px, pz] = Q(Math.cos(a9) * (w / 2 + 0.75), Math.sin(a9) * 1.05); dbx(px, y, pz, 0.32 + R() * 0.15, 0.16 + R() * 0.1, 0.28, ry + a9, 0x8f8a7e); }   // 둘레 냇돌
      rock(x, y + 0.22, z, ry, w, 1.15, 0.7, 0x9d978b, R);
      const [px, pz] = Q(0, 0.36); box(px, y + 0.42, pz, w * 0.84, 0.72, 0.04, ry, 0xd8d2c4, { top: 0xd8d2c4 }); textPlane(group, A.t, px, y + 0.78, pz, ry, w * 0.78, 0.5, { bgc: '#d8d2c4', fg: '#2f2b26', off: 0.024, one: true });   // 연마한 글씨판(새긴 글씨)
      for (let i = 0; i < 10; i++) { const [fx, fz] = Q(-w / 2 - 0.2 + (i + 0.5) * (w + 0.4) / 10, 1.25); TREES.flower.push({ x: fx, y: y + 0.02, z: fz, s: 1.1, hex: PAL.flower[i % 4], ry: 0 }); }
      for (const s9 of [-1, 1]) { const [bx, bz] = Q(s9 * (w / 2 + 0.95), 0.1); TREES.bush.push({ x: bx, y: y + 0.2, z: bz, s: 0.75, hex: 0x4e9a43, ry: R() * 6, kid: true }); }   // 양옆 떨기나무(둥글게 다듬은 — 학교 화단처럼)
      PCOL.push(col9(x, z, w / 2 + 0.2, 0.45, ry, y - 1, y + 1.4)); } }
  function areaDeco() {   // 🏘 마을 모습: 이름표 낱말대로 건물·지붕 꾸밈(옥상 정원·덩굴 벽·태양광) — 기록은 그 칸 조경과 함께
    if (!AREAS.length) return; const R = rng0(hashS('area:' + LID));
    for (const rf of ROOFS) { const A = areaAt(rf.cx, rf.cz); if (!A) continue; const n9 = A.n || (A.n = {});
      if (A.st.has('rooftop') && Math.min(rf.w, rf.d) > 3.6 && rf.w * rf.d > 30) { box(rf.cx, rf.y, rf.cz, rf.w - 1.4, 0.1, rf.d - 1.4, rf.ry, 0x6fae4f, { top: 0x7cbd5a }); const Q = LP(rf.cx, rf.cz, rf.ry), nT = Math.max(2, Math.min(7, Math.round(rf.w * rf.d / 40)));
        for (let i = 0; i < nT; i++) { const [tx9, tz9] = Q((R() - 0.5) * (rf.w - 3), (R() - 0.5) * (rf.d - 3)), sp = R() < 0.5 ? 'round' : 'bush'; TREES[sp].push({ x: tx9, y: rf.y + 0.1, z: tz9, s: sp === 'round' ? 0.42 + R() * 0.15 : 0.8, hex: treeHex('round', R), ry: R() * 6 }); }
        for (let i = 0; i < 8; i++) { const [fx, fz] = Q((R() - 0.5) * (rf.w - 2), (R() - 0.5) * (rf.d - 2)); TREES.flower.push({ x: fx, y: rf.y + 0.1, z: fz, s: 1.1, hex: PAL.flower[(R() * 4) | 0], ry: 0 }); } n9['옥상 정원'] = (n9['옥상 정원'] || 0) + 1; }
      if (A.st.has('solar') && rf.w > 6 && rf.d > 6) { const Q = LP(rf.cx, rf.cz, rf.ry); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j += 2) { const [px, pz] = Q(i * 1.4, j * Math.min(1.6, rf.d / 4)); box(px, rf.y + 0.45, pz, 1.2, 0.07, 1.9, rf.ry, 0x2f4466, { top: 0x3a5a8a }); box(px, rf.y + 0.1, pz, 0.08, 0.35, 0.08, 0, 0x8a8f95); } n9['태양광 지붕'] = (n9['태양광 지붕'] || 0) + 1; } }
    for (const B9 of BLD) { if (B9.kind === 'green' || B9.kind === 'park' || B9.h < 4) continue; const A = areaAt(B9.cx, B9.cz); if (!A || !A.st.has('vines')) continue;
      const F = FACES(B9).filter(f => !isFront(B9, f)); for (const f of F.slice(0, 2 + (R() < 0.5 ? 1 : 0))) { const n = Math.max(2, Math.round(f[2] / 3.2));   // 덩굴: 벽을 타고 오르는 가는 줄기 + 줄기를 따라 둥근 잎 덩이(떨기나무 모양 · 바람에 흔들림) — 벽 전체를 덮지 않음
        for (let q = 0; q < n; q++) { const u = (q - (n - 1) / 2) * f[2] * 0.7 / n + (R() - 0.5) * 0.8; if (Math.abs(u) > f[2] / 2 - 0.6) continue; const hh = B9.h * (0.3 + R() * 0.55);
          fbox(B9, f, u, 0, 0.14, hh, 0.08, 0x5a4a2e, { out: 0.03, D: true }); const nx9 = f[0], nz9 = f[1], half9 = f[3];
          for (let y9 = 0.8; y9 < hh; y9 += 0.9 + R() * 0.5) { const [lx, lz] = [nx9 ? nx9 * (half9 + 0.32) : u + (R() - 0.5) * 0.7, nz9 ? nz9 * (half9 + 0.32) : u + (R() - 0.5) * 0.7], [x, z] = L2W(B9, lx, lz); TREES.bush.push({ x, y: B9.y0 + y9 - 0.35, z, s: 0.42 + R() * 0.25, hex: [0x3f8a3c, 0x4e9a43, 0x5aa54a][(R() * 3) | 0], ry: R() * 6, kid: true }); } } }
      (A.n || (A.n = {}))['덩굴 벽'] = ((A.n || {})['덩굴 벽'] || 0) + 1; } }
  function drawZonePaper() {   // 🧱 매트 모습: 색종이 구역 그대로(얇은 종이 판)
    for (const zn of L.zones || []) { const sh = shapeOf(zn); if (!sh || sh.line) continue; const hex = COL[zn.c || (ZCOL[zn.k] || ['red'])[0]] ?? 0xe0453a;
      C3.setHex(hex); C3.lerp(new T3.Color(0xffffff), 0.12); const ph = C3.getHex(); cellsIn(sh, 2.5, (cx, cz, s2) => { if (onRoad(cx, cz, 0)) return; flat(cx - s2, cz - s2, cx + s2, cz + s2, ty(cx, cz) + 0.07, ph); }); } }
  function drawZoneGreen() {   // 초록 구역(공원·들) = 공원(잔디·산책길·나무) 또는 들(type 'field' — 밭)
    for (const zn of L.zones || []) { if (zn.k !== 'green') continue; if (zn.type === 'paddy') { paddy(zn); continue; } const t = zn.type === 'field' ? 'farm' : zn.type === 'rice' ? 'rice' : zn.type === 'fields' ? (hashS(zn.id || '') % 2 ? 'rice' : 'farm') : zn.type === 'forest' ? null : 'park';
      if (zn.type === 'forest') { L.nature.push({ id: '__z' + zn.id, k: 'forest', sub: 'mixed', rect: zn.rect, poly: zn.poly, gen: zn.id }); continue; } L.nature.push({ id: '__z' + zn.id, k: 'field', sub: t, rect: zn.rect, poly: zn.poly, gen: zn.id }); } }
  // 건물 둘레 땅(쓰임별 바닥 — AI가 채운 빈칸): 집 = 마당 잔디 + 디딤돌 길 · 가게·공공 = 앞마당 보도블록 + 주차장 칸 · 공장 = 콘크리트 마당
  function lot(B9) { const k = B9.kind; if (k === 'green' || k === 'park' || B9.terrace || k === 'play' || (k === 'school' && B9.w > 30)) return; /* 석축 단 위 집은 단이 마당 */ const R = B9.R, front = Math.max(0, Math.min(12, B9.gap ?? 4)), side = k === 'house' ? 2.6 : 4, back = k === 'house' ? 3 : 2.5;
    const surf = k === 'house' ? 0x7fbb58 : k === 'factory' ? 0xbdbab2 : 0xd2cbbe, yo = k === 'house' ? 0.03 : 0.035, fl = B9.fl;
    const ext = (a) => a === 'f' ? front : a === 'b' ? back : side, hw = B9.w / 2, hd = B9.d / 2;
    const lx0 = -hw - (fl[0] === -1 ? ext('f') : fl[0] === 1 ? ext('b') : ext('s')), lx1 = hw + (fl[0] === 1 ? ext('f') : fl[0] === -1 ? ext('b') : ext('s')), lz0 = -hd - (fl[1] === -1 ? ext('f') : fl[1] === 1 ? ext('b') : ext('s')), lz1 = hd + (fl[1] === 1 ? ext('f') : fl[1] === -1 ? ext('b') : ext('s'));
    { const C9 = [[lx0, lz0], [lx1, lz0], [lx1, lz1], [lx0, lz1]].map(([a, b]) => L2W(B9, a, b)), xs = C9.map(q => q[0]), zs = C9.map(q => q[1]); occAdd(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)); }   // 앞마당·주차장 자리 차지(조경 나무가 비킴)
    const cell = 2, ok = (x, z) => !onRoad(x, z, 0.4) && !wAt(x, z) && !inSchool(x, z);
    for (let lz = lz0; lz < lz1 - 0.01; lz += cell) for (let lx = lx0; lx < lx1 - 0.01; lx += cell) { const ax = Math.min(lx + cell, lx1), az = Math.min(lz + cell, lz1), [x, z] = L2W(B9, (lx + ax) / 2, (lz + az) / 2); if (!ok(x, z)) continue;
      const Pc = [[lx, lz], [ax, lz], [ax, az], [lx, az]].map(([a, b]) => { const q = L2W(B9, a, b); return [q[0], ty(q[0], q[1]) + yo, q[1]]; }); quad(bucket(x, z), Pc[3], Pc[2], Pc[1], Pc[0], rgb(surf)); }
    // 앞길(문 → 인도 · 마당이 길까지 닿지 않으면 길까지 이어 감): 집 = 디딤돌 · 나머지 = 보도블록 넓게
    const f = frontF(B9), half = f[3], fwL = [fl[0], fl[1]], gapR = Math.max(front, Math.min(40, B9.gap ?? front));
    if (k === 'house' && LOOK === 'town' && !B9.hasPool) {   // 집 담장(낮은 블록 담 · 대문 자리는 비움) — 마당 테두리
      const C4 = [[lx0, lz0], [lx1, lz0], [lx1, lz1], [lx0, lz1]], wallC = [0xe8e2d4, 0xd9cdb8, 0xc9c2b4, 0xb8674a][(R() * 4) | 0];
      for (let e = 0; e < 4; e++) { const a = C4[e], b = C4[(e + 1) % 4], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, isF = (fl[0] && Math.sign(mx) === fl[0] && Math.abs(a[0] - b[0]) < 0.01) || (fl[1] && Math.sign(mz) === fl[1] && Math.abs(a[1] - b[1]) < 0.01);
        const L9 = Math.hypot(b[0] - a[0], b[1] - a[1]), n9 = Math.max(1, Math.round(L9 / 2)); for (let q = 0; q < n9; q++) { const t0 = q / n9, t1 = (q + 1) / n9, cx9 = a[0] + (b[0] - a[0]) * (t0 + t1) / 2, cz9 = a[1] + (b[1] - a[1]) * (t0 + t1) / 2;
          if (isF && Math.abs(fl[0] ? cz9 : cx9) < 1.6) continue; const [x, z] = L2W(B9, cx9, cz9); if (!ok(x, z)) continue; const alongX = Math.abs(b[1] - a[1]) < 0.01; box(x, ty(x, z), z, alongX ? L9 / n9 + 0.02 : 0.22, 0.95, alongX ? 0.22 : L9 / n9 + 0.02, B9.ry, wallC, { top: 0xbdb6a6 }); } } }
    for (let t = half + 0.2; t < half + gapR + 0.4; t += 1.1) { const [x, z] = L2W(B9, fwL[0] * t, fwL[1] * t); if (!ok(x, z)) continue; box(x, ty(x, z) + 0.02, z, k === 'house' ? 0.9 : 3.2, 0.06, k === 'house' ? 0.7 : 1.1, B9.ry, k === 'house' ? 0xd9cfbb : 0xc9c2b4, { noSide: true }); }
    // 주차장(가게·공공·아파트·공장 — 앞마당 한쪽): 아스팔트 + 흰 칸 줄
    if (k !== 'house' && front > 7) { const sideSign = R() < 0.5 ? -1 : 1, along = fl[0] ? [0, 1] : [1, 0], span = (fl[0] ? B9.d : B9.w) / 2;
      for (let t = 1.25; t < span + side - 1.2; t += 2.5) for (const r of [0]) { void r; const base = half + front / 2; const [x, z] = L2W(B9, fwL[0] * base + along[0] * sideSign * t, fwL[1] * base + along[1] * sideSign * t); if (!ok(x, z)) continue;
        box(x, ty(x, z) + 0.045, z, fl[0] ? front - 1 : 2.5, 0.01, fl[0] ? 2.5 : front - 1, B9.ry, 0x5f6368, { noSide: true });
        const [lx9, lz9] = L2W(B9, fwL[0] * base + along[0] * sideSign * (t + 1.25), fwL[1] * base + along[1] * sideSign * (t + 1.25)); box(lx9, ty(lx9, lz9) + 0.05, lz9, fl[0] ? front - 1.6 : 0.12, 0.01, fl[0] ? 0.12 : front - 1.6, B9.ry, 0xf2f1ea, { noSide: true }); } }
  }
  function markTop(B9) { const { cx, cz, h, y0 } = B9, col = COL[B9.b.c] ?? 0xcccccc, top = y0 + h + (B9.kind === 'house' ? 3 : 0.25);
    cyl(cx, top, cz, 1.6, 1.2, 0xe8e4da, 10); cyl(cx, top + 1.2, cz, 0.45, 9, col, 8); cyl(cx, top + 10.2, cz, 0.9, 0.9, 0xf2c230, 10, { top: 0xfff3c4 }); box(cx + 1.0, top + 7.8, cz, 2.0, 1.2, 0.06, 0, col);   // 첨탑 + 금빛 공 + 깃발
    for (const sg of [-1, 1]) box(cx, top + 0.6, cz, B9.w * 0.6, 0.25, 0.25, B9.ry + (sg > 0 ? 0 : Math.PI / 2), col); }
  function terraceOf(B9) {   // 석축 단(터) — 위 = 마당 돌판 · 옆 = 자연석 쌓기 · 앞에 계단
    const T9 = B9.terrace; if (!T9) return; const { cx, cz, w, d, ry } = B9, Q = LP(cx, cz, ry), H9 = T9.hi - T9.lo; box(cx, T9.lo, cz, w + 4, H9, d + 4, ry, 0x9d978b, { top: 0xb9b3a4 });
    for (let lv = 0.5; lv < H9 - 0.2; lv += 0.55) box(cx, T9.lo + lv, cz, w + 4.04, 0.06, d + 4.04, ry, 0x8a8478);   // 돌 줄눈
    const f = B9.fl, nS = Math.ceil(H9 / 0.3); for (let i = 0; i < nS; i++) { const o = (f[0] ? w : d) / 2 + 2 + 0.35 + i * 0.35, [sx, sz] = Q(f[0] * o, f[1] * o), sh = H9 - (i + 1) * 0.3; if (sh <= 0) break; box(sx, T9.lo, sz, f[0] ? 0.36 : 2.4, sh, f[0] ? 2.4 : 0.36, ry, 0xb9b3a4); PCOL.push(col9(sx, sz, f[0] ? 0.18 : 1.2, f[0] ? 1.2 : 0.18, ry, T9.lo - 1, T9.lo + sh)); }   // 계단(앞)
    PCOL.push(col9(cx, cz, w / 2 + 2, d / 2 + 2, ry, T9.lo - 1, T9.hi)); }
  function poolOf(B9) {   // 풀빌라 수영장(블록 pool · 이름표 「풀빌라」 칸의 집 ✨): 집 옆 물빛 수영장 + 흰 테두리 + 선베드 + 파라솔
    const { cx, cz, w, d, ry } = B9, Q = LP(cx, cz, ry), side = B9.fl[0] ? [0, 1] : [1, 0], o = (side[0] ? w : d) / 2 + 5, [px, pz] = Q(side[0] * o, side[1] * o), y = B9.y0, pw = side[0] ? 6 : 9, pd = side[0] ? 9 : 6;
    if (onRoad(px, pz, pd / 2 + 1) || wAt(px, pz)) return false; box(px, y, pz, pw + 1.6, 0.25, pd + 1.6, ry, 0xf2f1ea, { top: 0xf4f2ec }); box(px, y + 0.255, pz, pw, 0.02, pd, ry, 0x4fc3e0, { top: 0x57cfe8, noSide: true });
    const [ux, uz] = Q(side[0] * (o + pw / 2 + 1.6) + side[1] * 2.5, side[1] * (o + pd / 2 + 1.6) + side[0] * 2.5); cyl(ux, ty(ux, uz), uz, 0.05, 2.3, 0xdadada, 6); cyl(ux, ty(ux, uz) + 2.2, uz, 1.3, 0.25, [0xe0453a, 0xf2c230, 0x3d74c9][(B9.cx | 0) % 3], 10);   // 파라솔
    for (const k of [-1, 1]) { const [bx, bz] = Q(side[0] * (o + pw / 2 + 1.3) + side[1] * k * 1.2, side[1] * (o + pd / 2 + 1.3) + side[0] * k * 1.2); box(bx, ty(bx, bz), bz, side[0] ? 0.7 : 1.8, 0.35, side[0] ? 1.8 : 0.7, ry, 0xf6f4ee); }   // 선베드
    PCOL.push(col9(px, pz, pw / 2 + 0.8, pd / 2 + 0.8, ry, y - 1, y + 0.25)); return true; }
  function buildTown(B9) {
    const { cx, cz, w, d, h, ry, y0, kind } = B9, col = COL[B9.b.c] ?? 0xcccccc, R = B9.R = rng0(hashS((B9.b.id || '') + ':' + cx.toFixed(1)));
    terraceOf(B9); if ((B9.b.pool || (kind === 'house' && B9.gen && (areaAt(cx, cz) || { st: new Set() }).st.has('pool'))) && !B9.terrace) B9.hasPool = poolOf(B9);
    if (!B9.gen && isMark(B9.b) && kind !== 'green') { const k0 = B9.kind; buildTown2(B9); markTop({ ...B9, kind: k0 }); trim(B9); return; }
    buildTown2(B9); trim(B9); }
  function trim(B9) {   // 모든 건물 공통 마감(학교 맵처럼): 돌 굽 띠(문·진열창·차고 자리는 비움) · 뒤 모서리 빗물받이(디테일 층) · 간판 글씨
    const k = B9.kind; if (k === 'green' || k === 'park' || B9.h < 3 || B9.bigGreen) return;
    if (B9.signT && LOOK === 'town') { const f = frontF(B9), sa = B9.signAt || { y: Math.min(B9.h - 0.6, 4.4), w: Math.min(f[2] * 0.72, 9), h: 0.72, out: 0.07, bg: '#ffffff', fg: '#1d3557' }, [x, z] = L2W(B9, f[0] * (f[3] + sa.out), f[1] * (f[3] + sa.out));
      if (!B9.signAt) { const [bx, bz] = L2W(B9, f[0] * (f[3] + 0.03), f[1] * (f[3] + 0.03)); box(bx, B9.y0 + sa.y - sa.h / 2 - 0.08, bz, Math.min(sa.w, 0.62 * sa.h * (B9.signT.length + 1)) + 0.4, sa.h + 0.16, 0.06, Math.atan2(B9.fw[0], B9.fw[1]), 0xffffff); }   // 글씨 바탕 판
      textPlane(null, B9.signT, x, B9.y0 + sa.y, z, Math.atan2(B9.fw[0], B9.fw[1]), sa.w, sa.h, { one: true, bgc: sa.bg, fg: sa.fg, off: 0 }); }
    for (const f of FACES(B9)) { const front = isFront(B9, f), L9 = f[2]; if (front && (k === 'shop' || k === 'office' || k === 'fire' || k === 'factory' || k === 'police' || k === 'hospital')) continue;
      for (const [u0, u1] of front ? [[-L9 / 2, -1.7], [1.7, L9 / 2]] : [[-L9 / 2, L9 / 2]]) if (u1 - u0 > 0.4) fbox(B9, f, (u0 + u1) / 2, 0, u1 - u0, 0.42, 0.07, 0x9a958a, { top: 0xaaa597 }); }
    const bk = [-B9.fl[0], -B9.fl[1]];
    for (const s9 of [-1, 1]) { const lx = bk[0] ? bk[0] * (B9.w / 2 + 0.08) : s9 * (B9.w / 2 - 0.25), lz = bk[1] ? bk[1] * (B9.d / 2 + 0.08) : s9 * (B9.d / 2 - 0.25), [px, pz] = L2W(B9, lx, lz); dbx(px, B9.y0, pz, 0.11, B9.h - 0.1, 0.11, B9.ry, 0x8a8f95); } }
  function buildTown2(B9) {
    const { cx, cz, w, d, h, ry, y0, kind } = B9, col = COL[B9.b.c] ?? 0xcccccc, R = B9.R;
    lot(B9);
    const roofFlat = (hex = 0xcfccc4) => roofTop(B9, { deck: hex });
    if (kind === 'green' && (h >= 16 || (areaAt(cx, cz) || { st: new Set() }).st.has('bigtree'))) {   // 세운 초록 판·큰 초록 = 큰 나무 덩어리(교사 10-13 '초록 판은 범례상 자연 — 큰 나무나 숲 덩어리') · ✨ 어림
      B9.bigGreen = true; const s0 = Math.min(2.6, Math.max(1.5, h / 9)), long = Math.max(w, d), nB = Math.max(1, Math.round(long / 14)), alongX = w >= d;
      for (let i = 0; i < nB; i++) { const t = nB > 1 ? i / (nB - 1) - 0.5 : 0, [bx, bz] = L2W(B9, alongX ? t * (w - 6) : 0, alongX ? 0 : t * (d - 6)); addTreeF('round', bx, bz, s0 * (0.9 + R() * 0.2), treeHex('round', R)); }
      for (let i = 0; i < 3 + nB * 2; i++) { const [bx, bz] = L2W(B9, (R() - 0.5) * (w + 8), (R() - 0.5) * (d + 8)); if (!onRoad(bx, bz, 1) && !wAt(bx, bz)) addTreeF(R() < 0.5 ? 'round' : 'bush', bx, bz, 0.9 + R() * 0.5, treeHex('round', R)); } return; }
    if (kind === 'green') { const n = Math.max(1, Math.round(w * d / 45)); for (let i = 0; i < n; i++) { const sp = R() < 0.6 ? 'round' : 'pine'; addTreeF(sp, cx + (R() - 0.5) * w * 0.7, cz + (R() - 0.5) * d * 0.7, 0.8 + R() * 0.5, treeHex(sp, R)); }
      return; }   // 눕힌 초록 판 = 잔디밭(땅 물감 — prepBlocks) + 나무
    if (kind === 'park') { box(cx, y0, cz, w, 0.12, d, ry, 0x8fd06a); for (let i = 0; i < Math.max(2, w * d / 60); i++) addTreeF(R() < 0.7 ? 'round' : 'bush', cx + (R() - 0.5) * w * 0.8, cz + (R() - 0.5) * d * 0.8, 0.7 + R() * 0.3, treeHex('round', R)); bench(cx, cz, ry); return; }
    if (kind === 'house') {
      const style = R(), wall = [0xf3ead8, 0xe9dcc4, 0xdfe6ea, 0xf2e0d6, 0xe8e2cf, 0xb8674a][(R() * 6) | 0];
      if (h >= 12 || w * d > 150 || (style < 0.36 && h >= 7)) {   // 다가구·빌라(3cm 정육면체 · 눕힌 판 = 넓은 연립)(평지붕 2~3층 · 벽돌·밝은 벽 · 옥상 = 블록 색 방수 칠 · 물탱크 · 바깥 계단)
        box(cx, y0, cz, w * 0.94, h, d * 0.94, ry, wall); const B2 = { ...B9, w: w * 0.94, d: d * 0.94 }; B2.R = R;
        roofTop(B2, { deck: col, para: 0xefeae0, ac: 1 }); winRows(B2, { y0: 1.0, y1: h - 0.9, fh: 1.3, ww: 1.2, every: 3.0, ac: 0.35, flower: 0.18, sill: true, mull: true }); entrance(B2, { w: 1.2, h: 2.2, canopyHex: 0x6b7480 });
        const sf = FACES(B2)[R() < 0.5 ? 0 : 1]; for (let k = 0; k < Math.floor(h / 3.3); k++) fbox(B2, sf, (k % 2 ? 1 : -1) * 0.8, k * 3.3 + 2.9, 2.0, 0.18, 1.1, 0x9aa0a6);   // 바깥 계단참
        box(cx, y0, cz, w * 0.98, 0.3, d * 0.98, ry, 0xb9b2a4); return; }
      const wh = Math.min(h * 0.62, 7.2), rh = Math.min(h - wh, Math.min(w, d) * 0.45) + 0.6, B2 = { ...B9, w: w * 0.9, d: d * 0.9 }; B2.R = R;
      box(cx, y0, cz, w * 0.9, wh, d * 0.9, ry, wall);
      if (style < 0.7) gable(cx, y0 + wh, cz, w * 0.9, d * 0.9, rh, ry, col, { wall }); else hipRoof(cx, y0 + wh, cz, w * 0.9, d * 0.9, rh * 0.8, ry, col);
      winRows(B2, { y0: 0.95, y1: wh - 0.5, fh: 1.35, ww: 1.2, every: 3.4, flower: 0.3, sill: true, mull: true }); entrance(B2, { w: 1.2, h: 2.15, hex: [DOOR, 0x2f4a6a, 0x8a3a2a][(R() * 3) | 0], canopyHex: col });
      const cp = L2W(B9, w * 0.22, (R() - 0.5) * d * 0.3); box(cp[0], y0 + wh + rh * 0.3, cp[1], 0.7, rh * 0.8, 0.7, ry, 0x9a6a4a);   // 굴뚝
      box(cx, y0, cz, w * 0.95, 0.35, d * 0.95, ry, 0xb9b2a4); return; }
    if (kind === 'apt') {
      const wall = [0xf2efe8, 0xe8ecef, 0xf0e6d8][(R() * 3) | 0]; box(cx, y0, cz, w, h, d, ry, wall);
      for (let y = 3.3; y < h - 1; y += 3.3) box(cx, y0 + y - 0.1, cz, w + 0.12, 0.2, d + 0.12, ry, rgb(col, 1.05));   // 층 띠(블록 색)
      const ff = frontF(B9), nb = Math.max(2, Math.floor(ff[2] / 4));
      for (let y = 3.3; y < h - 1.4; y += 3.3) for (let k = 0; k < nb; k++) { const u = -ff[2] / 2 + (k + 0.5) * ff[2] / nb; fbox(B9, ff, u, y - 0.1, ff[2] / nb - 0.5, 0.2, 1.3, 0xd8d4ca); fbox(B9, ff, u, y + 0.1, ff[2] / nb - 0.5, 1.0, 0, 0x9fcbe0, { out: 1.28, glass: true, quad: true }); }   // 발코니 + 유리 난간(판)
      winRows(B9, { y0: 1.0, y1: h - 1.3, fh: 1.5, ww: 1.4, every: 3.0, ac: 0.25, skip: (f, u, y) => isFront(B9, f) && y > 3 });
      for (let y = 1.0; y < h - 1.4; y += 3.3) for (let k = 0; k < nb; k++) { const u = -ff[2] / 2 + (k + 0.5) * ff[2] / nb; if (y > 3) fbox(B9, ff, u, y, ff[2] / nb - 1.2, 1.9, 0.08, GLASS, { out: 0.02, glass: true }); }
      entrance(B9, { w: 2.6, h: 2.6, hex: 0x7fb8d0, canopyHex: 0x7a838c }); roofTop(B9, { deck: 0xbdb8ae, stairs: [0.5, 0.4], ac: 2, antenna: true }); return; }
    if (kind === 'shop' || kind === 'office') {
      const wall = kind === 'office' ? [0xe9edf0, 0xdfe3e6][(R() * 2) | 0] : [0xf3ead8, 0xeadfcc, 0xf5f1e8, 0xdbe4e8][(R() * 4) | 0];
      box(cx, y0, cz, w, h, d, ry, wall);
      if (kind === 'office') { for (let y = 1.0; y < h - 1.2; y += 3.3) box(cx, y0 + y, cz, w + 0.08, 1.9, d + 0.08, ry, 0x8fbcd6, { B: gbucket(cx, cz) }); box(cx, y0 + h - 0.8, cz, w + 0.3, 0.8, d + 0.3, ry, col);
        entrance(B9, { w: 2.6, h: 2.8, hex: 0x7fb8d0 }); roofTop(B9, { ac: 3, antenna: true, solar: true }); return; }
      const ff = frontF(B9), fw = ff[2], sh = Math.min(3.0, h - 0.6);
      fbox(B9, ff, 0, 0.35, fw * 0.86, sh - 0.6, 0.1, 0x9fd0e2, { glass: true }); for (let u = -fw * 0.43; u <= fw * 0.43 + 0.01; u += fw * 0.86 / Math.max(2, Math.round(fw / 3))) fbox(B9, ff, u, 0.3, 0.14, sh - 0.5, 0.16, 0x5f6670);   // 진열창 + 창살
      fbox(B9, ff, 0, 0.0, fw * 0.88, 0.35, 0.2, 0x8a8f95);
      const aw = [col, 0xffffff], nA = Math.max(3, Math.floor(fw / 1.15)); for (let k = 0; k < nA; k++) { const u = -fw * 0.46 + (k + 0.5) * fw * 0.92 / nA; fbox(B9, ff, u, sh + 0.05, fw * 0.92 / nA, 0.55, 1.5, aw[k % 2], { out: 0.05 }); }   // 줄무늬 차양
      const sgY = Math.min(h - 1.1, sh + 0.75); fbox(B9, ff, 0, sgY, fw * 0.72, 1.0, 0.25, rgb(col, 0.92)); fbox(B9, ff, 0, sgY + 0.12, fw * 0.66, 0.76, 0.1, 0xfffbea, { out: 0.2 });   // 간판(테 + 밝은 판)
      B9.signAt = { y: sgY + 0.5, w: fw * 0.6, h: 0.6, out: 0.305, bg: '#fffbea', fg: '#2b2b2b' };
      if (h > 6.5) winRows(B9, { y0: sh + 1.9, y1: h - 0.8, fh: 1.4, ww: 1.3, every: 3.0, ac: 0.4 }); else winRows(B9, { y0: 1.0, y1: h - 0.6, fh: 1.4, ww: 1.2, every: 3.4, skip: (f) => isFront(B9, f) });
      roofTop(B9, { ac: 2 + (R() * 2 | 0), tank: h > 6 }); return; }
    if (kind === 'factory') {
      box(cx, y0, cz, w, h * 0.7, d, ry, 0xcfd3d6); const n = Math.max(2, Math.round((w >= d ? w : d) / 6));
      for (let k = 0; k < n; k++) { const t = -0.5 + (k + 0.5) / n, lx = w >= d ? t * w : 0, lz = w >= d ? 0 : t * d, [px, pz] = L2W(B9, lx, lz);
        gable(px, y0 + h * 0.7, pz, w >= d ? w / n * 0.98 : w, w >= d ? d : d / n * 0.98, h * 0.22, ry, 0x8a96a3, { wall: 0xcfd3d6, eave: 0.1 }); }
      const [sx, sz] = L2W(B9, w * 0.38, 0); cyl(sx, y0, sz, 0.9, h * 1.6, 0xb04a3a); cyl(sx, y0 + h * 1.6 * 0.82, sz, 0.95, h * 1.6 * 0.08, 0xf2f1ea);   // 굴뚝
      const ff = frontF(B9); fbox(B9, ff, -ff[2] * 0.2, 0, Math.min(5, ff[2] * 0.4), 3.6, 0.15, 0x7a8592); for (let y = 0.4; y < 3.4; y += 0.45) fbox(B9, ff, -ff[2] * 0.2, y, Math.min(5, ff[2] * 0.4) - 0.2, 0.05, 0.18, 0x6a737e);
      winRows(B9, { y0: 2.4, y1: h * 0.7 - 0.6, fh: 1.0, ww: 2.2, every: 3.4, sill: false });
      const [tx, tz] = L2W(B9, -w / 2 - 2.2, d * 0.2); cyl(tx, ty(tx, tz), tz, 1.3, 5, 0xd8dcdf, 12); cyl(tx, ty(tx, tz) + 5, tz, 1.35, 0.3, 0xa9b0b6, 12); return; }
    if (kind === 'fire') {
      box(cx, y0, cz, w, h, d, ry, col); roofFlat(0x9a3a30); box(cx, y0 + h - 1.0, cz, w + 0.12, 0.45, d + 0.12, ry, 0xffffff);
      const ff = frontF(B9), fw = ff[2], n = Math.max(2, Math.min(3, Math.floor(fw / 4.2))), gh = Math.min(4.2, h * 0.5);
      for (let k = 0; k < n; k++) { const u = -fw / 2 + (k + 0.5) * fw / n; fbox(B9, ff, u, 0, fw / n - 1.0, gh, 0.14, 0xf2f1ea); fbox(B9, ff, u, gh, fw / n - 0.8, 0.25, 0.2, 0xb02a22); for (let y = 0.45; y < gh - 0.2; y += 0.5) fbox(B9, ff, u, y, fw / n - 1.1, 0.06, 0.16, 0xc9c6bd); }
      const [tx, tz] = L2W(B9, w / 2 - 1.6, -d / 2 + 1.6); box(tx, y0, tz, 3.2, h * 1.55, 3.2, ry, col); box(tx, y0 + h * 1.55 - 1.4, tz, 3.3, 0.9, 3.3, ry, 0xa9d4e6, { B: gbucket(tx, tz) }); box(tx, y0 + h * 1.55, tz, 3.8, 0.3, 3.8, ry, 0x9a3a30);   // 망루
      cyl(tx, y0 + h * 1.55 + 0.3, tz, 0.35, 0.5, 0xf23a2a, 8, { top: 0xffe0e0 }); winRows(B9, { y0: gh + 0.9, y1: h - 1.2, fh: 1.4, ww: 1.3, every: 3.0 });
      const [vx, vz] = L2W(B9, B9.fl[0] * (w / 2 + 4.2), B9.fl[1] * (d / 2 + 4.2)); vehicle(vx, vz, B9.ry + (B9.fl[0] ? 0 : Math.PI / 2), 'fire'); return; }
    if (kind === 'police') {
      box(cx, y0, cz, w, h, d, ry, 0xf2f2f0); roofTop(B9, { antenna: true }); box(cx, y0 + h - 1.1, cz, w + 0.12, 0.7, d + 0.12, ry, 0x2f4a8a); box(cx, y0 + 0.6, cz, w + 0.1, 0.3, d + 0.1, ry, 0x2f4a8a);
      winRows(B9, { y0: 1.0, y1: h - 1.5, fh: 1.4, ww: 1.3, every: 3.0, ac: 0.2 }); entrance(B9, { w: 2.2, h: 2.5, hex: 0x7fb8d0, canopyHex: 0x2f4a8a });
      const [vx, vz] = L2W(B9, B9.fl[0] * (w / 2 + 3.2) + (B9.fl[0] ? 0 : w * 0.3), B9.fl[1] * (d / 2 + 3.2) + (B9.fl[1] ? 0 : d * 0.3)); vehicle(vx, vz, B9.ry + (B9.fl[0] ? Math.PI / 2 : 0), 'police'); return; }
    if (kind === 'hospital') {
      box(cx, y0, cz, w, h, d, ry, 0xf6f6f2); roofTop(B9, { deck: 0xd8dcdf }); for (let y = 1.2; y < h - 1.4; y += 3.3) box(cx, y0 + y, cz, w + 0.1, 1.4, d + 0.1, ry, 0xb9dcef, { B: gbucket(cx, cz) });   // 유리 띠
      entrance(B9, { w: 2.8, h: 2.6, hex: 0x7fb8d0, canopyHex: 0xe9edf0 }); const ff = frontF(B9), ch = Math.min(3.2, h * 0.3), cy9 = h - ch - 0.9;
      if (B9.b.wing) { fbox(B9, ff, 0, cy9 + ch * 0.34, ch * 0.9, ch * 0.32, 0.12, 0x6fa8dc, { out: 0.05 }); return; }   // 병동(본관 옆 · 십자·구급차 없음 · 파란 띠)
      fbox(B9, ff, 0, cy9, ch * 0.32, ch, 0.15, 0xe0453a, { out: 0.05 }); fbox(B9, ff, 0, cy9 + ch * 0.34, ch, ch * 0.32, 0.15, 0xe0453a, { out: 0.05 });   // 빨간 십자
      box(cx, y0 + h + 0.25, cz, 3.8, 0.06, 1.2, ry, 0xe0453a); box(cx, y0 + h + 0.25, cz, 1.2, 0.07, 3.8, ry, 0xe0453a);
      const [vx, vz] = L2W(B9, B9.fl[0] * (w / 2 + 3.4) + (B9.fl[0] ? 0 : -w * 0.3), B9.fl[1] * (d / 2 + 3.4) + (B9.fl[1] ? 0 : -d * 0.3)); vehicle(vx, vz, B9.ry + (B9.fl[0] ? Math.PI / 2 : 0), 'amb'); return; }
    if (kind === 'play') {   // 놀이터(아이 남색 블록 = 큰 정글짐 · ✨): 모래 마당 + 탑 정글짐(빨강 지붕) + 미끄럼틀 + 그네 + 시소 — 쉼터 벤치
      const Q = LP(cx, cz, ry), y = y0; box(cx, y, cz, w + 10, 0.08, d + 8, ry, 0xe6d3a0, { top: 0xead8a6 }); for (const s9 of [-1, 1]) { const [bx, bz] = Q(s9 * (w / 2 + 5.2), 0); box(bx, y, bz, 0.25, 0.3, d + 8, ry, 0x9b6a3c); } for (const s9 of [-1, 1]) { const [bx, bz] = Q(0, s9 * (d / 2 + 4.2)); box(bx, y, bz, w + 10.5, 0.3, 0.25, ry, 0x9b6a3c); }   // 모래 + 나무 테두리
      const n = 4, S9 = Math.min(w, d) * 0.8 / (n - 1); for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { const [px, pz] = Q(-S9 * (n - 1) / 2 + a * S9, -S9 * (n - 1) / 2 + b * S9); cyl(px, y, pz, 0.09, 3.3, [0x2f6fd0, 0xe0453a, 0xf2c230, 0x3cc76a][(a + b) % 4], 6); }   // 기둥(알록달록)
      for (let lv = 1; lv <= 3; lv++) for (let a = 0; a < n; a++) { const o9 = -S9 * (n - 1) / 2 + a * S9, yy = y + lv * 1.05 + (lv % 2) * 0.09; const [hx, hz] = Q(0, o9); dbx(hx, yy, hz, S9 * (n - 1), 0.07, 0.07, ry, 0xf2c230); const [vx, vz] = Q(o9, 0); dbx(vx, yy + 0.045, vz, 0.07, 0.07, S9 * (n - 1), ry, 0x2f6fd0); }   // 가로 막대(층마다 · 축별로 높이 엇갈림)
      box(cx, y + 3.3, cz, S9 * 1.2, 0.18, S9 * 1.2, ry, 0x9b6a3c); hipRoof(cx, y + 3.48, cz, S9 * 1.3, S9 * 1.3, 1.3, ry, 0xe0453a);   // 탑 마루 + 빨간 지붕
      { const [sx, sz] = Q(S9 * (n - 1) / 2 + 2.2, 0); box(sx, y + 0.1, sz, 4.4, 0.16, 1.1, ry - 0.62, 0xf2c230); box(sx, y + 1.4, sz, 4.6, 0.12, 1.1, ry - 0.62, 0xf2c230); }   // 미끄럼틀
      { const [gx, gz] = Q(0, -(d / 2 + 2.2)); for (const s9 of [-1.6, 1.6]) { const [px, pz] = Q(s9, -(d / 2 + 2.2)); box(px, y, pz, 0.14, 2.5, 0.14, 0, 0x5f6670); } box(gx, y + 2.45, gz, 3.4, 0.14, 0.14, ry, 0x5f6670); for (const s9 of [-0.7, 0.7]) { const [px, pz] = Q(s9, -(d / 2 + 2.2)); dbx(px, y + 0.5, pz, 0.6, 0.06, 0.35, ry, 0x9b6a3c); dbx(px, y + 0.56, pz, 0.04, 1.9, 0.04, ry, 0x8a8f95); } }   // 그네
      { const [tx9, tz9] = Q(-(w / 2 + 2.4), d / 4); box(tx9, y, tz9, 0.4, 0.5, 0.4, ry, 0x5f6670); box(tx9, y + 0.55, tz9, 0.35, 0.08, 3.6, ry + 0.12, 0x3cc76a); }   // 시소
      for (const s9 of [-1, 1]) { const [bx, bz] = Q(s9 * (w / 2 + 3.6), -(d / 2 + 3.2)); bench2(bx, bz, ry); }
      PCOL.push(col9(cx, cz, w / 2, d / 2, ry, y - 1, y + 0.6)); return; }
    if (kind === 'cinema') {   // 영화관(아이 남색 긴 판 · 이름표 「영화관」): 낮고 긴 몸채 + 높은 상영관 + 큰 간판 + 포스터 틀 + 유리 입구
      const H2 = Math.max(h, 9), wall = 0x2f4a8a; box(cx, y0, cz, w, H2, d, ry, 0x3b4f86); roofTop({ ...B9, h: H2 }, { ac: 3, deck: 0x9aa3b8 }); const ff = frontF(B9), fw9 = ff[2];
      fbox(B9, ff, 0, 0.2, fw9 * 0.34, 3.2, 0.12, 0x9fd0e2, { glass: true }); fbox(B9, ff, 0, 3.4, fw9 * 0.4, 0.5, 2.2, 0xf2f1ea, { out: 0.05 });   // 유리 입구 + 차양
      for (const s9 of [-1, 1]) for (let k = 0; k < 3; k++) { const u = s9 * (fw9 * 0.24 + k * 3.4); fbox(B9, ff, u, 1.0, 2.2, 3.0, 0.1, 0xf2c230, { out: 0.02 }); fbox(B9, ff, u, 1.15, 1.8, 2.7, 0.06, [0xe0453a, 0x3cc76a, 0x8a5bd1, 0xef8b33, 0x3d74c9, 0xf08fb2][(k + (s9 > 0 ? 3 : 0)) % 6], { out: 0.08 }); }   // 영화 포스터 틀(그림은 색판)
      fbox(B9, ff, 0, H2 - 2.4, fw9 * 0.5, 2.0, 0.3, 0x1d2b3a, { out: 0.1 }); B9.signAt = { y: H2 - 1.4, w: fw9 * 0.45, h: 1.5, out: 0.42, bg: '#1d2b3a', fg: '#ffd84a' }; return; }
    if (kind === 'school' && w > 30) {   // 두 번째 학교(아이 검은 종이 = 학교 · 큰 칸): 뒤쪽 3층 교사동 + 앞 운동장(흙·트랙·골대·조회대) + 교문 · 우리 학교와 같은 크림색·노란 처마
      const Q = LP(cx, cz, ry), bk = [-B9.fl[0], -B9.fl[1]], depth = 14, H3 = 11.5, alongX = !bk[0], bw = alongX ? w * 0.92 : depth, bd = alongX ? depth : d * 0.92, off = (alongX ? d : w) / 2 - depth / 2 - 1;
      const [sx, sz] = L2W(B9, bk[0] * off, bk[1] * off), S2 = { ...B9, cx: sx, cz: sz, w: bw, d: bd, h: H3, R }; box(sx, y0, sz, bw, H3, bd, ry, 0xf3e7c8); box(sx, y0 + H3 - 0.7, sz, bw + 0.3, 0.7, bd + 0.3, ry, 0xf2c230); roofTop(S2, { deck: 0xc9a77a, ac: 4 });
      winRows(S2, { y0: 1.0, y1: H3 - 1.2, fh: 1.6, ww: 1.8, every: 3.2, sill: true }); for (let lv = 1; lv < 3; lv++) box(sx, y0 + lv * 3.6 - 0.1, sz, bw + 0.08, 0.18, bd + 0.08, ry, 0xe6d6b0);
      const [fx, fz] = L2W(B9, B9.fl[0] * 3, B9.fl[1] * 3), fl2 = (alongX ? d : w) - depth - 6; box(fx, y0 + 0.02, fz, alongX ? w * 0.9 : fl2, 0.06, alongX ? fl2 : d * 0.9, ry, 0xd9b98a, { top: 0xd6b47f });   // 운동장(흙)
      { const r9 = Math.min(alongX ? w : fl2, alongX ? fl2 : d) * 0.36; for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2, [px, pz] = [fx + Math.cos(t) * r9 * (alongX ? 1.5 : 1), fz + Math.sin(t) * r9 * (alongX ? 1 : 1.5)]; dbx(px, y0 + 0.08, pz, 1.2, 0.012, 0.18, -t, 0xffffff, { noSide: true }); } }   // 트랙 흰 선
      for (const s9 of [-1, 1]) { const [gx, gz] = alongX ? [fx + s9 * w * 0.38, fz] : [fx, fz + s9 * d * 0.38]; box(gx, y0, gz, alongX ? 0.12 : 4.8, 2.1, alongX ? 4.8 : 0.12, 0, 0xffffff); }   // 골대
      const [cx9, cz9] = L2W(B9, bk[0] * (off - depth / 2 - 2.2), bk[1] * (off - depth / 2 - 2.2)); box(cx9, y0, cz9, 4, 0.9, 2.4, ry, 0xd8d4ca);   // 조회대
      const ffx = FACES(S2).find(f => f[0] === B9.fl[0] && f[1] === B9.fl[1]) || FACES(S2)[0]; fbox(S2, ffx, 0, H3, 3.4, 3.4, 2.4, 0xf3e7c8, { out: -2.4 }); fbox(S2, ffx, 0, H3 + 1.2, 2.2, 2.2, 0.1, 0xffffff, { out: 0.02 }); fbox(S2, ffx, 0, H3 + 2.2, 0.12, 0.9, 0.12, 0x333333, { out: 0.12 });   // 시계탑
      B9.signAt = null; B9.signT = null; const [tx9, tz9] = L2W(S2, ffx[0] * (ffx[3] + 0.08), ffx[1] * (ffx[3] + 0.08)); textPlane(null, B9.name || '학교', tx9, y0 + H3 - 0.36, tz9, Math.atan2(B9.fw[0], B9.fw[1]), 8, 0.62, { one: true, bgc: '#f2c230', fg: '#1d2b3a', off: 0 });
      B9.collide = [col9(sx, sz, bw / 2, bd / 2, ry, y0 - 2, y0 + H3)]; return; }
    if (kind === 'school') {
      box(cx, y0, cz, w, h, d, ry, 0xf3e7c8); roofFlat(0xc9a77a); winRows(B9, { y0: 1.0, y1: h - 1.2, fh: 1.6, ww: 1.6, every: 3.0 }); entrance(B9, { w: 2.4, h: 2.6, hex: 0x7fb8d0 });
      const ff = frontF(B9); fbox(B9, ff, 0, h, 3.4, 3.6, 2.4, 0xf3e7c8, { out: -2.4 }); fbox(B9, ff, 0, h + 1.2, 2.2, 2.2, 0.1, 0xffffff, { out: 0.02 }); fbox(B9, ff, 0, h + 2.2, 0.12, 0.9, 0.12, 0x333333, { out: 0.12 }); return; }
    // public · library · post — 하얀 벽 + 블록 색 처마 띠 + 깃대 + 넓은 계단
    box(cx, y0, cz, w, h, d, ry, 0xf3f1ea); roofTop(B9, { ac: 2 }); box(cx, y0 + h - 0.9, cz, w + 0.3, 0.9, d + 0.3, ry, col);
    if (kind === 'library') { const ff = frontF(B9); fbox(B9, ff, 0, 0.6, ff[2] * 0.75, h - 2.0, 0.12, 0x9cc8e0, { glass: true }); for (let u = -ff[2] * 0.36; u <= ff[2] * 0.36; u += ff[2] * 0.72 / 5) fbox(B9, ff, u, 0.6, 0.18, h - 2.0, 0.2, 0xe8e4da); winRows(B9, { y0: 1.0, y1: h - 1.4, fh: 1.4, ww: 1.3, skip: (f) => isFront(B9, f) }); }
    else winRows(B9, { y0: 1.0, y1: h - 1.4, fh: 1.5, ww: 1.4, every: 3.0 });
    entrance(B9, { w: 2.4, h: 2.6, hex: 0x7fb8d0, canopyHex: col }); fbox(B9, frontF(B9), 0, 0, 5.2, 0.32, 2.8, 0xd8d4ca, { out: 0.3 });
    if (kind === 'post') { const ff = frontF(B9), [px, pz] = L2W(B9, B9.fl[0] ? B9.fl[0] * (w / 2 + 1.6) : ff[2] * 0.32, B9.fl[1] ? B9.fl[1] * (d / 2 + 1.6) : ff[2] * 0.32); box(px, ty(px, pz), pz, 0.7, 1.3, 0.6, B9.ry, 0xe0453a, { top: 0xc23a2a }); }   // 빨간 우체통
    const ff = frontF(B9), [fx, fz] = L2W(B9, B9.fl[0] ? B9.fl[0] * (w / 2 + 1.4) : -ff[2] * 0.42, B9.fl[1] ? B9.fl[1] * (d / 2 + 1.4) : -ff[2] * 0.42); cyl(fx, ty(fx, fz), fz, 0.08, 7.5, 0xdadada, 6); box(fx + 0.7, ty(fx, fz) + 6.4, fz, 1.4, 0.9, 0.05, B9.ry + Math.PI / 2, col);   // 깃대
  }
  const addTreeF = (sp, x, z, s, hex) => TREES[sp].push({ x, y: ty(x, z), z, s, hex, ry: (x * 7 + z * 3) % 6 });

  // ───────── 장소 이름 목록 + 길 그래프(교차점·T자 · 다익스트라) ─────────
  let PLACES = [], GRAPH = null;
  const nameOf = (o) => LANG === 'en' ? (o.en || (KIND[o.kind] || NATK[o.kind] || {}).en || o.name) : o.name;
  function assignSigns() {   // 간판 글씨: 아이가 쓴 이름(sign·name) 먼저 · 없으면 그 칸 이름표 뜻(음식점들 → 음식 이름) · 없으면 종류별 목록에서(✨) — 같은 칸에서 겹치지 않게
    const used = new Map(); SIGNAI = 0;
    for (const B9 of BLD) { B9.signT = null; const k = B9.kind; if (B9.b.sign || B9.name) { if (!['house', 'apt', 'green', 'park'].includes(k)) B9.signT = B9.b.sign || B9.name; continue; }
      const A = areaAt(B9.cx, B9.cz), pool = A && A.sign === 'food' && (k === 'shop' || k === 'house') ? 'food' : k === 'shop' ? 'shop' : k === 'office' ? 'office' : k === 'factory' ? 'factory' : null; if (!pool) continue;
      const cell = cellOf(B9.cx, B9.cz), L9 = SIGNPOOL[pool], u = used.get(cell + pool) || new Set(); let i = hashS((B9.b.id || '') + ':' + B9.cx.toFixed(0)) % L9.length; for (let t = 0; t < L9.length && u.has(i); t++) i = (i + 1) % L9.length; u.add(i); used.set(cell + pool, u);
      B9.signT = L9[i]; B9.signAI = true; SIGNAI++; if (pool === 'food' && k === 'house') B9.kind = 'shop'; } }
  let SIGNAI = 0;
  function prepPlaces() {
    PLACES = [];
    PLACES.push({ id: 'school', name: '우리 학교', en: 'Our School', kind: 'school', x: 16.5, z: 50, door: [16.5, 58], icon: '🏫', school: true });
    for (const B9 of BLD) { if (!B9.gen && !B9.name && B9.kind === 'hospital' && !B9.b.wing) B9.name = '병원';   // 교사 10-13: 흰 블록 = 병원(이름표 없어도)
      if (!B9.name && !B9.b.home) continue; const k = KIND[B9.kind] || {};
      PLACES.push({ id: B9.b.id, name: B9.name || (B9.b.home + '네 집'), en: B9.b.en || (B9.b.home ? B9.b.home + "'s House" : null), kind: B9.kind, x: B9.cx, z: B9.cz, door: B9.door, icon: k.emo || '🏠', sym: k.sym || '◆', ai: B9.b.ai || null, home: B9.b.home || null }); }
    for (const it of L.nature) { if (!it.name) continue; const sh = shapeOf(it); if (!sh) continue; const bb = bboxOf(sh); let cx = (bb[0] + bb[2]) / 2, cz = (bb[1] + bb[3]) / 2;
      if (sh.line) { const P = sh.line, m = P[Math.floor(P.length / 2)]; cx = m[0]; cz = m[1]; }
      const kk = it.k === 'field' ? it.sub || 'grass' : it.k; PLACES.push({ id: it.id, name: it.name, en: it.en, kind: kk, x: cx, z: cz, door: [cx, cz], icon: { hill: '⛰', water: '💧', forest: '🌲', rice: '🌾', farm: '🌱', orchard: '🍎', park: '🌳', grass: '🌿', sand: '⛱' }[kk] || '🌿', sym: { hill: '⛰', water: '〰', forest: '♣', rice: 'ıı', farm: 'ㅛ', orchard: 'ⓞ', park: '♣', grass: '⺾' }[kk] || '◇', nat: true, ai: it.ai || null }); }
    for (const P of PROPS) { const K = PROPK[P.k]; if (!K || !K.place || (P.k === 'card' && !P.name)) continue; PLACES.push({ id: P.id, name: P.label, en: P.en || K.en, kind: 'prop', x: P.x, z: P.z, door: [P.x, P.z], icon: K.ic, sym: K.ic, ai: P.guess ? '그림 카드 — 이름으로 어림' : null, prop: true }); }   // 아이 소품 중 갈 수 있는 곳(정자·약수터·주차장…)
    for (const A of AREAS) if (A.t && !A.noStone) PLACES.push({ id: A.id, name: A.t, en: A.en, kind: 'area', x: A.cx, z: A.cz, door: [A.sx, A.sz], icon: '🔖', sym: '🔖', area: true });   // 아이 이름표 칸
  }
  function buildGraph() {
    const nodes = [], key = (x, z) => Math.round(x * 2) + ':' + Math.round(z * 2), idx = new Map(), adj = [];
    const node = (x, z) => { const k = key(x, z); let i = idx.get(k); if (i == null) { i = nodes.length; nodes.push([x, z]); idx.set(k, i); adj.push([]); } return i; };
    const cuts = RSEG.map(s => { const c = [0, 1]; for (const X9 of s.wr || []) if (!X9.br) c.push(X9.t0 / s.L0, X9.t1 / s.L0); return c; });   // 다리 없는 건너는 곳 = 끊긴 길
    RSEG.forEach((s, i) => RSEG.forEach((o, j) => { if (i >= j) return; const X9 = segX(s.a, s.b, o.a, o.b); if (X9) { cuts[i].push(X9.t); cuts[j].push(X9.u); }
      // T자(끝이 다른 길 위 — 테이프가 조금 짧거나 길어도 잇기)
      for (const [P, si, oj, Ls] of [[s.a, i, j, o], [s.b, i, j, o], [o.a, j, i, s], [o.b, j, i, s]]) { const r = segD(P[0], P[1], Ls.a, Ls.b); if (r[0] < Ls.hw + 3 && r[1] > 0.001 && r[1] < 0.999) cuts[oj].push(r[1]); } }));
    RSEG.forEach((s, i) => { const T = [...new Set(cuts[i].map(t => Math.round(t * 1e4) / 1e4))].sort((a, b) => a - b); let prev = null, prevT = 0;
      const gap = tm => (s.wr || []).some(X9 => !X9.br && tm * s.L0 > X9.t0 && tm * s.L0 < X9.t1);
      for (const t of T) { const x = s.a[0] + (s.b[0] - s.a[0]) * t, z = s.a[1] + (s.b[1] - s.a[1]) * t; let n = node(x, z);
        // 가까운 기존 마디에 붙이기(T자 끝점)
        for (let q = 0; q < nodes.length; q++) if (q !== n && Math.hypot(nodes[q][0] - x, nodes[q][1] - z) < Math.max(3, s.hw)) { n = q; break; }
        if (prev != null && prev !== n && !gap((prevT + t) / 2)) { const L9 = Math.hypot(nodes[n][0] - nodes[prev][0], nodes[n][1] - nodes[prev][1]); if (!crossesSchool(nodes[prev], nodes[n])) { adj[prev].push([n, L9, s.r.big ? 1 : 0, s.hw]); adj[n].push([prev, L9, s.r.big ? 1 : 0, s.hw]); } } prev = n; prevT = t; } });
    GRAPH = { nodes, adj };
  }
  const crossesSchool = (a, b) => { for (let t = 0.1; t < 1; t += 0.2) if (inSchool(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return true; return false; };
  function snapRoad(x, z) { let best = null; GRAPH.adj.forEach((e, i) => e.forEach(([j]) => { if (j < i) return; const r = segD(x, z, GRAPH.nodes[i], GRAPH.nodes[j]); if (!best || r[0] < best.d) best = { d: r[0], i, j, t: r[1], p: [r[2], r[3]] }; })); return best; }
  // 길 찾기: 내 자리 → 그 장소 문 앞(길을 따라) → { ok, pts, len } · 끊긴 길이면 ok false
  function route(from, to) {
    if (!GRAPH || !GRAPH.nodes.length) return { ok: false, reason: 'noroad' };
    const A = snapRoad(from[0], from[1]), B = snapRoad(to[0], to[1]); if (!A || !B) return { ok: false, reason: 'noroad' };
    const N = GRAPH.nodes.length, dist = new Float64Array(N + 2).fill(Infinity), prev = new Int32Array(N + 2).fill(-1), done = new Uint8Array(N + 2), SA = N, SB2 = N + 1;
    const nb = (u) => { const out = u < N ? GRAPH.adj[u].slice() : []; const add = (S9, k) => { const pn = S9.p; if (u === S9.i) out.push([k, Math.hypot(pn[0] - GRAPH.nodes[u][0], pn[1] - GRAPH.nodes[u][1])]); if (u === S9.j) out.push([k, Math.hypot(pn[0] - GRAPH.nodes[u][0], pn[1] - GRAPH.nodes[u][1])]); };
      if (u < N) { add(A, SA); add(B, SB2); } else { const S9 = u === SA ? A : B; out.push([S9.i, Math.hypot(S9.p[0] - GRAPH.nodes[S9.i][0], S9.p[1] - GRAPH.nodes[S9.i][1])], [S9.j, Math.hypot(S9.p[0] - GRAPH.nodes[S9.j][0], S9.p[1] - GRAPH.nodes[S9.j][1])]);
        if (A.i === B.i && A.j === B.j && u === SA) out.push([SB2, Math.hypot(A.p[0] - B.p[0], A.p[1] - B.p[1])]); } return out; };
    dist[SA] = 0; for (;;) { let u = -1, du = Infinity; for (let k = 0; k < N + 2; k++) if (!done[k] && dist[k] < du) { du = dist[k]; u = k; } if (u < 0 || u === SB2) break; done[u] = 1;
      for (const [v, w] of nb(u)) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } }
    if (!isFinite(dist[SB2])) return { ok: false, reason: 'cut' };
    const path = []; for (let u = SB2; u >= 0; u = prev[u]) path.unshift(u === SA ? A.p : u === SB2 ? B.p : GRAPH.nodes[u]);
    const pts = [from, ...path, to]; let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { ok: true, pts, len };
  }
  const findPlace = (q) => { const s = String(q || '').replace(/\s/g, ''); if (!s) return null; const P = PLACES;
    return P.find(p => p.name.replace(/\s/g, '') === s) || P.find(p => p.name.replace(/\s/g, '').includes(s)) || P.find(p => (KIND[p.kind] || NATK[p.kind] || {}).ko === s) || P.find(p => p.en && p.en.toLowerCase() === s.toLowerCase()) || null; };

  // ───────── 재질 · 지어서 붙이기 · 다시 짓기(판·모습 바꿈) ─────────
  const ripple = rippleTex(), WT = { value: 0 };
  function detailTex(kind) {   // 흰 바탕 위 결(정점색에 곱해짐) — grass = 풀잎 · grain = 아스팔트·흙·벽 알갱이
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), R = rng0(kind === 'grass' ? 21 : 33); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256);
    if (kind === 'grass') { for (let i = 0; i < 2600; i++) { const x = R() * 256, y = R() * 256, l = 3 + R() * 7, a = -0.5 + R(), v = 196 + (R() * 50) | 0; g.strokeStyle = 'rgba(' + (v - 30) + ',' + v + ',' + (v - 60) + ',' + (0.35 + R() * 0.4) + ')'; g.lineWidth = 0.8 + R() * 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); g.stroke(); }
      for (let i = 0; i < 70; i++) { const x = R() * 256, y = R() * 256, r = 6 + R() * 18; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(150,170,110,.22)'); gr.addColorStop(1, 'rgba(150,170,110,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }
    else for (let i = 0; i < 5200; i++) { const x = R() * 256, y = R() * 256, v = (222 + R() * 33) | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.2 + R() * 0.45) + ')'; g.fillRect(x, y, 1 + R() * 2.2, 1 + R() * 2.2); }
    const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 4; TEX.push(t); return t; }
  function fieldTex(kind) {   // 줄 4개 = 한 장(가로 u = 줄 건너는 방향 · 세로 v = 줄 방향)
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), R = rng0(kind === 'rice' ? 41 : 43);
    if (kind === 'rice') { const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#6f9a74'); gr.addColorStop(1, '#7aa77e'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(190,225,230,' + (0.15 + R() * 0.25) + ')'; g.fillRect(R() * 256, R() * 256, 6 + R() * 26, 2 + R() * 3); }   // 하늘 비침
      for (let k = 0; k < 4; k++) { const cx = (k + 0.5) * 64; g.fillStyle = 'rgba(120,170,70,.45)'; g.fillRect(cx - 16, 0, 32, 256); for (let y = 2; y < 256; y += 7) { const yy = y + R() * 3; for (let j = 0; j < 11; j++) { const a = (R() - 0.5) * 1.5, l = 9 + R() * 12; g.strokeStyle = ['#7fbf45', '#9dd35a', '#6aa83a'][(R() * 3) | 0]; g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx + (R() - 0.5) * 6, yy + 4); g.lineTo(cx + Math.sin(a) * l, yy - Math.cos(a) * l * 0.6); g.stroke(); } } } }
    else { g.fillStyle = '#8a6440'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 3000; i++) { const v = R(); g.fillStyle = v < 0.5 ? 'rgba(110,78,48,.5)' : 'rgba(160,122,82,.45)'; g.fillRect(R() * 256, R() * 256, 1 + R() * 2, 1 + R() * 2); }
      for (let k = 0; k < 4; k++) { const cx = (k + 0.5) * 64; g.fillStyle = 'rgba(170,132,90,.85)'; g.fillRect(cx - 17, 0, 34, 256); g.fillStyle = 'rgba(120,88,56,.6)'; g.fillRect(cx - 17, 0, 4, 256); g.fillRect(cx + 13, 0, 4, 256);
        for (let y = 8; y < 256; y += 16) { const yy = y + R() * 4; for (let j = 0; j < 5; j++) { g.fillStyle = ['#4f8f3a', '#6aa84a', '#7cb84f', '#5a9a40'][(R() * 4) | 0]; g.beginPath(); g.ellipse(cx + (R() - 0.5) * 12, yy + (R() - 0.5) * 6, 4 + R() * 3, 3 + R() * 2, R() * 3, 0, 7); g.fill(); } } } }
    const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 4; TEX.push(t); return t; }
  const swayAttr = m => { m.onBeforeCompile = sh => { sh.uniforms.uWT = WT; sh.vertexShader = 'uniform float uWT;\nattribute float sw;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.x += sin(uWT * 1.4 + position.x * 0.17 + position.z * 0.13) * 0.055 * sw; transformed.z += cos(uWT * 1.1 + position.z * 0.15) * 0.04 * sw;'); }; m.customProgramCacheKey = () => 'townSway2'; return m; };
  const MAT = { ground: new T3.MeshLambertMaterial({ vertexColors: true, map: detailTex('grass') }), solid: new T3.MeshLambertMaterial({ vertexColors: true, map: detailTex('grain') }), tree: swayAttr(new T3.MeshLambertMaterial({ vertexColors: true })), rice: new T3.MeshLambertMaterial({ map: fieldTex('rice') }), glass: new T3.MeshLambertMaterial({ vertexColors: true, emissive: 0x000000 }), lamp: new T3.MeshBasicMaterial({ vertexColors: true, color: 0xb8b8b8 }), farm: new T3.MeshLambertMaterial({ map: fieldTex('farm') }),
    river: new T3.MeshLambertMaterial({ vertexColors: true, map: ripple, transparent: true, opacity: 0.9, depthWrite: false }), pond: new T3.MeshLambertMaterial({ vertexColors: true, map: null, transparent: true, opacity: 0.88, depthWrite: false }) };
  { const t2 = ripple.clone(); t2.needsUpdate = true; TEX.push(t2); MAT.pond.map = t2; MAT.pond.polygonOffset = true; MAT.pond.polygonOffsetFactor = 1; MAT.pond.polygonOffsetUnits = 2; }   // 호수가 강 띠와 만나는 곳: 강이 위(반짝임 없음)
  for (const k in MAT) MATS.push(MAT[k]);
  let DMESH = [], RING = null;
  let ROOT = null, COLS = [], LABELS = [], STATS = null, mapDirty = true, bigOpen = false, routeNow = null;
  async function build() {
    if (ROOT) { map.remove(ROOT); ROOT.traverse(o => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } }); for (const g of GEOS) g.dispose(); GEOS.length = 0; } for (const h of COLS) h.remove(); COLS = []; LABELS = [];
    BK.clear(); TBK.clear(); FBK.clear(); GBK.clear(); LB.clear(); DBK.clear(); for (const k in TREES) TREES[k].length = 0; BRIDGES.length = 0; for (const o of PTX) o.dispose(); PTX.length = 0; ROOFS = []; PCOL = []; SQ = []; SMAT = null;
    L.nature = L.nature.filter(n => !n.gen); prepRoads(); buildTerrain(); prepBlocks(); prepProps(); prepCross(); prepAreas(); ZFILL.length = 0; if (LOOK === 'town') { drawZoneGreen(); fillZones(); } assignSigns(); prepPlaces(); buildGraph();
    ROOT = new T3.Group(); ROOT.userData.fx = 1;
    COLS9 = []; prepTints(); drawGround(ROOT); drawSkirt(ROOT); drawWater(ROOT); drawBanks(ROOT); drawMountainRoads(ROOT); drawRoads(); drawNature();
    if (LOOK === 'mat') drawZonePaper();
    for (const B9 of BLD) { if (LOOK === 'mat') buildMat(B9); else buildTown(B9); }
    if (LOOK === 'town') { areaDeco(); areaFeatures(ROOT); landscape(); drawRiverside(); }
    if (LOOK === 'town') { roadTrees(); drawFacilities(); }
    drawProps(ROOT); areaStones(ROOT);   // 아이가 놓은 종이 소품 · 칸 이름표 돌(두 모습 모두)
    for (const [, b] of BK) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(b.u, 2)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT.solid); m.matrixAutoUpdate = false; m.receiveShadow = true; ROOT.add(m); }
    DMESH = []; for (const [, b] of DBK) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(b.u, 2)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT.solid); m.matrixAutoUpdate = false; m.userData.c = [b.cx, b.cz]; ROOT.add(m); DMESH.push(m); }
    for (const [, b] of LB) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT.lamp); m.matrixAutoUpdate = false; ROOT.add(m); }
    for (const [, b] of GBK) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT.glass); m.matrixAutoUpdate = false; ROOT.add(m); }
    for (const [, b] of FBK) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(b.u, 2)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT[b.kind]); m.matrixAutoUpdate = false; m.receiveShadow = true; ROOT.add(m); }
    clearAroundProps(); drawTrees(ROOT); drawLabels(ROOT); flushSigns(ROOT);
    map.add(ROOT);
    if (LIFE) LIFE.dispose(); LIFE = LOOK === 'town' && D.life ? makeLife() : null; if (LIFE) LIFE.night(NIGHT9);
    // 충돌: 건물(발자국 상자) · 물(칸 줄 — 다리 칸은 뺌) · 다리 판 · 나무 줄기
    for (const B9 of BLD) { if (B9.kind === 'green' || B9.kind === 'park' || B9.bigGreen) continue; if (B9.collide && LOOK === 'town') { for (const c of B9.collide) COLS.push(map.collider.add(c)); continue; } if (B9.kind === 'play' && LOOK === 'town') continue; const xs = B9.corners.map(p => p[0]), zs = B9.corners.map(p => p[1]); const top = B9.y0 + B9.h + (LOOK === 'town' && B9.kind === 'house' ? 2 : 0);
      COLS.push(map.collider.add({ x0: Math.min(...xs), x1: Math.max(...xs), y0: B9.y0 - 2, y1: Math.max(top, B9.y0 + 1.9), z0: Math.min(...zs), z1: Math.max(...zs) })); }
    // 물 울타리(WATER-2): 석축 벽 선을 따라 짧은 상자(벽에서 물 쪽으로 0.3m · 다리·데크 아래는 비움) + 깊은 물 안쪽 줄(받침) — 둔치는 걸어 다닐 수 있음
    const underBr = (x, z) => BRIDGES.some(b => x > b.x0 - 1 && x < b.x1 + 1 && z > b.z0 - 1 && z < b.z1 + 1);
    for (const [p, q, n] of WALLSEG) { const mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2; if (underBr(mx, mz)) continue; const a = [p[0] + n[0] * 0.3, p[1] + n[1] * 0.3], b = [q[0] + n[0] * 0.3, q[1] + n[1] * 0.3];
      COLS.push(map.collider.add({ x0: Math.min(a[0], b[0]) - 0.22, x1: Math.max(a[0], b[0]) + 0.22, y0: TY - 3, y1: TY + 1.75, z0: Math.min(a[1], b[1]) - 0.22, z1: Math.max(a[1], b[1]) + 0.22 })); }
    for (let j = 0; j < NZ - 1; j++) { let run = -1; for (let i = 0; i <= NX - 1; i++) { const k = j * NX + i, w = i < NX - 1 && SDW[k] < -3 && SDW[k + 1] < -3 && SDW[k + NX] < -3 && SDW[k + NX + 1] < -3 && !(BRM[k] || BRM[k + 1] || BRM[k + NX] || BRM[k + NX + 1]), z = nz(j);
      if (w && run < 0) run = i; if ((!w || i === NX - 1) && run >= 0) { COLS.push(map.collider.add({ x0: nx(run), x1: nx(i), y0: TY - 3, y1: TY + 1.75, z0: z, z1: z + G })); run = -1; } } }
    for (const br of BRIDGES) COLS.push(map.collider.add({ x0: br.x0, x1: br.x1, y0: br.y1 - 0.5, y1: br.y1, z0: br.z0, z1: br.z1 }));
    for (const c of PCOL) COLS.push(map.collider.add(c)); for (const c of COLS9) COLS.push(map.collider.add(c));   // … · 고갯길 옹벽   // 소품(정자 마루·비닐하우스·경운기·분수…) · 이름표 돌
    for (const sp of ['round', 'pine', 'poplar']) for (const t of TREES[sp]) COLS.push(map.collider.add({ x0: t.x - 0.3 * t.s, x1: t.x + 0.3 * t.s, y0: t.y - 1, y1: t.y + 2.2 * t.s, z0: t.z - 0.3 * t.s, z1: t.z + 0.3 * t.s }));
    STATS = stats(); mapDirty = true;
  }
  function drawLabels(group) {   // 이름표(이름 있는 건물·자연 · 아이 집) — 캔버스 한 장씩(스무 개 안팎)
    for (const p of PLACES) { if (p.school) continue; const t = (p.home ? '🏠 ' : '') + nameOf(p); const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = '800 44px sans-serif'; const w = Math.ceil(g.measureText(t).width) + 40; c.width = w; c.height = 72;
      g.font = '800 44px sans-serif'; g.fillStyle = p.nat ? 'rgba(40,90,60,.88)' : 'rgba(29,53,87,.9)'; const r = 30; g.beginPath(); g.moveTo(r, 4); g.arcTo(w - 4, 4, w - 4, 68, r); g.arcTo(w - 4, 68, 4, 68, r); g.arcTo(4, 68, 4, 4, r); g.arcTo(4, 4, w - 4, 4, r); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, w / 2, 38);
      const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; const sp = new T3.Sprite(new T3.SpriteMaterial({ map: tx, depthWrite: false })); const B9 = BLD.find(b => b.b.id === p.id);
      const top = B9 ? B9.y0 + B9.h * (B9.kind === 'fire' ? 1.6 : 1) + 4 : p.prop ? ty(p.x, p.z) + 7.5 : ty(p.x, p.z) + (p.kind === 'hill' ? ((L.nature.find(n => n.id === p.id) || {}).h || 2) * S + 6 : 5);
      sp.position.set(p.x, top, p.z); sp.scale.set(w / 72 * 3.2, 3.2, 1); sp.userData.fx = 1; group.add(sp); LABELS.push(sp); }
  }

  // ───────── 숫자(판 비교 — 개발 전후: 나무 · 논밭 넓이 · 건물 · 물 · 길) ─────────
  function stats() {
    const cell = G * G; let water = 0, hill = 0; for (let k = 0; k < NN; k++) { if (WK[k]) water += cell; if (HF[k] > 2) hill += cell; }
    const area = sub => L.nature.filter(n => n.k === 'field' && (n.sub || 'grass') === sub).reduce((a, n) => { const sh = shapeOf(n); if (!sh) return a; const bb = bboxOf(sh); return a + (sh.rect ? (bb[2] - bb[0]) * (bb[3] - bb[1]) : polyArea(sh.poly)); }, 0);
    const forest = L.nature.filter(n => n.k === 'forest').reduce((a, n) => { const sh = shapeOf(n); if (!sh) return a; const bb = bboxOf(sh); return a + (sh.rect ? (bb[2] - bb[0]) * (bb[3] - bb[1]) : polyArea(sh.poly)); }, 0);
    const byG = g => BLD.filter(b => (KIND[b.kind] || {}).g === g).length; let road = 0; for (const s of RSEG) road += Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
    const PP = { house: 4, apt: 10, ...(D.pop || {}) }, pop = BLD.reduce((a, b) => a + (b.kind === 'house' ? PP.house : b.kind === 'apt' ? PP.apt * Math.max(1, Math.round(b.h / 3.3)) : 0), 0);   // 인구 어림(집 1채 4명 · 아파트 한 층 10명 — 선생님과 정하는 값 D.pop)
    return { pop, trees: TREES.round.length + TREES.pine.length + TREES.poplar.length, rice: area('rice'), farm: area('farm'), orchard: area('orchard'), park: area('park') + area('grass'), forest, water, hill, live: byG('live'), work: byG('work'), pub: byG('pub'), road };
  }
  const polyArea = P => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return Math.abs(a / 2); };

  // ───────── 세상 잇기: 학교 밖 끄기 + 땅 높이 · 경계 = 매트 넓이 ─────────
  const OUT = map.world.outside({ clip: 0.6, terrain: (x, z) => inSchool(x, z) ? null : (x < TX0 || x > TX1 || z < TZ0 || z > TZ1) ? TY : TY + tH(x, z) });
  map.arena.set({ rect: [TX0 + 3, TZ0 + 3, TX1 - 3, TZ1 - 3], msg: '🏘 여기가 마을 끝이에요', ymin: TY - 6, ymax: TY + Math.max(12, ...Object.values(D.layers).flatMap(l => (l.nature || []).filter(n => n.k === 'hill').map(n => (n.h || 2) * S * 1.2 + 12))) });   // 뒷산 꼭대기까지 오를 수 있게
  map.minimap.hide();
  await build(); if (map.gone) return {};
  { const P = [], C = [], N = [], R = rng0(77), n = 46, r0 = 286;   // 먼 산 능선(둘레 한 바퀴 · 안개 색에 가까운 푸른빛 — 멀리 갈수록 연하게)
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, w = 0.16 + R() * 0.12, hgt = 16 + R() * 34 + (Math.sin(a * 3) + 1) * 6, back = R() < 0.5, rr = r0 + (back ? 8 : 0), col = back ? [0.62, 0.74, 0.78] : [0.5, 0.66, 0.62];
      const pts = 5; for (let k = 0; k < pts; k++) { const a0 = a - w + 2 * w * k / pts, a1 = a - w + 2 * w * (k + 1) / pts, h0 = hgt * Math.sin(Math.PI * k / pts) ** 0.8, h1 = hgt * Math.sin(Math.PI * (k + 1) / pts) ** 0.8;
        const p0 = [Math.sin(a0) * rr, -8, Math.cos(a0) * rr], p1 = [Math.sin(a1) * rr, -8, Math.cos(a1) * rr], q0 = [p0[0], h0, p0[2]], q1 = [p1[0], h1, p1[2]];
        for (const v of [p0, q1, p1, p0, q0, q1]) { P.push(...v); N.push(0, 1, 0); const t = Math.max(0, v[1]) / 60; C.push(col[0] * (1 - t * 0.15), col[1] * (1 - t * 0.12), col[2] * (1 - t * 0.05)); } } }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); GEOS.push(g);
    MAT.ring = new T3.MeshBasicMaterial({ vertexColors: true, fog: false, side: T3.DoubleSide }); MATS.push(MAT.ring); RING = new T3.Mesh(g, MAT.ring); RING.frustumCulled = false; RING.userData.fx = 1; RING.renderOrder = -1; map.add(RING); }
  const applyTime = (e) => { const k = typeof e === 'string' ? e : (e && (e.k || e.key || e.time)) || (map.time && map.time()) || 'day', night = k === 'night', dusk = k === 'sunset';
    MAT.glass.emissive.setHex(night ? 0xb8862e : dusk ? 0x3a2810 : 0x000000); MAT.lamp.color.setHex(night ? 0xffffff : dusk ? 0xece4cc : 0xb4b4b4); if (MAT.ring) MAT.ring.color.setScalar(night ? 0.32 : dusk ? 0.78 : 1); NIGHT9 = night ? 1 : dusk ? 0.5 : 0; applySignNight(); if (LIFE) LIFE.night(NIGHT9); };
  map.on('time', applyTime); applyTime(map.time && map.time());

  // ───────── 2D 마을 지도(지도 단원: 방위표 · 축척 막대 · 범례 · 기호 · 높낮이 색) — 작은 지도 + 큰 지도(M) ─────────
  const mini = document.createElement('canvas'), miniBox = document.createElement('div');
  miniBox.className = 'twn-mini ttl-keep'; miniBox.style.cssText = 'position:fixed;right:10px;top:46px;z-index:21;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.35);border:3px solid #fffdf6;cursor:pointer;background:#cfe6c0';
  mini.width = 264; mini.height = Math.round(264 * (TZ1 - TZ0) / (TX1 - TX0)); mini.style.cssText = 'display:block;width:264px;height:' + mini.height + 'px'; miniBox.appendChild(mini); document.body.appendChild(miniBox);
  miniBox.onclick = () => openBig();
  const SYM = { live: ['#e0453a', '사는 곳', 'Homes'], work: ['#f2c230', '일하는 곳', 'Work'], pub: ['#2f4a8a', '모두가 쓰는 곳', 'Public'], nat: ['#4f9e4a', '자연', 'Nature'] };
  function drawTownMap(ctx, o) {   // o = {x0, z0, sc(px/m), w, h, legend, symbols, me, route}
    const { x0, z0, sc, w, h } = o, P = (x, z) => [(x - x0) * sc, (z - z0) * sc];
    ctx.fillStyle = '#d7ebc4'; ctx.fillRect(0, 0, w, h);
    // 높낮이 색(등고 단계 · 낮은 땅 연두 → 언덕 노랑 → 산 갈색) + 물
    const st = Math.max(1, Math.round(2 / sc)); for (let j = 0; j < NZ - 1; j += st) for (let i = 0; i < NX - 1; i += st) { const k = j * NX + i, hh = HF[k], [px, pz] = P(nx(i), nz(j)), sz = G * sc * st + 1;
      if (px > w || pz > h || px + sz < 0 || pz + sz < 0) continue; if (inRect(nx(i) + G / 2, nz(j) + G / 2)) continue;
      ctx.fillStyle = WK[k] ? '#6fc3dc' : hh > 24 ? '#b98f5a' : hh > 14 ? '#d6b56a' : hh > 6 ? '#e9da86' : hh > 1.5 ? '#cfe3a0' : '#d7ebc4'; ctx.fillRect(px, pz, sz, sz); }
    // 들·숲 기호
    ctx.save(); for (const it of L.nature) { const sh = shapeOf(it); if (!sh || it.k === 'hill' || it.k === 'water') continue; const bb = bboxOf(sh), [a, b] = P(bb[0], bb[1]), [c, d] = P(bb[2], bb[3]);
      const sub = it.k === 'forest' ? 'forest' : it.sub || 'grass'; ctx.fillStyle = { forest: 'rgba(60,130,70,.45)', rice: 'rgba(150,200,120,.55)', farm: 'rgba(170,130,90,.5)', orchard: 'rgba(160,210,110,.5)', park: 'rgba(120,200,110,.5)', grass: 'rgba(160,210,120,.45)' }[sub] || 'rgba(0,0,0,0)';
      ctx.fillRect(a, b, c - a, d - b); if (o.symbols && c - a > 18) { ctx.fillStyle = 'rgba(30,70,40,.85)'; ctx.font = '700 ' + Math.max(9, Math.min(16, sc * 9)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const s9 = { forest: '♣', rice: 'ıı', farm: 'ㅛ', orchard: 'ⓞ', park: '♣', grass: '⺾' }[sub] || ''; for (let y = b + 10; y < d - 4; y += 18) for (let x = a + 10; x < c - 4; x += 20) ctx.fillText(s9, x, y); } }
    ctx.restore();
    // 구역(색종이 — 용도 지역처럼 반투명)
    for (const zn of L.zones || []) { const sh = shapeOf(zn); if (!sh || sh.line) continue; ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#' + (COL[zn.c || (ZCOL[zn.k] || ['red'])[0]] ?? 0xe0453a).toString(16).padStart(6, '0');
      ctx.beginPath(); const pts = sh.rect ? [[sh.rect[0], sh.rect[1]], [sh.rect[2], sh.rect[1]], [sh.rect[2], sh.rect[3]], [sh.rect[0], sh.rect[3]]] : sh.poly; pts.forEach((q, i) => { const [a, b] = P(q[0], q[1]); if (i) ctx.lineTo(a, b); else ctx.moveTo(a, b); }); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 0.8; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5; ctx.strokeStyle = ctx.fillStyle; ctx.stroke(); ctx.restore(); }
    // 아이 이름표 칸(점선 테두리 · 이름은 아래 장소 기호와 함께)
    for (const A of AREAS) { ctx.save(); ctx.strokeStyle = 'rgba(106,61,154,.85)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.6; for (const r of A.R) { const [a, b] = P(r[0], r[1]), [c, d] = P(r[2], r[3]); ctx.strokeRect(a + 2, b + 2, c - a - 4, d - b - 4); } ctx.restore(); }
    // 길
    for (const s of RSEG) { const [a, b] = P(s.a[0], s.a[1]), [c, d] = P(s.b[0], s.b[1]); ctx.lineCap = 'round'; ctx.strokeStyle = '#8a8f95'; ctx.lineWidth = Math.max(1.6, s.hw * 2 * sc + 2); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke();
      ctx.strokeStyle = '#f7f6f2'; ctx.lineWidth = Math.max(1, s.hw * 2 * sc - 1); ctx.stroke(); }
    // 건너는 곳: 다리(큰길 저절로 = 회색 · 아이 다리 = 갈색) · 다리 없는 곳 = 물이 길을 끊음(파랑) · 아이 소품(걷는 다리·산책로·주차장)
    for (const X9 of XCROSS) { const s9 = X9.s, f = t => [s9.a[0] + (s9.b[0] - s9.a[0]) * t / s9.L0, s9.a[1] + (s9.b[1] - s9.a[1]) * t / s9.L0], [a, b] = P(...f(X9.t0)), [c, d] = P(...f(X9.t1));
      ctx.lineCap = 'butt'; ctx.lineWidth = Math.max(2, s9.hw * 2 * sc + (X9.br ? 3 : 2)); ctx.strokeStyle = X9.br === 'kid' ? '#8a5a36' : X9.br ? '#6b7178' : '#6fc3dc'; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
    for (const Pp of PROPS) { if (Pp.built) { const [a, b] = P(...Pp.built[0]), [c, d] = P(...Pp.built[1]); ctx.lineCap = 'butt'; ctx.strokeStyle = '#8a5a36'; ctx.lineWidth = Math.max(2, 2.4 * sc + 1); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
      if (Pp.k === 'trail') { ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = '#a77b4f'; ctx.lineWidth = Math.max(1.5, Pp.w * sc); ctx.beginPath(); Pp.pts.forEach((q, i) => { const [a, b] = P(q[0], q[1]); if (i) ctx.lineTo(a, b); else ctx.moveTo(a, b); }); ctx.stroke(); ctx.restore(); }
      if (Pp.k === 'parking') { const [a, b] = P(Pp.x, Pp.z); ctx.save(); ctx.translate(a, b); ctx.rotate(-Pp.ry); ctx.fillStyle = '#8a8f95'; ctx.fillRect(-Pp.w * sc / 2, -Pp.d * sc / 2, Pp.w * sc, Pp.d * sc); ctx.rotate(Pp.ry); ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.max(9, Math.min(14, Pp.d * sc * 0.8)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', 0, 1); ctx.restore(); } }
    // 학교(학교 지도 그대로 제자리에)
    { const [a, b] = P(SR[0], SR[1]); ctx.save(); ctx.beginPath(); ctx.rect(a, b, (SR[2] - SR[0]) * sc, (SR[3] - SR[1]) * sc); ctx.clip(); try { map.drawMap(ctx, { floor: 1, scale: sc, x0: x0, z0: z0, labels: false, player: false }); } catch (e) { /* */ } ctx.restore(); }
    // 건물(색 = 색 규칙 묶음 · 매트 색 그대로면 매트와 견주기 쉬움)
    for (const B9 of BLD) { if (B9.kind === 'green') continue; ctx.save(); const [px, pz] = P(B9.cx, B9.cz); ctx.translate(px, pz); ctx.rotate(-B9.ry); ctx.fillStyle = '#' + (COL[B9.b.c] ?? 0xcccccc).toString(16).padStart(6, '0'); ctx.strokeStyle = B9.gen ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.6)'; ctx.lineWidth = B9.gen ? 0.6 : 1.4; if (B9.gen) ctx.globalAlpha = 0.55;
      ctx.fillRect(-B9.w * sc / 2, -B9.d * sc / 2, B9.w * sc, B9.d * sc); ctx.strokeRect(-B9.w * sc / 2, -B9.d * sc / 2, B9.w * sc, B9.d * sc); ctx.restore(); }
    for (const B9 of BLD) if (B9.kind === 'green') { const [px, pz] = P(B9.cx, B9.cz); ctx.fillStyle = '#3f8a3c'; ctx.beginPath(); ctx.arc(px, pz, Math.max(2, B9.w * sc * 0.45), 0, 7); ctx.fill(); }
    // 장소 기호 + 이름
    const USED = [], free9 = (x, y, w9, h9) => { if (USED.some(u => x < u[0] + u[2] && x + w9 > u[0] && y < u[1] + u[3] && y + h9 > u[1])) return false; USED.push([x, y, w9, h9]); return true; };   // 이름표끼리 겹치면 뒤엣것은 기호만
    if (o.symbols) for (const p of PLACES) { if (p.school) continue; const [px, pz] = P(p.x, p.z); if (px < -20 || pz < -20 || px > w + 20 || pz > h + 20) continue;
      if (!p.nat) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, pz, 11, 0, 7); ctx.fill(); ctx.strokeStyle = '#1d3557'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#1d3557'; ctx.font = '800 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.sym || p.icon, px, pz + 1); }
      ctx.font = '800 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.9)'; const t = (p.ai ? '✨' : '') + nameOf(p), tw = ctx.measureText(t).width, ty9 = pz + (p.nat ? -6 : 13);
      if (free9(px - tw / 2 - 2, ty9, tw + 4, 14)) { ctx.strokeText(t, px, ty9); ctx.fillStyle = '#1d2b3a'; ctx.fillText(t, px, ty9); } }
    if (o.symbols) for (const lb of L.labels || []) { const [px, pz] = P(X(lb.x), Z(lb.y)), t = LANG === 'en' ? (lb.en || lb.t) : lb.t; ctx.font = '900 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.strokeText(t, px, pz); ctx.fillStyle = '#2b5a3a'; ctx.fillText(t, px, pz); }
    // 격자 주소(매트 10cm 칸 — 가로 A·B·C… · 세로 1·2·3… — '○○ 구역에 넣어 줘'가 정확한 자리로)
    if (o.grid) { ctx.save(); ctx.strokeStyle = 'rgba(40,60,90,.35)'; ctx.lineWidth = 1; ctx.font = '800 11px sans-serif'; ctx.fillStyle = 'rgba(20,40,70,.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const XL = [0, ...GXS, MSZ.w], YL = [0, ...GYS, MSZ.h], gc = Math.min(...XL.slice(1).map((v, i) => v - XL[i])); ctx.font = '900 ' + Math.min(18, Math.max(11, gc * S * sc * 0.28)) + 'px sans-serif';
      XL.forEach((v, c) => { const [px] = P(X(v), 0); ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke(); if (c < XL.length - 1) { const [m] = P(X((v + XL[c + 1]) / 2), 0); ctx.fillText(colName(c), m, 10); ctx.fillText(colName(c), m, h - 10); } });
      YL.forEach((v, r) => { const [, pz] = P(0, Z(v)); ctx.beginPath(); ctx.moveTo(0, pz); ctx.lineTo(w, pz); ctx.stroke(); if (r < YL.length - 1) { const [, m] = P(0, Z((v + YL[r + 1]) / 2)); ctx.fillText(rowName(r), 12, m); ctx.fillText(rowName(r), w - 12, m); } });
      ctx.restore(); }
    // 길 안내 선
    const R9 = o.route; if (R9 && R9.pts) { ctx.strokeStyle = '#ff5a36'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.beginPath(); R9.pts.forEach((p, i) => { const [a, b] = P(p[0], p[1]); if (i) ctx.lineTo(a, b); else ctx.moveTo(a, b); }); ctx.stroke(); ctx.setLineDash([]); }
    // 나
    if (o.me) { const me = map.player.get(), [px, pz] = P(me.x, me.z), hh = me.h || 0; ctx.save(); ctx.translate(px, pz); ctx.rotate(-hh); ctx.fillStyle = '#2f6fd0'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6.5, 7); ctx.lineTo(0, 3.5); ctx.lineTo(-6.5, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // 방위표 · 축척 막대 · 범례
    if (o.legend) {
      ctx.save(); ctx.translate(w - 44, 46); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fill(); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(7, 0); ctx.lineTo(-7, 0); ctx.fill(); ctx.fillStyle = '#34495e'; ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(7, 0); ctx.lineTo(-7, 0); ctx.fill();
      ctx.font = '900 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1d2b3a'; const DIR = LANG === 'en' ? ['N', 'S', 'E', 'W'] : ['북', '남', '동', '서']; ctx.fillText(DIR[0], 0, -30 + 0); ctx.fillText(DIR[1], 0, 30); ctx.fillText(DIR[2], 28, 0); ctx.fillText(DIR[3], -28, 0); ctx.restore();
      const m100 = [50, 100, 200, 500].find(v => v * sc > 70) || 500, bw = m100 * sc; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(12, h - 50, bw + 130, 40); ctx.fillStyle = '#1d2b3a'; ctx.fillRect(22, h - 30, bw / 2, 7); ctx.strokeStyle = '#1d2b3a'; ctx.strokeRect(22, h - 30, bw, 7);
      ctx.font = '700 12px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('0', 18, h - 32); ctx.fillText(m100 + ' m', 18 + bw - 10, h - 32); ctx.fillText(LANG === 'en' ? '1:500 (1cm = 5m)' : '1:500 (판 1cm = 5m)', 22 + bw + 14, h - 20);
      const items = Object.values(SYM), lh = 20, lx = o.grid ? 30 : 12, ly = o.grid ? 26 : 12; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(lx, ly, 178, lh * (items.length + 5) + 14); ctx.font = '800 13px sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#1d2b3a'; ctx.fillText(LANG === 'en' ? 'Legend' : '범례', lx + 10, ly + 14);
      items.forEach(([c, ko, en], i) => { ctx.fillStyle = c; ctx.fillRect(lx + 10, ly + 26 + i * lh, 16, 12); ctx.fillStyle = '#1d2b3a'; ctx.font = '700 12px sans-serif'; ctx.fillText(LANG === 'en' ? en : ko, lx + 34, ly + 32 + i * lh); });
      [['#6fc3dc', '물', 'Water'], ['#d6b56a', '언덕·산', 'Hills'], ['ıı', '논', 'Rice'], ['ㅛ', '밭', 'Farm'], ['♣', '숲·공원', 'Woods']].forEach(([c, ko, en], i) => { const y = ly + 32 + (items.length + i) * lh; if (c[0] === '#') { ctx.fillStyle = c; ctx.fillRect(lx + 10, y - 6, 16, 12); } else { ctx.fillStyle = '#2b5a3a'; ctx.font = '800 13px sans-serif'; ctx.fillText(c, lx + 12, y); }
        ctx.fillStyle = '#1d2b3a'; ctx.font = '700 12px sans-serif'; ctx.fillText(LANG === 'en' ? en : ko, lx + 34, y); }); }
  }
  let GRID = !!params.plan;
  const miniSc = mini.width / (TX1 - TX0); let miniBg = null;
  function drawMini() { const g = mini.getContext('2d'); if (mapDirty || !miniBg) { drawTownMap(g, { x0: TX0, z0: TZ0, sc: miniSc, w: mini.width, h: mini.height }); miniBg = g.getImageData(0, 0, mini.width, mini.height); mapDirty = false; } else g.putImageData(miniBg, 0, 0);
    if (routeNow && routeNow.pts) { g.strokeStyle = '#ff5a36'; g.lineWidth = 2.5; g.beginPath(); routeNow.pts.forEach((p, i) => { const a = (p[0] - TX0) * miniSc, b = (p[1] - TZ0) * miniSc; if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.stroke(); }
    const me = map.player.get(), px = (me.x - TX0) * miniSc, pz = (me.z - TZ0) * miniSc; g.fillStyle = '#2f6fd0'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(px, pz, 4.5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.88)'; g.fillRect(mini.width - 22, 4, 18, 18); g.fillStyle = '#c0392b'; g.font = '900 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(LANG === 'en' ? 'N' : '북', mini.width - 13, 13); }

  // ───────── 화면(칩 · 창) ─────────
  const css = document.createElement('style'); css.textContent = `
.twn-p{position:fixed;inset:0;z-index:44;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.5);font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif}
.twn-p .bx{background:#fffdf6;color:#1d2b3a;border-radius:16px;border:3px solid #2b5a3a;box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:94vw;max-height:92vh;overflow:auto;box-sizing:border-box;padding:14px 16px}
.twn-p h3{margin:0 0 8px;font-size:20px}.twn-p .sm{font-size:13px;color:#56606b}.twn-p button{font:inherit;font-weight:800;border:0;border-radius:10px;padding:8px 14px;min-height:40px;background:#2b5a3a;color:#fff;cursor:pointer}
.twn-p button.sub{background:#e7efe3;color:#1d2b3a}.twn-p .row{display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap}
.twn-p .pl{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px;margin-top:8px}.twn-p .pl>div{display:flex;align-items:center;gap:6px;background:#eef5ea;border-radius:10px;padding:6px 8px;font-size:14px;font-weight:700}
.twn-p .pl>div span{flex:1}.twn-p .pl button{min-height:34px;padding:4px 9px;font-size:13px}.twn-p .grp{margin-top:10px;font-weight:900;font-size:14px}
.twn-p table{border-collapse:collapse;margin-top:8px;font-size:14px}.twn-p td,.twn-p th{border-bottom:1px solid #dfe6da;padding:5px 10px;text-align:right}.twn-p td:first-child,.twn-p th:first-child{text-align:left}
.twn-p .st{display:flex;gap:12px;align-items:center;margin:7px 0;padding:8px 10px;border-radius:12px;background:#eef5ea;font-size:16px;line-height:1.4}.twn-p .st b.n{flex:none;width:42px;height:42px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:24px}
.twn-p .ai{background:#fff7d6;border-radius:10px;padding:7px 10px;margin:5px 0;font-size:14px;display:flex;gap:8px;align-items:center}.twn-p .ai span{flex:1}
`; document.head.appendChild(css);
  let panel = null, keyDn = null;
  const closeP = () => { if (panel) { panel.remove(); panel = null; } bigOpen = false; };
  function openP(html, wide) { closeP(); document.exitPointerLock?.(); panel = document.createElement('div'); panel.className = 'twn-p ttl-keep'; panel.innerHTML = '<div class="bx" style="' + (wide ? 'width:min(1100px,96vw)' : 'width:min(640px,94vw)') + '">' + html + '</div>';
    panel.addEventListener('click', e => { if (e.target === panel) closeP(); }); for (const t of ['keydown', 'keyup']) panel.addEventListener(t, e => e.stopPropagation()); document.body.appendChild(panel); return panel; }
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function openBig() {
    const P9 = openP('<h3>' + (planMode ? '📐 읽은 도면 확인 — ' : '🗺 ') + esc(LANG === 'en' ? (D.en || D.title) : D.title) + ' — ' + esc(LANG === 'en' ? (L.en || L.name) : L.name) + '</h3>' + (planMode ? '<div class="sm" style="margin-bottom:6px">사진을 이렇게 읽었어요 — 판과 다른 곳(✨ AI가 채운 빈칸 포함)을 찾아 알려 주면 짓기 전에 고쳐요</div>' : '') + '<canvas class="twn-big" style="display:block;margin:0 auto;max-width:100%;border-radius:10px;cursor:crosshair"></canvas><div class="sm" style="margin-top:6px">장소 기호를 누르면 길을 보여 줘요 · ✨ = AI가 채운 빈칸 · 빨간 점선 = 길 안내 · 내 자리 격자: <b class="twn-cell"></b></div><div class="row"><button class="sub" data-a="g">' + (GRID ? '▦ 격자 주소 끄기' : '▦ 격자 주소 보기') + '</button><button class="sub" data-a="x">' + (planMode ? '▶ 이대로 걸어 보기' : '닫기(M)') + '</button></div>', true);
    bigOpen = true; const cv = P9.querySelector('canvas'), W9 = Math.round(Math.min(1060, innerWidth * 0.92, (innerHeight * 0.92 - 150) * (TX1 - TX0) / (TZ1 - TZ0))), sc = W9 / (TX1 - TX0), H9 = Math.round((TZ1 - TZ0) * sc); cv.width = W9; cv.height = H9;
    const draw = () => { drawTownMap(cv.getContext('2d'), { x0: TX0, z0: TZ0, sc, w: W9, h: H9, legend: true, symbols: true, me: true, route: routeNow, grid: GRID }); const me = map.player.get(), ce = P9.querySelector('.twn-cell'); if (ce) ce.textContent = inSchool(me.x, me.z) ? '학교 안' : cellOf(me.x, me.z); }; draw();
    P9.querySelector('[data-a="g"]').onclick = () => { GRID = !GRID; openBig(); };
    cv.onclick = e => { const r = cv.getBoundingClientRect(), x = TX0 + (e.clientX - r.left) * (W9 / r.width) / sc, z = TZ0 + (e.clientY - r.top) * (H9 / r.height) / sc; let best = null, bd = 18 / sc; for (const p of PLACES) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p; } } if (best) { showRoute(best); draw(); } };
    P9.querySelector('[data-a="x"]').onclick = () => { planMode = false; closeP(); };
  }
  let planMode = !!params.plan;
  const fmtT = s => s >= 60 ? Math.floor(s / 60) + '분 ' + Math.round(s % 60) + '초' : Math.round(s) + '초';
  let trailH = null;
  function showRoute(p) {
    const me = map.player.get(), R9 = route([me.x, me.z], p.door);
    if (trailH) { trailH.remove(); trailH = null; }
    if (!R9.ok) { routeNow = null; map.hud.goal(R9.reason === 'cut' ? '🚧 ' + nameOf(p) + '까지 길이 이어져 있지 않아요 — 판에서 길을 이어 볼까요?' : '🚧 가까운 길이 없어요'); return R9; }
    routeNow = { ...R9, to: p }; trailH = map.mk.trail(R9.pts.map(q => [q[0], ty(q[0], q[1]) + 0.35, q[1]]), { color: 0xff5a36, width: 0.7 });
    map.hud.goal('🧭 ' + p.icon + ' ' + nameOf(p) + '까지 ' + Math.round(R9.len) + ' m · 🚶 ' + fmtT(R9.len / 1.2) + ' · 🚲 ' + fmtT(R9.len / 4.5));   // 걷기 1.2m/s · 자전거 4.5m/s(실제 빠르기 — 어림 활동)
    return R9;
  }
  function openFind() {
    const grp = { pub: [], work: [], live: [], nat: [] }; for (const p of PLACES) grp[p.nat ? 'nat' : (KIND[p.kind] || {}).g || 'pub'].push(p);
    const row = p => '<div><span>' + esc(p.icon) + ' ' + esc(nameOf(p)) + (p.school ? '' : ' <small style="color:#56606b">' + esc(cellOf(p.x, p.z)) + '</small>') + (p.ai ? ' <span title="AI가 채운 빈칸">✨</span>' : '') + '</span><button class="sub" data-r="' + esc(p.id) + '">🧭 길</button><button data-b="' + esc(p.id) + '">🚌 가기</button></div>';
    const P9 = openP('<h3>🔎 장소 찾기</h3><div class="sm">🧭 길 = 길을 따라 빨간 선 · 거리와 걸리는 시간 · 🚌 가기 = 버스를 타고 그 앞으로</div>' + [['pub', '🏛 모두가 쓰는 곳'], ['work', '🏪 일하는 곳'], ['live', '🏠 사는 곳'], ['nat', '🌳 자연']].filter(([k]) => grp[k].length).map(([k, t]) => '<div class="grp">' + t + '</div><div class="pl">' + grp[k].map(row).join('') + '</div>').join('') + '<div class="row"><button class="sub" data-a="x">닫기(F)</button></div>');
    P9.onclick = async e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') return closeP(); const p = PLACES.find(q => q.id === (b.dataset.r || b.dataset.b)); if (!p) return; closeP();
      if (b.dataset.r) showRoute(p); else busTo(p); };
  }
  async function busTo(p) { const f = map.fade(1.1, '#fffbe8'); await new Promise(r => setTimeout(r, 520)); if (dead) return; const [x, z] = p.door, dx = p.x - x, dz = p.z - z; map.player.teleport([x, ty(x, z) + 0.05, z]); map.player.lookAt([p.x, p.z]); void dx; void dz; map.hud.toast('🚌 ' + nameOf(p) + ' 앞이에요', 2.4); if (trailH) { trailH.remove(); trailH = null; } routeNow = null; await f; }
  function openNums() {
    const cur = STATS, rows = [['👪 사는 사람(어림 · 명)', 'pop', 1], ['🌳 나무(그루)', 'trees', 1], ['🌾 논(㎡)', 'rice', 1], ['🥬 밭(㎡)', 'farm', 1], ['🍎 과수원(㎡)', 'orchard', 1], ['🌲 숲(㎡)', 'forest', 1], ['🌼 공원·풀밭(㎡)', 'park', 1], ['💧 물(㎡)', 'water', 1], ['⛰ 언덕·산(㎡)', 'hill', 1], ['🏠 사는 곳(채)', 'live', 1], ['🏪 일하는 곳(채)', 'work', 1], ['🏛 모두가 쓰는 곳(채)', 'pub', 1], ['🛣 길(m)', 'road', 1]];
    const others = LAYERS.filter(l => l !== LID); let cmp = null; if (others.length) { const keep = L; L = resolve(others[0]); prepRoads(); buildTerrainOnly(); prepBlocksCount(); cmp = { name: L.name, s: statsLite() }; L = keep; prepRoads(); buildTerrain(); prepBlocks(); }
    const f = v => Math.round(v).toLocaleString('ko-KR');
    openP('<h3>📊 마을 숫자 — ' + esc(L.name) + '</h3><div class="sm">같은 땅의 다른 판과 견줘 봐요 — 무엇이 늘고 무엇이 사라졌나요? 왜 그렇게 바뀌었을까요?</div><table><tr><th></th><th>' + esc(L.name) + '</th>' + (cmp ? '<th>' + esc(cmp.name) + '</th><th>차이</th>' : '') + '</tr>' + rows.map(([t, k]) => '<tr><td>' + t + '</td><td>' + f(cur[k]) + '</td>' + (cmp ? '<td>' + f(cmp.s[k]) + '</td><td>' + (cur[k] - cmp.s[k] > 0 ? '+' : '') + f(cur[k] - cmp.s[k]) + '</td>' : '') + '</tr>').join('') + '</table><div class="sm" style="margin-top:6px">나무 수는 이 마을에 그려진 나무를 센 것 · 넓이는 매트 크기 × 축척(1cm = 5m)으로 잰 것</div><div class="row"><button class="sub" data-a="x">닫기</button></div>');
    panel.querySelector('[data-a="x"]').onclick = closeP;
  }
  // 판 비교용(그리지 않고 세기만)
  function buildTerrainOnly() { buildTerrain(); }
  function prepBlocksCount() { prepBlocks(); for (const k in TREES) TREES[k].length = 0; const tmp = BK; drawNatureCountOnly(); }
  function drawNatureCountOnly() { const keepBK = new Map(BK); drawNature(); for (const B9 of BLD) if (B9.kind === 'green' || B9.kind === 'park') { /* 나무만 셈 */ const R = rng0(hashS(B9.b.id || '' + B9.cx)); const n = Math.max(1, Math.round(B9.w * B9.d / 45)); for (let i = 0; i < n; i++) TREES.round.push({}); } BK.clear(); for (const [k, v] of keepBK) BK.set(k, v); FBK.clear(); }
  function statsLite() { const s = stats(); for (const k in TREES) TREES[k].length = 0; return s; }
  function openRec() {   // 📋 기록 — 아이가 놓은 것 / Claude가 구역에 채운 것 / 아이가 요구한 것 / AI가 어림한 것(섞이지 않게 · 2027 연구 자료)
    const kids = BLD.filter(b => !b.gen), kn = k => (KIND[k] || {}).ko || k, cnt = A => Object.entries(A).map(([k, v]) => kn(k) + ' ' + v).join(' · ');
    const byK = {}; for (const b of kids) byK[b.kind] = (byK[b.kind] || 0) + 1;
    const ZK = { live: '사는 곳', work: '일하는 곳', green: '공원·들' }, DN = { dense: '빽빽하게', normal: '보통', sparse: '듬성듬성' };
    const fac = (L.fac || []).filter(f => !f.ai), sec = (t, body) => '<div class="grp">' + t + '</div>' + body;
    openP('<h3>📋 기록 — 누가 만든 것인가요?</h3><div class="sm">아이들이 정한 것과 Claude가 채운 것을 나눠 적어요(섞이지 않게)</div>'
      + sec('🧱 아이가 놓은 블록 ' + kids.length + '개', '<div class="ai" style="background:#eef5ea"><span>' + (cnt(byK) || '없음') + (kids.some(b => b.name) ? '<br>이름: ' + kids.filter(b => b.name).map(b => esc(b.name)).join(' · ') : '') + '</span></div>')
      + sec('🏘 Claude가 구역에 채운 건물 ' + BLD.filter(b => b.gen).length + '채', (ZFILL.length ? ZFILL.map(z => '<div class="ai" style="background:#eef2fb"><span>' + (z.k === 'land' ? esc(z.cell) + ' 칸(아이 블록 사이) — 조경: ' + (Object.entries(z.n).filter(([, v]) => v).map(([k, v]) => k + ' ' + v).join(' · ') || '없음') : esc(ZK[z.k] || z.k) + ' 구역(' + esc(DN[z.dens] || z.dens) + (z.note ? ' · 「' + esc(z.note) + '」' : '') + ') → ' + (cnt(z.n) ? cnt(z.n) + (z.around ? ' (아이 블록 둘레는 비움)' : '') : (z.k === 'green' ? '공원·들로 꾸밈' : '채울 자리가 없었어요'))) + '</span></div>').join('') : '<div class="sm">구역(색종이)이 없어요</div>'))
      + sec('🧱 아이가 놓은 종이 소품 ' + PROPS.length + '개', (() => { const c9 = {}; for (const P of PROPS) { const k9 = P.card ? '그림 카드 「' + P.label + '」' : PROPK[P.k].ko; c9[k9] = (c9[k9] || 0) + 1; } const kidBr = XCROSS.filter(X9 => X9.br === 'kid').length + PROPS.filter(P => P.built).length, autoBr = XCROSS.filter(X9 => X9.br === 'auto').length, cut = XCROSS.filter(X9 => !X9.br).length;
          return '<div class="ai" style="background:#eef5ea"><span>' + (Object.entries(c9).map(([k9, v]) => esc(k9) + ' ' + v).join(' · ') || '없음') + '</span></div>' + (XCROSS.length || kidBr ? '<div class="ai" style="background:#eef5ea"><span>🌉 다리 — 아이가 놓은 다리 ' + kidBr + '곳 · 큰길에 저절로 ' + autoBr + '곳(✨) · 다리 없는 곳 ' + cut + '곳(길이 끊김 — 걸어 보면 막다른 길)</span></div>' : ''); })())
      + (AREAS.length ? sec('🧱 아이가 쓴 칸 이름표 ' + AREAS.length + '장', AREAS.map(A => '<div class="ai" style="background:#f3eefa"><span>🔖 「' + esc(A.t) + '」 ' + esc(A.cells.join('·')) + '</span></div>').join('')) : '')
      + sec('🙋 아이가 요구해서 생긴 시설 ' + fac.length, fac.length ? fac.map(f => '<div class="ai" style="background:#fdf0f4"><span>' + esc(FACK[f.k] ? FACK[f.k].ko : f.k) + (f.rule ? ' — ' + esc(RULEK[f.rule] || f.rule) : ' — 정한 자리') + (f.by ? ' · 🙋 ' + esc(f.by) : '') + (f.why ? ' · 「' + esc(f.why) + '」' : '') + '</span></div>').join('') : '<div class="sm">아직 없어요 — 둘러보고 필요한 것을 말하면 생겨요(가로등·횡단보도·벤치…)</div>')
      + '<div class="row"><button class="sub" data-a="ai">✨ AI가 어림한 것 보기</button><button class="sub" data-a="x">닫기</button></div>');
    panel.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') closeP(); else if (b.dataset.a === 'ai') openAI(); };
  }
  function openAI() {
    const list = [...(D.ai || []).map(a => ({ t: a.t, at: a.at ? [X(a.at[0]), Z(a.at[1])] : null }))];
    for (const it of [...L.blocks, ...L.nature]) if (it.ai) { const p = PLACES.find(q => q.id === it.id); const sh = it.x != null ? null : shapeOf(it); const bb = sh ? bboxOf(sh) : null;
      list.push({ t: (it.name ? '「' + it.name + '」 ' : (KIND[kindOf(it)] || {}).ko ? '(' + (it.x != null ? (KIND[kindOf(it)] || {}).ko : '') + ') ' : '') + it.ai, at: p ? [p.x, p.z] : it.x != null ? [X(it.x), Z(it.y)] : bb ? [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2] : null }); }
    for (const A of AREAS) list.push({ t: '🔖 「' + A.t + '」(' + A.cells.join('·') + ') → ' + (A.ai || ([...A.st].map(k9 => STYK[k9] || k9).join(' · ') || '꾸밈 낱말 없음') + '(으)로 풀었어요'), at: [A.sx, A.sz] });   // 이름표 풀이(아이들이 "이게 우리가 생각한 거 맞아?" 확인·고침)
    for (const P of PROPS) { if (P.guess) list.push({ t: '그림 카드 「' + P.label + '」 — 도감에 없는 말이라 이름 팻말로 세웠어요(모양은 어림)', at: [P.x, P.z] }); if (P.miss) list.push({ t: '이정표 「' + P.miss.join('·') + '」 — 마을에 그 이름의 장소가 없어 화살표 방향을 어림했어요', at: [P.x, P.z] }); if (P.ai) list.push({ t: '「' + P.label + '」 ' + P.ai, at: [P.x, P.z] }); }
    for (const n9 of PNOTE) list.push(n9);
    { const au = XCROSS.filter(X9 => X9.br === 'auto'); if (au.length) list.push({ t: '(큰길 다리 ' + au.length + '곳) 큰길이 강을 지나는 곳은 다리를 저절로 놓았어요 — 처음 계획 「큰길 테이프가 강을 지나는 곳 = 다리」 · 작은길은 아이가 다리를 놓아야 건너요', at: au[0].c }); }
    for (const B9 of BLD) if (!B9.gen && B9.name && !B9.b.card && !NAMEKIND.some(([re]) => re.test(B9.name))) list.push({ t: '이름 「' + B9.name + '」은 도감에 없는 말이라 색 규칙(' + ((KIND[B9.kind] || {}).ko || B9.kind) + ')으로 지었어요', at: [B9.cx, B9.cz] });
    { const bg = BLD.filter(b => b.bigGreen); if (bg.length) list.push({ t: '세운 초록 판·큰 초록 블록 ' + bg.length + '개는 큰 나무 덩어리로 읽었어요(초록 = 자연)', at: [bg[0].cx, bg[0].cz] }); }
    { const fa = (L.fac || []).filter(f => f.ai); if (fa.length) list.push({ t: '(길가 시설) 완성된 동네라 ' + fa.map(f => (FACK[f.k] || {}).ko || f.k).join('·') + '은 AI가 채웠어요 — 아이들이 더 원하는 것은 🙋 요구로 따로 적어요', at: null }); }
    if (SIGNAI) list.push({ t: '(간판 ' + SIGNAI + '개) 이름표가 없는 가게·회사의 간판 이름은 AI가 정했어요(이름표 「음식점들」 칸은 음식 이름) — 바꾸고 싶으면 알려 줘요', at: null });
    { const fz = (L.zones || []).filter(z => z.ai); if (fz.length) list.push({ t: '(빈 칸 ' + new Set(fz.map(z => z.cell || z.cellName)).size + '칸) 아이가 아무것도 놓지 않은 칸도 둘레에 맞게 동네로 채웠어요(교사 10-13 — 완성된 동네)', at: null }); }
    const RG = new Map(); for (const r of ROADS) if (r.ai) { const g = RG.get(r.ai) || { n: 0, big: 0, r }; g.n++; if (r.big) g.big++; RG.set(r.ai, g); }   // 길 어림(큰길·작은길 구분 등)은 같은 말끼리 한 줄로
    for (const [t, g] of RG) { const a = g.r.P[0], b = g.r.P[g.r.P.length - 1]; list.push({ t: '(' + (g.big === g.n ? '큰길' : g.big ? '길' : '작은길') + ' ' + g.n + '줄) ' + t, at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }); }
    const auto = ['🏘 마을 모습의 건물 모양은 판의 색 규칙(빨강·주황 = 집 · 노랑 = 가게 · 파랑 = 공공 · 흰색 = 병원)과 이름표로 정했어요', '🚪 건물 앞문은 가장 가까운 길 쪽으로 정했어요', '⛰ 쌓은 높이를 둥근 언덕으로 바꿨어요(봉우리 모양은 AI가 정함)', ...(SCHOOLB ? ['🏫 학교 칸의 블록 ' + SCHOOLB + '개는 실제 학교 모델로 대신했어요(학교 칸 = 실제 크기 · 둘레 길은 담 바깥으로)'] : []), '🌳 숲·논밭 안의 나무·벼 줄 수는 AI가 정했어요', ...(L.nature.some(n => n.bent) ? ['〰 칸 주소로 적은 강이 대각선 칸을 지날 때는 길 교차로를 피해 조금 굽혀 흐르게 했어요(다리가 길마다 하나씩)'] : []), '👪 사는 사람 수는 집 1채 = ' + ({ house: 4, apt: 10, ...(D.pop || {}) }).house + '명 · 아파트 한 층 = ' + ({ house: 4, apt: 10, ...(D.pop || {}) }).apt + '명으로 어림했어요(선생님과 정하는 값)'];
    const P9 = openP('<h3>✨ AI가 어림한 것 ' + (list.length + auto.length) + '</h3><div class="sm">판(진짜)과 다른 곳이 있나요? 찾으면 🙋 손을 들어 알려 줘요 — 판을 보고 고쳐요</div>' + list.map((a, i) => '<div class="ai"><span>✨ ' + esc(a.t) + '</span>' + (a.at ? '<button data-i="' + i + '">📍 가 보기</button>' : '') + '</div>').join('') + auto.map(t => '<div class="ai"><span>' + esc(t) + '</span></div>').join('') + '<div class="row"><button class="sub" data-a="x">닫기</button></div>');
    P9.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') return closeP(); const a = list[+b.dataset.i]; if (a && a.at) { closeP(); busTo({ name: '빈칸 자리', icon: '✨', x: a.at[0], z: a.at[1], door: [a.at[0] + 6, a.at[1] + 6] }); } };
  }
  async function setLayer(lid) { if (!D.layers[lid] || lid === LID) return; const f = map.fade(1.2, '#fffbe8'); await new Promise(r => setTimeout(r, 560)); if (dead) return; LID = lid; L = resolve(LID); await build(); if (dead) return; chips(); map.hud.banner('🗂 ' + nameOf(L), 1.8); await f; }
  function openMenu() {
    const P9 = openP('<h3>☰ 마을 메뉴</h3>' + (LAYERS.length > 1 ? '<div class="grp">🗂 판(같은 땅의 다른 모습)</div><div class="row" style="justify-content:flex-start">' + LAYERS.map(l => '<button class="' + (l === LID ? '' : 'sub') + '" data-l="' + esc(l) + '">' + esc(D.layers[l].name || l) + '</button>').join('') + '</div>' : '')
      + '<div class="grp">살펴보기</div><div class="row" style="justify-content:flex-start"><button class="sub" data-a="num">📊 마을 숫자</button><button class="sub" data-a="rec">📋 기록(누가 만든 것?)</button><button class="sub" data-a="ai">✨ AI가 어림한 것</button><button class="sub" data-a="top">🛰 하늘에서 보기</button><button class="sub" data-a="lang">🌐 ' + (LANG === 'en' ? '한국어' : 'English') + '</button><button class="sub" data-a="how">❓ 하는 법</button></div>'
      + '<div class="row"><button class="sub" data-a="quit">🏫 마을 나가기</button><button class="sub" data-a="x">닫기</button></div>');
    P9.onclick = e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a; if (b.dataset.l) { closeP(); setLayer(b.dataset.l); return; }
      if (a === 'x') closeP(); else if (a === 'num') openNums(); else if (a === 'rec') openRec(); else if (a === 'ai') openAI(); else if (a === 'how') howTo(); else if (a === 'quit') { closeP(); map.quit(); } else if (a === 'top') { closeP(); topOn(); }
      else if (a === 'lang') { LANG = LANG === 'en' ? 'ko' : 'en'; closeP(); relabel(); } };
  }
  function relabel() { for (const s of LABELS) { s.removeFromParent(); s.material.map.dispose(); s.material.dispose(); } LABELS = []; drawLabels(ROOT); mapDirty = true; chips(); }
  let topH = false, cloudsOff = [];
  const clouds = on => { if (!on) { cloudsOff = []; const sc = ROOT && ROOT.parent; if (sc) for (const o of sc.children) { const g = o.geometry; if (!g || !o.visible) continue; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox; if (bb && bb.min.y > 40 && bb.max.x - bb.min.x > 150 && bb.max.y < 200) { o.visible = false; cloudsOff.push(o); } } } else { for (const o of cloudsOff) o.visible = true; cloudsOff = []; } };   // 하늘에서 내려다볼 때 구름이 마을을 가림
  function topOn() { if (topH) return; topH = true; const me = map.player.get(); map.player.freeze(true); clouds(false); map.top.enter({ top: true, at: [me.x, me.z], d: 360, floors: false, labels: false, help: '🛰 하늘에서 본 우리 마을 — 끌기 = 옮기기 · 휠 = 확대 · Esc = 걸어 다니기', onExit: () => { map.top.exit(); topH = false; clouds(true); map.player.freeze(false); } }); }
  function howTo(first) {
    const st = (i, t) => '<div class="st"><b class="n">' + i + '</b><span>' + t + '</span></div>';
    const P9 = openP('<h3>🏘 ' + esc(D.title) + '에 온 걸 환영해요</h3>' + st('🚶', '<b>학교 정문(남쪽)</b>으로 나가면 우리가 판에 지은 마을이에요') + st('🗺', '<b>M</b> = 지도(방위표·축척·범례) · 오른쪽 위 작은 지도도 눌러 봐요') + st('🔎', '<b>F</b> = 장소 이름으로 찾기 → 🧭 길 따라 빨간 선 · 몇 m, 몇 분 걸리는지') + st('🧱', '<b>Y</b> = 🧱 판 모습(블록 그대로) ↔ 🏘 마을 모습 · <b>B</b> = 🚲 자전거')
      + '<div class="st" style="background:#fff7d6"><b class="n">✨</b><span>AI가 사진에서 안 보여 채운 곳이 있어요 — ☰ 메뉴의 <b>✨ AI가 채운 빈칸</b>에서 매트와 견줘 봐요</span></div><div class="row"><button data-a="x">▶ 걸어 보기</button></div>');
    P9.querySelector('[data-a="x"]').onclick = closeP;
  }
  let bike = false, bikeM = null;
  function setBike(on) { bike = on; map.player.speed(on ? 2 : 1); if (on && !bikeM) { const g = new T3.Group(); const wm = new T3.MeshLambertMaterial({ color: 0x2b2b2b }), fm = new T3.MeshLambertMaterial({ color: 0x2f8fd0 }); MATS.push(wm, fm);
      for (const z9 of [-0.52, 0.52]) { const w = new T3.Mesh(new T3.TorusGeometry(0.33, 0.06, 6, 14), wm); w.position.set(0, 0.36, z9); w.rotation.y = Math.PI / 2; g.add(w); GEOS.push(w.geometry); }
      const fr = new T3.Mesh(new T3.BoxGeometry(0.06, 0.08, 1.05), fm); fr.position.set(0, 0.62, 0); g.add(fr); GEOS.push(fr.geometry); const hb = new T3.Mesh(new T3.BoxGeometry(0.6, 0.05, 0.05), wm); hb.position.set(0, 0.95, 0.5); g.add(hb); GEOS.push(hb.geometry);
      bikeM = g; map.add(g); }
    if (bikeM) bikeM.visible = on; chips(); map.hud.toast(on ? '🚲 자전거를 탔어요(빠르게) — B = 내리기' : '🚶 자전거에서 내렸어요', 2); }
  async function setLook(l) { if (l === LOOK) return; LOOK = l; await build(); chips(); map.hud.banner(LOOK === 'mat' ? '🧱 판 모습' : '🏘 마을 모습', 1.4); }
  function chips() {
    map.hud.chip('twn-map', '🗺 지도 (M)', { onClick: () => bigOpen ? closeP() : openBig() });
    map.hud.chip('twn-find', '🔎 장소 (F)', { onClick: () => openFind() });
    map.hud.chip('twn-look', LOOK === 'mat' ? '🧱 판 모습 (Y)' : '🏘 마을 모습 (Y)', { onClick: () => setLook(LOOK === 'mat' ? 'town' : 'mat') });
    map.hud.chip('twn-bike', bike ? '🚲 자전거 탐 (B)' : '🚲 자전거 (B)', { onClick: () => setBike(!bike) });
    map.hud.chip('twn-menu', '☰ ' + (LAYERS.length > 1 ? '판: ' + nameOf(L) + ' · ' : '') + '메뉴', { onClick: () => openMenu() });
  }
  keyDn = e => { if (dead || e.repeat || e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return; if (panel && !bigOpen) { if (e.code === 'Escape') { closeP(); e.preventDefault(); } return; }
    if (e.code === 'KeyM') { e.stopImmediatePropagation(); bigOpen ? closeP() : openBig(); } else if (e.code === 'KeyF') { if (bigOpen) closeP(); openFind(); } else if (e.code === 'KeyY') setLook(LOOK === 'mat' ? 'town' : 'mat'); else if (e.code === 'KeyB') setBike(!bike); else if (e.code === 'Escape' && bigOpen) closeP(); };
  addEventListener('keydown', keyDn, true);

  // 처음: 학교 정문 안쪽에서 남쪽(마을)을 보고 · 하는 법(이 탭에서 처음 한 번)
  map.player.teleport([16.5, -1.3, 50]); map.player.lookAt([16.5, 200]);
  chips(); drawMini();
  let seen = false; try { seen = sessionStorage.getItem('sm.town.how') === '1'; sessionStorage.setItem('sm.town.how', '1'); } catch (e) { /* */ }
  if (planMode) openBig(); else if (!seen) howTo(true);
  map.hud.banner('🏘 ' + D.title, 2);
  window.SM_TOWN = { get data() { return D; }, get layer() { return LID; }, places: () => PLACES.map(p => ({ id: p.id, name: p.name, kind: p.kind, x: p.x, z: p.z, door: p.door })), find: q => findPlace(q), route: (q, from) => { const p = findPlace(q); if (!p) return { ok: false, reason: 'noplace' }; const me = map.player.get(); return route(from || [me.x, me.z], p.door); },
    ground: (x, z) => ty(x, z), sd: (x, z) => sdAt(x, z), onRoad: (x, z, p) => !!onRoad(x, z, p || 0), get root() { return ROOT; }, get mats() { return MAT; }, toWorld: (mx, my) => [X(mx), Z(my)], toMat: (x, z) => [MXof(x), MYof(z)], stats: () => ({ ...STATS }), setLayer, setLook, show: q => { const p = findPlace(q); return p ? showRoute(p) : null; }, bus: q => { const p = findPlace(q); if (p) busTo(p); return !!p; }, cell: (x, z) => cellOf(x, z),
    props: () => PROPS.map(P => ({ k: P.k, label: P.label, x: +P.x.toFixed(1), z: +P.z.toFixed(1), cell: cellOf(P.x, P.z), ry: +(P.ry || 0).toFixed(2), foot: !!P.foot, built: !!P.built, cross: P.cross ? P.cross.s.r.id : null })), areas: () => AREAS.map(A => ({ t: A.t, cells: A.cells, st: [...A.st], stone: [+A.sx.toFixed(1), +A.sz.toFixed(1)], n: A.n || {} })), get life() { return LIFE ? LIFE.counts : null; }, get counts() { return { bld: BLD.length, trees: Object.fromEntries(Object.entries(TREES).map(([k, v]) => [k, v.length])), cols: COLS.length, bridges: BRIDGES.length, props: PROPS.length, areas: AREAS.length, cross: { auto: XCROSS.filter(X9 => X9.br === 'auto').length, kid: XCROSS.filter(X9 => X9.br === 'kid').length, cut: XCROSS.filter(X9 => !X9.br).length }, pcol: PCOL.length, nodes: GRAPH ? GRAPH.nodes.length : 0, regions: BK.size, hidden: OUT.hidden }; }, setLang: l => { LANG = l === 'en' ? 'en' : 'ko'; relabel(); } };

  // ───────── 생활(LIFE-1 · 교사 10-13 '완성된 도시 — 차·버스·이름 없는 사람·밤 불빛'): 길 그래프를 따라 달리는 차·버스 + 인도를 걷는 사람 · 인스턴스로 그림(그리기 몇 번) ─────────
  //   이름 없는 사람만(실제 아이 이름 없음) · 차는 오른쪽 차로 · 버스는 큰길만 · 사람은 인도 · 끊긴 길(강)에서는 되돌아감 · 밤 = 전조등·미등
  function makeLife() {
    if (!GRAPH || !GRAPH.nodes.length) return null; const NO = GRAPH.nodes, AD = GRAPH.adj, R = rng0(hashS('life' + LID)), O3 = new T3.Object3D(), C9 = new T3.Color(), geos = [], mats = [], meshes = [];
    const mk = (geo, mat, n) => { const m = new T3.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(T3.DynamicDrawUsage); m.frustumCulled = false; m.userData.fx = 1; map.add(m); geos.push(geo); mats.push(mat); meshes.push(m); return m; };
    const boxG = (sx, sy, sz, x, y, z) => new T3.BoxGeometry(sx, sy, sz).translate(x, y, z), merge = (L9) => { const P = [], N = []; for (const g of L9) { const q = g.toNonIndexed(); P.push(...q.attributes.position.array); N.push(...q.attributes.normal.array); q.dispose(); g.dispose(); } const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); return g; };
    const edges = []; AD.forEach((e, i) => e.forEach(([j, len, big, hw]) => { if (j > i) edges.push([i, j, len, big, hw]); })); if (!edges.length) return null;
    const NC = 34, NB = 2, NP = 64;   // 수는 고정 · 내 둘레 250m에 모이게(멀어지면 가까운 길로 다시 — 어디서든 동네가 살아 있게)
    const mid = edges.map(e => [(NO[e[0]][0] + NO[e[1]][0]) / 2, (NO[e[0]][1] + NO[e[1]][1]) / 2]);
    const carBody = mk(merge([boxG(1.85, 0.75, 4.2, 0, 0.55, 0), boxG(1.7, 0.62, 2.2, 0, 1.22, -0.2)]), new T3.MeshLambertMaterial({ color: 0xffffff }), NC);
    const carDark = mk(merge([boxG(1.72, 0.5, 2.0, 0, 1.2, -0.2), ...[[-0.9, 1.35], [0.9, 1.35], [-0.9, -1.35], [0.9, -1.35]].map(([x, z]) => boxG(0.3, 0.66, 0.66, x, 0.33, z))]), new T3.MeshLambertMaterial({ color: 0x2b313a }), NC);
    const busBody = mk(merge([boxG(2.5, 2.6, 10.5, 0, 1.75, 0)]), new T3.MeshLambertMaterial({ color: 0xffffff }), NB);
    const busDark = mk(merge([boxG(2.54, 0.9, 9.6, 0, 2.2, 0.1), ...[[-1.2, 3.6], [1.2, 3.6], [-1.2, -3.6], [1.2, -3.6]].map(([x, z]) => boxG(0.32, 0.9, 0.9, x, 0.45, z))]), new T3.MeshLambertMaterial({ color: 0x2b313a }), NB);
    const headL = mk(merge([boxG(0.42, 0.18, 0.06, -0.62, 0.72, 2.12), boxG(0.42, 0.18, 0.06, 0.62, 0.72, 2.12)]), new T3.MeshBasicMaterial({ color: 0xfff6d8 }), NC + NB), tailL = mk(merge([boxG(0.38, 0.16, 0.06, -0.66, 0.72, -2.12), boxG(0.38, 0.16, 0.06, 0.66, 0.72, -2.12)]), new T3.MeshBasicMaterial({ color: 0xff3a2a }), NC + NB);
    const pBody = mk(merge([boxG(0.42, 0.55, 0.26, 0, 1.0, 0), boxG(0.16, 0.72, 0.2, -0.11, 0.36, 0), boxG(0.16, 0.72, 0.2, 0.11, 0.36, 0)]), new T3.MeshLambertMaterial({ color: 0xffffff }), NP), pHead = mk(merge([boxG(0.3, 0.3, 0.28, 0, 1.45, 0), boxG(0.32, 0.1, 0.3, 0, 1.62, 0)]), new T3.MeshLambertMaterial({ color: 0xffffff }), NP);
    const CARC = [0x3d74c9, 0xe0453a, 0xf2f1ea, 0x3a3a3a, 0x9aa0a6, 0x2f8a5a, 0xf2c230, 0xffffff], SHIRT = [0xe0453a, 0x3d74c9, 0xf2c230, 0x3cc76a, 0xf08fb2, 0x8a5bd1, 0xffffff, 0xef8b33, 0x2b313a], SKIN = [0xf2cfa8, 0xe0b48a, 0xc89870];
    const pickEdge = (bigOnly) => { const L9 = bigOnly ? edges.filter(e => e[3]) : edges; return L9.length ? L9[(R() * L9.length) | 0] : edges[0]; };
    const agents = []; const add = (type, i9, bigOnly) => { const e = pickEdge(bigOnly), fwd = R() < 0.5; agents.push({ type, i: i9, a: fwd ? e[0] : e[1], b: fwd ? e[1] : e[0], len: e[2], hw: e[4], big: e[3], t: R() * e[2], sp: type === 'p' ? 1.0 + R() * 0.5 : type === 'bus' ? 6.5 : 7 + R() * 3, side: type === 'p' ? (R() < 0.5 ? -1 : 1) : 1, ph: R() * 6.28, bigOnly }); };
    for (let i = 0; i < NC; i++) { add('car', i, false); C9.setHex(CARC[(R() * CARC.length) | 0]); carBody.setColorAt(i, C9); }
    for (let i = 0; i < NB; i++) { add('bus', i, true); C9.setHex(i ? 0x3cc76a : 0x2f6fd0); busBody.setColorAt(i, C9); }
    for (let i = 0; i < NP; i++) { add('p', i, false); C9.setHex(SHIRT[(R() * SHIRT.length) | 0]); pBody.setColorAt(i, C9); C9.setHex(SKIN[(R() * SKIN.length) | 0]); pHead.setColorAt(i, C9); }
    for (const m of meshes) if (m.instanceColor) m.instanceColor.needsUpdate = true;
    const brTop = (x, z) => { for (const b of BRIDGES) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return b.y1; return -1e9; };
    const next = (g) => { const L9 = AD[g.b].filter(([j, , big]) => j !== g.a && (!g.bigOnly || big)); let pick; if (L9.length) pick = L9[(R() * L9.length) | 0]; else pick = AD[g.b].find(([j]) => j === g.a) || AD[g.b][0];   // 막다른 곳 = 되돌아감
      if (!pick) return; g.a = g.b; g.b = pick[0]; g.len = pick[1]; g.big = pick[2]; g.hw = pick[3]; g.t = 0; };
    let night = 0, rq = 0, ri9 = 0; const place = (g, m1, m2, k) => { const A = NO[g.a], B2 = NO[g.b], u = Math.min(1, g.t / Math.max(0.01, g.len)), dx = B2[0] - A[0], dz = B2[1] - A[1], l = Math.hypot(dx, dz) || 1, tx = dx / l, tz = dz / l, rx = -tz, rz = tx;   // 오른쪽(북 = −z · 동 = +x) = (−tz, tx) — 우리나라는 오른쪽 차로
      const off = g.type === 'p' ? g.side * (g.hw - (g.big ? 1.1 : 0.7)) : (g.big ? 3.2 : 1.6) * (g.type === 'bus' ? 1.05 : 1), x = A[0] + dx * u + rx * off, z = A[1] + dz * u + rz * off, yb = brTop(x, z), y = Math.max(ty(x, z) + (g.type === 'p' ? 0.16 : 0.07), yb > -1e8 ? yb + (g.type === 'p' && Math.abs(off) > g.hw - 2.4 ? 0.15 : 0) : -1e9);
      const h9 = Math.atan2(tx, tz); O3.position.set(x, y + (g.type === 'p' ? Math.abs(Math.sin(g.ph)) * 0.06 : 0), z); O3.rotation.set(0, h9, 0); O3.scale.set(1, 1, 1); O3.updateMatrix(); m1.setMatrixAt(g.i, O3.matrix); if (m2) m2.setMatrixAt(g.i, O3.matrix); if (k != null) { headL.setMatrixAt(k, O3.matrix); tailL.setMatrixAt(k, O3.matrix); } };
    return {
      tick(dt) { dt = Math.min(dt, 0.1); if ((rq += dt) > 0.4) { rq = 0; const cp = map.camera.position; for (let k = 0; k < 6; k++) { const g = agents[ri9 = (ri9 + 1) % agents.length]; if (g.type === 'bus') continue; const A = NO[g.a];
          if (Math.hypot(A[0] - cp.x, A[1] - cp.z) < 280) continue; const near = []; for (let e = 0; e < edges.length; e++) { const d = Math.hypot(mid[e][0] - cp.x, mid[e][1] - cp.z); if (d > 60 && d < 240) near.push(e); } if (!near.length) continue;   // 화면 밖(60m 너머)에서 나타나게
          const e = edges[near[(R() * near.length) | 0]], fwd = R() < 0.5; g.a = fwd ? e[0] : e[1]; g.b = fwd ? e[1] : e[0]; g.len = e[2]; g.big = e[3]; g.hw = e[4]; g.t = R() * e[2]; } }
        for (const g of agents) { g.t += g.sp * dt; g.ph += dt * 7; if (g.t >= g.len) next(g); place(g, g.type === 'car' ? carBody : g.type === 'bus' ? busBody : pBody, g.type === 'car' ? carDark : g.type === 'bus' ? busDark : pHead, g.type === 'car' ? g.i : g.type === 'bus' ? NC + g.i : null); }
        for (const m of meshes) m.instanceMatrix.needsUpdate = true; },
      night(v) { night = v; headL.visible = tailL.visible = v > 0; },
      dispose() { for (const m of meshes) map.remove(m); for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); },
      get counts() { return { cars: NC, buses: NB, people: NP }; } };
  }

  // 지금 할 일 줄(가까운 장소 · 4번/초) · 물 흐름 · 나무 흔들림 · 자전거 · 작은 지도
  let near9 = '', tq = 0, mq = 0;
  return {
    tick(dt) {
      if (LIFE) LIFE.tick(dt); WT.value += dt; ripple.offset.y -= dt * 0.16; MAT.pond.map.offset.x += dt * 0.012; MAT.pond.map.offset.y += dt * 0.008;
      const me = map.player.get();
      if (bikeM && bike) { bikeM.position.set(me.x, me.y, me.z); bikeM.rotation.y = me.h || 0; }
      if ((lodQ += dt) > 0.25) { lodQ = 0; lodTick(false); }
      if ((mq += dt) > 0.2) { mq = 0; drawMini(); const cp = map.camera.position; for (const m of DMESH) m.visible = Math.hypot(cp.x - m.userData.c[0], cp.z - m.userData.c[1]) < 60 + REG * 0.71; }
      if (RING) { const cp = map.camera.position, tv = !!(map.top && map.top.on); RING.position.set(cp.x, TY, cp.z); RING.visible = !tv; if (tv && !cloudsOff.length && !topH) clouds(false); else if (!tv && cloudsOff.length && !topH) clouds(true); }
      if ((tq += dt) > 0.25) { tq = 0; if (routeNow) { const end = routeNow.to.door; if (Math.hypot(me.x - end[0], me.z - end[1]) < 6) { map.hud.goal('🎉 ' + nameOf(routeNow.to) + '에 왔어요!'); map.sfx('ding'); routeNow = null; if (trailH) { trailH.remove(); trailH = null; } setTimeout(() => { if (!dead) near9 = ''; }, 2500); } return; }
        let best = null, bd = 30; for (const p of PLACES) { const d = Math.hypot(p.x - me.x, p.z - me.z) - (p.nat ? 25 : 8); if (d < bd) { bd = d; best = p; } }
        const t = inSchool(me.x, me.z) ? '🏫 우리 학교 — 정문(남쪽)으로 나가면 마을이에요' : (best ? '📍 ' + best.icon + ' ' + nameOf(best) + (best.nat ? '' : ' 앞') : '📍 ' + nameOf(L) + ' 마을 길') + ' · ' + cellOf(me.x, me.z);
        if (t !== near9) { near9 = t; map.hud.goal(t); } }
    },
    stop() { dead = true; clouds(true); removeEventListener('keydown', keyDn, true);
      { const me = map.player.get(); if (!inSchool(me.x, me.z)) { map.player.teleport([16.5, -1.3, 50]); map.player.lookAt([16.5, 0]); } }   /* 마을을 나가면 학교 정문 안으로(마을 땅이 사라지므로) */ closeP(); css.remove(); miniBox.remove(); if (trailH) trailH.remove(); if (bike) map.player.speed(1); if (bikeM) map.remove(bikeM);
      if (LIFE) { LIFE.dispose(); LIFE = null; } if (ROOT) { map.remove(ROOT); ROOT.traverse(o => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } }); } for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose(); for (const t of TEX) t.dispose(); for (const o of PTX) o.dispose(); ripple.dispose();
      if (window.SM_TOWN) delete window.SM_TOWN; }
  };
}
