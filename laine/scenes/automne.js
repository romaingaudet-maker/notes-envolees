/* ============ Il court, il court, le furet : la clairière d'automne ============
   Un talus moussu percé de cinq trous, au pied d'arbres qui roussissent à
   mesure qu'on retrouve les notes ; les feuilles de feutrine tombent et
   tapissent le sol. Le furet (long, brun clair, masque, queue touffue)
   surgit d'un trou différent à chaque note retrouvée ; à chaque phrase il
   traverse la clairière en courant (et un champignon pousse au pied du
   talus) ; à la fin, il passe à toute vitesse par tous les trous dans un
   tourbillon de feuilles, puis danse sur le talus. Écoute : il hoche la
   tête et les feuilles frémissent en rythme. */
SCENES.automne = {
  color: '#E8A060',
  view: {
    bg: '#D8946A', fov: 26,
    rig: { target: [0, 9, 1], az: 0, el: 9, box: [56, 42], targetWide: [0, 11, 1], boxWide: [90, 38] },
    post: { exposure: 1.26, bloom: 0.55, bloomThr: 0.95, aper: 7, maxBlur: 11, sat: 1.1, lift: '#060A18', gain: '#FFF6EA', punch: 1.27, vignette: 0.4, grain: 0.04 },
  },
  sky: [-26, 22, 24, 31, -16, -6],
  home: [0, 12, -2],
  flock: 6,
  build(V, o) {
    const song = o.song, NP = song.phrases.length, live = !o.portrait;
    studioLights(V, {
      key: { color: '#FFBE7E', k: 3.1, az: 58, el: 21, area: 80 },
      fill: { sky: '#7A90DC', ground: '#5A4630', k: 0.58 },
      rim: { color: '#FFC890', k: 1.8, az: -140, el: 20 },
      env: { sky: '#A8B4D8', ground: '#5A4028', k: 0.32, boxK: 3 },
      fog: { color: '#E2C4A4', near: 260, far: 800 },
    });
    const noShadow = (g) => { g.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return g; };
    const faceCam = (m) => { const g = m.geometry, n = g.attributes.normal; if (n.getZ(n.count - 25) < 0) { const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } ix.needsUpdate = true; g.computeVertexNormals(); } return m; };
    const lighter = (root, maxR, seg) => {
      root.traverse((m) => {
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
    const trim = (root, sr, fr) => root.traverse((m) => {
      if (!m.isMesh || m.isInstancedMesh || !m.geometry) return;
      const g = m.geometry;
      if (!g.boundingSphere) g.computeBoundingSphere();
      const r = g.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z);
      if (r < sr) m.castShadow = false;
      if (r < fr) m.children.filter((c) => c.userData.isFuzz).forEach((c) => m.remove(c));
    });
    const instFelt = wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#7A7A7A' });
    const instKnit = wool('#FFFFFF', 'knit', { sheen: 0.5, sheenColor: '#56664A' });
    const grassMat = wool('#FFFFFF', 'yarn', { sheen: 0.6, sheenColor: '#56664A' });

    // ciel d'automne, collines, sol tricoté
    V.add(faceCam(cyclo({ w: 560, h: 90, z: -100, r: 30, floor: 30, top: '#4E6CC4', mid: '#D8A8A0', bottom: '#FFD49A', scale: 3 })));
    const ground = terrain({ w: 360, d: 220, nx: 60, nz: 40, z: 20, hills: [[-60, -46, 36, 7], [60, -50, 40, 8], [10, -78, 60, 6]], colors: ['#80863E', '#737A38'], bands: 4, rough: 0.6, scale: 2.0 });
    V.add(ground);
    const H = (x, z) => ground.userData.height(x, z);
    const farH = flatLayer(hillShape(460, 22, 5, 13), '#A08AA8', { depth: 1, inset: 1.2, stitch: '#CBB8D0', st: { len: 1.4, gap: 1.0, r: 0.12 } });
    at(farH, 0, -2, -86);
    V.add(noShadow(farH));
    const midH = flatLayer(hillShape(400, 15, 4, 6), '#9A9A50', { depth: 1, inset: 1.1, stitch: '#E2C080', st: { len: 1.1, gap: 0.8, r: 0.11 } });
    at(midH, -20, -2, -70);
    V.add(noShadow(midH));
    // le soleil bas, à droite, qui rase la clairière
    const sunG = new T.Group();
    sunG.add(feltPiece(circleShape(7.5), '#FFB84A', { depth: 1.8, inset: 0.8, stitch: '#F07A2A', st: { len: 0.7, gap: 0.45, r: 0.1 }, mat: { emissive: '#FF9A3A', emissiveIntensity: 1.0 } }));
    const rays = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r0 = 8.5, r1 = i % 2 ? 10.6 : 12; rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.07) * (r0 + r1) / 2, Math.sin(a + 0.07) * (r0 + r1) / 2, 0.25], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.38, { radial: 5 })); }
    sunG.add(mesh(mergeGeos(rays), wool('#FFA83A', 'yarn', { emissive: '#FF8A20', emissiveIntensity: 0.7 }), { cast: false }));
    addFace(sunG, 7.2, { z: 0.95, cheeks: '#F06A4A' });
    noShadow(sunG);
    at(sunG, 36, 22, -74);
    const hSun = hang(sunG, 160, { amp: 0.8, per: 7 });
    V.add(hSun);
    swingAnim(V, hSun);
    const halo = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFB070').multiplyScalar(0.7), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    at(halo, 36, 22, -80);
    V.add(halo);

    // les arbres qui roussissent (instances : on change leur couleur avec l'avancement)
    const crownGeo = mergeGeos([blobGeo(5, 4.6, 4.6, { seg: 16, seed: 2 }), applyM(blobGeo(3.6, 3.3, 3.4, { seg: 14, seed: 3 }), { p: [-3.8, -1.2, 1.0] }), applyM(blobGeo(3.8, 3.4, 3.4, { seg: 14, seed: 4 }), { p: [3.6, -1.0, 0.6] }), applyM(blobGeo(3.2, 3.0, 3.0, { seg: 12, seed: 5 }), { p: [0.6, 3.2, -0.6] })]);
    const trunkGeo = new T.CylinderGeometry(0.8, 1.2, 9, 8);
    trunkGeo.translate(0, 4.5, 0);
    const trees = [[-62, -34, 1.3], [-46, -42, 1.1], [-26, -36, 1.2], [-8, -46, 1.0], [10, -38, 1.25], [28, -44, 1.1], [44, -34, 1.3], [62, -42, 1.2], [80, -36, 1.1], [-80, -40, 1.2], [-36, -56, 0.9], [20, -58, 0.9], [52, -60, 0.95], [-56, -60, 0.9]];
    const summer = ['#9AA84A', '#A8A040', '#8C9A44', '#B0A048'].map(col), fall = ['#E5652A', '#D8402E', '#F2A230', '#C8502A'].map(col);
    const crowns = scatter(crownGeo, instKnit, trees.length, (i, r) => { const [x, z, s] = trees[i]; return { p: [x, H(x, z) + 9 * s + 3.5 * s, z], r: [0, r() * 3, 0], s, c: summer[i % 4] }; });
    V.add(crowns);
    V.add(scatter(trunkGeo, instKnit, trees.length, (i) => { const [x, z, s] = trees[i]; return { p: [x, H(x, z) - 0.4, z], s, c: '#6A4A32' }; }));
    // le grand arbre roux de gauche, au premier rang
    const big = new T.Group();
    big.add(mesh(latheGeo([[4.6, 0], [3.3, 1.2], [2.8, 4], [2.5, 14], [1.9, 20]], { seg: 20, lump: 0.09, seed: 4 }), wool('#6E4A30', 'knit', { scale: 0.7 })));
    big.add(mesh(mergeGeos([[-6, 24, 2], [5, 23, -1], [0, 27, 3]].map(([x, y, z]) => yarnGeo([[0, 15, 0], [x * 0.5, (15 + y) / 2, z * 0.5], [x, y, z]], 0.7, { radial: 6 }))), wool('#5E3E28', 'yarn')));
    const bigPuffs = [[-6, 24, 2, 6.2, '#E5652A'], [5, 23, -1, 6.0, '#D8402E'], [0, 28, 1, 6.8, '#F2A230'], [-2, 21, 5, 5.0, '#C8502A'], [7, 27, 3, 4.6, '#E5652A']];
    const bigBalls = bigPuffs.map(([x, y, z, r, c], i) => { const b = woolBall(r, c, 'knit', { seed: i + 11, fuzz: 0.2, mat: { scale: 0.9 } }); b.position.set(x, y, z); big.add(b); return b; });
    at(big, -36, H(-36, -12) - 0.3, -12);
    V.add(big);
    const bigSh = contactShadow(26, 18, 0.45);
    bigSh.position.set(-36, H(-36, -12) + 0.15, -12);
    V.add(bigSh);

    // le talus moussu et ses cinq trous
    const BC = v3(0, -2.2, -5), BR = [33, 11, 9];
    const bankG = blobGeo(BR[0], BR[1], BR[2], { seg: 40, lump: 0.1, seed: 6 });
    const bank = mesh(bankG, wool('#7E8A3C', 'knit', { scale: 0.8 }));
    fuzz(bank, 0.22, { fiber: 0.14 });
    bank.position.copy(BC);
    V.add(bank);
    const bankSurf = (x, y) => { const k = 1 - (x / BR[0]) ** 2 - ((y - BC.y) / BR[1]) ** 2; const z = BC.z + BR[2] * Math.sqrt(Math.max(0.02, k)); const n = v3(x / BR[0] ** 2, (y - BC.y) / BR[1] ** 2, (z - BC.z) / BR[2] ** 2).normalize(); return { p: v3(x, y, z), n }; };
    const HX = [-21.5, -10.8, 0, 10.8, 21.5], HY = [3.6, 5.0, 4.4, 5.2, 3.8];
    const holes = HX.map((x, i) => {
      const { p, n } = bankSurf(x, HY[i]);
      const g = new T.Group();
      const disc = mesh(feltGeo(ellipseShape(3.7, 3.2), 0.3, { bevel: 0.08 }), wool('#1E120C', 'felt'), { cast: false });
      const rim = mesh(new T.TorusGeometry(3.5, 0.65, 8, 28), wool('#6A5430', 'knit', { scale: 0.5 }));
      rim.scale.set(1.04, 0.9, 1);
      g.add(disc, rim);
      g.position.copy(p).addScaledVector(n, 0.15);
      g.quaternion.setFromUnitVectors(v3(0, 0, 1), n);
      V.add(g);
      // le pivot du furet : un peu dans le trou, tourné vers l'extérieur
      const piv = new T.Group();
      piv.position.copy(p).addScaledVector(n, -0.4);
      const yaw = Math.atan2(n.x, n.z) + (i - 2) * 0.12;
      piv.rotation.set(-0.42, yaw, 0, 'YXZ');
      V.add(piv);
      return { p, n, piv, yaw };
    });
    // herbes sur le talus, racines, champignons d'étape
    const tuftGeo = (seed, n, h0, h1, spread) => { const r = rng(seed), gs = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU + r() * 0.8, hh = lerp(h0, h1, r()), ln = spread * (0.5 + r() * 0.8), ca = Math.cos(a), sa = Math.sin(a); gs.push(yarnGeo([[ca * 0.25, 0, sa * 0.25], [ca * ln * 0.3, hh * 0.55, sa * ln * 0.3], [ca * ln, hh, sa * ln]], 0.18, { radial: 3, maxSeg: 4 })); } return mergeGeos(gs); };
    const GC = ['#B8A048', '#A89040', '#C8B060', '#98823A', '#8A9A44'];
    const shortG = tuftGeo(8, 6, 3, 5.5, 1.7), tallG = tuftGeo(3, 7, 6, 10, 2.2);
    V.add(scatter(shortG, grassMat, 46, (i, r) => { const x = (r() - 0.5) * 60; let y = BC.y + BR[1] * (0.35 + r() * 0.6); const k = 1 - (x / BR[0]) ** 2; y = Math.min(y, BC.y + BR[1] * Math.sqrt(Math.max(0, k)) * 0.98); const s = bankSurf(x, y); if (HX.some((hx, j) => Math.hypot(hx - x, HY[j] - y) < 5.4)) return { p: [0, -60, 0], s: 0.001 }; return { p: [s.p.x, s.p.y - 0.3, s.p.z - 0.5], r: [0, r() * TAU, 0], s: 0.75 + r() * 0.5, c: col(GC[i % 5]).multiplyScalar(0.85 + r() * 0.3) }; }));
    V.add(scatter(shortG, grassMat, 90, (i, r) => { let x = (r() - 0.5) * 120, z = -30 + r() * 60; if (z > -14 && z < 7 && Math.abs(x) < 34) z += 16; return { p: [x, H(x, z) - 0.3, z], r: [0, r() * TAU, 0], s: 0.8 + r() * 0.6, c: col(GC[i % 5]).multiplyScalar(0.85 + r() * 0.3) }; }, { cast: false }));
    V.add(scatter(tallG, grassMat, 36, (i, r) => { const left = i % 2; const x = left ? -50 + r() * 30 : 20 + r() * 30, z = 26 + r() * 50; return { p: [x, H(x, z) - 0.3, z], r: [0, r() * TAU, 0], s: 1.1 + r() * 0.5, c: col(GC[i % 5]).multiplyScalar(0.85 + r() * 0.3) }; }, { cast: false }));
    const stemG = latheGeo([[0.55, 0], [0.45, 1.4], [0.4, 2.6], [0.01, 2.65]], { seg: 10 });
    const capG = latheGeo([[0.01, -0.2], [1.2, -0.25], [1.8, 0.1], [1.6, 0.8], [0.9, 1.4], [0.01, 1.55]], { seg: 14, lump: 0.05 });
    capG.translate(0, 2.5, 0);
    const SHR = [[-27, 4, 1.1, '#C8502A'], [-15, 6.5, 0.9, '#E8B04A'], [-5, 7.2, 1.2, '#D9433A'], [4, 7.3, 0.8, '#B86A30'], [14, 6.8, 1.0, '#D9433A'], [25, 5, 1.2, '#E8B04A'], [-31, -1, 0.9, '#B86A30'], [31, 0, 1.0, '#C8502A']];
    const shStems = scatter(stemG, instFelt, SHR.length, (i) => { const [x, z, s] = SHR[i]; return { p: [x, H(x, z) - 0.1, z], s, c: '#F2E6CC' }; });
    const shCaps = scatter(capG, instKnit, SHR.length, (i) => { const [x, z, s, c] = SHR[i]; return { p: [x, H(x, z) - 0.1, z], s, c }; });
    shStems.frustumCulled = shCaps.frustumCulled = false;
    V.add(shStems, shCaps);
    // le tapis de feuilles de feutrine (il s'épaissit avec l'avancement)
    const leafG = feltGeo(leafShape(1.4, 2.6, 0.25), 0.12, { bevel: 0 });
    const LN = 190;
    const LCOL = ['#E5652A', '#D8402E', '#F2A230', '#C8502A', '#E8B04A', '#B86A30'];
    const carpet = scatter(leafG, instFelt, LN, (i, r) => { let x = (r() - 0.5) * 120, z = -26 + r() * 86; if (z > -15 && z < 4 && Math.abs(x) < 33) z = 4 + r() * 6; const s = 0.9 + r() * 0.9 + (z > 30 ? 0.8 : 0); return { p: [x, H(x, z) + 0.1 + r() * 0.15, z], r: [-Math.PI / 2 + (r() - 0.5) * 0.4, 0, r() * TAU], s, c: col(LCOL[i % 6]).multiplyScalar(0.85 + r() * 0.3) }; }, { cast: false });
    carpet.frustumCulled = false;
    V.add(carpet);
    // glands et une citrouille au premier plan
    const acG = mergeGeos([blobGeo(0.5, 0.65, 0.5, { seg: 8 }), applyM(blobGeo(0.58, 0.3, 0.58, { seg: 8 }), { p: [0, 0.5, 0] })]);
    V.add(scatter(acG, instKnit, 14, (i, r) => { const x = (r() - 0.5) * 70, z = 6 + r() * 30; return { p: [x, H(x, z) + 0.5, z], r: [1.2, r() * 6, 0], s: 1, c: i % 2 ? '#B98A44' : '#8A6A3A' }; }, { cast: false }));
    const pump = new T.Group();
    {
      const gs = [];
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; gs.push(applyM(blobGeo(2.0, 3.0, 2.6, { seg: 14, seed: i }), { p: [Math.cos(a) * 2.2, 3, Math.sin(a) * 2.2], r: [0, -a, 0] })); }
      pump.add(mesh(mergeGeos(gs), wool('#F28A2A', 'knit', { scale: 0.6 })));
      pump.add(mesh(yarnGeo([[0, 5.6, 0], [0.3, 7, 0.1], [1.0, 7.8, 0.2]], 0.45, { radial: 5 }), wool('#6A5A2A', 'yarn')));
      const lf = feltPiece(leafShape(2.6, 4, 0.6), '#7A8A3A', { depth: 0.2, inset: 0.3, stitch: '#B8C880', st: { len: 0.3, gap: 0.2, r: 0.04 } });
      lf.position.set(-1.6, 6.2, 0.6);
      lf.rotation.set(-0.8, 0, 0.9);
      pump.add(lf);
    }
    pump.rotation.y = 0.5;
    at(pump, 8, H(8, 25) - 0.3, 25);
    V.add(pump);
    const pumpSh = contactShadow(12, 10, 0.45);
    pumpSh.position.set(8, H(8, 25) + 0.15, 25);
    V.add(pumpSh);

    // le furet : corps long, brun clair, masque brun, queue touffue au bout sombre
    const fr = critter({ size: 11, color: '#D6AE7E', belly: '#F4E6CC', pose: 'four', bl: 0.6, bw: 0.22, bh: 0.21, head: 0.3, snout: 0.5, snoutCol: '#F4E6CC', nose: '#E07A86', noseR: 0.16, eyeR: 0.15, eyeY: 18, eyeSpread: 32, ears: 'round', earR: 0.36, earIn: '#F2B3B8', tail: 'bushy', tailTip: '#5A3A26', legLen: 0.22, legCol: '#7A5236', paw: '#5A3A26', cheeks: '#F2A0A0', fuzz: 0.13 });
    lighter(fr.g, 1.0, 14);
    trim(fr.g, 0.6, 0.5);
    const FP = fr.p, fhs = fr.hs, fhr = [fhs, fhs * 0.92, fhs * 0.95];
    // le masque de bandit : deux taches brunes autour des yeux
    for (const s of [-1, 1]) {
      const q = surf(fhr, s * 32, 18);
      const m = felt(ellipseShape(fhs * 0.3, fhs * 0.22), '#4A2E1E', 0.12, { bevel: 0 });
      faceTo(at(m, q.p.x, q.p.y, q.p.z), q.n);
      m.position.addScaledVector(q.n, -0.02);
      m.rotation.z += s * 0.35;
      FP.head.add(m);
    }
    const snC = v3(0, -fhs * 0.22, fhr[2] * 0.72), snR = [fhs * 0.42, fhs * 0.32, fhs * 0.5];
    const sp = (az, el, k = 1.02) => { const q = surf(snR, az, el); return q.p.multiplyScalar(k).add(snC); };
    FP.head.add(yarn([sp(-34, -34), sp(0, -46, 1.03), sp(34, -34)], 0.07, '#4A2A22', { radial: 4, cast: false }));
    const wh = [];
    for (const s of [-1, 1]) for (const dy of [-0.2, 0.15]) { const a = sp(s * 60, 0); wh.push(yarnGeo([a, a.clone().add(v3(s * fhs * 0.5, dy * fhs * 0.5, -0.1)), a.clone().add(v3(s * fhs * 1.0, dy * fhs, -0.3))], 0.04, { radial: 4 })); }
    FP.head.add(mesh(mergeGeos(wh), wool('#F4EEDC', 'yarn'), { cast: false }));
    if (FP.tail) { FP.tail.rotation.x = -0.45; FP.tail.scale.set(0.8, 0.8, 0.72); }
    const bodyY = FP.body.position.y;
    V.add(fr.g);
    V.boilable(fr.g, 0.05, 0.7);
    const blinkF = blinker(FP.eyes, 6);
    const earBase = FP.ears.map((e) => e.rotation.clone());
    const fSh = contactShadow(13, 6, 0.45);
    V.add(fSh);
    const legBase = FP.legs.map((L) => L.rotation.clone());

    // particules : feuilles qui tombent, poussière dorée, tourbillon de la fin
    let falling = null;
    if (live) {
      falling = fallers(V, { n: 34, kind: 'leaf', box: [-56, 56, 4, 50, -24, 22], colors: LCOL, speed: 4.5, size: 1.1 });
      pointCloud(V, { n: 60, box0: [-55, 1, -26], box1: [55, 36, 24], size: 1.0, sprite: 'lint', color: '#FFE0A8', opacity: 0.5, vel: [-0.6, 0.25, 0.1], beam: 0.8, keyDir: [0.82, 0.3, 0.45] });
    }
    const VN = 46;
    const vortex = new T.InstancedMesh(confettiGeo('leaf'), instFelt, VN);
    vortex.castShadow = false;
    vortex.frustumCulled = false;
    vortex.count = 0;
    V.add(vortex);
    const VP = [];
    { const r = rng(14); for (let i = 0; i < VN; i++) { VP.push({ a: r() * TAU, rr: 6 + r() * 18, y0: r() * 6, sp: 1.2 + r() * 1.4, s: 1.2 + r() * 1.2, w: r() * 6, c: col(LCOL[i % 6]) }); vortex.setColorAt(i, VP[i].c); } }
    const conf = live ? confetti(V, { kinds: ['leaf', 'disc', 'star'], n: 44, size: 1.0, height: H }) : { burst() {}, rain() {} };
    V.onHome = (c) => conf.burst(v3(0, 12, -2), 6, [c, '#FFE0A0', '#E5652A'], 0.45, 0.6);

    // ---------------- état et animation ----------------
    let p = 0, ph = 0, done = false, doneT = -9, cur = 2, act = null, gust = 0, lastFound = -1;
    const PIV = new T.Matrix4(), tmp = v3(), dir = v3();
    // une pose « au trou » : le furet glisse dans l'axe du trou (u = 0 caché, 1 dehors)
    const atHole = (h, u, look) => {
      const piv = holes[h].piv;
      piv.updateMatrixWorld(true);
      tmp.set(0, -bodyY - 0.7, lerp(-22, -3.9, u)).applyMatrix4(piv.matrixWorld);
      fr.g.position.copy(tmp);
      fr.g.quaternion.copy(piv.quaternion);
      FP.head.rotation.set(0.35 + Math.sin(V.now * 2.2) * 0.05, look, 0);
    };
    const runPose = (ph2, k) => {
      // galop du furet : le dos se voûte et s'étire, pattes avant et arrière en opposition
      FP.body.rotation.x = Math.sin(ph2) * 0.22 * k;
      FP.legs.forEach((L, i) => { L.rotation.x = legBase[i].x + Math.sin(ph2 + (i < 2 ? 0 : Math.PI)) * 0.85 * k; });
    };
    const groundAt = (x, z) => H(x, z) + bodyY * 0 - 0.1;
    V.anim((t, f) => {
      blinkF(t, f);
      const beat = bump(sat(V.age('beat') / 0.28));
      gust += ((beat > 0 ? 1 : 0) - gust) * 0.2;
      // les arbres roussissent avec l'avancement
      if (crowns.instanceColor) {
        const c = new T.Color();
        trees.forEach((tr, i) => { c.copy(summer[i % 4]).lerp(fall[(i + 1) % 4], smooth(sat(p * 1.15 - (i % 5) * 0.04))); crowns.setColorAt(i, c); });
        crowns.instanceColor.needsUpdate = true;
      }
      bigBalls.forEach((b, i) => { b.rotation.z = Math.sin(t * 0.9 + i) * 0.02 + gust * 0.03 * Math.sin(t * 9 + i); });
      carpet.count = Math.round(LN * (0.45 + 0.55 * p));
      if (falling) falling.on = 0.35 + 0.65 * p + gust * 0.2;
      // champignons : un par phrase
      {
        const m4 = new T.Matrix4(), q = new T.Quaternion();
        SHR.forEach(([x, z, s], i) => { const on = i < ph ? easeOutBack(sat((V.now - (V.cues['shr' + i] != null ? V.cues['shr' + i] : -9)) / 0.6)) : 0; const sc = Math.max(0.001, on * s); m4.compose(v3(x, H(x, z) - 0.1, z), q, v3(sc, sc, sc)); shStems.setMatrixAt(i, m4); shCaps.setMatrixAt(i, m4); });
        shStems.instanceMatrix.needsUpdate = shCaps.instanceMatrix.needsUpdate = true;
      }
      // le furet
      let shadowOn = false;
      FP.body.rotation.set(0, 0, 0);
      FP.legs.forEach((L, i) => L.rotation.copy(legBase[i]));
      fr.g.scale.setScalar(1);
      const A = act;
      if (A && A.type === 'pop') {
        // il replonge dans son trou, puis ressort d'un autre
        const k = (V.now - A.t0) / 0.6;
        if (k < 0.4) atHole(A.from, 1 - easeIn(sat(k / 0.4)), 0); else { atHole(A.to, easeOutBack(sat((k - 0.4) / 0.6)), Math.sin(t * 1.3) * 0.5); }
        if (k >= 1) act = null;
      } else if (A && A.type === 'run') {
        // il sort, traverse la clairière en courant, et plonge dans un autre trou
        const k = (V.now - A.t0) / A.dur;
        const ha = holes[A.from], hb = holes[A.to];
        if (k < 0.12) atHole(A.from, lerp(1, 1.5, k / 0.12), 0);
        else if (k < 0.88) {
          const u = (k - 0.12) / 0.76;
          const xa = ha.p.x, xb = hb.p.x, zf = 9;
          const x = lerp(xa, xb, smooth(u)), z = lerp(lerp(ha.p.z + 3, zf, sat(u * 4)), hb.p.z + 3, sat((u - 0.75) * 4));
          const hop = Math.abs(Math.sin(u * Math.PI * 7)) * 1.4;
          fr.g.position.set(x, groundAt(x, z) + hop, z);
          dir.set(xb - xa, 0, (u < 0.25 ? zf - ha.p.z : u > 0.75 ? hb.p.z - zf : 0) * 0.2);
          fr.g.quaternion.setFromEuler(new T.Euler(0, Math.atan2(dir.x, dir.z), 0));
          runPose(u * Math.PI * 14, 1);
          FP.head.rotation.set(0.1, 0, 0);
          shadowOn = true;
        } else atHole(A.to, 1 - easeIn(sat((k - 0.88) / 0.12)) * 0.3, 0);
        if (k >= 1) act = null;
      } else if (A && A.type === 'zip') {
        // la fin : il file d'un trou à l'autre comme une aiguille, puis danse sur le talus
        const k = V.now - A.t0, seg = 0.42;
        const n = holes.length - 1;
        if (k < n * seg) {
          const i = Math.min(n - 1, Math.floor(k / seg)), u = sat((k - i * seg) / seg);
          const a = holes[i], b = holes[i + 1];
          const P0 = a.p.clone().addScaledVector(a.n, -0.5), P1 = b.p.clone().addScaledVector(b.n, -0.5);
          tmp.copy(P0).lerp(P1, u);
          tmp.y += bump(u) * 6;
          tmp.z += bump(u) * 6;
          fr.g.position.set(tmp.x, tmp.y - bodyY, tmp.z);
          fr.g.quaternion.setFromEuler(new T.Euler(-Math.cos(u * Math.PI) * 0.6, Math.atan2(P1.x - P0.x, 1.2), 0));
          runPose(u * Math.PI * 4, 1);
          const into = u > 0.75 ? (u - 0.75) / 0.25 : 0;
          fr.g.scale.setScalar(1 - into * 0.0);
        } else {
          const k2 = k - n * seg, top = BC.y + BR[1] - 0.6;
          fr.g.position.set(Math.sin(k2 * 0.9) * 6, top + Math.abs(Math.sin(k2 * 5.5)) * 2.2, BC.z + 0.5);
          fr.g.quaternion.setFromEuler(new T.Euler(0, Math.sin(k2 * 2.4) * 1.0, Math.sin(k2 * 5.5) * 0.12));
          runPose(k2 * 11, 0.5);
          FP.head.rotation.set(-0.2, Math.sin(k2 * 3) * 0.4, 0);
          if (FP.tail) FP.tail.rotation.x = -0.45 + Math.sin(k2 * 11) * 0.3;
        }
      } else if (done) {
        const top = BC.y + BR[1] - 0.6, k2 = V.now - doneT;
        fr.g.position.set(Math.sin(k2 * 0.9) * 6, top + Math.abs(Math.sin(k2 * 5.5)) * 1.0, BC.z + 0.5);
        fr.g.quaternion.setFromEuler(new T.Euler(0, Math.sin(k2 * 2.4) * 1.0, 0));
        runPose(k2 * 8, 0.3);
      } else {
        // il guette à son trou, regarde à droite et à gauche, hoche la tête en rythme
        atHole(cur, 1 + beat * 0.12, Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3) * 0.15);
        FP.head.rotation.x += -beat * 0.25 + (Math.floor(t / 1.8) % 2 === 0 ? (f % 2 ? 0.06 : -0.02) : 0);
      }
      FP.ears.forEach((e, i) => { const b = earBase[i], s = i ? 1 : -1; e.rotation.set(b.x, b.y, b.z + s * (beat * 0.3 + Math.sin(t * 2.1 + i) * 0.05)); });
      fSh.visible = shadowOn;
      if (shadowOn) { fSh.position.set(fr.g.position.x, H(fr.g.position.x, fr.g.position.z) + 0.15, fr.g.position.z); fSh.rotation.z = -Math.atan2(dir.z, dir.x); }
      // le tourbillon de feuilles
      const vk = done ? sat((V.now - doneT) / 0.6) * (1 - sat((V.now - doneT - 5) / 1.5)) : 0;
      vortex.count = vk > 0 ? VN : 0;
      if (vk > 0) {
        const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), sc = v3(), ps = v3();
        const k2 = V.now - doneT;
        VP.forEach((L, i) => { const a = L.a + k2 * L.sp * 2.2, rr = L.rr * (0.6 + 0.4 * vk), y = (L.y0 + k2 * 5 * L.sp) % 30; ps.set(Math.cos(a) * rr, 1 + y, BC.z + 6 + Math.sin(a) * rr * 0.55); e.set(k2 * L.w, a, k2 * 2); q.setFromEuler(e); m4.compose(ps, q, sc.setScalar(L.s * vk)); vortex.setMatrixAt(i, m4); });
        vortex.instanceMatrix.needsUpdate = true;
      }
    });

    return {
      update(st, first) {
        p = st.p;
        const nph = Math.min(st.phrasesDone, NP);
        if (nph > ph && !first) for (let i = ph; i < nph; i++) V.cue('shr' + i, (i - ph) * 0.2);
        if (first) for (let i = 0; i < nph; i++) V.cues['shr' + i] = -9;
        ph = nph;
        if (!st.done && st.found !== lastFound) {
          let want = (st.found * 3) % holes.length;
          if (want === cur && lastFound >= 0) want = (want + 2) % holes.length;
          if (first || lastFound < 0) { cur = want; act = null; } else { act = { type: 'pop', from: cur, to: want, t0: V.now + 1 / FPS }; cur = want; }
          lastFound = st.found;
        }
        if (st.done && !done) { done = true; doneT = first ? V.now - 20 : V.now + 1 / FPS; act = first ? null : { type: 'zip', t0: V.now + 1 / FPS }; }
        if (!st.done && done) { done = false; }
      },
      react(kind) {
        if (kind === 'correct') { conf.burst(holes[cur].p.clone().add(v3(0, 1, 1)), 6, LCOL, 0.4, 0.6); }
        if (kind === 'phrase' && !done) {
          // il traverse en courant jusqu'à un trou à l'autre bout
          const from = act && act.type === 'pop' ? act.to : cur;
          const to = from <= 2 ? 4 : 0;
          act = { type: 'run', from, to, t0: V.now + 1 / FPS, dur: 1.7 };
          cur = to;
          conf.burst(v3(0, 16, -2), 12, LCOL, 0.7, 1.4);
        }
        if (kind === 'complete') {
          conf.burst(v3(0, 14, 0), 30, LCOL, 1.1, 1.4);
          conf.rain([-36, 36, 44, -10, 16], 30, LCOL);
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('beat');
      },
    };
  },
};
