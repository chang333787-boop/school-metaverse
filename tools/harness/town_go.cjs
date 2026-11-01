// 🧭 목적지 고르기 한 가지 방식 시험(GO-1 · 사용자 11-01 'J에서 누르면 이동, 옆에 거 길찾기 버튼 이렇게 나눠지는데, 검색하면 지역 누르면 또 선택지 나와서 이동/길찾기 이렇게 나눠지고. 지도 눌렀을 때도 그렇게 되게 해'): node tools/harness/town_go.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 전수한 곳마다 누르면 같은 창(.twn-go · 🧭 길 안내 · 🚌 바로 가기 · 닫기): J 큰 장소·들어갈 곳·찾기 결과·찾기 칸 단추·칸 지도·칸 단추·흔적 칸 · F 장소·F 지금 생긴 일 · 큰 지도 장소 기호·빈 땅 · 하늘에서 보기
//   ② 길 안내 = 따라가는 목표가 바뀜(J·F·지도 = pin:find · 사건 = em:emerg) · 빨간 선 · 자리 그대로 · 순간이동 수 그대로 · 뒤 창 닫힘 · 닫기 = 뒤 창으로 돌아감
//   ③ 바로 가기 = 그곳 앞으로 + 수 하나 줆(5 → 4)  ④ 다 쓰면 흐림(.off) + 까닭 한 줄 · 눌러도 안 감(까닭 반짝)  ⑤ 막힌 곳 까닭(안 가 본 곳 · 지금 생긴 일 · 마을 밖)
//   ⑥ 키·손: Enter = 길 안내 · Esc = 고르기 창만 닫힘 · 두 번 누르기 = 길 안내 · 찾기 칸 Enter = 창 없이 길 안내  ⑦ 휴대폰 세로·가로: 단추 44px 이상 · 창이 화면 안 · 누른 자리를 안 덮음 · 터치로 길 안내 · 페이지 오류 0
const { chromium, devices } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, BASE = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
async function page(b, ctxOpt, url, touch) {
  const ctx = await b.newContext(ctxOpt), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 200)); });
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  const shot = async n => { if (!SHOTS) return; await W8(250); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); };
  const dlgClick = async () => { for (let i = 0; i < 20; i++) { await W8(220); const r = await ev(() => { const B = [...document.querySelectorAll('.twn-dlg .ch button')]; if (B.length) { B[0].click(); return 1; } const d = document.querySelector('.twn-dlg .dbox'); if (d) { d.click(); return 1; } return 0; }); if (!r && i > 2) return; } };
  const closeAll = async () => { for (let i = 0; i < 8; i++) { if (await ev(() => !!document.querySelector('.twn-go'))) { await ev(() => SM_TOWN.go().close()); continue; } if (await ev(() => !!document.querySelector('.twn-dlg'))) { await dlgClick(); continue; } if (await ev(() => !!(SM_TOWN.indoor && SM_TOWN.indoor.state && SM_TOWN.indoor.state().top))) { await ev(() => SM_TOWN.top(false)); await W8(400); continue; } if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p .twn-x') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
  await p.goto(url); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.go && SM_TOWN.go() && SM_TOWN.track, null, { timeout: 240000 }); await W8(2200); await closeAll(); if (touch) await p.touchscreen.tap(200, 320); await W8(400); await closeAll();
  const me = () => ev(() => { const q = SD2.map.player.pos(); return [q.x, q.z]; }), tpn = () => ev(() => SM_TOWN.game().S.tpn | 0), gi = () => ev(() => SM_TOWN.go().info()), pk = () => ev(() => { const e = document.querySelector('.twn-p'); return !e ? '' : e.querySelector('.jq') ? 'J' : e.querySelector('.fq') ? 'F' : e.querySelector('canvas.twn-big') ? 'M' : (e.dataset.k || '?'); });   /* J·F·M 창은 data-k가 없음 — 안의 것으로 알아봄 */
  const st = () => ev(() => ({ trk: SM_TOWN.track.key(), route: SM_TOWN.routeNow(), panel: !!document.querySelector('.twn-p'), go: !!document.querySelector('.twn-go'), tpn: SM_TOWN.game().S.tpn | 0, me: (() => { const q = SD2.map.player.pos(); return [q.x, q.z]; })() }));
  /* 진짜 손으로 누르기(마우스·터치) — 창 안이면 먼저 보이게 굴림 */
  const ptOf = sel => ev(s => { const e = typeof s === 'string' ? document.querySelector(s) : null; if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'nearest' }); const r = e.getBoundingClientRect(); return [r.left + Math.min(r.width / 2, 60), r.top + r.height / 2]; }, sel);
  const press = async (sel, how) => { const q = await ptOf(sel); if (!q) return null; await W8(80); if (how === 'tap') await p.touchscreen.tap(q[0], q[1]); else if (how === 'dbl') await p.mouse.dblclick(q[0], q[1]); else await p.mouse.click(q[0], q[1]); await W8(350); return q; };
  const pickGo = async (k, how) => { const r = await ev(k => { const b = document.querySelector('.twn-go [data-go="' + k + '"]'); if (!b) return null; const R = b.getBoundingClientRect(); return [R.left + R.width / 2, R.top + R.height / 2]; }, k); if (!r) return false; if (how === 'tap') await p.touchscreen.tap(r[0], r[1]); else await p.mouse.click(r[0], r[1]); await W8(900); return true; };
  const same = (I, kind) => !!(I && (!kind || I.kind === kind) && I.g && I.j && I.x && I.name && /길 안내|지도 펴기/.test(I.text) && /바로 가기/.test(I.text) && /닫기/.test(I.text));
  return { p, ctx, ev, W8, shot, closeAll, me, tpn, gi, pk, st, press, pickGo, same, errs };
}
(async () => { const T0 = Date.now(), fs = require('fs'); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    // ───── A. 데스크톱 · 모두 열림(all=1 · 순간이동 수 제한 없음) — 전수한 곳마다 같은 창 ─────
    { const P = await page(b, { viewport: { width: 1366, height: 768 } }, BASE + '&all=1'), { p, ev, W8, shot, closeAll, gi, pk, st, press, pickGo, same, errs } = P;
      console.log('① 전수한 곳마다 누르면 같은 창(데스크톱 · 모두 열림)');
      const seen = [];
      const check = async (tag, kind, back) => { const I = await gi(); ok(same(I, kind), tag + ' = 고르기 창(' + (I ? I.kind + ' · ' + I.name + (I.what ? ' · ' + I.what : '') + ' · ' + I.sub : '없음') + ')'); if (I) seen.push(tag); if (back) { ok(await pk() === back, tag + ' — 뒤 창(' + back + ')은 그대로'); } return I; };
      await p.keyboard.press('KeyJ'); await W8(700); ok(await pk() === 'J', 'J = 바로 가기 창');
      await press('.twn-p .jp button[data-j]'); let I = await check('J 큰 장소', 'place', 'J');
      ok(I && I.left === -1 && /횟수 제한 없음/.test(I.text) && !I.off, '모두 열림(선생님·all=1) = 바로 가기 「횟수 제한 없음」');
      ok(I && I.focus === 'g', '처음 고른 단추 = 🧭 길 안내(Enter 기본)');
      await shot('go_j_place');
      await pickGo('x'); ok(!(await ev(() => !!document.querySelector('.twn-go'))) && await pk() === 'J', '닫기 = 고르기 창만 닫힘(J 창으로 돌아감)');
      if (await ev(() => !!document.querySelector('.twn-p .jp button[data-door]'))) { await press('.twn-p .jp button[data-door]'); await check('J 들어갈 곳', 'door', 'J'); await p.keyboard.press('Escape'); await W8(250); ok(!(await ev(() => !!document.querySelector('.twn-go'))) && await pk() === 'J', 'Esc = 고르기 창만 닫힘'); } else console.log('    (들어갈 곳 목록 없음)');
      await ev(() => { const q = document.querySelector('.twn-p .jq'); q.value = '마트'; q.dispatchEvent(new Event('input')); }); await W8(300);
      ok(await ev(() => [...document.querySelectorAll('.twn-p .jr button')].every(b => !b.classList.contains('jgo')) && !document.querySelector('.twn-p .jr .jx')), '찾기 결과 = 장소마다 단추 하나(따로 있던 🚌 작은 단추 X)');
      await press('.twn-p .jr button[data-gd]'); await check('J 찾기 결과', null, 'J'); await pickGo('x');
      const cellNm = await ev(() => { const P9 = SM_TOWN.places().filter(q => !SM_TOWN.inSchool(q.x, q.z)); return SM_TOWN.cell(P9[0].x, P9[0].z); });
      await ev(c => { const q = document.querySelector('.twn-p .jq'); q.value = c; q.dispatchEvent(new Event('input')); }, cellNm); await W8(300);
      if (await ev(() => !!document.querySelector('.twn-p .jr button[data-cell]'))) { await press('.twn-p .jr button[data-cell]'); await check('J 찾기 칸 단추(' + cellNm + ')', 'cell', 'J'); await pickGo('x'); } else ok(false, 'J 찾기 칸 단추 없음(' + cellNm + ')');
      await ev(() => { const q = document.querySelector('.twn-p .jq'); q.value = ''; q.dispatchEvent(new Event('input')); }); await W8(200);
      { const r = await ev(() => { const cv = document.querySelector('.twn-p canvas.cm1'); cv.scrollIntoView({ block: 'center' }); const R = cv.getBoundingClientRect(); return [R.left + R.width * 0.5, R.top + R.height * 0.5]; }); await W8(150); await p.mouse.move(r[0], r[1]); await p.mouse.down(); await p.mouse.up(); await W8(400); I = await check('J 칸 지도 누르기', 'cell', 'J'); ok(I && I.card && !(r[0] >= I.card.x && r[0] <= I.card.x + I.card.w && r[1] >= I.card.y && r[1] <= I.card.y + I.card.h), '창이 누른 자리를 안 덮음(마우스 옆)'); await shot('go_j_cellmap'); await pickGo('x'); }
      await ev(() => { const d = document.querySelector('.twn-p details.cgd'); if (d) d.open = true; }); await W8(200); await press('.twn-p .cg button[data-cell]'); await check('J 칸 단추', 'cell', 'J'); await pickGo('x');
      { const c9 = await ev(() => { const P9 = SM_TOWN.places().filter(q => !SM_TOWN.inSchool(q.x, q.z)), q = P9[Math.floor(P9.length / 2)], c = SM_TOWN.cell(q.x, q.z), S = SM_TOWN.game().S; S.wmet = S.wmet || {}; S.wmet[c] = { id: (S.wmet[c] && S.wmet[c].id) || 'heron', x: q.x, z: q.z, d: S.day || 1 }; return { c, x: q.x, z: q.z }; });
        await closeAll(); await p.keyboard.press('KeyJ'); await W8(700); await ev(() => document.querySelector('.twn-p .trb').click()); await W8(400);
        await ev(([x9, z9]) => { const cv = document.querySelector('.twn-p canvas.cm1'), R = cv.getBoundingClientRect(), [X0, Z0, X1] = SM_TOWN.ask.ext(), CW = parseFloat(cv.style.width), MG = 22, sc = (CW - 2 * MG) / (X1 - X0), o = { clientX: R.left + (MG + (x9 - X0) * sc) * R.width / CW, clientY: R.top + (MG + (z9 - Z0) * sc) * R.width / CW, pointerId: 1, bubbles: true, pointerType: 'mouse' }; cv.dispatchEvent(new PointerEvent('pointermove', o)); cv.dispatchEvent(new PointerEvent('pointerdown', o)); cv.dispatchEvent(new PointerEvent('pointerup', o)); }, [c9.x, c9.z]); await W8(300);
        if (await ev(() => !!document.querySelector('.twn-p .trj button[data-cell]'))) { ok(/이 칸으로/.test(await ev(() => document.querySelector('.twn-p .trj button[data-cell]').textContent)), '흔적 일지 단추 = 「📍 이 칸으로」'); await press('.twn-p .trj button[data-cell]'); await check('흔적 칸(' + c9.c + ')', 'cell', 'J'); await pickGo('x'); } else ok(false, '흔적 일지 단추 없음(' + c9.c + ')');
        await ev(() => document.querySelector('.twn-p .trb').click()); await W8(200); await closeAll(); }
      await p.keyboard.press('KeyF'); await W8(700); ok(await pk() === 'F', 'F = 장소 찾기 창');
      ok(await ev(() => !document.querySelector('.twn-p button[data-b]') && document.querySelectorAll('.twn-p .pl.fl button.fr[data-r]').length > 5), 'F 줄 = 장소마다 단추 하나(🧭 길 · 🚌 가기 둘 X)');
      await press('.twn-p .pl.fl button.fr[data-r]'); await check('F 장소', 'place', 'F'); await shot('go_f_place'); await pickGo('x');
      await closeAll(); await p.keyboard.press('KeyM'); await W8(800); ok(await pk() === 'M', 'M = 큰 지도');
      const big = async (x, z, how) => { const r = await ev(([x, z]) => { const cv = document.querySelector('.twn-p canvas.twn-big'); if (!cv || !cv._pt) return null; const R = cv.getBoundingClientRect(), q = cv._pt(x, z); return [R.left + q[0] * R.width / cv.width, R.top + q[1] * R.height / cv.height]; }, [x, z]); if (!r) return null; await p.mouse.click(r[0], r[1]); await W8(400); return r; };
      const pl0 = await ev(() => { const P9 = SM_TOWN.places().filter(q => !SM_TOWN.inSchool(q.x, q.z) && q.kind !== 'house'); return P9[0]; });
      await big(pl0.x, pl0.z); I = await check('큰 지도 장소 기호(' + pl0.name + ')', 'place', 'M'); await shot('go_big_place'); await pickGo('x');
      const empty = await ev(() => { const P9 = SM_TOWN.places(), [X0, Z0, X1, Z1] = SM_TOWN.ask.ext(); for (let i = 0; i < 400; i++) { const x = X0 + (X1 - X0) * (0.2 + 0.6 * ((i * 37) % 97) / 97), z = Z0 + (Z1 - Z0) * (0.2 + 0.6 * ((i * 53) % 89) / 89); if (SM_TOWN.inSchool(x, z)) continue; if (P9.every(q => Math.hypot(q.x - x, q.z - z) > 60)) return [x, z]; } return null; });
      if (empty) { await big(empty[0], empty[1]); I = await check('큰 지도 빈 땅', 'spot', 'M'); ok(I && /칸/.test(I.sub), '빈 땅 = 그 칸 이름(' + (I && I.name) + ' · ' + (I && I.sub) + ')'); await pickGo('x'); } else ok(false, '빈 땅 자리 못 찾음');
      await closeAll(); await ev(() => SM_TOWN.top(true)); await W8(1200);
      await p.mouse.click(683, 400); await W8(500); I = await check('하늘에서 보기 누르기', null); ok(I && (I.kind === 'place' || I.kind === 'spot'), '하늘에서 보기 = 장소 또는 빈 땅(' + (I && I.kind) + ')'); await shot('go_top');
      await pickGo('x'); ok(await ev(() => !!SM_TOWN.indoor.state().top), '닫기 = 하늘에서 보기 그대로');
      await p.mouse.click(683, 400); await W8(500); { const s0 = await st(); await pickGo('g'); const s1 = await st(); ok(!(await ev(() => !!SM_TOWN.indoor.state().top)) && !!s1.route && s1.trk === 'pin:find' && Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1]) < 1, '하늘에서 보기 길 안내 = 하늘 닫힘 · 빨간 선 · 자리 그대로(' + s1.trk + ')'); }
      await closeAll();
      console.log('② 길 안내 = 따라가는 목표 · 자리·수 그대로 · 지금 생긴 일');
      { await ev(() => SM_TOWN.pathOff()); await p.keyboard.press('KeyJ'); await W8(600); await press('.twn-p .jp button[data-j]'); const s0 = await st(); await pickGo('g'); const s1 = await st();
        ok(!s1.panel && !s1.go, '길 안내 = 고르기 창·J 창 모두 닫힘'); ok(!!s1.route && s1.route.n > 1, '빨간 선 생김(' + (s1.route ? s1.route.len + 'm' : '-') + ')'); ok(s1.trk === 'pin:find', '따라가는 목표 = 고른 곳(' + s0.trk + ' → ' + s1.trk + ')'); ok(Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1]) < 1 && s1.tpn === s0.tpn, '자리·순간이동 수 그대로'); }
      { await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.min = 10 * 60 + 30; if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = [{ k: 'lost', at: G.min, until: G.min + 300, st: 0 }]; } SM_TOWN.emerg().dbg.walk(100); });
        let E = null; for (let i = 0; i < 16 && !E; i++) { await W8(500); E = await ev(() => SM_TOWN.emerg().info().ev); }
        if (E) { await W8(1200); await closeAll(); await p.keyboard.press('KeyF'); await W8(700); const has = await ev(() => !!document.querySelector('.twn-p button.fr[data-em]'));
          ok(has, 'F 「지금 생긴 일」 줄 = 단추 하나'); if (has) { await press('.twn-p button.fr[data-em]'); I = await check('F 지금 생긴 일', 'em', 'F'); ok(I && I.off && /지금 생긴 일/.test(I.no), '지금 생긴 일 = 바로 가기 흐림 + 까닭 「' + (I && I.no) + '」');
            const s0 = await st(); await pickGo('g'); const s1 = await st(); ok(s1.trk === 'em:emerg' && !s1.panel && s1.tpn === s0.tpn, '사건 길 안내 = 따라가는 목표 em:emerg(' + s1.trk + ')'); }
          await closeAll(); await ev(() => { const q = document.querySelector('.twn-p .jq'); return !!q; }); await p.keyboard.press('KeyJ'); await W8(600); await ev(() => { const q = document.querySelector('.twn-p .jq'); q.value = '길 잃은'; q.dispatchEvent(new Event('input')); }); await W8(300);
          if (await ev(() => !!document.querySelector('.twn-p .jr button[data-em]'))) { await press('.twn-p .jr button[data-em]'); await check('J 찾기 지금 생긴 일', 'em', 'J'); await pickGo('x'); } else console.log('    (J 찾기에 사건 줄 없음)');
          await closeAll(); await ev(() => { const G = SM_TOWN.game().S; if (SM_TOWN.emerg().abort) SM_TOWN.emerg().abort('test'); if (G.emerg) G.emerg.plan = []; }); await W8(400);
        } else ok(false, '시험 사건(길 잃은 어린이)이 안 생김');
      }
      console.log('    본 곳: ' + seen.join(' · '));
      ok(seen.length >= 11, '전수한 곳 ' + seen.length + '곳 모두 같은 창');
      ok(!errs.length, '페이지 오류 0 ' + errs.slice(0, 3).join(' | ')); await P.ctx.close(); }

    // ───── B. 데스크톱 · 새 아이(하루 5번 · 가 본 곳만) ─────
    { const P = await page(b, { viewport: { width: 1280, height: 720 } }, BASE), { p, ev, W8, shot, closeAll, gi, pk, st, press, pickGo, errs } = P;
      console.log('③ 바로 가기 = 이동 + 수 하나 줆 (새 아이)');
      await ev(() => { const S = SM_TOWN.game().S; S.tpn = 0; S.tpd = S.day; const P9 = SM_TOWN.places().filter(q => q.door && !SM_TOWN.inSchool(q.x, q.z) && q.kind !== 'house'), R = SM_TOWN.schRect(), cx = (R[0] + R[2]) / 2, cz = (R[1] + R[3]) / 2; P9.sort((a, b) => Math.hypot(b.x - cx, b.z - cz) - Math.hypot(a.x - cx, a.z - cz)); const q = P9[Math.floor(P9.length / 3)], M = SD2.map; M.player.teleport([q.door[0], M.q.groundAt(q.door[0], q.door[1], SM_TOWN.ground(q.door[0], q.door[1]) + 3) + 0.05, q.door[1]]); }); await W8(900);   /* 학교에서 먼 곳에 서서 */
      await p.keyboard.press('KeyJ'); await W8(700);
      const tgt = await ev(() => { const B = [...document.querySelectorAll('.twn-p .jp button[data-j]')], b = B.find(b => /우리 학교|Our School/.test(b.textContent)) || B.find(b => !/아직 안 가 봤어요/.test(b.textContent)); return b ? b.dataset.j : null; });
      ok(tgt != null, '가 본 곳(학교·우리 집 칸) 단추 있음');
      await press('.twn-p .jp button[data-j="' + tgt + '"]'); let I = await gi(); ok(I && !I.off && I.left === 5 && /오늘 5번 남음/.test(I.text), '바로 가기 「오늘 5번 남음」(' + (I && I.name) + ')'); await shot('go_new_5');
      { const s0 = await st(); await pickGo('j'); await W8(1800); await closeAll(); const s1 = await st(); ok(s1.tpn === s0.tpn + 1, '바로 가기 = 수 하나 씀(' + s0.tpn + ' → ' + s1.tpn + ')'); ok(Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1]) > 15 && (await ev(() => SM_TOWN.tpLeft())) === 4, '그곳 앞으로 옮김(' + Math.round(Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1])) + 'm · 남은 수 4)'); }
      { const vis = await ev(() => { const S = SM_TOWN.game().S, P9 = SM_TOWN.places().filter(q => q.door && !SM_TOWN.inSchool(q.x, q.z) && q.kind !== 'house'), me = SD2.map.player.pos(); P9.sort((a, b) => Math.hypot(b.x - me.x, b.z - me.z) - Math.hypot(a.x - me.x, a.z - me.z)); const q = P9[0]; S.cells = S.cells || {}; for (const o of P9) if (o.name === q.name) { S.cells[SM_TOWN.cell(o.x, o.z)] = 1; S.cells[SM_TOWN.cell(o.door[0], o.door[1])] = 1; } return q; });
        await p.keyboard.press('KeyF'); await W8(300); if (await pk() !== 'F') { await ev(() => SM_TOWN.hud.unlock('find', false)); await W8(200); await closeAll(); await p.keyboard.press('KeyF'); await W8(600); }
        await ev(n => { const q = document.querySelector('.twn-p .fq'); q.value = n; q.dispatchEvent(new Event('input')); }, vis.name); await W8(300);
        const s0 = await st(); await press('.twn-p .pl.fl > div:not([style*="none"]) button.fr[data-r]'); I = await gi(); ok(I && !I.off && /4번 남음/.test(I.text), 'F 먼 곳(가 본 칸으로 표시) = 「오늘 4번 남음」(' + (I && I.name) + ')');
        await pickGo('j'); await W8(1800); await closeAll(); const s1 = await st(); ok(s1.tpn === s0.tpn + 1 && Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1]) > 40, 'F 바로 가기 = 하루 5번 문 하나(' + s0.tpn + ' → ' + s1.tpn + ' · ' + Math.round(Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1])) + 'm · 예전 F 🚌 가기는 수 안 셈)'); }
      console.log('④ 다 쓰면 흐림 + 까닭');
      await ev(() => { const S = SM_TOWN.game().S; S.tpn = 5; S.tpd = S.day; });
      await p.keyboard.press('KeyJ'); await W8(700); await press('.twn-p .jp button[data-j="' + tgt + '"]'); I = await gi();
      ok(I && I.off && /오늘 0번 남음/.test(I.text) && /다 썼어요/.test(I.no), '흐림 + 「' + (I && I.no) + '」'); await shot('go_used_up');
      { const s0 = await st(); await pickGo('j'); const s1 = await st(), hi = await ev(() => !!document.querySelector('.twn-go .gw.hi')); ok(s1.go && s1.panel && s1.tpn === 5 && Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1]) < 1 && hi, '흐린 바로 가기 누름 = 안 감 · 창 그대로 · 까닭 줄 반짝'); }
      await p.keyboard.press('Enter'); await W8(700); { const s1 = await st(); ok(!s1.go && !s1.panel && !!s1.route && s1.trk === 'pin:find', 'Enter = 길 안내(창 닫힘 · 빨간 선 · ' + s1.trk + ')'); }
      console.log('⑤ 막힌 곳 까닭');
      await ev(() => { const S = SM_TOWN.game().S; S.tpn = 0; S.tpd = S.day; });
      await p.keyboard.press('KeyJ'); await W8(700);
      if (await ev(() => [...document.querySelectorAll('.twn-p .jp button[data-j]')].some(b => /아직 안 가 봤어요/.test(b.textContent)))) { await ev(() => { const B = [...document.querySelectorAll('.twn-p .jp button[data-j]')].find(b => /아직 안 가 봤어요/.test(b.textContent)); B.classList.add('zz-unv'); }); await press('.twn-p .zz-unv'); I = await gi(); ok(I && I.off && /아직 안 가 본 곳/.test(I.no), '안 가 본 곳 = 흐림 + 「' + (I && I.no) + '」'); await shot('go_unvisited');
        const s0 = await st(); await pickGo('g'); const s1 = await st(); ok(!!s1.route && s1.tpn === s0.tpn && Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1]) < 1, '안 가 본 곳 길 안내 = 빨간 선 · 수 그대로'); } else ok(false, '안 가 본 곳 단추 없음');
      await closeAll(); await ev(() => SM_TOWN.hud.unlock('map', false)); await W8(200); await closeAll(); await p.keyboard.press('KeyM'); await W8(800);
      { const r = await ev(() => { const cv = document.querySelector('.twn-p canvas.twn-big'); if (!cv || !cv._pt) return null; const [X0, Z0, X1, Z1] = SM_TOWN.ask.ext(), R = cv.getBoundingClientRect(), q = cv._pt(X1, (Z0 + Z1) / 2); return [R.left + q[0] * R.width / cv.width - 0.6, R.top + q[1] * R.height / cv.height]; });   /* 지도 오른쪽 끝 화소 = 걷기 경계(EX1 - 3) 밖 */ if (r) { await p.mouse.click(r[0], r[1]); await W8(400); I = await gi(); ok(I && I.off && /마을 밖/.test(I.no), '큰 지도 끝(마을 밖) = 흐림 + 「' + (I && I.no) + '」'); } else ok(false, '큰 지도 안 열림'); }
      await closeAll();
      console.log('⑥ 두 번 누르기 · 찾기 칸 Enter');
      await ev(() => SM_TOWN.pathOff()); await p.keyboard.press('KeyJ'); await W8(700); { const s0 = await st(); await press('.twn-p .jp button[data-j="' + tgt + '"]', 'dbl'); await W8(600); const s1 = await st(); ok(!s1.go && !s1.panel && !!s1.route && s1.tpn === s0.tpn && Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1]) < 1, '두 번 누르기 = 길 안내 바로(창 닫힘 · 수·자리 그대로)'); }
      await ev(() => SM_TOWN.pathOff()); await p.keyboard.press('KeyJ'); await W8(700); await ev(() => { const q = document.querySelector('.twn-p .jq'); q.focus(); q.value = '마트'; q.dispatchEvent(new Event('input')); }); await W8(300);
      { const s0 = await st(); await p.keyboard.press('Enter'); await W8(800); const s1 = await st(); ok(!s1.go && !s1.panel && !!s1.route && s1.tpn === s0.tpn && Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1]) < 1, '찾기 칸 Enter = 창 없이 맨 위 길 안내(수·자리 그대로)'); }
      ok(!errs.length, '페이지 오류 0 ' + errs.slice(0, 3).join(' | ')); await P.ctx.close(); }

    // ───── C. 휴대폰 세로 · 가로 ─────
    for (const [nm, opt] of [['세로', { ...devices['iPhone 13'], deviceScaleFactor: 1 }], ['가로', { ...devices['iPhone 13 landscape'], deviceScaleFactor: 1 }]]) {
      const P = await page(b, opt, BASE, true), { p, ev, W8, shot, gi, st, pickGo, errs } = P;
      console.log('⑦ 휴대폰 ' + nm + ' ' + JSON.stringify(opt.viewport));
      await p.keyboard.press('KeyJ'); await W8(800);
      const vw = await ev(() => [innerWidth, innerHeight]);
      for (const frac of [0.75, 0.3]) {
        const q = await ev(f => { const B = [...document.querySelectorAll('.twn-p .jp button[data-j]')], H = innerHeight; for (const f9 of (f > 0.5 ? [0.75, 0.68, 0.62, 0.56] : [0.3, 0.25, 0.35, 0.2])) for (const e of (f > 0.5 ? B.slice().reverse() : B).slice(0, 12)) { const bx = e.closest('.bx'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); bx.scrollTop += (r.top + r.height / 2) - H * f9; const r2 = e.getBoundingClientRect(), x = r2.left + Math.min(r2.width / 2, 60), y = r2.top + r2.height / 2, hit = document.elementFromPoint(x, y); if (hit && e.contains(hit) && (f > 0.5 ? y > H * 0.5 : y < H * 0.45)) return [x, y]; } return null; }, frac);
        if (!q) { ok(false, nm + ' 누를 단추를 ' + (frac > 0.5 ? '아래' : '위') + '에 못 둠'); continue; }
        await W8(100); await p.touchscreen.tap(q[0], q[1]); await W8(400); const I = await gi();
        ok(!!I, nm + ' ' + (frac > 0.5 ? '아래쪽' : '위쪽') + ' 단추 터치 = 고르기 창'); if (!I) continue;
        const inV = I.card.x >= 0 && I.card.y >= 0 && I.card.x + I.card.w <= vw[0] + 1 && I.card.y + I.card.h <= vw[1] + 1, cover = q[0] >= I.card.x && q[0] <= I.card.x + I.card.w && q[1] >= I.card.y && q[1] <= I.card.y + I.card.h, side = (frac > 0.5 ? I.card.y + I.card.h <= q[1] : I.card.y >= q[1]) || I.card.x >= q[0] || I.card.x + I.card.w <= q[0];   /* 위·아래로 비키거나(세로) 옆으로 비킴(가로) */
        ok(I.g.h >= 44 && I.j.h >= 44 && I.x.h >= 44 && I.g.w >= 44, nm + ' 단추 높이 ' + [I.g.h, I.j.h, I.x.h].join('/') + 'px(44 이상)'); ok(inV, nm + ' 창이 화면 안 ' + JSON.stringify(I.card)); ok(!cover && side, nm + ' 누른 자리(' + q.map(Math.round) + ')를 안 덮고 비켜 뜸(창 ' + I.card.x + ',' + I.card.y + ' ' + I.card.w + '×' + I.card.h + ')');
        if (frac > 0.5) { await shot('go_phone_' + (nm === '세로' ? 'port' : 'land')); await pickGo('x', 'tap'); ok(!(await ev(() => !!document.querySelector('.twn-go'))) && !!(await ev(() => document.querySelector('.twn-p'))), nm + ' 닫기 터치 = J 창으로'); }
        else { const s0 = await st(); await pickGo('g', 'tap'); const s1 = await st(); ok(!s1.go && !s1.panel && !!s1.route && Math.hypot(s1.me[0] - s0.me[0], s1.me[1] - s0.me[1]) < 1, nm + ' 터치로 길 안내 = 빨간 선 · 자리 그대로'); }
      }
      ok(!errs.length, nm + ' 페이지 오류 0 ' + errs.slice(0, 3).join(' | ')); await P.ctx.close(); }
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); }
  await b.close(); console.log('(' + Math.round((Date.now() - T0) / 1000) + '초) ' + (fails.length ? 'FAIL ' + fails.length + ' — ' + fails.slice(0, 6).join(' / ') : 'PASS')); process.exit(fails.length ? 1 : 0); })();
