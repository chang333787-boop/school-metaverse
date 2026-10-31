// 엔딩(design §2 종장 · goal §9-11) — '고버 아저씨처럼, 투슬리스처럼' · 아이들 느낀 점(받으면 · 없으면 칸 없이) · 크레딧 = 요구 39줄 아이 말 그대로('이 생각은 여기에' · 이름 없이)
// → '영화에서 더 볼 장면 셋'(게임이 줄이거나 뺀 장면 · 이름만) → 처음으로 · C 판화 결(종이 · 잉크) · Space·F·누르기 = 다음 쪽
const CSS = `
#ending { position:fixed; inset:0; z-index:45; background:#1d2730; color:#2b2118; display:flex; align-items:center; justify-content:center; font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif; pointer-events:auto; }
#ending .pg { width:min(760px,94vw); max-height:86vh; overflow:hidden; background:#efe2c4; border:3px solid #2b2118; border-radius:12px 18px 14px 20px / 18px 12px 20px 14px; padding:26px 30px; box-shadow:5px 6px 0 rgba(0,0,0,.35); }
#ending h2 { margin:0 0 10px; font-size:28px; } #ending .big { font-size:30px; font-weight:800; text-align:center; margin:30px 0; line-height:1.5; }
#ending .roll { columns:2; column-gap:26px; font-size:15px; line-height:1.55; } #ending .roll div { break-inside:avoid; }
#ending .roll b { color:#a83e1e; font-weight:700; } #ending .small { font-size:14px; color:#6a5a48; margin-top:12px; }
#ending .scene { font-size:22px; margin:16px 0; padding-left:10px; border-left:5px solid #a83e1e; }
#ending button { font:inherit; font-size:18px; margin-top:16px; padding:6px 18px; background:#f4ead2; border:2px solid #2b2118; border-radius:10px; cursor:pointer; }
#ending .next { float:right; font-size:15px; color:#6a5a48; margin-top:18px; }
`;
/* 아이 요구 39 — 아이들이 한 말 그대로(goal §4-1) · 이 생각이 들어간 장(design §5) */
export const WISHES = [
  ['드래곤 타기', '오프닝·5·6·8·10장'], ['길들이기', '2·4장'], ['드래곤들의 특징', '3·4장'], ['좋아하는 행동', '4·6장'], ['나타나는 곳', '2·3·8장'],
  ['등장인물의 성격·특징', '2·7·9장'], ['몇 달은 비, 몇 달은 눈', '3·6·8장·종장'], ['환경(바다·높은 돌·호수·집·마을·대장장이·훈련장·배 타는 곳)', '1~6장'], ['모험 퀘스트', '2·8·10장'], ['사냥', '2·4장'],
  ['무기 강화', '5장부터'], ['다른 드래곤과 싸우기', '1·3·9·10장'], ['영화 줄거리대로 이야기 진행', '1~10장'], ['드래곤이 갑자기 나타나 공격', '1장'], ['다른 드래곤 치유', '5·6장'],
  ['드래곤 먹이 구하기', '1·4장'], ['드래곤 감정 표현', '4·5장'], ['드래곤 꾸며 주기', '6장'], ['배 타기', '4장·종장'], ['맵', '1·2·6장'],
  ['낚시', '4장'], ['주인공', '1장'], ['드래곤과 공존', '9장·종장'], ['사람들이 드래곤을 죽이려 함', '1·9장'], ['훈련장에 드래곤을 가두고 훈련', '3~7장'],
  ['사람들을 설득해 공존', '9·10장'], ['레벨', '5장부터'], ['드래곤 등급', '3장부터'], ['친구들·대장장이와 이야기', '1·2·5·7장'], ['어른들이 배 타고 섬으로 → 큰 대장 드래곤을 무찔러야 자유', '9·10장'],
  ['덜 다치게 해 주는 무기', '3·5장'], ['친해지면 같이 싸우기', '10장'], ['어른들 설득(대장만 나쁘다)', '8·9·10장'], ['영화 최대한 반영', '1~10장'], ['큰 새 모양에 긴 꼬리, 불 뿜기', '1장'],
  ['싸울 때 불·물 같은 스킬', '1·5·10장'], ['드래곤 공격 피하기', '1·3·9장'], ['드래곤 죽이면 아이템이 떨어진다', '1장(기절 = 그을린 조각 · 치유 = 묵은 비늘)'], ['동료와 같이 싸우기', '10장'],
];
/* 영화에서 더 볼 장면 셋 — 게임이 줄이거나 뺀 장면(이름만 · reference A) */
export const MORE_SCENES = ['대장간 뒷방에서 들킬 뻔한 장면', '안개 바다에서 배들이 둥지 섬에 닿는 큰 장면', '버크를 처음 소개하는 히컵의 이야기'];

export function showEnding(G, opt = {}) {
  return new Promise((done) => {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = document.createElement('div'); el.id = 'ending'; document.body.appendChild(el);
    const feel = opt.feel || [];                                   // 교사가 모아 준 아이들 느낀 점(없으면 칸 없이)
    const pages = [
      `<div class="big">고버 아저씨처럼,<br>투슬리스처럼.</div><div class="small" style="text-align:center">서로의 빈 곳을 채워 주는 친구가 있으면, 버크도 바뀐다.</div>`,
      ...(feel.length ? [`<h2>우리가 느낀 것</h2>${feel.map((f) => `<div class="scene">${f}</div>`).join('')}`] : []),
      `<h2>이 생각은 여기에</h2><div class="roll">${WISHES.map(([w, c]) => `<div>· ${w} — <b>${c}</b></div>`).join('')}</div><div class="small">아이디어: 4학년 친구들 · 영화 『드래곤 길들이기』를 보고 4학년이 만든 비상업 팬 게임</div>`,
      `<h2>영화에서 더 볼 장면 셋</h2>${MORE_SCENES.map((s) => `<div class="scene">${s}</div>`).join('')}<div class="small">게임에서는 줄이거나 뺀 장면이에요. 영화로 꼭 보세요.</div>`,
      `<h2>만든 것</h2><div class="small" style="font-size:16px;line-height:1.7">그림·모델·소리·글 = 이 게임을 위해 새로 만듦(영화 그림·음악·대사 원문 X)<br>3D = three.js(MIT) · 모델 = Blender로 지음<br>아이디어 = 4학년 친구들 · 만든 이 = 선생님과 Claude</div><button data-a="home">처음으로</button>`,
    ];
    let i = 0;
    const show = () => { el.innerHTML = `<div class="pg">${pages[i]}${i < pages.length - 1 ? '<div class="next">Space · F · 누르기 = 다음</div>' : ''}</div>`; const b = el.querySelector('[data-a=home]'); if (b) b.onclick = () => finish(); };
    const next = () => { if (i < pages.length - 1) { i++; show(); } else finish(); };
    const key = (e) => { if (e.code === 'Space' || e.code === 'KeyF' || e.code === 'Enter') { e.preventDefault(); next(); } };
    const finish = () => { removeEventListener('keydown', key); el.remove(); st.remove(); done(); };
    el.addEventListener('pointerdown', (e) => { if (e.target.tagName !== 'BUTTON') next(); });
    addEventListener('keydown', key);
    show();
    G.endingPage = () => ({ i, n: pages.length });
  });
}
