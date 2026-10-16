/* ------------------------------------------------------------------
   Le plateau : la vue (scène + caméra sur son banc), les éclairages de
   studio, le fond tendu, le sol tricoté, et les éléments de décor
   réutilisés d'une comptine à l'autre (arbres, herbe, fleurs, nuages
   et astres suspendus à leur fil, maisons, clôtures, eau…).
------------------------------------------------------------------- */

/* fusion de géométries simples (positions, normales, uv, index) */
function mergeGeos(list) {
  let nv = 0, ni = 0;
  list.forEach((g) => { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  list.forEach((g) => {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, c = p.count;
    pos.set(p.array.subarray(0, c * 3), ov * 3);
    if (n) nrm.set(n.array.subarray(0, c * 3), ov * 3);
    if (u) uv.set(u.array.subarray(0, c * 2), ov * 2);
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.getX(i) + ov; oi += g.index.count; } else { for (let i = 0; i < c; i++) idx[oi + i] = ov + i; oi += c; }
    ov += c;
  });
  const m = new T.BufferGeometry();
  m.setAttribute('position', new T.BufferAttribute(pos, 3));
  m.setAttribute('normal', new T.BufferAttribute(nrm, 3));
  m.setAttribute('uv', new T.BufferAttribute(uv, 2));
  m.setIndex(new T.BufferAttribute(idx, 1));
  m.computeBoundingSphere();
  return m;
}
function applyM(g, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) {
  const m = new T.Matrix4().compose(v3(...p), new T.Quaternion().setFromEuler(new T.Euler(...r)), v3(...(Array.isArray(s) ? s : [s, s, s])));
  return g.applyMatrix4(m);
}

/* ---------------- la vue ---------------- */
function makeView(o = {}) {
  const scene = new T.Scene();
  scene.background = col(o.bg || '#1E2238');
  const camera = new T.PerspectiveCamera(o.fov || 28, 1, 1, 4000);
  const V = {
    scene, camera,
    post: Object.assign({ exposure: 1, bloom: 0.5, bloomThr: 1, aper: 5, maxBlur: 10, focus: 120, sat: 1.08, grain: 0.04, vignette: 0.38 }, o.post || {}),
    rig: Object.assign({ target: v3(0, 10, 0), az: 0, el: 10, fov: o.fov || 28, box: [60, 34], margin: 1, focusK: 1, paz: 0, pel: 0, dolly: 1 }, o.rig || {}),
    safe: { t: 0, r: 0, b: 0, l: 0 },
    boil: [],
    anims: [],
    systems: [],
    size: [0, 0],
    tick(t, f) {
      for (const b of V.boil) boilRestore(b);
      for (const a of V.anims) a(t, f);
      if (V.onTick) V.onTick(t, f);
      for (const s of V.systems) s.update(t, f);
      if (!RM.matches) for (const b of V.boil) boilApply(b, f);
      frameCamera(V);
    },
    resize(w, h) { V.size = [w, h]; frameCamera(V); },
    add(...objs) { objs.forEach((x) => scene.add(x)); return objs[0]; },
    anim(fn) { V.anims.push(fn); return fn; },
  };
  if (o.rig && o.rig.target && !o.rig.target.isVector3) V.rig.target = v3(...o.rig.target);
  if (o.rig && o.rig.targetWide && !o.rig.targetWide.isVector3) V.rig.targetWide = v3(...o.rig.targetWide);
  return V;
}

/* la caméra cadre `box` (largeur, hauteur en cm, autour de la cible) dans la
   partie de la scène que l'interface ne couvre pas, par décentrement de l'objectif */
function frameCamera(V) {
  const [w, h] = V.size;
  if (!w || !h) return;
  const R = V.rig, cam = V.camera, s = V.safe;
  const sw = Math.max(60, w - s.l - s.r), sh = Math.max(60, h - s.t - s.b);
  cam.aspect = w / h;
  cam.fov = R.fov;
  // écran très large (téléphone en hauteur : bandeau de décor) : cadrage dédié
  const wide = R.boxWide && sw / sh > 1.65;
  const box = wide ? R.boxWide : R.box;
  const tanH = Math.tan((R.fov * DEG) / 2);
  const dH = box[1] / 2 / (tanH * (sh / h));
  const dW = box[0] / 2 / (tanH * cam.aspect * (sw / w));
  let d = Math.max(dH, dW) * R.margin * R.dolly;
  if (R.maxDist) d = Math.min(d, R.maxDist);
  const az = (R.az + R.paz) * DEG, el = (R.el + R.pel) * DEG;
  const tg = wide && R.targetWide ? R.targetWide : R.target;
  cam.position.set(tg.x + Math.sin(az) * Math.cos(el) * d, tg.y + Math.sin(el) * d, tg.z + Math.cos(az) * Math.cos(el) * d);
  cam.up.set(0, 1, 0);
  cam.lookAt(tg);
  if (R.roll) cam.rotateZ(R.roll * DEG);
  cam.near = Math.max(1, d * 0.08);
  cam.far = d * 6 + 2500;
  const cx = s.l + sw / 2, cy = s.t + sh / 2;
  cam.setViewOffset(w, h, w / 2 - cx, h / 2 - cy, w, h);
  cam.updateProjectionMatrix();
  V.post.focus = d * R.focusK;
  V.dist = d;
}

/* ---------------- frémissement : la marionnette bouge un peu entre deux images ---------------- */
function boilable(obj, amp = 0.06, rot = 0.6) {
  obj.userData.boil = { amp, rot, seed: Math.floor(Math.random() * 1e6), base: null };
  return obj;
}
function boilRestore(o) {
  const b = o.userData.boil;
  if (!b || !b.base) return;
  if (o.position.equals(b.jp)) o.position.copy(b.base.p);
  if (o.rotation.x === b.jr.x && o.rotation.y === b.jr.y && o.rotation.z === b.jr.z) o.rotation.copy(b.base.r);
}
function boilApply(o, f) {
  const b = o.userData.boil;
  if (!b) return;
  b.base = b.base || { p: v3(), r: new T.Euler() };
  b.base.p.copy(o.position);
  b.base.r.copy(o.rotation);
  const k = b.seed + f * 31;
  o.position.x += (hashi(k, 1) - 0.5) * b.amp;
  o.position.y += (hashi(k, 2) - 0.5) * b.amp;
  o.position.z += (hashi(k, 3) - 0.5) * b.amp;
  o.rotation.x += (hashi(k, 4) - 0.5) * b.rot * DEG;
  o.rotation.y += (hashi(k, 5) - 0.5) * b.rot * DEG;
  o.rotation.z += (hashi(k, 6) - 0.5) * b.rot * DEG;
  b.jp = b.jp || v3(); b.jp.copy(o.position);
  b.jr = b.jr || new T.Euler(); b.jr.copy(o.rotation);
}

/* ---------------- lumières de studio ---------------- */
const envCache = new Map();
function envMap(sky, ground, box = '#FFFFFF', k = 5) {
  const key = [sky, ground, box, k].join('|');
  if (envCache.has(key)) return envCache.get(key);
  const r = Engine.renderer;
  const s = new T.Scene();
  const g = new T.SphereGeometry(100, 32, 16);
  const cs = [], p = g.attributes.position, a = col(ground), b = col(sky), c = new T.Color();
  for (let i = 0; i < p.count; i++) { c.copy(a).lerp(b, smooth(p.getY(i) / 200 + 0.5)); cs.push(c.r, c.g, c.b); }
  g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
  s.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
  const add = (x, y, z, w, h, kk) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: col(box).multiplyScalar(kk), side: T.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  add(-45, 55, 55, 50, 34, k);
  add(70, 30, -40, 30, 50, k * 0.35);
  const pm = new T.PMREMGenerator(r);
  const tex = pm.fromScene(s, 0.035).texture;
  pm.dispose();
  envCache.set(key, tex);
  return tex;
}
function dirFrom(az, el) { const a = az * DEG, e = el * DEG; return v3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)); }

