// 💡 조작 한 줄 안내·⌨ 조작 도움 창 시험(TIPS-1 · 사용자 10-31 '마우스를 보이게 하는 탭, 자전거, 편의 기능을 처음에 잘 안 알려 줘서'): node tools/harness/town_tips.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 도움 창 = 지금 열린 기능만(새 아이: 장소 찾기·판 모습·버스·지하철·도감 X) · H·아래 키 줄·☰ 메뉴 ❓로 열림 · 키 줄 ✕ = 접기(접힌 칩 = H 조작 도움) · 막 열린 것 '새로'(한 번)
//   ② 처음 상황마다 한 줄이 한 번만: 마우스 잠김(Tab) · 걸어서 100m(B) · 정류장 곁(E) · 비(U) · 맴돎(J) · 가방 첫 물건(I) · 첫 밤(잠) · 막마다 열림(새로 생겼어요 [M])
//   ③ 겹침 X: 창이 뜨면 내림(1.5초 전이면 다시 줄 섬) · 안내 사이 20초 · 5분에 셋 · 한 줄이 E 안내·키 줄·위 줄·칩과 안 겹침 · 기능을 스스로 먼저 쓰면 그 안내는 X
//   ④ 끄기(도움 창 단추 · ⚙ 설정) · 30분 흉내(시간 건너뛰기)에서 5분 창마다 셋 이하 · ⑤ 휴대폰 세로·가로 = 터치 단추 그림(키 글자 X) · 터치 단추와 안 겹침 · 페이지 오류 0
//   시간 = SM_TOWN.tips.age(ms)로 건너뜀(20초·5분 셈을 기다리지 않음) · 판정 = SM_TOWN.tips.sec()(0.5초 칸 한 번)
const { chromium, devices } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots'), URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
async function boot(ctx, touch) { const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.tips, null, { timeout: 240000 }); await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b) b.click(); }); await p.waitForTimeout(500); }
  await p.keyboard.press('Escape'); if (touch) await p.touchscreen.tap(200, 300); await p.waitForTimeout(2000); return { p, errs }; }
// 페이지 안: 한 줄 안내와 겹치면 안 되는 것(보이는 것만)
const OVER = () => { const t = document.querySelector('.twn-tip.on'); if (!t) return { tip: null, hit: ['안내 없음'] }; const r = t.getBoundingClientRect(), hit = [];
  for (const e of document.querySelectorAll('#hint,#toast,#hudGoal,#hudBan,.twn-keys,.twn-comp,.gchip,.twn-mini,.twn-task,.tbtn,#tJoy')) { if (!e.getClientRects().length) continue; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue; const q = e.getBoundingClientRect(); if (q.width < 2 || q.height < 2) continue;
    if (r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top) hit.push((e.id || e.className).slice(0, 24)); }
  const inV = r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; if (!inV) hit.push('화면 밖');
  return { tip: [r.left, r.top, r.right, r.bottom].map(Math.round), hit, kbd: t.querySelectorAll('kbd').length, tb: t.querySelectorAll('.tb,.tc').length, text: t.innerText.replace(/\s+/g, ' ').trim() }; };
