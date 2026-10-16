/* ============ Petit escargot : une grande feuille, un jour gris-bleu ============
   L'escargot à la coquille de fil enroulé avance sur sa feuille de feutrine
   et sort un peu plus de sa maisonnette à chaque note retrouvée. À partir de
   « Aussitôt qu'il pleut », la pluie tombe de plus en plus fort, les flaques
   brillent ; à la fin, l'arc-en-ciel de laine se dessine et il étire la tête. */
SCENES.escargot = {
  color: '#B7C8D6',
  view: {
    bg: '#B7C8D6', fov: 26,
    rig: { target: [-1, 8, 2], az: 10, el: 12, box: [46, 38], targetWide: [0, 9, 2], boxWide: [76, 34] },
    post: { exposure: 1.1, bloom: 0.5, bloomThr: 0.95, aper: 6.5, maxBlur: 11, sat: 1.14, lift: '#0B1018', vignette: 0.38, punch: 1.2 },
  },
  sky: [-24, 24, 22, 29, -16, -3],
  home: [-3, 12, 2],
  flock: 6, birdSize: 0.85,
  build(V, o) {
    const live = !o.portrait;
    const L = studioLights(V, {
      key: { color: '#E6EDF5', k: 1.9, az: 34, el: 48, area: 70 },
      fill: { sky: '#BCCCDC', ground: '#5E6E50', k: 0.95 },
      rim: { color: '#F2F6FF', k: 1.1, az: -150, el: 30 },
      env: { sky: '#C2D0DE', ground: '#4E5C44', k: 0.6, boxK: 3 },
      fog: { color: '#C3D1DC', near: 150, far: 470 },
    });
    const keyCol0 = col('#E6EDF5'), keyCol1 = col('#FFE2B4');

    // le ciel gris-bleu (il s'éclaire à la fin)
    const sky = cyclo({ w: 600, h: 260, z: -105, r: 45, floor: 40, top: '#8EA6BF', mid: '#B4C6D6', bottom: '#DCE5EA', y: -2, scale: 3 });
    V.add(sky);
    const ground = terrain({ w: 420, d: 190, nx: 60, nz: 32, colors: ['#7FA466', '#74995D'], bands: 4, rough: 0.6, scale: 1.6, hills: [[-90, -55, 40, 5], [90, -60, 50, 7]] });
    V.add(ground);
    const H = ground.userData.height;
    // collines et bosquets de feutrine, un peu bleutés par la brume
    const far = flatLayer(hillShape(520, 26, 5, 21), '#9DB59A', { depth: 1, inset: 1.1, stitch: '#C6D6C2' });
    at(far, 0, 0, -70);
    V.add(far);
    const bush = [], bushT = [];
    const br0 = rng(31);
    [-120, -96, -74, -52, 44, 66, 92, 118].forEach((x) => {
      const r = 4 + br0() * 3, h = 16 + br0() * 8;
      bush.push(applyM(feltGeo(cloudShape(r * 2.2, r * 1.6, 3, Math.floor(br0() * 9)), 0.9), { p: [x, h, 0] }));
      bushT.push(applyM(new T.BoxGeometry(1, h, 0.5), { p: [x, h / 2 - 3, -0.3] }));
    });
    const bosq = grp(mesh(mergeGeos(bush), wool('#7F9E7E', 'felt'), { cast: false }), mesh(mergeGeos(bushT), wool('#6E5E50', 'felt'), { cast: false }));
    at(bosq, 0, 0, -62);
    V.add(bosq);
    const mid = flatLayer(hillShape(480, 17, 4, 5), '#8BAA7A', { depth: 1, inset: 1.1, stitch: '#B8CDAA' });
    at(mid, -20, 0, -50);
    V.add(mid);

    // l'arc-en-ciel de laine (caché jusqu'à la fin), entre les collines
    const bowCols = ['#E5484D', '#F2803C', '#F5C32C', '#4CAF5A', '#3E6FD8', '#8B57C9'];
    const BOW = v3(6, -5, -57);
    const bows = bowCols.map((c, i) => {
      const R = 31 - i * 1.85;
      const pts = [];
      for (let k = 0; k <= 48; k++) { const a = Math.PI - (k / 48) * Math.PI; pts.push([Math.cos(a) * R, Math.sin(a) * R, 0]); }
      const g = yarnGeo(pts, 0.95, { radial: 8, maxSeg: 120 });
      const m = mesh(g, wool(c, 'yarn', { sheen: 0.8 }), { cast: false });
      fuzz(m, 0.12, { fiber: 0.4 });
      m.position.copy(BOW);
      m.visible = false;
      V.add(m);
      return { m, g, n: g.index.count };
    });

    // nuages gris suspendus (ils remontent quand l'arc-en-ciel arrive)
    const clouds = [[-22, 27.5, -40, 20, 7.5, 4, 4.8], [4, 31, -54, 24, 8.5, 7, 6.3], [25, 27, -38, 17, 6.5, 2, 5.4]].map(([x, y, z, w, h, seed, per]) => {
      const c = cloud({ w, h, bumps: 4, seed, color: '#C9D2DC', stitch: '#97A8BA' });
      c.traverse((m) => { m.castShadow = false; });
      at(c, x, y, z);
      const hc = hang(c, 180, { amp: 1.2, per, r: 0.1 });
      V.add(hc);
      swingAnim(V, hc);
      return { hc, y0: hc.userData.pivot.position.y, c };
    });
    // un soleil timide, qui descend sur son fil quand il fait beau
    const sunG = new T.Group();
    const sunD = feltPiece(circleShape(5), '#FFC83A', { depth: 1.6, inset: 0.7, stitch: '#F2902A', st: { len: 0.55, gap: 0.35, r: 0.08 } });
    const sunMat = sunD.userData.body.material.clone();
    sunMat.emissive = col('#FFB020'); sunMat.emissiveIntensity = 0.5;
    sunD.userData.body.material = sunMat;
    sunG.add(sunD);
    const rays = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r0 = 5.6, r1 = i % 2 ? 7.6 : 8.6; rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.08) * (r0 + r1) / 2, Math.sin(a + 0.08) * (r0 + r1) / 2, 0.3], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.38, { radial: 6 })); }
    sunG.add(mesh(mergeGeos(rays), wool('#FFAE2A', 'yarn')));
    addFace(sunG, 4.8, { z: 0.9, cheeks: '#F27A54' });
    sunG.traverse((m) => { m.castShadow = false; });
    at(sunG, -31, 22, -64);
    const hsun = hang(sunG, 190, { amp: 1, per: 5, r: 0.1 });
    V.add(hsun);
    swingAnim(V, hsun);
    const sunY0 = hsun.userData.pivot.position.y;

    // la grande feuille de feutrine : une grille courbée (bords relevés, nervure en creux)
    const LL = 64, LWd = 30, LX = 0, LZ = 1.5;
    const halfW = (u) => (LWd / 2) * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 0.72) * (1 - 0.18 * u);
    const curl = (x, z) => 0.006 * (z - LZ) * (z - LZ) + 0.03 * Math.max(0, LZ - 1 - z) ** 2 - 0.45 * Math.exp(-(((z - LZ) / 1.6) ** 2)) + Math.pow(Math.max(0, x - LX - 16) / 15, 2) * 2.6 + Math.pow(Math.max(0, LX - 26 - x) / 8, 2) * 1.5 + 0.25 * Math.sin(x * 0.17);
    const leafY = (x, z) => 0.65 + curl(x, z);
    const lgeo = new T.PlaneGeometry(1, 1, 72, 22);
    const lpos = lgeo.attributes.position;
    for (let i = 0; i < lpos.count; i++) {
      const u = lpos.getX(i) + 0.5, v = lpos.getY(i) * 2;
      const x = LX - LL / 2 + u * LL, z = LZ - v * halfW(u);
      lpos.setXYZ(i, x, leafY(x, z), z);
    }
    lgeo.computeVertexNormals();
    scaleUV(lgeo, LL, LWd);
    const leafMat = wool('#6BAF4D', 'felt', { sheen: 0.6, sheenColor: '#C8EDA0' }).clone();
    leafMat.side = T.DoubleSide;
    const leaf = mesh(lgeo, leafMat);
    V.add(leaf);
    // bordure de fil, nervures, queue de la feuille
    const edge = [];
    for (let k = 0; k <= 80; k++) { const u = k / 80; const x = LX - LL / 2 + u * LL, z = LZ + halfW(u); edge.push([x, leafY(x, z) + 0.12, z]); }
    for (let k = 80; k >= 0; k--) { const u = k / 80; const x = LX - LL / 2 + u * LL, z = LZ - halfW(u); edge.push([x, leafY(x, z) + 0.12, z]); }
    V.add(yarn(edge, 0.34, '#4D8C38', { radial: 6, closed: true }));
    const veins = [];
    const rib = [];
    for (let k = 0; k <= 30; k++) { const x = LX - LL / 2 - 6 + k * (LL + 4) / 30; rib.push([x, (x < LX - LL / 2 ? 0.5 + (LX - LL / 2 - x) * -0.05 : leafY(x, LZ)) + 0.2, LZ]); }
    veins.push(yarnGeo(rib, 0.34, { radial: 6 }));
    for (let k = 1; k <= 6; k++) for (const s of [-1, 1]) {
      const u0 = 0.1 + k * 0.12, x0 = LX - LL / 2 + u0 * LL;
      const pts = [];
      for (let j = 0; j <= 6; j++) { const t = j / 6, x = x0 + t * 9, z = LZ + s * t * halfW(sat(u0 + t * 0.14)) * 0.85; pts.push([x, leafY(x, z) + 0.12, z]); }
      veins.push(yarnGeo(pts, 0.17, { radial: 5 }));
    }
    V.add(mesh(mergeGeos(veins), wool('#B5DA8A', 'yarn'), { cast: false }));
    const lsh = contactShadow(78, 40, 0.4);
    at(lsh, LX, 0.12, LZ);
    V.add(lsh);

    // champignons, fleurs, trèfles, herbes
    const orient = (g, p, n, s = 1) => g.applyMatrix4(new T.Matrix4().compose(p, new T.Quaternion().setFromUnitVectors(v3(0, 0, 1), n.clone().normalize()), v3(s, s, s)));
    const shroom = (x, z, s, capCol, dotCol, tilt, seed) => {
      const g = new T.Group();
      g.add(mesh(latheGeo([[0.95, 0], [0.78, 1.2], [0.68, 3.3], [0.85, 4.1], [0.01, 4.2]], { seg: 14, lump: 0.05, seed }), wool('#F1E6D0', 'crochet', { scale: 0.6 })));
      const cap = new T.Group();
      cap.position.y = 3.9;
      cap.rotation.z = tilt;
      cap.add(mesh(latheGeo([[0.01, -0.3], [2.9, -0.35], [3.25, 0.15], [2.85, 1.3], [1.8, 2.3], [0.01, 2.65]], { seg: 22, lump: 0.04, seed }), wool(capCol, 'felt')));
      const dots = [], dr = rng(seed);
      for (let i = 0; i < 7; i++) {
        const az = dr() * TAU, e = (18 + dr() * 50) * DEG;
        const p = v3(Math.sin(az) * Math.cos(e) * 3.05, Math.sin(e) * 2.5 + 0.12, Math.cos(az) * Math.cos(e) * 3.05);
        const n = v3(p.x / 9.3, (p.y - 0.12) / 6.25, p.z / 9.3);
        dots.push(orient(feltGeo(circleShape(0.42 + dr() * 0.25), 0.14, { bevel: 0.04 }), p, n));
      }
      cap.add(mesh(mergeGeos(dots), wool(dotCol, 'felt'), { cast: false }));
      g.add(cap);
      const sh = contactShadow(7, 7, 0.4);
      sh.position.y = 0.13;
      g.add(sh);
      at(g, x, H(x, z), z);
      g.scale.setScalar(s);
      V.add(g);
      return { g, cap };
    };
    const shrooms = [shroom(-29, -12, 1.3, '#D9443E', '#FFF6E8', 0.12, 3), shroom(-35, -2, 0.8, '#E0783E', '#FFF6E8', -0.2, 5), shroom(29, -13, 1.1, '#D9443E', '#FFF6E8', -0.1, 7), shroom(35, -3, 0.65, '#C9874A', '#F7E8CF', 0.15, 9)];
    const petals = (n, rx, ry, rad) => { const g = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; g.push(applyM(feltGeo(ellipseShape(rx, ry), 0.16, { bevel: 0, curve: 6 }), { p: [Math.cos(a) * rad, Math.sin(a) * rad, 0], r: [0, 0, a - Math.PI / 2] })); } return mergeGeos(g); };
    const daisyG = petals(9, 0.42, 1.05, 1.15), violetG = petals(5, 0.85, 1.0, 0.9);
    const flowerAt = (x, z, s, geo, pc, cc, stemH, tilt) => {
      const g = new T.Group();
      g.add(yarn([[0, 0, 0], [0.3, stemH * 0.5, 0.1], [0, stemH, 0]], 0.16, '#4E8B44', { radial: 5 }));
      const head = new T.Group();
      head.position.y = stemH;
      head.rotation.x = -tilt;
      head.add(mesh(geo, wool(pc, 'felt')));
      const c = woolBall(0.58, cc, 'crochet', { sz: 0.55, fuzz: false, seg: 12 });
      c.position.z = 0.15;
      head.add(c);
      g.add(head);
      at(g, x, H(x, z), z);
      g.scale.setScalar(s);
      V.add(g);
      return g;
    };
    const flowers = [
      flowerAt(-26, 22, 1.0, violetG, '#9B7BD6', '#F5C32C', 4.5, 0.5), flowerAt(-12, 28, 1.1, daisyG, '#FFFFFF', '#F5C32C', 5, 0.55),
      flowerAt(18, 25, 1.0, violetG, '#7C9BE0', '#F5D84C', 4.2, 0.55), flowerAt(30, 18, 1.05, daisyG, '#FFFFFF', '#F5C32C', 5.5, 0.45),
      flowerAt(-40, 14, 0.95, daisyG, '#FFFFFF', '#F5C32C', 5, 0.4), flowerAt(40, 13, 0.9, violetG, '#9B7BD6', '#F5C32C', 4.6, 0.45),
      flowerAt(-20, -14, 1.1, daisyG, '#FFFFFF', '#F5C32C', 6.5, 0.3), flowerAt(22, -15, 1.0, violetG, '#7C9BE0', '#F5D84C', 6, 0.3),
    ];
    // trèfles de feutrine
    const clv = [], clvS = [];
    [[-6, 21, 0.75], [7, 23, 0.65], [-31, 25, 0.75], [25, 32, 0.8], [43, 21, 0.7], [-45, 19, 0.75], [-22, 34, 0.7]].forEach(([x, z, s]) => {
      const y = H(x, z), sh = 2.4 * s;
      clvS.push(yarnGeo([[x, y, z], [x + 0.2, y + sh * 0.6, z + 0.1], [x, y + sh, z]], 0.12 * s, { radial: 4 }));
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * TAU + x;
        const g = feltGeo(heartShape(1.7 * s), 0.14, { bevel: 0.04 });
        g.translate(0, 0.8 * s, 0);
        applyM(g, { r: [-1.2, 0, 0] });
        applyM(g, { r: [0, a, 0], p: [x, y + sh, z] });
        clv.push(g);
      }
    });
    V.add(mesh(mergeGeos(clv), wool('#5EA54A', 'felt')), mesh(mergeGeos(clvS), wool('#4E8B44', 'yarn'), { cast: false }));
    // grands brins d'herbe derrière la feuille (effet macro)
    const bigL = [], bigR = [];
    const bl = rng(12);
    [[-40, -27, 22, 9, 0.35], [-29, -33, 17, 7.5, -0.2], [33, -28, 20, 8.5, -0.4], [45, -24, 15, 7, 0.3], [9, -38, 16, 7, 0.1]].forEach(([x, z, h, w, lean]) => {
      const g = feltGeo(leafShape(w, h, lean * 3), 0.3, { bevel: 0.08, curve: 16 });
      g.translate(0, h / 2, 0);
      const ry = (bl() - 0.5) * 0.8;
      applyM(g, { p: [x, -0.5, z], r: [-0.12, ry, lean * 0.5] });
      bigL.push(g);
      const rib = yarnGeo([[0, 0, 0.2], [lean * 0.4, h * 0.5, 0.25], [lean * 1.4, h * 0.95, 0.2]], 0.16, { radial: 5 });
      applyM(rib, { p: [x, -0.5, z], r: [-0.12, ry, lean * 0.5] });
      bigR.push(rib);
    });
    V.add(mesh(mergeGeos(bigL), wool('#5C9A48', 'felt', { sheen: 0.6, sheenColor: '#B9E39A' })), mesh(mergeGeos(bigR), wool('#9CCB78', 'yarn'), { cast: false }));
    // touffes d'herbe tout autour de la feuille (pas à travers)
    const gr = rng(9), gcols = ['#6FA35A', '#5F944E', '#84B56A'].map(col);
    V.add(scatter(grassTuft(), wool('#FFFFFF', 'yarn', { sheen: 0.6, sheenColor: '#56664A' }), 90, () => {
      let x, z;
      do { x = (gr() - 0.5) * 140; z = -38 + gr() * 88; } while (Math.abs(x) < 35 && z > LZ - 18 && z < LZ + 18);
      const s = 0.75 + gr() * 0.5;
      return { p: [x, H(x, z) - 0.2, z], r: [(gr() - 0.5) * 0.3, gr() * TAU, (gr() - 0.5) * 0.3], s: [s, s * (0.8 + gr() * 0.5), s], c: gcols[Math.floor(gr() * 3)].clone().multiplyScalar(0.9 + gr() * 0.2) };
    }));
    const pr = rng(4);
    V.add(scatter(blobGeo(1, 0.6, 0.9, { seg: 10, lump: 0.2, seed: 7 }), wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#4C4741' }), 12, () => {
      const x = (pr() - 0.5) * 100, z = 14 + pr() * 30;
      const g = 0.36 + pr() * 0.16;
      return { p: [x, H(x, z) + 0.2, z], r: [0, pr() * 3, 0], s: 0.7 + pr() * 1.3, c: new T.Color(g, g * 0.98, g * 0.95) };
    }));

    // au premier plan : une petite feuille tombée et des mini-champignons
    const fl = new T.Group();
    const flG = feltGeo(leafShape(7, 13, 1.2), 0.3, { bevel: 0.08, curve: 16 });
    applyM(flG, { r: [-Math.PI / 2 + 0.12, 0, 0] });
    fl.add(mesh(flG, wool('#D9B44A', 'felt', { sheen: 0.6, sheenColor: '#FFE7A0' })));
    fl.add(yarn([[0, 0.25, 6.8], [0.3, 0.45, 0], [0.9, 0.3, -6.2]], 0.14, '#B88A2E', { radial: 5 }));
    at(fl, -24, H(-24, 33) + 0.3, 33);
    fl.rotation.y = 1.1;
    V.add(fl);
    const minis = [shroom(19, 36, 0.42, '#C9874A', '#F7E8CF', 0.2, 11), shroom(21.5, 34.5, 0.3, '#C9874A', '#F7E8CF', -0.25, 12), shroom(17.4, 34, 0.26, '#E0783E', '#FFF6E8', 0.1, 13)];
    // les flaques (elles naissent avec la pluie) et leurs ronds dans l'eau
    const puddleMat = resinMat('#6F8FA8', { rough: 0.02, opacity: 0.92 });
    const wetMat = wool('#5E7D50', 'felt', { sheen: 0.3 });
    const puddles = [[-17, 24, 6.5, 3.2], [13, 30, 8, 3.6], [36, 26, 5, 2.4], [-39, 31, 5.5, 2.6]].map(([x, z, rx, rz], i) => {
      const m = mesh(new T.CircleGeometry(1, 40), puddleMat, { cast: false });
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, H(x, z) + 0.2 + i * 0.01, z);
      m.scale.set(0.001, 0.001, 1);
      V.add(m);
      const rim = mesh(new T.CircleGeometry(1, 32), wetMat, { cast: false });
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(x, H(x, z) + 0.12 + i * 0.01, z);
      rim.scale.set(0.001, 0.001, 1);
      V.add(rim);
      return { m, rim, rx, rz, x, z };
    });
    const ringMat = new T.MeshBasicMaterial({ color: col('#F4FAFF'), transparent: true, opacity: 0, depthWrite: false, fog: false });
    const rings = [];
    for (let i = 0; i < 8; i++) {
      const pd = puddles[i % puddles.length];
      const m = new T.Mesh(new T.RingGeometry(0.74, 1, 28), ringMat.clone());
      m.rotation.x = -Math.PI / 2;
      m.renderOrder = 3;
      V.add(m);
      rings.push({ m, pd, ph: hashi(i, 11), ox: (hashi(i, 12) - 0.5) * 1.1, oz: (hashi(i, 13) - 0.5) * 1.1 });
    }
    // gouttes d'eau posées sur la feuille (de plus en plus nombreuses)
    const DR = [];
    const dr = rng(77);
    for (let i = 0; i < 26; i++) {
      const u = 0.12 + dr() * 0.8, x = LX - LL / 2 + u * LL, z = LZ + (dr() - 0.5) * 1.6 * halfW(u);
      if (Math.abs(z - 2) < 3 && x > -18 && x < 14) { i--; continue; }
      DR.push({ p: [x, leafY(x, z) + 0.2, z], s: [0.35 + dr() * 0.4, 0.25 + dr() * 0.15, 0.35 + dr() * 0.4] });
    }
    const drops = scatter(new T.SphereGeometry(1, 14, 10), resinMat('#E4F2F8', { rough: 0.03, opacity: 0.75 }), DR.length, (i) => DR[i], { cast: false });
    drops.count = 0;
    V.add(drops);

    // le petit escargot
    const snail = new T.Group();
    V.add(snail);
    V.boilable(snail, 0.04, 0.5);
    const bodyCol = '#F3DD9C';
    const bodyMat = wool(bodyCol, 'crochet', { sheen: 0.9, sheenColor: '#FFF4CF' });
    // le pied
    const footG = blobGeo(8.4, 1.6, 2.6, { seg: 24, lump: 0.04, seed: 4 });
    const fp = footG.attributes.position;
    for (let i = 0; i < fp.count; i++) {
      const x = fp.getX(i);
      let y = fp.getY(i), z = fp.getZ(i);
      if (x < 0) { const k = 1 - 0.55 * Math.pow(-x / 8.4, 1.6); y *= k; z *= k; }
      if (y < -0.9) y = -0.9 + (y + 0.9) * 0.25;
      fp.setXYZ(i, x, y, z);
    }
    footG.computeVertexNormals();
    const foot = mesh(footG, bodyMat);
    fuzz(foot, 0.08);
    foot.position.set(-0.4, 1.15, 0);
    snail.add(foot);
    // la coquille : un gros fil de laine enroulé en spirale, de plusieurs couleurs
    const shell = new T.Group();
    snail.add(shell);
    const A = 0.86, B = 0.272, R0 = 0.55, THM = 3.05 * TAU, RMAX = R0 + B * THM;
    const PHI = -0.85 - THM;
    const dome = (r) => 2.4 * Math.pow(Math.max(0, 1 - (r / (RMAX + 0.4)) ** 2), 0.7);
    const coil = (th) => { const r = R0 + B * th, a = th + PHI; return v3(Math.cos(a) * r, Math.sin(a) * r, dome(r)); };
    const shellCols = ['#F7C948', '#F2914A', '#E35D6A', '#B862A8', '#5B8FD9', '#3FAE9C'];
    const arcAt = (th) => R0 * th + (B * th * th) / 2, Ltot = arcAt(THM);
    const thOf = (s) => (-R0 + Math.sqrt(R0 * R0 + 2 * B * s)) / B;
    shellCols.forEach((c, k) => {
      const th0 = thOf((Ltot * k) / shellCols.length), th1 = thOf((Ltot * (k + 1)) / shellCols.length);
      const pts = [];
      const n = Math.max(6, Math.ceil((th1 - th0) / 0.12));
      for (let j = 0; j <= n; j++) pts.push(coil(lerp(th0, th1, j / n)));
      const curve = new T.CatmullRomCurve3(pts);
      const len = curve.getLength();
      const g = new T.TubeGeometry(curve, Math.max(8, Math.ceil(len / 0.34)), A, 10, false);
      scaleUV(g, len / (4 * 2.6 * 2 * A), 1);
      const m = mesh(g, wool(c, 'yarn', { sheen: 0.85 }));
      fuzz(m, 0.09, { fiber: 0.35 });
      shell.add(m);
    });
    const cap0 = woolBall(A * 1.02, shellCols[0], 'yarn', { fuzz: false, seg: 12 });
    cap0.position.copy(coil(0));
    const cap1 = woolBall(A * 1.0, shellCols[5], 'yarn', { fuzz: false, seg: 12 });
    cap1.position.copy(coil(THM));
    shell.add(cap0, cap1);
    const shellCore = woolBall(RMAX + 0.3, '#E9B44C', 'crochet', { sz: 0.45, seed: 3, fuzz: false, seg: 20 });
    shellCore.position.z = -0.6;
    shell.add(shellCore);
    const SH0 = v3(-2.0, 7.25, -0.2);
    shell.position.copy(SH0);
    shell.rotation.z = 0.12;
    // le cou et la tête
    const neck = mesh(blobGeo(1.85, 1.85, 1, { seg: 18, lump: 0.03, seed: 6 }), bodyMat);
    fuzz(neck, 0.08);
    snail.add(neck);
    const head = new T.Group();
    snail.add(head);
    const HR = [2.8, 2.63, 2.63];
    const face = new T.Group();
    face.rotation.y = 0.38;
    head.add(face);
    const hm = woolBall(2.8, bodyCol, 'crochet', { sy: 0.94, sz: 0.94, seed: 2, fuzz: 0.08, mat: { sheen: 0.9, sheenColor: '#FFF4CF' } });
    face.add(hm);
    for (const s of [-1, 1]) {
      const q = surf(HR, s * 42, -10);
      const c = felt(circleShape(0.5), '#F4A3A0', 0.12);
      faceTo(at(c, q.p.x, q.p.y, q.p.z), q.n);
      face.add(c);
    }
    const mpt = (az, el) => { const q = surf(HR, az, el); return q.p.add(q.n.multiplyScalar(0.06)); };
    const smile = yarn([mpt(-20, -20), mpt(0, -29), mpt(20, -20)], 0.11, '#5A2E1E', { radial: 5 });
    face.add(smile);
    const grin = new T.Group();
    const gq = surf(HR, 0, -22);
    const gm = felt(polyShape([...Array(13)].map((_, i) => { const a = Math.PI + (i / 12) * Math.PI; return [Math.cos(a) * 1.0, Math.sin(a) * 0.75 + 0.15]; })), '#7A2E2A', 0.18);
    faceTo(at(gm, gq.p.x, gq.p.y, gq.p.z), gq.n);
    grin.add(gm);
    const tq = surf(HR, 0, -27);
    const tongue = felt(ellipseShape(0.45, 0.28), '#F07A86', 0.12);
    faceTo(at(tongue, tq.p.x, tq.p.y, tq.p.z), tq.n);
    tongue.position.addScaledVector(tq.n, 0.1);
    grin.add(tongue);
    grin.visible = false;
    face.add(grin);
    // les cornes, avec leurs yeux-perles
    const hornGeo = yarnGeo([[0, 0, 0], [0, 1, 0]], 0.36, { radial: 7 });
    const horns = [-1, 1].map((s) => {
      const piv = new T.Group();
      at(piv, s * 1.05, 2.1, -0.3);
      const stalk = mesh(hornGeo, bodyMat);
      piv.add(stalk);
      const tip = new T.Group();
      const ball = woolBall(0.78, '#FFFBF0', 'crochet', { fuzz: false, seg: 14 });
      const eye = bead(0.46, '#141210');
      eye.position.set(0, 0.06, 0.5);
      const shine = bead(0.13, '#FFFFFF');
      shine.position.set(0.15, 0.24, 0.9);
      tip.add(ball, eye, shine);
      piv.add(tip);
      face.add(piv);
      return { piv, stalk, tip, eye, s };
    });
    const eyes = horns.map((h) => h.eye);
    const blink = blinker(eyes, 6);
    // la trace brillante qu'il laisse derrière lui
    const TX0 = -20, TX1 = 14, TN = 56;
    const trailG = new T.BufferGeometry();
    const tp = [], ti = [];
    for (let k = 0; k <= TN; k++) { const x = TX0 + (k / TN) * (TX1 - TX0); for (const dz of [-0.85, 0.85]) tp.push(x, leafY(x, 2 + dz) + 0.08, 2 + dz); }
    for (let k = 0; k < TN; k++) { const a = k * 2; ti.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    trailG.setAttribute('position', new T.Float32BufferAttribute(tp, 3));
    trailG.setIndex(ti);
    trailG.computeVertexNormals();
    const trail = mesh(trailG, resinMat('#EEF6F2', { rough: 0.05, opacity: 0.4 }), { cast: false });
    trail.renderOrder = 2;
    V.add(trail);

    // la pluie, les éclaboussures, les confettis
    let rainN = null, rainF = null, conf = null;
    if (live) {
      rainN = pointCloud(V, { n: 300, box0: [-60, 0, -12], box1: [60, 50, 42], size: 2.3, sprite: 'drop', color: '#F4F9FF', glow: 1.3, opacity: 0.95, vel: [3, -60, 0], wander: 0.3, seed: 3 });
      rainF = pointCloud(V, { n: 420, box0: [-110, 0, -70], box1: [110, 60, -12], size: 1.7, sprite: 'drop', color: '#EEF5FF', glow: 1.1, opacity: 0.8, vel: [3, -54, 0], wander: 0.3, seed: 5 });
      rainN.obj.geometry.setDrawRange(0, 0);
      rainF.obj.geometry.setDrawRange(0, 0);
      pointCloud(V, { n: 50, box0: [-40, 1, -20], box1: [40, 30, 20], size: 0.7, color: '#F4F8FF', opacity: 0.32, vel: [0.2, 0.2, 0.1] });
      conf = confetti(V, { kinds: ['disc', 'heart', 'star'], n: 40, size: 0.8, height: (x, z) => (Math.abs(z - LZ) < 12 && Math.abs(x) < 28 ? leafY(x, z) : H(x, z)) });
    }
    V.onHome = (c) => { if (conf) conf.burst(snail.position.clone().add(v3(-1, 13, 0)), 5, [c, '#FFFFFF'], 0.4, 0.5); };

    // l'histoire
    const later = [];
    const after = (dt, fn) => later.push([V.now + dt, fn]);
    let done = false, rainT = 0, rain = 0, wetT = 0, wet = 0, out = 0.15, outT = 0.15, sx = -12, sxT = -12, sun = 0, bowK = 0;
    const SNZ = 2;
    const A0 = v3(4.2, 1.9, 0), qn = new T.Quaternion(), zAx = v3(0, 0, 1), tmp = v3(), dir = v3();
    let lastT = null;
    V.anim((t, f) => {
      while (later.length && later[0][0] <= V.now) later.shift()[1]();
      blink(t, f);
      const dt = lastT == null ? 0 : clamp(t - lastT, 0, 0.5);
      lastT = t;
      const ease = (rate) => 1 - Math.exp(-dt * rate);
      const ad = done ? V.age('done') : -1;
      // l'avancée de l'escargot
      sx += (sxT - sx) * ease(1.6);
      out += (outT - out) * ease(2);
      rain += (rainT - rain) * ease(1.3);
      wet += (wetT - wet) * ease(0.7);
      const moving = Math.abs(sxT - sx) > 0.08;
      const crawl = moving ? Math.sin(t * 10) : 0;
      snail.position.set(sx, leafY(sx, SNZ) - 0.15, SNZ);
      snail.rotation.z = Math.atan2(leafY(sx + 2, SNZ) - leafY(sx - 2, SNZ), 4);
      foot.scale.set(1 + crawl * 0.05, 1 - crawl * 0.03, 1);
      // la tête sort de la coquille
      const wig = V.age('wig'), wigK = wig < 0.8 ? bump(wig / 0.8) : 0;
      const shim = V.age('shim'), shimK = shim < 1.2 ? bump(shim / 1.2) : 0;
      const nod = V.age('nod'), nodK = nod < 0.35 ? bump(nod / 0.35) : 0;
      let stretch = 0, happy = rain > 0.15 ? 1 : 0;
      if (done && ad < 1e5) { stretch = smooth(sat((ad - 0.6) / 1.2)); happy = 1; }
      else if (done) { stretch = 1; happy = 1; }
      const sway = happy ? Math.sin(t * 2.6) * 0.6 : 0;
      tmp.set(lerp(1.4, 9.6, out) + stretch * 1.4 + sway * 0.3, lerp(4.8, 7.0, out) + stretch * 3.2 + nodK * -0.6 + Math.sin(t * 1.6) * 0.12, sway * 0.5);
      head.position.copy(tmp);
      head.rotation.z = -0.15 + stretch * 0.25 + nodK * -0.25 + Math.sin(t * 1.3) * 0.04 + (happy ? Math.sin(t * 2.6) * 0.08 : 0);
      head.rotation.x = happy ? Math.sin(t * 2.6) * 0.12 : 0;
      head.scale.setScalar(lerp(0.7, 1, sat(out * 1.3)));
      // le cou va du pied à la tête
      dir.copy(tmp).sub(A0);
      const dl = dir.length();
      neck.position.copy(A0).addScaledVector(dir, 0.5);
      neck.quaternion.copy(qn.setFromUnitVectors(zAx, dir.normalize()));
      neck.scale.set(1, 1, dl / 2 + 0.6);
      // les cornes : elles poussent, frétillent, se balancent
      const hl = lerp(0.3, 3.1, sat(out * 1.15)) + stretch * 0.9;
      horns.forEach((h, i) => {
        const fr = (wigK + stretch * 0.6 + (done ? 0.4 : 0)) * Math.sin(t * 28 + i * 2.1);
        h.stalk.scale.set(1, hl, 1);
        h.tip.position.y = hl;
        h.tip.scale.setScalar(lerp(0.6, 1, sat(out * 1.3)));
        h.piv.rotation.z = -h.s * (0.32 + wigK * 0.25 + stretch * 0.1) + fr * 0.35 + Math.sin(t * 1.9 + i) * 0.06 + nodK * h.s * 0.2;
        h.piv.rotation.x = -0.28 + fr * 0.2 + (happy ? -0.15 : 0);
      });
      smile.visible = !happy;
      grin.visible = !!happy;
      // la coquille se dandine
      shell.position.set(SH0.x, SH0.y + crawl * 0.12 + shimK * Math.abs(Math.sin(shim * 14)) * 0.5, SH0.z);
      shell.rotation.z = 0.12 + shimK * Math.sin(shim * 14) * 0.12 + Math.sin(t * 1.1) * 0.015;
      // la trace
      trailG.setDrawRange(0, 6 * clamp(Math.round(((sx - 7 - TX0) / (TX1 - TX0)) * TN), 0, TN));
      // la pluie, les flaques, les gouttes sur la feuille
      if (rainN) {
        rainN.obj.geometry.setDrawRange(0, Math.round(300 * rain));
        rainF.obj.geometry.setDrawRange(0, Math.round(420 * rain));
      }
      puddles.forEach((p, i) => { const k = Math.max(0.001, sat(wet * 1.3 - i * 0.12)); p.m.scale.set(p.rx * k, p.rz * k, 1); p.rim.scale.set(p.rx * k * 1.18 + 0.4 * k, p.rz * k * 1.25 + 0.4 * k, 1); });
      rings.forEach((r, i) => {
        const ph = (t * 0.9 + r.ph) % 1;
        const k = sat(wet * 1.3 - (i % puddles.length) * 0.12);
        r.m.position.set(r.pd.x + r.ox * r.pd.rx, r.pd.m.position.y + 0.04, r.pd.z + r.oz * r.pd.rz);
        r.m.scale.setScalar(0.2 + ph * Math.min(r.pd.rz, 2.4) * 0.9);
        r.m.material.opacity = rain > 0.05 ? (1 - ph) * 0.95 * k * sat(rain * 2) : 0;
        r.m.visible = r.m.material.opacity > 0.01;
      });
      drops.count = Math.round(DR.length * sat(wet));
      // le ciel s'éclaire, le soleil descend, l'arc-en-ciel se dessine
      const dark = rain * 0.18;
      const sunT = done ? (ad < 1e5 ? smooth(sat((ad - 0.4) / 2.2)) : 1) : 0;
      sun += (sunT - sun) * ease(3);
      sky.material.color.setScalar(1 - dark + sun * 0.12);
      L.key.color.copy(keyCol0).lerp(keyCol1, sun);
      L.key.intensity = 1.7 - dark * 2 + sun * 1.0;
      L.fill.intensity = 0.95 - dark + sun * 0.1;
      clouds.forEach((c, i) => { c.hc.userData.pivot.position.y = c.y0 + sun * (14 + i * 3); });
      hsun.userData.pivot.position.y = sunY0 + (1 - sun) * 30;
      sunG.visible = sun > 0.01;
      sunG.rotation.z = Math.sin(t * 0.8) * 0.06;
      bowK = done ? (ad < 1e5 ? sat((ad - 0.9) / 2.4) : 1) : 0;
      bows.forEach((b, i) => {
        const k = smooth(sat(bowK * 1.25 - i * 0.05));
        b.m.visible = k > 0.001;
        b.g.setDrawRange(0, Math.floor((k * b.n) / 6 / 8) * 6 * 8);
      });
      shrooms.forEach((s, i) => { s.cap.rotation.x = Math.sin(t * 1.4 + i) * 0.03 + (rain > 0.2 ? Math.sin(t * 9 + i * 2) * 0.02 * rain : 0); });
      flowers.forEach((g, i) => { g.rotation.z = Math.sin(t * 1.2 + i) * (0.04 + rain * 0.05); });
    });

    return {
      update(st, first) {
        sxT = st.done ? 4 : lerp(-12, 2, st.p);
        outT = st.done ? 1 : lerp(0.15, 1, st.p);
        rainT = st.done ? 0 : st.phrasesDone >= 3 ? lerp(0.4, 1, sat((st.phrasesDone - 3) / 2)) : 0;
        wetT = st.done ? 1 : st.phrasesDone >= 3 ? lerp(0.45, 1, sat((st.phrasesDone - 3) / 2)) : 0;
        if (first) { sx = sxT; out = outT; rain = rainT; wet = wetT; }
        if (st.done && !done) { done = true; if (first) { V.cues.done = -1e6; sun = 1; } else V.cue('done'); }
        if (!st.done && done) done = false;
      },
      react(kind, st) {
        if (kind === 'correct' || kind === 'phrase') V.cue('wig');
        if (kind === 'phrase') {
          V.cue('shim');
          if (conf) conf.burst(snail.position.clone().add(v3(-1, 14, 0)), 12, st.phrasesDone >= 3 ? ['#BFE0FF', '#FFFFFF', '#7FB7F0'] : ['#F7C948', '#E35D6A', '#5B8FD9', '#3FAE9C'], 0.55, 0.6);
        }
        if (kind === 'complete' && conf) {
          conf.burst(snail.position.clone().add(v3(4, 12, 0)), 30, bowCols, 1.1, 1.2);
          after(1.6, () => { if (done) conf.burst(v3(6, 18, -6), 26, bowCols, 1.0, 1.4); });
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('nod');
      },
    };
  },
};
