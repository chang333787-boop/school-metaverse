// 🧭 처음 15분 길 — 길·도착·표시(PATH-1A · 11-14 · 평가 A(읽는 아이)·B(안 읽는 아이)가 1366×768에서 멈춘 자리): node tools/harness/town_path1.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   가 · 문 E: 처음 선 자리 = 칠판이 먼저 · 문에 바짝 붙어 서도 '들어가기'가 뜸(걸2 · 걸16) · 가게 계산대 E가 2m 앞에서(걸17)
//   나 · 꽃 물 주기(두 평가자 모두 멈춘 첫 할 일): 노란 ❗가 화면 안에(G2) · 곁에서 F 톡 한 번에 넘어감 · 빈 물통 = 채울 곳 이름 + 길 안내 · 채울 곳 E 글이 도구 띠에 안 깔림(G8) · 채우면 안내 꺼짐 · 자전거·우산 = 까닭 한마디
//   다 · 빨간 선: 찻길 가운데로 안 남(사람 줄 · 걸26) · 거리 숫자 = 한 가지 기준(힌트 글 수 = 선 수 · 선을 따라 걸으면 안 커짐 · G4) · 같은 갈래의 다른 자리에 닿아도 도착(헤1) · 물건을 얻으면 안내 끝(걸29)
//   라 · 손 든 일꾼 칩 = 방위 + 거리(막3)
//   마 · 도착 = 그 곳에 닿음(G1): 놀이터 뒤쪽(문에서 먼 쪽)에서도 데려가기 끝 · 112 같이 걷기 위 줄 = 방위 + 남은 거리
//   사 · 남은 것(PATH-1A2): 처음 켜진 선 = 갈 쪽을 보고 섬(G10 · '나' 안) · 길 위 띠 = 인도 그림보다 위(G16 · '다' 안) · 경찰관 곁 E = 경찰관(112 · '마' 안)
//        삽 = ✕ 곁(4.5m 안)이면 옆을 봐도 ✕를 팜 · 멀면 발밑을 안 파고 말해 줌 · ✕ 곁에서 받은 도움 = '다 왔어요'(G5) · 고른 곳에 닿은 줄 = '다 왔어요'(A #15) · 밤 = 할 일 줄과 단추가 다른 글 + 집 방향(G14)
//   바 · 페이지 오류 0
//   순간이동으로 그 자리만 봄(걸어서 보는 것은 town_first.cjs) · 실패 줄 = '  ✗ ' · 끝줄 PASS / FAIL n · --only=사(구간 첫 글자 · 여럿은 붙여서) = 그 구간만(홀로 서는 구간: 가 · 다 · 라 · 사 — 끝줄에 '일부만')
const { chromium } = require('./pw.cjs'), { walker } = require('./lib_walk.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots'), ONLY = typeof arg('only') === 'string' ? arg('only') : '', URL = process.env.TOWN_URL || ('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const J = o => JSON.stringify(o), DIR8 = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'], dirOf = (dx, dz) => DIR8[Math.round(((Math.atan2(dx, -dz) * 57.29578 + 360) % 360) / 45) % 8];   /* 지도 위 = 북(−z) — town_road.js·town_emerg.js와 같은 셈 */
(async () => {
  const fs = require('fs'); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const M = await import(require('path').resolve(__dirname, '../../v2/games/town_story.js'));
  const iOf = (c, s) => { const ch = M.CHAPTERS.find(q => q.id === c); return ch ? ch.steps.findIndex(q => q.id === s) : -1; }, iBed = iOf('p0', 'bed'), iFirst = iOf('p0', 'first'), iLost = iOf('a1_1', 'lost');
  ok(iBed >= 0 && iFirst >= 0 && iLost >= 0, '이야기 단계 자리(꽃 ' + iBed + ' · 카드 ' + iFirst + ' · 112 ' + iLost + ')');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async n => { if (!SHOTS) return; await W8(350); try { await p.screenshot({ path: SHOTS + '/' + n + '.jpg', type: 'jpeg', quality: 62 }); console.log('    📷 ' + SHOTS + '/' + n + '.jpg'); } catch (e) { console.log('    (사진 실패 ' + n + ')'); } };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story, null, { timeout: 240000 }); await W8(1500);
    const Wk = walker(p, {}), { S, closeDlg, shut, waitStep } = Wk;
    const closeP = async () => { for (let i = 0; i < 4; i++) { const had = await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); return !!b9; }); if (!had) break; await W8(500); } };
    const tp = (x, z, lx, lz) => ev(([x, z, lx, lz]) => { const M9 = SD2.map; M9.player.teleport([x, M9.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); if (lx != null) M9.player.lookAt([lx, lz]); }, [x, z, lx, lz]);
    const hint = () => ev(() => { const e = document.getElementById('hint'); return e && getComputedStyle(e).display !== 'none' ? (e.textContent || '').replace(/\s+/g, ' ').trim() : ''; });
    const goal = () => ev(() => { const g = document.getElementById('hudGoal'); return g && getComputedStyle(g).display !== 'none' ? (g.innerText || '').replace(/\s+/g, ' ').trim() : ''; });
    const say = () => ev(() => ['#hudBan', '#toast', '.twn-toast', '#hint', '#hudGoal'].map(s => { const e = document.querySelector(s); return e && getComputedStyle(e).display !== 'none' ? (e.innerText || '').replace(/\s+/g, ' ').trim() : ''; }).filter(Boolean).join(' ¦ '));
    const sayHas = async (re, ms = 3000) => { const t9 = Date.now(); for (;;) { const s = await say(); if (re.test(s)) return s; if (Date.now() - t9 > ms) return ''; await W8(150); } };
    const until = async (f, ms = 3000) => { const t9 = Date.now(); for (;;) { const v = await f(); if (v) return v; if (Date.now() - t9 > ms) return v; await W8(200); } };
    const leaf = re => ev(r9 => { const R = new RegExp(r9); return [...document.querySelectorAll('div,span,button')].filter(e => !e.children.length && R.test(e.textContent || '') && e.getBoundingClientRect().width > 1).map(e => e.textContent.trim()); }, re);
    const me = () => ev(() => { const q = SD2.map.player.get(); return [q.x, q.z]; });
    const sect = async (nm, f) => { if (ONLY && !ONLY.includes(nm[0])) return; console.log(nm); try { await f(); } catch (e) { ok(false, nm.split(' ')[0] + ' 구간이 멈춤: ' + String(e.message || e).replace(/\s+/g, ' ').slice(0, 200)); try { await ev(() => SD2.map.player.steer(null)); } catch (e2) { void e2; } } };
    await closeP(); await W8(3000);
    const me0 = await me(), PL = await ev(() => SM_TOWN.places().filter(q => q.door && q.name).map(q => ({ name: q.name, x: q.x, z: q.z, door: q.door }))), pl = nm => PL.find(q => q.name === nm) || PL.find(q => q.name.includes(nm));

    await sect('가 · 문 E(걸2 · 걸16 · 걸17)', async () => {
      const h0 = await hint(); ok(/쪽지 읽기/.test(h0), '처음 선 자리 E = 칠판이 먼저(「' + h0 + '」)');
      const DH = await ev(() => { const q = SD2.map.player.pos(); return SM_TOWN.doorH().map(h => ({ label: h.label || '', x: h.x, z: h.z, r: h.r, u: h.u, d0: h.d0, d: Math.hypot(h.x - q.x, h.z - q.z) })).sort((a, c) => a.d - c.d); });
      const mine = DH.find(h => /우리 집/.test(h.label)), pick = (mine ? [mine] : []).concat(DH.filter(h => h !== mine).slice(0, 3)); ok(!!mine, '우리 집 문 E 자리 있음(문 ' + DH.length + '곳 · 반지름 ' + (mine ? mine.r.toFixed(1) : '?') + 'm)');
      for (const h of pick) { let ux = h.d0[0] - h.x, uz = h.d0[1] - h.z, l = Math.hypot(ux, uz); if (l < 0.05) { ux = -h.u[0]; uz = -h.u[1]; l = Math.hypot(ux, uz) || 1; } ux /= l; uz /= l;
        await tp(h.x, h.z); await W8(350); for (let t = 0; t < 12; t++) { await ev(([a, c]) => SD2.map.player.steer(a, c, 4.2, true), [ux, uz]); await W8(180); } await ev(() => SD2.map.player.steer(null)); await W8(450);
        const q = await me(), d = Math.hypot(q[0] - h.x, q[1] - h.z), ht = await hint();
        ok(ht.includes(h.label.slice(0, 10)) || /들어가기/.test(ht), '문 쪽으로 끝까지 걸어 붙음(E 자리에서 ' + d.toFixed(2) + 'm · 반지름 ' + h.r.toFixed(1) + ') → 「' + ht.slice(0, 26) + '」'); }
      const RR = await ev(() => { const L = SD2.map.interact.list({ kind: 'game' }).filter(h => /들어가기/.test(h.label || '')); let mn = 9, big = 0; for (const h of L) { if (h.r < mn) mn = h.r; if (h.r >= 2.7) big++; } return { n: L.length, mn, big }; });
      ok(RR.n > 100 && RR.mn >= 2.2 - 1e-6 && RR.big / RR.n > 0.85, "'들어가기' E " + RR.n + '곳 — 가장 작은 반지름 ' + RR.mn.toFixed(1) + 'm · 벽까지 잰 것(≥ 2.7m) ' + Math.round(RR.big / RR.n * 100) + '%');
      const SH = await ev(() => { SM_TOWN.game().S.min = 11 * 60; const q = SM_TOWN.indoor.list().filter(q => q.kind === 'shop')[0]; return q ? [q.id, q.name] : null; });
      if (!SH) { ok(false, '들어갈 가게가 없음'); return; }
      const okE = await ev(id => SM_TOWN.indoor.enter(id), SH[0]); let inn = false; if (okE) { try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); inn = true; } catch (e) { void e; } } ok(inn, SH[1] + ' 안으로');
      if (inn) { await W8(400); const c = await ev(() => { const q = SD2.map.player.get(); const h = SD2.map.interact.list().filter(h => !h.off && /계산대/.test(h.label || '') && Math.hypot(h.x - q.x, h.z - q.z) < 12).sort((a, c9) => Math.hypot(a.x - q.x, a.z - q.z) - Math.hypot(c9.x - q.x, c9.z - q.z))[0]; return h ? { x: h.x, z: h.z, r: h.r } : null; });
        ok(!!c && c.r >= 2 - 1e-6, '계산대 E 반지름 ' + (c ? c.r.toFixed(1) : '?') + 'm(예전 1.3)');
        if (c) { await ev(([cx, cz, d]) => { const M9 = SD2.map, q = M9.player.get(); let dx = q.x - cx, dz = q.z - cz, l = Math.hypot(dx, dz) || 1; if (l < 0.3) { dx = 1; dz = 0; l = 1; } M9.player.teleport([cx + dx / l * d, q.y, cz + dz / l * d]); }, [c.x, c.z, 1.9]); await W8(450); const ht = await hint(); ok(/계산대/.test(ht), '계산대에서 1.9m → 「' + ht.slice(0, 24) + '」'); }
        await ev(() => SM_TOWN.indoor.exit()); await W8(1500); } });

    await sect('나 · 꽃 물 주기(G2 · G8 · 빈 물통)', async () => {
      await tp(me0[0], me0[1]); await closeP(); await W8(700); await ev(() => { const q = SD2.map.player.get(), h = SD2.map.interact.list().filter(h => !h.off && /쪽지 읽기/.test(h.label || '')).sort((a, c) => Math.hypot(a.x - q.x, a.z - q.z) - Math.hypot(c.x - q.x, c.z - q.z))[0]; if (h) SD2.map.player.lookAt([h.x, h.z]); }); await W8(300);   /* PATH-1A2 G10: 아이가 처음 선 꼴 = 칠판을 보고 섬 */   /* 아이가 실제로 지나는 차례 = 칠판 쪽지 E로 이야기를 엶(시험 손잡이로 바로 열면 첫 할 일 한 줄이 남아 ❗·남은 거리 셈이 쉼) */
      const hb = await hint(); if (/쪽지 읽기/.test(hb)) { await p.keyboard.press('KeyE'); await W8(1200); await closeDlg(); await shut(); await closeP(); }
      const st0 = await until(async () => (await ev(() => SM_TOWN.story().cur)) === 'p0', 4000); ok(!!st0, '칠판 쪽지 E → 이야기가 열림(「' + hb.slice(0, 16) + '」)'); if (!st0) { await ev(() => SM_TOWN.storyStart('p0')); await W8(900); }
      { const rt = await until(() => ev(() => { const q = SM_TOWN.story().step; return q && q.id === 'lib' && SM_TOWN.routeNow() ? 1 : 0; }), 6000); await W8(900);   /* PATH-1A2 G10(평가 A #3 '처음 설 때 빨간 띠가 등 뒤'): 첫 쪽지를 닫고 처음 켜진 선 = 선이 뻗은 쪽을 보고 섬 */
        const G = await ev(() => { const P = SM_TOWN.routePts() || [], q = SD2.map.player.get(); let far = null, acc = 0; for (let i = 1; i < P.length; i++) { acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); far = P[i]; if (acc >= 12) break; } if (!far) return null; const want = (Math.atan2(far[0] - q.x, -(far[1] - q.z)) * 57.29578 + 360) % 360; return { h: Math.round(q.h), want: Math.round(want), df: Math.round(Math.abs(((q.h - want + 540) % 360) - 180)) }; });
        ok(!!rt && !!G && G.df <= 45, '처음 켜진 빨간 선 = 갈 쪽을 보고 섬(몸 ' + (G ? G.h : '?') + '° · 선 첫 12m ' + (G ? G.want : '?') + '° · 차 ' + (G ? G.df : '?') + '° ≤ 45)'); await shot('path1_first_line'); }
      await closeDlg(); await ev(i => SM_TOWN.storyAt('p0', i), iBed); await W8(1500); await closeDlg(); await shut();
      const T = await ev(() => { const t = SM_TOWN.storyTarget(); return t && { x: t.x, z: t.z, name: t.name }; }), s0 = await S(); ok(s0.id === 'bed' && !!T, '꽃 단계(' + s0.id + ' · 목표 ' + (T ? T.name : '없음') + ')'); if (!T) return;
      ok(!s0.route, '꽃 물 주기 = 빨간 선 없이 ❗만');
      for (const d of [30, 6]) { await tp(T.x + d, T.z + 0.5, T.x, T.z); await W8(900); const g = await ev(() => SM_TOWN.goalSp()); const sc = g && g.scr;
        ok(!!g && g.vis && (!sc || (sc[0] >= 40 && sc[0] <= 1326 && sc[1] >= 60 && sc[1] <= 640)), d + 'm 앞 = 노란 ❗ 보임(화면 ' + (sc ? sc.join(',') : '셈 없음') + ' · 조임 ' + (g ? g.cl : '?') + ')'); if (d === 30) await shot('path1_goal'); }
      await tp(T.x + 2.6, T.z + 0.4, T.x - 30, T.z + 25); await W8(700); if (await ev(() => SM_TOWN.tools.info().cur) !== 'can') { await p.keyboard.press('Digit1'); await W8(500); }
      const i0 = await ev(() => { const I = SM_TOWN.tools.info(); return { cur: I.cur, k: (I.aim && I.aim.k) || '', lock: (I.aim && I.aim.lock) || '', d: I.aim ? Math.hypot(I.aim.x - SM_TOWN.storyTarget().x, I.aim.z - SM_TOWN.storyTarget().z) : 99 }; }); ok(i0.cur === 'can' && i0.d < 1.2, '곁 2.6m · 꽃을 등지고 서도 고리가 마른 꽃에 붙음(' + i0.cur + ' · 고리에서 꽃까지 ' + i0.d.toFixed(2) + 'm · ' + (i0.lock || i0.k || '이름 없음') + ')');
      await p.keyboard.down('KeyF'); await W8(120); await p.keyboard.up('KeyF'); const s1 = await waitStep(q => q.id !== 'bed', 8000); ok(s1.id === 'first', 'F 톡 한 번(0.12초) → 꽃이 살아나 넘어감(' + s1.id + ')');
      await W8(2500); await shut(); await ev(i => SM_TOWN.storyAt('p0', i), iBed); await W8(1500); await closeDlg(); await shut(); await tp(T.x + 2.6, T.z + 0.4, T.x, T.z); await W8(500); if (await ev(() => SM_TOWN.tools.info().cur) !== 'can') { await p.keyboard.press('Digit1'); await W8(500); }
      await ev(() => SM_TOWN.tools.tank(0)); await W8(300); await p.keyboard.down('KeyF'); await W8(500); await p.keyboard.up('KeyF');
      const t1 = await sayHas(/물이 다 떨어졌어요 — .+에서 E로 채워요/, 4000); ok(!!t1, '빈 물통 = 채울 곳 이름을 말함(「' + ((t1.match(/💧[^¦]*/) || [''])[0]).trim().slice(0, 40) + '」)');
      const R9 = await until(() => ev(() => SM_TOWN.routeNow()), 3000); ok(!!R9, '빈 물통 = 채울 곳으로 길 안내(' + (R9 ? R9.len + 'm' : '없음') + ')'); if (!R9) return;
      const near = await ev(to => SD2.map.interact.list({ kind: 'game' }).filter(h => /물 채우기/.test(h.label || '')).map(h => ({ x: h.x, z: h.z, label: h.label, d: Math.hypot(h.x - to[0], h.z - to[1]) })).sort((a, c) => a.d - c.d)[0] || null, R9.to);
      ok(!!near && near.d < 6, '안내 끝 = 물 채우기 E 자리(' + (near ? near.label + ' · ' + near.d.toFixed(1) + 'm' : '없음') + ')'); if (!near) return;
      await tp(near.x + 1.2, near.z + 0.6, near.x, near.z); await W8(900); const ht = await hint(); ok(/물 채우기/.test(ht), '채울 곳 곁 → 「' + ht.slice(0, 26) + '」');
      const ov = await ev(() => { const a = document.getElementById('hint'), b9 = document.querySelector('.twn-tools'); if (!a || !b9) return null; const A = a.getBoundingClientRect(), B = b9.getBoundingClientRect(), vis = (e, r) => getComputedStyle(e).display !== 'none' && r.width > 1 && r.height > 1; return { a: [A.left, A.top, A.right, A.bottom].map(Math.round), b: [B.left, B.top, B.right, B.bottom].map(Math.round), va: vis(a, A), vb: vis(b9, B), hit: A.left < B.right && A.right > B.left && A.top < B.bottom && A.bottom > B.top, keys: document.body.classList.contains('h-keys') }; });
      ok(!!ov && ov.va && ov.vb && !ov.hit, 'E 글이 도구 띠에 안 깔림(E 글 ' + (ov ? ov.a.join(',') : '?') + ' · 띠 ' + (ov ? ov.b.join(',') : '?') + ' · 조작 줄 ' + (ov && ov.keys ? '펴짐' : '접힘') + ')'); await shot('path1_fill');
      await p.keyboard.press('KeyE'); const full = await until(() => ev(() => SM_TOWN.tools.info().tank > 1 && !SM_TOWN.routeNow()), 5000); ok(!!full, 'E → 물통이 참(' + (await ev(() => SM_TOWN.tools.info().tank)) + ') · 채울 곳 안내 꺼짐');
      await ev(() => { const H = SM_TOWN.game().S.hud; if (H) H.bike = 1; }); await p.keyboard.press('KeyB'); await W8(900); await p.keyboard.press('KeyF'); const tb = await sayHas(/자전거에서 내려서 써요/, 2500); ok(!!tb, '자전거 탄 채 F = 「내려서 써요 (B)」'); await p.keyboard.press('KeyB'); await W8(900);
      await p.keyboard.press('KeyU'); await W8(700); await p.keyboard.press('KeyF'); const tu = await sayHas(/우산을 접고 써요/, 2500); ok(!!tu, '우산 편 채 F = 「접고 써요 (U)」'); await p.keyboard.press('KeyU'); await W8(400); });

    await sect('다 · 빨간 선(찻길 가운데 X · 거리 한 기준 · 헤1 · 걸29)', async () => {
      await shut(); await closeP();   /* 칠판 쪽지를 읽기 전(첫 할 일 한 줄 동안)에는 위 줄·도착 셈이 쉬므로 이야기를 연 뒤(꽃 단계)에 봄 */
      for (const nm of ['놀이터', '우체국']) { const d = pl(nm); if (!d) { ok(false, nm + ' 자리 없음'); continue; }
        await tp(me0[0], me0[1], d.door[0], d.door[1]); await W8(500); const w0 = await ev(([x, z]) => SM_TOWN.wayM(x, z), d.door);
        const okR = await ev(([x, z, nm]) => SM_TOWN.showRoute({ icon: '📍', name: nm, door: [x, z] }), [d.door[0], d.door[1], d.name]); await W8(700); await closeP();
        const R = await ev(() => { const D = SM_TOWN.routeDraw() || [], cnt = { side: 0, centre: 0, lane: 0, off: 0 }; for (const q of D) { const r = SM_TOWN.roadOff(q[0], q[1]); if (!r) { cnt.off++; continue; } const ped = r.hw - (r.big ? 1.65 : 0.95), lane = r.hw - (r.big ? 2.2 : 1.4); if (Math.abs(r.d - ped) < 0.6) cnt.side++; else if (r.d < 0.6) cnt.centre++; else if (r.d < lane) cnt.lane++; else cnt.side++; } return { rn: SM_TOWN.routeNow(), cnt, trk: SM_TOWN.trkDist(), D }; });
        ok(!!okR && !!R.rn && R.D.length > 10, nm + '까지 빨간 선(' + (R.rn ? R.rn.len : '?') + 'm · 그린 점 ' + R.D.length + ')');
        { const HY = await ev(D => { const M9 = SD2.map; let n = 0, lo = 0, mn = 9; for (const q of D) { if (q[2] == null) continue; const r = SM_TOWN.roadOff(q[0], q[1]); if (!r || r.d > r.hw - 0.3) continue; const t = SM_TOWN.ground(q[0], q[1]), g = M9.q.groundAt(q[0], q[1], t + 3), w = Number.isFinite(g) && g > t - 1 && g < t + 3 ? g : t, d = q[2] - w; n++; if (d < 0.15) lo++; if (d < mn) mn = d; } return { n, lo, mn }; }, R.D);   /* PATH-1A2 G16(평가 A #4 · B 걸8 '빨간 찻길 위에서 안내선이 안 보임'): 띠 점이 걷는 면 + 15cm 위(띠는 6cm 더 위) — 인도 그림(14cm)·연석(20cm)에 안 묻힘 · 예전 + 11cm */
          ok(HY.n > 10 && HY.lo / HY.n <= 0.1, '길 위 띠 점 ' + HY.n + '곳 = 걷는 면보다 15cm 넘게 위(인도 그림 14cm에 안 묻힘 · 낮은 점 ' + HY.lo + ' · 가장 낮은 +' + HY.mn.toFixed(2) + 'm)'); }
        const on = R.cnt.side + R.cnt.centre + R.cnt.lane; ok(on > 10 && R.cnt.centre / on <= 0.12 && R.cnt.side / on >= 0.7, '길 위 점 ' + on + ' — 사람 줄 ' + R.cnt.side + ' · 찻길 가운데 ' + R.cnt.centre + ' · 차로 ' + R.cnt.lane + '(가운데 ≤ 12% · 사람 줄 ≥ 70%)');
        ok(Math.abs(R.trk - w0) <= 5, '힌트 글 거리 ' + Math.round(w0) + 'm = 선 거리 ' + Math.round(R.trk) + 'm(차 ≤ 5)'); const g0 = await goal(); ok(new RegExp(Math.round(R.trk / 10) + '\\d? ?m').test(g0) || /\d+ ?m/.test(g0), '위 줄에 거리(「' + g0.slice(0, 40) + '」)');
        if (nm === '우체국') await shot('path1_line');
        const D = R.D; let prev = 1e9, up = 0, mx = 0, n = 0; for (let i = 0; i < D.length; i += 5) { const q = D[i], nx = D[Math.min(D.length - 1, i + 6)]; await tp(q[0], q[1], nx[0], nx[1]); await W8(300); const v = await ev(() => (SM_TOWN.routeNow() ? SM_TOWN.trkDist() : -1)); if (v < 0) break; n++; if (v > prev + 1.5) { up++; mx = Math.max(mx, v - prev); } prev = v; }
        ok(n > 5 && up === 0, '그린 선을 따라 ' + n + '곳 — 남은 거리가 커진 적 ' + up + '번' + (up ? '(가장 큰 ' + mx.toFixed(1) + 'm)' : '') + ' · 끝 ' + Math.round(prev) + 'm');
        await tp(d.door[0], d.door[1]); const gone = await until(() => ev(() => !SM_TOWN.routeNow()), 3000); ok(!!gone, nm + ' 문 앞 = 선이 꺼짐(「' + (await goal()).slice(0, 30) + '」)'); await closeP(); await ev(() => SM_TOWN.pathOff()); }
      const far = pl('놀이터') || PL[0];
      await tp(me0[0], me0[1]); await W8(500); await ev(([x, z, ax, az]) => SM_TOWN.showRoute({ icon: '🌱', name: '밭 일꾼', door: [x, z], alts: [[ax, az]], arrive: '🎉 다 왔어요 — 일꾼 곁' }), [far.door[0], far.door[1], me0[0] + 3, me0[1] + 1]);
      { const gone = await until(() => ev(() => !SM_TOWN.routeNow()), 3000), g = await goal(); ok(!!gone && /다 왔어요/.test(g), '같은 갈래의 다른 자리(3m 곁)에 닿음 = 도착(「' + g.slice(0, 30) + '」)'); } await W8(2700);
      const n0 = await ev(() => SM_TOWN.game().S.bag.potato || 0); await ev(([x, z, n0]) => SM_TOWN.showRoute({ icon: '🌱', name: '감자 구하는 곳', door: [x, z], item: 'potato', n0 }), [far.door[0], far.door[1], n0]); await W8(1200);
      const kept = await ev(() => !!SM_TOWN.routeNow()); await ev(n => { SM_TOWN.game().S.bag.potato = n + 1; }, n0); const gone2 = await until(() => ev(() => !SM_TOWN.routeNow()), 3000);
      ok(kept && !!gone2, "'구하는 곳' 안내 = 물건이 가방에 들어오면 끝(얻기 전 선 " + (kept ? '있음' : '없음') + ' → 얻은 뒤 ' + (gone2 ? '꺼짐' : '그대로') + ')'); await ev(n => { const B = SM_TOWN.game().S.bag; if (n) B.potato = n; else delete B.potato; SM_TOWN.pathOff(); }, n0); });

    await sect('라 · 손 든 일꾼 칩(막3)', async () => {
      await closeP(); const rq = await ev(async () => { const R = SM_TOWN.road(), WK = SM_TOWN.workers(), M9 = SD2.map; for (let i = 0; i < WK.length; i++) { const w = WK[i]; if (!w[4] || w[4] === 'stall') continue; const x = w[1] + 22, z = w[2] + 6; M9.player.teleport([x, M9.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); await new Promise(r => setTimeout(r, 250)); if (R.dbg.help('pick', i)) return { i, w: [w[1], w[2]] }; } return null; });
      ok(!!rq, '일꾼이 손을 듦(부탁)'); if (!rq) return;
      const chk = async tag => { const q = await me(), d = Math.hypot(rq.w[0] - q[0], rq.w[1] - q[1]), want = dirOf(rq.w[0] - q[0], rq.w[1] - q[1]); let t = '', m = null; for (let i = 0; i < 14 && !m; i++) { await closeP(); t = (await leaf('손을 들었어요'))[0] || ''; m = t.match(/— (\S+)쪽 (\d+)m · 가서 E/); if (m && (m[1] !== want || Math.abs(+m[2] - d) > 5)) m = null; if (!m) await W8(300); }
        ok(!!m, tag + ' 칩 = 방위 + 거리(실제 ' + want + '쪽 ' + Math.round(d) + 'm → 「' + t.slice(0, 44) + '」)'); };
      await W8(1000); await chk('부탁 곁'); await shot('path1_req'); await tp(rq.w[0] - 9, rq.w[1] - 30, rq.w[0], rq.w[1]); await chk('자리를 옮긴 뒤'); });

    await sect('마 · 도착 = 그 곳에 닿음(G1)', async () => {
      await shut(); await ev(i => SM_TOWN.storyAt('p0', i), iFirst); let n = 0; for (; n < 40 && !(await ev(() => !!document.querySelector('.twn-p [data-card]'))); n++) await W8(300);
      const k = await ev(nm => { const L9 = [...document.querySelectorAll('.twn-p [data-card]')], b9 = L9.find(q => q.textContent.includes(nm)) || L9[0]; if (b9) b9.click(); return b9 ? b9.textContent : ''; }, '놀이터'); await W8(300); await ev(() => { const b9 = document.querySelector('.twn-p [data-card]'); if (b9) b9.click(); }); await W8(1800);
      let s = await S(); ok(s.id === 'show', '카드 둘 → 데려가기(' + s.id + ' · 고른 곳 ' + k.trim() + ')'); if (s.id !== 'show') return; await W8(700);
      const T = await ev(() => { const t = SM_TOWN.storyTarget(); return t && { x: t.x, z: t.z, name: t.name, door: t.door || null }; }), P = T && (PL.find(q => q.name === T.name) || { x: T.x, z: T.z, door: T.door || [T.x, T.z] }); if (!T) { ok(false, '데려갈 곳 목표 없음'); return; }
      const C = await ev(([cx, cz, tx, tz, dx, dz]) => { const M9 = SD2.map; for (let r = 2; r <= 30; r += 2) for (let a = 0; a < 16; a++) { const x = cx + Math.cos(a * 0.3927) * r, z = cz + Math.sin(a * 0.3927) * r, y = M9.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05; if (M9.q.blocked(x, z, y)) continue; const dt = Math.hypot(x - tx, z - tz), dd = Math.hypot(x - dx, z - dz); if (dt >= 17.5 && dd >= 17.5) return { x, z, r, dt, dd }; } return null; }, [P.x, P.z, T.x, T.z, (P.door || [T.x, T.z])[0], (P.door || [T.x, T.z])[1]]);
      ok(!!C, T.name + ' 뒤쪽 자리(목표에서 ' + (C ? C.dt.toFixed(1) : '?') + 'm · 문에서 ' + (C ? C.dd.toFixed(1) : '?') + 'm — 예전 도착 반지름 16m 밖)'); if (!C) return;
      await tp(C.x, C.z, P.x, P.z); s = await waitStep(q => q.done.includes('p0'), 8000); ok(s.done.includes('p0'), T.name + '에 닿음(문에서 먼 쪽) → 데려가기 끝 · 프롤로그 끝'); await shot('path1_arrive');
      s = await waitStep(q => q.cur === 'a1_1', 20000); await W8(600); await closeDlg(); await shut(); await ev(i => SM_TOWN.storyAt('a1_1', i), iLost); await W8(1200);
      let I = null; for (let i = 0; i < 80; i++) { I = await ev(() => { const E = SM_TOWN.emerg && SM_TOWN.emerg(); return E ? E.info() : null; }); if (I && I.ev) break; if (await ev(() => !!document.querySelector('.twn-dlg'))) await closeDlg(); await W8(400); }
      const e0 = I && I.ev; ok(!!(e0 && e0.k === 'lost'), '112 사건이 생김(' + (e0 ? e0.k + ' ' + e0.st : '없음') + ')'); if (!e0) return;
      await tp(e0.x + 2, e0.z + 2, e0.x, e0.z); const cop = await until(() => ev(() => { const v = SM_TOWN.emerg().info().ev; return v && v.st === 'cop'; }), 8000); ok(!!cop, '사건 자리 → 경찰관·새 친구');
      const hot = async re => { for (let i = 0; i < 20; i++) { const h = await ev(r9 => { const H = SD2.map.interact.list().find(q => !q.off && new RegExp(r9).test(q.label || '')); return H ? [H.x, H.z] : null; }, re); if (h) return h; await W8(300); } return null; };
      const hc = await hot('경찰관과 이야기하기');
      if (hc) { const CD = await ev(([x, z]) => SD2.map.interact.list().filter(h => /알아보기|About:/.test(h.label || '') && Math.hypot(h.x - x, h.z - z) < 4.4).map(h => ({ off: !!h.off, d: +Math.hypot(h.x - x, h.z - z).toFixed(2) })).sort((a, c) => a.d - c.d), hc);   /* PATH-1A2(PATH-1B가 넘김): 경찰관 1.9m 곁 「알아보기 — 작은 도서관」이 더 가까워 E가 장소 카드를 열던 것 — 사건 지점 반지름 두 배(4.4m) 안의 알아보기 지점은 그동안 꺼 둠(자리는 판마다 달라 곁에 없을 수도 있음) */
        await tp(hc[0] + 1.15, hc[1], hc[0], hc[1]); await W8(600); const hE = await ev(() => { const h9 = SD2.hotNow && SD2.hotNow(); return h9 ? h9.label || '' : ''; });
        ok(/경찰관/.test(hE) && CD.every(h => h.off), '경찰관 동쪽 1.15m = 화면의 E 글이 경찰관(「' + hE.slice(0, 22) + '」) · 곁 4.4m 안 알아보기 지점 ' + (CD.length ? CD.length + '곳 모두 꺼짐(가장 가까운 ' + CD[0].d + 'm)' : '없음(이번 자리)')); }
      if (hc) { await tp(hc[0] + 0.7, hc[1] + 0.3, hc[0], hc[1]); await W8(600); await p.keyboard.press('KeyE'); await W8(900); await closeDlg(); }
      const hk = await hot('새 친구에게 물어보기'); if (hk) { await tp(hk[0] + 0.6, hk[1] + 0.3, hk[0], hk[1]); await W8(600); await p.keyboard.press('KeyE'); await W8(900); }
      for (n = 0; n < 20 && !(await ev(() => !!document.querySelector('.twn-p [data-q]'))); n++) await W8(300); for (const q of ['tel', 'near', 'dir']) { await ev(q9 => { const b9 = document.querySelector('.twn-p [data-q="' + q9 + '"]'); if (b9) b9.click(); }, q); await W8(350); }
      const right = await ev(() => { const v = SM_TOWN.emerg().info().ev; return v && v.opts ? v.opts.indexOf('home') : -1; }); if (right >= 0) await ev(i9 => { const b9 = document.querySelector('.twn-p [data-o="' + i9 + '"]'); if (b9) b9.click(); }, right);
      const sw = await until(() => ev(() => { const v = SM_TOWN.emerg().info().ev; return v && v.st === 'sw'; }), 5000); ok(!!sw, '묻기 → 지도에서 집 → 같이 걷기'); if (!sw) return;
      const H = await ev(() => { const t = SM_TOWN.storyTarget(); return t && { x: t.x, z: t.z, name: t.name }; }); if (!H) { ok(false, '같이 걷기 목표 없음'); return; }
      const chk = async tag => { const q = await me(), d = Math.hypot(H.x - q[0], H.z - q[1]); let g = '', m = null; for (let i = 0; i < 12 && !m; i++) { g = await ev(() => SM_TOWN.emerg().info().goal || ''); m = g.match(/\((\S+)쪽 · (\d+)m\)/); if (m && Math.abs(+m[2] - d) > 8) m = null; if (!m) await W8(300); } ok(!!m, tag + ' 위 줄 = 방위 + 남은 거리(실제 ' + Math.round(d) + 'm → 「' + g.slice(0, 48) + '」)'); return m; };
      await chk('같이 걷기'); await shot('path1_walk'); await tp(H.x + 38, H.z + 12, H.x, H.z); await W8(1200); await chk('40m 앞');
      await tp(H.x + 7, H.z + 3, H.x, H.z); s = await waitStep(q => q.done.includes('a1_1'), 10000); ok(s.done.includes('a1_1'), H.name + ' 10m 안 → 새 친구를 데려다줌 · 1-1 끝');
      { const on9 = await until(() => ev(() => !SM_TOWN.emerg().info().ev && SD2.map.interact.list().filter(h => /알아보기|About:/.test(h.label || '') && h.off).length === 0), 20000); ok(!!on9, '사건이 끝남 = 꺼 둔 알아보기 지점이 모두 다시 켜짐'); } });

    await sect('사 · 남은 것(PATH-1A2) — 112 E · 삽(G5) · 고른 곳(A #15) · 밤(G14)', async () => {
      await shut(); await closeP(); await ev(() => { SM_TOWN.pathOff(); SM_TOWN.game().S.min = 11 * 60; });
      { /* 112 E(PATH-1B가 넘김): 경찰관 1.9m 곁에 「알아보기 — 작은 도서관」 지점이 있는 자리를 다시 일으킴 — 처음 선 자리(우리 집 앞)에서 사건이 열리면 도서관 앞에 섬 · '마'의 자리(놀이터 뒤)는 곁에 알아보기 지점이 없음 */
        const lostAt = async f => { await ev(() => { const E = SM_TOWN.emerg(); if (E && E.info().ev && E.abort) E.abort(); SM_TOWN.storyOff(); }); await W8(500); await tp(f[0], f[1]); await W8(300); await ev(i => SM_TOWN.storyAt('a1_1', i), iLost); await W8(1200);
          let I = null; for (let i = 0; i < 60; i++) { I = await ev(() => SM_TOWN.emerg().info()); if (I && I.ev) break; if (await ev(() => !!document.querySelector('.twn-dlg'))) await closeDlg(); await W8(400); } const e0 = I && I.ev; if (!e0) return null;
          await tp(e0.x + 2, e0.z + 2, e0.x, e0.z); await until(() => ev(() => { const v = SM_TOWN.emerg().info().ev; return v && v.st === 'cop'; }), 8000);
          return until(() => ev(() => { const L9 = SD2.map.interact.list(), H = L9.find(q => !q.off && /경찰관과 이야기하기/.test(q.label || '')); if (!H) return null; return { x: H.x, z: H.z, r: H.r, C: L9.filter(h => /알아보기|About:/.test(h.label || '') && Math.hypot(h.x - H.x, h.z - H.z) < H.r * 2).map(h => ({ off: !!h.off, d: +Math.hypot(h.x - H.x, h.z - H.z).toFixed(2), x: h.x, z: h.z, nm: (h.label || '').replace(/^.*— /, '') })).sort((a, c) => a.d - c.d) }; }), 6000); };
        const lb = pl('작은 도서관') || pl('도서관'), froms = [me0].concat(lb ? [[lb.door[0] + 70, lb.door[1]], [lb.door[0], lb.door[1] + 70], [lb.door[0] - 60, lb.door[1]], [lb.door[0], lb.door[1] - 60]] : []); let K = null; for (const f of froms) { K = await lostAt(f); if (K && K.C.length) break; }
        if (K && K.C.length) { const hot9 = () => ev(() => { const h9 = SD2.hotNow && SD2.hotNow(); return h9 ? h9.label || '' : ''; }), c9 = K.C[0];
          await tp(K.x + 1.15, K.z, K.x, K.z); await W8(600); const hE = await hot9(), hS = await hint(); await shot('path1_cop'); await tp(c9.x, c9.z, K.x, K.z); await W8(600); const hC = await hot9();
          ok(/경찰관/.test(hE) && /경찰관/.test(hS) && /경찰관/.test(hC) && K.C.every(h => h.off), '경찰관에서 ' + c9.d + 'm 곁에 「알아보기 — ' + c9.nm + '」 지점이 있는 자리 — 경찰관 동쪽 1.15m 화면 글 「' + hS.slice(0, 20) + '」 · 알아보기 지점 바로 위에서도 E = 「' + hC.slice(0, 14) + '」 · 곁 알아보기 ' + K.C.length + '곳 꺼짐');
          await ev(() => { const E = SM_TOWN.emerg(); if (E && E.info().ev && E.abort) E.abort(); SM_TOWN.storyOff(); }); const on9 = await until(() => ev(() => !SM_TOWN.emerg().info().ev && SD2.map.interact.list().filter(h => /알아보기|About:/.test(h.label || '') && h.off).length === 0), 8000); await tp(c9.x, c9.z, K.x, K.z); await W8(600); const hB = await hot9();
          ok(!!on9 && /알아보기/.test(hB), '사건이 끝남 = 그 알아보기 지점이 다시 켜짐(같은 자리 E = 「' + hB.slice(0, 18) + '」)'); }
        else ok(false, '곁에 알아보기 지점이 있는 112 자리를 못 만듦(' + (K ? '경찰관 ' + K.x.toFixed(0) + ', ' + K.z.toFixed(0) + ' · 곁 0곳' : '사건 없음') + ')');
        await ev(() => { const E = SM_TOWN.emerg(); if (E && E.info().ev && E.abort) E.abort(); SM_TOWN.storyOff(); SM_TOWN.pathOff(); }); await W8(600); await closeDlg(); await shut(); await closeP(); }
      await ev(i => SM_TOWN.storyAt('a1_1', i), iOf('a1_1', 'tmap')); await W8(1800); await closeDlg(); await shut(); await closeP();
      const c = await until(() => ev(() => { const q = SM_TOWN.treasure().info().cur; return q ? { x: q.x, z: q.z } : null; }), 8000), s0 = await S(); ok(!!c && s0.id === 'tmap', '지도 조각 단계(' + s0.id + ' · ✕ ' + (c ? c.x.toFixed(0) + ', ' + c.z.toFixed(0) : '없음') + ')'); if (!c) return;
      const spot = R => ev(([cx, cz, R]) => { const M9 = SD2.map; for (let a = 0; a < 16; a++) { const x = cx + Math.cos(a * 0.3927) * R, z = cz + Math.sin(a * 0.3927) * R, y = M9.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05; if (!M9.q.blocked(x, z, y)) return [x, z]; } return null; }, [c.x, c.z, R]);
      const side = async R => { const at = await spot(R); if (!at) return null; const ux = at[0] - c.x, uz = at[1] - c.z; await tp(at[0], at[1], at[0] + uz * 5 + ux * 2, at[1] - ux * 5 + uz * 2); await W8(900); if (await ev(() => SM_TOWN.tools.info().cur) !== 'shovel') { await p.keyboard.press('Digit2'); await W8(600); } return at; };   /* ✕를 옆·뒤에 두고 섬(평가 A #16이 선 꼴 — 예전엔 삽이 내 발밑을 팜) */
      const holes = () => ev(() => { const h = SM_TOWN.tools.info().holes; return Array.isArray(h) ? h.length : (h | 0); }), toast = () => ev(() => [...document.querySelectorAll('#toast, .twn-toast')].filter(e => getComputedStyle(e).display !== 'none').map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ¦ '));
      const h0 = await holes(); if (await side(6.5)) { await p.keyboard.press('KeyF'); const t1 = await sayHas(/흙더미 바로 곁에 가서 파요/, 3500), s1 = await S(), h1 = await holes(); ok(!!t1 && s1.id === 'tmap' && h1 === h0, '✕에서 6.5m · 옆을 보고 삽 F = 「흙더미 바로 곁에 가서 파요」 · 발밑을 안 팜(구덩이 ' + h0 + ' → ' + h1 + ')'); await W8(2600); } else ok(false, '✕ 6.5m 곁에 설 자리가 없음');
      { const a2 = await spot(5.2); if (a2) { await tp(a2[0], a2[1], c.x, c.z); await W8(600); let seen = ''; for (const t9 of [39, 79, 119]) { await closeP(); await ev(t => { SM_TOWN.story().S.t = t; }, t9); for (let i = 0; i < 12; i++) { await W8(300); if (i % 4 === 3) await closeP();   /* 지도 조각 창은 알림이 다 읽힌 뒤 늦게 열림 — 창이 떠 있으면 이야기 시계(도움)가 섬 */ const t = await toast(); if (t && !seen.includes(t)) seen += ' / ' + t; } await W8(2600); }   /* 도움 세 단계(40 · 80 · 120초) — 셋째 = 가는 길 보여 주기 */
          ok(/다 왔어요 — .*바로 곁이에요/.test(seen) && !/빨간 선을 따라가요|쪽 약 \d+ ?m/.test(seen), '✕ 5m 곁에서 받은 도움(둘째·셋째) = 「' + ((seen.match(/🧭[^/¦]*/) || ['(없음) ' + seen.slice(-60)])[0]).trim().slice(0, 44) + '」(없는 선·길 따라 잰 먼 거리를 말하지 않음)'); } else ok(false, '✕ 5m 곁에 설 자리가 없음'); }
      { const d = pl('소방서') || pl('우체국'), trk = () => ev(() => { const e = document.querySelector('.twn-trk'); return e && getComputedStyle(e).display !== 'none' && e.classList.contains('on') ? (e.innerText || '').replace(/\s+/g, ' ').trim() : ''; });
        if (d) { await tp(d.door[0] + 40, d.door[1] + 30, d.door[0], d.door[1]); await W8(400); await ev(([x, z, nm]) => SM_TOWN.showRoute({ icon: '📍', name: nm, door: [x, z] }), [d.door[0], d.door[1], d.name]); await W8(1200); await closeP(); const r0 = await trk();
          await tp(d.door[0] + 1.5, d.door[1] + 1.5, d.door[0], d.door[1]); await W8(700); let bad = '', here = ''; for (let i = 0; i < 18; i++) {   /* 줄은 0.5초 칸마다 다시 씀 · 닿은 줄은 2 ~ 3초 뒤 사라짐 */ await W8(150); const t = await trk(); if (!t.includes(d.name)) continue; if (/다 왔어요/.test(t)) here = t; else if (/쪽/.test(t.replace(d.name, ''))) bad = t; }
          ok(r0.includes(d.name) && /쪽/.test(r0) && !!here && !bad, '고른 곳(' + d.name + ') — 멀리서 줄 「' + r0.slice(0, 30) + '」 → 문 2m 앞 「' + (here || bad || '(줄 없음)').slice(0, 30) + '」(방위 말 대신 다 왔어요)'); await W8(2700); await closeP(); await ev(() => SM_TOWN.pathOff()); } else ok(false, '고를 곳(소방서·우체국) 자리 없음'); }
      if (await side(4.2)) { await p.keyboard.press('KeyF'); let got = ''; for (let i = 0; i < 30 && !got; i++) { await W8(300); const pn = await ev(() => { const e = document.querySelector('.twn-p'); return e ? (e.innerText || '').replace(/\s+/g, ' ') : ''; }), sy = await say(), s3 = await S(); if (/보물 상자를 찾았어요/.test(pn + ' ' + sy)) got = '보물 상자를 찾았어요'; else if (s3.id !== 'tmap') got = '다음 단계 ' + s3.id; }
        ok(!!got, '✕에서 4.2m · 옆을 보고 삽 F = 한 발 다가가 ✕를 팜(' + (got || '안 파짐') + ')'); await shot('path1_dig'); await W8(600); await closeP(); await shut(); } else ok(false, '✕ 4.2m 곁에 설 자리가 없음');
      await ev(() => { SM_TOWN.pathOff(); SM_TOWN.storyOff(); const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; if (!(G.waitMin && G.waitMin(18 * 60 + 20))) G.S.min = 18 * 60 + 20; }); await W8(700); await closeP(); await shut();   /* G14: 해 진 뒤(18:20) 낮 일 장(목장의 아침)을 엶 — am = 아침 기다리기도 시험 */
      await ev(() => { const D = SM_TOWN.story().S.done; if (D && !Array.isArray(D)) { D.p0 = D.p0 || 1; D.a1_1 = D.a1_1 || 1; } return SM_TOWN.storyStart('a1_3'); });   /* storyAt 손잡이는 아침 기다리기를 건너뜀 → 아이처럼 장을 엶(앞 장 둘은 한 것으로) */ for (let i = 0; i < 30 && !(await ev(() => !!document.querySelector('.twn-dlg'))); i++) await W8(300); await W8(600); await closeDlg(); await W8(2500); await closeDlg();
      const N = await until(() => ev(() => { const q = SM_TOWN.story(), v = q.step && q.step.v; if (!(v && v.amW)) return null; const tx = s9 => { const e = document.querySelector(s9); return e && getComputedStyle(e).display !== 'none' ? (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim() : ''; }, t = SM_TOWN.storyTarget(); return { task: tx('.twn-task'), wait: tx('.twn-waitb'), tn: t ? t.name : '' }; }), 9000);
      ok(!!N && /자고 아침에 목장으로 — (우리 집, \S+쪽|다 왔어요)/.test(N.task) && /자고 내일 아침에 하기/.test(N.wait) && !N.task.includes(N.wait) && N.tn === '우리 집', '밤(18:20)에 열린 낮 일 장 = 할 일 줄 「' + (N ? N.task.slice(0, 40) : '아침 기다리기 아님') + '」 · 단추 「' + (N ? N.wait : '') + '」(다른 글) · 목표 자리 ' + (N ? N.tn : '?') + (N ? '' : ' · ' + await ev(() => { const q = SM_TOWN.story(), st = q.step || {}; return '장 ' + q.cur + ' · 단계 ' + st.id + ' · v ' + JSON.stringify(st.v || {}) + ' · ' + SM_TOWN.game().S.min + '분'; }))); await shot('path1_night');
      await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.min = 11 * 60; }); });

    console.log('바 · 페이지 오류 ' + errs.length); for (const e of errs.slice(0, 6)) console.log('   ' + e); if (errs.length) fails++;
  } catch (e) { ok(false, '하네스가 멈춤: ' + String(e.message || e).replace(/\s+/g, ' ').slice(0, 300)); } finally { await b.close(); }
  console.log((fails ? 'FAIL ' + fails : 'PASS') + (ONLY ? ' (일부만 — ' + ONLY + ')' : '')); process.exit(fails ? 1 : 0);
})();
