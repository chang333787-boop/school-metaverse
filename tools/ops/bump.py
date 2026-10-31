#!/usr/bin/env python3
# 캐시 번호 올리기(메인 합치기용 · 10-31 · 옛 scratchpad bump.py 대신 저장소에 둠)
# 쓰는 법: python3 tools/ops/bump.py <합치기 폴더>
#   - 스테이지된 변경(git diff --cached HEAD) 가운데 v2/games/*.js 모듈 → 그 모듈을 부르는 모든 '?v=' 를 (지금 최대 + 1)로
#   - v2/games/town*.js 가 하나라도 바뀌면 registry.js 의 town v +1
#   - v2/js/*.js(main.js 제외)가 바뀌면 main.js 안의 그 파일 ?v= +1 · v2/js 가 하나라도 바뀌면 v2·v3 index.html 의 main.js?v= +1
#   - 루트 index.html(홍보판)은 건드리지 않음
import sys, re, glob, subprocess, os
M = sys.argv[1] if len(sys.argv) > 1 else '.'
ch = subprocess.run(['git', '-C', M, 'diff', '--cached', '--name-only', 'HEAD'], capture_output=True, text=True).stdout.split()
games = [p for p in ch if p.startswith('v2/games/') and p.endswith('.js')]
jsmods = [p for p in ch if p.startswith('v2/js/') and p.endswith('.js')]
files = glob.glob(os.path.join(M, 'v2/games/*.js')) + glob.glob(os.path.join(M, 'v2/js/*.js'))
src = {f: open(f, encoding='utf-8').read() for f in files}
out = []
def bump_name(name):
    vs = [int(v) for f in files for v in re.findall(re.escape(name) + r'\?v=(\d+)', src[f])]
    if not vs: return
    nv = max(vs) + 1
    for f in files: src[f] = re.sub(re.escape(name) + r'\?v=\d+', name + '?v=%d' % nv, src[f])
    out.append('%s -> %d' % (name, nv))
for p in games:
    n = os.path.basename(p)
    if n != 'registry.js': bump_name(n)
for p in jsmods:
    n = os.path.basename(p)
    if n != 'main.js': bump_name(n)
if any(os.path.basename(p).startswith('town') for p in games):
    rp = os.path.join(M, 'v2/games/registry.js')
    src[rp] = re.sub(r"(town: \{ title: '마을 세계', v: )(\d+)", lambda x: x.group(1) + str(int(x.group(2)) + 1), src[rp])
    out.append(re.search(r"town: \{ title: '마을 세계', v: \d+", src[rp]).group(0))
for f in files: open(f, 'w', encoding='utf-8').write(src[f])
if jsmods or games:
    for ix in ('v2/index.html', 'v3/index.html'):
        p = os.path.join(M, ix)
        if not os.path.exists(p): continue
        s = open(p, encoding='utf-8').read()
        s2 = re.sub(r'main\.js\?v=(\d+)', lambda x: 'main.js?v=%d' % (int(x.group(1)) + 1), s)
        open(p, 'w', encoding='utf-8').write(s2)
        out.append(ix + ' main.js +1')
print('\n'.join(out) or '바뀐 모듈 없음')
