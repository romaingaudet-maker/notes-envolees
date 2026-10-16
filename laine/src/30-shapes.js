/* ------------------------------------------------------------------
   Formes : boules et haricots un peu bosselés (faits main), formes
   tournées, fils (tubes torsadés), pièces de feutrine découpées avec
   leurs points de couture, boutons et perles. Coordonnées de texture
   en centimètres.
------------------------------------------------------------------- */
function scaleUV(g, su, sv) {
  const uv = g.attributes.uv;
  if (!uv) return g;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return g;
}
/* moyenne des normales des sommets confondus (coutures des sphères) */
function smoothSeams(g) {
  const p = g.attributes.position, n = g.attributes.normal, map = new Map();
  const key = (i) => `${Math.round(p.getX(i) * 1e3)},${Math.round(p.getY(i) * 1e3)},${Math.round(p.getZ(i) * 1e3)}`;
  for (let i = 0; i < p.count; i++) {
    const k = key(i);
    const a = map.get(k);
    if (a) { a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); a.push(i); } else map.set(k, [n.getX(i), n.getY(i), n.getZ(i), i]);
  }
  map.forEach((a) => {
    if (a.length <= 4) return;
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    for (let j = 3; j < a.length; j++) n.setXYZ(a[j], a[0] / l, a[1] / l, a[2] / l);
  });
  n.needsUpdate = true;
  return g;
}
/* bosses douces le long de la normale (rien n'est parfaitement rond quand c'est cousu main) */
function lumpify(g, amp, freq, seed) {
  if (!amp) return g;
  g.computeVertexNormals();
  smoothSeams(g);
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = fbm3(x * freq + seed * 7.1, y * freq - seed * 3.3, z * freq + seed * 1.7, 2) * amp;
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  smoothSeams(g);
  return g;
}

/* boule ou ellipsoïde */
function blobGeo(rx, ry = rx, rz = rx, o = {}) {
  const seg = o.seg || 26;
  const g = new T.SphereGeometry(1, seg, Math.max(8, Math.round(seg * 0.7)));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * rx, p.getY(i) * ry, p.getZ(i) * rz);
  const r = Math.min(rx, ry, rz);
  lumpify(g, o.lump != null ? o.lump * r : 0.045 * r, o.freq || 1.1 / Math.max(0.6, r), o.seed || 1);
  if (o.lump === 0) { g.computeVertexNormals(); smoothSeams(g); }
  return scaleUV(g, Math.PI * (rx + rz), Math.PI * ry);
}

/* forme tournée autour de y : profile = [[rayon, y], …] de bas en haut */
function latheGeo(profile, o = {}) {
  const pts = profile.map(([r, y]) => v2(Math.max(0.0001, r), y));
  const g = new T.LatheGeometry(pts, o.seg || 32);
  let len = 0, rmax = 0;
  for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
  pts.forEach((q) => { rmax = Math.max(rmax, q.x); });
  g.computeVertexNormals();
  smoothSeams(g);
  if (o.lump) lumpify(g, o.lump * rmax, o.freq || 1 / Math.max(0.5, rmax * 0.6), o.seed || 2);
  return scaleUV(g, TAU * rmax, len);
}

/* fil de laine le long d'une courbe ; radius en cm */
function curveOf(pts, closed = false, tension = 0.5) {
  if (pts.isCurve) return pts;
  return new T.CatmullRomCurve3(pts.map((q) => (q.isVector3 ? q : v3(q[0], q[1], q[2] || 0))), closed, 'catmullrom', tension);
}
function yarnGeo(pts, radius, o = {}) {
  const curve = curveOf(pts, !!o.closed, o.tension != null ? o.tension : 0.5);
  const len = curve.getLength();
  const np = curve.points ? curve.points.length : 8;
  // assez de segments pour suivre les courbes, pas plus (un fil droit n'en a besoin que de deux)
  const tub = np <= 2 ? 2 : Math.min(o.maxSeg || 400, np * 14, Math.max(6, Math.ceil(len / Math.max(radius * 1.15, 0.12))));
  const g = new T.TubeGeometry(curve, tub, radius, o.radial || 8, !!o.closed);
  // une texture = 4 torsions ; un tour de torsion ≈ 2,6 diamètres
  scaleUV(g, len / (4 * 2.6 * 2 * radius), 1);
  return g;
}

