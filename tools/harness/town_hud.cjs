// 마을 첫 화면·진행 열림 시험(INTUIT-1 · 사용자 10-18 '동물의 숲은 이야기만 따라가도 되는데 우리 게임은 직관이 부족'): node tools/harness/town_hud.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--count]
//   첫 화면에 보이는 HUD(칩·작은 지도·칸 배지·가방·할 일 줄·나침반 띠·키 안내·위 가운데 줄)를 세고 글을 적음 — 데스크톱 1366×768 · 휴대폰 세로 390×844 → 가로 844×390(터치)
//   --count = 세기만(옛 판과 견주기) · 그 밖: 잠긴 키(M·B·I·F·J·Y)는 창을 안 엶 · unlock(키) = 그 칩만 늘고 살며시 나타남 · 이야기 안전망(다음 막에 들어서면 앞 막 키)
//   · 선생님(sm.t) = 모두 열림 · 예전 저장(hud 칸 없음) = 모두 열림 · ?all=1은 town_state.cjs가 씀
const { chromium, devices } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots'), COUNT = !!arg('count'), URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
// 보이는 HUD(겹친 것 = 바깥 하나만 · 창·조이스틱 X)
const HUD = () => { const sel = '.chip,.gchip,.twn-mini,.twn-cellb,.twn-bag,.twn-task,.twn-comp,.twn-keys,#hudGoal', out = [];
  for (const e of document.querySelectorAll(sel)) { if (e.id === 'toast' || e.id === 'hudBan' || (e.parentElement && e.parentElement.closest(sel))) continue;   /* 잠깐 뜨는 알림·배너는 셈 X */ if (!e.getClientRects().length) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
    out.push(((e.id ? '#' + e.id : '.' + [...e.classList].filter(c => /^(gchip|twn-|chip)/.test(c)).join('.')) + ' ' + (e.textContent || '').replace(/\s+/g, ' ').trim()).slice(0, 70)); }
  return out; };
async function boot(ctx, url, touch) { const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.goto(url); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game, null, { timeout: 240000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b) b.click(); }); await p.keyboard.press('Escape');
  if (touch) await p.touchscreen.tap(200, 300); await p.waitForTimeout(2600); return { p, errs }; }
