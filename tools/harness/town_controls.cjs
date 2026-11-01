// 🎮 조작을 일반 게임처럼 시험(CTRL-1 · 교사 11-01 "지도 말고도 일반 게임하고 동떨어진 조작 요소 있으면 조사해서 고쳐야지"): node tools/harness/town_controls.cjs [마을=ourtown] [포트=8002]
//   전수표 = docs/systems/town_controls.md
//   ① 창 열 종류 이상이 같은 규칙: ✕ 있음 · Esc = 닫기 · 바깥 누르기(누르고 떼기 둘 다 바깥) = 닫기 · 창 안에서 끌다 밖에서 놓으면 X · Tab = 마우스 잠금 X(창 그대로) · Enter = 기본 단추(없으면 닫기)
//      아래 줄 단추 차례 = [닫기·취소(왼쪽)] [보조] [기본(오른쪽 · 초록)]
//   ② 기본 단추 규칙(시험 창): 초록 하나 = Enter · 단추 하나뿐인 알림 창 = E·Space도 · 사기(buy) = 기본 X · 초록 둘(고르기) = X · 단추에 손(포커스)이 있으면 그 단추 · 연 지 0.3초 안 X · 쓰던 글이 있으면 바깥 X
//   ③ 대화 넘기기 = E·Space·Enter·대화창 클릭·빈 화면 클릭(마우스 잠금 X) · 고르기가 떠 있으면 빈 화면 X · Esc = 끝
//   ④ 휠: 창 위 = 창만 스크롤 · 창·대화가 떠 있으면 카메라 거리 그대로 · 창이 없으면 휠 = 카메라 거리(예전 그대로)
//   ⑤ 겹친 키: 창이 열린 채 E = 뒤의 할 일 X · 숫자 = 도구 X · 놀이 판(그만·시작 차례 · 빈 화면 = 잠금 X · Esc = 그만) · 오른쪽 클릭(잠김) = E
//   ⑥ 휴대폰 세로·가로: 창 단추·✕ 44px 이상 · 대화 고르기 44px · 빈 화면 톡 = 대화 넘기기 · 창 바깥 톡 = 닫기 · 페이지 오류 0
const { chromium, devices } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
async function boot(ctx, touch) { const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.ctl, null, { timeout: 240000 }); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b) b.click(); }); await p.waitForTimeout(500); }
  await p.keyboard.press('Escape'); if (touch) await p.touchscreen.tap(200, 300); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__pl = 0; const c = document.querySelector('canvas'); c.requestPointerLock = () => { window.__pl++; return Promise.resolve(); }; if (window.SM_TOWN.tips) SM_TOWN.tips.age(-1e7); });   /* 잠금 요청 셈(머리 없는 브라우저) · 한 줄 안내는 뒤로 미룸 */
  return { p, errs }; }
