# 드래곤 틀 — 종 표 한 줄 = 드래곤 하나 · Blender 4.2 명령줄(애드온 없이)
#   /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python tools/dragon_blender/dragon.py -- <출력 폴더> [종,종…]
#   → <출력 폴더>/<종>.glb (gltfpack 전) · 종: toothless gronckle nadder zippleback nightmare terror
# 모양 = 메타볼로 깎은 몸(몸통·목·머리·꼬리 한 덩어리) + 다리 덩어리 + 턱 덩어리 + 날개 막(두 겹)·살 + 판·가시·뿔 + 눈
# 빌리는 것은 알아볼 신호만(reference C 모양 신호 · 투슬리스 검은 몸·큰 초록 눈) · 색·무늬 배치는 우리 것
# 좌표: 앞 = Blender -Y(glTF +Z) · 위 = +Z · 단위 m · +X = 드래곤의 왼쪽(L) · 뼈 이름 = stage3_plan §4
# 무게는 자동 무게 대신 손으로 셈(사슬 투영 · 부품 통째) — 섬처럼 떨어진 조각도 늘 같은 결과
# 움직임은 게임 코드(dragon_rig.js)가 뼈를 직접 돌림 — 파일엔 애니메이션 없음
import bpy, bmesh, math, sys, os, json, random
from mathutils import Vector, Quaternion, noise
from mathutils.bvhtree import BVHTree
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blendkit import (lin, sm, link, activate, reset, metaball as _metaball, chain_elems, Geo, frame, tube, plate, leaf, blob, rot_from_axes,
                      geo_object, Chain, rigid, set_weights, paint, bake_ao, mat, armature, bind, export, finish, tris_of)

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUTDIR = argv[0] if argv else '/tmp/dragons'
ONLY = set(argv[1].split(',')) if len(argv) > 1 and argv[1] else None
os.makedirs(OUTDIR, exist_ok=True)
S = 1.0                                                  # 종마다 바뀌는 배율(설계 단위 → m)
def P(t, sx=1):                                          # 설계 좌표 → m(옆 거울 sx)
    return Vector((t[0] * sx, t[1], t[2])) * S
def metaball(name, elems, target, vox=0.034, smooth=6):  # 복셀·해상도는 종 배율 따라
    return _metaball(name, elems, target, vox * S, 0.045 * S, smooth)

