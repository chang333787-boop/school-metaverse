// 칸 키트 시험(CELLKIT-1 · docs/systems/town_cells.md §6) — Node만(브라우저 X): node tools/harness/town_cells.cjs [마을=ourtown] [--can=게임에서 받은 자리 표.json] [--v]
//   ourtown.js 자료 + v2/games/town_cellkit.js 순수 함수로 칸마다 하루 여덟 판(계절 4 × 맑음·비) + 밤 넷을 돌림
//   PASS: 낮 모든 뭍 칸 ≥3 · 갈래 ≥2 · 밤 ≥3 · 보이는 것(도구로만 하는 free 빼고 · 게임 실측과 같은 셈) 모든 판 ≥2 · 이웃과 키트가 통째로 같은 쌍 ≤5% · 한 판에 한 줄이 키트 칸의 1/3 넘지 않음 · 금지 낱말 0 · 윈도10에서 깨지는 이모지 0
//   바다 칸(배로만 가는 곳)은 문서 §7 5번 '남음' — 셋이 안 되면 따로 적음(실패로 세지 않음)
//   --can = SM_TOWN.kit.can()을 저장한 표({ 칸: [줄 id…] }) — 게임에서 실제 자리를 찾은 줄만 쓰고 다시 셈
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../..');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', V = process.argv.includes('--v');
const CANF = (process.argv.find(a => a.startsWith('--can=')) || '').slice(6);
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => {
  const { TOWN: D } = await import('file://' + path.join(ROOT, 'v2/towns', ID + '.js'));
  const K = await import('file://' + path.join(ROOT, 'v2/games/town_cellkit.js'));
  const SIG = K.sigsOf(D), names = Object.keys(SIG), CAN = CANF ? JSON.parse(fs.readFileSync(CANF, 'utf8')) : null;
  const canOf = n => CAN ? (id => (CAN[n] || []).includes(id)) : null;
  const land = n => !SIG[n].school, seaOnly = n => SIG[n].sea >= 50 || ['모래사장', '갯벌', '바다'].includes(SIG[n].g);   /* 바다가 반 넘는 칸 = 문서 §7 5번(바다 줄)이 맡음 */
  console.log('칸 ' + names.length + '개 · 학교 ' + names.filter(n => SIG[n].school).join(',') + (CAN ? ' · 게임 자리 표 ' + CANF : ' · 자료만(자리 표 없음)'));
  // 전: 이미 있는 것만(맑은 봄 낮 · 비 오는 여름 낮)
  const before = {}; for (const n of names) if (land(n)) { const H = K.haveOf(SIG[n]); before[n] = Math.min(...K.CONDS.filter(E => !E.night).map(E => H.filter(q => q.on(E)).length)); }
  const hist = o => { const h = {}; for (const v of Object.values(o)) { const b = v >= 3 ? '3+' : String(v); h[b] = (h[b] || 0) + 1; } return h; };
  console.log('전(이미 있는 것 · 낮 여덟 판 중 가장 적은 수): ' + JSON.stringify(hist(before)) + ' · 0~1개 칸 ' + Object.values(before).filter(v => v <= 1).length);
  // 후: 판마다 키트
  const after = {}, famMin = {}, nightMin = {}, sea5 = new Set(), byCond = {}, useMax = {}, vis = {};
  for (const E0 of K.CONDS) { const E = { ...E0, day: 1 }, P = {}, use = {};
    for (const n of names) { if (!land(n)) continue; const s = SIG[n], H = K.haveOf(s), on = H.filter(q => q.on(E)), kit = K.choose(s, E, canOf(n), H), tot = on.length + kit.length, fam = new Set([...on.map(q => q.f), ...kit.map(id => K.LINE[id].f)]).size;
      P[n] = kit; for (const id of kit) use[id] = (use[id] || 0) + 1; (vis[E.k] || (vis[E.k] = {}))[n] = on.filter(q => !q.free).length + kit.length;
      if (E.night) nightMin[n] = Math.min(nightMin[n] ?? 99, tot); else { after[n] = Math.min(after[n] ?? 99, tot); famMin[n] = Math.min(famMin[n] ?? 9, fam); } }
    byCond[E.k] = P; const nk = Object.values(P).filter(a => a.length).length, top = Object.entries(use).sort((a, b) => b[1] - a[1])[0];
    if (!E.night) useMax[E.k] = top ? [top[0], top[1], nk] : null; }
  for (const n of Object.keys(after)) if (seaOnly(n) && (after[n] < 3 || famMin[n] < 2 || nightMin[n] < 3)) sea5.add(n);
  const landN = Object.keys(after).filter(n => !sea5.has(n));
  console.log('후(낮 여덟 판 중 가장 적은 수): ' + JSON.stringify(hist(after)) + ' · 0~1개 칸 ' + Object.values(after).filter(v => v <= 1).length);
  console.log('1. 칸마다 셋 이상');
  const low = landN.filter(n => after[n] < 3), one = landN.filter(n => famMin[n] < 2), nlow = landN.filter(n => nightMin[n] < 3);
  ok(!low.length, '낮 여덟 판 모든 뭍 칸 ≥3 (' + landN.length + '칸' + (low.length ? ' · 모자람 ' + low.map(n => n + ':' + after[n]).join(' ') : '') + ')');
  ok(!one.length, '갈래 둘 이상' + (one.length ? ' · 하나뿐 ' + one.join(' ') : ''));
  ok(!nlow.length, '밤 넷 판 모든 뭍 칸 ≥3' + (nlow.length ? ' · 모자람 ' + nlow.map(n => n + ':' + nightMin[n]).join(' ') : ''));
  const vlow = []; for (const [k, V9] of Object.entries(vis)) for (const n of landN) if (V9[n] < 2) vlow.push(k.replace(/ /g, '') + ':' + n + ':' + V9[n]);
  ok(!vlow.length, '보이는 것(free 빼고) 열두 판 모든 뭍 칸 ≥2' + (vlow.length ? ' · 모자람 ' + vlow.slice(0, 30).join(' ') + (vlow.length > 30 ? ' …' + vlow.length : '') : ''));
  console.log('  판마다 보이는 것 0~1 칸(뭍 · 바다 남음 빼고): ' + Object.entries(vis).map(([k, V9]) => k + ' ' + landN.filter(n => V9[n] <= 1).length).join(' · '));
  if (sea5.size) console.log('  · 남음(문서 §7 5번 바다 줄 · 바다·모래사장 칸): ' + [...sea5].map(n => n + ':' + after[n] + '/밤' + nightMin[n]).join(' '));
  console.log('2. 같은 틀 복사 막기');
  const nb = n => { const s = SIG[n]; return names.filter(m => { const q = SIG[m]; return Math.abs(q.r - s.r) + Math.abs(q.c - s.c) === 1; }); };
  let pairs = 0, same = 0; for (const [k, P] of Object.entries(byCond)) if (!/밤/.test(k)) for (const n of Object.keys(P)) for (const m of nb(n)) { if (m < n || !P[m] || !P[n].length || !P[m].length) continue; pairs++; if (P[n].slice().sort().join() === P[m].slice().sort().join()) { same++; if (V) console.log('    같음 ' + k + ' ' + n + '·' + m + ' ' + P[n].join(',')); } }
  ok(same / Math.max(1, pairs) <= 0.05, '낮 판 이웃과 키트가 통째로 같은 쌍 ' + same + '/' + pairs + ' (' + (100 * same / Math.max(1, pairs)).toFixed(1) + '%)');
  const LN = landN.length, over = Object.entries(useMax).filter(([, v]) => v && v[1] > LN * 0.45), warn = Object.entries(useMax).filter(([, v]) => v && v[1] > LN / 3 && v[1] <= LN * 0.45);
  ok(!over.length, '낮 한 판에 한 줄 ≤ 뭍 칸(' + LN + ')의 45%' + (over.length ? ' · 넘음 ' + over.map(([k, v]) => k + ' ' + K.LINE[v[0]].t[0] + ' ' + v[1]).join(' · ') : ''));
  if (warn.length) console.log('  △ 알림(설계 1/3 넘음 — 그 판에 흔한 줄이 갈래마다 둘뿐): ' + warn.map(([k, v]) => k + ' ' + K.LINE[v[0]].t[0] + ' ' + v[1]).join(' · '));
  for (const [k, v] of Object.entries(useMax)) if (v) console.log('    ' + k.padEnd(14) + ' 가장 많이 쓴 줄 = ' + K.LINE[v[0]].t[0] + ' ' + v[1] + '/' + v[2]);
  console.log('3. 글');
  const src = fs.readFileSync(path.join(ROOT, 'v2/games/town_cellkit.js'), 'utf8');
  const BAD = ['마법', '몬스터', '요정', '마녀', '괴물', '귀신', '포션', '주문서', '궁극기', '악당', '해골', '좀비'];
  const bad = BAD.filter(w => src.includes(w)); ok(!bad.length, '금지 낱말(판타지) 0' + (bad.length ? ' · ' + bad.join(',') : ''));
  const emo = [...src].filter(ch => { const c = ch.codePointAt(0); return (c >= 0x1F900 && c <= 0x1FAFF) || (c >= 0x1F580 && c <= 0x1F58F) || c === 0x1F6DD || c === 0x1F6DE || c === 0x1F6DF || c === 0x1FAA3; });
  ok(!emo.length, '윈도10에서 깨지는 이모지 0' + (emo.length ? ' · ' + [...new Set(emo)].join(' ') : ''));
  const mats = (D.layers.now.blocks || []).map(b => b.name).filter(Boolean), PLACEW = ['학원', '병원', '은행', '소방서', '경찰서', '도서관', '우체국', '시청', '공항', '항구'];
  const strs = (src.match(/'[^'\n]{2,}'/g) || []).join(' '), ghost = PLACEW.filter(w => strs.includes(w) && !mats.some(m => m.includes(w)));
  ok(!ghost.length, '자료에 없는 장소 이름 0' + (ghost.length ? ' · ' + ghost.join(',') : ''));
  if (V) for (const n of names) if (land(n)) console.log('  ' + n.padEnd(4) + SIG[n].g.padEnd(6) + ' 전 ' + before[n] + ' → 후 ' + after[n] + ' 밤 ' + nightMin[n] + ' | 봄낮 ' + (byCond['spring 맑음 낮'][n] || []).map(id => K.LINE[id].t[0]).join('·') + ' | 여름비 ' + (byCond['summer 비 낮'][n] || []).map(id => K.LINE[id].t[0]).join('·'));
  console.log(fails.length ? '\n✗ 실패 ' + fails.length + '개' : '\n✓ 모두 통과');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