const CVPT = () => { for (const [fx, fy] of [[0.5, 0.22], [0.5, 0.3], [0.35, 0.3], [0.65, 0.3], [0.5, 0.4], [0.3, 0.45], [0.7, 0.45]]) { const x = Math.round(innerWidth * fx), y = Math.round(innerHeight * fy), e = document.elementFromPoint(x, y); if (e && e.tagName === 'CANVAS') return [x, y]; } return [Math.round(innerWidth / 2), Math.round(innerHeight * 0.3)]; };   /* 3D 화면만 있는 점(칩·띠 X) */
const PK = () => { const e = document.querySelector('.twn-p'); return e ? (e.dataset.k || '?') : ''; };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    // ───── 데스크톱 1366×768 ─────
    { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), { p, errs } = await boot(ctx), ev = (f, a) => p.evaluate(f, a), W = ms => p.waitForTimeout(ms), pk = () => ev(PK);
      const closeAll = async () => { for (let i = 0; i < 4 && (await pk() || await ev(() => SM_TOWN.dlgOn())); i++) { await p.keyboard.press('Escape'); await W(250); } };
      await closeAll(); await ev(() => { for (const k of ['map', 'find', 'dex', 'skill', 'tasks', 'wx', 'pass']) try { SM_TOWN.hud.unlock(k); } catch (e) { /* 없는 열쇠 */ } }); await W(4800); await closeAll();
      console.log('① 창 열 종류 이상 = 같은 규칙');
      const OPEN = [['☰ 메뉴', () => SM_TOWN.menu()], ['📋 할 일', () => SM_TOWN.openTasks()], ['📖 이야기 목록', () => SM_TOWN.storyList()], ['⌨ 조작 도움(H)', 'KeyH'], ['🎒 가방(I)', 'KeyI'], ['📍 바로 가기(J)', 'KeyJ'],
        ['🗺 큰 지도(M)', 'KeyM'], ['🔎 장소 찾기(F)', 'KeyF'], ['📖 도감', () => SM_TOWN.dexOpen()], ['🌟 솜씨', () => SM_TOWN.openSkills()], ['📔 일기', () => SM_TOWN.openDiary()], ['☀️ 날씨', () => SM_TOWN.openWx()]];
      let kinds = 0, allOk = 0;
      for (const [nm, how] of OPEN) {
        const open = async () => { await closeAll(); await ev(() => { const a = document.activeElement; if (a && a.blur) a.blur(); }); try { if (typeof how === 'string') await p.keyboard.press(how); else await ev(how); } catch (e) { return false; } await W(450); return !!(await pk()); };
        if (!(await open())) { console.log('   (' + nm + ' 안 열림 — 건너뜀)'); continue; }
        kinds++; const k = await pk(), R = {};
        R.x = await ev(() => !!document.querySelector('.twn-p .twn-x'));
        R.foot = await ev(() => SM_TOWN.ctl.foot()); R.def = await ev(() => SM_TOWN.ctl.def());
        { const F = R.foot.map(s => { const m = /^(s|g):([^@]*)@(-?\d+)$/.exec(s); return { g: m[1] === 'g', x: m[2] === 'x', l: +m[3] }; }); const cl = F.filter(q => q.x && !q.g), gr = F.filter(q => q.g), su = F.filter(q => !q.g && !q.x);
          R.order = cl.every(c => [...su, ...gr].every(o => c.l < o.l)) && su.every(s => gr.every(g => s.l < g.l)); }
        await p.keyboard.press('Escape'); await W(300); R.esc = !(await pk());
        await open(); await p.mouse.click(4, 4); await W(300); R.out = !(await pk());
        await open(); { const bx = await ev(() => { const r = document.querySelector('.twn-p .bx').getBoundingClientRect(); return [r.left + 30, r.top + r.height / 2]; }); await p.mouse.move(bx[0], bx[1]); await p.mouse.down(); await p.mouse.move(4, bx[1], { steps: 4 }); await p.mouse.up(); await W(300); R.drag = await pk() === k; }
        if (!(await pk())) await open(); { const pl0 = await ev(() => __pl); await ev(() => { const a = document.activeElement; if (a && a.blur) a.blur(); }); await p.keyboard.press('Tab'); await W(250); R.tab = (await ev(() => __pl)) === pl0 && await pk() === k; }
        if (!(await pk())) await open(); await ev(() => { const a = document.activeElement; if (a && a.blur) a.blur(); }); await W(320); await p.keyboard.press('Enter'); await W(350); R.enter = R.def === 'x' ? !(await pk()) : R.def ? true : await pk() === k;
        const good = R.x && R.esc && R.out && R.drag && R.tab && R.enter && R.order; if (good) allOk++;
        ok(good, nm + ' [' + k + '] ✕ ' + R.x + ' · Esc ' + R.esc + ' · 바깥 ' + R.out + ' · 끌어 놓기 그대로 ' + R.drag + ' · Tab 잠금 X ' + R.tab + ' · Enter(' + (R.def || '없음') + ') ' + R.enter + ' · 차례 ' + R.order + ' ' + JSON.stringify(R.foot));
        await closeAll(); }
      ok(kinds >= 10, '연 창 갈래 ' + kinds + '개(열 이상) · 모두 같은 규칙 ' + allOk + '/' + kinds);

      console.log('② 기본 단추 규칙(시험 창)');
      const T = async (html, k = 'zz') => { await closeAll(); await ev(([h, kk]) => { window.__hit = []; const P = SM_TOWN.ctl.openP(h, false, kk); P.addEventListener('click', e => { const bt = e.target.closest('button'); if (!bt) return; __hit.push(bt.dataset.a); if (bt.dataset.a === 'x') document.querySelector('.twn-p') && SM_TOWN.ctl && document.querySelector('.twn-p .twn-x').click(); }); }, [html, k]); await W(380); };
      const hit = () => ev(() => __hit.slice());
      await T('<h3>시험</h3><div class="row"><button class="sub" data-a="x">닫기</button><button data-a="go">가기</button></div>');
      ok(await ev(() => SM_TOWN.ctl.def()) === 'go', '초록 하나 = 기본 단추'); await p.keyboard.press('KeyE'); await p.keyboard.press('Space'); await W(200); ok((await hit()).length === 0 && await pk() === 'zz', '단추 둘 = E·Space는 X'); await p.keyboard.press('Enter'); await W(200); ok((await hit()).join() === 'go', 'Enter = 초록 단추(가기)');
      await T('<h3>알림</h3><div class="sm">시험</div><div class="row"><button data-a="x">좋아요</button></div>'); await p.keyboard.press('KeyE'); await W(250); ok(!(await pk()), '단추 하나뿐인 알림 = E로 닫힘');
      await T('<h3>알림</h3><div class="row"><button data-a="x">좋아요</button></div>'); await p.keyboard.press('Space'); await W(250); ok(!(await pk()), '알림 = Space로 닫힘');
      await closeAll(); await ev(() => { window.__hit = []; SM_TOWN.ctl.openP('<h3>알림</h3><div class="row"><button data-a="x">좋아요</button></div>', false, 'zz'); }); await p.keyboard.press('KeyE'); await W(150); ok(await pk() === 'zz', '연 지 0.3초 안의 E = X(두 번 누름에 바로 닫히지 않음)');
      await T('<h3>가게</h3><div class="row"><button data-a="buy">하나 사기</button><button class="sub" data-a="x">구경만</button></div>'); ok(await ev(() => SM_TOWN.ctl.def()) === null, '사기(buy) = 기본 단추 X'); await p.keyboard.press('Enter'); await W(200); ok((await hit()).length === 0 && await pk() === 'zz', 'Enter로 사지 않음');
      { const f = await ev(() => SM_TOWN.ctl.foot()); const xl = +/@(-?\d+)/.exec(f.find(s => s.includes(':x@')))[1], bl = +/@(-?\d+)/.exec(f.find(s => s.includes(':buy@')))[1]; ok(xl < bl, '[초록][취소]로 지은 줄도 보이기는 [구경만(왼쪽)] [하나 사기(오른쪽)] ' + JSON.stringify(f)); }
      await T('<h3>고르기</h3><div class="row"><button data-a="a">가</button><button data-a="b">나</button></div>'); await p.keyboard.press('Enter'); await W(200); ok(await ev(() => SM_TOWN.ctl.def()) === null && (await hit()).length === 0, '초록 둘(고르기) = Enter X');
      await T('<h3>손</h3><div class="row"><button class="sub" data-a="other">다른 것</button><button data-a="go">가기</button></div>'); await ev(() => document.querySelector('.twn-p [data-a="other"]').focus()); await p.keyboard.press('Enter'); await W(200); ok((await hit()).join() === 'other', '단추에 손이 있으면 Enter = 그 단추(브라우저 그대로)');
      await T('<h3>쓰기</h3><div class="row"><input class="twn-line" value=""><button data-a="go">다 썼어요</button></div>'); await ev(() => { const i = document.querySelector('.twn-p input'); i.value = '감자'; i.blur(); }); await p.mouse.click(4, 4); await W(300); ok(await pk() === 'zz', '쓰던 글이 있으면 바깥 누르기 = 안 닫힘'); await p.keyboard.press('Escape'); await W(250); ok(!(await pk()), '그래도 Esc = 닫힘');
      await T('<h3>빈 쓰기</h3><div class="row"><input class="twn-line" value=""><button data-a="go">다 썼어요</button></div>'); await ev(() => document.querySelector('.twn-p input').blur()); await p.mouse.click(4, 4); await W(300); ok(!(await pk()), '빈 글 칸 = 바깥 누르기로 닫힘');
      await closeAll();

      console.log('③ 대화 넘기기');
      const D = () => ev(() => ({ on: SM_TOWN.dlgOn(), tx: (document.querySelector('.twn-dlg .tx') || {}).textContent || '', r: (window.__dr || []).slice(), ch: document.querySelectorAll('.twn-dlg .ch button').length }));
      const dlg = async (pages, ch) => { await ev(([pg, c]) => { window.__dr = []; SM_TOWN.dialog({ who: '시험', text: pg, choices: c }).then(v => __dr.push(v)); }, [pages, ch || null]); await W(900); };
      await dlg(['하나', '둘', '셋', '넷']);
      await p.keyboard.press('KeyE'); await W(500); ok((await D()).tx === '둘', 'E = 다음 쪽');
      await p.keyboard.press('Space'); await W(500); ok((await D()).tx === '셋', 'Space = 다음 쪽');
      { const pl0 = await ev(() => __pl), cv = await ev(CVPT); await p.mouse.click(cv[0], cv[1]); await W(500); const d = await D(); ok(d.tx === '넷' && (await ev(() => __pl)) === pl0, '빈 화면(3D) 클릭 = 다음 쪽 · 마우스 잠금 X'); }
      await ev(() => document.querySelector('.twn-dlg .dbox').click()); await W(400); ok(!(await D()).on && (await D()).r[0] === 'ok', '대화창 클릭 = 끝');
      await dlg(['하나', '둘']); await p.keyboard.press('Enter'); await W(500); ok((await D()).tx === '둘', 'Enter = 다음 쪽');
      await ev(() => dispatchEvent(new CustomEvent('sm-click', { detail: { x: 600, y: 200 } }))); await W(400); ok(!(await D()).on, '톡(sm-click) = 넘기기');
      await dlg(['고를래?'], [['a', '가'], ['b', '나']]); { const d0 = await D(), cv = await ev(CVPT); await p.mouse.click(cv[0], cv[1]); await W(400); const d = await D(); ok(d0.ch === 2 && d.on && d.r.length === 0, '고르기가 떠 있으면 빈 화면 클릭 = 고르지 않음'); }
      await p.keyboard.press('Escape'); await W(300); ok(!(await D()).on && (await D()).r[0] === null, 'Esc = 대화 끝');

      console.log('④ 휠');
      await p.keyboard.press('KeyH'); await W(450);
      { const z0 = await ev(() => SD2.cam()[3]); await p.mouse.move(683, 420); await p.mouse.wheel(0, 500); await W(300); const st = await ev(() => document.querySelector('.twn-p .bx').scrollTop);
        await ev(() => document.querySelector('canvas').dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true }))); await W(100); const z1 = await ev(() => SD2.cam()[3]);
        ok(st > 0 && z1 === z0, '창 위 휠 = 창만 스크롤(' + st + 'px) · 카메라 거리 그대로(' + z0 + ' → ' + z1 + ')'); }
      await closeAll(); await dlg(['휠 시험']); { const z0 = await ev(() => SD2.cam()[3]); await ev(() => document.querySelector('canvas').dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true }))); await W(100); ok(await ev(() => SD2.cam()[3]) === z0, '대화 중 휠 = 카메라 그대로'); }
      await closeAll(); { const z0 = await ev(() => SD2.cam()[3]); await ev(() => document.querySelector('canvas').dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true, cancelable: true }))); await W(100); const z1 = await ev(() => SD2.cam()[3]); ok(z1 > z0, '창이 없으면 휠 = 카메라 거리(' + z0 + ' → ' + z1 + ')'); }

      console.log('⑤ 겹친 키');
      { const sp = await ev(() => SM_TOWN.tips.spots()); await ev(() => SM_TOWN.hud.unlock('bus')); await W(300); const s = sp.bus[0];
        await ev(([x, z]) => { SD2.map.player.teleport([x + 1.2, SM_TOWN.ground(x + 1.2, z) + 0.1, z]); SD2.map.player.lookAt([x, z]); }, s); await W(1200); await closeAll();
        let near = await ev(() => SD2.near()); for (let i = 0; i < 6 && !near; i++) { await ev(([x, z, d]) => SD2.map.player.teleport([x + d, SM_TOWN.ground(x + d, z) + 0.1, z]), [s[0], s[1], 0.3 * i]); await W(500); near = await ev(() => SD2.near()); }
        console.log('   정류장 곁 할 일: ' + near);
        await ev(() => SM_TOWN.storyList()); await W(450); const k0 = await pk(); await p.keyboard.press('KeyE'); await W(500); ok(near && k0 && await pk() === k0 && !(await ev(() => SM_TOWN.dlgOn())), '목록 창이 열린 채 E = 뒤의 「' + near + '」 X(창 그대로)');
        await closeAll(); await ev(() => SM_TOWN.ctl.openP('<h3>알림</h3><div class="row"><button data-a="x">좋아요</button></div>', false, 'zz')); await W(400); await p.keyboard.press('KeyE'); await W(500); ok(!(await pk()) && !(await ev(() => SM_TOWN.dlgOn())), '알림 창을 E로 닫아도 뒤의 할 일은 안 열림(같은 E 한 번 = 한 가지)');
        await ev(() => { SM_TOWN.tools.give('can'); }); await W(700); await closeAll(); const c0 = await ev(() => SM_TOWN.tools.info().cur); await ev(() => SM_TOWN.storyList()); await W(450); await p.keyboard.press('Digit1'); await W(300); const c1 = await ev(() => SM_TOWN.tools.info().cur); ok(await pk() === k0 && c1 === c0, '창이 열린 채 1 = 도구 그대로(' + c0 + ' → ' + c1 + ')'); await closeAll();
        await p.keyboard.press('Digit1'); await W(300); const c2 = await ev(() => SM_TOWN.tools.info().cur); ok(c2 !== c0, '창이 없으면 1 = 물뿌리개 들기·내리기(예전 그대로 · ' + c0 + ' → ' + c2 + ')'); if (c2) { await p.keyboard.press('Digit1'); await W(200); }
        await ev(() => { Object.defineProperty(document, 'pointerLockElement', { get: () => document.querySelector('canvas'), configurable: true }); }); await W(200);
        await p.mouse.click(683, 384, { button: 'right' }); await W(800); const k1 = await pk(), dl1 = await ev(() => SM_TOWN.dlgOn());
        await ev(() => { delete document.pointerLockElement; }); ok(!!(k1 || dl1), '잠긴 채 오른쪽 클릭 = E(「' + near + '」 → ' + (k1 || (dl1 ? '대화' : '없음')) + ')'); await closeAll(); }
      { const r = await ev(() => !!SM_TOWN.playK('tuho')); await W(600); const has = await ev(() => !!document.querySelector('.twn-play'));
        if (r && has) { const o = await ev(() => { const x = document.querySelector('.twn-play .row .x'), g = document.querySelector('.twn-play .row .go'); return x && g ? [+getComputedStyle(x).order, +getComputedStyle(g).order] : null; });
          ok(!!o && o[0] < o[1], '놀이 판 단추 차례 = [그만(왼쪽)] [시작(오른쪽)] (order ' + JSON.stringify(o) + ')');
          const pl0 = await ev(() => __pl), cv = await ev(CVPT); await p.mouse.click(cv[0], cv[1]); await W(300); ok((await ev(() => __pl)) === pl0, '놀이 중 빈 화면 클릭 = 마우스 잠금 X(끌기·단추를 계속 씀)');
          await p.keyboard.press('Escape'); await W(1500); ok(!(await ev(() => !!document.querySelector('.twn-play'))), 'Esc = 놀이 그만'); }
        else console.log('   (놀이 판을 못 열어 건너뜀)'); }
      await closeAll();
      ok(errs.length === 0, '페이지 오류 ' + errs.length + (errs.length ? ' ' + errs.slice(0, 2).join(' | ') : ''));
      await ctx.close(); }

    // ───── 휴대폰 세로·가로 ─────
    for (const [nm, dev] of [['세로', devices['iPhone 13']], ['가로', devices['iPhone 13 landscape']]]) {
      console.log('⑥ 휴대폰 ' + nm);
      const ctx = await b.newContext({ ...dev }), { p, errs } = await boot(ctx, true), ev = (f, a) => p.evaluate(f, a), W = ms => p.waitForTimeout(ms), pk = () => ev(PK);
      const closeAll = async () => { for (let i = 0; i < 4 && await pk(); i++) { await ev(() => { const x = document.querySelector('.twn-p .twn-x'); if (x) x.click(); }); await W(250); } };
      await closeAll();
      let small = [], n = 0;
      for (const f of [() => SM_TOWN.menu(), () => SM_TOWN.openTasks(), () => SM_TOWN.storyList(), () => SM_TOWN.bagOpen(), () => SM_TOWN.tips.help()]) {
        await closeAll(); try { await ev(f); } catch (e) { continue; } await W(450); if (!(await pk())) continue; n++;
        small = small.concat(await ev(() => [...document.querySelectorAll('.twn-p button,.twn-p .twn-x')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), (e.textContent || '✕').trim().slice(0, 10)]; }).filter(q => q[0] < 44 || q[1] < 44))); }
      ok(n >= 4 && small.length === 0, '창 ' + n + '개 단추·✕ 44px 이상(작은 것 ' + small.length + (small.length ? ' ' + JSON.stringify(small.slice(0, 4)) : '') + ')');
      await closeAll(); await ev(() => SM_TOWN.openTasks()); await W(450); { const vp = await ev(() => [innerWidth, innerHeight]); await p.touchscreen.tap(vp[0] - 6, 6); await W(400); ok(!(await pk()), '창 바깥 톡 = 닫힘'); }
      await ev(() => { window.__dr = []; SM_TOWN.dialog({ who: '시험', text: ['하나', '둘'] }).then(v => __dr.push(v)); }); await W(900);
      { const cv = await ev(CVPT); await p.touchscreen.tap(cv[0], cv[1]); await W(500); ok(await ev(() => (document.querySelector('.twn-dlg .tx') || {}).textContent) === '둘', '빈 화면 톡 = 대화 다음 쪽'); }
      await ev(() => { for (let i = 0; i < 3; i++) { const d = document.querySelector('.twn-dlg .dbox'); if (d) d.click(); } }); await W(300);
      await ev(() => { window.__dr = []; SM_TOWN.dialog({ who: '시험', text: ['고를래?'], choices: [['a', '가'], ['b', '나']] }).then(v => __dr.push(v)); }); await W(900);
      { const ch = await ev(() => [...document.querySelectorAll('.twn-dlg .ch button')].map(e => Math.round(e.getBoundingClientRect().height))); ok(ch.length === 2 && ch.every(h => h >= 44), '대화 고르기 단추 높이 ' + ch.join(',') + 'px'); }
      await ev(() => { const bt = document.querySelector('.twn-dlg .ch button'); if (bt) bt.click(); }); await W(300);
      ok(errs.length === 0, '페이지 오류 ' + errs.length + (errs.length ? ' ' + errs.slice(0, 2).join(' | ') : ''));
      await ctx.close(); }
  } finally { await b.close(); }
  console.log(fails ? '✗ 실패 ' + fails : '✓ 모두 통과'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