/* pièce de feutrine épaisse, bords arrondis, centrée sur z = 0 */
function feltGeo(shape, depth = 0.32, o = {}) {
  const bevel = o.bevel != null ? o.bevel : Math.min(depth * 0.42, 0.22);
  const g = new T.ExtrudeGeometry(shape, {
    depth: Math.max(0.005, depth - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.85,
    bevelSegments: o.bevelSeg || 2, curveSegments: o.curve || 12, steps: 1,
  });
  g.translate(0, 0, -depth / 2 + bevel);
  g.computeVertexNormals();
  return g;
}

/* --- formes 2D --- */
function circleShape(r, n = 40) {
  const s = new T.Shape();
  s.absarc(0, 0, r, 0, TAU, false);
  return s;
}
function ellipseShape(rx, ry) { const s = new T.Shape(); s.absellipse(0, 0, rx, ry, 0, TAU, false, 0); return s; }
function roundRectShape(w, h, r) {
  const s = new T.Shape(), x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
/* étoile aux pointes arrondies */
function starShape(R, ri = 0.47, n = 5, round = 0.22) {
  const s = new T.Shape();
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / n, r = i % 2 ? R * ri : R;
    pts.push(v2(Math.cos(a) * r, Math.sin(a) * r));
  }
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
    const k = i % 2 ? round * 0.5 : round;
    const p1 = p.clone().lerp(a, k), p2 = p.clone().lerp(b, k);
    if (i === 0) s.moveTo(p1.x, p1.y); else s.lineTo(p1.x, p1.y);
    s.quadraticCurveTo(p.x, p.y, p2.x, p2.y);
  }
  s.closePath();
  return s;
}
function heartShape(w) {
  const s = new T.Shape(), k = w / 2;
  s.moveTo(0, -k * 0.95);
  s.bezierCurveTo(-k * 0.5, -k * 0.5, -k * 1.15, -k * 0.1, -k * 1.0, k * 0.45);
  s.bezierCurveTo(-k * 0.85, k * 0.95, -k * 0.2, k * 1.0, 0, k * 0.55);
  s.bezierCurveTo(k * 0.2, k * 1.0, k * 0.85, k * 0.95, k * 1.0, k * 0.45);
  s.bezierCurveTo(k * 1.15, -k * 0.1, k * 0.5, -k * 0.5, 0, -k * 0.95);
  return s;
}
function leafShape(w, h, tipBend = 0) {
  const s = new T.Shape();
  s.moveTo(0, -h / 2);
  s.bezierCurveTo(w * 0.62, -h * 0.25, w * 0.55, h * 0.3, tipBend, h / 2);
  s.bezierCurveTo(-w * 0.55, h * 0.3, -w * 0.62, -h * 0.25, 0, -h / 2);
  return s;
}
/* nuage : une rangée de bosses sur une base plate */
function cloudShape(w, h, bumps = 4, seed = 1) {
  const r = rng(seed), s = new T.Shape();
  const base = -h * 0.3;
  s.moveTo(-w / 2, base);
  const step = w / bumps;
  for (let i = 0; i < bumps; i++) {
    const x0 = -w / 2 + i * step, x1 = x0 + step;
    const top = h * (0.35 + 0.65 * Math.sin(((i + 0.5) / bumps) * Math.PI)) * (0.8 + r() * 0.35);
    s.bezierCurveTo(x0 - step * 0.05, base + top * 1.1, x1 + step * 0.05, base + top * 1.1, x1, base + (i < bumps - 1 ? top * 0.35 : 0));
  }
  s.quadraticCurveTo(w / 2 + h * 0.05, base - h * 0.32, w / 2 - h * 0.3, base - h * 0.32);
  s.lineTo(-w / 2 + h * 0.3, base - h * 0.32);
  s.quadraticCurveTo(-w / 2 - h * 0.05, base - h * 0.32, -w / 2, base);
  return s;
}
/* croissant de lune */
function crescentShape(r, cut = 0.62, off = 0.42) {
  const s = new T.Shape();
  const a0 = Math.acos(clamp((off * off + 1 - cut * cut) / (2 * off), -1, 1));
  s.absarc(0, 0, r, a0, TAU - a0, false);
  const b0 = Math.atan2(Math.sin(TAU - a0) * r, Math.cos(TAU - a0) * r - off * r);
  const b1 = Math.atan2(Math.sin(a0) * r, Math.cos(a0) * r - off * r);
  s.absarc(off * r, 0, cut * r, b0, b1, true);
  return s;
}
function polyShape(pts) {
  const s = new T.Shape();
  pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  s.closePath();
  return s;
}
/* silhouette lisse passant par des points (Catmull-Rom fermé) */
function blobShape(pts, n = 64) {
  const c = new T.SplineCurve(pts.map((p) => v2(p[0], p[1])).concat([v2(pts[0][0], pts[0][1])]));
  const s = new T.Shape(c.getPoints(n));
  return s;
}

