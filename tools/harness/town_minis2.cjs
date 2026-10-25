// 🌿🐚 김 펴기·굴 크기 재기 시험(10-24 옛 막대 정리 · docs/systems/town_jobs2.md 「옛 막대 정리」): node tools/harness/town_minis2.cjs [마을=ourtown] [포트=8002]
//   배 위 양식장 E(김 펴서 말리기 · 굴 크기 재기)를 그대로 불러 놀이 창을 엶 → 타이밍 막대(zone·mk) 0 · 창 첫 줄 = 할 일
//   김(5×5 발장): 창이 열리는지만(10-25 JUDGE-1 판단 놀이로 바뀜 · 판단 시험 = town_judge.cjs)
//   굴: 마우스로 고리 끌어 재고 굴 끌어 나누기 · 키보드만(E 재기 · ← →) · 일부러 틀리게 골라도 흔들리고 끝까지 감
//   끝 = 결과 말 + '💡 알고 있었나요?' · 페이지 오류 0 · 캡처 = MINIS2_SHOTS(기본 scratchpad/minis2)
const { chromium, RENDER } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOT = process.env.MINIS2_SHOTS || '/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/a87e1302-73de-487f-8543-e35d62007edd/scratchpad/minis2';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|모르는 놀이 갈래/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), shot = async n => { if (RENDER) await p.screenshot({ path: SHOT + '/' + n + '.png' }); };   /* FAST-1: 그리기 끔이면 사진 건너뜀(--render면 찍음) */
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? P.textContent.slice(0, 120) : ''; });
    const closeP = () => ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.rules && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await closeP(); await p.keyboard.press('Escape'); await W8(500);
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 12 * 60; if (SD2.map.time) SD2.map.time('day'); }); await ev(() => SM_TOWN.rules.wx('clear'));
    const ready = async () => { for (let i = 0; i < 14; i++) { if (await panel()) { await closeP(); await W8(300); if (await panel()) await p.keyboard.press('Escape'); await W8(300); } else if (await ev(() => !!document.querySelector('.twn-lvup') || !!document.querySelector('.twn-play'))) await W8(500); else return; } };
    const RE = { seaweed: '김 펴서 말리기|Spread laver', oyster: '굴 크기 재기|Measure oysters' };
    const hots = await ev(R => { const o = {}; for (const [k, re] of Object.entries(R)) o[k] = SD2.map.interact.list().filter(h => new RegExp(re).test(h.label)).length; return o; }, RE);
    ok(hots.seaweed > 0 && hots.oyster > 0, '배 위 양식장 E 자리 — 김 ' + hots.seaweed + ' · 굴 ' + hots.oyster);
    const open = async k => { await ready(); await ev(() => { SM_TOWN.game().S.uses = {}; }); await ev(([k9, re]) => { const h = SD2.map.interact.list().find(q => new RegExp(re).test(q.label)); if (h) h.use(); }, [k, RE[k]]); await W8(700);
      const q = await ev(() => { const el = document.querySelector('.twn-play'); if (!el) return null; return { k: (SM_TOWN.rules.play() || {}).k, head: el.querySelector('b').textContent + ' / ' + el.querySelector('small').textContent, bars: el.querySelectorAll('.zone,.mk').length }; });
      ok(!!q && q.k === k, k + ' 놀이 창 열림(' + (q && q.k) + ')'); if (q) { ok(q.bars === 0, k + ' 타이밍 막대(zone·mk) 0 — ' + q.bars); console.log('    창 머리: ' + q.head); } return q; };
    const st = sel => ev(s9 => { const el = document.querySelector('.twn-play'); if (!el) return null; const g = el.querySelector(s9); return { ph: g ? g.dataset.ph : null, l: g ? +g.dataset.l : 0, i: g ? +g.dataset.i : 0, m: g ? g.dataset.m || '' : '', msg: (el.querySelector('.msg') || {}).textContent || '', end: !!el.querySelector('.pb.mg-end'), dots: [...el.querySelectorAll('.dots i')].map(d => d.className || '-').join('') }; }, sel);
    const waitEnd = async (sel, maxS) => { const t0 = Date.now(); let last = null; while (Date.now() - t0 < maxS * 1000) { const s = await st(sel); if (!s) return { gone: true, last, ms: Date.now() - t0 }; last = s; if (s.end) return { ...s, ms: Date.now() - t0 }; await W8(150); } return { ...last, timeout: true }; };
    const closePlay = async () => { for (let i = 0; i < 30; i++) { if (!(await ev(() => !!document.querySelector('.twn-play')))) break; await W8(300); } await W8(500); await ready(); };
    const factOk = (m, tag) => ok(/알고 있었나요|Did you know/.test(m), tag + ' 끝 = 결과 + 사실 한 줄 — ' + m.slice(0, 110));

    // ── 김 펴기 ── JUDGE-1(10-25)에 붓기 꾹(끌기) → 고르게 펴기 판단(한 숟갈씩 · 두꺼운 곳 덜기 · 하늘 보고 말리기)으로 바뀜 — 판단 시험은 town_judge.cjs · 여기서는 배 위 E로 창이 열리는지만
    console.log('🌿 김 펴기 — 배 위 E로 열림(판단 시험 = town_judge.cjs)');
    await open('seaweed'); await shot('seaweed_1_open'); await ev(() => SM_TOWN.rules.playEnd(0)); await closePlay();

    // ── 굴 크기 재기 ──
    const oyR = () => ev(() => { const B = document.querySelector('.twn-play .oys').getBoundingClientRect(), o = document.querySelector('.twn-play .oy').getBoundingClientRect(), r = document.querySelector('.twn-play .rg2').getBoundingClientRect(); return { B: { x: B.left, y: B.top, w: B.width }, o: [o.left + o.width / 2, o.top + o.height / 2], r: [r.left + r.width / 2, r.top + r.height / 2] }; });
    const nextOy = async i0 => { for (let n = 0; n < 40; n++) { const s = await st('.oys'); if (!s || s.end || (s.i !== i0 && s.ph === 'look')) return s; await W8(100); } return null; };
    console.log('🐚 굴 크기 재기 — 마우스(고리 끌기 · 굴 끌기)');
    t0 = Date.now(); await open('oyster'); await shot('oyster_1_open');
    { let sawBig = false, sawSmall = false;
      for (let n = 0; n < 6; n++) { await W8(500); const G = await oyR(); await p.mouse.move(...G.r); await p.mouse.down(); await p.mouse.move(G.o[0], G.o[1], { steps: 6 }); await p.mouse.up(); await W8(700);
        const s = await st('.oys'); if (!s || s.end) break; if (s.m === 'big' && !sawBig) { sawBig = true; await shot('oyster_2_big'); } if (s.m === 'small' && !sawSmall) { sawSmall = true; await shot('oyster_3_small'); }
        const G2 = await oyR(), side = s.m === 'big' ? 1 : -1; await p.mouse.move(...G2.o); await p.mouse.down(); await p.mouse.move(G2.o[0] + side * G2.B.w * 0.33, G2.o[1], { steps: 6 }); await p.mouse.up(); await nextOy(s.i); }
      ok(sawBig && sawSmall, '고리 대기 — 걸림(큰 굴)·지나감(작은 굴) 둘 다 봄');
      const r = await waitEnd('.oys', 20); ok(/아주 잘했어요|Excellent/.test(r.msg), '마우스 봇 = 다 맞힘(아주 잘했어요) — ' + r.msg.slice(0, 30)); factOk(r.msg, '굴'); await shot('oyster_4_end'); ok(Date.now() - t0 < 40000, '한 판 ' + ((Date.now() - t0) / 1000).toFixed(1) + '초'); }
    await closePlay();
    console.log('⌨ 굴 크기 재기 — 키보드만(E 재기 · ← →)');
    await open('oyster'); await W8(400);
    for (let n = 0; n < 6; n++) { await p.keyboard.press('KeyE'); await W8(650); const s = await st('.oys'); if (!s || s.end) break; await p.keyboard.press(s.m === 'big' ? 'ArrowRight' : 'ArrowLeft'); await nextOy(s.i); }
    { const r = await waitEnd('.oys', 20); ok(r.end && /잘했어요|Well done|Excellent/.test(r.msg), '키보드만으로 끝까지 · 별 — ' + r.msg.slice(0, 30)); factOk(r.msg, '굴(키보드)'); }
    await closePlay();
    console.log('🙃 굴 크기 재기 — 재지 않고 일부러 틀리게 먼저');
    await open('oyster'); await W8(400);
    { let shook = 0;
      for (let n = 0; n < 6; n++) { const i0 = (await st('.oys')).i; await p.keyboard.press('ArrowRight'); await W8(250); let s = await st('.oys'); if (!s || s.end) break;
        if (s.i === i0 && s.ph === 'look') { shook++; if (shook === 1) { await shot('oyster_5_wrong'); console.log('    틀림: ' + s.msg); } await p.keyboard.press('ArrowLeft'); await W8(250); }
        await nextOy(i0); }
      ok(shook >= 1, '틀린 굴 = 흔들리고 다시 고름(' + shook + '번)');
      const r = await waitEnd('.oys', 30); ok(r.end, '잘못 해도 끝남 — ' + r.msg.slice(0, 40)); factOk(r.msg, '굴(틀림)'); }
    await closePlay();
  } catch (e) { fails.push('예외 ' + e.message.slice(0, 160)); console.log('  ✗ 예외 ' + e.message.slice(0, 300)); }
  finally { ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : '')); await b.close(); console.log((fails.length ? '❌ ' + fails.length + '개 실패' : '✅ 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); }
})();
