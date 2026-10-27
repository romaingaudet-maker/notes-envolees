/* ------------------------------------------------------------------
   L'accueil de la version laine : un petit théâtre.
   En haut, la scène : le titre en guirlande de lettres de feutrine
   suspendue entre deux aiguilles à tricoter, les dernières lettres qui
   s'envolent, des notes ailées qui chantent quand on les touche.
   Puis le fil rouge, qui passe de tambour à broder en tambour à broder :
   chaque tambour montre le décor de sa comptine (rendu par le même
   moteur, quatre images qui frémissent). En bas, deux liens vers les
   pages à part : « Comment jouer » et les mentions légales.
------------------------------------------------------------------- */
const HOME_BG = '#231A33';

/* contour d'une lettre → formes THREE (à l'échelle k, en cm) */
function glyphShapes(ch, k) {
  const G = GLYPHES[ch];
  if (!G) return [];
  const sp = new T.ShapePath();
  for (const tk of G.d.split(' ')) {
    const c = tk[0], n = tk.slice(1).split(',').map((v) => +v * k);
    if (c === 'M') sp.moveTo(n[0], n[1]);
    else if (c === 'L') sp.lineTo(n[0], n[1]);
    else if (c === 'Q') sp.quadraticCurveTo(n[0], n[1], n[2], n[3]);
    else if (c === 'C') sp.bezierCurveTo(n[0], n[1], n[2], n[3], n[4], n[5]);
  }
  return sp.toShapes(false);
}

/* une lettre de feutrine cousue ; l'origine est au point d'accroche (en haut, au milieu) */
function feltLetter(ch, color, k) {
  const shapes = glyphShapes(ch, k);
  const g = new T.Group();
  const body = new T.Group();
  const depth = 0.8;
  const mat = wool(color, 'felt', { sheen: 0.8 });
  let box = new T.Box3();
  shapes.forEach((s) => {
    const m = mesh(feltGeo(s, depth, { bevel: 0.25, curve: 10 }), mat);
    body.add(m);
    box.expandByObject(m);
    const st = lighten(color, 0.6).getStyle();
    body.add(stitches(insetPoly(outline2D(s, 140), 0.55), depth / 2 + 0.02, st, { len: 0.42, gap: 0.3, r: 0.07 }));
    s.holes.forEach((h) => {
      const pts = h.getSpacedPoints(60);
      if (pts.length > 2 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-4) pts.pop();
      body.add(stitches(insetPoly(pts, -0.5), depth / 2 + 0.02, st, { len: 0.38, gap: 0.28, r: 0.06 }));
    });
  });
  const c = box.getCenter(v3()), sz = box.getSize(v3());
  body.position.set(-c.x, -box.max.y - 1.2, 0);
  g.add(body);
  g.userData.size = sz;
  g.userData.body = body;
  return g;
}

/* pelote de laine : une âme tricotée et des tours de fil dans tous les sens */
function yarnBall(r, color, seed = 1) {
  const g = new T.Group();
  const core = mesh(blobGeo(r * 0.97, r * 0.95, r * 0.97, { seg: 24, lump: 0.03, seed }), wool(color, 'yarn', { scale: 1 }));
  g.add(core);
  const R = rng(seed * 7 + 1);
  const yc = lighten(color, 0.08).getStyle();
  for (let i = 0; i < 9; i++) {
    const q = new T.Quaternion().setFromEuler(new T.Euler(R() * TAU, R() * TAU, R() * TAU));
    const pts = [];
    for (let j = 0; j < 40; j++) { const a = (j / 40) * TAU; pts.push(v3(Math.cos(a) * r * 1.01, Math.sin(a) * r * 1.01, 0).applyQuaternion(q)); }
    g.add(yarn(pts, r * 0.07, i % 3 ? yc : color, { closed: true, radial: 6 }));
  }
  return g;
}
function needle(len, color = '#C9965C', knob = '#E5484D') {
  const g = new T.Group();
  const shaft = mesh(latheGeo([[0.02, 0], [0.45, 2.5], [0.55, 4], [0.55, len], [0, len]], { seg: 12 }), woodMat(color, { rough: 0.45 }));
  g.add(shaft);
  const k = mesh(blobGeo(1.3, 1.1, 1.3, { seg: 16, lump: 0 }), plastic(knob, { rough: 0.3 }));
  k.position.y = len + 0.6;
  g.add(k);
  return g;
}
function spool(color, h = 6) {
  const g = new T.Group();
  const w = woodMat('#D9B07A', { rough: 0.5 });
  for (const y of [0, h]) { const d = mesh(new T.CylinderGeometry(2.4, 2.4, 0.7, 24), w); d.position.y = y + 0.35; g.add(d); }
  const th = mesh(new T.CylinderGeometry(1.9, 1.9, h - 0.6, 28, 1), wool(color, 'yarn'));
  scaleUV(th.geometry, 4, 1);
  th.position.y = h / 2 + 0.35;
  g.add(th);
  return g;
}