/* --- maillage prêt à poser --- */
function mesh(geo, mat, o = {}) {
  const m = new T.Mesh(geo, mat);
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.receive !== false;
  return m;
}
/* une boule de laine (avec duvet) */
function woolBall(r, color, kind = 'crochet', o = {}) {
  const m = mesh(blobGeo(r * (o.sx || 1), r * (o.sy || 1), r * (o.sz || 1), { seed: o.seed || 1, lump: o.lump, seg: o.seg }), wool(color, kind, o.mat || {}));
  if (o.fuzz !== false) fuzz(m, o.fuzz || Math.min(0.28, 0.05 + r * 0.035), o.fz || {});
  return m;
}
function yarn(pts, radius, color, o = {}) {
  const m = mesh(yarnGeo(pts, radius, o), wool(color, 'yarn', o.mat || {}), o);
  if (o.fuzz) fuzz(m, o.fuzz, { fiber: radius * 0.5 });
  return m;
}
function felt(shape, color, depth = 0.32, o = {}) {
  const m = mesh(feltGeo(shape, depth, o), wool(color, 'felt', o.mat || {}), o);
  // la feutrine n'a qu'un léger duvet : seulement si on le demande (o.fuzz en cm)
  if (o.fuzz) fuzz(m, o.fuzz, { fiber: 0.06 });
  return m;
}

