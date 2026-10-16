/* ============ Savez-vous planter les choux : le potager du lapin jardinier ============
   Dans la planche de terre tricotée, le lapin en salopette repique un plant
   à chaque note retrouvée (et saute de joie) ; les choux du fond grossissent
   avec l'avancement, et à chaque phrase un gros chou sort de terre. À la fin,
   le lapin danse au milieu des papillons et des confettis de feuilles. */
SCENES.choux = {
  color: '#A6DAF2',
  view: {
    bg: '#A6DAF2', fov: 26,
    rig: { target: [0, 8, 2], az: 6, el: 14, box: [48, 40], targetWide: [1, 8.5, 2], boxWide: [80, 35] },
    post: { exposure: 1.02, bloom: 0.42, bloomThr: 1.0, aper: 6.5, maxBlur: 11, sat: 1.1, lift: '#110E08', vignette: 0.36, punch: 1.22 },
  },
  sky: [-22, 24, 21, 28, -18, -4],
  home: [0, 14, 4],
  flock: 7, birdSize: 0.85,
  build(V, o) {
    const live = !o.portrait;
    studioLights(V, {
      key: { color: '#FFEFD0', k: 2.6, az: 38, el: 44, area: 70 },
      fill: { sky: '#C0E3F8', ground: '#7C8C4C', k: 0.75 },
      rim: { color: '#FFF4DC', k: 1.35, az: -150, el: 26 },
      env: { sky: '#C0E3F8', ground: '#6A7840', k: 0.5, boxK: 4 },
      fog: { color: '#D2EAF5', near: 150, far: 480 },
    });
    V.add(cyclo({ w: 600, h: 260, z: -110, r: 45, floor: 40, top: '#62AEE2', mid: '#A9D8F2', bottom: '#F7EBCF', y: -2, scale: 3 }));
    const ground = terrain({ w: 420, d: 190, nx: 60, nz: 32, colors: ['#93C963', '#86BE59'], bands: 5, rough: 0.5, scale: 1.7, hills: [[-95, -60, 45, 5], [95, -64, 50, 7]] });
    V.add(ground);
    const H = ground.userData.height;
    const far = flatLayer(hillShape(520, 22, 5, 33), '#B2D69A', { depth: 1, inset: 1.1, stitch: '#DCEDC9' });
    at(far, 0, 0, -78);
    V.add(far);
    const mid = flatLayer(hillShape(480, 14, 4, 17), '#9FCB6E', { depth: 1, inset: 1.1, stitch: '#CFE5AE' });
    at(mid, 25, 0, -62);
    V.add(mid);
    // soleil et nuages suspendus
    const sunG = new T.Group();
    const sd = feltPiece(circleShape(5.6), '#FFC83A', { depth: 1.6, inset: 0.7, stitch: '#F2902A', st: { len: 0.55, gap: 0.35, r: 0.08 }, fuzz: 0.08 });
    const sm = sd.userData.body.material.clone();
    sm.emissive = col('#FFB224'); sm.emissiveIntensity = 0.45;
    sd.userData.body.material = sm;
    sunG.add(sd);
    const rays = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, r0 = 6.3, r1 = i % 2 ? 8.4 : 9.6; rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.07) * (r0 + r1) / 2, Math.sin(a + 0.07) * (r0 + r1) / 2, 0.3], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.4, { radial: 6 })); }
    sunG.add(mesh(mergeGeos(rays), wool('#FFAE2A', 'yarn')));
    addFace(sunG, 5.3, { z: 0.9, cheeks: '#F27A54' });
    sunG.traverse((m) => { m.castShadow = false; });
    at(sunG, 26, 23, -56);
    const hsun = hang(sunG, 180, { amp: 1, per: 5.6, r: 0.1 });
    V.add(hsun);
    swingAnim(V, hsun);
    [[-28, 25, -58, 20, 7, 3, 4.7], [-2, 28.5, -70, 17, 6, 6, 6.2]].forEach(([x, y, z, w, h, seed, per]) => {
      const c = cloud({ w, h, bumps: 4, seed, stitch: '#CBDDEB' });
      c.traverse((m) => { m.castShadow = false; });
      at(c, x, y, z);
      const hc = hang(c, 180, { amp: 1.2, per, r: 0.1 });
      V.add(hc);
      swingAnim(V, hc);
    });

    // la palissade blanche, et deux tournesols qui dépassent
    const pick = feltGeo(polyShape([[-0.8, 0], [0.8, 0], [0.8, 8.6], [0, 10], [-0.8, 8.6]]), 0.5, { bevel: 0.1 });
    V.add(scatter(pick, woodMat('#F1ECE0'), 40, (i, r) => ({ p: [-78 + i * 4, 0, -26 + (r() - 0.5) * 0.3], r: [0, 0, (r() - 0.5) * 0.06], s: [1, 0.92 + r() * 0.16, 1] })));
    for (const y of [2.8, 6.6]) { const rail = mesh(new T.BoxGeometry(160, 1, 0.5), woodMat('#E6DFD0')); scaleUV(rail.geometry, 160, 1); at(rail, 0, y, -26.6); V.add(rail); }
    const sunflower = (x, z, h, tilt) => {
      const g = new T.Group();
      g.add(yarn([[0, 0, 0], [0.5, h * 0.5, 0.2], [0, h, 0.3]], 0.32, '#5E9A40', { radial: 6 }));
      for (const [y, s] of [[h * 0.42, 1], [h * 0.62, -1]]) { const lf = felt(leafShape(3.2, 5.6, 0.6), '#6FAE4E', 0.25); lf.position.set(s * 2.4, y, 0.3); lf.rotation.set(-0.4, 0, -s * 1.1); g.add(lf); }
      const hd = new T.Group();
      hd.position.set(0, h, 0.4);
      hd.rotation.x = -tilt;
      const pet = [];
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; pet.push(applyM(feltGeo(ellipseShape(0.8, 2.0), 0.18, { bevel: 0, curve: 6 }), { p: [Math.cos(a) * 3.1, Math.sin(a) * 3.1, (i % 2) * -0.15], r: [0, 0, a - Math.PI / 2] })); }
      hd.add(mesh(mergeGeos(pet), wool('#FFC928', 'felt')));
      const c = woolBall(1.9, '#6B4226', 'crochet', { sz: 0.45, fuzz: 0.1, seg: 16 });
      c.position.z = 0.25;
      hd.add(c);
      g.add(hd);
      at(g, x, 0, z);
      V.add(g);
      return hd;
    };
    const sfl = [sunflower(-19, -28, 22, 0.15), sunflower(17, -29, 19, 0.1)];

    // la planche du potager : cadre de bois, terre tricotée en sillons rayés
    const BX = 27, BZ0 = -14, BZ1 = 9, RIDGES = [-9, -2, 5];
    const soilH = (x, z) => {
      let r = 0;
      for (const rz of RIDGES) r = Math.max(r, Math.max(0, 1 - ((z - rz) / 3.3) ** 2));
      return 2.3 + 1.9 * Math.pow(r, 0.8);
    };
    const bg = new T.PlaneGeometry(BX * 2, BZ1 - BZ0, 54, 46);
    bg.rotateX(-Math.PI / 2);
    const bp = bg.attributes.position, bcs = [];
    const cDark = col('#5B3A24'), cLight = col('#8E6140'), cMid = col('#7A5034'), tc = new T.Color();
    for (let i = 0; i < bp.count; i++) {
      const x = bp.getX(i), z = bp.getZ(i) + (BZ0 + BZ1) / 2;
      const y = soilH(x, z) + fbm3(x * 0.4, 0, z * 0.4, 2) * 0.12;
      bp.setXYZ(i, x, y, z);
      const k = sat((y - 2.3) / 1.9);
      tc.copy(cDark).lerp(Math.floor((z + 20) / 1.4) % 2 ? cLight : cMid, k);
      const v = 0.94 + hashi(Math.floor(x / 2), Math.floor(z / 1.4), 3) * 0.1;
      bcs.push(tc.r * v, tc.g * v, tc.b * v);
    }
    bg.setAttribute('color', new T.Float32BufferAttribute(bcs, 3));
    bg.computeVertexNormals();
    scaleUV(bg, BX * 2, BZ1 - BZ0);
    const soilMat = wool('#FFFFFF', 'knit', { scale: 0.8, bump: 1.3 }).clone();
    soilMat.vertexColors = true;
    soilMat.sheenColor = col('#B08560');
    soilMat.sheen = 0.4;
    V.add(mesh(bg, soilMat, { cast: false }));
    const plank = woodMat('#B98A57');
    [[0, BZ1 + 0.6, BX * 2 + 2.4, 1.2], [0, BZ0 - 0.6, BX * 2 + 2.4, 1.2]].forEach(([x, z, w, d]) => { const b = mesh(new T.BoxGeometry(w, 3.4, d), plank); scaleUV(b.geometry, w, 3.4); at(b, x, 1.7, z); V.add(b); });
    for (const s of [-1, 1]) { const b = mesh(new T.BoxGeometry(1.2, 3.4, BZ1 - BZ0), plank); scaleUV(b.geometry, BZ1 - BZ0, 3.4); at(b, s * (BX + 0.6), 1.7, (BZ0 + BZ1) / 2); V.add(b); }
    const pegs = [];
    for (const s of [-1, 1]) for (const z of [BZ0 - 0.6, BZ1 + 0.6]) pegs.push(applyM(new T.CylinderGeometry(0.75, 0.75, 4.6, 8), { p: [s * (BX + 0.6), 2.0, z] }));
    V.add(mesh(mergeGeos(pegs), woodMat('#9A6E42')));

    // les choux : une seule feuille de feutrine courbée, répétée pour tous les choux
    const leafGeo = (() => {
      const nu = 9, nv = 8, e0 = -0.85, e1 = 1.08;
      const B = v3(0, Math.sin(e0), Math.cos(e0));
      const pos = [], uv = [], cA = [], idx = [];
      for (let i = 0; i <= nu; i++) {
        const u = i / nu, e = lerp(e0, e1, u);
        const ha = 0.9 * Math.pow(Math.sin(Math.PI * (0.1 + 0.82 * u)), 0.5);
        for (let j = 0; j <= nv; j++) {
          const v = (j / nv) * 2 - 1, a = v * ha;
          const r = 1 + 0.08 * Math.sin(v * 7 + u * 5) * u * u + 0.05 * u;
          pos.push(Math.sin(a) * Math.cos(e) * r - B.x, Math.sin(e) * r - B.y, Math.cos(a) * Math.cos(e) * r - B.z);
          uv.push(a * 4, e * 4);
          const vein = Math.exp(-((v / 0.1) ** 2)) * 0.32 + Math.pow(Math.max(0, Math.cos((u * 4.5 - Math.abs(v) * 1.6) * Math.PI)), 10) * 0.14 * (1 - Math.abs(v));
          const sh = 0.78 + 0.3 * u;
          cA.push(sh + vein, sh + vein, sh + vein * 0.6);
        }
      }
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setAttribute('color', new T.Float32BufferAttribute(cA, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    })();
    const E0 = -0.85, BASE = v3(0, Math.sin(E0), Math.cos(E0));
    const LAY = [
      ...[0, 1, 2].map((k) => ({ az: (k * TAU) / 3 + 0.3, r: 0.6, open: 0.1, c: 0 })),
      ...[0, 1, 2, 3].map((k) => ({ az: (k * TAU) / 4 + 0.8, r: 0.8, open: 0.42, c: 1 })),
      ...[0, 1, 2, 3, 4].map((k) => ({ az: (k * TAU) / 5 + 0.1, r: 1.0, open: 0.98, c: 2 })),
    ];
    const SPROUT = [{ az: 0.4, r: 1, open: 0.55, c: 1 }, { az: 0.4 + Math.PI, r: 1, open: 0.55, c: 1 }, { az: 0.4 + Math.PI / 2, r: 0.7, open: 0.2, c: 0 }];
    const greens = [['#B6E08A', '#8FCB62', '#5FA845'], ['#C2E39A', '#9ACF72', '#6FAF55'], ['#B2DBA0', '#86BE86', '#5E9E78']].map((a) => a.map(col));
    const cabs = [];
    [-18, -9, 0, 9, 18].forEach((x, i) => cabs.push({ x: x + (hashi(i, 2) - 0.5) * 1.5, z: RIDGES[0], kind: 'grow', i, pal: greens[i % 3], R: 0, rise: 1, t0: -1e9, on: true }));
    [-13.5, -4.5, 4.5, 13.5].forEach((x, i) => cabs.push({ x, z: RIDGES[1], kind: 'phrase', i, pal: greens[(i + 1) % 3], R: 0, rise: 0, t0: -1e9, on: false }));
    const SEEDX = [-16, -10.7, -5.3, 0, 5.3, 10.7, 16];
    SEEDX.forEach((x, i) => cabs.push({ x, z: RIDGES[2], kind: 'seed', i, pal: greens[i % 3], R: 0, rise: 0, t0: -1e9, on: false }));
    const nLeaf = cabs.reduce((n, c) => n + (c.kind === 'seed' ? SPROUT.length : LAY.length), 0);
    const leafMat = wool('#FFFFFF', 'felt', { sheen: 0.6, sheenColor: '#E4F7C8', scale: 0.7 }).clone();
    leafMat.vertexColors = true;
    leafMat.side = T.DoubleSide;
    const leaves = new T.InstancedMesh(leafGeo, leafMat, nLeaf);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    leaves.frustumCulled = false;
    V.add(leaves);
    const coreMesh = new T.InstancedMesh(blobGeo(1, 0.92, 1, { seg: 16, lump: 0.06, seed: 4 }), wool('#FFFFFF', 'felt', { sheen: 0.6, sheenColor: '#E4F7C8' }), 9);
    coreMesh.castShadow = true;
    coreMesh.frustumCulled = false;
    V.add(coreMesh);
    let li = 0;
    cabs.forEach((c) => { c.l0 = li; li += c.kind === 'seed' ? SPROUT.length : LAY.length; });
    cabs.filter((c) => c.kind !== 'seed').forEach((c, k) => { c.core = k; });
    const m4 = new T.Matrix4(), q4 = new T.Quaternion(), e4 = new T.Euler(0, 0, 0, 'YXZ'), p4 = v3(), s4 = v3(), cc = new T.Color();
    const hideM = new T.Matrix4().makeScale(0, 0, 0);
    leaves.setColorAt(0, cc.set('#FFFFFF'));
    coreMesh.setColorAt(0, cc.set('#FFFFFF'));
    const layCab = (c, t) => {
      const list = c.kind === 'seed' ? SPROUT : LAY;
      const show = c.R > 0.02 && c.rise > 0.001;
      const R = c.R * (0.35 + 0.65 * c.rise), base = soilH(c.x, c.z) - 0.25 - (1 - c.rise) * c.R * 1.2;
      const wob = c.wob || 0;
      list.forEach((L, k) => {
        const id = c.l0 + k;
        if (!show) { leaves.setMatrixAt(id, hideM); return; }
        const s = R * L.r;
        const op = L.open * (c.kind === 'seed' ? 1 : lerp(0.55, 1.08, sat(c.R / 4.6))) + wob * 0.12 * Math.sin(t * 20 + k);
        const cy = base + (c.kind === 'seed' ? 0 : R * 0.62);
        p4.set(c.x + Math.sin(L.az) * BASE.z * s, cy + BASE.y * s * (c.kind === 'seed' ? 0 : 1), c.z + Math.cos(L.az) * BASE.z * s);
        if (c.kind === 'seed') p4.set(c.x, base + 0.2, c.z);
        e4.set(op, L.az, 0);
        q4.setFromEuler(e4);
        s4.setScalar(s);
        m4.compose(p4, q4, s4);
        leaves.setMatrixAt(id, m4);
        leaves.setColorAt(id, c.pal[L.c]);
      });
      if (c.core != null) {
        if (!show) coreMesh.setMatrixAt(c.core, hideM);
        else { p4.set(c.x, base + R * 0.62, c.z); s4.set(R * 0.55, R * 0.55 * (1 + wob * 0.05 * Math.sin(t * 20)), R * 0.55); m4.compose(p4, q4.identity(), s4); coreMesh.setMatrixAt(c.core, m4); coreMesh.setColorAt(c.core, c.pal[0]); }
      }
    };
    // petites mottes de terre au pied des plants
    const clods = scatter(blobGeo(1, 0.6, 1, { seg: 8, lump: 0.35, seed: 3 }), wool('#FFFFFF', 'knit', { sheen: 0.3, sheenColor: '#4A3020', scale: 0.5 }), SEEDX.length * 3, (i, r) => {
      const x = SEEDX[Math.floor(i / 3)] + (r() - 0.5) * 2.4, z = RIDGES[2] + (r() - 0.5) * 2.2;
      return { p: [x, soilH(x, z) + 0.05, z], r: [r(), r() * 3, r()], s: 0.35 + r() * 0.3, c: col('#6E4A2E').multiplyScalar(0.85 + r() * 0.3) };
    });
    V.add(clods);

    // le panneau de bois (un chou cousu dessus) et l'arrosoir
    const sign = new T.Group();
    sign.add(at(mesh(new T.BoxGeometry(0.9, 12, 0.9), woodMat('#A57A4C')), 0, 6, 0));
    const board = mesh(new T.BoxGeometry(9.5, 6.2, 0.7), woodMat('#D0A874'));
    scaleUV(board.geometry, 9.5, 6.2);
    sign.add(at(board, 0, 10.5, 0.6));
    const pic = feltPiece(circleShape(1.9), '#7CC25A', { depth: 0.3, inset: 0.3, stitch: '#E9F7D6', st: { len: 0.25, gap: 0.18, r: 0.04 } });
    at(pic, -1.6, 10.5, 1.1);
    sign.add(pic);
    for (const s of [-1, 1]) { const lf = felt(leafShape(1.6, 2.6, s * 0.3), '#5FA845', 0.25); lf.position.set(-1.6 + s * 1.7, 9.9, 1.0); lf.rotation.z = -s * 0.9; sign.add(lf); }
    const carrot = felt(polyShape([[-0.55, 1.4], [0.55, 1.4], [0, -1.6]]), '#F2803C', 0.3);
    carrot.position.set(2.2, 10.3, 1.1);
    carrot.rotation.z = -0.4;
    sign.add(carrot);
    at(sign, -20, 0, -18);
    sign.rotation.y = 0.25;
    sign.rotation.z = 0.06;
    V.add(sign);
    const can = new T.Group();
    const canM = metalMat('#3E9C97', { rough: 0.34 });
    can.add(mesh(latheGeo([[0.01, 0], [3.0, 0], [3.2, 0.3], [3.1, 5.4], [2.5, 6.0], [1.2, 6.25], [0.01, 6.3]], { seg: 24 }), canM));
    can.add(mesh(yarnGeo([[2.4, 1.3, 0], [4.9, 4.2, 0], [6.9, 7.4, 0]], 0.42, { radial: 8 }), canM));
    const rose = mesh(latheGeo([[0.42, 0], [1.05, 0.9], [1.1, 1.05], [0.01, 1.1]], { seg: 14 }), canM);
    rose.position.set(6.9, 7.4, 0);
    rose.rotation.z = -0.65;
    can.add(rose);
    can.add(mesh(yarnGeo([[-2.6, 4.6, 0], [-3.9, 7.4, 0], [-1.0, 9.0, 0], [1.4, 6.0, 0]], 0.34, { radial: 7 }), canM));
    const csh = contactShadow(11, 8, 0.4);
    csh.position.y = 0.12;
    can.add(csh);
    at(can, -19.5, 0, 18);
    can.rotation.y = -0.5;
    V.add(can);

    // l'herbe et quelques fleurs
    V.add(grass({ n: 50, area: [-56, 56, 13, 50], height: H, colors: ['#6DB85A', '#5AA64C', '#86C86B'], scale: 0.9, seed: 3 }));
    V.add(grass({ n: 16, area: [-56, 56, -24, -16], height: H, colors: ['#6DB85A', '#5AA64C', '#86C86B'], scale: 1.0, seed: 8 }));
    const petals = (n, rx, ry, rad) => { const g = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; g.push(applyM(feltGeo(ellipseShape(rx, ry), 0.16, { bevel: 0, curve: 6 }), { p: [Math.cos(a) * rad, Math.sin(a) * rad, 0], r: [0, 0, a - Math.PI / 2] })); } return mergeGeos(g); };
    const daisyG = petals(9, 0.42, 1.05, 1.15);
    const flowers = [[-34, 24, '#FFFFFF'], [31, 20, '#FFFFFF'], [-8, 34, '#F7A8C8'], [38, 30, '#F7A8C8']].map(([x, z, c], i) => {
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

    // le lapin jardinier, en salopette et chapeau de paille
    const bun = critter({ size: 9.5, pose: 'stand', color: '#C9A27E', belly: '#F4E6D0', ears: 'long', earH: 1.15, earIn: '#F2A7B5', earCol: '#C9A27E', tail: 'pompom', tailCol: '#FFFFFF', snout: 0.42, snoutCol: '#F4E6D0', nose: '#E07A8C', cheeks: '#F29A9A', eyeR: 0.14, head: 0.32 });
    const BP = bun.p, br = bun.br;
    const denim = wool('#4F7FC0', 'knit', { scale: 0.5 });
    const pants = [];
    for (let k = 0; k <= 10; k++) { const y = lerp(-br[1] * 0.98, br[1] * 0.18, k / 10); pants.push([br[0] * Math.sqrt(Math.max(0.02, 1 - (y / br[1]) ** 2)) + 0.16, y]); }
    const ov = mesh(latheGeo(pants, { seg: 24 }), denim);
    fuzz(ov, 0.06);
    BP.body.add(ov);
    const bib = feltPiece(roundRectShape(3.2, 2.9, 0.5), '#4F7FC0', { depth: 0.35, inset: 0.3, stitch: '#F5C32C', st: { len: 0.28, gap: 0.2, r: 0.045 } });
    bib.position.set(0, br[1] * 0.28, br[2] * 0.93 + 0.15);
    bib.rotation.x = -0.32;
    BP.body.add(bib);
    for (const s of [-1, 1]) {
      BP.body.add(yarn([[s * 1.25, br[1] * 0.45, br[2] * 0.82], [s * 1.6, br[1] * 0.92, br[2] * 0.2], [s * 1.3, br[1] * 0.75, -br[2] * 0.7], [s * 1.0, br[1] * 0.1, -br[2] * 0.98]], 0.22, '#4F7FC0', { radial: 6 }));
      const bt = bead(0.4, '#F5C32C', { flat: 0.6 });
      bt.position.set(s * 1.2, br[1] * 0.45, br[2] * 0.86 + 0.3);
      bt.rotation.x = -0.35;
      BP.body.add(bt);
    }
    BP.legs.forEach((L) => { const lg = L.children[0]; lg.material = denim; lg.children.slice().forEach((k) => lg.remove(k)); fuzz(lg, 0.06); });
    // chapeau de paille entre les oreilles
    const hat = new T.Group();
    const hs = bun.hs;
    hat.add(mesh(latheGeo([[0.1, 0], [hs * 1.22, -hs * 0.05], [hs * 1.3, hs * 0.04], [hs * 0.8, hs * 0.06]], { seg: 28, lump: 0.04 }), wool('#E7C377', 'weave', { scale: 0.8 })));
    hat.add(mesh(latheGeo([[hs * 0.75, 0], [hs * 0.7, hs * 0.38], [hs * 0.5, hs * 0.5], [0.1, hs * 0.53]], { seg: 22 }), wool('#E7C377', 'weave', { scale: 0.8 })));
    const band = mesh(new T.TorusGeometry(hs * 0.73, hs * 0.07, 6, 24), wool('#E5484D', 'felt'));
    band.rotation.x = Math.PI / 2;
    band.position.y = hs * 0.1;
    hat.add(band);
    const hf = felt(circleShape(0.55), '#FFFFFF', 0.2);
    hf.position.set(hs * 0.55, hs * 0.18, hs * 0.45);
    hf.rotation.y = 0.9;
    hat.add(hf);
    hat.position.set(0, hs * 0.72, -hs * 0.05);
    hat.rotation.set(-0.12, 0, 0.12);
    BP.head.add(hat);
    // le transplantoir dans la patte droite
    const trowel = new T.Group();
    trowel.add(at(mesh(new T.CylinderGeometry(0.28, 0.32, 2.6, 8), woodMat('#A0703F')), 0, 0, 0));
    const blade = mesh(feltGeo(leafShape(1.4, 2.8, 0), 0.12, { bevel: 0.04 }), metalMat('#B8C2C6', { rough: 0.3 }));
    blade.position.y = -2.5;
    blade.rotation.z = Math.PI;
    trowel.add(blade);
    trowel.rotation.x = 1.0;
    at(trowel, 0, -BP.arms[1].userData.len - 0.2, 0.4);
    BP.arms[1].add(trowel);
    const bunRoot = new T.Group();
    bunRoot.add(bun.g);
    V.add(bunRoot);
    V.boilable(bun.g, 0.05, 0.6);
    const bsh = contactShadow(9, 7, 0.45);
    V.add(bsh);
    const blink = blinker(BP.eyes, 9);
    const bodyY0 = BP.body.position.y;

    // papillons de feutrine, au bout de leur fil
    const bfly = (c1, c2, x, y, z, ph) => {
      const g = new T.Group();
      const body = woolBall(0.3, '#3A2A22', 'crochet', { sy: 2.6, fuzz: false, seg: 10 });
      body.rotation.x = Math.PI / 2 - 0.3;
      g.add(body);
      g.add(mesh(mergeGeos([-1, 1].map((s) => yarnGeo([[0, 0.2, 0.6], [s * 0.4, 1.0, 1.0], [s * 0.7, 1.5, 0.9]], 0.05, { radial: 4 }))), wool('#3A2A22', 'yarn'), { cast: false }));
      const wingMat = wool(c1, 'felt', { sheen: 0.7, sheenColor: c2 });
      const wings = [-1, 1].map((s) => {
        const piv = new T.Group();
        const up = applyM(feltGeo(heartShape(2.6), 0.18, { bevel: 0, curve: 8 }), { r: [0, 0, -s * 2.2], p: [s * 1.05, -0.35, 0] });
        const lo = applyM(feltGeo(heartShape(1.7), 0.16, { bevel: 0, curve: 8 }), { r: [0, 0, -s * 0.93], p: [s * 0.8, 0.7, -0.05] });
        const wg = mesh(mergeGeos([up, lo]), wingMat);
        wg.rotation.x = -Math.PI / 2;
        piv.add(wg);
        // une tache de couleur cousue sur l'aile
        const spot = felt(circleShape(0.42), c2, 0.1);
        spot.position.set(s * 1.25, 0.12, -0.5);
        spot.rotation.x = -Math.PI / 2;
        spot.castShadow = false;
        piv.add(spot);
        g.add(piv);
        return piv;
      });
      g.rotation.x = 0.55;
      at(g, x, y, z);
      const hg = hang(g, 120, { amp: 3, per: 2.6, r: 0.07 });
      V.add(hg);
      swingAnim(V, hg);
      return { g, wings, pv: hg.userData.pivot, x, y, z, ph };
    };
    const flies = [bfly('#F7A8C8', '#E5689A', -14, 17, -4, 0), bfly('#FFD45A', '#F2803C', 12, 19, -9, 2.1), bfly('#9CC3F2', '#3E6FD8', 24, 13, 4, 4.2)];

    // particules
    let conf = null, dirt = null;
    const floorH = (x, z) => (Math.abs(x) < BX && z > BZ0 && z < BZ1 ? soilH(x, z) : H(x, z));
    if (live) {
      pointCloud(V, { n: 60, box0: [-40, 2, -20], box1: [40, 34, 24], size: 0.8, color: '#FFF4D2', opacity: 0.45, vel: [0.3, 0.3, 0.1], beam: 0.5, keyDir: [0.49, 0.69, 0.53] });
      conf = confetti(V, { kinds: ['leaf', 'heart', 'disc'], n: 44, size: 0.85, height: floorH });
      dirt = confetti(V, { kinds: ['disc'], n: 20, size: 0.45, height: floorH });
    }
    V.onHome = (c) => { if (conf) conf.burst(bunRoot.position.clone().add(v3(0, 16, 0)), 5, [c, '#FFFFFF'], 0.4, 0.5); };

    // l'histoire
    let done = false, nSeed = 0, ph = 0, P = 0, bx = SEEDX[0] + 3.6, bxT = bx, lastT = null;
    const later = [];
    const after = (dt, fn) => later.push([V.now + dt, fn]);
    V.anim((t, f) => {
      while (later.length && later[0][0] <= V.now) later.shift()[1]();
      const dt = lastT == null ? 0 : clamp(t - lastT, 0, 0.5);
      lastT = t;
      blink(t, f);
      const ad = done ? V.age('done') : -1;
      // les choux
      cabs.forEach((c) => {
        let R, rise;
        if (c.kind === 'grow') { R = lerp(1.3, 4.3, P); rise = 1; }
        else if (c.kind === 'phrase') { R = c.on ? lerp(4.2, 5.0, P) : 0; rise = c.on ? easeOutBack(sat((V.now - c.t0) / 0.7), 2.2) : 0; }
        else { R = c.on ? lerp(1.1, 1.5, P) : 0; rise = c.on ? easeOutBack(sat((V.now - c.t0) / 0.4)) : 0; }
        c.R += (R - c.R) * (1 - Math.exp(-dt * 4));
        if (Math.abs(c.R - R) < 0.01) c.R = R;
        c.rise = rise;
        const nw = V.age('wob' + (c.i % 3));
        c.wob = (nw < 0.4 ? bump(nw / 0.4) * 0.6 : 0) + (done ? 0.5 : 0);
        layCab(c, t);
      });
      leaves.instanceMatrix.needsUpdate = true;
      if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
      coreMesh.instanceMatrix.needsUpdate = true;
      if (coreMesh.instanceColor) coreMesh.instanceColor.needsUpdate = true;
      // le lapin
      bx += (bxT - bx) * (1 - Math.exp(-dt * 3));
      const moving = Math.abs(bxT - bx) > 0.15;
      const hop = V.age('hop'), hopK = hop < 0.55 ? sat(hop / 0.55) : 1;
      const nb = V.age('nb'), nbK = nb < 0.3 ? bump(nb / 0.3) : 0;
      const pl = V.age('plant'), plK = pl < 1.0 ? bump(pl / 1.0) : 0;
      let y = 0, spin = 0, sq = 0, armUp = 0, look = 0;
      if (hopK < 1) { y = bump(hopK) * 5.5; sq = hopK < 0.12 ? -bump(hopK / 0.12) : (hopK > 0.88 ? -bump((hopK - 0.88) / 0.12) : 0.6 * bump(hopK)); armUp = bump(hopK); }
      if (moving) y += Math.abs(Math.sin(t * 9)) * 1.6;
      y += nbK * 0.8;
      let bxx = bx, bz = 12.6, face = moving ? (bxT > bx ? 1.2 : -1.2) : -0.3;
      if (done && ad < 1e5) {
        // la danse
        const k = sat(ad / 0.8);
        bxx = lerp(bx, 0, easeInOut(k)); bz = lerp(12.6, 14, k);
        const b = Math.max(0, ad - 0.8);
        spin = b > 0 ? Math.sin(b * 1.4) * Math.PI * 0.9 : 0;
        y = b > 0 ? Math.abs(Math.sin(b * Math.PI * 2.2)) * 3.2 : Math.abs(Math.sin(ad * 9)) * 1.6;
        armUp = 0.6 + 0.4 * Math.sin(b * 6);
        face = 0;
      } else if (done) { bxx = 0; bz = 14; spin = Math.sin(t * 1.4) * Math.PI * 0.9; y = Math.abs(Math.sin(t * Math.PI * 2.2)) * 3.2; armUp = 0.6 + 0.4 * Math.sin(t * 6); face = 0; }
      let lookY = 0;
      if (!done && plK > 0) { look = plK; lookY = clamp(Math.atan2(cabs[5 + clamp(ph - 1, 0, 3)].x - bx, 6) - face, -1.1, 1.1) * plK; armUp = Math.max(armUp, plK * 0.8); }
      bunRoot.position.set(bxx, H(bxx, bz) + y, bz);
      bunRoot.rotation.y = face + spin;
      BP.body.position.y = bodyY0 + Math.sin(t * 2.2) * 0.06 - sq * 0.5;
      BP.body.scale.set(1 - sq * 0.08, 1 + sq * 0.12, 1 - sq * 0.08);
      BP.body.rotation.x = (done ? Math.sin(t * 4.4) * 0.08 : 0) - look * 0.12;
      BP.head.rotation.set(-0.08 + nbK * 0.25 - look * 0.25, Math.sin(t * 0.7) * 0.15 + lookY, Math.sin(t * 0.9) * 0.06 + (done ? Math.sin(t * 4.4) * 0.15 : 0));
      BP.arms[0].rotation.set(-0.3 - armUp * 2.3, 0, -0.35 - armUp * 0.5 + (done ? Math.sin(t * 6) * 0.3 : 0));
      BP.arms[1].rotation.set(-0.7 - armUp * 1.6 + Math.sin(t * 1.3) * 0.05, 0, 0.35 + armUp * 0.4);
      BP.legs.forEach((L, i) => { L.rotation.x = moving || (done && ad > 0.8) ? Math.sin(t * 9 + i * Math.PI) * 0.5 : 0; });
      // les oreilles frémissent de temps en temps
      const tw = Math.floor(t / 1.7), twK = hashi(tw, 5) < 0.5 ? bump(sat(((t % 1.7) - 0.2) / 0.3)) : 0;
      BP.ears.forEach((e, i) => { e.rotation.x = -0.12 - (y > 0.5 ? 0.4 : 0) + nbK * 0.3; e.rotation.z = (i ? -1 : 1) * (0.18 + (i ? twK * 0.35 : 0) + (y > 0.5 ? 0.25 : 0)); });
      bsh.position.set(bxx, H(bxx, bz) + 0.1, bz);
      bsh.material.opacity = 0.45 * clamp(1 - y / 10, 0.3, 1);
      // les papillons volent (le marionnettiste promène leur fil)
      flies.forEach((b, i) => {
        const near = done ? 1 : 0;
        const tx = lerp(b.x + Math.sin(t * 0.35 + b.ph) * 9, bxx + Math.cos(t * 0.9 + i * 2.1) * (7 + i), near);
        const tz = lerp(b.z + Math.cos(t * 0.27 + b.ph) * 5, bz - 2 + Math.sin(t * 0.9 + i * 2.1) * 4, near);
        b.pv.position.x = tx;
        b.pv.position.z = tz;
        b.g.rotation.y = Math.sin(t * 0.6 + b.ph) * 0.8;
        const up = (f + i) % 2 === 0;
        b.wings[0].rotation.z = up ? -1.0 : -0.15;
        b.wings[1].rotation.z = up ? 1.0 : 0.15;
      });
      sfl.forEach((h, i) => { h.rotation.z = Math.sin(t * 0.8 + i * 1.7) * 0.05 + (done ? Math.sin(t * 4.4 + i) * 0.1 : 0); });
      flowers.forEach((g, i) => { g.rotation.z = Math.sin(t * 1.2 + i) * 0.04; });
      sunG.rotation.z = Math.sin(t * 0.7) * 0.05;
    });

    return {
      update(st, first) {
        P = st.p;
        const ns = st.done ? SEEDX.length : Math.min(SEEDX.length, Math.round(SEEDX.length * st.p));
        cabs.forEach((c) => {
          if (c.kind === 'seed') { const on = c.i < ns; if (on && !c.on) c.t0 = first ? -1e9 : V.now + 1 / FPS + 0.25; c.on = on; }
          if (c.kind === 'phrase') { const on = st.done || c.i < st.phrasesDone; if (on && !c.on) c.t0 = first ? -1e9 : V.now + 1 / FPS + 0.35; c.on = on; }
          if (first) c.R = c.kind === 'grow' ? lerp(1.3, 4.3, P) : c.on ? (c.kind === 'phrase' ? lerp(4.2, 5.0, P) : lerp(1.1, 1.5, P)) : 0;
        });
        nSeed = ns;
        ph = st.done ? 4 : st.phrasesDone;
        bxT = Math.min(15, SEEDX[Math.min(SEEDX.length - 1, ns)] + 3.6);
        if (first) bx = bxT;
        if (st.done && !done) { done = true; if (first) V.cues.done = -1e6; else V.cue('done'); }
        if (!st.done && done) done = false;
      },
      react(kind, st) {
        if (kind === 'correct' || kind === 'phrase') {
          V.cue('hop');
          if (dirt) after(0.3, () => { const c = cabs.find((k) => k.kind === 'seed' && k.i === Math.max(0, nSeed - 1)); if (c) dirt.burst(v3(c.x, soilH(c.x, c.z) + 0.5, c.z), 6, ['#6E4A2E', '#8E6140', '#5B3A24'], 0.35, 0.35); });
        }
        if (kind === 'phrase') {
          V.cue('plant', 0.25);
          const c = cabs.find((k) => k.kind === 'phrase' && k.i === Math.max(0, st.phrasesDone - 1));
          if (c && dirt) after(0.4, () => dirt.burst(v3(c.x, soilH(c.x, c.z) + 1, c.z), 12, ['#6E4A2E', '#8E6140', '#5B3A24'], 0.55, 0.55));
          if (c && conf) after(0.75, () => conf.burst(v3(c.x, soilH(c.x, c.z) + 7, c.z), 10, ['#8FCB62', '#B6E08A', '#5FA845', '#F7A8C8'], 0.5, 0.6));
        }
        if (kind === 'complete' && conf) {
          conf.burst(v3(0, 14, 10), 26, ['#8FCB62', '#B6E08A', '#5FA845', '#F5C32C', '#F7A8C8', '#9CC3F2'], 1.0, 1.2);
          after(1.6, () => { if (done) conf.burst(v3(0, 16, 6), 26, ['#8FCB62', '#B6E08A', '#5FA845', '#F5C32C', '#F7A8C8'], 1.1, 1.3); });
          after(3.4, () => { if (done) conf.burst(v3(-6, 15, 2), 20, ['#8FCB62', '#5FA845', '#FFD45A', '#E5689A'], 0.9, 1.2); });
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('nb');
        V.cue('wob' + (n % 3));
      },
    };
  },
};