/* o.key { color, k, az, el, area } ; o.fill { sky, ground, k } ; o.rim { color, k, az, el } ; o.env { sky, ground, k } */
function studioLights(V, o) {
  const tg = V.rig.target.clone();
  const L = {};
  if (o.key) {
    const K = o.key;
    const l = new T.DirectionalLight(col(K.color || '#FFF1DC'), K.k != null ? K.k : 2.6);
    l.position.copy(tg).add(dirFrom(K.az || -35, K.el || 48).multiplyScalar(400));
    l.target.position.copy(K.at ? v3(...K.at) : tg);
    l.castShadow = true;
    const sz = Engine.tier === 0 ? 1024 : 2048;
    l.shadow.mapSize.set(sz, sz);
    const A = K.area || 70;
    Object.assign(l.shadow.camera, { left: -A, right: A, top: A, bottom: -A, near: 100, far: 800 });
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.08;
    l.shadow.radius = 4;
    V.scene.add(l, l.target);
    L.key = l;
  }
  if (o.fill) {
    const F = o.fill;
    const h = new T.HemisphereLight(col(F.sky || '#BFD7FF'), col(F.ground || '#5A4630'), F.k != null ? F.k : 0.6);
    V.scene.add(h);
    L.fill = h;
  }
  if (o.rim) {
    const R = o.rim;
    const l = new T.DirectionalLight(col(R.color || '#FFE6C0'), R.k != null ? R.k : 1.4);
    l.position.copy(tg).add(dirFrom(R.az != null ? R.az : 160, R.el || 35).multiplyScalar(400));
    l.target.position.copy(tg);
    V.scene.add(l, l.target);
    L.rim = l;
  }
  const E = o.env || {};
  V.scene.environment = envMap(E.sky || '#9DB4D8', E.ground || '#4A3A2A', E.box || '#FFFFFF', E.boxK || 5);
  V.scene.environmentIntensity = E.k != null ? E.k : 0.5;
  if (o.fog) V.scene.fog = new T.Fog(col(o.fog.color), o.fog.near, o.fog.far);
  return L;
}
/* petite lumière ponctuelle (bougie, lanterne, fenêtre) */
function practical(V, pos, color = '#FFB868', k = 400, dist = 60) {
  const l = new T.PointLight(col(color), k, dist, 2);
  l.position.set(...pos);
  V.scene.add(l);
  return l;
}

