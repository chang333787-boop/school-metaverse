# push 전 관문(pre-push · GATE-2 · 10-31)

`git push`를 하면 올리려는 커밋에서 바뀐 파일을 보고 아래를 차례로 돌려요. 하나라도 실패하면 push를 막아요.

1. 문법: 바뀐 `.js`(모듈) · `.cjs` · `.mjs`
2. `node tools/harness/check.cjs . --full` (우리 학교용 · 기준선보다 나빠지면 실패)
3. `PAGE=/ node tools/harness/check.cjs . --full` (홍보판 · 1학년 닻 15.5만은 예전부터라 통과)
4. `node tools/harness/town_gate.cjs ourtown <빈 포트>` (마을을 실제로 열고 걸어 봄 · 2~3분 · 빈 포트에 정적 서버를 띄웠다 닫음)

문서(`.md`·그림·`docs/`)만 바뀌었으면 2~4는 건너뛰어요. 한 바퀴 4~5분이에요. 기록은 `${TMPDIR:-/tmp}/sm-prepush-<시각>/`에 남아요.
시험은 지금 작업 폴더 그대로 돌아요. 커밋 안 한 변경이 있으면 알림이 떠요(합치기 폴더에서 커밋한 뒤 push하면 올라가는 것과 시험한 것이 같아요).

## 설치(이 저장소에서 한 번)
```
git config core.hooksPath tools/hooks
```
되돌리기: `git config --unset core.hooksPath`

## 건너뛰기
- 이번 한 번: `SM_SKIP_GATE=1 git push` 또는 `git push --no-verify`
- 문서만 바꿨는데도 다 돌리기: `SM_GATE_ALL=1 git push`
- 브라우저 시험을 b2.sh 자리(맥 열 막기)로: `SM_GATE_B2=1 git push`
- 손으로 돌려 보기: `sh tools/hooks/pre-push < /dev/null` (원격 main과 지금 작업 폴더의 차이로)
