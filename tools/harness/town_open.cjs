// 🏠 첫 아침 시험(OPEN-1 · 사용자 10-27 '오픈월드인데 아직 시작 부분이 학교에서 대기 — 다시 구성') — node tools/harness/town_open.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 처음부터 = 우리 집 현관 앞(학교 운동장 X) · 아침 · 위 가운데 첫 할 일 한 줄(현관 칠판) · 칠판 E = 프롤로그 쪽지(어린이 도우미) · 학교 이름 X
//   ② 자전거 = 첫날부터 B · 칩  ③ 가 본 곳(BEEN-1): 소방서를 먼저 가 본 판 → 1-1 쪽지가 알아봄 · 우체국에 선 채 그 단계가 되면 바로 넘어감 · 보물 지도 첫 장(파기)은 그대로(FIRST-1 10-31)
//   ④ 이어하기 = 지난 자리(새 시작 장면 X)  ⑤ (--shots) 첫 10초 캡처 데스크톱 1366×768 · 휴대폰 세로 390×844  ⑥ 페이지 오류 0
const { chromium, devices } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots'), URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const errs = []; const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 160)); }); };
const ready = p => p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.save, null, { timeout: 240000 }).then(() => p.waitForTimeout(1200));
const click = (p, a) => p.evaluate(a9 => { const b = document.querySelector('.twn-p [data-a="' + a9 + '"]'); if (b) b.click(); return !!b; }, a);
const closeAll = async p => { for (let i = 0; i < 6; i++) { const n = await p.evaluate(() => document.querySelectorAll('.twn-dlg,.twn-p').length); if (!n) return; await p.keyboard.press('Escape'); await p.waitForTimeout(250); } };
const shot = async (p, n) => { if (SHOTS) { await p.waitForTimeout(400); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); } };
const where = p => p.evaluate(() => { const q = SD2.map.player.get(), H = SM_TOWN.home(), d = H && H.e ? Math.hypot(q.x - H.e[0], q.z - H.e[1]) : null; return { x: +q.x.toFixed(1), z: +q.z.toFixed(1), school: SM_TOWN.cell(q.x, q.z), inSchool: SM_TOWN.inSchool(q.x, q.z), dHome: d == null ? null : +d.toFixed(1), min: SM_TOWN.game().S.min, goal: (document.getElementById('hudGoal') || {}).textContent || '', open: SM_TOWN.opening() }; });
(async () => {
  const b = await chromium.launch({ args: GPU });
  try {
    console.log('① 처음부터 = 우리 집 앞 첫 아침');
    let ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(); watch(p, 'A'); await p.goto(URL); await ready(p);
    const T0 = await p.evaluate(() => (document.querySelector('.twn-ld') || {}).innerText || ''); ok(!/정림/.test(T0), '첫 화면에 실제 학교 이름 X'); await shot(p, 'open_0_title_desktop');
    await click(p, 'x'); await p.waitForTimeout(1600); let W = await where(p);
    ok(W.dHome != null && W.dHome < 7, '우리 집 현관 앞에서 시작(문에서 ' + W.dHome + 'm · ' + W.school + ')'); { const h9 = await p.evaluate(() => (document.getElementById('hint') || {}).textContent || ''); ok(/쪽지 읽기/.test(h9), '첫 E 안내 = 칠판(' + h9.trim() + ')'); } ok(!W.inSchool && !/우리 학교/.test(W.goal), '학교 울타리 안에서 시작하지 않음'); ok(W.min >= 6 * 60 && W.min < 9 * 60, '아침(' + Math.floor(W.min / 60) + '시)');
    ok(/현관 칠판/.test(W.goal) && W.open && W.open.board, '첫 할 일 한 줄 = ' + W.goal); await shot(p, 'open_1_first10s_desktop');
    const sy0 = await p.evaluate(() => !!(SM_TOWN.game().S.story && SM_TOWN.game().S.story.cur)); ok(!sy0, '쪽지는 칠판에서(저절로 창이 먼저 뜨지 않음)');
    { console.log('①-2 자유 둘러보기 1분 = 창 X · 도움 쪽지 알림(NUDGE-1)'); const O0 = await p.evaluate(() => { const q = SD2.map.player.get(); return [q.x, q.z, q.y]; });
      let TS = ''; for (let i = 0; i < 62; i++) { TS += ' ' + await p.evaluate(([x, z, k]) => { const dx = k % 2 ? 1.2 : -1.2; SD2.map.player.teleport([x + dx, SM_TOWN.ground(x + dx, z) + 0.05, z]); return (document.getElementById('toast') || {}).textContent || ''; }, [O0[0], O0[1], i]); await p.waitForTimeout(1000); }
      const N1 = await p.evaluate(() => ({ cur: SM_TOWN.game().S.story && SM_TOWN.game().S.story.cur, dlg: !!document.querySelector('.twn-dlg,.twn-p'), o: SM_TOWN.opening(), chip: [...document.querySelectorAll('.gchip,.chip')].some(e => /칠판 쪽지/.test(e.textContent) && e.getClientRects().length), goal: (document.getElementById('hudGoal') || {}).textContent || '', txt: document.body.innerText }));
      ok(!N1.cur && !N1.dlg, '1분 걸어 다녀도 프롤로그 창이 저절로 안 열림(이야기 ' + N1.cur + ')'); ok(N1.o && N1.o.nud >= 1 && N1.o.idle < 5, '도움 쪽지 알림 ' + (N1.o && N1.o.nud) + '번 · 막힌 초 ' + (N1.o && N1.o.idle));
      ok(N1.chip && /현관 칠판/.test(N1.goal), '칩 「📋 칠판 쪽지」 + 위 가운데 줄 그대로(' + N1.goal + ')'); ok(/도움 쪽지가 왔어요/.test(TS), '한 줄 알림 = 「' + ((TS.match(/📋 우리 집[^.]*\./) || [''])[0]) + '」');
      await p.evaluate(() => [...document.querySelectorAll('.gchip,.chip')].find(e => /칠판 쪽지/.test(e.textContent)).click()); await p.waitForTimeout(600); 
      await p.evaluate(([x, z]) => SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]), O0); await p.waitForTimeout(400); }
    await p.evaluate(() => { const H = SM_TOWN.home(), h = SD2.map.interact.list().find(q => /^📋 쪽지 읽기/.test(q.label || ''));   /* '📋 알아보기 — …'(장소 안내판)가 먼저 잡히지 않게 */ const x = h.x, z = h.z; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 1, z]); }); await p.waitForTimeout(500); await p.keyboard.press('KeyE'); await p.waitForTimeout(1500);
    let S1 = await p.evaluate(() => ({ cur: SM_TOWN.game().S.story && SM_TOWN.game().S.story.cur, dlg: (document.querySelector('.twn-dlg') || document.querySelector('.twn-p') || {}).innerText || '' }));
    ok(S1.cur === 'p0', '칠판 E → 프롤로그 시작(' + S1.cur + ')'); ok(/도우미/.test(S1.dlg), '프롤로그 쪽지가 보임(' + S1.dlg.replace(/\s+/g, ' ').slice(0, 60) + ')'); await shot(p, 'open_2_note_desktop');
    console.log('② 자전거 = 첫날부터');
    await closeAll(p); await p.waitForTimeout(300);
    const bk0 = await p.evaluate(() => [...document.querySelectorAll('.gchip,.chip')].some(e => /자전거/.test(e.textContent) && e.getClientRects().length)); ok(bk0, '🚲 자전거 칩이 보임');
    await p.evaluate(() => SM_TOWN.bike(true)); await p.waitForTimeout(500); ok(await p.evaluate(() => SM_TOWN.indoor.state().bike), 'B(자전거 타기)가 됨');
    await p.evaluate(() => SM_TOWN.bike(false));
    console.log('③ 가 본 곳 — 소방서를 먼저 가 본 판');
    const F = await p.evaluate(() => { const P = SM_TOWN.places().find(q => q.name === '소방서'); if (!P) return null; SD2.map.player.teleport([P.x, SM_TOWN.ground(P.x, P.z) + 1.5, P.z + 3]); return [P.x, P.z]; }); await p.waitForTimeout(2600);
    const been = await p.evaluate(() => SM_TOWN.been()); ok(F && been['소방서'], '가 본 곳에 소방서(' + Object.keys(been).join(', ') + ')');
    await p.evaluate(() => { SM_TOWN.storyOff && SM_TOWN.storyOff(); const s = SM_TOWN.game().S.story; s.done = s.done || {}; s.done.p0 = { d: 1 }; SM_TOWN.storyStart('a1_1'); }); await p.waitForTimeout(1500);
    const ntxt = await p.evaluate(() => { const d = document.querySelector('.twn-dlg'); return d ? d.innerText : ''; });
    let pages = ntxt; for (let i = 0; i < 5 && !/데려가 줘/.test(pages); i++) { await p.keyboard.press('Space'); await p.waitForTimeout(500); pages += ' ' + await p.evaluate(() => (document.querySelector('.twn-dlg') || {}).innerText || ''); }
    const pg9 = pages.replace(/\s+/g, ' '); ok(/너 소방서는 벌써 가 봤지\? ?그럼 나 좀 데려가 줘!/.test(pg9), '1-1 쪽지가 알아봄(' + (pg9.match(/너 소방서[^!]*!/) || [''])[0] + ')');
    await closeAll(p);
    await p.evaluate(async () => { SM_TOWN.storyAt('a1_1', 2); const a = SM_TOWN.story().step.v.at; SM_TOWN.storyOff(); SD2.map.player.teleport([a.x + 2, SM_TOWN.ground(a.x + 2, a.z) + 1.5, a.z]); }); await p.waitForTimeout(800); await closeAll(p); await p.evaluate(() => SM_TOWN.storyAt('a1_1', 2)); await p.waitForTimeout(2600);   /* FIRST-1(10-31 첫 장 다시 짜기): 우체국(지도만 보고 찾아가기) 목적지에 먼저 서 있다가 그 단계가 됨 */
    const st3 = await p.evaluate(() => ({ st: SM_TOWN.story().step, done: !!(SM_TOWN.game().S.story.done || {}).a1_1 })); ok(!(st3.st && st3.st.id === 'post'), '우체국에 선 채로 「우체국은 지도만 보고 찾아가기」 → 바로 넘어감(지금 단계 ' + (st3.st && st3.st.id) + ' · 1-1 끝 ' + st3.done + ')');
    await closeAll(p); await p.evaluate(() => SM_TOWN.storyAt('a1_1', 1)); await p.waitForTimeout(1200); const st2 = await p.evaluate(() => SM_TOWN.story().step); ok(st2 && st2.id === 'tmap' && st2.type === 'tmap', '보물 지도 첫 장(파기)은 소방서를 가 봤어도 그대로(' + (st2 && st2.id) + ')');
    await closeAll(p); await p.evaluate(() => SM_TOWN.storyOff && SM_TOWN.storyOff());
    console.log('③-2 프롤로그에서 소방서를 고른 판 → 쪽지가 알아봄 · 파기는 그대로 · 우체국을 같이 간 판 = 새 친구 혼자(SOLO-1)');
    await p.evaluate(() => { const s = SM_TOWN.game().S.story; s.done = { p0: { d: 1 } }; s.fw = { '작은 도서관': 1, '소방서': 1 }; s.cur = null; s.autoNext = null; SM_TOWN.storyStart('a1_1'); }); await p.waitForTimeout(1500);
    { let pg = await p.evaluate(() => (document.querySelector('.twn-dlg') || {}).innerText || ''); for (let i = 0; i < 5 && !/지도 조각으로 찾아보자/.test(pg); i++) { await p.keyboard.press('Space'); await p.waitForTimeout(500); pg += ' ' + await p.evaluate(() => (document.querySelector('.twn-dlg') || {}).innerText || ''); }
      pg = pg.replace(/\s+/g, ' '); ok(/소방서는 아까 같이 가 봤지! ?이번엔 지도 조각으로 찾아보자/.test(pg) && !/소방서는 벌써 가 봤지\? ?그럼 나 좀 데려가/.test(pg), '1-1 쪽지 = 「' + (pg.match(/소방서는 아까[^.]*\./) || [''])[0] + '」'); }
    await closeAll(p); await p.evaluate(() => SM_TOWN.storyAt('a1_1', 1)); await p.waitForTimeout(900); { const q = await p.evaluate(() => SM_TOWN.story().step); ok(q && q.id === 'tmap', '같이 가 본 소방서라도 보물 지도 첫 장은 그대로(' + (q && q.id) + ')'); }
    await closeAll(p); await p.evaluate(() => { const P = SM_TOWN.places().find(q => q.name === '작은 도서관' && q.door); if (P) { const x = P.door[0] + 2, z = P.door[1]; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 1.5, z]); } SM_TOWN.storyAt('a1_1', 2); }); await p.waitForTimeout(900); { const q = await p.evaluate(() => SM_TOWN.story().step); ok(q && q.id === 'post', '안 가 본 우체국은 그대로 걷기(' + (q && q.id) + ')'); }   /* ③에서 우체국에 서 있던 몸을 도서관 앞으로(서 있으면 바로 넘어가므로) */
    await closeAll(p); await p.evaluate(() => { SM_TOWN.storyOff(); const s = SM_TOWN.game().S.story; s.done = { p0: { d: 1 } }; s.fw['우체국'] = 1; s.autoNext = null; SM_TOWN.storyAt('a1_1', 2); }); await p.waitForTimeout(900);
    { const q = await p.evaluate(() => ({ st: SM_TOWN.story().step, rec: ((SM_TOWN.game().S.story.rec || {}).a1_1 || { st: {} }).st.post, ban: (document.getElementById('hudBan') || {}).textContent || '' })); ok(!(q.st && q.st.id === 'post') && q.rec && q.rec.solo === 1, '같이 간 우체국 = 건너뜀(새 친구 혼자) · 기록 solo'); ok(/혼자 찾아가요/.test(q.ban) || (!q.st && /끝/.test(q.ban)), '배너 = 「' + q.ban + '」(우체국이 1-1 마지막 단계라 건너뛰면 곧 장 끝 배너 — 새 친구 말은 그대로)'); }
    await p.evaluate(() => { SM_TOWN.storyOff && SM_TOWN.storyOff(); const s = SM_TOWN.game().S.story; delete s.fw; });
    console.log('③-3 첫 완료 뒤 할 일 하나(ONE-1) — 프롤로그만 끝낸 날 = 잔치 첫 안내 X');
    { const F1 = await p.evaluate(() => { const G = SM_TOWN.game().S, s = G.story; s.done = { p0: { d: G.day } }; s.cur = 'a1_1'; s.i = 1; const f = G.feast; if (f) f.ann0 = -1; const a0 = f ? f.ann0 : null; return { a0, n: f ? f.n : null }; }); for (let i = 0; i < 3; i++) { await closeAll(p); await p.evaluate(() => SM_TOWN.feast && SM_TOWN.feast().sec(true)); await p.waitForTimeout(150); }
      const F2 = await p.evaluate(() => { const f = SM_TOWN.game().S.feast; return { ann0: f ? f.ann0 : null, n: f ? f.n : null }; }); ok(F2.ann0 !== F2.n, '1-1 하는 동안 잔치 첫 안내가 안 뜸(ann0 ' + F2.ann0 + ')');
      await p.evaluate(() => { const G = SM_TOWN.game().S, s = G.story; s.done.a1_1 = { d: G.day }; s.cur = null; s.autoNext = null; }); for (let i = 0; i < 3; i++) { await closeAll(p); await p.evaluate(() => SM_TOWN.feast && SM_TOWN.feast().sec(true)); await p.waitForTimeout(150); }
      const F3 = await p.evaluate(() => { const f = SM_TOWN.game().S.feast; return { ann0: f ? f.ann0 : null, n: f ? f.n : null }; }); ok(F3.ann0 === F3.n, '1-1이 끝나면 잔치 첫 안내(ann0 ' + F3.ann0 + ')'); await closeAll(p); }
    console.log('④ 이어하기 = 지난 자리');
    const L0 = await p.evaluate(() => { const P = SM_TOWN.places().find(q => /우체국|마트/.test(q.name)); const x = P.x + 5, z = P.z + 5; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 1.5, z]); return P.name; }); await p.waitForTimeout(4200); await p.evaluate(() => SM_TOWN.save().flush()); const A0 = await where(p);
    await p.reload(); await ready(p); await click(p, 'x'); await p.waitForTimeout(1500); const A1 = await where(p);
    ok(Math.hypot(A1.x - A0.x, A1.z - A0.z) < 3 && !(A1.open && A1.open.board), '지난 자리(' + L0 + ' 곁)에서 이어짐 · 첫 아침 장면 X');
    await ctx.close();
    { console.log('⑥ 2분 넘게 막힘 = 그때만 쪽지가 먼저 옴'); ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); p = await ctx.newPage(); watch(p, 'C'); await p.goto(URL); await ready(p);
      await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="new"],.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(1600);
      const o0 = await p.evaluate(() => SM_TOWN.opening()); if (!o0) { await p.evaluate(() => { const b9 = [...document.querySelectorAll('.twn-p button')].find(e => /처음부터/.test(e.textContent)); if (b9) b9.click(); }); await p.waitForTimeout(800); await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="ok"],.twn-p [data-a="yes"]'); if (b9) b9.click(); }); await p.waitForTimeout(3000); }
      const o1 = await p.evaluate(() => SM_TOWN.opening({ idle: 117 })); await p.waitForTimeout(4200); const c1 = await p.evaluate(() => SM_TOWN.game().S.story && SM_TOWN.game().S.story.cur);
      ok(o1 && c1 === 'p0', '가만히 2분(막힌 초 120) = 프롤로그 쪽지가 먼저 옴(' + c1 + ')'); await ctx.close(); }
    if (SHOTS) { console.log('⑤ 휴대폰 세로 첫 10초'); ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }); p = await ctx.newPage(); watch(p, 'M'); await p.goto(URL); await ready(p); await shot(p, 'open_0_title_phone'); await click(p, 'x'); await p.waitForTimeout(2500); await shot(p, 'open_1_first10s_phone'); W = await where(p); ok(/현관 칠판/.test(W.goal) && /행동/.test(W.goal), '휴대폰 첫 할 일 = ' + W.goal); await ctx.close(); }
  } catch (e) { console.error(e); fails++; }
  console.log('페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