const shot = async (p, n) => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
const toastT = p => p.evaluate(() => { const t = document.getElementById('toast'); return t && t.getClientRects().length ? t.textContent : ''; });
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const R = {};
  try {
    // ① 데스크톱 첫 화면(빈 기기 = 새 아이)
    { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), { p, errs } = await boot(ctx, URL); R.desk = await p.evaluate(HUD); await shot(p, 'desk_first'); console.log('데스크톱 첫 화면 ' + R.desk.length + '개'); for (const t of R.desk) console.log('   ' + t);
      if (!COUNT) { const has = await p.evaluate(() => !!(SM_TOWN.hud)); ok(has, 'SM_TOWN.hud 있음');
        if (has) { ok(!(await p.evaluate(() => SM_TOWN.hud.all())), '새 아이 = 진행 열림(모두 열림 아님)'); ok(R.desk.filter(t => /gchip/.test(t)).length === 1, '칩 = ☰ 메뉴 하나');
          for (const k of ['KeyM', 'KeyB', 'KeyF', 'KeyY']) { await p.keyboard.press(k); await p.waitForTimeout(350); const pn = await p.evaluate(() => !!document.querySelector('.twn-p')); ok(!pn, k + ' 잠김 = 창 안 열림'); if (pn) await p.keyboard.press('Escape'); }
          ok(/이야기를 따라가면/.test(await toastT(p)), '잠긴 키 = 짧은 알림');
          ok(await p.evaluate(() => ['pass', 'jobs', 'rank'].every(k => SM_TOWN.hud.keys().includes(k))), '열림 키에 여권·직업 체험·승급 미션');
          const tabs = async () => { await p.keyboard.press('KeyQ'); await p.waitForTimeout(500); const t = await p.evaluate(() => { const e = document.querySelector('.twn-p .nb-tabs'); return e ? e.textContent : null; }); await p.keyboard.press('Escape'); await p.waitForTimeout(300); return t; };
          { const t = await tabs(); ok(t != null && !/할 일|도감|솜씨|배움|여권/.test(t), '첫날 수첩 탭 = 가방·이야기·일기·앨범(가방은 처음부터 · 10-19) (' + t + ')'); }
          const n0 = (await p.evaluate(HUD)).length; await p.evaluate(() => SM_TOWN.hud.unlock('map')); await p.waitForTimeout(120);
          const m9 = await p.evaluate(() => { const c = [...document.querySelectorAll('.gchip')].find(e => /지도 \(M\)/.test(e.textContent)); return c ? { fade: c.classList.contains('twn-new'), anim: getComputedStyle(c).animationName } : null; });
          ok(m9 && m9.fade && m9.anim === 'twnNew', 'unlock(map) = 🗺 지도 칩이 살며시(투명도만) 나타남'); ok(/M을 누르면/.test(await toastT(p)), '새 친구가 없으면 소개 한 줄 = 알림'); await shot(p, 'desk_unlock_map');
          ok((await p.evaluate(HUD)).length === n0 + 1, '칩 하나만 늘어남'); await p.keyboard.press('KeyM'); await p.waitForTimeout(500); ok(await p.evaluate(() => !!document.querySelector('.twn-p')), '연 뒤 M = 큰 지도'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
          ok(/M/.test(await p.evaluate(() => document.querySelector('.twn-keys').textContent)), '키 안내 줄에 M이 더해짐');
          await p.evaluate(() => { const S = SM_TOWN.game().S; S.story = S.story || {}; S.story.cur = null; S.story.done = { ...(S.story.done || {}), p0: 1, a1_1: 1 }; }); await p.waitForTimeout(2300);
          const on = await p.evaluate(() => ({ mini: SM_TOWN.hud.on('mini'), find: SM_TOWN.hud.on('find'), wx: SM_TOWN.hud.on('wx'), bike: SM_TOWN.hud.on('bike'), bus: SM_TOWN.hud.on('bus') }));
          ok(on.bike && !on.bus, '안전망: 1막 장 하나 끝 = 다음 막 키는 안 열림 · 자전거는 프롤로그 뒤 열림(BIKE-10 10-19) ' + JSON.stringify(on)); await shot(p, 'desk_act1');
          await p.evaluate(() => { const S = SM_TOWN.game().S; S.story.cur = 'c1'; S.story.i = Math.max(0, ['n', 'pick', 'bike'].indexOf('bike')); }); await p.waitForTimeout(2300);
          ok(await p.evaluate(() => SM_TOWN.hud.on('bike') && !SM_TOWN.hud.on('tasks') && SM_TOWN.hud.on('mini') && SM_TOWN.hud.on('find') && SM_TOWN.hud.on('wx')), '안전망: 2막(자전거 단계)에 들어서면 1막 키(작은 지도·장소·날씨)가 다 열리고 2막은 자전거만'); await p.evaluate(() => { const S = SM_TOWN.game().S; S.story.cur = null; S.story.i = 0; }); await p.waitForTimeout(400);
          await p.evaluate(() => { sessionStorage.setItem('sm.t', '1'); dispatchEvent(new CustomEvent('sm-teacher')); }); await p.waitForTimeout(400); ok(await p.evaluate(() => SM_TOWN.hud.all() && SM_TOWN.hud.on('bus')), '선생님 = 모두 열림'); { const t = await tabs(); ok(/여권/.test(t || '') && /솜씨/.test(t || ''), '모두 열림 = 수첩 탭 모두'); } R.teach = (await p.evaluate(HUD)).length; await shot(p, 'desk_teacher');
          ok(!(await p.evaluate(() => SM_TOWN.hud.saved().all)), '선생님 열림은 저장하지 않음'); }
        ok(!errs.length, '오류 0 ' + errs.join(' | ')); }
      await ctx.close(); }
    // ② 예전 저장(hud 칸 없음) = 모두 열림
    if (!COUNT) { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); await ctx.addInitScript(id => { if (!sessionStorage.getItem('zz.seed')) { localStorage.setItem('sm-town-game:' + id, JSON.stringify({ v: 1, day: 3, min: 600, bag: { '🍓': 2 }, money: 300 })); sessionStorage.setItem('zz.seed', '1'); } }, ID);
      const { p, errs } = await boot(ctx, URL); const s = await p.evaluate(() => ({ all: SM_TOWN.hud.all(), saved: SM_TOWN.hud.saved() })); ok(s.all && s.saved.all === 1, '예전 저장 = 모두 열림 ' + JSON.stringify(s.saved)); R.old = await p.evaluate(HUD); await shot(p, 'desk_oldsave'); console.log('예전 저장 첫 화면 ' + R.old.length + '개'); for (const t of R.old) console.log('   ' + t);
      ok(!R.old.some(t => /바로 가기 \(J\)|장소 \(F\)|모습 \(Y\)|^#mpChip/.test(t)), '모두 열려도 J·F·Y·함께하기는 칩 X'); ok(!errs.length, '오류 0 ' + errs.join(' | ')); await ctx.close(); }
    // ③ 휴대폰 세로 → 가로(터치)
    { const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 }), { p, errs } = await boot(ctx, URL, true); R.ph = await p.evaluate(HUD); await shot(p, 'phone_first'); console.log('휴대폰 세로 첫 화면 ' + R.ph.length + '개'); for (const t of R.ph) console.log('   ' + t);
      await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(1500); R.phL = await p.evaluate(HUD); await shot(p, 'phone_land'); console.log('휴대폰 가로 첫 화면 ' + R.phL.length + '개');
      if (!COUNT) { await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => { SM_TOWN.hud.unlock(['mini', 'map', 'bag', 'tasks']); }); await p.waitForTimeout(1200); R.phU = await p.evaluate(HUD); await shot(p, 'phone_unlock4'); console.log('휴대폰 세로 넷 연 뒤 ' + R.phU.length + '개'); for (const t of R.phU) console.log('   ' + t);
        ok(R.phU.some(t => /gchip.*🗺/.test(t)), '터치: 작은 지도를 열면 🗺 칩'); ok(/새로 생겼어요/.test(await toastT(p)), '여럿을 한꺼번에 열면 한 줄 알림'); }
      ok(!errs.length, '오류 0 ' + errs.join(' | ')); await ctx.close(); }
  } finally { await b.close(); }
  console.log('\n요약: 데스크톱 ' + R.desk.length + ' · 휴대폰 세로 ' + R.ph.length + ' · 가로 ' + R.phL.length + (R.old ? ' · 예전 저장 ' + R.old.length : '') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초' + (COUNT ? '' : ' · 실패 ' + fails.length));
  process.exit(fails.length ? 1 : 0); })().catch(e => { console.error(e); process.exit(2); });
