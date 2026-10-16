/* ============ Une souris verte : la prairie, un matin de printemps ============
   La souris verte au crochet bondit d'un perchoir à l'autre à chaque note
   retrouvée (caillou, champignons, souche, feuille, butte) et les fleurs
   s'ouvrent avec l'avancement. « Ces messieurs » sont deux tournesols en
   chapeau haut-de-forme : ils poussent à la 4e phrase et lui parlent à la 5e.
   La casserole d'huile (sur son petit feu) et le seau d'eau arrivent aux
   phrases 6 et 7 ; à la fin, la souris porte une coquille d'escargot toute
   chaude, au milieu des étincelles. Écoute : elle sautille en rythme. */
SCENES.prairie = {
  color: '#A9DBF2',
  view: {
    bg: '#7DB8E6', fov: 26,
    rig: { target: [0, 12, 0], az: 0, el: 6, box: [64, 52], targetWide: [0, 11, 0], boxWide: [100, 44] },
    post: { exposure: 1.18, bloom: 0.4, bloomThr: 1.05, aper: 9, maxBlur: 12, sat: 1.12, lift: '#030703', punch: 1.26, vignette: 0.3, grain: 0.035 },
  },
  sky: [-26, 26, 25, 33, -14, -2],
  home: [0, 13, 2],
  build(V, o) {
    const song = o.song, NP = song.phrases.length, live = !o.portrait;
    studioLights(V, {
      key: { color: '#FFF3DA', k: 2.8, az: -40, el: 38, area: 75 },
      fill: { sky: '#A8D2FF', ground: '#4E6F2E', k: 0.42 },
      rim: { color: '#FFF0C8', k: 1.6, az: 155, el: 24 },
      env: { sky: '#BFE0FF', ground: '#5F7F40', k: 0.3, boxK: 4 },
      fog: { color: '#CFE7F3', near: 280, far: 900 },
    });
    const noShadow = (g) => { g.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return g; };
    // les petites boules (pattes) n'ont pas besoin de 900 triangles chacune : on les refait plus légères, duvet compris
    const lighter = (root, maxR, seg) => {
      root.traverse((m) => {
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

    // le ciel tendu et le sol tricoté (rayures de deux verts)
    // (le cyclo de la boîte à outils est tourné vers le fond : on retourne ses faces s'il le faut)
    const faceCam = (m) => { const g = m.geometry, n = g.attributes.normal; if (n.getZ(n.count - 25) < 0) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } ix.needsUpdate = true; g.computeVertexNormals(); } return m; };
    V.add(faceCam(cyclo({ w: 560, h: 90, z: -100, r: 30, floor: 40, top: '#2A74CA', mid: '#5AA5E2', bottom: '#C4E4EE', scale: 3 })));
    const ground = terrain({ w: 360, d: 240, nx: 60, nz: 44, z: 20, hills: [[0, -14, 11, 3.4], [-60, -46, 34, 9], [64, -50, 38, 11], [10, -74, 50, 7]], colors: ['#6CAA45', '#5A983A'], bands: 4, rough: 0.6, scale: 2.0 });
    V.add(ground);
    const H = (x, z) => ground.userData.height(x, z);
    const instFelt = wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#7A7A7A' });
    const instKnit = wool('#FFFFFF', 'knit', { sheen: 0.5, sheenColor: '#56664A' });
    const grassMat = wool('#FFFFFF', 'yarn', { sheen: 0.6, sheenColor: '#56664A' });

    // collines de feutrine au loin
    const far = flatLayer(hillShape(440, 24, 5, 7), '#8CC46A', { depth: 1, inset: 1.2, stitch: '#D7EFC6', st: { len: 1.4, gap: 1.0, r: 0.13 } });
    at(far, 0, -2, -84);
    V.add(noShadow(far));
    const midL = flatLayer(hillShape(380, 15, 4, 3), '#6BB144', { depth: 1, inset: 1.1, stitch: '#C3E6A9', st: { len: 1.0, gap: 0.7, r: 0.11 } });
    at(midL, 26, -2, -64);
    V.add(noShadow(midL));
    // petits arbres ronds tricotés sur les buttes du fond (instances)
    const crownGeo = mergeGeos([blobGeo(3.2, 3.0, 3.0, { seg: 14, seed: 2 }), applyM(blobGeo(2.4, 2.2, 2.3, { seg: 12, seed: 3 }), { p: [-2.3, -0.9, 0.8] }), applyM(blobGeo(2.5, 2.3, 2.3, { seg: 12, seed: 4 }), { p: [2.3, -0.7, 0.5] })]);
    const trunkGeo = new T.CylinderGeometry(0.55, 0.8, 5, 8);
    trunkGeo.translate(0, 2.5, 0);
    const trees = [[-92, -46, 1.2], [-74, -52, 1.0], [-58, -40, 1.25], [-44, -54, 0.9], [-30, -46, 1.1], [34, -48, 1.0], [50, -40, 1.3], [66, -54, 0.95], [84, -44, 1.2], [100, -50, 1.0], [-8, -60, 0.8], [14, -58, 0.9]];
    const tcol = ['#5FA544', '#4E9640', '#77B957', '#68AD4A'];
    V.add(scatter(crownGeo, instKnit, trees.length, (i, r) => { const [x, z, s] = trees[i]; return { p: [x, H(x, z) + 5 * s + 2.2 * s, z], r: [0, r() * 3, 0], s, c: tcol[i % 4] }; }));
    V.add(scatter(trunkGeo, instKnit, trees.length, (i) => { const [x, z, s] = trees[i]; return { p: [x, H(x, z) - 0.3, z], s, c: '#8A5A3A' }; }));

    // le soleil du matin, pendu à son fil (rayons de fil fusionnés)
    const sunG = new T.Group();
    sunG.add(feltPiece(circleShape(6.2), '#FFD447', { depth: 1.8, inset: 0.75, stitch: '#F0962A', st: { len: 0.6, gap: 0.38, r: 0.09 }, mat: { emissive: '#FFB43A', emissiveIntensity: 0.45 } }));
    const rays = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, r0 = 7.1, r1 = i % 2 ? 9.3 : 10.6;
      rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.07) * (r0 + r1) / 2, Math.sin(a + 0.07) * (r0 + r1) / 2, 0.25], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.36, { radial: 6 }));
    }
    sunG.add(mesh(mergeGeos(rays), wool('#FFB82E', 'yarn', { emissive: '#FF9A1A', emissiveIntensity: 0.35 }), { cast: false }));
    addFace(sunG, 6, { z: 0.95, cheeks: '#F58A5C' });
    noShadow(sunG);
    at(sunG, -27, 33, -50);
    const hSun = hang(sunG, 150, { amp: 1.2, per: 5 });
    V.add(hSun);
    swingAnim(V, hSun);
    const halo = new T.Mesh(new T.PlaneGeometry(46, 46), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFE6A0').multiplyScalar(0.5), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    at(halo, -27, 33, -56);
    V.add(halo);
    // nuages de feutrine suspendus
    [[8, 41, -58, 30, 11, 2], [36, 35, -52, 22, 9, 5], [-14, 46, -68, 26, 10, 8], [-62, 38, -60, 24, 9, 11]].forEach(([x, y, z, w, h, s]) => {
      const c = noShadow(feltPiece(cloudShape(w, h, 4, s), '#FFFFFF', { depth: 2.4, inset: 0.9, curve: 8, stitch: '#BFD6EC', st: { len: 0.9, gap: 0.6, r: 0.1 }, mat: { emissive: '#FFFFFF', emissiveIntensity: 0.22 } }));
      at(c, x, y, z);
      const hc = hang(c, 160, { amp: 0.9, per: 6 + s * 0.3 });
      V.add(hc);
      swingAnim(V, hc);
    });

    // papillons de feutrine, au bout de leur fil
    const butterflies = [];
    const wingShape = blobShape([[0.1, 0.1], [1.0, 1.7], [2.6, 2.9], [3.4, 1.9], [2.7, 0.5], [1.7, -0.2], [2.3, -1.5], [1.4, -2.3], [0.3, -1.1]]);
    const mkFly = (c1, c2, x, y, z, ph) => {
      const g = new T.Group();
      g.add(woolBall(0.42, '#3B2B3E', 'crochet', { sy: 2.3, fuzz: false }));
      const ant = mergeGeos([-1, 1].map((s) => yarnGeo([[s * 0.1, 0.8, 0], [s * 0.5, 1.8, 0.2], [s * 0.9, 2.3, 0.1]], 0.05, { radial: 4 })));
      g.add(mesh(ant, wool('#3B2B3E', 'yarn'), { cast: false }));
      const wings = [-1, 1].map((s) => {
        const piv = new T.Group();
        const w = felt(wingShape, c1, 0.2, { bevel: 0.05 });
        const spots = mesh(mergeGeos([applyM(feltGeo(circleShape(0.55), 0.1, { bevel: 0 }), { p: [2.3, 1.7, 0.12] }), applyM(feltGeo(circleShape(0.4), 0.1, { bevel: 0 }), { p: [1.4, -1.2, 0.12] })]), wool(c2, 'felt'), { cast: false });
        const wg = grp(w, spots);
        wg.scale.x = s;
        piv.add(wg);
        g.add(piv);
        return piv;
      });
      g.rotation.x = -0.55;
      g.scale.setScalar(0.85);
      at(g, x, y, z);
      const hg = hang(g, 120, { amp: 3, per: 3.2 + ph });
      V.add(hg);
      swingAnim(V, hg);
      butterflies.push({ g, wings, ph, y0: g.position.y });
    };
    mkFly('#F7A8C8', '#FFF1A8', 17, 23, -8, 0.2);
    mkFly('#8FC8F5', '#FFFFFF', -13, 25, 0, 1.1);

    // les perchoirs de la souris
    const dots = [];
    const mush = (x, z, h, R, capCol, seed) => {
      const g = new T.Group();
      const y0 = H(x, z);
      g.add(mesh(latheGeo([[R * 0.34, 0], [R * 0.27, h * 0.45], [R * 0.24, h], [0.01, h + 0.01]], { seg: 16, lump: 0.06 }), wool('#F4EAD6', 'knit', { scale: 0.5 })));
      const cap = mesh(latheGeo([[0.01, -0.25], [R * 0.6, -0.32], [R, 0.1], [R * 0.95, R * 0.36], [R * 0.72, R * 0.62], [R * 0.36, R * 0.79], [0.01, R * 0.82]], { seg: 24, lump: 0.05, seed }), wool(capCol, 'crochet', { scale: 0.6 }));
      cap.position.y = h;
      fuzz(cap, 0.1);
      g.add(cap);
      const gill = mesh(feltGeo(circleShape(R * 0.9), 0.2, { bevel: 0 }), wool('#F1DFC0', 'felt'), { cast: false });
      gill.rotation.x = Math.PI / 2;
      gill.position.y = h - 0.3;
      g.add(gill);
      at(g, x, y0, z);
      V.add(g);
      const r = rng(seed);
      for (let i = 0; i < 7; i++) {
        const a = r() * TAU, e = 0.35 + r() * 0.85;
        const n = v3(Math.cos(e) * Math.sin(a) / R, Math.sin(e) / (R * 0.8), Math.cos(e) * Math.cos(a) / R).normalize();
        dots.push({ p: [x + Math.cos(e) * Math.sin(a) * R * 0.97, y0 + h + Math.sin(e) * R * 0.8, z + Math.cos(e) * Math.cos(a) * R * 0.97], n, s: R * (0.09 + r() * 0.06) });
      }
      return y0 + h + R * 0.8;
    };
    const spots = [];
    // 0 : caillou plat
    const rock = stone(4.6, '#BDB6A6', 3);
    rock.scale.set(1.25, 0.8, 1);
    at(rock, -9, H(-9, 8) - 0.2, 8);
    V.add(rock);
    spots.push([-9, H(-9, 8) + 1.95, 8, 0.4]);
    // 1 : grand champignon rouge à pois
    spots.push([13, mush(13, 0, 8, 5, '#E04A3C', 5) - 0.2, 0, -0.45]);
    // 2 : souche
    const stump = new T.Group();
    stump.add(mesh(latheGeo([[5.6, 0], [4.6, 0.8], [4.2, 2.5], [4.1, 5.6], [3.9, 6.0], [0.01, 6.05]], { seg: 22, lump: 0.07, seed: 4 }), wool('#8A5A38', 'knit', { scale: 0.6 })));
    const top = mesh(feltGeo(circleShape(3.75), 0.3, { bevel: 0.08 }), wool('#E2C08A', 'felt'));
    top.rotation.x = -Math.PI / 2;
    top.position.y = 6.05;
    stump.add(top);
    const rings = mergeGeos([1.2, 2.2, 3.1].map((rr) => { const pts = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; pts.push(v3(Math.cos(a) * rr, 6.25, Math.sin(a) * rr)); } return yarnGeo(pts, 0.09, { radial: 4, closed: true }); }));
    stump.add(mesh(rings, wool('#B58A55', 'yarn'), { cast: false }));
    at(stump, -16, H(-16, -6) - 0.3, -6);
    V.add(stump);
    spots.push([-16, H(-16, -6) + 5.9, -6, 0.55]);
    // 3 : une marguerite géante, à plat comme un tabouret
    const daisy = new T.Group();
    daisy.add(yarn([[0, 0, 0], [0.5, 2.4, 0.2], [-0.2, 4.5, 0], [0, 5.7, 0]], 0.45, '#5E9E3C', { radial: 6 }));
    const dl = feltPiece(leafShape(2.6, 6, 0.8), '#6CB04A', { depth: 0.3, inset: 0.35, stitch: '#A8DB86', st: { len: 0.35, gap: 0.22, r: 0.04 } });
    dl.position.set(1.6, 2.6, 0.2);
    dl.rotation.z = -1.0;
    daisy.add(dl);
    const dg = [];
    for (let i = 0; i < 14; i++) { const g = feltGeo(ellipseShape(0.78, 2.0), 0.25, { bevel: 0.06, curve: 10 }); g.translate(0, 3.1, 0); g.rotateX(0.14); g.rotateZ((i / 14) * TAU); dg.push(g); }
    const dRing = mesh(mergeGeos(dg), wool('#FFFFFF', 'felt'));
    dRing.rotation.x = -Math.PI / 2;
    dRing.position.y = 5.75;
    daisy.add(dRing);
    const dHeart = woolBall(1.9, '#F5C32C', 'crochet', { sy: 0.45, fuzz: 0.08, seed: 6 });
    dHeart.position.y = 5.95;
    daisy.add(dHeart);
    at(daisy, 9, H(9, 9) - 0.2, 9);
    V.add(daisy);
    spots.push([9, H(9, 9) + 6.5, 9, -0.3]);
    // 4 : la butte du milieu
    spots.push([0, H(0, -14) - 0.1, -14, 0.2]);
    // 5 : petit champignon brun
    spots.push([20, mush(20, -9, 3.8, 3.6, '#B8743A', 9) - 0.2, -9, -0.55]);
    V.add(scatter(feltGeo(circleShape(1), 0.12, { bevel: 0 }), instFelt, dots.length, (i) => { const d = dots[i]; const q = new T.Quaternion().setFromUnitVectors(v3(0, 0, 1), d.n); const e = new T.Euler().setFromQuaternion(q); return { p: d.p, r: [e.x, e.y, e.z], s: d.s, c: '#FFF8EC' }; }, { cast: false }));
    const ORDER = [0, 1, 2, 3, 5, 4];
    const FINAL = [-4, H(-4, 3) - 0.1, 3, 1.3];

    // herbes hautes (touffes de fil, en instances) et fleurs de feutrine
    const avoid = [[-9, 8, 6.5], [13, 0, 6], [-16, -6, 6], [9, 9, 6.5], [0, -14, 5], [20, -9, 5], [-4, 3, 6], [-21, 10, 8], [24, 11, 7], [-25, -17, 6], [26, -16, 6]];
    const free = (x, z, k = 1) => avoid.every(([ax, az, ar]) => (x - ax) ** 2 + (z - az) ** 2 > ar * ar * k);
    const tuftGeo = (seed, n, h0, h1, spread) => {
      const r = rng(seed), gs = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + r() * 0.8, hh = lerp(h0, h1, r()), ln = spread * (0.5 + r() * 0.8), ca = Math.cos(a), sa = Math.sin(a);
        gs.push(yarnGeo([[ca * 0.25, 0, sa * 0.25], [ca * ln * 0.3, hh * 0.55, sa * ln * 0.3], [ca * ln, hh, sa * ln]], 0.19, { radial: 3, maxSeg: 4 }));
      }
      return mergeGeos(gs);
    };
    const GC = ['#6DB64F', '#5CA544', '#8BCB5E', '#4F9A3E', '#A2D25E', '#78BA48'];
    const tufts = (geo, n, area, scale, seed, cast, k) => {
      const r = rng(seed), list = [];
      let guard = 0;
      while (list.length < n && guard++ < n * 30) { const x = lerp(area[0], area[1], r()), z = lerp(area[2], area[3], r()); if (free(x, z, k)) list.push([x, z]); }
      const im = scatter(geo, grassMat, list.length, (i, rr) => {
        const [x, z] = list[i];
        const s = scale * (0.75 + rr() * 0.5);
        return { p: [x, H(x, z) - 0.3, z], r: [(rr() - 0.5) * 0.2, rr() * TAU, (rr() - 0.5) * 0.2], s: [s, s * (0.8 + rr() * 0.4), s], c: col(GC[i % GC.length]).multiplyScalar(0.85 + rr() * 0.3) };
      }, { seed, cast });
      V.add(im);
      return im;
    };
    const tallGeo = tuftGeo(3, 7, 6, 10, 2.2), shortGeo = tuftGeo(8, 6, 3, 5.5, 1.7);
    tufts(shortGeo, 150, [-62, 62, -34, 20], 1, 11, true, 0.7);
    tufts(tallGeo, 50, [-58, 58, -30, 16], 0.9, 12, true, 1.2);
    tufts(tallGeo, 38, [-84, -19, 22, 84], 1.5, 13, false, 1);
    tufts(tallGeo, 38, [19, 84, 22, 84], 1.5, 15, false, 1);
    tufts(shortGeo, 30, [-19, 19, 34, 84], 0.75, 16, false, 1);
    tufts(shortGeo, 50, [-120, 120, -62, -34], 1.2, 14, false, 1);
    const cornerGeo = tuftGeo(21, 9, 7, 11, 2.6);
    tufts(cornerGeo, 10, [-28, -11, 72, 100], 1.25, 17, false, 1);
    tufts(cornerGeo, 10, [11, 28, 72, 100], 1.25, 18, false, 1);
    tufts(shortGeo, 70, [-20, 20, 18, 70], 0.8, 19, false, 1);

    // fleurs : têtes en instances (pétales ronds, pétales fins), cœurs, tiges
    const petalRing = (n, w, h, off, cup, depth) => {
      const gs = [];
      for (let i = 0; i < n; i++) {
        const g = feltGeo(ellipseShape(w, h), depth, { bevel: 0, curve: 10 });
        g.translate(0, off, 0);
        g.rotateX(cup);
        g.rotateZ((i / n) * TAU);
        gs.push(g);
      }
      return mergeGeos(gs);
    };
    const headA = petalRing(5, 1.15, 1.3, 1.2, 0.34, 0.2);
    const headB = petalRing(12, 0.34, 1.25, 1.35, 0.2, 0.16);
    const heartGeo = blobGeo(0.62, 0.62, 0.36, { seg: 10, seed: 7 });
    heartGeo.translate(0, 0, 0.25);
    const stemGeo = yarnGeo([[0, 0, 0], [0.3, 0.5, 0.1], [0, 1, 0]], 0.16, { radial: 4, maxSeg: 6 });
    const FT = [
      { geo: 0, c: '#E5484D', cc: '#2B2222' }, { geo: 0, c: '#F7CB2E', cc: '#E59A1C' }, { geo: 0, c: '#F59BC0', cc: '#F7D33A' },
      { geo: 1, c: '#FFFFFF', cc: '#F5C32C' }, { geo: 1, c: '#6C8FE8', cc: '#2E3C86' }, { geo: 1, c: '#FFFFFF', cc: '#F5C32C' },
    ];
    const FL = [];
    const fr = rng(41);
    let guard = 0;
    while (FL.length < 34 && guard++ < 900) {
      const x = lerp(-60, 60, fr()), z = lerp(-34, 20, fr());
      if (!free(x, z, 1.1)) continue;
      FL.push({ x, z, h: 4 + fr() * 5, t: FT[FL.length % FT.length], s: 0.85 + fr() * 0.4 });
    }
    guard = 0;
    while (FL.length < 44 && guard++ < 900) {
      const x = lerp(-80, 80, fr()), z = lerp(26, 66, fr());
      if (Math.abs(x) < 22) continue;
      FL.push({ x, z, h: 7 + fr() * 6, t: FT[FL.length % FT.length], s: 1.25 + fr() * 0.5 });
    }
    [[-16, 86, 7, 3], [-12, 96, 5, 0], [15, 90, 8, 1], [19, 80, 6, 4]].forEach(([x, z, h, k]) => FL.push({ x, z, h, t: FT[k], s: 1.7 }));
    FL.forEach((f, i) => {
      f.y = H(f.x, f.z) - 0.2;
      f.ph = fr() * TAU;
      f.yaw = (fr() - 0.5) * 0.9 - f.x * 0.004;
      f.lean = v3((fr() - 0.5) * 0.25, 0, (fr() - 0.5) * 0.25);
      f.th = i < 20 ? -1 : (i - 20) / (FL.length - 20) * 0.92 + 0.04;
      f.cur = 0; f.tg = 0;
      f.top = v3(0, f.h, 0).applyEuler(new T.Euler(f.lean.x, 0, f.lean.z)).add(v3(f.x, f.y, f.z));
    });
    const imOf = (geo, mat, list) => { const im = new T.InstancedMesh(geo, mat, Math.max(1, list.length)); im.count = list.length; im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; V.add(im); return im; };
    const listA = FL.filter((f) => f.t.geo === 0), listB = FL.filter((f) => f.t.geo === 1);
    const imA = imOf(headA, instFelt, listA), imB = imOf(headB, instFelt, listB), imC = imOf(heartGeo, instFelt, FL), imS = imOf(stemGeo, grassMat, FL);
    listA.forEach((f, i) => imA.setColorAt(i, col(f.t.c)));
    listB.forEach((f, i) => imB.setColorAt(i, col(f.t.c)));
    FL.forEach((f, i) => { imC.setColorAt(i, col(f.t.cc)); imS.setColorAt(i, col(GC[i % 4]).multiplyScalar(0.9)); });
    const M4 = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), SC = v3(), PS = v3();
    FL.forEach((f, i) => { E.set(f.lean.x, f.yaw, f.lean.z); Q.setFromEuler(E); M4.compose(v3(f.x, f.y, f.z), Q, v3(1, f.h, 1)); imS.setMatrixAt(i, M4); });
    let beatK = 0;
    const drawFlowers = (t) => {
      let ia = 0, ib = 0;
      FL.forEach((f, i) => {
        const op = f.cur;
        const sw = Math.sin(t * 1.3 + f.ph) * 0.06 + beatK * 0.08 * Math.sin(f.ph * 3);
        PS.copy(f.top);
        PS.x += sw * f.h * 0.15;
        E.set(-0.42 + f.lean.x + sw * 0.5, f.yaw, f.lean.z - sw);
        Q.setFromEuler(E);
        const s = f.s * lerp(0.14, 1, easeOutBack(op));
        M4.compose(PS, Q, SC.setScalar(Math.max(0.001, s)));
        if (f.t.geo === 0) imA.setMatrixAt(ia++, M4); else imB.setMatrixAt(ib++, M4);
        M4.compose(PS, Q, SC.setScalar(f.s * lerp(0.55, 1, op)));
        imC.setMatrixAt(i, M4);
      });
      imA.instanceMatrix.needsUpdate = imB.instanceMatrix.needsUpdate = imC.instanceMatrix.needsUpdate = true;
    };
    [imA, imB, imC, imS].forEach((im) => { if (im.instanceColor) im.instanceColor.needsUpdate = true; im.instanceMatrix.needsUpdate = true; });

    // « ces messieurs » : deux tournesols en chapeau haut-de-forme
    const petalGeo = (() => { const gs = []; for (let i = 0; i < 16; i++) { const g = feltGeo(leafShape(2.1, 4.0), 0.3, { bevel: 0.06, curve: 8 }); g.translate(0, 5.0, -0.15 - (i % 2) * 0.12); g.rotateZ((i / 16) * TAU + (i % 2) * 0.1); gs.push(g); } return mergeGeos(gs); })();
    const mustGeo = mergeGeos([-1, 1].map((s) => yarnGeo([[0, -0.5, 0.82], [s * 0.7, -0.85, 0.92], [s * 1.5, -0.72, 0.88], [s * 1.95, -0.25, 0.82], [s * 1.75, 0.05, 0.8]], 0.2, { radial: 5 })));
    const mkMonsieur = (x, z, h, side, hatCol, bandCol, seed) => {
      const g = new T.Group();
      g.add(yarn([[0, 0, 0], [side * 0.6, h * 0.35, 0.3], [-side * 0.3, h * 0.7, 0.2], [0, h, 0]], 0.45, '#5E9E3C', { radial: 6 }));
      const arms = [-1, 1].map((s) => {
        const piv = new T.Group();
        at(piv, s * 0.35, h * 0.5, 0.2);
        const lf = feltPiece(leafShape(3.0, 7, 0.7 * s), '#6CB04A', { depth: 0.3, inset: 0.38, stitch: '#A8DB86', st: { len: 0.35, gap: 0.22, r: 0.04 } });
        lf.position.y = 3.4;
        const lg = grp(lf);
        lg.rotation.z = -s * 1.05;
        piv.add(lg);
        g.add(piv);
        return piv;
      });
      const head = new T.Group();
      at(head, 0, h, 0.3);
      g.add(head);
      head.add(mesh(petalGeo, wool('#F7C02C', 'felt')));
      head.add(feltPiece(circleShape(3.5), '#7A4A24', { depth: 1.2, inset: 0.45, stitch: '#B98A52', st: { len: 0.4, gap: 0.26, r: 0.06 } }));
      const eyes = [];
      for (const s of [-1, 1]) {
        const w = felt(circleShape(0.78), '#FFFDF6', 0.15, { bevel: 0 });
        at(w, s * 1.25, 0.75, 0.66);
        head.add(w);
        const b = bead(0.42, '#1A1210');
        at(b, s * 1.2 + side * 0.12, 0.65, 0.82);
        head.add(b);
        eyes.push(b);
        const c = felt(circleShape(0.55), '#F28C8C', 0.1, { bevel: 0 });
        at(c, s * 2.3, -0.55, 0.64);
        head.add(c);
      }
      const must = mesh(mustGeo, wool('#3A2416', 'yarn'), { cast: false });
      head.add(must);
      head.add(yarn([[-0.6, -1.35, 0.72], [0, -1.65, 0.8], [0.6, -1.35, 0.72]], 0.13, '#3A2416', { radial: 5, cast: false }));
      // chapeau haut-de-forme
      const hat = new T.Group();
      const hm = wool(hatCol, 'felt');
      hat.add(mesh(latheGeo([[1.55, 0], [1.45, 2.9], [1.62, 3.1], [0.01, 3.15]], { seg: 22 }), hm));
      hat.add(mesh(latheGeo([[0.01, -0.05], [2.75, -0.05], [2.85, 0.15], [1.3, 0.28]], { seg: 22 }), hm));
      const band = mesh(new T.TorusGeometry(1.52, 0.22, 6, 22), wool(bandCol, 'felt'));
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.5;
      hat.add(band);
      hat.position.set(side * 0.3, 3.25, -0.1);
      hat.rotation.z = -side * 0.16;
      head.add(hat);
      g.rotation.y = -side * 0.5;
      at(g, x, H(x, z) - 0.2, z);
      g.visible = false;
      V.add(g);
      V.boilable(g, 0.04, 0.4);
      return { g, head, arms, must, hat, eyes, blink: blinker(eyes, seed), side };
    };
    const mess = [mkMonsieur(-25, -17, 16, -1, '#2B2632', '#D8443A', 4), mkMonsieur(26, -16, 18, 1, '#3A3F7A', '#F5C32C', 9)];

    // la casserole d'huile sur son petit feu de camp
    const pan = new T.Group();
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; const s = stone(1.7, '#A8A196', 10 + i); at(s, Math.cos(a) * 3.1, 0.7, Math.sin(a) * 3.1); pan.add(s); }
    pan.add(mesh(mergeGeos([-0.6, 0.6].map((a) => yarnGeo([[Math.cos(a) * -3, 0.4, Math.sin(a) * -3], [Math.cos(a) * 3, 0.5, Math.sin(a) * 3]], 0.42, { radial: 6 }))), wool('#7A4E30', 'yarn')));
    const fireMat = wool('#FF9A2E', 'felt', { emissive: '#FF7A1A', emissiveIntensity: 1.7 });
    const fireMat2 = wool('#FFE07A', 'felt', { emissive: '#FFD04A', emissiveIntensity: 2.2 });
    const flameShape = blobShape([[0, -0.1], [1.3, 0.5], [1.1, 1.8], [0.4, 2.5], [0.55, 3.4], [-0.2, 2.6], [-0.9, 2.9], [-1.2, 1.4], [-1.3, 0.4]]);
    const flameShape2 = blobShape([[0, 0], [0.7, 0.4], [0.6, 1.3], [0.1, 2.1], [-0.6, 1.2], [-0.7, 0.4]]);
    const fire = new T.Group();
    for (const r of [0, Math.PI / 2]) {
      const f1 = mesh(feltGeo(flameShape, 0.2, { bevel: 0.05 }), fireMat, { cast: false });
      const f2 = mesh(feltGeo(flameShape2, 0.2, { bevel: 0.05 }), fireMat2, { cast: false });
      f2.position.z = 0.15;
      f1.rotation.y = f2.rotation.y = r;
      fire.add(f1, f2);
    }
    fire.position.y = 0.6;
    pan.add(fire);
    const potY = 2.0;
    const pot = new T.Group();
    pot.add(mesh(latheGeo([[0.01, 0], [3.4, 0], [3.75, 0.35], [3.85, 3.1], [4.1, 3.25], [4.0, 3.5], [3.55, 3.4], [3.5, 0.6], [0.01, 0.6]], { seg: 28 }), wool('#D8463A', 'knit', { scale: 0.55 })));
    const rimSt = stitches(outline2D(circleShape(3.92), 60), 0, '#FFE2C8', { len: 0.4, gap: 0.3, r: 0.06 });
    rimSt.rotation.x = Math.PI / 2;
    rimSt.position.y = 2.7;
    pot.add(rimSt);
    const oil = mesh(new T.CircleGeometry(3.5, 28).rotateX(-Math.PI / 2), resinMat('#E9B437', { rough: 0.06 }), { cast: false });
    oil.position.y = 2.6;
    pot.add(oil);
    const bubbles = [0, 1, 2].map((i) => { const b = mesh(new T.SphereGeometry(0.45, 10, 8), resinMat('#F6CF5A', { rough: 0.05 }), { cast: false }); b.position.set(Math.cos(i * 2.1) * 1.8, 2.6, Math.sin(i * 2.1) * 1.8); pot.add(b); return b; });
    pot.add(yarn([[3.8, 2.8, 0], [8, 3.6, 0], [11.5, 4.3, 0]], 0.6, '#8B5A36', { radial: 6 }));
    pot.position.y = potY;
    pot.rotation.y = 2.3;
    pan.add(pot);
    const panSh = contactShadow(16, 12, 0.45);
    panSh.position.y = 0.15;
    pan.add(panSh);
    at(pan, -21, H(-21, 10), 10);
    pan.visible = false;
    V.add(pan);
    const fireL = practical(V, [-21, H(-21, 10) + 3, 10], '#FF9A42', 0, 34);

    // le seau d'eau
    const pail = new T.Group();
    pail.add(mesh(latheGeo([[0.01, 0], [3.0, 0], [3.15, 0.3], [3.95, 6.3], [4.2, 6.45], [4.12, 6.75], [3.72, 6.62], [2.9, 0.6], [0.01, 0.6]], { seg: 28 }), wool('#3E7FD6', 'knit', { scale: 0.55 })));
    [1.6, 4.4].forEach((y) => { const r0 = 3.0 + (y / 6.3) * 0.95 + 0.12; const b = mesh(new T.TorusGeometry(r0, 0.22, 6, 28), wool('#FFFFFF', 'knit', { scale: 0.4 })); b.rotation.x = Math.PI / 2; b.position.y = y; pail.add(b); });
    const pw = mesh(new T.CircleGeometry(3.75, 28).rotateX(-Math.PI / 2), resinMat('#7CCBF2', { rough: 0.05 }), { cast: false });
    pw.position.y = 5.7;
    pail.add(pw);
    pail.add(yarn([[-4.05, 6.4, 0], [-3.4, 9.6, 0.3], [0, 11.2, 0.4], [3.4, 9.6, 0.3], [4.05, 6.4, 0]], 0.16, '#B9BEC6', { radial: 5 }));
    const pailSh = contactShadow(12, 10, 0.45);
    pailSh.position.y = 0.15;
    pail.add(pailSh);
    pail.rotation.y = -0.3;
    at(pail, 24, H(24, 11) - 0.1, 11);
    pail.visible = false;
    V.add(pail);

    // la souris verte au crochet
    const ms = critter({ size: 11, color: '#46B46A', belly: '#E4F5DA', pose: 'four', head: 0.36, snout: 0.42, snoutCol: '#BFE8C8', nose: '#F07C96', noseR: 0.15, eyeR: 0.15, eyeY: 16, eyeSpread: 30, ears: 'round', earR: 0.64, earIn: '#F7A6BA', tail: 'thin', tailLen: 1.75, tailUp: 0.3, tailCol: '#F39DB2', cheeks: '#F59AA6', fuzz: 0.12, paw: '#F3B0C0' });
    lighter(ms.g, 1.3, 14);
    const MP = ms.p, hsz = ms.hs, hr = [hsz, hsz * 0.92, hsz * 0.95];
    // moustaches et sourire brodés sur le museau
    const snC = v3(0, -hsz * 0.22, hr[2] * 0.72), snR = [hsz * 0.42, hsz * 0.32, hsz * 0.42];
    const sp = (az, el, k = 1.02) => { const q = surf(snR, az, el); return q.p.multiplyScalar(k).add(snC); };
    const wh = [];
    for (const s of [-1, 1]) for (const dy of [-0.25, 0.15]) { const a = sp(s * 62, 0); wh.push(yarnGeo([a, a.clone().add(v3(s * hsz * 0.55, dy * hsz * 0.6 + 0.1, -0.15)), a.clone().add(v3(s * hsz * 1.1, dy * hsz * 1.1 + 0.05, -0.4))], 0.045, { radial: 4 })); }
    MP.head.add(mesh(mergeGeos(wh), wool('#F4EEDC', 'yarn'), { cast: false }));
    MP.head.add(yarn([sp(-24, -38), sp(0, -50, 1.03), sp(24, -38)], 0.08, '#4A2A22', { radial: 4, cast: false }));
    // la coquille d'escargot (à la fin)
    const shR = 3.8;
    const shell = new T.Group();
    shell.add(woolBall(shR, '#E8A040', 'crochet', { sx: 0.62, seed: 21, fuzz: 0.12, lump: 0.02 }));
    const spiral = (side) => { const pts = []; for (let i = 0; i <= 44; i++) { const t = i / 44, a = t * TAU * 2.3, rr = 0.25 + t * shR * 0.84; const xs = 0.62 * shR * Math.sqrt(Math.max(0, 1 - (rr / shR) ** 2)) + 0.14; pts.push([side * xs, Math.sin(a) * rr, Math.cos(a) * rr]); } return yarnGeo(pts, 0.26, { radial: 5 }); };
    shell.add(mesh(mergeGeos([spiral(1), spiral(-1)]), wool('#9A5426', 'yarn'), { cast: false }));
    const steam = [0, 1, 2].map((i) => { const s = yarn([[0, 0, 0], [0.6, 1.2, 0], [-0.5, 2.4, 0], [0.4, 3.6, 0], [0, 4.5, 0]], 0.3, '#F4F8FF', { radial: 5, cast: false }); s.position.set((i - 1) * 1.4, shR * 0.9, (i - 1) * 0.4); shell.add(s); return s; });
    shell.position.set(0, ms.br[1] * 0.85 + shR * 0.5, -0.5);
    shell.rotation.x = -0.12;
    shell.scale.setScalar(0.001);
    MP.body.add(shell);
    V.add(ms.g);
    V.boilable(ms.g, 0.05, 0.6);
    const mShadow = contactShadow(9, 11, 0.5);
    V.add(mShadow);
    const blinkM = blinker(MP.eyes, 5);
    const earBase = MP.ears.map((e) => e.rotation.clone());

    // particules : pollen dans le soleil, pétales qui tombent, étincelles de la fin
    let sparks = null, petals = null, puffs = null;
    if (live) {
      pointCloud(V, { n: 60, box0: [-60, 1, -30], box1: [60, 42, 30], size: 1.0, sprite: 'lint', color: '#FFF6D8', opacity: 0.45, vel: [0.6, 0.3, 0.1], beam: 0.6, keyDir: [-0.5, 0.67, 0.55] });
      petals = fallers(V, { n: 16, kind: 'heart', box: [-50, 50, 0, 46, -24, 22], colors: ['#FFFFFF', '#F9C6D8', '#FFE7A0'], speed: 3, size: 0.5 });
      sparks = pointCloud(V, { n: 60, box0: [-17, 1, -4], box1: [9, 24, 10], size: 1.15, sprite: 'spark', color: '#FFE27A', glow: 2.4, twinkle: 1, wander: 1.2, vel: [0, 1.6, 0], opacity: 0 });
      puffs = pointCloud(V, { n: 16, box0: [-7, 12, 1], box1: [-1, 24, 5], size: 4.5, sprite: 'soft', color: '#FFFFFF', twinkle: 0, wander: 0.8, vel: [0.2, 3.2, 0], opacity: 0, additive: false, seed: 4 });
    }
    const conf = live ? confetti(V, { kinds: ['heart', 'leaf', 'disc'], n: 40, size: 0.8, height: H }) : { burst() {}, rain() {} };
    const SPRING = ['#F59BC0', '#FFFFFF', '#F7CB2E', '#8FC8F5', '#E5484D', '#9ACF6A'];
    V.onHome = (c) => conf.burst(v3(0, 13, 2), 6, [c, '#FFFFFF', '#F9C6D8'], 0.45, 0.6);

    // ---------------- état et animation ----------------
    const mPos = v3(spots[0][0], spots[0][1], spots[0][2]);
    let mYaw = spots[0][3], curYaw = mYaw, hop = null, spotI = -1, ph = 0, done = false, messOn = false, panOn = false, pailOn = false;
    let landBurst = null;
    const startHop = (b, yawEnd, o2 = {}) => {
      const d = Math.hypot(b[0] - mPos.x, b[2] - mPos.z);
      hop = { a: mPos.clone(), b: v3(b[0], b[1], b[2]), t0: V.now + 1 / FPS, dur: o2.dur || clamp(0.5 + d * 0.012, 0.55, 0.85), h: (o2.h || 3.5) + d * 0.2 + Math.max(0, b[1] - mPos.y) * 0.6, flip: !!o2.flip, yaw0: curYaw, yawEnd, dir: d > 0.5 ? Math.atan2(b[0] - mPos.x, b[2] - mPos.z) : mYaw };
      landBurst = { t: hop.t0 + hop.dur, p: hop.b.clone(), n: o2.burst || 0 };
    };
    const P = v3();
    V.anim((t, f) => {
      blinkM(t, f);
      mess.forEach((m) => m.blink(t, f));
      beatK = Math.max(0, 1 - V.age('beat') / 0.3);
      // fleurs qui s'ouvrent
      let moving = false;
      FL.forEach((fl) => { if (Math.abs(fl.tg - fl.cur) > 0.002) { fl.cur += (fl.tg - fl.cur) * 0.3; moving = true; } else fl.cur = fl.tg; });
      drawFlowers(t);
      // la souris
      let sy = 1, sxz = 1, pitch = 0, yaw = mYaw, roll = 0, floorY = mPos.y, air = 0;
      if (hop) {
        const k = (V.now - hop.t0) / hop.dur;
        if (k < 0) { P.copy(hop.a); } else if (k < 1) {
          const kk = sat(k), fl2 = sat((kk - 0.16) / 0.68);
          P.copy(hop.a).lerp(hop.b, easeInOut(fl2));
          P.y += bump(fl2) * hop.h;
          floorY = lerp(hop.a.y, hop.b.y, fl2);
          air = bump(fl2);
          yaw = kk < 0.16 ? lerp(hop.yaw0, hop.dir, smooth(kk / 0.16)) : hop.dir;
          if (kk < 0.16) { const q = Math.sin((kk / 0.16) * Math.PI * 0.5); sy = 1 - 0.24 * q; sxz = 1 + 0.12 * q; } else if (kk < 0.84) { sy = 1 + 0.2 * bump(fl2); sxz = 1 - 0.08 * bump(fl2); pitch = -0.45 * Math.cos(fl2 * Math.PI); } else { const q = Math.sin(((kk - 0.84) / 0.16) * Math.PI); sy = 1 - 0.22 * q; sxz = 1 + 0.12 * q; }
          if (hop.flip) pitch -= easeInOut(fl2) * TAU;
          mPos.copy(P);
        } else {
          mPos.copy(hop.b);
          const k2 = sat((V.now - hop.t0 - hop.dur) / 0.45);
          yaw = lerp(hop.dir, hop.yawEnd, smooth(k2));
          mYaw = hop.yawEnd;
          if (k2 >= 1) hop = null;
        }
      }
      if (!hop) yaw = mYaw;
      curYaw = yaw;
      // petits sauts de joie et en rythme
      const joy = bump(sat(V.age('joy') / 0.4)) * 2.2 + bump(sat(V.age('beat') / 0.26)) * 1.3;
      const fin = done ? Math.abs(Math.sin(V.age('shell') * 4.2)) * (V.age('shell') < 2.4 ? 1.2 : 0.35) * (V.age('shell') > 0 ? 1 : 0) : 0;
      ms.g.position.set(mPos.x, mPos.y + (hop ? 0 : joy + fin), mPos.z);
      ms.g.rotation.set(0, yaw, 0);
      MP.body.rotation.x = pitch;
      MP.body.rotation.z = roll + (hop ? 0 : Math.sin(t * 0.9) * 0.03);
      ms.g.scale.set(sxz, sy * (1 + Math.sin(t * 3.1) * 0.02), sxz);
      const H2 = MP.head;
      const sniff = Math.floor(t / 2.2) % 2 === 0 && !hop;
      H2.rotation.x = -0.08 + (sniff ? (f % 2 ? 0.07 : -0.02) : 0) - bump(sat(V.age('joy') / 0.4)) * 0.2;
      H2.rotation.y = done ? lerp(H2.rotation.y, -0.95, 0.3) : Math.sin(t * 0.7) * 0.35 + Math.sin(t * 1.9) * 0.08;
      MP.ears.forEach((e, i) => { const b = earBase[i], s = i ? 1 : -1; e.rotation.set(b.x - air * 0.5, b.y, b.z + s * (beatK * 0.25 + air * 0.3 + Math.sin(t * 2.3 + i) * 0.04)); });
      if (MP.tail) { MP.tail.rotation.y = Math.sin(t * 1.7) * 0.35; MP.tail.rotation.x = air * 0.25 + Math.sin(t * 1.2) * 0.08; }
      mShadow.position.set(mPos.x, floorY + 0.15, mPos.z);
      mShadow.scale.setScalar(1 - air * 0.45);
      mShadow.material.opacity = 0.5 * (1 - air * 0.6);
      if (landBurst && V.now >= landBurst.t) { if (landBurst.n) conf.burst(landBurst.p.clone().add(v3(0, 1, 0)), landBurst.n, SPRING, 0.5, 0.7); landBurst = null; }
      // la coquille, la vapeur et les étincelles
      const shK = done ? easeOutBack(sat(V.age('shell') / 0.6)) : 0;
      shell.scale.setScalar(Math.max(0.001, shK));
      shell.visible = shK > 0.002;
      steam.forEach((s, i) => { const c = ((t * 0.6 + i * 0.33) % 1); s.visible = shK > 0.5; s.scale.set(0.6 + c * 0.6, 0.3 + c * 0.9, 1); s.position.y = shR * 0.9 + c * 1.6; s.rotation.z = Math.sin(t * 3 + i * 2) * 0.25; });
      if (sparks) sparks.obj.material.uniforms.uOpacity.value = done ? sat(V.age('shell') / 0.5) * 0.95 : 0;
      if (puffs) puffs.obj.material.uniforms.uOpacity.value = done ? sat(V.age('shell') / 0.8) * 0.4 : 0;
      if (petals) petals.on = 0.25 + 0.75 * sat(ph / NP + 0.1);
      // les messieurs tournesols
      mess.forEach((m, i) => {
        const k = messOn ? easeOutBack(sat(V.age('mess') / 0.9 - i * 0.15)) : 0;
        m.g.visible = k > 0.01;
        m.g.scale.set(Math.max(0.01, k), Math.max(0.01, k), Math.max(0.01, k));
        const talk = ph >= 4 && !done ? (Math.floor(t * 3 + i * 1.5) % 4 < 2 ? 1 : 0) : 0;
        m.must.rotation.z = talk * (f % 2 ? 0.08 : -0.08);
        m.must.position.y = talk * (f % 2 ? 0.08 : 0);
        m.head.rotation.x = Math.sin(t * 1.1 + i) * 0.05 + beatK * 0.12 + bump(sat(V.age('nod') / 0.5)) * 0.25;
        m.head.rotation.z = Math.sin(t * 0.8 + i * 2) * 0.06;
        m.head.rotation.y = -m.side * 0.15;
        m.hat.rotation.x = done ? -bump(sat((V.age('shell') - 0.3 - i * 0.2) / 0.6)) * 0.8 : 0;
        m.hat.position.y = 3.25 + (done ? bump(sat((V.age('shell') - 0.3 - i * 0.2) / 0.6)) * 2.2 : 0);
        const clap = done && V.age('shell') < 3 ? Math.abs(Math.sin(V.age('shell') * 9 + i)) : 0;
        m.arms.forEach((a, j) => { const s = j ? 1 : -1; a.rotation.z = s * (Math.sin(t * 1.4 + i + j) * 0.08 + clap * 0.5) ; });
      });
      // la casserole, son feu, le seau
      const pk = panOn ? easeOutBack(sat(V.age('pan') / 0.7)) : 0;
      pan.visible = pk > 0.01;
      pan.scale.setScalar(Math.max(0.01, pk));
      fire.scale.set(1 + (hashi(f, 3) - 0.5) * 0.18, 0.9 + hashi(f, 5) * 0.25, 1);
      fire.rotation.y = (hashi(f, 7) - 0.5) * 0.3;
      fireL.intensity = pan.visible ? 160 * pk * (0.85 + hashi(f, 9) * 0.3) : 0;
      bubbles.forEach((b, i) => { const c = (t * 0.9 + i * 0.37) % 1; b.scale.setScalar(Math.max(0.01, bump(c))); b.position.y = 2.6 + c * 0.3; });
      const qk = pailOn ? easeOutBack(sat(V.age('pail') / 0.7)) : 0;
      pail.visible = qk > 0.01;
      pail.scale.setScalar(Math.max(0.01, qk));
      pw.position.y = 5.7 + Math.sin(t * 2.2) * 0.04;
      // papillons
      butterflies.forEach((b, i) => {
        const fast = beatK > 0.2 || V.age('joy') < 0.5;
        const open = ((f + i) >> (fast ? 0 : 1)) % 2 === 0;
        b.wings.forEach((w, j) => { w.rotation.y = (j ? -1 : 1) * (open ? 0.25 : 1.15); });
        b.g.position.y = b.y0 + Math.sin(t * 1.6 + b.ph * 4) * 0.8;
      });
    });

    return {
      update(st, first) {
        ph = Math.min(st.phrasesDone, NP);
        FL.forEach((fl) => { fl.tg = st.p >= fl.th ? 1 : 0; if (first) fl.cur = fl.tg; });
        if (st.done) {
          if (!done) {
            done = true;
            if (first) { mPos.set(FINAL[0], FINAL[1], FINAL[2]); mYaw = FINAL[3]; hop = null; V.cues.shell = -10; } else { startHop(FINAL, FINAL[3], { h: 7, burst: 0 }); V.cue('shell', hop.dur + 0.1); }
          }
        } else {
          done = false;
          const want = ORDER[st.found % ORDER.length];
          if (want !== spotI) {
            const s = spots[want];
            if (first || spotI < 0) { mPos.set(s[0], s[1], s[2]); mYaw = s[3]; hop = null; } else startHop(s, s[3], { burst: 7 });
            spotI = want;
          }
        }
        const mOn = ph >= 3;
        if (mOn !== messOn) { messOn = mOn; if (mOn) { if (first) V.cues.mess = -10; else V.cue('mess'); } }
        const pOn = ph >= 6;
        if (pOn !== panOn) { panOn = pOn; if (pOn) { if (first) V.cues.pan = -10; else V.cue('pan'); } }
        const qOn = ph >= 7;
        if (qOn !== pailOn) { pailOn = qOn; if (qOn) { if (first) V.cues.pail = -10; else V.cue('pail'); } }
      },
      react(kind) {
        if (kind === 'correct') {
          V.cue('joy', hop ? hop.dur + 0.1 : 0);
        }
        if (kind === 'phrase') {
          if (hop && hop.t0 >= V.now - 0.01) { hop.flip = true; hop.h += 3; hop.dur += 0.15; landBurst = { t: hop.t0 + hop.dur, p: hop.b.clone(), n: 16 }; if (done) V.cue('shell', hop.dur + 0.1); } else if (!hop) { startHop([mPos.x, mPos.y, mPos.z], mYaw, { flip: true, h: 6, dur: 0.75, burst: 16 }); }
          V.cue('nod');
          conf.burst(v3(0, 18, -6), 14, SPRING, 0.7, 1.4);
        }
        if (kind === 'complete') {
          conf.burst(v3(FINAL[0], FINAL[1] + 6, FINAL[2]), 30, ['#FFE07A', '#FFFFFF', '#F59BC0', '#F7CB2E'], 1.1, 1.2);
          conf.rain([-40, 40, 40, -10, 16], 30, SPRING);
          V.cue('nod');
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('beat');
      },
    };
  },
};
