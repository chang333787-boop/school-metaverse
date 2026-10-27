// 👀 E 뒤 보이는 변화 시험(EFX-1 · v2/games/town_efx.js): node tools/harness/town_efx1.cjs [마을=ourtown] [포트=8002]
//   갈래마다 E 자리 하나를 골라 몸을 옮기고 E → 세상 안 변화가 생겼는지(읽음 ✓ 점 · 생물 떼 · 곤충이 자리를 떠남 · 도감 카드 · 개미 줄 바뀜 · 나방 흩어짐)
//   갈래 = 라벨 앞머리 · 봄 낮 맑음(나비·새가 나오는 때) · 가까운 곳만 생기는 칸 키트(개미·나방)는 그 칸으로 옮긴 뒤 다시 찾음 · 끝에 '보이는 변화 없음' 수
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const KINDS = [
  ['📖 표지석 읽기', /^📖 표지석/, 'read'], ['📋 알아보기(장소 카드)', /^📋 알아보기/, 'read'], ['기록판', /기록판/, 'read'], ['📋 주민 게시판', /^📋 주민 게시판/, 'read'], ['📌 의뢰 게시판', /^📌/, 'read'],
  ['🎉 잔치 준비 게시판', /^🎉/, 'read'], ['🏮 야시장 안내판', /^🏮/, 'read'], ['🗺 마을 지도 판', /^🗺 마을 지도/, 'read'], ['🌊 물때표', /^🌊 물때/, 'read'], ['🔎 간판 살펴보기', /^🔎 간판/, 'read'],
  ['🐦 새집(봄)', /^🐦 새집/, 'swarm'], ['🐝 곤충 호텔', /^🐝 곤충 호텔/, 'read'], ['🐸 생태 연못', /^🐸 생태 연못/, 'read'],
  ['🌼 꽃밭 들여다보기', /^🌼 꽃밭/, 'swarm'], ['🌱 텃밭 둘러보기', /^🌱 텃밭 둘러/, 'swarm'], ['🌳 정자나무 보기', /^🌳 정자나무/, 'swarm'],
  ['🔍 곤충 관찰', /^🔍 .+ 관찰하기$/, 'bug'], ['🐜 개미 줄', /^🐜 개미 줄|^🍞 빵 부스러기/, 'ant'],
];
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const fails = [], rows = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const closeAll = async () => { for (let i = 0; i < 6; i++) { if (!await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-dlg button'); if (b9) b9.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' })); }); await W8(250); } };
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.efx && window.SD2, null, { timeout: 240000 }); await W8(3000); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.min = 11 * 60; SM_TOWN.rules.wx('clear'); SM_TOWN.rules.season('spring'); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } }); await W8(1500);
    const find = re => ev(src => { const re9 = new RegExp(src); const L = SD2.map.interact.list().filter(h => h.kind === 'game' && !h.off && re9.test(String(h.label || ''))); return L.map(h => ({ x: h.x, y: h.y, z: h.z, label: h.label })); }, re.source);
    const fire = (at, src) => ev(([at, src]) => { const re9 = new RegExp(src), L = SD2.map.interact.list().filter(h => h.kind === 'game' && !h.off && re9.test(String(h.label || ''))); let h = null, bd = 1e9; for (const q of L) { const d = Math.hypot(q.x - at[0], q.z - at[2]); if (d < bd) { bd = d; h = q; } } if (!h) return null; SD2.actOn(h); return h.label; }, [at, src]);
    for (const [nm, re, kind] of KINDS) {
      let L = await find(re); if (!L.length) { rows.push([nm, '자리 없음(이 마을·때)', '—']); console.log('  · ' + nm + ' — 자리 없음'); continue; }
      const h = L[(L.length * 0.37) | 0]; await closeAll(); await ev(a => SD2.map.player.teleport([a.x, a.y + 0.05, a.z]), h); await W8(900);
      L = await find(re); const h2 = L.sort((a, c) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(c.x - h.x, c.z - h.z))[0] || h; if (h2 !== h) { await ev(a => SD2.map.player.teleport([a.x, a.y + 0.05, a.z]), h2); await W8(500); }
      const i0 = await ev(() => SM_TOWN.efx().info()); const lb = await fire([h2.x, h2.y, h2.z], re.source); await W8(400); await closeAll(); await W8(kind === 'bug' ? 700 : 300);
      const i1 = await ev(() => SM_TOWN.efx().info()); let seen = '';
      if (kind === 'read') seen = i1.marks > i0.marks || i1.log.read > i0.log.read ? '✓ 표시 생김(점 ' + i1.drawn + ')' : (i1.marks === i0.marks && i0.marks > 0 ? '' : '');
      if (kind === 'swarm' || /새집|곤충 호텔|생태 연못/.test(nm)) { if (i1.active > 0 || i1.log.swarm > i0.log.swarm) seen = (seen ? seen + ' · ' : '') + '떼 ' + i1.active + '마리'; if (i1.log.read > i0.log.read && !seen) seen = '✓ 표시'; }
      if (kind === 'bug' && i1.log.bug > i0.log.bug) seen = '곤충이 자리를 떠났다 돌아옴' + (i1.log.card > i0.log.card || i1.pend > 0 || i1.cards > 0 ? ' · 도감 카드' : '');
      if (kind === 'ant' && i1.log.ant > i0.log.ant) seen = '줄 끝이 먹이 쪽으로 옮김';
      if (/새집/.test(nm) && !seen && i1.log.read > i0.log.read) seen = '✓ 표시';
      rows.push([nm, lb, seen || '보이는 변화 없음']); console.log((seen ? '  ✓ ' : '  ✗ ') + nm + ' — ' + lb + ' → ' + (seen || '보이는 변화 없음'));
      if (!seen) fails.push(nm); }
    const no = rows.filter(r => r[2] === '보이는 변화 없음').length, tried = rows.filter(r => r[2] !== '—').length; console.log('    E 갈래 ' + tried + '곳 시도 · 보이는 변화 없음 ' + no);
    if (errs.length) { fails.push('페이지 오류'); console.log('  ✗ 페이지 오류 ' + errs.join(' | ')); }
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); }
  await b.close(); console.log(fails.length ? 'FAIL ' + fails.length + ' (' + fails.join(', ') + ')' : 'PASS'); process.exit(fails.length ? 1 : 0); })();
