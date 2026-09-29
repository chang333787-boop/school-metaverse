# 우리학교 메타버스

초등 AI 디지털 수업용 — 3인칭 캐릭터로 돌아다니는 우리 학교 3D 맵.
three.js r170 로컬 번들(lib/) 사용, 설치 0 (브라우저만 있으면 됨).

## 주소

| 경로 | 내용 | URL |
|---|---|---|
| 루트 `index.html` | **홍보판** — 학부모·방문자용 3D 학교 둘러보기(견학만 · 학생 이름 없음) | https://chang333787-boop.github.io/school-metaverse/ |
| `v2/` | **우리 학교용** — 모든 놀이(견학·물총·숨바꼭질·방탈출·이야기 …) | https://chang333787-boop.github.io/school-metaverse/v2/ |
| `classroom/` | **아이들 버전 v0.8 동결** (2026-07-28 수업 결과물, 수정 금지) | https://chang333787-boop.github.io/school-metaverse/classroom/ |

홍보판과 우리 학교용은 같은 코드(`v2/`)를 쓴다. 홍보판은 `window.SM_PROMO`로 견학만 열고 학생 이름표를 'N학년 친구'로 바꾼다.

## 실행

```bash
cd school-metaverse
python3 -m http.server 8001
# → http://localhost:8001 (홍보판) · http://localhost:8001/v2/ (우리 학교용)
```

## 견학 글·영상·사진 고치기

`v2/games/tour_data.js` 한 파일 — 곳마다 이야기(pages)·유튜브 주소(videos)·사진(photos)을 적는다. 사진 파일은 `v2/games/tour_media/`에. 아이 얼굴이 나온 사진은 올리지 않는다.

## 구조

| 파일 | 역할 |
|---|---|
| `v2/js/layout.js` | 학교 배치·명단 (단일 수정 지점) |
| `v2/js/world.js` | layout.js를 읽어 3D 월드 생성 |
| `v2/js/main.js` | 카메라·물리·입력·HUD·게이트. `window.SD2` = 디버그 API |
| `v2/games/` | 놀이들(registry.js 허용 목록) |
| `tools/harness/` | 게이트·캡처 (`npm i` 후 `node tools/harness/check.cjs . --full`) |

수업 이력: 뼈대 v0.1 → 수업일 v0.2~v0.8(git tag `v0.8-classroom`) → v2(09-2x 실측 재건축·놀이) → 09-29 홍보판 분리·v1 삭제.
