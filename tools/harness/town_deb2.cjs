// 🗣 첫 10분 이야기 흐름(DEB-2 · 교사 11-08 '영역을 나눠서 서로 격렬하게 비난하면서 토론해서 발전하자'): node tools/harness/town_deb2.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ⑨ 첫 아침 칠판 종이 · 쪽지 = 종이 대화창(📜 ○○의 쪽지 · 얼굴 종이 · 들썩임 X)  ⑯ 마른 꽃 상자 = 바랜 색 → 물 → 원래 색 · 배너 한 줄
//   ③ 프롤로그 끝 말이 보이고 걸어 나감(화면 안 뿅 0) · 1-1 상자 → 판 자리 보상 창(그동안 112·레벨 카드 X) → 창 닫음 → 상자 반응 + 떠나는 말 → 112(말 뒤)
//   ④ 새 친구 몸 = 경찰관 곁 · 집 칸 '우체국 옆' · 같이 걷기 → 집 문 앞 손 흔들고 들어감 · 보상 🥤  ⑰ 세 보기 방위가 서로 다름(장면 다섯) · 묻기 창이 1366×768 안
//   ⑥ 18시 넘어 열린 목장의 아침 = '자고 아침에 목장으로' 할 일·단추 → 잠 → 그 단계부터 · 페이지 오류 0
const { chromium, RENDER } = require('./pw.cjs'), { walker } = require('./lib_walk.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const OUT = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fs = require('fs'); if (OUT) fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const D8 = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'], dir8 = (dx, dz) => Math.round(((Math.atan2(dx, -dz) * 57.29578 + 360) % 360) / 45) % 8;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 240))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 240)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (!OUT || !RENDER) return; await p.screenshot({ path: OUT + '/' + n + '.png' }); console.log('    📷 ' + OUT + '/' + n + '.png'); };
    const tp = (x, z, lx, lz) => ev(([x, z, lx, lz]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); }, [x, z, lx, lz]);
    const closeDlg = async () => { for (let i = 0; i < 16 && await ev(() => !!document.querySelector('.twn-dlg')); i++) { await p.keyboard.press('KeyE'); await W8(350); } };
    const shut = async () => { for (let i = 0; i < 5; i++) { const n = await ev(() => { if (document.querySelector('.twn-dlg')) return 'dlg'; const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); return 'x'; } return document.querySelector('.twn-p') ? 'p' : ''; }); if (!n) return; if (n === 'dlg') await closeDlg(); if (n === 'p') await p.keyboard.press('Escape'); await W8(300); } };
    const S = () => ev(() => { const s = SM_TOWN.story(); return { cur: s.cur, id: s.step && s.step.id, v: s.step && s.step.v, done: Object.keys((s.S && s.S.done) || {}) }; });
    const dlgWait = async ms => { for (let i = 0; i < (ms || 8000) / 250; i++) { if (await ev(() => !!document.querySelector('.twn-dlg'))) return true; await W8(250); } return false; };
    const setT = (min, dd) => ev(([m, d]) => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.min = m; if (d) G.S.day += d; }, [min, dd || 0]);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.emerg && SM_TOWN.emerg(), null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(2500);

    // ⑨ 첫 아침 칠판 종이 + 쪽지 창
    console.log('⑨ 칠판 종이 · 쪽지 = 종이');
    await shot('09a_board');
    { const B0 = await ev(() => { const h = SD2.map.interact.list().find(q => /쪽지 읽기/.test(q.label || '')); return h ? [h.x, h.z] : null; }); if (B0) { await tp(B0[0] + 0.9, B0[1] + 0.9, B0[0], B0[1]); await W8(500); await p.keyboard.press('KeyE'); await dlgWait(9000); await W8(1200); } console.log('    칠판 E 뒤 ' + JSON.stringify(await S()) + ' 대화창 ' + (await ev(() => !!document.querySelector('.twn-dlg')))); if (!(await ev(() => !!document.querySelector('.twn-dlg')))) { await ev(() => SM_TOWN.storyStart('p0')); await dlgWait(9000); await W8(1200); } }
    { const D = await ev(() => { const d = document.querySelector('.twn-dlg'); return d ? { paper: !!d.querySelector('.dbox.paper'), name: (d.querySelector('.name') || {}).textContent || '', face: (d.querySelector('.face') || {}).textContent || '', talk: !!d.querySelector('.face.talk') } : null; });
      ok(!!D && D.paper && /📜/.test(D.name) && /쪽지/.test(D.name) && D.face === '📜' && !D.talk, '프롤로그 쪽지 = 종이(' + JSON.stringify(D) + ')'); await shot('09b_note'); }
    await closeDlg(); await W8(800);

    // ⑯ 마른 꽃 → 물 → 원래 색
    console.log('⑯ 마른 꽃');
    await ev(() => SM_TOWN.storyAt('p0', 2)); await W8(1500); await closeDlg();
    let F0 = await ev(() => SM_TOWN.flDry()); const T0 = await ev(() => SM_TOWN.storyTarget());
    ok(F0.n > 0 && F0.hex.every(h => h != null), '물 줄 꽃 상자 = 바랜 색 ' + F0.n + '송이 ' + JSON.stringify(F0.hex.map(h => h == null ? null : (h >>> 0).toString(16))));
    if (T0) { const cp = await ev(() => { const q = SD2.map.player.get(); return [q.x, q.z]; }); const dx = cp[0] - T0.x, dz = cp[1] - T0.z, l = Math.hypot(dx, dz) || 1; await tp(T0.x + dx / l * 2.6, T0.z + dz / l * 2.6, T0.x, T0.z); await W8(1500); await shot('16a_dry');
      await p.keyboard.press('Digit1'); await W8(400); await ev(([x, z]) => { SD2.map.player.lookAt([x, z]); SM_TOWN.tools.aim(x, z); }, [T0.x, T0.z]); await W8(200); await p.keyboard.down('KeyF'); await W8(2300); await p.keyboard.up('KeyF'); await ev(() => SM_TOWN.tools.aim(null));
      await W8(500); const s1 = await S(), F1 = await ev(() => SM_TOWN.flDry()); ok(s1.id !== 'bed' && F1.n === 0, '물 → 다음 단계(' + s1.id + ') · 꽃 원래 색(바랜 꽃 ' + F1.n + ')'); await shot('16b_wet');
      const ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(/고개를 들었어요/.test(ban), '배너 「' + ban + '」'); await p.keyboard.press('Digit1'); }
    await W8(4000); await shut();

    // ③ 프롤로그 끝 말 + 걸어 나감(뿅 X)
    console.log('③ 프롤로그 끝 — 새 친구 말 · 떠나기');
    await ev(() => SM_TOWN.storyAt('p0', 3)); for (let n = 0; n < 40 && !(await ev(() => !!document.querySelector('.twn-p [data-card]'))); n++) await W8(300);
    await ev(() => { const L9 = [...document.querySelectorAll('.twn-p [data-card]')], b9 = L9.find(q => q.textContent.includes('마트')) || L9[0]; b9.click(); }); await W8(300); await ev(() => document.querySelector('.twn-p [data-card]').click()); await W8(2000); console.log('    단계 ' + (await S()).id);
    { const T = await ev(() => SM_TOWN.storyTarget()); if (T) { await tp(T.x + 3, T.z + 3, T.x, T.z); await W8(300); }
      const fr = []; let said = '', pop = 0, prev = null; for (let i = 0; i < 90; i++) { const f = await ev(() => SM_TOWN.friendSt()); fr.push(f); if (f.say) said += '|' + f.say; if (prev && prev.vis && prev.off === false && !f.vis && !f.lv) pop++; prev = f; if (i === 20) await shot('03a_p0end'); if (i > 30 && !f.on) break; await W8(200); }
      ok(/여기 좋다/.test(said), '프롤로그 끝 말이 보임 「' + said.slice(0, 80) + '」'); { const pn = await ev(() => SM_TOWN.friendSt().popN); ok(pn === 0, '화면 안에서 숨긴 수(게임 셈) ' + pn + ' · 0.2초 표본 눈대중 ' + pop); } ok(fr.some(f => f.lv && f.lv.w <= 0), '말이 끝난 뒤 걸어 나감(떠나는 프레임 ' + fr.filter(f => f.lv && f.lv.w <= 0).length + ')'); }

    // ③④ 1-1 보물 상자 → 창 → 새 친구 말 → 112
    console.log('③④ 1-1 보물 상자 → 112');
    await setT(9 * 60); await W8(9000); await shut();
    let s = await S(); if (s.cur !== 'a1_1') { await ev(() => SM_TOWN.storyAt('a1_1', 0)); await W8(1500); } await closeDlg(); await W8(1000); s = await S(); if (s.id !== 'tmap') { await ev(() => SM_TOWN.storyAt('a1_1', 1)); await W8(1500); }
    await shut(); const c = await ev(() => SM_TOWN.treasure().info().cur); ok(!!(c && c.st), '이야기 조각 ' + (c && c.id));
    if (c) { await tp(c.x + 1.2, c.z + 1.2, c.x, c.z); await W8(1500); await p.keyboard.press('Digit2'); await W8(500); await ev(([x, z]) => { SD2.map.player.lookAt([x, z]); SM_TOWN.tools.aim(x, z); }, [c.x, c.z]); await W8(200); await p.keyboard.press('KeyF'); await W8(300); await ev(() => SM_TOWN.tools.aim(null));
      const t0 = Date.now(); let rwAt = -1; const L = [];
      for (let i = 0; i < 25; i++) { const r = await ev(() => ({ pan: /보물 상자를 찾았어요/.test((document.querySelector('.twn-p') || {}).innerText || ''), chest: SM_TOWN.treasure().info().chest, id: SM_TOWN.story().step && SM_TOWN.story().step.id, em: !!SM_TOWN.emerg().info().ev, lv: !!document.querySelector('.twn-lvup') })); L.push(r); if (i === 2) await shot('03b_chest_rise'); if (r.pan) { rwAt = (Date.now() - t0) / 1000; break; } await W8(200); }
      ok(rwAt >= 0 && rwAt < 3, '판 자리 보상 창 ' + rwAt.toFixed(1) + '초 · 그동안 112 X ' + !L.some(q => q.em) + ' · 레벨 카드 X ' + !L.some(q => q.lv)); await shot('03c_reward');
      ok((await S()).id === 'tmap', '창 열린 동안 단계 그대로'); await W8(2500); ok(await ev(() => SM_TOWN.treasure().info().chest), '창 열린 동안 상자가 남아 있음');
      await p.keyboard.press('Escape'); await W8(200);
      const F = []; let said = '', emAt = -1, sayEnd = -1, pop = 0, prev = null; const t1 = Date.now();
      for (let i = 0; i < 160; i++) { const f = await ev(() => ({ ...SM_TOWN.friendSt(), em: !!SM_TOWN.emerg().info().ev, id: SM_TOWN.story().step && SM_TOWN.story().step.id, ban: (document.getElementById('hudBan') || {}).style ? (document.getElementById('hudBan').style.display !== 'none' ? document.getElementById('hudBan').textContent : '') : '', lv: !!document.querySelector('.twn-lvup') })); f.t = (Date.now() - t1) / 1000; F.push(f);
        if (f.say && !said.includes(f.say)) said += '|' + f.say; if (said && !f.say && f.q === 0 && f.st <= 0 && sayEnd < 0) sayEnd = f.t; if (f.em && emAt < 0) emAt = f.t; if (prev && prev.vis && prev.off === false && !f.vis && !f.pin && !f.pinQ) pop++; prev = f;
        if (i === 18) await shot('03d_lvcard'); if (f.say && i > 18 && i < 60 && !F.some(q => q.shotS)) { f.shotS = 1; await shot('03e_friend_say'); } if (f.lv === null && 0) break; if (emAt >= 0 && f.t > emAt + 4) { await shot('03f_112'); break; } await W8(200); }
      { const li = F.map(q => !!q.say).lastIndexOf(true), fe = emAt >= 0 ? F.findIndex(q => q.em) : -1; sayEnd = li >= 0 && (fe < 0 || li < fe) ? F[li].t : F.slice(0, fe).map(q => !!q.say).lastIndexOf(true) >= 0 ? F[F.slice(0, fe).map(q => !!q.say).lastIndexOf(true)].t : -1; }
      console.log('    새 친구 말: ' + said); console.log('    말 끝 ' + sayEnd.toFixed(1) + '초 · 112 ' + emAt.toFixed(1) + '초 · 112 뒤 말 ' + F.filter(q => q.em && q.say).map(q => q.say).filter((v, i, a) => a.indexOf(v) === i).join('|'));
      ok(/작은 종/.test(said) && /집에 갈게/.test(said), '상자 반응 + 떠나는 말이 보임'); ok(emAt > 0 && sayEnd > 0 && emAt >= sayEnd && emAt - sayEnd < 7, '112 띠 = 친구 말이 끝난 뒤 ' + (emAt - sayEnd).toFixed(1) + '초'); { const pn = await ev(() => SM_TOWN.friendSt().popN); ok(pn === 0, '화면 안에서 숨기거나 옮긴 수(게임 셈) ' + pn + ' · 0.2초 표본 눈대중 ' + pop); }
      const lvF = F.filter(q => q.lv), banL = [...new Set(F.map(q => q.ban).filter(Boolean))]; console.log('    배너들: ' + banL.join(' / ').slice(0, 300)); ok(!F.some(q => q.lv && q.em), '레벨 카드와 112가 같은 프레임 X(레벨 카드 ' + lvF.length + '프레임)');
      const pin = await ev(() => SM_TOWN.friendSt()); const E = await ev(() => SM_TOWN.emerg().info().ev); console.log('    친구 상태 ' + JSON.stringify(pin));
      { const PO = await ev(() => { const P9 = SM_TOWN.find('우체국'); return P9 ? P9.door : null; }); if (PO) { console.log('    우체국 곁 이름 없는 집: ' + JSON.stringify(await ev(PO9 => [20, 30, 45, 60, 90].map(r => [r, SM_TOWN.friendHouse(PO9[0], PO9[1], r)]), PO))); console.log('    우체국 곁 건물: ' + JSON.stringify(await ev(PO9 => SM_TOWN.bldNear(PO9[0], PO9[1], 80), PO))); } }
      ok(!!(pin.pin && E && Math.hypot(pin.pin[0] - E.x, pin.pin[1] - E.z) < 0.5), '새 친구 몸 = 경찰관 곁 사건 자리(' + JSON.stringify(pin.pin) + ' · 사건 ' + (E && [E.x, E.z]) + ')');
      if (E) { const ed = E.optXZ ? E.optXZ.map(o => o[3] + ':' + D8[dir8(o[1] - E.x, o[2] - E.z)]) : []; console.log('    보기: ' + ed.join(' · ')); const ks = E.optXZ ? E.optXZ.map(o => dir8(o[1] - E.x, o[2] - E.z)) : []; ok(new Set(ks).size === ks.length && ks.length === 3, '세 보기의 방위가 서로 다름'); ok(!E.styDoor || (E.optXZ && E.optXZ.some(o => o[0] === 'home' && /우체국 옆/.test(o[3]))), E.styDoor ? '집 칸 이름 = 「우체국 옆」' : '이 마을은 우체국 30m 안 이름 없는 집 X = 예전처럼 우체국 칸');
        await tp(E.x + 5, E.z + 5, E.x, E.z); await W8(2600); await shot('04a_scene'); const hot = async re => { for (let i = 0; i < 20; i++) { const h = await ev(r9 => { const H = SD2.map.interact.list().find(q => new RegExp(r9).test(q.label || '')); return H ? [H.x, H.z] : null; }, re); if (h) return h; await W8(300); } return null; };
        const say0 = await ev(() => SM_TOWN.friendSt().say); console.log('    도착 말: ' + say0);
        const hc = await hot('경찰관과 이야기하기'); if (hc) { await tp(hc[0] + 0.6, hc[1] + 0.6, hc[0], hc[1]); await W8(300); await p.keyboard.press('KeyE'); await W8(900); await closeDlg(); }
        const hk = await hot('새 친구에게 물어보기'); if (hk) { await tp(hk[0] + 0.6, hk[1] + 0.6, hk[0], hk[1]); await W8(300); await p.keyboard.press('KeyE'); await W8(900); }
        for (const q of ['near', 'dir']) { await ev(q9 => { const b9 = document.querySelector('.twn-p [data-q="' + q9 + '"]'); if (b9) b9.click(); }, q); await W8(350); }
        const PX = await ev(() => ({ t: (document.querySelector('.twn-p') || {}).innerText || '', ch: [...document.querySelectorAll('.twn-p [data-o]')].map(b9 => b9.textContent), h: (document.querySelector('.twn-p .bx') || document.querySelector('.twn-p')).getBoundingClientRect().bottom }));
        ok(/쪽으로 가면 우리 집이랬어/.test(PX.t) && PX.ch.length === 3, '방위 단서 + 지도 고르기(' + PX.ch.join(' / ') + ')'); ok(PX.h <= 768, '묻기 창 아래 끝 ' + Math.round(PX.h) + 'px ≤ 768'); await shot('17a_ask');
        const O = E.opts, right = O.indexOf('home'); await ev(i9 => document.querySelector('.twn-p [data-o="' + i9 + '"]').click(), right); await W8(1500);
        const f2 = await ev(() => SM_TOWN.friendSt()); ok(!f2.pin && f2.on, '고른 뒤 새 친구가 경찰관 곁을 떠나 같이 감');
        const H = E.par || (await ev(() => SM_TOWN.emerg().info().ev.par)); await W8(800);
        if (H) { // 집 쪽으로 걸어 가기(친구가 따라옴) — 마지막 25m는 걸음
          const Wk = walker(p, {}); const r9 = await Wk.walk(H.x, H.z, { r: 9, lim: 240, until: q => q.cur !== 'a1_1' || q.sid !== 'lost' }); console.log('    걸어서 집 곁 ' + (r9 ? r9.d.toFixed(1) : '?') + 'm');
          const G = []; let pop2 = 0, prev2 = null, wave = false; for (let i = 0; i < 160; i++) { const f = await ev(() => ({ ...SM_TOWN.friendSt(), done: Object.keys(SM_TOWN.story().S.done || {}) })); G.push(f); if (f.lv && !f.lv.door && f.lv.w <= 0 && f.lv.t === 0 && !wave && !E.styDoor) { wave = true; await shot('04b_wave'); } if (f.lv && f.lv.door && !wave && f.lv.w <= 0) { const dD = Math.hypot(f.x - H.x, f.z - H.z); if (dD < 1.2) { wave = true; await shot('04b_wave'); } } if (prev2 && prev2.vis && prev2.off === false && !f.vis && !(prev2.lv && prev2.lv.door)) pop2++; prev2 = f; if (i > 10 && !f.on) break; await W8(200); }
          const said2 = [...new Set(G.map(q => q.say).filter(Boolean))].join('|'); console.log('    끝 말: ' + said2);
          ok(G.some(q => q.done.includes('a1_1')), '1-1 끝'); ok(wave, E.styDoor ? '새 친구가 집 문 앞에서 손 흔들고 들어감' : '문 없는 집 = 그 자리에서 손 흔들고 걸어서 떠남'); { const pn = await ev(() => SM_TOWN.friendSt().popN); ok(pn === 0, '끝까지 화면 안에서 숨긴 수(게임 셈) ' + pn + ' · 표본 ' + pop2); }
          const M = await ev(() => ({ bag: SM_TOWN.game().S.bag['🥤'] || 0 })); ok(M.bag >= 1, '1-1 보상 = 🥤 음료(' + M.bag + ')'); } } }

    // ⑥ 해 진 뒤 낮 일 장
    console.log('⑥ 해 진 뒤 목장의 아침');
    await setT(18 * 60 + 20); for (let i = 0; i < 20 && (await S()).cur !== 'a1_3'; i++) { await shut(); await W8(1500); } s = await S(); if (s.cur !== 'a1_3') { await ev(() => SM_TOWN.storyStart('a1_3')); await W8(1500); }
    await dlgWait(9000); await W8(600); await closeDlg(); await W8(2500); s = await S(); const td = await ev(() => ({ task: (document.querySelector('.twn-task') || {}).innerText || '', wait: (document.querySelector('.twn-waitb') || {}).textContent || '', min: SM_TOWN.game().S.min }));
    ok(s.v && s.v.amW === 1 && /자고 아침에 목장으로/.test(td.task) && /자고 내일 아침에 하기/.test(td.wait) /* PATH-1A2 G14: 단추 = 하는 일(할 일 줄과 같은 글 X) */, '18시 넘어 열림 = 할 일 「' + td.task.replace(/\s+/g, ' ').slice(0, 40) + '」 · 단추 「' + td.wait + '」'); await shot('06a_night');
    await W8(3000); await shot('06b_night_friend');
    await ev(() => { const b9 = document.querySelector('.twn-waitb'); if (b9) b9.click(); }); for (let i = 0; i < 60; i++) { await W8(1000); const r = await ev(() => ({ m: SM_TOWN.game().S.min, sl: !!document.querySelector('.twn-sleep,.twn-p') })); if (r.m < 12 * 60 && r.m > 5 * 60) break; }
    for (let i = 0; i < 12; i++) { await shut(); await W8(1500); s = await S(); if (!(s.v && s.v.amW)) break; } console.log('    깬 뒤 창 ' + (await ev(() => [...document.querySelectorAll('.twn-p,.twn-dlg')].map(e => (e.dataset.k || e.className) + ':' + e.innerText.slice(0, 30)).join(' | '))));
    s = await S(); ok(s.cur === 'a1_3' && !(s.v && s.v.amW) && s.id === 'bike', '자고 일어나면 그 단계부터(' + s.id + ' · ' + (await ev(() => SM_TOWN.game().S.min)) + '분)'); await shot('06c_morning');

    // ⑰ 장면 여러 번 = 보기 방위
    console.log('⑰ 112 보기 방위(장면 다섯)');
    for (let k = 0; k < 5; k++) { await ev(() => SM_TOWN.storyAt('a1_1', 2)); let E = null; for (let i = 0; i < 30 && !(E && E.optXZ); i++) { await W8(500); E = await ev(() => SM_TOWN.emerg().info().ev); } if (!E || !E.optXZ) { console.log('    장면 없음'); continue; } const ks = E.optXZ.map(o => dir8(o[1] - E.x, o[2] - E.z)); console.log('    ' + E.optXZ.map((o, i) => o[3] + ':' + D8[ks[i]]).join(' · ')); ok(new Set(ks).size === 3, '장면 ' + (k + 1) + ' 세 방위 다름'); await ev(() => SM_TOWN.game().S.day++); }
  } catch (e) { console.error(e); fails++; }
  console.log('페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
