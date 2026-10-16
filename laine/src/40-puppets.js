/* ------------------------------------------------------------------
   Les marionnettes, façon amigurumi (animaux et poupées au crochet) :
   têtes rondes, yeux-perles, joues de feutrine, bouches brodées.
   Chaque fabrique rend { g, p } : le groupe posé au sol (pieds en y = 0)
   et ses parties articulées, que les décors animent image par image.
------------------------------------------------------------------- */
function at(obj, x = 0, y = 0, z = 0) { obj.position.set(x, y, z); return obj; }
function grp(...kids) { const g = new T.Group(); kids.forEach((k) => k && g.add(k)); return g; }
/* point de la surface d'un ellipsoïde (azimut autour de y, élévation), et sa normale */
function surf(r, az, el) {
  const a = az * DEG, e = el * DEG;
  const d = v3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
  const p = v3(d.x * r[0], d.y * r[1], d.z * r[2]);
  const n = v3(d.x / r[0], d.y / r[1], d.z / r[2]).normalize();
  return { p, n };
}
function faceTo(obj, n) { obj.quaternion.setFromUnitVectors(v3(0, 0, 1), n); return obj; }
/* membre : un haricot de laine accroché par le haut (pivot à l'épaule ou à la hanche) */
function limb(len, r, color, o = {}) {
  const piv = new T.Group();
  const m = woolBall(r, color, o.kind || 'crochet', { sx: 1, sy: (len / 2 + r * 0.4) / r, sz: o.sz || 1, seed: o.seed || 5, fuzz: o.fuzz || 0.07, lump: 0.05 });
  m.position.y = -len / 2;
  piv.add(m);
  if (o.end) { const e = woolBall(o.end.r || r * 1.15, o.end.color || color, 'crochet', { sy: o.end.sy || 0.8, seed: 9, fuzz: 0.06 }); e.position.y = -len - (o.end.dy || 0); if (o.end.z) e.position.z = o.end.z; piv.add(e); }
  piv.userData.len = len;
  return piv;
}
/* yeux, joues, bouche, sur une tête ellipsoïdale de rayons r */
function faceOn(head, r, o = {}) {
  const eyes = [];
  const er = o.eyeR || r[0] * 0.13, spread = o.spread || 24, ey = o.eyeY != null ? o.eyeY : 8;
  for (const s of [-1, 1]) {
    const { p, n } = surf(r, s * spread, ey);
    if (o.sleep) {
      const c = p.clone().add(n.clone().multiplyScalar(0.05));
      const t = v3(n.z, 0, -n.x).normalize().multiplyScalar(er * 1.3);
      const e = yarn([c.clone().sub(t).add(v3(0, er * 0.35, 0)), c.clone().add(v3(0, -er * 0.3, 0)), c.clone().add(t).add(v3(0, er * 0.35, 0))], er * 0.28, o.ink || '#2A1A12', { radial: 5 });
      head.add(e);
      eyes.push(e);
    } else {
      if (o.whites) {
        const w = felt(circleShape(er * 1.75), o.whites, 0.16, { fuzz: false });
        faceTo(at(w, p.x, p.y, p.z), n);
        head.add(w);
      }
      const b = bead(er, o.eyeCol || '#141210', { flat: 0.75 });
      faceTo(at(b, p.x + n.x * (o.whites ? 0.12 : 0), p.y + n.y * (o.whites ? 0.12 : 0), p.z + n.z * (o.whites ? 0.12 : 0)), n);
      head.add(b);
      eyes.push(b);
    }
  }
  if (o.cheeks) {
    for (const s of [-1, 1]) {
      const { p, n } = surf(r, s * (spread + 20), ey - 16);
      const c = felt(circleShape(er * 1.15), o.cheeks, 0.12, { fuzz: false });
      faceTo(at(c, p.x, p.y, p.z), n);
      head.add(c);
    }
  }
  if (o.mouth !== false) {
    const mw = o.mouthW || 9, my = o.mouthY != null ? o.mouthY : -14;
    const pts = [-mw, 0, mw].map((a, i) => { const q = surf(r, a, my - (i === 1 ? (o.mouth === 'o' ? 0 : 5) : 0)); return q.p.add(q.n.multiplyScalar(0.06)); });
    if (o.mouth === 'o') {
      const q = surf(r, 0, my);
      const m = mesh(new T.TorusGeometry(er * 0.7, er * 0.22, 6, 14), wool(o.ink || '#4A1E1A', 'plain'));
      faceTo(at(m, q.p.x, q.p.y, q.p.z), q.n);
      head.add(m);
    } else head.add(yarn(pts, er * 0.22, o.ink || '#3A1E16', { radial: 5 }));
  }
  return eyes;
}
/* clignement des yeux de temps en temps (une image sur deux secondes et demie) */
function blinker(eyes, seed = 1) {
  return (t, f) => {
    const k = Math.floor(f / 2);
    const shut = hashi(Math.floor(k / 14), seed) < 0.55 && k % 14 === 0;
    eyes.forEach((e) => { if (!e.userData.base) e.userData.base = e.scale.clone(); e.scale.copy(e.userData.base); if (shut) e.scale.y *= 0.12; });
  };
}

