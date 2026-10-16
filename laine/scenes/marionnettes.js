/* ============ Ainsi font, font, font : le castelet ============
   Un théâtre de marionnettes dans une salle sombre ; les enfants regardent,
   de dos, au premier plan. Le rideau rouge s'ouvre avec les notes
   retrouvées ; les marionnettes sautillent à chaque note, font trois
   petits tours à chaque phrase ; à la fin : trois tours, révérence, elles
   disparaissent derrière le rebord puis reviennent saluer sous les
   confettis (et les enfants applaudissent). Pendant l'écoute, elles
   dansent chacune à son tour. */
SCENES.marionnettes = {
  color: '#3A1F3E',
  view: {
    bg: '#120A16', fov: 26,
    rig: { target: [0, 36, 0], az: 0, el: 6, box: [64, 46], targetWide: [0, 35, 0], boxWide: [98, 46] },
    post: { exposure: 1.06, bloom: 0.95, bloomThr: 0.9, aper: 6.5, maxBlur: 12, sat: 1.12, lift: '#0A0510', vignette: 0.6, punch: 1.3 },
  },
  sky: [-26, 26, 57, 64, -6, 6],
  home: [0, 44, -4],
  flock: 6,
  build(V, o) {
    const P = !!o.portrait;
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
    const RED = '#B3263A', BLUE = '#2B4C9A', GOLD = '#E0A93E', CREAM = '#F5E7C8';
    // rideau plissé (jersey) : plis verticaux
    const drape = (W, H, folds, color, amp = 1) => {
      const g = new T.PlaneGeometry(W, H, folds * 8, 20);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const u = p.getX(i) / W + 0.5, v = p.getY(i) / H + 0.5;
        p.setZ(i, Math.sin(u * folds * TAU) * amp * (0.85 + 0.15 * v) + (v < 0.05 ? (0.05 - v) * 10 * Math.sin(u * folds * TAU + 1) : 0));
      }
      g.computeVertexNormals();
      scaleUV(g, W, H);
      return mesh(g, wool(color, 'knit', { scale: 0.5, side: T.DoubleSide, sheen: 1, sheenColor: lighten(color, 0.35).getStyle() }));
    };
    // plan tricoté à rayures
    const stripes = (W, H, n, cA, cB) => {
      const g = new T.PlaneGeometry(W, H, n, 1).toNonIndexed();
      const p = g.attributes.position, cs = [];
      for (let i = 0; i < p.count; i += 3) {
        const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
        const c = col(Math.floor((cx / W + 0.5) * n) % 2 ? cA : cB);
        for (let j = 0; j < 3; j++) cs.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
      scaleUV(g, W, H);
      const m = wool('#FFFFFF', 'knit', { scale: 0.6, sheen: 0.4 }).clone();
      m.vertexColors = true;
      return mesh(g, m, { cast: false });
    };

    // ---------- lumière : salle sombre, projecteur chaud sur le castelet ----------
    const L = studioLights(V, {
      key: { color: '#FFD9A6', k: 1.0, az: 14, el: 40, area: 60 },
      fill: { sky: '#3A2A50', ground: '#1A1018', k: 0.35 },
      rim: { color: '#8C9CFF', k: 1.5, az: 180, el: 28 },
      env: { sky: '#3A2C48', ground: '#140C14', k: 0.32, boxK: 2 },
    });
    const spot = new T.SpotLight(col('#FFE2B4'), 46000, 0, 0.3, 0.6, 2);
    spot.position.set(8, 96, 140);
    spot.target.position.set(0, 37, -2);
    V.add(spot, spot.target);
    const foot = practical(V, [0, 28, 6], '#FFC27A', 60, 34);

    // ---------- la salle ----------
    const back = drape(280, 150, 22, '#40235A', 1.8);
    at(back, 0, 72, -48);
    back.castShadow = false;
    V.add(back);
    V.add(terrain({ w: 300, d: 160, nx: 24, nz: 16, colors: ['#5A2232', '#4E1D2B'], bands: 8, rough: 0.2, scale: 1.6 }));
    // les grands rideaux de la salle, de part et d'autre (on les voit en format large)
    for (const s of [-1, 1]) {
      const c = drape(30, 110, 6, '#8E1E30', 1.6);
      const p = c.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { const v = p.getY(i) / 110 + 0.5, k = Math.exp(-((v - 0.32) ** 2) / 0.02) * 0.45; p.setX(i, p.getX(i) * (1 - k) + s * 15 * k); }
      c.geometry.computeVertexNormals();
      c.castShadow = false;
      at(c, s * 56, 55, -6);
      V.add(c);
      const tie = mesh(new T.TorusGeometry(3.4, 0.6, 6, 18), wool(GOLD, 'yarn'), { cast: false });
      tie.rotation.x = Math.PI / 2; tie.scale.set(1.4, 1, 1);
      at(tie, s * (56 + 6.5), 55 - 55 + 110 * 0.32, -5.4);
      V.add(tie);
    }

    // ---------- le castelet ----------
    const booth = new T.Group();
    V.add(booth);
    const fp = new T.Shape();
    fp.moveTo(-27, 0); fp.lineTo(27, 0); fp.lineTo(27, 58); fp.quadraticCurveTo(27, 62, 23, 62);
    fp.lineTo(12, 62); fp.quadraticCurveTo(0, 75, -12, 62); fp.lineTo(-23, 62); fp.quadraticCurveTo(-27, 62, -27, 58); fp.lineTo(-27, 0);
    const hole = new T.Path();
    hole.moveTo(-19, 24); hole.lineTo(19, 24); hole.lineTo(19, 50.5); hole.lineTo(-19, 50.5); hole.lineTo(-19, 24);
    fp.holes.push(hole);
    const front = mesh(feltGeo(fp, 2.4, { bevel: 0.5, curve: 16 }), wool(BLUE, 'knit', { scale: 0.7, sheen: 0.5 }));
    booth.add(front);
    for (const s of [-1, 1]) { const w = mesh(new T.BoxGeometry(2.4, 61, 21), wool(darken(BLUE, 0.2).getStyle(), 'knit', { scale: 0.7 })); scaleUV(w.geometry, 21, 61); at(w, s * 25.8, 30.5, -11.6); booth.add(w); }
    const strip = stripes(52, 22, 13, RED, CREAM);
    at(strip, 0, 12, 1.32);
    booth.add(strip);
    // galons d'or
    const trimPts = (w, h, cx, cy) => roundRectShape(w, h, 0.8).getSpacedPoints(80).map((q) => [q.x + cx, q.y + cy, 1.45]);
    booth.add(yarn(trimPts(39.2, 27.6, 0, 37.25), 0.42, GOLD, { closed: true, radial: 6, cast: false }));
    booth.add(yarn([[-26.2, 23, 1.5], [0, 23, 1.6], [26.2, 23, 1.5]], 0.4, GOLD, { radial: 6, cast: false }));
    booth.add(yarn([[-26.2, 1.2, 1.5], [0, 1.2, 1.6], [26.2, 1.2, 1.5]], 0.4, GOLD, { radial: 6, cast: false }));
    const pedPts = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = -11 + u * 22; pedPts.push([x, 60.2 + (1 - (x / 11) ** 2) * 9.6 * (1 - 0.15 * (1 - (x / 11) ** 2)), 1.45]); }
    booth.add(yarn(pedPts, 0.38, GOLD, { radial: 6, cast: false }));
    // étoile du fronton
    const pst = feltPiece(starShape(4.4, 0.48, 5, 0.25), GOLD, { depth: 0.7, inset: 0.45, stitch: '#FFF1C4', st: { len: 0.35, gap: 0.22, r: 0.06 } });
    at(pst, 0, 64.4, 1.6);
    booth.add(noCast(pst));
    for (const s of [-1, 1]) { const ss = feltPiece(starShape(1.8, 0.5, 5, 0.3), CREAM, { depth: 0.5, inset: 0.25, stitch: GOLD, st: { len: 0.25, gap: 0.16, r: 0.04 } }); at(ss, s * 18.5, 56.2, 1.5); ss.rotation.z = s * 0.3; booth.add(noCast(ss)); }
    // le rebord (la bande) où jouent les marionnettes
    const board = mesh(new T.BoxGeometry(46, 1.8, 5.2), woodMat('#D8A247', { rough: 0.45 }));
    at(board, 0, 23.2, 1.7);
    booth.add(board);
    // le décor peint du fond (feutrine)
    const bd = new T.Group();
    const skyP = mesh(new T.PlaneGeometry(50, 34), wool('#86C4EC', 'felt', { scale: 1 }), { cast: false });
    at(skyP, 0, 38, -19.5);
    bd.add(skyP);
    const h1 = flatLayer(hillShape(46, 6, 3, 2), '#86C77A', { depth: 0.5, inset: 0.6, stitch: '#CFEFC4' });
    at(h1, 0, 30.5, -18.9); bd.add(h1);
    const h2 = flatLayer(hillShape(46, 3.4, 2, 6), '#4FA35A', { depth: 0.5, inset: 0.6, stitch: '#A9DDA6' });
    at(h2, 0, 27.2, -18.3); bd.add(h2);
    const house = new T.Group();
    house.add(feltPiece(roundRectShape(6.4, 5.4, 0.3), '#F4E3C2', { depth: 0.4, inset: 0.3, stitch: '#B98B5A', st: { len: 0.25, gap: 0.18, r: 0.04 } }));
    const hroof = feltPiece(polyShape([[-4.4, 2.4], [4.4, 2.4], [0, 6.2]]), '#D6533F', { depth: 0.4, inset: 0.3, stitch: '#FFD0B0', st: { len: 0.25, gap: 0.18, r: 0.04 } });
    hroof.position.z = 0.05;
    house.add(hroof);
    const hdoor = felt(roundRectShape(1.6, 2.6, 0.6), '#7A4A30', 0.2, { fuzz: false }); at(hdoor, 0.9, -1.4, 0.25); house.add(hdoor);
    const hwin = felt(roundRectShape(1.5, 1.5, 0.2), '#FFD36A', 0.2, { fuzz: false }); at(hwin, -1.6, 0.4, 0.25); house.add(hwin);
    at(house, -11, 33.2, -17.9); bd.add(house);
    const tr = new T.Group();
    tr.add(feltPiece(circleShape(3.6), '#3E8E4E', { depth: 0.5, inset: 0.35, stitch: '#9FD49A', st: { len: 0.3, gap: 0.2, r: 0.05 } }));
    const trunk = felt(roundRectShape(1.2, 5, 0.3), '#7A5236', 0.3, { fuzz: false }); at(trunk, 0, -4.4, -0.2); tr.add(trunk);
    at(tr, 12, 35.5, -18.1); bd.add(tr);
    const psun = feltPiece(circleShape(3.2), '#FFCE45', { depth: 0.5, inset: 0.35, stitch: '#F08A24', st: { len: 0.3, gap: 0.2, r: 0.05 } });
    at(psun, 13, 46, -18.9); bd.add(psun);
    const pcl = cloud({ w: 9, h: 3.8, bumps: 3, seed: 3, depth: 0.8, stitch: '#C8DCEE' });
    at(pcl, -6, 45.4, -18.7); bd.add(pcl);
    booth.add(noCast(bd));
    // le rideau rouge (il s'ouvrira) et son lambrequin
    const curt = [-1, 1].map((s) => { const c = drape(19.6, 26.6, 5, RED, 0.9); c.castShadow = false; at(c, s * 9.8, 37.3, -1.6); booth.add(c); return c; });
    const rod = mesh(new T.CylinderGeometry(0.4, 0.4, 40, 8).rotateZ(Math.PI / 2), woodMat('#D8A247'), { cast: false });
    at(rod, 0, 50.6, -1.6);
    booth.add(rod);
    const scSh = new T.Shape();
    scSh.moveTo(-2.5, 0); scSh.lineTo(2.5, 0); scSh.lineTo(2.5, -2.2); scSh.absarc(0, -2.2, 2.5, 0, Math.PI, true); scSh.lineTo(-2.5, 0);
    const scGeo = feltGeo(scSh, 0.5, { bevel: 0.15, bevelSeg: 1, curve: 8 });
    const scal = [], tass = [];
    for (let i = 0; i < 8; i++) { const x = -17.5 + i * 5; scal.push({ p: [x, 51.2, 0.9], s: [1, 1, 1], c: RED }); tass.push({ p: [x, 46.3, 1.0], s: [0.55, 0.9, 0.55], c: GOLD }); }
    booth.add(scatter(scGeo, wool('#FFFFFF', 'knit', { scale: 0.5, sheen: 1, sheenColor: '#7A3040' }), scal.length, (i) => scal[i]));
    booth.add(scatter(new T.SphereGeometry(0.6, 8, 6), wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#806030' }), tass.length, (i) => tass[i], { cast: false }));
    // la guirlande d'ampoules, et les petites lampes de la rampe
    const bulbPos = [], cable = [];
    for (let i = 0; i <= 36; i++) { const u = i / 36, x = -27 + u * 54; const y = 57.5 - 3.2 * Math.abs(Math.sin(u * Math.PI * 3)); cable.push([x, y, 2.6]); }
    booth.add(yarn(cable, 0.12, '#2A2018', { radial: 4, cast: false }));
    for (let i = 0; i < 19; i++) { const q = cable[i * 2]; bulbPos.push([q[0], q[1] - 0.8, 2.7, 0.62]); }
    for (let i = 0; i < 9; i++) bulbPos.push([-18 + i * 4.5, 24.6, 4.0, 0.42]);
    const bulbCols = ['#FFE7B0', '#FF8A6A', '#FFE7B0', '#9FE0A0', '#FFE7B0', '#9CC6FF', '#FFE7B0', '#FFC24A'];
    const bulbs = new T.InstancedMesh(new T.SphereGeometry(1, 10, 8), new T.MeshBasicMaterial({ color: col('#FFFFFF').multiplyScalar(2.6), toneMapped: false, fog: false }), bulbPos.length);
    const bm4 = new T.Matrix4(), bq = new T.Quaternion(), bs = v3();
    bulbPos.forEach(([x, y, z, r], i) => { bm4.compose(v3(x, y, z), bq, bs.set(r, r * 1.25, r)); bulbs.setMatrixAt(i, bm4); bulbs.setColorAt(i, col(i >= 19 ? '#FFD9A0' : bulbCols[i % bulbCols.length])); });
    booth.add(bulbs);
    const bulbBase = bulbPos.map((q, i) => col(i >= 19 ? '#FFD9A0' : bulbCols[i % bulbCols.length]));
    lite(booth, 1.5, 0.9);

    // ---------- les marionnettes à gaine ----------
    const BASE = 33.2, PZ = -8.6;
    const puppet = (o2) => {
      const g = new T.Group(), body = new T.Group();
      g.add(body);
      const R = o2.R || 3.3;
      const gown = mesh(latheGeo([[4.9, -16], [4.7, -10], [4.0, -5], [3.1, -1.6], [1.7, 0.2], [0.01, 0.5]], { seg: 22, lump: 0.05 }), wool(o2.gown, 'knit', { scale: 0.45 }));
      fuzz(gown, 0.08);
      body.add(gown);
      if (o2.ruff) { const rf = mesh(latheGeo([[1.2, -0.4], [3.4, 0.1], [3.5, 0.6], [1.4, 0.7]], { seg: 22, lump: 0.25, freq: 3 }), wool(o2.ruff, 'crochet', { scale: 0.45 })); body.add(rf); }
      if (o2.buttons) for (let k = 0; k < 2; k++) { const b = woolBall(0.5, o2.buttons, 'felt', { fuzz: false, seg: 8 }); at(b, 0, -3.2 - k * 2.4, 3.55 + k * 0.6); body.add(b); }
      const arms = [-1, 1].map((s) => { const a = limb(3.0, 0.85, o2.gown, { end: { r: 1.05, color: o2.skin, sy: 0.9 } }); at(a, s * 3.0, -2.4, 0); a.rotation.z = s * 0.7; body.add(a); return a; });
      const head = new T.Group();
      head.position.y = R * 0.92;
      body.add(head);
      head.add(woolBall(R, o2.skin, 'felt', { seed: o2.seed || 2, fuzz: 0.06, seg: 22, lump: 0.03 }));
      const eyes = faceOn(head, [R, R, R], { eyeR: R * 0.13, spread: 25, eyeY: 8, cheeks: o2.cheeks || '#F08A8A', whites: '#FFFFFF', mouthY: -22, mouthW: 13 });
      const nz = surf([R, R, R], 0, -6);
      const nose = woolBall(R * (o2.noseR || 0.17), o2.nose || darken(o2.skin, 0.1).getStyle(), 'felt', { fuzz: false, seg: 12 });
      at(nose, nz.p.x, nz.p.y, nz.p.z);
      head.add(nose);
      if (o2.dress) o2.dress(head, R, body);
      g.userData = { body, head, arms, eyes, R };
      return g;
    };
    // Madelon : cheveux de laine jaune, nattes et nœuds
    const p1 = puppet({ gown: '#E2557C', skin: '#F7D3BA', ruff: '#FFFFFF', seed: 3, dress: (h, R) => {
      const cap = woolBall(R * 1.06, '#F2C14E', 'crochet', { sy: 0.92, seed: 5, fuzz: 0.12, seg: 18, mat: { scale: 0.5 } }); at(cap, 0, R * 0.18, -R * 0.2); h.add(cap);
      for (let i = -2; i <= 2; i++) { const q = surf([R, R, R], i * 14, 46); const b = woolBall(R * 0.2, '#F2C14E', 'crochet', { fuzz: false, seg: 8 }); at(b, q.p.x, q.p.y, q.p.z); h.add(b); }
      for (const s of [-1, 1]) {
        h.add(yarn([[s * R * 0.85, 0, -R * 0.2], [s * R * 1.2, -R * 0.6, -R * 0.1], [s * R * 1.1, -R * 1.25, R * 0.1]], R * 0.17, '#F2C14E', { radial: 6 }));
        const bw = woolBall(R * 0.2, '#E2373F', 'felt', { sx: 1.7, sy: 0.8, fuzz: false, seg: 8 }); at(bw, s * R * 1.12, -R * 1.1, R * 0.15); h.add(bw);
      }
    } });
    // Guignol : bicorne noir, catogan, veste rouge à boutons dorés
    const p2 = puppet({ gown: '#C3322E', skin: '#F0C19A', ruff: CREAM, buttons: GOLD, seed: 4, noseR: 0.22, nose: '#E08A70', dress: (h, R) => {
      const hair = woolBall(R * 1.04, '#2A1C16', 'crochet', { sy: 0.8, seed: 7, fuzz: 0.1, seg: 18 }); at(hair, 0, R * 0.3, -R * 0.25); h.add(hair);
      const hat = feltPiece(ellipseShape(R * 1.5, R * 0.75), '#1E1A22', { depth: 0.9, inset: 0.3, stitch: '#5A5070', st: { len: 0.3, gap: 0.2, r: 0.05 } });
      at(hat, 0, R * 0.95, -R * 0.1); hat.rotation.z = 0.06; h.add(hat);
      const cock = woolBall(R * 0.18, '#C3322E', 'felt', { fuzz: false, seg: 8 }); at(cock, R * 0.7, R * 1.15, 0.6); h.add(cock);
      h.add(yarn([[0, -R * 0.1, -R * 0.95], [0, -R * 0.5, -R * 1.4], [R * 0.1, -R * 1.0, -R * 1.5]], R * 0.12, '#2A1C16', { radial: 5 }));
    } });
    // Lapinou : grandes oreilles, nœud papillon
    const p3 = puppet({ gown: '#3E78D0', skin: '#F7F4EE', ruff: null, seed: 6, cheeks: '#F4A0B4', noseR: 0.14, nose: '#F07A96', dress: (h, R, body) => {
      for (const s of [-1, 1]) {
        const ear = new T.Group();
        const o1 = woolBall(1, '#F7F4EE', 'felt', { sx: R * 0.32, sy: R * 1.05, sz: R * 0.16, fuzz: 0.08, seg: 14 }); o1.position.y = R * 0.95; ear.add(o1);
        const in1 = felt(ellipseShape(R * 0.17, R * 0.8), '#F4A0B4', 0.12, { fuzz: false }); at(in1, 0, R * 0.95, R * 0.15); ear.add(in1);
        const q = surf([R, R, R], s * 26, 62); at(ear, q.p.x, q.p.y, q.p.z); ear.rotation.z = -s * 0.22; ear.rotation.x = -0.1;
        h.add(ear);
      }
      for (const s of [-1, 1]) { const tt = felt(roundRectShape(R * 0.18, R * 0.24, 0.05), '#FFFFFF', 0.12, { fuzz: false }); const q = surf([R, R, R], s * 4.5, -28); at(tt, q.p.x, q.p.y, q.p.z + 0.05); h.add(tt); }
      const bt = new T.Group();
      for (const s of [-1, 1]) bt.add(felt(polyShape([[0, 0], [s * 1.8, 1], [s * 1.8, -1]]), '#F5C32C', 0.3, { fuzz: false }));
      bt.add(woolBall(0.45, '#F5C32C', 'felt', { fuzz: false, seg: 8 }));
      at(bt, 0, -0.8, 2.4); body.add(bt);
    } });
    const pups = [p1, p2, p3];
    const PX = [-11.5, 0, 11.5];
    pups.forEach((p, i) => { lite(p, 0.8, 0.6); at(p, PX[i], BASE, PZ); p.userData.body.scale.setScalar(1.14); booth.add(p); V.boilable(p, 0.04, 0.6); });
    const blinks = pups.map((p, i) => blinker(p.userData.eyes, 3 + i * 4));

    // ---------- les enfants, de dos, au premier plan ----------
    const kids = [];
    [[-25, 19.5, 30, 4.5, '#5A3A22', 'bun', '#3F7FD0'], [-8.5, 18.6, 33, 5.0, '#E7BE5E', 'tails', '#E2557C'], [9.5, 19.2, 31, 4.8, '#2A1E1A', 'beanie', '#49A35A'], [26, 20.2, 29, 4.4, '#C0602A', 'short', '#F2C14E']].forEach(([x, y, z, r, hair, st, jumper], i) => {
      const k = new T.Group();
      const sh = woolBall(1, jumper, 'knit', { sx: r * 1.5, sy: r * 0.7, sz: r * 0.9, fuzz: false, seg: 16 }); at(sh, 0, -r * 1.25, 0); k.add(sh);
      const hd = new T.Group(); k.add(hd);
      hd.add(woolBall(r, '#F2C9A8', 'crochet', { fuzz: false, seg: 18 }));
      const cap = woolBall(r * 1.06, hair, 'crochet', { sy: st === 'beanie' ? 0.9 : 1.0, seed: i + 3, fuzz: false, seg: 18 }); at(cap, 0, r * 0.12, -r * 0.16); hd.add(cap);
      if (st === 'bun') { const b = woolBall(r * 0.45, hair, 'crochet', { fuzz: false, seg: 12 }); at(b, 0, r * 0.95, -r * 0.4); hd.add(b); }
      if (st === 'tails') for (const s of [-1, 1]) { hd.add(yarn([[s * r * 0.8, r * 0.1, -r * 0.6], [s * r * 1.3, -r * 0.4, -r * 0.7], [s * r * 1.2, -r * 1.0, -r * 0.5]], r * 0.2, hair, { radial: 6 })); }
      if (st === 'beanie') { const bn = woolBall(r * 1.12, jumper, 'knit', { sy: 0.75, seed: 9, fuzz: false, seg: 18 }); at(bn, 0, r * 0.45, -r * 0.1); hd.add(bn); const pp = woolBall(r * 0.38, '#FFFFFF', 'crochet', { fuzz: false, seg: 10 }); at(pp, 0, r * 1.25, -r * 0.2); hd.add(pp); }
      const hands = [-1, 1].map((s) => { const a = limb(r * 2.7, r * 0.27, jumper, { end: { r: r * 0.36, color: '#F2C9A8', sy: 0.9 }, fuzz: 0.01 }); at(a, s * r * 1.05, -r * 1.05, 0); a.rotation.z = s * 0.15; k.add(a); return a; });
      at(k, x, y, z);
      k.rotation.y = Math.PI + (x > 0 ? -0.12 : 0.12);
      V.add(noCast(k));
      kids.push({ k, hd, hands, r, base: v3(x, y, z), ph: i * 1.7 });
    });

    // ---------- particules ----------
    let conf = null;
    if (!P) {
      pointCloud(V, { n: 80, box0: [-40, 10, -10], box1: [40, 80, 40], size: 0.8, color: '#FFE6C2', opacity: 0.38, vel: [0.2, 0.35, 0.1], beam: 0.8, keyDir: [0.05, 0.55, 0.85] });
      conf = confetti(V, { kinds: ['disc', 'star', 'heart'], n: 50, size: 0.9 });
    }
    V.onHome = (c) => { if (conf) conf.burst(v3(0, 44, -2), 6, [c, GOLD, '#FFFFFF'], 0.4, 0.5); };

    // ---------- animation ----------
    let saluted = false;
    let openT = 0.12, open = 0.12, done = false, spinFrom = [0, 0, 0], spinTo = [0, 0, 0], beatI = 0, lastT = null;
    V.anim((t, f) => {
      blinks.forEach((b) => b(t, f));
      const dt = lastT == null ? 1 / FPS : clamp(t - lastT, 0, 3);
      lastT = t;
      open += (openT - open) * (1 - Math.exp(-dt * 2.2));
      // le rideau se fronce vers les côtés
      curt.forEach((c, i) => { const s = i ? 1 : -1, w = lerp(1, 0.26, open); c.scale.set(w, 1, 1 + open * 0.6); c.position.x = s * (19 - 9.8 * w); });
      const W = done ? V.age('done') : -1;
      if (W > 4.4 && !saluted) { saluted = true; if (conf) conf.burst(v3(0, 40, 0), 30, [GOLD, '#FFFFFF', RED, '#9CC6FF', '#FF8A6A'], 0.9, 1.1); }
      pups.forEach((p, i) => {
        const U = p.userData;
        let y = BASE + Math.sin(t * 3.1 + i * 2) * 0.35, ry = Math.sin(t * 0.7 + i) * 0.25, rx = 0, rz = Math.sin(t * 2.3 + i * 1.3) * 0.07, sq = 1;
        // sautillement (note trouvée)
        const hk = sat((V.age('hop') - i * 0.12) / 0.42);
        y += bump(hk) * 3.2; sq -= bump(sat((hk - 0.75) / 0.25)) * 0.1;
        // danse pendant l'écoute
        const bk = sat(V.age('beat' + i) / 0.36);
        y += bump(bk) * 2.2;
        // trois petits tours (phrase)
        const sk = sat((V.age('spin') - i * 0.15) / 2.1);
        ry += lerp(spinFrom[i], spinTo[i], easeInOut(sk));
        if (sk > 0 && sk < 1) y += Math.abs(Math.sin(sk * Math.PI * 3)) * 2.2;
        let wave = 0;
        if (W >= 0) {
          // la fin : trois tours, révérence, on se cache, on revient saluer
          const a = W - i * 0.12;
          ry = Math.sin(t * 0.7 + i) * 0.1 + TAU * 3 * easeInOut(sat(a / 2.2));
          if (a < 2.2) y += Math.abs(Math.sin(sat(a / 2.2) * Math.PI * 3)) * 2.4;
          const bow = bump(sat((a - 2.3) / 0.8));
          rx = bow * 0.6;
          y -= bow * 3.2;
          const hide = easeIn(sat((a - 3.2) / 0.45)) * (1 - easeOutBack(sat((a - 4.3) / 0.5)));
          y -= hide * 24;
          if (a > 4.3) { wave = 1; y += Math.abs(Math.sin((a - 4.3) * 4.5)) * (a < 7 ? 1.4 : 0.5); }
        }
        p.position.set(PX[i], y, PZ);
        p.rotation.set(rx, ry, rz);
        p.scale.set(1, sq, 1);
        U.body.scale.set(1.14, 1.14, 1.14);
        U.head.rotation.set(Math.sin(t * 1.7 + i) * 0.08, Math.sin(t * 0.9 + i * 2) * 0.25, Math.sin(t * 1.3 + i) * 0.1);
        const arm = bump(bk) * 0.9 + bump(hk) * 0.6;
        U.arms.forEach((a, j) => {
          const s = j ? 1 : -1;
          const w2 = wave ? Math.sin(W * 9 + j * 2) * 0.35 + 1.9 : 0;
          a.rotation.set(-0.2 - arm * 0.6 - w2 * 0.4, 0, s * (0.7 + arm + w2 * 0.6 + Math.sin(t * 2.6 + i + j) * 0.12));
        });
      });
      // les enfants : petits mouvements, sautillent avec les marionnettes, applaudissent à la fin
      kids.forEach((q, i) => {
        const hop = bump(sat((V.age('hop') - 0.1 - i * 0.07) / 0.4)) * 0.8;
        const clapping = W > 2.4;
        q.k.position.set(q.base.x, q.base.y + hop + (clapping ? Math.abs(Math.sin(W * 3 + q.ph)) * 0.5 : 0), q.base.z);
        q.hd.rotation.set(Math.sin(t * 0.6 + q.ph) * 0.05, Math.sin(t * 0.4 + q.ph) * 0.18, Math.sin(t * 0.5 + q.ph) * 0.06);
        q.hands.forEach((h, j) => {
          const s = j ? 1 : -1;
          if (clapping) { const c = Math.abs(Math.sin(W * 7 + q.ph)); h.rotation.set(0, 0, s * (Math.PI - lerp(0.55, -0.1, c))); } else h.rotation.set(0, 0, s * 0.15);
        });
      });
      // les ampoules : elles scintillent, chenillard à la fin
      bulbBase.forEach((c, i) => {
        let k = 0.85 + 0.15 * Math.sin(t * 2 + i * 1.7);
        if (W >= 0) k = (Math.floor(t * 8) + i) % 3 === 0 ? 1.25 : 0.55;
        else if (V.age('beat' + (i % 3)) < 0.25 && i < 19) k = 1.3;
        bulbs.setColorAt(i, new T.Color().copy(c).multiplyScalar(k));
      });
      bulbs.instanceColor.needsUpdate = true;
      foot.intensity = 60 * (0.95 + 0.05 * Math.sin(t * 3)) * (0.5 + open * 0.5);
    });

    return {
      update(st, first) {
        openT = st.done ? 1 : 0.12 + 0.88 * st.p;
        if (first) open = openT;
        if (st.done && !done) { done = true; if (first) V.cues.done = -20; else V.cue('done'); }
        if (!st.done) { done = false; saluted = false; }
        if (first && st.done) saluted = true;
      },
      react(kind, st) {
        if (kind === 'correct' || kind === 'phrase') V.cue('hop');
        if (kind === 'phrase') {
          pups.forEach((p, i) => { const cur = lerp(spinFrom[i], spinTo[i], easeInOut(sat((V.age('spin') - i * 0.15) / 2.1))); spinFrom[i] = cur; spinTo[i] = cur + TAU * 3; });
          V.cue('spin');
          if (conf) conf.burst(v3(0, 50, 2), 12, [GOLD, '#FFFFFF', RED], 0.6, 0.8);
        }
        if (kind === 'complete' && conf) {
          conf.burst(v3(-12, 52, 4), 24, [GOLD, '#FFFFFF', RED, '#9CC6FF', '#9FE0A0'], 1.0, 1.0);
          conf.burst(v3(12, 52, 4), 24, [GOLD, '#FFFFFF', RED, '#FF8A6A', '#FFC24A'], 1.0, 1.0);
          conf.rain([-30, 30, 70, -2, 30], 40, [GOLD, '#FFFFFF', RED, '#9CC6FF', '#FF8A6A']);
        }
      },
      note(n, on) {
        if (!on) return;
        beatI = n % 3;
        V.cue('beat' + beatI);
      },
    };
  },
};
