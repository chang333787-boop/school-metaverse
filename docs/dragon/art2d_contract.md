# 2D판 그림 약속 v2 — 포켓몬식 탑뷰 (dragon2d · 11-01 교사 '2D 말고 포켓몬처럼 탑뷰')

2D판(`dragon2d/`)은 **위에서 비스듬히 내려다보는 탑뷰 모험**이다(포켓몬·스타듀밸리 결: 땅은 위에서 · 사람·드래곤·건물은 서 있는 모습을 앞쪽에서 비스듬히). 옆 스크롤(v1 약속)은 버렸다. Canvas 2D 코드로 그린다(빌드 없음 · 외부 네트워크 0 · 내려받기 0 · 이미지 파일 0).

## 결 — 손그림 그림책 (v1과 같음)
- 종이 #f4ead2 · 먹선 #2b2118(굵기가 조금씩 다른 손 선 · 끝이 둥근 선) · 수채 같은 납작한 칠 + 한 톤 그늘(3단 톤) · 칠이 선에서 살짝 비어져 나온 자리(미리 정한 흔들림 · 매 프레임 바뀌지 않음).
- **AI 슬롭 X**: 번쩍이·네온·glow·shadowBlur·유리·반짝 별·무지개 그라데이션 X. 메타버스 상자 결 X. 영화 그림을 따라 그리지 않는다 — **알아볼 특징만**(reference B·C).
- 땅·건물은 **낮(맑음) 색으로만** 그린다. 밤·안개·노을은 엔진이 화면 전체에 옅은 색 한 장을 덮어 바꾼다.

## 좌표 · 단위
- 월드 = 평면 **x(오른쪽) · y(아래쪽 = 남쪽 = 화면 아래)**, 단위 **미터**. 화면 높이 ≈ 11m(1366×768에서 1m ≈ 70px · 크롬북 dpr 1). 땅 타일 = 1m × 1m.
- 서 있는 것(사람·드래곤·소품)의 그리기 함수는 `ctx`가 **발 자리(땅에 닿는 점 · 소품은 앞쪽 밑변 가운데)로 옮겨지고 1단위 = 1m인 상태**에서 부른다. 서 있는 그림은 **위쪽 = −y**로 그린다(앞에서 비스듬히 본 모습). 엔진이 발 자리 y로 앞뒤 차례(y-정렬)를 정하고, **발밑 그림자 타원은 엔진이 그린다**(그림 쪽은 그림자 X).
- 선 굵기는 미터로(사람 외곽 ≈ 0.035 · 큰 드래곤 0.05). Path2D·색 문자열은 모듈 위에서 한 번 · 한 마리 ≤ 0.15ms(맥).

## 1) 인물 · 드래곤 — `dragon2d/js/art/actors.js`
```js
export function drawPerson(ctx, who, pose, t)
// who: 'hiccup'|'stoick'|'gobber'|'astrid'|'fishlegs'|'snotlout'|'ruffnut'|'tuffnut'|'villager'|'villager2'|'elder'
// pose.dir: 'down'(앞 · 얼굴 보임) | 'up'(뒤 · 등) | 'side'(옆 · 오른쪽을 봄 — 왼쪽은 엔진이 뒤집음)  ← 셋 다 꼭
// 나머지 pose 칸(v1과 같음): walk 0..1 · speed 0~1 · z(뛴 높이 m — 그림만 위로 · 그림자는 엔진) · crouch · hand(손 내밀기) · look(−1 = 고개 돌림) ·
//   carry:null|'bucket'|'axe'|'hammer'|'shield'|'knife'|'fish'|'bola'|'book'|'torch'|'bag' · helmet · hurt(넘어짐) · talk · cheer · sit · peg
export function drawDragon(ctx, kind, pose, t)
// kind: 'toothless'|'nadder'|'gronckle'|'nightmare'|'zippleback'|'terror'|'scauldron'  (대장은 아래 drawBoss)
// pose.dir: 'side'(오른쪽 · 모든 종 꼭) | 'down'(앞 · 투슬리스 꼭 — 길들이기 장면이 마주 봄) | 'up'(뒤 · 투슬리스 꼭)
// 나머지 pose 칸(v1과 같음): pupil · ears · wing · flap · mouth · glow · tell · dizzy · fly · z(뜬 높이) · walk · fin · saddle · rider · roll · sit · eat · smile
export function drawDragonTop(ctx, kind, pose, t)   // 하늘 장면: 바로 위에서 본 모습(날개 편) · 머리가 −y(화면 위)를 향함 · 엔진이 몸 방향으로 돌림
// pose: { flap, fin, rider:null|'hiccup'|'hiccup+astrid'|'astrid'|…, glow, tell, wing:0..1 } · 투슬리스(+탄 사람)·내더·그롱클·나이트메어·지플백·테러 · 떼용 `drawFlockTop(ctx, kind, flap)`(0.05ms 안)
export function drawBoss(ctx, pose, t)               // 대장 드래곤(아주 큼 · 회색 산 같은 몸 · 눈 여섯 · 작은 날개 막 · 괴기 X)
// 탑뷰로 위에서 본 머리·목·몸·날개(머리 = −y 쪽 · 머리 길이 ≈ 8m · 몸 전체 ≈ 40m — 화면엔 머리·날개 일부만 들어옴) · 기준점 = 머리 앞 끝
// pose: { tell(목 부풂) · glow(입 안 밝아짐) · mouth · holes 0..8(날개 막 구멍) · eyes 0..1(감음~뜸) · sniff 0..1(콧구멍 벌름) · dizzy }
export const SIZE = { hiccup:[0.5,1.55], …, toothless:[3.2,1.5] }   // [가로, 키] m
```
- 크기·알아볼 특징은 v1과 같음(히컵 가장 마름·적갈색 머리 · 스토이크 큰 덩치·붉은 수염 · 고버 갈고리 손·막대 다리 · 아스트리드 금발 땋은 머리·도끼 · 피시레그 가장 큼 · 스노트라우트 말린 양뿔 · 쌍둥이 뿔 넷 · 투슬리스 검은 몸·큰 초록 눈·귀 판·왼 꼬리날개 없음 → 갈색 가죽 날개).
- 걷기는 위상 walk로 두세 그림(다리 엇갈림 + 몸 살짝 위아래). 앞·뒤 모습에서도 들고 있는 것(carry)이 보이게.
- 64px 회색 실루엣 시험(옆 모습): 인물 다섯 · 드래곤 다섯이 구별.

