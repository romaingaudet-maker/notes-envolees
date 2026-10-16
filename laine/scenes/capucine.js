/* ============ Dansons la capucine : la ronde au jardin, un après-midi doré ============
   Deux enfants dansent la capucine en se tenant la main ; les deux autres
   attendent (l'une assise sur un pot retourné, l'autre qui lorgne les pains
   posés sur la fenêtre de la voisine) et rejoignent la ronde, un par phrase.
   Les capucines s'ouvrent une à une sur la barrière ; à la troisième phrase,
   la voisine ouvre ses volets. « You ! » : tout le monde s'accroupit puis bondit. */
SCENES.capucine = {
  color: '#F2B866',
  view: {
    bg: '#F6DAA8', fov: 26,
    rig: { target: [-3, 12, 6], az: -7, el: 26, box: [54, 42], targetWide: [2, 13.5, 3], boxWide: [88, 38] },
    post: { exposure: 1.06, bloom: 0.5, bloomThr: 0.95, aper: 6, maxBlur: 10, sat: 1.12, lift: '#2A1406', gain: '#FFF6EA', vignette: 0.32, punch: 1.26 },
  },
  sky: [-32, 16, 21, 28, -4, 6],
  home: [-4, 15, 9],
  build(V, o) {
    const PORTRAIT = !!o.portrait;
    studioLights(V, {
      key: { color: '#FFBE70', k: 2.8, az: -50, el: 30, area: 66 },
      fill: { sky: '#9FC2EA', ground: '#6A5232', k: 0.52 },
      rim: { color: '#FFD49A', k: 1.8, az: 150, el: 24 },
      env: { sky: '#C3D6E6', ground: '#6E5634', k: 0.5, boxK: 4 },
      fog: { color: '#F1D8AE', near: 230, far: 650 },
    });

    /* ---------- petits outils du décor ---------- */
    const ZA = v3(0, 0, 1);
    const m4 = new T.Matrix4(), q4 = new T.Quaternion(), qa = new T.Quaternion(), qb = new T.Quaternion(), s4 = v3(), p4 = v3();
    const XA = v3(1, 0, 0);
    const lerpA = (a, b, k) => { const d = ((((b - a) + Math.PI) % TAU) + TAU) % TAU - Math.PI; return a + d * k; };
    // les petites pièces des poupées perdent leur duvet (invisible à cette taille) et leur ombre
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
    // décor immobile : on fond toutes les pièces d'une même matière en une seule
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

    /* ---------- le ciel, le sol, les plans du fond ---------- */
    const cyc = cyclo({ w: 540, h: 96, z: -96, r: 44, floor: 40, top: '#5E9FD8', mid: '#A9CFE8', bottom: '#FFD99E', y: -2, scale: 3 });
    cyc.material.side = T.DoubleSide; // les faces de cyclo() regardent vers le fond : sans cela le drap est invisible
    V.add(cyc);
    const ground = terrain({ w: 340, d: 170, nx: 44, nz: 26, colors: ['#7DB653', '#73AC4A'], bands: 6, rough: 0.45, scale: 1.8, hills: [[-95, -62, 40, 7], [90, -70, 48, 9]] });
    V.add(ground);
    const far = flatLayer(hillShape(320, 26, 5, 3), '#A3C98C', { depth: 1, inset: 1.1, stitch: '#DCE6A8', st: { len: 1.2, gap: 0.8, r: 0.1 } });
    at(far, -10, 0, -74);
    const near = flatLayer(hillShape(280, 15, 4, 9), '#84BB57', { depth: 1, inset: 1.1, stitch: '#C4DC8E', st: { len: 1.0, gap: 0.65, r: 0.1 } });
    at(near, 20, 0, -56);
    V.add(far, near);
    // arbres ronds découpés dans la feutrine, sur les collines
    const ftrees = new T.Group();
    [[-70, 13, 7, '#6E9F48'], [-52, 9, 5, '#7EAE52'], [62, 12, 6.5, '#6E9F48'], [82, 8, 5, '#87B45A'], [100, 14, 7.5, '#6E9F48']].forEach(([x, y, r, c]) => {
      const t = flatLayer(circleShape(r), c, { depth: 0.8, inset: 0.6, stitch: false });
      at(t, x, y + r, 0);
      const tk = flatLayer(roundRectShape(1.6, y + 2, 0.5), '#7A5A3A', { depth: 0.6, stitch: false });
      at(tk, x, (y + 2) / 2 - 1, -0.3);
      ftrees.add(t, tk);
    });
    at(ftrees, 0, 0, -60);
    V.add(bake(ftrees));

    // le soleil de l'après-midi, pendu à son fil, et son halo
    const sunG = new T.Group();
    sunG.add(feltPiece(circleShape(7), '#FFC53A', { depth: 1.8, inset: 0.8, stitch: '#F08A24', st: { len: 0.6, gap: 0.4, r: 0.09 }, mat: { emissive: '#FFA41C', emissiveIntensity: 0.55 } }));
    const rays = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU, r0 = 8.1, r1 = i % 2 ? 10.8 : 12.2;
      rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.07) * (r0 + r1) / 2, Math.sin(a + 0.07) * (r0 + r1) / 2, 0.3], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.42, { radial: 6, maxSeg: 8 }));
    }
    sunG.add(mesh(mergeGeos(rays), wool('#FFAE2C', 'yarn'), { cast: false }));
    addFace(sunG, 6.7, { z: 0.95, cheeks: '#F27A54' });
    noCast(bake(sunG));
    at(sunG, -22, 28, -46);
    const sunH = hang(sunG, 160, { amp: 1.1, per: 6.5 });
    V.add(sunH);
    swingAnim(V, sunH);
    const halo = new T.Mesh(new T.PlaneGeometry(40, 40), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFC874').multiplyScalar(0.3), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    at(halo, -22, 28, -52);
    V.add(halo);
    // nuages de feutrine
    [[2, 27, -62, 18, 7, 3], [44, 36, -60, 17, 7, 5], [-52, 26, -58, 19, 7, 8]].forEach(([x, y, z, w, h, seed]) => {
      const c = defuzz(noCast(cloud({ w, h, bumps: 4, seed, stitch: '#E7D7C0' })));
      at(c, x, y, z);
      const hc = hang(c, 160, { amp: 1.4, per: 5 + seed * 0.3 });
      V.add(hc);
      swingAnim(V, hc);
    });

    /* ---------- l'arbre du jardin ---------- */
    const tr = tree({ h: 46, type: 'round', color: '#5E9C44', color2: '#78B552', crown: 15, puffs: 7, seed: 5, trunkCol: '#7A5236' });
    at(tr, -41, 0, -21);
    V.add(bake(tr));

    /* ---------- la barrière de bois peint ---------- */
    const FZ = -8;
    const pk = feltGeo(polyShape([[-0.85, 0], [0.85, 0], [0.85, 8.7], [0, 10.1], [-0.85, 8.7]]), 0.55, { bevel: 0.14 });
    const woodW = woodMat('#FFFFFF');
    const nPk = 60;
    V.add(scatter(pk, woodW, nPk, (i, r) => ({ p: [-92 + i * 2.75 + (r() - 0.5) * 0.2, 0, FZ], r: [(r() - 0.5) * 0.03, (r() - 0.5) * 0.08, (r() - 0.5) * 0.05], s: [1, 0.95 + r() * 0.09, 1], c: col('#F3EADA').multiplyScalar(0.88 + r() * 0.12) })));
    const fenceG = new T.Group();
    for (const y of [2.8, 7.4]) { const rl = mesh(new T.BoxGeometry(166, 1.3, 0.55), woodMat('#E9DCC4')); at(rl, -10, y, FZ - 0.6); fenceG.add(rl); }
    for (let x = -88; x <= 72; x += 22) { const po = mesh(new T.BoxGeometry(1.7, 11.4, 1.7), woodMat('#E9DCC4')); at(po, x, 5.7, FZ - 1.6); fenceG.add(po); }
    V.add(bake(fenceG));

    /* ---------- la maison de la voisine ---------- */
    const HX = 25, HZ = -24;
    const house = new T.Group();
    at(house, HX, 0, HZ);
    V.add(house);
    const hw = 34, hh = 28, gab = 12;
    const built = new T.Group();
    built.add(wallPanel(hw, hh, [[-6, 13.6, 12, 11], [9, 0, 8.5, 14, true]], { color: '#F1DAB4', depth: 3, gable: gab, scale: 0.9, bump: 1.2 }));
    const slope = Math.atan2(gab, hw / 2), panL = Math.hypot(hw / 2, gab) + 3.2;
    for (const s of [-1, 1]) {
      const pan = new T.Group();
      const pb = mesh(new T.BoxGeometry(panL, 1.6, 10.5), wool('#C65E3C', 'knit', { scale: 0.8 }));
      scaleUV(pb.geometry, panL, 10.5);
      pan.add(pb);
      // les tuiles rondes, en côtes de laine
      for (let k = 0; k < 7; k++) { const zz = -4.4 + k * 1.47; pan.add(mesh(yarnGeo([[-panL / 2 + 0.3, 1.05, zz], [panL / 2 - 0.3, 1.05, zz]], 0.5, { radial: 6 }), wool('#D8714A', 'yarn'))); }
      pan.position.set(s * (hw / 4 + 0.45), hh + gab / 2 + 0.75, -1.8);
      pan.rotation.z = -s * slope;
      built.add(pan);
    }
    const chim = mesh(new T.BoxGeometry(4, 8, 4), wool('#B45A40', 'knit', { scale: 0.6 }));
    at(chim, -9, hh + 9.5, -3.5);
    built.add(chim);
    const side = mesh(new T.BoxGeometry(2.5, hh, 16), wool('#DCC29A', 'knit', { scale: 0.9 }));
    at(side, -hw / 2 + 1.2, hh / 2, -9.6);
    built.add(side);
    // l'intérieur, chaud, derrière la fenêtre
    const room = mesh(new T.BoxGeometry(12.5, 11.5, 11), wool('#6E3A26', 'knit', { scale: 0.7, side: T.BackSide }), { cast: false });
    at(room, -6, 19.4, -6.6);
    built.add(room);
    // cadre de fenêtre et rebord
    const frSh = roundRectShape(14.2, 13.2, 0.7);
    frSh.holes.push(roundRectShape(12, 11, 0.3));
    const frame = mesh(feltGeo(frSh, 0.7, { bevel: 0.2 }), wool('#FBF5EA', 'felt'));
    at(frame, -6, 19.1, 1.6);
    built.add(frame);
    const sill = mesh(new T.BoxGeometry(20, 1.2, 5.2), wool('#E6D2AE', 'knit', { scale: 0.6 }));
    at(sill, -6, 13.0, 2.2);
    built.add(sill);
    // la porte ronde en haut, bleue comme les volets
    const door = mesh(feltGeo(polyShape([[0, 0], [8.4, 0], [8.4, 9.8], [7.8, 12.1], [6.1, 13.6], [4.2, 14.1], [2.3, 13.6], [0.6, 12.1], [0, 9.8]]), 1.1), wool('#4C7DB8', 'knit', { scale: 0.6 }));
    at(door, 9 - 4.2, 0, 0.3);
    built.add(door);
    const knob = bead(0.5, '#E3B54E');
    at(knob, 11.6, 6.8, 1.0);
    built.add(knob);
    house.add(bake(built));
    // rideau de dentelle (brise-bise froncé)
    const curG = new T.PlaneGeometry(11.6, 5.2, 22, 1);
    { const cp = curG.attributes.position; for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 2.4) * 0.25); curG.computeVertexNormals(); }
    const curtain = mesh(curG, wool('#FFFDF6', 'weave', { scale: 0.7, side: T.DoubleSide }), { cast: false });
    at(curtain, -6, 16.7, -0.2);
    house.add(curtain);
    // le torchon à carreaux sur le rebord
    const clothG = (() => {
      const nx = 10, nz = 7, W = 15.5, D = 5.2, drop = 2.3, pos = [], cs = [], uv = [];
      const red = col('#D5463E'), pink = col('#EDA9A0'), white = col('#FBF4EA');
      const Pt = (i, j) => { const x = -W / 2 + (i / nx) * W, zz = (j / nz) * (D + drop); return zz <= D ? [x, 0, -D / 2 + zz] : [x, -(zz - D), D / 2 + 0.06]; };
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const c = i % 2 && j % 2 ? red : i % 2 || j % 2 ? pink : white;
        const a = Pt(i, j), b = Pt(i + 1, j), cc = Pt(i + 1, j + 1), d = Pt(i, j + 1);
        for (const vv of [a, d, cc, a, cc, b]) { pos.push(vv[0], vv[1], vv[2]); cs.push(c.r, c.g, c.b); uv.push(vv[0] + 8, vv[2] - vv[1]); }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      return g;
    })();
    const clothM = wool('#FFFFFF', 'weave', { scale: 0.8 }).clone();
    clothM.vertexColors = true;
    clothM.side = T.DoubleSide;
    const cloth = mesh(clothG, clothM, { cast: false });
    at(cloth, -9.5, 13.64, 2.2);
    house.add(cloth);
    // les pains : deux miches et deux baguettes, en feutrine dorée
    const breads = new T.Group();
    const score = (pts) => yarnGeo(pts, 0.13, { radial: 5, maxSeg: 8 });
    const marks = [];
    const miche = (x, z, r, cross) => {
      const ry = r * 0.62;
      const b = woolBall(r, '#C7843E', 'felt', { sy: 0.62, seed: 3 + x, fuzz: false, seg: 20 });
      at(b, x, 13.65 + ry * 0.12, z);
      breads.add(b);
      const yS = (xx, zz) => 13.65 + ry * 0.12 + ry * Math.sqrt(Math.max(0, 1 - (xx / r) ** 2 - (zz / r) ** 2)) + 0.05;
      if (cross) {
        marks.push(score([-0.72, -0.36, 0, 0.36, 0.72].map((u) => [x + u * r, yS(u * r, 0), z])));
        marks.push(score([-0.72, -0.36, 0, 0.36, 0.72].map((u) => [x, yS(0, u * r), z + u * r])));
      } else for (const dz of [-0.45, 0, 0.45]) marks.push(score([-0.55, 0, 0.55].map((u) => [x + u * r + dz * 0.4, yS(u * r, dz * r), z + dz * r])));
    };
    miche(-13.2, 3.2, 2.0, true);
    miche(-8.6, 3.3, 1.75, false);
    breads.add(mesh(mergeGeos(marks), wool('#EEC786', 'yarn'), { cast: false }));
    // baguettes : les grignes sont cousues dans le repère de chaque pain
    const baguette = (c, len, seed) => {
      const b = woolBall(1, c, 'felt', { sx: len, sy: 0.72, sz: 0.85, seed, fuzz: false, seg: 20 });
      const gm = [];
      for (let i = 0; i < 5; i++) {
        const xx = -len * 0.7 + i * len * 0.35, ys = (zz) => 0.72 * Math.sqrt(Math.max(0, 1 - (xx / len) ** 2 - (zz / 0.85) ** 2)) + 0.05;
        gm.push(score([[xx - 0.5, ys(-0.3), -0.3], [xx, ys(0), 0], [xx + 0.5, ys(0.3), 0.3]]));
      }
      b.add(mesh(mergeGeos(gm), wool('#EEC786', 'yarn'), { cast: false }));
      return b;
    };
    const bag = baguette('#D49A4B', 4.3, 8);
    at(bag, -2.4, 13.65 + 0.6, 3.6);
    bag.rotation.y = 0.08;
    breads.add(bag);
    const bag2 = baguette('#CF9445', 4.1, 9);
    at(bag2, 3.1, 13.65 + 3.9, 3.9);
    bag2.rotation.set(-0.16, 0, Math.PI / 2 - 0.1);
    breads.add(bag2);
    house.add(bake(breads));
    // les volets (fermés au début) avec leur cœur découpé
    const heartAt = (w, cx, cy) => {
      const s = new T.Path(), k = w / 2;
      s.moveTo(cx, cy - k * 0.95);
      s.bezierCurveTo(cx - k * 0.5, cy - k * 0.5, cx - k * 1.15, cy - k * 0.1, cx - k, cy + k * 0.45);
      s.bezierCurveTo(cx - k * 0.85, cy + k * 0.95, cx - k * 0.2, cy + k, cx, cy + k * 0.55);
      s.bezierCurveTo(cx + k * 0.2, cy + k, cx + k * 0.85, cy + k * 0.95, cx + k, cy + k * 0.45);
      s.bezierCurveTo(cx + k * 1.15, cy - k * 0.1, cx + k * 0.5, cy - k * 0.5, cx, cy - k * 0.95);
      return s;
    };
    const shutters = [-1, 1].map((s) => {
      const piv = new T.Group();
      at(piv, -6 + s * 6, 19.1, 0.95);
      const sh = roundRectShape(5.9, 11, 0.4);
      sh.holes.push(heartAt(2.2, 0, 2.4));
      const pan = feltPiece(sh, '#4C7DB8', { depth: 0.7, inset: 0.45, stitch: '#A9C4E8', st: { len: 0.4, gap: 0.25, r: 0.06 } });
      at(pan, -s * 2.95, 0, 0);
      piv.add(pan);
      house.add(piv);
      return piv;
    });
    const roomLight = practical(V, [HX - 6, 21, HZ - 4], '#FFB062', 60, 30);

    /* ---------- les capucines : feuilles rondes, fleurs qui s'ouvrent ---------- */
    const R = rng(17);
    // feuille ronde un peu creusée (grille polaire, deux faces)
    const leafGeo = (() => {
      const NR = 4, NS = 22, pos = [0, 0, 0], uv = [0, 0], idx = [];
      for (let i = 1; i <= NR; i++) for (let j = 0; j < NS; j++) {
        const a = (j / NS) * TAU, rr = i / NR, wob = 1 + 0.06 * Math.sin(a * 5 + 0.7) + 0.03 * Math.sin(a * 11);
        const x = Math.cos(a) * rr * wob, y = Math.sin(a) * rr * wob;
        pos.push(x, y, 0.24 * rr * rr + 0.03 * Math.sin(a * 7) * rr);
        uv.push(x * 2.4, y * 2.4);
      }
      for (let j = 0; j < NS; j++) idx.push(0, 1 + j, 1 + ((j + 1) % NS));
      for (let i = 1; i < NR; i++) for (let j = 0; j < NS; j++) {
        const a = 1 + (i - 1) * NS + j, b = 1 + (i - 1) * NS + ((j + 1) % NS), c = 1 + i * NS + j, d = 1 + i * NS + ((j + 1) % NS);
        idx.push(a, c, b, b, c, d);
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    })();
    const veinGeo = (() => {
      const L = [];
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU + 0.2, pts = [];
        for (let i = 0; i <= 3; i++) { const rr = 0.06 + (i / 3) * 0.74; pts.push([Math.cos(a) * rr, Math.sin(a) * rr, 0.24 * rr * rr + 0.03]); }
        L.push(yarnGeo(pts, 0.022, { radial: 3, maxSeg: 4 }));
      }
      return mergeGeos(L);
    })();
    const LEAVES = [], FLW = [], stems = [];
    const dirQ = (d, spin) => new T.Quaternion().setFromUnitVectors(ZA, d.clone().normalize()).multiply(new T.Quaternion().setFromAxisAngle(ZA, spin));
    const addLeaf = (p, d, s, anchor) => {
      LEAVES.push({ p, q: dirQ(d, R() * TAU), s, c: col(['#5E9E43', '#6CAB4B', '#4F8E3C', '#77B455'][Math.floor(R() * 4)]).multiplyScalar(0.92 + R() * 0.12) });
      if (anchor) { const back = p.clone().add(d.clone().normalize().multiplyScalar(-0.3)); stems.push(yarnGeo([[back.x, back.y, back.z], [lerp(back.x, anchor.x, 0.5), lerp(back.y, anchor.y, 0.6) + 0.4, lerp(back.z, anchor.z, 0.5)], [anchor.x, anchor.y, anchor.z]], 0.12, { radial: 5, maxSeg: 6 })); }
    };
    const FCOL = ['#F27A1E', '#F9BE2B', '#E5532A', '#F49B22', '#D93A28', '#FAD03A'];
    const addFlower = (p, d, s, anchor) => {
      FLW.push({ p, q: dirQ(d, R() * TAU), s, c: col(FCOL[FLW.length % FCOL.length]), k: 0, kt: 0, t0: -1e9, ord: 0 });
      if (anchor) { const back = p.clone().add(d.clone().normalize().multiplyScalar(-0.5)); stems.push(yarnGeo([[back.x, back.y, back.z], [lerp(back.x, anchor.x, 0.5), lerp(back.y, anchor.y, 0.5) + 0.6, lerp(back.z, anchor.z, 0.5)], [anchor.x, anchor.y, anchor.z]], 0.13, { radial: 5, maxSeg: 6 })); }
    };
    // les tiges qui grimpent sur la barrière
    [[-62, 1], [-36, -1], [-14, 1], [6, 1], [44, -1]].forEach(([x0, dir], vi) => {
      const pts = [];
      for (let i = 0; i <= 9; i++) {
        const u = i / 9;
        const y = u < 0.45 ? (u / 0.45) * 9.6 : 9.6 + Math.sin(u * 13) * 0.7;
        const x = x0 + dir * (u < 0.45 ? u * 9 : 4 + (u - 0.45) * 40);
        pts.push(v3(x, Math.max(0.3, y), FZ + 0.75 + Math.sin(u * 17 + vi) * 0.3));
      }
      const cv = curveOf(pts);
      stems.push(yarnGeo(pts, 0.21, { radial: 6, maxSeg: 120 }));
      for (let i = 0; i < 7; i++) {
        const u = 0.1 + (i / 6) * 0.88, a = cv.getPoint(u);
        const lp = a.clone().add(v3((R() - 0.5) * 2.4, 0.6 + (R() - 0.5) * 2.6, 0.9 + R() * 0.8));
        addLeaf(lp, v3((R() - 0.5) * 0.6, 0.15 + R() * 0.4, 1), 1.45 + R() * 0.8, a);
      }
      for (let i = 0; i < 2 + (vi % 2); i++) {
        const u = 0.25 + (i / 2) * 0.62 + (R() - 0.5) * 0.08, a = cv.getPoint(Math.min(0.98, u));
        addFlower(a.clone().add(v3((R() - 0.5) * 1.5, 1.2 + R() * 1.2, 1.6)), v3((R() - 0.5) * 0.7, 0.18, 1), 0.82 + R() * 0.16, a);
      }
    });
    // le massif au pied de la barrière
    for (let i = 0; i < 12; i++) {
      const x = -84 + i * 13.5 + (R() - 0.5) * 6;
      if (x > -18 && x < 15) continue;
      const p = v3(x, 1.4 + R() * 2.2, FZ + 2.2 + R() * 2.5);
      addLeaf(p, v3((R() - 0.5) * 0.6, 0.6, 0.8), 1.8 + R() * 0.7, v3(p.x, 0, p.z - 1));
    }
    // massifs du premier plan (à gauche et à droite) et autour du pot
    const bed = (x0, x1, z0, z1, nl, nf) => {
      for (let i = 0; i < nl; i++) { const p = v3(lerp(x0, x1, R()), 1 + R() * 2.6, lerp(z0, z1, R())); addLeaf(p, v3((R() - 0.5) * 0.7, 0.85, 0.55), 2.1 + R() * 1.1, v3(p.x + (R() - 0.5) * 2, 0, p.z - 1.5)); }
      for (let i = 0; i < nf; i++) { const p = v3(lerp(x0, x1, R()), 3.4 + R() * 1.8, lerp(z0, z1, R()) + 1.5); addFlower(p, v3((R() - 0.5) * 0.7, 0.5, 0.85), 1.0 + R() * 0.2, v3(p.x, 0, p.z - 1)); }
    };
    // la bordure du premier plan, dense (floue, elle encadre la ronde)
    bed(-44, -16, 21, 34, 11, 3);
    bed(-16, 8, 25, 36, 8, 2);
    bed(8, 36, 20, 33, 11, 3);
    bed(-37, -29.5, -5, 7, 3, 1);
    bed(-18, -15, -6, -1, 2, 0);
    // ordre d'éclosion : bien mélangé dans le décor
    FLW.map((F, i) => ({ F, h: hashi(i, 41) })).sort((a, b) => a.h - b.h).forEach((e, i) => { e.F.ord = i; });

    const leafMat = wool('#FFFFFF', 'felt', { side: T.DoubleSide, sheen: 0.55, sheenColor: '#D8EEB0', scale: 0.8 });
    const leafIM = new T.InstancedMesh(leafGeo, leafMat, LEAVES.length);
    const veinIM = new T.InstancedMesh(veinGeo, wool('#FFFFFF', 'plain', { sheen: 0.4 }), LEAVES.length);
    LEAVES.forEach((L, i) => {
      m4.compose(L.p, L.q, s4.setScalar(L.s));
      leafIM.setMatrixAt(i, m4); veinIM.setMatrixAt(i, m4);
      leafIM.setColorAt(i, L.c); veinIM.setColorAt(i, lighten(L.c, 0.25));
    });
    leafIM.castShadow = true; leafIM.receiveShadow = true;
    veinIM.castShadow = false; veinIM.receiveShadow = true;
    V.add(leafIM, veinIM);
    V.add(mesh(mergeGeos(stems), wool('#5C9A3F', 'yarn')));

    // la fleur : cinq pétales de feutrine (plus sombres au cœur) et un éperon
    const petalShape = blobShape([[0, -0.05], [0.32, 0.12], [0.72, 0.75], [0.95, 1.45], [0.82, 1.98], [0.42, 2.22], [0.04, 2.08], [-0.42, 2.22], [-0.82, 1.98], [-0.95, 1.45], [-0.72, 0.75], [-0.32, 0.12]], 22);
    const petalGeo = feltGeo(petalShape, 0.16, { bevel: 0.04, bevelSeg: 1 });
    {
      const pp = petalGeo.attributes.position, pc = [];
      for (let i = 0; i < pp.count; i++) { const k = smooth((pp.getY(i) - 0.15) / 1.0); pc.push(lerp(0.66, 1, k), lerp(0.36, 1, k), lerp(0.3, 1, k)); }
      petalGeo.setAttribute('color', new T.Float32BufferAttribute(pc, 3));
    }
    const petalMat = wool('#FFFFFF', 'felt', { sheen: 0.6, sheenColor: '#FFE2B4' }).clone();
    petalMat.vertexColors = true;
    const petIM = new T.InstancedMesh(petalGeo, petalMat, FLW.length * 5);
    const cenGeo = mergeGeos([applyM(blobGeo(0.45, 0.45, 0.32, { seg: 10, lump: 0.05 }), { p: [0, 0, 0.06] }), applyM(new T.ConeGeometry(0.4, 2.3, 8), { p: [0, 0.35, -1.3], r: [-Math.PI / 2 + 0.35, 0, 0] })]);
    const cenIM = new T.InstancedMesh(cenGeo, wool('#FFFFFF', 'felt', { sheen: 0.5 }), FLW.length);
    petIM.castShadow = cenIM.castShadow = true;
    petIM.receiveShadow = cenIM.receiveShadow = true;
    petIM.frustumCulled = cenIM.frustumCulled = false;
    V.add(petIM, cenIM);
    const budC = col('#9DBA4A'), fc = new T.Color(), cc2 = new T.Color(), heartC = col('#8A2A14');
    let pulse = 0;
    const layFlowers = () => {
      FLW.forEach((F, i) => {
        const k = F.k, e = easeOutBack(k, 2.2);
        const beta = lerp(1.28, 0.34, easeOut(k));
        const sc = F.s * lerp(0.42, 1, e) * (1 + pulse * (0.05 + 0.05 * hashi(i, 3)));
        fc.copy(budC).lerp(F.c, smooth(k * 1.6));
        for (let j = 0; j < 5; j++) {
          qa.setFromAxisAngle(ZA, (j / 5) * TAU + hashi(i, j) * 0.25);
          qb.setFromAxisAngle(XA, beta + (hashi(i, j, 2) - 0.5) * 0.15);
          q4.copy(F.q).multiply(qa).multiply(qb);
          p4.set(0, 0.18 * sc, 0).applyQuaternion(q4).add(F.p);
          m4.compose(p4, q4, s4.setScalar(sc));
          petIM.setMatrixAt(i * 5 + j, m4);
          petIM.setColorAt(i * 5 + j, fc);
        }
        m4.compose(F.p, F.q, s4.setScalar(F.s * lerp(0.6, 1, k)));
        cenIM.setMatrixAt(i, m4);
        cenIM.setColorAt(i, cc2.copy(fc).lerp(heartC, 0.45 * k));
      });
      petIM.instanceMatrix.needsUpdate = cenIM.instanceMatrix.needsUpdate = true;
      petIM.instanceColor.needsUpdate = cenIM.instanceColor.needsUpdate = true;
    };

    /* ---------- herbe, cailloux, arrosoir, pot ---------- */
    const gr = grass({ n: 70, area: [-92, 72, -6, 46], colors: ['#6DB24E', '#5EA545', '#86C35E'], scale: 0.9, seed: 7 });
    gr.castShadow = false;
    V.add(gr);
    // pâquerettes semées dans la pelouse (pétales blancs, cœur jaune : couleurs dans la forme)
    const daisyGeo = (() => {
      const pts = [];
      for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, r = 0.55 + 0.45 * Math.pow(Math.abs(Math.cos(a * 4)), 0.6); pts.push(v2(Math.cos(a) * r, Math.sin(a) * r)); }
      const pg = new T.ShapeGeometry(new T.Shape(pts));
      pg.rotateX(-Math.PI / 2);
      const cg = blobGeo(0.3, 0.2, 0.3, { seg: 8, lump: 0 });
      cg.translate(0, 0.08, 0);
      const parts = [[pg, [1, 1, 1]], [cg, [1, 0.78, 0.2]]], pos = [], nrm = [], uv = [], cs = [], idx = [];
      let ov = 0;
      for (const [g, c] of parts) {
        const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
        for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nrm.push(N.getX(i), N.getY(i), N.getZ(i)); uv.push(U.getX(i), U.getY(i)); cs.push(c[0], c[1], c[2]); }
        const I = g.index;
        for (let i = 0; i < I.count; i++) idx.push(I.getX(i) + ov);
        ov += P.count;
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
      g.setIndex(idx);
      return g;
    })();
    const daisyMat = wool('#FFFFFF', 'felt', { side: T.DoubleSide, sheen: 0.4 }).clone();
    daisyMat.vertexColors = true;
    V.add(scatter(daisyGeo, daisyMat, 44, (i, r) => {
      let x = lerp(-46, 40, r()), z = lerp(-4, 38, r());
      if (Math.hypot(x - -4, z - 8) < 8) x += 16;
      return { p: [x, 0.35, z], r: [(r() - 0.5) * 0.5, r() * 3, (r() - 0.5) * 0.5], s: 0.7 + r() * 0.5, c: r() < 0.2 ? col('#F7C9D6') : col('#FFFFFF') };
    }, { cast: false }));
    V.add(scatter(blobGeo(1, 0.32, 0.8, { seg: 12, lump: 0.12, seed: 4 }), wool('#FFFFFF', 'felt', { sheen: 0.4, sheenColor: '#6A665C' }), 9, (i, r) => ({ p: [[-48, -12, 2, 14, 38, -36, 22, -2, 48][i], 0.1, [12, 16, 16, 12, 6, 30, 36, 20, -2][i]], r: [0, r() * 3, 0], s: [1.6 + r(), 1, 1.3 + r() * 0.6], c: col('#B9B2A2').multiplyScalar(0.85 + r() * 0.2) })));
    // l'arrosoir de zinc
    const can = new T.Group();
    const zinc = metalMat('#A9B9BE', { rough: 0.45 });
    can.add(mesh(latheGeo([[0, 0], [2.7, 0], [2.8, 0.3], [2.6, 5.4], [2.75, 5.6], [0, 5.7]], { seg: 22 }), zinc));
    can.add(mesh(yarnGeo([[1.6, 3.2, 0], [4.4, 5.4, 0], [6.2, 7.4, 0]], 0.38, { radial: 8 }), zinc));
    can.add(mesh(latheGeo([[0.35, 0], [1.1, 0.7], [1.15, 0.9], [0, 0.95]], { seg: 14 }), zinc).translateX(6.3).translateY(7.4).rotateZ(-0.8));
    can.add(mesh(new T.TorusGeometry(2.0, 0.28, 8, 20, Math.PI), zinc).translateY(5.6).rotateY(Math.PI / 2));
    const canSh = contactShadow(8, 7, 0.45);
    canSh.position.y = 0.15;
    can.add(canSh);
    at(can, 22, 0, 12);
    can.rotation.y = -2.5;
    V.add(bake(can));
    // le pot de terre retourné (le siège de Jeanne)
    const POT = v3(-22, 0, 3);
    const pot = new T.Group();
    pot.add(mesh(latheGeo([[3.3, 0], [3.35, 0.9], [3.0, 1.1], [2.4, 6.0], [2.2, 6.4], [0.01, 6.45]], { seg: 26, lump: 0.03 }), wool('#C66B3D', 'knit', { scale: 0.7 })));
    const potSh = contactShadow(9, 8, 0.5);
    potSh.position.y = 0.15;
    pot.add(potSh);
    at(pot, POT.x, 0, POT.z);
    V.add(bake(pot));

    /* ---------- deux papillons au bout de leur fil ---------- */
    const wingSh = blobShape([[0, 0.25], [1.2, 1.9], [2.5, 1.85], [2.6, 0.55], [1.5, -0.3], [1.85, -1.35], [0.95, -1.95], [0.2, -0.9]], 28);
    const flies = [[-19, 19, 12, '#FBF7EE', '#3A3330'], [9, 23, 5, '#F8C536', '#E0742A']].map(([x, y, z, c1, c2], i) => {
      const g = new T.Group();
      g.add(woolBall(0.3, '#3A2C24', 'crochet', { sy: 2.4, fuzz: false, seg: 10 }));
      const wings = [-1, 1].map((s) => {
        const piv = new T.Group();
        const w = felt(wingSh, c1, 0.14, { fuzz: false });
        w.scale.set(s * 0.95, 0.95, 1);
        const spot = felt(circleShape(0.42), c2, 0.16, { fuzz: false });
        at(spot, s * 1.85, 1.3, 0.04);
        piv.add(w, spot);
        g.add(piv);
        return piv;
      });
      noCast(g);
      at(g, x, y, z);
      g.rotation.x = -0.5;
      const hb = hang(g, 120, { amp: 3, per: 3.4 + i, r: 0.035 });
      V.add(hb);
      swingAnim(V, hb);
      return { g, wings, ph: i * 2.1 };
    });

    /* ---------- les enfants ---------- */
    // bras longs de poupée de chiffon : la ronde peut s'élargir
    const KH = 13, legH = KH * 0.2, bodyH = KH * 0.4, br = KH * 0.15, AL = KH * 0.27;
    const shY = legH + bodyH * 0.86, handY = legH + bodyH * 0.55;
    let R0 = 5;
    for (let r = 5; r < 9; r += 0.05) { if (Math.hypot(r / 2 - br * 0.92, handY - shY, r / 2) > AL + 0.3) break; R0 = r; }
    const RC = v3(-4, 0, 9);
    const longArms = (d, sleeves) => {
      for (const s of [-1, 1]) {
        const old = d.p[s < 0 ? 'armL' : 'armR'];
        const arm = limb(AL, KH * 0.045, sleeves, { kind: 'knit', end: { r: KH * 0.05, color: '#F3C9A6', sy: 0.9 } });
        arm.position.copy(old.position); arm.rotation.copy(old.rotation);
        old.parent.add(arm); old.parent.remove(old);
        d.p[s < 0 ? 'armL' : 'armR'] = arm;
      }
    };
    const KIDS = [
      { h: KH, top: '#2FA39B', sleeves: '#2FA39B', dress: true, collar: '#FFFFFF', legs: '#F6F0E6', shoes: '#C8372D', hair: '#6B3A1E', hairStyle: 'pigtails', ribbon: '#F5C32C', cheeks: '#F29A8A' },
      { h: KH, top: '#2E4C94', sleeves: '#2E4C94', bottom: '#D8C39A', shoes: '#4A2E1E', hair: '#E3B85C', hairStyle: 'short', fringe: false, hat: { type: 'beret', color: '#D23F3A' }, buttons: { n: 2, color: '#F5C32C' }, cheeks: '#F29A8A' },
      { h: KH, top: '#D9466E', sleeves: '#D9466E', dress: true, collar: '#FFFFFF', legs: '#F6F0E6', shoes: '#2E3C6E', hair: '#2B1D18', hairStyle: 'bun', cheeks: '#F29A8A' },
      { h: KH, top: '#F2C230', sleeves: '#F2C230', bottom: '#3A62B8', shoes: '#5A2E1E', hair: '#C2582B', hairStyle: 'short', fringe: false, hat: { type: 'cap', color: '#3A62B8' }, cheeks: '#F29A8A' },
    ].map((def, i) => {
      const d = doll(def);
      longArms(d, def.sleeves);
      slim(d.g, 2.05);
      V.add(d.g);
      V.boilable(d.g, 0.05, 0.6);
      const sh = contactShadow(5.5, 5.5, 0.4);
      sh.position.y = 0.15;
      V.add(sh);
      d.p.head.rotation.order = 'YXZ';
      return { d, i, slot: i, jk: i < 2 ? 1 : 0, jt: i < 2 ? 1 : 0, t0: -1e9, blink: blinker(d.p.eyes, 11 + i * 7), sh };
    });
    // le bras qui tient la main du voisin de ronde (calculé pour que les mains se rejoignent)
    const holdPose = (s) => {
      const shp = v3(s * br * 0.92, shY, 0);
      const mid = v3(s * R0 / 2, handY, R0 / 2);
      const d = mid.sub(shp).normalize();
      return { x: Math.atan2(-d.z, -d.y), z: Math.asin(clamp(d.x, -1, 1)) };
    };
    const HOLD = { '-1': holdPose(-1), '1': holdPose(1) };
    // en attendant : Jeanne (2) assise sur le pot, Paulo (3) qui lorgne les pains
    const WAIT = [null, null, { p: v3(POT.x, 6.6 - legH, POT.z), ry: 0.5 }, { p: v3(9, 0, -4), ry: 0.45 }];

    /* ---------- particules ---------- */
    let conf = null;
    if (!PORTRAIT) {
      pointCloud(V, { n: 70, box0: [-60, 2, -24], box1: [50, 46, 26], size: 1.0, color: '#FFE2A8', opacity: 0.45, vel: [0.35, 0.25, 0.1], wander: 2.2, beam: 0.5, keyDir: [-0.55, 0.5, 0.45] });
      pointCloud(V, { n: 26, box0: [HX - 19, 15.5, HZ + 1], box1: [HX + 1, 26, HZ + 5], size: 2.6, sprite: 'soft', color: '#FFF6EA', opacity: 0.14, vel: [0.15, 1.6, 0], wander: 0.6 });
      pointCloud(V, { n: 22, box0: [HX - 13, 42, HZ - 6], box1: [HX - 4, 70, HZ - 1], size: 5, sprite: 'soft', color: '#EFE6DA', opacity: 0.22, vel: [0.7, 2.4, 0], wander: 1.2, additive: false });
      conf = confetti(V, { kinds: ['disc', 'star', 'heart', 'leaf'], n: 30, size: 0.95 });
    }
    const PARTY = ['#F27A1E', '#F9BE2B', '#E5532A', '#5E9E43', '#FFFFFF', '#2FA39B', '#D9466E'];
    V.onHome = (c) => { if (conf) conf.burst(v3(RC.x, 9, RC.z), 9, [c, '#FFFFFF', '#F9BE2B'], 0.55, 0.55); };

    /* ---------- animation ---------- */
    let done = false, shut = 0, shutT = 0, shutT0 = -1e9, lastT = null, Dt = 0, Dc = 0, phi = 2.36, spinFrom = 0, spinAmt = 0, fired = true;
    const camAz = -7 * DEG, winP = v3(HX - 6, 19, HZ);
    V.anim((t, f) => {
      const dt = lastT == null ? 0 : clamp(t - lastT, 0, 0.5);
      lastT = t;
      // le pas de danse : il avance tout seul, ou sur chaque note pendant l'écoute
      const listening = V.age('note') < 0.9;
      if (!listening) Dt += dt * (done ? 2.4 : 2.0);
      Dc += (Dt - Dc) * Math.min(1, dt * 10);
      const spin = V.age('spin') < 1.6 ? easeInOut(V.age('spin') / 1.6) : 1;
      phi = 2.36 + Dc * 0.15 + spinFrom + spinAmt * spin;
      if (V.age('spin') >= 1.6 && spinAmt) { spinFrom += spinAmt; spinAmt = 0; }
      const ya = V.age('you');
      if (!fired && ya > 0.62) { fired = true; if (conf) { conf.burst(v3(RC.x, 12, RC.z), 46, PARTY, 1.25, 1.1); conf.burst(v3(RC.x - 8, 6, RC.z + 6), 14, PARTY, 0.8, 0.7); } }
      // fleurs
      let ch = false;
      FLW.forEach((F) => { const k = F.kt ? sat((t - F.t0) / 0.9) : 0; if (k !== F.k) { F.k = k; ch = true; } });
      const np = bump(sat(V.age('note') / 0.3));
      if (ch || np > 0 || pulse > 0) { pulse = np; layFlowers(); }
      // volets
      shut = shutT ? sat((t - shutT0) / 1.2) : 0;
      const so = easeOutBack(shut, 1.4);
      shutters[0].rotation.y = -so * 2.95;
      shutters[1].rotation.y = so * 2.95;
      curtain.visible = shut > 0.05;
      roomLight.intensity = (60 + 320 * shut) * (0.94 + hashi(f, 4) * 0.1);
      // papillons
      flies.forEach((B, i) => {
        const up = (f + i) % 2 === 0;
        const a = (up ? 1.1 : 0.25) + (done ? 0.2 : 0);
        B.wings[0].rotation.y = a; B.wings[1].rotation.y = -a;
        B.g.position.y = Math.sin(t * 1.3 + B.ph) * 1.2;
        B.g.rotation.y = Math.sin(t * 0.4 + B.ph) * 0.6;
      });
      // les enfants
      const hopAll = sat(V.age('hop') / 0.5);
      for (const K of KIDS) {
        const d = K.d, g = d.g, Pp = d.p;
        K.blink(t, f);
        K.jk = K.jt ? sat((t - K.t0) / 1.15) : 0;
        const th = phi + (K.slot * Math.PI) / 2;
        const rx = RC.x + R0 * Math.sin(th), rz = RC.z + R0 * Math.cos(th), rr = th + Math.PI;
        const W = WAIT[K.i];
        const k = K.jk, e = easeInOut(k);
        const inRing = k >= 1;
        // pas de danse : petits sauts en cadence
        const step = Math.abs(Math.sin(Math.PI * Dc + K.i * 0.12));
        let x, y, z, ry;
        if (inRing || !W) { x = rx; z = rz; y = 0; ry = rr; } else { x = lerp(W.p.x, rx, e); z = lerp(W.p.z, rz, e); y = lerp(W.p.y, 0, e) + bump(k) * 5.5; ry = lerpA(W.ry, rr, e); }
        let hy = inRing ? step * (done ? 1.1 : 0.6) : 0;
        hy += bump(hopAll) * 2.8 * (inRing ? 1 : 0.4);
        let sy = 1 + 0.05 * step - (inRing ? 0.08 * Math.pow(1 - step, 6) : 0), sx = 1;
        // « You ! » : on s'accroupit, puis on bondit
        let up = 0, low = 0;
        if (ya < 1.6) {
          if (ya < 0.45) { low = smooth(ya / 0.45); sy = 1 - 0.27 * low; sx = 1 + 0.13 * low; hy = 0; }
          else if (ya < 1.25) { const kk = (ya - 0.45) / 0.8; hy = Math.sin(Math.PI * kk) * 9; sy = 1 + 0.16 * bump(Math.min(1, kk * 1.6)); sx = 1 - 0.05 * bump(Math.min(1, kk * 1.6)); up = 1; }
          else { const kk = (ya - 1.25) / 0.35; sy = 1 - 0.14 * bump(kk); sx = 1 + 0.07 * bump(kk); up = 1 - kk; }
        }
        g.position.set(x, y + hy, z);
        g.rotation.set(0, ry, 0);
        g.scale.set(sx, sy, sx);
        K.sh.position.set(x, 0.15, z);
        K.sh.scale.setScalar(1 - Math.min(0.6, (y + hy) * 0.06));
        Pp.body.rotation.z = inRing ? Math.sin(Math.PI * Dc) * 0.06 : 0;
        // tête : vers la caméra quand c'est possible
        const rel = Math.atan2(Math.sin(camAz - ry), Math.cos(camAz - ry));
        let hyaw = Math.sin(rel) * 0.7, hpitch = 0.04 + Math.sin(t * 0.9 + K.i) * 0.04;
        // bras : on tient la main des voisins présents, sinon on fait signe
        const nb = (s) => { const j = (K.slot + (s < 0 ? 1 : 3)) % 4; return KIDS.find((q) => q.slot === j); };
        const arm = (s) => {
          const n = nb(s), hk = n ? easeInOut(n.jk) : 0;
          const wave = { x: -0.25, z: s * (2.35 + 0.32 * Math.sin(t * 9 + K.i * 2)) };
          const H = HOLD[s];
          return { x: lerp(wave.x, H.x, hk), z: lerp(wave.z, H.z, hk) };
        };
        let aL = arm(-1), aR = arm(1), lx = 0;
        if (!inRing && W) {
          // la pose d'attente se mélange à la pose de ronde pendant le saut
          let wl, wr, legX = 0;
          if (K.i === 2) {
            const clap = bump(sat(V.age('note') / 0.25)) + (V.age('note') > 0.9 ? 0.5 + 0.5 * Math.sin(t * 7) : 0);
            const cz = Math.asin((br * 0.92) / AL);
            wl = { x: -1.25, z: lerp(cz * 0.62, cz * 1.02, sat(clap)) }; wr = { x: -1.25, z: -lerp(cz * 0.62, cz * 1.02, sat(clap)) };
            legX = -1.4 + Math.sin(t * 5) * 0.25;
            hyaw = 0.35 + Math.sin(t * 0.7) * 0.25;
          } else {
            const look = Math.sin(t * 0.8) > -0.3;
            wl = { x: -0.2, z: -0.25 }; wr = { x: 2.5 + Math.sin(t * 3) * 0.08, z: 0.65 };
            hyaw = look ? 1.05 : -0.45; hpitch = look ? -0.5 : 0.05;
            const tip = 0.35 + 0.35 * Math.abs(Math.sin(t * 2.2)) + bump(sat(V.age('note') / 0.3)) * 0.6;
            g.position.y += tip * (1 - e);
          }
          aL = { x: lerp(wl.x, aL.x, e), z: lerp(wl.z, aL.z, e) };
          aR = { x: lerp(wr.x, aR.x, e), z: lerp(wr.z, aR.z, e) };
          lx = legX * (1 - e);
          hyaw = lerp(hyaw, Math.sin(rel) * 0.7, e);
        }
        // le petit Paulo jette encore un œil aux pains, de temps en temps
        if (K.i === 3 && inRing && hashi(Math.floor(t / 2.5), 7) < 0.3) {
          const wd = Math.atan2(winP.x - x, winP.z - z), wr2 = Math.atan2(Math.sin(wd - ry), Math.cos(wd - ry));
          hyaw = clamp(wr2, -1.1, 1.1); hpitch = -0.3;
        }
        if (up > 0 || low > 0) {
          aL = { x: lerp(aL.x, low > 0 ? 0.5 : -0.2, Math.max(up, low)), z: lerp(aL.z, low > 0 ? -0.35 : -2.85, Math.max(up, low)) };
          aR = { x: lerp(aR.x, low > 0 ? 0.5 : -0.2, Math.max(up, low)), z: lerp(aR.z, low > 0 ? 0.35 : 2.85, Math.max(up, low)) };
          hpitch -= 0.25 * up;
        }
        Pp.armL.rotation.set(aL.x, 0, aL.z);
        Pp.armR.rotation.set(aR.x, 0, aR.z);
        Pp.legL.rotation.x = lx + (inRing ? Math.sin(Math.PI * Dc) * 0.25 : 0);
        Pp.legR.rotation.x = lx - (inRing ? Math.sin(Math.PI * Dc) * 0.25 : 0);
        Pp.head.rotation.set(hpitch, hyaw, Math.sin(t * 1.1 + K.i) * 0.05);
      }
    });

    layFlowers();
    return {
      update(st, first) {
        const ph = st.phrasesDone || 0, t1 = first ? -1e9 : V.now + 1 / FPS;
        // une bascule 0 → 1 note l'heure du départ de l'animation (les animations se calculent sur le temps)
        const flip = (obj, key, on, tkey) => { const v = on ? 1 : 0; if (obj[key] !== v || first) { if (v && (!obj[key] || first)) obj[tkey] = t1; obj[key] = v; } };
        flip(KIDS[2], 'jt', ph >= 1 || st.done, 't0');
        flip(KIDS[3], 'jt', ph >= 2 || st.done, 't0');
        const sw = { v: shutT, t: shutT0 };
        flip(sw, 'v', ph >= 3 || st.done, 't');
        shutT = sw.v; shutT0 = sw.t;
        const nOpen = st.done ? FLW.length : Math.min(FLW.length, 3 + Math.round((FLW.length - 3) * st.p));
        FLW.forEach((F) => flip(F, 'kt', F.ord < nOpen, 't0'));
        if (first) { KIDS.forEach((K) => { K.jk = K.jt; }); shut = shutT; FLW.forEach((F) => { F.k = F.kt; }); layFlowers(); }
        done = !!st.done;
      },
      react(kind) {
        if (kind === 'correct') V.cue('hop');
        if (kind === 'phrase') {
          const k = V.age('spin') < 1.6 ? easeInOut(V.age('spin') / 1.6) : 1;
          spinFrom += spinAmt * k; spinAmt = spinAmt * (1 - k) + Math.PI / 2;
          V.cue('hop'); V.cue('spin'); Dt += 3;
        }
        if (kind === 'complete') { V.cue('you'); fired = false; }
      },
      note(n, on) {
        if (!on) return;
        Dt += 1;
        V.cue('note');
      },
    };
  },
};
