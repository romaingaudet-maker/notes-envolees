/* ------------------------------------------------------------------
   Le décor d'une comptine, branché sur le jeu (mêmes appels que les
   décors en papier découpé de la première version) :
     Decor.markup(song)          → le HTML du décor
     Decor.mount(stage, song, st)
     Decor.update(stage, st)     → l'avancement (notes, phrases, fin)
     Decor.react(stage, kind, st)→ 'correct' | 'phrase' | 'complete'
     Decor.note(stage, n, on)    → la page joue la note n
     Decor.leave()
   Les notes envolées volent dans chaque décor : une croche de feutrine
   rejoint la comptine à chaque note retrouvée.
------------------------------------------------------------------- */

/* repères de temps pour les animations déclenchées (en secondes de film) */
function cueKit(V) {
  V.now = 0;
  V.cues = {};
  V.cue = (name, delay = 0) => { V.cues[name] = V.now + 1 / FPS + delay; Engine.poke(); };
  V.age = (name) => (V.cues[name] == null ? 1e9 : V.now - V.cues[name]);
  V.anims.unshift((t) => { V.now = t; });
}

/* la volée de notes envolées */
function noteFlock(V, def, song) {
  const sky = def.sky || [-40, 40, 30, 55, -10, 10];
  const home = v3(...(def.home || [0, 12, 0]));
  const letters = [];
  song.notes.forEach((n) => { if (!letters.includes(n.letter)) letters.push(n.letter); });
  const N = Math.min(def.flock != null ? def.flock : 7, Math.max(2, song.notes.length - song.phrases.length));
  const birds = [];
  const r = rng(song.notes.length * 13 + 5);
  for (let i = 0; i < N; i++) {
    const L = letters[i % letters.length];
    const b = noteBird(NOTE_COL[L], { s: def.birdSize || 0.9 });
    const B = { g: b, ph: r() * TAU, sp: 0.55 + r() * 0.35, cx: lerp(sky[0], sky[1], (i + 0.5) / N), state: 'fly', t0: 0, from: v3(), color: NOTE_COL[L] };
    b.scale.setScalar(0.001);
    V.scene.add(b);
    birds.push(B);
  }
  let want = N, appeared = false;
  const flyPos = (B, t, out) => {
    const w = (sky[1] - sky[0]) / Math.max(2, N) * 0.9;
    out.set(B.cx + Math.sin(t * B.sp + B.ph) * w, lerp(sky[2], sky[3], 0.5 + 0.5 * Math.sin(t * B.sp * 1.3 + B.ph * 2)), lerp(sky[4], sky[5], 0.5 + 0.5 * Math.cos(t * B.sp * 0.8 + B.ph)));
    return out;
  };
  const tmp = v3(), tmp2 = v3();
  V.anim((t, f) => {
    birds.forEach((B, i) => {
      const g = B.g, wg = g.userData.wings;
      if (B.state === 'fly') {
        flyPos(B, t, tmp);
        flyPos(B, t + 0.25, tmp2);
        g.position.copy(tmp);
        g.rotation.y = Math.atan2(tmp2.x - tmp.x, tmp2.z - tmp.z) * 0.35;
        g.rotation.z = clamp((tmp2.y - tmp.y) * 0.25, -0.5, 0.5);
        const k = appeared ? sat((t - B.t0) / 0.5) : 0;
        g.scale.setScalar(Math.max(0.001, easeOutBack(k)));
        // battement d'ailes : deux poses qui alternent, comme en animation image par image
        const up = (f + i) % 2 === 0;
        wg[0].rotation.x = up ? -0.9 : 0.35; wg[1].rotation.x = up ? 0.9 : -0.35;
      } else if (B.state === 'home') {
        const k = sat((t - B.t0) / 0.7);
        g.position.copy(B.from).lerp(home, easeInOut(k));
        g.position.y += bump(k) * 8;
        g.scale.setScalar(Math.max(0.001, 1 - easeIn(Math.max(0, k - 0.6) / 0.4)));
        g.rotation.y += 0.6;
        const up = f % 2 === 0;
        wg[0].rotation.x = up ? -1.1 : 0.5; wg[1].rotation.x = up ? 1.1 : -0.5;
        if (k >= 1) { B.state = 'gone'; g.visible = false; if (V.onHome) V.onHome(B.color); }
      }
    });
  });
  return {
    show(t) { if (appeared) return; appeared = true; birds.forEach((B, i) => { B.t0 = (t || V.now) + i * 0.12; }); },
    // nombre d'oiseaux qui doivent rester en l'air : proportionnel aux notes qui manquent
    update(st) {
      const keep = st.done ? 0 : Math.round(N * (1 - st.p));
      while (want > keep) {
        want--;
        const B = birds.filter((b) => b.state === 'fly').pop();
        if (!B) break;
        B.state = 'home'; B.t0 = V.now + 1 / FPS; B.from = B.g.position.clone();
      }
    },
    reset() { want = N; birds.forEach((B) => { B.state = 'fly'; B.g.visible = true; }); },
    birds, home,
  };
}

