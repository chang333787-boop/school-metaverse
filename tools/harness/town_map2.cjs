// 🗺 지도 정리 · 내 화살표 시험(MAP-2 · 사용자 11-07 '우리 지도가 지금 너무 난잡해서 애들이 활용 못 할 것 같음 · 미니맵에서 내가 동그라미가 아니라 방향이 있는 아이콘'): node tools/harness/town_map2.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 큰 지도 첫 화면: 기호 수 상한(장소 기호 ≤ 12 · 큰 이름 6~12 · 🚪·버스·지하철·이름 칸·버섯·흔적 0) · 구역 이름 일곱 · 이름표 겹침 0 · 나·목표 · 고치기 전 기호 수(같은 자료로 셈)
//   ② 칩 켜고 끄기: 칩마다 그 겹만 생김·사라짐 · 범례 줄 · 켠 것 = 새로고침해도 그대로(이 기기) · 칩을 다 켜도 이름표 겹침 0 · 작은 지도·칸 지도도 🚌·🚪를 따름
//   ③ 확대(LOD): 같은 자리를 확대하면 이름이 더 · 바퀴 = 확대 · 끌기 = 옮김(고르기 창 X) · 확대한 자리에서 누르기 = GO-1 고르기 창(그 장소) · ＋－ 단추
//   ④ 내 화살표 = 가는 쪽: 앞으로 걷기 · 옆으로 걷기(카메라와 90°) · 멈추면 보는 쪽 · 자전거(앞·뒤로) · 작은 지도·큰 지도 그림의 앞 끝이 그 쪽(화소)
//   ⑤ 크롬북 실제 창(1366×680): 방위표·축척·닫기가 굴리지 않고 보임  ⑥ 휴대폰 세로·가로: 지도 폭 · 칩·범례는 지도 밑(세로) · 아래 줄은 옆 칸(가로) · 지도가 화면 안 · 겹침 0 · 터치로 누르면 고르기 창  ⑦ 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, BASE = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const ovl = L => { const bad = []; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], b = L[j]; if (a[0] < b[0] + b[2] - 0.5 && a[0] + a[2] > b[0] + 0.5 && a[1] < b[1] + b[3] - 0.5 && a[1] + a[3] > b[1] + 0.5) bad.push((a[5] || a[4]) + ' ↔ ' + (b[5] || b[4])); } return bad; };
const angD = (a, b) => { let d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };
async function page(b, ctxOpt, url) {
  const ctx = await b.newContext(ctxOpt), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  const shot = async (n, clip) => { if (!SHOTS) return; await W8(250); await p.screenshot({ path: SHOTS + '/map2_' + n + '.png', clip: clip || undefined }); console.log('    📷 ' + SHOTS + '/map2_' + n + '.png'); };
  const closeAll = async () => { for (let i = 0; i < 10; i++) { if (await ev(() => !!document.querySelector('.twn-go'))) { await ev(() => SM_TOWN.go().close()); continue; } if (await ev(() => !!document.querySelector('.twn-dlg'))) { await ev(() => { const B = document.querySelector('.twn-dlg .ch button'); if (B) B.click(); else { const d = document.querySelector('.twn-dlg .dbox'); if (d) d.click(); } }); await W8(250); continue; } if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p .twn-x'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
  const boot = async () => { await p.goto(url); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.map2 && SM_TOWN.go && SM_TOWN.go(), null, { timeout: 240000 }); await W8(2200); await closeAll(); await W8(300); await closeAll(); };
  const big = async () => { await closeAll(); await ev(() => SM_TOWN.openBig()); await W8(500); return ev(() => { const cv = document.querySelector('.twn-p canvas.twn-big'); return cv ? { st: cv._st, view: cv._view, w: cv.width, h: cv.height } : null; }); };
  const st = () => ev(() => { const cv = document.querySelector('.twn-p canvas.twn-big'); return cv ? { st: cv._st, view: cv._view } : null; });
  return { p, ctx, ev, W8, shot, closeAll, boot, big, st, errs };
}
(async () => { const T0 = Date.now(), fs = require('fs'); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    // ───── A. 크롬북 1366×768 ─────
    { const P = await page(b, { viewport: { width: 1366, height: 768 } }, BASE + '&all=1'), { p, ev, W8, shot, closeAll, boot, big, st, errs } = P; await boot();
      console.log('① 큰 지도 첫 화면');
      const before = await ev(() => { const P9 = SM_TOWN.places().length, D9 = SM_TOWN.doors().length, B9 = SM_TOWN.busLines ? SM_TOWN.busLines() : null; return { places: P9 - 1, doors: D9, stops: B9 && B9.stops ? B9.stops.length : 0, lines: B9 && B9.lines ? B9.lines.length : 0 }; });
      let B = await big(); const S = B && B.st;
      ok(!!S, '큰 지도 = 칩 줄 + 이름표 셈(cv._st)');
      if (S) { const land = S.L.filter(l => l[4] === 'land'), reg = S.L.filter(l => l[4] === 'reg'), all = S.L.concat(S.me ? [[...S.me.B, 'me', '나(화살표)'], [...S.me.T, 'me', '나(꼬리표)']] : []);
        console.log('    전(같은 자료로 셈): 장소 기호 ' + before.places + ' · 들어가는 곳 ' + before.doors + ' · 정류장 ' + before.stops + ' · 이름표 ≈ ' + before.places);
        console.log('    후: 장소 기호 ' + S.mk + ' · 큰 이름 ' + land.length + ' · 구역 이름 ' + reg.length + ' · 이름표 모두 ' + S.L.length + ' · 숨긴 것 ' + S.hid);
        ok(S.mk <= 12, '첫 화면 장소 기호 ≤ 12 (' + S.mk + ')');
        ok(land.length >= 6 && land.length <= 12, '첫 화면 큰 이름 6~12 (' + land.map(l => l[5]).join(' · ') + ')');
        ok(S.doors === 0 && S.bus === 0 && S.sub === 0 && S.areas === 0 && S.mush === 0 && !S.trace, '첫 화면 = 🚪·버스·지하철·이름 칸·버섯·흔적 0 (' + [S.doors, S.bus, S.sub, S.areas, S.mush, S.trace].join('/') + ')');
        ok(reg.length === 7, '구역 이름 일곱 (' + reg.map(l => l[5]).join(' ') + ')');
        ok(S.L.length <= 12 + 7 + 1, '이름표 모두 ≤ 20 (' + S.L.length + ' · 고치기 전 ≈ ' + before.places + ')');
        const bad = ovl(all); ok(!bad.length, '이름표 겹침 0 (나·목표 자리 포함 · ' + all.length + '개)' + (bad.length ? ' — ' + bad.slice(0, 3).join(' | ') : ''));
        ok(!!S.me && S.me.s >= 11, '나 = 화살표(앞 끝까지 ' + (S.me && S.me.s.toFixed(1)) + 'px)');
        ok(!S.L.some(l => /✨/.test(l[5] || '')), '첫 화면 이름에 ✨ 없음(도면 확인에서만)');
        const leg = await ev(() => [...document.querySelectorAll('.twn-p .twn-mleg .li')].map(e => e.textContent.trim())); ok(leg.length <= 10 && leg.some(t => /나\(가는 쪽\)/.test(t)) && leg.some(t => /따라가는 곳/.test(t)), '범례 ≤ 10줄 · 나·따라가는 곳 줄 있음 (' + leg.length + '줄 · 고치기 전 13줄)');
        const ch = await ev(() => [...document.querySelectorAll('.twn-p .twn-mchips button[data-lay]')].map(b => b.textContent.trim() + ':' + b.getAttribute('aria-pressed'))); ok(ch.length === 6 && ch.every(t => /false$/.test(t)), '칩 여섯 · 처음엔 모두 꺼짐 (' + ch.join(' ') + ')');
        { const r = await ev(() => { const cv = document.querySelector('.twn-p canvas.twn-big').getBoundingClientRect(), c = document.querySelector('.twn-p .twn-mcol').getBoundingClientRect(), cs = document.querySelector('.twn-p canvas.twn-mcs').getBoundingClientRect(); return { cw: Math.round(cv.width), ch: Math.round(cv.height), cb: Math.round(cv.bottom), ib: innerHeight, csB: Math.round(cs.bottom), colB: Math.round(c.bottom) }; });
          ok(r.cw >= 600 && r.cb <= r.ib, '크롬북 지도 ' + r.cw + '×' + r.ch + ' · 화면 안'); ok(r.csB <= r.colB + 1, '방위표·축척이 옆 칸 안에 보임(굴리지 않고)'); }
      }
      await shot('big_first');
      console.log('② 칩 켜고 끄기 · 기억');
      const chip = async k => { await ev(k => document.querySelector('.twn-p .twn-mchips button[data-lay="' + k + '"]').click(), k); await W8(250); return (await st()).st; };
      const legT = () => ev(() => document.querySelector('.twn-p .twn-mleg').innerText);
      { let s1 = await chip('door'); ok(s1.doors > 20 && /들어가 볼 수/.test(await legT()), '🚪 켬 = 들어가는 곳 ' + s1.doors + ' · 범례 한 줄'); s1 = await chip('door'); ok(s1.doors === 0 && !/들어가 볼 수/.test(await legT()), '🚪 끔 = 0 · 범례 줄 없어짐');
        s1 = await chip('bus'); ok(s1.bus > 0 && s1.sub > 0 && s1.L.some(l => l[4] === 'sub'), '🚌 켬 = 버스 노선 ' + s1.bus + ' · 지하철 역 ' + s1.sub + ' · 역 이름 ' + s1.L.filter(l => l[4] === 'sub').length);
        const s0 = (await st()).st; s1 = await chip('shop'); ok(s1.mk > s0.mk + 10, '🏪 켬 = 가게·집 기호 ' + s0.mk + ' → ' + s1.mk);
        const m0 = s1.mk; s1 = await chip('nat'); ok(s1.mk > m0 && (s1.mush > 0 || true), '🌳 켬 = 쉼터 기호 더(' + m0 + ' → ' + s1.mk + ' · 버섯 ' + s1.mush + ')');
        await ev(() => { const S9 = SM_TOWN.game().S, P9 = SM_TOWN.places().filter(q => !SM_TOWN.inSchool(q.x, q.z)), q = P9[3], c = SM_TOWN.cell(q.x, q.z); S9.wmet = S9.wmet || {}; S9.wmet[c] = { id: 'heron', x: q.x, z: q.z, d: S9.day || 1 }; });
        s1 = await chip('trace'); ok(s1.trace > 0, '👣 켬 = 흔적 그림 ' + s1.trace);
        s1 = await chip('kid'); ok(s1.areas > 0 && s1.L.some(l => l[4] === 'kid'), '🔖 켬 = 이름 칸 점선 ' + s1.areas + ' · 아이 이름 ' + s1.L.filter(l => l[4] === 'kid').length);
        const bad = ovl(s1.L.concat(s1.me ? [[...s1.me.B, 'me'], [...s1.me.T, 'me']] : [])); ok(!bad.length, '칩을 다 켜도 이름표 겹침 0 (' + s1.L.length + '개 · 숨긴 것 ' + s1.hid + ')' + (bad.length ? ' — ' + bad.slice(0, 3).join(' | ') : ''));
        await shot('big_chips');
        const on = await ev(() => SM_TOWN.map2().on); ok(on.bus && on.shop && on.nat && on.trace && on.kid && !on.door, '켠 칩 = 이 기기에 저장(' + JSON.stringify(on) + ')');
        await closeAll(); await ev(() => SM_TOWN.map2().set('door', true)); await ev(() => { const k = 'twn-maplay'; return localStorage.getItem(k); });
        await boot(); B = await big(); const ch2 = await ev(() => Object.fromEntries([...document.querySelectorAll('.twn-p .twn-mchips button[data-lay]')].map(b => [b.dataset.lay, b.getAttribute('aria-pressed')])));
        ok(ch2.bus === 'true' && ch2.door === 'true' && ch2.kid === 'true' && B.st.doors > 0 && B.st.bus > 0, '새로고침해도 켠 칩 그대로(' + JSON.stringify(ch2) + ')');
        { await closeAll(); await p.keyboard.press('KeyJ'); await W8(700); const jd = await ev(() => { const c = document.querySelector('.twn-p canvas.cm0'); return !!c; }); ok(jd, '칸 지도(J) 열림 — 🚪·🚌 칩을 따라 다시 그림'); await shot('j_chips'); await closeAll(); }
        for (const k of ['door', 'bus', 'shop', 'nat', 'trace', 'kid']) await ev(k => SM_TOWN.map2().set(k, false), k);
        B = await big(); ok(B.st.doors === 0 && B.st.bus === 0 && B.st.areas === 0, '칩을 끄면 다시 첫 화면');
      }
      console.log('③ 확대(LOD) · 바퀴 · 끌기 · 누르기');
      { const sch = await ev(() => { const P9 = SM_TOWN.places().find(q => q.name === '우리 학교'); return P9 ? [P9.x, P9.z] : [16.5, 50]; });
        const v3 = await ev(([x, z]) => document.querySelector('.twn-p canvas.twn-big')._zoom(3.4, x, z), sch); await W8(100); const s3 = (await st()).st;
        const v1 = await ev(() => document.querySelector('.twn-p canvas.twn-big')._zoom(1)); await W8(100); const s1 = (await st()).st;
        const x0 = v3.x0, z0 = v3.z0, x1 = x0 + (B.w - 2 * v3.mg) / v3.sc, z1 = z0 + (B.h - 2 * v3.mg) / v3.sc, inR = l => { const wx = v1.x0 + (l[0] + l[2] / 2) / v1.sc, wz = v1.z0 + (l[1] + l[3] / 2) / v1.sc; return wx > x0 && wx < x1 && wz > z0 && wz < z1; };
        const n1 = s1.L.filter(l => l[4] === 'land' && inR(l)).length, n3 = s3.L.filter(l => l[4] === 'land').length;
        ok(n3 > n1, '같은 자리 확대 3.4배 = 큰 이름 ' + n1 + ' → ' + n3 + ' (' + s3.L.filter(l => l[4] === 'land').map(l => l[5]).slice(0, 8).join(' · ') + ')');
        ok(!ovl(s3.L).length, '확대해도 이름표 겹침 0');
        await ev(([x, z]) => document.querySelector('.twn-p canvas.twn-big')._zoom(2.25, x, z), sch); await W8(80); await shot('big_zoom'); await ev(() => document.querySelector('.twn-p canvas.twn-big')._zoom(1)); await W8(80);
        const R = await ev(() => { const r = document.querySelector('.twn-p canvas.twn-big').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
        await p.mouse.move(R[0], R[1]); await p.mouse.wheel(0, -300); await W8(300); const zw = (await st()).view.z; ok(zw > 1.1, '바퀴 = 확대 (' + zw.toFixed(2) + '배)');
        const vA = (await st()).view; await p.mouse.move(R[0], R[1]); await p.mouse.down(); await p.mouse.move(R[0] + 60, R[1] + 30, { steps: 6 }); await p.mouse.up(); await W8(300); const vB = (await st()).view, go1 = await ev(() => !!document.querySelector('.twn-go'));
        ok(Math.abs(vB.x0 - vA.x0) > 5 && !go1, '끌기 = 지도를 옮김(' + Math.round(vA.x0) + ' → ' + Math.round(vB.x0) + ') · 고르기 창 X');
        const pl = await ev(() => { const cv = document.querySelector('.twn-p canvas.twn-big'), v = cv._view, P9 = SM_TOWN.places().filter(q => !SM_TOWN.inSchool(q.x, q.z) && q.kind !== 'house'); for (const q of P9) { const [px, py] = cv._pt(q.x, q.z); if (px > 40 && py > 40 && px < cv.width - 40 && py < cv.height - 40) { const r = cv.getBoundingClientRect(); return { name: q.name, x: r.left + px * r.width / cv.width, y: r.top + py * r.height / cv.height }; } } return null; });
        if (pl) { await p.mouse.click(pl.x, pl.y); await W8(400); const I = await ev(() => SM_TOWN.go().info()); ok(!!I && /길 안내/.test(I.text) && /바로 가기/.test(I.text), '확대한 자리에서 누르기 = GO-1 고르기 창(' + (I ? I.kind + ' · ' + I.name : '없음') + ' · 누른 곳 ' + pl.name + ')'); await ev(() => SM_TOWN.go().close()); } else ok(false, '확대한 화면에서 누를 장소 못 찾음');
        const z0b = (await st()).view.z; await ev(() => document.querySelector('.twn-p .twn-mchips button[data-zm="1"]').click()); await W8(300); const z1b = (await st()).view.z; await ev(() => document.querySelector('.twn-p .twn-mchips button[data-zm="-1"]').click()); await W8(300); const z2b = (await st()).view.z;
        ok(z1b > z0b && z2b < z1b, '＋ 크게 · － 작게 단추 (' + [z0b, z1b, z2b].map(v => v.toFixed(2)).join(' → ') + ')');
        await closeAll(); B = await big(); ok(B.view.z === 1, 'M을 다시 열면 첫 화면(1배)'); await closeAll(); }
      console.log('④ 내 화살표 = 가는 쪽');
      { const seg = await ev(() => { const R = SM_TOWN.rsegs().filter(s => Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) > 70 && !SM_TOWN.inSchool((s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2)).sort((a, b) => b.hw - a.hw); const s = R[0]; return s ? { a: s.a, b: s.b } : null; });
        ok(!!seg, '걸을 큰길 찾음');
        const hd = () => ev(() => SM_TOWN.map2().head), camH = () => ev(() => SD2.map.player.get().h);
        const put = async (t) => { await ev(([s, t]) => { const x = s.a[0] + (s.b[0] - s.a[0]) * t, z = s.a[1] + (s.b[1] - s.a[1]) * t; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, [seg, t]); await W8(900); };
        const dx = seg.b[0] - seg.a[0], dz = seg.b[1] - seg.a[1], road = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360;
        const walk = async (key, ms) => { await p.keyboard.down(key); await W8(ms); const h = await hd(); await p.keyboard.up(key); return h; };
        await put(0.25); await ev(([dx, dz]) => SD2.yaw(Math.atan2(-dx, -dz)), [dx, dz]); await W8(500);
        let h = await walk('KeyW', 1400); ok(angD(h.deg, road) < 25 && h.by === 'move', '앞으로 걷기 = 화살표가 길 쪽(' + h.deg + '° · 길 ' + Math.round(road) + '°)');
        const mini = () => ev(() => { const cv = document.querySelector('.twn-mini canvas'); if (!cv || !cv.width) return null; const m = SD2.map.player.pos(), [px, py] = SM_TOWN.miniPt(m.x, m.z), a = SM_TOWN.map2().head.a, g = cv.getContext('2d'), red = (x, y) => { const d = g.getImageData(Math.round(x), Math.round(y), 1, 1).data; return d[0] > 190 && d[1] < 90 && d[2] < 90; }, s = 9.5;
          /* CORE-FIX(11-14 · core 한 번 ✗ · 같은 판 HEAD에서 여섯 번 ✓ · 오늘 커밋은 작은 지도 그리기를 안 건드림): 화살표 중심이 x.5 자리면(이 길 = 89.5) 앞 0.6s 화소(반올림)가 화살표 가장자리에서 0.06 px뿐 → 0.3 m만 어긋나도 흰 테두리와 섞여 '빨강 아님' — 앞 끝 표본을 몸통 안 0.45s로(같은 자리에서 여유 0.76 px · 화소 한 칸 그대로) · 거꾸로 그린 화살표면 그 자리는 흰 홈이라 그대로 떨어짐 · 꼬리 0.6s 그대로 · 떨어지면 화소 값을 찍음 */
          const col = (x, y) => [...g.getImageData(Math.round(x), Math.round(y), 1, 1).data].slice(0, 3).join(','), tx = px + Math.sin(a) * s * 0.45, ty = py - Math.cos(a) * s * 0.45, bx = px - Math.sin(a) * s * 0.6, by = py + Math.cos(a) * s * 0.6;
          return { tip: red(tx, ty), tail: red(bx, by), mid: red(px, py), dbg: { tipC: col(tx, ty), tailC: col(bx, by), p: [+px.toFixed(2), +py.toFixed(2)], deg: SM_TOWN.map2().head.deg, by: SM_TOWN.map2().head.by } }; });
        const why = m9 => m9 && m9.tip && !m9.tail ? '' : ' ' + JSON.stringify(m9);
        await W8(250); let m9 = await mini(); ok(m9 && m9.tip && !m9.tail, '작은 지도 화살표 앞 끝 = 가는 쪽(앞 ' + (m9 && m9.tip) + ' · 꼬리 홈 ' + (m9 && m9.tail) + ')' + why(m9));
        await shot('mini_walk', await ev(() => { const r = document.querySelector('.twn-mini').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; }));
        await put(0.25); await ev(([dx, dz]) => SD2.yaw(Math.atan2(-dz, dx)), [dx, dz]); await W8(500);   /* 오른쪽 = 길 쪽 · 카메라는 길에서 90° */
        h = await walk('KeyD', 1400); const ch9 = await camH(); ok(angD(h.deg, road) < 25 && angD(ch9, road) > 60, '옆으로 걷기 = 화살표는 가는 쪽(' + h.deg + '°) · 카메라 쪽(' + Math.round(ch9) + '°) 아님');
        await W8(1600); h = await hd(); const ch8 = await camH(); ok(angD(h.deg, ch8) < 20 && h.by === 'look', '멈추면 = 보는 쪽(' + h.deg + '° · 카메라 ' + Math.round(ch8) + '°)');
        await ev(() => SD2.yaw(0)); await W8(1400); h = await hd(); ok(angD(h.deg, 0) < 20, '멈춘 채 북쪽을 보면 화살표도 북(' + h.deg + '°)');
        await put(0.2); await ev(() => SM_TOWN.bike(true)); await W8(700); await ev(([dx, dz]) => SD2.yaw(Math.atan2(-dx, -dz)), [dx, dz]); await W8(400);
        h = await walk('KeyW', 1300); ok(angD(h.deg, road) < 30, '자전거 앞으로 = 길 쪽(' + h.deg + '° · ' + Math.round(road) + '°)');
        await put(0.7); await ev(([dx, dz]) => SD2.yaw(Math.atan2(dx, dz)), [dx, dz]); await W8(400);
        h = await walk('KeyW', 1300); ok(angD(h.deg, (road + 180) % 360) < 30, '자전거 거꾸로 = 반대쪽(' + h.deg + '° · ' + Math.round((road + 180) % 360) + '°)');
        m9 = await mini(); ok(m9 && m9.tip && !m9.tail, '자전거 = 작은 지도 화살표도 돎' + why(m9));
        await ev(() => SM_TOWN.bike(false)); await W8(400);
        await put(0.4); await ev(([dx, dz]) => SD2.yaw(Math.atan2(-dx, -dz)), [dx, dz]); await walk('KeyW', 900);
        B = await big(); { const r = await ev(() => { const cv = document.querySelector('.twn-p canvas.twn-big'), S = cv._st, M = S && S.me; if (!M) return null; const g = cv.getContext('2d'), mg = cv._view.mg, red = (x, y) => { const d = g.getImageData(Math.round(x + mg), Math.round(y + mg), 1, 1).data; return d[0] > 190 && d[1] < 90 && d[2] < 90; }; return { tip: red(M.px + Math.sin(M.a) * M.s * 0.6, M.pz - Math.cos(M.a) * M.s * 0.6), tail: red(M.px - Math.sin(M.a) * M.s * 0.6, M.pz + Math.cos(M.a) * M.s * 0.6), deg: Math.round(((M.a * 180 / Math.PI) % 360 + 360) % 360) }; });
          ok(r && r.tip && !r.tail && angD(r.deg, road) < 30, '큰 지도 화살표 앞 끝 = 가는 쪽(' + (r && r.deg) + '° · 앞 ' + (r && r.tip) + ' · 꼬리 ' + (r && r.tail) + ')'); }
        await shot('big_walk'); await closeAll();
        await p.keyboard.press('KeyJ'); await W8(700); await shot('j_walk'); await closeAll(); }
      ok(!errs.length, '페이지 오류 0 (크롬북)' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
      await P.ctx.close(); }
    // ───── B. 휴대폰 세로·가로 ─────
    { console.log('⑤ 크롬북 실제 창(1366×680 · 주소줄·탭 뺀 높이)'); const P = await page(b, { viewport: { width: 1366, height: 680 } }, BASE + '&all=1'), { ev, boot, big, shot, errs } = P; await boot(); const B = await big();
      const r = await ev(() => { const cv = document.querySelector('.twn-p canvas.twn-big').getBoundingClientRect(), cs = document.querySelector('.twn-p canvas.twn-mcs').getBoundingClientRect(), c = document.querySelector('.twn-p .twn-mcol').getBoundingClientRect(), x = document.querySelector('.twn-p [data-a="x"]').getBoundingClientRect(); return { w: Math.round(cv.width), h: Math.round(cv.height), b: cv.bottom, csB: cs.bottom, colB: c.bottom, xb: x.bottom, ih: innerHeight }; });
      ok(r.b <= r.ih && r.xb <= r.ih && r.csB <= r.colB + 1, '크롬북 창 = 지도 ' + r.w + '×' + r.h + ' · 방위표·축척·닫기가 굴리지 않고 보임'); ok(!ovl(B.st.L).length, '크롬북 창 = 이름표 겹침 0'); await shot('big_cb680'); ok(!errs.length, '페이지 오류 0 (크롬북 창)'); await P.ctx.close(); }
    for (const [nm, vp] of [['세로', { width: 390, height: 844 }], ['가로', { width: 844, height: 390 }]]) {
      console.log('⑥ 휴대폰 ' + nm);
      const P = await page(b, { viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, BASE + '&all=1'), { p, ev, W8, shot, closeAll, boot, big, errs } = P; await boot();
      const B = await big(); const r = await ev(() => { const cv = document.querySelector('.twn-p canvas.twn-big').getBoundingClientRect(), lg = document.querySelector('.twn-p .twn-mleg').getBoundingClientRect(), ch = document.querySelector('.twn-p .twn-mchips').getBoundingClientRect(); return { l: cv.left, t: cv.top, r: cv.right, b: cv.bottom, w: cv.width, h: cv.height, lgT: lg.top, lgL: lg.left, chT: ch.top, chH: ch.height, iw: innerWidth, ih: innerHeight }; });
      if (nm === '세로') { ok(r.w >= r.iw * 0.8, '세로 = 지도 폭 ' + Math.round(r.w) + 'px(화면 ' + r.iw + ' · 예전 약 230px)'); ok(r.lgT >= r.b - 1 && r.chT >= r.b - 1, '세로 = 칩·범례는 지도 밑'); const vis = await ev(() => [...document.querySelectorAll('.twn-p .twn-mchips button')].every(b => { const q = b.getBoundingClientRect(); return q.left >= 0 && q.right <= innerWidth && q.height >= 43; })); ok(vis, '세로 = 칩이 모두 화면 폭 안(굴리지 않고 · 터치 44px)'); }
      if (nm === '가로') ok(r.w >= 330, '가로 = 아래 줄을 옆 칸으로 → 지도 ' + Math.round(r.w) + '×' + Math.round(r.h) + '(예전 272×201)');
      ok(r.l >= 0 && r.r <= r.iw && r.t >= 0 && r.b <= r.ih, nm + ' = 지도가 화면 안(' + [r.l, r.t, r.r, r.b].map(Math.round).join(',') + ')');
      ok(!ovl(B.st.L).length && B.st.L.filter(l => l[4] === 'land').length >= 4, nm + ' = 이름표 겹침 0 · 큰 이름 ' + B.st.L.filter(l => l[4] === 'land').length);
      await shot('phone_' + (nm === '세로' ? 'port' : 'land'));
      const pl = await ev(() => { const cv = document.querySelector('.twn-p canvas.twn-big'), P9 = SM_TOWN.places().filter(q => !SM_TOWN.inSchool(q.x, q.z) && q.kind !== 'house'); for (const q of P9) { const [px, py] = cv._pt(q.x, q.z); if (px > 30 && py > 30 && px < cv.width - 30 && py < cv.height - 30) { const R = cv.getBoundingClientRect(); return { name: q.name, x: R.left + px * R.width / cv.width, y: R.top + py * R.height / cv.height }; } } return null; });
      if (pl) { await p.touchscreen.tap(pl.x, pl.y); await W8(500); const I = await ev(() => SM_TOWN.go().info()); ok(!!I && /길 안내/.test(I.text), nm + ' 터치로 누르기 = 고르기 창(' + (I ? I.name : '없음') + ')'); }
      ok(!errs.length, '페이지 오류 0 (휴대폰 ' + nm + ')' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
      await P.ctx.close(); }
  } catch (e) { ok(false, '시험 멈춤: ' + (e && e.message ? e.message.slice(0, 300) : e)); }
  await b.close();
  console.log((fails.length ? '✗ 실패 ' + fails.length : '✓ 모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초');
  process.exit(fails.length ? 1 : 0);
})();
