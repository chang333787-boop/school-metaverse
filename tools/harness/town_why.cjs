// 🤔 '왜 있어?' 고치기 시험(WHY-1 · v2/games/town_why.js · docs/systems/town_why.md): node tools/harness/town_why.cjs [마을=ourtown] [포트=8002]
//   고친 E마다: ① E 자리가 있고 눌러 닿음(SD2.actOn) ② 반응(소리 · 말풍선 · 창 · 알림 · 몸짓 가운데 하나) ③ 두 번째·다른 때엔 다른 갈래 ④ 페이지 오류 0
//   보호센터: 강아지 셋(쓰다듬기·공·산책) · 고양이(쓰다듬기·끈) · 다음 날 반김 · 산책 = 문 밖에서 따라오고 한 바퀴 뒤 문 앞에서 끝
//   은행 번호표·현금 지급기 · 병원 키 재기 · 아쿠아리움 수조·작은 동물 방 · 바깥 목장 양·소 · 동물 마당 · 분수(있는 마을만)
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const closeAll = async () => { for (let i = 0; i < 6; i++) { const o = await ev(() => !!document.querySelector('.twn-p') || !!document.querySelector('.twn-dlg')); if (!o) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); else { const c = document.querySelector('.twn-p button'); if (c) c.click(); } }); await W8(250); if (await ev(() => !!document.querySelector('.twn-dlg'))) { await p.keyboard.press('KeyE'); await W8(250); } } };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.why && SM_TOWN.indoor, null, { timeout: 240000 }); await W8(3000); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; SM_TOWN.rules.wx('clear'); try { SM_TOWN.storyOff(); } catch (e) { void e; } });
    const W = () => ev(() => SM_TOWN.why().info());
    /* E 하나 누르기: 라벨이 맞는 가장 가까운 E로 옮겨 actOn → 0.7초 안 반응(소리·창·알림·말풍선) */
    const press = (re, ms = 700) => ev(async ([src, ms]) => { const re = new RegExp(src), M = SD2.map, me = M.player.get(); let h = null, bd = 1e9; for (const q of M.interact.list()) { if (q.kind !== 'game' || q.off || !re.test(q.label || '')) continue; const d = Math.hypot(q.x - me.x, q.z - me.z) + Math.abs(q.y - me.y) * 3; if (d < bd) { bd = d; h = q; } } if (!h) return { none: 1 };
      M.player.teleport([h.x, h.y + 0.05, h.z]); await new Promise(r => setTimeout(r, 250)); const F = SM_TOWN.feel().info(), s0 = F.snd.sfx + F.snd.tone, t0 = (document.getElementById('toast') || {}).textContent || '', b0 = SM_TOWN.ask.bub().t;
      SD2.actOn(h); await new Promise(r => setTimeout(r, ms)); const F1 = SM_TOWN.feel().info(), te = document.getElementById('toast'), t1 = te && te.style.display !== 'none' ? te.textContent : '', B = SM_TOWN.ask.bub();
      return { label: h.label, snd: F1.snd.sfx + F1.snd.tone - s0, pan: !!document.querySelector('.twn-p'), toast: t1 !== t0 ? t1 : '', bub: B.vis && B.t !== b0 ? B.t : (B.vis ? B.t : '') }; }, [re.source, ms]);
    const reacted = r => !!r && !r.none && (r.snd > 0 || r.pan || r.toast || r.bub);
    const click = sel => ev(s => { const b9 = document.querySelector('.twn-p ' + s); if (b9) { b9.click(); return true; } return false; }, sel);
    const enter = async re => { await closeAll(); await ev(() => { try { if (SM_TOWN.indoor.state().on) SM_TOWN.indoor.exit(); } catch (e) { void e; } }); for (let i = 0; i < 30 && await ev(() => { try { return !!SM_TOWN.indoor.state().on; } catch (e) { return false; } }); i++) await W8(250); await W8(300); const id = await ev(src => { const r = SM_TOWN.indoor.list().find(q => new RegExp(src).test(q.name || '')); return r ? r.id : null; }, re.source); if (id == null) return false; await ev(i => SM_TOWN.indoor.enter(i), id); for (let i = 0; i < 24; i++) { await W8(250); if (await ev(() => { const s = SM_TOWN.indoor.state(); return !!s.on && !s.busy; })) { await W8(400); await closeAll(); return true; } } return false; };
    const lastBr = async (k) => { const d = (await W()).dbg; const L = d.filter(t => t.startsWith(k)); return L.length ? L[L.length - 1] : ''; };

    // ── 1. 🐶 보호센터 강아지 ──
    console.log('── 1. 보호센터');
    ok(await enter(/동물보호센터/), '보호센터 방에 들어감');
    let w = await W(); ok(w.room && w.room.dogs.length === 3 && w.room.cats.length === 2, '움직이는 강아지 셋 · 고양이 둘 (' + (w.room ? w.room.dogs.length + '·' + w.room.cats.length : '-') + ')');
    let r = await press(/보리와 놀기|Bori/); ok(reacted(r) && r.pan, '🐶 보리 E = 창 (' + (r.label || '없음') + ')');
    await click('[data-w="pet"]'); await W8(1800); w = await W(); const b1 = w.room.dogs[0].br;
    ok(b1 === 'sniff' || b1 === 'jump', '보리 쓰다듬기 첫 번 = 냄새 맡기/앞발 「' + b1 + '」 · 울타리로 옴 z=' + w.room.dogs[0].z);
    ok(w.room.dogs[0].z > -3.4, '보리가 울타리 앞까지 걸어옴 (z ' + w.room.dogs[0].z + ')');
    await press(/보리와 놀기|Bori/); await click('[data-w="pet"]'); await W8(1500); w = await W(); ok(w.room.dogs[0].br === 'belly' && w.room.dogs[0].roll > 0.3, '두 번째 = 벌러덩 배 보이기 (roll ' + w.room.dogs[0].roll + ')');
    /* 공: 던지면 쫓아가 물고 와서 울타리에 내려놓음 · 세 번째엔 지쳐 엎드림 */
    await press(/보리와 놀기|Bori/); await click('[data-w="ball"]'); await W8(400); w = await W(); ok(w.room.ball.vis, '⚾ 공이 날아감');
    let got = false, back = false; for (let i = 0; i < 40 && !back; i++) { await W8(250); w = await W(); got = w.room.ball.nf > 0; back = w.room.ball.nb > 0; } ok(got && back, '보리가 공을 물었다가 울타리에 내려놓음');
    await W8(1800); await ev(() => SM_TOWN.why().dbg.ball(0)); await W8(3500); const b3 = await ev(() => SM_TOWN.why().dbg.ball(0)); ok(b3 === 'tired' || b3 === 'wait', '세 번째 공 = 헥헥 쉬기 「' + b3 + '」');
    /* 콩이(겁 많음): 처음 = 물러남 → 다음 = 조금 다가옴 */
    r = await press(/콩이와 놀기|Kongi/); await click('[data-w="pet"]'); await W8(400); ok(reacted(r) && (await lastBr('pet kong')) === 'pet kong back', '콩이 처음 = 뒤로 물러남');
    await press(/콩이와 놀기|Kongi/); await click('[data-w="pet"]'); await W8(300); ok((await lastBr('pet kong')) === 'pet kong near', '콩이 두 번째 = 조금씩 다가옴');
    await press(/콩이와 놀기|Kongi/); await click('[data-w="walk"]'); await W8(300); ok(/낯설어|nervous/.test(await ev(() => document.getElementById('toast').textContent)), '콩이 산책 = 아직 낯설어 못 나감(사귄 날 수)');
    /* 두리(나이 많음): 한낮 = 잠 · 오전 = 천천히 옴 */
    await ev(() => { SM_TOWN.game().S.min = 13 * 60; }); r = await press(/두리와 놀기|Duri/); await click('[data-w="pet"]'); await W8(300); ok((await lastBr('pet duri')) === 'pet duri sleep', '두리 한낮 = 자는 중(깨우지 않음)');
    await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); await press(/두리와 놀기|Duri/); await click('[data-w="pet"]'); await W8(300); ok((await lastBr('pet duri')) === 'pet duri slow', '두리 오전 = 천천히 일어나 옴');
    /* 고양이 */
    r = await press(/고양이와 놀기|cats/); ok(reacted(r) && r.pan, '🐱 고양이 E = 창'); await click('[data-w="pet"]'); await W8(300); const c1 = await lastBr('cat');
    await press(/고양이와 놀기|cats/); await click('[data-w="pet"]'); await W8(300); const c2 = await lastBr('cat'); await press(/고양이와 놀기|cats/); await click('[data-w="pet"]'); await W8(300); const c3 = await lastBr('cat');
    ok(c1 === 'cat blink' && c2 === 'cat rub' && c3 === 'cat flick', '고양이 쓰다듬기 = 눈 깜빡 → 머리 비빔 → 꼬리 탁탁(그만) 「' + [c1, c2, c3].join(' / ') + '」');
    await press(/고양이와 놀기|cats/); await click('[data-w="toy"]'); await W8(300); const t1 = await lastBr('toy'); await press(/고양이와 놀기|cats/); await click('[data-w="toy"]'); await W8(300); const t2 = await lastBr('toy'); ok(t1 !== t2 && /paw/.test(t1), '끈 흔들기 = 갈래가 바뀜 「' + t1 + ' → ' + t2 + '」');
    /* 산책: 보리 → 문 밖에서 따라옴 → 한 바퀴 뒤 문 앞 = 끝 */
    await ev(() => { SM_TOWN.game().S.min = 10 * 60; }); await press(/보리와 놀기|Bori/); await click('[data-w="walk"]'); await W8(300); w = await W(); ok(w.walk && w.walk.st === 'leash', '🐾 보리 산책 = 목줄(' + (w.walk ? w.walk.st : '-') + ')');
    await ev(() => SM_TOWN.indoor.exit()); await W8(1200); w = await W(); ok(w.walk && w.walk.st === 'walk', '문 밖으로 나오면 보리가 곁에 나타남');
    const door = w.walk && w.walk.door; let gapOk = true;
    if (door) { for (let i = 0; i < 16; i++) { await ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, [door[0] + Math.cos(i / 16 * 6.28) * 9, door[1] + Math.sin(i / 16 * 6.28) * 9]); await W8(260); } const w2 = await W(); gapOk = !!w2.walk && w2.walk.m > 0; ok(gapOk, '걸으면 같이 걸은 거리가 늚 (' + (w2.walk ? w2.walk.m : '-') + 'm)'); }
    await ev(() => SM_TOWN.why().dbg.walkM(95)); if (door) { await ev(([x, z]) => SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]), [door[0] + 2, door[1] + 2]); } await W8(700); w = await W(); ok(!w.walk && w.s.walk === w.s.td.d, '한 바퀴 뒤 문 앞 = 산책 끝(오늘 했음)');
    /* 다음 날: 놀아 준 강아지가 울타리로 와 반김 */
    await ev(() => { SM_TOWN.game().S.day += 1; SM_TOWN.game().S.min = 11 * 60; }); await enter(/동물보호센터/); await W8(300); w = await W(); ok(w.room && w.room.dogs.some(d => d.act === 'greet'), '다음 날 들어가면 놀아 준 강아지가 반김(greet)');
    await W8(1200); ok(/반겨|recognises/.test(await ev(() => document.getElementById('toast').textContent)), '반기는 한 줄이 뜸');

    // ── 2. 은행 · 병원 · 아쿠아리움 ──
    console.log('── 2. 방 소품');
    await ev(() => { SM_TOWN.game().S.min = 10 * 60; });
    if (await enter(/^은행$/)) { r = await press(/번호표 뽑기|Take a number/); ok(reacted(r), '🎫 번호표 E 반응'); const k1 = await lastBr('tk'); await ev(() => { SM_TOWN.game().S.min = 12 * 60; }); await press(/번호표 뽑기|Take a number/); const k2 = await lastBr('tk'); ok(/w1/.test(k1) && /w5/.test(k2), '번호표 = 오전 1명 · 점심 5명 「' + k1 + ' / ' + k2 + '」');
      r = await press(/현금 지급기|Cash machine/); ok(reacted(r), '🏧 현금 지급기 E 반응'); const a1 = await lastBr('atm'); await press(/현금 지급기|Cash machine/); const a2 = await lastBr('atm'); ok(a1 !== a2, '현금 지급기 = 갈래가 바뀜 「' + a1 + ' / ' + a2 + '」'); } else ok(false, '은행 방');
    await ev(() => { SM_TOWN.game().S.min = 9 * 60 + 30; });
    if (await enter(/^병원$|보건소|의원/)) { r = await press(/키 재 보기|Measure my height/); ok(reacted(r), '📏 키 재기 E 반응'); const h1 = await lastBr('ht'); await ev(() => { SM_TOWN.game().S.min = 15 * 60; }); await press(/키 재 보기|Measure my height/); const h2 = await lastBr('ht'); ok(h1 === 'ht first' && h2 === 'ht shorter', '키 = 아침 → 오후 1cm 작음 「' + h1 + ' / ' + h2 + '」'); } else ok(false, '병원 방');
    await ev(() => { SM_TOWN.game().S.min = 14 * 60; });
    if (await enter(/대형 아쿠아리움/)) { r = await press(/클리오네|sea angels/); ok(reacted(r), '🐚 클리오네 E 반응'); const q1 = await lastBr('cl'); await press(/클리오네|sea angels/); const q2 = await lastBr('cl'); ok(q1 !== q2, '클리오네 = 갈래가 바뀜');
      r = await press(/작은 동물 방|small animal/); ok(reacted(r) && r.bub, '🐰 작은 동물 방 E = 말풍선 「' + (r.bub || '-') + '」'); const s1 = await lastBr('sa'); await press(/작은 동물 방|small animal/); ok(s1 !== await lastBr('sa'), '작은 동물 방 = 갈래가 바뀜'); } else ok(false, '아쿠아리움 방');
    await closeAll(); await ev(() => { try { SM_TOWN.indoor.exit(); } catch (e) { void e; } }); await W8(800);

    // ── 3. 바깥: 목장 · 동물 마당 · 분수 ──
    console.log('── 3. 바깥');
    await ev(() => { SM_TOWN.game().S.min = 11 * 60; SM_TOWN.rules.wx('clear'); });
    const an = await ev(() => { const H = SM_TOWN.herd(); if (!H || !H.anNear) return null; for (const P of SM_TOWN.places()) if (/목장/.test(P.name || '')) { const q = H.anNear(P.x != null ? P.x : P.cx, P.z != null ? P.z : P.cz, 80); if (q) return { x: q.x, z: q.z, k: q.k }; } return null; });
    if (an) { await ev(([x, z]) => SD2.map.player.teleport([x + 2.2, SM_TOWN.ground(x + 2.2, z) + 0.05, z]), [an.x, an.z]); await W8(1200); const fh = await ev(() => SM_TOWN.why().dbg.farmHot()); ok(fh && !fh.off, '목장 동물 곁 E가 켜짐 「' + (fh ? fh.label : '-') + '」');
      r = await press(/양에게 인사|소에게 인사|sheep|cow/, 600); ok(reacted(r) && r.bub, '목장 E = 말풍선 + 한 줄 「' + (r.bub || '-') + '」'); const f1 = await lastBr('farm'); await W8(3800); await press(/양에게 인사|소에게 인사|sheep|cow/, 600); const f2 = await lastBr('farm'); ok(f1 !== f2, '두 번째 = 다른 갈래 「' + f1 + ' / ' + f2 + '」'); }
    else console.log('  · 목장 동물 없음(이 마을) — 건너뜀');
    const yd = await ev(() => SD2.map.interact.list().filter(h => /마당 강아지/.test(h.label || '')).length); if (yd) { r = await press(/마당 강아지/); ok(reacted(r) && r.bub, '🐕 동물 마당 E = 말풍선 「' + (r.bub || '-') + '」 (' + yd + '곳)'); const y1 = await lastBr('yard'); await press(/마당 강아지/); ok(y1 !== await lastBr('yard'), '동물 마당 = 갈래가 바뀜'); } else console.log('  · 동물 마당 없음(이 마을) — 건너뜀');
    const fn = await ev(() => SD2.map.interact.list().filter(h => /분수 물/.test(h.label || '')).length); if (fn) { r = await press(/분수 물/); ok(reacted(r), '💧 분수 E 반응 (' + fn + '곳)'); const g1 = await lastBr('fountain'); await ev(() => { SM_TOWN.game().S.min = 22 * 60; }); await W8(1500); await press(/분수 물/); const g2 = await lastBr('fountain'); ok(g1 !== g2, '분수 = 밤엔 다른 갈래 「' + g1 + ' / ' + g2 + '」'); } else console.log('  · 분수 없음(이 마을) — 건너뜀');

    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외', e.message); }
  await b.close(); console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
