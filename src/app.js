/* ------------------------------------------------------------------
   Les Notes Envolées — navigation, accueil, jeu
------------------------------------------------------------------- */
(() => {
  'use strict';

  const app = document.getElementById('app');
  const iris = document.getElementById('iris');
  const LIB = SONGS.map(buildSong).sort((a, b) => a.level - b.level);
  const BY_ID = Object.fromEntries(LIB.map((s) => [s.id, s]));
  /* Le décor : en papier découpé (Scenes), ou un autre décor que la page apporte
     (window.Decor, mêmes appels : la version en laine 3D). */
  const PAPER = {
    color: (t) => Scenes.W[t].color,
    markup: (song, st) => Scenes.svgFor(song, st),
    mount() {}, update: (stage, st) => Scenes.update(stage, st), react: (stage, k, st) => Scenes.react(stage, k, st), note() {}, leave() {},
  };
  const decorFor = (theme) => (window.Decor && window.Decor.ok() && window.Decor.has(theme) ? window.Decor : PAPER);
  let D = PAPER;
  /* Adresse de la version en ligne, où le micro est autorisé (vide si aucune) */
  const ONLINE_URL = window.NE_ONLINE_URL || 'https://romaingaudet-maker.github.io/notes-envolees/';
  const LEGAL_URL = window.NE_LEGAL_URL || 'mentions-legales.html'; // mentions légales et confidentialité
  const KEY_CODES = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'];
  let keyLabels = ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'Ù'];
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)');
  const NARROW = window.matchMedia('(max-width: 899px)');
  const HOME_COLOR = '#F6C744';
  const nb = (t) => t.replace(/_/g, ' ');
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const LEVEL = (l) => (l <= 6 ? 'facile' : l <= 14 ? 'moyen' : 'difficile');
  const titleHtml = (t) => esc(nb(t)).split(' ').map((w) => (w.includes('-') ? `<span class="nw">${w}</span>` : w)).join(' ');
  const mod12 = (n) => ((n % 12) + 12) % 12;
  let framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }

  /* Familles d'instruments transpositeurs : `off` = son réel moins note écrite (demi-tons) */
  const FAMS = {
    C: { off: 0, short: 'en do', key: 'do majeur' },
    Bb: { off: -2, short: 'en si♭', key: 'si♭ majeur', how: 'un do écrit sonne si♭, la page joue donc un ton plus bas' },
    Eb: { off: -9, short: 'en mi♭', key: 'mi♭ majeur', how: 'un do écrit sonne mi♭, la page joue donc une sixte majeure plus bas' },
    F: { off: -7, short: 'en fa', key: 'fa majeur', how: 'un do écrit sonne fa, la page joue donc une quinte juste plus bas' },
  };
  /* Instruments proposés. `play` = transposition des sons de la page (hauteur
     réelle des notes écrites, dans le registre de l'instrument) ; `voice` = timbre
     qui joue les phrases (null : chaque comptine garde le sien). */
  const INSTS = {
    none: { name: 'Sans instrument', the: '', at: '', fam: 'C', play: 0, voice: null },
    piano: { name: 'Piano', the: 'le piano', at: 'au piano', fam: 'C', play: 0, voice: 'piano' },
    flute: { name: 'Flûte', the: 'la flûte', at: 'à la flûte', fam: 'C', play: 12, voice: 'flute' },
    clarinette: { name: 'Clarinette en si♭', the: 'la clarinette en si♭', at: 'à la clarinette', fam: 'Bb', play: -2, voice: 'clarinet' },
    saxalto: { name: 'Saxophone alto', the: 'le saxophone alto', at: 'au saxophone alto', fam: 'Eb', play: -9, voice: 'sax' },
    trompette: { name: 'Trompette en si♭', the: 'la trompette en si♭', at: 'à la trompette', fam: 'Bb', play: -2, voice: 'trumpet' },
    trombone: { name: 'Trombone', the: 'le trombone', at: 'au trombone', fam: 'C', play: -12, voice: 'trombone' },
    cor: { name: 'Cor en fa', the: 'le cor en fa', at: 'au cor', fam: 'F', play: -7, voice: 'horn' },
    violon: { name: 'Violon', the: 'le violon', at: 'au violon', fam: 'C', play: 0, voice: 'violin' },
    alto: { name: 'Alto', the: 'l’alto', at: 'à l’alto', fam: 'C', play: 0, voice: 'viola' },
    violoncelle: { name: 'Violoncelle', the: 'le violoncelle', at: 'au violoncelle', fam: 'C', play: -12, voice: 'cello' },
    xylophone: { name: 'Xylophone', the: 'le xylophone', at: 'au xylophone', fam: 'C', play: 12, voice: 'xylo' },
  };
  const OLD_INST = { C: 'piano', Bb: 'clarinette', Eb: 'saxalto', F: 'cor' };

  const ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.6v14.8L19.6 12z" fill="currentColor"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    turtle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 15.5c0-4.3 3.7-7.5 8.5-7.5s8.5 3.2 8.5 7.5z" fill="currentColor"/><circle cx="20.6" cy="13.2" r="2.3" fill="currentColor"/><path d="M5 15.5v3M9 15.5v3M13.5 15.5v3M17 15.5v3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.2-5.1M5 4v4h4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    right: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h21M17 8l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    left: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M28 16H7M15 8l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    metro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 3.2h6.8l4.2 17.3H4.4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M5.6 16.2h12.8" stroke="currentColor" stroke-width="2.2"/><path d="M12 16.2l5.2-11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="14.6" cy="10.7" r="2" fill="currentColor"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.2V5.4l10.5-2.4v12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="6.4" cy="17.4" rx="3" ry="2.4" fill="currentColor"/><ellipse cx="16.9" cy="15.1" rx="3" ry="2.4" fill="currentColor"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5l5.5 5.5 5.5-5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    xylo: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="3.4" height="16" rx="1.4" fill="currentColor"/><rect x="7.6" y="5.5" width="3.4" height="13" rx="1.4" fill="currentColor"/><rect x="12.2" y="7" width="3.4" height="10" rx="1.4" fill="currentColor"/><rect x="16.8" y="8.5" width="3.4" height="7" rx="1.4" fill="currentColor"/></svg>',
  };
  const star = (on, size = 24) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z" fill="${on ? '#F5C32C' : 'none'}" stroke="${on ? '#C8901A' : 'currentColor'}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const chip = (letter, name) => `<span class="nchip" data-l="${letter}">${name}</span>`;

  /* ---------------- réglages et étoiles (sur cet appareil) ---------------- */
  const SET_KEY = 'notes-envolees-reglages', REC_KEY = 'notes-envolees-etoiles';
  function load(k, dflt) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? Object.assign(dflt, v) : dflt; } catch (e) { return dflt; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  const settings = load(SET_KEY, { mode: 'xylo', inst: 'none', level: 1 });
  if (OLD_INST[settings.inst]) settings.inst = OLD_INST[settings.inst];
  if (!INSTS[settings.inst]) settings.inst = 'none';
  if (settings.mode !== 'mic') settings.mode = 'xylo';
  settings.level = settings.level === 2 ? 2 : 1;
  const records = load(REC_KEY, {});
  const inst = () => {
    const i = INSTS[settings.inst], f = FAMS[i.fam];
    return Object.assign({}, i, { off: f.off, short: f.short, key: f.key, how: f.how });
  };
  const instOptions = () => Object.entries(INSTS).map(([k, v]) => `<option value="${k}"${settings.inst === k ? ' selected' : ''}>${v.name}</option>`).join('');
  // le timbre qui joue la musique de la page : celui de l'instrument choisi, sinon celui de la comptine
  const voiceNow = () => inst().voice || (G && G.song.voice);
  const instNote = () => {
    const i = inst();
    if (!i.voice) return 'Chaque comptine garde son propre timbre ; les notes sonnent comme elles sont écrites.';
    const of = i.the.startsWith('l’') ? 'de ' + i.the : i.the.startsWith('le ') ? 'du ' + i.the.slice(3) : 'de ' + i.the;
    const sound = ` Les phrases sont jouées avec le son enregistré ${of}.`;
    if (i.fam !== 'C') return `Instrument ${i.short} : ${i.how}.${sound}`;
    if (i.voice === 'xylo') return `Le xylophone sonne une octave plus haut que ce qui est écrit : la page aussi.${sound}`;
    const reg = i.play === -12 ? 'la page joue une octave plus bas, dans son registre.' : i.play === 12 ? 'la page joue une octave plus haut, dans son registre.' : 'les notes sonnent comme elles sont écrites.';
    return `Instrument en do : ${reg}${sound}`;
  };
  function instrLine(song) {
    const i = inst();
    if (!i.voice) return `En do majeur, jouée ${song.instrument}.`;
    if (i.fam !== 'C') return `En do majeur (pour ${i.the}, elle sonne en ${i.key}), jouée ${i.at}.`;
    return `En do majeur, jouée ${i.at}${i.play === -12 ? ', une octave plus bas' : i.play === 12 ? ', une octave plus haut' : ''}.`;
  }
  function setInst(k) {
    if (!INSTS[k]) return;
    settings.inst = k;
    save(SET_KEY, settings);
    Sound.setTranspose(inst().play);
    Sound.useSamples(inst().voice);
    app.querySelectorAll('select.inst-sel').forEach((sel) => { sel.value = k; });
    const note = app.querySelector('#home-inst-note');
    if (note) note.textContent = instNote();
    if (G && view === 'song') {
      cancelTake();
      expectNext();
      if (el.instr) el.instr.textContent = instrLine(G.song);
      if (el.instChip) el.instChip.textContent = inst().voice ? inst().name : 'en do';
    }
  }
  function setLevel(v) {
    settings.level = v === 2 ? 2 : 1;
    save(SET_KEY, settings);
    if (G && view === 'song') { stopAll(); renderSong(G.song); }
  }

  /* ---------------- suivi des parties, pour le professeur (src/suivi.js) ---------------- */
  const track = (type, data) => Suivi.send(type, Object.assign({ inst: settings.inst, mode: settings.mode }, data));
  const secsSince = (t0) => Math.round((Suivi.clock() - t0) / 1000);
  // comptine quittée avant la fin : on dit où l'élève en était (s'il a commencé à jouer)
  function trackLeave(why) {
    if (!G || G.done || G.tracked) return;
    G.tracked = true;
    const lv2 = G.level === 2;
    const played = G.found.size + G.errors + G.fails + G.passed.size + G.tries.reduce((a, b) => a + b, 0);
    if (!played) return;
    track('sortie', {
      c: G.song.id, niveau: G.level, fait: lv2 ? G.passed.size : G.found.size, sur: lv2 ? G.song.phrases.length : G.song.notes.length,
      erreurs: lv2 ? G.fails : G.errors, montrees: G.revealed.size, lent: !!G.usedSlow, duree: secsSince(G.t0), motif: why,
    });
  }
  const micErrs = new Set();
  Sound.setTranspose(inst().play);
  Sound.useSamples(inst().voice);

  let view = 'home';
  let G = null; // partie en cours
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  function stopAll() {
    if (G) { stopPlayback(true); cancelTake(true); }
    timers.forEach(clearTimeout);
    timers.clear();
  }
  function setWorld(theme) {
    const root = document.documentElement;
    if (theme) root.dataset.world = theme; else delete root.dataset.world;
    root.dataset.view = theme ? 'song' : 'home';
  }

  /* ================================ ACCUEIL ================================ */
  const OFFSETS = [0, -26, 18, 28, -14, 26, -22, 12, -26, 20, -8, 24, -20, 10, -24, 18, -10, 26, -18, 8];

  function renderHome() {
    trackLeave('accueil');
    view = 'home';
    G = null;
    if (Ear.active()) Ear.stop();
    D.leave();
    D = PAPER;
    setWorld(null);
    if (window.HomeSkin && window.HomeSkin.render({ app, LIB, records, settings, inst, instOptions, instNote, setInst, save, SET_KEY, star, ICON, esc, nb, titleHtml, LEVEL, framed, ONLINE_URL, LEGAL_URL, keyLabels, decorFor })) return;
    const medals = LIB.map((s, i) => {
      const best = +records[s.id] || 0, best2 = +records[s.id + '@2'] || 0;
      const badge = best ? `<span class="medal-badge" aria-label="Record : ${best} étoile${best > 1 ? 's' : ''}">${[1, 2, 3].map((k) => star(k <= best, 15)).join('')}</span>` : '';
      return `<li class="medal${best ? ' is-won' : ''}" data-i="${i}"><a class="medal-link" href="#${s.id}" style="--off:${OFFSETS[i % OFFSETS.length]}px">
        <span class="medal-disc" style="--c:${PAPER.color(s.theme)}">${Scenes.emblem(s.theme)}
          <svg class="medal-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="46"/></svg>
          <span class="medal-num" aria-hidden="true">${s.level}</span>${badge}
        </span>
        <span class="medal-title">${titleHtml(s.title)}</span>
        <span class="medal-meta">${LEVEL(s.level)} · ${s.notes.length} notes${best2 ? `<span class="medal-r2" aria-label="Niveau 2 : ${best2} étoile${best2 > 1 ? 's' : ''}">${ICON.metro}${'★'.repeat(best2)}</span>` : ''}</span>
      </a></li>`;
    }).join('');
    const chips = [['C', 'Do'], ['D', 'Ré'], ['E', 'Mi'], ['F', 'Fa'], ['G', 'Sol'], ['A', 'La'], ['B', 'Si']]
      .map(([l, n]) => `<span class="chip" data-l="${l}">${n}</span>`).join('');
    const levelOpts = [[1, '1 · Les notes', 'Retrouve chaque note à l’oreille, à ton rythme.'], [2, '2 · Notes et rythme', 'Après le décompte, joue toute la phrase en rythme : la page vérifie les notes et le rythme.']]
      .map(([v, t, d]) => `<label class="inst-opt"><input type="radio" name="home-level" value="${v}"${settings.level === v ? ' checked' : ''}><span class="inst-card"><b>${t}</b><small>${d}</small></span></label>`).join('');
    const micNote = framed && ONLINE_URL
      ? `<p class="inst-online">Ici, dans claude.ai, le micro n’est pas disponible. Pour jouer avec ton instrument, ouvre la <a href="${esc(ONLINE_URL)}" target="_blank" rel="noopener">version en ligne</a>.</p>`
      : '';
    app.innerHTML = `
    <main class="home grain">
      <div class="home-in">
        <header class="home-head">
          <p class="eyebrow">Jeu d’oreille · ${LIB.length} comptines en do majeur</p>
          <h1 class="home-title"><span class="w">Les Notes</span><span class="w">Envol<span class="lift c1">é</span><span class="lift c2">e</span><span class="lift c3">s</span><span class="flyaway" aria-hidden="true"><i style="--c:var(--n-do);--dl:-.3s"></i><i style="--c:var(--n-sol);--dl:-1.1s;translate:0 -.25em"></i><i style="--c:var(--n-la);--dl:-1.9s;translate:0 -.55em"></i></span></span></h1>
          <p class="home-lede">Dans chaque comptine, les notes se sont envolées. <strong>Seule la première note de chaque phrase est restée.</strong> Joue-la, puis retrouve les suivantes à l’oreille, sur le xylophone de l’écran ou sur ton propre instrument.</p>
        </header>
        <section class="score" aria-label="Les comptines, de la plus facile à la plus difficile">
          <svg class="staff" aria-hidden="true"></svg>
          <ol class="medals">${medals}</ol>
        </section>
        <section class="howto">
          <h2>Comment jouer</h2>
          <ol class="steps">
            <li><p>Choisis une comptine. Les plus faciles sont au début du chemin.</p></li>
            <li><p>Écoute-la en entier, ou phrase par phrase avec le bouton rond. « Jusqu’à la note » rejoue le début de la phrase et s’arrête sur la note à trouver.</p></li>
            <li><p>La première note de chaque phrase est écrite : joue-la, puis cherche les suivantes. Avec ton instrument, la page t’écoute au micro et te dit si la note est juste.</p></li>
            <li><p>Si ce n’est pas la bonne, une flèche t’aide : plus aigu ou plus grave. Chaque note retrouvée se pose à sa hauteur et le décor s’anime.</p></li>
            <li><p>Niveau 2 : écoute l’exemple, puis « À toi ! ». Après le décompte (1, 2, 3, 4), joue toute la phrase en rythme ; la page vérifie ensuite chaque note et la place de chaque note dans le temps. Une phrase réussie, la suivante démarre toute seule, avec son décompte.</p></li>
          </ol>
          <div class="side-cards">
            <fieldset class="legend inst-set">
              <legend>Ton instrument</legend>
              <p>Les noms de notes sont ceux de ta partition. La page joue dans le ton de ton instrument, avec un son proche du sien.</p>
              <label class="home-select">${ICON.note}<select class="inst-sel" id="home-inst" aria-label="Ton instrument">${instOptions()}</select>${ICON.chev}</label>
              <p class="inst-note" id="home-inst-note">${instNote()}</p>
              ${micNote}
            </fieldset>
            <fieldset class="legend level-set">
              <legend>Niveau</legend>
              <div class="inst-opts">${levelOpts}</div>
            </fieldset>
            <div class="legend">
              <h3>Le code couleur des notes</h3>
              <p>Toutes les comptines sont en do majeur : pas de dièse, pas de bémol. Les notes graves portent un point dessous, les aiguës un point dessus.</p>
              <div class="chips">${chips}</div>
            </div>
          </div>
        </section>
        <p class="home-foot">${Suivi.configured
          ? 'Chaque visite d’une comptine repart de zéro ; ton meilleur nombre d’étoiles reste sur cet appareil. Pour améliorer le jeu, le déroulé des parties (comptine, instrument, étoiles, erreurs) est enregistré sans nom, avec l’adresse IP de la connexion, et effacé au bout de 13 mois ; le son du micro n’est jamais envoyé.'
          : 'Chaque visite d’une comptine repart de zéro ; seul ton meilleur nombre d’étoiles reste sur cet appareil.'} Sur ordinateur, les touches ${keyLabels.slice(0, 9).join(' ')} jouent les lames, la barre d’espace lance l’écoute (au niveau 2, le décompte). Comptines traditionnelles du domaine public. Sons d’instruments enregistrés, libres de droits : VSCO 2 Community Edition, VCSL, Weresax (Karoryfer) et Sonatina Symphonic Orchestra (licence CC Sampling Plus 1.0).<a class="legal-link" href="${esc(LEGAL_URL)}">Mentions légales et confidentialité</a></p>
      </div>
    </main>`;
    app.querySelector('#home-inst').addEventListener('change', (e) => setInst(e.target.value));
    app.querySelectorAll('input[name="home-level"]').forEach((r) => r.addEventListener('change', () => { settings.level = +r.value === 2 ? 2 : 1; save(SET_KEY, settings); }));
    layoutMedals();
  }

  let medalRO = null;
  function layoutMedals() {
    const score = app.querySelector('.score');
    if (!score) return;
    const list = score.querySelector('.medals');
    const place = () => {
      const cols = getComputedStyle(list).gridTemplateColumns.split(' ').filter(Boolean).length || 3;
      list.querySelectorAll('.medal').forEach((li) => {
        const i = +li.dataset.i, row = Math.floor(i / cols), k = i % cols;
        li.style.gridRow = String(row + 1);
        li.style.gridColumn = String(row % 2 ? cols - k : k + 1);
      });
      drawStaff(score);
    };
    place();
    if (medalRO) medalRO.disconnect();
    if ('ResizeObserver' in window) {
      let raf = 0;
      medalRO = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); });
      medalRO.observe(score);
    }
  }

  function drawStaff(score) {
    const svg = score.querySelector('.staff');
    const box = score.getBoundingClientRect();
    const pts = [...score.querySelectorAll('.medal')]
      .sort((a, b) => a.dataset.i - b.dataset.i)
      .map((li) => { const r = li.querySelector('.medal-disc').getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]; });
    if (pts.length < 2) return;
    const first = pts[0], last = pts[pts.length - 1];
    const lead = Math.min(160, box.width * 0.18);
    const P = [[first[0] - lead, first[1] + 34], ...pts, [last[0] + (last[0] > box.width / 2 ? lead : -lead), last[1] - 26]];
    let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    const W = box.width, H = box.height;
    svg.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
    svg.innerHTML = `<defs><mask id="staff-mask" maskUnits="userSpaceOnUse" x="-300" y="-300" width="${W + 600}" height="${H + 600}"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="#fff" stroke-width="64"/><path d="${d}" stroke="#000" stroke-width="60"/>
      <path d="${d}" stroke="#fff" stroke-width="34"/><path d="${d}" stroke="#000" stroke-width="30"/>
      <path d="${d}" stroke="#fff" stroke-width="3"/></g></mask></defs>
      <rect class="ink" x="-300" y="-300" width="${W + 600}" height="${H + 600}" mask="url(#staff-mask)"/>`;
  }

  /* ================================ COMPTINE ================================ */
  const wOf = (d) => (d <= 0.25 ? 0.8 : d <= 0.5 ? 0.9 : d <= 0.75 ? 0.95 : d <= 1 ? 1 : d <= 1.5 ? 1.25 : d <= 2 ? 1.45 : 1.7);
  const PRAISE = ['Bravo !', 'Oui !', 'Super !', 'Bien joué !', 'Exactement !', 'Quelle oreille !', 'C’est ça !', 'Génial !'];
  let el = {};

  function keysFor(song) {
    const lo = Math.max(25, song.minStep - 1), hi = Math.min(35, song.maxStep + 1);
    const out = [];
    for (let s = lo; s <= hi; s++) out.push(parsePitch('CDEFGAB'[s % 7] + Math.floor(s / 7)));
    return out;
  }

  function renderSong(song) {
    trackLeave(G && G.song === song ? 'recommence' : 'autre');
    view = 'song';
    D.leave();
    D = decorFor(song.theme);
    setWorld(song.theme);
    const keepSlow = G && G.slow;
    const lv2 = settings.level === 2;
    G = {
      song, level: lv2 ? 2 : 1, found: new Set(), revealed: new Set(), errors: 0, attempts: 0, cursor: null, view: 0,
      slow: !!keepSlow, playing: null, done: false, keys: keysFor(song), lastStars: 0,
      // niveau 2
      passed: new Set(), fails: 0, tries: song.phrases.map(() => 0), take: null, results: [], moveTo: null, keepMic: false, fullRes: null,
      // suivi : début de la partie (temps page visible), « lentement » utilisé, résultat déjà envoyé
      t0: Suivi.clock(), usedSlow: !!keepSlow, tracked: false,
    };
    track('debut', { c: song.id, niveau: G.level });
    const idx = LIB.indexOf(song);
    const next = LIB[(idx + 1) % LIB.length];
    const span = song.maxStep - song.minStep;
    const panels = song.phrases.map((ph, p) => `
      <div class="panel" data-p="${p}"${p ? ' hidden' : ''}>
        <button class="ph-play" type="button" data-p="${p}" aria-label="Écouter la phrase ${p + 1}">${ICON.play}</button>
        <div class="ph-body">
          <p class="ph-lyric">${ph.notes.map((n) => `<span class="syl" data-n="${n}">${esc(song.notes[n].syl)}</span>`).join('')}</p>
          <div class="beads" style="--span:${span};--cols:${ph.notes.map((n) => `${wOf(song.notes[n].dur)}fr`).join(' ')}">${ph.notes.map((n) => `<span class="bc"><button class="bead" type="button" data-n="${n}"><span>?</span></button></span>`).join('')}</div>
          <div class="rstrip" aria-hidden="true" hidden></div>
        </div>
      </div>`).join('');
    const pills = song.phrases.map((ph, p) => `<li><button class="pill" type="button" data-p="${p}" aria-label="Phrase ${p + 1}">${p + 1}</button></li>`).join('');
    const keys = G.keys.map((k, i) => `<button class="key" type="button" data-i="${i}" data-l="${k.letter}" style="--k:${(1 - i * 0.042).toFixed(3)}" aria-label="${k.fr}${k.octave === 3 ? ' grave' : k.octave === 5 ? ' aigu' : ''}"><span class="kn${k.octave === 3 ? ' low' : k.octave === 5 ? ' high' : ''}">${k.fr}</span><span class="kk" aria-hidden="true">${keyLabels[i] || ''}</span></button>`).join('');
    const listen = lv2
      ? `<button class="btn-big" id="b-go" type="button" aria-pressed="false"><span class="ic">${ICON.metro}</span><span class="lbl">À toi, en rythme !</span></button>
          <button class="btn" id="b-all" type="button"><span class="ic">${ICON.play}</span><span class="lbl">Toute la comptine</span></button>`
      : `<button class="btn-big" id="b-all" type="button"><span class="ic">${ICON.play}</span><span class="lbl">Toute la comptine</span></button>
          <button class="btn" id="b-to" type="button"><span class="q" aria-hidden="true">?</span><span class="lbl">Jusqu’à la note</span></button>`;
    app.innerHTML = `
    <main class="song" data-mode="${settings.mode}" data-level="${G.level}">
      <section class="stage grain" aria-label="Décor : ${esc(nb(song.title))}">
        ${D.markup(song, info())}
        <div class="stage-bar">
          <a class="back" href="#" aria-label="Les comptines">${ICON.back}<span>Les comptines</span></a>
          <label class="inst-pill" title="Ton instrument">${ICON.note}<select class="inst-sel" id="inst-sel" aria-label="Ton instrument">${instOptions()}</select>${ICON.chev}</label>
          <div class="stage-title" aria-hidden="true"><span>Comptine ${song.level} · ${LEVEL(song.level)}${lv2 ? ' · niveau 2' : ''}</span><b>${titleHtml(song.title)}</b></div>
          <a class="next-song" href="#${next.id}" aria-label="Comptine suivante : ${esc(nb(next.title))}">${ICON.next}</a>
        </div>
      </section>
      <section class="play">
        <header class="play-head">
          <p class="kicker">Comptine ${song.level} sur ${LIB.length} · ${LEVEL(song.level)}${lv2 ? ' · niveau 2, notes et rythme' : ''}</p>
          <h1>${titleHtml(song.title)}</h1>
          <p class="instr" id="instr">${esc(instrLine(song))}</p>
        </header>
        <div class="listen">
          ${listen}
          <button class="btn icon" id="b-slow" type="button" aria-pressed="${G.slow}" aria-label="Lentement" title="Lentement">${ICON.turtle}<span class="lbl">Lentement</span></button>
        </div>
        <section class="card" aria-label="Phrase en cours">
          <div class="card-top">
            <ol class="strip" aria-label="Phrases">${pills}</ol>
            <p class="count" id="count"></p>
          </div>
          <div class="panels">${panels}</div>
        </section>
        <div class="done-card" id="done" hidden></div>
        <footer class="play-foot"><button type="button" id="b-reset">${ICON.reset}<span>Recommencer</span></button><a href="#${next.id}">Suivante : ${titleHtml(next.title)} →</a></footer>
      </section>
      <section class="dock" aria-label="Jouer les notes">
        <p class="hint" id="hint" aria-live="polite"></p>
        <div class="xylo" role="group" aria-label="Xylophone : choisis la note">${keys}</div>
        <div class="ear" id="ear" hidden>
          <div class="ear-off" id="ear-off">
            <p class="ear-text">${lv2 ? 'La page écoute ton instrument avec le micro, puis vérifie les notes et le rythme.' : 'La page écoute ton instrument avec le micro et te dit si la note est juste.'}</p>
            <div class="ear-row"><button class="btn-big" id="mic-on" type="button"><span class="ic">${ICON.mic}</span><span>Allumer le micro</span></button></div>
            <div class="ear-msg" id="ear-msg" hidden></div>
          </div>
          <div class="ear-on" id="ear-on" hidden>
            <div class="heard" id="heard"><span class="heard-n" id="heard-n">…</span></div>
            <div class="ear-mid">
              <p class="ear-cap" id="ear-cap">J’écoute…</p>
              <div class="tuner" aria-hidden="true"><i class="tz"></i><b class="needle" id="needle"></b><span class="t-lo">bas</span><span class="t-mid">juste</span><span class="t-hi">haut</span></div>
            </div>
            <div class="ear-side">
              <button class="mini" id="inst-chip" type="button" title="Changer d’instrument">${esc(inst().voice ? inst().name : 'en do')}</button>
              <button class="mini" id="mic-off" type="button" aria-label="Couper le micro">Couper<span class="lbl-l"> le micro</span></button>
            </div>
          </div>
        </div>
        <div class="dock-bar">
          <div class="seg seg-level" role="radiogroup" aria-label="Niveau">
            <button type="button" role="radio" data-level="1" aria-checked="${!lv2}"><b class="lv">1</b><span class="long">Les notes</span><span class="short">Notes</span></button>
            <button type="button" role="radio" data-level="2" aria-checked="${lv2}"><b class="lv">2</b><span class="long">Notes et rythme</span><span class="short">Rythme</span></button>
          </div>
          <div class="seg seg-mode" role="radiogroup" aria-label="Jouer avec">
            <button type="button" role="radio" data-mode="xylo" aria-checked="${settings.mode === 'xylo'}" aria-label="Xylophone" title="Xylophone">${ICON.xylo}<span>Xylophone</span></button>
            <button type="button" role="radio" data-mode="mic" aria-checked="${settings.mode === 'mic'}" aria-label="Mon instrument" title="Mon instrument">${ICON.mic}<span>Mon instrument</span></button>
          </div>
        </div>
      </section>
    </main>`;

    el = {
      main: app.querySelector('.song'),
      stage: app.querySelector('.stage'),
      bAll: app.querySelector('#b-all'),
      bTo: app.querySelector('#b-to'),
      bGo: app.querySelector('#b-go'),
      bSlow: app.querySelector('#b-slow'),
      instr: app.querySelector('#instr'),
      count: app.querySelector('#count'),
      card: app.querySelector('.card'),
      done: app.querySelector('#done'),
      hint: app.querySelector('#hint'),
      dock: app.querySelector('.dock'),
      keys: [...app.querySelectorAll('.key')],
      beads: [...app.querySelectorAll('.bead')].sort((a, b) => a.dataset.n - b.dataset.n),
      syls: [...app.querySelectorAll('.syl')].sort((a, b) => a.dataset.n - b.dataset.n),
      panels: [...app.querySelectorAll('.panel')],
      pills: [...app.querySelectorAll('.pill')],
      ear: app.querySelector('#ear'),
      earOff: app.querySelector('#ear-off'),
      earOn: app.querySelector('#ear-on'),
      earMsg: app.querySelector('#ear-msg'),
      heard: app.querySelector('#heard'),
      heardN: app.querySelector('#heard-n'),
      earCap: app.querySelector('#ear-cap'),
      needle: app.querySelector('#needle'),
      instSel: app.querySelector('#inst-sel'),
      instChip: app.querySelector('#inst-chip'),
    };
    song.notes.forEach((_, n) => paintBead(n));
    song.phrases.forEach((_, p) => paintPill(p));
    paintCount();
    D.mount(el.stage, song, info());
    D.update(el.stage, info());
    bindSong();
    if (lv2) G.cursor = null; else setCursor(0);
    applyMode(false);
    if (lv2) hint2();
  }

  function info() {
    const song = G.song, total = song.notes.length, found = G.found.size;
    if (G.level === 2) {
      const n = G.passed.size;
      return { world: song.theme, total, found, p: found / total, phrasesDone: n, done: n >= song.phrases.length };
    }
    const phrasesDone = song.phrases.filter((ph) => ph.notes.every((m) => G.found.has(m))).length;
    return { world: song.theme, total, found, p: found / total, phrasesDone, done: found >= total };
  }

  /* ---------------- dessin des perles, des phrases, du compteur ---------------- */
  function paintBead(n) {
    const b = el.beads[n];
    const note = G.song.notes[n];
    const found = G.found.has(n);
    const shown = found || G.song.given.has(n) || G.revealed.has(n);
    const span = G.song.maxStep - G.song.minStep;
    b.classList.toggle('is-found', found);
    b.classList.toggle('is-given', shown && !found);
    b.classList.toggle('low', shown && note.octave === 3);
    b.classList.toggle('high', shown && note.octave === 5);
    if (shown) b.dataset.l = note.letter; else delete b.dataset.l;
    b.style.setProperty('--y', shown ? G.song.maxStep - note.step : Math.round(span / 2));
    b.firstChild.textContent = shown ? note.fr : '?';
    const oct = note.octave === 3 ? ' grave' : note.octave === 5 ? ' aigu' : '';
    b.setAttribute('aria-label', found ? `Note ${n + 1} : ${note.fr}${oct}, trouvée. Toucher pour l’entendre.`
      : shown ? `Note ${n + 1} : ${note.fr}${oct}, donnée, à jouer.` : `Note ${n + 1} : à trouver.`);
  }

  function paintPill(p) {
    const ph = G.song.phrases[p];
    const f = ph.notes.filter((m) => G.found.has(m)).length;
    const pill = el.pills[p];
    pill.style.setProperty('--f', (f / ph.notes.length).toFixed(3));
    pill.classList.toggle('is-done', G.level === 2 ? G.passed.has(p) : f === ph.notes.length);
    pill.classList.toggle('is-view', p === G.view);
    pill.setAttribute('aria-current', p === G.view ? 'step' : 'false');
  }

  function paintCount() {
    if (G.level === 2) { el.count.innerHTML = `<b>${G.passed.size}</b>/${G.song.phrases.length} phrases`; return; }
    const f = G.found.size, t = G.song.notes.length;
    el.count.innerHTML = `<b>${f}</b>/${t} notes`;
  }

  // hintSeq : un message différé ne doit pas effacer un message plus récent
  let hintSeq = 0;
  function laterHint(fn, ms) {
    const seq = hintSeq;
    later(() => { if (hintSeq === seq) fn(); }, ms);
  }
  function setHint(html, cls) {
    hintSeq++;
    const h = el.hint;
    if (!h) return;
    h.className = 'hint' + (cls ? ' ' + cls : '');
    h.innerHTML = html;
    void h.offsetWidth;
    h.classList.add('pop');
  }

  function cursorHint() {
    if (G.level === 2) { hint2(); return; }
    if (G.cursor == null) return;
    const note = G.song.notes[G.cursor];
    const mic = settings.mode === 'mic';
    if (G.song.given.has(G.cursor) || G.revealed.has(G.cursor)) {
      const first = G.song.phrases[note.phrase].notes[0] === G.cursor && !G.revealed.has(G.cursor);
      setHint(`${first ? 'Note donnée : joue' : 'Joue'} ${chip(note.letter, note.fr)}${mic ? ' sur ton instrument' : ''}`, '');
    } else {
      setHint(mic ? 'À toi : joue la note suivante' : 'À toi : trouve la note suivante', '');
    }
  }

  function showPhrase(p, animate = true) {
    if (p === G.view) return;
    const from = el.panels[G.view], to = el.panels[p];
    const dir = p > G.view ? 1 : -1;
    G.view = p;
    G.song.phrases.forEach((_, i) => paintPill(i));
    from.hidden = true;
    to.hidden = false;
    if (G.results && G.results[p]) showResult(p);
    if (!animate || RM.matches || !to.animate) return;
    to.animate([{ transform: `translateX(${dir * 28}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  function nextUnfound(from) {
    const N = G.song.notes.length;
    for (let k = 0; k < N; k++) { const n = (from + k) % N; if (!G.found.has(n)) return n; }
    return null;
  }

  function setCursor(n, animate = true, hint = true) {
    if (G.cursor != null) {
      el.beads[G.cursor].classList.remove('is-cursor');
      el.syls[G.cursor].classList.remove('is-cur');
    }
    G.cursor = n;
    G.attempts = 0;
    G.pending = false;
    el.keys.forEach((k) => k.classList.remove('is-hint'));
    if (el.bTo) el.bTo.disabled = n == null;
    expectNext();
    if (n == null) return;
    el.beads[n].classList.add('is-cursor');
    el.syls[n].classList.add('is-cur');
    showPhrase(G.song.notes[n].phrase, animate);
    if (hint) cursorHint();
  }

  function expectNext() {
    if (!G || G.cursor == null) { Ear.expect(null); return; }
    Ear.expect(mod12(G.song.notes[G.cursor].midi + inst().off));
  }

  /* ---------------- réponses ---------------- */
  function pressKey(i) {
    if (!G || !G.keys[i]) return;
    const key = G.keys[i], k = el.keys[i];
    Sound.tap(voiceNow(), key.midi, 0.6);
    k.classList.add('is-down');
    later(() => k.classList.remove('is-down'), 130);
    // une prise en cours : on enregistre l'instant de la frappe (le son entendu a la latence du haut-parleur)
    if (G.take) { recordNote({ t: Sound.now() - Sound.outLatency(), midi: key.midi }); return; }
    if (G.level === 2) { if (G.playing) stopPlayback(true); return; }
    if (G.playing) stopPlayback(true);
    settle(false);
    if (G.cursor == null || G.done) return;
    const target = G.song.notes[G.cursor];
    if (key.midi === target.midi) good(k, target);
    else {
      const up = target.midi > key.midi;
      const same = key.letter === target.letter;
      retrigger(k, 'is-wrong');
      bad(same ? (up ? 'Bonne note, mais plus aiguë' : 'Bonne note, mais plus grave') : (up ? 'Plus aigu' : 'Plus grave'), up, 'vers la droite', 'vers la gauche');
    }
  }

  function heardNote(hit) {
    if (!G || settings.mode !== 'mic') return;
    if (G.take) { recordNote({ t: (hit.t != null ? hit.t : Sound.now()) - Sound.outLatency() - 0.03, written: hit.r - inst().off }); return; }
    if (G.done || G.level === 2) return;
    if (G.cursor == null) return;
    if (G.playing) {
      // l'élève peut jouer un peu avant la fin de la dernière note de la page
      if (Sound.now() < G.playing.noteEnd - Sound.EARLY - 0.05) return;
      stopPlayback(false);
    }
    settle(false);
    const written = hit.r - inst().off;
    const target = G.song.notes[G.cursor];
    if (mod12(written) === mod12(target.midi)) {
      Ear.nudge(hit.cents);
      good(el.heard, target);
    } else {
      // l'octave ne compte pas : on guide vers la bonne note la plus proche
      // (à égale distance, on suit l'octave de la partition)
      const raw = target.midi - written;
      let d = raw - 12 * Math.round(raw / 12);
      if (Math.abs(d) === 6) d = raw > 0 ? 6 : -6;
      const up = d > 0;
      const pc = mod12(written), L = PC_LETTER[pc];
      retrigger(el.heard, 'is-wrong');
      bad(`J’entends ${L ? chip(L, NOTE_FR[L]) : `<span class="nchip">${PC_FR[pc]}</span>`} : ${up ? 'plus aigu' : 'plus grave'}`, up, '', '');
    }
  }

  function retrigger(node, cls) {
    if (!node) return;
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  }

  function good(fromEl, target) {
    const n = G.cursor;
    G.found.add(n);
    el.keys.forEach((k) => k.classList.remove('is-hint'));
    if (fromEl && fromEl.classList.contains('key')) retrigger(fromEl, 'is-good');
    if (fromEl === el.heard) retrigger(el.heard, 'is-good');
    setHint(PRAISE[Math.floor(Math.random() * PRAISE.length)], 'ok');
    paintBead(n);
    const bead = el.beads[n];
    bead.style.opacity = '0';
    flyTo(fromEl, bead, target, () => { bead.style.opacity = ''; retrigger(bead, 'pop'); });
    paintCount();
    const p = target.phrase;
    const ph = G.song.phrases[p];
    const phraseDone = ph.notes.every((m) => G.found.has(m));
    paintPill(p);
    const st = info();
    D.update(el.stage, st);
    D.react(el.stage, phraseDone ? 'phrase' : 'correct', st);
    if (st.done) { setCursor(null); later(() => finish(), 520); return; }
    let next = ph.notes.find((m) => m > n && !G.found.has(m));
    if (next != null) { setCursor(next, true, false); laterHint(() => { if (G && G.cursor === next) cursorHint(); }, 650); return; }
    next = nextUnfound(n);
    // phrase terminée : on enchaîne tout de suite sur la suivante,
    // juste le temps que la dernière note se pose
    el.beads[n].classList.remove('is-cursor');
    el.syls[n].classList.remove('is-cur');
    G.cursor = next;
    G.attempts = 0;
    G.pending = true;
    expectNext();
    setHint(`Phrase ${p + 1} retrouvée !`, 'ok');
    later(() => {
      if (!G || !G.pending) return;
      settle(true, false);
      laterHint(() => { if (G && G.cursor === next) cursorHint(); }, 900);
    }, 560);
  }

  /* passe à la phrase suivante si on attendait la fin d'une phrase */
  function settle(animate = true, hint = true) {
    if (!G || !G.pending) return;
    G.pending = false;
    setCursor(G.cursor, animate, hint);
  }

  function bad(text, up, rightTxt, leftTxt) {
    G.errors++;
    G.attempts++;
    const html = up ? `${text} ${ICON.right}${rightTxt ? `<small>${rightTxt}</small>` : ''}` : `${ICON.left} ${text}${leftTxt ? ` <small>${leftTxt}</small>` : ''}`;
    setHint(html, up ? 'up' : 'down');
    if (G.attempts >= 3 && G.cursor != null) {
      const target = G.song.notes[G.cursor];
      const t = G.keys.findIndex((k) => k.midi === target.midi);
      if (t >= 0) el.keys[t].classList.add('is-hint');
      if (!G.revealed.has(G.cursor) && !G.song.given.has(G.cursor)) {
        G.revealed.add(G.cursor);
        const seq = hintSeq;
        later(() => {
          if (!G || G.cursor == null || G.song.notes[G.cursor] !== target) return;
          paintBead(G.cursor);
          if (hintSeq === seq) setHint(`Je te la montre : ${chip(target.letter, target.fr)}`, '');
        }, 1300);
      }
    }
  }

  function flyTo(from, toBead, note, done) {
    if (RM.matches || !from || !toBead || !Element.prototype.animate || toBead.closest('[hidden]')) { done(); return; }
    const a = from.getBoundingClientRect();
    const col = toBead.parentElement.getBoundingClientRect();
    if (!a.width || !col.width) { done(); return; }
    // tailles mesurées (les variables CSS peuvent être des clamp() non résolus)
    const bs = toBead.offsetHeight || 30;
    const span = G.song.maxStep - G.song.minStep;
    const stp = span > 0 ? Math.max(0, col.height - bs) / span : 0;
    const y = G.song.maxStep - note.step;
    const x0 = a.left + a.width / 2, y0 = a.top + a.height * 0.35;
    const x1 = col.left + col.width / 2, y1 = col.top + y * stp + bs / 2;
    const fx = document.createElement('div');
    fx.className = 'flyer';
    fx.dataset.l = note.letter;
    document.body.appendChild(fx);
    const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 70;
    const anim = fx.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.5)` },
      { transform: `translate(${mx}px, ${my}px) scale(1.25)`, offset: 0.5 },
      { transform: `translate(${x1}px, ${y1}px) scale(1)` },
    ], { duration: 480, easing: 'cubic-bezier(.45,0,.25,1)' });
    anim.onfinish = () => { fx.remove(); done(); };
  }

  /* ---------------- écoute ---------------- */
  function playEvents(evs, kind, onEnd, opts = {}) {
    stopPlayback(true);
    if (!Sound.ensure()) { setHint('Le son n’est pas disponible dans ce navigateur.', ''); return; }
    let a = 0;
    while (a < evs.length && evs[a].rest) a++;
    evs = evs.slice(a);
    if (!evs.length) return;
    const spb = 60 / (G.song.bpm * (G.slow ? 0.68 : 1));
    const base = evs[0].t;
    const items = evs.filter((e) => !e.rest).map((e) => ({
      midi: e.midi, n: e.n, start: (e.t - base) * spb, dur: e.dur * spb,
      vel: 0.8 + 0.2 * e.accent + (Math.random() - 0.5) * 0.04,
    }));
    const lastEv = evs[evs.length - 1];
    const total = (lastEv.t + lastEv.dur - base) * spb;
    const h = Sound.sequence(voiceNow(), items, opts.at ? Math.max(0.05, opts.at - Sound.now()) : undefined);
    if (!h) return;
    const noteEnd = h.t0 + items.reduce((m, it) => Math.max(m, it.start + it.dur), 0);
    const P = { h, items, kind, t0: h.t0, end: h.t0 + total, noteEnd, cur: -1, raf: 0, onEnd, home: G.view, srcs: opts.srcs || [], ci: opts.ci || null, k: -1 };
    G.playing = P;
    setPlayingUI(kind, true);
    const tick = () => {
      if (!G || G.playing !== P) return;
      const now = Sound.now();
      if (P.ci) {
        const heard = now - Sound.outLatency();
        if (heard < P.t0 - 0.04) {
          const k = Math.floor((heard - P.ci.clicks[0]) / P.ci.beatSec + 0.001);
          if (k >= 0 && k < P.ci.N && k !== P.k) { P.k = k; showCount(P.ci, k); retrigger(el.card, 'beat'); }
        } else if (!P.heard) { P.heard = true; setHint('Écoute bien…', ''); }
      }
      let cur = -1;
      for (const it of P.items) {
        const s = P.t0 + it.start;
        if (now >= s && now < s + Math.max(it.dur * 0.9, 0.1)) cur = it.n;
      }
      if (cur !== P.cur) {
        if (P.cur >= 0) highlight(P.cur, false);
        if (cur >= 0) {
          highlight(cur, true);
          const ph = G.song.notes[cur].phrase;
          if (ph !== G.view) showPhrase(ph, true);
        }
        P.cur = cur;
      }
      if (now >= P.end + 0.05) { stopPlayback(false); return; }
      P.raf = requestAnimationFrame(tick);
    };
    P.raf = requestAnimationFrame(tick);
  }

  function stopPlayback(fade) {
    const P = G && G.playing;
    if (!P) return;
    cancelAnimationFrame(P.raf);
    if (P.cur >= 0) highlight(P.cur, false);
    if (fade) {
      P.h.stop();
      P.srcs.forEach((x) => { try { if (x) x.stop(); } catch (e) { /* déjà joué */ } });
    }
    G.playing = null;
    setPlayingUI(P.kind, false);
    if (P.onEnd) P.onEnd();
    // revenir à la phrase où l'on joue
    if (G && G.cursor != null && !G.pending) showPhrase(G.song.notes[G.cursor].phrase, true);
  }

  function highlight(n, on) {
    el.beads[n].classList.toggle('is-on', on);
    el.syls[n].classList.toggle('is-on', on);
    D.note(el.stage, n, on);
  }

  function setPlayingUI(kind, on) {
    el.main.classList.toggle('is-playing', on);
    if (kind === 'all') {
      if (el.bAll) {
        el.bAll.querySelector('.ic').innerHTML = on ? ICON.stop : ICON.play;
        el.bAll.querySelector('.lbl').textContent = on ? 'Arrêter' : 'Toute la comptine';
      }
      const dp = el.done && el.done.querySelector('#d-play .lbl');
      if (dp) dp.textContent = on ? 'Arrêter' : 'Réécouter';
    } else if (kind === 'to') {
      if (el.bTo) el.bTo.querySelector('.lbl').textContent = on ? 'Arrêter' : 'Jusqu’à la note';
    } else if (kind.startsWith('p')) {
      const b = el.panels[+kind.slice(1)].querySelector('.ph-play');
      b.firstElementChild.outerHTML = on ? ICON.stop : ICON.play;
      b.setAttribute('aria-label', (on ? 'Arrêter' : 'Écouter') + ' la phrase ' + (+kind.slice(1) + 1));
    }
  }

  function playAll() { playEvents(G.song.events, 'all'); }
  function playPhrase(p, onEnd) { playEvents(G.song.phrases[p].events, 'p' + p, onEnd); }
  function playToMystery() {
    if (G.cursor == null) { playAll(); return; }
    const target = G.song.notes[G.cursor];
    const ph = G.song.phrases[target.phrase];
    let evs = ph.events.filter((e) => e.t <= target.t + 1e-9);
    if (target.n === ph.notes[0] && target.phrase > 0) evs = G.song.phrases[target.phrase - 1].events.concat(evs);
    playEvents(evs, 'to');
  }
  const toggle = (kind, fn) => () => { if (G.playing && G.playing.kind === kind) stopPlayback(true); else fn(); };


  /* ================= NIVEAU 2 : les notes et le rythme =================
     « À toi ! » : décompte (pulsations de départ), puis l'enfant joue toute
     la phrase ; on note l'instant de chaque attaque, et à la fin on compare
     notes et rythme à la phrase attendue (voir rythme.js). */
  const SLOW = 0.68;
  const spbOf = () => 60 / (G.song.bpm * (G.slow ? SLOW : 1));

  /* Décompte avant la phrase p, calé sur la mesure : les temps de la mesure où
     la phrase commence, précédés d'une mesure entière s'il en faut pour
     compter au moins trois temps (« 1 2 1 » → levée sur le 2e temps en 2/4,
     « 1 2 3 » → levée sur le 3e temps et demi en 4/4, « 1 2 3 4 » sinon). */
  function countIn(p, lead = 0.3) {
    const song = G.song, spb = spbOf();
    const compound = song.meter[1] === 8 && song.meter[0] % 3 === 0;
    const unit = compound ? 1.5 : 4 / song.meter[1];          // pulsation, en noires
    const perBar = compound ? song.meter[0] / 3 : song.meter[0];
    const first = song.phrases[p].events.find((e) => !e.rest);
    const rel = Math.round(((first.t - song.pickup) / unit) * 1e6) / 1e6; // en pulsations depuis la 1re barre
    const pos = ((rel % perBar) + perBar) % perBar;           // place dans sa mesure
    const pre = Math.ceil(pos - 1e-6);                        // temps de cette mesure avant la 1re note
    let N = pre;
    while (N < 3) N += perBar;
    const full = N - pre;                                      // mesures entières avant
    const beatSec = unit * spb;
    const c0 = Sound.now() + lead;
    const clicks = Array.from({ length: N }, (_, k) => c0 + k * beatSec);
    const labels = clicks.map((_, k) => (((k - full) % perBar) + perBar) % perBar + 1);
    return { N, clicks, labels, beatSec, spb, T0: c0 + (full + pos) * beatSec };
  }

  function showCount(ci, k) {
    // d'un temps à l'autre, on change seulement la bulle allumée (pas de nouvelle apparition)
    const cin = el.hint && el.hint.classList.contains('count') ? el.hint.querySelector('.cin') : null;
    if (cin && cin.children.length === ci.N) {
      [...cin.children].forEach((b, i) => { b.classList.toggle('past', i < k); b.classList.toggle('on', i === k); });
      cin.setAttribute('aria-label', `Décompte : ${ci.labels[k]}`);
      hintSeq++;
      return;
    }
    setHint(`<span class="cin" aria-label="Décompte : ${ci.labels[k]}">${ci.labels.map((l, i) => `<b class="${i < k ? 'past' : i === k ? 'on' : ''}${l === 1 && i ? ' bar' : ''}">${l}</b>`).join('')}</span>`, 'count');
  }


  function hint2() {
    if (!G || G.level !== 2 || G.done || G.take) return;
    if (G.passed.has(G.view)) { setHint(`Phrase ${G.view + 1} déjà réussie : rejoue-la, ou choisis-en une autre.`, 'ok'); return; }
    setHint(settings.mode === 'mic' && !Ear.active() ? 'Allume le micro, puis « À toi ! »' : 'Écoute la phrase (▶), puis « À toi ! »', '');
  }

  const goLabel = () => (G && G.done ? 'Toute la comptine, en rythme !' : 'À toi, en rythme !');
  // pendant une prise, le bouton principal devient « Arrêter » (au niveau 1 : « Toute la comptine »)
  function setGoUI(on) {
    if (el.bGo) {
      el.bGo.setAttribute('aria-pressed', String(on));
      el.bGo.querySelector('.ic').innerHTML = on ? ICON.stop : ICON.metro;
      el.bGo.querySelector('.lbl').textContent = on ? 'Arrêter' : goLabel();
    } else if (el.bAll) {
      el.bAll.querySelector('.ic').innerHTML = on ? ICON.stop : ICON.play;
      el.bAll.querySelector('.lbl').textContent = on ? 'Arrêter' : 'Toute la comptine';
    }
  }

  // Exemple : le décompte, puis la phrase (au tempo choisi)
  function playDemo(p = G.view) {
    if (!G) return;
    cancelTake(true);
    const ci = countIn(p, 0.25);
    const srcs = ci.clicks.map((t, i) => Sound.clickAt(t, ci.labels[i] === 1));
    playEvents(G.song.phrases[p].events, 'p' + p, () => { if (G && G.level === 2 && !G.take) laterHint(hint2, 400); }, { at: ci.T0, srcs, ci });
  }

  /* Une prise : décompte, puis l'élève joue. Une phrase (niveau 2), ou toute
     la comptine (full) quand toutes les phrases sont réussies. */
  function startTake(opts = {}) {
    if (!G) return;
    const full = !!opts.full || G.done;
    if (!full && G.level !== 2) return;
    if (G.take) { cancelTake(); return; }
    if (!full && G.moveTo != null) moveOn(); // phrase réussie à l'instant : on part sur la suivante
    stopPlayback(true);
    if (settings.mode === 'mic' && !Ear.active()) {
      G.keepMic = full;
      startMic().then(() => { if (G && Ear.active() && !G.take) startTake(opts); });
      return;
    }
    if (!Sound.ensure()) return;
    const song = G.song;
    const p = full ? 0 : G.view;
    if (full) { G.fullRes = null; el.done.hidden = true; el.card.hidden = false; song.phrases.forEach((_, q) => clearResult(q)); showPhrase(0, false); }
    else clearResult(p);
    const ci = countIn(p);
    const idx = full ? song.notes.map((_, n) => n) : song.phrases[p].notes;
    const t0 = song.notes[idx[0]].t;
    const exp = idx.map((n) => { const nt = song.notes[n]; return { n, t: (nt.t - t0) * ci.spb, midi: nt.midi, ph: nt.phrase }; });
    const starts = song.phrases.map((ph) => (song.notes[ph.notes[0]].t - t0) * ci.spb);
    const tk = Object.assign({}, ci, {
      p, full, exp, starts, got: [], phase: 'count', k: -1, raf: 0, mic: settings.mode === 'mic',
      Tend: ci.T0 + exp[exp.length - 1].t + Math.max(0.9, 1.6 * ci.beatSec),
      srcs: ci.clicks.map((t, i) => Sound.clickAt(t, ci.labels[i] === 1)),
    });
    G.take = tk;
    el.main.classList.add('is-taking');
    setGoUI(true);
    if (tk.mic) Ear.expect(mod12(exp[0].midi + inst().off));
    const tick = () => {
      if (!G || G.take !== tk) return;
      const now = Sound.now() - Sound.outLatency();
      if (tk.phase === 'count') {
        const k = Math.floor((now - tk.clicks[0]) / tk.beatSec + 0.001);
        if (k >= 0 && k < tk.N && k !== tk.k) { tk.k = k; showCount(tk, k); retrigger(el.card, 'beat'); }
        if (now >= tk.T0 - 0.04) { tk.phase = 'play'; setHint(tk.full ? 'Toute la comptine : joue !' : 'Joue !', 'go'); }
      } else {
        if (tk.full) {
          // la carte suit la comptine : la phrase suivante paraît juste avant sa première note
          const at = now - tk.T0;
          let q = 0;
          while (q + 1 < tk.starts.length && at >= tk.starts[q + 1] - 0.5 * tk.beatSec) q++;
          if (q !== G.view) showPhrase(q, true);
        }
        const last = tk.T0 + tk.exp[tk.exp.length - 1].t;
        if (now >= tk.Tend || (tk.got.length >= tk.exp.length && now >= last + Math.max(0.45, 0.7 * tk.beatSec))) { endTake(); return; }
      }
      tk.raf = requestAnimationFrame(tick);
    };
    tk.raf = requestAnimationFrame(tick);
  }

  function recordNote(n) {
    const tk = G && G.take;
    if (!tk) return;
    const t = n.t - tk.T0;
    if (t < -0.6 * tk.beatSec) return; // joué pendant le décompte : pas compté
    tk.got.push({ t, midi: n.midi, written: n.written });
    if (tk.mic) Ear.expect(mod12(tk.exp[Math.min(tk.got.length, tk.exp.length - 1)].midi + inst().off));
  }

  function cancelTake(silent) {
    const tk = G && G.take;
    if (!tk) return;
    cancelAnimationFrame(tk.raf);
    tk.srcs.forEach((x) => { try { if (x) x.stop(); } catch (e) { /* déjà joué */ } });
    G.take = null;
    if (el.main) el.main.classList.remove('is-taking');
    setGoUI(false);
    if (tk.mic) Ear.expect(null);
    if (tk.full && G.done) { G.keepMic = false; pauseMicDone(); el.card.hidden = true; el.done.hidden = false; fitDone(); if (!silent) setHint('Comptine terminée !', 'ok'); return; }
    if (!silent) hint2();
  }

  const nextUnpassed = (p) => {
    const N = G.song.phrases.length;
    for (let k = 1; k <= N; k++) { const q = (p + k) % N; if (!G.passed.has(q)) return q; }
    return null;
  };
  // phrase réussie : on passe à la suivante (tout de suite si l'élève relance)
  function moveOn() {
    const nx = G.moveTo;
    G.moveTo = null;
    if (nx == null || G.take || G.done) return;
    showPhrase(nx);
    hint2();
  }

  const timingCls = (x) => (x.kind === 'wrong' ? 'bad' : x.timing === 'ok' ? 'ok' : x.timing.endsWith('!') ? 'far' : 'near');
  const BEAD_CLS = { missed: 'r-miss', wrong: 'r-wrong', ok: 'r-ok', near: 'r-near', far: 'r-far' };
  // résultat d'une phrase pour l'affichage : anneaux des perles, points de la bande du rythme
  function phraseResult(tk, r, q) {
    const ph = G.song.phrases[q];
    const ids = [];
    tk.exp.forEach((e, i) => { if (e.ph === q) ids.push(i); });
    if (!ids.length) return null;
    const t0 = tk.exp[ids[0]].t;
    const toExp = (j) => (tk.got[j].t - r.off) / r.k - t0; // instant joué, ramené au temps de la partition
    const beads = ids.map((i) => { const x = r.notes[i]; return x.kind === 'missed' ? 'missed' : x.kind === 'wrong' ? 'wrong' : timingCls(x); });
    const dots = [];
    ids.forEach((i) => { const x = r.notes[i]; if (x.kind !== 'missed') dots.push({ t: toExp(x.j), cls: timingCls(x) }); });
    const tEnd = tk.exp[ids[ids.length - 1]].t - t0 + G.song.notes[ph.notes[ph.notes.length - 1]].dur * tk.spb;
    r.extra.forEach((j) => { const t = toExp(j); if (t >= -0.5 * tk.beatSec && t < tEnd) dots.push({ t, cls: 'extra' }); });
    const bad = beads.some((c) => c === 'missed' || c === 'wrong' || c === 'far');
    return { exp: ids.map((i) => tk.exp[i].t - t0), lastDur: G.song.notes[ph.notes[ph.notes.length - 1]].dur * tk.spb, beads, dots, status: bad ? 'bad' : beads.every((c) => c === 'ok') ? 'ok' : 'near' };
  }

  function endTake() {
    const tk = G.take;
    if (!tk) return;
    cancelAnimationFrame(tk.raf);
    G.take = null;
    el.main.classList.remove('is-taking');
    if (tk.mic) Ear.expect(null);
    const same = tk.mic ? (e, g) => mod12(g.written) === mod12(e.midi) : (e, g) => g.midi === e.midi;
    const r = Rhythm.evaluate({ exp: tk.exp, got: tk.got, beat: tk.beatSec, same, mic: tk.mic });
    if (tk.full) { endFullTake(tk, r); return; }
    setGoUI(false);
    const ph = G.song.phrases[tk.p];
    let fresh = 0;
    r.notes.forEach((x) => { if (x.kind === 'right' && !G.found.has(tk.exp[x.i].n)) { G.found.add(tk.exp[x.i].n); fresh++; } });
    if (!r.pass && ++G.tries[tk.p] % 3 === 0) {
      // trois essais manqués : on montre une note de plus
      const hide = ph.notes.find((n) => !G.found.has(n) && !G.song.given.has(n) && !G.revealed.has(n));
      if (hide != null) G.revealed.add(hide);
    }
    ph.notes.forEach((n) => paintBead(n));
    G.results[tk.p] = phraseResult(tk, r, tk.p);
    showResult(tk.p);
    const v = Rhythm.verdict(r, (i) => `La ${i ? i + 1 + 'e' : '1re'} note`);
    setHint(v.text, v.mood);
    if (r.pass) G.passed.add(tk.p); else G.fails++;
    paintPill(tk.p);
    paintCount();
    const st = info();
    D.update(el.stage, st);
    if (r.pass) D.react(el.stage, 'phrase', st);
    else if (fresh) D.react(el.stage, 'correct', st);
    if (!r.pass) return;
    if (st.done) { later(() => { if (G && !G.take && !G.done) finish(); }, 1400); return; }
    // réussie : on enchaîne tout seul sur la phrase suivante, décompte compris,
    // sans avoir à toucher « À toi, en rythme ! » (sauf si l'élève a fait autre chose entre-temps)
    const nx = nextUnpassed(tk.p);
    G.moveTo = nx;
    later(() => { if (G && G.moveTo === nx && !G.take && !G.done && !G.playing) startTake(); }, 1300);
  }

  // toute la comptine jouée d'un coup : bilan phrase par phrase
  function endFullTake(tk, r) {
    const song = G.song;
    const status = song.phrases.map((_, q) => {
      const res = phraseResult(tk, r, q);
      G.results[q] = res;
      return res ? res.status : 'bad';
    });
    song.phrases.forEach((_, q) => showResult(q));
    const bad = status.map((st, q) => (st === 'bad' ? q + 1 : 0)).filter(Boolean);
    const which = bad.length === 1 ? 'la phrase ' + bad[0] : 'les phrases ' + bad.slice(0, -1).join(', ') + ' et ' + bad[bad.length - 1];
    let text;
    if (!r.played) text = 'Je n’ai rien entendu… Recommence après le décompte.';
    else if (r.pass && r.perfect) text = 'Toute la comptine, juste et en rythme : parfait !';
    else if (r.pass) text = bad.length ? `Bravo, toute la comptine y est ! Encore un peu de travail sur ${which}.` : `Bravo : toute la comptine en rythme ! ${r.inPlace} notes sur ${r.total} bien en place.`;
    else if (r.drift) text = `Toutes les notes y sont, mais tu as ${r.drift === 'faster' ? 'accéléré' : 'ralenti'} en route.`;
    else text = bad.length ? `Presque ! À revoir : ${which}.` : 'Presque ! Encore une fois ?';
    G.fullRes = { pass: r.pass, text, status };
    if (r.played) {
      track('bilan', {
        c: song.id, niveau: G.level, reussi: !!r.pass, parfait: !!r.perfect, justes: r.right, enPlace: r.inPlace, sur: r.total,
        phrases: status.map((st) => (st === 'ok' ? 2 : st === 'near' ? 1 : 0)), derive: r.drift || '',
      });
    }
    if (r.pass) D.react(el.stage, 'complete', info());
    G.keepMic = false;
    pauseMicDone();
    setGoUI(false);
    setHint(text, r.pass ? 'ok' : 'up');
    later(() => { if (G && G.done && !G.take) { el.card.hidden = true; showDone(); } }, 2200);
  }

  const R_CLASSES = ['r-ok', 'r-near', 'r-far', 'r-wrong', 'r-miss'];
  function clearResult(p) {
    G.song.phrases[p].notes.forEach((n) => el.beads[n].classList.remove(...R_CLASSES));
    G.results[p] = null;
    const strip = el.panels[p].querySelector('.rstrip');
    if (strip) { strip.hidden = true; strip.innerHTML = ''; }
  }

  // Résultat d'une phrase : anneau sur chaque perle + bande du rythme (tracée quand la phrase est visible)
  function showResult(p) {
    const res = G.results[p];
    if (!res) return;
    const ph = G.song.phrases[p];
    res.beads.forEach((c, i) => {
      const b = el.beads[ph.notes[i]];
      b.classList.remove(...R_CLASSES);
      b.classList.add(BEAD_CLS[c]);
    });
    const strip = el.panels[p].querySelector('.rstrip');
    const beads = el.panels[p].querySelector('.beads');
    if (!strip || !beads) return;
    const box = beads.getBoundingClientRect();
    if (!box.width) return;
    const cols = [...beads.children].map((c) => c.getBoundingClientRect());
    const xs = cols.map((c) => c.left - box.left), ws = cols.map((c) => c.width);
    const et = res.exp, n = et.length;
    // instant (s) → abscisse : chaque perle commence à l'instant de sa note
    const X = (t) => {
      let i = 0;
      while (i < n - 1 && t >= et[i + 1]) i++;
      const span = i < n - 1 ? et[i + 1] - et[i] : res.lastDur;
      const width = i < n - 1 ? xs[i + 1] - xs[i] : ws[n - 1];
      return xs[i] + ((t - et[i]) / span) * width;
    };
    const pct = (x) => `${Math.max(-1, Math.min(101, (x / box.width) * 100)).toFixed(2)}%`;
    let html = '<i class="rline"></i>' + xs.map((x) => `<i class="tk" style="left:${pct(x)}"></i>`).join('');
    res.dots.forEach((d) => { html += `<b class="dot ${d.cls}" style="left:${pct(X(d.t))}"></b>`; });
    strip.innerHTML = html;
    strip.hidden = false;
  }

  /* ---------------- fin de comptine ---------------- */
  function finish() {
    G.done = true;
    cancelTake(true);
    setGoUI(false); // niveau 2 : « À toi » devient « Toute la comptine, en rythme ! »
    pauseMicDone();
    const lv2 = G.level === 2;
    // niveau 1 : fausses notes par note ; niveau 2 : essais manqués par phrase
    const r = lv2 ? G.fails / G.song.phrases.length : G.errors / G.song.notes.length;
    const stars = lv2 ? (r <= 0.25 ? 3 : r <= 1 ? 2 : 1) : (r <= 0.2 ? 3 : r <= 0.6 ? 2 : 1);
    const key = lv2 ? G.song.id + '@2' : G.song.id;
    G.lastStars = stars;
    if (stars > (+records[key] || 0)) { records[key] = stars; save(REC_KEY, records); }
    track('fin', {
      c: G.song.id, niveau: G.level, etoiles: stars, erreurs: lv2 ? G.fails : G.errors, sur: lv2 ? G.song.phrases.length : G.song.notes.length,
      montrees: G.revealed.size, lent: !!G.usedSlow, duree: secsSince(G.t0),
    });
    G.tracked = true;
    D.update(el.stage, info());
    D.react(el.stage, 'complete', info());
    showDone();
    setHint('Comptine terminée !', 'ok');
    confetti();
    later(() => Sound.flourish(voiceNow()), 250);
    later(() => { if (G && !G.take) playAll(); }, 1500);
  }

  function showDone() {
    const song = G.song;
    const next = LIB[(LIB.indexOf(song) + 1) % LIB.length];
    const stars = G.lastStars;
    const lv2 = G.level === 2;
    const e = lv2 ? G.fails : G.errors;
    const more = `Recommence-la pour ${stars < 3 ? 'gagner plus d’étoiles' : 'faire encore mieux'}.`;
    const msg = lv2
      ? (e === 0 ? 'Chaque phrase réussie du premier coup : quel sens du rythme !' : `Avec ${e} essai${e > 1 ? 's' : ''} de plus. ${more}`)
      : (e === 0 ? 'Sans une seule erreur. Quelle oreille !' : `Avec ${e} essai${e > 1 ? 's' : ''} de trop. ${more}`);
    const fr = G.fullRes;
    const full = fr
      ? `<div class="full-res${fr.pass ? ' is-ok' : ''}"><p>${esc(fr.text)}</p><ol class="full-ph" aria-label="Phrase par phrase">${fr.status.map((st, q) => `<li class="${st}" title="Phrase ${q + 1}">${q + 1}</li>`).join('')}</ol></div>`
      : `<p class="full-ask">${lv2 ? 'Toutes les phrases sont réussies. Et maintenant, toute la comptine d’un coup, en rythme ?' : 'Et maintenant, toute la comptine d’un coup, en rythme ?'}</p>`;
    el.done.innerHTML = `
      <div class="done-head"><div class="done-stars" aria-label="${stars} étoile${stars > 1 ? 's' : ''} sur 3">${[1, 2, 3].map((k) => star(k <= stars, 38)).join('')}</div>
      <h2>${lv2 ? 'Juste et en rythme&#160;!' : 'Toutes les notes sont revenues&#160;!'}</h2></div>
      <p>${msg}</p>
      ${full}
      <div class="done-actions">
        <button class="btn-big" type="button" id="d-full"><span class="ic">${ICON.metro}</span><span>${fr ? 'Rejouer' : 'Jouer'} toute la comptine</span></button>
        ${lv2 ? '' : `<button class="btn" type="button" id="d-lv2">${ICON.metro}<span class="long">Niveau 2 : le rythme</span><span class="short">Niveau 2</span></button>`}
        <a class="btn next-link" href="#${next.id}"><span class="long">Comptine suivante</span><span class="short">Suivante</span> →</a>
        <button class="btn" type="button" id="d-again" aria-label="Recommencer" title="Recommencer">${ICON.reset}<span class="long">Recommencer</span></button>
      </div>`;
    el.card.hidden = true;
    el.done.hidden = false;
    el.main.classList.add('fin');
    el.done.querySelector('#d-full').addEventListener('click', () => startTake({ full: true }));
    el.done.querySelector('#d-again').addEventListener('click', reset);
    const lvBtn = el.done.querySelector('#d-lv2');
    if (lvBtn) lvBtn.addEventListener('click', () => setLevel(2));
    fitDone();
  }

  /* Carte de fin : si elle ne tient pas à l'écran, le xylophone (ou le micro)
     se replie le temps de la lire ; il revient dès qu'on rejoue. */
  function fitDone() {
    if (!G || !el.main) return;
    el.main.classList.remove('tight');
    if (el.done.hidden) return;
    const play = el.main.querySelector('.play');
    const over = play && play.scrollHeight > play.clientHeight + 1;
    // téléphone : on garde aussi de la place au décor, qui fête la fin de la comptine
    const squeezed = NARROW.matches && el.stage.getBoundingClientRect().height < 200;
    if (over || squeezed) el.main.classList.add('tight');
  }

  function reset() {
    stopAll();
    renderSong(G.song);
  }

  function confetti() {
    if (RM.matches) return;
    const cols = ['--n-do', '--n-re', '--n-mi', '--n-fa', '--n-sol', '--n-la', '--n-si'];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = `var(${cols[i % cols.length]})`;
      c.style.setProperty('--dx', (Math.random() * 160 - 80).toFixed(0) + 'px');
      c.style.setProperty('--rot', (Math.random() * 900 - 450).toFixed(0) + 'deg');
      c.style.setProperty('--t', (2 + Math.random() * 1.6).toFixed(2) + 's');
      c.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4400);
    }
  }

  /* ---------------- micro ---------------- */
  let micBusy = false;
  // micWanted : l'élève a allumé le micro ; on le coupe quand la comptine est finie
  // (ou quand on quitte la page) et on le rallume dès qu'il doit rejouer
  let micWanted = false;
  function pauseMicDone() {
    if (!Ear.active()) return;
    Ear.stop();
    showEar(false, '<p>Micro coupé : la comptine est finie. Il se rallumera tout seul quand tu rejoueras.</p>');
  }
  function applyMode(userAction) {
    const mic = settings.mode === 'mic';
    el.main.dataset.mode = settings.mode;
    app.querySelectorAll('.seg-mode [role="radio"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === settings.mode)));
    el.ear.hidden = !mic;
    if (!mic) {
      if (Ear.active()) Ear.stop();
      if (G.take && G.take.mic) cancelTake(true);
      cursorHint();
      return;
    }
    if (G.take && !G.take.mic) cancelTake(true);
    if (Ear.active() || (micWanted && !G.done && !micBlocked())) { startMic(); return; }
    if (micBlocked()) showEar(false, micMsgHtml('denied'), true); else showEar(false);
    if (userAction) cursorHint();
  }

  // dans un cadre qui n'a pas le droit au micro (claude.ai), on prévient tout de suite
  function micBlocked() {
    try {
      const pol = document.permissionsPolicy || document.featurePolicy;
      return !!(framed && pol && pol.allowsFeature && !pol.allowsFeature('microphone'));
    } catch (e) { return false; }
  }
  function micMsgHtml(code) {
    // dans claude.ai : un message court, avec le lien vers la version en ligne
    const text = code === 'denied' && framed
      ? (ONLINE_URL
        ? `Ici, dans claude.ai, le micro n’est pas disponible. Pour jouer avec ton instrument, ouvre la <a href="${esc(ONLINE_URL)}" target="_blank" rel="noopener">version en ligne</a>.`
        : 'Ici, dans claude.ai, le micro n’est pas disponible. Ouvre la page en dehors de claude.ai pour jouer avec ton instrument.')
      : MIC_MSG[code] || MIC_MSG.other;
    return `<p>${text}</p><button class="mini" type="button" data-act="xylo">Jouer au xylophone</button>`;
  }

  // blocked : le micro ne pourra pas marcher ici, inutile de proposer de l'allumer
  function showEar(on, msgHtml, blocked) {
    el.earOn.hidden = !on;
    el.earOff.hidden = on;
    el.earOff.classList.toggle('is-blocked', !on && !!blocked);
    el.earMsg.hidden = !msgHtml;
    el.earMsg.innerHTML = msgHtml || '';
    if (on) el.instChip.textContent = inst().voice ? inst().name : 'en do';
  }
  const FATAL = (code) => (code === 'denied' && framed) || code === 'unsupported' || code === 'noaudio';

  const MIC_MSG = {
    denied: 'Le micro a été refusé. Autorise-le pour cette page dans les réglages du navigateur, puis réessaie.',
    nomic: 'Aucun micro n’a été trouvé sur cet appareil.',
    busy: 'Le micro est déjà utilisé par une autre application. Ferme-la, puis réessaie.',
    unsupported: 'Ce navigateur ne permet pas d’utiliser le micro ici. Il faut ouvrir la page à une adresse en https.',
    noaudio: 'Le son n’est pas disponible dans ce navigateur.',
    other: 'Le micro n’a pas pu démarrer. Réessaie.',
    ended: 'Le micro s’est arrêté. Touche « Allumer le micro » pour reprendre.',
    paused: 'Micro en pause. Touche « Allumer le micro » pour reprendre.',
  };

  async function startMic() {
    if (micBusy) return;
    micBusy = true;
    try {
      await Ear.start({ onNote: heardNote, onFrame: heardFrame, onEnded: () => { if (el.ear) showEar(false, MIC_MSG.ended); } });
      micWanted = true;
      if (G && G.done && !G.keepMic) { pauseMicDone(); return; }
      if (settings.mode === 'mic' && el.ear && document.contains(el.ear)) { showEar(true); expectNext(); cursorHint(); }
    } catch (e) {
      const code = (e && e.code) || 'other';
      if (!micErrs.has(code)) { micErrs.add(code); track('micro', { code }); }
      showEar(false, micMsgHtml(code), FATAL(code));
    } finally {
      micBusy = false;
    }
  }

  function heardFrame(fr) {
    if (!el.heard || !document.contains(el.heard)) return;
    el.heard.style.setProperty('--lvl', fr.level.toFixed(2));
    if (fr.gated) {
      el.heard.classList.add('is-wait');
      el.earCap.textContent = 'La page joue… écoute bien.';
      return;
    }
    el.heard.classList.remove('is-wait');
    if (fr.note == null) {
      el.heardN.textContent = '…';
      delete el.heard.dataset.l;
      el.earCap.textContent = 'J’écoute…';
      el.needle.style.setProperty('--c', '0');
      el.needle.classList.add('off');
      return;
    }
    const written = fr.note - inst().off;
    const pc = mod12(written), L = PC_LETTER[pc];
    el.heardN.textContent = PC_FR[pc];
    if (L) el.heard.dataset.l = L; else delete el.heard.dataset.l;
    el.earCap.textContent = `J’entends ${PC_FR[pc]}`;
    el.needle.classList.remove('off');
    el.needle.style.setProperty('--c', Math.max(-50, Math.min(50, fr.cents)).toFixed(1));
  }

  /* ---------------- événements ---------------- */
  function bindSong() {
    if (el.bAll) el.bAll.addEventListener('click', () => { if (G.take) { cancelTake(); return; } toggle('all', playAll)(); });
    if (el.bTo) el.bTo.addEventListener('click', toggle('to', playToMystery));
    if (el.bGo) el.bGo.addEventListener('click', () => startTake());
    el.bSlow.addEventListener('click', () => {
      G.slow = !G.slow;
      if (G.slow) G.usedSlow = true;
      el.bSlow.setAttribute('aria-pressed', String(G.slow));
    });
    app.querySelector('#b-reset').addEventListener('click', reset);
    el.pills.forEach((pill, p) => pill.addEventListener('click', () => {
      if (G.level === 2) {
        if (G.take) return;
        G.moveTo = null;
        stopPlayback(true);
        showPhrase(p);
        hint2();
        return;
      }
      const ph = G.song.phrases[p];
      const n = ph.notes.find((m) => !G.found.has(m));
      if (n != null && !G.done) setCursor(n); else showPhrase(p);
    }));
    el.panels.forEach((panel, p) => {
      panel.querySelector('.ph-play').addEventListener('click', toggle('p' + p, () => (G.level === 2 && !G.done ? playDemo(p) : playPhrase(p))));
      panel.querySelector('.ph-body').addEventListener('click', (e) => {
        const b = e.target.closest('.bead');
        if (!b) return;
        const n = +b.dataset.n;
        if (G.found.has(n)) { Sound.tap(voiceNow(), G.song.notes[n].midi, 0.5); retrigger(b, 'pop'); return; }
        if (G.level === 2) {
          if (G.song.given.has(n) || G.revealed.has(n)) { Sound.tap(voiceNow(), G.song.notes[n].midi, 0.5); retrigger(b, 'pop'); }
          return;
        }
        if (!G.done) setCursor(n);
      });
    });
    let fromPointer = false;
    el.keys.forEach((k, i) => {
      k.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        fromPointer = true;
        pressKey(i);
      });
      k.addEventListener('click', () => {
        if (fromPointer) { fromPointer = false; return; }
        pressKey(i);
      });
    });
    app.querySelectorAll('.seg-level [role="radio"]').forEach((b) => b.addEventListener('click', () => {
      if (+b.dataset.level !== G.level) setLevel(+b.dataset.level);
    }));
    app.querySelectorAll('.seg-mode [role="radio"]').forEach((b) => b.addEventListener('click', () => {
      if (settings.mode === b.dataset.mode) return;
      settings.mode = b.dataset.mode;
      save(SET_KEY, settings);
      applyMode(true);
      fitDone();
    }));
    app.querySelector('#mic-on').addEventListener('click', startMic);
    app.querySelector('#mic-off').addEventListener('click', () => { micWanted = false; Ear.stop(); showEar(false); });
    el.instSel.addEventListener('change', () => setInst(el.instSel.value));
    el.instChip.addEventListener('click', () => { try { el.instSel.showPicker(); } catch (e) { el.instSel.focus(); } });
    el.earMsg.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="xylo"]')) { settings.mode = 'xylo'; save(SET_KEY, settings); applyMode(true); }
    });
    if (FINE.matches) {
      let raf = 0;
      el.stage.addEventListener('pointermove', (e) => {
        const r = el.stage.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * 2 - 1, my = ((e.clientY - r.top) / r.height) * 2 - 1;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { el.stage.style.setProperty('--mx2', mx.toFixed(3)); el.stage.style.setProperty('--my2', my.toFixed(3)); });
      });
      el.stage.addEventListener('pointerleave', () => { el.stage.style.setProperty('--mx2', 0); el.stage.style.setProperty('--my2', 0); });
    }
  }

  document.addEventListener('keydown', (e) => {
    if (view !== 'song' || !G || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('select, input')) return;
    const i = KEY_CODES.indexOf(e.code);
    if (i >= 0 && i < G.keys.length) {
      if (e.repeat) return;
      e.preventDefault();
      pressKey(i);
      return;
    }
    if (e.code === 'Space' && !(e.target.closest && e.target.closest('button, a'))) {
      e.preventDefault();
      if (G.level === 2) startTake(); else if (G.take) cancelTake(); else toggle('all', playAll)();
    }
  });

  let fitRaf = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => { if (view === 'song' && G && el.done && document.contains(el.done)) fitDone(); });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G && G.take) cancelTake();
    if (document.hidden && Ear.active()) {
      Ear.stop();
      if (el.ear && document.contains(el.ear)) showEar(false, `<p>${MIC_MSG.paused}</p>`);
    }
    // retour sur la page : le micro reprend si l'élève l'avait allumé
    if (!document.hidden && micWanted && view === 'song' && G && !G.done && settings.mode === 'mic' && el.ear && document.contains(el.ear)) startMic();
  });

  if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
    navigator.keyboard.getLayoutMap().then((m) => {
      const h = KEY_CODES.map((c) => (m.get(c) || '').toUpperCase());
      if (h.slice(0, 9).every(Boolean)) keyLabels = h;
    }).catch(() => { /* carte du clavier indisponible */ });
  }

  /* ---------------- navigation ---------------- */
  let lastPointer = null;
  const unlock = () => Sound.ensure();
  document.addEventListener('pointerdown', (e) => { lastPointer = [e.clientX, e.clientY]; unlock(); }, true);
  document.addEventListener('touchend', unlock, true);
  document.addEventListener('click', unlock, true);
  document.addEventListener('keydown', unlock, true);

  function route(animate) {
    const id = decodeURIComponent(location.hash.replace(/^#/, ''));
    const song = BY_ID[id] || null;
    const render = () => {
      stopAll();
      if (song) renderSong(song); else renderHome();
      window.scrollTo(0, 0);
    };
    if (!animate || RM.matches || !iris.animate) { render(); return; }
    const [x, y] = lastPointer || [window.innerWidth / 2, window.innerHeight / 2];
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 30;
    iris.style.setProperty('--iris', song ? decorFor(song.theme).color(song.theme) : (window.HomeSkin && window.HomeSkin.color) || HOME_COLOR);
    iris.hidden = false;
    const a = iris.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)` }],
      { duration: 430, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' });
    a.onfinish = () => {
      render();
      const b = iris.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' });
      b.onfinish = () => { iris.hidden = true; a.cancel(); b.cancel(); };
    };
  }

  window.addEventListener('hashchange', () => route(true));
  // page fermée (ou quittée) au milieu d'une comptine
  window.addEventListener('pagehide', () => { if (view === 'song') trackLeave('fermeture'); });

  track('visite', { niveau: settings.level, ecran: Suivi.device(), etoiles: Object.assign({}, records) });
  const start = () => route(false);
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
    try { window.claude.hot.snapshot(() => ({ hash: location.hash })); } catch (e) { /* facultatif */ }
  }
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
  else start(window.claude && window.claude.hot ? window.claude.hot.data : {});
})();
