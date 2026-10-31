#!/bin/zsh
# 드래곤 게임 모델 다시 짓기 — Blender(모양·무게·그늘) → gltfpack(meshopt 압축) → dragon/assets/models/
#   zsh tools/dragon_blender/build.sh [dragons|people|props|all|pack] [이름,이름…]   (pack = SRC에 있는 glb만 압축)
#   gltfpack이 PATH에 없으면 GLTFPACK=<경로>로 · 없으면 npm install --prefix <임시> gltfpack@0.22.0 (goal §1 허락)
set -e
cd "$(dirname "$0")/../.."
BL=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
GP=${GLTFPACK:-gltfpack}
SRC=${SRC:-/tmp/drg_src}; mkdir -p $SRC
WHAT=${1:-all}; ONLY=${2:-}
pack() { for f in $SRC/*.glb; do n=$(basename $f); $GP -i $f -o dragon/assets/models/$n -cc -kn -km -ke >/dev/null && echo "  $n $(wc -c < dragon/assets/models/$n | tr -d ' ')B"; done; }
[[ $WHAT == pack ]] && { pack; exit 0; }
rm -f $SRC/*.glb
[[ $WHAT == dragons || $WHAT == all ]] && $BL -b --factory-startup --python tools/dragon_blender/dragon.py -- $SRC $ONLY 2>&1 | grep -E "^DRG|Error|Traceback" || true
[[ $WHAT == people || $WHAT == all ]] && $BL -b --factory-startup --python tools/dragon_blender/viking.py -- $SRC $ONLY 2>&1 | grep -E "^DRG|Error|Traceback" || true
[[ $WHAT == props || $WHAT == all ]] && $BL -b --factory-startup --python tools/dragon_blender/props.py -- $SRC 2>&1 | grep -E "^DRG|Error|Traceback" || true
pack
