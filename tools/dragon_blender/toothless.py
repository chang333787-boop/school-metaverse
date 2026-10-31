# 투슬리스(검은 드래곤) 모델 — Blender 4.2 명령줄로 짓는다(애드온 없이도 됨)
#   /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python tools/dragon_blender/toothless.py -- <out.glb>
# 빌리는 것은 알아볼 특징만(검은 몸 · 큰 초록 눈 · 귀 판 · 왼 꼬리날개 없음 → 가죽 꼬리날개 따로) · 비례·모양은 새로(goal §2-2)
# 앞 = Blender -Y (glTF로 나가면 +Z) · 위 = +Z · 단위 m · 뼈 28개 · 애니메이션은 게임 코드가 뼈를 직접 돌림(파일에 안 넣음)
import bpy, bmesh, math, sys
from mathutils import Vector, Quaternion

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/toothless.glb'
TARGET_BODY_TRIS = 6000

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene

def activate(o):
    for x in bpy.context.view_layer.objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o

def mat(name, rgb):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*rgb, 1.0); p.inputs['Roughness'].default_value = 0.8
    return m

# ───── 몸: 메타볼(타원체)로 깎기 ─────
mb = bpy.data.metaballs.new('tl_mb'); mb.resolution = 0.045; mb.render_resolution = 0.045; mb.threshold = 0.6
mbo = bpy.data.objects.new('tl_mb', mb); scn.collection.objects.link(mbo)
def ell(co, r, rot=None, stiff=2.0):
    e = mb.elements.new(); e.type = 'ELLIPSOID'; e.co = co
    R = max(r); e.radius = R * 1.7; e.size_x, e.size_y, e.size_z = r[0] / R, r[1] / R, r[2] / R   # 겉면 ≈ 0.58×반지름(문턱 0.6 · 굳기 2) → 1.7배로 맞춤
    e.stiffness = stiff
    if rot: e.rotation = rot
    return e
def qx(deg): return Quaternion((1, 0, 0), math.radians(deg))
def qy(deg): return Quaternion((0, 1, 0), math.radians(deg))
def qz(deg): return Quaternion((0, 0, 1), math.radians(deg))

# 몸통: 가슴이 두툼하고 허리는 날씬 — 큰 고양이처럼
ell((0, -0.55, 1.22), (0.58, 0.85, 0.6))
ell((0, 0.35, 1.15), (0.48, 0.9, 0.5))
ell((0, 1.05, 1.1), (0.5, 0.55, 0.5))
# 목 · 머리(넓고 납작) · 주둥이 · 턱
for i, t in enumerate([0.0, 0.33, 0.66, 1.0]):
    ell((0, -1.25 - 0.75 * t, 1.42 + 0.42 * t), (0.33 - 0.04 * t, 0.36, 0.32 - 0.03 * t))
ell((0, -2.3, 1.95), (0.5, 0.52, 0.36))
ell((0, -2.82, 1.86), (0.34, 0.36, 0.24))
ell((0, -2.6, 1.7), (0.3, 0.42, 0.16))
# 꼬리: 굵게 시작해 가늘게(여덟 마디)
for i in range(9):
    t = i / 8
    ell((0, 1.55 + t * 3.2, 1.06 - t * 0.2), (0.36 * (1 - t) + 0.07, 0.42, 0.33 * (1 - t) + 0.06))
# 다리: 앞(어깨·팔·발) · 뒤(허벅지·정강이·발)
for s in (1, -1):
    ell((0.42 * s, -0.68, 0.82), (0.2, 0.24, 0.42))
    ell((0.46 * s, -0.78, 0.36), (0.14, 0.15, 0.3))
    ell((0.47 * s, -0.92, 0.09), (0.17, 0.25, 0.09))
    ell((0.44 * s, 1.08, 0.84), (0.27, 0.36, 0.44))
    ell((0.5 * s, 1.24, 0.38), (0.15, 0.17, 0.3))
    ell((0.5 * s, 1.1, 0.09), (0.17, 0.27, 0.09))
