# 드래곤 게임 모델 공장 공용 도구 — dragon.py · viking.py · props.py가 함께 씀(Blender 4.2 · 애드온 없이)
# 메타볼 덩어리(깎은 모양) · bmesh 부품(관·판·공) · 손으로 셈한 무게(사슬 투영) · 정점색 · 그늘 굽기(AO) · glTF 내보내기
import bpy, math, json
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

def lin(h):                                              # sRGB 16진 → 선형
    def c(v):
        v /= 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return Vector((c((h >> 16) & 255), c((h >> 8) & 255), c(h & 255)))
def sm(a, b, x):
    t = 0.0 if b == a else max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
def link(o): bpy.context.scene.collection.objects.link(o); return o
def activate(o):
    for x in bpy.context.view_layer.objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o
def reset(): bpy.ops.wm.read_factory_settings(use_empty=True)

def metaball(name, elems, target, vox, res=None, smooth=6):
    """elems = [(중심 Vector, (rx, ry, rz) m, 회전 Quaternion|None)] → 다듬은 메시(삼각형 ≈ target) · vox = 복셀 크기(m)"""
    mb = bpy.data.metaballs.new(name); mb.resolution = mb.render_resolution = res or vox * 1.3; mb.threshold = 0.6
    o = link(bpy.data.objects.new(name, mb))
    for co, r, rot in elems:
        e = mb.elements.new(); e.type = 'ELLIPSOID'; e.co = co
        R = max(r); e.radius = R * 1.7; e.size_x, e.size_y, e.size_z = r[0] / R, r[1] / R, r[2] / R   # 겉면 ≈ 0.58×반지름 → 1.7배
        e.stiffness = 2.0
        if rot is not None: e.rotation = rot
    activate(o); bpy.ops.object.convert(target='MESH')
    o = bpy.context.view_layer.objects.active; o.name = name
    for kind, kw in (('REMESH', dict(mode='VOXEL', voxel_size=vox)), ('SMOOTH', dict(factor=0.6, iterations=smooth))):
        m = o.modifiers.new(kind, kind)
        for k, v in kw.items(): setattr(m, k, v)
        bpy.ops.object.modifier_apply(modifier=m.name)
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    if tris > target:
        d = o.modifiers.new('DEC', 'DECIMATE'); d.ratio = target / tris; bpy.ops.object.modifier_apply(modifier='DEC')
    for p in o.data.polygons: p.use_smooth = True
    return o

def chain_elems(pts, radii, step=0.55):
    """꺾은선을 따라 촘촘히 타원체 — radii[i] = (옆 rx, 위 rz)"""
    out = []
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]; d = b - a; L = d.length
        n = max(1, int(L / (step * min(radii[i][0], radii[i + 1][0]) + 1e-6)))
        q = Vector((0, 1, 0)).rotation_difference(d.normalized())
        for k in range(n + (1 if i == len(pts) - 2 else 0)):
            t = k / n; r0 = radii[i][0] + (radii[i + 1][0] - radii[i][0]) * t; r1 = radii[i][1] + (radii[i + 1][1] - radii[i][1]) * t
            out.append((a + d * t, (r0, max(r0, r1) * 1.15, r1), q))
    return out

class Geo:
    """한 부품의 정점·면·정점별 무게·색 — 나중에 메시 물체 하나로"""
    def __init__(self, name, mat, flat=False):
        self.name, self.mat, self.flat = name, mat, flat
        self.v, self.f, self.w, self.c = [], [], [], []
    def add(self, p, w, col=None):
        self.v.append(Vector(p)); self.w.append(w); self.c.append(col); return len(self.v) - 1
    def face(self, idx):
        u = []
        for i in idx:
            if i not in u: u.append(i)
        if len(u) >= 3: self.f.append(tuple(u))

def frame(t):
    t = t.normalized(); up = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
    x = t.cross(up).normalized(); y = x.cross(t).normalized(); return x, y

def tube(g, pts, radii, wfn, sides=6, col=None, cap=True):
    """꺾은선 관 — radii[i] = r 또는 (r옆, r위) · 끝 반지름 0이면 뾰족 · wfn(점) → 무게 · col = 색 또는 fn(점, 몇째)"""
    rings = []; px = py = None
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        if px is None: px, py = frame(t)
        else: px = (px - t * px.dot(t)).normalized(); py = px.cross(t)   # 평행 이동(비틀림 없이)
        r = radii[i] if isinstance(radii[i], tuple) else (radii[i], radii[i])
        cc = col(p, i) if callable(col) else col
        if r[0] < 1e-6: rings.append([g.add(p, wfn(p), cc)]); continue
        ring = []
        for k in range(sides):
            a = 2 * math.pi * k / sides
            ring.append(g.add(p + px * (math.cos(a) * r[0]) + py * (math.sin(a) * r[1]), wfn(p), cc))
        rings.append(ring)
    for i in range(len(rings) - 1):
        A, B = rings[i], rings[i + 1]
        if len(A) == 1 and len(B) == 1: continue
        if len(A) == 1: [g.face((A[0], B[(k + 1) % len(B)], B[k])) for k in range(len(B))]; continue
        if len(B) == 1: [g.face((A[k], A[(k + 1) % len(A)], B[0])) for k in range(len(A))]; continue
        for k in range(len(A)): g.face((A[k], A[(k + 1) % len(A)], B[(k + 1) % len(B)], B[k]))
    c0 = col(pts[0], 0) if callable(col) else col; c1 = col(pts[-1], len(pts) - 1) if callable(col) else col
    if cap and len(rings[0]) > 1:
        c = g.add(pts[0], wfn(pts[0]), c0); R0 = rings[0]; [g.face((R0[(k + 1) % len(R0)], R0[k], c)) for k in range(len(R0))]
    if cap and len(rings[-1]) > 1:
        c = g.add(pts[-1], wfn(pts[-1]), c1); R1 = rings[-1]; [g.face((R1[k], R1[(k + 1) % len(R1)], c)) for k in range(len(R1))]