(async () => {
  const fs = require('fs'); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    // ───── 데스크톱 1366×768 · 새 아이 ─────
    { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), { p, errs } = await boot(ctx), ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
      const shot = async n => { if (!SHOTS) return; await W8(300); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); };
      const T = () => ev(() => SM_TOWN.tips.info()), sec = () => ev(() => SM_TOWN.tips.sec()), age = ms => ev(m => SM_TOWN.tips.age(m), ms), panelK = () => ev(() => { const e = document.querySelector('.twn-p'); return e ? (e.dataset.k || '?') : ''; });
      const waitCur = async (id, ms = 9000) => { const t0 = Date.now(); let i; do { await sec(); i = await T(); if (i.cur === id) return i; await W8(400); } while (Date.now() - t0 < ms); const d = await ev(() => ({ ban: (document.getElementById('hudBan') || {}).textContent || '', banOn: !!(document.getElementById('hudBan') && document.getElementById('hudBan').style.display !== 'none'), toast: (document.getElementById('toast') || {}).textContent || '', panel: (document.querySelector('.twn-p') || {}).dataset || null, dlg: !!document.querySelector('.twn-dlg') })); console.log('   [' + id + ' 못 뜸] q=' + JSON.stringify(i.q) + ' why=' + JSON.stringify(i.why) + ' 화면=' + JSON.stringify(d) + ' 기록=' + JSON.stringify(i.log.slice(-5))); return i; };   /* 배너·알림이 떠 있으면 안내가 기다림 — 그만큼 기다려 봄 */
      const closeAll = async () => { for (let i = 0; i < 4 && await panelK(); i++) { await p.keyboard.press('Escape'); await W8(250); } };
      const lock = on => ev(v => { if (v) Object.defineProperty(document, 'pointerLockElement', { get: () => document.querySelector('canvas'), configurable: true }); else delete document.pointerLockElement; document.dispatchEvent(new Event('pointerlockchange')); }, on);
      await closeAll();
      console.log('① 조작 도움 창(새 아이)');
      ok(await ev(() => !SM_TOWN.hud.all() && SM_TOWN.tips.info().off === false), '새 아이 = 진행 열림 · 한 줄 안내 켜짐(기본)');
      await p.keyboard.press('KeyH'); await W8(500); ok(await panelK() === 'help', 'H = 조작 도움 창');
      { const R = await ev(() => [...document.querySelectorAll('.twn-p .hp-r')].map(e => (e.dataset.hk || '-') + ':' + e.querySelector('.hp-n').textContent)), has = k => R.some(t => t.startsWith(k + ':'));
        console.log('   줄 ' + R.length + ': ' + R.join(' | ').slice(0, 400));
        ok(has('mouse') && has('bike') && has('bag') && has('lost') && has('umb') && has('help') && has('sleep'), '처음부터 쓰는 것(Tab·B·I·J·U·잠·H) 있음');
        ok(!has('find') && !has('look') && !has('bus') && !has('subway') && !has('dex') && !has('skill') && !has('map'), '아직 안 열린 것(장소 찾기·판 모습·버스·지하철·도감·솜씨·큰 지도) 없음');
        ok(await ev(() => document.querySelectorAll('.twn-p .hp-k kbd').length > 10 && !document.querySelector('.twn-p .hp-k .tb')), '데스크톱 = 키 그림(터치 단추 그림 X)');
        ok(await ev(() => { const g = document.querySelector('.twn-p .hp-g'), r = document.querySelector('.twn-p .hp-r'); return !!g && getComputedStyle(g).display === 'grid' && getComputedStyle(r).display === 'flex'; }), '표 모양(CSS가 붙음 — 한 줄 안내가 뜨기 전에 열어도)'); }
      await shot('help_desk');
      await p.keyboard.press('KeyH'); await W8(400); ok(!(await panelK()), 'H 한 번 더 = 닫힘');
      ok(/H/.test(await ev(() => document.querySelector('.twn-keys').textContent)), '아래 키 줄에 H 도움');
      await ev(() => { const s = [...document.querySelectorAll('.twn-keys span')].find(e => /걷기/.test(e.textContent)); s.click(); }); await W8(400); ok(await panelK() === 'help', '키 줄을 누름 = 조작 도움 창'); await closeAll();
      await ev(() => document.querySelector('.twn-keys [data-x]').click()); await W8(300); { const t = await ev(() => document.querySelector('.twn-keys').textContent); ok(/조작 도움/.test(t) && !(await panelK()), '✕ = 접힘(창 X) · 접힌 칩 「' + t + '」'); }
      await ev(() => document.querySelector('.twn-keys').click()); await W8(400); ok(await panelK() === 'help', '접힌 칩을 누름 = 조작 도움 창');
      await ev(() => document.querySelector('.twn-p [data-hp="keys"]').click()); await W8(300); ok(/걷기/.test(await ev(() => document.querySelector('.twn-keys').textContent)) && await panelK() === 'help', '창의 「아래 키 줄 펼치기」 = 다시 펼침'); await closeAll();
      await ev(() => SM_TOWN.menu()); await W8(400); { const b9 = await ev(() => { const e = document.querySelector('.twn-p [data-a="how"]'); return e ? e.textContent : ''; }); ok(/조작 도움/.test(b9), '☰ 메뉴 ❓ 「' + b9 + '」'); await ev(() => document.querySelector('.twn-p [data-a="how"]').click()); await W8(400); ok(await panelK() === 'help', '❓ = 조작 도움 창'); } await closeAll();

      console.log('② 처음 상황마다 한 줄(한 번만)');
      await ev(() => SM_TOWN.tips.reset()); await age(10000);
      await lock(true); await sec(); { const i = await T(), o = await ev(OVER); ok(i.cur === 'mouse' && /Tab/.test(i.text), '처음 마우스 잠김 = 「' + i.text + '」'); ok(o.hit.length === 0, '안내 자리 ' + JSON.stringify(o.tip) + ' 겹침 ' + (o.hit.join(',') || '0')); }
      await shot('tip_mouse');
      await age(10000); await sec(); { const i = await T(); ok(!i.cur && i.seen.mouse, '시간이 지나면 내려가고 봤음 기록'); }
      await lock(false); await lock(true); await sec(); ok(!(await T()).q.includes('mouse'), '다시 잠겨도 마우스 안내 X(한 번만)'); await lock(false);
      console.log('③ 겹침·간격·5분 셋');
      await ev(() => { const B = SM_TOWN.game().S.bag; B['🍓'] = (B['🍓'] || 0) + 1; }); await sec(); { const i = await T(); ok(!i.cur && i.q.includes('bag'), '가방 첫 물건 = 줄 섬 · 20초 간격 안 = 기다림'); }
      await age(21000); await sec(); { const i = await T(); ok(i.cur === 'bag' && /I/.test(i.text), '20초 뒤 = 「' + i.text + '」'); }
      await ev(() => SM_TOWN.menu()); await W8(200); await sec(); { const i = await T(); ok(!i.cur && !i.seen.bag && i.q[0] === 'bag', '창이 열리면 내려감 · 1.5초 전이라 봤음 X · 맨 앞에 다시'); }
      await closeAll(); await sec(); ok(!(await T()).cur, '창이 닫힌 바로 뒤엔 X(1.5초 기다림)'); await W8(1700); await sec(); ok((await T()).cur === 'bag', '창이 닫히고 1.5초 뒤 다시 뜸');
      await p.keyboard.press('KeyI'); await W8(300); { const i = await T(); ok(!i.cur && i.seen.bag, '안내대로 I를 누름 = 바로 내려가고 봤음'); } await closeAll();
      await ev(() => SM_TOWN.tips.want('help')); await sec(); ok(!(await T()).cur, '앞 안내 뒤 20초 안 = 다음 안내 X'); await age(21000); await sec(); { const i = await T(); ok(i.cur === 'help' && /H/.test(i.text), '「' + i.text + '」'); } await age(10000); await sec();
      await ev(() => SM_TOWN.hud.unlock('map')); await W8(4600); await age(21000); await sec(); { const i = await T(); ok(!i.cur && i.q.includes('u:map') && i.shows5 === 3, '5분에 셋을 넘으면 기다림(지금 ' + i.shows5 + ')'); }
      await age(300000); await sec(); { const i = await T(), o = await ev(OVER); ok(i.cur === 'u:map' && /새로 생겼어요/.test(i.text) && /M/.test(i.text), '막마다 열림 = 「' + i.text + '」'); ok(o.hit.length === 0, '겹침 ' + (o.hit.join(',') || '0')); } await shot('tip_unlock_map'); await age(10000); await sec();
      await p.keyboard.press('KeyH'); await W8(400); ok(await ev(() => !!document.querySelector('.twn-p .hp-r[data-hk="map"] .hp-new')), '도움 창: 막 열린 큰 지도에 「새로」'); await ev(() => { const r = document.querySelector('.twn-p .hp-r[data-hk="map"]'); if (r) r.scrollIntoView({ block: 'center' }); }); await shot('help_new'); await closeAll(); await p.keyboard.press('KeyH'); await W8(400); ok(await ev(() => !document.querySelector('.twn-p .hp-new') && !!document.querySelector('.twn-p .hp-r[data-hk="map"]')), '다시 열면 「새로」 없음 · 큰 지도 줄은 그대로'); await closeAll();
      console.log('④ 자전거·정류장·비·맴돎·밤');
      await ev(() => { SM_TOWN.tips.reset(); for (const k of ['bag', 'help', 'mouse']) SM_TOWN.tips.used(k); }); await age(10000);   /* 이 묶음에서 볼 것만 남김(게임 틱이 스스로 다른 안내를 띄우지 않게) */
      { const t0 = Date.now(); await p.keyboard.down('ShiftLeft'); await p.keyboard.down('KeyW'); let w = 0, k = 0;
        while (Date.now() - t0 < 70000 && w <= 100) { await ev(n => { const P = SD2.map.player.pos(), a = n * 1.9; SD2.map.player.lookAt([P.x + Math.sin(a) * 40, P.z + Math.cos(a) * 40]); }, k++); await W8(2500); w = (await T()).walk; }
        await p.keyboard.up('KeyW'); await p.keyboard.up('ShiftLeft'); console.log('   걸은 거리 ' + w + 'm · ' + Math.round((Date.now() - t0) / 1000) + '초'); await W8(300);
        const i = await waitCur('bike'); ok(w > 100 && i.cur === 'bike' && /B/.test(i.text), '걸어서 100m = 「' + i.text + '」'); }
      await shot('tip_bike'); await p.keyboard.press('KeyB'); await W8(500); { const i = await T(), on = await ev(() => SM_TOWN.indoor.state().bike); ok(on && !i.cur && i.seen.bike, 'B를 누름 = 자전거 · 안내는 봤음'); } await p.keyboard.press('KeyB'); await W8(400);
      await ev(() => SM_TOWN.hud.unlock('bus')); await W8(4600); { const sp = await ev(() => SM_TOWN.tips.spots()); ok(sp.bus.length > 0, '정류장 ' + sp.bus.length + '곳');
        const s = sp.bus[0]; await age(21000); await ev(([x, z]) => { SD2.map.player.teleport([x + 3, SM_TOWN.ground(x + 3, z) + 0.1, z]); SD2.map.player.lookAt([x, z]); }, s); await W8(1200);
        const i = await waitCur('bus'), o = await ev(OVER); ok(i.cur === 'bus' && /정류장/.test(i.text) && /E/.test(i.text), '정류장 곁 = 「' + i.text + '」'); ok(o.hit.length === 0, '겹침 ' + (o.hit.join(',') || '0') + ' (E 안내 위)'); await shot('tip_bus'); await age(10000); await sec(); }
      await age(21000); await ev(() => SM_TOWN.weather('rain')); await W8(1200); { const i = await waitCur('umb'); ok(i.cur === 'umb' && /U/.test(i.text), '처음 비 = 「' + i.text + '」'); }
      await shot('tip_umb'); await p.keyboard.press('KeyU'); await W8(400); { const i = await T(); ok(!i.cur && i.seen.umb, 'U = 우산 펴고 안내는 봤음'); } await p.keyboard.press('KeyU'); await ev(() => SM_TOWN.weather('clear')); await W8(300);
      await age(301000); await ev(() => SM_TOWN.pathOff());
      { const c = await ev(() => { const P = SD2.map.player.pos(); return [P.x, P.z]; }); const t0 = Date.now(); for (let k = 0; k < 200; k++) { const i = await ev(([cx, cz, a]) => { const x = cx + Math.sin(a) * 10, z = cz + Math.cos(a) * 10; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.1, z]); return SM_TOWN.tips.info(); }, [c[0], c[1], k * 0.3]); if (i.q.includes('lost') || i.cur === 'lost') break; await W8(480); }
        console.log('   맴돈 시간 ' + Math.round((Date.now() - t0) / 1000) + '초(반지름 10m · 판정 = 1분 안 90m 넘게 · 처음 자리 25m 안)');
        const i = await waitCur('lost'); ok(i.cur === 'lost' && /J/.test(i.text), '같은 곳을 맴돎 = 「' + i.text + '」'); await shot('tip_lost'); await age(10000); await sec(); }
      await age(301000); await ev(() => SM_TOWN.game().syncPhase('night')); await W8(1200); { const i = await waitCur('sleep'); ok(i.cur === 'sleep' && /밤/.test(i.text), '첫 밤 = 「' + i.text + '」'); } await age(10000); await sec(); await ev(() => SM_TOWN.game().syncPhase('day'));
      console.log('⑤ 끄기 · 30분 흉내');
      await p.keyboard.press('KeyH'); await W8(400); await ev(() => document.querySelector('.twn-p [data-hp="tips"]').click()); await W8(300); ok((await T()).off, '도움 창 「한 줄 안내 끄기」 = 꺼짐'); await closeAll();
      await ev(() => { SM_TOWN.tips.reset(); for (const k of ['bus', 'subway', 'mouse', 'lost', 'sleep', 'umb', 'bike', 'help']) SM_TOWN.tips.used(k); }); await age(30000); await sec(); ok(!(await T()).cur, '꺼져 있으면 가방 안내도 X');   /* 가방만 남김(정류장 곁이면 버스가 먼저라서) */
      await ev(() => SM_TOWN.menu()); await W8(300); await ev(() => document.querySelector('.twn-p [data-a="set"]').click()); await W8(400); { const h = await ev(() => document.querySelector('.twn-p').innerText); ok(/처음 쓸 때 한 줄 안내/.test(h), '⚙ 설정에 「처음 쓸 때 한 줄 안내」'); }
      await ev(() => document.querySelector('.twn-p [data-st="tips"][data-v="1"]').click()); await W8(300); await closeAll(); ok(!(await T()).off, '설정에서 다시 켬'); await W8(1700); await sec(); { const i = await T(); ok(i.cur === 'bag' || !!i.seen.bag, '켜면 기다리던 가방 안내가 뜸(' + (i.cur || '봤음') + ')'); } await age(30000); await sec();
      { await age(30000); await ev(() => SM_TOWN.tips.reset()); await lock(true); await ev(() => { SM_TOWN.weather('rain'); SM_TOWN.game().syncPhase('night'); for (const k of ['bike', 'help', 'lost']) SM_TOWN.tips.want(k, k === 'lost' ? { exp: 1800000 } : null); SM_TOWN.tips.sec(); });
        for (let k = 0; k < 60; k++) await ev(() => { SM_TOWN.tips.age(30000); SM_TOWN.tips.sec(); });   /* 30초씩 60번 = 30분(그 사이 게임 틱도 그대로 돔) */
        const LG = (await T()).log, S9 = [], H9 = []; let open = null, both = 0; for (const [id, k, t] of LG) { if (k === 'show') { if (open) both++; open = id; S9.push([id, t]); } else if (k === 'seen' || k === 'back') { if (k === 'back') S9.pop(); else H9.push(t); open = null; } }
        let mx = 0; for (const [, t] of S9) mx = Math.max(mx, S9.filter(q => q[1] >= t && q[1] < t + 300).length); let gap = 1e9; for (let k = 1; k < S9.length; k++) { const h = H9[k - 1]; if (h != null) gap = Math.min(gap, S9[k][1] - h); }
        const t0 = S9.length ? S9[0][1] : 0; console.log('   30분 흉내: ' + S9.map(q => q[0] + '@' + Math.floor((q[1] - t0) / 60) + '분' + Math.round((q[1] - t0) % 60) + '초').join(' → '));
        ok(S9.length >= 5 && mx <= 3, '30분 안내 ' + S9.length + '개 · 5분 창 최대 ' + mx + '개(≤ 3)'); ok(gap >= 20, '안내가 내려간 뒤 다음 안내까지 최소 ' + Math.round(gap) + '초(≥ 20)'); ok(both === 0, '한 번에 하나(겹쳐 뜬 적 ' + both + ')'); await lock(false); await ev(() => { SM_TOWN.weather('clear'); SM_TOWN.game().syncPhase('day'); }); }
      ok(!errs.length, '페이지 오류 0 ' + errs.join(' | ')); await ctx.close(); }
    // ───── 휴대폰(iPhone 13 · 터치) ─────
    { const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 }), { p, errs } = await boot(ctx, true), ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
      const shot = async n => { if (!SHOTS) return; await W8(300); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); };
      console.log('⑥ 휴대폰');
      await ev(() => SM_TOWN.menu()); await W8(400); await ev(() => document.querySelector('.twn-p [data-a="how"]').click()); await W8(500);
      { const r = await ev(() => ({ k: document.querySelector('.twn-p').dataset.k, kbd: document.querySelectorAll('.twn-p .hp-k kbd').length, tb: document.querySelectorAll('.twn-p .hp-k .tb,.twn-p .hp-k .tj').length, mouse: !!document.querySelector('.twn-p .hp-r[data-hk="mouse"]'), keysBtn: !!document.querySelector('.twn-p [data-hp="keys"]') }));
        ok(r.k === 'help' && r.kbd === 0 && r.tb >= 3 && !r.mouse && !r.keysBtn, '터치 도움 창 = 단추 그림 ' + r.tb + ' · 키 글자 ' + r.kbd + ' · Tab 줄 X · 키 줄 단추 X'); }
      await shot('help_phone'); await p.keyboard.press('Escape'); await W8(300); await ev(() => { const e = document.querySelector('.twn-p'); if (e) e.click(); });
      await ev(() => { SM_TOWN.tips.reset(); SM_TOWN.tips.want('bike'); SM_TOWN.tips.age(10000); SM_TOWN.tips.sec(); });
      { const o = await ev(OVER); ok(o.tip && o.kbd === 0 && o.tb >= 1 && /메뉴/.test(o.text), '휴대폰 세로 한 줄 = 「' + o.text + '」(키 글자 X)'); ok(o.hit.length === 0, '세로 자리 ' + JSON.stringify(o.tip) + ' 겹침 ' + (o.hit.join(',') || '0')); }
      await shot('tip_phone_port'); await p.setViewportSize({ width: 844, height: 390 }); await W8(1200);
      { const o = await ev(OVER); ok(o.tip && o.hit.length === 0, '가로 자리 ' + JSON.stringify(o.tip) + ' 겹침 ' + (o.hit.join(',') || '0')); } await shot('tip_phone_land');
      ok(!errs.length, '페이지 오류 0 ' + errs.join(' | ')); await ctx.close(); }
  } catch (e) { console.error(e); fails++; } finally { await b.close(); }
  console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