# 등 볏(작은 혹 몇 개)
for i in range(6):
    ell((0, -1.0 + i * 0.75, 1.72 - abs(i - 2) * 0.05), (0.05, 0.14, 0.08))

activate(mbo)
bpy.ops.object.convert(target='MESH')
body = bpy.context.view_layer.objects.active; body.name = 'tl_body'
for name, kw in (('REMESH', dict(mode='VOXEL', voxel_size=0.035)), ('SMOOTH', dict(factor=0.6, iterations=6))):
    m = body.modifiers.new(name, name)
    for k, v in kw.items(): setattr(m, k, v)
    bpy.ops.object.modifier_apply(modifier=m.name)
tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
dec = body.modifiers.new('DEC', 'DECIMATE'); dec.ratio = min(1.0, TARGET_BODY_TRIS / max(1, tris)); bpy.ops.object.modifier_apply(modifier='DEC')

# ───── 눈: 큰 공(재질 tl_eye · 동공은 게임 셰이더가 그림) ─────
eyes = []
for s in (1, -1):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.13, location=(0.33 * s, -2.5, 2.0))
    e = bpy.context.view_layer.objects.active; e.rotation_euler = (0, 0, math.radians(-20 * s)); eyes.append(e)

# ───── 귀 판: 머리 뒤로 누운 얇은 판(큰 둘 · 작은 둘) — 메타볼과 따로 지어야 또렷이 보임 · 뼈 earR/earL ─────
def plate(name, base, tipv, width, thick=0.05):
    b, t = Vector(base), Vector(tipv); d = (t - b); side = d.cross(Vector((0, 0, 1))).normalized() * width
    up = side.cross(d).normalized() * thick
    pts = [b - side, b + side, t + side * 0.25, t, t - side * 0.25]
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    top = [bm.verts.new(p + up) for p in pts]; bot = [bm.verts.new(p - up) for p in pts]
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(len(pts)):
        j = (i + 1) % len(pts); bm.faces.new((top[i], top[j], bot[j], bot[i]))
    bmesh.ops.triangulate(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); scn.collection.objects.link(o); return o
ears = []
for s in (1, -1):
    ears.append(plate('tl_ear_big', (0.27 * s, -2.05, 2.12), (0.5 * s, -1.35, 2.42), 0.13))
    ears.append(plate('tl_ear_mid', (0.4 * s, -2.2, 1.98), (0.72 * s, -1.75, 2.06), 0.08))
    ears.append(plate('tl_ear_sm', (0.12 * s, -1.85, 2.2), (0.18 * s, -1.4, 2.42), 0.06))
# ───── 동공: 눈 앞면의 납작한 타원 — 뼈 pupilR/L의 X 크기로 가늘게(경계)·둥글게(편안) ─────
pupils = []
EYE_N = {1: Vector((0.62, -0.76, 0.12)).normalized(), -1: Vector((-0.62, -0.76, 0.12)).normalized()}
for s in (1, -1):
    c = Vector((0.33 * s, -2.5, 2.0)) + EYE_N[s] * 0.115
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=1.0, location=c)
    pu = bpy.context.view_layer.objects.active; pu.scale = (0.05, 0.05, 0.085)
    pu.rotation_euler = (0, 0, math.atan2(EYE_N[s].x, -EYE_N[s].y) * -1)
    activate(pu); bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); pupils.append(pu)

# ───── 꼬리날개: 오른쪽 끝 날개(검정 · 원래 것) + 가운데 작은 날개 둘 · 왼쪽 끝은 없음 ─────
def fin_mesh(name, pts):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new(p) for p in pts]; bm.faces.new(vs)
    bmesh.ops.triangulate(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); scn.collection.objects.link(o); return o
