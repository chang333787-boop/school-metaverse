# 우리학교 메타버스 (뼈대 v0.1)

초등 AI 디지털 수업용 — 3인칭 캐릭터로 돌아다니는 우리 학교 3D 맵.
three.js r170 로컬 번들(lib/) 사용, 외부 네트워크 의존 0, 설치 0 (브라우저만 있으면 됨).

## 실행

```bash
cd school-metaverse
python3 -m http.server 8001
# → http://localhost:8001
```

크롬북: 링크만 열면 됨. 조작 = WASD/방향키 이동 · 마우스 드래그 시점 · Space 점프 · Shift 달리기 · F 키 fps 표시.

## 구조

| 파일 | 역할 |
|---|---|
| `js/data.js` | **학교 배치 데이터 — 도면 받으면 이 파일만 수정** (실 이름·위치·크기, 건물/운동장/텃밭/체육관 배치) |
| `js/world.js` | data.js를 읽어 3D 월드 생성 (벽·문·경사로·가구·팻말 자동 배치) |
| `js/player.js` | 3인칭 캐릭터 (이동·중력·점프·충돌·애니메이션) |
| `js/main.js` | 카메라·입력·HUD·루프. `window.SD` = 디버그 API (tp/pos/zone/step) |
| `js/textures.js` | 캔버스 텍스처 (팻말·태극기·트랙·코트·얼굴·책) |

## 투트랙 구조

| 경로 | 내용 | URL |
|---|---|---|
| 루트 | **발전판** — 개발 계속 | https://chang333787-boop.github.io/school-metaverse/ |
| `classroom/` | **아이들 버전 v0.8 동결** (2026-07-28 수업 결과물, 수정 금지) | https://chang333787-boop.github.io/school-metaverse/classroom/ |

수업 이력: 뼈대 v0.1(전날 제작) → 수업일 v0.2~v0.8 (도면·위성·측량·사진 반영, 아이들 요구 2라운드, NPC·상호작용·성능·그림자). git tag `v0.8-classroom`.
