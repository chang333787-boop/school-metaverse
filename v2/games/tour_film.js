// FILM-1(10-04) 견학 오프닝·클로징 장면 대본 — 글·숫자·영상 주소 = tour_data.js 'film'(교사) · 카메라 길·지붕 벗기기 상자 = 여기 · 재생기 = v2/js/film.js
//   좌표 = layout.js 기준(x 동+ · z 남+) · 장소 = world.tour(견학 지점 자리)에서 읽어 맵이 바뀌어도 따라간다.
// 지붕 벗기기 상자 = 본관 건물 전체(가장자리가 빈 땅에 오게 — 상자 옆면이 지붕·처마를 세로로 자르면 속 빈 단면이 반짝였다 · 10-04 교사 'AI 장면 반짝임')
const MAIN_CUT = { y: 3.0, box: [-41.3, -51.6, 52.1, -19.8] };
const RAS = { R: '#4dabf7', A: '#ff7a59', S: '#38c98a', AI: '#9b8cff', ECO: '#7bd35a' };
const ytId = u => { const m = String(u || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : null; };
const clipOf = (c, title) => { const id = c && ytId(c.url); return id ? { id, start: +c.start || 0, end: +c.end || 0, title: c.title || title || '정림초 유튜브', at: 0.9 } : null; };

export function buildOpening(D, ctx) {
  const F = D.film || {}; if (F.opening === false) return null;
  const sp = k => { const s = (ctx.spots || []).find(q => q.key === k); return s ? [s.x, s.y, s.z] : null; };
  const vids = new Map(); for (const s of Object.values(D.spots || {})) for (const v of [].concat(s.videos || [])) if (v && v.url && ytId(v.url)) vids.set(ytId(v.url), v.title || '');
  const clip = c => { const k = clipOf(c); if (k && !c.title) k.title = vids.get(k.id) || k.title; return k; };
  const ch = Object.fromEntries((F.chapters || []).map(c => [c.key, c]));
  const shots = [];
  // 0 · 검은 화면 — 폰 끄기 → R·A·S 켜기(이 동안 지붕 벗기기 셰이더를 미리 짓는다)
  shots.push({ dur: 5.0, black: true, cam: { p: [[-10, 105, 62]], l: [[-12, 0, -16]] }, ui: [{ type: 'lock', at: 0.25, out: 4.6, w1: 'Phone Off,', w2: 'RAS On!', sub: F.badge || '',
    dots: [{ k: 'R', w: 'READING', c: RAS.R }, { k: 'A', w: 'ARTS', c: RAS.A }, { k: 'S', w: 'SPORTS', c: RAS.S }] }] });
  // 1 · 등굣길 낮은 데서 솟아오르며 학교 전체 + 이름표
  const bus = sp('bus') || [8.2, -1.35, 47.4], tree = sp('bigtree') || [34.2, -1.35, 25.8], forest = sp('forest') || [30.2, -1.35, 43.9];
  shots.push({ dur: 8.6, fadeIn: true, chord: 'C', sfx: [[0, 'whoosh'], [3.3, 'boom']],
    cam: { p: [[0, 3.2, 33], [-3, 14, 42], [-6, 46, 74], [-10, 98, 66]], l: [[0, 3, -2], [-2, 2, -6], [-6, 0, -10], [-12, 0, -17]] },   // 운동장 남쪽 낮은 데서 → 뒤로·위로
    ui: [{ kick: F.place || '', title: F.title || '정림초등학교', at: 3.3, out: 8.3, pos: 'lower' }],
    tags: [['체육관', [-66, 9, -15]], ['본관', [8, 5.5, -29]], ['급식실', [4, 5, -42]], ['운동장', [-2, -0.5, 6]], ['큰 나무', [tree[0], tree[1] + 10, tree[2]]], ['숲놀이터', [forest[0] + 3, forest[1] + 2, forest[2] + 3]], ['텃밭', [30, 0.5, -68]], ['스쿨버스', [bus[0], bus[1] + 3.2, bus[2]]]]
      .map(([t, p], k) => ({ t, p, at: 4.4 + k * 0.22 })) });
  // 1.5 · 우리 학교 한눈에 — 위에서 내려다본 지도에 견학 길이 그려지며 장소 핀(FILM-2)
  const RT = F.route || {}, ROUTE = ['bus', 'playground', 'forest', 'bigtree', 'ai', 'science', 'cafeteria', 'garden', 'library', 'pe'];
  const pts = ROUTE.map(k => { const q = sp(k), d = (D.spots || {})[k] || {}; return q && d.on !== false ? { p: [q[0], q[1] + 1, q[2]], t: d.name || k, i: d.stamp || '📍' } : null; }).filter(Boolean);
  if (RT.on !== false && pts.length > 2) shots.push({ dur: 8.4, chord: 'F', sfx: [[0.1, 'whoosh']], cam: { p: [[-8, 168, 44], [-11, 176, 34]], l: [[-11, 0, -4], [-12, 0, -8]] }, fov: 46,   // 학교 전체(스쿨버스까지)가 지도처럼 들어오게
    ui: [{ type: 'route', at: 0.2, out: 8.1, pts, draw: 5.2, kick: RT.kick || '우리 학교 한눈에', title: RT.title || '' }] });
  // 2 · 숫자로 보는 정림초 — 1층 높이에서 자른 본관(인형의 집) 위를 천천히
  if (F.stats && (F.stats.items || []).length) shots.push({ dur: 9.6, chord: 'Am', cut: MAIN_CUT,
    cam: { p: [[-34, 50, 18], [-22, 54, 12]], l: [[-2, 0, -36], [8, 0, -38]] },
    ui: [{ type: 'stats', at: 0.2, out: 9.3, kick: F.stats.kick, title: F.stats.title, items: F.stats.items }] });
  // 2.5 · 공모사업 막대그래프 — 본관 앞을 천천히 옆으로(FILM-2)
  const GR = F.grants;
  if (GR && (GR.items || []).length) shots.push({ dur: 8.2, chord: 'G', cam: { p: [[-30, 11, 2], [-14, 10, 0]], l: [[-20, 2, -30], [-4, 2, -30]] },
    ui: [{ type: 'bars', at: 0.2, out: 7.9, kick: GR.kick, title: GR.title, items: GR.items, unit: GR.unit || '', c1: '#ffd23c', c2: '#ff7a59' }] });
  // 3~7 · 갈래(R · A · S · AI · 생태) — 장소마다 카메라 · 지붕 벗기기 · 영상 조각
  const lib = sp('library') || [-22.4, 0, -36.5], ai = sp('ai') || [25.6, 0, -28.4], garden = sp('garden') || [18, -0.3, -58.9];
  const CAM = {
    R: { chord: 'F', cut: MAIN_CUT, p: [[lib[0] + 16.4, 21, lib[2] + 16.5], [lib[0] + 13.4, 17.5, lib[2] + 13.5]], l: [[lib[0] - 1.6, 0, lib[2] - 4.5], [lib[0] - 2.1, 0, lib[2] - 4.5]] },
    A: { chord: 'G', p: [[tree[0] - 34, 9, tree[2] + 2], [tree[0] - 22, 7.5, tree[2] + 9]], l: [[tree[0] - 2, 2, tree[2] + 10], [tree[0] + 2, 2, tree[2] + 14]] },   // 10-04 교사: A = 나무 쪽 · S = 강당
    S: { chord: 'Em', cut: { y: 5.4, box: [-82, -31, -50.5, -3.5] }, p: [[-45, 19, -3], [-49, 15, -7]], l: [[-60, 1, -25], [-61, 1, -26]] },
    AI: { chord: 'Am', cut: MAIN_CUT, p: [[ai[0] + 18, 15, ai[2] + 12], [ai[0] + 14, 12, ai[2] + 9.5]], l: [[ai[0] + 8, 0, ai[2] - 2], [ai[0] + 7, 0, ai[2] - 2.5]] },
    ECO: { chord: 'Dm', p: [[garden[0] - 10, 26, garden[2] + 22], [garden[0] + 6, 21, garden[2] + 19]], l: [[garden[0] + 14, 0, garden[2] - 10], [garden[0] + 20, 0, garden[2] - 12]] },
  };
  const ORD = ['R', 'A', 'S', 'AI', 'ECO'].filter(k => ch[k] && CAM[k]), NAV = ORD.map(k => ({ t: k === 'ECO' ? '생태' : k, c: RAS[k] }));
  for (const k of ORD) { const c = ch[k], m = CAM[k], idx = ORD.indexOf(k);
    const big = k === 'ECO' ? '🌱' : k;
    shots.push({ dur: c.clip ? 6.8 : 5.8, chord: m.chord, sfx: [[0.05, 'whoosh']], cut: m.cut || null, cam: { p: m.p, l: m.l },
      tr: 'flash', ui: [{ type: 'chn', at: 0.1, out: (c.clip ? 6.8 : 5.8) - 0.3, items: NAV, i: idx }, { type: 'chap', at: 0.25, out: (c.clip ? 6.8 : 5.8) - 0.35, big, word: c.word, title: c.title, items: c.items || [], c: RAS[k], ghostText: k === 'ECO' ? 'ECO' : k }], clip: clip(c.clip) }); }
  // 8 · 스쿨버스 앞으로 내려오며 — 이제 직접 걸어 볼까요?
  const fin = F.finale || [];
  shots.push({ dur: 7.4, chord: 'C', tr: 'flash', sfx: [[0.2, 'rise'], [4.2, 'bell']],
    cam: { p: [[bus[0] + 34, 34, bus[2] + 34], [bus[0] + 14, 11, bus[2] + 19], [bus[0] + 5, 4.4, bus[2] + 11]], l: [[0, 0, 18], [bus[0] - 2, 1, bus[2]], [bus[0] - 3, 1.7, bus[2] - 1]] },
    ui: [fin[0] && { title: fin[0], at: 0.6, out: 4.0, pos: 'center', size: 'h1' }, fin[1] && { title: fin[1], at: 4.2, pos: 'center', size: 'h2', color: '#ffd23c' }].filter(Boolean) });
  return shots;
}

export function buildClosing(D, ctx) {
  const F = D.film || {}, me = ctx.me || [0, 0, 40], fin = [].concat(D.finish || []);
  const shots = [];
  shots.push({ dur: 6.8, time: 'sunset', fadeIn: true, chord: 'F', sfx: [[0.3, 'rise']],
    cam: { p: [[me[0] + 4, me[1] + 7, me[2] + 11], [me[0] + 7, me[1] + 15, me[2] + 24], [me[0] + 4, me[1] + 34, me[2] + 46]], l: [[me[0], me[1] + 1, me[2]], [me[0] - 2, me[1], me[2] - 8], [-8, 0, -18]] },   // 지붕(무지개 쉼터 등) 위에서 시작
    ui: [{ type: 'stamps', at: 0.5, out: 6.4, icons: ctx.icons || [], big: String((ctx.icons || []).length), cap: '곳 견학 완주!' }] });
  const L = (F.closing && F.closing.length ? F.closing : String(fin[0] || '').split('\n')).filter(Boolean);
  const per = 4.2, d1 = Math.max(6, L.length * per + 0.6);
  shots.push({ dur: d1, chord: 'Am', lin: true, cam: { p: [[-96, 50, 30], [-60, 52, 80], [-6, 54, 98], [48, 50, 76]], l: [[-10, 0, -20], [-12, 0, -18], [-12, 0, -18], [-8, 0, -20]] },
    ui: L.map((t, k) => ({ title: t, at: 0.4 + k * per, out: 0.4 + k * per + per - 0.35, pos: 'center', size: 'h2', sfx: k ? null : 'bell' })) });
  const ct = String(fin[fin.length - 1] || '').split('\n').filter(Boolean).map(t => { const m = t.match(/^(.*?)(\d[\d-]{7,})$/); return m ? { b: m[1].trim(), t: m[2] } : { t }; });
  shots.push({ dur: 2.2, chord: 'C', sfx: [[0.3, 'boom']], cam: { p: [[52, 46, 70], [58, 44, 62]], l: [[-8, 0, -20], [-6, 0, -22]] },
    ui: [{ type: 'end', at: 0.4, kick: 'Phone Off, RAS On!', title: F.endTitle || '정림초등학교가\n여러분을 기다립니다', sub: F.endSub || '', contact: ct,
      buttons: [{ k: 'video', t: '🎬 학교 홍보 영상 보기' }, { k: 'card', t: '📖 정림초 도감' }, { k: 'close', t: '닫기' }] }] });
  return shots;
}
