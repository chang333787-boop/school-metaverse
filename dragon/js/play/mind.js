// 드래곤 마음 엔진(design §3-1) — 두려움·믿음·배고픔·호기심·화(0~1) · 10Hz(드래곤마다 걸음을 엇갈려) · 공격 예고 시계만 60Hz
// 입력 = 플레이어 몸짓(거리·다가가는 속도·살금살금·무기·눈 맞춤·손 내밀기·내민 것) + 사건(큰 소리·빛 점·턱 긁기·풀)
// 출력 = ① 행동(beh) ② 보이는 신호 값(sig → dragon_rig 자세 함수) — 머리 위 막대 없음 · 마음 값이 곧 자세
// 매 걸음 new 없음 · 반응 표 = design §3-1 표(근거 r2 D·F-2)

/* 종 성격 — space = 편한 거리(m) · shy = 겁 많음 · temper = 화 잘 냄 · likes/hates · warn = 공격 예고 신호 · shots = 쏘는 수(그롱클 6) */
export const SPECIES = {
  nightfury: { space: 5, shy: 0.7, temper: 0.35, see: 30, fov: 1.2, likes: { cod: 1, salmon: 1, nip: 1, chin: 1, light: 1 }, hates: { eel: 1, blade: 1 }, warn: 'crouch', gap: 1.2 },
  gronckle:  { space: 4, shy: 0.3, temper: 0.5, see: 18, fov: 1.4, likes: { nip: 1, cod: 0.4 }, hates: {}, warn: 'puff', shots: 6, gap: 1.3 },
  nadder:    { space: 5, shy: 0.4, temper: 0.6, see: 24, fov: 1.1, blind: 0.35, likes: { chin: 1, cod: 0.5 }, hates: {}, warn: 'spines', gap: 1.0 },
  zippleback:{ space: 6, shy: 0.5, temper: 0.5, see: 20, fov: 1.5, likes: { cod: 0.4 }, hates: { eel: 1 }, warn: 'gas', gap: 1.4 },
  nightmare: { space: 7, shy: 0.25, temper: 0.8, see: 26, fov: 1.3, likes: { cod: 0.3 }, hates: { loud: 1 }, warn: 'blaze', gap: 1.0 },
  terror:    { space: 2.5, shy: 0.8, temper: 0.3, see: 14, fov: 1.6, likes: { cod: 1, salmon: 1, light: 1 }, hates: {}, warn: 'crouch', gap: 1.5 },
};

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* m = createMind('nightfury', { fear, trust, hunger, curious, anger }) */
export function createMind(kind, init = {}) {
  const S = SPECIES[kind] || SPECIES.nightfury;
  const M = {
    kind, S, fear: 0.5, trust: 0, hunger: 0.5, curious: 0.3, anger: 0, ...init,
    beh: 'idle', behT: 0,            // 행동 · 그 행동을 한 시간
    sees: false, eye: false,          // 플레이어를 보나 · 눈이 마주쳤나
    warnT: 0, gapT: 0,                // 공격 예고 남은 시간(60Hz) · 공격 뒤 틈 남은 시간
    sig: { pupil: 0.5, ear: 0, crouch: 0, teeth: 0, tailCurl: 0, look: 0, headUp: 0, jaw: 0, sniff: 0, tilt: 0 },
    last: { offer: null, loud: 0 }, acc: 0, phase: 0, calmT: 0, events: [],
    lock: null,                       // 장이 잠깐 행동을 정함(예: '묶임') — 정해진 동안 beh는 그대로
  };
  /* 사건 넣기: 'loud'(방패·철창) · 'offer'(item) · 'chin' · 'nip' · 'light' · 'drop'(무기 내려놓음) · 'apology' · 'hit'(맞음) */
  M.event = (type, v) => { if (M.events.length < 8) M.events.push(type, v); };
  /* p = 플레이어 감각(장이 매 걸음 채움): { d 거리, close 다가오는 속도(m/s · +가 가까워짐), low 살금, weapon 무기 듦, facing 플레이어가 나를 보나, reach 손 내밂(고개 돌림), still 멈춤, dragonFacing 내가 플레이어 쪽을 보나(0~1) } */
  M.tick = (dt, p) => {
    /* 60Hz: 공격 예고·틈 시계 */
    if (M.warnT > 0) { M.warnT -= dt; if (M.warnT <= 0) { M.warnT = 0; M.beh = 'attack'; M.behT = 0; M.events.length < 8 && M.events.push('fire', 0); } }
    if (M.gapT > 0) M.gapT -= dt;
    M.behT += dt;
    M.acc += dt; if (M.acc < 0.1) return; const h = M.acc; M.acc = 0;   // 아래는 10Hz
    const sp = M.S;
    M.sees = p.d < sp.see && p.dragonFacing > Math.cos(sp.fov) && !(sp.blind && p.blindSpot);
    M.eye = M.sees && p.facing && !p.reach && p.d < 14;
    /* 사건 */
    for (let i = 0; i < M.events.length; i += 2) {
      const t = M.events[i], v = M.events[i + 1];
      if (t === 'loud') { M.fear = clamp(M.fear + 0.25 * sp.shy + 0.1); M.anger = clamp(M.anger + 0.2 + (sp.hates.loud ? 0.4 : 0)); M.last.loud = 1; }
      else if (t === 'offer') {
        M.last.offer = v;
        if (sp.hates[v]) { M.fear = clamp(M.fear + 0.7); M.beh = 'flee'; M.behT = 0; }
        else if (sp.likes[v] && M.fear < 0.65) { M.hunger = clamp(M.hunger - 0.45); M.trust = clamp(M.trust + 0.22 * sp.likes[v]); M.fear = clamp(M.fear - 0.15); }
      }
      else if (t === 'nip' && sp.likes.nip) { M.anger = clamp(M.anger - 0.85); M.fear = clamp(M.fear - 0.4); M.beh = 'roll'; M.behT = 0; M.calmT = 6; }
      else if (t === 'chin' && sp.likes.chin) { M.anger = clamp(M.anger - 0.85); M.fear = clamp(M.fear - 0.3); M.beh = 'flop'; M.behT = 0; M.calmT = 6; }
      else if (t === 'light' && sp.likes.light) { M.curious = clamp(M.curious + 0.5); M.beh = 'chase'; M.behT = 0; }
      else if (t === 'drop') { if (M.sees) { M.fear = clamp(M.fear - 0.3); M.anger = clamp(M.anger - 0.3); M.curious = clamp(M.curious + 0.2); } }
      else if (t === 'apology') { M.anger = clamp(M.anger - 0.5); }
      else if (t === 'hit') { M.fear = clamp(M.fear + 0.3); M.anger = clamp(M.anger + 0.3); }
    }
    M.events.length = 0;
    /* 몸짓 → 마음(반응 표) */
    const near = p.d < sp.space, threat = p.weapon && M.sees;
    if (threat) { const k = near ? 2 : p.d < 12 ? 1 : 0.25; M.fear = clamp(M.fear + 0.22 * h * k); M.anger = clamp(M.anger + 0.12 * h * sp.temper * k); }   // 멀리서 든 칼은 덜 무서움
    if (p.close > 1.6 && p.d < 14) M.fear = clamp(M.fear + 0.55 * h * sp.shy);   // 빠르게 다가옴
    if (near && !p.reach && M.trust < 0.6) M.fear = clamp(M.fear + 0.25 * h * (1 - M.trust) * sp.shy);
    if (p.low && p.close < 1.3 && !threat) { M.fear = clamp(M.fear - 0.07 * h); M.curious = clamp(M.curious + 0.05 * h); }
    if (p.reach && p.still && !M.eye && p.d < 3.8 && !threat) M.trust = clamp(M.trust + 0.14 * h * (1 - M.fear));
    if (!threat && p.close < 0.8 && !near) M.fear = clamp(M.fear - 0.035 * h);          // 아무 일 없으면 서서히 가라앉음
    if (!threat) M.anger = clamp(M.anger - 0.05 * h);
    if (M.calmT > 0) { M.calmT -= h; M.anger = clamp(M.anger - 0.2 * h); }
    M.hunger = clamp(M.hunger + 0.004 * h);
    /* 행동 고르기(장이 lock으로 정하면 건너뜀) — 공격·틈·뒹굴기·털썩·쫓기는 끝날 때까지 */
    const busy = M.beh === 'attack' || M.beh === 'windup' || M.beh === 'gap' || ((M.beh === 'roll' || M.beh === 'flop') && M.behT < 5) || (M.beh === 'chase' && M.behT < 4) || (M.beh === 'flee' && M.behT < 2.5);
    if (!M.lock && !busy) {
      let b = 'idle';
      if (M.fear > 0.78) b = 'flee';
      else if (M.anger > 0.62 && M.sees && p.d < sp.see * 0.7) b = 'warn';
      else if (M.fear > 0.5 && near) b = 'back';
      else if (M.trust > 0.55 && M.fear < 0.35 && p.d > 1.6) b = 'come';
      else if (M.sees) b = 'watch';
      if (b !== M.beh) { M.beh = b; M.behT = 0; }
    }
    if (M.lock && M.beh !== M.lock && M.warnT <= 0 && M.beh !== 'attack' && M.beh !== 'gap') { M.beh = M.lock; M.behT = 0; }
    if (M.beh === 'attack' && M.behT > 0.6) { M.beh = 'gap'; M.behT = 0; M.gapT = sp.gap; }
    if (M.beh === 'gap' && M.gapT <= 0) { M.beh = 'watch'; M.behT = 0; }
    /* 보이는 신호(자세 함수 값) — 가늚 = 경계 · 둥긂 = 편안 */
    const g = M.sig, alert = Math.max(M.fear * 0.85, M.anger);
    g.pupil = clamp(1 - alert * 1.1 + (M.beh === 'flop' || M.beh === 'roll' ? 0.5 : 0));
    g.ear = M.anger > 0.5 ? -M.anger : (M.curious - 0.3) * 1.4;
    g.crouch = clamp(M.beh === 'warn' || M.warnT > 0 ? 0.8 : M.fear * 0.6);
    g.teeth = clamp(M.anger * 1.4 + (M.beh === 'warn' ? 0.5 : 0) - M.trust * 0.6);
    g.tailCurl = clamp((M.fear - 0.4) * 1.6);
    g.jaw = M.beh === 'warn' ? 0.35 + Math.sin(M.behT * 6) * 0.1 : 0;
    g.sniff = M.last.offer && M.beh === 'come' ? 1 : 0;
    g.tilt = M.curious > 0.6 && M.beh === 'watch' ? Math.sin(M.behT * 0.8) * 0.5 : 0;
    g.headUp = M.beh === 'back' ? -0.3 : 0;
  };
  /* 공격 예고 시작(장이 부름 · 난이도 예고 초 · 2~3초) */
  M.windup = (sec) => { if (M.warnT > 0 || M.beh === 'attack') return false; M.warnT = sec; M.beh = 'windup'; M.behT = 0; return true; };
  /* 틈 = 공격 뒤 1~1.5초 — 풀·턱 긁기·생선은 이 안에서만 먹힘(6학년 반박) */
  M.inGap = () => M.beh === 'gap' && M.gapT > 0;
  return M;
}
