// 🧂 염전 꼬임 사다리 시험(SALT-2 · 단계 4 「28 사다리·소금」 · docs/systems/town_phase4.md): node tools/harness/town_salt.cjs [마을=ourtown] [포트=8002]
//   꼬임 넷(천일염·자염·토판염·꽃소금) = 손동작이 서로 다름 · 막대(zone·mk·bar·pgb) 0 · 봇 한 판 60초 안 · 판 뒤 한 줄
//   사다리(잘한 판 셋 → 다음 꼬임) · 세상 조건(지금 비 = 졸이기 · 어제 큰비 = 꽃소금) · 소금물 창고에 들이기 판단 · 만든 소금 → 장터 공급(S.sim.salt) · 페이지 오류 0
//   캡처 = scratchpad/econ_shots · 브라우저는 brun.sh 한 자리로
const { chromium, RENDER } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOT = process.env.ECON_SHOTS || '/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/3596a208-fd90-4cd5-b160-00ac62075cec/scratchpad/econ_shots';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), shot = async n => { if (RENDER) await p.screenshot({ path: SHOT + '/' + n + '.png' }); };   /* FAST-1: 그리기 끔이면 사진 건너뜀(--render면 찍음) */
    const closeP = () => ev(() => { for (let k = 0; k < 3; k++) { const P = document.querySelector('.twn-p'); if (!P) return; const b9 = P.querySelector('[data-a="x"]') || P.querySelector('button.sub') || P.querySelector('button'); if (b9) b9.click(); else return; } });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.salt && SM_TOWN.game && SM_TOWN.rules && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await closeP(); await p.keyboard.press('Escape'); await W8(500);
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); });
    const wk = await ev(() => SM_TOWN.rules.wk('saltpan')); ok(!!wk, '염전 일꾼 있음'); if (!wk) throw new Error('염전 없음');
    await ev(w => { const x = w.x + 1.6, z = w.z + 1.2; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.lookAt([w.x, w.z]); }, wk); await W8(600);
    const setL = o => ev(o9 => { const S = SM_TOWN.game().S; S.uses = {}; SM_TOWN.salt.set(Object.assign({ good: 0, n: 0, nw: 0 }, o9)); }, o);
    const view = () => ev(() => { const el = document.querySelector('.twn-play'); if (!el) return null; const mg = el.querySelector('.mg'); return { title: el.querySelector('b').textContent, task: el.querySelector('small').textContent, hand: mg.dataset.hand, lv: +mg.dataset.lv, bars: el.querySelectorAll('.zone,.mk,.bar,.pgb,.pg').length, msg: (el.querySelector('.msg') || {}).textContent || '' }; });
    const runAuto = async (tag) => { const t0 = Date.now(); let last = '', shotMid = false; await ev(() => SM_TOWN.salt.auto());
      let dbgT = 0; while (Date.now() - t0 < 70000) { const v = await view(); if (!v) break; if (v.msg) last = v.msg; if (await ev(() => !!document.querySelector(".twn-p"))) { await closeP(); }   /* 솜씨 오름·새 도구 창이 놀이를 멈추면 닫음(아이가 닫는 것과 같음) */ if (Date.now() - dbgT > 5000) { dbgT = Date.now(); console.log("      · " + JSON.stringify(await ev(() => ({ st: SM_TOWN.salt.now() && SM_TOWN.salt.now().st, ov: [...document.querySelectorAll(".twn-lvup,.twn-p")].map(e => e.className) })))); } if (!shotMid && tag && Date.now() - t0 > 2500) { shotMid = true; await shot(tag + '_mid'); } await W8(150); }
      return { ms: Date.now() - t0, last }; };
    const toast = () => ev(() => { const t = document.getElementById('toast'); return t && t.getClientRects().length ? t.textContent : ''; });
    // ── 꼬임 넷: 손동작 · 막대 0 · 한 판 60초 안 ──
    const hands = {}, NM = { 1: '천일염', 2: '소금물 졸이기', 3: '토판염', 4: '꽃소금' };
    for (const lv of (process.env.SALT_ONLY ? [+process.env.SALT_ONLY] : [1, 2, 3, 4])) { console.log('🧂 꼬임 ' + lv + ' ' + NM[lv]); await setL({ lv }); const salt0 = await ev(() => SM_TOWN.game().S.bag['🧂'] || 0);
      await ev(() => SM_TOWN.rules.work('saltpan')); await W8(700); const v = await view(), now = await ev(() => SM_TOWN.salt.now());
      ok(!!v && now && now.sx && now.sx.lv === lv, '꼬임 ' + lv + ' 판이 열림(' + JSON.stringify(now && now.sx) + ')'); if (!v) continue;
      console.log('    제목: ' + v.title + ' / ' + v.task + ' · 손: ' + v.hand + ' · 처음 말: ' + v.msg.slice(0, 60)); hands[lv] = v.hand;
      ok(v.bars === 0, '막대·게이지 0 (' + v.bars + ')'); ok(v.title.includes(NM[lv]), '제목 = 그 꼬임 이름'); await shot('salt' + lv + '_open');
      const r = await runAuto('salt' + lv); const salt1 = await ev(() => SM_TOWN.game().S.bag['🧂'] || 0), t9 = await toast();
      console.log('    끝: ' + r.last.slice(0, 110) + ' | 알림: ' + t9.slice(0, 70)); ok(r.ms < 60000, '봇 한 판 ' + (r.ms / 1000).toFixed(1) + '초(60초 안)');
      ok(salt1 > salt0, '가방 소금 ' + salt0 + ' → ' + salt1); ok(/💡|다음엔|다음 판|불을|천천히|살살/.test(r.last), '판 뒤 한 줄(사실 또는 다음에 해 볼 것)'); await W8(900); }
    const hs = Object.values(hands); ok(hs.length === 4 && new Set(hs).size === 4, '꼬임 넷 손동작이 모두 다름 — ' + hs.join(', '));
    ok(!hs.some(h => /bar|time/.test(h)), '타이밍 막대 꼴 없음');
    // ── 사다리: 잘한 판 둘 + 한 판 → 다음 꼬임 ──
    console.log('📶 사다리'); await setL({ lv: 1, good: 2, nw: 9 }); await ev(() => SM_TOWN.rules.work('saltpan')); await W8(600); { const r = await runAuto(null); const L = await ev(() => SM_TOWN.salt.lad()); ok(L.lv === 2, '셋째 잘한 판 뒤 꼬임 2 (lv ' + L.lv + ' · 끝 한 줄: ' + r.last.slice(0, 80) + ')'); ok(/달걀|진한/.test(r.last), '판 뒤 한 줄 = 다음 꼬임 알림'); }
    await W8(900);
    // ── 소금물 창고에 들이기 판단(구름이 반쯤 오면 단추) ──
    console.log('🏠 소금물 창고'); await setL({ lv: 1, nw: 0 }); await ev(() => SM_TOWN.rules.work('saltpan')); await W8(600);
    await ev(() => { const d = SM_TOWN.salt.dbg(); if (d && d.sit) { d.sit('come', 1); d.wait(); } });   /* DEPTH-2: 천일염 = 지켜보기 판단 → 먹구름 한 칸 + 한 시간 기다림 = 비 → 창고 단추 */
    { let st = null; for (let i = 0; i < 160; i++) { if (await ev(() => !!document.querySelector('.twn-p'))) await closeP(); st = await ev(() => SM_TOWN.salt.now() && SM_TOWN.salt.now().st); if (!st || st.asked) break; await W8(200); }
      const vis = await ev(() => { const b9 = document.querySelector('.twn-play .sst'); return !!b9 && b9.style.display !== 'none'; }); ok(st && st.asked && vis, '먹구름이 닿아 비가 오면 「소금물 창고에 들이기」 단추가 보임'); await shot('salt_store');
      await ev(() => { const b9 = document.querySelector('.twn-play .sst'); if (b9) b9.click(); }); await W8(4500); const L = await ev(() => SM_TOWN.salt.lad()); ok((L.brine | 0) >= 1, '창고에 들인 판이 기록됨(' + L.brine + ')'); }
    await W8(600);
    // ── 세상 조건 ──
    console.log('🌧 세상 조건'); await ev(() => SM_TOWN.rules.wx('rain')); await W8(800); await setL({ lv: 4, nw: 9, n: 0 }); await ev(() => SM_TOWN.rules.work('saltpan')); await W8(600);
    { const n = await ev(() => SM_TOWN.salt.now()); ok(n && n.sx.lv === 2, '지금 비 = 창고에서 진한 소금물 졸이기(꼬임 ' + (n && n.sx.lv) + ')'); await shot('salt_rain'); await ev(() => SM_TOWN.rules.playEnd(1)); await W8(900); }
    await ev(() => SM_TOWN.rules.wx('clear')); await W8(800); await ev(() => { SM_TOWN.mk.setR3([0, 1.1, 0], '바다'); }); await setL({ lv: 4, nw: 9, n: 0 }); await ev(() => SM_TOWN.rules.work('saltpan')); await W8(600);
    { const n = await ev(() => SM_TOWN.salt.now()), D = await ev(() => SM_TOWN.salt.day()); ok(n && n.sx.lv === 4, '어제 큰비 = 흙 섞인 소금 다시(꽃소금 · 꼬임 ' + (n && n.sx.lv) + ' · ' + JSON.stringify(D) + ')'); await ev(() => SM_TOWN.rules.playEnd(1)); await W8(900); }
    { const D = await ev(() => { SM_TOWN.mk.setR3([0, 0, 0], '바다'); return SM_TOWN.salt.day(); }); console.log('    오늘: ' + JSON.stringify(D)); }
    // ── 소금 → 장터 ──
    { const M = await ev(() => SM_TOWN.mk.sim()); ok(M.salt && M.salt.n > 0, '오늘 만든 소금 ' + (M.salt && M.salt.n) + ' = 내일 바다 장터 소금 공급'); }
  } catch (e) { fails.push('예외 ' + e.message.slice(0, 160)); console.log('  ✗ 예외 ' + e.message.slice(0, 300)); }
  finally { ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : '')); await b.close(); console.log((fails.length ? '❌ ' + fails.length + '개 실패' : '✅ 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); }
})();
