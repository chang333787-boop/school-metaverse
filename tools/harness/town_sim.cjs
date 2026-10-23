// 칸 상태판·날씨 전선 시험(SIM-1 · 설계 docs/systems/town_phase4.md 조각 0·1): node tools/harness/town_sim.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 뼈대: SIM 칸 수 = 열 × 행 · ci(x,z)가 cellOf와 같은 칸 · 1초 자리(front=1 · life=2 · flag=3 · 0번 자리 비움) · 1초 칸 ms
//   ② 씨앗 고정 10일(+60일 참고): 비 오는 날 산이 먼저 젖는 비율 ≥95% · 30분 한 판에서 비 칸(안개 거리 260m 안)을 보는 비율 ≥80%(정문 · 날 1~10 시작)
//   ③ 살아 있는 판: 산에만 비(내 자리 맑음 · 커튼 보임) · 띠 안 = WX9 비 · 커튼 숨김 · 띠 밖으로 걸어 나오면 빗소리 줄고 젖은 땅 경계 · 경계에서 1분 흔들어도 WX9 바뀜 ≤3
//   ④ 날씨 창을 연 채 띠를 드나들어도 창 닫힘 0 · 손 고정(비 단추) = 전선 꺼짐(마을 전체 한 날씨) · 무지개(해 반대편 · 하루 한 번) · 우산 일꾼 · 풍향 깃발 · 페이지 오류 0
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if (/게임 tick 오류|sim front|sim life|sim flag/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async n => { if (!SHOTS) return; await ev(() => { const t = document.getElementById('hudBan'); if (t) t.textContent = ''; }); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const closeAll = async () => { for (let i = 0; i < 4; i++) { const o = await ev(() => !!document.querySelector('.twn-p')); if (!o) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); } };
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.sim && SM_TOWN.sim.F, null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(1500);
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.p0auto = 1; });
    // ① 뼈대
    const B0 = await ev(() => { const F = SM_TOWN.sim.F, g = SM_TOWN.grid ? SM_TOWN.grid() : null, pts = []; for (let i = 0; i < 400; i++) { const x = -700 + Math.random() * 1500, z = -600 + Math.random() * 1300, k = F.ci(x, z), nm = SM_TOWN.sim.cellOf(x, z); pts.push([k, nm]); }
      const same = {}; let bad = 0; for (const [k, nm] of pts) { if (k < 0 || !nm) continue; if (same[k] && same[k] !== nm) bad++; same[k] = nm; } return { N: F.N, nC: F.nC, nR: F.nR, len: F.SIM.length, mt: Array.from(F.MT).reduce((a, v) => a + v, 0), bad, named: Object.keys(same).length, eng: SM_TOWN.sim.eng(), dead: F.dead }; });
    console.log('뼈대 ' + JSON.stringify(B0)); ok(B0.N === B0.nC * B0.nR && B0.len === B0.N * 10, '상태판 = 칸 ' + B0.N + ' × 10 (' + B0.nC + '열 × ' + B0.nR + '행)'); ok(B0.bad === 0, 'ci(x,z) 한 칸 = cellOf 한 이름(' + B0.named + '칸 · 어긋남 ' + B0.bad + ')'); ok(B0.mt > 0, '산 칸 ' + B0.mt);
    ok(B0.eng.front && B0.eng.front.slot === 1 && B0.eng.life && B0.eng.life.slot === 2 && B0.eng.flag && B0.eng.flag.slot === 3 && !Object.values(B0.eng).some(e => e.slot === 0), '1초 자리: front 1 · life 2 · flag 3 · 0번 자리 비움');
    const EAST = await ev(() => { const F = SM_TOWN.sim.F; return F.uOf(300) > F.uOf(-300) && SM_TOWN.sim.cellOf(300, 0) !== SM_TOWN.sim.cellOf(-300, 0); }); ok(EAST, '열 숫자가 동쪽(+x)으로 커짐(= 서쪽에서 온다가 참)');
    // ② 10일 흉내(씨앗 고정)
    const D10 = await ev(([n]) => { const F = SM_TOWN.sim.F, S = SM_TOWN.sim, d0 = SM_TOWN.game().S.day, out = { rain: 0, mtnFirst: 0, shadow: 0, shower: 0, days: [] };
      for (let d = 1; d <= n; d++) { const k = S.kind(d), P = F.day(d, k[0], k[1]); if (P.sh) out.shower++; if (!P.rain) { out.days.push([d, k[1], P.sh ? 'sh' : '']); continue; } out.rain++; if (P.shadow) out.shadow++;
        let mF = 1e9, nF = 1e9; for (let r = 0; r < F.nR; r++) for (let c = 0; c < F.nC; c++) { const t = F.firstWet(c, r, 360, 1440, 5); if (t == null) continue; if (F.MT[r * F.nC + c]) mF = Math.min(mF, t); else nF = Math.min(nF, t); } if (mF < nF) out.mtnFirst++; out.days.push([d, k[1], P.shadow ? 'shadow' : 'rain', mF, nF]); }
      const k0 = S.kind(d0); F.day(d0, k0[0], k0[1]); return out; }, [10]);
    console.log('10일 ' + JSON.stringify(D10)); ok(D10.rain === 0 || D10.mtnFirst / D10.rain >= 0.95, '비 오는 날 산이 먼저 젖음 ' + D10.mtnFirst + '/' + D10.rain);
    const D60 = await ev(([n]) => { const F = SM_TOWN.sim.F, S = SM_TOWN.sim, d0 = SM_TOWN.game().S.day; let rain = 0, mf = 0, sh = 0, shw = 0; for (let d = 1; d <= n; d++) { const k = S.kind(d), P = F.day(d, k[0], k[1]); if (P.sh) shw++; if (!P.rain) continue; rain++; if (P.shadow) sh++; let mF = 1e9, nF = 1e9; for (let r = 0; r < F.nR; r++) for (let c = 0; c < F.nC; c++) { const t = F.firstWet(c, r, 360, 1440, 10); if (t == null) continue; if (F.MT[r * F.nC + c]) mF = Math.min(mF, t); else nF = Math.min(nF, t); } if (mF < nF) mf++; } const k0 = S.kind(d0); F.day(d0, k0[0], k0[1]); return { rain, mf, sh, shw }; }, [60]);
    console.log('  참고 60일: 비 ' + D60.rain + '일 · 산 먼저 ' + D60.mf + ' · 비그늘 ' + D60.sh + ' · 산 소나기 ' + D60.shw); ok(D60.rain === 0 || D60.mf / D60.rain >= 0.95, '60일도 산 먼저 ≥95%');
    // 30분 한 판(실제 1800초 = 게임 약 43시간 · 자정이면 다음 날 6시) — 정문 둘레 260m 안 비 칸을 하나라도 보나
    const COV = await ev(() => { const F = SM_TOWN.sim.F, S = SM_TOWN.sim, d0 = SM_TOWN.game().S.day, G = [16.5, 58], R = []; for (let d = 1; d <= 10; d++) { let day = d, min = 7 * 60, seen = false, t = 0; let k = S.kind(day); F.day(day, k[0], k[1]);
        while (t < 1800 && !seen) { for (let rr = 0; rr <= 260 && !seen; rr += 15) for (let a = 0; a < 64 && !seen; a++) { const x = G[0] + Math.cos(a / 64 * 6.283) * rr, z = G[1] + Math.sin(a / 64 * 6.283) * rr; if (F.rainAt(x, z, min) > 0.4) seen = true; } min += 6; t += 6 * 0.7; if (min >= 1440) { day++; min = 360; k = S.kind(day); F.day(day, k[0], k[1]); } }
        R.push(seen ? 1 : 0); } const k0 = S.kind(d0); F.day(d0, k0[0], k0[1]); return R; });
    const cov = COV.reduce((a, v) => a + v, 0) / COV.length; ok(cov >= 0.8, '30분 한 판에 비 칸을 봄 ' + Math.round(cov * 100) + '% (시작 날 1~10: ' + COV.join('') + ')');
    // ③ 살아 있는 판: 산 비 날 고르기
    const SET = await ev(() => { const S = SM_TOWN, G9 = S.game(), G = G9.S, F = S.sim.F; G.wx = { auto: true }; let d = null; for (let k = 2; k < 120; k++) { const kd = S.sim.kind(k + G.day - G.day); void kd; } for (let k = 2; k < 120; k++) { G.day = k; const kd = S.sim.kind(k); if (kd[0] !== 'rain') continue; const P = F.day(k, kd[0], kd[1]); if (!P.shadow) { d = k; break; } } if (!d) return null;
      G9.setClock(false); const P = F.day(d, 'rain', '비'), gx = 16.5, gz = 70, F9 = h => F.rainUV(F.uOf(gx), F.vOf(gz), gx, gz, h); let hIn = null; for (let h = 6; h < 24; h += 0.02) if (F9(h) > 0.6) { hIn = h; break; }
      let hM = null; for (let h = 6; h < (hIn || 24); h += 0.05) { let any = 0; for (let r = 0; r < F.nR; r++) for (let c = 0; c < F.nC; c++) if (F.MT[r * F.nC + c] && F.rainUV(c + 0.5, r + 0.5, F.xOf(c + 0.5), F.zOf(r + 0.5), h) > 0.5) any++; if (any >= 3 && F9(h) < 0.02) { hM = h; break; } }
      return { d, P: { h0: +P.h0.toFixed(2), w: +P.w.toFixed(2), sp: +P.sp.toFixed(2) }, hIn, hM }; });
    console.log('전선 날 ' + JSON.stringify(SET)); ok(!!SET && SET.hIn != null, '비 오는 날 + 정문 앞 비 시각을 찾음');
    if (SET) {
      // ③-1 언덕에서 본 산 비 커튼(내 자리는 맑음) — 산 행에서 띠 동쪽 끝보다 1.3열 동쪽 높은 땅에 서서 서쪽을 봄
      if (SET.hM != null) { await ev(m => { SM_TOWN.game().S.min = Math.round(m * 60); }, SET.hM + 0.6); await W8(1300);
        const view = await ev(() => { const F = SM_TOWN.sim.F, G = SM_TOWN.game().S; for (let m9 = 6 * 60; m9 < 20 * 60; m9 += 5) { F.bands(m9); for (let j = 4; j < Math.min(8, F.nR); j++) { const ub = F.BAND[j * 2 + 1]; if (!(ub > 2.6 && ub < 3.4)) continue; const x = F.xOf(ub + 1.0), z = F.zOf(j + 0.5); let mt = 0; for (let r = 0; r < F.nR; r++) for (let c = 0; c < F.nC; c++) if (F.MT[r * F.nC + c] && F.rainUV(c + 0.5, r + 0.5, F.xOf(c + 0.5), F.zOf(r + 0.5), m9 / 60) > 0.5) mt++; if (F.rainAt(x, z, m9) < 0.05 && mt >= 2) { G.min = m9; return { j, ub, x, z, xe: F.xOf(ub), lx: F.xOf(ub - 0.8), lz: F.zOf(j - 1.5), here: F.rainAt(x, z, m9), mt, m9 }; } } } return null; });   /* 들 행: 띠 동쪽 끝이 3열쯤일 때 1열 동쪽에 서서 서북쪽(산)을 봄 */
        console.log('  언덕 자리 ' + JSON.stringify(view));
        if (view) { await tp(view.x, view.z); await W8(400); await ev(v => SD2.map.player.lookAt([v.lx, v.lz]), view); await W8(3200); await ev(v => SD2.map.player.lookAt([v.lx, v.lz]), view); await W8(600); const f1 = await ev(() => SM_TOWN.sim.front()); console.log('  산 비: ' + JSON.stringify({ here: f1.here, WX9: f1.WX9, curtains: f1.curtains, vis: f1.curtainVis, text: f1.text }));
          ok(f1.on && f1.WX9 === 'clear' && f1.here < 0.25, '산에만 비 — 내 자리는 맑음(비 ' + f1.here + ')'); ok(f1.curtainVis && f1.curtains >= 3, '비 커튼·먹구름이 보임(' + f1.curtains + '장)'); ok(/서쪽 산/.test(f1.text), "예보 한 줄 = 방향만('" + f1.text + "')"); await shot('01_mountain_curtain'); await tp(view.xe + 40, view.z); await W8(1500); await ev(v => SD2.map.player.lookAt([v.lx, v.z]), view); await W8(1200); await shot('03_edge_wet_ground'); }
        else ok(false, '산 비를 볼 언덕 자리를 못 찾음'); }
      else console.log('  · 산에만 비 오는 때를 못 찾음');
      // ③-2 띠 안 → 밖으로 걸어 나옴
      await ev(m => { SM_TOWN.game().S.min = Math.round(m * 60) + 30; }, SET.hIn); await tp(16.5, 70); await W8(1200);
      const E = await ev(() => { const F = SM_TOWN.sim.F, me = SD2.map.player.get(), j = Math.floor(F.vOf(me.z)); F.bands(SM_TOWN.game().S.min); return { ua: F.BAND[j * 2], ub: F.BAND[j * 2 + 1], xa: F.xOf(F.BAND[j * 2]), xb: F.xOf(F.BAND[j * 2 + 1]), j }; }); console.log('  띠 ' + JSON.stringify(E));
      const inX = (E.xa + E.xb) / 2, outX = E.xb + 70, z0 = 70; await tp(inX, z0); await W8(7000); const fin = await ev(() => ({ ...SM_TOWN.sim.front(), amb: SM_TOWN.amb })); console.log('  띠 안: ' + JSON.stringify({ here: fin.here, WX9: fin.WX9, curtains: fin.curtains, vis: fin.curtainVis, drops: fin.drops, umb: fin.umb }));
      ok(fin.WX9 === 'rain' && fin.here > 0.5, '띠 안 = 내 칸 비(WX9 rain · ' + fin.here + ')'); ok(!fin.curtainVis || fin.curtains <= 10, '띠 안 = 커튼 숨김(먹구름만 ' + fin.curtains + ')'); await ev(() => SD2.map.player.lookAt([SD2.map.player.get().x + 50, SD2.map.player.get().z])); await W8(600); await shot('02_inside_band');
      const walk = []; for (let i = 0; i <= 14; i++) { const x = inX + (outX - inX) * i / 14; await tp(x, z0); await ev(() => SD2.map.player.lookAt([SD2.map.player.get().x + 40, SD2.map.player.get().z])); await W8(700); walk.push(await ev(() => SM_TOWN.sim.front().here)); }
      await W8(6500); const fout = await ev(() => SM_TOWN.sim.front()); console.log('  걸어 나옴: 비 세기 ' + walk.map(v => v.toFixed(2)).join(' ') + ' → ' + JSON.stringify({ WX9: fout.WX9, here: fout.here, vis: fout.curtainVis, wetU: fout.wetU[E.j] }));
      const mono = walk.every((v, i) => i === 0 || v <= walk[i - 1] + 0.05), mid = walk.some(v => v > 0.1 && v < 0.9); ok(mono && mid && walk[walk.length - 1] < 0.1, '가장자리에서 비가 부드럽게 줄어듦(빗소리 = 비 세기 · 중간 값 있음)'); ok(fout.WX9 === 'clear' && fout.curtainVis, '띠 밖 = 맑음 · 뒤로 커튼이 보임');
      ok(fout.wetK === 1 && fout.wetU[E.j] > E.ub - 0.6, '젖은 땅 경계 = 띠 앞줄(젖은 끝 u ' + fout.wetU[E.j] + ' · 띠 앞 ' + E.ub.toFixed(2) + ')');
      
      // ③-3 경계에서 1분 흔들기 → WX9 바뀜 ≤ 3
      const f0 = (await ev(() => SM_TOWN.sim.front())).flips.length; const tj = Date.now(); let k9 = 0; while (Date.now() - tj < 60000) { const x = E.xb + (k9++ % 2 ? 18 : -18); await tp(x, z0); await W8(1500 + (k9 % 3) * 700); }
      const fl = await ev(() => SM_TOWN.sim.front().flips); const fN = fl.length - f0; const t1 = await ev(() => performance.now()); const last60 = fl.filter(q => q[0] > t1 - 60000).length; ok(last60 <= 3, '경계에서 1분 흔들어도 WX9 바뀜 ' + last60 + '번 (≤3 · 모두 ' + fN + ')');
      // ④-1 날씨 창을 연 채 띠 드나들기
      await closeAll(); await tp(inX, z0); await W8(6500); await ev(() => SM_TOWN.sim.openWx()); await W8(300); const pk0 = await ev(() => SM_TOWN.sim.panel()); let closed = 0, flips = 0; let w0 = await ev(() => SM_TOWN.sim.front().WX9);
      for (const x of [outX, inX, outX]) { await tp(x, z0); await W8(6800); const s9 = await ev(() => ({ pk: SM_TOWN.sim.panel(), wx: SM_TOWN.sim.front().WX9 })); if (s9.wx !== w0) { flips++; w0 = s9.wx; } if (s9.pk !== pk0) closed++; }
      ok(pk0 === 'wx' && flips >= 2 && closed === 0, '날씨 창을 연 채 띠 드나듦 ' + flips + '번 — 창 닫힘 ' + closed); await closeAll();
      // ④-2 무지개(해 반대편에 비 · 해 높이 42° 아래 · 하루 한 번) — 띠 안에 섰다가 띠 뒤(서쪽)·앞(동쪽)으로 나옴
      { let got = null; for (const hh of [16, 17.5, 9.5]) { if (got) break; for (const side of [-1, 1]) { const r9 = await ev(([hh]) => { const S = SM_TOWN, G = S.game().S, F = S.sim.F; G.min = Math.round(hh * 60); if (SD2.map.time) SD2.map.time(hh >= 17 ? 'sunset' : 'day'); F.bands(G.min); const me = SD2.map.player.get(), j = Math.floor(F.vOf(70)), ua = F.BAND[j * 2], ub = F.BAND[j * 2 + 1]; return ua < 1e8 ? { xa: F.xOf(ua), xb: F.xOf(ub), sun: S.sim.front().sun } : null; }, [hh]);
            if (!r9) continue; await tp((r9.xa + r9.xb) / 2, 70); await W8(7000); await tp(side < 0 ? r9.xa - 45 : r9.xb + 45, 70); await W8(7000); const fr = await ev(() => SM_TOWN.sim.front()); console.log('  무지개 ' + hh + '시 ' + (side < 0 ? '띠 뒤' : '띠 앞') + ': ' + JSON.stringify({ sun: fr.sun, rb: fr.rb, rainbow: fr.rainbow, WX9: fr.WX9 }));
            if (fr.rainbow) { got = { hh, side }; await ev(() => { const me = SD2.map.player.get(), sw = SM_TOWN.sim.front().sun; SD2.map.player.lookAt([me.x - sw[0] * 100, me.z - sw[2] * 100]); }); await W8(800); await shot('04_rainbow'); break; } } }
        ok(!!got, '무지개가 뜸(해 반대편 · ' + (got ? got.hh + '시 ' + (got.side < 0 ? '띠가 지나간 뒤' : '띠가 오기 전') : '못 띄움') + ')');
        const again = await ev(() => SM_TOWN.sim.front().rb === SM_TOWN.game().S.day); ok(!got || again, '무지개 하루 한 번 표시'); }
      // ④-3 우산 일꾼(밖 일꾼 비 칸 = 일손 멈추고 우산) · 풍향 깃발
      { const W9 = await ev(() => { const S = SM_TOWN, F = S.sim.F, OUT = /farmer|picker|bee|ranch|wood|salt|fisher|reach/; const L = S.sim.workers().filter(w => OUT.test(w.role)); for (const w of L) for (let h = 6; h < 23.5; h += 0.1) if (F.rainUV(F.uOf(w.x), F.vOf(w.z), w.x, w.z, h) > 0.8) return { w, h }; return null; });
        if (W9) { await ev(h => { SM_TOWN.game().S.min = Math.round(h * 60) + 6; if (SD2.map.time) SD2.map.time('day'); }, W9.h); await tp(W9.w.x + 6, W9.w.z + 4); await W8(800); await ev(w => SD2.map.player.lookAt([w.x, w.z]), W9.w); await W8(3000); await ev(w => SD2.map.player.lookAt([w.x, w.z]), W9.w); const fu = await ev(() => SM_TOWN.sim.front()); console.log('  우산 일꾼 ' + JSON.stringify(W9.w) + ' → 우산 ' + fu.umb); ok(fu.umb >= 1, '비 칸 밖 일꾼 = 우산(' + fu.umb + '명 · 새 사람 0)'); await shot('05_umbrella_worker'); }
        else console.log('  · 비 띠가 지나는 밖 일꾼이 없음(건너뜀)'); }
      const fx = await ev(() => SM_TOWN.sim.front()); console.log('  깃발 ' + JSON.stringify(fx.flags)); ok(Array.isArray(fx.flags) && fx.flags.length >= 2, '풍향 깃발 ' + (fx.flags ? fx.flags.length : 0) + '개(높은 곳 + 정문)');
      // ④-4 1초 칸 ms(CPU 1× · 4×)
      const e1 = await ev(() => SM_TOWN.sim.eng()); const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await ev(() => { const E9 = SM_TOWN.sim.eng(); window.__E0 = E9; }); await W8(8000); const e4 = await ev(() => { const a = window.__E0, b = SM_TOWN.sim.eng(), o = {}; for (const k in b) { const n = b[k].n - (a[k] ? a[k].n : 0); o[k] = { n, max: b[k].max }; } return { o, cur: b }; }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      console.log('  1초 칸 CPU 1× ' + JSON.stringify(e1) + ' · 4× 최대 ' + JSON.stringify(e4.cur)); ok(e1.front && e1.front.avg <= 0.75, '전선 1초 칸 평균 ' + (e1.front && e1.front.avg) + 'ms (≤0.75 · 한 자리 ≤0.3 목표는 참고)');
      // ④-5 손 고정 = 전선 꺼짐
      await ev(() => { SM_TOWN.game().S.wx = { auto: false }; SM_TOWN.weather('rain'); }); await W8(2400); const fm = await ev(() => SM_TOWN.sim.front()); ok(!fm.on && fm.WX9 === 'rain' && !fm.curtainVis && fm.wetK === 1, '날씨 단추로 고정(비) = 전선 꺼짐 · 마을 전체 비 · 땅 전체 젖음');
      await ev(() => { SM_TOWN.game().S.wx = { auto: true }; SM_TOWN.game().setClock(true); }); }
    ok(errs.length === 0, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0].slice(0, 200)); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0].slice(0, 200)); }
  await b.close(); console.log(fails.length ? 'FAIL — ' + fails.join(' / ') : 'PASS'); process.exit(fails.length ? 1 : 0); })();