/* ---------------- fond tendu (cyclo) : un drap qui descend et se courbe vers le sol ---------------- */
function cyclo(o = {}) {
  const w = o.w || 400, h = o.h || 220, z = o.z != null ? o.z : -80, r = o.r || 40, depth = o.floor || 60;
  const nx = 48, ny = 40;
  const prof = [];
  const L1 = depth, L2 = (Math.PI / 2) * r, L3 = h - r, Lt = L1 + L2 + L3;
  for (let j = 0; j <= ny; j++) {
    const s = (j / ny) * Lt;
    let y, zz;
    if (s < L1) { y = 0; zz = z + r + depth - s; } else if (s < L1 + L2) { const a = (s - L1) / r; y = r - Math.cos(a) * r; zz = z + r - Math.sin(a) * r; } else { y = r + (s - L1 - L2); zz = z; }
    prof.push([y + (o.y || 0), zz, s]);
  }
  const pos = [], uv = [], cs = [], idx = [];
  const top = col(o.top || '#7FB7E8'), bot = col(o.bottom || '#DDEFFA'), mid = o.mid ? col(o.mid) : null, c = new T.Color();
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const x = -w / 2 + (i / nx) * w;
    const bend = o.wrap ? Math.pow(Math.abs(x) / (w / 2), 2) * (o.wrap || 0) : 0;
    pos.push(x, prof[j][0], prof[j][1] + bend);
    uv.push(x + w / 2, prof[j][2]);
    const t = sat((prof[j][0] - (o.y || 0)) / h);
    if (mid) { if (t < 0.5) c.copy(bot).lerp(mid, smooth(t * 2)); else c.copy(mid).lerp(top, smooth((t - 0.5) * 2)); } else c.copy(bot).lerp(top, smooth(t));
    cs.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = wool('#FFFFFF', o.kind || 'felt', { scale: o.scale || 2.4, sheen: 0.4, bump: o.bump || 0.6 }).clone();
  m.vertexColors = true;
  m.sheen = 0.25;
  m.sheenColor = lighten(o.mid || o.top || '#7FB7E8', 0.3);
  if (o.glow) { m.emissive = col('#FFFFFF'); m.emissiveIntensity = o.glow; m.emissiveMap = null; }
  const me = mesh(g, m, { cast: false });
  me.userData.noBoil = true;
  return me;
}

