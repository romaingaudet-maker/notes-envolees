/* ============ Une poule sur un mur : la basse-cour, un matin ensoleillé ============
   La poule blanche picore son pain dur sur le muret de pierres feutrées :
   à chaque note retrouvée, une miette de moins et un poussin-pompon de plus.
   À chaque phrase, elle lève la queue et bat des ailes ; à la fin, elle
   saute du mur et fait son petit tour, ses poussins à la queue leu leu. */
SCENES.poule = {
  color: '#A9DCF2',
  view: {
    bg: '#A9DCF2', fov: 26,
    rig: { target: [0, 14.5, 2], az: 12, el: 7, box: [46, 42], targetWide: [3, 13.5, 2], boxWide: [74, 34] },
    post: { exposure: 1.0, bloom: 0.42, bloomThr: 1.0, aper: 6.5, maxBlur: 11, sat: 1.08, lift: '#120E08', vignette: 0.36, punch: 1.22 },
  },
  sky: [-22, 28, 23.5, 30, -14, 0],
  home: [-4, 22, -1.5],
  flock: 7, birdSize: 0.85,
  build(V, o) {
    const live = !o.portrait;
    const L = studioLights(V, {
      key: { color: '#FFDDA6', k: 2.6, az: 50, el: 32, area: 72 },
      fill: { sky: '#C4E3F7', ground: '#8C9C58', k: 0.72 },
      rim: { color: '#FFF0CF', k: 1.6, az: -145, el: 22 },
      env: { sky: '#C4E3F7', ground: '#6C7A40', k: 0.5, boxK: 4 },
      fog: { color: '#D4EAF3', near: 140, far: 480 },
    });

    // le ciel du matin : un drap de feutrine, bleu en haut, doré à l'horizon
    V.add(cyclo({ w: 620, h: 280, z: -115, r: 45, floor: 40, top: '#5FA9DE', mid: '#A9D6F0', bottom: '#F6E6C6', y: -2, scale: 3 }));
    // le pré : jersey vert à rayures
    const ground = terrain({ w: 440, d: 200, nx: 60, nz: 34, colors: ['#98CB69', '#8AC05E'], bands: 5, rough: 0.5, scale: 1.7, hills: [[-100, -62, 45, 6], [100, -68, 55, 8]] });
    V.add(ground);
    const H = ground.userData.height;

    // collines de feutrine cousue, et leurs petits arbres-sucettes
    const far = flatLayer(hillShape(540, 30, 5, 7), '#B3D59A', { depth: 1, inset: 1.1, stitch: '#DCEDC9' });
    at(far, 0, 0, -80);
    V.add(far);
    const crowns = [], trunks = [];
    const tr = rng(8);
    [-150, -118, -92, -64, 70, 96, 124, 152].forEach((x) => {
      const r = 3 + tr() * 2.4, h = 19 + tr() * 9;
      crowns.push(applyM(feltGeo(circleShape(r), 0.9), { p: [x, h, 0] }));
      trunks.push(applyM(new T.BoxGeometry(0.9, h, 0.5), { p: [x, h / 2 - 3, -0.3] }));
    });
    const ft = grp(mesh(mergeGeos(crowns), wool('#6CAA52', 'felt'), { cast: false }), mesh(mergeGeos(trunks), wool('#8A6545', 'felt'), { cast: false }));
    at(ft, 0, 0, -72);
    V.add(ft);
    const mid = flatLayer(hillShape(480, 19, 4, 12), '#A3CC6C', { depth: 1, inset: 1.1, stitch: '#D0E6A8' });
    at(mid, 30, 0, -63);
    V.add(mid);

    // le soleil de feutrine, pendu à son fil, et son halo
    const sunG = new T.Group();
    const sR = 6.4;
    const disc = feltPiece(circleShape(sR), '#FFC83A', { depth: 1.8, inset: 0.8, stitch: '#F2902A', st: { len: 0.6, gap: 0.4, r: 0.09 }, fuzz: 0.08 });
    const sm = disc.userData.body.material.clone();
    sm.emissive = col('#FFB224'); sm.emissiveIntensity = 0.45;
    disc.userData.body.material = sm;
    sunG.add(disc);
    const rays = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU, r0 = sR * 1.12, r1 = sR * (i % 2 ? 1.5 : 1.74);
      rays.push(yarnGeo([[Math.cos(a) * r0, Math.sin(a) * r0, 0], [Math.cos(a + 0.07) * (r0 + r1) / 2, Math.sin(a + 0.07) * (r0 + r1) / 2, 0.3], [Math.cos(a) * r1, Math.sin(a) * r1, 0]], 0.42, { radial: 6 }));
    }
    const rayM = mesh(mergeGeos(rays), wool('#FFAE2A', 'yarn'));
    sunG.add(rayM);
    addFace(sunG, sR * 0.95, { z: 1.0, cheeks: '#F27A54' });
    sunG.traverse((m) => { m.castShadow = false; });
    at(sunG, 8, 30, -46);
    const hs = hang(sunG, 170, { amp: 1.1, per: 5.5, r: 0.1 });
    V.add(hs);
    swingAnim(V, hs);
    const halo = new T.Mesh(new T.PlaneGeometry(46, 46), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FFD27A').multiplyScalar(0.5), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    at(halo, 8, 30, -50);
    V.add(halo);
    const haloC = col('#FFD27A');
    // nuages de feutrine suspendus
    [[-26, 32, -52, 22, 8, 3, 4.6], [2, 37, -66, 19, 7, 5, 6.1], [38, 34, -60, 15, 6, 2, 5.2]].forEach(([x, y, z, w, h, seed, per]) => {
      const c = cloud({ w, h, bumps: 4, seed, stitch: '#CBDDEB' });
      c.traverse((m) => { m.castShadow = false; });
      at(c, x, y, z);
      const hc = hang(c, 175, { amp: 1.3, per, r: 0.1 });
      V.add(hc);
      swingAnim(V, hc);
    });

    // la grange rouge
    const barn = new T.Group();
    at(barn, -40, 0, -40);
    barn.rotation.y = 0.3;
    V.add(barn);
    const bw = 30, bh = 19, bd = 20, gb = 11, red = '#C4463B';
    barn.add(wallPanel(bw, bh, [[0, bh + 1.4, 6.5, 6.4]], { color: red, depth: 2.4, gable: gb, scale: 0.75, bump: 1.2 }));
    const loftBack = mesh(new T.PlaneGeometry(7.2, 7.2), wool('#2C1A10', 'felt'), { cast: false });
    at(loftBack, 0, bh + 4.6, -1.3);
    barn.add(loftBack);
    for (const s of [-1, 1]) {
      const side = mesh(new T.BoxGeometry(2.4, bh, bd), wool(red, 'knit', { scale: 0.75 }));
      scaleUV(side.geometry, bd, bh);
      at(side, s * (bw / 2 - 1.2), bh / 2, -bd / 2);
      barn.add(side);
      const pan = mesh(new T.BoxGeometry(Math.hypot(bw / 2, gb) + 3.2, 1.6, bd + 3), wool('#6E4636', 'knit', { scale: 0.7 }));
      scaleUV(pan.geometry, 22, bd + 3);
      pan.position.set(s * (bw / 4 + 0.47), bh + gb / 2 + 0.65, -bd / 2 + 0.4);
      pan.rotation.z = -s * Math.atan2(gb, bw / 2);
      barn.add(pan);
      const leaf = feltPiece(roundRectShape(6.3, 13, 0.5), '#9E382E', { depth: 0.7, inset: 0.45, stitch: '#F3E7D2', st: { len: 0.45, gap: 0.3, r: 0.06 } });
      at(leaf, s * 3.3, 6.7, 1.5);
      barn.add(leaf);
    }
    const trimG = [];
    const Y = (pts, r) => trimG.push(yarnGeo(pts, r, { radial: 6 }));
    for (const s of [-1, 1]) {
      Y([[s * 0.55, 0.7, 1.95], [s * 6.1, 12.7, 1.95]], 0.26);
      Y([[s * 6.1, 0.7, 1.95], [s * 0.55, 12.7, 1.95]], 0.26);
      Y([[s * 6.9, 0, 1.6], [s * 6.9, 13.7, 1.6]], 0.36);
      Y([[s * (bw / 2 - 0.4), 0, 1.35], [s * (bw / 2 - 0.4), bh, 1.35]], 0.36);
    }
    Y([[-6.9, 13.7, 1.6], [6.9, 13.7, 1.6]], 0.36);
    Y([[-bw / 2, bh - 0.2, 1.35], [bw / 2, bh - 0.2, 1.35]], 0.34);
    Y([[-3.6, bh + 1.1, 1.4], [3.6, bh + 1.1, 1.4]], 0.3);
    barn.add(mesh(mergeGeos(trimG), wool('#F4EEE2', 'yarn')));
    // du foin qui dépasse du grenier
    const hayG = [];
    const hr = rng(41);
    for (let i = 0; i < 9; i++) { const x = -2.6 + i * 0.65; hayG.push(yarnGeo([[x, bh + 1.6, -0.6], [x + (hr() - 0.5) * 1.4, bh + 1.6 + hr() * 0.6, 1.0], [x + (hr() - 0.5) * 2.4, bh + 0.8 + hr() * 1.2, 2.2 + hr()]], 0.13, { radial: 4 })); }
    barn.add(mesh(mergeGeos(hayG), wool('#E9C35A', 'yarn'), { cast: false }));
    // la girouette (un coq de cuivre)
    const vane = new T.Group();
    vane.add(mesh(new T.CylinderGeometry(0.16, 0.16, 7, 6), metalMat('#6F6152', { rough: 0.5 })));
    const copper = metalMat('#C07A36', { rough: 0.36 });
    const cock = mesh(feltGeo(polyShape([[-2.6, 0], [2.0, 0], [2.4, 0.6], [2.1, 1.4], [2.6, 2.4], [3.3, 2.5], [2.8, 2.8], [2.6, 3.4], [2.2, 3.1], [1.9, 3.5], [1.5, 3.0], [1.4, 2.0], [0.4, 1.5], [-1.2, 1.6], [-2.2, 3.4], [-2.8, 3.0], [-2.6, 1.8], [-3.1, 1.2]]), 0.25, { bevel: 0.05 }), copper);
    cock.position.y = 3.4;
    vane.add(cock);
    vane.add(at(mesh(new T.BoxGeometry(6, 0.22, 0.22), copper), 0, 2.4, 0));
    at(vane, 0, bh + gb + 1.6, -bd / 2);
    barn.add(vane);
    // une botte de foin roulée
    const bale = new T.Group();
    const baleM = mesh(latheGeo([[0.01, -4.2], [5.0, -4.2], [5.7, -3.6], [5.9, 0], [5.7, 3.6], [5.0, 4.2], [0.01, 4.2]], { seg: 28, lump: 0.03 }), wool('#E0B65A', 'weave', { scale: 1.4 }));
    baleM.rotation.z = Math.PI / 2;
    bale.add(baleM);
    const spir = [];
    for (let i = 0; i <= 110; i++) { const a = (i / 110) * TAU * 3.2, r = 0.4 + (i / 110) * 4.9; spir.push([4.28, Math.cos(a) * r, Math.sin(a) * r]); }
    bale.add(yarn(spir, 0.14, '#B98838', { radial: 5 }));
    at(bale, -34, 5.9, 9);
    bale.rotation.y = -1.0;
    V.add(bale);

    // l'arbre et la clôture de bois, derrière
    const tree1 = tree({ h: 36, type: 'round', color: '#5E9F47', color2: '#7CB957', trunkCol: '#7A5236', crown: 12, puffs: 6, seed: 5 });
    at(tree1, 58, 0, -54);
    V.add(tree1);
    const postGeo = latheGeo([[0.65, 0], [0.62, 8.6], [0.25, 9.4]], { seg: 8 });
    const FX = (i) => 33 + i * 7.2;
    V.add(scatter(postGeo, woodMat('#D8BE96'), 12, (i, r) => ({ p: [FX(i), 0, -16 + (r() - 0.5) * 0.6], r: [0, r() * 3, (r() - 0.5) * 0.08], s: [1, 0.9 + r() * 0.2, 1] })));
    for (const y of [3.6, 7.4]) {
      const pts = [];
      for (let i = 0; i < 12; i++) { pts.push([FX(i), y, -15.3]); if (i < 11) pts.push([FX(i) + 3.6, y - 0.7, -15.2]); }
      V.add(yarn(pts, 0.3, '#B98B5A', { radial: 6 }));
    }

    // le muret de pierres de laine feutrée
    const WX0 = -86, WX1 = 30, WH = 12, WZ = 6, WALLTOP = WH + 0.8;
    const core = mesh(new T.BoxGeometry(WX1 - WX0 - 1, WH - 0.4, WZ * 2 - 1.6), wool('#A69C8B', 'knit', { scale: 0.5 }));
    scaleUV(core.geometry, WX1 - WX0, WH);
    at(core, (WX0 + WX1) / 2 - 0.5, (WH - 0.4) / 2, 0);
    V.add(core);
    const SP = [];
    const rs = rng(17);
    const greys = ['#B5AA98', '#C3B7A2', '#A39C90', '#CDBFA6', '#9A938A', '#BFA98C', '#A8A9A6', '#C9B39A', '#9E9A8F'].map(col);
    const stc = () => greys[Math.floor(rs() * greys.length)].clone().multiplyScalar(0.9 + rs() * 0.16);
    for (let row = 0; row < 3; row++) {
      let x = WX0 + (row % 2 ? 2.8 : 0);
      const y = 2.0 + row * 3.75;
      while (x < WX1 - 1.2) {
        let w = 4.6 + rs() * 3.4;
        if (x + w > WX1) w = WX1 - x;
        SP.push({ p: [x + w / 2, y + (rs() - 0.5) * 0.3, WZ - 1.1], r: [(rs() - 0.5) * 0.15, (rs() - 0.5) * 0.3, (rs() - 0.5) * 0.12], s: [w / 2 - 0.15, 1.75 + rs() * 0.3, 1.25 + rs() * 0.35], c: stc() });
        x += w + 0.3;
      }
    }
    for (const zz of [-WZ * 0.46, WZ * 0.46]) {
      let x = WX0;
      while (x < WX1 - 1) {
        let w = 5 + rs() * 3.2;
        if (x + w > WX1 + 0.6) w = WX1 + 0.6 - x;
        SP.push({ p: [x + w / 2, WH - 0.15, zz], r: [(rs() - 0.5) * 0.1, (rs() - 0.5) * 0.3, (rs() - 0.5) * 0.08], s: [w / 2, 0.95 + rs() * 0.2, WZ * 0.52 + rs() * 0.3], c: stc() });
        x += w + 0.25;
      }
    }
    for (let row = 0; row < 3; row++) for (const zz of [-WZ * 0.5, WZ * 0.5]) SP.push({ p: [WX1 - 0.3, 2 + row * 3.75, zz + (row % 2) * 0.8 - 0.4], r: [0, rs() * 0.3, 0], s: [1.3, 1.75 + rs() * 0.3, WZ * 0.5 - 0.2], c: stc() });
    V.add(scatter(blobGeo(1, 1, 1, { seg: 12, lump: 0.2, seed: 5 }), wool('#FFFFFF', 'felt', { sheen: 0.55, sheenColor: '#4C4741', bump: 1.4 }), SP.length, (i) => SP[i]));
    // mousse dans les joints
    const mr = rng(29);
    V.add(scatter(blobGeo(1, 0.5, 1, { seg: 10, lump: 0.3, seed: 2 }), wool('#FFFFFF', 'felt', { sheen: 0.7, sheenColor: '#2E4A20' }), 16, (i) => {
      const top = i < 7;
      const x = top ? lerp(-60, 26, mr()) : lerp(-60, 26, mr());
      return top ? { p: [x, WALLTOP - 0.1, (mr() - 0.5) * WZ * 1.4], s: [1 + mr() * 1.4, 0.6, 0.8 + mr()], c: col('#6E9E44').multiplyScalar(0.85 + mr() * 0.3) }
        : { p: [x, 3.8 + Math.floor(mr() * 2) * 3.75, WZ - 0.1], r: [Math.PI / 2, 0, 0], s: [0.8 + mr(), 0.5, 0.4 + mr() * 0.3], c: col('#6E9E44').multiplyScalar(0.8 + mr() * 0.3) };
    }));

    // le pain dur et ses miettes
    const bread = new T.Group();
    at(bread, 5.6, WALLTOP + 1.45, 1.8);
    bread.rotation.y = -0.55;
    V.add(bread);
    const crustGeo = blobGeo(2.7, 1.6, 1.85, { seg: 18, lump: 0.08, seed: 9 });
    const cp = crustGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) if (cp.getX(i) < -1.9) cp.setX(i, -1.9);
    crustGeo.computeVertexNormals();
    bread.add(mesh(crustGeo, wool('#C4823F', 'felt', { sheen: 0.7, sheenColor: '#F2C27A' })));
    const cut = felt(ellipseShape(1.42, 1.2), '#EFD7A4', 0.3);
    cut.rotation.y = -Math.PI / 2;
    at(cut, -1.95, 0.05, 0);
    bread.add(cut);
    bread.add(mesh(mergeGeos([-0.9, 0.1, 1.1].map((x) => yarnGeo([[x - 0.5, 1.15, -1.2], [x, 1.62, 0], [x + 0.5, 1.15, 1.2]], 0.12, { radial: 4 }))), wool('#8E5524', 'yarn'), { cast: false }));
    const bsh = contactShadow(7, 5, 0.4);
    at(bsh, 5.6, WALLTOP + 0.06, 1.8);
    V.add(bsh);
    const CR = [];
    const rc = rng(23);
    const crumbCols = ['#EBD29E', '#E2C084', '#D4A25D', '#F0DDB2'].map(col);
    const PECK = v3(0.4, 0, 2.6);
    for (let i = 0; i < 18; i++) {
      const near = i < 12;
      const x = near ? lerp(-3.2, 3.8, rc()) : lerp(3.0, 9.5, rc());
      const z = near ? lerp(1.4, 5.3, rc()) : lerp(3.4, 5.4, rc());
      CR.push({ p: [x, WALLTOP + 0.3, z], r: [rc() * 3, rc() * 3, rc() * 3], s: 0.45 + rc() * 0.4, c: crumbCols[i % 4], d: Math.hypot(x - PECK.x, z - PECK.z) });
    }
    CR.sort((a, b) => b.d - a.d);
    const crumbs = scatter(blobGeo(1, 0.62, 0.85, { seg: 8, lump: 0.35, seed: 4 }), wool('#FFFFFF', 'felt', { sheen: 0.6, sheenColor: '#5E4426' }), CR.length, (i) => CR[i]);
    V.add(crumbs);

    // l'herbe et les fleurs du pré
    V.add(grass({ n: 120, area: [-70, 70, -34, 56], height: H, colors: ['#6DB85A', '#5AA64C', '#86C86B'], scale: 1.1, seed: 6 }));
    const petals = (n, rx, ry, rad) => { const g = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; g.push(applyM(feltGeo(ellipseShape(rx, ry), 0.16, { bevel: 0, curve: 6 }), { p: [Math.cos(a) * rad, Math.sin(a) * rad, 0], r: [0, 0, a - Math.PI / 2] })); } return mergeGeos(g); };
    const daisyG = petals(9, 0.42, 1.05, 1.15), poppyG = petals(5, 1.0, 1.1, 0.95);
    const flowerAt = (x, z, s, geo, pc, cc, stemH, tilt) => {
      const g = new T.Group();
      g.add(yarn([[0, 0, 0], [0.3, stemH * 0.5, 0.1], [0, stemH, 0]], 0.16, '#4E9B4A', { radial: 5 }));
      const head = new T.Group();
      head.position.y = stemH;
      head.rotation.x = -tilt;
      head.add(mesh(geo, wool(pc, 'felt')));
      const c = woolBall(0.6, cc, 'crochet', { sz: 0.55, fuzz: false, seg: 12 });
      c.position.z = 0.15;
      head.add(c);
      g.add(head);
      at(g, x, H(x, z), z);
      g.scale.setScalar(s);
      g.rotation.y = (hashi(x * 7, z * 3) - 0.5) * 0.6;
      V.add(g);
      return g;
    };
    const flowers = [
      flowerAt(-31, 30, 1.0, daisyG, '#FFFFFF', '#F5C32C', 5, 0.5), flowerAt(-15, 36, 1.15, poppyG, '#E5484D', '#2A1A14', 6, 0.55),
      flowerAt(17, 31, 1.0, daisyG, '#FFFFFF', '#F5C32C', 4.5, 0.6), flowerAt(33, 26, 1.1, poppyG, '#E5484D', '#2A1A14', 5.5, 0.5),
      flowerAt(-22, 8.4, 0.85, daisyG, '#FFFFFF', '#F5C32C', 3.6, 0.35), flowerAt(26, 9.5, 0.9, daisyG, '#FFFFFF', '#F5C32C', 4, 0.4),
      flowerAt(-41, 18, 0.95, daisyG, '#FFFFFF', '#F5C32C', 5, 0.45), flowerAt(41, 16, 1.0, poppyG, '#F2803C', '#2A1A14', 5, 0.5),
    ];
    // quelques cailloux feutrés au premier plan
    const pebR = rng(9);
    V.add(scatter(blobGeo(1, 0.6, 0.9, { seg: 10, lump: 0.2, seed: 7 }), wool('#FFFFFF', 'felt', { sheen: 0.5, sheenColor: '#4C4741' }), 9, (i) => {
      const x = lerp(-44, 44, pebR()), z = 20 + pebR() * 26;
      return { p: [x, H(x, z) + 0.2, z], r: [0, pebR() * 3, 0], s: 0.8 + pebR() * 1.2, c: greys[i % greys.length] };
    }));

    // la poule blanche, au crochet
    const hen = bird({ r: 4.4, color: '#F8F3EA', belly: '#FFFDF7', comb: '#E2362F', beak: '#F7B52C', beakL: 0.55, wing: '#EEE6D7', wingStitch: '#C9BCA6', tail: 'none', head: 0.56, headY: 0.92, headZ: 0.6, legCol: '#F0A238', legH: 0.5, eyeR: 0.15, cheeks: '#F7A1A1', bw: 0.86, bh: 0.84, bl: 1.1, fuzz: 0.16 });
    const HP = hen.p, bodyY0 = HP.body.position.y;
    const henRoot = new T.Group(), henTilt = new T.Group();
    henRoot.add(henTilt);
    henTilt.add(hen.g);
    V.add(henRoot);
    hen.g.scale.setScalar(1.05);
    V.boilable(hen.g, 0.05, 0.6);
    // sa queue : un éventail de plumes de feutrine
    const tail = new T.Group();
    at(tail, 0, 1.3, -4.2);
    HP.body.add(tail);
    const fCols = ['#F7F2E8', '#ECE4D4', '#FBF8F1', '#ECE4D4', '#F7F2E8'];
    const feathers = fCols.map((c, k) => {
      const fg = new T.Group();
      const len = 4.8 - Math.abs(k - 2) * 0.55;
      const fm = felt(leafShape(1.9, len, 0.3), c, 0.4, { fuzz: 0.05 });
      fm.rotation.y = Math.PI / 2;
      fm.position.y = len * 0.45;
      fg.add(fm);
      fg.userData.a = lerp(-0.1, 1.05, k / 4);
      tail.add(fg);
      return fg;
    });
    const henSh = contactShadow(10, 8, 0.45);
    V.add(henSh);
    const blinkH = blinker(HP.eyes, 4);
    const HOME = v3(-4, WALLTOP, -1.5), FACE = 0.85;

    // les poussins-pompons
    const chBody = blobGeo(1.85, 1.72, 1.78, { seg: 18, lump: 0.05, seed: 3 });
    const chEyes = mergeGeos([-1, 1].map((s) => applyM(new T.SphereGeometry(0.27, 12, 8), { p: [s * 0.66, 0.5, 1.75], s: [1, 1.12, 0.7] })));
    const chBits = (() => {
      const b = new T.ConeGeometry(0.4, 0.95, 10);
      b.rotateX(Math.PI / 2);
      b.translate(0, 0.02, 2.08);
      return mergeGeos([b, ...[-1, 1].map((s) => applyM(new T.SphereGeometry(0.62, 10, 6), { p: [s * 0.78, -1.62, 0.7], s: [0.85, 0.32, 1.45] }))]);
    })();
    const chOrange = wool('#F29A2E', 'felt');
    const yellows = ['#FFD83A', '#FFE15C', '#FFCF2E'];
    const spots = [[-8, 13.5], [5.5, 14.2], [-15.5, 11.8], [12.5, 12.4], [-21, 15], [19, 15.6]];
    const chicks = spots.map(([x, z], i) => {
      const g = new T.Group(), bob = new T.Group();
      g.add(bob);
      const b = mesh(chBody, wool(yellows[i % 3], 'crochet', { sheen: 1, sheenColor: '#FFF6C4' }));
      fuzz(b, 0.42, { fiber: 0.085 });
      const e = mesh(chEyes, plastic('#141210'), { cast: false });
      const bits = mesh(chBits, chOrange);
      for (const m of [b, e, bits]) { m.position.y = 1.72; bob.add(m); }
      const sh = contactShadow(5, 4, 0.42);
      sh.position.y = 0.12;
      g.add(sh);
      const home = v3(x, H(x, z), z);
      g.position.copy(home);
      g.visible = false;
      V.add(g);
      V.boilable(g, 0.04, 0.8);
      return { g, bob, sh, home, on: false, t0: -1e9, s: 1.06 + hashi(i, 4) * 0.2, face: 0.25 + (hashi(i, 7) - 0.5) * 0.9, hop: -1e9, i };
    });

    // particules : peluches dorées dans le soleil, plumes qui volent
    let plumes = null, conf = null, crumbFx = null;
    const floorH = (x, z) => (x > WX0 && x < WX1 + 0.6 && Math.abs(z) < WZ ? WALLTOP + 0.05 : H(x, z));
    if (live) {
      pointCloud(V, { n: 70, box0: [-40, 2, -24], box1: [50, 46, 24], size: 0.85, color: '#FFF1CF', opacity: 0.5, vel: [-0.3, 0.35, 0.1], beam: 0.6, keyDir: [0.62, 0.56, 0.55] });
      plumes = fallers(V, { n: 10, kind: 'leaf', box: [-40, 46, 2, 46, -14, 22], colors: ['#FFFFFF', '#F3EEE4'], speed: 2.4, size: 0.7, seed: 5 });
      plumes.on = 0.3;
      conf = confetti(V, { kinds: ['leaf', 'disc', 'star'], n: 44, size: 0.85, height: floorH });
      crumbFx = confetti(V, { kinds: ['disc'], n: 16, size: 0.42, height: floorH });
    }
    V.onHome = (c) => { if (conf) conf.burst(v3(-4, WALLTOP + 10, -1), 5, [c, '#FFFFFF'], 0.45, 0.5); };

    // l'histoire
    let done = false, crumbN = CR.length, breadK = 1, lastCorrect = -1e9;
    const later = [];
    const after = (dt, fn) => later.push([V.now + dt, fn]);
    const peckK = (a, d) => (a < 0 || a > d ? 0 : a < d * 0.35 ? easeOut(a / (d * 0.35)) : a < d * 0.5 ? 1 : 1 - easeInOut((a - d * 0.5) / (d * 0.5)));
    // le petit tour : un cercle devant le mur
    const LAND = v3(-1, 0, 13.2), RX = 8.5, RZ = 2.8, CC = v3(LAND.x, 0, LAND.z + RZ);
    const path = (s, out) => out.set(CC.x - Math.sin(s * TAU) * RX, 0, CC.z - Math.cos(s * TAU) * RZ);
    const FIN = [[-4.8, 0.9], [4.8, 0.9], [-8.6, -0.2], [8.6, -0.2], [-12.2, -1.2], [12.2, -1.2]];
    const tA = v3(), tB = v3(), tC = v3();
    const T0 = 1.25, TR = 2.6, DL = 0.34;

    let lastT = null;
    V.anim((t, f) => {
      while (later.length && later[0][0] <= V.now) later.shift()[1]();
      blinkH(t, f);
      const dt = lastT == null ? 0 : clamp(t - lastT, 0, 0.5);
      lastT = t;
      const a = done ? V.age('done') : -1;
      // --- la poule ---
      let pk = Math.max(peckK(V.age('peck'), 0.36), 0.75 * peckK(V.age('npeck'), 0.26));
      const ta = V.age('tail'), lift = ta < 1.8 ? smooth(sat(ta / 0.25)) * (1 - smooth(sat((ta - 1.3) / 0.5))) : 0;
      let flap = lift > 0 ? lift * (0.45 + 0.55 * ((f % 2) ? 1 : 0.2)) : 0;
      const hopL = ta < 1.8 ? bump(sat((ta - 0.2) / 0.45)) * 1.8 : 0;
      let px = HOME.x, py = HOME.y, pz = HOME.z, face = FACE, squash = 0, legSwing = 0, tuck = 0;
      // la tête qui se tourne par à-coups, comme les poules
      const hw = Math.floor(t / 0.9);
      let headYaw = (hashi(hw, 3) - 0.5) * 0.9, headTilt = 0;
      if (done && a < 1e5) {
        pk = 0;
        if (a < 0.3) { squash = bump(a / 0.6) * 0.6; }
        else if (a < 1.0) {
          const u = (a - 0.3) / 0.7;
          px = lerp(HOME.x, LAND.x, u); pz = lerp(HOME.z, LAND.z, u);
          py = lerp(HOME.y, 0, easeIn(u) * 0.6 + u * 0.4) + Math.sin(Math.PI * u) * 8;
          face = lerp(FACE, Math.atan2(LAND.x - HOME.x, LAND.z - HOME.z), sat(u * 3));
          flap = 0.6 + 0.4 * ((f % 2) ? 1 : 0);
          tuck = 1;
          headYaw = 0;
        } else if (a < T0) { px = LAND.x; pz = LAND.z; py = 0; squash = bump((a - 1.0) / (T0 - 1.0)) * 0.8; face = 0; headYaw = 0; }
        else if (a < T0 + TR) {
          const s = (a - T0) / TR;
          path(s, tA); path(s + 0.01, tB);
          px = tA.x; pz = tA.z; py = Math.abs(Math.sin((a - T0) * Math.PI * 4)) * 0.5;
          face = Math.atan2(tB.x - tA.x, tB.z - tA.z);
          legSwing = Math.sin((a - T0) * Math.PI * 4);
          headYaw = Math.sin(a * 3) * 0.3;
          flap = 0.2 * Math.abs(Math.sin(a * 9));
        } else {
          const b = a - T0 - TR;
          px = LAND.x; pz = LAND.z;
          // fin du tour (elle regarde vers la gauche), puis elle se tourne vers nous
          const rot = Math.atan2(V.camera.position.x - LAND.x, V.camera.position.z - LAND.z);
          face = lerp(-Math.PI / 2, rot, easeInOut(sat(b / 0.5)));
          // fête : battements d'ailes et petits sauts
          const c = (b % 1.5) / 1.5;
          py = b > 0.5 ? bump(sat(c / 0.4)) * 2.2 : 0;
          flap = b > 0.5 && c < 0.55 ? 0.5 + 0.5 * Math.abs(Math.sin(b * 20)) : 0.05;
          squash = b > 0.5 && c > 0.4 && c < 0.55 ? 0.4 : 0;
          headYaw = Math.sin(b * 1.7) * 0.35;
          headTilt = -0.15;
        }
      }
      henRoot.position.set(px, py, pz);
      henRoot.rotation.y = face;
      henTilt.rotation.x = 0.48 * pk;
      HP.body.rotation.x = 0.62 * pk - 0.15 * lift;
      HP.body.position.y = bodyY0 - 1.4 * pk - squash * 0.9 + Math.sin(t * 2.4) * 0.05 + hopL;
      HP.body.scale.set(1 + squash * 0.12, 1 - squash * 0.12 + Math.sin(t * 2.4) * 0.01, 1 + squash * 0.08);
      HP.head.rotation.set(0.35 * pk + headTilt, pk > 0.05 ? 0 : headYaw, 0);
      HP.wings.forEach((w, i) => { const s = i ? 1 : -1; w.rotation.z = s * flap * 1.55; w.rotation.x = -flap * 0.35; });
      tail.rotation.x = 0.85 * lift + 0.12 * pk;
      tail.rotation.z = lift > 0.05 ? Math.sin(ta * 26) * 0.22 * lift : 0;
      tail.scale.setScalar(1 + 0.25 * lift);
      feathers.forEach((fg) => { fg.rotation.x = -fg.userData.a * (1 + 0.5 * lift); });
      HP.legs.forEach((lg, i) => { lg.rotation.x = tuck ? -0.9 : legSwing * (i ? 0.5 : -0.5); });
      // l'ombre de contact reste au sol
      const fy = floorH(px, pz);
      henSh.position.set(px, fy + 0.08, pz);
      henSh.material.opacity = 0.45 * clamp(1 - (py - fy) / 14, 0, 1);
      henSh.scale.setScalar(1 - clamp((py - fy) / 30, 0, 0.5));
      // les miettes et le pain
      crumbs.count = crumbN;
      bread.scale.setScalar(lerp(bread.scale.x, breadK, 1 - Math.exp(-dt * 5)));

      // --- les poussins ---
      let nOn = 0;
      chicks.forEach((c) => { if (c.on) nOn++; });
      chicks.forEach((c, i) => {
        if (!c.on) { c.g.visible = false; return; }
        c.g.visible = true;
        const k = sat((V.now - c.t0) / 0.5);
        let x = c.home.x, z = c.home.z, y = c.home.y, fc = c.face, hop = bump(k) * 2.2, tilt = 0;
        const sc = Math.max(0.001, easeOutBack(k) * c.s);
        // ils picorent le sol de temps en temps
        const lt = (t + i * 0.73) % 1.4, w = Math.floor((t + i * 0.73) / 1.4);
        if (hashi(w, i, 3) < 0.4 && lt < 0.32) tilt = bump(lt / 0.32) * 0.65;
        hop += bump(sat(V.age('chick' + i) / 0.32)) * 1.4;
        if (done && a < 1e5) {
          tilt = 0;
          const tj = T0 + DL * (i + 1), te = tj + TR;
          const fin = tA.set(LAND.x + FIN[i][0], 0, LAND.z + FIN[i][1]);
          if (a < 0.8) { fc = Math.atan2(LAND.x - x, LAND.z - z); hop += bump(sat(a / 0.4)) * 1.5; }
          else if (a < tj) {
            const u = easeInOut((a - 0.8) / (tj - 0.8));
            x = lerp(c.home.x, LAND.x, u); z = lerp(c.home.z, LAND.z, u);
            fc = Math.atan2(LAND.x - c.home.x, LAND.z - c.home.z);
            hop += Math.abs(Math.sin(a * Math.PI * 5)) * 0.9;
          } else if (a < te) {
            const s = (a - tj) / TR;
            path(s, tB); path(s + 0.01, tC);
            x = tB.x; z = tB.z;
            fc = Math.atan2(tC.x - tB.x, tC.z - tB.z);
            hop += Math.abs(Math.sin(a * Math.PI * 5 + i)) * 0.9;
          } else {
            const u = easeInOut(sat((a - te) / 0.6));
            x = lerp(LAND.x, fin.x, u); z = lerp(LAND.z, fin.z, u);
            fc = u < 1 ? Math.atan2(fin.x - LAND.x, fin.z - LAND.z) : Math.atan2(V.camera.position.x - fin.x, V.camera.position.z - fin.z);
            if (u < 1) hop += Math.abs(Math.sin(a * Math.PI * 5)) * 0.9;
            else { const ph = ((a - te) * 1.6 + i * 0.17) % 1; hop += ph < 0.3 ? bump(ph / 0.3) * 1.6 : 0; }
          }
          y = H(x, z);
        }
        c.g.position.set(x, y, z);
        c.g.rotation.y = fc;
        c.g.scale.setScalar(sc);
        c.bob.position.y = hop;
        c.bob.rotation.x = tilt;
        c.bob.scale.set(1 + (hop > 0.05 ? -0.06 : 0.05 * bump(sat(V.age('chick' + i) / 0.32))), hop > 0.05 ? 1.1 : 1, 1);
        c.sh.material.opacity = 0.42 * clamp(1 - hop / 5, 0.3, 1);
      });
      // le soleil sourit et tourne un peu à la fin
      sunG.rotation.z = done && a < 1e5 ? Math.sin(a * 2) * 0.12 * Math.exp(-a * 0.15) : Math.sin(t * 0.7) * 0.04;
      halo.material.color.copy(haloC).multiplyScalar(0.5 + 0.05 * Math.sin(t * 1.3));
      flowers.forEach((g, i) => { g.rotation.z = Math.sin(t * 1.2 + i) * 0.04; });
    });

    return {
      update(st, first) {
        crumbN = st.done ? 0 : Math.max(0, Math.round(CR.length * (1 - st.p)));
        breadK = st.done ? 0.5 : lerp(1, 0.6, st.p);
        if (first) bread.scale.setScalar(breadK);
        const nc = st.done ? chicks.length : Math.min(chicks.length, Math.floor(st.p * (chicks.length + 1) + 1e-6));
        chicks.forEach((c, i) => {
          const on = i < nc;
          if (on && !c.on) c.t0 = first ? -1e9 : V.now + 1 / FPS + 0.15;
          c.on = on;
        });
        if (st.done && !done) { done = true; if (first) V.cues.done = -1e6; else V.cue('done'); if (plumes) plumes.on = 1; }
        if (!st.done && done) { done = false; if (plumes) plumes.on = 0.3; }
      },
      react(kind, st) {
        if (kind === 'correct' || kind === 'phrase') {
          V.cue('peck');
          lastCorrect = V.now;
          if (crumbFx) after(0.12, () => crumbFx.burst(v3(PECK.x + 0.6, WALLTOP + 0.4, PECK.z), 6, ['#EBD29E', '#D4A25D', '#F0DDB2'], 0.35, 0.35));
        }
        if (kind === 'phrase') {
          V.cue('tail', 0.1);
          if (conf) after(0.45, () => conf.burst(v3(HOME.x - 2, WALLTOP + 8, HOME.z - 2), 12, ['#FFFFFF', '#F3EEE4', '#FFE07A'], 0.6, 0.6));
        }
        if (kind === 'complete') {
          if (conf) {
            after(0.3, () => conf.burst(v3(HOME.x, WALLTOP + 6, HOME.z), 16, ['#FFFFFF', '#F3EEE4'], 0.7, 0.8));
            after(1.05, () => conf.burst(v3(LAND.x, 2, LAND.z), 22, ['#FFFFFF', '#FFD83A', '#E5484D', '#F5C32C', '#4CAF5A'], 1.0, 1.1));
            after(T0 + TR + 0.6, () => conf.burst(v3(LAND.x, 3, LAND.z - 1), 30, ['#FFFFFF', '#FFD83A', '#E5484D', '#3E6FD8', '#F2803C'], 1.2, 1.3));
          }
        }
      },
      note(n, on) {
        if (!on) return;
        V.cue('npeck');
        const vis = chicks.filter((c) => c.on);
        if (vis.length) V.cue('chick' + vis[n % vis.length].i);
      },
    };
  },
};
