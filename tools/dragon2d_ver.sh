#!/bin/zsh
# dragon2d/ 캐시 번호 한 번에 올리기 — 모든 ?v=N(js·html)을 같은 새 번호로(홍보판·v2·3D판은 안 건드림)
# 쓰는 법: zsh tools/dragon2d_ver.sh        (지금 번호 + 1)
cd "$(dirname "$0")/.." || exit 1
cur=$(grep -o 'main.js?v=[0-9]*' dragon2d/index.html | head -1 | sed 's/.*=//')
new=$((cur + 1))
find dragon2d -name '*.js' -o -name '*.html' | while read f; do sed -i '' -E "s/\?v=[0-9]+/?v=${new}/g" "$f"; done
echo "dragon2d ?v=${cur} → ${new}"
