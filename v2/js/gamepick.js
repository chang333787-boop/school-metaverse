// v2 놀이 고르기(GAME-FIND-1 · 09-26) — 수업 화면 오른쪽 아래 '🎮 놀이' 칩 → 게임 목록(registry.js에서 dev 아닌 것: 제목 + 한 줄 설명) → 누르면 game.load(id).
//   게임 중에는 칩이 '⏹ 그만하기'(누르면 game.stop). ?game=<id> 주소로 시작한 게임도 sync(10Hz)가 칩 글자를 맞춘다.
//   포인터 잠금과 안 부딪히게: 패널이 열리면 잠금을 푼다(커서가 보여야 누른다) → 닫은 뒤에는 화면을 한 번 누르면 다시 잠긴다(main.js 캔버스 클릭 그대로).
//   닫기 = ✕ · Esc · 패널 밖을 누름. 자리 = 시간 칩(오른쪽 아래) 바로 위. import 없음 — mapapi가 load·stop·current를 준다.
export function createGamePicker(ctx) {
  const { load, stop, current } = ctx;
  if (!document.getElementById('gpick-css')) {
    const css = document.createElement('style'); css.id = 'gpick-css';
    css.textContent = '.gpick-b{display:block;width:100%;min-height:50px;margin:8px 0 0;padding:8px 12px;border:0;border-radius:8px;background:#f4f6fa;color:#1d3557;text-align:left;cursor:pointer;font-family:inherit;line-height:1.35}'
      + '.gpick-b:hover,.gpick-b:focus-visible{background:#fff1bf;outline:none}.gpick-b b{display:block;font-size:15px}.gpick-b span{font-size:12px;color:#4a5a70}'
      + '.gpick-x{position:absolute;right:6px;top:4px;min-width:34px;min-height:34px;border:0;background:none;color:#fff;font-size:18px;cursor:pointer;line-height:1}';
    document.head.appendChild(css);
  }
  const chip = document.createElement('div');
  chip.className = 'chip'; chip.id = 'gpick';
  chip.style.cssText = 'right:10px;bottom:48px;cursor:pointer;user-select:none;font-size:14px;padding:8px 14px';
  chip.textContent = '🎮 놀이';
  document.body.appendChild(chip);
  let panel = null, cur = null, seq = 0;

  function close() { if (!panel) return; panel.remove(); panel = null; removeEventListener('keydown', onKey, true); removeEventListener('pointerdown', onDown, true); }
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  const onDown = e => { if (panel && !panel.contains(e.target) && !chip.contains(e.target)) close(); };
  async function open() {
    close(); document.exitPointerLock?.();
    const my = ++seq;
    panel = document.createElement('div'); panel.className = 'chip'; panel.id = 'gpick-panel';   // TOUCH-1: 터치면 왼쪽 위 칩 밑으로(touch.js css)
    panel.style.cssText = 'right:10px;bottom:92px;width:270px;padding:12px 14px 14px;z-index:30;font-size:14px;border-radius:12px;background:rgba(29,53,87,.92)';
    const h = document.createElement('div'); h.textContent = '🎮 놀이 고르기'; h.style.cssText = 'font-weight:700;font-size:15px;padding-right:30px';
    const x = document.createElement('button'); x.className = 'gpick-x'; x.textContent = '✕'; x.title = '닫기'; x.addEventListener('click', e => { e.stopPropagation(); close(); });
    const list = document.createElement('div'); list.textContent = '불러오는 중…'; list.style.cssText = 'margin-top:4px;font-size:13px';
    panel.append(h, x, list); document.body.appendChild(panel);
    addEventListener('keydown', onKey, true); addEventListener('pointerdown', onDown, true);
    let games = null;
    try { games = (await import(new URL('../games/registry.js?t=' + Date.now(), import.meta.url))).GAMES; } catch (e) { console.error('[놀이] 목록을 못 불러옴', e); }
    if (my !== seq || !panel) return;   // 그사이 닫히거나 다시 열림
    const ids = games ? Object.keys(games).filter(id => !games[id].dev) : [];
    list.textContent = ids.length ? '' : (games ? '아직 놀이가 없어요' : '놀이 목록을 못 불러왔어요');
    for (const id of ids) {
      const b = document.createElement('button'); b.className = 'gpick-b'; b.dataset.game = id;
      const t = document.createElement('b'); t.textContent = games[id].title || id; b.appendChild(t);
      if (games[id].desc) { const s = document.createElement('span'); s.textContent = games[id].desc; b.appendChild(s); }
      b.addEventListener('click', e => { e.stopPropagation(); close(); load(id); sync(); });
      list.appendChild(b);
    }
  }
  chip.addEventListener('click', e => { e.stopPropagation(); if (current()) { stop(); sync(); return; } if (panel) close(); else open(); });
  // 칩 글자 = 지금 게임(10Hz — mapapi tick10). ?game= 주소·콘솔에서 켠 게임도 같이 맞춘다
  function sync() { const c = current(), id = c ? c.id : null; if (id === cur) return; cur = id; chip.textContent = id ? '⏹ 그만하기' : '🎮 놀이'; chip.title = id ? '지금 놀이를 그만해요' : '놀이를 골라요'; if (id) close(); }
  sync();
  return { el: chip, open, close, sync, get panel() { return panel; } };
}
