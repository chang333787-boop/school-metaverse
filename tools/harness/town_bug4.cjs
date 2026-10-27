// 🐞 10-27 사용자 버그 넷 시험(BUG4): node tools/harness/town_bug4.cjs [마을=ourtown] [포트=8002] [--only=1,2,3,4] [--shots=폴더]
//   ① 여권 이름(BUG4-1 '여권 도장에 이상한 영어 · pub_gaf 뭔데'): 모든 곳 도장 → 여권 창 · 공공시설 장소 카드 · 바로 가기(J) · 장소 찾기(F) · 하루 마무리 '새 여권 도장' 줄 · 도장 알림
//      화면 글에 /pub_|gaf_|gfill_|글자_두자리수/ 꼴 0 · 같은 이름 칩은 '마을회관(숲속 마을)'처럼 동네로 구별(여권 칩 글이 서로 다름)
//   ② 장구 선생님(BUG4-2 '사람은 없는데 · 위치도 저기 있어야 함?'): 몸 = 있는 일꾼(수 그대로) · 잔치 마당(정자 곁) 무대 옆 15m 안 · 장터 상인 X · 돗자리·장구 소품
//      11시 = 몸 보임(out9 0) · E = 창 · 20시 = 몸 숨김 + E = '쉬는 때 — 9시에 와요' 한 줄 · 잔치 무대 perform = 쉬는 때에도 창(잔치 갈래와 이어짐)
//   ③ 하늘 상자(BUG4-3 '정체불명의 박스 선'): 비 띠 커튼(town_sim.js makeFrontView) = 가장자리 흐림(alphaMap) + 가까이 옅어짐(front2) · 사진 자리 재현 캡처(그리기 켬 · --shots)
//      고치기 전 판과 견주기 = 같은 명령을 옛 판 포트로 --only=3 --shots=… (옛 판은 첫 줄 ✗)
//   ④ 둘레 보기(BUG4-4 '마우스로 많이 돌려도 바로 반응하는지'): 마우스 끌기 · 포인터 잠금 마우스 · ← → 키(끌기 방식 · 잠금 방식) · 터치 밀기 — 모두 15°쯤이면 ●○○ · 40° = ✓ · 왼쪽·오른쪽 다 = 다음 단계
//      하는 법 한 줄 = '왼쪽으로 한 번, 오른쪽으로 한 번' · 터치엔 키 글자 X
const { chromium } = require('playwright');   /* 하늘 캡처(그리기 켬)가 있어 pw.cjs 대신 · 자리 = tools/ops/b2.sh(무거운 시험 한 자리) */
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const ONLY = (arg('only') || '1,2,3,4').split(',').map(Number), SHOTS = arg('shots'), URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const IDRE = /pub_|gaf_|gfill_|[A-Za-z가-힣]_\d{2,}/;
async function boot(b, opt) { const ctx = await b.newContext(opt || { viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
  await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.jobs && SM_TOWN.janggu && SM_TOWN.janggu() && SM_TOWN.emerg && SM_TOWN.emerg() && window.SD2 && SD2.scene, null, { timeout: 240000 }); await p.evaluate(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1 }); }); for (let i9 = 0; i9 < 4; i9++) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); }   /* OPEN-1 뒤: 처음 화면 닫고 프롤로그 끝낸 판(쪽지가 E를 먹지 않게) */ await p.waitForTimeout(1500);
  await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await p.waitForTimeout(400); return { ctx, p, errs }; }
const W8 = (p, ms) => p.waitForTimeout(ms);
const closeAll = async p => { for (let k = 0; k < 5; k++) { if (!await p.evaluate(() => !!document.querySelector('.twn-p'))) return; await p.keyboard.press('Escape'); await W8(p, 250); } };
const tp = (p, x, z, lx, lz) => p.evaluate(([x, z, lx, lz]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); }, [x, z, lx, lz]);