tip = Vector((0, 4.72, 0.86))
fin_r = fin_mesh('tl_fin_r', [tip + Vector(p) for p in [(0.04, -0.35, 0), (0.62, -0.05, 0.02), (0.72, 0.28, 0.0), (0.38, 0.32, 0), (0.04, 0.12, 0)]])
fin_m = [fin_mesh('tl_fin_m%d' % i, [Vector((0, 3.55, 0.96)) + Vector((s * x, y, z)) for (x, y, z) in [(0.05, -0.2, 0), (0.42, 0.0, 0.02), (0.36, 0.22, 0), (0.05, 0.12, 0)]]) for i, s in enumerate((1, -1))]
# 가죽 꼬리날개(왼쪽 · 따로 켜고 끔): 갈색 판 + 살대 셋
fin_pro = fin_mesh('tl_fin_pro', [tip + Vector(p) for p in [(-0.04, -0.33, 0), (-0.6, -0.08, 0.02), (-0.7, 0.26, 0.0), (-0.36, 0.3, 0), (-0.04, 0.12, 0)]])

# ───── 날개: 테두리 다각형 → 삼각형 채우기 → 잘게 나눔 + 뼈대 살(관) ─────
def wing(side):
    s = side
    outline = [(0.36, -0.78, 1.56), (1.6, -0.36, 1.92), (3.0, -0.78, 2.02), (6.05, -0.15, 1.9), (5.15, 0.42, 1.84), (5.45, 1.02, 1.8),
               (4.5, 1.08, 1.74), (4.3, 1.72, 1.7), (3.38, 1.42, 1.64), (2.85, 1.98, 1.6), (1.9, 1.32, 1.55), (0.45, 0.55, 1.45)]
    me = bpy.data.meshes.new('tl_wing'); bm = bmesh.new()
    vs = [bm.verts.new((x * s, y, z)) for (x, y, z) in outline]
    f = bm.faces.new(vs if s > 0 else list(reversed(vs)))
    bmesh.ops.triangulate(bm, faces=[f], quad_method='BEAUTY', ngon_method='BEAUTY')
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, use_grid_fill=True)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free()
    w = bpy.data.objects.new('tl_wing_%s' % ('r' if s > 0 else 'l'), me); scn.collection.objects.link(w)
    # 살: 어깨→팔꿈치→손목→손가락 끝 넷을 가는 관으로(skin 수정자)
    pts = [outline[0], outline[1], outline[2], outline[3], outline[5], outline[7], outline[9]]
    rad = [0.09, 0.07, 0.06, 0.025, 0.025, 0.025, 0.025]
    edges = [(0, 1), (1, 2), (2, 3), (2, 4), (2, 5), (2, 6)]
    sm = bpy.data.meshes.new('tl_wbone'); sm.from_pydata([(x * s, y, z) for (x, y, z) in pts], edges, []); sm.update()
    so = bpy.data.objects.new('tl_wbone', sm); scn.collection.objects.link(so)
    sk = so.modifiers.new('SK', 'SKIN'); activate(so)
    for i, r in enumerate(rad): sm.skin_vertices[0].data[i].radius = (r, r)
    sm.skin_vertices[0].data[0].use_root = True
    bpy.ops.object.modifier_apply(modifier='SK')
    activate(w); so.select_set(True); bpy.ops.object.join()
    return w
wing_r, wing_l = wing(1), wing(-1)

# ───── 재질 · 정점색(등은 검정 · 배는 조금 밝은 남회색) ─────
M_BODY, M_EYE, M_PRO = mat('tl_body', (0.03, 0.035, 0.05)), mat('tl_eye', (0.45, 0.75, 0.25)), mat('tl_fin_pro', (0.42, 0.26, 0.14))
def paint(o, fn):
    me = o.data; ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
    for v in me.vertices: ca.data[v.index].color = (*fn(v.co), 1.0)
def body_col(co):
    k = max(0.0, min(1.0, (1.25 - co.z) / 0.9))                     # 아래로 갈수록 배
    return (0.025 + 0.04 * k, 0.03 + 0.045 * k, 0.045 + 0.06 * k)   # 거의 검정 · 배만 조금 남색
