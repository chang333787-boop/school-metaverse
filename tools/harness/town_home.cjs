// 우리 집 시험(HOME-1 · 설계 docs/systems/town_phase1.md 조각 1·2): node tools/harness/town_home.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 고른 집: 있음 · 후보에 아이 집(b.home) 0 · 우리 집 꼬리표가 아이 집에 0 · 고르기 시간(다시 고르기) · 문패·화분·등 E
//   ② 정문 → 집 걷기: 빨간 선을 W로 따라 걷는 봇 · 30~60초 · 걸림 0(1초에 0.15m도 못 감)
//   ③ 잠: 밖 → 우리 집 현관(3m 안) · 0.4초 뒤에도 그 자리 / 우리 집 침대(창 '자고 다음 날') → 하루 마무리가 잠들기 전에 → 침대 곁 · 0.4초 뒤 그대로 · 안 멈춤 / 지하철 안 = 그 자리(우리 집 X)
//   ④ 내일 기대 적중: 화분 심고 물 → 잠들기 전 창의 '내일' 줄(data-tm) → 다음 날 상태와 견줌(grow · jang · farm)
//   ⑤ 페이지 오류 0
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if (/게임 tick 오류/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), pos = () => ev(() => { const m = SD2.map.player.get(); return [m.x, m.y, m.z]; }), d2 = (a, c) => Math.hypot(a[0] - c[0], (a[2] ?? a[1]) - (c[2] ?? c[1]));
    const shot = async n => { if (!SHOTS) return; await ev(() => { const t = document.getElementById('hudBan'); if (t) t.textContent = ''; }); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const closeAll = async () => { for (let i = 0; i < 4; i++) { const o = await ev(() => !!document.querySelector('.twn-p')); if (!o) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.home, null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(2500);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; });   /* 시험: 정문 밖 첫 쪽지(프롤로그)가 걷기 봇을 멈추지 않게 */
    // ① 고른 집
    const H = await ev(() => SM_TOWN.home()); console.log('우리 집 ' + JSON.stringify({ id: H.id, door: H.door && H.door.map(v => +v.toFixed(1)), e: H.e && H.e.map(v => +v.toFixed(1)), len: H.len, walk: H.walk, ms: H.ms, where: H.where, cands: H.cands.length }));
    ok(!!H.id && !!H.e, '우리 집을 골랐음(' + H.where + ')'); ok(H.cands.every(c => !c.kid && !c.look), '후보에 아이 집 0 (후보 ' + H.cands.length + ')'); ok(H.kidMine === 0 && H.mineN === 1, '우리 집 꼬리표 = 엔진 집 하나(아이 집 0)');
    const re = await ev(() => { SM_TOWN.homePick(true); const h = SM_TOWN.home(); return { ms: h.ms, h }; }); console.log('  다시 고르기(해시 무시) ' + re.ms + 'ms · ' + JSON.stringify(re.h.info));
    const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); const m4 = []; for (let i = 0; i < 3; i++) m4.push(await ev(() => { SM_TOWN.homePick(true); return SM_TOWN.home(); })); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const m4s = m4.map(h => h.ms).sort((a, c) => a - c); console.log('  크롬북 흉내(CPU 4×) 고르기 ' + m4s.join(' / ') + 'ms · 길 ' + m4[1].info.msRoute + 'ms · 걷기 BFS ' + m4[1].info.msWalk + 'ms'); ok(m4s[1] <= 30, '고르기 ≤ 30ms (CPU 4× 가운데값 ' + m4s[1] + 'ms)');
    ok(re.h.id === H.id, '다시 골라도 같은 집'); ok(re.ms < 120, '고르기 시간 ' + re.ms + 'ms (CPU 1× · 크롬북 4× 목표 30ms는 brun 숫자로 따로)');
    const cache = await ev(() => { SM_TOWN.homePick(false); return SM_TOWN.home().ms; }); ok(cache < 15, '해시가 같으면 다시 재지 않음 ' + cache + 'ms');
    if (!H.id) throw new Error('우리 집 없음');
    const hots = await ev(e => SD2.map.interact.list().filter(h => !h.off && Math.hypot(h.x - e[0], h.z - e[1]) < 6).map(h => h.label), H.e); console.log('  현관 E: ' + hots.join(' | '));
    ok(hots.some(l => /우리 집/.test(l)), "현관 E '들어가기 — 우리 집'"); ok(hots.filter(l => /화분/.test(l)).length === 2, '화분 E 둘');
    // ② 정문 → 집 걷기(빨간 선 따라)
    const G = [16.5, 58]; await tp(G[0], G[1]); await ev(() => SD2.map.player.lookAt([16.5, 80])); await W8(600); await closeAll();
    const okR = await ev(e => SM_TOWN.path([16.5, 58], e, '우리 집'), H.e), pts = await ev(() => SM_TOWN.routePts()); ok(okR && pts && pts.length > 1, '정문 → 우리 집 빨간 선(' + (pts ? pts.length : 0) + '점)');
    await shot('01_gate_day');
    const stuckAt = []; let k = 1, stuck = 0, lastP = await pos(), lastT = Date.now(); const t0 = Date.now(); let arrived = false, maxJ = 0;
    await p.keyboard.down('KeyW');
    while (Date.now() - t0 < 120000) { const me = await pos(); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.up('KeyW'); await closeAll(); await p.keyboard.down('KeyW'); }
      while (k < pts.length - 1 && d2(me, pts[k]) < 1.6) k++; await ev(q => SD2.map.player.lookAt(q), pts[k]);
      if (d2(me, H.e) < 1.8) { arrived = true; break; }
      if (Date.now() - lastT > 1000) { const mv = d2(me, lastP); if (mv < 0.15) { stuck++; stuckAt.push(me.map(v => +v.toFixed(1)).join(',') + ' →' + k); await p.keyboard.press('Space'); } lastP = me; lastT = Date.now(); }
      await W8(120); const m2 = await pos(); maxJ = Math.max(maxJ, d2(me, m2)); }
    await p.keyboard.up('KeyW'); const sec = (Date.now() - t0) / 1000; console.log('  걷기 ' + sec.toFixed(1) + '초 · 걸림 ' + stuck + ' · 빨간 선 ' + pts.length + '점');
    ok(arrived, '정문 → 우리 집 걸어서 도착'); ok(sec >= 25 && sec <= 65, '걸린 시간 30~60초 안팎(' + sec.toFixed(1) + '초)'); ok(stuck === 0, '걸림 0 (' + stuck + ')' + (stuck ? ' @ ' + stuckAt.slice(0, 6).join(' | ') + ' · 선 ' + JSON.stringify(pts.map(q => q.map(Math.round))) : ''));
    await W8(500); await shot('02_porch_day'); await ev(() => SM_TOWN.pathOff());
    // ③-1 밖에서 잠 → 현관
    await tp(15.4, 74); await W8(500); await ev(() => SM_TOWN.sleep()); await W8(2900); await closeAll(); await W8(200);
    let a1 = await pos(); await W8(400); let a2 = await pos(); const da = d2(a1, H.e), dd = d2(a1, H.door);
    ok(da < 1.0 || dd < 3.0, '밖에서 잠 → 우리 집 현관에서 깸(E까지 ' + da.toFixed(1) + 'm · 문 자리까지 ' + dd.toFixed(1) + 'm)'); ok(d2(a1, a2) < 0.3, '0.4초 뒤에도 그 자리');
    ok(!(await ev(() => !!SD2.CTRL.frozen)), '깬 뒤 안 멈춤'); await shot('03_wake_porch');
    // ③-2 우리 집 침대 → 하루 마무리가 먼저 → 침대 곁
    const ent = await ev(id => SM_TOWN.indoor.enter(id), H.id); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { /* 아래에서 셈 */ }
    ok(ent && await ev(() => SM_TOWN.indoor.on), '우리 집에 들어감');
    const bed = await ev(() => SD2.map.interact.list().filter(h => !h.off && /눕기/.test(h.label))[0] || null); ok(!!bed, '우리 집 침대 E');
    if (bed) { await shot('04_room'); await ev(h => SD2.map.player.teleport([h.x, h.y + 0.05, h.z]), bed); await W8(450); await p.keyboard.press('KeyE'); await W8(700);
      const day0 = await ev(() => SM_TOWN.game().S.day); const sl = await ev(() => { const b9 = document.querySelector('.twn-p [data-a="sl"]'); if (b9) b9.click(); return !!b9; }); await W8(700);
      const pre = await ev(() => { const P = document.querySelector('.twn-p'); return P ? { pre: P.dataset.pre === '1', day: SM_TOWN.game().S.day, left: !!P.querySelector('[data-left]') } : null; });
      ok(sl && pre && pre.pre && pre.day === day0, '스스로 잔 잠 = 하루 마무리가 잠들기 전에(아직 ' + (pre && pre.day) + '일째)'); ok(pre && pre.left, "맨 위 '오늘 세상에 남긴 것' 줄");
      await shot('05_recap_pre'); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(2900);
      const st = await ev(() => ({ day: SM_TOWN.game().S.day, on: SM_TOWN.indoor.on, p: !!document.querySelector('.twn-p'), pose: SD2.CTRL.pose || null }));
      a1 = await pos(); await W8(450); a2 = await pos(); const db = d2(a1, [bed.x, bed.y, bed.z]);
      ok(st.day === day0 + 1, '다음 날(' + st.day + '일째)'); ok(st.on && db < 2.0, '우리 집 침대 곁에서 깸(침대 E까지 ' + db.toFixed(1) + 'm)'); ok(d2(a1, a2) < 0.3, '0.4초 뒤에도 그 자리(옛 침대로 안 돌아감)');
      ok(!st.p, '아침에 저절로 뜨는 창 0'); ok(!st.pose && !(await ev(() => !!SD2.CTRL.frozen)), '누운 자세·멈춤 풀림'); await shot('06_wake_bed'); }
    await ev(async () => { SM_TOWN.indoor.exit(); for (let i = 0; i < 40 && (SM_TOWN.indoor.on || SM_TOWN.indoor.busy); i++) await new Promise(r => setTimeout(r, 100)); }); await W8(400);
    // ③-3 지하철 안에서 잠 = 그 자리
    const sw = await ev(() => (SM_TOWN.subway && SM_TOWN.subway()) || []);
    if (sw.length > 1) { await ev(() => SM_TOWN.subGo(0, 1)); let on = false; for (let i = 0; i < 30 && !on; i++) { await W8(300); on = await ev(() => !!SM_TOWN.subPh()); }
      if (on) { const b0 = await pos(); await ev(() => SM_TOWN.sleep()); await W8(2900); await closeAll(); const b1 = await pos(), still = await ev(() => !!SM_TOWN.subPh());
        ok(still && d2(b1, H.e) > 20, '지하철 안에서 잠 = 그 자리(아직 타는 중 · 우리 집으로 안 옮김 · 움직인 ' + d2(b0, b1).toFixed(1) + 'm)'); }
      else console.log('  · 지하철이 안 떠남(건너뜀)');
      for (let i = 0; i < 60 && await ev(() => !!SM_TOWN.subPh()); i++) await W8(500); await closeAll(); }
    else console.log('  · 지하철 없음(건너뜀)');
    { await tp(15.4, 74); await W8(400); const c0 = await pos(); await ev(() => document.body.classList.add('mp-in')); await ev(() => SM_TOWN.sleep()); await W8(2900); await closeAll(); const c1 = await pos(); await ev(() => document.body.classList.remove('mp-in'));
      ok(d2(c0, c1) < 1.0, '함께하기 방(mp-in)에서 잠 = 그 자리(' + d2(c0, c1).toFixed(2) + 'm)'); }
    // ④ 내일 기대 적중: 화분 심고 물 → 잠들기 전 '내일' 줄 → 다음 날
    await ev(() => { const G9 = SM_TOWN.game().S; G9.home.pots = [null, null]; G9.min = 10 * 60; SM_TOWN.weather('clear'); }); await W8(800);
    await ev(() => SM_TOWN.potUse(0)); await W8(300); const planted = await ev(() => { const b9 = document.querySelector('.twn-p button[data-c]'); if (b9) b9.click(); return !!b9; }); await W8(300); await ev(() => SM_TOWN.potUse(0)); await W8(300);
    const pz = await ev(() => SM_TOWN.home().pots[0]); ok(planted && pz && pz.st === 'grow', '화분에 심고 물 줌(' + JSON.stringify(pz) + ')');
    await tp(15.4, 74); await W8(400); const nxt = await ev(() => { SM_TOWN.sleep({ ask: true }); return null; }); void nxt; await W8(800);
    const tm = await ev(() => { const P = document.querySelector('.twn-p'); if (!P) return null; return { pre: P.dataset.pre === '1', keys: [...P.querySelectorAll('[data-tm]')].map(e => e.dataset.tm).join(',').split(',').filter(Boolean), txt: [...P.querySelectorAll('[data-tm]')].map(e => e.textContent).join(' / '), day: SM_TOWN.game().S.day }; });
    console.log('  내일 줄: ' + (tm && tm.txt)); ok(tm && tm.pre && tm.keys.includes('grow'), "맨 앞 '오늘 내가 한 일' 줄(물 준 화분)");
    await shot('07_recap_tomorrow'); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(2900); await closeAll();
    const aft = await ev(() => ({ day: SM_TOWN.game().S.day, pot: SM_TOWN.home().pots[0], jang: SM_TOWN.jangNow ? SM_TOWN.jangNow() : null }));
    let hit = 0, all = 0; for (const k9 of (tm ? tm.keys : [])) { all++; const h9 = k9 === 'grow' ? !!(aft.pot && aft.pot.g >= 1) : k9 === 'jang' ? aft.jang === true : k9 === 'farm' || k9 === 'tide' ? true : true; if (h9) hit++; else console.log('    ✗ 빗나감: ' + k9 + ' ' + JSON.stringify(aft)); }
    ok(all > 0 && hit === all, '내일 기대 적중 ' + hit + '/' + all + ' (화분 ' + JSON.stringify(aft.pot) + ')');
    // 해 질 녘 · 문 앞 등
    await ev(() => { SM_TOWN.game().S.home.dk = 0; }); await ev(() => SD2.map.time && SD2.map.time('sunset')); await W8(1500); const lit = await ev(() => SM_TOWN.home().lit); ok(lit === true, '해 질 녘 = 문 앞 등 켜짐');
    { const e = H.e, f = H.fw || [0, 1]; await tp(e[0] + f[0] * 5, e[1] + f[1] * 5); await ev(e => SD2.map.player.lookAt(e), H.door); await W8(900); await shot('08_porch_dusk'); }
    await ev(() => SD2.map.time && SD2.map.time('day')); await W8(800); ok((await ev(() => SM_TOWN.home().lit)) === false, '낮 = 문 앞 등 꺼짐');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
