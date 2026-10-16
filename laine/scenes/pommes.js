/* ============ Pomme de reinette : le verger, une fin d'après-midi dorée ============
   Une pomme de feutrine pousse sur le pommier à chaque note retrouvée. À la
   fin de la 2e phrase, un tapis tricoté rouge se déroule dans l'herbe, à la
   fin de la 4e un tapis gris ; à chaque phrase l'arbre tremble et une pomme
   tombe sur le tapis. À la fin, une pluie douce de pommes remplit le panier
   de la fillette, et les feuilles s'envolent. */
SCENES.pommes = {
  color: '#B9DDF0',
  view: {
    bg: '#B9DDF0', fov: 26,
    rig: { target: [0, 17, 2], az: 6, el: 10, box: [52, 50], targetWide: [0, 17, 2], boxWide: [84, 41] },
    post: { exposure: 1.02, bloom: 0.45, bloomThr: 1.0, aper: 6, maxBlur: 11, sat: 1.1, lift: '#140E06', vignette: 0.38, punch: 1.22 },
  },
  sky: [-22, 26, 30, 37, -10, 4],
  home: [14, 7, 2],
  flock: 7, birdSize: 0.85,
  build(V, o) {
    const live = !o.portrait;
    studioLights(V, {
      key: { color: '#FFDDAA', k: 2.6, az: 46, el: 33, area: 74 },
      fill: { sky: '#C6E2F2', ground: '#7E8A4A', k: 0.72 },
      rim: { color: '#FFE6BA', k: 1.6, az: -140, el: 24 },
      env: { sky: '#C6E2F2', ground: '#6C7840', k: 0.5, boxK: 4 },
      fog: { color: '#E0E8E6', near: 150, far: 470 },
    });
    V.add(cyclo({ w: 620, h: 280, z: -112, r: 45, floor: 40, top: '#6FB0DE', mid: '#B4DAEF', bottom: '#FBE7C2', y: -2, scale: 3 }));
    const ground = terrain({ w: 440, d: 200, nx: 60, nz: 34, colors: ['#98C964', '#8BBE5A'], bands: 5, rough: 0.5, scale: 1.7, hills: [[-100, -64, 45, 6], [100, -66, 55, 8]] });
    V.add(ground);
    const H = ground.userData.height;
    const far = flatLayer(hillShape(540, 26, 5, 41), '#B7D69C', { depth: 1, inset: 1.1, stitch: '#DDEDC9' });
    at(far, 0, 0, -82);
    V.add(far);
    // des pommiers-sucettes au loin (le verger)
    const crowns = [], trunks = [], dots = [];
    const tr = rng(14);
    [-130, -104, -80, -56, 46, 70, 96, 122, 148].forEach((x) => {
      const r = 4 + tr() * 2, h = 12 + tr() * 5;
      crowns.push(applyM(feltGeo(circleShape(r), 0.9), { p: [x, h, 0] }));
      trunks.push(applyM(new T.BoxGeometry(1, h, 0.5), { p: [x, h / 2 - 2, -0.3] }));
      for (let k = 0; k < 4; k++) { const a = tr() * TAU, d = tr() * r * 0.7; dots.push(applyM(feltGeo(circleShape(0.65), 0.3, { bevel: 0, curve: 6 }), { p: [x + Math.cos(a) * d, h + Math.sin(a) * d, 0.6] })); }
    });
    const orchard = grp(mesh(mergeGeos(crowns), wool('#6FAE55', 'felt'), { cast: false }), mesh(mergeGeos(trunks), wool('#8A6545', 'felt'), { cast: false }), mesh(mergeGeos(dots), wool('#D9443E', 'felt'), { cast: false }));
    at(orchard, 0, 0, -70);
    V.add(orchard);
    const mid = flatLayer(hillShape(480, 14, 4, 23), '#A6CF72', { depth: 1, inset: 1.1, stitch: '#D2E7AE' });
    at(mid, 20, 0, -60);
    V.add(mid);
    // soleil et nuages suspendus
    const sunG = new T.Group();
    const sd = feltPiece(circleShape(5.6), '#FFC23A', { depth: 1.6, inset: 0.7, stitch: '#F08A24', st: { len: 0.55, gap: 0.35, r: 0.08 }, fuzz: 0.08 });
    const smt = sd.userData.body.material.clone();
    smt.emissive = col('#FFA820'); smt.emissiveIntensity = 0.5;
    sd.userData.body.material = smt;
    sunG.add(sd);
    const rays = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, r0 = 6.3, r1 = i % 2 ? 8.4 : 9.6; rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.07) * (r0 + r1) / 2, Math.sin(a + 0.07) * (r0 + r1) / 2, 0.3], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.4, { radial: 6 })); }
    sunG.add(mesh(mergeGeos(rays), wool('#FFAA2A', 'yarn')));
    addFace(sunG, 5.3, { z: 0.9, cheeks: '#F27A54' });
    sunG.traverse((m) => { m.castShadow = false; });
    at(sunG, 27, 33, -52);
    const hsun = hang(sunG, 190, { amp: 1, per: 5.6, r: 0.1 });
    V.add(hsun);
    swingAnim(V, hsun);
    [[-30, 36, -62, 20, 7, 3, 4.7], [6, 40, -74, 16, 6, 8, 6.2]].forEach(([x, y, z, w, h, seed, per]) => {
      const c = cloud({ w, h, bumps: 4, seed, stitch: '#CBDDEB' });
      c.traverse((m) => { m.castShadow = false; });
      at(c, x, y, z);
      const hc = hang(c, 190, { amp: 1.2, per, r: 0.1 });
      V.add(hc);
      swingAnim(V, hc);
    });

    // le pommier : tronc tricoté, branches de fil, houppier en boules de laine
    const TX = -6, TZ = -9;
    const treeG = new T.Group();
    at(treeG, TX, 0, TZ);
    V.add(treeG);
    const trunkCol = '#7A5236';
    treeG.add(mesh(latheGeo([[3.6, 0], [2.6, 1.2], [2.2, 5], [2.0, 11], [2.3, 15], [1.6, 17]], { seg: 20, lump: 0.08, seed: 3 }), wool(trunkCol, 'knit', { scale: 0.7 })));
    const wrap = [];
    for (let i = 0; i <= 50; i++) { const t = i / 50, y = 0.8 + t * 14, a = t * TAU * 5; const rr = lerp(2.9, 2.15, t) + 0.15; wrap.push([Math.cos(a) * rr, y, Math.sin(a) * rr]); }
    treeG.add(yarn(wrap, 0.3, darken(trunkCol, 0.15).getStyle(), { radial: 6 }));
    const brG = [[[0, 13, 0], [-6, 19, 1], [-12, 23, 2]], [[0, 14, 0], [5, 20, 1], [10, 23, 2]], [[0, 15, 0], [1, 21, -1], [0, 27, -2]], [[0, 14, 0], [-3, 20, -3], [-6, 25, -6]]].map((pts) => yarnGeo(pts, 1.1, { radial: 8 }));
    treeG.add(mesh(mergeGeos(brG), wool(trunkCol, 'knit', { scale: 0.6 })));
    const crown = new T.Group();
    treeG.add(crown);
    const PUFF = [[-13, 24, 1, 8.5], [-4, 27, 3, 9.5], [7, 25, 1, 8.5], [-19, 29, -5, 7.5], [13, 30, -5, 7.5], [-9, 34, -2, 9], [4, 35, -3, 9], [-2, 41, -6, 7.5], [-14, 37, -9, 7], [11, 38, -9, 7]];
    const leafCols = ['#5E9F47', '#6FB052', '#7CB957', '#679F45'];
    PUFF.forEach(([x, y, z, r], i) => {
      const b = woolBall(r, leafCols[i % 4], 'knit', { seed: i + 3, seg: 18, fuzz: 0.2, mat: { scale: 0.9 } });
      b.position.set(x, y, z);
      crown.add(b);
    });
    // des feuilles de feutrine piquées dans le feuillage
    const lr = rng(77), LV = [];
    for (let i = 0; i < 70; i++) {
      const [x, y, z, r] = PUFF[i % PUFF.length];
      const az = (lr() - 0.5) * 200 * DEG, el = (-50 + lr() * 120) * DEG;
      const d = v3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      const q = new T.Quaternion().setFromUnitVectors(v3(0, 1, 0), d);
      const e = new T.Euler().setFromQuaternion(q);
      LV.push({ p: [x + d.x * (r + 0.2), y + d.y * (r + 0.2), z + d.z * (r + 0.2)], r: [e.x + (lr() - 0.5) * 0.6, e.y, e.z + (lr() - 0.5) * 0.6], s: 0.9 + lr() * 0.6, c: col(['#5E9F47', '#7CB957', '#4E8A3C', '#8CC463'][Math.floor(lr() * 4)]) });
    }
    const leafy = feltGeo(leafShape(1.6, 3.2, 0.3), 0.14, { bevel: 0, curve: 6 });
    leafy.translate(0, 1.4, 0);
    crown.add(scatter(leafy, wool('#FFFFFF', 'felt', { sheen: 0.6, sheenColor: '#2E5020' }), LV.length, (i) => LV[i]));
    const tsh = contactShadow(46, 30, 0.45);
    tsh.position.set(0, 0.15, 2);
    treeG.add(tsh);
    // l'échelle de bois appuyée contre le tronc
    const lad = [];
    for (const s of [-1, 1]) lad.push(applyM(new T.BoxGeometry(0.6, 22, 0.8), { p: [s * 2.2, 11, 0] }));
    for (let k = 0; k < 6; k++) lad.push(applyM(new T.CylinderGeometry(0.28, 0.28, 4.4, 6), { p: [0, 2.5 + k * 3.4, 0], r: [0, 0, Math.PI / 2] }));
    const ladder = mesh(mergeGeos(lad), woodMat('#C9A06A'));
    at(ladder, TX - 9, 0, TZ + 5);
    ladder.rotation.set(-0.28, 0.5, 0.1);
    V.add(ladder);

    // les pommes de feutrine (une forme, répétée en instances)
    const appleG = latheGeo([[0.01, -0.95], [0.5, -0.9], [0.93, -0.48], [1.0, 0.08], [0.86, 0.62], [0.48, 0.86], [0.17, 0.72], [0.01, 0.64]], { seg: 18, lump: 0.03 });
    const stemG = yarnGeo([[0, 0.6, 0], [0.05, 1.05, 0], [0.18, 1.35, 0]], 0.09, { radial: 4 });
    const aleafG = (() => { const g = feltGeo(leafShape(0.62, 1.15, 0.12), 0.1, { bevel: 0, curve: 6 }); g.translate(0, 0.58, 0); applyM(g, { r: [0, 0, -1.0], p: [0.1, 1.1, 0] }); applyM(g, { r: [-0.5, 0, 0] }); return g; })();
    const appleM = wool('#FFFFFF', 'felt', { sheen: 0.7, sheenColor: '#FFD2B0' });
    const stemM = wool('#6B4426', 'yarn');
    const aleafM = wool('#5FA845', 'felt');
    const pool = (parent, n) => {
      const a = new T.InstancedMesh(appleG, appleM, n), s = new T.InstancedMesh(stemG, stemM, n), l = new T.InstancedMesh(aleafG, aleafM, n);
      [a, s, l].forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; parent.add(m); });
      a.setColorAt(0, new T.Color(1, 1, 1));
      return { a, s, l, n };
    };
    const M4 = new T.Matrix4(), Q4 = new T.Quaternion(), E4 = new T.Euler(), S4 = v3(), HID = new T.Matrix4().makeScale(0, 0, 0);
    const setApple = (P, i, pos, rot, sc, c) => {
      if (sc <= 0.001) { P.a.setMatrixAt(i, HID); P.s.setMatrixAt(i, HID); P.l.setMatrixAt(i, HID); return; }
      E4.copy(rot); Q4.setFromEuler(E4); S4.setScalar(sc);
      M4.compose(pos, Q4, S4);
      P.a.setMatrixAt(i, M4); P.s.setMatrixAt(i, M4); P.l.setMatrixAt(i, M4);
      P.a.setColorAt(i, c);
    };
    const flushPool = (P) => { P.a.instanceMatrix.needsUpdate = P.s.instanceMatrix.needsUpdate = P.l.instanceMatrix.needsUpdate = true; if (P.a.instanceColor) P.a.instanceColor.needsUpdate = true; };
    const APPLE_C = ['#D9342E', '#E2483A', '#8DC63F', '#C92E2A', '#E8743B', '#9ACD47'].map(col);
    // sur l'arbre : posées sur l'avant des boules de feuillage
    const onTree = [];
    const ar = rng(5);
    const front = PUFF.slice(0, 7);
    for (let i = 0; i < 14; i++) {
      const [x, y, z, r] = front[i % front.length];
      const az = (ar() - 0.5) * 110 * DEG, el = (-45 + ar() * 70) * DEG;
      const d = v3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      const p = v3(x, y, z).addScaledVector(d, r + 0.55);
      onTree.push({ p, rot: new T.Euler((ar() - 0.5) * 0.5, ar() * 3, (ar() - 0.5) * 0.5), s: 1.35 + ar() * 0.35, c: APPLE_C[i % APPLE_C.length], on: false, t0: -1e9 });
    }
    const TP = pool(crown, onTree.length);
    // celles qui tombent (une par phrase), puis la pluie dans le panier
    const LP = pool(V.scene, 4 + 12);

    // les tapis tricotés qui se déroulent
    const carpet = (x0, z0, len, wid, cMain, cBand, cEdge) => {
      const NS = 90, NW = 10;
      const g = new T.PlaneGeometry(len, wid, NS, NW);
      g.rotateX(-Math.PI / 2);
      g.translate(len / 2, 0, 0);
      const p = g.attributes.position, base = Float32Array.from(p.array), cs = [];
      const cm = col(cMain), cb = col(cBand), ce = col(cEdge), c = new T.Color();
      for (let i = 0; i < p.count; i++) {
        const s = base[i * 3], w = base[i * 3 + 2];
        const ew = Math.abs(w) / (wid / 2), es = Math.min(s, len - s);
        if (ew > 0.82 || es < 0.9) c.copy(ce);
        else if (ew > 0.62 && ew < 0.72) c.copy(cb);
        else if (Math.floor(s / 2.2) % 3 === 0 && ew < 0.45) c.copy(cb);
        else c.copy(cm);
        const v = 0.95 + hashi(Math.floor(s / 0.8), Math.floor(w / 0.8), 3) * 0.08;
        cs.push(c.r * v, c.g * v, c.b * v);
      }
      g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
      scaleUV(g, len, wid);
      const m = wool('#FFFFFF', 'knit', { scale: 0.45, bump: 1.2 }).clone();
      m.vertexColors = true;
      m.side = T.DoubleSide;
      m.sheenColor = lighten(cMain, 0.4);
      const me = mesh(g, m);
      // la bande se déforme : sa sphère englobante ne suit pas, on ne la cache jamais
      me.frustumCulled = false;
      const grpC = new T.Group();
      grpC.add(me);
      // franges au début du tapis
      const fr = [];
      for (let k = 0; k < 9; k++) { const w = lerp(-wid / 2 + 0.6, wid / 2 - 0.6, k / 8); fr.push(yarnGeo([[0.1, 0.12, w], [-0.9, 0.1, w + 0.15], [-1.7, 0.08, w - 0.1]], 0.12, { radial: 4 })); }
      grpC.add(mesh(mergeGeos(fr), wool(cEdge, 'yarn'), { cast: false }));
      at(grpC, x0, 0, z0);
      V.add(grpC);
      const TH = 0.42, RIN = 0.5;
      const y0 = (x) => H(x0 + x, z0) + 0.22;
      let lastU = -1;
      const lay = (u) => {
        u = clamp(u, 0, len);
        if (Math.abs(u - lastU) < 1e-3) return;
        lastU = u;
        const R = Math.sqrt(RIN * RIN + (TH * (len - u)) / Math.PI);
        for (let i = 0; i < p.count; i++) {
          const s = base[i * 3], w = base[i * 3 + 2];
          if (s <= u) { p.setXYZ(i, s, y0(s), w); continue; }
          // la partie encore roulée : une spirale qui part du point de contact
          const ds = s - u;
          let phi = 0, r = R, acc = 0;
          const step = 0.25;
          while (acc + step < ds) { phi += step / Math.max(RIN * 0.6, r); r = Math.max(RIN * 0.5, R - (TH * phi) / TAU); acc += step; }
          phi += (ds - acc) / Math.max(RIN * 0.6, r);
          p.setXYZ(i, u + Math.sin(phi) * r, y0(u) + R - Math.cos(phi) * r, w);
        }
        p.needsUpdate = true;
        g.computeVertexNormals();
      };
      lay(0);
      return { grp: grpC, lay, len, x0, z0, wid, k: 0, t0: -1e9, on: false };
    };
    const red = carpet(-28, 9.5, 23, 9.5, '#D2403A', '#A82E2A', '#F4E6CF');
    const grey = carpet(-2, 12.5, 18, 9, '#9D9BA3', '#76747C', '#EEECE8');
    const carpets = [red, grey];

    // le panier d'osier
    const basket = new T.Group();
    const bw = wool('#C99A56', 'weave', { scale: 0.7 });
    basket.add(mesh(latheGeo([[0.01, 0], [4.4, 0], [5.0, 0.7], [5.9, 4.4], [6.2, 5.4], [5.9, 5.5], [5.6, 4.6], [4.7, 1.0], [0.01, 0.9]], { seg: 28 }), bw));
    const rim = mesh(new T.TorusGeometry(6.05, 0.45, 8, 32), wool('#A87A3E', 'weave', { scale: 0.5 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 5.45;
    basket.add(rim);
    const hdl = [];
    for (let k = 0; k <= 16; k++) { const a = Math.PI - (k / 16) * Math.PI; hdl.push([Math.cos(a) * 5.8, 5.5 + Math.sin(a) * 6.5, 0]); }
    basket.add(mesh(yarnGeo(hdl, 0.5, { radial: 7 }), wool('#A87A3E', 'weave', { scale: 0.5 })));
    const bks = contactShadow(15, 12, 0.5);
    bks.position.y = 0.12;
    basket.add(bks);
    const BX = 11.5, BZ = 3;
    at(basket, BX, H(BX, BZ) - 0.1, BZ);
    basket.rotation.y = -0.3;
    V.add(basket);
    // la pile de pommes dans le panier
    const PILE = [];
    const pr = rng(31);
    for (let i = 0; i < 12; i++) {
      const lay2 = i < 6 ? 0 : i < 10 ? 1 : 2, a = (i % 6) / 6 * TAU + lay2 * 0.5 + pr() * 0.3, d = lay2 === 0 ? 3.0 : lay2 === 1 ? 1.8 : 0.4;
      PILE.push({ p: v3(BX + Math.cos(a) * d, H(BX, BZ) + 2.2 + lay2 * 1.6 + pr() * 0.3, BZ + Math.sin(a) * d), rot: new T.Euler((pr() - 0.5) * 0.8, pr() * 3, (pr() - 0.5) * 0.8), s: 1.15 + pr() * 0.2, c: APPLE_C[(i + 2) % APPLE_C.length] });
    }

    // la fillette
    const girl = doll({ h: 13, skin: '#F3C9A6', top: '#5FA8D3', bottom: '#5FA8D3', sleeves: '#5FA8D3', dress: true, collar: '#FFFFFF', hair: '#8A4B2A', hairStyle: 'pigtails', fringe: false, ribbon: '#E5484D', shoes: '#C2362F', legs: '#F7F3EA', cheeks: '#F09A8E' });
    const GP = girl.p;
    const apron = feltPiece(roundRectShape(3.0, 3.2, 0.9), '#FFFFFF', { depth: 0.2, inset: 0.25, stitch: '#E5484D', st: { len: 0.22, gap: 0.16, r: 0.035 } });
    apron.position.set(0, girl.bodyH * 0.36, 2.72);
    apron.rotation.x = -0.26;
    GP.body.add(apron);
    const pkt = felt(heartShape(0.9), '#E5484D', 0.15);
    pkt.position.set(0.5, girl.bodyH * 0.3, 2.98);
    pkt.rotation.x = -0.26;
    GP.body.add(pkt);
    const girlRoot = new T.Group();
    girlRoot.add(girl.g);
    const GX = 19.5, GZ = 6.5;
    at(girlRoot, GX, H(GX, GZ), GZ);
    girlRoot.rotation.y = -0.55;
    V.add(girlRoot);
    V.boilable(girl.g, 0.05, 0.6);
    const gsh = contactShadow(8, 6, 0.45);
    at(gsh, GX, H(GX, GZ) + 0.12, GZ);
    V.add(gsh);
    const blinkG = blinker(GP.eyes, 15);
    // le rouge-gorge sur une branche
    const robin = bird({ r: 1.6, color: '#8B6A4E', belly: '#E8743B', beak: '#3A2A22', beakL: 0.5, legs: false, eyeR: 0.18, cheeks: '#F2A0A0', tailUp: 0.5 });
    const rob = new T.Group();
    rob.add(robin.g);
    at(rob, 9.6, 31.0, 6.6);
    rob.rotation.y = -0.4;
    treeG.add(rob);
    V.boilable(robin.g, 0.03, 0.8);
    const blinkR = blinker(robin.p.eyes, 21);

    // l'herbe, les fleurs
    V.add(grass({ n: 46, area: [-60, 60, 15, 50], height: H, colors: ['#6DB85A', '#5AA64C', '#86C86B'], scale: 0.95, seed: 7 }));
    V.add(grass({ n: 16, area: [-60, 60, -30, 2], height: H, colors: ['#6DB85A', '#5AA64C', '#86C86B'], scale: 1.0, seed: 9 }));
    const petals = (n, rx, ry, rad) => { const g = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; g.push(applyM(feltGeo(ellipseShape(rx, ry), 0.16, { bevel: 0, curve: 6 }), { p: [Math.cos(a) * rad, Math.sin(a) * rad, 0], r: [0, 0, a - Math.PI / 2] })); } return mergeGeos(g); };
    const daisyG = petals(9, 0.42, 1.05, 1.15);
    const flowers = [[-40, 20, '#FFFFFF'], [34, 21, '#FFFFFF'], [-32, 27, '#F7A8C8'], [27, 30, '#F7A8C8']].map(([x, z, c], i) => {
      const g = new T.Group();
      const sh = 4 + (i % 3);
      g.add(yarn([[0, 0, 0], [0.3, sh * 0.5, 0.1], [0, sh, 0]], 0.16, '#4E9B4A', { radial: 5 }));
      const hd = new T.Group();
      hd.position.y = sh;
      hd.rotation.x = -0.5;
      hd.add(mesh(daisyG, wool(c, 'felt')));
      const ct = woolBall(0.6, '#F5C32C', 'crochet', { sz: 0.55, fuzz: false, seg: 12 });
      ct.position.z = 0.15;
      hd.add(ct);
      g.add(hd);
      at(g, x, H(x, z), z);
      V.add(g);
      return g;
    });

    // particules
    let leavesF = null, conf = null;
    if (live) {
      pointCloud(V, { n: 60, box0: [-40, 2, -24], box1: [44, 50, 22], size: 0.85, color: '#FFF0C8', opacity: 0.5, vel: [-0.3, 0.3, 0.1], beam: 0.6, keyDir: [0.6, 0.55, 0.58] });
      leavesF = fallers(V, { n: 18, kind: 'leaf', box: [-36, 30, 0, 46, -16, 18], colors: ['#7CB957', '#5E9F47', '#D9B44A', '#E8743B'], speed: 3.2, size: 1.0, seed: 4 });
      leavesF.on = 0.15;
      conf = confetti(V, { kinds: ['leaf', 'heart', 'disc'], n: 44, size: 0.85, height: (x, z) => H(x, z) + 0.3 });
    }
    V.onHome = (c) => { if (conf) conf.burst(v3(BX, 8, BZ), 5, [c, '#FFFFFF'], 0.4, 0.5); };

    // l'histoire
    let done = false, P = 0, nTree = 0, nbi = 0, lastT = null;
    const later = [];
    const after = (dt, fn) => later.push([V.now + dt, fn]);
    // où tombent les pommes de chaque phrase (la 1re dans l'herbe, puis sur les tapis)
    const FALL = [
      { from: v3(TX - 9, 22, TZ + 9), to: v3(-22, 0, 3.5), c: APPLE_C[0] },
      { from: v3(TX - 13, 21, TZ + 9), to: v3(-19, 0, 10), c: APPLE_C[2] },
      { from: v3(TX - 2, 20, TZ + 12), to: v3(-10, 0, 8.5), c: APPLE_C[1] },
      { from: v3(TX + 9, 20, TZ + 10), to: v3(5, 0, 12.5), c: APPLE_C[4] },
    ];
    const falls = FALL.map((F) => ({ ...F, on: false, t0: -1e9 }));
    const rainA = PILE.map((p, i) => ({ to: p, from: v3(BX - 10 + (i % 4) * 4, 27 + (i % 3) * 3, BZ - 6 + (i % 2) * 3), t0: 0.9 + i * 0.3 }));
    const fallPos = (F, a, out) => {
      // chute, deux rebonds, puis elle se pose
      const h = F.from.y - (H(F.to.x, F.to.z) + 1.1), g = 150, T1 = Math.sqrt((2 * h) / g);
      const y0 = H(F.to.x, F.to.z) + 1.1 + (F.onCarpet ? 0.42 : 0);
      if (a < T1) { const u = a / T1; out.set(lerp(F.from.x, F.to.x, u), F.from.y - 0.5 * g * a * a, lerp(F.from.z, F.to.z, u)); return 0; }
      const b = a - T1;
      const b1 = 0.32, b2 = 0.18;
      let y = y0;
      if (b < b1) y += bump(b / b1) * 2.4; else if (b < b1 + b2) y += bump((b - b1) / b2) * 0.8;
      const roll = Math.min(b, 0.8) * 1.6;
      out.set(F.to.x + roll, y, F.to.z);
      return Math.min(b, 0.8) * 2.2;
    };
    const tmpP = v3(), tmpE = new T.Euler(), HIDE = 0;
    V.anim((t, f) => {
      while (later.length && later[0][0] <= V.now) later.shift()[1]();
      const dt = lastT == null ? 0 : clamp(t - lastT, 0, 0.5);
      lastT = t;
      blinkG(t, f);
      blinkR(t, f);
      const ad = done ? V.age('done') : -1;
      // l'arbre tremble
      const sh = V.age('shake'), shK = sh < 1.4 ? Math.exp(-sh * 2.6) : 0;
      crown.rotation.z = Math.sin(t * 0.8) * 0.01 + shK * Math.sin(sh * 34) * 0.05;
      crown.rotation.x = shK * Math.sin(sh * 27 + 1) * 0.025;
      crown.position.x = shK * Math.sin(sh * 31) * 0.5;
      // les pommes sur l'arbre
      const nb = V.age('nb'), nbK = nb < 0.3 ? bump(nb / 0.3) : 0;
      onTree.forEach((A, i) => {
        const k = A.on ? sat((V.now - A.t0) / 0.5) : 0;
        const wob = shK * Math.sin(sh * 40 + i) * 0.3 + (i % 3 === nbi % 3 ? nbK * 0.25 : 0);
        tmpE.set(A.rot.x + wob, A.rot.y, A.rot.z + wob * 0.6);
        setApple(TP, i, A.p, tmpE, A.on ? easeOutBack(k, 2) * A.s : HIDE, A.c);
      });
      flushPool(TP);
      // les pommes tombées, et la pluie dans le panier
      falls.forEach((F, i) => {
        if (!F.on) { setApple(LP, i, F.to, tmpE.set(0, 0, 0), 0, F.c); return; }
        const rl = fallPos(F, V.now - F.t0, tmpP);
        setApple(LP, i, tmpP, tmpE.set(0, 0.6 * i, -rl), 1.2, F.c);
      });
      rainA.forEach((R, i) => {
        let s = 0;
        if (done) {
          const a = ad >= 1e5 ? 99 : ad - R.t0;
          if (a > 0) {
            s = 1.2;
            const u = sat(a / 0.75);
            tmpP.copy(R.from).lerp(R.to.p, easeIn(u * 0.4 + u * 0.6 * u));
            tmpP.y = lerp(R.from.y, R.to.p.y, u * u) + (u >= 1 ? bump(sat((a - 0.75) / 0.25)) * 1.0 : 0);
            setApple(LP, 4 + i, tmpP, u >= 1 ? R.to.rot : tmpE.set(a * 4, a * 3, 0), R.to.s, R.to.c);
            return;
          }
        }
        setApple(LP, 4 + i, R.to.p, R.to.rot, s, R.to.c);
      });
      flushPool(LP);
      // les tapis
      carpets.forEach((C) => {
        const k = C.on ? sat((V.now - C.t0) / 1.6) : 0;
        C.lay(easeInOut(k) * C.len);
      });
      basket.scale.setScalar(1 + bump(sat(V.age('bk') / 0.3)) * 0.05);
      // la fillette : elle regarde l'arbre, applaudit, saute de joie
      const cl = V.age('clap'), clK = cl < 0.8 ? 1 - sat((cl - 0.5) / 0.3) : 0;
      const lookUp = sh < 2 ? bump(sat(sh / 2)) : 0;
      let gy = 0, spin = 0, arms = 0;
      if (done) {
        const b = ad >= 1e5 ? t : ad;
        gy = Math.abs(Math.sin(b * Math.PI * 1.6)) * 2.2;
        arms = 0.7 + 0.3 * Math.sin(b * 6);
        spin = ad < 1e5 && ad > 0.3 && ad < 1.5 ? easeInOut((ad - 0.3) / 1.2) * TAU : 0;
      }
      girlRoot.position.y = H(GX, GZ) + gy + nbK * 0.4;
      girlRoot.rotation.y = -0.55 + spin;
      GP.head.rotation.set(-0.1 - lookUp * 0.35 + nbK * 0.15, (done ? 0.25 : 0.35) + Math.sin(t * 0.6) * 0.12, Math.sin(t * 0.9) * 0.05);
      const clap = clK > 0 ? Math.abs(Math.sin(cl * 22)) : 0;
      GP.armL.rotation.set(-0.3 - clK * 1.1 - arms * 2.2, 0, -0.22 - arms * 0.4 + clK * (0.55 - clap * 0.3));
      GP.armR.rotation.set(-0.3 - clK * 1.1 - arms * 2.2, 0, 0.22 + arms * 0.4 - clK * (0.55 - clap * 0.3));
      GP.body.rotation.z = Math.sin(t * 1.1) * 0.03;
      // le rouge-gorge sautille sur sa branche
      const rh = V.age('rob'), rk = rh < 0.3 ? bump(rh / 0.3) : 0;
      robin.g.position.y = rk * 0.8 + (done ? Math.abs(Math.sin(t * 7)) * 0.6 : 0);
      robin.p.head.rotation.set(rk * -0.3, Math.sin(Math.floor(t / 0.7) * 2.3) * 0.5, 0);
      robin.p.wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (done && f % 2 ? 0.9 : rk * 0.8); });
      flowers.forEach((g, i) => { g.rotation.z = Math.sin(t * 1.2 + i) * 0.04; });
      sunG.rotation.z = Math.sin(t * 0.7) * 0.05;
    });

    return {
      update(st, first) {
        P = st.p;
        nTree = st.done ? onTree.length : Math.min(onTree.length, Math.round(onTree.length * st.p));
        onTree.forEach((A, i) => { const on = i < nTree; if (on && !A.on) A.t0 = first ? -1e9 : V.now + 1 / FPS; A.on = on; });
        const ph = st.done ? 4 : st.phrasesDone;
        falls.forEach((F, i) => {
          const on = i < ph;
          F.onCarpet = i >= 1;
          if (on && !F.on) F.t0 = first ? -1e9 : V.now + 1 / FPS + 0.35 + (i === 1 || i === 3 ? 1.2 : 0);
          F.on = on;
        });
        carpets.forEach((C, i) => {
          const on = ph >= (i === 0 ? 2 : 4);
          if (on && !C.on) C.t0 = first ? -1e9 : V.now + 1 / FPS;
          C.on = on;
          if (first && on) C.lay(C.len);
        });
        if (st.done && !done) { done = true; if (first) V.cues.done = -1e6; else V.cue('done'); if (leavesF) leavesF.on = 1; }
        if (!st.done && done) { done = false; if (leavesF) leavesF.on = 0.15; }
      },
      react(kind, st) {
        if (kind === 'correct' || kind === 'phrase') { V.cue('clap'); V.cue('rob'); }
        if (kind === 'phrase') {
          V.cue('shake');
          if (conf) conf.burst(v3(TX, 30, TZ + 8), 10, ['#7CB957', '#5E9F47', '#D9B44A'], 0.45, 1.0);
        }
        if (kind === 'complete') {
          V.cue('shake');
          if (conf) {
            conf.burst(v3(TX, 32, TZ + 8), 18, ['#7CB957', '#5E9F47', '#D9B44A', '#E5484D'], 0.6, 1.2);
            after(1.8, () => { if (done) conf.burst(v3(BX, 12, BZ), 24, ['#E5484D', '#8DC63F', '#F5C32C', '#FFFFFF', '#F7A8C8'], 1.0, 1.1); });
            after(4.6, () => { if (done) conf.burst(v3(GX - 2, 14, GZ), 22, ['#E5484D', '#8DC63F', '#F5C32C', '#5FA8D3'], 1.0, 1.2); });
          }
          for (let i = 0; i < 12; i++) after(0.9 + i * 0.3 + 0.75, () => V.cue('bk'));
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('nb');
        nbi = n;
        if (n % 2 === 0) V.cue('rob');
      },
    };
  },
};
