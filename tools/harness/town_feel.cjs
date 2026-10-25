// 👆 첫 30분 동작 다섯 손맛 시험(FEEL-1 · v2/games/town_feel.js): node tools/harness/town_feel.cjs [마을=ourtown] [포트=8002]
//   다섯 동작(이야기 단계 · 여권 도장 · 돈 받기 · 텃밭 심기 · 텃밭 물 주기)을 실제 길로 해 보고
//   ① 소리 = map.sfx·map.tone 부름 수(town_feel이 감싸서 셈)가 늘어남 ② 연출 = 화면 요소(할 일 줄 덮개 · 도장 · 지갑 줄)나 흙·물 조각이 생겼다가 사라짐
//   ③ 빨리 되풀이 = 소리가 작아지다 건너뜀 ④ 같은 순간 다른 소리(ding)가 나면 짤랑은 건너뜀 ⑤ 설정 '소리 끄기' = 부름 0 ⑥ 'pop'(학교 표에 없던 소리)이 이제 소리남 ⑦ 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const closeAll = async () => { for (let i = 0; i < 6; i++) { const o = await ev(() => !!document.querySelector('.twn-p') || !!document.querySelector('.twn-dlg')); if (!o) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(200); if (await ev(() => !!document.querySelector('.twn-p') || !!document.querySelector('.twn-dlg'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const F = () => ev(() => SM_TOWN.feel().info());
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [x, z]);
    const dSnd = (a, z) => (z.snd.sfx - a.snd.sfx) + (z.snd.tone - a.snd.tone);
    /* 화면 요소가 '보였다가 사라지는지': 0.05초마다 투명도를 재어 가장 큰 값과 끝 값 */
    const seen = (k, ms) => ev(([k, ms]) => new Promise(res => { let mx = 0; const t0 = performance.now(), iv = setInterval(() => { const d = SM_TOWN.feel().info().dom[k]; mx = Math.max(mx, d); if (performance.now() - t0 > ms) { clearInterval(iv); res({ max: mx, end: SM_TOWN.feel().info().dom[k] }); } }, 50); }), [k, ms]);
    const ONLYE = process.argv.includes('--e');   /* --e = 9. E 자리 전수만(되풀이 손볼 때) */
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.feel && SM_TOWN.feel(), null, { timeout: 240000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.min = 10 * 60; SM_TOWN.rules.wx('clear'); });
    const R = await ev(() => SM_TOWN.schRect()), gx = (R[0] + R[2]) / 2, gz = R[3] + 28; await tp(gx, gz); await W8(800);

    if (!ONLYE) {
    // ── 1. 📜 이야기 단계 넘어감(첫 쪽지 '알겠어요' → 다음 단계) ──
    await ev(() => SM_TOWN.storyStart('p0')); let dl = false; for (let i = 0; i < 20 && !dl; i++) { await W8(300); dl = await ev(() => !!document.querySelector('.twn-dlg')); }
    ok(dl, '이야기 첫 쪽지 창이 뜸');
    let f0 = await F(); const st0 = await ev(() => SM_TOWN.storyTodo());
    for (let i = 0; i < 12 && await ev(() => !!document.querySelector('.twn-dlg')); i++) { await p.keyboard.press('KeyE'); await W8(350); }
    let f1 = await F(); for (let i = 0; i < 10 && f1.g.step.play === f0.g.step.play; i++) { await W8(300); f1 = await F(); }
    const sv = await seen('hi', 900), st1 = await ev(() => SM_TOWN.storyTodo());
    ok(f1.g.step.play === f0.g.step.play + 1 && dSnd(f0, f1) >= 2, '단계 넘어감 = 소리(두 음) ' + dSnd(f0, f1) + '번 부름');
    ok(st1 && st1 !== st0, '할 일 줄이 바뀜 「' + (st1 || '-') + '」');
    ok((await F()).g.step.fx === f0.g.step.fx + 1 && sv.max > 0.3 && sv.end < 0.05, '할 일 줄 한 번 밝아짐(가장 ' + sv.max.toFixed(2) + ' → 끝 ' + sv.end.toFixed(2) + ')');
    await closeAll(); await ev(() => SM_TOWN.storyOff());

    // ── 2. 🛂 여권 도장(작은 도서관에 들어가기 → 도장) ──
    await closeAll(); f0 = await F(); const pv0 = await ev(() => Object.keys(SM_TOWN.game().S.pass ? SM_TOWN.game().S.pass.v : {}).length);
    ok(await ev(() => { const b9 = SM_TOWN.indoor.list().find(q => /도서관/.test(q.name || '')); return !!b9 && SM_TOWN.indoor.enter(b9.id); }), '작은 도서관 문 찾음'); let inb = false; for (let i = 0; i < 20 && !inb; i++) { await W8(300); f1 = await F(); inb = f1.g.stamp.play > f0.g.stamp.play; }
    const sv2 = await seen('st', 1100), pv1 = await ev(() => Object.keys(SM_TOWN.game().S.pass.v).length);
    ok(inb && pv1 === pv0 + 1, '들어가면 여권 도장 하나 (' + pv0 + ' → ' + pv1 + ')');
    ok(dSnd(f0, f1) >= 2, '도장 = 소리 「쿵」 (' + dSnd(f0, f1) + '번 부름 — 문 소리 포함)');
    ok(sv2.max > 0.5 && sv2.end < 0.05 && /도서관/.test(await ev(() => document.querySelector('.twn-feel-st').textContent)), '도장이 찍혔다 사라짐(가장 ' + sv2.max.toFixed(2) + ' → ' + sv2.end.toFixed(2) + ') · 장소 이름');
    await closeAll(); await ev(() => SM_TOWN.indoor.exit()); await W8(1500);
    /* 빨리 되풀이: 아직 안 찍은 곳 다섯을 0.1초 간격으로 */
    { const r = await ev(async () => { const J = SM_TOWN.jobs(), S9 = SM_TOWN.game().S.pass, L = SM_TOWN.places().filter(q => J.infoOf(q) && !S9.v[J.keyOf(q)]).slice(0, 5), a = SM_TOWN.feel().info();
        const vols = []; for (const q of L) { J.stamp(q); vols.push(SM_TOWN.feel().info().g.stamp.vol); await new Promise(r9 => setTimeout(r9, 100)); } const z = SM_TOWN.feel().info(); return { n: L.length, vols, quiet: z.g.stamp.quiet - a.g.stamp.quiet, skip: z.g.stamp.skip - a.g.stamp.skip }; });
      ok(r.n === 5 && r.vols[0] === 1 && r.vols[1] < 1 && r.vols[2] < r.vols[1] && r.vols[4] === 0 && r.skip === 1, '빨리 다섯 번 = 소리 작아지다 건너뜀 (' + r.vols.join(' · ') + ')'); }

    // ── 3. 💰 돈 받기 ──
    await W8(1500); await closeAll();
    /* ① 이야기 품삯처럼 돈만 들어올 때 = 짤랑 + 지갑 줄이 예전 → 지금 */
    { f0 = await F(); const m0 = await ev(() => SM_TOWN.game().S.money || 0);
      await ev(() => { const G = SM_TOWN.game(); G.earn(300, 'story'); SM_TOWN.feel().money(300); }); await W8(80); f1 = await F();
      const sv3 = await seen('wl', 1700), m1 = await ev(() => SM_TOWN.game().S.money);
      ok(f1.g.money.play === f0.g.money.play + 1 && dSnd(f0, f1) === 2, '돈만 들어옴 = 짤랑 (' + dSnd(f0, f1) + '번 부름)');
      ok(sv3.max > 0.8 && sv3.end < 0.05, '지갑 줄이 떴다 사라짐(가장 ' + sv3.max.toFixed(2) + ')'); ok((await F()).dom.wlT.replace(/\D/g, '') === String(m1), '지갑 줄 끝 숫자 = 지금 돈 ' + m1 + '원 (예전 ' + m0 + '원)'); }
    /* ② 진짜 길: 오늘 할 일 끝(돈 + ding) = ding만 · 짤랑은 건너뜀(겹침 X) · 지갑 줄은 뜸 */
    { const T9 = await ev(() => { const L = SM_TOWN.tasksNow() || []; const t = L.find(q => !q.done); return t ? { ev: t.ev, need: t.need || 1, n: t.n || 0 } : null; });
      if (T9) { f0 = await F(); const m0 = await ev(() => SM_TOWN.game().S.money || 0); for (let i = T9.n; i < T9.need; i++) await ev(e => SM_TOWN.rw.tev(e, 1), T9.ev); await W8(100); f1 = await F(); const m1 = await ev(() => SM_TOWN.game().S.money || 0);
        if (m1 > m0) { ok(f1.g.money.skip > f0.g.money.skip && f1.g.money.play === f0.g.money.play, '할 일 끝(ding과 같은 순간) = 짤랑 건너뜀 · 소리 ' + dSnd(f0, f1) + '번(ding)'); ok(f1.g.money.fx > f0.g.money.fx, '할 일 끝에도 지갑 줄 (' + m0 + ' → ' + m1 + ')'); }
        else console.log('    (할 일 ' + T9.ev + '가 돈을 안 줌 — 건너뜀)'); } else console.log('    (오늘 할 일이 없음 — 건너뜀)'); }
    await W8(1500);
    /* ③ 빨리 되풀이 */
    { const r = await ev(async () => { const a = SM_TOWN.feel().info(); for (let i = 0; i < 6; i++) { SM_TOWN.game().earn(10, 'story'); SM_TOWN.feel().money(10); await new Promise(r9 => setTimeout(r9, 120)); } const z = SM_TOWN.feel().info(); return { play: z.g.money.play - a.g.money.play, quiet: z.g.money.quiet - a.g.money.quiet, skip: z.g.money.skip - a.g.money.skip }; });
      ok(r.quiet >= 3 && r.skip >= 1, '돈 빨리 여섯 번 = 작게 ' + r.quiet + ' · 건너뜀 ' + r.skip); }

    // ── 4·5. 🌱 텃밭 심기 · 💧 손 물 주기 ──
    await W8(1500); await closeAll();
    const beds = await ev(() => SM_TOWN.farm().map((q, i) => ({ i, st: q.st, bed: q.bed })));
    ok(beds.length >= 4, '텃밭 두둑 ' + beds.length + '칸');
    await ev(() => { const S9 = SM_TOWN.game().S; S9.farm = []; SM_TOWN.farmDraw(); }); const B0 = beds[0].bed; await tp((B0[0] + B0[1]) / 2, B0[2] + 1.2); await W8(600);
    const farmOne = (i, k) => ev(([i, k]) => { const a = SM_TOWN.feel().info(); SM_TOWN.farmUse(i); if (k === 'plant') { const b9 = document.querySelector('.twn-p button[data-c]'); if (b9) b9.click(); } const z = SM_TOWN.feel().info(); return { a, z, st: SM_TOWN.farm()[i].st }; }, [i, k]);
    { const r = await farmOne(0, 'plant'); ok(r.st === 'water' && r.z.g.plant.play === r.a.g.plant.play + 1 && dSnd(r.a, r.z) >= 2, '심기 = 소리 「톡톡」 (' + dSnd(r.a, r.z) + '번 부름) · 두둑 = 물 줄 차례');
      ok(r.z.puff.vis && r.z.puff.alive > 0, '심기 = 흙 조각 ' + r.z.puff.alive + '개 보임'); await W8(900); const z2 = await F(); ok(!z2.puff.vis && z2.puff.alive === 0, '0.9초 뒤 흙 조각 사라짐(그리기 0)'); }
    await W8(1400);
    { const r = await farmOne(0, 'water'); ok(r.st === 'grow' && r.z.g.water.play === r.a.g.water.play + 1 && dSnd(r.a, r.z) >= 2, '손 물 주기 = 소리 「똑똑」 (' + dSnd(r.a, r.z) + '번 부름 · 예전엔 0) · 두둑 = 자라는 중');
      ok(r.z.puff.vis && r.z.puff.alive > 0, '물 주기 = 물방울 ' + r.z.puff.alive + '개 보임'); await W8(900); const z2 = await F(); ok(!z2.puff.vis, '0.9초 뒤 물방울 사라짐'); }
    await W8(1400);
    { const r = await ev(() => { const a = SM_TOWN.feel().info(), vols = []; for (const i of [1, 2, 3]) { SM_TOWN.farmUse(i); const b9 = document.querySelector('.twn-p button[data-c]'); if (b9) b9.click(); vols.push(SM_TOWN.feel().info().g.plant.vol); } const z = SM_TOWN.feel().info(); return { vols, quiet: z.g.plant.quiet - a.g.plant.quiet }; });
      ok(r.vols[0] === 1 && r.vols[1] < 1 && r.vols[2] < r.vols[1] && r.quiet === 2, '두둑 셋 빨리 심기 = 소리 작아짐 (' + r.vols.join(' · ') + ')'); }

    // ── 6. 'pop'(틀린 답·나쁜 선물이 쓰던 이름 — 학교 표에 없어 조용하던 것) ──
    { const r = await ev(() => { const a = SM_TOWN.feel().info().snd; SM_TOWN.feel().sfx('pop'); const z = SM_TOWN.feel().info().snd; return { pop: z.pop - a.pop, tone: z.tone - a.tone }; });
      ok(r.pop === 1 && r.tone === 2, "마을 map.sfx('pop') = 낮은 두 음 (예전엔 소리 0)"); }

    // ── 7. 설정 '소리 끄기' = 부름 0(연출은 그대로) ──
    await W8(1500); { const r = await ev(async () => { const M = await import('/v2/js/settings.js?v=2'), was = M.SET.mute; M.setSet({ mute: true }); const a = SM_TOWN.feel().info(); SM_TOWN.feel().stamp('시험'); const z = SM_TOWN.feel().info(); M.setSet({ mute: was }); return { d: (z.snd.tone - a.snd.tone) + (z.snd.sfx - a.snd.sfx), muted: z.snd.muted - a.snd.muted, fx: z.g.stamp.fx - a.g.stamp.fx }; });
      ok(r.d === 0 && r.muted === 1 && r.fx === 1, '소리 끄기 = 소리 부름 0 · 도장 연출은 그대로'); }

    // ── 8. 그리기·화면 ──
    await W8(1200); { const r = await ev(() => { const I = SM_TOWN.feel().info(); return { vis: I.puff.vis, dom: I.dom }; }); ok(!r.vis && r.dom.hi < 0.05 && r.dom.st < 0.05 && r.dom.wl < 0.05, '다 끝나면 남는 것 없음(조각·덮개·도장·지갑 줄 모두 안 보임)'); }
    }

    // ── 9. E 자리 전수(FEEL-2 · 사용자 10-24 '모든 동작 반응 넓히기'): 마을 E(바깥 + 방 종류마다 하나) 같은 일은 한 곳 → 눌러 보고 0.9초 안에
    //   소리 부름 · 창(.twn-p·.twn-dlg) · 알림 글 · 말풍선 · 흙·물 조각 · 화면 요소 새로 생김/모습 바뀜 · 3D 물체 생김·보임 바뀜 · 몸(행동·앉기·자세·멈춤·자리 옮김) · 방 들어감 가운데 하나라도 있어야
    //   '소리 없음'(글·화면만 바뀌고 조용) 수도 따로 셈 — 손맛 = 소리 하나 + 그 자리 연출 하나
    await closeAll(); await ev(() => { try { SM_TOWN.storyOff(); } catch (e) { void e; } });
    const EK = await ev(() => { window.__INS = () => { try { const s9 = SM_TOWN.indoor.state(); return { on: s9.on, busy: s9.busy }; } catch (e) { return { on: 'x', busy: true }; } }; window.__EPROBE = async (id, ms) => {
        const M = SD2.map, h = M.interact.list().find(q => q.id === id); if (!h || h.off || h.fOff || typeof h.use !== 'function') return { gone: 1 };   /* 그사이 꺼진 자리(물때·계절)는 건너뜀 */
        const F9 = SM_TOWN.feel(), sc = SD2.scene, toastEl = () => document.getElementById('toast');
        const vis3 = () => { const V = new Map(); sc.traverse(o => { if (o.isMesh || o.isSprite || o.isPoints || o.isLine) V.set(o.uuid, (o.visible ? 1 : 0) + (o.isInstancedMesh ? o.count * 2 : 0)); }); return V; };
        const keyOf = n => { let e = n.nodeType === 1 ? n : n.parentElement, k = ''; for (let i = 0; e && i < 3; i++, e = e.parentElement) k += (e.id || e.className || e.tagName) + '/'; return k; };
        const mut = []; const MO = new MutationObserver(L => { for (const r of L) { if (r.type === 'childList') { for (const n of r.addedNodes) if (n.nodeType === 1) mut.push(keyOf(n)); } else if (r.type === 'attributes') mut.push(keyOf(r.target)); } });
        MO.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
        const wait = t => new Promise(r => setTimeout(r, t));
        const snap = () => { const I = F9.info(), b = SM_TOWN.ask.bub(), te = toastEl(), me = M.player.get(); let room = null; try { room = SM_TOWN.indoor.state().on; } catch (e) { room = 'x'; } return { snd: I.snd.sfx + I.snd.tone + I.snd.muted, pf: I.puff.vis ? 1 : 0, bub: b.vis ? b.t : 0, toast: te && te.style.display !== 'none' ? te.textContent : '', pan: !!document.querySelector('.twn-p,.twn-dlg'), x: me.x, z: me.z, y: me.y, hd: me.h, act: (SD2.acts && SD2.acts.cur) || '', anim: !!(SD2.ACT.anim || SD2.ACT.sit), ctl: JSON.stringify([SD2.CTRL.frozen, SD2.CTRL.pose, SD2.CTRL.ride, SD2.CTRL.hideMe]), room, wb: (SM_TOWN.feel().info().e || {}).n || 0 }; };
        const V0 = vis3(); await wait(450); const V1 = vis3(), noise = new Set(mut); mut.length = 0;
        const noise3 = new Set(); for (const [u, v] of V1) if (V0.get(u) !== v) noise3.add(u); for (const u of V0.keys()) if (!V1.has(u)) noise3.add(u);
        const a = snap(); let err = '';
        try { SD2.actOn(h); } catch (e) { err = String(e.message || e).slice(0, 80); }
        const z1 = snap(); await wait(ms); const z = snap(), V2 = vis3(); MO.disconnect();
        let d3 = 0; for (const [u, v] of V2) if (!noise3.has(u) && V1.get(u) !== v) d3++;
        const dom = [...new Set(mut.filter(k => !noise.has(k) && !/^toast\//.test(k)))];
        const why = [];
        if (z.snd > a.snd) why.push('소리'); if (z1.pan || z.pan) why.push('창'); if ((z1.toast && z1.toast !== a.toast) || (z.toast && z.toast !== a.toast)) why.push('글'); if ((z.bub || z1.bub) && !a.bub) why.push('말풍선');
        if (z.pf || z1.pf) why.push('조각'); if (z.wb > a.wb) why.push('채움'); if (dom.length) why.push('화면'); if (d3) why.push('3D'); if (z.act !== a.act || z.anim !== a.anim || z1.anim || z.ctl !== a.ctl || Math.hypot(z.x - a.x, z.z - a.z) > 0.4 || Math.abs(z.y - a.y) > 0.6) why.push('몸'); if (z.room !== a.room) why.push('방');
        const lk = z.wb > a.wb ? F9.info().e.lk + (F9.info().e.lk === 'tap' ? ' 켜짐칸 ' + F9.info().e.pre : '') : ''; return { lk, why, snd: z.snd > a.snd, dom: dom.slice(0, 3), d3, err, toast: z.toast || z1.toast || '' }; };
      const M = SD2.map, seen = new Map();
      for (const h of M.interact.list()) { if (h.kind !== 'game' || h.off || h.fOff || typeof h.use !== 'function' || !/^game:town/.test(h.id) || SM_TOWN.inSchool(h.x, h.z) || h.y < -50) continue;
        const k = String(h.label).replace(/[0-9,.]+원?/g, '#').replace(/\(.*\)/, '').trim().slice(0, 40) + '|' + String(h.use).replace(/\s+/g, ' ').slice(0, 70); if (!seen.has(k)) seen.set(k, h.id); }
      return [...seen].map(([k, id]) => ({ k, id })); });
    const ERES = [], reset = async () => { await closeAll(); for (let i = 0; i < 3 && await ev(() => !!document.querySelector('.twn-play')); i++) { await p.keyboard.press('Escape'); await W8(300); }   /* 판 놀이 창(RF 등)도 닫음 */ for (let i = 0; i < 16 && await ev(() => !!__INS().busy && !!__INS().on); i++) await W8(250); await ev(() => { try { SM_TOWN.playEnd(false); } catch (e) { void e; } try { SM_TOWN.boatGo(false); } catch (e) { void e; } try { if (SM_TOWN.indoor.state().on) SM_TOWN.indoor.exit(); } catch (e) { try { SM_TOWN.indoor.exit(); } catch (e2) { void e2; } } SD2.map.player.freeze(false); }); await closeAll(); };
    const probe = async (L, tag) => { for (const q of L) { const at = await ev(id => { const h = SD2.map.interact.list().find(r => r.id === id); if (!h) return null; SD2.map.player.teleport([h.x, h.y + 0.05, h.z]); return [h.x, h.y, h.z]; }, q.id); if (!at) continue; await W8(350);
        const r = await ev(([id]) => window.__EPROBE(id, 900), [q.id]); if (r.gone) continue; ERES.push({ tag, k: q.k, at, ...r }); await reset(); if (tag !== '바깥') await ev(id => { void id; }, q.id); } };
    await probe(EK, '바깥');
    /* 방 안 E: 방 종류마다 한 곳에 들어가 그 방 E 전부(나가기 빼고) */
    { const kinds = await ev(() => { const o = {}; for (const r of SM_TOWN.indoor.list()) if (!o[r.kind]) o[r.kind] = r.id; return o; });
      for (const [kd, id] of Object.entries(kinds)) { await reset(); await ev(i => SM_TOWN.indoor.enter(i), id); let on = false; for (let i = 0; i < 20 && !on; i++) { await W8(250); on = await ev(() => !!__INS().on && !__INS().busy); } if (!on) continue; await closeAll();
        const L = await ev(kd => { const seen = new Set(), out = []; for (const h of SD2.map.interact.list()) { if (h.kind !== 'game' || h.off || h.fOff || typeof h.use !== 'function' || !/^game:town/.test(h.id) || /밖으로|Go outside/.test(h.label)) continue; const me = SD2.map.player.get(); if (Math.hypot(h.x - me.x, h.z - me.z) > 40 || Math.abs(h.y - me.y) > 6) continue; const k = kd + ':' + String(h.label).replace(/[0-9,.]+원?/g, '#').slice(0, 40) + '|' + String(h.use).replace(/\s+/g, ' ').slice(0, 50); if (seen.has(k)) continue; seen.add(k); out.push({ k, id: h.id }); } return out; }, kd);
        for (const q of L) { const still = await ev(() => !!__INS().on); if (!still) { await ev(i => SM_TOWN.indoor.enter(i), id); for (let i = 0; i < 20; i++) { await W8(250); if (await ev(() => !!__INS().on && !__INS().busy)) break; } }
          const at = await ev(i => { const h = SD2.map.interact.list().find(r => r.id === i); if (!h) return null; SD2.map.player.teleport([h.x, h.y + 0.05, h.z]); return [h.x, h.y, h.z]; }, q.id); if (!at) continue; await W8(300);
          const r = await ev(([i]) => window.__EPROBE(i, 900), [q.id]); if (r.gone) continue; ERES.push({ tag: '방', k: q.k, at, ...r }); await closeAll(); await ev(() => { try { SM_TOWN.playEnd(false); } catch (e) { void e; } SD2.map.player.freeze(false); }); } } }
    await reset();
    /* 채우기 길 셋을 일부러: 아무것도 안 하는 E = 톡 + 흙먼지 · 알림만 = 통 · 창만 = 사락 · 스스로 소리 내는 E = 채우지 않음 */
    { const r = await ev(async () => { const M = SD2.map, me = M.player.get(), F9 = SM_TOWN.feel(), w = t => new Promise(r9 => setTimeout(r9, t)), out = {};
        const one = async (k, fn) => { const h = M.interact.add({ kind: 'game', x: me.x, y: me.y, z: me.z, r: 1, label: '시험', use: fn }); await w(1400); await w(40); const a = F9.info(); SD2.actOn(h.hot); await w(160); const z = F9.info(); h.remove(); out[k] = { lk: z.e.n > a.e.n ? z.e.lk : '-', snd: (z.snd.sfx + z.snd.tone) - (a.snd.sfx + a.snd.tone), puff: z.puff.vis }; };
        await one('none', () => {}); await one('toast', () => F9.toast('시험 알림', 1)); await one('own', () => F9.sfx('ding'));
        return out; });
      ok(r.none.lk === 'tap' && r.none.snd === 1 && r.none.puff, '아무것도 안 하는 E = 톡(소리 ' + r.none.snd + ') + 흙먼지');
      ok(r.toast.lk === 'note' && r.toast.snd === 1, '알림 글만 내는 E = 통(소리 ' + r.toast.snd + ')');
      ok(r.own.lk === '-' && r.own.snd === 1, '스스로 소리 내는 E = 채우지 않음(소리 부름 ' + r.own.snd + ' = ding 하나만)'); await closeAll(); }
    { const none = ERES.filter(r => !r.why.length), quiet = ERES.filter(r => r.why.length && !r.snd), cut = s => s.split('|')[0];
      console.log('    E 자리 ' + ERES.length + '곳(같은 일은 한 곳) · 반응 0 = ' + none.length + ' · 소리 없음 = ' + quiet.length);
      if (process.argv.includes('--elist')) for (const r of ERES) if (r.lk) console.log('      채움 ' + r.lk + ': ' + cut(r.k) + ' [' + r.why.join(' ') + '] 「' + r.k.split('|')[1].slice(0, 50) + '」');
      for (const r of none) console.log('      반응 0: ' + cut(r.k) + ' @' + r.at.map(v => Math.round(v)).join(',') + (r.err ? ' 오류 ' + r.err : '') + ' 「' + String(r.use || r.k.split('|')[1]).slice(0, 60) + '」');
      for (const r of quiet) console.log('      소리 없음: ' + cut(r.k) + ' [' + r.why.join(' ') + '] ' + (r.toast ? '「' + r.toast.slice(0, 40) + '」' : '') + ' 「' + r.k.split('|')[1].slice(0, 50) + '」');
      { const E9 = await ev(() => SM_TOWN.feel().info().e); console.log('    채운 소리(FEEL-2): 창 사락 ' + E9.open + ' · 알림 통 ' + E9.note + ' · 톡+흙먼지 ' + E9.tap + ' · 문 딸깍 ' + E9.door + ' · 스스로 소리 ' + E9.own + ' · 몸 동작 ' + E9.act); }
      ok(ERES.length >= 40, 'E 자리 ' + ERES.length + '곳을 눌러 봄');
      ok(!none.length, '누른 뒤 아무 반응 없는 E = ' + none.length + '곳');
      ok(!ERES.filter(r => r.err).length, 'E 누름 오류 0' + ERES.filter(r => r.err).map(r => ' ' + cut(r.k) + ':' + r.err).join('')); }

    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
