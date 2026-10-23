// 마을 배경 음악 시험(WAKE-1a · 사용자 10-19 '이거 완전 수면제 게임이다'): node tools/harness/town_music.cjs [마을=ourtown] [포트=8002]
//   ① 곡 자료 점검(마디 칸 수·음·화음·소리 칸 6 이하) · 때·곳 → 곡 표 · 홍보판(SM_PROMO) 기본 꺼짐
//   ② 마을: 첫 키 누름 뒤 켜짐 · 낮 → 해 질 녘 → 밤 → 비 → 맑음 바뀔 때 곡이 바뀜(≈2초) · 실내 = 작게·먹먹하게(곡은 그대로) · 놀이 = 빠른 곡 · 동시 소리 6 이하
//   ③ 탭 숨김 = 멈춤(예약 0) → 다시 보임 = 이어서 · ☰ 메뉴 '음악 끄기' = 꺼짐 + 이 기기에 기억(새로 열어도 꺼짐) → '음악 켜기' · 마을 나가기 = 소리 장치 닫힘 · 페이지 오류 0
//   읽는 것 = SM_TOWN.music(읽기 전용 · town_music.js info)
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const BASEU = 'http://127.0.0.1:' + PORT, URL = BASEU + '/v2/?town=' + ID + '&adapt=0';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: false, isActive: false }, configurable: true }); } catch (e) { /* */ } });   /* playwright evaluate는 사용자 동작으로 셈 → '아직 아무것도 안 누름'을 흉내 */
    await ctx.addInitScript(() => { const A = window.AudioContext; if (!A) return; window.__ACS = []; window.AudioContext = class extends A { constructor(...a) { super(...a); window.__ACS.push(this); } }; });
    const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 160)); });
    const W8 = ms => p.waitForTimeout(ms), mus = () => p.evaluate(() => SM_TOWN.music);
    const until = async (fn, arg, ms = 6000) => { const t = Date.now(); for (;;) { const r = await p.evaluate(fn, arg); if (r || Date.now() - t > ms) return { r, ms: Date.now() - t }; await W8(150); } };

    // ① 곡 자료 — 마을 밖 빈 쪽에서 모듈만
    console.log('① 곡 자료');
    await p.goto(BASEU + '/v2/games/');
    const U = await p.evaluate(async () => { const M = await import('/v2/games/town_music.js'); const S = Object.keys(M.SONGS);
      const moods = { day: M.moodOf({}), dusk: M.moodOf({ night: 0.5 }), night: M.moodOf({ night: 1 }), rain: M.moodOf({ wx: 'rain' }), snow: M.moodOf({ wx: 'snow' }), play: M.moodOf({ play: 1 }), fest: M.moodOf({ fest: 1, play: 1 }), nightRain: M.moodOf({ night: 1, wx: 'rain' }) };
      localStorage.removeItem('twn-music-p'); localStorage.removeItem('twn-music'); window.SM_PROMO = true; const a = M.createMusic({}), pa = a.info(); a.dispose(); window.SM_PROMO = false; const c = M.createMusic({ state: () => ({}) }), pc = c.info(); dispatchEvent(new KeyboardEvent('keydown')); await new Promise(r => setTimeout(r, 900)); let dk = 'ok'; try { c.duck(0.3); } catch (e) { dk = e.message; } const pd = c.info(); c.dispose();
      const r = await M.renderMood('day', 12); return { songs: S, bpm: S.map(k => M.SONGS[k].bpm), chk: M.check(), moods, promo: pa.on, plain: pc.on, duck: dk, dctx: pd.ctx, dsong: pd.song, ren: { notes: r.notes, vmax: r.voicesMax, len: r.buf.duration } }; });
    console.log('   곡 ' + U.songs.length + ': ' + U.songs.map((k, i) => k + ' ' + U.bpm[i]).join(' · '));
    ok(U.songs.length >= 6, '곡 여섯(낮·해 질 녘·밤·비·놀이·잔치)'); ok(U.bpm.every(x => x >= 100 && x <= 120), 'BPM 100~120'); ok(!U.chk.length, '자료 점검 통과 ' + U.chk.join(' | '));
    ok(JSON.stringify(U.moods) === JSON.stringify({ day: 'day', dusk: 'dusk', night: 'night', rain: 'rain', snow: 'snow', play: 'play', fest: 'fest', nightRain: 'night' }), '때·곳 → 곡 표 ' + JSON.stringify(U.moods));
    ok(U.promo === false && U.plain === true, '홍보판 = 기본 꺼짐 · 우리 학교용 = 기본 켜짐');
    ok(U.duck === 'ok' && U.dctx === 'running' && U.dsong === 'day', '키 누름 → 켜짐 → duck(잠깐 작게) 오류 없음 (' + U.dctx + ' · ' + U.dsong + ')');
    ok(U.ren.notes > 50 && U.ren.vmax <= 6, '오프라인 합성 12초 — 음 ' + U.ren.notes + ' · 동시 최대 ' + U.ren.vmax);

    // ② 마을
    console.log('② 마을 — 때·곳');
    await p.evaluate(() => { localStorage.removeItem('twn-music'); });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2, null, { timeout: 240000 }); await W8(1500);
    { const m0 = await mus(); ok(m0.on && m0.ctx == null && m0.notes === 0, '누르기 전 = 소리 장치 없음(자동 재생 규칙) · 켜짐 기본값 ' + m0.on + (m0.ctx ? ' — ' + m0.ctx : '')); }
    await p.evaluate(() => { SD2.map.time('day'); SM_TOWN.weather('clear'); });
    await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b) b.click(); }); await p.keyboard.press('Escape'); await W8(300);
    await p.keyboard.press('Shift');
    let w = await until(() => { const m = SM_TOWN.music; return m.ctx === 'running' && m.song === 'day' && m.notes > 0; }); const M1 = await mus();
    ok(w.r, '첫 키 누름 뒤 켜짐 — 낮 곡 「' + (M1.title || [])[0] + '」 ' + M1.section + ' ' + M1.bar + '마디 · 선율 ' + M1.lead + ' (' + w.ms + 'ms)');
    ok(M1.level > 0 && M1.level <= 0.35, '크기 낮게 ' + M1.level);
    const step = async (lab, fn, want, wantSong) => { await p.evaluate(fn); const r = await until(([m, s]) => SM_TOWN.music.mood === m && SM_TOWN.music.song === s, [want, wantSong], 6000); const M = await mus(); ok(r.r, lab + ' → ' + want + ' 「' + (M.title || [])[0] + '」 (' + (r.ms / 1000).toFixed(1) + '초)'); return M; };
    await step('해 질 녘', () => SD2.map.time('sunset'), 'dusk', 'dusk');
    await step('밤', () => SD2.map.time('night'), 'night', 'night');
    await step('낮 + 비', () => { SD2.map.time('day'); SM_TOWN.weather('rain'); }, 'rain', 'rain');
    const M2 = await step('비 그침', () => SM_TOWN.weather('clear'), 'day', 'day');
    await W8(2500); const lvOut = (await mus()).level;
    // 실내
    const L = await p.evaluate(() => { const G = SM_TOWN.game(); G.S.min = 11 * 60; return SM_TOWN.indoor.list().filter(q => q.kind === 'shop').slice(0, 1); });
    if (L.length) { await p.evaluate(id => SM_TOWN.indoor.enter(id), L[0].id); await until(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, 9000);
      const r = await until(() => SM_TOWN.music.indoor && SM_TOWN.music.filter < 3000, null, 4000); const Mi = await mus();
      ok(r.r && Mi.level < lvOut && Mi.song === 'day', '실내(' + L[0].name + ') = 작게 ' + lvOut + ' → ' + Mi.level + ' · 먹먹하게 ' + Mi.filter + 'Hz · 곡 그대로 ' + Mi.song);
      await p.evaluate(() => SM_TOWN.indoor.exit()); await until(() => !SM_TOWN.indoor.on, null, 9000); const r2 = await until(() => !SM_TOWN.music.indoor && SM_TOWN.music.filter > 10000, null, 4000); ok(r2.r, '밖으로 = 다시 크게'); }
    else ok(false, '들어갈 가게 없음');
    // 놀이
    const opened = await p.evaluate(() => SM_TOWN.playK('tuho')); ok(opened, '놀이 열림(투호)');
    if (opened) { const r = await until(() => SM_TOWN.music.mood === 'play' && SM_TOWN.music.song === 'play', null, 6000); const Mp = await mus(); ok(r.r, '놀이 중 = 빠른 곡 「' + (Mp.title || [])[0] + '」 (' + (r.ms / 1000).toFixed(1) + '초)');
      await p.evaluate(() => { const x = document.querySelector('.twn-play .x'); if (x) x.click(); }); const r2 = await until(() => SM_TOWN.music.song === 'day', null, 6000); ok(r2.r, '놀이 끝 = 낮 곡으로 돌아옴'); }
    // 잔치(이야기 큰 장면): 피날레 '첫 잔치의 밤' 투호 단계 = 손님이 잔치 자리에 → 그 둘레 120m 안에서만 잔치 곡
    await p.evaluate(() => { SD2.map.time('night'); SM_TOWN.storyAt('f1', 3); }); await W8(2000); const pot = await p.evaluate(() => { const f = SM_TOWN.fest(); return f && f.guests && f.guests.length ? f.pot : null; });
    if (pot) { await p.evaluate(a => SD2.map.player.teleport([a[0] + 6, SM_TOWN.ground(a[0] + 6, a[1] + 6) + 0.3, a[1] + 6]), pot); const r = await until(() => SM_TOWN.music.song === 'fest', null, 6000); const Mf = await mus(); ok(r.r, '잔치 밤 잔치 자리 = 「' + (Mf.title || [])[0] + '」 선율 ' + Mf.lead);
      await p.evaluate(a => SD2.map.player.teleport([a[0] + 300, SM_TOWN.ground(a[0] + 300, a[1]) + 0.3, a[1]]), pot); const r2 = await until(() => SM_TOWN.music.song === 'night', null, 6000); ok(r2.r, '잔치 자리에서 300m 떨어지면 = 밤 곡'); }
    else ok(false, '잔치 손님 자리를 못 세움');
    await p.evaluate(() => { SM_TOWN.storyOff(); SD2.map.time('day'); }); await W8(500);
    await W8(2500); const M3 = await mus(); ok(M3.voicesMax <= 6, '동시 소리 최대 ' + M3.voicesMax + ' (6 이하) · 음 ' + M3.notes + ' · 바뀜 ' + M3.switches + '번 · 예약 한 번 ' + M3.pumpMs + 'ms');
    ok(M3.decks <= 2, '지난 곡 정리됨(남은 덱 ' + M3.decks + ')');

    // ③ 탭 숨김 · 끄기 기억 · 나가기
    console.log('③ 숨김·끄기·나가기');
    const hide = (h) => p.evaluate(h => { Object.defineProperty(document, 'hidden', { value: h, configurable: true }); Object.defineProperty(document, 'visibilityState', { value: h ? 'hidden' : 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }, h);
    await hide(true); await W8(700); const h1 = await mus(); await W8(1500); const h2 = await mus();
    ok(h1.ctx === 'suspended' && h2.notes === h1.notes, '탭 숨김 = 멈춤(' + h1.ctx + ' · 예약 ' + (h2.notes - h1.notes) + ')');
    await hide(false); w = await until(() => SM_TOWN.music.ctx === 'running', null, 4000); await W8(1200); ok(w.r && (await mus()).notes > h2.notes, '다시 보임 = 이어서');
    const menu = async () => { await p.evaluate(() => { const c = [...document.querySelectorAll('.gchip')].find(e => /메뉴|Menu/.test(e.textContent)); if (c) c.click(); }); await W8(500); return p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="music"]'); return b ? b.textContent : null; }); };
    const t1 = await menu(); ok(t1 === '🎵 음악 끄기', '☰ 메뉴에 「' + t1 + '」');
    await p.evaluate(() => document.querySelector('.twn-p [data-a="music"]').click()); await W8(1200);
    const off = await p.evaluate(() => ({ m: SM_TOWN.music, ls: localStorage.getItem('twn-music'), btn: (document.querySelector('.twn-p [data-a="music"]') || {}).textContent, open: (window.__ACS || []).filter(a => a.state !== 'closed').length }));
    ok(!off.m.on && off.m.ctx == null && off.ls === '0' && off.btn === '🎵 음악 켜기', '끄기 = 멈춤 + 이 기기에 기억(' + off.ls + ') · 단추 「' + off.btn + '」');
    await p.keyboard.press('Escape');
    await p.reload(); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game, null, { timeout: 240000 }); await W8(1200);
    await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b) b.click(); }); await p.keyboard.press('Escape'); await p.keyboard.press('Shift'); await W8(1500);
    const re = await mus(); ok(!re.on && re.ctx == null && re.notes === 0, '새로 열어도 꺼짐(키를 눌러도 소리 장치 X)');
    await menu(); await p.evaluate(() => document.querySelector('.twn-p [data-a="music"]').click());
    w = await until(() => SM_TOWN.music.on && SM_TOWN.music.ctx === 'running' && SM_TOWN.music.notes > 0, null, 5000); ok(w.r && (await p.evaluate(() => localStorage.getItem('twn-music'))) === '1', '다시 켜기 = 바로 소리 + 기억(1)');
    await p.keyboard.press('Escape'); await W8(300);
    const before = await p.evaluate(() => (window.__ACS || []).filter(a => a.state !== 'closed').length);
    await menu(); await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="quit"]'); if (b) b.click(); }); await W8(2500);
    const after = await p.evaluate(() => ({ town: !!window.SM_TOWN, open: (window.__ACS || []).filter(a => a.state !== 'closed').length }));
    ok(!after.town && after.open <= before - 2, '마을 나가기 = 음악·자연 소리 장치 닫힘(열린 장치 ' + before + ' → ' + after.open + ')');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } finally { await b.close(); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })().catch(e => { console.error(e); process.exit(2); });