/* ---------------- poupée ---------------- */
function doll(o = {}) {
  const h = o.h || 14, R = h * 0.2;
  const skin = o.skin || '#F3C9A6', topC = o.top || '#E5484D', botC = o.bottom || '#3E6FD8';
  const g = new T.Group(), p = {};
  const legH = h * 0.2, bodyH = h * 0.4;
  const body = new T.Group();
  body.position.y = legH;
  g.add(body);
  p.body = body;
  // jambes
  for (const s of [-1, 1]) {
    const leg = limb(legH * 0.8, h * 0.05, o.legs || botC, { end: { r: h * 0.062, color: o.shoes || '#3A2A22', sy: 0.7, z: h * 0.02 } });
    leg.position.set(s * h * 0.065, legH, 0);
    g.add(leg);
    p[s < 0 ? 'legL' : 'legR'] = leg;
  }
  // corps : robe évasée ou tunique
  const br = h * 0.15, flare = o.dress ? 1.55 : 1.08;
  const prof = [[0, 0], [br * flare, 0], [br * flare * 1.02, bodyH * 0.1], [br * (o.dress ? 1.15 : 1.0), bodyH * 0.55], [br * 0.82, bodyH * 0.9], [br * 0.5, bodyH], [0, bodyH]];
  const torso = mesh(latheGeo(prof, { seg: 26, lump: 0.05 }), wool(topC, o.topKind || 'knit', { scale: 0.55 }));
  fuzz(torso, 0.08);
  body.add(torso);
  if (o.belt) { const b = mesh(new T.TorusGeometry(br * 1.02, h * 0.018, 6, 24), wool(o.belt, 'yarn')); b.rotation.x = Math.PI / 2; b.position.y = bodyH * 0.55; body.add(b); }
  if (o.collar) {
    const c = mesh(new T.TorusGeometry(br * 0.62, h * 0.032, 8, 28), wool(o.collar, 'crochet', { scale: 0.5 }));
    c.rotation.x = Math.PI / 2; c.position.y = bodyH * 0.96; body.add(c);
    if (o.ruff) { const rf = mesh(latheGeo([[br * 0.5, 0], [br * 1.25, h * 0.02], [br * 1.3, h * 0.05], [br * 0.6, h * 0.06]], { seg: 24, lump: 0.25, freq: 3 }), wool(o.collar, 'crochet', { scale: 0.5 })); rf.position.y = bodyH * 0.9; body.add(rf); }
  }
  if (o.buttons) for (let i = 0; i < o.buttons.n; i++) { const b = woolBall(h * 0.035, o.buttons.color, 'crochet', { fuzz: o.buttons.fuzz || 0.12 }); const q = bodyH * (0.75 - i * 0.22); b.position.set(0, q, br * (1.02 + (0.75 - q / bodyH) * 0.12)); body.add(b); }
  // bras
  for (const s of [-1, 1]) {
    const arm = limb(h * 0.2, h * 0.045, o.sleeves || topC, { kind: 'knit', end: { r: h * 0.048, color: skin, sy: 0.9 } });
    arm.position.set(s * br * 0.92, bodyH * 0.86, 0);
    arm.rotation.z = s * 0.22;
    body.add(arm);
    p[s < 0 ? 'armL' : 'armR'] = arm;
  }
  // tête
  const head = new T.Group();
  head.position.y = bodyH + R * 0.88;
  body.add(head);
  p.head = head;
  const hr = [R, R * 0.95, R * 0.92];
  const hm = woolBall(R, skin, 'crochet', { sy: 0.95, sz: 0.92, seed: 2, fuzz: 0.05, lump: 0.025 });
  head.add(hm);
  p.eyes = faceOn(head, hr, { sleep: o.sleep, cheeks: o.cheeks !== false ? (o.cheeks || '#F09A8E') : null, mouth: o.mouth, eyeR: R * 0.12, spread: 22, eyeY: 2, mouthY: -24, mouthW: 10 });
  if (o.nose !== false) { const nz = surf(hr, 0, -8); const n = woolBall(R * 0.1, darken(skin, 0.08).getStyle(), 'crochet', { fuzz: false }); at(n, nz.p.x, nz.p.y, nz.p.z); head.add(n); }
  // cheveux
  const hairC = o.hair || '#6B3E26', style = o.hairStyle || 'bob';
  if (style !== 'none') {
    if (style === 'tonsure') {
      const ring = mesh(new T.TorusGeometry(R * 0.92, R * 0.18, 10, 30), wool(hairC, 'crochet', { scale: 0.5 }));
      ring.rotation.x = Math.PI / 2 - 0.25; ring.position.set(0, R * 0.1, -R * 0.1);
      fuzz(ring, 0.12); head.add(ring);
    } else {
      const cap = woolBall(R * 1.06, hairC, 'crochet', { sy: style === 'bun' || style === 'short' ? 0.84 : 0.95, sz: 1.0, seed: 4, fuzz: 0.14, mat: { scale: 0.5 } });
      cap.position.set(0, R * (style === 'bob' ? 0.12 : 0.2), -R * 0.16);
      cap.scale.set(1, 1, 1);
      head.add(cap);
      // frange : quelques boucles de fil
      if (o.fringe !== false) for (let i = -3; i <= 3; i++) {
        const q = surf(hr, i * 10, 44 - Math.abs(i) * 2);
        const b = woolBall(R * 0.17, hairC, 'crochet', { seed: 10 + i, fuzz: 0.1, sy: 0.75 });
        at(b, q.p.x * 0.97, q.p.y * 0.97, q.p.z * 0.97);
        head.add(b);
      }
      if (style === 'bob') for (const s of [-1, 1]) { const b = woolBall(R * 0.42, hairC, 'crochet', { sy: 1.25, seed: 20 + s, fuzz: 0.13 }); at(b, s * R * 0.86, -R * 0.12, -R * 0.2); head.add(b); }
      if (style === 'pigtails') for (const s of [-1, 1]) {
        const pts = [[s * R * 0.9, R * 0.1, -R * 0.3], [s * R * 1.35, -R * 0.3, -R * 0.2], [s * R * 1.25, -R * 0.95, 0]];
        head.add(yarn(pts, R * 0.18, hairC, { fuzz: 0.08 }));
        const bow = woolBall(R * 0.16, o.ribbon || '#F28AA0', 'felt', { sx: 1.6, sy: 0.8, fuzz: false }); at(bow, s * R * 1.0, R * 0.05, -R * 0.3); head.add(bow);
      }
      if (style === 'bun') { const b = woolBall(R * 0.42, hairC, 'crochet', { seed: 31, fuzz: 0.12 }); at(b, 0, R * 0.95, -R * 0.35); head.add(b); }
    }
  }
  // chapeau
  if (o.hat) {
    const H = o.hat, hc = H.color || '#3E6FD8';
    let hat = null;
    if (H.type === 'beret') { hat = woolBall(R * 1.05, hc, 'knit', { sy: 0.32, seed: 7, fuzz: 0.1 }); at(hat, R * 0.1, R * 0.82, -R * 0.05); hat.rotation.z = -0.25; }
    else if (H.type === 'night') {
      hat = mesh(latheGeo([[R * 0.98, 0], [R * 0.8, R * 0.5], [R * 0.4, R * 1.1], [0.1, R * 1.6]], { seg: 22, lump: 0.05 }), wool(hc, 'knit', { scale: 0.5 }));
      at(hat, 0, R * 0.42, -R * 0.08); hat.rotation.z = 0.55; hat.rotation.x = -0.2;
      const pp = woolBall(R * 0.26, H.pompom || '#FFFFFF', 'crochet', { fuzz: 0.2 }); pp.position.y = R * 1.65; hat.add(pp);
    } else if (H.type === 'crown') {
      const sh = new T.Shape();
      const n = 5, cw = R * 2.1 * Math.PI, ch = R * 0.6;
      sh.moveTo(0, 0);
      for (let i = 0; i < n; i++) { sh.lineTo((i + 0.5) / n * cw, ch * 1.5); sh.lineTo((i + 1) / n * cw, ch * 0.5); }
      sh.lineTo(cw, 0); sh.lineTo(0, 0);
      const geo = feltGeo(sh, 0.3, { bevel: 0.08 });
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const a = (x / cw) * TAU, rr = R * 0.82 + z; pos.setXYZ(i, Math.cos(a) * rr, y, Math.sin(a) * rr); }
      geo.computeVertexNormals();
      hat = mesh(geo, metalMat(H.color || '#E8B83A', { rough: 0.45 }));
      at(hat, 0, R * 0.62, 0);
      for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * TAU; const j = bead(R * 0.1, i % 2 ? '#D33A3A' : '#3E6FD8'); at(j, Math.cos(a) * R * 0.86, R * 0.25, Math.sin(a) * R * 0.86); j.lookAt(Math.cos(a) * R * 3, R * 0.25, Math.sin(a) * R * 3); hat.add(j); }
    } else if (H.type === 'cap') {
      hat = woolBall(R * 1.04, hc, 'knit', { sy: 0.55, seed: 8, fuzz: 0.08 }); at(hat, 0, R * 0.52, -R * 0.08);
      const brim = felt(ellipseShape(R * 0.6, R * 0.35), hc, 0.25, { fuzz: false }); brim.rotation.x = -Math.PI / 2 + 0.2; at(brim, 0, R * 0.42, R * 0.82); head.add(brim);
    } else if (H.type === 'scarf') {
      hat = woolBall(R * 1.1, hc, 'knit', { sy: 0.92, seed: 12, fuzz: 0.1 }); at(hat, 0, R * 0.14, -R * 0.12); hat.scale.set(1.02, 1, 1);
      const knot = woolBall(R * 0.2, hc, 'knit', { fuzz: 0.1 }); at(knot, 0, -R * 0.8, R * 0.62); head.add(knot);
    } else if (H.type === 'straw') {
      hat = new T.Group();
      const brim = mesh(latheGeo([[0.1, 0], [R * 1.75, -R * 0.05], [R * 1.85, R * 0.04], [R * 0.9, R * 0.06]], { seg: 30, lump: 0.04 }), wool(hc, 'weave', { scale: 1 }));
      const crown = mesh(latheGeo([[R * 0.85, 0], [R * 0.8, R * 0.42], [R * 0.6, R * 0.55], [0.1, R * 0.58]], { seg: 24 }), wool(hc, 'weave', { scale: 1 }));
      hat.add(brim, crown);
      if (H.band) { const b = mesh(new T.TorusGeometry(R * 0.84, R * 0.08, 6, 24), wool(H.band, 'felt')); b.rotation.x = Math.PI / 2; b.position.y = R * 0.12; hat.add(b); }
      at(hat, 0, R * 0.7, -R * 0.05); hat.rotation.x = -0.12;
    }
    if (hat) { head.add(hat); p.hat = hat; }
  }
  if (o.beard) { const b = woolBall(R * 0.55, o.beard, 'crochet', { sx: 1.25, sy: 1.0, sz: 0.7, seed: 41, fuzz: 0.22 }); at(b, 0, -R * 0.62, R * 0.52); head.add(b); }
  if (o.cape) {
    const cape = mesh(latheGeo([[br * 0.55, bodyH], [br * 0.9, bodyH * 0.85], [br * 1.45, bodyH * 0.25], [br * 1.7, -legH * 0.6]], { seg: 28 }), wool(o.cape, 'knit', { scale: 0.55, side: T.DoubleSide }));
    cape.scale.z = 0.9; cape.position.z = -br * 0.15;
    // la cape ne couvre que le dos
    const pos = cape.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) if (pos.getZ(i) > 0) pos.setZ(i, pos.getZ(i) * 0.12 - 0.2);
    cape.geometry.computeVertexNormals();
    body.add(cape);
    p.cape = cape;
  }
  g.userData.h = h;
  return { g, p, R, bodyH, legH };
}

