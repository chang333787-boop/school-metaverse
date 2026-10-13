// 🏘 마을 세계(TOWN-1 · 10-12 교사 설계안 · 인터뷰) — 자료 한 장(v2/towns/<id>.js)을 넣으면 학교 정문 밖에 마을이 선다
//   하나의 세계: 우리 학교 → 정문 → 우리 마을(아이들이 매트로 설계) → 자연환경(마을이 서는 땅). 마을 내용은 아이들 것 — Claude는 사진을 자료로 옮길 뿐(빈칸은 'AI가 채운 빈칸'으로 드러냄)
//   주소 ?town=<id>(main.js) · registry dev(메뉴에 없음) · 홍보판(SM_PROMO)엔 열리지 않음 · 다른 놀이의 경계·길격자·성능은 그대로(이 놀이가 켤 때만 학교 밖이 바뀜 — map.world.outside)
//   자료 형식 정본 = docs/systems/town.md · 좌표 = 매트 cm(왼쪽 위 0,0 · 위 = 북 · 1:500 = 1cm 5m) · 판(layers) = 오늘·개발 전·옛날… 같은 땅의 여러 모습
//   그리기: 땅(5m 격자 · 부드러운 음영 · 높낮이·물가 색) · 물(흐르는 강 띠 · 연못 · 다리) · 길(인도·차선·건널목) · 나무 4종(바람에 흔들림) · 논·밭·과수원·공원 · 건물(🧱 매트 모습 ↔ 🏘 마을 모습)
//   — 150m 구역마다 메시 둘(땅 · 나머지)로 묶음(멀리 구역은 절두체·안개로 빠짐) · 새 조명 없음
export const meta = { id: 'town', title: '마을 세계', api: 1 };

