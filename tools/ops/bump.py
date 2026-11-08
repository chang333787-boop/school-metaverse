#!/usr/bin/env python3
# 캐시 번호 올리기(메인 합치기용 · 10-31 · 옛 scratchpad bump.py 대신 저장소에 둠)
# 쓰는 법: python3 tools/ops/bump.py <합치기 폴더>
#   - 스테이지된 변경(git diff --cached HEAD) 가운데 v2/games/*.js 모듈 → 그 모듈을 부르는 모든 '?v=' 를 (지금 최대 + 1)로
#   - v2/games/town*.js 가 하나라도 바뀌면 registry.js 의 town v +1
#   - v2/js/*.js(main.js 제외)가 바뀌면 main.js 안의 그 파일 ?v= +1 · v2/js 가 하나라도 바뀌면 v2·v3 index.html 의 main.js?v= +1
#   - 루트 index.html(홍보판)은 건드리지 않음
#   - 같은 모듈을 서로 다른 ?v=로 부르는 곳은 늘 가장 큰 번호로 맞춤(PERF-B 11-08 · town_lad.js v5·v6이 두 번 받히던 것)
#   - 안의 import 번호만 바뀐 모듈(예: town_game.js를 부르는 town_bag.js)도 자기 번호를 올림 — 끝날 때까지 되풀이(PERF-B 11-08)
import sys, re, glob, subprocess, os
M = sys.argv[1] if len(sys.argv) > 1 else '.'
ch = subprocess.run(['git', '-C', M, 'diff', '--cached', '--name-only', 'HEAD'], capture_output=True, text=True).stdout.split()
games = [p for p in ch if p.startswith('v2/games/') and p.endswith('.js')]
jsmods = [p for p in ch if p.startswith('v2/js/') and p.endswith('.js')]
files = glob.glob(os.path.join(M, 'v2/games/*.js')) + glob.glob(os.path.join(M, 'v2/js/*.js'))
src = {f: open(f, encoding='utf-8').read() for f in files}
orig = dict(src)
out = []
def bump_name(name):
    # (?<=/) = 이름 앞은 '/'(./x.js · ../js/x.js) — PERF-B 11-08: 예전엔 'photo.js'가 'town_photo.js?v='까지 같이 바꿨음
    rx = r'(?<=/)' + re.escape(name) + r'\?v=(\d+)'
    vs = [int(v) for f in files for v in re.findall(rx, src[f])]
    if not vs: return
    nv = max(vs) + 1
    for f in files: src[f] = re.sub(r'(?<=/)' + re.escape(name) + r'\?v=\d+', name + '?v=%d' % nv, src[f])
    out.append('%s -> %d' % (name, nv))
def unify():
    # 같은 모듈(가리키는 실제 파일)을 서로 다른 ?v=로 부르면 브라우저가 두 번 받고 두 벌로 돎(11-08 town_lad.js v5·v6) → 가장 큰 번호로 맞춤
    #   손으로 고치거나 합치다 어긋난 것까지 — 이번에 바뀐 모듈이 아니어도 늘 봄
    spec = re.compile(r"""(['"`])(\.{1,2}/[A-Za-z0-9_./-]+?\.js)\?v=(\d+)""")
    seen = {}
    for f in files:
        for m in spec.finditer(src[f]):
            k = os.path.normpath(os.path.join(os.path.dirname(f), m.group(2)))
            seen.setdefault(k, set()).add(int(m.group(3)))
    for k, vs in sorted(seen.items()):
        if len(vs) < 2: continue
        nv = max(vs)
        for f in files:
            def fix(m, f=f):
                kk = os.path.normpath(os.path.join(os.path.dirname(f), m.group(2)))
                return m.group(1) + m.group(2) + '?v=%d' % nv if kk == k else m.group(0)
            src[f] = spec.sub(fix, src[f])
        out.append('맞춤 %s %s -> %d' % (os.path.relpath(k, M), '/'.join(str(v) for v in sorted(vs)), nv))
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
unify()
# 안의 import 번호만 바뀐 모듈도 자기 번호를 올림(PERF-B 11-08) — 안 올리면 캐시에 남은 옛 글이 옛 번호(예: town_game.js?v=53)를 불러 같은 모듈이 두 벌로 돎
#   진입 파일(town.js = registry v · main.js = index.html · registry.js)은 위에서 따로 올림 · 끝날 때까지 되풀이
ENTRY = ('town.js', 'main.js', 'registry.js')
done = set(os.path.basename(p) for p in games + jsmods)
while True:
    more = [f for f in files if src[f] != orig[f] and os.path.basename(f) not in ENTRY and os.path.basename(f) not in done]
    if not more: break
    for f in more:
        done.add(os.path.basename(f)); bump_name(os.path.basename(f))
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