# ═════════ 종 표 — 설계 단위(S를 곱해 m) · 왼쪽(+X)만 적고 오른쪽은 거울 ═════════
# body: 몸통·불룩(어깨·엉덩이) 타원체 · neck: 꺾은선 + 반지름 · head: 머리뼈·주둥이·턱 · tail: 꺾은선 + 반지름
# legs F/B: 어깨 → 팔꿈치 → 발(+반지름) · wing: S 어깨 E 팔꿈치 W 손목 F 손가락 끝들 H 몸에 붙는 곳
SPECIES = {
  'toothless': dict(key='tl', S=0.9, tris=(6400, 1500, 420), eye='drg_eye_tl', bodyMat='drg_body',
    col=dict(base=0x1e2129, belly=0x2a2d36, top=0x16181f, spot=None, membrane=0x1c1f27, claw=0x3a3a40, teeth=0xe8e2d0, mouth=0x5a1e24, plate=0x1a1c24),
    body=[((0, -0.55, 1.22), (0.58, 0.85, 0.6)), ((0, 0.35, 1.15), (0.48, 0.9, 0.5)), ((0, 1.05, 1.1), (0.5, 0.55, 0.5))],
    bulge=[((0.4, -0.66, 1.0), (0.24, 0.32, 0.38)), ((0.42, 1.05, 0.98), (0.3, 0.42, 0.42))],
    chest=(0, -0.95, 1.3), mid=(0, 0.2, 1.15), hips=(0, 1.0, 1.1),
    neck=[(0, -1.0, 1.34), (0, -1.5, 1.6), (0, -1.98, 1.88)], neckR=[(0.36, 0.34), (0.31, 0.3), (0.28, 0.27)],
    head=dict(base=(0, -1.98, 1.88), tip=(0, -3.12, 1.86),
              elems=[((0, -2.3, 1.95), (0.5, 0.52, 0.36)), ((0, -2.82, 1.86), (0.34, 0.38, 0.24)), ((0, -2.15, 1.78), (0.42, 0.3, 0.2))],
              jaw=dict(hinge=(0, -2.08, 1.74), tip=(0, -3.0, 1.66), elems=[((0, -2.58, 1.67), (0.31, 0.45, 0.12)), ((0, -2.22, 1.71), (0.36, 0.24, 0.14))]),
              eye=((0.34, -2.5, 2.0), 0.14, (0.62, -0.76, 0.14)), slit=True,
              teeth=dict(retract=True, up=((0, -2.76, 1.66), (0.27, 0.3), -75, 75, 9, 0.09), lo=((0, -2.7, 1.72), (0.24, 0.27), -70, 70, 8, 0.07)),
              ears=[((0.26, -2.05, 2.12), (0.56, -1.28, 2.44), 0.15, 'ear'), ((0.42, -2.18, 1.98), (0.8, -1.7, 2.05), 0.09, 'ear'),
                    ((0.12, -1.85, 2.2), (0.2, -1.36, 2.44), 0.06, 'head'), ((0.4, -2.0, 1.76), (0.62, -1.64, 1.7), 0.06, 'head')]),
    tail=[(0, 1.45, 1.06), (0, 2.3, 1.0), (0, 3.2, 0.95), (0, 4.0, 0.9), (0, 4.8, 0.86)], tailR=[(0.36, 0.33), (0.27, 0.24), (0.19, 0.17), (0.12, 0.11), (0.07, 0.065)],
    legs=dict(F=[(0.44, -0.68, 1.0), (0.47, -0.82, 0.52), (0.48, -0.95, 0.07)], FR=[0.18, 0.14, 0.12],
              B=[(0.44, 1.05, 1.0), (0.5, 0.86, 0.55), (0.5, 1.15, 0.07)], BR=[0.26, 0.16, 0.12], toes=3, toeL=0.2),
    wing=dict(S=(0.38, -0.75, 1.58), E=(1.65, -0.38, 1.92), W=(3.0, -0.78, 2.02),
              F=[(6.05, -0.15, 1.9), (5.4, 0.95, 1.82), (4.35, 1.62, 1.72), (2.95, 1.95, 1.62)], H=(0.45, 0.6, 1.45), sc=0.13, arm=0.085),
    ridge=[(-1.0, 0.11), (-0.3, 0.1), (0.4, 0.1), (1.1, 0.09), (1.9, 0.08), (2.7, 0.07), (3.5, 0.06)],
    finsMid=dict(at=(0.05, 3.45, 0.96), tip=(0.46, 3.72, 0.97), w=0.12),
    finsEnd=dict(at=(0.04, 4.62, 0.86), pts=[(0.04, -0.3, 0), (0.6, -0.04, 0.02), (0.72, 0.28, 0), (0.38, 0.33, 0), (0.04, 0.14, 0)], pro=True),
    flap=1.0),
  'gronckle': dict(key='gr', S=0.82, spotK=0.45, tris=(4400, 1100, 380), eye='drg_eye_gr', bodyMat='drg_body',
    col=dict(base=0x5e6450, belly=0xb38c5c, top=0x4c5242, spot=0x8a8c78, membrane=0x6e6650, claw=0x3a3630, teeth=0xe8dcc0, mouth=0x6a2a26, plate=0x6e6a56),
    body=[((0, 0.1, 1.15), (0.95, 1.05, 0.9)), ((0, -0.05, 0.85), (0.85, 0.85, 0.65)), ((0, 0.25, 1.6), (0.7, 0.75, 0.5))],
    bulge=[((0.55, -0.45, 0.85), (0.3, 0.32, 0.36)), ((0.56, 0.55, 0.85), (0.32, 0.36, 0.38))],
    knobs=16,
    chest=(0, -0.55, 1.2), mid=(0, 0.15, 1.15), hips=(0, 0.85, 1.05),
    neck=[(0, -0.6, 1.22), (0, -0.8, 1.24), (0, -0.98, 1.24)], neckR=[(0.5, 0.48), (0.46, 0.44), (0.44, 0.42)],
    head=dict(base=(0, -0.98, 1.24), tip=(0, -1.88, 1.12),
              elems=[((0, -1.15, 1.27), (0.5, 0.48, 0.42)), ((0, -1.22, 1.55), (0.42, 0.3, 0.15)), ((0, -1.55, 1.13), (0.38, 0.33, 0.3))],
              jaw=dict(hinge=(0, -0.95, 1.02), tip=(0, -1.95, 0.95), elems=[((0, -1.42, 0.88), (0.48, 0.5, 0.22)), ((0, -1.75, 0.92), (0.38, 0.25, 0.2))]),
              eye=((0.33, -1.38, 1.44), 0.09, (0.55, -0.7, 0.45)), slit=False,
              teeth=dict(retract=False, up=((0, -1.62, 0.98), (0.3, 0.22), -70, 70, 6, 0.06), lo=((0, -1.72, 1.06), (0.36, 0.22), -60, 60, 4, 0.13)),
              ears=[((0.42, -1.05, 1.44), (0.66, -0.82, 1.52), 0.11, 'ear'), ((0.18, -1.0, 1.62), (0.26, -0.75, 1.78), 0.07, 'head')]),
    tail=[(0, 0.95, 1.05), (0, 1.5, 0.9), (0, 1.95, 0.78)], tailR=[(0.42, 0.4), (0.27, 0.25), (0.2, 0.19)],
    club=((0, 2.08, 0.78), (0.3, 0.33, 0.28)),
    legs=dict(F=[(0.6, -0.5, 0.75), (0.64, -0.58, 0.38), (0.66, -0.62, 0.06)], FR=[0.21, 0.18, 0.15],
              B=[(0.62, 0.6, 0.75), (0.66, 0.5, 0.38), (0.68, 0.62, 0.06)], BR=[0.23, 0.18, 0.15], toes=3, toeL=0.14),
    wing=dict(S=(0.45, -0.25, 1.75), E=(0.95, -0.15, 2.0), W=(1.35, -0.3, 2.08),
              F=[(2.05, -0.1, 1.98), (1.9, 0.38, 1.88), (1.45, 0.62, 1.8)], H=(0.5, 0.35, 1.7), sc=0.12, arm=0.07),
    belly=dict(at=(0, -0.05, 0.8), r=(0.55, 1.05)),
    flap=3.2),
  'nadder': dict(key='nd', S=1.0, tris=(4300, 1300, 300), eye='drg_eye_nd', bodyMat='drg_body',
    col=dict(base=0x2e6a6e, belly=0xd8c89c, top=0x245558, spot=0x4a8a86, membrane=0x4a8c84, claw=0x2e2a26, teeth=0xeee6d2, mouth=0x6a2630, plate=0xd0683e),
    body=[((0, -0.35, 1.55), (0.48, 0.6, 0.55)), ((0, 0.2, 1.45), (0.42, 0.5, 0.48)), ((0, 0.65, 1.4), (0.44, 0.45, 0.45))],
    bulge=[((0.36, 0.58, 1.22), (0.26, 0.4, 0.44)), ((0.3, -0.45, 1.32), (0.16, 0.2, 0.22))],
    chest=(0, -0.7, 1.72), mid=(0, 0.15, 1.45), hips=(0, 0.95, 1.38),
    neck=[(0, -0.75, 1.78), (0, -1.05, 2.15), (0, -1.25, 2.5)], neckR=[(0.3, 0.29), (0.24, 0.23), (0.21, 0.2)],
    head=dict(base=(0, -1.25, 2.5), tip=(0, -2.42, 2.48),
              elems=[((0, -1.45, 2.65), (0.3, 0.38, 0.28)), ((0, -1.9, 2.55), (0.17, 0.38, 0.15)), ((0, -2.2, 2.5), (0.1, 0.22, 0.09))],
              jaw=dict(hinge=(0, -1.4, 2.5), tip=(0, -2.35, 2.42), elems=[((0, -1.85, 2.43), (0.15, 0.44, 0.075)), ((0, -1.55, 2.47), (0.2, 0.2, 0.09))]),
              eye=((0.23, -1.62, 2.72), 0.09, (0.8, -0.45, 0.35)), slit=True,
              teeth=dict(retract=False, up=((0, -1.95, 2.43), (0.12, 0.32), -55, 55, 6, 0.045), lo=None),
              ears=[((0.18, -1.38, 2.78), (0.38, -1.0, 2.98), 0.07, 'ear')],
              horn=[((0, -2.12, 2.57), (0, -2.26, 2.86), 0.06)],
              crest=dict(at=(0, -1.25, 2.78), n=9, len=(0.42, 0.62), r=0.05)),
    tail=[(0, 1.0, 1.38), (0, 1.8, 1.25), (0, 2.6, 1.05), (0, 3.4, 0.9)], tailR=[(0.32, 0.3), (0.22, 0.2), (0.14, 0.13), (0.08, 0.075)],
    tailSpikes=dict(at=(0, 3.15, 0.95), n=9, len=(0.3, 0.45), r=0.045),
    legs=dict(F=[(0.32, -0.5, 1.32), (0.38, -0.72, 1.02), (0.36, -0.6, 0.76)], FR=[0.1, 0.08, 0.06],
              B=[(0.38, 0.6, 1.2), (0.42, 0.35, 0.7), (0.42, 0.72, 0.07)], BR=[0.22, 0.13, 0.08], toes=3, toeL=0.24, biped=True),
    wing=dict(S=(0.32, -0.45, 1.88), E=(1.25, -0.2, 2.12), W=(2.2, -0.5, 2.22),
              F=[(3.9, 0.0, 2.12), (3.5, 0.75, 2.02), (2.75, 1.25, 1.9)], H=(0.38, 0.55, 1.65), sc=0.1, arm=0.065),
    backSpikes=[(-0.5, 0.08), (0.0, 0.09), (0.5, 0.09), (1.2, 0.08), (1.9, 0.07), (2.5, 0.06)],
    flap=1.3),
  'zippleback': dict(key='zb', S=1.16, tris=(3900, 1100, 200), eye='drg_eye_zb', bodyMat='drg_body', heads=('A', 'B'),
    col=dict(base=0x4f4a6e, belly=0xcdbb88, top=0x3e3a58, spot=0x6e6492, membrane=0x7a6a90, claw=0x2e2a30, teeth=0xeee6d2, mouth=0x5a2236, plate=0x8a7aa8),
    body=[((0, -0.3, 1.3), (0.5, 0.7, 0.48)), ((0, 0.6, 1.22), (0.45, 0.65, 0.45))],
    bulge=[((0.42, -0.35, 1.05), (0.2, 0.3, 0.32)), ((0.4, 0.75, 1.0), (0.22, 0.35, 0.38))],
    chest=(0, -0.8, 1.42), mid=(0, 0.2, 1.26), hips=(0, 1.0, 1.2),
    necks=[[(0.18, -0.85, 1.45), (0.5, -1.45, 2.25), (0.78, -1.85, 2.95)]], neckR=[(0.25, 0.24), (0.21, 0.2), (0.19, 0.18)], headShift=(-0.07, 0.57, 0.5),
    head=dict(base=(0.85, -2.42, 2.45), tip=(0.97, -3.34, 2.46),
              elems=[((0.9, -2.65, 2.55), (0.22, 0.32, 0.2)), ((0.95, -3.05, 2.48), (0.14, 0.3, 0.12))],
              jaw=dict(hinge=(0.9, -2.55, 2.4), tip=(0.97, -3.3, 2.38), elems=[((0.94, -2.95, 2.39), (0.12, 0.35, 0.065))]),
              eye=((1.05, -2.75, 2.62), 0.065, (0.8, -0.4, 0.45)), eye2=((0.75, -2.75, 2.62), 0.065, (-0.8, -0.4, 0.45)), slit=True,
              teeth=dict(retract=False, up=((0.95, -3.08, 2.4), (0.1, 0.24), -50, 50, 5, 0.04), lo=None),
              ears=[((1.02, -2.5, 2.68), (1.22, -2.18, 2.85), 0.06, 'ear'), ((0.78, -2.5, 2.68), (0.6, -2.18, 2.85), 0.06, 'ear2')],
              horn=[((1.0, -2.48, 2.72), (1.05, -2.2, 3.0), 0.045), ((0.8, -2.48, 2.72), (0.75, -2.2, 3.0), 0.045)]),
    tails=[[(0.1, 1.15, 1.15), (0.45, 2.2, 1.0), (0.9, 3.2, 0.85), (1.25, 4.1, 0.72)]], tailR=[(0.26, 0.25), (0.18, 0.17), (0.11, 0.1), (0.05, 0.05)],
    tailBones=[(0, 1.0, 1.2), (0, 4.1, 0.72)],
    legs=dict(F=[(0.42, -0.35, 0.95), (0.5, -0.45, 0.5), (0.55, -0.55, 0.06)], FR=[0.15, 0.11, 0.09],
              B=[(0.42, 0.75, 0.95), (0.5, 0.55, 0.5), (0.55, 0.75, 0.06)], BR=[0.18, 0.11, 0.09], toes=3, toeL=0.16),
    wing=dict(S=(0.32, -0.2, 1.62), E=(1.25, 0.0, 1.88), W=(2.25, -0.3, 1.95),
              F=[(3.85, 0.3, 1.85), (3.3, 1.05, 1.75), (2.45, 1.45, 1.62)], H=(0.38, 0.9, 1.45), sc=0.16, arm=0.06),
    backSpikes=[(-0.4, 0.07), (0.2, 0.07), (0.8, 0.06)],
    flap=1.2),
  'nightmare': dict(key='nm', S=0.94, tris=(4150, 1250, 280), eye='drg_eye_nm', bodyMat='nm_body',
    col=dict(base=0x6e2a20, belly=0xd29a52, top=0x4a1a16, spot=0x3a1612, membrane=0xa8522c, claw=0x2a2220, teeth=0xeee6d2, mouth=0x4a1418, plate=0xd8ccb0),
    body=[((0, -0.55, 1.62), (0.62, 0.9, 0.62)), ((0, 0.6, 1.5), (0.55, 0.75, 0.55))],
    bulge=[((0.48, -0.65, 1.3), (0.26, 0.36, 0.42)), ((0.48, 0.75, 1.28), (0.28, 0.45, 0.45))],
    chest=(0, -1.1, 1.8), mid=(0, 0.0, 1.58), hips=(0, 1.1, 1.5),
    neck=[(0, -1.15, 1.85), (0, -1.75, 2.08), (0, -2.15, 2.52), (0, -2.3, 3.0)], neckR=[(0.4, 0.38), (0.34, 0.32), (0.3, 0.29), (0.28, 0.27)],
    head=dict(base=(0, -2.3, 3.0), tip=(0, -3.52, 3.02),
              elems=[((0, -2.65, 3.15), (0.36, 0.46, 0.32)), ((0, -3.15, 3.05), (0.25, 0.4, 0.2)), ((0, -2.55, 3.38), (0.3, 0.32, 0.12))],
              jaw=dict(hinge=(0, -2.48, 2.96), tip=(0, -3.45, 2.9), elems=[((0, -3.0, 2.9), (0.24, 0.46, 0.1)), ((0, -2.65, 2.94), (0.3, 0.25, 0.12))]),
              eye=((0.27, -2.88, 3.24), 0.085, (0.75, -0.55, 0.35)), slit=True,
              teeth=dict(retract=False, up=((0, -3.12, 2.9), (0.2, 0.32), -70, 70, 8, 0.07), lo=((0, -3.05, 2.97), (0.18, 0.3), -60, 60, 6, 0.05)),
              ears=[((0.3, -2.5, 3.2), (0.62, -2.18, 3.38), 0.1, 'ear')],
              hornC=[[(0.22, -2.45, 3.38), (0.36, -2.1, 3.62), (0.43, -1.6, 3.78), (0.46, -1.12, 3.72)], [(0.3, -2.58, 3.0), (0.48, -2.38, 2.98), (0.66, -2.2, 2.92)]],
              hornR=[[0.1, 0.075, 0.045, 0.0], [0.06, 0.04, 0.0]]),
    tail=[(0, 1.2, 1.5), (0, 2.3, 1.35), (0, 3.5, 1.15), (0, 4.7, 0.98), (0, 5.8, 0.88)], tailR=[(0.42, 0.4), (0.3, 0.28), (0.2, 0.19), (0.12, 0.11), (0.06, 0.055)],
    tailFin=dict(at=(0, 5.45, 0.92), pts=[(0, -0.35, 0.08), (0, 0.1, 0.45), (0, 0.55, 0.18), (0, 0.6, -0.1), (0, 0.1, -0.12)]),
    legs=dict(F=[(0.48, -0.65, 1.2), (0.55, -0.82, 0.62), (0.58, -0.95, 0.07)], FR=[0.2, 0.15, 0.12],
              B=[(0.48, 0.75, 1.2), (0.56, 0.5, 0.62), (0.58, 0.8, 0.07)], BR=[0.27, 0.16, 0.12], toes=3, toeL=0.22),
    wing=dict(S=(0.45, -0.75, 2.0), E=(2.0, -0.4, 2.42), W=(3.65, -0.95, 2.55),
              F=[(7.1, -0.25, 2.35), (6.45, 1.25, 2.22), (5.2, 2.2, 2.08), (3.6, 2.6, 1.95)], H=(0.5, 0.9, 1.75), sc=0.32, arm=0.1, claw=True, tipClaws=True),
    mane=[(-2.3, 0.14), (-2.0, 0.16), (-1.6, 0.16), (-1.2, 0.15)],
    backSpikes=[(-0.7, 0.13), (-0.1, 0.13), (0.5, 0.12), (1.2, 0.12), (2.0, 0.11), (2.8, 0.1), (3.6, 0.09), (4.4, 0.07)],
    flap=0.85),
  'terror': dict(key='tt', S=0.133, tris=(1000, 240, 80), eye='drg_eye_tt', bodyMat='drg_body', vox=0.05,
    col=dict(base=0xc0602e, belly=0xf0d8a2, top=0xa04c22, spot=0x8a3a1a, membrane=0xd88a4c, claw=0x3a2a22, teeth=0xf2ead6, mouth=0x6a2626, plate=0xe0a050),
    body=[((0, -0.45, 1.35), (0.58, 0.64, 0.58)), ((0, 0.22, 1.2), (0.46, 0.46, 0.44))],
    bulge=[((0.38, -0.5, 1.05), (0.2, 0.26, 0.3)), ((0.38, 0.3, 1.0), (0.24, 0.3, 0.34))],
    chest=(0, -0.9, 1.5), mid=(0, -0.15, 1.28), hips=(0, 0.55, 1.18),
    neck=[(0, -0.95, 1.55), (0, -1.15, 1.72), (0, -1.3, 1.88)], neckR=[(0.32, 0.31), (0.3, 0.29), (0.3, 0.29)],
    head=dict(base=(0, -1.3, 1.88), tip=(0, -2.45, 1.82),
              elems=[((0, -1.6, 2.0), (0.55, 0.58, 0.5)), ((0, -2.15, 1.85), (0.32, 0.38, 0.26))],
              jaw=dict(hinge=(0, -1.5, 1.7), tip=(0, -2.4, 1.64), elems=[((0, -2.05, 1.65), (0.28, 0.36, 0.11))]),
              eye=((0.36, -1.88, 2.12), 0.21, (0.72, -0.62, 0.25)), slit=True,
              teeth=dict(retract=False, up=((0, -2.2, 1.62), (0.22, 0.25), -60, 60, 4, 0.05), lo=None),
              ears=[((0.38, -1.4, 2.3), (0.74, -1.02, 2.58), 0.17, 'ear'), ((0.2, -1.28, 2.45), (0.32, -0.95, 2.72), 0.1, 'ear')]),
    tail=[(0, 0.65, 1.15), (0, 1.35, 1.08), (0, 1.95, 1.0), (0, 2.45, 0.98)], tailR=[(0.26, 0.25), (0.15, 0.14), (0.09, 0.085), (0.05, 0.045)],
    tailFin=dict(at=(0, 2.35, 0.99), pts=[(0, -0.1, 0.0), (0.28, 0.2, 0.0), (0.0, 0.62, 0.0), (-0.28, 0.2, 0.0)], flat=True),
    legs=dict(F=[(0.38, -0.5, 1.0), (0.44, -0.6, 0.52), (0.46, -0.7, 0.07)], FR=[0.15, 0.12, 0.1],
              B=[(0.38, 0.32, 0.95), (0.44, 0.18, 0.5), (0.46, 0.38, 0.07)], BR=[0.2, 0.12, 0.1], toes=3, toeL=0.16),
    wing=dict(S=(0.32, -0.55, 1.72), E=(0.95, -0.4, 1.95), W=(1.5, -0.55, 2.05),
              F=[(2.4, -0.25, 1.98), (2.2, 0.3, 1.9), (1.7, 0.6, 1.8)], H=(0.36, 0.2, 1.5), sc=0.14, arm=0.08),
    backSpikes=[(-0.9, 0.1), (-0.4, 0.11), (0.1, 0.11), (0.6, 0.1), (1.1, 0.09), (1.6, 0.08)],
    flap=2.2),
  # 대장 드래곤(10장 · 팀 D) — 산 같은 덩어리 · 짧고 굵은 목 · 넓적한 머리(큰 턱) · 작은 눈(여기선 한 쌍 · 나머지 넷은 게임 코드 play/boss.js가 머리 뼈에 붙임) · 큰 날개 막 · 곤봉 꼬리
  # 몸길이 ≈ 76m · 날개 너비 ≈ 118m(S=7) · 색은 우리 것(잿빛 밤색 몸 · 녹슨 날개 막 · 뼈빛 가시) — 영화 배색 X
  'boss': dict(key='bs', S=7.0, spotK=0.6, tris=(10500, 2200, 800), eye='drg_eye_bs', bodyMat='drg_body',
    col=dict(base=0x5b5048, belly=0x8c7356, top=0x3f3732, spot=0x74604e, membrane=0x6e4636, claw=0x2a2420, teeth=0xd8ccb0, mouth=0x6a2418, plate=0xb3a68c),
    body=[((0, -0.4, 1.62), (1.15, 1.3, 0.98)), ((0, 0.8, 1.48), (1.05, 1.1, 0.88)), ((0, -1.3, 1.78), (0.92, 0.8, 0.82)), ((0, 0.1, 2.32), (0.78, 1.05, 0.52))],
    bulge=[((0.85, -0.9, 1.25), (0.42, 0.52, 0.56)), ((0.9, 1.0, 1.16), (0.5, 0.62, 0.56))],
    chest=(0, -1.3, 1.92), mid=(0, 0.0, 1.62), hips=(0, 1.2, 1.46),
    neck=[(0, -1.6, 2.02), (0, -2.15, 2.22), (0, -2.62, 2.3)], neckR=[(0.76, 0.72), (0.68, 0.65), (0.62, 0.6)],
    head=dict(base=(0, -2.62, 2.3), tip=(0, -4.3, 2.05),
              elems=[((0, -2.98, 2.5), (0.86, 0.72, 0.56)), ((0, -3.72, 2.2), (0.64, 0.72, 0.36)), ((0, -3.08, 2.86), (0.72, 0.42, 0.2)), ((0, -2.92, 2.06), (0.96, 0.52, 0.36))],
              jaw=dict(hinge=(0, -2.76, 1.9), tip=(0, -4.2, 1.74), elems=[((0, -3.5, 1.72), (0.72, 0.76, 0.2)), ((0, -2.96, 1.82), (0.86, 0.42, 0.24))]),
              eye=((0.64, -3.28, 2.56), 0.075, (0.78, -0.52, 0.34)), slit=False,
              teeth=dict(retract=False, up=((0, -3.86, 1.96), (0.56, 0.5), -80, 80, 12, 0.2), lo=((0, -3.72, 1.86), (0.5, 0.45), -75, 75, 10, 0.15)),
              ears=[((0.66, -2.76, 2.76), (1.28, -2.2, 3.18), 0.3, 'ear'), ((0.86, -2.86, 2.36), (1.56, -2.46, 2.42), 0.22, 'ear'), ((0.3, -2.56, 2.96), (0.5, -1.92, 3.44), 0.16, 'head')],
              horn=[((0.34, -3.92, 2.44), (0.42, -4.1, 2.82), 0.1), ((-0.34, -3.92, 2.44), (-0.42, -4.1, 2.82), 0.1)],
              hornC=[[(0.56, -2.6, 2.86), (0.92, -2.1, 3.26), (1.16, -1.5, 3.36), (1.22, -0.96, 3.1)], [(0.72, -2.92, 2.2), (1.16, -2.62, 2.0), (1.46, -2.26, 1.76)]],
              hornR=[[0.2, 0.15, 0.09, 0.0], [0.12, 0.08, 0.0]]),
    tail=[(0, 1.7, 1.36), (0, 2.8, 1.16), (0, 3.9, 0.96), (0, 4.9, 0.82), (0, 5.7, 0.74)], tailR=[(0.8, 0.75), (0.56, 0.52), (0.4, 0.38), (0.3, 0.28), (0.24, 0.22)],
    club=((0, 6.0, 0.74), (0.56, 0.66, 0.5)),
    legs=dict(F=[(0.95, -1.1, 1.26), (1.05, -1.26, 0.66), (1.1, -1.4, 0.08)], FR=[0.42, 0.34, 0.3],
              B=[(0.95, 1.05, 1.2), (1.1, 0.85, 0.62), (1.15, 1.15, 0.08)], BR=[0.5, 0.36, 0.3], toes=3, toeL=0.34),
    wing=dict(S=(0.8, -1.05, 2.36), E=(2.6, -0.7, 2.9), W=(4.4, -1.2, 3.0),
              F=[(8.4, -0.6, 2.86), (7.9, 1.0, 2.72), (6.6, 2.2, 2.56), (4.9, 2.9, 2.4)], H=(0.9, 1.1, 2.1), sc=0.22, arm=0.16, claw=True, tipClaws=True),
    mane=[(-2.25, 0.2), (-1.85, 0.22)],
    backSpikes=[(-1.2, 0.28), (-0.6, 0.32), (0.0, 0.34), (0.6, 0.32), (1.3, 0.3), (2.1, 0.26), (2.9, 0.22), (3.7, 0.18), (4.5, 0.14)],
    flap=0.4),
}

