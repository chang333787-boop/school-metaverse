// 화학 규칙 시험(CHEM-1 · 사용자 10-18 '야숨식 자유도 · 우와 이것도 되네' · docs/systems/town_chem.md): node tools/harness/town_chem.cjs [마을=ourtown] [포트=8002] [--only=dry,puddle,freeze,fire,melt,seed,book]
//   규칙마다 일으키기 → 결과 확인 · 페이지 오류 0 · 1초 칸 비용(ms) · 그리기 수 차이(화학 그림 켬 − 끔 ≤ 2)
//   시간·날씨·계절은 시험 손잡이로 바꿈(SM_TOWN.rules · GAME.S.min · SM_TOWN.chem.set) — 브라우저는 brun.sh 한 자리로 돌림
const { chromium } = require('playwright');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const onlyA = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7), ONLY = onlyA ? new Set(onlyA.split(',')) : null; let RL = [], BOOK = false; const want = k => (!ONLY || ONLY.has(k)) && (k === 'book' ? BOOK : RL.includes(k));   /* 그 판에 있는 규칙만(조각 패치마다 같은 하네스) */
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), info = () => ev(() => SM_TOWN.chem.info()), toast = () => ev(() => { const t = document.getElementById('toast'); return t && t.getClientRects().length ? t.textContent : ''; });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.chem && !SM_TOWN.chem.pend && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(800);
    // 손잡이: 시계 멈춤 · 때 바꾸기(엔진 하늘까지) · 자리 옮기기
    await ev(() => { const G = typeof SM_TOWN.game === 'function' ? SM_TOWN.game() : SM_TOWN.game; window.__G = G.S ? G : { S: G }; if (window.__G.setClock) window.__G.setClock(false); });
    const at = (min, ph) => ev(([m, k]) => { __G.S.min = m; if (k && SD2.map.time) SD2.map.time(k); SM_TOWN.chem.sec(); }, [min, ph]);
    const tp = (x, z) => ev(([x9, z9]) => { SD2.map.player.teleport([x9, SM_TOWN.ground(x9, z9) + 0.05, z9]); }, [x, z]);
    const wx = w => ev(w9 => SM_TOWN.rules.wx(w9), w);
    RL = await ev(() => SM_TOWN.chem.rules()); BOOK = await ev(() => SM_TOWN.chem.book); console.log('규칙 ' + RL.join(' · ') + (BOOK ? ' · 도감' : ''));
    let I = await info(); console.log('화학 규칙 — 웅덩이 ' + I.puddles + ' · 논 얼음 조각 ' + (I.iceTiles ?? '-') + '(논 ' + (I.fields ?? '-') + ') · 모닥불 ' + I.fires.length + ' · 민들레 ' + (I.spots ? I.spots.length : '-'));
    ok(I.on, '화학 규칙 켜짐'); ok(I.buildMs < 120, '짓기(첫 1초 칸 한 번) ' + I.buildMs + 'ms'); ok(I.puddles > 0, '웅덩이 자리 있음(' + I.puddles + ')');
    await ev(() => SM_TOWN.chem.set({ found: null, blown: null, wet: 0, w: 0, ice: 0, relight: true }));   /* 없는 규칙의 손잡이는 그냥 지나감 */
    // ── 규칙 1: 비에 젖음 → 처마 밑은 안 젖음 → 모닥불 곁에서 김 내며 마름 ──
    if (want('dry')) { console.log('규칙 1 젖음·마름');
      const P = await ev(() => { const L = SM_TOWN.chem.puddleList(); for (const q of L) if (!SM_TOWN.chem.eaves(q.x, q.z)) return q; return L[0]; });
      await at(12 * 60, 'day'); await tp(P.x, P.z); await wx('rain'); await W8(3200); I = await info();
      ok(I.wet >= 0.9, '비 3초 = 젖음 ' + I.wet); ok(I.pts && I.pts.vis, '몸에서 물방울(점 풀 보임)');
      const B = await ev(() => { for (const B9 of SM_TOWN._B) { if (!(B9.h >= 3) || /green|pitch|park|lot/.test(B9.kind || '')) continue; const c = Math.cos(B9.ry || 0), s = Math.sin(B9.ry || 0); for (const [lx, lz] of [[0, B9.d / 2 + 0.6], [0, -B9.d / 2 - 0.6], [B9.w / 2 + 0.6, 0], [-B9.w / 2 - 0.6, 0]]) { const x = B9.cx + lx * c + lz * s, z = B9.cz - lx * s + lz * c; if (!SD2.map.q.blocked(x, z, SM_TOWN.ground(x, z) + 0.2) && SM_TOWN.chem.eaves(x, z)) return [x, z]; } } return null; });
      if (B) { await tp(B[0], B[1]); await ev(() => SM_TOWN.chem.set({ wet: 0 })); await W8(2600); I = await info(); ok(I.wet < 0.05, '처마 밑(건물 곁 1m)은 비에 안 젖음 ' + I.wet); } else ok(false, '처마 자리 못 찾음');
      if (I.fires.length) { await wx('clear'); await ev(() => SM_TOWN.chem.set({ relight: true, wet: 1 })); const F = I.fires[0]; await tp(F.x + 1.6, F.z); await W8(1500); I = await info(); ok(!I.fires[0].out, '모닥불 켜짐'); ok(I.pts && I.pts.vis, '모닥불 곁 = 김(점 풀 보임)');
        await W8(10500); I = await info(); ok(I.wet === 0, '모닥불 곁 11초 = 다 마름 ' + I.wet); ok(I.found.includes('dry'), '도감: 젖은 옷이 말라요(알아냄)'); await W8(2800); const t9 = await toast(); ok(/알아냈어요/.test(t9), '💡 알아냈어요 한 줄 — ' + t9.slice(0, 50)); }
      else { await wx('clear'); await ev(() => SM_TOWN.chem.set({ wet: 1 })); await W8(1500); I = await info(); ok(I.wet < 1, '햇볕에 마르는 중 ' + I.wet); } }
    // ── 규칙 2: 비 → 웅덩이 · 첨벙 · 맑은 낮이 지나면 사라짐 ──
    if (want('puddle')) { console.log('규칙 2 웅덩이');
      await at(12 * 60, 'day'); await wx('rain'); await ev(() => SM_TOWN.chem.set({ w: 1.1 })); I = await info(); ok(I.wetPuddles >= Math.min(10, I.puddles * 0.5), '비 = 웅덩이 ' + I.wetPuddles + '/' + I.puddles);
      const P = await ev(() => SM_TOWN.chem.puddleList().filter(q => q.sz > 0).sort((a, b) => b.sz - a.sz)[0]);
      await tp(P.x + 4, P.z); await W8(1300); I = await info(); ok(I.dome && I.dome.vis, '가까운 웅덩이 = 둥근 판 보임'); ok(I.splashTrig > 0, '둘레 첨벙 트리거 ' + I.splashTrig);
      await tp(P.x, P.z); await W8(700);
      const L1 = await ev(x9 => SM_TOWN.chem.puddleList().find(q => Math.abs(q.x - x9) < 0.05), P.x); ok(L1 && L1.sp === 1, '웅덩이에 들어가면 첨벙(물보라)'); I = await info(); ok(I.pts && I.pts.vis, '물보라 점 보임');
      await wx('clear'); await at(12 * 60, 'day'); const z0 = await ev(() => SM_TOWN.chem.puddleList().reduce((a, q) => a + Math.max(0, q.sz), 0)); await at(13 * 60, 'day'); const z1 = await ev(() => SM_TOWN.chem.puddleList().reduce((a, q) => a + Math.max(0, q.sz), 0)); ok(z1 < z0, '맑은 낮 한 시간 = 웅덩이가 줄어듦(크기 합 ' + z0.toFixed(1) + ' → ' + z1.toFixed(1) + ')'); await at(16 * 60, 'day'); I = await info(); ok(I.wetPuddles === 0, '맑은 낮 네 시간 = 웅덩이 다 마름 (물기 ' + I.w + ')'); ok(I.found.includes('puddle'), '도감: 웅덩이가 사라져요(알아냄)'); }
    // ── 규칙 3: 겨울 해 질 녘 얼음(가장자리부터) · 아침까지 · 미끄럼 · 한낮에 녹음 · 연못도 · 강은 안 얾 ──
    if (want('freeze') || want('melt')) { await wx('clear'); await ev(() => SM_TOWN.rules.season('winter')); await p.waitForFunction(() => SM_TOWN.season === 'winter' || (typeof SM_TOWN.season === 'function' && SM_TOWN.season() === 'winter') || true, null, { timeout: 60000 }); await W8(6000); }
    if (want('freeze')) { console.log('규칙 3 얼음');
      I = await info(); if (!I.iceTiles) ok(false, '논 얼음 조각 없음(논이 없는 마을?)');
      await ev(() => SM_TOWN.chem.set({ ice: 0, mode: 1 })); await at(16 * 60 + 59, 'day'); await at(17 * 60, 'sunset'); await at(17 * 60 + 30, 'sunset'); I = await info(); ok(I.ice > 0 && I.ice < 1, '해 질 녘 0℃ 아래 30분 = 얼기 시작 ' + I.ice); ok(I.iceOn > 0 && I.iceOn < I.iceTiles, '가장자리부터 얼음 ' + I.iceOn + '/' + I.iceTiles);
      await at(19 * 60 + 30, 'night'); I = await info(); ok(I.ice === 1 && I.iceOn === I.iceTiles, '밤 = 다 얼음');
      const pondIce = await ev(() => { const m = SM_TOWN.mats.pond; return m && m.userData.chem9 ? 1 : 0; }); ok(pondIce === 1, '연못 재질에 얼음 값');
      const T = await ev(() => SM_TOWN.chem.iceList().filter(t => t.on).sort((a, b) => b.r - a.r)[0]);
      await at(8 * 60, 'day'); await tp(T.x, T.z); await W8(800); await ev(() => SD2.map.player.face(90)); await p.keyboard.down('KeyD'); await W8(700); await p.keyboard.up('KeyD'); const a0 = await ev(() => { const q = SD2.map.player.get(); return [q.x, q.z]; }); await W8(1200); const a1 = await ev(() => { const q = SD2.map.player.get(); return [q.x, q.z]; });
      const sl = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]); ok(sl > 0.6, '언 논: 손을 떼도 미끄러져 나감 ' + sl.toFixed(2) + 'm'); ok((await info()).found.includes('freeze'), '도감: 물이 얼고 녹아요(알아냄)');
      let mid = null; for (let m = 9 * 60; m <= 12 * 60 + 30; m += 15) { await at(m, 'day'); const q = await info(); if (q.ice > 0 && q.ice < 1 && (!mid || Math.abs(q.ice - 0.5) < Math.abs(mid.ice - 0.5))) mid = q; } ok(!!mid && mid.iceOn > 0 && mid.iceOn < mid.iceTiles, '한낮 = 가장자리부터 녹는 중' + (mid ? ' ' + mid.ice + ' · ' + mid.iceOn + '/' + mid.iceTiles : ''));
      I = await info(); ok(I.ice === 0 && I.iceOn === 0, '12시 반 = 다 녹음'); }
    // ── 규칙 4: 모닥불 쬐기 → 물 부어 끄기(김) · 비가 오면 꺼짐 · 관리인이 다시 피움 ──
    if (want('fire')) { console.log('규칙 4 불과 물'); await wx('clear'); await at(12 * 60, 'day'); await ev(() => SM_TOWN.chem.set({ relight: true })); I = await info();
      if (!I.fires.length) ok(false, '모닥불 없음(캠핑장 없는 마을?)'); else { const F = I.fires[0]; await tp(F.x + 1.6, F.z); await W8(600);
        let r = await ev(() => SM_TOWN.chem.fireUse(0)); ok(/물 부어|Pour/.test(r.label), '쬐기 뒤 E = 물 부어 끄기 — ' + r.label); r = await ev(() => SM_TOWN.chem.fireUse(0)); await W8(2200); I = await info();
        ok(I.fires[0].out === 'k', '물 부으면 꺼짐'); ok(I.pts && I.pts.vis, '김 기둥(점 풀 보임)'); const t9 = await toast(); ok(/어른과 함께|grown-up/.test(t9), '불 안전 한 줄 — ' + t9.slice(0, 40)); await W8(3000); ok((await info()).found.includes('fire'), '도감: 물이 불을 꺼요(알아냄)');
        await ev(() => SM_TOWN.chem.set({ relight: true })); await wx('rain'); await W8(1300); I = await info(); ok(I.fires[0].out === 'r', '비 = 모닥불 꺼짐');
        await wx('clear'); await at(13 * 60, 'day'); await at(13 * 60 + 50, 'day'); I = await info(); ok(!I.fires[0].out, '비 그치고 40분 = 관리인이 다시 피움'); } }
    // ── 규칙 5: 겨울 모닥불 곁 눈이 녹아 웅덩이 · 눈사람 녹음 · 0℃ 아래면 다시 얼음 ──
    if (want('melt')) { console.log('규칙 5 녹고 다시 얾'); await wx('clear'); I = await info();
      if (!I.fires.length) ok(false, '모닥불 없음'); else { const F = I.fires[0]; await ev(() => SM_TOWN.chem.set({ relight: true })); await tp(F.x + 1.6, F.z + 2.5); await at(10 * 60, 'day'); await at(10 * 60 + 30, 'day'); I = await info(); ok(I.fires[0].ring === 'w', '켜진 불 곁 30분 = 눈이 녹아 웅덩이');
        await tp(F.x + 3.3, F.z); await ev(() => SD2.map.player.face(270)); await W8(500); await p.keyboard.press('KeyN'); await W8(600); const nS = await ev(() => (__G.S.snowmen || []).length); ok(nS > 0, '모닥불 곁에 눈사람(N)'); await W8(9000); I = await info(); ok(I.sp.includes('w'), '불 곁 눈사람 = 물방울 내며 녹아 웅덩이'); ok(I.found.includes('melt'), '도감: 녹았다 얼었다(알아냄)');
        if (RL.includes('fire')) { await ev(() => SM_TOWN.chem.set({ fireOut: 0, why: 'kid' })); await at(19 * 60, 'night'); await at(19 * 60 + 40, 'night'); I = await info(); ok(I.fires[0].ring === 'i', '불이 꺼지고 0℃ 아래 = 녹은 물이 다시 얼음 (' + I.fires[0].ring + ')'); }
        await ev(() => { __G.S.day++; __G.S.min = 7 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.chem.sec(); }); I = await info(); ok(I.fires[0].ring === 'i' && I.sp.includes('i'), '밤사이 0℃ 아래 = 아침엔 얼음 (' + I.fires[0].ring + ' · ' + I.sp.join('') + ')'); await W8(1600); ok(I.found.includes('melt2'), '도감: 녹은 물은 다시 얼어요'); } }
    if (want('freeze') || want('melt')) { await ev(() => SM_TOWN.rules.season('summer')); await W8(6000); }
    // ── 규칙 6: 민들레 홀씨 → 바람 쪽 → 사흘 뒤 꽃 ──
    if (want('seed')) { console.log('규칙 6 씨 퍼짐'); await wx('clear'); await at(11 * 60, 'day'); await ev(() => SM_TOWN.chem.set({ blown: null })); await W8(1200); I = await info();
      if (!I.spots.length) ok(false, '민들레 자리 없음(공원이 없는 마을?)'); else { ok(I.spots.some(s => s.st === 'h'), '여름 공원 = 민들레 홀씨'); let s0 = null; for (let i = 0; i < I.spots.length && !s0; i++) { const q = I.spots[i]; await ev(() => SM_TOWN.chem.set({ blown: null })); await W8(1100); await tp(q.x + 1.2, q.z); await W8(400); await ev(k => SM_TOWN.chem.blow(k), i); await W8(1400); if ((await info()).seeds.length) s0 = { ...q, i }; }
        I = await info(); ok(I.seeds.length === 1, '홀씨를 불면 씨 기록(바람 ' + I.wind + ')'); ok(I.pts && I.pts.vis, '홀씨 스무 점이 날아감'); ok(s0 && I.spots[s0.i].st === 'b', '분 민들레 = 홀씨 없음'); const t9 = await toast(); ok(/쪽으로|blows/.test(t9), '바람 쪽 한 줄 — ' + t9.slice(0, 40));
        const sd = I.seeds[0], dx = sd.x - s0.x, dz = sd.z - s0.z, W = await ev(() => SM_TOWN.chem.wind()); ok((dx * W.x + dz * W.z) / Math.hypot(dx, dz) > 0.6, '씨가 바람 쪽에 앉음');
        await ev(() => SM_TOWN.chem.set({ seedsDue: true })); I = await info(); ok(I.flowers > 0, '사흘 뒤 = 민들레꽃 ' + I.flowers); await tp(sd.x + 2, sd.z); await W8(1300); ok((await info()).found.includes('seed'), '도감: 씨가 바람을 타요(알아냄)'); } }
    // ── 규칙 도감(수첩 🔬 규칙 칸) ──
    if (want('book')) { console.log('규칙 도감'); const r = await ev(() => { SM_TOWN.chem.open(); const P = document.querySelector('.twn-p'); return P ? { tab: !!P.querySelector('[data-nb]') && [...P.querySelectorAll('[data-nb]')].some(b => /규칙|Rules/.test(b.textContent)), cards: P.querySelectorAll('.grp').length, txt: P.textContent.slice(0, 80), ask: /❔/.test(P.textContent), unit: /4학년 과학|Grade 4/.test(P.textContent) } : null; });
      ok(r && r.tab, '수첩 탭에 🔬 규칙'); ok(r && r.cards >= 7, '카드 여섯 + 낱말 상자 ' + (r && r.cards)); ok(r && r.unit, '4학년 과학 단원 이어짐'); console.log('    ' + (r && r.txt)); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); }
    // ── 비용: 1초 칸 · 그리기 수 ──
    { const c = await ev(() => { const t0 = performance.now(); for (let i = 0; i < 40; i++) SM_TOWN.chem.sec(); return (performance.now() - t0) / 40; }); I = await info(); ok(c < 1.5, '1초 칸 한 번 = ' + c.toFixed(3) + 'ms(평균 · 자연 ' + I.cost.avg + ' · 최대 ' + I.cost.max + ')');
      await wx('rain'); await ev(() => SM_TOWN.chem.set({ w: 1.1, wet: 1 })); const P = await ev(() => SM_TOWN.chem.puddleList().filter(q => q.sz > 0)[0]); if (P) await tp(P.x + 2, P.z + 1); await ev(() => SD2.map.player.freeze(true)); await W8(900);
      const calls = async v => { await ev(v9 => SM_TOWN.chem.vis(v9), v); let n = 0; for (let i = 0; i < 6; i++) { await W8(60); n += await ev(() => SD2.renderer.info.render.calls); } return n / 6; };
      const on1 = await calls(true), off1 = await calls(false), on2 = await calls(true); const d = ((on1 + on2) / 2 - off1); ok(d <= 2.5, '그리기 수 차이 ' + d.toFixed(1) + '(켬 ' + on1.toFixed(0) + ' · 끔 ' + off1.toFixed(0) + ')'); await ev(() => SD2.map.player.freeze(false)); await wx('clear'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } finally { await b.close(); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