/* ---------------- la scène de l'accueil ---------------- */
function buildHero(V, o = {}) {
  const S = V.scene;
  // lumière de théâtre : une poursuite chaude, un contre-jour froid
  const spot = new T.SpotLight(col('#FFE2B8'), 5.5, 0, 0.42, 0.75, 0);
  spot.position.set(-70, 150, 120);
  spot.target.position.set(0, 42, 0);
  spot.castShadow = true;
  const sz = Engine.tier === 0 ? 1024 : 2048;
  spot.shadow.mapSize.set(sz, sz);
  spot.shadow.camera.near = 80; spot.shadow.camera.far = 420;
  spot.shadow.bias = -0.0003; spot.shadow.normalBias = 0.06; spot.shadow.radius = 5;
  S.add(spot, spot.target);
  const rim = new T.DirectionalLight(col('#A9B6FF'), 1.4);
  rim.position.set(90, 80, -80);
  S.add(rim);
  S.add(new T.HemisphereLight(col('#4A3A6A'), col('#2A1A12'), 0.45));
  S.environment = envMap('#3A2A55', '#120C10', '#FFE7C9', 3);
  S.environmentIntensity = 0.4;

  // rideau de velours (tricot) aux plis profonds
  const cw = 340, ch = 190;
  const cg = new T.PlaneGeometry(cw, ch, 160, 2);
  const cp = cg.attributes.position;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i); cp.setZ(i, Math.sin(x * 0.21) * 3.2 + Math.sin(x * 0.53 + 1) * 1.1); }
  cg.computeVertexNormals();
  scaleUV(cg, cw, ch);
  const curtain = mesh(cg, wool('#5B1F45', 'knit', { scale: 1.3, sheen: 1, sheenColor: '#C46AA2', bump: 0.8 }), { cast: false });
  curtain.position.set(0, ch / 2 - 6, -48);
  S.add(curtain);
  // l'établi : un plateau de bois sombre
  const top = mesh(new T.BoxGeometry(300, 4, 120), woodMat('#5A3826', { rough: 0.55, scale: 2 }), { cast: false });
  scaleUV(top.geometry, 300, 120);
  top.position.set(0, -2, 10);
  S.add(top);

  // deux pelotes, deux aiguilles plantées, la guirlande tendue entre elles
  const k = 0.135;
  const lines = [['Les', 'Notes'], ['Envolées']];
  const ballL = yarnBall(13, '#E9B949', 3); ballL.position.set(-47, 12.4, -4); S.add(ballL);
  const ballR = yarnBall(11.5, '#4E8FD8', 5); ballR.position.set(48, 11, -6); S.add(ballR);
  V.boilable(ballL, 0.04, 0.3); V.boilable(ballR, 0.04, 0.3);
  const nL = needle(82, '#C9965C', '#E5484D'); nL.position.set(-46, 14, -4); nL.rotation.z = -0.12; S.add(nL);
  const nR = needle(80, '#C9965C', '#8B57C9'); nR.position.set(47, 13, -6); nR.rotation.z = 0.1; S.add(nR);
  // fil qui pend de la pelote jaune jusqu'à la table
  S.add(yarn([[-40, 6, 3], [-34, 1.2, 9], [-24, 0.5, 14], [-12, 0.6, 20]], 0.85, '#E9B949', { radial: 6 }));
  // petits objets de couturière
  const sp1 = spool('#E5484D', 6.5); sp1.position.set(-24, 0, 18); S.add(sp1);
  const sp2 = spool('#1FA7A0', 5.5); sp2.position.set(30, 0, 16); sp2.rotation.z = Math.PI / 2; sp2.position.y = 2.4; S.add(sp2);
  const b1 = sewnButton(2.2, '#F5C32C', { thread: '#8A5A2A' }); b1.rotation.x = -Math.PI / 2; b1.position.set(14, 0.45, 26); S.add(b1);
  const b2 = sewnButton(1.6, '#E5484D', { holes: 2, thread: '#FFFFFF' }); b2.rotation.x = -Math.PI / 2; b2.position.set(20, 0.4, 30); S.add(b2);
  const b3 = sewnButton(1.9, '#8B57C9', { thread: '#F5C32C' }); b3.rotation.x = -Math.PI / 2; b3.rotation.z = 0.5; b3.position.set(-8, 0.42, 30); S.add(b3);
  // pelote à épingles (tomate)
  const pin = new T.Group();
  pin.add(mesh(blobGeo(6.5, 4.6, 6.5, { seg: 26, lump: 0.08, seed: 4 }), wool('#D9443A', 'crochet', { scale: 0.8 })));
  fuzz(pin.children[0], 0.1);
  for (let i = 0; i < 5; i++) { const lf = felt(leafShape(2.2, 4.4), '#4CAF5A', 0.25); lf.rotation.set(-Math.PI / 2 + 0.25, 0, (i / 5) * TAU); lf.position.set(Math.sin((i / 5) * TAU) * 1.6, 4.3, Math.cos((i / 5) * TAU) * 1.6); pin.add(lf); }
  [['#F5C32C', 0.4, 0.2], ['#3E6FD8', -0.5, 0.5], ['#FFFFFF', 0.1, -0.6], ['#E5484D', 0.7, -0.2], ['#4CAF5A', -0.2, -0.3]].forEach(([c, ax, az], i) => {
    const p = new T.Group();
    p.add(mesh(new T.CylinderGeometry(0.08, 0.08, 6, 6), metalMat('#D9D9E0', { rough: 0.25 })));
    const h = bead(0.55, c, { flat: 1 }); h.position.y = 3; p.add(h);
    p.position.set(Math.sin(i * 1.3) * 2.6, 5.2, Math.cos(i * 1.3) * 2.6);
    p.rotation.set(ax * 0.6, 0, az * 0.6);
    pin.add(p);
  });
  pin.position.set(36, 4.2, 22);
  S.add(pin);

  const strings = [{ y: 66, sag: 6.5, z: 0, x0: -45.5, x1: 46 }, { y: 44, sag: 5, z: 1.5, x0: -45, x1: 45.5 }];
  const letters = [];
  let ci = 0;
  lines.forEach((words, li) => {
    const L = strings[li];
    const str = (x) => L.y - L.sag * (1 - Math.pow((2 * (x - L.x0)) / (L.x1 - L.x0) - 1, 2));
    const pts = [];
    for (let i = 0; i <= 24; i++) { const x = lerp(L.x0, L.x1, i / 24); pts.push(v3(x, str(x), L.z)); }
    S.add(yarn(pts, 0.32, '#F2E6D2', { radial: 6 }));
    // place des lettres le long du fil
    const chars = [];
    words.forEach((w, wi) => { [...w].forEach((c) => chars.push(c)); if (wi < words.length - 1) chars.push(' '); });
    let wsum = 0;
    const adv = chars.map((c) => (c === ' ' ? 30 : GLYPHES[c].adv) * k);
    adv.forEach((a) => (wsum += a));
    let x = -wsum / 2;
    chars.forEach((c, i) => {
      const a = adv[i];
      if (c !== ' ') {
        const color = NOTE_COL[NOTE_ORDER[ci % 7]];
        const letter = feltLetter(c, color, k);
        const piv = new T.Group();
        const px = x + a / 2;
        piv.position.set(px, str(px), L.z);
        piv.add(letter);
        // pince à linge en bois
        const peg = new T.Group();
        const pw = woodMat('#E2C08D', { rough: 0.5 });
        for (const s of [-1, 1]) { const b = mesh(new T.BoxGeometry(0.55, 3.2, 0.9), pw); b.position.set(s * 0.32, -0.6, 0.2); peg.add(b); }
        const spr = mesh(new T.TorusGeometry(0.42, 0.1, 6, 12), metalMat('#C9C9D2'));
        spr.position.set(0, -0.9, 0.7);
        peg.add(spr);
        piv.add(peg);
        S.add(piv);
        const fly = li === 1 && i >= chars.length - 3; // « ées » s'envolent
        let wings = null;
        if (fly) {
          wings = [-1, 1].map((sx) => {
            const w = new T.Group();
            const f = felt(leafShape(4.2, 7.5), '#FFFFFF', 0.25, { fuzz: 0.06 });
            f.position.set(sx * 2.6, 2.2, -0.4);
            f.rotation.z = sx * -0.9;
            w.add(f);
            w.position.set(0, -6, -0.6);
            letter.add(w);
            w.visible = false;
            return w;
          });
        }
        letters.push({ piv, letter, peg, color, note: NOTE_ORDER[ci % 7], ph: hashi(ci, 4) * TAU, imp: 0, t0: -9, fly, wings, idx: letters.length, home: piv.position.clone() });
        ci++;
      }
      x += a;
    });
  });

  // notes ailées qui volent autour du titre
  const birds = [];
  ['C', 'E', 'G', 'A', 'D', 'F'].forEach((L, i) => {
    const b = noteBird(NOTE_COL[L], { s: 1.25 });
    S.add(b);
    birds.push({ g: b, L, ph: (i / 6) * TAU, sp: 0.28 + hashi(i, 9) * 0.12, r: 52 + hashi(i, 3) * 12, y: 30 + hashi(i, 5) * 46, z: 10 + hashi(i, 7) * 18, t0: -9 });
  });
  // peluches dans le faisceau
  if (!o.portrait) pointCloud(V, { n: 120, box0: [-80, 2, -40], box1: [80, 110, 50], size: 1.1, color: '#FFE9C8', opacity: 0.55, vel: [0.2, 0.45, 0.1], beam: 0.9, keyDir: [-0.45, 0.68, 0.58] });

  V.anim((t, f) => {
    letters.forEach((Lt) => {
      const age = t - Lt.t0;
      const kick = age >= 0 && age < 3 ? Lt.imp * Math.exp(-age * 1.6) * Math.sin(age * 9) : 0;
      Lt.piv.rotation.z = Math.sin(t * 0.9 + Lt.ph) * 0.06 + kick;
      Lt.piv.rotation.x = Math.sin(t * 0.7 + Lt.ph * 1.3) * 0.05;
      if (Lt.fly) {
        // envol périodique : la lettre quitte sa pince, fait une boucle et revient
        // une seule lettre en l'air à la fois
        const per = 12, dur = 3.4, start = 1.5 + (Lt.idx % 3) * 4;
        const c = ((t - start) % per + per) % per;
        const fl = c < dur;
        Lt.wings.forEach((w, s) => { w.visible = fl; w.rotation.y = (s ? -1 : 1) * (f % 2 ? 0.2 : 1.1); });
        if (fl) {
          const u = c / dur, a = u * TAU;
          const lift = Math.sin(Math.PI * u);
          Lt.letter.position.set(Math.sin(a) * 9 * lift, lift * 14 + Math.sin(a * 2) * 2, Math.cos(a) * 6 * lift - 0 * lift);
          Lt.letter.rotation.z = Math.sin(a * 2) * 0.35 * lift;
        } else { Lt.letter.position.set(0, 0, 0); Lt.letter.rotation.z = 0; }
      }
    });
    birds.forEach((B, i) => {
      const age = t - B.t0;
      const loop = age >= 0 && age < 1.2 ? age / 1.2 : -1;
      const a = t * B.sp + B.ph;
      B.g.position.set(Math.cos(a) * B.r, B.y + Math.sin(a * 2.3) * 6 + (loop >= 0 ? Math.sin(loop * TAU) * 7 : 0), B.z + Math.sin(a) * 14);
      B.g.rotation.y = -a + Math.PI / 2;
      B.g.rotation.z = loop >= 0 ? loop * TAU : Math.sin(a * 2) * 0.2;
      const w = B.g.userData.wings, up = (f + i) % 2 === 0;
      w[0].rotation.x = up ? -0.9 : 0.35; w[1].rotation.x = up ? 0.9 : -0.35;
    });
  });

  return {
    letters, birds,
    // ce qu'on peut toucher : rend la note jouée (lettre C..B) ou null
    hit(obj) {
      for (const B of birds) { let p = obj; while (p) { if (p === B.g) { B.t0 = V.now; return B.L; } p = p.parent; } }
      for (const Lt of letters) { let p = obj; while (p) { if (p === Lt.piv) { Lt.t0 = V.now; Lt.imp = 0.45; return Lt.note; } p = p.parent; } }
      return null;
    },
    targets() { return birds.map((b) => b.g).concat(letters.map((l) => l.piv)); },
  };
}

