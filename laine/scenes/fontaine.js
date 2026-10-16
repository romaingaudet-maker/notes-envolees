/* ============ À la claire fontaine : la clairière à l'heure dorée ============
   Une fontaine de pierre tricotée, son bassin d'eau claire et sa vasque ;
   une petite fille assise sur la margelle trempe les pieds ; le rossignol
   chante sur la plus haute branche du chêne. Avancement : le jet monte et
   l'eau scintille de plus en plus, les lucioles s'allument. Note trouvée :
   des bulles. Phrase : le rossignol chante (notes de fil qui montent).
   Fin : des jets qui dansent tout autour, un arc-en-ciel de fil dans la
   brume irisée, des étincelles. Écoute : les pieds battent l'eau en rythme. */
SCENES.fontaine = {
  color: '#E8A87A',
  view: {
    bg: '#D89A78', fov: 26,
    rig: { target: [1, 12, -1], az: 0, el: 8, box: [56, 47], targetWide: [2, 15, -1], boxWide: [96, 42] },
    post: { exposure: 1.1, bloom: 0.75, bloomThr: 0.9, aper: 7, maxBlur: 11, sat: 1.12, lift: '#120A18', gain: '#FFF6EA', punch: 1.24, vignette: 0.42, grain: 0.04 },
  },
  sky: [-28, 10, 25, 33, -16, -4],
  home: [0, 15, -2],
  flock: 6,
  build(V, o) {
    const song = o.song, NP = song.phrases.length, live = !o.portrait;
    studioLights(V, {
      key: { color: '#FFB874', k: 2.7, az: -66, el: 22, area: 80 },
      fill: { sky: '#8C9ED6', ground: '#6A5030', k: 0.45 },
      rim: { color: '#FFC27A', k: 2.0, az: 150, el: 18 },
      env: { sky: '#C8B8D8', ground: '#5A4A30', k: 0.35, boxK: 3 },
      fog: { color: '#E6BC94', near: 230, far: 680 },
    });
    const noShadow = (g) => { g.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return g; };
    const faceCam = (m) => { const g = m.geometry, n = g.attributes.normal; if (n.getZ(n.count - 25) < 0) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } ix.needsUpdate = true; g.computeVertexNormals(); } return m; };
    const lighter = (root, maxR, seg, shells) => {
      root.traverse((m) => {
        if (shells && m.userData.isFuzz) m.count = Math.min(m.count, shells);
        if (!m.isMesh || m.isInstancedMesh || !m.geometry || m.geometry.type !== 'SphereGeometry') return;
        const g = m.geometry;
        g.computeBoundingBox();
        const b = g.boundingBox, rx = (b.max.x - b.min.x) / 2, ry = (b.max.y - b.min.y) / 2, rz = (b.max.z - b.min.z) / 2;
        if (Math.max(rx, ry, rz) > maxR) return;
        const ng = blobGeo(rx, ry, rz, { seg, lump: 0.03 });
        ng.translate((b.max.x + b.min.x) / 2, (b.max.y + b.min.y) / 2, (b.max.z + b.min.z) / 2);
        m.geometry = ng;
        m.children.forEach((c) => { if (c.userData.isFuzz) c.geometry = ng; });
      });
    };
    const trim = (root, sr, fr) => root.traverse((m) => {
      if (!m.isMesh || m.isInstancedMesh || !m.geometry) return;
      const g = m.geometry;
      if (!g.boundingSphere) g.computeBoundingSphere();
      const r = g.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z);
      if (r < sr) m.castShadow = false;
      if (r < fr) m.children.filter((c) => c.userData.isFuzz).forEach((c) => m.remove(c));
    });
    const instFelt = wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#7A7A7A' });
    const instKnit = wool('#FFFFFF', 'knit', { sheen: 0.5, sheenColor: '#56664A' });
    const grassMat = wool('#FFFFFF', 'yarn', { sheen: 0.6, sheenColor: '#56664A' });

    // ciel du soir, collines bleutées, lisière de feutrine, sol de la clairière
    V.add(faceCam(cyclo({ w: 560, h: 90, z: -100, r: 30, floor: 30, top: '#6E7CC2', mid: '#E6A07E', bottom: '#FFD09A', scale: 3 })));
    const ground = terrain({ w: 360, d: 220, nx: 60, nz: 40, z: 20, hills: [[-60, -46, 36, 7], [64, -50, 40, 8], [0, -80, 60, 6]], colors: ['#7E9A46', '#718E3E'], bands: 4, rough: 0.6, scale: 2.0 });
    V.add(ground);
    const H = (x, z) => ground.userData.height(x, z);
    const farH = flatLayer(hillShape(460, 22, 5, 11), '#8A86B0', { depth: 1, inset: 1.2, stitch: '#B9B4D8', st: { len: 1.4, gap: 1.0, r: 0.12 } });
    at(farH, 0, -2, -86);
    V.add(noShadow(farH));
    // lisière d'arbres ronds (feutrine découpée)
    const treeLine = (w, h, n, seed) => { const r = rng(seed), pts = [[-w / 2, -10], [-w / 2, h * 0.3]]; for (let i = 0; i < n; i++) { const x0 = -w / 2 + (i / n) * w, bw = w / n, hh = h * (0.55 + r() * 0.5); for (let k = 0; k <= 6; k++) { const a = Math.PI * (k / 6); pts.push([x0 + bw * 0.5 - Math.cos(a) * bw * 0.55, h * 0.3 + Math.sin(a) * (hh - h * 0.3)]); } } pts.push([w / 2, h * 0.3], [w / 2, -10]); return blobShape(pts, 260); };
    const lineF = flatLayer(treeLine(420, 30, 22, 5), '#4E6A3A', { depth: 1, inset: 1.0, stitch: '#C9A060', st: { len: 1.2, gap: 0.8, r: 0.12 } });
    at(lineF, 10, -2, -68);
    V.add(noShadow(lineF));

    // le grand soleil couchant, bas, derrière la lisière
    const sunG = new T.Group();
    sunG.add(feltPiece(circleShape(9), '#FFB24A', { depth: 1.8, inset: 0.9, stitch: '#F07A2A', st: { len: 0.8, gap: 0.5, r: 0.1 }, mat: { emissive: '#FF9A3A', emissiveIntensity: 1.1 } }));
    addFace(sunG, 8.4, { z: 0.95, cheeks: '#F06A4A', sleepy: true });
    noShadow(sunG);
    at(sunG, -32, 17, -78);
    const hSun = hang(sunG, 160, { amp: 0.8, per: 7 });
    V.add(hSun);
    swingAnim(V, hSun);
    const halo = new T.Mesh(new T.PlaneGeometry(90, 90), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFB070').multiplyScalar(0.75), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    at(halo, -32, 17, -84);
    V.add(halo);
    [[16, 40, -70, 26, 9, 4], [44, 34, -66, 20, 7, 7]].forEach(([x, y, z, w, h, sd]) => {
      const c = noShadow(feltPiece(cloudShape(w, h, 4, sd), '#F7D2C4', { depth: 2, inset: 0.9, curve: 8, stitch: '#E8A890', st: { len: 0.9, gap: 0.6, r: 0.1 }, mat: { emissive: '#FFB090', emissiveIntensity: 0.3 } }));
      at(c, x, y, z);
      const hc = hang(c, 160, { amp: 0.9, per: 6 + sd * 0.2 });
      V.add(hc);
      swingAnim(V, hc);
    });

    // ---------------- la fontaine ----------------
    const FX = 0, FZ = -2, WY = 4.25;
    const fount = new T.Group();
    const stoneM = wool('#ABA79E', 'knit', { scale: 0.75 });
    fount.add(mesh(latheGeo([[13.8, 0], [13.8, 0.45], [13.3, 0.9], [13.05, 4.2], [13.45, 4.6], [13.45, 5.4], [12.85, 5.85], [11.65, 5.85], [11.35, 5.35], [11.25, 1.6], [0.01, 1.45]], { seg: 44, lump: 0.02, seed: 3 }), stoneM));
    {
      // joints des pierres, brodés en fil gris foncé
      const seams = [];
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + (i % 2) * 0.1; seams.push(yarnGeo([[Math.cos(a) * 13.32, 0.95, Math.sin(a) * 13.32], [Math.cos(a) * 13.2, 4.1, Math.sin(a) * 13.2]], 0.12, { radial: 4 })); }
      const ring = []; for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU; ring.push(v3(Math.cos(a) * 13.25, 2.6, Math.sin(a) * 13.25)); }
      seams.push(yarnGeo(ring, 0.12, { radial: 4, closed: true, maxSeg: 200 }));
      const rimR = []; for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU; rimR.push(v3(Math.cos(a) * 12.25, 5.92, Math.sin(a) * 12.25)); }
      seams.push(yarnGeo(rimR, 0.1, { radial: 4, closed: true, maxSeg: 200 }));
      fount.add(mesh(mergeGeos(seams), wool('#7A766E', 'yarn'), { cast: false }));
    }
    fount.add(mesh(latheGeo([[2.4, 1.45], [2.2, 2.3], [1.55, 3.2], [1.35, 8.6], [1.75, 9.2], [1.75, 9.7], [1.3, 10.2], [1.2, 11.5], [2.1, 11.9], [4.9, 13.2], [5.5, 14.0], [5.3, 14.45], [4.85, 14.15], [2.3, 13.05], [0.9, 13.0], [0.75, 14.4], [0.5, 15.2], [0.01, 15.25]], { seg: 32, lump: 0.02, seed: 5 }), stoneM));
    // mousse au pied
    V.add(scatter(blobGeo(1, 0.45, 1, { seg: 10, lump: 0.2 }), instKnit, 14, (i, r) => { const a = (i / 14) * TAU + r() * 0.3; return { p: [FX + Math.cos(a) * 13.9, H(FX, FZ) + 0.2, FZ + Math.sin(a) * 13.9], r: [0, r() * 3, 0], s: 0.9 + r() * 0.9, c: ['#5E8A3A', '#6E9A44', '#4E7A32'][i % 3] }; }, { cast: false }));
    // l'eau du bassin : résine claire, rides concentriques
    const poolG = new T.RingGeometry(0.2, 11.3, 56, 14);
    poolG.rotateX(-Math.PI / 2);
    scaleUV(poolG, 22, 22);
    const poolM = resinMat('#8FD3DC', { rough: 0.05, opacity: 0.82, normal: 'felt', scale: 1.2, bump: 0.5 });
    const pool = mesh(poolG, poolM, { cast: false });
    pool.position.y = WY;
    fount.add(pool);
    const poolP = poolG.attributes.position, poolB = Float32Array.from(poolP.array);
    const bowlW = mesh(new T.CircleGeometry(4.75, 32).rotateX(-Math.PI / 2), poolM, { cast: false });
    bowlW.position.y = 13.95;
    fount.add(bowlW);
    // le rideau d'eau qui tombe de la vasque
    const waterM = resinMat('#E2F6FF', { rough: 0.04, opacity: 0.55 });
    const curtain = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + 0.1; curtain.push(yarnGeo([[Math.cos(a) * 5.45, 14.1, Math.sin(a) * 5.45], [Math.cos(a) * 5.9, 12.0, Math.sin(a) * 5.9], [Math.cos(a) * 6.3, 8.0, Math.sin(a) * 6.3], [Math.cos(a) * 6.4, WY, Math.sin(a) * 6.4]], 0.12, { radial: 4, maxSeg: 12 })); }
    fount.add(mesh(mergeGeos(curtain), waterM, { cast: false }));
    // le jet central (sa hauteur suit l'avancement)
    const jetG = latheGeo([[0.48, 0], [0.4, 0.15], [0.3, 0.5], [0.26, 0.85], [0.34, 0.95], [0.01, 1.0]], { seg: 14 });
    const jetM = resinMat('#EAF9FF', { rough: 0.03, opacity: 0.72 });
    const jet = mesh(jetG, jetM, { cast: false });
    jet.position.y = 15.2;
    fount.add(jet);
    // nénuphars de feutrine qui flottent
    const pads = [];
    const padSh = (() => { const sh = new T.Shape(); sh.moveTo(0, 0); sh.absarc(0, 0, 1.9, 0.35, TAU - 0.05, false); sh.lineTo(0, 0); return sh; })();
    [[-5.5, 4.5, 1.0, 0.3], [6.2, 3.8, 0.85, 2.2], [3.5, -7.2, 0.95, 4.0], [-7.2, -3.2, 0.75, 5.1]].forEach(([x, z, s, a], i) => {
      const g = new T.Group();
      const pad = feltPiece(padSh, i % 2 ? '#5E9A3E' : '#6CAA48', { depth: 0.2, inset: 0.25, stitch: '#A8D884', st: { len: 0.25, gap: 0.16, r: 0.035 } });
      pad.rotation.x = -Math.PI / 2;
      g.add(pad);
      if (i === 0 || i === 2) { const fl = grp(...[0, 1, 2, 3, 4, 5].map((k) => { const pe = felt(ellipseShape(0.35, 0.8), '#F7B8D0', 0.12, { bevel: 0 }); pe.position.y = 0.55; const pg = grp(pe); pg.rotation.set(-0.9, (k / 6) * TAU, 0); return pg; })); const c = woolBall(0.32, '#F7D33A', 'crochet', { fuzz: false }); fl.add(c); fl.position.y = 0.25; g.add(fl); }
      g.scale.setScalar(s);
      g.rotation.y = a;
      g.position.set(x, WY + 0.12, z);
      fount.add(g);
      pads.push({ g, x, z, ph: i * 1.7 });
    });
    at(fount, FX, H(FX, FZ) - 0.2, FZ);
    V.add(fount);
    const FY = H(FX, FZ) - 0.2;
    // la lumière du couchant renvoyée par l'eau éclaire le visage de la petite fille
    practical(V, [FX - 3, FY + 9, FZ + 7], '#FFD6AE', 140, 34);
    // gouttes : la couronne du jet, la pluie de la vasque, les jets de la fin
    const dropGeo = new T.SphereGeometry(0.28, 8, 6);
    const crownN = 30, dripN = 24;
    const crown = new T.InstancedMesh(dropGeo, jetM, crownN + dripN);
    crown.castShadow = false;
    crown.frustumCulled = false;
    V.add(crown);
    const CR = [];
    { const r = rng(5); for (let i = 0; i < crownN; i++) CR.push({ a: r() * TAU, sp: 0.6 + r() * 0.5, ph: r() }); }
    const DR = [];
    { const r = rng(8); for (let i = 0; i < dripN; i++) DR.push({ a: r() * TAU, ph: r() }); }
    const arcG = yarnGeo([[10.6, 0, 0], [9.6, 3.2, 0], [7.8, 5.6, 0], [5.6, 5.4, 0], [4.2, 2.8, 0], [3.6, 0.2, 0]], 0.26, { radial: 5, maxSeg: 24 });
    const arcs = new T.InstancedMesh(arcG, jetM, 10);
    arcs.castShadow = false;
    arcs.frustumCulled = false;
    V.add(arcs);

    // ---------------- le chêne et son rossignol ----------------
    const OX = 25, OZ = -14;
    const oak = new T.Group();
    const barkM = wool('#6E5038', 'knit', { scale: 0.7 });
    oak.add(mesh(latheGeo([[6.2, 0], [4.4, 1.4], [3.8, 4.5], [3.4, 11], [3.7, 15], [2.6, 19]], { seg: 22, lump: 0.1, seed: 7 }), barkM));
    {
      const gs = [];
      for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; gs.push(yarnGeo([[Math.cos(a) * 3.9, 2, Math.sin(a) * 3.9], [Math.cos(a + 0.1) * 3.55, 8, Math.sin(a + 0.1) * 3.55], [Math.cos(a) * 3.6, 14, Math.sin(a) * 3.6]], 0.28, { radial: 4, maxSeg: 18 })); }
      [[-1, 0.3], [1, -0.2], [0.2, 1], [-0.3, -1]].forEach(([dx, dz]) => gs.push(yarnGeo([[dx * 3.5, 1.2, dz * 3.5], [dx * 6.5, 0.4, dz * 6.5], [dx * 9, 0.05, dz * 9]], 0.75, { radial: 6 })));
      [[-8, 23, 3], [7, 22, -2], [-2, 26, -5], [3, 25, 5], [-5, 31, 2.5]].forEach(([x, y, z]) => gs.push(yarnGeo([[0, 17, 0], [x * 0.45, (17 + y) / 2, z * 0.45], [x, y, z]], 0.85, { radial: 6 })));
      gs.push(yarnGeo([[-5, 31, 2.5], [-8.2, 34.4, 3.2], [-10.6, 35.4, 3.6]], 0.42, { radial: 5 }));
      oak.add(mesh(mergeGeos(gs), wool('#5E4230', 'yarn')));
    }
    const leafC = ['#5E8A3A', '#6E9A44', '#4E7A32', '#7AA24A'];
    const puffs = [[-6, 22, 3, 6.5], [6, 21, 1, 6.2], [0, 27, 0, 7.2], [-3, 23, 6, 5.2], [4, 25, 6, 5.0], [-8, 26, -3, 5.4], [8, 27, -4, 5.6], [1, 31.5, -2, 5.6], [-1, 18.5, 0, 5.0]];
    puffs.forEach(([x, y, z, r], i) => { if (i < 5) { const b = woolBall(r, leafC[i % 4], 'knit', { seed: i + 3, fuzz: 0.2, mat: { scale: 0.9 } }); b.position.set(x, y, z); oak.add(b); } });
    oak.add(scatter(blobGeo(1, 1, 1, { seg: 16, lump: 0.08, seed: 4 }), instKnit, 4, (i) => { const [x, y, z, r] = puffs[i + 5]; return { p: [x, y, z], s: r, c: leafC[(i + 1) % 4] }; }));
    {
      // feuilles de chêne lobées, en feutrine, posées sur le feuillage
      const lobe = (() => { const pts = [[0, -3.0]]; const L = [[0.5, -2.4], [1.1, -2.0], [0.8, -1.3], [1.5, -0.8], [1.1, -0.1], [1.7, 0.5], [1.2, 1.2], [1.4, 1.8], [0.7, 2.4], [0, 2.9]]; L.forEach((p) => pts.push(p)); for (let i = L.length - 2; i >= 0; i--) pts.push([-L[i][0], L[i][1]]); return polyShape(pts); })();
      const lg = feltGeo(lobe, 0.14, { bevel: 0 });
      const LV = [];
      const lr = rng(12);
      puffs.forEach(([x, y, z, r], k) => { for (let i = 0; i < 6; i++) { const az = (lr() - 0.5) * 3.2, el = (lr() - 0.3) * 1.4; const n = v3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)); if (n.z < -0.2) continue; LV.push({ p: [x + n.x * r * 1.02, y + n.y * r * 1.02, z + n.z * r * 1.02], n, s: 0.7 + lr() * 0.4, c: leafC[(i + k) % 4] }); } });
      oak.add(scatter(lg, instFelt, LV.length, (i, r) => { const d = LV[i]; const q = new T.Quaternion().setFromUnitVectors(v3(0, 0, 1), d.n); const e = new T.Euler().setFromQuaternion(q); return { p: d.p, r: [e.x, e.y, e.z + r() * 3], s: d.s, c: col(d.c).multiplyScalar(1.12) }; }, { cast: false }));
      // glands
      const acG = mergeGeos([blobGeo(0.42, 0.55, 0.42, { seg: 8 }), applyM(blobGeo(0.48, 0.25, 0.48, { seg: 8 }), { p: [0, 0.42, 0] })]);
      oak.add(scatter(acG, instKnit, 9, (i, r) => { const [x, y, z, rr] = puffs[i % 5]; const a = r() * TAU; return { p: [x + Math.cos(a) * rr * 0.8, y - rr * 0.75, z + Math.sin(a) * rr * 0.8 + 1], s: 1, c: i % 2 ? '#B98A44' : '#A87A3A' }; }, { cast: false }));
    }
    const oakSh = contactShadow(34, 22, 0.45);
    oakSh.position.y = 0.15;
    oak.add(oakSh);
    const OS = 0.82;
    oak.scale.setScalar(OS);
    at(oak, OX, H(OX, OZ) - 0.3, OZ);
    V.add(oak);
    // le rossignol sur la plus haute branche
    const bd = bird({ r: 1.9, color: '#9A6E4A', belly: '#EAD8BC', beak: '#5A3A26', beakL: 0.55, tail: 'fan', legCol: '#7A5A44', eyeR: 0.2, head: 0.62 });
    lighter(bd.g, 0.6, 12);
    trim(bd.g, 0.5, 0);
    bd.g.rotation.y = -0.7;
    const BX = OX - 9.2 * OS, BY = H(OX, OZ) - 0.3 + 35.1 * OS, BZ = OZ + 3.4 * OS;
    at(bd.g, BX, BY, BZ);
    V.add(bd.g);
    V.boilable(bd.g, 0.03, 0.8);
    const blinkB = blinker(bd.p.eyes, 9);
    // les notes de fil qui s'envolent du bec
    const noteGeo = mergeGeos([applyM(blobGeo(0.62, 0.48, 0.3, { seg: 10, lump: 0 }), { r: [0, 0, 0.4] }), yarnGeo([[0.52, 0.15, 0], [0.56, 2.4, 0]], 0.1, { radial: 4 }), yarnGeo([[0.56, 2.4, 0], [1.3, 1.9, 0.05], [1.45, 1.2, 0.05]], 0.1, { radial: 4 })]);
    const NC = ['#E5484D', '#F2803C', '#F5C32C', '#4CAF5A', '#1FA7A0', '#3E6FD8', '#8B57C9'];
    const notes = NC.map((c, i) => { const m = mesh(noteGeo, wool(c, 'felt', { emissive: c, emissiveIntensity: 0.25 }), { cast: false }); m.visible = false; V.add(m); return { m, t0: -9, dx: (i % 2 ? 1 : -1) * (1 + (i % 3)), ph: i * 1.3 }; });
    let noteI = 0;
    const sing = (n, gap = 0.28) => { for (let i = 0; i < n; i++) { const N = notes[noteI++ % notes.length]; N.t0 = V.now + 1 / FPS + i * gap; } V.cue('sing'); };

    // ---------------- la petite fille qui trempe les pieds ----------------
    const KA = 3.75, KR = 12.25;
    const KX = FX + Math.cos(KA) * KR, KZ = FZ + Math.sin(KA) * KR;
    const kid = doll({ h: 12, skin: '#F3C9A6', top: '#F2A3B8', bottom: '#F2A3B8', sleeves: '#F2A3B8', dress: true, legs: '#F3C9A6', shoes: '#F3C9A6', hair: '#E8C070', hairStyle: 'pigtails', ribbon: '#7FB8E8', fringe: false, cheeks: '#F2998C', collar: '#FFFFFF' });
    lighter(kid.g, 1.0, 12);
    trim(kid.g, 0.8, 0.6);
    const KB = kid.p;
    const kidYaw = Math.atan2(FX - KX, FZ - KZ) - 0.62;
    kid.g.rotation.y = kidYaw;
    at(kid.g, KX, FY + 5.85 - kid.legH, KZ);
    V.add(kid.g);
    V.boilable(kid.g, 0.04, 0.5);
    const blinkK = blinker(KB.eyes, 4);
    const footW = () => { const p = v3(); KB.legR.getWorldPosition(p); p.x += Math.sin(kidYaw) * 1.6; p.z += Math.cos(kidYaw) * 1.6; return p; };

    // ---------------- herbes et fleurs de la clairière ----------------
    const avoid = [[FX, FZ, 15.5], [OX, OZ, 9], [OX - 9, OZ + 3, 4]];
    const free = (x, z) => avoid.every(([ax, az, ar]) => (x - ax) ** 2 + (z - az) ** 2 > ar * ar);
    const tuftGeo = (seed, n, h0, h1, spread) => { const r = rng(seed), gs = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU + r() * 0.8, hh = lerp(h0, h1, r()), ln = spread * (0.5 + r() * 0.8), ca = Math.cos(a), sa = Math.sin(a); gs.push(yarnGeo([[ca * 0.25, 0, sa * 0.25], [ca * ln * 0.3, hh * 0.55, sa * ln * 0.3], [ca * ln, hh, sa * ln]], 0.18, { radial: 3, maxSeg: 4 })); } return mergeGeos(gs); };
    const GC = ['#7E9A46', '#6E8A3E', '#94AE52', '#5E7A36', '#A8B45A'];
    const tufts = (geo, n, area, scale, seed, cast) => {
      const r = rng(seed), list = [];
      let guard = 0;
      while (list.length < n && guard++ < n * 30) { const x = lerp(area[0], area[1], r()), z = lerp(area[2], area[3], r()); if (free(x, z)) list.push([x, z]); }
      V.add(scatter(geo, grassMat, list.length, (i, rr) => { const [x, z] = list[i]; const s = scale * (0.75 + rr() * 0.5); return { p: [x, H(x, z) - 0.3, z], r: [(rr() - 0.5) * 0.2, rr() * TAU, (rr() - 0.5) * 0.2], s: [s, s * (0.8 + rr() * 0.4), s], c: col(GC[i % GC.length]).multiplyScalar(0.85 + rr() * 0.3) }; }, { seed, cast }));
    };
    const shortG = tuftGeo(8, 6, 3, 5.5, 1.7), tallG = tuftGeo(3, 7, 6, 10, 2.2);
    tufts(shortG, 130, [-60, 60, -36, 26], 1, 11, true);
    tufts(tallG, 30, [-60, 60, -30, 20], 0.9, 12, true);
    tufts(tallG, 24, [-60, -14, 30, 80], 1.3, 13, false);
    tufts(tallG, 24, [14, 60, 30, 80], 1.3, 15, false);
    tufts(shortG, 30, [-14, 14, 30, 80], 0.75, 16, false);
    // fleurs (têtes en instances)
    const petalRing = (n, w, h, off, cup, depth) => { const gs = []; for (let i = 0; i < n; i++) { const g = feltGeo(ellipseShape(w, h), depth, { bevel: 0, curve: 10 }); g.translate(0, off, 0); g.rotateX(cup); g.rotateZ((i / n) * TAU); gs.push(g); } return mergeGeos(gs); };
    const headA = petalRing(5, 1.0, 1.15, 1.05, 0.34, 0.18), headB = petalRing(11, 0.3, 1.1, 1.2, 0.2, 0.14);
    const heartG = blobGeo(0.55, 0.55, 0.32, { seg: 10, seed: 7 });
    heartG.translate(0, 0, 0.22);
    const stemG = yarnGeo([[0, 0, 0], [0.3, 0.5, 0.1], [0, 1, 0]], 0.15, { radial: 4, maxSeg: 6 });
    const FT = [{ g: 0, c: '#F7CB2E', cc: '#E59A1C' }, { g: 1, c: '#FFFFFF', cc: '#F5C32C' }, { g: 0, c: '#8FB8F0', cc: '#F7E08A' }, { g: 1, c: '#C9A8F0', cc: '#F5C32C' }, { g: 0, c: '#F59BC0', cc: '#F7D33A' }];
    const FL = [];
    const fr = rng(41);
    let guard = 0;
    while (FL.length < 34 && guard++ < 900) { const x = lerp(-56, 56, fr()), z = lerp(-30, 26, fr()); if (!free(x, z)) continue; FL.push({ x, z, h: 3.5 + fr() * 4.5, t: FT[FL.length % FT.length], s: 0.8 + fr() * 0.4 }); }
    // une couronne de fleurs au pied de la fontaine
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + 0.15, rr = 15 + (i % 3) * 0.9; FL.push({ x: FX + Math.cos(a) * rr, z: FZ + Math.sin(a) * rr, h: 2.5 + (i % 3) * 1.2, t: FT[i % FT.length], s: 0.75 }); }
    FL.forEach((f, i) => { f.y = H(f.x, f.z) - 0.2; f.ph = fr() * TAU; f.yaw = (fr() - 0.5) * 0.8; f.lean = v3((fr() - 0.5) * 0.25, 0, (fr() - 0.5) * 0.25); f.top = v3(0, f.h, 0).applyEuler(new T.Euler(f.lean.x, 0, f.lean.z)).add(v3(f.x, f.y, f.z)); });
    const imOf = (geo, mat, n) => { const im = new T.InstancedMesh(geo, mat, Math.max(1, n)); im.count = n; im.castShadow = true; im.receiveShadow = true; V.add(im); return im; };
    const LA = FL.filter((f) => f.t.g === 0), LB = FL.filter((f) => f.t.g === 1);
    const imA = imOf(headA, instFelt, LA.length), imB = imOf(headB, instFelt, LB.length), imC = imOf(heartG, instFelt, FL.length), imS = imOf(stemG, grassMat, FL.length);
    {
      const M4 = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler();
      let ia = 0, ib = 0;
      FL.forEach((f, i) => {
        E.set(f.lean.x, f.yaw, f.lean.z); Q.setFromEuler(E); M4.compose(v3(f.x, f.y, f.z), Q, v3(1, f.h, 1)); imS.setMatrixAt(i, M4); imS.setColorAt(i, col(GC[i % 4]).multiplyScalar(0.85));
        E.set(-0.5 + f.lean.x, f.yaw, f.lean.z); Q.setFromEuler(E); M4.compose(f.top, Q, v3(f.s, f.s, f.s));
        if (f.t.g === 0) { imA.setMatrixAt(ia, M4); imA.setColorAt(ia++, col(f.t.c)); } else { imB.setMatrixAt(ib, M4); imB.setColorAt(ib++, col(f.t.c)); }
        imC.setMatrixAt(i, M4); imC.setColorAt(i, col(f.t.cc));
      });
    }
    // pierres de gué qui mènent à la fontaine
    V.add(scatter(blobGeo(1, 0.35, 0.8, { seg: 12, lump: 0.12, seed: 9 }), instFelt, 6, (i) => { const z = 18 + i * 7.5, x = 3 + Math.sin(i * 1.3) * 3; return { p: [x, H(x, z) + 0.05, z], r: [0, i * 0.7, 0], s: [2.6 - i * 0.1, 1, 2.2], c: '#B8B2A6' }; }));

    // ---------------- particules ----------------
    const pc = (o2) => (live ? pointCloud(V, o2) : null);
    const glints = pc({ n: 50, box0: [FX - 7.5, FY + WY + 0.2, FZ - 7.5], box1: [FX + 7.5, FY + WY + 0.7, FZ + 7.5], size: 1.3, sprite: 'spark', color: '#FFFFFF', glow: 2.2, twinkle: 1, wander: 0.2, vel: [0, 0, 0], opacity: 0.3 });
    const flies = pc({ n: 40, box0: [-50, 3, -30], box1: [50, 26, 20], size: 1.2, sprite: 'spark', color: '#E8FF9A', glow: 2.6, twinkle: 1, wander: 3, vel: [0.3, 0.2, 0.1], opacity: 0 });
    pc({ n: 50, box0: [-50, 2, -30], box1: [50, 40, 24], size: 1.0, sprite: 'lint', color: '#FFE2B0', opacity: 0.45, vel: [0.5, 0.3, 0.1], beam: 0.8, keyDir: [-0.85, 0.35, 0.38] });
    const mistC = ['#FFB8D8', '#9FE6F2', '#FFF0A0'];
    const mists = mistC.map((c, i) => pc({ n: 22, box0: [FX - 16, FY + 3, FZ - 12], box1: [FX + 16, FY + 22, FZ + 10], size: 6, sprite: 'soft', color: c, twinkle: 0.3, wander: 2.5, vel: [0.3, 1.2, 0.2], opacity: 0, seed: 20 + i }));
    const sparks = pc({ n: 60, box0: [FX - 18, FY + 4, FZ - 10], box1: [FX + 18, FY + 30, FZ + 10], size: 1.3, sprite: 'spark', color: '#FFE9A0', glow: 2.6, twinkle: 1, wander: 1.5, vel: [0, 1.8, 0], opacity: 0 });
    const conf = live ? confetti(V, { kinds: ['star', 'disc', 'heart'], n: 40, size: 0.85, height: H }) : { burst() {}, rain() {} };
    const DUSK = ['#FFD45A', '#F59BC0', '#8FB8F0', '#FFFFFF', '#C9A8F0', '#FFB24A'];
    V.onHome = (c) => conf.burst(v3(FX, FY + 15, FZ), 6, [c, '#FFFFFF'], 0.4, 0.5);
    // bulles de résine qui montent de l'eau
    const BN = 24;
    const bubbles = new T.InstancedMesh(new T.SphereGeometry(0.8, 14, 10), resinMat('#F2FCFF', { rough: 0.02, opacity: 0.62 }), BN);
    bubbles.castShadow = false;
    bubbles.frustumCulled = false;
    bubbles.count = 0;
    V.add(bubbles);
    const BU = [];
    const bubble = (n) => { for (let i = 0; i < n; i++) { if (BU.length >= BN) BU.shift(); const a = Math.random() * TAU, rr = 2 + Math.random() * 8; BU.push({ x: FX + Math.cos(a) * rr, z: FZ + Math.sin(a) * rr, t0: V.now + Math.random() * 0.5, life: 1.1 + Math.random() * 0.9, s: 0.5 + Math.random() * 0.8, ph: Math.random() * 6 }); } };
    // l'arc-en-ciel de fil, au-dessus de la fontaine (à la fin)
    const RB = ['#E5484D', '#F2803C', '#F5C32C', '#4CAF5A', '#3E6FD8', '#8B57C9'];
    const rainbow = new T.Group();
    RB.forEach((c, i) => { const R = 19.5 - i * 0.85, pts = []; for (let k = 0; k <= 24; k++) { const a = Math.PI * (k / 24); pts.push([Math.cos(a) * R, Math.sin(a) * R * 0.8, 0]); } rainbow.add(mesh(yarnGeo(pts, 0.48, { radial: 5, maxSeg: 120 }), wool(c, 'yarn', { emissive: c, emissiveIntensity: 0.5 }), { cast: false })); });
    rainbow.position.set(FX - 2, FY + 3, FZ - 9);
    rainbow.scale.setScalar(0.001);
    rainbow.visible = false;
    V.add(rainbow);

    // ---------------- état et animation ----------------
    let p = 0, jetH = 1.5, jetT = 1.5, done = false, doneT = -9, ph = 0;
    const M4 = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), SC = v3(), PS = v3(), FP = v3();
    const ripples = [];
    V.anim((t, f) => {
      blinkK(t, f); blinkB(t, f);
      const beat = bump(sat(V.age('beat') / 0.3));
      const fin = done ? V.now - doneT : -1;
      // le jet
      jetH += (jetT - jetH) * 0.18;
      const jh = jetH * (1 + (fin > 0 ? Math.sin(fin * 4) * 0.18 : 0) + beat * 0.12 + (hashi(f, 3) - 0.5) * 0.06);
      jet.scale.set(1.7 + beat * 0.25, Math.max(0.05, jh), 1.7 + beat * 0.25);
      // couronne de gouttes au sommet du jet, et pluie de la vasque
      let k = 0;
      CR.forEach((d) => {
        const c = (t * d.sp + d.ph) % 1, spread = 1.2 + jh * 0.2;
        const x = Math.cos(d.a) * c * spread * 3.2, z = Math.sin(d.a) * c * spread * 3.2, y = 15.2 + jh + 0.4 + c * 2.5 - c * c * (jh + 3.6);
        PS.set(FX + x, FY + Math.max(13.9, y), FZ + z);
        M4.compose(PS, Q.identity(), SC.setScalar(0.7 + (1 - c) * 0.6));
        crown.setMatrixAt(k++, M4);
      });
      DR.forEach((d) => {
        const c = (t * 1.3 + d.ph) % 1, rr = 5.6 + c * 1.0;
        PS.set(FX + Math.cos(d.a) * rr, FY + 14 - c * (14 - WY), FZ + Math.sin(d.a) * rr);
        M4.compose(PS, Q.identity(), SC.set(0.8, 1.6, 0.8));
        crown.setMatrixAt(k++, M4);
      });
      crown.instanceMatrix.needsUpdate = true;
      // les jets qui dansent (à la fin)
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU, w = fin > 0.3 ? sat((fin - 0.3) / 0.8) * (0.55 + 0.45 * Math.sin(fin * 3.2 - i * 0.9)) : 0;
        E.set(0, -a, 0); Q.setFromEuler(E);
        M4.compose(PS.set(FX, FY + WY, FZ), Q, SC.set(1, Math.max(0.001, w * 1.3), 1));
        arcs.setMatrixAt(i, M4);
      }
      arcs.instanceMatrix.needsUpdate = true;
      arcs.visible = fin > 0.3;
      // rides du bassin : celles du jet (au centre), celles des pieds
      const amp = 0.06 + jh * 0.006;
      for (let i = 0; i < poolP.count; i++) {
        const x = poolB[i * 3], z = poolB[i * 3 + 2], r = Math.hypot(x, z);
        let y = Math.sin(r * 1.6 - t * 4) * amp * Math.exp(-r * 0.12) + Math.sin(x * 0.5 + t * 1.3) * 0.03;
        for (const R of ripples) { const age = V.now - R.t0; if (age < 0 || age > 1.6) continue; const d = Math.hypot(x - R.x, z - R.z), front = age * 7; y += Math.exp(-((d - front) ** 2) * 0.8) * 0.22 * (1 - age / 1.6); }
        poolP.setY(i, y);
      }
      poolP.needsUpdate = true;
      poolG.computeVertexNormals();
      pads.forEach((P) => { P.g.position.y = WY + 0.12 + Math.sin(t * 1.4 + P.ph) * 0.06 + beat * 0.08; P.g.rotation.z = Math.sin(t * 1.1 + P.ph) * 0.03; });
      for (let i = ripples.length - 1; i >= 0; i--) if (V.now - ripples[i].t0 > 1.6) ripples.splice(i, 1);
      // la petite fille : bat des pieds dans l'eau, lève la tête quand l'oiseau chante
      const kick = Math.sin(t * 3.2) * 0.16 + beat * 0.25 * (f % 2 ? 1 : -1);
      const cheer = fin > 0.4 ? 1 : 0;
      KB.legL.rotation.x = -1.02 + kick + (cheer ? Math.sin(fin * 9) * 0.3 : 0);
      KB.legR.rotation.x = -1.02 - kick - (cheer ? Math.sin(fin * 9) * 0.3 : 0);
      KB.armL.rotation.set(cheer ? 0 : 0.45, 0, cheer ? -2.5 - Math.sin(fin * 7) * 0.2 : -0.45);
      KB.armR.rotation.set(cheer ? 0 : 0.45, 0, cheer ? 2.5 + Math.sin(fin * 7) * 0.2 : 0.45);
      const look = sat(1 - V.age('sing') / 3.2) * (V.age('sing') >= 0 ? 1 : 0);
      KB.head.rotation.x = lerp(-0.12 + Math.sin(t * 0.7) * 0.05, -0.45, smooth(Math.max(look, cheer)));
      KB.head.rotation.y = lerp(-0.25 + Math.sin(t * 0.4) * 0.2, 0.75, smooth(look));
      KB.body.rotation.z = Math.sin(t * 1.6) * 0.04;
      kid.g.position.y = FY + 5.85 - kid.legH + (cheer ? Math.abs(Math.sin(fin * 4.5)) * 0.5 : 0);
      if (V.age('splashK') >= 0.25 || beat > 0.9) { V.cue('splashK'); FP.copy(footW()); const lp = v3(FP.x - FX, 0, FP.z - FZ); ripples.push({ x: lp.x, z: lp.z, t0: V.now }); }
      // le rossignol : chante, gonfle la gorge, bat des ailes
      const singing = V.age('sing') < 2.6 || fin > 0;
      const chirp = singing ? Math.abs(Math.sin(V.now * 14)) : 0;
      bd.p.head.rotation.x = -0.15 - chirp * 0.35;
      bd.p.head.rotation.y = Math.sin(t * 0.9) * 0.4;
      bd.p.beak.scale.set(1, 1 + chirp * 0.25, 1);
      bd.p.body.scale.setScalar(1 + chirp * 0.06);
      bd.p.wings.forEach((w, i) => { w.rotation.x = (singing && (f >> 1) % 2 ? 0.25 : 0) * (i ? 1 : -1); });
      if (fin > 0 && f % 9 === 0) sing(1, 0);
      notes.forEach((N, i) => {
        const a = (V.now - N.t0) / 2.6;
        N.m.visible = a >= 0 && a < 1;
        if (!N.m.visible) return;
        N.m.position.set(BX + 1.2 + N.dx * a * 2.4 + Math.sin(a * 7 + N.ph) * 1.2, BY + 3.8 + a * 13, BZ + 1 + a * 3);
        N.m.rotation.set(0, Math.sin(a * 5 + N.ph) * 0.6, Math.sin(a * 6 + N.ph) * 0.35);
        N.m.scale.setScalar(Math.max(0.01, easeOutBack(sat(a / 0.2)) * (1 - easeIn(sat((a - 0.75) / 0.25))) * 1.15));
      });
      // bulles
      BU.forEach((b, i) => { const a = (V.now - b.t0) / b.life; const s = a < 0 || a > 1 ? 0.001 : b.s * (0.5 + a * 0.6) * (a > 0.92 ? 1 + (a - 0.92) * 8 : 1); PS.set(b.x + Math.sin(a * 9 + b.ph) * 0.4, FY + WY + 0.3 + a * 7, b.z + Math.cos(a * 7 + b.ph) * 0.4); M4.compose(PS, Q.identity(), SC.setScalar(a > 0.98 ? 0.001 : s)); bubbles.setMatrixAt(i, M4); });
      for (let i = BU.length - 1; i >= 0; i--) if (V.now - BU[i].t0 > BU[i].life) BU.splice(i, 1);
      bubbles.count = BU.length;
      bubbles.instanceMatrix.needsUpdate = true;
      // lumières du soir : reflets, lucioles, brume irisée, étincelles, arc-en-ciel
      if (glints) glints.obj.material.uniforms.uOpacity.value = 0.25 + 0.65 * p + beat * 0.3 + (fin > 0 ? 0.3 : 0);
      if (flies) flies.obj.material.uniforms.uOpacity.value = 0.15 + 0.75 * sat(p * 1.2);
      const mk = fin > 0 ? sat(fin / 1.2) : 0;
      mists.forEach((m) => { if (m) m.obj.material.uniforms.uOpacity.value = mk * 0.22; });
      if (sparks) sparks.obj.material.uniforms.uOpacity.value = mk * 0.95;
      const rk = fin > 0.6 ? easeOutBack(sat((fin - 0.6) / 1.2)) : 0;
      rainbow.visible = rk > 0.002;
      rainbow.scale.setScalar(Math.max(0.001, rk));
    });

    return {
      update(st, first) {
        p = st.p;
        ph = Math.min(st.phrasesDone, NP);
        jetT = 1.5 + 12.5 * st.p;
        if (first) jetH = jetT;
        if (st.done && !done) { done = true; doneT = first ? V.now - 9 : V.now + 1 / FPS; }
        if (!st.done && done) { done = false; }
      },
      react(kind) {
        if (kind === 'correct') { bubble(9); }
        if (kind === 'phrase') { bubble(12); sing(5); conf.burst(v3(BX + 1, BY + 4, BZ + 1), 8, DUSK, 0.4, 0.8); }
        if (kind === 'complete') {
          bubble(20);
          sing(7, 0.2);
          conf.burst(v3(FX, FY + 18, FZ), 28, DUSK, 1.0, 1.3);
          conf.rain([-34, 34, 44, -14, 14], 26, DUSK);
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('beat');
      },
    };
  },
};
