// 아이 동네 이름답게(KIDLOOK-1 · 사용자 10-26 저녁 "자연친화 마을인데 '엥 이게 왜 자연친화 마을?'"): node tools/harness/town_kidlook.cjs [마을=ourtown] [포트=8002] [--shots=폴더 --tag=before|after]
//   동네마다 ① 새 소품 수(들머리 묶음 · 첫눈에 보이는 것) ② 할 거리 E가 있고 누르면 반응(창 · 알림 · 말풍선 · 소리) ③ 할 거리를 끝까지 해 보면 판단 결과가 남음 ④ 페이지 오류 0
//   --shots = 동네마다 눈높이 낮 사진 둘(들머리 · 가운데) — 고치기 전·후 같은 자리(자리는 아이 동네 표지석·동네 가운데에서 정함)
const { chromium } = require('./pw.cjs');
const pos9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos9[0] || 'ourtown', PORT = pos9[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; }, SHOTS = arg('shots'), TAG = arg('tag') || 'now';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const HOODS = ['다6', '마11', '다8', '바11', '사3', '라5', '다3', '다5', '라8', '자11'];   /* 대상 동네(칸 하나로 찾음 · 같은 동네 칸은 한 번만) */
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) || /게임 tick 오류|꼬리표 없는 보상/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const closeAll = async () => { for (let i = 0; i < 6; i++) { if (await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn()))) { await p.keyboard.press('Escape'); await W8(250); continue; } if (!(await ev(() => !!document.querySelector('.twn-p')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); } };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.region && window.SD2, null, { timeout: 240000 }); await W8(2000); await closeAll(); await p.keyboard.press('Escape'); await W8(400);
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; G.S.story = G.S.story || {}; G.S.story.p0auto = 1; (G.S.quiz || (G.S.quiz = {})).tip = 1; if (G.rwOff) G.rwOff(true); try { SM_TOWN.storyOff(); } catch (e) { void e; } SM_TOWN.rules.wx('clear'); });
    await W8(600); await closeAll();
    const R = await ev(() => SM_TOWN.region()), KS = R.stones.filter(q => q.kid), seen = new Set(), H = [];
    for (const c of HOODS) { const g = R.kids.find(q => q.cells.includes(c)); if (!g || seen.has(g.id)) continue; seen.add(g.id); const st = KS.find(q => q.kid === g.id), lab = R.labels.find(q => q.kid === g.id); H.push({ c, id: g.id, t: g.t, cells: g.cells, st, lab }); }
    ok(H.length === 10, '대상 동네 열(' + H.map(h => h.t + '=' + h.cells.join('·')).join(' | ') + ')');
    /* 사진 자리: 들머리 = 표지석 읽는 자리에서 동네 밖으로 7m 물러나 동네 가운데를 봄 · 가운데 = 동네 가운데에서 가장 가까운 걸을 수 있는 자리(들머리 → 가운데 방향을 봄) */
    const SPF = arg('spots'), fs = require('fs'), K0 = await ev(() => SM_TOWN.kidlook ? SM_TOWN.kidlook() : null);
    for (const h of H) { const q = K0 && K0.hoods.find(o => o.g === h.id); if (q) h.kl = [q.x, q.z]; }
    let spots = SPF && fs.existsSync(SPF) ? JSON.parse(fs.readFileSync(SPF, 'utf8')) : null; if (!spots) spots = await ev(H => H.map(h => { const bl = SD2.map.q.blocked || SD2.map.q.blockedAt, free = (x, z) => { const g = SM_TOWN.ground(x, z); return !bl(x, z, g + 0.6) && !bl(x + 0.5, z, g + 0.6) && !bl(x, z + 0.5, g + 0.6) && !bl(x - 0.5, z, g + 0.6) && !bl(x, z - 0.5, g + 0.6); };
      const near = (x, z) => { for (let r = 0; r <= 40; r += 1.5) for (let k = 0; k < (r ? 12 : 1); k++) { const a = k * Math.PI / 6, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (free(px, pz)) return [px, pz]; } return [x, z]; };
      const cx = h.lab ? h.lab.x : h.st.x, cz = h.lab ? h.lab.z : h.st.z, sx = h.st ? h.st.e[0] : cx, sz = h.st ? h.st.e[1] : cz, dx = sx - cx, dz = sz - cz, L = Math.hypot(dx, dz) || 1;
      const a = near(sx + dx / L * 7, sz + dz / L * 7), lk = h.kl || [cx, cz], m = near(cx, cz); return { in: { at: a, look: lk }, mid: { at: m, look: [m[0] - dx / L * 20, m[1] - dz / L * 20] } }; }), H);
    if (SPF && !fs.existsSync(SPF)) fs.writeFileSync(SPF, JSON.stringify(spots));
    if (SHOTS) { for (let i = 0; i < H.length; i++) for (const k of ['in', 'mid']) { const s = spots[i][k]; await ev(s => { SD2.map.player.teleport([s.at[0], SM_TOWN.ground(s.at[0], s.at[1]) + 0.05, s.at[1]]); SD2.map.player.lookAt(s.look); }, s); await W8(2600); await closeAll(); await p.screenshot({ path: SHOTS + '/' + TAG + '_' + H[i].c + '_' + k + '.png' }); }
      console.log('  사진 ' + H.length * 2 + '장 → ' + SHOTS + '/' + TAG + '_*.png'); }
    /* 새 소품 · 할 거리 */
    const K = await ev(() => SM_TOWN.kidlook ? SM_TOWN.kidlook() : null);
    if (!K) ok(false, 'SM_TOWN.kidlook 없음(고치기 전)');
    else { for (const h of H) { const q = K.hoods.find(o => o.g === h.id); ok(!!q && q.n >= 3, h.t + ': 들머리 묶음 소품 ' + (q ? q.n + '(' + q.list.join(' ') + ')' : 0)); ok(!!q && q.d < 60, h.t + ': 묶음이 표지석에서 ' + (q ? Math.round(q.d) : '-') + 'm(첫눈에 · 60m 안)'); ok(!!q && !!q.use, h.t + ': 할 거리 E 「' + (q && q.use || '-') + '」'); }
      /* 할 거리 E: 누르면 반응 · 판단 창이면 고르기까지 해 봄 */
      const post = (lab, x0, z0) => ev(async ([lab, x0, z0]) => { const M = SD2.map, L9 = M.interact.list().filter(o => o.kind === 'game' && !o.off && o.label === lab && Math.hypot(o.x - x0, o.z - z0) < 130), out = [];
        for (const h of L9) { M.player.teleport([h.x, (h.y ?? SM_TOWN.ground(h.x, h.z)) + 0.05, h.z]); await new Promise(r => setTimeout(r, 250)); const t0 = (document.getElementById('toast') || {}).textContent || ''; SD2.actOn(h); await new Promise(r => setTimeout(r, 500)); const te = document.getElementById('toast'); out.push(te && te.style.display !== 'none' ? te.textContent : ''); void t0; } return out; }, [lab, x0, z0]);
      for (const h of H) { const q = K.hoods.find(o => o.g === h.id); if (!q || !q.use) continue; await closeAll();
        if (q.posts.length) { const said = []; for (const lab of [...new Set(q.posts)]) said.push(...await post(lab, q.x, q.z)); ok(said.length === q.posts.length && said.every(Boolean), h.t + ': 자료 모으는 자리 ' + said.length + '/' + q.posts.length + ' E = 한 줄(' + said.map(t => t.slice(0, 26)).join(' / ') + ')'); await closeAll(); }
        const r = await ev(async lab => { const M = SD2.map, h = M.interact.list().find(o => o.kind === 'game' && !o.off && o.label === lab); if (!h) return { none: 1 }; M.player.teleport([h.x, (h.y ?? SM_TOWN.ground(h.x, h.z)) + 0.05, h.z]); await new Promise(r => setTimeout(r, 300));
          const t0 = (document.getElementById('toast') || {}).textContent || '', F = SM_TOWN.feel().info(), s0 = F.snd.sfx + F.snd.tone; SD2.actOn(h); await new Promise(r => setTimeout(r, 800)); const F1 = SM_TOWN.feel().info(), te = document.getElementById('toast'), P = document.querySelector('.twn-p');
          return { pan: P ? P.dataset.k || '?' : '', btn: P ? P.querySelectorAll('button[data-kl]').length : 0, toast: te && te.style.display !== 'none' && te.textContent !== t0 ? te.textContent : '', snd: F1.snd.sfx + F1.snd.tone - s0 }; }, q.use);
        ok(!r.none && (r.pan || r.toast || r.snd > 0), h.t + ': E 반응(' + (r.pan ? '창 ' + r.pan + ' · 고르기 ' + r.btn : r.toast ? '알림 「' + r.toast.slice(0, 40) + '」' : '소리') + ')');
        if (r.btn) { let guard = 0, last = null; while (guard++ < 12) { const s = await ev(() => { const P = document.querySelector('.twn-p'); if (!P) return null; const B = [...P.querySelectorAll('button[data-kl]')]; if (!B.length) return { end: P.textContent.slice(0, 120) }; B[0].click(); return { n: B.length }; }); await W8(350); if (!s) break; if (s.end) { last = s.end; break; } }
          const st = await ev(g => SM_TOWN.kidlook().hoods.find(o => o.g === g), h.id); ok(st.done > 0 && !!last, h.t + ': 끝까지 함 → 결과 창 「' + (last || '-').replace(/\s+/g, ' ').slice(0, 60) + '」 · 한 판 ' + st.done); await closeAll(); } } }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { ok(false, '시험 멈춤: ' + e.message.slice(0, 300)); }
  await b.close(); console.log((fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