/* ---------------- petite bête à quatre pattes ou debout ---------------- */
function critter(o = {}) {
  const s = o.size || 10, c = o.color || '#9AA0A6', belly = o.belly || lighten(c, 0.45).getStyle();
  const g = new T.Group(), p = {};
  const stand = o.pose === 'stand';
  const body = new T.Group();
  g.add(body);
  p.body = body;
  const br = [s * (o.bw || 0.32), s * (o.bh || 0.3), s * (o.bl || 0.45)];
  if (stand) { br[1] = s * 0.36; br[2] = s * 0.3; br[0] = s * 0.3; }
  const bm = woolBall(1, c, o.kind || 'crochet', { sx: br[0], sy: br[1], sz: br[2], seed: 3, fuzz: o.fuzz || 0.12, lump: 0.04 });
  body.add(bm);
  if (o.belly !== false) {
    const bb = woolBall(1, belly, 'crochet', { sx: br[0] * 0.72, sy: br[1] * 0.78, sz: br[2] * 0.5, seed: 4, fuzz: 0.08 });
    if (stand) at(bb, 0, -br[1] * 0.12, br[2] * 0.52); else at(bb, 0, -br[1] * 0.35, br[2] * 0.2);
    body.add(bb);
  }
  const legL = s * (o.legLen || (stand ? 0.22 : 0.2)), lr = s * 0.07;
  body.position.y = legL + br[1] * (stand ? 0.85 : 0.75);
  // pattes
  const legs = stand ? [[-1, 0], [1, 0]] : [[-1, 1], [1, 1], [-1, -1], [1, -1]];
  p.legs = legs.map(([sx, sz], i) => {
    const L = limb(legL + br[1] * 0.25, lr, o.legCol || c, { end: { r: lr * 1.25, color: o.paw || darken(c, 0.08).getStyle(), sy: 0.7, z: lr * 0.4 }, seed: i + 7 });
    L.position.set(sx * br[0] * 0.55, -br[1] * 0.25, sz * br[2] * 0.55);
    body.add(L);
    return L;
  });
  if (stand) {
    p.arms = [-1, 1].map((sx, i) => {
      const A = limb(s * 0.24, lr * 0.9, c, { end: { r: lr * 1.1, color: o.paw || c }, seed: i + 13 });
      A.position.set(sx * br[0] * 0.92, br[1] * 0.45, br[2] * 0.1);
      A.rotation.z = sx * 0.35;
      body.add(A);
      return A;
    });
  }
  // tête
  const head = new T.Group();
  const hs = s * (o.head || 0.3);
  const hr = [hs, hs * 0.92, hs * 0.95];
  if (stand) at(head, 0, br[1] + hs * 0.72, br[2] * 0.05); else at(head, 0, br[1] * 0.75, br[2] * 0.85 + hs * 0.35);
  body.add(head);
  p.head = head;
  head.add(woolBall(1, o.headCol || c, o.kind || 'crochet', { sx: hr[0], sy: hr[1], sz: hr[2], seed: 6, fuzz: o.fuzz || 0.1, lump: 0.03 }));
  // museau
  const sn = o.snout != null ? o.snout : 0.45;
  let tipZ = hr[2];
  if (sn > 0) {
    const snout = woolBall(1, o.snoutCol || belly, 'crochet', { sx: hs * 0.42, sy: hs * 0.32, sz: hs * sn, seed: 8, fuzz: 0.08 });
    at(snout, 0, -hs * 0.22, hr[2] * 0.72);
    head.add(snout);
    tipZ = hr[2] * 0.72 + hs * sn * 0.95;
  }
  const nose = woolBall(hs * (o.noseR || 0.11), o.nose || '#2A1E1E', 'crochet', { fuzz: false, sy: 0.8 });
  at(nose, 0, -hs * (sn > 0 ? 0.12 : 0.1), tipZ);
  head.add(nose);
  p.eyes = faceOn(head, hr, { cheeks: o.cheeks, mouth: false, eyeR: hs * (o.eyeR || 0.13), spread: o.eyeSpread || 30, eyeY: o.eyeY != null ? o.eyeY : 14, sleep: o.sleep, whites: o.whites });
  // oreilles
  const et = o.ears || 'round', ec = o.earIn || '#F2A7B5';
  p.ears = [-1, 1].map((sx) => {
    const e = new T.Group();
    const q = surf(hr, sx * (o.earAz || 38), o.earEl || 58);
    at(e, q.p.x, q.p.y, q.p.z);
    if (et === 'round') {
      const outer = felt(circleShape(hs * (o.earR || 0.42)), o.earCol || c, 0.5, { fuzz: 0.09 });
      const inner = felt(circleShape(hs * (o.earR || 0.42) * 0.62), ec, 0.2, { fuzz: false });
      inner.position.z = 0.25;
      e.add(outer, inner);
      e.rotation.set(-0.1, sx * 0.35, sx * -0.2);
    } else if (et === 'point') {
      const sh = polyShape([[-hs * 0.32, 0], [hs * 0.32, 0], [hs * 0.04, hs * (o.earH || 0.75)]]);
      const outer = felt(sh, o.earCol || c, 0.55, { fuzz: 0.1, bevel: 0.2 });
      const sh2 = polyShape([[-hs * 0.18, hs * 0.06], [hs * 0.18, hs * 0.06], [hs * 0.03, hs * (o.earH || 0.75) * 0.72]]);
      const inner = felt(sh2, ec, 0.2, { fuzz: false });
      inner.position.z = 0.28;
      e.add(outer, inner);
      e.rotation.set(-0.15, sx * 0.25, sx * -0.28);
      e.position.y -= hs * 0.12;
    } else if (et === 'long') {
      const outer = woolBall(1, o.earCol || c, 'crochet', { sx: hs * 0.24, sy: hs * (o.earH || 0.9), sz: hs * 0.12, seed: 15 + sx, fuzz: 0.1 });
      outer.position.y = hs * (o.earH || 0.9) * 0.85;
      const inner = felt(ellipseShape(hs * 0.13, hs * (o.earH || 0.9) * 0.75), ec, 0.15, { fuzz: false });
      inner.position.set(0, hs * (o.earH || 0.9) * 0.85, hs * 0.11);
      e.add(outer, inner);
      e.rotation.set(-0.12, 0, sx * -0.18);
    }
    head.add(e);
    return e;
  });
  // queue
  const tt = o.tail || 'thin';
  if (tt !== 'none') {
    const tail = new T.Group();
    at(tail, 0, stand ? -br[1] * 0.4 : 0, -br[2] * 0.92);
    if (tt === 'thin') {
      const L = s * (o.tailLen || 1.1);
      const up = o.tailUp || 0;
      tail.add(yarn([[0, 0, 0], [0, (-0.15 + up * 0.3) * L, -L * 0.3], [L * 0.15, (-0.3 + up * 0.6) * L, -L * 0.6], [-L * 0.1, (-0.34 + up * 0.9) * L, -L * 0.85], [L * 0.12, (-0.3 + up * 1.1) * L, -L * 1.0]], s * 0.035, o.tailCol || ec, { radial: 6 }));
    } else if (tt === 'bushy') {
      const tb = woolBall(1, c, 'crochet', { sx: s * 0.18, sy: s * 0.18, sz: s * 0.48, seed: 17, fuzz: 0.3 });
      tb.position.set(0, s * 0.18, -s * 0.38);
      tb.rotation.x = 0.7;
      tail.add(tb);
      if (o.tailTip) { const tip = woolBall(s * 0.15, o.tailTip, 'crochet', { fuzz: 0.25 }); tip.position.set(0, s * 0.42, -s * 0.66); tail.add(tip); }
    } else if (tt === 'pompom') {
      const tb = woolBall(s * 0.14, o.tailCol || '#FFFFFF', 'crochet', { fuzz: 0.25 });
      tail.add(tb);
    }
    body.add(tail);
    p.tail = tail;
  }
  g.userData.h = body.position.y + br[1] + hs * 2;
  return { g, p, s, br, hs };
}

