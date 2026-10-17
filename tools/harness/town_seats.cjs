// 마을 앉기·그네·미끄럼 전부 타 보기(SEAT-X · 10-17 '그네 타면 매 프레임 tick 오류' · FIX-SW1 확인): node tools/harness/town_seats.cjs [마을=ourtown] [포트=8002] [--n=종류마다 최대] [--sec=앉아 있는 초(기본 3)] [--kind=bench,pav,swing,slide] [--cells=라11,마10]
//   E 자리 목록(SD2.map.interact.list — 마을이 SITS·SLD로 단 '💺 벤치에 앉기' · '💺 정자 마루에 앉기' · '🎠 그네 타기' · '🎢 미끄럼 타기')을 하나씩:
//   서는 자리로 순간이동 → 가까운 E가 그 자리인지 → E → (앉기) SD2.ACT.sit.seat가 그 자리 좌석인지 · n초 동안 매 프레임 앉은 채인지 · 몸(pg)이 좌석 위인지 · 그네는 좌석이 실제로 흔들리는지 → E로 일어나기
//                                         → (미끄럼) SD2.ACT.anim이 생기는지 · 끝나면 끝 자리(to) 곁인지
//   → 8방향 0.4초씩 하나라도 0.3m 넘게 · 오류 0 · '[map] 게임 tick 오류' 0(찍히면 게임이 멈추고 몸이 학교로 감 → 앉은 것도 풀림 — 또래 swing.cjs의 seated=false가 이것)
//   게이트: 못 앉음 0 · 앉았다 풀림 0 · E로 못 일어남 0 · 미끄럼 안 탐 0 · 갇힘 0 · 오류 0
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const opt = (k, d) => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const NMAX = +opt('n', 1e9), SEC = +opt('sec', 3), KINDS = opt('kind', 'bench,pav,swing,slide').split(','), CELLS = opt('cells', '') ? opt('cells', '').split(',') : null;
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
(async () => { const T0 = Date.now(); const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
  const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), pos = () => ev(() => { const m = SD2.map.player.get(); return [m.x, m.y, m.z]; });
  let boots = 0;
  async function boot() { boots++; await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.life && SM_TOWN.game, null, { timeout: 180000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(300);
    await ev(() => { const G = SM_TOWN.game && SM_TOWN.game(); if (G && G.setClock) G.setClock(false); });   /* 시계 멈춤(10-17): 209곳을 도는 10분 넘게 시계가 가면 24:00 하루 마무리 창이 몸을 멈춰 156곳째부터 모두 '갇힘'(전 코드도 같음) */
    return ev((KINDS) => { const K = { '💺 벤치에 앉기': 'bench', '💺 Sit on the bench': 'bench', '💺 정자 마루에 앉기': 'pav', '💺 Sit on the pavilion': 'pav', '🎠 그네 타기': 'swing', '🎠 Ride the swing': 'swing', '🎢 미끄럼 타기': 'slide', '🎢 Ride the slide': 'slide' };
      window.__SEATS = SD2.map.interact.list().filter(h => (h.kind === 'sit' || h.kind === 'slide') && K[h.label] && KINDS.includes(K[h.label]));   /* 학교 안 의자·미끄럼틀(이름이 다름)은 뺌 */
      return { n: __SEATS.length, sits: SM_TOWN.sits ? (({ n, kinds, swings, slides }) => ({ n, kinds, swings, slides }))(SM_TOWN.sits()) : null, list: __SEATS.map((h, i) => ({ i, kind: K[h.label], x: +h.x.toFixed(1), z: +h.z.toFixed(1), cell: SM_TOWN.cell(h.x, h.z) })) }; }, KINDS); }
  const DIRS = [['KeyW'], ['KeyS'], ['KeyA'], ['KeyD'], ['KeyW', 'KeyA'], ['KeyW', 'KeyD'], ['KeyS', 'KeyA'], ['KeyS', 'KeyD']];
  async function hold(ks, ms) { const a = await pos(); for (const k of ks) await p.keyboard.down(k); await W8(ms); for (const k of ks) await p.keyboard.up(k); await W8(130); const c = await pos(); return Math.hypot(c[0] - a[0], c[2] - a[2]); }
  let L = await boot(); const per = {}, todo = L.list.filter(q => (!CELLS || CELLS.includes(q.cell)) && (per[q.kind] = (per[q.kind] || 0) + 1) <= NMAX);
  const found = {}; for (const q of L.list) found[q.kind] = (found[q.kind] || 0) + 1; process.stderr.write('E 자리 ' + L.n + '곳 ' + JSON.stringify(found) + ' (SM_TOWN.sits ' + JSON.stringify(L.sits) + ') · 시험 ' + todo.length + '곳\n');
  const res = [];
  for (const q of todo) { const r = { ...q, bad: [], note: [] }, e0 = errs.length, t0 = Date.now();
    try { if (!await ev(() => !!window.SM_TOWN)) { L = await boot(); r.note.push('다시 열기'); }
      // 1) 서는 자리로 → 가까운 E가 이 자리인지
      const pre = await ev(async (i) => { const h = __SEATS[i], M = SD2.map, sl = ms => new Promise(r => setTimeout(r, ms)); if (!h) return null; M.player.teleport([h.x, h.y + 0.05, h.z]); const sx = h.seat ? h.seat.x : h.to[0], sz = h.seat ? h.seat.z : h.to[2]; M.player.lookAt([sx, sz]); await sl(450); const m = M.player.get(); return { mine: SD2.hotNow() === h, near: SD2.near(), off: !!h.off, dy: +(m.y - h.y).toFixed(2), dxz: +Math.hypot(m.x - h.x, m.z - h.z).toFixed(2), r: h.r }; }, q.i);
      if (!pre) { r.bad.push('E 자리 사라짐'); throw new Error('skip'); } if (!pre.mine) r.bad.push('가까운 E가 다른 것(' + pre.near + ')' + (pre.off ? ' · 그 E 자리가 꺼져 있음(off)' : '') + (Math.abs(pre.dy) >= 1.6 ? ' · 몸과 E 높이 차 ' + pre.dy + 'm(1.6 넘으면 안 뜸)' : '') + (pre.dxz > pre.r ? ' · 몸이 E 반경 밖 ' + pre.dxz + 'm' : '')); r.pre = pre;
      await p.keyboard.press('KeyE'); await W8(120);
      // 2) 타는 동안 매 프레임 지켜봄
      const ride = await ev(async ([i, SEC]) => { const h = __SEATS[i], A = SD2.ACT, P0 = SD2.pg.position; const o = { frames: 0, satF: 0, nan: 0, maxStep: 0, offSeat: 0, seatMin: null, seatMax: null };
        o.sat0 = !!(A.sit && h.seat && A.sit.seat === h.seat); o.anim0 = !!A.anim; let last = null; const t0 = performance.now();
        await new Promise(res => { const f = () => { o.frames++; const x = P0.x, y = P0.y, z = P0.z; if (![x, y, z].every(Number.isFinite)) o.nan++; if (last) o.maxStep = Math.max(o.maxStep, Math.hypot(x - last[0], y - last[1], z - last[2])); last = [x, y, z];
          if (h.seat) { if (A.sit && A.sit.seat === h.seat) { o.satF++; const s = h.seat, d = Math.hypot(x - s.x, y - s.y, z - s.z); if (d > 0.12) o.offSeat++;   /* 그네는 몸이 한 프레임 늦게 따라감(최대 약 4cm) */ const v = [s.x, s.y, s.z]; o.seatMin = o.seatMin ? o.seatMin.map((m, k) => Math.min(m, v[k])) : v.slice(); o.seatMax = o.seatMax ? o.seatMax.map((m, k) => Math.max(m, v[k])) : v.slice(); } }
          else if (A.anim) o.satF++;
          if (performance.now() - t0 < SEC * 1000 && window.SM_TOWN) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
        o.swingRange = o.seatMin ? +Math.max(...o.seatMax.map((m, k) => m - o.seatMin[k])).toFixed(2) : 0; const m = SD2.map.player.get(); o.end = [m.x, m.y, m.z]; if (h.to) o.toD = +Math.hypot(m.x - h.to[0], m.z - h.to[2]).toFixed(2); o.satEnd = !!(A.sit && h.seat && A.sit.seat === h.seat); o.alive = !!window.SM_TOWN; delete o.seatMin; delete o.seatMax; return o; }, [q.i, SEC]);
      r.ride = ride; if (!ride.alive) r.bad.push('게임 멈춤(SM_TOWN 사라짐)');
      if (q.kind !== 'slide') { if (!ride.sat0) r.bad.push('E로 못 앉음'); else if (!ride.satEnd) r.bad.push('앉았다 풀림(' + ride.satF + '/' + ride.frames + '프레임)'); if (ride.sat0 && ride.offSeat > 2) r.note.push('몸이 좌석에서 벗어난 프레임 ' + ride.offSeat); if (q.kind === 'swing' && ride.sat0 && ride.swingRange < 0.05) r.note.push('그네가 거의 안 흔들림(' + ride.swingRange + 'm)'); }
      else { if (!ride.anim0 && !ride.satF) r.bad.push('E로 미끄럼 안 탐'); else if (ride.toD > 1.5) r.bad.push('끝 자리에서 ' + ride.toD + 'm'); }
      if (ride.nan) r.bad.push('NaN 자리 ' + ride.nan + '프레임');
      // 3) E로 일어나기(앉기만)
      if (q.kind !== 'slide' && ride.alive && ride.satEnd) { await p.keyboard.press('KeyE'); await W8(350); const up = await ev(() => !SD2.ACT.sit); if (!up) { r.bad.push('E로 못 일어남'); } }
      // 4) 8방향
      if (await ev(() => !!window.SM_TOWN)) { const mv = []; let best = 0; for (const ks of DIRS) { const d = await hold(ks, 400); mv.push(+d.toFixed(2)); best = Math.max(best, d); if (d > 0.3) break; } r.mv = mv; r.best = +best.toFixed(2); if (best <= 0.3) r.bad.push('갇힘(8방향 ' + mv.join('/') + ')'); }
    } catch (e) { if (e.message !== 'skip') r.bad.push('하네스 예외: ' + e.message.split('\n')[0].slice(0, 120)); }
    const E9 = errs.slice(e0); r.errs = E9; if (E9.some(t => /게임 tick 오류/.test(t))) r.bad.push('[map] 게임 tick 오류'); if (E9.length) r.bad.push('오류 ' + E9.length);
    r.ms = Date.now() - t0; res.push(r); if (r.bad.length || res.length % 20 === 0) process.stderr.write((r.bad.length ? '✗ ' : '✓ ') + res.length + '/' + todo.length + ' ' + q.kind + ' ' + q.cell + ' [' + q.x + ', ' + q.z + ']' + (r.bad.length ? ' → ' + r.bad.join(' · ') : '') + '\n'); }
  const byKind = {}; for (const r of res) { const k = byKind[r.kind] = byKind[r.kind] || { n: 0, ok: 0, sat: 0, stood: 0, moved: 0, tickErr: 0, swingMax: 0 }; k.n++; if (!r.bad.length) k.ok++; if (r.ride && (r.ride.sat0 || r.ride.anim0)) k.sat++; if (r.ride && r.ride.satEnd && !r.bad.includes('E로 못 일어남')) k.stood++; if (r.best > 0.3) k.moved++; if (r.bad.includes('[map] 게임 tick 오류')) k.tickErr++; if (r.ride) k.swingMax = Math.max(k.swingMax, r.ride.swingRange || 0); }
  const bad = res.filter(r => r.bad.length);
  console.log(JSON.stringify({ town: ID, seats: L.n, found, sitsApi: L.sits, tried: res.length, bad: bad.length, boots, sec: Math.round((Date.now() - T0) / 1000), rideSec: SEC, byKind, badList: bad.map(r => ({ kind: r.kind, cell: r.cell, at: [r.x, r.z], bad: r.bad, pre: r.pre, note: r.note, mv: r.mv, ride: r.ride && { sat0: r.ride.sat0, anim0: r.ride.anim0, satF: r.ride.satF, frames: r.ride.frames, satEnd: r.ride.satEnd, toD: r.ride.toD, maxStep: +r.ride.maxStep.toFixed(2) }, errs: r.errs.slice(0, 2) })), notes: res.filter(r => r.note.length).map(r => r.kind + ' ' + r.cell + ' [' + r.x + ', ' + r.z + ']: ' + r.note.join(' · ')).slice(0, 30), errs: [...new Set(errs)].slice(0, 12) }, null, 1));
  const gate = bad.length === 0 && errs.length === 0; console.log(gate ? 'PASS' : 'FAIL'); await b.close(); process.exit(gate ? 0 : 1); })().catch(e => { console.error('하네스 오류', e.message); console.log('FAIL'); process.exit(1); });