## 2) 땅 · 소품 — `dragon2d/js/art/scenery.js`
```js
export function bakeChunk(map, cx, cy, N, PX)   // → 캔버스(N×N 타일 · 타일 하나 PX px) — 엔진이 장소마다 한 번 굽고 캐시(매 프레임 X)
// map = { w, h, kind(tx, ty) → 'grass'|'grass2'|'path'|'stone'|'sand'|'snow'|'water'|'sea'|'deep'|'wood'|'arena'|'rockfloor'|'plank'|'wall'|'cliff'|'void' }
//   이웃 타일을 보고 경계를 손그림처럼(풀↔흙 들쭉날쭉 · 물가 거품 선 · 절벽 = 아래로 떨어지는 돌벽 면) · 같은 칸은 늘 같게(씨앗 = 타일 좌표)
//   'wall'(실내 벽 — 위에서 본 벽머리 + 아래쪽 면) · 'cliff'(돌벽 — 코브 둘레 · 위 = 풀 가장자리 · 아래 면 = 돌)
export function drawProp(ctx, kind, o, t)   // 발 자리 = 앞쪽 밑변 가운데 · 미터 · 서 있는 부분은 위로(−y) · 지붕은 위에서 본 면 + 앞벽
// house(o.w 폭, o.d 깊이, o.burn 0..1, o.scorch 0..1) · forge(열린 앞 · 화덕 불빛 칠) · hall(큰 회관 바깥) · tower(망루) · well · cart · barrel · crate ·
// fence(o.len, o.v 세로면 1) · torch(o.lit) · catapult(o.ang 평면 방향 rad) · tree · pine · broken_tree · log · rock(o.w,o.h) · reed · sand_line(o.len, o.ang) ·
// cage(o.open) · barricade(o.w) · shield_rack · weapon_pile · dock(o.w,o.d — 판자) · ship(o.w — 위에서 본 배) · boat · board(게시판) · table · bed · book_stand · anvil ·
// fish_basket(o.n) · sheep · nip(드래곤 풀) · net_roof(o.w,o.d — 훈련장 쇠사슬 지붕 그물 · 맨 위에 덮는 선만 · 반투명 X) · seastack(o.r — 위에서 본 돌기둥 머리 + 거품 테) · cloud(o.w,o.h — 위에서 본 구름 · 엔진이 그림자) · nest_rim(둥지 분화구 테두리 바위)
export const PAL = { night:'rgba(..)', fog:'..', sunset:'..', aurora:'..', storm:'..' }   // (선택) 때마다 덮을 색 — 없으면 엔진 값
```
- 크롬북: 땅은 구운 조각(drawImage)만 · 소품은 화면 안 것만 · 화면 전체 `globalCompositeOperation`·filter·shadowBlur 금지.
- 불·물·김·연기·불티는 엔진이 그림(원소 규칙) — 소품은 상태(burn·scorch·lit)만 받는다.

## 3) 보기 판
- `dragon2d/gallery.html?k=actors`(인물 열하나 × 앞·뒤·옆 · 드래곤 여덟 · 탑뷰 드래곤 · 대장) · `?k=sil`
- `dragon2d/scenery_view.html?p=village`(타일 시험 지도 하나를 굽고 소품 전부를 그 위에)
