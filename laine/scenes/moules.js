/* ============ À la pêche aux moules : la plage, en plein soleil ============
   Sable tricoté, mer de résine aux crêtes de fil blanc, rochers couverts de
   moules de feutrine bleu nuit, phare rayé, voiliers à l'horizon, mouettes
   pendues à leur fil. À chaque note retrouvée, une moule saute du rocher
   dans le panier de l'enfant (avec une éclaboussure) ; à chaque phrase, une
   mouette passe. À la fin, la mouette chipe le panier et s'envole avec,
   l'enfant éclate de rire sous une pluie de coquillages.
   Écoute : les vagues et l'enfant bougent en rythme. */
SCENES.moules = {
  color: '#7CC6EE',
  view: {
    bg: '#6DB8E8', fov: 26,
    rig: { target: [0, 12, 2], az: 0, el: 6, box: [58, 48], targetWide: [1, 13, 2], boxWide: [94, 42] },
    post: { exposure: 1.16, bloom: 0.45, bloomThr: 1.0, aper: 7, maxBlur: 11, sat: 1.12, lift: '#03081A', punch: 1.26, vignette: 0.3, grain: 0.035 },
  },
  sky: [-26, 24, 26, 34, -16, -4],
  home: [-6, 9, 6],
  flock: 6,
  build(V, o) {
    const song = o.song, NP = song.phrases.length, live = !o.portrait;
    studioLights(V, {
      key: { color: '#FFF4E0', k: 3.0, az: 38, el: 50, area: 80 },
      fill: { sky: '#9FD4F5', ground: '#C9B48A', k: 0.55 },
      rim: { color: '#FFF6E2', k: 1.4, az: -150, el: 28 },
      env: { sky: '#BCE2F7', ground: '#D8C8A0', k: 0.4, boxK: 4 },
      fog: { color: '#BFE2F2', near: 230, far: 700 },
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

    // le ciel tendu et la plage de sable tricoté qui descend vers la mer
    V.add(faceCam(cyclo({ w: 560, h: 80, z: -100, r: 24, floor: 20, top: '#3A8ED6', mid: '#78C2EE', bottom: '#D2EEF4', scale: 3 })));
    const SHORE = -9;
    const slope = (z) => (z < SHORE + 6 ? -Math.pow((SHORE + 6 - z) / 14, 1.4) * 2.2 : 0);
    const sand = terrain({ w: 360, d: 200, nx: 60, nz: 40, z: 40, hills: [[36, 30, 18, 3.5], [-46, 34, 22, 2.5]], colors: ['#EBD5A8', '#E2C994'], bands: 4, rough: 0.5, scale: 1.8 });
    {
      const p = sand.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + slope(p.getZ(i)));
      p.needsUpdate = true;
      sand.geometry.computeVertexNormals();
    }
    V.add(sand);
    const H = (x, z) => sand.userData.height(x, z) + slope(z);
    const KX = -2, KZ = 7; // l'enfant

    // la mer : résine en dégradé (turquoise près du bord, bleu profond au large) qui ondule
    const seaG = new T.PlaneGeometry(380, 120, 70, 30);
    seaG.rotateX(-Math.PI / 2);
    seaG.translate(0, 0, SHORE - 58);
    scaleUV(seaG, 380, 120);
    {
      const p = seaG.attributes.position, c = [], near = col('#3FC2D2'), mid = col('#1F8FC4'), far = col('#155C9E'), cc = new T.Color();
      for (let i = 0; i < p.count; i++) { const k = sat((SHORE + 2 - p.getZ(i)) / 110); if (k < 0.35) cc.copy(near).lerp(mid, smooth(k / 0.35)); else cc.copy(mid).lerp(far, smooth((k - 0.35) / 0.65)); c.push(cc.r, cc.g, cc.b); }
      seaG.setAttribute('color', new T.Float32BufferAttribute(c, 3));
    }
    const seaM = resinMat('#FFFFFF', { rough: 0.14, normal: 'felt', scale: 1.4, bump: 0.8 }).clone();
    seaM.vertexColors = true;
    seaM.transparent = true;
    seaM.opacity = 0.93;
    const sea = mesh(seaG, seaM, { cast: false });
    V.add(sea);
    const seaP = seaG.attributes.position, seaBase = Float32Array.from(seaP.array);
    let swell = 0;
    const waveAt = (x, z, t) => Math.sin(x * 0.1 + t * 1.6 + z * 0.05) * 0.32 + Math.sin(z * 0.28 - t * 1.2 + x * 0.04) * 0.22;
    const seaWave = (t) => {
      for (let i = 0; i < seaP.count; i++) { const x = seaBase[i * 3], z = seaBase[i * 3 + 2]; const nearK = sat((z - (SHORE - 40)) / 40); seaP.setY(i, waveAt(x, z, t) * (0.5 + 0.5 * nearK) * (1 + swell * 0.8) + 0.25); }
      seaP.needsUpdate = true;
      seaG.computeVertexNormals();
    };
    // une bande de feutrine bleu nuit pour la ligne d'horizon
    const horizon = feltPiece(roundRectShape(520, 6, 1), '#1C5A96', { depth: 0.6, inset: 0.8, stitch: '#5E9AD0', st: { len: 1.4, gap: 1.0, r: 0.12 } });
    at(horizon, 0, -1.8, -72);
    V.add(noShadow(horizon));
    // crêtes de vagues en fil blanc
    // une rangée de petits rouleaux de fil, espacés, comme des vagues dessinées
    const crestGeo = (len, amp, seed) => {
      const r = rng(seed), gs = [];
      let x = -len / 2 + r() * 6;
      while (x < len / 2) {
        const L = 7 + r() * 9, z0 = (r() - 0.5) * amp * 2, pts = [];
        for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([x + u * L, Math.sin(u * Math.PI) * (0.5 + amp * 0.25) + (u > 0.75 ? -(u - 0.75) * 2.4 : 0), z0 + Math.sin(u * Math.PI) * 0.6 + (u > 0.8 ? (u - 0.8) * 3 : 0)]); }
        gs.push(yarnGeo(pts, 0.3, { radial: 5, maxSeg: 40 }));
        x += L + 2 + r() * 7;
      }
      return mergeGeos(gs);
    };
    const crestM = wool('#FFFFFF', 'yarn', { emissive: '#FFFFFF', emissiveIntensity: 0.12 });
    const crests = [[SHORE - 1.5, 150, 0.9, 0.0, 0.8], [SHORE - 13, 200, 1.4, 1.1, 0.7], [SHORE - 28, 240, 1.8, 2.3, 0.6], [SHORE - 48, 300, 2.2, 3.1, 0.5], [SHORE - 66, 340, 2.6, 4.2, 0.4]].map(([z, len, amp, ph, k], i) => {
      const m = mesh(crestGeo(len, amp, i + 3), crestM, { cast: false });
      m.position.set((i % 2 ? -8 : 6), 0.6, z);
      V.add(m);
      return { m, z, ph, k };
    });
    // l'écume qui lèche le sable
    const foamGeo = (() => { const gs = []; const r = rng(4); for (let i = 0; i < 30; i++) { const x = -90 + i * 6.2 + r() * 3; gs.push(applyM(blobGeo(1.6 + r() * 1.4, 0.35, 0.9 + r() * 0.5, { seg: 10, lump: 0.2, seed: i }), { p: [x, 0, (r() - 0.5) * 1.2] })); } return mergeGeos(gs); })();
    const foam = mesh(foamGeo, wool('#FFFFFF', 'crochet', { scale: 0.6, emissive: '#FFFFFF', emissiveIntensity: 0.1 }), { cast: false });
    V.add(foam);

    // soleil, nuages et voiliers à l'horizon
    const sunG = new T.Group();
    sunG.add(feltPiece(circleShape(5.6), '#FFD54A', { depth: 1.6, inset: 0.7, stitch: '#F0962A', st: { len: 0.6, gap: 0.38, r: 0.09 }, mat: { emissive: '#FFB43A', emissiveIntensity: 0.55 } }));
    const rays = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r0 = 6.4, r1 = i % 2 ? 8.4 : 9.6; rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.07) * (r0 + r1) / 2, Math.sin(a + 0.07) * (r0 + r1) / 2, 0.25], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.34, { radial: 5 })); }
    sunG.add(mesh(mergeGeos(rays), wool('#FFB82E', 'yarn', { emissive: '#FF9A1A', emissiveIntensity: 0.35 }), { cast: false }));
    addFace(sunG, 5.4, { z: 0.85, cheeks: '#F58A5C' });
    noShadow(sunG);
    at(sunG, -32, 36, -56);
    const hSun = hang(sunG, 150, { amp: 1.2, per: 5 });
    V.add(hSun);
    swingAnim(V, hSun);
    [[4, 40, -64, 28, 10, 3], [36, 44, -70, 22, 8, 6], [-58, 42, -68, 24, 9, 9]].forEach(([x, y, z, w, h, sd]) => {
      const c = noShadow(feltPiece(cloudShape(w, h, 4, sd), '#FFFFFF', { depth: 2.2, inset: 0.9, curve: 8, stitch: '#BFD6EC', st: { len: 0.9, gap: 0.6, r: 0.1 }, mat: { emissive: '#FFFFFF', emissiveIntensity: 0.25 } }));
      at(c, x, y, z);
      const hc = hang(c, 160, { amp: 0.9, per: 6 + sd * 0.2 });
      V.add(hc);
      swingAnim(V, hc);
    });
    const boats = [];
    const hullSh = polyShape([[-3.2, 0.8], [3.4, 0.8], [2.4, -0.7], [-2.5, -0.7]]);
    const sailA = polyShape([[0, 0], [0, 7.2], [3.6, 0.4]]), sailB = polyShape([[0, 0], [0, 6.0], [-2.8, 0.3]]);
    [[-22, -64, '#E5484D', '#FFFFFF', 0.9], [8, -68, '#FFFFFF', '#3E6FD8', 0.75], [42, -62, '#1F4F8F', '#F5C32C', 0.85]].forEach(([x, z, hc, sc, s], i) => {
      const b = new T.Group();
      b.add(mesh(feltGeo(hullSh, 1.6, { bevel: 0.25 }), wool(hc, 'felt')));
      b.add(mesh(yarnGeo([[0.2, 0.8, 0], [0.25, 8.4, 0]], 0.13, { radial: 4 }), wool('#8A6040', 'yarn')));
      const sa = feltPiece(sailA, '#FFFDF6', { depth: 0.18, inset: 0.3, stitch: sc, st: { len: 0.35, gap: 0.22, r: 0.05 } });
      sa.position.set(0.45, 1.0, 0);
      const sb = feltPiece(sailB, sc, { depth: 0.18, inset: 0.3, stitch: '#FFFFFF', st: { len: 0.35, gap: 0.22, r: 0.05 } });
      sb.position.set(-0.05, 1.0, 0.1);
      b.add(sa, sb);
      b.scale.setScalar(s);
      b.rotation.y = i === 1 ? -0.3 : 0.25;
      at(b, x, 0.2, z);
      V.add(noShadow(b));
      boats.push({ b, x, ph: i * 2.1 });
    });

    // le phare rayé sur ses rochers
    const LX = 25, LZ = -34;
    const light = new T.Group();
    const rockM = '#9C968C';
    [[0, 0, 7.5, 0.7], [-6, 3, 4.5, 0.75], [5.5, 4, 5, 0.7], [-2, 6.5, 3.6, 0.8]].forEach(([x, z, r, sy], i) => { const s = stone(r, i % 2 ? '#8E887E' : rockM, i + 4); s.scale.y = sy * 1.5; at(s, x, 0.8, z); light.add(s); });
    {
      const prof = [], cols = [];
      const R = (y) => lerp(4.3, 3.0, y / 28);
      const red = col('#D8443A'), white = col('#F6F1E6');
      for (let b = 0; b < 7; b++) { const y0 = b * 4, y1 = Math.min(28, y0 + 4); prof.push([R(y0) , y0], [R(y1 - 0.02), y1 - 0.02]); cols.push(b % 2 ? white : red, b % 2 ? white : red); }
      prof.push([0.01, 28.05]); cols.push(white);
      const g = latheGeo(prof.map(([r, y]) => [r, y + 3.2]), { seg: 26 });
      const n = prof.length, c = [];
      for (let i = 0; i < g.attributes.position.count; i++) { const cc = cols[i % n]; c.push(cc.r, cc.g, cc.b); }
      g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
      const tm = wool('#FFFFFF', 'knit', { scale: 0.7 }).clone();
      tm.vertexColors = true;
      tm.sheenColor = col('#FFE8E0');
      light.add(mesh(g, tm));
    }
    const door = feltPiece(polyShape([[-1.1, 0], [1.1, 0], [1.1, 2.4], [0, 3.2], [-1.1, 2.4]]), '#3A5A8A', { depth: 0.3, inset: 0.25, stitch: '#9DB8E2', st: { len: 0.25, gap: 0.16, r: 0.035 } });
    door.position.set(0, 3.4, 4.35);
    light.add(door);
    for (const y of [12, 20]) { const w = feltPiece(roundRectShape(1.2, 1.7, 0.5), '#2A3A5A', { depth: 0.2, inset: 0.2, stitch: '#FFFFFF', st: { len: 0.2, gap: 0.14, r: 0.03 } }); w.position.set(0, y + 3.2, lerp(4.3, 3.0, y / 28) + 0.15); light.add(w); }
    const gal = mesh(new T.CylinderGeometry(4.2, 4.2, 0.8, 26), wool('#2E3440', 'felt'));
    gal.position.y = 31.6;
    light.add(gal);
    const rail = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; rail.push(yarnGeo([[Math.cos(a) * 3.9, 32, Math.sin(a) * 3.9], [Math.cos(a) * 3.9, 33.6, Math.sin(a) * 3.9]], 0.1, { radial: 4 })); }
    { const pts = []; for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; pts.push(v3(Math.cos(a) * 3.9, 33.6, Math.sin(a) * 3.9)); } rail.push(yarnGeo(pts, 0.12, { radial: 4, closed: true })); }
    light.add(mesh(mergeGeos(rail), wool('#2E3440', 'yarn'), { cast: false }));
    const lamp = mesh(new T.CylinderGeometry(2.0, 2.0, 3.4, 18), glowMat('#FFE7A0', 1.6), { cast: false });
    lamp.position.y = 33.9;
    light.add(lamp);
    const cage = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; cage.push(yarnGeo([[Math.cos(a) * 2.25, 32.1, Math.sin(a) * 2.25], [Math.cos(a) * 2.25, 35.7, Math.sin(a) * 2.25]], 0.12, { radial: 4 })); }
    light.add(mesh(mergeGeos(cage), wool('#2E3440', 'yarn'), { cast: false }));
    const cap = mesh(latheGeo([[2.9, 0], [2.6, 0.5], [1.2, 2.2], [0.4, 3.0], [0.01, 3.3]], { seg: 20 }), wool('#B83A30', 'felt'));
    cap.position.y = 35.6;
    light.add(cap);
    const capBall = woolBall(0.6, '#2E3440', 'felt', { fuzz: false });
    capBall.position.y = 39.2;
    light.add(capBall);
    const beamM = new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFF0B0'), transparent: true, opacity: 0.0, depthWrite: false, blending: T.AdditiveBlending, fog: false, side: T.DoubleSide });
    const beam = new T.Mesh(new T.PlaneGeometry(46, 7), beamM);
    beam.geometry.translate(23, 0, 0);
    const beamPiv = new T.Group();
    beamPiv.position.y = 33.9;
    beamPiv.add(beam);
    light.add(beamPiv);
    const lampHalo = new T.Mesh(new T.PlaneGeometry(16, 16), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFE6A0').multiplyScalar(0.7), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    lampHalo.position.set(0, 33.9, 2.6);
    light.add(lampHalo);
    light.scale.setScalar(0.88);
    at(light, LX, H(LX, LZ) - 0.6, LZ);
    V.add(light);

    // les rochers couverts de moules
    const rocks = [[-25, -9, 6.6, 1], [-16, -4.5, 5.0, 2], [-32, -2, 4.6, 3], [-9, -10, 3.8, 4]];
    rocks.forEach(([x, z, r, sd]) => { const s = stone(r, sd % 2 ? '#7E786F' : '#8F887C', sd + 10); s.scale.y = 1.15; at(s, x, H(x, z) + r * 0.12, z); V.add(s); });
    const musselGeo = (() => { const g = blobGeo(0.55, 0.3, 1.1, { seg: 10, lump: 0.05, seed: 3 }); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), k = 1 - sat((z + 1.1) / 2.2) * 0.55; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k + (z > 0 ? -z * 0.12 : 0), z); } g.computeVertexNormals(); return g; })();
    const musselM = wool('#FFFFFF', 'felt', { sheen: 0.9, sheenColor: '#6F7FB8' });
    const RM = [];
    const mr = rng(77);
    rocks.forEach(([x, z, r], k) => {
      const n = [26, 18, 14, 10][k];
      for (let i = 0; i < n; i++) {
        const cl = Math.floor(i / 5), az = (hashi(k, cl, 3) - 0.5) * 2.6 + (mr() - 0.5) * 0.36 + (k === 2 ? 0.4 : 0), el = -0.08 + hashi(k, cl, 5) * 0.8 + (mr() - 0.5) * 0.16;
        const sy = 0.62 * 1.15;
        const pos = v3(x + Math.cos(el) * Math.sin(az) * r * 1.0, H(x, z) + r * 0.12 + Math.sin(el) * r * sy * 1.0, z + Math.cos(el) * Math.cos(az) * r * 1.0);
        const nrm = v3(Math.cos(el) * Math.sin(az) / r, Math.sin(el) / (r * sy), Math.cos(el) * Math.cos(az) / r).normalize();
        RM.push({ pos, nrm, s: 1.15 + mr() * 0.6, tw: (mr() - 0.5) * 3.2 });
      }
    });
    RM.sort((a, b) => a.pos.z - b.pos.z);
    const rockMus = new T.InstancedMesh(musselGeo, musselM, RM.length);
    rockMus.castShadow = true;
    rockMus.receiveShadow = true;
    {
      const m4 = new T.Matrix4(), bx = v3(), by = v3(), bz = v3(), q = new T.Quaternion(), sc = v3(), cc = new T.Color();
      RM.forEach((m, i) => {
        by.copy(m.nrm);
        bz.set(0, 1, 0).sub(by.clone().multiplyScalar(by.y)).normalize().applyAxisAngle(by, m.tw);
        bx.crossVectors(by, bz).normalize();
        m4.makeBasis(bx, by, bz);
        q.setFromRotationMatrix(m4);
        m4.compose(m.pos.clone().addScaledVector(m.nrm, 0.15), q, sc.setScalar(m.s));
        rockMus.setMatrixAt(i, m4);
        rockMus.setColorAt(i, cc.set(i % 3 ? '#1E2A55' : '#28356A'));
      });
    }
    V.add(rockMus);
    const star1 = feltPiece(starShape(2.2, 0.42, 5, 0.3), '#F28A3C', { depth: 0.6, inset: 0.3, stitch: '#FFD2A0', st: { len: 0.25, gap: 0.16, r: 0.04 } });
    star1.rotation.set(-1.0, 0, 0.3);
    at(star1, -24, H(-24, 0) + 1.6, 0.8);
    V.add(star1);

    // coquillages sur le sable (instances)
    const shellSh = (() => { const s = new T.Shape(); s.moveTo(0, -1); for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.08 + 0.84 * (i / 8)); const r = 1.25 + (i % 2 ? 0.0 : 0.1); s.lineTo(Math.cos(a) * r * -1 + 0, Math.sin(a) * r * 0.9 - 0.2); } s.lineTo(0.28, -0.8); s.lineTo(-0.28, -0.8); return s; })();
    const shellG = feltGeo(shellSh, 0.25, { bevel: 0.06, curve: 6 });
    const SC = ['#F7D9C4', '#F2B8A0', '#FFFFFF', '#F5E0B8', '#E9A2B4'];
    const bigShells = [[-16, 58, 2.6], [15, 64, 2.2], [-22, 44, 1.8], [24, 46, 2.0]];
    V.add(scatter(shellG, instFelt, 30 + bigShells.length, (i, r) => {
      if (i >= 30) { const [x, z, sc] = bigShells[i - 30]; return { p: [x, H(x, z) + 0.2 * sc, z], r: [-Math.PI / 2 + 0.25, 0, r() * 6], s: sc, c: SC[i % 5] }; }
      let x = (r() - 0.5) * 100, z = -2 + r() * 50;
      if (Math.abs(x - KX) < 6 && Math.abs(z - KZ) < 6) x += 14;
      return { p: [x, H(x, z) + 0.15, z], r: [-Math.PI / 2 + (r() - 0.5) * 0.3, 0, r() * 6], s: 0.7 + r() * 0.6, c: SC[i % 5] };
    }, { cast: false }));
    // traces de pas qui mènent à l'enfant
    V.add(scatter(feltGeo(ellipseShape(0.75, 1.25), 0.1, { bevel: 0 }), instFelt, 10, (i) => { const k = i >> 1, s = i % 2 ? 1 : -1; const x = -8 - k * 3.2 + s * 0.9, z = 12 + k * 5.5; return { p: [x, H(x, z) + 0.06, z], r: [-Math.PI / 2, 0, 0.5], s: 1, c: '#CDB283' }; }, { cast: false }));
    // un château de sable, son drapeau
    const castle = new T.Group();
    {
      const gs = [];
      const tower = (x, z, r, hh) => { gs.push(applyM(latheGeo([[r * 1.12, 0], [r, hh * 0.3], [r * 0.96, hh], [r * 1.02, hh + 0.05], [0.01, hh + 0.06]], { seg: 16, lump: 0.08 }), { p: [x, 0, z] })); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; gs.push(applyM(new T.BoxGeometry(r * 0.55, r * 0.5, r * 0.4), { p: [x + Math.cos(a) * r * 0.82, hh + r * 0.25, z + Math.sin(a) * r * 0.82], r: [0, -a, 0] })); } };
      tower(0, 0, 2.6, 5.5); tower(-4.4, 1.2, 1.7, 3.6); tower(3.9, 1.6, 1.5, 3.0);
      gs.push(applyM(new T.BoxGeometry(8.6, 2.2, 1.6), { p: [0, 1.1, 2.4] }));
      castle.add(mesh(mergeGeos(gs), wool('#E0C38C', 'knit', { scale: 0.45 })));
      castle.add(mesh(yarnGeo([[0, 5.6, 0], [0, 9.6, 0]], 0.1, { radial: 4 }), wool('#8A6040', 'yarn'), { cast: false }));
      const flag = feltPiece(polyShape([[0, 0], [2.4, -0.7], [0, -1.5]]), '#E5484D', { depth: 0.12, inset: 0.15, stitch: '#FFD0C8', st: { len: 0.18, gap: 0.12, r: 0.03 } });
      flag.position.set(0.1, 9.5, 0);
      castle.add(flag);
      castle.userData.flag = flag;
    }
    castle.rotation.y = -0.4;
    at(castle, 22, H(22, 30) - 0.2, 30);
    V.add(castle);
    const castleSh = contactShadow(16, 10, 0.35);
    castleSh.position.set(22, H(22, 30) + 0.15, 30);
    V.add(castleSh);
    // un petit crabe au crochet qui trottine de côté
    const crab = new T.Group();
    {
      const cb = woolBall(1.7, '#E5533D', 'crochet', { sx: 1.3, sy: 0.62, sz: 0.95, fuzz: 0.1, seed: 31 });
      cb.position.y = 1.6;
      crab.add(cb);
      for (const s2 of [-1, 1]) {
        crab.add(yarn([[s2 * 0.6, 2.3, 0.8], [s2 * 0.8, 3.3, 1.0]], 0.13, '#E5533D', { radial: 4, cast: false }));
        const w = felt(circleShape(0.48), '#FFFFFF', 0.1, { bevel: 0 });
        w.position.set(s2 * 0.82, 3.5, 1.08);
        const e = bead(0.3, '#141210');
        e.position.set(s2 * 0.84, 3.48, 1.25);
        crab.add(w, e);
      }
      crab.add(yarn([[-0.6, 1.5, 1.55], [0, 1.25, 1.68], [0.6, 1.5, 1.55]], 0.08, '#5A1A12', { radial: 4, cast: false }));
      crab.userData.claws = [-1, 1].map((s2) => {
        const piv = new T.Group();
        piv.position.set(s2 * 1.9, 1.7, 0.7);
        piv.add(yarn([[0, 0, 0], [s2 * 0.9, 0.5, 0.6], [s2 * 1.3, 1.1, 1.0]], 0.24, '#E5533D', { radial: 5, cast: false }));
        const pin = woolBall(0.75, '#E5533D', 'crochet', { sx: 0.85, sy: 1.15, sz: 0.6, fuzz: false, seed: 7 });
        pin.position.set(s2 * 1.4, 1.9, 1.2);
        piv.add(pin);
        crab.add(piv);
        return piv;
      });
      const lg = [];
      for (const s2 of [-1, 1]) for (let i = 0; i < 3; i++) { const z = 0.5 - i * 0.6; lg.push(yarnGeo([[s2 * 1.6, 1.4, z], [s2 * 2.6, 1.3, z - 0.1], [s2 * 3.0, 0.1, z - 0.2]], 0.13, { radial: 4 })); }
      crab.add(mesh(mergeGeos(lg), wool('#D8442E', 'yarn'), { cast: false }));
    }
    crab.rotation.y = 0.3;
    at(crab, -14, H(-14, 24), 24);
    V.add(crab);
    V.boilable(crab, 0.04, 0.8);
    const crabSh = contactShadow(7, 5, 0.4);
    V.add(crabSh);
    // oyats sur la dune de droite
    const oyatG0 = () => { const gs = []; const r = rng(6); for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + r(), hh = 6 + r() * 5, ln = 1.5 + r() * 1.5; gs.push(yarnGeo([[Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], [Math.cos(a) * ln * 0.3, hh * 0.55, Math.sin(a) * ln * 0.3], [Math.cos(a) * ln, hh, Math.sin(a) * ln]], 0.15, { radial: 3, maxSeg: 4 })); } return mergeGeos(gs); };
    const oyatG = oyatG0();
    V.add(scatter(oyatG, wool('#FFFFFF', 'yarn', { sheen: 0.6, sheenColor: '#56664A' }), 22, (i, r) => { const right = i < 14; const x = right ? 26 + r() * 30 : -58 + r() * 22, z = right ? 18 + r() * 30 : 24 + r() * 26; return { p: [x, H(x, z) - 0.2, z], r: [0, r() * TAU, 0], s: 0.8 + r() * 0.6, c: ['#A8B86A', '#93A85A', '#C2C47A'][i % 3] }; }, { cast: false }));
    // algues au pied des rochers
    V.add(scatter(oyatG0(), wool('#FFFFFF', 'yarn', { sheen: 0.6, sheenColor: '#56664A' }), 18, (i, r) => { const R = rocks[i % rocks.length]; const a = (r() - 0.5) * 2.4; const x = R[0] + Math.sin(a) * R[2] * 0.95, z = R[1] + Math.cos(a) * R[2] * 0.95; return { p: [x, H(x, z) - 0.1, z], r: [0, r() * TAU, 0], s: 0.2 + r() * 0.16, c: ['#5A5A22', '#4A4A1E', '#6E6426'][i % 3] }; }, { cast: false }));
    // laitue de mer et balanes sur les rochers
    const lettuce = [], barn = [];
    rocks.forEach(([x, z, r], k) => { const rr = rng(k + 40); for (let i = 0; i < 4; i++) { const az = (rr() - 0.5) * 2.4, el = 0.2 + rr() * 0.9, sy = 0.62 * 1.15; const n = v3(Math.cos(el) * Math.sin(az) / r, Math.sin(el) / (r * sy), Math.cos(el) * Math.cos(az) / r).normalize(); lettuce.push({ p: [x + Math.cos(el) * Math.sin(az) * r * 1.01, H(x, z) + r * 0.12 + Math.sin(el) * r * sy * 1.01, z + Math.cos(el) * Math.cos(az) * r * 1.01], n, s: 0.8 + rr() * 0.6 }); } for (let i = 0; i < 9; i++) { const az = (rr() - 0.5) * 3, el = 0.4 + rr() * 1.0, sy = 0.62 * 1.15; const n = v3(Math.cos(el) * Math.sin(az) / r, Math.sin(el) / (r * sy), Math.cos(el) * Math.cos(az) / r).normalize(); barn.push({ p: [x + Math.cos(el) * Math.sin(az) * r * 0.99, H(x, z) + r * 0.12 + Math.sin(el) * r * sy * 0.99, z + Math.cos(el) * Math.cos(az) * r * 0.99], n, s: 0.5 + rr() * 0.5 }); } });
    const onSurf = (list, geo, mat, colr, up) => V.add(scatter(geo, mat, list.length, (i, r) => { const d = list[i]; const q = new T.Quaternion().setFromUnitVectors(v3(0, up ? 1 : 0, up ? 0 : 1), d.n); const e = new T.Euler().setFromQuaternion(q); return { p: d.p, r: [e.x, e.y, e.z], s: d.s, c: colr[i % colr.length] }; }, { cast: false }));
    onSurf(lettuce, feltGeo(blobShape([[0, 0], [1.2, 0.5], [1.6, 1.4], [0.9, 2.2], [-0.4, 2.0], [-1.3, 1.2], [-1.0, 0.3]]), 0.15, { bevel: 0.04 }), instFelt, ['#6CB04A', '#5A9E3E', '#82C25A'], false);
    onSurf(barn, latheGeo([[0.45, 0], [0.38, 0.3], [0.16, 0.42], [0.01, 0.35]], { seg: 8 }), instFelt, ['#E8E2D2', '#D8D0BE'], true);
    // un seau et une pelle oubliés
    const pail = new T.Group();
    pail.add(mesh(latheGeo([[0.01, 0], [2.0, 0], [2.1, 0.2], [2.7, 4.0], [2.9, 4.1], [2.85, 4.35], [2.55, 4.25], [1.9, 0.45], [0.01, 0.45]], { seg: 22 }), wool('#E5484D', 'knit', { scale: 0.5 })));
    pail.add(yarn([[-2.75, 4.1, 0], [-2.2, 6.4, 0.2], [0, 7.4, 0.3], [2.2, 6.4, 0.2], [2.75, 4.1, 0]], 0.12, '#F5C32C', { radial: 4, cast: false }));
    const spade = new T.Group();
    spade.add(mesh(yarnGeo([[0, 0, 0], [0, 7, 0]], 0.3, { radial: 5 }), wool('#F5C32C', 'yarn')));
    const blade = mesh(feltGeo(polyShape([[-1.4, 0], [1.4, 0], [1.1, -2.6], [0, -3.2], [-1.1, -2.6]]), 0.3, { bevel: 0.08 }), wool('#3E6FD8', 'felt'));
    spade.add(blade);
    spade.rotation.set(0.2, 0.3, -0.55);
    spade.position.set(3.4, 2.4, 0.6);
    pail.add(spade);
    pail.rotation.y = -0.5;
    at(pail, 17, H(17, 17) - 0.1, 17);
    V.add(pail);
    const pailSh = contactShadow(9, 7, 0.4);
    pailSh.position.set(17, H(17, 17) + 0.15, 17);
    V.add(pailSh);

    // l'enfant en marinière, chapeau de paille, pieds nus
    const kid = doll({ h: 15, skin: '#F3C9A6', top: '#FFFFFF', bottom: '#2E4A86', sleeves: '#FFFFFF', legs: '#F3C9A6', shoes: '#F3C9A6', hair: '#B5753E', hairStyle: 'bob', fringe: false, hat: { type: 'straw', color: '#E8C878', band: '#E5484D' }, cheeks: '#F2998C' });
    lighter(kid.g, 1.0, 12);
    trim(kid.g, 0.8, 0.6);
    const KB = kid.p, h = 15, br = h * 0.15, bodyH = h * 0.4;
    {
      // rayures de la marinière (anneaux de fil bleu marine)
      const rr = (y) => { const t = y / bodyH; if (t < 0.1) return br * 1.08 * 1.02; if (t < 0.55) return lerp(br * 1.1, br * 1.0, (t - 0.1) / 0.45); if (t < 0.9) return lerp(br * 1.0, br * 0.82, (t - 0.55) / 0.35); return lerp(br * 0.82, br * 0.5, (t - 0.9) / 0.1); };
      const rings = [0.2, 0.36, 0.52, 0.68, 0.82].map((k) => { const y = bodyH * k; return applyM(new T.TorusGeometry(rr(y) + 0.06, 0.16, 6, 28).rotateX(Math.PI / 2), { p: [0, y, 0] }); });
      KB.body.add(mesh(mergeGeos(rings), wool('#2E4A86', 'yarn'), { cast: false }));
      for (const A of [KB.armL, KB.armR]) { const g = mergeGeos([-0.9, -1.7].map((y) => applyM(new T.TorusGeometry(h * 0.047, 0.13, 6, 16).rotateX(Math.PI / 2), { p: [0, y, 0] }))); A.add(mesh(g, wool('#2E4A86', 'yarn'), { cast: false })); }
    }
    // la bouche qui rit (cachée au début)
    const laugh = felt(blobShape([[-1.0, 0.1], [1.0, 0.1], [0.7, -0.7], [0, -1.0], [-0.7, -0.7]]), '#8A2A2A', 0.15, { bevel: 0.04 });
    {
      const R = kid.R, q = surf([R, R * 0.95, R * 0.92], 0, -24);
      faceTo(at(laugh, q.p.x, q.p.y, q.p.z + 0.05), q.n);
      laugh.scale.setScalar(0.001);
      KB.head.add(laugh);
    }
    const smileYarn = KB.head.children.find((c) => c.geometry && c.geometry.type === 'TubeGeometry');
    kid.g.rotation.y = 0.25;
    at(kid.g, KX, H(KX, KZ), KZ);
    V.add(kid.g);
    V.boilable(kid.g, 0.05, 0.6);
    const blinkK = blinker(KB.eyes, 7);
    const kSh = contactShadow(8, 6, 0.5);
    V.add(kSh);
    KB.armL.rotation.set(-0.95, 0, 0.25);
    KB.armR.rotation.set(-0.95, 0, -0.25);

    // le panier d'osier, qui se remplit de moules
    const basket = new T.Group();
    basket.add(mesh(latheGeo([[0.01, 0], [1.9, 0], [2.2, 0.3], [2.6, 2.3], [2.75, 2.45], [2.55, 2.55], [2.15, 0.55], [0.01, 0.55]], { seg: 20 }), wool('#C99A5A', 'weave')));
    basket.add(yarn([[-2.6, 2.3, 0], [-1.9, 4.6, 0], [0, 5.5, 0], [1.9, 4.6, 0], [2.6, 2.3, 0]], 0.2, '#A07040', { radial: 5 }));
    const BN = 14;
    const binM = new T.InstancedMesh(musselGeo, musselM, BN);
    binM.castShadow = false;
    {
      const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), cc = new T.Color(), r = rng(9);
      for (let i = 0; i < BN; i++) { const ring = i < 6 ? 0 : i < 11 ? 1 : 2, k = ring === 0 ? i : ring === 1 ? i - 6 : i - 11, n = [6, 5, 3][ring]; const a = (k / n) * TAU + ring * 0.6, rr = [1.4, 0.9, 0.4][ring]; e.set(0.3 + r() * 0.6, a + 1.2, (r() - 0.5) * 0.8); q.setFromEuler(e); m4.compose(v3(Math.cos(a) * rr, 1.0 + ring * 0.55, Math.sin(a) * rr), q, v3(0.95, 0.95, 0.95)); binM.setMatrixAt(i, m4); binM.setColorAt(i, cc.set(i % 3 ? '#1E2A55' : '#28356A')); }
    }
    binM.count = 0;
    basket.add(binM);
    V.add(basket);
    const flyM = mesh(musselGeo, musselM, { cast: false });
    flyM.visible = false;
    V.add(flyM);

    // les mouettes de feutrine
    const mkGull = (s) => {
      const g = new T.Group();
      const body = new T.Group();
      g.add(body);
      body.add(woolBall(2.1, '#FBFBF8', 'crochet', { sx: 0.85, sy: 0.78, sz: 1.35, seed: 3, fuzz: 0.12 }));
      const head = woolBall(1.25, '#FBFBF8', 'crochet', { seed: 5, fuzz: 0.1 });
      head.position.set(0, 1.4, 2.2);
      body.add(head);
      const beak = mesh(new T.ConeGeometry(0.38, 1.6, 10), wool('#F5C32C', 'felt'));
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 1.25, 3.7);
      body.add(beak);
      const tip = mesh(new T.SphereGeometry(0.16, 8, 6), wool('#E5484D', 'felt'), { cast: false });
      tip.position.set(0, 1.08, 3.85);
      body.add(tip);
      for (const sx of [-1, 1]) { const e = bead(0.2, '#141210'); e.position.set(sx * 0.62, 1.7, 2.95); body.add(e); }
      const wingSh = blobShape([[0, 0.6], [2.5, 1.0], [5.2, 0.6], [7.0, -0.4], [5.0, -0.7], [2.4, -0.9], [0, -0.7]]);
      const tipSh = blobShape([[5.0, 0.62], [7.0, -0.4], [5.6, -0.66], [4.6, -0.2]]);
      const wings = [-1, 1].map((sx) => {
        const piv = new T.Group();
        piv.position.set(sx * 1.4, 0.7, 0.2);
        const w = grp(mesh(feltGeo(wingSh, 0.28, { bevel: 0.08 }), wool('#A9B2BC', 'felt')), mesh(feltGeo(tipSh, 0.32, { bevel: 0.08 }), wool('#2E3440', 'felt'), { cast: false }));
        w.rotation.x = -Math.PI / 2;
        w.scale.x = sx;
        piv.add(w);
        body.add(piv);
        return piv;
      });
      const tail = mesh(feltGeo(polyShape([[-1.0, 0], [1.0, 0], [0.7, -2.0], [-0.7, -2.0]]), 0.25, { bevel: 0.06 }), wool('#E8ECEF', 'felt'));
      tail.rotation.x = Math.PI / 2 + 0.25;
      tail.position.set(0, 0.4, -2.6);
      body.add(tail);
      const legs = mesh(mergeGeos([-0.5, 0.5].map((x) => yarnGeo([[x, -1.2, 0.2], [x, -2.4, 0.1], [x * 1.3, -2.8, 0.5]], 0.12, { radial: 4 }))), wool('#F2A33A', 'yarn'), { cast: false });
      body.add(legs);
      g.scale.setScalar(s);
      return { g, body, wings, head };
    };
    const gulls = [];
    [[-14, 31, -14, 0.9, 0.5], [17, 27, -6, 0.8, -0.6]].forEach(([x, y, z, s, yaw], i) => {
      const G = mkGull(s);
      G.g.rotation.y = yaw;
      G.body.rotation.z = -yaw * 0.3;
      at(G.g, x, y, z);
      const hg = hang(G.g, 150, { amp: 3, per: 3.5 + i });
      V.add(hg);
      swingAnim(V, hg);
      gulls.push(G);
    });
    // la mouette voleuse, sur son rail : passe à chaque phrase, chipe le panier à la fin
    const thief = mkGull(1.1);
    V.add(thief.g);
    const thread = mesh(yarnGeo([[0, 0, 0], [0, 1, 0]], 0.06, { radial: 4 }), wool('#EDE6D6', 'yarn'), { cast: false });
    V.add(thread);
    thief.g.visible = thread.visible = false;

    // éclaboussures : gouttes de résine + rond dans l'eau
    const DN = 44;
    const drops = new T.InstancedMesh(new T.SphereGeometry(0.5, 8, 6), resinMat('#E8F8FF', { rough: 0.05 }), DN);
    drops.castShadow = false;
    drops.frustumCulled = false;
    drops.count = 0;
    V.add(drops);
    const DP = [];
    const ring = mesh(new T.TorusGeometry(1, 0.14, 5, 32).rotateX(Math.PI / 2), wool('#FFFFFF', 'yarn', { emissive: '#FFFFFF', emissiveIntensity: 0.2 }), { cast: false });
    ring.visible = false;
    V.add(ring);
    let ringT0 = -9, ringP = v3();
    const splash = (p, n = 14, power = 1) => {
      for (let i = 0; i < n; i++) { if (DP.length >= DN) DP.shift(); const a = Math.random() * TAU, sp = (4 + Math.random() * 8) * power; DP.push({ p: p.clone(), v: v3(Math.cos(a) * sp, (16 + Math.random() * 14) * power, Math.sin(a) * sp * 0.6), life: 0, s: 0.6 + Math.random() * 0.9 }); }
      ringT0 = V.now; ringP.copy(p);
    };

    // particules : reflets sur la mer, embruns
    if (live) {
      pointCloud(V, { n: 70, box0: [-90, 0.4, -70], box1: [90, 1.6, SHORE - 2], size: 1.3, sprite: 'spark', color: '#FFFFFF', glow: 1.8, twinkle: 1, wander: 0.3, vel: [0.4, 0, 0], opacity: 0.85 });
      pointCloud(V, { n: 30, box0: [-50, 1, SHORE - 6], box1: [10, 9, SHORE + 2], size: 0.9, sprite: 'soft', color: '#FFFFFF', twinkle: 0.5, wander: 1.5, vel: [0.6, 0.6, 0], opacity: 0.35 });
    }
    // confettis de coquillages : formes ajoutées au cache de la boîte à outils (clés à part)
    if (!CONF_GEO.D_shell) CONF_GEO.D_shell = feltGeo(shellSh, 0.16, { bevel: 0.05, curve: 6 });
    if (!CONF_GEO.D_mussel) { const g = feltGeo(blobShape([[0, 1.1], [0.55, 0.4], [0.5, -0.6], [0, -1.0], [-0.45, -0.5], [-0.5, 0.5]]), 0.16, { bevel: 0.05 }); CONF_GEO.D_mussel = g; }
    const conf = live ? confetti(V, { kinds: ['D_shell', 'star', 'D_mussel'], n: 40, size: 0.9, height: H }) : { burst() {}, rain() {} };
    const SEA = ['#F7D9C4', '#FFFFFF', '#F28A3C', '#F2B8A0', '#1E2A55', '#F5C32C'];
    V.onHome = (c) => conf.burst(v3(-6, 9, 6), 6, [c, '#FFFFFF'], 0.45, 0.6);

    // ---------------- état et animation ----------------
    let ph = 0, done = false, got = 0, shown = 0, flights = [], pass = null, stealT0 = null, flash = -9, grabbed = false;
    const rockShown = () => Math.max(0, RM.length - got);
    const KP = v3(), BP = v3(), tmp = v3(), GP = v3();
    const gullPose = (G, t, f, flap, yaw) => {
      const up = (f >> (flap ? 0 : 1)) % 2 === 0;
      G.wings.forEach((w, i) => { const s = i ? -1 : 1; w.rotation.z = s * (up ? 0.55 : -0.35) * (flap ? 1.3 : 0.8); });
      G.g.rotation.set(0, yaw, 0);
    };
    V.anim((t, f) => {
      blinkK(t, f);
      const beat = bump(sat(V.age('beat') / 0.3));
      swell += ((beat > 0 ? 1 : 0) - swell) * 0.25;
      seaWave(t);
      crests.forEach((c, i) => { c.m.position.y = 0.55 + waveAt(0, c.z, t) * 0.6 + beat * 0.5 * c.k; c.m.position.z = c.z + Math.sin(t * 1.1 + c.ph) * 1.2 * c.k + (i === 0 ? Math.sin(t * 0.9) * 1.6 + beat * 1.4 : 0); c.m.scale.y = 1 + beat * 0.6; });
      foam.position.set(Math.sin(t * 0.3) * 2, H(0, SHORE) + 0.45 + Math.max(0, Math.sin(t * 0.9)) * 0.1, SHORE + 0.5 + Math.sin(t * 0.9) * 2.2 + beat * 1.2);
      foam.scale.set(1, 1, 1 + Math.max(0, Math.sin(t * 0.9)) * 0.5);
      boats.forEach((b) => { b.b.position.x = b.x + Math.sin(t * 0.08 + b.ph) * 6; b.b.position.y = 0.2 + Math.sin(t * 1.3 + b.ph) * 0.25; b.b.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.08; });
      // le phare : la lampe tourne, et s'illumine aux phrases
      const fl = Math.max(0, 1 - (V.now - flash) / 1.4);
      beamPiv.rotation.y = t * 1.6;
      beamM.opacity = 0.12 + fl * 0.5;
      lamp.scale.setScalar(1 + fl * 0.15);
      // l'enfant
      const steal = stealT0 == null ? -1 : V.now - stealT0;
      const laughK = steal > 1.5 ? 1 : 0;
      const jump = steal > 1.2 ? Math.abs(Math.sin((steal - 1.2) * 5.5)) * (steal < 4.5 ? 1.4 : 0.5) : 0;
      const happy = bump(sat(V.age('happy') / 0.45));
      kid.g.position.set(KX, H(KX, KZ) + beat * 0.6 + happy * 1.2 + jump, KZ);
      kid.g.rotation.y = 0.25 + Math.sin(t * 0.6) * 0.08 + (steal > 0.4 && steal < 2.4 ? smooth(sat((steal - 0.4) / 0.5)) * 0.6 : 0);
      KB.body.rotation.z = Math.sin(t * 1.4) * 0.03 + beat * 0.06 * (f % 2 ? 1 : -1);
      KB.head.rotation.x = laughK ? -0.3 + Math.sin(steal * 11) * 0.06 : -0.05 + Math.sin(t * 0.8) * 0.04 - happy * 0.15;
      KB.head.rotation.y = laughK ? 0.3 : -0.2 + Math.sin(t * 0.5) * 0.2;
      laugh.scale.setScalar(laughK ? 1 : 0.001);
      if (smileYarn) smileYarn.visible = !laughK;
      if (steal > 1.2) { KB.armL.rotation.set(-0.2 - jump * 0.3, 0, 2.3 + Math.sin(steal * 9) * 0.2); KB.armR.rotation.set(-0.2 - jump * 0.3, 0, -2.3 - Math.sin(steal * 9) * 0.2); } else { KB.armL.rotation.set(-0.95 - beat * 0.15, 0, 0.25); KB.armR.rotation.set(-0.95 - beat * 0.15, 0, -0.25); }
      KP.copy(kid.g.position);
      // le crabe trottine de côté et pince en rythme ; le drapeau claque
      const cx = -14 + Math.sin(t * 0.7) * 5;
      crab.position.set(cx, H(cx, 24) + (f % 2) * 0.12 + beat * 0.6 + (steal > 1.2 ? Math.abs(Math.sin(steal * 7)) * 0.9 : 0), 24);
      crab.rotation.y = 0.3 + (steal > 1.2 ? Math.sin(steal * 5) * 0.4 : 0);
      crab.userData.claws.forEach((c, i) => { c.rotation.z = (i ? -1 : 1) * (0.1 + ((f >> 1) % 3 === 0 || beat > 0.3 ? 0.35 : 0)); });
      crabSh.position.set(cx, H(cx, 24) + 0.15, 24);
      castle.userData.flag.rotation.y = Math.sin(t * 3.1) * 0.35 + (f % 2) * 0.08;
      kSh.position.set(KX, H(KX, KZ) + 0.15, KZ);
      // le panier : dans les mains, puis sous la mouette
      const yawK = kid.g.rotation.y;
      BP.set(KX + Math.sin(yawK) * 2.9, KP.y + 3.3, KZ + Math.cos(yawK) * 2.9);
      // la mouette voleuse
      let gv = false, gyaw = Math.PI / 2;
      if (pass && !stealT0) {
        const k = (V.now - pass.t0) / 3.2;
        if (k >= 0 && k <= 1) { gv = true; GP.set(lerp(-75, 75, k), 25 + Math.sin(k * Math.PI * 2) * 2.5, -8); } else if (k > 1) pass = null;
      }
      if (steal >= 0) {
        gv = true;
        if (steal < 1.2) { const k = smooth(steal / 1.2); GP.set(lerp(-70, BP.x - 0.5, k), lerp(36, BP.y + 3.6, k) + bump(k) * 3, lerp(-20, BP.z, k)); gyaw = Math.atan2(BP.x + 70, BP.z + 20); } else { const k = (steal - 1.2) / 2.6; GP.set(lerp(BP.x, 70, easeIn(sat(k)) * 0.8 + sat(k) * 0.2), BP.y + 3.6 + sat(k) * 34, lerp(BP.z, -30, sat(k))); gyaw = 1.0; if (k > 1.2) gv = false; }
        if (steal >= 1.2) { BP.copy(GP).add(v3(0, -3.6, 0)); if (!grabbed) { grabbed = true; conf.burst(BP.clone().add(v3(0, 3, 0)), 24, SEA, 0.9, 1.1); } }
        if (steal < 1.2) grabbed = false;
      }
      thief.g.visible = thread.visible = gv;
      if (gv) { thief.g.position.copy(GP); gullPose(thief, t, f, true, gyaw); thread.position.set(GP.x, GP.y + 1.6, GP.z); thread.scale.set(1, Math.max(1, 150 - GP.y), 1); }
      basket.visible = !(steal > 3.8);
      basket.position.copy(BP);
      basket.rotation.set(steal >= 1.2 ? Math.sin(steal * 6) * 0.15 : 0, yawK, steal >= 1.2 ? Math.sin(steal * 4) * 0.2 : 0);
      gulls.forEach((G, i) => gullPose(G, t, f + i, beat > 0, G.g.rotation.y));
      gulls.forEach((G) => { G.head.rotation.y = Math.sin(t * 0.9 + G.g.position.x) * 0.3; });
      // les moules qui volent du rocher au panier
      flights = flights.filter((fl2) => {
        const k = (V.now - fl2.t0) / 0.6;
        if (k < 0) return true;
        if (k >= 1) { shown = Math.min(BN, shown + 1); return false; }
        tmp.copy(fl2.a).lerp(BP, easeInOut(k));
        tmp.y += bump(k) * 9;
        flyM.position.copy(tmp);
        flyM.rotation.set(k * 9, k * 5, 0);
        flyM.scale.setScalar(1.5 - k * 0.5);
        return true;
      });
      flyM.visible = flights.length > 0 && (V.now - flights[0].t0) >= 0;
      binM.count = Math.min(BN, shown);
      rockMus.count = rockShown();
      // gouttes
      const dt = 1 / FPS;
      DP.forEach((d) => { d.life += dt; d.v.y -= 40 * dt; d.p.addScaledVector(d.v, dt); });
      for (let i = DP.length - 1; i >= 0; i--) if (DP[i].p.y < -1 || DP[i].life > 1.6) DP.splice(i, 1);
      const m4 = new T.Matrix4(), q = new T.Quaternion();
      DP.forEach((d, i) => { m4.compose(d.p, q, v3(d.s, d.s * (1 + Math.min(1.5, Math.abs(d.v.y) * 0.04)), d.s)); drops.setMatrixAt(i, m4); });
      drops.count = DP.length;
      drops.instanceMatrix.needsUpdate = true;
      const rk = (V.now - ringT0) / 1.1;
      ring.visible = rk >= 0 && rk < 1;
      if (ring.visible) { ring.position.set(ringP.x, 0.75, ringP.z); ring.scale.setScalar(1 + rk * 6); ring.material.opacity = 1; }
    });

    return {
      update(st, first) {
        ph = Math.min(st.phrasesDone, NP);
        const want = Math.min(RM.length, Math.round(st.p * BN));
        if (want !== got) {
          if (first || want < got) { got = want; shown = Math.min(BN, want); flights = []; } else {
            for (let i = got; i < want; i++) {
              const src = RM[Math.max(0, RM.length - 1 - i)];
              flights.push({ a: src.pos.clone(), t0: V.now + 1 / FPS + (i - got) * 0.18 });
            }
            const s = RM[Math.max(0, RM.length - 1 - got)];
            splash(v3(s.pos.x + 2.5, 0.8, Math.min(s.pos.z + 1, SHORE - 1.2)), 22, 1);
            got = want;
          }
        }
        if (st.done && !done) { done = true; stealT0 = first ? V.now - 9 : V.now + 1.0; }
        if (!st.done && done) { done = false; stealT0 = null; }
      },
      react(kind) {
        if (kind === 'correct') { V.cue('happy'); }
        if (kind === 'phrase') { V.cue('happy'); pass = { t0: V.now + 0.15 }; flash = V.now; conf.burst(v3(-6, 12, 6), 10, SEA, 0.6, 1); }
        if (kind === 'complete') {
          flash = V.now;
          conf.burst(v3(KX, 10, KZ), 22, SEA, 1.0, 1.2);
          conf.rain([-36, 36, 42, -10, 16], 30, SEA);
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('beat');
      },
    };
  },
};
