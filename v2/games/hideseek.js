// 숨바꼭질 대작전(HS-1 · 10-04 사용자 '추천으로 — 기존 숨바는 무시') — 비대칭 숨바꼭질 혼자 + 봇 시제품(예전 숨바꼭질 10-03 삭제와 따로)
//   🙈 숨는 쪽 = 하늘에서 내려다봄(map.top 따라가기 · 보이는 반지름 밖은 어둡게) · WASD/화살표 걷기(이 화면 위쪽 = W) 또는 땅을 톡 = 그곳까지 걸어감
//     · Shift 달리기(소리 큼) · C 웅크리기(조용) · F/👻 = 3초 투명(술래 시야에서 사라짐 — 1.3m 안이면 들킴 · 다시 쓰기 20초) → 술래 로봇을 피해 90초 버티기
//     술래 로봇 = 엔진 chaser(바닥 부채꼴 = 시야 · 소리를 들음) · 4초마다 내 근처를 뒤지러 옴 · 45초에 하나 더
//   👀 술래 = 3인칭 · 빠른 몸(1.3배) · 숨은 유령 셋(가까이 가면 도망 · 닿으면 찾음) · F/📡 레이더 = 3초 동안 미니맵에 유령 자리(다시 15초) → 120초 안에 셋 다
//   경기장 = 학교 1층 실내 + 가운데 마당(계단·2층·바깥 제외 — 나가면 마지막 자리로) · 기록 = map.store 'bestHide'(버틴 초) · 'bestSeek'(셋 다 찾은 초)
//   사람(NPC)은 술래·과녁이 아니다 — 술래는 로봇, 숨는 것은 유령(엔진 chaser 모양)
export const meta = { id: 'hideseek', title: '숨바꼭질 대작전', api: 1 };

const HIDE_T = 90, SEEK_T = 120, VIS = 13, INV_T = 3, INV_CD = 20, RAD_T = 3, RAD_CD = 15;
const okZone = z => !!z && z.floor === 1 && (z.indoor ? !/계단|체육관|버스/.test(z.label) : z.label === '가운데 마당');   // 경기장 구역

