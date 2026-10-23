// 집배원 2 시험(JOBS-2 차례표 4 · 설계 docs/systems/town_jobs2.md 「다음 다섯 — 📮 집배원」): node tools/harness/town_post.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 우체국에서 시작 → 편지 목록 창(칸 고르기 지도 X) · 받는 분 = 역할 이웃만(실명 0 · 아이 집 0) · 우편함마다 E + 빛기둥 · 칸 주소 차례 ≠ 가까운 차례
//   ② 길 막힘 0: 우체국 → 우편함, 우편함 → 다음 우편함(가장 짧은 차례) 빨간 선을 0.5m마다 짚어 몸이 못 지나가는 곳 5m 연속 0(town_route 규칙)
//   ③ 걸어서(빨간 선을 따라 몸을 옮김) · 자전거로(B) 우편함 E → 배달 · 끝 창 = 지도에 내가 달린 길(파랑) + 첫 꼬임만 가장 짧은 길(옅게) + 내 최고와만 견줌
//   ④ 등기(꼬임 2): 낮 = 바로 건넴 · 밤 = 첫 E 안내 · 둘째 E 우체국에 맡김(막히지 않음) · 오류 0
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async n => { if (!SHOTS) return; await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 600) } : null; });
    const closeAll = async () => { for (let i = 0; i < 4; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const PI = () => ev(() => SM_TOWN.jobs().dbg.postInfo());
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.jobs && SM_TOWN.routePts, null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(1500);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 10 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; delete G.jobs.post; G.story = G.story || {}; G.story.p0auto = 1; if (G.lad) delete G.lad.post; });
    const NAMES = await ev(async () => { const m = await import('/v2/js/layout.js'); return Object.values(m.SCHOOL.people).flatMap(v => v.s.map(q => q[0])); });
    const po = await ev(() => { const q = SM_TOWN.indoor.list().find(q => q.kind === 'post'); return q ? q.id : null; }); ok(!!po, '우체국 있음'); if (!po) throw new Error('우체국 없음');
    const start = async () => { await ev(id => SM_TOWN.indoor.enter(id), po); await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 9000 }); await W8(300);
      const h = await ev(() => SD2.map.interact.list().filter(h => !h.off && /집배원|Mail/.test(h.label))[0] || null); if (h) { await ev(h => { SD2.map.player.teleport([h.x, h.y + 0.05, h.z]); }, h); await W8(400); await p.keyboard.press('KeyE'); await W8(700); }
      if (!(await ev(() => SM_TOWN.jobs().active === 'post'))) { console.log('    (방 안 E로 안 켜짐 · E ' + (h && h.label) + ' · 가까운 E ' + (await ev(() => SD2.near())) + ' · 창 ' + JSON.stringify(await panel()) + ')'); await closeAll(); await ev(() => SM_TOWN.jobs().startJob('post')); await W8(500); return false; }
      return !!h; };
    const viaE = await start(); let P = await panel(); ok(SM_TOWN_ok(await ev(() => SM_TOWN.jobs().active)), '집배원 체험 켜짐(' + (viaE ? '방 안 E' : 'startJob') + ')');
    function SM_TOWN_ok(a) { return a === 'post'; }
    ok(P && P.k === 'post' && /배달할 편지/.test(P.t), '시작 = 편지 목록 창'); ok(!(await ev(() => !!document.querySelector('.twn-p canvas'))), '창에서 칸 고르기 지도 없음'); await shot('post_list');
    let I = await PI(); console.log('  편지 ' + I.L.map(q => q.cell + ' ' + q.name + ' → ' + q.who).join(' | '));
    ok(I.L.length === 4 && I.lv === 0, '첫 꼬임 = 편지 넷'); const who = I.L.map(q => q.who + ' ' + q.name).join(' ');
    const real = NAMES.filter(n => n.length >= 2 && who.includes(n)).concat(I.L.filter(q => NAMES.includes(q.who.replace(/님$/, ''))).map(q => q.who)); ok(!real.length, '받는 분·받는 곳에 실명 0' + (real.length ? ' — ' + real.join(',') : ''));
    ok(I.L.every(q => !/네 집|네(\s|$)/.test(q.name)), '아이 집 0'); ok(I.L.every(q => /님$/.test(q.who) && q.who.length > 1), '받는 분 = 역할 이웃(○○님)');
    ok(I.addr.join() !== I.near.join() && I.addr.join() !== I.best.join(), '칸 주소 차례 ≠ 가까운 차례(주소 ' + I.addr.join('') + ' · 가까운 ' + I.near.join('') + ' · 가장 짧은 ' + I.best.join('') + ')');
    await closeAll(); await ev(async () => { SM_TOWN.indoor.exit(); for (let i = 0; i < 40 && (SM_TOWN.indoor.on || SM_TOWN.indoor.busy); i++) await new Promise(r => setTimeout(r, 100)); }); await W8(500);
    I = await PI(); ok(I.L.every(q => q.mk && q.hot), '우편함마다 E + 빛기둥'); const hl = await ev(() => SD2.map.interact.list().filter(h => !h.off && /우편함|등기/.test(h.label)).length); ok(hl === I.L.length, '우편함 E ' + hl + '곳');
    ok(await ev(() => !!document.querySelector('.pc-hud button')), '화면 아래 편지 단추 하나'); await shot('post_out');
    // ② 길 막힘
    const legs = []; { let a = I.at; for (const i of I.best) { const q = I.L[i]; legs.push([a, [q.x, q.z], q.name]); a = [q.x, q.z]; } for (const q of I.L) legs.push([I.at, [q.x, q.z], q.name]); }
    const RB = await ev(legs => { const M = SD2.map, out = []; for (const [A0, B0, nm] of legs) { if (!SM_TOWN.path(A0, B0, nm)) { out.push({ nm, why: 'path X' }); continue; } const pts = SM_TOWN.routePts(); SM_TOWN.pathOff(); if (!pts || pts.length < 2) { out.push({ nm, why: 'pts X' }); continue; } let L = 0; const seg = []; for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(l); L += l; }
        let s = 0, run = 0, worst = 0; for (let k = 1; k < pts.length; k++) { const l = seg[k - 1]; for (let t = 0; t < l; t += 0.5) { const d = s + t; if (d < 1.5 || d > L - 1.5) continue; const x = pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * t / l, z = pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * t / l, nx = -(pts[k][1] - pts[k - 1][1]) / l * 0.6, nz = (pts[k][0] - pts[k - 1][0]) / l * 0.6, bk = (x9, z9) => M.q.blocked(x9, z9, M.q.groundAt(x9, z9, SM_TOWN.ground(x9, z9) + 4) + 0.05); if (bk(x, z) && bk(x + nx, z + nz) && bk(x - nx, z - nz)) { run += 0.5; worst = Math.max(worst, run); } else run = 0; } s += l; }
        if (worst >= 5) out.push({ nm, why: '몸이 못 지나감 ' + worst + 'm', len: Math.round(L) }); } return out; }, legs);
    ok(!RB.length, '빨간 선 막힘 0 (' + legs.length + '길)' + (RB.length ? ' — ' + JSON.stringify(RB) : ''));
    // ③ 걸어서 · 자전거로 배달(빨간 선을 따라 몸을 옮김 · 8m씩 0.3초)
    const walkTo = async (to, nm) => { const ok9 = await ev(([to, nm]) => { const me = SD2.map.player.get(); return SM_TOWN.path([me.x, me.z], to, nm); }, [to, nm]); const pts = await ev(() => SM_TOWN.routePts()); await ev(() => SM_TOWN.pathOff()); if (!ok9 || !pts) return false;
      for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], c = pts[k], l = Math.hypot(c[0] - a[0], c[1] - a[1]); for (let t = 8; t < l + 8; t += 8) { const u = Math.min(1, t / l); await ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u]); await W8(300); } } return true; };
    const order = I.best.slice(); let k9 = 0;
    for (const i of order) { const q = I.L[i]; if (k9 === 1) { await p.keyboard.press('KeyB'); await W8(500); } const w = await walkTo([q.x, q.z], q.name); const bike = await ev(() => SM_TOWN.indoor.state().bike);
      const pn = await panel(); if (pn) console.log('    (E 앞에 창: ' + pn.k + ' ' + pn.t.slice(0, 30).replace(/\n/g, ' ') + ')');
      const nr = await ev(() => SD2.near()); await p.keyboard.press('KeyE'); await W8(700); const J = await PI(); ok(w && (J ? J.L[i].done : true), (bike ? '자전거로' : '걸어서') + ' ' + q.cell + ' ' + q.name + ' 우편함 E → 배달 (가까운 E: ' + nr + ')'); if (k9 === 1) await shot('post_bike'); k9++; if (bike && k9 === 2) { await p.keyboard.press('KeyB'); await W8(400); } }
    await W8(1600); P = await panel(); ok(P && P.k === 'jobend' && /달린 길/.test(P.t) && /가장 짧은 길/.test(P.t), '끝 창 = 달린 길 + 가장 짧은 길과 견줌'); ok(/첫 기록/.test(P ? P.t : ''), '첫 판 = 첫 기록'); ok(!/바로 가기/.test(P ? P.t : ''), '우체국 방에서 나온 것은 바로 가기로 안 셈');
    const px = await ev(() => { const c = document.querySelector('.twn-p canvas.pc-map'); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let blue = 0; for (let k = 0; k < d.length; k += 4) if (Math.abs(d[k] - 47) < 25 && Math.abs(d[k + 1] - 111) < 30 && d[k + 2] > 170) blue++; return blue; });
    ok(px > 300, '지도에 내가 달린 길(파랑) 그려짐 ' + px + '점'); await shot('post_end'); console.log('  ' + (P ? P.t.split('\n').slice(0, 6).join(' / ') : ''));
    await closeAll(); ok(!(await ev(() => !!SD2.CTRL.frozen)), '끝 창 닫은 뒤 안 멈춤'); ok(!(await ev(() => SD2.map.interact.list().some(h => !h.off && /우편함|등기/.test(h.label)))), '끝나면 우편함 E 남지 않음');
    // ④ 둘째 판(연습 · 내 최고와 견줌) + 등기
    await ev(() => { const G = SM_TOWN.game().S; G.lad.post.lv = 1; G.lad.post.good = 0; G.min = 10 * 60; }); await start(); await closeAll(); I = await PI(); const R9 = I.L.findIndex(q => q.reg);
    ok(I.L.length === 5 && R9 >= 0, '꼬임 2 = 편지 다섯 · 등기 하나'); await ev(() => SM_TOWN.indoor.exit()); await W8(1500);
    await ev(() => { SM_TOWN.game().S.min = 21 * 60; }); await ev(r => SM_TOWN.jobs().dbg.deliverNow(r), R9); I = await PI(); ok(!I.L[R9].done && I.regLate === 1, '밤 = 등기 첫 E는 안내만(안 계세요)'); await ev(r => SM_TOWN.jobs().dbg.deliverNow(r), R9); I = await PI(); ok(I.L[R9].done, '둘째 E = 우체국에 맡김(막히지 않음)');
    await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); for (let k = 0; k < 4; k++) await ev(() => SM_TOWN.jobs().dbg.deliverNow()); await W8(1600); P = await panel(); ok(P && /연습 끝/.test(P.t) && /첫 기록|내 최고/.test(P.t), '같은 날 둘째 판 = 연습 · 꼬임마다 내 최고와만 견줌(' + (P ? P.t.split('\n').slice(0, 4).join(' / ') : '창 없음') + ')'); ok(P && /등기는 받는 분이 계실 낮/.test(P.t), '판 뒤 한 줄 = 등기는 낮에'); ok(!/[0-9]+위|순위|등수/.test(P ? P.t : ''), '순위 글 0'); await shot('post_end2'); await closeAll();
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
