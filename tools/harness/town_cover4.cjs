// 🧩 메인 퀘스트 빈 기능 넷(COVER-4 · 11-07 · 설계 docs/systems/town_coverage_1031.md 10절): node tools/harness/town_cover4.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ⓪ 자료(노드): 1-4 = 돋보기 → 도감 귀띔 → 짐작 · 2-4 = 과일 → 길 묻기 → 팔기 · 3-2 = 밀물 알리기 → 낚시 → 배 → 염전 → 널기(방문만 go 합침) · 새 단계마다 힌트 셋·할 일 줄(한·영) · 옛 저장 go → watch
//   ① 1-4 도감: 도감을 열기 전 ❗·빨간 선 X → 도감 창 💡 = '생태 하천 갈대 옆 물가' → ❗ = 🔬 자리 → 걸어가 E → 물 맑기 놀이를 실제로(돋보기로 생물 넷 · 맑은 물 고르기) → 🔬 도장 · 다음 = 짐작 고르기 · 도장이 이미 있으면 알아보고 넘어감
//   ② 2-4 길 묻기: ❗ = 물을 이웃(빨간 선 X) → 걸어가 곁에 서면 이웃이 먼저 말함(말풍선 · 메모 줄 '들은 길') → 그 뒤 ❗·선 X · 첫 힌트 = 들은 말 → 걸어서 장터 12m 안 → 팔기 · 장터 곁에서 시작하면 한 줄로 넘어감
//   ③ 3-2 낚시: 밀물 알리기 끝 글 = 낚시 까닭 → ❗ = 선착장 어부 → 걸어가면 낚싯대를 빌려줌 → 밀물 바다에 던져 찌 → 줄다리기(봇) → 다음 = 배(끝 글 = 물때 + 배 까닭) · 줄 낚시 못 낚음(ok 0) = 그대로
//   ④ 3-2 배: ❗ = 선착장 끝 → E 배 타기 → 할 일 줄·❗ = 바깥 김 줄(배 띄우는 자리에서 60~120m · 다른 가장자리 E = 한 줄) · 양식장을 돌아 60m 넘게 · 60초 안 · 물때 줄 → 노 젓기 봇(W·A·D) → 배 위 E = 김 펴서 말리기 → 다음 = 염전(끝 글 = 말리기 + 염전 까닭) ⑤ 옛 저장 go → watch ⑥ 페이지 오류 0
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null;
const path = require('path'), { chromium } = require('./pw.cjs'), { walker } = require('./lib_walk.cjs');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
(async () => {
  const M = await import(path.resolve(__dirname, '../../v2/games/town_story.js')), C = id => M.CHAPTERS.find(q => q.id === id), ix = (c, id) => C(c).steps.findIndex(q => q.id === id), ord = id => C(id).steps.map(q => q.id + ':' + q.do.type).join(' ');
  console.log('⓪ 자료 — 장 차례 · 새 단계 꼴');
  ok(/lens:tool dex:rec clean:choose sea:season ff:ff/.test(ord('a1_6')), '1-4 = 돋보기 → 도감 귀띔 → 짐작 → 여름 → 밤 ' + ord('a1_6'));
  ok(/get:have way:way sell:sell line:line$/.test(ord('a2_1')), '2-4 = 과일 → 길 묻기 → 팔기·바꾸기 ' + ord('a2_1'));
  ok(/watch:watch why:choose alert:tidal fish:fish boat:boat salt:work dry:law line:line$/.test(ord('a1_5')) && ix('a1_5', 'go') < 0, '3-2 = 지켜보기(go 합침) → 밀물 알리기 → 낚시 → 배 → 염전 → 널기 ' + ord('a1_5'));
  for (const [c, id] of [['a1_6', 'dex'], ['a2_1', 'way'], ['a1_5', 'fish'], ['a1_5', 'boat']]) { const st = C(c).steps.find(q => q.id === id); ok(st.hint && st.hint.length === 3 && st.todo && st.todo[0] && st.todo[1] && !st.hint.includes('show:ans'), c + '.' + id + ' 힌트 셋 · 할 일 줄(한·영)'); }
  { const d = C('a1_5').steps.find(q => q.id === 'alert').do; ok([d.done, d.skipT, d.failT].every(t => /\{nx\}/.test(t[0])), '3-2 밀물 알리기 끝 글 셋 = {nx}(다음 단계 까닭)'); ok(['fish', 'boat', 'salt'].every(k => C('a1_5').steps.find(q => q.id === k).nx), '낚시·배·염전 = 까닭 한 줄(nx)'); }
  { let fan = 0; for (const c of M.CHAPTERS) for (const st of c.steps) if (/요정|마법|몬스터/.test(JSON.stringify(st))) fan++; ok(!fan, '판타지 낱말 0'); }
  const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  try {
    const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
    const boot = async () => { await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.tools, null, { timeout: 240000 }); await p.waitForTimeout(1500); await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } }); await p.waitForTimeout(800); };
    await boot();
    const Wk = walker(p, {}), { ev, W8, shut, walk, waitStep, S } = Wk;
    const shot = async n => { if (!SHOTS) return; await W8(300); await p.screenshot({ path: SHOTS + '/cover4_' + n + '.png' }); console.log('    📷 ' + SHOTS + '/cover4_' + n + '.png'); };
    const ban = () => ev(() => { const e = document.getElementById('hudBan'); return e && e.style.display !== 'none' ? e.textContent : ''; });
    const banWait = async (re, ms = 12000) => { let t = ''; for (let i = 0; i < ms / 250; i++) { t = await ban(); if (re.test(t)) return t; await W8(250); } return t; };
    const tp = (x, z) => ev(([x, z]) => { SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, [x, z]);
    const goal = () => ev(() => SM_TOWN.goalSp());
    // 곧장 걷기(가까운 곳 · 길 그래프가 먼 길머리로 돌아가지 않게) — 사람 입력처럼 steer · 막히면 옆으로 반 걸음 · 순간이동 X
    const stride = async (tx, tz, r = 1.5, lim = 40) => { const t0 = Date.now(); let last = null, stuck = 0, side = 0, q = null; while (Date.now() - t0 < lim * 1000) { q = await ev(([tx, tz, sd]) => { const M = SD2.map, P = M.player.get(), dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz) || 1; if (sd) M.player.steer(-dz / d * sd + dx / d * 0.3, dx / d * sd + dz / d * 0.3, 4.2, true); else M.player.steer(dx, dz, 4.2, true); return { x: P.x, z: P.z, d, pan: !!document.querySelector('.twn-p'), sid: (SM_TOWN.story().step || {}).id }; }, [tx, tz, side > 0 ? (stuck % 2 ? 1 : -1) : 0]); side--; if (q.d < r) break; if (q.pan) { await ev(() => SD2.map.player.steer(null)); await shut(); }
        if (last && Math.hypot(q.x - last.x, q.z - last.z) < 0.15) { if (++stuck % 6 === 0) side = 5; } last = q; await W8(120); } await ev(() => SD2.map.player.steer(null)); await W8(200); return q; };
    const land = (x, z, r0, r1, fx, fz) => ev(([x, z, r0, r1, fx, fz]) => { const a0 = fx != null ? Math.atan2(fz - z, fx - x) : 0; for (let r = r0; r <= r1; r += 2) for (let k = 0; k < 24; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.26, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (SM_TOWN.sd(px, pz) > 2 && (!SM_TOWN.seaSd || SM_TOWN.seaSd(px, pz) > 2) && !SM_TOWN.inSchool(px, pz)) { const R = SM_TOWN.routeXY([px, pz], [x, z]); if (R && R.ok) return [px, pz]; } } return null; }, [x, z, r0, r1, fx, fz]);   /* 걸어서 닿는 땅 위 자리(물속에 내려놓지 않게) */
    const reset = () => ev(() => { SM_TOWN.storyOff(); const G = SM_TOWN.game(), s = G.S.story; s.autoNext = null; if (G.setClock) G.setClock(false); G.S.min = 12 * 60; SM_TOWN.rules.wx('clear'); });
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: { d: 1 }, a1_1: { d: 1 } }); G.story.autoNext = null; });

    console.log('① 1-4 도감 — 귀띔을 읽어야 자리가 보임 → 물 맑기 놀이 → 🔬');
    await reset(); await ev(() => { delete SM_TOWN.game().S.bag['🔬']; });
    await ev(i9 => SM_TOWN.storyAt('a1_6', i9), ix('a1_6', 'dex')); await W8(1500); await shut();
    let st = await ev(() => SM_TOWN.story().step), at = st && st.v.at;
    ok(st && st.id === 'dex' && at && at.icon === '🔬', '도감 단계 · 귀띔 자리 = 🔬 물 맑기 E 곁(' + (at && [Math.round(at.x), Math.round(at.z)]) + ')');
    if (at) {
      await tp(at.x + 14, at.z + 6); await W8(1600); await shut();
      { const g0 = await goal(), s0 = await S(), td = await ev(() => SM_TOWN.storyTodo()); ok(!g0 && !s0.route, '도감을 열기 전 = ❗·빨간 선 없음'); ok(/도감을 열어/.test(td), '할 일 줄 = ' + td); }
      await ev(() => SM_TOWN.dexOpen()); await W8(700);
      { const tx = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); ok(/💡 생태 하천 갈대 옆 물가/.test(tx), '도감 창 💡 = 이 단계 귀띔(' + ((tx.match(/💡 생태[^\n]*/) || [''])[0]).slice(0, 50) + ')'); await shot('dex_clue'); }
      await shut(); await W8(1500);
      { const g1 = await goal(), td = await ev(() => SM_TOWN.storyTodo()), s1 = await S(); ok(g1 && Math.hypot(g1.x - at.x, g1.z - at.z) < 3, '도감을 읽은 뒤 ❗ = 귀띔 자리'); ok(/갈대 옆 물가/.test(td) && !s1.route, '할 일 줄 = ' + td + ' · 빨간 선 X'); }
      { const q9 = await stride(at.x, at.z, 1.4, 40); console.log('    귀띔 자리까지 ' + q9.d.toFixed(1) + 'm'); }
      { const nr = await ev(() => SD2.near && SD2.near()); ok(/물 맑기/.test(String(nr || '')), 'E 자리 = ' + nr); }
      await p.keyboard.press('KeyE'); await W8(900);
      const on = await ev(() => !!document.querySelector('.twn-play .tray')); ok(on, '🔬 물 맑기 놀이 창(돋보기 쟁반)'); await shot('dex_play');
      if (on) { for (let k = 0; k < 4; k++) { await ev(() => { const it = [...document.querySelectorAll('.twn-play .tray .ti:not(.dc):not(.f)')][0]; if (!it) return; const r = it.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; for (const t of ['pointermove', 'pointerdown']) it.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerId: 1 })); }); await W8(250); }
        await W8(300); await ev(() => { const b9 = document.querySelector('.twn-play [data-w="0"]'); if (b9) b9.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })); }); }
      st = await waitStep(q => q.id !== 'dex', 15000); ok(st.id === 'clean', '물 맑기를 해내면 → 짐작 고르기(' + st.id + ')');
      ok(await ev(() => (SM_TOWN.game().S.bag['🔬'] || 0) > 0), '도감에 🔬 도장'); { const lg = (await ev(() => ((SM_TOWN.story().step || {}).v || {}).log || [])).join(' '); ok(/강도래 애벌레와 버들치/.test(lg), '끝 글 = 맑은 물 생물(짐작의 근거)'); }
      await shut(); await reset(); await ev(i9 => SM_TOWN.storyAt('a1_6', i9), ix('a1_6', 'dex')); st = await waitStep(q => q.id !== 'dex', 6000); ok(st.id === 'clean', '도장이 이미 있으면 알아보고 넘어감(' + st.id + ')');
    }
    await shut(); await reset();

    console.log('② 2-4 길 묻기 — 물을 이웃(❗) → 들은 길 → 선 없이 장터');
    await ev(() => { SM_TOWN.game().S.bag['🍓'] = 1; }); await ev(i9 => SM_TOWN.storyAt('a2_1', i9), ix('a2_1', 'way')); await W8(1200); await shut();
    st = await ev(() => SM_TOWN.story().step); const to = st && st.v.to; ok(st && st.id === 'way' && to, '길 묻기 단계 · 목적지 = 바다 장터(' + (to && [Math.round(to.x), Math.round(to.z)]) + ')');
    if (to) {
      const W = await ev(() => { const L = SM_TOWN.workers().map(a => ({ k: a[4], x: a[1], z: a[2] })).filter(w => w.k === 'strawberry' || w.k === 'pear'); return L[0] || null; }); ok(!!W, '들 일꾼(' + (W && W.k) + ')');
      if (W) { await tp(W.x + 16, W.z + 10); await W8(1800); await shut();
        const g0 = await goal(), s0 = await S(); ok(g0 && !s0.route, '❗ = 물을 이웃 · 빨간 선 X(' + (g0 && [Math.round(g0.x), Math.round(g0.z)]) + ')');
        const T0 = await ev(() => SM_TOWN.storyTarget()); await stride(T0.x, T0.z, 2.6, 40);
        let told = null; for (let i = 0; i < 16 && !told; i++) { await W8(400); told = await ev(() => (SM_TOWN.story().step || { v: {} }).v.told || null); }
        ok(!!told, '곁에 서자 이웃이 먼저 길을 말함(' + (told && told.t) + ')');
        { const bub = await ev(() => { const B = SM_TOWN.ask && SM_TOWN.ask.bub ? SM_TOWN.ask.bub() : null; return B ? JSON.stringify(B).slice(0, 100) : ''; }), I = await ev(() => SM_TOWN.ask.info()); ok(I.dbg.told >= 1 && I.way && I.way.ask && I.way.ask.k === '📖', '길 묻기 엔진이 말함(말풍선 · 들은 길 기록) ' + bub); }
        await shot('way_told');
        { const m = await ev(() => SM_TOWN.read.memo()), td = await ev(() => SM_TOWN.storyTodo()), g1 = await goal(), s1 = await S(); ok(/들은 길/.test(m), '메모 줄 = ' + m); ok(/들은 길로/.test(td), '할 일 줄 = ' + td); ok(!g1 && !s1.route, '들은 뒤 = ❗·빨간 선 없음(스스로)'); }
        await ev(() => { SM_TOWN.story && SM_TOWN.storyHint && SM_TOWN.storyHint(); });
        { const q0 = await ev(() => SD2.map.player.get()), s9 = await land(to.x, to.z, 60, 110, q0.x, q0.z); ok(!!s9, '장터 60~110m 앞 땅(' + (s9 && s9.map(Math.round)) + ') — 거기서부터 걸음'); if (s9) await tp(s9[0], s9[1]); await W8(900); await shut(); }
        { let r9 = await walk(to.x, to.z, { r: 1.5, lim: 60, self: 1, tag: 'way', until: r => r.sid !== 'way' }); if (r9 && r9.sid === 'way') r9 = await stride(to.x, to.z, 2, 40); console.log('    걸은 끝: 장터까지 ' + (r9 ? r9.d.toFixed(1) : '?') + 'm · 단계 ' + (r9 && r9.sid)); }
        st = await waitStep(q => q.id !== 'way', 8000); ok(st.id === 'sell', '걸어서 장터 12m 안 → 팔기·바꾸기(' + st.id + ')');
        { const lg = (await ev(() => ((SM_TOWN.story().step || {}).v || {}).log || [])).join(' '); ok(/들은 대로 찾아왔어요/.test(lg), '끝 글 = 눈에 띄는 곳 + 방위'); ok(Wk.st.selfBad.length === 0, '스스로 찾는 동안 빨간 선 0'); }
        await shut(); await reset(); await ev(i9 => SM_TOWN.storyAt('a2_1', i9), ix('a2_1', 'way')); st = await waitStep(q => q.id !== 'way', 6000); ok(st.id === 'sell', '장터 곁에서 시작 = 한 줄로 넘어감(' + st.id + ')'); }
    }
    await shut(); await reset();

    console.log('③ 3-2 낚시 — 밀물 알리기 끝 글 → 선착장 어부 → 낚싯대 → 낚음 → 배');
    await ev(i9 => SM_TOWN.storyAt('a1_5', i9), ix('a1_5', 'alert')); await W8(1200); await shut();
    await ev(() => { const E = SM_TOWN.emerg && SM_TOWN.emerg(); if (E && E.on) E.abort(); SM_TOWN.storyEv('rec', { rk: 'emerg', o: { k: 'tide', ev: 'done' } }); });
    { const t = await banWait(/낚싯대/); ok(/선착장 어부께 낚싯대/.test(t), '밀물 알리기 끝 글 = 낚시 까닭 「' + t.slice(0, 70) + '」'); }
    st = await waitStep(q => q.id === 'fish', 6000); ok(st.id === 'fish', '다음 = 낚시(' + st.id + ')'); await shut();
    const F = await ev(() => SM_TOWN.storyTarget()); ok(F && /어부/.test(F.name || ''), '목적지 = ' + (F && F.name));
    if (F) { await ev(() => { const T = SM_TOWN.game().S.tools; if (T && T.have) T.have.rod = 0; SM_TOWN.game().S.uses = {}; }); { const s9 = await land(F.x, F.z, 14, 40); ok(!!s9, '어부 곁 땅(' + (s9 && s9.map(Math.round)) + ')'); if (s9) await tp(s9[0], s9[1]); } await W8(1500); await shut();
      { const g = await goal(); ok(g && Math.hypot(g.x - F.x, g.z - F.z) < 3, '❗ = 선착장 어부'); }
      { const r9 = await stride(F.x, F.z, 2.5, 40); console.log('    어부까지 ' + (r9 ? r9.d.toFixed(1) : '?') + 'm'); } await W8(1500);
      { const hv = await ev(() => SM_TOWN.tools.info().have); ok(hv.includes('rod'), '어부 곁 = 낚싯대 빌려줌(' + hv.join(',') + ')'); }
      for (let i = 0; i < 16; i++) { const q = await ev(() => SM_TOWN.tools.info()); if (!q.ovl && !(q.pend || []).length) break; await W8(500); } await shut();
      await ev(() => { const G = SM_TOWN.game().S, d = G.day, lowAt = 300 + ((d * 50 + 250) % 745); G.min = lowAt + 372 <= 1380 ? lowAt + 372 : lowAt - 372; SM_TOWN.rules.season('summer'); });   /* 밀물(한가운데) */
      await W8(3000);
      const Wt = await ev(h => { for (let r9 = 2; r9 < 40; r9 += 1) for (let a = 0; a < 32; a++) { const x = h.x + Math.cos(a / 32 * 6.2832) * r9, z = h.z + Math.sin(a / 32 * 6.2832) * r9; if (SM_TOWN.sd(x, z) > 0.8 && SM_TOWN.seaSd && SM_TOWN.seaSd(x, z) > 0.5) { for (let b9 = 0; b9 < 16; b9++) { const u = Math.cos(b9 / 16 * 6.2832), v = Math.sin(b9 / 16 * 6.2832), wx = x + u * 5, wz = z + v * 5; if (SM_TOWN.seaSd(wx, wz) < -1) return { x, z, wx, wz }; } } } return null; }, F);
      ok(!!Wt, '어부 곁 바닷가 자리'); let caught = false;
      if (Wt) { await stride(Wt.x, Wt.z, 1.2, 30); await ev(w => { SD2.map.player.lookAt([w.wx, w.wz]); }, Wt); await W8(300);
        let I = await ev(() => SM_TOWN.tools.info()); if (I.shown !== 'rod') { await p.keyboard.press('Digit3'); await W8(450); } await ev(w => SM_TOWN.tools.aim(w.wx, w.wz), Wt);
        await p.keyboard.down('KeyF'); await W8(120); await p.keyboard.up('KeyF'); await W8(300);
        for (let i = 0; i < 20; i++) { I = await ev(() => SM_TOWN.tools.info()); if (!I.fish || I.fish.ph !== 'fly') break; await W8(200); }
        ok(!!I.fish, '바다에 낚싯대 던짐(' + (I.fish && I.fish.ph) + ')'); await ev(() => SM_TOWN.tools.bite()); await W8(400); I = await ev(() => SM_TOWN.tools.info());
        if (I.fish && I.fish.ph === 'bite') { await p.keyboard.down('KeyF'); await W8(120); await p.keyboard.up('KeyF'); await W8(1200);
          let held = null; const press = async k => { if (held === k) return; if (held) await p.keyboard.up(held); held = k; if (k) await p.keyboard.down(k); };
          for (let i = 0; i < 500; i++) { const q = await ev(() => { const el = document.querySelector('.twn-play'); if (!el) return null; const tg = el.querySelector('.tug'); return { ph: tg ? tg.dataset.ph : null, s: tg ? +tg.dataset.s || 0 : 0, t: tg ? +tg.dataset.t || 0 : 0, end: !!el.querySelector('.pb.mg-end') }; }); if (!q) break; if (q.end) { await press(null); await W8(200); continue; } if (q.ph === 'tug') await press(q.t >= 0.8 || !q.s ? null : q.s < 0 ? 'ArrowRight' : 'ArrowLeft'); else await press(null); await W8(60); }
          await press(null); await W8(900); const pn = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); caught = /낚았/.test(pn); ok(caught, '줄다리기로 낚음 — ' + pn.slice(0, 30)); await shot('fish_catch');
          await ev(() => { const b9 = document.querySelector('.twn-p [data-a="bag"]'); if (b9 && !b9.disabled) b9.click(); else { const r9 = document.querySelector('.twn-p [data-a="rel"]'); if (r9) r9.click(); } }); await W8(600); }
        else ok(false, '입질 안 옴 — ' + JSON.stringify(I.fish)); await ev(() => SM_TOWN.tools.aim(null)); }
      st = await waitStep(q => q.id !== 'fish', 12000); ok(st.id === 'boat', '낚으면 → 배(' + st.id + ')');
      { const lg = (await ev(() => ((SM_TOWN.story().step || {}).v || {}).log || [])).join(' '); ok(/물때를 따라 움직여요/.test(lg) && /김 양식장/.test(lg), '끝 글 = 물때 + 배 까닭'); }
      await shut(); await ev(i9 => SM_TOWN.storyAt('a1_5', i9), ix('a1_5', 'fish')); await W8(900); await shut();
      await ev(() => SM_TOWN.storyEv('work', { k: 'fisher', x: 0, z: 0, ok: 0 })); await W8(600); st = await S(); ok(st.id === 'fish', '줄 낚시 못 낚음(ok 0) = 그대로(' + st.id + ')');
      await ev(() => SM_TOWN.storyEv('tool', { k: 'catch-fresh' })); await W8(400); st = await S(); ok(st.id === 'fish', '민물고기 = 그대로(바다에서)');
      await ev(() => SM_TOWN.storyEv('work', { k: 'fisher', x: 0, z: 0, ok: 2 })); st = await waitStep(q => q.id !== 'fish', 6000); ok(st.id === 'boat', '어부 곁 줄 낚시로 낚아도 → 배(' + st.id + ')');
    }
    await shut();

    console.log('④ 3-2 배 — 선착장 끝 E → 노 젓기 → 김 양식장 → 염전');
    await ev(i9 => SM_TOWN.storyAt('a1_5', i9), ix('a1_5', 'boat')); await W8(1200); await shut();
    const D = await ev(() => SM_TOWN.storyTarget()); ok(D && /선착장 끝/.test(D.name || ''), '목적지 = ' + (D && D.name));
    if (D) { { const g = await goal(); ok(g && Math.hypot(g.x - D.x, g.z - D.z) < 3, '❗ = 선착장 끝'); }
      { const s9 = await land(D.x, D.z, 10, 40); if (s9) await tp(s9[0], s9[1]); await W8(900); await shut(); const B0 = await ev(() => SM_TOWN.boat()), ux = D.x - B0.x, uz = D.z - B0.z, ul = Math.hypot(ux, uz) || 1; await stride(D.x + ux / ul * 10, D.z + uz / ul * 10, 1.0, 30);   /* 데크 뿌리 쪽부터 데크를 따라(옆으로 비스듬히 가다 물에 빠지지 않게) */ const r9 = await stride(D.x + ux / ul * 0.6, D.z + uz / ul * 0.6, 0.6, 30); console.log('    선착장 끝까지 ' + (r9 ? r9.d.toFixed(1) : '?') + 'm'); } await W8(400);
      { const I9 = await ev(() => SM_TOWN.tools.info()); if (I9.shown) { await p.keyboard.press('Digit' + (['can', 'shovel', 'rod', 'lens', 'broom', 'scope'].indexOf(I9.shown) + 1)); await W8(400); } }   /* 든 도구 내려놓기 */
      { const dbg = await ev(() => { const P = SD2.map.player.get(); return { near: SD2.near && SD2.near(), me: [+P.x.toFixed(1), +P.y.toFixed(2), +P.z.toFixed(1)], hots: SD2.map.interact.list().filter(h => Math.hypot(h.x - P.x, h.z - P.z) < 8).map(h => [h.label.slice(0, 10), +h.x.toFixed(1), +h.z.toFixed(1), h.r, !!h.off, h.y != null ? +h.y.toFixed(2) : null]), boat: SM_TOWN.boat().on, play: SM_TOWN.rules.play(), pan: !!document.querySelector('.twn-p'), tool: SM_TOWN.tools.info().shown }; }); console.log('    E 앞: ' + JSON.stringify(dbg)); }
      for (let i = 0; i < 4 && !(await ev(() => SM_TOWN.boat().on)); i++) { await p.keyboard.press('KeyE'); await W8(900); }
      ok(await ev(() => SM_TOWN.boat().on), '선착장 끝 E = 배 탐'); await W8(1500);
      { const td = await ev(() => SM_TOWN.storyTodo()), T = await ev(() => SM_TOWN.storyTarget()), g = await goal(), rl = await ev(() => (document.querySelector('.twn-row .rl') || {}).textContent || ''); ok(/바깥 김 줄/.test(td) && /비스듬히/.test(td), '배 위 할 일 줄 = ' + td); ok(T && /김 양식장/.test(T.name) && g && Math.hypot(g.x - T.x, g.z - T.z) < 3, '❗ = 김 양식장 가장자리'); ok(/물때/.test(rl), '물때 줄 = ' + rl); await shot('boat_row'); }
      /* POLISH-1(11-07 '노 젓기가 30m라 몇 초면 끝'): 목표 = 배 띄우는 자리에서 60~120m 바깥 김 줄 · 다른 가장자리 E = 한 줄(놀이 X) · 봇은 양식장을 돌아가는 물길(3m 칸 · 배가 다닐 수 있는 칸)을 따라 저음 · 저은 거리 60m 넘게 · 60초 안 */
      const H0 = await ev(() => { const B = SM_TOWN.boat(), T = SM_TOWN.storyTarget(); return { sx: B.home.x, sz: B.home.z, tx: T.x, tz: T.z }; }), dT = Math.hypot(H0.tx - H0.sx, H0.tz - H0.sz); ok(dT >= 60 && dT <= 120, '목표 김 줄 = 배 띄우는 자리에서 ' + dT.toFixed(0) + 'm(60~120)');
      { const g9 = await ev(([tx, tz]) => { const L = SD2.map.interact.list().filter(h => /^🌿/.test(h.label || '') && !h.off && Math.hypot(h.x - tx, h.z - tz) > 6); if (!L.length) return null; L[0].use(); const t9 = document.getElementById('toast'); return { t: t9 && t9.style.display !== 'none' ? t9.textContent : '', play: SM_TOWN.rules.play() }; }, [H0.tx, H0.tz]);
        if (g9) ok(/바깥 줄/.test(g9.t) && !g9.play, '다른 가장자리 E = 「' + g9.t.slice(0, 40) + '」 · 놀이 안 열림'); else console.log('    (다른 김 가장자리 없음)'); }
      const WP = await ev(([sx, sz, tx, tz]) => { const C = 3, x0 = Math.min(sx, tx) - 70, z0 = Math.min(sz, tz) - 70, nx = Math.ceil((Math.max(sx, tx) + 70 - x0) / C), nz = Math.ceil((Math.max(sz, tz) + 70 - z0) / C), ok9 = (x, z) => { for (const [ox, oz] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]]) { const w = SM_TOWN.boatWhy(x + ox, z + oz); if (!(w.sd < -4) || w.occ || w.swim || w.pier || w.walk === false) return false; } return true; };
        const id = (i, j) => j * nx + i, P = new Int32Array(nx * nz).fill(-2), Q = [], si = Math.round((sx - x0) / C), sj = Math.round((sz - z0) / C); P[id(si, sj)] = -1; Q.push(id(si, sj)); let best = -1, bd = 1e9;
        while (Q.length) { const c = Q.shift(), i = c % nx, j = (c / nx) | 0, x = x0 + i * C, z = z0 + j * C, d = Math.hypot(x - tx, z - tz); if (d < bd) { bd = d; best = c; } if (d < 4) break;
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue; const k = id(a, b); if (P[k] !== -2) continue; if (!ok9(x0 + a * C, z0 + b * C)) { P[k] = -3; continue; } P[k] = c; Q.push(k); } }
        const out = []; for (let c = best; c >= 0; c = P[c]) out.push([x0 + (c % nx) * C, z0 + ((c / nx) | 0) * C]); out.reverse(); const thin = out.filter((q, i) => i % 3 === 2 || i === out.length - 1); return { pts: thin, bd: +bd.toFixed(1), n: out.length }; }, [H0.sx, H0.sz, H0.tx, H0.tz]);
      console.log('    물길 ' + WP.n + '칸 · 끝이 목표에서 ' + WP.bd + 'm');
      let near9 = false; const t0 = Date.now(); let held = new Set(), wi = 0, rowed = 0, last = null; const key = async (k, on) => { if (on && !held.has(k)) { held.add(k); await p.keyboard.down(k); } else if (!on && held.has(k)) { held.delete(k); await p.keyboard.up(k); } };
      while (Date.now() - t0 < 90000) { const q = await ev(() => { const B = SM_TOWN.boat(), T = SM_TOWN.storyTarget(); return { x: B.x, z: B.z, h: B.h, on: B.on, tx: T ? T.x : 0, tz: T ? T.z : 0 }; }); if (last) rowed += Math.hypot(q.x - last.x, q.z - last.z); last = q; const d = Math.hypot(q.tx - q.x, q.tz - q.z); if (d < 6) { near9 = true; break; }
        while (wi < WP.pts.length - 1 && Math.hypot(WP.pts[wi][0] - q.x, WP.pts[wi][1] - q.z) < 6) wi++; const [gx, gz] = wi < WP.pts.length ? WP.pts[wi] : [q.tx, q.tz];
        let df = Math.atan2(gx - q.x, gz - q.z) - q.h; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI; await key('KeyA', df > 0.2); await key('KeyD', df < -0.2); await key('KeyW', Math.abs(df) < 1.2); await W8(120); }
      for (const k of [...held]) await key(k, false); const sec9 = (Date.now() - t0) / 1000; ok(near9, '노 저어 바깥 김 줄 6m 안(' + sec9.toFixed(0) + '초 · 저은 거리 ' + rowed.toFixed(0) + 'm)'); ok(rowed >= 60 && sec9 <= 60, '배를 몰아 간 길 60m 넘게 · 60초 안(' + rowed.toFixed(0) + 'm · ' + sec9.toFixed(0) + '초)'); await W8(400);
      { const nr = await ev(() => SD2.near && SD2.near()); ok(/김 펴서 말리기|굴 크기/.test(String(nr || '')), '배 위 E = ' + nr); }
      await p.keyboard.press('KeyE'); await W8(900); const pl = await ev(() => SM_TOWN.rules.play()); ok(pl && (pl.k === 'seaweed' || pl.k === 'oyster') && !pl.pr, '양식장 일 = 이야기 판(연습 판 X) ' + JSON.stringify(pl)); await shot('boat_play');
      await ev(() => SM_TOWN.rules.playEnd(3)); st = await waitStep(q => q.id !== 'boat', 8000); ok(st.id === 'salt', '양식장 일 끝 → 염전(' + st.id + ')');
      { const lg = (await ev(() => ((SM_TOWN.story().step || {}).v || {}).log || [])).join(' '); ok(/햇볕과 바람에 말려요/.test(lg) && /염전/.test(lg), '끝 글 = 말리기 + 염전 까닭'); }
      }
    await shut();

    console.log('⑤ 옛 저장 — 3-2 「갯벌 쉼터에 가 보기」(go) → 지켜보기');
    await ev(() => { const s = SM_TOWN.game().S.story; s.cur = 'a1_5'; s.i = 4; s.sid = 'go'; s.v = {}; s.paused = null; SM_TOWN.game().mark && SM_TOWN.game().mark(); return SM_TOWN.save && SM_TOWN.save().flush && SM_TOWN.save().flush(); });
    await W8(1500); await boot(); await W8(2500);
    { const r = await ev(() => { const s = SM_TOWN.game().S.story; return { cur: s.cur, sid: s.sid, i: s.i }; }); ok(r.cur === 'a1_5' && r.sid === 'watch', '옛 저장 go → watch(' + JSON.stringify(r) + ')'); }
  } catch (e) { console.error(e); fails++; }
  console.log('⑥ 페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? '✗ ' + fails + '개 실패' : '✓ 모두 통과'); process.exit(fails ? 1 : 0);
})();