/* ---------------- oiseau ---------------- */
function bird(o = {}) {
  const r = o.r || 4, c = o.color || '#8B6A4E', belly = o.belly || lighten(c, 0.4).getStyle();
  const g = new T.Group(), p = {};
  const body = new T.Group();
  g.add(body);
  p.body = body;
  const legH = o.legs === false ? 0 : r * (o.legH || 0.55);
  body.position.y = legH + r * 0.85;
  const br = [r * (o.bw || 0.95), r * (o.bh || 0.9), r * (o.bl || 1.05)];
  body.add(woolBall(1, c, o.kind || 'crochet', { sx: br[0], sy: br[1], sz: br[2], seed: 11, fuzz: o.fuzz || 0.1, lump: 0.04 }));
  if (o.belly !== false) {
    const bb = woolBall(1, belly, 'crochet', { sx: br[0] * 0.72, sy: br[1] * 0.75, sz: br[2] * 0.45, seed: 12, fuzz: 0.08 });
    at(bb, 0, -br[1] * 0.12, br[2] * 0.58);
    body.add(bb);
  }
  // tête intégrée au corps (boule) ou séparée
  const head = new T.Group();
  const hs = r * (o.head || 0.62);
  const hr = [hs, hs, hs];
  at(head, 0, br[1] * (o.headY || 0.62), br[2] * (o.headZ || 0.4));
  body.add(head);
  p.head = head;
  if (o.head !== 0) head.add(woolBall(hs, o.headCol || c, 'crochet', { seed: 13, fuzz: 0.1 }));
  const eyeHost = o.head === 0 ? body : head, eyeR = o.head === 0 ? br : hr;
  if (o.owl) {
    // grands yeux d'hibou : disques de feutrine
    p.eyes = [];
    for (const sx of [-1, 1]) {
      const q = surf(eyeR, sx * 28, 12);
      const d1 = felt(circleShape(hs * 0.48), o.owl.ring || '#F3E3C2', 0.3, { fuzz: 0.06 });
      const d2 = felt(circleShape(hs * 0.3), o.owl.iris || '#F5C32C', 0.25, { fuzz: false });
      d2.position.z = 0.2;
      const b = bead(hs * 0.17, '#111');
      b.position.z = 0.42;
      const e = grp(d1, d2, b);
      faceTo(at(e, q.p.x, q.p.y, q.p.z), q.n);
      eyeHost.add(e);
      p.eyes.push(b);
    }
    for (const sx of [-1, 1]) { const tuft = felt(polyShape([[-hs * 0.18, 0], [hs * 0.18, 0], [sx * hs * 0.2, hs * 0.55]]), o.headCol || c, 0.4, { fuzz: 0.08 }); const q = surf(eyeR, sx * 40, 62); at(tuft, q.p.x, q.p.y, q.p.z); tuft.rotation.z = -sx * 0.3; eyeHost.add(tuft); }
  } else {
    p.eyes = faceOn(eyeHost, eyeR, { mouth: false, eyeR: (o.head === 0 ? r : hs) * (o.eyeR || 0.16), spread: o.eyeSpread || 34, eyeY: o.eyeY != null ? o.eyeY : 14, cheeks: o.cheeks, sleep: o.sleep });
  }
  // bec
  const bk = o.beak || '#F2A93B';
  const q = surf(eyeR, 0, o.owl ? -8 : 0);
  const beak = mesh(new T.ConeGeometry((o.head === 0 ? r : hs) * 0.2, (o.head === 0 ? r : hs) * (o.beakL || 0.45), 12), wool(bk, 'felt'));
  beak.rotation.x = Math.PI / 2 + (o.owl ? 0.5 : 0.1);
  at(beak, q.p.x, q.p.y, q.p.z + (o.head === 0 ? r : hs) * 0.12);
  eyeHost.add(beak);
  p.beak = beak;
  if (o.comb) {
    const sh = new T.Shape();
    sh.moveTo(-hs * 0.4, 0);
    [[-0.3, 0.42], [-0.12, 0.2], [0, 0.55], [0.12, 0.2], [0.3, 0.42]].forEach(([x, y], i, a) => sh.quadraticCurveTo(hs * (x - 0.06), hs * (y + 0.12), hs * x, hs * y));
    sh.lineTo(hs * 0.4, 0); sh.lineTo(-hs * 0.4, 0);
    const cm = felt(sh, o.comb, 0.5, { fuzz: 0.05, bevel: 0.18 });
    cm.rotation.y = Math.PI / 2;
    at(cm, 0, hs * 0.82, 0);
    eyeHost.add(cm);
    const wat = woolBall(hs * 0.16, o.comb, 'felt', { sy: 1.4, fuzz: false });
    at(wat, 0, -hs * 0.25, hs * 0.92);
    eyeHost.add(wat);
  }
  // ailes
  const wc = o.wing || darken(c, 0.12).getStyle();
  p.wings = [-1, 1].map((sx) => {
    const piv = new T.Group();
    at(piv, sx * br[0] * 0.88, br[1] * 0.25, 0);
    const w = feltPiece(leafShape(r * 0.85, r * 1.5, sx * r * 0.1), wc, { depth: 0.4, inset: 0.28, st: { len: 0.25, gap: 0.16, r: 0.035 }, stitch: o.wingStitch || lighten(wc, 0.5).getStyle(), fuzz: 0.05, back: false });
    w.rotation.set(Math.PI / 2 + 0.6, 0, sx * (Math.PI / 2 - 0.25));
    w.position.set(sx * 0.15, -r * 0.35, -r * 0.1);
    piv.add(w);
    body.add(piv);
    return piv;
  });
  // queue
  if (o.tail !== 'none') {
    const tail = new T.Group();
    at(tail, 0, br[1] * 0.1, -br[2] * 0.92);
    const n = o.tail === 'fan' ? 3 : 1;
    for (let i = 0; i < n; i++) {
      const f = felt(leafShape(r * 0.45, r * (o.tail === 'fan' ? 1.3 : 0.9)), i === 1 ? wc : c, 0.35, { fuzz: 0.05 });
      f.rotation.set(-0.9 - (o.tailUp || 0), (i - (n - 1) / 2) * 0.45, 0);
      f.position.set((i - (n - 1) / 2) * r * 0.25, r * 0.4, -r * 0.25);
      tail.add(f);
    }
    body.add(tail);
    p.tail = tail;
  }
  // pattes en fil
  if (o.legs !== false) {
    p.legs = [-1, 1].map((sx) => {
      const L = new T.Group();
      at(L, sx * r * 0.35, legH + 0.2, r * 0.1);
      const lc = o.legCol || '#E8962E';
      L.add(yarn([[0, 0, 0], [0, -legH, 0]], r * 0.07, lc, { radial: 5 }));
      for (const a of [-0.5, 0, 0.5]) L.add(yarn([[0, -legH, 0], [Math.sin(a) * r * 0.32, -legH - 0.05, Math.cos(a) * r * 0.32]], r * 0.06, lc, { radial: 5 }));
      g.add(L);
      return L;
    });
  }
  g.userData.h = legH + r * 1.9;
  return { g, p, r };
}

