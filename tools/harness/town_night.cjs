// 🌙 밤에만 열리는 것 · 시간에 따른 사람 시험(NIGHT-1 · v2/games/town_night.js · ROUTINE-3 town_routine.js): node tools/harness/town_night.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 자리(야시장·밤 낚시·경매·별 자리·경찰서) ② 시각 18:00·21:00·23:50·06:20·11:00 + 비 오는 21:00 = 무리마다 열림/닫힘 · E 켜짐/꺼짐 표
//   ③ 사람: 거리 사람 몫(pvF)이 때·비마다 다름 · 야시장 둘레 길 사람(21:00 > 11:00) · 일꾼 저녁 갈래(산책·운동·퇴근길 장보기)가 밤에도 보임 · 일꾼 자리가 10:00·19:40·21:00마다 다름
//   ④ E 판단: 야시장 심부름(틀린 것 → 까닭 한 줄 · 맞는 것 → 끝) · 밤 낚시(켜진 깊은 자리 > 어두운 자리 · 미끼 셋) · 바다 불빛 세기(일지) · 별로 북쪽 찾기(남쪽 보고 E = 아님 · 북쪽 = 방위 물음 → 도장) · 밤 순찰 세 곳 → 일지 · 아침 경매 세 판 → 가게 문 앞 판
//   ⑤ 하루 계획 줄·할 일 후보·18시 알림 · 홍보판 X · 페이지 오류 0 · --shots = 밤 눈높이 캡처(그리기 켬)
const { chromium, RENDER } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null;
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', ...(RENDER ? ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] : [])] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|꼬리표 없는 보상|\[밤\]/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1&simoff=front'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.night && SM_TOWN.night() && SM_TOWN.routine && SM_TOWN.routine(), null, { timeout: 240000 }); await W8(2500);
    const shut = async () => { for (let i = 0; i < 8; i++) { const any = await ev(() => { const Q = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p .x'); if (Q) { Q.click(); return 1; } if (document.querySelector('.twn-p')) { SM_TOWN.say && 0; const c = document.querySelector('.twn-p button'); if (c) { c.click(); return 1; } } return document.querySelector('.twn-dlg') ? 2 : 0; }); if (!any) break; if (any === 2) await p.keyboard.press('KeyE'); await W8(250); } };
    await shut(); await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); try { SM_TOWN.storyOff(); } catch (e) { void e; } SM_TOWN.rules.season('summer'); G.money = 30000; });
    const N = () => ev(() => SM_TOWN.night().info()), at = async (m, wx, ms) => { await ev(([m9, w9]) => { const G = SM_TOWN.game(); G.S.clock = false; G.S.min = m9; SM_TOWN.rules.wx(w9 || 'clear'); G.mark(); }, [m, wx]); await W8(ms || 1500); };
    const tp = async (x, z, y) => { await ev(([x9, z9, y9]) => { const M = SD2.map; M.player.teleport([x9, y9 != null ? y9 + 0.05 : SM_TOWN.ground(x9, z9) + 0.05, z9]); }, [x, z, y]); await W8(400); };
    const press = (re, near) => ev(async ([src, nr]) => { const re = new RegExp(src), M = SD2.map, me = M.player.get(), c = nr || [me.x, me.z]; let h = null, bd = 1e9; for (const q of M.interact.list()) { if (q.kind !== 'game' || q.off || !re.test(q.label || '')) continue; const d = Math.hypot(q.x - c[0], q.z - c[1]); if (d < bd) { bd = d; h = q; } } if (!h) return { none: 1 };
      M.player.teleport([h.x, h.y + 0.05, h.z]); await new Promise(r => setTimeout(r, 250)); SD2.actOn(h); await new Promise(r => setTimeout(r, 450)); const P = document.querySelector('.twn-p'); return { label: h.label, x: h.x, z: h.z, pan: P ? P.innerText.slice(0, 400) : '' }; }, [re.source, near || null]);
    const btn = (sel, ms) => ev(async ([s, ms9]) => { const b9 = document.querySelector('.twn-p ' + s); if (!b9) return null; const t = b9.textContent; b9.click(); await new Promise(r => setTimeout(r, ms9 || 350)); const P = document.querySelector('.twn-p'); return { t, pan: P ? P.innerText.slice(0, 400) : '' }; }, [sel, ms]);
    const toast = () => ev(() => ((document.getElementById('toast') || {}).textContent || '') + ' | ' + ((document.querySelector('.twn-say, .say-line') || {}).textContent || ''));
    const shot = async (n, f) => { if (!SHOTS) return; await ev(f9 => { eval(f9); }, f); await W8(2600); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('  📷 ' + SHOTS + '/' + n + '.png'); };

    // ── ① 자리 ──
    console.log('── ① 자리');
    await at(11 * 60); let I = await N(); const st = I.site;
    ok(st && st.mkt, '🏮 야시장 자리 ' + (st && st.mkt ? st.mkt.join(', ') : '-') + ' (자리 고르기 ' + I.ms + 'ms)');
    ok(st && st.fish && st.fish.length === 3, '🎣 밤 낚시 자리 셋 ' + (st && st.fish ? st.fish.map(f => (f[2] ? '부두 끝' : '물가') + (f[3] ? '·등 켜짐' : '·등 꺼짐')).join(' / ') : '-'));
    ok(st && st.auc, '🔔 경매 자리 ' + (st && st.auc ? st.auc[0] + ', ' + st.auc[1] + ' → 가게 ' + st.auc[2].join('·') : '-'));
    ok(st && st.stars.length >= 3, '🌌 별 자리 ' + (st ? st.stars.map(s => s[2]).join(' · ') : '-'));
    ok(st && st.pol && st.pol[2] >= 3, '👮 경찰서 순찰 후보 ' + (st && st.pol ? st.pol[2] : 0) + '곳 · 응급실 ' + (st && st.hos) + ' · 24시 편의점 ' + (st && st.cv) + ' · 빵집 ' + (st && st.bk));

    // ── ② 때 표 ──
    console.log('── ② 때마다 열림/닫힘');
    const EXP = { 1080: { mkt: 1, late: 0, boats: 0, auc: 0, bake: 0, star: 0, pat: 0, fish: 0 }, 1260: { mkt: 1, late: 1, boats: 1, auc: 0, bake: 0, star: 1, pat: 1, fish: 1 }, 1430: { mkt: 0, late: 1, boats: 1, auc: 0, bake: 0, star: 1, pat: 0, fish: 1 }, 380: { mkt: 0, late: 1, boats: 0, auc: 1, bake: 1, star: 0, pat: 0, fish: 0 }, 660: { mkt: 0, late: 0, boats: 0, auc: 0, bake: 0, star: 0, pat: 0, fish: 0 } };
    const tbl = {};
    for (const m of [1080, 1260, 1430, 380, 660]) { await at(m); I = await N(); const hk = new Set(I.hots.filter(h => h[2]).map(h => h[0])), E = EXP[m], got = { mkt: I.vis.mkt && hk.has('mkt'), late: I.vis.late, boats: I.vis.boats, auc: I.vis.auc && hk.has('auc'), bake: I.vis.bake, star: !!(I.star && I.star.on) && hk.has('star'), pat: hk.has('pat'), fish: hk.has('fish') };
      if (!I.fishP || !I.fishP.boats) E.boats = 0;
      const bad = Object.keys(E).filter(k => !!E[k] !== !!got[k]); tbl[m] = got; const hh = String((m / 60) | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
      ok(!bad.length, hh + ' — ' + Object.entries(got).map(([k, v]) => k + (v ? '○' : '·')).join(' ') + ' · 거리 사람 몫 ' + I.pvF + (bad.length ? ' · 어긋남 ' + bad.join(',') : '')); }
    await at(1260, 'rain'); I = await N(); { const hk = new Set(I.hots.filter(h => h[2]).map(h => h[0])); ok(!I.vis.mkt && I.vis.mktDay && !hk.has('mkt') && !(I.star && I.star.on) && !I.vis.boats && I.pvF < 0.2, '비 오는 21:00 — 야시장 쉼(접힌 노점 + 안내판) · 별 X · 배 X · 거리 사람 몫 ' + I.pvF + ' (맑은 밤 ' + 0.45 + ')'); }

    // ── ③ 사람 ──
    console.log('── ③ 시간에 따른 사람');
    const pf = {}; for (const [m, w] of [[400, 'clear'], [700, 'clear'], [1090, 'clear'], [1200, 'clear'], [1300, 'clear'], [1300, 'rain'], [1420, 'clear']]) { await at(m, w, 1200); pf[m + w[0]] = (await N()).pvF; }
    ok(new Set(Object.values(pf)).size >= 5, '거리 사람 몫(보이는 사람 / 64): ' + Object.entries(pf).map(([k, v]) => k.slice(0, -1).replace(/(\d+)/, q => String((q / 60) | 0) + ':' + String(q % 60).padStart(2, '0')) + (k.endsWith('r') ? '비' : '') + ' ' + (v < 0 ? '낮(예전)' : v)).join(' · '));
    const pedAt = async (m) => { const M = st.mkt; await at(m); await tp(M[0] - 520, M[1] - 40); await W8(7000); await tp(M[0] + 25, M[1] + 25); await W8(9000); return ev(([x, z]) => SM_TOWN.ask.ped(x, z, 70), M); };   /* 멀리 갔다가 돌아오면 길 사람이 내 둘레(모이는 곳 사람 = 그곳 둘레)에 다시 놓임 */
    { const M = st.mkt; const n11 = await pedAt(11 * 60), n21 = await pedAt(21 * 60); I = await N();
      ok(/nmkt/.test(I.hubs) && n21 > n11, '야시장 70m 안 길 사람: 11:00 ' + n11 + '명 → 21:00 ' + n21 + '명 (모이는 곳 ' + I.hubs + ')'); }
    { const pos9 = {}; for (const m of [600, 1180, 1265]) { await at(m, 'clear', 2600); const R = await ev(() => { const r = SM_TOWN.routine(), I = r.info(); return { list: I.list.map(o => [o.i, o.st, o.cx, o.cz, o.out]), ev: r.ev(), nN: r.nightN() }; }); pos9[m] = R; }
      const vis = m => pos9[m].list.filter(q => !q[4] || q[4] === 2).length, moved = pos9[600].list.filter((q, i) => { const r = pos9[1265].list[i]; return r && (q[1] !== r[1] || Math.hypot(q[2] - r[2], q[3] - r[3]) > 2); }).length;
      ok(moved >= pos9[600].list.length * 0.5, '일꾼 자리·상태가 10:00 ↔ 21:05에 다름 ' + moved + '/' + pos9[600].list.length + ' (10:00 일터에 선 몸 ' + pos9[600].list.filter(q => q[1] === 'in').length + ' · 밤에도 보이는 몸 19:40 ' + pos9[1180].nN + ' · 21:05 ' + pos9[1265].nN + ')');
      const E19 = pos9[1180].ev, E21 = pos9[1265].ev; console.log('  · 저녁 갈래 19:40 ' + JSON.stringify(E19.eve.map(q => q.k + ':' + q.st + (q.nv ? '(밤에 보임)' : ''))) + ' · 21:05 ' + JSON.stringify(E21.eve.map(q => q.k + ':' + q.st + (q.nv ? '(밤에 보임)' : ''))));
      ok(E19.eve.some(q => /^eve/.test(q.st) && q.nv) && pos9[1180].nN > 0, '19:40 저녁 산책하는 이웃이 밤에도 보임 (산책 시작 ' + E19.nEve + ' · 밤에 보이는 몸 ' + pos9[1180].nN + ')');
      { const gq = E19.eve.filter(q => q.gymT != null).sort((a, b) => a.gymT - b.gymT); if (gq.length) { await at(gq[0].gymT + 3, 'clear', 2600); const G9 = await ev(() => SM_TOWN.routine().ev()), g = G9.eve.find(q => q.i === gq[0].i); ok(G9.nGym > 0 && g && /^gym/.test(g.st) && g.nv, '밤 운동 ' + gq.length + '명(운동 쉼터 320m 안) · ' + String((gq[0].gymT / 60) | 0) + ':' + String(gq[0].gymT % 60).padStart(2, '0') + ' ' + (g ? g.k + ' ' + g.st + ' (' + g.x + ', ' + g.z + ')' : '-') + ' · 밤에 보임'); } else ok(true, '밤 운동 — 운동 쉼터 320m 안에 집이 있는 이웃 없음'); }
      ok(E19.eve.filter(q => q.esh).length === 2, '퇴근길 장보기 고른 이웃 ' + E19.eve.filter(q => q.esh).length + ' (시작 ' + E21.nEsh + ')');
      await at(1180, 'rain', 2600); const Rr = await ev(() => SM_TOWN.routine().ev()); ok(!Rr.eve.some(q => /^eve/.test(q.st)), '비 오는 19:40 = 산책하는 이웃 없음'); }

    // ── ④ E 판단 ──
    console.log('── ④-1 🏮 야시장 심부름');
    await at(19 * 60); I = await N(); const MK = I.mkt; let r = await press(/야시장 이웃/); ok(/부탁/.test(r.pan || ''), '이웃 E = 부탁 「' + (r.pan || '').replace(/\s+/g, ' ').slice(0, 70) + '」'); await shut();
    const FO = await ev(() => { const s = SM_TOWN.night().info().mkt; return s; }), okOf = await ev(([kind, st9]) => { const S9 = SM_TOWN.game().S, sea = 'summer'; const F = { corn: ['farm', ['summer']], potato: ['farm', ['summer']], sweet: ['farm', ['autumn']], berry: ['farm', ['winter', 'spring']], mugwort: ['farm', ['spring']], squid: ['sea', ['summer', 'autumn']], shad: ['sea', ['autumn']], fishcake: ['port', []], banana: ['abroad', []], toast: ['wheat', []], tang: ['south', ['winter']] }; void S9;
      return st9.map(k => { const [o, s] = F[k], near = o === 'farm' || o === 'sea', ins = s.includes(sea); return kind === 'local' ? near : kind === 'season' ? ins : near && ins; }); }, [FO.kind, FO.stalls]);
    const goodI = okOf.indexOf(true), badI = okOf.indexOf(false); ok(goodI >= 0 && badI >= 0, '노점 다섯 ' + FO.stalls.join('·') + ' · 부탁 ' + FO.kind + ' · 맞는 것 ' + okOf.filter(Boolean).length + '개');
    const stallAt = await ev(() => SD2.map.interact.list().filter(h => /노점 판 읽기/.test(h.label) && !h.off).map(h => [h.x, h.z]));
    const cardRead = async i => { await tp(stallAt[i][0], stallAt[i][1]); return press(/노점 판 읽기/, stallAt[i]); };
    r = await cardRead(badI); ok(/재료/.test(r.pan) && /온 곳/.test(r.pan) && /많이 나는 때/.test(r.pan), '노점 판 = 재료 · 온 곳 · 많이 나는 때 「' + r.pan.replace(/\s+/g, ' ').slice(0, 90) + '」');
    const m0 = await ev(() => SM_TOWN.game().S.money); await btn('[data-a="buy"]'); const m1 = await ev(() => SM_TOWN.game().S.money); ok(m1 < m0, '사기 = 돈 ' + (m0 - m1) + '원 씀');
    r = await press(/야시장 이웃/); await btn('[data-k]', 500); let t = await toast(); I = await N(); ok(!I.mkt.done && /판을 다시|왔대요|많이 나는 때/.test(t), '틀린 것 건넴 → 끝나지 않고 까닭 한 줄 「' + t.slice(0, 110) + '」');
    r = await cardRead(goodI); await btn('[data-a="buy"]'); r = await press(/야시장 이웃/); await btn('[data-k="' + FO.stalls[goodI] + '"]', 500); t = await toast(); I = await N(); ok(I.mkt.done && I.S.mk.ok >= 1, '맞는 것 건넴 → 심부름 끝 · 잘한 수 ' + I.S.mk.ok + ' 「' + t.slice(0, 110) + '」');
    await shut();

    console.log('── ④-2 🎣 밤 낚시 · 🦑 바다 불빛');
    await at(21 * 60); I = await N(); const FS = I.site.fish, bag0 = await ev(() => SM_TOWN.game().S.bag['🐟'] | 0);
    const litDeep = FS.findIndex(f => f[2] && f[3]), dark = FS.findIndex(f => !f[3]), litAny = FS.findIndex(f => f[3]);
    const cast = async i => { const f = FS[i]; await tp(f[0], f[1]); const hs = await ev(([x, z]) => { let b9 = null, bd = 9; for (const h of SD2.map.interact.list()) { if (!/밤 낚시/.test(h.label) || h.off) continue; const d = Math.hypot(h.x - x, h.z - z); if (d < bd) { bd = d; b9 = h; } } if (b9) SD2.actOn(b9); return !!b9; }, [f[0], f[1]]); await W8(5600); const P = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); await shut(); return P; };
    const firstI = litDeep >= 0 ? litDeep : litAny; let P1 = await cast(firstI); const bag1 = await ev(() => SM_TOWN.game().S.bag['🐟'] | 0); ok(bag1 > bag0 && /불빛|등불/.test(P1), (litDeep >= 0 ? '등 켜진 부두 끝' : '등 켜진 물가') + ' = ' + (bag1 - bag0) + '마리 「' + P1.replace(/\s+/g, ' ').slice(0, 80) + '」');
    if (dark >= 0) { const P2 = await cast(dark), bag2 = await ev(() => SM_TOWN.game().S.bag['🐟'] | 0); ok(bag2 === bag1 && /어두워|꺼져/.test(P2), '등 꺼진 자리 = 0마리 「' + P2.replace(/\s+/g, ' ').slice(0, 70) + '」'); }
    await cast(firstI); await tp(FS[firstI][0], FS[firstI][1]); await ev(() => { for (const h of SD2.map.interact.list()) if (/밤 낚시/.test(h.label) && !h.off) { SD2.actOn(h); break; } }); await W8(500); t = await toast(); ok(/미끼를 다/.test(t), '넷째 = 미끼 다 씀 한 줄');
    const nB = I.fishP.boats; r = await press(/바다 불빛 세기/); const opts = await ev(() => [...document.querySelectorAll('.twn-p [data-n]')].map(b9 => +b9.dataset.n)); const wrong = opts.find(v => v !== nB);
    if (wrong != null) { await btn('[data-n="' + wrong + '"]'); const m9 = await ev(() => (document.querySelector('.twn-p .ng-m') || {}).textContent || ''); ok(/다시/.test(m9), '불빛 수 틀림 → 다시 세기 한 줄'); }
    await btn('[data-n="' + nB + '"]', 500); I = await N(); t = await toast(); ok(I.S.boats.length === 1 && I.S.boats[0].n === nB, '바다 불빛 ' + nB + '개 = 일지에 남음 「' + t.slice(0, 80) + '」'); await shut();

    console.log('── ④-3 🌌 별로 북쪽 찾기');
    { const sp = I.site.stars.find(s => /해수욕장|갯벌/.test(s[2])) || I.site.stars[0]; await at(21 * 60); await tp(sp[0], sp[1]); r = await press(/별로 북쪽 찾기/, [sp[0], sp[1]]); ok(/북두칠성|카시오페이아|W/.test(r.pan), '별 자리 E = 찾는 법 「' + r.pan.replace(/\s+/g, ' ').slice(0, 90) + '」'); await btn('[data-a="go"]');
      const look = (dz, pit) => ev(([d9, p9]) => { const M = SD2.map, me = M.player.get(); M.player.lookAt([me.x, me.z + d9]); M.player.setPitch(p9); }, [dz, pit]);
      await look(60, -0.7); await W8(700); await press(/별로 북쪽 찾기/, [sp[0], sp[1]]); t = await toast(); let A9 = (await N()).aim; ok(A9 && A9.step === 1, '남쪽을 보고 E = 아직 아님 「' + t.slice(0, 70) + '」');
      await look(-60, -0.7); await W8(700); const ca = await ev(() => SM_TOWN.night().dbg.camAz()); await press(/별로 북쪽 찾기/, [sp[0], sp[1]]); const pan = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); ok(/북극성을 찾았어요/.test(pan), '북쪽(카메라 방위 ' + Math.round(ca.az) + '° · 올려봄 ' + Math.round(ca.el) + '°) E = 찾았어요 → 방위 물음 「' + pan.replace(/\s+/g, ' ').slice(0, 70) + '」');
      const ans = await ev(([x, z]) => { const T = SM_TOWN.tower().info().site, sch = [17, 104]; const C = [[T.x, T.z]]; void sch; const d = (dx, dz) => Math.round(((Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360) / 45) % 8; return [d(T.x - x, T.z - z)]; }, [sp[0], sp[1]]);
      const bts = await ev(() => [...document.querySelectorAll('.twn-p [data-d]')].map(b9 => +b9.dataset.d)); const wr = bts.find(v => v !== ans[0]); await btn('[data-d="' + wr + '"]'); const mm = await ev(() => (document.querySelector('.twn-p .ng-m') || {}).textContent || ''); ok(/북극성 쪽/.test(mm), '방위 틀림 → 북극성 쪽부터 다시 한 줄');
      await btn('[data-d="' + ans[0] + '"]', 500); I = await N(); const has = await ev(() => !!SM_TOWN.game().S.bag['🌌']); ok(I.S.star.n === 1 && has, '마디탑 방위 맞힘 → 별 찾기 끝 · 🌌 북극성 도장'); await shut(); }
    await at(21 * 60); { const T = await ev(() => SM_TOWN.tower().info().site); await tp(T.x + 30, T.z + 30); await W8(1300); I = await N(); ok(I.star.on && I.star.dim === 1, '마디탑 곁(시내 불빛) = 흐린 별 묻힘(dim ' + I.star.dim + ')'); const sp = I.site.stars.find(s => /전망대$/.test(s[2])); if (sp) { await tp(sp[0], sp[1]); await W8(1300); I = await N(); ok(I.star.dim === 0, '뒷산 전망대 = 흐린 별까지 보임(dim ' + I.star.dim + ')'); } }

    console.log('── ④-4 👮 밤 순찰');
    await at(20 * 60 + 40); r = await press(/밤 순찰 같이 하기/); ok(/세 곳/.test(r.pan), '경찰관 E = 순찰 설명 「' + r.pan.replace(/\s+/g, ' ').slice(0, 70) + '」'); await btn('[data-a="go"]'); I = await N();
    ok(I.pat && I.pat.cps.length === 3, '순찰 자리 셋: ' + (I.pat ? I.pat.cps.map(c => c.k + '(' + c.x + ',' + c.z + ')').join(' · ') : '-'));
    const lbl = { lamp: /가로등 살펴보기/, kid: /아이에게 말 걸기/, bike: /자전거 살펴보기/, bag: /가방 살펴보기/ };
    for (let i = 0; i < 3; i++) { const c = (await N()).pat.cps[i], goodJ = c.k === 'lamp' || c.k === 'bike' ? c.bad : 0, o = c.obj[goodJ];
      if (c.k === 'lamp' || c.k === 'bike') { const oj = c.obj[1 - Math.min(1, goodJ)] && (goodJ === 0 ? c.obj[1] : c.obj[0]); await tp(oj[0], oj[1]); await press(lbl[c.k], oj); await btn('[data-k="0"]'); const m9 = await ev(() => (document.querySelector('.twn-p .ng-m') || {}).textContent || ''); ok(/잘 켜져|이미 보관대/.test(m9), c.k + ': 멀쩡한 것을 고르면 한 줄 「' + m9.slice(0, 40) + '」'); await shut(); }
      await tp(o[0], o[1]); await press(lbl[c.k], o);
      if (c.k === 'lamp') await btn('[data-k="0"]', 500);
      else if (c.k === 'bike') await btn('[data-k="0"]', 500);
      else if (c.k === 'bag') { await btn('[data-k="0"]'); const m9 = await ev(() => (document.querySelector('.twn-p .ng-m') || {}).textContent || ''); ok(/함부로/.test(m9), 'bag: 열어서 챙기기 → 한 줄'); await btn('[data-k="1"]', 500); }
      else if (c.k === 'kid') { await btn('[data-k="0"]'); await btn('[data-k="1"]', 2200); await btn('[data-k="' + ((c.col + 1) % 4) + '"]'); const m9 = await ev(() => (document.querySelector('.twn-p .ng-m') || {}).textContent || ''); ok(/다시 보고/.test(m9), 'kid: 옷 색 틀림 → 다시 보고 와요'); await btn('[data-k="' + c.col + '"]', 500); }
      I = await N(); ok(I.pat.cps[i].done, (i + 1) + '번 ' + c.k + ' 끝'); await shut(); }
    { const o = await ev(() => { const h = SD2.map.interact.list().find(q => /밤 순찰 같이 하기/.test(q.label)); return h && [h.x, h.z]; }); await tp(o[0], o[1]); r = await press(/밤 순찰 같이 하기/); I = await N(); const has = await ev(() => !!SM_TOWN.game().S.bag['🌙']); ok(!I.pat && I.S.pat.n === 1 && /순찰 일지/.test(r.pan) && has, '경찰서로 돌아와 E = 순찰 일지 「' + r.pan.replace(/\s+/g, ' ').slice(0, 90) + '」 · 🌙 도장'); await shut(); }

    console.log('── ④-5 🔔 아침 경매');
    await ev(() => { const G = SM_TOWN.game(); G.S.day += 1; G.mark(); }); await at(6 * 60 + 20, 'clear', 1800); I = await N(); t = await toast(); console.log('  · 아침 알림 「' + t.slice(0, 80) + '」');
    r = await press(/아침 경매 구경하기/); ok(/손가락/.test(r.pan), '경매 E = 손가락 값 읽기 「' + r.pan.replace(/\s+/g, ' ').slice(0, 70) + '」');
    for (let k = 0; k < 3; k++) { I = await N(); const L9 = I.auc.lot; if (k === 0) { await btn('[data-i="' + ((L9.win + 1) % 3) + '"]'); const m9 = await ev(() => (document.querySelector('.twn-p .ng-m') || {}).textContent || ''); ok(/다시 세어/.test(m9), '낮은 값 고름 → 다시 세어 봐요'); } await btn('[data-i="' + L9.win + '"]'); await btn('[data-s="' + L9.win + '"]', 450); }
    I = await N(); await W8(1300); I = await N(); ok(I.S.auc.fin && I.S.auc.got.length === 3 && I.vis.aucSign === false, '세 판 끝 → 가게 ' + (I.S.auc.got || []).map(q => q.shop).join('·') + ' (판은 8:30부터)');
    await at(10 * 60, 'clear', 1400); I = await N(); ok(I.vis.aucSign === true, '10:00 = 가게 문 앞 「오늘 아침 경매」 판 보임'); await shut();

    // ── ⑤ 하루 계획 · 할 일 · 알림 ──
    console.log('── ⑤ 하루 계획 · 할 일 · 18시 알림');
    { const D = await ev(() => { const d = SM_TOWN.dayx(); return d && d.list ? d.list().map(q => q.g) : []; }); ok(['nmkt', 'npat', 'nfish'].every(g => D.includes(g)), '오늘 시간표에 밤 때: ' + D.filter(g => /^n/.test(g)).join(' · '));
      const C = await ev(() => { const C9 = {}; SM_TOWN.night().ctx(C9); return C9.night ? [C9.night[3], C9.night.why && C9.night.why[0]] : null; }); ok(!!C, '오늘 할 일 셋째 후보 = 「🌙 밤에만 열리는 것: ' + (C ? C[0] : '-') + '」');
      await at(17 * 60 + 50, 'clear', 900); await at(18 * 60 + 2, 'clear', 1500); I = await N(); t = await toast(); ok(I.S.said === (await ev(() => SM_TOWN.game().S.day)), '18시 = 「오늘 밤 열리는 것」 알림 한 번 「' + t.slice(0, 90) + '」'); }

    if (SHOTS) { console.log('── 📷 밤 눈높이');
      await at(20 * 60 + 10); const M = (await N()).site.mkt; const lookAt = (x, z, px, pz, pit) => 'const M=SD2.map;M.player.teleport([' + px + ',SM_TOWN.ground(' + px + ',' + pz + ')+0.05,' + pz + ']);M.player.lookAt([' + x + ',' + z + ']);M.player.setPitch(' + pit + ');';
      const MF = await ev(() => { const s = SM_TOWN.night().info().site.mkt; const h = SD2.map.interact.list().filter(q => /노점 판 읽기/.test(q.label)); return { c: s, e: h.map(q => [q.x, q.z]) }; });
      const e0 = MF.e[2], dx = e0[0] - M[0], dz = e0[1] - M[1], L9 = Math.hypot(dx, dz) || 1;
      await shot('n_mkt', lookAt(M[0], M[1], M[0] + dx / L9 * 13, M[1] + dz / L9 * 13, 0.22)); await shot('n_mkt_side', lookAt(M[0], M[1], MF.e[0][0] + dx / L9 * 6 + (MF.e[0][0] - M[0]) * 0.6, MF.e[0][1] + dz / L9 * 6 + (MF.e[0][1] - M[1]) * 0.6, 0.1));
      await at(21 * 60 + 10); const F = (await N()).site.fish; await shot('n_pier', lookAt(F[0][0] + 220, F[0][1], F[0][0] - 9, F[0][1] + 3, 0.05)); await shot('n_shore', lookAt(F[1][0], F[1][1], F[0][0] - 12, (F[1][1] + F[2][1]) / 2, 0.12));
      const S0 = (await N()).site.stars.find(s => /해수욕장/.test(s[2])) || (await N()).site.stars[0]; await shot('n_stars', lookAt(S0[0], S0[1] - 50, S0[0], S0[1], -0.72));
      await at(20 * 60 + 40); await ev(() => SM_TOWN.night().dbg.patReset()); await press(/밤 순찰 같이 하기/); await btn('[data-a="go"]'); await shut(); I = await N(); for (let i = 0; i < 3; i++) { const c = I.pat.cps[i]; await shot('n_pat_' + c.k, lookAt(c.x, c.z, c.x - (c.obj[0][0] - c.x) * 0 + 7, c.z + 5, 0.18)); }
      const PO = await ev(() => { const h = SD2.map.interact.list().find(q => /밤 순찰 같이 하기/.test(q.label)); return [h.x, h.z]; }); await shot('n_police', lookAt(PO[0], PO[1], PO[0] + 8, PO[1] + 6, 0.15));
      const ER = await ev(() => { const h = SD2.map.interact.list().find(q => /응급실/.test(q.label)); return h && [h.x, h.z]; }); if (ER) await shot('n_er', lookAt(ER[0], ER[1], ER[0] + 7, ER[1] + 5, 0.15));
      await at(6 * 60 + 30); const AU = (await N()).site.auc; await shot('n_auction', lookAt(AU[0], AU[1], AU[0] + 9, AU[1] + 6, 0.15));
      await at(11 * 60); await shot('n_mkt_day', lookAt(M[0], M[1], M[0] + dx / L9 * 12, M[1] + dz / L9 * 12, 0.15)); }
    await shut();
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' / ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외', e.stack); } finally { await b.close(); }
  console.log(fails.length ? '❌ 실패 ' + fails.length + ': ' + fails.join(' | ') : '✅ town_night 통과'); process.exit(fails.length ? 1 : 0); })();
