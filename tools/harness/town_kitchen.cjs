// 🍳 바쁜 부엌 시험(KITCHEN-1 · 사용자 10-20 '다 빨간 막대잖아요' · docs/systems/town_jobs2.md 「다음 다섯 — 🍳 바쁜 부엌」): node tools/harness/town_kitchen.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   아이 집 부엌 E → 레시피북 창 → 팬케이크 → 놀이 창(바쁜 부엌) · 봇이 마우스 끌기로 한 판(재료 → 팬 · 불 중 · 「알맞아요」 → 접시) · cook 갈래에 막대(mkBar) 0
//   덜 익음·알맞음·탐 = 접시 그림·가방·요리 셈이 서로 다름 · 다섯째 판이 첫 판과 꼬임·조건 하나 이상 다름 · 잘한 판 셋 = 다음 꼬임(재료 둘 차례) · 차례가 틀리면 자국
//   하루 한도(job:kitchen 6판 → 일곱째는 솜씨 0) · 이야기 '요리' 단계 = 첫 꼬임·조건 끔·끝내기만 통과 · 페이지 오류 0
//   브라우저는 brun.sh 한 자리로 돌림(동시에 하나)
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const path = require('path'), fs = require('fs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), shot = async n => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.indoor && SM_TOWN.game && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(500);
    await ev(() => { const G = SM_TOWN.game(); G.setClock(false); G.S.min = 12 * 60; G.S.lad = {}; if (SM_TOWN.rules) SM_TOWN.rules.wx('clear'); });
    // ── 부엌 있는 아이 집 찾기 ──
    const homes = await ev(() => SM_TOWN.indoor.list().filter(q => q.kind === 'home').map(q => q.id)); let hot = null;
    for (const id of homes) { const en9 = await ev(id => SM_TOWN.indoor.enter(id), id); if (!en9) continue; try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { continue; } await W8(300);
      hot = await ev(() => { const h = SD2.map.interact.list().find(q => !q.off && /요리하기|Cook \(recipe/.test(q.label)); return h ? { x: h.x, y: h.y, z: h.z, label: h.label } : null; }); if (hot) break;
      await ev(async () => { SM_TOWN.indoor.exit(); for (let i = 0; i < 40 && (SM_TOWN.indoor.on || SM_TOWN.indoor.busy); i++) await new Promise(r => setTimeout(r, 100)); }); }
    if (!hot) { ok(false, '부엌(🍳 요리하기 E)이 있는 집을 못 찾음'); throw new Error('no kitchen'); }
    console.log('부엌 — ' + hot.label);
    await ev(() => { const G = SM_TOWN.game(); for (const e of ['🌾', '🥚', '🥛']) G.add(e, 40); SM_TOWN.bagRefresh(); });
    const K = () => ev(() => { const k = SM_TOWN.kitchen(), d = k.play && k.play.dbg; return { lad: k.lad, used: k.used, kind: k.play && k.play.kind, cfg: d ? d.cfg : null, st: d ? d.state() : null, res: d ? d.res : null, ph: d ? d.ph : null }; });
    const bag = () => ev(() => ({ ...SM_TOWN.game().S.bag }));
    const xp = () => ev(() => (SM_TOWN.game().S.skill || {}).cook || 0);
    const cooked = () => ev(() => SM_TOWN.game().S.cooked['🥞'] || 0);
    const playOn = () => ev(() => !!document.querySelector('.twn-play .kc'));
    async function open(ri = 0) { await closeP(); await ev(h => { SD2.map.player.teleport([h.x, h.y + 0.05, h.z]); }, hot); await W8(400); await p.keyboard.press('KeyE'); await W8(700);
      const bk = await ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? P.textContent.slice(0, 60) : ''; }); if (!/레시피북|Recipe/.test(bk)) return { ok: false, why: 'E로 레시피북이 안 열림 — ' + bk };
      const t0 = Date.now(); await ev(i => { const b9 = document.querySelector('.twn-p button[data-r="' + i + '"]'); if (b9) b9.click(); }, ri); await W8(500); return { ok: await playOn(), t0, why: '놀이 창(.kc)이 안 열림' }; }
    const closeP = async () => { for (let i = 0; i < 3; i++) { const o = await ev(() => { const P = document.querySelector('.twn-p'); if (!P || !P.getClientRects().length) return false; const b9 = P.querySelector('[data-a="x"]') || [...P.querySelectorAll('button')].find(q => /그대로|닫기|Close|Keep|Not now/.test(q.textContent)) || P.querySelector('button.sub'); if (b9) b9.click(); return true; }); if (!o) return; await W8(300); await p.keyboard.press('Escape'); await W8(200); } };   /* 레벨 보상 창(칠하기 · 그대로)도 */   /* 팬케이크를 잘 구우면 꾸미기 창이 뜸 */
    async function waitEnd() { for (let i = 0; i < 60; i++) { if (!(await playOn())) return true; await W8(250); } return false; }
    async function roundFF(kind, opt = {}) { const o = await open(0); if (!o.ok) return { err: o.why }; const k0 = await K(); if (opt.before) await opt.before(k0);
      const pots = k0.cfg.pots.length; for (let i = 0; i < pots; i++) await ev(([i, k]) => SM_TOWN.kitchen().play.dbg.ff(i, k), [i, i === 0 ? kind : 'ok']); await W8(200);
      for (let i = 0; i < pots; i++) await ev(i => SM_TOWN.kitchen().play.dbg.plate(i), i); await W8(200); const st = await K(); for (let i = 0; i < st.st.length; i++) if (st.st[i].wantSalt) await ev(i => SM_TOWN.kitchen().play.dbg.salt(i, 1), i);
      await W8(300); const k1 = await K(); const plates = await ev(() => [...document.querySelectorAll('.twn-play .kc-plate')].map(e => e.className.replace('kc-plate', '').trim() + ' ' + e.textContent)); if (opt.shot) await shot(opt.shot); await waitEnd(); await W8(1200); await closeP(); return { cfg: k0.cfg, res: k1.res, plates }; }
    const R = [];
    // ── 1판: 봇이 마우스로 끌기 ──
    { console.log('1판 — 끌기로'); const x0 = await xp(), b0 = await bag(), c0 = await cooked(); const o = await open(0); ok(o.ok, 'E → 레시피북 → 팬케이크 = 바쁜 부엌 창'); await shot('k1_open');
      const k = await K(); ok(k.kind === 'kitchen', 'cook 갈래 놀이 = kitchen(' + k.kind + ')'); ok(await ev(() => document.querySelectorAll('.twn-play .zone, .twn-play .bar .mk').length === 0), 'cook 창에 막대·초록 칸 0(mkBar 0)');
      ok(k.cfg && k.cfg.lv === 1 && !k.cfg.cond && k.cfg.pots.length === 1, '첫 판 = 첫 꼬임 · 조건 끔 · 냄비 하나 — ' + JSON.stringify(k.cfg && { lv: k.cfg.lv, cond: k.cfg.cond, pots: k.cfg.pots, chips: k.cfg.chips }));
      { const t9 = await ev(() => document.querySelector('.twn-play small').textContent); ok(/할 일/.test(t9) && !/초록/.test(t9), '창 첫 줄 = 할 일 — ' + t9); }
      const box = sel => ev(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
      const dragTo = async (a, z) => { await p.mouse.move(a[0], a[1]); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(a[0] + (z[0] - a[0]) * i / 10, a[1] + (z[1] - a[1]) * i / 10); await W8(80); await p.mouse.up(); await W8(250); };
      await dragTo(await box('.twn-play .kc-tray .ch'), await box('.twn-play .kc-pot .vs')); const t1 = (Date.now() - o.t0) / 1000;
      let s = await K(); ok(s.st[0].st !== 'empty', '끌어서 재료가 팬에 들어감(' + s.st[0].st + ') · 첫 동작 ' + t1.toFixed(1) + '초'); ok(t1 < 10, '첫 동작 10초 안');
      { const c9 = await box('.twn-play .kc-pot [data-h="2"]'); await p.mouse.click(c9[0], c9[1]); await W8(200); } s = await K(); ok(s.st[0].heat === 2, '불 세기 = 중(누르기)');
      await shot('k1_cooking'); let okAt = -1; for (let i = 0; i < 80; i++) { s = await K(); if (s.st[0].st === 'ok') { okAt = i; break; } await W8(250); } ok(okAt >= 0, '「알맞아요」가 뜸(' + (okAt * 0.25).toFixed(1) + '초 · 폭 ' + (k.cfg.ws || 0).toFixed(1) + '초) — ' + s.st[0].lb);
      await shot('k1_ok'); await dragTo(await box('.twn-play .kc-pot .vs'), await box('.twn-play .kc-plate')); s = await K(); await shot('k1_plate');
      ok(s.res && s.res.main === 'ok', '접시로 끌어 담음 = 알맞음 — ' + JSON.stringify(s.res && { main: s.res.main, score: s.res.score, t: s.res.t }));
      ok(s.res && /다음엔/.test(s.res.line), '판 뒤 한 줄(무엇이 됐나 · 다음에 해 볼 것) — ' + (s.res && s.res.line));
      ok(s.res && s.res.t < 60, '한 판 60초 안(' + (s.res && s.res.t) + '초)'); const ended = await waitEnd(); ok(ended, '판이 끝나 창이 닫힘'); await W8(500);
      const b1 = await bag(); ok((b1['🥞'] || 0) === (b0['🥞'] || 0) + 1 && (b1['🌾'] || 0) === (b0['🌾'] || 0) - 1, '가방: 재료 한 벌 → 🥞 하나'); ok(await cooked() === c0 + 1, '요리 셈 +1'); ok(await xp() > x0, '요리 솜씨 오름 ' + x0 + ' → ' + (await xp()));
      await W8(800); await closeP();
      R.push({ cfg: k.cfg, res: s.res }); }
    // ── 2판: 덜 익음 · 3판: 탐 ──
    { const b0 = await bag(), c0 = await cooked(); const r2 = await roundFF('raw', { shot: 'k2_raw' }); ok(r2.res && r2.res.main === 'raw', '2판 일찍 꺼냄 = 덜 익음 — ' + (r2.plates || []).join(' | ')); R.push(r2);
      const b1 = await bag(); ok((b1['🥞'] || 0) === (b0['🥞'] || 0) + 1 && await cooked() === c0, '덜 익음 = 🥞는 받지만 요리 셈은 그대로');
      const r3 = await roundFF('burnt', { shot: 'k3_burnt' }); ok(r3.res && r3.res.main === 'burnt', '3판 늦게 꺼냄 = 탐 — ' + (r3.plates || []).join(' | ')); R.push(r3);
      const b2 = await bag(); ok((b2['🌑'] || 0) === (b1['🌑'] || 0) + 1, '탐 = 가방에 🌑');
      const pl = [R[0].res && 'r-ok', (r2.plates || [''])[0].split(' ')[0], (r3.plates || [''])[0].split(' ')[0]]; ok(new Set(pl).size === 3 && pl.includes('r-raw') && pl.includes('r-burnt'), '접시 그림 셋이 서로 다름 — ' + pl.join(' · ')); }
    // ── 4판 잘함 · 5판 비 오는 날(조건) ──
    { const r4 = await roundFF('ok'); R.push(r4); await ev(() => SM_TOWN.rules.wx('rain')); await W8(400);
      const r5 = await roundFF('ok', { shot: 'k5_rain' }); R.push(r5); if (r5.err) console.log('    5판 못 엶: ' + r5.err + ' · ' + JSON.stringify(await ev(() => ({ on: SM_TOWN.indoor.on, panel: (document.querySelector('.twn-p') || {}).textContent, near: SD2.near() })))); await ev(() => SM_TOWN.rules.wx('clear'));
      const a = R[0].cfg, z = r5.cfg; ok(!!z && (a.lv !== z.lv || a.cond !== z.cond || a.pots.length !== z.pots.length), '다섯째 판이 첫 판과 다름 — 첫 ' + JSON.stringify({ lv: a.lv, cond: a.cond, pots: a.pots }) + ' · 다섯째 ' + JSON.stringify(z && { lv: z.lv, cond: z.cond, pots: z.pots }));
      ok(z && z.cond === 'rain' && z.pots.includes('side'), '비 = 보리차 주전자가 더해짐(조건은 판 내용을 바꿈)');
      const L = (await K()).lad; ok(L.lv === 2, '잘한 판 셋 = 다음 꼬임(lv ' + L.lv + ' · good ' + L.good + ' · n ' + L.n + ')'); }
    // ── 6판: 둘째 꼬임 = 재료 둘 차례(틀린 차례 = 자국) ──
    { const o = await open(0); const k = await K(); ok(k.cfg && k.cfg.lv === 2 && k.cfg.chips.length === 2, '둘째 꼬임 = 재료 둘(' + (k.cfg && k.cfg.chips.join('')) + ')'); await shot('k6_lv2');
      await ev(() => { const d = SM_TOWN.kitchen().play.dbg; d.put(0, 1); }); await W8(200); const m9 = await ev(() => document.querySelector('.twn-play .msg').textContent); ok(/기름|Oil/.test(m9), '반죽 먼저 = 차례 안내 — ' + m9);
      await ev(() => { const d = SM_TOWN.kitchen().play.dbg; d.put(0, 0); d.ff(0, 'ok'); d.plate(0); }); await W8(300); const s = await K(); ok(s.res && s.res.ordBad && s.res.score < 3, '틀린 차례 = 꼬임 별 X(점수 ' + (s.res && s.res.score) + ')'); await waitEnd(); await W8(1200); await closeP(); }
    // ── 7판: 하루 한도(job:kitchen 6판 뒤 = 솜씨 0) ──
    { const u = (await K()).used; ok(u === 6, '하루 판 수 셈 ' + u); const x0 = await xp(); const r7 = await roundFF('ok'); await W8(300); const x1 = await xp(); ok(r7.res && x1 === x0, '일곱째 판 = 연습(솜씨 ' + x0 + ' → ' + x1 + ')');
      const bn = await ev(() => { const e = document.querySelector('#banner, .banner, .hud-banner'); return e ? e.textContent : ''; }); console.log('    알림: ' + bn.slice(0, 90)); }
    // ── 이야기 '요리' 단계 = 첫 꼬임 · 조건 끔 · 끝내기만 통과 ──
    { const st = await ev(() => SM_TOWN.storySteps('cook')); const ckP = await ev(() => { const S = SM_TOWN.game().S; return S.lad.kitchen.lv; }); if (!st.length) ok(false, '이야기 요리 단계 없음');
      else { const [cid, i] = st[0]; await ev(([c, i]) => SM_TOWN.storyAt(c, i), [cid, i]); await W8(600); await ev(() => { for (const b9 of document.querySelectorAll('.twn-dlg button, .twn-p [data-a="x"]')) b9.click(); }); await p.keyboard.press('Escape'); await W8(400);
        const s0 = await ev(() => { const s = SM_TOWN.story(); return { cur: s.cur, id: s.step && s.step.id }; }); await ev(() => SM_TOWN.rules.wx('rain'));
        const r = await roundFF('raw'); await W8(800); const s1 = await ev(() => { const s = SM_TOWN.story(); return { cur: s.cur, id: s.step && s.step.id, i: s.S && s.S.i }; });
        ok(r.cfg && r.cfg.story && r.cfg.lv === 1 && !r.cfg.cond && r.cfg.pots.length === 1, '이야기 판 = 첫 꼬임 · 조건 끔(비인데도) — ' + JSON.stringify(r.cfg && { lv: r.cfg.lv, cond: r.cfg.cond, pots: r.cfg.pots }) + ' · 사다리 lv ' + ckP);
        ok(s1.id !== s0.id || s1.cur !== s0.cur, '덜 익어도 끝내면 이야기 단계 통과 ' + s0.id + ' → ' + s1.id); await ev(() => SM_TOWN.rules.wx('clear')); } }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { ok(false, '시험 멈춤 — ' + e.message.slice(0, 160)); } finally { await b.close(); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
