#!/bin/zsh
# 핵심 시험 묶음(CORE-1 · 11-13 · 교사가 프로젝트를 놓은 뒤에도 수업 전에 20분으로 확인) — 저장소 뿌리에서: zsh tools/ops/core.sh [포트=8821]
#   ① 학교 맵 check.cjs --full  ② 홍보판(PAGE=/)  ③ 나무·꽃 색 town_ticolor  ④ 한 차시 수업 길에 걸리는 마을 하네스를 둘씩(자리 = b2.sh)
#   → 한 줄씩 '이름 rc=0 ✗=0 n초' · 끝에 '통과 n / 전체 m · 걸린 k분' · DONE (모두 통과 = exit 0 · 하나라도 떨어지면 exit 1)
#   통과 = rc=0 이고 ✗=0 · 떨어진 시험의 기록 = $CORE_OUT/<이름>.log(기본 /tmp/sm-core)
#   전체 마을 하네스 129개(3시간 남짓)는 큰 묶음 뒤에만 — 이 묶음은 '수업 길이 안 깨졌나'만 봄(고른 까닭 = 아래 목록 주석 · 교사가 읽는 안내 = docs/systems/town_ops.md)
#   CORE_LIST="gate open diag:--quick" 처럼 주면 ④를 그 하네스만(town_ 빼고 · 인자는 이름:--a+--b · gm.sh와 같은 꼴)
#   포트가 잡혀 있으면 다음 포트로(옛 서버가 잡고 있으면 옛 코드를 시험하게 됨 · gm.sh와 같은 방식)
#   ⚠️ 서버를 띄운 채 인자 없는 wait를 쓰면 서버까지 기다려 영영 안 끝남 → 시험 pid만 보고, 끝에 서버를 끔
R=${0:a:h:h:h}; cd $R || exit 1
P=${1:-8821}; OUT=${CORE_OUT:-/tmp/sm-core}; LIMIT=${CORE_LIMIT:-1500}   # LIMIT = 시험 하나에 주는 초(넘으면 rc=142)
# ④ 한 차시 수업 길에 걸리는 열일곱(11-13 이 맥에서 잰 초 · 긴 둘(first · emerg)이 서로 다른 줄에서 돌게 앞쪽에 둠)
#   11-13 확인 판(2d6e57a) = 통과 20 / 전체 20 · 24분 50초 — 다른 세션의 무거운 브라우저 때문에 가벼운 줄이 7분 기다린 것 포함(조용한 맥이면 시험 초 합 2350 ÷ 2 ≈ 20분)
#   ⚠️ emerg(무거운 자리)가 도는 동안 맥에 다른 무거운 브라우저가 또 있으면 가벼운 시험은 기다려요(b2.sh 규칙) → 그만큼 길어짐 · 수업 전에는 다른 시험을 같이 돌리지 않기
#   gate    168초  마을이 실제로 열리고 걸어지나 · E 자리 수 · 저장 → 새로고침 → 이어하기 · 홍보판에는 마을이 안 열림
#   first   556초  첫 장 이야기(우리 집 현관 → 칠판 → 프롤로그 → 1-1 끝)를 순간이동 없이 걸어서 — 한 차시에 아이가 실제로 걷는 길
#   open    128초  처음 화면 · 첫날 시작 = 우리 집 현관 앞 첫 아침 · 위 가운데 첫 할 일 한 줄
#   save2   139초  저장 칸 · 처음부터/이어하기(이 기기) — 새로고침해도 같은 자리·가방·날
#   save      0초  저장 손실 막기(이 기기 ↔ 서버 가운데 더 진행한 것을 지킴 · 노드만)
#   save3    33초  저장 지키기(브라우저) + 홍보판에 ?game=town을 붙여도 마을이 안 열림
#   cloud    20초  반 계정판(v4 · 번호 + 비밀번호) 다른 기기에서 이어 받기 — 진짜 방 서버에 zz 시험 반으로 올리고 지움
#   emerg   498초  긴급 출동(112 · 119 · 불) 엔진 — 다니다 보면 저절로 생기는 사건이 끝까지 풀리나(그리기 켬 = 무거운 자리)
#   herd    104초  놀이 한 가지를 실제로 한 판씩(양몰이 맑음 1 · 비 1 · 개 1 = --n=1,1 · 기본 6,5판은 343초)
#   play2   125초  놀이 판마다 열어 크기·글자·단추(크롬북 · 휴대폰 세로·가로)
#   bag3     45초  가방(탭 넷 · 네모 칸 · 크게 보기 단추)
#   map2     65초  큰 지도 기호 수 · 작은 지도 내 화살표
#   indoor  334초  건물 들어가기(가게 전부 + 그 밖은 꼴마다 셋) — 들어가자마자 끼이지 않나
#   note     49초  알림 줄(중요한 알림이 묻히지 않음 · 지난 알림)
#   teach    52초  선생님 칸(잠긴 채로는 못 누름 · 비밀번호 뒤 장 열기·날 넘기기 · 반 표 = 흉내 서버를 스스로 띄움)
#   hud      40초  첫 화면에 보이는 것(크롬북 1366×768 · 휴대폰 세로 · 가로)
#   diag     18초  성능·현장 기록 한 가지(2코어 크롬북 흉내 · --quick)
#   뺀 것: pre(처음 화면 저장 칸 셋 — 맥이 조용하면 짓기가 단추보다 먼저 끝나 시험이 떨어짐 · 시험 쪽 경주) · enter 482초 · portal 907초(indoor가 같은 길을 봄)
#          deb2 228초(first가 같은 첫 장을 걸음) · go 87 · track 78 · controls 114 · tips 120 · read 99초(시간 때문에 — 그 기능을 고쳤을 때 CORE_LIST나 gm.sh로)
LIST=${CORE_LIST:-"gate first open save2 save save3 cloud emerg herd:--n=1,1 play2 bag3 map2 indoor note teach hud diag:--quick"}
NOBROWSER=" save ticolor "   # 브라우저를 안 여는 시험(node만) = 자리(b2.sh)를 기다리지 않음
[ -e node_modules ] || { echo "node_modules가 없어요 — 저장소 뿌리에서 npm install(또는 원래 저장소의 node_modules를 ln -s)"; echo DONE; exit 2; }
mkdir -p $OUT; rm -f $OUT/*.log(N) $OUT/*.res(N)
T0=$(date +%s)
while lsof -nP -iTCP:$P -sTCP:LISTEN >/dev/null 2>&1; do echo "포트 $P 사용 중 → $((P+1))"; P=$((P+1)); done
python3 -m http.server $P --bind 127.0.0.1 >/dev/null 2>&1 &!
SV=$!; sleep 1
lsof -nP -a -p $SV -iTCP:$P -sTCP:LISTEN >/dev/null 2>&1 || { echo "서버가 포트 $P를 못 잡음 — 멈춤"; kill $SV 2>/dev/null; echo DONE; exit 2; }
typeset -a RUN NAMES
killtree() { local c; for c in $(pgrep -P $1 2>/dev/null); do killtree $c; done; kill $1 2>/dev/null; }
bye() { local p; for p in $RUN; do killtree $p; done; kill $SV 2>/dev/null; }
trap 'bye; echo "멈춤"; echo DONE; exit 130' INT TERM
echo "핵심 시험 · 포트 $P · $(git rev-parse --short HEAD 2>/dev/null) · 기록 $OUT"
# 시험 하나: one <이름> <명령…> → 기록 $OUT/<이름>.log · 결과 한 줄 · $OUT/<이름>.res(rc ✗)
one() { local n=$1 s=$(date +%s) rc nf tail; shift
  if [[ $NOBROWSER == *" ${n#town_} "* ]]; then perl -e 'alarm shift; exec @ARGV' $LIMIT "$@" > $OUT/$n.log 2>&1; rc=$?
  else zsh tools/ops/b2.sh perl -e 'alarm shift; exec @ARGV' $LIMIT "$@" > $OUT/$n.log 2>&1; rc=$?; fi
  nf=$(grep -c "✗" $OUT/$n.log)
  if [ $rc = 0 ] && [ $nf = 0 ]; then tail=$(grep -E "^CHECK PASS" $OUT/$n.log | cut -c1-150)
  else tail="$(grep "✗" $OUT/$n.log | head -2 | cut -c1-150 | tr '\n' '|') $(tail -1 $OUT/$n.log | cut -c1-150)"; [ $rc = 142 ] && tail="시간 초과(${LIMIT}초) $tail"; fi
  echo "$n rc=$rc ✗=$nf $(( $(date +%s) - s ))초${tail:+ :: $tail}"
  echo "$rc $nf" > $OUT/$n.res; }
# ①②③ 차례대로(맵 관문 둘은 그림을 켜는 무거운 시험이라 하나씩)
one check node tools/harness/check.cjs . --full; NAMES+=(check)
PAGE=/ one promo node tools/harness/check.cjs . --full; NAMES+=(promo)
one ticolor node tools/harness/town_ticolor.cjs; NAMES+=(ticolor)
# ④ 둘씩 — 도는 시험 pid만 셈(서버는 일 목록에 없음)
for h in ${=LIST}; do n=${h%%:*}; a=""; [[ $h == *:* ]] && a=${h#*:}; a=${a//+/ }
  [ -f tools/harness/town_$n.cjs ] || { echo "town_$n rc=- ✗=- 0초 :: 하네스 파일이 없어요"; echo "1 1" > $OUT/town_$n.res; NAMES+=(town_$n); continue; }
  while true; do alive=(); for p in $RUN; do kill -0 $p 2>/dev/null && alive+=($p); done; RUN=($alive); (( ${#RUN} < 2 )) && break; sleep 2; done
  one town_$n node tools/harness/town_$n.cjs ourtown $P ${=a} & RUN+=($!); NAMES+=(town_$n)
  sleep 2
done
while true; do alive=(); for p in $RUN; do kill -0 $p 2>/dev/null && alive+=($p); done; RUN=($alive); (( ${#RUN} == 0 )) && break; sleep 2; done
kill $SV 2>/dev/null
ok=0; bad=()
for n in $NAMES; do r=($(cat $OUT/$n.res 2>/dev/null)); if [ "$r[1]" = 0 ] && [ "$r[2]" = 0 ]; then ok=$((ok+1)); else bad+=($n); fi; done
S=$(( $(date +%s) - T0 ))
echo "통과 $ok / 전체 ${#NAMES} · 걸린 $((S/60))분 $((S%60))초"
(( ${#bad} )) && echo "떨어진 것: $bad · 기록 $OUT/<이름>.log"
echo DONE
(( ${#bad} == 0 ))