for o in [body, fin_r, *fin_m, wing_r, wing_l]:
    o.data.materials.clear(); o.data.materials.append(M_BODY); paint(o, body_col)
for e in eyes:
    e.data.materials.clear(); e.data.materials.append(M_EYE); paint(e, lambda co: (1, 1, 1))
M_PUP = mat('tl_pupil', (0.01, 0.01, 0.01))
for pu in pupils:
    pu.data.materials.clear(); pu.data.materials.append(M_PUP); paint(pu, lambda co: (1, 1, 1))
for e in ears:
    e.data.materials.clear(); e.data.materials.append(M_BODY); paint(e, body_col)
fin_pro.data.materials.clear(); fin_pro.data.materials.append(M_PRO); paint(fin_pro, lambda co: (1, 1, 1))

# 몸 + 눈 + 원래 꼬리날개를 한 메시로(그리기 줄이기) · 날개 둘도 합침 · 가죽 날개는 따로
activate(body)
for o in [*eyes, *pupils, *ears, fin_r, *fin_m, wing_r, wing_l]: o.select_set(True)
bpy.ops.object.join(); body = bpy.context.view_layer.objects.active; body.name = 'tl_body'
for p in body.data.polygons: p.use_smooth = True

# ───── 뼈대 28 ─────
arm = bpy.data.armatures.new('tl_rig'); rig = bpy.data.objects.new('tl_rig', arm); scn.collection.objects.link(rig)
activate(rig); bpy.ops.object.mode_set(mode='EDIT')
B = {}
def bone(name, h, t, parent=None, conn=False):
    b = arm.edit_bones.new(name); b.head = h; b.tail = t
    if parent: b.parent = B[parent]; b.use_connect = conn
    B[name] = b; return b
bone('hips', (0, 1.0, 1.1), (0, 0.2, 1.15))
bone('chest', (0, 0.2, 1.15), (0, -0.85, 1.28), 'hips', True)
bone('neck1', (0, -0.85, 1.32), (0, -1.5, 1.58), 'chest')
bone('neck2', (0, -1.5, 1.58), (0, -2.0, 1.88), 'neck1', True)
bone('head', (0, -2.0, 1.9), (0, -2.95, 1.9), 'neck2')
bone('jaw', (0, -2.3, 1.74), (0, -2.85, 1.66), 'head')
for s, n in ((1, 'R'), (-1, 'L')):
    bone('ear' + n, (0.26 * s, -2.05, 2.12), (0.36 * s, -1.55, 2.4), 'head')
    ec = Vector((0.33 * s, -2.5, 2.0)); EN = Vector((0.62 * s, -0.76, 0.12)).normalized()
    pb = bone('pupil' + n, ec, ec + EN * 0.12, 'head'); pb.roll = 0.0
prev = 'hips'
for i in range(6):
    t0, t1 = i / 6, (i + 1) / 6
    bone('tail%d' % (i + 1), (0, 1.0 + t0 * 3.85, 1.1 - t0 * 0.26), (0, 1.0 + t1 * 3.85, 1.1 - t1 * 0.26), prev, i > 0); prev = 'tail%d' % (i + 1)
for s, n in ((1, 'R'), (-1, 'L')):
    bone('armU' + n, (0.42 * s, -0.68, 1.05), (0.46 * s, -0.78, 0.5), 'chest')
    bone('armL' + n, (0.46 * s, -0.78, 0.5), (0.47 * s, -0.9, 0.08), 'armU' + n, True)
    bone('legU' + n, (0.44 * s, 1.08, 1.05), (0.5 * s, 1.24, 0.52), 'hips')
    bone('legL' + n, (0.5 * s, 1.24, 0.52), (0.5 * s, 1.12, 0.08), 'legU' + n, True)
    bone('wing1' + n, (0.36 * s, -0.7, 1.58), (1.6 * s, -0.36, 1.92), 'chest')
    bone('wing2' + n, (1.6 * s, -0.36, 1.92), (3.0 * s, -0.78, 2.02), 'wing1' + n, True)
    bone('wing3' + n, (3.0 * s, -0.78, 2.02), (5.4 * s, 0.6, 1.8), 'wing2' + n, True)
