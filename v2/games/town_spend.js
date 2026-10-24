// 💰 돈 쓸 곳(SPEND-1 물뿌리개 넓은 꼭지 · SEED-1 튼튼한 씨앗 · 10-24 게임성 ② 중심 고리) — 설계 docs/systems/town_phase3.md 「돈 쓸 곳」 · 짓기 기록(10-24)
//   고리 = 심기·물·거두기 → 장터에 팔기(그날 장터 값) → 돈 → 넓은 꼭지(더 많이 한 번에) · 튼튼한 씨앗(거둘 때 하나 더) → 다음 날 아침 집 앞에서 결과가 보임
//   맡기는 곳 = 철물점·공구 가게 문 옆(있으면) → ❤4 과수원·딸기 이웃(있으면) → 둘 다 없는 마을은 장터 상인(장터 창 안 한 줄) · 씨앗 = 종묘상·씨앗·꽃집·화원(있으면) 문 옆 → 없으면 장터 상인
//   맡김 = 첫 누름은 물음 한 줄, 한 번 더 눌러야 맡겨짐(실수 막기 · 새 창 X) · 그날은 물뿌리개 없음(진짜 대가) · 다음 아침 우리 집 문 앞에 놓여 있음(없으면 깨자마자 손에)
//   아침 1분 안 '어제 해 둔 게 자라 있음' = 깬 자리(집 앞) 칠판 첫 줄 + 화분 모형 · 새로 연 날(접속)은 칠판이 멀면 그 줄 하나를 위 배너로 한 번
//   지키는 선: 체크리스트·%·0/3 X · 새 아이콘·칩 X · 뽑기·순위·기력 X · 돈은 GAME.spend로만(BAG[]·S.money 직접 X) · 생김은 없음(옮김만 — rwCheck 밖)
//   렉: 매 프레임 일 0 · 1초 칸(sec) = 저장 칸 몇 개 + 이웃 하트 몇 번 읽기 · 그림 = 돌아온 물뿌리개 하나(있을 때만 · 정적)
export const SPEND_V = 1;
export const CAN_UP = 8000, SEED_P = 3500, SEED_N = 6;   /* 값 근거: 하루 벌이 11~16천(GAME-3 econ_sim) · 넓은 꼭지 = 하루 반~이틀 몫 · 씨앗 한 봉지 = 하루의 22~32% */
const HW = /철물|공구/, SEEDSHOP = /종묘|씨앗|꽃집|화원|모종/;
const T = {
  seedT: ['튼튼한 씨앗 한 봉지', 'A packet of strong seeds'],
  seedW: ['여섯 번 심을 수 있어요. 고르고 튼실한 씨앗은 싹이 고르게 터서 빈 포기가 적어요. 그래서 거둘 때 하나 더 나와요.', 'Enough for six plantings. Plump, even seeds sprout evenly, so fewer gaps — you harvest one more.'],
  canT: ['물뿌리개 넓은 꼭지', 'Wide rose for the watering can'],
  canW: ['꼭지 구멍이 넓게 퍼져 있어서 물줄기가 셋으로 나뉘어요. 옆 두둑과 화분까지 한 번에 젖어요. 하루 맡기면 내일 아침 우리 집 앞에 갖다줘요.', 'The holes spread wide, so the water splits into three streams — the next beds and pots get wet in one go. Leave it for a day; it comes back to our door tomorrow morning.'],
  ask: ['한 번 더 누르면 맡겨요. 오늘은 물뿌리개 없이 지내요', 'Press once more to leave it. No watering can for today'],
};
export function createSpend(A) {
  const { map, T3 } = A, en = () => A.lang() === 'en', L = a => a[en() ? 1 : 0], won = n => (n | 0).toLocaleString('ko-KR') + (en() ? ' won' : '원');
  const St = () => { const s = A.GAME.S; let p = s.spend; if (!p || typeof p !== 'object' || p.v !== 1) p = s.spend = { v: 1, can: 0, d: 0, seed: 0, used: 0, bonus: 0, at: '' }; return p; };   /* can: 0 그냥 · 1 맡김(그날 없음) · 2 고쳐져 문 앞 · 3 넓은 꼭지 */
  const day = () => A.GAME.S.day | 0, mark = () => A.GAME.mark();
  let HOTS = [], ORCH = null, PEND = null, CANM = null, CANH = null, dead = false, loadT = 0, loadDone = false, dayT = 0, seen = null, built = false;
  const has = { hw: false, seed: false };
  // ───────── 사기·맡기기 ─────────
  function short(n) { A.say((en() ? '💰 ' + won(n - A.GAME.S.money) + ' short — sell at a market or help a worker to earn more' : '💰 ' + won(n - A.GAME.S.money) + ' 모자라요. 장터에서 팔거나 일꾼을 거들면 모여요'), 3); }
  function seedBuy() { if (!A.GAME.spend(SEED_P)) { short(SEED_P); return false; } const p = St(); p.seed += SEED_N; mark(); A.moneyPop(-SEED_P); A.sfx('tick');
    A.say((en() ? '🌱 Strong seeds — the next ' + SEED_N + ' plantings give one more each' : '🌱 튼튼한 씨앗을 샀어요. 다음 ' + SEED_N + '번 심을 때 저절로 써요'), 3); A.rec('seed'); return true; }
  function canGive(where, x, z) { const p = St(); if (p.can) return false; if (!A.GAME.spend(CAN_UP)) { short(CAN_UP); return false; } p.can = 1; p.d = day(); p.at = where; mark(); A.moneyPop(-CAN_UP); A.sfx('ding'); A.toolsSync();
    A.say((en() ? '🔧 Left the watering can. Tomorrow morning it’s at our door with a wide rose' : '🔧 물뿌리개를 맡겼어요. 내일 아침 우리 집 문 앞에 넓은 꼭지를 달아 놓아 줘요'), 3.6); A.rec('can'); void x; void z; return true; }
  /* 첫 누름 = 물음 · 8초 안에 같은 자리에서 한 번 더 = 함 */
  function ask(k, fn, msg) { const now = performance.now(); if (PEND && PEND.k === k && now - PEND.t < 8000) { PEND = null; return fn(); } PEND = { k, t: now }; if (msg) msg(); return null; }
  // ───────── 장터 창 안 한 줄(철물점·씨앗 가게가 없는 마을) ─────────
  function marketHtml() { const p = St(), e = en(), rows = []; const btn = (k, t, on) => '<button ' + (on ? '' : 'class="sub" ') + 'data-sp="' + k + '" style="min-height:34px;padding:4px 10px">' + t + '</button>';
    if (!has.seed) rows.push('<div class="st"><b class="n">🌱</b><span><b>' + L(T.seedT) + '</b>' + (p.seed ? ' <small>(' + (e ? p.seed + ' left' : p.seed + '번 남음') + ')</small>' : '') + '<br><small>' + L(T.seedW) + '</small></span>' + btn('seed', won(SEED_P), A.GAME.S.money >= SEED_P) + '</div>');
    if (!has.hw) { const ap = PEND && PEND.k === 'can:m' && performance.now() - PEND.t < 8000, st9 = p.can === 3 ? (e ? 'fitted' : '달았어요') : p.can ? (e ? 'at our door tomorrow' : '내일 아침 집 앞') : '';
      rows.push('<div class="st"><b class="n">💧</b><span><b>' + L(T.canT) + '</b><br><small>' + (ap ? '<b>' + L(T.ask) + '</b>' : L(T.canW)) + '</small></span>' + (st9 ? '<b>' + st9 + '</b>' : btn('can', ap ? (e ? 'Leave it' : '맡기기') : won(CAN_UP), A.GAME.S.money >= CAN_UP)) + '</div>'); }
    return rows.length ? '<div class="grp">' + (e ? '🧺 The stallholder also has' : '🧺 장터 상인이 함께 파는 것') + '</div>' + rows.join('') : ''; }
  function marketClick(b) { const k = b && b.dataset && b.dataset.sp; if (!k) return false; if (k === 'seed') seedBuy(); else if (k === 'can') ask('can:m', () => canGive('market'), () => A.sfx('tick')); return true; }
  // ───────── 문 옆 E(철물점 · 씨앗 가게) · ❤4 과수원 이웃 ─────────
  function hotsOff() { for (const h of HOTS) h.remove(); HOTS = []; if (ORCH) { ORCH.h.remove(); ORCH = null; } }
  function doors() { hotsOff(); has.hw = has.seed = false; if (window.SM_PROMO) return;
    for (const B9 of A.blds() || []) { const nm = B9 && B9.name; if (!nm || !B9.door) continue; const hw = HW.test(nm), sd = !hw && SEEDSHOP.test(nm); if (!hw && !sd) continue; if (hw) has.hw = true; else has.seed = true;
      const [x, z] = B9.door, h = map.interact.add({ kind: 'game', x, z, y: A.gy(x, z), r: 1.8, label: hw ? '🔧 ' + nm + (en() ? ' — leave the watering can (' + won(CAN_UP) + ')' : ' — 물뿌리개 맡기기 (' + won(CAN_UP) + ')') : '🌱 ' + nm + (en() ? ' — strong seeds (' + won(SEED_P) + ')' : ' — 튼튼한 씨앗 (' + won(SEED_P) + ')'),
        use: () => { if (hw) { const p = St(); if (p.can) { A.say(p.can === 3 ? (en() ? '💧 The wide rose is already on' : '💧 넓은 꼭지는 벌써 달았어요') : (en() ? '🔧 It comes back to our door tomorrow morning' : '🔧 내일 아침 우리 집 앞에 와요'), 2.4); return; } ask('can:' + nm, () => canGive('hw', x, z), () => A.say('🔧 ' + (en() ? 'Leave the can for a day for a wide rose? ' + won(CAN_UP) + '. It comes to our door tomorrow — press E again' : '물뿌리개를 하루 맡길까요? ' + won(CAN_UP) + '. 내일 아침 우리 집 앞에 와요. E를 한 번 더 누르면 맡겨요'), 4)); } else seedBuy(); } });
      HOTS.push(h); A.enth.push(h); } }
  /* ❤4 과수원·딸기 이웃(철물점이 없을 때 · 대표 몸만 · 1초 칸) */
  function orchSec() { if (has.hw || St().can) { if (ORCH) { ORCH.h.remove(); ORCH = null; } return; } let w = null; for (const q of A.workers() || []) { if ((q.k !== 'pear' && q.k !== 'strawberry') || q.rep === false || !q.hk) continue; if (A.GAME.hearts(q.hk) >= 4) { w = q; break; } }
    if (!w) { if (ORCH) { ORCH.h.remove(); ORCH = null; } return; } if (ORCH && ORCH.w === w) return; if (ORCH) ORCH.h.remove();
    const h = map.interact.add({ kind: 'game', x: w.x + 0.9, z: w.z, y: w.g, r: 1.6, label: en() ? '💧 Ask the orchard neighbour to fix the can (' + won(CAN_UP) + ')' : '💧 과수원 이웃에게 물뿌리개 맡기기 (' + won(CAN_UP) + ')',
      use: () => ask('can:o', () => canGive('orch', w.x, w.z), () => A.bubble({ x: w.x, y: w.g, z: w.z, sc: 1 }, en() ? 'Leave your can with me for a day? I’ll fit a wide rose and bring it to your door. Press again' : '물뿌리개를 하루 맡길래요? 넓은 꼭지를 달아서 내일 아침 집 앞에 둘게요. 한 번 더 눌러요')) });
    ORCH = { w, h }; A.enth.push(h); }
  // ───────── 아침: 고친 물뿌리개가 문 앞에 ─────────
  function canMesh() { if (CANM) return CANM; const g = new T3.Group(), mB = new T3.MeshLambertMaterial({ color: 0x3f86c6, flatShading: true }), mR = new T3.MeshLambertMaterial({ color: 0xd8dde2, flatShading: true });
    const body = new T3.Mesh(new T3.CylinderGeometry(0.13, 0.15, 0.24, 9), mB); body.position.y = 0.12;
    const sp = new T3.Mesh(new T3.CylinderGeometry(0.018, 0.028, 0.3, 6), mB); sp.position.set(0.2, 0.2, 0); sp.rotation.z = -0.95;
    const rose = new T3.Mesh(new T3.CylinderGeometry(0.075, 0.035, 0.05, 10), mR); rose.position.set(0.33, 0.3, 0); rose.rotation.z = -0.95;   /* 넓은 꼭지 = 은빛 넓은 머리 */
    const hd = new T3.Mesh(new T3.BoxGeometry(0.04, 0.16, 0.04), mB); hd.position.set(-0.16, 0.2, 0);
    g.add(body, sp, rose, hd); g.userData.mats = [mB, mR]; return (CANM = g); }
  function canPlace() { const p = St(); if (CANH) { CANH.remove(); CANH = null; } if (CANM && CANM.parent) map.remove(CANM); if (p.can !== 2 || dead) return; const H = A.home();
    if (!H || !H.gift) { p.can = 3; mark(); A.toolsSync(); return; }   /* 우리 집이 없는 마을 = 깨자마자 손에 */
    const [gx, gy, gz] = H.gift, fw = H.fw || [0, 1], x = gx - fw[1] * 0.6, z = gz + fw[0] * 0.6, y = A.gy(x, z), m = canMesh(); m.position.set(x, y, z); m.rotation.y = Math.atan2(fw[0], fw[1]) + 0.6; m.updateMatrixWorld(true); map.add(m);
    CANH = map.interact.add({ kind: 'game', x, z, y, r: 1.4, label: en() ? '💧 Pick up the fixed watering can — wide rose' : '💧 고친 물뿌리개 들기 — 넓은 꼭지', use: () => canPick() }); A.enth.push(CANH); }
  function canPick() { const p = St(); if (p.can !== 2) return; p.can = 3; mark(); canPlace(); A.toolsSync(); A.hold('can'); A.sfx('ding');
    A.banner(en() ? '💧 Wide rose fitted! Three streams reach the next beds and pots too' : '💧 넓은 꼭지를 달았어요! 물줄기 셋이 옆 두둑과 화분까지 닿아요', 3.4); A.rec('canPick'); }
  function onDay() { const p = St(); dayT = performance.now(); seen = null; PEND = null; if (p.can === 1 && day() > p.d) { p.can = 2; mark(); canPlace(); } }
  // ───────── '어제 해 둔 게 자라 있음'(1분 안) — 칠판이 보이는 자리면 칠판 · 접속 첫 1분에 칠판이 멀면 그 줄 하나를 배너로 ─────────
  const GROW = /^(pot|farm|rainw|potrain)$/;
  function growLine() { const N = A.GAME.S.news; if (!N || N.d !== day() || !Array.isArray(N.lines)) return null; return N.lines.find(q => q && GROW.test(q.k)) || null; }
  function sec(me) { if (dead || !A.on()) return; if (!built) { built = true; if (St().can === 2) canPlace(); }
    orchSec(); if (PEND && performance.now() - PEND.t > 8000) PEND = null;
    const Lg = growLine(), H = A.home(), t0 = dayT || loadT, s = (performance.now() - t0) / 1000;
    if (Lg && !seen && me && H && H.board && Math.hypot(me.x - H.board[0], me.z - H.board[2]) < 12 && s < 60) seen = { d: day(), s: +s.toFixed(1), how: 'board', t: Lg.t };
    if (!loadDone && s > 4) { loadDone = true; if (Lg && !seen && !A.busy()) { A.banner('📋 ' + (en() ? 'On our board: ' : '우리 집 칠판: ') + Lg.t, 5); seen = { d: day(), s: +s.toFixed(1), how: 'banner', t: Lg.t }; } } }
  // ───────── 심기·거두기(마을이 부름) ─────────
  function seedUse() { const p = St(); if (!(p.seed > 0)) return 0; p.seed--; p.used++; mark(); return 1; }
  function bonus(P) { if (!P || !P.q) return 0; const p = St(); p.bonus = (p.bonus | 0) + 1; mark(); return 1; }
  function seedLine() { const p = St(); return p.seed > 0 ? (en() ? '🌱 Strong seeds: used automatically (' + p.seed + ' left) — one more at harvest' : '🌱 튼튼한 씨앗을 저절로 써요(' + p.seed + '번 남음). 거둘 때 하나 더 나와요') : ''; }
  function recapLine() { const p = St(); return p.can === 1 && p.d === day() ? (en() ? '🔧 Tomorrow morning the fixed watering can comes to our door' : '🔧 내일 아침 고친 물뿌리개가 우리 집 앞에 와요') : ''; }
  function init() { if (window.SM_PROMO) return; doors(); loadT = loadT || performance.now(); built = false; if (window.SM_TOWN) window.SM_TOWN.spend = API; }
  function dispose() { dead = true; hotsOff(); if (CANH) { CANH.remove(); CANH = null; } if (CANM) { if (CANM.parent) map.remove(CANM); CANM.traverse(o => { if (o.geometry) o.geometry.dispose(); }); for (const m of CANM.userData.mats) m.dispose(); CANM = null; } }
  const API = { info: () => { const p = St(); return { ...p, wide: p.can === 3, away: p.can === 1 || p.can === 2, has: { ...has }, orch: !!ORCH, door: !!CANH, seen: seen ? { ...seen } : null, grow: (growLine() || {}).t || '', potN: A.potN ? A.potN() : 0 }; },
    seedBuy: () => seedBuy(), canGive: () => ask('can:t', () => canGive('test'), null), canPick: () => canPick(), market: () => marketHtml(), seen: () => seen, resetSeen: () => { seen = null; loadDone = false; loadT = performance.now(); } };
  return { init, dispose, sec, onDay, marketHtml, marketClick, seedUse, bonus, seedLine, recapLine, wide: () => St().can === 3, away: () => St().can === 1 || St().can === 2, api: API };
}