/* ---------------- sol tricoté avec ses collines ---------------- */
function terrain(o = {}) {
  const w = o.w || 300, d = o.d || 160, nx = o.nx || 90, nz = o.nz || 50;
  const g = new T.PlaneGeometry(w, d, nx, nz);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  const hills = o.hills || [];
  const cs = [];
  const colors = (o.colors || [o.color || '#7CC36A']).map(col), c = new T.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i) + (o.z || 0);
    let y = 0;
    for (const [hx, hz, hr, hh] of hills) { const q = ((x - hx) ** 2 + (z - hz) ** 2) / (hr * hr); y += hh * Math.exp(-q * 2); }
    y += fbm3(x * 0.03, 0, z * 0.03, 2) * (o.rough != null ? o.rough : 0.8);
    p.setXYZ(i, x, y + (o.y || 0), z);
    // rayures tricotées (bandes de couleur) ou une seule couleur
    let k = 0;
    if (colors.length > 1) {
      const band = o.bands ? Math.floor((z - (o.z || 0) + d / 2) / o.bands) : Math.floor(sat((y - (o.y || 0)) / (o.bandH || 12)) * (colors.length - 0.001));
      k = ((band % colors.length) + colors.length) % colors.length;
    }
    c.copy(colors[k]);
    const v = 0.94 + hashi(Math.floor(x / 3), Math.floor(z / 3), 5) * 0.08;
    cs.push(c.r * v, c.g * v, c.b * v);
  }
  g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
  g.computeVertexNormals();
  scaleUV(g, w, d);
  const m = wool('#FFFFFF', o.kind || 'knit', { scale: o.scale || 1.6, bump: o.bump || 1 }).clone();
  m.vertexColors = true;
  m.sheen = o.sheen != null ? o.sheen : 0.35;
  m.sheenColor = lighten(colors[0], 0.25);
  const me = mesh(g, m, { cast: false });
  if (o.z) me.position.z = 0;
  me.userData.height = (x, z) => {
    let y = 0;
    for (const [hx, hz, hr, hh] of hills) { const q = ((x - hx) ** 2 + (z - hz) ** 2) / (hr * hr); y += hh * Math.exp(-q * 2); }
    return y + fbm3(x * 0.03, 0, z * 0.03, 2) * (o.rough != null ? o.rough : 0.8) + (o.y || 0);
  };
  return me;
}

/* plans de décor en feutrine découpée (collines, forêt, toits), posés à la verticale */
function flatLayer(shape, color, o = {}) {
  const g = feltPiece(shape, color, Object.assign({ depth: o.depth || 0.6, inset: o.inset || 0.7, st: { len: 0.7, gap: 0.45, r: 0.09 }, back: false }, o));
  return g;
}
function hillShape(w, h, bumps, seed = 1, base = -20) {
  const r = rng(seed), pts = [[-w / 2, base]];
  const n = bumps * 6;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = -w / 2 + t * w;
    let y = 0;
    for (let b = 0; b < bumps; b++) { const c = (b + 0.5) / bumps + (r() - 0.5) * 0.02; y = Math.max(y, h * (0.55 + 0.45 * hashi(seed, b)) * Math.exp(-((t - c) ** 2) * bumps * bumps * 3.2)); }
    pts.push([x, y + h * 0.18]);
  }
  pts.push([w / 2, base]);
  return blobShape(pts, 120);
}

/* ---------------- suspendus à leur fil (les ficelles se voient : c'est un décor !) ---------------- */
function hang(obj, top = 200, o = {}) {
  const g = new T.Group();
  const pivot = new T.Group();
  pivot.position.copy(obj.position);
  pivot.position.y = top;
  const len = top - obj.position.y;
  obj.position.set(0, -len, 0);
  pivot.add(obj);
  const th = yarn([[0, 0, 0], [0, -len + (o.attach || 0), 0]], o.r || 0.06, o.color || '#EDE6D6', { cast: false, radial: 5 });
  pivot.add(th);
  g.add(pivot);
  g.userData.pivot = pivot;
  g.userData.len = len;
  g.userData.swing = { amp: o.amp != null ? o.amp : 1.6, per: o.per || 4.2, ph: o.ph || Math.random() * TAU };
  return g;
}
function swingAnim(V, hung) {
  const s = hung.userData.swing, pv = hung.userData.pivot;
  V.anim((t) => {
    pv.rotation.z = Math.sin((t / s.per) * TAU + s.ph) * s.amp * DEG;
    pv.rotation.x = Math.sin((t / (s.per * 1.37)) * TAU + s.ph * 1.7) * s.amp * 0.4 * DEG;
  });
  return hung;
}

