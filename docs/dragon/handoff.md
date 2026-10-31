# 드래곤 게임 — 이어받기 (단계마다 고침)

정본 = `docs/dragon/goal_prompt.md`(교사 10-31 "진행하자"로 승인 · §9 열두 조건이 끝 조건) · 설계 = `docs/dragon/design.md`(v2.1 · 장 번호는 설계 기준 — goal의 '1~5장' = 설계 '1~6장') · 사실 = `docs/dragon/reference.md`.

## 지금 상태 (2026-10-31 · 단계 0·1 끝 · 단계 2 바탕 일부)
- ✅ **단계 0 조사**: `reference.md`(설계가 따를 사실 열다섯 · 교사 확인 열) + 부록 셋 `research/`(출처 169).
- ✅ **단계 1 설계**: `design.md` v2.1.
  - 다섯 역할 반박 60개 → v2 → 심판 지적 12개 → v2.1 · 심판 판정 '고친 뒤 진행' → 고침
  - 장 열 + 오프닝·종장 · 공용 동사 여덟 · 엔진 넷(데이터·갱신 주기·엮임) · 요구 39줄(모두 1~10장 안 · '확인' 칸)
  - 기절 = 손해 · 소리 끔 기본 · 쉬움 18도전 · 스토이크 여섯 박자 · 유머 규칙 · 빼는 차례(큰 덩어리 먼저)
- 🔨 **단계 2 바탕**(`dragon/`):
  - `js/core/`
    - `gfx`: 🎨 30 · ⚡ 60 · 자동 해상도(바꾼 뒤 간격만)
    - `input`: e.code · 톡 치기 걸쇠 · clientX 끌기 · wheel · virtual
    - `loop`: 1/60 · 최대 3걸음
    - `rng` · `noise`
    - `debug`: `DRG` perf · diag(셰이더 오류 포함) · state · bot(넣은 차례대로) · bench(그린 프레임만)
  - `js/look/`
    - `kit.js`: 시안 A — toon 캐시 · 3단 톤 · 가장자리 빛 · 높이 안개 · 하늘(renderOrder 900) · 고리 격자 바다(800) · 때 넷
    - `models.js`: glTF + meshopt · 재질 이름 → toon
    - `dragon_rig.js` · `human_rig.js`: 모델 축으로 뼈 돌리기 · 날갯짓·접기·귀·동공 / 걷기·살금·손 내밀기·던지기
  - `js/play/walker.js`: 걷기(카메라 기준 · Shift 켜고 끄기 · Space 구르기 1초 한 번) · 뒤따르는 카메라
  - 장면(`?scene=`): `a` 시안 A 섬 · `model` 모델 보기(`&mode2=1~4&yaw&dist&pitch&people=hiccup,…`) · `walk` 걷기 시험 · `base` 맨 처음 임시
  - 모델 `assets/models/`: toothless(삼각형 9.7천 · 뼈 30) · hiccup · astrid · stoick · gobber
    - 모델을 만드는 스크립트: `tools/dragon_blender/toothless.py` · `viking.py`(표 한 줄 = 사람)
  - 시험: `B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_perf.cjs . --sec=20`
    - 확인하는 것: 캐시 번호 한 파일 한 번호 · 봇 입력만 · 같은 씨앗 같은 판 · ⚡ p95 · 🎨 30 · 오류 0
- `lib/addons/`: three r170 애드온 넷 · importmap `three/addons/`
- 아직 v2 메뉴에 연결하지 않았다(완성 전) · `noindex`.

## 다음 할 일 — 단계 2 마무리 → 단계 3 수직 조각(설계 2~6장)
1. **무대 틀**(design §12): 장 하나 = 무대 모듈 `{ load, step, draw, dispose, sense, benchPath }` + `renderLists.dispose()` · 장 열 번 오가기 힙 시험
2. **결 확정**: 시안 A 키 프레임 여섯(design §15 색 흐름) · v2 학교·마법사 마을과 나란히 놓은 사진 · C는 책 그림만
3. **모델 다듬기**: 투슬리스 접은 날개(지그재그가 아직 어색) · 사람 얼굴·비례(그래픽 3/5 → 4) · 64px 실루엣 시험 · 드래곤 틀로 그롱클·내더·지플백·나이트메어·테러
4. **비행 엔진**(design §3-3 아케이드식) + 관문 비행 동사 · 쉬움 '꼬리 한 키'
5. **마음 엔진**(§3-1 10Hz · 반응 표 · 신호 → dragon_rig) + '다가가 기다리기' 동사 → 4장 코브
6. **교사 크롬북 `?bench=1`**: 단계 2 끝 관문(한 줄 복사 · 한국어 기기 음성 · Shift+Space 한/영)
7. 수직 조각 2~6장을 완성도 5까지 → 그다음 1·7~10장 · 종장

## 교사에게 물어 둔 것 (답이 오기 전엔 기본값)
- goal §1 교사 결정 다섯(판 2010 · 원작 이름 쓰기 + 비상업 표시 · 제목 「버크의 드래곤 친구」 · 크레딧 '4학년 친구들' · 느낀 점 문장)
- reference 끝 '선생님이 영화로 확인할 것' 열

## 일하는 법 메모
- **캐시**: `zsh tools/dragon_ver.sh` 한 번이면 dragon/ 전체 `?v=`가 같은 번호로 맞춰진다(하네스가 갈림을 잡음). 홍보판·v2는 건드리지 않는다.
- **모델 다시 짓기**:
  ```
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python tools/dragon_blender/toothless.py -- <src.glb>
  gltfpack -i <src.glb> -o dragon/assets/models/toothless.glb -cc -kn -km
  ```
  - gltfpack이 없으면 `npm install --prefix <임시> gltfpack@0.22.0`(goal §1에서 허락됨).
  - Blender MCP 애드온이 켜져 있으면 `look`으로 보며 고칠 수 있다(10-31엔 꺼져 있었음).
- **미리보기**: `.claude/launch.json`의 `dragon`(8044) → `http://localhost:8044/dragon/?scene=walk` · 본 뒤 탭 닫기.
- **push 전**: drg_perf + `check.cjs . --full`(v2 17/17) + `PAGE=/`(16/17 = 1학년 닻 예전부터). 다른 세션이 main에 자주 push하니 `git pull --rebase` 뒤 push.
- **사용량**: 10-31 저녁 기준 주간 9% · 깰 때마다 `get_usage` · 80%에서 멈춤.