def plate(g, outline, nrm, th, w, col=None):
    """판(귀 판·꼬리날개·볏) — outline 평면 다각형 · nrm 쪽이 윗면 · 두께 th"""
    nrm = nrm.normalized(); nn = Vector((0, 0, 0))
    for i in range(len(outline)):
        a, b = outline[i], outline[(i + 1) % len(outline)]; nn += a.cross(b)
    if nn.dot(nrm) < 0: outline = list(reversed(outline))
    top = [g.add(p + nrm * th * 0.5, w, col) for p in outline]; bot = [g.add(p - nrm * th * 0.5, w, col) for p in outline]
    c0 = sum(outline, Vector()) / len(outline)
    ct = g.add(c0 + nrm * th * 0.5, w, col); cb = g.add(c0 - nrm * th * 0.5, w, col)
    n = len(outline)
    for i in range(n):
        j = (i + 1) % n
        g.face((top[i], top[j], ct)); g.face((bot[j], bot[i], cb)); g.face((top[j], top[i], bot[i], bot[j]))

def leaf(base, tip, side, width, bulge=0.45):
    d = tip - base
    return [base + side * width, base + d * bulge + side * width * 0.75, tip, base + d * bulge - side * width * 0.75, base - side * width]

def blob(g, c, r, w, col=None, seg=12, rings=8, rot=None, zcut=None):
    """타원 공 — r = (rx, ry, rz) · rot(Quaternion) · zcut(-1~1)이면 그 위만(반구 투구 등 · 바닥 막음)"""
    def P(v): return c + (rot @ v if rot else v)
    ids = []; top = g.add(P(Vector((0, 0, r[2]))), w, col)
    rmax = rings if zcut is None else max(2, int(rings * math.acos(max(-1, min(1, zcut))) / math.pi + 0.5))
    for i in range(1, rmax + (0 if zcut is None else 1)):
        th = math.pi * i / rings if zcut is None or i < rmax else math.acos(zcut); ring = []
        for k in range(seg):
            ph = 2 * math.pi * k / seg
            ring.append(g.add(P(Vector((math.sin(th) * math.cos(ph) * r[0], math.sin(th) * math.sin(ph) * r[1], math.cos(th) * r[2]))), w, col))
        ids.append(ring)
    for k in range(seg): g.face((top, ids[0][k], ids[0][(k + 1) % seg]))
    for i in range(len(ids) - 1):
        for k in range(seg): g.face((ids[i][k], ids[i + 1][k], ids[i + 1][(k + 1) % seg], ids[i][(k + 1) % seg]))
    zb = -r[2] if zcut is None else zcut * r[2]
    bot = g.add(P(Vector((0, 0, zb))), w, col)
    for k in range(seg): g.face((ids[-1][(k + 1) % seg], ids[-1][k], bot))

def rot_from_axes(x, y, z):
    return Matrix((x, y, z)).transposed().to_quaternion()

def geo_object(g):
    me = bpy.data.meshes.new(g.name); me.from_pydata([tuple(v) for v in g.v], [], g.f); me.update()
    o = link(bpy.data.objects.new(g.name, me))
    for p in me.polygons: p.use_smooth = not g.flat
    return o

class Chain:
    """뼈 사슬(나무) — 가장 가까운 뼈 + 이음 둘레는 이웃 뼈와 섞음 · B[이름] = (머리, 꼬리, 부모, …)"""
    def __init__(self, names, B, bd, bias=None):
        self.segs = [(n, B[n][0], B[n][1]) for n in names]; ns = set(names)
        self.nb = {n: [] for n in names}
        for n in names:
            par = B[n][2]
            if par in ns: J = B[n][0]; self.nb[n].append((par, J)); self.nb[par].append((n, J))
        self.L = {n: (B[n][1] - B[n][0]).length for n in names}; self.bd = bd; self.bias = bias or {}
    def __call__(self, p):
        best, bq, bdst = None, None, 1e9
        for n, a, b in self.segs:
            ab = b - a; L2 = ab.length_squared
            t = max(0.0, min(1.0, (p - a).dot(ab) / L2)) if L2 > 1e-12 else 0.0
            q = a + ab * t; d = (q - p).length * self.bias.get(n, 1.0)
            if d < bdst: best, bq, bdst = n, q, d
        ws = {}
        for m, J in self.nb[best]:
            bd = min(self.bd, 0.5 * self.L[best], 0.5 * self.L[m]); dj = (bq - J).length
            if dj < bd: ws[m] = ws.get(m, 0) + 0.5 * (1 - sm(0, bd, dj))
        own = max(0.0, 1 - sum(ws.values())); ws[best] = ws.get(best, 0) + own
        tot = sum(ws.values()); return [(k, v / tot) for k, v in ws.items() if v > 1e-3]