/* ---------------- la note envolée : une croche en feutrine qui bat des ailes ---------------- */
function noteBird(color, o = {}) {
  const g = new T.Group();
  const s = o.s || 1;
  const head = woolBall(1.25 * s, color, 'crochet', { sx: 1.25, sy: 0.95, sz: 0.9, fuzz: 0.1, seed: 3 });
  head.rotation.z = 0.35;
  g.add(head);
  const stem = yarn([[1.15 * s, 0.25 * s, 0], [1.2 * s, 2.6 * s, 0], [1.22 * s, 4.6 * s, 0]], 0.2 * s, darken(color, 0.25).getStyle(), { radial: 6 });
  g.add(stem);
  const flag = felt(blobShape([[0, 0], [1.4, -0.6], [2.0, -1.9], [1.5, -2.6], [1.5, -1.6], [0.4, -1.2], [0, -1.0]].map(([x, y]) => [x * s, y * s])), darken(color, 0.12).getStyle(), 0.3, { fuzz: 0.04 });
  flag.position.set(1.22 * s, 4.65 * s, 0);
  g.add(flag);
  for (const e of [-1, 1]) { const b = bead(0.18 * s); at(b, e * 0.42 * s + 0.1 * s, 0.25 * s, 0.86 * s); g.add(b); }
  const wings = [-1, 1].map((sx) => {
    const piv = new T.Group();
    at(piv, -0.1 * s, 0.4 * s, sx * 0.5 * s);
    const w = felt(leafShape(1.3 * s, 2.4 * s), '#FFFFFF', 0.16, { fuzz: 0.06 });
    w.position.y = 1.0 * s;
    w.rotation.x = sx * 0.25;
    piv.add(w);
    piv.rotation.y = sx * 0.3;
    g.add(piv);
    return piv;
  });
  g.userData.wings = wings;
  return g;
}