const HomeSkin = (() => {
  let hero = null; // { V, H } : la scène de l'accueil, gardée d'une visite à l'autre
  const portraits = new Map(); // thème → url d'une bande de 4 images fabriquée ici (si le fichier manque)
  /* Les portraits des décors sont fabriqués à l'avance (outils/portraits.mjs → laine/portraits/{thème}.webp) :
     les fabriquer sur le téléphone, vingt décors en 3D rendus quatre fois chacun, faisait ramer l'accueil.
     Si un fichier manque (page ouverte seule, sans le dossier), on le fabrique ici, sans se presser. */
  const PORTRAITS_BASE = window.PORTRAITS_BASE || 'portraits/';
  let lastLIB = [];
  let queue = [], busy = false, root = null, io = null, heroIO = null;
  const MIDI = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 69, B: 71 };

  function render(ctx) {
    const { app, LIB, records, inst, star, ICON, esc, titleHtml, LEVEL, framed, ONLINE_URL, eleveHtml, bindEleve } = ctx;
    // le mode de jeu : comptines fermées et prochaine à jouer (Aventure), essais du Défi
    const songState = ctx.songState || (() => ({ open: true, next: false }));
    const NX = ctx.nextToPlay ? ctx.nextToPlay() : null;
    // en Défi, la course des 20 comptines prend la place du fil des comptines (couleurs des décors en laine) ;
    // l'étape du moment se montre comme sur le fil : le tambour de son décor en 3D (le dessin, tant que l'image manque)
    const colorOf = (t) => (SCENES[t] && SCENES[t].color) || '#3A2A52';
    const picOf = (s) => portraits.get(s.theme) || (SCENES[s.theme] ? `${PORTRAITS_BASE}${s.theme}.webp` : '');
    const dhDisc = (s) => {
      const pic = picOf(s);
      return `<a class="dh-hoop${portraits.has(s.theme) ? ' has-pic' : ''}" href="#${s.id}" data-theme="${s.theme}" style="--c:${colorOf(s.theme)}" tabindex="-1" aria-hidden="true">
            <span class="hoop-ring"><span class="hoop-cloth">
              <span class="hoop-emb">${typeof Scenes !== 'undefined' ? Scenes.emblem(s.theme) : ''}</span>
              <span class="hoop-pic">${pic ? `<img src="${pic}" alt="" decoding="async">` : ''}</span>
            </span><span class="hoop-screw"><i></i></span></span>
          </a>`;
    };
    const dh = ctx.defiHomeHtml ? ctx.defiHomeHtml(colorOf, dhDisc) : '';
    const NBS = '\u00a0';
    const LEGAL_URL = ctx.LEGAL_URL || 'mentions-legales.html', HELP_URL = ctx.HELP_URL || 'comment-jouer.html';
    const gl = Engine.supported();
    lastLIB = LIB;
    const hoops = dh ? '' : LIB.map((s, i) => {
      const best = +records[s.id] || 0, best2 = +records[s.id + '@2'] || 0;
      const st = songState(s, NX);
      const c = (SCENES[s.theme] && SCENES[s.theme].color) || '#3A2A52';
      const stars = best ? `<span class="hoop-stars" aria-label="Record : ${best} étoile${best > 1 ? 's' : ''}">${[1, 2, 3].map((k) => star(k <= best, 14)).join('')}</span>` : '';
      const r2 = best2 ? `<span class="hoop-r2" aria-label="Niveau 2 : ${best2} étoile${best2 > 1 ? 's' : ''}">${ICON.metro}${'★'.repeat(best2)}</span>` : '';
      const pic = picOf(s);
      return `<li class="hoop-li${st.open ? '' : ' is-locked'}${st.next ? ' is-next' : ''}" data-i="${i}" data-theme="${s.theme}" style="--c:${c};--tilt:${((hashi(i, 3) - 0.5) * 7).toFixed(1)}deg">
        <a class="hoop${portraits.has(s.theme) ? ' has-pic' : ''}" href="#${s.id}">
          <span class="hoop-ring">
            <span class="hoop-cloth">
              <span class="hoop-emb" aria-hidden="true">${typeof Scenes !== 'undefined' ? Scenes.emblem(s.theme) : ''}</span>
              <span class="hoop-pic" aria-hidden="true">${pic ? `<img src="${pic}" alt="" loading="lazy" decoding="async">` : ''}</span>
            </span>
            <span class="hoop-screw" aria-hidden="true"><i></i></span>
            <span class="hoop-tag" aria-hidden="true">${s.level}</span>${st.open ? '' : `<span class="hoop-lock" aria-hidden="true">${ICON.lock}</span>`}${st.next ? `<span class="hoop-next" aria-hidden="true">À toi${NBS}!</span>` : ''}
          </span>
          <span class="hoop-title">${titleHtml(s.title)}</span>
          <span class="hoop-meta">${LEVEL(s.level)} · ${s.notes.length} notes${r2}</span>
          ${stars}${st.lockedBy ? `<span class="lh-sr">, fermée${NBS}: termine d’abord «${NBS}${esc(st.lockedBy.title.replace(/_/g, ' '))}${NBS}»</span>` : ''}${st.next ? '<span class="lh-sr">, la prochaine à jouer</span>' : ''}
        </a>
      </li>`;
    }).join('');
    const micNote = framed && ONLINE_URL ? `<p class="lh-online">Ici, dans claude.ai, le micro n’est pas disponible. Pour jouer avec ton instrument, ouvre la <a href="${esc(ONLINE_URL)}" target="_blank" rel="noopener">version en ligne</a>.</p>` : '';
    app.innerHTML = `
    <main class="lhome${gl ? ' has-gl' : ''}">
      <section class="lh-hero">
        <div class="lh-stage" aria-hidden="true"></div>
        <div class="lh-hero-in">
          <h1 class="lh-h1"><span class="lh-fallback">Les Notes <span>Envolées</span></span><span class="lh-sr">Les Notes Envolées</span></h1>
          <div class="lh-intro">
            <div class="lh-eleve" id="lh-eleve">${eleveHtml()}${micNote}</div>
            <p class="lh-lede"><strong>Les notes se sont envolées.</strong> Retrouve-les à l’oreille : la page t’écoute au micro.</p>
            <div class="lh-actions">
              <button class="lh-cta" type="button" id="lh-go">${dh ? 'Voir le Défi' : 'Choisir une comptine'}</button>
            </div>
          </div>
        </div>
      </section>
      ${dh ? `<section class="lh-path lh-dh" id="lh-path" aria-labelledby="dh-t"><div class="dh">${dh}</div></section>` : `<section class="lh-path" id="lh-path" aria-label="Les comptines, de la plus facile à la plus difficile">
        <header class="lh-path-head">
          <h2>Le fil des comptines</h2>
          <p>De la plus facile à la plus difficile. Chaque tambour est le décor de sa comptine.</p>
        </header>
        <div class="lh-board">
          <svg class="lh-thread" aria-hidden="true"></svg>
          <ol class="lh-hoops">${hoops}</ol>
        </div>
      </section>`}
      <section class="lh-defi" id="defi-board" aria-labelledby="db-t" hidden></section>
      <nav class="lh-foot" aria-label="À propos du jeu"><a href="${esc(HELP_URL)}">Comment jouer</a><a href="${esc(LEGAL_URL)}">Mentions légales et confidentialité</a></nav>
    </main>`;
    root = app.querySelector('.lhome');
    const toPath = () => {
      const p = app.querySelector('#lh-path');
      p.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
    };
    bindEleve(app.querySelector('.eleve-card'));
    app.querySelector('#lh-go').addEventListener('click', toPath);
    if (!dh) layoutHoops();
    // les portraits (tambours du fil, ou de l'étape du Défi) : le fichier, ou (s'il manque) fabriqué ici
    queue = [];
    app.querySelectorAll('.hoop-pic img').forEach((img) => {
      const box = img.closest('[data-theme]'), song = LIB.find((s) => s.theme === box.dataset.theme);
      const ok = () => (box.querySelector('.hoop') || box).classList.add('has-pic');
      if (img.complete && img.naturalWidth) ok();
      else {
        img.addEventListener('load', ok, { once: true });
        img.addEventListener('error', () => { img.remove(); if (gl && song) { queue.push(song); watchQueue(); } }, { once: true });
      }
    });
    // la scène 3D démarre une fois la page affichée (le texte d'abord, sans attendre la construction du décor)
    if (gl) {
      const host = app.querySelector('.lh-stage');
      requestAnimationFrame(() => setTimeout(() => { if (root && document.contains(host)) startHero(host, () => (inst().voice || 'musicbox')); }, 0));
    }
    return true;
  }

  /* le fil rouge : les tambours en serpentin, le fil passe derrière eux */
  let ro = null;
  function layoutHoops() {
    const board = root.querySelector('.lh-board'), list = board.querySelector('.lh-hoops');
    const place = () => {
      if (!document.contains(board)) return;
      const cols = getComputedStyle(list).gridTemplateColumns.split(' ').filter(Boolean).length || 2;
      list.querySelectorAll('.hoop-li').forEach((li) => {
        const i = +li.dataset.i, row = Math.floor(i / cols), k = i % cols;
        li.style.gridRow = String(row + 1);
        li.style.gridColumn = String(row % 2 ? cols - k : k + 1);
      });
      drawThread(board);
    };
    place();
    if (ro) ro.disconnect();
    if ('ResizeObserver' in window) { let raf = 0; ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); }); ro.observe(board); }
  }
  function drawThread(board) {
    const svg = board.querySelector('.lh-thread');
    const box = board.getBoundingClientRect();
    const pts = [...board.querySelectorAll('.hoop-li')].sort((a, b) => a.dataset.i - b.dataset.i).map((li) => {
      const r = li.querySelector('.hoop-ring').getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    });
    if (pts.length < 2) return;
    const W = box.width, H = box.height;
    const first = pts[0], last = pts[pts.length - 1];
    const P = [[first[0] - Math.min(110, W * 0.14), first[1] - 70], ...pts, [last[0] + (last[0] > W / 2 ? -1 : 1) * Math.min(90, W * 0.12), last[1] + 80]];
    let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    const [sx, sy] = P[0], [ex, ey] = P[P.length - 1];
    svg.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
    svg.innerHTML = `
      <path d="${d}" class="th-shadow"/>
      <path d="${d}" class="th-base"/>
      <path d="${d}" class="th-twist"/>
      <g class="th-ball" transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})"><circle r="17"/><path d="M-15 -6 C-4 -14 8 -12 16 -3 M-16 3 C-5 -6 9 -4 15 7 M-11 11 C-2 4 9 6 12 13 M-6 -15 C-12 -2 -10 9 -2 16" /></g>
      <g class="th-needle" transform="translate(${ex.toFixed(1)} ${ey.toFixed(1)}) rotate(${last[0] > W / 2 ? 205 : -25})"><path d="M0 0 L46 -3 L46 3 Z"/><ellipse cx="40" cy="0" rx="3.6" ry="1.4"/></g>`;
  }

  /* la scène 3D de l'accueil */
  /* La scène se construit par morceaux, entre deux images de la page : les textures de laine une par une,
     puis le décor, puis la compilation des programmes en arrière-plan. La page reste fluide (on peut
     défiler, toucher) ; la scène paraît quand elle est prête. */
  const slice = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 250 }) : setTimeout(r, 16)));
  async function buildHeroSlowly() {
    for (const k of Object.keys(PATTERN)) { pattern(k); await slice(); }
    fiberTexture();
    await slice();
    const V = makeView({ bg: HOME_BG, fov: 25, rig: { target: [0, 40, 0], az: 0, el: 6, box: [124, 90] }, post: { exposure: 1.02, bloom: 0.55, aper: 5.5, maxBlur: 10, sat: 1.12, lift: '#0A0412', vignette: 0.55, punch: 1.28 } });
    cueKit(V);
    const H = buildHero(V);
    V.alwaysMove = true;
    hero.V = V; hero.H = H;
    await slice();
    await Engine.prepare(V);
  }
  function startHero(host, voice) {
    if (!Engine.init()) return;
    if (!hero) hero = { ready: buildHeroSlowly() };
    hero.ready.then(() => { if (root && document.contains(host)) showHero(host, voice); });
  }
  function showHero(host, voice) {
    const { V, H } = hero;
    // le texte d'introduction posé sur la scène (grand écran) : la guirlande se cadre au-dessus
    const intro = root.querySelector('.lh-hero-in');
    V.resize = (w, h) => {
      V.size = [w, h];
      const over = intro && getComputedStyle(intro).position === 'absolute';
      const ib = over ? intro.querySelector('.lh-intro').getBoundingClientRect() : null;
      const hb = host.getBoundingClientRect();
      // grand écran : le texte à gauche, la scène cadrée à droite ; sinon le texte en bas
      if (ib && w >= 900 && w / h > 1.3) V.safe = { t: 0, r: 0, b: 0, l: Math.min(w * 0.46, ib.right - hb.left + 20) };
      else V.safe = { t: 0, r: 0, l: 0, b: ib ? Math.min(h * 0.42, ib.height + 26) : 0 };
      frameCamera(V);
    };
    Engine.attach(host);
    Engine.show(V);
    // toucher une note ou une lettre : elle chante
    const ray = new T.Raycaster(), ndc = v2();
    const pick = (e) => {
      const r = host.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, V.camera);
      const hit = ray.intersectObjects(H.targets(), true)[0];
      return hit ? hit.object : null;
    };
    host.onpointerdown = (e) => {
      const o = pick(e);
      if (!o) return;
      const L = H.hit(o);
      if (L && typeof Sound !== 'undefined' && Sound.ensure()) Sound.tap(voice(), MIDI[L], 0.6);
      Engine.poke();
    };
    let last = 0;
    host.onpointermove = (e) => {
      const now = performance.now();
      if (now - last < 90) return;
      last = now;
      host.style.cursor = pick(e) ? 'pointer' : '';
      const r = host.getBoundingClientRect();
      if (!RM.matches && matchMedia('(hover: hover)').matches) {
        V.rig.paz = (((e.clientX - r.left) / r.width) * 2 - 1) * 3;
        V.rig.pel = (((e.clientY - r.top) / r.height) * 2 - 1) * 1.5;
      }
    };
    host.onpointerleave = () => { V.rig.paz = 0; V.rig.pel = 0; };
    // la scène s'arrête quand on la quitte des yeux
    if (heroIO) heroIO.disconnect();
    if ('IntersectionObserver' in window) {
      heroIO = new IntersectionObserver((es) => {
        es.forEach((en) => {
          if (!document.contains(host) || Engine.view !== V) return; // on a quitté l'accueil
          if (en.isIntersecting) Engine.start(); else Engine.stop();
        });
      });
      heroIO.observe(host);
    }
  }

  /* portraits des décors : fabriqués un par un quand la page n'a rien d'autre à faire,
     en commençant par les tambours visibles */
  // portraits à fabriquer ici (fichiers manquants) : ceux qu'on voit d'abord, et pas avant que l'accueil soit calme
  let queueT = 0;
  function watchQueue() {
    if (window.NE_PORTRAITS_TOOL) return; // outils/portraits.mjs les fabrique tous lui-même
    clearTimeout(queueT);
    queueT = setTimeout(() => { if (root && document.contains(root)) queuePortraits(); }, 2500);
  }
  function queuePortraits() {
    if (io) io.disconnect();
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => {
        es.forEach((en) => {
          if (!en.isIntersecting) return;
          const th = en.target.dataset.theme;
          const i = queue.findIndex((s) => s.theme === th);
          if (i > 0) queue.unshift(queue.splice(i, 1)[0]);
        });
      }, { rootMargin: '200px' });
      root.querySelectorAll('.hoop-li').forEach((li) => io.observe(li));
    }
    pump();
  }
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 60));
  function pump() {
    if (busy || !queue.length) return;
    busy = true;
    idle(async () => {
      const song = queue.shift();
      try { if (root && document.contains(root)) await portrait(song); } catch (e) { /* ce portrait restera l'emblème */ }
      busy = false;
      if (root && document.contains(root)) setTimeout(pump, 40);
    });
  }
  // la bande de 4 images d'un décor (aussi pour outils/portraits.mjs)
  async function strip(song) {
    const N = 320, frames = [0, 2, 4, 6];
    const { V, S } = Decor.build(song, true);
    V.rig.dolly = 0.86;
    const nph = song.phrases.length;
    if (S.update) S.update({ world: song.theme, total: song.notes.length, found: Math.round(song.notes.length * 0.7), p: 0.7, phrasesDone: Math.round(nph * 0.6), done: false }, true);
    try { await Engine.renderer.compileAsync(V.scene, V.camera); } catch (e) { /* compilation au rendu */ }
    const shots = Engine.snapshot(V, N, N, frames);
    disposeScene(V.scene);
    const cv = document.createElement('canvas');
    cv.width = N * frames.length; cv.height = N;
    const g = cv.getContext('2d');
    shots.forEach((sh, k) => {
      const img = g.createImageData(N, N);
      for (let y = 0; y < N; y++) img.data.set(sh.px.subarray((N - 1 - y) * N * 4, (N - y) * N * 4), y * N * 4);
      g.putImageData(img, k * N, 0);
    });
    return cv;
  }
  async function portrait(song) {
    if (!root || !document.contains(root)) return;
    const cv = await strip(song);
    const url = await new Promise((res) => cv.toBlob((b) => res(b ? URL.createObjectURL(b) : cv.toDataURL('image/jpeg', 0.86)), 'image/webp', 0.86));
    portraits.set(song.theme, url);
    if (!root) return;
    root.querySelectorAll(`.hoop-li[data-theme="${song.theme}"], .dh-hoop[data-theme="${song.theme}"]`).forEach((box) => {
      box.querySelector('.hoop-pic').innerHTML = `<img src="${url}" alt="" decoding="async">`;
      requestAnimationFrame(() => (box.querySelector('.hoop') || box).classList.add('has-pic'));
    });
  }

  // outils/portraits.mjs : { thème: image webp en data URL } pour toutes les comptines de l'accueil
  async function strips() {
    const out = {};
    for (const s of lastLIB) if (SCENES[s.theme]) out[s.theme] = (await strip(s)).toDataURL('image/webp', 0.78);
    return out;
  }

  return { render, strips, color: HOME_BG };
})();
window.HomeSkin = HomeSkin;
