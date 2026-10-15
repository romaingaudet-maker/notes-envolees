/* ------------------------------------------------------------------
   Les Notes Envolées — navigation, accueil, jeu
------------------------------------------------------------------- */
(() => {
  'use strict';

  const app = document.getElementById('app');
  const iris = document.getElementById('iris');
  const LIB = SONGS.map(buildSong).sort((a, b) => a.level - b.level);
  const BY_ID = Object.fromEntries(LIB.map((s) => [s.id, s]));
  /* Adresse de la version en ligne, où le micro est autorisé (vide si aucune) */
  const ONLINE_URL = 'https://romaingaudet-maker.github.io/notes-envolees/';
  const KEY_CODES = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'];
  let keyLabels = ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'Ù'];
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)');
  const HOME_COLOR = '#F6C744';
  const nb = (t) => t.replace(/_/g, ' ');
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const LEVEL = (l) => (l <= 6 ? 'facile' : l <= 14 ? 'moyen' : 'difficile');
  const titleHtml = (t) => esc(nb(t)).split(' ').map((w) => (w.includes('-') ? `<span class="nw">${w}</span>` : w)).join(' ');
  const mod12 = (n) => ((n % 12) + 12) % 12;
  let framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }

  /* Familles d'instruments : `off` = son réel moins note écrite (demi-tons),
     `play` = transposition de la musique de la page, même nom de note. */
  const INSTS = {
    C: { off: 0, play: 0, short: 'en do', label: 'Instrument en do', ex: 'piano, flûte à bec, flûte, violon, guitare, xylophone, voix, trombone' },
    Bb: { off: -2, play: -2, short: 'en si♭', label: 'Instrument en si♭', ex: 'clarinette, trompette, cornet, saxophone soprano ou ténor' },
    Eb: { off: -9, play: 3, short: 'en mi♭', label: 'Instrument en mi♭', ex: 'saxophone alto ou baryton' },
    F: { off: -7, play: 5, short: 'en fa', label: 'Instrument en fa', ex: 'cor' },
  };

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
    xylo: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="3.4" height="16" rx="1.4" fill="currentColor"/><rect x="7.6" y="5.5" width="3.4" height="13" rx="1.4" fill="currentColor"/><rect x="12.2" y="7" width="3.4" height="10" rx="1.4" fill="currentColor"/><rect x="16.8" y="8.5" width="3.4" height="7" rx="1.4" fill="currentColor"/></svg>',
  };
  const star = (on, size = 24) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z" fill="${on ? '#F5C32C' : 'none'}" stroke="${on ? '#C8901A' : 'currentColor'}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const chip = (letter, name) => `<span class="nchip" data-l="${letter}">${name}</span>`;

  /* ---------------- réglages et étoiles (sur cet appareil) ---------------- */
  const SET_KEY = 'notes-envolees-reglages', REC_KEY = 'notes-envolees-etoiles';
  function load(k, dflt) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? Object.assign(dflt, v) : dflt; } catch (e) { return dflt; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  const settings = load(SET_KEY, { mode: 'xylo', inst: 'C' });
  if (!INSTS[settings.inst]) settings.inst = 'C';
  if (settings.mode !== 'mic') settings.mode = 'xylo';
  const records = load(REC_KEY, {});
  const inst = () => INSTS[settings.inst];
  function setInst(k) {
    if (!INSTS[k]) return;
    settings.inst = k;
    save(SET_KEY, settings);
    Sound.setTranspose(inst().play);
    if (G) expectNext();
  }
  Sound.setTranspose(inst().play);

  let view = 'home';
  let G = null; // partie en cours
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  function stopAll() {
    if (G) stopPlayback(true);
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
    view = 'home';
    G = null;
    if (Ear.active()) Ear.stop();
    setWorld(null);
    const medals = LIB.map((s, i) => {
      const best = +records[s.id] || 0;
      const badge = best ? `<span class="medal-badge" aria-label="Record : ${best} étoile${best > 1 ? 's' : ''}">${[1, 2, 3].map((k) => star(k <= best, 15)).join('')}</span>` : '';
      return `<li class="medal${best ? ' is-won' : ''}" data-i="${i}"><a class="medal-link" href="#${s.id}" style="--off:${OFFSETS[i % OFFSETS.length]}px">
        <span class="medal-disc" style="--c:${Scenes.W[s.theme].color}">${Scenes.emblem(s.theme)}
          <svg class="medal-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="46"/></svg>
          <span class="medal-num" aria-hidden="true">${s.level}</span>${badge}
        </span>
        <span class="medal-title">${titleHtml(s.title)}</span>
        <span class="medal-meta">${LEVEL(s.level)} · ${s.notes.length} notes</span>
      </a></li>`;
    }).join('');
    const chips = [['C', 'Do'], ['D', 'Ré'], ['E', 'Mi'], ['F', 'Fa'], ['G', 'Sol'], ['A', 'La'], ['B', 'Si']]
      .map(([l, n]) => `<span class="chip" data-l="${l}">${n}</span>`).join('');
    const instOpts = Object.entries(INSTS).map(([k, v]) => `
      <label class="inst-opt"><input type="radio" name="home-inst" id="home-inst-${k}" value="${k}"${settings.inst === k ? ' checked' : ''}>
        <span class="inst-card"><b>${v.label}</b><small>${v.ex}</small></span></label>`).join('');
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
          </ol>
          <div class="side-cards">
            <fieldset class="legend inst-set">
              <legend>Ton instrument</legend>
              <p>Les noms de notes sont ceux de ta partition. La musique de la page est jouée dans le ton de ton instrument.</p>
              <div class="inst-opts">${instOpts}</div>
              ${micNote}
            </fieldset>
            <div class="legend">
              <h3>Le code couleur des notes</h3>
              <p>Toutes les comptines sont en do majeur : pas de dièse, pas de bémol. Les notes graves portent un point dessous, les aiguës un point dessus.</p>
              <div class="chips">${chips}</div>
            </div>
          </div>
        </section>
        <p class="home-foot">Chaque visite d’une comptine repart de zéro ; seul ton meilleur nombre d’étoiles reste sur cet appareil. Sur ordinateur, les touches ${keyLabels.slice(0, 9).join(' ')} jouent les lames, la barre d’espace lance l’écoute. Comptines traditionnelles du domaine public.</p>
      </div>
    </main>`;
    app.querySelectorAll('input[name="home-inst"]').forEach((r) => r.addEventListener('change', () => setInst(r.value)));
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
    view = 'song';
    setWorld(song.theme);
    const keepSlow = G && G.slow;
    G = { song, found: new Set(), revealed: new Set(), errors: 0, attempts: 0, cursor: null, view: 0, slow: !!keepSlow, playing: null, done: false, keys: keysFor(song), lastStars: 0 };
    const idx = LIB.indexOf(song);
    const next = LIB[(idx + 1) % LIB.length];
    const span = song.maxStep - song.minStep;
    const panels = song.phrases.map((ph, p) => `
      <div class="panel" data-p="${p}"${p ? ' hidden' : ''}>
        <button class="ph-play" type="button" data-p="${p}" aria-label="Écouter la phrase ${p + 1}">${ICON.play}</button>
        <div class="ph-body">
          <p class="ph-lyric">${ph.notes.map((n) => `<span class="syl" data-n="${n}">${esc(song.notes[n].syl)}</span>`).join('')}</p>
          <div class="beads" style="--span:${span};--cols:${ph.notes.map((n) => `${wOf(song.notes[n].dur)}fr`).join(' ')}">${ph.notes.map((n) => `<span class="bc"><button class="bead" type="button" data-n="${n}"><span>?</span></button></span>`).join('')}</div>
        </div>
      </div>`).join('');
    const pills = song.phrases.map((ph, p) => `<li><button class="pill" type="button" data-p="${p}" aria-label="Phrase ${p + 1}">${p + 1}</button></li>`).join('');
    const keys = G.keys.map((k, i) => `<button class="key" type="button" data-i="${i}" data-l="${k.letter}" style="--k:${(1 - i * 0.042).toFixed(3)}" aria-label="${k.fr}${k.octave === 3 ? ' grave' : k.octave === 5 ? ' aigu' : ''}"><span class="kn${k.octave === 3 ? ' low' : k.octave === 5 ? ' high' : ''}">${k.fr}</span><span class="kk" aria-hidden="true">${keyLabels[i] || ''}</span></button>`).join('');
    const instOpts = Object.entries(INSTS).map(([k, v]) => `<option value="${k}"${settings.inst === k ? ' selected' : ''}>${v.short.charAt(0).toUpperCase() + v.short.slice(1)} — ${v.ex}</option>`).join('');
    app.innerHTML = `
    <main class="song" data-mode="${settings.mode}">
      <section class="stage grain" aria-label="Décor : ${esc(nb(song.title))}">
        ${Scenes.svgFor(song, info())}
        <a class="back" href="#">${ICON.back}<span>Les comptines</span></a>
        <a class="next-song" href="#${next.id}" aria-label="Comptine suivante : ${esc(nb(next.title))}">${ICON.next}</a>
        <div class="stage-title" aria-hidden="true"><span>Comptine ${song.level} · ${LEVEL(song.level)}</span><b>${titleHtml(song.title)}</b></div>
      </section>
      <section class="play">
        <header class="play-head">
          <p class="kicker">Comptine ${song.level} sur ${LIB.length} · ${LEVEL(song.level)}</p>
          <h1>${titleHtml(song.title)}</h1>
          <p class="instr">En do majeur, jouée ${esc(song.instrument)}.</p>
        </header>
        <div class="listen">
          <button class="btn-big" id="b-all" type="button"><span class="ic">${ICON.play}</span><span class="lbl">Toute la comptine</span></button>
          <button class="btn" id="b-to" type="button"><span class="q" aria-hidden="true">?</span><span class="lbl">Jusqu’à la note</span></button>
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
            <p class="ear-text">La page écoute ton instrument avec le micro et te dit si la note est juste.</p>
            <div class="ear-row">
              <label class="inst-pick" for="inst-sel"><span>Ton instrument</span><select id="inst-sel">${instOpts}</select></label>
              <button class="btn-big" id="mic-on" type="button"><span class="ic">${ICON.mic}</span><span>Allumer le micro</span></button>
            </div>
            <div class="ear-msg" id="ear-msg" hidden></div>
          </div>
          <div class="ear-on" id="ear-on" hidden>
            <div class="heard" id="heard"><span class="heard-n" id="heard-n">…</span></div>
            <div class="ear-mid">
              <p class="ear-cap" id="ear-cap">J’écoute…</p>
              <div class="tuner" aria-hidden="true"><i class="tz"></i><b class="needle" id="needle"></b><span class="t-lo">bas</span><span class="t-mid">juste</span><span class="t-hi">haut</span></div>
            </div>
            <div class="ear-side">
              <button class="mini" id="inst-chip" type="button" title="Changer d’instrument">${inst().short}</button>
              <button class="mini" id="mic-off" type="button" aria-label="Couper le micro">Couper<span class="lbl-l"> le micro</span></button>
            </div>
          </div>
        </div>
        <div class="seg" role="radiogroup" aria-label="Jouer avec">
          <button type="button" role="radio" data-mode="xylo" aria-checked="${settings.mode === 'xylo'}">${ICON.xylo}<span>Xylophone</span></button>
          <button type="button" role="radio" data-mode="mic" aria-checked="${settings.mode === 'mic'}">${ICON.mic}<span>Mon instrument</span></button>
        </div>
      </section>
    </main>`;

    el = {
      main: app.querySelector('.song'),
      stage: app.querySelector('.stage'),
      bAll: app.querySelector('#b-all'),
      bTo: app.querySelector('#b-to'),
      bSlow: app.querySelector('#b-slow'),
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
    Scenes.update(el.stage, info());
    bindSong();
    setCursor(0);
    applyMode(false);
  }

  function info() {
    const song = G.song, total = song.notes.length, found = G.found.size;
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
    pill.classList.toggle('is-done', f === ph.notes.length);
    pill.classList.toggle('is-view', p === G.view);
    pill.setAttribute('aria-current', p === G.view ? 'step' : 'false');
  }

  function paintCount() {
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
    if (!animate || RM.matches || !to.animate) { from.hidden = true; to.hidden = false; return; }
    from.hidden = true;
    to.hidden = false;
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
    el.bTo.disabled = n == null;
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
    Sound.tap(G.song.voice, key.midi, 0.6);
    k.classList.add('is-down');
    later(() => k.classList.remove('is-down'), 130);
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
    if (!G || G.done || G.cursor == null || settings.mode !== 'mic') return;
    if (G.playing) return;
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
    Scenes.update(el.stage, st);
    Scenes.react(el.stage, phraseDone ? 'phrase' : 'correct', st);
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
  function playEvents(evs, kind, onEnd) {
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
    const h = Sound.sequence(G.song.voice, items);
    if (!h) return;
    const P = { h, items, kind, t0: h.t0, end: h.t0 + total, cur: -1, raf: 0, onEnd, home: G.view };
    G.playing = P;
    setPlayingUI(kind, true);
    const tick = () => {
      if (!G || G.playing !== P) return;
      const now = Sound.now();
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
    if (fade) P.h.stop();
    G.playing = null;
    setPlayingUI(P.kind, false);
    if (P.onEnd) P.onEnd();
    // revenir à la phrase où l'on joue
    if (G && G.cursor != null && !G.pending) showPhrase(G.song.notes[G.cursor].phrase, true);
  }

  function highlight(n, on) {
    el.beads[n].classList.toggle('is-on', on);
    el.syls[n].classList.toggle('is-on', on);
  }

  function setPlayingUI(kind, on) {
    el.main.classList.toggle('is-playing', on);
    if (kind === 'all') {
      el.bAll.querySelector('.ic').innerHTML = on ? ICON.stop : ICON.play;
      el.bAll.querySelector('.lbl').textContent = on ? 'Arrêter' : 'Toute la comptine';
    } else if (kind === 'to') {
      el.bTo.querySelector('.lbl').textContent = on ? 'Arrêter' : 'Jusqu’à la note';
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

  /* ---------------- fin de comptine ---------------- */
  function finish() {
    G.done = true;
    const r = G.errors / G.song.notes.length;
    const stars = r <= 0.2 ? 3 : r <= 0.6 ? 2 : 1;
    G.lastStars = stars;
    if (stars > (+records[G.song.id] || 0)) { records[G.song.id] = stars; save(REC_KEY, records); }
    Scenes.update(el.stage, info());
    Scenes.react(el.stage, 'complete', info());
    showDone();
    setHint('Comptine terminée !', 'ok');
    confetti();
    later(() => Sound.flourish(G.song.voice), 250);
    later(() => playAll(), 1500);
  }

  function showDone() {
    const song = G.song;
    const next = LIB[(LIB.indexOf(song) + 1) % LIB.length];
    const stars = G.lastStars;
    const e = G.errors;
    const msg = e === 0 ? 'Sans une seule erreur. Quelle oreille !' : `Avec ${e} essai${e > 1 ? 's' : ''} de trop. Rejoue-la pour ${stars < 3 ? 'gagner plus d’étoiles' : 'faire encore mieux'}.`;
    el.done.innerHTML = `
      <div class="done-stars" aria-label="${stars} étoile${stars > 1 ? 's' : ''} sur 3">${[1, 2, 3].map((k) => star(k <= stars, 38)).join('')}</div>
      <h2>Toutes les notes sont revenues&#160;!</h2>
      <p>${msg}</p>
      <div class="done-actions">
        <button class="btn-big" type="button" id="d-play"><span class="ic">${ICON.play}</span><span>Réécouter</span></button>
        <a class="btn next-link" href="#${next.id}">Comptine suivante →</a>
        <button class="btn" type="button" id="d-again">Rejouer</button>
      </div>`;
    el.card.hidden = true;
    el.done.hidden = false;
    el.done.querySelector('#d-play').addEventListener('click', toggle('all', playAll));
    el.done.querySelector('#d-again').addEventListener('click', reset);
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
  function applyMode(userAction) {
    const mic = settings.mode === 'mic';
    el.main.dataset.mode = settings.mode;
    app.querySelectorAll('.seg [role="radio"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === settings.mode)));
    el.ear.hidden = !mic;
    if (!mic) {
      if (Ear.active()) Ear.stop();
      cursorHint();
      return;
    }
    if (Ear.active()) { startMic(); return; }
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
    const link = code === 'denied' && framed && ONLINE_URL ? ` <a href="${esc(ONLINE_URL)}" target="_blank" rel="noopener">Ouvrir la version en ligne</a>` : '';
    return `<p>${MIC_MSG[code] || MIC_MSG.other}${link}</p><button class="mini" type="button" data-act="xylo">Jouer au xylophone</button>`;
  }

  // blocked : le micro ne pourra pas marcher ici, inutile de proposer de l'allumer
  function showEar(on, msgHtml, blocked) {
    el.earOn.hidden = !on;
    el.earOff.hidden = on;
    el.earOff.classList.toggle('is-blocked', !on && !!blocked);
    el.earMsg.hidden = !msgHtml;
    el.earMsg.innerHTML = msgHtml || '';
    if (on) el.instChip.textContent = inst().short;
  }
  const FATAL = (code) => (code === 'denied' && framed) || code === 'unsupported' || code === 'noaudio';

  const MIC_MSG = {
    denied: framed
      ? 'Dans cette fenêtre, le navigateur ne laisse pas la page utiliser le micro. Ouvre la page en dehors de claude.ai (version en ligne ou fichier) pour jouer avec ton instrument.'
      : 'Le micro a été refusé. Autorise-le pour cette page dans les réglages du navigateur, puis réessaie.',
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
      if (settings.mode === 'mic' && el.ear && document.contains(el.ear)) { showEar(true); expectNext(); cursorHint(); }
    } catch (e) {
      const code = (e && e.code) || 'other';
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
    el.bAll.addEventListener('click', toggle('all', playAll));
    el.bTo.addEventListener('click', toggle('to', playToMystery));
    el.bSlow.addEventListener('click', () => {
      G.slow = !G.slow;
      el.bSlow.setAttribute('aria-pressed', String(G.slow));
    });
    app.querySelector('#b-reset').addEventListener('click', reset);
    el.pills.forEach((pill, p) => pill.addEventListener('click', () => {
      const ph = G.song.phrases[p];
      const n = ph.notes.find((m) => !G.found.has(m));
      if (n != null && !G.done) setCursor(n); else showPhrase(p);
    }));
    el.panels.forEach((panel, p) => {
      panel.querySelector('.ph-play').addEventListener('click', toggle('p' + p, () => playPhrase(p)));
      panel.querySelector('.ph-body').addEventListener('click', (e) => {
        const b = e.target.closest('.bead');
        if (!b) return;
        const n = +b.dataset.n;
        if (G.found.has(n)) { Sound.tap(G.song.voice, G.song.notes[n].midi, 0.5); retrigger(b, 'pop'); return; }
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
    app.querySelectorAll('.seg [role="radio"]').forEach((b) => b.addEventListener('click', () => {
      if (settings.mode === b.dataset.mode) return;
      settings.mode = b.dataset.mode;
      save(SET_KEY, settings);
      applyMode(true);
    }));
    app.querySelector('#mic-on').addEventListener('click', startMic);
    app.querySelector('#mic-off').addEventListener('click', () => { Ear.stop(); showEar(false); });
    el.instSel.addEventListener('change', () => setInst(el.instSel.value));
    el.instChip.addEventListener('click', () => { Ear.stop(); showEar(false); el.instSel.focus(); });
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
      toggle('all', playAll)();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && Ear.active()) {
      Ear.stop();
      if (el.ear && document.contains(el.ear)) showEar(false, `<p>${MIC_MSG.paused}</p>`);
    }
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
    iris.style.setProperty('--iris', song ? Scenes.W[song.theme].color : HOME_COLOR);
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

  const start = () => route(false);
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
    try { window.claude.hot.snapshot(() => ({ hash: location.hash })); } catch (e) { /* facultatif */ }
  }
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
  else start(window.claude && window.claude.hot ? window.claude.hot.data : {});
})();
