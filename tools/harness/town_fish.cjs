// 🎣 줄 낚시 시험(FISH-2 · 차례표 12줄 · docs/systems/town_jobs2.md 「🎣 줄 낚시」): node tools/harness/town_fish.cjs [마을=ourtown] [포트=8002] [--before]
//   어부 E → 줄 당기기 놀이(타이밍 막대 0) · 봇이 ← →로 줄다리기 한 판(물고기가 당기는 반대쪽 · 줄 칸이 빨개지면 손을 뗌) · 첫 동작 10초 안 · 판 60초 안
//   썰물·밀물에 같은 자리(방파제 끝 · 갯지렁이)에서 다른 고기 · 꼬임 사다리(잘한 판 셋 → 다음 꼬임 · 판 뒤 한 줄) · 도감 = 낚은 것만 · 하루 한도(일터 셋 = 연습 판 · 도구 가방 둘)
//   도구 낚싯대(3)도 찌가 쏙 → 누르면 같은 줄다리기 → 낚았어요 → 놓아주기(실험 release) · 페이지 오류 0 · 캡처 = scratchpad/fish_shots
//   --before = 지금 화면만 찍고 끝(갈아 끼우기 전 확인용) · 브라우저는 brun.sh 한 자리로 돌림(동시에 하나)
const { chromium } = require('playwright');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOT = process.env.FISH_SHOTS || '/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/3596a208-fd90-4cd5-b160-00ac62075cec/scratchpad/fish_shots';
const BEFORE = process.argv.includes('--before');
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), shot = n => p.screenshot({ path: SHOT + '/' + n + '.png' });
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? P.textContent.slice(0, 120) : ''; });
    const closeP = () => ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); });
    const toast = () => ev(() => { const t = document.getElementById('toast'); return t && t.getClientRects().length ? t.textContent : ''; });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.tools && SM_TOWN.game && SM_TOWN.rules && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await closeP(); await p.keyboard.press('Escape'); await W8(500);
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 12 * 60; if (SD2.map.time) SD2.map.time('day'); }); await ev(() => SM_TOWN.rules.wx('clear'));
    const hot = await ev(() => SD2.map.interact.list().filter(h => !h.off && /부두 낚시|Fish at the pier/.test(h.label)).map(h => ({ x: h.x, y: h.y, z: h.z, label: h.label }))[0] || null);
    ok(!!hot, '어부 E 자리 — ' + (hot && hot.label)); if (!hot) throw new Error('어부 없음');
    const ready = async () => { for (let i = 0; i < 14; i++) { if (await panel()) { await closeP(); await W8(300); if (await panel()) await p.keyboard.press('Escape'); await W8(300); } else if (await ev(() => !!document.querySelector('.twn-lvup') || !!document.querySelector('.twn-play'))) await W8(500); else return; } };   /* 레벨 보상·새 도구 창이 먼저 닫히게 */
    const toHot = () => ready().then(() => ev(h => { const M = SD2.map, g = M.q.groundAt(h.x + 0.8, h.z, h.y + 2); M.player.teleport([h.x + 0.8, g + 0.05, h.z]); M.player.lookAt([h.x, h.z]); }, hot)).then(() => W8(500));
    if (BEFORE) { await toHot(); await p.keyboard.press('KeyE'); await W8(700); await shot('before_1_open');
      for (let i = 0; i < 30; i++) { await W8(150); if (await ev(() => !!document.querySelector('.twn-play .wt.on'))) { await shot('before_2_bite'); await p.keyboard.down('KeyE'); await W8(900); await shot('before_3_reel'); await p.keyboard.up('KeyE'); break; } }
      return; }
    // 낚싯대를 먼저 받아 둠(어부 곁 '새 도구!' 창이 놀이 창 위에 겹치지 않게)
    await ev(() => SM_TOWN.tools.give('rod')); for (let i = 0; i < 16; i++) { const q = await ev(() => SM_TOWN.tools.info()); if (!q.ovl && !q.pend.length) break; await W8(500); }
    const tideAt = low => ev(lo => { const G = SM_TOWN.game().S, d = G.day; const lowAt = 300 + ((d * 50 + 250) % 745); G.min = lo ? Math.max(360, lowAt) : (lowAt + 372 <= 1380 ? lowAt + 372 : lowAt - 372); return G.min; }, low);
    const lad = (lv, good) => ev(([lv9, g9]) => { const S = SM_TOWN.game().S; S.fishL = { lv: lv9, good: g9 || 0, n: 0, log: (S.fishL && S.fishL.log) || {} }; S.uses = {}; }, [lv, good]);
    const st = () => ev(() => { const el = document.querySelector('.twn-play'); if (!el) return null; const tg = el.querySelector('.tug'); return { ph: tg ? tg.dataset.ph : null, s: tg ? +tg.dataset.s || 0 : 0, t: tg ? +tg.dataset.t || 0 : 0, msg: (el.querySelector('.msg') || {}).textContent || '', end: !!el.querySelector('.pb.mg-end'), bars: el.querySelectorAll('.zone,.mk').length, pick: !!(el.querySelector('.fpk') && el.querySelector('.fpk').style.display !== 'none') }; });
    // 봇: 물고기가 당기는 반대쪽 키를 누르고 · 줄 칸이 0.8 넘으면 손을 뗐다가 0.6 아래면 다시 · 끝날 때까지
    async function bot(tag, maxS = 70) { let held = null, tight = false, t0 = Date.now(), tugAt = 0, shotT = false, lastMsg = '', endMsg = '';
      const press = k => (async () => { if (held === k) return; if (held) await p.keyboard.up(held); held = k; if (k) await p.keyboard.down(k); })();
      while (Date.now() - t0 < maxS * 1000) { const S = await st(); if (!S) break; if (S.msg) lastMsg = S.msg; if (S.end) { endMsg = S.msg; await press(null); await W8(200); continue; }
        if (S.ph === 'tug') { if (!tugAt) tugAt = Date.now(); if (S.t >= 0.8) tight = true; else if (S.t < 0.6) tight = false; await press(tight || !S.s ? null : S.s < 0 ? 'ArrowRight' : 'ArrowLeft'); if (!shotT && Date.now() - tugAt > 1500 && tag) { shotT = true; await shot(tag + '_tug'); } }
        else await press(null);
        await W8(60); }
      await press(null); return { ms: Date.now() - t0, tugAt: tugAt ? tugAt - t0 : -1, lastMsg, endMsg }; }
    const lastToast = async () => { for (let i = 0; i < 10; i++) { const t = await toast(); if (t) return t; await W8(150); } return ''; };
    // ── 1. 꼬임 1: 어부 E → 줄 당기기 · 막대 0 · 첫 동작 10초 안 · 봇 한 판 ──
    console.log('🎣 꼬임 1(잔잔한 날)'); await lad(1); await tideAt(false); await toHot();
    const bag0 = await ev(() => SM_TOWN.game().S.bag['🐟'] || 0); await p.keyboard.press('KeyE'); await W8(600); let S = await st(); const pl = await ev(() => SM_TOWN.rules.play());
    ok(!!S && pl && pl.k === 'fisher', '어부 E = 놀이 창(' + JSON.stringify(pl) + ')'); ok(S && S.bars === 0, 'fisher 갈래에 막대(zone·mk) 0 — ' + (S && S.bars));
    ok(S && !S.pick, '꼬임 1 = 고르기 없이 바로 던짐(첫 동작 빨리)');
    const head = await ev(() => { const el = document.querySelector('.twn-play'); return el ? el.querySelector('b').textContent + ' / ' + el.querySelector('small').textContent : ''; }); console.log('    창 머리: ' + head); ok(/🎣/.test(head) && /반대쪽/.test(head), '제목 = 하는 일(🎣) · 첫 줄 = 할 일(반대쪽으로 끌기)');
    let r = await bot('lv1'); const firstTug = r.tugAt + 600; ok(firstTug > 0 && firstTug < 10000, '첫 동작(걸림 → 끌기)까지 ' + (firstTug / 1000).toFixed(1) + '초(10초 안)'); ok(r.ms < 60000, '한 판 ' + (r.ms / 1000).toFixed(1) + '초(60초 안)');
    let t9 = await lastToast(); console.log('    끝 한 줄: ' + r.endMsg.slice(0, 90) + ' | 알림: ' + t9.slice(0, 90)); { const bag1 = await ev(() => SM_TOWN.game().S.bag['🐟'] || 0); ok(bag1 > bag0 && /낚았|caught/.test(r.endMsg), '봇이 줄다리기로 낚음(가방 🐟 ' + bag0 + ' → ' + bag1 + ' · 끝 한 줄에 고기 이름)'); }
    let F = await ev(() => SM_TOWN.game().S.fishL); ok(F && F.n === 1, '꼬임 장부: 판 수 ' + (F && F.n) + ' · 잘한 판 ' + (F && F.good));
    await W8(800);
    // ── 2. 사다리: 잘한 판 둘 + 한 판 = 꼬임 2 · 판 뒤 한 줄(큰 고기) ──
    console.log('📶 꼬임 사다리'); await lad(1, 2); await toHot(); await p.keyboard.press('KeyE'); await W8(600); r = await bot(null); F = await ev(() => SM_TOWN.game().S.fishL);
    ok(F.lv === 2 || F.good === 0 && F.lv === 1, '셋째 잘한 판 뒤 꼬임 ' + F.lv + ' (끝 한 줄: ' + r.endMsg.slice(0, 70) + ')'); if (F.lv === 2) ok(/큰 고기|big fish/.test(r.endMsg), '판 뒤 한 줄 = 다음 꼬임 알림');
    await W8(800);
    // ── 3. 꼬임 3 물때: 봄 · 방파제 끝 + 갯지렁이 · 밀물/썰물에 다른 고기 ──
    console.log('🌊 물때 맞추기(꼬임 3)'); await ev(() => SM_TOWN.rules.season('spring')); await W8(4000);
    const caughtAt = async (low, tag) => { await lad(3); await ev(() => { const S9 = SM_TOWN.game().S; for (const k of Object.keys(S9.dex)) if (k.startsWith('fish:')) delete S9.dex[k]; }); const m = await tideAt(low); await toHot(); await p.keyboard.press('KeyE'); await W8(600);
      let s9 = await st(); if (!s9) console.log('    (창 없음: play ' + JSON.stringify(await ev(() => SM_TOWN.rules.play())) + ' · 창 ' + (await panel()).slice(0, 60) + ' · 알림 ' + (await toast()).slice(0, 80) + ' · 가까운 E ' + (await ev(() => SD2.near())) + ')'); ok(s9 && s9.pick, (low ? '썰물' : '밀물') + ' — 고르기 창(물때·자리·미끼) 보임');
      const tideTxt = await ev(() => (document.querySelector('.twn-play .tide') || {}).textContent || ''); ok(low ? /썰물/.test(tideTxt) : /밀물/.test(tideTxt), '창 안에 물때 자료 — ' + tideTxt.slice(0, 50));
      await ev(() => { document.querySelector('.twn-play [data-sp="deep"]').click(); document.querySelector('.twn-play [data-bt="worm"]').click(); }); if (tag) await shot(tag + '_pick');
      await p.keyboard.press('KeyE'); await W8(300); r = await bot(tag); const L = await ev(() => SM_TOWN.game().S.fishL.log); return { m, log: L, end: r.endMsg }; };
    const hi = await caughtAt(false, 'lv3_high'); await W8(900); const lo = await caughtAt(true, 'lv3_low'); await W8(900);
    const ids = (L, k) => Object.keys(L).filter(q => q.includes(':' + k + ':deep')).map(q => q.split(':')[0]);
    const hiF = ids(hi.log, 'H'), loF = ids(lo.log, 'L'); console.log('    밀물(' + hi.m + '분) 깊은 곳: ' + hiF.join(',') + ' · 썰물(' + lo.m + '분) 깊은 곳: ' + loF.join(','));
    ok(hiF.length && loF.length && loF.some(f => !hiF.includes(f)), '같은 자리(방파제 끝·갯지렁이)인데 썰물엔 다른 고기 — 밀물 ' + hiF.join(',') + ' / 썰물 ' + loF.join(','));
    { const near = await p.evaluate(async () => { const m = await import('/v2/games/town_fish.js?v=1'); return { hi: (m.fishAt('spring', false, 'near', 'worm', null, 0).f || {}).id, lo: (m.fishAt('spring', true, 'near', 'worm', null, 0).f || {}).id, win: m.fishAt('winter', false, 'near', 'worm', null, 0).why, sum: (m.fishAt('summer', false, 'deep', 'worm', null, 0).f || {}).id, aut: (m.fishAt('autumn', false, 'deep', 'shrimp', null, 0).f || {}).id }; });
      ok(near.hi && near.lo && near.hi !== near.lo, '가까운 얕은 물: 밀물 ' + near.hi + ' / 썰물 ' + near.lo); ok(near.win === 'cold', '겨울 얕은 물 = 고기 없음(차가워 깊은 곳 · ' + near.win + ')'); ok(near.sum !== near.aut, '계절마다 다른 고기(여름 ' + near.sum + ' · 가을 ' + near.aut + ')'); }
    // ── 4. 도감 = 낚은 것만(빈칸 X) ──
    { const dx = await ev(() => { const D = SM_TOWN.game().S.dex; return Object.keys(D).filter(k => k.startsWith('fish:')); }); ok(dx.length >= 1, '도감에 낚은 고기 ' + dx.join(',')); }
    // ── 5. 꼬임 4 바람 · 판 셋 뒤 하루 한도(연습 판) ──
    console.log('💨 꼬임 4 · 하루 한도'); await ev(() => SM_TOWN.rules.season('summer')); await W8(3000); await lad(4); await tideAt(false); await ev(() => { SM_TOWN.game().S.uses = {}; });
    await toHot(); await p.keyboard.press('KeyE'); await W8(600); await ev(() => { const b9 = document.querySelector('.twn-play [data-sp="deep"]'); if (b9) b9.click(); }); await p.keyboard.press('KeyE'); await W8(200);
    { const wd = await ev(() => (document.querySelector('.twn-play .wd') || {}).textContent || ''); ok(/바람|wind/.test(wd), '꼬임 4 = 바람 표시 ' + wd); } r = await bot('lv4'); console.log('    바람 판 끝: ' + r.endMsg.slice(0, 80));
    for (let i = 0; i < 2; i++) { await W8(900); await toHot(); await p.keyboard.press('KeyE'); await W8(500); await ev(() => SM_TOWN.rules.playEnd(1)); await W8(700); }
    await W8(900); await toHot(); await p.keyboard.press('KeyE'); await W8(600); { const q = await ev(() => SM_TOWN.rules.play()); ok(q && q.pr, '같은 일터 넷째 판 = 연습 판(하루 한도) ' + JSON.stringify(q)); } await p.keyboard.press('Escape'); await W8(700);
    // ── 6. 도구 낚싯대 = 같은 줄다리기 ──
    console.log('🧰 도구 낚싯대'); await tideAt(false);
    const W = await ev(h => { for (let r9 = 2; r9 < 40; r9 += 1) for (let a = 0; a < 32; a++) { const x = h.x + Math.cos(a / 32 * 6.2832) * r9, z = h.z + Math.sin(a / 32 * 6.2832) * r9; if (SM_TOWN.sd(x, z) > 0.8 && SM_TOWN.seaSd && SM_TOWN.seaSd(x, z) > 0.5) { for (let b9 = 0; b9 < 16; b9++) { const u = Math.cos(b9 / 16 * 6.2832), v = Math.sin(b9 / 16 * 6.2832), wx9 = x + u * 5, wz9 = z + v * 5; if (SM_TOWN.seaSd(wx9, wz9) < -1) return { x, z, wx: wx9, wz: wz9, sea: true }; } } } return null; }, hot);
    const W2 = W || await ev(() => { for (let r9 = 40; r9 < 1400; r9 += 24) for (let a = 0; a < 48; a++) { const x = Math.cos(a / 48 * 6.2832) * r9, z = Math.sin(a / 48 * 6.2832) * r9; const d = SM_TOWN.sd(x, z); if (d > 1.6 && d < 3.2 && !SM_TOWN.inSchool(x, z)) { for (let b9 = 0; b9 < 16; b9++) { const u = Math.cos(b9 / 16 * 6.2832), v = Math.sin(b9 / 16 * 6.2832), wx9 = x + u * 5.5, wz9 = z + v * 5.5; if (SM_TOWN.sd(wx9, wz9) < -1.5) return { x, z, wx: wx9, wz: wz9, sea: false }; } } } return null; });
    if (!W2) ok(false, '물가 자리 못 찾음'); else { console.log('    물가: ' + (W2.sea ? '바다' : '강·연못'));
      await ev(w => { SD2.map.player.teleport([w.x, SM_TOWN.ground(w.x, w.z) + 0.05, w.z]); SD2.map.player.lookAt([w.wx, w.wz]); }, W2); await W8(500);
      let I = await ev(() => SM_TOWN.tools.info()); if (I.shown !== 'rod') { await p.keyboard.press('Digit3'); await W8(450); } await ev(w => SM_TOWN.tools.aim(w.wx, w.wz), W2);
      await p.keyboard.down('KeyF'); await W8(120); await p.keyboard.up('KeyF'); await W8(300);
      for (let i = 0; i < 20; i++) { I = await ev(() => SM_TOWN.tools.info()); if (!I.fish || I.fish.ph !== 'fly') break; await W8(200); }
      ok(!!I.fish, '낚싯대 던짐(' + (I.fish && I.fish.ph) + ')'); await ev(() => SM_TOWN.tools.bite()); await W8(400); I = await ev(() => SM_TOWN.tools.info());
      if (I.fish && I.fish.ph === 'bite') { await ev(() => { SM_TOWN.game().S.uses['tool:fish'] = 2; }); await p.keyboard.down('KeyF'); await W8(120); await p.keyboard.up('KeyF'); await W8(1200);
        const q = await ev(() => SM_TOWN.rules.play()), s9 = await st(); ok(q && q.k === 'rod' && s9 && s9.bars === 0, '찌가 쏙 → 누르면 같은 줄다리기 창(막대 0) ' + JSON.stringify(q));
        r = await bot('tool'); await W8(900); const pn = await panel(); ok(/낚았|caught/.test(pn), '도구 줄다리기로 낚음 — ' + pn.slice(0, 40)); await shot('tool_catch');
        ok(await ev(() => { const b9 = document.querySelector('.twn-p [data-a="bag"]'); return !!b9 && b9.disabled; }), '도구 하루 가방 몫(두 마리) 다 차면 가방 단추 잠김');
        await ev(() => { const b9 = document.querySelector('.twn-p [data-a="rel"]'); if (b9) b9.click(); }); await W8(900); ok((await ev(() => SM_TOWN.toolRec())).release >= 1, '놓아주기 = 실험 표 release 기록'); }
      else ok(false, '입질 안 옴 — ' + JSON.stringify(I.fish) + ' ' + (await toast()).slice(0, 60)); }
  } catch (e) { fails.push('예외 ' + e.message.slice(0, 160)); console.log('  ✗ 예외 ' + e.message.slice(0, 300)); }
  finally { ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : '')); await b.close(); console.log((fails.length ? '❌ ' + fails.length + '개 실패' : '✅ 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); }
})();