(async () => { const T0 = Date.now(), b = await chromium.launch({ args: GPU });
  try {
    const { ctx, p, errs } = await boot(b);
    // ① 이름
    if (ONLY.includes(1)) { console.log('① 여권·카드·찾기 창의 장소 이름');
      const r = await p.evaluate(() => { const J = SM_TOWN.jobs(), E = J.eligible(), toasts = []; const t0 = document.getElementById('toast'); const seen = new Set();
        const mo = t0 ? new MutationObserver(() => { const t = t0.textContent; if (t && !seen.has(t)) { seen.add(t); toasts.push(t); } }) : null; if (mo) mo.observe(t0, { childList: true, characterData: true, subtree: true });
        let n = 0; for (const q of E) if (J.stamp(q)) n++; if (mo) mo.disconnect();
        const pub = E.filter(q => /^pub_/.test(q.id || '')).map(q => ({ id: q.id, nm: J.nm(q) })); return { n, all: E.length, pub, toasts: toasts.slice(0, 400), names: E.map(q => J.nm(q)) }; });
      ok(r.n > 50, '도장 ' + r.n + '/' + r.all + '곳 찍음'); ok(r.pub.length >= 3 && r.pub.every(q => !IDRE.test(q.nm)), '공공시설(pub_) ' + r.pub.length + '곳 이름 = ' + r.pub.map(q => q.nm).join(' / '));
      const halls = r.pub.filter(q => /^마을회관/.test(q.nm)).map(q => q.nm); ok(halls.length < 2 || new Set(halls).size === halls.length, '마을회관 여럿 = 동네로 구별(' + halls.join(' · ') + ')');
      const badN = r.names.filter(t => IDRE.test(t)); ok(!badN.length, '여권에 드는 곳 이름 전부 id 꼴 0' + (badN.length ? ' — ' + badN.slice(0, 6).join(' | ') : ''));
      const dupN = r.names.filter((t, i) => r.names.indexOf(t) !== i); console.log('   같은 글 이름(같은 동네·칸까지 같은 것): ' + (dupN.length ? dupN.slice(0, 8).join(' | ') : '없음'));
      const badT = r.toasts.filter(t => IDRE.test(t)); ok(!badT.length, '도장 알림 글 ' + r.toasts.length + '개에 id 꼴 0' + (badT.length ? ' — ' + badT.slice(0, 3).join(' | ') : ''));
      const txt = async () => p.evaluate(() => { const q = document.querySelector('.twn-p'); return q ? q.innerText : ''; });
      await p.evaluate(() => SM_TOWN.jobs().openPass()); await W8(p, 500); const tp1 = await txt(); ok(tp1.length > 100 && !IDRE.test(tp1), '여권 창 글(' + tp1.length + '자)에 id 꼴 0' + (IDRE.test(tp1) ? ' — ' + (tp1.match(new RegExp('.{0,20}(' + IDRE.source + ').{0,20}')) || [''])[0] : ''));
      const chips = await p.evaluate(() => [...document.querySelectorAll('.twn-p .pc-chips button[data-p]')].map(b9 => b9.textContent)); ok(chips.length > 50 && chips.some(t => /^마을회관\(/.test(t)), '여권 칩 ' + chips.length + '개 · 「' + (chips.find(t => /^마을회관\(/.test(t)) || '-') + '」');
      if (SHOTS) { require('fs').mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: SHOTS + '/bug4_1_pass.png' }); } await closeAll(p);
      for (const id of r.pub.map(q => q.id).slice(0, 4)) { await p.evaluate(id => { const J = SM_TOWN.jobs(), q = J.eligible().find(o => o.id === id); if (q) J.openCard(q); }, id); await W8(p, 400); const t = await txt(); ok(t && !IDRE.test(t), '장소 카드 ' + (t.split('\n')[0] || '').slice(0, 40) + ' — id 꼴 0'); await closeAll(p); }
      for (const k of ['KeyJ', 'KeyF']) { await p.keyboard.press(k); await W8(p, 700); const t = await txt(); ok(t.length > 50 && !IDRE.test(t), (k === 'KeyJ' ? '바로 가기(J)' : '장소 찾기(F)') + ' 창 글(' + t.length + '자) id 꼴 0' + (IDRE.test(t) ? ' — ' + (t.match(new RegExp('.{0,20}(' + IDRE.source + ').{0,20}')) || [''])[0] : '')); await closeAll(p); }
      const ch = await p.evaluate(() => { const D = SM_TOWN.dayx(); if (!D) return null; const d = SM_TOWN.game().S.day; return D.changes(d).map(r9 => r9.slice(0, 4).join(' ')); });
      const stRow = (ch || []).find(t => /여권 도장/.test(t)) || ''; ok(!!stRow && !IDRE.test(stRow), '하루 마무리 「' + stRow.slice(0, 90) + '」');
      await p.evaluate(() => { const S = SM_TOWN.game().S, d = S.day; S.pass.v['pub_gaf_없어진 마을_999'] = d; }); const ch2 = await p.evaluate(() => SM_TOWN.dayx().changes(SM_TOWN.game().S.day).map(r9 => r9.slice(0, 4).join(' ')).join(' / ')); ok(!IDRE.test(ch2), '지금 마을에 없는 옛 도장 id = 하루 마무리에 안 보임');
      await p.evaluate(() => { delete SM_TOWN.game().S.pass.v['pub_gaf_없어진 마을_999']; }); }

    // ② 장구 선생님
    if (ONLY.includes(2)) { console.log('② 장구 선생님');
      await p.evaluate(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; delete G.jg; SM_TOWN.weather('clear'); }); await W8(p, 1600);
      const I = () => p.evaluate(() => SM_TOWN.janggu().info()); let J = await I(); const F = await p.evaluate(() => SM_TOWN.feast().info().site), WK = await p.evaluate(() => SM_TOWN.workers().length);
      const T = J.teacher; ok(T && T.k === 'janggu' && T.moved, '선생님 = 옮겨 온 곁 일손(옛 일 ' + (T && T.moved && T.moved.k) + ' · 일꾼 수 ' + WK + ' 그대로)');
      const dS = F ? Math.hypot(T.x - F[0], T.z - F[1]) : 1e9; ok(dS < 15, '자리 = 잔치 마당(정자 곁 · 무대 옆) ' + dS.toFixed(1) + 'm · ' + T.cell); ok(!!T.prop && Math.hypot(T.prop[0] - T.x, T.prop[1] - T.z) < 2.5, '곁에 돗자리·장구 소품 ' + JSON.stringify(T.prop));
      ok(J.hot && Math.hypot(J.hot.x - T.x, J.hot.z - T.z) < 4.5 && /9시~18시/.test(J.hot.label), 'E 자리 ' + (J.hot && J.hot.label));
      ok(T.inHrs && T.out9 === 0, '11시 = 몸 보임(out9 ' + T.out9 + ')');
      await tp(p, J.hot.x, J.hot.z, T.x, T.z); await W8(p, 1200); await closeAll(p); const nr = await p.evaluate(() => SD2.near && SD2.near()); ok(/장구 배우기/.test(nr || ''), '곁 E = ' + nr);
      if (SHOTS) await p.screenshot({ path: SHOTS + '/bug4_2_teacher_11.png' });
      await p.keyboard.press('KeyE'); await W8(p, 900); J = await I(); ok(J.open, '11시 E → 장구 창'); await closeAll(p);
      await p.evaluate(() => { SM_TOWN.game().S.min = 20 * 60; }); await W8(p, 2300); J = await I(); ok(!J.teacher.inHrs && J.teacher.out9 === 1, '20시 = 선생님 집에 감(out9 ' + J.teacher.out9 + ')');
      await p.keyboard.press('KeyE'); await W8(p, 700); J = await I(); const body = await p.evaluate(() => (document.getElementById('toast') || {}).textContent || ''); ok(!J.open && /쉬는 때.*9시에 와요/.test(body), '20시 E = 「' + body.slice(0, 60) + '」 · 창 안 열림');
      await p.evaluate(() => { SM_TOWN.game().S.min = 7 * 60; }); await W8(p, 1300); await p.keyboard.press('KeyE'); await W8(p, 600); const b2 = await p.evaluate(() => (document.getElementById('toast') || {}).textContent || ''); ok(/쉬는 때예요\. 9시에 와요/.test(b2), '7시 E = 「' + b2.slice(0, 50) + '」(내일 X)');
      const pf = await p.evaluate(() => { const F9 = SM_TOWN.feast(); try { F9.dbg.perform(); } catch (e) { return 'err ' + e.message; } return SM_TOWN.janggu().info().open; }); ok(pf === true, '잔치 무대 perform = 쉬는 때에도 장구 창(잔치 공연 갈래와 이어짐) ' + pf); await closeAll(p);
      await p.evaluate(() => { SM_TOWN.game().S.min = 11 * 60; }); await W8(p, 1300); }

    // ④ 둘레 보기
    if (ONLY.includes(4)) { console.log('④ 🚑 둘레 보기');
      const E = (k, a) => p.evaluate(([k, a]) => SM_TOWN.emerg().dbg[k](a), [k, a]), EI = () => p.evaluate(() => SM_TOWN.emerg().info());
      await E('end', false); await p.evaluate(() => { const G = SM_TOWN.game().S; G.min = 10 * 60; SM_TOWN.rules.wx('rain'); }); await W8(p, 800);
      ok(await E('spawn', 'hurt'), '넘어진 이웃 생김'); await E('near'); for (let i = 0; i < 10; i++) { await W8(p, 400); if ((await EI()).ev.st !== 'call') break; } let H = await EI(); ok(H.ev.st === 'look', '둘레 보기 단계');
      const goal = await E('goal'); ok(/왼쪽으로 한 번, 오른쪽으로 한 번/.test(goal) && /마우스로 끌기 또는 ← → 키/.test(goal), '하는 법 한 줄 = ' + goal);
      const hudT = () => E('hudText'), cv = await p.evaluate(() => { const c = document.getElementById('scene'); const r = c.getBoundingClientRect(); return [r.left + r.width * 0.62, r.top + r.height * 0.55]; });
      const step = async (nm, fnL, fnR) => { await E('lookAgain'); await W8(p, 300); await fnL(0.45); await W8(p, 250); const h1 = await hudT(), I1 = (await EI()).ev; await fnL(1); await W8(p, 300); const I2 = (await EI()).ev; await fnR(1.6); await W8(p, 400); const I3 = (await EI()).ev, h3 = await hudT();
        ok(/왼쪽 ●[●○]○|왼쪽 ●●●|왼쪽 ✓/.test(h1) && !I1.look.l, nm + ': 조금 돌리면 바로 차오름 「' + h1 + '」');
        ok(I2.look && I2.look.l === 1, nm + ': 왼쪽 40° = ✓'); ok(I3.st === 'talk', nm + ': 오른쪽까지 = 다음 단계(' + I3.st + ' · ' + h3 + ')'); };
      const pxL = 0.7 / 0.0026 * 1.15;   /* 40° = 0.7rad · 끌기 0.0026rad/px */
      await p.evaluate(() => SD2.map.player.mouseMode('drag'));
      await step('마우스 끌기', async f => { await p.mouse.move(cv[0], cv[1]); await p.mouse.down(); const n = 10, d = -pxL * f / n; for (let i = 1; i <= n; i++) { await p.mouse.move(cv[0] + d * i, cv[1]); await W8(p, 30); } await p.mouse.up(); }, async f => { await p.mouse.move(cv[0] - 200, cv[1]); await p.mouse.down(); const n = 14, d = pxL * f / n; for (let i = 1; i <= n; i++) { await p.mouse.move(cv[0] - 200 + d * i, cv[1]); await W8(p, 30); } await p.mouse.up(); });
      await step('← → 키(끌기 방식)', async f => { await p.keyboard.down('ArrowLeft'); await W8(p, 520 * f); await p.keyboard.up('ArrowLeft'); }, async f => { await p.keyboard.down('ArrowRight'); await W8(p, 520 * f); await p.keyboard.up('ArrowRight'); });
      await p.evaluate(() => { SD2.map.player.mouseMode('lock'); const c = document.getElementById('scene'); Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => c }); });
      const mv = f => p.evaluate(([px]) => { for (let i = 0; i < 8; i++) dispatchEvent(new MouseEvent('mousemove', { movementX: px / 8, movementY: 0 })); }, [f]);
      await step('포인터 잠금 마우스', async f => { for (let i = 0; i < 6; i++) { await mv(-pxL * f / 6); await W8(p, 40); } }, async f => { for (let i = 0; i < 6; i++) { await mv(pxL * f / 6); await W8(p, 40); } });
      await step('← → 키(잠금 방식)', async f => { await p.keyboard.down('ArrowLeft'); await W8(p, 520 * f); await p.keyboard.up('ArrowLeft'); }, async f => { await p.keyboard.down('ArrowRight'); await W8(p, 520 * f); await p.keyboard.up('ArrowRight'); });
      const big = await (async () => { await E('lookAgain'); await W8(p, 200); await p.evaluate(() => { for (let i = 0; i < 16; i++) dispatchEvent(new MouseEvent('mousemove', { movementX: -25, movementY: 0 })); }); await W8(p, 300); return (await EI()).ev.look; })(); ok(big.l === 1, '한 프레임에 400px(약 60°) 빨리 휘둘러도 바로 ✓ ' + JSON.stringify({ l: big.l, pl: big.pl && +big.pl.toFixed(2) }));
      await p.evaluate(() => { delete document.pointerLockElement; SD2.map.player.mouseMode('drag'); }); await E('end', false);
      ok(errs.length === 0, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
      // 터치(휴대폰 가로)
      const T9 = await boot(b, { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }), q = T9.p, cdp = await T9.ctx.newCDPSession(q);
      await q.touchscreen.tap(420, 200); await W8(q, 1200); const E2 = (k, a) => q.evaluate(([k, a]) => SM_TOWN.emerg().dbg[k](a), [k, a]);
      await q.evaluate(() => { const G = SM_TOWN.game().S; G.min = 10 * 60; SM_TOWN.rules.wx('rain'); }); await W8(q, 600); await E2('spawn', 'hurt'); await E2('near'); for (let i = 0; i < 10; i++) { await W8(q, 400); if ((await q.evaluate(() => SM_TOWN.emerg().info().ev.st)) !== 'call') break; }
      const g2 = await E2('goal'); ok(/손가락으로 밀기/.test(g2) && !/키/.test(g2), '터치 하는 법 = 「' + g2 + '」(키 글자 X)');
      const swipe = async (dx) => { const x0 = 560, y0 = 170, n = 12; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 7 }] }); for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + dx * i / n, y: y0, id: 7 }] }); await W8(q, 25); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await W8(q, 350); };
      await swipe(-50); const th = await E2('hudText'); ok(/왼쪽 ●/.test(th), '터치 조금 밀기 = 바로 「' + th + '」'); await swipe(-130); await swipe(220); await swipe(110); await W8(q, 400); const st2 = await q.evaluate(() => SM_TOWN.emerg().info().ev); ok(st2.st === 'talk', '터치 밀기 왼쪽·오른쪽 = 다음 단계(' + st2.st + ' ' + JSON.stringify(st2.look) + ')');
      ok(T9.errs.length === 0, '터치 페이지 오류 0' + (T9.errs.length ? ' — ' + T9.errs.slice(0, 3).join(' | ') : '')); await T9.ctx.close(); }

    // ③ 하늘 상자(사진 자리: 2일째 10:20 맑음 · 비 띠가 도는 날 · 서쪽을 올려다봄)
    if (ONLY.includes(3)) { console.log('③ 하늘 상자(비 띠 커튼)');
      await p.evaluate(() => { const G = SM_TOWN.game().S; G.day = 2; G.min = 10 * 60 + 20; SM_TOWN.weather('clear'); }); await tp(p, -470, 712); await W8(p, 2600);
      const f = await p.evaluate(() => { let m = null; SD2.scene.traverse(o => { if (o.isInstancedMesh && o.material && o.material.alphaMap && o.material.customProgramCacheKey && o.material.customProgramCacheKey() === 'front2') m = o; }); const fr = SM_TOWN.sim && SM_TOWN.sim.front ? SM_TOWN.sim.front() : null; return { soft: !!m, n: m ? m.count : 0, vis: !!(m && m.visible), fr: fr && { on: fr.on, here: fr.here, curtains: fr.curtains } }; });
      ok(f.soft, '커튼 재질 = 가장자리 흐림(alphaMap) + 가까이 옅어짐(front2) · 지금 판 ' + f.n + '장 · ' + JSON.stringify(f.fr));
      await p.evaluate(() => { SD2.map.player.lookAt([-900, 650]); SD2.map.player.setPitch(-0.2); }); await W8(p, 900);
      if (SHOTS) await p.screenshot({ path: SHOTS + '/bug4_3_sky_w.png' });
      if (SHOTS) console.log('   사진: ' + SHOTS + '/bug4_3_sky_w.png(고치기 전 판과 견줄 때는 같은 명령을 옛 판 포트로 --only=3)'); }
    ok(errs.length === 0, '페이지 오류 0(끝)' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외: ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); }
  console.log('— ' + ((Date.now() - T0) / 1000).toFixed(0) + '초 · ' + (fails.length ? 'FAIL ' + fails.length + ': ' + fails.join(' / ') : 'PASS')); await b.close(); process.exit(fails.length ? 1 : 0); })();
