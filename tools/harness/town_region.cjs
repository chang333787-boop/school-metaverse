// 마을 구역 이름 시험(REGION-1 · 사용자 10-26 '각 마을 이름이 아직 안 된 것 같은데'): node tools/harness/town_region.cjs [마을=ourtown] [포트=8002] [--shots=폴더(그리기 켬)]
//   구역 일곱 = 이름 일곱(겹침 X) · 표지석 일곱(제 구역 안 · 몸이 막힘 · 길 위 X) · 표지석 곁으로 옮기면 위 가운데 줄에 그 구역 이름
//   넘어갈 때 알림 한 번(그날 처음 = 뜻까지 긴 글) · 왕복해도 다시 X · 큰 지도(M)에 구역 이름 글씨 일곱 · 바로 가기(J)·찾기(F)에 구역 이름 · 휴대폰 세로 줄이 화면 안 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const pos9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos9[0] || 'ourtown', PORT = pos9[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; }, SHOTS = arg('shots');
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  const page = async (vw, touch) => { const ctx = await b.newContext({ viewport: { width: vw[0], height: vw[1] }, hasTouch: !!touch, isMobile: !!touch }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); }); return p; };
  const kit = p => { const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const panelK = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? (P.dataset.k || '?') : ''; });
    const closeAll = async () => { for (let i = 0; i < 6; i++) { if (await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn()))) { await p.keyboard.press('Escape'); await W8(250); continue; } if (!(await panelK())) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); if (await panelK()) { await p.keyboard.press('Escape'); await W8(250); } } };
    const prep = () => ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 10 * 60; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; G.S.story = G.S.story || {}; G.S.story.p0auto = 1; (G.S.quiz || (G.S.quiz = {})).tip = 1; if (G.rwOff) G.rwOff(true); });
    const boot = async () => { await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.region && window.SD2, null, { timeout: 240000 }); await W8(2000); await closeAll(); await p.keyboard.press('Escape'); await W8(400); await prep(); await W8(600); await closeAll(); };
    /* 표지석 E 자리(길 쪽 1.4m)로 옮김 + 돌을 봄 · 알림 글을 지켜봄(그동안 뜬 #toast 글 모두) */
    const go = (q, ms) => ev(([q, ms]) => new Promise(res => { const [x, z] = q.e, T = []; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.lookAt([q.x, q.z]); const t0 = performance.now(); let last = '';
      const f = () => { const e = document.getElementById('toast'), t = e && e.style.display !== 'none' && e.getClientRects().length ? e.textContent : ''; if (t && t !== last) T.push(t); last = t; if (performance.now() - t0 < ms) setTimeout(f, 100); else res({ toasts: T, goal: (document.getElementById('hudGoal') || {}).textContent || '', cur: SM_TOWN.region().cur }); }; f(); }), [q, ms]);
    return { ev, W8, panelK, closeAll, prep, boot, go }; };
  try { const p = await page([1366, 768]), K = kit(p), { ev, W8 } = K; await K.boot();
    console.log('① 이름·표지석');
    const R = await ev(() => SM_TOWN.region()), NM = R.names, keys = Object.keys(NM), names = keys.map(k => NM[k].n);
    ok(keys.length === 7 && new Set(names).size === 7, '구역 일곱 = 이름 일곱(' + keys.map(k => k + '=' + NM[k].n).join(' ') + ')');
    const RS = R.stones.filter(q => q.rg), KS = R.stones.filter(q => q.kid); R.stones = RS;
    ok(RS.length === 7 && new Set(RS.map(q => q.rg)).size === 7, '구역 표지석 일곱(' + RS.map(q => q.n + '@' + q.cell).join(' ') + ')');
    console.log('  아이 동네 ' + R.kids.length + ': ' + R.kids.map(g => g.names.join('/') + '=' + g.cells.join('·')).join(' | '));
    const KC = ['라5', '다6', '자11'], KG = KC.map(c => R.kids.find(g => g.cells.includes(c)));
    ok(KG.every(Boolean), '아이 동네 라5·다6·자11 있음(' + KG.map(g => g ? g.t : '-').join(' · ') + ')');
    ok(!!KG[1] && KG[1].cells.includes('라7'), '자연친화 마을 다6·라7 = 맞닿은(모서리) 한 동네');
    ok(!!KG[2] && KG[2].t === '유럽 옛 마을' && KG[2].cells.includes('차11'), '자11·차11 = 유럽 옛 마을(패들렛 47) 한 동네');
    ok(R.kids.every(g => KS.some(q => q.kid === g.id)), '아이 동네마다 이름 새긴 돌(' + KS.length + ' · 새로 세움 ' + KS.filter(q => !q.area).map(q => q.n + '@' + q.cell).join(' ') + ')');
    ok(!R.kids.some(g => g.names.some(n => /^(집|아파트|빌라|마을)$/.test(n) || /^(예지|하람|유은|인우|지원|시아) 집$/.test(n) || /[^ ]집$/.test(n))), '갈래 낱말·아이 한 사람 집·가게는 동네 이름에서 빠짐');
    for (const q of KS.filter(q => !q.area)) { const s = await ev(q => { const g = SM_TOWN.ground(q.x, q.z), bl = SD2.map.q.blocked || SD2.map.q.blockedAt; return !!bl(q.x, q.z, g + 0.4); }, q); ok(s, q.n + ' 새 표지석 몸이 막힘(' + q.cell + ')'); }
    for (const q of RS) { const s = await ev(q => { const g = SM_TOWN.ground(q.x, q.z), bl = SD2.map.q.blocked || SD2.map.q.blockedAt; return { rg: SM_TOWN.regionAt(q.x, q.z), rgE: SM_TOWN.regionAt(q.e[0], q.e[1]), blk: !!bl(q.x, q.z, g + 0.4), free: !bl(q.e[0], q.e[1], SM_TOWN.ground(q.e[0], q.e[1]) + 0.4) }; }, q);
      ok(s.rg === q.rg && s.blk && s.free, q.n + ' 표지석 = 제 구역(' + s.rg + ') · 몸이 막힘 ' + s.blk + ' · 읽는 자리 비어 있음 ' + s.free); }
    console.log('② 넘어갈 때 알림 · 위 가운데 줄');
    const ALL = [], order = ['읍내', '들', '관광', '산', '강', '바다', '시내'].filter(k => R.stones.some(q => q.rg === k)); let prev = R.cur;
    for (const k of order) { const q = R.stones.find(s => s.rg === k), r = await K.go(q, 4600), n = NM[k].n; ALL.push(...r.toasts); ok(r.cur === k, n + ': 지금 구역 = ' + r.cur); ok(r.goal.includes(n), n + ': 위 가운데 줄에 이름(' + r.goal + ')');
      if (prev && prev !== k) ok(ALL.some(t => t.includes(n + '에 들어왔어요') && t.includes(NM[k].mean)), n + ': 들어온 알림(그날 처음 = 뜻까지) ' + JSON.stringify(r.toasts)); prev = k; }
    const L1 = (await ev(() => SM_TOWN.region())).log; ok(L1.every(e => e.long) && new Set(L1.map(e => e.rg)).size === L1.length, '구역마다 알림 한 번(' + L1.map(e => e.rg).join(' ') + ')');
    console.log('③ 왕복해도 다시 X');
    const A9 = R.stones.find(s => s.rg === '강'), B9 = R.stones.find(s => s.rg === '시내'); let rep = []; await W8(6000); const seen0 = new Set((await ev(() => SM_TOWN.region())).log.map(e => e.t));
    for (let i = 0; i < 3; i++) { for (const q of [A9, B9]) { const r = await K.go(q, 1900); rep = rep.concat(r.toasts.filter(t => /들어왔어요/.test(t) && !seen0.has(t))); } }
    const L2 = (await ev(() => SM_TOWN.region())).log; ok(L2.length === L1.length && !rep.length, '두런내 ↔ 반짝시 세 번 왕복 = 새 알림 0(기록 ' + L1.length + ' → ' + L2.length + ' · 뜬 글 ' + rep.length + ')');
    console.log('③-2 아이 동네 칩 · 알림');
    const RX = /어울목|넘실들|솔솔재|두런내|출렁포|반짝시|나들터/;
    for (const g of KG.filter(Boolean)) { const q = KS.find(s => s.kid === g.id); if (!q) continue; await W8(4500); const r = await K.go(q, 5000), sh = g.t.replace(/\s*\(.*?\)\s*/g, ''), i0 = r.goal.indexOf(sh), i1 = r.goal.search(RX);
      ok(i0 >= 0 && (i1 < 0 || i0 < i1), g.t + ': 칩에 아이 이름이 구역 이름보다 앞(' + r.goal + ')');
      ok(r.toasts.some(t => t === g.t + ' — 아이들이 지은 동네'), g.t + ': 알림 한 번(' + JSON.stringify(r.toasts) + ')'); }
    { const L3 = (await ev(() => SM_TOWN.region())).log.filter(e => e.kid), q = KS.find(s => s.kid === KG[0].id); await K.go(R.stones.find(s => s.rg === '강'), 1900); await K.go(q, 2600); const L4 = (await ev(() => SM_TOWN.region())).log.filter(e => e.kid); ok(L4.length === L3.length, '아이 동네 다시 들어가도 그날은 알림 X(' + L3.length + ' → ' + L4.length + ')'); }
    console.log('④ 큰 지도 · 바로 가기 · 찾기');
    await ev(() => { window.__FT = []; const f0 = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (t, ...a) { window.__FT.push(String(t)); return f0.call(this, t, ...a); }; });
    await p.keyboard.press('KeyM'); await W8(900); const mk = await K.panelK(), ft = await ev(() => window.__FT.slice()); ok(!!mk && names.every(n => ft.includes(n)), '큰 지도에 구역 이름 일곱(' + names.filter(n => ft.includes(n)).join(' ') + ')');
    const lab = (await ev(() => SM_TOWN.region())).labels; ok(lab.filter(q => !q.kid).length === 7 && lab.every(q => q.t) && KG.filter(Boolean).every(g => ft.includes(g.t)), '지도 글씨 = 구역 일곱 + 아이 동네(라5·다6·자11 보임)(' + lab.map(q => q.t + '@' + Math.round(q.x) + ',' + Math.round(q.z)).join(' ') + ')');
    if (SHOTS) await p.screenshot({ path: SHOTS + '/region_map.png' });
    await K.closeAll(); await p.keyboard.press('KeyJ'); await W8(700); { const t = await ev(() => (document.querySelector('.twn-p') || {}).textContent || ''); ok(names.filter(n => t.includes(n)).length >= 3, '바로 가기(J)에 구역 이름(' + names.filter(n => t.includes(n)).join(' ') + ')'); }
    await K.closeAll(); await p.keyboard.press('KeyF'); await W8(700); { const t = await ev(() => (document.querySelector('.twn-p') || {}).textContent || ''); ok(names.filter(n => t.includes(n)).length >= 5, '찾기(F)에 구역 이름(' + names.filter(n => t.includes(n)).join(' ') + ')'); }
    await K.closeAll();
    if (SHOTS) { const q = R.stones.find(s => s.rg === '강'); await ev(q => { const dx = q.e[0] - q.x, dz = q.e[1] - q.z, L = Math.hypot(dx, dz) || 1, x = q.x + dx / L * 4.5, z = q.z + dz / L * 4.5; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.lookAt([q.x, q.z]); }, q); await W8(1500); await p.screenshot({ path: SHOTS + '/region_stone.png' }); }
    console.log('⑤ 휴대폰 세로');
    const p2 = await page([390, 844], true), K2 = kit(p2); await K2.boot(); { const R2 = await K2.ev(() => SM_TOWN.region()), G2 = R2.kids.find(g => g.cells.includes('사3')), q = R2.stones.find(s => G2 && s.kid === G2.id) || R2.stones[0]; await K2.go(q, 2400);
      const g = await K2.ev(() => { const e = document.getElementById('hudGoal'), r = e.getBoundingClientRect(); return { t: e.textContent, l: r.left, r: r.right, W: innerWidth, over: e.scrollWidth > e.clientWidth + 2 }; });
      ok(g.l >= 0 && g.r <= g.W && g.t.includes(q.rg ? R2.names[q.rg].n : q.n.replace(/\s*\(.*?\)\s*/g, '')), '휴대폰 위 가운데 줄 화면 안 · 이름 보임(' + g.t + ' · ' + Math.round(g.l) + '~' + Math.round(g.r) + '/' + g.W + (g.over ? ' · 넘침' : '') + ')');
      if (SHOTS) await p2.screenshot({ path: SHOTS + '/region_phone.png' }); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { ok(false, '시험 멈춤: ' + e.message.slice(0, 300)); }
  await b.close(); console.log((fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
