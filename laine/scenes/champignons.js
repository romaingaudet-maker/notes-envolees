/* ============ J'ai ramassé des champignons : le sous-bois, un matin ============
   Dans la clairière moussue traversée de rais de lumière, des champignons de
   feutrine à pois (blancs, bleus, oranges ; petits, gros, grands, minces)
   sortent de terre au fil des notes retrouvées, et le panier d'osier du
   hérisson se remplit. À la fin, un champignon géant pousse et lâche ses
   spores scintillantes. */
SCENES.champignons = {
  color: '#6E8F6A',
  view: {
    bg: '#6E8F6A', fov: 26,
    rig: { target: [1, 9, 0], az: -8, el: 12, box: [50, 42], targetWide: [2, 10, 0], boxWide: [80, 36] },
    post: { exposure: 1.08, bloom: 0.6, bloomThr: 0.9, aper: 7, maxBlur: 12, sat: 1.1, lift: '#0A1008', vignette: 0.42, punch: 1.24 },
  },
  sky: [-22, 24, 22, 29, -14, -2],
  home: [6, 8, 8],
  flock: 7, birdSize: 0.85,
  build(V, o) {
    const live = !o.portrait;
    studioLights(V, {
      key: { color: '#FFDDA2', k: 2.4, az: -42, el: 38, area: 72 },
      fill: { sky: '#A9C6B0', ground: '#4A5A36', k: 0.72 },
      rim: { color: '#FFE2A8', k: 1.8, az: 155, el: 30 },
      env: { sky: '#B4CCB0', ground: '#3E4A2E', k: 0.55, boxK: 3.5 },
      fog: { color: '#B9CDB2', near: 120, far: 420 },
    });
    // la brume dorée du sous-bois
    V.add(cyclo({ w: 600, h: 260, z: -105, r: 45, floor: 40, top: '#7FA08A', mid: '#B9CCA8', bottom: '#EDE3BE', y: -2, scale: 3 }));
    const ground = terrain({ w: 420, d: 190, nx: 64, nz: 36, colors: ['#5F7F42', '#6A8A48', '#77733F'], bands: 3, rough: 1.0, scale: 1.5, bump: 1.2, hills: [[-40, -30, 18, 2.5], [36, 14, 14, 1.6], [-30, 22, 12, 1.4], [40, -40, 22, 3]] });
    V.add(ground);
    const H = ground.userData.height;
    // silhouettes de la forêt au loin
    const trunksShape = (w, n, seed, hgt) => {
      const r = rng(seed), pts = [[-w / 2, -10]];
      let x = -w / 2;
      for (let i = 0; i < n; i++) {
        const tw = 3 + r() * 4, gap = w / n;
        pts.push([x + gap * 0.3, -10], [x + gap * 0.3, hgt], [x + gap * 0.3 + tw, hgt], [x + gap * 0.3 + tw, -10]);
        x += gap;
      }
      pts.push([w / 2, -10]);
      return polyShape(pts);
    };
    const far = flatLayer(trunksShape(420, 26, 5, 120), '#8EA790', { depth: 1, inset: 0.7, stitch: false });
    at(far, 0, 0, -84);
    V.add(far);
    const mid = flatLayer(trunksShape(380, 14, 9, 120), '#728F70', { depth: 1, inset: 0.7, stitch: false });
    at(mid, 10, 0, -66);
    V.add(mid);
    const brush = flatLayer(hillShape(420, 11, 9, 4), '#5D7C4C', { depth: 1, inset: 0.9, stitch: '#86A66E' });
    at(brush, 0, 0, -56);
    V.add(brush);
    // les grands troncs tricotés, avec leur mousse
    const bark = wool('#6A4E38', 'knit', { scale: 0.9, bump: 1.4 });
    const mossM = wool('#6E9A44', 'felt', { sheen: 0.8, sheenColor: '#C8EE8A' });
    [[-33, -32, 6.5, 0], [31, -40, 7.5, 1], [-6, -54, 5.5, 2], [56, -26, 5, 3], [-56, -18, 5.5, 4]].forEach(([x, z, r, k]) => {
      const tr = mesh(latheGeo([[r * 1.7, 0], [r * 1.25, 1.5], [r * 1.05, 5], [r, 30], [r * 0.95, 140]], { seg: 22, lump: 0.06, seed: k + 2 }), bark);
      at(tr, x, H(x, z) - 0.5, z);
      tr.rotation.y = k;
      V.add(tr);
      const ms = mesh(blobGeo(r * 0.95, 2.4, r * 0.6, { seg: 16, lump: 0.25, seed: k }), mossM);
      fuzz(ms, 0.22);
      at(ms, x + Math.sin(k * 2) * r * 0.5, H(x, z) + 1.6, z + r * 0.75);
      V.add(ms);
    });
    // une souche couchée, moussue, sur la gauche
    const log = new T.Group();
    const logM = mesh(latheGeo([[3.6, -11], [3.9, -10], [4.0, 10], [3.6, 11], [0.01, 11.05]], { seg: 20, lump: 0.05, seed: 7 }), bark);
    logM.rotation.z = Math.PI / 2;
    log.add(logM);
    const rings = felt(circleShape(3.5), '#C9A27A', 0.25);
    rings.rotation.y = Math.PI / 2;
    rings.position.x = -11.08;
    log.add(rings);
    log.add(mesh(mergeGeos([1.2, 2.2, 3.0].map((r) => { const g = new T.TorusGeometry(r, 0.09, 4, 24); g.rotateY(Math.PI / 2); g.translate(-11.2, 0, 0); return g; })), wool('#8E6A48', 'plain'), { cast: false }));
    const lm = mesh(blobGeo(7, 1.6, 2.8, { seg: 16, lump: 0.25, seed: 3 }), mossM);
    fuzz(lm, 0.22);
    lm.position.set(1, 3.4, 0);
    log.add(lm);
    at(log, -36, H(-36, -12) + 3.3, -12);
    log.rotation.y = 0.5;
    V.add(log);

    // fougères de feutrine
    const fernG = [];
    const fernAt = (x, z, h, ry, lean) => {
      const y0 = H(x, z);
      for (let k = 0; k < 14; k++) {
        const t = k / 13, y = t * h, bend = t * t * lean;
        const w = 1.6 * Math.sin(Math.PI * (0.15 + 0.8 * t)) * (1 - t * 0.4) + 0.3;
        for (const s of [-1, 1]) {
          const g = feltGeo(leafShape(w * 0.7, w * 2.2, 0), 0.14, { bevel: 0, curve: 6 });
          g.translate(0, w * 1.1, 0);
          applyM(g, { r: [0, 0, -s * (1.1 - t * 0.4)] });
          applyM(g, { r: [-0.25 - bend * 0.05, ry, 0], p: [x + Math.sin(ry) * bend, y0 + y - bend * 0.3, z + Math.cos(ry) * bend] });
          fernG.push(g);
        }
      }
      const rac = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8, y = t * h, bend = t * t * lean; rac.push([x + Math.sin(ry) * bend, y0 + y - bend * 0.3, z + Math.cos(ry) * bend]); }
      fernG.push(yarnGeo(rac, 0.16, { radial: 4 }));
    };
    [[-28, 6, 13, 0.6, 5], [-25, 9, 10, -0.3, 4], [33, -2, 12, -0.7, 5], [36, 2, 9, 0.4, 3], [-40, -2, 15, 0.9, 6], [44, -8, 14, -0.9, 6]].forEach((a) => fernAt(...a));
    V.add(mesh(mergeGeos(fernG), wool('#4F8A3E', 'felt', { sheen: 0.7, sheenColor: '#B6E08A' })));
    // coussins de mousse, feuilles mortes, cailloux
    const mr = rng(19);
    V.add(scatter(blobGeo(1, 0.5, 1, { seg: 12, lump: 0.3, seed: 5 }), wool('#FFFFFF', 'felt', { sheen: 0.8, sheenColor: '#2E4A20' }), 26, () => {
      let x, z;
      do { x = (mr() - 0.5) * 110; z = -40 + mr() * 80; } while (Math.abs(x + 2) < 14 && z > -2 && z < 16);
      const s = 1.2 + mr() * 2.6;
      return { p: [x, H(x, z) + 0.1, z], r: [0, mr() * 3, 0], s: [s, s * (0.5 + mr() * 0.4), s * (0.7 + mr() * 0.5)], c: col(['#5E8A3C', '#6E9A44', '#7FA84E', '#557A36'][Math.floor(mr() * 4)]).multiplyScalar(0.85 + mr() * 0.3) };
    }));
    const fr = rng(23);
    V.add(scatter(feltGeo(leafShape(2.2, 3.6, 0.3), 0.14, { bevel: 0, curve: 6 }), wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#5A3A1A' }), 44, () => {
      const x = (fr() - 0.5) * 120, z = -36 + fr() * 84;
      return { p: [x, H(x, z) + 0.12, z], r: [-Math.PI / 2 + (fr() - 0.5) * 0.3, 0, fr() * TAU], s: 0.7 + fr() * 0.7, c: col(['#C9783A', '#D9A23A', '#A85A2E', '#B8863E', '#8E5A32'][Math.floor(fr() * 5)]) };
    }));
    V.add(grass({ n: 60, area: [-60, 60, -34, 46], height: H, colors: ['#5E8A3C', '#4F7A34', '#6E9A44'], scale: 0.9, seed: 13 }));

    // les rais de lumière qui traversent les arbres
    const beamTex = canvasTex(64, (g, s) => {
      const id = g.createImageData(s, s);
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const u = (x + 0.5) / s, v = (y + 0.5) / s; // v = 0 en haut du rai
        const a = Math.pow(Math.sin(Math.PI * u), 2.2) * (1 - smooth((v - 0.35) / 0.65)) * (0.75 + 0.25 * Math.sin(u * 19 + v * 3));
        const i = (y * s + x) * 4;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = 255;
        id.data[i + 3] = Math.round(255 * clamp(a, 0, 1));
      }
      g.putImageData(id, 0, 0);
    });
    const beams = [[-14, -6, 12, 0.48, 0.5], [2, -12, 16, 0.42, 0.55], [17, -18, 10, 0.36, 0.42], [-30, -2, 9, 0.52, 0.38]].map(([x, z, w, rot, op]) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, 56), new T.MeshBasicMaterial({ map: beamTex, color: col('#FFE2A0'), transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      // le pied du rai touche la clairière, le haut part vers la gauche, derrière les arbres
      m.position.set(x - Math.sin(rot) * 26, 26 * Math.cos(rot) + 1, z);
      m.rotation.z = rot;
      m.renderOrder = 4;
      V.add(m);
      return { m, op };
    });

    // les champignons de feutrine à pois, dans l'ordre de la chanson
    const orient = (g, p, n, s = 1) => g.applyMatrix4(new T.Matrix4().compose(p, new T.Quaternion().setFromUnitVectors(v3(0, 0, 1), n.clone().normalize()), v3(s, s, s)));
    const CAP = { w: ['#F7F3EA', '#8FB6E8'], b: ['#4F86D6', '#F7F3EA'], o: ['#F08A3C', '#FFF4E2'] };
    const stemMat = wool('#F3EAD8', 'crochet', { scale: 0.6 });
    const mkShroom = (o) => {
      const { r = 3, sh = 4, sr = 0.8, cone = 0, seed = 1, kind = 'w' } = o;
      const g = new T.Group(), body = new T.Group();
      g.add(body);
      body.add(mesh(latheGeo([[sr * 1.2, 0], [sr, sh * 0.25], [sr * 0.85, sh * 0.8], [sr * 1.05, sh], [0.01, sh + 0.1]], { seg: 14, lump: 0.05, seed }), stemMat));
      const cap = new T.Group();
      cap.position.y = sh - 0.2;
      const top = r * (0.85 + cone);
      cap.add(mesh(latheGeo([[0.01, -0.25], [r * 0.95, -0.3], [r * 1.05, 0.1], [r * 0.92, top * 0.42], [r * 0.6, top * 0.8], [0.01, top]], { seg: 22, lump: 0.04, seed }), wool(CAP[kind][0], 'felt')));
      const dots = [], dr = rng(seed * 7 + 3);
      const nd = Math.round(5 + r * 1.6);
      for (let i = 0; i < nd; i++) {
        const az = dr() * TAU, e = (15 + dr() * 55) * DEG;
        const p = v3(Math.sin(az) * Math.cos(e) * r * 1.0, Math.sin(e) * top * 0.92 + 0.1, Math.cos(az) * Math.cos(e) * r * 1.0);
        const n = v3(p.x / (r * r), (p.y - 0.1) / (top * top), p.z / (r * r));
        dots.push(orient(feltGeo(circleShape(r * (0.1 + dr() * 0.07)), 0.14, { bevel: 0, curve: 8 }), p, n));
      }
      cap.add(mesh(mergeGeos(dots), wool(CAP[kind][1], 'felt'), { cast: false }));
      body.add(cap);
      const sh2 = contactShadow(r * 2.6, r * 2.6, 0.4);
      sh2.position.y = 0.13;
      g.add(sh2);
      return { g, body, cap, sh: sh2 };
    };
    const SPOTS = [
      [-15, -4, { kind: 'w', r: 2.8, sh: 3.8 }], [11, -3, { kind: 'b', r: 3.0, sh: 4.2 }], [19, 6, { kind: 'o', r: 2.0, sh: 2.6 }],
      [-23, 3, { kind: 'w', r: 2.6, sh: 3.4 }], [2, -12, { kind: 'b', r: 4.0, sh: 5.4 }], [-11, -14, { kind: 'o', r: 3.0, sh: 4.0 }],
      [25, -7, { kind: 'w', r: 2.0, sh: 2.8 }], [16, 14, { kind: 'o', r: 2.6, sh: 3.4 }], [-27, -9, { kind: 'b', r: 2.0, sh: 2.6 }],
      [-4, -21, { kind: 'w', r: 2.2, sh: 9, sr: 0.5, cone: 0.35 }], [22, -17, { kind: 'o', r: 5.0, sh: 4.2, sr: 1.4 }], [-19, 14, { kind: 'w', r: 1.2, sh: 1.6, sr: 0.4 }],
      [9, -24, { kind: 'b', r: 1.9, sh: 8, sr: 0.45, cone: 0.4 }], [-31, 5, { kind: 'o', r: 1.1, sh: 1.5, sr: 0.38 }], [29, 4, { kind: 'b', r: 1.2, sh: 1.6, sr: 0.4 }],
      [-16, -22, { kind: 'b', r: 3.2, sh: 4.4 }],
    ];
    const shrooms = SPOTS.map(([x, z, opt], i) => {
      const s = mkShroom(Object.assign({ seed: i + 2 }, opt));
      at(s.g, x, H(x, z) - 0.2, z);
      s.g.rotation.y = (hashi(i, 3) - 0.5) * 1.2;
      s.body.rotation.z = (hashi(i, 4) - 0.5) * 0.2;
      s.g.visible = false;
      V.add(s.g);
      return Object.assign(s, { on: false, t0: -1e9, i, x, z, r: opt.r });
    });
    // le champignon géant (à la fin)
    const giant = mkShroom({ kind: 'o', r: 12, sh: 15, sr: 2.6, seed: 77 });
    const gills = [];
    for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU; gills.push(applyM(new T.BoxGeometry(0.12, 0.25, 10.4), { p: [Math.cos(a) * 6.6, -0.3, Math.sin(a) * 6.6], r: [0, -a + Math.PI / 2, 0] })); }
    giant.cap.add(mesh(mergeGeos(gills), wool('#E9D3B0', 'plain'), { cast: false }));
    const GX = 15, GZ = -28;
    at(giant.g, GX, H(GX, GZ) - 0.3, GZ);
    giant.g.visible = false;
    V.add(giant.g);
    const gMat = giant.cap.children[0].material.clone();
    gMat.emissive = col('#FF9A40'); gMat.emissiveIntensity = 0;
    giant.cap.children[0].material = gMat;

    // le panier d'osier, qui se remplit
    const basket = new T.Group();
    const bw = wool('#C99A56', 'weave', { scale: 0.7 });
    basket.add(mesh(latheGeo([[0.01, 0], [3.6, 0], [4.2, 0.6], [5.0, 3.6], [5.3, 4.6], [5.0, 4.7], [4.7, 3.8], [3.9, 0.9], [0.01, 0.8]], { seg: 28 }), bw));
    basket.add(at(mesh(new T.TorusGeometry(5.15, 0.42, 8, 32), wool('#A87A3E', 'weave', { scale: 0.5 })), 0, 4.65, 0));
    basket.children[1].rotation.x = Math.PI / 2;
    const handle = [];
    for (let k = 0; k <= 16; k++) { const a = Math.PI - (k / 16) * Math.PI; handle.push([Math.cos(a) * 4.9, 4.7 + Math.sin(a) * 6.2, 0]); }
    basket.add(mesh(yarnGeo(handle, 0.45, { radial: 7 }), wool('#A87A3E', 'weave', { scale: 0.5 })));
    const bsh = contactShadow(13, 11, 0.5);
    bsh.position.y = 0.12;
    basket.add(bsh);
    at(basket, 5, H(5, 9) - 0.1, 9);
    basket.rotation.y = 0.35;
    V.add(basket);
    // les champignons cueillis dans le panier (instances)
    const NB = 11;
    const capG = latheGeo([[0.01, -0.2], [1.0, -0.25], [1.08, 0.1], [0.9, 0.5], [0.55, 0.85], [0.01, 0.95]], { seg: 14 });
    const stG = latheGeo([[0.4, 0], [0.32, 0.8], [0.42, 1.2], [0.01, 1.25]], { seg: 10 });
    const inCap = new T.InstancedMesh(capG, wool('#FFFFFF', 'felt', { sheen: 0.6, sheenColor: '#7A6A5A' }), NB);
    const inStem = new T.InstancedMesh(stG, stemMat, NB);
    const br = rng(41), pile = [];
    const kinds = ['w', 'b', 'o'];
    for (let i = 0; i < NB; i++) {
      const a = br() * TAU, d = i < 6 ? 1.2 + br() * 2.4 : br() * 2.0;
      pile.push({ p: v3(Math.cos(a) * d, 2.6 + (i < 6 ? 0 : 1.3) + br() * 0.5, Math.sin(a) * d), r: new T.Euler((br() - 0.5) * 1.0, br() * 3, (br() - 0.5) * 1.0), s: 0.9 + br() * 0.5, c: col(CAP[kinds[i % 3]][0]) });
    }
    const mm = new T.Matrix4(), qq = new T.Quaternion(), ss = v3(), pp = v3();
    pile.forEach((P, i) => {
      qq.setFromEuler(P.r);
      ss.setScalar(P.s);
      inStem.setMatrixAt(i, mm.compose(P.p, qq, ss));
      pp.set(0, 1.1 * P.s, 0).applyQuaternion(qq).add(P.p);
      inCap.setMatrixAt(i, mm.compose(pp, qq, ss));
      inCap.setColorAt(i, P.c);
    });
    inCap.count = inStem.count = 0;
    inCap.castShadow = inStem.castShadow = true;
    basket.add(inCap, inStem);

    // le hérisson, ses piquants en brins de fil, son écharpe
    const hog = critter({ size: 9, pose: 'stand', color: '#7A5A40', belly: '#F2E2C8', headCol: '#EEDCC0', head: 0.33, snout: 0.72, snoutCol: '#F2E4CC', nose: '#1E1612', noseR: 0.16, ears: 'round', earR: 0.3, earCol: '#C9A27E', earIn: '#F2A7B5', tail: 'none', cheeks: '#F2A0A0', eyeR: 0.15, eyeY: 18, fuzz: 0.1 });
    const HP = hog.p, hb = hog.br, hhs = hog.hs;
    const spineGeo = (() => {
      const g = new T.ConeGeometry(0.24, 2.1, 5, 2);
      g.translate(0, 1.05, 0);
      const p = g.attributes.position, c = [];
      for (let i = 0; i < p.count; i++) { const k = sat(p.getY(i) / 2.1); const v = lerp(0.7, 1.6, k * k); c.push(v, v * 0.97, v * 0.9); }
      g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
      return g;
    })();
    const spineMat = wool('#FFFFFF', 'yarn', { sheen: 0.7, sheenColor: '#3A2A1A' }).clone();
    spineMat.vertexColors = true;
    const spineCols = ['#5E3E28', '#7A5236', '#6A4630', '#8E6440', '#4E3220'].map(col);
    const spines = (host, R, n, test, seed, len) => {
      const im = new T.InstancedMesh(spineGeo, spineMat, n);
      const r = rng(seed), up = v3(0, 1, 0), m4 = new T.Matrix4(), q = new T.Quaternion();
      let k = 0, guard = 0;
      while (k < n && guard++ < n * 30) {
        const az = r() * 360, el = -70 + r() * 160;
        if (!test(az, el)) continue;
        const { p, n: nn } = surf(R, az, el);
        const d = nn.clone().add(v3(0, -0.05, -0.45)).normalize();
        q.setFromUnitVectors(up, d);
        m4.compose(p.multiplyScalar(0.9), q, v3(1, len * (0.75 + r() * 0.5), 1));
        im.setMatrixAt(k, m4);
        im.setColorAt(k, spineCols[Math.floor(r() * spineCols.length)].clone().multiplyScalar(0.9 + r() * 0.25));
        k++;
      }
      im.count = k;
      im.castShadow = true;
      host.add(im);
      return im;
    };
    spines(HP.body, hb, 240, (az, el) => (az > 75 && az < 285) || el > 55, 5, 1.0);
    spines(HP.head, [hhs, hhs * 0.92, hhs * 0.95], 110, (az, el) => (az > 85 && az < 275 && el > -30) || el > 34, 7, 0.95);
    const scarf = mesh(new T.TorusGeometry(hb[0] * 0.75, 0.55, 10, 24), wool('#D9443E', 'knit', { scale: 0.4 }));
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = hb[1] * 0.82;
    fuzz(scarf, 0.08);
    HP.body.add(scarf);
    const tail1 = woolBall(0.6, '#D9443E', 'knit', { sx: 0.8, sy: 2.2, sz: 0.45, fuzz: 0.08, seg: 12, mat: { scale: 0.4 } });
    tail1.position.set(hb[0] * 0.5, hb[1] * 0.45, hb[2] * 0.85);
    tail1.rotation.z = 0.25;
    HP.body.add(tail1);
    // un petit champignon blanc dans la patte
    const held = mkShroom({ kind: 'w', r: 1.15, sh: 1.6, sr: 0.38, seed: 99 });
    held.sh.visible = false;
    held.g.rotation.x = 0.9;
    at(held.g, 0, -HP.arms[1].userData.len - 0.5, 0.4);
    HP.arms[1].add(held.g);
    const hogRoot = new T.Group();
    hogRoot.add(hog.g);
    at(hogRoot, -6, H(-6, 6), 6);
    hogRoot.rotation.y = 0.8;
    V.add(hogRoot);
    V.boilable(hog.g, 0.05, 0.6);
    const hsh = contactShadow(9, 7, 0.5);
    at(hsh, -6, H(-6, 6) + 0.12, 6);
    V.add(hsh);
    const blink = blinker(HP.eyes, 12);
    const hY0 = HP.body.position.y;

    // particules : poussières dans les rais, spores du géant, confettis
    let spores = null, conf = null;
    if (live) {
      pointCloud(V, { n: 90, box0: [-40, 2, -30], box1: [44, 50, 20], size: 0.9, color: '#FFF0C8', opacity: 0.55, vel: [0.25, 0.2, 0.1], beam: 0.85, keyDir: [-0.5, 0.62, 0.6] });
      spores = pointCloud(V, { n: 70, box0: [GX - 16, 6, GZ - 10], box1: [GX + 16, 42, GZ + 12], size: 1.5, sprite: 'spark', color: '#FFE7A0', glow: 1.8, opacity: 0.95, vel: [0.3, 2.2, 0.2], wander: 2.5, twinkle: 1, seed: 6 });
      spores.obj.geometry.setDrawRange(0, 0);
      conf = confetti(V, { kinds: ['disc', 'leaf', 'star'], n: 44, size: 0.85, height: H });
    }
    V.onHome = (c) => { if (conf) conf.burst(v3(5, 9, 9), 5, [c, '#FFFFFF'], 0.4, 0.5); };

    // l'histoire
    let done = false, nOn = 0, nBasket = 0, P = 0, gk = 0, lastT = null;
    const later = [];
    const after = (dt, fn) => later.push([V.now + dt, fn]);
    V.anim((t, f) => {
      while (later.length && later[0][0] <= V.now) later.shift()[1]();
      const dt = lastT == null ? 0 : clamp(t - lastT, 0, 0.5);
      lastT = t;
      blink(t, f);
      const ad = done ? V.age('done') : -1;
      // les champignons sortent de terre et sautillent sur les notes
      shrooms.forEach((s) => {
        if (!s.on) { s.g.visible = false; return; }
        s.g.visible = true;
        const k = sat((V.now - s.t0) / 0.6);
        const nb = V.age('sh' + s.i), b = nb < 0.35 ? bump(nb / 0.35) : 0;
        const party = done ? Math.max(0, Math.sin(t * 6 + s.i * 0.8)) * 0.6 : 0;
        const sc = Math.max(0.001, easeOutBack(k, 2));
        s.g.scale.set(sc * (1 + b * 0.12 + party * 0.08), sc * (1 - b * 0.15 + party * 0.1), sc * (1 + b * 0.12 + party * 0.08));
        s.body.position.y = -(1 - k) * 2;
        s.cap.rotation.x = Math.sin(t * 1.3 + s.i) * 0.03 + b * 0.1;
      });
      // le géant pousse
      const gT = done ? (ad < 1e5 ? sat((ad - 0.6) / 2.6) : 1) : 0;
      gk += (gT - gk) * (1 - Math.exp(-dt * 6));
      if (gT === 1 && ad >= 1e5) gk = 1;
      giant.g.visible = gk > 0.002;
      const gw = done && ad < 1e5 ? Math.sin(ad * 9) * 0.1 * (1 - gk) : 0;
      giant.g.scale.set(easeOutBack(gk, 1.6) * (1 + gw), Math.max(0.001, easeOutBack(gk, 1.6) * (1 - gw)), easeOutBack(gk, 1.6) * (1 + gw));
      giant.cap.rotation.z = Math.sin(t * 0.9) * 0.03;
      gMat.emissiveIntensity = gk * (0.25 + 0.1 * Math.sin(t * 2.3));
      if (spores) spores.obj.geometry.setDrawRange(0, Math.round(70 * gk));
      // le panier
      inCap.count = inStem.count = nBasket;
      basket.scale.setScalar(1 + bump(sat(V.age('bk') / 0.35)) * 0.06);
      // le hérisson
      const hop = V.age('hop'), hk = hop < 0.5 ? sat(hop / 0.5) : 1;
      const nod = V.age('nod'), nk = nod < 0.3 ? bump(nod / 0.3) : 0;
      let y = 0, sq = 0, arm = 0, spin = 0;
      if (hk < 1) { y = bump(hk) * 4; sq = hk < 0.15 ? -bump(hk / 0.15) : (hk > 0.85 ? -bump((hk - 0.85) / 0.15) : 0.5 * bump(hk)); arm = bump(hk); }
      if (done) {
        const b = ad < 1e5 ? ad : t;
        y = Math.abs(Math.sin(b * Math.PI * 1.8)) * 3.2;
        arm = 0.7 + 0.3 * Math.sin(b * 7);
        spin = ad < 1e5 && ad < 1.2 ? easeInOut(ad / 1.2) * TAU : 0;
      }
      hogRoot.position.y = H(-6, 6) + y;
      hogRoot.rotation.y = 0.8 + spin + (done ? Math.sin(t * 1.1) * 0.3 : 0);
      HP.body.position.y = hY0 + Math.sin(t * 2.1) * 0.05 - sq * 0.4;
      HP.body.scale.set(1 - sq * 0.08, 1 + sq * 0.1, 1 - sq * 0.08);
      HP.head.rotation.set(-0.05 + nk * 0.25, Math.sin(t * 0.6) * 0.2 - 0.45, Math.sin(t * 0.8) * 0.06);
      HP.arms[0].rotation.set(-0.4 - arm * 2.0, 0, -0.3 - arm * 0.4);
      HP.arms[1].rotation.set(-0.9 - arm * 1.5 + Math.sin(t * 1.4) * 0.05, 0, 0.3 + arm * 0.3);
      hsh.material.opacity = 0.5 * clamp(1 - y / 8, 0.3, 1);
      // les rais de lumière respirent
      beams.forEach((b, i) => { b.m.material.opacity = b.op * (0.85 + 0.15 * Math.sin(t * 0.7 + i * 1.9)) * (1 + gk * 0.3); });
    });

    return {
      update(st, first) {
        P = st.p;
        const n = st.done ? shrooms.length : Math.min(shrooms.length, Math.floor(st.p * (shrooms.length + 1) + 1e-6));
        shrooms.forEach((s) => { const on = s.i < n; if (on && !s.on) s.t0 = first ? -1e9 : V.now + 1 / FPS + s.i % 2 * 0.1; s.on = on; });
        nOn = n;
        nBasket = st.done ? NB : Math.min(NB, Math.round(NB * st.p));
        if (st.done && !done) { done = true; if (first) { V.cues.done = -1e6; gk = 1; } else V.cue('done'); }
        if (!st.done && done) { done = false; }
      },
      react(kind, st) {
        if (kind === 'correct' || kind === 'phrase') { V.cue('hop'); V.cue('bk', 0.2); }
        if (kind === 'phrase' && conf) {
          const s = shrooms[Math.max(0, nOn - 1)];
          conf.burst(v3(s.x, H(s.x, s.z) + 6, s.z), 12, ['#F7F3EA', '#4F86D6', '#F08A3C', '#FFE07A'], 0.55, 0.6);
        }
        if (kind === 'complete' && conf) {
          conf.burst(v3(-6, 12, 6), 24, ['#F7F3EA', '#4F86D6', '#F08A3C', '#FFE07A', '#7FA84E'], 1.0, 1.1);
          after(2.2, () => { if (done) conf.burst(v3(GX, 30, GZ + 4), 34, ['#F08A3C', '#FFF4E2', '#FFE07A', '#4F86D6'], 1.0, 1.6); });
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('nod');
        const vis = shrooms.filter((s) => s.on);
        if (vis.length) V.cue('sh' + vis[n % vis.length].i);
      },
    };
  },
};
