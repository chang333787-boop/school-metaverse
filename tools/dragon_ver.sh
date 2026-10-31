#!/bin/zsh
# 드래곤 게임 캐시 번호를 한 번에 맞춤: zsh tools/dragon_ver.sh [번호] — 번호를 안 주면 지금 가장 큰 번호 + 1
# dragon/ 안의 모든 '?v=숫자'(모듈 import · index.html · 모델 주소)를 같은 번호로 — 같은 파일을 다른 번호로 부르면 모듈이 둘이 돼 공유 값(U·재질 캐시)이 갈라짐
cd "$(dirname "$0")/.." || exit 1
FILES=(dragon/index.html ${(f)"$(find dragon/js -name '*.js')"})
N=${1:-$(( $(grep -oh '?v=[0-9]*' $FILES | sed 's/?v=//' | sort -n | tail -1) + 1 ))}
sed -i '' -E "s/\?v=[0-9]+/?v=$N/g" $FILES
echo "dragon ?v=$N ($(grep -oh '?v=[0-9]*' $FILES | sort -u | tr '\n' ' '))"