/* ---------------- décor courant ---------------- */
/* arbre : tronc entouré de fil, feuillage en boules de laine */
function tree(o = {}) {
  const g = new T.Group();
  const h = o.h || 40, tr = o.trunk || 2.2, r = rng(o.seed || 3);
  const trunkCol = o.trunkCol || '#7A5236';
  const trunk = mesh(latheGeo([[tr * 1.5, 0], [tr * 1.1, h * 0.08], [tr, h * 0.5], [tr * 0.8, h * 0.72], [tr * 0.6, h * 0.8]], { seg: 20, lump: 0.08 }), wool(trunkCol, 'knit', { scale: 0.7 }));
  g.add(trunk);
  // fil enroulé autour du tronc
  const pts = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60, y = h * 0.06 + t * h * 0.6, a = t * TAU * 7; const rr = lerp(tr * 1.18, tr * 0.92, t) + 0.15; pts.push([Math.cos(a) * rr, y, Math.sin(a) * rr]); }
  g.add(yarn(pts, 0.32, darken(trunkCol, 0.15).getStyle(), { radial: 6 }));
  const type = o.type || 'round';
  const leaf = o.color || '#4E9B4A', leaf2 = o.color2 || lighten(leaf, 0.12).getStyle();
  if (type === 'round') {
    const n = o.puffs || 7, R = o.crown || h * 0.38;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r(), y = h * 0.78 + (r() - 0.3) * R * 0.6, d = R * (0.35 + r() * 0.4);
      const b = woolBall(R * (0.45 + r() * 0.25), i % 2 ? leaf : leaf2, 'knit', { seed: i + 3, mat: { scale: 0.9 } });
      b.position.set(Math.cos(a) * d, y, Math.sin(a) * d * 0.8);
      g.add(b);
    }
    const top = woolBall(R * 0.62, leaf, 'knit', { seed: 9, mat: { scale: 0.9 } });
    top.position.set(0, h * 0.86 + R * 0.35, 0);
    g.add(top);
  } else if (type === 'pine') {
    const tiers = o.tiers || 4;
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers, rr = (o.crown || h * 0.3) * (1 - t * 0.55), y0 = h * (0.25 + t * 0.55), hh = h * 0.32;
      const cone = mesh(latheGeo([[rr, 0], [rr * 0.96, hh * 0.08], [rr * 0.55, hh * 0.45], [0.2, hh]], { seg: 22, lump: 0.06, seed: i }), wool(i % 2 ? leaf : leaf2, 'knit', { scale: 0.85 }));
      cone.position.y = y0;
      fuzz(cone, 0.16);
      g.add(cone);
    }
  }
  if (o.shadow !== false) { const sh = contactShadow(h * 0.6, h * 0.45, 0.5); sh.position.y = 0.15; g.add(sh); }
  return g;
}

/* touffes d'herbe : trois brins de fil recourbés, en instances */
let tuftGeo = null;
function grassTuft() {
  if (tuftGeo) return tuftGeo;
  const geos = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.3, lean = 0.9 + i * 0.25, hh = 2.6 + (i % 2) * 1.1;
    const pts = [[Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], [Math.cos(a) * lean * 0.6, hh * 0.55, Math.sin(a) * lean * 0.6], [Math.cos(a) * lean * 1.4, hh, Math.sin(a) * lean * 1.4]];
    geos.push(yarnGeo(pts, 0.22, { radial: 5, maxSeg: 10 }));
  }
  return (tuftGeo = mergeGeos(geos));
}
function grass(o = {}) {
  const n = o.n || 120, area = o.area || [-100, 100, -20, 40];
  const im = new T.InstancedMesh(grassTuft(), wool('#FFFFFF', 'yarn', { sheen: 0.6, sheenColor: '#56664A' }), n);
  const r = rng(o.seed || 4), m4 = new T.Matrix4(), q = new T.Quaternion(), c = new T.Color();
  const cols = (o.colors || ['#6DB85A', '#5AA64C', '#86C86B']).map(col);
  for (let i = 0; i < n; i++) {
    const x = lerp(area[0], area[1], r()), z = lerp(area[2], area[3], r());
    const y = o.height ? o.height(x, z) : 0;
    const s = (o.scale || 1) * (0.7 + r() * 0.6);
    q.setFromEuler(new T.Euler((r() - 0.5) * 0.3, r() * TAU, (r() - 0.5) * 0.3));
    m4.compose(v3(x, y - 0.2, z), q, v3(s, s * (0.8 + r() * 0.5), s));
    im.setMatrixAt(i, m4);
    im.setColorAt(i, c.copy(cols[i % cols.length]).multiplyScalar(0.9 + r() * 0.2));
  }
  im.castShadow = true;
  im.receiveShadow = true;
  return im;
}

