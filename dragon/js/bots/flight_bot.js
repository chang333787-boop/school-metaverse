// 비행·배 봇(design §13) — DRG.sense()(화면에 보이는 것)만 읽고 B.press/B.release만 누름 · 상태 직접 쓰기·순간이동 X
// 반응 늦음: 쉬움 0.6초 · 보통 0.35초(그만큼 지난 화면을 보고 지금 누름 · 움직임은 그 사이만큼 내다봄) · 동시 키 셋 이하 · 초당 6타 상한
// 쓰는 법: DRG.bot.run(flyBot('easy')) · flyBot('normal') · flyBot('idle'|'mash'|'left') · flyBot('stall')(시험: 날갯짓 없이 떨어졌다 창에서 다시 붙기) · DRG.bot.run(boatBot('beat'|'mash'|'idle'))
const DT = 1 / 60;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/* 키 관리 — 누른 키 셋 이하 · 톡 치기는 초당 여섯 번까지(1초 창) */
function keys(B) {
  const held = new Set(), taps = [], ups = [];
  const K = {
    hold(code, on, n) {
      if (on && !held.has(code)) {
        if (held.size >= 3) return false;
        if (n != null) { while (taps.length && taps[0] <= n - 60) taps.shift(); if (taps.length >= 6) return false; taps.push(n); }   // 누름도 초당 여섯 번 안에 셈
        B.press(code); held.add(code);
      }
      else if (!on && held.has(code)) { B.release(code); held.delete(code); }
      return true;
    },
    tap(n, code) {
      while (taps.length && taps[0] <= n - 60) taps.shift();
      if (taps.length >= 6 || held.has(code) || held.size >= 3) return false;
      B.press(code); held.add(code); ups.push([n + 2, code]); taps.push(n); return true;
    },
    tick(n) { for (let i = ups.length - 1; i >= 0; i--) if (ups[i][0] <= n) { B.release(ups[i][1]); held.delete(ups[i][1]); ups.splice(i, 1); } },
    clear() { for (const c of held) B.release(c); held.clear(); ups.length = 0; },
    held,
  };
  return K;
}

