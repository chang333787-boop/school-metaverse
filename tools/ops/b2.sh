#!/bin/zsh
# b2.sh(10-24 저녁부터 씀 · fast1 제안) — b1.sh 다음 판 — FAST-1 그리기 끔 시험은 동시 셋까지, 그리기 켬 시험은 예전처럼 한 자리
# 쓰는 법은 b1.sh와 같음: zsh b1_proposal.sh node tools/harness/town_x.cjs ourtown 8xxx [--render]
# 바뀐 점
#  ① 브라우저 셈 = 진짜 크롬만: pgrep -f '^[^ ]*/chrome-headless-shell( |$)'(명령 줄이 크롬 실행 파일로 시작하는 것)
#     — 지금 b1.sh의 pgrep -f chrome-headless-shell은 'grep … chrome-headless-shell'을 품은 다른 세션의 기다리는 셸까지 한 대로 세어(10-24 실측 27101·71558 등) 아무도 못 들어가는 때가 잦음
#  ② 가벼운 시험(pw.cjs를 쓰는 하네스 + --render·--shots·--perf·--gpu·--before·RENDER=1 없음) = 자리 셋(nr1~3.lock) · 부하 8 아래 · 무거운 브라우저 하나 이하
#     — 가벼운 브라우저는 pw.cjs가 붙이는 이름표 --sm-norender로 따로 셈
#  ③ 무거운 시험(그리기 켬)은 예전 규칙 그대로(b1.lock 하나 · 부하 6 아래 · 맥 전체 무거운 브라우저 한 대 이하)
SP=${SM_OPS_DIR:-/tmp/sm-ops}; mkdir -p $SP
F=''; for a in "$@"; do case $a in *harness/*.cjs) F=$a;; esac; done
LIGHT=0
if [ -n "$F" ] && [ "$RENDER" != 1 ] && grep -q "require('./pw.cjs')" "$F" 2>/dev/null && ! printf '%s\n' "$@" | grep -qE '^--(render|shots|perf|gpu|before)'; then LIGHT=1; fi
count() { HV=0; LT=0; for q in $(pgrep -f '^[^ ]*/chrome-headless-shell( |$)'); do c=$(ps -o command= -p $q 2>/dev/null); case $c in *--type=*) continue;; esac
  case $c in *--sm-norender*) LT=$((LT+1));; *) HV=$((HV+1));; esac; done; }
# 메인(B1_MAIN=1) = 무거운 시험도 자기 자리 m1.lock · 부하 7 아래
if [ -n "$B1_MAIN" ] && [ $LIGHT = 0 ]; then while true; do ld=$(sysctl -n vm.loadavg | awk '{print int($2)}'); count; if [ "$ld" -lt 7 ] && [ $HV -lt 2 ] && mkdir $SP/m1.lock 2>/dev/null; then L=$SP/m1.lock; break; fi; sleep 10; done; trap 'rmdir "$L" 2>/dev/null' EXIT INT TERM; "$@"; exit $?; fi
L=''
while [ -z "$L" ]; do
  ld=$(sysctl -n vm.loadavg | awk '{print int($2)}'); count
  if [ $LIGHT = 1 ]; then
    if [ "$ld" -lt 8 ] && [ $HV -le 1 ] && [ $LT -lt 3 ]; then for k in 1 2 3; do mkdir $SP/nr$k.lock 2>/dev/null && { L=$SP/nr$k.lock; break; }; done; fi
  else
    if [ "$ld" -lt 6 ] && [ $HV -lt 2 ] && mkdir $SP/b2.lock 2>/dev/null; then L=$SP/b2.lock; fi
  fi
  [ -z "$L" ] && sleep 10
done
trap 'rmdir "$L" 2>/dev/null' EXIT INT TERM
"$@"
