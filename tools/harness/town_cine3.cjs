// 🎬 영화관 짧은 영화 시험(CINE-3 · v2/games/town_cine.js · town_bldg.js): node tools/harness/town_cine3.cjs [마을=ourtown] [포트=8002] [--render] [--shots=폴더]
//   ① 영화 셋 = 40~60초 · 장면 여섯 이상 ② 표 → 자리 E → 시작 시각까지 기다림 → 창 없이 상영 · 몸 = 자리에 앉음(고정) ③ 화면 픽셀이 시간에 따라 바뀜 · 장면 번호가 넷 이상 지나감 · 음악 사건
//   ④ 자리 E = 그만 보기(몸 풀림) ⑤ 다시 앉아 보다 방을 나가면 = 상영 멈춤 · 몸 풀림 · 걸을 수 있음 · 힙 안 늘어남(GC 뒤 +3MB 이하) ⑥ 그리기 켬이면 상영 중 CPU 한 프레임 p95 · 사진
//   ⑦ 영화 장면 캔버스 PNG(--shots 폴더 · 그리기 끔에서도) · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const fs = require('fs'), path = require('path');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, RENDER = !!process.env.SM_RENDER_ON || process.argv.includes('--render') || !!SHOTS;   /* pw.cjs가 --render를 argv에서 빼므로 사진 폴더 = 그리기 켬 */
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--js-flags=--expose-gc'] });
  try { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    const cdp = await ctx.newCDPSession(p); await cdp.send('HeapProfiler.enable');
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); await W8(200); await cdp.send('HeapProfiler.collectGarbage'); return ev(() => performance.memory ? performance.memory.usedJSHeapSize : 0); };
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 600) } : null; });
    const closeAll = async () => { for (let i = 0; i < 5; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub'); if (b9) b9.click(); }); await W8(250); } };
    const BI = () => ev(() => SM_TOWN.bldg().info()), tpA = a => ev(a => { SD2.map.player.teleport([a[0], a[1] + 0.05, a[2]]); }, a);
    const E = async (k, want) => { const I = await BI(), h = I.cur && I.cur.extra.find(q => q.k === k); if (!h) return false; for (let t = 0; t < 3; t++) { await closeAll(); await tpA(h.at); await W8(500); await p.keyboard.press('KeyE'); await W8(600); if (!want || await want()) return true; } return false; };
    const pressE = async () => { await p.keyboard.press('KeyE'); await W8(500); };
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.indoor && SM_TOWN.bldg, null, { timeout: 240000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.min = 13 * 60 + 20; G.money = 5000; SM_TOWN.rules.wx('clear'); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } });
    const F = await ev(() => SM_TOWN.bldg().dbg.films()); console.log('    영화: ' + F.map(f => f.id + ' ' + f.len + '초 · 장면 ' + f.shots).join(' / '));
    ok(F.length === 3 && F.every(f => f.len >= 30 && f.len <= 60 && f.shots >= 6), '영화 셋 · 한 편 30~60초 · 장면 여섯 이상(제목·끝 포함)');
    const cn = (await ev(() => SM_TOWN.indoor.list().filter(q => q.kind === 'cinema')))[0]; ok(!!cn, '영화관 ' + (cn && cn.name));
    const h0 = await heap();
    await ev(id => SM_TOWN.indoor.enter(id), cn.id); await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); await W8(400);
    // 표 사기(쪽지 시각까지 끝나는 줄)
    await E('bd:ticket', async () => ((await panel()) || {}).k === 'bdcine');
    const T3 = await ev(() => { const t = document.querySelector('.twn-p .bd-sit').textContent, m = t.match(/(\d\d):(\d\d)까지/), lim = m ? +m[1] * 60 + +m[2] : 9999, rows = [...document.querySelectorAll('.twn-p table.bd-pb tr')].slice(1).map(tr => [...tr.children].map(td => td.textContent)), mm = s => +s.slice(0, 2) * 60 + +s.slice(3); return { lim, ends: rows.map(r => mm(r[2])), starts: rows.map(r => mm(r[1])) }; });
    const rt = T3.ends.findIndex(v => v <= T3.lim); await ev(j => document.querySelector('.twn-p button[data-s="' + j + '"]').click(), rt); await W8(300); await closeAll();
    const tk = await ev(() => SM_TOWN.game().S.bldg.cinema.tk); ok(!!tk, '표 = 자리 ' + (tk && tk.seat));
    await E('bd:seat', async () => ((await panel()) || {}).k === 'bdseat'); await ev(() => document.querySelector('.twn-p button[data-w]').click()); await W8(700);
    let I = await BI(); const pl = I.cur && I.cur.play, me = await ev(() => SD2.map.player.get());
    ok(!(await panel()) && pl && pl.len >= 30, '기다리면 = 창 없이 큰 화면에서 상영(' + (pl && pl.len) + '초)'); ok(pl && pl.au !== undefined, '음악 사건 = ' + (pl && pl.au ? '소리 장치 켜짐' : '소리 장치 잠듦(시험 브라우저 · 그림만)'));
    const seat = I.cur.extra.find(q => q.k === 'bd:seat'); ok(seat && Math.hypot(me.x - seat.at[0], me.z - (seat.at[2] - 0.65)) < 0.3, '몸 = 표 자리 의자에 앉음(' + me.x.toFixed(2) + ', ' + me.z.toFixed(2) + ')');
    await p.keyboard.down('KeyW'); await W8(600); await p.keyboard.up('KeyW'); const me2 = await ev(() => SD2.map.player.get()); ok(Math.hypot(me2.x - me.x, me2.z - me.z) < 0.05, '앉아 있는 동안 W = 움직이지 않음');
    // 픽셀이 시간에 따라 바뀜 · 장면이 지나감
    const hs = [], sis = new Set(); await ev(() => SM_TOWN.bldg().dbg.ff(3.2)); await W8(300); let n0 = (await BI()).cur.play.n, perf = null;   /* 제목 장(멈춘 글)은 건너뛰고 셈 */ if (RENDER) await ev(() => SD2.timing.reset());
    for (let k = 0; k < 6; k++) { hs.push(await ev(() => SM_TOWN.bldg().dbg.px())); await W8(450); }
    if (RENDER) perf = await ev(() => ({ p50: SD2.timing.frameCpuP50, p95: SD2.timing.frameCpuP95 }));
    I = await BI(); ok(new Set(hs).size >= 5 && I.cur.play.n - n0 >= 40, '화면 픽셀이 0.45초마다 바뀜(서로 다른 장 ' + new Set(hs).size + '/6 · 그린 장 +' + (I.cur.play.n - n0) + ' · 약 30장/초)');
    const outDir = SHOTS || null; if (outDir) fs.mkdirSync(outDir, { recursive: true });
    const snap = async nm => { if (!outDir) return; const d = await ev(() => SM_TOWN.bldg().dbg.png()); if (d) fs.writeFileSync(path.join(outDir, nm + '.png'), Buffer.from(d.split(',')[1], 'base64')); if (RENDER) await p.screenshot({ path: path.join(outDir, nm + '_room.jpg'), quality: 70, type: 'jpeg' }); };
    await snap('film' + I.cur.play.f + '_a');
    for (let k = 0; k < 8; k++) { await ev(() => SM_TOWN.bldg().dbg.ff(5.5)); await W8(250); const q = (await BI()).cur.play; if (!q) break; sis.add(q.si); if (k === 2 || k === 5) await snap('film' + q.f + '_' + k); }
    ok(sis.size >= 4, '빨리 감으며 장면 번호 ' + [...sis].join('·') + ' (넷 이상 = 장면이 바뀜)');
    // ④ 끝까지 → 끝 처리
    await ev(() => SM_TOWN.bldg().dbg.ff(120)); await W8(700); I = await BI(); const mn = await ev(() => SM_TOWN.game().S.min);
    const sn = await ev(() => SM_TOWN.game().S.bldg.cinema.seen === SM_TOWN.game().S.day); ok(!I.cur.play && mn >= T3.ends[rt] && mn <= T3.ends[rt] + 3 && sn, '끝 = 시계가 끝나는 시각(' + T3.ends[rt] + ' → 지금 ' + mn + ') · 본 날 기록 ' + sn + ' · 화면 = 시간표로');
    { const tk9 = (await BI()).cur.extra.find(q => q.k === 'bd:ticket'); await tpA(tk9.at); await W8(400); } const me2b = await ev(() => SD2.map.player.get()); await p.keyboard.down('KeyS'); await W8(500); await p.keyboard.up('KeyS'); const me3 = await ev(() => SD2.map.player.get()); ok(Math.hypot(me3.x - me2b.x, me3.z - me2b.z) > 0.2, '끝나면 몸 풀림(통로에서 걸음)');
    // ⑤ 다른 영화 · 중간에 그만 · 다시 보다 방을 나감 → 정리
    await ev(() => { const s = SM_TOWN.game().S.bldg.cinema; s.seen = 0; s.tk = { d: SM_TOWN.game().S.day, i: 1, seat: '나3' }; SM_TOWN.game().S.min = 11 * 60 + 30; });
    await ev(() => SM_TOWN.indoor.exit()); await W8(1500); await ev(id => SM_TOWN.indoor.enter(id), cn.id); await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); await W8(500);
    await E('bd:seat', async () => !!(await BI()).cur.play || ((await panel()) || {}).k === 'bdseat'); if ((await panel())) { await ev(() => { const b9 = document.querySelector('.twn-p button[data-w]'); if (b9) b9.click(); }); await W8(600); }
    I = await BI(); ok(I.cur.play && I.cur.play.f === 1, '둘째 영화(사계절 논) 상영'); await W8(1200); await snap('film1_a'); await ev(() => SM_TOWN.bldg().dbg.ff(14)); await W8(300); await snap('film1_b');
    await pressE(); I = await BI(); ok(!I.cur.play, '자리 E = 그만 보기'); await p.keyboard.down('KeyW'); await W8(400); await p.keyboard.up('KeyW');
    await ev(() => { const s = SM_TOWN.game().S.bldg.cinema; s.tk = { d: SM_TOWN.game().S.day, i: 2, seat: '다4' }; SM_TOWN.game().S.min = 13 * 60 + 5; }); await ev(() => SM_TOWN.indoor.exit()); await W8(1500); await ev(id => SM_TOWN.indoor.enter(id), cn.id); await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); await W8(500);
    await E('bd:seat', async () => !!(await BI()).cur.play || ((await panel()) || {}).k === 'bdseat'); if ((await panel())) { await ev(() => { const b9 = document.querySelector('.twn-p button[data-w]'); if (b9) b9.click(); }); await W8(600); }
    I = await BI(); ok(I.cur.play && I.cur.play.f === 2, '셋째 영화(소방관의 하루) 상영'); for (const s9 of [6, 10, 12]) { await ev(s => SM_TOWN.bldg().dbg.ff(s), s9); await W8(300); await snap('film2_' + s9); }
    const meIn = await ev(() => SD2.map.player.get()); await ev(() => SM_TOWN.indoor.exit()); await W8(1800);
    I = await BI(); const meOut = await ev(() => SD2.map.player.get()); ok(!(await ev(() => SM_TOWN.indoor.on)) && !I.cur, '상영 중 방을 나감 = 방·상영 정리');
    await p.keyboard.down('KeyW'); await W8(600); await p.keyboard.up('KeyW'); const meW = await ev(() => SD2.map.player.get()); ok(Math.hypot(meOut.x - meIn.x, meOut.z - meIn.z) > 3 && Math.hypot(meW.x - meOut.x, meW.z - meOut.z) > 0.2, '나간 뒤 = 문 밖 · 몸 풀림(걸음)');
    const goal = await ev(() => { const g = document.querySelector('.twn-goal, #goal, .goal'); return g ? g.textContent : ''; }); ok(!/상영 중/.test(goal), '「상영 중」 줄 지움');
    const h1 = await heap(); ok(!h0 || h1 - h0 < 3e6, '힙 들어가기 전 ' + (h0 / 1e6).toFixed(1) + 'MB → 나온 뒤 ' + (h1 / 1e6).toFixed(1) + 'MB(+3MB 이하)');
    if (perf) console.log('    상영 중 CPU 한 프레임 p50 ' + perf.p50 + 'ms · p95 ' + perf.p95 + 'ms');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); }
  await b.close(); console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
