# 손에 드는 것 — props_hand.glb(메시 이름 = 물건 이름) · Blender 4.2 명령줄
#   Blender -b --factory-startup --python tools/dragon_blender/props.py -- <출력 폴더>
# 좌표 = 손 뼈 공간(viking.py handR): 원점 = 주먹 가운데 · a = 손 방향(손끝 쪽 · 팔을 내리면 아래) · f = 앞 · s = 옆(오른손이면 바깥)
#   게임은 메시를 handR 뼈에 그대로 붙임(위치·회전 0) — story/fx.js holdItem
# 이름: knife 칼 · sword 긴 칼 · axe 도끼(아스트리드) · shield 방패 · cod 대구 · salmon 연어 · fish(= 대구) · half 반 토막 생선 · eel 뱀장어
#       hammer 망치 · bola 볼라 · torch 횃불(불꽃 자리 = info.torchTip) · bucket 물통 · oil 기름 단지 · book 공책 · nip 드래곤 풀 · cloth 천
import bpy, math, sys, os
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blendkit import lin, reset, Geo, tube, plate, blob, geo_object, paint, mat, export, tris_of

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUTDIR = argv[0] if argv else '/tmp/props'
os.makedirs(OUTDIR, exist_ok=True)

def H(a, f, s=0.0): return Vector((s, -f, a))              # 손 공간 → Blender(glTF로 나가면 x = s · y = a · z = f)
W0 = [('x', 1.0)]
def nw(p): return W0
WOOD, DARKW, STEEL, IRON, LEATHER = lin(0x8a6440), lin(0x5a3e26), lin(0xc4c8c6), lin(0x5a5a58), lin(0x6a4630)
objs = []; info = {}

def done(g):
    o = geo_object(g); o.name = g.name; o.data.name = g.name
    o.data.materials.append(mat('vk_body')); paint(o, lambda co, n: Vector((0.5, 0.5, 0.5)), lst=g.c); objs.append(o); return o

def blade(g, f0, f1, w, col, th=0.006):
    plate(g, [H(-w * 0.9, f0), H(-w, f0 + (f1 - f0) * 0.65), H(0, f1), H(w, f0 + (f1 - f0) * 0.65), H(w * 0.9, f0)], Vector((1, 0, 0)), th, W0, col)

# 칼(히컵 단검)
g = Geo('knife', 'vk_body')
tube(g, [H(0, -0.06), H(0, 0.05)], [0.017, 0.017], nw, sides=6, col=LEATHER)
blob(g, H(0, -0.068), (0.022, 0.022, 0.022), W0, IRON, seg=6, rings=4)
blob(g, H(0, 0.058), (0.012, 0.012, 0.04), W0, IRON, seg=6, rings=4)
blade(g, 0.062, 0.32, 0.018, STEEL); done(g)
# 긴 칼
g = Geo('sword', 'vk_body')
tube(g, [H(0, -0.1), H(0, 0.08)], [0.02, 0.02], nw, sides=6, col=LEATHER)
blob(g, H(0, -0.11), (0.028,) * 3, W0, IRON, seg=6, rings=4)
blob(g, H(0, 0.09), (0.016, 0.016, 0.075), W0, IRON, seg=6, rings=4)
blade(g, 0.095, 0.78, 0.026, STEEL, 0.008); done(g)
# 도끼(양날)
g = Geo('axe', 'vk_body')
tube(g, [H(0, -0.18), H(0, 0.62)], [0.02, 0.02], nw, sides=6, col=WOOD)
for sg in (-1, 1):
    plate(g, [H(sg * 0.025, 0.47), H(sg * 0.17, 0.39), H(sg * 0.23, 0.52), H(sg * 0.17, 0.66), H(sg * 0.025, 0.58)], Vector((1, 0, 0)), 0.012, W0, STEEL)