// 매트 색(블록 색 이름 → 색) · 색 규칙(교사 10-12): 빨강·주황 = 사는 곳 · 노랑 = 일하는 곳 · 파랑(남색) = 모두가 쓰는 곳 · 흰색 = 병원 · 초록 = 자연
const COL = { red: 0xd9473b, orange: 0xef8b33, yellow: 0xf2c230, green: 0x4f9e4a, navy: 0x2f4a8a, blue: 0x3d74c9, white: 0xf2f1ea, black: 0x3a3a3a, brown: 0x8a5a36, pink: 0xf08fb2, purple: 0x8a5bd1, gray: 0x9a9fa5, sky: 0x8fd0f0 };
const KIND_OF_COLOR = { red: 'house', orange: 'house', pink: 'house', yellow: 'shop', navy: 'public', blue: 'public', purple: 'public', white: 'hospital', green: 'green', brown: 'house', gray: 'public', black: 'public' };
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
  const ARR = ['nature', 'roads', 'blocks', 'labels', 'zones', 'fac'];
  function resolve(lid, seen = new Set()) {
    const L = D.layers[lid]; if (!L || seen.has(lid)) return null; seen.add(lid);
    const B = L.from ? resolve(L.from, seen) : null, out = { id: lid, name: L.name || lid, en: L.en, note: L.note || null };
    const drop = new Set(L.drop || []);
    for (const k of ARR) { const base = B ? B[k].filter(it => !drop.has(it.id)) : [], own = L[k] || [], ids = new Set(own.filter(o => o.id).map(o => o.id));
      out[k] = base.filter(it => !it.id || !ids.has(it.id)).concat(own); }
    // 칸 주소로 적은 구역(cell · cells · part) → 칸 네모 — 색종이가 칸을 다 덮지 않아도 그 칸 전체가 구역(교사 10-13)
    out.zones = out.zones.flatMap(z => { if (z.rect || z.poly) return [z]; const C = z.cells || (z.cell ? [z.cell] : []); return C.map((c, i) => { const R = cellRect(c, z.part); return R ? { ...z, id: (z.id || 'z') + (C.length > 1 ? '_' + i : ''), rect: R, cellName: c } : null; }).filter(Boolean); });
    return out;
  }
  const LAYERS = Object.keys(D.layers);
  let LID = D.layers[params.layer] ? params.layer : D.base && D.layers[D.base] ? D.base : LAYERS[0], L = resolve(LID);

  // ───────── 자연환경 엔진: 높이 격자(5m) — 산(쌓은 높이 → 부드러운 봉우리) · 물(강·연못 바닥) · 다리 ─────────
  const G = 5, NX = Math.ceil((TX1 - TX0) / G) + 1, NZ = Math.ceil((TZ1 - TZ0) / G) + 1, NN = NX * NZ;
  const HF = new Float32Array(NN), WD = new Float32Array(NN), WK = new Uint8Array(NN), NR = new Uint8Array(NN);   // 높이 · 물 깊이 · 물 종류(1 강 2 연못) · 길 위
  const nx = i => TX0 + i * G, nz = j => TZ0 + j * G;
  const shapeOf = it => it.rect ? { rect: [X(it.rect[0]), Z(it.rect[1]), X(it.rect[2]), Z(it.rect[3])] } : it.poly ? { poly: it.poly.map(p => [X(p[0]), Z(p[1])]) } : it.line ? { line: it.line.pts.map(p => [X(p[0]), Z(p[1])]), w: (it.line.w || 2) * S } : null;
  const inShape = (sh, x, z) => sh.rect ? x >= Math.min(sh.rect[0], sh.rect[2]) && x <= Math.max(sh.rect[0], sh.rect[2]) && z >= Math.min(sh.rect[1], sh.rect[3]) && z <= Math.max(sh.rect[1], sh.rect[3]) : sh.poly ? inPoly(x, z, sh.poly) : false;
  const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / L2; t = Math.max(0, Math.min(1, t)); const px = a[0] + dx * t, pz = a[1] + dz * t; return [Math.hypot(x - px, z - pz), t, px, pz]; };
  const lineD = (x, z, P) => { let best = [1e9, 0, 0, 0, 0]; for (let i = 0; i < P.length - 1; i++) { const r = segD(x, z, P[i], P[i + 1]); if (r[0] < best[0]) best = [r[0], i + r[1], r[2], r[3], i]; } return best; };
  const edgeD = (sh, x, z) => { if (sh.rect) { const r = sh.rect; return Math.min(x - Math.min(r[0], r[2]), Math.max(r[0], r[2]) - x, z - Math.min(r[1], r[3]), Math.max(r[1], r[3]) - z); }
    let d = 1e9; for (let i = 0, j = sh.poly.length - 1; i < sh.poly.length; j = i++) d = Math.min(d, segD(x, z, sh.poly[j], sh.poly[i])[0]); return d; };
  const bboxOf = sh => { const P = sh.rect ? [[sh.rect[0], sh.rect[1]], [sh.rect[2], sh.rect[3]]] : sh.poly || sh.line; const xs = P.map(p => p[0]), zs = P.map(p => p[1]), m = sh.w ? sh.w / 2 + 6 : 0;
    return [Math.min(...xs) - m, Math.min(...zs) - m, Math.max(...xs) + m, Math.max(...zs) + m]; };
  const nodeRange = (bb, pad = 0) => [Math.max(0, Math.floor((bb[0] - pad - TX0) / G)), Math.max(0, Math.floor((bb[1] - pad - TZ0) / G)), Math.min(NX - 1, Math.ceil((bb[2] + pad - TX0) / G)), Math.min(NZ - 1, Math.ceil((bb[3] + pad - TZ0) / G))];
  let ROADS = [], RSEG = [];   // 길(세계 좌표) — 다리·물가·나무 피하기에도 씀
  function buildTerrain() {
    HF.fill(0); WD.fill(0); WK.fill(0); NR.fill(0);
    // 산·언덕: 발자국 안 = 가장자리에서 안쪽으로 둥글게 솟는 봉우리(사인 돔 · 가운데가 가장 높음) + 능선 잡음 → 한 번 흐리게(산자락)
    const HL = new Float32Array(NN);
    for (const it of L.nature) { if (it.k !== 'hill') continue; const sh = shapeOf(it); if (!sh || sh.line) continue; const Hm = (it.h || 2) * S, [i0, j0, i1, j1] = nodeRange(bboxOf(sh));
      let dmax = 0; for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = nx(i), z = nz(j); if (inShape(sh, x, z)) dmax = Math.max(dmax, edgeD(sh, x, z)); }
      if (dmax <= 0) continue; const sd = hashS(it.id || it.name || 'h') % 997;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = nx(i), z = nz(j); if (!inShape(sh, x, z)) continue;
        const de = edgeD(sh, x, z), t = it.peak ? Math.min(1, de / (de + Math.hypot(x - X(it.peak[0]), z - Z(it.peak[1])) + 1e-6) * 1.15) : Math.min(1, de / (dmax * 0.92)), ridge = 0.86 + 0.28 * (vnoise(x / 23 + sd, z / 23) - 0.5) + 0.12 * (vnoise(x / 9, z / 9 + sd) - 0.5);
        const h = Hm * Math.sin(t * Math.PI / 2) ** 1.35 * ridge, k = j * NX + i; if (h > HL[k]) HL[k] = h; } }
    blur(HL, 2); blur(HL, 1);
    // 물: 연못 = 가장자리에서 깊어짐 · 강 = 가운데 깊고 둑으로 얕아짐(흐름 = 점 순서)
    for (const it of L.nature) { if (it.k !== 'water') continue; const sh = shapeOf(it); if (!sh) continue; const [i0, j0, i1, j1] = nodeRange(bboxOf(sh), 6);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = nx(i), z = nz(j), k = j * NX + i;
        if (sh.line) { const hw = sh.w / 2, d = lineD(x, z, sh.line)[0]; if (d < hw) { WD[k] = Math.max(WD[k], 0.55 + 0.9 * (1 - d / hw)); WK[k] = 1; } else if (d < hw + 4) WD[k] = Math.max(WD[k], 0.3 * (1 - (d - hw) / 4)); }
        else if (inShape(sh, x, z)) { WD[k] = Math.max(WD[k], Math.min(1.8, 0.55 + edgeD(sh, x, z) * 0.12)); WK[k] = 2; }
        else { const d = -edgeDOut(sh, x, z); if (d < 4) WD[k] = Math.max(WD[k], 0.3 * (1 - d / 4)); } } }
    // 길 아래 = 길(다리 칸 표시) · 학교 상자 안은 높이 0
    for (const r of RSEG) { const [i0, j0, i1, j1] = nodeRange([Math.min(r.a[0], r.b[0]), Math.min(r.a[1], r.b[1]), Math.max(r.a[0], r.b[0]), Math.max(r.a[1], r.b[1])], r.hw + 2);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (segD(nx(i), nz(j), r.a, r.b)[0] < r.hw + 1.5) NR[j * NX + i] = 1; }
    for (let k = 0; k < NN; k++) { const i = k % NX, j = (k / NX) | 0; if (inRect(nx(i), nz(j))) { HF[k] = 0; WD[k] = 0; WK[k] = 0; continue; } HF[k] = HL[k] - WD[k]; }
  }
  function edgeDOut(sh, x, z) { if (sh.rect) { const r = sh.rect, x0 = Math.min(r[0], r[2]), x1 = Math.max(r[0], r[2]), z0 = Math.min(r[1], r[3]), z1 = Math.max(r[1], r[3]); const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1); return -Math.hypot(dx, dz); }
    let d = 1e9; for (let i = 0, j = sh.poly.length - 1; i < sh.poly.length; j = i++) d = Math.min(d, segD(x, z, sh.poly[j], sh.poly[i])[0]); return -d; }
  function blur(A, r) { const T = new Float32Array(NN);
    for (let j = 0; j < NZ; j++) { let s = 0, n = 0; for (let i = -r; i < NX + r; i++) { const a = i + r, b = i - r - 1; if (a < NX && a >= 0) { s += A[j * NX + a]; n++; } if (b >= 0) { s -= A[j * NX + b]; n--; } if (i >= 0 && i < NX) T[j * NX + i] = s / Math.max(1, n); } }
    for (let i = 0; i < NX; i++) { let s = 0, n = 0; for (let j = -r; j < NZ + r; j++) { const a = j + r, b = j - r - 1; if (a < NZ && a >= 0) { s += T[a * NX + i]; n++; } if (b >= 0) { s -= T[b * NX + i]; n--; } if (j >= 0 && j < NZ) A[j * NX + i] = s / Math.max(1, n); } } }
  // 땅 높이(세계 y) — 메시와 같은 삼각형으로 나눠 읽는다(물리 = 보이는 땅)
  const tH = (x, z) => { const u = (x - TX0) / G, v = (z - TZ0) / G; if (!(u >= 0 && v >= 0 && u < NX - 1 && v < NZ - 1)) return 0;
    const i = u | 0, j = v | 0, fx = u - i, fz = v - j, k = j * NX + i, h00 = HF[k], h10 = HF[k + 1], h01 = HF[k + NX], h11 = HF[k + NX + 1];
    return fx >= fz ? h00 + (h10 - h00) * fx + (h11 - h10) * fz : h00 + (h11 - h01) * fx + (h01 - h00) * fz; };
  const ty = (x, z) => TY + tH(x, z);
  const wAt = (x, z) => { const i = Math.round((x - TX0) / G), j = Math.round((z - TZ0) / G); return i >= 0 && j >= 0 && i < NX && j < NZ ? WK[j * NX + i] : 0; };

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
    for (let i = 0; i < n; i++) { const t0 = i / n * L0, t1 = (i + 1) / n * L0, x0 = a[0] + tx * t0, z0 = a[1] + tz * t0, x1 = a[0] + tx * t1, z1 = a[1] + tz * t1;
      if (o.skip && o.skip((x0 + x1) / 2, (z0 + z1) / 2)) continue;
      const y = (x, z) => (o.y != null ? o.y : ty(x, z)) + dy, B = bucket((x0 + x1) / 2, (z0 + z1) / 2);
      const p0 = [x0 + px, y(x0 + px, z0 + pz), z0 + pz], p1 = [x1 + px, y(x1 + px, z1 + pz), z1 + pz], p2 = [x1 - px, y(x1 - px, z1 - pz), z1 - pz], p3 = [x0 - px, y(x0 - px, z0 - pz), z0 - pz];
      quad(B, p0, p1, p2, p3, col); } }

  // ───────── 길: 테이프 → 차도(아스팔트) · 인도 · 가운데 선 · 건널목 · 물 위 = 다리 ─────────
  function prepRoads() {
    const edgeShift = (p, hw) => { const T9 = 1.2; let [x, z] = [X(p[0]), Z(p[1])]; if (p[1] >= MS[1] - T9 && p[1] <= MS[3] + T9) { if (Math.abs(p[0] - MS[0]) < T9) x = SR[0] - hw - 1; else if (Math.abs(p[0] - MS[2]) < T9) x = SR[2] + hw + 1; }
      if (p[0] >= MS[0] - T9 && p[0] <= MS[2] + T9) { if (Math.abs(p[1] - MS[3]) < T9) z = SR[3] + hw + 1; else if (Math.abs(p[1] - MS[1]) < T9 && MS[1] > 0.5) z = SR[1] - hw - 1; } return [x, z]; };   // 학교 칸 변 위 = 담 바깥(학교를 파고들지 않게)
    const onEdgeLine = (r) => { const P = r.pts || [r.a, r.b], T9 = 1.2; return P.length === 2 && ((Math.abs(P[0][0] - P[1][0]) < 0.5 && (Math.abs(P[0][0] - MS[0]) < T9 || Math.abs(P[0][0] - MS[2]) < T9)) || (Math.abs(P[0][1] - P[1][1]) < 0.5 && (Math.abs(P[0][1] - MS[3]) < T9 || (Math.abs(P[0][1] - MS[1]) < T9 && MS[1] > 0.5)))); };
    ROADS = L.roads.map((r, ri) => ({ ...r, ri, P: (r.pts || [r.a, r.b]).map(p => onEdgeLine(r) ? (() => { const hw0 = (r.wm ? r.wm : (r.w || 2.4) * S) / 2, q = [p[0], p[1]], P2 = r.pts || [r.a, r.b], vert = Math.abs(P2[0][0] - P2[1][0]) < 0.5; if (vert) q[1] = MS[1] + 1; else q[0] = MS[0] + 1; const sh = edgeShift(q, hw0); return vert ? [sh[0], Z(p[1])] : [X(p[0]), sh[1]]; })() : [X(p[0]), Z(p[1])]), hw: (r.wm ? r.wm : (r.w || 2.4) * S) / 2, big: r.big != null ? !!r.big : (r.wm ? r.wm : (r.w || 2.4) * S) >= 18 }));
    RSEG = []; for (const r of ROADS) for (let i = 0; i < r.P.length - 1; i++) RSEG.push({ r, a: r.P[i], b: r.P[i + 1], hw: r.hw });
  }
  const onRoad = (x, z, pad = 0, except = null) => { for (const s of RSEG) if (s.r !== except && segD(x, z, s.a, s.b)[0] < s.hw + pad) return s; return null; };
  const BRIDGES = [];
  function drawRoads() {
    if (LOOK === 'mat') { for (const s of RSEG) { strip(s.a, s.b, s.hw * 2, 0.08, 0xc8352e, { skip: (x, z) => inSchool(x, z) || wAt(x, z) > 0, step: 5 }); bridgesOn(s); } return; }   // 🧱 매트 모습: 길 = 빨간 테이프 그대로
    for (const s of RSEG) {
      const { a, b, hw, r } = s, sw = r.big ? 2.2 : 1.4, cw = hw - sw;   // 인도 폭 · 차도 반폭
      const skipSchool = (x, z) => inSchool(x, z), overW = (x, z) => wAt(x, z) > 0;
      strip(a, b, cw * 2, 0.06, r.big ? 0x5d6166 : 0x6a6e73, { skip: (x, z) => skipSchool(x, z) || overW(x, z) });
      const L0 = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L0, tz = (b[1] - a[1]) / L0, px = -tz, pz = tx;
      for (const sg of [-1, 1]) { const o = sg * (cw + sw / 2), A = [a[0] + px * o, a[1] + pz * o], B9 = [b[0] + px * o, b[1] + pz * o];
        strip(A, B9, sw, 0.14, 0xc9c4b8, { skip: (x, z) => skipSchool(x, z) || overW(x, z) || !!onRoad(x, z, -0.2, r) });                    // 인도(보도블록)
        const oc = sg * (cw + 0.12), Ac = [a[0] + px * oc, a[1] + pz * oc], Bc = [b[0] + px * oc, b[1] + pz * oc];
        strip(Ac, Bc, 0.24, 0.2, 0xe2ded4, { skip: (x, z) => skipSchool(x, z) || overW(x, z) || !!onRoad(x, z, -0.2, r) }); }             // 연석
      // 가운데 선: 큰길 = 노란 두 줄 · 작은길 = 흰 점선(교차로 안은 그리지 않음)
      const skipX = (x, z) => skipSchool(x, z) || overW(x, z) || !!onRoad(x, z, 0.5, r);
      if (r.big) for (const sg of [-1, 1]) { const o = sg * 0.18; strip([a[0] + px * o, a[1] + pz * o], [b[0] + px * o, b[1] + pz * o], 0.16, 0.075, 0xf2c230, { skip: skipX, step: 3 }); }
      else for (let t = 1; t < L0 - 2; t += 6) { const p0 = [a[0] + tx * t, a[1] + tz * t], p1 = [a[0] + tx * (t + 3), a[1] + tz * (t + 3)]; if (!skipX((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)) strip(p0, p1, 0.15, 0.075, 0xf4f2ea, { step: 3 }); }
      bridgesOn(s);
    }
    // 교차로 모퉁이: 두 길의 인도가 만나는 네모를 보도로 채움 + 연석 모서리(길의 기본 구성 — 생활 시설 아님)
    for (const c of crossings(false)) { const FA = segFrame(c.A), FB = segFrame(c.B), cwA = c.A.hw - FA.sw, cwB = c.B.hw - FB.sw;
      for (const [sa, sb] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const x = c.x + FA.px * sa * (cwA + FA.sw / 2) + FB.px * sb * (cwB + FB.sw / 2), z = c.z + FA.pz * sa * (cwA + FA.sw / 2) + FB.pz * sb * (cwB + FB.sw / 2);
        if (inSchool(x, z) || wAt(x, z)) continue; box(x, ty(x, z) + 0.02, z, FB.sw + 0.05, 0.14, FA.sw + 0.05, Math.atan2(-FA.tz, FA.tx), 0xc9c4b8, { top: 0xc9c4b8 });
        const kx = c.x + FA.px * sa * (cwA + 0.12) + FB.px * sb * (cwB + 0.12), kz = c.z + FA.pz * sa * (cwA + 0.12) + FB.pz * sb * (cwB + 0.12); box(kx, ty(kx, kz) + 0.05, kz, 0.3, 0.16, 0.3, 0, 0xe2ded4); } }
  }
  function bridgesOn(s) {   // 다리: 물 위 구간 = 콘크리트 판 + 난간(충돌 = 판 윗면 · 계단처럼 올라섬) — 두 모습 모두
    const { a, b } = s, L0 = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L0, tz = (b[1] - a[1]) / L0, px = -tz, pz = tx, n = Math.ceil(L0 / 2.5); let on = -1;
    for (let i = 0; i <= n; i++) { const t = i / n * L0, x = a[0] + tx * t, z = a[1] + tz * t, w = i < n && wAt(x, z) > 0;
      if (w && on < 0) on = Math.max(0, t - 3); if ((!w || i === n) && on >= 0) { bridge(s, on, Math.min(L0, t + 3), tx, tz, px, pz); on = -1; } } }
  const segX = (a, b, c, d) => { const r1 = [b[0] - a[0], b[1] - a[1]], r2 = [d[0] - c[0], d[1] - c[1]], den = r1[0] * r2[1] - r1[1] * r2[0]; if (Math.abs(den) < 1e-9) return null;
    const t = ((c[0] - a[0]) * r2[1] - (c[1] - a[1]) * r2[0]) / den, u = ((c[0] - a[0]) * r1[1] - (c[1] - a[1]) * r1[0]) / den; return t >= -0.001 && t <= 1.001 && u >= -0.001 && u <= 1.001 ? { t, u, x: a[0] + r1[0] * t, z: a[1] + r1[1] * t } : null; };
  function bridge(s, t0, t1, tx, tz, px, pz) {
    const { a, hw } = s, len = t1 - t0, cx = a[0] + tx * (t0 + t1) / 2, cz = a[1] + tz * (t0 + t1) / 2, ry = Math.atan2(-tz, tx), top = TY + 0.32;
    box(cx, top - 0.5, cz, len, 0.5, hw * 2, ry, 0xb7b2a6, { top: 0x6a6e73, bottom: true });
    for (const sg of [-1, 1]) { const ox = cx + px * sg * (hw - 0.15), oz = cz + pz * sg * (hw - 0.15);
      box(ox, top, oz, len, 0.95, 0.12, ry, 0xf4f2ea, { noSide: false }); box(ox, top + 0.95, oz, len + 0.1, 0.12, 0.22, ry, 0x7a8592);   // 난간 판 + 손잡이
      for (let k = -len / 2 + 0.6; k <= len / 2 - 0.5; k += 2.4) box(ox + tx * k, top, oz + tz * k, 0.22, 1.07, 0.22, ry, 0x7a8592); }
    const xs = [a[0] + tx * t0 + px * hw, a[0] + tx * t0 - px * hw, a[0] + tx * t1 + px * hw, a[0] + tx * t1 - px * hw], zs = [a[1] + tz * t0 + pz * hw, a[1] + tz * t0 - pz * hw, a[1] + tz * t1 + pz * hw, a[1] + tz * t1 - pz * hw];
    BRIDGES.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y1: top });
  }

  // ───────── 땅 메시(구역마다 하나 · 공유 정점 · 높이 기울기로 부드러운 음영) ─────────
  function groundColor(k, x, z) {
    const h = HF[k], wd = WD[k], n1 = vnoise(x / 17, z / 17), n2 = vnoise(x / 5.3 + 31, z / 5.3);
    let c = mix(PAL.grass[0], PAL.grass[1], n1 * 0.8 + n2 * 0.2);
    if (h > 0.4) { const t = Math.min(1, h / 22); c = c.map((v, i) => v + (rgb(PAL.hill)[i] - v) * t * 0.85); if (h > 24) { const r = rgb(PAL.rock), t2 = Math.min(1, (h - 24) / 14) * (0.5 + 0.5 * n2); c = c.map((v, i) => v + (r[i] - v) * t2); } }
    if (wd > 0.02) { const t = Math.min(1, wd / 0.5), bank = rgb(PAL.bank), bed = rgb(PAL.bed); c = WK[k] ? bed.map(v => v * (0.9 + 0.1 * n2)) : c.map((v, i) => v + (bank[i] - v) * t); }
    const sl = Math.min(1, Math.hypot((HF[k + 1 < NN ? k + 1 : k] - HF[k > 0 ? k - 1 : k]), (HF[k + NX < NN ? k + NX : k] - HF[k - NX >= 0 ? k - NX : k])) / (G * 2) * 1.6);
    if (sl > 0.3) { const r = rgb(0x8a7a58); c = c.map((v, i) => v + (r[i] - v) * (sl - 0.3) * 0.7); }
    return c;
  }
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
    const WY = TY - 0.22, deep = rgb(0x2f8fa8), shallow = rgb(0x7fd0d8), foam = rgb(0xdff6f4);
    // 강(띠): 점마다 왼쪽·오른쪽 · u = 가로(물가 0/1) · v = 흐름 길이(m/6)
    { const P = [], N = [], C = [], U = [], I = [];
      for (const it of L.nature) { if (it.k !== 'water' || !it.line) continue; const sh = shapeOf(it), Q = densify(sh.line, 4), hw = sh.w / 2 + 0.6; let along = 0;
        for (let i = 0; i < Q.length; i++) { const p = Q[i], q = Q[Math.min(Q.length - 1, i + 1)], o = Q[Math.max(0, i - 1)], dx = q[0] - o[0], dz = q[1] - o[1], l = Math.hypot(dx, dz) || 1, px = -dz / l, pz = dx / l;
          if (i) along += Math.hypot(p[0] - Q[i - 1][0], p[1] - Q[i - 1][1]); const base = P.length / 3;
          for (const [sg, u] of [[1, 0], [0.55, 0.22], [0, 0.5], [-0.55, 0.78], [-1, 1]]) { P.push(p[0] + px * hw * sg, WY, p[1] + pz * hw * sg); N.push(0, 1, 0); const e = Math.abs(sg), c = e > 0.9 ? foam : e > 0.5 ? shallow : deep; C.push(...c); U.push(u * 1.2, along / 7); }
          if (i) { const b0 = base - 5; for (let k = 0; k < 4; k++) I.push(b0 + k, base + k, b0 + k + 1, b0 + k + 1, base + k, base + k + 1); } } }
      if (I.length) { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeBoundingSphere(); GEOS.push(g);
        const m = new T3.Mesh(g, MAT.river); m.matrixAutoUpdate = false; m.userData.fx = 1; group.add(m); } }
    // 연못: 물 칸(종류 2) 판 + 물가 테두리(밝게)
    { const P = [], N = [], C = [], U = [];
      for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const k = j * NX + i, ks = [k, k + 1, k + NX, k + NX + 1], w = ks.filter(q => WK[q] === 2).length; if (!w) continue;
        const pts = [[nx(i), nz(j)], [nx(i + 1), nz(j)], [nx(i + 1), nz(j + 1)], [nx(i), nz(j + 1)]], ck = [k, k + 1, k + NX + 1, k + NX].map(q => WK[q] === 2 ? (WD[q] > 1 ? deep : shallow) : foam);
        for (const t of [[0, 2, 1], [0, 3, 2]]) for (const v of t) { P.push(pts[v][0], WY, pts[v][1]); N.push(0, 1, 0); C.push(...ck[v]); U.push(pts[v][0] / 9, pts[v][1] / 9); } }
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
    if (sp === 'flower') return { trunk: null, crown: shade(new T3.OctahedronGeometry(0.17, 0).translate(0, 0.25, 0)) };
  }
  const TPL = {};   // 종류마다 본(정점 배열 · sw = 줄기 위로 올라간 만큼 — 바람에 흔들리는 무게)
  function tpl(sp) { if (TPL[sp]) return TPL[sp]; const gg = treeGeo(sp), P = [], N = [], C = [], W = [], trunkTop = { round: 2.4, pine: 1.8, poplar: 2.0 }[sp] ?? 0;
    for (const [part, g] of [['trunk', gg.trunk], ['crown', gg.crown]]) { if (!g) continue; const q = g.index ? g.toNonIndexed() : g; if (!q.attributes.normal) q.computeVertexNormals(); const pa = q.attributes.position, na = q.attributes.normal, ca = q.attributes.color;
      for (let i = 0; i < pa.count; i++) { P.push(pa.getX(i), pa.getY(i), pa.getZ(i)); N.push(na.getX(i), na.getY(i), na.getZ(i)); const v = ca ? ca.getX(i) : 1; C.push(part === 'trunk' ? -v : v); W.push(part === 'trunk' ? 0 : Math.max(0, pa.getY(i) - trunkTop)); }
      if (q !== g) q.dispose(); g.dispose(); }
    return (TPL[sp] = { P, N, C, W }); }
  function drawTrees(group) {
    const TR = rgb(0x7a5636);
    for (const sp of Object.keys(TREES)) { const A = TREES[sp]; if (!A.length) continue; const T9 = tpl(sp);
      for (const t of A) { const B = tbucket(t.x, t.z), c = Math.cos(t.ry || 0), s9 = Math.sin(t.ry || 0), k = t.s || 1, col = rgb(t.hex ?? 0x4e9a43), hy = sp === 'fruit' || sp === 'flower' ? 1 : 0.92 + ((t.x * 3 + t.z) % 5 + 5) % 5 * 0.04;
        for (let i = 0; i < T9.P.length; i += 3) { const lx = T9.P[i] * k, ly = T9.P[i + 1] * k * hy, lz = T9.P[i + 2] * k; B.p.push(t.x + lx * c + lz * s9, t.y - 0.05 + ly, t.z - lx * s9 + lz * c);
          const nx9 = T9.N[i], nz9 = T9.N[i + 2]; B.n.push(nx9 * c + nz9 * s9, T9.N[i + 1], -nx9 * s9 + nz9 * c); const v = T9.C[i / 3]; if (v < 0) B.c.push(TR[0] * -v, TR[1] * -v, TR[2] * -v); else B.c.push(col[0] * v, col[1] * v, col[2] * v); B.w.push(T9.W[i / 3] * k * (sp === 'flower' ? 0.3 : 1)); } } }
    for (const [, b] of TBK) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.setAttribute('sw', new T3.Float32BufferAttribute(b.w, 1)); g.computeBoundingSphere(); GEOS.push(g);
      const m = new T3.Mesh(g, MAT.tree); m.matrixAutoUpdate = false; m.userData.fx = 1; group.add(m); }
  }
  const pickTree = (R, sub) => sub === 'pine' ? 'pine' : sub === 'broad' ? (R() < 0.85 ? 'round' : 'poplar') : R() < 0.5 ? 'round' : R() < 0.78 ? 'pine' : R() < 0.9 ? 'poplar' : 'bush';
  const treeHex = (sp, R) => sp === 'pine' ? PAL.pine[(R() * PAL.pine.length) | 0] : PAL.tree[(R() * PAL.tree.length) | 0];
  function scatter(sh, step, f, sd) { const [x0, z0, x1, z1] = bboxOf(sh), R = rng0(sd); for (let z = z0 + step / 2; z < z1; z += step) for (let x = x0 + step / 2; x < x1; x += step) { const px = x + (R() - 0.5) * step * 0.8, pz = z + (R() - 0.5) * step * 0.8; if (inShape(sh, px, pz)) f(px, pz, R); } }

  // ───────── 들: 논(물 비친 줄 + 벼 줄) · 밭(이랑) · 과수원(줄 맞춘 과일나무) · 공원·풀밭(밝은 잔디 + 꽃 + 나무) ─────────
  function drawNature() {
    for (const it of L.nature) { const sh = shapeOf(it); if (!sh) continue; const sd = hashS(it.id || it.name || it.k);
      if (it.k === 'forest') { scatter(sh, 6.5, (x, z, R) => { const sp = pickTree(R, it.sub); addTree(sp, x, z, 0.8 + R() * 0.55, treeHex(sp, R), R() * 6); if (R() < 0.25) addTree('bush', x + 2, z + 1.5, 0.8 + R() * 0.4, treeHex('bush', R)); }, sd); continue; }
      if (it.k === 'hill') { scatter(sh, 9, (x, z, R) => { if (R() < 0.55) { const sp = R() < 0.6 ? 'pine' : 'round'; addTree(sp, x, z, 0.85 + R() * 0.5, treeHex(sp, R), R() * 6); } }, sd); continue; }
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
        const hex = sub === 'sand' ? 0xe6d3a0 : sub === 'park' ? 0x8fd06a : 0x9ccf72;
        cellsIn(sh, 2.5, (cx, cz, s2) => flat(cx - s2, cz - s2, cx + s2, cz + s2, ty(cx, cz) + 0.04, hex));
        if (sub !== 'sand') scatter(sh, 2.6, (x, z, R) => { if (R() < 0.35 && !onRoad(x, z, 0.5)) TREES.flower.push({ x, y: ty(x, z), z, s: 0.8 + R() * 0.5, hex: PAL.flower[(R() * 4) | 0], ry: 0 }); }, sd + 1);
        if (sub === 'park') { scatter(sh, 11, (x, z, R) => { if (R() < 0.5) { const sp = R() < 0.7 ? 'round' : 'poplar'; addTree(sp, x, z, 0.7 + R() * 0.35, treeHex(sp, R), R() * 6); } }, sd + 2);
          const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; strip([x0 + 2, cz], [x1 - 2, cz], 2.2, 0.08, 0xd8c9a2, { step: 3 }); strip([cx, z0 + 2], [cx, z1 - 2], 2.2, 0.081, 0xd8c9a2, { step: 3 });   // 산책길 십자
          for (const [bx, bz] of [[cx + 3, cz + 2.2], [cx - 3, cz - 2.2]]) bench(bx, bz, 0); }
      }
    }
  }
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
      const w = (b.w || 2) * S, d = (b.d || 2) * S, h = (b.h || 2) * S, ry = -(b.rot || 0) * Math.PI / 180, c = Math.cos(ry), s = Math.sin(ry);
      const corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [cx + lx * c + lz * s, cz - lx * s + lz * c]);
      const y0 = Math.min(...corners.map(([x, z]) => ty(x, z))) + (b.z || 0) * S;
      // 앞(문) = 가장 가까운 길 쪽 면
      let best = null, bseg = null; for (const sg of RSEG) { const r = segD(cx, cz, sg.a, sg.b); if (!best || r[0] < best[0]) { best = r; bseg = sg; } }
      let fl = [0, 1]; if (best) { const dx = best[2] - cx, dz = best[3] - cz, lx = dx * c - dz * s, lz = dx * s + dz * c; fl = Math.abs(lx) / w > Math.abs(lz) / d ? [Math.sign(lx) || 1, 0] : [0, Math.sign(lz) || 1]; }
      const fw = [fl[0] * c + fl[1] * s, -fl[0] * s + fl[1] * c], half = fl[0] ? w / 2 : d / 2;
      const kind = kindOf(b), door = [cx + fw[0] * (half + 2.5), cz + fw[1] * (half + 2.5)];
      const gap = best ? best[0] - bseg.hw - half : 4;   // 건물 앞면 → 길 가장자리(앞마당 너비)
      BLD.push({ b, kind, cx, cz, w, d, h, ry, c, s, y0, fl, fw, door, gap, name: b.name || null, corners, stacked: !!b.z });
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
  function roofTop(B9, o = {}) { const R = B9.R, { w, d, h, ry } = B9, top = B9.y0 + h; box(B9.cx, top, B9.cz, w, 0.22, d, ry, o.deck || 0xbfbab0, { top: o.deck || 0xbfbab0 });
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
  function streetlight(x, z, ry) { const y = ty(x, z); cyl(x, y, z, 0.11, 6.2, 0x6f767d, 6); const hx = x + Math.sin(ry) * 1.1, hz = z + Math.cos(ry) * 1.1; box((x + hx) / 2, y + 6.0, (z + hz) / 2, 0.12, 0.12, 1.3, ry, 0x6f767d); box(hx, y + 5.82, hz, 0.42, 0.18, 0.7, ry, 0xfff3c4, { B: lbucket(hx, hz) }); }
  function signalPole(x, z, ry) { const y = ty(x, z); cyl(x, y, z, 0.12, 5.4, 0x5f666d, 6); const hx = x + Math.sin(ry) * 2.4, hz = z + Math.cos(ry) * 2.4; box((x + hx) / 2, y + 5.2, (z + hz) / 2, 0.14, 0.14, 2.6, ry, 0x5f666d);
    box(hx, y + 4.6, hz, 1.25, 0.42, 0.3, ry + Math.PI / 2, 0x26282b); [0xe23a3a, 0xf2c230, 0x3cc76a].forEach((c, i) => box(hx + Math.cos(ry) * (i - 1) * 0.36, y + 4.66, hz - Math.sin(ry) * (i - 1) * 0.36, 0.26, 0.26, 0.06, ry, c, { B: lbucket(hx, hz) })); }
  function busstop(x, z, ry) { const y = ty(x, z), c = Math.cos(ry), s9 = Math.sin(ry), P = (lx, lz) => [x + lx * c + lz * s9, z - lx * s9 + lz * c];
    box(x, y + 2.55, z, 4.4, 0.16, 1.9, ry, 0x2f6fd0, { top: 0x3d7fe0 }); for (const a of [-2.0, 2.0]) { const [px, pz] = P(a, -0.75); box(px, y, pz, 0.12, 2.55, 0.12, ry, 0x7a8592); } const [bx, bz] = P(0, -0.85); box(bx, y + 0.3, bz, 4.2, 2.1, 0.06, ry, 0xbfe0ee, { B: gbucket(bx, bz) });
    const [sx, sz] = P(0, -0.35); box(sx, y + 0.45, sz, 2.8, 0.1, 0.5, ry, 0x9b6a3c); const [px9, pz9] = P(2.6, 0.6); cyl(px9, y, pz9, 0.07, 2.8, 0x7a8592, 6); box(px9, y + 2.5, pz9, 0.9, 0.6, 0.06, ry, 0x2f6fd0); }
  function fenceAround(B9) { const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => L2W(B9, a * (B9.w / 2 + 2.4), b * (B9.d / 2 + 2.4)));
    for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4], Lf = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(Lf / 1.2));
      for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; if (onRoad(x, z, 0.3) || Math.hypot(x - B9.door[0], z - B9.door[1]) < 3.2) continue; box(x, ty(x, z), z, 0.1, 1.0, 0.1, 0, 0xf6f4ee); }
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; if (!onRoad(mx, mz, 0.3)) for (const hy of [0.45, 0.85]) box(mx, ty(mx, mz) + hy, mz, Lf, 0.07, 0.05, Math.atan2(-(b[1] - a[1]), b[0] - a[0]), 0xf6f4ee); } }
  function drawFacilities() {
    const F9 = L.fac || [];
    for (const f of F9) {
      const at = f.at ? [X(f.at[0]), Z(f.at[1])] : null, k = f.k, rule = f.rule;
      const along = (bigOnly, step, fn) => { for (const s9 of RSEG) { if (bigOnly && !s9.r.big) continue; const F = segFrame(s9);
        for (const sg of [-1, 1]) for (let t = step / 2 + (sg > 0 ? step / 2 : 0); t < F.L0 - 4; t += step) { const off = s9.hw - F.sw * 0.35, x = s9.a[0] + F.tx * t + F.px * sg * off, z = s9.a[1] + F.tz * t + F.pz * sg * off;
          if (inSchool(x, z) || wAt(x, z) || onRoad(x, z, -0.5, s9.r)) continue; fn(x, z, Math.atan2(-F.px * sg, -F.pz * sg), s9, sg); } } };
      if (k === 'streetlight') { if (at) streetlight(at[0], at[1], 0); else along(rule !== 'allroads', rule === 'allroads' ? 32 : 26, (x, z, ry) => streetlight(x, z, ry)); }
      else if (k === 'streettree') { if (at) addTree('round', at[0], at[1], 0.75, 0x4e9a43); else along(rule !== 'allroads', 11, (x, z) => { TREES.round.push({ x, y: ty(x, z), z, s: 0.62, hex: PAL.tree[((x * 7 + z) % 4 + 4) % 4 | 0], ry: x % 6 }); box(x, ty(x, z) + 0.01, z, 1.4, 0.12, 1.4, 0, 0x8a6a4a, { noSide: false }); }); }
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
  const ZCOL = { live: ['red', 'orange'], work: ['yellow'], green: ['green'] };
  const occ = new Map(), occKey = (gx, gz) => gx + ':' + gz;
  const occAdd = (x0, z0, x1, z1) => { for (let gx = Math.floor(x0 / 10); gx <= Math.floor(x1 / 10); gx++) for (let gz = Math.floor(z0 / 10); gz <= Math.floor(z1 / 10); gz++) { const k = occKey(gx, gz); let a = occ.get(k); if (!a) occ.set(k, a = []); a.push([x0, z0, x1, z1]); } };
  const occHit = (x0, z0, x1, z1) => { for (let gx = Math.floor(x0 / 10); gx <= Math.floor(x1 / 10); gx++) for (let gz = Math.floor(z0 / 10); gz <= Math.floor(z1 / 10); gz++) { const a = occ.get(occKey(gx, gz)); if (a) for (const r of a) if (x0 < r[2] && x1 > r[0] && z0 < r[3] && z1 > r[1]) return true; } return false; };
  const ZFILL = [];   // 구역마다 채운 수(기록)
  function fillZones() {
    occ.clear(); ZFILL.length = 0;
    for (const B9 of BLD) { const xs = B9.corners.map(p => p[0]), zs = B9.corners.map(p => p[1]); occAdd(Math.min(...xs) - 2, Math.min(...zs) - 2, Math.max(...xs) + 2, Math.max(...zs) + 2); }
    for (const zn of L.zones || []) { const sh = shapeOf(zn); if (!sh || sh.line) continue; const R = rng0(hashS((zn.id || 'z') + ':' + LID)), dens = zn.dens || 'normal', rec = { id: zn.id, k: zn.k, note: zn.note || '', dens, n: {} };
      if (zn.k === 'green') { ZFILL.push(rec); continue; }   // 공원·들은 자연 그리기(drawZoneGreen)가
      if (BLD.some(b => !b.gen && b.kind !== 'green' && inShape(sh, b.cx, b.cz))) { rec.land = true; ZFILL.push(rec); continue; }   // 교사 10-13: 블록이 있는 칸 = 블록만(6동이면 6동) · 색종이는 조경 성격만
      const pickT = () => { const t = zn.type || (zn.k === 'work' ? 'shop' : 'mix'); if (t === 'mix') return R() < (dens === 'dense' ? 0.35 : dens === 'sparse' ? 0.05 : 0.18) ? 'apt' : 'house'; if (t === 'work' || t === 'shop') return dens === 'dense' && R() < 0.35 ? 'office' : 'shop'; return ZT[t] ? t : 'house'; };
      const rowsMax = dens === 'dense' ? 4 : dens === 'sparse' ? 1 : 2, skipP = dens === 'sparse' ? 0.38 : dens === 'dense' ? 0.02 : 0.1, gapK = dens === 'dense' ? 0.86 : dens === 'sparse' ? 1.35 : 1.0, hK = dens === 'dense' ? 1.25 : dens === 'sparse' ? 0.8 : 1;
      const cols = ZCOL[zn.k] || ['red'], put = (cx, cz, ry, T, bw, bd) => {
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
      const kids = BLD.filter(b => !b.gen && b.kind !== 'green' && inC(b.cx, b.cz)); if (!kids.length) continue;
      const zn = (L.zones || []).find(q => { const sh = shapeOf(q); return sh && !sh.line && inShape(sh, (x0 + x1) / 2, (z0 + z1) / 2); });
      const grp = zn ? zn.k : (() => { const c = { live: 0, work: 0, pub: 0 }; for (const b of kids) c[(KIND[b.kind] || {}).g || 'pub']++; return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; })();
      const R = rng0(hashS('land:' + ci + ':' + ri + ':' + LID)), n = { 나무: 0, '주차 칸': 0, 놀이터: 0, 벤치: 0 }, free = (x, z, r = 1.5) => !onRoad(x, z, 1.2) && !wAt(x, z) && !inSchool(x, z) && tH(x, z) < 4 && !occHit(x - r, z - r, x + r, z + r);
      const near = (x, z, m) => kids.some(b => Math.hypot(x - b.cx, z - b.cz) < Math.max(b.w, b.d) / 2 + m);   // 블록 사이·둘레만(칸 전체를 숲으로 만들지 않음)
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
      const pT = grp === 'live' ? 0.5 : grp === 'work' ? 0.25 : 0.4;
      for (let z = z0 + 4; z < z1 - 2; z += 8) for (let x = x0 + 4; x < x1 - 2; x += 8) { const px = x + (R() - 0.5) * 5, pz = z + (R() - 0.5) * 5; if (R() > pT || !near(px, pz, 30) || !free(px, pz, 1.6)) continue; const sp = R() < 0.65 ? 'round' : R() < 0.5 ? 'poplar' : 'pine';
        TREES[sp].push({ x: px, y: ty(px, pz), z: pz, s: 0.7 + R() * 0.35, hex: treeHex(sp, R), ry: R() * 6 }); n.나무++; }
      ZFILL.push({ id: 'land:' + cellOf((x0 + x1) / 2, (z0 + z1) / 2), k: 'land', cell: cellOf((x0 + x1) / 2, (z0 + z1) / 2), note: zn ? zn.note || '' : '', dens: '', n }); }
  }
  function drawZonePaper() {   // 🧱 매트 모습: 색종이 구역 그대로(얇은 종이 판)
    for (const zn of L.zones || []) { const sh = shapeOf(zn); if (!sh || sh.line) continue; const hex = COL[zn.c || (ZCOL[zn.k] || ['red'])[0]] ?? 0xe0453a;
      C3.setHex(hex); C3.lerp(new T3.Color(0xffffff), 0.12); const ph = C3.getHex(); cellsIn(sh, 2.5, (cx, cz, s2) => { if (onRoad(cx, cz, 0)) return; flat(cx - s2, cz - s2, cx + s2, cz + s2, ty(cx, cz) + 0.07, ph); }); } }
  function drawZoneGreen() {   // 초록 구역(공원·들) = 공원(잔디·산책길·나무) 또는 들(type 'field' — 밭)
    for (const zn of L.zones || []) { if (zn.k !== 'green') continue; const t = zn.type === 'field' ? 'farm' : zn.type === 'rice' ? 'rice' : 'park'; L.nature.push({ id: '__z' + zn.id, k: 'field', sub: t, rect: zn.rect, poly: zn.poly, gen: zn.id }); } }
  // 건물 둘레 땅(쓰임별 바닥 — AI가 채운 빈칸): 집 = 마당 잔디 + 디딤돌 길 · 가게·공공 = 앞마당 보도블록 + 주차장 칸 · 공장 = 콘크리트 마당
  function lot(B9) { const k = B9.kind; if (k === 'green' || k === 'park') return; const R = B9.R, front = Math.max(0, Math.min(12, B9.gap ?? 4)), side = k === 'house' ? 2.6 : 4, back = k === 'house' ? 3 : 2.5;
    const surf = k === 'house' ? 0x86c45f : k === 'factory' ? 0xbdbab2 : 0xd2cbbe, yo = k === 'house' ? 0.03 : 0.035, fl = B9.fl;
    const ext = (a) => a === 'f' ? front : a === 'b' ? back : side, hw = B9.w / 2, hd = B9.d / 2;
    const lx0 = -hw - (fl[0] === -1 ? ext('f') : fl[0] === 1 ? ext('b') : ext('s')), lx1 = hw + (fl[0] === 1 ? ext('f') : fl[0] === -1 ? ext('b') : ext('s')), lz0 = -hd - (fl[1] === -1 ? ext('f') : fl[1] === 1 ? ext('b') : ext('s')), lz1 = hd + (fl[1] === 1 ? ext('f') : fl[1] === -1 ? ext('b') : ext('s'));
    const cell = 2, ok = (x, z) => !onRoad(x, z, 0.4) && !wAt(x, z) && !inSchool(x, z);
    for (let lz = lz0; lz < lz1 - 0.01; lz += cell) for (let lx = lx0; lx < lx1 - 0.01; lx += cell) { const ax = Math.min(lx + cell, lx1), az = Math.min(lz + cell, lz1), [x, z] = L2W(B9, (lx + ax) / 2, (lz + az) / 2); if (!ok(x, z)) continue;
      const Pc = [[lx, lz], [ax, lz], [ax, az], [lx, az]].map(([a, b]) => { const q = L2W(B9, a, b); return [q[0], ty(q[0], q[1]) + yo, q[1]]; }); quad(bucket(x, z), Pc[3], Pc[2], Pc[1], Pc[0], rgb(surf)); }
    // 앞길(문 → 인도): 집 = 디딤돌 · 나머지 = 보도블록 넓게
    const f = frontF(B9), half = f[3], fwL = [fl[0], fl[1]];
    for (let t = half + 0.2; t < half + front - 0.2; t += 1.1) { const [x, z] = L2W(B9, fwL[0] * t, fwL[1] * t); if (!ok(x, z)) continue; box(x, ty(x, z) + 0.02, z, k === 'house' ? 0.9 : 3.2, 0.06, k === 'house' ? 0.7 : 1.1, B9.ry, k === 'house' ? 0xd9cfbb : 0xc9c2b4, { noSide: true }); }
    // 주차장(가게·공공·아파트·공장 — 앞마당 한쪽): 아스팔트 + 흰 칸 줄
    if (k !== 'house' && front > 7) { const sideSign = R() < 0.5 ? -1 : 1, along = fl[0] ? [0, 1] : [1, 0], span = (fl[0] ? B9.d : B9.w) / 2;
      for (let t = 1.25; t < span + side - 1.2; t += 2.5) for (const r of [0]) { void r; const base = half + front / 2; const [x, z] = L2W(B9, fwL[0] * base + along[0] * sideSign * t, fwL[1] * base + along[1] * sideSign * t); if (!ok(x, z)) continue;
        box(x, ty(x, z) + 0.045, z, fl[0] ? front - 1 : 2.5, 0.01, fl[0] ? 2.5 : front - 1, B9.ry, 0x5f6368, { noSide: true });
        const [lx9, lz9] = L2W(B9, fwL[0] * base + along[0] * sideSign * (t + 1.25), fwL[1] * base + along[1] * sideSign * (t + 1.25)); box(lx9, ty(lx9, lz9) + 0.05, lz9, fl[0] ? front - 1.6 : 0.12, 0.01, fl[0] ? 0.12 : front - 1.6, B9.ry, 0xf2f1ea, { noSide: true }); } }
  }
  function markTop(B9) { const { cx, cz, h, y0 } = B9, col = COL[B9.b.c] ?? 0xcccccc, top = y0 + h + (B9.kind === 'house' ? 3 : 0.25);
    cyl(cx, top, cz, 1.6, 1.2, 0xe8e4da, 10); cyl(cx, top + 1.2, cz, 0.45, 9, col, 8); cyl(cx, top + 10.2, cz, 0.9, 0.9, 0xf2c230, 10, { top: 0xfff3c4 }); box(cx + 1.0, top + 7.8, cz, 2.0, 1.2, 0.06, 0, col);   // 첨탑 + 금빛 공 + 깃발
    for (const sg of [-1, 1]) box(cx, top + 0.6, cz, B9.w * 0.6, 0.25, 0.25, B9.ry + (sg > 0 ? 0 : Math.PI / 2), col); }
  function buildTown(B9) {
    const { cx, cz, w, d, h, ry, y0, kind } = B9, col = COL[B9.b.c] ?? 0xcccccc, R = B9.R = rng0(hashS((B9.b.id || '') + ':' + cx.toFixed(1)));
    if (!B9.gen && isMark(B9.b) && kind !== 'green') { const k0 = B9.kind; buildTown2(B9); markTop({ ...B9, kind: k0 }); return; }
    buildTown2(B9); }
  function buildTown2(B9) {
    const { cx, cz, w, d, h, ry, y0, kind } = B9, col = COL[B9.b.c] ?? 0xcccccc, R = B9.R;
    lot(B9);
    const roofFlat = (hex = 0xcfccc4) => roofTop(B9, { deck: hex });
    if (kind === 'green') { const n = Math.max(1, Math.round(w * d / 45)); for (let i = 0; i < n; i++) { const sp = R() < 0.6 ? 'round' : 'pine'; addTreeF(sp, cx + (R() - 0.5) * w * 0.7, cz + (R() - 0.5) * d * 0.7, 0.8 + R() * 0.5, treeHex(sp, R)); }
      if (B9.b.h <= 1 && w * d > 120) box(cx, y0, cz, w, 0.1, d, ry, 0x8fd06a, { noSide: true }); return; }
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
      fbox(B9, ff, 0, cy9, ch * 0.32, ch, 0.15, 0xe0453a, { out: 0.05 }); fbox(B9, ff, 0, cy9 + ch * 0.34, ch, ch * 0.32, 0.15, 0xe0453a, { out: 0.05 });   // 빨간 십자
      box(cx, y0 + h + 0.25, cz, 3.8, 0.06, 1.2, ry, 0xe0453a); box(cx, y0 + h + 0.25, cz, 1.2, 0.07, 3.8, ry, 0xe0453a);
      const [vx, vz] = L2W(B9, B9.fl[0] * (w / 2 + 3.4) + (B9.fl[0] ? 0 : -w * 0.3), B9.fl[1] * (d / 2 + 3.4) + (B9.fl[1] ? 0 : -d * 0.3)); vehicle(vx, vz, B9.ry + (B9.fl[0] ? Math.PI / 2 : 0), 'amb'); return; }
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
  function prepPlaces() {
    PLACES = [];
    PLACES.push({ id: 'school', name: '우리 학교', en: 'Our School', kind: 'school', x: 16.5, z: 50, door: [16.5, 58], icon: '🏫', school: true });
    for (const B9 of BLD) { if (!B9.gen && !B9.name && B9.kind === 'hospital') B9.name = '병원';   // 교사 10-13: 흰 블록 = 병원(이름표 없어도)
      if (!B9.name && !B9.b.home) continue; const k = KIND[B9.kind] || {};
      PLACES.push({ id: B9.b.id, name: B9.name || (B9.b.home + '네 집'), en: B9.b.en || (B9.b.home ? B9.b.home + "'s House" : null), kind: B9.kind, x: B9.cx, z: B9.cz, door: B9.door, icon: k.emo || '🏠', sym: k.sym || '◆', ai: B9.b.ai || null, home: B9.b.home || null }); }
    for (const it of L.nature) { if (!it.name) continue; const sh = shapeOf(it); if (!sh) continue; const bb = bboxOf(sh); let cx = (bb[0] + bb[2]) / 2, cz = (bb[1] + bb[3]) / 2;
      if (sh.line) { const P = sh.line, m = P[Math.floor(P.length / 2)]; cx = m[0]; cz = m[1]; }
      const kk = it.k === 'field' ? it.sub || 'grass' : it.k; PLACES.push({ id: it.id, name: it.name, en: it.en, kind: kk, x: cx, z: cz, door: [cx, cz], icon: { hill: '⛰', water: '💧', forest: '🌲', rice: '🌾', farm: '🌱', orchard: '🍎', park: '🌳', grass: '🌿', sand: '⛱' }[kk] || '🌿', sym: { hill: '⛰', water: '〰', forest: '♣', rice: 'ıı', farm: 'ㅛ', orchard: 'ⓞ', park: '♣', grass: '⺾' }[kk] || '◇', nat: true, ai: it.ai || null }); }
  }
  function buildGraph() {
    const nodes = [], key = (x, z) => Math.round(x * 2) + ':' + Math.round(z * 2), idx = new Map(), adj = [];
    const node = (x, z) => { const k = key(x, z); let i = idx.get(k); if (i == null) { i = nodes.length; nodes.push([x, z]); idx.set(k, i); adj.push([]); } return i; };
    const cuts = RSEG.map(() => [0, 1]);
    RSEG.forEach((s, i) => RSEG.forEach((o, j) => { if (i >= j) return; const X9 = segX(s.a, s.b, o.a, o.b); if (X9) { cuts[i].push(X9.t); cuts[j].push(X9.u); }
      // T자(끝이 다른 길 위 — 테이프가 조금 짧거나 길어도 잇기)
      for (const [P, si, oj, Ls] of [[s.a, i, j, o], [s.b, i, j, o], [o.a, j, i, s], [o.b, j, i, s]]) { const r = segD(P[0], P[1], Ls.a, Ls.b); if (r[0] < Ls.hw + 3 && r[1] > 0.001 && r[1] < 0.999) cuts[oj].push(r[1]); } }));
    RSEG.forEach((s, i) => { const T = [...new Set(cuts[i].map(t => Math.round(t * 1e4) / 1e4))].sort((a, b) => a - b); let prev = null;
      for (const t of T) { const x = s.a[0] + (s.b[0] - s.a[0]) * t, z = s.a[1] + (s.b[1] - s.a[1]) * t; let n = node(x, z);
        // 가까운 기존 마디에 붙이기(T자 끝점)
        for (let q = 0; q < nodes.length; q++) if (q !== n && Math.hypot(nodes[q][0] - x, nodes[q][1] - z) < Math.max(3, s.hw)) { n = q; break; }
        if (prev != null && prev !== n) { const L9 = Math.hypot(nodes[n][0] - nodes[prev][0], nodes[n][1] - nodes[prev][1]); if (!crossesSchool(nodes[prev], nodes[n])) { adj[prev].push([n, L9]); adj[n].push([prev, L9]); } } prev = n; } });
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
  { const t2 = ripple.clone(); t2.needsUpdate = true; TEX.push(t2); MAT.pond.map = t2; }
  for (const k in MAT) MATS.push(MAT[k]);
  let DMESH = [], RING = null;
  let ROOT = null, COLS = [], LABELS = [], STATS = null, mapDirty = true, bigOpen = false, routeNow = null;
  async function build() {
    if (ROOT) { map.remove(ROOT); ROOT.traverse(o => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } }); for (const g of GEOS) g.dispose(); GEOS.length = 0; } for (const h of COLS) h.remove(); COLS = []; LABELS = [];
    BK.clear(); TBK.clear(); FBK.clear(); GBK.clear(); LB.clear(); DBK.clear(); for (const k in TREES) TREES[k].length = 0; BRIDGES.length = 0;
    prepRoads(); buildTerrain(); prepBlocks(); L.nature = L.nature.filter(n => !n.gen); ZFILL.length = 0; if (LOOK === 'town') { drawZoneGreen(); fillZones(); } prepPlaces(); buildGraph();
    ROOT = new T3.Group(); ROOT.userData.fx = 1;
    drawGround(ROOT); drawWater(ROOT); drawRoads(); drawNature();
    if (LOOK === 'mat') drawZonePaper();
    for (const B9 of BLD) { if (LOOK === 'mat') buildMat(B9); else buildTown(B9); }
    if (LOOK === 'town') landscape();
    if (LOOK === 'town') drawFacilities();
    for (const [, b] of BK) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(b.u, 2)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT.solid); m.matrixAutoUpdate = false; m.receiveShadow = true; ROOT.add(m); }
    DMESH = []; for (const [, b] of DBK) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(b.u, 2)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT.solid); m.matrixAutoUpdate = false; m.userData.c = [b.cx, b.cz]; ROOT.add(m); DMESH.push(m); }
    for (const [, b] of LB) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT.lamp); m.matrixAutoUpdate = false; ROOT.add(m); }
    for (const [, b] of GBK) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(b.c, 3)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT.glass); m.matrixAutoUpdate = false; ROOT.add(m); }
    for (const [, b] of FBK) { if (!b.p.length) continue; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new T3.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new T3.Float32BufferAttribute(b.u, 2)); g.computeBoundingSphere(); GEOS.push(g); const m = new T3.Mesh(g, MAT[b.kind]); m.matrixAutoUpdate = false; m.receiveShadow = true; ROOT.add(m); }
    drawTrees(ROOT); drawLabels(ROOT);
    map.add(ROOT);
    // 충돌: 건물(발자국 상자) · 물(칸 줄 — 다리 칸은 뺌) · 다리 판 · 나무 줄기
    for (const B9 of BLD) { if (B9.kind === 'green' || B9.kind === 'park') continue; const xs = B9.corners.map(p => p[0]), zs = B9.corners.map(p => p[1]); const top = B9.y0 + B9.h + (LOOK === 'town' && B9.kind === 'house' ? 2 : 0);
      COLS.push(map.collider.add({ x0: Math.min(...xs), x1: Math.max(...xs), y0: B9.y0 - 2, y1: Math.max(top, B9.y0 + 1.9), z0: Math.min(...zs), z1: Math.max(...zs) })); }
    for (let j = 0; j < NZ - 1; j++) { let run = -1; for (let i = 0; i <= NX - 1; i++) { const k = j * NX + i, w = i < NX - 1 && (WK[k] || WK[k + 1] || WK[k + NX] || WK[k + NX + 1]) && !(NR[k] && NR[k + NX + 1]); const x = nx(i), z = nz(j);
      if (w && run < 0) run = i; if ((!w || i === NX - 1) && run >= 0) { COLS.push(map.collider.add({ x0: nx(run) + 0.8, x1: nx(i) - 0.8, y0: TY - 3, y1: TY + 1.75, z0: z + 0.8, z1: z + G - 0.8 })); run = -1; } } }
    for (const br of BRIDGES) COLS.push(map.collider.add({ x0: br.x0, x1: br.x1, y0: br.y1 - 0.5, y1: br.y1, z0: br.z0, z1: br.z1 }));
    for (const sp of ['round', 'pine', 'poplar']) for (const t of TREES[sp]) COLS.push(map.collider.add({ x0: t.x - 0.3 * t.s, x1: t.x + 0.3 * t.s, y0: t.y - 1, y1: t.y + 2.2 * t.s, z0: t.z - 0.3 * t.s, z1: t.z + 0.3 * t.s }));
    STATS = stats(); mapDirty = true;
  }
  function drawLabels(group) {   // 이름표(이름 있는 건물·자연 · 아이 집) — 캔버스 한 장씩(스무 개 안팎)
    for (const p of PLACES) { if (p.school) continue; const t = (p.home ? '🏠 ' : '') + nameOf(p); const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = '800 44px sans-serif'; const w = Math.ceil(g.measureText(t).width) + 40; c.width = w; c.height = 72;
      g.font = '800 44px sans-serif'; g.fillStyle = p.nat ? 'rgba(40,90,60,.88)' : 'rgba(29,53,87,.9)'; const r = 30; g.beginPath(); g.moveTo(r, 4); g.arcTo(w - 4, 4, w - 4, 68, r); g.arcTo(w - 4, 68, 4, 68, r); g.arcTo(4, 68, 4, 4, r); g.arcTo(4, 4, w - 4, 4, r); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, w / 2, 38);
      const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; const sp = new T3.Sprite(new T3.SpriteMaterial({ map: tx, depthWrite: false })); const B9 = BLD.find(b => b.b.id === p.id);
      const top = B9 ? B9.y0 + B9.h * (B9.kind === 'fire' ? 1.6 : 1) + 4 : ty(p.x, p.z) + (p.kind === 'hill' ? ((L.nature.find(n => n.id === p.id) || {}).h || 2) * S + 6 : 5);
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
  const OUT = map.world.outside({ terrain: (x, z) => inSchool(x, z) ? null : (x < TX0 || x > TX1 || z < TZ0 || z > TZ1) ? TY : TY + tH(x, z) });
  map.arena.set({ rect: [TX0 + 3, TZ0 + 3, TX1 - 3, TZ1 - 3], msg: '🏘 여기가 마을 끝이에요' });
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
    MAT.glass.emissive.setHex(night ? 0xb8862e : dusk ? 0x3a2810 : 0x000000); MAT.lamp.color.setHex(night ? 0xffffff : dusk ? 0xece4cc : 0xb4b4b4); if (MAT.ring) MAT.ring.color.setScalar(night ? 0.32 : dusk ? 0.78 : 1); };
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
    // 길
    for (const s of RSEG) { const [a, b] = P(s.a[0], s.a[1]), [c, d] = P(s.b[0], s.b[1]); ctx.lineCap = 'round'; ctx.strokeStyle = '#8a8f95'; ctx.lineWidth = Math.max(1.6, s.hw * 2 * sc + 2); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke();
      ctx.strokeStyle = '#f7f6f2'; ctx.lineWidth = Math.max(1, s.hw * 2 * sc - 1); ctx.stroke(); }
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
    const fac = (L.fac || []), sec = (t, body) => '<div class="grp">' + t + '</div>' + body;
    openP('<h3>📋 기록 — 누가 만든 것인가요?</h3><div class="sm">아이들이 정한 것과 Claude가 채운 것을 나눠 적어요(섞이지 않게)</div>'
      + sec('🧱 아이가 놓은 블록 ' + kids.length + '개', '<div class="ai" style="background:#eef5ea"><span>' + (cnt(byK) || '없음') + (kids.some(b => b.name) ? '<br>이름: ' + kids.filter(b => b.name).map(b => esc(b.name)).join(' · ') : '') + '</span></div>')
      + sec('🏘 Claude가 구역에 채운 건물 ' + BLD.filter(b => b.gen).length + '채', (ZFILL.length ? ZFILL.map(z => '<div class="ai" style="background:#eef2fb"><span>' + (z.k === 'land' ? esc(z.cell) + ' 칸(아이 블록 사이) — 조경: ' + (Object.entries(z.n).filter(([, v]) => v).map(([k, v]) => k + ' ' + v).join(' · ') || '없음') : esc(ZK[z.k] || z.k) + ' 구역(' + esc(DN[z.dens] || z.dens) + (z.note ? ' · 「' + esc(z.note) + '」' : '') + ') → ' + (z.land ? '블록이 있는 칸이라 건물은 더 넣지 않음(조경만)' : cnt(z.n) || (z.k === 'green' ? '공원·들로 꾸밈' : '채울 자리가 없었어요'))) + '</span></div>').join('') : '<div class="sm">구역(색종이)이 없어요</div>'))
      + sec('🙋 아이가 요구해서 생긴 시설 ' + fac.length, fac.length ? fac.map(f => '<div class="ai" style="background:#fdf0f4"><span>' + esc(FACK[f.k] ? FACK[f.k].ko : f.k) + (f.rule ? ' — ' + esc(RULEK[f.rule] || f.rule) : ' — 정한 자리') + (f.by ? ' · 🙋 ' + esc(f.by) : '') + (f.why ? ' · 「' + esc(f.why) + '」' : '') + '</span></div>').join('') : '<div class="sm">아직 없어요 — 둘러보고 필요한 것을 말하면 생겨요(가로등·횡단보도·벤치…)</div>')
      + '<div class="row"><button class="sub" data-a="ai">✨ AI가 어림한 것 보기</button><button class="sub" data-a="x">닫기</button></div>');
    panel.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'x') closeP(); else if (b.dataset.a === 'ai') openAI(); };
  }
  function openAI() {
    const list = [...(D.ai || []).map(a => ({ t: a.t, at: a.at ? [X(a.at[0]), Z(a.at[1])] : null }))];
    for (const it of [...L.blocks, ...L.nature, ...L.roads]) if (it.ai) { const p = PLACES.find(q => q.id === it.id); const sh = it.x != null ? null : shapeOf(it); const bb = sh ? bboxOf(sh) : null;
      list.push({ t: (it.name ? '「' + it.name + '」 ' : (KIND[kindOf(it)] || {}).ko ? '(' + (it.x != null ? (KIND[kindOf(it)] || {}).ko : '') + ') ' : '') + it.ai, at: p ? [p.x, p.z] : it.x != null ? [X(it.x), Z(it.y)] : bb ? [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2] : null }); }
    const auto = ['🏘 마을 모습의 건물 모양은 판의 색 규칙(빨강·주황 = 집 · 노랑 = 가게 · 파랑 = 공공 · 흰색 = 병원)과 이름표로 정했어요', '🚪 건물 앞문은 가장 가까운 길 쪽으로 정했어요', '⛰ 쌓은 높이를 둥근 언덕으로 바꿨어요(봉우리 모양은 AI가 정함)', ...(SCHOOLB ? ['🏫 학교 칸의 블록 ' + SCHOOLB + '개는 실제 학교 모델로 대신했어요(학교 칸 = 실제 크기 · 둘레 길은 담 바깥으로)'] : []), '🌳 숲·논밭 안의 나무·벼 줄 수는 AI가 정했어요', '👪 사는 사람 수는 집 1채 = ' + ({ house: 4, apt: 10, ...(D.pop || {}) }).house + '명 · 아파트 한 층 = ' + ({ house: 4, apt: 10, ...(D.pop || {}) }).apt + '명으로 어림했어요(선생님과 정하는 값)'];
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
    ground: (x, z) => ty(x, z), get root() { return ROOT; }, get mats() { return MAT; }, toWorld: (mx, my) => [X(mx), Z(my)], toMat: (x, z) => [MXof(x), MYof(z)], stats: () => ({ ...STATS }), setLayer, setLook, show: q => { const p = findPlace(q); return p ? showRoute(p) : null; }, bus: q => { const p = findPlace(q); if (p) busTo(p); return !!p; }, cell: (x, z) => cellOf(x, z),
    get counts() { return { bld: BLD.length, trees: Object.fromEntries(Object.entries(TREES).map(([k, v]) => [k, v.length])), cols: COLS.length, bridges: BRIDGES.length, nodes: GRAPH ? GRAPH.nodes.length : 0, regions: BK.size, hidden: OUT.hidden }; }, setLang: l => { LANG = l === 'en' ? 'en' : 'ko'; relabel(); } };

  // 지금 할 일 줄(가까운 장소 · 4번/초) · 물 흐름 · 나무 흔들림 · 자전거 · 작은 지도
  let near9 = '', tq = 0, mq = 0;
  return {
    tick(dt) {
      WT.value += dt; ripple.offset.y -= dt * 0.16; MAT.pond.map.offset.x += dt * 0.012; MAT.pond.map.offset.y += dt * 0.008;
      const me = map.player.get();
      if (bikeM && bike) { bikeM.position.set(me.x, me.y, me.z); bikeM.rotation.y = me.h || 0; }
      if ((mq += dt) > 0.2) { mq = 0; drawMini(); const cp = map.camera.position; for (const m of DMESH) m.visible = Math.hypot(cp.x - m.userData.c[0], cp.z - m.userData.c[1]) < 60 + REG * 0.71; }
      if (RING) { const cp = map.camera.position, tv = !!(map.top && map.top.on); RING.position.set(cp.x, TY, cp.z); RING.visible = !tv; if (tv && !cloudsOff.length && !topH) clouds(false); else if (!tv && cloudsOff.length && !topH) clouds(true); }
      if ((tq += dt) > 0.25) { tq = 0; if (routeNow) { const end = routeNow.to.door; if (Math.hypot(me.x - end[0], me.z - end[1]) < 6) { map.hud.goal('🎉 ' + nameOf(routeNow.to) + '에 왔어요!'); map.sfx('ding'); routeNow = null; if (trailH) { trailH.remove(); trailH = null; } setTimeout(() => { if (!dead) near9 = ''; }, 2500); } return; }
        let best = null, bd = 30; for (const p of PLACES) { const d = Math.hypot(p.x - me.x, p.z - me.z) - (p.nat ? 25 : 8); if (d < bd) { bd = d; best = p; } }
        const t = inSchool(me.x, me.z) ? '🏫 우리 학교 — 정문(남쪽)으로 나가면 마을이에요' : (best ? '📍 ' + best.icon + ' ' + nameOf(best) + (best.nat ? '' : ' 앞') : '📍 ' + nameOf(L) + ' 마을 길') + ' · ' + cellOf(me.x, me.z);
        if (t !== near9) { near9 = t; map.hud.goal(t); } }
    },
    stop() { dead = true; clouds(true); removeEventListener('keydown', keyDn, true);
      { const me = map.player.get(); if (!inSchool(me.x, me.z)) { map.player.teleport([16.5, -1.3, 50]); map.player.lookAt([16.5, 0]); } }   /* 마을을 나가면 학교 정문 안으로(마을 땅이 사라지므로) */ closeP(); css.remove(); miniBox.remove(); if (trailH) trailH.remove(); if (bike) map.player.speed(1); if (bikeM) map.remove(bikeM);
      if (ROOT) { map.remove(ROOT); ROOT.traverse(o => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } }); } for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose(); for (const t of TEX) t.dispose(); ripple.dispose();
      if (window.SM_TOWN) delete window.SM_TOWN; }
  };
}