def rigid(bone): return lambda p: [(bone, 1.0)]

def set_weights(o, fn=None, lst=None):
    groups = {}
    for v in o.data.vertices:
        ws = lst[v.index] if lst is not None else fn(v.co)
        for b, w in ws:
            if w <= 1e-4: continue
            if b not in groups: groups[b] = o.vertex_groups.new(name=b)
            groups[b].add([v.index], w, 'REPLACE')

def paint(o, fn, lst=None):
    me = o.data; ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT'); me.update()
    for v in me.vertices:
        c = lst[v.index] if (lst is not None and lst[v.index] is not None) else fn(v.co, v.normal)
        ca.data[v.index].color = (max(0, min(1, c[0])), max(0, min(1, c[1])), max(0, min(1, c[2])), 1.0)

DIRS = []
for i in range(16):
    z = 1 - (i + 0.5) / 16 * 0.92; r = math.sqrt(1 - z * z); a = i * 2.39996
    DIRS.append(Vector((r * math.cos(a), r * math.sin(a), z)))
def bake_ao(objs, occluders, dist, eps, power=0.72):
    """그늘 굽기 — 정점마다 반구 광선 열여섯 · 가까이 막힐수록 어둡게(정점색에 곱함)"""
    vs, ps = [], []
    for o in occluders:
        off = len(vs); vs += [v.co.copy() for v in o.data.vertices]; ps += [[off + i for i in p.vertices] for p in o.data.polygons]
    tree = BVHTree.FromPolygons(vs, ps)
    for o in objs:
        ca = o.data.color_attributes['Col']
        for v in o.data.vertices:
            n = v.normal
            if n.length < 0.5: continue
            x, y = frame(n); hit = 0.0; org = v.co + n * eps
            for d in DIRS:
                h = tree.ray_cast(org, x * d.x + y * d.y + n * d.z, dist)
                if h[0] is not None: hit += 1.0 - (h[3] / dist) * 0.5
            k = 1 - power * (hit / len(DIRS))
            c = ca.data[v.index].color; ca.data[v.index].color = (c[0] * k, c[1] * k, c[2] * k, 1)

def mat(name):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes = True; return m

def armature(name, B):
    """B[이름] = (머리, 꼬리, 부모, roll Z 방향|None) → 뼈대 물체"""
    arm = bpy.data.armatures.new(name); rig = link(bpy.data.objects.new(name, arm))
    activate(rig); bpy.ops.object.mode_set(mode='EDIT')
    for n, (h, t, par, roll) in B.items():
        eb = arm.edit_bones.new(n); eb.head = h; eb.tail = t
        if roll is not None: eb.align_roll(roll)
    for n, (h, t, par, roll) in B.items():
        if par: arm.edit_bones[n].parent = arm.edit_bones[par]
    bpy.ops.object.mode_set(mode='OBJECT')
    return rig

def bind(objs, rig):
    for o in objs:
        o.parent = rig; md = o.modifiers.new('ARM', 'ARMATURE'); md.object = rig

def export(path, objs, info=None):
    if info is not None: objs[0]['drg'] = json.dumps(info)          # 첫 물체(뼈대) 노드의 extras — gltfpack -ke가 남김(장면 extras는 버림)
    for x in bpy.context.view_layer.objects: x.select_set(False)
    for o in objs: o.select_set(True)
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_skins=True, export_animations=False, export_yup=True, export_apply=True,
              export_normals=True, export_texcoords=False, export_tangents=False, export_extras=True, export_morph=False)
    try: bpy.ops.export_scene.gltf(**kw, export_vertex_color='ACTIVE')
    except TypeError: bpy.ops.export_scene.gltf(**kw)

def tris_of(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

def finish(parts, aoDist, aoEps, mats):
    """parts = [(물체, 무게 fn|목록, 색 fn|목록, AO?, 가림막?, 재질 이름)] → 무게·색·그늘 → 하나로 합침(재질별 그리기)"""
    occ = []
    for (o, w, c, ao, oc, mname) in parts:
        o.data.materials.clear(); o.data.materials.append(mat(mname))
        if callable(w): set_weights(o, fn=w)
        else: set_weights(o, lst=w)
        if callable(c): paint(o, c)
        else: paint(o, lambda co, n: Vector((0.5, 0.5, 0.5)), lst=c)
        if oc: occ.append(o)
    bake_ao([p[0] for p in parts if p[3]], occ, aoDist, aoEps)
    main = parts[0][0]; activate(main)
    for p in parts[1:]: p[0].select_set(True)
    bpy.ops.object.join(); return bpy.context.view_layer.objects.active