blob(g, H(0, 0.525), (0.03, 0.06, 0.05), W0, IRON, seg=6, rings=4); done(g)
# 방패(둥근 나무 판 + 쇠 테 + 가운데 혹) — 판 면이 옆(s)을 봄
g = Geo('shield', 'vk_body'); c0 = H(0, 0.04, 0.07)
ring = [c0 + Vector((0, math.cos(t) * 0.34, math.sin(t) * 0.34)) for t in [i / 18 * 2 * math.pi for i in range(19)]]
tube(g, [c0 + Vector((-0.02, 0, 0)), c0 + Vector((0.02, 0, 0))], [0.34, 0.34], nw, sides=18,
     col=lambda p, i: WOOD * (0.85 + 0.15 * (int((p.y + 1) * 14) % 2)))
tube(g, ring, [0.018] * len(ring), nw, sides=5, col=IRON, cap=False)
blob(g, c0 + Vector((0.035, 0, 0)), (0.04, 0.07, 0.07), W0, IRON, seg=8, rings=5); done(g)
# 생선(꼬리를 쥠 · 몸은 손 아래로)
def fish(name, back, belly, half=False):
    g = Geo(name, 'vk_body')
    a0, a1 = (0.06, 0.3) if half else (0.02, 0.46)
    c = H((a0 + a1) / 2 + 0.03, 0)
    blob(g, c, (0.04, 0.068, (a1 - a0) / 2), W0, None, seg=10, rings=8)
    for i in range(len(g.v)):                                                          # 등(앞 f+)은 짙게 · 배는 밝게
        f = -g.v[i].y; g.c[i] = back.lerp(belly, max(0, min(1, 0.5 - f / 0.12)))
    if not half:
        plate(g, [H(0.07, 0), H(-0.01, -0.07), H(0.025, 0), H(-0.01, 0.07)], Vector((1, 0, 0)), 0.008, W0, back)   # 꼬리지느러미
    else:
        blob(g, H(a0 + 0.015, 0), (0.035, 0.06, 0.012), W0, lin(0xe89a86), seg=8, rings=4)                 # 잘린 면
    for sg in (-1, 1): blob(g, H(a1 - 0.03, 0.02, sg * 0.032), (0.009,) * 3, W0, lin(0x101010), seg=5, rings=3)
    done(g)
fish('cod', lin(0x6e7a6a), lin(0xd8dcd2)); fish('fish', lin(0x6e7a6a), lin(0xd8dcd2)); fish('salmon', lin(0x8a8a90), lin(0xf0b4a0))
fish('half', lin(0x6e7a6a), lin(0xd8dcd2), half=True)
# 뱀장어(구불구불 · 질겁하는 것)
g = Geo('eel', 'vk_body'); pts = [H(0.02 + 0.68 * t, 0.02 * math.sin(t * 9), 0.05 * math.sin(t * 7)) for t in [i / 12 for i in range(13)]]
tube(g, pts, [0.024 - 0.008 * i / 12 for i in range(13)], nw, sides=6, col=lambda p, i: lin(0x4a5430).lerp(lin(0x8a8a40), 0.3 * (i % 2)))
blob(g, pts[-1] + H(0.02, 0), (0.024, 0.03, 0.035), W0, lin(0x3a4428), seg=8, rings=5); done(g)
# 망치(대장간)
g = Geo('hammer', 'vk_body')
tube(g, [H(0, -0.08), H(0, 0.32)], [0.018, 0.018], nw, sides=6, col=WOOD)
tube(g, [H(-0.09, 0.31), H(0.06, 0.31)], [0.038, 0.038], nw, sides=6, col=IRON); done(g)
# 볼라(돌 셋 + 끈)
g = Geo('bola', 'vk_body')
for b in (H(0.32, 0.08), H(0.3, -0.05, 0.07), H(0.34, -0.04, -0.07)):
    tube(g, [H(0.02, 0), b], [0.006, 0.006], nw, sides=4, col=lin(0x8a7a5a), cap=False)
    blob(g, b, (0.042,) * 3, W0, lin(0x7a7a72), seg=8, rings=5)
