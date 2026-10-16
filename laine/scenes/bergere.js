/* ============ Il était une bergère : la colline au petit matin de printemps ============
   Les moutons (de gros pompons de laine) broutent sur la colline et rentrent un à
   un dans l'enclos, d'un bond par-dessus la barrière, à mesure qu'on retrouve les
   notes. À chaque phrase (« et ron, ron, ron »), le chat se roule en ronronnant et
   le pommier fleurit un peu plus ; le soleil se réveille. À la fin, on compte les
   moutons : ils sautent la barrière l'un après l'autre. */
SCENES.bergere = {
  color: '#BFE0A8',
  view: {
    bg: '#D8ECF4', fov: 26,
    rig: { target: [3, 8, 3], az: -6, el: 20, box: [55, 42], targetWide: [2, 8.5, 1], boxWide: [96, 40] },
    post: { exposure: 1.06, bloom: 0.5, bloomThr: 0.95, aper: 6, maxBlur: 10, sat: 1.1, lift: '#1C2618', gain: '#FFF8EE', vignette: 0.32, punch: 1.24 },
  },
  sky: [-30, 18, 25, 32, -8, 4],
  home: [-11, 21, 4],
  build(V, o) {
    const PORTRAIT = !!o.portrait;
    studioLights(V, {
      key: { color: '#FFEFCF', k: 2.6, az: 44, el: 28, area: 70 },
      fill: { sky: '#B8D6F2', ground: '#6E8E52', k: 0.62 },
      rim: { color: '#FFE6C4', k: 1.7, az: -150, el: 22 },
      env: { sky: '#CFE3F2', ground: '#6E8E52', k: 0.5, boxK: 4 },
      fog: { color: '#E2EEF2', near: 220, far: 620 },
    });

    /* ---------- petits outils du décor ---------- */
    const ZA = v3(0, 0, 1);
    const lerpA = (a, b, k) => { const d = ((((b - a) + Math.PI) % TAU) + TAU) % TAU - Math.PI; return a + d * k; };
    const slim = (root, rMax = 0.9) => {
      const list = [];
      root.traverse((m) => { if (m.isMesh && !m.isInstancedMesh) list.push(m); });
      list.forEach((m) => {
        const g = m.geometry;
        if (!g.boundingSphere) g.computeBoundingSphere();
        const r = g.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z);
        if (r < rMax) m.children.filter((c) => c.userData.isFuzz).forEach((c) => m.remove(c));
        if (r < 1.1) m.castShadow = false;
      });
      return root;
    };
    const bake = (root) => {
      root.updateMatrixWorld(true);
      const inv = new T.Matrix4().copy(root.matrixWorld).invert();
      const groups = new Map(), drop = [];
      root.traverse((m) => {
        if (!m.isMesh) return;
        if (m.userData.isFuzz) { drop.push(m); return; }
        if (m.isInstancedMesh || m.userData.keep || m.material.transparent || m.material.vertexColors) return;
        const key = m.material.uuid + (m.castShadow ? '+' : '-');
        let G = groups.get(key);
        if (!G) groups.set(key, (G = { mat: m.material, cast: m.castShadow, list: [] }));
        const g = m.geometry.clone();
        g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, m.matrixWorld));
        G.list.push(g);
        drop.push(m);
      });
      drop.forEach((m) => { if (m.parent) m.parent.remove(m); });
      groups.forEach((G) => { root.add(mesh(mergeGeos(G.list), G.mat, { cast: G.cast })); G.list.forEach((g) => g.dispose()); });
      return root;
    };
    const noCast = (root) => { root.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return root; };
    const defuzz = (root) => { const l = []; root.traverse((m) => { if (m.userData.isFuzz) l.push(m); }); l.forEach((m) => m.parent.remove(m)); return root; };

    /* ---------- ciel du matin, collines, village au loin ---------- */
    const cyc = cyclo({ w: 540, h: 90, z: -96, r: 44, floor: 40, top: '#6FB0E6', mid: '#A9D6F0', bottom: '#FFE1D0', y: -2, scale: 3 });
    cyc.material.side = T.DoubleSide; // les faces de cyclo() regardent vers le fond : sans cela le drap est invisible
    V.add(cyc);
    const ground = terrain({ w: 340, d: 190, nx: 50, nz: 30, hills: [[-12, 3, 20, 3.4], [34, -42, 44, 9], [-46, -40, 40, 10], [-60, 20, 30, 5]], colors: ['#86C35E', '#7BB955'], bands: 6, rough: 0.6, scale: 1.8 });
    V.add(ground);
    const H = ground.userData.height;
    const far = flatLayer(hillShape(330, 24, 5, 12), '#A8CF84', { depth: 1, inset: 1.1, stitch: '#D2E8B4', st: { len: 1.2, gap: 0.8, r: 0.1 } });
    at(far, 0, 0, -76);
    const near = flatLayer(hillShape(300, 15, 4, 5), '#8DC266', { depth: 1, inset: 1.1, stitch: '#BFE09A', st: { len: 1.0, gap: 0.65, r: 0.1 } });
    at(near, 30, 0, -58);
    V.add(far, near);
    // le village au loin : quelques toits et un clocher découpés dans la feutrine
    const vil = new T.Group();
    const vPts = [[-22, 0], [-22, 6], [-17, 10], [-12, 6], [-12, 8], [-8, 11], [-4, 8], [-4, 6], [-1, 6], [-1, 15], [0.5, 22], [2, 15], [2, 7], [6, 10], [10, 6], [10, 0]];
    vil.add(flatLayer(polyShape(vPts), '#E9D8BE', { depth: 0.8, inset: 0.6, stitch: '#F8EEDC', st: { len: 0.6, gap: 0.4, r: 0.08 } }));
    const roofsV = flatLayer(polyShape([[-22.6, 5.6], [-17, 10.6], [-11.4, 5.6], [-12, 5.6], [-17, 10], [-22, 5.6]]), '#C86A4C', { depth: 0.9, stitch: false });
    roofsV.position.z = 0.1;
    vil.add(roofsV);
    at(vil, -64, 14, -70);
    V.add(noCast(bake(vil)));
    // arbres ronds et haies découpés dans la feutrine, sur les collines
    const ftrees = new T.Group();
    [[-46, 15, 5, '#6FA64C'], [-34, 12, 4, '#7DB356'], [6, 15, 4.5, '#6FA64C'], [52, 13, 4.2, '#86BC5E'], [64, 14, 6, '#6FA64C'], [80, 10, 4.5, '#7DB356']].forEach(([x, y, r, c]) => {
      const t = flatLayer(circleShape(r), c, { depth: 0.8, stitch: false });
      at(t, x, y + r, 0);
      const tk = flatLayer(roundRectShape(1.4, y + 2, 0.5), '#7A5A3A', { depth: 0.6, stitch: false });
      at(tk, x, (y + 2) / 2 - 1, -0.3);
      ftrees.add(t, tk);
    });
    at(ftrees, 0, 0, -66);
    V.add(noCast(bake(ftrees)));

    // le soleil du matin, encore endormi
    const sunG = new T.Group();
    sunG.add(feltPiece(circleShape(6.5), '#FFD85A', { depth: 1.6, inset: 0.7, stitch: '#F2A33A', st: { len: 0.55, gap: 0.35, r: 0.08 }, mat: { emissive: '#FFC23C', emissiveIntensity: 0.5 } }));
    const rays = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r0 = 7.6, r1 = i % 2 ? 10 : 11.4; rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.07) * (r0 + r1) / 2, Math.sin(a + 0.07) * (r0 + r1) / 2, 0.3], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.4, { radial: 6, maxSeg: 8 })); }
    sunG.add(mesh(mergeGeos(rays), wool('#FFC548', 'yarn'), { cast: false }));
    for (const s of [-1, 1]) { const c = felt(circleShape(0.8), '#F5967A', 0.12, { fuzz: false }); at(c, s * 3.6, -1.1, 0.88); sunG.add(c); }
    sunG.add(yarn([[-1.3, -2.0, 0.9], [0, -2.9, 1.0], [1.3, -2.0, 0.9]], 0.18, '#5B3A1E', { radial: 5 }));
    noCast(bake(sunG));
    const lids = new T.Group(), awake = new T.Group();
    for (const s of [-1, 1]) {
      lids.add(yarn([[s * 2.4 - 1.0, 0.9, 0.9], [s * 2.4, 0.3, 1.05], [s * 2.4 + 1.0, 0.9, 0.9]], 0.18, '#5B3A1E', { radial: 5 }));
      const e = bead(0.62, '#1C1612'); at(e, s * 2.4, 0.8, 0.95); awake.add(e);
    }
    sunG.add(noCast(lids), noCast(awake));
    awake.visible = false;
    at(sunG, 27, 30, -52);
    const sunH = hang(sunG, 160, { amp: 1.1, per: 6 });
    V.add(sunH);
    swingAnim(V, sunH);
    const halo = new T.Mesh(new T.PlaneGeometry(36, 36), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFE08A').multiplyScalar(0.3), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    at(halo, 27, 30, -57);
    V.add(halo);
    [[-6, 33, -62, 18, 6.5, 4], [-40, 28, -64, 15, 6, 9]].forEach(([x, y, z, w, h, seed]) => {
      const c = defuzz(noCast(cloud({ w, h, bumps: 4, seed, stitch: '#DCE6EE' })));
      at(c, x, y, z);
      const hc = hang(c, 160, { amp: 1.3, per: 5 + seed * 0.2 });
      V.add(hc);
      swingAnim(V, hc);
    });

    /* ---------- le pommier en fleurs ---------- */
    const TX = -25, TZ = -22, TH = 31;
    const tr = tree({ h: TH, type: 'round', color: '#6DAE4F', color2: '#86C062', crown: 10.5, puffs: 6, seed: 3, trunkCol: '#7A5236' });
    at(tr, TX, H(TX, TZ) - 0.3, TZ);
    V.add(bake(tr));
    const R = rng(29);
    const BL = [];
    const crownC = v3(TX, H(TX, TZ) + TH * 0.86, TZ);
    for (let i = 0; i < 38; i++) {
      const a = R() * TAU, e = (R() - 0.25) * 1.3, rr = 9.2 + R() * 3.8;
      const d = v3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
      if (d.z < -0.35) d.z = -d.z;
      BL.push({ p: crownC.clone().add(d.multiplyScalar(rr)).add(v3(0, -2, 0)), s: 0.8 + R() * 0.5, k: 0, on: 0, t0: -1e9, ord: hashi(i, 77) });
    }
    BL.sort((a, b) => a.ord - b.ord);
    const blIM = new T.InstancedMesh(blobGeo(0.75, 0.6, 0.75, { seg: 8, lump: 0.2, seed: 4 }), wool('#FFFFFF', 'crochet', { sheen: 0.6, sheenColor: '#FFE4EC' }), BL.length);
    BL.forEach((B, i) => blIM.setColorAt(i, col(i % 3 ? '#F7B8CB' : '#FFFFFF').multiplyScalar(0.95 + hashi(i, 3) * 0.08)));
    blIM.castShadow = true; blIM.receiveShadow = true;
    V.add(blIM);
    const m4 = new T.Matrix4(), q4 = new T.Quaternion(), s4 = v3();
    const layBlossoms = (t) => {
      BL.forEach((B, i) => {
        const k = B.on ? sat((t - B.t0) / 0.6) : 0;
        B.k = k;
        m4.compose(B.p, q4.setFromAxisAngle(ZA, i), s4.setScalar(Math.max(0.0001, easeOutBack(k, 2.4) * B.s)));
        blIM.setMatrixAt(i, m4);
      });
      blIM.instanceMatrix.needsUpdate = true;
    };

    /* ---------- l'enclos de bois ---------- */
    const PX0 = 2, PX1 = 28, PZ0 = -12, PZ1 = 4; // l'enclos ; la barrière de devant est en z = PZ1
    const pen = new T.Group();
    const wd = woodMat('#B08458'), wd2 = woodMat('#9A7048');
    const postAt = (x, z) => { const y = H(x, z); const p = mesh(latheGeo([[0.6, -1], [0.62, 7.2], [0.45, 7.8], [0.01, 8]], { seg: 8, lump: 0.05, seed: x * 3 + z }), wd); at(p, x, y, z); p.rotation.z = (hashi(x, z) - 0.5) * 0.08; pen.add(p); return v3(x, y, z); };
    const railBetween = (a, b, y) => {
      const L = Math.hypot(b.x - a.x, b.z - a.z), rl = mesh(new T.BoxGeometry(L + 0.8, 0.75, 0.45), wd2);
      rl.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + y, (a.z + b.z) / 2);
      rl.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      rl.rotation.z = Math.atan2(b.y - a.y, L) * Math.cos(rl.rotation.y);
      pen.add(rl);
    };
    const side = (x0, z0, x1, z1, n) => { const ps = []; for (let i = 0; i <= n; i++) ps.push(postAt(lerp(x0, x1, i / n), lerp(z0, z1, i / n))); for (let i = 0; i < n; i++) { railBetween(ps[i], ps[i + 1], 3.0); railBetween(ps[i], ps[i + 1], 6.2); } };
    side(PX0, PZ1, PX1, PZ1, 4);
    side(PX1, PZ1, PX1, PZ0, 3);
    side(PX1, PZ0, PX0, PZ0, 4);
    side(PX0, PZ0, PX0, PZ1, 3);
    V.add(bake(pen));
    // de la paille dans l'enclos
    V.add(scatter(yarnGeo([[-1, 0, 0], [0, 0.15, 0.1], [1, 0, 0]], 0.08, { radial: 3, maxSeg: 4 }), wool('#FFFFFF', 'yarn', { sheenColor: '#8A7A40' }), 70, (i, r) => ({ p: [lerp(PX0 + 1, PX1 - 1, r()), H(15, -4) + 0.1, lerp(PZ0 + 1, PZ1 - 1, r())], r: [0, r() * TAU, (r() - 0.5) * 0.3], s: 1.2 + r(), c: col(r() < 0.5 ? '#E8CF7A' : '#D9B85C') }), { cast: false }));

    /* ---------- fleurs de printemps, herbe, cailloux ---------- */
    const gr = grass({ n: 50, area: [-80, 70, -24, 40], height: H, colors: ['#78BE55', '#69B04C', '#93CD6A'], scale: 0.95, seed: 3 });
    gr.castShadow = false;
    V.add(gr);
    const daisyGeo = (() => {
      const pts = [];
      for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, r = 0.55 + 0.45 * Math.pow(Math.abs(Math.cos(a * 4)), 0.6); pts.push(v2(Math.cos(a) * r, Math.sin(a) * r)); }
      const pg = new T.ShapeGeometry(new T.Shape(pts));
      pg.rotateX(-Math.PI / 2);
      const cg = blobGeo(0.3, 0.2, 0.3, { seg: 8, lump: 0 });
      cg.translate(0, 0.08, 0);
      const parts = [[pg, [1, 1, 1]], [cg, [1, 0.78, 0.2]]], pos = [], nrm = [], uv = [], cs = [], idx = [];
      let ov = 0;
      for (const [g, c] of parts) {
        const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
        for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nrm.push(N.getX(i), N.getY(i), N.getZ(i)); uv.push(U.getX(i), U.getY(i)); cs.push(c[0], c[1], c[2]); }
        const I = g.index;
        for (let i = 0; i < I.count; i++) idx.push(I.getX(i) + ov);
        ov += P.count;
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setAttribute('color', new T.Float32BufferAttribute(cs, 3));
      g.setIndex(idx);
      return g;
    })();
    const daisyMat = wool('#FFFFFF', 'felt', { side: T.DoubleSide, sheen: 0.4 }).clone();
    daisyMat.vertexColors = true;
    V.add(scatter(daisyGeo, daisyMat, 80, (i, r) => {
      let x = lerp(-50, 46, r()), z = lerp(-20, 40, r());
      if (x > PX0 - 1 && x < PX1 + 1 && z > PZ0 - 1 && z < PZ1 + 1) z += 22;
      return { p: [x, H(x, z) + 0.35, z], r: [(r() - 0.5) * 0.5, r() * 3, (r() - 0.5) * 0.5], s: 0.75 + r() * 0.55, c: r() < 0.35 ? col('#FFD23A') : col('#FFFFFF') };
    }, { cast: false }));
    V.add(scatter(blobGeo(1, 0.55, 0.85, { seg: 12, lump: 0.16, seed: 6 }), wool('#FFFFFF', 'felt', { sheen: 0.4, sheenColor: '#6A665C' }), 6, (i, r) => { const P = [[-20, 16], [36, 10], [-40, 2], [-2, 24], [30, 22], [-26, -6]][i]; return { p: [P[0], H(P[0], P[1]) + 0.2, P[1]], r: [0, r() * 3, 0], s: [1.4 + r(), 1 + r() * 0.5, 1.2 + r() * 0.6], c: col('#B8B4A8').multiplyScalar(0.85 + r() * 0.2) }; }));

    // tulipes de feutrine au premier plan, sur les côtés (trois pétales cousus en coupe)
    const TUL = [];
    for (let i = 0; i < 14; i++) { const left = i % 2 === 0, x = left ? lerp(-36, -12, R()) : lerp(16, 40, R()), z = 20 + R() * 14; TUL.push([x, z, 0.85 + R() * 0.3, R()]); }
    const tulStems = [];
    TUL.forEach(([x, z, sc, rr]) => { const y = H(x, z), hh = 3 + rr * 2.2; tulStems.push(yarnGeo([[x, y, z], [x + 0.25, y + hh * 0.5, z], [x, y + hh, z]], 0.15, { radial: 5, maxSeg: 6 })); tulStems.push(applyM(feltGeo(leafShape(1.2, 3.6, 0.3), 0.12, { bevel: 0.03, bevelSeg: 1 }), { p: [x + 0.7, y + 1.5, z], r: [0, rr * 3, -0.5] })); });
    V.add(mesh(mergeGeos(tulStems), wool('#5E9E43', 'felt')));
    const tpG = feltGeo(blobShape([[0, 0], [0.55, 0.3], [0.8, 1.2], [0.6, 2.1], [0, 2.6], [-0.6, 2.1], [-0.8, 1.2], [-0.55, 0.3]], 20), 0.14, { bevel: 0.04, bevelSeg: 1 });
    const tq = new T.Quaternion(), tq2 = new T.Quaternion(), tp = v3();
    const tulIM = new T.InstancedMesh(tpG, wool('#FFFFFF', 'felt', { sheen: 0.6, sheenColor: '#FFE4EC' }), TUL.length * 4);
    TUL.forEach(([x, z, sc, rr], i) => {
      const y = H(x, z) + 3 + rr * 2.2, c = col(['#E8455A', '#F7B8CB', '#FFD23A', '#F28A3C', '#FFFFFF', '#C8385E'][i % 6]);
      for (let k = 0; k < 4; k++) {
        tq.setFromAxisAngle(v3(0, 1, 0), (k / 4) * TAU + rr * 3);
        tq2.setFromAxisAngle(v3(1, 0, 0), -0.22 - (k % 2) * 0.1);
        tq.multiply(tq2);
        tp.set(0, 0, 0.35).applyQuaternion(tq).add(v3(x, y - 0.2, z));
        m4.compose(tp, tq, s4.set(sc, sc * (1 + (k % 2) * 0.08), sc));
        tulIM.setMatrixAt(i * 4 + k, m4);
        tulIM.setColorAt(i * 4 + k, c.clone().multiplyScalar(k % 2 ? 0.92 : 1));
      }
    });
    tulIM.castShadow = true; tulIM.receiveShadow = true;
    V.add(tulIM);

    /* ---------- les moutons : de gros pompons de laine ---------- */
    const SH = [];
    const sheep = (i, fleeceCol) => {
      const g = new T.Group();
      const bodyP = new T.Group();
      bodyP.position.y = 3.3;
      g.add(bodyP);
      const r = rng(50 + i * 7), puffs = [];
      [[0, 0, 0, 2.5, 0.92, 1.2], [0, 1.0, 1.1, 1.55, 1, 1], [0, 1.05, -1.0, 1.6, 1, 1], [1.25, 0.6, 0.1, 1.45, 1, 1], [-1.25, 0.6, 0.1, 1.45, 1, 1], [0, 0.55, -2.45, 1.35, 1, 1], [0, 0.35, 2.3, 1.3, 1, 1], [0, 0.85, -3.5, 0.75, 1, 1]].forEach(([x, y, z, rr, sy, sz], k) => {
        puffs.push(applyM(blobGeo(rr, rr * sy, rr * sz, { seg: 14, lump: 0.22, seed: 3 + k + i * 11 }), { p: [x + (r() - 0.5) * 0.3, y, z] }));
      });
      const fleece = mesh(mergeGeos(puffs), wool(fleeceCol, 'crochet', { scale: 0.55, sheenColor: '#FFFFFF' }));
      fuzz(fleece, 0.42, { fiber: 0.13 });
      bodyP.add(fleece);
      // la tête de feutrine sombre, ses oreilles, ses yeux blancs
      const head = new T.Group();
      at(head, 0, 0.75, 2.75);
      bodyP.add(head);
      const hp = new T.Group();
      hp.add(mesh(blobGeo(1.05, 0.95, 1.35, { seg: 16, lump: 0.05, seed: 7 + i }), wool('#3A3333', 'felt')));
      for (const s of [-1, 1]) {
        const ear = felt(leafShape(0.8, 1.9, 0), '#3A3333', 0.25, { fuzz: false });
        at(ear, s * 1.15, 0.45, -0.1);
        ear.rotation.set(0.2, s * 0.4, s * (Math.PI / 2 + 0.45));
        hp.add(ear);
        const ein = felt(leafShape(0.45, 1.2, 0), '#C98F8A', 0.1, { fuzz: false });
        at(ein, s * 1.2, 0.47, 0.05);
        ein.rotation.copy(ear.rotation);
        hp.add(ein);
      }
      const eyes = [];
      for (const s of [-1, 1]) {
        const q = surf([1.05, 0.95, 1.35], s * 34, 16);
        const wv = felt(circleShape(0.36), '#FFFFFF', 0.1, { fuzz: false });
        faceTo(at(wv, q.p.x, q.p.y, q.p.z), q.n);
        hp.add(wv);
        const b = bead(0.2, '#121010');
        faceTo(at(b, q.p.x + q.n.x * 0.08, q.p.y + q.n.y * 0.08, q.p.z + q.n.z * 0.08), q.n);
        eyes.push(b);
      }
      const nq = surf([1.05, 0.95, 1.35], 0, -22);
      hp.add(yarn([[nq.p.x - 0.35, nq.p.y, nq.p.z], [nq.p.x, nq.p.y - 0.18, nq.p.z + 0.08], [nq.p.x + 0.35, nq.p.y, nq.p.z]], 0.07, '#C98F8A', { radial: 4 }));
      noCast(hp);
      hp.children[0].castShadow = true;
      bake(hp);
      head.add(hp);
      eyes.forEach((b) => head.add(b));
      const tuft = woolBall(0.75, fleeceCol, 'crochet', { sy: 0.7, seed: 5 + i, seg: 12, fuzz: 0.3 });
      at(tuft, 0, 0.95, 0.15);
      tuft.castShadow = false;
      head.add(tuft);
      // pattes
      const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz], k) => {
        const L = new T.Group();
        L.add(mesh(mergeGeos([applyM(blobGeo(0.4, 1.4, 0.4, { seg: 8, lump: 0.06, seed: k + i }), { p: [0, -1.3, 0] }), applyM(blobGeo(0.46, 0.3, 0.52, { seg: 8, lump: 0 }), { p: [0, -2.62, 0.08] })]), wool('#3A3333', 'felt'), { cast: false }));
        L.position.set(sx * 1.05, -0.5, sz * 1.55);
        bodyP.add(L);
        return L;
      });
      const sh = contactShadow(7.5, 9, 0.38);
      V.add(g, sh);
      V.boilable(g, 0.04, 0.5);
      return { g, bodyP, head, legs, eyes, sh, i, blink: blinker(eyes, 60 + i * 3), on: 0, t0: -1e9, hop: -1e9 };
    };
    const GRAZE = [[-27, -10, 0.6], [-3, -15, -0.4], [-25, 15, 2.6], [-6, 20, -2.2], [11, 17, 1.4], [30, 14, -1.0]];
    const SLOT = [[7, -7.6, 0.3], [15, -7.4, -0.2], [23, -7.8, 0.4], [7.5, -1.2, 0.2], [15.5, -0.9, -0.3], [23, -1.2, 0.1]];
    ['#F8F4EA', '#F3EEE2', '#FBF8F0', '#C99A6A', '#F6F1E6', '#FAF6EE'].forEach((c, i) => SH.push(sheep(i, c)));
    SH.forEach((S, i) => { S.graze = GRAZE[i]; S.slot = SLOT[i]; });

    /* ---------- la bergère, sa houlette, son tablier ---------- */
    const BX = -11, BZ = 4, BY = H(BX, BZ);
    const ber = doll({ h: 14, skin: '#F5CDB0', top: '#7FB0DE', sleeves: '#FFFFFF', dress: true, collar: '#FFFFFF', legs: '#F6F0E6', shoes: '#7A4A2A', hair: '#E2B45A', hairStyle: 'pigtails', ribbon: '#E2557A', cheeks: '#F29A8A', hat: { type: 'straw', color: '#EBCB7E', band: '#E2557A' } });
    const bR = 14 * 0.15, bL = 14 * 0.2, bB = 14 * 0.4;
    const apron = feltPiece(roundRectShape(3.4, 3.6, 1.0), '#FFFFFF', { depth: 0.25, inset: 0.3, stitch: '#E2557A', st: { len: 0.25, gap: 0.18, r: 0.04 } });
    at(apron, 0, bB * 0.34, bR * 1.5);
    apron.rotation.x = -0.36;
    ber.p.body.add(apron);
    slim(ber.g, 1.6);
    ber.p.head.rotation.order = 'YXZ';
    at(ber.g, BX, BY, BZ);
    ber.g.rotation.y = 0.55;
    V.add(ber.g);
    V.boilable(ber.g, 0.05, 0.6);
    const berSh = contactShadow(6, 6, 0.45);
    at(berSh, BX, BY + 0.15, BZ);
    V.add(berSh);
    // la houlette : un bâton de bois au bout recourbé, tenu par la main droite
    const shoulder = v3(bR * 0.92, bL + bB * 0.86, 0);
    const reach = v3(0.45, -0.62, 0.64).normalize();
    const grip = shoulder.clone().add(reach.clone().multiplyScalar(bL + 0.1));
    const crookPiv = new T.Group();
    crookPiv.position.copy(grip);
    ber.g.add(crookPiv);
    const crook = mesh(yarnGeo([[0, -grip.y + 0.2, 0], [0, 4, 0], [0, 10.5, 0], [0.15, 12.2, 0], [0.9, 13.3, 0], [2.0, 13.4, 0], [2.7, 12.6, 0], [2.5, 11.6, 0], [1.9, 11.3, 0]], 0.26, { radial: 7, maxSeg: 60 }), woodMat('#A47A4E'));
    crookPiv.add(crook);
    const armGrip = { x: Math.atan2(-reach.z, -reach.y), z: Math.asin(reach.x) };
    const blinkB = blinker(ber.p.eyes, 17);

    /* ---------- le chat, d'un petit air fripon (assis, il regarde la bergère) ---------- */
    const CX = -18.5, CZ = -3;
    const cat = critter({ size: 7.2, color: '#E8A04E', belly: '#FBEBD6', pose: 'stand', legLen: 0.1, head: 0.34, snout: 0.22, nose: '#E6828E', ears: 'point', earCol: '#E8A04E', earIn: '#F4B6BE', earH: 0.85, tail: 'thin', tailLen: 1.3, tailUp: 0.95, tailCol: '#E8A04E', eyeR: 0.17 });
    slim(cat.g, 0.9);
    const catHead = cat.p.head, hsC = cat.hs, cb = cat.br;
    // moustaches, sourire en coin, rayures de chat roux
    const marks = [];
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) marks.push(yarnGeo([[s * hsC * 0.42, -hsC * (0.2 + k * 0.1), hsC * 1.08], [s * hsC * 0.95, -hsC * (0.1 + k * 0.17), hsC * 1.02]], 0.03, { radial: 3, maxSeg: 3 }));
    catHead.add(mesh(mergeGeos(marks), wool('#FFF6E8', 'plain'), { cast: false }));
    catHead.add(mesh(yarnGeo([[-hsC * 0.22, -hsC * 0.36, hsC * 0.98], [-hsC * 0.05, -hsC * 0.44, hsC * 1.0], [hsC * 0.14, -hsC * 0.38, hsC * 1.0], [hsC * 0.3, -hsC * 0.27, hsC * 0.95]], 0.05, { radial: 4 }), wool('#6A3A22', 'plain'), { cast: false }));
    const stripes = [];
    for (let k = 0; k < 3; k++) { const y = cb[1] * (0.5 - k * 0.36); stripes.push(yarnGeo([[-cb[0] * 0.98, y, -cb[2] * 0.15], [-cb[0] * 0.62, y + 0.12, -cb[2] * 0.82], [0, y + 0.2, -cb[2] * 1.03], [cb[0] * 0.62, y + 0.12, -cb[2] * 0.82], [cb[0] * 0.98, y, -cb[2] * 0.15]], 0.15, { radial: 4, maxSeg: 14 })); }
    for (const s of [-1, 1]) stripes.push(yarnGeo([[s * hsC * 0.35, hsC * 0.72, hsC * 0.55], [s * hsC * 0.12, hsC * 0.92, hsC * 0.42]], 0.08, { radial: 4 }));
    cat.p.body.add(mesh(mergeGeos(stripes.slice(0, 3)), wool('#C77A30', 'yarn'), { cast: false }));
    catHead.add(mesh(mergeGeos(stripes.slice(3)), wool('#C77A30', 'yarn'), { cast: false }));
    cat.p.eyes.forEach((e) => { e.userData.base = e.scale.clone().multiply(v3(1, 0.6, 1)); });
    catHead.rotation.order = 'YXZ';
    const catPiv = new T.Group();
    catPiv.rotation.order = 'YXZ';
    const catCY = cat.p.body.position.y;
    catPiv.position.set(CX, H(CX, CZ) + catCY, CZ);
    cat.g.position.y = -catCY;
    catPiv.add(cat.g);
    V.add(catPiv);
    V.boilable(cat.g, 0.04, 0.5);
    const catSh = contactShadow(6.5, 6.5, 0.42);
    at(catSh, CX, H(CX, CZ) + 0.15, CZ);
    V.add(catSh);
    const blinkC = blinker(cat.p.eyes, 23);

    /* ---------- particules ---------- */
    let conf = null;
    if (!PORTRAIT) {
      pointCloud(V, { n: 60, box0: [-60, 2, -26], box1: [50, 40, 26], size: 1.1, color: '#FFF4D6', opacity: 0.45, vel: [0.25, 0.3, 0.1], wander: 2.4, beam: 0.4, keyDir: [-0.5, 0.45, 0.55] });
      pointCloud(V, { n: 60, box0: [-50, 0.6, -10], box1: [50, 1.6, 36], size: 0.7, sprite: 'spark', color: '#FFFFFF', glow: 1.5, twinkle: 1, wander: 0.2, vel: [0, 0, 0], opacity: 0.8 });
      conf = confetti(V, { kinds: ['disc', 'heart', 'star'], n: 30, size: 0.95, height: (x, z) => H(x, z) });
    }
    const PARTY = ['#F7B8CB', '#FFFFFF', '#FFD23A', '#7FB0DE', '#E2557A', '#86C35E'];
    V.onHome = (c) => { V.cue('pet'); if (conf) conf.burst(v3(BX, BY + 16, BZ), 8, [c, '#FFFFFF', '#F7B8CB'], 0.5, 0.5); };

    /* ---------- animation ---------- */
    let done = false, doneT = -1e9, woke = false;
    const LOOP = v3(15, 0, PZ1 - 3), LR = 9.5, CROSS = Math.asin(3 / 9.5), camAz = -6 * DEG;
    const sheepPos = (S, t, out) => {
      // où est le mouton ? (au pré, en chemin, dans l'enclos, ou dans la ronde des sauts)
      let x, z, ry, hy = 0, pitch = 0, walk = 0;
      const [gx, gz, gry] = S.graze, [sx, sz, sry] = S.slot;
      const a = t - S.t0;
      if (!S.on) { x = gx + Math.sin(t * 0.13 + S.i) * 0.8; z = gz + Math.cos(t * 0.11 + S.i * 2) * 0.5; ry = gry + Math.sin(t * 0.2 + S.i) * 0.3; }
      else if (a < 2.6) {
        const ox = sx, oz = PZ1 + 4.2, ix = sx, iz = PZ1 - 3.8;
        if (a < 1.5) {
          // on contourne l'enclos par devant si l'on vient de derrière
          const via = gz < PZ1 + 2 && gx < PX1 + 3 && gx > PX0 - 12;
          const wx = gx < (PX0 + PX1) / 2 ? PX0 - 3.5 : PX1 + 3.5, wz = PZ1 + 5;
          const k = easeInOut(a / 1.5);
          if (via) { const k1 = sat(k * 2), k2 = sat(k * 2 - 1); x = k < 0.5 ? lerp(gx, wx, k1) : lerp(wx, ox, k2); z = k < 0.5 ? lerp(gz, wz, k1) : lerp(wz, oz, k2); ry = k < 0.5 ? Math.atan2(wx - gx, wz - gz) : Math.atan2(ox - wx, oz - wz); }
          else { x = lerp(gx, ox, k); z = lerp(gz, oz, k); ry = Math.atan2(ox - gx, oz - gz); }
          walk = 1; if (a < 0.3) ry = lerpA(gry, ry, a / 0.3);
        }
        else if (a < 2.1) { const k = (a - 1.5) / 0.6; x = lerp(ox, ix, k); z = lerp(oz, iz, k); ry = Math.PI; hy = Math.sin(Math.PI * k) * 9.5; pitch = (k - 0.5) * 0.9; }
        else { const k = smooth((a - 2.1) / 0.5); x = lerp(ix, sx, k); z = lerp(iz, sz, k); ry = lerpA(Math.PI, sry, k); walk = 1 - k; }
      } else { x = sx; z = sz; ry = sry + Math.sin(t * 0.3 + S.i) * 0.15; }
      // à la fin : ils sautent la barrière l'un après l'autre
      if (done) {
        const k = smooth((t - doneT - 0.4) / 1.6);
        const th = (t - doneT) * 0.62 + (S.i / SH.length) * TAU;
        const lx = LOOP.x + LR * Math.cos(th), lz = LOOP.z + LR * Math.sin(th);
        const lry = Math.atan2(-Math.sin(th), Math.cos(th));
        // la boucle coupe la barrière en deux points qui ne sont pas opposés : un seul mouton saute à la fois
        const da = Math.atan2(Math.sin(th - CROSS), Math.cos(th - CROSS)), db = Math.atan2(Math.sin(th - (Math.PI - CROSS)), Math.cos(th - (Math.PI - CROSS)));
        const so = Math.abs(da) < Math.abs(db) ? da : db, dj = Math.abs(so);
        const jh = dj < 0.55 ? Math.cos((dj / 0.55) * Math.PI / 2) * 9 : 0;
        S.jh = jh * k;
        x = lerp(x, lx, k); z = lerp(z, lz, k); ry = lerpA(ry, lry, k); hy = lerp(hy, jh, k);
        pitch = lerp(pitch, dj < 0.55 ? 0.5 * (so / 0.55) : 0, k);
        walk = lerp(walk, 1, k);
      }
      out.x = x; out.z = z; out.ry = ry; out.hy = hy; out.pitch = pitch; out.walk = walk;
      return out;
    };
    const sp = {};
    V.anim((t, f) => {
      layBlossoms(t);
      awake.visible = woke; lids.visible = !woke;
      sunG.rotation.z = Math.sin(t * 0.5) * 0.05 + bump(sat(V.age('sun') / 1.0)) * 0.25 * Math.sin(V.age('sun') * 14);
      if (V.age('fete') < 0.2 && conf && !fete) { fete = true; conf.burst(v3(15, 14, 2), 40, PARTY, 1.2, 1.1); conf.burst(v3(BX, BY + 14, BZ), 14, PARTY, 0.8, 0.6); }
      // moutons
      const noteK = bump(sat(V.age('note') / 0.3));
      SH.forEach((S) => {
        S.blink(t, f);
        sheepPos(S, t, sp);
        const y = H(sp.x, sp.z);
        const hop = bump(sat((t - S.hop) / 0.45)) * 3.2;
        const trot = sp.walk * Math.abs(Math.sin(t * 9 + S.i)) * 0.5;
        S.g.position.set(sp.x, y + sp.hy + hop + trot, sp.z);
        S.g.rotation.set(sp.pitch, sp.ry, Math.sin(t * 0.7 + S.i) * 0.03);
        const air = sp.hy + hop > 0.5;
        S.legs.forEach((L, k) => { L.rotation.x = air ? (k < 2 ? -0.7 : 0.7) : sp.walk * Math.sin(t * 9 + S.i + (k % 2 ? Math.PI : 0)) * 0.5; });
        const graze = !S.on && !done ? smooth(Math.sin(t * 0.6 + S.i * 1.7) * 1.5 + 0.4) : 0;
        S.head.rotation.x = graze * 0.75 + Math.max(0, Math.sin(t * 7 + S.i)) * graze * 0.12 - noteK * 0.25 * ((S.i % 2) ? 1 : 0.4);
        S.head.rotation.y = Math.sin(t * 0.5 + S.i * 3) * 0.3 * (1 - graze);
        S.sh.position.set(sp.x, y + 0.14, sp.z);
        S.sh.rotation.z = -sp.ry;
        S.sh.scale.setScalar(1 - Math.min(0.6, (sp.hy + hop) * 0.06));
      });
      // la bergère : elle compte les moutons
      blinkB(t, f);
      const P = ber.p;
      const count = done ? SH.reduce((m, S) => Math.max(m, (S.jh || 0) / 9), 0) : 0;
      const nod = bump(sat(V.age('nod') / 0.5)) + noteK * 0.5;
      P.head.rotation.set(0.06 + nod * 0.22 + count * 0.18, Math.sin(t * 0.45) * 0.25 + (done ? 0.5 : 0), Math.sin(t * 0.8) * 0.06);
      P.body.rotation.z = Math.sin(t * 0.9) * 0.03 + noteK * 0.04;
      crookPiv.rotation.set(Math.sin(t * 0.9) * 0.04 - count * 0.25, 0, Math.sin(t * 0.7) * 0.05 - noteK * 0.08);
      P.armR.rotation.set(armGrip.x - count * 0.3, 0, armGrip.z);
      const wave = done ? bump(((t - doneT) * 0.8) % 1) : bump(sat(V.age('pet') / 0.8));
      P.armL.rotation.set(-0.35 - wave * 1.6, 0, -0.25 - wave * 0.4 * Math.sin(t * 16));
      ber.g.position.y = BY + noteK * 0.35 + (done ? Math.abs(Math.sin(t * 3.4)) * 0.6 : 0);
      // le chat : il se renverse sur le dos et se roule en ronronnant (« ron, ron, ron »)
      blinkC(t, f);
      const ra = V.age('ron');
      let lie = 0, rock = 0, purr = 0;
      if (ra < 2.1) { lie = ra < 0.35 ? smooth(ra / 0.35) : ra > 1.75 ? 1 - smooth((ra - 1.75) / 0.35) : 1; rock = ra > 0.35 && ra < 1.75 ? Math.sin((ra - 0.35) * 9) * 0.55 : 0; purr = ra > 0.3 && ra < 1.8 ? 1 : 0; }
      catPiv.rotation.set(-lie * 1.45, 0.42 + rock * 0.3, rock);
      catPiv.position.y = H(CX, CZ) + lerp(catCY, cb[2] + 0.4, lie) + (purr ? (hashi(f, 9) - 0.5) * 0.12 : 0);
      const pw = (k) => (lie > 0.5 ? Math.sin(t * 15 + k * 2) * 0.5 : 0);
      if (cat.p.arms) cat.p.arms.forEach((A, k) => { A.rotation.set(-0.45 - lie * 1.2 + pw(k), 0, (k ? -1 : 1) * 0.12); });
      cat.p.legs.forEach((L, k) => { L.rotation.set(-0.15 - lie * 1.0 + pw(k + 2), 0, (k ? 1 : -1) * 0.12); });
      const look = done ? Math.sin(t * 2.2) * 0.45 + 0.2 : 0.55 + Math.sin(t * 0.35) * 0.18;
      catHead.rotation.set(0.12 + noteK * 0.12, look * (1 - lie), Math.sin(t * 0.6) * 0.1 + 0.14);
      if (cat.p.tail) { cat.p.tail.rotation.y = Math.sin(t * (purr ? 10 : 2.2)) * 0.45 + noteK * 0.4; cat.p.tail.rotation.x = 0; }
      cat.p.eyes.forEach((e) => { if (purr) e.scale.y = e.userData.base.y * 0.12; });
    });
    let fete = true;

    return {
      update(st, first) {
        const ph = st.phrasesDone || 0, t1 = first ? -1e9 : V.now + 1 / FPS;
        const nIn = st.done ? SH.length : Math.min(SH.length, Math.round(SH.length * st.p));
        let stag = 0;
        SH.forEach((S, i) => { const on = i < nIn ? 1 : 0; if (on && (!S.on || first)) S.t0 = first ? -1e9 : t1 + 0.6 * stag++; S.on = on; });
        const nb = st.done ? BL.length : Math.round((BL.length * Math.min(ph, 5)) / 5);
        let sb = 0;
        BL.forEach((B, i) => { const on = i < nb ? 1 : 0; if (on && (!B.on || first)) B.t0 = first ? -1e9 : t1 + 0.04 * sb++; B.on = on; });
        if (ph >= 1 && !woke) { woke = true; if (!first) V.cue('sun'); }
        if (ph < 1) woke = false;
        if (st.done && (!done || first)) doneT = first ? -1e9 : t1;
        done = !!st.done;
        if (first) layBlossoms(V.now);
      },
      react(kind) {
        if (kind === 'correct') {
          V.cue('nod');
          // un mouton saute
          const cand = SH.filter((S) => V.now - S.t0 > 2.6 || !S.on);
          const S = cand[Math.floor(Math.random() * cand.length)];
          if (S) S.hop = V.now + 1 / FPS;
        }
        if (kind === 'phrase') { V.cue('ron'); V.cue('nod'); }
        if (kind === 'complete') { V.cue('fete'); fete = false; }
      },
      note(n, on) {
        if (!on) return;
        V.cue('note');
        const S = SH[n % SH.length];
        if (S && (V.now - S.t0 > 2.6 || !S.on) && !done) S.hop = V.now + 1 / FPS - 0.1;
      },
    };
  },
};
