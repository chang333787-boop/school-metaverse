// 실제 사진 카드 시험(REALPIC-1): node tools/harness/town_photocard.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 처음 짓기 = 사진 요청 0(사진은 카드를 열 때만) ② 도감: 찾은 칸만 📷 · 못 찾은 칸 = 안 보임 · 도감 목록을 열어도 사진 요청 0
//   ③ 찾은 칸을 누르면 사진 카드 = 그 사진 한 장만 불러옴 · 그림이 뜸(naturalWidth) · 출처 한 줄(지은이 · 이용 허락 · 위키미디어 공용)
//   ④ 곤충 관찰 창 · 야생동물 카드 = 아래 작은 사진 + 출처 ⑤ 장소 카드(자연 장소·일터) = 사진 + 출처 · 가게 = 사진 X ⑥ 휴대폰 세로 = 사진 카드가 화면 폭 안 ⑦ 페이지 오류 0
//   브라우저는 한 자리로 돌림(zsh tools/ops/b2.sh node … · 맥 과열 X)
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8);
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [], REQ = [];
  try { const ctx = await b.newContext({ viewport: { width: 1280, height: 760 } }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) errs.push(t.slice(0, 200)); });
    p.on('request', r => { if (/\/img\/photos\//.test(r.url())) REQ.push(decodeURIComponent(r.url().split('/img/photos/')[1])); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS.replace(/\/$/, '') + '/' + n + '.png' }); };
    const shut = () => ev(() => { for (let i = 0; i < 4; i++) { const P = document.querySelector('.twn-p'); if (!P) return; const b9 = P.querySelector('[data-a="x"]') || [...P.querySelectorAll('button')].find(e => /닫기|Close|그대로/.test(e.textContent)); if (b9) b9.click(); else return; } });
    const fig = () => ev(async () => { const P = document.querySelector('.twn-p'); const F = P && P.querySelector('figure.pc-ph'); if (!F) return null; const im = F.querySelector('img'); for (let i = 0; i < 60 && !(im.complete && im.naturalWidth); i++) await new Promise(r => setTimeout(r, 100)); const r = F.getBoundingClientRect(), pr = P.getBoundingClientRect();
      return { k: F.dataset.ph, sm: F.classList.contains('sm'), w: im.naturalWidth, h: im.naturalHeight, src: im.getAttribute('src').split('/img/photos/')[1], cap: F.querySelector('figcaption').textContent, fw: Math.round(r.width), pw: Math.round(pr.width), right: Math.round(r.right), vw: innerWidth, h3: (P.querySelector('h3') || {}).textContent || '' }; });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.dexOpen && SM_TOWN.jobs && SM_TOWN.jobs(), null, { timeout: 240000 }); await W8(2500); await shut(); await p.keyboard.press('Escape'); await W8(600);
    const PH = await ev(async () => { const M = await import('/v2/games/town_photos.js?v=1'); return Object.fromEntries(Object.entries(M.PHOTOS).map(([k, v]) => [k, { src: v.src, by: v.by, lic: v.lic }])); });
    console.log('사진 표 ' + Object.keys(PH).length + '장');
    // ① 처음 짓기
    console.log('1. 처음 짓기');
    ok(REQ.length === 0, '처음 짓기에 사진 요청 0' + (REQ.length ? ' ← ' + REQ.join(', ') : ''));
    // ② 도감 목록
    console.log('2. 도감 목록');
    const FOUND = ['bug:cabbagewhite', 'wild:heron', 'fish:bungeo', '🍓', '🥬'], NOT = ['bug:ladybird', 'wild:otter', 'fish:megi', '🍐'];
    await ev(([F, N]) => { const G = SM_TOWN.game(); const S = G.S || G; for (const k of N) delete S.dex[k]; for (const k of F) { if (G.found) G.found(k); else S.dex[k] = { d: S.day, c: '', s: '', t: '' }; } }, [FOUND, NOT]);
    await ev(() => SM_TOWN.dexOpen()); await W8(700);
    const D = await ev(() => { const P = document.querySelector('.twn-p'); return P ? { keys: [...P.querySelectorAll('[data-ph]')].map(e => e.dataset.ph), img: [...P.querySelectorAll('img')].filter(i => /\/img\/photos\//.test(i.getAttribute('src') || '')).length, t: P.textContent } : null; });
    ok(!!D && /도감|Codex/.test(D.t), '도감이 열림');
    ok(D && FOUND.every(k => D.keys.includes(k)), '찾은 칸 ' + FOUND.length + '개 = 📷 사진 칸(' + (D ? D.keys.join(' ') : '') + ')');
    ok(D && NOT.every(k => !D.keys.includes(k)), '못 찾은 칸(' + NOT.join(' ') + ') = 사진 칸 X(안 보임 그대로)');
    ok(D && D.img === 0 && REQ.length === 0, '도감 목록을 열어도 사진 요청 0(' + REQ.length + ')');
    await shot('dex_list');
    // ③ 사진 카드
    console.log('3. 도감 사진 카드');
    const card = async (k, nm) => { const n0 = REQ.length; await ev(k9 => { const P = document.querySelector('.twn-p'); const e = P && [...P.querySelectorAll('[data-ph]')].find(q => q.dataset.ph === k9); if (e) e.click(); }, k); await W8(500); const F = await fig(); const want = PH[k] && PH[k].src;
      ok(!!F && F.k === k && F.src === want && F.w > 300, nm + ': 사진 카드 = ' + want + (F ? ' ' + F.w + '×' + F.h : ' (없음)'));
      ok(!!F && /사진:/.test(F.cap) && F.cap.includes(PH[k].by) && /위키미디어 공용/.test(F.cap), nm + ': 출처 한 줄 「' + (F ? F.cap.replace(/\s+/g, ' ').slice(0, 90) : '') + '」');
      ok(REQ.length - n0 === 1 && REQ[REQ.length - 1] === want, nm + ': 그 사진 한 장만 불러옴(' + REQ.slice(n0).join(', ') + ')');
      await shot('dex_' + nm); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="dex"]'); if (b9) b9.click(); }); await W8(400); return F; };
    await card('bug:cabbagewhite', 'bug'); await card('wild:heron', 'wild'); await card('fish:bungeo', 'fish'); await card('🍓', 'plant'); await card('🥬', 'plant2');
    await shut(); await W8(300);
    // ④ 관찰 창
    console.log('4. 관찰 창(곤충 · 야생동물)');
    { const L = await ev(() => SM_TOWN.bugs()), i = L.findIndex(s => s.b); if (i < 0) ok(true, '(이 판·때에 나온 곤충이 없어 곤충 창은 건너뜀)'); else { await ev(j => SM_TOWN.bugLook(j), i); let F = null; for (let t = 0; t < 14 && !(F = await fig()); t++) await W8(500); ok(!!F && F.sm && F.k === 'bug:' + L[i].b, '곤충 관찰 창 아래 작은 사진(' + L[i].b + ')' + (F ? ' · ' + F.cap.replace(/\s+/g, ' ').slice(0, 70) : '')); await shot('look_bug'); await shut(); await W8(400); } }
    { const sp = await ev(() => { const W = SM_TOWN.wild(); return W && W.info ? W.info().spots.map((s, j) => ({ j, id: s.id })) : []; }); if (!sp.length) ok(true, '(야생동물 자리 없음 — 건너뜀)'); else { await ev(j => SM_TOWN.wild().lookAt(j), sp[0].j); await W8(600); const F = await fig(); ok(!!F && F.sm && F.k === 'wild:' + sp[0].id, '야생동물 카드 아래 작은 사진(' + sp[0].id + ')' + (F ? ' · ' + F.cap.replace(/\s+/g, ' ').slice(0, 70) : '')); await shot('look_wild'); await shut(); await W8(400); } }
    // ⑤ 장소 카드
    console.log('5. 장소 카드');
    const places = await ev(() => SM_TOWN.jobs().eligible().map(q => q.name));
    for (const [nm, want] of [['뒷산', 'place_hill'], ['해수욕장', 'place_beach'], ['염전', 'place_saltpan'], ['숲속 오솔길', 'place_forest'], ['고랭지 배추밭', 'plant_cabbage'], ['마트', null]]) { if (!places.includes(nm)) { console.log('    (이 판에 ' + nm + ' 없음)'); continue; }
      await ev(n => { const J = SM_TOWN.jobs(); const q = J.eligible().find(x => x.name === n); J.openCard(q); }, nm); await W8(500); const F = await fig();
      if (want) ok(!!F && !F.sm && F.src === want + '.jpg' && F.w > 300 && /위키미디어 공용/.test(F.cap), '장소 카드 「' + nm + '」 = ' + want + ' + 출처'); else ok(!F, '장소 카드 「' + nm + '」 = 사진 X(가게)');
      if (nm === '뒷산' || nm === '염전') await shot('place_' + (nm === '뒷산' ? 'hill' : 'saltpan')); await shut(); await W8(300); }
    // ⑥ 휴대폰 세로
    console.log('6. 휴대폰 세로');
    { await p.setViewportSize({ width: 390, height: 844 }); await W8(800); await ev(() => SM_TOWN.dexOpen()); await W8(500); await ev(() => { const e = document.querySelector('.twn-p [data-ph="wild:heron"]'); if (e) e.click(); }); await W8(500); const F = await fig();
      ok(!!F && F.right <= F.vw && F.fw <= F.vw, '휴대폰 세로: 사진 카드가 화면 폭 안(' + (F ? F.fw + '/' + F.vw : '-') + ')'); await shot('dex_phone'); await shut(); await p.setViewportSize({ width: 1280, height: 760 }); await W8(400); }
    console.log('    사진 요청 모두 ' + REQ.length + '번 · ' + [...new Set(REQ)].join(', '));
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); }
  await b.close(); console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
