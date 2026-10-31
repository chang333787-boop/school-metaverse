# 드래곤 게임 — 이어받기 (단계마다 고침)

정본 = `docs/dragon/goal_prompt.md`(교사 10-31 "진행하자"로 승인 · §9 열두 조건이 끝 조건). 사실 = `docs/dragon/reference.md`.

## 지금 상태 (2026-10-31 · 단계 0 끝)
- ✅ **단계 0 조사**: `reference.md` + 부록 셋(`research/`). 교사 확인 열 개는 reference 끝에 있다(답이 오기 전엔 괄호 안 기본값으로).
- 🔨 **기술 바탕(단계 2 앞당김)**: `dragon/`
  - `js/core/` — gfx(🎨 30 고정 · ⚡ 60 목표 · 자동 해상도 0.6~1.0 · 내림 단계) · input(e.code · 톡 치기 걸쇠 · 끌어 보기 · virtual = 봇·터치) · loop(고정 1/60 · beforeStep 봇) · rng(씨앗) · noise · debug(`window.DRG`: perf · diag(셰이더 오류 포함) · state · bot · bench)
  - `js/look/kit.js` — 시안 A 결 도구: toon() 재질 캐시 · 부드러운 3단 톤 · 가장자리 빛 · 높이 안개(해 쪽 따뜻) · 3색 하늘 · 거스트너 바다 · 때 넷(day·sunset·night·nest)
  - `js/scenes/look_a.js` — 시안 A 시험 장면(섬·돌기둥·바다·구름 · T로 때 바꿈 · `?time=`) · `base_test.js` = 맨 처음 임시 장면(`?scene=base`)
  - 시험: `B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_perf.cjs . --sec=20` — 봇 입력만 · 같은 씨앗 같은 판 · ⚡ p95 · 🎨 30
- `lib/addons/` — three r170 애드온 넷(GLTFLoader · BufferGeometryUtils · SkeletonUtils · meshopt 디코더) · importmap `three/addons/`
- 아직 v2 메뉴에 연결하지 않음(완성 전) · `noindex`

## 다음 할 일
1. **단계 1 설계** → `docs/dragon/design.md`
   - 요구 39줄 대응표
   - 장 차례 고치기: reference §0의 사실 순서대로 — 훈련 1~3일과 코브가 번갈아 · 투구는 스토이크 귀환 뒤 · 물속 구조는 스토이크
   - 엔진 넷 · 조작표(키 여섯 안) · 예산 확정 · 영화와 다르게 한 것
   - 적대 토론(다섯 역할)
2. 단계 2 시안 B·C 견주기(A가 추천 — r3 F+-2) · 키 프레임 여섯 · 인물·드래곤 모델(Blender MCP 애드온이 꺼져 있으면 명령줄 `/Applications/Blender.app/Contents/MacOS/Blender -b --python`)
3. 단계 3 수직 조각(2~5장)

## 일하는 법 메모
- 캐시: `dragon/` 모듈을 고치면 import의 `?v=`를 올린다(main.js · index.html · 장면 파일). 홍보판·v2는 건드리지 않는다.
- 미리보기: `.claude/launch.json`의 `dragon`(8044) → `http://localhost:8044/dragon/` · 본 뒤 탭 닫기.
- push 전: dragon 시험 + `check.cjs . --full`(v2 17/17) + `PAGE=/`(16/17 = 1학년 닻 예전부터).
