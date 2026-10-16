/* ============ Dans la forêt lointaine : le coucou et le hibou ============
   La nuit, au fond des bois : un grand chêne ; le coucou chante sur la
   branche de gauche, le hibou lui répond sur celle de droite. Les lucioles
   s'allument une à une avec les notes retrouvées ; le coucou chante à
   chaque note ; de la cinquième phrase à la fin, coucou et hibou se
   répondent ; à la fin, ils chantent ensemble, les lucioles tourbillonnent
   et la lune brille. Pendant l'écoute : « cou-cou » au coucou, « hi-bou »
   au hibou. */
SCENES.coucou = {
  color: '#18224E',
  view: {
    bg: '#070B22', fov: 26,
    rig: { target: [-2, 29, 0], az: -4, el: 7, box: [70, 52], targetWide: [0, 27.5, 0], boxWide: [104, 48] },
    post: { exposure: 1.18, bloom: 1.0, bloomThr: 0.85, aper: 6, maxBlur: 11, sat: 1.08, lift: '#03061A', vignette: 0.52, punch: 1.28 },
  },
  sky: [-30, 30, 44, 51, 2, 12],
  home: [-4, 30, 7],
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
    // cyclo() rend un drap aux faces tournées vers le fond (invisible depuis la caméra) : on retourne ses triangles
    const facing = (m) => { const ix = m.geometry.index; for (let i = 0; i < ix.count; i += 3) { const b = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, b); } ix.needsUpdate = true; m.geometry.computeVertexNormals(); return m; };
    const halo = (size, color, k) => new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: sprite('soft'), color: col(color).multiplyScalar(k), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));

    // ---------- lumière : clair de lune bleu ----------
    const L = studioLights(V, {
      key: { color: '#A6B6FF', k: 1.5, az: 38, el: 40, area: 64 },
      fill: { sky: '#2C3C80', ground: '#0E1616', k: 0.5 },
      rim: { color: '#86A2FF', k: 1.5, az: -150, el: 30 },
      env: { sky: '#26356E', ground: '#0B1012', k: 0.38, boxK: 2.5 },
      fog: { color: '#0E173E', near: 170, far: 420 },
    });

    // ---------- le ciel, la lune, la forêt lointaine ----------
    V.add(facing(cyclo({ w: 520, h: 200, z: -95, r: 46, floor: 40, top: '#050824', mid: '#0E1946', bottom: '#1F3070', y: -2, scale: 3 })));
    const mn = moon({ r: 8.5, full: true, sleepy: false, color: '#F8F1CC', stitch: '#D8C67C' });
    const moonM = mn.children[0].userData.body.material.clone();
    moonM.emissive = col('#FFF0B8'); moonM.emissiveIntensity = 0.45;
    mn.children[0].userData.body.material = moonM;
    at(mn, 25, 37.5, -48);
    lite(mn, 30, 0);
    const hmn = hang(noCast(mn), 150, { amp: 1.0, per: 6, attach: 8.5 });
    V.add(hmn); swingAnim(V, hmn);
    const mhalo = halo(60, '#7088E0', 0.5);
    at(mhalo, 25, 37.5, -52);
    V.add(mhalo);
    const moonL = practical(V, [22, 40, -28], '#B8C6FF', 0, 140);
    // lisières de feutrine : arbres ronds et sapins découpés
    const forest = (w, h, n, seed) => {
      const r = rng(seed), pts = [[-w / 2, -10]];
      for (let i = 0; i < n; i++) {
        const x0 = -w / 2 + (i / n) * w, x1 = x0 + w / n, cx = (x0 + x1) / 2, hh = h * (0.7 + r() * 0.5);
        if (r() < 0.5) { pts.push([x0, h * 0.35]); pts.push([cx, hh * 1.25]); pts.push([x1, h * 0.35]); }
        else { pts.push([x0, h * 0.4]); for (let k = 1; k < 6; k++) { const a = (k / 6) * Math.PI; pts.push([cx - Math.cos(a) * (x1 - x0) * 0.5, h * 0.4 + Math.sin(a) * (hh - h * 0.4)]); } pts.push([x1, h * 0.4]); }
      }
      pts.push([w / 2, -10]);
      return polyShape(pts);
    };
    const f1 = flatLayer(forest(320, 30, 16, 3), '#101A42', { depth: 1, inset: 1.2, stitch: '#26346E' });
    at(f1, 0, 0, -66);
    V.add(noCast(f1));
    const f2 = flatLayer(forest(260, 24, 11, 9), '#15244E', { depth: 1, inset: 1.2, stitch: '#2E4280' });
    at(f2, -10, 0, -44);
    V.add(noCast(f2));

    // ---------- le sol de la clairière ----------
    const ground = terrain({ w: 320, d: 150, nx: 36, nz: 22, hills: [[-60, -20, 40, 5], [60, -10, 35, 4]], colors: ['#1F3B37', '#22423B'], bands: 9, rough: 0.6, scale: 1.8 });
    V.add(ground);
    const H = ground.userData.height;
    V.add(grass({ n: 60, area: [-70, 60, -12, 26], height: H, colors: ['#2F5A48', '#3A6A50', '#28503F'], scale: 0.85 }));
    V.add(scatter(blobGeo(1, 0.6, 0.8, { seg: 10, lump: 0.15, seed: 2 }), wool('#FFFFFF', 'felt', { sheen: 0.3, sheenColor: '#334' }), 8, (i, r) => {
      const x = [-34, -27, 18, 25, 33, -14, 8, 40][i], z = [10, 16, 12, 18, 6, 20, 22, -2][i];
      return { p: [x, H(x, z) + 0.4, z], r: [0, r() * 3, 0], s: 1.2 + r() * 1.3, c: new T.Color().setHSL(0.62, 0.12, 0.2 + r() * 0.08) };
    }));

    // ---------- le grand chêne ----------
    const TRK = '#6A4A33';
    const oak = new T.Group();
    V.add(oak);
    const trunk = mesh(latheGeo([[10.5, 0], [8.4, 1.4], [7.0, 4], [6.2, 10], [5.8, 20], [5.5, 30], [5.0, 40], [4.4, 50], [3.4, 58]], { seg: 26, lump: 0.1, seed: 4 }), wool(TRK, 'knit', { scale: 0.7, sheen: 0.4 }));
    oak.add(trunk);
    // écorce : nervures de fil, verticales et sinueuses
    const barkG = [];
    for (let k = 0; k < 9; k++) {
      const a0 = (k / 9) * TAU + 0.2, pts = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12, y = 3 + t * (40 + (k % 3) * 6), rr = lerp(7.0, 5.0, sat(y / 50)) + 0.2, a = a0 + Math.sin(t * 5 + k) * 0.12; pts.push([Math.cos(a) * rr, y, Math.sin(a) * rr]); }
      barkG.push(yarnGeo(pts, 0.38, { radial: 5 }));
    }
    oak.add(mesh(mergeGeos(barkG), wool('#4E3524', 'yarn', { sheen: 0.4 }), { cast: false }));
    // racines, branches (fils épais)
    const limbs = [];
    [[0.62, 13], [2.45, 12], [3.4, 14], [4.6, 11], [5.6, 12]].forEach(([a, l]) => limbs.push(yarnGeo([[Math.cos(a) * 6, 3.2, Math.sin(a) * 6], [Math.cos(a) * (6 + l * 0.5), 1.4, Math.sin(a) * (6 + l * 0.5)], [Math.cos(a) * (6 + l), 0.3, Math.sin(a) * (6 + l)]], 1.6, { radial: 8 })));
    // la branche du hibou (à droite) et celle du coucou (à gauche)
    limbs.push(yarnGeo([[3, 26, 0], [12, 29.5, 1.2], [22, 30.6, 2.4], [30, 33, 2.0]], 1.7, { radial: 9 }));
    limbs.push(yarnGeo([[-3, 33, 0], [-12, 37, 1.4], [-22, 38.2, 2.6], [-30, 41.5, 2.0]], 1.5, { radial: 9 }));
    limbs.push(yarnGeo([[2, 44, -1], [10, 52, -2], [18, 58, -3]], 1.6, { radial: 8 }));
    limbs.push(yarnGeo([[-2, 48, -1], [-11, 55, -2], [-20, 60, -3]], 1.4, { radial: 8 }));
    limbs.push(yarnGeo([[24, 31.2, 2.3], [28, 36, 1.8], [30, 40, 1]], 0.7, { radial: 6 }));
    limbs.push(yarnGeo([[-24, 38.8, 2.5], [-29, 45, 1.8]], 0.6, { radial: 6 }));
    const limbMesh = mesh(mergeGeos(limbs), wool(TRK, 'knit', { scale: 0.55, sheen: 0.4 }));
    oak.add(limbMesh);
    // le creux du tronc
    const hollow = felt(ellipseShape(2.4, 3.4), '#1A100C', 0.4, { fuzz: false, cast: false });
    const hq = v3(0.35, 0, 1).normalize();
    at(hollow, hq.x * 6.0, 17, hq.z * 6.0); faceTo(hollow, hq);
    oak.add(hollow);
    const hrim = mesh(new T.TorusGeometry(2.7, 0.5, 6, 20), wool('#54392A', 'yarn'), { cast: false });
    hrim.scale.y = 1.35;
    at(hrim, hq.x * 6.1, 17, hq.z * 6.1); faceTo(hrim, hq);
    oak.add(hrim);
    // la ramure : grosses boules de jersey, feuilles de chêne en feutrine
    const crown = [[-28, 60, -8, 9], [-16, 66, -10, 10], [-3, 69, -10, 10.5], [11, 66, -9, 10], [25, 61, -7, 9], [36, 55, -10, 7], [-20, 54, -2, 7.5], [-7, 58, 0, 8.5], [8, 57, 0, 8], [20, 53, -1, 6.5], [-34, 52, -9, 6.5], [1, 50, 2, 6]];
    crown.forEach(([x, y, z, r], i) => { const b = woolBall(r, ['#2E6646', '#3A7650', '#2A5C40'][i % 3], 'knit', { seed: i + 3, fuzz: false, seg: 16, lump: 0.08, mat: { scale: 0.8, sheen: 0.6 } }); at(b, x, y, z); b.castShadow = false; oak.add(b); });
    const oakLeaf = blobShape([[0, -3], [0.9, -2.2], [1.6, -2.4], [1.4, -1.2], [2.0, -0.6], [1.6, 0.4], [2.0, 1.2], [1.2, 1.6], [1.2, 2.4], [0.3, 2.6], [0, 3.2], [-0.3, 2.6], [-1.2, 2.4], [-1.2, 1.6], [-2.0, 1.2], [-1.6, 0.4], [-2.0, -0.6], [-1.4, -1.2], [-1.6, -2.4], [-0.9, -2.2]], 30);
    const leafGeo = feltGeo(oakLeaf, 0.2, { bevel: 0.06, bevelSeg: 1, curve: 3 });
    const lr = rng(5), leaves = [], lq = new T.Quaternion(), lq2 = new T.Quaternion(), le = new T.Euler();
    crown.forEach(([x, y, z, r]) => {
      for (let k = 0; k < 18; k++) {
        const a = lr() * TAU, e = -0.75 + lr() * 1.65, n = v3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e));
        if (n.z < -0.35) n.z = -n.z;
        lq.setFromUnitVectors(v3(0, 0, 1), n).multiply(lq2.setFromAxisAngle(v3(0, 0, 1), lr() * TAU));
        le.setFromQuaternion(lq, 'XYZ');
        leaves.push({ p: [x + n.x * r * 1.0, y + n.y * r * 1.0, z + n.z * r * 1.0], r: [le.x, le.y, le.z], s: 0.85 + lr() * 0.5, c: new T.Color().setHSL(0.27 + lr() * 0.08, 0.5, 0.3 + lr() * 0.12) });
      }
    });
    oak.add(scatter(leafGeo, wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#2A3A2A' }), leaves.length, (i) => leaves[i], { cast: false }));
    at(oak, -4, 0, -8);
    oak.rotation.y = 0.05;
    lite(oak, 4, 0.6);
    const oakSh = contactShadow(40, 26, 0.5); at(oakSh, -4, 0.2, -6); V.add(oakSh);
    // deux autres troncs, en bordure (on les voit en format large)
    const sideT = [[-54, -16, 6.5, 0.1], [50, -12, 5.5, -0.08]].map(([x, z, r, lean]) => applyM(latheGeo([[r * 1.35, 0], [r, 3], [r * 0.92, 30], [r * 0.85, 75]], { seg: 16, lump: 0.08, seed: x }), { p: [x, 0, z], r: [0, 0, lean] }));
    V.add(mesh(mergeGeos(sideT), wool('#4E3A2C', 'knit', { scale: 0.7, sheen: 0.4 })));

    // ---------- fougères et champignons ----------
    const leaflet = feltGeo(leafShape(0.9, 2.6, 0.1), 0.12, { bevel: 0.04, bevelSeg: 1, curve: 4 });
    const fronds = [], stems = [];
    const fernAt = (cx, cz, s, seed) => {
      const r = rng(seed), cy = H(cx, cz);
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU + r() * 0.5, L2 = s * (7 + r() * 3), up = s * (4 + r() * 2);
        const pts = [];
        for (let j = 0; j <= 8; j++) { const u = j / 8; pts.push(v3(cx + Math.cos(a) * L2 * u, cy + up * Math.sin(u * Math.PI * 0.85) + 0.2, cz + Math.sin(a) * L2 * u)); }
        stems.push(yarnGeo(pts, 0.14 * s, { radial: 4 }));
        const cv = curveOf(pts);
        for (let j = 1; j < 9; j++) {
          const u = j / 9.5, pt = cv.getPointAt(u), tg = cv.getTangentAt(u);
          const side = v3(-tg.z, 0, tg.x).normalize();
          for (const sd of [-1, 1]) {
            const ls = s * (1 - u * 0.75);
            const pp = pt.clone().addScaledVector(side, sd * 1.1 * ls);
            const yaw = Math.atan2(-side.x * sd, -side.z * sd);
            const e = new T.Euler().setFromQuaternion(new T.Quaternion().setFromAxisAngle(v3(0, 1, 0), yaw).multiply(new T.Quaternion().setFromAxisAngle(v3(1, 0, 0), -Math.PI / 2 - 0.3)), 'XYZ');
            fronds.push({ p: [pp.x, pp.y, pp.z], r: [e.x, e.y, e.z], s: ls, c: new T.Color().setHSL(0.33 + r() * 0.05, 0.5, 0.3 + r() * 0.08) });
          }
        }
      }
    };
    [[-30, 6, 1, 1], [-38, -6, 0.8, 2], [20, 8, 0.9, 3], [34, -2, 1.1, 4], [-16, 16, 0.75, 5], [40, 14, 0.85, 6]].forEach(([x, z, s, sd]) => fernAt(x, z, s, sd));
    V.add(scatter(leaflet, wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#2A4A3A' }), fronds.length, (i) => fronds[i], { cast: false }));
    V.add(mesh(mergeGeos(stems), wool('#3A6A44', 'yarn'), { cast: false }));
    const caps = [], capsG = [], stalks = [], dots = [];
    const capGeo = (r) => latheGeo([[0.01, 0], [r, 0.1], [r * 1.02, 0.4], [r * 0.85, r * 0.5], [r * 0.5, r * 0.75], [0.01, r * 0.8]], { seg: 18 });
    [[-22, 10, 2.6, 0.1], [-19, 12.5, 1.8, -0.2], [27, 10, 2.2, 0.15], [12, 14, 1.5, 0]].forEach(([x, z, r, tl]) => {
      const y = H(x, z), sh = r * 1.5;
      stalks.push(applyM(latheGeo([[r * 0.42, 0], [r * 0.36, sh * 0.5], [r * 0.3, sh]], { seg: 12 }), { p: [x, y, z] }));
      caps.push(applyM(capGeo(r), { p: [x, y + sh, z], r: [tl, 0, tl * 0.5] }));
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.4, d = r * (k % 2 ? 0.55 : 0.35); dots.push(applyM(new T.SphereGeometry(r * 0.13, 8, 5).scale(1, 0.4, 1), { p: [x + Math.cos(a) * d, y + sh + r * 0.62 - d * 0.32, z + Math.sin(a) * d] })); }
    });
    // petits champignons lumineux au pied du chêne
    [[-9, 3.5, 0.9], [-7.4, 4.8, 0.7], [-10.5, 5.2, 0.6], [3.5, 4.5, 0.8], [5, 3.2, 0.6]].forEach(([x, z, r]) => {
      const y = H(x, z), sh = r * 1.6;
      stalks.push(applyM(latheGeo([[r * 0.35, 0], [r * 0.3, sh]], { seg: 8 }), { p: [x, y, z] }));
      capsG.push(applyM(capGeo(r), { p: [x, y + sh, z] }));
    });
    V.add(mesh(mergeGeos(stalks), wool('#EFE6D2', 'felt'), { cast: false }));
    V.add(mesh(mergeGeos(caps), wool('#D2413A', 'felt', { sheen: 0.5 })));
    V.add(mesh(mergeGeos(dots), wool('#FFF6E6', 'felt'), { cast: false }));
    const glowCapM = wool('#7FE8D8', 'felt', { emissive: '#3FD8C8', emissiveIntensity: 1.0 }).clone();
    V.add(mesh(mergeGeos(capsG), glowCapM, { cast: false }));
    const shroomL = practical(V, [-3, 6, 7], '#58E0D0', 60, 30);

    // ---------- le hibou et le coucou ----------
    const owl = bird({ r: 4.3, color: '#8C6A4C', belly: '#EAD7B6', owl: { ring: '#F4E6C6', iris: '#F5B82C' }, beak: '#E2A43C', wing: '#6E5238', wingStitch: '#C8A878', tail: 'none', legs: false, head: 0.78, headY: 0.85, headZ: 0.12, eyeR: 0.18 });
    const O = owl.p;
    // ventre tacheté (petits chevrons brodés)
    // (surface du ventre : ellipsoïde de bird(), centré en (0, -0.12·bh, 0.58·bl))
    const bellyZ = (r, x, y) => { const bw = r * 0.95 * 0.72, bh = r * 0.9 * 0.75, bl = r * 1.05 * 0.45, cy = -r * 0.9 * 0.12, cz = r * 1.05 * 0.58; return cz + bl * Math.sqrt(Math.max(0, 1 - (x / bw) ** 2 - ((y - cy) / bh) ** 2)) + 0.05; };
    for (let k = 0; k < 5; k++) { const x = [-1.1, 1.1, 0, -1.2, 1.2][k], y = [0.7, 0.7, -0.5, -1.7, -1.7][k]; O.body.add(yarn([[x - 0.5, y + 0.3, bellyZ(4.3, x - 0.5, y + 0.3)], [x, y, bellyZ(4.3, x, y) + 0.05], [x + 0.5, y + 0.3, bellyZ(4.3, x + 0.5, y + 0.3)]], 0.09, '#9A7A58', { radial: 4, cast: false })); }
    lite(owl.g, 1.1, 0.8);
    at(owl.g, 15.5, 31.6, -5.6);
    owl.g.rotation.y = -0.3;
    V.add(owl.g);
    V.boilable(owl.g, 0.04, 0.5);
    const blinkO = blinker(O.eyes, 8);
    const cuck = bird({ r: 3.0, color: '#7B8AA6', belly: '#EDE8DC', beak: '#E8A33C', beakL: 0.6, wing: '#5A6888', wingStitch: '#B9C6E6', tail: 'fan', tailUp: 0.25, legs: false, eyeR: 0.17, cheeks: '#E9A2A8' });
    const C = cuck.p;
    // bec inférieur articulé
    const lowB = C.beak.clone();
    lowB.scale.set(0.8, 0.85, 0.55);
    const jaw = new T.Group();
    const bkL = 3.0 * 0.62 * 0.6;
    jaw.position.copy(C.beak.position);
    jaw.position.y -= 0.18; jaw.position.z -= bkL * 0.5;
    lowB.position.set(0, 0, bkL * 0.5);
    jaw.add(lowB);
    C.beak.parent.add(jaw);
    // rayures du ventre
    for (let k = 0; k < 3; k++) { const y0 = 0.2 - k * 0.75; C.body.add(yarn([[-1.1, y0 + 0.2, bellyZ(3, -1.1, y0 + 0.2)], [0, y0, bellyZ(3, 0, y0) + 0.04], [1.1, y0 + 0.2, bellyZ(3, 1.1, y0 + 0.2)]], 0.07, '#5A6680', { radial: 4, cast: false })); }
    lite(cuck.g, 0.9, 0.7);
    at(cuck.g, -18.5, 38.4, -5.3);
    cuck.g.rotation.y = 0.45;
    V.add(cuck.g);
    V.boilable(cuck.g, 0.04, 0.6);
    const blinkC = blinker(C.eyes, 2);
    // les petits arcs du chant (fil jaune pour le coucou, bleu pour le hibou)
    const arcs = (color, x, y, z, rot) => {
      const m = mesh(mergeGeos([0, 1, 2].map((k) => applyM(new T.TorusGeometry(1.6 + k * 1.1, 0.18, 5, 10, 1.1), { r: [0, 0, rot] }))), wool(color, 'yarn', { emissive: color, emissiveIntensity: 0.7 }), { cast: false });
      at(m, x, y, z); m.visible = false; V.add(m); return m;
    };
    const cArcs = arcs('#FFE49A', -13.8, 44.0, -2.5, -0.55);
    const oArcs = arcs('#A9C8FF', 10.6, 39.6, -2.8, Math.PI - 0.55);

    // ---------- les lucioles ----------
    const FN = P ? 14 : 44;
    const flies = new T.InstancedMesh(new T.SphereGeometry(0.42, 8, 6), new T.MeshBasicMaterial({ color: col('#DFFF8C').multiplyScalar(4), toneMapped: false, fog: false }), FN);
    flies.frustumCulled = false;
    V.add(flies);
    const fr = rng(13), F = [];
    for (let i = 0; i < FN; i++) F.push({ x: lerp(-40, 38, fr()), y: lerp(4, 46, fr()), z: lerp(-16, 18, fr()), a: fr() * TAU, b: fr() * TAU, s: 0.6 + fr() * 0.8, rad: 10 + fr() * 14, h: 4 + fr() * 40 });
    const flyL = practical(V, [-4, 22, 6], '#CFFF8A', 0, 70);
    const fm4 = new T.Matrix4(), fq = new T.Quaternion(), fsv = v3(), fpos = v3();
    let conf = null;
    if (!P) {
      pointCloud(V, { n: 60, box0: [-60, 30, -80], box1: [60, 110, -70], size: 1.5, sprite: 'spark', color: '#FFF4CC', glow: 1.5, twinkle: 1, wander: 0, vel: [0, 0, 0], opacity: 0.85 });
      pointCloud(V, { n: 50, box0: [-50, 2, -20], box1: [45, 50, 22], size: 0.8, color: '#B8C8FF', opacity: 0.25, vel: [0.2, 0.3, 0.1] });
      conf = confetti(V, { kinds: ['leaf', 'star'], n: 40, size: 0.9 });
    }
    V.onHome = (c) => { if (conf) conf.burst(v3(-4, 30, 7), 6, [c, '#DFFF8C', '#FFFFFF'], 0.4, 0.5); };

    // ---------- animation ----------
    let litF = 0, duet = false, done = false, nextCall = 0, lastT = null;
    const sing = (who, d = 0) => V.cue(who, d);
    V.anim((t, f) => {
      blinkO(t, f); blinkC(t, f);
      const dt = lastT == null ? 1 / FPS : clamp(t - lastT, 0, 3);
      lastT = t;
      const dk = done ? easeInOut(sat(V.age('done') / 1.5)) : 0;
      // duo : de la cinquième phrase à la fin, ils se répondent tout seuls
      if ((duet || done) && t >= nextCall) { sing('cou'); sing('hou', done ? 0.15 : 0.75); nextCall = t + (done ? 1.5 : 2.4); }
      // le coucou : tête renversée, bec ouvert, deux fois (cou-cou)
      const ca = V.age('cou');
      const c1 = bump(sat(ca / 0.32)), c2 = bump(sat((ca - 0.36) / 0.32)), cs = Math.max(c1, c2 * 0.9);
      C.head.rotation.set(-cs * 0.75 + Math.sin(t * 0.9) * 0.05, Math.sin(t * 0.6) * 0.35 * (1 - cs), Math.sin(t * 1.3) * 0.06);
      jaw.rotation.x = cs * 0.75;
      C.tail.rotation.x = cs * -0.35 + Math.sin(t * 2.1) * 0.05;
      C.wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * cs * 0.35; });
      cuck.g.position.set(-18.5, 38.4 + cs * 0.5, -5.3);
      cuck.g.rotation.set(0, 0.45, 0);
      cArcs.visible = cs > 0.25; cArcs.scale.setScalar(0.7 + sat(ca / 0.7) * 0.9);
      // le hibou : il se gonfle, hoche la tête (hou-hou), ailes entrouvertes
      const oa = V.age('hou');
      const o1 = bump(sat(oa / 0.36)), o2 = bump(sat((oa - 0.4) / 0.36)), os = Math.max(o1, o2 * 0.9);
      O.head.rotation.set(os * 0.3, Math.sin(t * 0.35) * 0.9 * (1 - os) + (V.age('look') < 1.2 ? bump(V.age('look') / 1.2) * 1.2 : 0), Math.sin(t * 0.8) * 0.06);
      O.body.scale.set(1 + os * 0.07, 1 + os * 0.09, 1 + os * 0.07);
      O.wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * os * 0.5; });
      owl.g.position.set(15.5, 31.6, -5.6);
      owl.g.rotation.set(0, -0.3, 0);
      oArcs.visible = os > 0.25; oArcs.scale.setScalar(0.7 + sat(oa / 0.8) * 0.9);
      O.eyes.forEach((e) => { e.scale.multiplyScalar(1 + os * 0.25); });
      // la lune brille à la fin
      moonM.emissiveIntensity = 0.45 + dk * 0.9;
      mhalo.material.opacity = 0.75 + dk * 0.6;
      mhalo.scale.setScalar(1 + dk * 0.35);
      moonL.intensity = dk * 900;
      // lucioles : elles s'allument avec les notes, et tourbillonnent à la fin
      const want = Math.round(FN * litF);
      for (let i = 0; i < FN; i++) {
        const q = F[i];
        fpos.set(q.x + Math.sin(t * 0.5 * q.s + q.a) * 3.5, q.y + Math.sin(t * 0.7 * q.s + q.b) * 2.2, q.z + Math.cos(t * 0.4 * q.s + q.a) * 3);
        if (dk > 0) {
          const ang = t * 1.1 * q.s + q.a, sw = v3(-4 + Math.cos(ang) * q.rad, q.h + Math.sin(t * 0.8 + q.b) * 2.5, -6 + Math.sin(ang) * q.rad * 0.7);
          fpos.lerp(sw, dk);
        }
        const blink = 0.55 + 0.45 * Math.max(0, Math.sin(t * (1.4 + q.s) + q.b * 3));
        const on = i < want ? 1 : 0;
        fm4.compose(fpos, fq, fsv.setScalar(Math.max(0.001, on * blink * (1 + dk * 0.3))));
        flies.setMatrixAt(i, fm4);
      }
      flies.instanceMatrix.needsUpdate = true;
      flyL.intensity = litF * 70 + dk * 60;
      glowCapM.emissiveIntensity = 0.85 + 0.15 * Math.sin(t * 1.3);
      shroomL.intensity = 50 + 10 * Math.sin(t * 1.3);
    });

    return {
      update(st, first) {
        litF = st.done ? 1 : st.p;
        duet = st.phrasesDone >= 4;
        if (st.done && !done) { done = true; if (first) V.cues.done = -10; else { V.cue('done'); nextCall = 0; } }
        if (!st.done) done = false;
      },
      react(kind, st) {
        if (kind === 'correct') { sing('cou'); V.cue('look', 0.3); }
        if (kind === 'phrase') { sing('cou'); sing('hou', 0.75); if (conf) conf.burst(v3(0, 34, 0), 10, ['#DFFF8C', '#FFFFFF', '#9FD7B8'], 0.6, 0.8); }
        if (kind === 'complete' && conf) { conf.burst(v3(-16, 42, 0), 18, ['#DFFF8C', '#FFE49A', '#FFFFFF', '#7FB57A'], 0.8, 1.0); conf.burst(v3(16, 36, 0), 18, ['#A9C8FF', '#FFFFFF', '#DFFF8C', '#7FB57A'], 0.8, 1.0); }
      },
      note(n, on, nt) {
        if (!on) return;
        const syl = ((nt && nt.syl) || '').toLowerCase();
        const owlTurn = /hi|bou/.test(syl) ? true : /cou/.test(syl) ? false : n % 2 === 1;
        sing(owlTurn ? 'hou' : 'cou');
      },
    };
  },
};