/* fleur en feutrine : pétales autour d'un bouton */
function flower(o = {}) {
  const g = new T.Group();
  const n = o.petals || 5, R = o.r || 2.2, pc = o.color || '#F5A3C0', cc = o.center || '#F5C32C';
  const stemH = o.stem != null ? o.stem : 5;
  if (stemH > 0) g.add(yarn([[0, 0, 0], [0.4, stemH * 0.5, 0], [0, stemH, 0]], 0.18, o.stemCol || '#4E9B4A', { radial: 5 }));
  const head = new T.Group();
  head.position.y = stemH;
  for (let i = 0; i < n; i++) {
    const p = felt(ellipseShape(R * 0.42, R * 0.6), pc, 0.22, { fuzz: false });
    const a = (i / n) * TAU;
    p.position.set(Math.cos(a) * R * 0.52, Math.sin(a) * R * 0.52, -0.05);
    p.rotation.z = a - Math.PI / 2;
    head.add(p);
  }
  const c = woolBall(R * 0.32, cc, 'crochet', { fuzz: 0.06, sz: 0.6 });
  c.position.z = 0.15;
  head.add(c);
  head.rotation.x = -(o.tilt != null ? o.tilt : 0.35);
  g.add(head);
  g.userData.head = head;
  return g;
}

