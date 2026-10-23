// 마을 야생동물 시험(WILD-1 · 사용자 10-19 '야생동물이 너무 없긴 하네' · docs/systems/town_wild.md): node tools/harness/town_wild.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   서식지마다 하나 이상 나옴(산·숲 · 강 · 연못 · 논 · 밤 수달 · 겨울 청둥오리) · 걸어서 다가가면 4m까지(달아나지 않음) · E 살펴보기 → 카드·도감 칸 · 뛰면 달아남(새 = 날아오름)
//   · 쪼그려(C) 다가가면 2m까지 · 가만히 있기(쪼그려 3초) = 겁 많은 동물이 먼저 다가옴 · 관찰 별(10번 ⭐ · 30번 ⭐⭐ · 모두 ⭐⭐ = 칭호) · 도감 실루엣·★ 스티커
//   · 개구리는 물로 뛰어듦 · 갈대 물가 개구리 · 밤 큰 나무 솔부엉이 · 겨울엔 개구리·백로 없음 · 1초 칸 비용 · 그리기 수 차이(종마다 +1 안쪽) · 페이지 오류 0
//   시간·날씨·계절은 시험 손잡이로 바꿈(SM_TOWN.rules · GAME.S.min · SD2.map.time) — 브라우저는 한 자리로 돌림(맥 과열 X)
const { chromium } = require('playwright');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8);
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), info = () => ev(() => SM_TOWN.wild().info()), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS.replace(/\/$/, '') + '/' + n + '.png' }); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.wild && SM_TOWN.wild() && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(800);
    await ev(() => { const G = typeof SM_TOWN.game === 'function' ? SM_TOWN.game() : SM_TOWN.game; window.__G = G.S ? G : { S: G }; if (window.__G.setClock) window.__G.setClock(false); });
    const at = (min, ph) => ev(([m, k]) => { __G.S.min = m; if (SD2.map.time) SD2.map.time(k); SM_TOWN.rules.wx('clear'); }, [min, ph]);
    const sec = () => ev(() => SM_TOWN.wild().sec()), reset = () => ev(() => SM_TOWN.wild().reset());
    // 그 동물 곁(d m · 걸어 닿는 마른 땅 · 동물과 나 사이가 막히지 않음)으로 옮기고 동물을 바라봄
    const near = (j, d, look = true) => ev(([j9, d9, lk]) => { const s = SM_TOWN.wild().info().spots[j9], fl9 = /mallard|spotbill/.test(s.id), ok9 = (x, z) => SM_TOWN.sd(x, z) > 0.4 && !SD2.map.q.blocked(x, z, SM_TOWN.ground(x, z) + 0.3);
      for (let k = 0; k < 48; k++) { const a = k * 0.7854 * 0.5 + (k >= 16 ? 0.2 : 0), dd = d9 + (k >= 32 ? 1.5 : 0), x = s.hx + Math.cos(a) * dd, z = s.hz + Math.sin(a) * dd; if (!ok9(x, z)) continue; let clear = true; if (!fl9) for (let i = 1; i < 10; i++) { const u = i / 10, xx = x + (s.hx - x) * u * 0.8, zz = z + (s.hz - z) * u * 0.8; if (SD2.map.q.blocked(xx, zz, SM_TOWN.ground(xx, zz) + 0.3) || Math.abs(SM_TOWN.ground(xx, zz) - SM_TOWN.ground(x, z)) > 1.2) { clear = false; break; } } if (!clear) continue;
        SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); if (lk) SD2.map.player.lookAt([s.hx, s.hz]); return { x, z, d: dd }; } return null; }, [j, d, look]);
    const spot = j => ev(j9 => SM_TOWN.wild().info().spots[j9], j), dist = j => ev(j9 => { const s = SM_TOWN.wild().info().spots[j9], m = SD2.map.player.get(); return +Math.hypot(s.x - m.x, s.z - m.z).toFixed(2); }, j);
    await at(11 * 60, 'day'); let I = await info();
    const SP = I.spots, by = id => SP.filter(s => s.id === id), habs = { '산·숲': ['chipmunk', 'waterdeer'], '강': ['heron', 'otter'], '연못': ['spotbill'], '논': ['frog', 'egret'], '큰 나무': ['owl'] };
    console.log('야생동물 자리 ' + I.n + ' · 짓기 ' + I.buildMs + 'ms · ' + Object.entries(I.mesh).map(([k, m]) => k + ' ' + by(k).length + '곳/' + m.tri + '면').join(' · '));
    ok(I.on && I.n > 0, '야생동물 켜짐(자리 ' + I.n + ')'); ok(I.buildMs < 80, '자리 고르기 ' + I.buildMs + 'ms');
    for (const [h, L] of Object.entries(habs)) ok(L.some(id => by(id).length), '서식지 ' + h + ' 자리 있음 (' + L.map(id => id + ' ' + by(id).length).join(' · ') + ')');
    ok(by('frog').some(s => s.reed) && by('frog').some(s => !s.reed), '개구리 = 갈대 물가 ' + by('frog').filter(s => s.reed).length + '곳 + 논 가장자리 ' + by('frog').filter(s => !s.reed).length + '곳');
    // ── 1. 서식지마다 나옴(여름 낮 · 수달 = 밤 · 청둥오리 = 겨울) ──
    console.log('1. 서식지마다 나옴');
    for (const id of ['chipmunk', 'waterdeer', 'heron', 'spotbill', 'frog', 'egret']) { const s = by(id)[0]; if (!s) continue; await reset(); const r = await near(s.j, 9); await W8(1300); await sec(); const q = await spot(s.j); ok(!!r && q.act && q.st < 2, id + ' 나옴(9m · 여름 낮) — ' + (r ? 'd ' + r.d.toFixed(1) : '설 곳 없음') + ' · act ' + q.act + ' st ' + q.st); if (id === 'chipmunk' || id === 'heron') await shot('wild_' + id); }
    { const s = by('otter')[0]; if (s) { await reset(); await near(s.j, 9); await at(11 * 60, 'day'); await W8(1200); await sec(); let q = await spot(s.j); ok(!q.act, '수달 = 낮엔 안 나옴(act ' + q.act + ')'); await at(22 * 60, 'night'); await sec(); await W8(300); q = await spot(s.j); ok(q.act, '수달 = 밤에 나옴(act ' + q.act + ')'); await at(11 * 60, 'day'); await sec(); } }
    { const s = by('owl')[0]; if (s) { await reset(); await near(s.j, 5); await at(11 * 60, 'day'); await W8(1200); await sec(); let q = await spot(s.j); ok(!q.act, '솔부엉이 = 낮엔 안 나옴(act ' + q.act + ')'); await at(22 * 60, 'night'); await sec(); await W8(300); q = await spot(s.j); ok(q.act && q.y > (await ev(([x, z]) => SM_TOWN.ground(x, z), [q.x, q.z])) + 1, '솔부엉이 = 밤 큰 나무 가지에 나옴(act ' + q.act + ' · 높이 ' + q.y + ')'); const h = await ev(() => SM_TOWN.wild().hot().filter(o => !o.off).map(o => o.label)); ok(h.some(l => /솔부엉이/.test(l)), '나무 밑 E = 솔부엉이 살펴보기'); await at(11 * 60, 'day'); await sec(); } }
    // ── 2. 걸어서 다가가면 4m까지 · E 살펴보기 → 카드 · 도감 칸 ──
    console.log('2. 걸어서 다가가기 · E 살펴보기');
    const shut = () => ev(() => { const P = document.querySelector('.twn-p'); if (!P) return; const b9 = P.querySelector('[data-a="x"]') || [...P.querySelectorAll('button')].find(e => /그대로|닫기|Keep|Close/.test(e.textContent)); if (b9) b9.click(); });   /* 레벨 보상 창(DOPA-1)이 걷는 중에 뜨면 닫음 */
    const walkTo = async (j, stopAt, keys) => { await shut(); await W8(300); for (const k of keys) await p.keyboard.down(k); let d = 99, fled = false, minD = 99; const t0 = Date.now(); while (Date.now() - t0 < 6000) { await W8(40); const q = await ev(j9 => { const s = SM_TOWN.wild().info().spots[j9], m = SD2.map.player.get(); return { d: Math.hypot(s.x - m.x, s.z - m.z), st: s.st }; }, j); d = q.d; minD = Math.min(minD, d); if (q.st >= 2) { fled = true; break; } if (d <= stopAt) break; await ev(j9 => { const s = SM_TOWN.wild().info().spots[j9]; SD2.map.player.lookAt([s.x, s.z]); }, j); }
      for (const k of keys.slice().reverse()) await p.keyboard.up(k); return { d: +d.toFixed(2), fled, minD: +minD.toFixed(2) }; };
    let lookId = null;
    for (const id of ['heron', 'waterdeer', 'egret', 'chipmunk']) { const s = by(id)[0]; if (!s) continue; await reset(); const r = await near(s.j, 11); if (!r) continue; await W8(1400); await sec(); await W8(200);
      const w = await walkTo(s.j, 3.9, ['KeyW']); await W8(600); const q = await spot(s.j); console.log('    ' + id + ' 걸어서 ' + r.d.toFixed(1) + 'm → ' + w.d + 'm (st ' + q.st + ')');
      if (w.fled || q.st >= 2 || w.d > 4.05) continue; lookId = id;   /* 걸어서 못 닿은 자리(물가 비탈·돌아다님)면 다음 동물 */
      ok(w.d <= 4.05 && q.st < 2, id + ': 걸어서 4m까지 다가감(' + w.d + 'm · 달아나지 않음)');
      const hot = await ev(() => { const H = SM_TOWN.wild().hot().filter(h => !h.off); return H.map(h => h.label); }); ok(hot.some(l => l.includes('살펴보기')), 'E 자리 켜짐 — ' + hot.join(' / '));
      await shot('wild_walk_' + id);
      await p.keyboard.press('KeyE'); await W8(700); const c = await ev(() => { const P = document.querySelector('.twn-p'); return P ? { cv: !!P.querySelector('canvas.twn-wild'), t: P.textContent } : null; });
      ok(c && c.cv, 'E = 살펴보기 카드(그림 캔버스)'); ok(c && ['사는 곳', '먹이', '겨울나기', '지키는 법'].every(k => c.t.includes(k)), '카드 = 사는 곳 · 먹이 · 겨울나기 · 지키는 법'); ok(c && /도감에 새로 적었어요/.test(c.t), '처음 = 도감에 새로 적었어요');
      await shot('wild_card_' + id);
      const dx = await ev(k => !!__G.S.dex['wild:' + k], id); ok(dx, '도감 칸 wild:' + id);
      await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(400);
      // 관찰 별: 같은 자리 한 마리는 하루 한 번 · 10번 = ⭐ · 30번 = ⭐⭐ · 모든 종 ⭐⭐ = 칭호(시험 = 셈을 9·29로 놓고 다음 날 한 번 더)
      const again = async () => { await ev(([j9]) => { const W = SM_TOWN.wild(); W.lookAt(j9); }, [s.j]); await W8(400); const t = await ev(() => { const P = document.querySelector('.twn-p'); return P ? P.textContent : ''; }); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(300); return t; };
      let t = await again(); ok(/오늘 벌써 셌어요/.test(t) && (await info()).stars[id] === 1, '같은 날 다시 살펴보기 = 셈 그대로 1번(오늘 벌써 셌어요)');
      await ev(k => { __G.S.wild.n[k] = 9; __G.S.day++; }, id); t = await again(); ok(/관찰 별을 받았어요/.test(t) && /⭐/.test(t), '10번째 = ⭐ 관찰 별');
      await ev(k => { const W = __G.S.wild; for (const q of SM_TOWN.wild().dexList()) W.n[q.id] = 30; W.n[k] = 29; __G.S.day++; }, id); t = await again(); ok(/⭐⭐/.test(t) && /들판 관찰가/.test(t), '모든 종 ⭐⭐ = 새 칭호 들판 관찰가'); ok(!!(await info()).title, '칭호 저장');
      await ev(k => { __G.S.wild = { n: { [k]: 1 }, k: {} }; }, id);
      break; }
    ok(!!lookId, '걸어서 4m까지 다가간 동물이 하나 이상');
    // 도감 창(가방 I → 🔍 도감 탭)의 야생동물 칸
    { await p.keyboard.press('KeyI'); await W8(600); await ev(() => { const t9 = [...document.querySelectorAll('.twn-p [data-nb]')].find(b9 => /도감|Guide/.test(b9.textContent)); if (t9) t9.click(); }); await W8(600);
      const t = await ev(() => { const P = document.querySelector('.twn-p'); return P ? P.textContent : ''; }); ok(/만난 야생동물/.test(t), '도감에 「만난 야생동물」 칸' + (lookId ? '' : ' (살펴본 동물 없음)'));
      const g9 = await ev(() => { const g = [...document.querySelectorAll('.twn-p .grp')].find(e => /야생동물/.test(e.textContent)), box = g && g.nextElementSibling; if (!box) return null; const C = [...box.children]; return { n: C.length, sil: C.filter(c => !c.querySelector('i') && c.querySelector('b img') && /❔/.test(c.textContent)).length, star: C.filter(c => /★/.test(c.textContent)).length, hint: (C.find(c => /❔/.test(c.textContent)) || {}).textContent }; });
      ok(/만난 야생동물/.test(t) && !/❔/.test(t), '도감: 만난 야생동물 칸 · 못 만난 ❔ 빈칸 0(UBI-1 · 찾은 것만 쌓임)'); await ev(() => { const g9 = [...document.querySelectorAll('.twn-p .grp')].find(e => /야생동물|Wild animals/.test(e.textContent)); if (g9) g9.scrollIntoView({ block: 'start' }); }); await W8(300); await shot('wild_dex');
      await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(300); await p.keyboard.press('Escape'); await W8(300); }
    // ── 3. 뛰면 달아남(12m) · 새는 날아오름 ──
    console.log('3. 뛰면 달아남');
    for (const id of ['heron', 'egret', 'waterdeer']) { const s = by(id)[0]; if (!s) continue; await reset(); const r = await near(s.j, 17); if (!r) continue; await W8(1400); await sec(); await W8(200); const y0 = (await spot(s.j)).y;
      const w = await walkTo(s.j, 1.0, ['ShiftLeft', 'KeyW']); console.log('    ' + id + ' 뛰어서 ' + r.d.toFixed(1) + 'm → 달아날 때 ' + w.d + 'm');
      ok(w.fled && w.d > 9, id + ': 뛰면 멀리서(' + w.d + 'm) 달아남');
      if (id !== 'waterdeer') { await W8(900); const q = await spot(s.j); ok(q.md === 3 && q.y > y0 + 1.2, id + ': 날아오름(모드 ' + q.md + ' · 높이 +' + (q.y - y0).toFixed(1) + 'm)'); await shot('wild_fly_' + id); await W8(11000); const q2 = await spot(s.j); ok(q2.st !== 2, id + ': 다른 물가에 내려앉거나 떠남(st ' + q2.st + ' · ' + Math.hypot(q2.x - s.hx, q2.z - s.hz).toFixed(0) + 'm 옮김)'); }
      else { await W8(3500); const q = await spot(s.j); ok(Math.hypot(q.x - s.hx, q.z - s.hz) > 15, '고라니: 멀리 뛰어감(' + Math.hypot(q.x - s.hx, q.z - s.hz).toFixed(0) + 'm)'); } }
    // ── 4. 쪼그려(C) 다가가면 2m까지 ──
    console.log('4. 쪼그려 다가가기');
    { const s = by('chipmunk')[0] || by('heron')[0]; if (s) { await reset(); const r = await near(s.j, 7); await W8(1400); await sec(); await W8(200); const cOK = await ev(() => SM_TOWN.wild().info().crouch); ok(cOK, '동물 곁 30m = 쪼그리기(C) 켜짐');
        await p.keyboard.down('KeyC'); await W8(300); const cr = await ev(() => SD2.map.player.crouched ? SD2.map.player.crouched() : null); ok(cr === true, 'C를 누르면 쪼그려 앉음');
        const w = await walkTo(s.j, 2.0, ['KeyW']); await p.keyboard.up('KeyC'); await W8(300); const q = await spot(s.j); ok(!w.fled && q.st < 2 && w.d <= 2.1, s.id + ': 쪼그려 2m까지(' + w.d + 'm · st ' + q.st + ')'); await shot('wild_crouch_' + s.id); } }
    // ── 4b. 가만히 있기: 쪼그려 3초 넘게 움직이지 않으면 겁 많은 동물이 먼저 다가옴 ──
    console.log('4b. 가만히 있기');
    { let done9 = false; for (const id of ['heron', 'waterdeer', 'egret', 'chipmunk']) { const s = by(id)[0]; if (!s) continue; await reset(); const r = await near(s.j, 9); if (!r) continue; await W8(1400); await sec(); await W8(200);
        await p.keyboard.down('KeyC'); await W8(300); const d0 = await dist(s.j); let mv = '', d1 = d0; const t0 = Date.now(); while (Date.now() - t0 < 9000) { await W8(250); const q = await spot(s.j); if (q.mv === 'come') mv = 'come'; d1 = await dist(s.j); if (mv && !q.mv) break; }
        await p.keyboard.up('KeyC'); await W8(200); const q = await spot(s.j); console.log('    ' + id + ' 쪼그려 가만히 ' + d0 + 'm → ' + d1 + 'm (' + (mv || '안 옴') + ')'); if (!mv) continue;
        ok(d1 < d0 - 2 && d1 >= 1.8 && q.st < 2, id + ': 가만히 있으니 먼저 다가옴(' + d0 + ' → ' + d1 + 'm · 달아나지 않음)'); await shot('wild_come_' + id); done9 = true; break; }
      ok(done9, '가만히 있기 = 다가오는 동물이 하나 이상'); }
    // ── 5. 개구리 = 놀라면 물로 뛰어듦 ──
    console.log('5. 개구리');
    { const s = by('frog').find(q => q.reed) || by('frog')[0]; if (s) { await reset(); await near(s.j, 8); await W8(1400); await sec(); await W8(200); const w = await walkTo(s.j, 1.0, ['ShiftLeft', 'KeyW']); ok(w.fled, '개구리: 뛰어 다가가면 달아남(' + w.d + 'm)'); await W8(250); const q = await spot(s.j); ok(q.md === 4, '개구리: 폴짝(모드 ' + q.md + ')'); await W8(1600); const q2 = await spot(s.j); ok(q2.st === 3, '개구리: 물로 뛰어들어 안 보임(st ' + q2.st + ')'); } }
    // ── 6. 비용: 1초 칸 · 그리기 수 ──
    console.log('6. 비용');
    { const s = by('heron')[0] || SP[0]; await reset(); await near(s.j, 8); await W8(1400); await sec(); await ev(() => SD2.map.player.freeze(true)); await W8(500);
      const c = await ev(() => { const W = SM_TOWN.wild(), t0 = performance.now(); for (let i = 0; i < 60; i++) W.sec(); return (performance.now() - t0) / 60; }); I = await info(); ok(c < 1.0, '1초 칸 한 번 = ' + c.toFixed(3) + 'ms(평균 · 자연 최대 ' + I.secMax + 'ms)');
      const vis = Object.values(I.mesh).filter(m => m.vis).length, calls = async v => { await ev(v9 => SM_TOWN.wild().vis(v9), v); let n = 0; for (let i = 0; i < 6; i++) { await W8(60); n += await ev(() => SD2.renderer.info.render.calls); } return n / 6; };
      const on1 = await calls(true), off1 = await calls(false), on2 = await calls(true), d = (on1 + on2) / 2 - off1; ok(vis >= 1 && d <= vis + 0.5, '그리기 수 차이 ' + d.toFixed(1) + ' ≤ 보이는 종 ' + vis + '(켬 ' + on1.toFixed(0) + ' · 끔 ' + off1.toFixed(0) + ')'); await ev(() => SD2.map.player.freeze(false)); }
    // ── 7. 겨울: 개구리·백로 없음 · 청둥오리 나옴 ──
    console.log('7. 겨울');
    await ev(() => SM_TOWN.rules.season('winter')); await W8(9000); await at(11 * 60, 'day'); await reset();
    { const L = (await info()).spots; const fr = L.filter(s => s.id === 'frog'), eg = L.filter(s => s.id === 'egret'); ok(fr.length > 0 && fr.every(s => !s.ok && !s.act), '겨울 = 개구리 없음(겨울잠 · ' + fr.length + '곳 모두 꺼짐)'); ok(eg.every(s => !s.ok && !s.act), '겨울 = 백로 없음(여름 철새)');
      const s = by('frog')[0]; if (s) { await near(s.j, 6); await W8(1300); await sec(); const q = await spot(s.j); ok(!q.act, '겨울 논 곁 = 개구리 안 나옴(act ' + q.act + ')'); }
      const m = L.find(s => s.id === 'mallard'); if (m) { await near(m.j, 6); await W8(1300); await sec(); const q = await spot(m.j); ok(q.act, '겨울 = 청둥오리 나옴(act ' + q.act + ')'); await shot('wild_mallard_winter'); } }
    await ev(() => SM_TOWN.rules.season('summer')); await W8(6000);
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } finally { await b.close(); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
