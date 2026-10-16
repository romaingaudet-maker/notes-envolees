/* ============ Ah ! vous dirai-je, maman : la confiserie ============
   Une fillette, au comptoir, dévore des yeux le grand bocal : il se remplit
   de bonbons à chaque note retrouvée ; à chaque phrase, pluie de bonbons ;
   à la fin, elle reçoit une sucette géante, l'enseigne s'allume et il
   pleut des bonbons. Pendant l'écoute, elle se dandine et le couvercle du
   bocal tinte. */
SCENES.bonbons = {
  color: '#F3B7C8',
  view: {
    bg: '#5A3040', fov: 26,
    rig: { target: [-4, 27, 0], az: 6, el: 9, box: [72, 52], targetWide: [-4, 25, 0], boxWide: [106, 48] },
    post: { exposure: 1.04, bloom: 0.65, bloomThr: 1.0, aper: 6, maxBlur: 10, sat: 1.14, lift: '#0A0306', gain: '#FFF8F2', vignette: 0.42, punch: 1.3 },
  },
  sky: [-40, 30, 44, 54, -16, -4],
  home: [-12, 31, -3],
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
    const halo = (size, color, k) => new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: sprite('soft'), color: col(color).multiplyScalar(k), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    const PINK = '#F4A3BE', MINT = '#9ADBC3', CREAM = '#FFF2DC', BUTTER = '#FFE08A', LILAC = '#C9B5F2', CORAL = '#FF8A78';
    // plan tricoté à motif (rayures ou damier) : une couleur par carreau
    const patterned = (W, H, nx, ny, pick) => {
      const g = new T.PlaneGeometry(W, H, nx, ny).toNonIndexed();
      const p = g.attributes.position, cs = [];
      for (let i = 0; i < p.count; i += 3) {
        const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
        const c = col(pick(Math.floor((cx / W + 0.5) * nx), Math.floor((cy / H + 0.5) * ny)));
        const v = 0.95 + hashi(Math.floor(cx), Math.floor(cy), 3) * 0.06;
        for (let j = 0; j < 3; j++) cs.push(c.r * v, c.g * v, c.b * v);
      }
      g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
      g.computeVertexNormals();
      scaleUV(g, W, H);
      const m = wool('#FFFFFF', 'knit', { scale: 0.75, sheen: 0.3 }).clone();
      m.vertexColors = true;
      return mesh(g, m, { cast: false });
    };
    // sucette : deux (ou trois) fils enroulés en spirale, sur un bâtonnet
    const lolly = (R, cols, stick) => {
      const g = new T.Group();
      const turns = 3.6, n = 130, tr = (R - 0.3) / (2 * cols.length * turns) * 1.05;
      cols.forEach((c, ci) => {
        const pts = [];
        for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * TAU + (ci * TAU) / cols.length; const r = 0.3 + t * (R - 0.3); pts.push([Math.cos(a) * r, Math.sin(a) * r, 0]); }
        g.add(yarn(pts, tr, c, { radial: 6 }));
      });
      g.add(mesh(new T.CylinderGeometry(R - tr * 0.6, R - tr * 0.6, tr * 1.4, 28).rotateX(Math.PI / 2), wool(cols[0], 'felt'), { cast: false }));
      if (stick) { const s = mesh(new T.CylinderGeometry(0.32, 0.32, stick, 8), woodMat('#F4E8D2', { rough: 0.5 })); s.position.y = -R - stick / 2 + 0.6; g.add(s); }
      return g;
    };

    // ---------- lumière : intérieur chaud et rosé ----------
    const L = studioLights(V, {
      key: { color: '#FFE6CC', k: 2.3, az: -32, el: 46, area: 62 },
      fill: { sky: '#FFD3E0', ground: '#7A4A3A', k: 0.55 },
      rim: { color: '#FFD0E2', k: 1.2, az: 150, el: 34 },
      env: { sky: '#F7D6E2', ground: '#6A3F35', k: 0.4, boxK: 3 },
    });

    // ---------- murs et sol ----------
    const WALLZ = -30;
    const wallM = patterned(260, 110, 52, 1, (i) => (i % 2 ? MINT : CREAM));
    at(wallM, 0, 55, WALLZ);
    V.add(wallM);
    const floor = patterned(260, 120, 26, 12, (i, j) => ((i + j) % 2 ? PINK : CREAM));
    floor.rotation.x = -Math.PI / 2;
    at(floor, 0, 0, 20);
    V.add(floor);
    // plinthe
    const baseB = mesh(new T.BoxGeometry(260, 3, 1.4), woodMat('#F6EEE2', { rough: 0.5 }), { cast: false });
    at(baseB, 0, 1.5, WALLZ + 0.8);
    V.add(baseB);

    // ---------- festons de feutrine (store, étagères, comptoir) ----------
    const scSh = new T.Shape();
    scSh.moveTo(-2.5, 0); scSh.lineTo(2.5, 0); scSh.lineTo(2.5, -5.5); scSh.absarc(0, -5.5, 2.5, 0, Math.PI, true); scSh.lineTo(-2.5, 0);
    const scGeo = feltGeo(scSh, 0.4, { bevel: 0.12, bevelSeg: 1, curve: 8 });
    const scal = [];
    for (let i = 0; i < 52; i++) scal.push({ p: [-127.5 + i * 5, 62, WALLZ + 5], r: [-0.42, 0, 0], s: 1, c: i % 2 ? PINK : CREAM });
    const shelfY = [19, 30.5, 42];
    shelfY.forEach((y) => { for (let i = 0; i < 20; i++) scal.push({ p: [-47.5 + i * 5, y - 0.5, WALLZ + 8.15], r: [0, 0, 0], s: [1, 0.36, 1], c: i % 2 ? PINK : CREAM }); });
    for (let i = 0; i < 11; i++) scal.push({ p: [-42.5 + i * 5, 13.4, 3.4], r: [0, 0, 0], s: [1, 0.45, 1], c: i % 2 ? PINK : LILAC });
    V.add(scatter(scGeo, wool('#FFFFFF', 'felt', { sheen: 0.4, sheenColor: '#806070' }), scal.length, (i) => scal[i]));
    // le store
    const awnBack = mesh(new T.BoxGeometry(260, 6, 0.6), wool(PINK, 'felt'), { cast: false });
    awnBack.rotation.x = -0.42;
    at(awnBack, 0, 64.6, WALLZ + 3.9);
    V.add(awnBack);

    // ---------- étagères et bocaux ----------
    const sw = [];
    shelfY.forEach((y) => {
      sw.push(applyM(new T.BoxGeometry(98, 1.3, 8), { p: [0, y - 0.65, WALLZ + 4] }));
      for (const x of [-44, 0, 44]) sw.push(applyM(new T.BoxGeometry(1.2, 4, 5), { p: [x, y - 3.2, WALLZ + 3] }));
    });
    V.add(mesh(mergeGeos(sw), woodMat('#FBF4EA', { rough: 0.5 })));
    const ballGeo = new T.SphereGeometry(0.7, 9, 7);
    const wrapGeo = mergeGeos([
      applyM(new T.SphereGeometry(1, 12, 8), { s: [1.05, 0.72, 0.72] }),
      applyM(new T.ConeGeometry(0.72, 1.0, 8), { p: [1.38, 0, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.38] }),
      applyM(new T.ConeGeometry(0.72, 1.0, 8), { p: [-1.38, 0, 0], r: [0, 0, -Math.PI / 2], s: [1, 1, 0.38] }),
    ]);
    const candyMat = wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#806070' });
    const jarGeo = (r, h) => latheGeo([[0.01, 0], [r * 0.96, 0], [r, 0.4], [r, h * 0.8], [r * 0.9, h * 0.9], [r * 0.66, h * 0.96], [r * 0.64, h * 1.04], [r * 0.7, h * 1.06], [0.01, h * 1.06]], { seg: 22 });
    const glass = [], lids = [], balls = [], wraps = [];
    const themes = [[PINK, '#FFFFFF'], [MINT, BUTTER], [CORAL, BUTTER, '#FFFFFF'], [LILAC, PINK], ['#E8504E', '#FFFFFF'], [BUTTER, CORAL], ['#7CC5F0', '#FFFFFF', MINT]];
    const jr = rng(17);
    shelfY.forEach((y, si) => {
      let x = -44 + jr() * 3;
      while (x < 42) {
        const r = 3 + jr() * 1.1, h = 6.5 + jr() * 2.6;
        const cx = x + r;
        if (cx + r > 46) break;
        const z = WALLZ + 4.2;
        glass.push(applyM(jarGeo(r, h), { p: [cx, y, z] }));
        lids.push(applyM(new T.CylinderGeometry(r * 0.76, r * 0.8, 0.9, 18), { p: [cx, y + h * 1.06 + 0.4, z] }));
        const th = themes[Math.floor(jr() * themes.length)], wrapK = jr() < 0.45;
        const fill = 0.55 + jr() * 0.4, cnt = Math.round(r * r * h * fill * 0.32);
        for (let k = 0; k < cnt; k++) {
          const a = jr() * TAU, rr = Math.sqrt(jr()) * (r - 0.95), yy = y + 0.75 + (k / cnt) * (h * 0.78 * fill) + jr() * 0.5;
          const it = { p: [cx + Math.cos(a) * rr, yy, z + Math.sin(a) * rr], r: [jr() * 6, jr() * 6, jr() * 6], s: wrapK ? 0.62 : 0.95 + jr() * 0.2, c: th[k % th.length] };
          (wrapK ? wraps : balls).push(it);
        }
        x = cx + r + 1.6 + jr() * 2.5;
      }
    });
    V.add(scatter(ballGeo, candyMat, balls.length, (i) => balls[i], { cast: false }));
    V.add(scatter(wrapGeo, candyMat, wraps.length, (i) => wraps[i], { cast: false }));
    V.add(mesh(mergeGeos(lids), wool('#F7B6C9', 'weave', { scale: 0.7 }), { cast: false }));
    const gm = glassMat('#F2FBFF', { opacity: 0.18 });
    const shelfGlass = mesh(mergeGeos(glass), gm, { cast: false });
    shelfGlass.renderOrder = 2;
    V.add(shelfGlass);

    // ---------- le comptoir ----------
    const CX0 = -44, CX1 = 10, CZ0 = -10, CZ1 = 3, CT = 14;
    const front = mesh(new T.BoxGeometry(CX1 - CX0, CT - 2, 1.6, 4, 2, 1), wool(MINT, 'knit', { scale: 0.6, sheen: 0.4 }));
    scaleUV(front.geometry, CX1 - CX0, CT - 2);
    at(front, (CX0 + CX1) / 2, 1 + (CT - 2) / 2, CZ1 - 0.8);
    V.add(front);
    const cw = [];
    cw.push(applyM(new T.BoxGeometry(CX1 - CX0 + 2, 1.6, CZ1 - CZ0 + 2), { p: [(CX0 + CX1) / 2, CT - 0.8, (CZ0 + CZ1) / 2] }));
    cw.push(applyM(new T.BoxGeometry(CX1 - CX0, 1.6, CZ1 - CZ0 - 1), { p: [(CX0 + CX1) / 2, 0.8, (CZ0 + CZ1) / 2] }));
    for (let i = 0; i < 6; i++) cw.push(applyM(new T.BoxGeometry(0.9, CT - 3, 0.6), { p: [CX0 + 4.5 + i * 9, CT / 2, CZ1 + 0.2] }));
    V.add(mesh(mergeGeos(cw), woodMat('#E9B98A', { rough: 0.45 })));
    // boutons cousus sur le devant du comptoir
    for (let i = 0; i < 5; i++) { const b = sewnButton(1.05, [PINK, BUTTER, LILAC, CORAL, '#FFFFFF'][i], { holes: 4, thread: '#FFFFFF' }); at(b, CX0 + 9 + i * 9, 6.5, CZ1 + 0.55); V.add(noCast(b)); }

    // le grand bocal, qui se remplit
    const BJ = { x: -12, y: CT, z: -3, r: 6.4, h: 17 };
    const big = mesh(jarGeo(BJ.r, BJ.h), gm, { cast: false });
    big.renderOrder = 2;
    at(big, BJ.x, BJ.y, BJ.z);
    V.add(big);
    const bigLid = new T.Group();
    const lidTop = mesh(new T.CylinderGeometry(BJ.r * 0.78, BJ.r * 0.8, 1.1, 24), wool(PINK, 'weave', { scale: 0.7 }));
    const lidSkirt = mesh(latheGeo([[BJ.r * 0.84, -1.4], [BJ.r * 0.95, -0.9], [BJ.r * 0.86, 0.2], [BJ.r * 0.8, 0.5]], { seg: 28, lump: 0.08, freq: 2 }), wool('#FFFFFF', 'crochet', { scale: 0.5, side: T.DoubleSide }));
    const knob = woolBall(1.2, CORAL, 'crochet', { fuzz: false, seg: 12 });
    knob.position.y = 1.4;
    bigLid.add(lidTop, lidSkirt, knob);
    const bow = mesh(new T.TorusGeometry(BJ.r * 0.7, 0.28, 6, 28), wool(MINT, 'yarn'));
    bow.rotation.x = Math.PI / 2; bow.position.y = -1.0;
    bigLid.add(bow);
    at(bigLid, BJ.x, BJ.y + BJ.h * 1.06 + 0.5, BJ.z);
    V.add(bigLid);
    // les bonbons du grand bocal (révélés de bas en haut)
    const fillW = [], fillB = [];
    const fr = rng(41);
    for (let k = 0; k < 150; k++) {
      const a = fr() * TAU, rr = Math.sqrt(fr()) * (BJ.r - 1.15), yy = 0.8 + (k / 150) * 14.2 + fr() * 0.6;
      const it = { y: yy, p: [BJ.x + Math.cos(a) * rr, BJ.y + yy, BJ.z + Math.sin(a) * rr], r: [fr() * 6, fr() * 6, fr() * 6], c: [PINK, MINT, BUTTER, LILAC, CORAL, '#FFFFFF', '#E8504E'][k % 7] };
      (k % 5 < 3 ? fillW : fillB).push(it);
    }
    const bigW = scatter(wrapGeo, candyMat, fillW.length, (i) => Object.assign({ s: 0.85 }, fillW[i]), { cast: false });
    const bigB = scatter(ballGeo, candyMat, fillB.length, (i) => Object.assign({ s: 1.25 }, fillB[i]), { cast: false });
    V.add(bigW, bigB);

    // bocal de sucres d'orge rayés
    const canes = new T.Group();
    const cj = mesh(jarGeo(3.4, 9), gm, { cast: false });
    cj.renderOrder = 2;
    canes.add(cj);
    [[-1.2, 0.8, 0.15, 0], [1.3, -0.4, -0.12, 2.2], [0.1, -1.2, 0.05, 4.1]].forEach(([x, z, tilt, ry], i) => {
      const cane = new T.Group();
      const path = [];
      for (let k = 0; k <= 14; k++) path.push([0, k * 1.2, 0]);
      for (let k = 1; k <= 10; k++) { const a = (k / 10) * Math.PI; path.push([1.6 - Math.cos(a) * 1.6, 16.8 + Math.sin(a) * 1.6, 0]); }
      cane.add(yarn(path, 0.55, '#FFFFFF', { radial: 8, tension: 0.2 }));
      const hx = [];
      const cv = curveOf(path, false, 0.2);
      for (let k = 0; k <= 160; k++) {
        const u = k / 160, pt = cv.getPointAt(u), tg = cv.getTangentAt(u);
        const nrm = v3(-tg.y, tg.x, 0).normalize(), bz = v3(0, 0, 1);
        const ph = u * 26 * TAU / 2;
        hx.push(pt.clone().addScaledVector(nrm, Math.cos(ph) * 0.52).addScaledVector(bz, Math.sin(ph) * 0.52));
      }
      cane.add(yarn(hx, 0.2, i === 1 ? '#3FAE7A' : '#E8414E', { radial: 5 }));
      at(cane, x, 0.6, z);
      cane.rotation.set(tilt, ry, tilt * 0.5);
      canes.add(cane);
    });
    at(canes, 1.5, CT, -3.5);
    V.add(noCast(canes));

    // seau de sucettes géantes, au premier plan
    const pail = new T.Group();
    const bucket = mesh(latheGeo([[0.01, 0], [5.6, 0], [6.6, 9], [6.9, 9.4], [0.01, 9.4]], { seg: 28 }), wool(BUTTER, 'knit', { scale: 0.5 }));
    pail.add(bucket);
    const band = mesh(new T.TorusGeometry(6.55, 0.5, 6, 30), wool(PINK, 'crochet'));
    band.rotation.x = Math.PI / 2; band.position.y = 8.6;
    pail.add(band);
    [[-2.6, 22, -0.2, -0.18, 6.2, [PINK, '#FFFFFF']], [2.8, 19, 0.6, 0.2, 5.6, [MINT, '#FFFFFF']], [0.2, 26, -1.5, 0.04, 5.0, [CORAL, BUTTER]]].forEach(([x, hgt, z, rz, R, cs]) => {
      const lp = lolly(R, cs, hgt);
      lp.position.set(x, hgt + R - 1, z);
      lp.rotation.z = rz;
      lp.rotation.y = x * 0.06;
      pail.add(lp);
    });
    at(pail, -33, 0, 13);
    pail.rotation.y = 0.25;
    V.add(lite(pail, 9, 0.5));
    const pailSh = contactShadow(16, 12, 0.45); at(pailSh, -33, 0.15, 13); V.add(pailSh);
    // bonbons semés sur le comptoir
    const loose = [];
    const lr = rng(9);
    for (let i = 0; i < 14; i++) loose.push({ p: [CX0 + 5 + lr() * 46, CT + 0.55, CZ0 + 3 + lr() * 9], r: [0, lr() * 6, 0], s: 0.95, c: [PINK, MINT, BUTTER, LILAC, CORAL][i % 5] });
    for (const q of loose) if (Math.abs(q.p[0] - BJ.x) < 8 || Math.abs(q.p[0] - 1.5) < 5) q.p[2] = CZ1 - 1.5;
    V.add(scatter(wrapGeo, candyMat, loose.length, (i) => loose[i]));

    // ---------- l'enseigne ronde, pendue au plafond ----------
    const sign = new T.Group();
    const sR = 7.4;
    const board = feltPiece(circleShape(sR), CREAM, { depth: 1.4, inset: 0.8, stitch: PINK, st: { len: 0.5, gap: 0.35, r: 0.08 } });
    const boardM = board.userData.body.material.clone();
    boardM.emissive = col('#FFE3B8'); boardM.emissiveIntensity = 0;
    board.userData.body.material = boardM;
    sign.add(board);
    const rim = mesh(new T.TorusGeometry(sR + 0.4, 0.7, 8, 44), wool(PINK, 'crochet', { scale: 0.6 }));
    sign.add(rim);
    // l'emblème : un bonbon emballé en feutrine
    const icon = new T.Group();
    icon.add(feltPiece(ellipseShape(3.1, 2.2), CORAL, { depth: 0.5, inset: 0.35, stitch: '#FFFFFF', st: { len: 0.3, gap: 0.2, r: 0.05 } }));
    for (const s of [-1, 1]) { const w = feltPiece(polyShape([[s * 2.6, 0], [s * 5.4, 2.0], [s * 4.9, 0], [s * 5.4, -2.0]]), BUTTER, { depth: 0.4, inset: 0.3, stitch: '#FFFFFF', st: { len: 0.3, gap: 0.2, r: 0.05 } }); w.position.z = -0.05; icon.add(w); }
    [[-1.2, 0.6], [0.9, -0.5], [0.4, 1.2]].forEach(([x, y]) => { const d = felt(circleShape(0.45), '#FFFFFF', 0.2, { fuzz: false, cast: false }); at(d, x, y, 0.3); icon.add(d); });
    at(icon, 0, 0, 0.75);
    sign.add(icon);
    const bulbN = 18;
    const bulbs = new T.InstancedMesh(new T.SphereGeometry(0.55, 10, 8), new T.MeshBasicMaterial({ color: col('#FFE6B0').multiplyScalar(3.2), toneMapped: false, fog: false }), bulbN);
    const bm4 = new T.Matrix4();
    for (let i = 0; i < bulbN; i++) { const a = (i / bulbN) * TAU; bm4.makeTranslation(Math.cos(a) * (sR + 0.4), Math.sin(a) * (sR + 0.4), 0.7); bulbs.setMatrixAt(i, bm4); bulbs.setColorAt(i, new T.Color(0.1, 0.08, 0.07)); }
    sign.add(bulbs);
    at(sign, 25, 41, -15);
    sign.rotation.y = -0.25;
    const hsign = hang(noCast(sign), 140, { amp: 0.9, per: 5.5, attach: sR + 0.9 });
    V.add(hsign); swingAnim(V, hsign);
    const signL = practical(V, [25, 38, -8], '#FFD9A0', 0, 60);
    const signHalo = halo(30, '#FFC98A', 0.55);
    at(signHalo, 25, 41, -18);
    signHalo.visible = false;
    V.add(signHalo);

    // ---------- suspensions ----------
    const lampsL = [];
    [[-24, -8, LILAC], [16, -10, MINT]].forEach(([x, z, c]) => {
      const g = new T.Group();
      g.add(mesh(latheGeo([[5.8, 0], [5.5, 0.5], [3.8, 3.4], [1.4, 5.6], [0.7, 6.4]], { seg: 26 }), wool(c, 'felt', { side: T.DoubleSide }), { cast: false }));
      const bulb = mesh(new T.SphereGeometry(1.5, 12, 9), glowMat('#FFE1A8', 4), { cast: false });
      bulb.position.y = 0.8;
      g.add(bulb);
      at(g, x, 57, z);
      const h = hang(g, 140, { amp: 0.35, per: 5 + x * 0.01, attach: 6.4 });
      V.add(h); swingAnim(V, h);
      lampsL.push(practical(V, [x, 54, z], '#FFD69C', 420, 100));
    });

    // ---------- la fillette ----------
    const KX = 16.5, KY = 5.2, KZ = 8;
    const kid = doll({ h: 18, skin: '#F6CDB0', top: MINT, dress: true, sleeves: PINK, legs: '#FFFFFF', shoes: '#E25C78', hair: '#B5532D', hairStyle: 'pigtails', ribbon: PINK, cheeks: '#F48C8C', collar: '#FFFFFF', mouth: 'o', buttons: { n: 2, color: PINK } });
    const K = kid.p;
    const oMouth = K.head.children.find((c) => c.geometry && c.geometry.type === 'TorusGeometry');
    // le grand sourire de la fin (bouche ouverte en feutrine)
    const hr = [kid.R, kid.R * 0.95, kid.R * 0.92];
    const mq = surf(hr, 0, -22);
    const smile = new T.Group();
    const mouthSh = new T.Shape();
    mouthSh.moveTo(-1, 0); mouthSh.quadraticCurveTo(0, -1.5, 1, 0); mouthSh.lineTo(-1, 0);
    smile.add(felt(mouthSh, '#8A2A2E', 0.12, { fuzz: false, cast: false }));
    const tongue = felt(ellipseShape(0.42, 0.24), '#F27C8E', 0.1, { fuzz: false, cast: false }); at(tongue, 0, -0.62, 0.05); smile.add(tongue);
    smile.scale.setScalar(kid.R * 0.3);
    faceTo(at(smile, mq.p.x, mq.p.y, mq.p.z), mq.n);
    smile.visible = false;
    K.head.add(smile);
    lite(kid.g, 0.75, 0.6);
    at(kid.g, KX, KY, KZ);
    kid.g.rotation.y = -0.5;
    V.add(kid.g);
    V.boilable(kid.g, 0.05, 0.6);
    const blinkK = blinker(K.eyes, 4);
    // son petit tabouret (pour bien voir le comptoir)
    const stool = new T.Group();
    const sw2 = [applyM(new T.CylinderGeometry(4.6, 4.6, 1.2, 24), { p: [0, KY - 0.6, 0] })];
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; sw2.push(applyM(new T.CylinderGeometry(0.55, 0.45, KY - 1.2, 8), { p: [Math.cos(a) * 3.2, (KY - 1.2) / 2, Math.sin(a) * 3.2], r: [Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1] })); }
    stool.add(mesh(mergeGeos(sw2), woodMat('#E9B98A', { rough: 0.45 })));
    const cushion = woolBall(1, LILAC, 'crochet', { sx: 4.5, sy: 0.9, sz: 4.5, fuzz: 0.1, seg: 20 });
    cushion.position.y = KY + 0.1;
    stool.add(cushion);
    at(stool, KX, 0, KZ);
    V.add(stool);
    const kidSh = contactShadow(12, 10, 0.4); at(kidSh, KX, 0.16, KZ); V.add(kidSh);
    // la sucette géante (cadeau de la fin), dans sa main droite
    const gift = lolly(6.2, [PINK, '#FFFFFF', MINT], 9);
    const giftG = new T.Group();
    giftG.add(gift);
    gift.position.y = 6.2 + 9 - 0.6;
    giftG.rotation.set(0, Math.PI, Math.PI);
    at(giftG, 0, -K.armR.userData.len - 0.3, 0.3);
    giftG.scale.setScalar(0.001);
    giftG.visible = false;
    K.armR.add(noCast(giftG));

    // ---------- pluie de bonbons (physique image par image) ----------
    const RN = P ? 1 : 70;
    const rainIM = new T.InstancedMesh(wrapGeo, candyMat, RN);
    rainIM.castShadow = true; rainIM.frustumCulled = false; rainIM.count = 0;
    V.add(rainIM);
    const drops = [];
    const groundAt = (x, z) => (x > CX0 - 1 && x < CX1 + 1 && z > CZ0 - 1 && z < CZ1 + 1 ? CT + 0.15 : 0);
    const rm4 = new T.Matrix4(), rq = new T.Quaternion(), re = new T.Euler(), rs = v3(), rcol = new T.Color();
    let rLast = null;
    V.anim((t) => {
      const steps = rLast == null ? 1 : Math.min(40, Math.max(0, Math.round((t - rLast) * FPS)));
      rLast = t;
      const dt = 1 / FPS;
      for (let s = 0; s < steps; s++) {
        for (const d of drops) {
          d.life += dt;
          if (d.life < 0 || d.rest) continue;
          d.v.y -= 75 * dt;
          d.p.addScaledVector(d.v, dt);
          d.r.x += d.w.x * dt; d.r.y += d.w.y * dt; d.r.z += d.w.z * dt;
          const fy = groundAt(d.p.x, d.p.z) + 0.55;
          if (d.p.y < fy) {
            d.p.y = fy;
            if (d.v.y < -14) { d.v.y *= -0.3; d.v.x *= 0.5; d.v.z *= 0.5; d.w.multiplyScalar(0.4); } else { d.rest = true; d.r.x = 0; d.r.z = 0; }
          }
        }
      }
      for (let i = drops.length - 1; i >= 0; i--) if (drops[i].life > drops[i].max) drops.splice(i, 1);
      let k = 0;
      for (const d of drops) {
        if (d.life < 0 || k >= RN) continue;
        const fade = d.max - d.life < 0.5 ? (d.max - d.life) / 0.5 : 1;
        re.set(d.r.x, d.r.y, d.r.z); rq.setFromEuler(re);
        rs.setScalar(0.9 * Math.max(0.01, fade));
        rm4.compose(d.p, rq, rs);
        rainIM.setMatrixAt(k, rm4);
        rainIM.setColorAt(k, d.c);
        k++;
      }
      rainIM.count = k;
      rainIM.instanceMatrix.needsUpdate = true;
      if (rainIM.instanceColor) rainIM.instanceColor.needsUpdate = true;
    });
    const candyRain = (n, x0, x1) => {
      if (P) return;
      for (let i = 0; i < n; i++) {
        if (drops.length >= RN) drops.shift();
        drops.push({ p: v3(lerp(x0, x1, Math.random()), 58 + Math.random() * 14, -12 + Math.random() * 26), v: v3((Math.random() - 0.5) * 6, -10 - Math.random() * 8, 0), r: v3(Math.random() * 6, Math.random() * 6, Math.random() * 6), w: v3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14), c: col([PINK, MINT, BUTTER, LILAC, CORAL, '#FFFFFF', '#E8504E'][i % 7]), life: -Math.random() * 1.2, max: 3.6 + Math.random() * 1.2, rest: false });
      }
    };

    // ---------- particules ----------
    let conf = null;
    if (!P) {
      pointCloud(V, { n: 70, box0: [-50, 4, -24], box1: [45, 62, 22], size: 0.8, color: '#FFE9D6', opacity: 0.35, vel: [0.25, 0.4, 0.15], beam: 0.6, keyDir: [-0.5, 0.75, 0.45] });
      conf = confetti(V, { kinds: ['disc', 'heart', 'star'], n: 40, size: 0.85 });
    }
    V.onHome = (c) => { if (conf) conf.burst(v3(BJ.x, BJ.y + BJ.h + 2, BJ.z), 7, [c, PINK, '#FFFFFF'], 0.45, 0.6); V.cue('lid'); };

    // ---------- animation ----------
    let shown = 0, done = false, bulbOn = 0, chase = 0, beatSide = 1;
    const dimB = new T.Color(0.1, 0.08, 0.07), litB = new T.Color(1, 0.9, 0.75), cB = new T.Color();
    V.anim((t, f) => {
      blinkK(t, f);
      const age = (n) => V.age(n);
      // la fillette se dandine, saute de joie aux réactions
      const hop = bump(sat(age('hop') / 0.45)) * 1.6;
      const jump = bump(sat(age('jump') / 0.6)) * 4.5;
      const dk = done ? sat(age('done') / 0.8) : 0;
      const party = done ? Math.abs(Math.sin(age('done') * 5.2)) * (age('done') < 4 ? 2.8 : 0.6) * sat((age('done') - 0.8) / 0.3) : 0;
      const nb = bump(sat(age('beat') / 0.3)) * 0.7;
      kid.g.position.set(KX, KY + 0.6 + hop + jump + party + nb, KZ);
      kid.g.rotation.set(0, -0.42 + Math.sin(t * 0.6) * 0.05, 0);
      const sq = 1 - bump(sat(age('hop') / 0.45)) * 0.05 + bump(sat((age('jump') - 0.5) / 0.3)) * 0.0;
      kid.g.scale.set(1, sq, 1);
      K.head.rotation.y = -0.32 + Math.sin(t * 0.5) * 0.12 + (done ? 0.4 * dk : 0);
      K.head.rotation.x = 0.12 + bump(sat(age('nod') / 0.5)) * 0.25;
      K.head.rotation.z = Math.sin(t * 1.1) * 0.06 + (age('beat') < 0.4 ? beatSide * 0.1 : 0);
      const up = bump(sat(age('jump') / 0.8));
      if (done) {
        K.armR.rotation.set(-2.5 * easeOut(dk), 0, 0.25);
        K.armL.rotation.set(-0.6 - up * 1.8, 0, -0.22 - Math.abs(Math.sin(age('done') * 5.2)) * 0.3);
      } else {
        K.armR.rotation.set(-0.95 - up * 1.6 + Math.sin(t * 2) * 0.05, 0, 0.22 + up * 0.4);
        K.armL.rotation.set(-0.35 - up * 1.6, 0, -0.22 - up * 0.4);
      }
      giftG.visible = done;
      giftG.scale.setScalar(Math.max(0.001, done ? easeOutBack(sat((age('done') - 0.3) / 0.6)) : 0.001));
      if (oMouth) oMouth.visible = !done;
      smile.visible = done;
      // le couvercle du grand bocal tinte
      const lk = sat(age('lid') / 0.35);
      bigLid.position.y = BJ.y + BJ.h * 1.06 + 0.5 + bump(lk) * 1.4;
      bigLid.rotation.z = bump(lk) * 0.12 * Math.sin(lk * 12);
      // l'enseigne : ampoules qui s'allument (en grésillant) et chenillard
      bulbOn = done ? sat((age('done') - 0.9) / 0.5) * (age('done') < 1.6 ? (hashi(f, 13) > 0.35 ? 1 : 0.2) : 1) : 0;
      for (let i = 0; i < bulbN; i++) {
        let on = 0;
        if (done) on = (Math.floor(t * 8) + i) % 3 === 0 ? 1 : 0.65;
        else if (age('beat') < 0.35) on = (i + chase) % 4 === 0 ? 0.9 : 0;
        cB.copy(dimB).lerp(litB, on * bulbOn + (1 - bulbOn) * on * 0.85);
        bulbs.setColorAt(i, cB);
      }
      bulbs.instanceColor.needsUpdate = true;
      boardM.emissiveIntensity = bulbOn * 0.18;
      signL.intensity = bulbOn * 260;
      signHalo.visible = bulbOn > 0.05;
      signHalo.material.opacity = bulbOn;
      lampsL.forEach((l, i) => { l.intensity = 420 * (0.97 + 0.03 * Math.sin(t * 1.7 + i)); });
    });

    const setFill = (k) => {
      bigW.count = Math.round(fillW.length * k);
      bigB.count = Math.round(fillB.length * k);
    };
    setFill(0);
    return {
      update(st, first) {
        shown = st.done ? 1 : st.p;
        setFill(shown);
        if (st.done && !done) { done = true; if (first) V.cues.done = -10; else V.cue('done'); }
        if (!st.done) done = false;
      },
      react(kind, st) {
        if (kind === 'correct' || kind === 'phrase') { V.cue('hop'); V.cue('nod'); V.cue('lid'); }
        if (kind === 'phrase') { V.cue('jump'); candyRain(26, -46, 34); if (conf) conf.burst(v3(BJ.x, BJ.y + BJ.h + 3, BJ.z), 10, [PINK, MINT, BUTTER, '#FFFFFF'], 0.6, 0.7); }
        if (kind === 'complete') {
          candyRain(60, -48, 36);
          if (conf) { conf.burst(v3(KX, 26, KZ), 26, [PINK, MINT, BUTTER, LILAC, '#FFFFFF'], 1.0, 1.0); conf.burst(v3(25, 38, -10), 18, [BUTTER, '#FFFFFF', PINK], 0.7, 0.8); }
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('beat');
        beatSide = n % 2 ? 1 : -1;
        chase = (chase + 1) % 4;
        V.cue('lid');
      },
    };
  },
};