/* nuage de feutrine suspendu */
function cloud(o = {}) {
  const w = o.w || 26, h = o.h || 10;
  const p = feltPiece(cloudShape(w, h, o.bumps || 4, o.seed || 1), o.color || '#FFFFFF', { depth: o.depth || 2.4, inset: 0.9, st: { len: 0.6, gap: 0.4, r: 0.08 }, fuzz: 0.12, stitch: o.stitch || '#C9D9EA' });
  return p;
}
/* soleil de feutrine aux rayons en fil */
function sun(o = {}) {
  const g = new T.Group();
  const R = o.r || 9, c = o.color || '#FFC93C';
  const disc = feltPiece(circleShape(R), c, { depth: 2, inset: 0.9, stitch: o.stitch || '#F08A24', st: { len: 0.7, gap: 0.4, r: 0.1 } });
  g.add(disc);
  const n = o.rays || 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const r0 = R * 1.15, r1 = R * (i % 2 ? 1.55 : 1.75);
    g.add(yarn([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.08) * (r0 + r1) / 2, Math.sin(a + 0.08) * (r0 + r1) / 2, 0.3], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.42, o.ray || '#FFB22C', { radial: 6 }));
  }
  if (o.face !== false) addFace(g, R * 0.95, { z: 1.05, sleepy: o.sleepy, cheeks: '#F27A54' });
  return g;
}
/* visage brodé sur une surface plane (z) : yeux, joues, bouche */
function addFace(g, R, o = {}) {
  const z = o.z || 0.5, dark = o.ink || '#2B1B14';
  if (o.sleepy) {
    for (const s of [-1, 1]) g.add(yarn([[s * R * 0.42 - R * 0.14, R * 0.12, z], [s * R * 0.42, R * 0.04, z + 0.15], [s * R * 0.42 + R * 0.14, R * 0.12, z]], R * 0.035, dark, { radial: 5 }));
  } else {
    for (const s of [-1, 1]) { const e = bead(R * 0.1, '#161210'); e.position.set(s * R * 0.36, R * 0.12, z); g.add(e); }
  }
  if (o.cheeks) for (const s of [-1, 1]) { const c = felt(circleShape(R * 0.12), o.cheeks, 0.12, { fuzz: false }); c.position.set(s * R * 0.55, -R * 0.12, z - 0.02); g.add(c); }
  g.add(yarn([[-R * 0.18, -R * 0.2, z], [0, -R * 0.32, z + 0.1], [R * 0.18, -R * 0.2, z]], R * 0.035, dark, { radial: 5 }));
}
/* lune en croissant (ou pleine) */
function moon(o = {}) {
  const g = new T.Group();
  const R = o.r || 10;
  const shape = o.full ? circleShape(R) : crescentShape(R, 0.78, 0.5);
  const p = feltPiece(shape, o.color || '#F6EFC8', { depth: 2.2, inset: 0.8, stitch: o.stitch || '#D9C77A', st: { len: 0.6, gap: 0.4, r: 0.09 }, fuzz: 0.1 });
  g.add(p);
  if (o.full && o.face !== false) addFace(g, R * 0.9, { z: 1.15, sleepy: o.sleepy !== false, cheeks: '#EAB28F' });
  return g;
}
/* étoile de feutrine */
function star(o = {}) {
  return feltPiece(starShape(o.r || 3, 0.48, 5, 0.25), o.color || '#FFE07A', { depth: o.depth || 0.9, inset: o.inset || 0.38, stitch: o.stitch || '#E8A93A', st: { len: 0.3, gap: 0.2, r: 0.05 }, fuzz: 0.06 });
}
/* caillou en laine feutrée */
function stone(r, color = '#A9A39A', seed = 1) {
  const m = woolBall(r, color, 'felt', { sy: 0.62, seed, lump: 0.16, fuzz: 0.08 });
  return m;
}
/* maisonnette tricotée */
function cottage(o = {}) {
  const g = new T.Group();
  const w = o.w || 18, d = o.d || 14, h = o.h || 14;
  const wall = mesh(new T.BoxGeometry(w, h, d, 2, 2, 2), wool(o.wall || '#F1E3C8', 'knit', { scale: 0.8 }));
  scaleUV(wall.geometry, w, h);
  wall.position.y = h / 2;
  g.add(wall);
  const roofCol = o.roof || '#C2533B';
  const shape = polyShape([[-w / 2 - 2, 0], [w / 2 + 2, 0], [0, h * 0.7]]);
  const roof = mesh(new T.ExtrudeGeometry(shape, { depth: d + 3, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 2 }), wool(roofCol, 'knit', { scale: 0.8 }));
  roof.position.set(0, h, -d / 2 - 1.5);
  g.add(roof);
  const win = o.light ? glowMat(o.lightCol || '#FFC971', o.light) : wool('#3B4A6B', 'felt');
  const add = (x, y, ww, hh) => {
    const m = mesh(new T.BoxGeometry(ww, hh, 0.4), win, { cast: false });
    m.position.set(x, y, d / 2 + 0.15);
    g.add(m);
    const fr = feltPiece(roundRectShape(ww + 1.2, hh + 1.2, 0.4), o.frame || '#FFFFFF', { depth: 0.3, inset: 0.3, stitch: false, fuzz: false });
    fr.position.set(x, y, d / 2 + 0.05);
    g.add(fr);
  };
  add(-w * 0.22, h * 0.6, w * 0.22, h * 0.25);
  add(w * 0.22, h * 0.6, w * 0.22, h * 0.25);
  const door = mesh(new T.BoxGeometry(w * 0.22, h * 0.42, 0.5), wool(o.door || '#7A4A30', 'knit', { scale: 0.6 }));
  door.position.set(0, h * 0.21, d / 2 + 0.1);
  g.add(door);
  return g;
}
/* clôture en bâtonnets */
function fence(o = {}) {
  const g = new T.Group();
  const n = o.n || 8, gap = o.gap || 5, h = o.h || 8, c = o.color || '#E9D7B8';
  for (let i = 0; i < n; i++) {
    const p = mesh(latheGeo([[0.55, 0], [0.55, h], [0.2, h + 0.8]], { seg: 10 }), woodMat(c));
    p.position.x = (i - (n - 1) / 2) * gap;
    p.rotation.z = (hashi(i, 4) - 0.5) * 0.08;
    g.add(p);
  }
  for (const y of [h * 0.35, h * 0.75]) g.add(yarn([[-(n - 1) / 2 * gap - 1, y, 0.6], [0, y - 0.4, 0.7], [(n - 1) / 2 * gap + 1, y, 0.6]], 0.3, o.rope || '#B98B5A', { radial: 6 }));
  return g;
}
/* plan d'eau : résine bleue froissée, qui ondule image par image */
function water(o = {}) {
  const w = o.w || 120, d = o.d || 40;
  const g = new T.PlaneGeometry(w, d, 60, 24);
  g.rotateX(-Math.PI / 2);
  scaleUV(g, w, d);
  const m = resinMat(o.color || '#3E8FC9', { rough: 0.16, normal: 'felt', scale: 1.3, bump: 0.9, opacity: o.opacity || 0.96 });
  const me = mesh(g, m, { cast: false });
  const p = g.attributes.position, base = Float32Array.from(p.array);
  me.userData.wave = (t, amp = 0.35) => {
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      p.setY(i, Math.sin(x * 0.12 + t * 1.7) * amp + Math.sin(z * 0.3 - t * 1.1 + x * 0.05) * amp * 0.6);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
  };
  return me;
}

