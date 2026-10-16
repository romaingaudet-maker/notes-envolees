/* ============ Frère Jacques : l'aube au monastère ============
   Frère Jacques dort dans sa cellule, au pied du clocher. Avec les notes
   retrouvées, le jour se lève : le soleil suspendu monte derrière les
   collines, la lune descend, la lumière passe du bleu nuit au rose doré.
   Deuxième phrase : il ronfle. Troisième : la cloche se met à se balancer.
   À la fin, il se réveille, saute du lit et sonne la cloche ; les
   colombes s'envolent. Pendant l'écoute, la cloche sonne sur chaque note. */
SCENES.aube = {
  color: '#3A3F78',
  view: {
    bg: '#1A1D45', fov: 26,
    rig: { target: [-7, 25, 0], az: 5, el: 8, box: [76, 54], targetWide: [-8, 24, 0], boxWide: [110, 49] },
    post: { exposure: 1.06, bloom: 0.8, bloomThr: 0.95, aper: 6, maxBlur: 10, sat: 1.1, lift: '#06061A', vignette: 0.45, punch: 1.28 },
  },
  sky: [-40, 4, 40, 50, -20, -6],
  home: [-32, 14, -2],
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
    // yeux fermés brodés (comme faceOn, mode sommeil) sur une tête ellipsoïdale
    const lidsOn = (head, r, spread, ey, er, ink) => {
      const out = new T.Group();
      for (const s of [-1, 1]) {
        const { p, n } = surf(r, s * spread, ey);
        const c = p.clone().add(n.clone().multiplyScalar(0.05));
        const t = v3(n.z, 0, -n.x).normalize().multiplyScalar(er * 1.3);
        out.add(yarn([c.clone().sub(t).add(v3(0, er * 0.35, 0)), c.clone().add(v3(0, -er * 0.3, 0)), c.clone().add(t).add(v3(0, er * 0.35, 0))], er * 0.28, ink, { radial: 5, cast: false }));
      }
      head.add(out);
      return out;
    };
    // cyclo() rend un drap aux faces tournées vers le fond (invisible depuis la caméra) : on retourne ses triangles
    const facing = (m) => { const ix = m.geometry.index; for (let i = 0; i < ix.count; i += 3) { const b = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, b); } ix.needsUpdate = true; m.geometry.computeVertexNormals(); return m; };
    const NIGHT = { top: '#090D33', mid: '#1A2462', bot: '#36437F', key: '#7C8EE0', fill: '#27316C', gr: '#141826', rim: '#8396FF', fog: '#1A2152' };
    const DAWN = { top: '#3A66D2', mid: '#E07A9C', bot: '#F6B262', key: '#FFC48C', fill: '#F0A89C', gr: '#5A4636', rim: '#FF9FB0', fog: '#C98A86' };

    // ---------- lumière (elle suivra le lever du jour) ----------
    const L = studioLights(V, {
      key: { color: NIGHT.key, k: 1.1, az: 35, el: 34, area: 66 },
      fill: { sky: NIGHT.fill, ground: NIGHT.gr, k: 0.65 },
      rim: { color: NIGHT.rim, k: 0.9, az: -160, el: 30 },
      env: { sky: '#3A4278', ground: '#2A2228', k: 0.42, boxK: 2.5 },
      fog: { color: NIGHT.fog, near: 200, far: 480 },
    });
    const keyTarget = L.key.target.position.clone();

    // ---------- le ciel, les collines, la lune et le soleil ----------
    const sky = facing(cyclo({ w: 520, h: 105, z: -96, r: 34, floor: 40, top: NIGHT.top, mid: NIGHT.mid, bottom: NIGHT.bot, y: -2, scale: 3 }));
    V.add(sky);
    const skyC = sky.geometry.attributes.color, skyP = sky.geometry.attributes.position;
    const grad = (pal, t, out) => { const a = col(pal.bot), b = col(pal.mid), c = col(pal.top); if (t < 0.5) out.copy(a).lerp(b, smooth(t * 2)); else out.copy(b).lerp(c, smooth((t - 0.5) * 2)); return out; };
    const skyN = [], skyD = [];
    { const c = new T.Color(); for (let i = 0; i < skyP.count; i++) { const t = sat((skyP.getY(i) + 2) / 105); grad(NIGHT, t, c); skyN.push(c.r, c.g, c.b); grad(DAWN, t, c); skyD.push(c.r, c.g, c.b); } }
    const far = flatLayer(hillShape(300, 26, 5, 11), '#2E3A6E', { depth: 1, inset: 1.2, stitch: '#4A5A99' });
    at(far, 10, 0, -70);
    V.add(noCast(far));
    const near = flatLayer(hillShape(260, 16, 4, 5), '#3C5A5C', { depth: 1, inset: 1.2, stitch: '#5E8080' });
    at(near, -20, 0, -50);
    V.add(noCast(near));
    // cyprès de feutrine sur les collines
    [[-58, -47, 1.0], [-50, -46, 0.75], [44, -48, 0.9]].forEach(([x, z, s]) => {
      const c = mesh(latheGeo([[0.01, 0], [2.4, 1], [3.2, 6], [2.6, 14], [1.2, 20], [0.01, 23]], { seg: 12, lump: 0.08 }), wool('#2F4A3C', 'knit', { scale: 0.7 }), { cast: false });
      c.scale.setScalar(s);
      at(c, x, 6, z);
      V.add(c);
    });
    // le soleil, endormi lui aussi, qui monte au bout de son fil
    const sunG = new T.Group();
    const SR = 7;
    const sunBody = feltPiece(circleShape(SR), '#FFC23C', { depth: 2, inset: 0.9, stitch: '#F08A24', st: { len: 0.7, gap: 0.4, r: 0.1 } });
    const sunM = sunBody.userData.body.material.clone();
    sunM.emissive = col('#FF9A2E'); sunM.emissiveIntensity = 0.5;
    sunBody.userData.body.material = sunM;
    sunG.add(sunBody);
    const rays = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r0 = SR * 1.15, r1 = SR * (i % 2 ? 1.5 : 1.72); rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.08) * (r0 + r1) / 2, Math.sin(a + 0.08) * (r0 + r1) / 2, 0.3], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.42, { radial: 6 })); }
    sunG.add(mesh(mergeGeos(rays), wool('#FFB22C', 'yarn', { emissive: '#FF8A1E', emissiveIntensity: 0.35 })));
    const sunLids = new T.Group(), sunEyes = new T.Group();
    for (const s of [-1, 1]) {
      sunLids.add(yarn([[s * 2.5 - 1.0, 1.1, 1.05], [s * 2.5, 0.5, 1.2], [s * 2.5 + 1.0, 1.1, 1.05]], 0.22, '#7A3A14', { radial: 5, cast: false }));
      const e = bead(0.7, '#2A1408'); at(e, s * 2.5, 0.9, 1.1); sunEyes.add(e);
      const c = felt(circleShape(1.0), '#F2774E', 0.12, { fuzz: false, cast: false }); at(c, s * 4.0, -1.2, 1.04); sunG.add(c);
    }
    sunG.add(sunLids, sunEyes, yarn([[-1.6, -2.0, 1.05], [0, -3.0, 1.2], [1.6, -2.0, 1.05]], 0.22, '#7A3A14', { radial: 5, cast: false }));
    sunEyes.visible = false;
    const SUN0 = 13, SUN1 = 46, SUNLEN = 150 - SUN0;
    at(sunG, -21, SUN0, -58);
    const hsun = hang(noCast(sunG), 150, { amp: 1.0, per: 6, attach: SR * 1.6 });
    V.add(hsun); swingAnim(V, hsun);
    const sunHalo = halo(34, '#FFB05A', 0.6);
    V.add(sunHalo);
    // la lune, qui se couche
    const mn = moon({ r: 5.5, color: '#F6EFC8', stitch: '#D2BE72' });
    at(mn, 25, 50, -66);
    const hmn = hang(noCast(mn), 160, { amp: 1.2, per: 5 });
    V.add(hmn); swingAnim(V, hmn);

    // ---------- le sol ----------
    const ground = terrain({ w: 320, d: 150, nx: 34, nz: 20, colors: ['#5E8A4E', '#557F47'], bands: 9, rough: 0.5, scale: 1.8 });
    V.add(ground);
    V.add(grass({ n: 46, area: [-80, 60, 9, 30], colors: ['#6FA35C', '#5E954F', '#86B86B'], scale: 0.7 }));

    // ---------- la cellule de frère Jacques (maison de poupée ouverte) ----------
    const STONE = '#CDBEA4', RY = 26.4;
    const cell = new T.Group();
    V.add(cell);
    const backW = wallPanel(46, 30, [[-12, 10, 8, 9, true]], { color: STONE, depth: 3, scale: 0.9, bump: 1.2 });
    at(backW, -18, 0, -18);
    cell.add(backW);
    // mur de gauche, taillé sous la pente du toit
    const yF = RY - (5 + 5.5) * Math.tan(0.32) - 0.5, yB = RY + 13.5 * Math.tan(0.32) - 0.5;
    const sideW = mesh(feltGeo(polyShape([[19, 0], [-5, 0], [-5, yF], [19, yB]]), 3, { bevel: 0.4 }), wool('#BFAF94', 'knit', { scale: 0.9 }));
    sideW.rotation.y = Math.PI / 2;
    at(sideW, -42.5, 0, 0);
    cell.add(sideW);
    const cellFloor = mesh(new T.BoxGeometry(46, 1.4, 24), woodMat('#A97B52', { rough: 0.6 }), { cast: false });
    at(cellFloor, -18, 0.7, -7);
    cell.add(cellFloor);
    // le toit : tuiles de feutrine en écailles
    const roof = mesh(new T.BoxGeometry(52, 1.6, 30), wool('#B4573A', 'knit', { scale: 0.7 }));
    roof.rotation.x = 0.32;
    at(roof, -18, RY, -5.5);
    cell.add(roof);
    const tileSh = new T.Shape();
    tileSh.moveTo(-2, 0); tileSh.lineTo(2, 0); tileSh.lineTo(2, -2.6); tileSh.absarc(0, -2.6, 2, 0, Math.PI, true); tileSh.lineTo(-2, 0);
    const tileGeo = feltGeo(tileSh, 0.45, { bevel: 0.15, bevelSeg: 1, curve: 6 });
    const tiles = [];
    for (let row = 0; row < 6; row++) for (let i = 0; i < 13; i++) {
      const u = row / 5, zz = -18 + u * 24.5, yy = RY + 0.85 - (zz + 5.5) * Math.tan(0.32);
      tiles.push({ p: [-42 + i * 4 + (row % 2) * 2, yy + 0.25, zz], r: [-Math.PI / 2 + 0.32 + 0.18, 0, 0], s: 1, c: new T.Color().setHSL(0.03 + (hashi(row, i, 2) - 0.5) * 0.02, 0.55, 0.42 + hashi(row, i, 3) * 0.08) });
    }
    cell.add(scatter(tileGeo, wool('#FFFFFF', 'felt', { sheen: 0.4, sheenColor: '#553322' }), tiles.length, (i) => tiles[i]));
    // la fenêtre de la cellule
    const wf = [];
    const arch = new T.Shape();
    arch.moveTo(-5.2, -1.2); arch.lineTo(5.2, -1.2); arch.lineTo(5.2, 5); arch.absarc(0, 5, 5.2, 0, Math.PI, false); arch.lineTo(-5.2, -1.2);
    const archH = new T.Path();
    archH.moveTo(-4, 0); archH.lineTo(4, 0); archH.lineTo(4, 5); archH.absarc(0, 5, 4, 0, Math.PI, false); archH.lineTo(-4, 0);
    arch.holes.push(archH);
    wf.push(applyM(feltGeo(arch, 1.6, { bevel: 0.3, curve: 16 }), { p: [-30, 10, -16.2] }));
    wf.push(applyM(new T.BoxGeometry(0.7, 9, 0.8), { p: [-30, 14.5, -16.6] }));
    wf.push(applyM(new T.BoxGeometry(12, 1.2, 3.6), { p: [-30, 9.4, -15.4] }));
    // étagère et livres
    wf.push(applyM(new T.BoxGeometry(14, 1, 4), { p: [-8, 16.5, -15.2] }));
    cell.add(mesh(mergeGeos(wf), woodMat('#8A6040', { rough: 0.6 })));
    const books = [];
    [['#7A3B3B', 1.4, 5.2], ['#3F5A7A', 1.1, 4.4], ['#6A7A3B', 1.6, 5.8], ['#8C6A3A', 1.2, 4.0]].forEach(([c, w, h], i) => books.push({ p: [-13 + i * 1.9, 17 + h / 2, -15.2], r: [0, 0, i === 3 ? -0.3 : 0], s: [w, h, 3.2], c }));
    cell.add(scatter(new T.BoxGeometry(1, 1, 1), wool('#FFFFFF', 'felt', { sheen: 0.3, sheenColor: '#443322' }), books.length, (i) => books[i]));

    // le lit
    const bed = [];
    bed.push(applyM(new T.BoxGeometry(26, 2, 12.4), { p: [-27, 4.4, -8] }));
    for (const x of [-40.5, -13.5]) for (const z of [-14, -2]) bed.push(applyM(new T.BoxGeometry(1.4, x < -20 ? 15 : 10, 1.4), { p: [x, x < -20 ? 7.5 : 5, z] }));
    const hb = new T.Shape(); hb.moveTo(-6, 0); hb.lineTo(6, 0); hb.lineTo(6, 6); hb.quadraticCurveTo(0, 10, -6, 6); hb.lineTo(-6, 0);
    bed.push(applyM(feltGeo(hb, 1.2, { bevel: 0.3 }), { p: [-40.5, 5.4, -8], r: [0, Math.PI / 2, 0] }));
    bed.push(applyM(new T.BoxGeometry(1.2, 5, 11), { p: [-13.5, 7.5, -8] }));
    cell.add(mesh(mergeGeos(bed), woodMat('#9A6B45', { rough: 0.55 })));
    const matt = mesh(new T.BoxGeometry(25, 2.6, 11.6), wool('#EFE6D2', 'weave', { scale: 0.8 }), { cast: false });
    at(matt, -27, 6.7, -8);
    cell.add(matt);
    const pillow = woolBall(1, '#FFFFFF', 'crochet', { sx: 4.6, sy: 2.0, sz: 5.4, seed: 3, fuzz: 0.1, seg: 20 });
    at(pillow, -36.5, 9.2, -8);
    cell.add(pillow);
    const quilt = woolBall(1, '#7E9FC9', 'knit', { sx: 10.8, sy: 4.4, sz: 6.9, seed: 5, fuzz: 0.1, seg: 24, mat: { scale: 0.55 } });
    at(quilt, -22.6, 9.4, -7.0);
    cell.add(quilt);
    const sheet = woolBall(1, '#F4EEDF', 'crochet', { sx: 1.8, sy: 4.0, sz: 6.6, seed: 6, fuzz: 0.08, seg: 18 });
    at(sheet, -31.6, 10.2, -6.9);
    sheet.rotation.z = -0.35;
    cell.add(sheet);
    // petites pièces de patchwork cousues sur la couverture
    [[-25, 12.6, -2.6, '#E9B44C'], [-18.5, 12.2, -1.6, '#D0675A'], [-21.5, 13.6, -6.0, '#E9E1CF']].forEach(([x, y, z, c], i) => {
      const pc = feltPiece(roundRectShape(3.2, 3.2, 0.5), c, { depth: 0.2, inset: 0.3, stitch: '#FFFFFF', st: { len: 0.25, gap: 0.18, r: 0.04 } });
      at(pc, x, y, z);
      pc.rotation.set(-0.9, 0, (i - 1) * 0.3);
      cell.add(noCast(pc));
    });
    // le tabouret et la bougie
    const stool = [applyM(new T.CylinderGeometry(3, 3, 0.9, 18), { p: [0, 7.5, 0] })];
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; stool.push(applyM(new T.CylinderGeometry(0.4, 0.35, 7.2, 6), { p: [Math.cos(a) * 2, 3.6, Math.sin(a) * 2] })); }
    const stoolM = mesh(mergeGeos(stool), woodMat('#8A6040'));
    at(stoolM, -9.5, 1.4, -6);
    cell.add(stoolM);
    const holder = new T.Group();
    holder.add(mesh(latheGeo([[0, 0], [1.6, 0], [1.7, 0.3], [0.5, 0.4], [0.45, 1.0], [0, 1.0]], { seg: 16 }), metalMat('#C9A54A', { rough: 0.4 })));
    const candle = mesh(new T.CylinderGeometry(0.5, 0.55, 3.4, 12), wool('#FFF4DA', 'felt'));
    candle.position.y = 2.5;
    holder.add(candle);
    const fl = flame(V, { s: 0.8, power: 340, dist: 55 });
    fl.position.y = 4.3;
    holder.add(fl);
    at(holder, -9.5, 9.85, -6);
    cell.add(holder);
    // les sabots, au pied du lit
    for (const s of [-1, 1]) { const c = woolBall(1, '#6E4A2E', 'felt', { sx: 1.2, sy: 0.7, sz: 2.0, fuzz: false, seg: 12 }); at(c, -20 + s * 1.6, 2.0, 1.6); c.rotation.y = s * 0.2; cell.add(c); }
    const rug = mesh(new T.CylinderGeometry(7, 7, 0.3, 32), wool('#B8574A', 'crochet', { scale: 0.9 }), { cast: false });
    scaleUV(rug.geometry, 14, 14);
    rug.scale.z = 0.55;
    at(rug, -20, 1.55, 0);
    cell.add(rug);
    lite(cell, 0.9, 0.7);

    // ---------- le clocher ----------
    const tower = new T.Group();
    V.add(tower);
    const TX = 15, TZ = -5, TW = 18, TH = 44;
    const tFront = wallPanel(TW, TH, [[0, 0, 9, 13, true], [0, 27, 11, 14, true]], { color: '#D6C7AC', depth: 3, scale: 0.9, bump: 1.2 });
    at(tFront, TX, 0, TZ + 9);
    tower.add(tFront);
    for (const s of [-1, 1]) { const sd = mesh(new T.BoxGeometry(3, TH, 18), wool(s < 0 ? '#C2B398' : '#B5A68C', 'knit', { scale: 0.9 })); scaleUV(sd.geometry, 18, TH); at(sd, TX + s * 7.5, TH / 2, TZ); tower.add(sd); }
    const tBack = mesh(new T.BoxGeometry(TW, TH, 2), wool('#5A4E44', 'knit', { scale: 0.9 }));
    at(tBack, TX, TH / 2, TZ - 8);
    tower.add(tBack);
    // pierres de feutrine cousues sur la façade
    const stGeo = blobGeo(1, 0.62, 0.3, { seg: 10, lump: 0.1, seed: 4 });
    const stones = [];
    const sr = rng(23);
    for (let j = 0; j < 15; j++) for (let i = 0; i < 4; i++) {
      const x = -6.6 + i * 4.4 + (j % 2) * 2.2 + (sr() - 0.5), y = 1.6 + j * 2.9;
      if (Math.abs(x) < 5.6 && y < 14.5) continue;
      if (Math.abs(x) < 6.6 && y > 26 && y < 42.5) continue;
      if (Math.abs(x) > 8.2) continue;
      stones.push({ p: [TX + x, y, TZ + 10.55], r: [0, 0, (sr() - 0.5) * 0.3], s: [1.7 + sr() * 0.4, 1.15, 1], c: new T.Color().setHSL(0.09, 0.18 + sr() * 0.1, 0.6 + sr() * 0.12) });
    }
    tower.add(scatter(stGeo, wool('#FFFFFF', 'felt', { sheen: 0.3, sheenColor: '#665544' }), stones.length, (i) => stones[i], { cast: false }));
    // corniche et flèche d'ardoise
    const tw = [applyM(new T.BoxGeometry(TW + 3, 1.6, 21), { p: [TX, TH + 0.8, TZ] }), applyM(new T.BoxGeometry(TW + 1, 1.2, 4), { p: [TX, 26.4, TZ + 10] })];
    tower.add(mesh(mergeGeos(tw), wool('#E3D6BE', 'knit', { scale: 0.8 })));
    const spire = mesh(new T.ConeGeometry(14, 18, 4, 1), wool('#4F5C7E', 'knit', { scale: 0.7 }));
    spire.rotation.y = Math.PI / 4;
    at(spire, TX, TH + 1.6 + 9, TZ);
    tower.add(spire);
    const ball = woolBall(1, '#D8A93A', 'felt', { fuzz: false, seg: 12 });
    at(ball, TX, TH + 1.6 + 18.6, TZ);
    tower.add(ball);
    // l'intérieur sombre du beffroi, la poutre, la cloche
    const inner = mesh(new T.PlaneGeometry(13, 16), wool('#3A3030', 'knit'), { cast: false });
    at(inner, TX, 34.5, TZ - 4);
    tower.add(inner);
    const beam = mesh(new T.BoxGeometry(13, 1.6, 1.6), woodMat('#6E4A30'));
    at(beam, TX, 41.4, TZ + 2);
    tower.add(beam);
    const bellPiv = new T.Group();
    at(bellPiv, TX, 41.2, TZ + 2);
    tower.add(bellPiv);
    const bellProf = [[0.01, -9.4], [4.9, -9.4], [5.0, -9.0], [4.4, -8.2], [3.6, -6.2], [3.0, -3.6], [2.8, -1.6], [2.2, -0.6], [0.01, -0.2]];
    const bellM = metalMat('#C99A45', { rough: 0.32 });
    bellPiv.add(mesh(latheGeo(bellProf, { seg: 30 }), bellM));
    // l'intérieur de la cloche (on le voit quand elle bascule)
    bellPiv.add(mesh(latheGeo(bellProf.map(([r, y]) => [Math.max(0.01, r - 0.3), y]).reverse(), { seg: 30 }), bellM, { cast: false }));
    const lip = mesh(new T.TorusGeometry(4.75, 0.35, 6, 30), bellM);
    lip.rotation.x = Math.PI / 2; lip.position.y = -9.1;
    bellPiv.add(lip);
    const yoke = mesh(new T.BoxGeometry(3.4, 1.4, 2), woodMat('#6E4A30'));
    bellPiv.add(yoke);
    const clapPiv = new T.Group();
    clapPiv.position.y = -1.6;
    bellPiv.add(clapPiv);
    clapPiv.add(yarn([[0, 0, 0], [0, -6.0, 0]], 0.22, '#5A4A3A', { radial: 5 }));
    const clap = mesh(new T.SphereGeometry(0.85, 12, 9), metalMat('#7A6A55', { rough: 0.5 }));
    clap.position.y = -6.6;
    clapPiv.add(clap);
    const bellL = practical(V, [TX, 36, TZ + 9], '#FFE2A8', 0, 40);
    // la corde de la cloche, jusqu'à la porte
    const rope = yarn([[TX + 1.6, 40.6, TZ + 3], [TX + 1.6, 27, TZ + 3.4], [TX + 1.4, 14, TZ + 6], [TX - 0.6, 11.5, TZ + 11.5], [TX - 1.6, 13.5, TZ + 13.6]], 0.28, '#D9C294', { radial: 6 });
    tower.add(rope);
    const tassel = woolBall(0.9, '#C8463C', 'crochet', { sy: 1.4, fuzz: 0.15, seg: 10 });
    at(tassel, TX - 1.7, 12.4, TZ + 13.8);
    tower.add(tassel);
    // traits « ding » de part et d'autre de la cloche
    const dingG = (s) => {
      const geos = [0, 1, 2].map((k) => applyM(new T.TorusGeometry(3 + k * 1.6, 0.26, 5, 10, 1.0), { r: [0, 0, s < 0 ? Math.PI - 0.5 : -0.5] }));
      const m = mesh(mergeGeos(geos), wool('#FFF1C2', 'yarn', { emissive: '#FFD27A', emissiveIntensity: 0.6 }), { cast: false });
      m.visible = false;
      at(m, TX + s * 7.4, 35.5, TZ + 11.5);
      V.add(m);
      return m;
    };
    const dings = [dingG(-1), dingG(1)];
    lite(tower, 0.9, 0.7);

    // ---------- frère Jacques ----------
    const jac = doll({ h: 15, skin: '#F2C7A5', top: '#8A5A3A', dress: true, sleeves: '#8A5A3A', belt: '#E9DAB2', legs: '#7A4E32', shoes: '#5A3A28', hairStyle: 'tonsure', hair: '#9A6A44', hat: { type: 'night', color: '#ECE3CF', pompom: '#C8463C' }, cheeks: '#F08A80', mouth: 'o' });
    const J = jac.p;
    const jhr = [jac.R, jac.R * 0.95, jac.R * 0.92];
    const jLids = lidsOn(J.head, jhr, 22, 2, jac.R * 0.12, '#3A2418');
    J.eyes.forEach((e) => { e.visible = false; });
    const jO = J.head.children.find((c) => c.geometry && c.geometry.type === 'TorusGeometry');
    const jq = [-10, 0, 10].map((a, i) => { const q = surf(jhr, a, -24 - (i === 1 ? 6 : 0)); return q.p.add(q.n.multiplyScalar(0.06)); });
    const jSmile = yarn(jq, jac.R * 0.04, '#3A1E16', { radial: 5, cast: false });
    jSmile.visible = false;
    J.head.add(jSmile);
    lite(jac.g, 0.75, 0.6);
    const jPiv = new T.Group();
    jPiv.add(jac.g);
    jac.g.position.y = -jac.legH;
    V.add(jPiv);
    V.boilable(jPiv, 0.04, 0.5);
    const blinkJ = blinker(J.eyes, 6);
    // pose au lit : couché sur le côté, la tête sur l'oreiller, tournée vers nous
    const BED = { x: -36.0 + jac.R * 0.4 + (jac.bodyH + jac.R * 0.88), y: 10.2, z: -6.6 };

    // ---------- colombes ----------
    const doves = [];
    [[TX - 5.6, 27.0, TZ + 10.8, 0.5], [TX + 5.4, 27.0, TZ + 10.8, -0.4], [-28, 27.6, -6, 0.2]].forEach(([x, y, z, ry], i) => {
      const d = bird({ r: 1.9, color: '#F3F0EA', belly: '#FFFFFF', wing: '#DAD6CC', beak: '#E8A33C', legs: false, eyeR: 0.17, cheeks: '#F2A7A7' });
      // petites et lointaines : ni duvet ni ombre (économie d'appels de dessin)
      lite(d.g, 50, 50);
      at(d.g, x, y, z);
      d.g.rotation.y = ry;
      V.add(d.g);
      V.boilable(d.g, 0.03, 0.5);
      doves.push({ d, home: v3(x, y, z), ry, ph: i * 1.3, dir: i === 2 ? -1 : 1 });
    });

    // ---------- les « Z » du ronflement ----------
    const zs = [];
    const zSh = (w, h, k) => polyShape([[0, 0], [w, 0], [w, k], [k * 1.9, k], [w, h - k], [w, h], [0, h], [0, h - k], [w - k * 1.9, h - k], [0, k]].map(([x, y]) => [x - w / 2, y - h / 2]));
    const zMat = wool('#DDE6FF', 'felt', { sheen: 0.6 }).clone();
    zMat.emissive = col('#9FB4FF'); zMat.emissiveIntensity = 0.35;
    for (let i = 0; i < 4; i++) {
      const g = new T.Group();
      const sh = zSh(2.6, 2.8, 0.7);
      g.add(mesh(feltGeo(sh, 0.45), zMat, { cast: false }));
      g.add(stitches(insetPoly(outline2D(sh, 40), 0.16), 0.24, '#6F82D8', { len: 0.22, gap: 0.16, r: 0.035 }));
      g.visible = false;
      V.add(g);
      zs.push(g);
    }

    // ---------- particules ----------
    let stars = null, motes = null, conf = null;
    if (!P) {
      stars = pointCloud(V, { n: 90, box0: [-160, 40, -90], box1: [160, 130, -80], size: 1.6, sprite: 'spark', color: '#FFF4CC', glow: 1.6, twinkle: 1, wander: 0, vel: [0, 0, 0], opacity: 0.9 });
      motes = pointCloud(V, { n: 60, box0: [-60, 2, -20], box1: [40, 50, 20], size: 0.8, color: '#FFE2C0', opacity: 0.0, vel: [0.3, 0.4, 0.1], beam: 0.5, keyDir: [-0.6, 0.5, 0.6] });
      conf = confetti(V, { kinds: ['disc', 'star', 'leaf'], n: 40, size: 0.85 });
    }
    V.onHome = (c) => { if (conf) conf.burst(v3(-30, 18, -4), 6, [c, '#FFFFFF', '#FFD38C'], 0.4, 0.5); };

    // ---------- animation ----------
    let dayT = 0, day = 0, snore = false, swing = false, done = false, ringSide = 1, lastBell = 0, lastVel = 0;
    const cN = new T.Color(), cD = new T.Color(), tmp = new T.Color();
    const mix = (a, b, k) => tmp.copy(col(a)).lerp(col(b), k);
    let skyK = -1, lastT = null;
    V.anim((t, f) => {
      blinkJ(t, f);
      // le jour se lève (en douceur vers la cible, en secondes de film)
      const dt = lastT == null ? 1 / FPS : clamp(t - lastT, 0, 3);
      lastT = t;
      day += (dayT - day) * (1 - Math.exp(-dt * 1.5));
      // la couleur tarde un peu (le mélange se fait en lumière linéaire, qui éclaircit vite)
      const k = Math.pow(smooth(day), 1.6);
      if (Math.abs(k - skyK) > 0.002) {
        skyK = k;
        for (let i = 0; i < skyC.count; i++) skyC.setXYZ(i, lerp(skyN[i * 3], skyD[i * 3], k), lerp(skyN[i * 3 + 1], skyD[i * 3 + 1], k), lerp(skyN[i * 3 + 2], skyD[i * 3 + 2], k));
        skyC.needsUpdate = true;
        L.key.color.copy(mix(NIGHT.key, DAWN.key, k));
        L.fill.color.copy(mix(NIGHT.fill, DAWN.fill, k));
        L.fill.groundColor.copy(mix(NIGHT.gr, DAWN.gr, k));
        L.rim.color.copy(mix(NIGHT.rim, DAWN.rim, k));
        V.scene.fog.color.copy(mix(NIGHT.fog, DAWN.fog, k));
        V.scene.background.copy(mix('#1A1D45', '#F2B8A8', k));
        V.post.lift = '#' + mix('#06061A', '#140806', k).getHexString();
      }
      L.key.intensity = lerp(1.1, 1.75, k);
      L.fill.intensity = lerp(0.65, 0.48, k);
      V.post.exposure = lerp(1.06, 0.98, k);
      L.rim.intensity = lerp(0.9, 1.3, k);
      const az = lerp(35, -40, k) * DEG, el = lerp(34, 30, k) * DEG;
      L.key.position.set(keyTarget.x + Math.sin(az) * Math.cos(el) * 400, keyTarget.y + Math.sin(el) * 400, keyTarget.z + Math.cos(az) * Math.cos(el) * 400);
      const sy = lerp(SUN0, SUN1, day);
      hsun.userData.pivot.position.y = sy + SUNLEN;
      sunHalo.position.set(hsun.userData.pivot.position.x, sy, -64);
      sunHalo.material.opacity = sat(day * 1.6) * 0.7;
      V.scene.fog.near = lerp(200, 260, k); V.scene.fog.far = lerp(480, 620, k);
      sunM.emissiveIntensity = 0.4 + k * 0.5;
      hmn.userData.pivot.position.y = 160 - k * 46;
      if (stars) stars.obj.material.uniforms.uOpacity.value = 0.9 * (1 - k);
      if (motes) motes.obj.material.uniforms.uOpacity.value = 0.4 * k;
      // la bougie s'éteint quand il se lève (on coupe la puissance : la lumière reste dans la scène)
      const lit = !done || V.age('done') < 0.5;
      fl.children.forEach((c) => { if (c.isMesh) c.visible = lit; });
      fl.userData.power = lit ? 340 : 0;
      // frère Jacques
      const W = done ? V.age('done') : -1;
      const wake = W >= 0;
      sunEyes.visible = wake; sunLids.visible = !wake;
      jLids.visible = !wake;
      J.eyes.forEach((e) => { e.visible = wake; });
      if (jO) jO.visible = !wake;
      jSmile.visible = wake;
      const br = Math.sin(t * (snore ? 1.6 : 1.2));
      quilt.scale.y = 1 + br * (snore ? 0.05 : 0.02);
      quilt.scale.y *= wake ? 1 - 0.35 * sat(W / 0.5) : 1;
      if (!wake) {
        jPiv.position.set(BED.x, BED.y + br * 0.1, BED.z);
        jPiv.rotation.set(0, 0, Math.PI / 2);
        J.head.rotation.set(0.1, 0.25, -0.95 + br * 0.03);
        J.armL.rotation.set(0, 0, -0.2); J.armR.rotation.set(0, 0, 0.2);
        jac.g.scale.set(1, 1, 1);
      } else {
        // se redresse, saute du lit, court sonner la cloche
        const sitK = easeOut(sat(W / 0.45));
        const jk = sat((W - 0.55) / 0.7);
        const land = v3(TX - 4.6, 0, 11.5);
        const from = v3(BED.x, BED.y, BED.z);
        if (W < 0.55) {
          jPiv.position.set(BED.x - sitK * 3, BED.y + sitK * 2, BED.z);
          jPiv.rotation.set(0, 0, (Math.PI / 2) * (1 - sitK));
        } else if (jk < 1) {
          const e = easeInOut(jk);
          jPiv.position.set(lerp(from.x - 3, land.x, e), lerp(from.y + 2, land.y + jac.legH, e) + bump(jk) * 16, lerp(from.z, land.z, e));
          jPiv.rotation.set(0, lerp(0, -0.5, e), -jk * TAU * 0.0);
        } else {
          const pull = W > 1.4 ? Math.abs(Math.sin((W - 1.4) * 5)) : 0;
          const land2 = sat((W - 1.25) / 0.2);
          jPiv.position.set(land.x, land.y + jac.legH + pull * 1.4 + (W < 4 ? 0 : Math.abs(Math.sin(W * 4)) * 0.6), land.z);
          jPiv.rotation.set(0, 0.35 + Math.sin(W * 1.3) * 0.06, 0);
          jac.g.scale.set(1, 1 - bump(land2) * 0.12, 1);
        }
        J.head.rotation.set(W > 1.25 ? -0.15 : 0, W > 1.25 ? 0.3 : 0, Math.sin(W * 3) * 0.06);
        const up = W > 1.25 ? 1 : sat(W / 0.5);
        J.armR.rotation.set(-2.6 * up + (W > 1.4 ? Math.sin((W - 1.4) * 10) * 0.25 : 0), 0, 0.3);
        J.armL.rotation.set(-2.2 * up + (W > 1.4 ? Math.cos((W - 1.4) * 10) * 0.25 : 0), 0, -0.4);
      }
      // la cloche
      let ang = 0;
      if (swing) ang += Math.sin(t * 2.4) * 0.28;
      if (wake && W > 1.2) ang = Math.sin((W - 1.2) * 4.6) * 0.55;
      const da = V.age('ding');
      if (da < 1.2) ang += Math.sin(da * 9) * 0.32 * ringSide * Math.exp(-da * 2.6);
      bellPiv.rotation.z = ang;
      clapPiv.rotation.z = -ang * 0.55 + Math.sin(t * 3) * 0.02;
      const vel = ang - lastBell;
      if ((vel > 0) !== (lastVel > 0) && Math.abs(ang) > 0.18) V.cue('strike');
      lastVel = vel; lastBell = ang;
      const sa = Math.min(V.age('strike'), da);
      dings.forEach((m) => { m.visible = sa < 0.42; m.scale.setScalar(0.8 + sa * 1.3); });
      bellL.intensity = 45 + Math.max(0, 1 - sa / 0.4) * 140 * (0.3 + k);
      // colombes : elles dorment, puis s'envolent à la fin
      doves.forEach((q, i) => {
        const g = q.d.g, wg = q.d.p.wings;
        const fa = wake ? W - 1.0 - i * 0.3 : -1;
        if (fa < 0) {
          g.position.copy(q.home);
          g.rotation.set(0, q.ry + Math.sin(t * 0.7 + q.ph) * 0.15, 0);
          q.d.p.head.rotation.set(Math.sin(t * 1.3 + q.ph) * 0.1, Math.sin(t * 0.5 + q.ph) * 0.4, 0);
          wg[0].rotation.x = 0; wg[1].rotation.x = 0;
          g.visible = true;
        } else {
          const up2 = (f + i) % 2 === 0;
          g.position.set(q.home.x + q.dir * fa * 16, q.home.y + fa * 14 + bump(sat(fa / 0.5)) * 2, q.home.z + fa * 6);
          g.rotation.set(-0.3, q.dir * 1.2, q.dir * -0.2);
          wg[0].rotation.x = up2 ? -1.0 : 0.4; wg[1].rotation.x = up2 ? 1.0 : -0.4;
          g.visible = fa < 6;
        }
      });
      // les Z du ronflement
      zs.forEach((z, i) => {
        const per = 3.6, kk = ((t / per + i / zs.length) % 1);
        z.visible = snore && !wake;
        const s = (0.3 + 0.75 * easeOut(sat(kk / 0.4))) * (1 - easeIn(sat((kk - 0.75) / 0.25)));
        z.scale.setScalar(Math.max(0.001, s));
        z.position.set(-36 + kk * 14 + Math.sin(kk * 6 + i) * 1.6, 14 + kk * 18, -3 + Math.cos(kk * 4 + i));
        z.rotation.set(0, Math.sin(kk * 4 + i) * 0.4, Math.sin(kk * 6 + i) * 0.3 - 0.1);
      });
    });

    return {
      update(st, first) {
        dayT = st.done ? 1 : st.p * 0.92;
        if (first) day = dayT;
        snore = st.phrasesDone >= 2;
        swing = st.phrasesDone >= 3 && !st.done;
        if (st.done && !done) { done = true; if (first) V.cues.done = -10; else V.cue('done'); }
        if (!st.done) done = false;
      },
      react(kind, st) {
        if (kind === 'phrase') { ringSide = -ringSide; V.cue('ding'); }
        if (kind === 'complete') {
          if (conf) { conf.burst(v3(TX, 46, TZ + 8), 24, ['#FFD38C', '#FFFFFF', '#F2A3A6', '#9FD7B8'], 0.9, 1.0); conf.burst(v3(TX - 5, 14, 9), 16, ['#FFD38C', '#F2A3A6', '#FFFFFF'], 0.8, 0.8); }
        }
      },
      note(n, on) {
        if (!on) return;
        ringSide = -ringSide;
        V.cue('ding');
      },
    };
  },
};