export default async function start(map, params = {}) {
  map.player.freeze(true);
  const bn = map.hud.banner('술래 로봇 깨우는 중…', 30);
  const nav = await map.nav();
  if (bn) bn.remove();
  let safe = null, outT = 0, chk = 0;   // 경기장 밖(계단·바깥) = 마지막 안전한 자리로
  const rng = Math.random;
  const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches || document.body.classList.contains('touch'); } catch (e) { return false; } })();
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  // 경기장 안 걷는 칸 하나(무작위 · 멀리 떨어진 곳)
  function spot(far = []) {
    for (let k = 0; k < 60; k++) {
      const p = nav.random({ floor: 1, indoor: true, farFrom: k < 45 ? far : [], rng });
      if (p && p[1] < 0.6 && okZone(map.zoneAt(p[0], p[1], p[2]))) return p;
    }
    return null;
  }
  const snapIn = (x, y, z) => { const i = nav.snap(x, y, z, 2.5); if (i < 0) return null; const p = nav.pos(i); return p[1] < 0.6 && okZone(nav.zoneOf(i)) ? p : null; };
  function arenaTick(dt) {   // 5Hz
    if ((chk -= dt) > 0) return; chk = 0.2;
    const me = map.player.get(), ok = me.y < 0.9 && okZone(map.zoneAt(me.x, me.y, me.z));
    if (ok) { outT = 0; safe = [me.x, me.y, me.z]; return; }
    if ((outT += 0.2) > 0.3 && safe) { outT = 0; clearRoute(); map.player.teleport(safe); map.hud.toast('숨바꼭질은 1층 안(교실·복도·가운데 마당)에서만 해요'); }
  }

  // ---------- 둥근 기술 단추(👻 / 📡) — 모든 기기(하늘에서 보기는 마우스가 자유) ----------
  const btn = document.createElement('div'); btn.className = 'hs-btn';
  btn.style.cssText = 'position:fixed;right:calc(22px + env(safe-area-inset-right));bottom:calc(22px + env(safe-area-inset-bottom));width:78px;height:78px;border-radius:50%;z-index:24;display:none;flex-direction:column;align-items:center;justify-content:center;'
    + 'font:800 12px/1.1 system-ui,-apple-system,"Malgun Gothic",sans-serif;color:#fff;background:rgba(124,92,214,.9);border:3px solid rgba(255,255,255,.9);box-shadow:0 3px 0 rgba(0,0,0,.2);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer';
  btn.innerHTML = '<b style="font-size:30px;line-height:1">👻</b><span></span>';
  btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); skill(); });
  document.body.appendChild(btn);
  let btnK = '', chipK = '', foundK = '';
  const paintBtn = (icon, txt, ready) => { const k = icon + txt + ready; if (k === btnK) return; btnK = k; btn.firstChild.textContent = icon; btn.lastChild.textContent = txt; btn.style.opacity = ready ? '1' : '.55'; };
  const chip = t => { if (t === chipK) return; chipK = t; map.hud.chip('hs-time', t); };   // 휴대폰 가로는 칩 글을 줄이므로(shortChip) 시간·찾은 수는 칩 둘로
  const chipF = t => { if (t === foundK) return; foundK = t; map.hud.chip('hs-found', t); };
  const place = mode => { const lo = coarse && mode === 'seek';   // 3인칭 터치 = 물총 💧 자리(행동 버튼 위) · 그 밖 = 오른쪽 아래 칩 위
    btn.style.right = 'calc(' + (lo ? 196 : 22) + 'px + env(safe-area-inset-right))'; btn.style.bottom = 'calc(' + (lo ? 100 : coarse ? 24 : 96) + 'px + env(safe-area-inset-bottom))'; };

  // ---------- 상태 ----------
  let G = null;   // 한 판: { mode, t, bots|ghosts, … }
  let route = null, ri = 0, routeMk = null, stuckT = 0, lastD = 1e9;
  const keyF = e => { if (!G || G.over || e.repeat) return; if (e.code === 'KeyF') { e.preventDefault(); skill(); } };
  addEventListener('keydown', keyF);

  function clearRoute() { route = null; if (routeMk) { routeMk.remove(); routeMk = null; } map.player.steer(null); }
  function walkTo(pt) {   // 숨는 쪽: 땅 톡 = 그곳까지 걷기(키를 누르면 키가 먼저)
    if (!G || G.over) return;
    const me = map.player.get(), to = snapIn(pt.x, pt.y, pt.z);
    if (!to) { map.hud.toast('거기는 갈 수 없어요'); return; }
    const r = nav.path([me.x, me.y, me.z], to);
    if (!r.ok || r.pts.length < 2) { map.hud.toast('거기는 갈 수 없어요'); return; }
    clearRoute(); route = r.pts; ri = 1; stuckT = 0; lastD = 1e9;
    routeMk = map.mk.trail(route.map(p => [p[0], p[1] + 0.05, p[2]]), { color: 0x7c5cd6 });
  }
  function routeTick(dt) {
    if (!route) return;
    const me = map.player.get();
    while (ri < route.length && Math.hypot(route[ri][0] - me.x, route[ri][2] - me.z) < 0.45) ri++;
    if (ri >= route.length) { clearRoute(); return; }
    const p = route[ri], d = Math.hypot(p[0] - me.x, p[2] - me.z);
    if (d < lastD - 0.05) { lastD = d; stuckT = 0; } else if ((stuckT += dt) > 1.5) { clearRoute(); return; }   // 막히면 멈춤(다시 톡)
    map.player.steer(p[0] - me.x, p[2] - me.z, 4.2, false);
  }

  // ---------- 🙈 숨는 쪽 ----------
  function startHide() {
    const me0 = spot([]); if (me0) map.player.teleport(me0);
    const me = map.player.get();
    G = { mode: 'hide', t: 0, over: false, bots: [], hunt: 0, inv: 0, cd: 0, count: 5, second: false };
    map.player.freeze(false); map.player.speed(1);
    map.top.enter({ follow: true, playerKeys: true, vision: VIS, bar: false, floor: 1, d: 30, floorKeys: false,
      help: coarse ? '땅을 톡 = 그곳으로 걷기 · 👻 = 3초 투명 · 두 손가락 = 확대' : 'WASD 걷기 · Shift 달리기(시끄러워요) · C 웅크리기(조용) · F 👻 투명 · 땅 클릭 = 그곳으로',
      onTap: walkTo, onExit: askQuit });
    addBot(spot([{ x: me.x, z: me.z, r: 22 }]) || spot([{ x: me.x, z: me.z, r: 12 }]));
    map.hud.goal('🙈 술래 로봇을 피해 ' + HIDE_T + '초 버티기');
    place('hide'); btn.style.display = 'flex'; paintHide();
    map.hud.banner('🤖 술래 로봇이 다섯을 세요 — 어서 숨어요!', 2.2);
  }
  function addBot(p) {
    if (!p) return;
    const b = map.chaser.spawn({ kind: 'robot', at: p, speed: G.second ? 2.9 : 2.6, chase: 5.0, fov: 100, range: 9, hear: 1, onCatch: () => endHide(false) });
    if (!b) return;
    b.setPath([p]); if (G.count > 0) b.pause(true);
    G.bots.push(b);
  }
  function hunt() {   // 술래 로봇: 순찰 중이면 내 근처 한 곳을 뒤지러 감(시간이 갈수록 가까이)
    const me = map.player.get(), R = Math.max(3.5, 10 - G.t * 0.07);
    for (const b of G.bots) {
      if (b.state !== 'patrol') continue;
      let to = null;
      for (let k = 0; k < 10 && !to; k++) { const a = rng() * Math.PI * 2, r = R * (0.5 + rng() * 0.5); to = snapIn(me.x + Math.cos(a) * r, me.y, me.z + Math.sin(a) * r); }
      b.setPath([to || [me.x, me.y, me.z]]);
    }
  }
  function paintHide() {
    if (!G || G.mode !== 'hide') return;
    if (G.inv > 0) paintBtn('👻', '투명 ' + Math.ceil(G.inv), true);
    else if (G.cd > 0) paintBtn('👻', Math.ceil(G.cd) + '초', false);
    else paintBtn('👻', coarse ? '투명' : '투명 F', true);
    chip('⏱ ' + fmt(Math.max(0, HIDE_T - G.t)));
  }
  function tickHide(dt) {
    routeTick(dt);
    if (G.count > 0) {   // 다섯 세기
      const c0 = Math.ceil(G.count); G.count -= dt; const c1 = Math.ceil(G.count);
      if (c1 !== c0 && c1 > 0) { map.hud.banner('🤖 ' + c1 + '…', 0.8); map.tone(523, 0, 0.12, 'sine', 0.08); }
      if (G.count <= 0) { G.bots.forEach(b => b.pause(false)); map.hud.banner('🤖 찾는다!', 1.2); map.tone(784, 0, 0.18, 'square', 0.06); hunt(); }
      paintHide(); return;
    }
    G.t += dt;
    if (G.inv > 0 && (G.inv -= dt) <= 0) { G.inv = 0; map.player.invisible(false); G.cd = INV_CD; map.tone(392, 0, 0.15, 'sine', 0.08); }
    else if (G.cd > 0) G.cd = Math.max(0, G.cd - dt);
    if ((G.hunt -= dt) <= 0) { G.hunt = 4; hunt(); }
    if (!G.second && G.t >= HIDE_T / 2) { G.second = true; const me = map.player.get(); addBot(spot([{ x: me.x, z: me.z, r: 20 }])); map.hud.banner('🤖 술래 로봇이 하나 더!', 1.8); map.tone(660, 0, 0.12, 'square', 0.06); map.tone(880, 0.12, 0.16, 'square', 0.06); }
    if (G.t >= HIDE_T) { endHide(true); return; }
    paintHide();
  }
  function skill() {
    if (!G || G.over) return;
    if (G.mode === 'hide') {
      if (G.count > 0 || G.inv > 0 || G.cd > 0) return;
      G.inv = INV_T; map.player.invisible(true); map.tone(880, 0, 0.1, 'sine', 0.07); map.tone(1320, 0.08, 0.2, 'sine', 0.06); paintHide();
    } else {
      if (G.cd > 0 || G.rad > 0) return;
      G.rad = RAD_T; radarMarks(); map.tone(988, 0, 0.08, 'sine', 0.07); map.tone(988, 0.16, 0.08, 'sine', 0.07); paintSeek();
    }
  }
  function endHide(win) {
    if (G.over) return; G.over = true;
    const t = Math.min(HIDE_T, G.t), best = map.store.get('bestHide', 0), rec = t > best + 0.05;
    if (rec) map.store.set('bestHide', Math.round(t));
    if (win) { map.tone(523, 0, 0.15, 'sine', 0.1); map.tone(659, 0.15, 0.15, 'sine', 0.1); map.tone(784, 0.3, 0.3, 'sine', 0.1); }
    finish(win ? '🎉 끝까지 숨었어요!\n' + HIDE_T + '초 동안 술래 로봇에게 안 잡혔어요'
      : '💥 잡혔어요!\n버틴 시간 ' + fmt(t) + (rec ? ' — 🏅 새 기록!' : best ? ' (최고 ' + fmt(best) + ')' : '') + '\n💡 로봇 앞 노란 부채꼴이 로봇 눈이에요 — 빨개지면 들킨 것 · 👻 투명으로 빠져나가요');
  }

  // ---------- 👀 술래 ----------
  function startSeek() {
    G = { mode: 'seek', t: 0, over: false, ghosts: [], found: 0, rad: 0, cd: 0, sense: 0, near: 0 };
    const me0 = spot([]); if (me0) map.player.teleport(me0);
    const me = map.player.get(), far = [{ x: me.x, z: me.z, r: 16 }];
    for (let k = 0; k < 3; k++) {
      const p = spot(far); if (!p) continue; far.push({ x: p[0], z: p[2], r: 12 });
      const g = map.chaser.spawn({ kind: 'ghost', at: p, speed: 3.4, chase: 3.4, fov: 1, range: 0.01, hear: 0, showFov: false });
      if (g) { g.setPath([p]); G.ghosts.push({ h: g, flee: 0 }); }
    }
    map.player.freeze(false); map.player.speed(1.3);
    map.hud.goal('👀 숨은 유령 ' + (['', '하나를', '둘을', '셋을'][G.ghosts.length] || G.ghosts.length + '을') + ' 찾아라!');
    map.minimap.show({});
    place('seek'); btn.style.display = 'flex'; paintSeek();
    map.hud.banner('👻 유령 셋이 1층 어딘가에 숨었어요 — 닿으면 찾아요!', 2.4);
  }
  function radarMarks() {
    const L = G.ghosts.filter(g => g.h.state != null && !g.done).map(g => { const p = g.h.pos; return { x: p.x, z: p.z, color: '#b48cff', shape: 'star', blink: true }; });
    map.minimap.setMarks(L); map.minimap.show({});
  }
  function paintSeek() {
    if (!G || G.mode !== 'seek') return;
    if (G.rad > 0) paintBtn('📡', '레이더 ' + Math.ceil(G.rad), true);
    else if (G.cd > 0) paintBtn('📡', Math.ceil(G.cd) + '초', false);
    else paintBtn('📡', coarse ? '레이더' : '레이더 F', true);
    chip('⏱ ' + fmt(Math.max(0, SEEK_T - G.t))); chipF('👻 ' + G.found + '/' + G.ghosts.length);
  }
  function tickSeek(dt) {
    G.t += dt;
    if (G.rad > 0 && (G.rad -= dt) <= 0) { G.rad = 0; G.cd = RAD_CD; map.minimap.setMarks([]); }
    else if (G.cd > 0) G.cd = Math.max(0, G.cd - dt);
    if ((G.sense -= dt) <= 0) {   // 5Hz: 닿음 · 도망 · 가까움 소리
      G.sense = 0.2;
      const me = map.player.get(); let nearest = 1e9;
      for (const g of G.ghosts) {
        if (g.done) continue;
        const p = g.h.pos, d = Math.hypot(p.x - me.x, p.z - me.z); nearest = Math.min(nearest, d);
        if (d < 1.6 && Math.abs(p.y - me.y) < 1.6) { found(g); continue; }
        if (g.flee > 0) { g.flee -= 0.2; continue; }
        if (d < 7 && map.see({ x: p.x, y: p.y + 1.1, z: p.z, h: 0 }, 'player', 360, 7)) flee(g, p, me);
      }
      if (nearest < 9 && (G.near -= 0.2) <= 0) { G.near = nearest < 4.5 ? 1.2 : 2.4; map.tone(nearest < 4.5 ? 1046 : 784, 0, 0.07, 'triangle', 0.05); }   // 가까울수록 자주 '뿅'
      if (G.rad > 0) radarMarks();
    }
    if (G.found >= G.ghosts.length) { endSeek(true); return; }
    if (G.t >= SEEK_T) { endSeek(false); return; }
    paintSeek();
  }
  function flee(g, p, me) {   // 나와 반대쪽 10~14m 걷는 칸으로
    const ax = p.x - me.x, az = p.z - me.z, a0 = Math.atan2(az, ax);
    for (let k = 0; k < 12; k++) { const a = a0 + (rng() - 0.5) * 2.1, r = 10 + rng() * 4, to = snapIn(p.x + Math.cos(a) * r, p.y, p.z + Math.sin(a) * r);
      if (to) { g.h.setPath([to]); g.flee = 3.5; map.tone(1318, 0, 0.06, 'sine', 0.04); return; } }
    g.flee = 1;
  }
  function found(g) {
    g.done = true; g.h.remove(); G.found++;
    map.tone(784, 0, 0.1, 'sine', 0.1); map.tone(1046, 0.1, 0.18, 'sine', 0.1);
    map.hud.banner('👻 찾았다! ' + G.found + '/' + G.ghosts.length, 1.4);
    if (G.rad > 0) radarMarks();
  }
  function endSeek(win) {
    if (G.over) return; G.over = true;
    const best = map.store.get('bestSeek', null), rec = win && (best == null || G.t < best);
    if (rec) map.store.set('bestSeek', Math.round(G.t));
    finish(win ? '🎉 유령을 모두 찾았어요!\n걸린 시간 ' + fmt(G.t) + (rec ? ' — 🏅 새 기록!' : best != null ? ' (최고 ' + fmt(best) + ')' : '')
      : '⏰ 시간이 다 됐어요!\n찾은 유령 ' + G.found + '/' + G.ghosts.length + '\n💡 📡 레이더로 미니맵을 보고 · 가까우면 뿅 소리가 빨라져요');
  }

  // ---------- 판 끝 · 다시 ----------
  function cleanup() {
    clearRoute(); map.player.invisible(false); map.player.speed(1); map.hud.goal(null); map.hud.chip('hs-time', null); map.hud.chip('hs-found', null); chipK = foundK = btnK = '';
    if (map.top.on) map.top.exit();
    if (G) { (G.bots || []).forEach(b => b.remove()); (G.ghosts || []).forEach(g => { if (!g.done) g.h.remove(); }); }
    map.minimap.setMarks([]); map.minimap.hide(); btn.style.display = 'none';
  }
  async function finish(text) {
    const mode = G.mode; cleanup();
    const i = await map.hud.ask(text, ['🔄 다시 하기', mode === 'hide' ? '👀 술래 해 보기' : '🙈 숨는 쪽 해 보기', '🏠 그만하기']);
    if (i === 0) begin(mode); else if (i === 1) begin(mode === 'hide' ? 'seek' : 'hide'); else if (i === 2) map.quit();
  }
  async function askQuit() {
    if (!G || G.over) return;
    const i = await map.hud.ask('숨바꼭질을 그만할까요?', ['▶ 계속하기', '🏠 그만하기']);
    if (i === 1) map.quit();
  }
  function begin(mode) { G = null; safe = null; outT = 0; if (mode === 'seek') startSeek(); else startHide(); }

  let mode = params.mode === 'seek' ? 'seek' : params.mode === 'hide' ? 'hide' : null;
  if (!mode) {
    const i = await map.hud.ask('🫣 숨바꼭질 대작전\n누가 될래요?', ['🙈 숨는 쪽 — 하늘에서 보며 술래 로봇을 피해 ' + HIDE_T + '초 버티기', '👀 술래 — 숨은 유령 셋을 ' + SEEK_T + '초 안에 찾기']);
    if (i < 0) return { stop() { removeEventListener('keydown', keyF); btn.remove(); } };
    mode = i === 1 ? 'seek' : 'hide';
  }
  begin(mode);

  return {
    tick(dt) { if (!G || G.over) return; arenaTick(dt); if (G.mode === 'hide') tickHide(dt); else tickSeek(dt); },
    stop() { removeEventListener('keydown', keyF); clearRoute(); map.player.invisible(false); btn.remove(); G = null; },
    get state() { return G ? { mode: G.mode, t: G.t, over: G.over, inv: G.inv, cd: G.cd, rad: G.rad, found: G.found, bots: G.bots ? G.bots.map(b => ({ st: b.state, ...b.pos })) : null, ghosts: G.ghosts ? G.ghosts.map(g => ({ done: !!g.done, ...g.h.pos })) : null } : null; },
  };
}