bpy.ops.object.mode_set(mode='OBJECT')

# 몸: 자동 무게 → 날개·눈·꼬리날개는 손으로 고침
activate(body); rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
VG = body.vertex_groups
def setw(v, pairs):
    for g in VG:
        try: g.remove([v.index])
        except RuntimeError: pass
    for name, w in pairs:
        if w > 0.001: VG[name].add([v.index], w, 'REPLACE')
eye_mi, pup_mi = body.data.materials.find('tl_eye'), body.data.materials.find('tl_pupil')
for p in body.data.polygons:
    if p.material_index == eye_mi:
        for vi in p.vertices: setw(body.data.vertices[vi], [('head', 1.0)])
    elif p.material_index == pup_mi:
        for vi in p.vertices:
            v = body.data.vertices[vi]; setw(v, [('pupilR' if v.co.x > 0 else 'pupilL', 1.0)])
for v in body.data.vertices:                                       # 귀 판(머리 뒤 · 위쪽으로 솟은 정점)
    x, y, z = v.co
    if -2.25 < y < -1.3 and z > 2.08 and abs(x) > 0.1 or (-2.3 < y < -1.7 and abs(x) > 0.55 and 1.9 < z < 2.2):
        setw(v, [('earR' if x > 0 else 'earL', 1.0)])
for v in body.data.vertices:
    x, y, z = v.co
    if abs(x) > 0.55 and z > 1.35:                                # 날개 막·살: 펼친 길이 따라 셋으로 나눔
        n = 'R' if x > 0 else 'L'; ax = abs(x)
        if ax < 1.6: a = (ax - 0.55) / 1.05; setw(v, [('chest', 1 - a), ('wing1' + n, a)])
        elif ax < 3.0: a = (ax - 1.6) / 1.4; setw(v, [('wing1' + n, 1 - a), ('wing2' + n, a)])
        else: a = min(1.0, (ax - 3.0) / 0.6); setw(v, [('wing2' + n, 1 - a), ('wing3' + n, a)])
    elif y > 3.3 and abs(x) > 0.12:                               # 꼬리날개
        setw(v, [('tail6' if y > 4.3 else 'tail5', 1.0)])
# 무게 없는 정점은 가장 가까운 뼈로(자동 무게가 실패한 조각)
bones_w = {b.name: (b.head_local + b.tail_local) / 2 for b in arm.bones}
empty = 0
for v in body.data.vertices:
    if not any(g.weight > 0.001 for g in v.groups):
        nb = min(bones_w, key=lambda k: (bones_w[k] - v.co).length); VG[nb].add([v.index], 1.0, 'REPLACE'); empty += 1

# 가죽 꼬리날개: tail6 하나에
activate(fin_pro); fin_pro.parent = rig
md = fin_pro.modifiers.new('ARM', 'ARMATURE'); md.object = rig
fin_pro.vertex_groups.new(name='tail6').add([v.index for v in fin_pro.data.vertices], 1.0, 'REPLACE')

tri_body = sum(len(p.vertices) - 2 for p in body.data.polygons)
print('DRG-STATS tris_body=%d tris_pro=%d bones=%d emptyW=%d dims=%s' % (tri_body, len(fin_pro.data.polygons), len(arm.bones), empty, tuple(round(d, 2) for d in body.dimensions)))

# ───── 내보내기 ─────
for x in bpy.context.view_layer.objects: x.select_set(False)
for o in (rig, body, fin_pro): o.select_set(True)
kw = dict(filepath=OUT, export_format='GLB', use_selection=True, export_skins=True, export_animations=False, export_yup=True, export_apply=True, export_normals=True)
try:
    bpy.ops.export_scene.gltf(**kw, export_vertex_color='ACTIVE')
except TypeError:
    bpy.ops.export_scene.gltf(**kw)
print('DRG-OUT', OUT)
