# 합치기·시험 도구(메인 세션용 · 10-24)
- `b2.sh` — 브라우저 시험 자리. 그림 없는 시험(pw.cjs · --sm-norender)은 자리 셋(부하 8 아래). 그림 켠 시험은 한 자리(부하 6 아래 · 무거운 브라우저 한 대 이하). 메인은 `B1_MAIN=1`로 자기 자리 `m1.lock`을 써요. 잠금 폴더는 `SM_OPS_DIR`(기본 /tmp/sm-ops).
- `gm.sh <폴더> <포트> "<하네스 이름들>"` — 문법 → check.cjs --full → 홍보판(PAGE=/) → town_<이름> 하네스(인자는 `이름:--a+--b`) → 줄마다 결과 · 끝에 DONE.
- `bump.py <합치기 폴더>` — 스테이지된 변경을 보고 모듈 ?v=·registry town v·v2·v3 index의 main.js?v=를 한 번에 올려요(홍보판 X).
- `r5.py <파일>` — `git apply -3` 뒤 남은 충돌 표시 자리만 풀어요(base→theirs 문자 바꿈을 ours 줄에 끼움). 못 푼 자리는 그대로 남기니 손으로 봐요. 이미 들어간 바꿈이 또 들어가지 않는지 꼭 확인해요.
- 합치기 폴더: `git worktree add --detach <폴더> origin/main` + `ln -s <저장소>/node_modules <폴더>/node_modules`.

## 공개판 uri-maeul도 같이(10-31~)
마을 코드를 main에 push한 뒤 같은 합치기 폴더에서:
1. `zsh tools/export/town_export.sh /Users/dobuk/Projects/uri-maeul --commit "school-metaverse <커밋> 기준 — <바뀐 것>"` (끝에 uri_check PASS)
2. `git -C /Users/dobuk/Projects/uri-maeul push` → https://chang333787-boop.github.io/uri-maeul/ 1~2분 뒤 반영
검사가 실패하면(새 실명·학교 이름·사진·비밀값) tools/export/names.json·scrub를 고쳐 다시 돌려요.
