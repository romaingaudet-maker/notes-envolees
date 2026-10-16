/* ============ Sur le pont d'Avignon : on y danse, au soleil de Provence ============
   Le vieux pont de pierre tricoté s'arrête au milieu du Rhône. Le tambourinaire
   joue du galoubet et du tambourin ; une Arlésienne danse seule, puis un danseur
   arrive à chaque phrase et la farandole s'allonge. La lavande fleurit à mesure
   qu'on retrouve les notes ; à la fin, la farandole se referme : tous en rond ! */
SCENES.provence = {
  color: '#F2C26B',
  view: {
    bg: '#FFE2B0', fov: 26,
    rig: { target: [2, 16.5, 2], az: -10, el: 15, box: [64, 50], targetWide: [-1, 17, 1], boxWide: [98, 42] },
    post: { exposure: 1.06, bloom: 0.55, bloomThr: 0.95, aper: 6, maxBlur: 10, sat: 1.12, lift: '#2A1A10', gain: '#FFF4E4', vignette: 0.28, punch: 1.26 },
  },
  sky: [-34, 18, 30, 38, -6, 4],
  home: [16.6, 19.6, -4.2],
  build(V, o) {
    const PORTRAIT = !!o.portrait;
    studioLights(V, {
      key: { color: '#FFD08A', k: 2.9, az: 38, el: 42, area: 72 },
      fill: { sky: '#8DBDEB', ground: '#7A6040', k: 0.55 },
      rim: { color: '#FFE0A8', k: 1.6, az: -150, el: 28 },
      env: { sky: '#B5D3EE', ground: '#7A6446', k: 0.5, boxK: 4 },
      fog: { color: '#F6DDB4', near: 220, far: 640 },
    });

    /* ---------- petits outils du décor ---------- */
    const lerpA = (a, b, k) => { const d = ((((b - a) + Math.PI) % TAU) + TAU) % TAU - Math.PI; return a + d * k; };
    const slim = (root, rMax = 0.9) => {
      const list = [];
      root.traverse((m) => { if (m.isMesh && !m.isInstancedMesh) list.push(m); });
      list.forEach((m) => {
        const g = m.geometry;
        if (!g.boundingSphere) g.computeBoundingSphere();
        const r = g.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z);
        if (r < rMax) m.children.filter((c) => c.userData.isFuzz).forEach((c) => m.remove(c));
        if (r < 1.1) m.castShadow = false;
      });
      return root;
    };
    const bake = (root) => {
      root.updateMatrixWorld(true);
      const inv = new T.Matrix4().copy(root.matrixWorld).invert();
      const groups = new Map(), drop = [];
      root.traverse((m) => {
        if (!m.isMesh) return;
        if (m.userData.isFuzz) { drop.push(m); return; }
        if (m.isInstancedMesh || m.userData.keep || m.material.transparent || m.material.vertexColors) return;
        const key = m.material.uuid + (m.castShadow ? '+' : '-');
        let G = groups.get(key);
        if (!G) groups.set(key, (G = { mat: m.material, cast: m.castShadow, list: [] }));
        const g = m.geometry.clone();
        g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, m.matrixWorld));
        G.list.push(g);
        drop.push(m);
      });
      drop.forEach((m) => { if (m.parent) m.parent.remove(m); });
      groups.forEach((G) => { root.add(mesh(mergeGeos(G.list), G.mat, { cast: G.cast })); G.list.forEach((g) => g.dispose()); });
      return root;
    };
    const noCast = (root) => { root.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return root; };
    const defuzz = (root) => { const l = []; root.traverse((m) => { if (m.userData.isFuzz) l.push(m); }); l.forEach((m) => m.parent.remove(m)); return root; };

    /* ---------- ciel, collines, Ventoux, palais ---------- */
    // le ciel de Provence : un drap peint (non éclairé, pour garder son bleu sous la lumière chaude)
    const skyM = cyclo({ w: 560, h: 92, z: -100, r: 44, floor: 30, top: '#2C78CC', mid: '#62A8E6', bottom: '#FFE0B0', y: -5, scale: 3 });
    // (les faces de cyclo() regardent vers le fond : on rend le drap visible des deux côtés)
    skyM.material = new T.MeshBasicMaterial({ vertexColors: true, map: pattern('felt', 3).map, color: new T.Color(1.15, 1.15, 1.15), side: T.DoubleSide });
    V.add(skyM);
    // le mont Ventoux, bleu, avec son sommet blanc
    const vent = new T.Group();
    vent.add(flatLayer(blobShape([[-80, -10], [-60, 6], [-20, 18], [10, 30], [24, 33], [40, 27], [80, 12], [110, -10]], 80), '#8E9BC9', { depth: 1, inset: 1.2, stitch: '#B5BFE0', st: { len: 1.2, gap: 0.8, r: 0.1 } }));
    const cap = flatLayer(blobShape([[-2, 27.5], [10, 30.2], [24, 33], [40, 27], [34, 25], [24, 27.5], [14, 25.5], [6, 27]], 40), '#F4F1EC', { depth: 0.6, stitch: false });
    cap.position.z = 0.7;
    vent.add(cap);
    at(vent, 70, 0, -94);
    V.add(vent);
    // la colline aux rangs de lavande
    const HILLZ = -82;
    const hill = flatLayer(blobShape([[-150, -10], [-150, 10], [-90, 16], [-40, 20], [10, 17], [60, 13], [110, 9], [150, 8], [150, -10]], 100), '#A9B36A', { depth: 1, inset: 1.2, stitch: '#CFD49A', st: { len: 1.1, gap: 0.7, r: 0.1 } });
    at(hill, 0, 0, HILLZ);
    V.add(hill);
    const hillTop = (x) => { const k = (x + 150) / 300; return lerp(lerp(10, 20, smooth(k * 3.6)), lerp(20, 8, smooth((k - 0.3) / 0.7)), smooth((k - 0.2) * 3)); };
    const stripes = [];
    for (let i = 0; i < 9; i++) {
      const pts = [];
      for (let k = 0; k <= 12; k++) { const x = -140 + k * 25, top = hillTop(x) - 2.2; pts.push([x, Math.max(0.5, top * (1 - i / 9.5) - 0.6), 0.75]); }
      stripes.push(yarnGeo(pts, 0.75, { radial: 6, maxSeg: 60 }));
    }
    const stripeMat = wool('#FFFFFF', 'yarn', { sheen: 0.6 }).clone();
    const stripeM = mesh(mergeGeos(stripes), stripeMat, { cast: false });
    at(stripeM, 0, 0, HILLZ);
    V.add(stripeM);
    // cyprès découpés sur la colline
    const ftr = new T.Group();
    [[-96, 13, 1.0], [-74, 15, 0.8], [-12, 16, 0.9], [36, 13, 1.1], [52, 12, 0.8], [96, 9, 1.0]].forEach(([x, y, s]) => {
      const c = flatLayer(blobShape([[0, 0], [1.6, 2], [1.9, 7], [1.1, 12], [0, 15], [-1.1, 12], [-1.9, 7], [-1.6, 2]].map(([a, b]) => [a * s, b * s]), 30), '#3E6A3C', { depth: 0.6, stitch: false });
      at(c, x, y - 2, 1.2);
      ftr.add(c);
    });
    at(ftr, 0, 0, HILLZ);
    V.add(bake(ftr));
    // le palais des papes sur son rocher (silhouette de feutrine)
    const pal = new T.Group();
    const rock = flatLayer(blobShape([[-34, -4], [-30, 6], [-18, 10], [0, 11], [16, 9], [24, 4], [26, -4]], 50), '#C6AF84', { depth: 1, inset: 1, stitch: '#E3D2AE', st: { len: 1, gap: 0.6, r: 0.09 } });
    pal.add(rock);
    const palPts = [[-26, 9], [-26, 25], [-27, 25], [-27, 28], [-25.5, 28], [-25.5, 26.5], [-24, 26.5], [-24, 28], [-22.5, 28], [-22.5, 25], [-21, 25], [-21, 21], [-14, 21], [-14, 23], [-12.5, 23], [-12.5, 21.5], [-11, 21.5], [-11, 23], [-9.5, 23], [-9.5, 21], [-6, 21], [-6, 30], [-7, 30], [-7, 32.5], [-5.6, 32.5], [-5.6, 31], [-4.2, 31], [-4.2, 32.5], [-2.8, 32.5], [-2.8, 31], [-1.4, 31], [-1.4, 32.5], [0, 32.5], [0, 30], [-1, 30], [-1, 20], [6, 20], [6, 22], [7.5, 22], [7.5, 20.5], [9, 20.5], [9, 22], [10.5, 22], [10.5, 18], [14, 18], [14, 24], [14.8, 26.5], [15.6, 24], [15.6, 18], [18, 18], [18, 9]];
    const palF = flatLayer(polyShape(palPts), '#E9D4A6', { depth: 1, inset: 0.8, stitch: '#F8ECD0', st: { len: 0.6, gap: 0.4, r: 0.08 } });
    palF.position.z = 0.6;
    pal.add(palF);
    for (const [x, y, w, h] of [[-24, 18, 1, 3], [-17, 15, 1.2, 3.4], [-12, 15, 1.2, 3.4], [-3.5, 24, 1, 3], [-3.5, 16, 1.2, 3.5], [3, 14, 1.2, 3], [8, 14, 1.2, 3], [-21, 12, 1.4, 2.5]]) {
      const w2 = felt(roundRectShape(w, h, w * 0.5), '#6E5A44', 0.3, { fuzz: false });
      at(w2, x, y, 1.3);
      pal.add(w2);
    }
    // la Vierge dorée au sommet de la tour (une perle de métal)
    const vg = mesh(latheGeo([[0.01, 0], [0.7, 0.2], [0.5, 1.6], [0.35, 2.0], [0.45, 2.4], [0.01, 2.8]], { seg: 10 }), metalMat('#E8B83A', { rough: 0.3 }));
    at(vg, 14.8, 26.5, 0.6);
    pal.add(vg);
    at(pal, -36, 0, -70);
    V.add(noCast(bake(pal)));

    // le soleil de Provence, pendu à son fil, et son halo
    const sunG = new T.Group();
    sunG.add(feltPiece(circleShape(8), '#FFBE2E', { depth: 1.8, inset: 0.8, stitch: '#F07E1E', st: { len: 0.6, gap: 0.4, r: 0.09 }, mat: { emissive: '#FF9A10', emissiveIntensity: 0.6 } }));
    const rays = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU, r0 = 9.2, r1 = i % 2 ? 12.4 : 14.2;
      rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.06) * (r0 + r1) / 2, Math.sin(a + 0.06) * (r0 + r1) / 2, 0.3], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.45, { radial: 6, maxSeg: 8 }));
    }
    sunG.add(mesh(mergeGeos(rays), wool('#FFA526', 'yarn'), { cast: false }));
    addFace(sunG, 7.6, { z: 0.95, cheeks: '#F2683E' });
    noCast(bake(sunG));
    at(sunG, 22, 41, -52);
    const sunH = hang(sunG, 170, { amp: 1.0, per: 7 });
    V.add(sunH);
    swingAnim(V, sunH);
    const halo = new T.Mesh(new T.PlaneGeometry(44, 44), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFC060').multiplyScalar(0.32), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    at(halo, 22, 41, -58);
    V.add(halo);
    {
      const c = defuzz(noCast(cloud({ w: 18, h: 6, bumps: 4, seed: 6, stitch: '#E8DCCB' })));
      at(c, -16, 40, -60);
      const hc = hang(c, 170, { amp: 1.2, per: 6 });
      V.add(hc);
      swingAnim(V, hc);
    }

    /* ---------- le Rhône et ses rives ---------- */
    const WY = 1.0;
    const ground = terrain({ w: 360, d: 220, nx: 56, nz: 34, y: -4, hills: [[-98, -6, 62, 17], [-31, 33, 22, 9], [-62, 58, 30, 9]], colors: ['#C8B47C', '#BBA770'], bands: 7, rough: 0.6, scale: 1.8 });
    V.add(ground);
    const H = ground.userData.height;
    const river = water({ w: 320, d: 190, color: '#2A78A8' });
    at(river, 20, WY, -10);
    V.add(river);
    V.anim((t) => river.userData.wave(t, 0.42));

    /* ---------- le pont, en pierre tricotée, cassé au milieu du fleuve ---------- */
    const DY = 13, DZ = 10.5, TOP = DY + 0.5; // le biseau de l'extrusion relève le tablier d'un demi-centimètre
    const ARCH = [-28, -8, 12], SPAN = 15;
    const bsh = new T.Shape();
    bsh.moveTo(-70, -2); bsh.lineTo(24.5, -2); bsh.lineTo(24.5, 2.5);
    for (let a = 180; a >= 146; a -= 6) bsh.lineTo(32 + Math.cos(a * DEG) * 7.5, 2.5 + Math.sin(a * DEG) * 7.5);
    [[27.4, 7.6], [26.6, 9.0], [28.4, 10.2], [27.5, 11.5], [29.0, 12.4], [28.5, DY]].forEach(([x, y]) => bsh.lineTo(x, y));
    bsh.lineTo(-70, DY); bsh.lineTo(-70, -2);
    ARCH.forEach((xc) => {
      const p = new T.Path(), hw = SPAN / 2, yb = -1, ys = 2.5;
      p.moveTo(xc - hw, yb); p.lineTo(xc + hw, yb); p.lineTo(xc + hw, ys);
      p.absarc(xc, ys, hw, 0, Math.PI, false);
      p.lineTo(xc - hw, yb);
      bsh.holes.push(p);
    });
    const bridgeG = new T.ExtrudeGeometry(bsh, { depth: DZ * 2 - 1, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2, curveSegments: 18 });
    bridgeG.translate(0, 0, -DZ + 0.5);
    bridgeG.computeVertexNormals();
    const stone = wool('#D9C59C', 'knit', { scale: 0.9, bump: 1.2 });
    const bridge = new T.Group();
    bridge.add(mesh(bridgeG, stone));
    // parapets, avant-becs des piles
    const par = (z, h) => { const L = z > 0 ? 95.6 : 94.4; const b = mesh(new T.BoxGeometry(L, h, 1.2), wool('#D3BF96', 'knit', { scale: 0.8 })); at(b, -70 + L / 2, TOP + h / 2, z); return b; };
    bridge.add(par(DZ - 0.7, 1.5), par(-DZ + 0.7, 2.4));
    // la cassure : parapets rognés, pierres tombées dans l'eau
    for (const [x, y, z, r, sd] of [[26.6, TOP + 0.4, DZ - 0.7, 0.9, 1], [25.6, TOP + 0.6, -DZ + 0.8, 1.1, 2], [31.5, WY, DZ + 2, 1.6, 3], [34, WY, 3, 2.0, 4], [30, WY, -4, 1.4, 5], [36.5, WY, 9, 1.1, 6]]) {
      const st2 = mesh(blobGeo(r * 1.2, r * 0.8, r, { seg: 12, lump: 0.18, seed: sd }), stone);
      at(st2, x, y, z);
      st2.rotation.set(sd, sd * 2, sd * 0.5);
      bridge.add(st2);
    }
    const cutG = new T.ExtrudeGeometry(polyShape([[-2.6, 0], [2.6, 0], [0, -3.8]]), { depth: 7.5, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 1 });
    cutG.rotateX(-Math.PI / 2);
    for (const xp of [-18, 2, 22]) { const c = mesh(cutG, stone); at(c, xp, -2, DZ - 0.2); bridge.add(c); const tp = mesh(new T.ConeGeometry(3.0, 2.2, 3), stone); at(tp, xp, 5.5 + 1.1, DZ + 0.9); tp.scale.set(1, 1, 0.9); bridge.add(tp); }
    // joints de pierre : claveaux autour des arches, cordon sous le parapet
    const lines = [];
    ARCH.forEach((xc) => {
      const arc = [];
      for (let a = 0; a <= 180; a += 12) arc.push([xc + Math.cos(a * DEG) * 9.4, 2.5 + Math.sin(a * DEG) * 9.4, DZ + 0.05]);
      lines.push(yarnGeo(arc, 0.18, { radial: 5, maxSeg: 60 }));
      for (let a = 15; a < 180; a += 15) lines.push(yarnGeo([[xc + Math.cos(a * DEG) * 7.7, 2.5 + Math.sin(a * DEG) * 7.7, DZ + 0.05], [xc + Math.cos(a * DEG) * 9.3, 2.5 + Math.sin(a * DEG) * 9.3, DZ + 0.05]], 0.13, { radial: 4 }));
    });
    lines.push(yarnGeo([[-70, DY - 0.9, DZ + 0.08], [28, DY - 0.9, DZ + 0.08]], 0.22, { radial: 5 }));
    for (const xp of [-18, 2, 22]) for (const y of [3.5, 6.5]) lines.push(yarnGeo([[xp - 2.6, y, DZ + 0.05], [xp + 2.6, y, DZ + 0.05]], 0.13, { radial: 4 }));
    bridge.add(mesh(mergeGeos(lines), wool('#B8A07A', 'yarn'), { cast: false }));
    V.add(bake(bridge));
    // les dalles du tablier
    V.add(scatter(feltGeo(roundRectShape(1, 1, 0.22), 0.3, { bevel: 0.08, bevelSeg: 1, curve: 2 }), wool('#FFFFFF', 'felt', { sheen: 0.4, sheenColor: '#8A7A60' }), 96, (i, r) => {
      const c = i % 19, rw = Math.floor(i / 19);
      const w = 3.6 + r() * 0.4, x = -52 + c * 4.3 + (rw % 2) * 2.1 + (r() - 0.5) * 0.3, z = -8.2 + rw * 4.1 + (r() - 0.5) * 0.2;
      return { p: [x, TOP + 0.04, z], r: [-Math.PI / 2, 0, (r() - 0.5) * 0.06], s: [w, 3.5, 1], c: col('#EADBBB').multiplyScalar(0.9 + r() * 0.14) };
    }, { cast: false }));
    // la petite barque sur le Rhône, en amont
    const boat = new T.Group();
    boat.add(woolBall(1, '#7E5638', 'knit', { sx: 4.6, sy: 1.3, sz: 1.8, seed: 4, fuzz: false, seg: 18 }));
    boat.add(mesh(yarnGeo([[0.3, 0.6, 0], [0.3, 9.5, 0]], 0.16, { radial: 5 }), woodMat('#8A6A48')));
    const sail = feltPiece(polyShape([[0, 0], [5.2, 0], [0, 8]]), '#F7EFDF', { depth: 0.2, inset: 0.35, stitch: '#C8372D', st: { len: 0.35, gap: 0.25, r: 0.05 } });
    at(sail, 0.45, 1.3, 0);
    boat.add(sail);
    noCast(boat);
    at(boat, 34, WY, -34);
    boat.rotation.y = -0.5;
    V.add(boat);

    // deux canards qui nagent en rond sur le Rhône
    const DUCKS = [[{ r: 2.2, color: '#A88660', belly: '#D2BC98', wing: '#6E5236', beak: '#E8A23A', beakL: 0.6, legs: false, tail: 'fan', tailUp: 0.4 }, -10, 26, 5, 0], [{ r: 2.1, color: '#8C7A5C', belly: '#C9B898', headCol: '#2F6B48', beak: '#E8B83A', beakL: 0.6, legs: false, tail: 'fan', tailUp: 0.4 }, 12, 32, 6, 2.5]].map(([def, cx, cz, rad, ph]) => {
      const b = bird(def);
      slim(b.g, 1.2);
      V.add(b.g);
      V.boilable(b.g, 0.04, 0.5);
      return { b, cx, cz, rad, ph, blink: blinker(b.p.eyes, 40 + cx) };
    });

    /* ---------- la rive gauche : lavande, cyprès, roseaux ---------- */
    const R = rng(23);
    const LAV = [];
    for (let row = 0; row < 7; row++) {
      for (let k = 0; k < 18; k++) {
        const u = k / 17;
        const x = lerp(-96, -30, u) + row * 2.2, z = lerp(6, 62, u) * 0.35 + row * 5.6 + 8;
        const y = H(x, z);
        if (y < WY + 0.9) continue;
        LAV.push({ p: [x + (R() - 0.5) * 0.8, y + 0.4, z + (R() - 0.5) * 0.8], s: 1.1 + R() * 0.45, ph: R() });
      }
    }
    const lavGeo = mergeGeos([blobGeo(1.5, 1.05, 1.5, { seg: 12, lump: 0.25, seed: 2 }), applyM(blobGeo(0.9, 0.9, 0.9, { seg: 10, lump: 0.2, seed: 5 }), { p: [0.6, 0.75, 0.2] }), applyM(blobGeo(0.85, 0.85, 0.85, { seg: 10, lump: 0.2, seed: 7 }), { p: [-0.6, 0.7, -0.3] })]);
    const lavIM = scatter(lavGeo, wool('#FFFFFF', 'crochet', { sheen: 0.7, sheenColor: '#E8DDF8', scale: 0.7 }), LAV.length, (i) => ({ p: LAV[i].p, r: [0, LAV[i].ph * 6, 0], s: [LAV[i].s, LAV[i].s * 0.95, LAV[i].s] }));
    V.add(lavIM);
    const sage = col('#93A882'), lavC = col('#8F68C8'), lavL = col('#B596E2'), cc = new T.Color();
    let bloom = -1;
    const setBloom = (b) => {
      if (Math.abs(b - bloom) < 0.002) return;
      bloom = b;
      LAV.forEach((L, i) => { const k = smooth((b * 1.25 - L.ph * 0.25) * 1.0); lavIM.setColorAt(i, cc.copy(sage).lerp(i % 3 ? lavC : lavL, k).multiplyScalar(0.92 + L.ph * 0.16)); });
      if (lavIM.instanceColor) lavIM.instanceColor.needsUpdate = true;
      stripeMat.color.copy(sage).lerp(lavC, smooth(b));
    };
    setBloom(0);
    // cyprès en tricot (3D) et roseaux au bord de l'eau
    const cyp = new T.Group();
    [[-62, 0, 1.0], [-58, -12, 0.8], [-74, 22, 1.15], [-39, 36, 0.9]].forEach(([x, z, s]) => {
      const c = mesh(latheGeo([[0.01, 0], [2.6, 1.5], [3.2, 6], [2.9, 13], [1.9, 20], [0.8, 25], [0.01, 27.5]].map(([r, y]) => [r * s, y * s]), { seg: 14, lump: 0.08, seed: x }), wool('#2F5A33', 'knit', { scale: 0.7 }));
      at(c, x, H(x, z) - 0.5, z);
      cyp.add(c);
      const sh = contactShadow(9 * s, 7 * s, 0.4);
      at(sh, x, H(x, z) + 0.15, z);
      cyp.add(sh);
    });
    V.add(bake(cyp));
    const reeds = [];
    for (let i = 0; i < 16; i++) {
      const x = -40 + (R() - 0.5) * 16, z = 8 + R() * 24, y = Math.max(WY - 0.2, H(x, z));
      if (H(x, z) > WY + 2) continue;
      for (let j = 0; j < 3; j++) { const a = R() * TAU, hgt = 4 + R() * 4; reeds.push(yarnGeo([[x, y, z], [x + Math.cos(a) * 0.5, y + hgt * 0.6, z + Math.sin(a) * 0.5], [x + Math.cos(a) * 1.3, y + hgt, z + Math.sin(a) * 1.3]], 0.14, { radial: 4, maxSeg: 6 })); }
    }
    if (reeds.length) V.add(mesh(mergeGeos(reeds), wool('#7E9A4E', 'yarn')));

    /* ---------- les marionnettes ---------- */
    const KH = 13, legH = KH * 0.2, bodyH = KH * 0.4, br = KH * 0.15, AL = KH * 0.27;
    const shY = legH + bodyH * 0.86;
    const longArms = (d, sleeves) => {
      for (const s of [-1, 1]) {
        const old = d.p[s < 0 ? 'armL' : 'armR'];
        const arm = limb(AL, KH * 0.045, sleeves, { kind: 'knit', end: { r: KH * 0.05, color: '#F3C9A6', sy: 0.9 } });
        arm.position.copy(old.position); arm.rotation.copy(old.rotation);
        old.parent.add(arm); old.parent.remove(old);
        d.p[s < 0 ? 'armL' : 'armR'] = arm;
      }
    };
    // la coiffe d'Arlésienne : un petit bonnet blanc et son ruban noir sur le chignon
    const coiffe = (d) => {
      const Rr = d.R, c = new T.Group();
      c.add(woolBall(Rr * 0.52, '#FFFFFF', 'felt', { sy: 0.62, fuzz: false, seg: 16 }));
      const rb = mesh(new T.TorusGeometry(Rr * 0.5, Rr * 0.09, 6, 18), wool('#1E1E24', 'felt'));
      rb.rotation.x = Math.PI / 2;
      c.add(rb);
      at(c, 0, Rr * 1.02, -Rr * 0.36);
      c.rotation.x = -0.5;
      d.p.head.add(c);
    };
    // chapeau de feutre noir à large bord
    const feltHat = (d, band) => {
      const Rr = d.R, h = new T.Group();
      const brim = felt(circleShape(Rr * 1.55), '#26232A', 0.25, { fuzz: false });
      brim.rotation.x = -Math.PI / 2;
      h.add(brim);
      h.add(mesh(latheGeo([[Rr * 0.86, 0], [Rr * 0.82, Rr * 0.62], [Rr * 0.7, Rr * 0.72], [0.01, Rr * 0.76]], { seg: 20 }), wool('#26232A', 'felt')));
      const b = mesh(new T.TorusGeometry(Rr * 0.85, Rr * 0.07, 6, 20), wool(band, 'felt'));
      b.rotation.x = Math.PI / 2; b.position.y = Rr * 0.1;
      h.add(b);
      at(h, 0, Rr * 0.72, -Rr * 0.04);
      h.rotation.x = -0.1;
      d.p.head.add(h);
    };
    const puppet = (def, extra) => {
      const d = doll(def);
      longArms(d, def.sleeves || def.top);
      if (extra) extra(d);
      slim(d.g, 2.05);
      d.p.head.rotation.order = 'YXZ';
      V.add(d.g);
      V.boilable(d.g, 0.05, 0.6);
      return d;
    };
    const DANCERS = [
      { h: KH, top: '#B5383E', sleeves: '#B5383E', dress: true, collar: '#FFFFFF', ruff: true, legs: '#F4EFE6', shoes: '#2A2228', hair: '#3A2418', hairStyle: 'bun', fringe: false, cheeks: '#F29A8A', x: coiffe },
      { h: KH, top: '#F4F1EA', sleeves: '#F4F1EA', belt: '#C8372D', bottom: '#3A3F5A', shoes: '#2A2228', hair: '#6B4423', hairStyle: 'short', fringe: false, cheeks: '#F29A8A', buttons: { n: 2, color: '#3A3F5A' }, x: (d) => feltHat(d, '#C8372D') },
      { h: KH, top: '#2F62A8', sleeves: '#2F62A8', dress: true, collar: '#FFFFFF', ruff: true, legs: '#F4EFE6', shoes: '#2A2228', hair: '#9A5A2E', hairStyle: 'bun', fringe: false, cheeks: '#F29A8A', x: coiffe },
      { h: KH, top: '#F4F1EA', sleeves: '#F4F1EA', belt: '#2F62A8', bottom: '#5A4A3A', shoes: '#2A2228', hair: '#2A1E18', hairStyle: 'short', fringe: false, cheeks: '#F29A8A', hat: { type: 'straw', color: '#E8C878', band: '#C8372D' } },
    ].map((def, i) => {
      const d = puppet(def, def.x);
      const sh = contactShadow(5.5, 5, 0.4);
      V.add(sh);
      return { d, i, on: i === 0 ? 1 : 0, t0: -1e9, k: i === 0 ? 1 : 0, blink: blinker(d.p.eyes, 5 + i * 9), sh };
    });
    // le tambourinaire, près de la cassure du pont
    const mus = puppet({ h: KH, top: '#2C2C3A', sleeves: '#F4F1EA', belt: '#C8372D', bottom: '#EDE6D6', shoes: '#2A2228', hair: '#7A5232', hairStyle: 'short', fringe: false, cheeks: '#F29A8A', beard: '#7A5232' }, (d) => feltHat(d, '#C8372D'));
    const MP = v3(19.5, TOP + 0.2, -2.2);
    at(mus.g, MP.x, MP.y, MP.z);
    mus.g.rotation.y = -0.85;
    const musSh = contactShadow(5.5, 5, 0.4);
    at(musSh, MP.x, TOP + 0.33, MP.z);
    V.add(musSh);
    // le tambourin, pendu à la hanche
    const drum = new T.Group();
    drum.add(mesh(latheGeo([[2.15, 0], [2.25, 0.25], [2.25, 4.9], [2.15, 5.15]], { seg: 22 }), woodMat('#C98B4A')));
    for (const y of [0.02, 5.13]) { const sk = mesh(new T.CircleGeometry(2.12, 22), wool('#F3E9D2', 'felt')); sk.rotation.x = y < 1 ? Math.PI / 2 : -Math.PI / 2; sk.position.y = y; drum.add(sk); }
    const zig = [];
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * TAU; zig.push([Math.cos(a) * 2.32, i % 2 ? 0.5 : 4.7, Math.sin(a) * 2.32]); }
    drum.add(mesh(yarnGeo(zig, 0.09, { radial: 4, maxSeg: 120, tension: 0 }), wool('#C8372D', 'yarn')));
    for (const y of [0.3, 4.85]) { const hoop = mesh(new T.TorusGeometry(2.28, 0.16, 6, 24), wool('#8A2A22', 'felt')); hoop.rotation.x = Math.PI / 2; hoop.position.y = y; drum.add(hoop); }
    bake(drum);
    const drumPiv = new T.Group();
    drumPiv.add(drum);
    drum.position.y = -2.6;
    at(drumPiv, -br * 1.75, bodyH * 0.42, 0.9);
    drumPiv.rotation.z = 0.12;
    mus.p.body.add(drumPiv);
    // le galoubet (petite flûte), à la bouche ; la baguette dans la main droite
    const gal = mesh(yarnGeo([[0, 0, 0], [0, -2.4, 1.6], [0, -4.6, 3.0]], 0.17, { radial: 6 }), woodMat('#5A3A22'));
    at(gal, 0, -mus.R * 0.45, mus.R * 0.82);
    mus.p.head.add(gal);
    const stick = mesh(yarnGeo([[0, 0, 0], [0, -0.4, 2.2], [0, -0.6, 4.6]], 0.13, { radial: 5 }), woodMat('#E3C08A'));
    const knobS = woolBall(0.35, '#F3E9D2', 'felt', { fuzz: false, seg: 10 });
    at(knobS, 0, -0.6, 4.7);
    stick.add(knobS);
    at(stick, 0, -AL - 0.2, 0.2);
    mus.p.armR.add(stick);
    const blinkM = blinker(mus.p.eyes, 31);

    // poses : main dans la main, en ligne (farandole) ou en rond
    const pose = (mid, s) => {
      const d = mid.clone().sub(v3(s * br * 0.92, shY, 0)).normalize();
      return { x: Math.atan2(-d.z, -d.y), z: Math.asin(clamp(d.x, -1, 1)) };
    };
    const lineY = legH + bodyH * 0.45, ringY = legH + bodyH * 0.55;
    let GAP = 8;
    for (let g = 8; g < 14; g += 0.05) { if (Math.hypot(g / 2 - br * 0.92, lineY - shY) > AL + 0.3) break; GAP = g; }
    let R0 = 5;
    for (let r = 5; r < 9; r += 0.05) { if (Math.hypot(r / 2 - br * 0.92, ringY - shY, r / 2) > AL + 0.3) break; R0 = r; }
    const LINE = { '-1': pose(v3(-GAP / 2, lineY, 0), -1), '1': pose(v3(GAP / 2, lineY, 0), 1) };
    const RING = { '-1': pose(v3(-R0 / 2, ringY, R0 / 2), -1), '1': pose(v3(R0 / 2, ringY, R0 / 2), 1) };
    const CX = -6, CZ = 0.5, ENTRY = v3(-58, TOP, 0.5), camAz = -10 * DEG, FY = TOP + 0.2;

    /* ---------- particules ---------- */
    let conf = null, petals = null;
    if (!PORTRAIT) {
      pointCloud(V, { n: 60, box0: [-60, 4, -26], box1: [40, 50, 24], size: 1.0, color: '#FFE6B0', opacity: 0.42, vel: [0.3, 0.2, 0.1], wander: 2.2, beam: 0.4, keyDir: [0.5, 0.65, 0.55] });
      pointCloud(V, { n: 40, box0: [-24, WY + 0.4, 12], box1: [60, WY + 0.7, 46], size: 0.75, sprite: 'spark', color: '#FFF4D0', glow: 1.4, twinkle: 1, wander: 0.4, vel: [0, 0, 0.6], opacity: 0.75 });
      conf = confetti(V, { kinds: ['leaf', 'disc', 'heart'], n: 32, size: 0.95, height: (x, z) => (x > -70 && x < 25 && Math.abs(z) < DZ ? TOP : Math.max(WY + 0.3, H(x, z))) });
      petals = fallers(V, { n: 40, kind: 'leaf', box: [-40, 30, 10, 46, -10, 18], colors: ['#8F68C8', '#B596E2', '#7A55B8', '#FFFFFF'], speed: 5, size: 0.7, on: 0 });
    }
    const PARTY = ['#8F68C8', '#B596E2', '#FFBE2E', '#C8372D', '#FFFFFF', '#2F62A8'];
    V.onHome = (c) => { V.cue('boom'); if (conf) conf.burst(v3(15.6, 18.2, -0.4), 8, [c, '#FFFFFF', '#B596E2'], 0.5, 0.5); };

    /* ---------- animation ---------- */
    let done = false, doneT = -1e9, lastT = null, Dt = 0, Dc = 0, bloomT = 0, fired = true, spin = 0, ringK = 0;
    V.anim((t, f) => {
      const dt = lastT == null ? 0 : clamp(t - lastT, 0, 0.5);
      lastT = t;
      const listening = V.age('note') < 0.9;
      if (!listening) Dt += dt * (done ? 2.6 : 2.0);
      Dc += (Dt - Dc) * Math.min(1, dt * 10);
      setBloom(bloom + (bloomT - bloom) * (bloom < 0 ? 1 : Math.min(1, dt * 2.5)));
      if (petals) petals.on = done ? sat((t - doneT) / 2) : 0;
      const ya = V.age('farand');
      if (!fired && ya > 0.15) { fired = true; if (conf) { conf.burst(v3(CX, TOP + 12, CZ), 42, PARTY, 1.2, 1.1); conf.burst(v3(MP.x, TOP + 10, MP.z), 12, PARTY, 0.7, 0.6); } }
      // la farandole se referme en rond à la fin
      ringK = done ? easeInOut(sat((t - doneT) / 1.6)) : 0;
      spin = done ? Math.max(0, t - doneT - 1.2) * 0.9 : 0;
      const present = DANCERS.filter((Dn) => Dn.on);
      const n = present.length;
      // ordre de la ligne : le dernier arrivé est à gauche
      const order = present.slice().sort((a, b) => b.t0 - a.t0 || b.i - a.i);
      const hopAll = sat(V.age('hop') / 0.5);
      const step = Dc;
      DANCERS.forEach((Dn) => {
        const d = Dn.d, g = d.g, P = d.p;
        Dn.blink(t, f);
        if (!Dn.on) { g.visible = false; Dn.sh.visible = false; return; }
        g.visible = true; Dn.sh.visible = true;
        const idx = order.indexOf(Dn);
        const k = sat((t - Dn.t0) / 1.7);
        Dn.k = k;
        // place dans la ligne / dans le rond
        const lx0 = CX + (idx - (n - 1) / 2) * GAP, lz = CZ;
        Dn.lx = Dn.lx == null || Dn.k0 !== Dn.t0 ? lx0 : Dn.lx + (lx0 - Dn.lx) * Math.min(1, dt * 5);
        Dn.k0 = Dn.t0;
        const lx = Dn.lx;
        const th = -Math.PI / 4 - idx * Math.PI / 2 + spin;
        const rx = CX + R0 * Math.sin(th), rz = CZ + R0 * Math.cos(th), rry = th + Math.PI;
        let x = lerp(lx, rx, ringK), z = lerp(lz, rz, ringK), ry = lerpA(camAz, rry, ringK);
        // arrivée en sautillant depuis la rive
        let hy = 0;
        if (k < 1) { const e = easeInOut(k); x = lerp(ENTRY.x, x, e); z = lerp(ENTRY.z, z, e); ry = lerpA(Math.PI / 2, ry, smooth((k - 0.7) / 0.3)); hy = Math.abs(Math.sin(k * Math.PI * 6)) * 1.6; }
        // le pas : sautillé, en alternance (farandole)
        const ph = Math.abs(Math.sin(Math.PI * step + (idx % 2) * Math.PI / 2));
        hy += (k >= 1 ? ph * (done ? 1.3 : 0.8) : 0) + bump(hopAll) * 2.6;
        // l'Arlésienne seule tourne sur elle-même
        let twirl = 0;
        if (n === 1 && !done) twirl = t * 2.2;
        if (V.age('farand') < 1.4) hy += bump(sat(V.age('farand') / 0.7)) * 4;
        g.position.set(x, FY + hy, z);
        g.rotation.set(0, ry + twirl, 0);
        const sq = k >= 1 ? 1 - 0.07 * Math.pow(1 - ph, 6) + 0.04 * ph : 1;
        g.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
        Dn.sh.position.set(x, FY + 0.13, z);
        Dn.sh.scale.setScalar(1 - Math.min(0.5, hy * 0.08));
        P.body.rotation.z = Math.sin(Math.PI * step) * 0.07;
        // bras
        const left = idx > 0 ? order[idx - 1] : null, right = idx < n - 1 ? order[idx + 1] : null;
        const ringL = done ? 1 : 0;
        const arm = (s) => {
          const nb = s < 0 ? left : right;
          let hk = nb ? Math.min(easeInOut(nb.k), easeInOut(k)) : 0;
          if (done && !nb && n === 4) hk = ringK; // la ligne se referme
          const wave = { x: -0.3, z: s * (2.4 + 0.3 * Math.sin(t * 8 + Dn.i)) };
          const L = LINE[s], Rg = RING[s];
          const hold = { x: lerp(L.x, Rg.x, ringK * ringL), z: lerp(L.z, Rg.z, ringK * ringL) };
          return { x: lerp(wave.x, hold.x, hk), z: lerp(wave.z, hold.z, hk) };
        };
        let aL = arm(-1), aR = arm(1);
        if (n === 1 && !done) { aL = { x: -0.2, z: -2.5 - 0.2 * Math.sin(t * 6) }; aR = { x: -0.2, z: 2.5 + 0.2 * Math.sin(t * 6) }; }
        P.armL.rotation.set(aL.x, 0, aL.z);
        P.armR.rotation.set(aR.x, 0, aR.z);
        P.legL.rotation.x = Math.sin(Math.PI * step) * 0.3;
        P.legR.rotation.x = -Math.sin(Math.PI * step) * 0.3;
        const rel = Math.atan2(Math.sin(camAz - ry - twirl), Math.cos(camAz - ry - twirl));
        P.head.rotation.set(0.05 + Math.sin(t * 0.9 + Dn.i) * 0.04, Math.sin(rel) * 0.7 + Math.sin(t * 0.7 + Dn.i) * 0.12, Math.sin(Math.PI * step) * 0.08);
      });
      // le tambourinaire : la baguette frappe, la tête bat la mesure
      blinkM(t, f);
      const beat = listening ? bump(sat(V.age('note') / 0.22)) : Math.max(0, Math.sin(t * 2.4 * Math.PI));
      const boom = bump(sat(V.age('boom') / 0.3));
      mus.p.armR.rotation.set(-0.75 - beat * 0.45 - boom * 0.3, 0, -0.55);
      mus.p.armL.rotation.set(-1.9, 0, 0.62);
      mus.p.head.rotation.set(-0.05 + beat * 0.08, 0.15, Math.sin(t * 1.3) * 0.05);
      drumPiv.rotation.z = 0.12 + boom * 0.12;
      drum.scale.set(1 + boom * 0.08, 1 - boom * 0.06, 1 + boom * 0.08);
      mus.g.position.y = MP.y + Math.abs(Math.sin(t * 2.4 * Math.PI)) * 0.25 + (done ? Math.abs(Math.sin(t * 5)) * 0.8 : 0);
      // les canards
      DUCKS.forEach((Dk, i) => {
        const a = t * 0.22 * (i ? -1 : 1) + Dk.ph, g = Dk.b.g;
        g.position.set(Dk.cx + Math.cos(a) * Dk.rad, WY - 1.0 + Math.sin(t * 1.6 + i) * 0.15, Dk.cz + Math.sin(a) * Dk.rad * 0.5);
        g.rotation.set(Math.sin(t * 1.3 + i) * 0.05, Math.atan2(-Math.sin(a) * (i ? -1 : 1), Math.cos(a) * 0.5 * (i ? -1 : 1)), 0);
        Dk.b.p.head.rotation.x = bump(sat(V.age('note') / 0.3)) * 0.4 + Math.max(0, Math.sin(t * 0.9 + i * 2) - 0.9) * 4;
        Dk.blink(t, f);
      });
      // la barque se balance
      boat.position.y = WY + Math.sin(t * 1.4) * 0.25;
      boat.rotation.z = Math.sin(t * 1.1) * 0.05;
      boat.position.x = 34 + Math.sin(t * 0.15) * 4;
    });

    return {
      update(st, first) {
        const ph = st.phrasesDone || 0, t1 = first ? -1e9 : V.now + 1 / FPS;
        DANCERS.forEach((Dn, i) => {
          const on = i === 0 || ph >= i || st.done ? 1 : 0;
          if (on && (!Dn.on || first)) Dn.t0 = i === 0 || first ? -1e9 + i : t1 + i * 0.25;
          Dn.on = on;
        });
        bloomT = st.done ? 1 : st.p;
        if (first) { setBloom(bloomT); }
        if (st.done && (!done || first)) doneT = first ? -1e9 : t1;
        done = !!st.done;
      },
      react(kind) {
        if (kind === 'correct' || kind === 'phrase') V.cue('hop');
        if (kind === 'phrase') V.cue('boom');
        if (kind === 'complete') { V.cue('farand'); fired = false; }
      },
      note(n, on) {
        if (!on) return;
        Dt += 1;
        V.cue('note');
      },
    };
  },
};