/* points de couture (point avant) le long d'un contour 2D, rentrés de `inset` */
function outline2D(shape, n) {
  const pts = shape.getSpacedPoints(n);
  if (pts.length > 2 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-4) pts.pop();
  return pts;
}
function insetPoly(pts, d) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a.x * b.y - b.x * a.y; }
  const sgn = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
    const tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
    return v2(p.x + (-ty / l) * d * sgn, p.y + (tx / l) * d * sgn);
  });
}
const stitchGeoCache = {};
function stitches(pts2D, z, color, o = {}) {
  const len = o.len || 0.34, gap = o.gap || 0.2, r = o.r || 0.05;
  const closed = o.closed !== false;
  const P = pts2D.slice();
  if (closed) P.push(P[0]);
  const marks = [];
  let acc = 0, on = true, segStart = null;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i];
    const L = a.distanceTo(b);
    let t = 0;
    while (t < L) {
      const need = (on ? len : gap) - acc;
      if (L - t >= need) {
        t += need;
        const pt = a.clone().lerp(b, t / L);
        if (on) marks.push([segStart || a.clone(), pt]); else segStart = pt;
        on = !on; acc = 0;
        if (on) segStart = pt;
      } else { acc += L - t; t = L; }
    }
  }
  const key = r.toFixed(3);
  const g = stitchGeoCache[key] || (stitchGeoCache[key] = (() => { const c = new T.CylinderGeometry(r, r, 1, 5, 1, false); c.rotateZ(Math.PI / 2); return c; })());
  const im = new T.InstancedMesh(g, wool(color, 'plain', { sheen: 0.6 }), Math.max(1, marks.length));
  const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = v3(), pos = v3(), zAxis = v3(0, 0, 1);
  marks.forEach(([a, b], i) => {
    const d = b.clone().sub(a), l = Math.max(0.05, d.length() - 2 * r);
    q.setFromAxisAngle(zAxis, Math.atan2(d.y, d.x));
    pos.set((a.x + b.x) / 2, (a.y + b.y) / 2, z);
    sc.set(l, 1, 1);
    m4.compose(pos, q, sc);
    im.setMatrixAt(i, m4);
  });
  im.count = marks.length;
  im.castShadow = false;
  im.receiveShadow = true;
  return im;
}
/* pièce de feutrine + ses points de couture sur les deux faces */
function feltPiece(shape, color, o = {}) {
  const depth = o.depth || 0.32;
  const g = new T.Group();
  const body = felt(shape, color, depth, o);
  g.add(body);
  if (o.stitch !== false) {
    const pts = insetPoly(outline2D(shape, o.n || 90), o.inset || 0.32);
    const sc = o.stitch || lighten(color, 0.55).getStyle();
    g.add(stitches(pts, depth / 2 + 0.01, sc, o.st || {}));
    if (o.back) g.add(stitches(pts, -depth / 2 - 0.01, sc, o.st || {}));
  }
  g.userData.body = body;
  return g;
}

/* yeux-boutons, perles, boutons cousus */
const beadGeoCache = {};
function bead(r, color = '#121212', o = {}) {
  const key = r.toFixed(3) + (o.flat || 1);
  const g = beadGeoCache[key] || (beadGeoCache[key] = (() => { const s = new T.SphereGeometry(r, 20, 14); s.scale(1, 1, o.flat || 0.8); return s; })());
  const m = mesh(g, plastic(color, o), { cast: false });
  return m;
}
function sewnButton(r, color, o = {}) {
  const g = new T.Group();
  const prof = [[0, -r * 0.18], [r * 0.95, -r * 0.18], [r, -r * 0.08], [r * 0.97, r * 0.12], [r * 0.8, r * 0.16], [r * 0.6, r * 0.08], [0, r * 0.08]];
  const b = mesh(latheGeo(prof, { seg: 28 }), plastic(color, { rough: 0.35 }));
  b.rotation.x = Math.PI / 2;
  g.add(b);
  const holes = o.holes || 4, hr = r * 0.13;
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * TAU + Math.PI / 4, d = holes === 2 ? r * 0.28 : r * 0.3;
    const h = mesh(new T.CylinderGeometry(hr, hr, r * 0.05, 10), plastic('#000000', { rough: 0.6 }), { cast: false });
    h.rotation.x = Math.PI / 2;
    h.position.set(Math.cos(a) * d, Math.sin(a) * d, r * 0.1);
    g.add(h);
  }
  if (o.thread) {
    const t = o.thread, d = r * 0.3;
    g.add(yarn([[-d * 0.7, -d * 0.7, r * 0.14], [0, 0, r * 0.2], [d * 0.7, d * 0.7, r * 0.14]], r * 0.06, t));
    if (holes === 4) g.add(yarn([[-d * 0.7, d * 0.7, r * 0.14], [0, 0, r * 0.2], [d * 0.7, -d * 0.7, r * 0.14]], r * 0.06, t));
  }
  return g;
}

/* ombre de contact douce (sous les pieds, les pots, les arbres) */
function contactShadow(w, d, opacity = 0.55) {
  const m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: sprite('shadow'), transparent: true, opacity, depthWrite: false, color: 0x000000, fog: false }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  m.userData.noBoil = true;
  return m;
}