done(g)
# 횃불(앞 위로 기울게 쥠 · 불꽃은 게임이 flameMesh로)
g = Geo('torch', 'vk_body'); d = (H(-0.55, 0.85) - H(0, 0)).normalized()
tube(g, [d * -0.1, d * 0.5], [0.02, 0.022], nw, sides=6, col=WOOD)
for k in range(3): blob(g, d * (0.47 + 0.035 * k), (0.045, 0.045, 0.045), W0, lin(0x3a2e24).lerp(lin(0xb09a7a), 0.4 * (k % 2)), seg=8, rings=5)
info['torchTip'] = [round(d.x, 3), round(d.z, 3), round(-d.y, 3)]            # 손 공간 방향(glTF x·y·z) × 0.58 m 근처가 불꽃 자리
done(g)
# 물통(손잡이로 듦 · 물 담김)
g = Geo('bucket', 'vk_body')
arc = [H(0.15 - 0.15 * math.sin(t), 0, 0.125 * math.cos(t)) for t in [i / 10 * math.pi for i in range(11)]]
tube(g, arc, [0.007] * len(arc), nw, sides=4, col=IRON, cap=False)
tube(g, [H(0.14, 0), H(0.42, 0)], [0.13, 0.115], nw, sides=12, col=lambda p, i: WOOD, cap=False)
tube(g, [H(0.415, 0), H(0.145, 0)], [0.11, 0.124], nw, sides=12, col=lambda p, i: DARKW, cap=False)          # 안쪽 벽(뒤집어)
blob(g, H(0.42, 0), (0.115, 0.115, 0.01), W0, DARKW, seg=12, rings=3)
blob(g, H(0.18, 0), (0.118, 0.118, 0.004), W0, lin(0x4a6a78), seg=12, rings=3)                               # 물
for a in (0.2, 0.37):
    ring = [H(a, math.cos(t) * (0.132 - 0.05 * (a - 0.14)), math.sin(t) * (0.132 - 0.05 * (a - 0.14))) for t in [i / 12 * 2 * math.pi for i in range(13)]]
    tube(g, ring, [0.008] * len(ring), nw, sides=4, col=IRON, cap=False)
done(g)
# 기름 단지
g = Geo('oil', 'vk_body')
blob(g, H(0.22, 0), (0.1, 0.1, 0.12), W0, lin(0x9a6a3a), seg=10, rings=7)
tube(g, [H(0.11, 0), H(0.05, 0)], [0.035, 0.03], nw, sides=8, col=lin(0x8a5a30))
tube(g, [H(0.06, 0.0, 0.03), H(0.03, 0, 0.08), H(0.12, 0, 0.1)], [0.012] * 3, nw, sides=4, col=lin(0x8a5a30), cap=False); done(g)
# 공책(가죽 표지 + 종이 결)
g = Geo('book', 'vk_body')
plate(g, [H(0.0, -0.09), H(0.0, 0.09), H(0.25, 0.09), H(0.25, -0.09)], Vector((1, 0, 0)), 0.036, W0, LEATHER)
plate(g, [H(0.012, 0.07), H(0.012, 0.096), H(0.238, 0.096), H(0.238, 0.07)], Vector((1, 0, 0)), 0.028, W0, lin(0xe8dcc0)); done(g)
# 드래곤 풀(한 다발)
g = Geo('nip', 'vk_body')
for k in range(6):
    an = k / 6 * 2 * math.pi; tip = H(-0.22 - 0.05 * (k % 2), 0.05 + 0.04 * math.cos(an), 0.05 * math.sin(an))
    tube(g, [H(0.02, 0), tip], [0.006, 0.004], nw, sides=4, col=lin(0x3a6a4a), cap=False)
    blob(g, tip, (0.025, 0.03, 0.045), W0, lin(0x3f9a86).lerp(lin(0x9ad8b8), 0.3 * (k % 3) / 2), seg=6, rings=4)
tube(g, [H(-0.02, 0, -0.02), H(-0.02, 0, 0.02)], [0.02, 0.02], nw, sides=6, col=lin(0x8a7a5a)); done(g)
# 천
g = Geo('cloth', 'vk_body')
blob(g, H(0.12, 0.02), (0.02, 0.11, 0.13), W0, lin(0xd8c8a0), seg=10, rings=6); done(g)

print('DRG-PROPS', ' '.join('%s:%d' % (o.name, tris_of(o)) for o in objs))
info['props'] = [o.name for o in objs]
export(os.path.join(OUTDIR, 'props_hand.glb'), objs, info)
