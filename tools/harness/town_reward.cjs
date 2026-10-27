// 레벨 보상 시험(REWARD-1 · 사용자 10-26 '보상이 뭔 자전거밖에 없네'): node tools/harness/town_reward.cjs [마을=ourtown] [포트=8002]
//   솜씨 여섯을 2레벨로 → 🎁 칩 하나(6) → 칩을 누를 때마다 창에 그 보상 이름 → 받기 → 가진 것에 들어감
//   효과가 실제로 작동: 장화(갯벌·논 걸음 0.62 → 1 · 실제로 걸은 거리) · 망원경(1인칭·화각 ÷3·가운데 장소 이름) · 이마 전등(밤에만 빛) · 내 좌판(두고 → 다음 아침 돈) · 장터 수첩 줄
//     · 큰 물통(물통 두 배) · 요리법(부엌 창에 새 요리) · 딸기 모종(텃밭 고르기 칸) · 모자(머리에 메시) · 5레벨 고르기 → 10레벨에 다른 하나 · 옛 저장(높은 레벨) = 빠진 보상이 칩 하나에 쌓임 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos9[0] || 'ourtown', PORT = pos9[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  const panelK = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? (P.dataset.k || '?') : ''; });
  const panelT = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? P.textContent : ''; });
  const closeAll = async () => { for (let i = 0; i < 6; i++) { if (await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn()))) { await p.keyboard.press('Escape'); await W8(250); continue; } const k = await panelK(); if (!k) break; if (k === 'lvr') { await p.keyboard.press('Escape'); await W8(250); continue; } await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); if (await panelK()) { await p.keyboard.press('Escape'); await W8(250); } } };
  const chip = () => ev(() => { const c = [...document.querySelectorAll('.gchip')].find(e => /🎁/.test(e.textContent)); return c ? c.textContent : null; });
  const prep = () => ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 10 * 60; G.syncPhase && G.syncPhase('day'); G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; G.S.story = G.S.story || {}; G.S.story.p0auto = 1; (G.S.quiz || (G.S.quiz = {})).tip = 1; if (G.rwOff) G.rwOff(true); });
  const boot = async () => { await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.rwd && window.SD2, null, { timeout: 240000 }); await W8(2000); await closeAll(); for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await W8(200); } await ev(() => { const G = SM_TOWN.game(); G.S.story = G.S.story || {}; G.S.story.done = G.S.story.done || {}; G.S.story.done.p0 = 1; }); await prep(); await W8(600); await closeAll(); };
  /* 솜씨 k를 L레벨 바로 밑까지 채우고 skUp 한 번 = 레벨업(놀이와 같은 길) */
  const lvTo = (k, L) => ev(([k, L]) => { const S = SM_TOWN.game().S; S.skill = S.skill || {}; const Lv = () => SM_TOWN.skills().L[k]; let v = 0; S.skill[k] = 0; while (Lv() < L && v < 1e5) { v++; S.skill[k] = v; } S.skill[k] = v - 1; S.skillDay = null; SM_TOWN.skUp(k, 1, 'test'); return Lv(); }, [k, L]);
  const takeOne = async (btn) => { await ev(() => { [...document.querySelectorAll('.gchip')].find(e => /🎁/.test(e.textContent)).click(); }); await W8(450); const k = await panelK(), t = await panelT(); if (k === 'lvr') { await ev(b9 => { const B = document.querySelector('.twn-p [data-a="' + b9 + '"]'); if (B) B.click(); }, btn || 'x'); await W8(450); } return { k, t }; };
  const walk = async (ms) => { const a = await ev(() => { const m = SD2.map.player.get(); return [m.x, m.z]; }); await p.keyboard.down('KeyW'); await W8(ms); await p.keyboard.up('KeyW'); await W8(200); const c = await ev(() => { const m = SD2.map.player.get(); return [m.x, m.z]; }); return Math.hypot(c[0] - a[0], c[1] - a[1]); };
  try { await boot(); const SK = ['work', 'cook', 'farm', 'look', 'trade', 'explore'];
    console.log('① 새 저장 = 받을 것 없음 · 솜씨 여섯을 2레벨로');
    ok((await ev(() => SM_TOWN.lvq().length)) === 0 && !(await chip()), '처음엔 칩 없음');
    for (const k of SK) await lvTo(k, 2); await W8(2600); await closeAll();
    const c6 = await chip(); ok(/🎁/.test(c6 || '') && /6/.test(c6 || ''), '칩 하나에 여섯(' + c6 + ')'); ok((await panelK()) !== 'lvr', '창은 저절로 안 뜸');
    console.log('② 장화 전: 갯벌·논에서 느림');
    const mud = await ev(() => { const R = SM_TOWN.rwd, sp = R.spot('mud'); if (!sp) return null; for (let r = 0; r <= 80; r += 2) for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, x = sp[0] + Math.cos(a) * r, z = sp[1] + Math.sin(a) * r; if (R.soft(x, z) && R.soft(x + 3, z) && R.soft(x, z + 3) && R.soft(x - 3, z) && R.soft(x, z - 3)) { const y = SD2.map.q.groundAt(x, z, 50); SD2.map.player.teleport([x, y + 0.05, z]); return { x, z, k: R.soft(x, z), nm: sp[2] }; } } return { none: sp[2] }; });
    let d0 = 0;
    if (mud && !mud.none) { await W8(900); const st = await ev(() => ({ mud: SM_TOWN.rwd.mud(), sp: SD2.map.stats().speed })); ok(!!st.mud && st.sp < 0.7, '장화 없이 ' + mud.k + ' 위 걸음 빠르기 ' + st.sp.toFixed(2) + '(< 0.7)'); d0 = await walk(1000); await ev(m => { SD2.map.player.teleport([m.x, SD2.map.q.groundAt(m.x, m.z, 50) + 0.05, m.z]); }, mud); await W8(700); }
    else ok(false, '갯벌·논 자리를 못 찾음(' + JSON.stringify(mud) + ')');
    console.log('③ 칩을 누를 때마다 창 하나 · 받기');
    for (let i = 0; i < 6; i++) { const q = await ev(() => SM_TOWN.lvq()[0]), exp = await ev(q => { const it = SM_TOWN.rwd.item(q[0], q[1]); return it ? it.t[0] : null; }, q);
      const r = await takeOne('x'); ok(r.k === 'lvr', (q ? q.join(' ') : '?') + ': 창 열림'); const nmK = await ev(q => { const R = SM_TOWN.rwd, it = R.item(q[0], q[1]); return it ? it.t[0] : ''; }, q);
      ok(!!nmK, q.join(' ') + ': 받은 것 = ' + nmK); ok(!exp || r.t.includes(exp), q.join(' ') + ': 창에 「' + exp + '」'); }
    ok(!(await chip()), '여섯 다 받으면 칩 사라짐');
    const own = await ev(() => SM_TOWN.rwd.own()); ok(['gloves', 'r:🍛', 'boots', 'scope', 'book', 'hike'].every(q => own.includes(q)), '가진 것: ' + own.join(' '));
    console.log('④ 장화 뒤: 같은 자리에서 그대로 걸음');
    if (mud && !mud.none) { await W8(800); const st = await ev(() => ({ mud: SM_TOWN.rwd.mud(), sp: SD2.map.stats().speed })); ok(st.sp > 0.95, '장화 신고 ' + (st.mud || '-') + ' 위 걸음 빠르기 ' + st.sp.toFixed(2)); const d1 = await walk(1000); ok(d1 > d0 * 1.3, '1초 걸은 거리 ' + d0.toFixed(1) + 'm → ' + d1.toFixed(1) + 'm'); }
    console.log('⑤ 망원경(도구 띠 6)');
    { await ev(() => { SD2.map.player.teleport([16.5, SD2.map.q.groundAt(16.5, 70, 50) + 0.05, 70]); }); await W8(500); await closeAll();
      await p.keyboard.press('Digit6'); await W8(600); const I = await ev(() => SM_TOWN.tools.info()); ok(I.cur === 'scope' && I.shown === 'scope', '6 = 망원경 들기(' + I.cur + '/' + I.shown + ')');
      const tg = await ev(() => { const me = SD2.map.player.get(); const P = SM_TOWN.places().filter(q => { const d = Math.hypot(q.x - me.x, q.z - me.z); return d > 120 && d < 500 && !q.school; }); const q = P[0]; if (!q) return null; SD2.map.player.lookAt([q.x, q.z]); return { name: q.name, x: q.x, z: q.z }; });
      await p.keyboard.press('KeyF'); await W8(1600); const s1 = await ev(() => ({ sc: SM_TOWN.rwd.scope(), first: SD2.map.player.first, fov: SD2.map.camera ? SD2.map.camera.fov : null }));
      ok(s1.sc.on && s1.first, '누르면 1인칭 망원경'); ok(s1.fov != null && s1.fov < 30, '화각 좁아짐(' + (s1.fov && s1.fov.toFixed(1)) + '°)'); ok(!tg || s1.sc.text.includes(tg.name) || /🔭/.test(s1.sc.text), '가운데 글: ' + s1.sc.text + (tg ? ' (겨눈 곳 ' + tg.name + ')' : ''));
      ok(!tg || s1.sc.text.includes(tg.name), '겨눈 장소 이름이 나옴');
      await p.keyboard.press('KeyF'); await W8(1400); const s2 = await ev(() => ({ sc: SM_TOWN.rwd.scope(), first: SD2.map.player.first, fov: SD2.map.camera.fov })); ok(!s2.sc.on && !s2.first && s2.fov > 45, '한 번 더 = 끝(3인칭 · ' + s2.fov.toFixed(1) + '°)'); await p.keyboard.press('Digit6'); await W8(300); }
    console.log('⑥ 이마 전등(탐험 3) · 큰 물통(농사 3)');
    { await lvTo('explore', 3); await lvTo('farm', 3); await W8(2600); await closeAll(); for (let i = 0; i < 2; i++) await takeOne('x'); const own2 = await ev(() => SM_TOWN.rwd.own()); ok(own2.includes('lamp') && own2.includes('tank'), '전등·물통 받음');
      await ev(() => { const G = SM_TOWN.game(); G.syncPhase('night'); }); await W8(1600); ok(await ev(() => SM_TOWN.rwd.lamp()), '밤 = 이마 전등 빛이 켜짐');
      await ev(() => { const G = SM_TOWN.game(); G.syncPhase('day'); }); await W8(1600); ok(!(await ev(() => SM_TOWN.rwd.lamp())), '낮 = 빛 꺼짐');
      await p.keyboard.press('Digit1'); await W8(500); const tk = await ev(() => { SM_TOWN.tools.fill(); return SM_TOWN.tools.info().tank; }); ok(tk >= 199, '물통 가득 = ' + tk + '(예전 100)'); await p.keyboard.press('Digit1'); await W8(300); }
    console.log('⑦ 내 좌판 · 장터 수첩(살림 3)');
    { await lvTo('trade', 3); await W8(2600); await closeAll(); await takeOne('x'); ok((await ev(() => SM_TOWN.rwd.own())).includes('stall'), '좌판 받음');
      const st = await ev(() => { const w = SM_TOWN.stallsAt()[0]; if (!w) return null; SD2.map.player.teleport([w.x + 2, SD2.map.q.groundAt(w.x + 2, w.z, 50) + 0.05, w.z]); const G = SM_TOWN.game(); G.add('🥔', 3, 'mv:test'); G.add('🍐', 2, 'mv:test'); SM_TOWN.bagRefresh(); return w; }); await W8(500);
      if (!st) ok(false, '장터 없음'); else { await ev(() => SM_TOWN.mk.open(0)); await W8(500); const t0 = await panelT(); ok(/내 좌판/.test(t0), '장터 창에 내 좌판 줄'); 
        const m0 = await ev(() => SM_TOWN.game().S.money); for (let i = 0; i < 3; i++) { await ev(() => { const B = document.querySelector('.twn-p [data-rwst]'); if (B) B.click(); }); await W8(250); }
        const s9 = await ev(() => SM_TOWN.rwd.stall()); ok(s9 && s9.it && s9.it.length === 3, '좌판에 셋(' + (s9 && s9.it ? s9.it.map(q => q[0]).join('') : '-') + ')'); ok(!(await ev(() => !!document.querySelector('.twn-p [data-rwst]'))), '셋 다 차면 더 못 둠');
        await closeAll(); await ev(() => SM_TOWN.rwd.stPay()); await W8(300); const m1 = await ev(() => SM_TOWN.game().S.money), v9 = s9.it.reduce((a, q) => a + q[1], 0); ok(m1 - m0 === v9 && v9 > 0, '다음 아침 돈 +' + (m1 - m0) + '(둔 값 ' + v9 + ')'); ok(!(await ev(() => SM_TOWN.rwd.stall())), '판 뒤 좌판 비움'); } }
    { const bk = await ev(() => { const W = SM_TOWN.stallsAt(), E = ['🥔', '🍐', '🧂', '🐟', '🍄', '🥬', '🍚', '🐚', '🌿', '🍯']; let best = null; W.forEach((w, i) => { for (const e of E) { const here = SM_TOWN.mk.price(e, w.reg); const mx = Math.max(...W.filter(q => q.mk !== w.mk).map(q => SM_TOWN.mk.price(e, q.reg))); if (here > 0 && mx / here > 1.15 && (!best || mx / here > best.r)) best = { i, e, r: mx / here, nm: w.mk }; } }); if (!best) return null; const w = W[best.i]; SD2.map.player.teleport([w.x + 2, SD2.map.q.groundAt(w.x + 2, w.z, 50) + 0.05, w.z]); SM_TOWN.game().add(best.e, 1, 'mv:test'); SM_TOWN.bagRefresh(); return best; });
      if (!bk) ok(true, '(다른 장터가 더 쳐주는 물건이 없는 마을 — 장터 수첩 줄 건너뜀)'); else { await W8(400); await ev(i => SM_TOWN.mk.open(i), bk.i); await W8(500); const t1 = await panelT(); ok(/📒/.test(t1) && /더 쳐줘요/.test(t1), '장터 수첩: ' + bk.nm + '에서 ' + bk.e + ' → 「' + ((t1.match(/📒[^📒]*?쳐줘요/) || [''])[0]) + '」'); await closeAll(); } }
    console.log('⑧ 요리법(요리 2) · 딸기 모종 고르기(농사 5) · 모자(일솜씨 3)');
    { await ev(() => { SM_TOWN.cook(); }); await W8(400); ok((await panelT()).includes('카레라이스'), '부엌 창에 카레라이스'); await closeAll();
      await lvTo('farm', 5); await W8(2600); await closeAll(); for (let i = 0; i < 5; i++) { const q = await ev(() => SM_TOWN.lvq()[0]); if (!q || q[0] !== 'farm') { if (!q) break; await takeOne('x'); continue; } if (q[1] === 5) { const r = await takeOne('y'); ok(r.t.includes('딸기 모종') && r.t.includes('사철 씨앗'), '5레벨 = 둘 가운데 고르기 창'); break; } await takeOne('x'); }
      ok((await ev(() => SM_TOWN.rwd.own())).includes('berry'), '딸기 모종 고름'); const fs = await ev(() => { const F = SM_TOWN.farm(); return F.length; }); if (fs) { await ev(() => { SM_TOWN.game().S.farm[0] = null; SM_TOWN.farmUse(0); }); await W8(400); ok((await panelT()).includes('딸기'), '텃밭 씨앗 고르기에 🍓 딸기'); await closeAll(); } else ok(true, '(학교 텃밭 없음 — 고르기 칸 시험 건너뜀)');
      await lvTo('work', 3); await W8(2600); await closeAll(); while ((await ev(() => SM_TOWN.lvq().length)) > 0) await takeOne('y'); await W8(400); await closeAll(); ok((await ev(() => SM_TOWN.rwd.hat())) === 'straw', '밀짚모자를 머리에 씀(' + (await ev(() => SM_TOWN.rwd.hat())) + ')');
      console.log('⑧-2 WEAR-1: 받을 때 「가방에 넣기」 = 안 씀 · 가방 👕 칸에서 쓰기/벗기 · 장비 켜짐 · 이마 전등 끄기');
      { await lvTo('explore', 4); await W8(2600); await closeAll(); const r4 = await takeOne('x'); ok(r4.t.includes('지금 쓰기') && r4.t.includes('가방에 넣기'), '모자 받기 창 = 「지금 쓰기」·「가방에 넣기」'); await W8(300); await closeAll();
        ok((await ev(() => SM_TOWN.rwd.own())).includes('h:beanie') && (await ev(() => SM_TOWN.rwd.hat())) === 'straw', '털모자 받음 · 「가방에 넣기」라 그대로 밀짚모자(' + (await ev(() => SM_TOWN.rwd.hat())) + ')');
        await ev(() => SM_TOWN.rwd.wardrobe()); await W8(500); ok((await panelK()) === 'I' && (await ev(() => !!document.querySelector('.twn-p [data-rwbag]'))), '솜씨 창 단추 길 = 가방 창 👕 칸');
        const c0 = await ev(() => { const q = id => document.querySelector('.twn-p [data-rwcard="' + id + '"]'); return { st: q('h:straw') ? q('h:straw').textContent : '', bn: q('h:beanie') ? q('h:beanie').textContent : '' }; }); ok(/지금 씀/.test(c0.st) && /쓰기/.test(c0.bn) && !/지금 씀/.test(c0.bn), '카드: 밀짚 「지금 씀」 · 털모자 「쓰기」');
        await ev(() => document.querySelector('.twn-p [data-rww="hat:beanie"]').click()); await W8(500); ok((await ev(() => SM_TOWN.rwd.hat())) === 'beanie' && (await ev(() => SM_TOWN.rwd.state().hat)) === 'beanie' && (await panelK()) === 'I', '가방에서 털모자 쓰기 → 머리에 털모자(하나만)');
        ok(await ev(() => /지금 씀/.test((document.querySelector('.twn-p [data-rwcard="h:beanie"]') || {}).textContent || '') && !/지금 씀/.test((document.querySelector('.twn-p [data-rwcard="h:straw"]') || {}).textContent || '')), '「지금 씀」이 털모자로 옮겨 감');
        await ev(() => document.querySelector('.twn-p [data-rww="hat:-"]').click()); await W8(500); ok((await ev(() => SM_TOWN.rwd.hat())) === '' && (await ev(() => SM_TOWN.rwd.state().hat)) === '', '벗기 → 모자 메시 없음');
        const gr = await ev(() => [...document.querySelectorAll('.twn-p [data-rwgear]')].map(e => e.dataset.rwgear + ':' + (/켜짐/.test(e.textContent) ? 'on' : 'off'))); ok(['gloves', 'boots', 'scope', 'hike', 'lamp'].every(k => gr.includes(k + ':on')), '장비 카드 켜짐: ' + gr.join(' '));
        await ev(() => document.querySelector('.twn-p [data-rwl]').click()); await W8(400); ok((await ev(() => SM_TOWN.rwd.state().lampOff)) === 1 && (await ev(() => /꺼 둠/.test(document.querySelector('.twn-p [data-rwgear="lamp"]').textContent))), '이마 전등 끄기 → 「꺼 둠」');
        await closeAll(); await ev(() => SM_TOWN.game().syncPhase('night')); await W8(1600); ok(!(await ev(() => SM_TOWN.rwd.lamp())), '꺼 둔 이마 전등 = 밤에도 빛 X');
        await ev(() => SM_TOWN.rwd.wardrobe()); await W8(400); await ev(() => document.querySelector('.twn-p [data-rwl]').click()); await W8(300); await closeAll(); await W8(1500); ok(await ev(() => SM_TOWN.rwd.lamp()), '다시 켜기 → 밤에 빛');
        await ev(() => SM_TOWN.game().syncPhase('day')); await W8(600);
        await ev(() => SM_TOWN.rwd.wardrobe()); await W8(500); await p.screenshot({ path: (process.env.SHOT_DIR || '/tmp') + '/wear1_bag.png' }); await closeAll(); }
      await lvTo('farm', 10); await W8(2600); await closeAll(); while ((await ev(() => SM_TOWN.lvq().length)) > 0) await takeOne('x'); await closeAll(); ok((await ev(() => SM_TOWN.rwd.own())).includes('allseed'), '10레벨에 고르지 않은 사철 씨앗도 받음'); }
    console.log('⑨ 옛 저장: 이미 높은 레벨 = 빠진 보상이 칩 하나에');
    { await ev(() => { const S = SM_TOWN.game().S; S.rwd = null; S.rank = S.rank || {}; S.rank.lvq = [['work', 4], ['look', 3]]; S.skill = {}; S.skillDay = null; SM_TOWN.game().flush && SM_TOWN.game().flush(); });
      for (const k of SK) await lvTo(k, 6); await W8(2600); await ev(() => { SM_TOWN.game().S.rwd = null; SM_TOWN.game().mark(); SM_TOWN.game().flush && SM_TOWN.game().flush(); }); await W8(300); await boot();
      const n = await ev(() => SM_TOWN.lvq().length), c = await chip(); ok(n === 30 && /30/.test(c || ''), '새로고침 뒤 빠진 보상 ' + n + '개 · 칩 「' + c + '」'); ok((await panelK()) !== 'lvr', '쏟아지지 않음(창 저절로 X)');
      const r = await takeOne('x'); ok(r.k === 'lvr' && (await ev(() => SM_TOWN.lvq().length)) === 29, '하나씩 받음(남은 29)'); }
  } catch (e) { ok(false, '하네스 예외: ' + e.message.split('\n')[0].slice(0, 200)); }
  ok(errs.length === 0, '페이지 오류 0(' + errs.length + ')' + (errs.length ? ' — ' + [...new Set(errs)].slice(0, 4).join(' | ') : ''));
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); await b.close(); process.exit(fails.length ? 1 : 0); })();
