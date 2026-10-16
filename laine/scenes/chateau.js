/* ============ Le bon roi Dagobert : la salle du trône, rouge et or ============
   Le roi parade devant son trône, très fier… avec sa culotte à l'envers (doublure,
   coutures, étiquette et poche retournée). Saint Éloi s'approche à mesure qu'on
   retrouve les notes, puis montre la culotte du bout du doigt ; à la troisième
   phrase, le roi rougit. À la fin, il tourne sur lui-même et la culotte se
   retrouve à l'endroit : les trompettes descendent, pluie de confettis dorés. */
SCENES.chateau = {
  color: '#9E2A2E',
  view: {
    bg: '#24120E', fov: 26,
    rig: { target: [-1, 14.5, -6], az: 6, el: 10, box: [52, 42], targetWide: [-2, 15, -6], boxWide: [92, 40] },
    post: { exposure: 1.08, bloom: 0.75, bloomThr: 0.9, aper: 6, maxBlur: 10, sat: 1.1, lift: '#1A0A06', gain: '#FFF2E0', vignette: 0.42, punch: 1.26 },
  },
  sky: [-24, 18, 30, 38, -14, -4],
  home: [6, 20, -6],
  build(V, o) {
    const PORTRAIT = !!o.portrait;
    studioLights(V, {
      key: { color: '#FFDDAA', k: 2.0, az: -35, el: 38, area: 64 },
      fill: { sky: '#9A7466', ground: '#3A2018', k: 0.55 },
      rim: { color: '#FFC878', k: 1.5, az: 165, el: 30 },
      env: { sky: '#8A6656', ground: '#2A1610', k: 0.5, boxK: 3 },
      fog: { color: '#2A1610', near: 260, far: 700 },
    });

    /* ---------- petits outils du décor ---------- */
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
    // bras qui vise un point du monde (pivot à l'épaule : rotation.x vers l'avant, .z sur le côté)
    const tmpV = v3();
    const aim = (arm, world) => {
      arm.parent.updateWorldMatrix(true, false);
      tmpV.copy(world);
      arm.parent.worldToLocal(tmpV);
      const d = tmpV.sub(arm.position).normalize();
      return { x: Math.atan2(-d.z, -d.y), z: Math.asin(clamp(d.x, -1, 1)) };
    };
    const GOLD = '#E8B83A', RED = '#B32430';
    const m4 = new T.Matrix4(), s4 = v3();

    /* ---------- la salle : mur de pierre, vitrail, bannières, colonnes ---------- */
    const WZ = -30;
    const hall = new T.Group();
    hall.add(at(wallPanel(150, 70, [[4, 31, 13, 24, true]], { color: '#C7AE92', depth: 4, scale: 1.1, bump: 1.3 }), 0, 0, WZ));
    // le soubassement et la corniche
    hall.add(at(mesh(new T.BoxGeometry(150, 4, 1.5), wool('#9E8468', 'knit', { scale: 0.8 })), 0, 2, WZ + 2.5));
    hall.add(at(mesh(new T.BoxGeometry(150, 1.6, 1.4), wool('#B09676', 'knit', { scale: 0.7 })), 0, 58, WZ + 2.5));
    // joints des pierres : rangs de fil plus sombre
    const joints = [];
    for (let y = 8; y < 58; y += 6.5) {
      joints.push(yarnGeo([[-75, y, WZ + 2.06], [-3.6, y, WZ + 2.06]], 0.14, { radial: 4 }));
      joints.push(yarnGeo([[11.6, y, WZ + 2.06], [75, y, WZ + 2.06]], 0.14, { radial: 4 }));
      for (let x = -72 + ((y / 6.5) % 2) * 6; x < 72; x += 12) if (x < -4 || x > 12 || y < 30) joints.push(yarnGeo([[x, y, WZ + 2.06], [x, y + 6.5, WZ + 2.06]], 0.14, { radial: 4 }));
    }
    hall.add(mesh(mergeGeos(joints), wool('#9A8166', 'yarn'), { cast: false }));
    // colonnes de pierre qui encadrent la scène
    for (const x of [-41, 37]) {
      hall.add(at(mesh(latheGeo([[4.2, 0], [4.2, 2.4], [3.3, 3.2], [3.0, 54], [4.0, 56], [4.2, 58.5], [0.01, 58.5]], { seg: 22, lump: 0.02 }), wool('#D2BB9E', 'knit', { scale: 0.9 })), x, 0, -16));
      hall.add(at(mesh(yarnGeo([...Array(40)].map((_, i) => [Math.cos(i * 0.9) * 3.08, 4 + i * 1.3, Math.sin(i * 0.9) * 3.08]), 0.22, { radial: 5, maxSeg: 200 }), wool(GOLD, 'yarn')), x, 0, -16));
    }
    // l'estrade du trône, le tapis rouge bordé d'or
    hall.add(at(mesh(new T.BoxGeometry(30, 1.6, 11), wool('#8E1C26', 'knit', { scale: 0.6 })), 6, 0.8, -23));
    hall.add(at(mesh(new T.BoxGeometry(24, 1.4, 8), wool('#A0202C', 'knit', { scale: 0.6 })), 6, 2.3, -24.5));
    hall.add(at(mesh(new T.BoxGeometry(13, 0.35, 48), wool('#A8222E', 'knit', { scale: 0.6 })), 6, 0.18, 8));
    for (const s of [-1, 1]) hall.add(mesh(yarnGeo([[6 + s * 6.1, 0.42, -16], [6 + s * 6.1, 0.42, 32]], 0.28, { radial: 5 }), wool(GOLD, 'yarn'), { cast: false }));
    // le trône doré et ses coussins de velours rouge
    const throne = new T.Group();
    const gold = metalMat('#D9A23A', { rough: 0.38 });
    const backSh = new T.Shape();
    backSh.moveTo(-6, 0); backSh.lineTo(6, 0); backSh.lineTo(6, 14); backSh.quadraticCurveTo(6, 17, 3.5, 17.5); backSh.quadraticCurveTo(1.5, 18, 0, 20.5); backSh.quadraticCurveTo(-1.5, 18, -3.5, 17.5); backSh.quadraticCurveTo(-6, 17, -6, 14); backSh.lineTo(-6, 0);
    throne.add(at(mesh(feltGeo(backSh, 1.4, { bevel: 0.35 }), gold), 0, 6, -2.6));
    const backIn = new T.Shape();
    backIn.moveTo(-4.6, 0); backIn.lineTo(4.6, 0); backIn.lineTo(4.6, 12); backIn.quadraticCurveTo(4.6, 14.6, 0, 16.8); backIn.quadraticCurveTo(-4.6, 14.6, -4.6, 12); backIn.lineTo(-4.6, 0);
    throne.add(at(mesh(feltGeo(backIn, 0.8, { bevel: 0.25 }), wool('#9E1C28', 'knit', { scale: 0.5, sheen: 1, sheenColor: '#FF7A7A' })), 0, 7.4, -1.75));
    throne.add(at(mesh(new T.BoxGeometry(13, 1.2, 7), gold), 0, 5.4, 0.6));
    throne.add(at(woolBall(1, '#A8202C', 'knit', { sx: 6.0, sy: 1.0, sz: 3.2, fuzz: false, seg: 20, mat: { sheen: 1, sheenColor: '#FF8080' } }), 0, 6.6, 0.8));
    for (const s of [-1, 1]) {
      throne.add(at(mesh(new T.BoxGeometry(1.4, 5.4, 1.4), gold), s * 5.6, 2.7, 3.4));
      throne.add(at(mesh(new T.BoxGeometry(1.4, 5.4, 1.4), gold), s * 5.6, 2.7, -2.2));
      throne.add(at(mesh(new T.BoxGeometry(1.3, 1.1, 7.2), gold), s * 6.2, 9.6, 0.6));
      throne.add(at(mesh(new T.BoxGeometry(1.1, 3.6, 1.1), gold), s * 6.2, 7.6, 3.6));
      throne.add(at(bead(0.7, '#C8233A'), s * 6.2, 10.4, 4.0));
    }
    throne.add(at(bead(1.0, '#2E5BD0'), 0, 24.8, -1.7));
    at(throne, 6, 3.0, -25.2);
    hall.add(throne);
    V.add(bake(hall));
    // le damier du sol (instances)
    V.add(at(mesh(new T.BoxGeometry(200, 1, 120), wool('#3A2A22', 'felt')), 0, -0.5, 10));
    V.add(scatter(new T.BoxGeometry(1, 1, 1), wool('#FFFFFF', 'felt', { sheen: 0.4, sheenColor: '#6A5040', scale: 0.8 }), 264, (i, r) => {
      const cx = i % 22, cz = Math.floor(i / 22);
      const x = -63 + cx * 6, z = WZ + 2 + 3 + cz * 6;
      return { p: [x, 0.02, z], r: [0, (r() - 0.5) * 0.03, 0], s: [5.7, 0.3, 5.7], c: col((cx + cz) % 2 ? '#E8DBC4' : '#9C4A36').multiplyScalar(0.88 + r() * 0.14) };
    }, { cast: false }));

    // le vitrail qui s'illumine (losanges de feutrine lumineuse, plombs de fil sombre)
    const VC = [4, 31, WZ], vw = 13, vh = 24;
    const glass = [];
    for (let j = 0; j < 14; j++) for (let i = 0; i < 8; i++) {
      const x = -vw / 2 + (i + 0.5 + (j % 2) * 0.5) * (vw / 8), y = (j + 0.5) * (vh / 14);
      const ax = Math.abs(x) / (vw / 2), top = y - (vh - vw / 2);
      if (ax > 0.98) continue;
      if (top > 0 && Math.hypot(x, top) > vw / 2 - 0.6) continue;
      glass.push([x, y]);
    }
    const glassIM = new T.InstancedMesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }), glass.length);
    const GC = ['#E8343A', '#2E64E0', '#F5C030', '#2E9E5A', '#E8343A', '#F5C030', '#7A46C8'];
    glass.forEach(([x, y], i) => {
      m4.compose(v3(VC[0] + x, VC[1] + y, VC[2]), new T.Quaternion().setFromAxisAngle(v3(0, 0, 1), Math.PI / 4), s4.setScalar(vw / 8 / 1.414 * 0.92));
      glassIM.setMatrixAt(i, m4);
      glassIM.setColorAt(i, col(GC[(i * 3 + Math.floor(y)) % GC.length]).multiplyScalar(1.6));
    });
    glassIM.castShadow = false;
    V.add(glassIM);
    const glassBack = mesh(new T.PlaneGeometry(vw + 1, vh + 1), wool('#2A1A14', 'felt'), { cast: false });
    at(glassBack, VC[0], VC[1] + vh / 2, VC[2] - 0.6);
    V.add(glassBack);
    // bannières de feutrine rouge et or
    const banners = [-15, 22].map((x, i) => {
      const g = new T.Group();
      const sh = new T.Shape();
      sh.moveTo(-5.5, 0); sh.lineTo(5.5, 0); sh.lineTo(5.5, -24); sh.lineTo(0, -28.5); sh.lineTo(-5.5, -24); sh.lineTo(-5.5, 0);
      g.add(feltPiece(sh, RED, { depth: 0.5, inset: 0.6, stitch: GOLD, st: { len: 0.5, gap: 0.3, r: 0.08 } }));
      const crownSh = polyShape([[-3, 0], [3, 0], [3.4, 3.2], [1.7, 1.6], [0, 4], [-1.7, 1.6], [-3.4, 3.2]]);
      const cr = feltPiece(crownSh, GOLD, { depth: 0.35, inset: 0.3, stitch: '#FFF0B0', st: { len: 0.3, gap: 0.2, r: 0.05 } });
      at(cr, 0, -11, 0.4);
      g.add(cr);
      for (const s of [-1, 1]) { const b = bead(0.5, '#2E64E0'); at(b, s * 1.7, -9.6, 0.62); g.add(b); }
      g.add(at(mesh(yarnGeo([[-7, 0.6, 0], [7, 0.6, 0]], 0.45, { radial: 8 }), gold), 0, 0, 0));
      for (const s of [-1, 1]) g.add(at(bead(0.8, GOLD), s * 7.2, 0.6, 0));
      noCast(g);
      at(g, x, 49, WZ + 3.6);
      V.add(g);
      return g;
    });
    // torches murales : bougeoir de fer, flamme vivante et son halo
    const torches = [-24.5, 30].map((x) => {
      const g = new T.Group();
      g.add(mesh(latheGeo([[0.01, 0], [0.9, 0.2], [1.6, 1.6], [1.8, 2.4], [1.5, 2.5], [0.01, 2.0]], { seg: 14 }), metalMat('#3A3230', { rough: 0.5 })));
      g.add(at(mesh(new T.CylinderGeometry(0.55, 0.45, 5, 10), woodMat('#6A4426')), 0, -2.2, 0));
      g.add(at(mesh(new T.BoxGeometry(0.6, 0.6, 4), metalMat('#3A3230', { rough: 0.5 })), 0, -2.8, -2));
      const fl = flame(V, { s: 1.5, power: 650, dist: 80, light: '#FF9A40' });
      fl.position.y = 2.2;
      g.add(fl);
      at(g, x, 30, WZ + 4.4);
      V.add(g);
      const halo = new T.Mesh(new T.PlaneGeometry(16, 16), new T.MeshBasicMaterial({ map: sprite('soft'), color: col('#FF9A40').multiplyScalar(0.5), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      at(halo, x, 33.5, WZ + 3.2);
      V.add(halo);
      return { g, fl, halo };
    });
    // le grand chandelier doré du premier plan
    const cand = new T.Group();
    cand.add(mesh(latheGeo([[0.01, 0], [3.2, 0], [3.4, 0.6], [1.2, 1.4], [0.7, 4], [1.1, 4.6], [0.6, 5.2], [0.55, 20], [1.4, 20.6], [0.01, 21]], { seg: 18 }), gold));
    cand.add(at(mesh(yarnGeo([[-5, 21, 0], [-4.6, 24.2, 0], [-2, 21.6, 0], [0, 21.2, 0], [2, 21.6, 0], [4.6, 24.2, 0], [5, 21, 0]], 0.35, { radial: 6 }), gold), 0, 0, 0));
    for (const x of [-5, 0, 5]) {
      cand.add(at(mesh(new T.CylinderGeometry(0.55, 0.6, x ? 4 : 5, 12), wool('#FFF4DA', 'felt')), x, (x ? 21 : 21.2) + (x ? 2.4 : 2.9), 0));
    }
    bake(cand);
    const cfl = flame(V, { s: 0.95, power: 420, dist: 60 });
    cfl.position.set(0, 26.5, 0);
    cand.add(cfl);
    const sideFl = [-5, 5].map((x) => { const f = new T.Group(); f.add(mesh(latheGeo([[0, 0], [0.35, 0.3], [0.42, 0.7], [0.25, 1.15], [0, 1.7]], { seg: 10 }), glowMat('#FFB347', 4), { cast: false })); f.position.set(x, 25.5, 0); cand.add(f); return f; });
    at(cand, -30, 0, 10);
    V.add(cand);

    /* ---------- le roi Dagobert et sa culotte ---------- */
    const KX = 6, KZ = -6, KH = 15;
    const king = doll({ h: KH, skin: '#F3C9A6', top: RED, sleeves: RED, belt: GOLD, legs: '#5E2A30', shoes: '#3A1E16', hair: '#4A2E1C', hairStyle: 'short', fringe: false, beard: '#4A2E1C', cape: '#C62E3A', collar: '#FFFFFF', ruff: true, cheeks: '#F29A8A', hat: { type: 'crown', color: GOLD } });
    const kR = king.R, kL = KH * 0.2;
    // les deux jambes de la culotte bouffante : à l'envers (doublure, coutures, étiquette, poche) / à l'endroit
    const wrong = [], right = [];
    [king.p.legL, king.p.legR].forEach((leg, li) => {
      const s = li ? 1 : -1;
      const W = new T.Group(), Rg = new T.Group();
      const puff = (c) => woolBall(1.5, c, 'knit', { sx: 1.0, sy: 1.12, sz: 1.08, seed: 3 + li, seg: 18, fuzz: 0.06, mat: { scale: 0.5 } });
      const pw = puff('#EFE3C8');
      at(pw, s * 0.25, -0.75, 0);
      W.add(pw);
      // coutures retournées : un gros fil le long de la jambe et des points en travers
      const sm = [yarnGeo([[s * 1.12, 0.9, 1.1], [s * 1.25, -0.6, 1.2], [s * 1.0, -1.9, 0.95]], 0.13, { radial: 4, maxSeg: 12 }), yarnGeo([[s * 1.66, 0.5, 0], [s * 1.78, -0.8, 0.05], [s * 1.5, -2.0, 0]], 0.13, { radial: 4, maxSeg: 12 })];
      for (let k = 0; k < 6; k++) { const y = 0.6 - k * 0.48, x = s * (1.18 - k * 0.02); sm.push(yarnGeo([[x - 0.3, y, 1.2], [x, y, 1.32], [x + 0.3, y, 1.2]], 0.08, { radial: 3, maxSeg: 4 })); }
      sm.push(yarnGeo([[-1.4, -1.85, 0.7], [0, -2.2, 1.1], [1.4, -1.85, 0.7]], 0.1, { radial: 3, maxSeg: 10 }));
      const seam = mesh(mergeGeos(sm), wool('#8A6A3E', 'yarn'), { cast: false });
      at(seam, s * 0.25, -0.75, 0);
      W.add(seam);
      // des fils qui pendent
      W.add(mesh(yarnGeo([[s * 0.6, -2.4, 0.7], [s * 0.75, -3.0, 0.8], [s * 0.6, -3.5, 0.9]], 0.05, { radial: 3, maxSeg: 6 }), wool('#C9B488', 'yarn'), { cast: false }));
      if (li === 0) {
        // l'étiquette, bien visible
        const tag = feltPiece(roundRectShape(1.7, 2.1, 0.25), '#FFFFFF', { depth: 0.14, inset: 0.18, stitch: '#D23A3A', st: { len: 0.16, gap: 0.11, r: 0.035 } });
        tag.add(mesh(mergeGeos([yarnGeo([[-0.38, 0.28, 0.08], [0.38, 0.28, 0.08]], 0.04, { radial: 3 }), yarnGeo([[-0.38, -0.05, 0.08], [0.25, -0.05, 0.08]], 0.04, { radial: 3 }), yarnGeo([[-0.38, -0.36, 0.08], [0.32, -0.36, 0.08]], 0.04, { radial: 3 })]), wool('#2A62C8', 'plain'), { cast: false }));
        at(tag, 0.3, 0.55, 1.62);
        tag.rotation.set(-0.35, 0.25, -0.2);
        W.add(tag);
      } else {
        // la poche retournée qui pend
        const pocket = woolBall(0.8, '#FFFFFF', 'felt', { sx: 0.95, sy: 1.35, sz: 0.5, fuzz: false, seg: 12 });
        at(pocket, s * 1.75, -1.15, 0.65);
        pocket.rotation.set(0.2, s * 0.6, s * 0.35);
        W.add(pocket);
        W.add(at(mesh(yarnGeo([[s * 1.3, -0.25, 0.75], [s * 1.75, -0.2, 0.5]], 0.07, { radial: 3 }), wool('#6A5A40', 'plain'), { cast: false }), 0, 0, 0));
      }
      // à l'endroit : velours bleu roi, revers et clous dorés
      const pr = puff('#2B4AA0');
      at(pr, s * 0.25, -0.75, 0);
      Rg.add(pr);
      const hem = mesh(new T.TorusGeometry(1.15, 0.22, 6, 20), wool(GOLD, 'felt'));
      hem.rotation.x = Math.PI / 2;
      at(hem, s * 0.25, -2.15, 0);
      Rg.add(hem);
      for (let k = 0; k < 3; k++) { const b = bead(0.17, GOLD); at(b, s * 0.25 + (k - 1) * 0.6, -0.6 + (k % 2) * 0.5, 1.33); Rg.add(b); }
      leg.add(W, Rg);
      wrong.push(W); right.push(Rg);
    });
    // la ceinture de la culotte
    const band = new T.Group();
    const bw = mesh(new T.TorusGeometry(KH * 0.15 * 1.02, 0.32, 6, 24), wool('#ECDDBF', 'knit', { scale: 0.5 }));
    const br2 = mesh(new T.TorusGeometry(KH * 0.15 * 1.02, 0.32, 6, 24), wool('#2B4AA0', 'knit', { scale: 0.5 }));
    for (const m of [bw, br2]) { m.rotation.x = Math.PI / 2; m.position.y = 0.25; band.add(m); }
    king.p.body.add(band);
    right.push(br2); wrong.push(bw);
    // les joues qui rougissent, et la petite fumée de la honte
    const blush = [-1, 1].map((s) => {
      const q = surf([kR, kR * 0.95, kR * 0.92], s * 40, -10);
      const c = felt(circleShape(kR * 0.3), '#E8424E', 0.12, { fuzz: false });
      faceTo(at(c, q.p.x, q.p.y, q.p.z), q.n);
      c.scale.setScalar(0.001);
      king.p.head.add(c);
      return c;
    });
    const puffs = [0, 1, 2].map((i) => { const p = woolBall(0.7, '#FFFFFF', 'crochet', { fuzz: false, seg: 10 }); p.visible = false; V.add(p); return p; });
    slim(king.g, 1.6);
    king.p.head.rotation.order = 'YXZ';
    at(king.g, KX, 0, KZ);
    V.add(king.g);
    V.boilable(king.g, 0.05, 0.6);
    const kingSh = contactShadow(7, 6, 0.5);
    at(kingSh, KX, 0.5, KZ);
    V.add(kingSh);
    const blinkK = blinker(king.p.eyes, 13);
    const setRight = (on) => { wrong.forEach((g) => { g.visible = !on; }); right.forEach((g) => { g.visible = on; }); };
    setRight(false);

    /* ---------- saint Éloi : mitre, crosse, chasuble ---------- */
    const EH = 15.5;
    const eloi = doll({ h: EH, skin: '#F1C7A8', top: '#F3EEE2', sleeves: '#E3B64A', dress: true, collar: GOLD, legs: '#F3EEE2', shoes: '#7A2A2A', hair: '#EFEBE4', hairStyle: 'tonsure', beard: '#F4F1EC', cheeks: '#F29A8A' });
    const eR = eloi.R, eB = EH * 0.4, eL = EH * 0.2, ebr = EH * 0.15;
    // la chasuble : un panneau doré et sa croix rouge
    const chas = feltPiece(polyShape([[-2.0, -2.2], [2.0, -2.2], [1.6, 2.8], [0, 3.2], [-1.6, 2.8]]), '#E3B64A', { depth: 0.25, inset: 0.3, stitch: '#FFF1C0', st: { len: 0.25, gap: 0.18, r: 0.04 } });
    chas.add(at(mesh(new T.BoxGeometry(0.75, 4.4, 0.12), wool(RED, 'felt')), 0, 0.4, 0.15));
    chas.add(at(mesh(new T.BoxGeometry(2.6, 0.75, 0.12), wool(RED, 'felt')), 0, 1.6, 0.15));
    at(chas, 0, eB * 0.45, ebr * 1.34);
    chas.rotation.x = -0.32;
    eloi.p.body.add(chas);
    // la mitre
    const mitre = new T.Group();
    const mSh = blobShape([[-1, 0], [1, 0], [1.05, 0.9], [0.82, 1.75], [0.3, 2.45], [0, 2.75], [-0.3, 2.45], [-0.82, 1.75], [-1.05, 0.9]].map(([x, y]) => [x * eR * 0.95, y * eR]), 40);
    const mf = feltPiece(mSh, '#FBF7EE', { depth: eR * 1.2, inset: 0.3, stitch: GOLD, st: { len: 0.3, gap: 0.18, r: 0.06 } });
    mitre.add(mf);
    mitre.add(at(mesh(new T.BoxGeometry(0.4, 1.9, 0.2), wool(GOLD, 'felt')), 0, eR * 1.25, eR * 0.62));
    mitre.add(at(mesh(new T.BoxGeometry(1.3, 0.4, 0.2), wool(GOLD, 'felt')), 0, eR * 1.45, eR * 0.62));
    mitre.add(at(mesh(new T.BoxGeometry(eR * 2.0, 0.55, eR * 1.25), wool(GOLD, 'felt')), 0, 0.25, 0));
    at(mitre, 0, eR * 0.62, -eR * 0.05);
    mitre.rotation.x = -0.08;
    eloi.p.head.add(mitre);
    slim(eloi.g, 1.6);
    eloi.p.head.rotation.order = 'YXZ';
    V.add(eloi.g);
    V.boilable(eloi.g, 0.05, 0.6);
    const eloiSh = contactShadow(7, 6, 0.5);
    V.add(eloiSh);
    const blinkE = blinker(eloi.p.eyes, 29);
    // la crosse d'or, tenue par la main gauche
    const eSh = v3(ebr * 0.92, eL + eB * 0.86, 0);
    const eReach = v3(0.42, -0.6, 0.68).normalize();
    const eGrip = eSh.clone().add(eReach.clone().multiplyScalar(EH * 0.2 + 0.1));
    const crozPiv = new T.Group();
    crozPiv.position.copy(eGrip);
    eloi.g.add(crozPiv);
    const spiral = [[0, -eGrip.y + 0.3, 0], [0, 6, 0], [0, 13, 0], [0.1, 15.2, 0], [0.9, 16.6, 0], [2.2, 16.9, 0], [3.1, 16.0, 0], [2.9, 14.8, 0], [2.0, 14.5, 0], [1.6, 15.2, 0], [2.1, 15.7, 0]];
    crozPiv.add(mesh(yarnGeo(spiral, 0.3, { radial: 8, maxSeg: 80 }), metalMat(GOLD, { rough: 0.3 })));
    crozPiv.add(at(bead(0.55, '#C8233A'), 0, 13.1, 0));
    const eGripPose = { x: Math.atan2(-eReach.z, -eReach.y), z: Math.asin(eReach.x) };

    /* ---------- les trompettes de la fin, au bout de leur fil ---------- */
    const trumpets = [[-20, 1], [24, -1]].map(([x, s], i) => {
      const g = new T.Group();
      const tb = new T.Group();
      tb.add(mesh(latheGeo([[0.25, 0], [0.32, 8], [0.6, 9.4], [1.4, 10.4], [2.4, 10.9], [2.5, 11.1], [0.01, 10.6]], { seg: 20 }), metalMat('#F0C04A', { rough: 0.25 })));
      tb.add(at(mesh(latheGeo([[0.01, 0], [0.45, 0.2], [0.3, 0.6], [0.3, 1]], { seg: 10 }), metalMat('#F0C04A', { rough: 0.25 })), 0, -0.8, 0));
      tb.rotation.z = s * -1.1;
      g.add(tb);
      const flag = feltPiece(polyShape([[0, 0], [5.4, 0], [5.4, -4.2], [2.7, -5.6], [0, -4.2]]), RED, { depth: 0.25, inset: 0.35, stitch: GOLD, st: { len: 0.3, gap: 0.2, r: 0.05 } });
      const fcr = felt(polyShape([[-1.2, 0], [1.2, 0], [1.4, 1.3], [0.7, 0.7], [0, 1.6], [-0.7, 0.7], [-1.4, 1.3]]), GOLD, 0.15, { fuzz: false });
      at(fcr, 2.7, -3.0, 0.2);
      flag.add(fcr);
      at(flag, s * 1.8 - (s > 0 ? 0 : 5.4), 2.0, 0.3);
      g.add(flag);
      noCast(g);
      at(g, x, 34, -6);
      const hg = hang(g, 120, { amp: 2, per: 3.3 + i * 0.4 });
      V.add(hg);
      swingAnim(V, hg);
      return { hg, g, tb, s };
    });

    /* ---------- particules ---------- */
    let conf = null;
    if (!PORTRAIT) {
      pointCloud(V, { n: 70, box0: [-34, 2, -26], box1: [34, 50, 16], size: 1.1, color: '#FFE2B0', opacity: 0.45, vel: [0.2, 0.25, 0.1], wander: 2.2, beam: 0.6, keyDir: [-0.45, 0.6, 0.5] });
      for (const T2 of torches) pointCloud(V, { n: 14, box0: [T2.g.position.x - 1.5, 32, WZ + 3.6], box1: [T2.g.position.x + 1.5, 44, WZ + 5.2], size: 0.8, sprite: 'spark', color: '#FFB050', glow: 2, twinkle: 1, wander: 0.6, vel: [0, 3, 0], opacity: 0.9 });
      conf = confetti(V, { kinds: ['star', 'disc'], n: 40, size: 0.95 });
    }
    const PARTY = ['#F5C030', '#E8B83A', '#FFF0B0', '#C8233A', '#FFFFFF'];
    V.onHome = (c) => { V.cue('crown'); if (conf) conf.burst(v3(KX, 18.5, KZ), 8, [c, '#F5C030', '#FFF0B0'], 0.5, 0.5); };

    /* ---------- animation ---------- */
    let nCount = 0, done = false, doneT = -1e9, ph = 0, p = 0, pFrom = 0, pT = -1e9, blushK = 0, blushT = -1e9, pointT = -1e9, fanfare = true;
    const EX0 = -19, EX1 = -6.5, kingCrotch = v3();
    V.anim((t, f) => {
      // les torches et le chandelier
      const nk = bump(sat(V.age('note') / 0.3));
      torches.forEach((T2, i) => { T2.halo.material.opacity = 0.85 + hashi(f, i + 3) * 0.3 + nk * 0.3; T2.fl.userData.power = 650 * (done ? 1.25 : 1) * (1 + nk * 0.35); T2.fl.scale.setScalar(1 + nk * 0.25); });
      sideFl.forEach((S, i) => { S.scale.set(1, 0.85 + hashi(f, i + 11) * 0.3, 1); S.rotation.z = (hashi(f, i + 21) - 0.5) * 0.3; });
      banners.forEach((B, i) => { B.rotation.x = -0.02 - Math.abs(Math.sin(t * 0.8 + i)) * 0.015 - bump(sat(V.age('fete') / 1.5)) * 0.06; B.rotation.z = Math.sin(t * 0.6 + i * 2) * 0.012; });
      const noteK = bump(sat(V.age('note') / 0.3));
      // saint Éloi avance à mesure qu'on retrouve les notes
      const wk = sat((t - pT) / 1.2), eloiP = lerp(pFrom, p, smooth(wk));
      const ek = done ? 1 : smooth(eloiP * 1.25);
      const ex = lerp(EX0, EX1, ek), ez = lerp(-1, -4.2, ek);
      const walking = wk < 1 && Math.abs(p - pFrom) > 0.005;
      blinkE(t, f);
      eloi.g.position.set(ex, Math.abs(Math.sin(t * 8)) * (walking ? 0.5 : 0) + noteK * 0.25, ez);
      const pointing = ph >= 2 && !done ? smooth(sat((t - pointT) / 0.5)) : 0;
      eloi.g.rotation.y = lerp(1.05, 1.42, pointing);
      eloiSh.position.set(ex, 0.5, ez);
      const E = eloi.p;
      E.legL.rotation.x = walking ? Math.sin(t * 8) * 0.4 : 0;
      E.legR.rotation.x = walking ? -Math.sin(t * 8) * 0.4 : 0;
      // il montre la culotte du doigt (à partir de la deuxième phrase)
      king.p.legR.updateWorldMatrix(true, false);
      kingCrotch.set(0, -0.6, 0.6).applyMatrix4(king.p.legR.matrixWorld);
      const point = ph >= 2 && !done ? smooth(sat((t - pointT) / 0.5)) : 0;
      const pt = aim(E.armL, kingCrotch);
      const shake = Math.sin(t * 11) * 0.06 * point;
      E.armL.rotation.set(lerp(-0.15, pt.x, point) + shake, 0, lerp(-0.15, pt.z, point));
      E.armR.rotation.set(eGripPose.x, 0, eGripPose.z);
      crozPiv.rotation.set(Math.sin(t * 0.9) * 0.03 + (walking ? Math.sin(t * 8) * 0.04 : 0), 0, Math.sin(t * 0.7) * 0.03 - noteK * 0.12);
      crozPiv.position.y = eGrip.y + noteK * 0.5;
      const fete = done ? sat((t - doneT - 2) / 0.5) : 0;
      if (fete > 0) { const cheer = bump(((t - doneT) * 1.2) % 1); E.armL.rotation.set(-2.6 - cheer * 0.3, 0, -0.3); }
      E.head.rotation.set(0.05 + noteK * 0.18 + (point ? 0.12 : 0), -0.35 + Math.sin(t * 0.5) * 0.08, Math.sin(t * 0.9) * 0.05 + (point ? 0.1 : 0));
      // le roi : fier, puis rouge de honte, puis il tourne et se remet à l'endroit
      blinkK(t, f);
      const K = king.p;
      const da = done ? t - doneT : -1;
      let spin = 0, hop = 0;
      if (da >= 0 && da < 1.8) { spin = easeInOut(da / 1.8) * TAU * 3; hop = Math.sin(Math.PI * sat(da / 1.8)) * 2.2; }
      setRight(done && da >= 0.9);
      // pendant l'écoute : un petit pas de menuet, d'un pied sur l'autre
      const side = nCount % 2 ? 1 : -1;
      king.g.rotation.set(0, -0.18 + spin + noteK * side * 0.25, noteK * side * 0.1);
      K.legL.rotation.x = side < 0 ? -noteK * 0.7 : 0;
      K.legR.rotation.x = side > 0 ? -noteK * 0.7 : 0;
      king.g.position.y = 0.35 + hop + noteK * 0.3 + bump(sat(V.age('proud') / 0.5)) * 1.2;
      kingSh.scale.setScalar(1 - hop * 0.05);
      const shame = blushK * (done ? 0 : 1);
      // bras : poings sur les hanches ; honteux, il cache sa culotte ; à la fin, bras au ciel
      const hipsZ = 0.62, hipsX = 0.35;
      let aLx = hipsX, aLz = -hipsZ, aRx = hipsX, aRz = hipsZ;
      if (shame) { aLx = lerp(aLx, -0.55, shame); aLz = lerp(aLz, 0.45, shame); aRx = lerp(aRx, -0.55, shame); aRz = lerp(aRz, -0.45, shame); }
      if (da >= 0 && da < 1.8) { aLx = -0.2; aLz = -1.2; aRx = -0.2; aRz = 1.2; }
      if (fete > 0) { const w = Math.sin(t * 6) * 0.25; aLx = lerp(aLx, -0.3, fete); aLz = lerp(aLz, -2.5 - w, fete); aRx = lerp(aRx, -0.3, fete); aRz = lerp(aRz, 2.5 + w, fete); }
      K.armL.rotation.set(aLx, 0, aLz);
      K.armR.rotation.set(aRx, 0, aRz);
      K.body.rotation.set(-0.06 + shame * 0.12, 0, Math.sin(t * 1.4) * 0.03);
      const lookEloi = ph >= 1 && !done ? 0.7 : 0;
      K.head.rotation.set(-0.12 + shame * 0.3 + noteK * 0.12, -lookEloi * (1 - shame) + Math.sin(t * 0.4) * 0.15 * (1 - lookEloi), Math.sin(t * 0.7) * 0.05);
      // les joues rouges
      const bk = shame ? sat((t - blushT) / 0.6) : 0;
      blush.forEach((c) => c.scale.setScalar(Math.max(0.001, easeOutBack(bk) * (1 + Math.sin(t * 6) * 0.05))));
      puffs.forEach((P, i) => {
        const a = ((t * 0.9 + i / 3) % 1);
        P.visible = shame > 0.5;
        if (!P.visible) return;
        P.position.set(KX + (i - 1) * 2.2 + Math.sin(t * 2 + i) * 0.4, 18.5 + a * 6, KZ + 0.5);
        P.scale.setScalar(0.4 + a * 0.9);
      });
      // la couronne scintille quand une note s'y pose
      if (king.p.hat) king.p.hat.rotation.y = bump(sat(V.age('crown') / 0.6)) * 0.6;
      // fanfare : les trompettes descendent et sonnent
      const tk = done ? easeOutBack(sat((t - doneT - 1.4) / 1.0), 1.2) : 0;
      trumpets.forEach((Tr, i) => {
        Tr.hg.position.y = lerp(60, -3, tk);
        const toot = done ? bump(((t - doneT) * 2.2 + i * 0.5) % 1) : 0;
        Tr.tb.scale.set(1 + toot * 0.08, 1 + toot * 0.12, 1 + toot * 0.08);
      });
      if (!fanfare && t - doneT > 1.9) {
        fanfare = true;
        if (conf) {
          conf.burst(v3(KX, 20, KZ), 40, PARTY, 1.25, 1.1);
          trumpets.forEach((Tr) => { const bp = v3(0, 10.8, 0); Tr.tb.localToWorld(bp); conf.burst(bp, 12, PARTY, 0.9, 0.7); });
        }
      }
    });

    return {
      update(st, first) {
        const nph = st.phrasesDone || 0, np = st.done ? 1 : st.p;
        if (nph >= 2 && (ph < 2 || first)) pointT = first ? -1e9 : V.now + 1 / FPS;
        if (np !== p || first) { const wk = sat((V.now - pT) / 1.2); pFrom = first ? np : lerp(pFrom, p, smooth(wk)); pT = first ? -1e9 : V.now + 1 / FPS; }
        if (nph >= 3 && (ph < 3 || first)) blushT = first ? -1e9 : V.now + 1 / FPS;
        ph = nph;
        p = np;
        blushK = nph >= 3 ? 1 : 0;
        if (st.done && (!done || first)) { doneT = first ? -1e9 : V.now + 1 / FPS; fanfare = first; }
        done = !!st.done;
        if (!done) setRight(false);
      },
      react(kind) {
        if (kind === 'correct') V.cue('proud');
        if (kind === 'phrase') V.cue('proud');
        if (kind === 'complete') V.cue('fete');
      },
      note(n, on) {
        if (!on) return;
        nCount++;
        V.cue('note');
      },
    };
  },
};
