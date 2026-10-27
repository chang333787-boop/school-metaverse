// 🔍 가까이 보기 시험(CLOSE-1 · v2/games/town_efx.js · town_close.js): node tools/harness/town_close1.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   '속에서 바뀜'이 아니라 '화면에 보이는지'를 셈 — 갈래마다 E → 카메라가 다가간 뒤 화면을 두 번 그림(생물 모양을 켠 것 · 끈 것)
//   두 그림이 다른 픽셀 = 생물 픽셀 → ① 화면 몫(넓이) ② 생물이 차지한 네모의 긴 변이 화면의 1/5 이상 ③ 변화 전·후 생물 자리(무게중심·모양 자리)가 달라짐
//   ④ 돌아오기(걷기 키 · E · 창을 닫으면 저절로) 뒤 카메라가 E 전 자리로 · 몸은 그 자리 ⑤ 페이지 오류 0
//   갈래 = 개미 줄 · 꽃밭(나비가 날아와 앉음) · 곤충 관찰(호랑나비 · 참매미) · 모래 구멍 게(낮 썰물 엽낭게 · 밤 달랑게) · 갯벌 바다 친구 · 새집 — 이 마을에 없는 자리는 '자리 없음'
//   그리기 켬(GPU) 시험 — 사진이 필요해 pw.cjs(그리기 끔)를 쓰지 않음
const { chromium } = require('playwright'); const fs = require('fs');
const ARG = process.argv.slice(2), POS = ARG.filter(a => !a.startsWith('--')), ID = POS[0] || 'ourtown', PORT = POS[1] || '8002', SHOTS = (ARG.find(a => a.startsWith('--shots=')) || '').slice(8) || null;
const MIN_BOX = 0.2, MIN_FRAC = 0.004;
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const fails = [], rows = [];
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async nm => { if (SHOTS) await p.screenshot({ path: SHOTS.replace(/\/$/, '') + '/' + nm + '.png' }); };
    const closeAll = async () => { for (let i = 0; i < 6; i++) { if (!await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-dlg button'); if (b9) b9.click(); }); await W8(250); } };
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.efx && window.SD2 && SD2.camOvr, null, { timeout: 240000 }); await W8(3000); await closeAll();
    const setT = (sea, min, wx) => ev(([sea, min, wx]) => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.min = min; SM_TOWN.rules.wx(wx || 'clear'); SM_TOWN.rules.season(sea); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } }, [sea, min, wx]);
    const find = (re, on) => ev(([src, on]) => { const re9 = new RegExp(src); return SD2.map.interact.list().filter(h => h.kind === 'game' && (on === false || !h.off) && re9.test(String(h.label || ''))).map(h => ({ x: h.x, y: h.y, z: h.z, label: h.label })); }, [re.source, on]);
    const fire = (at, src) => ev(([at, src]) => { const re9 = new RegExp(src), L = SD2.map.interact.list().filter(h => h.kind === 'game' && !h.off && re9.test(String(h.label || ''))); let h = null, bd = 1e9; for (const q of L) { const d = Math.hypot(q.x - at[0], q.z - at[2]); if (d < bd) { bd = d; h = q; } } if (!h) return null; SD2.actOn(h); return h.label; }, [at, src]);
    const tp = (x, y, z) => ev(a => SD2.map.player.teleport([a[0], a[1] + 0.05, a[2]]), [x, y, z]);
    const camNow = () => ev(() => { const c = SD2.camera.position, P = SD2.map.player.pos(); return { c: [c.x, c.y, c.z], p: [P.x, P.y, P.z] }; });
    const info = () => ev(() => SM_TOWN.efx().closeInfo());
    // 생물 픽셀: 모양을 켠 그림과 끈 그림의 차이(2픽셀마다) — 넓이 몫 · 네모 가로·세로 몫 · 무게중심
    const mask = () => ev(() => { const R = SD2.renderer, gl = R.getContext(), sc = SD2.scene, cam = SD2.camera, O = SM_TOWN.efx().closeObjs(); const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, a = new Uint8Array(W * H * 4), b9 = new Uint8Array(W * H * 4);
      R.render(sc, cam); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, a); const v = O.map(o => o.visible); O.forEach(o => { o.visible = false; }); R.render(sc, cam); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b9); O.forEach((o, i) => { o.visible = v[i]; }); R.render(sc, cam);
      let n = 0, x0 = W, x1 = -1, y0 = H, y1 = -1, sx = 0, sy = 0; for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; if (Math.abs(a[i] - b9[i]) + Math.abs(a[i + 1] - b9[i + 1]) + Math.abs(a[i + 2] - b9[i + 2]) > 30) { n++; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      const P = O.filter(o => o.visible && o.isGroup).map(o => { const q = o.getWorldPosition(new o.position.constructor()); return [+q.x.toFixed(3), +q.y.toFixed(3), +q.z.toFixed(3)]; });
      return { frac: n / ((W / 2) * (H / 2)), bw: n ? (x1 - x0) / W : 0, bh: n ? (y1 - y0) / H : 0, cx: n ? sx / n / W : 0, cy: n ? sy / n / H : 0, n: O.length, P }; });
    const f3 = v => (v * 100).toFixed(1) + '%';
    const say = (ok9, t) => { console.log((ok9 ? '  ✓ ' : '  ✗ ') + t); if (!ok9) fails.push(t); };
    // 한 갈래: 자리로 가서 E → 전(tA) · 후(tB) 그림 셈 → 돌아오기(how = 'walk' | 'E' | 'panel')
    async function kind(nm, re, o) { await closeAll(); let L = await find(re); if (!L.length && o.pre) { await o.pre(); L = await find(re); } if (!L.length) { rows.push([nm, '자리 없음']); console.log('  · ' + nm + ' — 자리 없음(이 마을·때)'); return; }
      const h = o.pick ? o.pick(L) : L[(L.length * 0.37) | 0]; await tp(h.x, h.y, h.z); await W8(1300); L = await find(re); const h2 = L.sort((a, c) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(c.x - h.x, c.z - h.z))[0]; if (!h2) { rows.push([nm, '자리 사라짐']); console.log('  · ' + nm + ' — 자리 사라짐'); return; }
      if (Math.hypot(h2.x - h.x, h2.z - h.z) > 0.3) { await tp(h2.x, h2.y, h2.z); await W8(900); }
      await W8(500); const c0 = await camNow(); await shot(o.k + '_0_normal');
      const lb = await fire([h2.x, h2.y, h2.z], re.source); await W8(80); let I = await info(); if (!I.on) { say(false, nm + ' — 가까이 보기가 시작되지 않음(' + lb + ')'); return; }
      await W8(o.tA * 1000 - 80); const A0 = await mask(); await shot(o.k + '_1_before');
      await W8((o.tB - o.tA) * 1000); const B0 = await mask(); await shot(o.k + '_2_after'); I = await info(); const cA = await camNow();
      const big = Math.max(B0.bw, B0.bh, A0.bw, A0.bh), fr = Math.max(A0.frac, B0.frac), shift = Math.hypot(B0.cx - A0.cx, B0.cy - A0.cy), dfrac = Math.abs(B0.frac - A0.frac), mv = A0.P.length && B0.P.length ? Math.max(...B0.P.map((q, i) => A0.P[i] ? Math.hypot(q[0] - A0.P[i][0], q[1] - A0.P[i][1], q[2] - A0.P[i][2]) : 0)) : 0;
      const cd = Math.hypot(cA.c[0] - I.tgt[0], cA.c[1] - I.tgt[1], cA.c[2] - I.tgt[2]);
      console.log('    ' + nm + ' (' + lb + ') 카메라–볼 곳 ' + cd.toFixed(2) + 'm · 전: 넓이 ' + f3(A0.frac) + ' 네모 ' + f3(A0.bw) + '×' + f3(A0.bh) + ' · 후: 넓이 ' + f3(B0.frac) + ' 네모 ' + f3(B0.bw) + '×' + f3(B0.bh) + ' · 무게중심 옮김 ' + f3(shift) + ' · 모양 옮김 ' + mv.toFixed(2) + 'm');
      say(cd >= 0.4 && cd <= 1.45, nm + ' 카메라가 가까이(' + cd.toFixed(2) + 'm)'); say(fr >= MIN_FRAC && big >= MIN_BOX, nm + ' 생물이 크게 보임(넓이 ' + f3(fr) + ' · 긴 변 ' + f3(big) + ' — 전·후 가운데 큰 쪽)');
      say(shift >= 0.03 || dfrac >= 0.004 || mv >= 0.05, nm + ' 변화가 보임(무게중심 ' + f3(shift) + ' · 넓이 차 ' + f3(dfrac) + ' · 모양 ' + mv.toFixed(2) + 'm)');
      const pm = Math.hypot(cA.p[0] - c0.p[0], cA.p[2] - c0.p[2]); say(pm < 0.15, nm + ' 몸은 그 자리(' + pm.toFixed(2) + 'm)');
      if (o.how === 'walk') { await p.keyboard.down('KeyW'); await W8(120); await p.keyboard.up('KeyW'); }
      else if (o.how === 'E') { await p.keyboard.press('KeyE'); I = await info(); if (I.on && !I.shown) { await W8(400); await closeAll(); await W8(300); } if ((await info()).on) await p.keyboard.press('KeyE'); }
      else if (o.how === 'panel') { for (let i = 0; i < 30 && !(await ev(() => !!document.querySelector('.twn-p'))); i++) await W8(200); const pOk = await ev(() => !!document.querySelector('.twn-p')); say(pOk, nm + ' 설명 창이 뜸'); if (o.k2) { await W8(150); await closeAll(); await W8(o.k2 * 1000); await shot(o.k + '_3_leave'); const C9 = await mask(); console.log('    ' + nm + ' 창 닫은 뒤: 넓이 ' + f3(C9.frac) + ' (떠나는 중)'); } else await closeAll(); }
      let back = false; for (let i = 0; i < 30; i++) { await W8(200); if (!(await info()).on) { back = true; break; } } await W8(900); const c1 = await camNow(); await shot(o.k + '_4_back');
      const cb = Math.hypot(c1.c[0] - c0.c[0], c1.c[1] - c0.c[1], c1.c[2] - c0.c[2]), pb = Math.hypot(c1.p[0] - c0.p[0], c1.p[2] - c0.p[2]);
      say(back, nm + ' 돌아옴(' + o.how + ')'); say(cb < 0.45 || pb > 0.05 && cb < pb + 0.45, nm + ' 카메라가 원래대로(E 전 자리와 ' + cb.toFixed(2) + 'm · 몸 ' + pb.toFixed(2) + 'm)');
      rows.push([nm, f3(fr), f3(big), f3(shift), mv.toFixed(2)]); }
    // 1) 개미 줄(봄 낮 맑음)
    await setT('spring', 11 * 60, 'clear'); await W8(1500);
    await kind('🐜 개미 줄', /^🐜 개미 줄|^🍞 빵 부스러기/, { k: 'ant', tA: 1.5, tB: 5.6, how: 'walk' });
    // 2) 꽃밭(봄 = 배추흰나비가 날아와 앉음)
    await kind('🌼 꽃밭 나비', /^🌼 꽃밭/, { k: 'flower', tA: 1.0, tB: 4.6, how: 'E' });
    // 3) 새집(봄 = 어미 새가 구멍에서 나와 날아감)
    await kind('🐦 새집', /^🐦 새집/, { k: 'nest', tA: 1.4, tB: 3.0, how: 'walk' });
    // 4) 곤충 관찰(여름 · 호랑나비 = 꽃에 앉음 · 참매미 = 줄기에서 울음 → 창 → 떠남)
    await setT('summer', 11 * 60, 'clear'); await W8(1600);
    await kind('🔍 호랑나비', /^🔍 호랑나비 관찰하기$/, { k: 'bug_bfly', tA: 1.2, tB: 3.4, how: 'panel', k2: 1.0 });
    await kind('🔍 참매미', /^🔍 참매미 관찰하기$/, { k: 'bug_cicada', tA: 1.4, tB: 3.0, how: 'panel', k2: 1.0 });
    // 5) 모래 구멍 게(낮 썰물 = 엽낭게 · 밤 = 달랑게)
    const L0 = await ev(() => { const d = SM_TOWN.game().S.day, c = 300 + ((d * 50 + 250) % 745); for (const m of [c - 745, c, c + 745]) if (m >= 8 * 60 && m <= 16.5 * 60) return m; return c; });   /* 그날 낮 간조(town_shore.js lowAt) */
    await setT('summer', L0 + 10, 'clear'); await W8(1600);
    await kind('🦀 엽낭게(낮 썰물)', /^🦀 모래 구멍 게 살펴보기|^🦀 Crab holes — look/, { k: 'crab_day', tA: 1.4, tB: 4.9, how: 'panel', k2: 1.4 });
    await setT('summer', 22 * 60, 'clear'); await W8(1600);
    await kind('🦀 달랑게(밤)', /^🦀 밤 모래밭 게/, { k: 'crab_night', tA: 1.4, tB: 3.0, how: 'panel' });
    // 6) 갯벌 바다 친구(낮 썰물)
    await setT('summer', L0 + 10, 'clear'); await W8(1600);
    await kind('🔍 갯벌 바다 친구', /^🔍 (칠게|농게|갯고둥|갯지렁이|말뚝망둥어) 관찰하기$/, { k: 'shore', tA: 1.4, tB: 4.0, how: 'panel' });
    console.log('    표: ' + rows.map(r => r.join(' ')).join(' | '));
    if (errs.length) { fails.push('페이지 오류'); console.log('  ✗ 페이지 오류 ' + errs.join(' | ')); }
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); }
  await b.close(); console.log(fails.length ? 'FAIL ' + fails.length + ' (' + fails.join(', ') + ')' : 'PASS'); process.exit(fails.length ? 1 : 0); })();
