/* ============ Dodo, l'enfant do : la chambre du bébé, la nuit ============
   Les étoiles du mobile s'allument une à une, la lumière s'adoucit et des
   « Z » de feutrine montent du berceau ; à chaque phrase le mobile fait un
   tour et le berceau se balance ; à la fin, sommeil profond (même l'ours
   s'endort), lueur dorée et étincelles. Pendant l'écoute, le berceau se
   balance en rythme. */
SCENES.dodo = {
  color: '#2A2B5E',
  view: {
    bg: '#100E2A', fov: 26,
    rig: { target: [0, 22, 0], az: 4, el: 12, box: [66, 50], targetWide: [0, 22.5, 0], boxWide: [104, 47] },
    post: { exposure: 1.08, bloom: 0.75, bloomThr: 0.95, aper: 6, maxBlur: 10, sat: 1.1, lift: '#030214', vignette: 0.48, punch: 1.3 },
  },
  sky: [-38, 38, 37, 46, -17, -5],
  home: [4, 40, -1],
  flock: 6,
  build(V, o) {
    const P = !!o.portrait;
    // les petites pièces ne portent ni duvet ni ombre (économie d'appels de dessin)
    const lite = (root, fz = 0.9, cs = 0.7) => {
      const kill = [];
      root.traverse((m) => {
        if (!m.isMesh || m.userData.isFuzz) return;
        const g = m.geometry;
        if (!g.boundingSphere) g.computeBoundingSphere();
        const r = g.boundingSphere.radius;
        if (r < cs) m.castShadow = false;
        if (r < fz) m.children.forEach((c) => { if (c.userData.isFuzz) kill.push(c); });
      });
      kill.forEach((c) => c.parent.remove(c));
      return root;
    };
    const noCast = (root) => { root.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return root; };
    // cyclo() rend un drap aux faces tournées vers le fond (invisible depuis la caméra) : on retourne ses triangles
    const facing = (m) => { const ix = m.geometry.index; for (let i = 0; i < ix.count; i += 3) { const b = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, b); } ix.needsUpdate = true; m.geometry.computeVertexNormals(); return m; };
    const halo = (size, color, k) => new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: sprite('soft'), color: col(color).multiplyScalar(k), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    // rideau plissé (jersey), resserré par une embrasse à la hauteur `tie` (0..1)
    const drape = (W, H, folds, color, side, tie) => {
      const g = new T.PlaneGeometry(W, H, folds * 8, 26);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const u = p.getX(i) / W + 0.5, v = p.getY(i) / H + 0.5;
        const k = Math.exp(-((v - tie) ** 2) / 0.03) * 0.5 + (v < tie ? (tie - v) * 0.25 : 0);
        const uo = side < 0 ? u * (1 - k) : 1 - (1 - u) * (1 - k);
        const z = Math.sin(u * folds * TAU) * (0.9 + k * 1.6) * (0.75 + 0.25 * v) + (v < 0.06 ? (0.06 - v) * 8 * Math.sin(u * folds * TAU + 1) : 0);
        p.setXYZ(i, (uo - 0.5) * W, p.getY(i), z);
      }
      g.computeVertexNormals();
      scaleUV(g, W, H);
      return mesh(g, wool(color, 'knit', { scale: 0.55, side: T.DoubleSide }));
    };

    // ---------- la lumière : clair de lune lavande, veilleuse orangée ----------
    const L = studioLights(V, {
      key: { color: '#C2C6FF', k: 1.5, az: -40, el: 44, area: 60 },
      fill: { sky: '#404890', ground: '#3A2430', k: 0.6 },
      rim: { color: '#A9B2FF', k: 1.1, az: 160, el: 30 },
      env: { sky: '#2E356E', ground: '#2A1A24', k: 0.45, boxK: 2.5 },
    });
    // une lumière douce et chaude sur le bébé (le héros est toujours éclairé)
    const babyL = practical(V, [-8, 27, 18], '#FFD3A6', 70, 34);

    // ---------- dehors, derrière la fenêtre ----------
    V.add(facing(cyclo({ w: 260, h: 150, z: -84, r: 24, floor: 10, top: '#080B2E', mid: '#151F5A', bottom: '#2A3A82', scale: 3 })));
    const hills = flatLayer(hillShape(150, 12, 4, 7), '#1C2659', { depth: 1, inset: 1, stitch: '#34448E' });
    at(hills, -24, 14, -58);
    V.add(noCast(hills));
    const mn = moon({ r: 5.4, color: '#F6EBC0', stitch: '#D2BE72' });
    // un œil endormi et une joue sur le croissant
    mn.add(yarn([[-3.6, 1.1, 1.2], [-2.7, 0.5, 1.35], [-1.8, 1.1, 1.2]], 0.16, '#6A5530', { radial: 5 }));
    const mch = felt(circleShape(0.75), '#EFB08F', 0.12, { fuzz: false }); at(mch, -2.9, -1.0, 1.15); mn.add(mch);
    at(mn, -30, 41, -62);
    const hmn = hang(noCast(mn), 120, { amp: 1.2, per: 6 });
    V.add(hmn); swingAnim(V, hmn);
    const mhalo = halo(34, '#6E80DA', 0.6);
    at(mhalo, -30, 41, -66);
    V.add(mhalo);
    [[-38, 47, 1.3], [-21, 45.5, 1.0], [-25, 33, 0.8]].forEach(([x, y, r], i) => {
      const s = star({ r, color: '#FFE38A', stitch: '#D9A740' });
      at(s, x, y, -60 + i);
      const h = hang(noCast(s), 120, { amp: 2, per: 3 + i });
      V.add(h); swingAnim(V, h);
    });

    // ---------- la chambre ----------
    const WALLZ = -26;
    const wall = wallPanel(250, 112, [[-26, 24, 20, 26, true]], { color: '#7C88CE', depth: 3, scale: 0.9, bump: 1.2 });
    at(wall, 0, 0, WALLZ);
    wall.castShadow = false;
    wall.material = wall.material.clone();
    wall.material.sheen = 0.3;
    V.add(wall);
    // papier peint : petites étoiles de feutrine
    const wsGeo = feltGeo(starShape(1.25, 0.5, 5, 0.3), 0.2, { bevel: 0, curve: 3 });
    const wsPts = [];
    for (let j = 0; j < 9; j++) for (let i = 0; i < 20; i++) {
      const x = -95 + i * 10 + (j % 2) * 5, y = 27 + j * 8.5;
      if (x > -42 && x < -10 && y < 60) continue;
      wsPts.push([x + (hashi(i, j, 1) - 0.5) * 3, y + (hashi(i, j, 2) - 0.5) * 3]);
    }
    V.add(scatter(wsGeo, wool('#FFFFFF', 'felt', { sheen: 0.3, sheenColor: '#4A5290' }), wsPts.length, (i, r) => ({
      p: [wsPts[i][0], wsPts[i][1], WALLZ + 1.62], r: [0, 0, r() * 1.3], s: 0.8 + r() * 0.5, c: new T.Color().setHSL(0.62 + r() * 0.04, 0.6, 0.8 + r() * 0.06),
    }), { cast: false }));
    // soubassement tricoté et cimaise de bois
    const dado = mesh(new T.BoxGeometry(250, 21, 1), wool('#D9A2AE', 'knit', { scale: 0.8, sheen: 0.35 }));
    scaleUV(dado.geometry, 250, 21);
    at(dado, 0, 10.5, WALLZ + 2);
    dado.castShadow = false;
    V.add(dado);
    const whiteWood = woodMat('#F1E8DA', { rough: 0.55 });
    const trim = [];
    trim.push(applyM(new T.BoxGeometry(250, 1.6, 1.8), { p: [0, 21.6, WALLZ + 2.4] }));
    trim.push(applyM(new T.BoxGeometry(250, 2.4, 1.6), { p: [0, 1.2, WALLZ + 2.6] }));
    // la fenêtre : cadre cintré, croisillons, appui
    const fr = new T.Shape();
    fr.moveTo(-12, -1.6); fr.lineTo(12, -1.6); fr.lineTo(12, 16); fr.absarc(0, 16, 12, 0, Math.PI, false); fr.lineTo(-12, -1.6);
    const frh = new T.Path();
    frh.moveTo(-10, 0); frh.lineTo(10, 0); frh.lineTo(10, 16); frh.absarc(0, 16, 10, 0, Math.PI, false); frh.lineTo(-10, 0);
    fr.holes.push(frh);
    trim.push(applyM(feltGeo(fr, 2.2, { bevel: 0.4, curve: 24 }), { p: [-26, 24, WALLZ + 1.9] }));
    trim.push(applyM(new T.BoxGeometry(0.9, 26, 1.2), { p: [-26, 37, WALLZ + 1.4] }));
    trim.push(applyM(new T.BoxGeometry(20, 0.9, 1.2), { p: [-26, 37, WALLZ + 1.4] }));
    trim.push(applyM(new T.BoxGeometry(27, 1.5, 5), { p: [-26, 23.2, WALLZ + 3.2] }));
    // tringle
    trim.push(applyM(new T.CylinderGeometry(0.45, 0.45, 46, 10), { p: [-26, 55.5, WALLZ + 4], r: [0, 0, Math.PI / 2] }));
    trim.push(applyM(new T.SphereGeometry(1.1, 12, 8), { p: [-49.5, 55.5, WALLZ + 4] }));
    trim.push(applyM(new T.SphereGeometry(1.1, 12, 8), { p: [-2.5, 55.5, WALLZ + 4] }));
    V.add(mesh(mergeGeos(trim), whiteWood));
    // rideaux moutarde
    for (const s of [-1, 1]) {
      const c = drape(15, 36, 4, '#DDA23E', s, 0.42);
      at(c, -26 + s * 15.5, 55 - 18, WALLZ + 3.3);
      V.add(c);
      const tie = mesh(new T.TorusGeometry(2.6, 0.45, 6, 18), wool('#F4B8C6', 'yarn'));
      tie.rotation.x = Math.PI / 2;
      at(tie, -26 + s * (15.5 + s * 3.2), 55 - 36 * 0.58, WALLZ + 3.6);
      tie.scale.set(1, 1.6, 1);
      V.add(tie);
    }
    // guirlande de fanions
    const flagGeo = feltGeo(polyShape([[-2.1, 0], [2.1, 0], [0, -4.8]]), 0.26, { bevel: 0.08, bevelSeg: 1 });
    const bunt = [];
    for (let i = 0; i <= 26; i++) { const x = -78 + i * 6; bunt.push([x, 63 - 4 * Math.abs(Math.sin(((x + 78) / 78) * Math.PI)), WALLZ + 2.4]); }
    V.add(noCast(yarn(bunt, 0.14, '#EFE4D2', { radial: 5 })));
    const fcols = ['#F4A7B9', '#A8DCC8', '#FFE29A', '#C7B3F0', '#9CCBF2'];
    V.add(scatter(flagGeo, wool('#FFFFFF', 'felt', { sheen: 0.4, sheenColor: '#555577' }), bunt.length - 2, (i, r) => {
      const q = bunt[i + 1];
      return { p: [q[0], q[1] - 0.2, q[2] + 0.2], r: [0.05, 0, (r() - 0.5) * 0.25], c: fcols[i % fcols.length] };
    }, { cast: false }));

    // le sol : parquet tricoté (miel) et tapis ovale au crochet
    V.add(terrain({ w: 260, d: 140, nx: 30, nz: 20, colors: ['#B48760', '#A47A55', '#BE916A'], bands: 7, rough: 0.2, scale: 1.6 }));
    [[30, '#93CDB4', 0.3], [24, '#F6E7CB', 0.36], [18, '#EFA3B5', 0.42], [11, '#F6E7CB', 0.48]].forEach(([r, c, y]) => {
      const g = new T.CylinderGeometry(r, r, 0.4, 48);
      scaleUV(g, r * 2, r * 2);
      const d = mesh(g, wool(c, 'crochet', { scale: 1.1 }), { cast: false });
      d.scale.z = 0.6;
      at(d, 1, y, 5);
      V.add(d);
    });

    // ---------- le berceau à bascule ----------
    const RR = 50;
    const rockG = new T.Group();
    at(rockG, 0, RR, 0);
    V.add(rockG);
    const cradle = new T.Group();
    cradle.position.y = -RR;
    rockG.add(cradle);
    const wood = [];
    // patins
    const rk = [];
    for (let i = 0; i <= 20; i++) { const x = -21 + i * 2.1; rk.push([x, RR - Math.sqrt(RR * RR - x * x)]); }
    rk.push([21.9, RR - Math.sqrt(RR * RR - 441) + 1.3]);
    for (let i = 20; i >= 0; i--) { const x = -21 + i * 2.1; rk.push([x * 0.99, RR - Math.sqrt(RR * RR - x * x) + 2.5]); }
    rk.push([-21.9, RR - Math.sqrt(RR * RR - 441) + 1.3]);
    const rockSh = blobShape(rk, 90);
    for (const z of [-6.5, 6.5]) wood.push(applyM(feltGeo(rockSh, 1.6, { bevel: 0.4 }), { p: [0, 0, z] }));
    // fond, côtés, tête (cœur ajouré) et pied
    wood.push(applyM(new T.BoxGeometry(34, 1.4, 16.4), { p: [0, 3.2, 0] }));
    const side = (top, dip) => {
      const s = new T.Shape();
      s.moveTo(-17, 2.5); s.lineTo(17, 2.5); s.lineTo(17, top - 1.2);
      s.quadraticCurveTo(17, top, 15.8, top);
      s.quadraticCurveTo(0, dip, -15.8, top);
      s.quadraticCurveTo(-17, top, -17, top - 1.2);
      s.lineTo(-17, 2.5);
      return feltGeo(s, 1.2, { bevel: 0.35, curve: 16 });
    };
    wood.push(applyM(side(11.4, 8.4), { p: [0, 0, 8.4] }));
    wood.push(applyM(side(14.4, 11.6), { p: [0, 0, -8.4] }));
    const end = (h, heart) => {
      const s = new T.Shape();
      s.moveTo(-9, 2.5); s.lineTo(9, 2.5); s.lineTo(9, h); s.absarc(0, h, 9, 0, Math.PI, false); s.lineTo(-9, 2.5);
      if (heart) { const hp = heartShape(5.4).getPoints(20).map((q) => v2(q.x, q.y + h - 1)); s.holes.push(new T.Path(hp)); }
      return feltGeo(s, 1.4, { bevel: 0.4, curve: 20 });
    };
    wood.push(applyM(end(14, true), { p: [-17.6, 0, 0], r: [0, Math.PI / 2, 0] }));
    wood.push(applyM(end(9, false), { p: [17.6, 0, 0], r: [0, Math.PI / 2, 0] }));
    // montants et pommeaux
    for (const x of [-17.6, 17.6]) for (const z of [-8.6, 8.6]) {
      const hh = x < 0 ? 17.5 : 12.6;
      wood.push(applyM(new T.CylinderGeometry(0.75, 0.85, hh - 2, 10), { p: [x, 2 + (hh - 2) / 2, z] }));
      wood.push(applyM(new T.SphereGeometry(1.25, 12, 9), { p: [x, hh + 0.7, z] }));
    }
    cradle.add(mesh(mergeGeos(wood), woodMat('#CF9359', { rough: 0.5 })));
    // matelas, oreiller, couverture tricotée
    const matt = mesh(new T.BoxGeometry(33, 3, 15.4), wool('#F5EADB', 'knit', { scale: 0.6 }), { cast: false });
    at(matt, 0, 5.2, 0);
    cradle.add(matt);
    const pillow = woolBall(1, '#FFFDF6', 'crochet', { sx: 6.0, sy: 2.6, sz: 7.4, seed: 4, fuzz: 0.1, seg: 22 });
    at(pillow, -11.4, 9.6, 0.3);
    pillow.rotation.z = 0.14;
    cradle.add(pillow);
    const blanket = woolBall(1, '#F29AB0', 'knit', { sx: 12.4, sy: 3.7, sz: 7.7, seed: 7, fuzz: 0.12, seg: 26, mat: { scale: 0.6 } });
    at(blanket, 4.6, 9.0, 0.2);
    cradle.add(blanket);
    const cuff = woolBall(1, '#FFF3DE', 'crochet', { sx: 2.3, sy: 3.4, sz: 7.9, seed: 8, fuzz: 0.1, seg: 20 });
    at(cuff, -5.2, 10.0, 0.2);
    cuff.rotation.z = -0.25;
    cradle.add(cuff);
    // le bébé : grosse tête ronde, bonnet rose, yeux brodés fermés
    const baby = new T.Group();
    const BY = 14.6;
    at(baby, -10.2, BY, 1.8);
    cradle.add(baby);
    const head = new T.Group();
    head.rotation.set(-0.2, 0.18, 0.5);
    baby.add(head);
    const BR = 4.6;
    head.add(woolBall(BR, '#F8D5BE', 'crochet', { sy: 0.96, sz: 0.94, seed: 2, fuzz: 0.05, seg: 26 }));
    faceOn(head, [BR, BR * 0.96, BR * 0.94], { sleep: true, cheeks: '#F59A9E', eyeR: BR * 0.12, spread: 25, eyeY: 2, mouthY: -22, mouthW: 8, ink: '#5A3426' });
    const nose = woolBall(BR * 0.1, '#EDB89C', 'crochet', { fuzz: false, seg: 10 });
    at(nose, 0, -BR * 0.12, BR * 0.94);
    head.add(nose);
    const bonnet = woolBall(BR * 1.1, '#F8C3D0', 'knit', { sy: 1.02, seed: 6, fuzz: 0.12, seg: 24, mat: { scale: 0.42 } });
    at(bonnet, 0, BR * 0.14, -BR * 0.36);
    head.add(bonnet);
    const ruff = mesh(new T.TorusGeometry(BR * 0.84, BR * 0.12, 8, 30), wool('#FFF8EC', 'crochet', { scale: 0.45 }));
    at(ruff, 0, BR * 0.12, BR * 0.5);
    head.add(ruff);
    const bobble = woolBall(BR * 0.28, '#FFF8EC', 'crochet', { fuzz: 0.2, seg: 12 });
    at(bobble, 0, BR * 1.08, -BR * 0.55);
    head.add(bobble);
    const hand = woolBall(1.15, '#F8D5BE', 'crochet', { sy: 0.85, fuzz: false, seg: 12 });
    at(hand, -3.6, 13.4, 7.2);
    cradle.add(hand);
    const sleeve = woolBall(1.25, '#FFF3DE', 'crochet', { sx: 1.4, fuzz: false, seg: 12 });
    at(sleeve, -2.3, 13.0, 6.8);
    cradle.add(sleeve);
    lite(cradle);
    V.boilable(rockG, 0.03, 0.25);

    // ---------- le mobile, pendu au plafond ----------
    const mob = new T.Group();
    const stk = [];
    for (let i = 0; i < 3; i++) {
      stk.push(applyM(new T.CylinderGeometry(0.26, 0.26, 26, 6), { r: [0, (i * Math.PI) / 3, Math.PI / 2] }));
      for (const s of [-1, 1]) { const a = (i * Math.PI) / 3; stk.push(applyM(new T.SphereGeometry(0.6, 10, 7), { p: [-Math.cos(a) * 13 * s, 0, Math.sin(a) * 13 * s] })); }
    }
    stk.push(applyM(new T.SphereGeometry(1.2, 12, 9), {}));
    mob.add(mesh(mergeGeos(stk), woodMat('#E2B983', { rough: 0.5 })));
    const stars = [];
    const mkStar = (r) => {
      const m = wool('#CDB570', 'felt', { sheen: 0.5 }).clone();
      m.emissive = col('#FFC24A'); m.emissiveIntensity = 0;
      const g = new T.Group();
      const sh = starShape(r, 0.5, 5, 0.28);
      g.add(mesh(feltGeo(sh, 0.75), m));
      g.add(stitches(insetPoly(outline2D(sh, 60), 0.3), 0.385, '#8E6C2A', { len: 0.3, gap: 0.2, r: 0.05 }));
      stars.push({ g, m, lit: 0, target: 0, flare: -9 });
      return g;
    };
    const pend = [];
    const kinds = ['star', 'cloud', 'moon', 'star', 'cloud', 'star'];
    kinds.forEach((k, i) => {
      const a = (i * Math.PI) / 3, R = 13;
      const piv = new T.Group();
      at(piv, Math.cos(a) * R, -0.3, Math.sin(a) * R);
      const len = [6, 3.5, 7.5, 9, 4, 5.5][i];
      piv.add(yarn([[0, 0, 0], [0, -len, 0]], 0.05, '#EDE4D0', { radial: 4, cast: false }));
      let item;
      if (k === 'star') item = mkStar(2.8);
      else if (k === 'moon') { item = moon({ r: 3.2, color: '#F7EEC6', stitch: '#C9B266' }); }
      else {
        item = cloud({ w: 8, h: 4.0, bumps: 3, seed: i + 2, depth: 1.5, stitch: '#B9C8E6' });
        const sub = new T.Group();
        sub.add(yarn([[0, 0, 0], [0, -3.2, 0]], 0.05, '#EDE4D0', { radial: 4, cast: false }));
        const ss = mkStar(1.6);
        at(ss, 0, -4.7, 0);
        sub.add(ss);
        at(sub, 0, -1.4, 0);
        item.add(sub);
      }
      item.position.y = -len - (k === 'cloud' ? 1.4 : k === 'moon' ? 2.5 : 2.6);
      piv.add(item);
      mob.add(piv);
      pend.push({ piv, item, ph: i * 1.7 });
    });
    lite(mob, 3, 1.5);
    at(mob, 4, 42, -1);
    const hmob = hang(mob, 140, { amp: 0.5, per: 7 });
    V.add(hmob); swingAnim(V, hmob);

    // ---------- la veilleuse champignon, sur sa petite table ----------
    const tw = [];
    tw.push(applyM(new T.CylinderGeometry(7.2, 7.2, 1.4, 28), { p: [0, 12.3, 0] }));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; tw.push(applyM(new T.CylinderGeometry(0.7, 0.55, 11.6, 8), { p: [Math.cos(a) * 4.6, 5.8, Math.sin(a) * 4.6], r: [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12] })); }
    const table = new T.Group();
    table.add(mesh(mergeGeos(tw), woodMat('#B07A4C', { rough: 0.5 })));
    const doily = mesh(new T.CylinderGeometry(6.4, 6.4, 0.2, 28), wool('#FFF6E8', 'crochet', { scale: 0.6 }), { cast: false });
    scaleUV(doily.geometry, 12.8, 12.8);
    at(doily, 0, 13.1, 0);
    table.add(doily);
    const stem = mesh(latheGeo([[2.2, 0], [1.9, 0.6], [1.5, 2.5], [1.45, 4.4], [1.7, 5.4], [0, 5.6]], { seg: 18 }), wool('#FFF2DC', 'felt'));
    at(stem, 0, 13.2, 0);
    table.add(stem);
    const capM = wool('#FF9D6C', 'felt', { sheen: 0.4 }).clone();
    capM.side = T.DoubleSide;
    capM.emissive = col('#FF9A4A'); capM.emissiveIntensity = 0.9;
    const cap = mesh(latheGeo([[0.2, 4.4], [3.4, 4.6], [5.7, 5.2], [5.9, 6.2], [5.0, 8.0], [3.0, 9.4], [0.2, 9.8]], { seg: 28 }), capM, { cast: false });
    at(cap, 0, 13.2, 0);
    table.add(cap);
    const spotGeo = mergeGeos([[0, 9.6, 0, 0.9], [3.6, 8.6, 0.9, 0.7], [-2.9, 8.9, 1.9, 0.75], [1.2, 7.6, 4.6, 0.65], [-4.6, 7.1, -1.6, 0.6], [4.4, 6.9, 2.6, 0.55], [-1.4, 7.4, 4.9, 0.6]].map(([x, y, z, r]) => {
      const g = new T.SphereGeometry(r, 10, 6); g.scale(1, 0.35, 1);
      const n = v3(x, (y - 6) * 1.4, z).normalize();
      g.applyQuaternion(new T.Quaternion().setFromUnitVectors(v3(0, 1, 0), n)); g.translate(x, y, z);
      return g;
    }));
    const spots = mesh(spotGeo, wool('#FFF6E6', 'felt', { emissive: '#FFD9A8', emissiveIntensity: 0.35 }), { cast: false });
    at(spots, 0, 13.2, 0);
    table.add(spots);
    at(table, 27, 0, -12);
    V.add(table);
    const lampL = practical(V, [27, 22, -10], '#FF9F55', 420, 95);
    const lhalo = halo(30, '#FF9A4A', 0.5);
    at(lhalo, 27, 21, -14);
    V.add(lhalo);

    // ---------- l'ours en peluche, assis par terre ----------
    const bear = critter({ size: 11, color: '#C68650', belly: '#F0D2A6', pose: 'stand', ears: 'round', earIn: '#F0D2A6', earR: 0.4, snout: 0.42, nose: '#3A2418', eyeR: 0.12, tail: 'none', fuzz: 0.16 });
    const Bp = bear.p;
    Bp.legs.forEach((lg, i) => { lg.rotation.x = -1.35; lg.rotation.z = (i ? -1 : 1) * 0.18; });
    Bp.body.position.y = bear.br[1] * 0.98;
    Bp.arms.forEach((a, i) => { a.rotation.x = -0.5; a.rotation.z = (i ? -1 : 1) * 0.55; });
    const bow = new T.Group();
    for (const s of [-1, 1]) bow.add(felt(polyShape([[0, 0], [s * 2.4, 1.3], [s * 2.4, -1.3]]), '#7FB4E8', 0.35, { fuzz: false }));
    bow.add(woolBall(0.6, '#7FB4E8', 'felt', { fuzz: false, seg: 10 }));
    at(bow, 0, bear.br[1] * 0.92, bear.br[2] * 0.62);
    bow.rotation.x = -0.2;
    Bp.body.add(bow);
    lite(bear.g, 1.0, 0.8);
    at(bear.g, 21, 0, 9);
    bear.g.rotation.y = -0.7;
    V.add(bear.g);
    V.boilable(bear.g, 0.05, 0.6);
    const blinkB = blinker(Bp.eyes, 5);

    // ---------- cubes de jeu tricotés, au premier plan ----------
    const blocks = [[-27, 2.6, 13, 0.3, '#A8DCC8', 'heart', '#F28AA0'], [-21.4, 2.6, 15, -0.2, '#FFE29A', 'star', '#E8963A'], [-24.6, 7.8, 13.8, 0.6, '#C7B3F0', 'moon', '#FFF3C4']];
    blocks.forEach(([x, y, z, ry, c, k, c2], i) => {
      const b = mesh(new T.BoxGeometry(5.2, 5.2, 5.2, 2, 2, 2), wool(c, 'knit', { scale: 0.5 }));
      scaleUV(b.geometry, 5.2, 5.2);
      at(b, x, y, z);
      b.rotation.y = ry;
      const sh = k === 'heart' ? heartShape(3.4) : k === 'star' ? starShape(1.9, 0.5, 5, 0.3) : crescentShape(1.8, 0.78, 0.5);
      const ap = felt(sh, c2, 0.25, { fuzz: false, cast: false });
      at(ap, 0, 0, 2.7);
      b.add(ap);
      V.add(b);
    });

    // ---------- les « Z » de feutrine ----------
    const zs = [];
    const zSh = (w, h, k) => polyShape([[0, 0], [w, 0], [w, k], [k * 1.9, k], [w, h - k], [w, h], [0, h], [0, h - k], [w - k * 1.9, h - k], [0, k]].map(([x, y]) => [x - w / 2, y - h / 2]));
    const zMat = wool('#C9D5FF', 'felt', { sheen: 0.6 }).clone();
    zMat.emissive = col('#8EA6FF'); zMat.emissiveIntensity = 0.45;
    for (let i = 0; i < 6; i++) {
      const g = new T.Group();
      const sh = zSh(3.2, 3.4, 0.85);
      g.add(mesh(feltGeo(sh, 0.55), zMat, { cast: false }));
      g.add(stitches(insetPoly(outline2D(sh, 50), 0.2), 0.29, '#6F82D8', { len: 0.25, gap: 0.18, r: 0.04 }));
      g.visible = false;
      V.add(g);
      zs.push(g);
    }

    // ---------- particules ----------
    let sparkle = null, conf = null;
    if (!P) {
      pointCloud(V, { n: 60, box0: [-45, 4, -20], box1: [45, 58, 22], size: 0.8, color: '#FFD9B0', opacity: 0.3, vel: [0.2, 0.35, 0.1] });
      pointCloud(V, { n: 40, box0: [-60, 22, -78], box1: [10, 70, -66], size: 1.5, sprite: 'spark', color: '#FFF2C0', glow: 1.5, twinkle: 1, wander: 0, vel: [0, 0, 0], opacity: 0.9 });
      sparkle = pointCloud(V, { n: 46, box0: [-22, 18, -10], box1: [26, 50, 12], size: 1.3, sprite: 'spark', color: '#FFE9A8', glow: 1.8, twinkle: 1, wander: 2.5, vel: [0, 0.6, 0], opacity: 0 });
      conf = confetti(V, { kinds: ['star', 'heart'], n: 40, size: 0.8 });
    }
    const dream = practical(V, [2, 32, 8], '#FFC27A', 0, 70);
    V.onHome = (c) => { if (conf) conf.burst(v3(4, 40, -1), 6, [c, '#FFE48A', '#FFFFFF'], 0.4, 0.5); };

    // ---------- animation ----------
    let litN = 0, zN = 1, soft = 0, done = false, spin = 0, spinFrom = 0, spinTo = 0, rockDir = 1;
    const dim = col('#CDB570'), lit = col('#FFE68C'), cc = new T.Color();
    let lastT = null;
    V.anim((t, f) => {
      blinkB(t, f);
      const dt = lastT == null ? 1 / FPS : clamp(t - lastT, 0, 3);
      lastT = t;
      const ease = 1 - Math.exp(-dt * 5);
      // le mobile tourne doucement ; il fait un tour aux phrases
      const ks = easeInOut(sat(V.age('spin') / 2.2));
      spin = lerp(spinFrom, spinTo, ks);
      mob.rotation.y = t * 0.12 + spin;
      pend.forEach((q) => { q.piv.rotation.z = Math.sin(t * 1.3 + q.ph) * 0.07; q.piv.rotation.x = Math.cos(t * 1.1 + q.ph) * 0.06; q.item.rotation.y = Math.sin(t * 0.5 + q.ph) * 0.5 - mob.rotation.y * 0.15; });
      stars.forEach((s) => {
        s.lit += (s.target - s.lit) * ease;
        const fl = Math.max(0, 1 - (t - s.flare) / 0.6);
        cc.copy(dim).lerp(lit, s.lit);
        s.m.color.copy(cc);
        s.m.emissiveIntensity = s.lit * (0.9 + 0.2 * Math.sin(t * 2.5 + s.g.id)) + fl * 1.8;
        s.g.scale.setScalar(1 + fl * 0.3);
      });
      // le berceau : balancement aux phrases, en rythme pendant l'écoute
      const pa = V.age('rock');
      let th = Math.sin(t * 0.9) * 0.008;
      if (pa < 5) th += Math.sin(pa * 3.1) * 0.085 * Math.exp(-pa * 0.55);
      const na = V.age('nrock');
      if (na < 2.4) th += lerp(-rockDir, rockDir, easeInOut(sat(na / 0.42))) * 0.05 * (na < 1.2 ? 1 : 1 - easeInOut((na - 1.2) / 1.2));
      rockG.rotation.set(0, 0, th);
      rockG.position.set(-RR * th, RR, 0);
      // le bébé respire (plus lentement dans le sommeil profond)
      const br = Math.sin(t * (done ? 1.2 : 1.7));
      blanket.scale.y = 1 + br * 0.03;
      cuff.scale.y = 1 + br * 0.02;
      baby.position.y = BY + br * 0.08;
      head.rotation.z = 0.5 + Math.sin(t * 0.4) * 0.03;
      // l'ours regarde le bébé, puis s'endort à la fin
      const dk = done ? easeInOut(sat(V.age('done') / 2.5)) : 0;
      Bp.head.rotation.x = 0.1 + dk * 0.45 + Math.sin(t * 0.7) * 0.03 + bump(sat(V.age('nod') / 0.5)) * 0.25;
      Bp.head.rotation.z = Math.sin(t * 0.5) * 0.05 + dk * 0.25;
      Bp.head.rotation.y = -0.2 * (1 - dk);
      if (dk > 0.5) Bp.eyes.forEach((e) => { e.scale.y = e.userData.base.y * 0.12; });
      // les Z montent du berceau vers la fenêtre
      zs.forEach((z, i) => {
        const per = done ? 6 : 4.8, k = ((t / per + i / zs.length) % 1);
        z.visible = i < zN;
        const s = (0.3 + 0.7 * easeOut(sat(k / 0.45))) * (1 - easeIn(sat((k - 0.78) / 0.22))) * (done ? 1.1 : 1);
        z.scale.setScalar(Math.max(0.001, s));
        z.position.set(-9 + rockG.position.x - k * 22 + Math.sin(k * 6.5 + i * 0.7) * 3.6, 20 + k * 27, 4 - k * 4 + Math.cos(k * 5 + i) * 1.2);
        z.rotation.set(0, Math.sin(k * 4 + i) * 0.4, Math.sin(k * 6 + i * 2) * 0.3 + 0.12);
      });
      // la lumière s'adoucit avec l'avancement
      const sf = soft + dk * 0.4;
      L.key.intensity = lerp(1.5, 1.05, sf);
      L.rim.intensity = lerp(1.1, 0.8, sf);
      lampL.intensity = lerp(420, 320, sf) * (0.97 + 0.03 * Math.sin(t * 1.3));
      capM.emissiveIntensity = lerp(0.9, 0.7, sf);
      babyL.intensity = 70 + dk * 40;
      dream.intensity = dk * 140 * (0.9 + 0.1 * Math.sin(t * 1.1));
      V.post.exposure = lerp(1.1, 1.02, sf);
      if (sparkle) sparkle.obj.material.uniforms.uOpacity.value = dk * 0.85;
    });

    return {
      update(st, first) {
        litN = Math.round(stars.length * st.p);
        stars.forEach((s, i) => { s.target = i < litN ? 1 : 0; if (first) s.lit = s.target; });
        zN = Math.min(zs.length, 1 + Math.round(st.p * 4) + (st.done ? 1 : 0));
        soft = st.p * 0.6;
        if (st.done && !done) { done = true; if (first) V.cues.done = -10; else V.cue('done'); }
        if (!st.done) done = false;
      },
      react(kind, st) {
        if (kind === 'correct' || kind === 'phrase') {
          spinFrom = spin; spinTo = spin + (kind === 'phrase' ? TAU : 0.9); V.cue('spin');
          V.cue('nod');
          const s = stars[Math.max(0, litN - 1)];
          if (s) s.flare = V.now + 1 / FPS;
        }
        if (kind === 'phrase') V.cue('rock');
        if (kind === 'complete') {
          spinFrom = spin; spinTo = spin + TAU; V.cue('spin');
          V.cue('rock');
          stars.forEach((s, i) => { s.flare = V.now + i * 0.12; });
          if (conf) { conf.burst(v3(4, 34, 2), 22, ['#FFE48A', '#FFFFFF', '#F4A7B9', '#C7B3F0'], 0.6, 0.8); conf.rain([-30, 30, 50, -6, 8], 24, ['#FFE48A', '#FFFFFF', '#F4A7B9']); }
        }
      },
      note(n, on) {
        if (!on) return;
        rockDir = -rockDir;
        V.cue('nrock');
        const s = stars[n % stars.length];
        if (s && s.lit > 0.5) s.flare = V.now;
      },
    };
  },
};