# ═════════ 짓기 ═════════
def shift_head(hd, d):
    d = Vector(d); mv = lambda t: tuple(Vector(t) + d)
    hd['base'], hd['tip'] = mv(hd['base']), mv(hd['tip'])
    hd['elems'] = [(mv(c), r) for c, r in hd['elems']]
    j = hd['jaw']; j['hinge'], j['tip'] = mv(j['hinge']), mv(j['tip']); j['elems'] = [(mv(c), r) for c, r in j['elems']]
    for k in ('eye', 'eye2'):
        if k in hd: hd[k] = (mv(hd[k][0]),) + tuple(hd[k][1:])
    for k in ('up', 'lo'):
        t = hd['teeth'].get(k)
        if t: hd['teeth'][k] = (mv(t[0]),) + tuple(t[1:])
    hd['ears'] = [(mv(a), mv(b), w, n) for a, b, w, n in hd['ears']]
    hd['horn'] = [(mv(a), mv(b), r) for a, b, r in hd.get('horn', [])]
    if 'crest' in hd: hd['crest']['at'] = mv(hd['crest']['at'])

def build(name, sp):
    global S
    if sp.get('headShift') and not sp.get('_shifted'): shift_head(sp['head'], sp['headShift']); sp['_shifted'] = True
    reset()
    S = sp['S']; key = sp['key']; C = {k: (lin(v) if v is not None else None) for k, v in sp['col'].items()}
    heads = sp.get('heads', ('',))
    B = {}                                                  # 뼈: 이름 → (머리, 꼬리, 부모, roll 맞출 Z 방향)
    def bone(n, h, t, par=None, roll=None): B[n] = (Vector(h), Vector(t), par, roll)
    bone('root', (0, 0, 0), (0, 0, 0.4 * S))
    H, M, Cc = P(sp['hips']), P(sp['mid']), P(sp['chest'])
    bone('hips', H, M, 'root'); bone('chest', M, Cc, 'hips')
    # ── 목·머리(지플백은 둘: 오른쪽 B는 거울) ──
    hd = sp['head']
    for hs in heads:
        sx = -1 if hs == 'B' else 1
        npts = [P(p, sx) for p in (sp['necks'][0] if 'necks' in sp else sp['neck'])]
        mid = len(npts) // 2
        bone('neck1' + hs, npts[0], npts[mid], 'chest'); bone('neck2' + hs, npts[mid], npts[-1], 'neck1' + hs)
        bone('head' + hs, P(hd['base'], sx), P(hd['tip'], sx), 'neck2' + hs)
        bone('jaw' + hs, P(hd['jaw']['hinge'], sx), P(hd['jaw']['tip'], sx), 'head' + hs)
        ec, er, en = hd['eye']; eyes = [(ec, en, 'L' if sx > 0 else 'R', 1)]
        if 'eye2' in hd: eyes.append((hd['eye2'][0], hd['eye2'][2], 'R' if sx > 0 else 'L', 1))
        else: eyes.append((ec, en, 'R', -1))
        for (c, nv, side, mx) in eyes:
            cc = P(c, sx * mx); nn = Vector((nv[0] * sx * mx, nv[1], nv[2])).normalized()
            bone('pupil' + hs + side, cc, cc + nn * 0.12 * S, 'head' + hs, Vector((0, 0, 1)))
        if hd['teeth'].get('retract'):
            u = hd['teeth']['up']; c0 = P(u[0]); bone('teeth', c0 + Vector((0, 0, 0.03 * S)), c0 + Vector((0, 0, -0.12 * S)), 'head')
            l = hd['teeth']['lo']; c1 = P(l[0]); bone('teethJ', c1 - Vector((0, 0, 0.03 * S)), c1 + Vector((0, 0, 0.12 * S)), 'jaw')
        for (b0, t0, w0, bn) in hd['ears']:
            if bn == 'ear':
                for s in ((1, -1) if not hs else (sx,)):
                    side = 'L' if s > 0 else 'R'; nm = 'ear' + hs + side
                    if nm not in B: bone(nm, P(b0, s), P(t0, s), 'head' + hs)
            if bn == 'ear2':
                side = 'R' if sx > 0 else 'L'; nm = 'ear' + hs + side
                bone(nm, P(b0, sx), P(t0, sx), 'head' + hs)
        if 'crest' in hd:
            c0 = P(hd['crest']['at']); bone('spines', c0, c0 + Vector((0, 0.3, 0.25)) * S, 'head')
    # ── 꼬리 뼈 여섯(꼬리 꺾은선을 같은 길이로 나눔) ──
    tl = [H] + [P(p) for p in (sp['tailBones'][1:] if 'tailBones' in sp else sp['tail'])]   # 지플백은 꼬리 둘의 가운데 선
    if 'club' in sp: tl.append(P(sp['club'][0]) + Vector((0, 0.25 * S, 0)))
    seg = [(tl[i + 1] - tl[i]).length for i in range(len(tl) - 1)]; tot = sum(seg)
    def along(d):
        for i, L in enumerate(seg):
            if d <= L or i == len(seg) - 1: return tl[i] + (tl[i + 1] - tl[i]) * min(1, d / L)
            d -= L
    prev = 'hips'
    for i in range(6):
        bone('tail%d' % (i + 1), along(tot * i / 6), along(tot * (i + 1) / 6), prev); prev = 'tail%d' % (i + 1)
    if 'finsEnd' in sp:
        fe = sp['finsEnd']; a = P(fe['at'])
        for s, side in ((1, 'L'), (-1, 'R')):
            bone('fin' + side, Vector((a.x * s, a.y, a.z)), Vector((a.x * s, a.y, a.z)) + Vector((0.6 * s, 0.25, 0)) * S, 'tail6')
    if 'tailSpikes' in sp:
        c0 = P(sp['tailSpikes']['at']); bone('spinesT', c0, c0 + Vector((0, 0.3 * S, 0.1 * S)), 'tail5')
    if 'belly' in sp:
        c0 = P(sp['belly']['at']); bone('belly', c0, c0 + Vector((0, 0, -0.3 * S)), 'hips')
    # ── 다리 ──
    lg = sp['legs']
    for s, side in ((1, 'L'), (-1, 'R')):
        for fb, par in (('F', 'chest'), ('B', 'hips')):
            p = [P(q, s) for q in lg[fb]]
            bone('leg' + fb + side, p[0], p[1], par); bone('leg' + fb + side + '2', p[1], p[2], 'leg' + fb + side)
    # ── 날개: wing1 위팔 · wing2 아래팔 · wing3~ 손가락(첫 손가락 = wing3) ──
    wg = sp['wing']
    for s, side in ((1, 'L'), (-1, 'R')):
        Sh, E, W = P(wg['S'], s), P(wg['E'], s), P(wg['W'], s)
        bone('wing1' + side, Sh, E, 'chest', Vector((0, 0, 1))); bone('wing2' + side, E, W, 'wing1' + side, Vector((0, 0, 1)))
        for i, f in enumerate(wg['F']): bone('wing%d%s' % (3 + i, side), W, P(f, s), 'wing2' + side, Vector((0, 0, 1)))

    # ═════ 메시 ═════
    tris = sp['tris']; vox = sp.get('vox', 0.034)
    parts = []                                               # (물체, 무게 함수|목록, 색 함수|목록, AO?, 가림막?)
    # 몸 사슬(무게용)
    body_bones = ['hips', 'chest'] + ['tail%d' % (i + 1) for i in range(6)]
    for hs in heads: body_bones += ['neck1' + hs, 'neck2' + hs, 'head' + hs]
    bodyW = Chain(body_bones, B, 0.42 * S)
    def bodyWfn(p):
        ws = bodyW(p)
        if 'belly' in sp:                                    # 그롱클 배 — 둥근 둘레만 belly 뼈로
            d = (p - P(sp['belly']['at'])).length; r0, r1 = sp['belly']['r']; k = 1 - sm(r0 * S, r1 * S, d)
            if k > 0: ws = [(b, w * (1 - k)) for b, w in ws] + [('belly', k)]
        return ws
    # 색: 등 어둡게 · 배 밝게 · 무늬(점) · 위아래 섞임
    def body_col(co, n, base=None):
        base = base or C['base']
        k_belly = sm(-0.1, -0.65, n.z) * sm(1.25 * S, 0.7 * S, co.z) if C['belly'] else 0
        c = base.lerp(C['belly'], k_belly)
        c = c.lerp(C['top'], sm(0.55, 0.95, n.z) * 0.6)
        if C['spot'] is not None:
            nz = noise.noise(co * (2.2 / S) + Vector((3.1, 7.7, 1.3)))
            c = c.lerp(C['spot'], sm(0.18, 0.32, nz) * (1 - k_belly) * sp.get('spotK', 0.85))
        f = 0.94 + 0.08 * noise.noise(co * (5.0 / S))       # 붓 얼룩
        return c * f
    # ── 몸 메타볼 ──
    el = [(P(c), tuple(x * S for x in r), None) for c, r in sp['body']]
    for c, r in sp['bulge']:
        for s in (1, -1): el.append((P(c, s), tuple(x * S for x in r), None))
    for hs in heads:
        sx = -1 if hs == 'B' else 1
        npts = [P(p, sx) for p in (sp['necks'][0] if 'necks' in sp else sp['neck'])]
        el += chain_elems(npts, [tuple(x * S for x in r) for r in sp['neckR']])
        for c, r in hd['elems']: el.append((P(c, sx), tuple(x * S for x in r), None))
    for tpts in (sp['tails'] if 'tails' in sp else [sp['tail']]):
        for s in ((1, -1) if 'tails' in sp else (1,)):
            el += chain_elems([P(p, s) for p in tpts], [tuple(x * S for x in r) for r in sp['tailR']])
    if 'club' in sp: el.append((P(sp['club'][0]), tuple(x * S for x in sp['club'][1]), None))
    if sp.get('knobs'):
        rnd = random.Random(7)
        for i in range(sp['knobs']):
            a = rnd.uniform(0, 2 * math.pi); z = rnd.uniform(0.15, 0.95); r = math.sqrt(1 - z * z)
            d = Vector((math.cos(a) * r, math.sin(a) * r * 1.1, z)); c0 = Vector((0, 0.15, 1.15))
            el.append((P(c0 + Vector((d.x * 0.9, d.y * 1.0, d.z * 0.85))), (0.17 * S, 0.17 * S, 0.12 * S), Vector((0, 0, 1)).rotation_difference(d)))
        for i in range(6):                                   # 꼬리 곤봉 혹
            a = i * 1.05; c0 = Vector(sp['club'][0]); d = Vector((math.cos(a), 0.3, math.sin(a))).normalized()
            el.append((P(c0 + d * 0.3), (0.1 * S, 0.1 * S, 0.08 * S), None))
    body = metaball(key + '_body', el, tris[0], vox)
    parts.append((body, bodyWfn, body_col, True, True))
    # ── 다리 메타볼(몸과 따로 — 걸을 때 몸이 늘어나지 않게) ──
    el = []; legBones = []
    for s, side in ((1, 'L'), (-1, 'R')):
        for fb in ('F', 'B'):
            p = [P(q, s) for q in lg[fb]]; R = [x * S for x in lg[fb + 'R']]
            el += chain_elems([p[0], p[1]], [(R[0], R[0]), (R[1], R[1])], 0.45)
            el += chain_elems([p[1], p[2] + Vector((0, 0, 0.04 * S))], [(R[1], R[1]), (R[2], R[2])], 0.45)
            ft = p[2]; fw = R[2] * 1.05
            el.append((ft + Vector((0, -0.05 * S, 0.0)), (fw, fw * 1.35, fw * 0.55), None))   # 발바닥
            for k in range(lg['toes']):
                a = (k - (lg['toes'] - 1) / 2) * 0.5; d = Vector((math.sin(a) * s * 0.6, -math.cos(a), 0)).normalized()
                el.append((ft + d * lg['toeL'] * S * 0.8 + Vector((0, 0, -0.01 * S)), (fw * 0.4, lg['toeL'] * S * 0.55, fw * 0.4), Vector((0, 1, 0)).rotation_difference(d)))
            legBones += ['leg' + fb + side, 'leg' + fb + side + '2']
    legs = metaball(key + '_legs', el, tris[1], vox * 0.8)
    legW = Chain(legBones, B, 0.2 * S)
    parts.append((legs, legW, body_col, True, True))
    # ── 턱(머리마다) ──
    for hs in heads:
        sx = -1 if hs == 'B' else 1
        jw = hd['jaw']
        el = [(P(c, sx), tuple(x * S for x in r), None) for c, r in jw['elems']]
        jo = metaball(key + '_jaw' + hs, el, tris[2], vox * 0.8)
        hinge = P(jw['hinge'], sx); xs = [v.co.x for v in jo.data.vertices]; jx0, jw2 = (max(xs) + min(xs)) / 2, (max(xs) - min(xs)) / 2
        tipY = P(hd['tip'], sx).y
        def jaw_col(co, n, hinge=hinge, jx0=jx0, jw2=jw2, tipY=tipY):
            c = body_col(co, n)
            if n.z > 0.4 and co.z > hinge.z - 0.06 * S and abs(co.x - jx0) < jw2 * 0.72 and co.y > tipY + 0.06 * S:
                c = C['mouth'] * (0.8 + 0.2 * n.z)                  # 입 안 — 위 주둥이 밑에 숨는 곳만(닫으면 안 보임)
            return c
        parts.append((jo, rigid('jaw' + hs), jaw_col, True, True))

    # ── 작은 부품(판·가시·뿔·이빨·발톱·눈) — bmesh ──
    gB = Geo(key + '_bits', sp['bodyMat'], flat=True)      # 납작 면(판·가시)
    gS = Geo(key + '_round', sp['bodyMat'], flat=False)     # 둥근 작은 것(동공·이빨·발톱)
    gE = Geo(key + '_eye', sp['eye'], flat=False)
    for hs in heads:
        sx = -1 if hs == 'B' else 1
        # 눈 + 동공
        ec, er, en = hd['eye']
        eyes = [(ec, en, 'L' if sx > 0 else 'R', 1)]
        eyes.append((hd['eye2'][0], hd['eye2'][2], 'R' if sx > 0 else 'L', 1) if 'eye2' in hd else (ec, en, 'R', -1))
        for (c, nv, side, mx) in eyes:
            cc = P(c, sx * mx); nn = Vector((nv[0] * sx * mx, nv[1], nv[2])).normalized(); r = er * S
            q = Vector((0, 0, 1)).rotation_difference(nn)
            blob(gE, cc, (r, r, r), [('head' + hs, 1.0)], seg=12, rings=8, rot=q)
            # 동공: 눈 겉에서 조금 앞 · 세로로 긴 타원(뼈 X 크기로 가늘게)
            up = Vector((0, 0, 1)); ax = nn.cross(up).normalized(); upp = ax.cross(nn).normalized()
            rot = Vector((1, 0, 0)).rotation_difference(ax)
            pr = (r * 0.42, r * 0.7) if sp['head'].get('slit') else (r * 0.5, r * 0.55)
            pg_c = cc + nn * (r * 0.97)
            qq = rot_from_axes(ax, nn, upp)
            blob(gS, pg_c, (pr[0], r * 0.12, pr[1]), [('pupil' + hs + side, 1.0)], C['claw'] * 0.05 + Vector((0.004, 0.004, 0.004)), seg=12, rings=7, rot=qq)
        # 귀 판·볏
        for (b0, t0, w0, bn) in hd['ears']:
            for s in ((1, -1) if not hs else (sx,)):
                if bn == 'ear2':
                    s2 = sx; side = 'R' if sx > 0 else 'L'; bnm = 'ear' + hs + side
                elif bn == 'ear':
                    s2 = s; side = 'L' if s > 0 else 'R'; bnm = 'ear' + hs + side
                else:
                    s2 = s; bnm = 'head' + hs
                b, t = P(b0, s2), P(t0, s2); d = t - b
                side_v = d.cross(Vector((0, 0, 1))).normalized(); nrm = side_v.cross(d).normalized()
                if nrm.z < 0: nrm = -nrm
                ox = 1 if b.x > 0.02 * S else (-1 if b.x < -0.02 * S else 0)
                nrm = (nrm + Vector((ox * 1.1, 0, 0))).normalized()            # 위 + 바깥을 봄 → 옆에서도 넓게 보임
                side_v = d.cross(nrm).normalized()
                plate(gB, leaf(b, t, side_v, w0 * S), nrm, 0.03 * S, [(bnm, 1.0)], C['plate'] if name != 'toothless' else C['base'])
                if bn == 'ear2': break
        # 뿔
        for (b0, t0, r0) in hd.get('horn', []):
            b, t = P(b0, sx), P(t0, sx)
            tube(gS, [b, b.lerp(t, 0.5), t], [r0 * S, r0 * S * 0.6, 0], lambda p, hs=hs: [('head' + hs, 1.0)], sides=6, col=C['plate'])
        for pts, rr in zip(hd.get('hornC', []), hd.get('hornR', [])):
            for s in (1, -1):
                tube(gS, [P(p, s) for p in pts], [r * S for r in rr], lambda p: [('head', 1.0)], sides=7, col=C['plate'])
        # 볏 가시(내더 — spines 뼈)
        if 'crest' in hd:
            cr = hd['crest']; c0 = P(cr['at']); n = cr['n']
            for k in range(n):
                a = (k / (n - 1) - 0.5) * 2.4                   # 옆으로 부채
                d = Vector((math.sin(a) * 0.9, 0.75, 0.55 + math.cos(a) * 0.5)).normalized()
                L = (cr['len'][0] + (cr['len'][1] - cr['len'][0]) * math.cos(a * 0.6)) * S
                b = c0 + Vector((math.sin(a) * 0.16, 0.05 * abs(math.sin(a)), -0.06 * abs(math.sin(a)))) * S
                tube(gS, [b, b + d * L * 0.55, b + d * L], [cr['r'] * S, cr['r'] * S * 0.55, 0], rigid('spines'), sides=5, col=C['plate'])
        # 이빨
        th = hd['teeth']
        for which, spec in (('up', th['up']), ('lo', th.get('lo'))):
            if not spec: continue
            c0, rr, a0, a1, n, L = spec; c0 = P(c0, sx)
            for k in range(n):
                a = math.radians(a0 + (a1 - a0) * k / max(1, n - 1))
                p = c0 + Vector((math.sin(a) * rr[0], -math.cos(a) * rr[1], 0)) * S
                tip = p + Vector((0, -0.01 * S, (-1 if which == 'up' else 1) * L * S * (0.8 + 0.4 * math.cos(a) ** 4)))
                bn = ('teeth' if which == 'up' else 'teethJ') if th.get('retract') else ('head' + hs if which == 'up' else 'jaw' + hs)
                base = p + Vector((0, 0, (0.03 if which == 'up' else -0.03) * S))
                tube(gS, [base, tip], [L * S * 0.28, 0], rigid(bn), sides=5, col=C['teeth'], cap=True)
    # 등 줄 판(투슬리스) · 등 가시(다른 종) · 목 갈기
    bvh = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
    def top_at(y, x=0.0):
        h = bvh.ray_cast(Vector((x, y, 10 * S)), Vector((0, 0, -1)), 30 * S)
        return h[0]
    for (y, hgt) in sp.get('ridge', []):
        p = top_at(y * S)
        if p is None: continue
        L = 0.24 * S; hh = hgt * S * 1.2
        outl = [p + Vector((0, -L * 0.5, -0.03 * S)), p + Vector((0, L * 0.1, hh)), p + Vector((0, L * 0.5, -0.03 * S))]
        plate(gB, outl, Vector((1, 0, 0)), 0.025 * S, bodyWfn(p), C['plate'] if name != 'toothless' else C['top'])
    for (y, hgt) in sp.get('backSpikes', []) + sp.get('mane', []):
        p = top_at(y * S)
        if p is None: continue
        tube(gS, [p - Vector((0, 0, 0.03 * S)), p + Vector((0, 0.06 * S, hgt * S * 1.4))], [hgt * S * 0.45, 0], lambda q, p=p: bodyWfn(p), sides=5, col=C['plate'])
    # 꼬리 가시(내더 spinesT)
    if 'tailSpikes' in sp:
        ts = sp['tailSpikes']; c0 = P(ts['at'])
        for k in range(ts['n']):
            a = 2 * math.pi * k / ts['n'] + 0.3
            d = Vector((math.cos(a), 0.55, math.sin(a) * 0.8 + 0.25)).normalized()
            L = (ts['len'][0] + (ts['len'][1] - ts['len'][0]) * (0.5 + 0.5 * math.sin(a))) * S
            b = c0 + Vector((0, (k % 3) * 0.08 * S, 0))
            tube(gS, [b, b + d * L], [ts['r'] * S, 0], rigid('spinesT'), sides=5, col=C['plate'])
    # 꼬리 가운데 날개 · 꼬리 끝 날개(투슬리스: 오른쪽 검정 원래 것 · 왼쪽은 가죽 날개 따로)
    if 'finsMid' in sp:
        fm = sp['finsMid']
        for s in (1, -1):
            b, t = P(fm['at'], s), P(fm['tip'], s); sd = (t - b).cross(Vector((0, 0, 1))).normalized()
            plate(gB, leaf(b, t, sd, fm['w'] * S, 0.4), Vector((0, 0, 1)), 0.02 * S, bodyWfn(b), C['base'])
    pro = None
    if 'finsEnd' in sp:
        fe = sp['finsEnd']; a = P(fe['at'])
        for s, side in ((-1, 'R'), (1, 'L')):
            pts = [Vector((a.x * s, a.y, a.z)) + Vector((q[0] * s, q[1], q[2])) * S for q in fe['pts']]
            if side == 'R':
                plate(gB, pts, Vector((0, 0, 1)), 0.025 * S, [('finR', 1.0)], C['base'])
            else:                                            # 가죽 꼬리날개(따로 켜고 끔) — 갈색 판 + 살 셋 + 붉은 띠
                gP = Geo(key + '_fin_pro', sp['bodyMat'], flat=True)
                leather = lin(0x7a4a26); strap = lin(0x5a3a22)
                plate(gP, pts, Vector((0, 0, 1)), 0.03 * S, [('finL', 1.0)], leather)
                root = pts[0]
                for q in (pts[1], pts[2], pts[3]):
                    tube(gP, [root + Vector((0, 0, 0.02 * S)), q + Vector((0, 0, 0.02 * S))], [0.018 * S, 0.012 * S], rigid('finL'), sides=4, col=strap)
                tube(gP, [root + Vector((-0.06 * s, -0.08, 0)) * S, root + Vector((0.12 * s, 0.04, 0)) * S], [0.05 * S, 0.05 * S], rigid('finL'), sides=6, col=strap)
                pro = gP
    if 'tailFin' in sp:
        tf = sp['tailFin']; a = P(tf['at'])
        pts = [a + Vector(q) * S for q in tf['pts']]
        nrm = Vector((0, 0, 1)) if tf.get('flat') else Vector((1, 0, 0))
        plate(gB, pts, nrm, 0.025 * S, bodyWfn(a), C['membrane'])
    # 발톱
    for s, side in ((1, 'L'), (-1, 'R')):
        for fb in ('F', 'B'):
            p = P(lg[fb][2], s); fw = lg[fb + 'R'][2] * S
            for k in range(lg['toes']):
                a = (k - (lg['toes'] - 1) / 2) * 0.5; d = Vector((math.sin(a) * s * 0.6, -math.cos(a), 0)).normalized()
                b = p + d * (lg['toeL'] * S * 1.25) + Vector((0, 0, 0.0))
                tube(gS, [b, b + d * fw * 0.7 + Vector((0, 0, -fw * 0.25))], [fw * 0.22, 0], rigid('leg' + fb + side + '2'), sides=5, col=C['claw'])
    # ── 날개 막(두 겹) + 살 ──
    gW = Geo(key + '_wing', sp['bodyMat'], flat=False)
    for s, side in ((1, 'L'), (-1, 'R')):
        wing_mesh(gW, wg, s, side, C)
    # 물체로 — 재질: 몸(정점색) · 눈(종마다 색)
    parts = [(o, w, c, ao, oc, sp['bodyMat']) for (o, w, c, ao, oc) in parts]
    for g in (gB, gS, gE, gW):
        parts.append((geo_object(g), g.w, g.c, False, False, g.mat))
    # ═════ 무게 · 색 · 그늘 → 하나로(몸 재질 + 눈 재질 = 그리기 둘) ═════
    main = finish(parts, 0.9 * S, 0.012 * S, None); main.name = key + '_body'
    outs = [main]
    if pro is not None:                                      # 가죽 꼬리날개 — 따로 켜고 끔(그리기 하나 더)
        pro_o = geo_object(pro); pro_o.data.materials.append(mat(sp['bodyMat'])); set_weights(pro_o, lst=pro.w); paint(pro_o, lambda co, n: C['base'], lst=pro.c)
        outs.append(pro_o)
    rig = armature(key + '_rig', B); bind(outs, rig)
    tri = sum(tris_of(o) for o in outs); dims = main.dimensions
    info = dict(species=name, tris=tri, bones=len(B), length=round(dims.y, 2), height=round(dims.z, 2), span=round(dims.x, 2))
    print('DRG-STATS %s tris=%d bones=%d len=%.2f h=%.2f span=%.2f' % (name, tri, len(B), dims.y, dims.z, dims.x))
    out = os.path.join(OUTDIR, name + '.glb'); export(out, [rig] + outs, info)
    print('DRG-OUT', out)