export function flyBot(level = 'normal') {
  const kind = level === 'idle' || level === 'mash' || level === 'left' ? level : 'play';
  const noFlap = level === 'stall';                                          // 시험용: 날갯짓 안 함(실속으로 떨어짐) · 떨어지면 창에서 Space
  const easy = level === 'easy', delay = Math.round((easy ? 0.6 : 0.35) / DT), dl = delay * DT;
  const hist = [];
  let K = null, n0 = -1, lastFlap = -999, lastTail = -999, lastGrab = -999, spaceHeld = false, prevG = null, seenGate = -1;
  return (n, B) => {
    if (!K) K = keys(B);
    K.tick(n);
    const cur = window.DRG.sense(); if (!cur) return;
    if (n0 < 0) { n0 = n; K.tap(n, 'KeyQ'); return; }                  // 아무 키 = 출발(놀이 키 아님)
    if (cur.done) { K.clear(); return false; }
    if (kind === 'idle') return;
    if (kind === 'mash') { if ((n - n0) % 10 === 0) K.tap(n, 'Space'); return; }
    if (kind === 'left') { K.hold('ArrowLeft', true); return; }

    hist.push(cur); if (hist.length > delay + 8) hist.shift();
    if (hist.length <= delay) return;
    const s = hist[hist.length - 1 - delay], sb = hist[Math.max(0, hist.length - 1 - delay - 6)];   // 보인 화면(늦게) · 그 조금 앞
    if (s.fallen) {
      K.hold('ArrowLeft', false); K.hold('ArrowRight', false); K.hold('ArrowUp', false); K.hold('ArrowDown', false); if (spaceHeld) { K.hold('Space', false); spaceHeld = false; }
      if (!easy && s.grab && n - lastGrab > 40) { if (K.tap(n, 'Space')) lastGrab = n; }   // 가까워진 박자에 Space
      return;
    }
    const g = s.next[0]; if (!g) { K.clear(); return; }
    if (s.gate !== seenGate) { if (seenGate >= 0 && hist.length > delay + 1) prevG = hist[hist.length - 2 - delay].next[0] || prevG; seenGate = s.gate; }   // 지난 관문 자리(본 것)를 기억
    /* 그 사이 움직임을 내다봄(반응 늦음 보정 — 사람도 하는 것) */
    const yr = wrap(s.yaw - sb.yaw) / (6 * DT);
    const px = s.x + s.vx * dl, py = s.y + s.vy * dl, pz = s.z + s.vz * dl, pyaw = s.yaw + yr * dl * 0.8;
    /* 관문 면에 줄 맞춰 들어감: 관문 앞쪽(지난 관문 → 이 관문 → 다음 관문의 방향)으로 조금 물러난 점을 보다가 가까워지면 가운데 */
    const dg = Math.hypot(g.x - px, g.z - pz), n2 = s.next[1], a0 = prevG || { x: px, z: pz };
    let nx = g.x - a0.x, nz = g.z - a0.z; const l0 = Math.hypot(nx, nz) || 1; nx /= l0; nz /= l0;
    if (n2) { const l1 = Math.hypot(n2.x - g.x, n2.z - g.z) || 1; nx += (n2.x - g.x) / l1; nz += (n2.z - g.z) / l1; const l2 = Math.hypot(nx, nz) || 1; nx /= l2; nz /= l2; }
    const back = Math.min(22, dg * 0.3) * (dg > 7 ? 1 : 0);
    let ax = g.x - nx * back, ay = g.y, az = g.z - nz * back;
    if (dg < 7) { ax = g.x + nx * 25; az = g.z + nz * 25; }                  // 거의 다 왔으면 지나서 쭉
    /* 지나쳐 버렸으면(관문이 뒤 · 가까움) 앞쪽으로 크게 물러났다가 다시 */
    const along = (px - g.x) * nx + (pz - g.z) * nz;
    if (along > 4 && dg < 60) { ax = g.x - nx * 70; az = g.z - nz * 70; }
    const want = Math.atan2(ax - px, az - pz), err = wrap(want - pyaw);
    /* 작은 오차는 톡톡(4박자 창 안에서 오차만큼 누름) · 큰 오차는 꾹 */
    const pwm = (e, dead, big) => { const a = Math.abs(e); if (a < dead) return 0; if (a > big) return Math.sign(e); return ((n - n0) % 20) / 20 < (a - dead) / (big - dead) ? Math.sign(e) : 0; };
    const st = pwm(err, easy ? 0.06 : 0.04, easy ? 0.4 : 0.3);
    K.hold('ArrowLeft', st > 0, n); K.hold('ArrowRight', st < 0, n);
    const dy = ay - py - s.vy * 0.8;                                         // 위아래 = 넘으면 꾹 · 거의 맞으면 뗌(누름 수 아낌)
    if (dy > 2) K.hold('ArrowUp', true, n); else if (dy < 0.5) K.hold('ArrowUp', false);
    if (dy < -2) K.hold('ArrowDown', true, n); else if (dy > -0.5) K.hold('ArrowDown', false);
    /* 다음 관문에서 도는 쪽 — 쪽지가 있으면 쪽지대로 · 없으면 감으로(관문 → 그다음 방향) */
    let tl = 1;
    if (s.note) tl = s.note[0];
    else if (n2) { const a = prevG || { x: px, z: pz }, t = wrap(Math.atan2(n2.x - g.x, n2.z - g.z) - Math.atan2(g.x - a.x, g.z - a.z)); tl = Math.abs(t) > 1.35 ? 4 : t > 0.45 ? 2 : t < -0.45 ? 3 : 1; }
    if (Math.abs(err) > 0.7 && dg > 30) tl = err > 0 ? 2 : 3;                // 크게 돌아야 하면 도는 쪽 꼬리
    if (tl === 4 && dg > 45) tl = err > 0.2 ? 2 : err < -0.2 ? 3 : 1;         // 브레이크는 관문 가까이서만
    if (easy) {
      const sp = (tl !== 1 && dg < 45 && Math.abs(err) > 0.12) || Math.abs(err) > 0.6;
      if (sp !== spaceHeld && K.hold('Space', sp, n)) spaceHeld = sp;
      return;
    }
    if (s.tail !== tl && n - lastTail > 20 && dg < 70) { if (K.tap(n, 'Digit' + tl)) lastTail = n; }
    /* 날갯짓 — 날개가 다 올라간 박자(봤거나 박자로 내다봄) · 너무 빠르면 쉼 */
    const vt = tl === 4 && dg < 45 ? 22 : 29;
    const since = (n - lastFlap) * DT;
    if (!noFlap && s.speed < vt && since > 0.3 && (since > 0.74 && since < 0.92 || (s.wingsUp && since > 1.2) || since > 1.6)) { if (K.tap(n, 'Space')) lastFlap = n; }
  };
}

/* 배 봇 — beat: 노가 물에 들어가는 박자(박자를 세어 내다봄)에 Space · 물결은 옆으로 피함 / mash: 연타 / idle: 가만히 */
export function boatBot(kind = 'beat', level = 'normal') {
  const delay = Math.round((level === 'easy' ? 0.6 : 0.35) / DT), hist = [];
  let K = null, n0 = -1, lastPress = -1;
  return (n, B) => {
    if (!K) K = keys(B);
    K.tick(n);
    const cur = window.DRG.sense(); if (!cur) return;
    if (n0 < 0) { n0 = n; K.tap(n, 'KeyQ'); return; }
    if (cur.arrived) { K.clear(); return false; }
    if (kind === 'idle') return;
    if (kind === 'mash') { if ((n - n0) % 10 === 0) K.tap(n, 'Space'); return; }
    hist.push(cur); if (hist.length > delay + 2) hist.shift();
    if (hist.length <= delay) return;
    const s = hist[hist.length - 1 - delay];
    if (lastPress < 0) { if (s.ready && K.tap(n, 'Space')) lastPress = n; }
    else if (s.oar === 'tangle') lastPress = -1;
    else if ((n - lastPress) * DT >= 1.28) { if (K.tap(n, 'Space')) lastPress = n; }
    const w = s.wave; let side = 0;
    if (w && w.ds < 16 && w.ds > -1 && Math.abs(s.lat - w.lat) < 3.2) side = s.lat >= w.lat ? 1 : -1;
    K.hold('ArrowLeft', side > 0); K.hold('ArrowRight', side < 0);
  };
}
