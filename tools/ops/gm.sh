#!/bin/zsh
# 메인 관문: zsh gm.sh <폴더> <포트> "<town 하네스 이름들 (town_ 빼고) · 인자는 이름:인자>"   → 결과 한 줄씩 · 끝에 DONE
D=$1; P=$2; LIST=$3
cd $D || exit 1
for f in $(git diff --name-only HEAD -- 'v2/**/*.js' 'v2/*.js'; git ls-files --others --exclude-standard -- 'v2/**/*.js'); do [ -f $f ] && { node --input-type=module --check < $f 2>/dev/null || echo "SYNTAX FAIL $f"; }; done
python3 -m http.server $P --bind 127.0.0.1 >/dev/null 2>&1 & SV=$!
sleep 1
r=$(node tools/harness/check.cjs . --full 2>&1 | tail -3 | tr '\n' ' '); echo "check: $r"
r=$(PAGE=/ node tools/harness/check.cjs . --full 2>&1 | tail -3 | tr '\n' ' '); echo "promo: $r"
for h in ${=LIST}; do n=${h%%:*}; a=""; [[ $h == *:* ]] && a=${h#*:}; a=${a//+/ }
  out=$(perl -e "alarm 1800; exec @ARGV" node tools/harness/town_$n.cjs ourtown $P ${=a} 2>&1); rc=$?
  nf=$(echo "$out" | grep -c "✗"); echo "town_$n rc=$rc ✗=$nf :: $(echo "$out" | grep "✗" | head -3 | cut -c1-160 | tr '\n' '|') $(echo "$out" | tail -2 | cut -c1-200 | tr '\n' ' ')"
done
kill $SV 2>/dev/null
echo DONE