def wing_mesh(g, wg, s, side, C):
    """날개 막 — 손가락 사이 부채 칸 + 몸~팔 안쪽 칸 · 두 겹(위·아래) · 살(관)"""
    Sh, E, W, H = P(wg['S'], s), P(wg['E'], s), P(wg['W'], s), P(wg['H'], s)
    F = [P(f, s) for f in wg['F']]; fb = ['wing%d%s' % (3 + i, side) for i in range(len(F))]
    sc = wg.get('sc', 0.18); th = 0.022 * S
    cm = C['membrane']
    verts, wts, faces, key = [], [], [], {}
    def add(p, w):
        k = (round(p.x, 4), round(p.y, 4), round(p.z, 4))
        if k in key: return key[k]
        verts.append(p.copy()); wts.append(w); key[k] = len(verts) - 1; return key[k]
    NU, NV = 5, 3
    for i in range(len(F) - 1):                              # 바깥 칸(손가락 i ~ i+1)
        G = []
        for iu in range(NU + 1):
            u = iu / NU; row = []
            for iv in range(NV + 1):
                v = iv / NV; d = (F[i] - W).lerp(F[i + 1] - W, v); k = u * (1 - sc * math.sin(math.pi * v) * u)
                row.append(add(W + d * k, [(fb[i], 1 - v), (fb[i + 1], v)]))
            G.append(row)
        for iu in range(NU):
            for iv in range(NV): faces.append((G[iu][iv], G[iu + 1][iv], G[iu + 1][iv + 1], G[iu][iv + 1]))
    # 안쪽 칸(몸 옆 S→H ~ 팔 S→E→W→마지막 손가락)
    out_pts = [Sh, E, W, F[-1]]; Ls = [(out_pts[i + 1] - out_pts[i]).length for i in range(3)]; Lt = sum(Ls)
    obones = ['wing1' + side, 'wing2' + side, fb[-1]]
    def cout(u):
        d = u * Lt
        for i in range(3):
            if d <= Ls[i] or i == 2:
                t = min(1, d / Ls[i]); p = out_pts[i].lerp(out_pts[i + 1], t)
                if t > 0.8 and i < 2: w = [(obones[i], 1 - (t - 0.8) / 0.4), (obones[i + 1], (t - 0.8) / 0.4)]
                elif t < 0.2 and i > 0: w = [(obones[i], 0.5 + t / 0.4), (obones[i - 1], 0.5 - t / 0.4)]
                else: w = [(obones[i], 1.0)]
                return p, w
            d -= Ls[i]
    NU2, NV2 = 9, 3
    G = []
    for iu in range(NU2 + 1):
        u = iu / NU2; row = []
        for iv in range(NV2 + 1):
            v = iv / NV2
            uu = u * (1 - sc * 0.8 * math.sin(math.pi * v) * u)
            po, wo = cout(uu); pi = Sh.lerp(H, uu)
            hh = sm(0.25, 1.0, uu); wi = [('chest', 1 - hh), ('hips', hh)]
            # 몸에 붙는 가장자리(v=0)만 몸 뼈 · 나머지는 그 자리 팔 뼈 통째 — 섞으면 접을 때 펼친 자리에 반쯤 남아 옆으로 삐죽 나옴
            row.append(add(pi.lerp(po, v), wi if iv == 0 else wo))
        G.append(row)
    for iu in range(NU2):
        for iv in range(NV2): faces.append((G[iu][iv], G[iu + 1][iv], G[iu + 1][iv + 1], G[iu][iv + 1]))
    # 두 겹: 위 겹(법선 위) · 아래 겹(뒤집음)
    N = len(verts); top, bot = [], []
    for p, w in zip(verts, wts):
        top.append(g.add(p + Vector((0, 0, th * 0.5)), w, cm)); bot.append(g.add(p - Vector((0, 0, th * 0.5)), w, cm * 0.8))
    for f in faces:
        u = []
        for i in f:
            if i not in u: u.append(i)
        if len(u) < 3: continue
        a, b, c = verts[u[0]], verts[u[1]], verts[u[2]]
        n = (b - a).cross(c - a)
        if n.length < 1e-9 and len(u) == 4: a, b, c = verts[u[0]], verts[u[2]], verts[u[3]]; n = (b - a).cross(c - a)
        if n.z < 0: u = list(reversed(u))
        g.face([top[i] for i in u]); g.face([bot[i] for i in reversed(u)])
    # 살: 앞 가장자리(팔 → 첫 손가락) 굵게 · 다른 손가락 가늘게
    ar = wg.get('arm', 0.08) * S; dark = C['membrane'].lerp(C['base'], 0.6)
    arm_chain = Chain(['wing1' + side, 'wing2' + side, fb[0]], {
        'wing1' + side: (Sh, E, None), 'wing2' + side: (E, W, 'wing1' + side), fb[0]: (W, F[0], 'wing2' + side)}, 0.25 * S)
    tube(g, [Sh, E, W, W.lerp(F[0], 0.5), F[0]], [ar, ar * 0.8, ar * 0.7, ar * 0.4, ar * 0.15], arm_chain, sides=6, col=dark)
    for i in range(1, len(F)):
        tube(g, [W, W.lerp(F[i], 0.5), F[i]], [ar * 0.45, ar * 0.3, ar * 0.12], rigid(fb[i]), sides=5, col=dark)
    if wg.get('claw'):
        tube(g, [W, W + Vector((0.05 * s, -0.25, 0.12)) * S], [ar * 0.6, 0], rigid('wing2' + side), sides=5, col=C['claw'])
    if wg.get('tipClaws'):                                   # 손가락 끝이 막 밖으로 삐죽(너덜한 큰 날개 = 나이트메어 신호)
        for i in range(len(F)):
            d = (F[i] - W).normalized()
            tube(g, [F[i] - d * 0.05 * S, F[i] + d * 0.38 * S], [ar * 0.3, 0], rigid(fb[i]), sides=4, col=C['claw'])

for k, sp in SPECIES.items():
    if ONLY and k not in ONLY: continue
    build(k, sp)