/* libère la mémoire des formes d'un décor (les matières et textures restent partagées) */
function disposeScene(scene) {
  const keep = new Set([tuftGeo, ...Object.values(stitchGeoCache), ...Object.values(beadGeoCache), ...Object.values(CONF_GEO)]);
  scene.traverse((o) => {
    if (o.geometry && !keep.has(o.geometry)) o.geometry.dispose();
    if (o.isInstancedMesh) o.dispose();
  });
}

const Decor = (() => {
  let cur = null;
  const ok = () => Engine.supported();
  const color = (theme) => (SCENES[theme] && SCENES[theme].color) || '#2E3350';

  function markup(song) {
    const c = color(song.theme);
    return `<div class="laine-host" style="--lc:${c}" aria-hidden="true"></div><div class="laine-ov" aria-hidden="true"></div>`;
  }

  /* la partie du décor que l'interface ne couvre pas */
  function measureSafe() {
    if (!cur) return;
    const st = cur.stage, r = st.getBoundingClientRect();
    const s = { t: 0, r: 0, b: 0, l: 0 };
    // seule la barre du haut (retour, instrument, titre, suivante) couvre le décor ;
    // sur un bandeau de téléphone, le décor passe un peu dessous pour garder de la hauteur
    const short = r.height < 300;
    const bar = st.querySelector('.stage-bar');
    if (bar) { const b = bar.getBoundingClientRect(); if (b.height) s.t = Math.max(0, b.bottom - r.top) * (short ? 0.62 : 0.9); }
    cur.V.safe = s;
  }

  function build(song, portrait) {
    const def = SCENES[song.theme];
    const V = makeView(def.view || {});
    cueKit(V);
    const S = def.build(V, { song, portrait }) || {};
    S.def = def;
    if (!portrait) S.flock = noteFlock(V, def, song);
    return { V, S };
  }

  async function mount(stage, song, st) {
    leave();
    const def = SCENES[song.theme];
    if (!def || !Engine.init()) return;
    const host = stage.querySelector('.laine-host');
    const { V, S } = build(song, false);
    cur = { theme: song.theme, song, V, S, stage, host, ov: stage.querySelector('.laine-ov'), labels: [] };
    const me = cur;
    V.resize = ((orig) => (w, h) => { measureSafe(); orig(w, h); })(V.resize);
    V.after = () => placeLabels(me);
    if (S.update) S.update(st, true);
    S.flock.update(st);
    host.classList.add('is-loading');
    try { await Engine.renderer.compileAsync(V.scene, V.camera); } catch (e) { /* compilation au premier rendu */ }
    if (cur !== me) return;
    Engine.attach(host);
    Engine.show(V);
    S.flock.show();
    requestAnimationFrame(() => host.classList.remove('is-loading'));
  }

  function update(stage, st) {
    if (!cur) return;
    if (cur.S.update) cur.S.update(st, false);
    cur.S.flock.update(st);
    Engine.poke();
  }
  function react(stage, kind, st) {
    if (!cur) return;
    if (cur.S.react) cur.S.react(kind, st);
    Engine.poke();
  }
  function note(stage, n, on) {
    if (!cur || !cur.S.note) return;
    const nt = cur.song.notes[n];
    cur.S.note(n, on, nt);
  }
  function leave() {
    if (!cur) return;
    const c = cur;
    cur = null;
    Engine.detach();
    c.labels.forEach((L) => L.el.remove());
    setTimeout(() => disposeScene(c.V.scene), 0);
  }

  /* étiquettes HTML accrochées à un point du décor (bulles, panneaux) */
  function label(V, html, obj, off = [0, 0, 0], cls = '') {
    if (!cur || cur.V !== V || !cur.ov) return null;
    const el = document.createElement('div');
    el.className = 'laine-lbl ' + cls;
    el.innerHTML = html;
    cur.ov.appendChild(el);
    const L = { el, obj, off: v3(...off), set(h) { el.innerHTML = h; }, show(on) { el.classList.toggle('on', !!on); } };
    cur.labels.push(L);
    return L;
  }
  const wp = v3();
  function placeLabels(c) {
    if (!c.labels.length) return;
    for (const L of c.labels) {
      L.obj.updateWorldMatrix(true, false);
      wp.copy(L.off).applyMatrix4(L.obj.matrixWorld);
      const [x, y, z] = Engine.project(wp, c.V.camera);
      L.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      L.el.style.visibility = z < 1 ? '' : 'hidden';
    }
  }

  const has = (theme) => !!SCENES[theme];
  return { ok, has, color, markup, mount, update, react, note, leave, label, build, get current() { return cur; } };
})();
window.Decor = Decor;
