/* ============ Promenons-nous dans les bois : la forêt de sapins tricotés ============
   Deux enfants avancent sur le sentier à mesure qu'on retrouve les notes.
   Le loup, caché derrière le gros sapin près de sa cabane, s'habille au fil
   des phrases (les habits quittent un à un la corde à linge) et le dit dans
   une bulle : culotte, chemise, chapeau, bottes… À la fin : « J'arrive ! »,
   il sort d'un bond, la langue au vent, et danse avec les enfants qui rient.
   Écoute : il tape du pied en rythme derrière son arbre. */
SCENES.foret = {
  color: '#2C5A3B',
  view: {
    bg: '#2A4A33', fov: 26,
    rig: { target: [3, 14, 0], az: 0, el: 6, box: [66, 54], targetWide: [3, 15.5, 0], boxWide: [100, 46] },
    post: { exposure: 1.24, bloom: 0.65, bloomThr: 0.95, aper: 8, maxBlur: 12, sat: 1.14, lift: '#03100A', punch: 1.24, vignette: 0.4, grain: 0.04 },
  },
  sky: [-30, 8, 27, 36, -18, -6],
  home: [-6, 15, 2],
  flock: 5,
  build(V, o) {
    const song = o.song, NP = song.phrases.length, live = !o.portrait;
    studioLights(V, {
      key: { color: '#FFE6B5', k: 2.7, az: -55, el: 42, area: 85 },
      fill: { sky: '#A4CDA8', ground: '#3C4A2A', k: 0.5 },
      rim: { color: '#FFF0C4', k: 1.7, az: -150, el: 32 },
      env: { sky: '#A9CBA4', ground: '#34452C', k: 0.35, boxK: 3 },
      fog: { color: '#86AE8E', near: 190, far: 560 },
    });
    const noShadow = (g) => { g.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return g; };
    const faceCam = (m) => { const g = m.geometry, n = g.attributes.normal; if (n.getZ(n.count - 25) < 0) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } ix.needsUpdate = true; g.computeVertexNormals(); } return m; };
    const lighter = (root, maxR, seg, shells) => {
      root.traverse((m) => {
        if (shells && m.userData.isFuzz) m.count = Math.min(m.count, shells);
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
    // les toutes petites pièces (yeux, joues, boutons, mains) : ni ombre portée ni duvet
    const trim = (root, sr, fr) => root.traverse((m) => {
      if (!m.isMesh || m.isInstancedMesh || !m.geometry) return;
      const g = m.geometry;
      if (!g.boundingSphere) g.computeBoundingSphere();
      const r = g.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z);
      if (r < sr) m.castShadow = false;
      if (r < fr) m.children.filter((c) => c.userData.isFuzz).forEach((c) => m.remove(c));
    });
    const instKnit = wool('#FFFFFF', 'knit', { sheen: 0.5, sheenColor: '#56664A' });
    const instFelt = wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#7A7A7A' });

    // fond : drap vert doré, forêts de feutrine découpée, sol de mousse tricotée
    V.add(faceCam(cyclo({ w: 560, h: 110, z: -100, r: 30, floor: 30, top: '#CFE3B0', mid: '#93BD8C', bottom: '#557E5A', scale: 3 })));
    const ground = terrain({ w: 360, d: 240, nx: 60, nz: 44, z: 20, hills: [[16, -2, 10, 1.6], [-50, -50, 40, 6], [60, -56, 40, 7]], colors: ['#4F6D36', '#45612F'], bands: 5, rough: 0.9, scale: 2.0 });
    V.add(ground);
    const H = (x, z) => ground.userData.height(x, z);
    const forestShape = (w, h, n, seed) => {
      const r = rng(seed), pts = [[-w / 2, -10]];
      for (let i = 0; i < n; i++) {
        const x0 = -w / 2 + (i / n) * w, bw = w / n, hh = h * (0.6 + r() * 0.55);
        pts.push([x0, hh * 0.3], [x0 + bw * 0.18, hh * 0.45], [x0 + bw * 0.08, hh * 0.5], [x0 + bw * 0.3, hh * 0.72], [x0 + bw * 0.2, hh * 0.76], [x0 + bw * 0.5, hh], [x0 + bw * 0.8, hh * 0.76], [x0 + bw * 0.7, hh * 0.72], [x0 + bw * 0.92, hh * 0.5], [x0 + bw * 0.82, hh * 0.45], [x0 + bw, hh * 0.3]);
      }
      pts.push([w / 2, -10]);
      return polyShape(pts);
    };
    const farF = flatLayer(forestShape(460, 46, 26, 3), '#5E8A64', { depth: 1, inset: 1.0, stitch: '#88B08A', st: { len: 1.4, gap: 1.0, r: 0.12 } });
    at(farF, 0, -2, -90);
    V.add(noShadow(farF));
    const midF = flatLayer(forestShape(400, 38, 20, 8), '#3F6E4A', { depth: 1, inset: 1.0, stitch: '#6E9C74', st: { len: 1.1, gap: 0.8, r: 0.11 } });
    at(midF, 14, -2, -74);
    V.add(noShadow(midF));

    // le soleil, très haut derrière les arbres, d'où tombent les rais de lumière
    const sunG = new T.Group();
    sunG.add(feltPiece(circleShape(5), '#FFD45A', { depth: 1.6, inset: 0.65, stitch: '#F09A2E', st: { len: 0.55, gap: 0.35, r: 0.08 }, mat: { emissive: '#FFC040', emissiveIntensity: 0.9 } }));
    const rays = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + 0.2, r0 = 5.8, r1 = i % 2 ? 7.6 : 8.6; rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.08) * (r0 + r1) / 2, Math.sin(a + 0.08) * (r0 + r1) / 2, 0.2], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.32, { radial: 5 })); }
    sunG.add(mesh(mergeGeos(rays), wool('#FFC23A', 'yarn', { emissive: '#FFB020', emissiveIntensity: 0.7 }), { cast: false }));
    addFace(sunG, 4.8, { z: 0.85, cheeks: '#F58A5C', sleepy: true });
    noShadow(sunG);
    at(sunG, -30, 41, -66);
    const hSun = hang(sunG, 160, { amp: 1, per: 6 });
    V.add(hSun);
    swingAnim(V, hSun);
    const halo = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFE6A0').multiplyScalar(0.6), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    at(halo, -30, 41, -72);
    V.add(halo);

    // les sapins tricotés (instances) : cônes empilés et troncs
    const pineGeo = (() => { const gs = []; for (let i = 0; i < 5; i++) { const t = i / 5, rr = 9.5 * (1 - t * 0.6), y0 = 6 + t * 27, hh = 13; gs.push(applyM(latheGeo([[rr * 0.9, -1.0], [rr, -0.2], [rr * 0.93, hh * 0.1], [rr * 0.72, hh * 0.3], [rr * 0.42, hh * 0.6], [0.2, hh]], { seg: 13, lump: 0.1, seed: i + 2 }), { p: [0, y0, 0] })); } return mergeGeos(gs); })();
    const trunkGeo = new T.CylinderGeometry(1.1, 1.6, 12, 8);
    trunkGeo.translate(0, 6, 0);
    const pines = [];
    const pr = rng(17);
    [[-34, 13, 1.0], [-48, 9, 1.0], [-62, 13, 1.0], [-78, 14, 1.0]].forEach(([z, n, k], row) => {
      for (let i = 0; i < n; i++) {
        const x = -120 + (i + 0.5) * (240 / n) + (pr() - 0.5) * 12;
        if (row === 0 && x > -4 && x < 22) continue; // trouée du sentier
        pines.push([x, z + (pr() - 0.5) * 6, 0.9 + pr() * 0.6]);
      }
    });
    pines.push([-40, -14, 1.25], [-27, -24, 1.1], [44, -12, 1.3], [-52, 4, 1.4], [56, 2, 1.35], [-36, 34, 1.5]);
    const PC = ['#2E6B45', '#3B7A4E', '#285E3D', '#447F52', '#356F48'];
    V.add(scatter(pineGeo, instKnit, pines.length, (i, r) => { const [x, z, s] = pines[i]; return { p: [x, H(x, z) + 1.5 * s, z], r: [0, r() * TAU, 0], s, c: PC[i % PC.length] }; }));
    V.add(scatter(trunkGeo, instKnit, pines.length, (i) => { const [x, z, s] = pines[i]; return { p: [x, H(x, z) - 0.5, z], s, c: '#5E3E2A' }; }));

    // le gros sapin du loup (au premier rang, à droite du sentier)
    const TX = 13, TZ = 1;
    const hero = new T.Group();
    const trunkM = wool('#6E4A32', 'knit', { scale: 0.7 });
    hero.add(mesh(latheGeo([[4.8, 0], [3.5, 1.2], [3.0, 4], [2.7, 22], [2.2, 40], [1.2, 62], [0.3, 70]], { seg: 20, lump: 0.06, seed: 3 }), trunkM));
    const bark = [];
    for (let i = 0; i <= 150; i++) { const t = i / 150, y = 1.5 + t * 25.5, a = t * TAU * 13; const rr = lerp(3.25, 2.72, t) + 0.08; bark.push([Math.cos(a) * rr, y, Math.sin(a) * rr]); }
    hero.add(mesh(yarnGeo(bark, 0.2, { radial: 4, maxSeg: 600 }), wool('#5E3E2C', 'yarn'), { cast: false }));
    hero.add(mesh(mergeGeos([0.4, 2.3, 4.2].map((a) => yarnGeo([[Math.cos(a) * 2.6, 1.6, Math.sin(a) * 2.6], [Math.cos(a) * 4.6, 0.6, Math.sin(a) * 4.6], [Math.cos(a) * 6.4, 0.1, Math.sin(a) * 6.4]], 0.7, { radial: 6 }))), trunkM));
    const heroCones = [];
    for (let i = 0; i < 4; i++) {
      const rr = 14 * (1 - i * 0.2), y0 = 27 + i * 9.5, hh = 17;
      const c = mesh(latheGeo([[rr, 0], [rr * 0.94, hh * 0.12], [rr * 0.5, hh * 0.52], [0.2, hh]], { seg: 22, lump: 0.07, seed: i + 7 }), wool(i % 2 ? '#2F6E46' : '#3A7D50', 'knit', { scale: 0.85 }));
      c.position.y = y0;
      fuzz(c, 0.18);
      hero.add(c);
      heroCones.push(c);
    }
    const heroSh = contactShadow(22, 16, 0.5);
    heroSh.position.y = 0.15;
    hero.add(heroSh);
    at(hero, TX, H(TX, TZ) - 0.4, TZ);
    V.add(hero);

    // le sentier (ruban de tricot clair) et ses cailloux
    const pathPts = [[-62, 0, 12], [-42, 0, 7], [-24, 0, 4], [-7, 0, 3], [5, 0, -2], [9, 0, -13], [6, 0, -29], [1, 0, -48]];
    const pathC = curveOf(pathPts);
    const PN = 70, ppos = [], puv = [], pidx = [];
    let plen = 0;
    const pPrev = v3();
    for (let i = 0; i <= PN; i++) {
      const t = i / PN, p = pathC.getPoint(t), tg = pathC.getTangent(t);
      if (i) plen += p.distanceTo(pPrev);
      pPrev.copy(p);
      const w = lerp(10, 4.5, t), nx = -tg.z, nz = tg.x, nl = Math.hypot(nx, nz) || 1;
      for (const s of [-1, 1]) { const x = p.x + (nx / nl) * w * 0.5 * s, z = p.z + (nz / nl) * w * 0.5 * s; ppos.push(x, H(x, z) + 0.12, z); puv.push(s * w * 0.5, plen); }
      if (i) { const a = (i - 1) * 2; pidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const pathG = new T.BufferGeometry();
    pathG.setAttribute('position', new T.Float32BufferAttribute(ppos, 3));
    pathG.setAttribute('uv', new T.Float32BufferAttribute(puv, 2));
    pathG.setIndex(pidx);
    pathG.computeVertexNormals();
    if (pathG.attributes.normal.getY(0) < 0) { for (let i = 0; i < pidx.length; i += 3) { const a = pidx[i + 1]; pidx[i + 1] = pidx[i + 2]; pidx[i + 2] = a; } pathG.setIndex(pidx); pathG.computeVertexNormals(); }
    V.add(mesh(pathG, wool('#B49B72', 'knit', { scale: 0.8 }), { cast: false }));
    const pebGeo = blobGeo(1, 0.5, 0.8, { seg: 8, lump: 0.15, seed: 5 });
    V.add(scatter(pebGeo, instFelt, 44, (i, r) => { const t = 0.02 + (i / 44) * 0.6, p = pathC.getPoint(t), tg = pathC.getTangent(t), w = lerp(10, 4.5, t) * 0.5 + 0.6 + r() * 0.8, s = i % 2 ? 1 : -1; const x = p.x - tg.z * w * s, z = p.z + tg.x * w * s; const g = 0.55 + r() * 0.25; return { p: [x, H(x, z) + 0.1, z], r: [0, r() * 3, 0], s: 0.5 + r() * 0.6, c: new T.Color(g * 0.62, g * 0.6, g * 0.55) }; }, { cast: false }));

    // champignons, fougères, pommes de pin (instances)
    const stemG = latheGeo([[0.7, 0], [0.55, 1.6], [0.5, 3], [0.01, 3.05]], { seg: 10 });
    const capG = latheGeo([[0.01, -0.2], [1.4, -0.25], [2.1, 0.15], [1.9, 0.9], [1.1, 1.6], [0.01, 1.8]], { seg: 14, lump: 0.05 });
    capG.translate(0, 2.9, 0);
    const shrooms = [[-20, 22, 1.2, '#D9433A'], [-17, 25, 0.8, '#D9433A'], [24, 14, 1.0, '#C9853E'], [27, 12, 0.7, '#C9853E'], [-8, -10, 0.9, '#D9433A'], [33, -6, 1.1, '#D9433A'], [-30, -4, 1.0, '#C9853E'], [4, 18, 0.7, '#E8B04A'], [18, -12, 0.8, '#C9853E'], [-9, 40, 1.6, '#D9433A'], [-6, 43, 1.0, '#D9433A'], [15, 36, 1.3, '#C9853E']];
    V.add(scatter(stemG, instFelt, shrooms.length, (i) => { const [x, z, s] = shrooms[i]; return { p: [x, H(x, z) - 0.1, z], s, c: '#F2E6CC' }; }));
    V.add(scatter(capG, instKnit, shrooms.length, (i) => { const [x, z, s, c] = shrooms[i]; return { p: [x, H(x, z) - 0.1, z], s, c }; }));
    const sdots = [];
    shrooms.forEach(([x, z, s, c], k) => { if (c !== '#D9433A') return; const r = rng(k + 3); for (let i = 0; i < 6; i++) { const a = r() * TAU, e = 0.35 + r() * 0.75; const n = v3(Math.cos(e) * Math.sin(a) / 2.1, Math.sin(e) / 1.7, Math.cos(e) * Math.cos(a) / 2.1).normalize(); sdots.push({ p: [x + Math.cos(e) * Math.sin(a) * 2.2 * s, H(x, z) - 0.1 + (2.9 + 0.15 + Math.sin(e) * 1.78) * s, z + Math.cos(e) * Math.cos(a) * 2.2 * s], n, s: s * (0.2 + r() * 0.12) }); } });
    V.add(scatter(feltGeo(circleShape(1), 0.1, { bevel: 0 }), instFelt, sdots.length, (i) => { const d = sdots[i]; const e = new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(v3(0, 0, 1), d.n)); return { p: d.p, r: [e.x, e.y, e.z], s: d.s, c: '#FFF6E6' }; }, { cast: false }));
    // pommes de pin et touffes de mousse
    const coneGeo = blobGeo(0.9, 1.4, 0.9, { seg: 10, lump: 0.25, seed: 9 });
    V.add(scatter(coneGeo, instKnit, 26, (i, r) => { const x = (r() - 0.5) * 90, z = -20 + r() * 70; return { p: [x, H(x, z) + 0.5, z], r: [1.4 + r() * 0.3, r() * TAU, 0], s: 0.8 + r() * 0.5, c: ['#8A5A36', '#7A4E2E', '#9A6A42'][i % 3] }; }));
    const mossG = (() => { const gs = []; const r = rng(5); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + r(), hh = 2 + r() * 2.2, ln = 1 + r() * 0.8; gs.push(yarnGeo([[Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], [Math.cos(a) * ln * 0.3, hh * 0.55, Math.sin(a) * ln * 0.3], [Math.cos(a) * ln, hh, Math.sin(a) * ln]], 0.18, { radial: 3, maxSeg: 4 })); } return mergeGeos(gs); })();
    V.add(scatter(mossG, wool('#FFFFFF', 'yarn', { sheen: 0.6, sheenColor: '#56664A' }), 90, (i, r) => { let x = (r() - 0.5) * 110, z = -24 + r() * 84; if (Math.abs(z - 3) < 6 && x < 6) z += 9; return { p: [x, H(x, z) - 0.2, z], r: [0, r() * TAU, 0], s: 0.8 + r() * 0.8, c: ['#5C8A3E', '#4E7A34', '#6C9A46', '#7AA24A'][i % 4] }; }, { cast: false }));
    // une bûche moussue au premier plan
    const logF = new T.Group();
    const lg = mesh(new T.CylinderGeometry(3.2, 3.4, 22, 16, 1).rotateZ(Math.PI / 2), wool('#7A5236', 'knit', { scale: 0.6 }));
    logF.add(lg);
    for (const s of [-1, 1]) { const end = mesh(feltGeo(circleShape(3.1), 0.3, { bevel: 0.08 }), wool('#D8B482', 'felt')); end.rotation.y = s * Math.PI / 2; end.position.x = s * 11.05; logF.add(end); }
    [[-6, 2.9, 0.6, 2.4], [1, 3.1, -0.4, 2.8], [7, 2.7, 1.2, 2.0]].forEach(([x, y, z, r]) => { const m = woolBall(r, '#6E9A44', 'crochet', { sx: 1.3, sy: 0.45, seed: x + 20, fuzz: 0.2 }); m.position.set(x, y, z); logF.add(m); });
    logF.rotation.y = 0.35;
    at(logF, 27, H(27, 40) + 2.9, 40);
    V.add(logF);
    const frondGeo = (() => {
      const gs = [];
      for (let f = 0; f < 6; f++) {
        const pts = [[0, 0]];
        const L = 9, n = 7;
        for (let i = 1; i <= n; i++) { const y = (i / n) * L, w = 1.5 * Math.sin((i / (n + 1)) * Math.PI) + 0.2; pts.push([w, y - 0.6], [w * 0.35, y - 0.2]); }
        pts.push([0, L + 0.6]);
        for (let i = n; i >= 1; i--) { const y = (i / n) * L, w = 1.5 * Math.sin((i / (n + 1)) * Math.PI) + 0.2; pts.push([-w * 0.35, y - 0.2], [-w, y - 0.6]); }
        const g = feltGeo(polyShape(pts), 0.14, { bevel: 0 });
        const p = g.attributes.position;
        for (let k = 0; k < p.count; k++) { const y = p.getY(k), z = p.getZ(k), a = (y / L) * 1.2; p.setXYZ(k, p.getX(k), Math.sin(a) * (L / 1.2) * 0.9 + z * Math.cos(a) * 0, (1 - Math.cos(a)) * (L / 1.2) * 0.9 + z); }
        g.computeVertexNormals();
        g.rotateX(-0.25);
        g.rotateY((f / 6) * TAU + 0.3);
        gs.push(g);
      }
      return mergeGeos(gs);
    })();
    const ferns = [[-34, 8, 1.1], [-38, 18, 1.3], [-2, 16, 0.8], [22, 20, 1.2], [30, 2, 1.0], [-14, -16, 1.0], [38, 24, 1.4], [-28, 28, 1.0], [10, 26, 0.9], [-46, -2, 1.2], [26, -20, 0.9], [-17, 46, 0.85], [21, 50, 1.7], [-31, 42, 0.8], [33, 40, 1.6], [4, 56, 1.0], [-40, 52, 1.6]];
    V.add(scatter(frondGeo, instFelt, ferns.length, (i, r) => { const [x, z, s] = ferns[i]; return { p: [x, H(x, z) - 0.2, z], r: [0, r() * TAU, 0], s, c: ['#5E9A48', '#4E8A3E', '#6CA852'][i % 3] }; }));

    // la cabane du loup, sa fenêtre chaude et sa cheminée
    const cab = new T.Group();
    const CW = 18, CH = 13, CD = 13;
    cab.add(wallPanel(CW, CH, [[-4.2, 0, 4.6, 8.2, true], [4.2, 5.2, 4.6, 4.2]], { color: '#8A6040', depth: 2, gable: 6, scale: 0.7 }));
    const logs = [];
    for (let y = 1.2; y < CH; y += 1.85) logs.push(applyM(new T.CylinderGeometry(0.75, 0.75, CD + 2.4, 10).rotateX(Math.PI / 2), { p: [-CW / 2 - 0.2, y, -CD / 2 + 0.6] }), applyM(new T.CylinderGeometry(0.75, 0.75, CD + 2.4, 10).rotateX(Math.PI / 2), { p: [CW / 2 + 0.2, y, -CD / 2 + 0.6] }));
    const logM = wool('#7A5236', 'knit', { scale: 0.6 });
    cab.add(mesh(mergeGeos(logs), logM));
    const lines = [];
    for (let y = 2.1; y < CH; y += 1.85) { const seg = []; for (const [a, b] of [[-CW / 2 + 0.3, -6.6], [-1.8, 1.8], [6.6, CW / 2 - 0.3]]) seg.push(yarnGeo([[a, y, 1.15], [b, y, 1.15]], 0.16, { radial: 4 })); lines.push(...seg); }
    cab.add(mesh(mergeGeos(lines), wool('#5C3C26', 'yarn'), { cast: false }));
    const back = mesh(new T.BoxGeometry(CW, CH, 1.2), logM);
    back.position.set(0, CH / 2, -CD + 0.8);
    cab.add(back);
    for (const s of [-1, 1]) {
      const pan = mesh(new T.BoxGeometry(12.6, 1.4, CD + 4), wool('#3F6B3E', 'knit', { scale: 0.7 }));
      pan.position.set(s * 5.1, CH + 3.15, -CD / 2 + 0.8);
      pan.rotation.z = -s * Math.atan2(6, 9);
      fuzz(pan, 0.14);
      cab.add(pan);
    }
    const chim = mesh(new T.BoxGeometry(2.8, 7, 2.8), wool('#8E8A80', 'knit', { scale: 0.5 }));
    chim.position.set(5.2, CH + 6.2, -CD / 2);
    cab.add(chim);
    const door = mesh(feltGeo(polyShape([[0, 0], [4.4, 0], [4.4, 5.9], [3.9, 7.2], [2.2, 7.9], [0.5, 7.2], [0, 5.9]]), 0.8), wool('#5A3A26', 'knit', { scale: 0.5 }));
    door.position.set(-6.4, 0.1, 0.2);
    cab.add(door);
    const knob = bead(0.35, '#E0B24A');
    knob.position.set(-2.8, 3.8, 0.75);
    cab.add(knob);
    const win = mesh(new T.PlaneGeometry(4.6, 4.2), glowMat('#FFC66E', 1.9), { cast: false });
    win.position.set(4.2, 7.3, -0.6);
    cab.add(win);
    const cross = mergeGeos([yarnGeo([[4.2, 5.2, 0.9], [4.2, 9.4, 0.9]], 0.18, { radial: 4 }), yarnGeo([[1.9, 7.3, 0.9], [6.5, 7.3, 0.9]], 0.18, { radial: 4 })]);
    cab.add(mesh(cross, wool('#4A3020', 'yarn'), { cast: false }));
    const woodpile = [];
    for (let i = 0; i < 9; i++) { const row = i < 4 ? 0 : i < 7 ? 1 : 2, k = row === 0 ? i : row === 1 ? i - 4 : i - 7; woodpile.push(applyM(new T.CylinderGeometry(0.85, 0.85, 5.5, 10).rotateX(Math.PI / 2), { p: [CW / 2 + 3.2 + (k - (row === 0 ? 1.5 : row === 1 ? 1 : 0.5)) * 1.75, 0.85 + row * 1.5, -3] })); }
    cab.add(mesh(mergeGeos(woodpile), wool('#9A6A44', 'knit', { scale: 0.5 })));
    cab.rotation.y = -0.38;
    at(cab, 27, H(27, -25) - 0.3, -25);
    V.add(cab);
    cab.updateMatrixWorld(true);
    const winW = win.getWorldPosition(v3());
    practical(V, [winW.x - 1, winW.y, winW.z - 3], '#FFA850', 160, 40);
    const chimTop = chim.getWorldPosition(v3()).add(v3(0, 3.6, 0));

    // la corde à linge : les habits du loup attendent d'être mis
    const poleX = -16, poleZ = -29;
    const pole = mesh(latheGeo([[0.45, 0], [0.4, 19], [0.25, 19.6]], { seg: 8 }), wool('#7A5236', 'knit', { scale: 0.5 }));
    at(pole, poleX, H(poleX, poleZ) - 0.3, poleZ);
    V.add(pole);
    const cabCorner = v3(-CW / 2 + 0.2, CH - 1, 1.4).applyMatrix4(cab.matrixWorld);
    const A = v3(poleX, H(poleX, poleZ) + 18.8, poleZ), B = cabCorner;
    const ropeAt = (u) => { const p = A.clone().lerp(B, u); p.y -= Math.sin(u * Math.PI) * 2.6; return p; };
    V.add(yarn([0, 0.2, 0.4, 0.6, 0.8, 1].map(ropeAt), 0.12, '#E9DFC8', { radial: 5, cast: false }));
    const pinGeo = mergeGeos([applyM(new T.BoxGeometry(0.35, 1.5, 0.3), { p: [-0.2, 0, 0] }), applyM(new T.BoxGeometry(0.35, 1.5, 0.3), { p: [0.2, 0, 0] })]);
    const pinM = wool('#D9B98A', 'felt');
    const hanging = [];
    const hangUp = (shape, colr, u, stitch) => {
      const g = new T.Group();
      const pc = feltPiece(shape, colr, { depth: 0.35, inset: 0.35, stitch, st: { len: 0.35, gap: 0.22, r: 0.05 } });
      g.add(pc);
      const pin = mesh(pinGeo, pinM, { cast: false });
      pin.position.set(0, 0.2, 0.3);
      g.add(pin);
      const p = ropeAt(u);
      g.position.copy(p);
      g.rotation.y = -0.12;
      V.add(g);
      const h = { g, on: true, k: 1, ph: u * 9 };
      hanging.push(h);
      return h;
    };
    const shortsSh = polyShape([[-3, 0], [3, 0], [3.3, -3.6], [0.7, -3.8], [0, -1.6], [-0.7, -3.8], [-3.3, -3.6]]);
    const shirtSh = polyShape([[-1.4, 0], [1.4, 0], [3.0, -0.6], [4.6, -2.6], [3.6, -3.5], [2.5, -2.3], [2.5, -6.4], [-2.5, -6.4], [-2.5, -2.3], [-3.6, -3.5], [-4.6, -2.6], [-3.0, -0.6]]);
    const hatSh = blobShape([[-3.6, -2.6], [-2.2, -2.4], [-1.9, -0.6], [-0.6, 0.2], [0.8, 0.1], [1.9, -0.7], [2.2, -2.4], [3.6, -2.5], [3.4, -3.1], [-3.4, -3.1]]);
    const bootSh = polyShape([[-0.9, 0], [0.9, 0], [0.9, -3.4], [2.6, -3.6], [2.8, -4.6], [-0.9, -4.6]]);
    const lineItems = [
      hangUp(shortsSh, '#3E6FD8', 0.13, '#A9C2F2'),
      hangUp(shirtSh, '#D8443A', 0.3, '#F7C6BE'),
      hangUp(hatSh, '#E3A436', 0.47, '#7A4A1E'),
    ];
    const boots2 = new T.Group();
    for (const s of [-1, 1]) { const b = feltPiece(bootSh, '#4A2E22', { depth: 0.35, inset: 0.32, stitch: '#C99A6A', st: { len: 0.35, gap: 0.22, r: 0.05 } }); b.position.x = s * 1.8; boots2.add(b); }
    const pin2 = mesh(pinGeo, pinM, { cast: false });
    pin2.position.set(0, 0.2, 0.3);
    boots2.add(pin2);
    boots2.position.copy(ropeAt(0.63));
    boots2.rotation.y = -0.12;
    V.add(boots2);
    hanging.push({ g: boots2, on: true, k: 1, ph: 7 });
    lineItems.push(hanging[3]);

    // le loup, gris, debout, avec de grands yeux et un sourire de gentil
    const WX = 19.5, WZ = -4;
    const wf = critter({ size: 14, color: '#8F96A0', belly: '#E6E2D8', pose: 'stand', head: 0.36, snout: 0.62, snoutCol: '#E8E3D8', nose: '#2A2226', noseR: 0.12, eyeR: 0.12, eyeY: 20, eyeSpread: 28, whites: '#FFFFFF', ears: 'point', earH: 0.85, earAz: 56, earEl: 46, earIn: '#F2B3B8', tail: 'bushy', tailTip: '#E6E2D8', cheeks: '#F2A0A0', fuzz: 0.16, paw: '#737A84' });
    lighter(wf.g, 1.4, 14);
    const WP = wf.p, br = wf.br, hs = wf.hs, hr = [hs, hs * 0.92, hs * 0.95];
    // pieds bien posés au sol
    const lr = 14 * 0.07, footY = 0.35 * br[1] - lr * 1.25 * 0.7;
    const wolfLift = -footY + 0.1;
    // sourire et langue
    const snC = v3(0, -hs * 0.22, hr[2] * 0.72), snR = [hs * 0.42, hs * 0.32, hs * 0.62];
    const sp = (az, el, k = 1.02) => { const q = surf(snR, az, el); return q.p.multiplyScalar(k).add(snC); };
    WP.head.add(yarn([sp(-62, -18), sp(-30, -40), sp(0, -46, 1.03), sp(30, -40), sp(62, -18)], 0.13, '#3A2426', { radial: 5, cast: false }));
    const tongue = felt(blobShape([[-0.7, 0], [0.7, 0], [0.8, -1.2], [0, -2.0], [-0.8, -1.2]]), '#F27A8A', 0.3, { bevel: 0.1 });
    const tq = sp(0, -50, 1.0);
    tongue.position.copy(tq).add(v3(0, 0.2, 0.2));
    tongue.rotation.x = 0.5;
    tongue.scale.setScalar(0.001);
    WP.head.add(tongue);
    // habits de feutrine (cachés au départ)
    const ell = (y, k, add) => k * br[0] * Math.sqrt(Math.max(0, 1 - (y / br[1]) ** 2)) + add;
    const cloth = {};
    // culotte : short bleu + revers sur les cuisses + bouton et pièce cousue
    cloth.culotte = new T.Group();
    {
      const prof = [];
      for (let i = 0; i <= 8; i++) { const y = lerp(-0.98, -0.12, i / 8) * br[1]; prof.push([ell(y, 1.08, 0.22), y]); }
      prof.unshift([0.01, -0.99 * br[1]]);
      const sh = mesh(latheGeo(prof, { seg: 24 }), wool('#3E6FD8', 'felt'));
      sh.scale.z = 1.12;
      cloth.culotte.add(sh);
      const btn = bead(0.42, '#F5C32C');
      btn.position.set(0, -0.2 * br[1], ell(-0.2 * br[1], 1.08, 0.3) * 1.12);
      cloth.culotte.add(btn);
      const patch = feltPiece(roundRectShape(1.8, 1.6, 0.3), '#7FA3EA', { depth: 0.15, inset: 0.22, stitch: '#FFFFFF', st: { len: 0.22, gap: 0.14, r: 0.035 } });
      const pq = surf([br[0] * 1.1, br[1], br[2] * 1.2], 38, -40);
      faceTo(at(patch, pq.p.x, pq.p.y, pq.p.z), pq.n);
      cloth.culotte.add(patch);
      cloth.culotte.userData.legs = WP.legs.map((L) => { const c = mesh(latheGeo([[lr * 1.55, 0], [lr * 1.7, -1.4], [lr * 1.8, -2.0], [lr * 1.6, -2.1]], { seg: 14 }), wool('#3E6FD8', 'felt')); c.position.y = 0.6; L.add(c); return c; });
    }
    // chemise rouge à boutons blancs et col
    cloth.chemise = new T.Group();
    {
      const prof = [];
      for (let i = 0; i <= 9; i++) { const y = lerp(-0.22, 0.9, i / 9) * br[1]; prof.push([ell(y, 1.1, 0.34), y]); }
      prof.push([0.01, 0.9 * br[1]]);
      const sh = mesh(latheGeo(prof, { seg: 24 }), wool('#D8443A', 'knit', { scale: 0.5 }));
      sh.scale.z = 1.08;
      cloth.chemise.add(sh);
      for (let i = 0; i < 3; i++) { const y = (0.55 - i * 0.28) * br[1]; const b = bead(0.34, '#FFFFFF'); b.position.set(0, y, ell(y, 1.1, 0.42) * 1.08); cloth.chemise.add(b); }
      for (const s of [-1, 1]) {
        const c = feltPiece(polyShape([[0, 0], [s * 2.2, 0.3], [s * 0.9, -1.7]]), '#FFFFFF', { depth: 0.2, inset: 0.2, stitch: '#E0C8C0', st: { len: 0.2, gap: 0.14, r: 0.03 } });
        c.position.set(s * 0.2, 0.86 * br[1], ell(0.86 * br[1], 1.1, 0.4) * 1.08 - 0.1);
        c.rotation.x = -0.5;
        cloth.chemise.add(c);
      }
      cloth.chemise.userData.arms = WP.arms.map((Ar) => { const c = mesh(latheGeo([[lr * 1.5, 0.4], [lr * 1.65, -0.6], [lr * 1.6, -2.3], [lr * 1.75, -2.6], [lr * 1.4, -2.7]], { seg: 14 }), wool('#D8443A', 'knit', { scale: 0.5 })); Ar.add(c); return c; });
    }
    // chapeau tyrolien moutarde à plume
    cloth.chapeau = new T.Group();
    {
      const hm = wool('#E3A436', 'felt');
      const crown = mesh(latheGeo([[2.4, 0], [2.2, 2.0], [1.6, 3.0], [0.01, 3.3]], { seg: 20 }), hm);
      const brim = mesh(latheGeo([[0.01, 0], [3.4, -0.1], [3.9, 0.35], [3.6, 0.45], [2.2, 0.3]], { seg: 22 }), hm);
      const band = mesh(new T.TorusGeometry(2.35, 0.26, 6, 22), wool('#5A3418', 'felt'));
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.55;
      const feather = feltPiece(leafShape(1.3, 5.2, 0.5), '#D8443A', { depth: 0.18, inset: 0.2, stitch: '#F7C6BE', st: { len: 0.25, gap: 0.16, r: 0.03 } });
      feather.position.set(2.1, 2.4, -0.6);
      feather.rotation.set(0.2, 0.9, -0.55);
      cloth.chapeau.add(crown, brim, band, feather);
      cloth.chapeau.position.set(0, hr[1] * 0.86, -0.4);
      cloth.chapeau.rotation.set(-0.12, 0, 0.14);
      WP.head.add(cloth.chapeau);
    }
    // bottes brunes à revers
    cloth.bottes = new T.Group();
    cloth.bottes.userData.feet = WP.legs.map((L) => {
      const len = L.userData.len, g = new T.Group();
      const bm = wool('#4A2E22', 'felt');
      g.add(mesh(latheGeo([[lr * 1.55, -len - 0.4], [lr * 1.6, -len + 1.0], [lr * 1.5, -len + 2.3], [0.01, -len + 2.3]], { seg: 14 }), bm));
      const toe = woolBall(lr * 1.55, '#4A2E22', 'felt', { sx: 1.05, sy: 0.62, sz: 1.5, fuzz: false, seed: 4 });
      toe.position.set(0, -len - 0.2, lr * 0.8);
      g.add(toe);
      const cuff = mesh(new T.TorusGeometry(lr * 1.62, 0.3, 6, 16), wool('#C99A6A', 'felt'));
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -len + 2.3;
      g.add(cuff);
      L.add(g);
      return g;
    });
    WP.body.add(cloth.culotte, cloth.chemise);
    const garments = ['culotte', 'chemise', 'chapeau', 'bottes'];
    const garmentSet = (name, k) => {
      const v = Math.max(0.001, k);
      if (name === 'culotte') { cloth.culotte.scale.setScalar(v); cloth.culotte.visible = k > 0.002; cloth.culotte.userData.legs.forEach((c) => { c.scale.setScalar(v); c.visible = k > 0.002; }); }
      if (name === 'chemise') { cloth.chemise.scale.setScalar(v); cloth.chemise.visible = k > 0.002; cloth.chemise.userData.arms.forEach((c) => { c.scale.setScalar(v); c.visible = k > 0.002; }); }
      if (name === 'chapeau') { cloth.chapeau.scale.setScalar(v); cloth.chapeau.visible = k > 0.002; }
      if (name === 'bottes') cloth.bottes.userData.feet.forEach((g) => { g.scale.setScalar(v); g.visible = k > 0.002; });
    };
    garments.forEach((n) => garmentSet(n, 0));
    trim(wf.g, 1.0, 0.7);
    wf.g.rotation.y = -0.5;
    at(wf.g, WX, H(WX, WZ) + wolfLift, WZ);
    V.add(wf.g);
    V.boilable(wf.g, 0.05, 0.6);
    const blinkW = blinker(WP.eyes, 3);
    const earBase = WP.ears.map((e) => e.rotation.clone());
    const wShadow = contactShadow(12, 10, 0.5);
    V.add(wShadow);

    // les deux enfants qui se promènent
    const kidA = doll({ h: 10.5, top: '#F2C230', bottom: '#F2C230', sleeves: '#F2C230', dress: true, legs: '#F7F2E8', hair: '#7A4A2A', hairStyle: 'pigtails', ribbon: '#E5484D', fringe: false, shoes: '#B5482E', cheeks: '#F09A8E' });
    const kidB = doll({ h: 11, top: '#4C9AD8', bottom: '#5A4632', sleeves: '#4C9AD8', hair: '#E2B868', hairStyle: 'short', fringe: false, hat: { type: 'cap', color: '#E5484D' }, shoes: '#3A2A22', cheeks: '#F09A8E' });
    const kids = [kidA, kidB];
    kids.forEach((k) => { lighter(k.g, 1.0, 12, 4); trim(k.g, 0.9, 0.65); V.add(k.g); V.boilable(k.g, 0.04, 0.6); k.blink = blinker(k.p.eyes, k === kidA ? 11 : 13); k.sh = contactShadow(6, 5, 0.45); V.add(k.sh); });
    // un petit panier pour la fille
    const basket = new T.Group();
    basket.add(mesh(latheGeo([[0.01, 0], [1.1, 0], [1.35, 0.3], [1.5, 1.4], [1.3, 1.45], [1.15, 0.35], [0.01, 0.35]], { seg: 16 }), wool('#C99A5A', 'weave')));
    basket.add(yarn([[-1.35, 1.3, 0], [-0.9, 2.6, 0], [0, 3.0, 0], [0.9, 2.6, 0], [1.35, 1.3, 0]], 0.12, '#A07040', { radial: 4, cast: false }));
    basket.position.set(0, -kidA.p.armR.userData.len - 2.9, 0.4);
    kidA.p.armR.add(basket);
    kidA.p.armR.rotation.z = 0.12;

    // rais de lumière, brume verte, poussières dans le soleil
    const shaftGs = [];
    [[-24, -26, 0.9], [-6, -40, 1.1], [14, -34, 0.7], [-40, -18, 0.6]].forEach(([x, z, k], i) => {
      const g = new T.PlaneGeometry(13 + i * 3, 190);
      const c = [];
      for (let j = 0; j < g.attributes.position.count; j++) c.push(k, k, k);
      g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
      shaftGs.push(applyM(g, { p: [x, 40, z], r: [0, 0.25, -0.5] }));
    });
    const shaftM = new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFE0A0'), vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending, fog: false });
    const shaftG = mergeGeos(shaftGs);
    shaftG.setAttribute('color', new T.Float32BufferAttribute(shaftGs.flatMap((g) => Array.from(g.attributes.color.array)), 3));
    V.add(new T.Mesh(shaftG, shaftM));
    const patchGs = [];
    [[-14, 5, 9, 0.8], [2, -6, 7, 0.7], [-30, -10, 10, 0.6], [6, 16, 6, 0.6], [-4, 28, 8, 0.5]].forEach(([x, z, r, k]) => {
      const g = new T.PlaneGeometry(r * 2.2, r * 1.3);
      const c = [];
      for (let j = 0; j < g.attributes.position.count; j++) c.push(k, k, k);
      g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
      patchGs.push(applyM(g, { p: [x, H(x, z) + 0.3, z], r: [-Math.PI / 2, 0, 0] }));
    });
    const patchM = new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFD890'), vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending, fog: false });
    const patchG = mergeGeos(patchGs);
    patchG.setAttribute('color', new T.Float32BufferAttribute(patchGs.flatMap((g) => Array.from(g.attributes.color.array)), 3));
    V.add(new T.Mesh(patchG, patchM));
    const mists = [];
    [[-10, 5, -22, 130, 16], [20, 7, -44, 160, 20], [-30, 9, -62, 170, 22]].forEach(([x, y, z, w, h], i) => {
      const m = new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#D7E9CF'), transparent: true, opacity: 0.22, depthWrite: false, fog: false });
      const p = new T.Mesh(new T.PlaneGeometry(w, h), m);
      p.position.set(x, y, z);
      V.add(p);
      mists.push({ p, x, ph: i * 2.1 });
    });
    if (live) {
      pointCloud(V, { n: 70, box0: [-55, 2, -30], box1: [45, 50, 20], size: 1.0, sprite: 'lint', color: '#FFF0C8', opacity: 0.55, vel: [0.3, 0.2, 0.1], beam: 1, keyDir: [-0.55, 0.75, 0.1] });
      pointCloud(V, { n: 18, box0: [chimTop.x - 2, chimTop.y, chimTop.z - 2], box1: [chimTop.x + 4, chimTop.y + 22, chimTop.z + 2], size: 5, sprite: 'soft', color: '#E8EDE4', twinkle: 0, wander: 1.2, vel: [0.6, 2.6, 0], opacity: 0.28, additive: false, seed: 6 });
    }
    const conf = live ? confetti(V, { kinds: ['star', 'leaf', 'disc'], n: 40, size: 0.9, height: H }) : { burst() {}, rain() {} };
    const FCOL = ['#F5C32C', '#E5484D', '#3E6FD8', '#FFFFFF', '#E3A436', '#6CA852'];
    V.onHome = (c) => conf.burst(v3(-6, 15, 2), 6, [c, '#FFF3C4'], 0.45, 0.6);

    // ---------------- état et animation ----------------
    const LINES = ['Je mets<br>ma culotte !', 'Je mets<br>ma chemise !', 'Je mets<br>mon chapeau !', 'Je mets<br>mes bottes !'];
    let bubble = null, sayText = '', sayFor = 0;
    const say = (txt, dur) => { sayText = txt; sayFor = dur; V.cue('say'); if (bubble) bubble.set(txt); };
    let worn = 0, done = false, kidsU = 0.3, walk = null, leapT0 = null;
    const wear = garments.map(() => ({ on: false, t0: -9 }));
    const pathAt = (u) => { const p = pathC.getPoint(clamp(u, 0, 1)); p.y = H(p.x, p.z); return p; };
    const KP = v3();
    const wolfHome = v3(WX, H(WX, WZ) + wolfLift, WZ), wolfOut = v3(7, H(7, 10) + wolfLift, 10);
    V.anim((t, f) => {
      blinkW(t, f);
      kids.forEach((k) => k.blink(t, f));
      const beat = bump(sat(V.age('beat') / 0.28));
      // les habits qui apparaissent (et quittent la corde)
      garments.forEach((n, i) => {
        const w = wear[i];
        const k = w.on ? easeOutBack(sat((V.now - w.t0) / 0.55)) : 0;
        garmentSet(n, k);
        const h = lineItems[i];
        const lk = w.on ? 1 - easeIn(sat((V.now - w.t0 + 0.25) / 0.35)) : 1;
        h.g.visible = lk > 0.01;
        h.g.scale.setScalar(Math.max(0.01, lk));
        h.g.rotation.z = Math.sin(t * 1.3 + h.ph) * 0.08;
      });
      // le loup
      const lp = leapT0 == null ? -1 : (V.now - leapT0) / 1.0;
      let wx = wolfHome.x, wy = wolfHome.y, wz = wolfHome.z, yaw = -0.5, sq = 1;
      const A2 = WP.arms, L2 = WP.legs;
      if (lp >= 0) {
        const k = sat(lp);
        if (lp < 0.2) { const q = Math.sin((lp / 0.2) * Math.PI * 0.5); sq = 1 - 0.18 * q; } else {
          const fl = sat((lp - 0.2) / 0.8);
          wx = lerp(wolfHome.x, wolfOut.x, easeInOut(fl)); wz = lerp(wolfHome.z, wolfOut.z, easeInOut(fl));
          wy = lerp(wolfHome.y, wolfOut.y, fl) + bump(fl) * 12;
          sq = 1 + 0.12 * bump(fl);
          if (lp >= 1) { wx = wolfOut.x; wz = wolfOut.z; wy = wolfOut.y; }
        }
        yaw = lerp(-0.5, -0.28, smooth(k));
        const after = lp - 1;
        if (after >= 0) {
          // la danse : il rebondit, bras en l'air, la queue qui fouette
          const d = Math.abs(Math.sin(after * 5.5));
          wy += d * (after < 2.5 ? 2.2 : 0.8);
          sq = 1 + (d < 0.15 ? -0.1 : 0.04);
          A2[0].rotation.z = -2.4 + Math.sin(after * 11) * 0.3; A2[1].rotation.z = 2.4 + Math.sin(after * 11 + 1) * 0.3;
          A2[0].rotation.x = A2[1].rotation.x = 0;
          L2[0].rotation.x = Math.sin(after * 11) * 0.35; L2[1].rotation.x = -Math.sin(after * 11) * 0.35;
          WP.body.rotation.z = Math.sin(after * 5.5) * 0.12;
        } else {
          A2[0].rotation.z = lerp(-0.35, -2.6, k); A2[1].rotation.z = lerp(0.35, 2.6, k);
          L2[0].rotation.x = -0.6 * bump(k); L2[1].rotation.x = 0.5 * bump(k);
          WP.body.rotation.z = 0;
        }
        tongue.scale.setScalar(Math.max(0.001, easeOutBack(sat((lp - 0.3) / 0.4))));
      } else {
        // caché : il se penche pour guetter, tape du pied en rythme
        const peek = 0.5 + 0.5 * Math.sin(t * 0.55);
        WP.body.rotation.z = 0.06 + peek * 0.1 + bump(sat(V.age('peek') / 0.9)) * 0.14;
        wx += -peek * 0.8;
        const stomp = beat;
        L2[1].rotation.x = -stomp * 0.7; L2[0].rotation.x = 0;
        wy += stomp * 0.6;
        const dress = bump(sat(V.age('dress') / 0.7));
        A2[0].rotation.z = -0.35 - dress * 0.9 - Math.sin(t * 1.1) * 0.05; A2[1].rotation.z = 0.35 + dress * 0.9 + beat * 0.3;
        A2[0].rotation.x = -dress * 0.4; A2[1].rotation.x = -dress * 0.4;
        tongue.scale.setScalar(0.001);
      }
      wf.g.position.set(wx, wy, wz);
      wf.g.rotation.set(0, yaw, 0);
      wf.g.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      const look = lp >= 0 ? 0.25 * Math.sin(t * 2) : 0.35 + 0.25 * Math.sin(t * 0.4) - bump(sat(V.age('dress') / 0.7)) * 0.3;
      WP.head.rotation.y = look;
      WP.head.rotation.x = -0.05 + bump(sat(V.age('dress') / 0.7)) * 0.35 - beat * 0.06;
      WP.head.rotation.z = lp >= 0 ? Math.sin(t * 5) * 0.1 : -0.08;
      WP.ears.forEach((e, i) => { const b = earBase[i], s = i ? 1 : -1; e.rotation.set(b.x - beat * 0.2, b.y, b.z + s * (Math.sin(t * 1.7 + i) * 0.05 + bump(sat(V.age('peek') / 0.6)) * 0.3)); });
      if (WP.tail) { WP.tail.rotation.y = Math.sin(t * (lp >= 0 ? 9 : 2.2)) * (lp >= 0 ? 0.6 : 0.25); WP.tail.rotation.x = lp >= 0 ? -0.3 : 0; }
      wShadow.position.set(wx, H(wx, wz) + 0.15, wz);
      wShadow.scale.setScalar(1 - sat((wy - wolfHome.y) / 14) * 0.5);
      // les enfants marchent sur le sentier
      let u = kidsU, step = false;
      if (walk) { const k = sat((V.now - walk.t0) / walk.dur); u = lerp(walk.a, walk.b, smooth(k)); step = k < 1; if (k >= 1) walk = null; }
      const scare = lp >= 0 ? sat((lp - 0.6) / 0.3) : 0;
      kids.forEach((K, i) => {
        const p = pathAt(u - i * 0.035);
        const q = pathAt(u - i * 0.035 + 0.02);
        const tg = q.sub(p);
        const side = i ? -1 : 1, nx = -tg.z, nz = tg.x, nl = Math.hypot(nx, nz) || 1;
        KP.set(p.x + (nx / nl) * 1.6 * side, p.y, p.z + (nz / nl) * 1.6 * side);
        const fwd = Math.atan2(tg.x, tg.z);
        const march = step ? 1 : beat;
        const ph = (step ? V.now * 9 : V.now * 0) + i * Math.PI;
        const sw = step ? Math.sin(ph) : 0;
        const hopK = lp >= 0 && lp > 0.9 ? Math.abs(Math.sin((lp - 0.9) * 6 + i)) * (lp < 4.5 ? 1 : 0.3) : 0;
        K.g.position.set(KP.x, KP.y + (step ? Math.abs(Math.cos(ph)) * 0.35 : beat * 0.5) + hopK * 2.2, KP.z);
        K.g.rotation.y = lp >= 0 ? lerp(lerp(fwd, 0.5, 0.5), Math.atan2(wx - KP.x, wz - KP.z) * 0.6, scare) : (step ? fwd : lerp(fwd, 0.4, 0.55) + Math.sin(t * 0.5 + i) * 0.25);
        K.p.legL.rotation.x = sw * 0.5 + (march && !step ? (i ? beat : 0) * -0.5 : 0);
        K.p.legR.rotation.x = -sw * 0.5 + (march && !step ? (i ? 0 : beat) * -0.5 : 0);
        const up = hopK > 0 ? 2.6 : 0;
        K.p.armL.rotation.x = -sw * 0.45; K.p.armR.rotation.x = sw * 0.45 + (K === kidA ? -0.25 : 0);
        K.p.armL.rotation.z = -0.22 - up * (0.6 + 0.2 * Math.sin(t * 9)); if (K !== kidA) K.p.armR.rotation.z = 0.22 + up * 0.6;
        K.p.head.rotation.y = lp >= 0 ? 0 : Math.sin(t * 0.7 + i * 2) * 0.4;
        K.p.head.rotation.x = hopK > 0 ? -0.25 : 0;
        K.sh.position.set(KP.x, KP.y + 0.15, KP.z);
      });
      // la bulle
      if (bubble) {
        // bandeau de téléphone : la bulle se met à côté de la tête, sous les boutons de la page
        const wide = V.size[0] / Math.max(1, V.size[1]) > 1.65;
        if (bubble.off) { if (wide) bubble.off.set(hs * 1.75, hs * 0.15, 0); else bubble.off.set(hs * 1.05, hs * 1.75, 0); }
        if (done && leapT0 != null && V.now >= leapT0 && sayText !== 'J’arrive !') { say('J’arrive !', 3.2); V.cues.say = V.now; }
        bubble.show(V.age('say') >= 0 && V.age('say') < sayFor);
      }
      // la lumière qui respire, la brume qui dérive
      shaftM.opacity = (0.32 + 0.08 * Math.sin(t * 0.7)) * (0.8 + 0.4 * sat(worn / 4));
      patchM.opacity = 0.26 + 0.07 * Math.sin(t * 0.9 + 1);
      mists.forEach((m) => { m.p.position.x = m.x + Math.sin(t * 0.12 + m.ph) * 8; });
      hero.rotation.z = beat * 0.012 * (lp < 0 ? 1 : 0);
    });

    return {
      update(st, first) {
        if (!bubble && live) { bubble = Decor.label(V, sayText || '…', WP.head, [hs * 1.05, hs * 1.75, 0], 'laine-bubble'); if (bubble && sayText) bubble.set(sayText); }
        const n = Math.min(st.done ? NP : st.phrasesDone, 4);
        garments.forEach((g, i) => {
          const on = i < n;
          if (on && !wear[i].on) { wear[i].on = true; wear[i].t0 = first ? -9 : V.now + 1 / FPS; if (!first) { say(LINES[i], st.done && i === 3 ? 1.6 : 3.4); V.cue('dress'); conf.burst(v3(WX - 2, 14, WZ + 3), 10, ['#FFF3C4', '#F5C32C', '#FFFFFF'], 0.5, 0.8); } }
          if (!on) wear[i].on = false;
        });
        worn = n;
        if (first && n > 0 && !st.done) say(LINES[n - 1], 3);
        // les enfants avancent avec les notes
        const tu = 0.3 + 0.12 * st.p;
        if (Math.abs(tu - kidsU) > 1e-4) { if (first) { kidsU = tu; walk = null; } else { walk = { a: kidsU, b: tu, t0: V.now + 1 / FPS, dur: 0.6 + Math.abs(tu - kidsU) * 12 }; kidsU = tu; } }
        if (st.done && !done) { done = true; leapT0 = first ? V.now - 6 : V.now + 1.7; if (first) say('J’arrive !', 2.5); }
        if (!st.done && done) { done = false; leapT0 = null; }
      },
      react(kind) {
        if (kind === 'correct') { V.cue('peek'); }
        if (kind === 'phrase') { V.cue('peek'); conf.burst(v3(-4, 20, -4), 10, FCOL, 0.6, 1.2); }
        if (kind === 'complete') {
          conf.burst(v3(wolfOut.x, 16, wolfOut.z), 26, FCOL, 1.1, 1.3);
          conf.rain([-36, 36, 44, -14, 16], 26, ['#6CA852', '#E3A436', '#F5C32C', '#D8443A']);
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('beat');
      },
    };
  },
};