/* mur percé (fenêtres, portes) : une plaque tricotée épaisse */
function wallPanel(w, h, holes = [], o = {}) {
  const sh = new T.Shape();
  sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h);
  if (o.gable) { sh.lineTo(0, h + o.gable); }
  sh.lineTo(-w / 2, h); sh.lineTo(-w / 2, 0);
  holes.forEach(([x, y, hw, hh, arch]) => {
    const p = new T.Path();
    p.moveTo(x - hw / 2, y); p.lineTo(x + hw / 2, y);
    if (arch) { p.lineTo(x + hw / 2, y + hh - hw / 2); p.absarc(x, y + hh - hw / 2, hw / 2, 0, Math.PI, false); } else { p.lineTo(x + hw / 2, y + hh); p.lineTo(x - hw / 2, y + hh); }
    p.lineTo(x - hw / 2, y);
    sh.holes.push(p);
  });
  const d = o.depth || 3;
  const g = new T.ExtrudeGeometry(sh, { depth: d - 0.8, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2, curveSegments: 16 });
  g.translate(0, 0, -d / 2 + 0.4);
  g.computeVertexNormals();
  return mesh(g, wool(o.color || '#F1E6D2', o.kind || 'knit', { scale: o.scale || 0.9, bump: o.bump || 1 }));
}
/* semis d'instances (pavés, cailloux, mousse…) */
function scatter(geo, mat, n, place, o = {}) {
  const im = new T.InstancedMesh(geo, mat, n);
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), c = new T.Color(), pos = v3(), sc = v3();
  const r = rng(o.seed || 31);
  for (let i = 0; i < n; i++) {
    const P = place(i, r) || {};
    pos.set(...(P.p || [0, 0, 0]));
    e.set(...(P.r || [0, 0, 0]));
    q.setFromEuler(e);
    const s = P.s != null ? P.s : 1;
    if (Array.isArray(s)) sc.set(...s); else sc.setScalar(s);
    m4.compose(pos, q, sc);
    im.setMatrixAt(i, m4);
    if (P.c) im.setColorAt(i, c.set(P.c));
  }
  im.castShadow = o.cast !== false;
  im.receiveShadow = true;
  return im;
}
/* flamme de bougie : une goutte lumineuse et sa lumière */
function flame(V, o = {}) {
  const g = new T.Group();
  const prof = [[0, 0], [0.42, 0.35], [0.5, 0.8], [0.32, 1.35], [0, 2.0]];
  const f = mesh(latheGeo(prof.map(([r, y]) => [r * (o.s || 1), y * (o.s || 1)]), { seg: 14 }), glowMat(o.color || '#FFB347', o.k || 4), { cast: false });
  const core = mesh(latheGeo(prof.map(([r, y]) => [r * 0.5 * (o.s || 1), y * 0.6 * (o.s || 1)]), { seg: 10 }), glowMat('#FFF2C4', 6), { cast: false });
  core.position.y = 0.1;
  g.add(f, core);
  const L = new T.PointLight(col(o.light || '#FF9F4A'), o.power || 600, o.dist || 70, 2);
  L.position.y = 1.2 * (o.s || 1);
  L.castShadow = !!o.shadow;
  if (L.castShadow) { L.shadow.mapSize.set(512, 512); L.shadow.bias = -0.002; L.shadow.radius = 3; }
  g.add(L);
  g.userData.light = L;
  g.userData.power = o.power || 600;
  V.anim((t, f2) => {
    const k = 0.85 + hashi(f2, 3) * 0.3;
    f.scale.set(1, 0.9 + hashi(f2, 5) * 0.25, 1);
    f.rotation.z = (hashi(f2, 7) - 0.5) * 0.25;
    L.intensity = g.userData.power * k * (g.visible ? 1 : 0);
  });
  return g;
}
