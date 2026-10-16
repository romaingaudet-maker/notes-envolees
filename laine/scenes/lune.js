/* ============ Au clair de la lune : la ruelle de Pierrot, la nuit ============
   Une étoile s'allume à chaque note retrouvée ; la lune se réveille à la
   deuxième phrase ; à la fin, Pierrot ouvre sa porte et la chandelle de
   l'ami se rallume. */
SCENES.lune = {
  color: '#1E2A66',
  view: {
    bg: '#0B1030', fov: 26,
    rig: { target: [0, 24, 0], az: 6, el: 5, box: [74, 52], targetWide: [2, 27, 0], boxWide: [96, 54] },
    post: { exposure: 1.05, bloom: 0.9, bloomThr: 0.9, aper: 6, maxBlur: 11, sat: 1.05, lift: '#04061A', vignette: 0.5, punch: 1.25 },
  },
  sky: [2, 40, 31, 47, -8, 6],
  home: [-10, 24, -2],
  build(V, o) {
    const S = V.scene;
    studioLights(V, {
      key: { color: '#B9C8FF', k: 1.9, az: 30, el: 38, area: 70 },
      fill: { sky: '#33458C', ground: '#141833', k: 0.55 },
      rim: { color: '#7D93E6', k: 1.1, az: -150, el: 30 },
      env: { sky: '#26346E', ground: '#0B0D1C', k: 0.45, boxK: 3 },
      fog: { color: '#0D1435', near: 160, far: 420 },
    });
    // le ciel : drap de feutrine bleu nuit
    V.add(cyclo({ w: 520, h: 240, z: -95, r: 50, floor: 40, top: '#0A0F33', mid: '#18225A', bottom: '#2C3A7C', y: -2, scale: 3 }));
    // sol pavé
    const ground = terrain({ w: 320, d: 150, nx: 40, nz: 24, colors: ['#2A2F55', '#262B4E'], bands: 7, rough: 0.3, scale: 2.4 });
    V.add(ground);
    const cobGeo = blobGeo(1, 0.45, 0.85, { seg: 12, lump: 0.12, seed: 3 });
    V.add(scatter(cobGeo, wool('#FFFFFF', 'felt', { sheen: 0.4, sheenColor: '#2E3456' }), o.portrait ? 60 : 170, (i, r) => {
      const row = Math.floor(i / 17), k = i % 17;
      const x = -70 + k * 8.4 + (row % 2) * 4 + (r() - 0.5) * 1.5, z = -4 + row * 3.6 + (r() - 0.5);
      const g = 0.075 + r() * 0.07;
      return { p: [x, 0.1, z], r: [0, r() * 3, 0], s: [2.2 + r() * 0.9, 1 + r() * 0.6, 1.9], c: new T.Color(g * 0.9, g * 0.92, g * 1.25) };
    }));

    // toits de la ville, au loin (feutrine découpée, quelques fenêtres allumées)
    const roofs = (w, h, n, seed) => {
      const r = rng(seed), pts = [[-w / 2, -10]];
      let x = -w / 2;
      for (let i = 0; i < n; i++) {
        const bw = w / n * (0.8 + r() * 0.4), hh = h * (0.6 + r() * 0.5);
        pts.push([x, hh]);
        if (r() < 0.55) { pts.push([x + bw * 0.5, hh + bw * 0.45]); } else { pts.push([x + bw * 0.15, hh]); pts.push([x + bw * 0.15, hh + 5]); pts.push([x + bw * 0.28, hh + 5]); pts.push([x + bw * 0.28, hh]); }
        pts.push([x + bw, hh]);
        x += bw;
      }
      pts.push([w / 2, -10]);
      return polyShape(pts);
    };
    const far = flatLayer(roofs(260, 30, 12, 4), '#151C48', { depth: 1, inset: 1.1, stitch: '#2B3778' });
    at(far, 10, 0, -62);
    V.add(far);
    const near = flatLayer(roofs(220, 22, 9, 8), '#1D2659', { depth: 1, inset: 1.1, stitch: '#36448C' });
    at(near, 30, 0, -40);
    V.add(near);
    const winMat = glowMat('#FFC46B', 2.2);
    const wr = rng(5);
    for (let i = 0; i < 14; i++) {
      const w = mesh(new T.PlaneGeometry(2.2, 2.8), winMat, { cast: false });
      const layer = i % 2 ? near : far;
      at(w, -100 + wr() * 200, 6 + wr() * 14, 0.6);
      layer.add(w);
    }

    // la lune, pendue à son fil
    const mn = new T.Group();
    const mMat = wool('#F7EFC6', 'felt', { emissive: '#FFF0B8', emissiveIntensity: 0.55, sheen: 0.6 });
    const disc = mesh(feltGeo(circleShape(11), 2.6), mMat);
    fuzz(disc, 0.14, { fiber: 0.08 });
    mn.add(disc);
    mn.add(stitches(insetPoly(outline2D(circleShape(11), 90), 0.9), 1.32, '#D9C579', { len: 0.6, gap: 0.4, r: 0.09 }));
    // cratères de feutrine
    [[-7.2, 5.8, 1.5], [6.6, -6.4, 1.2], [7.9, 4.6, 0.85], [-2.5, 8.2, 0.7]].forEach(([x, y, r]) => { const c = felt(circleShape(r), '#EADFB0', 0.3, { fuzz: false }); at(c, x, y, 1.35); mn.add(c); });
    // yeux : fermés (brodés) puis ouverts (perles)
    const lids = new T.Group(), open = new T.Group();
    for (const s of [-1, 1]) {
      lids.add(yarn([[s * 3.6 - 1.6, 1.4, 1.45], [s * 3.6, 0.6, 1.6], [s * 3.6 + 1.6, 1.4, 1.45]], 0.24, '#5B4A2E', { radial: 5 }));
      const e = bead(0.9, '#1C1612'); at(e, s * 3.6, 1.2, 1.5); open.add(e);
      const c = felt(circleShape(1.3), '#F0B79A', 0.15, { fuzz: false }); at(c, s * 5.6, -1.8, 1.4); mn.add(c);
    }
    const smile = yarn([[-2.4, -2.6, 1.45], [0, -4.0, 1.6], [2.4, -2.6, 1.45]], 0.24, '#5B4A2E', { radial: 5 });
    mn.add(lids, open, smile);
    open.visible = false;
    at(mn, 24, 52, -34);
    const hm = hang(mn, 140, { amp: 1.4, per: 5 });
    V.add(hm);
    swingAnim(V, hm);
    // halo de la lune
    const halo = new T.Mesh(new T.PlaneGeometry(70, 70), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#6D7FD8').multiplyScalar(0.55), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    at(halo, 24, 52, -40);
    V.add(halo);

    // les étoiles qui s'allument une à une
    const stars = [];
    const sr = rng(12);
    const spots = [[-44, 56], [-30, 64], [-16, 52], [-36, 44], [-6, 60], [8, 48], [-22, 70], [42, 64], [48, 46], [6, 70], [38, 36], [-50, 34]];
    spots.forEach(([x, y], i) => {
      const r = 1.9 + sr() * 1.2;
      const m = wool('#3A4374', 'felt', { sheen: 0.4 }).clone();
      m.emissive = col('#FFD45A'); m.emissiveIntensity = 0;
      const body = mesh(feltGeo(starShape(r, 0.48, 5, 0.25), 0.8), m);
      const sh = m;
      const g = new T.Group();
      g.add(body);
      g.add(stitches(insetPoly(outline2D(starShape(r, 0.48, 5, 0.25), 60), 0.3), 0.42, '#6873AE', { len: 0.3, gap: 0.2, r: 0.05 }));
      at(g, x, y, -26 - sr() * 18);
      g.rotation.z = (sr() - 0.5) * 0.6;
      const hs = hang(g, 120, { amp: 2.2, per: 3 + sr() * 2, r: 0.04 });
      V.add(hs);
      swingAnim(V, hs);
      stars.push({ g, m, sh, lit: 0, target: 0, flare: -9 });
    });
    const dim = col('#3A4374'), lit = col('#FFE48A'), cc = new T.Color();
    V.anim((t) => {
      stars.forEach((s) => {
        s.lit += (s.target - s.lit) * 0.5;
        const fl = Math.max(0, 1 - (t - s.flare) / 0.6);
        cc.copy(dim).lerp(lit, s.lit);
        s.m.color.copy(cc); s.sh.color.copy(cc);
        const e = s.lit * (1.1 + 0.25 * Math.sin(t * 3 + s.g.position.x)) + fl * 2.2;
        s.m.emissiveIntensity = e; s.sh.emissiveIntensity = e;
        s.g.scale.setScalar(1 + fl * 0.35);
      });
    });

    // la maison de Pierrot
    const house = new T.Group();
    at(house, -12, 0, -6);
    V.add(house);
    const wall = wallPanel(36, 32, [[4, 17, 12, 11], [-9, 0, 9.5, 16, true]], { color: '#ABA8C8', depth: 3, gable: 12, scale: 0.9, bump: 1.4 });
    house.add(wall);
    // toit : deux pans de tricot rouge sombre
    for (const s of [-1, 1]) {
      const pan = mesh(new T.BoxGeometry(22, 1.6, 9), wool('#8E3B3B', 'knit', { scale: 0.7 }));
      scaleUV(pan.geometry, 22, 9);
      pan.position.set(s * 9.4, 32 + 6.2, -2);
      pan.rotation.z = -s * Math.atan2(12, 18);
      house.add(pan);
    }
    const chim = mesh(new T.BoxGeometry(4, 8, 4), wool('#B5654A', 'knit', { scale: 0.6 }));
    at(chim, 9, 40, -3);
    house.add(chim);
    // côté de la maison (profondeur)
    const side = mesh(new T.BoxGeometry(2.5, 32, 14), wool('#D9CBB0', 'knit', { scale: 0.9 }));
    at(side, -18.6, 16, -7);
    house.add(side);
    // l'intérieur, chaud et sombre, derrière la fenêtre
    const room = mesh(new T.BoxGeometry(18, 16, 14), wool('#5A2E22', 'knit', { scale: 0.7, side: T.BackSide }), { cast: false });
    at(room, 4, 21, -8.6);
    house.add(room);
    const roomLight = practical(V, [-6, 26, -10], '#FFAA55', 260, 46);
    // rebord de fenêtre
    const sill = mesh(new T.BoxGeometry(15, 1.2, 4), wool('#C9B48E', 'knit', { scale: 0.6 }));
    at(sill, 4, 16.6, 1.4);
    house.add(sill);
    // la chandelle de Pierrot, allumée, sur le rebord
    const pc = new T.Group();
    pc.add(mesh(latheGeo([[0, 0], [1.4, 0], [1.5, 0.3], [0.45, 0.35], [0.4, 0.9], [0, 0.9]], { seg: 16 }), metalMat('#C9A54A', { rough: 0.4 })));
    const pcw = mesh(new T.CylinderGeometry(0.45, 0.5, 2.6, 12), wool('#FFF4DA', 'felt'));
    pcw.position.y = 2.1;
    pc.add(pcw);
    const pfl = flame(V, { s: 0.75, power: 380, dist: 46 });
    pfl.position.y = 3.6;
    pc.add(pfl);
    at(pc, 8.6, 17.2, 2.2);
    house.add(pc);
    // volets ouverts
    for (const s of [-1, 1]) {
      const sh = feltPiece(roundRectShape(6, 11, 0.8), '#3E6FD8', { depth: 0.8, inset: 0.5, stitch: '#9DB8F2' });
      at(sh, 4 + s * 9.3, 22.5, 1.9);
      sh.rotation.y = s * 0.35;
      house.add(sh);
    }
    // la porte (elle s'ouvrira)
    const doorPiv = new T.Group();
    at(doorPiv, -13.6, 0, 1.2);
    house.add(doorPiv);
    const door = mesh(feltGeo(polyShape([[0, 0], [9.2, 0], [9.2, 11.2], [8.6, 13.6], [6.8, 15.3], [4.6, 15.9], [2.4, 15.3], [0.6, 13.6], [0, 11.2]]), 1.2), wool('#6E4129', 'knit', { scale: 0.6 }));
    doorPiv.add(door);
    const knob = bead(0.55, '#D9B45A'); at(knob, 7.6, 7.5, 0.8); doorPiv.add(knob);
    const doorGlow = mesh(new T.PlaneGeometry(9, 15.5), glowMat('#FFB766', 1.6), { cast: false });
    at(doorGlow, -9, 7.8, -1.6);
    house.add(doorGlow);
    const doorLight = practical(V, [-21, 8, -4], '#FFA552', 0, 60);

    // Pierrot à sa fenêtre
    const pz = doll({ h: 15, skin: '#FBF3EA', top: '#F7F4EE', bottom: '#F7F4EE', sleeves: '#F7F4EE', collar: '#FFFFFF', ruff: true, hairStyle: 'none', cheeks: '#F2B1B1', buttons: { n: 3, color: '#1B1B22', fuzz: 0.2 }, shoes: '#1B1B22' });
    const cap = woolBall(pz.R * 1.03, '#1B1B22', 'crochet', { sy: 0.52, seed: 5, fuzz: 0.12 });
    at(cap, 0, pz.R * 0.52, -pz.R * 0.06);
    pz.p.head.add(cap);
    // larme brodée (Pierrot est un peu triste)
    const tear = woolBall(0.32, '#9FC6FF', 'felt', { sy: 1.4, fuzz: false });
    at(tear, pz.R * 0.4, -pz.R * 0.18, pz.R * 0.86);
    pz.p.head.add(tear);
    at(pz.g, 4 - 12, 12.2, -6 - 3.6);
    pz.g.rotation.y = 0.1;
    V.add(pz.g);
    boilable(pz.g, 0.05, 0.5);
    V.boil.push(pz.g);
    // la plume, dans sa main droite
    const quill = new T.Group();
    const plume = feltPiece(leafShape(1.7, 7.5, 0.6), '#FFFFFF', { depth: 0.25, inset: 0.25, stitch: '#C8C8D8', st: { len: 0.2, gap: 0.15, r: 0.03 } });
    plume.position.y = 3.8;
    quill.add(plume, yarn([[0, -0.4, 0], [0.1, 6.8, 0]], 0.08, '#C8B9A0', { radial: 5 }));
    quill.rotation.z = -0.5;
    at(quill, 0, -pz.p.armR.userData.len, 0.4);
    pz.p.armR.add(quill);
    pz.p.armR.rotation.x = -1.1;
    pz.p.armL.rotation.x = -0.6;
    const blinkP = blinker(pz.p.eyes, 3);

    // l'ami, dehors, avec sa chandelle éteinte
    const ami = doll({ h: 12, top: '#7A5BC7', bottom: '#5A4AA0', sleeves: '#7A5BC7', dress: true, hair: '#C98A4B', hairStyle: 'short', hat: { type: 'night', color: '#5A4AA0', pompom: '#F5C32C' }, shoes: '#3A2A50', cheeks: '#F09A8E' });
    at(ami.g, -6, 0, 6);
    ami.g.rotation.y = -0.65;
    V.add(ami.g);
    boilable(ami.g, 0.05, 0.6);
    V.boil.push(ami.g);
    const holder = new T.Group();
    const dish = mesh(latheGeo([[0, 0], [1.6, 0], [1.7, 0.3], [0.5, 0.4], [0.45, 1.0], [0, 1.0]], { seg: 18 }), metalMat('#C9A54A', { rough: 0.4 }));
    const candle = mesh(new T.CylinderGeometry(0.5, 0.55, 3.2, 14), wool('#FFF7E2', 'felt'));
    candle.position.y = 2.4;
    const wick = yarn([[0, 3.9, 0], [0.05, 4.4, 0]], 0.08, '#2A2018', { radial: 4 });
    holder.add(dish, candle, wick);
    const fl = flame(V, { s: 0.9, power: 500, dist: 50 });
    fl.position.y = 4.3;
    fl.visible = false;
    holder.add(fl);
    at(holder, 0.2, -ami.p.armR.userData.len - 0.6, 1.2);
    holder.rotation.x = 1.1;
    ami.p.armR.add(holder);
    ami.p.armR.rotation.x = -1.1;
    const blinkA = blinker(ami.p.eyes, 7);

    // peluches dans le clair de lune, étincelles au loin
    if (!o.portrait) {
      pointCloud(V, { n: 70, box0: [-60, 4, -20], box1: [60, 60, 25], size: 0.9, color: '#B7C6FF', opacity: 0.35, vel: [0.3, 0.5, 0.2] });
      pointCloud(V, { n: 80, box0: [-140, 40, -85], box1: [140, 110, -70], size: 1.6, sprite: 'spark', color: '#FFF2C0', glow: 1.6, twinkle: 1, wander: 0, vel: [0, 0, 0], opacity: 0.9 });
    }
    const conf = confetti(V, { kinds: ['star'], n: 50, size: 0.9 });

    // animations
    let litN = 0, done = false, woke = false;
    V.anim((t, f) => {
      blinkP(t, f); blinkA(t, f);
      const P = pz.p;
      // Pierrot écrit (le bras droit gratte), et répond quand on trouve une note
      const nod = bump(sat(V.age('nod') / 0.5));
      const wave = sat(V.age('wave') / 1.4);
      P.head.rotation.x = 0.12 + nod * 0.32 + Math.sin(t * 0.8) * 0.03;
      P.head.rotation.z = Math.sin(t * 0.6) * 0.06;
      P.armR.rotation.x = -1.1 + Math.sin(t * 7) * 0.08 * (wave < 1 ? 0 : 1);
      if (wave < 1) { P.armL.rotation.x = -0.6 - bump(wave) * 1.6; P.armL.rotation.z = -0.22 - bump(wave) * 0.5 * Math.sin(wave * 18); } else { P.armL.rotation.x = -0.6; P.armL.rotation.z = -0.22; }
      P.body.rotation.z = Math.sin(t * 0.5) * 0.02;
      // l'ami frissonne d'impatience, puis se réjouit
      const A = ami.p;
      A.body.rotation.z = Math.sin(t * 1.7) * 0.03;
      A.head.rotation.y = 0.5 + Math.sin(t * 0.4) * 0.15;
      const jump = done ? Math.abs(Math.sin(V.age('done') * 5)) * (V.age('done') < 3 ? 1.6 : 0.4) : bump(sat(V.age('hop') / 0.45)) * 1.2;
      ami.g.position.y = jump;
      // la porte
      const dk = done ? easeInOut(sat(V.age('done') / 1.2)) : 0;
      doorPiv.rotation.y = -dk * 1.75;
      doorGlow.material = dk > 0 ? doorGlow.material : doorGlow.material;
      doorGlow.visible = dk > 0.02;
      doorLight.intensity = dk * 900;
      // la lune
      open.visible = woke; lids.visible = !woke;
      mn.rotation.z = Math.sin(t * 0.5) * 0.05 + bump(sat(V.age('moon') / 1.0)) * 0.3 * Math.sin(V.age('moon') * 14);
      roomLight.intensity = 260 * (0.92 + hashi(f, 2) * 0.16);
    });

    const flock = () => null;
    return {
      update(st, first) {
        litN = Math.round(stars.length * st.p);
        stars.forEach((s, i) => { s.target = i < litN ? 1 : 0; if (first) s.lit = s.target; });
        if (st.phrasesDone >= 2 && !woke) { woke = true; if (!first) V.cue('moon'); }
        if (st.phrasesDone < 2) woke = false;
        if (st.done && !done) { done = true; V.cue('done'); fl.visible = true; }
        if (!st.done) { done = false; fl.visible = false; }
      },
      react(kind, st) {
        if (kind === 'correct' || kind === 'phrase') {
          V.cue('nod');
          V.cue('hop');
          const s = stars[Math.max(0, litN - 1)];
          if (s) s.flare = V.now + 1 / FPS;
        }
        if (kind === 'phrase') { V.cue('wave'); V.cue('moon'); }
        if (kind === 'complete') {
          conf.burst(v3(-8, 14, 6), 26, ['#FFE07A', '#FFFFFF', '#F5C32C'], 1.1);
          stars.forEach((s, i) => { s.flare = V.now + i * 0.08; });
        }
      },
      note(n, on) {
        if (!on) return;
        const s = stars[n % stars.length];
        if (s) s.flare = V.now;
        V.cue('nod');
      },
    };
  },
};
