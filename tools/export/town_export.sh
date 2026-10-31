#!/bin/zsh
# 마을 게임만 따로 내보내기(EXPORT-1) — 원본 school-metaverse는 읽기만 · 새 저장소 폴더를 통째로 다시 만든다
#   zsh tools/export/town_export.sh                         → /Users/dobuk/Projects/uri-maeul 에 만들기(커밋 X)
#   zsh tools/export/town_export.sh <폴더> --commit "메시지"  → 만들고 그 폴더 git에 커밋(원격·push는 하지 않음)
#   zsh tools/export/town_export.sh <폴더> --keep-comments   → 주석을 남긴 판(살펴보기용)
# 이름 바꾸기 표 = tools/export/names.json · 새 저장소에만 있는 것(인트로·README·사진 출처) = tools/export/overlay/
# 확인(새 폴더를 python3 -m http.server <포트> --bind 127.0.0.1 로 띄운 뒤 · 브라우저는 zsh tools/ops/b2.sh node … 로 하나씩):
#   python3 tools/export/test/uri_check.py <폴더>          글 검사(사진·docs·비밀값·'정림'·이름 바꿈·아이 집)
#   node tools/export/test/uri_intro.cjs <포트> [--shots=…]  인트로(긴 판·짧은 판·건너뛰기·다시 보기·휴대폰)
#   node tools/export/test/uri_first.cjs <포트>              처음부터 → 칠판 E → 첫 장을 몸으로 걷기 → 저장·새로고침
#   node tools/export/test/town_hud.cjs ourtown <포트> · town_open.cjs ourtown <포트>   원본 마을 시험을 새 주소로
set -e
SRC=${0:A:h:h:h}
OUT=${1:-/Users/dobuk/Projects/uri-maeul}
[ $# -gt 0 ] && shift
python3 "$SRC/tools/export/town_export.py" --src "$SRC" --out "$OUT" "$@"
python3 "$SRC/tools/export/test/uri_check.py" "$OUT"
