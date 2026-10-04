// 하늘에서 보기(TOP-1 · 10-04 교사 '오프닝 보니 탑뷰로 뱅글뱅글 — 탑뷰로 학교 보기') — 엔진 map.top을 켜는 놀이
//   지붕 벗기기(🏠 지붕 · 1층 · 2층) · 끌어서 옮기기 · 휠/두 손가락 확대 · 돌리기 · 비스듬히/똑바로(지도처럼) · 방 이름 · 방위표·축척 막대
//   톡 = 그곳 이름 + '🚶 여기로 내려가기'(그 자리 가까운 걷는 칸으로 옮기고 걸어 다니기) · 🚶 걸어 다니기/Esc = 그만하기
//   주소: ?game=topview&floor=1|2|roof&top=1(처음부터 똑바로)
export const meta = { id: 'topview', title: '하늘에서 보기', api: 1 };

export default async function start(map, params = {}) {
  if (!map.top) { map.hud.toast('이 화면에서는 하늘에서 보기를 쓸 수 없어요'); map.quit(); return {}; }
  map.player.freeze(true);
  const fl = params.floor === 'roof' ? 'roof' : params.floor ? +params.floor : undefined;
  let nav = null; map.nav().then(n => { nav = n; });   // 길격자(내려가기 자리 찾기) — 뒤에서 지어 둔다
  const down = pt => {   // 그 자리에서 가장 가까운 걷는 칸(같은 층 먼저)으로
    let to = null;
    if (nav) { const i = nav.snap(pt.x, pt.y, pt.z, 4); if (i >= 0) to = nav.pos(i); }
    if (!to) { const e = map.findEntry(pt.x, pt.z, pt.y); if (e) to = [e.x, e.y, e.z]; }
    if (!to) { map.hud.toast('거기는 내려갈 수 없어요 — 다른 곳을 눌러 보세요'); return; }
    map.player.teleport(to); map.quit();
  };
  map.top.enter({ floor: fl, top: params.top === '1', onExit: () => map.quit(), tapActions: [{ t: '🚶 여기로 내려가기', f: down }] });
  return { stop() {} };
}
