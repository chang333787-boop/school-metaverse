// 마을 차 끼임 시험(LIFE-3 · 교사 10-14 '차에 꼈는데 뭐야 이거'): node tools/harness/town_trap.cjs [마을=ourtown] [포트=8002] [--n=회수]
//   차도 한가운데 · 교차로 모퉁이(돌고 있는 차 앞) · 옆에서 차가 쓸고 옴 · 차 위로 순간이동 · 앞에서 들이받기 · 옆구리 들이받기 · 주차 칸 옆 길가
//   걸어서 + 자전거로 각각 회수만큼. 매 판 끝에 8방향으로 0.6초씩 걸어 보고 어느 쪽으로도 0.3m 못 가면 '갇힘'.
//   게이트: 갇힘 0 · 몸이 차 상자 안에 남은 프레임 0 · 안전장치(2초 못 움직임 → 옮김)가 차 때문에 쓰인 횟수는 따로 보여 줌
const { chromium } = require('playwright');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const N = +((process.argv.find(a => a.startsWith('--n=')) || '--n=3').slice(4));   // 기본 3 = 7가지 × 걸어서·자전거 × 3 = 42판
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.life, null, { timeout: 120000 }); await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = document.querySelector('.twn-p button'); if (b) b.click(); });
  const res = [];
  const KINDS = ['lane', 'corner', 'sweep', 'ontop', 'ram', 'side', 'park'];
  for (const bike of [false, true]) for (let n = 0; n < N; n++) for (const kind of KINDS) {
    const r = await p.evaluate(async ({ kind, bike, n }) => {
      const M = SD2.map, sl = ms => new Promise(r => setTimeout(r, ms)), V = () => SM_TOWN.life.veh, me = () => M.player.get();
      // 몸이 차 몸 안에 들어감 = 몸 가운데가 차 테두리에서 12cm 밖보다 안쪽(몸 반지름 26cm 중 14cm 넘게 겹침) — 충돌 상자를 켰든 껐든 실제 차 기준
      const seen = []; const inBox = () => { const m = me(); return V().some((v, i) => { const dx = m.x - v[0], dz = m.z - v[1]; if (dx * dx + dz * dz > 49 || Math.abs(m.y - v[5]) > 2) return false; const al = dx * v[3] + dz * v[4], lt = dx * v[4] - dz * v[3]; const hit = Math.abs(al) < (v[10] || 2.1) + 0.12 && Math.abs(lt) < (v[9] === 'bus' ? 1.25 : 0.92) + 0.12; if (hit && seen.length < 4) seen.push([i, +al.toFixed(2), +lt.toFixed(2), v[2], v[6]]); return hit; }); };
      SM_TOWN.bike(bike); await sl(150);
      // 고를 차: 움직이는 승용차 · 학교에서 먼 곳 · 판마다 다른 차(n)
      const pick = (want) => { const L = V().map((v, i) => ({ v, i })).filter(({ v }) => v[9] === 'car' && v[2] > 2.5 && (want === 'turn' ? v[6] === 1 : v[6] === 0) && Math.hypot(v[0] - 16, v[1] - 40) > 120); return L.length ? L[(n * 7 + 3) % L.length] : null; };
      let c = pick(kind === 'corner' ? 'turn' : 'str'); if (!c && kind === 'corner') { for (let k = 0; k < 40 && !c; k++) { await sl(100); c = pick('turn'); } } if (!c) c = pick('str'); if (!c) return { kind, skip: 'nocar' };
      const [x, z, , hx, hz, y] = c.v, rx = -hz, rz = hx;
      const at = (a, l) => [x + hx * a + rx * l, z + hz * a + rz * l], tp = (q) => M.player.teleport([q[0], y + 0.05, q[1]]);
      let stuckIn = 0, frames = 0; const watch = (ms) => new Promise(res => { const t0 = performance.now(); const f = () => { frames++; if (inBox()) stuckIn++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      const look = (q) => M.player.lookAt([q[0], q[1]]);
      if (kind === 'lane') { tp(at(9 + c.v[2] * 0.4, 0)); look([x, z]); await watch(3500); }                 // 차도 한가운데(그 차 차선) — 차가 나에게 옴
      else if (kind === 'corner') { tp(at(5, 1.2)); look([x, z]); await watch(3500); }                     // 돌고 있는 차의 앞쪽 안(모퉁이 쓸기)
      else if (kind === 'sweep') { tp(at(1.6, 1.0)); await watch(2500); }                                  // 앞 모서리 옆 — 상자가 몸 쪽으로 들어옴
      else if (kind === 'ontop') { tp(at(0, 0)); await watch(2000); }                                      // 차 위로 순간이동
      else if (kind === 'ram') { tp(at(7, 0)); look([x, z]); await watch(2500); }        // 앞에서 들이받기(아래 W)
      else if (kind === 'side') { tp(at(0, 2.2)); look(at(0, 0)); await watch(2500); }   // 옆구리 들이받기
      else if (kind === 'park') { tp(at(4, 2.0)); look(at(4, -3)); await watch(3000); }                   // 길가(인도 턱 쪽)에서 차가 지나감
      return { kind, bike, car: c.i, frames, stuckIn, seen, at: [+me().x.toFixed(1), +me().z.toFixed(1)] };
    }, { kind, bike, n });
    if (r.skip) { res.push(r); continue; }
    // ram/side: 실제 키를 누른 채(위 evaluate 안의 시간과 겹치게 하지 않고 따로 2초)
    if (kind === 'ram' || kind === 'side') { await p.keyboard.down('KeyW'); await p.waitForTimeout(2000); await p.keyboard.up('KeyW'); }
    // 탈출 시험: 8방향으로 0.6초씩 걸어 봄(자동 걷기) — 어느 쪽으로도 0.3m 못 가면 갇힘
    const esc = await p.evaluate(async () => { const M = SD2.map, sl = ms => new Promise(r => setTimeout(r, ms)); let best = 0;
      for (let a = 0; a < 8; a++) { const m0 = M.player.get(); M.player.steer(Math.cos(a / 8 * 6.2832), Math.sin(a / 8 * 6.2832), 4); await sl(600); M.player.steer(null); const m1 = M.player.get(); best = Math.max(best, Math.hypot(m1.x - m0.x, m1.z - m0.z)); if (best > 0.3) break; }
      return { best: +best.toFixed(2), net: (SM_TOWN.stuck ? SM_TOWN.stuck() : []).length }; });
    res.push({ ...r, esc: esc.best, trapped: esc.best < 0.3, net: esc.net });
  }
  await p.evaluate(() => SM_TOWN.bike(false));
  const ok = res.filter(r => !r.skip), trapped = ok.filter(r => r.trapped), inside = ok.filter(r => r.stuckIn > 2);
  const byKind = {}; for (const r of ok) { const k = (r.bike ? '🚲' : '') + r.kind; byKind[k] = byKind[k] || { n: 0, trapped: 0, inBoxFrames: 0 }; byKind[k].n++; if (r.trapped) byKind[k].trapped++; byKind[k].inBoxFrames += r.stuckIn; }
  const net = await p.evaluate(() => SM_TOWN.stuck ? SM_TOWN.stuck() : null), life = await p.evaluate(() => ({ honks: SM_TOWN.life.honks }));
  const gate = trapped.length === 0 && inside.length === 0;
  console.log(JSON.stringify({ trials: ok.length, skipped: res.length - ok.length, trapped: trapped.length, inBoxTrials: inside.length, byKind, trappedAt: trapped.map(r => [r.kind, r.bike ? 'bike' : 'foot', r.at]), insideAt: inside.map(r => [r.kind, r.bike ? 'bike' : 'foot', r.stuckIn, r.at, 'car' + r.car, JSON.stringify(r.seen)]), netLog: net, honks: life.honks, gate: gate ? 'PASS' : 'FAIL', errs }, null, 1));
  await b.close(); process.exit(gate ? 0 : 1); })();
